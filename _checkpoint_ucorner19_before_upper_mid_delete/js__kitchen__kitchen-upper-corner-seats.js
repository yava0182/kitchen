/**
 * MID upper corner — два посадочных места одной Г-ячейки 600×600.
 *
 * A = ВМУ на upper-host (существующий kitchen_wall_corner / upperCornerCell).
 * B = НШ1 на upper-other: старт = depth(ВМУ) + POST, W каталога вдоль стены.
 *
 * Локальная модель seatId; не меняет глобальный zoneIndex обычных модулей.
 * Ghost и place обязаны вызывать один и тот же resolveKitchenUpperCornerSeatTarget.
 */

import { state } from '../utils/state.js';
import { computeSectionInnerBoundsU } from '../sections/section-edge-trim-insets.js';
import {
  KITCHEN_UPPER_CORNER_CELL_WIDTH_MM,
  KITCHEN_UPPER_CORNER_POST_MM,
  resolveKitchenUpperCornerDepthMm,
} from './kitchen-joint.js?v=20261107-ucorner19';
import { buildKitchenBandCellLayoutForSection } from './kitchen-section-layout.js?v=20261107-ucorner19';

export const KITCHEN_UPPER_CORNER_SEAT_A = 'A';
export const KITCHEN_UPPER_CORNER_SEAT_B = 'B';

const CELL_MIN = 300;
const CELL_MAX = 1200;

function _normWall(w) {
  return String(w || '')
    .trim()
    .toLowerCase();
}

function _clampW(mm) {
  const w = Math.round(Number(mm) || 600) || 600;
  return Math.max(CELL_MIN, Math.min(CELL_MAX, w));
}

/**
 * Старт B вдоль upper-other: depth + POST.
 * 350+40→390; 300+40→340.
 */
export function resolveUpperCornerSeatBStartMm(depthMm, postMmOpt) {
  const d = Math.round(Number(depthMm) || 0);
  const post = Math.max(
    0,
    Math.round(Number(postMmOpt) || Number(KITCHEN_UPPER_CORNER_POST_MM) || 40)
  );
  if (!(d >= 200 && d <= 700)) return null;
  return d + post;
}

/**
 * Найти joint + роль секции относительно upper-host.
 * @returns {{ joint, isUpperHost: boolean, isUpperOther: boolean } | null}
 */
export function resolveUpperCornerJointForSection(sectionData) {
  if (!sectionData?.id) return null;
  const sid = String(sectionData.id);
  const joints =
    state?.kitchenJoints && typeof state.kitchenJoints === 'object'
      ? state.kitchenJoints
      : null;
  if (!joints) return null;
  for (const joint of Object.values(joints)) {
    if (!joint) continue;
    if (
      sid !== String(joint.sectionAId) &&
      sid !== String(joint.sectionBId)
    ) {
      continue;
    }
    // Нужна геометрия угла (seatKitchenJointUpperCorner). Без неё B некуда сажать.
    if (!joint.upperCornerCell && !joint.upperCornerCellId) continue;
    const upperHostId = String(
      joint.upperHostSectionId ||
        (joint.upperHostSide === 'B' ? joint.sectionBId : joint.sectionAId)
    );
    return {
      joint,
      isUpperHost: sid === upperHostId,
      isUpperOther: sid !== upperHostId,
    };
  }
  return null;
}

function _seatAtStartOnOther(sectionData, joint) {
  const lr = sectionData._kitchenJointReserves?.[joint.jointId];
  if (lr && typeof lr.atStart === 'boolean') return lr.atStart === true;
  const wall = _normWall(sectionData.wallName || sectionData.division?.wallName);
  const sid = String(sectionData.id);
  const otherWall =
    sid === String(joint.sectionAId) ? joint.wallB : joint.wallA;
  if (wall === 'back') return otherWall === 'left';
  if (wall === 'front') return otherWall === 'right';
  if (wall === 'left') return otherWall === 'back';
  if (wall === 'right') return otherWall === 'back';
  return true;
}

function _cornerGeom(joint) {
  const cc = joint.upperCornerCell || {};
  const cornerW = Math.round(
    Number(cc.widthMm) || KITCHEN_UPPER_CORNER_CELL_WIDTH_MM || 600
  );
  let depthMm = Math.round(Number(cc.depthMm) || 0);
  if (!(depthMm >= 200 && depthMm <= 700)) {
    try {
      depthMm = resolveKitchenUpperCornerDepthMm();
    } catch (_) {
      depthMm = 350;
    }
  }
  const postMm = Math.max(
    0,
    Math.round(Number(KITCHEN_UPPER_CORNER_POST_MM) || 40)
  );
  const seatStartMm = resolveUpperCornerSeatBStartMm(depthMm, postMm);
  const seatMm = Math.max(0, cornerW - (seatStartMm || 0));
  return { cornerW, depthMm, postMm, seatStartMm, seatMm };
}

/**
 * Построить snap посадочного места B на upper-other.
 * Не зависит от «занятости» ВМУ — A и B независимы.
 */
