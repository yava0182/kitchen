/**
 * Каталог серий ручек (аналог handles_lib в Clodis).
 * Источник: /api/catalog/items_get/handles → catalog_items/handles.json
 */

const HANDLES_CATALOG_KEY = 'handles';
const ROOM_STEP6_HANDLE_KEY = 'room_step6_handle_selection';

let __handlesCatalogPromise = null;
let __handlesCatalogFullPromise = null;

async function fetchHandlesCatalogRaw() {
  let data = null;
  try {
    const res = await fetch(
      `/api/catalog/items_get/${encodeURIComponent(HANDLES_CATALOG_KEY)}?t=${Date.now()}`,
      { cache: 'no-store' }
    );
    if (res.ok) data = await res.json();
  } catch (_) {}
  if (!data || (!Array.isArray(data.series) && !data.items)) {
    try {
      const res = await fetch('/catalog_items/handles.json', { cache: 'no-store' });
      if (res.ok) data = await res.json();
    } catch (_) {}
  }
  const categories = Array.isArray(data?.categories) ? data.categories : [];
  let series = [];
  if (Array.isArray(data)) series = data;
  else if (Array.isArray(data?.series)) series = data.series;
  else if (Array.isArray(data?.items)) series = data.items;
  return { categories, series };
}

export function seriesSlug(s) {
  if (!s || typeof s !== 'object') return '';
  const key = s.key != null ? String(s.key).trim() : '';
  if (key) return key;
  const id = s.id;
  if (typeof id === 'string' && id && !/^\d+$/.test(id)) return id;
  return id != null ? String(id) : '';
}

function seriesMatchesId(s, seriesId) {
  const want = String(seriesId || '').trim();
  if (!want) return false;
  return seriesSlug(s) === want || String(s?.id) === want;
}

function readRoomStepsConfig() {
  try {
    const raw = localStorage.getItem('room_steps_config');
    if (!raw) return null;
    const c = JSON.parse(raw);
    return c && typeof c === 'object' ? c : null;
  } catch (_) {
    return null;
  }
}

function normalizeStep6Selection(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;
  const roleSlots =
    parsed.roleSlots && typeof parsed.roleSlots === 'object' ? parsed.roleSlots : {};
  if (!parsed.seriesId && !Object.keys(roleSlots).length) return null;
  const modelId = parsed.modelId != null ? String(parsed.modelId).trim() : '';
  const handleItemId = Number(parsed.handleItemId) || 0;
  return {
    seriesId: parsed.seriesId != null ? String(parsed.seriesId) : '',
    finishId: parsed.finishId != null ? String(parsed.finishId) : null,
    modelId: modelId || null,
    handleItemId: handleItemId > 0 ? handleItemId : null,
    roleSlots,
  };
}

function persistRoomStep6Selection(sel) {
  try {
    localStorage.setItem(ROOM_STEP6_HANDLE_KEY, JSON.stringify(sel));
  } catch (_) {}
  window.roomHandleSelection = sel;
  try {
    if (typeof window.__cldHandleRuntime?.handleLog === 'function') {
      window.__cldHandleRuntime.handleLog('step6 selected', sel);
    }
  } catch (_) {}
  try {
    window.dispatchEvent(new CustomEvent('step6-handle-changed', { detail: { ...sel } }));
  } catch (_) {}
  return sel;
}

export function saveRoomStep6Selection(patch) {
  const cur = getRoomStep6HandleSelection();
  const p = patch && typeof patch === 'object' ? patch : {};
  const modelId = p.modelId !== undefined ? (p.modelId != null ? String(p.modelId).trim() || null : null) : cur.modelId;
  const handleItemId =
    p.handleItemId !== undefined
      ? Number(p.handleItemId) > 0
        ? Number(p.handleItemId)
        : null
      : cur.handleItemId;
  const sel = {
    seriesId: p.seriesId != null ? String(p.seriesId) : cur.seriesId,
    finishId: p.finishId !== undefined ? (p.finishId != null ? String(p.finishId) : null) : cur.finishId,
    modelId,
    handleItemId,
    roleSlots: p.roleSlots !== undefined ? p.roleSlots : cur.roleSlots || {},
  };
  return persistRoomStep6Selection(sel);
}

