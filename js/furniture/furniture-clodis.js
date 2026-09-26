// Clodis JSON helpers — дерево секций каталога / комнаты
import {
  normalizeClodisRoots,
  planRootsHaveFacadeShell,
} from '../cabinet-pyramid-layout.js?v=20260615-drawer-facade-depth';
import { readClodisJSON, readClodisVariables } from '../clodis-json-fields.js?v=20260615-purity';

/**
 * Достать массив секций из обёртки конструктора (template.structure / spec.template.tree).
 * @param {*} obj
 * @returns {Array|null}
 */
function extractStructureArrayFromWrapper(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const st = obj.template?.structure;
  if (Array.isArray(st) && st.length > 0) return st;
  const tr = obj.spec?.template?.tree;
  if (Array.isArray(tr) && tr.length > 0) return tr;
  return null;
}

/**
 * Развернуть [[{ template: { structure: [...] } }]] → [...] (как после «Выгрузить в конструктор»).
 * @param {Array} arr
 * @returns {Array}
 */
function normalizeClodisRootArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return arr || [];
  let cur = arr;
  for (let depth = 0; depth < 6; depth++) {
    if (cur.length !== 1 || !cur[0] || typeof cur[0] !== 'object') break;
    const el = cur[0];
    if (el.type === 'section' || el.type === 'module' || el.type === 'wall' || el.type === 'detail') break;
    const inner = extractStructureArrayFromWrapper(el);
    if (Array.isArray(inner) && inner.length > 0) {
      cur = inner;
      continue;
    }
    break;
  }
  return cur;
}

/** Собрать jointSchemes по id стенки из дерева (рекурсия по children). */
function __walkCollectWallJointSchemes(node, map) {
  if (!node || typeof node !== 'object') return;
  const id = node.id != null ? String(node.id) : '';
  const isWall =
    node.type === 'wall' ||
    node.type === 'detail' ||
    node.originalType === 'detail';
  if (id && isWall && Array.isArray(node.jointSchemes) && node.jointSchemes.length > 0) {
    try {
      map.set(id, JSON.parse(JSON.stringify(node.jointSchemes)));
    } catch (_) {
      map.set(id, node.jointSchemes.slice());
    }
  }
  const ch = node.children;
  if (Array.isArray(ch)) {
    for (let i = 0; i < ch.length; i++) __walkCollectWallJointSchemes(ch[i], map);
  }
}

function __walkCollectFromRoots(roots, map) {
  if (roots == null || !map) return;
  if (Array.isArray(roots)) {
    for (let i = 0; i < roots.length; i++) __walkCollectWallJointSchemes(roots[i], map);
  } else {
    __walkCollectWallJointSchemes(roots, map);
  }
}

/**
 * Карта id → jointSchemes: сначала из сырого clodisJSON (актуальные схемы из каталога),
 * затем из constructor_structure только для id, которых нет в плане (избегаем «старых» 4 стыков).
 */
function __collectJointSchemeOverlayMap(furnitureData) {
  const overlay = new Map();
  if (!furnitureData || Array.isArray(furnitureData)) return overlay;

  let raw = readClodisJSON(furnitureData);
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch (_) {
      raw = null;
    }
  }
  if (raw && typeof raw === 'object') {
    if (Array.isArray(raw)) {
      __walkCollectFromRoots(raw, overlay);
    } else {
      const inner = extractStructureArrayFromWrapper(raw);
      if (inner) __walkCollectFromRoots(inner, overlay);
      if (Array.isArray(raw.children)) __walkCollectFromRoots(raw.children, overlay);
      __walkCollectWallJointSchemes(raw, overlay);
    }
  }

  const item = furnitureData?.catalogItem || furnitureData;
  let cs = item?.data?.constructor_structure ?? item?.constructor_structure;
  if (typeof cs === 'string') {
    try {
      cs = JSON.parse(cs);
    } catch (_) {
      cs = null;
    }
  }
  if (cs && typeof cs === 'object') {
    const fillFrom = (roots) => {
      const tmp = new Map();
      __walkCollectFromRoots(roots, tmp);
      for (const [k, v] of tmp) {
        if (!overlay.has(k)) overlay.set(k, v);
      }
    };
    const wrapped = extractStructureArrayFromWrapper(cs);
    if (wrapped) fillFrom(wrapped);
    if (cs.type === 'module' && Array.isArray(cs.children)) fillFrom(cs.children);
  }

  return overlay;
}

