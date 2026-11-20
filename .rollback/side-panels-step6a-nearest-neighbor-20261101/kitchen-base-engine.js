/**
 * Kitchen base engine v1 — нижний ряд без шкафной ниши.
 *
 * Контракт:
 * - s:y = carcass + projectPlinth
 * - h_bottom / vysota_cokolya = project plinth (100/120/150)
 * - ширина = ячейка, глубина = каталог
 * - спинка = стена + rear overhang 10 (стек: 10+корпус+40 = столешница)
 * - parametric rebuild, без scale
 * - useLayoutZones=false: комната = админка (формулы JSON + v:*, без room layoutZones)
 * - без mergeFloorNiche / U-fit высоты ниши / wardrobe 16mm caps
 *
 * Rebuild/align инжектятся из furniture-manager (без цикла section-manager ↔ engine).
 */
import { state } from '../utils/state.js';
import {
  isKitchenBasePlacementKind,
  isKitchenTallPlacementKind,
  isKitchenWallMidPlacementKind,
  isKitchenWallTopPlacementKind,
  computeStandaloneFloorLayoutZones,
  resolveModuleHTopMm,
  PLACEMENT_KIND,
  isKitchenCornerPlacementKind,
} from '../sections/vertical-layout.js?v=20261022-bust1';
import { extractModuleVariablesFromFurnitureData } from '../furniture/furniture-clodis.js?v=20261027-nmu142g';
import {
  readUserDataClodisData,
  readUserDataClodisRoots,
  readUserDataClodisVariables,
  writeUserDataClodisVariables,
} from '../clodis-json-fields.js?v=20261008-joint-room2';
import {
  resolveGolaTwoDrawerFacadeLayoutMm,
  GOLA_TWO_DRAWER_FACADE_H_MM,
} from './kitchen-gola-groove.js?v=20261011-wallshape1';
import {
  resolveKitchenCornerSpecialWidthMm,
  resolveKitchenCornerReturnMm,
  KITCHEN_CORNER_SPECIAL_WIDTH_MM,
  buildKitchenCornerReturnVars,
} from './kitchen-section-layout.js?v=20261101-side6a1';
import { computeFurnitureCorpusLayoutWorldBBoxNoAo } from '../furniture/furniture-bbox.js?v=20261025-cell1';
import { ensureKitchenSidePanelsOnUserData } from './kitchen-side-panels-contract.js?v=20261031-side4b';
import { KITCHEN_SIDE_PANEL_OVERLAY_THICKNESS_MM } from './kitchen-side-panels-clearance.js?v=20261031-side2v';
import {
  applyKitchenSidePanelOverlayToClodisRoots,
  applyKitchenSidePanelFillerToClodisRoots,
} from './kitchen-side-panels-overlay-geometry.js?v=20261031-side4b';
import {
  applyKitchenSidePanelReplacementToClodisRoots,
  applyKitchenSidePanelReplacementAppearance,
} from './kitchen-side-panels-replacement.js?v=20261031-side4b';

/**
 * Vite + разные ?v= могут загрузить kitchen-base-engine дважды.
 * deps / API держим на globalThis — иначе «Управление кухней» глубина
 * бьёт в unbound копию (опоры работают через __clodisApply* из furniture-manager).
 */
const __cldKbRoot =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
      ? window
      : {};
if (!__cldKbRoot.__cldKitchenBaseEngineDeps) {
  __cldKbRoot.__cldKitchenBaseEngineDeps = {};
}
/** @type {{
 *   rebuildFurnitureGroupForSectionResize?: Function,
 *   snapFurnitureGroupPlacementY?: Function,
 *   alignBackToWall?: Function,
 *   getCatalogOwnStandaloneHeightMm?: Function,
 *   getRawPlacementKindFromFurnitureData?: Function,
 *   fitFurnitureToSectionZone?: Function,
 * }} */
const _deps = __cldKbRoot.__cldKitchenBaseEngineDeps;

export function bindKitchenBaseEngineDeps(deps) {
  if (!deps || typeof deps !== 'object') return;
  Object.assign(_deps, deps);
}

function km() {
  return typeof window !== 'undefined' ? window.__cldKitchenManufacturing : null;
}

/** Дубликат L_CORNER_CONFIG.cornerAtStart — без импорта section-manager (цикл). */
const _CORNER_AT_START = {
  'corner-back-right': false,
  'corner-back-left': true,
  'corner-right-front': false,
  'corner-right-back': true,
  'corner-front-left': false,
  'corner-front-right': true,
  'corner-left-front': true,
  'corner-left-back': false,
};

/** Ось U ряда (вдоль стены секции). */
function _wallAxisU(wallName) {
  const w = String(wallName || 'back').toLowerCase();
  return w === 'left' || w === 'right' ? 'z' : 'x';
}

/** Угол у min-U секции? Пишем в ud, чтобы vars и якорь совпали. */
function _resolveKitchenCornerAtMinU(group, section) {
  const ud = group?.userData || (group && (group.userData = {})) || {};
  if (ud.__kitchenCornerSideAtMinU != null) {
    return ud.__kitchenCornerSideAtMinU === true;
  }
  const typeKey = String(section?.division?.typeKey || section?.lShape?.type || '').trim();
  let atMin = false;
  if (typeKey && Object.prototype.hasOwnProperty.call(_CORNER_AT_START, typeKey)) {
    atMin = _CORNER_AT_START[typeKey] === true;
  } else if (typeKey && typeof window !== 'undefined' && window.L_CORNER_CONFIG?.[typeKey]) {
    atMin = !!window.L_CORNER_CONFIG[typeKey].cornerAtStart;
  }
  ud.__kitchenCornerSideAtMinU = atMin;
  return atMin;
}

/** Сдвиг вдоль U ряда (мм). */
function _shiftGroupAlongWallU(group, section, deltaU) {
  if (!group || !(Math.abs(Number(deltaU)) > 0.45)) return false;
  const wall = section?.wallName || group.userData?.wallName || 'back';
  if (_wallAxisU(wall) === 'z') group.position.z += Number(deltaU);
  else group.position.x += Number(deltaU);
  group.updateMatrixWorld(true);
  return true;
}

/** Мир-U bbox корпуса вдоль стены (min/max). */
function _measureKitchenCornerCorpusURange(group, section) {
  if (!group) return null;
  const wall = section?.wallName || group.userData?.wallName || 'back';
  const axis = _wallAxisU(wall);
  group.updateMatrixWorld(true);
  let bb = null;
  try {
    bb = computeFurnitureCorpusLayoutWorldBBoxNoAo(group);
  } catch (_) {
    bb = null;
  }
  if (!bb || bb.isEmpty?.()) {
    const THREE = typeof window !== 'undefined' ? window.THREE : null;
    if (!THREE) return null;
    bb = new THREE.Box3().setFromObject(group);
  }
  if (!bb || bb.isEmpty?.()) return null;
  const minU = axis === 'z' ? bb.min.z : bb.min.x;
  const maxU = axis === 'z' ? bb.max.z : bb.max.x;
  if (!Number.isFinite(minU) || !Number.isFinite(maxU)) return null;
  return { minU, maxU };
}

/** Мир-U фасадного края (нога), корпус без столешки/AO. */
function _measureKitchenCornerFacadeU(group, section) {
  const r = _measureKitchenCornerCorpusURange(group, section);
  if (!r) return null;
  const atMin = _resolveKitchenCornerAtMinU(group, section);
  // atMin: приставка у min-U / стены → фасад = maxU; иначе фасад = minU.
  return atMin ? r.maxU : r.minU;
}

/** Мир-U края у боковой стены (приставка+clear), противоположно фасаду. */
function _measureKitchenCornerWallU(group, section) {
  const r = _measureKitchenCornerCorpusURange(group, section);
  if (!r) return null;
  const atMin = _resolveKitchenCornerAtMinU(group, section);
  return atMin ? r.minU : r.maxU;
}

/**
 * Сдвиг НМУ вдоль U к сохранённому краю.
 * side: 'facade' — нога стоит (карандаш отступа); 'wall' — стена/приставка стоят (ширина ячейки).
 */
function _anchorKitchenCornerSideU(group, section, uBefore, side) {
  if (!Number.isFinite(Number(uBefore))) return false;
  const mode = side === 'facade' ? 'facade' : 'wall';
  const now =
    mode === 'facade'
      ? _measureKitchenCornerFacadeU(group, section)
      : _measureKitchenCornerWallU(group, section);
  if (!Number.isFinite(Number(now))) return false;
  const delta = Number(uBefore) - Number(now);
  if (!(Math.abs(delta) > 0.45)) {
    console.warn('[KITCHEN-ENGINE] corner already anchored', {
      side: mode,
      u: Math.round(Number(uBefore)),
      atMin: _resolveKitchenCornerAtMinU(group, section),
    });
    return false;
  }
  _shiftGroupAlongWallU(group, section, delta);
  console.warn('[KITCHEN-ENGINE] corner side anchor', {
    side: mode,
    delta: Math.round(delta * 10) / 10,
    u: Math.round(Number(uBefore)),
    atMin: _resolveKitchenCornerAtMinU(group, section),
  });
  return true;
}

/** @deprecated имя: фасадный якорь (отступ / глубина). */
function _anchorKitchenCornerFacadeU(group, section, facadeUBefore) {
  return _anchorKitchenCornerSideU(group, section, facadeUBefore, 'facade');
}

function getRawPlacementKind(furnitureData) {
  if (typeof _deps.getRawPlacementKindFromFurnitureData === 'function') {
    return _deps.getRawPlacementKindFromFurnitureData(furnitureData);
  }
  const fromCatalog =
    furnitureData?.catalogItem?.placementKind ||
    furnitureData?.placementKindProfileId ||
    furnitureData?.__placementKindProfileId ||
    furnitureData?.placementKind;
  return typeof fromCatalog === 'string' ? fromCatalog.trim() : '';
}

function getCatalogHeightMm(furnitureData) {
  if (typeof _deps.getCatalogOwnStandaloneHeightMm === 'function') {
    return Math.max(0, Number(_deps.getCatalogOwnStandaloneHeightMm(furnitureData)) || 0);
  }
  const item = furnitureData?.catalogItem || furnitureData;
  const h = Number(item?.height) || Number(item?.params?.sectionSize?.y) || 0;
  return h > 0 ? Math.round(h) : 0;
}

/** Глубина из карточки (пенал А60 = 560). */
function getCatalogDepthMm(furnitureData) {
  const item = furnitureData?.catalogItem || furnitureData;
  const z =
    Number(item?.depth) ||
    Number(item?.params?.sectionSize?.z) ||
    Number(item?.size?.z) ||
    0;
  return z > 0 ? Math.round(z) : 0;
}

/** Сырой id профиля (kitchen_base / kitchen_tall / kitchen_wall_mid), даже если baseKind уже mapped. */
export function getKitchenProfileIdFromFurnitureData(furnitureData, ud) {
  const raw =
    getRawPlacementKind(furnitureData) ||
    String(ud?.__placementKindProfileId || ud?.placementKind || '').trim();
  if (
    isKitchenBasePlacementKind(raw) ||
    isKitchenTallPlacementKind(raw) ||
    isKitchenWallMidPlacementKind(raw) ||
    isKitchenWallTopPlacementKind(raw)
  ) {
    return raw;
  }
  return '';
}

function extractKitchenTallOptsFromFurnitureData(furnitureData) {
  const item = furnitureData?.catalogItem || furnitureData;
  let kt =
    furnitureData?.__kitchenTall ||
    item?.data?.kitchenTall ||
    item?.kitchenTall ||
    null;
  if (typeof item?.data === 'string' && item.data.trim()) {
    try {
      const parsed = JSON.parse(item.data);
      if (parsed?.kitchenTall) kt = parsed.kitchenTall;
    } catch (_) {}
  }
  kt = kt && typeof kt === 'object' ? kt : {};
  const catalogDepthMm = getCatalogDepthMm(furnitureData);
  return {
    facadeType: kt.facadeType || 'doors_3',
    lowerHalfOfNmMm: kt.lowerHalfOfNmMm,
    ovenNicheMm: kt.ovenNicheMm,
    microwaveNicheMm: kt.microwaveNicheMm,
    // 560: вплотную к стене → перед = перед корпуса НМ; столешка +40.
    carcassDepthMm:
      Number(kt.carcassDepthMm) > 0
        ? Math.round(Number(kt.carcassDepthMm))
        : catalogDepthMm > 0
          ? catalogDepthMm
          : undefined,
  };
}

export function getKitchenBaseProfileIdFromGroup(group) {
  const ud = group?.userData || {};
  const candidates = [
    ud.__placementKindProfileId,
    ud.__kitchenProfileId,
    ud.placementKind,
    ud.__placementKind,
    ud.productKind,
  ];
  for (const c of candidates) {
    const raw = String(c || '').trim();
    if (!raw) continue;
    if (
      isKitchenBasePlacementKind(raw) ||
      isKitchenTallPlacementKind(raw) ||
      isKitchenWallMidPlacementKind(raw) ||
      isKitchenWallTopPlacementKind(raw)
    ) {
      return raw;
    }
  }
  // Fallback: роль пирога (если profileId сбился на baseKind wall_hung_*).
  const role = String(ud.__zoneSlotRole || '').toLowerCase();
  if (role === 'top') return 'kitchen_wall_top';
  if (role === 'mid') return 'kitchen_wall_mid';
  if (role === 'base') return 'kitchen_base';
  // Папка каталога: profile мог сбиться на wall_hung_high.
  const cat = String(
    ud.catalogType || ud.element_type || ud.__catalogType || ud.catalogKey || ''
  )
    .trim()
    .toLowerCase();
  if (cat === 'catalog_51') return 'kitchen_wall_top';
  if (cat === 'catalog_50' || cat === 'catalog_42' || cat === 'catalog_43') {
    return 'kitchen_wall_mid';
  }
  return '';
}

/** Пенал (не НМ): rear=0, глубина 560, без столешки на модуле. */
export function isKitchenTallGroup(group) {
  if (!group?.userData?.isFurniture) return false;
  const ud = group.userData || {};
  if (String(ud.productKind || '') === 'kitchen_tall') return true;
  if (ud.__kitchenTall && typeof ud.__kitchenTall === 'object') return true;
  const profile = getKitchenBaseProfileIdFromGroup(group);
  if (isKitchenTallPlacementKind(profile)) return true;
  return false;
}

/** Любой кухонный модуль ряда (НМ / пенал / НШ1). */
export function isKitchenBaseGroup(group) {
  if (!group?.userData?.isFurniture) return false;
  const ud = group.userData || {};
  if (getKitchenBaseProfileIdFromGroup(group)) return true;
  if (Number(ud.__kitchenCarcassHeightMm) > 0) return true;
  if (Number(ud.__kitchenPlinthHeightMm) > 0) return true;
  if (String(ud.productKind || '') === 'kitchen_base') return true;
  if (String(ud.productKind || '') === 'kitchen_tall') return true;
  if (String(ud.productKind || '') === 'kitchen_wall_mid') return true;
  if (String(ud.productKind || '') === 'kitchen_wall_top') return true;
  return false;
}

/** Угловой НМУ: только тип kitchen_base_corner / catalog_44 — не обычный kitchen_base и не ВМУ. */
export function isKitchenCornerBaseGroup(group) {
  if (!isKitchenBaseGroup(group) || isKitchenTallGroup(group)) return false;
  const ud = group.userData || {};
  const pk = String(
    ud.__placementKindProfileId || ud.__kitchenProfileId || ud.__placementKind || ''
  )
    .trim()
    .toLowerCase();
  // Прямой НМ / навес — никогда не НМУ (isLCornerCabinetModule включает wall_corner/54).
  if (
    pk === 'kitchen_base' ||
    pk === 'kitchen_base_gola' ||
    pk === 'kitchen_wall_corner' ||
    pk === 'kitchen_wall_mid' ||
    pk === 'kitchen_wall_top'
  ) {
    return false;
  }
  if (isKitchenCornerPlacementKind(pk)) return true;
  const ct = String(ud.catalogType || ud.__catalogType || '').toLowerCase();
  if (ct === 'catalog_54' || ct === '54' || /(^|_)54$/.test(ct)) return false;
  if (ct === 'catalog_44' || ct === '44' || /(^|_)44$/.test(ct)) return true;
  // Без явного kind: только если place уже пометил угол напольного НМУ.
  if (ud.__kitchenCornerSideAtMinU != null && !pk) return true;
  return false;
}

/** Приставной ВМУ (верх в пироге угла): kitchen_wall_corner / catalog_54. */
export function isKitchenWallCornerGroup(group) {
  if (!group?.userData?.isFurniture) return false;
  const ud = group.userData || {};
  const pk = String(
    ud.__placementKindProfileId || ud.__kitchenProfileId || ud.__placementKind || ''
  )
    .trim()
    .toLowerCase();
  if (pk === 'kitchen_wall_corner') return true;
  const ct = String(ud.catalogType || ud.__catalogType || '').toLowerCase();
  if (ct === 'catalog_54' || ct === '54' || /(^|_)54$/.test(ct)) return true;
  return false;
}

/** Любой угловой модуль пирога ячейки: НМУ низ или приставной ВМУ верх. */
export function isKitchenCornerModuleGroup(group) {
  return isKitchenCornerBaseGroup(group) || isKitchenWallCornerGroup(group);
}

/**
 * D соседа для приставки НМУ: не-угловой НМ в той же секции / L-паре.
 * @param {object|null} sectionData
 * @param {{ excludeZoneIndex?: number, excludeUuid?: string }=} opts
 * @returns {number} мм корпуса соседа или 0
 */
export function resolveKitchenNeighborCarcassDepthMm(sectionData, opts = {}) {
  const excludeZi =
    opts.excludeZoneIndex != null && Number.isFinite(Number(opts.excludeZoneIndex))
      ? Math.floor(Number(opts.excludeZoneIndex))
      : null;
  const excludeUuid = opts.excludeUuid != null ? String(opts.excludeUuid) : null;
  const sectionIds = new Set();
  if (sectionData?.id != null) sectionIds.add(String(sectionData.id));
  try {
    const pairId = sectionData?.lShape?.pairId;
    if (pairId != null) sectionIds.add(String(pairId));
  } catch (_) {}
  if (!sectionIds.size || !state?.scene) return 0;

  let best = 0;
  state.scene.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    if (excludeUuid && String(obj.uuid) === excludeUuid) return;
    if (!isKitchenBaseGroup(obj) || isKitchenTallGroup(obj)) return;
    if (isKitchenCornerBaseGroup(obj)) return;
    const ud = obj.userData || {};
    if (!sectionIds.has(String(ud.sectionId))) return;
    if (excludeZi != null && Number(ud.zoneIndex) === excludeZi) return;
    const d =
      Math.round(Number(ud.__kitchenCarcassDepthMm) || Number(ud.customDepthMm) || 0) || 0;
    if (d > best) best = d;
  });
  return best > 0 ? best : 0;
}

/** НШ1 (навесной 1-й ярус): rear=0, D≈350, Y = plinth+low+mid. */
export function isKitchenWallMidGroup(group) {
  if (!group?.userData?.isFurniture) return false;
  const ud = group.userData || {};
  if (String(ud.productKind || '') === 'kitchen_wall_mid') return true;
  if (String(ud.__kitchenProfileId || '').trim() === 'kitchen_wall_mid') return true;
  if (String(ud.__zoneSlotRole || '').toLowerCase() === 'mid') return true;
  // Не путать с TOP: role top / product top — не mid.
  if (String(ud.productKind || '') === 'kitchen_wall_top') return false;
  if (String(ud.__zoneSlotRole || '').toLowerCase() === 'top') return false;
  const profile = getKitchenBaseProfileIdFromGroup(group);
  if (isKitchenWallMidPlacementKind(profile)) return true;
  return false;
}

