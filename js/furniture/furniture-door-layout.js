/**
 * doorLayout / zoneHand / doorKind — фильтр и подбор фасадных модулей шкафа при сборке в комнате.
 * @see docs (план: правая дверь, двустворчатая ly+ry)
 */

const DOOR_LAYOUT_MODES = new Set(['none', 'corpus', 'top', 'full']);
const FACADE_LAYOUT_ROLES = new Set(['facades', 'facades_main', 'facades_top']);

/** catalog_28: базовые id → правые / двустворчатые (см. tools/seed-door-hand-catalog.mjs) */
export const FACADE_CATALOG_HAND_MAP = {
  main: { left: 8, right: 11, double: 13 },
  top: { left: 7, right: 12, double: 14 },
};

const FACADE_CATALOG_ID_TO_SLOT = (() => {
  const m = new Map();
  for (const [slot, ids] of Object.entries(FACADE_CATALOG_HAND_MAP)) {
    for (const v of Object.values(ids)) {
      m.set(Number(v), slot);
    }
  }
  return m;
})();

export function normalizeDoorLayout(value) {
  const s = String(value == null ? '' : value).trim().toLowerCase();
  return DOOR_LAYOUT_MODES.has(s) ? s : null;
}

export function normalizeZoneHand(value) {
  const s = String(value == null ? '' : value).trim().toLowerCase();
  if (s === 'left' || s === 'ltr') return 'left';
  if (s === 'right' || s === 'rtl') return 'right';
  if (s === 'center') return 'center';
  return '';
}

export function normalizeDoorKind(value) {
  const s = String(value == null ? '' : value).trim().toLowerCase();
  return s === 'double' ? 'double' : s === 'single' ? 'single' : '';
}

export function resolveDoorLayoutFromFurnitureData(furnitureData) {
  if (!furnitureData) return null;
  const raw =
    furnitureData.doorLayout ??
    furnitureData.catalogItem?.doorLayout ??
    furnitureData.params?.doorLayout;
  return normalizeDoorLayout(raw);
}

export function resolveDoorKindFromFurnitureData(furnitureData) {
  if (!furnitureData) return '';
  const raw =
    furnitureData.doorKind ??
    furnitureData.catalogItem?.doorKind ??
    furnitureData.params?.doorKind ??
    furnitureData.catalogItem?.data?.doorKind;
  return normalizeDoorKind(raw);
}

function parseUnifiedFacadeFlag(raw) {
  if (raw === true || raw === 1 || raw === '1') return true;
  const s = String(raw == null ? '' : raw).trim().toLowerCase();
  return s === 'true' || s === 'yes' || s === 'on';
}

export function resolveUnifiedFacadeFromFurnitureData(furnitureData) {
  if (!furnitureData) return false;
  const raw =
    furnitureData.unifiedFacade ??
    furnitureData.catalogItem?.unifiedFacade ??
    furnitureData.catalogItem?.data?.unifiedFacade ??
    furnitureData.params?.unifiedFacade;
  return parseUnifiedFacadeFlag(raw);
}

export function extractUnifiedFacadeFromCatalogItem(item) {
  if (!item) return false;
  const d = item.data && typeof item.data === 'object' ? item.data : item;
  return parseUnifiedFacadeFlag(d.unifiedFacade ?? item.unifiedFacade);
}

/** Бегунок шага 4: цельные двери в комнате (только шкаф в нише, не тумбы/комоды). */
export function resolveRoomStep4UnifiedFacadeToggle() {
  return typeof window !== 'undefined' && window.step4UnifiedFacade === true;
}

function resolveModulePlacementKindHint(furnitureData, ctx = {}) {
  if (ctx.placementKind) return String(ctx.placementKind).trim().toLowerCase();
  const raw =
    furnitureData?.placementKind ??
    furnitureData?.__placementKind ??
    furnitureData?.userData?.__placementKind;
  return String(raw || '').trim().toLowerCase();
}

function resolveModuleProductKindHint(furnitureData, ctx = {}) {
  if (ctx.productKind) return String(ctx.productKind).trim().toLowerCase();
  const raw = furnitureData?.productKind ?? furnitureData?.catalogItem?.productKind;
  return String(raw || '').trim().toLowerCase();
}

