/**
 * interiorTemplates — назначенные в админке шаблоны полки / ящика / штанги для fill-каталогов.
 * Fallback: узел в дереве конструктора → дефолт в коде.
 */
import { parseCatalogItemDataField } from './catalog-icon-aspect.js?v=20260707-interior-templates';

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function cloneJson(v) {
  return JSON.parse(JSON.stringify(v));
}

function normalizeCatalogTypeKey(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  return s.startsWith('catalog_') ? s : `catalog_${s}`;
}

function normalizeCatalogRef(raw) {
  const p = raw && typeof raw === 'object' ? raw : {};
  const catalogType = normalizeCatalogTypeKey(p.catalogType || p.catalog_type || '');
  const catalogId = String(p.catalogId ?? p.catalog_id ?? p.id ?? '').trim();
  if (catalogType && catalogId) return { catalogType, catalogId };
  return null;
}

function normalizeRodRef(raw) {
  const p = raw && typeof raw === 'object' ? raw : {};
  const modelId = String(p.modelId ?? p.model_id ?? p.id ?? '').trim();
  if (modelId) return { modelId };
  return null;
}

export function defaultInteriorTemplates() {
  return {
    shelf: null,
    drawer: null,
    rod: { modelId: '22' },
    shelfProps: defaultShelfProps(),
  };
}

export function defaultShelfProps() {
  return {
    enabled: 0,
    slots: [
      { model_id: '', x_mm: -20, y_mm: 0, z_mm: 0, rot_y: 0 },
      { model_id: '', x_mm: 90, y_mm: 0, z_mm: 0, rot_y: 0 },
    ],
  };
}

export function normalizeShelfProps(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const enabled = src.enabled === true || src.enabled === 1 || src.enabled === '1' ? 1 : 0;
  const rawSlots = Array.isArray(src.slots) ? src.slots : defaultShelfProps().slots;
  const slots = rawSlots.map((s) => {
    const p = s && typeof s === 'object' ? s : {};
    return {
      model_id: String(p.model_id ?? p.modelId ?? '').trim(),
      label: String(p.label || '').trim(),
      x_mm: Number.isFinite(Number(p.x_mm ?? p.x)) ? Number(p.x_mm ?? p.x) : 0,
      y_mm: Number.isFinite(Number(p.y_mm ?? p.y)) ? Number(p.y_mm ?? p.y) : 0,
      z_mm: Number.isFinite(Number(p.z_mm ?? p.z)) ? Number(p.z_mm ?? p.z) : 0,
      rot_y: Number.isFinite(Number(p.rot_y ?? p.rotY)) ? Number(p.rot_y ?? p.rotY) : 0,
    };
  });
  while (slots.length < 2) {
    slots.push({ model_id: '', x_mm: slots.length ? 90 : -20, y_mm: 0, z_mm: 0, rot_y: 0 });
  }
  return { enabled, slots };
}

export function normalizeInteriorTemplates(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    shelf: normalizeCatalogRef(src.shelf),
    drawer: normalizeCatalogRef(src.drawer),
    rod: normalizeRodRef(src.rod) || { modelId: '22' },
    shelfProps: normalizeShelfProps(src.shelfProps),
  };
}

export function extractInteriorTemplatesFromCatalogItem(catalogItem) {
  if (!catalogItem || typeof catalogItem !== 'object') return null;
  const parsed = parseCatalogItemDataField(catalogItem);
  const raw = parsed.interiorTemplates ?? catalogItem.interiorTemplates ?? null;
  if (!raw) return null;
  return normalizeInteriorTemplates(raw);
}