/** НШ2 (2-й ярус): rear=0, D≈350, Y = plinth+low+mid+high. */
export function isKitchenWallTopGroup(group) {
  if (!group?.userData?.isFurniture) return false;
  const ud = group.userData || {};
  if (String(ud.productKind || '') === 'kitchen_wall_top') return true;
  if (String(ud.__kitchenProfileId || '').trim() === 'kitchen_wall_top') return true;
  if (String(ud.__placementKindProfileId || '').trim() === 'kitchen_wall_top') return true;
  if (String(ud.__zoneSlotRole || '').toLowerCase() === 'top') return true;
  // catalog_51 = «Навесные шкафы 2 яруса»
  const cat = String(
    ud.catalogType || ud.element_type || ud.__catalogType || ud.catalogKey || ''
  )
    .trim()
    .toLowerCase();
  if (cat === 'catalog_51') return true;
  // Mapped baseKind wall_hung_high + кухонные штампы place (не шкафной ceiling-hung).
  const role = String(ud.__zoneSlotRole || '').toLowerCase();
  const pk = String(ud.__placementKind || ud.placementKind || '').trim();
  if (
    (role === 'upper' || pk === 'wall_hung_high') &&
    (Number(ud.__kitchenBandTopMm) > 0 ||
      Number(ud.__kitchenBandHighMm) > 0 ||
      ud.__kitchenParametricFromProject === true ||
      String(ud.productKind || '').includes('kitchen_wall'))
  ) {
    return true;
  }
  const profile = getKitchenBaseProfileIdFromGroup(group);
  if (isKitchenWallTopPlacementKind(profile)) return true;
  return false;
}

/** Только рабочий стол (столешка +10/−40). Пенал / НШ сюда не входят. */
export function isKitchenNmCarcassGroup(group) {
  if (!isKitchenBaseGroup(group)) return false;
  if (isKitchenTallGroup(group)) return false;
  if (isKitchenWallMidGroup(group)) return false;
  if (isKitchenWallTopGroup(group)) return false;
  return true;
}

/**
 * Модули с боковыми накладками 16 мм (STEP 3З/3И): НМ + НШ1 + НШ2 + пенал.
 * replacement / filler — не здесь.
 */
export function isKitchenSidePanelsModuleGroup(group) {
  if (isKitchenNmCarcassGroup(group)) return true;
  if (isKitchenWallMidGroup(group)) return true;
  if (isKitchenWallTopGroup(group)) return true;
  if (isKitchenTallGroup(group)) return true;
  return false;
}

/** Ниша шкафа для kitchen_* не применяется. */
export function shouldSkipFloorNicheMerge(pkOrProfileId) {
  return (
    isKitchenBasePlacementKind(pkOrProfileId) ||
    isKitchenTallPlacementKind(pkOrProfileId) ||
    isKitchenWallMidPlacementKind(pkOrProfileId) ||
    isKitchenWallTopPlacementKind(pkOrProfileId)
  );
}

/**
 * Высота корпуса из карточки.
 * В админке height часто = корпус+опоры (820 = 720+100) — вычитаем catalog h_bottom.
 */
export function resolveKitchenCarcassHeightMm(furnitureData) {
  const rawH = getCatalogHeightMm(furnitureData);
  if (!(rawH > 0)) return 0;
  let catalogHb = 0;
  try {
    const vars = extractModuleVariablesFromFurnitureData(furnitureData) || {};
    catalogHb = Math.max(0, Number(vars.h_bottom) || 0);
  } catch (_) {}
  if (!(catalogHb > 0)) {
    try {
      const item = furnitureData?.catalogItem || furnitureData;
      catalogHb = Math.max(0, Number(item?.clodisVariables?.h_bottom) || 0);
    } catch (_) {}
  }
  if (rawH > catalogHb && catalogHb >= 80 && catalogHb <= 200) {
    const carcass = Math.round(rawH - catalogHb);
    if (carcass >= 500 && carcass <= 1000) return carcass;
  }
  return Math.round(rawH);
}

/**
 * @returns {{
 *   profileId, carcassHeightMm, plinthHeightMm, totalHeightMm,
 *   worktopDepthMm?, carcassDepthMm?, frontSetbackToCarcassMm?, rearOverhangMm?
 * } | null}
 */
export function resolvePlaceSizing(furnitureData) {
  const profileId = getKitchenProfileIdFromFurnitureData(furnitureData, null);
  if (!profileId) return null;
  const api = km();

  if (isKitchenTallPlacementKind(profileId)) {
    const tallOpts = extractKitchenTallOptsFromFurnitureData(furnitureData);
    if (api && typeof api.resolveKitchenTallPlaceSizing === 'function') {
      const sizing = api.resolveKitchenTallPlaceSizing(tallOpts);
      if (sizing && sizing.ok) {
        return {
          profileId,
          productKind: 'kitchen_tall',
          carcassHeightMm: Math.round(Number(sizing.tallCarcassHeightMm) || 0),
          plinthHeightMm: Math.round(Number(sizing.plinthHeightMm) || 0),
          totalHeightMm: Math.round(Number(sizing.totalHeightMm) || 0),
          carcassDepthMm: Math.round(Number(sizing.carcassDepthMm) || 0),
          worktopDepthMm: null,
          frontSetbackToCarcassMm: 0,
          rearOverhangMm: 0,
          hasWorktop: false,
          kitchenTall: tallOpts,
          layoutZones: sizing.layoutZones || null,
          datums: sizing.datums || null,
          horizons: sizing.horizons || null,
        };
      }
    }
    return null;
  }

  if (isKitchenWallMidPlacementKind(profileId)) {
    // Глубина/H — ритм + секция/проект; каталог не задаёт D (тянется).
    if (api && typeof api.resolveKitchenWallMidPlaceSizing === 'function') {
      const sizing = api.resolveKitchenWallMidPlaceSizing({});
      if (sizing && sizing.ok) {
        return {
          profileId,
          productKind: 'kitchen_wall_mid',
          carcassHeightMm: Math.round(Number(sizing.carcassHeightMm) || 720),
          plinthHeightMm: 0,
          projectPlinthHeightMm: Math.round(Number(sizing.projectPlinthHeightMm) || 0),
          totalHeightMm: Math.round(Number(sizing.totalHeightMm) || 720),
          floorClearanceMm: Math.round(Number(sizing.floorClearanceMm) || 0),
          carcassDepthMm: Math.round(Number(sizing.carcassDepthMm) || 350),
          worktopDepthMm: null,
          frontSetbackToCarcassMm: 0,
          rearOverhangMm: 0,
          hasWorktop: false,
          bandLowMm: sizing.bandLowMm,
          bandMidMm: sizing.bandMidMm,
          bandHighMm: sizing.bandHighMm,
          clearanceAboveWorktopMm: sizing.clearanceAboveWorktopMm,
          worktopThicknessMm: sizing.worktopThicknessMm,
        };
      }
    }
    return null;
  }

  if (isKitchenWallTopPlacementKind(profileId)) {
    if (api && typeof api.resolveKitchenWallTopPlaceSizing === 'function') {
      const sizing = api.resolveKitchenWallTopPlaceSizing({});
      if (sizing && sizing.ok) {
        return {
          profileId,
          productKind: 'kitchen_wall_top',
          carcassHeightMm: Math.round(Number(sizing.carcassHeightMm) || 360),
          plinthHeightMm: 0,
          projectPlinthHeightMm: Math.round(Number(sizing.projectPlinthHeightMm) || 0),
          totalHeightMm: Math.round(Number(sizing.totalHeightMm) || 360),
          floorClearanceMm: Math.round(Number(sizing.floorClearanceMm) || 0),
          carcassDepthMm: Math.round(Number(sizing.carcassDepthMm) || 350),
          worktopDepthMm: null,
          frontSetbackToCarcassMm: 0,
          rearOverhangMm: 0,
          hasWorktop: false,
          bandLowMm: sizing.bandLowMm,
          bandMidMm: sizing.bandMidMm,
          bandHighMm: sizing.bandHighMm,
          bandTopMm: sizing.bandTopMm,
        };
      }
    }
    return null;
  }

  let carcassH = resolveKitchenCarcassHeightMm(furnitureData);
  if (!(carcassH > 0)) return null;
  // Корпус НМ/Gola — из типа размещения (Упр.комнатой 2 → carcassHeightMm).
  const isGolaPk = String(profileId || '').trim() === 'kitchen_base_gola';
  const pk = String(profileId || '').trim();
  if (pk === 'kitchen_base' || pk === 'kitchen_base_gola' || pk === 'kitchen_base_corner') {
    let fromProfile = null;
    try {
      if (api && typeof api.getCarcassHeightMmFromPlacementKind === 'function') {
        fromProfile = api.getCarcassHeightMmFromPlacementKind(pk);
      }
    } catch (_) {}
    if (fromProfile != null && fromProfile > 0) {
      carcassH = Math.round(fromProfile);
    } else if (isGolaPk) {
      carcassH =
        api && Number(api.INFO_CARCASS_GOLA_MM) > 0
          ? Math.round(Number(api.INFO_CARCASS_GOLA_MM))
          : 780;
    } else {
      carcassH =
        api && Number(api.INFO_CARCASS_NON_GOLA_MM) > 0
          ? Math.round(Number(api.INFO_CARCASS_NON_GOLA_MM))
          : 720;
    }
  }
  const effectivePk = isGolaPk ? 'kitchen_base_gola' : profileId || 'kitchen_base';
  const frontMode = isGolaPk ? 'gola' : 'non_gola';
  if (api && typeof api.resolveKitchenBasePlaceSizing === 'function') {
    const sizing = api.resolveKitchenBasePlaceSizing({ carcassHeightMm: carcassH });
    if (sizing && sizing.ok) {
      return {
        profileId: effectivePk,
        carcassHeightMm: sizing.carcassHeightMm,
        plinthHeightMm: sizing.plinthHeightMm,
        totalHeightMm: sizing.totalHeightMm,
        worktopDepthMm: sizing.worktopDepthMm,
        carcassDepthMm: sizing.carcassDepthMm,
        frontSetbackToCarcassMm: sizing.frontSetbackToCarcassMm,
        rearOverhangMm: sizing.rearOverhangMm,
        frontMode,
      };
    }
  }
  const plinth =
    api && typeof api.getProjectPlinthHeightMm === 'function'
      ? api.getProjectPlinthHeightMm()
      : 100;
  const depth =
    api && typeof api.resolveBaseCarcassDepthMm === 'function'
      ? api.resolveBaseCarcassDepthMm({})
      : null;
  return {
    profileId: effectivePk,
    carcassHeightMm: carcassH,
    plinthHeightMm: plinth,
    totalHeightMm: carcassH + plinth,
    worktopDepthMm: depth?.worktopDepthMm,
    carcassDepthMm: depth?.ok ? depth.carcassDepthMm : 550,
    frontSetbackToCarcassMm: depth?.frontSetbackToCarcassMm,
    rearOverhangMm: depth?.rearOverhangMm,
    frontMode,
  };
}

/**
 * Профиль kitchen_base: useLayoutZones=false — в комнате как в админке:
 * только s:* + v:h_bottom в формулах дерева, без room layoutZones.
 */
export function kitchenPlacementUsesLayoutZones(rawPlacementKind) {
  const raw = String(rawPlacementKind || '').trim();
  if (!raw) return true;
  try {
    const api =
      typeof window !== 'undefined' ? window.__cldPlacementKindProfiles : null;
    const cfg =
      typeof window !== 'undefined' && typeof window.getRoomStepsConfig === 'function'
        ? window.getRoomStepsConfig()
        : null;
    if (api && typeof api.resolvePlacementKindProfile === 'function') {
      const p = api.resolvePlacementKindProfile(raw, cfg);
      if (p?.behavior && typeof p.behavior.useLayoutZones === 'boolean') {
        return p.behavior.useLayoutZones === true;
      }
    }
  } catch (_) {}
  // НМ / НШ1: без layoutZones (как в админке). Пенал: layoutZones из датамов.
  if (isKitchenBasePlacementKind(raw)) return false;
  if (isKitchenWallMidPlacementKind(raw)) return false;
  if (isKitchenWallTopPlacementKind(raw)) return false;
  if (isKitchenTallPlacementKind(raw)) return true;
  return true;
}

/** Форс h_bottom + vysota_cokolya из project plinth (без niche planks). */
export function applyPlaceVariables(moduleVars, sizing) {
  const out = moduleVars && typeof moduleVars === 'object' ? { ...moduleVars } : {};
  if (!sizing || !(Number(sizing.plinthHeightMm) > 0)) return out;
  const plinth = Math.round(Number(sizing.plinthHeightMm));
  out.h_bottom = plinth;
  out.vysota_cokolya = plinth;
  // Кухня: шкафной h_top / антресоль не нужны — столешница отдельным слоем позже.
  out.h_top = 0;
  // Vars для карточки (если в JSON уже v:depth_tabletop) — только числа, без смены формул.
  if (Number(sizing.worktopDepthMm) > 0) {
    out.depth_tabletop = Math.round(Number(sizing.worktopDepthMm));
  }
  if (Number(sizing.frontSetbackToCarcassMm) > 0) {
    out.front_countertop_overhang = Math.round(Number(sizing.frontSetbackToCarcassMm));
  }
  return out;
}

/**
 * Нормализация дерева НМ перед build (как PlanPlace vars):
 * - size.y опор → v:h_bottom
 * - spec.id опор → cabinet_model из профиля / data.kitchenSupports (по высоте проекта)
 * - pos / size.xz / pivot НЕ трогаем — 1:1 с JSON конструктора
 * @param {object|object[]} roots
 * @param {{ plinthHeightMm?: number, kitchenSupports?: object|null }=} opts
 * @returns {{ legsFixed: number, legsBound: number, modelId: string|null, heightMm: number|null }}
 */