/** Цельная дверь — только шкаф (ниша / wardrobe), не standalone_floor. */
export function isWardrobeModuleForUnifiedFacade(furnitureData, ctx = {}) {
  const placement = resolveModulePlacementKindHint(furnitureData, ctx);
  if (placement === 'standalone_floor') return false;
  if (placement === 'floor_in_niche') return true;
  const pk = resolveModuleProductKindHint(furnitureData, ctx);
  if (pk === 'wardrobe') return true;
  if (pk === 'pedestal' || pk === 'dresser' || pk === 'locker') return false;
  const roots =
    ctx.clodisRoots ??
    furnitureData?.clodisJSON ??
    furnitureData?.clodisRoots ??
    null;
  if (roots && clodisRootsHaveSplitFacades(roots)) return true;
  return false;
}

/** Стандарт: низ фасада на 30 мм ниже дна корпуса (при h_bottom=100 → 70 мм от пола). */
export const FACADE_BOTTOM_STANDARD_OVERHANG_MM = 30;
/** Глубокий режим: низ фасада 25 мм от пола (2,5 см). */
export const FACADE_BOTTOM_DEEP_FROM_FLOOR_MM = 25;

/** Бегунок шага 4: глубокое опускание низа фасада (2,5 см от пола). */
export function resolveRoomStep4FacadeBottomDeepToggle() {
  return typeof window !== 'undefined' && window.step4FacadeBottomDeep === true;
}

/**
 * Опускание низа нижнего фасада ниже дна корпуса, мм (комната).
 * @param {number} hBottomMm — v:h_bottom / plinthMm
 * @param {{ facade_bottom_overhang_mm?: number }} [opts]
 */
export function resolveLowerFacadeBottomOverhangMm(hBottomMm, opts = {}) {
  const explicit = Number(opts.facade_bottom_overhang_mm);
  if (Number.isFinite(explicit) && explicit >= 0) return explicit;
  const hb = Math.max(0, Number(hBottomMm) || 0);
  if (hb <= 0) return 0;
  if (resolveRoomStep4FacadeBottomDeepToggle()) {
    return Math.max(0, hb - FACADE_BOTTOM_DEEP_FROM_FLOOR_MM);
  }
  return FACADE_BOTTOM_STANDARD_OVERHANG_MM;
}

export function resolveEffectiveUnifiedFacade(furnitureData, ctx = {}) {
  if (ctx.unifiedFacade === false) return false;
  if (!isWardrobeModuleForUnifiedFacade(furnitureData, ctx)) return false;
  if (ctx.unifiedFacade === true) return true;
  if (resolveRoomStep4UnifiedFacadeToggle()) return true;
  return resolveUnifiedFacadeFromFurnitureData(furnitureData);
}

function collectFacadeRolesInTree(roots) {
  const roles = new Set();
  const walk = (node) => {
    if (node == null) return;
    if (Array.isArray(node)) {
      for (const n of node) walk(n);
      return;
    }
    if (typeof node !== 'object') return;
    const r = getNodeLayoutRole(node);
    if (r === 'facades_main' || r === 'facades_top' || r === 'facades') roles.add(r);
    if (Array.isArray(node.children)) {
      for (const c of node.children) walk(c);
    }
  };
  walk(roots);
  return roles;
}

/** В дереве есть и корпусный, и антресольный фасад (до срощивания). */
export function clodisRootsHaveSplitFacades(roots) {
  const roles = collectFacadeRolesInTree(roots);
  return roles.has('facades_main') && roles.has('facades_top');
}

export function readPairedHandCatalogIdsFromItem(item) {
  if (!item) return { left: 0, right: 0 };
  const d = item.data && typeof item.data === 'object' ? item.data : item;
  const raw = d.pairedHandCatalogItemIds;
  if (!raw || typeof raw !== 'object') return { left: 0, right: 0 };
  return {
    left: Number(raw.left) || 0,
    right: Number(raw.right) || 0,
  };
}

function countSwingRotateAnimators(root) {
  let swing = 0;
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (isSwingRotateAnimator(node)) swing += 1;
    if (Array.isArray(node.children)) node.children.forEach(walk);
  };
  if (Array.isArray(root)) root.forEach(walk);
  else walk(root);
  return swing;
}

/** Есть распашный animator (rotate), не ящик slide. */
export function clodisTreeHasSwingRotateDoor(root) {
  return countSwingRotateAnimators(root) > 0;
}