export function extractCatalogTemplateTree(catalogItem) {
  if (!catalogItem || typeof catalogItem !== 'object') return [];
  const parsed = parseCatalogItemDataField(catalogItem);
  const data =
    parsed && Object.keys(parsed).length
      ? { ...parsed, ...catalogItem, data: parsed }
      : catalogItem.data && typeof catalogItem.data === 'object' && !Array.isArray(catalogItem.data)
        ? catalogItem.data
        : catalogItem;
  const cs = data.constructor_structure || catalogItem.constructor_structure;
  if (cs && typeof cs === 'object') {
    if (cs.template && Array.isArray(cs.template.structure)) return cloneJson(cs.template.structure);
    if (cs.spec?.template?.tree && Array.isArray(cs.spec.template.tree)) {
      return cloneJson(cs.spec.template.tree);
    }
    if (cs.type === 'module' && Array.isArray(cs.children)) return cloneJson(cs.children);
    if (Array.isArray(cs)) return cloneJson(cs);
  }
  const fromData = data.clodisJSON ?? catalogItem.clodisJSON;
  if (Array.isArray(fromData) && fromData.length) return cloneJson(fromData);
  return [];
}

function findFirstNodeInTree(roots, pred) {
  const stack = [...(Array.isArray(roots) ? roots : roots ? [roots] : [])];
  while (stack.length) {
    const n = stack.pop();
    if (!n || typeof n !== 'object') continue;
    if (pred(n)) return n;
    if (Array.isArray(n.children)) stack.push(...n.children);
  }
  return null;
}

export function resolveCatalogItemByRef(ref, findCatalogItem) {
  if (!ref) return null;
  const catalogType = normalizeCatalogTypeKey(ref.catalogType);
  const catalogId = String(ref.catalogId || '').trim();
  if (!catalogType || !catalogId) return null;
  const idNum = Number(catalogId);
  if (typeof findCatalogItem === 'function' && Number.isFinite(idNum) && idNum > 0) {
    const hit = findCatalogItem(catalogType, idNum);
    if (hit) return hit;
  }
  try {
    const cache = globalThis.__CLD_CATALOGS_DATA?.[catalogType]?.items?.[catalogId];
    if (cache) return cache;
  } catch (_) {}
  return null;
}

function findModuleByElementType(tree, elementType) {
  const et = normalizeCatalogTypeKey(elementType);
  const etShort = et.replace(/^catalog_/, '');
  return findFirstNodeInTree(tree, (n) => {
    if (String(n.type || '').toLowerCase() !== 'module') return false;
    const net = String(n.spec?.element_type || '').trim().toLowerCase();
    return net === et || net === etShort;
  });
}

function findDrawerModuleInTree(tree) {
  return findFirstNodeInTree(tree, (n) => {
    if (String(n.type || '').toLowerCase() !== 'module') return false;
    const et = String(n.spec?.element_type || '').trim().toLowerCase();
    const role = String(n.layout_role ?? n.sectionLayoutRole ?? '').trim().toLowerCase();
    const name = String(n.name || n.spec?.key || '').toLowerCase();
    if (et === 'catalog_33' || et === '33' || role === 'drawer') return true;
    return /ящик|drawer/i.test(name) && !/планк|facade|фасад/i.test(name);
  });
}

function findShelfModuleInTree(tree) {
  return findFirstNodeInTree(tree, (n) => {
    if (String(n.type || '').toLowerCase() !== 'module') return false;
    const et = String(n.spec?.element_type || '').trim().toLowerCase();
    const role = String(n.layout_role ?? n.sectionLayoutRole ?? '').trim().toLowerCase();
    const name = String(n.name || n.spec?.key || '').toLowerCase();
    if (et === 'catalog_29' || et === '29') return true;
    if (role === 'shelf' && /полк|shelf/i.test(name)) return true;
    return /полк|shelf/i.test(name) && !/планк|strip|rail|ящик/i.test(name);
  });
}

function findRodModelInTree(tree) {
  return findFirstNodeInTree(tree, (n) => {
    const type = String(n.type || '').toLowerCase();
    if (type !== 'model' && type !== 'module') return false;
    const id = String(n.spec?.id ?? '').trim();
    const et = String(n.spec?.element_type || '').trim().toLowerCase();
    const role = String(n.layout_role ?? '').trim().toLowerCase();
    const name = String(n.name || n.spec?.key || '').toLowerCase();
    if (id === '22' || et === 'catalog_22' || role === 'rod') return true;
    return /штанг|rod|shtang/i.test(name);
  });
}

