/**
 * Авто-стек полок: шаг, равномерно, фиксированные + авто в зоне.
 */
import { parseCatalogItemDataField } from './catalog-icon-aspect.js?v=20260705-shelf-even-room';
import { isFlatCatalogShelfModule } from './furniture-flat-shelf-detect.js?v=20260703-drawer-fix';

const DEFAULT_POLICY = Object.freeze({
  enabled: true,
  distribution: 'step',
  stepMm: 400,
  shelfThicknessMm: 16,
  bottomOffsetMm: 0,
  topOffsetMm: 0,
  mode: 'max_count',
  maxCount: 12,
  minGapMm: 50,
  fixedPositionsFromBottomMm: [],
});

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Включить: window.__CLD_SHELF_COUNT_DEBUG = true до Ctrl+F5, или ?shelfDebug=1 в URL. */
export function shelfCountDebugEnabled() {
  try {
    const g = typeof globalThis !== 'undefined' ? globalThis : window;
    if (g?.__CLD_SHELF_COUNT_DEBUG === true) return true;
    if (g?.__CLD_DEBUG === true) return true;
    if (typeof location !== 'undefined' && /(?:^|[?&])shelfDebug=1(?:&|$)/.test(location.search || '')) {
      return true;
    }
  } catch (_) {}
  return false;
}

export function logShelfCount(stage, payload) {
  if (!shelfCountDebugEnabled()) return;
  console.warn(`[CLD][SHELF-COUNT] ${stage}`, payload ?? '');
}

export function buildShelfGapDebug(layout, pivotBottomMm = 0) {
  const list = Array.isArray(layout?.positionsFromBottomMm) ? layout.positionsFromBottomMm : [];
  const t = Math.max(0, num(layout?.shelfThicknessMm, 0));
  if (!list.length) {
    return {
      pivotY: [],
      faceToFaceGaps: [],
      bottomGap: 0,
      topGap: 0,
    };
  }
  const pivotBase = Math.round(num(pivotBottomMm, 0));
  const pivotY = list.map((v) => Math.round(pivotBase + num(v, 0)));
  const faceToFaceGaps = [];
  for (let i = 1; i < pivotY.length; i += 1) {
    faceToFaceGaps.push(Math.round(pivotY[i] - pivotY[i - 1] - t));
  }
  const bottomGap = Math.round(pivotY[0] - t / 2 - pivotBase);
  const topGap = Math.round(
    pivotBase + Math.max(0, num(layout?.spanMm, 0)) - (pivotY[pivotY.length - 1] + t / 2)
  );
  return { pivotY, faceToFaceGaps, bottomGap, topGap };
}

export function countShelfModulesInTree(roots) {
  const arr = Array.isArray(roots) ? roots : roots ? [roots] : [];
  let count = 0;
  const stack = [...arr];
  while (stack.length) {
    const n = stack.pop();
    if (!n || typeof n !== 'object') continue;
    if (isShelfModuleNode(n)) count += 1;
    if (Array.isArray(n.children)) stack.push(...n.children);
  }
  return count;
}

/** module-полки + wall «Полка» (S_5PL в catalog_27). */
export function countShelfLikeNodesInTree(roots) {
  const arr = Array.isArray(roots) ? roots : roots ? [roots] : [];
  let moduleShelves = 0;
  let wallShelves = 0;
  const stack = [...arr];
  while (stack.length) {
    const n = stack.pop();
    if (!n || typeof n !== 'object') continue;
    const type = String(n.type || '').toLowerCase();
    const name = String(n.name || n.spec?.key || '').toLowerCase();
    if (isShelfModuleNode(n)) moduleShelves += 1;
    else if (type === 'wall' && /полк|shelf/i.test(name)) wallShelves += 1;
    if (Array.isArray(n.children)) stack.push(...n.children);
  }
  return { moduleShelves, wallShelves, total: moduleShelves + wallShelves };
}

function catalogItemDebugLabel(catalogItem) {
  if (!catalogItem || typeof catalogItem !== 'object') return '(none)';
  const parsed = parseCatalogItemDataField(catalogItem);
  const name = parsed.name ?? catalogItem.name ?? catalogItem.title ?? '';
  const id = catalogItem.id ?? parsed.id ?? '?';
  const ct = catalogItem.catalog_type ?? parsed.catalog_type ?? '';
  return `${name || ct || 'item'}#${id}`;
}

