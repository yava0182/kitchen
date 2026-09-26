/**
 * Единый контракт inset'ов торца секции (§4 / §4.1 / торцевой overlay).
 * Источник правды для computeSectionLayout, синих линий, tops extend.
 */
import { state } from '../utils/state.js';
import { PLACEMENT_KIND } from './vertical-layout.js';
import { isEndCabinetActive, shouldSuppressSideTrimForEndCabinet, getEndCabinetReserveMm, getEndCabinetRowPlinthInsetMm } from './section-end-cabinet.js?v=20260917-endcab-nobridge';

/** Зазор ≤ 5 мм — планка 50 мм; > 5 мм — накладка 16 мм (§4.1). */
export const TRIM_ROOM_GAP_THRESHOLD_MM = 5;

export const SIDE_OVERLAY_INSET_MM = 16;
export const SIDE_PLANK_INSET_MM = 50;

/** Дефолты доборов (Maatkasten L/R/Top) — совпадают с прежними 50 мм планок. */
export const DEFAULT_FILLER_SIDE_MM = SIDE_PLANK_INSET_MM;
export const DEFAULT_FILLER_TOP_MM = 50;
export const FILLER_SIDE_MIN_MM = 10;
export const FILLER_SIDE_MAX_MM = 300;
export const FILLER_TOP_MIN_MM = 0;
export const FILLER_TOP_MAX_MM = 300;

/** Как у AutoTopCap / height-mismatch: ниже этого — «низкий» модуль у торцевого. */
export const END_CABINET_LOW_NEIGHBOR_H_MM = 1500;

function clampFillerMm(raw, minMm, maxMm, fallback) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(minMm, Math.min(maxMm, Math.round(n)));
}

/**
 * Доборы секции (ширина планок у стены), не путать с offsets.*Mm (зазор до стены).
 * @returns {{ leftMm: number, rightMm: number, frontMm: number, backMm: number, topMm: number }}
 */
export function getSectionFillerMm(sectionData) {
  const f = sectionData?.filler && typeof sectionData.filler === 'object' ? sectionData.filler : {};
  const topFallback = Number.isFinite(Number(sectionData?.topPlankHeight))
    ? Number(sectionData.topPlankHeight)
    : DEFAULT_FILLER_TOP_MM;
  return {
    leftMm: clampFillerMm(f.leftMm, FILLER_SIDE_MIN_MM, FILLER_SIDE_MAX_MM, DEFAULT_FILLER_SIDE_MM),
    rightMm: clampFillerMm(f.rightMm, FILLER_SIDE_MIN_MM, FILLER_SIDE_MAX_MM, DEFAULT_FILLER_SIDE_MM),
    frontMm: clampFillerMm(f.frontMm, FILLER_SIDE_MIN_MM, FILLER_SIDE_MAX_MM, DEFAULT_FILLER_SIDE_MM),
    backMm: clampFillerMm(f.backMm, FILLER_SIDE_MIN_MM, FILLER_SIDE_MAX_MM, DEFAULT_FILLER_SIDE_MM),
    topMm: clampFillerMm(f.topMm ?? topFallback, FILLER_TOP_MIN_MM, FILLER_TOP_MAX_MM, DEFAULT_FILLER_TOP_MM),
  };
}

/** Записать дефолты filler на секцию (идемпотентно). */
export function ensureSectionFillerDefaults(sectionData) {
  if (!sectionData || typeof sectionData !== 'object') return getSectionFillerMm(null);
  const cur = getSectionFillerMm(sectionData);
  sectionData.filler = { ...cur };
  if (!Number.isFinite(Number(sectionData.topPlankHeight))) {
    sectionData.topPlankHeight = cur.topMm;
  }
  return cur;
}

