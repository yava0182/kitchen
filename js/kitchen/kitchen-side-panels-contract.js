/**
 * Kitchen side-panels — data contract only (STEP 2A / 3D).
 * Instance-owned; no geometry, no cell/zone/section trim coupling.
 */

export const KITCHEN_SIDE_PANELS_CONTRACT_VERSION = 1;

/** @typedef {'standard'|'replacement'|'overlay'|'filler'} KitchenSidePanelMode */
/** @typedef {'auto'|'custom'} KitchenSidePanelDepthMode */

export const KITCHEN_SIDE_PANEL_MODES = Object.freeze([
  'standard',
  'replacement',
  'overlay',
  'filler',
]);

export const KITCHEN_SIDE_PANEL_DEPTH_MODES = Object.freeze(['auto', 'custom']);

/**
 * @returns {{
 *   mode: KitchenSidePanelMode,
 *   depthMode: KitchenSidePanelDepthMode,
 *   depthMm: number|null,
 *   depthOffsetMm: number,
 *   fillerWidthMm: number|null,
 *   params?: Record<string, unknown>
 * }}
 */
export function createDefaultKitchenSidePanelSide() {
  return {
    mode: 'standard',
    depthMode: 'auto',
    depthMm: null,
    depthOffsetMm: 0,
    fillerWidthMm: null,
  };
}

/**
 * @returns {{
 *   version: number,
 *   left: ReturnType<typeof createDefaultKitchenSidePanelSide>,
 *   right: ReturnType<typeof createDefaultKitchenSidePanelSide>
 * }}
 */
export function createDefaultKitchenSidePanels() {
  return {
    version: KITCHEN_SIDE_PANELS_CONTRACT_VERSION,
    left: createDefaultKitchenSidePanelSide(),
    right: createDefaultKitchenSidePanelSide(),
  };
}

function _normalizeMode(raw) {
  const mode = String(raw ?? '')
    .trim()
    .toLowerCase();
  return KITCHEN_SIDE_PANEL_MODES.includes(mode) ? mode : 'standard';
}

function _normalizeDepthMode(raw) {
  const mode = String(raw ?? '')
    .trim()
    .toLowerCase();
  return KITCHEN_SIDE_PANEL_DEPTH_MODES.includes(mode) ? mode : 'auto';
}

/**
 * Независимый объект стороны (без shared refs).
 * Старые draft с только `{ mode }` → depthMode=auto, depthOffsetMm=0.
 * `params` — непрозрачный мешок под будущие режимы.
 * @param {unknown} raw
 */
export function normalizeKitchenSidePanelSide(raw) {
  const out = createDefaultKitchenSidePanelSide();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  const src = /** @type {Record<string, unknown>} */ (raw);
  out.mode = _normalizeMode(src.mode);
  out.depthMode = _normalizeDepthMode(src.depthMode);
  const depthMm = Math.round(Number(src.depthMm));
  out.depthMm = Number.isFinite(depthMm) && depthMm > 0 ? depthMm : null;
  const off = Math.round(Number(src.depthOffsetMm));
  out.depthOffsetMm = Number.isFinite(off) && off > 0 ? off : 0;
  const fillerW = Math.round(Number(src.fillerWidthMm));
  out.fillerWidthMm = Number.isFinite(fillerW) && fillerW > 0 ? fillerW : null;
  if (out.depthMode === 'custom' && !(out.depthMm > 0)) {
    // custom без валидной глубины → auto (совместимость / защита)
    out.depthMode = 'auto';
  }
  const params = src.params;
  if (params && typeof params === 'object' && !Array.isArray(params)) {
    out.params = { ...params };
  }
  return out;
}

/**
 * @param {unknown} raw
 */
export function normalizeKitchenSidePanels(raw) {
  const out = createDefaultKitchenSidePanels();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  const v = Math.floor(Number(/** @type {{ version?: unknown }} */ (raw).version));
  if (Number.isFinite(v) && v >= 1) out.version = v;
  const src = /** @type {{ left?: unknown, right?: unknown }} */ (raw);
  out.left = normalizeKitchenSidePanelSide(src.left);
  out.right = normalizeKitchenSidePanelSide(src.right);
  return out;
}

/** Эвристика кухонного экземпляра без THREE (для fixture / ensure). */
export function userDataLooksLikeKitchenModule(ud) {
  if (!ud || typeof ud !== 'object') return false;
  if (ud.isFurniture !== true && ud.isFurniture !== undefined) {
    /* allow missing during early stamp */
  }
  const pk = String(
    ud.__placementKindProfileId || ud.__kitchenProfileId || ud.productKind || ud.__placementKind || ''
  )
    .trim()
    .toLowerCase();
  if (pk.startsWith('kitchen_')) return true;
  if (Number(ud.__kitchenCarcassHeightMm) > 0) return true;
  if (Number(ud.__kitchenPlinthHeightMm) > 0) return true;
  if (Number(ud.__kitchenCarcassDepthMm) > 0) return true;
  return false;
}

/**
 * Гарантировать нормализованный `ud.sidePanels` на кухонном экземпляре.
 * Не кухонный / нет ud → null; иначе возвращает ссылку на записанный объект.
 * Старые сцены без поля → standard / standard.
 * @param {object|null|undefined} ud
 */
export function ensureKitchenSidePanelsOnUserData(ud) {
  if (!ud || typeof ud !== 'object') return null;
  if (!userDataLooksLikeKitchenModule(ud)) return null;
  ud.sidePanels = normalizeKitchenSidePanels(ud.sidePanels);
  return ud.sidePanels;
}

/** Снимок для save (всегда новый объект; default если пусто). */
export function serializeKitchenSidePanelsFromUserData(ud) {
  if (!userDataLooksLikeKitchenModule(ud)) return null;
  return normalizeKitchenSidePanels(ud?.sidePanels);
}

/** Восстановление на ud после load. */
export function applyKitchenSidePanelsToUserData(ud, raw) {
  if (!ud || typeof ud !== 'object') return null;
  if (!userDataLooksLikeKitchenModule(ud) && raw == null) return null;
  if (!userDataLooksLikeKitchenModule(ud)) return null;
  ud.sidePanels = normalizeKitchenSidePanels(raw);
  return ud.sidePanels;
}