function normalizeFixedPositions(raw, span, thickness) {
  const list = Array.isArray(raw) ? raw : [];
  const t = Math.max(8, thickness);
  const maxPos = Math.max(0, span - t);
  const out = [];
  for (const v of list) {
    const p = Math.round(num(v, -1));
    if (p < 0 || p > maxPos) continue;
    if (out.some((x) => Math.abs(x - p) < t + 8)) continue;
    out.push(p);
  }
  return out.sort((a, b) => a - b);
}

export function normalizeShelfStackPolicy(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const p = { ...DEFAULT_POLICY, ...raw };
  p.enabled = p.enabled !== false;
  p.distribution = String(p.distribution || 'step').trim().toLowerCase();
  if (p.distribution === 'max_count' || p.distribution === 'fixed') p.distribution = 'mixed';
  if (!['step', 'even', 'even_fixed', 'mixed'].includes(p.distribution)) p.distribution = 'step';
  p.stepMm = Math.max(0, num(p.stepMm, DEFAULT_POLICY.stepMm));
  p.minGapMm = Math.max(0, num(p.minGapMm, DEFAULT_POLICY.minGapMm));
  p.shelfThicknessMm = Math.max(8, num(p.shelfThicknessMm, DEFAULT_POLICY.shelfThicknessMm));
  p.bottomOffsetMm = Math.max(0, num(p.bottomOffsetMm, DEFAULT_POLICY.bottomOffsetMm));
  p.topOffsetMm = Math.max(0, num(p.topOffsetMm, DEFAULT_POLICY.topOffsetMm));
  p.maxCount = Math.max(1, Math.floor(num(p.maxCount, DEFAULT_POLICY.maxCount)));
  p.mode = String(p.mode || 'max_count').trim().toLowerCase();
  const fixedRaw =
    p.fixedPositionsFromBottomMm ??
    p.fixedPositionsMm ??
    p.fixedSlots ??
    [];
  p.fixedPositionsFromBottomMm = Array.isArray(fixedRaw)
    ? fixedRaw.map((x) => (typeof x === 'object' ? num(x.posFromBottomMm ?? x.fromBottomMm, -1) : num(x, -1))).filter((x) => x >= 0)
    : [];
  return p;
}

export function defaultShelfStackPolicy() {
  return normalizeShelfStackPolicy({ ...DEFAULT_POLICY });
}

/** Равномерно: n полок, зазоры снизу / между / сверху равны (полки не у краёв). */
function evenPositions(span, n, t) {
  if (!(span > 0) || n < 1) return [];
  const gap = (span - n * t) / (n + 1);
  if (gap < 0) return [];
  return Array.from({ length: n }, (_, i) => Math.round(gap + i * (t + gap)));
}

/** Порядок индексов зазоров от центра к краям (для округления). */
export function centerOutwardGapOrder(nGaps) {
  if (nGaps < 1) return [];
  const mid = (nGaps - 1) / 2;
  const order = [];
  for (let d = 0; order.length < nGaps; d += 1) {
    const lo = Math.floor(mid - d);
    const hi = Math.ceil(mid + d);
    if (lo >= 0 && lo < nGaps && !order.includes(lo)) order.push(lo);
    if (hi >= 0 && hi < nGaps && hi !== lo && !order.includes(hi)) order.push(hi);
  }
  return order;
}

/** n зазоров, сумма = gapTotal; от центра — ceil, на краях — остаток. */
export function distributeGapsFromCenter(gapTotal, nGaps) {
  const total = Math.max(0, num(gapTotal, 0));
  const n = Math.max(1, Math.floor(num(nGaps, 0)));
  if (total <= 0) return Array.from({ length: n }, () => 0);
  const base = total / n;
  const gaps = new Array(n).fill(0);
  const order = centerOutwardGapOrder(n);
  let assigned = 0;
  for (let i = 0; i < order.length - 1; i += 1) {
    gaps[order[i]] = Math.ceil(base);
    assigned += gaps[order[i]];
  }
  gaps[order[order.length - 1]] = Math.max(0, Math.round(total - assigned));
  const diff = total - gaps.reduce((s, v) => s + v, 0);
  if (diff !== 0) gaps[order[order.length - 1]] += diff;
  return gaps;
}

