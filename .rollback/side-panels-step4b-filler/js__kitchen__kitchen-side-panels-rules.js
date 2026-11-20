/**
 * Kitchen side-panels — pure option rules (STEP 2B).
 * Evaluation only: does not read/write geometry, scene, or `userData.sidePanels`.
 */

import { KITCHEN_SIDE_PANEL_MODES } from './kitchen-side-panels-contract.js';

/** @typedef {'left'|'right'} KitchenSidePanelSide */
/** @typedef {'standard'|'replacement'|'overlay'|'filler'} KitchenSidePanelMode */
/** @typedef {'base'|'wall'|'tall'} KitchenSidePanelModuleKind */
/** @typedef {'allowed'|'denied'|'unknown'} KitchenSidePanelRuleStatus */

/**
 * @typedef {object} KitchenSidePanelEvalResult
 * @property {KitchenSidePanelRuleStatus} status
 * @property {string} reasonCode
 * @property {string} message
 * @property {boolean} requiresSpatialCheck
 * @property {KitchenSidePanelModuleKind|'unknown'|null} [moduleKind]
 * @property {string|null} [profileId]
 */

export const KITCHEN_SIDE_PANEL_SIDES = Object.freeze(['left', 'right']);

/** Канонические profile id → класс модуля (не высота / не имя). */
const BASE_PROFILE_IDS = Object.freeze([
  'kitchen_base',
  'kitchen_base_gola',
  'kitchen_base_corner',
]);
const WALL_PROFILE_IDS = Object.freeze([
  'kitchen_wall_mid',
  'kitchen_wall_top',
  'kitchen_wall_corner',
]);
const TALL_PROFILE_IDS = Object.freeze(['kitchen_tall']);

const ALL_KNOWN_KITCHEN_PROFILE_IDS = Object.freeze([
  ...BASE_PROFILE_IDS,
  ...WALL_PROFILE_IDS,
  ...TALL_PROFILE_IDS,
]);

const NON_KITCHEN_PRODUCT_KINDS = Object.freeze([
  'wardrobe',
  'wardrobe_unit',
  'pax',
  'door',
  'window',
  'column',
]);

/**
 * @param {unknown} raw
 * @returns {string}
 */
function _normId(raw) {
  return String(raw ?? '')
    .trim()
    .toLowerCase();
}

/**
 * @param {string} status
 * @param {string} reasonCode
 * @param {string} message
 * @param {boolean} requiresSpatialCheck
 * @param {{ moduleKind?: KitchenSidePanelModuleKind|'unknown'|null, profileId?: string|null }} [extra]
 * @returns {KitchenSidePanelEvalResult}
 */
function _result(status, reasonCode, message, requiresSpatialCheck, extra = {}) {
  return {
    status,
    reasonCode,
    message,
    requiresSpatialCheck: !!requiresSpatialCheck,
    moduleKind: extra.moduleKind != null ? extra.moduleKind : null,
    profileId: extra.profileId != null ? extra.profileId : null,
  };
}

/**
 * Достать userData из контекста без обхода сцены.
 * @param {unknown} context
 * @returns {object|null}
 */
export function extractKitchenSidePanelUserData(context) {
  if (!context || typeof context !== 'object' || Array.isArray(context)) return null;
  const ctx = /** @type {Record<string, unknown>} */ (context);
  if (ctx.userData && typeof ctx.userData === 'object' && !Array.isArray(ctx.userData)) {
    return /** @type {object} */ (ctx.userData);
  }
  const mod = ctx.module;
  if (mod && typeof mod === 'object' && !Array.isArray(mod)) {
    const mud = /** @type {Record<string, unknown>} */ (mod).userData;
    if (mud && typeof mud === 'object' && !Array.isArray(mud)) return /** @type {object} */ (mud);
    // module передан как сам userData
    if (
      '__placementKindProfileId' in /** @type {object} */ (mod) ||
      '__kitchenProfileId' in /** @type {object} */ (mod) ||
      'productKind' in /** @type {object} */ (mod) ||
      'isFurniture' in /** @type {object} */ (mod)
    ) {
      return /** @type {object} */ (mod);
    }
  }
  return null;
}

/**
 * Надёжный kitchen profile id только из известных полей штампа place.
 * Без высоты, без имени, без catalogType-эвристик.
 * @param {unknown} context
 * @returns {string}
 */
export function resolveKitchenSidePanelProfileId(context) {
  if (!context || typeof context !== 'object' || Array.isArray(context)) return '';
  const ctx = /** @type {Record<string, unknown>} */ (context);
  const explicit = _normId(ctx.profileId);
  if (explicit) return explicit;

  const ud = extractKitchenSidePanelUserData(context);
  if (!ud) return '';
  const u = /** @type {Record<string, unknown>} */ (ud);
  const candidates = [
    u.__placementKindProfileId,
    u.__kitchenProfileId,
    u.productKind,
  ];
  for (const c of candidates) {
    const id = _normId(c);
    if (id) return id;
  }
  return '';
}