/** Шкаф с фасадами catalog_28 (rotate в подключаемом каталоге, не в корне дерева). */
export function clodisTreeHasLinkedSwingFacadeLayout(root) {
  if (!root) return false;
  const roles = collectFacadeRolesInTree(root);
  if (roles.has('facades_main') || roles.has('facades_top') || roles.has('facades')) {
    return true;
  }
  let found = false;
  const walk = (node) => {
    if (!node || typeof node !== 'object' || found) return;
    const et = String(node.spec?.element_type || node.element_type || '').toLowerCase();
    const role = getNodeLayoutRole(node);
    if (et === 'catalog_28' && FACADE_LAYOUT_ROLES.has(role)) found = true;
    if (Array.isArray(node.children)) node.children.forEach(walk);
  };
  if (Array.isArray(root)) root.forEach(walk);
  else walk(root);
  return found;
}

/** Распашная single-дверь: rotate в дереве или фасадные модули catalog_28. */
export function resolveModuleHasSwingDoor(ctx = {}) {
  if (ctx.hasSwingDoor === true) return true;
  if (ctx.hasSwingDoor === false) return false;
  const roots = ctx.clodisRoots;
  if (clodisTreeHasSwingRotateDoor(roots)) return true;
  if (clodisTreeHasLinkedSwingFacadeLayout(roots)) return true;
  return false;
}

function divisionPartsCount(division) {
  const parts = Math.max(0, Math.floor(Number(division?.parts) || 0));
  if (parts > 0) return parts;
  const segs = division?.segments || division?.segmentsLShape || division?.segmentsLShapeBack;
  if (!Array.isArray(segs) || !segs.length) return 0;
  let maxZi = -1;
  for (const seg of segs) {
    const zi = Number(seg?.zoneIndex);
    if (Number.isFinite(zi) && zi > maxZi) maxZi = zi;
  }
  return maxZi >= 0 ? maxZi + 1 : segs.length;
}

function neighborHasSingleSwing(neighbors, zoneIndex) {
  if (!Array.isArray(neighbors)) return false;
  const zi = Number(zoneIndex);
  if (!Number.isFinite(zi)) return false;
  return neighbors.some((n) => {
    if (!n || Number(n.zoneIndex) !== zi) return false;
    if (normalizeDoorKind(n.doorKind) === 'double') return false;
    return n.hasSwing !== false;
  });
}

/**
 * Чередование L-R-L-R по порядку шкафа слева направо (как двустворка из single).
 * @param {{ zoneIndex?: number, division?: object, swingOrdinal?: number, swingChainLen?: number }} ctx
 */
export function resolveZoneHandForSingleSwingModule(ctx = {}) {
  const zi = Number(ctx.zoneIndex);
  const ordRaw = Number(ctx.swingOrdinal);
  const ord = Number.isFinite(ordRaw) && ordRaw >= 0 ? ordRaw : Number.isFinite(zi) ? zi : 0;
  const chainLen = Number(ctx.swingChainLen);
  const hasChain = Number.isFinite(chainLen) && chainLen > 0;

  if (hasChain && chainLen === 1) {
    const parts = divisionPartsCount(ctx.division);
    const lastIdx = parts > 0 ? parts - 1 : zi;
    if (Number.isFinite(zi) && zi <= 0) return 'left';
    if (Number.isFinite(zi) && parts > 0 && zi >= lastIdx) return 'right';
    if (Number.isFinite(zi) && parts > 1) return zi < parts / 2 ? 'left' : 'right';
    return 'left';
  }

  let hand = ord % 2 === 0 ? 'left' : 'right';

  const parts = divisionPartsCount(ctx.division);
  const lastIdx = parts > 0 ? parts - 1 : zi;
  const atLeftWall = Number.isFinite(zi) && zi <= 0;
  const atRightWall = Number.isFinite(zi) && parts > 0 && zi >= lastIdx;

  if (ord === 0 && atLeftWall) hand = 'left';

  // Нечётное число: последний без пары у правой стены — открывание к стене
  if (hasChain && chainLen % 2 === 1 && ord === chainLen - 1 && atRightWall) {
    hand = 'right';
  }

  return hand;
}