/** Ширина планки-добора для физического торца (left|right|front|back). */
export function getFillerPlankMmForPhysicalSide(sectionData, physicalSide) {
  const f = getSectionFillerMm(sectionData);
  const s = String(physicalSide || '').trim().toLowerCase();
  if (s === 'left') return f.leftMm;
  if (s === 'right') return f.rightMm;
  if (s === 'front') return f.frontMm;
  if (s === 'back') return f.backMm;
  return DEFAULT_FILLER_SIDE_MM;
}

/** Ширина планки-добора для логического края min|max по U. */
export function getFillerPlankMmForLogicalEdge(sectionData, logicalEdge) {
  const wallName = sectionData?.wallName || sectionData?.division?.wallName || 'back';
  const side = logicalEdgeToPhysicalSide(wallName, logicalEdge);
  return getFillerPlankMmForPhysicalSide(sectionData, side);
}

/**
 * UI Maatkasten: левая/правая панель = min/max край ряда; верх = filler.topMm.
 * @returns {{ leftMm: number, rightMm: number, topMm: number }}
 */
export function getSectionFillerUiMm(sectionData) {
  const f = getSectionFillerMm(sectionData);
  return {
    leftMm: getFillerPlankMmForLogicalEdge(sectionData, 'min'),
    rightMm: getFillerPlankMmForLogicalEdge(sectionData, 'max'),
    topMm: f.topMm,
  };
}

/**
 * Применить UI L/R/Top (мм) → filler по физическим торцам + sync topPlankHeight.
 * Не трогает under-window bay top (16 мм).
 */
export function applySectionFillerUiMm(sectionData, leftMm, rightMm, topMm) {
  if (!sectionData) return null;
  const wallName = sectionData.wallName || sectionData.division?.wallName || 'back';
  const f = ensureSectionFillerDefaults(sectionData);
  const L = clampFillerMm(leftMm, FILLER_SIDE_MIN_MM, FILLER_SIDE_MAX_MM, f.leftMm);
  const R = clampFillerMm(rightMm, FILLER_SIDE_MIN_MM, FILLER_SIDE_MAX_MM, f.rightMm);
  const T = clampFillerMm(topMm, FILLER_TOP_MIN_MM, FILLER_TOP_MAX_MM, f.topMm);
  const minSide = logicalEdgeToPhysicalSide(wallName, 'min');
  const maxSide = logicalEdgeToPhysicalSide(wallName, 'max');
  if (minSide === 'left') f.leftMm = L;
  else if (minSide === 'front') f.frontMm = L;
  else if (minSide === 'right') f.rightMm = L;
  else if (minSide === 'back') f.backMm = L;
  if (maxSide === 'right') f.rightMm = R;
  else if (maxSide === 'back') f.backMm = R;
  else if (maxSide === 'left') f.leftMm = R;
  else if (maxSide === 'front') f.frontMm = R;
  const isBay =
    !!sectionData.underWindowBay || sectionData.windowBridgeRole === 'under-window';
  if (!isBay && !(Number(sectionData.fixedHeightMm) > 0 && Number(sectionData.topPlankHeight) === 0)) {
    f.topMm = T;
    sectionData.topPlankHeight = T;
  }
  sectionData.filler = { ...f };
  return getSectionFillerUiMm(sectionData);
}

/** @typedef {'none'|'plank'|'overlay'|'end_cabinet_overlay'|'end_cabinet_flush'} SectionEdgeTrimKind */

/**
 * @typedef {Object} SectionEdgeTrimInsets
 * @property {number} insetMm
 * @property {SectionEdgeTrimKind} kind
 * @property {string} [side] left|right|front|back
 */

/**
 * @typedef {Object} SectionInnerBoundsU
 * @property {number} outerMinU
 * @property {number} outerMaxU
 * @property {number} insetMin
 * @property {number} insetMax
 * @property {number} innerStartU
 * @property {number} innerEndU
 * @property {number} innerWidthU
 * @property {SectionEdgeTrimInsets} minEdge
 * @property {SectionEdgeTrimInsets} maxEdge
 */

