/**
 * STEP 4A — sidePanels mode=replacement:
 * штатная боковина остаётся на месте; материал → фасадный канал outside (g3, 16 мм).
 * Без второй доски, без +16 мм снаружи, без расширения столешницы.
 * size/pos/pivot/jointSchemes не трогаем.
 */

import {
  SIDE_PANEL_OVERLAY_ID_LEFT,
  SIDE_PANEL_OVERLAY_ID_RIGHT,
  SIDE_PANEL_OVERLAY_NAME_LEFT,
  SIDE_PANEL_OVERLAY_NAME_RIGHT,
} from './kitchen-side-panels-overlay-geometry.js?v=20261031-side4b';

const STOCK_MAT_BACKUP = '__cldSidePanelStockMaterial';
const REPLACEMENT_FLAG = '__cldSidePanelReplacementActive';

/** g3 = фасад 16 мм (как g0 корпус 16) — толщина и s:x-32 не ломаются. */
const FACADE_MATERIAL_16 = Object.freeze({
  group: 'g3',
  key: 'material_2',
  rotated: false,
  fixed: false,
});

const STOCK_MATERIAL_DEFAULT = Object.freeze({
  group: 'g0',
  key: 'material_2',
  rotated: false,
  fixed: false,
});

/**
 * @param {object|object[]|null} roots
 * @param {(n: object) => void} fn
 */
function walkTree(roots, fn) {
  const list = Array.isArray(roots) ? roots : roots ? [roots] : [];
  const walk = (n) => {
    if (!n || typeof n !== 'object') return;
    fn(n);
    if (Array.isArray(n.children)) n.children.forEach(walk);
    const tt = n.spec && n.spec.template_tree;
    if (Array.isArray(tt)) tt.forEach(walk);
    const emb = n.template && n.template.tree;
    if (Array.isArray(emb)) emb.forEach(walk);
  };
  list.forEach(walk);
}

function isOverlayNode(n) {
  if (!n || typeof n !== 'object') return false;
  const id = String(n.id || '');
  if (id === SIDE_PANEL_OVERLAY_ID_LEFT || id === SIDE_PANEL_OVERLAY_ID_RIGHT) return true;
  if (n.cldSidePanelOverlay === true) return true;
  const name = String(n.name || '');
  return name === SIDE_PANEL_OVERLAY_NAME_LEFT || name === SIDE_PANEL_OVERLAY_NAME_RIGHT;
}

/**
 * Штатная боковина корпуса (не overlay).
 * @param {object} n
 * @param {'left'|'right'} side
 */
export function isKitchenStockSideWallNode(n, side) {
  if (!n || typeof n !== 'object') return false;
  if (String(n.type || '').toLowerCase() !== 'wall') return false;
  if (isOverlayNode(n)) return false;
  const want = String(side || '').toLowerCase();
  if (want !== 'left' && want !== 'right') return false;
  const dt = String(n.spec?.detailTypeId || n.spec?.detail_type_id || '')
    .trim()
    .toLowerCase();
  const s = String(n.spec?.side || '')
    .trim()
    .toLowerCase();
  const name = String(n.name || '');
  if (want === 'left') {
    if (dt === 'vertical_left' || s === 'left') return true;
    if (/бок\s*лев/i.test(name)) return true;
    return false;
  }
  if (dt === 'vertical_right' || s === 'right') return true;
  if (/бок\s*прав/i.test(name)) return true;
  return false;
}

/**
 * @param {object|object[]|null} roots
 * @param {'left'|'right'} side
 * @returns {object[]}
 */
export function findKitchenStockSideWallNodes(roots, side) {
  const out = [];
  walkTree(roots, (n) => {
    if (isKitchenStockSideWallNode(n, side)) out.push(n);
  });
  return out;
}

/**
 * Гидратация пустых nested module → spec.template_tree (как ClodisBuilder).
 * Нужна, чтобы найти «Бок левый/правый» внутри catalog_45/47/49.
 * @param {object|object[]|null} roots
 */