export function createDefaultRodTemplate(modelId = '22', modelName = 'Штанга') {
  return {
    type: 'model',
    name: modelName || 'Штанга',
    spec: { id: String(modelId || '22'), key: modelName || 'Штанга' },
    size: { x: 's:x-32', y: 16, z: 's:z' },
    pos: { x: 16, y: 0, z: 0 },
    pivot: { x: -1, y: -1, z: -1 },
    rot: { x: 0, y: 0, z: 0 },
    layout_role: 'rod',
    children: [],
  };
}

/**
 * Цельная ссылка на ящик catalog_33 (как сохранённый узел в id=5): live_catalog
 * разворачивает геометрию, а глубину/посадку выставляет applyDrawerSlotDepthToModule.
 * Важно: НЕ извлекаем внутренний узел карточки — он без геометрии и с чужой глубиной.
 */
export function createDrawerReferenceTemplate(catalogId, catalogType = 'catalog_33', drawerName = 'Ящик внутренний') {
  const id = String(catalogId || '1');
  return {
    type: 'module',
    name: drawerName || 'Ящик внутренний',
    spec: {
      id,
      element_type: catalogType || 'catalog_33',
      live_catalog: true,
    },
    size: { x: 's:x', y: 162, z: 's:z' },
    pos: { x: 0, y: 19, z: 's:z' },
    pivot: { x: -1, y: -1, z: 1 },
    rot: { x: 0, y: 0, z: 0 },
    layout_role: 'drawer',
    children: [],
  };
}

/** Плоская полка для наполнения: стабильный шаблон без live_catalog/template_tree. */
export function createDefaultShelfTemplate(thickness = 16) {
  const t = Math.max(8, num(thickness, 16));
  return {
    type: 'module',
    name: 'Полка',
    spec: { id: '6', element_type: 'catalog_29', key: 'Полка' },
    size: {
      x: 's:x-32',
      y: t,
      z: 's:z-9',
    },
    pos: {
      x: 16,
      y: 0,
      z: 3,
    },
    pivot: { x: -1, y: 0, z: -1 },
    rot: { x: 0, y: 0, z: 0 },
    layout_role: 'shelf',
    children: [],
  };
}

function readShelfDepthPlacementFromCatalogItem(catalogItem) {
  if (!catalogItem || typeof catalogItem !== 'object') return null;
  const tree = extractCatalogTemplateTree(catalogItem);
  if (!tree.length) return null;
  const wall = findFirstNodeInTree(tree, (n) => {
    if (!n || typeof n !== 'object') return false;
    if (String(n.type || '').toLowerCase() !== 'wall') return false;
    const orient = String(n.spec?.orientation || '').toLowerCase();
    const name = String(n.name || n.spec?.key || '').toLowerCase();
    const dt = String(n.spec?.detailTypeId || n.spec?.detail_type_id || '');
    return orient === 'h' || dt === 'horizontal_middle' || /полк|shelf/i.test(name);
  });
  if (!wall) return null;
  const out = {};
  const zExpr = wall.size?.z;
  const zPos = wall.pos?.z;
  if (zExpr != null && String(zExpr).trim() !== '') out.sizeZ = zExpr;
  if (zPos != null && String(zPos).trim() !== '') out.posZ = zPos;
  return out;
}

function normalizeShelfTemplateForFill(tpl, thickness = 16) {
  if (!tpl || typeof tpl !== 'object') return tpl;
  const out = cloneJson(tpl);
  const t = Math.max(8, num(thickness, 16));
  out.type = 'module';
  out.size = out.size && typeof out.size === 'object' ? { ...out.size } : {};
  out.pos = out.pos && typeof out.pos === 'object' ? { ...out.pos } : {};
  out.pivot = out.pivot && typeof out.pivot === 'object' ? { ...out.pivot } : {};
  if (out.size.x == null || String(out.size.x).trim() === '') out.size.x = 's:x-32';
  out.size.y = t;
  if (out.size.z == null || String(out.size.z).trim() === '') out.size.z = 's:z-9';
  if (out.pos.x == null || String(out.pos.x).trim() === '') out.pos.x = 16;
  if (out.pos.z == null || String(out.pos.z).trim() === '') out.pos.z = 0;
  out.pivot.x = out.pivot.x ?? -1;
  out.pivot.y = out.pivot.y ?? 0;
  out.pivot.z = out.pivot.z ?? -1;
  if (out.spec && typeof out.spec === 'object') {
    delete out.spec.live_catalog;
    delete out.spec.template_tree;
    delete out.spec.templates;
  }
  out.children = [];
  if (!out.layout_role && !out.sectionLayoutRole) out.layout_role = 'shelf';
  return out;
}

