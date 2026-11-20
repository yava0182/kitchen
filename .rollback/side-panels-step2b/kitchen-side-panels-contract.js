/**
 * Kitchen side-panels — data contract only (STEP 2A).
 * Instance-owned; no geometry, no cell/zone/section trim coupling.
 */

export const KITCHEN_SIDE_PANELS_CONTRACT_VERSION = 1;

/** @typedef {'standard'|'replacement'|'overlay'|'filler'} KitchenSidePanelMode */

export const KITCHEN_SIDE_PANEL_MODES = Object.freeze([
  'standard',
  'replacement',
  'overlay',
  'filler',
]);

/**
 * @returns {{ mode: KitchenSidePanelMode, params?: Record<string, unknown> }}
 */
export function createDefaultKitchenSidePanelSide() {
  return { mode: 'standard' };
}

/**
 * @returns {{
 *   version: number,
 *   left: { mode: KitchenSidePanelMode, params?: Record<string, unknown> },
 *   right: { mode: KitchenSidePanelMode, params?: Record<string, unknown> }
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

/**
 * Независимый объект стороны (без shared refs).
 * `params` — непрозрачный мешок под будущие режимы; схема размеров/присадки здесь не задаётся.
 * @param {unknown} raw
 */
export function normalizeKitchenSidePanelSide(raw) {
  const out = createDefaultKitchenSidePanelSide();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  out.mode = _normalizeMode(/** @type {{ mode?: unknown }} */ (raw).mode);
  const params = /** @type {{ params?: unknown }} */ (raw).params;
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