/**
 * Равномерно, pivot.y=0: позиции **центра** полки от низа зоны (мм).
 * Правило: одинаковый целый зазор между полками, остаток уходит в последний (верхний) зазор.
 */
export function evenCenterPositions(span, n, t) {
  const S = Math.max(0, num(span, 0));
  const N = Math.max(0, Math.floor(num(n, 0)));
  if (!(S > 0) || N < 1) return [];
  const T = Math.max(8, num(t, 16));
  const gapsCount = N + 1;
  const totalGap = S - N * T;
  if (totalGap < 0) return [];
  // Базовый ровный зазор. Остаток раскладываем симметрично по краям,
  // чтобы не появлялся "один 308" внутри стека.
  const gapBase = Math.max(0, Math.round(totalGap / gapsCount));
  const gaps = new Array(gapsCount).fill(gapBase);
  let diff = Math.round(totalGap - gapBase * gapsCount);
  let edge = 0;
  while (diff !== 0 && edge < gapsCount) {
    const step = diff > 0 ? 1 : -1;
    const lo = edge;
    const hi = gapsCount - 1 - edge;
    gaps[lo] = Math.max(0, gaps[lo] + step);
    diff -= step;
    if (diff === 0) break;
    if (hi !== lo) {
      gaps[hi] = Math.max(0, gaps[hi] + step);
      diff -= step;
      if (diff === 0) break;
    }
    edge += 1;
  }
  const centers = [];
  let cursor = gaps[0] + T / 2;
  for (let i = 0; i < N; i += 1) {
    centers.push(Math.round(cursor));
    const nextGap = gaps[i + 1] ?? gapBase;
    cursor += T + nextGap;
  }
  for (let i = 1; i < centers.length; i += 1) {
    if (centers[i] <= centers[i - 1]) centers[i] = centers[i - 1] + 1;
  }
  return centers.map((v) => Math.max(0, Math.min(Math.round(S), v)));
}

/** Внутренняя высота между боковинами: s:y − 2·t (1950 → 1918). */
export function resolveClearShelfSpanMm(sectionSizeY, wallThicknessMm = 16) {
  const y = Math.max(0, num(sectionSizeY, 0));
  const wt = Math.max(8, num(wallThicknessMm, 16));
  return Math.max(0, y - 2 * wt);
}

/** Линия середины корпуса (как s:y/2): 1950 → 975. */
export function resolveCorpusCenterYMm(sectionSizeY) {
  const y = Math.max(0, num(sectionSizeY, 0));
  return Math.round(y / 2);
}

function applyShelfCenterPivot(node) {
  if (!node || typeof node !== 'object') return;
  node.pivot =
    node.pivot && typeof node.pivot === 'object'
      ? { ...node.pivot, y: 0 }
      : { x: -1, y: 0, z: -1 };
}

/** Макс. число полок: even + pivot по центру — зазор между кромками ≈ span/(n+1) − t. */
function countEvenShelves(span, p, t, useCenterAnchor = true) {
  const cap = Math.max(1, Math.floor(num(p.maxCount, 1)));
  const minGap = Math.max(0, num(p.stepMm, 0));
  let n = cap;
  if (minGap > 0) {
    for (; n >= 1; n -= 1) {
      const edgeGap = useCenterAnchor
        ? span / (n + 1) - t
        : (span - n * t) / (n + 1);
      if (edgeGap >= minGap - 0.5) break;
    }
    if (n < 1) n = 1;
  }
  return Math.min(n, cap);
}

/** По шагу (как раньше). */
function stepPositions(span, p, t) {
  const gap = Math.max(0, num(p.stepMm, 0));
  const unit = t + gap;
  let n = unit > 0 ? Math.floor((span + gap) / unit) : 1;
  if (n < 1) n = 1;
  if (n > p.maxCount) n = p.maxCount;
  while (n > 1 && n * t + (n - 1) * gap > span + 0.5) n -= 1;
  return Array.from({ length: n }, (_, i) => Math.round(i * (t + gap)));
}