function readOffsetsMm(sectionData) {
  const o = sectionData?.offsets || {};
  return {
    leftMm: Number(o.leftMm) || 0,
    rightMm: Number(o.rightMm) || 0,
    frontMm: Number(o.frontMm) || 0,
    backMm: Number(o.backMm) || 0,
  };
}

/** Физический торец секции → логический край ряда по U (min | max). */
export function physicalSideToLogicalEdge(wallName, side) {
  const w = String(wallName || 'back').trim().toLowerCase();
  const s = String(side || '').trim().toLowerCase();
  if (w === 'front' || w === 'back') {
    if (s === 'left') return 'min';
    if (s === 'right') return 'max';
  }
  if (w === 'left' || w === 'right') {
    if (s === 'front') return 'min';
    if (s === 'back') return 'max';
  }
  return null;
}

/** min/max U → физический торец для текущей стены. */
export function logicalEdgeToPhysicalSide(wallName, logicalEdge) {
  const w = String(wallName || 'back').trim().toLowerCase();
  const e = logicalEdge === 'max' ? 'max' : 'min';
  if (w === 'front' || w === 'back') return e === 'min' ? 'left' : 'right';
  if (w === 'left' || w === 'right') return e === 'min' ? 'front' : 'back';
  return e === 'min' ? 'left' : 'right';
}

function gapMmForPhysicalSide(sectionData, wallName, side) {
  const o = readOffsetsMm(sectionData);
  const w = String(wallName || 'back').trim().toLowerCase();
  const s = String(side || '').trim().toLowerCase();
  if (w === 'front' || w === 'back') {
    if (s === 'left') return o.leftMm;
    if (s === 'right') return o.rightMm;
  }
  if (w === 'left' || w === 'right') {
    if (s === 'front') return o.frontMm;
    if (s === 'back') return o.backMm;
  }
  return 0;
}

function parseEndCabinetSideFromOverlay(obj) {
  const ud = obj?.userData || {};
  if (ud.endCabinetSide) return String(ud.endCabinetSide).toLowerCase();
  const m = String(obj?.name || '').match(/^EndCabinetFacadeOverlay_(Left|Right|Front|Back)_/i);
  return m ? m[1].toLowerCase() : null;
}

/** Низкий сосед у торца (тумба) — как на прямом: нужен шов 16 мм. Шкаф той же высоты — вплотную. */
function isLowNeighborFurniture(grp) {
  if (!grp?.userData) return false;
  const pk = String(grp.userData.__placementKind || '');
  if (pk === PLACEMENT_KIND.STANDALONE_FLOOR) return true;
  try {
    const box = new THREE.Box3().setFromObject(grp);
    if (box.isEmpty()) return false;
    const h = box.max.y - box.min.y;
    return Number.isFinite(h) && h > 1 && h < END_CABINET_LOW_NEIGHBOR_H_MM;
  } catch (_) {
    return false;
  }
}

/**
 * Мебель ряда у логического края (не торцевой модуль).
 * @returns {THREE.Object3D|null}
 */
function findRowFurnitureNearestEdge(sectionData, logicalEdge) {
  if (!sectionData?.id || !state.scene) return null;
  const wallName = sectionData.wallName || sectionData.division?.wallName || 'back';
  const useZ = wallName === 'left' || wallName === 'right';
  const wantMax = logicalEdge === 'max';
  let best = null;
  let bestU = wantMax ? -Infinity : Infinity;
  state.scene.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    if (obj.userData.sectionId !== sectionData.id) return;
    if (obj.userData.isEndCabinet || obj.userData.isEndCabinetSlot) return;
    let u;
    try {
      const box = new THREE.Box3().setFromObject(obj);
      if (box.isEmpty()) return;
      u = wantMax
        ? useZ
          ? box.max.z
          : box.max.x
        : useZ
          ? box.min.z
          : box.min.x;
    } catch (_) {
      return;
    }
    if (!Number.isFinite(u)) return;
    if (wantMax ? u >= bestU : u <= bestU) {
      bestU = u;
      best = obj;
    }
  });
  return best;
}

