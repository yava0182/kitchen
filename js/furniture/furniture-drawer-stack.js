/**
 * Runtime: авто-стек ящиков для standalone_floor (комод/тумба).
 * Пивот секции ящика = низ слота; фасад нависает ±facadeOverhangMm (catalog_29).
 * Шаг пивотов: drawerH + 2×overhang + gap (зазор между фасадами).
 * Зона стека = внутренний проём catalog_36: между дном и крышей корпуса (v:_wt с каждой стороны).
 */
import {
  resolveInteriorZoneSpansMm,
  isFiftyFiftyInteriorLayout,
  resolveFiftyFiftyZoneContext,
  normalizeFiftyFiftySplitShelfNodes,
  isShelfLikeFillModule,
  computeGlobalEvenShelfAbsYLines,
  applyRodZoneLayoutAfterDrawerStack,
} from './furniture-interior-layout.js?v=20260907-shelf-props';
import { normalizeShelfStackPolicy } from './furniture-shelf-stack.js?v=20260711-rod-slide-block';
import { parseCatalogItemDataField } from './catalog-icon-aspect.js?v=20260705-center-divider-room';

const DEFAULT_POLICY = Object.freeze({
  enabled: true,
  minHeightMm: 120,
  maxHeightMm: 200,
  gapMm: 5,
  facadeOverhangMm: 14.5,
  bottomOffsetMm: 0,
  topOffsetMm: 0,
  mode: 'max_count',
  maxCount: 8,
  depthModelRules: [],
});
const ROOM_STEPS_CONFIG_KEY = 'room_steps_config';

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizePolicy(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const p = { ...DEFAULT_POLICY, ...raw };
  p.enabled = p.enabled !== false;
  p.minHeightMm = Math.max(40, num(p.minHeightMm, DEFAULT_POLICY.minHeightMm));
  p.maxHeightMm = Math.max(p.minHeightMm, num(p.maxHeightMm, DEFAULT_POLICY.maxHeightMm));
  p.gapMm = Math.max(4, num(p.gapMm, DEFAULT_POLICY.gapMm));
  p.facadeOverhangMm = Math.max(0, num(p.facadeOverhangMm, DEFAULT_POLICY.facadeOverhangMm));
  p.bottomOffsetMm = Math.max(0, num(p.bottomOffsetMm, DEFAULT_POLICY.bottomOffsetMm));
  p.topOffsetMm = Math.max(0, num(p.topOffsetMm, DEFAULT_POLICY.topOffsetMm));
  p.maxCount = Math.max(1, Math.floor(num(p.maxCount, DEFAULT_POLICY.maxCount)));
  p.mode = String(p.mode || 'max_count').trim().toLowerCase();
  p.depthModelRules = normalizeDepthModelRules(p.depthModelRules);
  return p;
}

function normalizeDepthModelRules(raw) {
  const list = Array.isArray(raw) ? raw : [];
  return list
    .map((r, idx) => {
      const minDepthMm = Math.round(Math.max(0, num(r?.minDepthMm, 0)));
      const maxDepthMm = Math.round(Math.max(minDepthMm, num(r?.maxDepthMm, minDepthMm)));
      const drawerCatalogId = String(r?.drawerCatalogId ?? r?.catalogId ?? '').trim();
      const guideCatalogId = String(
        r?.guideCatalogId ?? r?.railKey ?? r?.drawerRailKey ?? ''
      ).trim();
      const order = Number.isFinite(Number(r?.order)) ? Number(r.order) : idx + 1;
      const name = String(r?.name || '').trim();
      if (!drawerCatalogId && !guideCatalogId) return null;
      return { minDepthMm, maxDepthMm, drawerCatalogId, guideCatalogId, order, name };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.minDepthMm - b.minDepthMm;
    });
}

let __drawerCatalog33Cache = null;
let __guideCatalog34Cache = null;
function readDrawerCatalog33Items() {
  if (Array.isArray(__drawerCatalog33Cache) && __drawerCatalog33Cache.length) {
    return __drawerCatalog33Cache;
  }
  let arr = [];
  try {
    const raw = localStorage.getItem('catalog_33');
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) arr = parsed;
  } catch (_) {}
  // Fallback (админ-превью): localStorage пуст, но каталог загружен в __CLD_CATALOGS_DATA.
  if (!arr.length) {
    try {
      const items = globalThis.__CLD_CATALOGS_DATA?.catalog_33?.items;
      if (items && typeof items === 'object') {
        arr = Object.keys(items).map((id) => {
          const it = items[id] && typeof items[id] === 'object' ? items[id] : {};
          const data = it.data && typeof it.data === 'object' ? it.data : it;
          return { id: String(it.id ?? id), data, name: it.name ?? data.name };
        });
      }
    } catch (_) {}
  }
  // Пустой результат не кэшируем — каталог мог ещё не загрузиться.
  __drawerCatalog33Cache = arr.length ? arr : null;
  return arr;
}

function readGuideCatalog34Items() {
  if (Array.isArray(__guideCatalog34Cache)) return __guideCatalog34Cache;
  try {
    const raw = localStorage.getItem('catalog_34');
    const arr = raw ? JSON.parse(raw) : [];
    __guideCatalog34Cache = Array.isArray(arr) ? arr : [];
  } catch (_) {
    __guideCatalog34Cache = [];
  }
  return __guideCatalog34Cache;
}

function collectGuideCatalogIdsFromDrawerItem(drawerItem) {
  const ids = [];
  const d = drawerItem?.data && typeof drawerItem.data === 'object' ? drawerItem.data : {};
  const direct = String(d.drawerGuideId ?? d.guideCatalogId ?? d.railCatalogId ?? '').trim();
  if (direct) ids.push(direct);
  const roots = [];
  if (Array.isArray(d.clodisJSON)) roots.push(...d.clodisJSON);
  const cs = d.constructor_structure;
  if (cs && typeof cs === 'object') roots.push(cs);
  const stack = [...roots];
  while (stack.length) {
    const n = stack.pop();
    if (!n || typeof n !== 'object') continue;
    const elType = String(n?.spec?.element_type || '').trim();
    const gid = String(n?.spec?.id ?? '').trim();
    if (elType === 'catalog_34' && gid) ids.push(gid);
    if (Array.isArray(n.children)) stack.push(...n.children);
  }
  return [...new Set(ids.map(String).filter(Boolean))];
}

function resolveGuideDepthMmByCatalogId(guideCatalogId) {
  const id = String(guideCatalogId || '').trim();
  if (!id) return 0;
  const items = readGuideCatalog34Items();
  const hit = items.find((it) => String(it?.id ?? '').trim() === id);
  if (!hit) return 0;
  const d = hit?.data && typeof hit.data === 'object' ? hit.data : {};
  const candidates = [d.guideLengthMm, d.guide_length_mm, d.lengthMm, d.length, d.depth, hit?.depth];
  for (const v of candidates) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return Math.round(n);
  }
  return 0;
}

function resolveDrawerCatalogIdFromRule(rule) {
  if (!rule || typeof rule !== 'object') return '';
  const byId = String(rule.drawerCatalogId || '').trim();
  if (byId) return byId;
  const guideCatalogId = String(rule.guideCatalogId || '').trim();
  if (!guideCatalogId) return '';
  const items = readDrawerCatalog33Items();
  if (!items.length) return '';
  const normalized = items
    .map((it) => {
      const id = String(it?.id ?? '').trim();
      const d = it?.data && typeof it.data === 'object' ? it.data : {};
      const directGuideId = String(d.drawerGuideId ?? d.guideCatalogId ?? d.railCatalogId ?? '').trim();
      const guideIdsFromTree = [];
      const stack = Array.isArray(d.clodisJSON) ? [...d.clodisJSON] : [];
      while (stack.length) {
        const n = stack.pop();
        if (!n || typeof n !== 'object') continue;
        const elType = String(n?.spec?.element_type || '').trim();
        const gid = String(n?.spec?.id ?? '').trim();
        if (elType === 'catalog_34' && gid) guideIdsFromTree.push(gid);
        if (Array.isArray(n.children)) stack.push(...n.children);
      }
      const order = Number(d.order ?? it?.order ?? 0) || 0;
      return {
        id,
        order,
        guideIds: [
          ...(directGuideId ? [directGuideId] : []),
          ...guideIdsFromTree
        ]
      };
    })
    .filter((x) => x.id && Array.isArray(x.guideIds) && x.guideIds.includes(guideCatalogId))
    .sort((a, b) => a.order - b.order);
  return normalized[0]?.id || '';
}

/** Глубина ящика = поле depth карточки catalog_33 (источник истины, как в карточке). */
function resolveDrawerCardDepthMmById(drawerCatalogId) {
  const id = String(drawerCatalogId || '').trim();
  if (!id) return 0;
  const items = readDrawerCatalog33Items();
  const hit = items.find((it) => String(it?.id ?? '').trim() === id);
  if (!hit) return 0;
  const d = hit?.data && typeof hit.data === 'object' ? hit.data : {};
  return Math.round(Math.max(0, num(d.depth, 0)));
}

function resolveDrawerFixedDepthMmById(drawerCatalogId) {
  const id = String(drawerCatalogId || '').trim();
  if (!id) return 0;
  const items = readDrawerCatalog33Items();
  if (!items.length) return 0;
  const hit = items.find((it) => String(it?.id ?? '').trim() === id);
  if (!hit) return 0;
  const guideIds = collectGuideCatalogIdsFromDrawerItem(hit);
  for (const gid of guideIds) {
    const guideDepthMm = resolveGuideDepthMmByCatalogId(gid);
    // Внутри catalog_29 корпус ящика обычно = `s:z - 16`, а фасад сидит на `pos.z = s:z - 16`.
    // Поэтому если направляющие "500", то хотим корпус 500, значит для s:z нужно 500 + 16.
    if (guideDepthMm > 0) return guideDepthMm + 16;
  }
  const d = hit?.data && typeof hit.data === 'object' ? hit.data : {};
  const candidates = [
    d.drawerDepthMm,
    d.drawer_depth_mm,
    d.fixedDrawerDepthMm,
    d.fixed_depth_mm,
    d.depth,
    hit?.depth,
  ];
  for (const v of candidates) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return Math.round(n);
  }
  return 0;
}

function resolveDrawerModelByDepth(depthMm, policy) {
  const rules = Array.isArray(policy?.depthModelRules) ? policy.depthModelRules : [];
  if (!rules.length) return null;
  const d = Math.max(0, Math.round(num(depthMm, 0)));
  for (const r of rules) {
    if (d >= r.minDepthMm && d <= r.maxDepthMm) {
      return { drawerCatalogId: r.drawerCatalogId, rule: r };
    }
  }
  return null;
}

/** Между пивотами: 2×нависание фасада + зазор между фасадами. */
function facadeBandMm(p) {
  const oh = Math.max(0, num(p.facadeOverhangMm, 0));
  return 2 * oh + Math.max(4, num(p.gapMm, 5));
}

/** Шаг пивота ящика i → i+1. */
export function drawerPivotStepMm(drawerHeightMm, policy) {
  const p = normalizePolicy(policy || null) || { ...DEFAULT_POLICY };
  const h = Math.max(0, num(drawerHeightMm, 0));
  return h + facadeBandMm(p);
}

function corpusWallThicknessMm(variables) {
  const wt = num(variables?._wt, 0);
  return wt > 0 ? wt : 16;
}

/**
 * Внутренний проём корпуса catalog_36 под секции ящиков.
 * Низ/верх пивота = openingBottom / openingTop; нависание фасада ±oh — в catalog_29.
 */
