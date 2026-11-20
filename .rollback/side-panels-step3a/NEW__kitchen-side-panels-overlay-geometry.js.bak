/**
 * STEP 3A: parametric side-panel overlay (16 mm) + own worktop extend.
 * Mutates Clodis roots only during prepare/build — not a second settings system.
 * Does not touch customZoneWidthsMm / balancer / neighbors.
 */

import { KITCHEN_SIDE_PANEL_OVERLAY_THICKNESS_MM } from './kitchen-side-panels-clearance.js?v=20261031-side2v';

export const SIDE_PANEL_OVERLAY_ID_LEFT = 'cld_side_panel_overlay_left';
export const SIDE_PANEL_OVERLAY_ID_RIGHT = 'cld_side_panel_overlay_right';
export const SIDE_PANEL_OVERLAY_NAME_LEFT = 'SidePanelOverlayLeft';
export const SIDE_PANEL_OVERLAY_NAME_RIGHT = 'SidePanelOverlayRight';

const OVERLAY_MM = KITCHEN_SIDE_PANEL_OVERLAY_THICKNESS_MM;

/**
 * @param {object|object[]|null} roots
 * @param {(n: object, ancestors: object[]) => void} fn
 */
function walkTree(roots, fn) {
  const list = Array.isArray(roots) ? roots : roots ? [roots] : [];
  const walk = (n, anc) => {
    if (!n || typeof n !== 'object') return;
    fn(n, anc);
    const next = anc.concat(n);
    if (Array.isArray(n.children)) n.children.forEach((ch) => walk(ch, next));
    const tt = n.spec && n.spec.template_tree;
    if (Array.isArray(tt)) tt.forEach((ch) => walk(ch, next));
  };
  list.forEach((n) => walk(n, []));
}

function isOverlayNode(n) {
  if (!n || typeof n !== 'object') return false;
  const id = String(n.id || '');
  if (id === SIDE_PANEL_OVERLAY_ID_LEFT || id === SIDE_PANEL_OVERLAY_ID_RIGHT) return true;
  if (n.cldSidePanelOverlay === true) return true;
  const name = String(n.name || '');
  return name === SIDE_PANEL_OVERLAY_NAME_LEFT || name === SIDE_PANEL_OVERLAY_NAME_RIGHT;
}

function isWorktopModule(n) {
  if (!n || typeof n !== 'object') return false;
  const et = String(n.spec?.element_type || '').toLowerCase();
  const lr = String(n.layout_role || n.layoutRole || '').toLowerCase();
  const name = String(n.name || '');
  if (et === 'catalog_53') return true;
  if (lr === 'top') return true;
  if (/столеш/i.test(name)) return true;
  return false;
}

function isCorpusModule(n) {
  if (!n || typeof n !== 'object') return false;
  const lr = String(n.layout_role || n.layoutRole || '').toLowerCase();
  if (lr === 'corpus') return true;
  const et = String(n.spec?.element_type || '').toLowerCase();
  if (et === 'catalog_45' || et === 'catalog_47') return true;
  return /стол рабочий|корпус/i.test(String(n.name || ''));
}

function findCabinetRoot(roots) {
  let found = null;
  walkTree(roots, (n) => {
    if (found) return;
    const lr = String(n.layout_role || n.layoutRole || '').toLowerCase();
    if (lr === 'cabinet_root' || (n.type === 'section' && Array.isArray(n.children))) {
      found = n;
    }
  });
  return found;
}

function findSideWallMaterial(roots, side) {
  let mat = null;
  walkTree(roots, (n) => {
    if (mat) return;
    if (String(n.type || '').toLowerCase() !== 'wall') return;
    if (String(n.spec?.side || '').toLowerCase() !== side) return;
    if (n.spec?.material) mat = JSON.parse(JSON.stringify(n.spec.material));
  });
  return (
    mat || {
      group: 'g0',
      key: 'material_2',
      rotated: false,
      fixed: false,
    }
  );
}

function stripOverlayNodes(roots) {
  walkTree(roots, (n) => {
    if (!Array.isArray(n.children) || !n.children.length) return;
    n.children = n.children.filter((ch) => !isOverlayNode(ch));
  });
}

function resetWorktopToCell(roots) {
  walkTree(roots, (n) => {
    if (!isWorktopModule(n)) return;
    n.size = n.size && typeof n.size === 'object' ? { ...n.size } : {};
    n.pos = n.pos && typeof n.pos === 'object' ? { ...n.pos } : {};
    n.size.x = 's:x';
    n.pos.x = 0;
    delete n.__cldSidePanelWorktopExtended;
  });
}