export function hydrateKitchenSidePanelCatalogModules(roots) {
  if (typeof window === 'undefined') {
    return { ok: false, reason: 'no_window' };
  }
  const B = window.ClodisBuilder;
  if (!B || !B.prototype || typeof B.prototype._hydrateCatalogModulesInPlanTree !== 'function') {
    return { ok: false, reason: 'no_clodis_builder_hydrate' };
  }
  try {
    const inst = Object.create(B.prototype);
    const stats = inst._hydrateCatalogModulesInPlanTree(roots);
    return { ok: true, stats: stats || null };
  } catch (e) {
    return { ok: false, reason: 'hydrate_failed', message: String(e?.message || e) };
  }
}

function _cloneMat(mat) {
  if (!mat || typeof mat !== 'object') return { ...STOCK_MATERIAL_DEFAULT };
  try {
    return JSON.parse(JSON.stringify(mat));
  } catch (_) {
    return { ...mat };
  }
}

function _setWallMaterial(n, mat) {
  if (!n.spec || typeof n.spec !== 'object') n.spec = {};
  n.spec.material = _cloneMat(mat);
}

function _applyReplacementOnWall(n) {
  if (!n[STOCK_MAT_BACKUP]) {
    const cur = n.spec?.material;
    n[STOCK_MAT_BACKUP] = cur && typeof cur === 'object' ? _cloneMat(cur) : { ...STOCK_MATERIAL_DEFAULT };
  }
  _setWallMaterial(n, FACADE_MATERIAL_16);
  n[REPLACEMENT_FLAG] = true;
}

function _restoreStockOnWall(n) {
  if (!n[REPLACEMENT_FLAG] && !n[STOCK_MAT_BACKUP]) return false;
  const backup = n[STOCK_MAT_BACKUP];
  _setWallMaterial(n, backup && typeof backup === 'object' ? backup : STOCK_MATERIAL_DEFAULT);
  try {
    delete n[REPLACEMENT_FLAG];
    delete n[STOCK_MAT_BACKUP];
  } catch (_) {
    n[REPLACEMENT_FLAG] = false;
    n[STOCK_MAT_BACKUP] = null;
  }
  return true;
}

/**
 * Apply/restore replacement materials on stock L/R walls.
 * @param {object|object[]|null} roots
 * @param {{ sidePanels?: object|null, hydrate?: boolean }} [opts]
 */
export function applyKitchenSidePanelReplacementToClodisRoots(roots, opts = {}) {
  const sp = opts?.sidePanels && typeof opts.sidePanels === 'object' ? opts.sidePanels : null;
  const leftMode = String(sp?.left?.mode || 'standard').toLowerCase();
  const rightMode = String(sp?.right?.mode || 'standard').toLowerCase();
  const needHydrate =
    opts?.hydrate !== false && (leftMode === 'replacement' || rightMode === 'replacement');

  let hydrate = null;
  if (needHydrate) {
    hydrate = hydrateKitchenSidePanelCatalogModules(roots);
  }

  const leftNodes = findKitchenStockSideWallNodes(roots, 'left');
  const rightNodes = findKitchenStockSideWallNodes(roots, 'right');

  const result = {
    left: { mode: leftMode, nodes: leftNodes.length, applied: false, restored: false },
    right: { mode: rightMode, nodes: rightNodes.length, applied: false, restored: false },
    hydrate,
    ok: true,
  };

  const runSide = (side, mode, nodes) => {
    const slot = result[side];
    if (mode === 'replacement') {
      if (!nodes.length) {
        slot.ok = false;
        slot.reason = 'stock_side_not_found';
        result.ok = false;
        return;
      }
      nodes.forEach(_applyReplacementOnWall);
      slot.applied = true;
      slot.ok = true;
      return;
    }
    // standard / overlay / filler — вернуть штатный материал, если меняли
    let restored = false;
    nodes.forEach((n) => {
      if (_restoreStockOnWall(n)) restored = true;
    });
    slot.restored = restored;
    slot.ok = true;
  };

  runSide('left', leftMode, leftNodes);
  runSide('right', rightMode, rightNodes);

  return result;
}