export function resolveDrawerCorpusSpanMm(sectionSizeY, variables, policy) {
  const p = normalizePolicy(policy || null) || { ...DEFAULT_POLICY };
  const sy = Math.max(0, num(sectionSizeY, 0));
  const hBottom = Math.max(0, num(variables?.h_bottom, 0));
  const hTop = Math.max(0, num(variables?.h_top, 0));
  const tech = Math.max(0, num(variables?.tech_zone_mm, 0));
  const wt = corpusWallThicknessMm(variables);
  const oh = Math.max(0, num(p.facadeOverhangMm, 0));

  const corpusHeightMm = Math.max(0, sy - hBottom - hTop - tech);
  const corpusTopMm = hBottom + corpusHeightMm;
  const openingBottomMm = hBottom + wt;
  const openingTopMm = corpusTopMm - wt;
  const interiorHeightMm = Math.max(0, openingTopMm - openingBottomMm);

  // Доп. отступы внутри проёма (мм); legacy bottomOffset 18 «от цоколя» игнорируем.
  const rawBottom = Math.max(0, num(p.bottomOffsetMm, 0));
  const rawTop = Math.max(0, num(p.topOffsetMm, 0));
  const bottomInset = rawBottom > 0 && rawBottom < wt ? rawBottom : 0;
  const topInset = rawTop > 0 && rawTop < wt ? rawTop : 0;
  const pivotBottomMm = openingBottomMm + bottomInset;
  const slotTopMm = openingTopMm - topInset;
  const span = Math.max(0, slotTopMm - pivotBottomMm);

  return {
    corpusHeightMm,
    corpusTopMm,
    openingBottomMm,
    openingTopMm,
    interiorHeightMm,
    span,
    pivotBottomMm,
    slotTopMm,
    facadeBottomMm: pivotBottomMm - oh,
    facadeTopMm: slotTopMm + oh,
  };
}

function findSectionRoots(roots) {
  const arr = Array.isArray(roots) ? roots : roots ? [roots] : [];
  return arr.filter((n) => n && typeof n === 'object' && String(n.type || '').toLowerCase() === 'section');
}

function cloneJson(v) {
  return JSON.parse(JSON.stringify(v));
}

function isDrawerModule(n) {
  if (!n || typeof n !== 'object') return false;
  if (String(n.type || '').toLowerCase() !== 'module') return false;
  const role = String(n.layout_role ?? n.sectionLayoutRole ?? '').trim().toLowerCase();
  if (role !== 'drawer') return false;
  return String(n.spec?.element_type || '').trim() === 'catalog_33';
}

/** N×h + (N−1)×band ≤ corpusSpan; верх последнего слота = slotTop. */
export function computeDrawerStack(corpusSpan, p) {
  if (!(corpusSpan > 0)) return null;

  // Gola НМ 2 ящика: фасад фиксирован 343 (не делим проём поровну).
  if (p && (p.golaTwoDrawer === true || p.mode === 'gola_two_drawer')) {
    const facadeH = Math.max(
      40,
      Math.round(num(p.facadeHeightMm, num(p.minHeightMm, 343)))
    );
    const gap = Math.max(4, num(p.gapMm, 34));
    const oh = Math.max(0, num(p.facadeOverhangMm, 0));
    const band = 2 * oh + gap;
    return {
      count: 2,
      drawerHeightMm: facadeH,
      pivotStepMm: facadeH + band,
      facadeHeightMm: facadeH,
      golaTwoDrawer: true,
    };
  }

  const band = facadeBandMm(p);
  const unit = p.minHeightMm + band;

  let n = unit > 0 ? Math.floor((corpusSpan + band) / unit) : 1;
  if (n < 1) n = 1;
  if (n > p.maxCount) n = p.maxCount;

  let h = (corpusSpan - (n - 1) * band) / n;

  while (h > p.maxHeightMm && n < p.maxCount) {
    n += 1;
    h = (corpusSpan - (n - 1) * band) / n;
  }
  while (h < p.minHeightMm && n > 1) {
    n -= 1;
    h = (corpusSpan - (n - 1) * band) / n;
  }
  if (!(h > 0)) return null;
  return { count: n, drawerHeightMm: h, pivotStepMm: drawerPivotStepMm(h, p) };
}

export function extractDrawerStackPolicyFromCatalogItem(catalogItem) {
  if (!catalogItem || typeof catalogItem !== 'object') return null;
  const parsed = parseCatalogItemDataField(catalogItem);
  const raw = parsed.drawerStack ?? catalogItem.drawerStack ?? null;
  const explicit = normalizePolicy(raw);
  const globalRules = readGlobalDrawerDepthRules();
  if (explicit) {
    if ((!Array.isArray(explicit.depthModelRules) || explicit.depthModelRules.length === 0) && globalRules.length) {
      explicit.depthModelRules = globalRules;
    }
    return explicit;
  }
  if (globalRules.length) {
    return normalizePolicy({ enabled: true, mode: 'max_count', depthModelRules: globalRules });
  }
  return null;
}

function readGlobalDrawerDepthRules() {
  try {
    // В комнате на отдельном порту /api/room_steps_config может быть недоступен (404).
    // Читаем только локальный snapshot без сетевых вызовов, чтобы не засорять консоль ошибками.
    const cfg =
      JSON.parse(localStorage.getItem(ROOM_STEPS_CONFIG_KEY) || 'null') ||
      (typeof window !== 'undefined' && window.__ROOM_STEPS_CONFIG_CACHE ? window.__ROOM_STEPS_CONFIG_CACHE : null);
    const raw = Array.isArray(cfg?.drawerDepthRulesGlobal) ? cfg.drawerDepthRulesGlobal : [];
    return normalizeDepthModelRules(raw);
  } catch (_) {
    return [];
  }
}

function clearDrawerModuleCatalogTreeCache(node) {
  if (!node || typeof node !== 'object') return;
  if (node.spec && typeof node.spec === 'object') {
    delete node.spec.template_tree;
    delete node.spec.templates;
  }
  node.children = [];
}

/**
 * Габарит карточки catalog_33 (для правил подбора / отладки). В рантайме дерево ящика по Z не патчим.
 */
export function resolveDrawerInteriorRefMmByCatalogId(drawerCatalogId, drawerSpec) {
  const id = String(drawerCatalogId || drawerSpec?.id || '').trim();
  if (!id) return null;
  const items = readDrawerCatalog33Items();
  const hit = items.find((it) => String(it?.id ?? '').trim() === id);
  if (!hit) return null;
  const d = hit?.data && typeof hit.data === 'object' ? hit.data : {};
  const w = Math.round(Math.max(0, num(d.width, 0)));
  const h = Math.round(Math.max(0, num(d.height, 0)));
  const dep = Math.round(Math.max(0, num(d.depth, 0)));
  const lockedZ = resolveDrawerFixedDepthMmById(id);
  const z = lockedZ > 0 ? lockedZ : dep;
  if (!(w > 0) || !(z > 0)) return null;
  return { x: w, y: h > 0 ? h : 0, z };
}

/**
 * Вложенный catalog_33 в комоде: дерево карточки (направляющие pos.z, s:z…) не трогаем.
 * Меняются только оболочка слота: ширина s:x, высота = слот стека; глубина — depthModelRules → depth_locked_mm.
 * @deprecated Используйте applyDrawerStackPolicyToRoots; функция оставлена как no-op для совместимости.
 */
export function applyDrawerInteriorRefToCatalog33Tree(templateChildren, drawerSpec, shellSize, moduleShell, opts = {}) {
  void templateChildren;
  void drawerSpec;
  void shellSize;
  void moduleShell;
  void opts;
  return null;
}

function resolveDrawerCatalogDisplayName(drawerCatalogId) {
  const id = String(drawerCatalogId || '').trim();
  if (!id) return '';
  const items = readDrawerCatalog33Items();
  const hit = items.find((it) => String(it?.id ?? '').trim() === id);
  return String(hit?.data?.name || hit?.name || '').trim();
}

/** Фасад ящика 16 мм впереди торца корпуса (legacy: pos.z=50 + s:z−34 при s:z=600 → +16). */
export const DRAWER_SLOT_FRONT_PROTRUSION_MM = 16;

export function resolveDrawerSlotFrontProtrusionMm(policy) {
  const oh = Math.round(Math.max(0, num(policy?.facadeOverhangMm, 0)));
  return Math.max(DRAWER_SLOT_FRONT_PROTRUSION_MM, oh);
}

function isDrawerPosZManual(moduleNode) {
  const spec = moduleNode?.spec;
  if (!spec || typeof spec !== 'object') return false;
  return (
    spec.drawer_pos_z_manual === true ||
    spec.manual_layout === true ||
    spec.keep_manual_layout === true
  );
}

/** pos.z слота: передний торец = s:z + protrusion (ящик выступает вперёд на толщину фасада). */
export function drawerSlotFrontPosZExpr(depthMm, frontProtrusionMm = DRAWER_SLOT_FRONT_PROTRUSION_MM) {
  const d = Math.round(Number(depthMm) || 0);
  const protrusion = Math.max(0, Math.round(Number(frontProtrusionMm) || 0));
  if (d > 0) {
    return protrusion > 0 ? `s:z-${d}+${protrusion}` : `s:z-${d}`;
  }
  return 50;
}

/**
 * Слот ящика в комоде: фиксированная глубина модели + привязка к фронту. Дерево catalog_33 внутри не меняем.
 * @returns {number} fixedDepthMm
 */
function normalizeDrawerNoHandleFlag(hit) {
  if (!hit || typeof hit !== 'object') return false;
  const d = hit.data && typeof hit.data === 'object' ? hit.data : hit;
  const p = hit.params && typeof hit.params === 'object' ? hit.params : {};
  const vals = [d?.drawerNoHandle, p?.drawerNoHandle, hit.drawerNoHandle];
  return vals.some((v) => v === true || v === 1 || v === '1');
}

/** Сброс кэша catalog_33 из localStorage (после выгрузки из админки). */
export function refreshDrawerCatalog33Cache() {
  __drawerCatalog33Cache = null;
  return readDrawerCatalog33Items();
}

function catalogItemHasBuildTree(hit) {
  if (!hit || typeof hit !== 'object') return false;
  const pick = (o) => {
    if (!o || typeof o !== 'object') return false;
    if (Array.isArray(o.clodisJSON) && o.clodisJSON.length) return true;
    const cs = o.constructor_structure;
    if (cs && typeof cs === 'object') return true;
    if (Array.isArray(o.template_tree) && o.template_tree.length) return true;
    return false;
  };
  return pick(hit) || pick(hit.data) || pick(hit.params);
}

/** Комната: __CLD_CATALOGS_DATA.catalog_33 — не затираем геометрию из админки/localStorage. */
export function syncDrawerCatalog33ToGlobalCache() {
  const items = refreshDrawerCatalog33Cache();
  if (!items.length) return false;
  globalThis.__CLD_CATALOGS_DATA = globalThis.__CLD_CATALOGS_DATA || {};
  const map =
    globalThis.__CLD_CATALOGS_DATA.catalog_33?.items &&
    typeof globalThis.__CLD_CATALOGS_DATA.catalog_33.items === 'object'
      ? { ...globalThis.__CLD_CATALOGS_DATA.catalog_33.items }
      : {};
  for (const it of items) {
    if (!it || typeof it !== 'object') continue;
    const id = String(it.id ?? it.data?.id ?? '').trim();
    if (!id) continue;
    const d = it.data && typeof it.data === 'object' ? it.data : it;
    const noHandle = normalizeDrawerNoHandleFlag(it);
    const prev = map[id];
    if (prev && catalogItemHasBuildTree(prev) && !catalogItemHasBuildTree(it)) {
      if (noHandle) {
        prev.drawerNoHandle = true;
        prev.data =
          prev.data && typeof prev.data === 'object' && !Array.isArray(prev.data)
            ? { ...prev.data, drawerNoHandle: true }
            : prev.data;
      }
      map[id] = prev;
      continue;
    }
    map[id] = {
      id,
      name: it.name || d.name || prev?.name || '',
      element_type: 'catalog_33',
      params: it.params || d.params || d || prev?.params,
      data: d && typeof d === 'object' ? d : prev?.data,
      drawerNoHandle: noHandle || prev?.drawerNoHandle === true,
    };
  }
  globalThis.__CLD_CATALOGS_DATA.catalog_33 = { items: map };
  return true;
}

