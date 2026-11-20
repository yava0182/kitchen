/**
 * Kitchen section / cell layout — только для кухни (Clodis-Kitchen).
 *
 * Шкафной section-cell engine здесь не живёт (caps / niche U-fit / parts-shrink /
 * corner-wardrobe). Пока stub: равные ячейки или customZoneWidthsMm.
 * Полный kitchen cell engine наращиваем поверх этого модуля.
 */

import { computeSectionInnerBoundsU } from '../sections/section-edge-trim-insets.js';
import { state } from '../utils/state.js';
import {
  KITCHEN_UPPER_CORNER_CELL_WIDTH_MM,
  KITCHEN_UPPER_CORNER_POST_MM,
  resolveKitchenUpperCornerDepthMm,
} from './kitchen-joint.js?v=20261107-ucorner22';

/** В этом репо layout секций всегда кухонный. */
export const KITCHEN_SECTION_LAYOUT_ACTIVE = true;

/**
 * Угловой НМ (спец L): фиксированная ячейка.
 * 500 (нога как однодверный на прямой) + 550 (return = корпус соседа Dwt−40−10).
 * Ячейка/столешка 1050 до стены; корпус НМУ 1040 (−10 мм внутри ячейки).
 */
export const KITCHEN_CORNER_FACADE_LEG_MM = 500;
export const KITCHEN_CORNER_RETURN_MM = 550;
export const KITCHEN_CORNER_SPECIAL_WIDTH_MM =
  KITCHEN_CORNER_FACADE_LEG_MM + KITCHEN_CORNER_RETURN_MM; // 1050

/** Приставной ВМУ (верх в пироге): своя ячейка, не W низа 1050. Позже — карандаш; сейчас дефолт 600. */
export const KITCHEN_WALL_CORNER_DEFAULT_WIDTH_MM = 600;

/** Горизонтальные пояса сетки ячеек (FULL = объём base+mid, не отдельная сетка). */
export const KITCHEN_BAND_IDS = Object.freeze(['base', 'mid', 'top']);

/** Допустимые ширины ячейки пояса (как у карандаша зоны: 300…1200). */
export const KITCHEN_BAND_CELL_MIN_MM = 300;
export const KITCHEN_BAND_CELL_MAX_MM = 1200;

/**
 * Канон первоначального деления прямой кухонной секции:
 * parts = ceil(W / 600); ширины = N×600 + один остаток в жертве.
 * Жертва — справа от центра (не край): нечёт → center+1; чёт → parts/2.
 * Пример: 2000 → 600+600+200+600 (жертва zi=2).
 * Углы L/U — отдельно, сюда не входят.
 */
export const KITCHEN_STRAIGHT_INITIAL_CELL_MAX_MM = 600;

/** Происхождение customZoneWidthsMm: карандаш/жест vs авто-rescale. */
export const CUSTOM_ZONE_WIDTHS_SOURCE_USER = 'user';
export const CUSTOM_ZONE_WIDTHS_SOURCE_AUTO = 'auto';

/**
 * Индекс жертвы/принимателя: справа от центра, не крайняя «для красоты ряда».
 * parts=1 → 0; нечёт (3,5…) → floor(n/2)+1; чёт (2,4…) → n/2.
 */
export function kitchenStraightSacrificeZoneIndex(parts) {
  const n = Math.max(1, Math.floor(Number(parts) || 0));
  if (n <= 1) return 0;
  if (n % 2 === 1) {
    const center = Math.floor(n / 2);
    return Math.min(n - 1, center + 1);
  }
  return n / 2;
}

/**
 * План ширин прямой секции: полные 600 + одна жертва с остатком (справа от центра).
 * @returns {{
 *   parts: number,
 *   widthsMm: number[],
 *   widthsMap: Record<number, number>,
 *   sacrificeZi: number,
 *   unitMm: number,
 *   remMm: number,
 *   fullCount: number
 * }}
 */
export function buildKitchenStraight600SacrificePlan(availMm) {
  const unitMm = KITCHEN_STRAIGHT_INITIAL_CELL_MAX_MM;
  const W = Math.max(0, Math.round(Number(availMm) || 0));
  const empty = {
    parts: 0,
    widthsMm: [],
    widthsMap: Object.create(null),
    sacrificeZi: -1,
    unitMm,
    remMm: 0,
    fullCount: 0,
  };
  if (!(W > 0)) return empty;

  const fullCount = Math.floor(W / unitMm);
  const remMm = W - fullCount * unitMm;

  if (fullCount <= 0) {
    const widthsMap = Object.create(null);
    widthsMap[0] = W;
    return {
      parts: 1,
      widthsMm: [W],
      widthsMap,
      sacrificeZi: 0,
      unitMm,
      remMm: W,
      fullCount: 0,
    };
  }

  const parts = remMm > 0 ? fullCount + 1 : fullCount;
  const sacrificeZi = kitchenStraightSacrificeZoneIndex(parts);
  const widthsMm = [];
  const widthsMap = Object.create(null);
  for (let i = 0; i < parts; i++) {
    const w = remMm > 0 && i === sacrificeZi ? remMm : unitMm;
    widthsMm.push(w);
    widthsMap[i] = w;
  }
  return {
    parts,
    widthsMm,
    widthsMap,
    sacrificeZi,
    unitMm,
    remMm: remMm > 0 ? remMm : 0,
    fullCount,
  };
}

/**
 * План ширин одного плеча L: спец (если есть) + 600+жертва на остатке.
 * @returns {{
 *   parts: number,
 *   freeParts: number,
 *   freeMm: number,
 *   specialZi: number,
 *   specialW: number,
 *   sacrificeZi: number,
 *   widthsMap: Record<number, number>,
 *   unitMm: number
 * }|null}
 */
function _planKitchenLArmWidthsMm(spanMm, hasSpecial, specialAtStart, specialW) {
  const span = Math.round(Number(spanMm) || 0);
  if (!(span > 0)) return null;
  const spec = hasSpecial ? Math.max(0, Math.round(Number(specialW) || 0)) : 0;
  const freeMm = hasSpecial ? Math.max(0, span - spec) : span;

  if (!(freeMm > 0) && hasSpecial && spec > 0) {
    return {
      parts: 1,
      freeParts: 0,
      freeMm: 0,
      specialZi: 0,
      specialW: spec,
      sacrificeZi: -1,
      widthsMap: { 0: spec },
      unitMm: KITCHEN_STRAIGHT_INITIAL_CELL_MAX_MM,
    };
  }
  if (!(freeMm > 0)) return null;

  const plan = buildKitchenStraight600SacrificePlan(freeMm);
  if (!(plan.parts > 0)) return null;
  const freeParts = plan.parts;
  const parts = hasSpecial ? freeParts + 1 : freeParts;
  const specialZi = !hasSpecial ? -1 : specialAtStart ? 0 : parts - 1;
  const widthsMap = Object.create(null);
  if (hasSpecial && specialAtStart) {
    widthsMap[0] = spec;
    for (let i = 0; i < freeParts; i++) widthsMap[i + 1] = plan.widthsMm[i];
  } else if (hasSpecial && !specialAtStart) {
    for (let i = 0; i < freeParts; i++) widthsMap[i] = plan.widthsMm[i];
    widthsMap[specialZi] = spec;
  } else {
    for (let i = 0; i < freeParts; i++) widthsMap[i] = plan.widthsMm[i];
  }
  const sacrificeZi =
    plan.sacrificeZi >= 0
      ? hasSpecial && specialAtStart
        ? plan.sacrificeZi + 1
        : plan.sacrificeZi
      : -1;
  return {
    parts,
    freeParts,
    freeMm,
    specialZi,
    specialW: spec,
    sacrificeZi,
    widthsMap,
    unitMm: plan.unitMm,
  };
}

/**
 * Seat A (приставной ВМУ): спец 600 только на upper-host.
 * Seat B пока выключен.
 */
function _resolveLUpperCornerSpecialMeta(sectionData, _baseHasSpecial, _baseAtStart) {
  const bag = sectionData?._kitchenJointUpperReserves;
  if (bag && typeof bag === 'object') {
    for (const r of Object.values(bag)) {
      if (!r || r.isHost !== true || typeof r.atStart !== 'boolean') continue;
      const w = Math.round(Number(r.widthMm) || 0);
      return {
        hasSpecial: true,
        specialAtStart: r.atStart === true,
        specialW:
          w >= 300 && w <= 900 ? w : KITCHEN_WALL_CORNER_DEFAULT_WIDTH_MM,
        depthMm: Math.round(Number(r.depthMm) || 0) || 350,
        postMm: Math.max(0, Math.round(Number(r.postMm) || 40)),
      };
    }
  }
  return {
    hasSpecial: false,
    specialAtStart: true,
    specialW: 0,
    depthMm: 350,
    postMm: 40,
  };
}

/** WIPED ucorner20: inset/seat B meta выключены. */
function _resolveLUpperCornerNsh1InsetMeta(_sectionData) {
  return null;
}

/** WIPED ucorner20: seat B API — заглушки (канон в docs/MID-UPPER-CORNER-CANON.md). */
export function resolveKitchenUpperCornerSeatBStartMm(_depthMm, _postMmOpt) {
  return null;
}
function _resolveSeatBContext(_sectionData) {
  return null;
}
export function resolveKitchenUpperCornerSeatBSnap(_sectionData, _moduleWidthMm, _wallNameOpt) {
  return null;
}
export function resolveKitchenUpperCornerCompanionSnap(sectionData, moduleWidthMm, wallNameOpt) {
  return resolveKitchenUpperCornerSeatBSnap(sectionData, moduleWidthMm, wallNameOpt);
}
export function isKitchenUpperCornerSeatBZone(_sectionData, _zoneIndex) {
  return false;
}
export function isKitchenUpperCornerCompanionCandidateZone(sectionData, zoneIndex) {
  return isKitchenUpperCornerSeatBZone(sectionData, zoneIndex);
}