/**
 * @param {string} profileId
 * @returns {KitchenSidePanelModuleKind|'unknown'}
 */
export function classifyKitchenSidePanelModuleKind(profileId) {
  const id = _normId(profileId);
  if (!id) return 'unknown';
  if (BASE_PROFILE_IDS.includes(id)) return 'base';
  if (WALL_PROFILE_IDS.includes(id)) return 'wall';
  if (TALL_PROFILE_IDS.includes(id)) return 'tall';
  return 'unknown';
}

/**
 * @param {object|null} ud
 * @returns {boolean}
 */
function _looksExplicitlyNonKitchen(ud) {
  if (!ud || typeof ud !== 'object') return false;
  const u = /** @type {Record<string, unknown>} */ (ud);
  const pk = _normId(u.productKind);
  if (NON_KITCHEN_PRODUCT_KINDS.includes(pk)) return true;
  if (pk && !pk.startsWith('kitchen_') && ALL_KNOWN_KITCHEN_PROFILE_IDS.indexOf(pk) < 0) {
    // Явный чужой productKind (не пустой, не kitchen_*).
    if (pk === 'wardrobe' || pk.startsWith('wardrobe') || pk === 'pax') return true;
  }
  return NON_KITCHEN_PRODUCT_KINDS.includes(pk);
}

/**
 * Чистая проверка допустимости боковой опции.
 * Не мутирует context / userData / sidePanels.
 *
 * @param {unknown} context
 * @returns {KitchenSidePanelEvalResult}
 */
export function evaluateKitchenSidePanelOption(context) {
  if (!context || typeof context !== 'object' || Array.isArray(context)) {
    return _result(
      'denied',
      'invalid_context',
      'Контекст проверки отсутствует или некорректен.',
      false
    );
  }

  const ctx = /** @type {Record<string, unknown>} */ (context);
  const side = _normId(ctx.side);
  if (!KITCHEN_SIDE_PANEL_SIDES.includes(side)) {
    return _result(
      'denied',
      'invalid_side',
      'Сторона должна быть left или right.',
      false
    );
  }

  const mode = _normId(ctx.mode);
  if (!KITCHEN_SIDE_PANEL_MODES.includes(mode)) {
    return _result(
      'denied',
      'invalid_mode',
      'Режим боковой опции недопустим.',
      false
    );
  }

  const ud = extractKitchenSidePanelUserData(context);
  const profileId = resolveKitchenSidePanelProfileId(context);
  const moduleKind = classifyKitchenSidePanelModuleKind(profileId);

  if (!profileId) {
    if (_looksExplicitlyNonKitchen(ud)) {
      return _result(
        'denied',
        'unsupported_object',
        'Объект не является кухонным модулем.',
        false,
        { moduleKind: 'unknown', profileId: null }
      );
    }
    return _result(
      'unknown',
      'missing_module_kind',
      'Нет надёжного идентификатора типа кухонного модуля.',
      false,
      { moduleKind: 'unknown', profileId: null }
    );
  }

  if (moduleKind === 'unknown') {
    if (_looksExplicitlyNonKitchen(ud) || !profileId.startsWith('kitchen_')) {
      return _result(
        'denied',
        'unsupported_object',
        'Объект не поддерживается боковыми опциями кухни.',
        false,
        { moduleKind: 'unknown', profileId }
      );
    }
    // kitchen_* id вне известного whitelist — не угадываем.
    return _result(
      'unknown',
      'unconfirmed_module_kind',
      'Идентификатор модуля не подтверждён для боковых опций.',
      false,
      { moduleKind: 'unknown', profileId }
    );
  }

  // Известный кухонный класс (base / wall / tall).
  if (mode === 'standard') {
    return _result(
      'allowed',
      'standard_ok',
      'Штатная боковина допустима для кухонного модуля.',
      false,
      { moduleKind, profileId }
    );
  }

  if (mode === 'replacement') {
    // STEP 4A: материал штатного бока → фасад (g3/outside); size/pos/joints не меняем.
    return _result(
      'allowed',
      'replacement_material_ok',
      'Замена боковины: штатная деталь в цвет фасада (материал), без смены геометрии.',
      false,
      { moduleKind, profileId }
    );
  }

  if (mode === 'overlay') {
    return _result(
      'unknown',
      'overlay_construction_space_unconfirmed',
      'Накладка: конструктив и доступное пространство ещё не подтверждены.',
      true,
      { moduleKind, profileId }
    );
  }

  // filler
  return _result(
    'unknown',
    'filler_type_adjacency_unconfirmed',
    'Добор: тип добора и примыкание ещё не подтверждены.',
    true,
    { moduleKind, profileId }
  );
}

export const KITCHEN_SIDE_PANEL_KNOWN_PROFILE_IDS = ALL_KNOWN_KITCHEN_PROFILE_IDS;