let __drawerCatalog33ApiPromise = null;
let __drawerCatalog33ApiSynced = false;

/**
 * Комната: только патч drawerNoHandle в уже выгруженном catalog_33 (не перезаписываем clodisJSON).
 */
export async function ensureDrawerCatalog33FreshFromApi() {
  if (__drawerCatalog33ApiSynced) return true;
  if (__drawerCatalog33ApiPromise) return __drawerCatalog33ApiPromise;
  __drawerCatalog33ApiPromise = (async () => {
    try {
      const res = await fetch('/api/catalog/items_get/catalog_33?t=' + Date.now(), {
        cache: 'no-store',
      });
      if (!res.ok) return false;
      const payload = await res.json();
      const apiItems = Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload)
          ? payload
          : [];
      if (!apiItems.length) return false;

      let existing = [];
      try {
        const raw = globalThis.localStorage?.getItem('catalog_33');
        existing = raw ? JSON.parse(raw) : [];
      } catch (_) {}
      if (!Array.isArray(existing) || !existing.length) {
        return false;
      }

      const byId = new Map();
      for (const it of existing) {
        const id = String(it?.id ?? '').trim();
        if (id) byId.set(id, it);
      }
      let changed = false;
      for (const apiIt of apiItems) {
        if (!apiIt || typeof apiIt !== 'object') continue;
        const id = String(apiIt.id ?? apiIt.data?.id ?? '').trim();
        if (!id || !normalizeDrawerNoHandleFlag(apiIt)) continue;
        const prev = byId.get(id);
        if (!prev || typeof prev !== 'object') continue;
        prev.drawerNoHandle = true;
        prev.data =
          prev.data && typeof prev.data === 'object' && !Array.isArray(prev.data)
            ? { ...prev.data, drawerNoHandle: true }
            : { drawerNoHandle: true };
        byId.set(id, prev);
        changed = true;
      }
      if (changed) {
        try {
          globalThis.localStorage?.setItem('catalog_33', JSON.stringify([...byId.values()]));
        } catch (_) {}
        refreshDrawerCatalog33Cache();
        syncDrawerCatalog33ToGlobalCache();
      }
      __drawerCatalog33ApiSynced = true;
      return true;
    } catch (e) {
      console.warn('[DRAWER-NO-HANDLE] catalog_33 items_get sync failed', e);
      return false;
    } finally {
      __drawerCatalog33ApiPromise = null;
    }
  })();
  return __drawerCatalog33ApiPromise;
}

function normalizeDrawerCatalogId(raw) {
  const id = String(raw ?? '').trim();
  return id && id !== '0' ? id : '';
}

function readDrawerNoHandleByCatalogId(drawerCatalogId) {
  const id = normalizeDrawerCatalogId(drawerCatalogId);
  if (!id) return false;
  const readHit = normalizeDrawerNoHandleFlag;
  try {
    const maps = [
      globalThis.__CLD_CATALOGS_DATA?.catalog_33?.items,
      globalThis.parent?.__CLD_CATALOGS_DATA?.catalog_33?.items,
    ];
    for (const map of maps) {
      if (map && typeof map === 'object' && readHit(map[id])) return true;
    }
  } catch (_) {}
  const items = readDrawerCatalog33Items();
  const hit = items.find((it) => String(it?.id ?? '').trim() === id);
  return readHit(hit);
}

/** Проставить spec.drawer_no_handle у всех module→catalog_33 по карточкам catalog_33. */
export function stampDrawerNoHandleFlagsInTree(nodes) {
  if (!Array.isArray(nodes)) return nodes;
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    const t = String(node.type || '').toLowerCase();
    if (t === 'module') {
      const et = String(node.spec?.element_type || '').trim();
      if (et === 'catalog_33') {
        const cid = normalizeDrawerCatalogId(node.spec?.id ?? node.spec?.linked_item_id);
        if (resolveDrawerNoHandleForSlot(node, cid)) {
          node.spec = node.spec && typeof node.spec === 'object' ? { ...node.spec } : {};
          node.spec.drawer_no_handle = 1;
        }
      }
    }
    if (Array.isArray(node.children)) node.children.forEach(walk);
    if (Array.isArray(node.spec?.template_tree)) node.spec.template_tree.forEach(walk);
    if (Array.isArray(node.spec?.templates)) {
      for (const tpl of node.spec.templates) {
        const arr = tpl?.template?.tree;
        if (Array.isArray(arr)) arr.forEach(walk);
      }
    }
  };
  nodes.forEach(walk);
  return nodes;
}

function resolveDrawerNoHandleForSlot(moduleNode, drawerCatalogId, originalCatalogId) {
  const id = normalizeDrawerCatalogId(drawerCatalogId);
  if (!id) return false;
  const spec = moduleNode?.spec && typeof moduleNode.spec === 'object' ? moduleNode.spec : {};
  const originalId =
    normalizeDrawerCatalogId(originalCatalogId) ||
    normalizeDrawerCatalogId(spec.linked_item_id);
  const prevNoHandle =
    spec.drawer_no_handle === 1 ||
    spec.drawer_no_handle === true ||
    spec.drawer_no_handle === '1' ||
    spec.drawerNoHandle === true ||
    spec.drawerNoHandle === 1 ||
    spec.drawerNoHandle === '1';
  if (prevNoHandle) return true;
  if (readDrawerNoHandleByCatalogId(id)) return true;
  // depthModelRules: id слота 1→2/3 — флаг «без ручки» на карточке id=1.
  if (originalId && originalId !== id && readDrawerNoHandleByCatalogId(originalId)) return true;
  return false;
}

/** Шкаф: pos.z (число) + size.z уже доходят до переднего торца секции — как в превью админки. */
export function moduleDrawerCatalogSlotFitsDepth(moduleNode, sectionDepthMm, toleranceMm = 1.5) {
  if (!moduleNode || typeof moduleNode !== 'object') return false;
  const rawPosZ = moduleNode.pos?.z;
  if (rawPosZ === undefined || rawPosZ === null || rawPosZ === '') return false;
  if (typeof rawPosZ === 'string' && /s\s*:/i.test(String(rawPosZ).trim())) return false;
  const pz = Number(rawPosZ);
  const sz = Number(moduleNode.size?.z);
  const parentZ = Math.max(0, Number(sectionDepthMm) || 0);
  if (!Number.isFinite(pz) || pz < 0 || !Number.isFinite(sz) || !(sz > 0) || !(parentZ > 0)) {
    return false;
  }
  const front = pz + sz;
  const tol = Math.max(0.5, Number(toleranceMm) || 1.5);
  return front <= parentZ + tol && front >= parentZ - tol;
}

export function applyDrawerSlotDepthToModule(moduleNode, drawerCatalogId, opts = {}) {
  const id = normalizeDrawerCatalogId(drawerCatalogId);
  if (!moduleNode || typeof moduleNode !== 'object' || !id) return 0;
  const fixedDepthMm = resolveDrawerCardDepthMmById(id) || resolveDrawerFixedDepthMmById(id);
  const originalCatalogId = normalizeDrawerCatalogId(
    moduleNode.spec?.id ?? moduleNode.spec?.linked_item_id
  );
  moduleNode.spec = moduleNode.spec && typeof moduleNode.spec === 'object' ? { ...moduleNode.spec } : {};
  moduleNode.spec.id = id;
  moduleNode.spec.element_type = 'catalog_33';
  if (originalCatalogId && originalCatalogId !== id) {
    moduleNode.spec.linked_item_id = originalCatalogId;
  }
  if (resolveDrawerNoHandleForSlot(moduleNode, id, originalCatalogId)) {
    moduleNode.spec.drawer_no_handle = 1;
  }
  if (opts.modelId !== false) moduleNode.modelId = id;
  moduleNode.size = moduleNode.size && typeof moduleNode.size === 'object' ? { ...moduleNode.size } : {};
  moduleNode.pos = moduleNode.pos && typeof moduleNode.pos === 'object' ? { ...moduleNode.pos } : {};
  const preserveCatalogSlot =
    opts.preserveCatalogSlotLayout === true ||
    moduleDrawerCatalogSlotFitsDepth(moduleNode, opts.sectionDepthMm);
  if (fixedDepthMm > 0 && preserveCatalogSlot) {
    const shellZ = Math.max(0, Number(moduleNode.size?.z) || 0);
    moduleNode.spec.depth_locked_mm = shellZ > 0 ? shellZ : fixedDepthMm;
  } else if (fixedDepthMm > 0) {
    moduleNode.size.z = fixedDepthMm;
    // Fill / шкаф: pos.z из шаблона карточки, без +16 мм вперёд (комод — ниже).
    if (!isDrawerPosZManual(moduleNode) && opts.fillInterior !== true) {
      // Комната: слот вровень с cabinet_root (фасад 16 мм — внутри catalog_29). Превью админки: +16.
      let protrusion = 0;
      if (opts.forPreview === true) {
        if (Object.prototype.hasOwnProperty.call(opts, 'frontProtrusionMm')) {
          protrusion = Math.max(0, Math.round(Number(opts.frontProtrusionMm) || 0));
        } else {
          protrusion = resolveDrawerSlotFrontProtrusionMm(opts.policy);
        }
      }
      moduleNode.pos.z = drawerSlotFrontPosZExpr(fixedDepthMm, protrusion);
    }
    moduleNode.spec.depth_locked_mm = fixedDepthMm;
  } else if (Object.prototype.hasOwnProperty.call(moduleNode.spec, 'depth_locked_mm')) {
    delete moduleNode.spec.depth_locked_mm;
  }
  const displayName =
    resolveDrawerCatalogDisplayName(id) || String(opts.ruleName || '').trim();
  if (displayName) moduleNode.name = displayName;
  if (opts.clearTreeCache !== false) clearDrawerModuleCatalogTreeCache(moduleNode);
  if (preserveCatalogSlot) {
    const shellZ = Math.max(0, Number(moduleNode.size?.z) || 0);
    return shellZ > 0 ? shellZ : fixedDepthMm;
  }
  return fixedDepthMm;
}

function seedDrawerLockedDepthVariable(root, depthMm) {
  const d = Math.round(Number(depthMm) || 0);
  if (!(d > 0) || !root || typeof root !== 'object') return;
  root.variables = root.variables && typeof root.variables === 'object' ? root.variables : {};
  root.variables.main =
    root.variables.main && typeof root.variables.main === 'object'
      ? { ...root.variables.main }
      : {};
  root.variables.main.drawer_locked_depth_mm = d;
}

function resolveGolaTwoDrawerPolicyOverlay(placementKind, policy) {
  const pk = String(placementKind || '').trim();
  // 2×343 только у SKU kitchen_base_gola — не по флагу проекта на ordinary НМ.
  if (pk !== 'kitchen_base_gola') return null;
  let facadeH = 343;
  let gapMm = 34;
  try {
    const layout =
      typeof window !== 'undefined' &&
      typeof window.__cldResolveGolaTwoDrawerFacadeLayoutMm === 'function'
        ? window.__cldResolveGolaTwoDrawerFacadeLayoutMm({})
        : null;
    if (layout?.facadeHeightMm > 0) facadeH = Math.round(layout.facadeHeightMm);
    if (layout?.gapBetweenFacadesMm > 0) {
      gapMm = Math.max(4, Math.round(layout.gapBetweenFacadesMm));
    }
  } catch (_) {}
  return {
    ...(policy && typeof policy === 'object' ? policy : {}),
    enabled: true,
    golaTwoDrawer: true,
    mode: 'gola_two_drawer',
    maxCount: 2,
    minHeightMm: facadeH,
    maxHeightMm: facadeH,
    facadeHeightMm: facadeH,
    gapMm,
    facadeOverhangMm: 0,
  };
}