/** Фиксированные + остальные равномерно в свободных интервалах между ними. */
function mixedPositions(span, p, t) {
  const nTotal = Math.max(1, p.maxCount);
  const minGap = Math.max(0, num(p.minGapMm, 0));
  const pinned = normalizeFixedPositions(p.fixedPositionsFromBottomMm, span, t).slice(0, nTotal);
  const rem = nTotal - pinned.length;
  if (rem <= 0) return pinned;

  const intervals = [];
  let cursor = 0;
  for (const pos of pinned) {
    if (pos >= cursor + t + minGap) {
      intervals.push({ start: cursor, end: pos, len: pos - cursor });
    }
    cursor = pos + t;
  }
  if (span >= cursor + t + minGap) {
    intervals.push({ start: cursor, end: span, len: span - cursor });
  }

  if (!intervals.length) {
    return evenPositions(span, rem, t).concat(pinned).sort((a, b) => a - b).slice(0, nTotal);
  }

  const totalLen = intervals.reduce((s, iv) => s + iv.len, 0);
  const slots = intervals.map((iv) => {
    const maxFit =
      minGap > 0
        ? Math.max(0, Math.floor((iv.len + minGap) / (t + minGap)))
        : Math.max(0, Math.floor(iv.len / (t + minGap)));
    return { iv, maxFit, alloc: 0 };
  });

  let left = rem;
  for (const s of slots) {
    const share = totalLen > 0 ? (s.iv.len / totalLen) * rem : 0;
    s.alloc = Math.min(s.maxFit, Math.floor(share));
    left -= s.alloc;
  }
  while (left > 0) {
    let pick = null;
    for (const s of slots) {
      if (s.alloc >= s.maxFit) continue;
      const slack = s.maxFit - s.alloc;
      if (!pick || slack > pick.slack) pick = { s, slack };
    }
    if (!pick) break;
    pick.s.alloc += 1;
    left -= 1;
  }

  const auto = [];
  for (const s of slots) {
    if (s.alloc < 1) continue;
    const positions = evenPositions(s.iv.len, s.alloc, t);
    for (const rel of positions) {
      auto.push(Math.round(s.iv.start + rel));
    }
  }

  return [...pinned, ...auto].sort((a, b) => a - b).slice(0, nTotal);
}

/**
 * Позиции нижнего края полок от низа зоны (после отступов), мм.
 */
export function computeShelfLayout(span, policy, shelfThicknessOverride) {
  const p = normalizeShelfStackPolicy(policy) || { ...DEFAULT_POLICY };
  if (!(span > 0)) return null;
  const t = Math.max(8, num(shelfThicknessOverride, num(p.shelfThicknessMm, 16)));
  let positions = [];
  let evenGapMm = 0;
  if (p.distribution === 'even') {
    const n = countEvenShelves(span, p, t);
    positions = evenCenterPositions(span, n, t);
    evenGapMm = n > 0 ? (span - n * t) / (n + 1) : 0;
  } else if (p.distribution === 'even_fixed') {
    let n = Math.max(1, Math.floor(num(p.maxCount, 1)));
    while (n > 1 && (span - n * t) / (n + 1) < 0) n -= 1;
    positions = evenCenterPositions(span, n, t);
    evenGapMm = n > 0 ? (span - n * t) / (n + 1) : 0;
  } else if (p.distribution === 'mixed') {
    positions = mixedPositions(span, p, t);
  } else {
    positions = stepPositions(span, p, t);
  }
  if (!positions.length) return null;
  const step = positions.length > 1 ? positions[1] - positions[0] : t + num(p.stepMm, 0);
  return {
    count: positions.length,
    shelfThicknessMm: t,
    positionsFromBottomMm: positions,
    positionAnchor:
      p.distribution === 'even' || p.distribution === 'even_fixed' ? 'center' : 'bottom',
    pivotStepMm: step,
    gapMm:
      p.distribution === 'even' || p.distribution === 'even_fixed' ? evenGapMm : num(p.stepMm, 0),
    distribution: p.distribution,
  };
}