export function getRoleSlotAssignment(slotKey, selection) {
  const sel = selection || getRoomStep6HandleSelection();
  const slots = sel?.roleSlots;
  if (!slots || typeof slots !== 'object') return null;
  const a = slots[String(slotKey || '').trim()];
  return a && typeof a === 'object' ? a : null;
}

export function setRoleSlotAssignment(slotKey, assignment) {
  const key = String(slotKey || '').trim();
  if (!key) return getRoomStep6HandleSelection();
  const cur = getRoomStep6HandleSelection();
  const roleSlots = { ...(cur.roleSlots || {}) };
  if (!assignment) {
    delete roleSlots[key];
  } else {
    const o = assignment && typeof assignment === 'object' ? assignment : {};
    roleSlots[key] = {
      seriesId: o.seriesId != null ? String(o.seriesId) : '',
      modelId: o.modelId != null ? String(o.modelId).trim() || null : null,
      handleItemId: Number(o.handleItemId) > 0 ? Number(o.handleItemId) : null,
      orientation: String(o.orientation || '').trim(),
      noHandle: !!o.noHandle,
      positionAnchor: o.positionAnchor != null ? String(o.positionAnchor) : null,
      positionOffsetMm:
        o.positionOffsetMm != null && Number.isFinite(Number(o.positionOffsetMm))
          ? Number(o.positionOffsetMm)
          : null,
    };
  }
  return saveRoomStep6Selection({ roleSlots });
}