function _writeBandGridPlan(grids, bandId, plan) {
  const g = grids?.[bandId];
  if (!g || typeof g !== 'object' || !plan) return;
  g.parts = plan.parts;
  g.customZoneWidthsMm = { ...plan.widthsMap };
  const sp = Math.floor(Number(plan.specialZi));
  if (Number.isFinite(sp) && sp >= 0) g.specialZoneIndex = sp;
  else delete g.specialZoneIndex;
  delete g.pocketZoneIndex;
  delete g.cornerInsetZoneIndex;
  // Seat B пока выключен — маркеры B не пишем.
  delete g.cornerSeatZoneIndex;
  delete g.cornerSeatStartMm;
  delete g.cornerSeatMm;
  const hostD = Math.round(Number(plan.hostDepthMm) || 0);
  if (hostD >= 200 && hostD <= 700) g.hostDepthMm = hostD;
  else delete g.hostDepthMm;
  const post = Math.round(Number(plan.postMm) || 0);
  if (post > 0) g.postMm = post;
  else delete g.postMm;
  if (plan.sacrificeZi >= 0) g.sacrificeZoneIndex = plan.sacrificeZi;
  else delete g.sacrificeZoneIndex;
}

/**
 * L-кухня: 600+жертва на свободном плече.
 * BASE: спец угла = 1050 (низ). MID/TOP: спец угла = 600 (освободить 60×60), низ не трогаем.
 * Не трогает прямую секцию и U.
 */
export function applyKitchenLFreeArm600SacrificeWidths(sectionData) {
  if (!sectionData?.division || !sectionData.lShape) return null;
  if (!isKitchenSectionLayoutActive()) return null;
  if (isKitchenStraightBaseBandSection(sectionData)) return null;
  const div = sectionData.division;
  if (div.uShape === true) return null;
  // User-ширины низа не блокируют mid-карман на боковой стене.
  const userWidths = sectionHasUserEditedCustomZoneWidths(sectionData);

  const seatAway =
    sectionData.lShape.kitchenCornerSeatAway === true ||
    div.kitchenCornerSeatAway === true;
  const hostAt = div.kitchenCornerHostAtStart;
  let hasSpecial = !seatAway && typeof hostAt === 'boolean';
  let specialAtStart = hasSpecial && hostAt === true;
  if (!hasSpecial && !seatAway) {
    const hand = sectionData.lShape.kitchenCornerHostHand;
    if (hand === 'left') {
      hasSpecial = true;
      specialAtStart = true;
    } else if (hand === 'right') {
      hasSpecial = true;
      specialAtStart = false;
    } else {
      const reserves = sectionData._kitchenJointReserves;
      if (reserves && typeof reserves === 'object') {
        for (const r of Object.values(reserves)) {
          if (!r || r.isHost !== true || typeof r.atStart !== 'boolean') continue;
          hasSpecial = true;
          specialAtStart = r.atStart === true;
          break;
        }
      }
    }
  }
  const specialW = hasSpecial ? resolveKitchenCornerSpecialWidthMm() : 0;

  const start = Number(div.sectionStart);
  const end = Number(div.sectionEnd);
  let span =
    Number.isFinite(start) && Number.isFinite(end) && end > start
      ? Math.round(end - start)
      : 0;
  if (!(span > 0)) {
    const wall = String(sectionData.wallName || div.wallName || 'back');
    const sz = sectionData.size || {};
    span = Math.round(
      wall === 'left' || wall === 'right'
        ? Number(sz.x) || Number(sz.z) || 0
        : Number(sz.x) || Number(sz.z) || 0
    );
  }
  if (!(span > 0)) return null;

  const basePlan = _planKitchenLArmWidthsMm(
    span,
    hasSpecial,
    specialAtStart,
    specialW
  );
  if (!basePlan) return null;

  if (!userWidths) {
    if (hasSpecial) div.freeSizeMm = basePlan.freeMm;
    else if (!(Number(div.freeSizeMm) > 0)) div.freeSizeMm = basePlan.freeMm;

    div.parts = basePlan.parts;
    div.partSize = basePlan.unitMm;
    div.customZoneWidthsMm = { ...basePlan.widthsMap };
    div.segmentsLShape = null;
    div.segmentsLShapeBack = null;
  }

  // Seat A only: host MID = special 600. Other arm / TOP — свободная 600-сетка.
  // Seat B не создаём.
  const upperMeta = _resolveLUpperCornerSpecialMeta(
    sectionData,
    hasSpecial,
    specialAtStart
  );
  let midPlan;
  let topPlan;
  if (upperMeta.hasSpecial) {
    midPlan =
      _planKitchenLArmWidthsMm(
        span,
        true,
        upperMeta.specialAtStart,
        upperMeta.specialW || KITCHEN_WALL_CORNER_DEFAULT_WIDTH_MM
      ) || basePlan;
    if (midPlan && typeof midPlan === 'object') {
      const hostDepth =
        upperMeta.depthMm >= 200 && upperMeta.depthMm <= 700
          ? upperMeta.depthMm
          : 350;
      const postMm = Math.max(0, Math.round(Number(upperMeta.postMm) || 40));
      midPlan = {
        ...midPlan,
        cornerInsetZi: -1,
        cornerSeatZi: -1,
        seatStartMm: 0,
        seatMm: Math.max(50, (upperMeta.specialW || 600) - hostDepth - postMm),
        hostDepthMm: hostDepth,
        postMm,
      };
    }
  } else {
    midPlan = _planKitchenLArmWidthsMm(span, false, true, 0) || basePlan;
    if (midPlan && typeof midPlan === 'object') {
      midPlan = {
        ...midPlan,
        specialZi: -1,
        specialW: 0,
        cornerInsetZi: -1,
        cornerSeatZi: -1,
        seatStartMm: 0,
        seatMm: 0,
      };
    }
  }
  topPlan = _planKitchenLArmWidthsMm(span, false, true, 0) || basePlan;
  if (topPlan && typeof topPlan === 'object') {
    topPlan = {
      ...topPlan,
      specialZi: -1,
      specialW: 0,
      cornerInsetZi: -1,
      cornerSeatZi: -1,
      seatStartMm: 0,
      seatMm: 0,
    };
  }

  ensureKitchenBandZoneGrids(sectionData);
  const grids = sectionData.kitchenBandGrids;
  if (!userWidths) {
    _writeBandGridPlan(grids, 'base', basePlan);
    markCustomZoneWidthsSource(sectionData, CUSTOM_ZONE_WIDTHS_SOURCE_AUTO);
  }
  _writeBandGridPlan(grids, 'mid', midPlan);
  _writeBandGridPlan(grids, 'top', topPlan);

  console.log('[L-FREE-ARM] 600+sacrifice', {
    sectionId: sectionData.id,
    wall: sectionData.wallName,
    base: {
      freeMm: basePlan.freeMm,
      parts: basePlan.parts,
      specialZi: basePlan.specialZi,
      specialW: basePlan.specialW,
      widths: Object.keys(basePlan.widthsMap).map((k) => basePlan.widthsMap[k]),
    },
    mid: {
      freeMm: midPlan.freeMm,
      parts: midPlan.parts,
      specialZi: midPlan.specialZi,
      specialW: midPlan.specialW,
      cornerSeatZi: midPlan.cornerSeatZi,
      seatStartMm: midPlan.seatStartMm,
      seatMm: midPlan.seatMm,
      widths: Object.keys(midPlan.widthsMap).map((k) => midPlan.widthsMap[k]),
    },
  });

  return {
    parts: basePlan.parts,
    freeParts: basePlan.freeParts,
    freeMm: basePlan.freeMm,
    specialZi: basePlan.specialZi,
    specialW: basePlan.specialW,
    sacrificeZi: basePlan.sacrificeZi,
    widthsMap: { ...basePlan.widthsMap },
    upperPlan: {
      parts: midPlan.parts,
      specialZi: midPlan.specialZi,
      specialW: midPlan.specialW,
      cornerSeatZi: midPlan.cornerSeatZi,
      seatStartMm: midPlan.seatStartMm,
      seatMm: midPlan.seatMm,
      widthsMap: { ...midPlan.widthsMap },
    },
  };
}

/**
 * Записать на прямую секцию сетку 600+жертва (все пояса + division) и sacrificeZi.
 * L/U / не-прямые — no-op. source = auto (не блокирует следующий reapply).
 */
export function applyKitchenStraight600SacrificeWidths(sectionData, availMm) {
  if (!sectionData?.division) return null;
  if (!isKitchenStraightBaseBandSection(sectionData)) return null;
  const plan = buildKitchenStraight600SacrificePlan(availMm);
  if (!(plan.parts > 0)) return null;

  const div = sectionData.division;
  div.parts = plan.parts;
  div.partSize = plan.unitMm;
  div.customZoneWidthsMm = { ...plan.widthsMap };

  ensureKitchenBandZoneGrids(sectionData);
  const grids = sectionData.kitchenBandGrids;
  for (const band of KITCHEN_BAND_IDS) {
    const g = grids?.[band];
    if (!g || typeof g !== 'object') continue;
    g.parts = plan.parts;
    g.customZoneWidthsMm = { ...plan.widthsMap };
    g.customZoneWidthsSource = CUSTOM_ZONE_WIDTHS_SOURCE_AUTO;
  }
  markCustomZoneWidthsSource(sectionData, CUSTOM_ZONE_WIDTHS_SOURCE_AUTO);
  try {
    setKitchenBandSacrificeZoneIndex(sectionData, 'base', plan.sacrificeZi);
  } catch (_) {}
  return plan;
}

function _normalizeCustomZoneWidthsSource(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (s === CUSTOM_ZONE_WIDTHS_SOURCE_USER) return CUSTOM_ZONE_WIDTHS_SOURCE_USER;
  if (s === CUSTOM_ZONE_WIDTHS_SOURCE_AUTO) return CUSTOM_ZONE_WIDTHS_SOURCE_AUTO;
  return null;
}

/**
 * Пометить origin ширин ячеек (save-compatible).
 * @param {'user'|'auto'} source
 * @param {{ bandId?: string, division?: boolean }} [opts]
 */