export function normalizeKitchenBaseClodisTree(roots, opts) {
  const stats = {
    legsFixed: 0,
    legsBound: 0,
    cornerReturnFixed: 0,
    ugolokFixed: 0,
    modelId: null,
    heightMm: null,
  };
  const list = Array.isArray(roots) ? roots : roots ? [roots] : [];
  const o = opts && typeof opts === 'object' ? opts : {};
  // Канон NMU: уголок 40×40 — s:x (левый/atStart) | −40 (правый). Не крутить side/pivot.
  const cornerAtStartOpt =
    typeof o.cornerAtStart === 'boolean' ? o.cornerAtStart : null;

  const api = km();
  let plinth =
    o.plinthHeightMm != null
      ? Number(o.plinthHeightMm)
      : api && typeof api.getProjectPlinthHeightMm === 'function'
        ? Number(api.getProjectPlinthHeightMm())
        : NaN;
  if (!(Number.isFinite(plinth) && plinth > 0) && api) {
    plinth = Number(api.snapSupportHeightMm?.(100)) || 100;
  }
  const bind =
    api && typeof api.resolveSupportCabinetModelBinding === 'function'
      ? api.resolveSupportCabinetModelBinding(plinth, o.kitchenSupports || null)
      : {
          heightMm: Number.isFinite(plinth) ? plinth : 100,
          modelId: '2',
          name: 'Опора кухонная 100',
          key: 'Опора кухонная 100',
          enabled: true,
        };
  stats.heightMm = bind.heightMm;
  stats.modelId = bind.enabled === false ? null : String(bind.modelId || '');
  try {
    if (typeof window !== 'undefined') {
      window.__cldLastSupportBind = {
        plinthMm: Number.isFinite(plinth) ? plinth : null,
        heightMm: bind.heightMm,
        modelId: stats.modelId,
        name: bind.name || null,
        source: bind.source || null,
        map: bind.modelsByHeightMm || null,
      };
    }
  } catch (_) {}

  const isSupportLeg = (n) => {
    if (!n || typeof n !== 'object') return false;
    if (n.cldSupportLeg === true) return true;
    const t = String(n.type || n.originalType || '').toLowerCase();
    if (t === 'model' || t === 'furniture') {
      const name = String(n.name || n.spec?.key || n.modelKey || '');
      return /опора/i.test(name) || /support.?leg/i.test(name);
    }
    const name = String(n.name || n.spec?.key || '');
    return /опора/i.test(name) || /support.?leg/i.test(name);
  };

  /** Только метка роли — size/pos столешки НЕ трогаем (карточка: z=600, pos s:z+40). */
  const fixWorktopNest = (n) => {
    if (!n || typeof n !== 'object') return;
    const name = String(n.name || n.spec?.key || '');
    const et = String(n.spec?.element_type || '').toLowerCase();
    if (!/столеш/i.test(name) && et !== 'catalog_53') return;
    if (!n.layout_role && !n.layoutRole) n.layout_role = 'top';
  };

  const fixLeg = (n) => {
    if (!isSupportLeg(n)) return;
    n.cldSupportLeg = true;
    n.size = n.size && typeof n.size === 'object' ? { ...n.size } : {};
    const sy = n.size.y;
    if (!/\bv\s*:\s*h_bottom\b/i.test(String(sy || ''))) {
      const num = Number(sy);
      const lit =
        sy === 100 ||
        sy === '100' ||
        sy === 120 ||
        sy === '120' ||
        sy === 150 ||
        sy === '150' ||
        (Number.isFinite(num) && num >= 80 && num <= 200) ||
        sy == null ||
        sy === '';
      if (lit || !/\bv\s*:/.test(String(sy || ''))) {
        n.size.y = 'v:h_bottom';
        stats.legsFixed += 1;
      }
    }
    if (stats.modelId) {
      n.spec = n.spec && typeof n.spec === 'object' ? { ...n.spec } : {};
      const prevId = String(n.spec.id ?? n.modelId ?? '').trim();
      if (prevId !== stats.modelId) {
        n.spec.id = stats.modelId;
        stats.legsBound += 1;
      } else {
        n.spec.id = stats.modelId;
      }
      if (bind.name) {
        n.spec.key = bind.key || bind.name;
        n.name = bind.name;
        n.modelKey = bind.key || bind.name;
      }
      n.modelId = stats.modelId;
      // В конструкторе model живёт как detail+originalType; в комнате нужен type:model
      // (иначе _normalizeItem превратит detail → wall и опора станет «стенкой»).
      if (String(n.type || '').toLowerCase() === 'detail') {
        n.originalType = 'model';
        n.type = 'model';
      } else if (!n.type) {
        n.type = 'model';
      }
    }
  };

  const cornerNmu = o.cornerNmu === true;
  /**
   * НМУ (канон админки):
   * — ячейка / гнездо / cabinet_root / столешка = s:x до стены;
   * — корпус/цоколь/фасады = v:corner_corpus_span_mm + inset (−rear, как сзади);
   * — приставка = corner_return_*.
   * Вызывать ПОСЛЕ hydrate live_catalog, иначе corpus ещё нет в дереве.
   */
  const ancestorHasCorpusInset = (ancestors) =>
    (ancestors || []).some((a) => {
      if (!a || typeof a !== 'object') return false;
      const sx = String(a.size?.x || '').replace(/\s/g, '');
      return (
        sx === 'v:corner_corpus_span_mm' ||
        a.pos?.x === 'v:corner_side_inset_mm'
      );
    });

  const fixCornerReturnAlignNeighbor = (n, ancestors) => {
    if (!cornerNmu) return;
    const lr = String(n.layout_role || n.layoutRole || '')
      .trim()
      .toLowerCase();
    const name = String(n.name || '');
    const et = String(n.spec?.element_type || '').toLowerCase();
    const hasLive = !!(n.spec && n.spec.live_catalog);

    // Гнездо «Рабочий стол» (catalog_44) и оболочка cabinet_root — на всю ячейку.
    const isCellEnvelope =
      lr === 'cabinet_root' ||
      (/рабочий стол/i.test(name) && hasLive && et === 'catalog_46');
    if (isCellEnvelope) {
      n.size = n.size && typeof n.size === 'object' ? { ...n.size } : {};
      n.pos = n.pos && typeof n.pos === 'object' ? { ...n.pos } : {};
      if (String(n.size.x || '').replace(/\s/g, '') !== 's:x') {
        n.size.x = 's:x';
        stats.cornerReturnFixed = (stats.cornerReturnFixed || 0) + 1;
      }
      if (n.pos.x !== 0 && n.pos.x !== '0') {
        n.pos.x = 0;
        stats.cornerReturnFixed = (stats.cornerReturnFixed || 0) + 1;
      }
      return;
    }

    // Столешка — s:x родителя (= ячейка), без ужима.
    if (/столеш/i.test(name) || et === 'catalog_53' || lr === 'top') {
      n.size = n.size && typeof n.size === 'object' ? { ...n.size } : {};
      n.pos = n.pos && typeof n.pos === 'object' ? { ...n.pos } : {};
      if (String(n.size.x || '').replace(/\s/g, '') !== 's:x') {
        n.size.x = 's:x';
        stats.cornerReturnFixed = (stats.cornerReturnFixed || 0) + 1;
      }
      if (n.pos.x !== 0 && n.pos.x !== '0') {
        n.pos.x = 0;
        stats.cornerReturnFixed = (stats.cornerReturnFixed || 0) + 1;
      }
      return;
    }

    // Корпус / цоколь / фасады: W − rear (550→10, 510→50, 460→100).
    // Имена из catalog_46 после hydrate: «Стол рабочий…», «Корпус стола…», «Цоколь…».
    // Только один уровень: иначе inset×2 (приставка@100, корпус@200) при D=460.
    const isCorpusPart =
      lr === 'corpus' ||
      lr === 'plinth' ||
      lr === 'facades_main' ||
      lr === 'facades' ||
      (/^стол рабочий/i.test(name) && hasLive) ||
      /^корпус\s/i.test(name) ||
      (/^цоколь/i.test(name) && (hasLive || lr === 'plinth'));
    if (isCorpusPart) {
      // Карточка/hydrate уже могла проставить inset на вложенный узел — снять, иначе ×2.
      if (ancestorHasCorpusInset(ancestors)) {
        n.pos = n.pos && typeof n.pos === 'object' ? { ...n.pos } : {};
        if (n.pos.x === 'v:corner_side_inset_mm') {
          n.pos.x = 0;
          stats.cornerReturnFixed = (stats.cornerReturnFixed || 0) + 1;
        }
        const sxChild = String(n.size?.x || '').replace(/\s/g, '');
        if (sxChild === 'v:corner_corpus_span_mm') {
          n.size = n.size && typeof n.size === 'object' ? { ...n.size } : {};
          n.size.x = 's:x';
          stats.cornerReturnFixed = (stats.cornerReturnFixed || 0) + 1;
        }
        return;
      }
      n.size = n.size && typeof n.size === 'object' ? { ...n.size } : {};
      n.pos = n.pos && typeof n.pos === 'object' ? { ...n.pos } : {};
      const sx = String(n.size.x || '').replace(/\s/g, '');
      if (
        sx === 's:x' ||
        sx === 'v:corner_leg_mm' ||
        sx === 'v:corner_corpus_span_mm' ||
        !sx
      ) {
        if (sx !== 'v:corner_corpus_span_mm') {
          n.size.x = 'v:corner_corpus_span_mm';
          stats.cornerReturnFixed = (stats.cornerReturnFixed || 0) + 1;
        }
      }
      const px = n.pos.x;
      if (
        px === 0 ||
        px === '0' ||
        px == null ||
        px === '' ||
        px === 'v:corner_side_inset_mm'
      ) {
        if (px !== 'v:corner_side_inset_mm') {
          n.pos.x = 'v:corner_side_inset_mm';
          stats.cornerReturnFixed = (stats.cornerReturnFixed || 0) + 1;
        }
      }
      return;
    }

    if (lr !== 'corner_return' && !/приставка/i.test(name)) return;
    n.layout_role = 'corner_return';
    n.size = n.size && typeof n.size === 'object' ? { ...n.size } : {};
    n.pos = n.pos && typeof n.pos === 'object' ? { ...n.pos } : {};
    n.size.x = 'v:corner_return_mm';
    n.size.z = 'v:corner_return_depth_mm';
    if (n.pos.x !== 'v:corner_return_pos_x') {
      n.pos.x = 'v:corner_return_pos_x';
      stats.cornerReturnFixed = (stats.cornerReturnFixed || 0) + 1;
    }
    if (n.pos.y == null || n.pos.y === '') n.pos.y = 'v:h_bottom';
    if (n.pos.z == null || n.pos.z === '') n.pos.z = 's:z';
  };

  /** catalog_45 «Уголок»: сторона стыка нога|приставка, не у стены. */
  const fixUgolokSide = (n) => {
    if (cornerAtStartOpt == null || !n || typeof n !== 'object') return;
    if (!/уголок/i.test(String(n.name || ''))) return;
    const sx = Number(n.size?.x);
    const sz = Number(n.size?.z);
    const looks40 =
      (Number.isFinite(sx) && sx >= 20 && sx <= 80) ||
      (Number.isFinite(sz) && sz >= 20 && sz <= 80);
    if (!looks40 && n.size?.x !== 40 && n.size?.z !== 40) return;
    n.pos = n.pos && typeof n.pos === 'object' ? { ...n.pos } : {};
    const wantX = cornerAtStartOpt === true ? 's:x' : -40;
    const cur = n.pos.x;
    const curNorm = cur === -40 || cur === '-40' ? -40 : String(cur || '').replace(/\s/g, '');
    const wantNorm = wantX === -40 ? -40 : 's:x';
    if (curNorm !== wantNorm) {
      n.pos.x = wantX;
      stats.ugolokFixed += 1;
    }
    // Фасад приставки: z=0, pivot как в админке — не трогаем side/rot.
    if (n.pos.z == null || n.pos.z === '') n.pos.z = 0;
  };

  const walk = (n, ancestors) => {
    if (!n || typeof n !== 'object') return;
    const anc = Array.isArray(ancestors) ? ancestors : [];
    fixLeg(n);
    fixWorktopNest(n);
    fixCornerReturnAlignNeighbor(n, anc);
    fixUgolokSide(n);
    const next = anc.concat(n);
    if (Array.isArray(n.children)) n.children.forEach((ch) => walk(ch, next));
    // Вложенный «Цоколь» (catalog_32): опоры в template_tree, не в children.
    const tt = n.spec && n.spec.template_tree;
    if (Array.isArray(tt)) tt.forEach((ch) => walk(ch, next));
    const emb = n.template && n.template.tree;
    if (Array.isArray(emb)) emb.forEach((ch) => walk(ch, next));
  };

  list.forEach((n) => walk(n, []));

  // STEP 3A/3З/4A/4B: replacement → filler → overlay (+ worktop X только у overlay/НМ).
  try {
    if (o.sidePanels && typeof o.sidePanels === 'object') {
      try {
        stats.sidePanelReplacement = applyKitchenSidePanelReplacementToClodisRoots(list, {
          sidePanels: o.sidePanels,
        });
      } catch (eRep) {
        console.warn('[KITCHEN-ENGINE] sidePanel replacement apply failed', eRep);
      }
      try {
        stats.sidePanelFiller = applyKitchenSidePanelFillerToClodisRoots(list, {
          sidePanels: o.sidePanels,
          carcassDepthMm: o.carcassDepthMm || null,
          skipWorktopCover: o.skipWorktopCover === true,
        });
      } catch (eFil) {
        console.warn('[KITCHEN-ENGINE] sidePanel filler apply failed', eFil);
      }
      const ov = applyKitchenSidePanelOverlayToClodisRoots(list, {
        sidePanels: o.sidePanels,
        enabledSides: o.sidePanelOverlayEnabled || null,
        carcassDepthMm: o.carcassDepthMm || null,
        skipWorktopCover: o.skipWorktopCover === true,
      });
      stats.sidePanelOverlay = ov;
    }
  } catch (eOv) {
    console.warn('[KITCHEN-ENGINE] sidePanel overlay apply failed', eOv);
  }

  if (stats.legsFixed || stats.legsBound || stats.cornerReturnFixed || stats.ugolokFixed) {
    console.log('[KITCHEN-ENGINE] normalize tree', stats);
  }
  return stats;
}

/**
 * Подготовка place: одна карточка каталога → габарит из параметров кухни.
 * Фундамент умного конструктора: D/опоры = project (460|510|550 + plinth),
 * не depth/height из JSON карточки. Карточка = шаблон на s: / v: выражениях.
 * Без mergeFloorNicheVariablesFromSection.
 */
export function prepareKitchenPlace(furnitureData, moduleVars, sectionSize) {
  const sizing = resolvePlaceSizing(furnitureData);
  if (!sizing) {
    return {
      ok: false,
      sizing: null,
      moduleVars: moduleVars && typeof moduleVars === 'object' ? { ...moduleVars } : {},
      sectionSize: sectionSize ? { ...sectionSize } : { x: 0, y: 0, z: 0 },
      layoutZones: null,
    };
  }
  let vars = applyPlaceVariables(moduleVars, sizing);
  vars.h_top = resolveModuleHTopMm(vars, PLACEMENT_KIND.STANDALONE_FLOOR);
  const carcassDepthMm = Math.round(Number(sizing.carcassDepthMm) || 0);
  const nextSize = {
    x: Math.round(Number(sectionSize?.x) || 0),
    y: Math.round(sizing.totalHeightMm),
    // Z = линейка проекта (550/510/460), НИКОГДА catalog.depth и не столешка 600.
    z:
      carcassDepthMm > 0
        ? carcassDepthMm
        : Math.round(Number(sectionSize?.z) || 0),
  };
  delete vars.corpus_body_mm;
  delete vars.corpus_fixed_mm;
  delete vars.h_corpus_body;
  const rawPk = getRawPlacementKind(furnitureData) || sizing.profileId;
  const wallMid =
    isKitchenWallMidPlacementKind(rawPk) ||
    isKitchenWallMidPlacementKind(sizing.profileId) ||
    sizing.productKind === 'kitchen_wall_mid';
  const wallTop =
    isKitchenWallTopPlacementKind(rawPk) ||
    isKitchenWallTopPlacementKind(sizing.profileId) ||
    sizing.productKind === 'kitchen_wall_top';
  if (wallMid || wallTop) {
    // НШ1/НШ2: H из ритма; Y через customFloorClearanceMm; D из секции/проекта.
    nextSize.y = Math.round(
      Number(sizing.carcassHeightMm) ||
        Number(sizing.totalHeightMm) ||
        (wallTop ? 360 : 720)
    );
    const secZ = Math.round(Number(sectionSize?.z) || 0);
    const projectZ = Math.round(Number(sizing.carcassDepthMm) || 350);
    nextSize.z = secZ >= 200 && secZ <= 450 ? secZ : projectZ;
    sizing.carcassDepthMm = nextSize.z;
  }
  let layoutZones = null;
  if (isKitchenTallPlacementKind(rawPk) || isKitchenTallPlacementKind(sizing.profileId)) {
    // Пенал: 3 датама + plinth (не standalone floor zones).
    layoutZones =
      sizing.layoutZones && sizing.layoutZones.ok
        ? sizing.layoutZones
        : null;
  } else if (wallMid || wallTop) {
    layoutZones = null;
  } else if (kitchenPlacementUsesLayoutZones(rawPk)) {
    layoutZones = computeStandaloneFloorLayoutZones(
      nextSize.y,
      vars,
      PLACEMENT_KIND.STANDALONE_FLOOR
    );
  }
  console.log('[KITCHEN-ENGINE] place sizing', {
    profileId: sizing.profileId,
    carcassMm: sizing.carcassHeightMm,
    plinthMm: sizing.plinthHeightMm,
    totalMm: nextSize.y,
    floorClearanceMm: sizing.floorClearanceMm,
    rawPlacement: rawPk,
    useLayoutZones: !!layoutZones,
    tall: isKitchenTallPlacementKind(rawPk),
    wallMid,
    wallTop,
  });
  console.log('[KITCHEN-DEPTH] place', {
    worktopDepthMm: sizing.worktopDepthMm,
    carcassDepthMm: nextSize.z,
    frontSetbackMm: sizing.frontSetbackToCarcassMm,
    rearOverhangMm: sizing.rearOverhangMm,
  });
  return { ok: true, sizing, moduleVars: vars, sectionSize: nextSize, layoutZones };
}

export function stampKitchenUserData(ud, sizing) {
  if (!ud || !sizing) return;
  // Индивидуальные отступы модуля: default 0, не затирать при rebuild/place.
  if (!Number.isFinite(Number(ud.rearOffsetMm)) || Number(ud.rearOffsetMm) < 0) {
    ud.rearOffsetMm = 0;
  } else {
    ud.rearOffsetMm = Math.round(Number(ud.rearOffsetMm)) || 0;
  }
  if (!Number.isFinite(Number(ud.frontOffsetMm)) || Number(ud.frontOffsetMm) < 0) {
    ud.frontOffsetMm = 0;
  } else {
    ud.frontOffsetMm = Math.round(Number(ud.frontOffsetMm)) || 0;
  }
  ud.__kitchenCarcassHeightMm = Math.round(Number(sizing.carcassHeightMm) || 0);
  ud.__kitchenPlinthHeightMm = Math.round(Number(sizing.plinthHeightMm) || 0);
  ud.__kitchenProfileId = sizing.profileId || ud.__kitchenProfileId;
  // Gola только по SKU kitchen_base_gola — обычные НМ не «апгрейдим» режимом проекта.
  if (String(sizing.profileId || '').trim() === 'kitchen_base_gola') {
    ud.__placementKindProfileId = 'kitchen_base_gola';
    ud.__kitchenFrontMode = 'gola';
    ud.__kitchenProfileId = 'kitchen_base_gola';
    if (!ud.productKind || ud.productKind === 'kitchen_base') {
      ud.productKind = 'kitchen_base';
    }
  } else if (String(sizing.profileId || '').trim() === 'kitchen_base') {
    ud.__placementKindProfileId = 'kitchen_base';
    ud.__kitchenFrontMode = 'non_gola';
    ud.__kitchenProfileId = 'kitchen_base';
  } else if (String(sizing.profileId || '').trim() === 'kitchen_base_corner') {
    ud.__placementKindProfileId = 'kitchen_base_corner';
    ud.__kitchenProfileId = 'kitchen_base_corner';
  }
  // НМ / НМУ / Gola — столешка на ряде (overlay). Пенал/НШ ниже снимают флаг.
  {
    const pk = String(sizing.profileId || '').trim();
    if (
      pk === 'kitchen_base' ||
      pk === 'kitchen_base_gola' ||
      pk === 'kitchen_base_corner' ||
      sizing.productKind === 'kitchen_base'
    ) {
      ud.hasWorktop = true;
      if (!ud.productKind || ud.productKind === 'kitchen_base') {
        ud.productKind = 'kitchen_base';
      }
    }
  }
  if (sizing.productKind === 'kitchen_tall' || isKitchenTallPlacementKind(sizing.profileId)) {
    ud.productKind = 'kitchen_tall';
    ud.__placementKindProfileId = 'kitchen_tall';
    ud.__kitchenProfileId = 'kitchen_tall';
    ud.__zoneSlotRole = 'full';
    ud.__cohabitGroup = 'kitchen_column';
    ud.hasWorktop = false;
    ud.__kitchenRearOverhangMm = 0;
    ud.__kitchenFrontSetbackMm = 0;
    if (sizing.kitchenTall && typeof sizing.kitchenTall === 'object') {
      ud.__kitchenTall = { ...sizing.kitchenTall };
    }
    // Горизонты: Y от низа корпуса (стыки датамов), для отладки/UI.
    const hz = Array.isArray(sizing.horizons) ? sizing.horizons : null;
    const zones = sizing.layoutZones?.zones;
    if (hz && hz.length >= 2) {
      ud.__kitchenTallHorizonYFromCarcassMm = [
        Math.round(Number(hz[0].yFromCarcassBottomMm ?? hz[0].yMm) || 0),
        Math.round(Number(hz[1].yFromCarcassBottomMm ?? hz[1].yMm) || 0),
      ];
    } else if (zones && Number(zones.tallBandLowMm) > 0) {
      const low = Math.round(Number(zones.tallBandLowMm));
      const mid = Math.round(Number(zones.tallBandMidMm) || 0);
      ud.__kitchenTallHorizonYFromCarcassMm = [low, low + mid];
    }
  }
  if (
    sizing.productKind === 'kitchen_wall_mid' ||
    isKitchenWallMidPlacementKind(sizing.profileId)
  ) {
    // Приставной ВМУ — отдельный kind (не носитель столешки низа).
    ud.productKind =
      String(sizing.profileId || '').trim() === 'kitchen_wall_corner'
        ? 'kitchen_wall_corner'
        : 'kitchen_wall_mid';
    if (ud.productKind === 'kitchen_wall_mid') {
      ud.__placementKindProfileId = 'kitchen_wall_mid';
      ud.__kitchenProfileId = 'kitchen_wall_mid';
      ud.__zoneSlotRole = ud.__zoneSlotRole || 'mid';
    }
    ud.hasWorktop = false;
    ud.__kitchenRearOverhangMm = 0;
    ud.__kitchenFrontSetbackMm = 0;
    ud.__kitchenPlinthHeightMm = 0;
    if (Number(sizing.floorClearanceMm) >= 0) {
      ud.customFloorClearanceMm = Math.round(Number(sizing.floorClearanceMm));
    }
    if (Number(sizing.bandLowMm) > 0) ud.__kitchenBandLowMm = Math.round(Number(sizing.bandLowMm));
    if (Number(sizing.bandMidMm) > 0) ud.__kitchenBandMidMm = Math.round(Number(sizing.bandMidMm));
    if (Number(sizing.bandHighMm) > 0) ud.__kitchenBandHighMm = Math.round(Number(sizing.bandHighMm));
    if (Number(sizing.clearanceAboveWorktopMm) >= 0) {
      ud.__kitchenClearanceAboveWorktopMm = Math.round(Number(sizing.clearanceAboveWorktopMm));
    }
    if (ud.__kitchenCarcassHeightMm > 0) {
      ud.customHeightMm = ud.__kitchenCarcassHeightMm;
    }
  }
  if (
    sizing.productKind === 'kitchen_wall_top' ||
    isKitchenWallTopPlacementKind(sizing.profileId)
  ) {
    ud.productKind = 'kitchen_wall_top';
    ud.__placementKindProfileId = 'kitchen_wall_top';
    ud.__kitchenProfileId = 'kitchen_wall_top';
    ud.__zoneSlotRole = ud.__zoneSlotRole || 'top';
    ud.hasWorktop = false;
    ud.__kitchenRearOverhangMm = 0;
    ud.__kitchenFrontSetbackMm = 0;
    ud.__kitchenPlinthHeightMm = 0;
    if (Number(sizing.floorClearanceMm) >= 0) {
      ud.customFloorClearanceMm = Math.round(Number(sizing.floorClearanceMm));
    }
    if (Number(sizing.bandTopMm) > 0) ud.__kitchenBandTopMm = Math.round(Number(sizing.bandTopMm));
    if (ud.__kitchenCarcassHeightMm > 0) {
      ud.customHeightMm = ud.__kitchenCarcassHeightMm;
    }
  }
  if (Number(sizing.carcassDepthMm) > 0) {
    ud.__kitchenCarcassDepthMm = Math.round(Number(sizing.carcassDepthMm));
    ud.customDepthMm = ud.__kitchenCarcassDepthMm;
    // Place из параметров кухни, не из D карточки (одна карточка → любая линейка).
    ud.__kitchenParametricFromProject = true;
  }
  if (Number(sizing.worktopDepthMm) > 0) {
    ud.__kitchenWorktopDepthMm = Math.round(Number(sizing.worktopDepthMm));
  }
  if (Number(sizing.rearOverhangMm) >= 0) {
    ud.__kitchenRearOverhangMm = Math.round(Number(sizing.rearOverhangMm));
  }
  if (Number(sizing.frontSetbackToCarcassMm) >= 0) {
    ud.__kitchenFrontSetbackMm = Math.round(Number(sizing.frontSetbackToCarcassMm));
  }
  if (ud.__kitchenPlinthHeightMm > 0) {
    ud.hBottomMm = ud.__kitchenPlinthHeightMm;
  }
  if (ud.__kitchenCarcassHeightMm > 0 && ud.__kitchenPlinthHeightMm > 0) {
    ud.customHeightMm = ud.__kitchenCarcassHeightMm + ud.__kitchenPlinthHeightMm;
  }
}