/**
 * Inset торца ряда при торцевом шкафе:
 * - рядом низкий модуль → 16 мм (место под SideCap, как шкаф↔тумба);
 * - рядом шкаф той же высоты / пусто → 0 (вплотную).
 */
export function resolveEndCabinetRowEdgeInsets(sectionData, physicalSide) {
  const wallName = sectionData?.wallName || sectionData?.division?.wallName || 'back';
  const side = String(physicalSide || '').toLowerCase();
  if (!isEndCabinetActive(sectionData, side)) {
    return { insetMm: 0, kind: 'none', side };
  }
  const logicalEdge = physicalSideToLogicalEdge(wallName, side);
  const neighbor = logicalEdge ? findRowFurnitureNearestEdge(sectionData, logicalEdge) : null;
  if (neighbor && isLowNeighborFurniture(neighbor)) {
    return { insetMm: SIDE_OVERLAY_INSET_MM, kind: 'end_cabinet_overlay', side };
  }
  return { insetMm: 0, kind: 'end_cabinet_flush', side };
}

/**
 * Фактические вертикали на group секции (SidePlank / SideOverlay / EndCabinetFacadeOverlay).
 * @returns {{ min: { hasOverlay: boolean, hasPlank: boolean, hasEndCabinetOverlay: boolean }, max: { hasOverlay: boolean, hasPlank: boolean, hasEndCabinetOverlay: boolean } }}
 */
export function detectSectionEdgeTrimMeshes(sectionGroup, wallName) {
  const empty = {
    min: { hasOverlay: false, hasPlank: false, hasEndCabinetOverlay: false },
    max: { hasOverlay: false, hasPlank: false, hasEndCabinetOverlay: false },
  };
  if (!sectionGroup) return empty;
  const out = {
    min: { hasOverlay: false, hasPlank: false, hasEndCabinetOverlay: false },
    max: { hasOverlay: false, hasPlank: false, hasEndCabinetOverlay: false },
  };
  sectionGroup.traverse((obj) => {
    const n = String(obj?.name || '');
    const ud = obj?.userData || {};
    if (ud.isEndCabinetFacadeOverlay || /^EndCabinetFacadeOverlay_/i.test(n)) {
      const side = parseEndCabinetSideFromOverlay(obj);
      const edge = side ? physicalSideToLogicalEdge(wallName, side) : null;
      if (edge === 'min') out.min.hasEndCabinetOverlay = true;
      if (edge === 'max') out.max.hasEndCabinetOverlay = true;
      return;
    }
    if (n === 'SideOverlayLeft' || n === 'SideOverlayFront') out.min.hasOverlay = true;
    if (n === 'SideOverlayRight' || n === 'SideOverlayBack') out.max.hasOverlay = true;
    if (n === 'SidePlankLeft' || n === 'SidePlankFront') out.min.hasPlank = true;
    if (n === 'SidePlankRight' || n === 'SidePlankBack') out.max.hasPlank = true;
  });
  return out;
}

function insetsFromDetectedEdge(edgeState, sectionData, physicalSide) {
  if (shouldSuppressSideTrimForEndCabinet(sectionData, physicalSide)) {
    if (isEndCabinetActive(sectionData, physicalSide) || edgeState?.hasEndCabinetOverlay) {
      return resolveEndCabinetRowEdgeInsets(sectionData, physicalSide);
    }
    return { insetMm: 0, kind: 'none', side: physicalSide };
  }
  if (edgeState?.hasOverlay || edgeState?.hasEndCabinetOverlay) {
    return { insetMm: SIDE_OVERLAY_INSET_MM, kind: 'overlay', side: physicalSide };
  }
  if (edgeState?.hasPlank) {
    return {
      insetMm: getFillerPlankMmForPhysicalSide(sectionData, physicalSide),
      kind: 'plank',
      side: physicalSide,
    };
  }
  return null;
}