export function markCustomZoneWidthsSource(sectionData, source, opts) {
  const src = _normalizeCustomZoneWidthsSource(source);
  if (!src || !sectionData) return false;
  const touchDivision = opts?.division !== false;
  const bandId = _normalizeBandId(opts?.bandId);
  if (touchDivision && sectionData.division) {
    sectionData.division.customZoneWidthsSource = src;
  }
  try {
    ensureKitchenBandZoneGrids(sectionData);
    const grids = sectionData.kitchenBandGrids;
    if (!grids) return true;
    const bands = bandId ? [bandId] : KITCHEN_BAND_IDS;
    for (const b of bands) {
      if (grids[b] && typeof grids[b] === 'object') {
        grids[b].customZoneWidthsSource = src;
      }
    }
  } catch (_) {}
  return true;
}

/** Есть ли действительно ручные (карандаш/жест) ширины — не путать с авто-rescale. */
export function sectionHasUserEditedCustomZoneWidths(sectionData) {
  if (!sectionData) return false;
  if (
    _normalizeCustomZoneWidthsSource(sectionData.division?.customZoneWidthsSource) ===
    CUSTOM_ZONE_WIDTHS_SOURCE_USER
  ) {
    return true;
  }
  const grids = sectionData.kitchenBandGrids;
  if (!grids || typeof grids !== 'object') return false;
  for (const band of KITCHEN_BAND_IDS) {
    if (
      _normalizeCustomZoneWidthsSource(grids[band]?.customZoneWidthsSource) ===
      CUSTOM_ZONE_WIDTHS_SOURCE_USER
    ) {
      return true;
    }
  }
  return false;
}

/** Число ячеек для новой прямой секции: ceil(widthMm / 600), минимум 1 (= N×600 + жертва). */
export function kitchenStraightInitialPartsCount(widthMm) {
  const w = Math.max(0, Number(widthMm) || 0);
  if (!(w > 0)) return 0;
  return Math.max(1, Math.ceil(w / KITCHEN_STRAIGHT_INITIAL_CELL_MAX_MM));
}

/**
 * Выставить parts всех поясов (и division.parts) в targetCount.
 * Существующие ширины/pin zi < target сохраняются; хвостовые обрезаются.
 * Новые ячейки без ширины — их заполнит rescale (пустые, без копирования мебели).
 * Не трогает balancer и алгоритм ceil(W/600) — только применяет уже посчитанный count.
 *
 * @returns {{ targetParts: number, changed: boolean, prevPartsByBand: object }|null}
 */
export function adjustKitchenBandPartsToTargetCount(sectionData, targetCount) {
  if (!sectionData?.division) return null;
  if (!isKitchenStraightBaseBandSection(sectionData)) return null;
  const target = Math.max(1, Math.floor(Number(targetCount) || 0));
  if (!(target > 0)) return null;
  ensureKitchenBandZoneGrids(sectionData);
  const grids = sectionData.kitchenBandGrids;
  if (!grids) return null;

  const prevPartsByBand = Object.create(null);
  let changed = false;
  for (const band of KITCHEN_BAND_IDS) {
    const g = grids[band];
    if (!g || typeof g !== 'object') continue;
    const prev = Math.max(0, Math.floor(Number(g.parts) || 0));
    prevPartsByBand[band] = prev;
    if (prev === target) continue;
    changed = true;
    const nextW = Object.create(null);
    const nextPin = Object.create(null);
    const srcW = g.customZoneWidthsMm;
    const srcPin = g.pinnedZoneWidthsMm;
    for (let z = 0; z < target; z++) {
      const w = Math.round(Number(srcW?.[z] ?? srcW?.[String(z)]) || 0);
      if (w > 0) nextW[z] = w;
      const p = Math.round(Number(srcPin?.[z] ?? srcPin?.[String(z)]) || 0);
      if (p > 0) nextPin[z] = p;
    }
    g.parts = target;
    g.customZoneWidthsMm = nextW;
    g.pinnedZoneWidthsMm = nextPin;
  }

  const prevDivParts = Math.max(0, Math.floor(Number(sectionData.division.parts) || 0));
  if (prevDivParts !== target) {
    sectionData.division.parts = target;
    changed = true;
  }
  // Зеркало base → division widths (только сохранённые zi; rescale добьёт).
  try {
    const baseW = grids.base?.customZoneWidthsMm;
    if (baseW && typeof baseW === 'object' && Object.keys(baseW).length > 0) {
      sectionData.division.customZoneWidthsMm = _cloneCustomZoneWidthsMm(baseW);
    }
  } catch (_) {}

  return { targetParts: target, changed, prevPartsByBand };
}

/**
 * Карта oldZi → newZi при смене parts с якорями пенала на краях.
 * occupiedZis — отсортированные занятые зоны (мебель), без дыр.
 *
 * - только правый пенал → pack вправо (пустые слева)
 * - только левый → pack влево (пустые справа)
 * - оба → края 0 и newParts-1, пустые между средним блоком и правым
 *
 * @returns {{ map: Record<number, number>, mode: string }|null}
 */
export function buildKitchenTallEdgeOccupiedZoneRemap(
  newParts,
  occupiedZis,
  opts
) {
  const newN = Math.max(1, Math.floor(Number(newParts) || 0));
  const occ = Array.isArray(occupiedZis)
    ? occupiedZis
        .map((z) => Math.floor(Number(z)))
        .filter((z) => Number.isFinite(z) && z >= 0)
        .sort((a, b) => a - b)
        .filter((z, i, arr) => i === 0 || z !== arr[i - 1])
    : [];
  if (!(newN > 0) || occ.length === 0) return null;
  if (occ.length > newN) return null;

  const leftTall = opts?.leftTall === true;
  const rightTall = opts?.rightTall === true;
  const map = Object.create(null);

  if (leftTall && rightTall) {
    if (occ.length < 2) return null;
    const leftZi = occ[0];
    const rightZi = occ[occ.length - 1];
    const mid = occ.slice(1, -1);
    if (1 + mid.length > newN - 1) return null;
    map[leftZi] = 0;
    map[rightZi] = newN - 1;
    for (let i = 0; i < mid.length; i++) map[mid[i]] = 1 + i;
    return { map, mode: 'both' };
  }

  if (rightTall && !leftTall) {
    const start = newN - occ.length;
    for (let i = 0; i < occ.length; i++) map[occ[i]] = start + i;
    return { map, mode: 'right' };
  }

  if (leftTall && !rightTall) {
    for (let i = 0; i < occ.length; i++) map[occ[i]] = i;
    return { map, mode: 'left' };
  }

  // Без пенала: pack влево (хвост пустой) — совместимо с прежним adjust.
  for (let i = 0; i < occ.length; i++) map[occ[i]] = i;
  return { map, mode: 'tail' };
}

/**
 * Применить zone remap к ширинам/pin одного пояса и выставить parts.
 * Ячейки без записи в map не переносятся (дыры/хвост схлопываются).
 */
export function applyKitchenBandZoneRemapToGrid(bandGrid, newParts, zoneMap) {
  if (!bandGrid || typeof bandGrid !== 'object') return false;
  const newN = Math.max(1, Math.floor(Number(newParts) || 0));
  if (!(newN > 0) || !zoneMap || typeof zoneMap !== 'object') return false;
  const srcW = bandGrid.customZoneWidthsMm;
  const srcPin = bandGrid.pinnedZoneWidthsMm;
  const nextW = Object.create(null);
  const nextPin = Object.create(null);
  for (const key of Object.keys(zoneMap)) {
    const oldZi = Math.floor(Number(key));
    const newZi = Math.floor(Number(zoneMap[key]));
    if (!Number.isFinite(oldZi) || !Number.isFinite(newZi)) continue;
    if (newZi < 0 || newZi >= newN) continue;
    const w = Math.round(Number(srcW?.[oldZi] ?? srcW?.[String(oldZi)]) || 0);
    if (w > 0) nextW[newZi] = w;
    const p = Math.round(Number(srcPin?.[oldZi] ?? srcPin?.[String(oldZi)]) || 0);
    if (p > 0) nextPin[newZi] = p;
  }
  bandGrid.parts = newN;
  bandGrid.customZoneWidthsMm = nextW;
  bandGrid.pinnedZoneWidthsMm = nextPin;
  return true;
}

/**
 * parts + remap ширин/pin всех поясов по карте occupied→edge pack.
 * @returns {{ targetParts: number, changed: boolean, mode: string, map: object }|null}
 */
export function adjustKitchenBandPartsWithZoneRemap(
  sectionData,
  targetCount,
  zoneMap,
  mode
) {
  if (!sectionData?.division) return null;
  if (!isKitchenStraightBaseBandSection(sectionData)) return null;
  const target = Math.max(1, Math.floor(Number(targetCount) || 0));
  if (!(target > 0) || !zoneMap) return null;
  ensureKitchenBandZoneGrids(sectionData);
  const grids = sectionData.kitchenBandGrids;
  if (!grids) return null;

  let changed = false;
  for (const band of KITCHEN_BAND_IDS) {
    const g = grids[band];
    if (!g) continue;
    const prev = Math.max(0, Math.floor(Number(g.parts) || 0));
    applyKitchenBandZoneRemapToGrid(g, target, zoneMap);
    if (prev !== target) changed = true;
    else changed = true; // remap мог сдвинуть даже при том же parts
  }
  sectionData.division.parts = target;
  try {
    const baseW = grids.base?.customZoneWidthsMm;
    if (baseW && typeof baseW === 'object' && Object.keys(baseW).length > 0) {
      sectionData.division.customZoneWidthsMm = _cloneCustomZoneWidthsMm(baseW);
    } else if (sectionData.division.customZoneWidthsMm) {
      // оставить пустым — rescale заполнит
      sectionData.division.customZoneWidthsMm = _cloneCustomZoneWidthsMm(baseW);
    }
  } catch (_) {}

  return {
    targetParts: target,
    changed,
    mode: String(mode || ''),
    map: { ...zoneMap },
  };
}