export function getKitchenBaseWidthLimitsMm(group) {
  const fallback = { minMm: 300, maxMm: 1200 };
  const profileId = getKitchenBaseProfileIdFromGroup(group);
  if (!profileId) return fallback;
  try {
    const cfg =
      typeof window !== 'undefined' && typeof window.getRoomStepsConfig === 'function'
        ? window.getRoomStepsConfig()
        : null;
    const api = typeof window !== 'undefined' ? window.__cldPlacementKindProfiles : null;
    const profile =
      api && typeof api.resolvePlacementKindProfile === 'function'
        ? api.resolvePlacementKindProfile(profileId, cfg)
        : null;
    const ep = profile?.editPopup || {};
    const minCm = Number(ep.widthMinCm);
    const maxCm = Number(ep.widthMaxCm);
    const minMm = minCm > 0 ? Math.round(minCm * 10) : fallback.minMm;
    const maxMm = maxCm > 0 ? Math.round(maxCm * 10) : fallback.maxMm;
    return {
      minMm,
      maxMm,
      limitText:
        typeof ep.widthLimitText === 'string' && ep.widthLimitText.trim()
          ? ep.widthLimitText.trim()
          : '',
    };
  } catch (_) {
    return fallback;
  }
}

export function validateKitchenBaseCellWidthMm(group, widthMm) {
  if (!getKitchenBaseProfileIdFromGroup(group)) {
    return { ok: false, reason: 'not_kitchen_base', message: 'Модуль не kitchen_base.' };
  }
  const w = Math.round(Number(widthMm) || 0);
  if (!(w > 0)) {
    return { ok: false, reason: 'bad_width', message: 'Некорректная ширина ячейки.' };
  }
  const lim = getKitchenBaseWidthLimitsMm(group);
  if (w < lim.minMm || w > lim.maxMm) {
    const minCm = (lim.minMm / 10).toFixed(0);
    const maxCm = (lim.maxMm / 10).toFixed(0);
    const tpl =
      lim.limitText ||
      'Ширина выходит за допустимые пределы модуля. Выберите значение от {MIN} до {MAX} см.';
    const message = tpl.replace(/\{MIN\}/g, minCm).replace(/\{MAX\}/g, maxCm);
    return {
      ok: false,
      reason: 'width_range',
      message,
      minMm: lim.minMm,
      maxMm: lim.maxMm,
    };
  }
  if (!readUserDataClodisRoots(group.userData) && !readUserDataClodisData(group.userData)) {
    return {
      ok: false,
      reason: 'no_clodis',
      message: 'Нет Clodis-дерева модуля — параметрическое перестроение невозможно.',
    };
  }
  return { ok: true, minMm: lim.minMm, maxMm: lim.maxMm };
}

function _preserveHzMm(group) {
  const ud = group?.userData || {};
  const y =
    Number(ud.customHeightMm) ||
    Number(ud.__initialSectionSizeMm?.y) ||
    0;
  const z =
    Number(ud.customDepthMm) ||
    Number(ud.__initialSectionSizeMm?.z) ||
    0;
  return { y: Math.round(y), z: Math.round(z) };
}

export function alignBackToWall(group, section) {
  if (typeof _deps.alignBackToWall === 'function') {
    return _deps.alignBackToWall(group, section);
  }
  return false;
}

/** Текущая ширина ячейки НМУ: ручная → текущая → дефолт 1050. */
function _cornerCellWidthMm(group, fallbackX) {
  const ud = group?.userData || {};
  // Ячейка (1050), не корпус (1050−clear): customWidthMm держим = ячейка.
  const cell = Math.round(Number(ud.__kitchenCellWidthMm) || Number(ud.customWidthMm) || 0);
  if (cell > 50) return cell;
  const cur = Math.round(Number(fallbackX) || Number(ud.__targetSectionSizeMm?.x) || 0);
  if (cur > 50) {
    const clear = Math.max(0, Math.round(Number(ud.__kitchenSideWallClearanceMm) || 10));
    // Если в target уже корпус — восстановить ячейку.
    if (clear > 0 && Number(ud.__kitchenCellWidthMm) > 50) {
      return Math.round(Number(ud.__kitchenCellWidthMm));
    }
    return cur;
  }
  return KITCHEN_CORNER_SPECIAL_WIDTH_MM;
}

/** Отступ НМУ от боковой стены (мм). */
function _cornerSideClearMm(group) {
  const ud = group?.userData || {};
  const n = Math.round(Number(ud.__kitchenSideWallClearanceMm));
  return Number.isFinite(n) && n >= 0 ? n : 10;
}

/**
 * Ширина корпуса НМУ = ячейка − отступ.
 * Ячейка/столешка 1050 до стены; корпус короче, фасадный край на месте.
 */
function _cornerCorpusBuildWidthMm(cellW, clearMm) {
  const w = Math.max(0, Math.round(Number(cellW) || 0));
  const c = Math.max(0, Math.round(Number(clearMm) || 0));
  return Math.max(50, w - c);
}

/** D приставки: корпус модуля / project. */
function _cornerReturnDMm(group, depthFallback) {
  const ud = group?.userData || {};
  const fromUd = Math.round(Number(ud.__kitchenCarcassDepthMm) || Number(depthFallback) || 0);
  if (fromUd > 0) return fromUd;
  return resolveKitchenCornerReturnMm();
}

/** Свес спереди столешницы (мм) — канон стека НМ. */
const _CORNER_FRONT_SETBACK_MM = 40;

/**
 * Отступ справа ↔ D приставки/корпуса: D = столешка − 40 − clear.
 * clear 10 → 550; clear 50 → 510. Нога (проём фасада) не жмётся.
 */
function _cornerReturnDFromClearMm(group, clearMm) {
  const ud = group?.userData || {};
  const worktop =
    Math.round(Number(ud.__kitchenWorktopDepthMm) || 0) || 600;
  const clear = Math.max(0, Math.round(Number(clearMm) || 0));
  const d = Math.round(worktop - _CORNER_FRONT_SETBACK_MM - clear);
  return Math.max(150, d);
}

/** Сумма толщин overlay L/R (мм). Корпус пенала = ячейка − pad. STEP 6A. */
export function kitchenTallOverlayPadMm(groupOrUd) {
  const ud =
    groupOrUd && typeof groupOrUd === 'object' && groupOrUd.userData
      ? groupOrUd.userData
      : groupOrUd;
  const sp = ud?.sidePanels;
  if (!sp || typeof sp !== 'object') return 0;
  const t = KITCHEN_SIDE_PANEL_OVERLAY_THICKNESS_MM;
  let pad = 0;
  if (String(sp.left?.mode || '').toLowerCase() === 'overlay') pad += t;
  if (String(sp.right?.mode || '').toLowerCase() === 'overlay') pad += t;
  return pad;
}

/**
 * Ячейка → parametric rebuild (без scale).
 * Ширина НМУ: vars (нога едет) + rebuild + посадка в зону (как place). Без U-якоря «до/после» —
 * он мотал модуль (корпус короче ячейки на clear).
 * opts.anchor:'facade' — только карандаш отступа (нога стоит).
 * Пенал + overlay (6A): widthMm = габарит ячейки (корпус+накладки); корпус = widthMm − pad.
 */
export function rebuildForCellWidthMm(group, sectionData, widthMm, opts) {
  const check = validateKitchenBaseCellWidthMm(group, widthMm);
  if (!check.ok) return { ok: false, ...check };
  const w = Math.round(Number(widthMm));
  const hz = _preserveHzMm(group);
  if (!(hz.y > 0 && hz.z > 0)) {
    return {
      ok: false,
      reason: 'missing_hz',
      message: 'Не удалось сохранить высоту/глубину модуля для перестроения.',
    };
  }
  if (typeof _deps.rebuildFurnitureGroupForSectionResize !== 'function') {
    return { ok: false, reason: 'no_rebuild', message: 'Kitchen engine: rebuild не привязан.' };
  }
  const o = opts && typeof opts === 'object' ? opts : {};
  const keepFacade = o.anchor === 'facade';
  const ud = group.userData || (group.userData = {});
  ud.__kitchenCellWidthMm = w;
  ud.customWidthMm = w;
  delete ud.__kitchenTallOverlayPadMm;
  delete ud.__kitchenOverlayPadMm;
  const isCornerBase = isKitchenCornerBaseGroup(group);
  const isWallCorner = isKitchenWallCornerGroup(group);
  const isCorner = isCornerBase || isWallCorner;
  const isTall = isKitchenTallGroup(group);
  const tallPad = isTall ? kitchenTallOverlayPadMm(ud) : 0;
  const facadeUBefore =
    isCornerBase && keepFacade ? _measureKitchenCornerFacadeU(group, sectionData) : null;
  let buildX = w;
  let buildZ = hz.z;
  // STEP 6A: ячейка = корпус + накладки; корпус не раздуваем.
  if (isTall && tallPad > 0) {
    buildX = Math.max(50, w - tallPad);
    ud.__kitchenCellWidthMm = w;
    ud.customWidthMm = buildX;
    ud.__kitchenTallOverlayPadMm = tallPad;
  } else if (isTall) {
    delete ud.__kitchenTallOverlayPadMm;
  }
  if (isCorner) {
    // Ширина ячейки: приставка и отступ как были; едет только фасадная нога.
    // ВМУ (пирог верх): clear/wallGap = 0, return = глубина карточки (~350), не формула столешки.
    const atMin = _resolveKitchenCornerAtMinU(group, sectionData);
    let clearMm = isWallCorner ? 0 : _cornerSideClearMm(group);
    const retX = Math.round(
      Number(ud.__kitchenCornerReturnMm) ||
        Number(readUserDataClodisVariables(ud)?.corner_return_mm) ||
        (isWallCorner
          ? Number(ud.__kitchenCarcassDepthMm) || hz.z || 350
          : _cornerReturnDFromClearMm(group, clearMm))
    );
    ud.__kitchenSideWallClearanceMm = clearMm;
    if (retX > 0) ud.__kitchenCornerReturnMm = retX;
    buildX = w;
    buildZ = hz.z;
    const wallGapMm = isWallCorner ? 0 : clearMm;
    const cornerVars = buildKitchenCornerReturnVars(
      w,
      atMin,
      retX,
      clearMm,
      wallGapMm
    );
    try {
      const prev =
        readUserDataClodisVariables(ud) && typeof readUserDataClodisVariables(ud) === 'object'
          ? readUserDataClodisVariables(ud)
          : {};
      writeUserDataClodisVariables(ud, { ...prev, ...cornerVars });
    } catch (_) {}
    try {
      const roots = readUserDataClodisRoots(ud);
      if (roots) {
        normalizeKitchenBaseClodisTree(roots, {
          plinthHeightMm: ud.__kitchenPlinthHeightMm,
          cornerNmu: true,
          cornerAtStart: atMin === true,
          sidePanels: ud.sidePanels || null,
          carcassDepthMm: ud.__kitchenCarcassDepthMm || ud.customDepthMm || null,
        });
      }
    } catch (_) {}
    ud.__targetSectionSizeMm = {
      ...(ud.__targetSectionSizeMm || {}),
      x: buildX,
      y: hz.y,
      z: buildZ,
    };
    console.warn('[KITCHEN-ENGINE] corner width: leg moves, then fit zone', {
      cellW: w,
      buildX,
      corpusSpan: cornerVars.corner_corpus_span_mm,
      buildZ,
      clearMm,
      retX,
      legMm: cornerVars.corner_leg_mm,
      carcassZKeep: ud.__kitchenCarcassDepthMm,
      atMin,
      keepFacade,
      cornerVars,
    });
  }
  const ok = _deps.rebuildFurnitureGroupForSectionResize(
    group,
    sectionData,
    { x: buildX, y: hz.y, z: buildZ },
    { force: true }
  );
  if (!ok) {
    return {
      ok: false,
      reason: 'rebuild_failed',
      message: 'Параметрическое перестроение модуля не удалось — масштаб не применяем.',
    };
  }
  try {
    alignBackToWall(group, sectionData);
  } catch (_) {}
  // Отступ: фасад стоит. Ширина: только посадка в ячейку (без U-якоря).
  if (isCorner && keepFacade) {
    _anchorKitchenCornerSideU(group, sectionData, facadeUBefore, 'facade');
  } else if (isCorner && sectionData) {
    const zi =
      ud.zoneIndex != null && Number.isFinite(Number(ud.zoneIndex))
        ? Math.floor(Number(ud.zoneIndex))
        : null;
    try {
      if (zi != null && typeof _deps.fitFurnitureToSectionZone === 'function') {
        _deps.fitFurnitureToSectionZone(group, sectionData, zi);
      }
    } catch (e) {
      console.warn('[KITCHEN-ENGINE] corner width zone fit failed', e);
    }
  } else if (isTall && tallPad > 0 && sectionData) {
    // STEP 6A: bbox с накладками → в расширенную ячейку.
    const zi =
      ud.zoneIndex != null && Number.isFinite(Number(ud.zoneIndex))
        ? Math.floor(Number(ud.zoneIndex))
        : null;
    try {
      if (zi != null && typeof _deps.fitFurnitureToSectionZone === 'function') {
        _deps.fitFurnitureToSectionZone(group, sectionData, zi);
      }
    } catch (e) {
      console.warn('[KITCHEN-ENGINE] tall overlay zone fit failed', e);
    }
  }
  try {
    const reposition =
      typeof window !== 'undefined' ? window.__cldRepositionJointSchemeFurniture : null;
    if (typeof reposition === 'function') reposition(group);
  } catch (_) {}
  // После joint: снова в ячейку (reposition мог сбить U). Отступ — снова фасад.
  if (isCorner && keepFacade) {
    _anchorKitchenCornerSideU(group, sectionData, facadeUBefore, 'facade');
  } else if (isCorner && sectionData) {
    const zi =
      ud.zoneIndex != null && Number.isFinite(Number(ud.zoneIndex))
        ? Math.floor(Number(ud.zoneIndex))
        : null;
    try {
      if (zi != null && typeof _deps.fitFurnitureToSectionZone === 'function') {
        _deps.fitFurnitureToSectionZone(group, sectionData, zi);
      }
    } catch (_) {}
  } else if (isTall && tallPad > 0 && sectionData) {
    const zi =
      ud.zoneIndex != null && Number.isFinite(Number(ud.zoneIndex))
        ? Math.floor(Number(ud.zoneIndex))
        : null;
    try {
      if (zi != null && typeof _deps.fitFurnitureToSectionZone === 'function') {
        _deps.fitFurnitureToSectionZone(group, sectionData, zi);
      }
    } catch (_) {}
  }
  try {
    alignBackToWall(group, sectionData);
  } catch (_) {}
  console.log('[KITCHEN-ENGINE] rebuild width', {
    uuid: group.uuid?.slice?.(0, 8),
    widthMm: w,
    buildX,
    tallPad: tallPad || 0,
    heightMm: hz.y,
    depthMm: buildZ,
    catalog: group.userData?.catalogName || '',
    corner: isCorner,
    keepFacade,
  });
  return { ok: true, widthMm: w, heightMm: hz.y, depthMm: buildZ, buildX, tallPad };
}

export function findKitchenBaseInSectionZone(sectionData, zoneIndex) {
  if (!state?.scene || !sectionData?.id || zoneIndex == null) return null;
  const zi = Math.floor(Number(zoneIndex));
  const sid = String(sectionData.id);
  let foundFloor = null;
  state.scene.traverse((obj) => {
    if (foundFloor) return;
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    const ud = obj.userData;
    if (String(ud.sectionId) !== sid) return;
    if (Number(ud.zoneIndex) !== zi) return;
    // BASE-карандаш: только низ. MID/TOP никогда не подставлять как foundAny.
    if (isKitchenWallMidGroup(obj) || isKitchenWallTopGroup(obj)) return;
    const pk = getKitchenBaseProfileIdFromGroup(obj);
    if (!pk) return;
    if (
      pk === 'kitchen_base' ||
      pk === 'kitchen_base_gola' ||
      pk === 'kitchen_base_corner'
    ) {
      foundFloor = obj;
    }
  });
  return foundFloor;
}

export function syncKitchenBaseInZoneToWidthMm(sectionData, zoneIndex, widthMm) {
  const grp = findKitchenBaseInSectionZone(sectionData, zoneIndex);
  if (!grp) return { ok: true, skipped: true };
  return rebuildForCellWidthMm(grp, sectionData, widthMm);
}

/** Обычный верхний шкаф (MID) в зоне — не НМ, не антресоль, не ВМУ-угол. */
export function findKitchenWallMidInSectionZone(sectionData, zoneIndex) {
  if (!state?.scene || !sectionData?.id || zoneIndex == null) return null;
  const zi = Math.floor(Number(zoneIndex));
  const sid = String(sectionData.id);
  let found = null;
  state.scene.traverse((obj) => {
    if (found) return;
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    const ud = obj.userData;
    if (String(ud.sectionId) !== sid) return;
    if (Number(ud.zoneIndex) !== zi) return;
    if (!isKitchenWallMidGroup(obj)) return;
    if (isKitchenWallCornerGroup(obj)) return;
    if (isKitchenWallTopGroup(obj)) return;
    found = obj;
  });
  return found;
}

/** Карандаш MID → parametric rebuild верхнего шкафа в зоне. */
export function syncKitchenWallMidInZoneToWidthMm(sectionData, zoneIndex, widthMm) {
  const grp = findKitchenWallMidInSectionZone(sectionData, zoneIndex);
  if (!grp) return { ok: true, skipped: true };
  return rebuildForCellWidthMm(grp, sectionData, widthMm);
}

/** Антресоль (TOP) в зоне — не MID, не НМ, не ВМУ-угол. */
export function findKitchenWallTopInSectionZone(sectionData, zoneIndex) {
  if (!state?.scene || !sectionData?.id || zoneIndex == null) return null;
  const zi = Math.floor(Number(zoneIndex));
  const sid = String(sectionData.id);
  let found = null;
  state.scene.traverse((obj) => {
    if (found) return;
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    const ud = obj.userData;
    if (String(ud.sectionId) !== sid) return;
    if (Number(ud.zoneIndex) !== zi) return;
    if (!isKitchenWallTopGroup(obj)) return;
    if (isKitchenWallCornerGroup(obj)) return;
    found = obj;
  });
  return found;
}

/** Карандаш TOP → parametric rebuild антресоли в зоне. */
export function syncKitchenWallTopInZoneToWidthMm(sectionData, zoneIndex, widthMm) {
  const grp = findKitchenWallTopInSectionZone(sectionData, zoneIndex);
  if (!grp) return { ok: true, skipped: true };
  return rebuildForCellWidthMm(grp, sectionData, widthMm);
}

/** Пенал FULL в зоне (BASE+MID колонна; TOP сверху отдельно). */
export function findKitchenTallInSectionZone(sectionData, zoneIndex) {
  if (!state?.scene || !sectionData?.id || zoneIndex == null) return null;
  const zi = Math.floor(Number(zoneIndex));
  const sid = String(sectionData.id);
  let found = null;
  state.scene.traverse((obj) => {
    if (found) return;
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    const ud = obj.userData;
    if (String(ud.sectionId) !== sid) return;
    if (Number(ud.zoneIndex) !== zi) return;
    if (!isKitchenTallGroup(obj)) return;
    found = obj;
  });
  return found;
}

/** Карандаш BASE → parametric rebuild пенала в той же зоне. */
export function syncKitchenTallInZoneToWidthMm(sectionData, zoneIndex, widthMm) {
  const grp = findKitchenTallInSectionZone(sectionData, zoneIndex);
  if (!grp) return { ok: true, skipped: true };
  return rebuildForCellWidthMm(grp, sectionData, widthMm);
}

/**
 * Глубина антресоли TOP:
 * - shallow — как НШ1 (~350), перед вровень с MID;
 * - deep — как пенал FULL (~560), перед вровень с пеналом;
 * - custom — индивидуальная, якорь спереди (зад едет).
 * Над пеналом по умолчанию deep; иначе shallow.
 * @returns {{ ok: boolean, mode: string, carcassDepthMm: number, anchor: 'front'|'back', linkedTall?: boolean }}
 */