function countDrawerModulesInRoots(roots) {
  let n = 0;
  const rootsArr = Array.isArray(roots) ? roots : roots ? [roots] : [];
  for (const root of findSectionRoots(rootsArr)) {
    if (!Array.isArray(root.children)) continue;
    for (let i = 0; i < root.children.length; i++) {
      if (isDrawerModule(root.children[i])) n += 1;
    }
  }
  return n;
}

export function applyDrawerStackPolicyToRoots(roots, opts = {}) {
  const placementKind = String(opts.placementKind || '').trim();
  let p = normalizePolicy(opts.policy || null);
  const golaOverlay = resolveGolaTwoDrawerPolicyOverlay(placementKind, p);
  // Фасады 343 — только если в модуле уже ровно 2 ящика (не плодим второй).
  if (golaOverlay && countDrawerModulesInRoots(roots) === 2) {
    p = normalizePolicy(golaOverlay);
  }
  if (!p?.enabled) return false;
  // Тумба + навес + кухня НМ Gola (2×343): стек по высоте корпуса.
  const shouldAutoStack =
    placementKind === 'standalone_floor' ||
    placementKind === 'wall_hung' ||
    placementKind === 'wall_hung_low' ||
    placementKind === 'wall_hung_high' ||
    p.golaTwoDrawer === true;

  const sectionSizeY = Math.max(0, num(opts.sectionSizeMm?.y, 0));
  const sectionDepthMm = Math.max(0, num(opts.sectionSizeMm?.z, 0));
  if (!(sectionSizeY > 0) && !p.depthModelRules.length) return false;

  const vars = opts.variables || {};
  const layout = shouldAutoStack ? resolveDrawerCorpusSpanMm(sectionSizeY, vars, p) : null;
  const stack = shouldAutoStack && layout ? computeDrawerStack(layout.span, p) : null;
  if (shouldAutoStack && !stack && !p.depthModelRules.length) return false;

  const drawerH = stack ? Math.max(40, Math.round(stack.drawerHeightMm)) : 0;
  const step = stack ? Math.round(drawerPivotStepMm(drawerH, p)) : 0;
  const y0 = layout ? Math.round(layout.pivotBottomMm) : 0;

  const n = stack ? stack.count : 0;
  const usedSpan = stack ? (n - 1) * step + drawerH : 0;
  const heightSlack = layout && stack ? Math.round(layout.span - usedSpan) : 0;
  const lastDrawerH = stack ? drawerH + Math.max(0, heightSlack) : 0;

  const rootsArr = Array.isArray(roots) ? roots : [roots];
  const depthSelection = resolveDrawerModelByDepth(sectionDepthMm, p);
  let changed = false;
  for (const root of findSectionRoots(rootsArr)) {
    if (!Array.isArray(root.children) || root.children.length === 0) continue;
    const drawerIndices = [];
    root.children.forEach((c, i) => {
      if (isDrawerModule(c)) drawerIndices.push(i);
    });
    if (drawerIndices.length === 0) continue;
    // id из правила по глубине корпуса — если правило совпало; иначе берём собственный id слота.
    const ruleDrawerId =
      depthSelection?.drawerCatalogId || depthSelection?.rule?.guideCatalogId
        ? resolveDrawerCatalogIdFromRule(depthSelection.rule) || String(depthSelection.drawerCatalogId || '').trim()
        : '';
    if (!shouldAutoStack || !stack) {
      for (const idx of drawerIndices) {
        const d = root.children[idx];
        if (!d || typeof d !== 'object') continue;
        const targetId = ruleDrawerId || String(d.spec?.id ?? '').trim();
        if (!targetId) continue;
        const preserveSlot = moduleDrawerCatalogSlotFitsDepth(d, sectionDepthMm);
        const fixedDepthMm = applyDrawerSlotDepthToModule(d, targetId, {
          ruleName: depthSelection?.rule?.name,
          forPreview: opts.forPreview === true,
          policy: p,
          sectionDepthMm,
          preserveCatalogSlotLayout: preserveSlot,
          frontProtrusionMm: opts.forPreview ? resolveDrawerSlotFrontProtrusionMm(p) : 0,
        });
        if (fixedDepthMm > 0) seedDrawerLockedDepthVariable(root, fixedDepthMm);
        changed = true;
      }
      continue;
    }
    const template = root.children[drawerIndices[0]];
    const firstIdx = drawerIndices[0];
    const keep = root.children.filter((_, i) => !drawerIndices.includes(i));

    const generated = [];
    for (let i = 0; i < n; i += 1) {
      const d = cloneJson(template);
      d.id = `${template.id || 'drawer'}__stack_${i + 1}`;
      d.size = d.size && typeof d.size === 'object' ? d.size : {};
      d.pos = d.pos && typeof d.pos === 'object' ? d.pos : {};
      // Тумба/навес: сбросить «ручной Z» и слот шкафа (drawer_locked), иначе превью/роль ломают короб.
      if (d.spec && typeof d.spec === 'object') {
        delete d.spec.drawer_pos_z_manual;
        delete d.spec.manual_layout;
        delete d.spec.keep_manual_layout;
      }
      const zExpr = String(d.size.z ?? '');
      if (!zExpr || /drawer_locked/i.test(zExpr) || zExpr === 's:z' || zExpr === 's:y') {
        d.size.z = 's:z - 34';
        d.pos.z = 50;
      }
      const targetId = ruleDrawerId || String(d.spec?.id ?? '').trim();
      if (targetId) {
        const fixedDepthMm = applyDrawerSlotDepthToModule(d, targetId, {
          ruleName: depthSelection?.rule?.name,
          forPreview: opts.forPreview === true,
          policy: p,
          frontProtrusionMm: opts.forPreview ? resolveDrawerSlotFrontProtrusionMm(p) : 0,
          preserveCatalogSlotLayout: true,
        });
        if (fixedDepthMm > 0) seedDrawerLockedDepthVariable(root, fixedDepthMm);
      }
      d.size.y = i === n - 1 ? lastDrawerH : drawerH;
      d.pos.y = Math.round(y0 + i * step);
      generated.push(d);
    }
    keep.splice(firstIdx, 0, ...generated);
    root.children = keep;
    changed = true;
  }
  return changed;
}

function isFillDrawerTemplateModule(n) {
  if (!n || typeof n !== 'object') return false;
  if (String(n.type || '').toLowerCase() !== 'module') return false;
  const et = String(n.spec?.element_type || '').trim().toLowerCase();
  if (et === 'catalog_33' || et === '33') return true;
  const role = String(n.layout_role ?? n.sectionLayoutRole ?? '').trim().toLowerCase();
  if (role === 'drawer') return true;
  const name = String(n.name || n.spec?.key || '').toLowerCase();
  if (/ящик|drawer/i.test(name) && !/планк|facade|фасад/i.test(name)) return true;
  return false;
}

function isAutoDrawerTopShelfModule(n) {
  if (!n || typeof n !== 'object') return false;
  const type = String(n.type || '').toLowerCase();
  if (type !== 'module' && type !== 'wall') return false;
  const role = String(n.layout_role ?? n.sectionLayoutRole ?? '').trim().toLowerCase();
  return role === 'drawer_top_shelf';
}

function isDrawerZoneFillShelfModule(n) {
  if (!n || typeof n !== 'object') return false;
  const role = String(n.layout_role ?? n.sectionLayoutRole ?? '').trim().toLowerCase();
  return role === 'drawer_zone_fill_shelf';
}

function findFillSectionRoots(roots) {
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
  if (out.length) return out;
  // Превью админки: DOM отдаёт ящики/полки без обёртки fill_section — иначе apply молча не срабатывает.
  if (
    arr.length &&
    arr.some((n) => isFillDrawerTemplateModule(n) || isShelfLikeFillModule(n) || isAutoDrawerTopShelfModule(n))
  ) {
    return [
      {
        type: 'fill_section',
        id: '__synthetic_fill_section',
        children: arr,
        __cldFlatSourceArr: arr,
      },
    ];
  }
  return arr.filter((n) => n && typeof n === 'object');
}

function normalizeZoneDrawerRules(raw, policy) {
  const rr = raw && typeof raw === 'object' ? raw : {};
  const anchorRaw = String(rr.anchor || 'bottom').trim().toLowerCase();
  let anchor = 'bottom';
  if (anchorRaw === 'top' || anchorRaw === 'center') anchor = anchorRaw;
  else if (
    anchorRaw === 'below_center' ||
    anchorRaw === 'below_divider' ||
    anchorRaw === 'from_divider'
  ) {
    anchor = 'below_center';
  }
  const count = Math.max(0, Math.floor(num(rr.count, 0)));
  const gapRaw = rr.gapMm;
  // Зазор зоны наполнения (3 мм между корпусами catalog_33) ≠ gapMm стека фасадов drawerStack (часто 28 мм).
  const gapMm =
    gapRaw == null || gapRaw === ''
      ? Math.max(4, num(DEFAULT_POLICY.gapMm, 5))
      : Math.max(4, num(gapRaw, 5));
  return {
    anchor,
    offsetMm: Math.max(0, num(rr.offsetMm, 19)),
    count,
    gapMm,
    topShelfGapMm: Math.max(0, num(rr.topShelfGapMm, 26)),
    forceShelfAboveDrawers: rr.forceShelfAboveDrawers !== false,
  };
}

/** Якоря 50/50: одна сетка слотов, различается только направление роста count. */
function normalizeDrawerAnchor(anchor) {
  return String(anchor || 'bottom').trim().toLowerCase();
}

/** Рост от разделителя вниз — count снимаем снизу стека. */
export function isDrawerGrowFromDividerTop(anchor) {
  const a = normalizeDrawerAnchor(anchor);
  return a === 'below_center' || a === 'below_divider' || a === 'from_divider';
}

/** 50/50 нижняя зона ящиков (граница зоны = split). */
export function isFiftyFiftyLowerDrawerZone(zone, layout, interiorHeightMm) {
  if (!isFiftyFiftyInteriorLayout(layout)) return false;
  if (String(zone?.content || '').toLowerCase() !== 'drawers') return false;
  const H = Math.max(0, num(interiorHeightMm, 0));
  if (!(H > 0)) return false;
  const split = H / 2;
  const zBot = Math.max(0, num(zone?.bottomMm, 0));
  const zTop = zBot + Math.max(0, num(zone?.heightMm, 0));
  return zBot < split - 10 && Math.abs(zTop - split) < 40;
}

/**
 * Единая сетка Y-слотов у разделителя 50/50 (якорь bottom или below_divider).
 * Позиции слотов одни и те же; якорь задаёт только, с какого конца брать count.
 */
export function usesDividerDrawerSlotGrid(zone, rules, layout, interiorHeightMm) {
  if (!isFiftyFiftyLowerDrawerZone(zone, layout, interiorHeightMm)) return false;
  return isDrawerGrowFromDividerTop(rules?.anchor);
}

/** @deprecated Используйте usesDividerDrawerSlotGrid + isDrawerGrowFromDividerTop */
export function shouldUseDrawerSlotsBelowCenter(zone, rules, layout, interiorHeightMm) {
  return usesDividerDrawerSlotGrid(zone, rules, layout, interiorHeightMm) &&
    isDrawerGrowFromDividerTop(rules?.anchor);
}

/** @deprecated Используйте usesDividerDrawerSlotGrid + anchor bottom */
export function shouldUseDrawerBottomUpSlotGrid(zone, rules, layout, interiorHeightMm) {
  return usesDividerDrawerSlotGrid(zone, rules, layout, interiorHeightMm) &&
    normalizeDrawerAnchor(rules?.anchor) === 'bottom';
}