function __cloneClodisRootsForSafeOverlay(roots) {
  try {
    if (typeof structuredClone === 'function') return structuredClone(roots);
  } catch (_) {}
  try {
    return JSON.parse(JSON.stringify(roots));
  } catch (_) {
    return roots;
  }
}

/** Подставить jointSchemes на стенки по id (после нормализации дерева). */
function __applyJointSchemesOverlayToClodisRoots(roots, overlay) {
  if (!overlay || overlay.size === 0 || roots == null) return;
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    const id = node.id != null ? String(node.id) : '';
    if (id && overlay.has(id) && (node.type === 'wall' || node.type === 'detail')) {
      try {
        node.jointSchemes = JSON.parse(JSON.stringify(overlay.get(id)));
      } catch (_) {
        node.jointSchemes = (overlay.get(id) || []).slice();
      }
    }
    const ch = node.children;
    if (Array.isArray(ch)) {
      for (let i = 0; i < ch.length; i++) walk(ch[i]);
    }
  };
  if (Array.isArray(roots)) {
    for (let i = 0; i < roots.length; i++) walk(roots[i]);
  } else {
    walk(roots);
  }
}

function __finalizeClodisForBuild(furnitureData, out) {
  if (!out || (Array.isArray(out) && out.length === 0)) return out || [];
  const cloned = __cloneClodisRootsForSafeOverlay(out);
  const patched = normalizeClodisRoots(cloned);
  if (patched > 0 && typeof console !== 'undefined' && console.log) {
    console.log('[CLD][pyramid] авто-исправление clodis:', patched);
  }
  const overlay = __collectJointSchemeOverlayMap(furnitureData);
  if (overlay.size > 0) {
    __applyJointSchemesOverlayToClodisRoots(cloned, overlay);
    if (typeof console !== 'undefined' && console.log) {
      console.log('[CLD][joint-overlay] крепёж подставлен по id из каталога:', overlay.size, 'стенок');
    }
  }
  return cloned;
}

/**
 * Нормализует furnitureData: возвращает Clodis JSON для сборки (массив секций)
 * @param {Object|Array} furnitureData - Данные мебели из каталога (cabinet.data)
 * @returns {Array}
 */
export function getClodisDataForBuild(furnitureData) {
  if (Array.isArray(furnitureData)) {
    return __finalizeClodisForBuild(null, normalizeClodisRootArray(furnitureData));
  }

  let raw = readClodisJSON(furnitureData);

  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch (e) {
      console.warn('[CLD][clodis] не удалось JSON.parse(clodisJSON):', e?.message || e);
      raw = null;
    }
  }

  const clodisLooksEmpty =
    raw == null ||
    (Array.isArray(raw) && raw.length === 0);
  if (clodisLooksEmpty) {
    const item = furnitureData?.catalogItem || furnitureData;
    let cs = item?.data?.constructor_structure ?? item?.constructor_structure;
    if (typeof cs === 'string') {
      try {
        cs = JSON.parse(cs);
      } catch (_) {
        cs = null;
      }
    }
    if (cs && typeof cs === 'object') {
      const wrapped = extractStructureArrayFromWrapper(cs);
      if (Array.isArray(wrapped) && wrapped.length > 0) {
        raw = wrapped;
      } else if (cs.type === 'module' && Array.isArray(cs.children) && cs.children.length > 0) {
        raw = cs.children;
      }
    }
  }

  if (raw == null) return [];

  let built;
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && raw.type === 'module' && Array.isArray(raw.children)) {
    built = normalizeClodisRootArray(raw.children);
  } else {
    const wrapped = extractStructureArrayFromWrapper(raw);
    if (wrapped) {
      built = normalizeClodisRootArray(wrapped);
    } else {
      const out = Array.isArray(raw) ? raw : [raw];
      built = normalizeClodisRootArray(out);
    }
  }

  return __finalizeClodisForBuild(furnitureData, built);
}

/**
 * Извлекает sectionSize (x,y,z в мм) из данных мебели.
 * Clodis JSON использует s:x, s:y, s:z — фактические размеры могут быть в catalogItem.params
 * @param {Object} furnitureData
 * @returns {{ x: number, y: number, z: number }}
 */
