/**
 * MID upper corner — два посадочных места одной Г-ячейки 600×600.
 *
 * A = ВМУ / приставной на upper-host.
 * B = НШ1 на upper-other: старт = depth + POST, W = remainder (600−D−40 → 210).
 *
 * Не перехватывает посадку «Угловой Г» (seat G). Ghost и place — один target.
 */

import { state } from '../utils/state.js';
import { computeSectionInnerBoundsU } from '../sections/section-edge-trim-insets.js';
import {
  KITCHEN_UPPER_CORNER_CELL_WIDTH_MM,
  KITCHEN_UPPER_CORNER_POST_MM,
  resolveKitchenUpperCornerDepthMm,
} from './kitchen-joint.js?v=20261116-lCorner1050';
import { buildKitchenBandCellLayoutForSection } from './kitchen-section-layout.js?v=20261118-overlayL6';

export const KITCHEN_UPPER_CORNER_SEAT_A = 'A';
export const KITCHEN_UPPER_CORNER_SEAT_B = 'B';

function _normWall(w) {
  return String(w || '')
    .trim()
    .toLowerCase();
}

/**
 * Угловой Г уже в ячейке (mid и/или top) — seat B и нога 600 под крылом заняты.
 * НШ1/НШ2 уводим на соседнюю ячейку яруса, не в карман B.
 * Ищем и по uuid ячейки, и по __kitchenJointId (uuid мог смениться после rebuild).
 */
export function isUpperCornerOccupiedByG(joint) {
  if (!joint || !state?.scene) return false;
  const jid = String(joint.jointId || '').trim();
  const want = new Set(
    [
      joint?.upperCornerCell?.moduleUuid,
      joint?.upperCornerCell?.moduleUuidTop,
      joint?.upperModuleUuid,
      joint?.upperModuleUuidTop,
    ]
      .map((u) => String(u || '').trim())
      .filter(Boolean)
  );
  let found = false;
  try {
    state.scene.traverse((obj) => {
      if (found || !obj?.isGroup) return;
      const ud = obj.userData || {};
      const seat = String(ud.__kitchenUpperCornerSeat || '').toUpperCase();
      const isG =
        seat === 'G' ||
        ud.__kitchenUpperGSeated === true ||
        ud.__kitchenUpperGKind === 'g_arms';
      if (!isG) return;
      if (want.has(obj.uuid)) {
        found = true;
        return;
      }
      if (jid && String(ud.__kitchenJointId || '') === jid) {
        found = true;
      }
    });
  } catch (_) {}
  return found;
}

function _upperCornerOccupiedByG(joint) {
  return isUpperCornerOccupiedByG(joint);
}

/** Секция на Joint с Г в upperCornerCell. */
export function isSectionUpperCornerOccupiedByG(sectionData) {
  const ctx = resolveUpperCornerJointForSection(sectionData);
  return !!(ctx?.joint && isUpperCornerOccupiedByG(ctx.joint));
}

/**
 * Г реально в сцене. Не по uuid на joint — иначе «пустой» угол
 * считается занятым и НШ1 уводят с соседней ячейки.
 */
export function isSectionUpperCornerGPresent(sectionData) {
  const ctx = resolveUpperCornerJointForSection(sectionData);
  if (!ctx?.joint) return false;
  return isUpperCornerOccupiedByG(ctx.joint);
}

/**
 * MID/TOP-зоны, куда обычный НШ1/НШ2 нельзя при Г / host-special.
 * @param {'mid'|'top'} [bandId='mid']
 * @returns {number[]}
 */
export function getNsh1BlockedMidZoneIndexes(sectionData, bandId = 'mid') {
  const out = [];
  if (!sectionData) return out;
  const band = String(bandId || 'mid').toLowerCase() === 'top' ? 'top' : 'mid';
  const grid = sectionData.kitchenBandGrids?.[band];
  const mid = sectionData.kitchenBandGrids?.mid;
  const parts = Math.max(0, Math.floor(Number(grid?.parts || mid?.parts) || 0));
  let sp = Math.floor(Number(grid?.specialZoneIndex));
  // TOP часто без своего special — брать mid host-special (та же угловая колонка).
  if (!(Number.isFinite(sp) && sp >= 0) && band === 'top') {
    sp = Math.floor(Number(mid?.specialZoneIndex));
  }
  if (Number.isFinite(sp) && sp >= 0) out.push(sp);
  const seat = Math.floor(Number(mid?.cornerSeatZoneIndex));
  const gHere = isSectionUpperCornerGPresent(sectionData);
  // Seat B — только mid (карман НШ1). TOP на other не блокируем seat B.
  if (gHere && band === 'mid' && Number.isFinite(seat) && seat >= 0) out.push(seat);
  // Запасной: G-arm reserve на краю плеча, даже если specialZi не проставлен.
  if (gHere && parts > 0) {
    const bag = sectionData._kitchenJointUpperReserves;
    if (bag && typeof bag === 'object') {
      for (const r of Object.values(bag)) {
        if (!r || r.isGArm !== true || typeof r.atStart !== 'boolean') continue;
        const zi = r.atStart === true ? 0 : parts - 1;
        if (zi >= 0) out.push(zi);
      }
    }
  }
  return Array.from(new Set(out.filter((z) => Number.isFinite(z) && z >= 0)));
}