function buildDividerDrawerSlots(zone, drawerHeightMm, rules, hBottom, ctx = {}) {
  const splitLocal = Math.max(0, num(zone?.bottomMm, 0)) + Math.max(0, num(zone?.heightMm, 0));
  const splitAbs = Math.max(0, num(hBottom, 0)) + splitLocal;
  const zoneFloor = Math.max(0, num(hBottom, 0)) + Math.max(0, num(zone?.bottomMm, 0));
  const drawerFloor = resolveDrawerFloorOffsetMm({ ...rules, anchor: 'bottom' }, hBottom);
  // Низ слота: не выше пола зоны, но допускаем offset низа ящика (19 / offsetMm / h_bottom+3).
  const floorYMm = Math.min(zoneFloor, drawerFloor);
  const slots = computeDrawerSlotsBelowCenterDivider({
    splitYMm: splitAbs,
    drawerHeightMm,
    gapMm: rules?.gapMm,
    topShelfGapMm: rules?.topShelfGapMm,
    shelfThicknessMm: ctx.shelfThicknessMm ?? 16,
    floorYMm,
    maxCount: Math.max(1, Math.floor(num(ctx.maxCount, 5))),
  });
  return { slots, splitAbs, floorAbs: zoneFloor };
}

function treeHasCenterDividerNear(root, splitAbsY, tolMm = 24) {
  const kids = Array.isArray(root)
    ? root
    : Array.isArray(root?.children)
      ? root.children
      : [];
  return kids.some((c) => {
    if (!c || typeof c !== 'object') return false;
    const role = String(c.sectionLayoutRole || c.layout_role || '').toLowerCase();
    const id = String(c.id || '');
    const isDiv = role === 'zone_divider' || id.includes('split') || id.includes('divider');
    if (!isDiv) return false;
    return Math.abs(num(c.pos?.y, 0) - splitAbsY) <= tolMm;
  });
}

/**
 * Y-позиции ящиков: сетка у разделителя 50/50 или классическая раскладка зоны.
 */
export function resolveDrawerYPositionsForZone(zone, drawerHeightMm, rules, hBottom, ctx = {}) {
  const layout = ctx.interiorLayout ?? null;
  const interiorH = Math.max(0, num(ctx.interiorHeightMm, num(zone?.heightMm, 0)));
  if (usesDividerDrawerSlotGrid(zone, rules, layout, interiorH)) {
    const { slots, splitAbs } = buildDividerDrawerSlots(zone, drawerHeightMm, rules, hBottom, ctx);
    const want = Math.max(0, Math.floor(num(rules?.count, 0)));
    let positions = selectDrawerSlots(slots, rules?.count, rules?.anchor);
    if (want > 0 && positions.length < want) {
      const drawerFloor = resolveDrawerFloorOffsetMm({ ...rules, anchor: 'bottom' }, hBottom);
      const zoneFloor =
        Math.max(0, num(hBottom, 0)) + Math.max(0, num(zone?.bottomMm, 0));
      const extended = computeDrawerSlotsBelowCenterDivider({
        splitYMm: splitAbs,
        drawerHeightMm,
        gapMm: rules?.gapMm,
        topShelfGapMm: rules?.topShelfGapMm,
        shelfThicknessMm: ctx.shelfThicknessMm ?? 16,
        floorYMm: Math.min(zoneFloor, drawerFloor),
        maxCount: Math.max(want, 8),
      });
      const more = selectDrawerSlots(extended, want, rules?.anchor);
      if (more.length >= want) {
        positions = more;
      } else if (more.length > positions.length) {
        positions = more;
      }
    }
    return {
      positions,
      slotGrid: true,
      splitAbsY: splitAbs,
    };
  }
  const floorRules =
    normalizeDrawerAnchor(rules?.anchor) === 'bottom'
      ? { ...rules, offsetMm: resolveDrawerFloorOffsetMm(rules, hBottom) }
      : rules;
  return {
    positions: computeDrawerYPositionsInZone(zone, drawerHeightMm, floorRules, hBottom),
    slotGrid: false,
    splitAbsY: 0,
  };
}

function resolveInteriorHeightMm(sectionSizeY, variables) {
  const sy = Math.max(0, num(sectionSizeY, 0));
  const hBottom = Math.max(0, num(variables?.h_bottom, 0));
  const hTop = Math.max(0, num(variables?.h_top, 0));
  const tech = Math.max(0, num(variables?.tech_zone_mm, 0));
  return { interior: Math.max(0, sy - hBottom - hTop - tech), hBottom };
}

/**
 * Mode A: эталонные слоты ящиков от центральной полки вниз.
 * Пивот ящика = низ слота. Слот 1 (индекс 0) — сразу под полкой (−topShelfGapMm).
 * При уменьшении count убираем снизу; слот 1 всегда остаётся.
 *
 * @param {{
 *   splitYMm: number,
 *   drawerHeightMm: number,
 *   gapMm?: number,
 *   topShelfGapMm?: number,
 *   shelfThicknessMm?: number,
 *   floorYMm?: number,
 *   maxCount?: number,
 * }} opts
 * @returns {number[]} bottoms Y от пола секции, сверху вниз (слот 1 → слот N)
 */
export function computeDrawerSlotsBelowCenterDivider(opts = {}) {
  const splitY = Math.max(0, num(opts.splitYMm, 0));
  const drawerH = Math.max(0, num(opts.drawerHeightMm, 0));
  const gapMm = Math.max(4, num(opts.gapMm, DEFAULT_POLICY.gapMm));
  const topShelfGapMm = Math.max(0, num(opts.topShelfGapMm, 26));
  const shelfT = Math.max(8, num(opts.shelfThicknessMm, 16));
  const floorY = Math.max(0, num(opts.floorYMm, 0));
  const maxCount = Math.max(1, Math.floor(num(opts.maxCount, 5)));
  if (!(splitY > 0) || !(drawerH > 0)) return [];

  // Низ разделительной полки (pivot.y=0) → зазор → верх ящика → низ ящика (pos.y).
  const firstBottom = Math.round(splitY - shelfT / 2 - topShelfGapMm - drawerH);
  if (firstBottom < floorY) return [];

  const step = drawerH + gapMm;
  const slots = [];
  for (let i = 0; i < maxCount; i += 1) {
    const y = Math.round(firstBottom - i * step);
    if (y < floorY) break;
    slots.push(y);
  }
  return slots;
}

/**
 * Запасная укладка снизу вверх — @deprecated, не использовать для below_divider (ломает зазор 26 мм под полкой).
 */
function computeDrawerSlotsPackedFromFloor(opts = {}) {
  const splitY = Math.max(0, num(opts.splitYMm, 0));
  const drawerH = Math.max(0, num(opts.drawerHeightMm, 0));
  const gapMm = Math.max(4, num(opts.gapMm, DEFAULT_POLICY.gapMm));
  const floorY = Math.max(0, num(opts.floorYMm, 0));
  const maxCount = Math.max(1, Math.floor(num(opts.maxCount, 5)));
  if (!(splitY > 0) || !(drawerH > 0)) return [];

  const ceilingBottom = Math.round(splitY - drawerH);
  if (ceilingBottom < floorY) return [];

  const step = drawerH + gapMm;
  const slots = [];
  for (let i = 0; i < maxCount; i += 1) {
    const y = Math.round(floorY + i * step);
    if (y > ceilingBottom) break;
    slots.push(y);
  }
  return slots;
}

/**
 * Выбор count слотов из общей сетки: якорь «от разделителя» — сверху, «от низа» — снизу.
 */
export function selectDrawerSlots(slots, count, anchor) {
  return isDrawerGrowFromDividerTop(anchor)
    ? selectDrawerSlotsFromTop(slots, count)
    : selectDrawerSlotsFromBottom(slots, count);
}

/** count верхних слотов (от полки вниз). count <= 0 → все слоты. */
export function selectDrawerSlotsFromTop(slots, count) {
  if (!Array.isArray(slots) || !slots.length) return [];
  const want = Math.floor(num(count, 0));
  if (want <= 0) return [...slots];
  return slots.slice(0, Math.min(want, slots.length));
}

/** count нижних слотов (от пола вверх). */
export function selectDrawerSlotsFromBottom(slots, count) {
  if (!Array.isArray(slots) || !slots.length) return [];
  const want = Math.floor(num(count, 0));
  if (want <= 0) return [...slots].sort((a, b) => a - b);
  const n = Math.min(want, slots.length);
  return slots.slice(slots.length - n).sort((a, b) => a - b);
}

/** Отступ низа первого ящика: 19 мм от низа секции наполнения (3 мм от дна корпуса + цоколь). */
function resolveDrawerFloorOffsetMm(rules, hBottom) {
  const hb = Math.max(0, num(hBottom, 0));
  const raw = rules?.offsetMm;
  const explicit = num(raw, NaN);
  if (Number.isFinite(explicit) && explicit > 0) {
    return explicit;
  }
  return hb > 0 ? hb + 3 : 19;
}

/** Y-позиции (мм от пола секции) для стека ящиков внутри зоны interiorLayout. */
export function computeDrawerYPositionsInZone(zone, drawerHeightMm, rules, hBottom) {
  const zoneH = Math.max(0, num(zone?.heightMm, 0));
  const h = Math.max(0, num(drawerHeightMm, 0));
  const gap = Math.max(4, num(rules?.gapMm, DEFAULT_POLICY.gapMm));
  const anchor = String(rules?.anchor || 'bottom').trim().toLowerCase();
  const offset =
    anchor === 'bottom'
      ? resolveDrawerFloorOffsetMm(rules, hBottom)
      : Math.max(0, num(rules?.offsetMm, 0));
  const wantCount = Math.max(0, Math.floor(num(rules?.count, 0)));
  const zoneBase = Math.max(0, num(hBottom, 0)) + Math.max(0, num(zone?.bottomMm, 0));
  if (!(zoneH > 0) || !(h > 0)) return [];

  const step = h + gap;
  const positions = [];

  if (anchor === 'top') {
    const available = Math.max(0, zoneH - offset);
    let n = computeInteriorDrawerStackCount(available, h, gap, 0);
    if (wantCount > 0) n = Math.min(wantCount, n);
    if (n < 1) return [];
    for (let i = 0; i < n; i += 1) {
      const yInZone = zoneH - offset - (i + 1) * h - i * gap;
      if (yInZone < 0) break;
      positions.push(Math.round(zoneBase + yInZone));
    }
  } else if (anchor === 'center') {
    let n = wantCount > 0 ? wantCount : 1;
    const maxFit = computeInteriorDrawerStackCount(zoneH, h, gap, 0);
    if (maxFit > 0) n = Math.min(n, maxFit);
    if (n < 1) return [];
    const totalStack = n * h + (n - 1) * gap;
    const centerLine = zoneH / 2 + offset;
    let stackBottom = centerLine - totalStack / 2;
    stackBottom = Math.max(0, Math.min(stackBottom, Math.max(0, zoneH - totalStack)));
    for (let i = 0; i < n; i += 1) {
      positions.push(Math.round(zoneBase + stackBottom + i * step));
    }
  } else {
    const available = Math.max(0, zoneH - offset);
    let n = computeInteriorDrawerStackCount(available, h, gap, 0);
    if (wantCount > 0) n = Math.min(wantCount, n);
    if (n < 1) return [];
    for (let i = 0; i < n; i += 1) {
      positions.push(Math.round(zoneBase + offset + i * step));
    }
  }

  return positions.sort((a, b) => a - b);
}

function resolveDrawerZonesFromLayout(interiorLayout, interiorHeightMm) {
  if (!interiorLayout || !(interiorHeightMm > 0)) return [];
  return resolveInteriorZoneSpansMm(interiorHeightMm, interiorLayout).filter(
    (z) => String(z?.content || '').toLowerCase() === 'drawers'
  );
}