export function extractSectionSizeFromFurnitureData(furnitureData) {
  const def = { x: 600, y: 2400, z: 600 };
  if (!furnitureData) return def;

  const precomputed = furnitureData.sectionSize;
  if (precomputed && typeof precomputed.x === 'number' && precomputed.x > 0) {
    return { x: precomputed.x, y: precomputed.y || def.y, z: precomputed.z || def.z };
  }

  const item = furnitureData.catalogItem || furnitureData;
  let clodisTree = readClodisJSON(furnitureData) ?? (Array.isArray(furnitureData) ? furnitureData : null);
  if (typeof clodisTree === 'string') {
    try {
      clodisTree = JSON.parse(clodisTree);
    } catch (_) {
      clodisTree = null;
    }
  }
  if (clodisTree && typeof clodisTree === 'object' && !Array.isArray(clodisTree)) {
    const inner = extractStructureArrayFromWrapper(clodisTree);
    clodisTree = inner ? normalizeClodisRootArray(inner) : [clodisTree];
  } else if (Array.isArray(clodisTree)) {
    clodisTree = normalizeClodisRootArray(clodisTree);
  }
  const root = Array.isArray(clodisTree) ? clodisTree[0] : (clodisTree || furnitureData);

  const variant = item.params?.variants?.[0];
  if (variant && (typeof variant.width === 'number' || typeof variant.x === 'number')) {
    return {
      x: typeof variant.x === 'number' ? variant.x : (variant.width || def.x),
      y: typeof variant.y === 'number' ? variant.y : (variant.height || def.y),
      z: typeof variant.z === 'number' ? variant.z : (variant.depth || def.z),
    };
  }

  const ps = item.params?.sectionSize || item.sectionSize;
  if (ps && (typeof ps.x === 'number' || typeof ps.width === 'number')) {
    return {
      x: typeof ps.x === 'number' ? ps.x : (ps.width || def.x),
      y: typeof ps.y === 'number' ? ps.y : (ps.height || def.y),
      z: typeof ps.z === 'number' ? ps.z : (ps.depth || def.z),
    };
  }

  const dw = item.data?.width ?? item.width;
  const dh = item.data?.height ?? item.height;
  const dd = item.data?.depth ?? item.depth;
  const nw = typeof dw === 'number' ? dw : parseInt(dw, 10);
  const nh = typeof dh === 'number' ? dh : parseInt(dh, 10);
  const nd = typeof dd === 'number' ? dd : parseInt(dd, 10);
  if (Number.isFinite(nw) && nw > 0 && Number.isFinite(nh) && nh > 0 && Number.isFinite(nd) && nd > 0) {
    return { x: nw, y: nh, z: nd };
  }

  const isz = item.size;
  if (isz && (typeof isz.x === 'number' || typeof isz.width === 'number')) {
    return {
      x: typeof isz.x === 'number' ? isz.x : (isz.width || def.x),
      y: typeof isz.y === 'number' ? isz.y : (isz.height || def.y),
      z: typeof isz.z === 'number' ? isz.z : (isz.depth || def.z),
    };
  }

  if (item.params && (typeof item.params.width === 'number' || typeof item.params.x === 'number')) {
    return {
      x: typeof item.params.x === 'number' ? item.params.x : (item.params.width ?? def.x),
      y: typeof item.params.y === 'number' ? item.params.y : (item.params.height ?? def.y),
      z: typeof item.params.z === 'number' ? item.params.z : (item.params.depth ?? def.z),
    };
  }

  let dp = item.data;
  if (typeof dp === 'string') {
    try {
      dp = JSON.parse(dp);
    } catch (_) {
      dp = null;
    }
  }
  // item.data может содержать размеры напрямую (часто после сохранения из админки)
  if (dp && typeof dp === 'object') {
    const dnw = typeof dp.width === 'number' ? dp.width : parseInt(dp.width, 10);
    const dnh = typeof dp.height === 'number' ? dp.height : parseInt(dp.height, 10);
    const dnd = typeof dp.depth === 'number' ? dp.depth : parseInt(dp.depth, 10);
    if (
      Number.isFinite(dnw) && dnw > 0 &&
      Number.isFinite(dnh) && dnh > 0 &&
      Number.isFinite(dnd) && dnd > 0
    ) {
      return { x: dnw, y: dnh, z: dnd };
    }
    const dss = dp.sectionSize;
    if (dss && (typeof dss.x === 'number' || typeof dss.width === 'number')) {
      return {
        x: typeof dss.x === 'number' ? dss.x : (dss.width || def.x),
        y: typeof dss.y === 'number' ? dss.y : (dss.height || def.y),
        z: typeof dss.z === 'number' ? dss.z : (dss.depth || def.z),
      };
    }
  }
  if (dp && typeof dp === 'object' && dp.params) {
    const p = dp.params;
    if (p.sectionSize) {
      const s = p.sectionSize;
      return { x: s.x || def.x, y: s.y || def.y, z: s.z || def.z };
    }
    if (typeof p.width === 'number' || typeof p.x === 'number') {
      return {
        x: typeof p.x === 'number' ? p.x : (p.width ?? def.x),
        y: typeof p.y === 'number' ? p.y : (p.height ?? def.y),
        z: typeof p.z === 'number' ? p.z : (p.depth ?? def.z),
      };
    }
  }

  if (root && root.size) {
    const s = root.size;
    const nx = typeof s.x === 'number' ? s.x : (parseFloat(s.x) || (typeof s.width === 'number' ? s.width : NaN));
    const ny = typeof s.y === 'number' ? s.y : (parseFloat(s.y) || (typeof s.height === 'number' ? s.height : NaN));
    const nz = typeof s.z === 'number' ? s.z : (parseFloat(s.z) || (typeof s.depth === 'number' ? s.depth : NaN));
    if (Number.isFinite(nx) && Number.isFinite(ny) && Number.isFinite(nz)) {
      return { x: nx, y: ny, z: nz };
    }
  }

  // Экспорт конструктора: авторские мм на корневой секции (s:x/s:y/s:z в JSON не парсятся в числа)
  const author = root && root.__cldAuthorSizeMm;
  if (
    author &&
    Number(author.x) > 0 &&
    Number(author.y) > 0 &&
    Number(author.z) > 0
  ) {
    return { x: Number(author.x), y: Number(author.y), z: Number(author.z) };
  }

  return def;
}