/**
 * Равные ячейки в мм: сумма ровно totalMm (остаток +1 мм на первые rem ячеек).
 * @returns {number[]}
 */
export function splitEqualCellWidthsMm(totalMm, count) {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  const total = Math.max(0, Math.round(Number(totalMm) || 0));
  if (n <= 0) return [];
  const base = Math.floor(total / n);
  let rem = total - base * n;
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = base + (rem > 0 ? 1 : 0);
    if (rem > 0) rem -= 1;
  }
  return out;
}

export function isKitchenSectionLayoutActive() {
  return KITCHEN_SECTION_LAYOUT_ACTIVE === true;
}

function _cloneCustomZoneWidthsMm(src) {
  const out = Object.create(null);
  if (!src || typeof src !== 'object') return out;
  for (const k of Object.keys(src)) {
    const n = Math.round(Number(src[k]) || 0);
    if (n > 0) out[k] = n;
  }
  return out;
}

/** pinnedZoneWidthsMm: zi → зафиксированная ширина мм (карандаш / пенал). */
function _clonePinnedZoneWidthsMm(src) {
  return _cloneCustomZoneWidthsMm(src);
}

/**
 * Зафиксировать ячейку пояса: при смене отступа/длины секции ширина не едет.
 * Соседи (свободные) забирают delta.
 */
export function pinKitchenBandZoneWidthMm(sectionData, bandId, zoneIndex, widthMm) {
  if (!sectionData?.division) return false;
  if (!isKitchenStraightBaseBandSection(sectionData)) return false;
  const band = _normalizeBandId(bandId) || 'base';
  const zi = Math.floor(Number(zoneIndex));
  const w = Math.round(Number(widthMm) || 0);
  if (!Number.isFinite(zi) || zi < 0 || !(w > 0)) return false;
  ensureKitchenBandZoneGrids(sectionData);
  const g = sectionData.kitchenBandGrids?.[band];
  if (!g) return false;
  if (!g.pinnedZoneWidthsMm || typeof g.pinnedZoneWidthsMm !== 'object') {
    g.pinnedZoneWidthsMm = Object.create(null);
  }
  g.pinnedZoneWidthsMm[zi] = w;
  return true;
}

/** Снять фиксацию ячейки (сброс карандаша / clear). */
export function unpinKitchenBandZoneWidthMm(sectionData, bandId, zoneIndex) {
  if (!sectionData?.division) return false;
  const band = _normalizeBandId(bandId) || 'base';
  const zi = Math.floor(Number(zoneIndex));
  if (!Number.isFinite(zi) || zi < 0) return false;
  const g = sectionData.kitchenBandGrids?.[band];
  if (!g?.pinnedZoneWidthsMm || typeof g.pinnedZoneWidthsMm !== 'object') return false;
  delete g.pinnedZoneWidthsMm[zi];
  delete g.pinnedZoneWidthsMm[String(zi)];
  if (Object.keys(g.pinnedZoneWidthsMm).length === 0) {
    g.pinnedZoneWidthsMm = Object.create(null);
  }
  return true;
}

/**
 * Одна жертвенная ячейка секции: принимает все сужения (карандаш → накладки).
 * Хранится на BASE; MID/TOP читают то же.
 */
export function getKitchenBandSacrificeZoneIndex(sectionData, bandId) {
  if (!sectionData?.division) return -1;
  if (!isKitchenStraightBaseBandSection(sectionData)) return -1;
  ensureKitchenBandZoneGrids(sectionData);
  const base = sectionData.kitchenBandGrids?.base;
  const zi = Math.floor(Number(base?.sacrificeZoneIndex));
  if (Number.isFinite(zi) && zi >= 0) return zi;
  const band = _normalizeBandId(bandId) || 'base';
  if (band !== 'base') {
    const g = sectionData.kitchenBandGrids?.[band];
    const z2 = Math.floor(Number(g?.sacrificeZoneIndex));
    if (Number.isFinite(z2) && z2 >= 0) return z2;
  }
  return -1;
}

/** Запомнить жертву (только если ещё не задана, если opts.force). */
export function setKitchenBandSacrificeZoneIndex(sectionData, bandId, zoneIndex, opts) {
  if (!sectionData?.division) return false;
  if (!isKitchenStraightBaseBandSection(sectionData)) return false;
  const zi = Math.floor(Number(zoneIndex));
  if (!Number.isFinite(zi) || zi < 0) return false;
  ensureKitchenBandZoneGrids(sectionData);
  const force = opts?.force === true;
  const cur = getKitchenBandSacrificeZoneIndex(sectionData, 'base');
  if (!force && cur >= 0 && cur !== zi) return false;
  const grids = sectionData.kitchenBandGrids;
  if (grids?.base) grids.base.sacrificeZoneIndex = zi;
  const band = _normalizeBandId(bandId) || 'base';
  if (band !== 'base' && grids?.[band]) grids[band].sacrificeZoneIndex = zi;
  return true;
}

/**
 * Снимок legacy-сетки division → объект customZoneWidthsMm.
 * Пустой объект = «все зоны равные» (как сейчас без custom).
 */
export function snapshotDivisionZoneWidthsMm(division) {
  if (!division || typeof division !== 'object') return Object.create(null);
  return _cloneCustomZoneWidthsMm(division.customZoneWidthsMm);
}

function _normalizeBandId(bandId) {
  const b = String(bandId || '')
    .trim()
    .toLowerCase();
  if (b === 'base' || b === 'mid' || b === 'top') return b;
  return null;
}

function _bandGridFromLegacy(parts, legacyWidths) {
  return {
    parts: Math.max(0, Math.floor(Number(parts) || 0)),
    customZoneWidthsMm: _cloneCustomZoneWidthsMm(legacyWidths),
  };
}

/**
 * Независимые сетки BASE / MID / TOP на секции.
 * Хранение: sectionData.kitchenBandGrids = {
 *   base|mid|top: { parts, customZoneWidthsMm }
 * }
 * Legacy: если пояса ещё нет — инициализация из division.
 * После создания пояса division больше НЕ перезаписывает parts/ширины.
 * Place/UI пока читают division как раньше.
 *
 * @returns {object|null} kitchenBandGrids
 */
export function ensureKitchenBandZoneGrids(sectionData) {
  if (!sectionData?.division) return null;
  const div = sectionData.division;
  const legacyParts = Math.max(0, Math.floor(Number(div.parts) || 0));
  const legacy = snapshotDivisionZoneWidthsMm(div);

  let grids = sectionData.kitchenBandGrids;
  if (!grids || typeof grids !== 'object') {
    grids = Object.create(null);
    sectionData.kitchenBandGrids = grids;
  }

  for (const band of KITCHEN_BAND_IDS) {
    let g = grids[band];
    if (!g || typeof g !== 'object') {
      grids[band] = _bandGridFromLegacy(legacyParts, legacy);
      continue;
    }
    // Уже есть сетка пояса — parts и ширины независимы от division.
    const gp = Math.max(0, Math.floor(Number(g.parts) || 0));
    if (gp <= 0 && legacyParts > 0) {
      // Неполная запись (битый save) — один раз добить из division.
      g.parts = legacyParts;
    } else {
      g.parts = gp;
    }
    if (!g.customZoneWidthsMm || typeof g.customZoneWidthsMm !== 'object') {
      g.customZoneWidthsMm = _cloneCustomZoneWidthsMm(legacy);
    }
  }
  return grids;
}

/**
 * Сетка одного пояса (после ensure). Не меняет division.
 * @param {object} sectionData
 * @param {'base'|'mid'|'top'} bandId
 * @returns {{ parts: number, customZoneWidthsMm: object }|null}
 */
export function getKitchenBandZoneGrid(sectionData, bandId) {
  const band = _normalizeBandId(bandId);
  if (!band || !sectionData) return null;
  const grids = ensureKitchenBandZoneGrids(sectionData);
  return grids?.[band] || null;
}

/**
 * customZoneWidthsMm пояса (ссылка на объект в kitchenBandGrids).
 */
export function getKitchenBandCustomZoneWidthsMm(sectionData, bandId) {
  const g = getKitchenBandZoneGrid(sectionData, bandId);
  return g?.customZoneWidthsMm || null;
}

/**
 * Прямая секция без L/U — нижний ряд читает/пишет kitchenBandGrids.base.
 * Угол / Joint / U — false (остаётся division / спец-сегменты).
 */
export function isKitchenStraightBaseBandSection(sectionData) {
  if (!sectionData?.division) return false;
  if (sectionData.lShape) return false;
  const div = sectionData.division;
  if (div.uShape === true) return false;
  if (Array.isArray(div.segmentsLShape) && div.segmentsLShape.length > 0) return false;
  if (Array.isArray(div.segmentsLShapeBack) && div.segmentsLShapeBack.length > 0) {
    return false;
  }
  return true;
}

/**
 * Ширины для layout/place нижнего ряда на прямой секции.
 * Источник: kitchenBandGrids.base; пусто → legacy division (и однократная запись в base).
 * L/U: как раньше — division.customZoneWidthsMm.
 */
export function resolveKitchenBaseCustomZoneWidthsMmForLayout(sectionData) {
  const div = sectionData?.division;
  if (!div) return null;
  if (!isKitchenStraightBaseBandSection(sectionData)) {
    return div.customZoneWidthsMm && typeof div.customZoneWidthsMm === 'object'
      ? div.customZoneWidthsMm
      : null;
  }
  ensureKitchenBandZoneGrids(sectionData);
  const base = sectionData.kitchenBandGrids?.base;
  if (!base) return div.customZoneWidthsMm || null;
  const cur = base.customZoneWidthsMm;
  if (cur && typeof cur === 'object' && Object.keys(cur).length > 0) {
    return cur;
  }
  const legacy = snapshotDivisionZoneWidthsMm(div);
  if (Object.keys(legacy).length > 0) {
    base.customZoneWidthsMm = legacy;
    return base.customZoneWidthsMm;
  }
  return cur && typeof cur === 'object' ? cur : null;
}