function readCatalog33CardHeightMm(catalogId, template) {
  const tryIds = [
    String(catalogId || '').trim(),
    String(template?.modelId || '').trim(),
    String(template?.spec?.id ?? '').trim(),
  ].filter(Boolean);

  const readHeightFromHit = (hit) => {
    if (!hit) return 0;
    const d = hit?.data && typeof hit.data === 'object' ? hit.data : hit;
    const params = hit?.params && typeof hit.params === 'object' ? hit.params : d?.params;
    const candidates = [d?.height, params?.height, hit?.height];
    for (const v of candidates) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) return Math.round(n);
    }
    return 0;
  };

  const items = readDrawerCatalog33Items();
  for (const id of tryIds) {
    const hit = items.find((it) => String(it?.id ?? '').trim() === id);
    const h = readHeightFromHit(hit);
    if (h > 0) return h;
  }

  if (typeof window !== 'undefined') {
    const map = window.__CLD_CATALOGS_DATA?.catalog_33?.items;
    if (map && typeof map === 'object') {
      for (const id of tryIds) {
        const h = readHeightFromHit(map[id]);
        if (h > 0) return h;
      }
      const nameHint = String(template?.name || template?.spec?.key || '').toLowerCase();
      for (const it of Object.values(map)) {
        const nm = String(it?.name || it?.params?.name || '').toLowerCase();
        const h = readHeightFromHit(it);
        if (h > 0 && nameHint && (nm.includes(nameHint.slice(0, 6)) || nm.includes('внутренн'))) {
          return h;
        }
      }
      for (const it of Object.values(map)) {
        const h = readHeightFromHit(it);
        if (h > 0) return h;
      }
    }
  }

  const nameHint = String(template?.name || template?.spec?.key || '').toLowerCase();
  for (const it of items) {
    const nm = String(it?.data?.name || it?.name || '').toLowerCase();
    const h = readHeightFromHit(it);
    if (h > 0 && nameHint && nm.includes(nameHint.slice(0, 6))) return h;
  }
  for (const it of items) {
    const h = readHeightFromHit(it);
    if (h > 0) return h;
  }
  return 0;
}

/** Высота слота fill-ящика: карточка catalog_33, не s:y / растянутый size из DOM. */
function resolveFillDrawerSlotHeightMm(template) {
  if (!template || typeof template !== 'object') return 0;
  const fromCard = readCatalog33CardHeightMm(null, template);
  if (fromCard > 0) return fromCard;
  const id = String(template.spec?.id ?? '').trim();
  if (id) {
    const ref = resolveDrawerInteriorRefMmByCatalogId(id, template.spec);
    if (ref?.y > 0) return ref.y;
  }
  const rawY = Number(template.size?.y);
  const rawStr = String(template.size?.y ?? '').trim();
  if (
    Number.isFinite(rawY) &&
    rawY > 0 &&
    rawY <= 350 &&
    rawStr !== 's:y' &&
    !/^s\s*:\s*y/i.test(rawStr)
  ) {
    return Math.round(rawY);
  }
  return 162;
}

function resolveDrawerTemplateHeightMm(template) {
  return resolveFillDrawerSlotHeightMm(template);
}

function resolveShelfTemplateForDrawerZone(root, opts, fallbackThickness = 16) {
  const resolver = globalThis.__cldResolveInteriorShelfTemplate;
  const catalogTemplates =
    opts.interiorTemplates ??
    (typeof globalThis.__cldExtractInteriorTemplatesFromCatalogItem === 'function'
      ? globalThis.__cldExtractInteriorTemplatesFromCatalogItem(opts.catalogItem)
      : null);
  const fromResolver =
    typeof resolver === 'function'
      ? resolver({
          interiorTemplates: catalogTemplates ?? null,
          treeChildren: root.children,
          findCatalogItem: opts.findCatalogItem,
          shelfThicknessMm: fallbackThickness,
        })
      : null;
  const tpl =
    fromResolver && typeof fromResolver === 'object'
      ? cloneJson(fromResolver)
      : {
          type: 'module',
          name: 'Полка',
          spec: { id: '6', element_type: 'catalog_29', key: 'Полка' },
          size: { x: 's:x-32', y: fallbackThickness, z: 's:z-9' },
          pos: { x: 16, y: 0, z: 0 },
          pivot: { x: -1, y: 0, z: -1 },
          rot: { x: 0, y: 0, z: 0 },
          layout_role: 'shelf',
          children: [],
        };
  tpl.size = tpl.size && typeof tpl.size === 'object' ? { ...tpl.size } : {};
  tpl.pos = tpl.pos && typeof tpl.pos === 'object' ? { ...tpl.pos } : {};
  tpl.pivot = tpl.pivot && typeof tpl.pivot === 'object' ? { ...tpl.pivot } : {};
  const tRaw = Number(tpl.size.y);
  tpl.size.y = Number.isFinite(tRaw) && tRaw > 0 && tRaw < 120 ? Math.round(tRaw) : fallbackThickness;
  if (tpl.size.z == null || String(tpl.size.z).trim() === '') tpl.size.z = 's:z-9';
  if (tpl.pos.x == null || String(tpl.pos.x).trim() === '') tpl.pos.x = 16;
  if (tpl.pos.z == null || String(tpl.pos.z).trim() === '') tpl.pos.z = 0;
  tpl.pivot.x = tpl.pivot.x ?? -1;
  tpl.pivot.y = tpl.pivot.y ?? 0;
  tpl.pivot.z = tpl.pivot.z ?? -1;
  tpl.children = [];
  if (tpl.spec && typeof tpl.spec === 'object') {
    delete tpl.spec.live_catalog;
    delete tpl.spec.template_tree;
    delete tpl.spec.templates;
  }
  return tpl;
}

function buildModeACenterDivider(shelfTemplate, splitAbsY, thickness) {
  const t = Math.max(8, num(thickness, 16));
  const tpl =
    shelfTemplate && typeof shelfTemplate === 'object'
      ? cloneJson(shelfTemplate)
      : {
          type: 'module',
          name: 'Полка',
          spec: { id: '6', element_type: 'catalog_29', key: 'Полка' },
          size: { x: 's:x-32', y: t, z: 's:z-9' },
          pos: { x: 16, y: 0, z: 0 },
          pivot: { x: -1, y: 0, z: -1 },
          rot: { x: 0, y: 0, z: 0 },
          children: [],
        };
  tpl.id = `${tpl.id || 'shelf'}__split_divider`;
  tpl.size = tpl.size && typeof tpl.size === 'object' ? { ...tpl.size, y: t } : { y: t };
  tpl.pos = tpl.pos && typeof tpl.pos === 'object' ? { ...tpl.pos, y: Math.round(splitAbsY) } : { y: Math.round(splitAbsY) };
  if (tpl.pos.x === undefined || tpl.pos.x === null || String(tpl.pos.x).trim() === 's:x') {
    tpl.pos.x = 16;
  }
  tpl.pivot =
    tpl.pivot && typeof tpl.pivot === 'object' ? { ...tpl.pivot, y: 0 } : { x: -1, y: 0, z: -1 };
  tpl.layout_role = 'shelf';
  tpl.sectionLayoutRole = 'zone_divider';
  tpl.children = [];
  return tpl;
}

/** Полки ниже разделителя (врезаются в ящики) — убрать, кроме самого zone_divider. */
function isStrayShelfBelowDivider(node, splitAbsY) {
  if (!node || typeof node !== 'object') return false;
  const role = String(node.sectionLayoutRole || node.layout_role || '').toLowerCase();
  if (role === 'zone_divider') return false;
  if (role === 'drawer_top_shelf' || role === 'drawer_zone_fill_shelf') return false;
  const type = String(node.type || '').toLowerCase();
  if (type !== 'module' && type !== 'wall') return false;
  const et = String(node.spec?.element_type || '').toLowerCase();
  const name = String(node.name || node.spec?.key || '').toLowerCase();
  const isShelf =
    et === 'catalog_29' ||
    role === 'shelf' ||
    (/полк|shelf/i.test(name) && !/ящик|планк|strip|rail/i.test(name));
  if (!isShelf) return false;
  const y = num(node.pos?.y, NaN);
  if (!Number.isFinite(y)) return false;
  // Любая полка строго ниже центра разделителя — в теле/зазоре ящиков.
  return y < splitAbsY - 2;
}

function findShelfNearY(nodes, yMm, tolMm = 20) {
  const kids = Array.isArray(nodes) ? nodes : [];
  const y = num(yMm, 0);
  return kids.find((c) => {
    if (!c || typeof c !== 'object') return false;
    const role = String(c.sectionLayoutRole || c.layout_role || '').toLowerCase();
    const et = String(c.spec?.element_type || '').toLowerCase();
    const name = String(c.name || c.spec?.key || '').toLowerCase();
    const isShelf =
      role === 'zone_divider' ||
      role === 'drawer_top_shelf' ||
      role === 'shelf' ||
      et === 'catalog_29' ||
      (/полк|shelf/i.test(name) && !/ящик|планк|strip|rail/i.test(name));
    if (!isShelf) return false;
    return Math.abs(num(c.pos?.y, 0) - y) <= tolMm;
  }) || null;
}

/** Убрать дубли полок у разделителя: оставить одну (предпочитаем zone_divider). */
function dedupeShelvesNearSplit(children, splitAbsY, tolMm = 24) {
  if (!Array.isArray(children) || !(splitAbsY > 0)) return children;
  const nearIdx = [];
  children.forEach((c, i) => {
    if (!c || typeof c !== 'object') return;
    const role = String(c.sectionLayoutRole || c.layout_role || '').toLowerCase();
    const et = String(c.spec?.element_type || '').toLowerCase();
    const name = String(c.name || '').toLowerCase();
    const isShelf =
      role === 'zone_divider' ||
      role === 'drawer_top_shelf' ||
      role === 'shelf' ||
      et === 'catalog_29' ||
      (/полк|shelf/i.test(name) && !/ящик|планк/i.test(name));
    if (!isShelf) return;
    if (Math.abs(num(c.pos?.y, 0) - splitAbsY) <= tolMm) nearIdx.push(i);
  });
  if (nearIdx.length <= 1) return children;
  let keepI = nearIdx.find((i) => String(children[i].sectionLayoutRole || '') === 'zone_divider');
  if (keepI == null) keepI = nearIdx[0];
  const drop = new Set(nearIdx.filter((i) => i !== keepI));
  // Полку-дубль сдвинуть на split, если оставляем не divider — нормализуем Y.
  if (children[keepI] && String(children[keepI].sectionLayoutRole || '') !== 'zone_divider') {
    children[keepI] = {
      ...children[keepI],
      pos: { ...(children[keepI].pos || {}), y: Math.round(splitAbsY) },
      sectionLayoutRole: 'zone_divider',
      layout_role: children[keepI].layout_role || 'shelf',
      pivot: {
        ...(children[keepI].pivot || { x: -1, y: 0, z: -1 }),
        y: 0,
      },
    };
  }
  return children.filter((_, i) => !drop.has(i));
}

function buildTopShelfAboveDrawerBlock(shelfTemplate, zone, drawerYPositions, drawerHeightMm, rules, hBottom) {
  if (!shelfTemplate || !drawerYPositions.length || rules?.forceShelfAboveDrawers === false) return null;
  const shelf = cloneJson(shelfTemplate);
  shelf.size = shelf.size && typeof shelf.size === 'object' ? { ...shelf.size } : {};
  shelf.pos = shelf.pos && typeof shelf.pos === 'object' ? { ...shelf.pos } : {};
  shelf.pivot = shelf.pivot && typeof shelf.pivot === 'object' ? { ...shelf.pivot } : {};
  const t = Math.max(8, num(shelf.size.y, 16));
  const topDrawerY = Math.max(...drawerYPositions) + Math.max(0, num(drawerHeightMm, 0));
  const gap = Math.max(0, num(rules?.topShelfGapMm, 26));
  const pivotCenter = num(shelf.pivot.y, 0) === 0;
  let y = topDrawerY + gap + (pivotCenter ? t / 2 : 0);
  const zoneTop = Math.max(0, num(hBottom, 0)) + Math.max(0, num(zone?.bottomMm, 0)) + Math.max(0, num(zone?.heightMm, 0));
  const maxY = pivotCenter ? zoneTop - t / 2 : zoneTop - t;
  y = Math.min(Math.round(y), Math.round(maxY));
  if (!(y >= 0)) return null;
  shelf.id = `${shelfTemplate.id || 'shelf'}__${zone.id || 'zone'}__drawer_top`;
  shelf.pos.y = y;
  shelf.layout_role = 'drawer_top_shelf';
  shelf.sectionLayoutRole = 'drawer_top_shelf';
  shelf.children = [];
  return shelf;
}