export function resolveKitchenWallTopDepthMm(group, sectionData) {
  const ud = group?.userData || {};
  const api = km();
  const zi = Math.floor(Number(ud.zoneIndex));
  const tall =
    sectionData && Number.isFinite(zi)
      ? findKitchenTallInSectionZone(sectionData, zi)
      : null;

  let tallD = 0;
  if (tall) {
    tallD =
      Math.round(Number(tall.userData?.__kitchenCarcassDepthMm) || 0) ||
      Math.round(Number(tall.userData?.customDepthMm) || 0);
  }
  if (!(tallD > 0) && api && typeof api.resolveTallCarcassDepthMm === 'function') {
    try {
      const td = api.resolveTallCarcassDepthMm({});
      if (td?.ok && Number(td.carcassDepthMm) > 0) {
        tallD = Math.round(Number(td.carcassDepthMm));
      }
    } catch (_) {}
  }
  if (!(tallD > 0)) tallD = 560;

  let shallowD = 350;
  const mid =
    sectionData && Number.isFinite(zi)
      ? findKitchenWallMidInSectionZone(sectionData, zi)
      : null;
  if (mid) {
    shallowD =
      Math.round(Number(mid.userData?.__kitchenCarcassDepthMm) || 0) ||
      Math.round(Number(mid.userData?.customDepthMm) || 0) ||
      350;
  } else if (api && typeof api.getProfile === 'function') {
    try {
      const p = api.getProfile();
      const v = p?.wall?.carcassDepthMm?.value;
      if (Number(v) > 0) shallowD = Math.round(Number(v));
    } catch (_) {}
  }
  if (shallowD < 200) shallowD = 350;
  if (shallowD > 450) shallowD = 350;

  const locked =
    ud.__kitchenTopDepthUserLocked === true ||
    String(ud.__kitchenTopDepthMode || '').trim().toLowerCase() === 'custom';
  if (locked) {
    const c =
      Math.round(Number(ud.__kitchenTopCustomDepthMm) || 0) ||
      Math.round(Number(ud.customDepthMm) || 0) ||
      Math.round(Number(ud.__kitchenCarcassDepthMm) || 0);
    if (c >= 200 && c <= 700) {
      return {
        ok: true,
        mode: 'custom',
        carcassDepthMm: c,
        anchor: 'front',
        linkedTall: !!tall,
        shallowDepthMm: shallowD,
        deepDepthMm: tallD,
      };
    }
  }

  let mode = String(ud.__kitchenTopDepthMode || '').trim().toLowerCase();
  if (mode !== 'shallow' && mode !== 'deep' && mode !== 'custom') {
    mode = tall ? 'deep' : 'shallow';
  }
  if (mode === 'deep') {
    return {
      ok: true,
      mode: 'deep',
      carcassDepthMm: tallD,
      anchor: 'back',
      linkedTall: !!tall,
      shallowDepthMm: shallowD,
      deepDepthMm: tallD,
    };
  }
  return {
    ok: true,
    mode: 'shallow',
    carcassDepthMm: shallowD,
    anchor: 'back',
    linkedTall: !!tall,
    shallowDepthMm: shallowD,
    deepDepthMm: tallD,
  };
}

/**
 * Параметрическая глубина TOP. anchor=front — перед стоит, зад едет (custom);
 * anchor=back — зад к стене (shallow/deep по умолчанию).
 */
export function rebuildWallTopForCellDepthMm(group, sectionData, depthMm, opts = {}) {
  if (!group || !isKitchenWallTopGroup(group)) {
    return { ok: false, reason: 'not_kitchen_wall_top', message: 'Не антресоль TOP.' };
  }
  if (!sectionData) {
    return { ok: false, reason: 'no_section', message: 'Нет секции.' };
  }
  const wWant = Math.round(Number(depthMm) || 0);
  if (!(wWant >= 200 && wWant <= 700)) {
    return { ok: false, reason: 'bad_depth', message: 'Некорректная глубина антресоли.' };
  }
  if (typeof _deps.rebuildFurnitureGroupForSectionResize !== 'function') {
    return { ok: false, reason: 'no_rebuild', message: 'Kitchen engine: rebuild не привязан.' };
  }

  const ud = group.userData || (group.userData = {});
  const o = opts && typeof opts === 'object' ? opts : {};
  const anchor = o.anchor === 'front' ? 'front' : 'back';
  const mode = String(o.mode || ud.__kitchenTopDepthMode || '').trim().toLowerCase();

  const wallName = String(ud.wallName || sectionData.wallName || 'back')
    .trim()
    .toLowerCase();
  let frontBefore = null;
  if (anchor === 'front' && typeof window !== 'undefined' && window.THREE) {
    try {
      group.updateMatrixWorld(true);
      const bb = new window.THREE.Box3().setFromObject(group);
      if (bb && !bb.isEmpty()) {
        if (wallName === 'back') frontBefore = bb.max.z;
        else if (wallName === 'front') frontBefore = bb.min.z;
        else if (wallName === 'left') frontBefore = bb.max.x;
        else if (wallName === 'right') frontBefore = bb.min.x;
      }
    } catch (_) {}
  }

  const wy = _preserveWyMm(group);
  const h =
    Math.round(Number(ud.customHeightMm) || 0) ||
    Math.round(Number(ud.__kitchenCarcassHeightMm) || 0) ||
    wy.y ||
    360;
  const w =
    Math.round(Number(ud.__kitchenCellWidthMm) || 0) ||
    Math.round(Number(ud.customWidthMm) || 0) ||
    wy.x;
  if (!(w > 50 && h > 50)) {
    return {
      ok: false,
      reason: 'missing_wh',
      message: 'Не удалось сохранить ширину/высоту антресоли.',
    };
  }

  ud.productKind = 'kitchen_wall_top';
  ud.__kitchenCarcassDepthMm = wWant;
  ud.customDepthMm = wWant;
  ud.__kitchenRearOverhangMm = 0;
  ud.__kitchenFrontSetbackMm = 0;
  ud.hasWorktop = false;
  if (mode === 'shallow' || mode === 'deep' || mode === 'custom') {
    ud.__kitchenTopDepthMode = mode;
  }
  if (mode === 'custom' || anchor === 'front') {
    ud.__kitchenTopCustomDepthMm = wWant;
    if (o.userLocked === true) ud.__kitchenTopDepthUserLocked = true;
  }

  const ok = _deps.rebuildFurnitureGroupForSectionResize(
    group,
    sectionData,
    { x: w, y: h, z: wWant },
    { force: true }
  );
  if (!ok) {
    return {
      ok: false,
      reason: 'rebuild_failed',
      message: 'Параметрическое перестроение глубины антресоли не удалось.',
    };
  }

  if (anchor === 'front' && frontBefore != null && Number.isFinite(frontBefore)) {
    try {
      group.updateMatrixWorld(true);
      const bb2 = new window.THREE.Box3().setFromObject(group);
      if (bb2 && !bb2.isEmpty()) {
        let frontAfter = frontBefore;
        if (wallName === 'back') frontAfter = bb2.max.z;
        else if (wallName === 'front') frontAfter = bb2.min.z;
        else if (wallName === 'left') frontAfter = bb2.max.x;
        else if (wallName === 'right') frontAfter = bb2.min.x;
        const delta = frontBefore - frontAfter;
        if (Math.abs(delta) >= 0.5) {
          if (wallName === 'back' || wallName === 'front') group.position.z += delta;
          else group.position.x += delta;
          group.updateMatrixWorld(true);
        }
      }
    } catch (_) {}
  } else {
    try {
      alignBackToWall(group, sectionData);
    } catch (_) {}
  }

  try {
    const reposition =
      typeof window !== 'undefined' ? window.__cldRepositionJointSchemeFurniture : null;
    if (typeof reposition === 'function') reposition(group);
  } catch (_) {}

  const rearOff = Math.max(0, Math.round(Number(ud.rearOffsetMm) || 0));
  console.log('[KITCHEN-DEPTH] wall_top depth rebuild', {
    mode: ud.__kitchenTopDepthMode || mode || null,
    carcassDepthMm: wWant,
    rearOffsetMm: rearOff,
    userLocked: !!ud.__kitchenTopDepthUserLocked,
    anchor,
    catalog: ud.catalogName || '',
  });
  return {
    ok: true,
    mode: ud.__kitchenTopDepthMode || mode || null,
    carcassDepthMm: wWant,
    rearOffsetMm: rearOff,
    anchor,
    widthMm: w,
    heightMm: h,
  };
}

/**
 * Параметрическая глубина НШ1 (MID). Зад к стене (как flush depth-stack).
 * ВМУ (kitchen_wall_corner) — не сюда.
 */
export function rebuildWallMidForCellDepthMm(group, sectionData, depthMm, opts = {}) {
  void opts;
  if (
    !group ||
    !isKitchenWallMidGroup(group) ||
    isKitchenWallCornerGroup(group) ||
    isKitchenWallTopGroup(group)
  ) {
    return { ok: false, reason: 'not_kitchen_wall_mid', message: 'Не навесной 1-й ярус (НШ1).' };
  }
  if (!sectionData) {
    return { ok: false, reason: 'no_section', message: 'Нет секции.' };
  }
  const wWant = Math.round(Number(depthMm) || 0);
  // Как place sizing wall mid: 200…450.
  if (!(wWant >= 200 && wWant <= 450)) {
    return { ok: false, reason: 'bad_depth', message: 'Некорректная глубина НШ1 (200…450 мм).' };
  }
  if (typeof _deps.rebuildFurnitureGroupForSectionResize !== 'function') {
    return { ok: false, reason: 'no_rebuild', message: 'Kitchen engine: rebuild не привязан.' };
  }

  const ud = group.userData || (group.userData = {});
  const wy = _preserveWyMm(group);
  const h =
    Math.round(Number(ud.customHeightMm) || 0) ||
    Math.round(Number(ud.__kitchenCarcassHeightMm) || 0) ||
    wy.y ||
    720;
  const w =
    Math.round(Number(ud.__kitchenCellWidthMm) || 0) ||
    Math.round(Number(ud.customWidthMm) || 0) ||
    wy.x;
  if (!(w > 50 && h > 50)) {
    return {
      ok: false,
      reason: 'missing_wh',
      message: 'Не удалось сохранить ширину/высоту НШ1.',
    };
  }

  ud.productKind = 'kitchen_wall_mid';
  ud.__kitchenCarcassDepthMm = wWant;
  ud.customDepthMm = wWant;
  ud.__kitchenRearOverhangMm = 0;
  ud.__kitchenFrontSetbackMm = 0;
  ud.hasWorktop = false;

  const ok = _deps.rebuildFurnitureGroupForSectionResize(
    group,
    sectionData,
    { x: w, y: h, z: wWant },
    { force: true }
  );
  if (!ok) {
    return {
      ok: false,
      reason: 'rebuild_failed',
      message: 'Параметрическое перестроение глубины НШ1 не удалось.',
    };
  }
  try {
    alignBackToWall(group, sectionData);
  } catch (_) {}
  try {
    const reposition =
      typeof window !== 'undefined' ? window.__cldRepositionJointSchemeFurniture : null;
    if (typeof reposition === 'function') reposition(group);
  } catch (_) {}

  const rearOff = Math.max(0, Math.round(Number(ud.rearOffsetMm) || 0));
  console.log('[KITCHEN-DEPTH] wall_mid depth rebuild', {
    carcassDepthMm: wWant,
    rearOffsetMm: rearOff,
    catalog: ud.catalogName || '',
  });
  return {
    ok: true,
    carcassDepthMm: wWant,
    rearOffsetMm: rearOff,
    anchor: 'back',
    widthMm: w,
    heightMm: h,
  };
}

/** Place / rhythm: применить default/custom глубину TOP. */
export function applyKitchenWallTopDepthForGroup(group, sectionData, opts = {}) {
  if (!group || !isKitchenWallTopGroup(group) || !sectionData) {
    return { ok: false, reason: 'bad_args' };
  }
  const resolved = resolveKitchenWallTopDepthMm(group, sectionData);
  if (!resolved?.ok) return resolved;
  const o = opts && typeof opts === 'object' ? opts : {};
  return rebuildWallTopForCellDepthMm(group, sectionData, resolved.carcassDepthMm, {
    mode: resolved.mode,
    anchor: o.anchor || resolved.anchor,
    userLocked: o.userLocked,
  });
}

/**
 * Режим глубины TOP без UI (для будущего карандаша / консоли).
 * mode: 'shallow' | 'deep' | 'custom'; customDepthMm при custom.
 */
export function setKitchenWallTopDepthMode(group, mode, customDepthMm, opts = {}) {
  if (!group || !isKitchenWallTopGroup(group)) {
    return { ok: false, reason: 'not_kitchen_wall_top' };
  }
  const ud = group.userData || (group.userData = {});
  const sid = ud.sectionId;
  const sec =
    sid != null && Array.isArray(state.customSections)
      ? state.customSections.find((s) => s && String(s.id) === String(sid))
      : null;
  if (!sec) return { ok: false, reason: 'no_section' };

  const m = String(mode || '').trim().toLowerCase();
  if (m === 'custom') {
    ud.__kitchenTopDepthMode = 'custom';
    ud.__kitchenTopDepthUserLocked = true;
    const c = Math.round(Number(customDepthMm) || Number(ud.customDepthMm) || 0);
    if (c >= 200 && c <= 700) ud.__kitchenTopCustomDepthMm = c;
  } else if (m === 'deep' || m === 'shallow') {
    ud.__kitchenTopDepthMode = m;
    ud.__kitchenTopDepthUserLocked = false;
    delete ud.__kitchenTopCustomDepthMm;
  } else {
    return { ok: false, reason: 'bad_mode', message: 'mode: shallow|deep|custom' };
  }
  return applyKitchenWallTopDepthForGroup(group, sec, {
    userLocked: m === 'custom',
    anchor: m === 'custom' ? 'front' : 'back',
    ...(opts || {}),
  });
}

/** После смены глубины пенала: TOP в зоне без userLocked наследует deep. */
export function syncKitchenWallTopDepthFromTallInZone(sectionData, zoneIndex) {
  const top = findKitchenWallTopInSectionZone(sectionData, zoneIndex);
  if (!top) return { ok: true, skipped: true };
  const ud = top.userData || {};
  if (ud.__kitchenTopDepthUserLocked === true) {
    return { ok: true, skipped: true, reason: 'user_locked' };
  }
  const mode = String(ud.__kitchenTopDepthMode || '').trim().toLowerCase();
  if (mode === 'custom') return { ok: true, skipped: true, reason: 'custom' };
  // Над пеналом — deep (если не явным shallow).
  if (mode !== 'shallow') {
    ud.__kitchenTopDepthMode = 'deep';
  }
  return applyKitchenWallTopDepthForGroup(top, sectionData);
}

function _resolveWorktopMmForGroup(ud) {
  const api = km();
  const fromUd = Number(ud?.__kitchenWorktopDepthMm) || 0;
  if (fromUd > 0) return Math.round(fromUd);
  if (api && typeof api.getProjectWorktopDepthMm === 'function') {
    const p = Number(api.getProjectWorktopDepthMm()) || 0;
    if (p > 0) return Math.round(p);
  }
  return 600;
}

function _preserveWyMm(group) {
  const ud = group?.userData || {};
  let x =
    Number(ud.__kitchenCellWidthMm) ||
    Number(ud.customWidthMm) ||
    Number(ud.__initialSectionSizeMm?.x) ||
    Number(ud.__targetSectionSizeMm?.x) ||
    0;
  let y =
    Number(ud.customHeightMm) ||
    Number(ud.__initialSectionSizeMm?.y) ||
    Number(ud.__targetSectionSizeMm?.y) ||
    0;
  // Fallback: bbox, если stamp ширины/высоты потерялся после прошлых rebuild.
  if ((!(x > 50) || !(y > 50)) && group && typeof window !== 'undefined' && window.THREE) {
    try {
      const THREE = window.THREE;
      group.updateMatrixWorld(true);
      const bb = new THREE.Box3().setFromObject(group);
      if (bb && !bb.isEmpty()) {
        const s = bb.getSize(new THREE.Vector3());
        if (!(x > 50) && s.x > 50) x = Math.round(s.x);
        if (!(y > 50) && s.y > 50) y = Math.round(s.y);
      }
    } catch (_) {}
  }
  return { x: Math.round(x), y: Math.round(y) };
}

/**
 * Пенал: глубина каталога (560), rear=0 к стене, перед = линия корпуса НМ.
 * Без стека столешки 10+корпус+40.
 */
export function rebuildTallForCellDepthMm(group, sectionData, carcassDepthMm, opts = {}) {
  if (!group || !isKitchenTallGroup(group)) {
    return { ok: false, reason: 'not_kitchen_tall', message: 'Не пенал.' };
  }
  const api = km();
  const ud = group.userData || (group.userData = {});
  const worktopDepthMm =
    Number(opts.worktopDepthMm) > 0
      ? Math.round(Number(opts.worktopDepthMm))
      : Number(api?.getProjectWorktopDepthMm?.()) || 600;
  let preferred = Math.round(Number(carcassDepthMm) || 0);
  if (!(preferred > 0)) preferred = Number(ud.__kitchenCarcassDepthMm) || Number(ud.customDepthMm) || 0;
  let tallD = preferred;
  if (api && typeof api.resolveTallCarcassDepthMm === 'function') {
    const td = api.resolveTallCarcassDepthMm({
      worktopDepthMm,
      preferredCarcassDepthMm: preferred > 0 ? preferred : undefined,
    });
    if (td?.ok && Number(td.carcassDepthMm) > 0) tallD = Math.round(Number(td.carcassDepthMm));
  }
  if (!(tallD > 0)) tallD = Math.round(worktopDepthMm - 40) || 560;

  const wy = _preserveWyMm(group);
  if (!(wy.x > 50 && wy.y > 50)) {
    return {
      ok: false,
      reason: 'missing_wy',
      message: 'Не удалось сохранить ширину/высоту пенала.',
      wy,
    };
  }
  if (typeof _deps.rebuildFurnitureGroupForSectionResize !== 'function') {
    return { ok: false, reason: 'no_rebuild', message: 'Kitchen engine: rebuild не привязан.' };
  }

  ud.productKind = 'kitchen_tall';
  ud.hasWorktop = false;
  ud.customDepthMm = tallD;
  ud.__kitchenCarcassDepthMm = tallD;
  ud.__kitchenFrontSetbackMm = 0;
  ud.__kitchenRearOverhangMm = 0;
  // Столешка проекта — справочно; не подменять глубиной пенала.
  if (!(Number(ud.__kitchenWorktopDepthMm) > 0)) {
    ud.__kitchenWorktopDepthMm = worktopDepthMm;
  }

  const ok = _deps.rebuildFurnitureGroupForSectionResize(
    group,
    sectionData,
    { x: wy.x, y: wy.y, z: tallD },
    { force: true }
  );
  if (!ok) {
    return {
      ok: false,
      reason: 'rebuild_failed',
      message: 'Параметрическое перестроение глубины пенала не удалось.',
    };
  }
  try {
    alignBackToWall(group, sectionData);
  } catch (_) {}
  // Антресоль над пеналом наследует D, если нет индивидуальной блокировки.
  try {
    const zi = Math.floor(Number(ud.zoneIndex));
    if (sectionData && Number.isFinite(zi) && zi >= 0) {
      syncKitchenWallTopDepthFromTallInZone(sectionData, zi);
    }
  } catch (eTopSync) {
    console.warn('[KITCHEN-DEPTH] tall→top depth sync', eTopSync);
  }
  // rearOffsetMm сохраняется: alignBackToWall → enforce → applyKitchenModuleOffsetsAfterStack.
  const rearOff = Math.max(0, Math.round(Number(ud.rearOffsetMm) || 0));
  console.log('[KITCHEN-DEPTH] tall depth rebuild', {
    carcassDepthMm: tallD,
    rearOffsetMm: rearOff,
    catalog: ud.catalogName || '',
  });
  return {
    ok: true,
    tall: true,
    widthMm: wy.x,
    heightMm: wy.y,
    carcassDepthMm: tallD,
    rearOffsetMm: rearOff,
    rearOverhangMm: 0,
    frontSetbackMm: 0,
  };
}