/** Высота зоны для расчёта: even — вся зона; step/mixed — минус отступы снизу/сверху. */
export function resolveShelfSpanInZone(zoneHeightMm, policy) {
  const p = normalizeShelfStackPolicy(policy) || { ...DEFAULT_POLICY };
  const h = Math.max(0, num(zoneHeightMm, 0));
  if (p.distribution === 'even' || p.distribution === 'even_fixed') {
    return { span: h, insetBottomMm: 0, insetTopMm: 0 };
  }
  const insetBottom = Math.max(0, num(p.bottomOffsetMm, 0));
  const insetTop = Math.max(0, num(p.topOffsetMm, 0));
  return {
    span: Math.max(0, h - insetBottom - insetTop),
    insetBottomMm: insetBottom,
    insetTopMm: insetTop,
  };
}

/** @deprecated alias */
export function computeShelfStack(span, policy, shelfThicknessOverride) {
  const layout = computeShelfLayout(span, policy, shelfThicknessOverride);
  if (!layout) return null;
  return {
    count: layout.count,
    shelfThicknessMm: layout.shelfThicknessMm,
    pivotStepMm: layout.pivotStepMm,
    gapMm: layout.gapMm,
  };
}

export function resolveShelfInteriorSpanMm(sectionSizeY, variables, policy) {
  const p = normalizeShelfStackPolicy(policy) || { ...DEFAULT_POLICY };
  const sy = Math.max(0, num(sectionSizeY, 0));
  const hBottom = Math.max(0, num(variables?.h_bottom, 0));
  const hTop = Math.max(0, num(variables?.h_top, 0));
  const tech = Math.max(0, num(variables?.tech_zone_mm, 0));
  const interior = Math.max(0, sy - hBottom - hTop - tech);
  const zoneSpan = resolveShelfSpanInZone(interior, p);
  const bottomInset = zoneSpan.insetBottomMm;
  const topInset = zoneSpan.insetTopMm;
  const span = zoneSpan.span;
  const pivotBottomMm = hBottom + bottomInset;
  return { interiorHeightMm: interior, span, pivotBottomMm, slotTopMm: hBottom + interior - topInset };
}

function findSectionRoots(roots) {
  const arr = Array.isArray(roots) ? roots : roots ? [roots] : [];
  const out = [];
  const stack = [...arr];
  while (stack.length) {
    const n = stack.pop();
    if (!n || typeof n !== 'object') continue;
    const t = String(n.type || '').toLowerCase();
    if (t === 'section' || t === 'fill_section') out.push(n);
    if (Array.isArray(n.children)) stack.push(...n.children);
  }
  return out.length ? out : arr.filter((n) => n && typeof n === 'object');
}

function cloneJson(v) {
  return JSON.parse(JSON.stringify(v));
}

export function isNestedFillCatalogModuleNode(n) {
  if (!n || typeof n !== 'object') return false;
  const et = String(n.spec?.element_type || '').trim().toLowerCase();
  return et === 'catalog_38' || et === 'catalog_37' || et === 'catalog_27';
}

export function collapseShelfTemplatesInTree(roots) {
  const rootsArr = Array.isArray(roots) ? roots : roots ? [roots] : [];
  for (const root of findSectionRoots(rootsArr)) {
    if (!Array.isArray(root.children)) continue;
    const shelfIndices = [];
    root.children.forEach((c, i) => {
      if (isShelfModuleNode(c) && !isNestedFillCatalogModuleNode(c)) shelfIndices.push(i);
    });
    if (shelfIndices.length <= 1) continue;
    const keep = root.children.filter((_, i) => !shelfIndices.includes(i));
    const template = root.children[shelfIndices[0]];
    const insertAt = shelfIndices[0];
    keep.splice(insertAt, 0, template);
    root.children = keep;
  }
}