/**
 * После правки ширин (карандаш): записать в kitchenBandGrids.base.
 * MID/TOP не трогаем. division зеркалим для старых зон/UI.
 * Число ячеек (parts) не меняем.
 */
export function mirrorCustomZoneWidthsToKitchenBaseGrid(sectionData) {
  if (!isKitchenStraightBaseBandSection(sectionData)) return false;
  const div = sectionData.division;
  if (!div) return false;
  ensureKitchenBandZoneGrids(sectionData);
  const base = sectionData.kitchenBandGrids?.base;
  if (!base) return false;
  if (div.customZoneWidthsMm && typeof div.customZoneWidthsMm === 'object') {
    base.customZoneWidthsMm = _cloneCustomZoneWidthsMm(div.customZoneWidthsMm);
  } else {
    base.customZoneWidthsMm = Object.create(null);
  }
  return true;
}

/**
 * Активный пояс для карандаша: из state.kitchenBandGridsView при включённом просмотре.
 * Иначе base (совместимость).
 * @param {{ enabled?: boolean, band?: string }|null|undefined} viewState
 */
export function resolveActiveKitchenBandEditId(viewState) {
  const vs = viewState && typeof viewState === 'object' ? viewState : null;
  if (vs && vs.enabled === true) {
    const b = _normalizeBandId(vs.band);
    if (b) return b;
  }
  return 'base';
}

/** parts пояса; если 0 — fallback division.parts */
export function getKitchenBandPartsForEdit(sectionData, bandId) {
  const band = _normalizeBandId(bandId) || 'base';
  ensureKitchenBandZoneGrids(sectionData);
  const g = sectionData?.kitchenBandGrids?.[band];
  const bp = Math.max(0, Math.floor(Number(g?.parts) || 0));
  if (bp > 0) return bp;
  return Math.max(0, Math.floor(Number(sectionData?.division?.parts) || 0));
}

/**
 * Ширины пояса для карандаша / баланса (ссылка или legacy snapshot).
 */
export function resolveKitchenBandCustomZoneWidthsMmForEdit(sectionData, bandId) {
  const band = _normalizeBandId(bandId) || 'base';
  if (!isKitchenStraightBaseBandSection(sectionData)) {
    return sectionData?.division?.customZoneWidthsMm || null;
  }
  if (band === 'base') {
    return resolveKitchenBaseCustomZoneWidthsMmForLayout(sectionData);
  }
  ensureKitchenBandZoneGrids(sectionData);
  const g = sectionData.kitchenBandGrids?.[band];
  if (!g) return null;
  const cur = g.customZoneWidthsMm;
  if (cur && typeof cur === 'object' && Object.keys(cur).length > 0) {
    return cur;
  }
  // Пусто = равные; не копируем BASE в MID/TOP молча.
  return cur && typeof cur === 'object' ? cur : Object.create(null);
}

/**
 * Записать ширины только в один пояс. Остальные не трогаем.
 * BASE → также зеркало в division (place нижнего ряда).
 */
export function writeKitchenBandZoneWidthsMm(sectionData, bandId, widthsByIndex) {
  if (!sectionData?.division) return false;
  if (!isKitchenStraightBaseBandSection(sectionData)) return false;
  const band = _normalizeBandId(bandId) || 'base';
  ensureKitchenBandZoneGrids(sectionData);
  const g = sectionData.kitchenBandGrids?.[band];
  if (!g) return false;
  const cloned = _cloneCustomZoneWidthsMm(widthsByIndex);
  g.customZoneWidthsMm = cloned;
  if (band === 'base') {
    sectionData.division.customZoneWidthsMm = _cloneCustomZoneWidthsMm(cloned);
  }
  // Карандаш — user; пустой сброс («Сбросить») — снова auto.
  let hasPositive = false;
  for (const k of Object.keys(cloned)) {
    if (Number(cloned[k]) > 0) {
      hasPositive = true;
      break;
    }
  }
  markCustomZoneWidthsSource(
    sectionData,
    hasPositive ? CUSTOM_ZONE_WIDTHS_SOURCE_USER : CUSTOM_ZONE_WIDTHS_SOURCE_AUTO,
    { bandId: band, division: band === 'base' }
  );
  return true;
}

/**
 * Раскладка ячеек пояса (place/fit).
 * Прямая: любой band. L/U: только mid/top из kitchenBandGrids (спец 600 host → сосед НШ1).
 * @returns {ReturnType<typeof buildKitchenEqualCellLayout>|null}
 */
export function buildKitchenBandCellLayoutForSection(sectionData, bandId, boundsOpt) {
  if (!sectionData?.division) return null;
  const band = _normalizeBandId(bandId) || 'mid';
  const straight = isKitchenStraightBaseBandSection(sectionData);
  if (!straight && band !== 'mid' && band !== 'top') return null;
  ensureKitchenBandZoneGrids(sectionData);
  const parts = Math.max(0, getKitchenBandPartsForEdit(sectionData, band));
  if (parts <= 0) return null;

  let sectionStart = Number(boundsOpt?.sectionStart);
  let sectionWidth = Number(boundsOpt?.sectionWidth);
  // Как оверлей «Ячейки»: всегда inner bounds, не stale division.sectionStart.
  if (!(sectionWidth > 10) || !Number.isFinite(sectionStart)) {
    try {
      const inner = computeSectionInnerBoundsU(sectionData);
      if (inner && Number(inner.innerWidthU) > 10) {
        sectionStart = Number(inner.innerStartU) || 0;
        sectionWidth = Number(inner.innerWidthU);
      }
    } catch (_) {}
  }
  if (!(sectionWidth > 10) || !Number.isFinite(sectionStart)) {
    const div = sectionData.division;
    sectionStart = Number(div.sectionStart) || 0;
    sectionWidth =
      Number(div.sectionWidth) ||
      Number(div.sectionEnd) - sectionStart ||
      0;
  }
  if (!(sectionWidth > 10)) return null;

  let custom = null;
  if (straight) {
    custom =
      band === 'base'
        ? resolveKitchenBaseCustomZoneWidthsMmForLayout(sectionData)
        : resolveKitchenBandCustomZoneWidthsMmForEdit(sectionData, band);
  } else {
    const g = sectionData.kitchenBandGrids?.[band];
    custom =
      g?.customZoneWidthsMm && typeof g.customZoneWidthsMm === 'object'
        ? g.customZoneWidthsMm
        : null;
  }

  return buildKitchenEqualCellLayout({
    sectionStart,
    sectionWidth: Math.max(0, sectionWidth),
    parts,
    customZoneWidthsMm: custom,
    minModuleW: KITCHEN_BAND_CELL_MIN_MM,
  });
}

/**
 * Когда официально меняется число ячеек (variant / setSectionParts) —
 * заново взять parts+ширины из division во все пояса.
 * Не путать с ensure: тот не затирает уже независимые parts.
 */
export function reseedKitchenBandGridsFromDivision(sectionData) {
  if (!sectionData?.division) return null;
  const div = sectionData.division;
  const parts = Math.max(0, Math.floor(Number(div.parts) || 0));
  const legacy = snapshotDivisionZoneWidthsMm(div);
  const grids = Object.create(null);
  for (const band of KITCHEN_BAND_IDS) {
    grids[band] = _bandGridFromLegacy(parts, legacy);
  }
  sectionData.kitchenBandGrids = grids;
  return grids;
}

/**
 * Сериализация сеток поясов для save (без Three/group).
 * @returns {object|null}
 */
export function serializeKitchenBandZoneGrids(sectionData) {
  const grids = sectionData?.kitchenBandGrids;
  if (!grids || typeof grids !== 'object') return null;
  const out = Object.create(null);
  let any = false;
  for (const band of KITCHEN_BAND_IDS) {
    const g = grids[band];
    if (!g || typeof g !== 'object') continue;
    const row = {
      parts: Math.max(0, Math.floor(Number(g.parts) || 0)),
      customZoneWidthsMm: _cloneCustomZoneWidthsMm(g.customZoneWidthsMm),
    };
    const src = _normalizeCustomZoneWidthsSource(g.customZoneWidthsSource);
    if (src) row.customZoneWidthsSource = src;
    const pins = _clonePinnedZoneWidthsMm(g.pinnedZoneWidthsMm);
    if (Object.keys(pins).length > 0) row.pinnedZoneWidthsMm = pins;
    const sac = Math.floor(Number(g.sacrificeZoneIndex));
    if (Number.isFinite(sac) && sac >= 0) row.sacrificeZoneIndex = sac;
    out[band] = row;
    any = true;
  }
  return any ? out : null;
}

/**
 * Восстановление сеток из save. Недостающие пояса — ensure из division.
 * @returns {object|null}
 */
export function applyKitchenBandZoneGrids(sectionData, gridsIn) {
  if (!sectionData?.division) return null;
  if (!gridsIn || typeof gridsIn !== 'object') {
    return ensureKitchenBandZoneGrids(sectionData);
  }
  const next = Object.create(null);
  for (const band of KITCHEN_BAND_IDS) {
    const src = gridsIn[band];
    if (!src || typeof src !== 'object') continue;
    const row = {
      parts: Math.max(0, Math.floor(Number(src.parts) || 0)),
      customZoneWidthsMm: _cloneCustomZoneWidthsMm(src.customZoneWidthsMm),
    };
    const origin = _normalizeCustomZoneWidthsSource(src.customZoneWidthsSource);
    if (origin) row.customZoneWidthsSource = origin;
    const pins = _clonePinnedZoneWidthsMm(src.pinnedZoneWidthsMm);
    if (Object.keys(pins).length > 0) row.pinnedZoneWidthsMm = pins;
    const sac = Math.floor(Number(src.sacrificeZoneIndex));
    if (Number.isFinite(sac) && sac >= 0) row.sacrificeZoneIndex = sac;
    next[band] = row;
  }
  sectionData.kitchenBandGrids = next;
  return ensureKitchenBandZoneGrids(sectionData);
}