/**
 * Выбрать одну секцию для сборки (ghost или Furniture) — как в legacy main.js
 * @param {Array} clodisForBuild
 * @returns {Object|null}
 */
export function getDataForBuild(clodisForBuild) {
  if (!clodisForBuild || clodisForBuild.length === 0) return null;
  const normalized = normalizeClodisRootArray(clodisForBuild);
  if (!normalized || normalized.length === 0) return null;

  if (normalized.length === 1 && normalized[0]?.type === 'section') {
    return normalized[0];
  }
  if (normalized[0]?.type === 'module' && normalized[0]?.children?.length > 0) {
    return normalized[0].children[0];
  }

  const first = normalized[0];
  const nested = extractStructureArrayFromWrapper(first);
  if (nested && nested.length > 0) {
    return getDataForBuild(nested);
  }

  if (first && first.type) {
    return first;
  }

  console.warn('[CLD][clodis] getDataForBuild: первый узел без type — проверьте clodisJSON', first);
  return first || null;
}

/**
 * Extract flat module variables for ClodisBuilder expressions (v:h_bottom / v:h_top).
 * Для режима «фиксированный корпус + антресоль»: corpus_body_mm (или corpus_fixed_mm / h_corpus_body) в variables.main.
 * Техзона над антресолью (layout_role service): tech_zone_mm или h_service / service_zone_mm (в мм).
 * Корпус — антресоль (layout_role corpus_antresol): фикс. 1950 мм (corpus_antresol_mm подставляется автоматически).
 * Admin export keeps them next to clodisJSON as `clodisVariables` (legacy clodis* зеркалируется).
 * ВАЖНО: в каталоге часто `clodisVariables: {}` (пустой объект) — его нельзя
 * трактовать как «единственный источник», иначе теряются `variables.main` из
 * `catalogItem.data.constructor_structure` (там же обычно лежит h_bottom).
 * @param {Object} furnitureData
 * @returns {Object<string, number>}
 */