/**
 * Глубина одного НМ (свободно min…Dwt−40−10) под текущей столешницей.
 * Перед корпуса всегда −40 мм от торца столешницы (depth-stack).
 */
export function rebuildForCellDepthMm(group, sectionData, carcassDepthMm, opts = {}) {
  if (!group || !isKitchenBaseGroup(group)) {
    return { ok: false, reason: 'not_kitchen_base', message: 'Не модуль НМ.' };
  }
  // Пенал ≠ НМ: нельзя resolveBaseCarcassDepthMm (rear 10 / max 550) — уезжает от стены.
  if (isKitchenTallGroup(group)) {
    return rebuildTallForCellDepthMm(group, sectionData, carcassDepthMm, opts);
  }
  const api = km();
  const ud = group.userData || (group.userData = {});
  // Явный worktop из applyWorktopDepthOnWall важнее устаревшего stamp на ud.
  const worktopDepthMm =
    Number(opts.worktopDepthMm) > 0
      ? Math.round(Number(opts.worktopDepthMm))
      : _resolveWorktopMmForGroup(ud);
  const preferred = Math.round(Number(carcassDepthMm) || 0);
  if (!(preferred > 0)) {
    return { ok: false, reason: 'bad_depth', message: 'Некорректная глубина НМ.' };
  }

  let resolved = null;
  if (api && typeof api.resolveBaseCarcassDepthMm === 'function') {
    resolved = api.resolveBaseCarcassDepthMm({
      worktopDepthMm,
      preferredCarcassDepthMm: preferred,
    });
  }
  if (!resolved?.ok) {
    return {
      ok: false,
      reason: resolved?.reason || 'depth_resolve_failed',
      message:
        resolved?.message ||
        'Глубина НМ не подходит под столешницу (нужны свесы 40 мм спереди и ≥10 мм сзади).',
      worktopDepthMm,
      preferred,
    };
  }

  const carcassZ = Math.round(resolved.carcassDepthMm);
  const wy = _preserveWyMm(group);
  if (!(wy.x > 50 && wy.y > 50)) {
    return {
      ok: false,
      reason: 'missing_wy',
      message: 'Не удалось сохранить ширину/высоту модуля для перестроения.',
      wy,
    };
  }
  if (typeof _deps.rebuildFurnitureGroupForSectionResize !== 'function') {
    return { ok: false, reason: 'no_rebuild', message: 'Kitchen engine: rebuild не привязан.' };
  }

  ud.customDepthMm = carcassZ;
  ud.__kitchenCarcassDepthMm = carcassZ;
  ud.__kitchenWorktopDepthMm = resolved.worktopDepthMm;
  ud.__kitchenFrontSetbackMm = Math.round(Number(resolved.frontSetbackToCarcassMm) || 40);
  ud.__kitchenRearOverhangMm = Math.round(Number(resolved.rearOverhangMm) || 0);

  // Карандаш глубины НЕ пишет project.
  // НМУ: ячейка W; корпус = W−rear; приставка = D; фасадный край на месте.
  const isCorner = isKitchenCornerBaseGroup(group);
  const widthMm = isCorner ? _cornerCellWidthMm(group, wy.x) : wy.x;
  const facadeUBefore = isCorner
    ? _measureKitchenCornerFacadeU(group, sectionData)
    : null;
  let buildX = widthMm;
  if (isCorner) {
    const atMin = _resolveKitchenCornerAtMinU(group, sectionData);
    // Карандаш «глубина» = только Z. Project sync: return=D и clear=rear.
    const syncCornerFromProject = opts.syncCornerFromProject === true;
    let clearMm = _cornerSideClearMm(group);
    let retX;
    if (syncCornerFromProject) {
      clearMm = Math.max(0, Math.round(Number(resolved.rearOverhangMm) || clearMm));
      ud.__kitchenSideWallClearanceMm = clearMm;
      retX = carcassZ;
    } else {
      retX = Math.round(
        Number(ud.__kitchenCornerReturnMm) ||
          Number(readUserDataClodisVariables(ud)?.corner_return_mm) ||
          carcassZ
      );
    }
    ud.__kitchenCellWidthMm = widthMm;
    ud.customWidthMm = widthMm;
    // s:x = ячейка (столешка 1050 до стены); корпус W−clear — vars.
    buildX = widthMm;
    ud.__targetSectionSizeMm = {
      ...(ud.__targetSectionSizeMm || {}),
      x: buildX,
      y: wy.y,
      z: carcassZ,
    };
    if (!(Number(ud.__initialSectionSizeMm?.x) > 0)) {
      ud.__initialSectionSizeMm = {
        ...(ud.__initialSectionSizeMm || {}),
        x: widthMm,
        y: wy.y,
        z: carcassZ,
      };
    } else {
      ud.__initialSectionSizeMm = {
        ...ud.__initialSectionSizeMm,
        y: wy.y,
        z: carcassZ,
      };
    }
    // Карандаш глубины: не затирать return X. Project: sync return=D + clear=rear.
    if (retX > 0) ud.__kitchenCornerReturnMm = retX;
    const cornerVars = buildKitchenCornerReturnVars(
      widthMm,
      atMin,
      retX,
      clearMm,
      clearMm
    );
    try {
      const prev =
        readUserDataClodisVariables(ud) && typeof readUserDataClodisVariables(ud) === 'object'
          ? readUserDataClodisVariables(ud)
          : {};
      writeUserDataClodisVariables(ud, { ...prev, ...cornerVars });
    } catch (_) {}
    try {
      const roots = readUserDataClodisRoots(ud);
      if (roots) {
        normalizeKitchenBaseClodisTree(roots, {
          plinthHeightMm: ud.__kitchenPlinthHeightMm,
          cornerNmu: true,
          cornerAtStart: atMin === true,
          sidePanels: ud.sidePanels || null,
          carcassDepthMm: ud.__kitchenCarcassDepthMm || ud.customDepthMm || carcassZ || null,
        });
      }
    } catch (_) {}
    console.warn('[KITCHEN-ENGINE] corner depth', {
      carcassZ,
      retX,
      cellW: widthMm,
      buildX,
      clearMm,
      rear: ud.__kitchenRearOverhangMm,
      atMin,
      syncCornerFromProject,
      facadeUBefore,
      cornerVars,
      projectCarcass:
        api && typeof api.getProjectBaseCarcassDepthMm === 'function'
          ? api.getProjectBaseCarcassDepthMm()
          : null,
    });
  }

  const ok = _deps.rebuildFurnitureGroupForSectionResize(
    group,
    sectionData,
    { x: buildX, y: wy.y, z: carcassZ },
    { force: true }
  );
  if (!ok) {
    return {
      ok: false,
      reason: 'rebuild_failed',
      message: 'Параметрическое перестроение глубины НМ не удалось.',
    };
  }
  try {
    alignBackToWall(group, sectionData);
  } catch (_) {}
  if (isCorner) {
    _anchorKitchenCornerFacadeU(group, sectionData, facadeUBefore);
  }
  try {
    const reposition =
      typeof window !== 'undefined' ? window.__cldRepositionJointSchemeFurniture : null;
    if (typeof reposition === 'function') reposition(group);
  } catch (_) {}
  // reposition мог сбить фасад — якорим снова (щель у стены, не у фасада).
  if (isCorner) {
    _anchorKitchenCornerFacadeU(group, sectionData, facadeUBefore);
  }
  try {
    const wall = String(ud.wallName || sectionData?.wallName || '').trim();
    const ov =
      typeof window !== 'undefined' ? window.__cldKitchenRunOverlays : null;
    if (wall && ov && typeof ov.syncKitchenRunOverlaysOnWall === 'function') {
      ov.syncKitchenRunOverlaysOnWall(wall);
    }
  } catch (_) {}
  try {
    if (typeof window !== 'undefined' && typeof window.__cldRefreshRoomFurnitureXray === 'function') {
      window.__cldRefreshRoomFurnitureXray();
    }
  } catch (_) {}

  // Глубина НМУ — только project place / свой карандаш. Соседа НЕ подхватывать.
  // Явный follow только для отладки: followCorner:true.
  if (!isCorner && opts.followCorner === true && state?.scene) {
    try {
      const srcSid = String(ud.sectionId || sectionData?.id || '');
      const relatedSids = new Set();
      if (srcSid) relatedSids.add(srcSid);
      const secs = Array.isArray(state.customSections) ? state.customSections : [];
      try {
        const sec0 =
          srcSid && secs.length
            ? secs.find((s) => s && String(s.id) === srcSid)
            : sectionData;
        if (sec0?.lShape?.pairId != null) relatedSids.add(String(sec0.lShape.pairId));
        // Обратная связь: секция, у которой pairId = наш id.
        for (const s of secs) {
          if (!s?.lShape) continue;
          if (srcSid && String(s.lShape.pairId) === srcSid) relatedSids.add(String(s.id));
          if (s.lShape.pairIdLeft != null && String(s.lShape.pairIdLeft) === srcSid) {
            relatedSids.add(String(s.id));
          }
          if (s.lShape.pairIdRight != null && String(s.lShape.pairIdRight) === srcSid) {
            relatedSids.add(String(s.id));
          }
        }
      } catch (_) {}
      const corners = [];
      state.scene.traverse((obj) => {
        if (!obj?.isGroup || obj === group) return;
        if (!isKitchenCornerBaseGroup(obj)) return;
        const csid = String(obj.userData?.sectionId || '');
        if (csid && relatedSids.has(csid)) corners.push(obj);
      });
      console.warn('[KITCHEN-ENGINE] corner follow scan', {
        neighborD: carcassZ,
        srcSid,
        relatedSids: Array.from(relatedSids),
        cornersFound: corners.length,
        cornerUuids: corners.map((c) => c.uuid?.slice?.(0, 8)),
      });
      for (const cg of corners) {
        const cud = cg.userData || {};
        const sid = cud.sectionId;
        const sec =
          sid != null && secs.length
            ? secs.find((s) => s && String(s.id) === String(sid))
            : sectionData;
        if (!sec) continue;
        // Смена D соседа → и корпус НМУ, и приставка = новый D (зад в одной плоскости).
        console.warn('[KITCHEN-ENGINE] corner follow neighbor D', {
          neighborD: carcassZ,
          cornerUuid: cg.uuid?.slice?.(0, 8),
        });
        rebuildForCellDepthMm(cg, sec, carcassZ, {
          worktopDepthMm: resolved.worktopDepthMm,
          followCorner: false,
        });
      }
    } catch (e) {
      console.warn('[KITCHEN-ENGINE] corner follow depth failed', e);
    }
  }

  console.log('[KITCHEN-ENGINE] rebuild depth (one NM)', {
    uuid: group.uuid?.slice?.(0, 8),
    widthMm,
    heightMm: wy.y,
    carcassDepthMm: carcassZ,
    worktopDepthMm: resolved.worktopDepthMm,
    frontSetbackMm: resolved.frontSetbackToCarcassMm,
    catalog: ud.catalogName || '',
    corner: isCorner,
  });
  return {
    ok: true,
    widthMm,
    heightMm: wy.y,
    carcassDepthMm: carcassZ,
    worktopDepthMm: resolved.worktopDepthMm,
    frontSetbackMm: resolved.frontSetbackToCarcassMm,
    rearOverhangMm: resolved.rearOverhangMm,
    snappedPreferred: !!resolved.snappedPreferred,
  };
}

/**
 * Глубина столешницы на стене/ряду → все НМ под ней по плану (10+корпус+40).
 * Пенал: глубину и rearOffsetMm не трогаем (DEPTH-3: независимы от Dwt).
 * У каждого НМ сохраняем preferred корпус, если он ещё влезает.
 */
export function applyWorktopDepthOnWall(wallNameOpt, worktopDepthMm) {
  const wall = String(wallNameOpt || '').trim().toLowerCase();
  const dwt = Math.round(Number(worktopDepthMm) || 0);
  if (!wall) {
    return { ok: false, reason: 'no_wall', message: 'Не указана стена ряда.' };
  }
  if (!(dwt > 0)) {
    return { ok: false, reason: 'bad_worktop', message: 'Некорректная глубина столешницы.' };
  }

  const api = km();
  if (!api || typeof api.setKitchenProjectState !== 'function') {
    return {
      ok: false,
      reason: 'no_api',
      message: 'KitchenManufacturingProfile недоступен.',
    };
  }
  // Проект: новая столешница → корпус проекта = max допустимый (без старого preferred).
  api.setKitchenProjectState({ worktopDepthMm: dwt });
  const projectDefault =
    typeof api.resolveBaseCarcassDepthMm === 'function'
      ? api.resolveBaseCarcassDepthMm({
          worktopDepthMm: dwt,
          preferredCarcassDepthMm: null,
        })
      : null;
  if (projectDefault?.ok && typeof api.setProjectBaseCarcassDepthMm === 'function') {
    api.setProjectBaseCarcassDepthMm(projectDefault.carcassDepthMm);
  }

  if (!state?.scene) {
    return { ok: true, updated: 0, failed: 0, worktopDepthMm: dwt };
  }
  if (typeof _deps.rebuildFurnitureGroupForSectionResize !== 'function') {
    return {
      ok: false,
      reason: 'no_rebuild',
      message: 'Kitchen engine: rebuild не привязан.',
      worktopDepthMm: dwt,
    };
  }

  const wallOfGroup = (obj) => {
    const ud = obj?.userData || {};
    let w = String(ud.wallName || '').trim().toLowerCase();
    if (w) return w;
    const sid = ud.sectionId;
    if (sid != null && Array.isArray(state.customSections)) {
      const sec = state.customSections.find((s) => s && String(s.id) === String(sid));
      w = String(sec?.wallName || sec?.division?.wallName || '')
        .trim()
        .toLowerCase();
    }
    return w;
  };

  const groups = [];
  state.scene.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    // НМ через стек столешки; пенал — отдельно (syncTall…), не через resolveBase.
    if (!isKitchenNmCarcassGroup(obj)) return;
    if (wallOfGroup(obj) !== wall) return;
    groups.push(obj);
  });
  // Если по стене пусто (нет wallName на группах) — все НМ: столешница проектная.
  if (!groups.length) {
    state.scene.traverse((obj) => {
      if (!obj?.isGroup || !obj.userData?.isFurniture) return;
      if (!isKitchenNmCarcassGroup(obj)) return;
      groups.push(obj);
    });
  }

  let updated = 0;
  let failed = 0;
  const reports = [];
  const failReasons = [];
  for (const grp of groups) {
    const ud = grp.userData || (grp.userData = {});
    // Сразу штампуем новую столешницу — иначе rebuild читает старый ud stamp.
    ud.__kitchenWorktopDepthMm = dwt;
    // Смена столешницы на ряд: НМ → дефолт (макс. из сетки ≤ Dwt−40−10).
    // Ручной меньший корпус — только в карандаше, пока снова не меняют столешницу.
    const resolved =
      typeof api.resolveBaseCarcassDepthMm === 'function'
        ? api.resolveBaseCarcassDepthMm({
            worktopDepthMm: dwt,
            preferredCarcassDepthMm: null,
          })
        : null;
    if (!resolved?.ok) {
      failed += 1;
      failReasons.push({
        uuid: grp.uuid?.slice?.(0, 8),
        reason: resolved?.reason || 'resolve_failed',
        message: resolved?.message,
      });
      continue;
    }
    const sid = ud.sectionId;
    const sec =
      sid != null && Array.isArray(state.customSections)
        ? state.customSections.find((s) => s && String(s.id) === String(sid))
        : null;
    if (!sec) {
      failed += 1;
      failReasons.push({ uuid: grp.uuid?.slice?.(0, 8), reason: 'no_section' });
      continue;
    }
    let r;
    try {
      r = rebuildForCellDepthMm(grp, sec, resolved.carcassDepthMm, {
        worktopDepthMm: dwt,
      });
    } catch (e) {
      failed += 1;
      failReasons.push({
        uuid: grp.uuid?.slice?.(0, 8),
        reason: 'rebuild_throw',
        message: String(e?.message || e),
      });
      continue;
    }
    if (r?.ok) {
      updated += 1;
      reports.push(r);
    } else {
      failed += 1;
      failReasons.push({
        uuid: grp.uuid?.slice?.(0, 8),
        reason: r?.reason || 'rebuild_failed',
        message: r?.message,
        wy: r?.wy,
      });
    }
  }

  try {
    const ov =
      typeof window !== 'undefined' ? window.__cldKitchenRunOverlays : null;
    if (ov && typeof ov.syncKitchenRunOverlaysOnWall === 'function') {
      ov.syncKitchenRunOverlaysOnWall(wall);
    }
    const depthApi =
      typeof window !== 'undefined' ? window.__cldKitchenDepthStack : null;
    if (depthApi && typeof depthApi.enforceKitchenDepthStackOnAllModules === 'function') {
      depthApi.enforceKitchenDepthStackOnAllModules(wall);
    }
  } catch (e) {
    console.warn('[KITCHEN-DEPTH] worktop row sync failed', e);
  }
  try {
    window.__cldInvalidateIkeaCamUniformMats?.();
    window.__cldResetIkeaHdrAccum?.('worktop-depth');
  } catch (_) {}

  console.warn('[KITCHEN-ENGINE] apply worktop depth on wall', {
    wall,
    worktopDepthMm: dwt,
    updated,
    failed,
    failReasons: failReasons.slice(0, 8),
  });

  if (failed > 0 && updated === 0) {
    return {
      ok: false,
      reason: failReasons[0]?.reason || 'all_failed',
      message:
        failReasons[0]?.message ||
        'Не удалось перестроить НМ под новой столешницей.',
      worktopDepthMm: dwt,
      updated,
      failed,
      failReasons,
    };
  }
  return {
    ok: true,
    worktopDepthMm: dwt,
    updated,
    failed,
    reports,
    partial: failed > 0,
  };
}

function resolveCarcassFromUd(ud) {
  let carcass = Number(ud.__kitchenCarcassHeightMm) || 0;
  if (!(carcass > 0)) {
    const totalPrev =
      Number(ud.customHeightMm) || Number(ud.__initialSectionSizeMm?.y) || 0;
    const hbPrev =
      Number(ud.hBottomMm) || Number(ud.__kitchenPlinthHeightMm) || 0;
    if (totalPrev > hbPrev && hbPrev > 0) carcass = Math.round(totalPrev - hbPrev);
    else if (Number(ud.__catalogSizeMm?.y) > 0) {
      const catY = Math.round(Number(ud.__catalogSizeMm.y));
      carcass = hbPrev > 0 && catY > hbPrev ? catY - hbPrev : catY;
    }
  }
  if (carcass >= 800 && carcass <= 950) {
    const hbGuess = Number(ud.hBottomMm) || Number(ud.__kitchenPlinthHeightMm) || 100;
    if (carcass - hbGuess >= 500 && carcass - hbGuess <= 900) {
      carcass = Math.round(carcass - hbGuess);
    }
  }
  return carcass;
}

/**
 * Смена опор проекта.
 * НМ/пенал: корпус H не меняется, меняется h_bottom.
 * НШ1/НШ2: H не трогаем; низ = датамы (plinth+bands) — границы колонки.
 */