function buildShelfAtYFromTemplate(shelfTemplate, y, idSuffix, role = 'shelf') {
  if (!shelfTemplate) return null;
  const shelf = cloneJson(shelfTemplate);
  shelf.size = shelf.size && typeof shelf.size === 'object' ? { ...shelf.size } : {};
  shelf.pos = shelf.pos && typeof shelf.pos === 'object' ? { ...shelf.pos } : {};
  shelf.pivot = shelf.pivot && typeof shelf.pivot === 'object' ? { ...shelf.pivot } : { x: -1, y: 0, z: -1 };
  shelf.pivot.y = 0;
  shelf.id = `${shelfTemplate.id || 'shelf'}__${idSuffix}`;
  shelf.pos.y = Math.round(y);
  shelf.layout_role = role === 'drawer_zone_fill_shelf' ? 'shelf' : role;
  shelf.sectionLayoutRole = role;
  shelf.children = [];
  return shelf;
}

/**
 * Якорь bottom: полки по глобальной even-сетке (как в S_5PL) в пустоте над drawer_top_shelf до верха зоны.
 * Линия сетки пропускается, если шаг от предыдущей полки (drawer_top_shelf / fill) меньше эталонного шага сетки.
 */
function resolveMinEvenGridCenterStepMm(gridLines) {
  if (!Array.isArray(gridLines) || gridLines.length < 2) return 0;
  let minStep = Infinity;
  for (let i = 1; i < gridLines.length; i += 1) {
    const step = num(gridLines[i], 0) - num(gridLines[i - 1], 0);
    if (step > 0) minStep = Math.min(minStep, step);
  }
  return Number.isFinite(minStep) ? minStep : 0;
}

/** Линии even-сетки для fill-полок над drawer_top_shelf (без сборки модулей). */
export function resolveEvenFillShelfCenterYsAboveDrawerStack(opts = {}) {
  const {
    topShelfAbsY,
    zoneTopAbs,
    interiorHeightMm,
    hBottom,
    shelfPolicy,
    shelfThicknessMm = 16,
  } = opts;
  if (!(topShelfAbsY > 0) || !(zoneTopAbs > topShelfAbsY)) return [];

  const t = Math.max(8, num(shelfThicknessMm, 16));
  const topShelfTop = topShelfAbsY + t / 2;
  const minFillY = topShelfTop + 12;
  const maxFillY = zoneTopAbs - t / 2 - 8;
  if (!(maxFillY > minFillY + t)) return [];

  const policy = normalizeShelfStackPolicy(
    shelfPolicy || { enabled: true, distribution: 'even', stepMm: 290, maxCount: 12, shelfThicknessMm: t }
  );
  if (policy?.enabled === false) return [];

  const gridLines = computeGlobalEvenShelfAbsYLines(interiorHeightMm, policy, hBottom, t);
  const minStep = resolveMinEvenGridCenterStepMm(gridLines);
  let prevCenter = topShelfAbsY;
  const fillYs = [];
  for (const y of gridLines) {
    if (y <= minFillY || y >= maxFillY) continue;
    if (minStep > 0 && y - prevCenter < minStep - 0.5) continue;
    fillYs.push(y);
    prevCenter = y;
  }
  return fillYs;
}

function buildEvenFillShelvesAboveDrawerStack(opts = {}) {
  const { shelfTemplate, zoneId, ...rest } = opts;
  if (!shelfTemplate) return [];
  const fillYs = resolveEvenFillShelfCenterYsAboveDrawerStack(rest);
  if (!fillYs.length) return [];
  return fillYs
    .map((y, i) =>
      buildShelfAtYFromTemplate(
        shelfTemplate,
        y,
        `${zoneId || 'zone'}__drawer_fill_${i + 1}`,
        'drawer_zone_fill_shelf'
      )
    )
    .filter(Boolean);
}

/** Прогноз Y центра drawer_top_shelf (50/50, якорь bottom). */
export function predictDrawerTopShelfAbsY(opts = {}) {
  const layout = opts.interiorLayout ?? opts.layout ?? null;
  const interiorHeightMm = Math.max(0, num(opts.interiorHeightMm, 0));
  if (!(interiorHeightMm > 0) || !layout?.zones?.length) return 0;
  const hBottom = Math.max(0, num(opts.hBottom, 0));
  const drawerH = Math.max(40, num(opts.drawerHeightMm, 162));
  const shelfT = Math.max(8, num(opts.shelfThicknessMm, 16));
  const zones = layout.zones.map((z, i) => {
    const span = resolveInteriorZoneSpansMm(interiorHeightMm, layout)[i];
    return span ? { ...z, ...span } : z;
  });
  const drawerZone = zones.find((z) => String(z?.content || '').toLowerCase() === 'drawers');
  if (!drawerZone) return 0;
  const rules = normalizeZoneDrawerRules(drawerZone.drawerRules, opts.policy || null);
  if (normalizeDrawerAnchor(rules.anchor) !== 'bottom') return 0;
  if (rules.forceShelfAboveDrawers === false) return 0;
  const resolved = resolveDrawerYPositionsForZone(drawerZone, drawerH, rules, hBottom, {
    interiorLayout: layout,
    interiorHeightMm,
    shelfThicknessMm: shelfT,
    maxCount: 5,
  });
  const yPositions = Array.isArray(resolved?.positions) ? resolved.positions : [];
  if (!yPositions.length) return 0;
  const stackTopMm = Math.max(...yPositions) + drawerH;
  const shelfGap = Math.max(0, num(rules.topShelfGapMm, 26));
  return stackTopMm + shelfGap + shelfT / 2;
}

/** Прогноз числа fill-полок в нижней зоне ящиков (50/50, якорь bottom). */
export function predictDrawerZoneFillShelfCount(opts = {}) {
  const layout = opts.interiorLayout ?? opts.layout ?? null;
  const interiorHeightMm = Math.max(0, num(opts.interiorHeightMm, 0));
  if (!(interiorHeightMm > 0) || !layout?.zones?.length) return 0;
  const hBottom = Math.max(0, num(opts.hBottom, 0));
  const drawerH = Math.max(40, num(opts.drawerHeightMm, 162));
  const shelfPolicy = opts.shelfPolicy ?? null;
  const shelfT = Math.max(8, num(opts.shelfThicknessMm, 16));
  const zones = layout.zones.map((z, i) => {
    const span = resolveInteriorZoneSpansMm(interiorHeightMm, layout)[i];
    return span ? { ...z, ...span } : z;
  });
  const drawerZone = zones.find((z) => String(z?.content || '').toLowerCase() === 'drawers');
  if (!drawerZone) return 0;
  const rules = normalizeZoneDrawerRules(drawerZone.drawerRules, opts.policy || null);
  if (normalizeDrawerAnchor(rules.anchor) !== 'bottom') return 0;
  if (rules.forceShelfAboveDrawers === false) return 0;
  const resolved = resolveDrawerYPositionsForZone(drawerZone, drawerH, rules, hBottom, {
    interiorLayout: layout,
    interiorHeightMm,
    shelfThicknessMm: shelfT,
    maxCount: 5,
  });
  const yPositions = Array.isArray(resolved?.positions) ? resolved.positions : [];
  if (!yPositions.length) return 0;
  const zoneTopAbs =
    Math.max(0, num(hBottom, 0)) +
    Math.max(0, num(drawerZone.bottomMm, 0)) +
    Math.max(0, num(drawerZone.heightMm, 0));
  const expectShelfCenter = predictDrawerTopShelfAbsY(opts);
  if (!(expectShelfCenter > 0) || expectShelfCenter >= zoneTopAbs - 36) return 0;
  return resolveEvenFillShelfCenterYsAboveDrawerStack({
    topShelfAbsY: expectShelfCenter,
    zoneTopAbs,
    interiorHeightMm,
    hBottom,
    shelfPolicy,
    shelfThicknessMm: shelfT,
  }).length;
}

export function computeInteriorDrawerStackCount(availableSpanMm, drawerHeightMm, gapMm, maxCount) {
  const span = Math.max(0, num(availableSpanMm, 0));
  const h = Math.max(0, num(drawerHeightMm, 0));
  const gap = Math.max(0, num(gapMm, 0));
  if (!(h > 0) || span < h) return 0;
  const step = h + gap;
  let n = Math.floor((span + gap) / step);
  const cap = Math.floor(num(maxCount, 0));
  if (cap > 0) n = Math.min(n, cap);
  return Math.max(0, n);
}

/**
 * Авто-стек catalog_33 в fill: зоны interiorLayout с content=drawers, фикс. высота шаблона.
 */