export function getRoomStep6HandleSelection() {
  try {
    const raw = localStorage.getItem(ROOM_STEP6_HANDLE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const norm = normalizeStep6Selection(parsed);
    if (norm) return norm;
  } catch (_) {}
  const cfg = readRoomStepsConfig();
  const step6 = cfg?.steps?.find((s) => s.stepId === 6);
  const defId = step6?.handleDefaults?.seriesId || step6?.defaultHandleSeriesId || null;
  if (defId) {
    return {
      seriesId: String(defId),
      finishId: step6?.handleDefaults?.finishId || null,
      modelId: step6?.handleDefaults?.modelId != null ? String(step6.handleDefaults.modelId) : null,
      handleItemId: Number(step6?.handleDefaults?.handleItemId) > 0 ? Number(step6.handleDefaults.handleItemId) : null,
      roleSlots: {},
    };
  }
  return { seriesId: 'volna', finishId: null, modelId: null, handleItemId: null, roleSlots: {} };
}

/** Дефолт серии из админки (шаг 6) → localStorage; как initStep5DefaultDecorsFromRoomConfig. */
export function initStep6DefaultHandlesFromRoomConfig() {
  const cfg = readRoomStepsConfig();
  const step6 = cfg?.steps?.find((s) => Number(s.stepId) === 6);
  const defId = step6?.handleDefaults?.seriesId || step6?.defaultHandleSeriesId || '';
  if (!defId) return null;
  const hd = step6?.handleDefaults || {};
  return persistRoomStep6Selection({
    seriesId: String(defId),
    finishId: hd.finishId != null ? String(hd.finishId) : null,
    modelId: hd.modelId != null ? String(hd.modelId).trim() || null : null,
    handleItemId: Number(hd.handleItemId) > 0 ? Number(hd.handleItemId) : null,
    roleSlots: {},
  });
}

export function buildRoleSlotKey(ctx) {
  const layoutRole = String(ctx?.layoutRole || 'facades')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_');
  const productKind = String(ctx?.productKind || 'wardrobe').trim().toLowerCase();
  const doorKind = String(ctx?.doorKind || 'rotate').trim().toLowerCase() === 'slide' ? 'slide' : 'rotate';
  return `${layoutRole}|${productKind}|${doorKind}`;
}

export function setRoomStep6HandleSelection(seriesId, finishId = null, opts = {}) {
  const cur = getRoomStep6HandleSelection();
  const o = opts && typeof opts === 'object' ? opts : {};
  return saveRoomStep6Selection({
    seriesId,
    finishId,
    modelId: o.modelId !== undefined ? o.modelId : cur.modelId,
    handleItemId: o.handleItemId !== undefined ? o.handleItemId : cur.handleItemId,
    roleSlots: o.roleSlots !== undefined ? o.roleSlots : cur.roleSlots,
  });
}

function isHandleCollectionSeries(s) {
  if (!s || typeof s !== 'object') return false;
  if (Number(s.parentCollectionId) > 0) return false;
  const et = String(s.entityType || 'collection').toLowerCase();
  return et !== 'size' && et !== 'variant';
}

export async function loadHandlesCatalog() {
  if (__handlesCatalogPromise) return __handlesCatalogPromise;
  __handlesCatalogPromise = (async () => {
    const { categories, series } = await fetchHandlesCatalogRaw();
    return {
      categories,
      series: series.filter(
        (s) => s && (s.active == null || Number(s.active) !== 0) && isHandleCollectionSeries(s)
      ),
    };
  })();
  return __handlesCatalogPromise;
}

function legacyModelCodeFromHandle(item) {
  const key = String(item?.key || '').trim();
  if (key.startsWith('handle-')) return key.slice(7);
  return key || String(item?.id || '');
}

function normalizeCollectionHandleEntry(row) {
  const collection = row.collection;
  if (row.kind === 'item') {
    const item = row.item;
    const modelId = legacyModelCodeFromHandle(item);
    const sizes = Array.isArray(item.sizes) ? item.sizes : [];
    const s0 = sizes[0] || {};
    const variant0 = Array.isArray(item.variants) && item.variants[0] ? item.variants[0] : null;
    return {
      id: item.id,
      key: String(item.key || ''),
      modelId,
      name: item.name || 'Ручка',
      icon: item.icon || collection?.icon || '',
      kind: item.kind || collection?.kind || 'knob',
      cabinetModelId: Number(item.cabinetModelId) || 0,
      barLengthMm: Number(s0.width) || Number(variant0?.barLengthMm) || 0,
      modelParams: item.modelParams && typeof item.modelParams === 'object' ? item.modelParams : {},
      source: 'item',
      finishes: Array.isArray(collection?.finishes) ? collection.finishes : [],
    };
  }
  const model = row.model;
  return {
    id: model.id,
    key: `handle-${String(model.id)}`,
    modelId: String(model.id),
    name: model.label || 'Ручка',
    icon: collection?.icon || '',
    kind: collection?.kind || 'bar',
    cabinetModelId: Number(model.cabinetModelId) || 0,
    barLengthMm: Number(model.barLengthMm) || 0,
    modelParams: {},
    source: 'legacy-model',
    finishes: Array.isArray(collection?.finishes) ? collection.finishes : [],
  };
}

/** Полный каталог (коллекции + ручки внутри коллекций). */
export async function loadHandlesCatalogFull() {
  if (__handlesCatalogFullPromise) return __handlesCatalogFullPromise;
  __handlesCatalogFullPromise = (async () => {
    const { categories, series } = await fetchHandlesCatalogRaw();
    return {
      categories,
      series: series.filter((s) => s && (s.active == null || Number(s.active) !== 0)),
    };
  })();
  return __handlesCatalogFullPromise;
}

function resolveStep6CollectionForItem(it, fullSeries) {
  const entry = findCatalogSeriesForStep6Item(it, fullSeries);
  if (!entry) return null;
  if (isHandleCollectionSeries(entry)) return entry;
  const pid = Number(entry.parentCollectionId);
  if (pid > 0) {
    const parent = fullSeries.find((s) => Number(s?.id) === pid);
    if (parent && isHandleCollectionSeries(parent)) return parent;
  }
  return null;
}

export function findCatalogSeriesForStep6Item(it, catalogSeries) {
  const list = Array.isArray(catalogSeries) ? catalogSeries : [];
  const key = String(it?.key || it?.seriesId || '').trim();
  if (key) {
    const byKey = list.find((s) => seriesSlug(s) === key || String(s?.id) === key);
    if (byKey) return byKey;
  }
  if (key.startsWith('/models/') || /volna/i.test(key)) {
    const byPath = list.find((s) => {
      const p = String(s?.modelParams?.modelPath || s?.modelParams?.model || '').trim();
      if (key.startsWith('/models/') && p === key) return true;
      return /volna/i.test(p);
    });
    if (byPath) return byPath;
  }
  const name = String(it?.name || '').trim();
  if (name) {
    const byName = list.find((s) => String(s?.name || '').trim() === name);
    if (byName) return byName;
  }
  return null;
}

/** Список для шага 6: из room_steps_config.step6.items или весь активный каталог. */
export async function getStep6HandleSeriesList() {
  const catalog = await loadHandlesCatalog();
  const full = await loadHandlesCatalogFull();
  const cfg = readRoomStepsConfig();
  const step6 = cfg?.steps?.find((s) => s.stepId === 6);
  const items = Array.isArray(step6?.items) ? step6.items : [];
  if (items.length > 0) {
    const orderMap = new Map();
    items.forEach((it, i) => {
      const col = resolveStep6CollectionForItem(it, full.series);
      const slug = col
        ? seriesSlug(col)
        : String(it.key || it.seriesId || it.id || '').trim();
      if (!slug) return;
      const ord = it.order != null ? Number(it.order) : i;
      const prev = orderMap.get(slug);
      if (prev == null || ord < prev) orderMap.set(slug, ord);
    });
    const picked = catalog.series
      .filter((s) => orderMap.has(seriesSlug(s)))
      .slice()
      .sort((a, b) => (orderMap.get(seriesSlug(a)) || 0) - (orderMap.get(seriesSlug(b)) || 0));
    if (picked.length) return picked;
    // Каталог не сопоставился — карточки из step6 (key может быть /models/…fbx)
    return items
      .slice()
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
      .map((it) => {
        const cat = findCatalogSeriesForStep6Item(it, catalog.series);
        if (cat) return cat;
        const mp = String(it.modelPath || '').trim() || (isModelAssetPath(it.key) ? String(it.key).trim() : '');
        return {
          id: it.id || mp || it.key,
          key: String(it.key || it.seriesId || mp || it.id || ''),
          name: it.name || 'Ручка',
          kind: it.kind || 'knob',
          modelParams: mp ? { modelType: 'normal', modelPath: mp } : {},
        };
      });
  }
  return catalog.series.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
}

/** Ручки внутри коллекции: дочерние записи каталога + legacy models[]. */
export async function getCollectionHandlesList(collection) {
  if (!collection || typeof collection !== 'object') return [];
  const full = await loadHandlesCatalogFull();
  const cid = Number(collection.id) || 0;
  if (!cid) return [];
  const children = full.series
    .filter((it) => Number(it?.parentCollectionId) === cid)
    .sort((a, b) => (Number(a?.order) || 0) - (Number(b?.order) || 0));
  const coveredCodes = new Set(children.map((ch) => legacyModelCodeFromHandle(ch)));
  const models = Array.isArray(collection.models) ? collection.models : [];
  const legacy = models
    .filter((m) => !coveredCodes.has(String(m?.id || '')))
    .map((model) => normalizeCollectionHandleEntry({ kind: 'legacy-model', model, collection }));
  return [
    ...children.map((item) => normalizeCollectionHandleEntry({ kind: 'item', item, collection })),
    ...legacy,
  ];
}

function isModelAssetPath(v) {
  const s = String(v || '').trim();
  return s.startsWith('/models/') && /\.(fbx|glb|gltf)$/i.test(s);
}

export function getHandleSeriesById(seriesId) {
  const id = String(seriesId || '').trim();
  if (!id) return null;
  return loadHandlesCatalog().then((cat) =>
    cat.series.find((s) => seriesMatchesId(s, id)) || null
  );
}

export function invalidateHandlesCatalogCache() {
  __handlesCatalogPromise = null;
  __handlesCatalogFullPromise = null;
}

if (typeof window !== 'undefined') {
  window.invalidateHandlesCatalogCache = invalidateHandlesCatalogCache;
}