export function applyProjectPlinthToScene(plinthMmOpt) {
  const api = km();
  if (!api || typeof api.setProjectPlinthHeightMm !== 'function') {
    return {
      ok: false,
      reason: 'no_api',
      message: 'KitchenManufacturingProfile недоступен.',
    };
  }
  const plinth = api.snapSupportHeightMm(
    plinthMmOpt != null ? plinthMmOpt : api.getProjectPlinthHeightMm()
  );
  api.setProjectPlinthHeightMm(plinth);

  if (!state?.scene) {
    return { ok: true, updated: 0, failed: 0, skipped: 0, plinthHeightMm: plinth };
  }
  if (typeof _deps.rebuildFurnitureGroupForSectionResize !== 'function') {
    return {
      ok: false,
      reason: 'no_rebuild',
      message: 'Kitchen engine: rebuild не привязан.',
      plinthHeightMm: plinth,
    };
  }

  const groups = [];
  state.scene.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    if (!isKitchenBaseGroup(obj)) return;
    groups.push(obj);
  });

  if (!groups.length) {
    return { ok: true, updated: 0, failed: 0, skipped: 0, plinthHeightMm: plinth };
  }

  let updated = 0;
  let failed = 0;
  for (const grp of groups) {
    const ud = grp.userData || {};
    const w =
      Number(ud.__initialSectionSizeMm?.x) ||
      Number(ud.__targetSectionSizeMm?.x) ||
      0;
    const z =
      Number(ud.customDepthMm) ||
      Number(ud.__kitchenCarcassDepthMm) ||
      Number(ud.__initialSectionSizeMm?.z) ||
      Number(ud.__catalogSizeMm?.z) ||
      0;
    const sid = ud.sectionId;
    const sec =
      sid != null && Array.isArray(state.customSections)
        ? state.customSections.find((s) => s && String(s.id) === String(sid))
        : null;
    if (!sec || !(w > 0 && z > 0)) {
      failed += 1;
      continue;
    }
    if (!readUserDataClodisRoots(ud) && !readUserDataClodisData(ud)) {
      failed += 1;
      continue;
    }

    const wallHung =
      isKitchenWallMidGroup(grp) || isKitchenWallTopGroup(grp);
    if (wallHung) {
      // НШ: только граница низа от датамов; корпус без опор.
      const isTop = isKitchenWallTopGroup(grp);
      let sizing = null;
      try {
        const fn = isTop
          ? api.resolveKitchenWallTopPlaceSizing
          : api.resolveKitchenWallMidPlaceSizing;
        sizing = typeof fn === 'function' ? fn.call(api, {}) : null;
      } catch (_) {}
      if (!sizing || !sizing.ok) {
        failed += 1;
        continue;
      }
      const h = Math.round(
        Number(sizing.carcassHeightMm) || (isTop ? 360 : 720)
      );
      let dz = Math.round(Number(sizing.carcassDepthMm) || z) || Math.round(z);
      if (isTop) {
        try {
          const depthRes = resolveKitchenWallTopDepthMm(grp, sec);
          if (depthRes?.ok && Number(depthRes.carcassDepthMm) > 0) {
            dz = Math.round(Number(depthRes.carcassDepthMm));
            ud.__kitchenTopDepthMode = depthRes.mode;
          }
        } catch (_) {}
      }
      ud.hBottomMm = 0;
      ud.__kitchenPlinthHeightMm = 0;
      ud.__kitchenCarcassHeightMm = h;
      ud.customHeightMm = h;
      ud.customFloorClearanceMm = Math.round(Number(sizing.floorClearanceMm) || 0);
      if (dz > 0) {
        ud.__kitchenCarcassDepthMm = dz;
        ud.customDepthMm = dz;
      }
      const ok = _deps.rebuildFurnitureGroupForSectionResize(
        grp,
        sec,
        { x: Math.round(w), y: h, z: dz },
        { force: true }
      );
      if (!ok) {
        failed += 1;
        continue;
      }
      try {
        if (typeof _deps.snapFurnitureGroupPlacementY === 'function') {
          _deps.snapFurnitureGroupPlacementY(grp, sec);
        }
      } catch (_) {}
      try {
        const anchorFront =
          isTop &&
          (ud.__kitchenTopDepthUserLocked === true ||
            String(ud.__kitchenTopDepthMode || '') === 'custom');
        if (anchorFront) {
          applyKitchenWallTopDepthForGroup(grp, sec, { anchor: 'front' });
        } else {
          alignBackToWall(grp, sec);
        }
      } catch (_) {}
      updated += 1;
      continue;
    }

    // НМ / пенал: корпус + новые опоры.
    const carcass = resolveCarcassFromUd(ud);
    if (!(carcass > 0)) {
      failed += 1;
      continue;
    }
    const total = Math.round(carcass + plinth);
    ud.hBottomMm = plinth;
    ud.__kitchenPlinthHeightMm = plinth;
    ud.__kitchenCarcassHeightMm = carcass;
    ud.customHeightMm = total;
    try {
      const varsRaw = readUserDataClodisVariables(ud);
      const vars = varsRaw && typeof varsRaw === 'object' ? { ...varsRaw } : {};
      vars.h_bottom = plinth;
      vars.vysota_cokolya = plinth;
      writeUserDataClodisVariables(ud, vars);
    } catch (_) {}

    const ok = _deps.rebuildFurnitureGroupForSectionResize(
      grp,
      sec,
      { x: Math.round(w), y: total, z: Math.round(z) },
      { force: true }
    );
    if (!ok) {
      failed += 1;
      continue;
    }
    try {
      if (typeof _deps.snapFurnitureGroupPlacementY === 'function') {
        _deps.snapFurnitureGroupPlacementY(grp, sec);
      }
    } catch (_) {}
    try {
      // Перед ряда (560), не «зад в стену» после смены H опор.
      alignBackToWall(grp, sec);
    } catch (_) {}
    updated += 1;
  }

  try {
    if (typeof window !== 'undefined' && typeof window.__cldKitchenEnforceDepthAll === 'function') {
      window.__cldKitchenEnforceDepthAll();
    }
  } catch (_) {}

  try {
    const walls = new Set();
    state.scene?.traverse((obj) => {
      if (!isKitchenBaseGroup(obj)) return;
      const w = String(obj.userData?.wallName || '').trim();
      if (w) walls.add(w);
    });
    const ov =
      typeof window !== 'undefined' ? window.__cldKitchenRunOverlays : null;
    if (ov && typeof ov.syncKitchenRunOverlaysOnWall === 'function') {
      for (const w of walls) ov.syncKitchenRunOverlaysOnWall(w);
    }
  } catch (_) {}

  console.log('[KITCHEN-ENGINE] apply plinth', {
    plinthHeightMm: plinth,
    updated,
    failed,
  });

  if (failed > 0) {
    return {
      ok: false,
      reason: 'partial_fail',
      message:
        'Опоры проекта сохранены (' +
        plinth +
        ' мм), но часть модулей не перестроена (' +
        failed +
        '). Корпус не масштабировали.',
      updated,
      failed,
      plinthHeightMm: plinth,
    };
  }
  return { ok: true, updated, failed: 0, plinthHeightMm: plinth };
}

/**
 * Смена ordinary ↔ Gola: только флаг проекта.
 * Высота/пазы не трогаем — 780+L/C только у SKU kitchen_base_gola при place.
 */
export function applyProjectFrontModeToScene(frontModeOpt) {
  const api = km();
  if (!api || typeof api.setKitchenProjectState !== 'function') {
    return { ok: false, reason: 'no_api', message: 'KitchenManufacturingProfile недоступен.' };
  }
  const mode =
    frontModeOpt === 'gola' || frontModeOpt === 'non_gola'
      ? frontModeOpt
      : api.getKitchenProjectState()?.frontMode === 'gola'
        ? 'gola'
        : 'non_gola';
  api.setKitchenProjectState({ frontMode: mode });

  const carcassInfo =
    mode === 'gola'
      ? Math.round(Number(api.INFO_CARCASS_GOLA_MM) || 780)
      : Math.round(Number(api.INFO_CARCASS_NON_GOLA_MM) || 720);

  // Подтянуть НШ/пенал к bandLow стоящих НМ (без смены ярусов «в потолок»).
  let rhythm = null;
  try {
    rhythm = applyKitchenBandLowRhythmToScene();
  } catch (e) {
    console.warn('[KITCHEN-ENGINE] frontMode rhythm refresh failed', e);
  }

  console.log('[KITCHEN-ENGINE] apply frontMode (project flag + bandLow rhythm)', {
    frontMode: mode,
    carcassHeightMm: carcassInfo,
    rhythmUpdated: rhythm?.updated || 0,
  });

  return {
    ok: rhythm?.ok !== false,
    updated: rhythm?.updated || 0,
    failed: rhythm?.failed || 0,
    frontMode: mode,
    carcassHeightMm: carcassInfo,
  };
}

/**
 * Пересчитать низ НШ и высоту пенала от bandLow стоящих НМ.
 * Не трогает H ярусов (720/360 или ceiling-pick) — только clearance / tall = low+mid+high.
 */
export function applyKitchenBandLowRhythmToScene() {
  const api = km();
  if (!api || typeof api.resolveNmBandLowMm !== 'function') {
    return { ok: false, reason: 'no_api', updated: 0, failed: 0 };
  }
  if (!state?.scene) {
    return { ok: true, updated: 0, failed: 0, skipped: 0 };
  }
  if (typeof _deps.rebuildFurnitureGroupForSectionResize !== 'function') {
    return { ok: false, reason: 'no_rebuild', updated: 0, failed: 0 };
  }

  const bandLow = Math.round(Number(api.resolveNmBandLowMm({})) || 720);
  const bandMid = Math.round(
    Number(
      typeof api.resolveNmBandMidMm === 'function'
        ? api.resolveNmBandMidMm({})
        : api.INFO_BAND_MID_MM
    ) || 600
  );
  const plinth = Math.round(
    Number(
      typeof api.getProjectPlinthHeightMm === 'function'
        ? api.getProjectPlinthHeightMm()
        : 100
    ) || 100
  );

  const groups = [];
  state.scene.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    if (!isKitchenBaseGroup(obj)) return;
    groups.push(obj);
  });

  let updated = 0;
  let failed = 0;
  let skipped = 0;
  let bandHighFromWall = 0;

  for (const grp of groups) {
    if (isKitchenWallMidGroup(grp)) {
      const h = Math.round(Number(grp.userData?.__kitchenCarcassHeightMm) || 0);
      if (h > bandHighFromWall) bandHighFromWall = h;
    }
  }
  if (!(bandHighFromWall > 0)) bandHighFromWall = 720;

  for (const grp of groups) {
    const ud = grp.userData || {};
    const w =
      Number(ud.__initialSectionSizeMm?.x) ||
      Number(ud.__targetSectionSizeMm?.x) ||
      0;
    const z =
      Number(ud.customDepthMm) ||
      Number(ud.__kitchenCarcassDepthMm) ||
      Number(ud.__initialSectionSizeMm?.z) ||
      Number(ud.__catalogSizeMm?.z) ||
      0;
    const sid = ud.sectionId;
    const sec =
      sid != null && Array.isArray(state.customSections)
        ? state.customSections.find((s) => s && String(s.id) === String(sid))
        : null;
    if (!sec || !(w > 0)) {
      failed += 1;
      continue;
    }

    const isTop = isKitchenWallTopGroup(grp);
    const isMid = isKitchenWallMidGroup(grp);
    const isTall = isKitchenTallGroup(grp);

    if (isMid) {
      const h = Math.round(Number(ud.__kitchenCarcassHeightMm) || 720);
      const clr = plinth + bandLow + bandMid;
      const dz = Math.round(Number(ud.__kitchenCarcassDepthMm) || z) || 350;
      ud.customFloorClearanceMm = clr;
      ud.__kitchenCarcassHeightMm = h;
      ud.customHeightMm = h;
      const ok = _deps.rebuildFurnitureGroupForSectionResize(
        grp,
        sec,
        { x: Math.round(w), y: h, z: dz },
        { force: true }
      );
      if (!ok) {
        failed += 1;
        continue;
      }
      try {
        if (typeof _deps.snapFurnitureGroupPlacementY === 'function') {
          _deps.snapFurnitureGroupPlacementY(grp, sec);
        }
      } catch (_) {}
      try {
        alignBackToWall(grp, sec);
      } catch (_) {}
      updated += 1;
      continue;
    }

    if (isTop) {
      const h = Math.round(Number(ud.__kitchenCarcassHeightMm) || 360);
      const high = bandHighFromWall > 0 ? bandHighFromWall : 720;
      const clr = plinth + bandLow + bandMid + high;
      let dz = Math.round(Number(ud.__kitchenCarcassDepthMm) || z) || 350;
      try {
        const depthRes = resolveKitchenWallTopDepthMm(grp, sec);
        if (depthRes?.ok && Number(depthRes.carcassDepthMm) > 0) {
          dz = Math.round(Number(depthRes.carcassDepthMm));
          ud.__kitchenTopDepthMode = depthRes.mode;
          ud.__kitchenCarcassDepthMm = dz;
          ud.customDepthMm = dz;
        }
      } catch (_) {}
      ud.customFloorClearanceMm = clr;
      ud.__kitchenCarcassHeightMm = h;
      ud.customHeightMm = h;
      const ok = _deps.rebuildFurnitureGroupForSectionResize(
        grp,
        sec,
        { x: Math.round(w), y: h, z: dz },
        { force: true }
      );
      if (!ok) {
        failed += 1;
        continue;
      }
      try {
        if (typeof _deps.snapFurnitureGroupPlacementY === 'function') {
          _deps.snapFurnitureGroupPlacementY(grp, sec);
        }
      } catch (_) {}
      try {
        const anchorFront =
          ud.__kitchenTopDepthUserLocked === true ||
          String(ud.__kitchenTopDepthMode || '') === 'custom';
        if (anchorFront) {
          applyKitchenWallTopDepthForGroup(grp, sec, { anchor: 'front' });
        } else {
          alignBackToWall(grp, sec);
        }
      } catch (_) {}
      updated += 1;
      continue;
    }

    if (isTall) {
      const high = bandHighFromWall > 0 ? bandHighFromWall : 720;
      const carcass = bandLow + bandMid + high;
      const total = Math.round(plinth + carcass);
      const dz = Math.round(Number(ud.__kitchenCarcassDepthMm) || z) || Math.round(z);
      ud.hBottomMm = plinth;
      ud.__kitchenPlinthHeightMm = plinth;
      ud.__kitchenCarcassHeightMm = carcass;
      ud.customHeightMm = total;
      const ok = _deps.rebuildFurnitureGroupForSectionResize(
        grp,
        sec,
        { x: Math.round(w), y: total, z: dz },
        { force: true }
      );
      if (!ok) {
        failed += 1;
        continue;
      }
      try {
        if (typeof _deps.snapFurnitureGroupPlacementY === 'function') {
          _deps.snapFurnitureGroupPlacementY(grp, sec);
        }
      } catch (_) {}
      try {
        alignBackToWall(grp, sec);
      } catch (_) {}
      try {
        finalizeKitchenBaseAppearance(grp);
      } catch (_) {}
      updated += 1;
      continue;
    }

    skipped += 1;
  }

  try {
    const walls = new Set();
    state.scene?.traverse((obj) => {
      if (!isKitchenBaseGroup(obj)) return;
      const wn = String(obj.userData?.wallName || '').trim();
      if (wn) walls.add(wn);
    });
    const ov =
      typeof window !== 'undefined' ? window.__cldKitchenRunOverlays : null;
    if (ov && typeof ov.syncKitchenRunOverlaysOnWall === 'function') {
      for (const wn of walls) ov.syncKitchenRunOverlaysOnWall(wn);
    }
  } catch (_) {}

  console.log('[KITCHEN-ENGINE] apply bandLow rhythm', {
    bandLow,
    bandMid,
    bandHighFromWall,
    tallCarcass: bandLow + bandMid + bandHighFromWall,
    updated,
    failed,
    skipped,
  });

  return {
    ok: failed === 0,
    updated,
    failed,
    skipped,
    bandLowMm: bandLow,
    bandMidMm: bandMid,
    bandHighMm: bandHighFromWall,
    tallCarcassHeightMm: bandLow + bandMid + bandHighFromWall,
  };
}

/**
 * Тест «в потолок»: после смены высоты комнаты пересобрать НШ1/НШ2/пенал
 * под pick 860|920|960 + half (не выше потолка).
 */
export function applyKitchenCeilingTiersToScene() {
  const api = km();
  if (!api || typeof api.resolveKitchenWallTiersToCeilingMm !== 'function') {
    return { ok: false, reason: 'no_api', updated: 0, failed: 0 };
  }
  if (!state?.scene) {
    return { ok: true, updated: 0, failed: 0, skipped: 0 };
  }
  if (typeof _deps.rebuildFurnitureGroupForSectionResize !== 'function') {
    return { ok: false, reason: 'no_rebuild', updated: 0, failed: 0 };
  }

  const groups = [];
  state.scene.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    if (!isKitchenBaseGroup(obj)) return;
    groups.push(obj);
  });

  let updated = 0;
  let failed = 0;
  let skipped = 0;
  for (const grp of groups) {
    const ud = grp.userData || {};
    const w =
      Number(ud.__initialSectionSizeMm?.x) ||
      Number(ud.__targetSectionSizeMm?.x) ||
      0;
    const z =
      Number(ud.customDepthMm) ||
      Number(ud.__kitchenCarcassDepthMm) ||
      Number(ud.__initialSectionSizeMm?.z) ||
      Number(ud.__catalogSizeMm?.z) ||
      0;
    const sid = ud.sectionId;
    const sec =
      sid != null && Array.isArray(state.customSections)
        ? state.customSections.find((s) => s && String(s.id) === String(sid))
        : null;
    if (!sec || !(w > 0)) {
      failed += 1;
      continue;
    }

    const isTop = isKitchenWallTopGroup(grp);
    const isMid = isKitchenWallMidGroup(grp);
    const isTall = isKitchenTallGroup(grp);

    if (isMid || isTop) {
      let sizing = null;
      try {
        const fn = isTop
          ? api.resolveKitchenWallTopPlaceSizing
          : api.resolveKitchenWallMidPlaceSizing;
        sizing = typeof fn === 'function' ? fn.call(api, {}) : null;
      } catch (_) {}
      if (!sizing || !sizing.ok) {
        failed += 1;
        continue;
      }
      const h = Math.round(
        Number(sizing.carcassHeightMm) || (isTop ? 360 : 720)
      );
      const dz =
        Math.round(Number(sizing.carcassDepthMm) || z) || Math.round(z) || 350;
      ud.hBottomMm = 0;
      ud.__kitchenPlinthHeightMm = 0;
      ud.__kitchenCarcassHeightMm = h;
      ud.customHeightMm = h;
      ud.customFloorClearanceMm = Math.round(Number(sizing.floorClearanceMm) || 0);
      if (Number(sizing.carcassDepthMm) > 0) {
        ud.__kitchenCarcassDepthMm = Math.round(Number(sizing.carcassDepthMm));
        ud.customDepthMm = ud.__kitchenCarcassDepthMm;
      }
      const ok = _deps.rebuildFurnitureGroupForSectionResize(
        grp,
        sec,
        { x: Math.round(w), y: h, z: dz },
        { force: true }
      );
      if (!ok) {
        failed += 1;
        continue;
      }
      try {
        if (typeof _deps.snapFurnitureGroupPlacementY === 'function') {
          _deps.snapFurnitureGroupPlacementY(grp, sec);
        }
      } catch (_) {}
      try {
        alignBackToWall(grp, sec);
      } catch (_) {}
      updated += 1;
      continue;
    }

    if (isTall) {
      let sizing = null;
      try {
        sizing =
          typeof api.resolveKitchenTallPlaceSizing === 'function'
            ? api.resolveKitchenTallPlaceSizing({})
            : null;
      } catch (_) {}
      if (!sizing || !sizing.ok) {
        failed += 1;
        continue;
      }
      const plinth = Math.round(
        Number(sizing.plinthHeightMm) || api.getProjectPlinthHeightMm() || 100
      );
      const carcass = Math.round(Number(sizing.tallCarcassHeightMm) || 0);
      if (!(carcass > 0)) {
        failed += 1;
        continue;
      }
      const total = Math.round(plinth + carcass);
      const dz = Math.round(Number(sizing.carcassDepthMm) || z) || Math.round(z);
      ud.hBottomMm = plinth;
      ud.__kitchenPlinthHeightMm = plinth;
      ud.__kitchenCarcassHeightMm = carcass;
      ud.customHeightMm = total;
      const ok = _deps.rebuildFurnitureGroupForSectionResize(
        grp,
        sec,
        { x: Math.round(w), y: total, z: dz },
        { force: true }
      );
      if (!ok) {
        failed += 1;
        continue;
      }
      try {
        if (typeof _deps.snapFurnitureGroupPlacementY === 'function') {
          _deps.snapFurnitureGroupPlacementY(grp, sec);
        }
      } catch (_) {}
      try {
        alignBackToWall(grp, sec);
      } catch (_) {}
      updated += 1;
      continue;
    }

    skipped += 1;
  }

  try {
    const walls = new Set();
    state.scene?.traverse((obj) => {
      if (!isKitchenBaseGroup(obj)) return;
      const wn = String(obj.userData?.wallName || '').trim();
      if (wn) walls.add(wn);
    });
    const ov =
      typeof window !== 'undefined' ? window.__cldKitchenRunOverlays : null;
    if (ov && typeof ov.syncKitchenRunOverlaysOnWall === 'function') {
      for (const wn of walls) ov.syncKitchenRunOverlaysOnWall(wn);
    }
  } catch (_) {}

  let pick = null;
  try {
    pick = api.resolveKitchenWallTiersToCeilingMm({});
  } catch (_) {}

  console.log('[KITCHEN-ENGINE] apply ceiling tiers', {
    updated,
    failed,
    skipped,
    pick,
  });

  return {
    ok: failed === 0,
    updated,
    failed,
    skipped,
    ceilingTiers: pick,
  };
}

