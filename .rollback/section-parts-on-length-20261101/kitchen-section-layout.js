/**
 * Kitchen section / cell layout — только для кухни (Clodis-Kitchen).
 *
 * Шкафной section-cell engine здесь не живёт (caps / niche U-fit / parts-shrink /
 * corner-wardrobe). Пока stub: равные ячейки или customZoneWidthsMm.
 * Полный kitchen cell engine наращиваем поверх этого модуля.
 */

import { computeSectionInnerBoundsU } from '../sections/section-edge-trim-insets.js';

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
 * count = ceil(W / 600), ячейки ≤ 600 и максимально близки к 600.
 */
export const KITCHEN_STRAIGHT_INITIAL_CELL_MAX_MM = 600;

/** Происхождение customZoneWidthsMm: карандаш/жест vs авто-rescale. */
export const CUSTOM_ZONE_WIDTHS_SOURCE_USER = 'user';
export const CUSTOM_ZONE_WIDTHS_SOURCE_AUTO = 'auto';

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

/** Число ячеек для новой прямой секции: ceil(widthMm / 600), минимум 1. */
export function kitchenStraightInitialPartsCount(widthMm) {
  const w = Math.max(0, Number(widthMm) || 0);
  if (!(w > 0)) return 0;
  return Math.max(1, Math.ceil(w / KITCHEN_STRAIGHT_INITIAL_CELL_MAX_MM));
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
 * Раскладка ячеек одного пояса на прямой секции (place/fit верхних по MID).
 * sectionStart/Width — как у BASE (inner bounds); ширины — kitchenBandGrids[band].
 * @returns {ReturnType<typeof buildKitchenEqualCellLayout>|null}
 */
export function buildKitchenBandCellLayoutForSection(sectionData, bandId, boundsOpt) {
  if (!sectionData?.division) return null;
  if (!isKitchenStraightBaseBandSection(sectionData)) return null;
  const band = _normalizeBandId(bandId) || 'mid';
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

  const custom =
    band === 'base'
      ? resolveKitchenBaseCustomZoneWidthsMmForLayout(sectionData)
      : resolveKitchenBandCustomZoneWidthsMmForEdit(sectionData, band);

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
    next[band] = row;
  }
  sectionData.kitchenBandGrids = next;
  return ensureKitchenBandZoneGrids(sectionData);
}

/**
 * Пересчитать ширины ячеек одного пояса под новую длину секции.
 * Число ячеек (parts) сохраняется.
 * Канон: pinnedZoneWidthsMm держат ширину; свободные забирают delta (пропорция).
 * Без pin — как раньше: пропорция всех + clamp 300…1200.
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
 * Rescale всех поясов секции под avail мм. parts каждого пояса не трогаем.
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
    pinKitchenBandZoneWidthMm,
    unpinKitchenBandZoneWidthMm,
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
}