export function applyInteriorDrawerStackToRoots(roots, opts = {}) {
  const p = normalizePolicy(opts.policy || null) || normalizePolicy({ enabled: true });
  if (!p?.enabled) return false;

  const sectionSizeY = Math.max(0, num(opts.sectionSizeMm?.y, 0));
  const sectionDepthMm = Math.max(0, num(opts.sectionSizeMm?.z, 0));
  if (!(sectionSizeY > 0)) return false;

  const vars = opts.variables || {};
  const { interior, hBottom } = resolveInteriorHeightMm(sectionSizeY, vars);
  if (!(interior > 0)) return false;

  const drawerZones = resolveDrawerZonesFromLayout(opts.interiorLayout ?? null, interior);
  if (!drawerZones.length) return false;

  const rootsArr = Array.isArray(roots) ? roots : [roots];
  const depthSelection = resolveDrawerModelByDepth(sectionDepthMm, p);
  let changed = false;

  for (const root of findFillSectionRoots(rootsArr)) {
    if (!Array.isArray(root.children)) root.children = [];
    const drawerIndices = [];
    const topShelfIndices = [];
    root.children.forEach((c, i) => {
      if (isFillDrawerTemplateModule(c)) drawerIndices.push(i);
      if (isAutoDrawerTopShelfModule(c) || isDrawerZoneFillShelfModule(c)) topShelfIndices.push(i);
    });

    let template = null;
    if (drawerIndices.length > 0) {
      template = root.children[drawerIndices[0]];
    } else {
      template =
        typeof globalThis.__cldResolveInteriorDrawerTemplate === 'function'
          ? globalThis.__cldResolveInteriorDrawerTemplate({
              interiorTemplates: opts.interiorTemplates ?? null,
              treeChildren: root.children,
              findCatalogItem: opts.findCatalogItem,
            })
          : null;
      if (!template && opts.catalogItem) {
        template =
          typeof globalThis.__cldResolveInteriorDrawerTemplate === 'function'
            ? globalThis.__cldResolveInteriorDrawerTemplate({
                interiorTemplates:
                  typeof globalThis.__cldExtractInteriorTemplatesFromCatalogItem === 'function'
                    ? globalThis.__cldExtractInteriorTemplatesFromCatalogItem(opts.catalogItem)
                    : null,
                treeChildren: root.children,
                findCatalogItem: opts.findCatalogItem,
              })
            : null;
      }
    }
    if (!template) continue;
    const drawerH = resolveDrawerTemplateHeightMm(template);
    if (!(drawerH > 0)) continue;

    const ruleDrawerId =
      depthSelection?.drawerCatalogId || depthSelection?.rule?.guideCatalogId
        ? resolveDrawerCatalogIdFromRule(depthSelection.rule) ||
          String(depthSelection.drawerCatalogId || '').trim()
        : '';
    const firstIdx = drawerIndices.length > 0 ? drawerIndices[0] : root.children.length;
    const removeIdx = new Set([...drawerIndices, ...topShelfIndices]);
    const ffCtx = resolveFiftyFiftyZoneContext(opts.interiorLayout ?? null, interior, hBottom, {
      shelfPolicy:
        opts.shelfPolicy ??
        opts.catalogItem?.shelfStack ??
        opts.catalogItem?.data?.shelfStack ??
        null,
      shelfThicknessMm: 16,
      drawerHeightMm: drawerH,
    });
    // Mode A: заранее убрать полки, которые сидят в нижней половине (врезаются в ящики).
    const layoutForSlots = opts.interiorLayout ?? null;
    const slotProbeZone = drawerZones[0];
    const slotProbeRules = normalizeZoneDrawerRules(slotProbeZone?.drawerRules, p);
    const dividerSlotGridActive = usesDividerDrawerSlotGrid(
      slotProbeZone,
      slotProbeRules,
      layoutForSlots,
      interior
    );
    let dividerSplitAbs = 0;
    if (dividerSlotGridActive && slotProbeZone) {
      dividerSplitAbs =
        hBottom +
        Math.max(0, num(slotProbeZone.bottomMm, 0)) +
        Math.max(0, num(slotProbeZone.heightMm, 0));
      root.children.forEach((c, i) => {
        if (isStrayShelfBelowDivider(c, dividerSplitAbs)) removeIdx.add(i);
      });
    }
    // 50/50 штанга+ящики: снять все полки — разделитель вернёт normalize / Mode A.
    if (ffCtx?.topContent === 'rod' && ffCtx?.bottomContent === 'drawers') {
      root.children.forEach((c, i) => {
        if (isShelfLikeFillModule(c)) removeIdx.add(i);
      });
    } else if (ffCtx?.topContent === 'shelves' && ffCtx?.bottomContent === 'drawers') {
      const splitAbs = num(ffCtx.splitAbs, dividerSplitAbs);
      root.children.forEach((c, i) => {
        if (isAutoDrawerTopShelfModule(c) || isDrawerZoneFillShelfModule(c)) removeIdx.add(i);
        if (splitAbs > 0 && isStrayShelfBelowDivider(c, splitAbs)) removeIdx.add(i);
        if (!isShelfLikeFillModule(c)) return;
        const y = num(c.pos?.y, 0);
        const role = String(c.sectionLayoutRole || c.layout_role || '').toLowerCase();
        if (
          role === 'zone_divider' ||
          role === 'drawer_top_shelf' ||
          role === 'drawer_zone_fill_shelf' ||
          (splitAbs > 0 && Math.abs(y - splitAbs) <= 32)
        ) {
          removeIdx.add(i);
        }
      });
    }
    const keep = removeIdx.size
      ? root.children.filter((_, i) => !removeIdx.has(i))
      : [...root.children];
    const generated = [];
    let drawerSeq = 0;
    const shelfTemplate = resolveShelfTemplateForDrawerZone(root, opts, 16);
    let dividerShelfEnsured = false;
    const shelfPolicy =
      opts.shelfPolicy ??
      opts.catalogItem?.shelfStack ??
      opts.catalogItem?.data?.shelfStack ??
      null;

    for (const zone of drawerZones) {
      const rules = normalizeZoneDrawerRules(zone.drawerRules, p);
      const resolved = resolveDrawerYPositionsForZone(zone, drawerH, rules, hBottom, {
        interiorLayout: opts.interiorLayout ?? null,
        interiorHeightMm: interior,
        shelfThicknessMm: 16,
        maxCount: 5,
      });
      const yPositions = resolved.positions;
      const zoneDrawers = [];
      yPositions.forEach((yPos) => {
        drawerSeq += 1;
        const d = cloneJson(template);
        d.id = `${template.id || 'drawer'}__${zone.id || 'zone'}_${drawerSeq}`;
        d.size = d.size && typeof d.size === 'object' ? { ...d.size } : {};
        d.pos = d.pos && typeof d.pos === 'object' ? { ...d.pos } : {};
        // catalog_33 в fill часто с size.y=s:y — в стеке фиксируем высоту карточки (162 мм), не секции.
        d.size.y = drawerH;
        const targetId = ruleDrawerId || String(d.spec?.id ?? '').trim();
        if (targetId) {
          const fixedDepthMm = applyDrawerSlotDepthToModule(d, targetId, {
            ruleName: depthSelection?.rule?.name,
            forPreview: opts.forPreview === true,
            policy: p,
            fillInterior: true,
          });
          if (fixedDepthMm > 0) seedDrawerLockedDepthVariable(root, fixedDepthMm);
        }
        d.pos.y = yPos;
        zoneDrawers.push(d);
      });
      generated.push(...zoneDrawers);

      if (resolved.slotGrid && resolved.splitAbsY > 0) {
        // Сетка 50/50: полка-разделитель на splitY (не drawer_top_shelf в теле ящика).
        const hasDiv =
          treeHasCenterDividerNear(keep, resolved.splitAbsY) ||
          treeHasCenterDividerNear(generated, resolved.splitAbsY) ||
          !!findShelfNearY(keep, resolved.splitAbsY, 24) ||
          !!findShelfNearY(generated, resolved.splitAbsY, 24);
        if (!hasDiv && !dividerShelfEnsured) {
          generated.push(buildModeACenterDivider(shelfTemplate, resolved.splitAbsY, 16));
          dividerShelfEnsured = true;
        }
      } else if (rules.forceShelfAboveDrawers !== false) {
        // Якорь bottom/top/center: полка над верхним ящиком (topShelfGapMm), как зазор у разделителя.
        const zoneTopAbs =
          Math.max(0, num(hBottom, 0)) +
          Math.max(0, num(zone?.bottomMm, 0)) +
          Math.max(0, num(zone?.heightMm, 0));
        const stackTopMm =
          (yPositions.length ? Math.max(...yPositions) : 0) + Math.max(0, num(drawerH, 0));
        const shelfGap = Math.max(0, num(rules.topShelfGapMm, 26));
        const shelfT = 16;
        const expectShelfCenter = stackTopMm + shelfGap + shelfT / 2;
        // Стек не доходит до верха зоны — не путать zone_divider 50/50 с полкой над ящиками.
        const stackReachesZoneTop = expectShelfCenter >= zoneTopAbs - 36;
        const alreadyHasShelfAboveStack =
          !!findShelfNearY(keep, expectShelfCenter, 32) ||
          !!findShelfNearY(generated, expectShelfCenter, 32);
        const alreadyHasDividerAtTop =
          stackReachesZoneTop &&
          (!!findShelfNearY(keep, zoneTopAbs, 30) ||
            !!findShelfNearY(generated, zoneTopAbs, 30) ||
            treeHasCenterDividerNear(keep, zoneTopAbs, 30) ||
            treeHasCenterDividerNear(generated, zoneTopAbs, 30));
        if (!alreadyHasShelfAboveStack && !alreadyHasDividerAtTop) {
          const topShelf = buildTopShelfAboveDrawerBlock(
            shelfTemplate,
            zone,
            yPositions,
            drawerH,
            rules,
            hBottom
          );
          if (topShelf) {
            // Если расчётный Y почти на границе зоны — это разделитель, не «полка в ящике».
            if (Math.abs(num(topShelf.pos?.y, 0) - zoneTopAbs) <= 30) {
              topShelf.pos.y = Math.round(zoneTopAbs);
              topShelf.sectionLayoutRole = 'zone_divider';
              topShelf.pivot =
                topShelf.pivot && typeof topShelf.pivot === 'object'
                  ? { ...topShelf.pivot, y: 0 }
                  : { x: -1, y: 0, z: -1 };
            }
            generated.push(topShelf);

            if (
              normalizeDrawerAnchor(rules.anchor) === 'bottom' &&
              topShelf.sectionLayoutRole !== 'zone_divider'
            ) {
              const fillShelves = buildEvenFillShelvesAboveDrawerStack({
                shelfTemplate,
                topShelfAbsY: num(topShelf.pos?.y, 0),
                zoneTopAbs,
                interiorHeightMm: interior,
                hBottom,
                shelfPolicy,
                zoneId: zone.id || zone.name,
                shelfThicknessMm: 16,
              });
              if (fillShelves.length) generated.push(...fillShelves);
            }
          }
        }
      }
    }

    if (!generated.length) continue;
    const insertAt = drawerIndices.length > 0 ? firstIdx : keep.length;
    keep.splice(insertAt, 0, ...generated);
    let nextChildren = keep;
    if (dividerSplitAbs > 0) {
      nextChildren = dedupeShelvesNearSplit(nextChildren, dividerSplitAbs, 28);
    } else if (ffCtx?.splitAbs > 0) {
      nextChildren = dedupeShelvesNearSplit(nextChildren, num(ffCtx.splitAbs, 0), 28);
    } else {
      // 50/50 без сетки у разделителя: всё равно схлопнуть полки у середины секции.
      const mid = Math.round(interior / 2);
      if (isFiftyFiftyInteriorLayout(opts.interiorLayout) && mid > 0) {
        nextChildren = dedupeShelvesNearSplit(nextChildren, mid, 28);
      }
    }
    if (ffCtx) {
      nextChildren = normalizeFiftyFiftySplitShelfNodes(nextChildren, ffCtx, {
        shelfTemplate,
        shelfThicknessMm: 16,
      });
    }
    const rodShiftRoot = { children: nextChildren };
    applyRodZoneLayoutAfterDrawerStack(rodShiftRoot, {
      interiorLayout: opts.interiorLayout ?? null,
      interiorHeightMm: interior,
      hBottom,
      shelfPolicy,
      shelfTemplate,
      shelfThicknessMm: 16,
      drawerHeightMm: drawerH,
    });
    nextChildren = rodShiftRoot.children;
    if (root.__cldFlatSourceArr && Array.isArray(root.__cldFlatSourceArr)) {
      root.__cldFlatSourceArr.splice(0, root.__cldFlatSourceArr.length, ...nextChildren);
      root.children = root.__cldFlatSourceArr;
    } else {
      root.children = nextChildren;
    }
    changed = true;
  }
  return changed;
}

if (typeof globalThis !== 'undefined') {
  globalThis.__cldResolveDrawerInteriorRefMm = resolveDrawerInteriorRefMmByCatalogId;
  globalThis.__cldApplyDrawerSlotDepthToModule = applyDrawerSlotDepthToModule;
  globalThis.__cldReadDrawerNoHandleByCatalogId = readDrawerNoHandleByCatalogId;
  globalThis.__cldStampDrawerNoHandleFlagsInTree = stampDrawerNoHandleFlagsInTree;
  globalThis.__cldSyncDrawerCatalog33ToGlobalCache = syncDrawerCatalog33ToGlobalCache;
  globalThis.__cldEnsureDrawerCatalog33FreshFromApi = ensureDrawerCatalog33FreshFromApi;
  globalThis.__cldRefreshDrawerCatalog33Cache = refreshDrawerCatalog33Cache;
  globalThis.__cldDrawerSlotFrontPosZExpr = drawerSlotFrontPosZExpr;
  globalThis.__cldResolveDrawerSlotFrontProtrusionMm = resolveDrawerSlotFrontProtrusionMm;
  globalThis.__cldModuleDrawerCatalogSlotFitsDepth = moduleDrawerCatalogSlotFitsDepth;
  globalThis.__cldApplyInteriorDrawerStackToRoots = applyInteriorDrawerStackToRoots;
  globalThis.__cldComputeDrawerSlotsBelowCenterDivider = computeDrawerSlotsBelowCenterDivider;
  globalThis.__cldSelectDrawerSlots = selectDrawerSlots;
  globalThis.__cldSelectDrawerSlotsFromTop = selectDrawerSlotsFromTop;
  globalThis.__cldSelectDrawerSlotsFromBottom = selectDrawerSlotsFromBottom;
  globalThis.__cldUsesDividerDrawerSlotGrid = usesDividerDrawerSlotGrid;
  globalThis.__cldShouldUseDrawerSlotsBelowCenter = shouldUseDrawerSlotsBelowCenter;
  globalThis.__cldResolveDrawerYPositionsForZone = resolveDrawerYPositionsForZone;
  try {
    syncDrawerCatalog33ToGlobalCache();
  } catch (_) {}
}