/** Предсказание inset по offsets / торцевому (до постройки mesh или если mesh снят). */
export function predictSectionEdgeTrimInsets(sectionData, logicalEdge) {
  const wallName = sectionData?.wallName || sectionData?.division?.wallName || 'back';
  const side = logicalEdgeToPhysicalSide(wallName, logicalEdge);
  if (shouldSuppressSideTrimForEndCabinet(sectionData, side)) {
    if (isEndCabinetActive(sectionData, side)) {
      return resolveEndCabinetRowEdgeInsets(sectionData, side);
    }
    return { insetMm: 0, kind: 'none', side };
  }
  const gapMm = gapMmForPhysicalSide(sectionData, wallName, side);
  if (gapMm > TRIM_ROOM_GAP_THRESHOLD_MM) {
    return { insetMm: SIDE_OVERLAY_INSET_MM, kind: 'overlay', side };
  }
  return {
    insetMm: getFillerPlankMmForPhysicalSide(sectionData, side),
    kind: 'plank',
    side,
  };
}

/**
 * Какие поля доборов показывать в UI (левая/правая = min/max U).
 * Планка — только при зазоре ≤5 мм (§4.1). Отступ больше → накладка 16 мм — поле не даём.
 * Верх — пока не bay / не «без топа» у fixedHeight.
 * @returns {{ left: boolean, right: boolean, top: boolean, minKind: string, maxKind: string }}
 */
export function getSectionFillerEditableFields(sectionData) {
  const minEdge = predictSectionEdgeTrimInsets(sectionData, 'min');
  const maxEdge = predictSectionEdgeTrimInsets(sectionData, 'max');
  const isBay =
    !!sectionData?.underWindowBay || sectionData?.windowBridgeRole === 'under-window';
  const topOff =
    isBay ||
    (Number(sectionData?.fixedHeightMm) > 0 && Number(sectionData?.topPlankHeight) === 0);
  return {
    left: minEdge.kind === 'plank',
    right: maxEdge.kind === 'plank',
    top: !topOff,
    minKind: String(minEdge.kind || 'none'),
    maxKind: String(maxEdge.kind || 'none'),
  };
}

/**
 * Inset одного логического торца (min/max по U).
 * @param {object} sectionData
 * @param {'min'|'max'} logicalEdge
 * @returns {SectionEdgeTrimInsets}
 */
export function getSectionEdgeTrimInsets(sectionData, logicalEdge) {
  const wallName = sectionData?.wallName || sectionData?.division?.wallName || 'back';
  const edge = logicalEdge === 'max' ? 'max' : 'min';
  const side = logicalEdgeToPhysicalSide(wallName, edge);
  if (sectionData?.group) {
    const detected = detectSectionEdgeTrimMeshes(sectionData.group, wallName);
    const fromMeshes = insetsFromDetectedEdge(detected[edge], sectionData, side);
    if (fromMeshes) return fromMeshes;
    if (isEndCabinetActive(sectionData, side)) {
      return resolveEndCabinetRowEdgeInsets(sectionData, side);
    }
    return { insetMm: 0, kind: 'none', side };
  }
  return predictSectionEdgeTrimInsets(sectionData, edge);
}

/** Inset физического торца (left/right/front/back) — для cabinet-markers. */
export function getPhysicalSideTrimInsetMm(sectionData, wallName, physicalSide) {
  const edge = physicalSideToLogicalEdge(wallName, physicalSide);
  if (!edge) return 0;
  return getSectionEdgeTrimInsets(sectionData, edge).insetMm;
}

/**
 * Внутренние границы ряда модулей по U (мм, мир).
 * @param {object} sectionData
 * @returns {SectionInnerBoundsU}
 */
