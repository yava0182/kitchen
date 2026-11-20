// Furniture manager module - handles furniture creation, placement, movement
// Main module for all furniture operations

import * as __THREE_MOD from 'three';
import { state } from '../utils/state.js';
import {
  isStep5DecorUsable,
  getStep5DecorTextureUrl,
  getStep5DecorHexFallback,
  getStep5DecorPreviewColor,
} from '../ui/color-wheel.js?v=20260913-hang-lite';
import {
  applyJointFittingHolesToFurnitureGroup,
  repositionJointSchemeFurnitureInRoom,
} from '../joint-hole-meshes.js?v=20261010-parity2';
import {
  getWindowRowRef,
  getWindowRowSillMm,
  getWindowRowStandaloneHeightMm,
  resolveWindowRowPlaceHeightMm,
  bumpWindowRowSceneRev,
} from '../sections/window-row-model.js?v=20260918-straight-s12';
import {
  removeFurnitureGhost,
  startFurniturePlacement,
  updateFurnitureGhostPosition,
  showCatalogDragIcon,
  removeCatalogDragIcon,
  isKitchenWallBandFurnitureData,
} from './furniture-ghost.js?v=20261107-ucorner19';
import { updateMousePosition } from '../events/mouse-handler.js';
import { hideFurniturePerimeterMarker, showFurniturePerimeterMarker, showSectionPerimeterMarker } from '../ui/markers.js';
import { applyRoomCabinetStudioLook, syncAllRoomCabinetStudio, syncAllSectionTrimStudio, applySectionTrimStudioLookForSectionId, refreshCabinetStudioAfterDecor, refreshCabinetEdgeIkeaV0, scheduleIkeaRoomLightSync } from './room-cabinet-studio.js?v=20261104-ikl-prod6';
import {
  applyIkeaV0MeshDecorFromStep5ToMesh,
  copyIkeaV0VisualFromCoreToEdge,
} from './ikea-room-light-v0.js?v=20261104-ikl-prod6';
import {
  findSectionAtPosition,
  snapToZoneDoubleModule,
  buildZoneSnapForSection,
  getZonePivotWorldPosition,
  resolveSectionFurniturePlacement,
  alignFurnitureBBoxToSectionInnerBounds,
  fitFurnitureToSectionZone,
  fitFurnitureBBoxToZoneBounds,
  TOP_PLANK_HEIGHT_MM,
  getZoneDoorKind,
  getFurnitureFrontWorldCoord,
  anchorFurnitureFrontWorldCoord,
  alignSectionStandaloneFurnitureFront,
  logFurniturePivotTrace,
  L_CORNER_CONFIG,
  getLShapeMeta,
  getLShapeSpecialZoneIndex,
  getLShapeSpecialZoneIndices,
  getLShapeSpecialSnapBounds,
  getLShapePairForSection,
  ensureLShapeDivisionSegments,
  ensureKitchenLCornerFlush,
  syncWindowAlongEmptyFramesOnWall,
  syncSectionEmptyFrameVisibility,
  ensureWindowAlongFrameMeshes,
  ensureCellVolumesAfterNmPlace,
} from '../sections/section-manager.js?v=20261103-wdepth5';
import { isUShapeBackSection } from '../sections/l-corner.js?v=20261022-bust13';
import { getAxisCoord, getWallAxes } from '../utils/wall-coords.js';
import {
  getEndCabinetSlot,
  getEndCabinetEntry,
  getEndCabinetRule,
  removeEndCabinetFurniture,
  ensureEndCabinets,
  getPendingEndCabinetPlacement,
  setPendingEndCabinetPlacement,
  clearPendingEndCabinetPlacement,
  isEndCabinetActive,
  isPendingEndCabinetModule,
  snapEndCabinetGroupToSlot,
  setEndCabinetSlotHighlight,
  activateEndCabinetCatalogForSlot,
  switchBackToRegularCatalog,
  resolveDefaultEndCabinetZoneHand,
  END_CABINET_SIDES,
} from '../sections/section-end-cabinet.js?v=20260917-endcab-nobridge';
import {
  getSlotVerticalMetrics,
  getNicheCabinetSlotHeightMm,
  computePlacementVerticalZones,
  computeStandaloneFloorLayoutZones,
  refreshSectionVerticalLayout,
  mergeFloorNicheVariablesFromSection,
  getTechZoneMmFromVariables,
  resolveModuleHTopMm,
  PLACEMENT_KIND,
  isWallHungPlacementKind,
  isWallHungLowPlacementKind,
  isWallHungHighPlacementKind,
  isLowFurniturePlacementKind,
  isKitchenBasePlacementKind,
  isKitchenTallPlacementKind,
  isKitchenWallMidPlacementKind,
  isKitchenWallTopPlacementKind,
  DEFAULT_BOTTOM_PLANK_MM,
  resolveWallHungFloorClearanceMm,
} from '../sections/vertical-layout.js?v=20261010-plinth-datum1';
import {
  bindKitchenBaseEngineDeps,
  getKitchenProfileIdFromFurnitureData,
  resolvePlaceSizing as resolveKitchenPlaceHeightAndPlinth,
  applyPlaceVariables as applyKitchenPlaceVariables,
  prepareKitchenPlace,
  stampKitchenUserData,
  finalizeKitchenBaseAppearance,
  kitchenPlacementUsesLayoutZones,
  shouldSkipFloorNicheMerge as kitchenShouldSkipFloorNicheMerge,
  getKitchenBaseProfileIdFromGroup,
  getKitchenBaseWidthLimitsMm,
  validateKitchenBaseCellWidthMm,
  rebuildForCellWidthMm as rebuildKitchenBaseForCellWidthMm,
  rebuildForCellDepthMm as rebuildKitchenBaseForCellDepthMm,
  findKitchenBaseInSectionZone,
  syncKitchenBaseInZoneToWidthMm,
  applyProjectPlinthToScene as applyProjectPlinthHeightToKitchenBases,
  applyProjectFrontModeToScene as applyProjectFrontModeToKitchenBases,
  applyKitchenBandLowRhythmToScene as applyKitchenBandLowRhythmToKitchenModules,
  applyKitchenCeilingTiersToScene as applyKitchenCeilingTiersToKitchenModules,
  applyProjectDepthToScene as applyProjectDepthToKitchenBases,
  applyWorktopDepthOnWall as applyKitchenWorktopDepthOnWall,
  isKitchenBaseGroup,
  isKitchenTallGroup,
  isKitchenCornerBaseGroup,
  isKitchenWallCornerGroup,
  isKitchenWallTopGroup,
  isKitchenWallMidGroup,
  applyKitchenWallTopDepthForGroup,
  setKitchenWallTopDepthMode,
  findKitchenTallInSectionZone,
  isKitchenTallColumnZone,
  resolveKitchenWallTopDepthMm,
  isKitchenCornerModuleGroup,
  resolveKitchenNeighborCarcassDepthMm,
} from '../kitchen/kitchen-base-engine.js?v=20261103-wdepth5';
import {
  isKitchenNmPlacement,
  buildKitchenCellSnap,
  getKitchenCellPivotWorldPosition,
  placeKitchenModuleInCell,
  afterKitchenPlaceLayout,
  alignKitchenModuleBackToWall,
} from '../kitchen/kitchen-section-engine.js?v=20261107-ucorner12';
import {
  isKitchenSectionLayoutActive,
  resolveKitchenCornerSpecialWidthMm,
  resolveKitchenWallCornerWidthMm,
  KITCHEN_WALL_CORNER_DEFAULT_WIDTH_MM,
  resolveKitchenCornerPlaceFromProject,
  resolveKitchenCornerAtStartForCatalogCard,
  isKitchenStraightBaseBandSection,
  buildKitchenBandCellLayoutForSection,
  markCustomZoneWidthsSource,
  CUSTOM_ZONE_WIDTHS_SOURCE_USER,
  isKitchenUpperCornerSeatBZone,
} from '../kitchen/kitchen-section-layout.js?v=20261107-ucorner19';
import {
  resolveKitchenUpperCornerSeatTarget,
  buildUpperCornerSeatBSnap,
  hitAttractsUpperCornerSeatB,
} from '../kitchen/kitchen-upper-corner-seats.js?v=20261107-ucorner19';
import { prepareKitchenModuleForBuild } from '../clodis/clodis-build-contract.js?v=20261106-u600g5';
import {
  applySidePanelsToPreparedRoots,
  ensureTallAutoSideOverlayS2A,
  tintSideOverlaysInGroupS2A,
} from '../kitchen/kitchen-side-panels.js?v=20261031-s2a2';
import {
  rebuildSectionZoneEditIconsForSection,
  removeSectionZoneEditIcon,
  clearModuleEditFocusFog,
  createDimensionLabel,
  buildStep4SectionEditIcons,
  clearStep4SectionEditIcons,
  buildStep5FurnitureIcons,
  deselectAllStep5Furniture,
  refreshFurnitureCatalogNameLabels,
  upsertFurnitureCatalogNameLabel,
  invalidateGroupIconBBoxCache,
  askStandalonePlaceHeightChoice,
} from '../ui/scene-icons.js?v=20261031-side4b';
import { getClodisDataForBuild, extractSectionSizeFromFurnitureData, getDataForBuild, extractModuleVariablesFromFurnitureData } from './furniture-clodis.js?v=20261027-nmu142g';
import {
  readClodisJSON,
  readClodisVariables,
  writeClodisJSON,
  writeClodisVariables,
  readUserDataClodisData,
  readUserDataClodisRoots,
  migrateCatalogArrayStorageKeys,
  migrateCatalogItemStorageKeys,
  writeUserDataClodisData,
  writeUserDataClodisRoots,
  writeUserDataClodisVariables,
  readUserDataClodisVariables,
} from '../clodis-json-fields.js?v=20261008-joint-room2';
import { normalizeClodisRoots } from '../cabinet-pyramid-layout.js?v=20260614-catalog-migrate';
import {
  prepareClodisForRoomBuild,
  resolveDoorLayoutFromFurnitureData,
  resolveDoorKindFromFurnitureData,
  resolveZoneHandFromPlacement,
  resolveUnifiedFacadeFromFurnitureData,
  resolveRoomStep4UnifiedFacadeToggle,
  resolveRoomStep4FacadeBottomDeepToggle,
  resolveLowerFacadeBottomOverhangMm,
  resolveEffectiveUnifiedFacade,
  extractUnifiedFacadeFromCatalogItem,
  clodisRootsHaveSplitFacades,
  clodisTreeHasSwingRotateDoor,
  resolveModuleHasSwingDoor,
  readPairedHandCatalogIdsFromItem,
  buildRoomDoorPrepareOpts,
  filterClodisTreeByDoorLayout,
  normalizeZoneHand,
  normalizeDoorKind,
  resolveZoneHandForSingleSwingModule,
} from './furniture-door-layout.js?v=20261010-kitchen-base-doors';
import {
  applyDrawerStackPolicyToRoots,
  applyInteriorDrawerStackToRoots,
  extractDrawerStackPolicyFromCatalogItem,
  stampDrawerNoHandleFlagsInTree,
  syncDrawerCatalog33ToGlobalCache,
  ensureDrawerCatalog33FreshFromApi,
} from './furniture-drawer-stack.js?v=20261011-gola-sku';
import {
  applyShelfStackPolicyToRoots,
  countShelfLikeNodesInTree,
  extractShelfStackPolicyFromCatalogItem,
  isFullHeightShelvesOnlyLayout,
  isShelfModuleNode,
  logShelfCount,
  resolveShelfLayoutPolicy,
} from './furniture-shelf-stack.js?v=20260711-rod-slide-block';
import {
  applyInteriorFillToRoomRoots,
  extractInteriorLayoutFromCatalogItem,
  shouldApplyInteriorLayoutForCatalog,
  treeHasNestedFillCatalogModule,
} from './furniture-interior-layout.js?v=20260912-props-fix';
import {
  normalizeCatalogIconAspect,
  parseCatalogItemDataField,
  resolveCatalogItemIconAspect,
  resolveCatalogItemIcon,
  catalogScreenshotExportSize,
  CATALOG_ICON_ASPECT_LOW,
} from './catalog-icon-aspect.js?v=20260624-drag-icon-v5';
import { getFurnitureFloorContactWorldYNoAo } from '../sections/section-layout-role-utils.js';
import {
  computeFurnitureWorldBBoxNoAo,
  computeFurnitureCorpusLayoutWorldBBoxNoAo,
  shouldExcludeMeshFromFurnitureBBox,
  withFurnitureDoorSwingsClosedForMeasure,
} from './furniture-bbox.js?v=20261025-cell1';
import { patchSectionNicheDepthWrite } from '../sections/section-depth-patch.js';
import { syncCabinetPivotDebugVisibility } from '../debug/cabinet-pivot-visibility.js';
import { refreshAllHingeRoleMarkersInRoom, mountHingeRoleMarkersOnFurniture } from './hinge-role-markers-room.js?v=20260613-hinge-cup-y-align';
import {
  refreshSectionTrimEdges,
  refreshTrimPartNumberLabels,
  isTrimPartNumberLabelsVisible,
  resolveSectionTrimBinding,
  isSectionTrimFacadeMesh,
  getEdgeVariantsFromItem,
  resolveEdgeVariantIndex,
} from '../sections/section-trim-edges.js?v=20260921-ghost-wh2';
import {
  rebuildAllTransitions,
  rebuildTransitionsForWall,
  cumulativeTransitionGapMm,
  getSectionZoneTransitionGaps,
} from '../sections/section-transition-manager.js?v=20261027-nmu142g';

// Prefer window.THREE (index.html bootstrap) to avoid dual-instance Mesh checks;
// fall back to ESM import so top-level consts never hit bare THREE ReferenceError.
const THREE =
  (typeof window !== 'undefined' && window.THREE) ||
  (typeof globalThis !== 'undefined' && globalThis.THREE) ||
  __THREE_MOD;
if (typeof window !== 'undefined' && !window.THREE) window.THREE = THREE;

function isTemplateLockedMaterialFromUserData(ud) {
  if (typeof window !== 'undefined' && typeof window.__cldIsTemplateMaterialUserData === 'function') {
    return window.__cldIsTemplateMaterialUserData(ud);
  }
  return false;
}

/** Пивот и ширина между внутренними гранями боковых планок (не по внешнему bbox секции). */
function applyInnerSectionFurnitureSlot(section, wallName, position, sectionSize, opts = {}) {
  const innerSlot = resolveSectionFurniturePlacement(section, wallName);
  const depthForSection =
    wallName === 'left' || wallName === 'right'
      ? Number(section.size?.x) || 0
      : Number(section.size?.z ?? section.size?.depth) || 0;
  const nicheX = Number(innerSlot?.innerWidthMm) || Number(section.size?.x) || 0;
  const nicheZ = Number(innerSlot?.depthMm) || depthForSection;
  const catalogSize = opts.catalogSizeForClamp || {};
  const catalogX = Number(catalogSize.x);
  const catalogZ = Number(catalogSize.z);
  const nicheY = opts.nicheSlotYmm ?? opts.fallbackSlotY ?? sectionSize?.y;
  const resolveSpan = (niche, catalog) => {
    if (niche > 0) {
      // Узкая зона: min(ниша, каталог). Широкая зона (> каталога): полная ширина для s:x.
      if (catalog > 0 && niche > catalog) return niche;
      if (catalog > 0) return Math.min(niche, catalog);
      return niche;
    }
    if (catalog > 0) return catalog;
    return 0;
  };
  const next = {
    x: resolveSpan(nicheX, catalogX) || sectionSize?.x || 600,
    y: nicheY ?? sectionSize?.y ?? 600,
    z: resolveSpan(nicheZ, catalogZ) || sectionSize?.z || 600,
  };
  if (innerSlot?.position) position.copy(innerSlot.position);
  return next;
}

/**
 * JSON из конструктора / Clodis: uniform scale в updateFurnitureInSection ломает геометрию
 * (внутренние модули, петли) и при «кривом» bbox даёт ложное «уменьшение».
 * Должно совпадать по смыслу с проверкой перед legacy-scale в placePendingFurniture.
 */
function clodisHasConstructorMarkers(node) {
  if (!node) return false;
  const t = typeof node;
  if (t === 'string') {
    if (node.indexOf('@section.') !== -1) return true;
    if (node.indexOf('detailTypeId') !== -1) return true;
    if (/(^|[^a-zA-Z_])s\s*:\s*[xyz]([^a-zA-Z_]|$)/.test(node)) return true;
    if (/(^|[^a-zA-Z_])v\s*:\s*[a-zA-Z_]/.test(node)) return true;
    if (/(^|[^a-zA-Z_])g\s*:\s*[a-zA-Z_]/.test(node)) return true;
    if (/\$wall\s*\.\s*thickness\b/i.test(node)) return true;
    if (/\$size\s*\.\s*[xyz]\b/i.test(node)) return true;
    if (/\$back\s*\.\s*offset\b/i.test(node)) return true;
    if (/\$front\s*\.\s*offset\b/i.test(node)) return true;
    return false;
  }
  if (t !== 'object') return false;
  if (Array.isArray(node)) return node.some(clodisHasConstructorMarkers);
  for (const k of Object.keys(node)) {
    const v = node[k];
    if (k === 'detailTypeId') return true;
    if (k === 'layout_role' || k === 'sectionLayoutRole') return true;
    if (k === 'clodisJSON' || k === 'clodisJSON' || k === 'template_tree' || k === 'constructor_structure') return true;
    if (clodisHasConstructorMarkers(v)) return true;
  }
  return false;
}

function __disposeMaterialMaps(material) {
  if (!material) return;
  const mats = Array.isArray(material) ? material : [material];
  const mapKeys = [
    'map',
    'normalMap',
    'roughnessMap',
    'metalnessMap',
    'aoMap',
    'emissiveMap',
    'alphaMap',
    'bumpMap',
    'displacementMap',
    'envMap',
  ];
  for (const m of mats) {
    if (!m) continue;
    for (const key of mapKeys) {
      try {
        if (m[key]?.dispose) m[key].dispose();
        m[key] = null;
      } catch (_) {}
    }
    try {
      m.dispose?.();
    } catch (_) {}
  }
}

function __assignMaterialMap(material, texture) {
  if (!material) return;
  const prev = material.map;
  if (prev && prev !== texture) {
    try {
      prev.dispose();
    } catch (_) {}
  }
  material.map = texture;
}

function __disposeObject3DTree(root) {
  if (!root) return;
  root.traverse((obj) => {
    if (obj.geometry) {
      try {
        obj.geometry.dispose();
      } catch (_) {}
    }
    __disposeMaterialMaps(obj.material);
  });
}

let _refreshFurnitureDecorsTimer = null;
let _decorTextureLoader = null;
const _decorTextureCache = new Map();
let _pendingCorpusEdgeSync = false;

function __getDecorTextureLoader() {
  if (!_decorTextureLoader && typeof THREE !== 'undefined') {
    _decorTextureLoader = new THREE.TextureLoader();
  }
  return _decorTextureLoader;
}

/** Shared body maps — clone-per-mesh blew VRAM on step 5 with several wardrobes. */
const _decorBodyTexBySource = new WeakMap();

function __configureDecorTextureColorSpace(tex) {
  if (tex.colorSpace !== undefined && THREE.SRGBColorSpace !== undefined) {
    tex.colorSpace = THREE.SRGBColorSpace;
  } else if (tex.encoding !== undefined && THREE.sRGBEncoding !== undefined) {
    tex.encoding = THREE.sRGBEncoding;
  }
  tex.anisotropy = 1;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
}

function __prepareDecorTextureClone(tex, { edgeStrip, obj, forceMeshUv = false }) {
  if (forceMeshUv) {
    const localTex = tex.clone();
    localTex.wrapS = localTex.wrapT = THREE.ClampToEdgeWrapping;
    localTex.repeat.set(1, 1);
    localTex.offset.set(0, 0);
    __configureDecorTextureColorSpace(localTex);
    return localTex;
  }
  if (!edgeStrip) {
    let shared = _decorBodyTexBySource.get(tex);
    if (shared) return shared;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.set(1, 1);
    __configureDecorTextureColorSpace(tex);
    _decorBodyTexBySource.set(tex, tex);
    return tex;
  }
  const localTex = tex.clone();
  const os = __getFacadeOriginalSizeMmForEdgeStrip(obj);
  localTex.wrapS = localTex.wrapT = THREE.RepeatWrapping;
  localTex.repeat.set(os.x / 1000, os.y / 1000);
  __configureDecorTextureColorSpace(localTex);
  return localTex;
}

function __preloadStep5DecorTexturesFromSelection(sel) {
  if (!sel) return;
  const urls = new Set([
    getStep5DecorTextureUrl(sel.outside),
    getStep5DecorTextureUrl(sel.inside),
  ].filter(Boolean));
  for (const url of urls) {
    __loadDecorTexture(url, () => {});
  }
}

const DECOR_GPU_MAX_EDGE = 1024;

function __downscaleDecorTextureIfNeeded(tex) {
  const img = tex?.image;
  if (!img || typeof document === 'undefined') return tex;
  const iw = img.naturalWidth || img.width || 0;
  const ih = img.naturalHeight || img.height || 0;
  if (!(iw > DECOR_GPU_MAX_EDGE || ih > DECOR_GPU_MAX_EDGE)) {
    __configureDecorTextureColorSpace(tex);
    return tex;
  }
  try {
    const scale = DECOR_GPU_MAX_EDGE / Math.max(iw, ih);
    const w = Math.max(1, Math.round(iw * scale));
    const h = Math.max(1, Math.round(ih * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    tex.image = canvas;
    tex.needsUpdate = true;
  } catch (_) {}
  __configureDecorTextureColorSpace(tex);
  return tex;
}

function __loadDecorTexture(url, onReady, onError) {
  if (!url || typeof onReady !== 'function') return;
  const loadUrl =
    /[^\x00-\x7F]/.test(url) && !/%[0-9A-Fa-f]{2}/.test(url) ? encodeURI(url) : url;
  const cached = _decorTextureCache.get(loadUrl) || _decorTextureCache.get(url);
  if (cached) {
    onReady(cached);
    return;
  }
  const loader = __getDecorTextureLoader();
  if (!loader) return;
  loader.load(
    loadUrl,
    (tex) => {
      const ready = __downscaleDecorTextureIfNeeded(tex);
      _decorTextureCache.set(loadUrl, ready);
      _decorTextureCache.set(url, ready);
      onReady(ready);
    },
    undefined,
    (err) => {
      if (typeof onError === 'function') onError(err);
    }
  );
}

function __scheduleCorpusEdgeSyncOnce() {
  if (_pendingCorpusEdgeSync || !state?.scene) return;
  _pendingCorpusEdgeSync = true;
  requestAnimationFrame(() => {
    _pendingCorpusEdgeSync = false;
    try {
      syncCorpusEdgeMaterialsFromCoreMeshes(state.scene);
    } catch (_) {}
  });
}

const _catalogFreshMeta = new Map();
/** Короткий TTL: после Save админки комната не должна жить на снимке 3 минуты. */
const CATALOG_FRESH_TTL_MS = 5 * 1000;

function _readCatalogRev() {
  try {
    const fromLs = parseInt(localStorage.getItem('cld_catalog_rev') || '0', 10);
    if (Number.isFinite(fromLs) && fromLs > 0) return fromLs;
  } catch (_) {}
  try {
    const bump = parseInt(window.__cldCatalogFreshBump || '0', 10);
    if (Number.isFinite(bump) && bump > 0) return bump;
  } catch (_) {}
  return 0;
}

/** Сырой items_get в LS (без clodisJSON) — яд для комнаты; форсим re-export. */
function _catalogLsLooksPoisoned(catKey) {
  try {
    const raw = localStorage.getItem(catKey);
    if (!raw) return false;
    const list = JSON.parse(raw);
    if (!Array.isArray(list) || !list.length) return false;
    const sample = list.find((x) => x && typeof x === 'object') || {};
    const hasClodis =
      (Array.isArray(sample.clodisJSON) && sample.clodisJSON.length > 0) ||
      (Array.isArray(sample.params) && sample.params.length > 0);
    const hasCs = !!(
      sample.constructor_structure ||
      (sample.data &&
        typeof sample.data === 'object' &&
        sample.data.constructor_structure)
    );
    return !hasClodis && hasCs;
  } catch (_) {
    return false;
  }
}

/** Сброс TTL-кэша каталогов (вызывается после Save / export). */
window.__cldInvalidateConstructorCatalogCache = function () {
  _catalogFreshMeta.clear();
  try {
    const rev = Date.now();
    localStorage.setItem('cld_catalog_rev', String(rev));
    window.__cldCatalogFreshBump = rev;
  } catch (_) {}
};

function readPairedCatalogIdsFromItem(item) {
  const d = parseCatalogItemDataField(item);
  if (window.__cldCatalogDoorPair?.parsePairedIds) {
    return window.__cldCatalogDoorPair.parsePairedIds(d);
  }
  const raw = d.pairedCatalogItemIds;
  if (!raw || typeof raw !== 'object') return { single: 0, double: 0 };
  return {
    single: Number(raw.single) || 0,
    double: Number(raw.double) || 0,
  };
}

/** data.kitchenSupports с карточки модуля (карта высота>cabinet_model.id). */
function extractKitchenSupportsFromCatalogItem(catalogItem) {
  if (!catalogItem || typeof catalogItem !== 'object') return null;
  const parsed = parseCatalogItemDataField(catalogItem);
  const raw = parsed.kitchenSupports ?? catalogItem.kitchenSupports ?? null;
  if (!raw || typeof raw !== 'object') return null;
  if (typeof window !== 'undefined' && window.__cldCatalogKitchenSupports?.normalizeKitchenSupports) {
    return window.__cldCatalogKitchenSupports.normalizeKitchenSupports(raw);
  }
  const map = raw.modelsByHeightMm || raw.modelsByHeight || {};
  const modelsByHeightMm = {};
  [100, 120, 150].forEach((h) => {
    const v = map[h] != null ? map[h] : map[String(h)];
    const id = v && typeof v === 'object' ? v.cabinetModelId ?? v.id : v;
    if (id != null && String(id).trim() !== '') modelsByHeightMm[h] = String(id).trim();
  });
  return { enabled: raw.enabled !== false, modelsByHeightMm };
}

function findCatalogItemInRoomStorage(catalogType, itemId) {
  const id = Number(itemId) || 0;
  const ct = String(catalogType || '').trim();
  if (!ct || id <= 0) return null;
  const key = ct.startsWith('catalog_') ? ct : `catalog_${ct}`;
  // Кухня: диск = то, что Save пишет в /catalog_items. LS часто отстаёт.
  const preferDisk =
    /^catalog_[45]\d+$/i.test(key) ||
    key === 'cabinet_model' ||
    key === 'catalog_cabinet_model';
  const fromDiskSync = () => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open(
        'GET',
        '/catalog_items/' + encodeURIComponent(key) + '.json?t=' + Date.now(),
        false
      );
      xhr.send(null);
      if (xhr.status < 200 || xhr.status >= 300) return null;
      const arr = JSON.parse(xhr.responseText);
      if (!Array.isArray(arr)) return null;
      return arr.find((x) => Number(x?.id) === id) || null;
    } catch (_) {
      return null;
    }
  };
  if (preferDisk) {
    const diskItem = fromDiskSync();
    if (diskItem) return diskItem;
  }
  try {
    const cache = window.__CLD_CATALOGS_DATA?.[ct]?.items?.[String(id)]
      || window.__CLD_CATALOGS_DATA?.[key]?.items?.[String(id)];
    if (cache) return cache;
  } catch (_) {}
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return preferDisk ? null : fromDiskSync();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return null;
    return arr.find((x) => Number(x?.id) === id) || null;
  } catch (_) {
    return null;
  }
}

function inferModuleDoorKindForGroup(ud, catalogItem) {
  const cid = Number(ud?.catalogItemId) || 0;
  const paired = ud?.pairedCatalogItemIds;
  if (paired && cid > 0) {
    if (Number(paired.single) === cid) return 'single';
    if (Number(paired.double) === cid) return 'double';
  }
  if (catalogItem) {
    return inferModuleDoorKindFromCategories({ catalogItem });
  }
  return null;
}

function buildFurnitureDataFromCatalogItem(item, catalogType) {
  const { plan, fromFallback } = resolveClodisJSONForCatalogGridItem(item);
  if (!plan || plan.length === 0) return null;
  const itemForGrid = fromFallback ? Object.assign({}, item) : item;
  if (fromFallback) writeClodisJSON(itemForGrid, plan);
  const vars = readClodisVariables(item) || readClodisVariables(parseCatalogItemDataField(item)) || {};
  const placementKind = resolvePlacementKindFromFurnitureData({
    placementKind: item?.placementKind,
    catalogItem: itemForGrid,
    data: item?.data,
  });
  const sectionSize = extractSectionSizeFromFurnitureData({
    catalogItem: itemForGrid,
  });
  if (placementKind === PLACEMENT_KIND.STANDALONE_FLOOR) {
    const explicitH = getCatalogDimensionMm(itemForGrid, 'height');
    if (explicitH) sectionSize.y = explicitH;
  }
  const out = {
    name: item?.name || 'двойную',
    catalogItem: itemForGrid,
    placementKind,
    width: getCatalogDimensionMm(itemForGrid, 'width') || sectionSize.x,
    height: getCatalogDimensionMm(itemForGrid, 'height') || sectionSize.y,
    depth: getCatalogDimensionMm(itemForGrid, 'depth') || sectionSize.z,
    sectionSize,
    catalogType,
    ...(fromFallback ? { catalogPlanFallback: true } : {}),
  };
  writeClodisJSON(out, plan);
  writeClodisVariables(out, vars);
  return out;
}

function getFurnitureCatalogType(ud) {
  const ct = ud?.catalogType;
  return ct != null && String(ct).trim() !== '' ? String(ct).trim() : null;
}

function resolveCatalogTypeFromFurnitureData(furnitureData) {
  const item = furnitureData?.catalogItem || null;
  const raw = item?.catalog_type ?? item?.catalogType ?? furnitureData?.catalogType;
  return raw != null && String(raw).trim() !== '' ? String(raw).trim() : null;
}

/**
 * Угловой модуль спец-зоны L/П: НМУ (kitchen_base_corner / 44) + ВМУ (kitchen_wall_corner / 54).
 * Обычный kitchen_base / kitchen_base_gola / wall_mid — никогда не угол (даже с «угловой» в имени).
 */
export function isLCornerCabinetModule(furnitureData) {
  const item = furnitureData?.catalogItem || furnitureData;
  // НШ1/НШ2 (50/51/42/43) — никогда не угол (sticky folder 54 / имя не считаем).
  const stampBand = String(furnitureData?.__kitchenWallBand || '')
    .trim()
    .toLowerCase();
  if (stampBand === 'mid' || stampBand === 'top') return false;
  const ctEarly = String(
    furnitureData?.catalogType ||
      furnitureData?.catalog_type ||
      item?.catalog_type ||
      item?.catalogType ||
      item?.element_type ||
      furnitureData?.catalogItem?.element_type ||
      ''
  )
    .trim()
    .toLowerCase()
    .replace(/^catalog_/, '');
  if (
    ctEarly === '50' ||
    ctEarly === '51' ||
    ctEarly === '42' ||
    ctEarly === '43'
  ) {
    return false;
  }
  // Сырой kitchen_* с карточки — не mapped wall_hung_low (иначе ВМУ теряет corner-gate).
  let rawPk = '';
  try {
    rawPk = String(getRawPlacementKindFromFurnitureData(furnitureData) || '')
      .trim()
      .toLowerCase();
  } catch (_) {
    rawPk = '';
  }
  const pk = String(
    rawPk ||
      furnitureData?.placementKind ||
      item?.placementKind ||
      furnitureData?.__placementKindProfileId ||
      ''
  )
    .trim()
    .toLowerCase();
  if (
    pk === 'kitchen_wall_mid' ||
    pk === 'kitchen_wall_top' ||
    pk === 'kitchen_base' ||
    pk === 'kitchen_base_gola' ||
    rawPk === 'kitchen_wall_mid' ||
    rawPk === 'kitchen_wall_top' ||
    rawPk === 'kitchen_base' ||
    rawPk === 'kitchen_base_gola'
  ) {
    return false;
  }
  if (
    pk === 'kitchen_base_corner' ||
    pk === 'kitchen_wall_corner' ||
    rawPk === 'kitchen_base_corner' ||
    rawPk === 'kitchen_wall_corner'
  ) {
    return true;
  }

  const ctRaw = resolveCatalogTypeFromFurnitureData(furnitureData);
  const ct = ctRaw != null ? String(ctRaw).replace(/^catalog_/i, '').trim() : '';
  if (ct === '44' || ct === '54') return true;
  const nested =
    item?.data?.catalog_type ||
    item?.data?.catalogType ||
    (typeof item?.data === 'string'
      ? (() => {
          try {
            return JSON.parse(item.data)?.catalog_type;
          } catch (_) {
            return null;
          }
        })()
      : null);
  const nestedCt =
    nested != null ? String(nested).replace(/^catalog_/i, '').trim() : '';
  if (nestedCt === '44' || nestedCt === '54') {
    return true;
  }
  // Mapped wall_hung_* не блокирует fallback по имени/папке 54.
  const mappedBase =
    pk === 'wall_hung_low' ||
    pk === 'wall_hung' ||
    pk === 'wall_hung_high' ||
    pk === 'floor_in_niche' ||
    pk === 'standalone_floor';
  if (pk && !mappedBase) return false;
  const name = String(item?.name || furnitureData?.name || '').toLowerCase();
  if (name.includes('угловой') || name.includes('угловые') || /вму/.test(name)) {
    return true;
  }
  try {
    const folder =
      (typeof window !== 'undefined' &&
        (window.__cldStep3SelectedFolderId ||
          window.step3SelectedFolderId ||
          window.__cldCurrentCatalogFolderKey)) ||
      null;
    const fk =
      folder != null ? String(folder).replace(/^catalog_/i, '').trim() : '';
    if (fk === '44' || fk === '54') {
      return true;
    }
  } catch (_) {}
  return false;
}

/**
 * Сторона угловой карточки: true = левый (угол у start), false = правый.
 * Канон: clodisVariables.corner_at_start / имя / resolveKitchenCornerAtStartForCatalogCard.
 */
function getCatalogItemCornerAtStart(itemOrFurniture) {
  const furnitureData =
    itemOrFurniture && itemOrFurniture.catalogItem
      ? itemOrFurniture
      : { catalogItem: itemOrFurniture };
  const item = furnitureData.catalogItem || itemOrFurniture || {};
  let data = item.data;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (_) {
      data = {};
    }
  }
  if (!data || typeof data !== 'object') data = {};
  const cv =
    (item.clodisVariables && typeof item.clodisVariables === 'object'
      ? item.clodisVariables
      : null) ||
    (data.clodisVariables && typeof data.clodisVariables === 'object'
      ? data.clodisVariables
      : null) ||
    (furnitureData.clodisVariables &&
    typeof furnitureData.clodisVariables === 'object'
      ? furnitureData.clodisVariables
      : {}) ||
    {};
  let cornerAtStart;
  if (typeof item.cornerAtStart === 'boolean') cornerAtStart = item.cornerAtStart;
  else if (typeof data.cornerAtStart === 'boolean') cornerAtStart = data.cornerAtStart;
  return resolveKitchenCornerAtStartForCatalogCard({
    name: item.name || data.name || furnitureData.name,
    catalog_type:
      item.catalog_type ||
      data.catalog_type ||
      furnitureData.catalogType ||
      'catalog_44',
    catalogType: item.catalogType || data.catalogType,
    cornerAtStart,
    clodisVariables: cv,
  });
}

/**
 * Сторона угловой спец-зоны: true=лев (start), false=прав (end).
 * П-спина: zi=0 > лев, zi=parts-1 > прав.
 */
function getSectionLCornerZoneAtStart(section, zoneIndex) {
  if (!section || zoneIndex == null) return null;
  if (!__isLShapeSpecialZone(section, zoneIndex)) return null;
  const zi = Number(zoneIndex);
  // Joint: ???? ???????? (?????/?????? ???? ???????), ?? geom atStart ?? ?????.
  try {
    const findJ =
      typeof window !== 'undefined'
        ? window.__cldFindKitchenJointForSectionZone
        : null;
    const handFn =
      typeof window !== 'undefined'
        ? window.__cldResolveJointCatalogHandAtStart
        : null;
    if (typeof findJ === 'function' && typeof handFn === 'function') {
      const j = findJ(section, zi);
      if (j) return handFn(j) === true;
    }
  } catch (_) {}
  try {
    if (isUShapeBackSection(section) || section.division?.uShape === true) {
      const parts = Math.floor(Number(section.division?.parts) || 0);
      if (zi === 0) return true;
      if (parts >= 2 && zi === parts - 1) return false;
    }
    const meta = getLShapeMeta(section);
    if (meta && typeof meta.cornerAtStart === 'boolean') return meta.cornerAtStart;
  } catch (_) {}
  return null;
}

/**
 * Цель постановки НМУ: primary + спец-зона.
 * П: левый модуль > zi=0, правый > parts-1; если курсор уже на спец — её.
 */
function resolveCornerCabinetPlaceTarget(baySec, zoneInfo, furnitureData) {
  if (!baySec?.lShape) return null;
  const hitZi =
    zoneInfo?.zoneIndex != null && Number.isFinite(Number(zoneInfo.zoneIndex))
      ? Number(zoneInfo.zoneIndex)
      : null;
  // CornerCell host (? ?.?. ????? ????? flip): ?????? ? ??? ??????, ?? ?????? ?? spine.
  try {
    const bayIndices = getLShapeSpecialZoneIndices(baySec);
    if (
      hitZi != null &&
      Array.isArray(bayIndices) &&
      bayIndices.some((z) => Number(z) === hitZi)
    ) {
      return { section: baySec, zoneIndex: hitZi };
    }
  } catch (_) {}
  let primary = baySec;
  try {
    if (isUShapeBackSection(baySec)) {
      primary = baySec;
    } else {
      const pairId = baySec.lShape.pairId;
      const other =
        pairId != null && Array.isArray(state.customSections)
          ? state.customSections.find((s) => s && String(s.id) === String(pairId))
          : null;
      if (other && isUShapeBackSection(other)) {
        primary = other;
      } else if (baySec.lShape?.uSpineId != null) {
        const spine = (state.customSections || []).find(
          (s) => s && String(s.id) === String(baySec.lShape.uSpineId)
        );
        if (spine) primary = spine;
      } else {
        const pair = getLShapePairForSection(baySec);
        if (pair?.primary) primary = pair.primary;
      }
    }
  } catch (_) {}
  if (!primary?.division) return null;
  try {
    if (isUShapeBackSection(primary) || primary.division.uShape === true) {
      primary.division.uShape = true;
      ensureLShapeDivisionSegments(primary.division);
    }
  } catch (_) {}
  const indices = getLShapeSpecialZoneIndices(primary);
  if (!indices.length) return null;
  if (hitZi != null && indices.includes(hitZi) && String(baySec.id) === String(primary.id)) {
    return { section: primary, zoneIndex: hitZi };
  }
  if (indices.length >= 2) {
    const modAt = getCatalogItemCornerAtStart(furnitureData);
    const zi = modAt ? Math.min(...indices) : Math.max(...indices);
    return { section: primary, zoneIndex: zi };
  }
  return { section: primary, zoneIndex: indices[0] };
}

/**
 * Сторона угла только если сейчас целимся в угловую спец-зону (ghost/pending).
 * Просмотр каталога «Уг»овыел без постановки — оба модуля (левый и правый).
 */
function getPendingLCornerZoneAtStart() {
  try {
    const zi = state._pendingZoneInfo;
    if (zi?.sectionId == null || zi.zoneIndex == null) return null;
    const sec = Array.isArray(state.customSections)
      ? state.customSections.find(
          (s) => s && String(s.id) === String(zi.sectionId)
        )
      : null;
    return getSectionLCornerZoneAtStart(sec, zi.zoneIndex);
  } catch (_) {
    return null;
  }
}

/**
 * Угол: карточка kitchen_base_corner + corner_at_start - спец-зона.
 * Без pending-зоны не режем сетку.
 */
function catalogItemMatchesActiveLCornerSide(item) {
  if (!isLCornerCabinetModule({ catalogItem: item })) return true;
  const zoneAt = getPendingLCornerZoneAtStart();
  if (zoneAt == null) return true;
  return getCatalogItemCornerAtStart(item) === zoneAt;
}

/**
 * Как Gola/ordinary: тип размещения карточки vs режим кухни.
 * Угловые (kitchen_base_corner) сюда не входят — у них свой side-gate.
 */
function catalogItemMatchesKitchenPlacement(item) {
  if (!item) return true;
  const pk = String(
    item.placementKind ||
      item.placement_kind ||
      (item.data && item.data.placementKind) ||
      (item.data && item.data.placement_kind) ||
      ''
  ).trim();
  if (pk !== 'kitchen_base' && pk !== 'kitchen_base_gola') return true;
  let mode = 'non_gola';
  try {
    const api =
      typeof window !== 'undefined' ? window.__cldKitchenManufacturing : null;
    mode =
      api && typeof api.getKitchenProjectState === 'function'
        ? api.getKitchenProjectState()?.frontMode || 'non_gola'
        : 'non_gola';
  } catch (_) {}
  if (mode === 'gola') return pk === 'kitchen_base_gola';
  return pk === 'kitchen_base';
}

/**
 * Кухня L: убрать шкафный зазор 50 мм у стены (CORNER_GAP_CM=5), чтобы
 * ячейка/столешка шли до стены. Корпус НМУ ?10 мм — отдельно в дереве.
 */
function __cldEnsureKitchenLFlushToWall(section) {
  try {
    if (typeof ensureKitchenLCornerFlush === 'function') {
      const ok = ensureKitchenLCornerFlush(section);
      if (ok) {
        __cldLogLCorner('kitchen L: cleared wardrobe 50mm gap > flush to wall', {
          sectionId: section?.id,
        });
      }
      return ok;
    }
  } catch (e) {
    console.warn('[KITCHEN-CORNER] flush to wall failed', e);
  }
  return false;
}

function __cldSectionOuterMaxU(section) {
  const wall = section?.wallName || section?.division?.wallName || 'back';
  const pos = section?.group?.position;
  const size = section?.size;
  if (!pos || !size) return null;
  if (wall === 'back') return Number(pos.x) + Number(size.x || 0);
  if (wall === 'front') return Number(pos.x);
  if (wall === 'left') return Number(pos.z);
  if (wall === 'right') return Number(pos.z) + Number(size.z || 0);
  return null;
}

function __cldTopPlankMaxU(section) {
  const g = section?.group;
  if (!g) return null;
  const wall = section.wallName || section.division?.wallName || 'back';
  const axis = getWallAxes(wall).u.axis;
  let maxU = -Infinity;
  g.traverse((obj) => {
    const ud = obj?.userData;
    if (!ud) return;
    if (ud.isEndCabinetTopPlank) return;
    // После §6.6 основной TopPlank может быть скрыт — сегменты тоже считаем.
    if (!ud.isTopPlank && !ud.isTopPlankSegment) return;
    try {
      const box = new THREE.Box3().setFromObject(obj);
      if (box.isEmpty()) return;
      const u = getAxisCoord(box.max, axis);
      if (Number.isFinite(u) && u > maxU) maxU = u;
    } catch (_) {}
  });
  return Number.isFinite(maxU) && maxU > -Infinity ? maxU : null;
}

/**
 * Край корпуса = тот же, что у призрака (sp.zEnd), и не дальше TopPlank
 * если планка обрывается на зазоре 5 см (§6.8.3).
 */
function __cldCornerCabTargetEndU(section) {
  const sp = getLShapeSpecialSnapBounds(section?.division);
  const outer = __cldSectionOuterMaxU(section);
  const plank = __cldTopPlankMaxU(section);
  let end = sp?.zEnd > 0 ? sp.zEnd : null;
  if (!(end > 0)) end = outer;
  if (!(end > 0)) end = plank;
  if (!(end > 0)) return null;
  // Только шкаф: планка чуть короче края (±80) > корпус как планка (зазор 5 см).
  let wardrobeGap = true;
  try {
    if (
      typeof window !== 'undefined' &&
      typeof window.__cldIsWardrobeCornerGapLogicActive === 'function'
    ) {
      wardrobeGap = !!window.__cldIsWardrobeCornerGapLogicActive();
    } else if (
      typeof isKitchenSectionLayoutActive === 'function' &&
      isKitchenSectionLayoutActive()
    ) {
      wardrobeGap = false;
    }
  } catch (_) {}
  if (wardrobeGap && plank > 0 && end - plank >= -1 && end - plank <= 80) {
    end = Math.min(end, plank);
  }
  return end;
}

/**
 * После place: корпус углового не дальше края спец (§6.8.3 CORNER_GAP 50).
 * Только шкаф. Кухня: no-op (ячейка до стены, корпус ?10 в дереве).
 */
function __cldClampCornerCabinetToSpecialGap(group, section, zoneIndex) {
  if (!group || !section) return false;
  try {
    if (
      typeof window !== 'undefined' &&
      typeof window.__cldIsWardrobeCornerGapLogicActive === 'function' &&
      !window.__cldIsWardrobeCornerGapLogicActive()
    ) {
      return false;
    }
  } catch (_) {}
  if (
    typeof isKitchenSectionLayoutActive === 'function' &&
    isKitchenSectionLayoutActive()
  ) {
    return false;
  }
  const wall = section.wallName || section.division?.wallName || 'back';
  const endU = __cldCornerCabTargetEndU(section);
  if (!(endU > 0)) return false;
  const axes = getWallAxes(wall);
  const sp = getLShapeSpecialSnapBounds(section.division);
  const zoneStart =
    sp && Number(sp.zoneIndex) === Number(zoneIndex) ? sp.zoneStart : null;
  group.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(group);
  if (box.isEmpty()) return false;
  let minU = getAxisCoord(box.min, axes.u.axis);
  let maxU = getAxisCoord(box.max, axes.u.axis);
  const overflow = maxU - endU;
  const wantW =
    zoneStart != null && Number.isFinite(zoneStart)
      ? Math.max(1, Math.round(endU - zoneStart))
      : Math.max(1, Math.round(maxU - minU - Math.max(0, overflow)));
  __cldLogLCorner('clamp corner vs plank/section', {
    endU,
    minU,
    maxU,
    overflow,
    wantW,
    zoneStart,
    outer: __cldSectionOuterMaxU(section),
    plank: __cldTopPlankMaxU(section),
    zoneIndex,
  });
  if (!(overflow > 0.5) && !(wantW > 0 && maxU - minU > wantW + 0.5)) {
    return false;
  }

  // Ширина больше слота > rebuild под endU?zoneStart (не только сдвиг в соседние ячейки).
  const curW = maxU - minU;
  if (wantW > 1 && curW > wantW + 0.5) {
    const curH =
      Number(group.userData?.__initialSectionSizeMm?.y) ||
      Math.round(box.max.y - box.min.y);
    const curZ =
      wall === 'left' || wall === 'right'
        ? Number(section.size?.x || 0)
        : Number(section.size?.z || section.size?.depth || 0);
    if (curH > 1 && curZ > 1) {
      const ok = rebuildFurnitureGroupForSectionResize(
        group,
        section,
        { x: wantW, y: curH, z: curZ },
        { force: true }
      );
      if (ok && zoneStart != null) {
        const snap = {
          pivotCoord:
            wall === 'left' || wall === 'front' ? endU : zoneStart,
          zoneIndex: Number(zoneIndex),
          moduleWidth: wantW,
        };
        const worldPos = getZonePivotWorldPosition(section, snap, wall);
        if (worldPos) {
          group.position.x = worldPos.x;
          group.position.z = worldPos.z;
        }
        group.updateMatrixWorld(true);
        if (group.userData.__initialSectionSizeMm) {
          group.userData.__initialSectionSizeMm.x = wantW;
        }
        if (group.userData.__targetSectionSizeMm) {
          group.userData.__targetSectionSizeMm.x = wantW;
        }
        __cldLogLCorner('clamp corner rebuild width', { wantW });
      }
    }
  }

  group.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(group);
  maxU = getAxisCoord(box.max, axes.u.axis);
  const still = maxU - endU;
  if (still > 0.5) {
    if (axes.u.axis === 'x') group.position.x -= still;
    else group.position.z -= still;
    group.updateMatrixWorld(true);
    __cldLogLCorner('clamp corner nudge from wall', { still });
  }
  return true;
}

/** Debug dump for L-corner place (console + window.__cldDumpLCornerPlace). */
function __cldLogLCorner(tag, extra) {
  try {
    const fd = state.pendingFurnitureData;
    const zi = state._pendingZoneInfo;
    const baySec =
      zi?.sectionId != null && Array.isArray(state.customSections)
        ? state.customSections.find((s) => s && s.id === zi.sectionId)
        : null;
    let pairPrimary = null;
    try {
      if (baySec?.lShape && typeof getLShapePairForSection === 'function') {
        pairPrimary = getLShapePairForSection(baySec)?.primary || null;
      }
    } catch (_) {}
    const specialSec = pairPrimary || baySec;
    const specialZi = specialSec ? __getLShapeSpecialZoneIndex(specialSec) : null;
    const onLSpecial =
      !!baySec && __isLShapeSpecialZone(baySec, zi?.zoneIndex);
    const div = baySec?.division;
    const segs = div?.segmentsLShapeBack || div?.segmentsLShape || null;
    let spBounds = null;
    try {
      if (specialSec?.division) {
        spBounds = getLShapeSpecialSnapBounds(specialSec.division);
      }
    } catch (_) {}
    const cacheSegs = Array.isArray(baySec?._layoutCache?.segments)
      ? baySec._layoutCache.segments.map((s) => ({
          zi: s?.zoneIndex,
          w: Math.round((Number(s?.endU) || 0) - (Number(s?.startU) || 0)),
          dk: s?.doorKind,
          sp: !!s?.isLSpecial,
        }))
      : null;
    let reason = extra?.reason || null;
    if (!reason) {
      if (!fd) reason = 'no-pending-furniture';
      else if (!isLCornerCabinetModule(fd)) reason = 'not-corner-module';
      else if (!baySec) reason = 'no-section-under-ghost';
      else if (specialZi == null) reason = 'specialZi-null (нет спец на этой секции/паре)';
      else if (!onLSpecial)
        reason = `zoneIndex=${zi?.zoneIndex} !== specialZi=${specialZi}`;
      else if (state._ghostZonePlacementAllowed === false)
        reason = 'ghostAllowed=false';
      else reason = 'ok-or-other';
    }
    const payload = {
      tag,
      reason,
      isCorner: isLCornerCabinetModule(fd),
      catalogType: resolveCatalogTypeFromFurnitureData(fd),
      pk: resolvePlacementKindFromFurnitureData(fd),
      zoneIndex: zi?.zoneIndex ?? null,
      doorKind: zi?.doorKind ?? null,
      sectionId: zi?.sectionId ?? null,
      sectionWall: baySec?.wallName || null,
      lShape: baySec?.lShape
        ? { type: baySec.lShape.type, role: baySec.lShape.role }
        : null,
      pairPrimaryId: pairPrimary?.id ?? null,
      specialZi,
      onLSpecial,
      spBounds: spBounds
        ? {
            zi: spBounds.zoneIndex,
            w: Math.round(spBounds.moduleWidth),
            u0: Math.round(spBounds.zoneStart),
            u1: Math.round(spBounds.zEnd),
            S: spBounds.S,
            D: spBounds.D,
          }
        : null,
      ghostAllowed: state._ghostZonePlacementAllowed,
      ghostPos: !!state.ghostPosition,
      ghostWall: state.ghostWall || null,
      ghostVisible: !!state.furnitureGhost?.visible,
      parts: div?.parts ?? null,
      layoutKind: div?.layoutKind ?? null,
      typeKey: div?.typeKey ?? null,
      S: div?.singleWidthMm ?? null,
      D: div?.cornerWidthMm ?? null,
      free: div?.freeSizeMm ?? null,
      sectionStart: div?.sectionStart ?? null,
      sectionEnd: div?.sectionEnd ?? null,
      partSize: div?.partSize ?? null,
      segs: Array.isArray(segs)
        ? segs.map((s) => ({
            type: s?.type,
            zi: s?.zoneIndex,
            u0: s?.startWorldU ?? s?.startWorldX,
            w: s?.widthMm,
          }))
        : null,
      cacheSegs,
      segsLen: {
        L: Array.isArray(div?.segmentsLShape) ? div.segmentsLShape.length : 0,
        Back: Array.isArray(div?.segmentsLShapeBack)
          ? div.segmentsLShapeBack.length
          : 0,
      },
      ...(extra || {}),
    };
    const isBlock = String(tag || '').includes('BLOCK') || payload.reason?.startsWith?.('zoneIndex');
    if (isBlock || String(tag || '').includes('gate')) {
      console.warn('[L-CORNER]', payload);
    } else {
      console.log('[L-CORNER]', payload);
    }
    return payload;
  } catch (e) {
    console.warn('[L-CORNER] log failed', e);
    return null;
  }
}

/** Каталожная высота модуля (мм), без ghost/sectionSize override. */
function getCatalogOwnStandaloneHeightMm(furnitureData) {
  if (!furnitureData) return 0;
  const profileFixedHeightMm = getProfileFixedHeightMmFromPlacementKind(
    getRawPlacementKindFromFurnitureData(furnitureData)
  );
  if (profileFixedHeightMm > 0) return Math.round(profileFixedHeightMm);
  const item = furnitureData.catalogItem || null;
  const fromItem = getCatalogDimensionMm(item, 'height');
  if (fromItem > 0) return Math.round(fromItem);
  const fromData = getCatalogDimensionMm(furnitureData, 'height');
  if (fromData > 0) return Math.round(fromData);
  // extractSectionSizePrefer catalog — игнорируем загрязнённый sectionSize от призрака
  const stripped = Object.assign({}, furnitureData, { sectionSize: null });
  const y = Number(extractSectionSizeFromFurnitureData(stripped)?.y);
  return Number.isFinite(y) && y > 0 ? Math.round(y) : 0;
}

/** Высота уже стоящих standalone в секции (любой каталог). */
function getExistingStandaloneHeightInSection(sectionData) {
  if (!sectionData) return 0;
  const all = collectStandaloneFurnitureInSection(sectionData, null);
  for (const f of all) {
    const h =
      Number(f.userData?.customHeightMm) ||
      Number(f.userData?.__initialSectionSizeMm?.y) ||
      0;
    if (Number.isFinite(h) && h > 0) return Math.round(h);
  }
  if (all.length > 0) {
    const floor = Number(sectionData.standaloneFloorHeightMm || 0);
    if (Number.isFinite(floor) && floor > 0) return Math.round(floor);
  }
  return 0;
}

/**
 * Trio у окна (tall L | under-window | tall R) — одна логическая высота комодов.
 * Секции разделены только для edit; высота ряда общая.
 */
function getWindowAlongGroupSections(sectionData) {
  if (!sectionData) return [];
  const gid = sectionData.windowAlongWallGroupId || sectionData.windowBridgeGroupId;
  if (!gid || !Array.isArray(state.customSections)) return [sectionData];
  const members = state.customSections.filter(
    (s) =>
      s &&
      (s.windowAlongWallGroupId === gid || s.windowBridgeGroupId === gid)
  );
  return members.length ? members : [sectionData];
}

function getExistingStandaloneHeightInWindowAlongGroup(sectionData) {
  if (getWindowRowRef(sectionData)) {
    const fromRow = getWindowRowStandaloneHeightMm(sectionData, null);
    if (fromRow > 0) return fromRow;
  }
  const members = getWindowAlongGroupSections(sectionData);
  for (const sec of members) {
    const h = getExistingStandaloneHeightInSection(sec);
    if (h > 0) return h;
  }
  for (const sec of members) {
    const floor = Number(sec?.standaloneFloorHeightMm || 0);
    if (Number.isFinite(floor) && floor > 0) return Math.round(floor);
  }
  return 0;
}

function getStandaloneHeightForCatalog(sectionData, catalogType) {
  if (!sectionData) return 0;
  if (catalogType) {
    const map = sectionData.standaloneHeightsByCatalogType;
    const h = map && map[String(catalogType)];
    if (Number.isFinite(Number(h)) && Number(h) > 0) return Math.round(Number(h));
  }
  const fallback = Number(sectionData.standaloneFloorHeightMm || 0);
  return Number.isFinite(fallback) && fallback > 0 ? Math.round(fallback) : 0;
}

/** Только map по каталогу — без fallback на общую высоту секции (для place). */
function getStandaloneHeightFromMapOnly(sectionData, catalogType) {
  if (!sectionData || !catalogType) return 0;
  const map = sectionData.standaloneHeightsByCatalogType;
  const h = map && map[String(catalogType)];
  return Number.isFinite(Number(h)) && Number(h) > 0 ? Math.round(Number(h)) : 0;
}

/** Map каталога по всему ряду у окна (следующий модуль видит высоту соседа из другой секции). */
function getStandaloneHeightFromMapOnlyInGroup(sectionData, catalogType) {
  if (!catalogType) return 0;
  if (getWindowRowRef(sectionData)) {
    const fromRow = getWindowRowStandaloneHeightMm(sectionData, catalogType);
    if (fromRow > 0) return fromRow;
  }
  for (const sec of getWindowAlongGroupSections(sectionData)) {
    const h = getStandaloneHeightFromMapOnly(sec, catalogType);
    if (h > 0) return h;
  }
  return 0;
}

/**
 * Высота уже стоящих в секции модулей другого каталога / общая floor-высота.
 * Используется для вопроса «своя или как в секции» при посадке.
 */
function getNeighborStandaloneHeightMm(sectionData, catalogType) {
  if (!sectionData) return 0;
  const map = sectionData.standaloneHeightsByCatalogType;
  if (map && typeof map === 'object') {
    for (const key of Object.keys(map)) {
      if (catalogType && String(key) === String(catalogType)) continue;
      const h = Number(map[key]);
      if (Number.isFinite(h) && h > 0) return Math.round(h);
    }
  }
  const all = collectStandaloneFurnitureInSection(sectionData, null);
  const others = all.filter((f) => {
    const ct = getFurnitureCatalogType(f.userData);
    return !catalogType || !ct || ct !== catalogType;
  });
  for (const f of others) {
    const h =
      Number(f.userData?.customHeightMm) ||
      Number(f.userData?.__initialSectionSizeMm?.y) ||
      0;
    if (Number.isFinite(h) && h > 0) return Math.round(h);
  }
  if (others.length > 0) {
    const floor = Number(sectionData.standaloneFloorHeightMm || 0);
    if (Number.isFinite(floor) && floor > 0) return Math.round(floor);
  }
  // Legacy: в секции уже есть standalone, map для нового каталога пуст, floor общий.
  if (all.length > 0 && catalogType && !getStandaloneHeightFromMapOnly(sectionData, catalogType)) {
    const allSameCatalog = all.every((f) => {
      const ct = getFurnitureCatalogType(f.userData);
      return !ct || ct === catalogType;
    });
    if (!allSameCatalog) {
      const floor = Number(sectionData.standaloneFloorHeightMm || 0);
      if (Number.isFinite(floor) && floor > 0) return Math.round(floor);
    }
  }
  return 0;
}

function setStandaloneHeightForCatalog(sectionData, catalogType, heightMm) {
  if (!sectionData || !(heightMm > 0)) return;
  sectionData.standaloneFloorHeightMm = Math.round(heightMm);
  if (!catalogType) return;
  if (!sectionData.standaloneHeightsByCatalogType) {
    sectionData.standaloneHeightsByCatalogType = {};
  }
  sectionData.standaloneHeightsByCatalogType[String(catalogType)] = Math.round(heightMm);
}

/** Высота комода — на весь ряд у окна (все секции группы). */
function setStandaloneHeightForWindowAlongGroup(sectionData, catalogType, heightMm) {
  if (!(heightMm > 0)) return;
  for (const sec of getWindowAlongGroupSections(sectionData)) {
    setStandaloneHeightForCatalog(sec, catalogType, heightMm);
  }
  try {
    bumpWindowRowSceneRev();
  } catch (_) {}
}

/**
 * Макс. высота корпуса у окна = подоконник (sill). Нельзя выше.
 * Фаза 2: sill из модели ряда.
 */
function clampStandaloneHeightToWindowSlot(sectionData, heightMm) {
  const h = Math.round(Number(heightMm) || 0);
  if (!(h > 0)) return 0;
  let slotMax = 0;
  if (getWindowRowRef(sectionData)) {
    slotMax = getWindowRowSillMm(sectionData);
  }
  if (!(slotMax > 0)) {
    slotMax =
      getWindowAlongGroupSillStandaloneHeightMm(sectionData) ||
      getWindowBridgeAlignedStandaloneHeightMm(sectionData);
  }
  if (slotMax > 0 && h > slotMax) return slotMax;
  return h;
}

function collectStandaloneFurnitureInSection(sectionData, catalogType) {
  const out = [];
  if (!state.scene || !sectionData?.id) return out;
  const sid = String(sectionData.id);
  const seen = new Set();
  state.scene.traverse((obj) => {
    if (!obj?.userData?.isFurniture || seen.has(obj)) return;
    if (String(obj.userData.sectionId) !== sid) return;
    if (obj.userData.__placementKind !== PLACEMENT_KIND.STANDALONE_FLOOR) return;
    if (catalogType) {
      const ct = getFurnitureCatalogType(obj.userData);
      if (ct !== catalogType) return;
    }
    seen.add(obj);
    out.push(obj);
  });
  return out;
}

/** Виды, у которых syncHeightInSection (тумба / оба навеса). */
function isHeightSyncEligiblePlacementKind(pk) {
  const s = String(pk || '').trim();
  return (
    s === PLACEMENT_KIND.STANDALONE_FLOOR ||
    s === PLACEMENT_KIND.WALL_HUNG_LOW ||
    s === PLACEMENT_KIND.WALL_HUNG_HIGH ||
    s === PLACEMENT_KIND.WALL_HUNG
  );
}

/** Высота правится в «Настройка модуля» (fixedHeight). */
function canEditCustomModuleHeight(pk) {
  const s = String(pk || '').trim();
  return s === PLACEMENT_KIND.STANDALONE_FLOOR || isWallHungPlacementKind(s);
}

/** Модули того же placementKind + каталога в секции — для попапа «этот / все». */
function collectModulesForHeightSync(sectionData, catalogType, sourcePlacementKind) {
  const out = [];
  if (!state.scene || !sectionData?.id) return out;
  if (!isHeightSyncEligiblePlacementKind(sourcePlacementKind)) return out;
  const sid = String(sectionData.id);
  const srcPk = String(sourcePlacementKind || '').trim();
  const seen = new Set();
  state.scene.traverse((obj) => {
    if (!obj?.userData?.isFurniture || seen.has(obj)) return;
    if (String(obj.userData.sectionId) !== sid) return;
    if (String(obj.userData.__placementKind || '').trim() !== srcPk) return;
    if (catalogType) {
      const ct = getFurnitureCatalogType(obj.userData);
      if (ct && ct !== catalogType) return;
    }
    seen.add(obj);
    out.push(obj);
  });
  return out;
}

/** Одн/двустворчатые из одного каталога: без catalogType на старых модулях — тоже в ряд. */
function collectStandaloneForHeightSync(sectionData, catalogType) {
  return collectModulesForHeightSync(
    sectionData,
    catalogType,
    PLACEMENT_KIND.STANDALONE_FLOOR
  );
}

function inferStandaloneCatalogTypeForSection(sectionData) {
  const all = collectStandaloneFurnitureInSection(sectionData, null);
  for (const f of all) {
    const ct = getFurnitureCatalogType(f.userData);
    if (ct) return ct;
  }
  try {
    if (typeof window !== 'undefined' && typeof window.getRoomStepsConfig === 'function') {
      const cfg = window.getRoomStepsConfig();
      const step3 = cfg?.steps?.find((s) => s.stepId === 3);
      const folderId = step3?.selectedFolderId ?? step3?.catalogFolderId ?? step3?.folderId;
      if (folderId != null && String(folderId).trim() !== '') {
        return String(folderId).trim().replace(/^catalog_/, '');
      }
    }
  } catch (_) {}
  return null;
}

function sectionHasOnlyStandaloneFloor(sectionData) {
  let hasAny = false;
  let hasNonStandalone = false;
  if (!state.scene || !sectionData?.id) return true;
  const sid = String(sectionData.id);
  state.scene.traverse((obj) => {
    if (!obj?.userData?.isFurniture) return;
    if (String(obj.userData.sectionId) !== sid) return;
    hasAny = true;
    if (obj.userData.__placementKind !== PLACEMENT_KIND.STANDALONE_FLOOR) {
      hasNonStandalone = true;
    }
  });
  return !hasAny || !hasNonStandalone;
}

function sectionHasNicheFurniture(sectionData) {
  if (!state.scene || !sectionData?.id) return false;
  const sid = String(sectionData.id);
  let found = false;
  state.scene.traverse((obj) => {
    if (found || !obj?.userData?.isFurniture) return;
    if (String(obj.userData.sectionId) !== sid) return;
    if (obj.userData.__placementKind === PLACEMENT_KIND.STANDALONE_FLOOR) return;
    found = true;
  });
  return found;
}

function rememberSectionVerticalOffsetsBeforeStandaloneShrink(sectionData) {
  if (!sectionData || sectionData.__preStandaloneVerticalOffsets) return;
  const off = sectionData.offsets || {};
  sectionData.__preStandaloneVerticalOffsets = {
    bottomMm: Math.max(0, Number(off.bottomMm) || 0),
    topMm: Math.max(0, Number(off.topMm) || 0),
  };
}

/** Секция с зафиксированной высотой (под окном) / legacy underWindowBay — не ужимать/не поднимать до потолка. */
function isUnderWindowBaySection(sectionData) {
  if (!sectionData) return false;
  if (Number(sectionData.fixedHeightMm) > 0) return true;
  return !!(
    sectionData.underWindowBay || sectionData.windowBridgeRole === 'under-window'
  );
}

/**
 * Макс. / дефолт высоты комода у окна (= подоконник).
 * Фаза 2: из модели ряда.
 */
function getWindowAlongGroupSillStandaloneHeightMm(sectionData) {
  if (!sectionData) return 0;
  if (getWindowRowRef(sectionData)) {
    const sill = getWindowRowSillMm(sectionData);
    if (sill > 0) return sill;
  }
  const direct = getWindowBridgeAlignedStandaloneHeightMm(sectionData);
  if (direct > 0) return direct;
  for (const sec of getWindowAlongGroupSections(sectionData)) {
    if (sec === sectionData) continue;
    const h = getWindowBridgeAlignedStandaloneHeightMm(sec);
    if (h > 0) return h;
  }
  return 0;
}

function isWindowAlongWallSection(sectionData) {
  if (!sectionData) return false;
  return !!(
    sectionData.windowAlongWallGroupId ||
    sectionData.windowBridgeGroupId ||
    sectionData.windowAlongWallRole ||
    sectionData.windowBridgeRole ||
    sectionData.underWindowBay ||
    Number(sectionData.fixedHeightMm) > 0 ||
    sectionData.windowLowSlot
  );
}

/**
 * Высота комода в зоне окна: до подоконника (sill / fixedHeight секции).
 * Фаза 2: sill из модели; fallback на флаги секции.
 */
function getWindowBridgeAlignedStandaloneHeightMm(sectionData) {
  if (getWindowRowRef(sectionData)) {
    const sill = getWindowRowSillMm(sectionData);
    if (sill > 0) return sill;
  }
  const slotSill = Number(sectionData?.windowLowSlot?.sillMm);
  if (Number.isFinite(slotSill) && slotSill > 50) {
    return Math.round(slotSill);
  }
  if (!isUnderWindowBaySection(sectionData)) return 0;
  const locked = Number(sectionData.fixedHeightMm) || Number(sectionData.sillMm) || 0;
  if (locked > 50) return Math.round(locked);
  const raw = Number(sectionData.size?.y) || 0;
  return raw > 50 ? Math.round(raw) : 0;
}

/** Min/max высоты тумбы (мм) из профиля / шага 4 — без смены общей логики секций. */
function getStandaloneEditHeightLimitsMm(placementKindId) {
  let minCm = 30;
  let maxCm = 120;
  try {
    const cfg =
      typeof window !== 'undefined' && typeof window.getRoomStepsConfig === 'function'
        ? window.getRoomStepsConfig()
        : null;
    const api = typeof window !== 'undefined' ? window.__cldPlacementKindProfiles : null;
    const pk =
      String(placementKindId || '').trim() || PLACEMENT_KIND.STANDALONE_FLOOR;
    const profile =
      api && typeof api.resolvePlacementKindProfile === 'function'
        ? api.resolvePlacementKindProfile(pk, cfg)
        : null;
    const step4 = Array.isArray(cfg?.steps)
      ? cfg.steps.find((s) => s && s.stepId === 4)
      : null;
    const s4fb = {
      heightMinCm:
        typeof step4?.zoneEditHeightMinCm === 'number' ? step4.zoneEditHeightMinCm : null,
      heightMaxCm:
        typeof step4?.zoneEditHeightMaxCm === 'number' ? step4.zoneEditHeightMaxCm : null,
    };
    if (api && typeof api.applyEditPopupOverridesFromProfile === 'function' && profile) {
      const merged = api.applyEditPopupOverridesFromProfile(
        { heightMinCm: minCm, heightMaxCm: maxCm },
        profile,
        s4fb
      );
      if (typeof merged?.heightMinCm === 'number' && merged.heightMinCm > 0) {
        minCm = merged.heightMinCm;
      }
      if (typeof merged?.heightMaxCm === 'number' && merged.heightMaxCm > 0) {
        maxCm = merged.heightMaxCm;
      }
    } else {
      if (s4fb.heightMinCm != null && s4fb.heightMinCm > 0) minCm = s4fb.heightMinCm;
      if (s4fb.heightMaxCm != null && s4fb.heightMaxCm > 0) maxCm = s4fb.heightMaxCm;
    }
  } catch (_) {}
  if (!(maxCm > minCm)) maxCm = minCm + 1;
  return { minMm: Math.round(minCm * 10), maxMm: Math.round(maxCm * 10) };
}

function sectionLooksShrunkForStandalone(sectionData) {
  if (!sectionData || !state.room) return false;
  // Иначе ensureFullHeight > updateSectionSize > rebuildAllTransitions > снова ensure > зависание.
  if (isUnderWindowBaySection(sectionData)) return false;
  const m = getSlotVerticalMetrics(sectionData);
  if (!(m.innerHeightMm > 0)) return false;
  const roomH = Number(state.room.height) || 0;
  if (!(roomH > 0)) return false;
  const expectedInner = Math.max(
    0,
    roomH - (m.topPlankMm || 0) - (m.bottomPlankMm || 0)
  );
  return expectedInner > 0 && m.innerHeightMm < expectedInner - 350;
}

function sectionNeedsRestoreForNicheFurniture(sectionData) {
  if (!sectionData) return false;
  if (isUnderWindowBaySection(sectionData)) return false;
  if (sectionData.__preStandaloneVerticalOffsets) return true;
  if (sectionData.__standaloneSectionShrunk === true) return true;
  if (Number(sectionData.standaloneFloorHeightMm || 0) > 0 && sectionLooksShrunkForStandalone(sectionData)) {
    return true;
  }
  return sectionLooksShrunkForStandalone(sectionData);
}

/** Вернуть полную высоту ниши, если секцию ужимали под комод/тумбу. */
function restoreSectionVerticalSizeForMixedWall(sectionData) {
  if (!sectionData || !state.room) return false;
  if (isUnderWindowBaySection(sectionData)) return false;
  if (!sectionNeedsRestoreForNicheFurniture(sectionData)) return false;

  const saved = sectionData.__preStandaloneVerticalOffsets;
  const off = sectionData.offsets || {};
  const bottomMm = saved
    ? saved.bottomMm
    : Math.max(0, Number(off.bottomMm) || DEFAULT_BOTTOM_PLANK_MM);
  const topMm = saved ? saved.topMm : 0;

  const wallName = sectionData.wallName || 'back';
  const offsetsCm = {
    left: (Number(off.leftMm) || 0) / 10,
    right: (Number(off.rightMm) || 0) / 10,
    front: (Number(off.frontMm) || 0) / 10,
    back: (Number(off.backMm) || 0) / 10,
    bottom: bottomMm / 10,
    top: topMm / 10,
  };
  const depthCm =
    wallName === 'left' || wallName === 'right'
      ? (Number(sectionData.size?.x) || 600) / 10
      : (Number(sectionData.size?.z) || 600) / 10;

  if (typeof window !== 'undefined' && typeof window.updateSectionSize === 'function') {
    window.updateSectionSize(sectionData, offsetsCm, depthCm);
    try {
      refreshSectionVerticalLayout(sectionData);
    } catch (_) {}
    delete sectionData.__preStandaloneVerticalOffsets;
    sectionData.__standaloneSectionShrunk = false;
    return true;
  }
  return false;
}

/** Шкаф + тумба на одной стене: ниша снова на всю высоту комнаты. */
export function ensureSectionFullHeightForMixedWall(sectionData) {
  if (!sectionData) return false;
  if (isUnderWindowBaySection(sectionData)) return false;
  const hasStandalone = collectStandaloneFurnitureInSection(sectionData, null).length > 0;
  if (!hasStandalone) return false;
  const hasNiche = sectionHasNicheFurniture(sectionData);
  if (!hasNiche && !sectionNeedsRestoreForNicheFurniture(sectionData)) return false;
  return restoreSectionVerticalSizeForMixedWall(sectionData);
}

function sectionOuterHeightFromFurnitureMm(furnitureHeightMm, sectionData) {
  const bottomPlank = (() => {
    const b = Number(sectionData?.bottomPlankHeightMm);
    return Number.isFinite(b) && b >= 0 ? b : DEFAULT_BOTTOM_PLANK_MM;
  })();
  return Math.round(furnitureHeightMm + bottomPlank + TOP_PLANK_HEIGHT_MM);
}

function shouldResizeSectionForStandaloneCatalog(sectionData, catalogType) {
  if (!sectionData || !catalogType) return false;
  if (isUnderWindowBaySection(sectionData)) return false;
  if (Number(sectionData?.division?.parts || 0) > 1) return false;
  if (sectionHasNicheFurniture(sectionData)) return false;
  if (!sectionHasOnlyStandaloneFloor(sectionData)) return false;
  // Не сжимать стену, если ниша почти на всю высоту комнаты — иначе шкаф получит s:y?600
  // и формулы s:y?corpus_antresol_mm (1950) дадут 0 в ClodisBuilder.
  if (state.room && Number(state.room.height) > 1400) return false;
  const all = collectStandaloneFurnitureInSection(sectionData, null);
  for (const f of all) {
    const ct = getFurnitureCatalogType(f.userData);
    if (ct && ct !== catalogType) return false;
  }
  return true;
}

function resizeSectionForStandaloneHeight(sectionData, furnitureHeightMm, catalogType) {
  if (!sectionData || !state.room || !(furnitureHeightMm > 0)) return false;
  if (catalogType) {
    if (!shouldResizeSectionForStandaloneCatalog(sectionData, catalogType)) return false;
  } else if (!sectionHasOnlyStandaloneFloor(sectionData)) {
    return false;
  }

  const wallName = sectionData.wallName || 'back';
  const outerY = sectionOuterHeightFromFurnitureMm(furnitureHeightMm, sectionData);
  const roomH = state.room.height;
  const bottomMm = Number(sectionData.offsets?.bottomMm) || 0;
  const topMm = Math.max(0, Math.round(roomH - bottomMm - outerY));

  rememberSectionVerticalOffsetsBeforeStandaloneShrink(sectionData);
  sectionData.__standaloneSectionShrunk = true;

  const offsetsCm = {
    left: (Number(sectionData.offsets?.leftMm) || 0) / 10,
    right: (Number(sectionData.offsets?.rightMm) || 0) / 10,
    front: (Number(sectionData.offsets?.frontMm) || 0) / 10,
    back: (Number(sectionData.offsets?.backMm) || 0) / 10,
    bottom: bottomMm / 10,
    top: topMm / 10,
  };
  const depthCm =
    wallName === 'left' || wallName === 'right'
      ? (Number(sectionData.size?.x) || 600) / 10
      : (Number(sectionData.size?.z) || 600) / 10;

  if (typeof window !== 'undefined' && typeof window.updateSectionSize === 'function') {
    window.updateSectionSize(sectionData, offsetsCm, depthCm);
    return true;
  }
  return false;
}

function getProfileFixedHeightMmFromPlacementKind(placementKindId) {
  const pk = String(placementKindId || '').trim();
  if (!pk) return 0;
  try {
    const cfg =
      typeof window !== 'undefined' && typeof window.getRoomStepsConfig === 'function'
        ? window.getRoomStepsConfig()
        : null;
    const api = typeof window !== 'undefined' ? window.__cldPlacementKindProfiles : null;
    if (api && typeof api.getProfileFixedHeightMm === 'function') {
      return Number(api.getProfileFixedHeightMm(pk, cfg)) || 0;
    }
  } catch (_) {}
  return 0;
}

function resolveStandaloneHeightMm(grp, sectionData) {
  const ud = grp?.userData || {};
  const customHeightMm = Number(ud.customHeightMm || 0) || 0;
  const initialY = Number(ud.__initialSectionSizeMm?.y || 0) || 0;
  const catalogType = getFurnitureCatalogType(ud);
  if (customHeightMm > 0) return customHeightMm;
  // Фаза 2: у окна — высота ряда из модели.
  if (getWindowRowRef(sectionData)) {
    const rowH = getWindowRowStandaloneHeightMm(sectionData, catalogType);
    if (rowH > 0) return rowH;
    const sill = getWindowRowSillMm(sectionData);
    if (sill > 0) return sill;
  }
  const sectionStoredH = getStandaloneHeightForCatalog(sectionData, catalogType);
  if (sectionStoredH > 0) return sectionStoredH;
  const profileId = String(ud.__placementKindProfileId || ud.placementKind || '').trim();
  const profileFixedH = getProfileFixedHeightMmFromPlacementKind(profileId);
  if (profileFixedH > 0) return profileFixedH;
  if (initialY > 0) return initialY;
  return 0;
}

function rebuildStandaloneModulesInSection(sectionData, modules, heightMm) {
  if (!sectionData || !modules?.length || !(heightMm > 0)) return;
  let layout = sectionData._layoutCache || null;
  if (!layout && typeof window.__clodisComputeSectionLayout === 'function') {
    try {
      layout = window.__clodisComputeSectionLayout(sectionData);
    } catch (_) {}
  }
  for (const grp of modules) {
    grp.userData = grp.userData || {};
    grp.userData.customHeightMm = Math.round(heightMm);
    if (!(readUserDataClodisData(grp.userData) || readUserDataClodisRoots(grp.userData))) continue;
    const targetSize = zoneWidthMmForFurnitureGroup(grp, sectionData, layout);
    if (targetSize.x < 1 || targetSize.y < 1 || targetSize.z < 1) continue;
    try {
      rebuildFurnitureGroupForSectionResize(grp, sectionData, targetSize);
      snapFurnitureGroupPlacementY(grp, sectionData);
    } catch (e) {
      console.warn('[STANDALONE-HEIGHT] rebuild failed', grp.uuid, e);
    }
  }
}

export function countStandaloneHeightSyncTargets(sectionData, sourceGroup) {
  const sourcePk = String(sourceGroup?.userData?.__placementKind || '').trim();
  const catKey =
    getFurnitureCatalogType(sourceGroup?.userData) ||
    (sourcePk === PLACEMENT_KIND.STANDALONE_FLOOR
      ? inferStandaloneCatalogTypeForSection(sectionData)
      : null) ||
    null;
  const modules = collectModulesForHeightSync(sectionData, catKey, sourcePk);
  const others = modules.filter((g) => g !== sourceGroup).length;
  return {
    catalogType: catKey,
    total: modules.length,
    others,
    placementKind: sourcePk || null,
  };
}

export function syncStandaloneCategoryHeightInSection(
  sectionData,
  catalogType,
  heightMm,
  sourcePlacementKind = null
) {
  if (!sectionData || !(heightMm > 0)) return false;

  let sourcePk = String(sourcePlacementKind || '').trim();
  if (!isHeightSyncEligiblePlacementKind(sourcePk)) {
    // Fallback: кто реально стоит в секции.
    const stand = collectModulesForHeightSync(
      sectionData,
      catalogType,
      PLACEMENT_KIND.STANDALONE_FLOOR
    );
    const hangLow = collectModulesForHeightSync(
      sectionData,
      catalogType,
      PLACEMENT_KIND.WALL_HUNG_LOW
    );
    const hangHigh = collectModulesForHeightSync(
      sectionData,
      catalogType,
      PLACEMENT_KIND.WALL_HUNG_HIGH
    );
    sourcePk = stand.length
      ? PLACEMENT_KIND.STANDALONE_FLOOR
      : hangLow.length
        ? PLACEMENT_KIND.WALL_HUNG_LOW
        : hangHigh.length
          ? PLACEMENT_KIND.WALL_HUNG_HIGH
          : PLACEMENT_KIND.STANDALONE_FLOOR;
  }

  const catKey =
    (catalogType && String(catalogType).trim()) ||
    (sourcePk === PLACEMENT_KIND.STANDALONE_FLOOR
      ? inferStandaloneCatalogTypeForSection(sectionData)
      : null) ||
    null;

  if (sourcePk === PLACEMENT_KIND.STANDALONE_FLOOR) {
    setStandaloneHeightForWindowAlongGroup(sectionData, catKey, heightMm);
  }

  const groupSecs = getWindowAlongGroupSections(sectionData);
  let any = false;
  for (const sec of groupSecs) {
    const siblings = collectModulesForHeightSync(sec, catKey, sourcePk);
    for (const grp of siblings) {
      grp.userData = grp.userData || {};
      grp.userData.customHeightMm = Math.round(heightMm);
      if (catKey && !getFurnitureCatalogType(grp.userData)) {
        grp.userData.catalogType = catKey;
      }
    }
    if (siblings.length) {
      rebuildStandaloneModulesInSection(sec, siblings, heightMm);
      any = true;
    }
    if (sourcePk === PLACEMENT_KIND.STANDALONE_FLOOR) {
      const resized = resizeSectionForStandaloneHeight(sec, heightMm, catKey);
      if (!resized && typeof window.__clodisUpdateFurnitureInSection === 'function') {
        window.__clodisUpdateFurnitureInSection(sec);
      }
    } else if (typeof window.__clodisUpdateFurnitureInSection === 'function') {
      try {
        window.__clodisUpdateFurnitureInSection(sec);
      } catch (_) {}
    }
    if (typeof window.__clodisScheduleTrimRebuildAfterFurnitureGeometry === 'function') {
      window.__clodisScheduleTrimRebuildAfterFurnitureGeometry(sec);
    }
    try {
      if (typeof window.refreshWindowBridgeDimensionLabels === 'function') {
        window.refreshWindowBridgeDimensionLabels(sec);
      } else if (typeof window.refreshSectionDimensionLabelsForSection === 'function') {
        window.refreshSectionDimensionLabelsForSection(sec.id);
      }
    } catch (_) {}
  }

  try {
    if (typeof window.scheduleRebuildAllDimensionLines === 'function') {
      window.scheduleRebuildAllDimensionLines();
    }
  } catch (_) {}
  try {
    if (typeof window.refreshAllHingeRoleMarkersInRoom === 'function') {
      window.refreshAllHingeRoleMarkersInRoom();
    }
  } catch (_) {}
  try {
    recalcFurniturePricingAfterGeometryChange();
  } catch (_) {}

  console.log('[STANDALONE-HEIGHT] synced', {
    sectionId: sectionData.id,
    catalogType: catKey,
    heightMm,
    placementKind: sourcePk,
    groupSections: groupSecs.map((s) => s.id),
    anyRebuilt: any,
  });
  return true;
}

function zoneWidthMmForFurnitureGroup(grp, sectionData, layout) {
  const division = sectionData?.division;
  const wallName = sectionData.wallName || 'back';
  const size = sectionData.size;
  const sectionWidth = wallName === 'front' || wallName === 'back' ? size.x : size.z;
  const depthForWall = wallName === 'left' || wallName === 'right' ? size.x : size.z;
  let layoutUse = layout;
  try {
    const pk =
      String(grp?.userData?.__placementKindProfileId || grp?.userData?.placementKind || '').trim();
    const prod = String(grp?.userData?.productKind || '').trim();
    if (isKitchenStraightBaseBandSection(sectionData)) {
      if (
        isKitchenWallTopGroup(grp) ||
        isKitchenWallTopPlacementKind(pk) ||
        prod === 'kitchen_wall_top'
      ) {
        const topLayout = buildKitchenBandCellLayoutForSection(sectionData, 'top');
        if (topLayout) layoutUse = topLayout;
      } else if (
        isKitchenWallMidGroup(grp) ||
        isKitchenWallMidPlacementKind(pk) ||
        prod === 'kitchen_wall_mid'
      ) {
        const midLayout = buildKitchenBandCellLayoutForSection(sectionData, 'mid');
        if (midLayout) layoutUse = midLayout;
      }
    }
  } catch (_) {}
  const segs = layoutUse?.segments || [];
  let seg = segs.find((s) => s.type === 'module' && s.furnitureUuid === grp.uuid);
  if (!seg) {
    seg = segs.find(
      (s) =>
        s.type === 'module' &&
        Array.isArray(s.furnitureUuids) &&
        s.furnitureUuids.indexOf(grp.uuid) >= 0
    );
  }
  if (!seg) {
    const zi = typeof grp.userData?.zoneIndex === 'number' ? grp.userData.zoneIndex : null;
    if (zi != null) {
      seg = segs.find((s) => s.type === 'module' && s.zoneIndex === zi);
    }
  }
  let zoneW = 0;
  // Спец L (В§6.8.3): ширина только из snap S+D>sectionEnd, не из stale seg / partSize.
  const zi =
    typeof grp.userData?.zoneIndex === 'number' ? grp.userData.zoneIndex : null;
  const specialZi =
    typeof getLShapeSpecialZoneIndex === 'function'
      ? getLShapeSpecialZoneIndex(sectionData)
      : null;
  if (
    specialZi != null &&
    zi != null &&
    Number(zi) === Number(specialZi) &&
    division
  ) {
    const sp = getLShapeSpecialSnapBounds(division);
    if (sp?.moduleWidth > 0) zoneW = sp.moduleWidth;
    // Сохранить ширину после place (cap к планке/sectionEnd), не раздувать при rebuild шага 4.
    const placedW = Number(grp.userData?.__initialSectionSizeMm?.x);
    if (placedW > 1 && zoneW > placedW + 0.5) {
      zoneW = placedW;
    }
  }
  if (!(zoneW > 0) && seg) {
    zoneW = seg.endU - seg.startU;
  }
  if (!(zoneW > 0)) {
    const part = Number(division?.partSize || 0);
    const initialX = Number(grp.userData?.__initialSectionSizeMm?.x || 0);
    // Никогда не прыгать на всю ширину секции, если известна зона/partSize/ширина посадки.
    zoneW = part > 1 ? part : initialX > 1 ? initialX : sectionWidth;
  }
  // Карандаш модуля: своя W (customWidthMm), не вся ячейка / соседи по зоне.
  const ownW = Math.round(Number(grp.userData?.customWidthMm) || 0);
  if (ownW > 50) zoneW = ownW;
  if (typeof window !== 'undefined' && window.__CLD_DEBUG_PLACE === true) {
    console.warn('[ZONEW]', {
      uuid: grp.uuid,
      zoneW: Math.round(zoneW),
      hasSeg: !!seg,
      zoneIndex: grp.userData?.zoneIndex,
      partSizeMm: Math.round(Number(division?.partSize) || 0),
      sectionWidthMm: Math.round(sectionWidth),
      initialXmm: Math.round(Number(grp.userData?.__initialSectionSizeMm?.x) || 0),
      isEndCab: !!grp.userData?.isEndCabinet,
    });
  }
  const customDepthMm = Number(grp.userData?.customDepthMm || 0) || 0;
  const targetDepthMm =
    customDepthMm > 0 ? Math.min(customDepthMm, depthForWall) : depthForWall;
  const placementKind = grp.userData?.__placementKind || PLACEMENT_KIND.FLOOR_IN_NICHE;
  const profileId = String(
    grp.userData?.__placementKindProfileId || grp.userData?.placementKind || ''
  ).trim();
  const productKind = String(grp.userData?.productKind || '').trim();

  // Пенал: высота = датамы (цоколь+low+mid+high), НЕ слот ниши до потолка.
  // Иначе rebuild вкладки «Пеналы» раздувает корпус на всю высоту секции.
  if (
    isKitchenTallPlacementKind(profileId) ||
    productKind === 'kitchen_tall' ||
    !!(grp.userData?.__kitchenTall && typeof grp.userData.__kitchenTall === 'object')
  ) {
    let tallH = 0;
    try {
      const km =
        typeof window !== 'undefined' ? window.__cldKitchenManufacturing : null;
      const kt = grp.userData?.__kitchenTall || {};
      if (km && typeof km.resolveKitchenTallPlaceSizing === 'function') {
        const sizing = km.resolveKitchenTallPlaceSizing({
          facadeType: kt.facadeType || 'doors_3',
          lowerHalfOfNmMm: kt.lowerHalfOfNmMm,
          ovenNicheMm: kt.ovenNicheMm,
          microwaveNicheMm: kt.microwaveNicheMm,
          carcassDepthMm:
            Number(grp.userData?.__kitchenCarcassDepthMm) ||
            Number(grp.userData?.customDepthMm) ||
            undefined,
        });
        if (sizing && sizing.ok && Number(sizing.totalHeightMm) > 0) {
          tallH = Math.round(Number(sizing.totalHeightMm));
        }
      }
    } catch (_) {}
    if (!(tallH > 0)) {
      tallH =
        Math.round(Number(grp.userData?.customHeightMm) || 0) ||
        Math.round(Number(grp.userData?.__initialSectionSizeMm?.y) || 0) ||
        2260;
    }
    const tallD =
      Math.round(Number(grp.userData?.__kitchenCarcassDepthMm) || 0) ||
      Math.round(Number(grp.userData?.customDepthMm) || 0) ||
      560;
    return {
      x: zoneW,
      y: tallH,
      z: Math.min(tallD, depthForWall > 0 ? depthForWall : tallD),
    };
  }

  // НШ1/НШ2: формула ритма — не высота/глубина ниши секции.
  if (
    isKitchenWallMidPlacementKind(profileId) ||
    productKind === 'kitchen_wall_mid' ||
    isKitchenWallTopPlacementKind(profileId) ||
    productKind === 'kitchen_wall_top' ||
    isKitchenWallTopGroup(grp) ||
    isKitchenWallMidGroup(grp)
  ) {
    const isTop =
      isKitchenWallTopGroup(grp) ||
      isKitchenWallTopPlacementKind(profileId) ||
      productKind === 'kitchen_wall_top';
    let wallH = Math.round(Number(grp.userData?.customHeightMm) || 0) || (isTop ? 360 : 720);
    let wallD =
      Math.round(Number(grp.userData?.__kitchenCarcassDepthMm) || 0) ||
      Math.round(Number(grp.userData?.customDepthMm) || 0) ||
      350;
    try {
      const km =
        typeof window !== 'undefined' ? window.__cldKitchenManufacturing : null;
      const fn = isTop
        ? km && km.resolveKitchenWallTopPlaceSizing
        : km && km.resolveKitchenWallMidPlaceSizing;
      if (typeof fn === 'function') {
        const sizing = fn.call(km, { sectionDepthMm: wallD });
        if (sizing && sizing.ok) {
          if (Number(sizing.carcassHeightMm) > 0) wallH = Math.round(Number(sizing.carcassHeightMm));
          if (Number(sizing.carcassDepthMm) > 0) wallD = Math.round(Number(sizing.carcassDepthMm));
        }
      }
    } catch (_) {}
    if (isTop) {
      try {
        const depthRes =
          typeof window.__cldKitchenBaseEngine?.resolveKitchenWallTopDepthMm === 'function'
            ? window.__cldKitchenBaseEngine.resolveKitchenWallTopDepthMm(grp, sectionData)
            : null;
        if (depthRes?.ok && Number(depthRes.carcassDepthMm) > 0) {
          wallD = Math.round(Number(depthRes.carcassDepthMm));
        }
      } catch (_) {}
    }
    return {
      x: zoneW,
      y: wallH,
      z: Math.min(wallD, depthForWall > 0 ? depthForWall : wallD),
    };
  }

  if (placementKind === PLACEMENT_KIND.STANDALONE_FLOOR) {
    const h = resolveStandaloneHeightMm(grp, sectionData);
    if (h > 0) return { x: zoneW, y: h, z: targetDepthMm };
  }
  const slotMetrics = getSlotVerticalMetrics(sectionData);
  const corpusBodyStored = Math.max(0, Number(grp.userData?.corpusBodyMm || 0) || 0);
  const corpusAntStored = Math.max(0, Number(grp.userData?.corpusAntresolMm || 0) || 0);
  const roleBandStored = corpusBodyStored > 0 || corpusAntStored > 0;
  const bpPlace = Number(sectionData.bottomPlankHeightMm);
  const varsForZones = {
    h_bottom:
      Number.isFinite(bpPlace) && bpPlace >= 0 ? bpPlace : DEFAULT_BOTTOM_PLANK_MM,
    h_top: roleBandStored
      ? Number(grp.userData?.hTopCatalogMm || 0) || 0
      : Number(grp.userData?.hTopCatalogMm ?? (grp.userData?.__layoutZones?.zones?.hTopMm || 0)) || 0,
  };
  if (corpusBodyStored > 0) varsForZones.corpus_body_mm = corpusBodyStored;
  if (corpusAntStored > 0) varsForZones.corpus_antresol_mm = corpusAntStored;
  const techStored = Math.max(0, Number(grp.userData?.techZoneMm || 0) || 0);
  if (techStored > 0) varsForZones.tech_zone_mm = techStored;
  const catalogHForZones = isWallHungPlacementKind(placementKind)
    ? Math.max(
        0,
        Number(grp.userData?.customHeightMm) ||
          Number(grp.userData?.__initialSectionSizeMm?.y) ||
          Number(grp.userData?.__layoutZones?.zones?.bodyMm) ||
          0
      )
    : 0;
  const layoutZones = computePlacementVerticalZones(slotMetrics, {
    placementKind,
    variables: varsForZones,
    catalogHeightMm: catalogHForZones,
  });
  const z = layoutZones?.zones;
  if (isWallHungPlacementKind(placementKind) && z && Number(z.bodyMm) > 0) {
    const hy = Math.max(1, Number(z.bodyMm) + Math.max(0, Number(z.hTopMm || 0)));
    return { x: zoneW, y: hy, z: targetDepthMm };
  }
  const roleAwareTotalHeight =
    z &&
    (Number.isFinite(Number(z.plinthMm)) ||
      Number.isFinite(Number(z.carcassMm)) ||
      Number.isFinite(Number(z.hTopMm)) ||
      Number.isFinite(Number(z.serviceMm)))
      ? Math.max(0, Number(z.plinthMm || 0)) +
        Math.max(0, Number(z.carcassMm || 0)) +
        Math.max(0, Number(z.hTopMm || 0)) +
        Math.max(0, Number(z.serviceMm || 0))
      : null;
  const topPlankForFallback = (() => {
    const f = Number(sectionData?.filler?.topMm);
    if (Number.isFinite(f) && f >= 0) return f;
    const t = Number(sectionData?.topPlankHeight);
    if (Number.isFinite(t) && t >= 0) return t;
    return TOP_PLANK_HEIGHT_MM;
  })();
  const fallbackTargetHeight = Math.max(
    0,
    (size.y || size.height || 0) -
      topPlankForFallback -
      (Number.isFinite(Number(sectionData.bottomPlankHeightMm))
        ? Number(sectionData.bottomPlankHeightMm)
        : DEFAULT_BOTTOM_PLANK_MM)
  );
  const targetHeight = roleAwareTotalHeight != null ? roleAwareTotalHeight : fallbackTargetHeight;
  return { x: zoneW, y: targetHeight, z: targetDepthMm };
}

function listCatalogItemsInRoomStorage(catalogType) {
  const ct = String(catalogType || '').trim();
  if (!ct) return [];
  const key = ct.startsWith('catalog_') ? ct : 'catalog_' + ct;
  const fromDisk = () => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open(
        'GET',
        '/catalog_items/' + encodeURIComponent(key) + '.json?t=' + Date.now(),
        false
      );
      xhr.send(null);
      if (xhr.status < 200 || xhr.status >= 300) return [];
      const arr = JSON.parse(xhr.responseText);
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  };
  if (/^catalog_[45]\d+$/i.test(key)) {
    const disk = fromDisk();
    if (disk.length) return disk;
  }
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) return arr;
    }
  } catch (_) {}
  return fromDisk();
}

function resolveKitchenCornerHandPairTargetId(ud, wantAtStart) {
  const isWall =
    String(ud?.__placementKindProfileId || ud?.__placementKind || '')
      .trim()
      .toLowerCase() === 'kitchen_wall_corner' ||
    /catalog_54|(^|_)54$/i.test(String(ud?.catalogType || ''));
  const catalogType = String(
    ud?.catalogType || (isWall ? 'catalog_54' : 'catalog_44')
  )
    .trim() || (isWall ? 'catalog_54' : 'catalog_44');
  const wantPk = isWall ? 'kitchen_wall_corner' : 'kitchen_base_corner';
  const wantLeft = wantAtStart === true;
  let pair = ud?.pairedHandCatalogItemIds;
  if (!pair || !(pair.left || pair.right)) {
    const currentItem = findCatalogItemInRoomStorage(
      catalogType,
      Number(ud?.catalogItemId) || 0
    );
    pair = readPairedHandCatalogIdsFromItem(currentItem);
  }
  let targetId = wantLeft ? Number(pair.left) || 0 : Number(pair.right) || 0;
  if (targetId > 0) return { catalogType, targetId, pair };
  const items = listCatalogItemsInRoomStorage(catalogType);
  for (const it of items) {
    const id = Number(it?.id) || 0;
    if (id <= 0) continue;
    const pk = String(it?.data?.placementKind || it?.placementKind || '')
      .trim()
      .toLowerCase();
    if (pk && pk !== wantPk) continue;
    if (getCatalogItemCornerAtStart(it) === wantLeft) {
      targetId = id;
      break;
    }
  }
  return { catalogType, targetId, pair };
}

/**
 * Разворот угла: карточка левый ↔ правый (НМУ catalog_44 / приставной ВМУ catalog_54).
 */
export function trySwapKitchenCornerHandCatalog(group, wantAtStart, sectionData) {
  if (!group || !isKitchenCornerModuleGroup(group)) {
    return { ok: false, reason: 'not_corner' };
  }
  const ud = group.userData || (group.userData = {});
  const isWall = isKitchenWallCornerGroup(group);
  const catalogType =
    String(ud.catalogType || (isWall ? 'catalog_54' : 'catalog_44')).trim() ||
    (isWall ? 'catalog_54' : 'catalog_44');
  const currentId = Number(ud.catalogItemId) || 0;
  if (currentId <= 0) return { ok: false, reason: 'no_catalog_id' };

  const currentItem = findCatalogItemInRoomStorage(catalogType, currentId);
  const currentAt = getCatalogItemCornerAtStart(currentItem || ud.catalogItem);
  if (currentAt === (wantAtStart === true)) {
    return { ok: true, swapped: false, fromId: currentId, toId: currentId };
  }

  const resolved = resolveKitchenCornerHandPairTargetId(ud, wantAtStart === true);
  const targetId = Number(resolved.targetId) || 0;
  if (targetId <= 0 || targetId === currentId) {
    return {
      ok: false,
      reason: 'no_pair',
      message: wantAtStart
        ? isWall
          ? 'Нет карточки ВМУ левый в catalog_54.'
          : 'Нет карточки «Угловой левый» в catalog_44.'
        : isWall
          ? 'Нет карточки ВМУ правый в catalog_54.'
          : 'Нет карточки «Угловой правый» в catalog_44.',
    }
  }

  const targetItem = findCatalogItemInRoomStorage(resolved.catalogType, targetId);
  if (!targetItem) return { ok: false, reason: 'pair_missing', toId: targetId };

  const furnitureData = buildFurnitureDataFromCatalogItem(
    targetItem,
    resolved.catalogType
  );
  if (!furnitureData) return { ok: false, reason: 'bad_furniture_data' };

  const clodisData = getClodisDataForBuild(furnitureData);
  if (!clodisData || clodisData.length === 0) return { ok: false, reason: 'no_clodis' };

  let dataForBuild;
  try {
    dataForBuild = JSON.parse(JSON.stringify(clodisData));
  } catch (_) {
    return { ok: false, reason: 'clone_failed' };
  }

  const placementKind = resolvePlacementKindFromFurnitureData(furnitureData);
  const { opts: doorOpts, needsPatch } = buildRoomDoorPrepareOpts(furnitureData, {
    doorLayout: ud.doorLayout,
    zoneHand: ud.zoneHand,
    doorKind: ud.doorKind,
    catalogItem: targetItem,
    placementKind,
    productKind: resolveProductKindForFurnitureData(furnitureData),
  });
  const prepared = needsPatch
    ? prepareClodisForRoomBuild(dataForBuild, doorOpts)
    : dataForBuild;

  writeUserDataClodisData(ud, prepared);
  ud.catalogItemId = targetId;
  ud.catalogItem = targetItem;
  ud.catalogName =
    (targetItem.name && String(targetItem.name).trim()) || ud.catalogName || '';
  ud.catalogType = resolved.catalogType;
  ud.pairedHandCatalogItemIds = {
    left: Number(resolved.pair?.left) || (wantAtStart ? targetId : currentId),
    right: Number(resolved.pair?.right) || (wantAtStart ? currentId : targetId),
  };
  if (!ud.pairedHandCatalogItemIds.left) {
    ud.pairedHandCatalogItemIds.left = wantAtStart ? targetId : currentId;
  }
  if (!ud.pairedHandCatalogItemIds.right) {
    ud.pairedHandCatalogItemIds.right = wantAtStart ? currentId : targetId;
  }
  ud.pairedCatalogItemIds = readPairedCatalogIdsFromItem(targetItem);
  ud.__placementKindProfileId = getRawPlacementKindFromFurnitureData(furnitureData);
  ud.__placementKind = placementKind;
  ud.__cldSkipSectionAutoRescale = clodisHasConstructorMarkers(prepared);
  // ???: ???? = ??????? ??????. ???: geom ?????? ???? ?? ??????? (?????? ????????).
  if (!isWall) {
    ud.__kitchenCornerSideAtMinU = wantAtStart === true;
  }

  // ??? CornerCell = 1050; ??? ? ???? ??????? (?????? 600, ?? 1050).
  let cellW = isWall
    ? resolveKitchenWallCornerWidthMm(group)
    : 1050;
  if (!isWall) {
    try {
      if (typeof resolveKitchenCornerSpecialWidthMm === 'function') {
        cellW = resolveKitchenCornerSpecialWidthMm() || 1050;
      }
    } catch (_) {
      cellW = 1050;
    }
    if (!(cellW >= 900 && cellW <= 1200)) cellW = 1050;
  }
  ud.__kitchenCellWidthMm = cellW;
  ud.customWidthMm = cellW;
  const targetSize = {
    x:
      cellW > 50
        ? cellW
        : Math.round(
            Number(ud.__targetSectionSizeMm?.x) ||
              (isWall ? KITCHEN_WALL_CORNER_DEFAULT_WIDTH_MM : 1050)
          ),
    y: Math.round(Number(ud.__targetSectionSizeMm?.y) || (isWall ? 720 : 820)),
    z: Math.round(
      Number(ud.__kitchenCarcassDepthMm) ||
        Number(ud.__targetSectionSizeMm?.z) ||
        (isWall ? 350 : 550)
    ),
  };
  const ok = rebuildFurnitureGroupForSectionResize(
    group,
    sectionData || null,
    targetSize,
    { force: true }
  );
  if (!ok) {
    return { ok: false, reason: 'rebuild_failed', fromId: currentId, toId: targetId };
  }

  console.warn('[CORNER-HAND] catalog swap', {
    fromId: currentId,
    toId: targetId,
    wantAtStart: wantAtStart === true,
    name: ud.catalogName,
    cellW,
  });
  try {
    recalcFurniturePricingAfterGeometryChange();
  } catch (_) {}
  return { ok: true, swapped: true, fromId: currentId, toId: targetId };
}

/**
 * При смене doorKind зоны подставить связанную карточку каталога (pairedCatalogItemIds).
 * @returns {boolean} true если группа пересобрана под другой id каталога
 */
export function tryApplyDoorPairCatalogSwap(group, sectionData, layout) {
  if (!group || !sectionData?.division) return false;
  const ud = group.userData || {};
  if (!readUserDataClodisData(ud)) return false;

  const seg = (layout?.segments || []).find(
    (s) => s.type === 'module' && s.furnitureUuid === group.uuid
  );
  const zoneIndex =
    ud.zoneIndex != null && Number.isFinite(Number(ud.zoneIndex))
      ? Number(ud.zoneIndex)
      : seg?.zoneIndex;
  if (zoneIndex == null || !Number.isFinite(zoneIndex)) return false;

  const zoneDoorKind = getZoneDoorKind(sectionData, zoneIndex);
  if (!zoneDoorKind) return false;

  const catalogType = String(ud.catalogType || '').trim();
  const currentId = Number(ud.catalogItemId) || 0;
  if (!catalogType || currentId <= 0) return false;

  const currentItem = findCatalogItemInRoomStorage(catalogType, currentId);
  if (!ud.pairedCatalogItemIds) {
    ud.pairedCatalogItemIds = readPairedCatalogIdsFromItem(currentItem);
  }
  const moduleDoorKind =
    getCatalogItemDoorKind(currentItem, catalogType) ||
    inferModuleDoorKindForGroup(ud, currentItem);
  if (!moduleDoorKind || moduleDoorKind === zoneDoorKind) return false;

  const targetId = Number(ud.pairedCatalogItemIds?.[zoneDoorKind]) || 0;
  if (targetId <= 0 || targetId === currentId) return false;

  const targetItem = findCatalogItemInRoomStorage(catalogType, targetId);
  if (!targetItem) {
    console.warn('[door-pair] нет карточки id', targetId, 'в', catalogType, '— выгрузите каталог в конструктор');
    return false;
  }

  const furnitureData = buildFurnitureDataFromCatalogItem(targetItem, catalogType);
  if (!furnitureData) return false;

  const clodisData = getClodisDataForBuild(furnitureData);
  if (!clodisData || clodisData.length === 0) return false;

  let dataForBuild;
  try {
    dataForBuild = JSON.parse(JSON.stringify(clodisData));
  } catch (_) {
    return false;
  }

  const placementKind = resolvePlacementKindFromFurnitureData(furnitureData);
  const { opts: doorOpts, needsPatch } = buildRoomDoorPrepareOpts(furnitureData, {
    doorLayout: ud.doorLayout,
    zoneHand: ud.zoneHand,
    doorKind: zoneDoorKind,
    catalogItem: targetItem,
    placementKind,
    productKind: resolveProductKindForFurnitureData(furnitureData),
  });
  const prepared = needsPatch
    ? prepareClodisForRoomBuild(dataForBuild, doorOpts)
    : dataForBuild;

  writeUserDataClodisData(ud, prepared);
  ud.catalogItemId = targetId;
  ud.catalogName =
    (targetItem.name && String(targetItem.name).trim()) || ud.catalogName || '';
  ud.drawerStackPolicy = extractDrawerStackPolicyFromCatalogItem(targetItem) || null;
  ud.shelfStackPolicy = extractShelfStackPolicyFromCatalogItem(targetItem) || null;
  ud.pairedCatalogItemIds = readPairedCatalogIdsFromItem(targetItem);
  ud.pairedHandCatalogItemIds = readPairedHandCatalogIdsFromItem(targetItem);
  ud.doorKind = doorOpts.doorKind;
  ud.unifiedFacadeFromCatalog = extractUnifiedFacadeFromCatalogItem(targetItem);
  ud.unifiedFacade = !!doorOpts.unifiedFacade;
  const pair = ud.pairedCatalogItemIds;
  if (pair.single !== currentId && pair.double !== currentId) {
    if (zoneDoorKind === 'single') pair.single = targetId;
    else pair.double = targetId;
  }
  ud.__cldSkipSectionAutoRescale = clodisHasConstructorMarkers(prepared);
  ud.__placementKindProfileId = getRawPlacementKindFromFurnitureData(furnitureData);
  ud.__placementKind = placementKind;
  stampZoneCohabitOnUserData(ud, resolvePendingZoneCohabitSpec(furnitureData));

  const targetSize = zoneWidthMmForFurnitureGroup(group, sectionData, layout);
  if (targetSize.x < 1 || targetSize.y < 1 || targetSize.z < 1) return false;

  const ok = rebuildFurnitureGroupForSectionResize(group, sectionData, targetSize, { force: true });
  if (ok) {
    console.log('[door-pair] замена в секции', {
      sectionId: sectionData.id,
      zoneIndex,
      zoneDoorKind,
      fromId: currentId,
      toId: targetId,
    });
    try {
      recalcFurniturePricingAfterGeometryChange();
    } catch (_) {}
  }
  return ok;
}

function tryRestoreCanonicalClodisRootsForGroup(ud) {
  if (!ud || typeof ud !== 'object') return;
  const catalogType = getFurnitureCatalogType(ud);
  const catalogItemId = Number(ud.catalogItemId) || 0;
  if (!catalogType || catalogItemId <= 0) return;
  const item = findCatalogItemInRoomStorage(catalogType, catalogItemId);
  if (!item) return;
  const fresh = getClodisDataForBuild({ catalogItem: item });
  if (!fresh) return;
  // Паритет с админкой: при rebuild всегда брать актуальное дерево каталога
  // (сколько профилей/вырезов сохранили — столько в комнате), не застывший снимок.
  try {
    const clone = JSON.parse(JSON.stringify(Array.isArray(fresh) ? fresh : [fresh]));
    writeUserDataClodisRoots(ud, clone);
  } catch (_) {}
}

/**
 * Clodis/конструктор: при смене секции пересобрать mesh с новым sectionSize
 * (как placePendingFurniture), а не uniform-scale по bbox.
 * @returns {boolean}
 */
/**
 * @param {{ force?: boolean }} [opts] force=true — пересобрать даже если sectionSize ? прошлого билда
 *   (смена zoneHand / ручек / каталога). Без force — при |?|?1 мм по осям только layout (place N-го шкафа).
 */
export function rebuildFurnitureGroupForSectionResize(group, sectionData, targetSectionSizeMm, opts = {}) {
  if (!group || !sectionData || !targetSectionSizeMm) return false;
  if (typeof window !== 'undefined' && window.__CLD_DEBUG_REBUILD === true) {
    console.warn('[REBUILD-WIDTH]', {
      uuid: group.uuid,
      targetXmm: Math.round(Number(targetSectionSizeMm?.x) || 0),
      isEndCab: !!group.userData?.isEndCabinet,
      force: !!opts.force,
      stack: new Error().stack?.split('\n').slice(2, 6).join(' | '),
    });
  }
  // Как в рабочей ThreeJS-25: без REBUILD-SKIP.
  // Skip «initial ? target» оставлял mesh уже зоны > щель шкаф-шкаф после ускорения place.
  const ud = group.userData || {};
  // S2A: пенал с отступом от стены → авто left overlay (без консоли).
  try {
    ensureTallAutoSideOverlayS2A(ud);
  } catch (_) {}
  tryRestoreCanonicalClodisRootsForGroup(ud);
  group.userData = ud;
  if (!readUserDataClodisRoots(ud) && readUserDataClodisData(ud)) {
    try {
      const legacy = readUserDataClodisData(ud);
      writeUserDataClodisRoots(
        ud,
        Array.isArray(legacy) ? JSON.parse(JSON.stringify(legacy)) : [JSON.parse(JSON.stringify(legacy))]
      );
      group.userData = ud;
    } catch (_) {}
  }
  const root = readUserDataClodisRoots(ud) || readUserDataClodisData(ud);
  if (!root || typeof root !== 'object') {
    console.warn('[SECTION-RESIZE][REBUILD] no clodis roots on group', group.uuid);
    return false;
  }

  const FurnitureCtor =
    typeof Furniture !== 'undefined' ? Furniture : typeof window !== 'undefined' ? window.Furniture : null;
  if (typeof FurnitureCtor !== 'function') return false;

  let dataForBuild;
  try {
    dataForBuild = JSON.parse(JSON.stringify(root));
  } catch (e) {
    console.warn('[SECTION-RESIZE][REBUILD] clone failed', e);
    return false;
  }
  try {
    const rootsNorm = Array.isArray(dataForBuild) ? dataForBuild : [dataForBuild];
    normalizeClodisRoots(rootsNorm);
    dataForBuild = Array.isArray(dataForBuild) ? rootsNorm : rootsNorm[0];
  } catch (e) {
    console.warn('[SECTION-RESIZE][REBUILD] normalizeClodisRoots failed', e);
  }

  const placementKind = ud.__placementKind || PLACEMENT_KIND.FLOOR_IN_NICHE;
  const pairedHandSrc = ud.pairedHandCatalogItemIds;
  const rebuildCatalogPayload = {};
  if (ud.unifiedFacadeFromCatalog) rebuildCatalogPayload.unifiedFacade = true;
  if (pairedHandSrc && (pairedHandSrc.left || pairedHandSrc.right)) {
    rebuildCatalogPayload.pairedHandCatalogItemIds = pairedHandSrc;
  }
  const swingCtxRebuild = swingHandCtxForPlacement(sectionData, ud.zoneIndex, group.uuid);
  const isEndCabinetRebuild = ud.isEndCabinet === true;
  const rebuildZoneHand = isEndCabinetRebuild
    ? ud.zoneHand ||
      resolveDefaultEndCabinetZoneHand(sectionData?.wallName || ud.wallName, ud.endCabinetSide)
    : ud.zoneHandManual
      ? ud.zoneHand
      : undefined;
  const { opts: doorOpts, needsPatch } = buildRoomDoorPrepareOpts(
    Object.keys(rebuildCatalogPayload).length
      ? { catalogItem: { data: rebuildCatalogPayload } }
      : null,
    {
      doorLayout: ud.doorLayout,
      doorKind: ud.doorKind,
      zoneIndex: ud.zoneIndex,
      division: sectionData?.division,
      clodisRoots: dataForBuild,
      placementKind: ud.__placementKind,
      productKind: ud.productKind,
      sectionNeighbors: collectSectionSwingSingleNeighborZones(sectionData?.id, group.uuid),
      zoneHand: rebuildZoneHand,
      ...(ud.zoneHandManual || isEndCabinetRebuild ? {} : swingCtxRebuild),
    }
  );
  const prepared = needsPatch
    ? prepareClodisForRoomBuild(dataForBuild, doorOpts)
    : dataForBuild;
  let buildPayload = getDataForBuild(prepared) || dataForBuild;
  let __rebuildCornerCtx = null;
  let __rebuildKitchenSupports = null;
  if (isKitchenBaseGroup(group) || getKitchenBaseProfileIdFromGroup(group)) {
    try {
      __rebuildKitchenSupports =
        ud.kitchenSupports ||
        extractKitchenSupportsFromCatalogItem(ud.catalogItem || ud.__catalogItem) ||
        null;
      if (__rebuildKitchenSupports) ud.kitchenSupports = __rebuildKitchenSupports;
    } catch (_) {}
  }

  // При resize заполняем ширину зоны целиком (ряд вплотную).
  let sx = Math.max(0, Number(targetSectionSizeMm.x) || 0);
  const sy = Math.max(0, Number(targetSectionSizeMm.y) || 0);
  const sz = Math.max(0, Number(targetSectionSizeMm.z) || 0);
  if (sx < 1 || sy < 1 || sz < 1) return false;

  const sectionSize = { x: sx, y: sy, z: sz };

  const storedVars =
    readUserDataClodisVariables(ud) && typeof readUserDataClodisVariables(ud) === 'object'
      ? readUserDataClodisVariables(ud)
      : {};
  // Кухня: h_bottom / vysota_cokolya только из project plinth (engine), не ниша/каталог 100.
  const rebuildHb = Math.max(
    0,
    Number(ud.hBottomMm) ||
      Number(ud.__kitchenPlinthHeightMm) ||
      Number(storedVars.h_bottom) ||
      0
  );
  let moduleVars = {
    vysota_cokolya: rebuildHb > 0 ? rebuildHb : 100,
    glubina_cokolya: 100,
    otstup_paza: 0,
    h_top: Math.max(0, Number(ud.hTopCatalogMm) || Number(storedVars.h_top) || 0),
    ...storedVars,
    ...(rebuildHb > 0
      ? { h_bottom: rebuildHb, vysota_cokolya: rebuildHb }
      : { h_bottom: Math.max(0, Number(storedVars.h_bottom) || 0) }),
  };
  if (isKitchenBaseGroup(group) || getKitchenBaseProfileIdFromGroup(group)) {
    const kitchenSizing = {
      profileId: getKitchenBaseProfileIdFromGroup(group) || ud.__kitchenProfileId,
      carcassHeightMm: Number(ud.__kitchenCarcassHeightMm) || 0,
      plinthHeightMm: rebuildHb,
      totalHeightMm: sy,
    };
    moduleVars = applyKitchenPlaceVariables(moduleVars, kitchenSizing);
  }
  // Угловой НМУ: контекст для единого prepare (не второй калькулятор vars).
  try {
    const pkRebuild = String(
      ud.__placementKindProfileId || ud.__kitchenProfileId || ud.__placementKind || ''
    )
      .trim()
      .toLowerCase();
    const isWallCornerRebuild = pkRebuild === 'kitchen_wall_corner';
    const isCornerRebuild =
      pkRebuild === 'kitchen_base_corner' ||
      isWallCornerRebuild ||
      isKitchenCornerBaseGroup(group);
    if (isCornerRebuild) {
      let atMin = ud.__kitchenCornerSideAtMinU === true;
      if (ud.__kitchenCornerSideAtMinU == null) {
        try {
          const ziR =
            ud.zoneIndex != null && Number.isFinite(Number(ud.zoneIndex))
              ? Number(ud.zoneIndex)
              : null;
          const zoneAt = getSectionLCornerZoneAtStart(sectionData, ziR);
          if (zoneAt != null) {
            atMin = zoneAt;
          } else {
            const meta = getLShapeMeta(sectionData);
            if (meta && typeof meta.cornerAtStart === 'boolean') {
              atMin = meta.cornerAtStart;
            } else if (typeof sectionData?.lShape?.cornerAtStart === 'boolean') {
              atMin = sectionData.lShape.cornerAtStart;
            } else if (sectionData?.lShape?.hand === 'left') {
              atMin = true;
            } else if (sectionData?.lShape?.hand === 'right') {
              atMin = false;
            } else {
              const typeKey = sectionData?.division?.typeKey || meta?.typeKey || null;
              const cfg = typeKey && L_CORNER_CONFIG ? L_CORNER_CONFIG[typeKey] : null;
              atMin = !!cfg?.cornerAtStart;
            }
          }
        } catch (_) {}
      }
      const dOverride =
        Math.round(
          Number(ud.__kitchenCornerReturnMm) ||
            Number(ud.__kitchenCarcassDepthMm) ||
            Number(sz) ||
            0
        ) || undefined;
      // clear=0 валиден (карандаш «отступ»); не Number(x)||10 — иначе 0в†’10.
      const clearRaw = Math.round(Number(ud.__kitchenSideWallClearanceMm));
      let clearMm =
        Number.isFinite(clearRaw) && clearRaw >= 0 ? clearRaw : 10;
      ud.__kitchenSideWallClearanceMm = clearMm;
      const cellW =
        Math.round(Number(ud.__kitchenCellWidthMm) || Number(ud.customWidthMm) || 0) ||
        sx + clearMm;
      if (cellW > 50) {
        ud.__kitchenCellWidthMm = cellW;
        ud.customWidthMm = cellW;
      }
      // НМУ: wallGap = clear (карандаш «отступ» = щель у стены, корпус Wв€’clear).
      // ВМУ: wallGap всегда 0 — не считать свес столешки 600в€’40в€’D (=210 при D=350).
      let wallGapMm = 0;
      if (!isWallCornerRebuild) {
        wallGapMm = clearMm;
      } else {
        clearMm = 0;
        ud.__kitchenSideWallClearanceMm = 0;
      }
      let returnMm = dOverride;
      if (isWallCornerRebuild && (!(Number(returnMm) > 0) || Number(returnMm) >= 460)) {
        returnMm = Math.round(Number(sz) || Number(ud.__kitchenCarcassDepthMm) || 350);
      }
      __rebuildCornerCtx = {
        widthMm: cellW,
        returnMm,
        clearMm: isWallCornerRebuild ? 0 : clearMm,
        wallGapMm,
        atStart: atMin,
      };
    }
  } catch (_) {}
  const ca = Number(ud.corpusAntresolMm) || 0;
  if (placementKind !== PLACEMENT_KIND.STANDALONE_FLOOR) {
    const cb = Number(ud.corpusBodyMm) || 0;
    if (cb > 0) moduleVars.corpus_body_mm = cb;
  }
  if (ca > 0) moduleVars.corpus_antresol_mm = ca;
  const tech = Number(ud.techZoneMm) || 0;
  if (tech > 0) moduleVars.tech_zone_mm = tech;

  const kitchenRebuildSkipNiche =
    !!getKitchenBaseProfileIdFromGroup(group) || isKitchenBaseGroup(group);
  let moduleVarsForBuilder =
    sectionData &&
    !kitchenRebuildSkipNiche &&
    !isLowFurniturePlacementKind(placementKind) &&
    !isWallHungPlacementKind(placementKind)
      ? mergeFloorNicheVariablesFromSection(sectionData, moduleVars)
      : moduleVars;

  if (
    placementKind === PLACEMENT_KIND.STANDALONE_FLOOR ||
    isWallHungPlacementKind(placementKind)
  ) {
    moduleVarsForBuilder.h_top = resolveModuleHTopMm(moduleVarsForBuilder, placementKind);
  }

  try {
    syncDrawerCatalog33ToGlobalCache();
  } catch (_) {}

  let layoutZones = null;
  const kitchenRebuildPk =
    getKitchenBaseProfileIdFromGroup(group) || String(ud.__placementKindProfileId || '').trim();
  const kitchenTallPk =
    String(ud.__placementKindProfileId || ud.placementKind || kitchenRebuildPk || '').trim() ===
      'kitchen_tall' ||
    String(ud.productKind || '') === 'kitchen_tall' ||
    !!(ud.__kitchenTall && ud.__kitchenTall.facadeType) ||
    String(kitchenRebuildPk) === 'kitchen_tall' ||
    isKitchenTallPlacementKind(kitchenRebuildPk);
  if (kitchenTallPk) {
    // Пенал: датамы > layoutZones до shelf fill (2 горизонта на стыках).
    try {
      const km =
        typeof window !== 'undefined' ? window.__cldKitchenManufacturing : null;
      const kt =
        ud.__kitchenTall ||
        (ud.catalogItem && ud.catalogItem.data && ud.catalogItem.data.kitchenTall) ||
        {};
      const plinth =
        Number(ud.__kitchenPlinthHeightMm) ||
        Number(moduleVarsForBuilder.h_bottom) ||
        (km && typeof km.getProjectPlinthHeightMm === 'function'
          ? km.getProjectPlinthHeightMm()
          : 100);
      if (km && typeof km.resolveTallLayoutZonesMm === 'function') {
        const tallZones = km.resolveTallLayoutZonesMm({
          facadeType: kt.facadeType || 'doors_3',
          plinthHeightMm: plinth,
          lowerHalfOfNmMm: kt.lowerHalfOfNmMm,
          ovenNicheMm: kt.ovenNicheMm,
          microwaveNicheMm: kt.microwaveNicheMm,
        });
        if (tallZones?.ok && tallZones.zones) {
          layoutZones = tallZones;
          ud.__layoutZones = tallZones;
          ud.__kitchenTall = {
            facadeType: kt.facadeType || 'doors_3',
            lowerHalfOfNmMm: kt.lowerHalfOfNmMm,
            ovenNicheMm: kt.ovenNicheMm,
            microwaveNicheMm: kt.microwaveNicheMm,
          };
          ud.__kitchenPlinthHeightMm = tallZones.zones.plinthMm;
          ud.hTopCatalogMm = 0;
          moduleVarsForBuilder.h_bottom = tallZones.zones.plinthMm;
          moduleVarsForBuilder.h_top = 0;
        }
      }
    } catch (eTall) {
      console.warn('[KITCHEN-TALL] layoutZones resolve failed', eTall);
    }
    ud.corpusBodyMm = 0;
  }

  const catalogItemForFill =
    resolveFillCatalogItemFromClodisRoots(prepared) ||
    (placementKind !== PLACEMENT_KIND.STANDALONE_FLOOR
      ? findCatalogItemInRoomStorage(getFurnitureCatalogType(ud), Number(ud.catalogItemId) || 0)
      : null);
  let shelfStackPolicyForFill =
    resolveFillShelfStackPolicyFromClodisRoots(prepared) ||
    (ud.shelfStackPolicy && typeof ud.shelfStackPolicy === 'object' ? ud.shelfStackPolicy : null) ||
    extractShelfStackPolicyFromCatalogItem(catalogItemForFill);
  if (kitchenTallPk) {
    // Пенал: не wardrobe shelfStack — только панели-горизонты на датамах.
    shelfStackPolicyForFill = null;
  }
  const drawerPolicy =
    (ud.drawerStackPolicy && typeof ud.drawerStackPolicy === 'object' ? ud.drawerStackPolicy : null) ||
    extractDrawerStackPolicyFromCatalogItem(catalogItemForFill);

  if (kitchenTallPk) {
    try {
      const changedTall = applyKitchenTallDatumHorizonsToRoots(
        prepared,
        layoutZones || ud.__layoutZones
      );
      if (changedTall) {
        buildPayload = getDataForBuild(prepared) || buildPayload;
      }
    } catch (e) {
      console.warn('[KITCHEN-TALL] resize datum horizons failed', e);
    }
  } else if (
    placementKind !== PLACEMENT_KIND.STANDALONE_FLOOR &&
    !isWallHungPlacementKind(placementKind)
  ) {
    try {
      const changedInterior = applyRoomInteriorAndShelfStack(prepared, {
        catalogItem: catalogItemForFill,
        furnitureData: catalogItemForFill ? { catalogItem: catalogItemForFill } : null,
        shelfStackPolicy: shelfStackPolicyForFill,
        sectionSizeMm: sectionSize,
        variables: moduleVarsForBuilder,
        debugPhase: 'resize',
      });
      if (changedInterior) {
        buildPayload = getDataForBuild(prepared) || buildPayload;
      }
    } catch (e) {
      console.warn('[INTERIOR-FILL] resize apply failed', e);
    }
  }

  if (drawerPolicy) {
    try {
      const changed = applyDrawerStackPolicyToRoots(prepared, {
        policy: drawerPolicy,
        sectionSizeMm: sectionSize,
        variables: moduleVarsForBuilder,
        placementKind,
      });
      if (changed) {
        buildPayload = getDataForBuild(prepared) || buildPayload;
      }
    } catch (e) {
      console.warn('[DRAWER-STACK] resize apply failed', e);
    }
    if (
      !kitchenTallPk &&
      placementKind !== PLACEMENT_KIND.STANDALONE_FLOOR &&
      !isWallHungPlacementKind(placementKind)
    ) {
      try {
        const interiorLayout = extractInteriorLayoutFromCatalogItem(catalogItemForFill);
        const changed = applyInteriorDrawerStackToRoots(prepared, {
          policy: drawerPolicy,
          sectionSizeMm: sectionSize,
          variables: moduleVarsForBuilder,
          interiorLayout,
          catalogItem: catalogItemForFill,
          findCatalogItem: findCatalogItemInRoomStorage,
        });
        if (changed) {
          buildPayload = getDataForBuild(prepared) || buildPayload;
        }
      } catch (e) {
        console.warn('[DRAWER-STACK] interior fill resize failed', e);
      }
    }
  }

  if (shelfStackPolicyForFill) ud.shelfStackPolicy = shelfStackPolicyForFill;
  if (drawerPolicy) ud.drawerStackPolicy = drawerPolicy;

  try {
    stampDrawerNoHandleFlagsInTree(prepared);
  } catch (e) {
    console.warn('[DRAWER-NO-HANDLE] stamp resize failed', e);
  }

  void ensureDrawerCatalog33FreshFromApi();

  // kitchenTallPk: layoutZones уже выставлены выше (до shelf fill).
  if (!kitchenTallPk && placementKind === PLACEMENT_KIND.STANDALONE_FLOOR) {
    // Каталог часто хранит corpus_body_mm=500 (тумба 616 мм). Боковины тогда 500-32=468,
    // а полоса корпуса при 600 мм = 484 > боковины должны быть 452. Убираем фикс каталога.
    delete moduleVarsForBuilder.corpus_body_mm;
    delete moduleVarsForBuilder.corpus_fixed_mm;
    delete moduleVarsForBuilder.h_corpus_body;
    // kitchen_base: как админка — без room layoutZones (только формулы + h_bottom).
    if (kitchenPlacementUsesLayoutZones(kitchenRebuildPk || placementKind)) {
      layoutZones = computeStandaloneFloorLayoutZones(sy, moduleVarsForBuilder, placementKind);
      ud.__layoutZones = layoutZones;
      ud.hTopCatalogMm = layoutZones.zones.hTopMm;
    } else {
      layoutZones = null;
      try {
        delete ud.__layoutZones;
      } catch (_) {}
      ud.hTopCatalogMm = Math.max(0, Number(moduleVarsForBuilder.h_top) || 0);
    }
    ud.corpusBodyMm = 0;
  } else if (sectionData) {
    try {
      refreshSectionVerticalLayout(sectionData);
      const slotMetrics = getSlotVerticalMetrics(sectionData);
      const catalogHForZones = isWallHungPlacementKind(placementKind)
        ? Math.max(
            0,
            Number(ud.customHeightMm) ||
              Number(ud.__initialSectionSizeMm?.y) ||
              Number(sy) ||
              0
          )
        : 0;
      layoutZones = computePlacementVerticalZones(slotMetrics, {
        placementKind,
        variables: moduleVarsForBuilder,
        catalogHeightMm: catalogHForZones,
      });
      ud.__layoutZones = layoutZones;
    } catch (_) {}
  }

  // Кухня rebuild: тот же prepareKitchenModuleForBuild, что place/админ.
  if (isKitchenBaseGroup(group) || getKitchenBaseProfileIdFromGroup(group)) {
    try {
      const pkPrep = String(
        kitchenRebuildPk ||
          ud.__placementKindProfileId ||
          ud.__kitchenProfileId ||
          ''
      ).trim();
      const preparedRebuild = prepareKitchenModuleForBuild({
        roots: buildPayload,
        variables: moduleVarsForBuilder,
        widthMm: Number(__rebuildCornerCtx?.widthMm) || sx,
        item: ud.catalogItem || ud.__catalogItem || null,
        placementKind: pkPrep,
        plinthHeightMm: rebuildHb || undefined,
        kitchenSupports: __rebuildKitchenSupports,
        kitchenNormalize: {
          sidePanels: ud.sidePanels || null,
          carcassDepthMm: ud.__kitchenCarcassDepthMm || ud.customDepthMm || sz || null,
          // НШ1/НШ2/пенал: нет столешницы — не применять worktop-cover/extend (STEP 3З/3И).
          skipWorktopCover:
            isKitchenWallMidGroup(group) ||
            isKitchenWallTopGroup(group) ||
            isKitchenTallGroup(group),
        },
        corner: __rebuildCornerCtx
          ? {
              ...__rebuildCornerCtx,
              item: ud.catalogItem || ud.__catalogItem || null,
              normalizeTree: true,
              enabled: true,
            }
          : { enabled: false },
      });
      buildPayload = preparedRebuild.roots;
      moduleVarsForBuilder = preparedRebuild.variables;
      try {
        writeUserDataClodisVariables(ud, {
          ...storedVars,
          ...moduleVarsForBuilder,
        });
      } catch (_) {}
    } catch (eRebPrep) {
      console.warn('[SECTION-RESIZE][REBUILD] prepareKitchenModuleForBuild failed', eRebPrep);
    }
  }

  const corpusWallThicknessMm = Number(moduleVarsForBuilder?._wt) > 0 ? Number(moduleVarsForBuilder._wt) : 16;
  const step5Selection =
    typeof window !== 'undefined' && typeof window.getStep5DecorSelection === 'function'
      ? window.getStep5DecorSelection()
      : { outside: null, inside: null };

  const params = {
    sectionSize,
    wallThicknessMm: corpusWallThicknessMm,
    variables: moduleVarsForBuilder,
    groups: {
      g0: { thickness: corpusWallThicknessMm },
      g1: { thickness: 3 },
      g2: { thickness: 18 },
      g3: { thickness: 16 },
      hdf1: { thickness: 3 },
    },
    useLegacySetupPivot: true,
    decorOutside: step5Selection.outside || ud.step5ModuleOutside,
    decorInside: step5Selection.inside || ud.step5ModuleInside,
    layoutZones,
    // Сырой kitchen_base — тот же контекст билдера, что в админке (не mapped standalone_floor).
    placementKind: kitchenRebuildPk || placementKind,
    doorLayout: doorOpts.doorLayout || undefined,
    zoneHand: doorOpts.zoneHand || undefined,
    doorKind: doorOpts.doorKind || undefined,
    unifiedFacade: doorOpts.unifiedFacade || undefined,
    hingeLayoutOverride: ud.hingeLayoutOverride,
    productKind: ud.productKind,
    shellFillPolicyCatalogItem:
      resolveShellFillPolicyCatalogItemFromClodisRoots(prepared, catalogItemForFill) || null,
    fillPolicyCatalogItem: catalogItemForFill || null,
    shelfProps: resolveShelfPropsConfigFromFillItem(catalogItemForFill),
  };

  // S2A belt: inject ещё раз прямо перед build (если prepare/кэш не проставил).
  try {
    if (ud.sidePanels) {
      const inj = applySidePanelsToPreparedRoots(buildPayload, {
        sidePanels: ud.sidePanels,
        carcassDepthMm:
          Math.round(Number(ud.__kitchenCarcassDepthMm)) ||
          Math.round(Number(ud.customDepthMm)) ||
          Math.round(Number(sectionSize?.z)) ||
          0,
        rearOffsetMm: Math.max(0, Math.round(Number(ud.rearOffsetMm) || 0)),
      });
      ud.__cldSidePanelsPrepareMeta = inj.meta || ud.__cldSidePanelsPrepareMeta;
      if (inj.meta?.injected > 0) {
        console.info('[S2A][rebuild] pre-build inject', inj.meta);
      }
    }
  } catch (eInj) {
    console.warn('[S2A][rebuild] pre-build inject failed', eInj);
  }

  let built;
  try {
    built = new FurnitureCtor(buildPayload, params);
  } catch (e) {
    console.warn('[SECTION-RESIZE][REBUILD] Furniture build failed', e, {
      sectionId: sectionData?.id,
      placementKind,
      sectionSize,
    });
    return false;
  }
  if (!built?.group) {
    console.warn('[SECTION-RESIZE][REBUILD] empty built.group', {
      sectionId: sectionData?.id,
      placementKind,
      sectionSize,
    });
    return false;
  }

  try {
    const B = typeof window !== 'undefined' ? window.ClodisBuilder : null;
    if (B && typeof B.unregisterDoorSwingGroupsFromRoot === 'function') {
      B.unregisterDoorSwingGroupsFromRoot(group);
    }
  } catch (_) {}

  const toRemove = [...group.children];
  for (const ch of toRemove) {
    group.remove(ch);
    __disposeObject3DTree(ch);
  }
  const toAdd = [...built.group.children];
  for (const ch of toAdd) {
    built.group.remove(ch);
    group.add(ch);
  }
  __disposeObject3DTree(built.group);

  group.scale.set(1, 1, 1);
  ud.__initialSectionSizeMm = { ...sectionSize };
  ud.unifiedFacade = !!doorOpts.unifiedFacade;
  if (doorOpts.zoneHand && !ud.zoneHandManual) ud.zoneHand = doorOpts.zoneHand;
  if (doorOpts.hasSwingDoor) ud.hasSwingDoor = true;
  group.updateMatrixWorld(true);
  invalidateGroupIconBBoxCache(group);
  if (typeof ClodisBuilder !== 'undefined' && typeof ClodisBuilder.finalizeDrawerFixedPartsReparent === 'function') {
    ClodisBuilder.finalizeDrawerFixedPartsReparent(group);
    group.updateMatrixWorld(true);
  }

  try {
    restoreStep5ModuleDecorFromStorage(group);
  } catch (_) {}
  try {
    __applyDebugColorsToFurnitureParts(group);
  } catch (_) {}
  try {
    applyRoomCabinetStudioLook(group, {
      doorsOpen: typeof window !== 'undefined' && window.__cldRoomDoorsDesiredOpen === true,
      syncLight: false,
    });
    applyStep5DecorToFurnitureGroupImmediate(group);
    refreshCabinetStudioAfterDecor(group, { syncLight: false });
    // Ghost prebuild: не дергать Soft на каждый resize призрака.
    if (opts.syncLight !== false) {
      scheduleIkeaRoomLightSync();
    }
  } catch (_) {}
  try {
    if (typeof window.__cldRefreshRoomFurnitureXray === 'function') {
      window.__cldRefreshRoomFurnitureXray();
    }
  } catch (_) {}
  try {
    if (typeof window.__cldParityProbeAfterBuild === 'function') {
      window.__cldParityProbeAfterBuild(group, 'rebuildFurniture');
    }
  } catch (_) {}
  try {
    window.__cldInvalidateIkeaCamUniformMats?.();
  } catch (_) {}

  if (typeof window !== 'undefined' && window.__CLD_DEBUG_PLACE === true) {
    const panelNominals = [];
    const panelKeys = new Set();
    group.traverse((o) => {
      if (!o?.isMesh) return;
      let p = o.parent;
      for (let i = 0; i < 10 && p; i++) {
        const pud = p.userData || {};
        const sz = pud.__cldCfrnSizeMm;
        if (sz && pud.__cldPanelOrientation) {
          const key = `${p.uuid}|${pud.layoutRole}|${sz.y}`;
          if (!panelKeys.has(key)) {
            panelKeys.add(key);
            panelNominals.push({
              name: p.name,
              layoutRole: pud.layoutRole || '',
              orientation: pud.__cldPanelOrientation,
              cfrnSizeMm: { x: sz.x, y: sz.y, z: sz.z },
            });
          }
          break;
        }
        p = p.parent;
      }
    });
    const bbox = new THREE.Box3().setFromObject(group);
    console.log('[BAZIS-SIZE][REBUILD]', {
      sectionId: sectionData.id,
      uuid: group.uuid,
      zoneIndex: ud.zoneIndex,
      placementKind,
      sectionSizeMm: sectionSize,
      customHeightMm: ud.customHeightMm,
      hBottomMm: moduleVarsForBuilder.h_bottom,
      hTopMm: moduleVarsForBuilder.h_top,
      layoutZones: layoutZones?.zones || null,
      bboxHeightMm: Math.round(bbox.max.y - bbox.min.y),
      panelNominals,
    });
    console.log('[SECTION-RESIZE][REBUILD]', {
      sectionId: sectionData.id,
      uuid: group.uuid,
      zoneIndex: ud.zoneIndex,
      sectionSizeMm: sectionSize,
    });
  }
  const clodisVars = readUserDataClodisVariables(ud);
  if (placementKind === PLACEMENT_KIND.STANDALONE_FLOOR && clodisVars) {
    delete clodisVars.corpus_body_mm;
    delete clodisVars.corpus_fixed_mm;
    delete clodisVars.h_corpus_body;
    writeUserDataClodisVariables(ud, clodisVars);
  }
  // Пивот/свес фасада меняют local Y — без snap дверь остаётся у пола после rebuild шага 4.
  try {
    snapFurnitureGroupPlacementY(group, sectionData);
  } catch (_) {}
  try {
    if (isKitchenBaseGroup(group)) {
      finalizeKitchenBaseAppearance(group);
      // GLB опоры грузятся async — повторно после attach + snap на пол.
      setTimeout(() => {
        try {
          finalizeKitchenBaseAppearance(group);
          snapFurnitureGroupPlacementY(group, sectionData);
        } catch (_) {}
      }, 400);
    }
  } catch (_) {}
  return true;
}

/**
 * Тумба (standalone_floor): новая высота в см > пересборка Clodis, фасад/петли по формулам.
 * @returns {boolean}
 */
function resolveSectionLayoutForFurnitureGroup(sectionData) {
  let layout = sectionData?._layoutCache || null;
  if (!layout && typeof window !== 'undefined' && typeof window.__clodisComputeSectionLayout === 'function') {
    try {
      layout = window.__clodisComputeSectionLayout(sectionData);
    } catch (_) {}
  }
  return layout;
}

/** Низ модуля на пол комнаты (без полного updateFurnitureInSection). */
function snapFurnitureGroupFloorY(group) {
  if (!group) return;
  try {
    const roomWorldPos = new THREE.Vector3();
    if (state.room?.group) {
      state.room.group.getWorldPosition(roomWorldPos);
    }
    const targetBottomY = roomWorldPos.y;
    const bboxMinY = getFurnitureFloorContactWorldYNoAo(group);
    if (Math.abs(bboxMinY - targetBottomY) > 1) {
      group.position.y += targetBottomY - bboxMinY;
      group.updateMatrixWorld(true);
    }
  } catch (_) {}
}

/** Y после resize: пол / навес (floorClearance / под потолок). */
function snapFurnitureGroupPlacementY(group, sectionData) {
  if (!group) return;
  const ud = group.userData || {};
  const pk = String(
    ud.__placementKindProfileId || ud.__placementKind || ud.placementKind || ''
  ).trim();
  const wallMid =
    isKitchenWallMidPlacementKind(pk) || String(ud.productKind || '') === 'kitchen_wall_mid';
  const wallTop =
    isKitchenWallTopPlacementKind(pk) || String(ud.productKind || '') === 'kitchen_wall_top';
  if ((!isWallHungPlacementKind(pk) && !wallMid && !wallTop) || !sectionData) {
    // Ниша и тумба: после rebuild пивот/свес меняют local Y — нужен snap цоколя на пол.
    if (
      !pk ||
      pk === PLACEMENT_KIND.STANDALONE_FLOOR ||
      pk === PLACEMENT_KIND.FLOOR_IN_NICHE
    ) {
      snapFurnitureGroupFloorY(group);
    }
    return;
  }
  try {
    const roomWorldPos = new THREE.Vector3();
    if (state.room?.group) {
      state.room.group.getWorldPosition(roomWorldPos);
    }
    group.updateMatrixWorld(true);
    const bboxMinY = getFurnitureFloorContactWorldYNoAo(group);
    const m = getSlotVerticalMetrics(sectionData);
    const bodyH = Math.max(
      1,
      Number(ud.customHeightMm) || Number(ud.__initialSectionSizeMm?.y) || 0
    );
    let targetBottomY = roomWorldPos.y;
    if (wallMid || wallTop) {
      // Всегда от датамов проекта (plinth+bands), не залипший customFloorClearanceMm.
      let clr = NaN;
      try {
        const km =
          typeof window !== 'undefined' ? window.__cldKitchenManufacturing : null;
        const fn = wallTop
          ? km && km.resolveKitchenWallTopPlaceSizing
          : km && km.resolveKitchenWallMidPlaceSizing;
        const sizing = typeof fn === 'function' ? fn.call(km, {}) : null;
        if (sizing && sizing.ok && Number(sizing.floorClearanceMm) > 0) {
          clr = Math.round(Number(sizing.floorClearanceMm));
        }
      } catch (_) {}
      if (!(Number.isFinite(clr) && clr >= 0)) clr = wallTop ? 2140 : 1420;
      ud.customFloorClearanceMm = Math.round(clr);
      targetBottomY = roomWorldPos.y + Math.max(0, clr);
    } else if (isWallHungHighPlacementKind(pk)) {
      const topY =
        roomWorldPos.y +
        Math.max(0, Number(m.rawHeightMm) || 0) -
        Math.max(0, Number(m.topPlankMm) || 0) -
        Math.max(0, Number(m.ceilingClearanceMm) || 0);
      targetBottomY = topY - bodyH;
    } else {
      targetBottomY =
        roomWorldPos.y + Math.max(0, resolveWallHungFloorClearanceMm(group, sectionData));
    }
    if (Math.abs(bboxMinY - targetBottomY) > 1) {
      group.position.y += targetBottomY - bboxMinY;
      group.updateMatrixWorld(true);
    }
  } catch (_) {}
}

bindKitchenBaseEngineDeps({
  rebuildFurnitureGroupForSectionResize,
  snapFurnitureGroupPlacementY,
  alignBackToWall: alignKitchenModuleBackToWall,
  getCatalogOwnStandaloneHeightMm,
  getRawPlacementKindFromFurnitureData,
  fitFurnitureToSectionZone,
});

function scheduleSectionTrimAfterFurnitureGeometry(sectionData) {
  if (!sectionData) return;
  if (typeof window.__clodisScheduleTrimRebuildAfterFurnitureGeometry === 'function') {
    try {
      window.__clodisScheduleTrimRebuildAfterFurnitureGeometry(sectionData);
    } catch (_) {}
  }
}

/** После rebuild при customDepth: передний торец на месте (как в ThreeJS-20). */
function applyModuleCustomSizeFromUserData(group, sectionData) {
  if (!group || !sectionData) return false;
  const ud = group.userData || {};
  if (!readUserDataClodisData(ud) && !readUserDataClodisRoots(ud)) {
    console.warn('[MODULE-RESIZE] нет clodisJSON для сборки — переставьте модуль из каталога');
    return false;
  }
  const layout = resolveSectionLayoutForFurnitureGroup(sectionData);
  const targetSize = zoneWidthMmForFurnitureGroup(group, sectionData, layout);
  if (targetSize.x < 1 || targetSize.y < 1 || targetSize.z < 1) {
    console.warn('[MODULE-RESIZE] invalid targetSize', targetSize);
    return false;
  }
  const customDepthMm = Number(ud.customDepthMm || 0) || 0;
  const wallName = sectionData?.wallName || ud.wallName || 'back';
  const depthFrontAnchorWorld =
    customDepthMm > 0 ? getFurnitureFrontWorldCoord(group, wallName) : null;
  const ok = rebuildFurnitureGroupForSectionResize(group, sectionData, targetSize, { force: true });
  if (ok && depthFrontAnchorWorld != null) {
    anchorFurnitureFrontWorldCoord(group, wallName, depthFrontAnchorWorld);
  }
  if (ok) {
    group.updateMatrixWorld(true);
    snapFurnitureGroupPlacementY(group, sectionData);
    try {
      recalcFurniturePricingAfterGeometryChange();
    } catch (_) {}
    try {
      if (typeof window.refreshAllHingeRoleMarkersInRoom === 'function') {
        window.refreshAllHingeRoleMarkersInRoom();
      }
    } catch (_) {}
    const pk = ud.__placementKind || '';
    if (
      (pk === PLACEMENT_KIND.STANDALONE_FLOOR || isWallHungPlacementKind(pk)) &&
      sectionData
    ) {
      if (typeof window.__clodisUpdateFurnitureInSection === 'function') {
        try {
          window.__clodisUpdateFurnitureInSection(sectionData);
        } catch (_) {}
      }
      scheduleSectionTrimAfterFurnitureGeometry(sectionData);
    }
  }
  return ok;
}

/**
 * Тумба (standalone_floor): глубина в см > customDepthMm + Clodis rebuild.
 * Шкафы в нише — uniform-scale в scene-icons (как ThreeJS-20).
 * @returns {boolean}
 */
export function applyModuleCustomDepthCm(group, sectionData, depthCm) {
  const dCm = Number(depthCm);
  if (!group || !sectionData || !Number.isFinite(dCm) || dCm <= 0) return false;
  const ud = group.userData || {};
  if (ud.__placementKind !== PLACEMENT_KIND.STANDALONE_FLOOR) return false;
  if (!readUserDataClodisData(ud) && !readUserDataClodisRoots(ud)) return false;
  group.userData = ud;
  ud.customDepthMm = Math.round(dCm * 10);
  return applyModuleCustomSizeFromUserData(group, sectionData);
}

export function applyModuleCustomHeightCm(group, sectionData, heightCm) {
  const hCm = Number(heightCm);
  if (!group || !sectionData || !Number.isFinite(hCm) || hCm <= 0) return false;
  const ud = group.userData || {};
  if (!canEditCustomModuleHeight(ud.__placementKind)) return false;
  group.userData = ud;
  ud.customHeightMm = Math.round(hCm * 10);
  console.log('[BAZIS-SIZE][HEIGHT] applyModuleCustomHeightCm', {
    catalogName: ud.catalogName,
    heightCm: hCm,
    customHeightMm: ud.customHeightMm,
    placementKind: ud.__placementKind,
    sectionId: sectionData.id,
    zoneIndex: ud.zoneIndex,
  });
  return applyModuleCustomSizeFromUserData(group, sectionData);
}

/**
 * Ширина только этого модуля (карандаш в пироге), без customZoneWidthsMm / соседей.
 * НМ — через kitchen rebuild; НШ/прочие — customWidthMm + rebuild.
 */
export function applyModuleCustomWidthCm(group, sectionData, widthCm) {
  const wCm = Number(widthCm);
  if (!group || !sectionData || !Number.isFinite(wCm) || wCm <= 0) return false;
  const wMm = Math.round(wCm * 10);
  if (wMm < 50) return false;
  const ud = group.userData || (group.userData = {});

  const profileId = String(ud.__placementKindProfileId || ud.__placementKind || '').trim();
  const prod = String(ud.productKind || '').trim();
  const isNmCarcass =
    !isKitchenTallGroup(group) &&
    (prod === 'kitchen_base' ||
      profileId === 'kitchen_base' ||
      profileId === 'kitchen_base_gola' ||
      profileId === 'kitchen_base_corner' ||
      profileId.includes('kitchen_base_corner'));
  if (isNmCarcass) {
    const r = rebuildKitchenBaseForCellWidthMm(group, sectionData, wMm);
    const ok = !!(r && r.ok !== false);
    console.log('[MODULE-WIDTH] kitchen base', {
      catalogName: ud.catalogName,
      widthCm: wCm,
      widthMm: wMm,
      ok,
      reason: r?.reason,
    });
    return ok;
  }

  ud.customWidthMm = wMm;
  if (ud.__initialSectionSizeMm && typeof ud.__initialSectionSizeMm === 'object') {
    ud.__initialSectionSizeMm = { ...ud.__initialSectionSizeMm, x: wMm };
  }
  if (ud.__targetSectionSizeMm && typeof ud.__targetSectionSizeMm === 'object') {
    ud.__targetSectionSizeMm = { ...ud.__targetSectionSizeMm, x: wMm };
  }
  console.log('[MODULE-WIDTH] applyModuleCustomWidthCm', {
    catalogName: ud.catalogName,
    widthCm: wCm,
    widthMm: wMm,
    placementKind: ud.__placementKindProfileId || ud.__placementKind,
    productKind: ud.productKind,
    sectionId: sectionData.id,
    zoneIndex: ud.zoneIndex,
  });
  return applyModuleCustomSizeFromUserData(group, sectionData);
}

// Kitchen Cell / plinth / depth API — из kitchen-base-engine (re-export).
export {
  getKitchenBaseProfileIdFromGroup,
  getKitchenBaseWidthLimitsMm,
  validateKitchenBaseCellWidthMm,
  rebuildKitchenBaseForCellWidthMm,
  rebuildKitchenBaseForCellDepthMm,
  findKitchenBaseInSectionZone,
  syncKitchenBaseInZoneToWidthMm,
  applyProjectPlinthHeightToKitchenBases,
  applyProjectFrontModeToKitchenBases,
  applyKitchenBandLowRhythmToKitchenModules,
  applyKitchenCeilingTiersToKitchenModules,
  applyProjectDepthToKitchenBases,
  applyKitchenWorktopDepthOnWall,
};

/** Отступ от пола (см) для нижнего навеса > customFloorClearanceMm + snap Y. */
export function applyModuleFloorClearanceCm(group, sectionData, clearanceCm) {
  const cCm = Number(clearanceCm);
  if (!group || !sectionData || !Number.isFinite(cCm) || cCm < 0) return false;
  const ud = group.userData || {};
  if (!isWallHungLowPlacementKind(ud.__placementKind)) return false;
  group.userData = ud;
  ud.customFloorClearanceMm = Math.round(cCm * 10);
  console.log('[BAZIS-SIZE][FLOOR-CLR] applyModuleFloorClearanceCm', {
    catalogName: ud.catalogName,
    clearanceCm: cCm,
    customFloorClearanceMm: ud.customFloorClearanceMm,
    sectionId: sectionData.id,
    zoneIndex: ud.zoneIndex,
  });
  snapFurnitureGroupPlacementY(group, sectionData);
  scheduleSectionTrimAfterFurnitureGeometry(sectionData);
  try {
    if (typeof window.rebuildSectionZoneEditIconsForSection === 'function') {
      window.rebuildSectionZoneEditIconsForSection(sectionData.id);
    }
  } catch (_) {}
  return true;
}

/** Синхрон отступа от пола по ряду нижних навесов (тот же каталог). */
export function syncWallHungFloorClearanceInSection(
  sectionData,
  catalogType,
  clearanceMm,
  sourcePlacementKind = PLACEMENT_KIND.WALL_HUNG_LOW
) {
  if (!sectionData || !(clearanceMm >= 0)) return false;
  const sourcePk = isWallHungLowPlacementKind(sourcePlacementKind)
    ? PLACEMENT_KIND.WALL_HUNG_LOW
    : String(sourcePlacementKind || '').trim() || PLACEMENT_KIND.WALL_HUNG_LOW;
  if (!isWallHungLowPlacementKind(sourcePk)) return false;

  const catKey = (catalogType && String(catalogType).trim()) || null;
  const mm = Math.round(clearanceMm);
  sectionData.wallHungFloorClearanceMm = mm;

  const groupSecs = getWindowAlongGroupSections(sectionData);
  let any = false;
  for (const sec of groupSecs) {
    sec.wallHungFloorClearanceMm = mm;
    const siblings = collectModulesForHeightSync(sec, catKey, sourcePk);
    for (const grp of siblings) {
      grp.userData = grp.userData || {};
      grp.userData.customFloorClearanceMm = mm;
      if (catKey && !getFurnitureCatalogType(grp.userData)) {
        grp.userData.catalogType = catKey;
      }
      snapFurnitureGroupPlacementY(grp, sec);
      any = true;
    }
    if (typeof window.__clodisScheduleTrimRebuildAfterFurnitureGeometry === 'function') {
      try {
        window.__clodisScheduleTrimRebuildAfterFurnitureGeometry(sec);
      } catch (_) {}
    }
    try {
      if (typeof window.rebuildSectionZoneEditIconsForSection === 'function') {
        window.rebuildSectionZoneEditIconsForSection(sec.id);
      }
    } catch (_) {}
  }

  console.log('[FLOOR-CLR] synced', {
    sectionId: sectionData.id,
    catalogType: catKey,
    clearanceMm: mm,
    any,
  });
  return true;
}

/**
 * Однодверный модуль: смена стороны открывания (zoneHand left/right) + пересборка фасада.
 * @param {boolean} [markManual=true] — ручная смена из UI (блокирует авто-пересчёт).
 * @returns {boolean}
 */
function applyModuleZoneHandCore(group, sectionData, hand, markManual = true) {
  if (!group || !sectionData) return false;
  const raw = String(hand == null ? '' : hand).trim().toLowerCase();
  const zh = raw === 'right' || raw === 'rtl' ? 'right' : 'left';
  const ud = group.userData || {};
  if (String(ud.zoneHand || '').toLowerCase() === zh) return true;
  const prev = ud.zoneHand;
  const prevManual = ud.zoneHandManual === true;
  ud.zoneHand = zh;
  if (markManual) ud.zoneHandManual = true;
  group.userData = ud;
  const ok = applyModuleCustomSizeFromUserData(group, sectionData);
  if (!ok) {
    ud.zoneHand = prev;
    if (markManual) ud.zoneHandManual = prevManual;
    else delete ud.zoneHandManual;
    group.userData = ud;
  }
  return ok;
}

export function applyModuleZoneHand(group, sectionData, hand) {
  return applyModuleZoneHandCore(group, sectionData, hand, true);
}

/** Соседние однодверные распашные в той же секции (для авто zoneHand). */
function collectSectionSwingSingleNeighborZones(sectionId, excludeGroupUuid) {
  const rows = [];
  if (!state.scene || sectionId == null || sectionId === '') return rows;
  state.scene.traverse((o) => {
    if (!o?.userData?.isFurniture) return;
    if (String(o.userData.sectionId) !== String(sectionId)) return;
    if (excludeGroupUuid && o.uuid === excludeGroupUuid) return;
    const zi = Number(o.userData.zoneIndex);
    if (!Number.isFinite(zi)) return;
    if (normalizeDoorKind(o.userData.doorKind) === 'double') return;
    let hasSwing = o.userData.hasSwingDoor === true;
    if (!hasSwing && o.userData.hasSwingDoor !== false) {
      const roots = readUserDataClodisRoots(o.userData) || readUserDataClodisData(o.userData);
      hasSwing = resolveModuleHasSwingDoor({ clodisRoots: roots });
    }
    if (!hasSwing) return;
    rows.push({ zoneIndex: zi, doorKind: 'single', hasSwing: true });
  });
  return rows;
}

function moduleGroupIsSingleSwing(group) {
  if (!group?.userData) return false;
  const ud = group.userData;
  if (normalizeDoorKind(ud.doorKind) === 'double') return false;
  if (ud.hasSwingDoor === true) return true;
  if (ud.hasSwingDoor === false) return false;
  const roots = readUserDataClodisRoots(ud) || readUserDataClodisData(ud);
  return resolveModuleHasSwingDoor({ clodisRoots: roots });
}

/** Ordinal of swing single left-to-right (for L-R-L-R). */
function swingOrdinalForZone(sectionId, zoneIndex, excludeGroupUuid) {
  const zi = Number(zoneIndex);
  if (!Number.isFinite(zi)) return 0;
  const zones = collectSectionSwingSingleNeighborZones(sectionId, excludeGroupUuid)
    .map((n) => Number(n.zoneIndex))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  let count = 0;
  for (const z of zones) {
    if (z < zi) count += 1;
  }
  return count;
}

function swingHandCtxForPlacement(sectionData, zoneIndex, excludeGroupUuid) {
  const zi = Number(zoneIndex);
  const neighbors =
    sectionData?.id != null
      ? collectSectionSwingSingleNeighborZones(sectionData.id, excludeGroupUuid)
      : [];
  const ord =
    sectionData?.id != null ? swingOrdinalForZone(sectionData.id, zi, excludeGroupUuid) : zi;
  return {
    swingOrdinal: ord,
    swingChainLen: neighbors.length + 1,
  };
}

function resyncAutoSingleSwingHandsInSection(sectionData) {
  if (!sectionData) return { rebuilt: 0, checked: 0, ms: 0 };
  const t0 = performance.now();
  const division = sectionData.division;
  const mods = [];
  state.scene?.traverse?.((o) => {
    if (!o?.userData?.isFurniture) return;
    if (String(o.userData.sectionId) !== String(sectionData.id)) return;
    if (!moduleGroupIsSingleSwing(o)) return;
    mods.push(o);
  });
  if (!mods.length) return { rebuilt: 0, checked: 0, ms: 0 };
  mods.sort((a, b) => Number(a.userData.zoneIndex) - Number(b.userData.zoneIndex));
  const chainLen = mods.length;
  let rebuilt = 0;

  for (let i = 0; i < mods.length; i++) {
    const g = mods[i];
    if (g.userData?.zoneHandManual) continue;
    const zi = Number(g.userData.zoneIndex);
    if (!Number.isFinite(zi)) continue;
    const hand = resolveZoneHandForSingleSwingModule({
      zoneIndex: zi,
      division,
      swingOrdinal: i,
      swingChainLen: chainLen,
    });
    const cur = normalizeZoneHand(g.userData?.zoneHand);
    if (cur === hand) continue;
    if (applyModuleZoneHandCore(g, sectionData, hand, false)) rebuilt += 1;
  }
  const ms = Math.round(performance.now() - t0);
  if (typeof console !== 'undefined' && (rebuilt > 0 || ms >= 16)) {
    console.log('[PLACE-POST] zoneHandSync', {
      sectionId: sectionData.id,
      singles: chainLen,
      rebuilt,
      ms,
    });
  }
  return { rebuilt, checked: chainLen, ms };
}

/** Debounce neighbor swing sync after place. */
const ZONE_HAND_SYNC_DEBOUNCE_MS = 480;
let _zoneHandSyncTimer = null;
let _zoneHandSyncSection = null;

/** After place / zone change: sync auto swing hands of neighbor singles. */
function syncSingleSwingNeighborsAfterPlace(sectionData) {
  if (!sectionData) return;
  _zoneHandSyncSection = sectionData;
  if (_zoneHandSyncTimer != null) clearTimeout(_zoneHandSyncTimer);
  _zoneHandSyncTimer = setTimeout(() => {
    _zoneHandSyncTimer = null;
    const sec = _zoneHandSyncSection;
    _zoneHandSyncSection = null;
    try {
      resyncAutoSingleSwingHandsInSection(sec);
    } catch (syncHandErr) {
      console.warn('[ZONE-HAND] neighbor sync failed', syncHandErr);
    }
  }, ZONE_HAND_SYNC_DEBOUNCE_MS);
}

if (typeof window !== 'undefined') {
  window.__clodisApplyModuleCustomDepthCm = applyModuleCustomDepthCm;
  window.__clodisApplyModuleCustomHeightCm = applyModuleCustomHeightCm;
  window.__clodisApplyModuleCustomWidthCm = applyModuleCustomWidthCm;
  window.__clodisApplyModuleFloorClearanceCm = applyModuleFloorClearanceCm;
  window.__clodisSyncWallHungFloorClearance = syncWallHungFloorClearanceInSection;
  window.__clodisApplyModuleCustomSizeFromUserData = applyModuleCustomSizeFromUserData;
  window.__clodisApplyModuleZoneHand = applyModuleZoneHand;
  window.__cldTrySwapKitchenCornerHandCatalog = trySwapKitchenCornerHandCatalog;
  window.__cldTrySwapKitchenCornerHandCatalog = trySwapKitchenCornerHandCatalog;
  window.__clodisSyncStandaloneCategoryHeight = syncStandaloneCategoryHeightInSection;
  window.__clodisValidateKitchenBaseCellWidthMm = validateKitchenBaseCellWidthMm;
  window.__clodisRebuildKitchenBaseForCellWidthMm = rebuildKitchenBaseForCellWidthMm;
  window.__clodisRebuildKitchenBaseForCellDepthMm = rebuildKitchenBaseForCellDepthMm;
  window.__clodisSyncKitchenBaseInZoneToWidthMm = syncKitchenBaseInZoneToWidthMm;
  window.__clodisFindKitchenBaseInSectionZone = findKitchenBaseInSectionZone;
  window.__clodisApplyProjectPlinthToKitchenBases = applyProjectPlinthHeightToKitchenBases;
  window.__clodisApplyProjectFrontModeToKitchenBases = applyProjectFrontModeToKitchenBases;
  window.__clodisApplyKitchenBandLowRhythmToModules = applyKitchenBandLowRhythmToKitchenModules;
  window.__clodisApplyKitchenCeilingTiersToModules = applyKitchenCeilingTiersToKitchenModules;
  window.__clodisApplyProjectDepthToKitchenBases = applyProjectDepthToKitchenBases;
  window.__clodisApplyKitchenWorktopDepthOnWall = applyKitchenWorktopDepthOnWall;
  window.__cldIsKitchenBaseGroup = isKitchenBaseGroup;
  window.__cldCountStandaloneHeightSyncTargets = countStandaloneHeightSyncTargets;
  window.__cldResolveWallHungFloorClearanceMm = resolveWallHungFloorClearanceMm;
  window.__cldGetStandaloneHeightForCatalog = getStandaloneHeightForCatalog;
  window.__cldGetSectionStandaloneFloorHeight = getStandaloneHeightForCatalog;
  window.__cldGetStandaloneHeightFromMapOnly = getStandaloneHeightFromMapOnly;
  window.__cldGetStandaloneHeightFromMapOnlyInGroup = getStandaloneHeightFromMapOnlyInGroup;
  window.__cldGetExistingStandaloneHeightInWindowAlongGroup =
    getExistingStandaloneHeightInWindowAlongGroup;
  window.__cldGetCatalogOwnStandaloneHeightMm = getCatalogOwnStandaloneHeightMm;
  window.__cldGetWindowBridgeAlignedStandaloneHeightMm =
    getWindowBridgeAlignedStandaloneHeightMm;
  window.__cldGetWindowAlongGroupSillStandaloneHeightMm =
    getWindowAlongGroupSillStandaloneHeightMm;
  window.__cldClampStandaloneHeightToWindowSlot = clampStandaloneHeightToWindowSlot;
}

function mapPlacementKindViaRoomProfiles(placementKind) {
  const pk = String(placementKind || '').trim();
  if (!pk) return pk;
  try {
    const cfg =
      typeof window !== 'undefined' && typeof window.getRoomStepsConfig === 'function'
        ? window.getRoomStepsConfig()
        : null;
    const profiles =
      (cfg && (cfg.placementKindProfiles || cfg.placementKinds || cfg.placementKindsProfiles)) ||
      null;
    if (!Array.isArray(profiles)) return pk;
    const prof = profiles.find((p) => {
      const id = String(p?.id ?? p?.key ?? '').trim();
      return id && id === pk;
    });
    const baseKind = prof?.baseKind ?? prof?.base ?? prof?.basePlacementKind;
    if (typeof baseKind === 'string' && baseKind.trim()) {
      return baseKind.trim();
    }
  } catch (_) {}
  return pk;
}

function getRawPlacementKindFromFurnitureData(furnitureData) {
  // Stamp / папка 50/51 раньше card placementKind (иначе wall_hung_* ломает MID).
  {
    const stamp = String(furnitureData?.__kitchenWallBand || '')
      .trim()
      .toLowerCase();
    if (stamp === 'top') return 'kitchen_wall_top';
    if (stamp === 'mid') return 'kitchen_wall_mid';
    const ctFolder = String(
      furnitureData?.catalogItem?.element_type ||
        furnitureData?.catalogItem?.key ||
        furnitureData?.catalogType ||
        furnitureData?.element_type ||
        furnitureData?.catalogItem?.params?.spec?.element_type ||
        furnitureData?.catalogItem?.catalog_type ||
        furnitureData?.catalogItem?.catalogType ||
        furnitureData?.catalog_type ||
        ''
    )
      .trim()
      .toLowerCase()
      .replace(/^catalog_/, '');
    if (ctFolder === '51') return 'kitchen_wall_top';
    if (ctFolder === '50' || ctFolder === '42' || ctFolder === '43') {
      return 'kitchen_wall_mid';
    }
    try {
      const apiPk =
        typeof window !== 'undefined' ? window.__cldPlacementKindProfiles : null;
      if (apiPk && typeof apiPk.defaultKitchenUnitPlacementKind === 'function' && ctFolder) {
        const defPk = String(
          apiPk.defaultKitchenUnitPlacementKind(
            ctFolder.startsWith('catalog_') ? ctFolder : `catalog_${ctFolder}`
          ) || ''
        ).trim();
        if (defPk === 'kitchen_wall_top' || defPk === 'kitchen_wall_mid') return defPk;
      }
    } catch (_) {}
  }

  // Важно: furnitureData.placementKind часто уже mapped (kitchen_base > standalone_floor).
  // Сырой id берём сначала из карточки каталога, иначе kitchen-путь (опоры проекта) не срабатывает.
  const fromCatalog =
    furnitureData?.catalogItem?.placementKind ||
    furnitureData?.catalogItem?.data?.placementKind ||
    furnitureData?.placementKindProfileId ||
    furnitureData?.__placementKindProfileId;
  const fromData = furnitureData?.placementKind;
  const pick = (v) =>
    typeof v === 'string' && v.trim() && v.trim() !== 'floor_in_niche' ? v.trim() : '';
  const catalogRaw = pick(fromCatalog);
  if (catalogRaw) return catalogRaw;
  const direct = pick(fromData);
  if (direct) return direct;

  const parseFrom = (raw) => {
    if (typeof raw !== 'string' || !raw.trim()) return '';
    try {
      const parsed = JSON.parse(raw);
      const v = parsed?.placementKind;
      return typeof v === 'string' && v.trim() ? v.trim() : '';
    } catch (_) {
      return '';
    }
  };
  const fromCatalogData = parseFrom(furnitureData?.catalogItem?.data);
  if (fromCatalogData && fromCatalogData !== 'floor_in_niche') return fromCatalogData;
  const fromOwnData = parseFrom(furnitureData?.data);
  if (fromOwnData && fromOwnData !== 'floor_in_niche') return fromOwnData;

  let clodisArr = null;
  try {
    let raw =
      readClodisJSON(furnitureData) ?? readClodisJSON(furnitureData?.catalogItem);
    if (typeof raw === 'string') raw = JSON.parse(raw);
    if (Array.isArray(raw) && raw.length > 0) clodisArr = raw;
    else if (raw && typeof raw === 'object') clodisArr = [raw];
  } catch (_) {}


  if (clodisArr) {
    const roleOf = (n) => String(n?.layout_role ?? n?.sectionLayoutRole ?? '').trim();
    const findRoles = (nodes) => {
      const found = new Set();
      const stack = Array.isArray(nodes) ? [...nodes] : [];
      while (stack.length) {
        const n = stack.pop();
        if (!n || typeof n !== 'object') continue;
        const r = roleOf(n);
        if (r) found.add(r);
        if (Array.isArray(n.children)) stack.push(...n.children);
      }
      return found;
    };
    const roles = findRoles(clodisArr);
    const hasCabinetRoot = roles.has('cabinet_root');
    const hasPlinth = roles.has('plinth');
    const hasCorpus = roles.has('corpus') || roles.has('corpus_antresol');
    const hasTop = roles.has('top');
    const hasWallHungBody = roles.has('wall_hung_body');

    // Навес: роль wall_hung_body. Низкий/высокий — из явного placementKind карточки.
    // Без явного kind: низкий по высоте каталога Ф1200 (комод), иначе верхний.
    if (hasWallHungBody) {
      const ctBody = String(
        furnitureData?.catalogItem?.element_type ||
          furnitureData?.catalogType ||
          furnitureData?.element_type ||
          ''
      )
        .trim()
        .toLowerCase();
      if (ctBody === 'catalog_51') return 'kitchen_wall_top';
      if (ctBody === 'catalog_50' || ctBody === 'catalog_42' || ctBody === 'catalog_43') {
        return 'kitchen_wall_mid';
      }
      const catalogH =
        Number(furnitureData?.height) ||
        Number(furnitureData?.catalogItem?.height) ||
        Number(furnitureData?.sectionSize?.y) ||
        NaN;
      if (Number.isFinite(catalogH) && catalogH > 0 && catalogH <= 1200) {
        return PLACEMENT_KIND.WALL_HUNG_LOW;
      }
      return PLACEMENT_KIND.WALL_HUNG_HIGH;
    }

    if (hasCabinetRoot && hasPlinth && hasCorpus && !hasTop) {
      const root = clodisArr[0];
      const authorY = Number(root?.__cldAuthorSizeMm?.y);
      const catalogH =
        Number(furnitureData?.height) ||
        Number(furnitureData?.catalogItem?.height) ||
        Number(furnitureData?.sectionSize?.y) ||
        NaN;
      const refH = Number.isFinite(authorY) && authorY > 0 ? authorY : catalogH;
      if (Number.isFinite(refH) && refH > 0 && refH <= 1200) {
        return PLACEMENT_KIND.STANDALONE_FLOOR;
      }
    }
  }

  return PLACEMENT_KIND.FLOOR_IN_NICHE;
}

function normalizeCatalogTypeId(ct) {
  const s = String(ct || '').trim();
  if (!s) return '';
  return s.replace(/^catalog_/, '');
}

function resolveDrawerStackPolicyForFurnitureData(furnitureData) {
  const catalogItem = furnitureData?.catalogItem || null;
  const explicit =
    extractDrawerStackPolicyFromCatalogItem(catalogItem) ||
    extractDrawerStackPolicyFromCatalogItem(furnitureData);
  if (explicit) return explicit;
  const ct = normalizeCatalogTypeId(
    catalogItem?.catalog_type ?? furnitureData?.catalogType ?? ''
  );
  if (ct === '37') return { enabled: true, mode: 'max_count' };
  return null;
}

function resolveShelfStackPolicyForFurnitureData(furnitureData) {
  const catalogItem = furnitureData?.catalogItem || null;
  const explicit =
    extractShelfStackPolicyFromCatalogItem(catalogItem) ||
    extractShelfStackPolicyFromCatalogItem(furnitureData);
  if (explicit) return explicit;
  const d = catalogItem?.data && typeof catalogItem.data === 'object' ? catalogItem.data : catalogItem || {};
  if (d.is_fill === '1' || d.is_fill === 1) return { enabled: true, mode: 'max_count' };
  return null;
}

/**
 * Пенал: Y двух «Горизонтальная панель *» от низа корпуса = стыки датамов.
 * Не wardrobe shelfStack (even/step) — панели уже в catalog_47.
 */
function resolveKitchenTallHorizonYFromCarcassMm(layoutZones) {
  if (!layoutZones || layoutZones.ok === false) return null;
  const z = layoutZones.zones || {};
  let y0 = Number(z.tallBandLowMm);
  let y1 = Number(z.tallBandLowMm) + Number(z.tallBandMidMm);
  if (!(y0 > 0) || !(y1 > y0)) {
    const hs = Array.isArray(layoutZones.horizons) ? layoutZones.horizons : [];
    if (hs.length >= 2) {
      y0 = Number(hs[0].yFromCarcassBottomMm ?? hs[0].yMm);
      y1 = Number(hs[1].yFromCarcassBottomMm ?? hs[1].yMm);
    }
  }
  if (!(y0 > 0) || !(y1 > y0)) return null;
  return [Math.round(y0), Math.round(y1)];
}

function isKitchenTallHorizonPanelNode(n) {
  if (!n || typeof n !== 'object') return false;
  const name = String(n.name || n.spec?.key || '');
  if (/горизонтальная\s*панель/i.test(name)) return true;
  if (/horizon_low_mid|horizon_mid_high|tall_horizon/i.test(name)) return true;
  return false;
}

/** Выставить 2 горизонта на датамы; лишние панели и wardrobe-полки убрать. */
function applyKitchenTallDatumHorizonsToRoots(roots, layoutZones) {
  const ys = resolveKitchenTallHorizonYFromCarcassMm(layoutZones);
  if (!ys || !roots) return false;
  const rootsArr = Array.isArray(roots) ? roots : [roots];
  let changed = false;
  const panels = [];

  const walk = (nodes) => {
    if (!Array.isArray(nodes)) return;
    for (let i = nodes.length - 1; i >= 0; i -= 1) {
      const n = nodes[i];
      if (!n || typeof n !== 'object') continue;
      if (isKitchenTallHorizonPanelNode(n)) {
        panels.push({ n, parent: nodes, index: i });
      } else if (isShelfModuleNode(n)) {
        // wardrobe shelfStack-полки в пенале не нужны
        nodes.splice(i, 1);
        changed = true;
        continue;
      }
      if (Array.isArray(n.children)) walk(n.children);
      if (Array.isArray(n.spec?.template_tree)) walk(n.spec.template_tree);
    }
  };
  walk(rootsArr);

  panels.sort((a, b) => {
    const ay = Number(a.n?.pos?.y);
    const by = Number(b.n?.pos?.y);
    const aOk = Number.isFinite(ay) ? ay : 0;
    const bOk = Number.isFinite(by) ? by : 0;
    return aOk - bOk;
  });

  for (let i = 0; i < panels.length; i += 1) {
    const { n, parent, index } = panels[i];
    if (i < 2) {
      n.pos = n.pos && typeof n.pos === 'object' ? { ...n.pos } : {};
      if (Number(n.pos.y) !== ys[i]) {
        n.pos.y = ys[i];
        changed = true;
      }
      if (n.active === 0) {
        n.active = 1;
        changed = true;
      }
    } else if (Array.isArray(parent)) {
      const idx = parent.indexOf(n);
      if (idx >= 0) {
        parent.splice(idx, 1);
        changed = true;
      } else if (index >= 0 && parent[index] === n) {
        parent.splice(index, 1);
        changed = true;
      }
    }
  }
  return changed;
}

/** Полки в clodis roots — только для fill catalog_38/37; оболочка catalog_26 > ClodisBuilder. */
function shouldApplyShelfStackOnRoomRoots(opts = {}) {
  const item = opts.catalogItem || opts.furnitureData?.catalogItem || opts.furnitureData;
  if (!item || typeof item !== 'object') return false;
  const ct = normalizeCatalogTypeId(
    item.catalog_type ?? item.catalogType ?? item.data?.catalog_type ?? ''
  );
  if (ct === '38' || ct === '37' || ct === '29') return true;
  const d = item.data && typeof item.data === 'object' && !Array.isArray(item.data) ? item.data : item;
  if (d.is_fill === '1' || d.is_fill === 1 || d.is_fill === true) return true;
  return false;
}

function findFillCatalogRefsInClodisRoots(roots) {
  const arr = Array.isArray(roots) ? roots : roots ? [roots] : [];
  const out = [];
  const stack = [...arr];
  while (stack.length) {
    const n = stack.pop();
    if (!n || typeof n !== 'object') continue;
    const et = String(n.spec?.element_type || '').trim().toLowerCase();
    const id = Number(n.spec?.id) || 0;
    if ((et === 'catalog_38' || et === 'catalog_37' || et === 'catalog_27') && id > 0) {
      out.push({ catalogType: et, itemId: id });
    }
    if (Array.isArray(n.children)) stack.push(...n.children);
    if (Array.isArray(n.spec?.template_tree)) stack.push(...n.spec.template_tree);
  }
  return out;
}

function resolveShellFillPolicyCatalogItemFromClodisRoots(roots, fallbackItem = null) {
  const refs = findFillCatalogRefsInClodisRoots(roots);
  for (const ref of refs) {
    if (ref.catalogType !== 'catalog_27') continue;
    const shell = findCatalogItemInRoomStorage(ref.catalogType, ref.itemId);
    if (shell) return shell;
  }
  return fallbackItem || null;
}

function resolveFillCatalogItemFromClodisRoots(roots) {
  const refs = findFillCatalogRefsInClodisRoots(roots);
  for (const ref of refs) {
    if (ref.catalogType !== 'catalog_38' && ref.catalogType !== 'catalog_37') continue;
    const item = findCatalogItemInRoomStorage(ref.catalogType, ref.itemId);
    if (item) return item;
  }
  for (const ref of refs) {
    if (ref.catalogType !== 'catalog_27') continue;
    const shell = findCatalogItemInRoomStorage(ref.catalogType, ref.itemId);
    if (!shell) continue;
    const shellPlan =
      readClodisJSON(shell) ||
      shell.clodisJSON ||
      parseCatalogItemDataField(shell).clodisJSON ||
      null;
    if (!shellPlan) continue;
    const nestedRefs = findFillCatalogRefsInClodisRoots(shellPlan);
    for (const nref of nestedRefs) {
      if (nref.catalogType !== 'catalog_38' && nref.catalogType !== 'catalog_37') continue;
      const fill = findCatalogItemInRoomStorage(nref.catalogType, nref.itemId);
      if (fill) return fill;
    }
  }
  return null;
}

function resolveShelfPropsConfigFromFillItem(fillItem) {
  const api = typeof window !== 'undefined' ? window.__cldShelfProps : null;
  if (!api || typeof api.extractShelfPropsFromCatalogItem !== 'function') return null;
  const fromItem = fillItem ? api.extractShelfPropsFromCatalogItem(fillItem) : null;
  if (fromItem?.enabled && fromItem.slots?.length) return fromItem;
  const id = Number(fillItem?.id) || 0;
  if (id > 0) {
    const fresh =
      findCatalogItemInRoomStorage('catalog_38', id) || findCatalogItemInRoomStorage('catalog_37', id);
    if (fresh && fresh !== fillItem) {
      const again = api.extractShelfPropsFromCatalogItem(fresh);
      if (again?.enabled && again.slots?.length) return again;
    }
  }
  for (const ct of ['catalog_38', 'catalog_37']) {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(ct) : null;
      const arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) continue;
      for (const it of arr) {
        const cfg = api.extractShelfPropsFromCatalogItem(it);
        if (cfg?.enabled && cfg.slots?.length) return cfg;
      }
    } catch (_) {}
  }
  return fromItem;
}

function resolveFillShelfStackPolicyFromClodisRoots(roots) {
  const item = resolveFillCatalogItemFromClodisRoots(roots);
  return item ? extractShelfStackPolicyFromCatalogItem(item) : null;
}

function ensureCatalogCacheFromLocalStorage(catalogKey) {
  if (typeof window === 'undefined') return;
  const key = String(catalogKey || '').trim();
  if (!key) return;
  const storageKey = key.startsWith('catalog_') ? key : `catalog_${key}`;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || !arr.length) return;
    if (!window.__CLD_CATALOGS_DATA) window.__CLD_CATALOGS_DATA = {};
    const map = {};
    for (const it of arr) {
      if (!it || typeof it !== 'object') continue;
      const idKey = it.id != null && it.id !== '' ? String(it.id) : null;
      if (idKey) map[idKey] = it;
    }
    window.__CLD_CATALOGS_DATA[storageKey] = { items: map };
  } catch (_) {}
}

function prefetchFillCatalogsForClodisPlan(roots) {
  const types = new Set(['catalog_38', 'catalog_37', 'catalog_27']);
  findFillCatalogRefsInClodisRoots(roots).forEach((ref) => {
    types.add(
      ref.catalogType.startsWith('catalog_') ? ref.catalogType : `catalog_${ref.catalogType}`
    );
  });
  for (const ct of types) {
    try {
      ensureCatalogCacheFromLocalStorage(ct);
      findCatalogItemInRoomStorage(ct, 1);
    } catch (_) {}
  }
  const fillItem = resolveFillCatalogItemFromClodisRoots(roots);
  if (!fillItem) {
    console.warn(
      '[FILL-CATALOG] Не найден catalog_38/37 для наполнения в clodis — проверьте «Выгрузить в конструктор» и catalog_38 в localStorage'
    );
  }
  return fillItem;
}

function shouldSkipRoomShelfStackOnRoots(roots, catalogItem) {
  const rootsArr = Array.isArray(roots) ? roots : roots ? [roots] : [];
  if (treeHasNestedFillCatalogModule(rootsArr)) return true;
  if (resolveFillCatalogItemFromClodisRoots(rootsArr)) return true;
  const ct = catalogItem
    ? normalizeCatalogTypeId(
        catalogItem.catalog_type ?? catalogItem.catalogType ?? catalogItem.data?.catalog_type ?? ''
      )
    : '';
  return ct === '38' || ct === '37' || ct === '29';
}

function applyRoomInteriorAndShelfStack(roots, opts = {}) {
  const catalogItem = opts.catalogItem || opts.furnitureData?.catalogItem || opts.furnitureData;
  if (shouldSkipRoomShelfStackOnRoots(roots, catalogItem)) {
    logShelfCount('room/skip-fill-in-builder', {
      phase: opts.debugPhase || 'place',
      reason: 'nested-fill-or-fill-catalog',
      catalogType: catalogItem
        ? normalizeCatalogTypeId(
            catalogItem.catalog_type ?? catalogItem.catalogType ?? catalogItem.data?.catalog_type ?? ''
          )
        : '',
    });
    return false;
  }

  const interiorLayout = extractInteriorLayoutFromCatalogItem(catalogItem);
  const shelfStackPolicy = opts.shelfStackPolicy ?? resolveShelfStackPolicyForFurnitureData(opts.furnitureData);
  const ct = catalogItem
    ? normalizeCatalogTypeId(
        catalogItem.catalog_type ?? catalogItem.catalogType ?? catalogItem.data?.catalog_type ?? ''
      )
    : '';
  const applyOnRoots = shouldApplyShelfStackOnRoomRoots(opts);
  const shelvesBefore = countShelfLikeNodesInTree(roots);

  logShelfCount('room/pre-build', {
    phase: opts.debugPhase || 'place',
    catalogType: ct,
    catalogName: catalogItem?.name ?? catalogItem?.data?.name ?? '',
    sectionSizeY: opts.sectionSizeMm?.y,
    corpus_antresol_mm: opts.variables?.corpus_antresol_mm,
    h_bottom: opts.variables?.h_bottom,
    shelvesInClodisBefore: shelvesBefore,
    hasInteriorZones: shouldApplyInteriorLayoutForCatalog(interiorLayout),
    applyShelfStackOnRoots: applyOnRoots,
    shelfStackPolicy,
  });

  let changed = false;

  // Наполнение catalog_27/38 — только в ClodisBuilder.buildModule (не пишем template_tree в clodis roots:
  // иначе ломается позиция/привязка к секции при rebuild).

  if (shouldApplyInteriorLayoutForCatalog(interiorLayout)) {
    try {
      changed =
        applyInteriorFillToRoomRoots(roots, {
          layout: interiorLayout,
          policy: shelfStackPolicy,
          sectionSizeMm: opts.sectionSizeMm,
          variables: opts.variables,
          corpusLocalFill: true,
          catalogItem,
          findCatalogItem: findCatalogItemInRoomStorage,
        }) || changed;
    } catch (e) {
      console.warn('[INTERIOR-LAYOUT] room apply failed', e);
    }
  } else if (shelfStackPolicy && shouldApplyShelfStackOnRoomRoots(opts)) {
    try {
      const resolvedPolicy = resolveShelfLayoutPolicy(shelfStackPolicy, {
        fullHeightShelvesOnly: isFullHeightShelvesOnlyLayout(interiorLayout),
        fiftyFiftyZone: false,
      });
      const preserveManualShelves =
        resolvedPolicy?.distribution !== 'even' && resolvedPolicy?.distribution !== 'even_fixed';
      changed =
        applyShelfStackPolicyToRoots(roots, {
          policy: shelfStackPolicy,
          interiorLayout,
          sectionSizeMm: opts.sectionSizeMm,
          variables: opts.variables,
          preserveManualShelves,
          debugTag: `room/${opts.debugPhase || 'place'}`,
        }) || changed;
    } catch (e) {
      console.warn('[INTERIOR-LAYOUT] room apply failed', e);
    }
  } else {
    logShelfCount('room/skip-shelf-stack-on-roots', {
      phase: opts.debugPhase || 'place',
      reason: !shelfStackPolicy ? 'no-policy' : 'shell-catalog-26',
      catalogType: ct,
    });
  }

  logShelfCount('room/post-build', {
    phase: opts.debugPhase || 'place',
    changed,
    shelvesInClodisAfter: countShelfLikeNodesInTree(roots),
  });

  return changed;
}

function resolvePlacementKindFromFurnitureData(furnitureData) {
  return mapPlacementKindViaRoomProfiles(getRawPlacementKindFromFurnitureData(furnitureData));
}

function resolveProductKindForFurnitureData(furnitureData) {
  if (furnitureData?.productKind) return furnitureData.productKind;
  const raw = getRawPlacementKindFromFurnitureData(furnitureData);
  try {
    const cfg =
      typeof window !== 'undefined' && typeof window.getRoomStepsConfig === 'function'
        ? window.getRoomStepsConfig()
        : null;
    const api = typeof window !== 'undefined' ? window.__cldPlacementKindProfiles : null;
    if (api && typeof api.resolveProductKindForPlacement === 'function') {
      return api.resolveProductKindForPlacement(raw, cfg);
    }
  } catch (_) {}
  if (
    typeof window !== 'undefined' &&
    window.__cldHingeLayout &&
    typeof window.__cldHingeLayout.placementKindToProductKind === 'function'
  ) {
    return window.__cldHingeLayout.placementKindToProductKind(
      resolvePlacementKindFromFurnitureData(furnitureData)
    );
  }
  return undefined;
}

function getCatalogDataObject(item) {
  if (!item) return {};
  const raw = item.data;
  if (raw && typeof raw === 'object') return raw;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {}
  }
  return {};
}

function getCatalogDimensionMm(item, key) {
  if (!item || typeof item !== 'object') return null;
  const axis =
    key === 'width' ? 'x' : key === 'height' ? 'y' : key === 'depth' ? 'z' : key;
  const ss = item.params && item.params.sectionSize;
  if (ss && typeof ss === 'object') {
    const v = ss[axis];
    const nv = typeof v === 'number' ? v : parseFloat(v);
    if (Number.isFinite(nv) && nv > 0) return nv;
  }
  const d = getCatalogDataObject(item);
  const raw = item?.[key] ?? d?.[key];
  const n = typeof raw === 'number' ? raw : parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Каркас секции, если в localStorage нет дерева (только размеры). Согласовано с export_all на сервере. */
function buildMinimalCatalogClodisJSON(widthMm, heightMm, depthMm, stableId) {
  const x = Math.max(1, Math.round(Number(widthMm) || 600));
  const y = Math.max(1, Math.round(Number(heightMm) || 2400));
  const z = Math.max(1, Math.round(Number(depthMm) || 600));
  const sid =
    stableId != null && String(stableId).trim() !== ''
      ? String(stableId)
      : 'noid';
  return [
    {
      type: 'section',
      id: 'cld_fallback_section_' + sid + '_' + x + '_' + y + '_' + z,
      name: 'Секция',
      originalType: 'section',
      hide_when_filled: false,
      active: true,
      article: '',
      children: [],
      accessories: [],
      size: { x, y, z },
      position: { x: 0, y: 0, z: 0 },
      anchor: { x: -1, y: -1, z: -1 },
      rotation: { x: 0, y: 0, z: 0 },
      layout_role: 'cabinet_root',
      comments: '',
      events: {},
    },
  ];
}

function resolveClodisJSONForCatalogGridItem(item) {
  if (!item || typeof item !== 'object') return { plan: null, fromFallback: false };
  let plan = readClodisJSON(item) ?? readClodisJSON(getCatalogDataObject(item));
  if (typeof plan === 'string') {
    try {
      plan = JSON.parse(plan);
    } catch (_) {
      plan = null;
    }
  }
  if (Array.isArray(plan) && plan.length > 0) {
    return { plan, fromFallback: false };
  }
  if (plan && typeof plan === 'object' && !Array.isArray(plan)) {
    return { plan: [plan], fromFallback: false };
  }
  const w = getCatalogDimensionMm(item, 'width');
  const h = getCatalogDimensionMm(item, 'height');
  const d = getCatalogDimensionMm(item, 'depth');
  if (w && h && d) {
    return {
      plan: buildMinimalCatalogClodisJSON(w, h, d, item.id),
      fromFallback: true,
    };
  }
  return { plan: null, fromFallback: false };
}

function __restoreDebugColorsOnMeshMaterials(obj) {
  if (!obj || !obj.isMesh) return;
  const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
  mats.forEach((m) => {
    if (!m || !m.userData || !m.userData.__cldDbgOrig) return;
    const o = m.userData.__cldDbgOrig;
    try {
      if (
        o.colorHex != null &&
        m.color &&
        typeof m.color.setHex === 'function' &&
        Number.isFinite(o.colorHex)
      ) {
        m.color.setHex(o.colorHex);
      }
      if (typeof o.opacity === 'number') m.opacity = o.opacity;
      if (typeof o.transparent === 'boolean') m.transparent = o.transparent;
      if (typeof o.depthWrite === 'boolean') m.depthWrite = o.depthWrite;
      m.needsUpdate = true;
    } catch (_) {}
    delete m.userData.__cldDbgOrig;
  });
}

/** Угловой НМ (catalog_44 / kitchen_base_corner) — для отладочной раскраски. */
function __isCornerNmFurnitureRoot(root) {
  if (!root?.userData) return false;
  const ud = root.userData;
  if (ud.isFurniture !== true) return false;
  const pk = String(
    ud.__placementKindProfileId || ud.__placementKind || ud.placementKind || ''
  )
    .trim()
    .toLowerCase();
  if (pk === 'kitchen_base_corner') return true;
  try {
    if (
      isLCornerCabinetModule({
        catalogItem: ud.catalogItem || null,
        catalogType: ud.catalogType || ud.catalog_type,
        name: ud.catalogName || ud.name,
        placementKind: pk,
      })
    ) {
      return true;
    }
  } catch (_) {}
  return false;
}

function __applyDebugColorsToFurnitureParts(root) {
  const globalOn =
    typeof window !== 'undefined' && window.DEBUG_COLOR_FURNITURE_PARTS === true;
  // Только по флагу: window.__cldTintCornerNm = true (иначе розовая «хуета» на place).
  const cornerTintOn =
    typeof window !== 'undefined' && window.__cldTintCornerNm === true;
  if (!root) return;

  const isCorner = __isCornerNmFurnitureRoot(root);
  const enabled = globalOn || (cornerTintOn && isCorner);

  if (!enabled) {
    // Не трогаем обычные НМ; угловой при выключенном флаге — снять tint.
    if (isCorner && root.userData?.__cldCornerNmTintApplied) {
      root.traverse((obj) => __restoreDebugColorsOnMeshMaterials(obj));
      delete root.userData.__cldCornerNmTintApplied;
    }
    return;
  }

  const opacity =
    typeof window !== 'undefined' && Number.isFinite(window.DEBUG_COLOR_FURNITURE_OPACITY)
      ? window.DEBUG_COLOR_FURNITURE_OPACITY
      : 0.4;

  const roleToColor = {
    plinth: 0x00ccff, // циан — цоколь
    corpus: 0xff33cc, // магента — корпус (нога фасада)
    corpus_antresol: 0xcc66ff,
    top: 0xffcc00, // жёлтый
    cabinet_root: 0x9acd32,
    service: 0x66bb6a,
    wall_hung_body: 0xcccccc,
    corner_return: 0xff8800, // оранжевый — возврат угла (return)
    corner_post: 0xff2222, // красный — угловая планка / нащельник
  };

  if (isCorner) root.userData.__cldCornerNmTintApplied = true;

  root.traverse((obj) => {
    if (!obj || !obj.isMesh) return;
    // Находим ближайшую вложенную секцию по userData.isSection
    let cur = obj.parent;
    let role = '';
    while (cur) {
      const ud = cur.userData;
      if (ud && ud.isSection) {
        role = ud.layoutRole || '';
        break;
      }
      cur = cur.parent;
    }

    const hex = roleToColor[role] ?? 0x00ff66;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach((m) => {
      if (!m) return;
      if (!m.userData) m.userData = {};
      if (!m.userData.__cldDbgOrig) {
        let colorHex = null;
        try {
          if (m.color && typeof m.color.getHex === 'function') colorHex = m.color.getHex();
        } catch (_) {}
        m.userData.__cldDbgOrig = {
          colorHex,
          opacity: typeof m.opacity === 'number' ? m.opacity : 1,
          transparent: !!m.transparent,
          depthWrite: m.depthWrite !== false,
        };
      }
      if (m.color && typeof m.color.setHex === 'function') {
        m.color.setHex(hex);
      }
      m.transparent = true;
      m.opacity = opacity;
      // Чтобы не закрывать мебель внутри при полу-прозрачности.
      m.depthWrite = false;
      m.needsUpdate = true;
    });
  });
}

/**
 * Перекрасить уже размещённую мебель по layout_role (если включён флаг DEBUG_COLOR_FURNITURE_PARTS).
 */
export function reapplyDebugColorsToFurnitureParts() {
  try {
    __applyDebugColorsToFurnitureParts(state.furniture?.group || null);
    if (state.scene) {
      state.scene.traverse((obj) => {
        if (!obj || !obj.userData || !obj.userData.isFurniture) return;
        if (obj.isGroup) __applyDebugColorsToFurnitureParts(obj);
      });
    }
    syncCabinetPivotDebugVisibility();
  } catch (_) {}
}

/** Консоль: __cldTintCornerNmFurniture() — перекрасить угловые НМ в сцене. */
if (typeof window !== 'undefined') {
  window.__cldTintCornerNmFurniture = function __cldTintCornerNmFurniture() {
    window.__cldTintCornerNm = true;
    reapplyDebugColorsToFurnitureParts();
    console.warn('[L-CORNER] tint corner NM: magenta=corpus, orange=corner_return, red=corner_post, cyan=plinth');
  };
}

/** Только слот приставки — оранжевый полупрозрачный (корпус не трогаем). */
function __tintKitchenCornerReturnSlot(root) {
  if (!root) return;
  const hex = 0xff8800;
  const opacity = 0.45;
  root.traverse((obj) => {
    if (!obj?.isMesh) return;
    // Ищем layout_role=corner_return среди предков (live-модуль внутри тоже).
    let cur = obj.parent;
    let underReturn = false;
    while (cur && cur !== root) {
      if (cur.userData?.isFurniture && cur !== root) break;
      if (
        cur.userData?.isSection &&
        String(cur.userData.layoutRole || '') === 'corner_return'
      ) {
        underReturn = true;
        break;
      }
      cur = cur.parent;
    }
    if (!underReturn) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach((m) => {
      if (!m) return;
      if (!m.userData) m.userData = {};
      if (!m.userData.__cldDbgOrig) {
        let colorHex = null;
        try {
          if (m.color && typeof m.color.getHex === 'function') colorHex = m.color.getHex();
        } catch (_) {}
        m.userData.__cldDbgOrig = {
          colorHex,
          opacity: typeof m.opacity === 'number' ? m.opacity : 1,
          transparent: !!m.transparent,
          depthWrite: m.depthWrite !== false,
        };
      }
      try {
        if (m.color && typeof m.color.setHex === 'function') m.color.setHex(hex);
      } catch (_) {}
      m.transparent = true;
      m.opacity = opacity;
      m.depthWrite = false;
      m.needsUpdate = true;
    });
  });
}

// --- Price calculation (LDSP only for now) ---
const __materialPriceCache = new Map(); // key = `${type}:${id}` -> { price_per_m2 }
const __edgePriceCache = new Map(); // key = `${type}:${id}` -> { price_per_mp }
const __defaultEdgeByMaterialId = new Map(); // materialId -> { edgeId, edgeType }
let __ldspDefaultMaterialId = null;
// Pricing for section facade planks/overlays (trim)
let __sectionFacadeTrimPricing = {
  // full computed for all sections + shown (only sections with furniture)
  totalRubAll: 0,
  totalRubShown: 0,
  bySection: {}, // sectionId -> { totalRub, areaM2, edgeLengthMp, parts }
  areaM2All: 0,
  areaM2Shown: 0,
  edgeLengthMpAll: 0,
  edgeLengthMpShown: 0,
  partsAll: 0,
  partsShown: 0,
  materialId: null,
  edgeId: null,
  pricePerM2: 0,
  edgePricePerMp: 0,
};

function __mmToMeters(v) {
  const n = Number(v);
  if (!isFinite(n)) return 0;
  // ВАЖНО: параметры BoxGeometry в этом проекте задаются в миллиметрах.
  // Никаких эвристик: даже 8мм после scale — это миллиметры, а не метры.
  return n / 1000;
}

function __calcPanelAreaM2FromBox(geom) {
  if (!geom || !geom.parameters) return 0;
  const w = __mmToMeters(Number(geom.parameters.width || 0));
  const h = __mmToMeters(Number(geom.parameters.height || 0));
  const d = __mmToMeters(Number(geom.parameters.depth || 0));
  const dims = [w, h, d].filter((x) => x > 0);
  if (dims.length < 2) return 0;
  // Assume sheet goods: smallest dimension is thickness -> area = product of other two
  dims.sort((a, b) => a - b);
  const a = dims[dims.length - 1];
  const b = dims[dims.length - 2];
  const area = a * b;
  return isFinite(area) ? area : 0;
}

function __calcPanelAreaM2FromBoxMesh(mesh) {
  if (!mesh || !mesh.isMesh) return 0;
  const geom = mesh.geometry;
  if (!geom || !geom.parameters) return 0;
  const pW = Number(geom.parameters.width || 0);
  const pH = Number(geom.parameters.height || 0);
  const pD = Number(geom.parameters.depth || 0);
  if (!isFinite(pW) || !isFinite(pH) || !isFinite(pD)) return 0;

  // ВАЖНО: при изменении размеров модулей мы масштабируем группу (scale),
  // поэтому для расчёта площади нужно учитывать МИРОВОЙ scale меша.
  const s = new THREE.Vector3(1, 1, 1);
  try {
    mesh.getWorldScale(s);
  } catch (_) {}
  const w = __mmToMeters(Math.abs(pW * (Number(s.x) || 1)));
  const h = __mmToMeters(Math.abs(pH * (Number(s.y) || 1)));
  const d = __mmToMeters(Math.abs(pD * (Number(s.z) || 1)));

  const dims = [w, h, d].filter((x) => x > 0);
  if (dims.length < 2) return 0;
  dims.sort((a, b) => a - b);
  const a = dims[dims.length - 1];
  const b = dims[dims.length - 2];
  const area = a * b;
  return isFinite(area) ? area : 0;
}

function __sumFurnitureLdspAreaM2(furnitureGroup) {
  if (!furnitureGroup) return 0;
  let area = 0;
  let anyPanel = false;
  furnitureGroup.traverse((obj) => {
    if (!obj || !obj.isMesh) return;
    const ud = obj.userData || {};
    // Skip non-body helpers
    if (ud.isWallAo || ud.isContactShadow) return;
    // For now exclude facades: LDSP корпус в первую очередь
    if (ud.isFacade) return;
    const geom = obj.geometry;
    if (!geom) return;
    // Only BoxGeometry-like panels for now
    if (geom.type === 'BoxGeometry' || geom.type === 'BoxBufferGeometry') {
      const a = __calcPanelAreaM2FromBoxMesh(obj);
      if (a > 0) anyPanel = true;
      area += a;
    }
  });

  // Надёжный fallback: если панели не размечены/не BoxGeometry, считаем площадь по габаритам шкафа.
  // Это гарантирует, что глубина/ширина/высота всегда влияют на цену.
  if (!anyPanel || area <= 0) {
    try {
      const bb = new THREE.Box3();
      let has = false;
      furnitureGroup.traverse((obj) => {
        if (!obj || !obj.isMesh) return;
        const ud = obj.userData || {};
        if (ud.isWallAo || ud.isContactShadow || ud.isShelfProp || ud.isRodCompanion) return;
        if (ud.isFacade) return;
        if (obj.name && (obj.name.includes('PivotMarker') || obj.name.includes('BBox'))) return;
        const b = new THREE.Box3().setFromObject(obj);
        if (!has) {
          bb.copy(b);
          has = true;
        } else {
          bb.union(b);
        }
      });
      if (!has) bb.setFromObject(furnitureGroup);
      const size = bb.getSize(new THREE.Vector3());
      const w = Number(size.x) || 0;
      const h = Number(size.y) || 0;
      const d = Number(size.z) || 0;
      const surfaceMm2 = 2 * (w * h + w * d + h * d);
      const surfaceM2 = surfaceMm2 / 1_000_000;
      return isFinite(surfaceM2) && surfaceM2 > 0 ? surfaceM2 : 0;
    } catch (e) {
      return 0;
    }
  }

  return area;
}

function __safeEvalArithmetic(expr) {
  const s = String(expr || '').trim();
  if (!s) return NaN;
  // Разрешаем только числа/арифметику/скобки/пробелы/точку
  if (!/^[0-9+\-*/().\s]+$/.test(s)) return NaN;
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(`return (${s});`);
    const v = Number(fn());
    return Number.isFinite(v) ? v : NaN;
  } catch (_) {
    return NaN;
  }
}

function __resolveSizeComponentMm(v, sectionSizeMm) {
  if (v == null) return NaN;
  if (typeof v === 'number') return v;
  const s0 = String(v).trim();
  if (!s0) return NaN;
  // Поддержка простых ссылок Clodis: @section.width/height/depth
  const s = s0
    .replace(/@section\.width/g, String(Number(sectionSizeMm?.x || 0)))
    .replace(/@section\.height/g, String(Number(sectionSizeMm?.y || 0)))
    .replace(/@section\.depth/g, String(Number(sectionSizeMm?.z || 0)));
  const num = Number(s);
  if (Number.isFinite(num)) return num;
  const evaled = __safeEvalArithmetic(s);
  return Number.isFinite(evaled) ? evaled : NaN;
}

function __getGroupSizeMmNoAo(group) {
  try {
    const bb = computeFurnitureWorldBBoxNoAo(group);
    const size = bb.getSize(new THREE.Vector3());
    return {
      x: Math.abs(Number(size.x) || 0),
      y: Math.abs(Number(size.y) || 0),
      z: Math.abs(Number(size.z) || 0),
    };
  } catch (_) {
    return { x: 0, y: 0, z: 0 };
  }
}

function __walkClodisNodes(node, cb) {
  if (!node || typeof node !== 'object') return;
  cb(node);
  const kids = node.children;
  if (Array.isArray(kids)) kids.forEach((k) => __walkClodisNodes(k, cb));
}

function __getStep5FacadeBottomOffsetMm() {
  // Значение берём из вкладки «Параметры» шага 5 (кнопки-варианты), key=room_step5_params_selection.
  try {
    const raw = localStorage.getItem('room_step5_params_selection');
    const map = raw ? JSON.parse(raw) : null;
    if (!map || typeof map !== 'object') return null;
    const keys = Object.keys(map);
    const toNum = (s) => {
      const m = String(s || '').match(/-?\d+([.,]\d+)?/);
      if (!m) return NaN;
      return Number(String(m[0]).replace(',', '.'));
    };
    // 1) Приоритет: ключи, похожие на «расстояние/отступ/двер/фасад»
    const pri = keys.filter((k) => /расстоя|отступ|двер|фасад|distance|offset|facade|door/i.test(String(k)));
    for (const k of pri) {
      const n = toNum(map[k]);
      if (Number.isFinite(n) && n >= 0 && n <= 500) return n;
    }
    // 2) fallback: любое число из значений
    for (const k of keys) {
      const n = toNum(map[k]);
      if (Number.isFinite(n) && n >= 0 && n <= 500) return n;
    }
  } catch (_) {}
  return null;
}

function __applyFacadeBottomOffsetToClodis(node, bottomOffsetMm) {
  if (!node || typeof node !== 'object' || !Number.isFinite(bottomOffsetMm)) return;
  const topGapMm = 1.5; // тех. зазор сверху как в текущей логике
  const getRole = (nd) => String(nd?.layout_role ?? nd?.sectionLayoutRole ?? '').trim().toLowerCase();
  const nodeLooksLikeFacade = (nd) => {
    if (!nd || typeof nd !== 'object') return false;
    const t = String(nd.type || '').trim().toLowerCase();
    if (t === 'facade') return true;
    const name = String(nd.name || '').trim().toLowerCase();
    if (/фасад|facade/.test(name)) return true;
    const spec = nd.spec || {};
    return String(spec.orientation || '').toLowerCase() === 'f';
  };
  const visit = (nd, inFacadesRole) => {
    if (!nd || typeof nd !== 'object') return;
    const role = getRole(nd);
    const inFacades = inFacadesRole || role === 'facades';
    if ((inFacades && nodeLooksLikeFacade(nd)) || (inFacadesRole && nodeLooksLikeFacade(nd))) {
      nd.pos = nd.pos && typeof nd.pos === 'object' ? nd.pos : {};
      nd.size = nd.size && typeof nd.size === 'object' ? nd.size : {};
      // В режиме "навиcание от цоколя" не трогаем X/ширину — только Y.
      nd.pos.y = Number(bottomOffsetMm);
      nd.size.y = `s:y - ${Number(bottomOffsetMm) + topGapMm}`;
    }
    if (Array.isArray(nd.children)) nd.children.forEach((ch) => visit(ch, inFacades));
  };
  visit(node, false);
}

function __clodisHasPlinth(node) {
  let found = false;
  const getRole = (nd) => String(nd?.layout_role ?? nd?.sectionLayoutRole ?? '').trim().toLowerCase();
  __walkClodisNodes(node, (nd) => {
    if (found || !nd || typeof nd !== 'object') return;
    const role = getRole(nd);
    const type = String(nd.type || '').trim().toLowerCase();
    const name = String(nd.name || '').trim().toLowerCase();
    // Основной критерий — layout_role=plinth; fallback для старых шаблонов — секция "уезжать".
    if (role === 'plinth' || (type === 'section' && /цоколь|plinth/.test(name))) {
      found = true;
    }
  });
  return found;
}

function __applyFacadeDefaultGaps15ToClodis(node) {
  if (!node || typeof node !== 'object') return;
  const sideGapMm = 1.5;
  const topGapMm = 1.5;
  const getRole = (nd) => String(nd?.layout_role ?? nd?.sectionLayoutRole ?? '').trim().toLowerCase();
  const nodeLooksLikeFacade = (nd) => {
    if (!nd || typeof nd !== 'object') return false;
    const t = String(nd.type || '').trim().toLowerCase();
    if (t === 'facade') return true;
    const name = String(nd.name || '').trim().toLowerCase();
    if (/фасад|facade/.test(name)) return true;
    const spec = nd.spec || {};
    return String(spec.orientation || '').toLowerCase() === 'f';
  };
  const visit = (nd, inFacadesRole) => {
    if (!nd || typeof nd !== 'object') return;
    const role = getRole(nd);
    const inFacades = inFacadesRole || role === 'facades';
    if (inFacades && nodeLooksLikeFacade(nd)) {
      nd.pos = nd.pos && typeof nd.pos === 'object' ? nd.pos : {};
      nd.size = nd.size && typeof nd.size === 'object' ? nd.size : {};
      // Для модулей без цоколя фасад всегда 1.5 мм по периметру.
      nd.pos.x = Number(sideGapMm);
      nd.pos.y = Number(sideGapMm);
      nd.size.x = `s:x - ${Number(sideGapMm) * 2}`;
      nd.size.y = `s:y - ${Number(sideGapMm) + Number(topGapMm)}`;
    }
    if (Array.isArray(nd.children)) nd.children.forEach((ch) => visit(ch, inFacades));
  };
  visit(node, false);
}

function __computeEdgeLengthFromClodis(group) {
  const ud = group?.userData || {};
  const root = readUserDataClodisData(ud);
  if (!root || typeof root !== 'object') return null;

  // Используем текущие габариты группы как "section.*" для подстановки в выражения размеров
  const sectionSizeMm = __getGroupSizeMmNoAo(group);
  const byEdge = new Map(); // edgeId(number) -> lengthMp(number)

  __walkClodisNodes(root, (nd) => {
    const edges = nd.edges;
    if (!edges || typeof edges !== 'object') return;
    // Размер детали (мм)
    const sz = nd.size || {};
    const sx = __resolveSizeComponentMm(sz.x ?? sz.width, sectionSizeMm);
    const sy = __resolveSizeComponentMm(sz.y ?? sz.height, sectionSizeMm);
    const szv = __resolveSizeComponentMm(sz.z ?? sz.depth, sectionSizeMm);
    if (!Number.isFinite(sx) || !Number.isFinite(sy) || !Number.isFinite(szv)) return;
    // Находим две самые большие размерности (лицевая плоскость), в метрах
    const dimsM = [__mmToMeters(sx), __mmToMeters(sy), __mmToMeters(szv)].filter((x) => x > 0);
    if (dimsM.length < 2) return;
    dimsM.sort((a, b) => a - b);
    const faceSmall = dimsM[dimsM.length - 2];
    const faceLarge = dimsM[dimsM.length - 1];

    for (let i = 1; i <= 4; i++) {
      const e = edges[i];
      if (!e || !e.enabled) continue;
      const edgeIdNum = Number(e.edge_id ?? e.decor_id ?? 0) || 0;
      if (!edgeIdNum) continue;
      // Маппинг как в UI: 1/2 — короткая сторона (верх/низ), 3/4 — длинная (лево/право)
      const len = (i === 1 || i === 2) ? faceSmall : faceLarge;
      if (!Number.isFinite(len) || len <= 0) continue;
      byEdge.set(edgeIdNum, (byEdge.get(edgeIdNum) || 0) + len);
    }
  });

  let total = 0;
  const breakdown = [];
  byEdge.forEach((len, edgeId) => {
    total += Number(len) || 0;
    breakdown.push({ edgeId, lengthMp: Number(len) || 0 });
  });
  breakdown.sort((a, b) => (b.lengthMp || 0) - (a.lengthMp || 0));

  return { totalMp: total, breakdown, sectionSizeMm };
}

function __sumFurnitureEdgeLengthMp(furnitureGroup) {
  if (!furnitureGroup) return 0;
  let totalMeters = 0;
  const parts = [];
  furnitureGroup.traverse((obj) => {
    if (!obj || !obj.isMesh) return;
    const ud = obj.userData || {};
    if (ud.isWallAo || ud.isContactShadow) return;
    if (ud.isFacade) return;
    const geom = obj.geometry;
    if (!geom) return;
    if (geom.type === 'BoxGeometry' || geom.type === 'BoxBufferGeometry') {
      const pW = Number(geom.parameters?.width || 0);
      const pH = Number(geom.parameters?.height || 0);
      const pD = Number(geom.parameters?.depth || 0);
      if (!isFinite(pW) || !isFinite(pH) || !isFinite(pD)) return;
      const s = new THREE.Vector3(1, 1, 1);
      try { obj.getWorldScale(s); } catch (_) {}
      const w = __mmToMeters(Math.abs(pW * (Number(s.x) || 1)));
      const h = __mmToMeters(Math.abs(pH * (Number(s.y) || 1)));
      const d = __mmToMeters(Math.abs(pD * (Number(s.z) || 1)));
      const dims = [w, h, d].filter((x) => x > 0);
      if (dims.length < 2) return;
      dims.sort((a, b) => a - b);
      const a = dims[dims.length - 1];
      const b = dims[dims.length - 2];
      const perim = 2 * (a + b); // погонные метры кромки вокруг детали
      if (isFinite(perim) && perim > 0) {
        totalMeters += perim;
        // Для отладки собираем вклад топ-деталей (чтобы понять, откуда "накапало" метров)
        if (typeof window !== 'undefined' && window.__CLD_DEBUG) {
          parts.push({
            name: (obj.name || '').toString(),
            uuid: obj.uuid,
            perim,
            a,
            b,
            w,
            h,
            d
          });
        }
      }
    }
  });
  if (typeof window !== 'undefined' && window.__CLD_DEBUG) {
    try {
      parts.sort((p1, p2) => (p2.perim || 0) - (p1.perim || 0));
      const top = parts.slice(0, 12).map((p) => ({
        perim_m: Number(p.perim.toFixed(3)),
        a_m: Number(p.a.toFixed(3)),
        b_m: Number(p.b.toFixed(3)),
        dims_m: [p.w, p.h, p.d].map((x) => Number((x || 0).toFixed(3))),
        name: p.name,
      }));
      __cldPriceLog('[PRICE][EDGE][LEN] edgeLengthMp breakdown:', {
        total_m: Number(totalMeters.toFixed(3)),
        parts_count: parts.length,
        top
      });
    } catch (e) {}
  }
  return totalMeters;
}

/** Ценовые логи: ?priceDbg=1 или window.__CLD_DEBUG_PRICE = true */
function __cldPriceLog(...args) {
  if (typeof window === 'undefined' || window.__CLD_DEBUG_PRICE !== true) return;
  try {
    console.log(...args);
  } catch (_) {}
}

async function __getLdspPricePerM2(materialId) {
  const id = Number(materialId) || 0;
  if (!id) return 0;
  const key = `material_2:${id}`;
  if (__materialPriceCache.has(key)) return __materialPriceCache.get(key);
  try {
    __cldPriceLog('[PRICE] Fetch LDSP material:', { type: 'material_2', id });
    const resp = await fetch(`/api/catalog/item/material_2/${encodeURIComponent(String(id))}?t=${Date.now()}`, { cache: 'no-store' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const item = await resp.json();
    // Цена может храниться либо как price_per_m2 (старый/упрощённый формат),
    // либо внутри material_variants[0].price (формат "Варианты" в админке).
    const v0 = Array.isArray(item?.material_variants) ? item.material_variants[0] : (Array.isArray(item?.variants) ? item.variants[0] : null);
    const p = Number(
      item?.price_per_m2 ??
        item?.pricePerM2 ??
        item?.price ??
        v0?.price ??
        0
    ) || 0;
    __cldPriceLog('[PRICE] LDSP price resolved:', {
      id,
      price_per_m2: item?.price_per_m2,
      pricePerM2: item?.pricePerM2,
      price: item?.price,
      variant0_price: v0?.price,
      resolved: p,
      name: item?.name
    });
    // Кромка по умолчанию — из edge_ids карточки material_2 (толщина варианта — при отрисовке).
    try {
      const edgeIds = item.edge_ids || item.edgeIds || [];
      const eid = Array.isArray(edgeIds) && edgeIds.length ? Number(edgeIds[0]) || 0 : 0;
      if (eid) {
        __defaultEdgeByMaterialId.set(id, { edgeId: eid, edgeType: 'butt_butts' });
      }
    } catch (_) {}
    __materialPriceCache.set(key, p);
    return p;
  } catch (e) {
    console.warn('[PRICE] Failed to fetch LDSP material price:', { id, error: e?.message || e });
    __materialPriceCache.set(key, 0);
    return 0;
  }
}

async function __getEdgePricePerMp(edgeId, edgeTypeKey, variantIndex) {
  const id = Number(edgeId) || 0;
  if (!id) return 0;
  const type = edgeTypeKey && String(edgeTypeKey).trim() ? String(edgeTypeKey).trim() : 'butt_butts';
  let vi =
    variantIndex != null && variantIndex !== '' && Number.isFinite(Number(variantIndex))
      ? Number(variantIndex)
      : 0;
  const cacheKey = `${type}:${id}:${vi}`;
  if (__edgePriceCache.has(cacheKey)) return __edgePriceCache.get(cacheKey);
  try {
    __cldPriceLog('[PRICE][EDGE] Fetch edge:', { type, id, variantIndex: vi });
    const resp = await fetch(`/api/catalog/item/${encodeURIComponent(type)}/${encodeURIComponent(String(id))}?t=${Date.now()}`, { cache: 'no-store' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const item = await resp.json();
    const variants = getEdgeVariantsFromItem(item);
    vi = resolveEdgeVariantIndex(item, { variantId: vi });
    const v = variants[vi] || variants[0] || null;
    const p = Number(v?.price ?? item?.price_per_mp ?? item?.pricePerMp ?? item?.price ?? 0) || 0;
    __cldPriceLog('[PRICE][EDGE] Edge price resolved per_mp:', {
      id,
      type,
      variantIndex: vi,
      variant_price: v?.price,
      price_per_mp: item?.price_per_mp,
      pricePerMp: item?.pricePerMp,
      price: item?.price,
      resolved: p,
      name: item?.name
    });
    __edgePriceCache.set(cacheKey, p);
    return p;
  } catch (e) {
    console.warn('[PRICE][EDGE] Failed to fetch edge price:', { edgeId: id, edgeTypeKey, variantIndex: vi, error: e?.message || e });
    __edgePriceCache.set(cacheKey, 0);
    return 0;
  }
}

async function __getDefaultLdspMaterialId() {
  if (__ldspDefaultMaterialId != null) return __ldspDefaultMaterialId;
  try {
    const resp = await fetch('/api/catalog/items_get/material_2?t=' + Date.now(), { cache: 'no-store' });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    const items = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);
    if (!items || !items.length) {
      __ldspDefaultMaterialId = null;
      return null;
    }
    // Дефолт: предпочитаем "Белый фасадный" (если есть), иначе "Белый", иначе первый.
    const norm = (s) => String(s || '').trim().toLowerCase();
    const foundFacadeWhite = items.find((it) => norm(it?.name).includes('белый') && norm(it?.name).includes('фасад'));
    const foundWhite = items.find((it) => norm(it?.name) === 'белый');
    const chosen = foundFacadeWhite || foundWhite || items[0];
    const id = chosen && chosen.id != null ? Number(chosen.id) : null;
    __ldspDefaultMaterialId = isFinite(id) ? id : null;
    __cldPriceLog('[PRICE] __getDefaultLdspMaterialId resolved:', {
      totalItems: items.length,
      foundFacadeWhite: foundFacadeWhite && { id: foundFacadeWhite.id, name: foundFacadeWhite.name },
      foundWhite: foundWhite && { id: foundWhite.id, name: foundWhite.name },
      chosen: chosen && { id: chosen.id, name: chosen.name },
      defaultId: __ldspDefaultMaterialId,
    });
    return __ldspDefaultMaterialId;
  } catch (e) {
    __ldspDefaultMaterialId = null;
    return null;
  }
}

function __getInsideLdspMaterialIdFromStep5Sync() {
  try {
    const sel = typeof window !== 'undefined' && typeof window.getStep5DecorSelection === 'function'
      ? window.getStep5DecorSelection()
      : null;
    const inside = sel?.inside;
    __cldPriceLog('[PRICE] Step5 selection (for LDSP inside):', sel, 'inside=', inside);
    if (inside && (inside.material_type === 'material_2' || inside.materialType === 'material_2')) {
      const mid = inside.material_id ?? inside.materialId;
      __cldPriceLog('[PRICE] Step5 inside LDSP material_id (from localStorage):', mid);
      return mid != null ? Number(mid) : null;
    }

    // Если выбор в localStorage ещё не сделан (пользователь не открывал шаг 5),
    // пробуем взять дефолт напрямую из room_steps_config (step5Defaults + круг).
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('room_steps_config') : null;
      if (raw) {
        const cfg = JSON.parse(raw);
        const steps = cfg && Array.isArray(cfg.steps) ? cfg.steps : [];
        const step5 = steps.find((s) => s && s.stepId === 5);
        if (step5) {
          const def = step5.step5Defaults || {};
          const defInsideId = def.insideId || def.defaultId || null;
          const outerColors = Array.isArray(step5.step5WheelOuter) ? step5.step5WheelOuter : [];
          const innerColors = Array.isArray(step5.step5WheelInner) ? step5.step5WheelInner : [];
          const allColors = outerColors.concat(innerColors);
          let color = null;
          if (defInsideId) {
            color = innerColors.find((c) => c && c.id === defInsideId)
              || allColors.find((c) => c && c.id === defInsideId);
          }
          // Если дефолт явно не задан или не найден по id — берём последний декор,
          // у которого есть привязанный материал. Это соответствует сценарию,
          // когда в круге несколько "фасадных" материалов и нужный стоит внизу.
          if (!color && allColors.length) {
            const withMat = allColors.filter((c) => c && (c.material_id != null || c.materialId != null));
            if (withMat.length) {
              color = withMat[withMat.length - 1];
            }
          }
          if (color && (color.material_id != null || color.materialId != null)) {
            const mid = color.material_id != null ? color.material_id : color.materialId;
            __cldPriceLog('[PRICE] Step5 inside LDSP material_id (from step5Defaults):', {
              defInsideId,
              colorId: color.id,
              colorName: color.name,
              materialId: mid,
            });
            return mid != null ? Number(mid) : null;
          }
        }
      }
    } catch (e2) {
      console.warn('[PRICE] Failed to resolve LDSP material from step5Defaults:', e2);
    }
  } catch (e) {
    console.warn('[PRICE] __getInsideLdspMaterialIdFromStep5Sync error:', e);
  }
  return null;
}

function __calcPerimeterMpFromBoxMesh(mesh) {
  if (!mesh || !mesh.isMesh) return 0;
  const geom = mesh.geometry;
  if (!geom || !geom.parameters) return 0;
  const pW = Number(geom.parameters.width || 0);
  const pH = Number(geom.parameters.height || 0);
  const pD = Number(geom.parameters.depth || 0);
  if (!isFinite(pW) || !isFinite(pH) || !isFinite(pD)) return 0;
  const s = new THREE.Vector3(1, 1, 1);
  try { mesh.getWorldScale(s); } catch (_) {}
  const w = __mmToMeters(Math.abs(pW * (Number(s.x) || 1)));
  const h = __mmToMeters(Math.abs(pH * (Number(s.y) || 1)));
  const d = __mmToMeters(Math.abs(pD * (Number(s.z) || 1)));
  const dims = [w, h, d].filter((x) => x > 0);
  if (dims.length < 2) return 0;
  dims.sort((a, b) => a - b);
  const a = dims[dims.length - 1];
  const b = dims[dims.length - 2];
  const perim = 2 * (a + b);
  return isFinite(perim) ? perim : 0;
}

function __getSectionIdFromObject(obj) {
  let p = obj;
  while (p) {
    const ud = p.userData || {};
    if (ud.sectionId != null) return String(ud.sectionId);
    if (ud.sectionId && ud.isCustomSection === true) return String(ud.sectionId);
    p = p.parent;
  }
  return null;
}

function __getTrimMeshLocalSizeMm(mesh) {
  const base = mesh?.userData?.cldTrimBaseSize;
  if (base && base.w > 0 && base.h > 0 && base.d > 0) {
    return { w: base.w, h: base.h, d: base.d };
  }
  const geom = mesh?.geometry;
  const p = geom?.parameters;
  if (p && (geom.type === 'BoxGeometry' || geom.type === 'BoxBufferGeometry')) {
    return {
      w: Number(p.width) || 0,
      h: Number(p.height) || 0,
      d: Number(p.depth) || 0,
    };
  }
  return null;
}

function __calcTrimMeshAreaM2(mesh) {
  const local = __getTrimMeshLocalSizeMm(mesh);
  if (!local) return __calcPanelAreaM2FromBoxMesh(mesh);
  const s = new THREE.Vector3(1, 1, 1);
  try {
    mesh.getWorldScale(s);
  } catch (_) {}
  const w = __mmToMeters(Math.abs(local.w * (Number(s.x) || 1)));
  const h = __mmToMeters(Math.abs(local.h * (Number(s.y) || 1)));
  const d = __mmToMeters(Math.abs(local.d * (Number(s.z) || 1)));
  const dims = [w, h, d].filter((x) => x > 0);
  if (dims.length < 2) return 0;
  dims.sort((a, b) => a - b);
  const area = dims[dims.length - 1] * dims[dims.length - 2];
  return isFinite(area) ? area : 0;
}

function __calcTrimMeshPerimeterMp(mesh) {
  const local = __getTrimMeshLocalSizeMm(mesh);
  if (!local) return __calcPerimeterMpFromBoxMesh(mesh);
  const s = new THREE.Vector3(1, 1, 1);
  try {
    mesh.getWorldScale(s);
  } catch (_) {}
  const w = __mmToMeters(Math.abs(local.w * (Number(s.x) || 1)));
  const h = __mmToMeters(Math.abs(local.h * (Number(s.y) || 1)));
  const d = __mmToMeters(Math.abs(local.d * (Number(s.z) || 1)));
  const dims = [w, h, d].filter((x) => x > 0);
  if (dims.length < 2) return 0;
  dims.sort((a, b) => a - b);
  const perim = 2 * (dims[dims.length - 1] + dims[dims.length - 2]);
  return isFinite(perim) ? perim : 0;
}

/** Детализация планок обклада: площадь/периметр + material_id + edge_id по декору планки. */
function __collectSectionFacadeTrimParts() {
  const parts = [];
  if (!state?.scene) return parts;
  let fallbackOutside = null;
  try {
    fallbackOutside =
      typeof window !== 'undefined' && typeof window.getStep5DecorSelection === 'function'
        ? window.getStep5DecorSelection()?.outside
        : null;
  } catch (_) {}

  state.scene.traverse((obj) => {
    if (!isSectionTrimFacadeMesh(obj) || obj.userData?.isEdge) return;
    const sectionId = __getSectionIdFromObject(obj);
    if (!sectionId) return;
    const decorId = obj.userData?.step5TrimDecorId || null;
    const binding = resolveSectionTrimBinding(decorId, { fallbackOutside });
    const materialId =
      obj.userData?.step5TrimMaterialId != null
        ? Number(obj.userData.step5TrimMaterialId)
        : binding.materialId;
    const areaM2 = __calcTrimMeshAreaM2(obj);
    const edgeLengthMp = __calcTrimMeshPerimeterMp(obj);
    if (!areaM2 && !edgeLengthMp) return;
    parts.push({
      sectionId,
      decorId: binding.decorId,
      materialId,
      edgeType: binding.edgeType,
      edgeId: binding.edgeId,
      edgeVariantId: binding.edgeVariantId,
      areaM2,
      edgeLengthMp,
    });
  });
  return parts;
}

function __sumSectionFacadeTrimBySection() {
  const out = { bySection: {}, areaM2All: 0, edgeLengthMpAll: 0, partsAll: 0 };
  const parts = __collectSectionFacadeTrimParts();
  parts.forEach((p) => {
    const sid = p.sectionId;
    if (!out.bySection[sid]) out.bySection[sid] = { areaM2: 0, edgeLengthMp: 0, parts: 0 };
    out.bySection[sid].areaM2 += p.areaM2;
    out.bySection[sid].edgeLengthMp += p.edgeLengthMp;
    out.bySection[sid].parts += 1;
    out.areaM2All += p.areaM2;
    out.edgeLengthMpAll += p.edgeLengthMp;
    out.partsAll += 1;
  });
  return out;
}

function __getOutsideLdspMaterialIdFromStep5Sync() {
  try {
    const sel = typeof window !== 'undefined' && typeof window.getStep5DecorSelection === 'function'
      ? window.getStep5DecorSelection()
      : null;
    const outside = sel?.outside;
    if (outside && (outside.material_type === 'material_2' || outside.materialType === 'material_2')) {
      const mid = outside.material_id ?? outside.materialId;
      return mid != null ? Number(mid) : null;
    }
  } catch {}
  return null;
}

async function __recalcSectionFacadeTrimPricing() {
  try {
    __ensureStep5DecorSelectionInitializedFromConfig();
  } catch (_) {}

  const parts = __collectSectionFacadeTrimParts();
  const acc = __sumSectionFacadeTrimBySection();
  let fallbackOutside = null;
  try {
    fallbackOutside =
      typeof window !== 'undefined' && typeof window.getStep5DecorSelection === 'function'
        ? window.getStep5DecorSelection()?.outside
        : null;
  } catch (_) {}

  __sectionFacadeTrimPricing = {
    totalRubAll: 0,
    totalRubShown: 0,
    bySection: {},
    areaM2All: acc.areaM2All,
    edgeLengthMpAll: acc.edgeLengthMpAll,
    partsAll: acc.partsAll,
    materialId: null,
    edgeId: null,
    pricePerM2: 0,
    edgePricePerMp: 0,
    bindings: [],
  };

  if (!parts.length) return __sectionFacadeTrimPricing;

  const ldspPriceCache = new Map();
  const edgePriceCache = new Map();
  const bySection = {};
  let totalAll = 0;

  for (const part of parts) {
    let materialId = part.materialId;
    let edgeType = part.edgeType || 'butt_butts';
    let edgeId = part.edgeId;

    if (!materialId && fallbackOutside) {
      const mid = fallbackOutside.material_id ?? fallbackOutside.materialId;
      if (mid != null) materialId = Number(mid);
    }

    if (!edgeId && materialId) {
      const edgeMeta = __defaultEdgeByMaterialId.get(Number(materialId)) || null;
      if (edgeMeta) {
        edgeType = edgeMeta.edgeType;
        edgeId = edgeMeta.edgeId;
      }
    }

    let pM2 = 0;
    if (materialId) {
      const mk = String(materialId);
      if (!ldspPriceCache.has(mk)) {
        ldspPriceCache.set(mk, __getLdspPricePerM2(materialId));
      }
      pM2 = Number(await ldspPriceCache.get(mk)) || 0;
    }

    let pMp = 0;
    if (edgeId && part.edgeLengthMp > 0) {
      const vi = part.edgeVariantId != null ? part.edgeVariantId : 0;
      const ek = `${edgeType}:${edgeId}:${vi}`;
      if (!edgePriceCache.has(ek)) {
        edgePriceCache.set(ek, __getEdgePricePerMp(edgeId, edgeType, vi));
      }
      pMp = Number(await edgePriceCache.get(ek)) || 0;
    }

    const ldspRub = (Number(part.areaM2) || 0) * pM2;
    const edgeRub = (Number(part.edgeLengthMp) || 0) * pMp;
    const partRub = ldspRub + edgeRub;
    totalAll += partRub;

    const sid = part.sectionId;
    if (!bySection[sid]) {
      bySection[sid] = { totalRub: 0, areaM2: 0, edgeLengthMp: 0, parts: 0 };
    }
    bySection[sid].totalRub += partRub;
    bySection[sid].areaM2 += part.areaM2;
    bySection[sid].edgeLengthMp += part.edgeLengthMp;
    bySection[sid].parts += 1;

    __sectionFacadeTrimPricing.bindings.push({
      decorId: part.decorId,
      materialId: materialId || null,
      edgeId: edgeId || null,
      areaM2: part.areaM2,
      edgeLengthMp: part.edgeLengthMp,
      pricePerM2: pM2,
      edgePricePerMp: pMp,
      rub: partRub,
    });
  }

  const primaryDecorId = fallbackOutside?.id || parts[0]?.decorId || null;
  const primaryBinding = resolveSectionTrimBinding(primaryDecorId, { fallbackOutside });
  const primaryMatId = primaryBinding.materialId || parts.find((p) => p.materialId)?.materialId || null;
  let primaryEdgeId = primaryBinding.edgeId;
  let primaryEdgeType = primaryBinding.edgeType;
  if (!primaryEdgeId && primaryMatId) {
    const em = __defaultEdgeByMaterialId.get(Number(primaryMatId));
    if (em) {
      primaryEdgeId = em.edgeId;
      primaryEdgeType = em.edgeType;
    }
  }

  __sectionFacadeTrimPricing.bySection = bySection;
  __sectionFacadeTrimPricing.totalRubAll = totalAll;
  __sectionFacadeTrimPricing.materialId = primaryMatId;
  __sectionFacadeTrimPricing.edgeId = primaryEdgeId || null;
  if (primaryMatId) {
    __sectionFacadeTrimPricing.pricePerM2 = Number(await __getLdspPricePerM2(primaryMatId)) || 0;
  }
  if (primaryEdgeId) {
    const pVi = primaryBinding.edgeVariantId != null ? primaryBinding.edgeVariantId : 0;
    __sectionFacadeTrimPricing.edgePricePerMp =
      Number(await __getEdgePricePerMp(primaryEdgeId, primaryEdgeType, pVi)) || 0;
  }

  return __sectionFacadeTrimPricing;
}

async function __recalcRoomTotalPriceAndUpdateUi() {
  if (!state?.scene) return;
  let total = 0;
  const furnitureCountBySectionId = new Map(); // sectionId -> count
  const maxZoneIndexBySectionId = new Map(); // sectionId -> max zoneIndex
  state.scene.traverse((obj) => {
    if (obj && obj.isGroup && obj.userData?.isFurniture) {
      total += Number(obj.userData?.priceRubTotal || 0) || 0;
      const sid = obj.userData?.sectionId;
      if (sid) {
        const k = String(sid);
        furnitureCountBySectionId.set(k, (furnitureCountBySectionId.get(k) || 0) + 1);
        const zi = typeof obj.userData?.zoneIndex === 'number' ? obj.userData.zoneIndex : null;
        if (zi != null && isFinite(zi)) {
          const cur = maxZoneIndexBySectionId.get(k);
          if (cur == null || zi > cur) maxZoneIndexBySectionId.set(k, zi);
        }
      }
    }
  });
  // Добавляем планки/накладки только в секциях, где уже есть мебель
  let extras = 0;
  let shownAreaM2 = 0;
  let shownEdgeLengthMp = 0;
  let shownParts = 0;
  try {
    const by = __sectionFacadeTrimPricing?.bySection || {};
    const getCapacityForSection = (sid) => {
      try {
        const sec = Array.isArray(state.customSections)
          ? state.customSections.find((s) => s && String(s.id) === String(sid))
          : null;
        const parts = sec?.division?.parts;
        if (typeof parts === 'number' && isFinite(parts) && parts > 0) return Math.floor(parts);
      } catch (_) {}
      // Fallbacks: use known max zoneIndex + 1, or furniture count
      const maxZi = maxZoneIndexBySectionId.get(String(sid));
      if (typeof maxZi === 'number' && isFinite(maxZi) && maxZi >= 0) return Math.floor(maxZi) + 1;
      const cnt = furnitureCountBySectionId.get(String(sid)) || 0;
      return cnt > 0 ? cnt : 1;
    };

    furnitureCountBySectionId.forEach((count, sid) => {
      const row = by?.[sid] || null;
      if (!row) return;
      const cap = getCapacityForSection(sid);
      const denom = cap > 0 ? cap : 1;
      const frac = Math.max(0, Math.min(1, (Number(count) || 0) / denom));

      extras += (Number(row.totalRub || 0) || 0) * frac;
      shownAreaM2 += (Number(row.areaM2 || 0) || 0) * frac;
      shownEdgeLengthMp += (Number(row.edgeLengthMp || 0) || 0) * frac;
      shownParts += (Number(row.parts || 0) || 0) * frac;
    });
  } catch (_) { extras = 0; }
  if (__sectionFacadeTrimPricing) {
    __sectionFacadeTrimPricing.totalRubShown = extras;
    __sectionFacadeTrimPricing.areaM2Shown = shownAreaM2;
    __sectionFacadeTrimPricing.edgeLengthMpShown = shownEdgeLengthMp;
    __sectionFacadeTrimPricing.partsShown = shownParts;
  }
  total += extras;

  __cldPriceLog('[PRICE] Room total recalculated:', { furnitureRub: total - extras, sectionTrimRubShown: extras, sectionTrimRubAll: __sectionFacadeTrimPricing?.totalRubAll || 0, totalRub: total });
  if (typeof window !== 'undefined' && typeof window.setRoomTotalPriceRub === 'function') {
    window.setRoomTotalPriceRub(total);
  }
  // Сообщаем UI, что цены обновились (отчётная панель, диагностика)
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('cld:priceUpdated', { detail: { totalRub: total, sectionTrim: __sectionFacadeTrimPricing } }));
    }
  } catch (_) {}
}

/** PlanPlace get_specs-стиль: type:model с show_in_spec / опоры > цена cabinet_model. */
function __sumFurnitureCabinetModelPrices(group, libMap) {
  const rows = [];
  let rub = 0;
  if (!group || !libMap) return { rub: 0, rows };
  const seen = new Set();
  group.traverse((o) => {
    if (!o?.isGroup || !o.userData?.isCabinetModel) return;
    const sid = String(o.userData.modelSpecId || '').trim();
    if (!sid) return;
    // Один узел Model_* — не считать повторно по uuid родителя
    const key = o.uuid;
    if (seen.has(key)) return;
    seen.add(key);
    const entry = libMap[sid];
    if (!entry) return;
    const isLeg = !!o.userData.cldSupportLeg;
    const show = Number(entry.show_in_spec) === 1 || entry.show_in_spec === true;
    if (!isLeg && !show) return;
    const unit = Number(entry.price) || 0;
    const cnt = Math.max(1, Number(entry.count) || 1);
    const line = unit * cnt;
    rub += line;
    rows.push({
      id: sid,
      name: entry.name || o.name || sid,
      count: cnt,
      unitPrice: unit,
      rub: line,
      isSupportLeg: isLeg,
    });
  });
  return { rub, rows };
}

function __attachCabinetModelPricing(group, ldspEdgeTotal) {
  const api = typeof window !== 'undefined' ? window.__cldRoomCabinetModels : null;
  const ensure = api && typeof api.ensureCabinetModelLibraryMap === 'function'
    ? api.ensureCabinetModelLibraryMap()
    : Promise.resolve(null);
  return ensure.then((libMap) => {
    const hw = __sumFurnitureCabinetModelPrices(group, libMap || {});
    group.userData.priceHardwareRub = hw.rub;
    group.userData.hardwarePricingRows = hw.rows;
    group.userData.priceRubTotal = (Number(ldspEdgeTotal) || 0) + hw.rub;
    __cldPriceLog('[PRICE] Furniture + cabinet_model hardware:', {
      ldspEdgeTotal,
      hardwareRub: hw.rub,
      rows: hw.rows,
      totalRub: group.userData.priceRubTotal,
    });
    return __recalcRoomTotalPriceAndUpdateUi();
  });
}

function __scheduleFurnitureLdspPricing(furniture) {
  // Async fetch price + update UI when ready
  try {
    const group = furniture?.group || furniture;
    if (!group) return;
    const areaM2 = __sumFurnitureLdspAreaM2(group);
    // Точная кромка: берём из Clodis JSON по включенным сторонам (если есть).
    // Fallback: старый приблизительный подсчёт по периметрам BoxGeometry.
    const edgeAcc = __computeEdgeLengthFromClodis(group);
    const edgeLengthMp = edgeAcc ? edgeAcc.totalMp : __sumFurnitureEdgeLengthMp(group);
    group.userData = group.userData || {};
    group.userData.ldspAreaM2 = areaM2;
    group.userData.edgeLengthMp = edgeLengthMp;
    if (edgeAcc) group.userData.edgeBreakdown = edgeAcc.breakdown;
    __cldPriceLog('[PRICE] Furniture LDSP area m2:', {
      areaM2,
      edgeLengthMp,
      furnitureId: group.uuid,
      sectionId: group.userData.sectionId,
      zoneIndex: group.userData.zoneIndex,
    });
    const selectedMatId = __getInsideLdspMaterialIdFromStep5Sync();
    const matIdPromise = selectedMatId != null ? Promise.resolve(selectedMatId) : __getDefaultLdspMaterialId();
    matIdPromise.then((matId) => {
      __cldPriceLog('[PRICE] Using LDSP material id for pricing:', matId, selectedMatId != null ? '(from step5)' : '(default)');
      if (!matId) {
        group.userData.priceRubTotal = 0;
        return __attachCabinetModelPricing(group, 0);
      }
      return __getLdspPricePerM2(matId).then((pricePerM2) => {
        const pLdsp = Number(pricePerM2) || 0;
        const baseRub = areaM2 * pLdsp;
        group.userData.priceLdspPerM2 = pLdsp;
        // Кромка: приоритет — кромка, назначенная материалу (edge_ids в каталоге материала).
        // Это соответствует ожиданию "кромка от выбранного материала", даже если Clodis JSON содержит edge_id.
        let edgeRub = 0;
        const edgeMeta = __defaultEdgeByMaterialId.get(Number(matId)) || null;
        if (edgeMeta && edgeLengthMp > 0) {
          return __getEdgePricePerMp(edgeMeta.edgeId, edgeMeta.edgeType, edgeMeta.variantId).then((pEdge) => {
            const pMp = Number(pEdge) || 0;
            edgeRub = edgeLengthMp * pMp;
            group.userData.edgePricePerMp = pMp;
            group.userData.edgeLengthMp = edgeLengthMp;
            group.userData.edgePricingRows = [
              { edgeId: edgeMeta.edgeId, lengthMp: edgeLengthMp, pricePerMp: pMp, source: 'material_default' },
            ];
            __cldPriceLog('[PRICE] Furniture price computed (LDSP + edge/material_default):', {
              areaM2,
              pricePerM2: pLdsp,
              edgeLengthMp,
              edgePricePerMp: pMp,
              baseRub,
              edgeRub,
              totalRub: baseRub + edgeRub,
            });
            return __attachCabinetModelPricing(group, baseRub + edgeRub);
          });
        }
        // Fallback: если у материала нет назначенной кромки — считаем по breakdown из Clodis (если есть).
        const breakdown = Array.isArray(group.userData.edgeBreakdown) ? group.userData.edgeBreakdown : null;
        if (breakdown && breakdown.length) {
          const promises = breakdown.map((b) =>
            __getEdgePricePerMp(b.edgeId, 'butt_butts').then((p) => ({ edgeId: b.edgeId, lengthMp: b.lengthMp, pricePerMp: Number(p) || 0 }))
          );
          return Promise.all(promises).then((rows) => {
            let edgeRub2 = 0;
            rows.forEach((r) => { edgeRub2 += (Number(r.lengthMp) || 0) * (Number(r.pricePerMp) || 0); });
            group.userData.edgePricingRows = rows;
            __cldPriceLog('[PRICE] Furniture price computed (LDSP + edge/breakdown fallback):', {
              areaM2,
              pricePerM2: pLdsp,
              edgeLengthMp,
              edgeRub: edgeRub2,
              baseRub,
              totalRub: baseRub + edgeRub2,
              rows
            });
            return __attachCabinetModelPricing(group, baseRub + edgeRub2);
          });
        }
        __cldPriceLog('[PRICE] Furniture price computed (LDSP only, no edge):', {
          areaM2,
          pricePerM2: pLdsp,
          baseRub,
        });
        return __attachCabinetModelPricing(group, baseRub);
      });
    });
  } catch (e) {}
}

// Локальный пересчёт цены для одного шкафа при простом масштабировании по глубине.
// Мы аппроксимируем: площадь ЛДСП пропорциональна глубине.
function __recalcAllFurnitureLdspPricesWithCurrentMaterial() {
  try {
    const selectedMatId = __getInsideLdspMaterialIdFromStep5Sync();
    const matIdPromise = selectedMatId != null ? Promise.resolve(selectedMatId) : __getDefaultLdspMaterialId();
    matIdPromise.then((matId) => {
      if (!state?.scene || !matId) {
        __recalcRoomTotalPriceAndUpdateUi();
        return;
      }
      const groups = [];
      state.scene.traverse((obj) => {
        if (obj && obj.isGroup && obj.userData?.isFurniture) {
          groups.push(obj);
        }
      });
      __getLdspPricePerM2(matId).then((pricePerM2) => {
        const pLdsp = Number(pricePerM2) || 0;
        const edgeMeta = __defaultEdgeByMaterialId.get(Number(matId)) || null;
        Promise.resolve().then(() => {
          // Достаём breakdown кромки из Clodis JSON (если есть)
          let rows = null;
          try {
            rows = groups.map((g) => {
              const acc = __computeEdgeLengthFromClodis(g);
              return { g, acc };
            });
          } catch (_) {
            rows = groups.map((g) => ({ g, acc: null }));
          }

          // Если хотя бы у одного есть breakdown — считаем по edge_id
          const anyBreakdown = rows.some((r) => r.acc && r.acc.breakdown && r.acc.breakdown.length);
          // Приоритет: если у материала есть назначенная кромка — считаем по ней для всех шкафов.
          const edgeMeta = __defaultEdgeByMaterialId.get(Number(matId)) || null;
          if (edgeMeta) {
            return __getEdgePricePerMp(edgeMeta.edgeId, edgeMeta.edgeType, edgeMeta.variantId).then((pEdge) => {
              const edgePricePerMp = Number(pEdge) || 0;
              groups.forEach((g) => {
                const area = Number(g.userData?.ldspAreaM2 || 0) || __sumFurnitureLdspAreaM2(g);
                const acc = __computeEdgeLengthFromClodis(g);
                const edgeLen = acc ? acc.totalMp : (Number(g.userData?.edgeLengthMp || 0) || __sumFurnitureEdgeLengthMp(g));
                g.userData.ldspAreaM2 = area;
                g.userData.edgeLengthMp = edgeLen;
                g.userData.priceLdspPerM2 = pLdsp;
                g.userData.edgePricePerMp = edgePricePerMp;
                g.userData.edgePricingRows = [
                  { edgeId: edgeMeta.edgeId, lengthMp: edgeLen, pricePerMp: edgePricePerMp, source: 'material_default' },
                ];
                const baseRub = area * pLdsp;
                const edgeRub = edgeLen * edgePricePerMp;
                g.userData.priceRubTotal = baseRub + edgeRub;
              });
              return Promise.all(
                groups.map((g) => __attachCabinetModelPricing(g, Number(g.userData.priceRubTotal) || 0))
              );
            });
          }

          if (anyBreakdown) {
            // Считаем цены по всем edgeId, встречающимся в комнате
            const allEdgeIds = new Set();
            rows.forEach((r) => (r.acc?.breakdown || []).forEach((b) => allEdgeIds.add(Number(b.edgeId) || 0)));
            const ids = Array.from(allEdgeIds).filter((n) => Number.isFinite(n) && n > 0);
            return Promise.all(ids.map((id) => __getEdgePricePerMp(id, 'butt_butts').then((p) => ({ id, p: Number(p) || 0 }))))
              .then((prices) => {
                const priceMap = new Map(prices.map((x) => [x.id, x.p]));
                groups.forEach((g) => {
                  const area = Number(g.userData?.ldspAreaM2 || 0) || __sumFurnitureLdspAreaM2(g);
                  const acc = __computeEdgeLengthFromClodis(g);
                  const breakdown = acc?.breakdown || [];
                  const edgeLen = acc ? acc.totalMp : (Number(g.userData?.edgeLengthMp || 0) || __sumFurnitureEdgeLengthMp(g));
                  g.userData.ldspAreaM2 = area;
                  g.userData.edgeLengthMp = edgeLen;
                  g.userData.edgeBreakdown = breakdown;
                  g.userData.priceLdspPerM2 = pLdsp;
                  const baseRub = area * pLdsp;
                  let edgeRub = 0;
                  const edgeRows = breakdown.map((b) => ({
                    edgeId: b.edgeId,
                    lengthMp: b.lengthMp,
                    pricePerMp: priceMap.get(Number(b.edgeId) || 0) || 0
                  }));
                  edgeRows.forEach((r) => { edgeRub += (Number(r.lengthMp) || 0) * (Number(r.pricePerMp) || 0); });
                  g.userData.edgePricingRows = edgeRows;
                  g.userData.priceRubTotal = baseRub + edgeRub;
                });
                return Promise.all(
                  groups.map((g) => __attachCabinetModelPricing(g, Number(g.userData.priceRubTotal) || 0))
                );
              });
          }

          // Иначе — старый fallback “одна кромка от материала”
          let edgePricePerMp = 0;
          if (edgeMeta) {
            return __getEdgePricePerMp(edgeMeta.edgeId, edgeMeta.edgeType, edgeMeta.variantId).then((pEdge) => {
              edgePricePerMp = Number(pEdge) || 0;
              groups.forEach((g) => {
                const area = Number(g.userData?.ldspAreaM2 || 0) || __sumFurnitureLdspAreaM2(g);
                const edgeLen = Number(g.userData?.edgeLengthMp || 0) || __sumFurnitureEdgeLengthMp(g);
                g.userData.ldspAreaM2 = area;
                g.userData.edgeLengthMp = edgeLen;
                g.userData.priceLdspPerM2 = pLdsp;
                g.userData.edgePricePerMp = edgePricePerMp;
                g.userData.edgePricingRows = [
                  { edgeId: edgeMeta.edgeId, lengthMp: edgeLen, pricePerMp: edgePricePerMp, source: 'material_default' },
                ];
                const baseRub = area * pLdsp;
                const edgeRub = edgeLen * edgePricePerMp;
                g.userData.priceRubTotal = baseRub + edgeRub;
              });
              return Promise.all(
                groups.map((g) => __attachCabinetModelPricing(g, Number(g.userData.priceRubTotal) || 0))
              );
            });
          }

          groups.forEach((g) => {
            const area = Number(g.userData?.ldspAreaM2 || 0) || __sumFurnitureLdspAreaM2(g);
            const edgeLen = Number(g.userData?.edgeLengthMp || 0) || __sumFurnitureEdgeLengthMp(g);
            g.userData.ldspAreaM2 = area;
            g.userData.edgeLengthMp = edgeLen;
            g.userData.priceLdspPerM2 = pLdsp;
            const baseRub = area * pLdsp;
            g.userData.priceRubTotal = baseRub;
          });
          return Promise.all(
            groups.map((g) => __attachCabinetModelPricing(g, Number(g.userData.priceRubTotal) || 0))
          );
        });
      });
    });
  } catch (e) {
    __recalcRoomTotalPriceAndUpdateUi();
  }
}

// Публичный хук: использовать когда мебель меняет геометрию (resize секции),
// чтобы площадь ЛДСП и итоговая цена пересчитались.
export function recalcFurniturePricingAfterGeometryChange() {
  try {
    if (!state?.scene) return;
    const groups = [];
    state.scene.traverse((obj) => {
      if (obj && obj.isGroup && obj.userData?.isFurniture) groups.push(obj);
    });
    groups.forEach((g) => {
      const area = __sumFurnitureLdspAreaM2(g);
      g.userData = g.userData || {};
      g.userData.ldspAreaM2 = area;
    });
    __recalcAllFurnitureLdspPricesWithCurrentMaterial();
  } catch (e) {
    __recalcRoomTotalPriceAndUpdateUi();
  }
}

// Делаем хук доступным из window, чтобы UI (карандаш модуля) мог вызвать пересчёт
// после изменения глубины конкретного шкафа.
if (typeof window !== 'undefined') {
  // Без перезаписи, если уже установлен.
  if (typeof window.recalcFurniturePricingAfterGeometryChange !== 'function') {
    window.recalcFurniturePricingAfterGeometryChange = recalcFurniturePricingAfterGeometryChange;
  }
  if (typeof window.recalcSectionTrimPricing !== 'function') {
    window.recalcSectionTrimPricing = function () {
      try {
        return Promise.resolve(__recalcSectionFacadeTrimPricing()).then(() => __recalcRoomTotalPriceAndUpdateUi());
      } catch (e) {
        return Promise.resolve();
      }
    };
  }
}

/**
 * Начать перетаскивание шкафа из каталога (mousedown + drag + mouseup)
 * ЛКМ зажата на шкафу, тянем в секцию, отпускаем — мебель ставится
 */
function resolveCatalogDragIconSizePx(startEvent, cabinetData) {
  const card = startEvent?.target?.closest?.('.cabinet-item');
  if (card) {
    const r = card.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      return {
        widthPx: Math.max(20, Math.round(r.width / 3)),
        heightPx: Math.max(20, Math.round(r.height / 3)),
        isLow: card.classList.contains('cabinet-item--icon-low'),
      };
    }
  }
  const item = cabinetData?.catalogItem || cabinetData;
  const aspect = resolveCatalogItemIconAspect(item, cabinetData?.catalogType);
  const exp = catalogScreenshotExportSize(aspect);
  return {
    widthPx: Math.max(20, Math.round(exp.w / 3)),
    heightPx: Math.max(20, Math.round(exp.h / 3)),
    isLow: aspect === CATALOG_ICON_ASPECT_LOW,
  };
}

function setupCatalogDragToPlace(cabinetData, startEvent) {
  state.isDraggingFromCatalog = true;

  const card = startEvent?.target?.closest?.('.cabinet-item');
  const imageEl = card?.querySelector?.('.cabinet-item-image');
  const dragSize = resolveCatalogDragIconSizePx(startEvent, cabinetData);
  showCatalogDragIcon({
    sourceEl: imageEl || null,
    iconUrl: cabinetData?.icon || cabinetData?.catalogItem?.icon || null,
    fontIcon: 'fa-cube',
    event: startEvent,
    widthPx: dragSize.widthPx,
    heightPx: dragSize.heightPx,
    isLow: dragSize.isLow,
  });

  startFurniturePlacement(cabinetData);

  function onDragMove(event) {
    if (!state.isPlacingFurniture) return;
    updateMousePosition(event);
    updateFurnitureGhostPosition(event);
  }

  function onDragUp(event) {
    if (event.button !== 0) return;
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragUp, true);

    try {
      // Final raycast at release point
      updateMousePosition(event);
      updateFurnitureGhostPosition(event);

      state.isDraggingFromCatalog = false;

      if (applyEndCabinetReleaseAction()) {
        return;
      }

      if (
        isPendingEndCabinetModule(state.pendingFurnitureData) &&
        state._ghostZonePlacementAllowed !== false
      ) {
        placePendingFurniture();
        return;
      }

      const zoneInfo = state._pendingZoneInfo;
      const moduleDoorKind = inferModuleDoorKindFromCategories(
        state.pendingFurnitureData
      );
      const zoneDoorKind = zoneInfo?.doorKind;
      const baySec =
        Array.isArray(state.customSections) && zoneInfo?.sectionId != null
          ? state.customSections.find((s) => s && s.id === zoneInfo.sectionId)
          : null;
      const underBay = isUnderWindowBaySection(baySec);
      const pendingPk = resolvePlacementKindFromFurnitureData(state.pendingFurnitureData);
      const isCornerCab = isLCornerCabinetModule(state.pendingFurnitureData);
      const freeWallPlace =
        state.kitchenSectionsEnabled === false ||
        !(state.customSections || []).length;
      const onLSpecial =
        !!baySec && __isLShapeSpecialZone(baySec, zoneInfo?.zoneIndex);
      __cldLogLCorner('onDragUp', {
        moduleDoorKind,
        zoneDoorKind,
        underBay,
        pendingPk,
        freeWallPlace,
        canZoneGesture: false,
        placementBlockedBefore: state._ghostZonePlacementAllowed === false,
      });
      // ??? ??????: ??????? ? ?????, ?? ? ????-??????.
      if (freeWallPlace && isCornerCab) {
        state._ghostZonePlacementAllowed = true;
        if (!state.ghostPosition && state.furnitureGhost) {
          state.ghostPosition = state.furnitureGhost.position.clone();
        }
        if (!state.ghostWall) {
          state.ghostWall =
            state.furnitureGhost?.userData?.wall ||
            state.ghostWall ||
            null;
        }
        state._pendingZoneInfo = null;
        placePendingFurniture();
        return;
      }
      const rawPkDrag = String(
        getRawPlacementKindFromFurnitureData(state.pendingFurnitureData) || ''
      )
        .trim()
        .toLowerCase();
      const isWallBandDrag =
        !isCornerCab &&
        (isKitchenWallBandFurnitureData(state.pendingFurnitureData) ||
          rawPkDrag === 'kitchen_wall_mid' ||
          rawPkDrag === 'kitchen_wall_top' ||
          isKitchenWallMidPlacementKind(rawPkDrag) ||
          isKitchenWallTopPlacementKind(rawPkDrag) ||
          // mapped wall_hung_low + stamp/папка 50 — всё равно НШ1-сосед.
          ((pendingPk === PLACEMENT_KIND.WALL_HUNG_LOW ||
            pendingPk === PLACEMENT_KIND.WALL_HUNG ||
            pendingPk === PLACEMENT_KIND.WALL_HUNG_HIGH) &&
            isKitchenWallBandFurnitureData(state.pendingFurnitureData)));
      // НШ1-сосед ВМУ: place не срывать (door / спец / ghostAllowed).
      const zoneInfoLive = state._pendingZoneInfo || zoneInfo;
      const skipDoorGate =
        pendingPk === PLACEMENT_KIND.STANDALONE_FLOOR ||
        isWallHungPlacementKind(pendingPk) ||
        isWallBandDrag ||
        (isCornerCab && onLSpecial);
      const zoneMismatch =
        !skipDoorGate &&
        zoneDoorKind &&
        moduleDoorKind &&
        moduleDoorKind !== zoneDoorKind;
      const canZoneGesture =
        !!zoneMismatch &&
        zonePlaceGesturePossible(
          baySec,
          zoneInfoLive?.zoneIndex,
          moduleDoorKind
        );
      let placementBlocked =
        state._ghostZonePlacementAllowed === false && !canZoneGesture;
      if (isWallBandDrag) {
        placementBlocked = false;
        state._ghostZonePlacementAllowed = true;
        if (!state.ghostPosition && state.furnitureGhost) {
          state.ghostPosition = state.furnitureGhost.position.clone();
        }
        if (!state.ghostWall) {
          state.ghostWall =
            state.furnitureGhost?.userData?.wall ||
            zoneInfoLive?.wallName ||
            baySec?.wallName ||
            null;
        }
        if (!state.ghostPosition && state.lastValidGhostPosition) {
          state.ghostPosition = state.lastValidGhostPosition.clone();
        }
        if (!state.ghostWall && state.lastValidGhostWall) {
          state.ghostWall = state.lastValidGhostWall;
        }
      }
      // Угловой: L — одна спец; П — лев/прав по модулю (или hit на спец).
      let cornerForceSec = baySec;
      let cornerForceZi = zoneInfo?.zoneIndex;
      if (isCornerCab && baySec?.lShape) {
        try {
          const tgt = resolveCornerCabinetPlaceTarget(
            baySec,
            zoneInfo,
            state.pendingFurnitureData
          );
          if (tgt?.section && tgt.zoneIndex != null) {
            const zoneAt = getSectionLCornerZoneAtStart(
              tgt.section,
              tgt.zoneIndex
            );
            const modAt = getCatalogItemCornerAtStart(
              state.pendingFurnitureData
            );
            if (zoneAt != null && modAt !== zoneAt) {
              __cldLogLCorner('BLOCK onDragUp wrong corner side', {
                zoneAt,
                modAt,
              });
              const msg = zoneAt
                ? 'В этот угол подходит только угловой левый модуль.'
                : 'В этот угол подходит только угловой правый модуль.';
              if (typeof window.showToast === 'function') {
                window.showToast(msg, 'warning');
              } else if (typeof window.toastr !== 'undefined') {
                window.toastr.warning(msg);
              } else {
                console.warn('[РАЗМЕЩЕНИЕ] ' + msg);
              }
              cancelFurniturePlacement();
              return;
            }
            cornerForceSec = tgt.section;
            cornerForceZi = tgt.zoneIndex;
            state._pendingZoneInfo = {
              sectionId: tgt.section.id,
              wallName:
                tgt.section.wallName ||
                tgt.section.division?.wallName ||
                zoneInfo?.wallName,
              zoneIndex: tgt.zoneIndex,
              doorKind: 'double',
              hitAlongMm: zoneInfo?.hitAlongMm,
            };
            placementBlocked = false;
            state._ghostZonePlacementAllowed = true;
            if (state.furnitureGhost) {
              state.ghostPosition = state.furnitureGhost.position.clone();
              state.ghostWall =
                state.furnitureGhost.userData?.wall ||
                tgt.section.wallName ||
                null;
            }
            __cldLogLCorner('onDragUp/force-special', {
              reason: 'force primary special on release (L/U)',
              primaryId: tgt.section.id,
              specialZi: tgt.zoneIndex,
              wasZi: zoneInfo?.zoneIndex ?? null,
              wasSectionId: zoneInfo?.sectionId ?? null,
            });
          } else if (onLSpecial) {
            placementBlocked = false;
            state._ghostZonePlacementAllowed = true;
          } else {
            placementBlocked = true;
            state._ghostZonePlacementAllowed = false;
          }
        } catch (e) {
          console.warn('[L-CORNER] force-special failed', e);
        }
      } else if (isCornerCab && onLSpecial) {
        placementBlocked = false;
        state._ghostZonePlacementAllowed = true;
        if (!state.ghostPosition && state.furnitureGhost) {
          state.ghostPosition = state.furnitureGhost.position.clone();
        }
        if (!state.ghostWall) {
          state.ghostWall =
            state.furnitureGhost?.userData?.wall ||
            zoneInfo?.wallName ||
            null;
        }
      } else if (isCornerCab && !onLSpecial) {
        placementBlocked = true;
        state._ghostZonePlacementAllowed = false;
      }
      const onLSpecialFinal =
        isCornerCab &&
        cornerForceSec &&
        cornerForceZi != null &&
        __isLShapeSpecialZone(cornerForceSec, cornerForceZi);
      __cldLogLCorner('onDragUp/gate', {
        onLSpecial: onLSpecialFinal || onLSpecial,
        placementBlocked,
        zoneMismatch,
        canZoneGesture,
        skipDoorGate,
        forceZi: cornerForceZi,
        forceSec: cornerForceSec?.id ?? null,
      });
      const switchKind =
        state._catalogSwitchDoorKindOnRelease || zoneDoorKind || null;

      if ((zoneMismatch && !canZoneGesture) || placementBlocked) {
        if (underBay && pendingPk !== PLACEMENT_KIND.STANDALONE_FLOOR) {
          __cldLogLCorner('BLOCK cancel underBay');
          cancelFurniturePlacement();
          return;
        }
        if (isCornerCab && !(onLSpecialFinal || onLSpecial)) {
          __cldLogLCorner('BLOCK corner not on special', {
            reason: 'zoneIndex!==specialZi',
          });
          const msg =
            'Угловой модуль ставится только в угловую спец-секцию.';
          if (typeof window.showToast === 'function') {
            window.showToast(msg, 'warning');
          } else if (typeof window.toastr !== 'undefined') {
            window.toastr.warning(msg);
          }
          cancelFurniturePlacement();
          return;
        }
        if (!isCornerCab) {
          __cldLogLCorner('BLOCK switch catalog', { switchKind });
          cancelPlacementAndSwitchCatalogForZone(switchKind);
          return;
        }
        // corner + force special: не уходим в switch catalog
        placementBlocked = false;
      }

      if (canZoneGesture && state.furnitureGhost) {
        state._ghostZonePlacementAllowed = true;
        if (!state.ghostPosition) {
          state.ghostPosition = state.furnitureGhost.position.clone();
        }
        if (!state.ghostWall) {
          state.ghostWall =
            state.furnitureGhost.userData?.wall ||
            zoneInfo?.wallName ||
            null;
        }
        console.log('[ZONE-GESTURE] release allow', {
          moduleDoorKind,
          zoneDoorKind,
          zoneIndex: zoneInfo?.zoneIndex,
          sectionId: zoneInfo?.sectionId,
        });
      }

      if (
        state.isPlacingFurniture &&
        state.ghostPosition &&
        state.ghostWall &&
        state.furnitureGhost
      ) {
        __cldLogLCorner('PLACE via ghostPosition', {
          reason: 'ok',
          sectionId: state._pendingZoneInfo?.sectionId,
          zoneIndex: state._pendingZoneInfo?.zoneIndex,
        });
        placePendingFurniture();
      } else if (
        isWallBandDrag &&
        state.isPlacingFurniture &&
        state.furnitureGhost
      ) {
        state.ghostPosition = state.furnitureGhost.position.clone();
        state.ghostWall =
          state.furnitureGhost.userData?.wall ||
          zoneInfoLive?.wallName ||
          baySec?.wallName ||
          state.lastValidGhostWall ||
          null;
        __cldLogLCorner('PLACE via wall-band fallback', {
          reason: 'ok-wall-band',
          zoneIndex: state._pendingZoneInfo?.zoneIndex,
          ghostWall: state.ghostWall,
        });
        if (state.ghostWall) placePendingFurniture();
        else cancelFurniturePlacement();
      } else if (
        isCornerCab &&
        (onLSpecialFinal || onLSpecial) &&
        state.isPlacingFurniture &&
        state.furnitureGhost
      ) {
        state.ghostPosition = state.furnitureGhost.position.clone();
        state.ghostWall =
          state.furnitureGhost.userData?.wall ||
          zoneInfo?.wallName ||
          cornerForceSec?.wallName ||
          baySec?.wallName ||
          null;
        __cldLogLCorner('PLACE via corner special fallback', {
          reason: 'ok-fallback',
          ghostWall: state.ghostWall,
        });
        if (state.ghostWall) placePendingFurniture();
        else {
          __cldLogLCorner('CANCEL corner no wall');
          cancelFurniturePlacement();
        }
      } else if (
        isCornerCab &&
        state.lastValidGhostPosition &&
        state.lastValidGhostWall &&
        state.isPlacingFurniture &&
        state.furnitureGhost
      ) {
        state.ghostPosition = state.lastValidGhostPosition.clone();
        state.ghostWall = state.lastValidGhostWall;
        __cldLogLCorner('PLACE via lastValidGhost', { reason: 'ok-lastValid' });
        placePendingFurniture();
      } else if (!state.ghostPosition && !state.lastValidGhostPosition) {
        __cldLogLCorner('NO PLACE click-on-wall mode');
        console.log('[PLACE] click-on-wall mode: move cursor to wall and click');
      } else {
        __cldLogLCorner('CANCEL no ghost pos', {
          reason: 'no-ghostPosition',
          hasLastValid: !!state.lastValidGhostPosition,
        });
        cancelFurniturePlacement();
      }
    } finally {
      removeCatalogDragIcon();
    }
  }

  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragUp, true); // capture — before camera.js
}

/**
 * Модуль и цель под курсором из разных каталогов: не ставим, а показываем нужный каталог.
 * @returns {boolean} true если действие было
 */
export function applyEndCabinetReleaseAction() {
  const action = state._endCabReleaseAction;
  if (!action) return false;
  state._endCabReleaseAction = null;
  cancelFurniturePlacement();
  if (action.kind === 'openEndCabinetCatalog') {
    activateEndCabinetCatalogForSlot(action.slot);
  } else {
    switchBackToRegularCatalog();
  }
  return true;
}

/**
 * Cancel furniture placement mode
 */
export function cancelFurniturePlacement() {
  removeCatalogDragIcon();
  clearGhostClodisPrebuildTimer();
  if (state.furnitureGhost) {
    removeFurnitureGhost();
  }
  // Reset wall highlight
  if (state.room && state.room.resetWallHighlight) {
    state.room.resetWallHighlight();
  }
  state.pendingFurnitureData = null;
  state.isPlacingFurniture = false;
  state.ghostWall = null;
  state.ghostPosition = null;
  state.lastValidGhostPosition = null;
  state.lastValidGhostWall = null;
  state._pendingZoneInfo = null;
  state._ghostZonePlacementAllowed = true;
  state._catalogSwitchDoorKindOnRelease = null;
  state._endCabReleaseAction = null;
  state._placeAdoptedClodis = null;
  setEndCabinetSlotHighlight(false);
  if (typeof window !== 'undefined') {
    window.__lastAutoSwitchZoneDoorKind = null;
  }
  console.log('? Размещение мебели отменено');
}

/** Секционная мебель: только вдоль стены (U), глубина — по фасаду секции. */
function __furnitureDragUsesSectionAlongWall(group) {
  const ud = group?.userData || {};
  return !!(
    ud.sectionId != null ||
    ud.__placementKind === PLACEMENT_KIND.STANDALONE_FLOOR ||
    Number(ud.customDepthMm) > 0
  );
}

/** Полупрозрачность оригинала на время live-drag (призрак едет отдельно). */
function __setLiveDragSourceOpacity(group, opacity) {
  if (!group) return;
  group.traverse((obj) => {
    if (!obj?.isMesh || !obj.material) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of mats) {
      if (!m) continue;
      if (m.userData?.__cldLiveDragSaved == null) {
        m.userData = m.userData || {};
        m.userData.__cldLiveDragSaved = {
          transparent: !!m.transparent,
          opacity: Number.isFinite(m.opacity) ? m.opacity : 1,
          depthWrite: m.depthWrite !== false,
        };
      }
      if (opacity >= 0.999) {
        const s = m.userData.__cldLiveDragSaved;
        m.transparent = s.transparent;
        m.opacity = s.opacity;
        m.depthWrite = s.depthWrite;
        delete m.userData.__cldLiveDragSaved;
      } else {
        m.transparent = true;
        m.opacity = opacity;
        m.depthWrite = false;
      }
      m.needsUpdate = true;
    }
  });
}

function __removeLiveDragGhost() {
  const g = state._liveDragGhost;
  if (g && state.scene) {
    try {
      state.scene.remove(g);
      g.traverse((o) => {
        if (o.geometry) o.geometry.dispose?.();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.());
          else o.material.dispose?.();
        }
      });
    } catch (_) {}
  }
  state._liveDragGhost = null;
}

/**
 * Призрак live-drag: как каталог — group в pivot зоны, бокс от (0,0,0).
 * Оригинал остаётся на старте (полупрозрачный).
 */
function __ensureLiveDragGhost(widthMm, heightMm, depthMm, rotationY) {
  const w = Math.max(50, Number(widthMm) || 500);
  const h = Math.max(50, Number(heightMm) || 2000);
  const d = Math.max(50, Number(depthMm) || 500);
  let ghost = state._liveDragGhost;
  if (!ghost) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
    mesh.name = 'LiveDragGhostBox';
    ghost = new THREE.Group();
    ghost.name = 'LiveDragGhost';
    ghost.userData.isGhost = true;
    ghost.userData.isLiveDragGhost = true;
    ghost.add(mesh);
    state.scene.add(ghost);
    state._liveDragGhost = ghost;
  }
  const mesh = ghost.children.find((c) => c.name === 'LiveDragGhostBox') || ghost.children[0];
  if (mesh) {
    mesh.scale.set(w, h, d);
    mesh.position.set(w / 2, h / 2, d / 2);
  }
  if (Number.isFinite(rotationY)) ghost.rotation.y = rotationY;
  ghost.visible = true;
  return ghost;
}

function __applyLiveDragGhostCellSnap(section, resolvedWall, hitWorldU, snapIn, kindA) {
  let snap = snapIn;
  if (!section?.division || !snap) return { snap, worldPos: null, moduleW: 0 };
  let moduleW = Number(snap.moduleWidth) || 0;
  const authSnap = buildZoneSnapForSection(section, snap.zoneIndex, resolvedWall);
  if (authSnap?.moduleWidth > 0) moduleW = authSnap.moduleWidth;
  const zi = Number(snap.zoneIndex);
  const zKind = getZoneDoorKind(section, snap.zoneIndex);
  const segs = section._layoutCache?.segments;

  if (__isLShapeSpecialZone(section, zi)) {
    const sp = getLShapeSpecialSnapBounds(section.division, zi);
    if (sp?.moduleWidth > 0) {
      moduleW = Math.round(sp.moduleWidth);
      const pivotCoord =
        resolvedWall === 'left' || resolvedWall === 'front'
          ? sp.zoneStart + moduleW
          : sp.zoneStart;
      snap = { pivotCoord, zoneIndex: zi, moduleWidth: moduleW };
      const worldPos = getZonePivotWorldPosition(section, snap, resolvedWall);
      return { snap, worldPos, moduleW };
    }
  }

  if (kindA === 'double' && moduleW > 0) {
    if (zKind === 'double' && authSnap) {
      snap = {
        pivotCoord: authSnap.pivotCoord,
        zoneIndex: zi,
        moduleWidth: Math.round(moduleW),
      };
      moduleW = Math.round(moduleW);
    } else {
      const cellW = zKind === 'double' ? moduleW / 2 : moduleW;
      moduleW = Math.round(2 * cellW);
    }
  } else if (
    !__isLShapeSpecialZone(section, zi) &&
    kindA === 'single' &&
    zKind === 'double' &&
    moduleW >= 400
  ) {
    const seg = Array.isArray(segs)
      ? segs.find((s) => s && s.type === 'module' && s.zoneIndex === zi)
      : null;
    if (seg && seg.endU > seg.startU && Number.isFinite(Number(hitWorldU))) {
      const mid = (seg.startU + seg.endU) / 2;
      const preferRight = Number(hitWorldU) >= mid;
      const halfW = moduleW / 2;
      const halfStart = preferRight ? mid : seg.startU;
      const halfEnd = preferRight ? seg.endU : mid;
      const pivotCoord =
        resolvedWall === 'left' || resolvedWall === 'front' ? halfEnd : halfStart;
      snap = { pivotCoord, zoneIndex: zi, moduleWidth: halfW };
      moduleW = halfW;
    }
  } else if (authSnap) {
    snap = {
      pivotCoord: authSnap.pivotCoord,
      zoneIndex: zi,
      moduleWidth: moduleW,
    };
  }

  const worldPos = getZonePivotWorldPosition(section, snap, resolvedWall);
  return { snap, worldPos, moduleW };
}

function __kitchenCellsUiOff() {
  return state.kitchenCellsUiEnabled === false;
}

function __kitchenFreeAlongWallDrag(group) {
  if (!__kitchenCellsUiOff() || !group) return false;
  try {
    if (isKitchenCornerBaseGroup(group) || isKitchenBaseGroup(group)) return true;
  } catch (_) {}
  return false;
}

/** IKEA-mode: ???? ?? ????? ? ??????? ???????; bbox ?? ??????? ?? ???????. */
function __applyKitchenFreeDragAlongWall(group, wallName, hitWorldU) {
  const startPos = state.dragStartFurniturePos;
  const drag = state.draggedFurniture;
  if (!startPos || !group) return false;

  const hit = Number(hitWorldU);
  if (!Number.isFinite(hit)) return false;
  if (drag && !Number.isFinite(Number(drag.startHitAlongMm))) {
    drag.startHitAlongMm = hit;
  }
  const startHit = Number(drag?.startHitAlongMm);
  const delta = Number.isFinite(startHit) ? hit - startHit : 0;

  const alongIsX = wallName === 'front' || wallName === 'back';
  const next = startPos.clone();
  if (alongIsX) next.x = startPos.x + delta;
  else next.z = startPos.z + delta;

  group.position.copy(next);
  group.updateMatrixWorld(true);

  // ?? ????????? ?? ??????? (??? IKEA): ??????? ?????, ???? AABB ?????.
  try {
    const room = state.room;
    if (room?.group && Number(room.width) > 0 && Number(room.depth) > 0) {
      const roomPos = new THREE.Vector3();
      room.group.getWorldPosition(roomPos);
      const pad = 2;
      const box = new THREE.Box3().setFromObject(group);
      let shift = 0;
      if (alongIsX) {
        const lo = roomPos.x + pad;
        const hi = roomPos.x + Number(room.width) - pad;
        if (box.min.x < lo) shift = lo - box.min.x;
        else if (box.max.x > hi) shift = hi - box.max.x;
        next.x += shift;
      } else {
        const lo = roomPos.z + pad;
        const hi = roomPos.z + Number(room.depth) - pad;
        if (box.min.z < lo) shift = lo - box.min.z;
        else if (box.max.z > hi) shift = hi - box.max.z;
        next.z += shift;
      }
      if (shift !== 0) {
        group.position.copy(next);
        group.updateMatrixWorld(true);
      }
    }
  } catch (_) {}

  try {
    if (state._liveDragGhost) state._liveDragGhost.visible = false;
  } catch (_) {}
  try {
    __setLiveDragSourceOpacity(group, 1);
  } catch (_) {}

  group.userData = group.userData || {};
  group.userData._dragHoverHitAlongMm = hit;
  group.userData._dragHoverZoneIndex = null;
  group.userData._dragFreeAlongWall = true;
  return true;
}

function __applySectionFurnitureDragAlongWall(group, wallName, hitWorldU) {
  if (__kitchenFreeAlongWallDrag(group)) {
    return __applyKitchenFreeDragAlongWall(group, wallName, hitWorldU);
  }

  const drag = state.draggedFurniture;
  const startPos = state.dragStartFurniturePos;

  // ???????? ?? ?????? ? ???? ????? ?? ????????.
  if (startPos && drag?.group === group) {
    group.position.copy(startPos);
    group.updateMatrixWorld(true);
  }

  const probe = startPos ? startPos.clone() : group.position.clone();
  if (wallName === 'front' || wallName === 'back') probe.x = hitWorldU;
  else probe.z = hitWorldU;

  const sectionAt = findSectionAtPosition(probe);
  if (!sectionAt?.division) {
    if (state._liveDragGhost) state._liveDragGhost.visible = false;
    group.userData._dragHoverZoneIndex = null;
    return true;
  }

  const resolvedWall = sectionAt.wallName || sectionAt.division?.wallName || wallName;
  if (sectionAt.lShape) __ensureLShapeLayoutCacheSegments(sectionAt);
  let snap = snapToZoneDoubleModule(
    hitWorldU,
    sectionAt.division,
    resolvedWall,
    sectionAt.id
  );
  // Спец-зона угла — не целимся жестами (призрак спрятать).
  if (snap && __isLShapeSpecialZone(sectionAt, snap.zoneIndex)) {
    if (state._liveDragGhost) state._liveDragGhost.visible = false;
    group.userData._dragHoverZoneIndex = null;
    group.userData._dragHoverHitAlongMm = Number(hitWorldU);
    return true;
  }

  const kindA =
    drag?.startDoorKind === 'single' || drag?.startDoorKind === 'double'
      ? drag.startDoorKind
      : null;

  const cell = __applyLiveDragGhostCellSnap(
    sectionAt,
    resolvedWall,
    hitWorldU,
    snap,
    kindA
  );
  snap = cell.snap;
  const worldPos = cell.worldPos;
  if (!worldPos) {
    if (state._liveDragGhost) state._liveDragGhost.visible = false;
    group.userData._dragHoverZoneIndex = null;
    return true;
  }

  const bbox = drag?.bbox;
  const extent = bbox ? bbox.max.clone().sub(bbox.min) : null;
  const h = extent ? Math.max(50, extent.y) : 2000;
  const d = extent ? Math.max(50, extent.z) : 580;
  const w = cell.moduleW > 0 ? cell.moduleW : extent ? extent.x : 500;

  const ghost = __ensureLiveDragGhost(w, h, d, group.rotation?.y);
  ghost.position.set(worldPos.x, startPos?.y ?? group.position.y, worldPos.z);
  ghost.visible = true;

  group.userData = group.userData || {};
  group.userData.sectionId = sectionAt.id;
  group.userData.wallName = resolvedWall;
  group.userData._dragHoverZoneIndex =
    snap && typeof snap.zoneIndex === 'number' ? snap.zoneIndex : null;
  group.userData._dragHoverHitAlongMm = Number(hitWorldU);
  return true;
}

/**
 * Drag furniture along wall when selected
 * @param {MouseEvent} event - Mouse event
 */
export function dragFurnitureAlongWall(event) {
  if (!state.draggedFurniture || !state.dragWall) return;

  // Проверяем что стена видима
  if (state.room && state.room.walls && state.room.walls[state.dragWall] && state.room.walls[state.dragWall].visible === false) {
    console.warn('Р? Стена скрыта — перетаскивание невозможно');
    return;
  }

  updateMousePosition(event);
  state.raycaster.setFromCamera(state.mouse, state.camera);

  if (!state.room || !state.room.wallPlanes) return;

  // Только видимые стены
  const visiblePlanes = state.room.wallPlanes.filter(p => {
    if (p.visible === false) return false;
    const wallName = p.userData.wallName;
    if (state.room.walls && state.room.walls[wallName]) {
      return state.room.walls[wallName].visible !== false;
    }
    return true;
  });
  const intersects = state.raycaster.intersectObjects(visiblePlanes);

  // Ищем пересечение ИМЕННО с той стеной, по которой тянем мебель (state.dragWall).
  // При виде спереди луч может пересекать и front, и back; нам нужна наша стена.
  let intersect = null;
  if (intersects.length > 0) {
    let maxDist = -1;
    for (let i = 0; i < intersects.length; i++) {
      const hit = intersects[i];
      const hitWallName = hit.object.userData.wallName;
      if (hitWallName !== state.dragWall) continue;
      if (hit.distance > maxDist) {
        maxDist = hit.distance;
        intersect = hit;
      }
    }
  }

  if (intersect) {
    const wallPlane = intersect.object;
    const wallName = state.dragWall;
    
    if (!state.room.walls || !state.room.walls[wallName] || state.room.walls[wallName].visible === false) {
      return;
    }

    const intersectionPoint = intersect.point.clone();
    const roomWorldPos = new THREE.Vector3();
    state.room.group.getWorldPosition(roomWorldPos);
    const localIntersectionPoint = intersectionPoint.clone().sub(roomWorldPos);

    const group = state.draggedFurniture.group;

    // Тумбы в секции: только U (влево/вправо), фасад фиксирован у секции.
    if (__furnitureDragUsesSectionAlongWall(group)) {
      const hitWorldU =
        wallName === 'front' || wallName === 'back'
          ? localIntersectionPoint.x + roomWorldPos.x
          : localIntersectionPoint.z + roomWorldPos.z;
      if (__applySectionFurnitureDragAlongWall(group, wallName, hitWorldU)) {
        return;
      }
    }

    // Get furniture bbox and size
    const bbox = state.draggedFurniture.bbox;
    const extent = bbox.max.clone().sub(bbox.min);

    const gap = 2; // 2 мм от стены (сцена в мм, не в метрах)
    const inset = 0.05; // 5cm inset

    const currentY = group.position.y;
    let finalX = localIntersectionPoint.x;
    let finalZ = localIntersectionPoint.z;

    switch (state.dragWall) {
      case 'front':
        finalX = THREE.MathUtils.clamp(localIntersectionPoint.x, inset + extent.x / 2, state.room.width - inset - extent.x / 2);
        finalZ = state.room.depth - gap - extent.z / 2;
        break;
      case 'back':
        finalX = THREE.MathUtils.clamp(localIntersectionPoint.x, inset + extent.x / 2, state.room.width - inset - extent.x / 2);
        finalZ = gap + extent.z / 2;
        break;
      case 'left':
        finalX = gap + extent.x / 2;
        finalZ = THREE.MathUtils.clamp(localIntersectionPoint.z, inset + extent.x / 2, state.room.depth - inset - extent.x / 2);
        break;
      case 'right':
        finalX = state.room.width - gap - extent.x / 2;
        finalZ = THREE.MathUtils.clamp(localIntersectionPoint.z, inset + extent.x / 2, state.room.depth - inset - extent.x / 2);
        break;
    }

    // Calculate marker position
    let markerX, markerZ;
    switch (state.dragWall) {
      case 'front':
        finalZ = state.room.depth - gap;
        markerX = finalX;
        markerZ = finalZ;
        break;
      case 'back':
        finalZ = gap;
        markerX = finalX;
        markerZ = finalZ;
        break;
      case 'left':
        finalX = gap;
        markerX = finalX;
        markerZ = finalZ;
        break;
      case 'right':
        finalX = state.room.width - gap;
        markerX = finalX;
        markerZ = finalZ;
        break;
    }

    // Update marker
    if (state.room && state.room.updateWallMarker) {
      state.room.updateWallMarker(state.dragWall, markerX, markerZ);
      Object.keys(state.room.wallMarkers || {}).forEach(key => {
        if (key !== state.dragWall && state.room.wallMarkers[key]) {
          state.room.wallMarkers[key].visible = false;
        }
      });
    }

    // World position
    let worldPos = new THREE.Vector3(
      finalX + roomWorldPos.x,
      currentY,
      finalZ + roomWorldPos.z
    );

    // Zone snapping ? ?????? ???? UI ????? ??????? (????? IKEA: ?? ????? ?????).
    if (!__kitchenFreeAlongWallDrag(group)) {
      const sectionAtPosition = findSectionAtPosition(worldPos);
      if (sectionAtPosition && sectionAtPosition.division) {
        const division = sectionAtPosition.division;
        const resolvedWallName = sectionAtPosition.wallName || division.wallName || wallName;
        const hitCoord =
          resolvedWallName === 'front' || resolvedWallName === 'back'
            ? worldPos.x
            : worldPos.z;
        const snap = snapToZoneDoubleModule(
          hitCoord,
          division,
          resolvedWallName,
          sectionAtPosition.id
        );
        if (snap) {
          worldPos = getZonePivotWorldPosition(sectionAtPosition, snap, resolvedWallName);
        }
      }
    }

    group.position.copy(worldPos);
  }
}

const _HIGHLIGHT_COLOR = new THREE.Color(0x4da6ff);
const _HIGHLIGHT_INTENSITY = 0.45;

export function setFurnitureHighlight(group, on) {
  if (!group) return;
  group.traverse((obj) => {
    if (!obj.isMesh || !obj.material) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of mats) {
      if (!mat || mat.emissive === undefined) continue;
      if (on) {
        if (!mat.__savedEmissive) {
          mat.__savedEmissive = mat.emissive.clone();
          mat.__savedEmissiveIntensity = mat.emissiveIntensity;
        }
        mat.emissive.copy(_HIGHLIGHT_COLOR);
        mat.emissiveIntensity = _HIGHLIGHT_INTENSITY;
      } else {
        if (mat.__savedEmissive) {
          mat.emissive.copy(mat.__savedEmissive);
          mat.emissiveIntensity = mat.__savedEmissiveIntensity;
          delete mat.__savedEmissive;
          delete mat.__savedEmissiveIntensity;
        }
      }
    }
  });
}

export function clearAllFurnitureHighlights() {
  if (!state.scene) return;
  state.scene.traverse((obj) => {
    if (!obj.isGroup || !obj.userData?.isFurniture) return;
    setFurnitureHighlight(obj, false);
  });
}

export function updateFurnitureHoverHighlight(event) {
  if (state.isDraggingFurniture || state.isPlacingFurniture || state.isPlacingSection || state.isDraggingFromCatalog) return;
  if (!state.scene || !state.camera) return;
  // Перетаскивание / подсветка шкафов — только шаг 4; шаг 5 (цвет) без изменений
  if (typeof window !== 'undefined' && window.currentRoomStep !== 4) {
    if (state._hoveredFurnitureUuid) {
      clearAllFurnitureHighlights();
      state._hoveredFurnitureUuid = null;
      if (state.renderer?.domElement) state.renderer.domElement.style.cursor = '';
    }
    return;
  }
  // Подсветка только при зажатой ЛКМ вместе с наведением, не при одном hover
  if ((event.buttons & 1) === 0) {
    if (state._hoveredFurnitureUuid) {
      clearAllFurnitureHighlights();
      state._hoveredFurnitureUuid = null;
      if (state.renderer?.domElement) state.renderer.domElement.style.cursor = '';
    }
    return;
  }
  updateMousePosition(event);
  state.raycaster.setFromCamera(state.mouse, state.camera);
  const meshes = __collectFurnitureMeshesForRaycast();
  if (!meshes.length) {
    if (state._hoveredFurnitureUuid) {
      clearAllFurnitureHighlights();
      state._hoveredFurnitureUuid = null;
      if (state.renderer?.domElement) state.renderer.domElement.style.cursor = '';
    }
    return;
  }
  const intersects = state.raycaster.intersectObjects(meshes, false);
  let root = null;
  if (intersects.length) root = findFurnitureRootGroupFromObject(intersects[0].object);
  const newUuid = root ? root.uuid : null;
  if (newUuid === state._hoveredFurnitureUuid) return;
  if (state._hoveredFurnitureUuid) clearAllFurnitureHighlights();
  state._hoveredFurnitureUuid = newUuid;
  if (root) {
    setFurnitureHighlight(root, true);
    if (state.renderer?.domElement) {
      const fixedEndCabinet =
        root.userData?.isEndCabinet === true || root.userData?.isEndCabinetSlot === true;
      state.renderer.domElement.style.cursor = fixedEndCabinet ? 'default' : 'grab';
    }
  } else {
    if (state.renderer?.domElement) state.renderer.domElement.style.cursor = '';
  }
}

function __collectFurnitureMeshesForRaycast() {
  const out = [];
  const seen = new Set();
  if (!state.scene) return out;
  state.scene.traverse((obj) => {
    if (!obj.isGroup || !obj.userData?.isFurniture) return;
    if (seen.has(obj)) return;
    seen.add(obj);
    obj.traverse((child) => {
      if (!child.isMesh || child.isBoxHelper) return;
      const ud = child.userData || {};
      if (ud.isWallAo || ud.isContactShadow) return;
      if (ud.isShelfProp || ud.isRodCompanion) return;
      if (child.name && (child.name.includes('PivotMarker') || child.name.includes('BBox'))) return;
      out.push(child);
    });
  });
  return out;
}

export function findFurnitureRootGroupFromObject(mesh) {
  let p = mesh;
  while (p) {
    if (p.isGroup && p.userData?.isFurniture) {
      const ud = p.userData || {};
      // Вложенные петлевые «Присадки» не корень шкафа (см. TransitionSideOverlayHeightMismatch 21.07).
      if (
        !(
          ud.isCatalogHingeModule ||
          ud.isHingeBazisExport ||
          Number(ud.cfrnDrillTemplateId) > 0 ||
          ud.hingeDrillPart ||
          ud.isDrillPlaceholder ||
          (String(p.name || '').startsWith('Furniture_') && /присадк/i.test(String(p.name || '')))
        )
      ) {
        return p;
      }
    }
    p = p.parent;
  }
  return null;
}

function __computeFurnitureLocalBBoxForDrag(grp) {
  const savedPos = grp.position.clone();
  const savedRot = grp.rotation.clone();
  grp.position.set(0, 0, 0);
  grp.rotation.set(0, 0, 0);
  grp.updateMatrixWorld(true);
  const out = new THREE.Box3();
  let has = false;
  try {
    grp.traverse((obj) => {
      if (shouldExcludeMeshFromFurnitureBBox(obj)) return;
      const b = new THREE.Box3().setFromObject(obj);
      if (!has) {
        out.copy(b);
        has = true;
      } else out.union(b);
    });
  } catch (_) {}
  if (!has) out.setFromObject(grp);
  grp.position.copy(savedPos);
  grp.rotation.copy(savedRot);
  grp.updateMatrixWorld(true);
  return out;
}

function __resolveDragWallForGroup(group) {
  const ud = group.userData || {};
  if (ud.wallName && state.room?.walls?.[ud.wallName] && state.room.walls[ud.wallName].visible !== false) {
    return ud.wallName;
  }
  if (!state.room?.group) return ud.wallName || 'back';
  const roomWorldPos = new THREE.Vector3();
  state.room.group.getWorldPosition(roomWorldPos);
  const localPos = group.position.clone().sub(roomWorldPos);
  const room = state.room;
  const wallsToCheck = [];
  if (room.walls?.front && room.walls.front.visible !== false) {
    wallsToCheck.push({ name: 'front', dist: Math.abs(localPos.z - 0) });
  }
  if (room.walls?.back && room.walls.back.visible !== false) {
    wallsToCheck.push({ name: 'back', dist: Math.abs(localPos.z - room.depth) });
  }
  if (room.walls?.left && room.walls.left.visible !== false) {
    wallsToCheck.push({ name: 'left', dist: Math.abs(localPos.x - 0) });
  }
  if (room.walls?.right && room.walls.right.visible !== false) {
    wallsToCheck.push({ name: 'right', dist: Math.abs(localPos.x - room.width) });
  }
  if (wallsToCheck.length === 0) return ud.attachedWall || ud.wallName || 'back';
  return wallsToCheck.reduce((min, w) => (w.dist < min.dist ? w : min)).name;
}

/**
 * ЛКМ на размещённый шкаф: начать перетаскивание вдоль стены (с зоновым снапом).
 * @returns {boolean} true если drag начат
 */
export function tryBeginFurnitureDragFromCanvas(event) {
  if (!state.scene || !state.camera || !state.room || event.button !== 0) return false;
  if (typeof window !== 'undefined' && window.currentRoomStep !== 4) return false;
  updateMousePosition(event);
  state.raycaster.setFromCamera(state.mouse, state.camera);
  const meshes = __collectFurnitureMeshesForRaycast();
  if (meshes.length === 0) return false;
  const intersects = state.raycaster.intersectObjects(meshes, false);
  if (!intersects.length) return false;
  const root = findFurnitureRootGroupFromObject(intersects[0].object);
  if (!root) return false;

  // Торцевой шкаф имеет единственную допустимую позицию — собственный
  // торцевой слот. Обычный canvas-drag умеет только зоны основного ряда и
  // при старте такого drag ошибочно назначал торцевому zoneIndex.
  if (root.userData?.isEndCabinet === true || root.userData?.isEndCabinetSlot === true) {
    state.selectedFurniture = { group: root };
    clearAllFurnitureHighlights();
    setFurnitureHighlight(root, true);
    if (state.renderer?.domElement) state.renderer.domElement.style.cursor = '';
    return true;
  }

  const dragWall = __resolveDragWallForGroup(root);
  if (dragWall && state.room.walls?.[dragWall] && state.room.walls[dragWall].visible === false) {
    return false;
  }

  try {
    deselectAllStep5Furniture();
  } catch (_) {}

  const bbox = __computeFurnitureLocalBBoxForDrag(root);
  const startZoneIndex =
    typeof root.userData?.zoneIndex === 'number' ? root.userData.zoneIndex : null;
  let startDoorKind = null;
  try {
    const sid = root.userData?.sectionId;
    const sec =
      sid != null
        ? (state.customSections || []).find((s) => s && s.id === sid)
        : null;
    if (sec && typeof startZoneIndex === 'number') {
      startDoorKind = getZoneDoorKind(sec, startZoneIndex);
    }
    if (!startDoorKind) {
      startDoorKind = inferModuleDoorKindForGroup(root.userData, null);
    }
  } catch (_) {}
  state.isDraggingFurniture = true;
  state.draggedFurniture = {
    group: root,
    bbox,
    startSectionId: root.userData?.sectionId ?? null,
    startZoneIndex,
    startDoorKind,
  };
  state.dragWall = dragWall;
  state.dragStartMousePos = { x: event.clientX, y: event.clientY };
  state.dragStartFurniturePos = root.position.clone();
  state.selectedFurniture = { group: root };
  clearAllFurnitureHighlights();
  setFurnitureHighlight(root, true);
  // Live-drag: ?????? ? ???????; IKEA free ? ??? ?????? ????????????.
  if (__furnitureDragUsesSectionAlongWall(root)) {
    if (__kitchenFreeAlongWallDrag(root)) {
      __setLiveDragSourceOpacity(root, 1);
      __removeLiveDragGhost();
    } else {
      __setLiveDragSourceOpacity(root, 0.35);
      __removeLiveDragGhost();
    }
  }
  const selName = root.userData?.catalogName;
  if (selName) {
    console.info('[CLD] Выбран шкаф в комнате:', selName, {
      catalogId: root.userData?.catalogItemId,
      zone: root.userData?.zoneIndex,
      sectionId: root.userData?.sectionId,
    });
  }
  if (state.renderer?.domElement) state.renderer.domElement.style.cursor = 'grabbing';
  return true;
}

function __syncFurnitureZoneFromWorldPosition(group) {
  const worldPos = new THREE.Vector3();
  group.getWorldPosition(worldPos);
  const sectionAt = findSectionAtPosition(worldPos);
  if (!sectionAt || !sectionAt.division) return null;
  const wallName = sectionAt.wallName || sectionAt.division?.wallName || state.dragWall || 'back';
  const hitCoord =
    wallName === 'front' || wallName === 'back' ? worldPos.x : worldPos.z;
  const snap = snapToZoneDoubleModule(hitCoord, sectionAt.division, wallName, sectionAt.id);
  group.userData = group.userData || {};
  group.userData.sectionId = sectionAt.id;
  group.userData.wallName = wallName;
  if (snap && typeof snap.zoneIndex === 'number') {
    group.userData.zoneIndex = snap.zoneIndex;
  }
  return sectionAt;
}

/** Ширина модуля (мм) по зоне из актуального layout cache или division. */
function __getModuleWidthMmForZone(sectionData, zoneIndex) {
  if (zoneIndex == null || !sectionData) return 0;
  const segs = sectionData._layoutCache?.segments;
  if (Array.isArray(segs)) {
    const s = segs.find((x) => x.type === 'module' && x.zoneIndex === zoneIndex);
    if (s && Number.isFinite(s.endU - s.startU)) return s.endU - s.startU;
  }
  const div = sectionData.division;
  if (div?.customZoneWidthsMm && typeof div.customZoneWidthsMm === 'object') {
    const cw = Number(div.customZoneWidthsMm[zoneIndex] ?? div.customZoneWidthsMm[String(zoneIndex)]);
    if (Number.isFinite(cw) && cw > 0) return cw;
  }
  const ps = Number(div?.partSize);
  return Number.isFinite(ps) && ps > 0 ? ps : 0;
}

/**
 * После обмена шкафами между зонами ziA и ziB — поменять местами ширины слотов на стене,
 * чтобы однодверный/двухдверный тип зоны (doorKind, пунктир) следовал за шкафом.
 * @returns {boolean} true если ширины реально поменяли
 */
function __swapSectionZoneWidthsForCabinetExchange(sectionData, ziA, ziB) {
  const div = sectionData?.division;
  if (!div || ziA === ziB) return false;
  if (Array.isArray(div.segmentsLShape) && div.segmentsLShape.length) return false;
  if (Array.isArray(div.segmentsLShapeBack) && div.segmentsLShapeBack.length) return false;

  const wA = __getModuleWidthMmForZone(sectionData, ziA);
  const wB = __getModuleWidthMmForZone(sectionData, ziB);
  if (!Number.isFinite(wA) || !Number.isFinite(wB) || wA <= 0 || wB <= 0) return false;
  if (Math.abs(wA - wB) < 0.5) return false;

  if (!div.customZoneWidthsMm || typeof div.customZoneWidthsMm !== 'object') {
    div.customZoneWidthsMm = {};
  }
  const czw = div.customZoneWidthsMm;
  czw[ziA] = wB;
  czw[ziB] = wA;
  try {
    markCustomZoneWidthsSource(sectionData, CUSTOM_ZONE_WIDTHS_SOURCE_USER, {
      bandId: 'base',
      division: true,
    });
  } catch (_) {
    div.customZoneWidthsSource = 'user';
  }
  try {
    if (typeof window !== 'undefined' && typeof window.__cldMirrorCustomZoneWidthsToKitchenBaseGrid === 'function') {
      window.__cldMirrorCustomZoneWidthsToKitchenBaseGrid(sectionData);
    }
  } catch (_) {}
  return true;
}

/** doorKind уже стоящего шкафа (для reorder без растягивания). */
function __inferPlacedGroupDoorKind(group, sectionData, fallbackZi) {
  const ud = group?.userData || {};
  const fromUd = normalizeDoorKind(ud.doorKind);
  if (fromUd === 'single' || fromUd === 'double') return fromUd;
  const fromPair = inferModuleDoorKindForGroup(ud, null);
  if (fromPair === 'single' || fromPair === 'double') return fromPair;
  const zi =
    typeof fallbackZi === 'number'
      ? fallbackZi
      : typeof ud.zoneIndex === 'number'
        ? ud.zoneIndex
        : null;
  if (sectionData && typeof zi === 'number') {
    const zk = getZoneDoorKind(sectionData, zi);
    if (zk === 'single' || zk === 'double') return zk;
    const w = __getModuleWidthMmForZone(sectionData, zi);
    if (w > 0 && w < 800) return 'single';
    if (w >= 800) return 'double';
  }
  return 'single';
}

function __cellQuantumMm(sectionData) {
  const div = sectionData?.division;
  if (!div) return 0;
  const innerW = Math.round(Number(div.sectionEnd) - Number(div.sectionStart));
  const nStrip = Number(div.stripCountN);
  if (Number.isFinite(nStrip) && nStrip >= 2 && innerW > 0) {
    return Math.round(innerW / nStrip);
  }
  const parts = Math.max(0, Math.floor(Number(div.parts) || 0));
  const widths = [];
  for (let i = 0; i < parts; i++) {
    const w = Math.round(__getModuleWidthMmForZone(sectionData, i));
    if (w > 0) widths.push(w);
  }
  if (!widths.length) {
    const ps = Number(div.partSize);
    return Number.isFinite(ps) && ps > 0 ? Math.round(ps / 2) : 500;
  }
  const halves = widths.map((w) => (w >= 800 ? Math.round(w / 2) : w));
  halves.sort((a, b) => a - b);
  return halves[Math.floor(halves.length / 2)] || 500;
}

function __collectSectionFurnitureOrdered(sectionData) {
  const out = [];
  if (!state.scene || !sectionData?.id) return out;
  const sid = String(sectionData.id);
  state.scene.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    if (String(obj.userData.sectionId) !== sid) return;
    if (obj.userData.isEndCabinet || obj.userData.__endCabinetSide) return;
    if (typeof obj.userData.zoneIndex !== 'number') return;
    out.push(obj);
  });
  out.sort((a, b) => Number(a.userData.zoneIndex) - Number(b.userData.zoneIndex));
  return out;
}

/**
 * Переставить шкафы в порядке orderedGroups и пересобрать ширины зон по kind
 * (Single=1 ячейка, Double=2) — без растягивания Single на double-слот.
 */
function __rebuildZonesFromFurnitureOrder(sectionData, orderedGroups) {
  if (!sectionAllowsZonePlaceGestures(sectionData)) return false;
  const div = sectionData?.division;
  if (!div || !orderedGroups?.length) return false;

  const specialZi = __getLShapeSpecialZoneIndex(sectionData);
  const isL = !!sectionData.lShape && specialZi != null;

  // На L — только шкафы свободного плеча; спец не входит в orderedGroups.
  const regularGroups = isL
    ? orderedGroups.filter((g) => {
        const zi = g?.userData?.zoneIndex;
        return !(typeof zi === 'number' && zi === specialZi);
      })
    : orderedGroups.slice();
  if (!regularGroups.length) return false;

  let specialGroup = null;
  let specialW = 0;
  if (isL) {
    __ensureLShapeLayoutCacheSegments(sectionData);
    const sid = String(sectionData.id);
    state.scene?.traverse((obj) => {
      if (specialGroup) return;
      if (!obj?.isGroup || !obj.userData?.isFurniture) return;
      if (String(obj.userData.sectionId) !== sid) return;
      if (obj.userData.isEndCabinet) return;
      if (obj.userData.zoneIndex === specialZi) specialGroup = obj;
    });
    specialW = Math.round(
      (Number(div.singleWidthMm) || 0) + (Number(div.cornerWidthMm) || 0)
    );
    if (!(specialW > 0)) {
      specialW = Math.round(__getModuleWidthMmForZone(sectionData, specialZi)) || 0;
    }
    if (!(specialW > 0)) return false;
  }

  const innerW = isL
    ? Math.round(Number(div.freeSizeMm) || 0)
    : Math.round(Number(div.sectionEnd) - Number(div.sectionStart));
  if (!(innerW > 0)) return false;

  let cellW = __cellQuantumMm(sectionData);
  if (isL && Number(div.singleWidthMm) > 0) {
    cellW = Math.round(Number(div.singleWidthMm));
  }
  if (!(cellW > 0)) return false;

  const widthsReg = [];
  for (const g of regularGroups) {
    const kind = __inferPlacedGroupDoorKind(g, sectionData);
    const cells = kind === 'double' ? 2 : 1;
    widthsReg.push(Math.max(ZONE_GESTURE_MIN_WIDTH_MM, Math.round(cells * cellW)));
  }

  let used = widthsReg.reduce((s, w) => s + w, 0);
  let rem = innerW - used;
  if (used > innerW + 2) {
    const scale = innerW / used;
    for (let i = 0; i < widthsReg.length; i++) {
      widthsReg[i] = Math.max(ZONE_GESTURE_MIN_WIDTH_MM, Math.round(widthsReg[i] * scale));
    }
    used = widthsReg.reduce((s, w) => s + w, 0);
    rem = innerW - used;
  }
  while (rem >= cellW * 2 - 2) {
    widthsReg.push(Math.round(2 * cellW));
    rem -= Math.round(2 * cellW);
  }
  if (rem >= Math.max(ZONE_GESTURE_MIN_WIDTH_MM, cellW - 2)) {
    widthsReg.push(rem);
    rem = 0;
  } else if (rem !== 0 && widthsReg.length) {
    widthsReg[widthsReg.length - 1] += rem;
  }

  let widths;
  if (isL && specialZi === 0) {
    widths = [specialW, ...widthsReg];
    if (specialGroup) specialGroup.userData.zoneIndex = 0;
    for (let i = 0; i < regularGroups.length; i++) {
      regularGroups[i].userData = regularGroups[i].userData || {};
      regularGroups[i].userData.zoneIndex = i + 1;
    }
  } else if (isL) {
    widths = [...widthsReg, specialW];
    for (let i = 0; i < regularGroups.length; i++) {
      regularGroups[i].userData = regularGroups[i].userData || {};
      regularGroups[i].userData.zoneIndex = i;
    }
    if (specialGroup) specialGroup.userData.zoneIndex = regularGroups.length;
  } else {
    widths = widthsReg;
    for (let i = 0; i < regularGroups.length; i++) {
      regularGroups[i].userData = regularGroups[i].userData || {};
      regularGroups[i].userData.zoneIndex = i;
    }
  }

  applySectionCustomZoneWidthsMm(sectionData, widths);
  if (isL) {
    const newSpecialZi = specialZi === 0 ? 0 : widths.length - 1;
    __rebuildLShapeSegmentsFromWidths(sectionData, widths, newSpecialZi);
  }

  console.log('[DRAG-REORDER] rebuild zones', {
    sectionId: sectionData.id,
    lShape: isL,
    specialZi: isL ? (specialZi === 0 ? 0 : widths.length - 1) : null,
    parts: widths.length,
    widths,
    modules: regularGroups.map((g) => ({
      zi: g.userData.zoneIndex,
      kind: __inferPlacedGroupDoorKind(g, sectionData),
      name: g.userData.catalogName,
    })),
  });
  return true;
}

function __tryInsertSingleIntoOccupiedDouble(sectionData, groupA, groupD, hitAlongMm) {
  if (!sectionData || !groupA || !groupD) return false;
  if (!sectionAllowsZonePlaceGestures(sectionData)) return false;

  const ziA0 = groupA.userData?.zoneIndex;
  const ziD0 = groupD.userData?.zoneIndex;
  if (__isLShapeSpecialZone(sectionData, ziA0) || __isLShapeSpecialZone(sectionData, ziD0)) {
    console.log('[DRAG] insert-shift blocked: L special zone');
    return false;
  }

  if (sectionData.lShape) __ensureLShapeLayoutCacheSegments(sectionData);

  groupA.userData = groupA.userData || {};
  groupD.userData = groupD.userData || {};
  groupA.userData.doorKind = 'single';
  groupD.userData.doorKind = 'double';

  const specialZi = __getLShapeSpecialZoneIndex(sectionData);
  let ordered = __collectSectionFurnitureOrdered(sectionData);
  if (specialZi != null) {
    ordered = ordered.filter((g) => g.userData?.zoneIndex !== specialZi);
  }
  const from = ordered.findIndex((g) => g.uuid === groupA.uuid);
  const to0 = ordered.findIndex((g) => g.uuid === groupD.uuid);
  if (from < 0 || to0 < 0 || from === to0) return false;

  ordered.splice(from, 1);
  const idxD = ordered.findIndex((g) => g.uuid === groupD.uuid);
  if (idxD < 0) return false;

  const ziD =
    typeof groupD.userData.zoneIndex === 'number' ? groupD.userData.zoneIndex : to0;
  const half = resolveZoneSplitHalf(sectionData, ziD, hitAlongMm);
  const insertAt = half === 'right' ? idxD + 1 : idxD;
  ordered.splice(insertAt, 0, groupA);

  if (!__rebuildZonesFromFurnitureOrder(sectionData, ordered)) return false;
  console.log('[DRAG] insert-shift S into D', {
    half,
    insertAt,
    placeZi: groupA.userData.zoneIndex,
    doubleZi: groupD.userData.zoneIndex,
  });
  return true;
}

function __fitAllFurnitureInSection(sectionData) {
  if (!sectionData || !state.scene) return;
  const layout =
    typeof window.__clodisComputeSectionLayout === 'function'
      ? window.__clodisComputeSectionLayout(sectionData)
      : null;
  const sid = String(sectionData.id);
  state.scene.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    if (String(obj.userData.sectionId) !== sid) return;
    if (obj.userData.isEndCabinet) return;
    const zi = obj.userData.zoneIndex;
    if (typeof zi !== 'number') return;
    try {
      fitFurnitureToSectionZone(obj, sectionData, zi, layout || undefined);
    } catch (_) {}
  });
  try {
    if (typeof window.updateCabinetMarkersForSection === 'function') {
      window.updateCabinetMarkersForSection(sectionData.id);
    }
    if (typeof window.rebuildSectionZoneEditIconsForSection === 'function') {
      window.rebuildSectionZoneEditIconsForSection(sectionData.id);
    }
  } catch (_) {}
}

/**
 * mouseup после drag:
 * — одинаковый размер (S-S / D-D): обмен с шкафом под курсором;
 * — Single > half занятого Double: вставка + сдвиг Double (оба остаются);
 * — пустой double / разный span без жильца: A0/eat через prepareZonePlaceGesture;
 * — пустая зона того же span: переезд.
 */
export function finishFurnitureDragFromCanvas(event) {
  const drag = state.draggedFurniture;
  const groupA = drag?.group;
  if (!groupA || !state.scene) return;

  // Снять призрак / вернуть непрозрачность до логики swap/move.
  try {
    __removeLiveDragGhost();
    __setLiveDragSourceOpacity(groupA, 1);
  } catch (_) {}

  updateMousePosition(event);
  state.raycaster.setFromCamera(state.mouse, state.camera);
  const meshes = __collectFurnitureMeshesForRaycast();
  let groupB = null;
  if (meshes.length) {
    const intersects = state.raycaster.intersectObjects(meshes, false);
    for (let i = 0; i < intersects.length; i++) {
      const root = findFurnitureRootGroupFromObject(intersects[i].object);
      if (root && root.uuid !== groupA.uuid) {
        groupB = root;
        break;
      }
    }
  }

  const startSectionId = drag?.startSectionId ?? groupA.userData?.sectionId ?? null;
  const startZi =
    typeof drag?.startZoneIndex === 'number'
      ? drag.startZoneIndex
      : typeof groupA.userData?.zoneIndex === 'number'
        ? groupA.userData.zoneIndex
        : null;
  const needUpdate =
    typeof window !== 'undefined' &&
    typeof window.__clodisUpdateFurnitureInSection === 'function';

  const sectionSwap =
    startSectionId != null
      ? state.customSections.find((s) => s && s.id === startSectionId)
      : null;

  const sectionsToRefresh = new Set();
  let dragAction = null;
  let swappedWidths = false;
  let fitGroups = [groupA];

  let ghostZi =
    typeof groupA.userData?._dragHoverZoneIndex === 'number'
      ? groupA.userData._dragHoverZoneIndex
      : null;

  if (
    ghostZi == null &&
    sectionSwap?.division &&
    Number.isFinite(groupA.position?.x)
  ) {
    const wallName =
      sectionSwap.wallName || sectionSwap.division?.wallName || state.dragWall || 'back';
    const hitCoord =
      wallName === 'front' || wallName === 'back'
        ? groupA.position.x
        : groupA.position.z;
    const snap = snapToZoneDoubleModule(
      hitCoord,
      sectionSwap.division,
      wallName,
      sectionSwap.id
    );
    if (snap && typeof snap.zoneIndex === 'number') ghostZi = snap.zoneIndex;
  }

  const kindA =
    drag?.startDoorKind === 'single' || drag?.startDoorKind === 'double'
      ? drag.startDoorKind
      : sectionSwap && typeof startZi === 'number'
        ? getZoneDoorKind(sectionSwap, startZi)
        : null;

  const wallNameHit =
    sectionSwap?.wallName ||
    sectionSwap?.division?.wallName ||
    state.dragWall ||
    'back';
  // Координата призрака/курсора вдоль стены (не стартовая позиция шкафа).
  const hitAlongMm =
    typeof groupA.userData?._dragHoverHitAlongMm === 'number'
      ? groupA.userData._dragHoverHitAlongMm
      : wallNameHit === 'front' || wallNameHit === 'back'
        ? groupA.position.x
        : groupA.position.z;

  let skipDragLogic = false;
  // IKEA-mode: ????? ???? ???????? ? ?? cancel ? ?? snap ? ??????.
  if (__kitchenFreeAlongWallDrag(groupA)) {
    if (typeof startZi === 'number') groupA.userData.zoneIndex = startZi;
    delete groupA.userData._dragHoverZoneIndex;
    delete groupA.userData._dragHoverHitAlongMm;
    delete groupA.userData._dragFreeAlongWall;
    if (sectionSwap) sectionsToRefresh.add(sectionSwap);
    dragAction = 'free-along-wall';
    skipDragLogic = true;
    console.log('[DRAG] free along wall (cells UI off)');
  } else if (
    sectionSwap?.lShape &&
    (__isLShapeSpecialZone(sectionSwap, startZi) ||
      __isLShapeSpecialZone(sectionSwap, ghostZi) ||
      (groupB && __isLShapeSpecialZone(sectionSwap, groupB.userData?.zoneIndex)))
  ) {
    if (typeof startZi === 'number') groupA.userData.zoneIndex = startZi;
    delete groupA.userData._dragHoverZoneIndex;
    delete groupA.userData._dragHoverHitAlongMm;
    sectionsToRefresh.add(sectionSwap);
    dragAction = 'cancel';
    skipDragLogic = true;
    console.log('[DRAG] blocked L special zone');
  }

  // Same-size: только шкаф под курсором (raycast).
  if (
    !skipDragLogic &&
    groupB &&
    sectionSwap &&
    groupB.userData?.sectionId === startSectionId &&
    typeof startZi === 'number' &&
    typeof groupB.userData?.zoneIndex === 'number' &&
    groupB.userData.zoneIndex !== startZi
  ) {
    const ziA = startZi;
    const ziB = groupB.userData.zoneIndex;
    const kindB = getZoneDoorKind(sectionSwap, ziB);
    const wA = __getModuleWidthMmForZone(sectionSwap, ziA);
    const wB = __getModuleWidthMmForZone(sectionSwap, ziB);
    const sameSpan =
      (kindA && kindB && kindA === kindB) ||
      (wA > 0 && wB > 0 && Math.abs(wA - wB) < 1);

    if (sameSpan) {
      swappedWidths = !!__swapSectionZoneWidthsForCabinetExchange(sectionSwap, ziA, ziB);
      groupA.userData.zoneIndex = ziB;
      groupB.userData.zoneIndex = ziA;
      if (kindA) groupA.userData.doorKind = kindA;
      delete groupA.userData._dragHoverZoneIndex;
      delete groupA.userData._dragHoverHitAlongMm;
      delete groupB.userData._dragHoverZoneIndex;
      sectionsToRefresh.add(sectionSwap);
      dragAction = 'swap';
      fitGroups = [groupA, groupB];
      console.log('[DRAG-SWAP] same-span on target cabinet', {
        from: ziA,
        to: ziB,
        kindA,
        kindB,
      });
    } else if (
      kindA === 'single' &&
      (kindB === 'double' || wB >= 800) &&
      sectionAllowsZonePlaceGestures(sectionSwap)
    ) {
      delete groupA.userData._dragHoverZoneIndex;
      if (__tryInsertSingleIntoOccupiedDouble(sectionSwap, groupA, groupB, hitAlongMm)) {
        delete groupA.userData._dragHoverHitAlongMm;
        sectionsToRefresh.add(sectionSwap);
        dragAction = 'insert-shift';
        swappedWidths = true;
      } else {
        groupA.userData.zoneIndex = startZi;
        sectionsToRefresh.add(sectionSwap);
        dragAction = 'cancel';
        console.log('[DRAG] insert-shift refused');
      }
    } else if (
      kindA &&
      sectionAllowsZonePlaceGestures(sectionSwap) &&
      typeof ghostZi === 'number'
    ) {
      groupA.userData.zoneIndex = null;
      delete groupA.userData._dragHoverZoneIndex;
      const gest = prepareZonePlaceGesture(
        sectionSwap,
        ghostZi,
        kindA,
        hitAlongMm,
        resolveGroupZoneCohabitSpec(groupA)
      );
      if (gest?.ok) {
        groupA.userData.zoneIndex = gest.placeZoneIndex;
        groupA.userData.doorKind = kindA;
        delete groupA.userData._dragHoverHitAlongMm;
        sectionsToRefresh.add(sectionSwap);
        dragAction = 'move-gesture';
        swappedWidths = true;
        console.log('[DRAG] cross-span at ghost', {
          ghostZi,
          place: gest.placeZoneIndex,
          gesture: gest.gesture,
          kindA,
        });
      } else {
        groupA.userData.zoneIndex = startZi;
        sectionsToRefresh.add(sectionSwap);
        dragAction = 'cancel';
        console.log('[DRAG] cross-span refused', gest?.reason);
      }
    } else {
      groupA.userData.zoneIndex = startZi;
      delete groupA.userData._dragHoverZoneIndex;
      delete groupA.userData._dragHoverHitAlongMm;
      sectionsToRefresh.add(sectionSwap);
      dragAction = 'cancel';
      console.log('[DRAG] refuse cross-span', { kindA, kindB });
    }
  } else if (
    !skipDragLogic &&
    sectionSwap &&
    typeof startZi === 'number' &&
    typeof ghostZi === 'number' &&
    ghostZi !== startZi
  ) {
    let occupant = null;
    state.scene.traverse((obj) => {
      if (occupant) return;
      if (!obj?.isGroup || !obj.userData?.isFurniture) return;
      if (obj.uuid === groupA.uuid) return;
      if (String(obj.userData?.sectionId) !== String(startSectionId)) return;
      if (obj.userData?.zoneIndex === ghostZi) occupant = obj;
    });

    const targetKind = getZoneDoorKind(sectionSwap, ghostZi);
    const occKind = occupant
      ? getZoneDoorKind(sectionSwap, occupant.userData.zoneIndex)
      : null;
    const occW = occupant
      ? __getModuleWidthMmForZone(sectionSwap, occupant.userData.zoneIndex)
      : 0;

    // base+upper одной группы: встать в ту же ячейку, не swap
    let didCohabit = false;
    if (occupant) {
      const pendingSpec = resolveGroupZoneCohabitSpec(groupA);
      const zoneOcc = collectFurnitureGroupsInZone(startSectionId, ghostZi).filter(
        (g) => g.uuid !== groupA.uuid
      );
      const cohabitOk =
        pendingSpec.role !== 'full' &&
        zoneOcc.some((g) => {
          const s = resolveGroupZoneCohabitSpec(g);
          if (groupsCanCohabitInZone(groupA, g)) return true;
          return !!(s.group && s.group === pendingSpec.group);
        });
      if (cohabitOk) {
        removeIncompatibleZoneOccupantsForPlace(
          startSectionId,
          ghostZi,
          pendingSpec,
          groupA.uuid
        );
        groupA.userData.zoneIndex = ghostZi;
        if (kindA) groupA.userData.doorKind = kindA;
        delete groupA.userData._dragHoverZoneIndex;
        delete groupA.userData._dragHoverHitAlongMm;
        sectionsToRefresh.add(sectionSwap);
        dragAction = 'cohabit';
        fitGroups = [groupA];
        didCohabit = true;
        console.log('[DRAG-COHABIT] stack in zone', {
          from: startZi,
          to: ghostZi,
          role: pendingSpec.role,
          group: pendingSpec.group,
        });
      }
    }

    if (didCohabit) {
      // уже в ячейке с парой
    } else if (occupant && kindA && occKind && kindA === occKind) {
      const ziA = startZi;
      const ziB = occupant.userData.zoneIndex;
      swappedWidths = !!__swapSectionZoneWidthsForCabinetExchange(sectionSwap, ziA, ziB);
      groupA.userData.zoneIndex = ziB;
      occupant.userData.zoneIndex = ziA;
      if (kindA) groupA.userData.doorKind = kindA;
      delete groupA.userData._dragHoverZoneIndex;
      delete groupA.userData._dragHoverHitAlongMm;
      delete occupant.userData._dragHoverZoneIndex;
      groupB = occupant;
      sectionsToRefresh.add(sectionSwap);
      dragAction = 'swap';
      fitGroups = [groupA, occupant];
      console.log('[DRAG-SWAP] same-span via ghost zone', { from: ziA, to: ziB });
    } else if (
      occupant &&
      kindA === 'single' &&
      (occKind === 'double' || occW >= 800) &&
      sectionAllowsZonePlaceGestures(sectionSwap)
    ) {
      delete groupA.userData._dragHoverZoneIndex;
      if (__tryInsertSingleIntoOccupiedDouble(sectionSwap, groupA, occupant, hitAlongMm)) {
        delete groupA.userData._dragHoverHitAlongMm;
        groupB = occupant;
        sectionsToRefresh.add(sectionSwap);
        dragAction = 'insert-shift';
        swappedWidths = true;
      } else {
        groupA.userData.zoneIndex = startZi;
        sectionsToRefresh.add(sectionSwap);
        dragAction = 'cancel';
      }
    } else if (
      kindA &&
      targetKind &&
      kindA !== targetKind &&
      sectionAllowsZonePlaceGestures(sectionSwap)
    ) {
      groupA.userData.zoneIndex = null;
      delete groupA.userData._dragHoverZoneIndex;
      const gest = prepareZonePlaceGesture(
        sectionSwap,
        ghostZi,
        kindA,
        hitAlongMm,
        resolveGroupZoneCohabitSpec(groupA)
      );
      if (gest?.ok) {
        groupA.userData.zoneIndex = gest.placeZoneIndex;
        groupA.userData.doorKind = kindA;
        delete groupA.userData._dragHoverHitAlongMm;
        sectionsToRefresh.add(sectionSwap);
        dragAction = 'move-gesture';
        swappedWidths = true;
        console.log('[DRAG-MOVE] gesture at ghost', {
          from: startZi,
          ghostZi,
          place: gest.placeZoneIndex,
          gesture: gest.gesture,
        });
      } else {
        groupA.userData.zoneIndex = startZi;
        sectionsToRefresh.add(sectionSwap);
        dragAction = 'cancel';
        console.log('[DRAG-MOVE] gesture refused', gest?.reason);
      }
    } else {
      let placeZi = ghostZi;
      groupA.userData.zoneIndex = placeZi;
      if (kindA) groupA.userData.doorKind = kindA;
      delete groupA.userData._dragHoverZoneIndex;
      delete groupA.userData._dragHoverHitAlongMm;
      if (sectionAllowsZonePlaceGestures(sectionSwap)) {
        placeZi = repackStraightEmptiesAsDoubles(sectionSwap, placeZi);
        groupA.userData.zoneIndex = placeZi;
      }
      sectionsToRefresh.add(sectionSwap);
      dragAction = 'move';
      console.log('[DRAG-MOVE] same-span empty at ghost', { from: startZi, to: placeZi });
    }
  } else if (!skipDragLogic) {
    const sectionData = __syncFurnitureZoneFromWorldPosition(groupA);
    if (typeof startZi === 'number' && groupA.userData) {
      if (
        typeof ghostZi !== 'number' ||
        ghostZi === startZi ||
        groupA.userData.zoneIndex == null
      ) {
        groupA.userData.zoneIndex = startZi;
      }
    }
    delete groupA.userData?._dragHoverZoneIndex;
    delete groupA.userData?._dragHoverHitAlongMm;
    if (sectionData) sectionsToRefresh.add(sectionData);
  }

  if (startSectionId && Array.isArray(state.customSections)) {
    const newSid = groupA.userData?.sectionId;
    if (newSid && newSid !== startSectionId) {
      const oldSec = state.customSections.find((s) => s && s.id === startSectionId);
      if (oldSec) sectionsToRefresh.add(oldSec);
    }
  }

  const didGesture = dragAction === 'move-gesture';
  const didInsert = dragAction === 'insert-shift';
  const didSwap = dragAction === 'swap';
  const didMove = dragAction === 'move';
  const didCancel = dragAction === 'cancel';
  const didFreeAlongWall = dragAction === 'free-along-wall';

  const useLightLayout =
    !didFreeAlongWall &&
    (didSwap || didMove || didGesture || didInsert || didCancel) &&
    sectionSwap?.division &&
    !sectionSwap.underWindowBay;

  if (useLightLayout) {
    const t0 = performance.now();
    try {
      const layout =
        typeof window.__clodisComputeSectionLayout === 'function'
          ? window.__clodisComputeSectionLayout(sectionSwap)
          : null;
      if (didGesture || didInsert) {
        __fitAllFurnitureInSection(sectionSwap);
      } else {
        for (const g of fitGroups) {
          if (!g || typeof g.userData?.zoneIndex !== 'number') continue;
          fitFurnitureToSectionZone(g, sectionSwap, g.userData.zoneIndex, layout || undefined);
        }
        if (swappedWidths && typeof window.updateCabinetMarkersForSection === 'function') {
          window.updateCabinetMarkersForSection(sectionSwap.id);
        }
        if (typeof window.rebuildSectionZoneEditIconsForSection === 'function') {
          window.rebuildSectionZoneEditIconsForSection(sectionSwap.id);
        }
      }
      syncSingleSwingNeighborsAfterPlace(sectionSwap);
    } catch (e) {
      console.warn('[DRAG] light fit failed', e);
      try {
        window.__clodisUpdateFurnitureInSection(sectionSwap);
      } catch (_) {}
    }
    console.log('[DRAG] light layout', {
      mode: dragAction,
      ms: Math.round(performance.now() - t0),
    });
  } else if (needUpdate && !didFreeAlongWall) {
    // IKEA free-drag: ?? updateFurnitureInSection ? ????? fit ? ?????? ? ???????? ï¿½???????ï¿½.
    for (const sec of sectionsToRefresh) {
      try {
        syncSingleSwingNeighborsAfterPlace(sec);
      } catch (_) {}
    }
    for (const sec of sectionsToRefresh) {
      try {
        window.__clodisUpdateFurnitureInSection(sec);
      } catch (e) {
        console.warn('[DRAG] updateFurnitureInSection', e);
      }
    }
  } else if (didFreeAlongWall) {
    console.log('[DRAG] free along wall committed (no zone fit)');
    try {
      if (typeof window.rebuildSectionZoneEditIconsForSection === 'function' && sectionSwap?.id) {
        window.rebuildSectionZoneEditIconsForSection(sectionSwap.id);
      }
    } catch (_) {}
  }

  clearAllFurnitureHighlights();
  state._hoveredFurnitureUuid = null;
  if (state.renderer?.domElement) state.renderer.domElement.style.cursor = '';

  // Light layout only fits furniture in zones. SideCap/TopCap/AutoTop/planks are
  // world-space ? without rebuild they stay at the pre-drag pose.
  // Free IKEA-drag: ?? ???????????? ??? ? ????? ????????/????? ï¿½??????????ï¿½.
  try {
    const wallForTx =
      sectionSwap?.wallName || groupA.userData?.wallName || state.dragWall || null;
    if (wallForTx && !didFreeAlongWall) {
      rebuildTransitionsForWall(wallForTx, {
        skipFurnitureDecorRefresh: true,
        placeLayoutOnly: true,
        furnitureLayoutOnlyUuids: [groupA.uuid],
      });
    }
  } catch (e) {
    console.error('[DRAG] rebuild transitions failed', e);
  }

  try {
    if (typeof window !== 'undefined' && window.currentRoomStep === 5) {
      buildStep5FurnitureIcons();
    } else if (
      typeof window !== 'undefined' &&
      window.currentRoomStep === 4 &&
      !useLightLayout
    ) {
      if (hasAnyFurnitureInScene()) buildStep4SectionEditIcons();
    }
    refreshFurnitureCatalogNameLabels();
  } catch (_) {}

  // Stage5: только после завершения drag (не на mousemove).
  try {
    if (typeof window !== 'undefined' && typeof window.__cldMarkRoomDraftDirty === 'function') {
      window.__cldMarkRoomDraftDirty('furniture_drag');
    }
  } catch (_) {}
}


/** Есть ли в сцене хотя бы один размещённый шкаф (группа с isFurniture). */
export function hasAnyFurnitureInScene() {
  if (!state.scene) return false;
  let found = false;
  state.scene.traverse((obj) => {
    if (found) return;
    if (obj?.isGroup && obj.userData?.isFurniture) found = true;
  });
  return found;
}

/** Список шкафов в комнате (название каталога, зона, размеры). Вызов: __cldListRoomFurniture() в консоли F12. */
export function listRoomFurniturePlaced() {
  const rows = [];
  if (!state.scene) {
    console.warn('[CLD] Сцена не инициализирована');
    return rows;
  }
  state.scene.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    const ud = obj.userData;
    let sizeMm = '—';
    try {
      const bb = computeFurnitureWorldBBoxNoAo(obj);
      const s = bb.getSize(new THREE.Vector3());
      sizeMm = `${Math.round(s.x)}Г—${Math.round(s.y)}Г—${Math.round(s.z)}`;
    } catch (_) {
      /* ignore */
    }
    rows.push({
      name: ud.catalogName || '(без названия — поставлен до обновления)',
      catalogId: ud.catalogItemId ?? '—',
      catalogType: ud.catalogType ?? '—',
      sectionId: ud.sectionId ?? '—',
      zone: typeof ud.zoneIndex === 'number' ? ud.zoneIndex : '—',
      sizeMm,
      uuid: obj.uuid.slice(0, 8),
    });
  });
  rows.sort((a, b) => {
    const sa = String(a.sectionId);
    const sb = String(b.sectionId);
    if (sa !== sb) return sa.localeCompare(sb);
    const za = a.zone === '—' ? -1 : Number(a.zone);
    const zb = b.zone === '—' ? -1 : Number(b.zone);
    return za - zb;
  });
  if (rows.length) console.table(rows);
  else console.info('[CLD] В комнате нет размещённой мебели');
  return rows;
}

if (typeof window !== 'undefined') {
  window.__cldListRoomFurniture = listRoomFurniturePlaced;
}

export async function placeEndCabinetFurniture(sectionData, side, furnitureDataOverride = null) {
  if (!sectionData || !side || !state.scene) return null;
  ensureEndCabinets(sectionData);
  const entry = getEndCabinetEntry(sectionData, side);
  if (!entry || entry.mode !== 'cabinet') return null;
  const slot = getEndCabinetSlot(sectionData, side);
  if (!slot) return null;

  removeEndCabinetFurniture(sectionData, side);

  let furnitureData = furnitureDataOverride;
  let catalogType = '';
  let item = null;

  if (!furnitureData) {
    catalogType = String(entry.catalogType || getEndCabinetRule().catalogType || '').trim();
    const itemId = entry.itemId != null ? entry.itemId : null;
    item = catalogType && itemId ? findCatalogItemInRoomStorage(catalogType, itemId) : null;
    if (!item) {
      console.warn('[END-CAB] catalog item missing, skip Clodis build', { catalogType, itemId });
      return null;
    }
    furnitureData = buildFurnitureDataFromCatalogItem(item, catalogType);
  } else {
    catalogType = String(
      furnitureData.catalogType ||
        furnitureData.catalogItem?.catalog_type ||
        furnitureData.catalogItem?.catalogType ||
        entry.catalogType ||
        ''
    ).trim();
    item = furnitureData.catalogItem || null;
  }

  if (!furnitureData) {
    console.warn('[END-CAB] buildFurnitureDataFromCatalogItem failed');
    return null;
  }

  const clodisData = getClodisDataForBuild(furnitureData);
  if (!clodisData || clodisData.length === 0) {
    console.warn('[END-CAB] empty Clodis JSON');
    return null;
  }

  let clodisForBuild = Array.isArray(clodisData) ? clodisData : [clodisData];
  const sectionSize = { ...slot.sectionSize };
  const step5Selection =
    typeof window.getStep5DecorSelection === 'function'
      ? window.getStep5DecorSelection() || { outside: null, inside: null }
      : { outside: null, inside: null };
  // Высота/цоколь/антресоль — тот же путь, что у обычного шкафа в нише.
  const placementKind =
    resolvePlacementKindFromFurnitureData(furnitureData) || PLACEMENT_KIND.FLOOR_IN_NICHE;
  const productKind = resolveProductKindForFurnitureData(furnitureData);
  const endCabinetZoneHand =
    entry.zoneHandManual === true && (entry.zoneHand === 'left' || entry.zoneHand === 'right')
      ? entry.zoneHand
      : resolveDefaultEndCabinetZoneHand(sectionData.wallName || slot.wallName, side);
  // Распашка, петли, цельный фасад и свес низа — та же подготовка JSON и те же
  // параметры билдера, что у обычного шкафа ряда. Без productKind ClodisBuilder
  // отключает свес низа фасада (allowOverhangByDepth).
  const { opts: doorOpts, needsPatch } = buildRoomDoorPrepareOpts(furnitureData, {
    doorKind: resolveDoorKindFromFurnitureData(furnitureData) || 'single',
    catalogItem: item || furnitureData?.catalogItem,
    clodisRoots: clodisForBuild,
    placementKind,
    productKind,
    zoneHand: endCabinetZoneHand,
  });
  if (needsPatch) {
    clodisForBuild = prepareClodisForRoomBuild(clodisForBuild, doorOpts);
  }
  let dataForBuild = getDataForBuild(clodisForBuild) || clodisForBuild;
  let moduleVarsForBuilder = extractModuleVariablesFromFurnitureData(furnitureData) || {};
  moduleVarsForBuilder = mergeFloorNicheVariablesFromSection(sectionData, moduleVarsForBuilder);
  try {
    refreshSectionVerticalLayout(sectionData);
  } catch (_) {}
  // Высота/цоколь/антресоль — ровно тот же слот ниши, что у обычного шкафа
  // этого ряда (slot.sectionSize.y уже = getNicheCabinetSlotHeightMm).
  const slotMetrics = getSlotVerticalMetrics(sectionData);
  const layoutZones = computePlacementVerticalZones(slotMetrics, {
    placementKind,
    variables: moduleVarsForBuilder,
  });
  const FurnitureCtor =
    typeof Furniture !== 'undefined' ? Furniture : typeof window !== 'undefined' ? window.Furniture : null;
  if (!FurnitureCtor) {
    console.warn('[END-CAB] Furniture class missing');
    return null;
  }

  const corpusWallThicknessMm =
    Number(moduleVarsForBuilder?._wt) > 0 ? Number(moduleVarsForBuilder._wt) : 16;
  const params = {
    sectionSize,
    wallThicknessMm: corpusWallThicknessMm,
    variables: {
      vysota_cokolya: 100,
      glubina_cokolya: 100,
      otstup_paza: 0,
      ...moduleVarsForBuilder,
    },
    groups: {
      g0: { thickness: corpusWallThicknessMm },
      g1: { thickness: 3 },
      g2: { thickness: 18 },
      g3: { thickness: 16 },
      hdf1: { thickness: 3 },
    },
    useLegacySetupPivot: true,
    decorOutside: step5Selection.outside,
    decorInside: step5Selection.inside,
    layoutZones,
    placementKind,
    doorLayout: doorOpts.doorLayout || undefined,
    zoneHand: doorOpts.zoneHand || undefined,
    doorKind: doorOpts.doorKind || undefined,
    unifiedFacade: doorOpts.unifiedFacade || undefined,
    hingeLayoutOverride:
      furnitureData?.hingeLayoutOverride ??
      furnitureData?.hingeLayoutId ??
      furnitureData?.catalogItem?.hingeLayoutId ??
      furnitureData?.catalogItem?.data?.hingeLayoutId ??
      undefined,
    productKind,
    shellFillPolicyCatalogItem:
      resolveShellFillPolicyCatalogItemFromClodisRoots(
        clodisForBuild,
        furnitureData?.catalogItem
      ) || null,
    fillPolicyCatalogItem:
      resolveFillCatalogItemFromClodisRoots(clodisForBuild) || furnitureData?.catalogItem || null,
    shelfProps: resolveShelfPropsConfigFromFillItem(
      resolveFillCatalogItemFromClodisRoots(clodisForBuild) || furnitureData?.catalogItem
    ),
  };

  const built = new FurnitureCtor(dataForBuild, params);
  const group = built.group;
  if (!group) return null;

  try {
    const ud = group.userData || (group.userData = {});
    writeUserDataClodisData(ud, dataForBuild);
    writeUserDataClodisRoots(ud, JSON.parse(JSON.stringify(clodisForBuild)));
    writeUserDataClodisVariables(ud, { ...moduleVarsForBuilder });
    ud.__initialSectionSizeMm = { ...sectionSize };
    ud.__endCabinetSectionSizeMm = { ...sectionSize };
    ud.__endCabinetSlotHeightMm = Number(slot.heightMm) || sectionSize.y;
    ud.__layoutZones = layoutZones;
    ud.__placementKind = placementKind;
    stampZoneCohabitOnUserData(ud, {
      role: 'full',
      group: '',
      placementKindId: String(placementKind || ''),
    });
    ud.hBottomMm = Math.max(0, Number(moduleVarsForBuilder.h_bottom) || 0);
    ud.hTopCatalogMm = Math.max(0, Number(moduleVarsForBuilder.h_top) || 0);
    ud.corpusBodyMm = Math.max(
      0,
      Number(
        moduleVarsForBuilder.corpus_body_mm ??
          moduleVarsForBuilder.corpus_fixed_mm ??
          moduleVarsForBuilder.h_corpus_body
      ) || 0
    );
    ud.corpusAntresolMm = Math.max(0, Number(moduleVarsForBuilder.corpus_antresol_mm) || 0);
    ud.techZoneMm = getTechZoneMmFromVariables(moduleVarsForBuilder);
    ud.productKind = productKind;
    if (doorOpts.doorLayout) ud.doorLayout = doorOpts.doorLayout;
    if (doorOpts.zoneHand) ud.zoneHand = doorOpts.zoneHand;
    ud.zoneHandManual = entry.zoneHandManual === true;
    if (doorOpts.doorKind) ud.doorKind = doorOpts.doorKind;
    if (doorOpts.hasSwingDoor) ud.hasSwingDoor = true;
    ud.unifiedFacadeFromCatalog = extractUnifiedFacadeFromCatalogItem(
      furnitureData?.catalogItem
    );
    ud.unifiedFacade = !!doorOpts.unifiedFacade;
    ud.isFurniture = true;
    ud.isEndCabinet = true;
    ud.isEndCabinetSlot = false;
    ud.endCabinetSide = side;
    ud.sectionId = sectionData.id;
    ud.catalogType = catalogType || undefined;
    if (item?.id != null) ud.catalogItemId = item.id;
    ud.catalogName =
      (item && (item.name || item.title)) ||
      furnitureData.name ||
      getEndCabinetRule().label ||
      'Торцевой шкаф';
    ud.__cldSkipSectionAutoRescale = true;
    ud.wallName = sectionData.wallName || slot.wallName;
    delete ud.zoneIndex;
  } catch (e) {
    console.warn('[END-CAB] stamp userData failed', e);
  }

  // Сначала подгоняем scale в локальных осях (width=x=глубина секции, depth=z=вдоль стены),
  // потом ±90В° (left/right зеркально) и snap в пятно слота — иначе pivot уезжает в стену.
  group.position.copy(slot.position);
  group.rotation.y = 0;
  group.updateMatrixWorld(true);

  let builtSizeMm = null;
  try {
    const size = measureEndCabinetBBox(group).getSize(new THREE.Vector3());
    builtSizeMm = { x: Math.round(size.x), y: Math.round(size.y), z: Math.round(size.z) };
    if (size.x > 1 && size.y > 1 && size.z > 1) {
      // По высоте цель — габарит обычного шкафа ряда (цоколь + ниша), не высота ниши.
      const targetBBoxY = Number(slot.heightMm) > 1 ? Number(slot.heightMm) : sectionSize.y;
      const sx = sectionSize.x / size.x;
      const sy = targetBBoxY / size.y;
      const sz = sectionSize.z / size.z;
      if (Number.isFinite(sx) && Number.isFinite(sy) && Number.isFinite(sz)) {
        group.scale.set(group.scale.x * sx, group.scale.y * sy, group.scale.z * sz);
        group.updateMatrixWorld(true);
      }
    }
  } catch (_) {}

  group.rotation.y = slot.rotationY;
  try {
    group.userData.rotation = slot.rotationY;
  } catch (_) {}
  group.updateMatrixWorld(true);
  snapEndCabinetGroupToSlot(
    group,
    slot,
    measureEndCabinetBBox,
    getFurnitureFloorContactWorldYNoAo
  );

  try {
    applyRoomCabinetStudioLook(group, {
      doorsOpen: typeof window !== 'undefined' && window.__cldRoomDoorsDesiredOpen === true,
      syncLight: false,
    });
    applyStep5DecorToFurnitureGroupImmediate(group);
    refreshCabinetStudioAfterDecor(group, { syncLight: false });
    scheduleIkeaRoomLightSync();
  } catch (_) {}

  state.scene.add(group);
  state.furniture = built;
  if (sectionData.endCabinets?.[side]) {
    sectionData.endCabinets[side].furnitureUuid = group.uuid;
    sectionData.endCabinets[side].pendingPlace = false;
    sectionData.endCabinets[side].zoneHand =
      group.userData?.zoneHand === 'right' ? 'right' : 'left';
  }

  try {
    recalcFurniturePricingAfterGeometryChange();
  } catch (_) {}

  let finalSizeMm = null;
  try {
    const s = measureEndCabinetBBox(group).getSize(new THREE.Vector3());
    finalSizeMm = { x: Math.round(s.x), y: Math.round(s.y), z: Math.round(s.z) };
  } catch (_) {}
  console.log('[END-CAB] placed catalog module', {
    sectionId: sectionData.id,
    side,
    catalogType,
    itemId: item?.id,
    slotAlongWallMm: slot.alongWallMm,
    slotIntoRoomMm: slot.intoRoomMm,
    sectionSize,
    builtSizeMm,
    finalSizeMm,
    rotationY: slot.rotationY,
  });
  return group;
}

async function placeFurnitureIntoEndCabinetSlot(sectionData, side, furnitureData, _rotationY) {
  return placeEndCabinetFurniture(sectionData, side, furnitureData);
}

/** Габарит корпуса торцевого: распашки закрыты, иначе открытая дверь раздувает глубину. */
function measureEndCabinetBBox(group) {
  return withFurnitureDoorSwingsClosedForMeasure(group, () => {
    const out = new THREE.Box3();
    let has = false;
    if (!group) return out;
    group.updateMatrixWorld(true);
    group.traverse((obj) => {
      if (shouldExcludeMeshFromFurnitureBBox(obj)) return;
      // Ручка — фиксированная фурнитура; в замер слота не входит (иначе scale её сплющивает).
      let p = obj;
      let isHandle = false;
      for (let i = 0; i < 16 && p; i++) {
        if (p.userData?.isFacadeHandle === true || p.name === '__cld_facade_handle') {
          isHandle = true;
          break;
        }
        p = p.parent;
      }
      if (isHandle) return;
      try {
        const b = new THREE.Box3().setFromObject(obj);
        if (b.isEmpty()) return;
        if (!has) {
          out.copy(b);
          has = true;
        } else {
          out.union(b);
        }
      } catch (_) {}
    });
    return has ? out : computeFurnitureWorldBBoxNoAo(group);
  });
}

/** После пересборки модуля вернуть его в габариты слота: scale по bbox > б90а > snap. */
function restoreEndCabinetGroupTransform(group, sectionData, side) {
  if (!group || !sectionData || !side) return;
  const slot = getEndCabinetSlot(sectionData, side);
  if (!slot) return;
  const target = slot.sectionSize;

  // После rebuild scale уже 1; не накапливаем предыдущий squash.
  group.scale.set(1, 1, 1);
  group.position.copy(slot.position);
  group.rotation.y = 0;
  group.updateMatrixWorld(true);

  try {
    const size = measureEndCabinetBBox(group).getSize(new THREE.Vector3());
    if (size.x > 1 && size.y > 1 && size.z > 1) {
      const targetBBoxY = Number(slot.heightMm) > 1 ? Number(slot.heightMm) : target.y;
      const sx = target.x / size.x;
      const sy = targetBBoxY / size.y;
      const sz = target.z / size.z;
      // Только мелкий дожим: корпус уже собран под sectionSize; большой scale
      // снова сплющит опоры/ручку (как при чистом fit без rebuild).
      const nearUnity = [sx, sy, sz].every((v) => Number.isFinite(v) && v > 0.85 && v < 1.15);
      if (nearUnity) {
        group.scale.set(sx, sy, sz);
        group.updateMatrixWorld(true);
      } else if ([sx, sy, sz].every((v) => Number.isFinite(v) && v > 0)) {
        console.warn('[END-CAB] skip large post-rebuild scale (would squash hardware)', {
          sx: Number(sx.toFixed(3)),
          sy: Number(sy.toFixed(3)),
          sz: Number(sz.toFixed(3)),
          target,
          measured: {
            x: Math.round(size.x),
            y: Math.round(size.y),
            z: Math.round(size.z),
          },
        });
      }
    }
  } catch (_) {}

  group.userData.__endCabinetSectionSizeMm = { ...target };
  group.userData.__initialSectionSizeMm = { ...target };
  group.userData.__endCabinetSlotHeightMm = Number(slot.heightMm) || target.y;
  group.rotation.y = slot.rotationY;
  group.userData.rotation = slot.rotationY;
  group.updateMatrixWorld(true);
  snapEndCabinetGroupToSlot(
    group,
    slot,
    measureEndCabinetBBox,
    getFurnitureFloorContactWorldYNoAo
  );
}

/**
 * Смена глубины/габарита слота: пересборка Clodis под sectionSize, не group.scale.
 * Иначе ручка и опоры сплющиваются вместе с корпусом.
 */
export function rebuildEndCabinetForSectionSlot(sectionData, side) {
  if (!sectionData || !side || !state.scene) return false;
  let group = null;
  state.scene.traverse((obj) => {
    if (group || !obj?.isGroup) return;
    const ud = obj.userData;
    if (!ud?.isFurniture || ud.isEndCabinet !== true || ud.isEndCabinetSlot === true) return;
    if (String(ud.sectionId) !== String(sectionData.id)) return;
    if (String(ud.endCabinetSide) !== String(side)) return;
    group = obj;
  });
  if (!group) return false;

  const slot = getEndCabinetSlot(sectionData, side);
  if (!slot?.sectionSize) return false;
  const rebuilt = rebuildFurnitureGroupForSectionResize(group, sectionData, slot.sectionSize, {
    force: true,
  });
  if (!rebuilt) return false;
  restoreEndCabinetGroupTransform(group, sectionData, side);

  try {
    const B = typeof window !== 'undefined' ? window.ClodisBuilder : null;
    if (B && typeof B.toggleAllDoors === 'function' && Number(window.currentRoomStep) >= 4) {
      B.toggleAllDoors(window.__cldRoomDoorsDesiredOpen === true, { instant: true });
    }
  } catch (e) {
    console.warn('[END-CAB] restore door state after rebuild failed', e);
  }
  return true;
}

/** Шаг 4: изменить петлевую сторону только у торцевого шкафа. */
export function applyEndCabinetZoneHand(sectionData, side, hand) {
  if (!sectionData || !side || !state.scene) return false;
  const normalizedHand = hand === 'right' ? 'right' : 'left';
  let group = null;
  state.scene.traverse((obj) => {
    if (group || !obj?.isGroup) return;
    const ud = obj.userData;
    if (!ud?.isFurniture || ud.isEndCabinet !== true || ud.isEndCabinetSlot === true) return;
    if (String(ud.sectionId) !== String(sectionData.id)) return;
    if (String(ud.endCabinetSide) !== String(side)) return;
    group = obj;
  });
  if (!group) return false;

  const entry = sectionData.endCabinets?.[side];
  if (entry) {
    entry.zoneHand = normalizedHand;
    entry.zoneHandManual = true;
  }
  group.userData.zoneHand = normalizedHand;
  group.userData.zoneHandManual = true;

  return rebuildEndCabinetForSectionSlot(sectionData, side);
}

/**
 * Посадка в торцевую секцию: слот задан диалогом, а не позицией призрака.
 * @returns {Promise<boolean>} true — размещение обработано (успех или явный отказ).
 */
async function tryPlaceIntoPendingEndCabinetSlot(furnitureData) {
  const pendingEnd = getPendingEndCabinetPlacement();
  if (!pendingEnd?.active) return false;
  if (furnitureData?.type === 'glb' || furnitureData?.type === 'savedModel') return false;
  // Модуль не из каталога торцевых — обычный путь: зоны, снап, ширина зоны.
  if (!isPendingEndCabinetModule(furnitureData)) return false;

  const finishPlacement = () => {
    removeFurnitureGhost();
    state.pendingFurnitureData = null;
    state.isPlacingFurniture = false;
    state.ghostWall = null;
    state.ghostPosition = null;
    state.lastValidGhostPosition = null;
    state.lastValidGhostWall = null;
  };

  const sec =
    Array.isArray(state.customSections) &&
    state.customSections.find((s) => s && String(s.id) === String(pendingEnd.sectionId));
  if (!sec || !isEndCabinetActive(sec, pendingEnd.side)) {
    console.warn('[END-CAB] слот недоступен', {
      sectionId: pendingEnd.sectionId,
      side: pendingEnd.side,
      sectionFound: !!sec,
    });
    return false;
  }

  finishPlacement();
  try {
    const placed = await placeFurnitureIntoEndCabinetSlot(sec, pendingEnd.side, furnitureData, 0);
    if (placed) {
      // Карандаш торцевого появляется только под поставленный модуль — обновляем иконки.
      try {
        if (typeof window.__clodisRefreshStep4SectionEditIcons === 'function') {
          window.__clodisRefreshStep4SectionEditIcons();
        }
      } catch (_) {}
      const nextSide = END_CABINET_SIDES.find((side) => {
        if (String(side) === String(pendingEnd.side)) return false;
        if (!isEndCabinetActive(sec, side)) return false;
        return sec.endCabinets?.[side]?.pendingPlace === true;
      });
      if (nextSide) {
        // Второй активный торец ещё пуст: каталог не переключаем, только
        // перенаправляем следующий drag в оставшийся слот.
        setEndCabinetSlotHighlight(false);
        setPendingEndCabinetPlacement({ ...pendingEnd, side: nextSide });
        return true;
      }

      clearPendingEndCabinetPlacement();
      try {
        if (typeof window.__cldOpenStep4ForRegularCatalog === 'function') {
          window.__cldOpenStep4ForRegularCatalog();
        }
      } catch (e) {
        console.warn('[END-CAB] возврат каталога шага 4 не удался', e);
      }
      return true;
    }
  } catch (e) {
    console.warn('[END-CAB] place into slot failed', e);
  }
  if (typeof window.showToast === 'function') {
    window.showToast('Не удалось поставить торцевой модуль в слот', 'warning');
  }
  return true;
}

if (typeof window !== 'undefined') {
  window.__cldPlaceEndCabinetFurniture = placeEndCabinetFurniture;
}

// --- Zone place gestures (Maatkasten SoT A–G + Clodis insert-shift) ---
// Прямые + свободное плечо L-угла. Не трогаем: спец-зону угла, bay/мост.
// Push живого соседа запрещён на прямой (eat); на L — insert-shift без спец.

const ZONE_GESTURE_MIN_WIDTH_MM = 200;

/** Индекс спец-зоны L (угол). null = нет / не primary / не L. */
function __getLShapeSpecialZoneIndex(sectionData) {
  return getLShapeSpecialZoneIndex(sectionData);
}

function __isLShapeSpecialZone(sectionData, zoneIndex) {
  if (!sectionData?.lShape || zoneIndex == null) return false;
  const zi = Number(zoneIndex);
  if (!Number.isFinite(zi) || zi < 0) return false;
  try {
    const all = getLShapeSpecialZoneIndices(sectionData);
    if (all.includes(zi)) return true;
  } catch (_) {}
  const sp = __getLShapeSpecialZoneIndex(sectionData);
  if (sp != null && zi === sp) return true;
  const div = sectionData.division;
  const segs = div?.segmentsLShapeBack || div?.segmentsLShape;
  if (Array.isArray(segs)) {
    if (segs.some((s) => s && s.type === 'special' && Number(s.zoneIndex) === zi)) {
      return true;
    }
  }
  const layoutSegs = sectionData._layoutCache?.segments;
  if (Array.isArray(layoutSegs)) {
    if (
      layoutSegs.some(
        (s) =>
          s &&
          Number(s.zoneIndex) === zi &&
          (s.type === 'special' || s.isLSpecial === true)
      )
    ) {
      return true;
    }
  }
  return false;
}

/** После split/repack на L: спец всегда 0 или parts-1 по конфигу, сегменты пересобрать. */
function __resolveLShapeSpecialZoneIndexForParts(sectionData, parts) {
  if (!sectionData?.lShape || !(parts >= 1)) return null;
  const div = sectionData.division;
  const typeKey = div?.typeKey || null;
  const cfg = typeKey && L_CORNER_CONFIG ? L_CORNER_CONFIG[typeKey] : null;
  if (cfg) {
    if (sectionData.lShape.role && sectionData.lShape.role !== cfg.primary) return null;
    return cfg.cornerAtStart ? 0 : parts - 1;
  }
  try {
    const meta = getLShapeMeta(sectionData);
    if (meta?.cornerAtStart === true) return 0;
    if (meta?.cornerAtStart === false) return parts - 1;
  } catch (_) {}
  return null;
}

function __syncLShapeAfterWidthGesture(sectionData) {
  if (!sectionData?.lShape || !sectionData.division) return;
  const div = sectionData.division;
  const parts = Math.floor(Number(div.parts) || 0);
  if (parts < 1) return;
  const sp = __resolveLShapeSpecialZoneIndexForParts(sectionData, parts);
  if (sp == null) return;
  const widths = [];
  for (let i = 0; i < parts; i++) {
    widths.push(Math.round(__getModuleWidthMmForZone(sectionData, i)) || 0);
  }
  const wantSp = Math.round(
    (Number(div.singleWidthMm) || 0) + (Number(div.cornerWidthMm) || 0)
  );
  if (wantSp > 0 && sp < widths.length) widths[sp] = wantSp;
  // freeSizeMm = сумма свободного плеча (всё кроме спец)
  let freeSum = 0;
  for (let i = 0; i < widths.length; i++) {
    if (i !== sp) freeSum += widths[i];
  }
  if (freeSum > 0) div.freeSizeMm = freeSum;
  __rebuildLShapeSegmentsFromWidths(sectionData, widths, sp);
  console.log('[ZONE-GESTURE] L sync after width gesture', {
    sectionId: sectionData.id,
    parts,
    specialZi: sp,
    widths,
    freeSizeMm: div.freeSizeMm,
  });
}

/** _layoutCache.segments из L-сегментов — для half-snap / doorKind. */
function __ensureLShapeLayoutCacheSegments(sectionData) {
  if (!sectionData?.lShape || !sectionData.division) return;
  const div = sectionData.division;
  const segs = div.segmentsLShapeBack || div.segmentsLShape;
  if (!Array.isArray(segs) || !segs.length) return;
  const out = [];
  for (const s of segs) {
    if (!s) continue;
    if (s.type !== 'double' && s.type !== 'special' && s.type !== 'single') continue;
    const zi = Number(s.zoneIndex);
    if (!Number.isFinite(zi) || zi < 0) continue;
    const startU = Number(s.startWorldU ?? s.startWorldX);
    const w = Number(s.widthMm);
    if (!(Number.isFinite(startU) && w > 0)) continue;
    out.push({
      type: 'module',
      zoneIndex: zi,
      startU,
      endU: startU + w,
      doorKind:
        s.type === 'special' || w >= 800
          ? 'double'
          : 'single',
    });
  }
  if (!out.length) return;
  sectionData._layoutCache = sectionData._layoutCache || {};
  sectionData._layoutCache.segments = out;
}

function __rebuildLShapeSegmentsFromWidths(sectionData, widthsMm, specialZi) {
  const div = sectionData?.division;
  if (!div || !Array.isArray(widthsMm) || !widthsMm.length) return;
  const sectionStart = Number(div.sectionStart);
  if (!Number.isFinite(sectionStart)) return;
  const freeSizeMm = Number(div.freeSizeMm);
  const singleW = Number(div.singleWidthMm);
  const n = widthsMm.length;
  const sp = Number(specialZi);
  const segs = [];
  let u = sectionStart;

  if (sp === 0) {
    const w0 = Math.round(Number(widthsMm[0]) || 0);
    segs.push({
      type: 'special',
      widthMm: w0,
      startWorldU: sectionStart,
      zoneIndex: 0,
    });
    u = sectionStart + w0;
    for (let i = 1; i < n; i++) {
      const w = Math.round(Number(widthsMm[i]) || 0);
      segs.push({
        type: 'double',
        widthMm: w,
        startWorldU: u,
        zoneIndex: i,
      });
      u += w;
    }
  } else {
    for (let i = 0; i < n - 1; i++) {
      const w = Math.round(Number(widthsMm[i]) || 0);
      segs.push({
        type: 'double',
        widthMm: w,
        startWorldU: u,
        zoneIndex: i,
      });
      u += w;
    }
    const wSp = Math.round(Number(widthsMm[n - 1]) || 0);
    const S = Number.isFinite(singleW) && singleW > 0 ? singleW : Math.round(wSp / 2);
    const cornerStartU = Number.isFinite(freeSizeMm)
      ? sectionStart + freeSizeMm
      : u + S;
    segs.push({
      type: 'special',
      widthMm: wSp,
      startWorldU: cornerStartU - S,
      zoneIndex: n - 1,
    });
  }
  for (const s of segs) {
    if (Number.isFinite(s.startWorldU)) s.startWorldX = s.startWorldU;
  }
  div.segmentsLShape = segs;
  if (div.isLShapeBack || sectionData.lShape?.role === 'back') {
    div.segmentsLShapeBack = segs.map((s) => ({ ...s }));
  }
  __ensureLShapeLayoutCacheSegments(sectionData);
}

function sectionAllowsZonePlaceGestures(sectionData) {
  if (!sectionData?.division) return false;
  // Низкая fixedHeight / legacy bay — без split (слот под окном).
  if (
    Number(sectionData.fixedHeightMm) > 0 ||
    sectionData.underWindowBay ||
    sectionData.windowBridgeRole === 'under-window'
  ) {
    return false;
  }
  return Math.floor(Number(sectionData.division.parts) || 0) >= 1;
}

function collectFurnitureGroupsInZone(sectionId, zoneIndex) {
  const out = [];
  if (!state.scene || sectionId == null || !Number.isFinite(Number(zoneIndex))) return out;
  const sid = String(sectionId);
  const zi = Number(zoneIndex);
  state.scene.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    if (String(obj.userData.sectionId) !== sid) return;
    if (obj.userData.isEndCabinet || obj.userData.__endCabinetSide) return;
    // Обычный zoneIndex.
    if (Number(obj.userData.zoneIndex) === zi) {
      out.push(obj);
      return;
    }
    // Seat B (НШ1 у угла): занятость по spanned mid-ячейкам bbox.
    const seat = String(obj.userData.__kitchenUpperCornerSeat || '').toUpperCase();
    const isSeatB =
      seat === 'B' || obj.userData.__kitchenUpperCornerCompanion === true;
    if (isSeatB) {
      const zones =
        obj.userData.__kitchenUpperCornerSeatBZones ||
        obj.userData.__kitchenUpperCornerCompanionZones;
      if (Array.isArray(zones) && zones.some((z) => Number(z) === zi)) {
        out.push(obj);
      }
    }
  });
  return out;
}

function findUpperCornerSeatBByCellId(sectionId, upperCornerCellId, excludeUuid) {
  if (!state.scene || !upperCornerCellId) return null;
  const sid = sectionId != null ? String(sectionId) : null;
  const cid = String(upperCornerCellId);
  let found = null;
  state.scene.traverse((obj) => {
    if (found || !obj?.isGroup || !obj.userData?.isFurniture) return;
    const seat = String(obj.userData.__kitchenUpperCornerSeat || '').toUpperCase();
    const isB =
      seat === 'B' || obj.userData.__kitchenUpperCornerCompanion === true;
    if (!isB) return;
    if (String(obj.userData.__kitchenUpperCornerCellId || '') !== cid) return;
    if (sid && String(obj.userData.sectionId) !== sid) return;
    if (excludeUuid && obj.uuid === excludeUuid) return;
    found = obj;
  });
  return found;
}

function _resolvePendingUpperCornerSeatB(section, furnitureData, pendingZoneInfo, wallName) {
  if (!section || !furnitureData) return null;
  if (isLCornerCabinetModule(furnitureData)) return null;
  if (!isKitchenWallBandFurnitureData(furnitureData)) return null;
  const stamp = String(furnitureData?.__kitchenWallBand || '')
    .trim()
    .toLowerCase();
  const rawPk = String(getRawPlacementKindFromFurnitureData(furnitureData) || '')
    .trim()
    .toLowerCase();
  if (rawPk === 'kitchen_wall_top' || stamp === 'top') return null;

  const W = Math.round(
    Number(pendingZoneInfo?.seatBModuleWidth) ||
      Number(pendingZoneInfo?.companionModuleWidth) ||
      Number(furnitureData.customWidthMm) ||
      Number(extractSectionSizeFromFurnitureData(furnitureData)?.x) ||
      600
  );

  const pendingIsB =
    pendingZoneInfo?.upperCornerSeat === 'B' ||
    pendingZoneInfo?.upperCornerCompanion === true;
  const ziCand =
    pendingZoneInfo?.zoneIndex != null
      ? pendingZoneInfo.zoneIndex
      : null;
  const hitCoord =
    pendingZoneInfo?.hitAlongMm != null
      ? pendingZoneInfo.hitAlongMm
      : pendingZoneInfo?.hitCoord;
  const hitInB = hitAttractsUpperCornerSeatB(section, hitCoord);
  const ziIsB =
    ziCand != null && isKitchenUpperCornerSeatBZone(section, ziCand);

  // Ghost и place: один resolveKitchenUpperCornerSeatTarget.
  if (pendingIsB || ziIsB || hitInB) {
    return (
      resolveKitchenUpperCornerSeatTarget({
        section,
        wallName,
        moduleWidthMm: W,
        hitCoord,
        forceSeatB: pendingIsB || ziIsB || hitInB,
      }) || buildUpperCornerSeatBSnap(section, W, wallName)
    );
  }
  return null;
}

function _roomStepsConfigForCohabit() {
  try {
    if (typeof window !== 'undefined' && typeof window.getRoomStepsConfig === 'function') {
      return window.getRoomStepsConfig();
    }
  } catch (_) {}
  return null;
}

function _pkCohabitApi() {
  return typeof window !== 'undefined' ? window.__cldPlacementKindProfiles : null;
}

/** Спека совместности для pending из каталога. */
function resolvePendingZoneCohabitSpec(furnitureData) {
  const api = _pkCohabitApi();
  const raw = getRawPlacementKindFromFurnitureData(furnitureData);
  const item = furnitureData?.catalogItem || furnitureData?.item || null;
  if (api && typeof api.resolveZoneCohabitSpec === 'function') {
    return api.resolveZoneCohabitSpec(raw, _roomStepsConfigForCohabit(), item);
  }
  // Fallback до загрузки profiles: шкаф = full, тумба/низ = base, верх = upper
  const pk = String(resolvePlacementKindFromFurnitureData(furnitureData) || '').trim();
  const rawPk = String(raw || pk).trim();
  if (
    isKitchenBasePlacementKind(rawPk) ||
    rawPk === 'kitchen_base' ||
    rawPk === 'kitchen_base_gola' ||
    rawPk === 'kitchen_base_corner'
  ) {
    return { role: 'base', group: 'kitchen_column', placementKindId: rawPk };
  }
  if (isKitchenWallMidPlacementKind(rawPk) || rawPk === 'kitchen_wall_corner') {
    return { role: 'mid', group: 'kitchen_column', placementKindId: rawPk };
  }
  if (isKitchenWallTopPlacementKind(rawPk)) {
    return { role: 'top', group: 'kitchen_column', placementKindId: rawPk };
  }
  if (isKitchenTallPlacementKind(rawPk)) {
    return { role: 'full', group: 'kitchen_column', placementKindId: rawPk };
  }
  if (pk === PLACEMENT_KIND.STANDALONE_FLOOR || pk === PLACEMENT_KIND.WALL_HUNG_LOW) {
    return { role: 'base', group: 'wall_column', placementKindId: raw };
  }
  if (isWallHungHighPlacementKind(pk) || pk === PLACEMENT_KIND.WALL_HUNG) {
    return { role: 'upper', group: 'wall_column', placementKindId: raw };
  }
  return { role: 'full', group: '', placementKindId: raw };
}

function resolveGroupZoneCohabitSpec(grp) {
  const api = _pkCohabitApi();
  if (api && typeof api.resolveZoneCohabitSpecFromUserData === 'function') {
    return api.resolveZoneCohabitSpecFromUserData(grp?.userData, _roomStepsConfigForCohabit());
  }
  const pk = String(
    grp?.userData?.__placementKindProfileId || grp?.userData?.__placementKind || ''
  ).trim();
  if (
    isKitchenBasePlacementKind(pk) ||
    pk === 'kitchen_base' ||
    pk === 'kitchen_base_gola' ||
    pk === 'kitchen_base_corner'
  ) {
    return { role: 'base', group: 'kitchen_column', placementKindId: pk };
  }
  if (isKitchenWallMidPlacementKind(pk) || isKitchenWallMidGroup(grp)) {
    return {
      role: 'mid',
      group: 'kitchen_column',
      placementKindId: isKitchenWallMidPlacementKind(pk) ? pk : 'kitchen_wall_mid',
    };
  }
  if (isKitchenWallTopPlacementKind(pk) || isKitchenWallTopGroup(grp)) {
    return {
      role: 'top',
      group: 'kitchen_column',
      placementKindId: isKitchenWallTopPlacementKind(pk) ? pk : 'kitchen_wall_top',
    };
  }
  if (isKitchenTallPlacementKind(pk)) {
    return { role: 'full', group: 'kitchen_column', placementKindId: pk };
  }
  if (pk === PLACEMENT_KIND.STANDALONE_FLOOR || pk === PLACEMENT_KIND.WALL_HUNG_LOW) {
    return { role: 'base', group: 'wall_column', placementKindId: pk };
  }
  if (isWallHungHighPlacementKind(pk) || pk === PLACEMENT_KIND.WALL_HUNG) {
    return { role: 'upper', group: 'wall_column', placementKindId: pk };
  }
  return { role: 'full', group: '', placementKindId: pk };
}

function stampZoneCohabitOnUserData(ud, spec) {
  if (!ud || !spec) return;
  ud.__zoneSlotRole = String(spec.role || 'full');
  // Пенал (full + kitchen_column) сохраняет группу — иначе НШ2 сносит его.
  ud.__cohabitGroup = String(spec.group || '');
}

/**
 * Кухня kitchen_column: уже есть жилец той же роли (два mid / два base / два top)?
 * @returns {object|null} группа-occupant или null
 */
function findSameRoleKitchenColumnOccupant(sectionId, zoneIndex, pendingSpec, excludeUuid) {
  if (sectionId == null || !Number.isFinite(Number(zoneIndex)) || !pendingSpec) return null;
  const gPending = String(pendingSpec.group || '').trim();
  const rPending = String(pendingSpec.role || '').trim();
  if (gPending !== 'kitchen_column') return null;
  if (!rPending || rPending === 'full') return null;
  for (const g of collectFurnitureGroupsInZone(sectionId, zoneIndex)) {
    if (excludeUuid && g.uuid === excludeUuid) continue;
    const occ = resolveGroupZoneCohabitSpec(g);
    if (String(occ.group || '').trim() !== 'kitchen_column') continue;
    if (String(occ.role || '').trim() === rPending) return g;
  }
  return null;
}

function toastKitchenSameRoleBlocked(pendingSpec) {
  const role = String(pendingSpec?.role || '');
  const msg =
    role === 'mid'
      ? 'В этой ячейке уже есть НШ1 (1-й ярус). Два mid нельзя — выберите другую ячейку.'
      : role === 'base'
        ? 'В этой ячейке уже есть нижний модуль. Два base нельзя.'
        : role === 'top'
          ? 'В этой ячейке уже есть НШ2 (2-й ярус). Два top нельзя.'
          : 'В этой ячейке уже занят этот ярус.';
  if (typeof window.showToast === 'function') window.showToast(msg, 'warning');
  else console.warn('[KITCHEN-COHABIT]', msg);
}

/**
 * Перед place / жестом: снести несовместимых жильцов зоны.
 * base+mid+top одной kitchen_column остаются; same-role / full / другая группа — remove.
 * Same-role kitchen_column не сносим здесь — place должен отказаться (см. findSameRole…).
 */
function removeIncompatibleZoneOccupantsForPlace(sectionId, zoneIndex, pendingSpec, excludeUuid) {
  if (sectionId == null || !Number.isFinite(Number(zoneIndex)) || !pendingSpec) return;
  const api = _pkCohabitApi();
  const shouldRemove =
    api && typeof api.shouldRemoveOccupantForIncoming === 'function'
      ? (occ) => api.shouldRemoveOccupantForIncoming(occ, pendingSpec)
      : () => true;
  for (const g of collectFurnitureGroupsInZone(sectionId, zoneIndex)) {
    if (excludeUuid && g.uuid === excludeUuid) continue;
    const occ = resolveGroupZoneCohabitSpec(g);
    // Не «заменять» mid>mid молча: блокировка на place.
    if (
      String(pendingSpec.group || '') === 'kitchen_column' &&
      String(occ.group || '') === 'kitchen_column' &&
      String(pendingSpec.role || '') === String(occ.role || '') &&
      String(pendingSpec.role || '') !== 'full'
    ) {
      continue;
    }
    if (shouldRemove(occ)) {
      removeFurnitureGroupQuietForGesture(g);
    }
  }
}

function groupsCanCohabitInZone(groupA, groupB) {
  const api = _pkCohabitApi();
  const a = resolveGroupZoneCohabitSpec(groupA);
  const b = resolveGroupZoneCohabitSpec(groupB);
  if (api && typeof api.canCohabitInSameZone === 'function') {
    return api.canCohabitInSameZone(a, b);
  }
  return false;
}

function removeFurnitureGroupQuietForGesture(grp) {
  if (!grp) return;
  try {
    const B = typeof window !== 'undefined' ? window.ClodisBuilder : null;
    if (B && typeof B.unregisterDoorSwingGroupsFromRoot === 'function') {
      B.unregisterDoorSwingGroupsFromRoot(grp);
    }
  } catch (_) {}
  const sid = grp.userData?.sectionId;
  const zi = grp.userData?.zoneIndex;
  try {
    if (sid != null && typeof zi === 'number') {
      removeSectionZoneEditIcon(sid, zi, grp.uuid);
    }
  } catch (_) {}
  try {
    if (grp.parent) grp.parent.remove(grp);
    else if (state.scene) state.scene.remove(grp);
  } catch (_) {}
  try {
    __disposeObject3DTree(grp);
  } catch (_) {}
  try {
    invalidateGroupIconBBoxCache(grp);
  } catch (_) {}
  if (state.selectedFurniture?.group === grp) state.selectedFurniture = null;
  if (state.furniture?.group === grp) state.furniture = null;
}

function shiftFurnitureZoneIndicesFrom(sectionId, fromIndexInclusive, delta) {
  if (!state.scene || sectionId == null || !delta) return;
  const sid = String(sectionId);
  const from = Number(fromIndexInclusive);
  state.scene.traverse((obj) => {
    if (!obj?.userData?.isFurniture) return;
    if (String(obj.userData.sectionId) !== sid) return;
    const zi = Number(obj.userData.zoneIndex);
    if (!Number.isFinite(zi) || zi < from) return;
    obj.userData.zoneIndex = zi + delta;
  });
}

function refreshSectionLayoutAfterZoneGesture(sectionData) {
  if (!sectionData) return;
  try {
    if (typeof window.__clodisComputeSectionLayout === 'function') {
      window.__clodisComputeSectionLayout(sectionData);
    }
  } catch (_) {}
  try {
    if (typeof window.updateCabinetMarkersForSection === 'function') {
      window.updateCabinetMarkersForSection(sectionData.id);
    }
  } catch (_) {}
  try {
    if (typeof rebuildSectionZoneEditIconsForSection === 'function') {
      rebuildSectionZoneEditIconsForSection(sectionData.id);
    }
  } catch (_) {}
}

function snapshotSectionZoneWidthsMm(sectionData) {
  if (typeof window.__clodisComputeSectionLayout === 'function') {
    try {
      window.__clodisComputeSectionLayout(sectionData);
    } catch (_) {}
  }
  const parts = Math.max(0, Math.floor(Number(sectionData.division?.parts) || 0));
  const widths = [];
  for (let i = 0; i < parts; i += 1) {
    const w = Math.round(__getModuleWidthMmForZone(sectionData, i));
    widths.push(w > 0 ? w : 0);
  }
  return widths;
}

function applySectionCustomZoneWidthsMm(sectionData, widthsMm) {
  const div = sectionData.division;
  if (!div || !Array.isArray(widthsMm) || !widthsMm.length) return;
  // Жесты меняют ширины зон, но не выбранный вариант «+/?» — сохраняем для счётчика.
  const keepVariantIdx = div.divisionVariantIndex;
  const keepStripN = div.stripCountN;
  // L: не сбрасывать угол / freeSize / segments (их обновит __rebuildLShapeSegmentsFromWidths).
  const keepL = {
    freeSizeMm: div.freeSizeMm,
    cornerWidthMm: div.cornerWidthMm,
    singleWidthMm: div.singleWidthMm,
    typeKey: div.typeKey,
    isLShapeBack: div.isLShapeBack,
    isLShapeRightFront: div.isLShapeRightFront,
    isLShapeLeftFront: div.isLShapeLeftFront,
    segmentsLShape: div.segmentsLShape,
    segmentsLShapeBack: div.segmentsLShapeBack,
    fixedRightGapMm: div.fixedRightGapMm,
  };
  const isL = !!sectionData.lShape;
  div.parts = widthsMm.length;
  div.customZoneWidthsMm = {};
  for (let i = 0; i < widthsMm.length; i += 1) {
    div.customZoneWidthsMm[i] = Math.round(Number(widthsMm[i]) || 0);
  }
  try {
    markCustomZoneWidthsSource(sectionData, CUSTOM_ZONE_WIDTHS_SOURCE_USER, {
      bandId: 'base',
      division: true,
    });
  } catch (_) {
    div.customZoneWidthsSource = 'user';
  }
  if (!isL) {
    delete div.layoutKind;
    delete div.leftSingleWidthMm;
    delete div.doubleWidthMm;
    delete div.doubleCount;
  } else {
    if (keepL.freeSizeMm != null) div.freeSizeMm = keepL.freeSizeMm;
    if (keepL.cornerWidthMm != null) div.cornerWidthMm = keepL.cornerWidthMm;
    if (keepL.singleWidthMm != null) div.singleWidthMm = keepL.singleWidthMm;
    if (keepL.typeKey != null) div.typeKey = keepL.typeKey;
    if (keepL.isLShapeBack) div.isLShapeBack = true;
    if (keepL.isLShapeRightFront) div.isLShapeRightFront = true;
    if (keepL.isLShapeLeftFront) div.isLShapeLeftFront = true;
    if (keepL.fixedRightGapMm != null) div.fixedRightGapMm = keepL.fixedRightGapMm;
    if (keepL.segmentsLShape) div.segmentsLShape = keepL.segmentsLShape;
    if (keepL.segmentsLShapeBack) div.segmentsLShapeBack = keepL.segmentsLShapeBack;
  }
  if (keepVariantIdx != null && Number.isFinite(Number(keepVariantIdx))) {
    div.divisionVariantIndex = Number(keepVariantIdx);
  } else if (!isL) {
    delete div.divisionVariantIndex;
  }
  if (keepStripN != null && Number.isFinite(Number(keepStripN))) {
    div.stripCountN = Number(keepStripN);
  } else if (!isL) {
    delete div.stripCountN;
  }
  refreshSectionLayoutAfterZoneGesture(sectionData);
  try {
    if (typeof window.__clodisRefreshStep4VariantDisplay === 'function') {
      window.__clodisRefreshStep4VariantDisplay(sectionData.id);
    }
  } catch (_) {}
}

/**
 * Сосед для Double на Single: сначала справа (Maatkasten SoT Ч3 C/D/E:
 * клик + следующая ячейка; содержимое обеих ячеек съесть, в т.ч. occupied).
 * Не изобретать «только пустой сосед» — это ломает эталон.
 */
function findNeighborZoneForDoubleEat(sectionData, zoneIndex) {
  const parts = Math.floor(Number(sectionData.division?.parts) || 0);
  const zi = Number(zoneIndex);
  const right = zi + 1;
  const left = zi - 1;
  if (right < parts) return right;
  if (left >= 0) return left;
  return null;
}

function zoneSlotIsNarrowSingle(sectionData, idx) {
  if (getZoneDoorKind(sectionData, idx) === 'single') return true;
  const w = __getModuleWidthMmForZone(sectionData, idx);
  return w > 0 && w < 800;
}

/** Half клика внутри double-зоны: 'left' = меньший U, 'right' = больший U. */
function resolveZoneSplitHalf(sectionData, zoneIndex, hitAlongMm) {
  const zi = Number(zoneIndex);
  const segs = sectionData?._layoutCache?.segments;
  let startU = null;
  let endU = null;
  if (Array.isArray(segs)) {
    const seg = segs.find((s) => s && s.type === 'module' && s.zoneIndex === zi);
    if (seg && Number.isFinite(seg.startU) && Number.isFinite(seg.endU)) {
      startU = seg.startU;
      endU = seg.endU;
    }
  }
  if (!(endU > startU) || !Number.isFinite(Number(hitAlongMm))) {
    return 'left';
  }
  const mid = (startU + endU) / 2;
  return Number(hitAlongMm) >= mid ? 'right' : 'left';
}

function findZoneIndexByHitAlong(sectionData, hitAlongMm) {
  if (!Number.isFinite(Number(hitAlongMm))) return null;
  const hit = Number(hitAlongMm);
  if (typeof window.__clodisComputeSectionLayout === 'function') {
    try {
      window.__clodisComputeSectionLayout(sectionData);
    } catch (_) {}
  }
  const segs = sectionData?._layoutCache?.segments;
  if (!Array.isArray(segs) || !segs.length) return null;
  for (const seg of segs) {
    if (!seg || seg.type !== 'module') continue;
    if (!(seg.endU > seg.startU)) continue;
    if (hit >= seg.startU && hit < seg.endU) return seg.zoneIndex;
  }
  let best = null;
  let bestDist = Infinity;
  for (const seg of segs) {
    if (!seg || seg.type !== 'module') continue;
    const mid = (seg.startU + seg.endU) / 2;
    const d = Math.abs(hit - mid);
    if (d < bestDist) {
      bestDist = d;
      best = seg.zoneIndex;
    }
  }
  return best;
}

/**
 * Maatkasten: после Single в half double — не оставлять «сироту» empty single.
 * Пустые ячейки перепаковать в doubles слева направо; хвост single справа.
 * reservedZi — слот, куда сейчас сажаем (считаем занятым до появления мебели).
 * @returns {number} новый zoneIndex для reserved
 */
function repackStraightEmptiesAsDoubles(sectionData, reservedZi) {
  if (!sectionAllowsZonePlaceGestures(sectionData)) {
    return reservedZi;
  }
  const widths = snapshotSectionZoneWidthsMm(sectionData);
  if (!widths.length) return reservedZi;

  const atoms = [];
  for (let i = 0; i < widths.length; i++) {
    const w = Math.round(Number(widths[i]) || 0);
    const groups = collectFurnitureGroupsInZone(sectionData.id, i);
    const reserved = i === Number(reservedZi);
    const occupied = groups.length > 0 || reserved;
    const kind = getZoneDoorKind(sectionData, i);
    const emptyDouble =
      !occupied &&
      (kind === 'double' || w >= 800) &&
      w >= ZONE_GESTURE_MIN_WIDTH_MM * 2;
    if (emptyDouble) {
      const left = Math.round(w / 2);
      atoms.push({ w: left, occupied: false, groups: [] });
      atoms.push({ w: Math.max(1, w - left), occupied: false, groups: [] });
    } else {
      atoms.push({
        w: w > 0 ? w : 0,
        occupied,
        groups,
        reserved,
      });
    }
  }

  const newWidths = [];
  const moves = [];
  let reservedNewZi = Number(reservedZi);
  let i = 0;
  while (i < atoms.length) {
    if (atoms[i].occupied) {
      const newZi = newWidths.length;
      newWidths.push(atoms[i].w);
      if (atoms[i].reserved) reservedNewZi = newZi;
      if (atoms[i].groups?.length) {
        moves.push({ groups: atoms[i].groups, newZi });
      }
      i += 1;
      continue;
    }
    const run = [];
    while (i < atoms.length && !atoms[i].occupied) {
      run.push(atoms[i]);
      i += 1;
    }
    let e = 0;
    while (e + 1 < run.length) {
      const sum = Math.round(run[e].w + run[e + 1].w);
      newWidths.push(sum);
      e += 2;
    }
    if (e < run.length) {
      newWidths.push(run[e].w);
    }
  }

  if (
    newWidths.length === widths.length &&
    newWidths.every((w, idx) => w === Math.round(Number(widths[idx]) || 0))
  ) {
    return reservedZi;
  }

  applySectionCustomZoneWidthsMm(sectionData, newWidths);
  if (sectionData.lShape) __syncLShapeAfterWidthGesture(sectionData);
  for (const m of moves) {
    for (const g of m.groups) {
      g.userData.zoneIndex = m.newZi;
      try {
        fitFurnitureToSectionZone(g, sectionData, m.newZi);
      } catch (_) {}
    }
  }
  console.log('[ZONE-GESTURE] repack-empties-as-doubles', {
    sectionId: sectionData.id,
    before: widths.length,
    after: newWidths.length,
    reservedZi,
    reservedNewZi,
  });
  return reservedNewZi;
}

/** Можно ли жестом посадить moduleDoorKind в зону (для призрака). */
export function zonePlaceGesturePossible(sectionData, zoneIndex, moduleDoorKind) {
  if (!sectionAllowsZonePlaceGestures(sectionData)) return false;
  if (moduleDoorKind !== 'single' && moduleDoorKind !== 'double') return false;
  if (!Number.isFinite(Number(zoneIndex))) return false;
  if (sectionData.lShape) __ensureLShapeLayoutCacheSegments(sectionData);
  if (__isLShapeSpecialZone(sectionData, zoneIndex)) return false;
  const zoneKindRaw = getZoneDoorKind(sectionData, zoneIndex);
  if (!zoneKindRaw) return false;
  const slotW = __getModuleWidthMmForZone(sectionData, zoneIndex);
  const zoneKind =
    slotW > 0 && slotW < 800 && moduleDoorKind === 'double'
      ? 'single'
      : zoneKindRaw;
  if (moduleDoorKind === zoneKind) return true;
  // L: cross-span через live insert-shift — призрак можно.
  if (sectionData.lShape) {
    if (moduleDoorKind === 'single' && zoneKind === 'double') return true;
    if (moduleDoorKind === 'double' && zoneKind === 'single') return true;
    return false;
  }
  if (moduleDoorKind === 'single' && zoneKind === 'double') return true;
  if (moduleDoorKind === 'double' && zoneKind === 'single') {
    return findNeighborZoneForDoubleEat(sectionData, zoneIndex) != null;
  }
  return false;
}

/**
 * Перед place (Maatkasten SoT): ячейки > replace / split(занятый) / eat-merge.
 * @param {number} [hitAlongMm] — координата клика вдоль стены
 * @param {{ role?: string, group?: string }|null} [pendingCohabitSpec] — совместность pending (drag)
 */
function prepareZonePlaceGesture(sectionData, zoneIndex, moduleDoorKind, hitAlongMm, pendingCohabitSpec) {
  if (!sectionAllowsZonePlaceGestures(sectionData)) return null;
  if (moduleDoorKind !== 'single' && moduleDoorKind !== 'double') return null;
  if (!Number.isFinite(Number(zoneIndex))) return null;

  if (sectionData.lShape) __ensureLShapeLayoutCacheSegments(sectionData);

  if (typeof window.__clodisComputeSectionLayout === 'function') {
    try {
      window.__clodisComputeSectionLayout(sectionData);
    } catch (_) {}
  }
  if (sectionData.lShape) __ensureLShapeLayoutCacheSegments(sectionData);

  // Не режем всю секцию в singles (это ломало Maatkasten).
  // Single на double > split только кликнутой зоны (ниже).

  let zi = Number(zoneIndex);
  const hitZi = findZoneIndexByHitAlong(sectionData, hitAlongMm);
  if (hitZi != null) zi = hitZi;

  if (__isLShapeSpecialZone(sectionData, zi)) {
    // Спец угла (§6.8): жесты split/merge не для неё.
    // Раньше ok:false > placePendingFurniture делал return — призрак ок, шкаф не появлялся.
    return null;
  }

  const zoneKindRaw = getZoneDoorKind(sectionData, zi);
  if (!zoneKindRaw) return null;
  const slotW = __getModuleWidthMmForZone(sectionData, zi);
  const zoneKind =
    slotW > 0 && slotW < 800 && moduleDoorKind === 'double'
      ? 'single'
      : zoneKindRaw;

  const pendingSpec =
    pendingCohabitSpec && typeof pendingCohabitSpec === 'object'
      ? pendingCohabitSpec
      : state.pendingFurnitureData
        ? resolvePendingZoneCohabitSpec(state.pendingFurnitureData)
        : { role: 'full', group: '' };

  // F/G + place в пустую ячейку: same width — replace / просто place.
  // Совместимую пару (base+mid kitchen_column) не сносим; same-role — отказ.
  if (moduleDoorKind === zoneKind) {
    if (findSameRoleKitchenColumnOccupant(sectionData.id, zi, pendingSpec)) {
      toastKitchenSameRoleBlocked(pendingSpec);
      return { ok: false, reason: 'same-role-kitchen-column' };
    }
    removeIncompatibleZoneOccupantsForPlace(sectionData.id, zi, pendingSpec);
    return {
      ok: true,
      placeZoneIndex: zi,
      zoneDoorKind: zoneKind,
      gesture: 'replace',
    };
  }

  // B: Single на Double > half под курсором; на L — то же на свободном плече (спец не трогаем).
  if (moduleDoorKind === 'single' && zoneKind === 'double') {
    const widths = snapshotSectionZoneWidthsMm(sectionData);
    const w = Number(widths[zi]) || 0;
    if (w < ZONE_GESTURE_MIN_WIDTH_MM * 2) {
      return { ok: false, reason: 'split-too-narrow' };
    }
    const left = Math.round(w / 2);
    const right = Math.max(1, w - left);
    if (left < ZONE_GESTURE_MIN_WIDTH_MM || right < ZONE_GESTURE_MIN_WIDTH_MM) {
      return { ok: false, reason: 'split-too-narrow' };
    }
    const half = resolveZoneSplitHalf(sectionData, zi, hitAlongMm);
    removeIncompatibleZoneOccupantsForPlace(sectionData.id, zi, pendingSpec);
    shiftFurnitureZoneIndicesFrom(sectionData.id, zi + 1, 1);
    applySectionCustomZoneWidthsMm(sectionData, [
      ...widths.slice(0, zi),
      left,
      right,
      ...widths.slice(zi + 1),
    ]);
    if (sectionData.lShape) __syncLShapeAfterWidthGesture(sectionData);
    let placeZoneIndex = half === 'right' ? zi + 1 : zi;
    placeZoneIndex = repackStraightEmptiesAsDoubles(sectionData, placeZoneIndex);
    if (sectionData.lShape) __syncLShapeAfterWidthGesture(sectionData);
    console.log('[ZONE-GESTURE] split+repack', {
      sectionId: sectionData.id,
      zoneIndex: zi,
      half,
      placeZoneIndex,
      left,
      right,
      hitAlongMm,
      lShape: !!sectionData.lShape,
    });
    return {
      ok: true,
      placeZoneIndex,
      zoneDoorKind: 'single',
      gesture: 'split',
    };
  }

  // C/D/E: Double на Single — съесть клик + сосед, без push (SoT Ч3).
  if (moduleDoorKind === 'double' && zoneKind === 'single') {
    const neighbor = findNeighborZoneForDoubleEat(sectionData, zi);
    if (neighbor == null) {
      return { ok: false, reason: 'merge-no-neighbor' };
    }
    if (
      sectionData.lShape &&
      (__isLShapeSpecialZone(sectionData, zi) ||
        __isLShapeSpecialZone(sectionData, neighbor) ||
        __resolveLShapeSpecialZoneIndexForParts(
          sectionData,
          Math.floor(Number(sectionData.division?.parts) || 0)
        ) === neighbor ||
        __resolveLShapeSpecialZoneIndexForParts(
          sectionData,
          Math.floor(Number(sectionData.division?.parts) || 0)
        ) === zi)
    ) {
      return { ok: false, reason: 'l-special-zone' };
    }
    const widths = snapshotSectionZoneWidthsMm(sectionData);
    const wS = Math.round(Number(widths[zi]) || 0);
    const wN = Math.round(Number(widths[neighbor]) || 0);
    const lo = Math.min(zi, neighbor);
    const hi = Math.max(zi, neighbor);
    const neighborNarrow = zoneSlotIsNarrowSingle(sectionData, neighbor);
    const total = Math.round(wS + wN);

    removeIncompatibleZoneOccupantsForPlace(sectionData.id, zi, pendingSpec);
    removeIncompatibleZoneOccupantsForPlace(sectionData.id, neighbor, pendingSpec);

    if (!neighborNarrow && total >= ZONE_GESTURE_MIN_WIDTH_MM * 2) {
      const wDoubleClamped = Math.min(
        Math.max(wN, ZONE_GESTURE_MIN_WIDTH_MM * 2),
        total
      );
      const wEmpty = Math.max(1, total - wDoubleClamped);
      if (
        wEmpty >= ZONE_GESTURE_MIN_WIDTH_MM &&
        wDoubleClamped >= ZONE_GESTURE_MIN_WIDTH_MM * 2
      ) {
        const newWidths = widths.slice();
        newWidths[lo] = wDoubleClamped;
        newWidths[hi] = wEmpty;
        applySectionCustomZoneWidthsMm(sectionData, newWidths);
        if (sectionData.lShape) __syncLShapeAfterWidthGesture(sectionData);
        console.log('[ZONE-GESTURE] eat-pack', {
          sectionId: sectionData.id,
          zoneIndex: zi,
          neighbor,
          placeZoneIndex: lo,
          wDouble: wDoubleClamped,
          wEmpty,
        });
        return {
          ok: true,
          placeZoneIndex: lo,
          zoneDoorKind: 'double',
          gesture: 'merge',
        };
      }
    }

    if (total < ZONE_GESTURE_MIN_WIDTH_MM * 2) {
      return { ok: false, reason: 'merge-too-narrow' };
    }
    shiftFurnitureZoneIndicesFrom(sectionData.id, hi + 1, -1);
    applySectionCustomZoneWidthsMm(sectionData, [
      ...widths.slice(0, lo),
      total,
      ...widths.slice(hi + 1),
    ]);
    if (sectionData.lShape) __syncLShapeAfterWidthGesture(sectionData);
    console.log('[ZONE-GESTURE] merge', {
      sectionId: sectionData.id,
      zoneIndex: zi,
      neighbor,
      placeZoneIndex: lo,
      merged: total,
    });
    return {
      ok: true,
      placeZoneIndex: lo,
      zoneDoorKind: 'double',
      gesture: 'merge',
    };
  }

  return { ok: false, reason: 'unsupported' };
}

if (typeof window !== 'undefined') {
  window.__clodisZonePlaceGesturePossible = (sectionId, zoneIndex, moduleDoorKind) => {
    const sec = (state.customSections || []).find(
      (s) => s && String(s.id) === String(sectionId)
    );
    return zonePlaceGesturePossible(sec, zoneIndex, moduleDoorKind);
  };
}

/**
 * Delete one furniture module (explicit group from pencil, else selection).
 * @param {object|null} [explicitGroup] THREE.Object3D with userData.isFurniture
 * @returns {boolean}
 */
export function deleteSelectedFurniture(explicitGroup = null) {
  let grp = null;
  if (explicitGroup && explicitGroup.isObject3D && explicitGroup.userData?.isFurniture) {
    grp = explicitGroup;
  } else {
    const target = state.selectedFurniture || state.furniture;
    grp = target?.group || null;
  }
  console.log('[DELETE] deleteSelectedFurniture called', {
    explicit: !!(explicitGroup && explicitGroup.isObject3D),
    hasSelectedFurniture: !!state.selectedFurniture,
    hasStateFurniture: !!state.furniture,
    hasGroup: !!grp,
    uuid: grp?.uuid ? String(grp.uuid).slice(0, 8) : null,
    zoneIndex: grp?.userData?.zoneIndex,
    pk: grp?.userData?.__placementKindProfileId || grp?.userData?.__placementKind || null,
  });
  if (!grp) {
    console.warn('[DELETE] abort: no furniture to delete (set selection or place/select module)');
    return false;
  }

  const sectionBeforeDelete = Array.isArray(state.customSections)
    ? state.customSections.find(
        (sec) => String(sec?.id) === String(grp.userData?.sectionId)
      ) || null
    : null;
  const deletedWallName = String(
    grp.userData?.wallName || sectionBeforeDelete?.wallName || ''
  ).trim();
  try {
    const B = typeof window !== 'undefined' ? window.ClodisBuilder : null;
    if (B && typeof B.unregisterDoorSwingGroupsFromRoot === 'function') {
      B.unregisterDoorSwingGroupsFromRoot(grp);
    }
  } catch (_) {}
  const deletedSectionId = grp.userData?.sectionId;
  const deletedZoneIndex = grp.userData?.zoneIndex;
  const deletedUuid = grp.uuid;
  try {
    if (deletedSectionId != null && typeof deletedZoneIndex === 'number') {
      // Only this module pencil — keep cohabiting mid/top icons until rebuild.
      removeSectionZoneEditIcon(deletedSectionId, deletedZoneIndex, deletedUuid);
    }
    if (typeof clearModuleEditFocusFog === 'function') {
      clearModuleEditFocusFog();
    }
  } catch (_) {}
  if (grp.parent) grp.parent.remove(grp);
  else if (state.scene) state.scene.remove(grp);

  __disposeObject3DTree(grp);
  invalidateGroupIconBBoxCache(grp);

  hideFurniturePerimeterMarker();

  state.selectedFurniture = null;
  if (state.furniture?.group === grp) state.furniture = null;

  try {
    __recalcRoomTotalPriceAndUpdateUi();
  } catch {}

  try {
    refreshFurnitureCatalogNameLabels();
  } catch (_) {}

  try {
    const remaining = [];
    state.scene.traverse((obj) => {
      if (obj?.userData?.isFurniture && obj?.isGroup) {
        remaining.push({
          name: obj.name || '?',
          kind: obj.userData?.placementKind || '?',
          wall: obj.userData?.wallName || '?',
          sectionId: obj.userData?.sectionId,
          uuid: obj.uuid.slice(0, 6),
        });
      }
    });
    console.log('[DELETE] remaining furniture after scene.remove:', remaining.length, remaining);
  } catch (_) {}

  try {
    rebuildAllTransitions();
  } catch (e) {
    console.error('[PLACE] rebuildAllTransitions failed', e);
  }
  try {
    if (sectionBeforeDelete) {
      syncSectionEmptyFrameVisibility(sectionBeforeDelete);
      const gid =
        sectionBeforeDelete.windowAlongWallGroupId ||
        sectionBeforeDelete.windowBridgeGroupId;
      if (gid && Array.isArray(state.customSections)) {
        for (const sec of state.customSections) {
          if (!sec || sec === sectionBeforeDelete) continue;
          if (
            sec.windowAlongWallGroupId === gid ||
            sec.windowBridgeGroupId === gid
          ) {
            syncSectionEmptyFrameVisibility(sec);
          }
        }
      }
    }
  } catch (_) {}
  scheduleSectionTrimAfterFurnitureGeometry(sectionBeforeDelete);

  try {
    if (deletedSectionId != null) {
      if (typeof window.refreshWindowBridgeDimensionLabels === 'function') {
        window.refreshWindowBridgeDimensionLabels(deletedSectionId);
      } else if (typeof window.refreshSectionDimensionLabelsForSection === 'function') {
        window.refreshSectionDimensionLabelsForSection(deletedSectionId);
      }
    }
    if (typeof window.scheduleRebuildAllDimensionLines === 'function') {
      window.scheduleRebuildAllDimensionLines();
    }
  } catch (_) {}

  try {
    if (deletedSectionId != null && typeof rebuildSectionZoneEditIconsForSection === 'function') {
      rebuildSectionZoneEditIconsForSection(deletedSectionId);
    }
  } catch (_) {}

  try {
    if (typeof window !== 'undefined' && window.currentRoomStep === 4) {
      if (hasAnyFurnitureInScene()) buildStep4SectionEditIcons();
      else clearStep4SectionEditIcons();
    }
  } catch (_) {}

  try {
    if (typeof window.__cldSyncCellVolumeMeshes === 'function') {
      window.__cldSyncCellVolumeMeshes();
    }
  } catch (_) {}

  // Лицевой цоколь-прогон: пересобрать ленту после удаления модуля.
  try {
    const ov =
      typeof window !== 'undefined' ? window.__cldKitchenRunOverlays : null;
    if (
      deletedWallName &&
      ov &&
      typeof ov.syncKitchenRunOverlaysOnWall === 'function'
    ) {
      ov.syncKitchenRunOverlaysOnWall(deletedWallName);
    }
  } catch (_) {}

  console.log('[DELETE] furniture removed', {
    sectionId: deletedSectionId,
    zoneIndex: deletedZoneIndex,
    uuid: deletedUuid ? String(deletedUuid).slice(0, 8) : null,
  });
  try {
    if (typeof window !== 'undefined' && typeof window.__cldMarkRoomDraftDirty === 'function') {
      window.__cldMarkRoomDraftDirty('furniture_delete');
    }
  } catch (_) {}
  return true;
}
const STEP5_MODULE_DECORS_STORAGE_KEY = 'room_step5_module_decors';

function __getFurnitureRootGroupForMesh(mesh) {
  let p = mesh;
  while (p) {
    if (p.isGroup && p.userData?.isFurniture) return p;
    p = p.parent;
  }
  return null;
}

/** Обклад на sectionGroup: UV и декор как у фасадов — ищем шкаф той же секции. */
function __getFurnitureRootBySectionId(sectionId) {
  if (sectionId == null || sectionId === '' || !state.scene) return null;
  const sid = String(sectionId);
  let found = null;
  state.scene.traverse((o) => {
    if (found) return;
    if (o.isGroup && o.userData?.isFurniture && String(o.userData.sectionId) === sid) {
      found = o;
    }
  });
  return found;
}

function __getFurnitureRootForDecorMesh(mesh) {
  return (
    __getFurnitureRootGroupForMesh(mesh) ||
    __getFurnitureRootBySectionId(__getSectionIdFromObject(mesh))
  );
}

const STEP5_ROOT_UV_REV = 4;

/**
 * Локальный AABB корня мебели (все вершины мешей под isFurniture) — для UV «растянуть текстуру на весь шкаф».
 */
function __computeFurnitureRootLocalBbox(furnitureRoot) {
  furnitureRoot.updateMatrixWorld(true);
  const invRoot = new THREE.Matrix4().copy(furnitureRoot.matrixWorld).invert();
  const box = new THREE.Box3();
  const tmp = new THREE.Vector3();
  furnitureRoot.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;
    const pos = child.geometry.attributes.position;
    if (!pos) return;
    child.updateMatrixWorld(true);
    const wc = child.matrixWorld;
    for (let i = 0; i < pos.count; i++) {
      tmp.fromBufferAttribute(pos, i).applyMatrix4(wc);
      tmp.applyMatrix4(invRoot);
      box.expandByPoint(tmp);
    }
  });
  if (box.isEmpty() || !Number.isFinite(box.min.x)) {
    return {
      min: new THREE.Vector3(0, 0, 0),
      max: new THREE.Vector3(1000, 1000, 1000),
    };
  }
  return { min: box.min.clone(), max: box.max.clone() };
}

/**
 * UV по корню мебели: одна «плитка» текстуры растягивается на весь корпус (0Ц1), без повторов каждые tex мм —
 * иначе на заднике и боках видны стыки тайлинга.
 * Трипланарно по доминанту нормали (generateAdvancedUVs, строгие >).
 * Вторая координата с flip 1?v как в референсе.
 *
 * @param {object|null} rootBbox — из кэша на один проход refreshFurnitureDecors (локальный AABB корня)
 */
function __getFacadeOriginalSizeMmForEdgeStrip(mesh) {
  let p = mesh && mesh.parent;
  while (p) {
    const os = p.userData && p.userData.originalSize;
    if (os && (Number(os.x) > 0 || Number(os.y) > 0)) {
      return { x: Number(os.x) || 450, y: Number(os.y) || 720 };
    }
    p = p.parent;
  }
  return { x: 450, y: 720 };
}

function __ensureRootSpaceTextureUvForMesh(mesh, furnitureRoot, rootBbox) {
  if (!mesh || !furnitureRoot || !mesh.geometry) return;
  if (mesh.userData.__cldRootSpaceUvStep5Rev === STEP5_ROOT_UV_REV) return;
  const src = mesh.geometry;
  if (!src.attributes?.position || !src.attributes?.normal || !src.attributes?.uv) return;

  const geom = src.clone();
  mesh.geometry = geom;
  mesh.userData.__cldRootSpaceUvStep5Rev = STEP5_ROOT_UV_REV;

  const pos = geom.attributes.position;
  const nrm = geom.attributes.normal;
  const uv = geom.attributes.uv;

  mesh.updateMatrixWorld(true);
  furnitureRoot.updateMatrixWorld(true);
  const invRoot = new THREE.Matrix4().copy(furnitureRoot.matrixWorld).invert();
  const vLocal = new THREE.Vector3();
  const vWorld = new THREE.Vector3();
  const pRoot = new THREE.Vector3();
  const nLocal = new THREE.Vector3();
  const nWorld = new THREE.Vector3();

  const bbox = rootBbox || __computeFurnitureRootLocalBbox(furnitureRoot);
  const min = bbox.min;
  const max = bbox.max;
  const sx = Math.max(1e-6, max.x - min.x);
  const sy = Math.max(1e-6, max.y - min.y);
  const sz = Math.max(1e-6, max.z - min.z);

  for (let i = 0; i < pos.count; i++) {
    vLocal.fromBufferAttribute(pos, i);
    nLocal.fromBufferAttribute(nrm, i);
    vWorld.copy(vLocal).applyMatrix4(mesh.matrixWorld);
    pRoot.copy(vWorld).applyMatrix4(invRoot);
    nWorld.copy(nLocal).transformDirection(mesh.matrixWorld).normalize();

    const ax = Math.abs(nWorld.x);
    const ay = Math.abs(nWorld.y);
    const az = Math.abs(nWorld.z);
    let uu;
    let vv;
    if (az > ax && az > ay) {
      uu = (pRoot.x - min.x) / sx;
      vv = 1 - (pRoot.y - min.y) / sy;
    } else if (ay > ax) {
      uu = (pRoot.x - min.x) / sx;
      vv = 1 - (pRoot.z - min.z) / sz;
    } else {
      uu = (pRoot.z - min.z) / sz;
      vv = 1 - (pRoot.y - min.y) / sy;
    }
    uv.setXY(i, THREE.MathUtils.clamp(uu, 0, 1), THREE.MathUtils.clamp(vv, 0, 1));
  }
  uv.needsUpdate = true;
}

function __furnitureStep5StorageKey(group) {
  const ud = group?.userData || {};
  if (ud.isEndCabinet === true && ud.sectionId != null && ud.endCabinetSide) {
    return `${String(ud.sectionId)}_end_${String(ud.endCabinetSide)}`;
  }
  if (ud.sectionId != null && typeof ud.zoneIndex === 'number') {
    return String(ud.sectionId) + '_' + ud.zoneIndex;
  }
  return 'uuid_' + (group?.uuid || 'unknown');
}

function __normalizeStep5DecorColor(c) {
  if (!c) return null;
  const texture = getStep5DecorTextureUrl(c);
  const out = {
    id: c.id,
    name: c.name,
    texture,
    material_type: c.material_type || c.materialType || null,
    material_id:
      c.material_id != null
        ? c.material_id
        : c.materialId != null
          ? c.materialId
          : null,
    material_key: c.material_key || c.materialKey || null,
  };
  const hex = getStep5DecorHexFallback(c);
  if (hex) out.hex = hex;
  return out;
}

/**
 * Применить декор к одному шкафу (шаг 5, режим «иконка»). Не трогает глобальный room_step5_decor_selection.
 */
export function applyStep5ModuleDecorToFurnitureGroup(group, ring, color) {
  if (!group || !group.userData) return;
  const n = __normalizeStep5DecorColor(color);
  if (ring === 'outside') group.userData.step5ModuleOutside = n;
  if (ring === 'inside') group.userData.step5ModuleInside = n;
  if (ring === 'endOverlay' && group.userData.isEndCabinet === true) {
    group.userData.step5ModuleEndOverlay = n;
  }
  refreshFurnitureDecors();
  try {
    const wall = String(group?.userData?.wallName || '').trim();
    const ov =
      typeof window !== 'undefined' ? window.__cldKitchenRunOverlays : null;
    if (wall && ov && typeof ov.syncKitchenRunOverlaysOnWall === 'function') {
      ov.syncKitchenRunOverlaysOnWall(wall);
    }
  } catch (_) {}
}

/** Сохранить декор: обычный модуль — sectionId+zoneIndex, торцевой — sectionId+side. */
export function persistStep5ModuleDecorForGroup(group) {
  if (!group?.userData) return;
  try {
    const key = __furnitureStep5StorageKey(group);
    const raw = localStorage.getItem(STEP5_MODULE_DECORS_STORAGE_KEY) || '{}';
    const map = JSON.parse(raw);
    map[key] = {
      outside: group.userData.step5ModuleOutside || null,
      inside: group.userData.step5ModuleInside || null,
      endOverlay:
        group.userData.isEndCabinet === true
          ? group.userData.step5ModuleEndOverlay || null
          : null,
    };
    localStorage.setItem(STEP5_MODULE_DECORS_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('[STEP5] persistStep5ModuleDecorForGroup:', e);
  }
  try {
    if (typeof window !== 'undefined' && typeof window.__cldMarkRoomDraftDirty === 'function') {
      window.__cldMarkRoomDraftDirty('step5_decor');
    }
  } catch (_) {}
}

export function restoreStep5ModuleDecorFromStorage(group) {
  if (!group?.userData) return;
  try {
    const key = __furnitureStep5StorageKey(group);
    const raw = localStorage.getItem(STEP5_MODULE_DECORS_STORAGE_KEY);
    if (!raw) return;
    const map = JSON.parse(raw);
    const entry = map[key];
    if (!entry) return;
    if (entry.outside) group.userData.step5ModuleOutside = entry.outside;
    if (entry.inside) group.userData.step5ModuleInside = entry.inside;
    if (entry.endOverlay && group.userData.isEndCabinet === true) {
      group.userData.step5ModuleEndOverlay = entry.endOverlay;
    }
  } catch (e) {
    console.warn('[STEP5] restoreStep5ModuleDecorFromStorage:', e);
  }
}

/**
 * Обновить декоры корпуса и фасада у уже размещённой мебели (при смене на шаге 5).
 */
function __isSectionTrimPlankUserData(ud) {
  return !!(
    ud?.sectionTrimUsesOutsideDecor === true &&
    (ud.isTopPlank ||
      ud.isBottomPlank ||
      ud.isSidePlank ||
      ud.isSideOverlay ||
      ud.isSectionFacadeTrim ||
      ud.isTransitionHeightMismatch ||
      ud.isTransitionAutoTopCap ||
      ud.isSectionTransitionPart)
  );
}

/** Декор «снаружи» на меш (фасад / обклад). */
function __applyStep5OutsideDecorToMesh(obj, effectiveOutside, ctx) {
  if (!obj?.isMesh || !obj.material || !effectiveOutside) return false;
  const ud = obj.userData || {};
  const { textureLoader, decorRoot, getRootBboxForUv, isFacadeEdgeStrip } = ctx;
  const isTrim = __isSectionTrimPlankUserData(ud);
  const edgeStrip = typeof isFacadeEdgeStrip === 'function' && isFacadeEdgeStrip(obj);

  const outMid = effectiveOutside.material_id ?? effectiveOutside.materialId;
  if (outMid != null && outMid !== '') {
    const n = Number(outMid);
    if (Number.isFinite(n) && n > 0) {
      obj.userData.step5MaterialId = n;
      obj.userData.catalogMaterialId = n;
      obj.userData.catalogMaterialKey =
        effectiveOutside.material_key || effectiveOutside.materialKey || 'material_2';
    }
  }

  const mat = obj.material;
  const outsideTex = getStep5DecorTextureUrl(effectiveOutside);
  const outsideHex = getStep5DecorHexFallback(effectiveOutside);
  const outsidePreview = getStep5DecorPreviewColor(effectiveOutside);
  const rough = isTrim || edgeStrip ? 0.58 : 0.7;
  // Тонкая вертикаль (накладка/боковина): root-space UV шкафа часто даёт чёрный сэмпл текстуры.
  const isVerticalSectionTrim =
    isTrim &&
    (ud.isSideOverlay === true ||
      ud.isSidePlank === true ||
      ud.isTransitionHeightMismatch === true ||
      /^(SideOverlay|SidePlank)/.test(String(obj.name || '')));

  const mats = Array.isArray(mat) ? mat : [mat];
  const ikeaBound = mats.some((m) => m?.userData?.__cldIkeaV0);

  // Обклад секции (планки/накладки) лежит вне bbox шкафа — root-space UV фасада
  // даёт белый/чёрный сэмпл. Текстуру «Снаружил к»адём на собственные UV бокса.
  const useMeshLocalUvForTrim = isTrim === true;

  if (ikeaBound) {
    if (isVerticalSectionTrim && !outsideTex) {
      applyIkeaV0MeshDecorFromStep5ToMesh(obj, {
        colorHex: outsideHex || outsidePreview || '#ffffff',
        roughness: rough,
        metalness: 0,
      });
      return true;
    }
    if (!outsideTex && outsideHex) {
      applyIkeaV0MeshDecorFromStep5ToMesh(obj, {
        colorHex: outsideHex,
        roughness: rough,
        metalness: 0,
      });
    } else if (outsideTex) {
      if (outsidePreview || outsideHex) {
        applyIkeaV0MeshDecorFromStep5ToMesh(obj, {
          colorHex: outsidePreview || outsideHex,
          roughness: rough,
          metalness: 0,
        });
      }
      if (!edgeStrip && decorRoot && !useMeshLocalUvForTrim) {
        if (isTrim) delete obj.userData.__cldRootSpaceUvStep5Rev;
        __ensureRootSpaceTextureUvForMesh(obj, decorRoot, getRootBboxForUv(decorRoot));
      }
      __loadDecorTexture(
        outsideTex,
        (tex) => {
          const localTex = __prepareDecorTextureClone(tex, {
            edgeStrip,
            obj,
            // Планки/накладки — repeat по самой детали, не UV шкафа.
            forceMeshUv: useMeshLocalUvForTrim,
          });
          applyIkeaV0MeshDecorFromStep5ToMesh(obj, {
            colorHex: '#ffffff',
            map: localTex,
            roughness: rough,
            metalness: 0,
          });
        },
        () => {
          applyIkeaV0MeshDecorFromStep5ToMesh(obj, {
            colorHex: outsideHex || outsidePreview || '#ffffff',
            roughness: rough,
            metalness: 0,
          });
          console.warn('[STEP5] decor texture fail, color fallback:', outsideTex);
        }
      );
    }
    return true;
  }

  if (isVerticalSectionTrim && !outsideTex) {
    const hex = outsideHex || outsidePreview || '#ffffff';
    for (const m of mats) {
      if (!m) continue;
      m.map = null;
      m.color.set(hex);
      m.roughness = rough;
      m.metalness = 0.2;
      m.needsUpdate = true;
    }
    return true;
  }

  if (!outsideTex && outsideHex) {
    for (const m of mats) {
      if (!m) continue;
      m.map = null;
      m.color.set(outsideHex);
      m.needsUpdate = true;
    }
  } else if (outsideTex) {
    if (outsidePreview) {
      for (const m of mats) {
        if (!m) continue;
        m.color.set(outsidePreview);
        m.needsUpdate = true;
      }
    }
  }

  for (const m of mats) {
    if (!m) continue;
    m.roughness = rough;
    m.metalness = 0.2;
    m.transparent = false;
    m.opacity = 1.0;
    m.depthWrite = true;
    m.depthTest = true;
    if (ud.isFacade === true || edgeStrip) m.side = THREE.DoubleSide;
    m.needsUpdate = true;
  }

  if (edgeStrip) {
    for (const m of mats) {
      if (!m) continue;
      m.normalMap = null;
      m.roughnessMap = null;
      m.needsUpdate = true;
    }
  }

  if (outsideTex) {
    if (!edgeStrip && decorRoot && !useMeshLocalUvForTrim) {
      if (isTrim) delete obj.userData.__cldRootSpaceUvStep5Rev;
      __ensureRootSpaceTextureUvForMesh(obj, decorRoot, getRootBboxForUv(decorRoot));
    }
    __loadDecorTexture(
      outsideTex,
      (tex) => {
        const localTex = __prepareDecorTextureClone(tex, {
          edgeStrip,
          obj,
          forceMeshUv: useMeshLocalUvForTrim,
        });
        for (const m of mats) {
          if (!m) continue;
          __assignMaterialMap(m, localTex);
          m.color.set(0xffffff);
          m.needsUpdate = true;
        }
      },
      () => {
        const hex = outsideHex || outsidePreview || '#ffffff';
        for (const m of mats) {
          if (!m) continue;
          m.map = null;
          try {
            m.color.set(hex);
          } catch (_) {
            m.color.setHex(0xffffff);
          }
          m.needsUpdate = true;
        }
        console.warn('[STEP5] decor texture fail, color fallback:', outsideTex);
      }
    );
  }
  return true;
}

function __reapplyOutsideDecorToSectionTrimMeshes(
  selection,
  textureLoader,
  getRootBboxForUv,
  traversalRoot = state.scene
) {
  if (!state.scene || !traversalRoot) return 0;

  // Торцевые детали лежат в sectionGroup, поэтому связываем их с владельцем
  // явно по sectionId + side. Это также корректно работает с двумя торцевыми.
  const endCabinetOwners = new Map();
  state.scene.traverse((obj) => {
    const ud = obj?.userData;
    if (
      !obj?.isGroup ||
      ud?.isFurniture !== true ||
      ud.isEndCabinet !== true ||
      ud.isEndCabinetSlot === true ||
      ud.sectionId == null ||
      !ud.endCabinetSide
    ) {
      return;
    }
    endCabinetOwners.set(
      `${String(ud.sectionId)}::${String(ud.endCabinetSide)}`,
      obj
    );
  });

  let n = 0;
  traversalRoot.traverse((obj) => {
    if (!isSectionTrimFacadeMesh(obj) || obj.userData?.isEdge) return;
    const ud = obj.userData || {};
    const owner =
      ud.sectionId != null && ud.endCabinetSide
        ? endCabinetOwners.get(
            `${String(ud.sectionId)}::${String(ud.endCabinetSide)}`
          ) || null
        : null;
    const isEndCabinetBodyTrim =
      ud.isEndCabinetWallPlank === true ||
      ud.isEndCabinetTopPlank === true ||
      ud.isEndCabinetPlinth === true;
    const isEndCabinetOverlay = ud.isEndCabinetFacadeOverlay === true;
    const editingRoot =
      typeof window !== 'undefined' ? window.step5EditingFurnitureGroup : null;
    const outside =
      isEndCabinetOverlay && owner
        ? owner.userData?.step5ModuleEndOverlay ?? selection?.outside
        : isEndCabinetBodyTrim && owner
          ? editingRoot && owner === editingRoot
            ? owner.userData?.step5ModuleOutside ?? selection?.outside
            : selection?.outside ?? owner.userData?.step5ModuleOutside
          : selection?.outside;
    if (!outside) return;

    if (outside.id) ud.step5TrimDecorId = String(outside.id);
    const trimMatId = outside.material_id ?? outside.materialId;
    if (trimMatId != null) {
      ud.step5TrimMaterialType =
        outside.material_type || outside.materialType || 'material_2';
      ud.step5TrimMaterialId = Number(trimMatId);
    }
    const decorRoot = owner || __getFurnitureRootForDecorMesh(obj);
    if (
      __applyStep5OutsideDecorToMesh(obj, outside, {
        textureLoader,
        decorRoot,
        getRootBboxForUv,
        isFacadeEdgeStrip: () => false,
      })
    ) {
      n++;
      // Кромки торцевых деталей должны получить тот же визуал, что плита.
      obj.traverse((child) => {
        if (child !== obj && child?.isMesh && child.userData?.isEdge) {
          copyCoreVisualMaterialToEdge(child, obj);
        }
      });
    }
  });
  return n;
}

function __isDefaultWhitePlaceholderEdge(edgeData) {
  if (!edgeData || typeof edgeData !== 'object') return true;
  const c = String(edgeData.color ?? '').trim().toLowerCase();
  return !c || c === '#ffffff' || c === '#fff';
}

/** Скопировать визуал core на полоску кромки (clone; плита — эталон, UV плиты не трогаем). */
function copyCoreVisualMaterialToEdge(edgeMesh, coreMesh) {
  if (!edgeMesh?.isMesh || !coreMesh?.isMesh || !coreMesh.material) return false;
  const src = Array.isArray(coreMesh.material) ? coreMesh.material[0] : coreMesh.material;
  if (!src) return false;
  if (src.userData?.__cldIkeaV0) {
    const kind = isSectionTrimFacadeMesh(coreMesh) ? 'trim' : 'corpus';
    return copyIkeaV0VisualFromCoreToEdge(edgeMesh, coreMesh, kind);
  }
  let em = edgeMesh.material;
  if (!em || em === src) {
    em = src.clone();
    edgeMesh.material = em;
  }
  em.color.copy(src.color);
  em.roughness = src.roughness;
  em.metalness = src.metalness;
  em.normalMap = null;
  em.roughnessMap = null;
  em.map = src.map || null;
  em.needsUpdate = true;
  edgeMesh.userData.cldClonedBodyMaterial = true;
  edgeMesh.userData.cldCorpusBodyEdge = true;
  return true;
}

/** Комната: полоски кромки корпуса < clone material _core (плита не меняется). */
function syncCorpusEdgeMaterialsFromCoreMeshes(scene) {
  if (!scene || typeof THREE === 'undefined') return 0;
  const seen = new Set();
  let n = 0;
  scene.traverse((obj) => {
    if (!obj?.isMesh || !obj.userData?.isEdge) return;
    let wall = obj.parent;
    while (wall && !wall.userData?.isDetail) wall = wall.parent;
    if (!wall || seen.has(wall)) return;
    if (wall.userData?.cldUseTemplateMaterial) return;
    if (wall.userData?.step5DecorChannel !== 'inside') return;
    const core = wall.children?.find(
      (c) => c?.isMesh && (c.userData?.isBody || String(c.name || '').includes('_core')),
    );
    if (!core?.material) return;
    seen.add(wall);
    wall.traverse((c) => {
      if (!c?.isMesh || !c.userData?.isEdge) return;
      if (copyCoreVisualMaterialToEdge(c, core)) n++;
    });
  });
  return n;
}

/** IKEA: сначала BetraktaPBR bind, потом uniforms декора — не наоборот.
 * Как в 1.66: корень-секция (isCustomSection) не особый случай —
 * нужен syncAllSectionTrimStudio, иначе планки/накладки остаются без bind и белеют.
 */
function __ensureIkeaV0BeforeStep5Decor(limitRoot) {
  try {
    if (limitRoot?.userData?.isFurniture) {
      applyRoomCabinetStudioLook(limitRoot);
      const sid = limitRoot.userData?.sectionId;
      if (sid != null) applySectionTrimStudioLookForSectionId(sid);
      return;
    }
    if (state.scene) {
      state.scene.traverse((o) => {
        if (o?.userData?.isFurniture) applyRoomCabinetStudioLook(o);
      });
      syncAllSectionTrimStudio(state.scene);
    }
  } catch (e) {
    console.warn('[STEP5] ikea v0 pre-bind:', e);
  }
}

function auditStep5Decor(root) {
  const selection =
    typeof window !== 'undefined' && typeof window.getStep5DecorSelection === 'function'
      ? window.getStep5DecorSelection()
      : { outside: null, inside: null };
  const targetRoot = root || state.furniture?.group || state.scene;
  if (!targetRoot) return { ok: false, reason: 'no root' };
  let facadeIkea = 0;
  let facadeStd = 0;
  let bodyIkea = 0;
  let bodyStd = 0;
  const samples = [];
  targetRoot.traverse((o) => {
    if (!o.isMesh) return;
    const ud = o.userData || {};
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    const ikea = !!m?.userData?.__cldIkeaV0;
    if (ud.isFacade) ikea ? (facadeIkea += 1) : (facadeStd += 1);
    if (ud.isBody) ikea ? (bodyIkea += 1) : (bodyStd += 1);
    if ((ud.isFacade || ud.isBody) && samples.length < 8) {
      const d = m?.uniforms?.diffuse?.value;
      samples.push({
        name: o.name,
        role: ud.isFacade ? 'facade' : 'body',
        ikeaV0: ikea,
        step5Decor: !!m?.userData?.__cldIkeaV0Step5Decor,
        diffuseLinear: d ? [+d.x.toFixed(3), +d.y.toFixed(3), +d.z.toFixed(3)] : null,
        hasMap: !!(m?.uniforms?.hasMap?.value > 0.5),
      });
    }
  });
  return {
    ok: facadeStd === 0 && bodyStd === 0,
    selection,
    counts: { facadeIkea, facadeStd, bodyIkea, bodyStd },
    samples,
    pipeline: 'studio bind > step5 uniforms (IKEA); re-bind не сбрасывает diffuse',
  };
}

function refreshFurnitureDecorsImmediate(options = {}) {
  const limitRoot = options?.root || null;
  const placementPreview = options?.placementPreview === true;
  if (!limitRoot && !state.scene) {
    console.warn('[STEP5] Пропуск: нет state.scene');
    return;
  }
  if (!limitRoot && typeof THREE === 'undefined') {
    console.warn('[STEP5] Пропуск: нет THREE');
    return;
  }
  if (!placementPreview) {
    console.log('[STEP5] refreshFurnitureDecors вызван');
  }
  const selection = typeof window !== 'undefined' && window.getStep5DecorSelection
    ? window.getStep5DecorSelection()
    : { outside: null, inside: null };
  console.log('[STEP5] Текущий выбор декоров:', selection);

  __ensureIkeaV0BeforeStep5Decor(limitRoot);

  const textureLoader = __getDecorTextureLoader();
  let facadeCount = 0;
  let bodyCount = 0;
  let pendingInsideTextureLoads = 0;

  const isInsideFurniture = (mesh) => {
    let p = mesh.parent;
    while (p) {
      if (p.userData?.isFurniture) return true;
      p = p.parent;
    }
    return false;
  };

  const isFacadeEdgeStrip = (mesh) => {
    if (!mesh?.userData?.isEdge) return false;
    let p = mesh.parent;
    while (p) {
      if (p.userData?.isFacade) return true;
      p = p.parent;
    }
    return false;
  };

  /** Полоска кромки на корпусе (не фасад / не обклад) — тот же декор «внутри», что у isBody. */
  const isCorpusBodyEdgeStrip = (mesh) => {
    if (!mesh?.userData?.isEdge || isFacadeEdgeStrip(mesh)) return false;
    if (mesh.userData.cldCorpusBodyEdge === true) return true;
    let p = mesh.parent;
    while (p) {
      const pud = p.userData || {};
      if (pud.isFacade === true || pud.sectionTrimUsesOutsideDecor === true) return false;
      if (pud.step5DecorChannel === 'inside' || pud.isBody === true) return true;
      p = p.parent;
    }
    return false;
  };

  const rootBboxCache = new WeakMap();
  const getRootBboxForUv = (root) => {
    if (!root) return null;
    let b = rootBboxCache.get(root);
    if (!b) {
      b = __computeFurnitureRootLocalBbox(root);
      rootBboxCache.set(root, b);
    }
    return b;
  };

  const roots = limitRoot ? [limitRoot] : state.scene ? [state.scene] : [];
  for (const root of roots) {
    if (!root) continue;
    root.traverse((obj) => {
    if (!obj.isMesh || !obj.material) return;
    const ud = obj.userData || {};
    // Lifestyle props / штанга / опоры / Gola (model_key_material) — не декор шага 5.
    if (ud.isShelfProp === true || ud.isRodCompanion === true) return;
    if (ud.cldSupportLeg === true) return;
    // Столешка: декор из карточки/tabletop_items (админка). Шаг 5 «внутри» = белый ЛДСП — не красить.
    if (ud.cldKitchenCountertop === true || ud.cldSkipStep5BodyDecor === true) return;
    {
      let pTt = obj;
      let isTt = false;
      for (let i = 0; !isTt && i < 12 && pTt; i++) {
        const pud = pTt.userData || {};
        const dt = String(pud.detailType || pud.type || pud.originalType || '').toLowerCase();
        if (
          pud.cldKitchenCountertop === true ||
          dt === 'countertop' ||
          dt === 'tabletop' ||
          /столеш/i.test(String(pTt.name || ''))
        ) {
          isTt = true;
        }
        pTt = pTt.parent;
      }
      if (isTt) return;
    }
    // Только каталожный accessory с карточкой (не фасады с isAccessory).
    if (
      ud.isAccessory === true &&
      (ud.cldCabinetMaterialParams || ud.cldSkipStep5FacadeDecor === true)
    ) {
      return;
    }
    if (ud.cldCabinetMaterialParams) {
      let pLeg = obj;
      let isLeg = false;
      for (let i = 0; !isLeg && i < 12 && pLeg; i++) {
        if (pLeg.userData?.cldSupportLeg) isLeg = true;
        pLeg = pLeg.parent;
      }
      if (isLeg) return;
    }

    const furnitureRoot = __getFurnitureRootGroupForMesh(obj);
    const decorRoot = __getFurnitureRootForDecorMesh(obj);
    const moduleOutside = furnitureRoot?.userData?.step5ModuleOutside;
    const moduleInside = furnitureRoot?.userData?.step5ModuleInside;
    // Глобальное колесо шага 5 важнее «залипшего» moduleOutside (кроме режима правки одного шкафа).
    const editingRoot =
      typeof window !== 'undefined' ? window.step5EditingFurnitureGroup : null;
    const editingThis = !!(editingRoot && furnitureRoot && editingRoot === furnitureRoot);
    const effectiveOutside = editingThis
      ? moduleOutside ?? selection.outside
      : selection.outside ?? moduleOutside;
    const effectiveInside = editingThis
      ? moduleInside ?? selection.inside
      : selection.inside ?? moduleInside;
    const templateMat = isTemplateLockedMaterialFromUserData(ud);

    // ХДФ / material_3 из шаблона — не трогаем декором «внутри» с колеса.
    if (templateMat) return;

    // Явный декор в JSON детали (превью конструктора):
    // — если есть снаружи/внутри с колеса — пускаем дальше (шаг 5 перекрывает);
    // — если колеса нет — для фасадной группы (g2/g3 уголок) красим декором с карточки.
    if (ud.catalogExplicitDecor === true || ud.catalogMaterialFromItem === true) {
      const bodyUsesInside =
        effectiveInside &&
        ud.step5DecorChannel !== 'outside' &&
        ud.cldFacadeMaterialGroup !== true &&
        (ud.isBody === true ||
          ud.step5DecorChannel === 'inside' ||
          isCorpusBodyEdgeStrip(obj));
      const facadeUsesOutside =
        effectiveOutside &&
        (ud.isFacade === true ||
          isFacadeEdgeStrip(obj) ||
          ud.step5DecorChannel === 'outside' ||
          ud.cldFacadeMaterialGroup === true);
      if (!bodyUsesInside && !facadeUsesOutside) {
        const isFacadeCh =
          ud.step5DecorChannel === 'outside' || ud.cldFacadeMaterialGroup === true;
        if (isFacadeCh) {
          const item = ud.cldBuildItem || obj.parent?.userData?.cldBuildItem || null;
          const tex = String(
            item?.material_icon ||
              item?.materialIcon ||
              item?.spec?.material?.texture ||
              item?.spec?.material?.icon ||
              ''
          ).trim();
          const mid = ud.catalogMaterialId ?? item?.material_id ?? item?.spec?.material?.id;
          if (tex || mid != null) {
            const fromCard = {
              id: mid != null ? `m-${mid}` : 'catalog-explicit',
              name: item?.material_name || '',
              texture: tex,
              icon: tex,
              material_id: mid,
              materialId: mid,
              material_type: ud.catalogMaterialKey || item?.material_key || 'material_2',
            };
            if (
              __applyStep5OutsideDecorToMesh(obj, fromCard, {
                textureLoader,
                decorRoot,
                getRootBboxForUv,
                isFacadeEdgeStrip,
              })
            ) {
              facadeCount++;
            }
          }
        }
        return;
      }
    }

    const isPlaceholder = obj.name === 'PlaceholderFromSize' || obj.name === 'Placeholder';
    // Шаг 5: куда кладётся выбор с колеса — задаётся кнопками «снаружи/внутри» (window.step5DecorTarget),
    // оба кольца SVG — только разные палитры (см. color-wheel.js applyToActiveTarget).
    // Применение: selection.outside > меши isFacade (+ планки секции); selection.inside > корпус isBody / детали.
    // Планки/накладки/топы секции: тот же канал outside, что и фасады.
    const isSectionTrimPlank =
      ud.sectionTrimUsesOutsideDecor === true &&
      (ud.isTopPlank ||
        ud.isBottomPlank ||
        ud.isSidePlank ||
        ud.isSideOverlay ||
        ud.isSectionFacadeTrim);
    const usesOutsideDecor =
      (ud.isFacade === true ||
        isFacadeEdgeStrip(obj) ||
        ud.sectionTrimUsesOutsideDecor === true ||
        ud.step5DecorChannel === 'outside' ||
        ud.cldFacadeMaterialGroup === true) &&
      ud.cldSkipStep5FacadeDecor !== true;
    const usesInsideDecor =
      !templateMat &&
      effectiveInside &&
      ud.step5DecorChannel !== 'outside' &&
      ud.cldFacadeMaterialGroup !== true &&
      (ud.isBody === true ||
        ud.step5DecorChannel === 'inside' ||
        isCorpusBodyEdgeStrip(obj) ||
        isPlaceholder ||
        (ud.isDetail && isInsideFurniture(obj) && !usesOutsideDecor));

    if (usesOutsideDecor && effectiveOutside && !isSectionTrimPlank) {
      facadeCount++;
      __applyStep5OutsideDecorToMesh(obj, effectiveOutside, {
        textureLoader,
        decorRoot,
        getRootBboxForUv,
        isFacadeEdgeStrip,
      });
    }
    if (usesInsideDecor) {
      // Декор только на _core; полоски — в syncCorpusEdgeMaterialsFromCoreMeshes после цикла.
      if (isCorpusBodyEdgeStrip(obj)) return;

      bodyCount++;
      const insideTex = getStep5DecorTextureUrl(effectiveInside);
      const insideHex = getStep5DecorHexFallback(effectiveInside);

      const inMid = effectiveInside.material_id ?? effectiveInside.materialId;
      if (inMid != null && inMid !== '') {
        const n = Number(inMid);
        if (Number.isFinite(n) && n > 0) {
          obj.userData.step5MaterialId = n;
          obj.userData.catalogMaterialId = n;
          obj.userData.catalogMaterialKey =
            effectiveInside.material_key ||
            effectiveInside.materialKey ||
            'material_2';
        }
      }
      const mat = obj.material;
      const mats = Array.isArray(mat) ? mat : [mat];
      const ikeaInside = mats.some((m) => m?.userData?.__cldIkeaV0);
      if (ikeaInside) {
        if (!insideTex && insideHex) {
          applyIkeaV0MeshDecorFromStep5ToMesh(obj, {
            colorHex: insideHex,
            roughness: 0.35,
            metalness: 0,
          });
        } else if (insideTex) {
          const insidePreview = getStep5DecorPreviewColor(effectiveInside);
          if (insidePreview) {
            applyIkeaV0MeshDecorFromStep5ToMesh(obj, {
              previewHex: insidePreview,
              roughness: 0.35,
              metalness: 0,
            });
          }
          if (furnitureRoot) {
            __ensureRootSpaceTextureUvForMesh(obj, furnitureRoot, getRootBboxForUv(furnitureRoot));
          }
          pendingInsideTextureLoads += 1;
          __loadDecorTexture(
            insideTex,
            (tex) => {
              const localTex = __prepareDecorTextureClone(tex, { edgeStrip: false, obj });
              applyIkeaV0MeshDecorFromStep5ToMesh(obj, {
                colorHex: '#ffffff',
                map: localTex,
                roughness: 0.35,
                metalness: 0,
              });
              pendingInsideTextureLoads -= 1;
              if (pendingInsideTextureLoads <= 0) {
                __scheduleCorpusEdgeSyncOnce();
              }
            }
          );
        }
      } else if (!insideTex && insideHex) {
        for (const m of mats) {
          if (!m) continue;
          m.map = null;
          m.color.set(insideHex);
          m.needsUpdate = true;
        }
      } else if (insideTex) {
        const insidePreview = getStep5DecorPreviewColor(effectiveInside);
        if (insidePreview) {
          for (const m of mats) {
            if (!m) continue;
            m.color.set(insidePreview);
            m.needsUpdate = true;
          }
        }
        if (insideTex) {
          if (furnitureRoot) {
            __ensureRootSpaceTextureUvForMesh(obj, furnitureRoot, getRootBboxForUv(furnitureRoot));
          }
          pendingInsideTextureLoads += 1;
          __loadDecorTexture(
            insideTex,
            (tex) => {
              const localTex = __prepareDecorTextureClone(tex, { edgeStrip: false, obj });
              for (const m of mats) {
                if (!m) continue;
                __assignMaterialMap(m, localTex);
                m.color.set(0xffffff);
                m.needsUpdate = true;
              }
              pendingInsideTextureLoads -= 1;
              if (pendingInsideTextureLoads <= 0) {
                __scheduleCorpusEdgeSyncOnce();
              }
            }
          );
        }
      }
    }
    });
  }

  const syncedEdges = syncCorpusEdgeMaterialsFromCoreMeshes(limitRoot || state.scene);
  if (syncedEdges > 0) {
    console.log('[STEP5] Кромка корпуса: material плиты на полосках:', syncedEdges);
  }

  console.log('[STEP5] Обновлено мешей: снаружи (фасад+планки/накладки)=', facadeCount, ', корпус=', bodyCount);

  try {
    if (limitRoot?.userData?.isFurniture) {
      refreshCabinetStudioAfterDecor(limitRoot);
    } else if (state.scene) {
      state.scene.traverse((o) => {
        if (o?.userData?.isFurniture) {
          try {
            refreshCabinetStudioAfterDecor(o);
          } catch (_) {}
        }
      });
    }
  } catch (_) {}

  if (placementPreview) {
    // После resize sync-функции заново создают торцевые trim-меши в sectionGroup.
    // Сразу возвращаем им сохранённые модульные декоры, не ожидая следующего клика.
    __reapplyOutsideDecorToSectionTrimMeshes(
      selection,
      textureLoader,
      getRootBboxForUv,
      limitRoot || state.scene
    );
    if (limitRoot?.userData?.isFurniture) {
      try {
        refreshCabinetStudioAfterDecor(limitRoot);
      } catch (_) {}
    }
    return;
  }

  if (facadeCount === 0 && bodyCount === 0) {
    const sample = [];
    state.scene.traverse((obj) => {
      if (obj.isMesh && sample.length < 10) {
        sample.push({ name: obj.name, userData: { ...obj.userData } });
      }
    });
    console.warn('[STEP5] Мешей с isFacade/isBody не найдено. Пример мешей в сцене:', sample);
  }

  // Пересчитываем цены мебели с учётом нового выбранного декора/материала.
  __recalcAllFurnitureLdspPricesWithCurrentMaterial();
  // Кромки обклада секции (как у фасадов: полоски, радиус, __cldButts)
  try {
    return Promise.resolve(
      refreshSectionTrimEdges(state.scene, { fallbackOutside: selection?.outside || null }),
    ).then(() => {
      const trimN = __reapplyOutsideDecorToSectionTrimMeshes(
        selection,
        textureLoader,
        getRootBboxForUv
      );
      if (trimN > 0) {
        console.log('[STEP5] Обклад: декор повторно после кромок:', trimN);
      }
      try {
        const sid = limitRoot?.userData?.sectionId;
        if (sid != null) applySectionTrimStudioLookForSectionId(sid);
        else syncAllSectionTrimStudio(state.scene);
      } catch (_) {}
      // Ч6.3 после prepareTrimMeshObkladVisual / resetTrimMeshPlain — иначе SidePlank снова fullH.
      try {
        if (typeof window.__clodisReapplyVerticalTrimHeights === 'function') {
          window.__clodisReapplyVerticalTrimHeights();
        }
      } catch (_) {}
      try {
        Promise.resolve(__recalcSectionFacadeTrimPricing()).then(() => __recalcRoomTotalPriceAndUpdateUi());
      } catch (_) {}
    });
  } catch (_) {
    try {
      Promise.resolve(__recalcSectionFacadeTrimPricing()).then(() => __recalcRoomTotalPriceAndUpdateUi());
    } catch (_) {}
    return Promise.resolve();
  }
}

export function refreshFurnitureDecors() {
  if (_refreshFurnitureDecorsTimer) clearTimeout(_refreshFurnitureDecorsTimer);
  _refreshFurnitureDecorsTimer = setTimeout(() => {
    _refreshFurnitureDecorsTimer = null;
    refreshFurnitureDecorsImmediate();
  }, 50);
}

export function applyStep5DecorToFurnitureGroupImmediate(group) {
  if (!group) return;
  refreshFurnitureDecorsImmediate({ root: group, placementPreview: true });
  // Лицевой цоколь-прогон: подтянуть цвет/текстуру корпуса после декора.
  try {
    const wall = String(group?.userData?.wallName || '').trim();
    const ov =
      typeof window !== 'undefined' ? window.__cldKitchenRunOverlays : null;
    if (wall && ov && typeof ov.syncKitchenRunOverlaysOnWall === 'function') {
      ov.syncKitchenRunOverlaysOnWall(wall);
    }
  } catch (_) {}
}

function __getStep5ConfigStep() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('room_steps_config') : null;
    if (!raw) return null;
    const cfg = JSON.parse(raw);
    const steps = cfg && Array.isArray(cfg.steps) ? cfg.steps : [];
    return steps.find((s) => s && s.stepId === 5) || null;
  } catch (_) {
    return null;
  }
}

function __mergeDecorWithWheelEntry(decor, wheelList) {
  if (!decor?.id || !Array.isArray(wheelList)) return decor;
  const full = wheelList.find((c) => c && String(c.id) === String(decor.id));
  if (!full) return decor;
  const texDecor = decor.texture && String(decor.texture).trim();
  const texFull = full.texture && String(full.texture).trim();
  const merged = {
    ...full,
    ...decor,
    texture: texDecor || texFull || '',
    name: decor.name || full.name,
    material_type: decor.material_type || decor.materialType || full.material_type || full.materialType || null,
    material_id:
      decor.material_id != null
        ? decor.material_id
        : decor.materialId != null
          ? decor.materialId
          : full.material_id != null
            ? full.material_id
            : full.materialId,
  };
  const ext = typeof window !== 'undefined' ? window.__cldStep5Edge : null;
  if (ext && typeof ext.decorateFromMaterialCard === 'function') {
    return ext.decorateFromMaterialCard(merged);
  }
  return merged;
}

const __ldspItemTextureCache = new Map();

async function __enrichStep5DecorWithLdspTexture(decor) {
  if (!decor) return decor;
  const ext = typeof window !== 'undefined' ? window.__cldStep5Edge : null;
  if (ext && typeof ext.decorateFromMaterialCard === 'function') {
    const fromCard = ext.decorateFromMaterialCard(decor);
    if (fromCard?.texture && String(fromCard.texture).trim()) return fromCard;
    decor = fromCard;
  }
  if (decor.texture && String(decor.texture).trim()) return decor;
  const mid = Number(decor.material_id ?? decor.materialId);
  if (!Number.isFinite(mid) || mid <= 0) return decor;
  if (__ldspItemTextureCache.has(mid)) {
    const cached = __ldspItemTextureCache.get(mid);
    return cached ? { ...decor, texture: cached } : decor;
  }
  try {
    const resp = await fetch(
      `/api/catalog/item/material_2/${encodeURIComponent(String(mid))}?t=${Date.now()}`,
      { cache: 'no-store' },
    );
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const item = await resp.json();
    const url = String(item?.texture || item?.icon || item?.image || '').trim();
    __ldspItemTextureCache.set(mid, url || null);
    if (url) {
      const enriched = { ...decor, texture: url };
      if (ext && typeof ext.decorateFromMaterialCard === 'function') {
        return ext.decorateFromMaterialCard(enriched);
      }
      return enriched;
    }
  } catch (e) {
    console.warn('[STEP5] Не удалось подтянуть текстуру ЛДСП для декора:', mid, e);
    __ldspItemTextureCache.set(mid, null);
  }
  return decor;
}

/** Подставить дефолты снаружи/внутри из room_steps_config (админка шага 5). */
function __applyStep5DefaultsFromRoomConfig(options = {}) {
  const onlyMissing = options.onlyMissing !== false;
  if (typeof window === 'undefined' || typeof window.setStep5DecorSelection !== 'function') return;

  const step5 = __getStep5ConfigStep();
  if (!step5) return;

  const outerWheel = Array.isArray(step5.step5WheelOuter) ? step5.step5WheelOuter : [];
  const innerWheel = Array.isArray(step5.step5WheelInner) ? step5.step5WheelInner : [];
  const allWheel = outerWheel.concat(innerWheel);
  const sel0 =
    typeof window.getStep5DecorSelection === 'function'
      ? window.getStep5DecorSelection()
      : { outside: null, inside: null };

  if (!onlyMissing || !sel0.outside) {
    const outside = __mergeDecorWithWheelEntry(
      __resolveStep5DefaultDecorFromConfig(step5, 'outside'),
      allWheel,
    );
    if (outside) window.setStep5DecorSelection('outside', outside);
  }
  if (!onlyMissing || !sel0.inside) {
    const inside = __mergeDecorWithWheelEntry(
      __resolveStep5DefaultDecorFromConfig(step5, 'inside'),
      allWheel,
    );
    if (inside) window.setStep5DecorSelection('inside', inside);
  }
}

async function __applyStep5DefaultsFromRoomConfigAsync() {
  if (typeof window === 'undefined' || typeof window.setStep5DecorSelection !== 'function') return;
  const sel = typeof window.getStep5DecorSelection === 'function'
    ? window.getStep5DecorSelection()
    : { outside: null, inside: null };
  let outside = sel.outside;
  let inside = sel.inside;
  outside = await __enrichStep5DecorWithLdspTexture(outside);
  inside = await __enrichStep5DecorWithLdspTexture(inside);
  if (outside) window.setStep5DecorSelection('outside', outside);
  if (inside) window.setStep5DecorSelection('inside', inside);
}

function __resolveStep5DefaultDecorFromConfig(step5, ring) {
  if (!step5) return null;
  const def = step5.step5Defaults || {};
  const outer = Array.isArray(step5.step5WheelOuter) ? step5.step5WheelOuter : [];
  const inner = Array.isArray(step5.step5WheelInner) ? step5.step5WheelInner : [];
  const all = outer.concat(inner);
  const pick = (id, wheel) => {
    if (!id) return null;
    const sid = String(id);
    const w = Array.isArray(wheel) ? wheel : [];
    let found = w.find((c) => c && String(c.id) === sid) || all.find((c) => c && String(c.id) === sid);
    if (!found) {
      const m = sid.match(/^m-(\d+)$/);
      if (m) {
        const mid = Number(m[1]);
        found = all.find(
          (c) => c && Number(c.material_id ?? c.materialId) === mid,
        );
      }
    }
    return found && isStep5DecorUsable(found) ? found : null;
  };
  const norm = (s) => String(s || '').trim().toLowerCase();
  const heuristic = (wheel) => {
    const list = Array.isArray(wheel) ? wheel : all;
    const facadeWhite = list.find(
      (c) => isStep5DecorUsable(c) && norm(c.name).includes('белый') && norm(c.name).includes('фасад'),
    );
    const anyWhite = list.find((c) => isStep5DecorUsable(c) && norm(c.name).includes('белый'));
    const anyVisual = list.find((c) => isStep5DecorUsable(c));
    return facadeWhite || anyWhite || anyVisual || null;
  };

  if (ring === 'outside') {
    return (
      pick(def.outsideId, all) ||
      pick(def.defaultId, all) ||
      heuristic(all)
    );
  }
  return (
    pick(def.insideId, all) ||
    pick(def.defaultId, all) ||
    heuristic(all)
  );
}

function __ensureStep5DecorSelectionInitializedFromConfig() {
  __applyStep5DefaultsFromRoomConfig({ onlyMissing: true });
}

/** Дефолты «снаружи/внутри» из админки > localStorage (+ опционально текстуры на сцене). */
export function initStep5DefaultDecorsFromRoomConfig(options = {}) {
  const force = options.force === true;
  const doRefresh = options.refresh === true || (force && options.refresh !== false);
  __applyStep5DefaultsFromRoomConfig({ onlyMissing: !force });
  if (doRefresh) {
    refreshFurnitureDecors();
    __applyStep5DefaultsFromRoomConfigAsync()
      .then(() => refreshFurnitureDecors())
      .catch((e) => console.warn('[STEP5] async default decor enrich:', e));
  } else {
    __applyStep5DefaultsFromRoomConfigAsync().catch((e) =>
      console.warn('[STEP5] async default decor enrich:', e)
    );
  }
}

/**
 * Place pending furniture at ghost position
 * This is a large function that handles all furniture placement logic
 */
export function placePendingFurniture() {
  void placePendingFurnitureAsync();
}

/** mm size equality for ghost prebuild adopt (В±1 мм, как REBUILD-SKIP). */
function _sectionMmClose(a, b, eps = 1) {
  if (!a || !b) return false;
  const ax = Number(a.x) || 0;
  const ay = Number(a.y) || 0;
  const az = Number(a.z) || 0;
  const bx = Number(b.x) || 0;
  const by = Number(b.y) || 0;
  const bz = Number(b.z) || 0;
  if (ax < 1 || ay < 1 || az < 1 || bx < 1 || by < 1 || bz < 1) return false;
  return Math.abs(ax - bx) <= eps && Math.abs(ay - by) <= eps && Math.abs(az - bz) <= eps;
}

function _ghostClodisSizeKey(sz) {
  if (!sz) return '';
  return `${Math.round(Number(sz.x) || 0)}_${Math.round(Number(sz.y) || 0)}_${Math.round(Number(sz.z) || 0)}`;
}

let _ghostClodisBuildTimer = null;
let _ghostClodisBuildGen = 0;

function clearGhostClodisPrebuildTimer() {
  if (_ghostClodisBuildTimer != null) {
    clearTimeout(_ghostClodisBuildTimer);
    _ghostClodisBuildTimer = null;
  }
}

/**
 * Снять готовый Clodis с призрака до removeFurnitureGhost (иначе dispose).
 * @returns {THREE.Object3D|null}
 */
function detachGhostClodisPrebuildForPlace() {
  clearGhostClodisPrebuildTimer();
  _ghostClodisBuildGen += 1;
  const ghost = state.furnitureGhost;
  const g = ghost?.userData?.__clodisPrebuiltGroup;
  if (!g) return null;
  if (g.parent) g.parent.remove(g);
  try {
    delete ghost.userData.__clodisPrebuiltGroup;
    delete ghost.userData.__clodisPrebuiltKey;
  } catch (_) {}
  return g;
}

/** Сброс prebuild при смене габарита короба — снова синий бокс до debounce-сборки. */
export function invalidateGhostClodisPrebuild() {
  clearGhostClodisPrebuildTimer();
  _ghostClodisBuildGen += 1;
  const ghost = state.furnitureGhost;
  if (!ghost) return;
  const old = ghost.userData?.__clodisPrebuiltGroup;
  if (old) {
    try {
      if (old.parent) old.parent.remove(old);
      __disposeObject3DTree(old);
    } catch (_) {}
    ghost.userData.__clodisPrebuiltGroup = null;
    ghost.userData.__clodisPrebuiltKey = null;
  }
  const box = ghost.getObjectByName('GhostBox');
  if (box) box.visible = true;
  const pivot = ghost.getObjectByName('PivotMarker');
  if (pivot) pivot.visible = true;
}

function _normGhostZoneIdx(z) {
  if (z == null || z === '') return null;
  const n = Number(z);
  return Number.isFinite(n) ? n : null;
}

/** Ключ секция+зона+размер — нельзя adopt’ить шкаф, собранный «по пути» в другой нише. */
function _ghostClodisContextKey(sectionSize, sectionId, zoneIdx) {
  return `${_ghostClodisSizeKey(sectionSize)}|${sectionId ?? 'none'}|${_normGhostZoneIdx(zoneIdx) ?? 'n'}`;
}

function _readGhostClodisContextFromState() {
  const ghost = state.furnitureGhost;
  if (!ghost) return null;
  const furnitureData = state.pendingFurnitureData;
  const sizeSrc =
    ghost.userData.currentSectionSize ||
    ghost.userData.zoneSize ||
    (furnitureData ? extractSectionSizeFromFurnitureData(furnitureData) : null);
  let sectionSize = {
    x: Math.max(0, Number(sizeSrc?.x) || 0),
    y: Math.max(0, Number(sizeSrc?.y) || 0),
    z: Math.max(0, Number(sizeSrc?.z) || 0),
  };
  // Тумба/навес/kitchen_base: не раздувать шире каталога. Шкаф в нише — ширина зоны.
  if (furnitureData) {
    const pk = resolvePlacementKindFromFurnitureData(furnitureData);
    const rawPk = getRawPlacementKindFromFurnitureData(furnitureData);
    if (
      pk === PLACEMENT_KIND.STANDALONE_FLOOR ||
      isWallHungPlacementKind(pk) ||
      isKitchenBasePlacementKind(rawPk) ||
      isKitchenTallPlacementKind(rawPk)
    ) {
      const cat = extractSectionSizeFromFurnitureData(furnitureData);
      const cx = Number(cat?.x) || 0;
      const cz = Number(cat?.z) || 0;
      if (cx > 0 && sectionSize.x > cx) {
        sectionSize = { ...sectionSize, x: cx };
      }
      if (
        (isKitchenBasePlacementKind(rawPk) || isKitchenTallPlacementKind(rawPk)) &&
        cz > 0
      ) {
        sectionSize = { ...sectionSize, z: cz };
      }
    }
  }
  const section =
    typeof findSectionAtPosition === 'function'
      ? findSectionAtPosition(ghost.position.clone())
      : null;
  if ((state.customSections || []).length > 0 && !section) {
    return { sectionSize, section: null, sectionId: null, zoneIdx: null, key: null, allowed: false };
  }
  const zoneIdx =
    state._pendingZoneInfo &&
    section &&
    String(state._pendingZoneInfo.sectionId) === String(section.id)
      ? state._pendingZoneInfo.zoneIndex
      : null;
  const sectionId = section?.id ?? null;
  return {
    sectionSize,
    section,
    sectionId,
    zoneIdx,
    key: _ghostClodisContextKey(sectionSize, sectionId, zoneIdx),
    allowed: sectionSize.x >= 1 && sectionSize.y >= 1 && sectionSize.z >= 1,
  };
}

/**
 * При движении призрака: если секция/зона сменились при том же размере —
 * сбросить prebuild (иначе place adopt’ит чужой шкаф).
 */
export function syncGhostClodisPrebuildContext() {
  if (!state.isPlacingFurniture || !state.furnitureGhost || !state.pendingFurnitureData) return;
  const fd = state.pendingFurnitureData;
  if (fd.type === 'glb' || fd.type === 'savedModel') return;

  const ctx = _readGhostClodisContextFromState();
  if (!ctx) return;

  if (!ctx.allowed || ctx.key == null) {
    if (state.furnitureGhost.userData.__clodisPrebuiltGroup) {
      invalidateGhostClodisPrebuild();
    }
    return;
  }

  const curKey = state.furnitureGhost.userData.__clodisPrebuiltKey;
  if (curKey && curKey !== ctx.key) {
    invalidateGhostClodisPrebuild();
    scheduleGhostClodisPrebuild({ force: true });
    return;
  }
  if (!state.furnitureGhost.userData.__clodisPrebuiltGroup) {
    // Не сбрасывать уже тикающий debounce на каждый mousemove — иначе prebuild никогда не готов.
    scheduleGhostClodisPrebuild({ force: false });
  }
}

/**
 * После создания/ресайза призрака: собрать полный Clodis (debounce), чтобы клик = snap.
 * @param {{ force?: boolean }} [opts] force=true — перезапустить таймер (смена секции/зоны/размера).
 */
export function scheduleGhostClodisPrebuild(_opts = {}) {
  // Выключено: PLACE-ADOPT после ghost-сборки давал щели (см. 1.44 перед скоростью).
  return;
}

function buildGhostClodisPrebuildNow() {
  const furnitureData = state.pendingFurnitureData;
  const ghost = state.furnitureGhost;
  if (!furnitureData || !ghost || !state.isPlacingFurniture) return;

  const ctx = _readGhostClodisContextFromState();
  if (!ctx || !ctx.allowed || ctx.key == null) return;

  const { sectionSize, section, sectionId, zoneIdx, key } = ctx;
  if (
    ghost.userData.__clodisPrebuiltKey === key &&
    ghost.userData.__clodisPrebuiltGroup
  ) {
    return;
  }

  // Курсор уже ушёл в другой контекст за время debounce.
  const live = _readGhostClodisContextFromState();
  if (!live || live.key !== key) return;

  const clodisData = getClodisDataForBuild(furnitureData);
  if (!clodisData || (Array.isArray(clodisData) && clodisData.length === 0)) return;
  try {
    prefetchFillCatalogsForClodisPlan(clodisData);
  } catch (_) {}

  const old = ghost.userData.__clodisPrebuiltGroup;
  if (old) {
    try {
      if (old.parent) old.parent.remove(old);
      __disposeObject3DTree(old);
    } catch (_) {}
    ghost.userData.__clodisPrebuiltGroup = null;
  }

  const placementKind = resolvePlacementKindFromFurnitureData(furnitureData);
  const group = new THREE.Group();
  group.name = 'GhostClodisPrebuilt';
  const ud = group.userData;
  // НЕ isFurniture: иначе computeSectionLayout/updateFurnitureInSection тащат чужие зоны.
  ud.isFurniture = false;
  ud.isGhostClodisPrebuild = true;
  ud.__placementKind = placementKind;
  ud.__placementKindProfileId = getRawPlacementKindFromFurnitureData(furnitureData);
  ud.productKind = resolveProductKindForFurnitureData(furnitureData);
  ud.__ghostPrebuildSectionId = sectionId;
  ud.__ghostPrebuildZoneIndex = _normGhostZoneIdx(zoneIdx);
  if (zoneIdx != null) ud.zoneIndex = zoneIdx;
  if (section) {
    ud.sectionId = section.id;
    ud.wallName = section.wallName || ghost.userData.wall || 'back';
  }

  try {
    const rootsCanonical = Array.isArray(clodisData)
      ? JSON.parse(JSON.stringify(clodisData))
      : [JSON.parse(JSON.stringify(clodisData))];
    writeUserDataClodisRoots(ud, rootsCanonical);
    const dataOne = getDataForBuild(rootsCanonical) || rootsCanonical[0];
    if (dataOne) writeUserDataClodisData(ud, dataOne);
  } catch (e) {
    console.warn('[GHOST-CLODIS] stamp roots failed', e);
    return;
  }

  const moduleVars = extractModuleVariablesFromFurnitureData(furnitureData);
  const moduleVarsRoom =
    section &&
    !isLowFurniturePlacementKind(placementKind) &&
    !isWallHungPlacementKind(placementKind)
      ? mergeFloorNicheVariablesFromSection(section, moduleVars)
      : moduleVars;
  try {
    writeUserDataClodisVariables(ud, JSON.parse(JSON.stringify(moduleVarsRoom)));
  } catch (_) {
    writeUserDataClodisVariables(ud, { ...moduleVarsRoom });
  }

  const zoneDoorKind =
    section && zoneIdx != null
      ? getZoneDoorKind(section, zoneIdx)
      : resolveDoorKindFromFurnitureData(furnitureData) || 'single';
  if (zoneDoorKind) ud.doorKind = zoneDoorKind;

  const hinge =
    furnitureData?.hingeLayoutOverride ??
    furnitureData?.hingeLayoutId ??
    furnitureData?.catalogItem?.hingeLayoutId ??
    furnitureData?.catalogItem?.data?.hingeLayoutId;
  if (hinge != null) ud.hingeLayoutOverride = hinge;

  ud.unifiedFacadeFromCatalog = extractUnifiedFacadeFromCatalogItem(furnitureData?.catalogItem);
  ud.pairedHandCatalogItemIds = readPairedHandCatalogIdsFromItem(furnitureData?.catalogItem);

  let builtOk = false;
  if (section) {
    builtOk = rebuildFurnitureGroupForSectionResize(group, section, sectionSize, {
      force: true,
      syncLight: false,
    });
  } else {
    // Без обклада: прямой Furniture на каталожный размер.
    try {
      const FurnitureCtor =
        typeof Furniture !== 'undefined'
          ? Furniture
          : typeof window !== 'undefined'
            ? window.Furniture
            : null;
      if (typeof FurnitureCtor !== 'function') return;
      const roots = readUserDataClodisRoots(ud) || readUserDataClodisData(ud);
      const swingCtx =
        section && zoneIdx != null ? swingHandCtxForPlacement(section, zoneIdx) : {};
      const { opts: doorOpts, needsPatch } = buildRoomDoorPrepareOpts(furnitureData, {
        zoneIndex: zoneIdx,
        division: section?.division,
        doorKind: zoneDoorKind,
        catalogItem: furnitureData?.catalogItem,
        clodisRoots: roots,
        placementKind,
        productKind: ud.productKind,
        sectionNeighbors: section ? collectSectionSwingSingleNeighborZones(section.id) : [],
        ...swingCtx,
      });
      let clodisForBuild = needsPatch ? prepareClodisForRoomBuild(roots, doorOpts) : roots;
      const dataForBuild = getDataForBuild(clodisForBuild) || clodisForBuild;
      const corpusWallThicknessMm =
        Number(moduleVarsRoom?._wt) > 0 ? Number(moduleVarsRoom._wt) : 16;
      const step5Selection =
        typeof window !== 'undefined' && typeof window.getStep5DecorSelection === 'function'
          ? window.getStep5DecorSelection()
          : { outside: null, inside: null };
      const built = new FurnitureCtor(dataForBuild, {
        sectionSize,
        wallThicknessMm: corpusWallThicknessMm,
        variables: {
          vysota_cokolya: 100,
          glubina_cokolya: 100,
          otstup_paza: 0,
          ...moduleVarsRoom,
        },
        groups: {
          g0: { thickness: corpusWallThicknessMm },
          g1: { thickness: 3 },
          g2: { thickness: 18 },
          g3: { thickness: 16 },
          hdf1: { thickness: 3 },
        },
        useLegacySetupPivot: true,
        decorOutside: step5Selection.outside,
        decorInside: step5Selection.inside,
        placementKind,
        doorLayout: doorOpts.doorLayout || undefined,
        zoneHand: doorOpts.zoneHand || undefined,
        doorKind: doorOpts.doorKind || undefined,
        unifiedFacade: doorOpts.unifiedFacade || undefined,
        hingeLayoutOverride: ud.hingeLayoutOverride,
        productKind: ud.productKind,
      });
      if (!built?.group) return;
      const toAdd = [...built.group.children];
      for (const ch of toAdd) {
        built.group.remove(ch);
        group.add(ch);
      }
      __disposeObject3DTree(built.group);
      ud.__initialSectionSizeMm = { ...sectionSize };
      if (doorOpts.zoneHand) ud.zoneHand = doorOpts.zoneHand;
      if (doorOpts.doorKind) ud.doorKind = doorOpts.doorKind;
      if (doorOpts.hasSwingDoor) ud.hasSwingDoor = true;
      ud.unifiedFacade = !!doorOpts.unifiedFacade;
      try {
        applyRoomCabinetStudioLook(group, {
          doorsOpen: typeof window !== 'undefined' && window.__cldRoomDoorsDesiredOpen === true,
          syncLight: false,
        });
        applyStep5DecorToFurnitureGroupImmediate(group);
        refreshCabinetStudioAfterDecor(group, { syncLight: false });
      } catch (_) {}
      builtOk = true;
    } catch (e) {
      console.warn('[GHOST-CLODIS] free-wall build failed', e);
      return;
    }
  }

  if (!builtOk || !group.children.length) {
    try {
      __disposeObject3DTree(group);
    } catch (_) {}
    return;
  }

  // Пока шла сборка, курсор мог уйти в другую секцию — не цепляем чужой шкаф.
  const after = _readGhostClodisContextFromState();
  if (!after || after.key !== key || !state.isPlacingFurniture || state.furnitureGhost !== ghost) {
    try {
      __disposeObject3DTree(group);
    } catch (_) {}
    return;
  }

  // Синий короб больше не нужен — показываем реальный шкаф.
  const box = ghost.getObjectByName('GhostBox');
  if (box) box.visible = false;
  const pivot = ghost.getObjectByName('PivotMarker');
  if (pivot) pivot.visible = false;

  group.position.set(0, 0, 0);
  group.rotation.set(0, 0, 0);
  group.scale.set(1, 1, 1);
  ghost.add(group);
  ghost.userData.__clodisPrebuiltGroup = group;
  ghost.userData.__clodisPrebuiltKey = key;
  ghost.visible = true;

  if (typeof window !== 'undefined' && window.__CLD_DEBUG_PLACE === true) {
    console.warn('[GHOST-CLODIS] ready', { key, meshes: group.children.length });
  }
}

if (typeof window !== 'undefined') {
  window.__cldScheduleGhostClodisPrebuild = scheduleGhostClodisPrebuild;
  window.__cldInvalidateGhostClodisPrebuild = invalidateGhostClodisPrebuild;
  window.__cldSyncGhostClodisPrebuildContext = syncGhostClodisPrebuildContext;
}

async function placePendingFurnitureAsync() {
  const __placeT0 = performance.now();
  const __placeMarks = [];
  const __placeMark = (label) => {
    __placeMarks.push({ label, ms: Math.round(performance.now() - __placeT0) });
  };
  const __placeDone = () => {
    const total = Math.round(performance.now() - __placeT0);
    const rows = [];
    for (let i = 0; i < __placeMarks.length; i++) {
      const cur = __placeMarks[i];
      const prev = i > 0 ? __placeMarks[i - 1].ms : 0;
      rows.push({ phase: cur.label, atMs: cur.ms, dtMs: cur.ms - prev });
    }
    console.log('[PLACE-TIME] total', total, 'ms', rows);
    if (typeof window !== 'undefined') {
      window.__cldLastPlaceTime = { totalMs: total, phases: rows };
    }
  };

  console.log('[ОТЛАДКА] ??? placePendingFurniture вызван! pos=', state.ghostPosition, 'wall=', state.ghostWall);
  console.log('State:', {
    pendingFurnitureData: !!state.pendingFurnitureData,
    ghostPosition: state.ghostPosition,
    ghostWall: state.ghostWall,
    furnitureGhost: !!state.furnitureGhost,
  });

  if (!state.pendingFurnitureData) {
    console.warn('Р? Нет данных для размещения мебели');
    return;
  }

  if (typeof window !== 'undefined' && window.__CLD_DEBUG_PLACE === true) {
    console.warn('[PLACE-ENTER]', {
      ghostZoneWidthMm: Math.round(Number(state.furnitureGhost?.userData?.zoneSize?.x) || 0),
      ghostWall: state.ghostWall || null,
      endCabPendingActive: !!getPendingEndCabinetPlacement(),
      endCabModuleMatch: isPendingEndCabinetModule(state.pendingFurnitureData),
    });
  }

  // Торцевой слот известен из диалога — посадка не зависит от привязки призрака к зоне.
  if (await tryPlaceIntoPendingEndCabinetSlot(state.pendingFurnitureData)) {
    if (typeof window !== 'undefined' && window.__CLD_DEBUG_PLACE === true) {
      console.warn('[PLACE-ENTER] ушло в торцевой слот');
    }
    return;
  }

  // НШ1-сосед: если ghostAllowed сбросил pivot — взять позицию короба призрака.
  if (
    (!state.ghostPosition || !state.ghostWall) &&
    state.furnitureGhost &&
    state.pendingFurnitureData &&
    isKitchenWallBandFurnitureData(state.pendingFurnitureData)
  ) {
    state.ghostPosition = state.furnitureGhost.position.clone();
    state.ghostWall =
      state.furnitureGhost.userData?.wall ||
      state._pendingZoneInfo?.wallName ||
      state.lastValidGhostWall ||
      null;
    state._ghostZonePlacementAllowed = true;
  }
  if (!state.ghostPosition || !state.ghostWall) {
    console.warn('[PLACE] Нет привязки к стене — размещение отменено');
    cancelFurniturePlacement();
    return;
  }

  // Check if wall is visible
  if (state.room && state.room.walls && state.room.walls[state.ghostWall]) {
    if (state.room.walls[state.ghostWall].visible === false) {
      console.warn('Р? Стена скрыта — размещение невозможно');
      cancelFurniturePlacement();
      return;
    }
  }

  // Сохраняем данные до removeFurnitureGhost — он обнуляет ghostPosition/ghostWall
  const rotationY = state.furnitureGhost ? state.furnitureGhost.userData.rotation || 0 : 0;
  const ghostZoneSize = state.furnitureGhost?.userData?.zoneSize || null;
  const position = state.ghostPosition.clone();
  const wall = state.ghostWall;
  const furnitureData = state.pendingFurnitureData;

  // Запоминаем зону, к которой был привязан призрак (если была),
  // до removeFurnitureGhost, т.к. он очищает состояние.
  const pendingZoneInfo = state._pendingZoneInfo || null;

  // -- Проверка совместимости: тип модуля vs тип зоны ------------------------
  // Угол (44/54): всегда, даже без doorKind на зоне.
  // single-double: только шкафы (floor_in_niche); kitchen mid/base не режем.
  if (pendingZoneInfo) {
    const baySec =
      Array.isArray(state.customSections) && pendingZoneInfo.sectionId != null
        ? state.customSections.find((s) => s && s.id === pendingZoneInfo.sectionId)
        : null;
    const pkGate = resolvePlacementKindFromFurnitureData(furnitureData);
    const isCornerCab = isLCornerCabinetModule(furnitureData);
    const rawPkGate = String(
      getRawPlacementKindFromFurnitureData(furnitureData) || ''
    )
      .trim()
      .toLowerCase();
    const wallBandGate =
      !isCornerCab && isKitchenWallBandFurnitureData(furnitureData);
    const isWallMidGate =
      wallBandGate &&
      (rawPkGate === 'kitchen_wall_mid' ||
        String(furnitureData?.__kitchenWallBand || '').toLowerCase() !==
          'top');
    const isWallTopGateEarly =
      wallBandGate &&
      (rawPkGate === 'kitchen_wall_top' ||
        String(furnitureData?.__kitchenWallBand || '').toLowerCase() ===
          'top');
    // Канон: seat A (mid.special host) — НШ1 уходит на соседа; seat B — никогда.
    if (wallBandGate && baySec && pendingZoneInfo.zoneIndex != null) {
      const ziHit = Math.floor(Number(pendingZoneInfo.zoneIndex));
      const seatBZiGate = Math.floor(
        Number(baySec.kitchenBandGrids?.mid?.cornerSeatZoneIndex)
      );
      const onSeatB =
        pendingZoneInfo.upperCornerSeat === 'B' ||
        pendingZoneInfo.upperCornerCompanion === true ||
        isKitchenUpperCornerSeatBZone(baySec, ziHit) ||
        hitAttractsUpperCornerSeatB(baySec, pendingZoneInfo.hitAlongMm) ||
        (Number.isFinite(seatBZiGate) &&
          seatBZiGate >= 0 &&
          ziHit === seatBZiGate);
      if (onSeatB) {
        // Вернуть zi на seat B, если ghost ошибочно увёл на соседа.
        if (
          Number.isFinite(seatBZiGate) &&
          seatBZiGate >= 0 &&
          ziHit !== seatBZiGate
        ) {
          pendingZoneInfo.zoneIndex = seatBZiGate;
          pendingZoneInfo.upperCornerSeat = 'B';
          pendingZoneInfo.doorKind = getZoneDoorKind(baySec, seatBZiGate);
          state._pendingZoneInfo = pendingZoneInfo;
        }
      } else {
        const midParts = Math.max(
          0,
          Math.floor(Number(baySec.kitchenBandGrids?.mid?.parts) || 0)
        );
        const midSp = Math.floor(
          Number(baySec.kitchenBandGrids?.mid?.specialZoneIndex)
        );
        const blocked =
          Number.isFinite(midSp) && midSp >= 0 && ziHit === midSp
            ? ziHit
            : null;
        if (blocked != null && midParts > 1) {
          const neighborZi =
            blocked <= 0
              ? 1
              : blocked >= midParts - 1
                ? blocked - 1
                : blocked - 1;
          if (
            neighborZi >= 0 &&
            neighborZi < midParts &&
            neighborZi !== blocked &&
            neighborZi !== midSp &&
            neighborZi !== seatBZiGate
          ) {
            pendingZoneInfo.zoneIndex = neighborZi;
            pendingZoneInfo.doorKind = getZoneDoorKind(baySec, neighborZi);
            state._pendingZoneInfo = pendingZoneInfo;
          }
        }
      }
    }
    const skipDoorGate =
      pkGate === PLACEMENT_KIND.STANDALONE_FLOOR ||
      isWallHungPlacementKind(pkGate) ||
      isWallMidGate ||
      isWallTopGateEarly ||
      wallBandGate;
    let onLSpecial =
      !!baySec && __isLShapeSpecialZone(baySec, pendingZoneInfo.zoneIndex);
    if (baySec && isCornerCab && rawPkGate === 'kitchen_wall_corner') {
      const midSp = Math.floor(
        Number(baySec.kitchenBandGrids?.mid?.specialZoneIndex)
      );
      const onMidSp =
        Number.isFinite(midSp) &&
        midSp >= 0 &&
        Number(pendingZoneInfo.zoneIndex) === midSp;
      onLSpecial = onLSpecial || onMidSp;
    }
    // НШ1-сосед: спец низа/MID никогда не блок.
    if (isWallMidGate || isWallTopGateEarly || wallBandGate) onLSpecial = false;
    __cldLogLCorner('placePendingFurniture/gate', {
      onLSpecial,
      isCornerCab,
      isWallMidGate,
      skipDoorGate,
      doorKind: pendingZoneInfo.doorKind ?? null,
    });
    const freeWallPlace =
      state.kitchenSectionsEnabled === false ||
      !(state.customSections || []).length;
    if (isCornerCab && !onLSpecial && !freeWallPlace) {
      __cldLogLCorner('BLOCK placePending not special');
      const msg =
        'Угловой модуль ставится только в угловую спец-секцию.';
      if (typeof window.showToast === 'function') {
        window.showToast(msg, 'warning');
      } else if (typeof window.toastr !== 'undefined') {
        window.toastr.warning(msg);
      } else {
        console.warn('[РАЗМЕЉЕНИЕ] ' + msg);
      }
      cancelFurniturePlacement();
      return;
    }
    if (isCornerCab && baySec?.lShape) {
      const tgt = resolveCornerCabinetPlaceTarget(
        baySec,
        pendingZoneInfo,
        furnitureData
      );
      if (tgt?.section && tgt.zoneIndex != null) {
        pendingZoneInfo.sectionId = tgt.section.id;
        pendingZoneInfo.zoneIndex = tgt.zoneIndex;
        pendingZoneInfo.wallName =
          tgt.section.wallName ||
          tgt.section.division?.wallName ||
          pendingZoneInfo.wallName;
        pendingZoneInfo.doorKind = 'double';
        state._pendingZoneInfo = pendingZoneInfo;
      }
      const zoneAt = getSectionLCornerZoneAtStart(
        tgt?.section || baySec,
        tgt?.zoneIndex ?? pendingZoneInfo.zoneIndex
      );
      const modAt = getCatalogItemCornerAtStart(furnitureData);
      if (zoneAt != null && modAt !== zoneAt) {
        __cldLogLCorner('BLOCK placePending wrong corner side', {
          zoneAt,
          modAt,
        });
        const msg = zoneAt
          ? 'В этот угол подходит только угловой левый модуль.'
          : 'В этот угол подходит только угловой правый модуль.';
        if (typeof window.showToast === 'function') {
          window.showToast(msg, 'warning');
        } else if (typeof window.toastr !== 'undefined') {
          window.toastr.warning(msg);
        } else {
          console.warn('[РАЗМЕЩЕНИЕ] ' + msg);
        }
        cancelFurniturePlacement();
        return;
      }
    }
    // Спец L/U низа: только НМУ/ВМУ. НШ1 — ячейка-сосед MID (не блок 1050).
    const isWallTopGate =
      isWallTopGateEarly ||
      (!isCornerCab &&
        (rawPkGate === 'kitchen_wall_top' ||
          isKitchenWallTopPlacementKind(rawPkGate)));
    if (
      onLSpecial &&
      !isCornerCab &&
      !isWallMidGate &&
      !isWallTopGate &&
      !wallBandGate
    ) {
      __cldLogLCorner('BLOCK non-corner on special', {
        skipDoorGate,
        pkGate,
      });
      const msg =
        'В угловую спец-зону ставится только угловой модуль (НМУ / Навесные угловые).';
      if (typeof window.showToast === 'function') {
        window.showToast(msg, 'warning');
      } else if (typeof window.toastr !== 'undefined') {
        window.toastr.warning(msg);
      } else {
        console.warn('[РАЗМЕЩЕНИЕ] ' + msg);
      }
      cancelFurniturePlacement();
      return;
    }
    if (pendingZoneInfo.doorKind) {
      const moduleDoorKind = inferModuleDoorKindFromCategories(furnitureData);
      const zoneDoorKind = pendingZoneInfo.doorKind;
      if (
        !skipDoorGate &&
        !isCornerCab &&
        moduleDoorKind &&
        moduleDoorKind !== zoneDoorKind
      ) {
        const canGesture = zonePlaceGesturePossible(
          baySec,
          pendingZoneInfo.zoneIndex,
          moduleDoorKind
        );
        if (!canGesture) {
          const zoneLabel = zoneDoorKind === 'single' ? 'одинарную' : 'двойную';
          const modLabel = moduleDoorKind === 'single' ? 'одинарный шкаф' : 'двойной шкаф';
          const msg = `Нельзя разместить ${modLabel} в ${zoneLabel} зону. Выберите подходящий модуль из каталога.`;
          if (typeof window.showToast === 'function') {
            window.showToast(msg, 'warning');
          } else if (typeof window.toastr !== 'undefined') {
            window.toastr.warning(msg);
          } else {
            console.warn('[РАЗМЕЩЕНИЕ] ' + msg);
          }
          cancelPlacementAndSwitchCatalogForZone(zoneDoorKind);
          return;
        }
      }
    }
  }

  // Как в «1.44 перед скоростью»: ghost Clodis prebuild/adopt НЕ используем.
  // Ускорение place оставляло корпус уже зоны > щель шкаф-шкаф и у планки.
  try {
    const deadPrebuild = detachGhostClodisPrebuildForPlace();
    if (deadPrebuild) __disposeObject3DTree(deadPrebuild);
  } catch (_) {}
  state._placeAdoptedClodis = null;

  // Высота standalone до снятия призрака.
  // У окна: первая = под подоконник; следующие тянутся — без модалки.
  // Вне окна: своя / как уже стоящие.
  let standalonePlacePreChoice = null;
  {
    let earlySection = null;
    if (pendingZoneInfo?.sectionId != null && Array.isArray(state.customSections)) {
      earlySection =
        state.customSections.find((s) => s && s.id === pendingZoneInfo.sectionId) || null;
    }
    if (!earlySection) {
      earlySection = findSectionAtPosition(position);
    }
    const earlyPk = resolvePlacementKindFromFurnitureData(furnitureData);
    if (earlySection && earlyPk === PLACEMENT_KIND.STANDALONE_FLOOR) {
      const earlyCatalogType = resolveCatalogTypeFromFurnitureData(furnitureData);
      if (isWindowAlongWallSection(earlySection)) {
        const existingH = getExistingStandaloneHeightInWindowAlongGroup(earlySection);
        const sillH = getWindowAlongGroupSillStandaloneHeightMm(earlySection);
        // Старый ряд sill?цоколь (~800 при sill 900) — не закрепляем, поднимаем к подоконнику.
        let h = 0;
        if (existingH > 0 && sillH > 0 && existingH < sillH - 5) {
          h = sillH;
        } else if (existingH > 0) {
          h = existingH;
        } else if (sillH > 0) {
          h = sillH;
        }
        if (h > 0) {
          standalonePlacePreChoice = {
            catalogType: earlyCatalogType,
            heightMm: h,
            fromAsk: false,
          };
        }
      } else {
        const ownHRaw = getCatalogOwnStandaloneHeightMm(furnitureData);
        const kitchenPlaceEarly = resolveKitchenPlaceHeightAndPlinth(furnitureData);
        const ownH = kitchenPlaceEarly ? kitchenPlaceEarly.totalHeightMm : ownHRaw;
        const existingH = getExistingStandaloneHeightInWindowAlongGroup(earlySection);
        // Нижний кухонный ряд: всегда своя высота (корпус+опоры), без модалки.
        if (kitchenPlaceEarly && ownH > 0) {
          standalonePlacePreChoice = {
            catalogType: earlyCatalogType,
            heightMm: ownH,
            fromAsk: false,
          };
        } else if (existingH > 0 && ownH > 0 && Math.abs(existingH - ownH) > 1) {
          let choice = 'own';
          try {
            choice = await askStandalonePlaceHeightChoice({
              ownHeightMm: ownH,
              neighborHeightMm: existingH,
            });
          } catch (_) {
            choice = 'own';
          }
          standalonePlacePreChoice = {
            catalogType: earlyCatalogType,
            heightMm: choice === 'neighbor' ? existingH : ownH,
            fromAsk: true,
          };
        }
      }
    }
  }

  // Remove ghost (обнуляет state.ghostPosition/ghostWall и _pendingZoneInfo)
  removeFurnitureGhost();

  // Reset state
  state.pendingFurnitureData = null;
  state.isPlacingFurniture = false;
  state.ghostWall = null;
  state.ghostPosition = null;
  state.lastValidGhostPosition = null;
  state.lastValidGhostWall = null;

  console.log('Creating furniture with position:', position, 'rotation:', rotationY);

  // Handle GLB files
  if (furnitureData.type === 'glb') {
    // TODO: Extract loadGLBFileForPlacement to glb-loader module
    if (typeof loadGLBFileForPlacement !== 'undefined') {
      loadGLBFileForPlacement(furnitureData.path, position, rotationY, wall);
    }
    return;
  }

  // Handle saved models
  if (furnitureData.type === 'savedModel') {
    console.log('Ц Размещение сохраненной модели');
    // TODO: Extract loadSavedModelForPlacement to glb-loader module
    try {
      const base64 = furnitureData.modelData.glb;
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes.buffer], { type: 'model/gltf-binary' });
      const newUrl = URL.createObjectURL(blob);
      
      if (furnitureData.url) {
        URL.revokeObjectURL(furnitureData.url);
      }
      
      if (typeof loadSavedModelForPlacement !== 'undefined') {
        loadSavedModelForPlacement(newUrl, furnitureData.modelData, position, rotationY, wall);
      }
      return;
    } catch (error) {
      console.error('? Ошибка размещения сохраненной модели:', error);
      alert('Ошибка размещения модели: ' + error.message);
      return;
    }
  }

  // Create furniture from Clodis JSON (как в legacy main.js)
  const clodisData = getClodisDataForBuild(furnitureData);
  if (!clodisData || clodisData.length === 0) {
    console.error('? Clodis JSON пуст для размещения мебели');
    return;
  }
  prefetchFillCatalogsForClodisPlan(clodisData);

  let sectionSize = extractSectionSizeFromFurnitureData(furnitureData);
  const defaultModuleSize = { ...sectionSize };
  
  // Секция: сначала зона призрака (на стыке bay-tall AABB врёт), иначе hit по AABB.
  let sectionAtPosition = null;
  if (pendingZoneInfo?.sectionId != null && Array.isArray(state.customSections)) {
    sectionAtPosition =
      state.customSections.find((s) => s && s.id === pendingZoneInfo.sectionId) || null;
  }
  if (!sectionAtPosition) {
    sectionAtPosition = findSectionAtPosition(position);
  }
  if ((state.customSections || []).length > 0 && !sectionAtPosition) {
    console.warn('Р? Шкаф можно ставить только в секцию обклада');
    cancelFurniturePlacement();
    return;
  }
  const topPlankMm = sectionAtPosition?.topPlankHeight ?? TOP_PLANK_HEIGHT_MM;
  const bottomPlankMmPlace =
    sectionAtPosition != null
      ? (() => {
          const b = Number(sectionAtPosition.bottomPlankHeightMm);
          return Number.isFinite(b) && b >= 0 ? b : DEFAULT_BOTTOM_PLANK_MM;
        })()
      : DEFAULT_BOTTOM_PLANK_MM;
  const placementKindForSection = resolvePlacementKindFromFurnitureData(furnitureData);
  // Bay / fixedHeight под окном: только низкая мебель (слот = sill).
  if (
    isUnderWindowBaySection(sectionAtPosition) &&
    !isLowFurniturePlacementKind(placementKindForSection)
  ) {
    console.warn('[PLACE] под окном только тумба/комод/нижний навес');
    cancelFurniturePlacement();
    return;
  }
  if (
    sectionAtPosition &&
    !isUnderWindowBaySection(sectionAtPosition) &&
    placementKindForSection !== PLACEMENT_KIND.STANDALONE_FLOOR
  ) {
    try {
      const restored = restoreSectionVerticalSizeForMixedWall(sectionAtPosition);
      if (restored) {
        console.info('[PLACE] секция возвращена на полную высоту для шкафа рядом с тумбой');
      }
    } catch (e) {
      console.warn('[PLACE] restoreSectionVerticalSizeForMixedWall', e);
    }
  }
  const nicheAlongOpts = (() => {
    if (!sectionAtPosition?.windowBridge || !position || !state.room?.group) return {};
    try {
      const roomWorld = new THREE.Vector3();
      state.room.group.getWorldPosition(roomWorld);
      const local = position.clone().sub(roomWorld);
      const wn = sectionAtPosition.wallName || wall;
      const alongMm = wn === 'left' || wn === 'right' ? local.z : local.x;
      return Number.isFinite(alongMm) ? { alongMm } : {};
    } catch (_) {
      return {};
    }
  })();
  const nicheSlotYmm = sectionAtPosition
    ? getNicheCabinetSlotHeightMm(sectionAtPosition, nicheAlongOpts)
    : null;
  let placementZoneIndex = null;
  let placementDivision = null;
  let placeSnap = null;
  if (sectionAtPosition) {
    // Раньше требовали ghostZoneSize || furnitureData.sectionSize — иначе ветка зоны не выполнялась,
    // срабатывала «полная секция» с чужим pivot и каталожной высотой (~2200 вместо слота ниши).
    if (sectionAtPosition.division) {
      const baseY = sectionAtPosition.size.y ?? sectionAtPosition.size.height;
      const wallNameForSize = sectionAtPosition.wallName || sectionAtPosition.division?.wallName || wall;
      const depthForZone =
        wallNameForSize === 'left' || wallNameForSize === 'right'
          ? sectionAtPosition.size.x
          : (sectionAtPosition.size.z ?? sectionAtPosition.size.depth);
      const fallbackSlotY = Math.max(0, baseY - topPlankMm - bottomPlankMmPlace);
      // Zone (double module): use zone size and keep position = zone pivot (already set by ghost)
      sectionSize = ghostZoneSize || furnitureData.sectionSize || {
        x: sectionAtPosition.division.partSize,
        y: nicheSlotYmm ?? fallbackSlotY,
        z: depthForZone
      };

      // Если при движении призрака мы уже знали точный zoneIndex, не пересчитываем его по координате,
      // чтобы избежать эффекта «попа»и на границу и ушли в соседнюю зонул.
      const division = sectionAtPosition.division;
      placementDivision = division;
      const wallName = sectionAtPosition.wallName || division?.wallName || wall;
      let snap = null;
      if (pendingZoneInfo && pendingZoneInfo.sectionId === sectionAtPosition.id) {
        const wForPivot = pendingZoneInfo.wallName || wallName;
        // НШ1/НШ2: snap из MID/TOP (не base 1050) — иначе zi соседа ВМУ
        // не находится в division.parts и place срывается.
        const stampBandPlace = String(furnitureData?.__kitchenWallBand || '')
          .trim()
          .toLowerCase();
        const rawPkBandPlace = String(
          getRawPlacementKindFromFurnitureData(furnitureData) || ''
        )
          .trim()
          .toLowerCase();
        const placeBandEarly =
          !isLCornerCabinetModule(furnitureData) &&
          (isKitchenWallBandFurnitureData(furnitureData) ||
            stampBandPlace === 'mid' ||
            stampBandPlace === 'top' ||
            rawPkBandPlace === 'kitchen_wall_mid' ||
            rawPkBandPlace === 'kitchen_wall_top')
            ? rawPkBandPlace === 'kitchen_wall_top' || stampBandPlace === 'top'
              ? 'top'
              : 'mid'
            : null;
        if (placeBandEarly) {
          try {
            const seatBEarly =
              placeBandEarly === 'mid'
                ? _resolvePendingUpperCornerSeatB(
                    sectionAtPosition,
                    furnitureData,
                    pendingZoneInfo,
                    wForPivot
                  )
                : null;
            if (seatBEarly) {
              snap = {
                pivotCoord: seatBEarly.pivotCoord,
                zoneIndex: seatBEarly.zoneIndex,
                moduleWidth: seatBEarly.moduleWidth,
                upperCornerSeat: 'B',
                upperCornerCellId: seatBEarly.upperCornerCellId,
                seatBStartU: seatBEarly.startU,
                seatBEndU: seatBEarly.endU,
                seatBSpannedZones: seatBEarly.spannedZoneIndexes.slice(),
                seatBAnchorEdge: seatBEarly.anchorEdge,
              };
            } else {
              const bandLayoutEarly = buildKitchenBandCellLayoutForSection(
                sectionAtPosition,
                placeBandEarly
              );
              const ziEarly = Math.floor(Number(pendingZoneInfo.zoneIndex));
              const segEarly = (bandLayoutEarly?.segments || []).find(
                (s) =>
                  s &&
                  s.type === 'module' &&
                  Number(s.zoneIndex) === ziEarly
              );
              if (segEarly) {
                const a = Math.min(
                  Number(segEarly.startU),
                  Number(segEarly.endU)
                );
                const b = Math.max(
                  Number(segEarly.startU),
                  Number(segEarly.endU)
                );
                const bandW = Math.round(b - a);
                if (bandW > 50) {
                  const pivotCoord =
                    wForPivot === 'left' || wForPivot === 'front' ? b : a;
                  snap = {
                    pivotCoord,
                    zoneIndex: ziEarly,
                    moduleWidth: bandW,
                  };
                }
              }
            }
          } catch (eEarlyBand) {
            console.warn('[ZONE-PLACE] early band snap', eEarlyBand);
          }
        }
        if (!snap) {
          const kitchenPlaceSnap = isKitchenNmPlacement(furnitureData);
          snap = kitchenPlaceSnap
            ? buildKitchenCellSnap(
                sectionAtPosition,
                pendingZoneInfo.zoneIndex,
                wForPivot
              )
            : buildZoneSnapForSection(
                sectionAtPosition,
                pendingZoneInfo.zoneIndex,
                wForPivot
              );
        }
      } else {
        // Fallback: старый путь через hitCoord
        const hitCoord = (wallName === 'front' || wallName === 'back') ? position.x : position.z;
        snap = snapToZoneDoubleModule(
          hitCoord,
          division,
          wallName,
          sectionAtPosition.id
        );
      }

      // В зоне — как в рабочей ThreeJS-25: ниша min(зона, каталог); тумба — ширина слота.
      // catalog_44 / спец L: всегда S+D, не Math.min с каталожной шириной двери (иначе куцый модуль не в углу).
      if (snap && snap.moduleWidth > 0) {
        const isCornerCabW = isLCornerCabinetModule(furnitureData);
        const onSp =
          isCornerCabW && __isLShapeSpecialZone(sectionAtPosition, snap.zoneIndex);
        if (onSp) {
          __cldEnsureKitchenLFlushToWall(sectionAtPosition);
          ensureLShapeDivisionSegments(sectionAtPosition.division);
          sectionAtPosition._layoutCache = null;
          // П: bounds по zi клика (правый = parts-1), не дефолт zi=0.
          const sp = getLShapeSpecialSnapBounds(
            sectionAtPosition.division,
            snap.zoneIndex
          );
          let wMm = sp?.moduleWidth > 0 ? sp.moduleWidth : snap.moduleWidth;
          // ???: ??????/???????? = 1050. ???: ???? ??????? ?????? = 600 (?? W ????).
          const kitchenCornerPlace =
            typeof isKitchenSectionLayoutActive === 'function' &&
            isKitchenSectionLayoutActive();
          const rawPkCornerW = String(
            getRawPlacementKindFromFurnitureData(furnitureData) || ''
          ).trim();
          const isWallCornerCab = rawPkCornerW === 'kitchen_wall_corner';
          if (!kitchenCornerPlace) {
            const endU = __cldCornerCabTargetEndU(sectionAtPosition);
            if (sp && endU > 0 && Number.isFinite(sp.zoneStart)) {
              const capped = Math.max(1, Math.round(endU - sp.zoneStart));
              if (capped < wMm) {
                __cldLogLCorner('place S+D capped to plank/section end', {
                  was: Math.round(wMm),
                  capped,
                  endU,
                  plank: __cldTopPlankMaxU(sectionAtPosition),
                  outer: __cldSectionOuterMaxU(sectionAtPosition),
                });
                wMm = capped;
              }
            }
          } else if (isWallCornerCab) {
            wMm = KITCHEN_WALL_CORNER_DEFAULT_WIDTH_MM;
          } else if (!(wMm >= 1045 && wMm <= 1055)) {
            const fixed = resolveKitchenCornerSpecialWidthMm();
            if (fixed > 0) wMm = fixed;
          }
          const cellW = Math.round(wMm);
          const projPlace = resolveKitchenCornerPlaceFromProject();
          const placeClearMm = isWallCornerCab
            ? 0
            : Math.max(0, Math.round(Number(projPlace.rearMm) || 10));
          sectionSize = { ...sectionSize, x: cellW };
          sectionSize.__kitchenCornerCellWidthMm = cellW;
          sectionSize.__kitchenSideWallClearanceMm = placeClearMm;
          sectionSize.__kitchenCornerReturnMm = isWallCornerCab
            ? Math.round(
                Number(extractSectionSizeFromFurnitureData(furnitureData)?.z) ||
                  350
              )
            : projPlace.carcassMm;
          const wForPivot = pendingZoneInfo?.wallName || wallName;
          if (sp) {
            const pivotCoord =
              wForPivot === 'left' || wForPivot === 'front'
                ? sp.zoneStart + cellW
                : sp.zoneStart;
            snap = {
              pivotCoord,
              zoneIndex: sp.zoneIndex,
              moduleWidth: cellW,
            };
            const worldPos = getZonePivotWorldPosition(
              sectionAtPosition,
              snap,
              wForPivot
            );
            if (worldPos) {
              position.x = worldPos.x;
              position.z = worldPos.z;
            }
          }
          __cldLogLCorner('place force S+D at special', {
            wMm: Math.round(wMm),
            pivotCoord: snap?.pivotCoord,
            zoneIndex: snap?.zoneIndex,
            S: sp?.S,
            D: sp?.D,
            kitchenCornerPlace,
            zEnd: sp?.zEnd ?? null,
          });
        } else {
          const catSz = extractSectionSizeFromFurnitureData(furnitureData);
          const cx = Number(catSz.x);
          const cz = Number(catSz.z);
          const rawPk = getRawPlacementKindFromFurnitureData(furnitureData);
          const kitchenNm =
            isKitchenBasePlacementKind(rawPk) ||
            isKitchenTallPlacementKind(rawPk) ||
            isKitchenWallMidPlacementKind(rawPk) ||
            isKitchenWallTopPlacementKind(rawPk);
          // kitchen_base / tall / wall_mid: ширина = ячейка; глубина — engine/каталог.
          // standalone_floor (тумба): ширина зоны.
          // шкаф в нише: min(зона, каталог).
          let wx;
          if (kitchenNm) {
            wx = snap.moduleWidth > 0 ? snap.moduleWidth : cx > 0 ? cx : snap.moduleWidth;
          } else if (placementKindForSection === PLACEMENT_KIND.STANDALONE_FLOOR) {
            wx = snap.moduleWidth;
          } else {
            wx = cx > 0 ? Math.min(snap.moduleWidth, cx) : snap.moduleWidth;
          }
          // MID / TOP: ширины из kitchenBandGrids.mid|top (прямая и L — сосед ВМУ = НШ1).
          const stampBand = String(
            furnitureData?.__kitchenWallBand || ''
          )
            .trim()
            .toLowerCase();
          const placeBandId = isKitchenWallTopPlacementKind(rawPk)
            ? 'top'
            : stampBand === 'top'
              ? 'top'
              : isKitchenWallMidPlacementKind(rawPk) ||
                  stampBand === 'mid' ||
                  isKitchenWallBandFurnitureData(furnitureData)
                ? 'mid'
                : null;
          if (placeBandId) {
            try {
              const bandLayout = buildKitchenBandCellLayoutForSection(
                sectionAtPosition,
                placeBandId
              );
              const ziBand = Math.floor(Number(snap.zoneIndex));
              const bandSeg = (bandLayout?.segments || []).find(
                (s) => s.type === 'module' && Number(s.zoneIndex) === ziBand
              );
              if (bandSeg) {
                const bandW = Math.round(
                  Number(bandSeg.endU) - Number(bandSeg.startU)
                );
                if (bandW > 50) {
                  wx = bandW;
                  const wForPivot = pendingZoneInfo?.wallName || wallName;
                  const pivotCoord =
                    wForPivot === 'left' || wForPivot === 'front'
                      ? bandSeg.endU
                      : bandSeg.startU;
                  snap = {
                    pivotCoord,
                    zoneIndex: ziBand,
                    moduleWidth: bandW,
                  };
                  const worldPos = getZonePivotWorldPosition(
                    sectionAtPosition,
                    snap,
                    wForPivot
                  );
                  if (worldPos) {
                    position.x = worldPos.x;
                    position.z = worldPos.z;
                  }
                }
              }
            } catch (eBandPlace) {
              console.warn(`[ZONE-PLACE] ${placeBandId} band width`, eBandPlace);
            }
          }
          sectionSize = { ...sectionSize, x: wx };
          // Глубина кухни (НМ/пенал/НШ) — НЕ из карточки каталога.
          // Иначе 510 из админки залипает до/вместо prepareKitchenPlace (project 460/510/550).
          // z задаёт engine: prepareKitchenPlace > carcassDepthMm проекта.
          // НШ1/НШ2: не тащить глубину секции низа (550–600) в sectionSize до engine.
          if (
            placeBandId &&
            (!(Number(sectionSize.z) > 0) || Number(sectionSize.z) > 450)
          ) {
            sectionSize = { ...sectionSize, z: 350 };
          }
        }
      }
      placeSnap = snap;
      const rawPkForNiche = getRawPlacementKindFromFurnitureData(furnitureData);
      // Пенал: высота из датамов (prepareKitchenPlace), не ниша шкафа.
      if (
        placementKindForSection === PLACEMENT_KIND.FLOOR_IN_NICHE &&
        !isKitchenTallPlacementKind(rawPkForNiche)
      ) {
        const syNiche = nicheSlotYmm ?? fallbackSlotY;
        if (syNiche > 0) sectionSize.y = syNiche;
        sectionSize.z = depthForZone;
      }

      if (snap) {
        placementZoneIndex =
          pendingZoneInfo && pendingZoneInfo.sectionId === sectionAtPosition.id
            ? pendingZoneInfo.zoneIndex
            : snap.zoneIndex;

        let appliedZoneGesture = null;

        // Жесты replace/split/merge (свободное плечо L / прямая). Спец угла и catalog_44 — без жестов.
        // kitchen_tall: не шкафные жесты ниши.
        if (
          placementKindForSection === PLACEMENT_KIND.FLOOR_IN_NICHE &&
          !isKitchenTallPlacementKind(rawPkForNiche) &&
          placementZoneIndex != null &&
          sectionAllowsZonePlaceGestures(sectionAtPosition) &&
          !isLCornerCabinetModule(furnitureData) &&
          !__isLShapeSpecialZone(sectionAtPosition, placementZoneIndex)
        ) {
          const moduleDoorKind = inferModuleDoorKindFromCategories(furnitureData);
          if (moduleDoorKind === 'single' || moduleDoorKind === 'double') {
            const wallForHit = pendingZoneInfo?.wallName || wallName;
            const hitAlongMm =
              Number.isFinite(Number(pendingZoneInfo?.hitAlongMm))
                ? Number(pendingZoneInfo.hitAlongMm)
                : wallForHit === 'front' || wallForHit === 'back'
                  ? position.x
                  : position.z;
            const gest = prepareZonePlaceGesture(
              sectionAtPosition,
              placementZoneIndex,
              moduleDoorKind,
              hitAlongMm
            );
            if (gest && gest.ok === false) {
              if (gest.reason === 'same-role-kitchen-column') {
                // Тост уже из prepareZonePlaceGesture.
                cancelFurniturePlacement();
                return;
              }
              const msg =
                gest.reason === 'merge-no-neighbor'
                  ? 'Рядом нет однодверной зоны для двухдверного модуля.'
                  : 'Нельзя изменить зоны под этот модуль.';
              if (typeof window.showToast === 'function') {
                window.showToast(msg, 'warning');
              } else {
                console.warn('[ZONE-GESTURE]', gest.reason, msg);
              }
              cancelFurniturePlacement();
              return;
            }
            if (gest && gest.ok) {
              appliedZoneGesture = gest;
              placementZoneIndex = gest.placeZoneIndex;
              snap = buildZoneSnapForSection(
                sectionAtPosition,
                placementZoneIndex,
                pendingZoneInfo?.wallName || wallName
              );
              placeSnap = snap;
              if (!snap) {
                console.warn('[ZONE-GESTURE] no snap after gesture', gest);
                return;
              }
              // После жеста ширина строго = слот (не ghost/каталог).
              if (snap.moduleWidth > 0) {
                sectionSize = {
                  ...sectionSize,
                  x: snap.moduleWidth,
                };
                try {
                  if (furnitureData && typeof furnitureData === 'object') {
                    furnitureData.sectionSize = {
                      ...(furnitureData.sectionSize || {}),
                      ...sectionSize,
                    };
                  }
                } catch (_) {}
              }
              // Страховка: двухдверный не оставляем в слоте < 800 мм.
              if (
                gest.gesture !== 'split' &&
                moduleDoorKind === 'double' &&
                Number(snap.moduleWidth) > 0 &&
                Number(snap.moduleWidth) < 800
              ) {
                const msg =
                  'Нельзя поставить двухдверный модуль в узкую зону. Нужна соседняя однодверная для объединения.';
                if (typeof window.showToast === 'function') {
                  window.showToast(msg, 'warning');
                } else {
                  console.warn('[ZONE-GESTURE] squeeze-guard', snap.moduleWidth);
                }
                return;
              }
              console.log('[ZONE-GESTURE] applied', {
                gesture: gest.gesture,
                placeZoneIndex: placementZoneIndex,
                moduleWidth: snap.moduleWidth,
                zoneDoorKind: gest.zoneDoorKind,
                sectionSizeX: sectionSize.x,
              });
            }
          }
        }

        // Anti-squeeze: только реальный двухдверный модуль (не sectionSize от призрака).
        {
          const mk = inferModuleDoorKindFromCategories(furnitureData);
          if (
            mk === 'double' &&
            appliedZoneGesture?.gesture !== 'split' &&
            snap &&
            Number(snap.moduleWidth) > 0 &&
            Number(snap.moduleWidth) < 800
          ) {
            const msg =
              'Нельзя поставить двухдверный модуль в узкую зону. Нужна соседняя однодверная для объединения.';
            if (typeof window.showToast === 'function') {
              window.showToast(msg, 'warning');
            } else {
              console.warn('[ZONE-GESTURE] squeeze-guard-final', snap.moduleWidth);
            }
            return;
          }
        }

        // Пробрасываем жест дальше по place (doorKind / ширина).
        state._appliedZonePlaceGesture = appliedZoneGesture;

        // Hang / тумба / кухня (в т.ч. пенал baseKind=floor_in_niche): снести
        // несовместимых (full / чужая группа), совместимую пару оставить.
        // Same-role kitchen_column (два mid / два base) — отказ, не replace.
        if (
          placementZoneIndex != null &&
          Number.isFinite(Number(placementZoneIndex)) &&
          (placementKindForSection !== PLACEMENT_KIND.FLOOR_IN_NICHE ||
            isKitchenTallPlacementKind(rawPkForNiche) ||
            isKitchenBasePlacementKind(rawPkForNiche) ||
            isKitchenWallMidPlacementKind(rawPkForNiche) ||
            isKitchenWallTopPlacementKind(rawPkForNiche))
        ) {
          const pendingCohabit = resolvePendingZoneCohabitSpec(furnitureData);
          const wallNameOcc = pendingZoneInfo?.wallName || wallName;
          const seatBPlace = _resolvePendingUpperCornerSeatB(
            sectionAtPosition,
            furnitureData,
            pendingZoneInfo,
            wallNameOcc
          );
          // Seat B НШ1 внутри upperCornerCell: W=catalog; замена только B (не A/ВМУ).
          if (seatBPlace) {
            snap = {
              pivotCoord: seatBPlace.pivotCoord,
              zoneIndex: seatBPlace.zoneIndex,
              moduleWidth: seatBPlace.moduleWidth,
              upperCornerSeat: 'B',
              upperCornerCellId: seatBPlace.upperCornerCellId,
              seatBStartU: seatBPlace.startU,
              seatBEndU: seatBPlace.endU,
              seatBSpannedZones: seatBPlace.spannedZoneIndexes.slice(),
              seatBAnchorEdge: seatBPlace.anchorEdge,
            };
            placeSnap = snap;
            placementZoneIndex = seatBPlace.zoneIndex;
            sectionSize = {
              ...sectionSize,
              x: seatBPlace.moduleWidth,
            };
            const prevSeatB = findUpperCornerSeatBByCellId(
              sectionAtPosition.id,
              seatBPlace.upperCornerCellId
            );
            if (prevSeatB) {
              removeFurnitureGroupQuietForGesture(prevSeatB);
            }
            const spanZis = seatBPlace.spannedZoneIndexes.length
              ? seatBPlace.spannedZoneIndexes.slice()
              : [seatBPlace.zoneIndex];
            for (const ziSpan of spanZis) {
              if (
                findSameRoleKitchenColumnOccupant(
                  sectionAtPosition.id,
                  ziSpan,
                  pendingCohabit
                )
              ) {
                toastKitchenSameRoleBlocked(pendingCohabit);
                cancelFurniturePlacement();
                return;
              }
              removeIncompatibleZoneOccupantsForPlace(
                sectionAtPosition.id,
                ziSpan,
                pendingCohabit
              );
            }
            try {
              state._pendingZoneInfo = {
                ...(pendingZoneInfo || {}),
                sectionId: sectionAtPosition.id,
                wallName: wallNameOcc,
                zoneIndex: seatBPlace.zoneIndex,
                upperCornerSeat: 'B',
                upperCornerCellId: seatBPlace.upperCornerCellId,
                seatBStartU: seatBPlace.startU,
                seatBEndU: seatBPlace.endU,
                seatBSpannedZones: spanZis,
                seatBAnchorEdge: seatBPlace.anchorEdge,
                seatBModuleWidth: seatBPlace.moduleWidth,
                seatBStartMm: seatBPlace.seatStartMm,
              };
            } catch (_) {}
          } else {
            // Навес mid на ВМУ host (special / seat A) → соседняя полная ячейка.
            // Seat B — ветка выше, не redirect.
            const wallBandPlace =
              !isLCornerCabinetModule(furnitureData) &&
              isKitchenWallBandFurnitureData(furnitureData);
            if (wallBandPlace) {
              const midSpOcc = Math.floor(
                Number(
                  sectionAtPosition.kitchenBandGrids?.mid?.specialZoneIndex
                )
              );
              const seatBOcc = Math.floor(
                Number(
                  sectionAtPosition.kitchenBandGrids?.mid?.cornerSeatZoneIndex
                )
              );
              const midPartsOcc = Math.max(
                0,
                Math.floor(
                  Number(sectionAtPosition.kitchenBandGrids?.mid?.parts) || 0
                )
              );
              const ziOcc = Math.floor(Number(placementZoneIndex));
              const onSeatB =
                Number.isFinite(seatBOcc) &&
                seatBOcc >= 0 &&
                ziOcc === seatBOcc;
              const onSpecial =
                Number.isFinite(midSpOcc) &&
                midSpOcc >= 0 &&
                ziOcc === midSpOcc;
              // Только host special → redirect. seat B уже обработан выше.
              const blockedOcc = onSpecial && !onSeatB ? ziOcc : null;
              if (blockedOcc != null && midPartsOcc > 1) {
                const neighborOcc =
                  blockedOcc <= 0
                    ? 1
                    : blockedOcc >= midPartsOcc - 1
                      ? blockedOcc - 1
                      : blockedOcc - 1;
                if (
                  neighborOcc >= 0 &&
                  neighborOcc < midPartsOcc &&
                  neighborOcc !== blockedOcc &&
                  neighborOcc !== midSpOcc &&
                  neighborOcc !== seatBOcc
                ) {
                  placementZoneIndex = neighborOcc;
                  try {
                    const bandLayoutOcc = buildKitchenBandCellLayoutForSection(
                      sectionAtPosition,
                      'mid'
                    );
                    const segOcc = (bandLayoutOcc?.segments || []).find(
                      (s) =>
                        s &&
                        s.type === 'module' &&
                        Number(s.zoneIndex) === neighborOcc
                    );
                    if (segOcc) {
                      const a = Math.min(
                        Number(segOcc.startU),
                        Number(segOcc.endU)
                      );
                      const b = Math.max(
                        Number(segOcc.startU),
                        Number(segOcc.endU)
                      );
                      const wOcc = Math.round(b - a);
                      const wForPivotOcc = wallNameOcc;
                      snap = {
                        pivotCoord:
                          wForPivotOcc === 'left' || wForPivotOcc === 'front'
                            ? b
                            : a,
                        zoneIndex: neighborOcc,
                        moduleWidth:
                          wOcc > 50 ? wOcc : snap?.moduleWidth || 600,
                      };
                      placeSnap = snap;
                      if (wOcc > 50) {
                        sectionSize = { ...sectionSize, x: wOcc };
                      }
                    }
                  } catch (_) {}
                }
              }
            }
            if (
              findSameRoleKitchenColumnOccupant(
                sectionAtPosition.id,
                placementZoneIndex,
                pendingCohabit
              )
            ) {
              toastKitchenSameRoleBlocked(pendingCohabit);
              cancelFurniturePlacement();
              return;
            }
            removeIncompatibleZoneOccupantsForPlace(
              sectionAtPosition.id,
              placementZoneIndex,
              pendingCohabit
            );
          }
        }

        position.copy(
          getZonePivotWorldPosition(
            sectionAtPosition,
            snap,
            pendingZoneInfo?.wallName || wallName
          )
        );

        // Карандаш зоны — только после add + hang Y + rebuildSectionZoneEditIconsForSection.
        // Ранний create здесь ставил иконку у пола (pivot), до подъёма wall_hung.
      } else {
        const sy = sectionAtPosition.size.y ?? sectionAtPosition.size.height;
        const fallbackY = Math.max(0, sy - topPlankMm - bottomPlankMmPlace);
        sectionSize = applyInnerSectionFurnitureSlot(
          sectionAtPosition,
          wallNameForSize,
          position,
          sectionSize,
          {
            nicheSlotYmm: nicheSlotYmm ?? fallbackY,
            fallbackSlotY: fallbackY,
            catalogSizeForClamp: extractSectionSizeFromFurnitureData(furnitureData),
            placementKind: placementKindForSection,
          }
        );
        if (typeof window !== 'undefined' && window.__CLD_DEBUG_PLACE === true) {
          console.log('Ц МЕБЕЛЬ РАЗМЕЩАЕТСЯ В СЕКЦИИ (внутр. ниша, без зоны)!', sectionAtPosition.name, {
            sectionSize,
          });
        }
      }
      if (snap) {
        if (typeof window !== 'undefined' && window.__CLD_DEBUG_PLACE === true) {
          console.log('Ц МЕБЕЛЬ РАЗМЕЩАЕТСЯ В ЗОНЕ (pivot-to-pivot)!', sectionAtPosition.name);
        }
      }
    } else {
      // Full section: высота слота = между нижней и верхней планками (как innerHeightMm)
      const sy = sectionAtPosition.size.y ?? sectionAtPosition.size.height;
      const wallNameForSize = sectionAtPosition.wallName || wall;
      const fallbackY = Math.max(0, sy - topPlankMm - bottomPlankMmPlace);
      const catalogSizeForClamp = extractSectionSizeFromFurnitureData(furnitureData);
      sectionSize = applyInnerSectionFurnitureSlot(
        sectionAtPosition,
        wallNameForSize,
        position,
        sectionSize,
        {
          nicheSlotYmm: nicheSlotYmm ?? fallbackY,
          fallbackSlotY: fallbackY,
          catalogSizeForClamp,
          placementKind: placementKindForSection,
        }
      );
      if (typeof window !== 'undefined' && window.__CLD_DEBUG_PLACE === true) {
        console.log('Ц МЕБЕЛЬ РАЗМЕЩАЕТСЯ В СЕКЦИИ!', sectionAtPosition.name, {
          sectionSize,
          catalogSize: catalogSizeForClamp,
        });
      }
    }
  }
  // else: sectionSize остаётся из extractSectionSizeFromFurnitureData

  const placementZoneIdx =
    placementZoneIndex ??
    (pendingZoneInfo && pendingZoneInfo.sectionId === sectionAtPosition?.id
      ? pendingZoneInfo.zoneIndex
      : null);

  if (typeof window !== 'undefined' && window.__CLD_DEBUG_PLACE === true) {
    console.warn('[PLACE-WIDTH]', {
      widthUsedMm: Math.round(Number(sectionSize?.x) || 0),
      zoneIndex: placementZoneIdx,
      ghostZoneWidthMm: Math.round(Number(ghostZoneSize?.x) || 0),
      catalogWidthMm: Math.round(Number(extractSectionSizeFromFurnitureData(furnitureData)?.x) || 0),
      sectionWidthMm: Math.round(
        Number(sectionAtPosition?.size?.x) || Number(sectionAtPosition?.size?.z) || 0
      ),
      divisionPartSizeMm: Math.round(Number(sectionAtPosition?.division?.partSize) || 0),
      hasDivision: !!sectionAtPosition?.division,
      endCabPendingActive: !!getPendingEndCabinetPlacement(),
      endCabModuleMatch: isPendingEndCabinetModule(furnitureData),
    });
  }
  const appliedGest = state._appliedZonePlaceGesture || null;
  state._appliedZonePlaceGesture = null;
  const isCornerCabPlace = isLCornerCabinetModule(furnitureData);
  // Угловой: не подменять фасады под zoneDoorKind=double спец-зоны — дерево уже S+заглушка.
  const zoneDoorKindForBuild = isCornerCabPlace
    ? resolveDoorKindFromFurnitureData(furnitureData) || 'single'
    : (appliedGest && appliedGest.zoneDoorKind) ||
      (sectionAtPosition && placementZoneIdx != null
        ? getZoneDoorKind(sectionAtPosition, placementZoneIdx)
        : null) ||
      resolveDoorKindFromFurnitureData(furnitureData) ||
      'single';
  if (appliedGest && placeSnap?.moduleWidth > 0 && sectionSize) {
    sectionSize = { ...sectionSize, x: placeSnap.moduleWidth };
  }
  console.log('[ZONE-PLACE] doorKind/width', {
    gesture: appliedGest?.gesture || null,
    zoneDoorKindForBuild,
    sectionSizeX: sectionSize?.x,
    snapW: placeSnap?.moduleWidth,
    placementZoneIdx,
    isCornerCabPlace,
  });
  const swingCtxPlace =
    sectionAtPosition && placementZoneIdx != null
      ? swingHandCtxForPlacement(sectionAtPosition, placementZoneIdx)
      : {};
  const { opts: doorOpts, needsPatch } = buildRoomDoorPrepareOpts(furnitureData, {
    zoneIndex: placementZoneIdx,
    division: placementDivision || sectionAtPosition?.division,
    doorKind: zoneDoorKindForBuild,
    catalogItem: furnitureData?.catalogItem,
    clodisRoots: clodisData,
    placementKind: placementKindForSection,
    productKind: resolveProductKindForFurnitureData(furnitureData),
    sectionNeighbors: sectionAtPosition
      ? collectSectionSwingSingleNeighborZones(sectionAtPosition.id)
      : [],
    ...swingCtxPlace,
  });
  let clodisForBuild = clodisData;
  if (
    !isCornerCabPlace &&
    (needsPatch || (appliedGest && appliedGest.zoneDoorKind))
  ) {
    clodisForBuild = prepareClodisForRoomBuild(clodisData, doorOpts);
  }

  if (sectionAtPosition) {
    const wallClamp = sectionAtPosition.wallName || wall;
    const innerSlotClamp = resolveSectionFurniturePlacement(sectionAtPosition, wallClamp);
    let maxSlotW = Number(innerSlotClamp?.innerWidthMm) || 0;
    const skipSpecialClamp =
      isCornerCabPlace &&
      placementZoneIndex != null &&
      __isLShapeSpecialZone(sectionAtPosition, placementZoneIndex);
    if (
      !skipSpecialClamp &&
      placementZoneIndex != null &&
      sectionAtPosition._layoutCache?.segments
    ) {
      const seg = sectionAtPosition._layoutCache.segments.find(
        (s) => s.type === 'module' && s.zoneIndex === placementZoneIndex
      );
      if (seg && Number.isFinite(seg.endU) && Number.isFinite(seg.startU)) {
        const zw = seg.endU - seg.startU;
        if (zw > 0) maxSlotW = maxSlotW > 0 ? Math.min(maxSlotW, zw) : zw;
      }
    }
    if (
      !skipSpecialClamp &&
      maxSlotW > 0 &&
      sectionSize &&
      Number(sectionSize.x) > maxSlotW
    ) {
      sectionSize = { ...sectionSize, x: maxSlotW };
      console.log('[ZONE-PLACE] clamp sectionSize.x to inner slot', { maxSlotW, zoneIndex: placementZoneIndex });
    }
  }

  let dataForBuild = getDataForBuild(clodisForBuild);
  if (!dataForBuild) {
    console.error('? Не удалось извлечь секцию для сборки из Clodis данных');
    return;
  }
  // Опоры/нормализацию дерева делает один prepareKitchenModuleForBuild ниже (не здесь).
  if (kitchenShouldSkipFloorNicheMerge(getRawPlacementKindFromFurnitureData(furnitureData))) {
    try {
      const catItem = furnitureData?.catalogItem || furnitureData;
      const ks = extractKitchenSupportsFromCatalogItem(catItem);
      if (ks) furnitureData.__kitchenSupports = ks;
    } catch (_) {}
  }
  const isConstructorClodisJson =
    clodisHasConstructorMarkers(dataForBuild) ||
    clodisHasConstructorMarkers(clodisData);
  // ВАЖНО: в комнате строим строго 1:1 из JSON (как в превью).
  // Любые runtime-сдвиги фасадов из шага 5 отключены полностью.
  const hasPlinthSection = __clodisHasPlinth(dataForBuild);
  const step5FacadeBottomOffsetMm = null;
  const enableStep5FacadeOffset = false;
  
  // В комнате точка привязки мебели должна быть back-left-bottom (bbox.min -> 0),
  // иначе шкаф будет "уезжать" от стены при размещении/повороте.
  // Поэтому для Clodis используем setupPivot, но избегаем legacy-скейла (см. ниже).
  const USE_LEGACY_SETUP_PIVOT = true;

  // Декоры шага 5: outside = фасад, inside = корпус (полная запись из круга + ЛДСП)
  __applyStep5DefaultsFromRoomConfig({ onlyMissing: true });
  const step5Selection = typeof window !== 'undefined' && window.getStep5DecorSelection
    ? window.getStep5DecorSelection()
    : { outside: null, inside: null };
  __preloadStep5DecorTexturesFromSelection(step5Selection);

  const moduleVarsMerged = extractModuleVariablesFromFurnitureData(furnitureData);
  const placementKind = placementKindForSection;
  const rawKitchenPk = getRawPlacementKindFromFurnitureData(furnitureData);
  // Антресоль над колонкой пенала: сразу D ячейки/пенала (до prepare/build).
  try {
    if (
      sectionAtPosition &&
      placementZoneIndex != null &&
      Number.isFinite(Number(placementZoneIndex)) &&
      isKitchenWallTopPlacementKind(rawKitchenPk) &&
      isKitchenTallColumnZone(sectionAtPosition, placementZoneIndex)
    ) {
      const probe = {
        userData: {
          zoneIndex: Math.floor(Number(placementZoneIndex)),
          productKind: 'kitchen_wall_top',
          __kitchenTopDepthMode: 'deep',
        },
      };
      const depthRes = resolveKitchenWallTopDepthMm(probe, sectionAtPosition);
      if (depthRes?.ok && Number(depthRes.carcassDepthMm) > 0) {
        const dz = Math.round(Number(depthRes.carcassDepthMm));
        sectionSize = { ...sectionSize, z: dz };
        furnitureData.customDepthMm = dz;
        if (!furnitureData.userData || typeof furnitureData.userData !== 'object') {
          furnitureData.userData = {};
        }
        furnitureData.userData.zoneIndex = Math.floor(Number(placementZoneIndex));
        furnitureData.userData.__kitchenTopDepthMode = 'deep';
        furnitureData.userData.__kitchenCarcassDepthMm = dz;
      }
    }
  } catch (eTopPre) {
    console.warn('[PLACE] TOP over tall depth pre-stamp', eTopPre);
  }
  const kitchenEnginePlace = kitchenShouldSkipFloorNicheMerge(rawKitchenPk)
    ? prepareKitchenPlace(furnitureData, moduleVarsMerged, sectionSize)
    : null;
  // Kitchen engine: никогда не mergeFloorNiche (планки шкафа).
  let moduleVarsForBuilder =
    kitchenEnginePlace && kitchenEnginePlace.ok
      ? kitchenEnginePlace.moduleVars
      : sectionAtPosition &&
          !isLowFurniturePlacementKind(placementKind) &&
          !isWallHungPlacementKind(placementKind) &&
          !kitchenShouldSkipFloorNicheMerge(rawKitchenPk)
        ? mergeFloorNicheVariablesFromSection(sectionAtPosition, moduleVarsMerged)
        : moduleVarsMerged;
  if (kitchenEnginePlace && kitchenEnginePlace.ok) {
    sectionSize.x = kitchenEnginePlace.sectionSize.x || sectionSize.x;
    sectionSize.y = kitchenEnginePlace.sectionSize.y;
    sectionSize.z = kitchenEnginePlace.sectionSize.z || sectionSize.z;
  }

  // Угловой НМУ: контекст для единого prepare (не отдельный повар). Соседа не угадывать.
  let __kitchenCornerSideAtMinU = null;
  let __kitchenCornerPrepareCtx = null;
  try {
    const ziCorner =
      placementZoneIndex != null
        ? placementZoneIndex
        : placeSnap?.zoneIndex != null
          ? placeSnap.zoneIndex
          : null;
    const pkCornerSp = String(rawKitchenPk || '').trim();
    const onCornerSp =
      kitchenEnginePlace?.ok &&
      sectionAtPosition &&
      isLCornerCabinetModule(furnitureData) &&
      (pkCornerSp === 'kitchen_base_corner' ||
        pkCornerSp === 'kitchen_wall_corner') &&
      ziCorner != null &&
      __isLShapeSpecialZone(sectionAtPosition, ziCorner);
    if (onCornerSp) {
      // Сторона приставки: зона (П: zi=0 лев / zi=end прав) > meta L > hand > typeKey.
      // Без зоны на П typeKey пуст > atStart=false и левый НМУ строится как правый.
      let atStart = false;
      let typeKey = sectionAtPosition.division?.typeKey || null;
      const zoneAt = getSectionLCornerZoneAtStart(sectionAtPosition, ziCorner);
      if (zoneAt != null) {
        atStart = zoneAt;
      } else {
        try {
          const meta = getLShapeMeta(sectionAtPosition);
          if (meta) {
            if (meta.typeKey) typeKey = meta.typeKey;
            if (typeof meta.cornerAtStart === 'boolean') atStart = meta.cornerAtStart;
          }
        } catch (_) {}
        if (typeof sectionAtPosition?.lShape?.cornerAtStart === 'boolean') {
          atStart = sectionAtPosition.lShape.cornerAtStart;
        } else if (sectionAtPosition?.lShape?.hand === 'left') {
          atStart = true;
        } else if (sectionAtPosition?.lShape?.hand === 'right') {
          atStart = false;
        } else {
          const cfg = typeKey && L_CORNER_CONFIG ? L_CORNER_CONFIG[typeKey] : null;
          if (cfg && typeof cfg.cornerAtStart === 'boolean') atStart = cfg.cornerAtStart;
        }
      }
      __kitchenCornerSideAtMinU = atStart;
      const isWallCornerCtx = pkCornerSp === 'kitchen_wall_corner';
      const cellW = isWallCornerCtx
        ? Math.round(
            Number(sectionSize?.__kitchenCornerCellWidthMm) ||
              Number(sectionSize?.x) ||
              KITCHEN_WALL_CORNER_DEFAULT_WIDTH_MM
          )
        : Math.round(
            Number(sectionSize?.__kitchenCornerCellWidthMm) ||
              Number(sectionSize?.x) +
                Number(sectionSize?.__kitchenSideWallClearanceMm || 10) ||
              resolveKitchenCornerSpecialWidthMm()
          );
      const projPlace = resolveKitchenCornerPlaceFromProject();
      // ??? 1.42: return = project D; clear = rear. ???: clear=0, return = D ????????.
      const placeClear = isWallCornerCtx
        ? 0
        : Math.max(
            0,
            Math.round(
              Number(sectionSize?.__kitchenSideWallClearanceMm) ||
                Number(projPlace.rearMm) ||
                10
            )
          );
      const placeReturn = isWallCornerCtx
        ? Math.round(
            Number(sectionSize?.__kitchenCornerReturnMm) ||
              Number(sectionSize?.z) ||
              350
          )
        : Math.round(
            Number(sectionSize?.__kitchenCornerReturnMm) ||
              Number(projPlace.carcassMm) ||
              0
          );
      __kitchenCornerPrepareCtx = {
        widthMm: cellW,
        returnMm: placeReturn,
        clearMm: placeClear,
        wallGapMm: placeClear,
        atStart,
      };
      console.warn('[PLACE] corner ctx from project D (1.42)', {
        cellW,
        atStart,
        sectionZ: sectionSize.z,
        placeReturn,
        placeClear,
        projectRear: projPlace.rearMm,
      });
    }
  } catch (_) {}

  if (typeof window !== 'undefined' && window.__CLD_DEBUG_PLACE === true) {
    console.log('[PLACEMENT-DEBUG]', {
      name: furnitureData?.catalogItem?.name || furnitureData?.name,
      placementKind,
      'sectionSize.y': sectionSize.y,
      'defaultModuleSize.y': defaultModuleSize.y,
      'furnitureData.placementKind': furnitureData?.placementKind,
      'catalogItem.placementKind': furnitureData?.catalogItem?.placementKind,
      'catalogItem.height': furnitureData?.catalogItem?.height,
      'catalogItem.clodisVariables': furnitureData?.catalogItem?.clodisVariables,
    });
  }

  // Standalone у окна: 1-й = под подоконник; следующие = высота ряда.
  // Вне окна: каталог vs уже стоящие (модалка).
  let standalonePlaceCatalogType = null;
  let standalonePlaceHeightMm = 0;
  if (sectionAtPosition && placementKind === PLACEMENT_KIND.STANDALONE_FLOOR) {
    standalonePlaceCatalogType =
      (standalonePlacePreChoice && standalonePlacePreChoice.catalogType) ||
      resolveCatalogTypeFromFurnitureData(furnitureData);
    const ownHRaw = getCatalogOwnStandaloneHeightMm(furnitureData);
    const kitchenPlace = resolveKitchenPlaceHeightAndPlinth(furnitureData);
    // Кухня: каталог = корпус; в комнате + опора проекта (SKU 100/120/150 по plinth).
    const ownH = kitchenPlace ? kitchenPlace.totalHeightMm : ownHRaw;
    const existingH = getExistingStandaloneHeightInWindowAlongGroup(sectionAtPosition);
    const sillH = getWindowAlongGroupSillStandaloneHeightMm(sectionAtPosition);
    const HEIGHT_EPS_MM = 1;
    const limits = getStandaloneEditHeightLimitsMm(
      getRawPlacementKindFromFurnitureData(furnitureData)
    );
    const inWindowAlong = isWindowAlongWallSection(sectionAtPosition);

    let h = 0;
    if (standalonePlacePreChoice && standalonePlacePreChoice.heightMm > 0) {
      h = standalonePlacePreChoice.heightMm;
    } else if (inWindowAlong && getWindowRowRef(sectionAtPosition)) {
      // Фаза 2: одна формула из модели ряда.
      h = resolveWindowRowPlaceHeightMm(
        sectionAtPosition,
        standalonePlaceCatalogType,
        ownH
      );
    } else if (inWindowAlong) {
      // Старый ряд ниже подоконника (sill?цоколь) — поднимаем к sill.
      if (existingH > 0 && sillH > 0 && existingH < sillH - 5) {
        h = sillH;
      } else {
        h = existingH > 0 ? existingH : sillH > 0 ? sillH : ownH;
      }
    } else if (kitchenPlace && ownH > 0) {
      // Нижний кухонный ряд: корпус+опоры проекта, без выбора «как сосед».
      h = ownH;
    } else if (
      existingH > 0 &&
      ownH > 0 &&
      Math.abs(existingH - ownH) > HEIGHT_EPS_MM
    ) {
      let choice = 'own';
      try {
        choice = await askStandalonePlaceHeightChoice({
          ownHeightMm: ownH,
          neighborHeightMm: existingH,
        });
      } catch (_) {
        choice = 'own';
      }
      h = choice === 'neighbor' ? existingH : ownH;
    } else {
      h = ownH > 0 ? ownH : existingH > 0 ? existingH : Number(sectionSize.y) || 0;
    }

    if (h > 0) {
      h = clampStandaloneHeightToWindowSlot(sectionAtPosition, h);
      // У окна: высота подоконника не режется профилем max (часто 80 см).
      const maxMm =
        inWindowAlong && sillH > 0
          ? Math.max(limits.maxMm, sillH)
          : limits.maxMm;
      if (h < limits.minMm) h = limits.minMm;
      if (h > maxMm) h = maxMm;
      h = clampStandaloneHeightToWindowSlot(sectionAtPosition, h);
      sectionSize.y = h;
      standalonePlaceHeightMm = h;
      if (standalonePlaceCatalogType) {
        setStandaloneHeightForWindowAlongGroup(
          sectionAtPosition,
          standalonePlaceCatalogType,
          h
        );
      }
      try {
        bumpWindowRowSceneRev();
      } catch (_) {}
      // Поднять уже стоящие в ряду, если сажали по старой формуле.
      if (
        inWindowAlong &&
        sillH > 0 &&
        h >= sillH - 1 &&
        existingH > 0 &&
        existingH < sillH - 5
      ) {
        try {
          syncStandaloneCategoryHeightInSection(
            sectionAtPosition,
            standalonePlaceCatalogType,
            h
          );
        } catch (_) {}
      }
    }
  }

  // Kitchen engine: финальные s:y / h_bottom / layoutZones (после clamp ширины ячейки).
  let layoutZones = null;
  if (kitchenEnginePlace && kitchenEnginePlace.ok && kitchenEnginePlace.sizing) {
    const ks = kitchenEnginePlace.sizing;
    sectionSize.y = Math.round(ks.totalHeightMm);
    if (Number(ks.carcassDepthMm) > 0) {
      sectionSize.z = Math.round(ks.carcassDepthMm);
    }
    moduleVarsForBuilder = applyKitchenPlaceVariables(
      { ...moduleVarsMerged, ...kitchenEnginePlace.moduleVars },
      ks
    );
    moduleVarsForBuilder.h_top = resolveModuleHTopMm(
      moduleVarsForBuilder,
      PLACEMENT_KIND.STANDALONE_FLOOR
    );
    delete moduleVarsForBuilder.corpus_body_mm;
    delete moduleVarsForBuilder.corpus_fixed_mm;
    delete moduleVarsForBuilder.h_corpus_body;
    // kitchen_tall: layoutZones из датамов; kitchen_base: обычно null (формулы).
    if (isKitchenTallPlacementKind(rawKitchenPk)) {
      layoutZones =
        kitchenEnginePlace.layoutZones && kitchenEnginePlace.layoutZones.ok
          ? kitchenEnginePlace.layoutZones
          : null;
    } else if (kitchenPlacementUsesLayoutZones(rawKitchenPk)) {
      layoutZones = computeStandaloneFloorLayoutZones(
        sectionSize.y,
        moduleVarsForBuilder,
        PLACEMENT_KIND.STANDALONE_FLOOR
      );
    } else {
      layoutZones = null;
    }
    standalonePlaceHeightMm = sectionSize.y;
  } else if (sectionAtPosition && placementKind === PLACEMENT_KIND.STANDALONE_FLOOR) {
    moduleVarsForBuilder.h_top = resolveModuleHTopMm(moduleVarsForBuilder, placementKind);
    // НМ / НМУ (kitchen_base*): только v:h_bottom в JSON — без layoutZones.
    // Иначе corpus получает pos.y=plinthMm поверх v:h_bottom > двойной цоколь у НМУ.
    const skipZonesForKitchen =
      kitchenShouldSkipFloorNicheMerge(rawKitchenPk) ||
      isKitchenBasePlacementKind(rawKitchenPk) ||
      (rawKitchenPk && !kitchenPlacementUsesLayoutZones(rawKitchenPk));
    layoutZones = skipZonesForKitchen
      ? null
      : computeStandaloneFloorLayoutZones(
          sectionSize.y,
          moduleVarsForBuilder,
          placementKind
        );
    delete moduleVarsForBuilder.corpus_body_mm;
    delete moduleVarsForBuilder.corpus_fixed_mm;
    delete moduleVarsForBuilder.h_corpus_body;
  } else if (sectionAtPosition && placementKind !== PLACEMENT_KIND.STANDALONE_FLOOR) {
    refreshSectionVerticalLayout(sectionAtPosition);
    const slotMetrics = getSlotVerticalMetrics(sectionAtPosition);
    const catalogHForZones =
      Number(standalonePlaceHeightMm) ||
      Number(furnitureData?.height) ||
      Number(furnitureData?.catalogItem?.height) ||
      Number(sectionSize?.y) ||
      0;
    layoutZones = computePlacementVerticalZones(slotMetrics, {
      placementKind,
      variables: moduleVarsForBuilder,
      catalogHeightMm: catalogHForZones,
    });
    if (isWallHungPlacementKind(placementKind) && layoutZones?.zones) {
      const body = Math.max(0, Number(layoutZones.zones.bodyMm) || 0);
      const ht = Math.max(0, Number(layoutZones.zones.hTopMm) || 0);
      const hy = Math.max(1, body + ht);
      sectionSize = { ...sectionSize, y: hy };
    }
    if (
      typeof window !== 'undefined' &&
      (window.DEBUG_LAYOUT_ZONES === true || window.DEBUG_COLOR_FURNITURE_PARTS === true)
    ) {
      console.log('[LAYOUT-ZONES]', { placementKind, slotMetrics, layoutZones });
    }
  }

  let shelfStackPolicy =
    resolveFillShelfStackPolicyFromClodisRoots(clodisForBuild) ||
    resolveShelfStackPolicyForFurnitureData(furnitureData);
  const kitchenTallPlace = isKitchenTallPlacementKind(rawKitchenPk);
  if (kitchenTallPlace) {
    // Пенал: горизонты = панели в корпусе на датамах, не shelfStack.
    shelfStackPolicy = null;
  }
  const drawerStackPolicy = resolveDrawerStackPolicyForFurnitureData(furnitureData);
  const fillCatalogItemForInterior = resolveFillCatalogItemFromClodisRoots(clodisForBuild);

  if (kitchenTallPlace) {
    try {
      const rootsForTall = JSON.parse(JSON.stringify(clodisForBuild));
      const changedTall = applyKitchenTallDatumHorizonsToRoots(rootsForTall, layoutZones);
      if (changedTall) {
        clodisForBuild = rootsForTall;
        dataForBuild = getDataForBuild(clodisForBuild) || dataForBuild;
      }
    } catch (e) {
      console.warn('[KITCHEN-TALL] place datum horizons failed', e);
    }
  } else if (
    placementKind !== PLACEMENT_KIND.STANDALONE_FLOOR &&
    !isWallHungPlacementKind(placementKind)
  ) {
    try {
      const rootsForInterior = JSON.parse(JSON.stringify(clodisForBuild));
      const catalogItem = fillCatalogItemForInterior || furnitureData?.catalogItem || furnitureData;
      const changedInterior = applyRoomInteriorAndShelfStack(rootsForInterior, {
        catalogItem,
        furnitureData: catalogItem ? { catalogItem } : furnitureData,
        shelfStackPolicy,
        sectionSizeMm: sectionSize,
        variables: moduleVarsForBuilder,
        debugPhase: 'place',
      });
      if (changedInterior) {
        clodisForBuild = rootsForInterior;
        dataForBuild = getDataForBuild(clodisForBuild) || dataForBuild;
      }
    } catch (e) {
      console.warn('[INTERIOR-FILL] place apply failed', e);
    }
  }

  if (drawerStackPolicy) {
    try {
      const rootsForStack = JSON.parse(JSON.stringify(clodisForBuild));
      const changed = applyDrawerStackPolicyToRoots(rootsForStack, {
        policy: drawerStackPolicy,
        sectionSizeMm: sectionSize,
        variables: moduleVarsForBuilder,
        placementKind,
      });
      if (changed) {
        clodisForBuild = rootsForStack;
        dataForBuild = getDataForBuild(clodisForBuild) || dataForBuild;
      }
    } catch (e) {
      console.warn('[DRAWER-STACK] place apply failed', e);
    }
    if (
      !kitchenTallPlace &&
      placementKind !== PLACEMENT_KIND.STANDALONE_FLOOR &&
      !isWallHungPlacementKind(placementKind)
    ) {
      try {
        const interiorLayout = extractInteriorLayoutFromCatalogItem(
          fillCatalogItemForInterior || furnitureData?.catalogItem || furnitureData
        );
        const rootsForInteriorDrawers = JSON.parse(JSON.stringify(clodisForBuild));
        const changed = applyInteriorDrawerStackToRoots(rootsForInteriorDrawers, {
          policy: drawerStackPolicy,
          sectionSizeMm: sectionSize,
          variables: moduleVarsForBuilder,
          interiorLayout,
          catalogItem: fillCatalogItemForInterior || furnitureData?.catalogItem || furnitureData,
          findCatalogItem: findCatalogItemInRoomStorage,
        });
        if (changed) {
          clodisForBuild = rootsForInteriorDrawers;
          dataForBuild = getDataForBuild(clodisForBuild) || dataForBuild;
        }
      } catch (e) {
        console.warn('[DRAWER-STACK] interior fill place failed', e);
      }
    }
  }

  try {
    stampDrawerNoHandleFlagsInTree(clodisForBuild);
  } catch (e) {
    console.warn('[DRAWER-NO-HANDLE] stamp place failed', e);
  }

  const corpusWallThicknessMm =
    Number(moduleVarsForBuilder?._wt) > 0 ? Number(moduleVarsForBuilder._wt) : 16;

  // Кухня: один prepare (как админ-превью) — опоры + угол только для kitchen_base_corner.
  if (kitchenEnginePlace && kitchenEnginePlace.ok) {
    try {
      const catItem = furnitureData?.catalogItem || furnitureData;
      const ks =
        furnitureData.__kitchenSupports ||
        extractKitchenSupportsFromCatalogItem(catItem) ||
        null;
      const pkPlace = String(rawKitchenPk || '').trim();
      const isCornerPlace =
        pkPlace === 'kitchen_base_corner' || pkPlace === 'kitchen_wall_corner';
      const isWallCornerPlace = pkPlace === 'kitchen_wall_corner';
      let cornerCtx = isCornerPlace ? { ...(__kitchenCornerPrepareCtx || {}) } : null;
      // Если спец-зона не сработала — всё равно project D/rear, не catalog 550.
      if (isCornerPlace && cornerCtx && !isWallCornerPlace) {
        const projFallback = resolveKitchenCornerPlaceFromProject();
        if (!(Number(cornerCtx.returnMm) > 0)) {
          cornerCtx.returnMm = Math.round(Number(projFallback.carcassMm) || 0);
        }
        if (
          Number(projFallback.carcassMm) > 0 &&
          Number(cornerCtx.returnMm) !== Number(projFallback.carcassMm)
        ) {
          cornerCtx.returnMm = Math.round(Number(projFallback.carcassMm));
        }
        // 1.42: если clear не проставлен — rear из project (не хардкод 10).
        if (!(Number(cornerCtx.clearMm) >= 0)) {
          cornerCtx.clearMm = Math.max(0, Math.round(Number(projFallback.rearMm) || 10));
        }
        cornerCtx.wallGapMm = cornerCtx.clearMm;
      }
      if (isWallCornerPlace && cornerCtx) {
        cornerCtx.clearMm = 0;
        cornerCtx.wallGapMm = 0;
        const dWall = Math.round(
          Number(catItem?.depth) || Number(catItem?.data?.depth) || 0
        );
        if (!(Number(cornerCtx.returnMm) > 0) || Number(cornerCtx.returnMm) >= 460) {
          cornerCtx.returnMm = dWall > 0 ? dWall : 350;
        }
      }
      const preparedKitchen = prepareKitchenModuleForBuild({
        roots: dataForBuild,
        variables: moduleVarsForBuilder,
        widthMm:
          Number(cornerCtx?.widthMm) ||
          Number(sectionSize?.x) ||
          undefined,
        item: catItem,
        placementKind: pkPlace,
        plinthHeightMm: isWallCornerPlace
          ? 0
          : Number(moduleVarsForBuilder?.h_bottom) || undefined,
        kitchenSupports: ks,
        kitchenNormalize: {
          sidePanels:
            furnitureData?.sidePanels ||
            furnitureData?.userData?.sidePanels ||
            null,
          carcassDepthMm:
            furnitureData?.userData?.__kitchenCarcassDepthMm ||
            furnitureData?.__kitchenCarcassDepthMm ||
            furnitureData?.customDepthMm ||
            sectionSize?.z ||
            null,
          skipWorktopCover:
            isKitchenWallMidPlacementKind(pkPlace) ||
            isKitchenWallTopPlacementKind(pkPlace) ||
            isKitchenTallPlacementKind(pkPlace) ||
            pkPlace === 'kitchen_wall_mid' ||
            pkPlace === 'kitchen_wall_top' ||
            pkPlace === 'kitchen_tall',
        },
        corner: isCornerPlace
          ? {
              ...(cornerCtx || {}),
              item: catItem,
              normalizeTree: true,
              enabled: true,
            }
          : { enabled: false },
      });
      dataForBuild = preparedKitchen.roots;
      moduleVarsForBuilder = preparedKitchen.variables;
      if (ks) furnitureData.__kitchenSupports = ks;
      if (typeof window !== 'undefined' && window.__CLD_DEBUG_PREPARE === true) {
        console.log('[PLACE] prepareKitchenModuleForBuild', preparedKitchen.meta);
      }
    } catch (ePrep) {
      console.warn('[PLACE] prepareKitchenModuleForBuild failed', ePrep);
    }
  }

  // Кухня: цоколь/опоры = project plinth, не захардкоженные 100.
  const kitchenHbForParams = Math.max(
    0,
    Number(moduleVarsForBuilder?.h_bottom) || 0
  );
  const params = {
    sectionSize: sectionSize,
    // Толщина ЛДСП для выражений $wall.thickness > v:_wt и для g:g0.thickness в шаблонах.
    wallThicknessMm: corpusWallThicknessMm,
    variables: {
      vysota_cokolya: kitchenHbForParams > 0 ? kitchenHbForParams : 100,
      glubina_cokolya: 100,
      otstup_paza: 0,
      ...moduleVarsForBuilder,
      ...(kitchenHbForParams > 0 ? { h_bottom: kitchenHbForParams } : {}),
    },
    // g1 часто используется как группа задней стенки (HDF 3мм) в импортированных шаблонах.
    groups: {
      g0: { thickness: corpusWallThicknessMm },
      g1: { thickness: 3 },
      g2: { thickness: 18 },
      g3: { thickness: 16 },
      hdf1: { thickness: 3 },
    },
    useLegacySetupPivot: USE_LEGACY_SETUP_PIVOT,
    decorOutside: step5Selection.outside,
    decorInside: step5Selection.inside,
    layoutZones,
    // kitchen_base: в билдер — сырой id (как админка), не mapped standalone_floor.
    placementKind:
      kitchenEnginePlace && kitchenEnginePlace.ok && rawKitchenPk
        ? rawKitchenPk
        : placementKind,
    doorLayout: doorOpts.doorLayout || undefined,
    zoneHand: doorOpts.zoneHand || undefined,
    doorKind: doorOpts.doorKind || undefined,
    unifiedFacade: doorOpts.unifiedFacade || undefined,
    hingeLayoutOverride:
      furnitureData?.hingeLayoutOverride ??
      furnitureData?.hingeLayoutId ??
      furnitureData?.catalogItem?.hingeLayoutId ??
      furnitureData?.catalogItem?.data?.hingeLayoutId ??
      undefined,
    productKind: resolveProductKindForFurnitureData(furnitureData),
    kitchenSupports:
      furnitureData.__kitchenSupports ||
      extractKitchenSupportsFromCatalogItem(furnitureData?.catalogItem || furnitureData) ||
      null,
    shellFillPolicyCatalogItem:
      resolveShellFillPolicyCatalogItemFromClodisRoots(clodisForBuild, furnitureData?.catalogItem) ||
      null,
    fillPolicyCatalogItem: fillCatalogItemForInterior || furnitureData?.catalogItem || null,
    shelfProps: resolveShelfPropsConfigFromFillItem(
      fillCatalogItemForInterior || furnitureData?.catalogItem
    ),
  };

  console.log('?? Создание мебели из Clodis JSON, декоры:', {
    outside: step5Selection.outside?.name || step5Selection.outside?.id || '—',
    inside: step5Selection.inside?.name || step5Selection.inside?.id || '—',
  });

  // Не удаляем ранее размещённые шкафы: допускаем несколько модулей в общей секции.
  // state.furniture дальше используется как ссылка на "текущий/последний" создаваемый модуль.

  __placeMark('before_Furniture');
  state._placeAdoptedClodis = null;
  state.furniture = new Furniture(dataForBuild, params);
  __placeMark('after_Furniture');

  // Сохраняем исходный Clodis JSON для точного расчёта кромки (по включенным сторонам деталей).
  try {
    const ud = state.furniture.group.userData || (state.furniture.group.userData = {});
    writeUserDataClodisData(ud, dataForBuild);
    try {
      const rootsCanonical = Array.isArray(clodisForBuild)
        ? clodisForBuild
        : clodisForBuild
          ? [clodisForBuild]
          : Array.isArray(clodisData)
            ? clodisData
            : clodisData
              ? [clodisData]
              : null;
      if (rootsCanonical && rootsCanonical.length) {
        writeUserDataClodisRoots(ud, JSON.parse(JSON.stringify(rootsCanonical)));
      }
    } catch (_) {}
    if (moduleVarsForBuilder && typeof moduleVarsForBuilder === 'object') {
      try {
        writeUserDataClodisVariables(ud, JSON.parse(JSON.stringify(moduleVarsForBuilder)));
      } catch (_) {
        writeUserDataClodisVariables(ud, { ...moduleVarsForBuilder });
      }
    }
    // Ячейка/отступ НМУ — только kitchen_base_corner (не ВМУ: иначе 1050 на навес).
    // rawKitchenPk: __placementKindProfileId ещё не проставлен ниже.
    const pkStamp = String(rawKitchenPk || ud.__placementKindProfileId || '').trim();
    if (__kitchenCornerSideAtMinU != null && pkStamp === 'kitchen_base_corner') {
      ud.__kitchenCornerSideAtMinU = __kitchenCornerSideAtMinU === true;
      const cellFromPlace = Math.round(Number(sectionSize?.__kitchenCornerCellWidthMm) || 0);
      const clearFromPlaceRaw = Math.round(
        Number(sectionSize?.__kitchenSideWallClearanceMm)
      );
      const clearFromPlace =
        Number.isFinite(clearFromPlaceRaw) && clearFromPlaceRaw >= 0
          ? clearFromPlaceRaw
          : 10;
      ud.__kitchenSideWallClearanceMm = clearFromPlace;
      ud.__kitchenCellWidthMm =
        cellFromPlace > 50
          ? cellFromPlace
          : Math.round(Number(ud.__kitchenCellWidthMm) || 0) ||
            Math.round(Number(sectionSize?.x) || 0) + ud.__kitchenSideWallClearanceMm;
      ud.customWidthMm = ud.__kitchenCellWidthMm;
      try {
        __tintKitchenCornerReturnSlot(state.furniture?.group || null);
      } catch (_) {}
    } else if (__kitchenCornerSideAtMinU != null && pkStamp === 'kitchen_wall_corner') {
      // ВМУ seat A: W из upperCornerCell (600), не 1050 низа; clear=0.
      ud.__kitchenCornerSideAtMinU = __kitchenCornerSideAtMinU === true;
      ud.__kitchenSideWallClearanceMm = 0;
      const cellFromPlace = Math.round(
        Number(sectionSize?.__kitchenCornerCellWidthMm) ||
          Number(sectionSize?.x) ||
          0
      );
      ud.__kitchenCellWidthMm =
        cellFromPlace >= 300 && cellFromPlace <= 900
          ? cellFromPlace
          : KITCHEN_WALL_CORNER_DEFAULT_WIDTH_MM;
      ud.customWidthMm = ud.__kitchenCellWidthMm;
      ud.__zoneSlotRole = ud.__zoneSlotRole || 'mid';
      ud.__kitchenUpperCornerSeat = 'A';
    }
    ud.__initialSectionSizeMm = sectionSize;   // {x,y,z} мм, использовано при построении
    ud.__catalogSizeMm = defaultModuleSize;    // каталожные W?H?D до подгонки под нишу
    if (layoutZones) ud.__layoutZones = layoutZones;
    else {
      try {
        delete ud.__layoutZones;
      } catch (_) {}
    }
    ud.__placementKindProfileId = getRawPlacementKindFromFurnitureData(furnitureData);
    ud.__placementKind = placementKind;
    stampZoneCohabitOnUserData(ud, resolvePendingZoneCohabitSpec(furnitureData));
    if (doorOpts.doorLayout) ud.doorLayout = doorOpts.doorLayout;
    if (doorOpts.zoneHand && !ud.zoneHandManual) ud.zoneHand = doorOpts.zoneHand;
    if (doorOpts.doorKind) ud.doorKind = doorOpts.doorKind;
    if (doorOpts.hasSwingDoor) ud.hasSwingDoor = true;
    ud.unifiedFacadeFromCatalog = extractUnifiedFacadeFromCatalogItem(furnitureData?.catalogItem);
    ud.unifiedFacade = !!doorOpts.unifiedFacade;
    ud.drawerStackPolicy = drawerStackPolicy || null;
    ud.shelfStackPolicy = shelfStackPolicy || null;
    ud.kitchenSupports =
      furnitureData.__kitchenSupports ||
      extractKitchenSupportsFromCatalogItem(furnitureData?.catalogItem || furnitureData) ||
      null;
    ud.productKind = resolveProductKindForFurnitureData(furnitureData);
    ud.pairedHandCatalogItemIds = readPairedHandCatalogIdsFromItem(furnitureData?.catalogItem);
    ud.__hasPlinthSection = !!hasPlinthSection;
    ud.__enableStep5FacadeOffset = !!enableStep5FacadeOffset;
    if (enableStep5FacadeOffset && hasPlinthSection && Number.isFinite(step5FacadeBottomOffsetMm)) {
      ud.__step5FacadeBottomOffsetMm = step5FacadeBottomOffsetMm;
    }
    // Пенал: stamp ДО placeKitchenModuleInCell / depth-stack (иначе ловит стек НМ wall+10).
    if (kitchenEnginePlace && kitchenEnginePlace.ok && kitchenEnginePlace.sizing) {
      stampKitchenUserData(ud, kitchenEnginePlace.sizing);
    }
  } catch (_) {}

  // Calculate bbox in local coordinates
  const savedPos = state.furniture.group.position.clone();
  const savedRot = state.furniture.group.rotation.clone();
  state.furniture.group.position.set(0, 0, 0);
  state.furniture.group.rotation.set(0, 0, 0);
  state.furniture.group.updateMatrixWorld(true);
  
  // ВАЖНО: при расчёте размеров для подгонки под зону нельзя учитывать WallContactAO,
  // иначе bbox становится шире шкафа (~+8%), и после скейла корпус получается уже зоны
  // (визуально как "зазор ~50мм").
  const localBbox = computeFurnitureWorldBBoxNoAo(state.furniture.group);
  // Корпус без corner_post / corner_return: иначе Z жмётся и ломает глубину приставки.
  const localCorpusBbox = computeFurnitureCorpusLayoutWorldBBoxNoAo(state.furniture.group, {
    forDepthScale: true,
  });

  // Конструктор / Clodis: не масштабировать всю группу под sectionSize (см. clodisHasConstructorMarkers).
  if (sectionSize && typeof sectionSize.x === 'number' && typeof sectionSize.y === 'number' && typeof sectionSize.z === 'number') {
    const currentSize = {
      x: localBbox.max.x - localBbox.min.x,
      y: localBbox.max.y - localBbox.min.y,
      z: localBbox.max.z - localBbox.min.z,
    };
    const corpusZ =
      localCorpusBbox && !localCorpusBbox.isEmpty()
        ? localCorpusBbox.max.z - localCorpusBbox.min.z
        : currentSize.z;
    const targetSize = sectionSize;
    if (currentSize.x > 1 && currentSize.y > 1 && currentSize.z > 1) {
      const sx = targetSize.x / currentSize.x;
      const sy = targetSize.y / currentSize.y;
      const relErr = (a, b) => Math.abs(a - b) / Math.max(1, Math.abs(b));
      const ex = relErr(currentSize.x, targetSize.x);
      const ey = relErr(currentSize.y, targetSize.y);
      // НМ: Z корпуса из формул (carcass); столешка = Dwt ячейки. Не scale.z —
      // иначе TT без layout_role:top попадала в corpus bbox и сжималась > щель у стены.
      const kitchenForceZ =
        !!(kitchenEnginePlace && kitchenEnginePlace.ok) ||
        isKitchenBasePlacementKind(rawKitchenPk) ||
        isKitchenTallPlacementKind(rawKitchenPk) ||
        isKitchenWallMidPlacementKind(rawKitchenPk) ||
        isKitchenWallTopPlacementKind(rawKitchenPk);
      const zForScale = kitchenForceZ && corpusZ > 1 ? corpusZ : currentSize.z;
      const sz = targetSize.z / zForScale;
      const ez = relErr(zForScale, targetSize.z);
      const NEED_SCALE = (ex > 0.03) || (ey > 0.03) || (ez > 0.03);
      if (NEED_SCALE && (!isConstructorClodisJson || kitchenForceZ)) {
        if (isConstructorClodisJson && kitchenForceZ) {
          console.log('[KITCHEN-DEPTH] skip scale Z (cell=TT Dwt, carcass from formulas)', {
            currentZ: Math.round(currentSize.z),
            corpusZ: Math.round(corpusZ),
            targetZ: Math.round(targetSize.z),
          });
        } else {
          state.furniture.group.scale.set(
            state.furniture.group.scale.x * sx,
            state.furniture.group.scale.y * sy,
            state.furniture.group.scale.z * sz
          );
          state.furniture.group.updateMatrixWorld(true);
          state.furniture.bbox.copy(computeFurnitureWorldBBoxNoAo(state.furniture.group));
          console.log('?? Масштабируем модуль под sectionSize (legacy fallback):', { currentSize, targetSize, scale: { sx, sy, sz }, relErr: { ex, ey, ez } });
        }
      } else if (NEED_SCALE && isConstructorClodisJson) {
        console.log('?? Пропускаем масштабирование module под sectionSize (constructor Clodis):', { currentSize, targetSize, relErr: { ex, ey, ez } });
      }
    }
  }
  
  // Restore position and rotation
  state.furniture.group.position.copy(savedPos);
  state.furniture.group.rotation.copy(savedRot);
  state.furniture.group.updateMatrixWorld(true);

  // Set position
  const roomWorldPos = new THREE.Vector3();
  state.room.group.getWorldPosition(roomWorldPos);

  const adjustedPosition = position.clone();
  if (!sectionAtPosition) {
    adjustedPosition.y = roomWorldPos.y;
  }

  state.furniture.group.position.copy(adjustedPosition);
  state.furniture.group.rotation.y = rotationY;
  if (typeof logFurniturePivotTrace === 'function' && sectionAtPosition) {
    const wPlace = sectionAtPosition.wallName || wall;
    logFurniturePivotTrace('place:after_zonePos', state.furniture.group, {
      wallName: wPlace,
      section: sectionAtPosition,
      extra: { zoneIndex: placementZoneIndex },
    });
  }
  if (sectionAtPosition) {
    let zoneFitted = false;
    let aligned = false;
    let depthAligned = false;
    const kitchenNmPlace =
      isKitchenNmPlacement(furnitureData) ||
      isKitchenBaseGroup(state.furniture.group) ||
      isKitchenWallCornerGroup(state.furniture.group);
    if (kitchenNmPlace) {
      const r = placeKitchenModuleInCell(
        state.furniture.group,
        sectionAtPosition,
        placementZoneIndex,
        sectionAtPosition.wallName || wall
      );
      zoneFitted = !!r.zoneFitted;
      aligned = !!r.aligned;
      depthAligned = !!r.depthAligned;
      if (__kitchenCornerSideAtMinU != null) {
        try {
          __tintKitchenCornerReturnSlot(state.furniture.group);
        } catch (_) {}
      }
      // НМУ → CornerCell 1050; ВМУ → upperCornerCell 600 (одна карточка, без крыла).
      if (
        __kitchenCornerSideAtMinU != null &&
        typeof window.__cldPlaceModuleIntoKitchenCornerCell === 'function' &&
        placementZoneIndex != null &&
        __isLShapeSpecialZone(sectionAtPosition, placementZoneIndex)
      ) {
        try {
          const seated = window.__cldPlaceModuleIntoKitchenCornerCell(
            state.furniture.group,
            sectionAtPosition,
            placementZoneIndex
          );
          console.warn('[ZONE-PLACE] CornerCell seat', seated);
          if (seated?.ok) {
            zoneFitted = true;
            aligned = true;
          }
        } catch (e) {
          console.warn('[ZONE-PLACE] CornerCell seat failed', e);
        }
      }
    } else {
      const seatBFitInfo =
        state._pendingZoneInfo?.upperCornerSeat === 'B' ||
        state._pendingZoneInfo?.upperCornerCompanion === true
          ? state._pendingZoneInfo
          : null;
      const seatB0 =
        Number(seatBFitInfo?.seatBStartU ?? seatBFitInfo?.companionStartU);
      const seatB1 =
        Number(seatBFitInfo?.seatBEndU ?? seatBFitInfo?.companionEndU);
      if (
        seatBFitInfo &&
        Number.isFinite(seatB0) &&
        Number.isFinite(seatB1)
      ) {
        const wFit =
          seatBFitInfo.wallName ||
          sectionAtPosition.wallName ||
          wall;
        zoneFitted = !!fitFurnitureBBoxToZoneBounds(
          state.furniture.group,
          seatB0,
          seatB1,
          wFit,
          {
            zoneIndex: placementZoneIndex,
            clampMaxToZoneEnd: true,
            anchorEdge:
              (seatBFitInfo.seatBAnchorEdge ||
                seatBFitInfo.companionAnchorEdge) === 'max'
                ? 'max'
                : 'min',
          }
        );
      } else if (
        placementZoneIndex != null &&
        Number.isFinite(Number(placementZoneIndex))
      ) {
        zoneFitted = fitFurnitureToSectionZone(
          state.furniture.group,
          sectionAtPosition,
          placementZoneIndex
        );
      }
      aligned = alignFurnitureBBoxToSectionInnerBounds(
        state.furniture.group,
        sectionAtPosition,
        true
      );
      depthAligned = alignSectionStandaloneFurnitureFront(
        state.furniture.group,
        sectionAtPosition,
        sectionAtPosition.wallName || wall
      );
    }
    if (zoneFitted || aligned || depthAligned) {
      console.log('[ZONE-PLACE] zone/section bounds applied', {
        kitchenNm: !!kitchenNmPlace,
        zoneFitted,
        aligned: !!aligned,
        depthAligned: !!depthAligned,
      });
    }
    if (typeof logFurniturePivotTrace === 'function') {
      logFurniturePivotTrace('place:after_align', state.furniture.group, {
        wallName: sectionAtPosition.wallName || wall,
        section: sectionAtPosition,
        extra: { zoneFitted, aligned: !!aligned, zoneIndex: placementZoneIndex },
      });
    }
    // catalog_44 в спец: шкаф L — clamp к зазору 50. Кухня: спец=1050, clamp не ужимать.
    if (
      isCornerCabPlace &&
      placementZoneIndex != null &&
      __isLShapeSpecialZone(sectionAtPosition, placementZoneIndex) &&
      !(
        typeof isKitchenSectionLayoutActive === 'function' &&
        isKitchenSectionLayoutActive()
      )
    ) {
      __cldClampCornerCabinetToSpecialGap(
        state.furniture.group,
        sectionAtPosition,
        placementZoneIndex
      );
    }
  }
  state.furniture.group.updateMatrixWorld(true);
  if (typeof ClodisBuilder !== 'undefined' && typeof ClodisBuilder.finalizeDrawerFixedPartsReparent === 'function') {
    ClodisBuilder.finalizeDrawerFixedPartsReparent(state.furniture.group);
    state.furniture.group.updateMatrixWorld(true);
  }
  console.log('[ZONE-PLACE] finalFurniture', {
    wall,
    finalPosition: adjustedPosition.clone(),
    rotationY,
    sectionId: sectionAtPosition?.id || null,
    usedSectionSize: sectionSize,
  });
  
  // Флаги для последующей подстройки под секцию при её изменении
  const groupUD = state.furniture.group.userData || (state.furniture.group.userData = {});
  groupUD.isFurniture = true;
  if (zoneDoorKindForBuild === 'single' || zoneDoorKindForBuild === 'double') {
    groupUD.doorKind = zoneDoorKindForBuild;
  }
  const _catItem = furnitureData?.catalogItem || null;
  groupUD.catalogName =
    (_catItem && (_catItem.name || _catItem.title)) ||
    furnitureData?.name ||
    '';
  if (_catItem && _catItem.id != null && _catItem.id !== '') {
    groupUD.catalogItemId = _catItem.id;
    groupUD.pairedCatalogItemIds = readPairedCatalogIdsFromItem(_catItem);
  }
  const _catType =
    furnitureData?.catalogType ||
    (_catItem && (_catItem.catalog_type || _catItem.catalogType)) ||
    null;
  if (_catType != null && String(_catType).trim() !== '') {
    groupUD.catalogType = String(_catType).trim();
  }
  if (
    isWallHungPlacementKind(placementKind) &&
    sectionAtPosition &&
    Number(sectionSize?.y) > 0
  ) {
    groupUD.customHeightMm = Math.round(Number(sectionSize.y));
  }
  if (
    placementKind === PLACEMENT_KIND.STANDALONE_FLOOR &&
    sectionAtPosition &&
    standalonePlaceHeightMm > 0
  ) {
    groupUD.customHeightMm = standalonePlaceHeightMm;
    const catKey = getFurnitureCatalogType(groupUD) || standalonePlaceCatalogType;
    if (catKey) {
      setStandaloneHeightForWindowAlongGroup(sectionAtPosition, catKey, standalonePlaceHeightMm);
    }
  }
  // Kitchen Cell: зафиксировать H/D модулялога, чтобы rebuild по ширине ячейки их не трогал.
  {
    const rawPkStamp = getRawPlacementKindFromFurnitureData(furnitureData);
    if (
      isKitchenBasePlacementKind(rawPkStamp) ||
      isKitchenTallPlacementKind(rawPkStamp) ||
      isKitchenWallMidPlacementKind(rawPkStamp) ||
      isKitchenWallTopPlacementKind(rawPkStamp)
    ) {
      const kz = Math.round(
        Number(kitchenEnginePlace?.sizing?.carcassDepthMm) || Number(sectionSize?.z) || 0
      );
      const ky = Math.round(Number(sectionSize?.y) || 0);
      const maxD =
        isKitchenWallMidPlacementKind(rawPkStamp) ||
        isKitchenWallTopPlacementKind(rawPkStamp)
          ? 450
          : 560;
      if (kz > 0 && kz <= maxD) groupUD.customDepthMm = kz;
      if (ky > 0 && !(Number(groupUD.customHeightMm) > 0)) groupUD.customHeightMm = ky;
    }
  }
  groupUD.__cldSkipSectionAutoRescale = !!isConstructorClodisJson;
  groupUD.wallName = sectionAtPosition?.wallName || wall || 'back';
  const __varsPlace = extractModuleVariablesFromFurnitureData(furnitureData);
  const kitchenPlaceAtVars =
    (kitchenEnginePlace && kitchenEnginePlace.ok && kitchenEnginePlace.sizing) ||
    resolveKitchenPlaceHeightAndPlinth(furnitureData);
  if (kitchenPlaceAtVars) {
    Object.assign(__varsPlace, applyKitchenPlaceVariables(__varsPlace, kitchenPlaceAtVars));
  }
  // Kitchen engine: без mergeFloorNiche. Legacy ниша — только не-kitchen.
  const __varsPlaceRoom =
    kitchenPlaceAtVars ||
    kitchenShouldSkipFloorNicheMerge(getRawPlacementKindFromFurnitureData(furnitureData))
      ? __varsPlace
      : sectionAtPosition &&
          !isLowFurniturePlacementKind(placementKind) &&
          !isWallHungPlacementKind(placementKind)
        ? mergeFloorNicheVariablesFromSection(sectionAtPosition, __varsPlace)
        : __varsPlace;
  groupUD.hBottomMm = Math.max(0, Number(__varsPlaceRoom.h_bottom) || 0);
  if (kitchenPlaceAtVars) {
    stampKitchenUserData(groupUD, kitchenPlaceAtVars);
  }
  // НМУ place: отступ (clear) отдельно от rear; return = project D. ВМУ — не трогать.
  if (
    __kitchenCornerSideAtMinU != null &&
    String(rawKitchenPk || groupUD.__placementKindProfileId || '').trim() ===
      'kitchen_base_corner'
  ) {
    const projStamp = resolveKitchenCornerPlaceFromProject();
    const stampClear = Math.round(Number(groupUD.__kitchenSideWallClearanceMm));
    if (!(Number.isFinite(stampClear) && stampClear >= 0)) {
      groupUD.__kitchenSideWallClearanceMm = Math.max(
        0,
        Math.round(Number(projStamp.rearMm) || 10)
      );
    }
    // Project D первым — иначе catalog corner_return_mm (часто 550) залипает при D=460.
    const retStamp = Math.round(
      Number(projStamp.carcassMm) ||
        Number(groupUD.__kitchenCornerReturnMm) ||
        Number(moduleVarsForBuilder?.corner_return_mm) ||
        0
    );
    if (retStamp > 0) groupUD.__kitchenCornerReturnMm = retStamp;
  }
  groupUD.techZoneMm = getTechZoneMmFromVariables(__varsPlaceRoom);
  // Каталожный h_top (до подстановки зоны антресоли в комнате) — для пересчёта layoutZones при ресайзе ниши
  groupUD.hTopCatalogMm =
    isLowFurniturePlacementKind(placementKind)
      ? resolveModuleHTopMm(__varsPlace, placementKind)
      : Math.max(0, Number(__varsPlace.h_top) || 0);
  groupUD.corpusBodyMm =
    isLowFurniturePlacementKind(placementKind)
      ? 0
      : Math.max(
          0,
          Number(
            __varsPlace.corpus_body_mm ??
              __varsPlace.corpus_fixed_mm ??
              __varsPlace.h_corpus_body
          ) || 0
        );
  groupUD.corpusAntresolMm = Math.max(0, Number(__varsPlace.corpus_antresol_mm) || 0);
  if (sectionAtPosition) {
    groupUD.sectionId = sectionAtPosition.id;
    // Сохраняем индекс зоны, чтобы updateFurnitureInSection мог корректно пересчитать
    // положение при изменении размера секции, не завися от позиции в мировых координатах.
    if (sectionAtPosition.division) {
      // После жеста zoneIndex = placeZoneIndex (не старый pending — иначе Single
      // остаётся на double-индексе и соседи не сдвигаются визуально).
      if (placementZoneIndex != null && Number.isFinite(Number(placementZoneIndex))) {
        groupUD.zoneIndex = placementZoneIndex;
      } else if (pendingZoneInfo && pendingZoneInfo.sectionId === sectionAtPosition.id) {
        groupUD.zoneIndex = pendingZoneInfo.zoneIndex;
      } else {
        // 2. Fallback: пересчитываем зону по текущей позиции (для очень старых сценариев
        //    без _pendingZoneInfo). Здесь hitCoord берём вдоль оси деления.
        const wallNameForZone =
          sectionAtPosition.wallName || sectionAtPosition.division?.wallName || wall;
        const hitCoordForZone =
          wallNameForZone === 'front' || wallNameForZone === 'back'
            ? position.x
            : position.z;
        const snapForZone = snapToZoneDoubleModule(
          hitCoordForZone,
          sectionAtPosition.division,
          wallNameForZone,
          sectionAtPosition.id
        );
        if (snapForZone) {
          groupUD.zoneIndex = snapForZone.zoneIndex;
        }
      }
    }
    // Seat B НШ1 ↔ upperCornerCell (нога Г, не следующая обычная ячейка).
    const pendingSeat =
      state._pendingZoneInfo?.upperCornerSeat === 'B' ||
      state._pendingZoneInfo?.upperCornerCompanion === true
        ? state._pendingZoneInfo
        : pendingZoneInfo?.upperCornerSeat === 'B' ||
            pendingZoneInfo?.upperCornerCompanion === true
          ? pendingZoneInfo
          : null;
    if (pendingSeat && pendingSeat.upperCornerCellId) {
      groupUD.__kitchenUpperCornerSeat = 'B';
      groupUD.__kitchenUpperCornerCellId = String(pendingSeat.upperCornerCellId);
      groupUD.__kitchenCornerCellId = groupUD.__kitchenUpperCornerCellId;
      const spanRaw =
        pendingSeat.seatBSpannedZones || pendingSeat.companionSpannedZones;
      const span = Array.isArray(spanRaw)
        ? spanRaw
            .map((z) => Math.floor(Number(z)))
            .filter((z) => Number.isFinite(z) && z >= 0)
        : [];
      groupUD.__kitchenUpperCornerSeatBZones = span;
      const c0 = Number(pendingSeat.seatBStartU ?? pendingSeat.companionStartU);
      const c1 = Number(pendingSeat.seatBEndU ?? pendingSeat.companionEndU);
      if (Number.isFinite(c0)) groupUD.__kitchenUpperCornerSeatBStartU = c0;
      if (Number.isFinite(c1)) groupUD.__kitchenUpperCornerSeatBEndU = c1;
      const anchor =
        pendingSeat.seatBAnchorEdge || pendingSeat.companionAnchorEdge;
      if (anchor) groupUD.__kitchenUpperCornerSeatBAnchorEdge = anchor;
      const startMm = Math.round(
        Number(pendingSeat.seatBStartMm) || 0
      );
      if (startMm >= 50) groupUD.__kitchenUpperCornerSeatBStartMm = startMm;
      const cw = Math.round(
        Number(pendingSeat.seatBModuleWidth) ||
          Number(pendingSeat.companionModuleWidth) ||
          Number(sectionSize?.x) ||
          0
      );
      if (cw >= 300) {
        groupUD.customWidthMm = cw;
        groupUD.__kitchenCellWidthMm = cw;
      }
      // legacy companion stamps — не писать
      try {
        delete groupUD.__kitchenUpperCornerCompanion;
        delete groupUD.__kitchenUpperCornerCompanionZones;
      } catch (_) {}
    } else {
      try {
        delete groupUD.__kitchenUpperCornerSeat;
        delete groupUD.__kitchenUpperCornerSeatBZones;
        delete groupUD.__kitchenUpperCornerSeatBStartU;
        delete groupUD.__kitchenUpperCornerSeatBEndU;
        delete groupUD.__kitchenUpperCornerSeatBAnchorEdge;
        delete groupUD.__kitchenUpperCornerSeatBStartMm;
        delete groupUD.__kitchenUpperCornerCompanion;
        delete groupUD.__kitchenUpperCornerCompanionZones;
        delete groupUD.__kitchenUpperCornerCompanionStartU;
        delete groupUD.__kitchenUpperCornerCompanionEndU;
        delete groupUD.__kitchenUpperCornerCompanionAnchorEdge;
      } catch (_) {}
    }
  }
  
  // IKEA: bind shader > step5 uniforms до add (без белого MeshStandard); light sync — после add
  try {
    restoreStep5ModuleDecorFromStorage(state.furniture.group);
    const doorsOpenPreAdd =
      typeof window !== 'undefined' && window.__cldRoomDoorsDesiredOpen === true;
    applyRoomCabinetStudioLook(state.furniture.group, {
      doorsOpen: doorsOpenPreAdd,
      syncLight: false,
    });
    applyStep5DecorToFurnitureGroupImmediate(state.furniture.group);
  } catch (_) {}
  __placeMark('after_studio_bind');
  state.furniture.group.visible = true;
  state.scene.add(state.furniture.group);
  state.furniture.group.updateMatrixWorld(true);
  invalidateGroupIconBBoxCache(state.furniture.group);
  patchSectionNicheDepthWrite(state.scene);
  // Не scheduleTrimRebuild здесь: ниже sync rebuildTransitionsForWall({ onlyUuids }).
  // Отложенный rebuild без onlyUuids давал второй полный updateFurniture O(n) на N-й шкаф.

  try {
    if (typeof window !== 'undefined' && window.__CLD_DEBUG_PLACE === true) {
      const bbNow = computeFurnitureWorldBBoxNoAo(state.furniture.group).getSize(new THREE.Vector3());
      console.warn('[PLACE-BBOX] сразу после add', {
        uuid: state.furniture.group.uuid,
        builtWidthMm: Math.round(bbNow.x),
        builtDepthMm: Math.round(bbNow.z),
        requestedWidthMm: Math.round(Number(sectionSize?.x) || 0),
        scale: state.furniture.group.scale.toArray().map((v) => Number(v.toFixed(3))),
      });
    }
  } catch (_) {}

  try {
    if (typeof window !== 'undefined' && Number(window.currentRoomStep) >= 4) {
      const desiredOpen = window.__cldRoomDoorsDesiredOpen === true;
      const B = window.ClodisBuilder;
      // Вся сцена: иначе новый комод открыт, шкафы/старые комоды остаются закрытыми.
      if (B && typeof B.toggleAllDoors === 'function') {
        B.toggleAllDoors(desiredOpen, { instant: true });
      }
    }
  } catch (_) {}
  __placeMark('after_doors');

  if (sectionAtPosition && groupUD.zoneIndex != null) {
    try {
      // Debounce: не rebuild соседей сразу после place (L-R thrash при росте chainLen).
      syncSingleSwingNeighborsAfterPlace(sectionAtPosition);
    } catch (syncHandErr) {
      console.warn('[ZONE-HAND] neighbor sync failed', syncHandErr);
    }
  }

  // -- Critical path: пол > transitions > fit (без DOM-меток / O(n) label refresh) --
  const tolerance = 1;
  state.furniture.group.updateMatrixWorld(true);
  let bboxMinY = getFurnitureFloorContactWorldYNoAo(state.furniture.group);
  let targetBottomY = roomWorldPos.y;
  if (isWallHungPlacementKind(placementKind) && sectionAtPosition) {
    const m = getSlotVerticalMetrics(sectionAtPosition);
    const bodyH = Math.max(
      1,
      Number(sectionSize?.y) ||
        Number(layoutZones?.zones?.bodyMm) ||
        Number(furnitureData?.height) ||
        0
    );
    const rawPkY = getRawPlacementKindFromFurnitureData(furnitureData);
    const wallBandY =
      isKitchenWallMidPlacementKind(rawPkY) ||
      isKitchenWallMidPlacementKind(placementKind) ||
      isKitchenWallTopPlacementKind(rawPkY) ||
      isKitchenWallTopPlacementKind(placementKind);
    if (wallBandY) {
      // НШ1/НШ2: низ от датамов (customFloorClearanceMm после stamp), не потолок.
      targetBottomY =
        roomWorldPos.y +
        Math.max(0, resolveWallHungFloorClearanceMm(state.furniture.group, sectionAtPosition));
    } else if (isWallHungHighPlacementKind(placementKind)) {
      // Верх корпуса под потолочной планкой ? ceilingClearance.
      const topY =
        roomWorldPos.y +
        Math.max(0, Number(m.rawHeightMm) || 0) -
        Math.max(0, Number(m.topPlankMm) || 0) -
        Math.max(0, Number(m.ceilingClearanceMm) || 0);
      targetBottomY = topY - bodyH;
    } else {
      // Нижний навес: от пола + floorClearance (модуль > секция > 300).
      targetBottomY =
        roomWorldPos.y +
        Math.max(0, resolveWallHungFloorClearanceMm(state.furniture.group, sectionAtPosition));
    }
  }
  const dbgNiche =
    typeof window !== 'undefined' &&
    window.DEBUG_NICHE_Y === true &&
    sectionAtPosition &&
    sectionAtPosition.group;
  if (dbgNiche) {
    let nicheBottomY = null;
    try {
      nicheBottomY = new THREE.Box3().setFromObject(sectionAtPosition.group).min.y;
    } catch (_) {}
    const bboxNoAoDbg = computeFurnitureWorldBBoxNoAo(state.furniture.group);
    console.log('[NICHE-Y] placePendingFurniture', {
      sectionId: sectionAtPosition.id,
      nicheBottomY,
      roomWorldY: roomWorldPos.y,
      targetBottomY,
      placementKind,
      floorContactY: bboxMinY,
      bboxMinY_wholeNoAo: bboxNoAoDbg.min.y,
      deltaBeforeCorrection: targetBottomY - bboxMinY,
    });
  }
  if (Math.abs(bboxMinY - targetBottomY) > tolerance) {
    state.furniture.group.position.y += targetBottomY - bboxMinY;
    state.furniture.group.updateMatrixWorld(true);
  }
  invalidateGroupIconBBoxCache(state.furniture.group);
  __placeMark('after_floor_y');

  const secForLayout =
    sectionAtPosition ||
    (groupUD.sectionId != null
      ? state.customSections?.find((s) => s && s.id === groupUD.sectionId)
      : null);
  if (
    secForLayout &&
    placementKind === PLACEMENT_KIND.STANDALONE_FLOOR &&
    standalonePlaceHeightMm > 0 &&
    standalonePlaceCatalogType
  ) {
    try {
      resizeSectionForStandaloneHeight(
        secForLayout,
        standalonePlaceHeightMm,
        standalonePlaceCatalogType
      );
    } catch (e) {
      console.warn('[PLACE] resizeSectionForStandaloneHeight', e);
    }
  }
  try {
    const wallForTx =
      (secForLayout && secForLayout.wallName) ||
      groupUD.wallName ||
      state.ghostWall ||
      null;
    const kitchenNmAfter =
      isKitchenBaseGroup(state.furniture?.group) || isKitchenNmPlacement(furnitureData);
    if (kitchenNmAfter && wallForTx) {
      // НМ: без шкафного rebuildTransitions — только kitchen section afterPlace.
      afterKitchenPlaceLayout(wallForTx);
    } else {
      const placeUuid = state.furniture?.group?.uuid;
      const txOpts = {
        skipFurnitureDecorRefresh: true,
        placeLayoutOnly: true,
      };
      if (placeUuid) txOpts.furnitureLayoutOnlyUuids = [placeUuid];
      if (wallForTx) {
        rebuildTransitionsForWall(wallForTx, txOpts);
      } else {
        rebuildAllTransitions();
      }
    }
  } catch (e) {
    console.error('[PLACE] rebuild transitions / kitchen afterPlace failed', e);
  }
  __placeMark('after_transitions');

  if (
    secForLayout &&
    groupUD.zoneIndex != null &&
    Number.isFinite(Number(groupUD.zoneIndex)) &&
    secForLayout.division
  ) {
    try {
      // Спец L: зона из snap S+D (как призрак), не из устаревшего layout seg.
      const isCornerFit =
        isCornerCabPlace &&
        __isLShapeSpecialZone(secForLayout, groupUD.zoneIndex);
      if (isCornerFit) {
        ensureLShapeDivisionSegments(secForLayout.division);
        getLShapeSpecialSnapBounds(
          secForLayout.division,
          groupUD.zoneIndex
        );
        secForLayout._layoutCache = null;
      }
      if (isKitchenBaseGroup(state.furniture.group)) {
        // Не оставлять залипший scale.z (раньше жал столешку > щель у стены).
        try {
          const sc = state.furniture.group.scale;
          if (sc && Math.abs(Number(sc.z) - 1) > 0.001) {
            sc.z = 1;
            state.furniture.group.updateMatrixWorld(true);
          }
        } catch (_) {}
        placeKitchenModuleInCell(
          state.furniture.group,
          secForLayout,
          groupUD.zoneIndex,
          secForLayout.wallName || groupUD.wallName
        );
        // afterPlace раньше шёл до zoneIndex/rebuild — столешница и стыки от старого bbox.
        const wallNm = secForLayout.wallName || groupUD.wallName;
        if (wallNm) afterKitchenPlaceLayout(wallNm);
        try {
          ensureCellVolumesAfterNmPlace();
        } catch (_) {}
        try {
          if (groupUD.__kitchenCornerSideAtMinU != null) {
            __tintKitchenCornerReturnSlot(state.furniture.group);
          }
        } catch (_) {}
      } else if (
        String(groupUD.__kitchenUpperCornerSeat || '').toUpperCase() === 'B' ||
        groupUD.__kitchenUpperCornerCompanion === true
      ) {
        const c0 = Number(
          groupUD.__kitchenUpperCornerSeatBStartU ??
            groupUD.__kitchenUpperCornerCompanionStartU
        );
        const c1 = Number(
          groupUD.__kitchenUpperCornerSeatBEndU ??
            groupUD.__kitchenUpperCornerCompanionEndU
        );
        if (Number.isFinite(c0) && Number.isFinite(c1) && c1 - c0 > 50) {
          fitFurnitureBBoxToZoneBounds(
            state.furniture.group,
            c0,
            c1,
            secForLayout.wallName || groupUD.wallName,
            {
              zoneIndex: groupUD.zoneIndex,
              clampMaxToZoneEnd: true,
              anchorEdge:
                (groupUD.__kitchenUpperCornerSeatBAnchorEdge ||
                  groupUD.__kitchenUpperCornerCompanionAnchorEdge) === 'max'
                  ? 'max'
                  : 'min',
            }
          );
        }
      } else {
        fitFurnitureToSectionZone(state.furniture.group, secForLayout, groupUD.zoneIndex);
        // post-fit снова лезет в зазор 50 (ниша не clamp max>zoneEnd) — вернуть как призрак.
        if (isCornerFit) {
          __cldClampCornerCabinetToSpecialGap(
            state.furniture.group,
            secForLayout,
            groupUD.zoneIndex
          );
        }
      }
    } catch (e) {
      console.warn('[PLACE] post-layout zone fit', e);
    }
  }
  // Окно: после первой мебели layout как на прямой — обновить синюю разметку на полу.
  if (secForLayout?.windowLowSlot) {
    try {
      refreshSectionLayoutAfterZoneGesture(secForLayout);
    } catch (e) {
      console.warn('[PLACE] windowLowSlot marker refresh', e);
    }
  }
  // Split/merge: индексы соседей уже сдвинуты — подогнать их в новые слоты (иначе «не смещает»).
  if (
    secForLayout &&
    appliedGest &&
    (appliedGest.gesture === 'split' ||
      appliedGest.gesture === 'merge' ||
      appliedGest.gesture === 'eat-pack')
  ) {
    try {
      const layout =
        typeof window.__clodisComputeSectionLayout === 'function'
          ? window.__clodisComputeSectionLayout(secForLayout)
          : null;
      const placedUuid = state.furniture?.group?.uuid;
      state.scene.traverse((obj) => {
        if (!obj?.isGroup || !obj.userData?.isFurniture) return;
        if (String(obj.userData.sectionId) !== String(secForLayout.id)) return;
        if (obj.uuid === placedUuid) return;
        if (obj.userData.isEndCabinet) return;
        const zi = obj.userData.zoneIndex;
        if (typeof zi !== 'number') return;
        fitFurnitureToSectionZone(obj, secForLayout, zi, layout || undefined);
      });
      if (typeof window.updateCabinetMarkersForSection === 'function') {
        window.updateCabinetMarkersForSection(secForLayout.id);
      }
      if (typeof window.rebuildSectionZoneEditIconsForSection === 'function') {
        window.rebuildSectionZoneEditIconsForSection(secForLayout.id);
      }
    } catch (e) {
      console.warn('[PLACE] refit neighbors after gesture', e);
    }
  }
  if (secForLayout && typeof window.__cldSnapNicheFurnitureRoot === 'function' && state.furniture?.group) {
    try {
      window.__cldSnapNicheFurnitureRoot(state.furniture.group);
    } catch (_) {}
  }
  __placeMark('after_fit');

  // Soft/Spot — один debounce; студия уже bind до add.
  try {
    scheduleIkeaRoomLightSync();
  } catch (_) {}

  // Price async (не блокирует появление).
  __scheduleFurnitureLdspPricing(state.furniture);
  try {
    Promise.resolve(__recalcSectionFacadeTrimPricing()).then(() => __recalcRoomTotalPriceAndUpdateUi());
  } catch (_) {}

  // UI/метки/повторный studio — после появления шкафа (раньше сидели в «after_transitions»
  // и давали 200+ мс: refreshFurnitureCatalogNameLabels = setFromObject по всем шкафам).
  const placedGroup = state.furniture.group;
  const placedFurniture = state.furniture;
  const placedSectionSize = sectionSize;
  try {
    if (isKitchenBaseGroup(placedGroup)) {
      finalizeKitchenBaseAppearance(placedGroup);
      setTimeout(() => {
        try {
          finalizeKitchenBaseAppearance(placedGroup);
        } catch (_) {}
      }, 400);
      setTimeout(() => {
        try {
          finalizeKitchenBaseAppearance(placedGroup);
        } catch (_) {}
      }, 1200);
    }
  } catch (_) {}
  const raf =
    typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame
      : (cb) => setTimeout(cb, 0);
  raf(() => {
    const tUi0 = performance.now();
    try {
      if (window.DEBUG_HINGE_ROOM && typeof window.ClodisBuilder?.logHingeYCompare === 'function') {
        setTimeout(() => {
          try {
            window.ClodisBuilder.logHingeYCompare(placedGroup);
          } catch (_) {}
        }, 100);
      }
    } catch (_) {}
    try {
      __applyDebugColorsToFurnitureParts(placedGroup);
    } catch (_) {}
    try {
      const doorsOpenForStudio = window.__cldRoomDoorsDesiredOpen === true;
      applyRoomCabinetStudioLook(placedGroup, {
        doorsOpen: doorsOpenForStudio,
        syncLight: false,
      });
      applyStep5DecorToFurnitureGroupImmediate(placedGroup);
      refreshCabinetStudioAfterDecor(placedGroup, { syncLight: false });
      // Обклад/AutoTop уже освежили в transitions (_refreshTransitionTrimLookAfterRebuild).
      // Повторный syncAll по сцене — лишний лаг при посадке комода.
    } catch (_) {}
    try {
      syncCabinetPivotDebugVisibility();
    } catch (_) {}

    let finalBbox = null;
    try {
      finalBbox = computeFurnitureWorldBBoxNoAo(placedGroup);
      if (window.__CLD_DEBUG_PLACE === true) {
        let _meshCount = 0;
        placedGroup.traverse((c) => {
          if (c.isMesh) _meshCount++;
        });
        const _sizeNoAo = new THREE.Vector3();
        finalBbox.getSize(_sizeNoAo);
        console.log('[CLD][place] Мебель в сцене:', {
          meshCount: _meshCount,
          bboxSizeMmNoAo: _sizeNoAo.toArray(),
          sectionSizeUsedMm: placedSectionSize
            ? { x: placedSectionSize.x, y: placedSectionSize.y, z: placedSectionSize.z }
            : null,
        });
        console.log('? Мебель размещена');
      }
    } catch (_) {}

    __applyStep5DefaultsFromRoomConfigAsync()
      .then(() => {
        try {
          refreshFurnitureDecorsImmediate({ root: placedGroup });
          refreshCabinetStudioAfterDecor(placedGroup, { syncLight: false });
          scheduleIkeaRoomLightSync();
        } catch (_) {}
      })
      .catch(() => {});

    try {
      if (window.currentRoomStep === 4) buildStep4SectionEditIcons();
      const sid = placedGroup?.userData?.sectionId;
      if (sid != null && typeof rebuildSectionZoneEditIconsForSection === 'function') {
        rebuildSectionZoneEditIconsForSection(sid);
      }
    } catch (_) {}

    try {
      if (finalBbox && !finalBbox.isEmpty()) {
        const currentWidthMm = placedSectionSize?.x || finalBbox.max.x - finalBbox.min.x;
        const widthMm = Math.round(currentWidthMm);
        const center = finalBbox.getCenter(new THREE.Vector3());
        const topPos = new THREE.Vector3(center.x, finalBbox.max.y + 50, center.z);
        if (!window.furnitureWidthLabels) window.furnitureWidthLabels = [];
        const label = createDimensionLabel(
          `${widthMm} мм`,
          topPos,
          'section-dimension-label furniture-width-label'
        );
        if (label) {
          label.userData.furnitureGroup = placedGroup;
          window.furnitureWidthLabels.push(label);
        }
      }
    } catch (e) {
      console.warn('Р? Не удалось создать метку ширины мебели при размещении:', e);
    }

    try {
      upsertFurnitureCatalogNameLabel(placedGroup);
    } catch (_) {}
    try {
      mountHingeRoleMarkersOnFurniture(placedGroup);
    } catch (e) {
      console.warn('Р? Метки петель (по ролям):', e);
    }
    try {
      showFurniturePerimeterMarker(placedFurniture);
    } catch (_) {}

    try {
      const sid = placedGroup?.userData?.sectionId;
      if (sid != null) {
        if (typeof window.refreshWindowBridgeDimensionLabels === 'function') {
          window.refreshWindowBridgeDimensionLabels(sid);
        } else if (typeof window.refreshSectionDimensionLabelsForSection === 'function') {
          window.refreshSectionDimensionLabelsForSection(sid);
        }
      }
      if (typeof window.scheduleRebuildAllDimensionLines === 'function') {
        window.scheduleRebuildAllDimensionLines();
      }
    } catch (_) {}

    try {
      const foundSections = [];
      placedGroup.traverse((child) => {
        if (child.userData?.isSection) {
          foundSections.push({ group: child, name: child.userData.sectionName });
        }
      });
      let rootSection = null;
      for (const sectionData of foundSections) {
        let current = sectionData.group.parent;
        let hasSectionParent = false;
        while (current) {
          if (current.userData?.isSection) {
            hasSectionParent = true;
            break;
          }
          current = current.parent;
        }
        if (!hasSectionParent) {
          rootSection = sectionData;
          break;
        }
      }
      if (!rootSection && foundSections.length) rootSection = foundSections[foundSections.length - 1];
      if (rootSection) showSectionPerimeterMarker(rootSection.group, rootSection.name, true);
    } catch (_) {}

    const uiMs = Math.round(performance.now() - tUi0);
    if (uiMs >= 16) {
      console.log('[PLACE-POST] placeUi', { ms: uiMs });
    }
  });

  __placeDone();
  try {
    if (typeof window !== 'undefined' && typeof window.__cldMarkRoomDraftDirty === 'function') {
      window.__cldMarkRoomDraftDirty('furniture_place');
    }
  } catch (_) {}
}

// Extract category IDs from catalog item (supports various formats)
function getItemCategoryIds(item) {
  // Категории могут лежать на верхнем уровне или внутри item.data (формат catalog_26.json)
  const cid =
    item.categoryId != null
      ? item.categoryId
      : item.category_id != null
      ? item.category_id
      : null;
  if (cid != null) return [cid];

  // Проверяем item.category и item.data.category
  const cat = item.category != null ? item.category : item.data?.category;
  if (cat == null) return [];
  if (typeof cat === 'number') return [cat];
  if (cat.id != null) return [cat.id];
  if (!Array.isArray(cat)) return [];
  return cat
    .map((c) => {
      if (typeof c === 'number') return c;
      if (typeof c === 'string' && c.trim() !== '' && !isNaN(Number(c))) {
        return Number(c);
      }
      if (c && c.id != null) return c.id;
      return null;
    })
    .filter((x) => x != null);
}

function getDoorCategoryIdsForCatalogType(catalogType) {
  const ct = String(catalogType || '').trim();
  if (!ct) return null;
  try {
    if (!window.__cldDoorCatIdsByCatalog) window.__cldDoorCatIdsByCatalog = {};
    if (window.__cldDoorCatIdsByCatalog[ct]) {
      return window.__cldDoorCatIdsByCatalog[ct];
    }
    const key = ct.startsWith('catalog_') ? `catalogCategories_${ct}` : `catalogCategories_catalog_${ct}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return null;
    let singleId = null;
    let doubleId = null;
    for (const c of arr) {
      const name = String(c.name || c.label || '').toLowerCase();
      const id = Number(c.id != null ? c.id : c.category_id);
      if (!Number.isFinite(id)) continue;
      if (/однодвер|одноствор/.test(name)) singleId = id;
      if (/двухдвер|двуствор/.test(name)) doubleId = id;
    }
    if (singleId != null && doubleId != null) {
      const pair = { single: singleId, double: doubleId };
      window.__cldDoorCatIdsByCatalog[ct] = pair;
      return pair;
    }
  } catch (_) {}
  return null;
}

/** Метка из data.doorKind (приоритет) или теги категорий — для любого типа каталога. */
export function getCatalogItemDoorKind(item, catalogType) {
  const raw = item?.catalogItem || item;
  const d = parseCatalogItemDataField(raw);
  const dk = d.doorKind || raw?.doorKind;
  if (dk === 'single' || dk === 'double') return dk;
  const ct =
    catalogType ||
    raw?.catalog_type ||
    raw?.catalogType ||
    raw?.element_type ||
    '';
  const doorIds =
    getDoorCategoryIdsForCatalogType(ct) || getStep4CatalogCategoryAliases();
  const ids = getItemCategoryIds(raw);
  if (!ids.length) return null;
  const singleId = doorIds.single ?? doorIds.singleDoorCategoryId;
  const doubleId = doorIds.double ?? doorIds.doubleFacadeCategoryId;
  const has = (id) => ids.indexOf(Number(id)) >= 0 || ids.indexOf(id) >= 0;
  if (has(doubleId)) return 'double';
  if (has(singleId)) return 'single';
  return null;
}

/**
 * Определяет тип двери модуля (каталог / pending furniture).
 * Возвращает 'single' | 'double' | null (null = не блокируем размещение).
 */
function inferModuleDoorKindFromCategories(furnitureData) {
  if (!furnitureData) return null;
  const fromMeta = getCatalogItemDoorKind(furnitureData);
  if (fromMeta) return fromMeta;
  const raw = furnitureData.catalogItem || furnitureData;
  let planRoot = null;
  try {
    const plan = getClodisDataForBuild(furnitureData);
    if (Array.isArray(plan) && plan.length > 0) planRoot = plan[0];
  } catch (_) {}
  const sectionSize =
    furnitureData.sectionSize || extractSectionSizeFromFurnitureData(furnitureData);
  const widthMm = catalogItemWidthMmForDoorFilter(raw, planRoot, sectionSize);
  if (!widthMm) return null;
  const { singleMaxMm, doubleMinMm } = getCabinetDoorWidthBoundsFromRoomSteps();
  if (widthMm >= doubleMinMm) return 'double';
  if (widthMm <= singleMaxMm) return 'single';
  return null;
}

/** Отмена размещения + переключение пилюли ряда «одн./дву.» под тип зоны. */
function cancelPlacementAndSwitchCatalogForZone(switchKind) {
  const kind =
    switchKind === 'single' || switchKind === 'double' ? switchKind : null;
  if (kind && typeof window.__clodisAutoSwitchCatalogForZone === 'function') {
    window.__clodisAutoSwitchCatalogForZone(kind);
  }
  cancelFurniturePlacement();
}

// Check whether filterCategoryId is included in item categories
function itemMatchesCategoryFilter(item, filterCategoryId) {
  if (filterCategoryId == null) return true;
  const ids = getItemCategoryIds(item);
  if (ids.length === 0) return false;
  return (
    ids.indexOf(filterCategoryId) >= 0 ||
    ids.indexOf(Number(filterCategoryId)) >= 0
  );
}

/**
 * Двухдверный по ширине корпус, но в категориях только «без дверей» (каркас под двустворку, фасадов нет).
 * Пилюля с categoryId «Двухдверные» + фильтр double иначе их отсекает.
 * Настройка: room_steps_config.steps[step4].catalog_filter
 */
function getStep4CatalogCategoryAliases() {
  const def = {
    doubleFacadeCategoryId: 10,
    doubleOpenBodyCategoryIds: [8],
    singleDoorCategoryId: 9,
  };
  try {
    let cfg = null;
    if (typeof window.getRoomStepsConfig === 'function') {
      cfg = window.getRoomStepsConfig();
    }
    if (!cfg || !Array.isArray(cfg.steps)) {
      const raw = localStorage.getItem('room_steps_config');
      if (raw) cfg = JSON.parse(raw);
    }
    const s4 =
      cfg && Array.isArray(cfg.steps)
        ? cfg.steps.find((s) => s.stepId === 4)
        : null;
    const cf = s4 && s4.catalog_filter;
    if (!cf || typeof cf !== 'object') return def;
    const df = Number(cf.double_facade_category_id);
    const open = cf.double_open_body_category_ids;
    const sf = Number(cf.single_door_category_id);
    return {
      doubleFacadeCategoryId:
        Number.isFinite(df) && df > 0 ? df : def.doubleFacadeCategoryId,
      doubleOpenBodyCategoryIds: Array.isArray(open)
        ? open
            .map((x) => Number(x))
            .filter((n) => Number.isFinite(n) && n > 0)
        : def.doubleOpenBodyCategoryIds,
      singleDoorCategoryId:
        Number.isFinite(sf) && sf > 0 ? sf : def.singleDoorCategoryId,
    };
  } catch (_) {
    return def;
  }
}

/** В пилюле «двойные»: не показывать модули только с тегом «однодверные» без «двухдверные» (ошибка разметки в админке). */
function itemExcludedFromDoubleDoorCatalogByTags(item, catalogType) {
  const perCatalog = getDoorCategoryIdsForCatalogType(catalogType);
  const aliases = getStep4CatalogCategoryAliases();
  const singleDoorCategoryId =
    perCatalog?.single ?? aliases.singleDoorCategoryId;
  const doubleFacadeCategoryId =
    perCatalog?.double ?? aliases.doubleFacadeCategoryId;
  const ids = getItemCategoryIds(item);
  const has = (x) =>
    ids.indexOf(x) >= 0 || ids.indexOf(Number(x)) >= 0;
  if (!has(singleDoorCategoryId)) return false;
  if (has(doubleFacadeCategoryId)) return false;
  return true;
}

function itemMatchesCategoryFilterWithDoubleOpenShell(
  item,
  filterCategoryId,
  cabinetDoorFilter,
  widthMm
) {
  if (filterCategoryId == null) return true;
  if (itemMatchesCategoryFilter(item, filterCategoryId)) return true;
  const f = cabinetDoorFilter && String(cabinetDoorFilter).trim();
  if (f !== 'double') return false;
  if (!itemMatchesCabinetDoorFilter(widthMm, 'double')) return false;
  const { doubleFacadeCategoryId, doubleOpenBodyCategoryIds } =
    getStep4CatalogCategoryAliases();
  const fid = Number(filterCategoryId);
  if (fid !== Number(doubleFacadeCategoryId)) return false;
  const ids = getItemCategoryIds(item);
  return doubleOpenBodyCategoryIds.some(
    (oc) => ids.indexOf(oc) >= 0 || ids.indexOf(Number(oc)) >= 0
  );
}

/** Собрать список условий пилюль: либо массив объектов, либо одиночные аргументы (обратная совместимость). */
function buildStep4PillFilterList(
  filterCategoryId,
  cabinetDoorFilter,
  orFilterCategoryId
) {
  if (Array.isArray(filterCategoryId)) {
    return filterCategoryId
      .filter((p) => p && typeof p === 'object')
      .map((p) => ({
        filterCategoryId:
          p.filterCategoryId != null ? p.filterCategoryId : null,
        orFilterCategoryId:
          p.orFilterCategoryId != null ? p.orFilterCategoryId : null,
        cabinetDoorFilter:
          p.cabinetDoorFilter === 'single' || p.cabinetDoorFilter === 'double'
            ? p.cabinetDoorFilter
            : null,
      }));
  }
  if (
    filterCategoryId != null ||
    cabinetDoorFilter != null ||
    orFilterCategoryId != null
  ) {
    const d =
      cabinetDoorFilter === 'single' || cabinetDoorFilter === 'double'
        ? cabinetDoorFilter
        : null;
    return [
      {
        filterCategoryId: filterCategoryId ?? null,
        orFilterCategoryId: orFilterCategoryId ?? null,
        cabinetDoorFilter: d,
      },
    ];
  }
  return [];
}

/** Элемент каталога должен удовлетворять всем выбранным пилюлям сразу (И). */
function itemMatchesAllStep4Pills(item, pillFilterList, widthMmDoor, catalogType) {
  if (!pillFilterList || pillFilterList.length === 0) return true;
  for (let i = 0; i < pillFilterList.length; i++) {
    const pf = pillFilterList[i];
    if (
      !itemMatchesStep4CatalogPill(
        item,
        pf.filterCategoryId,
        pf.cabinetDoorFilter,
        widthMmDoor,
        pf.orFilterCategoryId,
        catalogType
      )
    ) {
      return false;
    }
  }
  return true;
}

/** Пилюля шага 4: сначала ширина по «одинар/двойн», затем категория (+ смягчение для корпуса без фасадов).
 * @param {number|null} orCategoryId — вторая категория (ИЛИ-логика): если задана, достаточно совпадения с ней. */
function itemMatchesStep4CatalogPill(
  item,
  filterCategoryId,
  cabinetDoorFilter,
  widthMm,
  orCategoryId = null,
  catalogType = null
) {
  const f = cabinetDoorFilter && String(cabinetDoorFilter).trim();
  const ctNorm = String(catalogType || '')
    .replace(/^catalog_/i, '')
    .trim();
  // Угловые (44): один модуль на спец-зону — не режем пилюлей одн./дву. и категориями
  // (у «Стол угловой» category часто пустой > иначе сетка пустая при «Однодверные»).
  const skipDoorPill =
    ctNorm === '44' ||
    isLCornerCabinetModule({ catalogItem: item, catalogType });
  if (skipDoorPill) return true;
  if (f === 'single' || f === 'double') {
    const labeled = getCatalogItemDoorKind(item, catalogType);
    if (labeled) {
      if (labeled !== f) return false;
    } else if (!itemMatchesCabinetDoorFilter(widthMm, f)) {
      return false;
    }
  }
  if (f === 'double' && itemExcludedFromDoubleDoorCatalogByTags(item, catalogType)) {
    return false;
  }
  // Primary OR secondary category
  if (
    orCategoryId != null &&
    itemMatchesCategoryFilter(item, orCategoryId)
  ) {
    return true;
  }
  return itemMatchesCategoryFilterWithDoubleOpenShell(
    item,
    filterCategoryId,
    f || null,
    widthMm
  );
}

/**
 * Пороги «одинарный / двойной» по ширине корпуса: из настроек шага 4 (section_division),
 * иначе как раньше: одинарный Ф600, двойной 601–1200.
 * Иначе пилюля «двойные» (подпись 800–1200 из админки) и фильтр каталога расходятся — сетка пустая.
 */
function getCabinetDoorWidthBoundsFromRoomSteps() {
  const fallback = {
    singleMaxMm: 600,
    doubleMinMm: 601,
    doubleMaxMm: 1200,
  };
  let cfg = null;
  try {
    if (typeof window.getRoomStepsConfig === 'function') {
      cfg = window.getRoomStepsConfig();
    }
    if (!cfg || !Array.isArray(cfg.steps)) {
      const raw = localStorage.getItem('room_steps_config');
      if (raw) cfg = JSON.parse(raw);
    }
    const s4 =
      cfg && Array.isArray(cfg.steps)
        ? cfg.steps.find((s) => s.stepId === 4)
        : null;
    const sd = s4 && s4.section_division;
    if (!sd || typeof sd !== 'object') return fallback;
    const singleMax =
      Number(sd.single_max_mm) > 0
        ? Number(sd.single_max_mm)
        : fallback.singleMaxMm;
    const doubleMax =
      Number(sd.max_mm) > 0 ? Number(sd.max_mm) : fallback.doubleMaxMm;
    let doubleMin =
      Number(sd.min_mm) > 0 ? Number(sd.min_mm) : singleMax + 1;
    if (doubleMin <= singleMax) doubleMin = singleMax + 1;
    if (!Number.isFinite(doubleMax) || doubleMax < doubleMin) {
      return fallback;
    }
    return {
      singleMaxMm: singleMax,
      doubleMinMm: doubleMin,
      doubleMaxMm: doubleMax,
    };
  } catch (_) {
    return fallback;
  }
}

function catalogItemWidthMmForDoorFilter(item, clodisData, sectionSize) {
  let w = 0;
  if (
    clodisData &&
    clodisData.size &&
    typeof clodisData.size.x === 'number'
  ) {
    w = Math.round(clodisData.size.x);
  } else if (sectionSize && Number.isFinite(sectionSize.x)) {
    w = Math.round(sectionSize.x);
  }
  const fromCat = getCatalogDimensionMm(item, 'width');
  if (Number.isFinite(fromCat) && fromCat > 0) {
    w = Math.round(fromCat);
  }
  return Number.isFinite(w) && w > 0 ? w : 0;
}

/**
 * @param {string|null|undefined} cabinetDoorFilter — '' | 'single' | 'double'
 * Границы берутся из room_steps_config.step4.section_division (single_max_mm, min_mm, max_mm).
 */
function itemMatchesCabinetDoorFilter(widthMm, cabinetDoorFilter) {
  const f = cabinetDoorFilter && String(cabinetDoorFilter).trim();
  if (!f) return true;
  if (!Number.isFinite(widthMm) || widthMm <= 0) return false;
  const { singleMaxMm, doubleMinMm, doubleMaxMm } =
    getCabinetDoorWidthBoundsFromRoomSteps();
  if (f === 'single') {
    return widthMm <= singleMaxMm;
  }
  if (f === 'double') {
    return widthMm >= doubleMinMm && widthMm <= doubleMaxMm;
  }
  return true;
}

/**
 * Удаляет из localStorage все ключи catalog_* (но не catalogCategories_*, не catalogs_keys).
 * Вызывать из консоли конструктора: window.clearCatalogCache()
 * После вызова нужно нажать «Выгрузить всё в конструктор» и перезагрузить шаг 4.
 */
window.clearCatalogCache = function () {
  const removed = [];
  const keep = [];
  for (let _i = localStorage.length - 1; _i >= 0; _i--) {
    const _k = localStorage.key(_i);
    if (
      _k &&
      _k.startsWith('catalog_') &&
      !_k.startsWith('catalogCategories_') &&
      _k !== 'catalogs_keys'
    ) {
      localStorage.removeItem(_k);
      removed.push(_k);
    } else if (_k) {
      keep.push(_k);
    }
  }
  console.log(
    '[clearCatalogCache] Удалены ключи localStorage:',
    removed.length ? removed.join(', ') : '(нет)'
  );
  console.log('[clearCatalogCache] Остались:', keep.join(', '));
  if (removed.length === 0) {
    console.warn('[clearCatalogCache] Нет ключей catalog_* для удаления — localStorage уже чистый.');
  } else {
    console.warn(
      '[clearCatalogCache] Готово. Нажмите «Выгрузить всё в конструктор» в админке и перейдите на шаг 4 заново.'
    );
  }
  return { removed, keep };
};

/** Преобразовать элемент catalog_N.json > формат localStorage комнаты (как export_all). */
function transformRawCatalogItemForRoomExport(it) {
  if (!it || typeof it !== 'object') return null;
  const parsedData = parseCatalogItemDataField(it);
  const data =
    parsedData && Object.keys(parsedData).length
      ? { ...parsedData, ...it, data: parsedData }
      : it.data && typeof it.data === 'object' && !Array.isArray(it.data)
        ? it.data
        : it;
  const cs = data.constructor_structure || it.constructor_structure;
  let clodisJSON = [];
  // Паритет с админкой: children > template > spec > clodisJSON (не наоборот).
  if (cs && typeof cs === 'object') {
    if (Array.isArray(cs.children) && cs.children.length) clodisJSON = cs.children;
    else if (cs.template && Array.isArray(cs.template.structure) && cs.template.structure.length) {
      clodisJSON = cs.template.structure;
    } else if (cs.spec?.template?.tree && Array.isArray(cs.spec.template.tree)) {
      clodisJSON = cs.spec.template.tree;
    } else if (Array.isArray(cs)) clodisJSON = cs;
  }
  if (!clodisJSON.length) {
    const ppj = readClodisJSON(it) ?? readClodisJSON(data);
    if (Array.isArray(ppj) && ppj.length) clodisJSON = ppj;
  }
  const w = parseInt(data.width ?? it.width ?? 0, 10) || 600;
  const h = parseInt(data.height ?? it.height ?? 0, 10) || 2400;
  const d = parseInt(data.depth ?? it.depth ?? 0, 10) || 600;
  if (!Array.isArray(clodisJSON) || clodisJSON.length === 0) {
    clodisJSON = buildMinimalCatalogClodisJSON(w, h, d, it.id ?? data.id);
  }
  const showIn = data.show_in_constructor ?? it.show_in_constructor ?? '1';
  const out = {
    id: it.id ?? data.id,
    name: data.name ?? it.name ?? '',
    clodisJSON,
    params: { sectionSize: { x: w, y: h, z: d } },
    show_in_constructor: showIn,
    showInRoom: showIn === '1' || showIn === true,
    category: data.category ?? it.category,
    width: w,
    height: h,
    depth: d,
  };
  if (data.roomTags ?? it.roomTags) out.roomTags = data.roomTags ?? it.roomTags;
  if (data.doorKind ?? it.doorKind) out.doorKind = data.doorKind ?? it.doorKind;
  if (data.unifiedFacade === true || it.unifiedFacade === true) out.unifiedFacade = true;
  if (data.placementKind ?? it.placementKind) out.placementKind = data.placementKind ?? it.placementKind;
  if (data.drawerStack ?? it.drawerStack) {
    out.drawerStack = data.drawerStack ?? it.drawerStack;
  }
  if (data.shelfStack ?? it.shelfStack) {
    out.shelfStack = data.shelfStack ?? it.shelfStack;
  }
  if (data.interiorLayout ?? it.interiorLayout) {
    out.interiorLayout = data.interiorLayout ?? it.interiorLayout;
  }
  if (data.interiorTemplates ?? it.interiorTemplates) {
    out.interiorTemplates = data.interiorTemplates ?? it.interiorTemplates;
  }
  const vars = readClodisVariables(data) ?? readClodisVariables(it);
  if (vars) out.clodisVariables = vars;
  const drawerNoHandle =
    data.drawerNoHandle === true ||
    data.drawerNoHandle === 1 ||
    data.drawerNoHandle === '1' ||
    it.drawerNoHandle === true ||
    it.drawerNoHandle === 1 ||
    it.drawerNoHandle === '1';
  if (parsedData && Object.keys(parsedData).length) {
    out.data = { ...parsedData };
    if (drawerNoHandle) out.data.drawerNoHandle = true;
  } else if (drawerNoHandle) {
    out.data = { drawerNoHandle: true };
  }
  if (drawerNoHandle) out.drawerNoHandle = true;
  const icon = data.icon ?? it.icon ?? data.icon_url ?? it.icon_url;
  if (icon) out.icon = icon;
  const iconAspect = data.iconAspect ?? it.iconAspect;
  if (iconAspect) out.iconAspect = iconAspect;
  migrateCatalogItemStorageKeys(out);
  return out;
}

/** Диск /catalog_items/catalog_N.json — если API пуст (ВМУ 54 и др. кухня 4x/5x). */
async function bootstrapCatalogFromDiskJson(catalogTypeNorm) {
  const typeKey = 'catalog_' + catalogTypeNorm;
  try {
    const res = await fetch(
      '/catalog_items/' +
        encodeURIComponent(typeKey) +
        '.json?t=' +
        Date.now(),
      { cache: 'no-store' }
    );
    if (!res.ok) {
      console.warn('[loadSavedModels] disk HTTP', res.status, typeKey);
      return 0;
    }
    const arr = await res.json();
    if (!Array.isArray(arr) || !arr.length) return 0;
    const list = arr.slice();
    migrateCatalogArrayStorageKeys(list);
    localStorage.setItem(typeKey, JSON.stringify(list));
    console.log(
      '[loadSavedModels] bootstrap с диска: ' + typeKey + ' > ' + list.length + ' шт.'
    );
    return list.length;
  } catch (e) {
    console.warn('[loadSavedModels] bootstrap disk failed:', e);
    return 0;
  }
}

async function bootstrapCatalogFromItemsApi(catalogTypeNorm) {
  const typeKey = 'catalog_' + catalogTypeNorm;
  try {
    const res = await fetch(
      '/api/catalog/items_get/' + encodeURIComponent(typeKey) + '?ts=' + Date.now(),
      { cache: 'no-store' }
    );
    if (!res.ok) {
      console.warn('[loadSavedModels] items_get HTTP', res.status, typeKey);
      return bootstrapCatalogFromDiskJson(catalogTypeNorm);
    }
    const payload = await res.json();
    const rawItems = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.items)
        ? payload.items
        : [];
    if (!rawItems.length) {
      return bootstrapCatalogFromDiskJson(catalogTypeNorm);
    }
    const list = rawItems.map(transformRawCatalogItemForRoomExport).filter(Boolean);
    migrateCatalogArrayStorageKeys(list);
    localStorage.setItem(typeKey, JSON.stringify(list));
    console.log('[loadSavedModels] bootstrap из items_get: ' + typeKey + ' > ' + list.length + ' шт.');
    if (typeKey === 'catalog_33') {
      try {
        syncDrawerCatalog33ToGlobalCache();
        await ensureDrawerCatalog33FreshFromApi();
      } catch (_) {}
    }
    return list.length;
  } catch (e) {
    console.warn('[loadSavedModels] bootstrap items_get failed:', e);
    return bootstrapCatalogFromDiskJson(catalogTypeNorm);
  }
}

/** Подтянуть catalog_* из API (roomTags, doorKind и т.д.) — без ручной «Выгрузить всё». */
export async function ensureConstructorCatalogFresh(catalogTypeNorm) {
  if (!catalogTypeNorm) return;
  const catKey = 'catalog_' + catalogTypeNorm;
  const now = Date.now();
  const meta = _catalogFreshMeta.get(catalogTypeNorm);
  if (meta?.promise) return meta.promise;
  const rev = _readCatalogRev();
  const poisoned = _catalogLsLooksPoisoned(catKey);
  const revStale = rev > 0 && (!meta?.at || rev > meta.at);
  if (
    !poisoned &&
    !revStale &&
    meta?.at &&
    now - meta.at < CATALOG_FRESH_TTL_MS
  ) {
    try {
      const raw = localStorage.getItem(catKey);
      if (raw && JSON.parse(raw).length > 0) return;
    } catch (_) {}
  }

  const run = (async () => {
  try {
    const res = await fetch(
      '/api/catalog/export_all_for_constructor?ts=' + Date.now(),
      { cache: 'no-store' }
    );
    if (!res.ok) {
      console.warn(
        '[loadSavedModels] export API HTTP ' + res.status + ' — bootstrap из items_get'
      );
      await bootstrapCatalogFromItemsApi(catalogTypeNorm);
      try {
        syncDrawerCatalog33ToGlobalCache();
        await ensureDrawerCatalog33FreshFromApi();
      } catch (_) {}
      return;
    }
    const data = await res.json();
    if (data.catalogs && typeof data.catalogs === 'object') {
      Object.keys(data.catalogs).forEach((key) => {
        const arr = data.catalogs[key];
        const list = Array.isArray(arr) ? arr.slice() : [];
        migrateCatalogArrayStorageKeys(list);
        localStorage.setItem(key, JSON.stringify(list));
      });
    }
    if (data.categories && typeof data.categories === 'object') {
      Object.keys(data.categories).forEach((key) => {
        localStorage.setItem(
          'catalogCategories_' + key,
          JSON.stringify(data.categories[key])
        );
      });
    }
    if (window.__cldDoorCatIdsByCatalog) {
      window.__cldDoorCatIdsByCatalog = {};
    }
    let n = (() => {
      try {
        const raw = localStorage.getItem(catKey);
        return raw ? JSON.parse(raw).length : 0;
      } catch (_) {
        return 0;
      }
    })();
    if (n === 0) {
      n = await bootstrapCatalogFromItemsApi(catalogTypeNorm);
    }
    if (n === 0) {
      n = await bootstrapCatalogFromDiskJson(catalogTypeNorm);
    }
    // Угол: 54 = верхний G (Навесные угловые), 44 = низ НМУ.
    // Диск /catalog_items — источник после «Выгрузить в конструктор»; API часто пустой/старый.
    for (const fk of ['44', '54']) {
      const filled = await bootstrapCatalogFromDiskJson(fk);
      if (fk === catalogTypeNorm && filled > 0) n = filled;
    }
    console.log(
      '[loadSavedModels] каталог синхронизирован с сервера: ' + catKey + ' > ' + n + ' шт.'
    );
    try {
      syncDrawerCatalog33ToGlobalCache();
      await ensureDrawerCatalog33FreshFromApi();
    } catch (_) {}
    // После свежего export — пересобрать стоящую мебель из каталога (админ = комната).
    try {
      if (typeof window.__cldRebuildFurnitureForStep4Toggles === 'function') {
        window.__cldRebuildFurnitureForStep4Toggles();
      }
    } catch (_) {}
  } catch (e) {
    console.warn('[loadSavedModels] синхронизация каталога не удалась:', e);
    await bootstrapCatalogFromItemsApi(catalogTypeNorm);
    for (const fk of ['44', '54']) {
      await bootstrapCatalogFromDiskJson(fk);
    }
    try {
      syncDrawerCatalog33ToGlobalCache();
      await ensureDrawerCatalog33FreshFromApi();
    } catch (_) {}
  }
  })();

  _catalogFreshMeta.set(catalogTypeNorm, { at: meta?.at || 0, promise: run });
  try {
    await run;
    _catalogFreshMeta.set(catalogTypeNorm, { at: Date.now(), promise: null });
  } catch (e) {
    _catalogFreshMeta.set(catalogTypeNorm, { at: meta?.at || 0, promise: null });
    throw e;
  }
}

/**
 * Load saved models from storage and populate catalog grid
 * @param {string|null} catalogType - catalog type (folderId from step 3), e.g. "26"
 * @param {HTMLElement|null} targetGrid - container for items (defaults to #cabinets-grid)
 * @param {number|null} filterCategoryId - subcategory filter from pill buttons
 * @param {string|null} [cabinetDoorFilter] - 'single' | 'double' | null — фильтр по ширине (одна пилюля)
 * @param {number|null} [orFilterCategoryId] — вторая категория ИЛИ (одна пилюля)
 * Также можно передать в `filterCategoryId` массив пилюль:
 *   `{ filterCategoryId, orFilterCategoryId?, cabinetDoorFilter? }[]` — условия объединяются по И.
 */
export async function loadSavedModels(
  catalogType = null,
  targetGrid = null,
  filterCategoryId = null,
  cabinetDoorFilter = null,
  orFilterCategoryId = null
) {
  const pillFilterList = buildStep4PillFilterList(
    filterCategoryId,
    cabinetDoorFilter,
    orFilterCategoryId
  );

  const cabinetsGrid =
    targetGrid || document.getElementById('cabinets-grid');
  if (!cabinetsGrid) {
    console.warn('Р? Элемент для каталога не найден');
    return;
  }
  cabinetsGrid.innerHTML = '';

  /** Нормализованный id типа каталога (шаг 3): "26", не "catalog_26" и не пробелы. */
  let catalogTypeNorm =
    catalogType != null && String(catalogType).trim() !== ''
      ? String(catalogType).trim()
      : '';
  if (catalogTypeNorm.startsWith('catalog_')) {
    catalogTypeNorm = catalogTypeNorm.replace(/^catalog_/, '');
  }

  const hasExplicitCatalogType = catalogTypeNorm.length > 0;

  // Доп. фильтры торцевых (категория/тег) — только когда открыт именно их каталог.
  // Другие каталоги при открытом слоте показываем как обычно.
  let endCabMode = null;
  try {
    const mode =
      typeof window !== 'undefined' && window.__cldEndCabinetCatalogMode?.active
        ? window.__cldEndCabinetCatalogMode
        : null;
    const modeKey = String(mode?.catalogType || '')
      .trim()
      .replace(/^catalog_/, '');
    endCabMode = mode && modeKey && modeKey === catalogTypeNorm ? mode : null;
  } catch (_) {
    endCabMode = null;
  }

  console.log(
    '[loadSavedModels] catalogType=' +
      catalogType +
      ' > norm="' +
      catalogTypeNorm +
      '", pillFilterList=' +
      JSON.stringify(pillFilterList)
  );

  // Diagnostics: which catalogs exist in localStorage
  const catalogKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('catalog_') && k !== 'catalogs_keys') {
      catalogKeys.push(k);
    }
  }
  const diagKey = hasExplicitCatalogType ? 'catalog_' + catalogTypeNorm : null;
  const diagJson = diagKey ? localStorage.getItem(diagKey) : null;
  const diagArr = diagJson
    ? (() => {
        try {
          const a = JSON.parse(diagJson);
          return Array.isArray(a) ? a : [];
        } catch (e) {
          return [];
        }
      })()
    : [];
  console.log(
    '[ШКАФ-ДИАГНОСТИКА] localStorage: ключи=' +
      catalogKeys.join(', ') +
      ' | catalogType=' +
      catalogType +
      ' | каталог ' +
      (diagKey || '—') +
      ' существует=' +
      !!diagJson +
      ' элементов=' +
      diagArr.length +
      ' | элементы: ' +
      diagArr
        .slice(0, 5)
        .map(
          (it) =>
            (it?.name || '?') +
            (readClodisJSON(it) ? '?clodis' : '?нетClodis') +
            (it?.roomTags?.categories?.length
              ? '?roomTags'
              : '?нетRoomTags')
        )
        .join(', ')
  );

  if (hasExplicitCatalogType) {
    await ensureConstructorCatalogFresh(catalogTypeNorm);
    const freshJson = localStorage.getItem('catalog_' + catalogTypeNorm);
    if (freshJson) {
      try {
        const freshArr = JSON.parse(freshJson);
        if (Array.isArray(freshArr)) {
          migrateCatalogArrayStorageKeys(freshArr);
          diagArr.length = 0;
          freshArr.forEach((it) => diagArr.push(it));
        }
      } catch (_) {}
    }
  } else {
    // Однократная нормализация всех catalog_* в localStorage (старые ключи v1)
    for (let mi = 0; mi < localStorage.length; mi++) {
      const mk = localStorage.key(mi);
      if (!mk || !mk.startsWith('catalog_') || mk.startsWith('catalogCategories_')) continue;
      if (mk === 'catalogs_keys') continue;
      try {
        const raw = localStorage.getItem(mk);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) continue;
        migrateCatalogArrayStorageKeys(parsed);
        localStorage.setItem(mk, JSON.stringify(parsed));
      } catch (_) {}
    }
  }

  let totalItems = 0;

  try {
    // 1. Load models from "savedModels" (legacy) — только если нет выбранной папки каталога.
    // Раньше проверялось !catalogType: при пустой строке или потере folderId подмешивались старые savedModels > «лишние» шкафы на шаге 4.
    if (!hasExplicitCatalogType) {
      const savedModelsKey = 'savedModels';
      const savedModelsJson = localStorage.getItem(savedModelsKey);
      if (savedModelsJson) {
        try {
          const savedModels = JSON.parse(savedModelsJson);
          if (Array.isArray(savedModels)) {
            console.log(
              `?? Загружено ${savedModels.length} сохраненных моделей из savedModels`
            );

            savedModels.forEach((modelData, index) => {
              if (!modelData || !modelData.metadata) {
                console.warn(
                  `Р? Модель ${index} не имеет метаданных, пропускаем`
                );
                return;
              }

              const metadata = modelData.metadata;
              const size = metadata.size || {};
              const widthMm = size.width || 600;
              const heightMm = size.height || 2400;
              const synth = { category: [] };
              if (
                !itemMatchesAllStep4Pills(synth, pillFilterList, widthMm)
              ) {
                return;
              }

              const cabinetItem = createCabinetItem({
                id: 'saved-model-' + index,
                name: metadata.name || 'Модель ' + (index + 1),
                width: `${widthMm}?${heightMm} мм`,
                price: '0,-',
                savedModelData: modelData,
                iconOnly: cabinetsGrid.id === 'step4-cabinets-grid',
              });

              cabinetsGrid.appendChild(cabinetItem);
              totalItems++;
              console.log(
                `  ? Добавлена в каталог: "${metadata.name}" (${widthMm}?${heightMm} мм)`
              );
            });
          }
        } catch (e) {
          console.warn('Р? Ошибка парсинга savedModels:', e);
        }
      }
    }

    // 2. moduleItems from room_steps_config step 4
    const config =
      typeof window.getRoomStepsConfig === 'function'
        ? window.getRoomStepsConfig()
        : null;
    const step4 =
      config && config.steps
        ? config.steps.find((s) => s.stepId === 4)
        : null;
    const moduleItems =
      step4 && Array.isArray(step4.moduleItems) && step4.moduleItems.length > 0
        ? step4.moduleItems
            .slice()
            .sort((a, b) => (a.order || 0) - (b.order || 0))
        : null;

    // moduleItems — только без выбранного типа каталога (режим «Модули»).
    if (moduleItems && !hasExplicitCatalogType) {
      try {
        let filteredMods = moduleItems;
        if (pillFilterList.length === 1) {
          const only = pillFilterList[0];
          if (only.filterCategoryId != null) {
            filteredMods = moduleItems.filter(
              (m) =>
                m.categoryId != null &&
                m.categoryId === only.filterCategoryId
            );
          }
        } else if (pillFilterList.length > 1) {
          const catSet = new Set();
          pillFilterList.forEach((p) => {
            if (p.filterCategoryId != null) {
              catSet.add(Number(p.filterCategoryId));
            }
            if (p.orFilterCategoryId != null) {
              catSet.add(Number(p.orFilterCategoryId));
            }
          });
          if (catSet.size > 0) {
            filteredMods = moduleItems.filter(
              (m) =>
                m.categoryId != null && catSet.has(Number(m.categoryId))
            );
          }
        }
        let modCatalog = null;
        const catalogKey = catalogType ? 'catalog_' + catalogType : null;
        if (catalogKey) {
          const modCatalogJson = localStorage.getItem(catalogKey);
          modCatalog = modCatalogJson ? JSON.parse(modCatalogJson) : null;
        }
        if (!Array.isArray(modCatalog) || modCatalog.length === 0) {
          modCatalog = [];
        }
        if (Array.isArray(modCatalog) && modCatalog.length > 0) {
          filteredMods.forEach((mod, midx) => {
            const catId = mod.categoryId;
            let found = modCatalog.find((c) => {
              if (catId == null) return false;
              const cids = getItemCategoryIds(c);
              return (
                cids.indexOf(catId) >= 0 ||
                cids.indexOf(Number(catId)) >= 0
              );
            });
            if (!found && !catId) {
              found =
                modCatalog.find(
                  (c) => getItemCategoryIds(c).length === 0
                ) || modCatalog[0];
            }
            const anyCatPill = pillFilterList.some(
              (p) =>
                p.filterCategoryId != null || p.orFilterCategoryId != null
            );
            if (anyCatPill && found && getItemCategoryIds(found).length === 0) {
              found = null;
            }
            if (found) {
              const { plan: modPlan, fromFallback: modPlanFb } =
                resolveClodisJSONForCatalogGridItem(found);
              if (!modPlan || modPlan.length === 0) return;
              const foundForGrid = modPlanFb
                ? Object.assign({}, found, { clodisJSON: modPlan })
                : found;
              const foundPlacementKind = resolvePlacementKindFromFurnitureData({
                placementKind: found?.placementKind,
                catalogItem: foundForGrid,
                data: found?.data,
              });
              const modSectionSize = extractSectionSizeFromFurnitureData({
                clodisJSON: modPlan,
                catalogItem: foundForGrid,
              });
              if (foundPlacementKind === PLACEMENT_KIND.STANDALONE_FLOOR) {
                const explicitH = getCatalogDimensionMm(foundForGrid, 'height');
                if (explicitH) modSectionSize.y = explicitH;
              }
              const pp0 = modPlan[0];
              const wDoor = catalogItemWidthMmForDoorFilter(
                foundForGrid,
                pp0,
                modSectionSize
              );
              if (
                !itemMatchesAllStep4Pills(
                  foundForGrid,
                  pillFilterList,
                  wDoor,
                  catalogTypeNorm
                )
              ) {
                return;
              }
              const cabinetItem = createCabinetItem({
                id: 'mod-' + (mod.id || midx),
                name: mod.name || 'двойную',
                icon: resolveCatalogItemIcon(foundForGrid || found) || mod.icon || 'fa-cube',
                iconAspect: resolveCatalogItemIconAspect(foundForGrid || found, catalogTypeNorm),
                price:
                  found?.price ??
                  found?.price_from ??
                  found?.priceFrom ??
                  found?.min_price ??
                  found?.minPrice ??
                  '',
                data: {
                  name: found?.name || mod.name || 'двойную',
                  clodisJSON: modPlan,
                  clodisVariables: found.clodisVariables || {},
                  catalogItem: foundForGrid,
                  catalogType: catalogTypeNorm || undefined,
                  placementKind: foundPlacementKind,
                  width: getCatalogDimensionMm(foundForGrid, 'width') || modSectionSize.x,
                  height: getCatalogDimensionMm(foundForGrid, 'height') || modSectionSize.y,
                  depth: getCatalogDimensionMm(foundForGrid, 'depth') || modSectionSize.z,
                  sectionSize: modSectionSize,
                  ...(modPlanFb ? { catalogPlanFallback: true } : {}),
                },
                iconOnly: cabinetsGrid.id === 'step4-cabinets-grid',
              });
              cabinetsGrid.appendChild(cabinetItem);
              totalItems++;
            }
          });
        } else if (moduleItems.length > 0) {
          const catKeys = [];
          for (let xi = 0; xi < localStorage.length; xi++) {
            const kk = localStorage.key(xi);
            if (kk && kk.indexOf('catalog_') === 0) catKeys.push(kk);
          }
          console.warn(
            '[Step4] Каталог не найден. catalogType:',
            catalogType,
            'Нажмите «Выгрузить всё в конструктор»'
          );
        }
      } catch (e) {
        console.warn('loadSavedModels moduleItems:', e);
      }
    }

    // Без выбранной папки шага 3 не читаем все catalog_* разом (см. runCatalogLoad).
    if (
      hasExplicitCatalogType ||
      (!moduleItems && totalItems === 0)
    ) {
      // 3. Load items from catalog_* keys — только для выбранного типа (например catalog_26)
      function runCatalogLoad(useFilter, pillsOverride, skipRoomFilter) {
        const pillsActive = pillsOverride != null ? pillsOverride : pillFilterList;
        const ignoreRoomCtx = skipRoomFilter === true;
        if (!hasExplicitCatalogType) {
          console.warn(
            '[loadSavedModels] Не задан тип каталога (папка шага 3). Пропускаем чтение catalog_*, чтобы не смешивать все каталоги в одной сетке.'
          );
          return;
        }
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key || !key.startsWith('catalog_')) continue;
          // Справочники категорий лежат как catalogCategories_* и тоже начинаются с "catalog_"
          if (key.startsWith('catalogCategories_')) continue;
          if (key === 'catalogs_keys') continue;
          const keyCatalogType = key.replace('catalog_', '');
          // folderId из шага 3: строка "26" или число 26
          if (String(keyCatalogType) !== catalogTypeNorm) {
            continue;
          }
          try {
            const catalogJson = localStorage.getItem(key);
            if (!catalogJson) continue;
            const catalog = migrateCatalogArrayStorageKeys(JSON.parse(catalogJson));
            if (!Array.isArray(catalog)) continue;
            console.log(
              '[loadSavedModels] runCatalogLoad useFilter=' +
                useFilter +
                ' key=' +
                key +
                ' items=' +
                catalog.length
            );
            const seenCatalogEntryKeys = new Set();
            catalog.forEach((item, index) => {
              const name = item.name || 'Элемент ' + index;
              if (item.id != null && item.id !== '') {
                const idK = String(item.id);
                if (seenCatalogEntryKeys.has(idK)) {
                  console.warn(
                    '[loadSavedModels] Пропуск дубликата в localStorage (id=' +
                      idK +
                      '): "' +
                      name +
                      '"'
                  );
                  return;
                }
                seenCatalogEntryKeys.add(idK);
              }
              const showInRoom =
                item.showInRoom === true ||
                item.show_in_constructor === '1' ||
                item.show_in_constructor === true;
              if (
                !showInRoom &&
                (item.showInRoom !== undefined ||
                  item.show_in_constructor !== undefined)
              ) {
                console.log(
                  '[ШКАФ-ДИАГНОСТИКА] ПРОПУСК "' +
                    name +
                    '": show_in_constructor=' +
                    (item.show_in_constructor ?? item.showInRoom) +
                    ' (нужно "1" или true)'
                );
                return;
              }
              // Фильтр торцевых (шаг 4 после диалога): категория и/или тег из админки.
              if (endCabMode?.active) {
                const catId = endCabMode.catalogCategoryId
                  ? Number(endCabMode.catalogCategoryId) || endCabMode.catalogCategoryId
                  : null;
                if (catId != null && String(catId).trim() !== '') {
                  if (!itemMatchesCategoryFilter(item, catId)) {
                    return;
                  }
                }
                const tag = String(endCabMode.catalogFilterTag || '').trim().toLowerCase();
                if (tag) {
                  const blob = [
                    item.name,
                    item.title,
                    JSON.stringify(item.categories || []),
                    JSON.stringify(item.category_ids || []),
                    JSON.stringify(item.tags || []),
                    JSON.stringify(item.roomTags || []),
                  ]
                    .join(' ')
                    .toLowerCase();
                  if (!blob.includes(tag)) return;
                }
              }
              // Тип размещения: ordinary - Gola (как управление кухней).
              if (!catalogItemMatchesKitchenPlacement(item)) {
                console.log(
                  '[ШКАФ-ДИАГНОСТИКА] ПРОПУСК "' +
                    name +
                    '": placementKind не для текущего режима кухни'
                );
                return;
              }
              // Угловые 44 (НМУ) / 54 (ВМУ): лев/прав только при постановке в спец-зону.
              if (
                (catalogTypeNorm === '44' || catalogTypeNorm === '54') &&
                !catalogItemMatchesActiveLCornerSide(item)
              ) {
                console.log(
                  '[ШКАФ-ДИАГНОСТИКА] ПРОПУСК "' +
                    name +
                    '": сторона угла не совпадает (модуль ' +
                    (getCatalogItemCornerAtStart(item) ? 'лев' : 'прав') +
                    ', зона ' +
                    (getPendingLCornerZoneAtStart() ? 'лев' : 'прав') +
                    ')'
                );
                return;
              }
              const tagsApi =
                typeof window !== 'undefined' ? window.__cldRoomFurnitureTags : null;
              if (
                !ignoreRoomCtx &&
                tagsApi &&
                typeof tagsApi.getRoomContext === 'function'
              ) {
                const roomCtx = tagsApi.getRoomContext();
                if (
                  (roomCtx.roomKey || roomCtx.layoutKey) &&
                  typeof tagsApi.moduleMatchesRoomContext === 'function' &&
                  !tagsApi.moduleMatchesRoomContext(item, roomCtx, {
                    catalogFolderKey: catalogTypeNorm,
                    showAllCategories: !!(
                      typeof tagsApi.isShowAllCategoriesMode === 'function'
                        ? tagsApi.isShowAllCategoriesMode()
                        : window.step3ShowAllCategories
                    ),
                  })
                ) {
                  console.log(
                    '[ШКАФ-ДИАГНОСТИКА] ПРОПУСК "' +
                      name +
                      '": не подходит под комнату/раздел (roomTags=' +
                      JSON.stringify(
                        tagsApi.getModuleCategoryKeys
                          ? tagsApi.getModuleCategoryKeys(item)
                          : []
                      ) +
                      ', контекст room=' +
                      (roomCtx.roomKey || '—') +
                      ' catalog=' +
                      catalogTypeNorm +
                      '). Проверьте галочку «Категории для комнаты» и «Выгрузить всё в конструктор».'
                  );
                  return;
                }
              }
              // Кухня: ordinary kitchen_base = 720; Gola — отдельные SKU kitchen_base_gola = 780.
              const { plan: resolvedPlan, fromFallback: planFromFallback } =
                resolveClodisJSONForCatalogGridItem(item);
              if (!resolvedPlan || resolvedPlan.length === 0) {
                console.log(
                  '[ШКАФ-ДИАГНОСТИКА] ПРОПУСК "' +
                    name +
                    '": нет clodisJSON и нет размеров для каркаса (width/height/depth или params.sectionSize).'
                );
                return;
              }
              const itemForGrid = planFromFallback
                ? Object.assign({}, item, { clodisJSON: resolvedPlan })
                : item;
              const clodisData = resolvedPlan[0];
              const sectionSize = extractSectionSizeFromFurnitureData({
                clodisJSON: resolvedPlan,
                catalogItem: itemForGrid,
              });
              const widthMmDoor = catalogItemWidthMmForDoorFilter(
                itemForGrid,
                clodisData,
                sectionSize
              );
              if (
                useFilter &&
                !itemMatchesAllStep4Pills(
                  item,
                  pillsActive,
                  widthMmDoor,
                  catalogTypeNorm
                )
              ) {
                console.log(
                  '[ШКАФ-ДИАГНОСТИКА] ПРОПУСК "' +
                    name +
                    '": пилюли ' +
                    JSON.stringify(pillFilterList) +
                    ' width=' +
                    widthMmDoor +
                    ' doorKind=' +
                    (getCatalogItemDoorKind(item, catalogTypeNorm) || '—') +
                    ' categoryIds=' +
                    JSON.stringify(getItemCategoryIds(item))
                );
                return;
              }
              const itemPlacementKind = resolvePlacementKindFromFurnitureData({
                placementKind: item?.placementKind,
                catalogItem: itemForGrid,
                data: item?.data,
              });
              if (itemPlacementKind === PLACEMENT_KIND.STANDALONE_FLOOR) {
                const explicitH = getCatalogDimensionMm(itemForGrid, 'height');
                if (explicitH) sectionSize.y = explicitH;
              }
              // Базовые размеры секции из данных
              let displayWidth =
                clodisData &&
                clodisData.size &&
                typeof clodisData.size.x === 'number'
                  ? Math.round(clodisData.size.x)
                  : sectionSize.x;
              let displayHeight =
                clodisData &&
                clodisData.size &&
                typeof clodisData.size.y === 'number'
                  ? Math.round(clodisData.size.y)
                  : sectionSize.y;

              // Для шкафа (catalogType=26) отображаем высоту как две ширины по ТЗ.
              if (catalogTypeNorm === '26') {
                displayHeight = displayWidth * 2;
              }

              const widthStr = `${displayWidth}?${displayHeight} мм`;
              const iconAspect = resolveCatalogItemIconAspect(item, catalogTypeNorm);
              const rawPrice =
                item.price ??
                item.price_from ??
                item.priceFrom ??
                item.min_price ??
                item.minPrice ??
                '';
              const wMm = getCatalogDimensionMm(itemForGrid, 'width') || sectionSize.x;
              const hMm = getCatalogDimensionMm(itemForGrid, 'height') || sectionSize.y;
              const dMm = getCatalogDimensionMm(itemForGrid, 'depth') || sectionSize.z;
              const rawProfilePk = getRawPlacementKindFromFurnitureData({
                placementKind: item?.placementKind,
                catalogItem: itemForGrid,
                data: item?.data,
                catalogType: catalogTypeNorm,
              });
              const ctBand = String(catalogTypeNorm || '')
                .trim()
                .toLowerCase()
                .replace(/^catalog_/, '');
              const rawPkBand = String(rawProfilePk || '')
                .trim()
                .toLowerCase();
              let kitchenWallBand = '';
              if (
                rawPkBand === 'kitchen_wall_top' ||
                ctBand === '51'
              ) {
                kitchenWallBand = 'top';
              } else if (
                rawPkBand === 'kitchen_wall_mid' ||
                ctBand === '50' ||
                ctBand === '42' ||
                ctBand === '43'
              ) {
                kitchenWallBand = 'mid';
              }
              const wallBandDepthMm = kitchenWallBand ? 350 : 0;
              const cabinetItem = createCabinetItem({
                id: key + '-' + index,
                name: item.name || 'Элемент ' + (index + 1),
                icon: resolveCatalogItemIcon(item),
                iconAspect,
                width: widthStr,
                price: rawPrice,
                data: {
                  name: item?.name || ('Элемент ' + (index + 1)),
                  clodisJSON: resolvedPlan,
                  clodisVariables: item.clodisVariables || {},
                  catalogItem: itemForGrid,
                  catalogType: catalogTypeNorm || undefined,
                  placementKind: itemPlacementKind,
                  // Сырой id (kitchen_tall) — ghost/place не теряют профиль после map>baseKind.
                  __placementKindProfileId: rawProfilePk || itemPlacementKind,
                  // НШ1/НШ2: явный stamp — ghost не путает с низом / wall_hung.
                  ...(kitchenWallBand
                    ? { __kitchenWallBand: kitchenWallBand }
                    : {}),
                  width: wMm,
                  height: hMm,
                  depth: wallBandDepthMm > 0 ? wallBandDepthMm : dMm,
                  sectionSize: {
                    x: Math.max(1, Math.round(Number(wMm) || Number(sectionSize.x) || 600)),
                    y: Math.max(1, Math.round(Number(hMm) || Number(sectionSize.y) || 2400)),
                    z: Math.max(
                      1,
                      Math.round(
                        wallBandDepthMm > 0
                          ? wallBandDepthMm
                          : Number(dMm) || Number(sectionSize.z) || 550
                      )
                    ),
                  },
                  ...(planFromFallback ? { catalogPlanFallback: true } : {}),
                },
                iconOnly: cabinetsGrid.id === 'step4-cabinets-grid',
              });
              cabinetsGrid.appendChild(cabinetItem);
              totalItems++;
              console.log(
                '[ШКАФ-ДИАГНОСТИКА] ДОБАВЛЕН В КАТАЛОГ: "' +
                  (item.name || 'Элемент ' + index) +
                  '" clodisJSON.length=' +
                  resolvedPlan.length +
                  (planFromFallback ? ' (каркас из размеров)' : '') +
                  ' sectionSize=' +
                  sectionSize.x +
                  'Г—' +
                  sectionSize.y +
                  'Г—' +
                  sectionSize.z
              );
            });
          } catch (e) {
            console.warn('loadSavedModels catalog', key, e);
          }
        }
      }

      if (hasExplicitCatalogType) {
        const catKey = 'catalog_' + catalogTypeNorm;
        if (
          !localStorage.getItem(catKey) ||
          localStorage.getItem(catKey) === '[]'
        ) {
          const available = [];
          for (let ai = 0; ai < localStorage.length; ai++) {
            const ak = localStorage.key(ai);
            if (
              ak &&
              ak.indexOf('catalog_') === 0 &&
              ak !== 'catalogs_keys' &&
              !ak.startsWith('catalogCategories_')
            ) {
              available.push(ak);
            }
          }
          console.warn(
            '[loadSavedModels] "' +
              catKey +
              '" пуст или нет. Доступны: ' +
              available.join(', ') +
              '. В шаге 3 для Шкафы задайте key=26. Затем «Выгрузить всё в конструктор».'
          );
        }
      }

      runCatalogLoad(true, pillFilterList, !!endCabMode?.active);
      if (totalItems === 0 && pillFilterList.length > 0) {
        console.warn(
          '[loadSavedModels] Пилюли отфильтровали всё — повтор без фильтра категорий'
        );
        runCatalogLoad(true, []);
      }
      if (totalItems === 0 && diagArr.length > 0) {
        console.warn(
          '[loadSavedModels] В localStorage ' +
            diagArr.length +
            ' модулей, но сетка пуста — повтор без фильтра комнаты'
        );
        cabinetsGrid.innerHTML = '';
        totalItems = 0;
        runCatalogLoad(true, [], true);
      }
      console.log(
        '[ШКАФ-ДИАГНОСТИКА] ИТОГО в каталоге отображается элементов: ' +
          totalItems +
          (totalItems === 0
            ? '. Проверьте: «Выгрузить всё в конструктор», шаг 3 с ключом каталога, пилюли/фильтр; без дерева конструктора показывается каркас по размерам, если width/height/depth заданы.'
            : '')
      );
    }

    // Remove "no models" message if present
    const emptyMsg = cabinetsGrid.querySelector(
      'div[style*="text-align: center"]'
    );
    if (emptyMsg && totalItems > 0) {
      emptyMsg.remove();
    }

    // If no items, show message
    if (totalItems === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.style.padding = '20px';
      emptyMessage.style.textAlign = 'center';
      emptyMessage.style.color = '#666';
      let emptyText =
        'Нет сохраненных моделей.\nСоздайте модель в конструкторе и сохраните её.';
      const b = getCabinetDoorWidthBoundsFromRoomSteps();
      if (pillFilterList.length > 0) {
        const hasDoor = pillFilterList.some(
          (p) => p.cabinetDoorFilter === 'single' || p.cabinetDoorFilter === 'double'
        );
        if (hasDoor) {
          emptyText +=
            '\n\nФильтр ширины по пилюлям — одинарные до ' +
            b.singleMaxMm +
            ' мм, двойные ' +
            b.doubleMinMm +
            '–' +
            b.doubleMaxMm +
            ' мм (section_division).';
        }
        emptyText +=
          '\n\nВыбранные пилюли (все условия одновременно): ' +
          JSON.stringify(pillFilterList) +
          '.';
      }
      if (hasExplicitCatalogType) {
        emptyText +=
          '\n\nЕсли модуль в админке уже есть: «Выгрузить всё в конструктор», затем Ctrl+F5.';
      }
      emptyMessage.textContent = emptyText;
      emptyMessage.style.whiteSpace = 'pre-line';
      cabinetsGrid.appendChild(emptyMessage);
    }

    console.log(`? Всего добавлено элементов в каталог: ${totalItems}`);
  } catch (error) {
    console.error('? Ошибка загрузки сохраненных моделей:', error);
    console.error('  Стек ошибки:', error.stack);
  }
}

// Create cabinet item card (both step3/step4 styles)
function createCabinetItem(cabinet) {
  const step4Style = cabinet.iconOnly === true || cabinet.step4Style === true;

  // Step 4: pure visual gallery tile (no name / dims / price labels)
  if (step4Style) {
    const item = document.createElement('div');
    item.className = 'cabinet-item';
    if (normalizeCatalogIconAspect(cabinet.iconAspect) === CATALOG_ICON_ASPECT_LOW) {
      item.classList.add('cabinet-item--icon-low');
    }
    item.style.cursor = 'pointer';
    const iconVal = (cabinet.icon || '').trim() || 'fa-cube';
    const isImg =
      /^https?:\/\//i.test(iconVal) ||
      (iconVal.length > 0 && iconVal.charAt(0) === '/');
    const iconHtml = isImg
      ? '<img src="' +
        iconVal.replace(/"/g, '&quot;') +
        '" alt="" onerror="this.style.display=\'none\';var s=this.nextElementSibling;s&&(s.style.display=\'flex\');"><div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:36px;color:#999;"><i class="fas fa-cube"></i></div>'
      : '<i class="fas ' +
        iconVal.replace(/"/g, '') +
        '"></i>';

    const nameLabel = String(cabinet.name || '').trim();
    if (nameLabel) {
      item.title = nameLabel;
      item.setAttribute('aria-label', nameLabel);
    }
    // Без картинки превью (fa-cube) — подпись, иначе ВМУ левый/правый неразличимы.
    const nameHtml =
      !isImg && nameLabel
        ? '<div class="cabinet-item-name">' +
          nameLabel.replace(/</g, '&lt;') +
          '</div>'
        : '';
    item.innerHTML =
      '<div class="cabinet-item-image">' +
      iconHtml +
      '<span class="cabinet-item-selected-check" aria-hidden="true"><i class="fas fa-check"></i></span>' +
      '</div>' +
      nameHtml;

    if (cabinet.data) {
      item.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        setupCatalogDragToPlace(cabinet.data, e);
      });
    }
    item.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const grid = item.closest('#step4-cabinets-grid');
      if (grid) {
        grid.querySelectorAll('.cabinet-item.selected').forEach((el) => {
          el.classList.remove('selected');
        });
        item.classList.add('selected');
      }
      if (cabinet.glbFile) loadGLBFromPath(cabinet.glbFile);
    });

    return item;
  }

  // Full cabinet card style (step 3)
  const el = document.createElement('div');
  el.className = 'cabinet-item';
  let iconHtml = 'Шкаф';

  if (cabinet.icon) {
    const iconVal = (cabinet.icon || '').trim();
    const isShape = iconVal.indexOf('shape:') === 0;
    const isImg =
      !isShape &&
      (/^https?:\/\//i.test(iconVal) ||
        (iconVal.length > 0 && iconVal.charAt(0) === '/'));
    iconHtml = isImg
      ? '<img src="' +
        (iconVal || '').replace(/"/g, '&quot;') +
        '" alt="" style="width:100%;height:100%;object-fit:contain;border-radius:4px;">'
      : '<i class="fas ' +
        (iconVal || 'fa-cube').replace(/"/g, '') +
        '" style="font-size:32px;color:#333;"></i>';
  }

  el.innerHTML =
    '<div class="cabinet-item-image" style="display:flex;align-items:center;justify-content:center;">' +
    iconHtml +
    '</div>' +
    '<div class="cabinet-item-name">' +
    (cabinet.name || '').replace(/</g, '&lt;') +
    '</div>' +
    '<div class="cabinet-item-price">' +
    (cabinet.price || '0,-') +
    '</div>';

  // Clodis: mousedown + drag — зажать ЛКМ на шкафу, тянуть в секцию, отпустить
  if (cabinet.data) {
    el.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      console.log('[DRAG] mousedown на шкафу, тяните в секцию', cabinet.name);
      setupCatalogDragToPlace(cabinet.data, e);
    });
  }
  // GLB / savedModel: click
  el.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (cabinet.glbFile) {
      loadGLBFromPath(cabinet.glbFile);
    } else if (cabinet.savedModelData) {
      console.log('  > Сохранённая модель (не реализовано)');
    }
  });

  return el;
}

/** Пересборка всей мебели после смены бегунков шага 4 (цельная дверь, опускание фасада). */
export function rebuildAllRoomFurnitureForStep4Toggles() {
  rebuildAllRoomFurnitureForHandleChange();
}

/** @deprecated alias */
export function rebuildAllRoomFurnitureForUnifiedFacadeToggle() {
  rebuildAllRoomFurnitureForStep4Toggles();
}

/** Пересборка всей мебели в комнате после смены серии ручек (шаг 6). */
export function rebuildAllRoomFurnitureForHandleChange() {
  if (!state.scene) return;
  const log = typeof window !== 'undefined' && window.__cldHandleRuntime?.handleLog
    ? window.__cldHandleRuntime.handleLog
    : (step, data) => console.log('[CLD][HANDLE] ' + step, data ?? '');
  const seen = new Set();
  const groups = [];
  state.scene.traverse((obj) => {
    if (!obj?.userData?.isFurniture || seen.has(obj)) return;
    const ud = obj.userData;
    if (!readUserDataClodisData(ud) && !readUserDataClodisRoots(ud)) return;
    seen.add(obj);
    groups.push(obj);
  });
  log('rebuild furniture for handle change', { count: groups.length });
  for (const grp of groups) {
    const ud = grp.userData || {};
    const sid = ud.sectionId;
    const sec =
      sid != null && Array.isArray(state.customSections)
        ? state.customSections.find((s) => s && String(s.id) === String(sid))
        : null;
    // Торцевой модуль живёт в слоте, а не в зонах ряда: размер зоны ему не подходит.
    if (ud.isEndCabinet) {
      const side = ud.endCabinetSide;
      const freshSlot = sec && side ? getEndCabinetSlot(sec, side) : null;
      const slotSize = freshSlot?.sectionSize || ud.__endCabinetSectionSizeMm;
      if (!slotSize) continue;
      try {
        rebuildFurnitureGroupForSectionResize(grp, sec, slotSize, { force: true });
        restoreEndCabinetGroupTransform(grp, sec, side);
      } catch (e) {
        console.warn('[END-CAB] rebuild failed', e);
      }
      continue;
    }
    let targetSize = ud.__targetSectionSizeMm || ud.__initialSectionSizeMm;
    if (sec) {
      try {
        // Свежий layout: иначе stale seg раздувает угловой при возврате на шаг 4.
        sec._layoutCache = null;
        if (sec.division?.typeKey) getLShapeSpecialSnapBounds(sec.division);
        const layout =
          typeof window.__clodisComputeSectionLayout === 'function'
            ? window.__clodisComputeSectionLayout(sec)
            : null;
        const z = zoneWidthMmForFurnitureGroup(grp, sec, layout);
        if (z && z.x >= 1 && z.y >= 1 && z.z >= 1) targetSize = z;
      } catch (_) {}
    }
    if (!targetSize || targetSize.x < 1 || targetSize.y < 1 || targetSize.z < 1) continue;
    try {
      rebuildFurnitureGroupForSectionResize(grp, sec, targetSize, { force: true });
      // НШ1: после rebuild вкладки (Пеналы/…) вернуть Y = plinth+720+600.
      try {
        snapFurnitureGroupPlacementY(grp, sec);
      } catch (_) {}
      const zi = ud.zoneIndex;
      if (
        sec &&
        zi != null &&
        typeof getLShapeSpecialZoneIndex === 'function' &&
        Number(getLShapeSpecialZoneIndex(sec)) === Number(zi)
      ) {
        try {
          fitFurnitureToSectionZone(grp, sec, zi);
          __cldClampCornerCabinetToSpecialGap(grp, sec, zi);
        } catch (_) {}
      }
    } catch (e) {
      console.warn('[HANDLE] furniture rebuild failed', e);
    }
  }
  try {
    // Пересобранные модули рождаются с закрытыми дверями: возвращаем состояние
    // шага мгновенно, иначе аниматор доводит их и видно «закры»ись > открылисьл.
    const B = typeof window !== 'undefined' ? window.ClodisBuilder : null;
    if (B && typeof B.toggleAllDoors === 'function' && Number(window.currentRoomStep) >= 4) {
      B.toggleAllDoors(window.__cldRoomDoorsDesiredOpen === true, { instant: true });
    }
  } catch (e) {
    console.warn('[FURNITURE-REBUILD] restore door state failed', e);
  }
  try {
    // Накладка торцевого повторяет фасады ряда — пересобрать её вместе со стыками,
    // иначе после смены цельный/с антресолью останется прежняя разбивка.
    if (typeof window.__clodisRebuildTrimAfterFurnitureGeometry === 'function') {
      window.__clodisRebuildTrimAfterFurnitureGeometry();
    } else {
      rebuildAllTransitions();
    }
  } catch (e) {
    console.warn('[FURNITURE-REBUILD] rebuildAllTransitions failed', e);
  }
  // После transitions снова подтянуть угловые в спец (fit ниши иначе снова в зазор 50).
  try {
    for (const grp of groups) {
      const ud = grp.userData || {};
      if (ud.isEndCabinet) continue;
      const sid = ud.sectionId;
      const sec =
        sid != null && Array.isArray(state.customSections)
          ? state.customSections.find((s) => s && String(s.id) === String(sid))
          : null;
      const zi = ud.zoneIndex;
      if (
        !sec ||
        zi == null ||
        Number(getLShapeSpecialZoneIndex(sec)) !== Number(zi)
      ) {
        continue;
      }
      __cldClampCornerCabinetToSpecialGap(grp, sec, zi);
    }
  } catch (_) {}
  try {
    if (typeof window.__cldDiagnoseHandles === 'function') {
      setTimeout(() => {
        try {
          window.__cldDiagnoseHandles();
        } catch (_) {}
      }, 2000);
    }
  } catch (_) {}
}

// Для section-transition-manager / rebuildAllTransitions без циклического импорта
if (typeof window !== 'undefined') {
  window.refreshFurnitureDecors = refreshFurnitureDecors;
  window.refreshFurnitureDecorsImmediate = refreshFurnitureDecorsImmediate;
  window.__cldReapplyOutsideDecorToSectionTrimMeshes = () => {
    try {
      const selection =
        typeof window.getStep5DecorSelection === 'function'
          ? window.getStep5DecorSelection()
          : { outside: null, inside: null };
      return __reapplyOutsideDecorToSectionTrimMeshes(
        selection,
        __getDecorTextureLoader(),
        (root) => {
          if (!root) return null;
          try {
            return __computeFurnitureRootLocalBbox(root);
          } catch (_) {
            return null;
          }
        },
        state.scene
      );
    } catch (e) {
      console.warn('[STEP5] reapply trim outside failed', e);
      return 0;
    }
  };
  window.__cldStep5DecorAudit = () => auditStep5Decor();
  window.refreshSectionTrimEdges = () => {
    if (!state?.scene) return;
    let fallbackOutside = null;
    try {
      fallbackOutside =
        typeof window.getStep5DecorSelection === 'function'
          ? window.getStep5DecorSelection()?.outside || null
          : null;
    } catch (_) {}
    return refreshSectionTrimEdges(state.scene, { fallbackOutside });
  };
  window.refreshTrimPartNumberLabels = (scene) => {
    const sc = scene || state?.scene;
    if (sc) refreshTrimPartNumberLabels(sc);
  };
  window.isTrimPartNumberLabelsVisible = isTrimPartNumberLabelsVisible;
  window.__cldApplyJointFittingHoles = applyJointFittingHolesToFurnitureGroup;
  window.__cldRepositionJointSchemeFurniture = repositionJointSchemeFurnitureInRoom;
  window.initStep5DefaultDecorsFromRoomConfig = initStep5DefaultDecorsFromRoomConfig;
  window.__cldLoadDecorTexture = __loadDecorTexture;
  window.__cldGetDecorTextureCache = () => _decorTextureCache;
  window.getStep5DecorPreviewColor = getStep5DecorPreviewColor;
  window.applyStep5ModuleDecorToFurnitureGroup = applyStep5ModuleDecorToFurnitureGroup;
  window.persistStep5ModuleDecorForGroup = persistStep5ModuleDecorForGroup;
  window.restoreStep5ModuleDecorFromStorage = restoreStep5ModuleDecorFromStorage;
  window.hasAnyFurnitureInScene = hasAnyFurnitureInScene;
  window.__clodisDeleteSelectedFurniture = deleteSelectedFurniture;
  window.__clodisGetPendingModuleDoorKind = function () {
    return inferModuleDoorKindFromCategories(state.pendingFurnitureData);
  };
  window.__cldIsLCornerCabinetModule = isLCornerCabinetModule;
  window.__cldDumpLCornerPlace = () => __cldLogLCorner('manual-dump');
  window.__cldGetLShapeSpecialZoneIndex = __getLShapeSpecialZoneIndex;
  window.__cldGetLShapeSpecialSnapBounds = getLShapeSpecialSnapBounds;
  /**
   * Зазор фасада/цоколя от пола комнаты (мм). Консоль: __cldAuditFacadeFloorGap()
   * Эталон: стандарт ~70 мм (свес 30 при h_bottom=100); deep-toggle ~25 мм.
   */
  window.__cldAuditFacadeFloorGap = function __cldAuditFacadeFloorGap() {
    const THREE_ = typeof THREE !== 'undefined' ? THREE : window.THREE;
    if (!THREE_) {
      console.warn('[FLOOR-GAP] no THREE');
      return null;
    }
    const root =
      state?.scene ||
      window.__cldRoomScene ||
      state?.room?.group ||
      null;
    if (!root) {
      console.warn('[FLOOR-GAP] no scene — мебель ищем в state.scene');
      return null;
    }
    const roomWorld = new THREE_.Vector3();
    try {
      state.room?.group?.getWorldPosition?.(roomWorld);
    } catch (_) {}
    const floorY = roomWorld.y;
    const deep = window.step4FacadeBottomDeep === true;
    const expectedFacadeFromFloor = deep ? 25 : 70;
    const rows = [];
    const groups = [];
    // Мебель добавляется в state.scene (не в room.group) — как hasAnyFurnitureInScene.
    root.traverse((o) => {
      if (
        o?.isGroup &&
        o.userData?.isFurniture &&
        !o.userData?.isEndCabinet &&
        !o.userData?.isGhost &&
        !o.userData?.isGhostClodisPrebuild
      ) {
        groups.push(o);
      }
    });
    if (!groups.length) {
      console.warn(
        '[FLOOR-GAP] шкафов не найдено. root=',
        root?.type || root?.name || typeof root,
        'children=',
        root?.children?.length
      );
      window.__cldLastFacadeFloorGap = [];
      return [];
    }
    for (const g of groups) {
      try {
        g.updateMatrixWorld(true);
      } catch (_) {}
      let facadeMin = Infinity;
      let plinthMin = Infinity;
      let corpusMin = Infinity;
      let facadeOh = null;
      let facadeOhMain = null;
      g.traverse((n) => {
        const lr = String(n.userData?.layoutRole || '').toLowerCase();
        if (n.userData?.facadeBottomOverhangMm != null) {
          const oh = Number(n.userData.facadeBottomOverhangMm);
          if (Number.isFinite(oh)) {
            if (facadeOh == null || oh > facadeOh) facadeOh = oh;
            if (lr === 'facades_main' || lr === 'facades') {
              if (facadeOhMain == null || oh > facadeOhMain) facadeOhMain = oh;
            }
          }
        }
        if (!n.isGroup && !n.isMesh) return;
        if (!lr && !n.isMesh) return;
        let box = null;
        try {
          box = new THREE_.Box3().setFromObject(n);
        } catch (_) {
          return;
        }
        if (!box || box.isEmpty()) return;
        if (lr === 'facades_main' || lr === 'facades') {
          facadeMin = Math.min(facadeMin, box.min.y);
        } else if (lr.startsWith('facade') && lr !== 'facades_top') {
          facadeMin = Math.min(facadeMin, box.min.y);
        }
        if (lr === 'plinth') plinthMin = Math.min(plinthMin, box.min.y);
        if (lr === 'corpus' || lr === 'corpus_antresol') {
          corpusMin = Math.min(corpusMin, box.min.y);
        }
      });
      if (facadeOhMain != null) facadeOh = facadeOhMain;
      // fallback: whole bbox / corpus helper
      let wholeMin = null;
      let corpusHelperMin = null;
      try {
        const w = new THREE_.Box3().setFromObject(g);
        if (!w.isEmpty()) wholeMin = w.min.y;
      } catch (_) {}
      try {
        if (typeof globalThis.__cldComputeFurnitureCorpusLayoutWorldBBoxNoAo === 'function') {
          const cb = globalThis.__cldComputeFurnitureCorpusLayoutWorldBBoxNoAo(g);
          if (cb && !cb.isEmpty()) corpusHelperMin = cb.min.y;
        }
      } catch (_) {}
      const contactY = getFurnitureFloorContactWorldYNoAo(g);
      const facadeY = facadeMin < Infinity ? facadeMin : null;
      const plinthY = plinthMin < Infinity ? plinthMin : null;
      const corpusY = corpusMin < Infinity ? corpusMin : corpusHelperMin;
      const hb = Number(g.userData?.hBottomMm);
      const row = {
        catalog: g.userData?.catalogType || '',
        id: g.userData?.catalogItemId ?? '',
        name: (g.userData?.catalogName || g.name || '').slice(0, 40),
        corner:
          String(g.userData?.catalogType || '')
            .replace(/^catalog_/i, '')
            .trim() === '44' ||
          /угл/i.test(String(g.userData?.catalogName || '')),
        doorKind: g.userData?.doorKind || '',
        placement: g.userData?.__placementKind || '',
        productKind: g.userData?.productKind || '',
        hBottomMm: Number.isFinite(hb) ? hb : null,
        facadeOhMm: facadeOh,
        deepToggle: deep,
        floorY: Math.round(floorY),
        facadeFromFloorMm:
          facadeY != null ? Math.round(facadeY - floorY) : null,
        plinthFromFloorMm:
          plinthY != null ? Math.round(plinthY - floorY) : null,
        corpusFromFloorMm:
          corpusY != null ? Math.round(corpusY - floorY) : null,
        contactFromFloorMm: Math.round(contactY - floorY),
        wholeMinFromFloorMm:
          wholeMin != null ? Math.round(wholeMin - floorY) : null,
        expectedFacadeMm: expectedFacadeFromFloor,
        deltaVsExpectedMm:
          facadeY != null
            ? Math.round(facadeY - floorY - expectedFacadeFromFloor)
            : null,
        groupY: Math.round(g.position.y),
        sectionId: g.userData?.sectionId ?? '',
        zi: g.userData?.zoneIndex ?? '',
      };
      rows.push(row);
    }
    console.log(
      '%c[FLOOR-GAP] эталон фасада от пола: ' +
        expectedFacadeFromFloor +
        ' мм (deep=' +
        deep +
        '). plinth?0, corpus?h_bottom.',
      'color:#0a7;font-weight:bold'
    );
    console.table(rows);
    window.__cldLastFacadeFloorGap = rows;
    return rows;
  };
  window.__cldSnapFurnitureFloorY = snapFurnitureGroupFloorY;
  window.__cldSnapFurniturePlacementY = snapFurnitureGroupPlacementY;
  window.__cldRebuildFurnitureForHandles = rebuildAllRoomFurnitureForHandleChange;
  window.__cldRebuildFurnitureForStep4Toggles = rebuildAllRoomFurnitureForStep4Toggles;
  window.__cldRebuildFurnitureForUnifiedFacade = rebuildAllRoomFurnitureForStep4Toggles;
  window.__cldFurnitureDoorLayout = {
    resolveLowerFacadeBottomOverhangMm,
    resolveRoomStep4FacadeBottomDeepToggle,
    resolveRoomStep4UnifiedFacadeToggle,
    filterClodisTreeByDoorLayout,
  };
  if (!window.__cldHandleCatalogRetryBound) {
    window.__cldHandleCatalogRetryBound = true;
    window.addEventListener('handles-catalog-ready', () => {
      try {
        if (typeof window.__cldRetryFacadeHandles === 'function') {
          window.__cldRetryFacadeHandles();
        }
      } catch (e) {
        console.warn('[HANDLE] catalog-ready retry:', e);
      }
    });
  }
}