/**
 * Пересчитать ширины ячеек одного пояса под новую длину секции.
 * parts пояса уже должны быть выставлены снаружи (в т.ч. после
 * adjustKitchenBandPartsToTargetCount). Здесь parts не меняем.
 * Канон: pinnedZoneWidthsMm держат ширину; свободные забирают delta (пропорция).
 * Без pin — пропорция всех + clamp 300…1200.
 *
 * @returns {number[]} итоговые ширины мм
 */
export function rescaleKitchenBandGridToAvailMm(bandGrid, availMm, opts) {
  const minMm = Math.max(
    1,
    Math.round(Number(opts?.minMm) || KITCHEN_BAND_CELL_MIN_MM)
  );
  const maxMm = Math.max(
    minMm,
    Math.round(Number(opts?.maxMm) || KITCHEN_BAND_CELL_MAX_MM)
  );
  const avail = Math.max(0, Math.round(Number(availMm) || 0));
  if (!bandGrid || typeof bandGrid !== 'object' || !(avail > 0)) return [];

  let parts = Math.max(0, Math.floor(Number(bandGrid.parts) || 0));
  if (parts <= 0) {
    bandGrid.parts = 0;
    bandGrid.customZoneWidthsMm = Object.create(null);
    return [];
  }

  const prev = [];
  const custom = bandGrid.customZoneWidthsMm;
  let weightSum = 0;
  for (let z = 0; z < parts; z++) {
    const c = Number(custom?.[z] ?? custom?.[String(z)]);
    const w = Number.isFinite(c) && c > 0 ? c : 1;
    prev[z] = w;
    weightSum += w;
  }
  if (!(weightSum > 0)) {
    prev.fill(1);
    weightSum = parts;
  }

  // Pin map: bandGrid + opts.extraPinnedZoneWidthsMm (напр. пенал).
  const pinnedRaw = Object.create(null);
  const fromGrid = bandGrid.pinnedZoneWidthsMm;
  if (fromGrid && typeof fromGrid === 'object') {
    for (const k of Object.keys(fromGrid)) {
      const zi = Math.floor(Number(k));
      const pw = Math.round(Number(fromGrid[k]) || 0);
      if (Number.isFinite(zi) && zi >= 0 && zi < parts && pw > 0) {
        pinnedRaw[zi] = pw;
      }
    }
  }
  const extra = opts?.extraPinnedZoneWidthsMm;
  if (extra && typeof extra === 'object') {
    for (const k of Object.keys(extra)) {
      const zi = Math.floor(Number(k));
      const pw = Math.round(Number(extra[k]) || 0);
      if (Number.isFinite(zi) && zi >= 0 && zi < parts && pw > 0) {
        pinnedRaw[zi] = pw;
      }
    }
  }

  const pinnedZs = [];
  const freeZs = [];
  for (let z = 0; z < parts; z++) {
    if (pinnedRaw[z] > 0) pinnedZs.push(z);
    else freeZs.push(z);
  }

  const widths = new Array(parts);
  if (pinnedZs.length > 0 && freeZs.length > 0) {
    let pinnedSum = 0;
    for (const z of pinnedZs) {
      const keep = Math.max(minMm, Math.min(maxMm, pinnedRaw[z]));
      widths[z] = keep;
      pinnedSum += keep;
    }
    let rem = avail - pinnedSum;
    if (rem < freeZs.length * minMm) {
      // Не хватает на min свободных — сначала жмём pin (иначе сумма ≠ avail).
      const needFree = freeZs.length * minMm;
      const pinBudget = Math.max(0, avail - needFree);
      if (pinnedSum > pinBudget && pinnedSum > 0) {
        let left = pinBudget;
        for (let i = 0; i < pinnedZs.length; i++) {
          const z = pinnedZs[i];
          if (i === pinnedZs.length - 1) {
            widths[z] = Math.max(minMm, Math.min(maxMm, left));
          } else {
            const share = Math.round((widths[z] / pinnedSum) * pinBudget);
            widths[z] = Math.max(minMm, Math.min(maxMm, share));
            left -= widths[z];
          }
        }
        pinnedSum = pinnedZs.reduce((s, z) => s + widths[z], 0);
        rem = avail - pinnedSum;
      }
    }
    let freeWeight = 0;
    for (const z of freeZs) freeWeight += prev[z];
    if (!(freeWeight > 0)) freeWeight = freeZs.length;
    for (const z of freeZs) {
      widths[z] = rem > 0 ? (prev[z] / freeWeight) * rem : minMm;
    }
  } else {
    // Нет pin или все pinned → прежняя пропорция по всем.
    for (let z = 0; z < parts; z++) {
      widths[z] = (prev[z] / weightSum) * avail;
    }
  }

  // Clamp + раздача slack. Pin: не трогаем, пока slack можно закрыть свободными.
  for (let z = 0; z < parts; z++) {
    widths[z] = Math.max(minMm, Math.min(maxMm, widths[z]));
  }
  let slack = avail - widths.reduce((s, w) => s + w, 0);
  const freeOrder = freeZs.length > 0 ? freeZs.slice() : null;
  const order =
    freeOrder && freeOrder.length > 0
      ? freeOrder.concat(pinnedZs)
      : (() => {
          const o = [];
          for (let z = 0; z < parts; z++) o.push(z);
          return o;
        })();
  for (let pass = 0; pass < parts * 4 && Math.abs(slack) >= 1; pass++) {
    const z = order[pass % order.length];
    if (slack > 0) {
      const room = maxMm - widths[z];
      if (room <= 0) continue;
      const add = Math.min(room, slack);
      widths[z] += add;
      slack -= add;
    } else {
      const room = widths[z] - minMm;
      if (room <= 0) continue;
      const take = Math.min(room, -slack);
      widths[z] -= take;
      slack += take;
    }
  }

  const out = Object.create(null);
  for (let z = 0; z < parts; z++) {
    out[z] = Math.round(widths[z]);
  }
  // Добить округление: сумма → avail. Сначала свободные, потом pin.
  let sum = 0;
  for (let z = 0; z < parts; z++) sum += out[z];
  let drift = avail - sum;
  const driftOrder =
    freeZs.length > 0 ? freeZs.concat(pinnedZs) : order;
  for (let i = 0; i < driftOrder.length && drift !== 0; i++) {
    const z = driftOrder[i];
    if (drift > 0 && out[z] < maxMm) {
      const add = Math.min(drift, maxMm - out[z]);
      out[z] += add;
      drift -= add;
    } else if (drift < 0 && out[z] > minMm) {
      const take = Math.min(-drift, out[z] - minMm);
      out[z] -= take;
      drift += take;
    }
  }

  bandGrid.parts = parts;
  bandGrid.customZoneWidthsMm = out;
  // Авто-rescale ≠ карандаш: не блокировать allSingles при смене отступов.
  // Но если ширины уже помечены user — origin не затирать (иначе следующий offset
  // решит, что customs «авто», и сбросит ручное деление).
  if (
    _normalizeCustomZoneWidthsSource(bandGrid.customZoneWidthsSource) !==
    CUSTOM_ZONE_WIDTHS_SOURCE_USER
  ) {
    bandGrid.customZoneWidthsSource = CUSTOM_ZONE_WIDTHS_SOURCE_AUTO;
  }
  const arr = [];
  for (let z = 0; z < parts; z++) arr.push(out[z]);
  return arr;
}

/**
 * Rescale всех поясов секции под avail мм.
 * parts не меняет — сначала adjustKitchenBandPartsToTargetCount при смене длины.
 * opts.extraPinnedByBand: { base|mid|top: { zi: mm } } — доп. pin (пенал).
 */
export function rescaleKitchenBandZoneGridsToAvailMm(sectionData, availMm, opts) {
  const grids = ensureKitchenBandZoneGrids(sectionData);
  if (!grids) return null;
  const result = Object.create(null);
  const extraByBand =
    opts?.extraPinnedByBand && typeof opts.extraPinnedByBand === 'object'
      ? opts.extraPinnedByBand
      : null;
  for (const band of KITCHEN_BAND_IDS) {
    const bandOpts = { ...opts };
    if (extraByBand?.[band]) {
      bandOpts.extraPinnedZoneWidthsMm = extraByBand[band];
    }
    result[band] = rescaleKitchenBandGridToAvailMm(grids[band], availMm, bandOpts);
  }
  // BASE → зеркало в division (place нижнего ряда читает base, legacy — division).
  try {
    if (isKitchenStraightBaseBandSection(sectionData) && sectionData.division) {
      const baseW = grids.base?.customZoneWidthsMm;
      if (baseW && typeof baseW === 'object' && Object.keys(baseW).length > 0) {
        sectionData.division.customZoneWidthsMm = _cloneCustomZoneWidthsMm(baseW);
      }
    }
  } catch (_) {}
  // division.customZoneWidthsMm мог остаться от прошлого auto — не считать user.
  if (
    sectionData?.division &&
    _normalizeCustomZoneWidthsSource(sectionData.division.customZoneWidthsSource) !==
      CUSTOM_ZONE_WIDTHS_SOURCE_USER
  ) {
    sectionData.division.customZoneWidthsSource = CUSTOM_ZONE_WIDTHS_SOURCE_AUTO;
  }
  return result;
}

try {
  if (typeof window !== 'undefined') {
    window.__cldIsKitchenSectionLayoutActive = isKitchenSectionLayoutActive;
  }
} catch (_) {}

/**
 * Дефолт ячейки НМУ = 1050.
 * Вручную W можно менять → меняется фасадная часть (W−D).
 * Приставка = D соседа, не от W.
 * @param {number=} _returnMmOpt не используется (D отдельно)
 */
export function resolveKitchenCornerSpecialWidthMm(_returnMmOpt) {
  return KITCHEN_CORNER_SPECIAL_WIDTH_MM;
}

/**
 * Ширина приставного ВМУ (верхняя под-ячейка).
 * Не наследовать W низа 1050: допустимо 300…900, иначе дефолт 600.
 */