export function computeSectionInnerBoundsU(sectionData) {
  const division = sectionData?.division;
  const wallName = sectionData?.wallName || division?.wallName || 'back';
  const g = sectionData?.group;
  const pos = g?.position || { x: 0, y: 0, z: 0 };
  const axis = wallName === 'left' || wallName === 'right' ? 'z' : 'x';
  const outerWidthU =
    axis === 'x' ? Number(sectionData?.size?.x || 0) : Number(sectionData?.size?.z || 0);

  let outerMinU = 0;
  let outerMaxU = 0;
  if (wallName === 'front') {
    outerMaxU = pos.x;
    outerMinU = pos.x - outerWidthU;
  } else if (wallName === 'back') {
    outerMinU = pos.x;
    outerMaxU = pos.x + outerWidthU;
  } else if (wallName === 'left') {
    outerMaxU = pos.z;
    outerMinU = pos.z - outerWidthU;
  } else if (wallName === 'right') {
    outerMinU = pos.z;
    outerMaxU = pos.z + outerWidthU;
  } else {
    outerMinU = Number(division?.sectionStart ?? 0);
    outerMaxU = outerMinU + outerWidthU;
  }

  const minEdge = getSectionEdgeTrimInsets(sectionData, 'min');
  const maxEdge = getSectionEdgeTrimInsets(sectionData, 'max');
  const insetMin = minEdge.insetMm;
  const insetMax = maxEdge.insetMm;
  const innerStartU = outerMinU + insetMin;
  const innerEndU = outerMaxU - insetMax;
  const innerWidthU = innerEndU - innerStartU;

  return {
    outerMinU,
    outerMaxU,
    insetMin,
    insetMax,
    innerStartU,
    innerEndU,
    innerWidthU,
    minEdge,
    maxEdge,
  };
}

/**
 * Мировой span по U для верхней планки / цоколя (№1 / №3).
 *
 * Правила (разные торцы):
 * - SidePlank 50 мм → до внутренней грани планки (inner*)
 * - SideOverlay 16 мм → до внешней грани накладки (outer*)
 * - EndCabinetFacadeOverlay → outer ряда + extend на резерв торцевого
 * - цоколь при торцевом: резерв минус inset фасада
 *
 * @param {object} sectionData
 * @param {{ forPlinth?: boolean }} [options]
 * @returns {{ uLo: number, uHi: number, widthU: number, bounds: SectionInnerBoundsU, minKind: string, maxKind: string }}
 */
export function computeHorizontalTrimSpanU(sectionData, options = {}) {
  const forPlinth = !!options.forPlinth;
  const bounds = computeSectionInnerBoundsU(sectionData);
  const wallName = sectionData?.wallName || sectionData?.division?.wallName || 'back';
  const alongFB = wallName === 'front' || wallName === 'back';

  let uLo = bounds.outerMinU;
  let uHi = bounds.outerMaxU;

  // Планка 50 мм: горизонтали между внутренними гранями (не накрывают толщину 50 по U).
  if (bounds.minEdge.kind === 'plank') uLo = bounds.innerStartU;
  if (bounds.maxEdge.kind === 'plank') uHi = bounds.innerEndU;
  // overlay / end_cabinet_overlay / end_cabinet_flush / none: outer* = внешний край ряда.

  const sideLo = alongFB ? 'left' : 'front';
  const sideHi = alongFB ? 'right' : 'back';
  let extLo = getEndCabinetReserveMm(sectionData, sideLo);
  let extHi = getEndCabinetReserveMm(sectionData, sideHi);
  if (forPlinth) {
    extLo = Math.max(0, extLo - getEndCabinetRowPlinthInsetMm(sectionData, sideLo));
    extHi = Math.max(0, extHi - getEndCabinetRowPlinthInsetMm(sectionData, sideHi));
  }
  uLo -= extLo;
  uHi += extHi;

  return {
    uLo,
    uHi,
    widthU: uHi - uLo,
    bounds,
    minKind: bounds.minEdge.kind,
    maxKind: bounds.maxEdge.kind,
    extLo,
    extHi,
  };
}