/**
 * @param {{ furnitureData?: object, zoneIndex?: number|null, division?: object|null, doorKind?: string, hasSwingDoor?: boolean, sectionNeighbors?: object[], clodisRoots?: object|object[] }} ctx
 */
export function resolveZoneHandFromPlacement(ctx = {}) {
  const { furnitureData, zoneIndex, division } = ctx;
  const explicit =
    furnitureData?.zoneHand ??
    furnitureData?.catalogItem?.zoneHand ??
    furnitureData?.params?.zoneHand;
  const normExplicit = normalizeZoneHand(explicit);
  if (normExplicit) return normExplicit;

  const doorKind = normalizeDoorKind(ctx.doorKind) || 'single';
  const hasSwing = resolveModuleHasSwingDoor({
    hasSwingDoor: ctx.hasSwingDoor,
    clodisRoots: ctx.clodisRoots,
  });

  if (doorKind === 'single' && hasSwing) {
    return resolveZoneHandForSingleSwingModule({
      zoneIndex,
      division,
      swingOrdinal: ctx.swingOrdinal,
      swingChainLen: ctx.swingChainLen,
    });
  }

  const zi = Number(zoneIndex);
  const parts = divisionPartsCount(division);
  if (!Number.isFinite(zi) || parts <= 1) return 'left';
  if (zi <= 0) return 'left';
  if (zi >= parts - 1) return 'right';
  return zi < parts / 2 ? 'left' : 'right';
}

function deepClonePlanNode(node) {
  try {
    return JSON.parse(JSON.stringify(node));
  } catch (_) {
    return node;
  }
}

export function getNodeLayoutRole(node) {
  if (!node || typeof node !== 'object') return '';
  const raw = node.layout_role ?? node.sectionLayoutRole ?? '';
  if (typeof window !== 'undefined' && typeof window.__cldNormalizeSectionLayoutRole === 'function') {
    return window.__cldNormalizeSectionLayoutRole(raw) || '';
  }
  return String(raw).trim();
}

function collectFacadeRolesInChildren(children) {
  const roles = new Set();
  if (!Array.isArray(children)) return roles;
  for (const c of children) {
    const r = getNodeLayoutRole(c);
    if (FACADE_LAYOUT_ROLES.has(r)) roles.add(r);
  }
  return roles;
}

function isFacadeRoleVisibleForLayout(role, doorLayout, siblingFacadeRoles) {
  if (!FACADE_LAYOUT_ROLES.has(role)) return true;
  const mode = normalizeDoorLayout(doorLayout);
  if (!mode || mode === 'none') return false;
  if (mode === 'corpus') {
    if (siblingFacadeRoles.has('facades_main')) return role === 'facades_main';
    return false;
  }
  if (mode === 'top') {
    if (siblingFacadeRoles.has('facades_top')) return role === 'facades_top';
    return false;
  }
  if (mode === 'full') {
    if (siblingFacadeRoles.has('facades')) return role === 'facades';
    if (siblingFacadeRoles.has('facades_main') || siblingFacadeRoles.has('facades_top')) {
      return role === 'facades_main' || role === 'facades_top';
    }
    return role === 'facades';
  }
  return true;
}

function filterChildrenByDoorLayout(node, doorLayout) {
  if (!node || typeof node !== 'object' || !Array.isArray(node.children)) return;
  const facadeRoles = collectFacadeRolesInChildren(node.children);
  if (facadeRoles.size > 0) {
    node.children = node.children.filter((child) => {
      const role = getNodeLayoutRole(child);
      if (!FACADE_LAYOUT_ROLES.has(role)) return true;
      return isFacadeRoleVisibleForLayout(role, doorLayout, facadeRoles);
    });
  }
  for (const child of node.children) {
    filterChildrenByDoorLayout(child, doorLayout);
  }
}

function mergeUnifiedFacadeTreeMeta(mainNode, topNode) {
  if (!mainNode || !topNode) return;
  const topSpecId = topNode.spec?.id ?? topNode.spec?.linked_item_id;
  if (topSpecId != null && String(topSpecId).trim() !== '') {
    mainNode.__cldUnifiedFacadeTopCatalogSpecId = String(topSpecId).trim();
  }
  if (topNode.edges && typeof topNode.edges === 'object') {
    try {
      mainNode.__cldUnifiedFacadeTopEdges = JSON.parse(JSON.stringify(topNode.edges));
    } catch (_) {
      mainNode.__cldUnifiedFacadeTopEdges = { ...topNode.edges };
    }
  }
}