export function resolveKitchenWallCornerWidthMm(groupOrMm) {
  const ok = (w) => w >= 300 && w <= 900;
  const n = Math.round(Number(groupOrMm) || 0);
  if (ok(n)) return n;
  const ud = groupOrMm && typeof groupOrMm === 'object' ? groupOrMm.userData || groupOrMm : null;
  if (ud) {
    const fromUd = Math.round(
      Number(ud.__kitchenCellWidthMm) || Number(ud.customWidthMm) || 0
    );
    if (ok(fromUd)) return fromUd;
  }
  return KITCHEN_WALL_CORNER_DEFAULT_WIDTH_MM;
}

/** @param {number=} returnMmOpt явный D (иначе project carcass) */
export function resolveKitchenCornerReturnMm(returnMmOpt) {
  const d = Math.round(Number(returnMmOpt) || 0);
  if (d > 0) return d;
  try {
    const api =
      typeof window !== 'undefined' ? window.__cldKitchenManufacturing : null;
    const carcass =
      api && typeof api.getProjectBaseCarcassDepthMm === 'function'
        ? Math.round(Number(api.getProjectBaseCarcassDepthMm()) || 0)
        : 0;
    if (carcass > 0) return carcass;
  } catch (_) {}
  return KITCHEN_CORNER_RETURN_MM;
}

/**
 * Place НМУ: D и боковой зазор (= rear) из настроек кухни 460/510/550,
 * как будто сосед будет той же глубины.
 * @returns {{ carcassMm: number, rearMm: number, worktopMm: number }}
 */
export function resolveKitchenCornerPlaceFromProject() {
  try {
    const api =
      typeof window !== 'undefined' ? window.__cldKitchenManufacturing : null;
    if (api && typeof api.resolveBaseCarcassDepthMm === 'function') {
      const depth = api.resolveBaseCarcassDepthMm({
        preferredCarcassDepthMm:
          typeof api.getProjectBaseCarcassDepthMm === 'function'
            ? api.getProjectBaseCarcassDepthMm()
            : undefined,
      });
      if (depth && depth.ok) {
        const carcassMm = Math.round(Number(depth.carcassDepthMm) || 0);
        const rearMm = Math.max(0, Math.round(Number(depth.rearOverhangMm) || 0));
        const worktopMm = Math.round(Number(depth.worktopDepthMm) || 600) || 600;
        if (carcassMm > 0) return { carcassMm, rearMm, worktopMm };
      }
    }
  } catch (_) {}
  const carcassMm = resolveKitchenCornerReturnMm();
  const worktopMm = 600;
  const rearMm = Math.max(0, worktopMm - 40 - carcassMm);
  return { carcassMm, rearMm, worktopMm };
}

/**
 * Vars приставки НМУ: return = D.
 * Якорь: зад вровень с соседом (свес сзади = rear). При D=550 rear=10 → зазор 10 у стены;
 * при D=460 rear=100 → зад уезжает вместе с НМ, стык нога|приставка на месте.
 *
 * @param {number} sectionWidthMm ячейка W (1050 или ручная)
 * @param {boolean} atMinU — угол у начала секции (cornerAtStart)
 * @param {number=} returnMmOpt явный D (карандаш / сосед)
 * @param {number=} clearMmOpt конструктивный зазор корпуса к стене (обычно 10), не путать с rear
 * @param {number=} returnWallGapMmOpt зазор приставки к боковой стене (= rear overhang стека); дефолт = clear
 */
export function buildKitchenCornerReturnVars(
  sectionWidthMm,
  atMinU,
  returnMmOpt,
  clearMmOpt,
  returnWallGapMmOpt
) {
  const clearRaw = Math.round(Number(clearMmOpt));
  const clear = Number.isFinite(clearRaw) && clearRaw >= 0 ? clearRaw : 10;
  const gapRaw = Math.round(Number(returnWallGapMmOpt));
  const wallGap =
    Number.isFinite(gapRaw) && gapRaw >= 0 ? gapRaw : clear;
  const ret = resolveKitchenCornerReturnMm(returnMmOpt);
  const sx = Math.max(0, Math.round(Number(sectionWidthMm) || 0));
  const atStart = atMinU === true;
  // Стык нога|приставка фиксирован при смене D: pos = W − wallGap − D
  // (wallGap=rear → при 550/10 и 460/100 один и тот же стык).
  const legMm = Math.max(0, sx - wallGap - ret);
  // Корпус под ногой+приставкой (без щели у стены): иначе пол «за» приставкой не следует.
  const corpusSpanMm = Math.max(0, sx - wallGap);
  const returnPosX = atStart ? wallGap : legMm;
  const corpusPosX = atStart ? wallGap : 0;
  return {
    side_wall_clearance_mm: clear,
    corner_return_mm: ret,
    // Уголок / карточка catalog_45: 40 мм на передней фаске (не 50, не D).
    corner_return_depth_mm: 40,
    corner_return_pos_x: returnPosX,
    corner_leg_mm: legMm,
    corner_corpus_span_mm: corpusSpanMm,
    corner_side_inset_mm: corpusPosX,
    corner_return_wall_gap_mm: wallGap,
  };
}

/**
 * Сторона приставки для карточки каталога (админ = комната).
 * Явно: cornerAtStart / clodisVariables.corner_at_start.
 * catalog_44 «Угловой левый» → atStart=true (приставка у начала / стены).
 *
 * @param {{ name?: string, catalog_type?: string, catalogType?: string, cornerAtStart?: boolean, clodisVariables?: object }|null|undefined} item
 * @returns {boolean}
 */
export function resolveKitchenCornerAtStartForCatalogCard(item) {
  const it = item && typeof item === 'object' ? item : {};
  const cv = it.clodisVariables && typeof it.clodisVariables === 'object' ? it.clodisVariables : {};
  if (typeof it.cornerAtStart === 'boolean') return it.cornerAtStart;
  if (cv.corner_at_start === true || cv.corner_at_start === 1 || cv.corner_at_start === '1') {
    return true;
  }
  if (cv.corner_at_start === false || cv.corner_at_start === 0 || cv.corner_at_start === '0') {
    return false;
  }
  const ct = String(it.catalog_type || it.catalogType || '')
    .trim()
    .toLowerCase();
  const nm = String(it.name || '').toLowerCase();
  if (ct === 'catalog_44' || /угловой/.test(nm)) {
    if (/прав/.test(nm) && !/лев/.test(nm)) return false;
    return true;
  }
  if (/прав/.test(nm)) return false;
  if (/лев/.test(nm)) return true;
  return true;
}

/**
 * Тот же калькулятор, что place в комнате — для админ-превью карточки НМУ.
 *
 * @param {{
 *   widthMm?: number,
 *   returnMm?: number,
 *   clearMm?: number,
 *   wallGapMm?: number,
 *   atStart?: boolean,
 *   item?: object|null,
 * }} opts
 * @returns {ReturnType<typeof buildKitchenCornerReturnVars>}
 */
export function resolveKitchenCornerVarsForCatalogCard(opts) {
  const o = opts && typeof opts === 'object' ? opts : {};
  const widthMm = Math.max(0, Math.round(Number(o.widthMm) || 1050));
  const atStart =
    typeof o.atStart === 'boolean'
      ? o.atStart
      : resolveKitchenCornerAtStartForCatalogCard(o.item || null);
  const clearRaw = Math.round(Number(o.clearMm));
  const clearMm = Number.isFinite(clearRaw) && clearRaw >= 0 ? clearRaw : 10;
  const gapRaw = Math.round(Number(o.wallGapMm));
  const wallGapMm = Number.isFinite(gapRaw) && gapRaw >= 0 ? gapRaw : clearMm;
  return buildKitchenCornerReturnVars(
    widthMm,
    atStart,
    o.returnMm,
    clearMm,
    wallGapMm
  );
}

/**
 * @param {{
 *   sectionStart: number,
 *   sectionWidth: number,
 *   parts: number,
 *   customZoneWidthsMm?: Record<string|number, number>|null,
 *   minModuleW?: number,
 * }} opts
 * @returns {{
 *   partSize: number,
 *   capCount: 0,
 *   sectionStart: number,
 *   moduleWidthsMm: number[],
 *   gapBeforeZone: number[],
 *   segments: Array<{type:'module', zoneIndex:number, startU:number, endU:number, doorKind:string, furnitureUuid:null}>,
 * }}
 */
export function buildKitchenEqualCellLayout(opts) {
  const sectionStart = Number(opts.sectionStart) || 0;
  const sectionWidth = Math.max(0, Number(opts.sectionWidth) || 0);
  let parts = Math.max(0, Math.floor(Number(opts.parts) || 0));
  const minModuleW = Math.max(1, Number(opts.minModuleW) || 300);

  if (parts <= 0 || sectionWidth <= 0) {
    return {
      partSize: 0,
      capCount: 0,
      sectionStart,
      moduleWidthsMm: [],
      gapBeforeZone: [],
      segments: [],
    };
  }

  const gapBeforeZone = new Array(parts).fill(0);
  let moduleWidthsMm = resolveKitchenModuleWidthsMm({
    parts,
    sectionWidth,
    customZoneWidthsMm: opts.customZoneWidthsMm,
    minModuleW,
  });
  const partSize =
    moduleWidthsMm.length > 0
      ? moduleWidthsMm.reduce((a, b) => a + b, 0) / moduleWidthsMm.length
      : sectionWidth / parts;

  const segments = [];
  let currentU = sectionStart;
  for (let z = 0; z < parts; z++) {
    const wz = moduleWidthsMm[z] != null ? moduleWidthsMm[z] : partSize;
    const startU = currentU;
    const endU = startU + wz;
    segments.push({
      type: 'module',
      zoneIndex: z,
      startU,
      endU,
      // Кухня: ячейки как на прямой allSingles — всегда однодверные
      // (двустворчатые только спец L углового НМ, не здесь).
      doorKind: 'single',
      furnitureUuid: null,
    });
    currentU = endU;
  }

  return {
    partSize,
    capCount: 0,
    sectionStart,
    moduleWidthsMm,
    gapBeforeZone,
    segments,
  };
}

/**
 * Ширины ячеек: custom где заданы, остаток поровну на free; иначе равные.
 * Без wardrobe 16mm caps.
 */