export function isShelfModuleNode(n) {
  if (!n || typeof n !== 'object') return false;
  if (isNestedFillCatalogModuleNode(n)) return false;
  const type = String(n.type || '').toLowerCase();
  if (type !== 'module' && type !== 'model') return false;
  if (isFlatCatalogShelfModule(n)) return true;
  const et = String(n.spec?.element_type || '').trim().toLowerCase();
  const id = String(n.spec?.id ?? '').trim();
  const role = String(n.layout_role ?? n.sectionLayoutRole ?? '').trim().toLowerCase();
  if (role === 'drawer' || role === 'facade' || role === 'hinge' || role === 'rod') return false;
  if (role === 'shelf') return true;
  if ((et === 'catalog_29' || id === '29' || id === '6') && /полк|shelf/i.test(String(n.name || n.spec?.key || ''))) {
    return true;
  }
  const key = String(n.spec?.key || n.name || '').toLowerCase();
  return /полк|shelf/i.test(key) && !/ящик|планк/i.test(key);
}

/** Уже расставленные вручную полки (2+ на разных Y) — не перетирать авто-стеком. */
export function shouldPreserveManualShelfLayout(children) {
  if (!Array.isArray(children) || children.length < 2) return false;
  const shelves = children.filter((c) => isShelfModuleNode(c));
  if (shelves.length < 2) return false;
  const ys = new Set();
  for (const s of shelves) {
    const y = num(s?.pos?.y, NaN);
    if (Number.isFinite(y)) ys.add(Math.round(y));
  }
  return ys.size >= 2;
}

export function extractShelfStackPolicyFromCatalogItem(catalogItem) {
  if (!catalogItem || typeof catalogItem !== 'object') return null;
  const parsed = parseCatalogItemDataField(catalogItem);
  const raw = catalogItem.shelfStack ?? parsed.shelfStack ?? null;
  return normalizeShelfStackPolicy(raw);
}

/** Одна зона 100% «полки» — наполнение на всю высоту без штанги/50-50. */
export function isFullHeightShelvesOnlyLayout(layout) {
  if (!layout || typeof layout !== 'object') return true;
  const zones = Array.isArray(layout.zones) ? layout.zones : [];
  if (!zones.length) return true;
  if (zones.length !== 1) return false;
  const z = zones[0];
  const content = String(z?.content || 'shelves').toLowerCase();
  return content === 'shelves' && num(z?.heightPercent, 100) >= 99;
}

function defaultShelfEdgeInsetMm(policy) {
  const p = normalizeShelfStackPolicy(policy) || {};
  const fromMinGap = num(p.minGapMm, 0);
  if (fromMinGap >= 18) return Math.min(fromMinGap, 80);
  const fromStep = num(p.stepMm, 0);
  if (fromStep >= 18) return Math.min(fromStep, 80);
  return 18;
}

/**
 * 100% полки — зазоры у дна/крови (как в каталожных референсах).
 * 50/50 и зонная раскладка — политика без изменений (разделитель + логика в зоне).
 */
export function resolveShelfLayoutPolicy(policy, ctx = {}) {
  const p = normalizeShelfStackPolicy(policy);
  if (!p) return p;
  if (ctx.fiftyFiftyZone) return p;
  if (!ctx.fullHeightShelvesOnly) return p;

  if (p.distribution === 'step') {
    return { ...p, distribution: 'even' };
  }
  if (p.distribution === 'mixed') {
    const edge = defaultShelfEdgeInsetMm(p);
    return {
      ...p,
      bottomOffsetMm: num(p.bottomOffsetMm, 0) > 0 ? p.bottomOffsetMm : edge,
      topOffsetMm: num(p.topOffsetMm, 0) > 0 ? p.topOffsetMm : edge,
    };
  }
  return p;
}