function extendWorktop(roots, leftOn, rightOn) {
  const addL = leftOn ? OVERLAY_MM : 0;
  const addR = rightOn ? OVERLAY_MM : 0;
  if (!(addL || addR)) return;
  walkTree(roots, (n) => {
    if (!isWorktopModule(n)) return;
    n.size = n.size && typeof n.size === 'object' ? { ...n.size } : {};
    n.pos = n.pos && typeof n.pos === 'object' ? { ...n.pos } : {};
    // Только X: передний/задний свес (z / pos.z) не трогаем.
    n.size.x = `s:x+${addL + addR}`;
    n.pos.x = addL ? -addL : 0;
    n.__cldSidePanelWorktopExtended = { leftMm: addL, rightMm: addR };
  });
}

function resolveCorpusBand(roots) {
  let corpus = null;
  walkTree(roots, (n) => {
    if (!corpus && isCorpusModule(n)) corpus = n;
  });
  const sizeY =
    corpus?.size?.y != null
      ? corpus.size.y
      : 's:y-v:h_bottom-v:h_top-v:tech_zone_mm';
  const posY = corpus?.pos?.y != null ? corpus.pos.y : 'v:h_bottom';
  const sizeZ = corpus?.size?.z != null ? corpus.size.z : 's:z';
  return { sizeY, posY, sizeZ };
}

function makeOverlayWall(side, band, material) {
  const isLeft = side === 'left';
  return {
    type: 'wall',
    id: isLeft ? SIDE_PANEL_OVERLAY_ID_LEFT : SIDE_PANEL_OVERLAY_ID_RIGHT,
    name: isLeft ? SIDE_PANEL_OVERLAY_NAME_LEFT : SIDE_PANEL_OVERLAY_NAME_RIGHT,
    active: 1,
    visible: 1,
    cldSidePanelOverlay: true,
    cldSidePanelOverlaySide: side,
    size: {
      x: OVERLAY_MM,
      y: band.sizeY,
      z: band.sizeZ,
    },
    pos: {
      x: isLeft ? -OVERLAY_MM : 's:x',
      y: band.posY,
      z: 0,
    },
    pivot: {
      x: -1,
      y: -1,
      z: -1,
    },
    rot: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    spec: {
      orientation: 'v',
      side,
      detailTypeId: isLeft ? 'vertical_left' : 'vertical_right',
      material: material,
    },
    children: [],
  };
}

/**
 * Apply/remove overlay nodes from Clodis roots based on sidePanels modes.
 * @param {object|object[]|null} roots
 * @param {{
 *   sidePanels?: { left?: { mode?: string }, right?: { mode?: string } }|null,
 *   enabledSides?: { left?: boolean, right?: boolean }
 * }} [opts]
 * @returns {{ left: boolean, right: boolean, overlayMm: number }}
 */
export function applyKitchenSidePanelOverlayToClodisRoots(roots, opts = {}) {
  const sp = opts?.sidePanels && typeof opts.sidePanels === 'object' ? opts.sidePanels : null;
  const en = opts?.enabledSides && typeof opts.enabledSides === 'object' ? opts.enabledSides : null;
  const leftOn =
    en?.left === true ||
    (en?.left !== false && String(sp?.left?.mode || '').toLowerCase() === 'overlay');
  const rightOn =
    en?.right === true ||
    (en?.right !== false && String(sp?.right?.mode || '').toLowerCase() === 'overlay');

  stripOverlayNodes(roots);
  resetWorktopToCell(roots);

  if (!leftOn && !rightOn) {
    return { left: false, right: false, overlayMm: OVERLAY_MM };
  }

  const cabinet = findCabinetRoot(roots);
  if (!cabinet) {
    return { left: false, right: false, overlayMm: OVERLAY_MM, reason: 'no_cabinet_root' };
  }
  if (!Array.isArray(cabinet.children)) cabinet.children = [];

  const band = resolveCorpusBand(roots);
  if (leftOn) {
    cabinet.children.push(makeOverlayWall('left', band, findSideWallMaterial(roots, 'left')));
  }
  if (rightOn) {
    cabinet.children.push(makeOverlayWall('right', band, findSideWallMaterial(roots, 'right')));
  }
  extendWorktop(roots, leftOn, rightOn);
  return { left: leftOn, right: rightOn, overlayMm: OVERLAY_MM };
}