function applyShelfDepthPlacement(out, placement) {
  if (!out || typeof out !== 'object') return out;
  const p = placement && typeof placement === 'object' ? placement : {};
  out.size = out.size && typeof out.size === 'object' ? { ...out.size } : {};
  out.pos = out.pos && typeof out.pos === 'object' ? { ...out.pos } : {};
  // Глубина — на module; отступ от задней стенки (posZ) читает ClodisBuilder из inner wall catalog_29.
  out.size.z = p.sizeZ != null && String(p.sizeZ).trim() !== '' ? p.sizeZ : 's:z-9';
  if (out.pos.z == null || String(out.pos.z).trim() === '') out.pos.z = 0;
  return out;
}

function moduleTemplateFromCatalogItem(catalogItem, elementType, findInTree) {
  const tree = extractCatalogTemplateTree(catalogItem);
  if (!tree.length) return null;
  const node = findInTree(tree);
  if (!node) return null;
  const tpl = cloneJson(node);
  if (!tpl.layout_role) tpl.layout_role = elementType === 'catalog_33' ? 'drawer' : 'shelf';
  return tpl;
}

export function resolveInteriorShelfTemplate(opts = {}) {
  const templates = normalizeInteriorTemplates(opts.interiorTemplates);
  const findCatalogItem = opts.findCatalogItem;
  const thickness = num(opts.shelfThicknessMm, 16) || 16;
  let depthPlacement = null;

  if (templates.shelf) {
    const item = resolveCatalogItemByRef(templates.shelf, findCatalogItem);
    const tpl = item ? moduleTemplateFromCatalogItem(item, 'catalog_29', findShelfModuleInTree) : null;
    if (item) depthPlacement = readShelfDepthPlacementFromCatalogItem(item);
    if (tpl) return applyShelfDepthPlacement(normalizeShelfTemplateForFill(tpl, thickness), depthPlacement);
  }

  const fromTree = opts.treeChildren ? pickFromTreeChildren(opts.treeChildren, 'shelf') : null;
  if (fromTree) {
    if (!depthPlacement) {
      try {
        const id = String(fromTree.spec?.id ?? '6').trim() || '6';
        depthPlacement = readShelfDepthPlacementFromCatalogItem(
          globalThis.__CLD_CATALOGS_DATA?.catalog_29?.items?.[id]
        );
      } catch (_) {}
    }
    return applyShelfDepthPlacement(normalizeShelfTemplateForFill(fromTree, thickness), depthPlacement);
  }

  if (!depthPlacement) {
    try {
      depthPlacement = readShelfDepthPlacementFromCatalogItem(
        globalThis.__CLD_CATALOGS_DATA?.catalog_29?.items?.['6']
      );
    } catch (_) {}
  }
  return applyShelfDepthPlacement(createDefaultShelfTemplate(thickness), depthPlacement);
}

export function resolveInteriorRodTemplate(opts = {}) {
  const templates = normalizeInteriorTemplates(opts.interiorTemplates);
  const rodRef = templates.rod || { modelId: '22' };
  if (rodRef.modelId) {
    let modelName = 'Штанга';
    try {
      const cache = globalThis.__CLD_CATALOGS_DATA?.cabinet_model?.items?.[String(rodRef.modelId)];
      if (cache?.name) modelName = String(cache.name);
    } catch (_) {}
    return createDefaultRodTemplate(rodRef.modelId, modelName);
  }

  const fromTree = opts.treeChildren ? pickFromTreeChildren(opts.treeChildren, 'rod') : null;
  if (fromTree) return fromTree;

  return createDefaultRodTemplate('22');
}