/**
 * После сборки THREE: пометить штатные бока outside / вернуть inside.
 * Страховка, если дерево не гидратировалось, но меши уже есть.
 * @param {object} group furniture root
 * @param {object|null} sidePanels
 */
export function applyKitchenSidePanelReplacementAppearance(group, sidePanels) {
  if (!group || typeof group.traverse !== 'function') {
    return { ok: false, reason: 'no_group' };
  }
  const sp = sidePanels && typeof sidePanels === 'object' ? sidePanels : group.userData?.sidePanels;
  const leftMode = String(sp?.left?.mode || 'standard').toLowerCase();
  const rightMode = String(sp?.right?.mode || 'standard').toLowerCase();
  let leftN = 0;
  let rightN = 0;

  group.traverse((o) => {
    const ud = o?.userData;
    if (!ud || ud.cldSidePanelOverlay || ud.cldSidePanelFiller) return;
    const dt = String(ud.detailTypeId || '').toLowerCase();
    const name = String(o.name || ud.detailName || '');
    let side = null;
    if (dt === 'vertical_left' || /бок\s*лев/i.test(name)) side = 'left';
    else if (dt === 'vertical_right' || /бок\s*прав/i.test(name)) side = 'right';
    if (!side) return;
    // Overlay / filler — не штатный бок
    if (/SidePanelOverlay|SidePanelFiller/i.test(name)) return;

    const mode = side === 'left' ? leftMode : rightMode;
    if (mode === 'replacement') {
      ud.step5DecorChannel = 'outside';
      ud.cldFacadeMaterialGroup = true;
      ud.isBody = false;
      ud.__cldSidePanelReplacementAppearance = true;
      if (side === 'left') leftN += 1;
      else rightN += 1;
    } else if (ud.__cldSidePanelReplacementAppearance) {
      ud.step5DecorChannel = 'inside';
      ud.cldFacadeMaterialGroup = false;
      ud.isBody = true;
      try {
        delete ud.__cldSidePanelReplacementAppearance;
      } catch (_) {
        ud.__cldSidePanelReplacementAppearance = false;
      }
    }
  });

  try {
    if (typeof window !== 'undefined' && typeof window.refreshFurnitureDecors === 'function') {
      window.refreshFurnitureDecors();
    } else if (typeof window !== 'undefined' && typeof window.__cldRefreshFurnitureDecors === 'function') {
      window.__cldRefreshFurnitureDecors();
    }
  } catch (_) {}

  return {
    ok: true,
    left: { mode: leftMode, meshes: leftN },
    right: { mode: rightMode, meshes: rightN },
  };
}

/**
 * Модуль поддерживает replacement, если после гидрации находятся обе штатные боковины
 * или хотя бы запрашиваемая сторона.
 * @param {object|object[]|null} roots
 * @param {'left'|'right'|null} [side]
 */
export function kitchenSidePanelReplacementSupported(roots, side = null) {
  const hydrate = hydrateKitchenSidePanelCatalogModules(roots);
  if (side === 'left' || side === 'right') {
    return {
      ok: findKitchenStockSideWallNodes(roots, side).length > 0,
      hydrate,
      left: findKitchenStockSideWallNodes(roots, 'left').length,
      right: findKitchenStockSideWallNodes(roots, 'right').length,
    };
  }
  const l = findKitchenStockSideWallNodes(roots, 'left').length;
  const r = findKitchenStockSideWallNodes(roots, 'right').length;
  return { ok: l > 0 && r > 0, hydrate, left: l, right: r };
}

if (typeof window !== 'undefined') {
  window.__cldApplyKitchenSidePanelReplacementToClodisRoots =
    applyKitchenSidePanelReplacementToClodisRoots;
  window.__cldApplyKitchenSidePanelReplacementAppearance =
    applyKitchenSidePanelReplacementAppearance;
  window.__cldKitchenSidePanelReplacementSupported = kitchenSidePanelReplacementSupported;
}