function __coerceCatalogVarNumber(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (v == null || v === '') return null;
  if (typeof v === 'string') {
    const t = v.trim().replace(/\s/g, '').replace(',', '.');
    if (t === '') return null;
    const n = parseFloat(t);
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function extractModuleVariablesFromFurnitureData(furnitureData) {
  if (!furnitureData) return {};

  /** @type {Object<string, number>} */
  const merged = {};

  function assignFlat(source) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) return;
    for (const [k, v] of Object.entries(source)) {
      const key = String(k || '').trim();
      if (!key) continue;
      const n = __coerceCatalogVarNumber(v);
      if (n !== null) merged[key] = n;
    }
  }

  // 1) Каталог: constructor_structure.variables.main (часто без type:'module' в выгрузке)
  const ci = furnitureData.catalogItem;
  const cs = ci?.data?.constructor_structure || ci?.constructor_structure;
  if (cs && typeof cs === 'object' && cs.variables?.main && typeof cs.variables.main === 'object') {
    assignFlat(cs.variables.main);
  }

  // 1b) clodisVariables / legacy clodisVariables на элементе каталога
  const ciVars = readClodisVariables(ci) ?? readClodisVariables(furnitureData);
  if (ciVars && typeof ciVars === 'object' && !Array.isArray(ciVars)) {
    if (ciVars.main && typeof ciVars.main === 'object' && !Array.isArray(ciVars.main)) assignFlat(ciVars.main);
    else if (Object.keys(ciVars).length > 0) assignFlat(ciVars);
  }

  // 2) Обёртка clodisJSON = объект модуля (не массив секций)
  const ppWrap = readClodisJSON(furnitureData);
  if (ppWrap && typeof ppWrap === 'object' && !Array.isArray(ppWrap) && ppWrap.variables?.main && typeof ppWrap.variables.main === 'object') {
    assignFlat(ppWrap.variables.main);
  }

  // 3) Legacy на корне furnitureData
  if (furnitureData.variables?.main && typeof furnitureData.variables.main === 'object') {
    assignFlat(furnitureData.variables.main);
  }

  // 4) clodisVariables в cabinet.data — перекрывает предыдущие (если реально заданы)
  const pv = readClodisVariables(furnitureData);
  if (pv && typeof pv === 'object' && !Array.isArray(pv)) {
    if (pv.main && typeof pv.main === 'object' && !Array.isArray(pv.main)) {
      assignFlat(pv.main);
    } else if (Object.keys(pv).length > 0) {
      assignFlat(pv);
    }
  }

  // Как при экспорте clodisVariables в админке (admin-new-bundle): базовые отступы корпуса
  if (!Number.isFinite(merged.h_top)) merged.h_top = 0;
  if (!Number.isFinite(merged.h_bottom)) merged.h_bottom = 100;

  if (!(merged.corpus_antresol_mm > 0)) {
    try {
      const rawPP = readClodisJSON(furnitureData);
      let nodes = null;
      if (typeof rawPP === 'string') {
        try {
          nodes = JSON.parse(rawPP);
        } catch (_) {
          nodes = null;
        }
      } else if (Array.isArray(rawPP)) {
        nodes = rawPP;
      } else if (rawPP && typeof rawPP === 'object') {
        const inner = extractStructureArrayFromWrapper(rawPP);
        nodes = inner && inner.length ? inner : [rawPP];
      }
      const norm = Array.isArray(nodes) ? normalizeClodisRootArray(nodes) : [];
      const stack = [...norm];
      let hasAnt = false;
      while (stack.length) {
        const n = stack.pop();
        if (!n || typeof n !== 'object') continue;
        if (String(n.layout_role ?? n.sectionLayoutRole ?? '').trim() === 'corpus_antresol') {
          hasAnt = true;
          break;
        }
        if (Array.isArray(n.children)) stack.push(...n.children);
      }
      if (hasAnt) merged.corpus_antresol_mm = 1950;
    } catch (_) {}
  }

  if (!(merged.facade_thickness_mm > 0)) {
    try {
      const rawPP = readClodisJSON(furnitureData);
      let nodes = null;
      if (typeof rawPP === 'string') {
        try {
          nodes = JSON.parse(rawPP);
        } catch (_) {
          nodes = null;
        }
      } else if (Array.isArray(rawPP)) {
        nodes = rawPP;
      } else if (rawPP && typeof rawPP === 'object') {
        const inner = extractStructureArrayFromWrapper(rawPP);
        nodes = inner && inner.length ? inner : [rawPP];
      }
      const norm = Array.isArray(nodes) ? normalizeClodisRootArray(nodes) : [];
      if (planRootsHaveFacadeShell(norm)) {
        const fromVars = Number(
          (readClodisVariables(furnitureData)?.facade_thickness_mm ?? readClodisVariables(ci)?.facade_thickness_mm)
        );
        merged.facade_thickness_mm =
          Number.isFinite(fromVars) && fromVars > 0 ? fromVars : 16;
      }
    } catch (_) {}
  }

  return merged;
}