function patchUnifiedFacadeSiblings(children) {
  if (!Array.isArray(children)) return false;
  const facadeRoles = collectFacadeRolesInChildren(children);
  if (!facadeRoles.has('facades_main') || !facadeRoles.has('facades_top')) return false;
  const mainNode = children.find((ch) => getNodeLayoutRole(ch) === 'facades_main');
  const topNode = children.find((ch) => getNodeLayoutRole(ch) === 'facades_top');
  if (mainNode && topNode) mergeUnifiedFacadeTreeMeta(mainNode, topNode);
  for (let i = children.length - 1; i >= 0; i--) {
    if (getNodeLayoutRole(children[i]) === 'facades_top') {
      children.splice(i, 1);
    }
  }
  for (const ch of children) {
    if (getNodeLayoutRole(ch) === 'facades_main') {
      ch.size = ch.size && typeof ch.size === 'object' ? { ...ch.size } : {};
      ch.size.y = 's:y - v:h_bottom - v:tech_zone_mm';
    }
  }
  return true;
}

function walkApplyUnifiedFacade(node) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node.children)) {
    patchUnifiedFacadeSiblings(node.children);
    for (const c of node.children) walkApplyUnifiedFacade(c);
  }
}

/** Срощенная дверь: убрать facades_top, растянуть facades_main на всю полосу фасада. */
export function applyUnifiedFacadeToClodisTree(root) {
  if (!root) return root;
  if (Array.isArray(root)) {
    const clone = root.map((n) => deepClonePlanNode(n));
    for (const n of clone) walkApplyUnifiedFacade(n);
    return clone;
  }
  const clone = deepClonePlanNode(root);
  walkApplyUnifiedFacade(clone);
  return clone;
}

export function filterClodisTreeByDoorLayout(root, doorLayout) {
  const mode = normalizeDoorLayout(doorLayout);
  if (!mode) return root;
  if (Array.isArray(root)) {
    return root.map((n) => filterClodisTreeByDoorLayout(n, doorLayout));
  }
  const clone = deepClonePlanNode(root);
  filterChildrenByDoorLayout(clone, doorLayout);
  return clone;
}

function facadeSlotForLayoutRole(role) {
  const r = String(role || '').trim();
  if (r === 'facades_top') return 'top';
  return 'main';
}

function resolveTargetFacadeCatalogId(currentId, layoutRole, doorKind, zoneHand, pairedHand, skipDoubleRemap) {
  const id = Number(currentId) || 0;
  if (!id) return 0;
  const slot = facadeSlotForLayoutRole(layoutRole);
  const map = FACADE_CATALOG_HAND_MAP[slot];
  if (!map) return id;

  if (doorKind === 'double') {
    if (skipDoubleRemap) return id;
    return map.double || id;
  }

  const hand = normalizeZoneHand(zoneHand) || 'left';
  if (hand === 'right') {
    if (pairedHand?.right > 0) return Number(pairedHand.right);
    return map.right || id;
  }
  if (pairedHand?.left > 0) return Number(pairedHand.left);
  if (map.left === id || map.right === id) return map.left;
  const knownSlot = FACADE_CATALOG_ID_TO_SLOT.get(id);
  if (knownSlot === slot) return map.left;
  return id;
}

function parentHasPairedHandFacadeModules(siblings, layoutRole) {
  if (!Array.isArray(siblings) || !FACADE_LAYOUT_ROLES.has(layoutRole)) return false;
  const slot = facadeSlotForLayoutRole(layoutRole);
  const map = FACADE_CATALOG_HAND_MAP[slot];
  if (!map?.left || !map?.right) return false;
  let hasLeft = false;
  let hasRight = false;
  for (const c of siblings) {
    if (!c || typeof c !== 'object') continue;
    if (getNodeLayoutRole(c) !== layoutRole) continue;
    const et = String(c.spec?.element_type || c.element_type || '').toLowerCase();
    if (et !== 'catalog_28' && et !== 'facades') continue;
    const cid = Number(c.spec?.id ?? c.spec?.linked_item_id) || 0;
    if (cid === map.left) hasLeft = true;
    if (cid === map.right) hasRight = true;
  }
  return hasLeft && hasRight;
}