export function resolveUpperCornerSeatBStartMm(depthMm, postMmOpt) {
  const d = Math.round(Number(depthMm) || 0);
  const post = Math.max(
    0,
    Math.round(Number(postMmOpt) || Number(KITCHEN_UPPER_CORNER_POST_MM) || 40)
  );
  if (!(d >= 200 && d <= 700)) return null;
  return d + post;
}

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
    Number(cc.widthMm) ||
      Number(cc.armMm) ||
      KITCHEN_UPPER_CORNER_CELL_WIDTH_MM ||
      600
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

/** Карман: max(grid.cornerSeatMm, zoneW − seatStart, geom.seatMm). */
function _pocketFromSectionGrid(sectionData, geom) {
  const mid = sectionData?.kitchenBandGrids?.mid;
  const seatStart = Math.round(
    Number(mid?.cornerSeatStartMm) || Number(geom.seatStartMm) || 0
  );
  const zi = Math.floor(Number(mid?.cornerSeatZoneIndex));
  let zoneW = 0;
  if (Number.isFinite(zi) && zi >= 0 && mid?.customZoneWidthsMm) {
    zoneW = Math.round(
      Number(
        mid.customZoneWidthsMm[zi] ?? mid.customZoneWidthsMm[String(zi)]
      ) || 0
    );
  }
  const fromZone = zoneW > seatStart ? zoneW - seatStart : 0;
  const gridSeat = Math.round(Number(mid?.cornerSeatMm) || 0);
  const seatMm = Math.max(
    150,
    gridSeat,
    fromZone,
    Math.round(Number(geom.seatMm) || 0)
  );
  return {
    seatStartMm: seatStart >= 50 ? seatStart : geom.seatStartMm,
    seatMm,
    zoneWidthMm: zoneW,
    cornerSeatZoneIndex: Number.isFinite(zi) && zi >= 0 ? zi : null,
  };
}

/**
 * Snap seat B на upper-other.
 * W = карман (210 по умолчанию; после карандаша — до zoneW−(D+POST)).
 */
export function buildUpperCornerSeatBSnap(sectionData, moduleWidthMm, wallNameOpt) {
  const ctx = resolveUpperCornerJointForSection(sectionData);
  if (!ctx?.isUpperOther || !ctx.joint) return null;
  if (_upperCornerOccupiedByG(ctx.joint)) return null;
  const { joint } = ctx;
  const geom = _cornerGeom(joint);
  const pocket = _pocketFromSectionGrid(sectionData, geom);
  if (!(pocket.seatStartMm >= 50) || !(pocket.seatMm > 0)) return null;

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

  const cap = Math.max(150, Math.round(Number(pocket.seatMm) || 0));
  const want = Math.round(Number(moduleWidthMm) || 0);
  const W = want >= 150 && want <= cap ? want : cap;

  const atStart = _seatAtStartOnOther(sectionData, joint);
  let nearU;
  let farU;
  if (atStart) {
    nearU = armStart + pocket.seatStartMm;
    farU = nearU + W;
  } else {
    nearU = armEnd - pocket.seatStartMm;
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
    Number(
      pocket.cornerSeatZoneIndex ??
        sectionData?.kitchenBandGrids?.mid?.cornerSeatZoneIndex
    )
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
    seatStartMm: pocket.seatStartMm,
    seatMm: pocket.seatMm,
    depthMm: geom.depthMm,
    postMm: geom.postMm,
    cornerW: geom.cornerW,
    zoneWidthMm: pocket.zoneWidthMm || null,
    seatAtStart: atStart,
    anchorEdge: atStart ? 'min' : 'max',
    spannedZoneIndexes,
  };
}

export function hitAttractsUpperCornerSeatB(sectionData, hitCoord) {
  const ctx = resolveUpperCornerJointForSection(sectionData);
  if (!ctx?.isUpperOther || !ctx.joint) return false;
  if (_upperCornerOccupiedByG(ctx.joint)) return false;
  const hit = Number(hitCoord);
  if (!Number.isFinite(hit)) return false;
  const geom = _cornerGeom(ctx.joint);
  const pocket = _pocketFromSectionGrid(sectionData, geom);
  if (!(pocket.seatStartMm >= 50)) return false;

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
  // Притяжение: нога кармана (zoneW) или канон 600.
  const leg = Math.max(
    600,
    Math.round(Number(pocket.zoneWidthMm) || 0),
    Math.round(Number(geom.cornerW) || 600)
  );
  if (atStart) {
    return hit >= armStart - 1 && hit <= armStart + leg + 1;
  }
  return hit >= armEnd - leg - 1 && hit <= armEnd + 1;
}

export function resolveKitchenUpperCornerSeatTarget(opts = {}) {
  const section = opts.section;
  const wallName = opts.wallName;
  const moduleWidthMm = opts.moduleWidthMm;
  const hitCoord = opts.hitCoord;
  const forceSeatB = opts.forceSeatB === true;
  if (!section) return null;

  const ctx = resolveUpperCornerJointForSection(section);
  if (!ctx?.isUpperOther) return null;
  if (_upperCornerOccupiedByG(ctx.joint)) return null;

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
  window.__cldGetNsh1BlockedMidZoneIndexes = getNsh1BlockedMidZoneIndexes;
  window.__cldIsSectionUpperCornerGPresent = isSectionUpperCornerGPresent;
}