export function resolveInteriorDrawerTemplate(opts = {}) {
  const templates = normalizeInteriorTemplates(opts.interiorTemplates);
  const findCatalogItem = opts.findCatalogItem;

  if (templates.drawer && templates.drawer.catalogId) {
    const ref = templates.drawer;
    const catalogType = ref.catalogType || 'catalog_33';
    let name = ref.label || 'Ящик внутренний';
    try {
      const item = resolveCatalogItemByRef(ref, findCatalogItem);
      if (item?.name) name = String(item.name);
    } catch (_) {}
    return createDrawerReferenceTemplate(ref.catalogId, catalogType, name);
  }

  const fromTree = opts.treeChildren ? pickFromTreeChildren(opts.treeChildren, 'drawer') : null;
  if (fromTree) return fromTree;

  return null;
}

function pickFromTreeChildren(children, kind) {
  if (!Array.isArray(children)) return null;
  if (kind === 'shelf') {
    const n = children.find((c) => {
      if (!c || typeof c !== 'object') return false;
      const et = String(c.spec?.element_type || '').trim().toLowerCase();
      const role = String(c.layout_role ?? c.sectionLayoutRole ?? '').trim().toLowerCase();
      const name = String(c.name || c.spec?.key || '').toLowerCase();
      if (role === 'zone_divider') return false;
      // Планки/крепеж, ящики, направляющие, фасады, петли — это НЕ полка
      // (та же логика исключений, что и в isFlatCatalogShelfModule),
      // иначе «Планки крепежные ящика» (catalog_29) выбираются образцом полки.
      if (/планк|крепеж|крепёж|ящик|drawer|направ|guide|rail|mount|strip|slider|slide|выдвиж/i.test(name)) return false;
      if (role === 'drawer' || role === 'rod' || role === 'facade' || role === 'hinge') return false;
      if (et === 'catalog_29' || et === '29' || role === 'shelf') return true;
      return /полк|shelf/i.test(name);
    });
    return n ? cloneJson(n) : null;
  }
  if (kind === 'drawer') {
    const n = children.find((c) => {
      if (!c || typeof c !== 'object') return false;
      const et = String(c.spec?.element_type || '').trim().toLowerCase();
      const role = String(c.layout_role ?? '').trim().toLowerCase();
      return et === 'catalog_33' || et === '33' || role === 'drawer';
    });
    return n ? cloneJson(n) : null;
  }
  if (kind === 'rod') {
    const n = children.find((c) => {
      if (!c || typeof c !== 'object') return false;
      const type = String(c.type || '').toLowerCase();
      if (type !== 'model' && type !== 'module') return false;
      const id = String(c.spec?.id ?? '').trim();
      const role = String(c.layout_role ?? '').trim().toLowerCase();
      return id === '22' || role === 'rod' || /штанг/i.test(String(c.name || ''));
    });
    return n ? cloneJson(n) : null;
  }
  return null;
}

export function interiorTemplatesHasAssigned(templates, kind) {
  const t = normalizeInteriorTemplates(templates);
  if (kind === 'shelf') return !!t.shelf;
  if (kind === 'drawer') return !!t.drawer;
  if (kind === 'rod') return !!(t.rod && t.rod.modelId);
  return !!(t.shelf || t.drawer || (t.rod && t.rod.modelId));
}

if (typeof globalThis !== 'undefined') {
  globalThis.__cldResolveInteriorShelfTemplate = resolveInteriorShelfTemplate;
  globalThis.__cldResolveInteriorRodTemplate = resolveInteriorRodTemplate;
  globalThis.__cldResolveInteriorDrawerTemplate = resolveInteriorDrawerTemplate;
  globalThis.__cldExtractInteriorTemplatesFromCatalogItem = extractInteriorTemplatesFromCatalogItem;
}