function walkRemapFacadeCatalogModules(node, opts, parent) {
  if (!node || typeof node !== 'object') return;
  const et = String(node.spec?.element_type || node.element_type || '').toLowerCase();
  const role = getNodeLayoutRole(node);
  if ((et === 'catalog_28' || et === 'facades') && FACADE_LAYOUT_ROLES.has(role)) {
    const curId = node.spec?.id ?? node.spec?.linked_item_id;
    const skipDoubleRemap = parentHasPairedHandFacadeModules(parent?.children, role);
    const nextId = resolveTargetFacadeCatalogId(
      curId,
      role,
      opts.doorKind,
      opts.zoneHand,
      opts.pairedHand,
      skipDoubleRemap
    );
    if (nextId > 0 && Number(curId) !== nextId) {
      node.spec = node.spec && typeof node.spec === 'object' ? { ...node.spec } : {};
      node.spec.id = String(nextId);
      if (node.spec.linked_item_id != null) node.spec.linked_item_id = nextId;
    }
  }
  if (Array.isArray(node.children)) {
    for (const c of node.children) walkRemapFacadeCatalogModules(c, opts, node);
  }
}

export function remapFacadeCatalogModulesInClodis(root, opts = {}) {
  const doorKind = normalizeDoorKind(opts.doorKind) || 'single';
  const zoneHand = normalizeZoneHand(opts.zoneHand) || 'left';
  const pairedHand = opts.pairedHand || null;
  if (Array.isArray(root)) {
    const clone = root.map((n) => deepClonePlanNode(n));
    for (const n of clone) walkRemapFacadeCatalogModules(n, { doorKind, zoneHand, pairedHand }, null);
    return clone;
  }
  const clone = deepClonePlanNode(root);
  walkRemapFacadeCatalogModules(clone, { doorKind, zoneHand, pairedHand }, null);
  return clone;
}

function isSwingRotateAnimator(node) {
  if (!node || String(node.type || '').toLowerCase() !== 'animator') return false;
  const fn = String(node.spec?.fn || '').toLowerCase();
  if (fn !== 'rotate') return false;
  const srcId = String(node.spec?.source?.id || '').toLowerCase();
  if (srcId === 'hinge_animator') return false;
  return true;
}

/** Две+ распашные аниматоры — уже двустворчатый шаблон; zoneHand не трогаем. */
export function planTreeHasDoubleLeafPattern(root) {
  let swing = 0;
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (isSwingRotateAnimator(node)) swing += 1;
    if (Array.isArray(node.children)) node.children.forEach(walk);
  };
  if (Array.isArray(root)) root.forEach(walk);
  else walk(root);
  return swing >= 2;
}

function patchOpeningOnNode(node, zoneHand) {
  node.spec = node.spec && typeof node.spec === 'object' ? { ...node.spec } : {};
  node.spec.opening = zoneHand === 'right' ? 'right' : 'left';
}

function patchAnimatorHandOnNode(node, zoneHand) {
  if (!isSwingRotateAnimator(node)) return;
  const right = zoneHand === 'right';
  node.spec = node.spec && typeof node.spec === 'object' ? { ...node.spec } : {};
  node.spec.props = { ...(node.spec.props || {}), deg: node.spec.props?.deg ?? 90 };
  node.spec.props.direction = right ? 'ry' : 'ly';
  if (node.spec.door_offset && typeof node.spec.door_offset === 'object') {
    const off = { ...node.spec.door_offset };
    const ox = Number(off.x);
    if (right && Number.isFinite(ox)) off.x = -ox;
    else if (!right && Number.isFinite(ox) && ox < 0) off.x = -ox;
    node.spec.door_offset = off;
  }
}

function walkApplyZoneHand(node, zoneHand) {
  if (!node || typeof node !== 'object') return;
  const role = getNodeLayoutRole(node);
  const t = String(node.type || '').toLowerCase();
  if (FACADE_LAYOUT_ROLES.has(role) || t === 'facade' || t === 'door') {
    patchOpeningOnNode(node, zoneHand);
  }
  if (t === 'animator') {
    patchAnimatorHandOnNode(node, zoneHand);
  }
  if (Array.isArray(node.children)) {
    for (const c of node.children) walkApplyZoneHand(c, zoneHand);
  }
}