/**
 * Смена глубины столешницы проекта → пересчёт корпуса НМ (дефолт = Dwt−40−10) и rebuild Z.
 * @param {number} [worktopDepthMmOpt]
 * @param {number} [preferredCarcassDepthMmOpt] меньший корпус вручную
 */
export function applyProjectDepthToScene(worktopDepthMmOpt, preferredCarcassDepthMmOpt) {
  const api = km();
  if (!api || typeof api.setKitchenProjectState !== 'function') {
    return {
      ok: false,
      reason: 'no_api',
      message: 'KitchenManufacturingProfile недоступен.',
    };
  }
  const patch = {};
  if (worktopDepthMmOpt != null) patch.worktopDepthMm = worktopDepthMmOpt;
  if (preferredCarcassDepthMmOpt != null) {
    patch.baseCarcassDepthMm = preferredCarcassDepthMmOpt;
  }
  const st = api.setKitchenProjectState(patch);
  const depth = api.resolveBaseCarcassDepthMm({
    worktopDepthMm: st.worktopDepthMm,
    preferredCarcassDepthMm: st.baseCarcassDepthMm,
  });
  if (!depth.ok) {
    return {
      ok: false,
      reason: depth.reason || 'depth_resolve_failed',
      message: depth.message || 'Не удалось подобрать глубину корпуса НМ.',
      worktopDepthMm: st.worktopDepthMm,
      depth,
    };
  }

  // L-ячейки: сбросить кэш сегментов — special = 500+новый D.
  try {
    if (Array.isArray(state?.customSections)) {
      for (const sec of state.customSections) {
        const div = sec?.division;
        if (!div || !sec.lShape) continue;
        div.segmentsLShape = null;
        div.segmentsLShapeBack = null;
        div.cornerWidthMm = Math.round(depth.carcassDepthMm) || div.cornerWidthMm;
      }
    }
  } catch (_) {}

  const carcassZ = Math.round(depth.carcassDepthMm);
  if (!state?.scene) {
    return {
      ok: true,
      updated: 0,
      failed: 0,
      worktopDepthMm: depth.worktopDepthMm,
      carcassDepthMm: carcassZ,
      rearOverhangMm: depth.rearOverhangMm,
    };
  }

  // Тот же путь, что карандаш глубины (rebuildForCellDepthMm) — не ломаем опоры/W.
  const groups = [];
  state.scene.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    if (!isKitchenNmCarcassGroup(obj)) return;
    groups.push(obj);
  });

  let updated = 0;
  let failed = 0;
  for (const grp of groups) {
    const ud = grp.userData || {};
    const sid = ud.sectionId;
    const sec =
      sid != null && Array.isArray(state.customSections)
        ? state.customSections.find((s) => s && String(s.id) === String(sid))
        : null;
    if (!sec) {
      failed += 1;
      continue;
    }
    let r = null;
    try {
      r = rebuildForCellDepthMm(grp, sec, carcassZ, {
        worktopDepthMm: depth.worktopDepthMm,
        followCorner: false,
        syncCornerFromProject: true,
      });
    } catch (e) {
      console.warn('[KITCHEN-DEPTH] project depth rebuild throw', e);
      failed += 1;
      continue;
    }
    if (r?.ok) updated += 1;
    else failed += 1;
  }

  try {
    if (typeof window !== 'undefined' && typeof window.__cldKitchenEnforceDepthAll === 'function') {
      window.__cldKitchenEnforceDepthAll();
    }
  } catch (_) {}

  try {
    const walls = new Set();
    state.scene?.traverse((obj) => {
      if (!isKitchenBaseGroup(obj)) return;
      const w = String(obj.userData?.wallName || '').trim();
      if (w) walls.add(w);
    });
    const ov =
      typeof window !== 'undefined' ? window.__cldKitchenRunOverlays : null;
    if (ov && typeof ov.syncKitchenRunOverlaysOnWall === 'function') {
      for (const w of walls) ov.syncKitchenRunOverlaysOnWall(w);
    }
  } catch (_) {}

  console.log('[KITCHEN-DEPTH] apply', {
    worktopDepthMm: depth.worktopDepthMm,
    carcassDepthMm: carcassZ,
    frontSetbackMm: depth.frontSetbackToCarcassMm,
    rearOverhangMm: depth.rearOverhangMm,
    updated,
    failed,
  });

  if (failed > 0) {
    return {
      ok: false,
      reason: 'partial_fail',
      message:
        'Глубина проекта сохранена (столешница ' +
        depth.worktopDepthMm +
        ' / корпус ' +
        carcassZ +
        '), но часть модулей не перестроена (' +
        failed +
        ').',
      updated,
      failed,
      worktopDepthMm: depth.worktopDepthMm,
      carcassDepthMm: carcassZ,
      rearOverhangMm: depth.rearOverhangMm,
    };
  }
  return {
    ok: true,
    updated,
    failed: 0,
    worktopDepthMm: depth.worktopDepthMm,
    carcassDepthMm: carcassZ,
    rearOverhangMm: depth.rearOverhangMm,
  };
}

/**
 * Ряд только из kitchen_base → без wardrobe 16mm caps.
 * @param {Array} furnitureList groups in section
 */
export function shouldSkipWardrobeCapsForKitchenRow(furnitureList) {
  if (!Array.isArray(furnitureList) || !furnitureList.length) return false;
  return furnitureList.every((g) => isKitchenBaseGroup(g));
}

/**
 * После сборки НМ: опоры НЕ тянем по Y (иначе 100→150 = «вытянуто»).
 * Высота = SKU cabinet_model по plinth (normalize → spec.id). Позиции — из JSON.
 * Только секционный TopPlank/AutoTop (шкафная обкладка ряда) — скрыть.
 */
export function finalizeKitchenBaseAppearance(group) {
  if (!group?.isObject3D || !isKitchenBaseGroup(group)) {
    return { ok: false, reason: 'not_kitchen_base' };
  }
  const THREE_REF =
    typeof window !== 'undefined' && window.THREE ? window.THREE : null;
  if (!THREE_REF) return { ok: false, reason: 'no_three' };

  const ud = group.userData || {};
  // STEP 2A: контракт sidePanels на экземпляре (без геометрии).
  try {
    ensureKitchenSidePanelsOnUserData(ud);
  } catch (_) {}
  // STEP 4A: replacement → штатные бока в канал outside (после сборки мешей).
  try {
    const leftM = String(ud.sidePanels?.left?.mode || '').toLowerCase();
    const rightM = String(ud.sidePanels?.right?.mode || '').toLowerCase();
    if (leftM === 'replacement' || rightM === 'replacement') {
      applyKitchenSidePanelReplacementAppearance(group, ud.sidePanels);
    }
  } catch (_) {}
  const hb = Math.max(
    0,
    Number(ud.hBottomMm) ||
      Number(ud.__kitchenPlinthHeightMm) ||
      Number(ud.clodisVariables?.h_bottom) ||
      0
  );
  let legsScaled = 0;
  let sectionTopsHidden = 0;

  const isLegObj = (obj) => {
    if (!obj) return false;
    if (obj.userData?.cldSupportLeg) return true;
    const n = String(obj.name || '');
    return /Model_Опора|Опора кухонная|cldSupportLeg/i.test(n);
  };

  // Только помечаем целевую высоту; scale.y не трогаем (реальный GLB 100/120/150).
  if (hb > 0) {
    group.traverse((obj) => {
      if (!obj?.isGroup || !isLegObj(obj)) return;
      obj.userData.cldSupportLegTargetHeightMm = hb;
    });
  }

  // Только обкладка секции (TopPlank/AutoTop), не монтажные планки модуля.
  group.traverse((obj) => {
    if (!obj?.isMesh) return;
    if (!(obj.userData?.isTopPlank || obj.userData?.isTransitionAutoTopCap)) return;
    obj.visible = false;
    sectionTopsHidden += 1;
  });

  // AutoTop живёт на state.scene (не внутри group) — иначе «крышка шкафа» остаётся.
  try {
    const scene = state?.scene || null;
    const gid = String(group.uuid || '');
    if (scene && gid && typeof scene.traverse === 'function') {
      scene.traverse((obj) => {
        if (!obj?.isMesh) return;
        const oud = obj.userData || {};
        if (!(oud.isTransitionAutoTopCap || oud.isTransitionTopCap)) return;
        const uuids = Array.isArray(oud.mergedTopFurnitureUuids)
          ? oud.mergedTopFurnitureUuids.map(String)
          : [];
        if (!uuids.includes(gid)) return;
        obj.visible = false;
        sectionTopsHidden += 1;
      });
    }
  } catch (_) {}

  // Gola-вырезы — Форма стенки L/C+L в шаблоне (видимый контур), не скрытые __cldGrooves.
  try {
    const pk = String(
      ud.__placementKindProfileId || ud.placementKind || ud.productKind || ''
    ).trim();
    if (isKitchenNmCarcassGroup(group) && pk === 'kitchen_base_gola') {
      ud.__kitchenFrontMode = 'gola';
    }
  } catch (_) {}

  console.log('[KITCHEN-ENGINE] finalize appearance', {
    hb,
    legsScaled,
    sectionTopsHidden,
    catalog: ud.catalogName || '',
  });
  return { ok: true, hb, legsScaled, sectionTopsHidden };
}

/** Одна строка bust — старая ?v=-копия модуля не должна перезаписать API (dual-load). */
const __CLD_KITCHEN_BASE_ENGINE_BUILD = '20261101-restore1';

function __cldRegisterKitchenBaseEngineApi(api) {
  if (typeof window === 'undefined') return;
  const prevBuild = String(window.__cldKitchenBaseEngineBuild || '');
  // Dual-load: не затирать тот же bust. Строковое >= ломало смену side5b* → restore*.
  if (prevBuild && prevBuild === __CLD_KITCHEN_BASE_ENGINE_BUILD) return;
  window.__cldKitchenBaseEngineBuild = __CLD_KITCHEN_BASE_ENGINE_BUILD;
  window.__cldKitchenBaseEngine = api;
}

if (typeof window !== 'undefined') {
  __cldRegisterKitchenBaseEngineApi({
    resolvePlaceSizing,
    prepareKitchenPlace,
    kitchenPlacementUsesLayoutZones,
    normalizeKitchenBaseClodisTree,
    resolveKitchenSupportBinding(plinthMm, kitchenSupports) {
      const api = km();
      if (api && typeof api.resolveSupportCabinetModelBinding === 'function') {
        return api.resolveSupportCabinetModelBinding(plinthMm, kitchenSupports || null);
      }
      return { heightMm: 100, modelId: '2', name: 'Опора кухонная 100', enabled: true };
    },
    finalizeKitchenBaseAppearance,
    resolveGolaTwoDrawerFacadeLayoutMm,
    GOLA_TWO_DRAWER_FACADE_H_MM,
    applyProjectPlinthToScene,
    applyProjectFrontModeToScene,
    applyKitchenBandLowRhythmToScene,
    applyKitchenCeilingTiersToScene,
    applyProjectDepthToScene,
    applyWorktopDepthOnWall,
    rebuildForCellWidthMm,
    rebuildForCellDepthMm,
    dumpKitchenCornerDebug,
    verifyNmFollowDepth,
    rebuildTallForCellDepthMm,
    syncKitchenBaseInZoneToWidthMm,
    findKitchenWallMidInSectionZone,
    syncKitchenWallMidInZoneToWidthMm,
    findKitchenWallTopInSectionZone,
    syncKitchenWallTopInZoneToWidthMm,
    findKitchenTallInSectionZone,
    syncKitchenTallInZoneToWidthMm,
    resolveKitchenWallTopDepthMm,
    rebuildWallTopForCellDepthMm,
    rebuildWallMidForCellDepthMm,
    applyKitchenWallTopDepthForGroup,
    setKitchenWallTopDepthMode,
    syncKitchenWallTopDepthFromTallInZone,
    validateKitchenBaseCellWidthMm,
    isKitchenBaseGroup,
    isKitchenCornerBaseGroup,
    isKitchenWallCornerGroup,
    isKitchenCornerModuleGroup,
    isKitchenCornerPlacementKind,
    resolveKitchenNeighborCarcassDepthMm,
    isKitchenTallGroup,
    kitchenTallOverlayPadMm,
    isKitchenWallMidGroup,
    isKitchenWallTopGroup,
    isKitchenNmCarcassGroup,
    isKitchenSidePanelsModuleGroup,
    shouldSkipFloorNicheMerge,
    shouldSkipWardrobeCapsForKitchenRow,
  });
  window.__cldIsKitchenBaseGroup = isKitchenBaseGroup;
  window.__cldIsKitchenCornerBaseGroup = isKitchenCornerBaseGroup;
  window.__cldIsKitchenWallCornerGroup = isKitchenWallCornerGroup;
  window.__cldIsKitchenCornerModuleGroup = isKitchenCornerModuleGroup;
  window.__cldIsKitchenTallGroup = isKitchenTallGroup;
  window.__cldIsKitchenWallTopGroup = isKitchenWallTopGroup;
  window.__cldSetKitchenWallTopDepthMode = setKitchenWallTopDepthMode;
  window.__cldApplyKitchenWallTopDepthForGroup = applyKitchenWallTopDepthForGroup;
  // Offsets API: window.__cldSetKitchenModuleOffsetsMm — в kitchen-depth-stack.js
  window.__cldIsKitchenWallMidGroup = isKitchenWallMidGroup;
  window.__cldIsKitchenNmCarcassGroup = isKitchenNmCarcassGroup;
  window.__cldIsKitchenSidePanelsModuleGroup = isKitchenSidePanelsModuleGroup;
  window.__cldDumpKitchenCorner = dumpKitchenCornerDebug;
  window.__cldVerifyNmFollowDepth = verifyNmFollowDepth;
}

/** Дамп НМУ / соседей в консоль: __cldDumpKitchenCorner() */
export function dumpKitchenCornerDebug() {
  const api = km();
  const projectCarcass =
    api && typeof api.getProjectBaseCarcassDepthMm === 'function'
      ? api.getProjectBaseCarcassDepthMm()
      : null;
  const rows = [];
  if (state?.scene) {
    state.scene.traverse((obj) => {
      if (!obj?.isGroup || !obj.userData?.isFurniture) return;
      if (!isKitchenBaseGroup(obj)) return;
      const ud = obj.userData || {};
      const vars = readUserDataClodisVariables(ud) || {};
      const corner = isKitchenCornerBaseGroup(obj);
      rows.push({
        kind: corner ? 'NMU' : 'NM',
        uuid: obj.uuid?.slice?.(0, 8),
        name: ud.catalogName || '',
        sectionId: ud.sectionId,
        zoneIndex: ud.zoneIndex,
        carcassZ: Number(ud.__kitchenCarcassDepthMm) || Number(ud.customDepthMm) || null,
        cellW: Number(ud.__kitchenCellWidthMm) || Number(ud.customWidthMm) || null,
        corner_return_mm: Number(vars.corner_return_mm) || null,
        corner_return_pos_x: Number(vars.corner_return_pos_x) || null,
        corner_side_inset_mm: Number(vars.corner_side_inset_mm) || null,
        target: ud.__targetSectionSizeMm || null,
      });
    });
  }
  const corners = rows.filter((r) => r.kind === 'NMU');
  const nms = rows.filter((r) => r.kind === 'NM');
  const dump = {
    bust: typeof window !== 'undefined' ? window.__CLD_BUILD : null,
    projectCarcass,
    nmCount: nms.length,
    nmuCount: corners.length,
    nm: nms,
    nmu: corners,
    neighborHint:
      corners.length && !nms.length
        ? 'НМУ один на сцене — follow соседа не из чего брать. Поставьте обычный НМ рядом и смените ему глубину.'
        : null,
    geometryHint:
      corners.length &&
      nms.length &&
      corners.some(
        (c) =>
          c.corner_return_mm > 0 &&
          nms.some((n) => n.carcassZ > 0 && Math.abs(n.carcassZ - c.corner_return_mm) < 2)
      )
        ? 'vars OK (return≈NM). Если визуал как 550 — дерево было с литералом 550; после d10 normalize → v:corner_return_mm, переставь НМУ или смени D соседа снова.'
        : null,
  };
  console.warn('[KITCHEN-CORNER-DUMP]', dump);
  return dump;
}

/**
 * Самопроверка follow: НМ → D, НМУ return/корпус должен = D.
 * В консоли: __cldVerifyNmFollowDepth(460)
 * @param {number} [targetMm=460]
 * @returns {{ ok: boolean, before: object, after: object, message: string }}
 */
export function verifyNmFollowDepth(targetMm = 460) {
  const want = Math.round(Number(targetMm) || 460);
  const before = dumpKitchenCornerDebug();
  const nms = before.nm || [];
  const nmus = before.nmu || [];
  if (!nms.length || !nmus.length) {
    const out = {
      ok: false,
      reason: 'need_nm_and_nmu',
      message:
        'Нужны на сцене обычный НМ и НМУ. Поставь оба, потом снова __cldVerifyNmFollowDepth(460).',
      before,
    };
    console.warn('[KITCHEN-FOLLOW-VERIFY]', out);
    return out;
  }
  const nmRow = nms[0];
  let nmGroup = null;
  let nmSec = null;
  state.scene.traverse((obj) => {
    if (nmGroup || !obj?.isGroup || !obj.userData?.isFurniture) return;
    if (!isKitchenBaseGroup(obj) || isKitchenCornerBaseGroup(obj)) return;
    if (String(obj.uuid).startsWith(String(nmRow.uuid))) nmGroup = obj;
  });
  if (!nmGroup) {
    const out = { ok: false, reason: 'nm_group_missing', message: 'НМ group не найден.', before };
    console.warn('[KITCHEN-FOLLOW-VERIFY]', out);
    return out;
  }
  const sid = nmGroup.userData?.sectionId;
  nmSec =
    sid != null && Array.isArray(state.customSections)
      ? state.customSections.find((s) => s && String(s.id) === String(sid))
      : null;
  const r = rebuildForCellDepthMm(nmGroup, nmSec, want, { followCorner: true });
  const after = dumpKitchenCornerDebug();
  const nmuAfter = (after.nmu || [])[0];
  const ret = Math.round(Number(nmuAfter?.corner_return_mm) || 0);
  const cz = Math.round(Number(nmuAfter?.carcassZ) || 0);
  const pass = r?.ok && ret === want && cz === want;
  const out = {
    ok: !!pass,
    wantMm: want,
    rebuildOk: !!r?.ok,
    nmuReturnMm: ret,
    nmuCarcassMm: cz,
    message: pass
      ? `PASS: НМ→${want}, НМУ return=${ret}, корпус=${cz}`
      : `FAIL: НМ→${want}, НМУ return=${ret}, корпус=${cz}` +
        (r?.ok ? '' : `; rebuild: ${r?.reason || r?.message || 'fail'}`),
    before,
    after,
    rebuild: r,
  };
  console.warn('[KITCHEN-FOLLOW-VERIFY]', out);
  return out;
}