export function applyShelfStackPolicyToRoots(roots, opts = {}) {
  const layout = opts.interiorLayout ?? opts.layout ?? null;
  const layoutCtx = {
    fullHeightShelvesOnly: isFullHeightShelvesOnlyLayout(layout),
    fiftyFiftyZone: !!opts.fiftyFiftyZone,
  };
  const p = resolveShelfLayoutPolicy(opts.policy || null, layoutCtx);
  if (!p?.enabled) return false;

  const sectionSizeY = Math.max(0, num(opts.sectionSizeMm?.y, 0));
  if (!(sectionSizeY > 0)) return false;

  const vars = opts.variables && typeof opts.variables === 'object' ? opts.variables : {};
  const wt = num(vars._wt, 0) > 0 ? num(vars._wt, 16) : 16;
  const thickness = num(p.shelfThicknessMm, wt) || wt;

  const interiorSpan = resolveShelfInteriorSpanMm(sectionSizeY, vars, p);
  const stack = computeShelfLayout(interiorSpan.span, p, thickness);
  if (!stack || stack.count < 1) {
    logShelfCount('applyShelfStack/skip-no-layout', {
      tag: opts.debugTag || '',
      sectionSizeY,
      span: interiorSpan.span,
      policy: p,
      resolved: p,
    });
    return false;
  }

  logShelfCount('applyShelfStack/plan', {
    tag: opts.debugTag || '',
    sectionSizeY,
    interiorHeightMm: interiorSpan.interiorHeightMm,
    span: interiorSpan.span,
    pivotBottomMm: interiorSpan.pivotBottomMm,
    policyRaw: opts.policy,
    policyResolved: p,
    shelfCount: stack.count,
    positionsY: stack.positionsFromBottomMm,
    anchor: stack.positionAnchor,
    ...buildShelfGapDebug(
      { ...stack, spanMm: interiorSpan.span },
      interiorSpan.pivotBottomMm
    ),
    h_bottom: vars.h_bottom,
    corpus_antresol_mm: vars.corpus_antresol_mm,
  });

  const rootsArr = Array.isArray(roots) ? roots : [roots];
  let changed = false;

  for (const root of findSectionRoots(rootsArr)) {
    if (!Array.isArray(root.children) || root.children.length === 0) continue;
    if (opts.preserveManualShelves !== false && shouldPreserveManualShelfLayout(root.children)) {
      logShelfCount('applyShelfStack/skip-manual', {
        tag: opts.debugTag || '',
        rootName: root.name,
        rootType: root.type,
      });
      continue;
    }
    const shelfIndices = [];
    root.children.forEach((c, i) => {
      if (isShelfModuleNode(c)) shelfIndices.push(i);
    });
    if (shelfIndices.length === 0) {
      logShelfCount('applyShelfStack/skip-no-shelf-nodes', {
        tag: opts.debugTag || '',
        rootName: root.name,
        rootType: root.type,
        childTypes: root.children.map((c) => c?.type).slice(0, 12),
      });
      continue;
    }

    logShelfCount('applyShelfStack/apply', {
      tag: opts.debugTag || '',
      rootName: root.name,
      templateShelvesBefore: shelfIndices.length,
      generating: stack.count,
    });
    const template = root.children[shelfIndices[0]];
    const firstIdx = shelfIndices[0];
    const keep = root.children.filter((_, i) => !shelfIndices.includes(i));
    const generated = [];

    const anchorCenter = stack.positionAnchor === 'center';
    const halfT = stack.shelfThicknessMm / 2;
    const yMin = interiorSpan.pivotBottomMm + (anchorCenter ? halfT : 0);
    const yMax =
      interiorSpan.pivotBottomMm +
      interiorSpan.span -
      (anchorCenter ? halfT : stack.shelfThicknessMm);

    stack.positionsFromBottomMm.forEach((posFromBottom, i) => {
      const d = cloneJson(template);
      d.id = `${template.id || 'shelf'}__stack_${i + 1}`;
      d.size = d.size && typeof d.size === 'object' ? { ...d.size } : {};
      d.pos = d.pos && typeof d.pos === 'object' ? { ...d.pos } : {};
      d.size.y = stack.shelfThicknessMm;
      let y = Math.round(interiorSpan.pivotBottomMm + posFromBottom);
      y = Math.max(y, yMin);
      y = Math.min(y, yMax);
      d.pos.y = y;
      if (anchorCenter) applyShelfCenterPivot(d);
      if (!d.layout_role && !d.sectionLayoutRole) d.layout_role = 'shelf';
      generated.push(d);
    });

    keep.splice(firstIdx, 0, ...generated);
    root.children = keep;
    changed = true;
  }

  return changed;
}

if (typeof globalThis !== 'undefined') {
  globalThis.__cldApplyShelfStackPolicyToRoots = applyShelfStackPolicyToRoots;
}