export function applyZoneHandToClodisTree(root, zoneHand) {
  const zh = normalizeZoneHand(zoneHand);
  if (!zh || zh === 'center') return root;
  if (Array.isArray(root)) {
    return root.map((n) => applyZoneHandToClodisTree(n, zh));
  }
  const clone = deepClonePlanNode(root);
  walkApplyZoneHand(clone, zh);
  return clone;
}

/**
 * @param {Array|object} clodisRoots
 * @param {{ doorLayout?: string, zoneHand?: string, doorKind?: string, unifiedFacade?: boolean, pairedHand?: {left?:number, right?:number} }} opts
 */
export function prepareClodisForRoomBuild(clodisRoots, opts = {}) {
  if (!clodisRoots) return clodisRoots;
  const doorLayout = normalizeDoorLayout(opts.doorLayout);
  const doorKind = normalizeDoorKind(opts.doorKind) || 'single';
  const zoneHand = normalizeZoneHand(opts.zoneHand) || 'left';
  const unifiedFacade = !!opts.unifiedFacade;

  let out = clodisRoots;
  if (unifiedFacade) {
    out = applyUnifiedFacadeToClodisTree(out);
  }
  if (doorLayout) {
    out = filterClodisTreeByDoorLayout(out, doorLayout);
  }

  out = remapFacadeCatalogModulesInClodis(out, {
    doorKind,
    zoneHand,
    pairedHand: opts.pairedHand,
  });

  if (zoneHand && zoneHand !== 'center') {
    if (doorKind === 'double') {
      if (!planTreeHasDoubleLeafPattern(out)) {
        out = applyZoneHandToClodisTree(out, zoneHand);
      }
    } else {
      // single: main + antresol — оба аниматора получают одну руку (не считать «двустворкой»).
      out = applyZoneHandToClodisTree(out, zoneHand);
    }
  }

  return out;
}

/**
 * @param {object|null} furnitureData
 * @param {{ zoneIndex?: number, division?: object, doorLayout?: string, zoneHand?: string, doorKind?: string, zoneDoorKind?: string, catalogItem?: object }} ctx
 */
export function buildRoomDoorPrepareOpts(furnitureData, ctx = {}) {
  const doorLayout =
    ctx.doorLayout ?? resolveDoorLayoutFromFurnitureData(furnitureData);
  const doorKind =
    ctx.doorKind ??
    (resolveDoorKindFromFurnitureData(furnitureData) ||
      ctx.zoneDoorKind ||
      'single');
  const clodisRoots = ctx.clodisRoots ?? null;
  const hasSwingDoor = resolveModuleHasSwingDoor({
    hasSwingDoor: ctx.hasSwingDoor,
    clodisRoots,
  });
  const zoneHand =
    ctx.zoneHand ??
    resolveZoneHandFromPlacement({
      furnitureData,
      zoneIndex: ctx.zoneIndex,
      division: ctx.division,
      doorKind,
      hasSwingDoor,
      clodisRoots,
      swingOrdinal: ctx.swingOrdinal,
      swingChainLen: ctx.swingChainLen,
    });
  const catalogItem = ctx.catalogItem || furnitureData?.catalogItem;
  const pairedHand = readPairedHandCatalogIdsFromItem(catalogItem);
  const enrichedCtx = {
    ...ctx,
    placementKind:
      ctx.placementKind ?? resolveModulePlacementKindHint(furnitureData, ctx),
    productKind: ctx.productKind ?? resolveModuleProductKindHint(furnitureData, ctx),
    clodisRoots: ctx.clodisRoots ?? null,
  };
  const unifiedFacade = resolveEffectiveUnifiedFacade(furnitureData, enrichedCtx);
  const opts = {
    doorLayout: doorLayout || undefined,
    zoneHand,
    doorKind,
    unifiedFacade: unifiedFacade || undefined,
    hasSwingDoor,
    pairedHand:
      pairedHand.left > 0 || pairedHand.right > 0 ? pairedHand : undefined,
  };
  const needsPatch =
    !!opts.doorLayout ||
    !!opts.unifiedFacade ||
    opts.doorKind === 'double' ||
    (opts.zoneHand && opts.zoneHand !== 'center') ||
    opts.zoneHand === 'left';
  return { opts, needsPatch };
}