export function resolveKitchenModuleWidthsMm({
  parts,
  sectionWidth,
  customZoneWidthsMm,
  minModuleW = 300,
}) {
  const n = Math.max(0, Math.floor(Number(parts) || 0));
  const avail = Math.max(0, Number(sectionWidth) || 0);
  if (n <= 0) return [];

  const custom =
    customZoneWidthsMm && typeof customZoneWidthsMm === 'object'
      ? customZoneWidthsMm
      : null;

  if (!custom) {
    return splitEqualCellWidthsMm(avail, n);
  }

  const mask = [];
  let customSum = 0;
  let hasAny = false;
  for (let z = 0; z < n; z++) {
    const cw = Number(custom[z] ?? custom[String(z)]);
    if (Number.isFinite(cw) && cw > 0) {
      mask.push(cw);
      customSum += cw;
      hasAny = true;
    } else {
      mask.push(null);
    }
  }
  if (!hasAny) {
    return splitEqualCellWidthsMm(avail, n);
  }

  if (customSum > avail + 1) {
    const k = avail / customSum;
    for (let z = 0; z < n; z++) {
      if (mask[z] !== null) {
        mask[z] = Math.max(minModuleW, mask[z] * k);
      }
    }
    customSum = mask.reduce((s, v) => s + (v !== null ? v : 0), 0);
  }

  const remaining = Math.max(0, avail - customSum);
  const freeCount = mask.filter((v) => v === null).length;
  const freeWidth = freeCount > 0 ? remaining / freeCount : 0;
  return mask.map((v) => (v !== null ? v : freeWidth));
}

function _cohabitApi() {
  return typeof window !== 'undefined' ? window.__cldPlacementKindProfiles : null;
}

function _zoneCohabitSpecOf(grp) {
  const api = _cohabitApi();
  if (api && typeof api.resolveZoneCohabitSpecFromUserData === 'function') {
    return api.resolveZoneCohabitSpecFromUserData(grp?.userData, null);
  }
  const pk = String(grp?.userData?.__placementKindProfileId || grp?.userData?.__placementKind || '').trim();
  if (pk === 'kitchen_base' || pk === 'kitchen_base_gola' || pk === 'kitchen_base_corner') {
    return { role: 'base', group: 'kitchen_column', placementKindId: pk };
  }
  if (pk === 'kitchen_wall_mid' || pk === 'kitchen_wall_corner') {
    return { role: 'mid', group: 'kitchen_column', placementKindId: pk };
  }
  if (pk === 'kitchen_wall_top') {
    return { role: 'top', group: 'kitchen_column', placementKindId: pk };
  }
  if (pk === 'kitchen_tall') {
    return { role: 'full', group: 'kitchen_column', placementKindId: pk };
  }
  return { role: 'full', group: '', placementKindId: pk };
}

/** Можно ли добавить f в зону к уже сидящим (base+mid+top / пенал+top). */
function _canJoinKitchenZone(occupants, candidate) {
  if (!Array.isArray(occupants) || occupants.length === 0) return true;
  const api = _cohabitApi();
  const candSpec = _zoneCohabitSpecOf(candidate);
  if (!candSpec) return false;
  for (const occ of occupants) {
    const occSpec = _zoneCohabitSpecOf(occ);
    if (!occSpec) return false;
    if (api && typeof api.canCohabitInSameZone === 'function') {
      if (!api.canCohabitInSameZone(occSpec, candSpec)) return false;
      continue;
    }
    const roles = [String(occSpec.role || ''), String(candSpec.role || '')].sort();
    const pair = roles[0] + '+' + roles[1];
    if (pair === 'full+top') {
      if (
        occSpec.group &&
        candSpec.group &&
        occSpec.group === candSpec.group
      ) {
        continue;
      }
      return false;
    }
    if (occSpec.role === 'full' || candSpec.role === 'full') return false;
    if (
      !(
        occSpec.group &&
        candSpec.group &&
        occSpec.group === candSpec.group &&
        occSpec.role !== candSpec.role
      )
    ) {
      return false;
    }
  }
  return true;
}

/**
 * zoneIndex: сохранить валидный; иначе по порядку вдоль стены.
 * Cohabit (НМ base + НШ upper) делят один zoneIndex — нельзя разносить по разным ячейкам.
 * @returns {Map<string, number>}
 */
export function assignKitchenZonesSimple(furniture, parts, axis) {
  const assigned = new Map();
  const n = Math.max(0, Math.floor(Number(parts) || 0));
  if (n <= 0 || !Array.isArray(furniture)) return assigned;

  /** @type {Map<number, object[]>} */
  const byZone = new Map();
  const list = furniture.slice().sort((a, b) => {
    const za = typeof a.userData?.zoneIndex === 'number' ? a.userData.zoneIndex : 9999;
    const zb = typeof b.userData?.zoneIndex === 'number' ? b.userData.zoneIndex : 9999;
    if (za !== zb) return za - zb;
    const ua = axis === 'z' ? a.position.z : a.position.x;
    const ub = axis === 'z' ? b.position.z : b.position.x;
    return ua - ub;
  });

  const put = (f, z) => {
    assigned.set(f.uuid, z);
    if (!byZone.has(z)) byZone.set(z, []);
    byZone.get(z).push(f);
  };

  // 1) Сохранить свой zoneIndex, если зона пуста или модуль совместим с жильцами.
  for (const f of list) {
    const z0 = Number(f.userData?.zoneIndex);
    if (!(Number.isFinite(z0) && z0 >= 0 && z0 < n)) continue;
    const occ = byZone.get(z0) || [];
    if (_canJoinKitchenZone(occ, f)) put(f, z0);
  }

  // 2) Остальным — первая зона, куда можно подселить; иначе свободная/последняя.
  let nextFree = 0;
  const allocExclusive = () => {
    while (nextFree < n && (byZone.get(nextFree) || []).length > 0) nextFree += 1;
    if (nextFree >= n) return Math.max(0, n - 1);
    const z = nextFree;
    nextFree += 1;
    return z;
  };

  for (const f of list) {
    if (assigned.has(f.uuid)) continue;
    let placed = false;
    for (let z = 0; z < n; z++) {
      const occ = byZone.get(z) || [];
      if (_canJoinKitchenZone(occ, f)) {
        put(f, z);
        placed = true;
        break;
      }
    }
    if (!placed) put(f, allocExclusive());
  }
  return assigned;
}

if (typeof window !== 'undefined') {
  window.__cldKitchenSectionLayout = {
    active: KITCHEN_SECTION_LAYOUT_ACTIVE,
    isKitchenSectionLayoutActive,
    buildKitchenEqualCellLayout,
    resolveKitchenModuleWidthsMm,
    assignKitchenZonesSimple,
    KITCHEN_BAND_IDS,
    KITCHEN_BAND_CELL_MIN_MM,
    KITCHEN_BAND_CELL_MAX_MM,
    ensureKitchenBandZoneGrids,
    getKitchenBandZoneGrid,
    getKitchenBandCustomZoneWidthsMm,
    snapshotDivisionZoneWidthsMm,
    serializeKitchenBandZoneGrids,
    applyKitchenBandZoneGrids,
    rescaleKitchenBandZoneGridsToAvailMm,
    rescaleKitchenBandGridToAvailMm,
    isKitchenStraightBaseBandSection,
    resolveKitchenBaseCustomZoneWidthsMmForLayout,
    mirrorCustomZoneWidthsToKitchenBaseGrid,
    resolveActiveKitchenBandEditId,
    getKitchenBandPartsForEdit,
    resolveKitchenBandCustomZoneWidthsMmForEdit,
    writeKitchenBandZoneWidthsMm,
    adjustKitchenBandPartsToTargetCount,
    adjustKitchenBandPartsWithZoneRemap,
    buildKitchenTallEdgeOccupiedZoneRemap,
    applyKitchenBandZoneRemapToGrid,
    kitchenStraightInitialPartsCount,
    kitchenStraightSacrificeZoneIndex,
    buildKitchenStraight600SacrificePlan,
    applyKitchenStraight600SacrificeWidths,
    applyKitchenLFreeArm600SacrificeWidths,
    pinKitchenBandZoneWidthMm,
    unpinKitchenBandZoneWidthMm,
    getKitchenBandSacrificeZoneIndex,
    setKitchenBandSacrificeZoneIndex,
    markCustomZoneWidthsSource,
    sectionHasUserEditedCustomZoneWidths,
    CUSTOM_ZONE_WIDTHS_SOURCE_USER,
    CUSTOM_ZONE_WIDTHS_SOURCE_AUTO,
    buildKitchenBandCellLayoutForSection,
    reseedKitchenBandGridsFromDivision,
    KITCHEN_CORNER_SPECIAL_WIDTH_MM,
    KITCHEN_CORNER_RETURN_MM,
    KITCHEN_CORNER_FACADE_LEG_MM,
    KITCHEN_WALL_CORNER_DEFAULT_WIDTH_MM,
    resolveKitchenCornerSpecialWidthMm,
    resolveKitchenWallCornerWidthMm,
    resolveKitchenCornerReturnMm,
    resolveKitchenCornerPlaceFromProject,
    buildKitchenCornerReturnVars,
    resolveKitchenCornerAtStartForCatalogCard,
    resolveKitchenCornerVarsForCatalogCard,
  };
  window.__cldEnsureKitchenBandZoneGrids = ensureKitchenBandZoneGrids;
  window.__cldGetKitchenBandZoneGrid = getKitchenBandZoneGrid;
  window.__cldMirrorCustomZoneWidthsToKitchenBaseGrid = mirrorCustomZoneWidthsToKitchenBaseGrid;
  window.__cldResolveKitchenBaseCustomZoneWidthsMmForLayout =
    resolveKitchenBaseCustomZoneWidthsMmForLayout;
  window.__cldReseedKitchenBandGridsFromDivision = reseedKitchenBandGridsFromDivision;
  window.__cldApplyKitchenLFreeArm600SacrificeWidths =
    applyKitchenLFreeArm600SacrificeWidths;
}