export function buildUpperCornerSeatBSnap(sectionData, moduleWidthMm, wallNameOpt) {
  const ctx = resolveUpperCornerJointForSection(sectionData);
  if (!ctx?.isUpperOther || !ctx.joint) return null;
  const { joint } = ctx;
  const geom = _cornerGeom(joint);
  if (!(geom.seatStartMm >= 50) || !(geom.seatMm > 0)) return null;

  const upperCornerCellId = String(
    joint.upperCornerCellId || joint.upperCornerCell?.cornerCellId || ''
  ).trim();
  if (!upperCornerCellId) return null;

  let inner = null;
  try {
    inner = computeSectionInnerBoundsU(sectionData);
  } catch (_) {
    inner = null;
  }
  if (!inner || !(Number(inner.innerWidthU) > 10)) return null;
  const armStart = Number(inner.innerStartU) || 0;
  const armEnd = armStart + Number(inner.innerWidthU);
  const W = _clampW(moduleWidthMm);
  const atStart = _seatAtStartOnOther(sectionData, joint);

  let nearU;
  let farU;
  if (atStart) {
    nearU = armStart + geom.seatStartMm;
    farU = nearU + W;
  } else {
    nearU = armEnd - geom.seatStartMm;
    farU = nearU - W;
  }
  const startU = Math.min(nearU, farU);
  const endU = Math.max(nearU, farU);
  if (!(endU - startU > 50)) return null;

  const wallName = _normWall(
    wallNameOpt || sectionData.wallName || sectionData.division?.wallName || 'back'
  );
  const pivotCoord =
    wallName === 'left' || wallName === 'front' ? endU : startU;

  // zoneIndex: якорная mid-ячейка под стартом B (для иконок/совместимости),
  // владение — seat B + upperCornerCellId, не «обычная следующая».
  let anchorZoneIndex = null;
  const spannedZoneIndexes = [];
  let layout = null;
  try {
    layout = buildKitchenBandCellLayoutForSection(sectionData, 'mid');
  } catch (_) {
    layout = null;
  }
  const EPS = 1;
  const gridSeatZi = Math.floor(
    Number(sectionData?.kitchenBandGrids?.mid?.cornerSeatZoneIndex)
  );
  if (Number.isFinite(gridSeatZi) && gridSeatZi >= 0) {
    anchorZoneIndex = gridSeatZi;
  }
  for (const seg of layout?.segments || []) {
    if (!seg || seg.type !== 'module') continue;
    const zi = Math.floor(Number(seg.zoneIndex));
    if (!Number.isFinite(zi) || zi < 0) continue;
    const a = Math.min(Number(seg.startU), Number(seg.endU));
    const b = Math.max(Number(seg.startU), Number(seg.endU));
    const overlap = Math.min(endU, b) - Math.max(startU, a);
    if (overlap > EPS) {
      spannedZoneIndexes.push(zi);
      if (anchorZoneIndex == null && nearU >= a - EPS && nearU <= b + EPS) {
        anchorZoneIndex = zi;
      }
    }
  }
  spannedZoneIndexes.sort((x, y) => x - y);
  if (anchorZoneIndex == null) {
    anchorZoneIndex = spannedZoneIndexes.length ? spannedZoneIndexes[0] : 0;
  }

  return {
    seat: KITCHEN_UPPER_CORNER_SEAT_B,
    upperCornerCellId,
    jointId: joint.jointId || null,
    sectionId: String(sectionData.id),
    wallName,
    pivotCoord,
    zoneIndex: anchorZoneIndex,
    moduleWidth: W,
    startU,
    endU,
    seatStartMm: geom.seatStartMm,
    seatMm: geom.seatMm,
    depthMm: geom.depthMm,
    postMm: geom.postMm,
    cornerW: geom.cornerW,
    seatAtStart: atStart,
    anchorEdge: atStart ? 'min' : 'max',
    spannedZoneIndexes,
  };
}

/**
 * Hit U попадает в «притяжение» B: от угла до конца посадочной 600-ноги
 * (и чуть дальше на половину модуля — чтобы не улетало в соседа).
 */
export function hitAttractsUpperCornerSeatB(sectionData, hitCoord) {
  const ctx = resolveUpperCornerJointForSection(sectionData);
  if (!ctx?.isUpperOther || !ctx.joint) return false;
  const hit = Number(hitCoord);
  if (!Number.isFinite(hit)) return false;
  const geom = _cornerGeom(ctx.joint);
  if (!(geom.seatStartMm >= 50)) return false;

  let inner = null;
  try {
    inner = computeSectionInnerBoundsU(sectionData);
  } catch (_) {
    inner = null;
  }
  if (!inner || !(Number(inner.innerWidthU) > 10)) return false;
  const armStart = Number(inner.innerStartU) || 0;
  const armEnd = armStart + Number(inner.innerWidthU);
  const atStart = _seatAtStartOnOther(sectionData, ctx.joint);
  // Зона притяжения B = вся нога Г 600 мм от угла (не только зелёные 210).
  const leg = Math.round(Number(geom.cornerW) || 600);
  if (atStart) {
    return hit >= armStart - 1 && hit <= armStart + leg + 1;
  }
  return hit >= armEnd - leg - 1 && hit <= armEnd + 1;
}

/**
 * Единая точка для ghost + place: цель посадочного места MID-угла для НШ1.
 * @returns {object|null} seat B snap или null (не угол / не other / не mid)
 */
export function resolveKitchenUpperCornerSeatTarget(opts = {}) {
  const section = opts.section;
  const wallName = opts.wallName;
  const moduleWidthMm = opts.moduleWidthMm;
  const hitCoord = opts.hitCoord;
  const forceSeatB = opts.forceSeatB === true;
  if (!section) return null;

  const ctx = resolveUpperCornerJointForSection(section);
  if (!ctx?.isUpperOther) return null;

  if (
    forceSeatB ||
    hitCoord == null ||
    hitAttractsUpperCornerSeatB(section, hitCoord)
  ) {
    return buildUpperCornerSeatBSnap(section, moduleWidthMm, wallName);
  }
  return null;
}

if (typeof window !== 'undefined') {
  window.__cldResolveKitchenUpperCornerSeatTarget =
    resolveKitchenUpperCornerSeatTarget;
  window.__cldBuildUpperCornerSeatBSnap = buildUpperCornerSeatBSnap;
  window.__cldHitAttractsUpperCornerSeatB = hitAttractsUpperCornerSeatB;
}
