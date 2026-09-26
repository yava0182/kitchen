// Section manager module - handles section creation, editing, deletion
// Main module for all section operations

import { state } from '../utils/state.js';
import {
  spanToSectionPose,
  sectionAlongBaseMm,
  sectionPivotFromSpanOffsets,
  getSectionSpanOpenEnds,
  getSectionOffsetFieldLabels,
  getFarRoomWallOffsetInfo,
  findWallWindowHeightProfile,
  getMinPlaceMmFromRoomConfig,
} from './wall-solid-spans.js?v=20260917-sec-win16';
import {
  applyWindowBridgeTrim,
  addUnderWindowBayTopCap,
  UNDER_WINDOW_TOP_THICKNESS_MM,
  syncUnderWindowBayToSideOverlays,
  shouldSuppressWindowBridgeBaySeamOverlay,
} from './section-window-bridge.js?v=20260917-sec-win16';
import {
  recalcFurniturePricingAfterGeometryChange,
  initStep5DefaultDecorsFromRoomConfig,
  rebuildFurnitureGroupForSectionResize,
  tryApplyDoorPairCatalogSwap,
  ensureSectionFullHeightForMixedWall,
  applyStep5DecorToFurnitureGroupImmediate,
  applyEndCabinetZoneHand,
  rebuildEndCabinetForSectionSlot,
} from '../furniture/furniture-manager.js?v=20260925-corner44y';
import {
  computeFurnitureWorldBBoxNoAo,
  computeFurnitureLayoutWorldBBoxNoAo,
  computeFurnitureCorpusLayoutWorldBBoxNoAo,
  computeFurnitureZoneFitWorldBBox,
  shouldExcludeMeshFromFurnitureBBox,
  withFurnitureDoorSwingsClosedForMeasure,
} from '../furniture/furniture-bbox.js?v=20260907-shelf-props';
import { getFurnitureFloorContactWorldYNoAo } from './section-layout-role-utils.js';
import {
  refreshSectionVerticalLayout,
  getSlotVerticalMetrics,
  computePlacementVerticalZones,
  PLACEMENT_KIND,
  isWallHungPlacementKind,
  isWallHungLowPlacementKind,
  isWallHungHighPlacementKind,
  isLowFurniturePlacementKind,
  DEFAULT_WALL_HUNG_FLOOR_CLEARANCE_MM,
  DEFAULT_WALL_HUNG_CEILING_CLEARANCE_MM,
  isTallLowJunctionPair,
  resolveWallHungFloorClearanceMm,
} from './vertical-layout.js?v=20260921-whh1';
import { resolveLowerFacadeBottomOverhangMm } from '../furniture/furniture-door-layout.js';
import { getAxisCoord, getWallAxes } from '../utils/wall-coords.js';
import { patchSectionNicheDepthWrite } from './section-depth-patch.js';
import { planRootsHaveFacadeShell } from '../cabinet-pyramid-layout.js?v=20260615-drawer-facade-depth';
import {
  readUserDataClodisData,
  readUserDataClodisRoots,
} from '../clodis-json-fields.js';
import { assignTrimPartKeyToMesh } from './trim-part-registry.js?v=20260822-edge-insets';
import { refreshSectionTrimEdges } from './section-trim-edges.js?v=20260822-edge-insets';
import {
  computeSectionInnerBoundsU,
  computeHorizontalTrimSpanU,
  getFillerPlankMmForPhysicalSide,
  getSectionFillerMm,
  getSectionFillerUiMm,
  applySectionFillerUiMm,
  ensureSectionFillerDefaults,
  getSectionFillerEditableFields,
  DEFAULT_FILLER_SIDE_MM,
  DEFAULT_FILLER_TOP_MM,
  FILLER_SIDE_MIN_MM,
  FILLER_SIDE_MAX_MM,
  FILLER_TOP_MIN_MM,
  FILLER_TOP_MAX_MM,
} from './section-edge-trim-insets.js?v=20260921-trim-edge1';
import {
  shouldSuppressSideTrimForEndCabinet,
  getEndCabinetReserveMm,
  getEndCabinetRowPlinthInsetMm,
  getEndCabinetRule,
  isEndCabinetActive,
  setEndCabinetMode,
  getEndCabinetSlot,
  collectEndCabinetDialogCandidates,
  promptEndCabinetYesNo,
  promptEndCabinetDepthCm,
  promptEndCabinetEdit,
  setPendingEndCabinetPlacement,
  isStraightWallSection,
  snapEndCabinetGroupToSlot,
  resolveDefaultEndCabinetZoneHand,
  END_CABINET_SIDES,
  END_CABINET_WALL_PLANK_WIDTH_MM,
  END_CABINET_WALL_PLANK_THICKNESS_MM,
} from './section-end-cabinet.js?v=20260917-endcab-nobridge';
import {
  isWindowRowTrimApplying,
  wallHasWindowRowSections,
  syncWindowRowTrimForWall,
} from './window-row-trim-apply.js?v=20260918-straight-s12';

function scheduleRefreshSectionTrimEdgesInRoom() {
  try {
    const scene = state.scene || (typeof window !== 'undefined' ? window.__cldRoomScene : null);
    if (!scene) return;
    Promise.resolve(refreshSectionTrimEdges(scene))
      .then(() => {
        try {
          window.__cldSyncAllSectionTrimStudio?.(scene);
        } catch (_) {}
      })
      .catch(() => {});
  } catch (_) {}
}
import {
  clearHingeRoleMarkers,
  refreshAllHingeRoleMarkersInRoom,
} from '../furniture/hinge-role-markers-room.js?v=20260613-hinge-cup-y-align';
import {
  addBackSectionCornerMarker,
  addBackSectionCornerMarkerLeft,
  createLinkedLeftSectionForBack,
  createLinkedRightSectionForBack,
  createLinkedRightSectionForRight,
  createUShapeArmsForBack,
  ensureLegacyBackLeftSpecialZone,
  getLegacyBackCornerModalHtml,
  getBackSectionCornerMarkerLeftWorldPos,
  getBackSectionCornerMarkerWorldPos,
  getAttachedWallForCorner,
  isCornerLayoutKey,
  isUShapeLayoutKey,
  isUShapeBackSection,
  cornerLayoutKeyForSide,
  cornerLayoutSide,
  spanDoorSide,
  applyCornerLayoutForDoorSide,
  syncLegacyBackCornerIfNeeded,
  healAllLegacyBackCornerJoints,
} from './l-corner.js?v=20260923-cohabit38';
import {
  createLinkedSectionFromJoint,
  createUShapeArmsFromJoints,
  getCornerJointTrimPlan,
  resolveSectionCornerJoint,
} from './corner-joint.js?v=20260923-cohabit38';

/** Дефолтные планки секции: верхняя и нижняя. Высота слота под шкаф (мм) = размер секции − верх − низ (см. vertical-layout getSlotVerticalMetrics). */
export const TOP_PLANK_HEIGHT_MM = 50;
const TOP_PLANK_THICKNESS_MM = 16;
const BOTTOM_PLANK_HEIGHT_MM = 100;
const BOTTOM_PLANK_THICKNESS_MM = 16;
const SIDE_PLANK_WIDTH_MM = 50;
/** Как в cabinet-markers.js: порог двустворчатой / одностворчатой зоны (мм). */
const _TWO_DOOR_MIN_MM = 800;
/** Визуально и для пунктира на полу: ширина зоны строго &lt; 60 см → всегда однодверная (независимо от evenAllDoubles и min_mm в админке). */
const _SINGLE_DOOR_VISUAL_MAX_MM = 600;

/**    (). under-window / fixedHeight      sectionData.topPlankHeight. */
function resolveSectionTopPlankHeightMm(sectionData) {
  if (!sectionData) return TOP_PLANK_HEIGHT_MM;
  if (sectionData.underWindowBay || sectionData.windowBridgeRole === 'under-window') {
    const bay = Number(sectionData.topPlankHeight);
    return Number.isFinite(bay) && bay >= 0 ? bay : UNDER_WINDOW_TOP_THICKNESS_MM;
  }
  if (Number(sectionData.fixedHeightMm) > 0 && Number(sectionData.topPlankHeight) === 0) {
    return 0;
  }
  const f = getSectionFillerMm(sectionData);
  return f.topMm;
}

function resolveSectionSidePlankWidthMm(sectionData, physicalSide) {
  if (!sectionData) return SIDE_PLANK_WIDTH_MM;
  return getFillerPlankMmForPhysicalSide(sectionData, physicalSide);
}

function makeDefaultSectionFiller() {
  return {
    leftMm: DEFAULT_FILLER_SIDE_MM,
    rightMm: DEFAULT_FILLER_SIDE_MM,
    frontMm: DEFAULT_FILLER_SIDE_MM,
    backMm: DEFAULT_FILLER_SIDE_MM,
    topMm: DEFAULT_FILLER_TOP_MM,
  };
}

/**
 * Мин. ширина двустворчатого модуля из админки (section_division.min_mm).
 *       (  UI  ).
 */
export function getSectionDoubleMinMmFromConfig() {
  try {
    if (typeof window !== 'undefined' && typeof window.getRoomStepsConfig === 'function') {
      const cfg = window.getRoomStepsConfig();
      const s4 = cfg?.steps?.find((s) => s.stepId === 4);
      const sd = s4?.section_division;
      const m = Number(sd?.min_mm);
      if (Number.isFinite(m) && m > 0) return m;
    }
  } catch (e) {}
  return 600;
}

/**
 * /    .
 *    (  /  ).
 */
let __sectionNicheVisualsEnabled =
  typeof window !== 'undefined' && window.DEBUG_COLOR_SECTIONS === true;
let __horizontalRoleSectionsEnabled =
  typeof window !== 'undefined' && window.DEBUG_HORIZONTAL_ROLE_SECTIONS === true;

function __debugSectionColorHex(sectionId) {
  const idStr = String(sectionId ?? '');
  let h = 0;
  for (let i = 0; i < idStr.length; i++) h = (h * 31 + idStr.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  //   THREE     index.html.
  const c = new THREE.Color();
  c.setHSL(hue / 360, 0.9, 0.55);
  return c.getHex();
}

/**
 * /    .
 * Обновляет уже созданные секции (wireframe/fill/pivotMarker), а новые создаются с текущим значением.
 */
export function setSectionNicheVisualsEnabled(enabled) {
  __sectionNicheVisualsEnabled = !!enabled;
  updateSectionNicheVisualsVisibility();
}

/**
 * Применить текущее состояние __sectionNicheVisualsEnabled к уже созданным объектам.
 */
export function updateSectionNicheVisualsVisibility() {
  const enabled = __sectionNicheVisualsEnabled;
  if (!state.scene) return;
  state.scene.traverse((obj) => {
    if (!obj || !obj.userData || !obj.userData.isSectionNicheDebugPart) return;
    obj.visible = enabled;
    if (!enabled) return;

    const sectionId = obj.userData.debugSectionId;
    const partKind = obj.userData.debugPartKind; // wire | fill | pivot
    const color = __debugSectionColorHex(sectionId);

    const opacity =
      partKind === 'wire' ? 0.35 : partKind === 'fill' ? 0.12 : 0.95;

    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach((m) => {
      if (!m) return;
      if (m.color && typeof m.color.setHex === 'function') m.color.setHex(color);
      if (typeof m.opacity === 'number') m.opacity = opacity;
      m.transparent = true;
      m.needsUpdate = true;
    });
  });
}

function __getSectionLocalMinForDebug(sectionData) {
  const size = sectionData?.size || {};
  const wallName = sectionData?.wallName || 'back';
  const axes = getWallAxes(wallName);
  const localMinX =
    axes.w.axis === 'x'
      ? axes.w.sign > 0
        ? 0
        : -size.x
      : axes.u.axis === 'x'
      ? axes.u.sign > 0
        ? 0
        : -size.x
      : 0;
  const localMinZ =
    axes.w.axis === 'z'
      ? axes.w.sign > 0
        ? 0
        : -size.z
      : axes.u.axis === 'z'
      ? axes.u.sign > 0
        ? 0
        : -size.z
      : 0;
  return { localMinX, localMinZ };
}

function __removeHorizontalRoleSections(sectionData) {
  const g = sectionData?.group;
  if (!g) return;
  const toRemove = [];
  g.traverse((obj) => {
    if (obj?.userData?.isHorizontalRoleSectionGroup) toRemove.push(obj);
  });
  toRemove.forEach((grp) => {
    grp.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    });
    if (grp.parent) grp.parent.remove(grp);
  });
}

function createHorizontalRoleSections(sectionData) {
  if (!sectionData || !sectionData.group || !sectionData.size) return;
  __removeHorizontalRoleSections(sectionData);

  const size = sectionData.size;
  const rawH = Number(size.y ?? size.height ?? 0);
  const topHRaw = Number(sectionData.topPlankHeight);
  const bottomHRaw = Number(sectionData.bottomPlankHeightMm);
  const topH = Number.isFinite(topHRaw) && topHRaw >= 0 ? topHRaw : TOP_PLANK_HEIGHT_MM;
  const plinthH =
    Number.isFinite(bottomHRaw) && bottomHRaw >= 0 ? bottomHRaw : BOTTOM_PLANK_HEIGHT_MM;
  const corpusH = Math.max(0, rawH - topH - plinthH);
  if (plinthH <= 0 && corpusH <= 0) return;

  const { localMinX, localMinZ } = __getSectionLocalMinForDebug(sectionData);
  const roleGroup = new THREE.Group();
  roleGroup.name = `HorizontalRoleSections_${sectionData.id}`;
  roleGroup.visible = __horizontalRoleSectionsEnabled;
  roleGroup.userData.isHorizontalRoleSectionGroup = true;
  roleGroup.userData.sectionId = sectionData.id;

  const addBand = (name, color, yStart, h, opacity) => {
    if (!Number.isFinite(h) || h <= 0) return;
    const geom = new THREE.BoxGeometry(size.x, h, size.z);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = name;
    mesh.position.set(localMinX + size.x / 2, yStart + h / 2, localMinZ + size.z / 2);
    mesh.renderOrder = 110;
    mesh.userData.isHorizontalRoleSectionPart = true;
    mesh.userData.roleName = name;
    roleGroup.add(mesh);
  };

  //  =   ;  =      .
  addBand('plinth', 0x4fc3f7, 0, plinthH, 0.22);
  addBand('corpus', 0xba68c8, plinthH, corpusH, 0.16);

  sectionData.group.add(roleGroup);
}

export function setHorizontalRoleSectionsEnabled(enabled) {
  __horizontalRoleSectionsEnabled = !!enabled;
  if (!Array.isArray(state.customSections)) return;
  state.customSections.forEach((sec) => {
    if (!sec || !sec.group) return;
    let hasDebugGroup = false;
    sec.group.traverse((obj) => {
      if (obj?.userData?.isHorizontalRoleSectionGroup) {
        hasDebugGroup = true;
        obj.visible = __horizontalRoleSectionsEnabled;
      }
    });
    if (!hasDebugGroup && __horizontalRoleSectionsEnabled) createHorizontalRoleSections(sec);
  });
}

// ,     L‑ (back ↔ right)
let isLShapeSyncInProgress = false;

/**
 *   :   ,  .
 *  sectionId      .
 */
export function hideAllSectionsExcept(sectionId = null) {
  if (!Array.isArray(state.customSections)) return;
  state.customSections.forEach((sec) => {
    if (!sec || !sec.group) return;
    if (!sectionId) {
      sec.group.visible = true;
    } else {
      sec.group.visible = sec.id === sectionId;
    }
  });
}

/**
 *   :    L‑ 
 * (lShape.role === 'back') и оставить видимой только её.
 */
export function showOnlyLShapeBackSection() {
  if (!Array.isArray(state.customSections)) return;
  const target = state.customSections.find(
    (s) =>
      s &&
      s.group &&
      s.wallName === 'back' &&
      s.lShape &&
      (getLShapeTypeKey(s) === 'corner-back-right' || getLShapeTypeKey(s) === 'corner-back-left') &&
      s.lShape.role === 'back'
  );
  if (!target || !target.id) return;
  hideAllSectionsExcept(target.id);
}

//       ( ).
if (typeof window !== 'undefined') {
  window.hideAllSectionsExcept = hideAllSectionsExcept;
  window.showOnlyLShapeBackSection = showOnlyLShapeBackSection;
}

function getSectionOffsetsMm(sectionData) {
  const o = sectionData && sectionData.offsets ? sectionData.offsets : {};
  return {
    leftMm: o.leftMm || 0,
    rightMm: o.rightMm || 0,
    frontMm: o.frontMm || 0,
    backMm: o.backMm || 0,
    bottomMm: o.bottomMm || 0,
    topMm: o.topMm || 0,
  };
}

/**       (/). */
function sectionHasSpanAlong(sectionData) {
  const a = Number(sectionData?.spanAlongA);
  const b = Number(sectionData?.spanAlongB);
  return Number.isFinite(a) && Number.isFinite(b) && b - a > 1;
}

/**
 *     :  ,      .
 *       =  +   (~300 ).
 */
function computeSectionAlongOffsetsCmFromWorld(sectionData) {
  if (!sectionData?.group || !state.room?.group) {
    return { left: 0, right: 0, front: 0, back: 0 };
  }
  const wallName = sectionData.wallName || 'back';
  const roomWorldPos = new THREE.Vector3();
  state.room.group.getWorldPosition(roomWorldPos);
  const local = sectionData.group.position.clone().sub(roomWorldPos);
  const size = sectionData.size || { x: 0, y: 0, z: 0 };
  const hasSpan = sectionHasSpanAlong(sectionData);
  const spanA = hasSpan ? Number(sectionData.spanAlongA) : 0;
  const spanB = hasSpan
    ? Number(sectionData.spanAlongB)
    : wallName === 'left' || wallName === 'right'
      ? Number(state.room.depth) || 0
      : Number(state.room.width) || 0;

  if (wallName === 'back') {
    return {
      left: Math.max(0, (local.x - spanA) / 10),
      right: Math.max(0, (spanB - local.x - Number(size.x || 0)) / 10),
      front: 0,
      back: 0,
    };
  }
  if (wallName === 'front') {
    //  :    −X.
    return {
      left: Math.max(0, (local.x - Number(size.x || 0) - spanA) / 10),
      right: Math.max(0, (spanB - local.x) / 10),
      front: 0,
      back: 0,
    };
  }
  if (wallName === 'left') {
    //  :  Z  -size.z  0.
    return {
      left: 0,
      right: 0,
      front: Math.max(0, (local.z - Number(size.z || 0) - spanA) / 10),
      back: Math.max(0, (spanB - local.z) / 10),
    };
  }
  // right:  , Z 0..size.z
  return {
    left: 0,
    right: 0,
    front: Math.max(0, (local.z - spanA) / 10),
    back: Math.max(0, (spanB - local.z - Number(size.z || 0)) / 10),
  };
}

/**   /    ( ). */
function removeSectionSideTrimMeshes(sectionGroup) {
  if (!sectionGroup?.traverse) return;
  const toRemove = [];
  sectionGroup.traverse((obj) => {
    if (obj?.isMesh && _SIDE_TRIM_MESH_RE.test(obj.name || '')) toRemove.push(obj);
  });
  for (const obj of toRemove) {
    try {
      obj.geometry?.dispose?.();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m?.dispose?.());
        else obj.material.dispose?.();
      }
      obj.parent?.remove(obj);
    } catch (_) {}
  }
}

function getSectionSizeFromArgs(sectionData, width, height, depth) {
  if (sectionData && sectionData.size) {
    return sectionData.size;
  }
  return { x: width, y: height, z: depth };
}

function createPlankMaterial() {
  return new THREE.MeshStandardMaterial({
    //    /   ,
    //       .
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.8,
  });
}

function shouldShowCornerPlankDebugMarkers() {
  try {
    //      window   .
    if (typeof window.DEBUG_CORNER_PLANK_MARKERS !== 'undefined') {
      return Boolean(window.DEBUG_CORNER_PLANK_MARKERS);
    }
    //         .
    const activeLayoutKey =
      state.pendingLayoutKey ||
      (window.selectedRoomLayout && window.selectedRoomLayout.key) ||
      null;
    const lTypeKey = getLShapeTypeKey(sectionData);
    return isCornerLayoutKey(activeLayoutKey);
  } catch {
    return false;
  }
}

function addDebugMarkerToSection(sectionGroup, localPos, color = 0xff00ff, name = 'DebugMarker') {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(20, 10, 8),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthTest: false })
  );
  m.name = name;
  m.userData.isCornerPlankDebugMarker = true;
  m.position.copy(localPos);
  m.renderOrder = 200;
  sectionGroup.add(m);
}

function addDefaultTopPlank(sectionGroup, width, height, depth, wallName, sectionData = null) {
  const mat = createPlankMaterial();
  const topH = resolveSectionTopPlankHeightMm(sectionData);
  if (!(topH > 0)) return;
  let geom;
  const plank = new THREE.Mesh(undefined, mat);
  plank.name = 'TopPlank';
  plank.userData.isTopPlank = true;
  plank.userData.isFacade = true;
  plank.userData.isSectionFacadeTrim = true;
  plank.userData.sectionTrimUsesOutsideDecor = true;
  plank.userData.plankHeight = topH;
  assignTrimPartKeyToMesh(plank, wallName);

  if (wallName === 'left' || wallName === 'right') {
    geom = new THREE.BoxGeometry(TOP_PLANK_THICKNESS_MM, topH, depth);
    plank.geometry = geom;
    const plankX =
      wallName === 'left'
        ? width - TOP_PLANK_THICKNESS_MM / 2
        : -width + TOP_PLANK_THICKNESS_MM / 2;
    // Левая секция: локальный Z от -depth до 0 (пивот сзади), центр по Z = -depth/2. Правая: 0..depth, центр depth/2.
    const plankZ = wallName === 'left' ? -depth / 2 : depth / 2;
    plank.position.set(plankX, height - topH / 2, plankZ);
  } else {
    geom = new THREE.BoxGeometry(width, topH, TOP_PLANK_THICKNESS_MM);
    plank.geometry = geom;
    const topPlankZ =
      wallName === 'front'
        ? -depth + TOP_PLANK_THICKNESS_MM / 2
        : depth - TOP_PLANK_THICKNESS_MM / 2;
    const topPlankX = wallName === 'front' ? -width / 2 : width / 2;
    plank.position.set(topPlankX, height - topH / 2, topPlankZ);
  }

  if (typeof window !== 'undefined' && window.__CLD_DEBUG_PLACE === true) {
    if (wallName === 'left') {
      console.log('[TOP-PLANK left]', { localZ: plank.position.z, expectedCenter: -depth / 2, depth });
    }
    console.log('[TOP-PLANK]', {
      wallName,
      args: { width, height, depth, topH },
      geomSize: geom.parameters,
      localPosition: plank.position.clone(),
    });
  }

  sectionGroup.add(plank);
}

//  :  ,   
function addDefaultBottomPlank(sectionGroup, width, height, depth, wallName, sectionData = null) {
  const mat = createPlankMaterial();
  let geom;
  const plank = new THREE.Mesh(undefined, mat);
  plank.name = 'BottomPlank';
  plank.userData.isBottomPlank = true;
  plank.userData.isFacade = true;
  plank.userData.isSectionFacadeTrim = true;
  plank.userData.sectionTrimUsesOutsideDecor = true;
  plank.userData.plankHeight = BOTTOM_PLANK_HEIGHT_MM;
  assignTrimPartKeyToMesh(plank, wallName);

  if (wallName === 'left' || wallName === 'right') {
    geom = new THREE.BoxGeometry(TOP_PLANK_THICKNESS_MM, BOTTOM_PLANK_HEIGHT_MM, depth);
    plank.geometry = geom;

    //   (   )
    let plankX =
      wallName === 'left'
        ? width - TOP_PLANK_THICKNESS_MM / 2
        : -width + TOP_PLANK_THICKNESS_MM / 2;
    const plankZ = wallName === 'left' ? -depth / 2 : depth / 2;

    //   L‑ (/ )   
    //    ,   ,  16  " "   .
    const isRightAttachedL =
      sectionData &&
      sectionData.lShape &&
      getLShapeTypeKey(sectionData) === 'corner-back-right' &&
      sectionData.lShape.role === 'right';
    //    (  right,   front):
    //       16   ,  
    //  ""  ,     .
    const isRightPrimaryCornerRF =
      sectionData &&
      sectionData.lShape &&
      sectionData.lShape.type === 'corner-right-front' &&
      sectionData.lShape.role === 'right';
    const isLeftAttachedL =
      sectionData &&
      sectionData.lShape &&
      getLShapeTypeKey(sectionData) === 'corner-back-left' &&
      sectionData.lShape.role === 'left';

    if (isLeftAttachedL && wallName === 'left') {
      //  : X      →   =  X.
      plankX -= TOP_PLANK_THICKNESS_MM;
    } else if ((isRightAttachedL || isRightPrimaryCornerRF) && wallName === 'right') {
      //  : X      ( ) →   =  X.
      plankX += TOP_PLANK_THICKNESS_MM;
    }

    plank.position.set(plankX, BOTTOM_PLANK_HEIGHT_MM / 2, plankZ);
  } else {
    geom = new THREE.BoxGeometry(width, BOTTOM_PLANK_HEIGHT_MM, BOTTOM_PLANK_THICKNESS_MM);
    plank.geometry = geom;
    const bottomPlankZ =
      wallName === 'front'
        ? -depth + TOP_PLANK_THICKNESS_MM + BOTTOM_PLANK_THICKNESS_MM / 2
        : depth - TOP_PLANK_THICKNESS_MM - BOTTOM_PLANK_THICKNESS_MM / 2;
    const bottomPlankX = wallName === 'front' ? -width / 2 : width / 2;
    plank.position.set(bottomPlankX, BOTTOM_PLANK_HEIGHT_MM / 2, bottomPlankZ);
  }

  sectionGroup.add(plank);
}

// (L‑corner) маркеры/стыки/создание вынесены в `l-corner.js`

//   L‑,       
// (типы 'corner-left-back' / 'corner-right-back'), хотим, чтобы в модалке
// " /"    ,     .
//   ,        
//     ( ),   :
//  -         0;
//  -       .
export function getBackAttachedCornerBase(sectionData) {
  if (!sectionData || sectionData.wallName !== 'back' || !sectionData.lShape) {
    return null;
  }

  const type = sectionData.lShape.type || '';
  let sideKey = null; // 'left' | 'right'

  if (type === 'corner-left-back') {
    //    ,   .
    //       .  =   () ,
    //   leftMm (   leftMm=0).
    sideKey = 'left';
  } else if (type === 'corner-right-back') {
    //    ,   .
    //       .
    sideKey = 'right';
  } else {
    return null;
  }

  let baseCm = 0;
  if (type === 'corner-left-back') {
    const pairId = sectionData.lShape.pairId || null;
    const primarySection = pairId && Array.isArray(state.customSections)
      ? state.customSections.find((s) => s && s.id === pairId && s.wallName === 'left')
      : null;
    if (primarySection && primarySection.size && Number.isFinite(primarySection.size.x)) {
      baseCm = primarySection.size.x / 10;
    }
  } else {
    const offsetsMm = getSectionOffsetsMm(sectionData) || {};
    const prop = sideKey + 'Mm';
    baseCm = typeof offsetsMm[prop] === 'number' ? offsetsMm[prop] / 10 : 0;
  }

  return { sideKey, baseCm };
}

//     L‑,   
// стоит на передней стене (типы 'corner-left-front' / 'corner-right-front').
//   : ,   0      
//  ,     .
export function getFrontAttachedCornerBase(sectionData) {
  if (!sectionData || sectionData.wallName !== 'front' || !sectionData.lShape) {
    return null;
  }

  const type = sectionData.lShape.type || '';
  let sideKey = null; // 'left' | 'right'

  if (type === 'corner-left-front') {
    //    ,   .
    //       .
    sideKey = 'left';
  } else if (type === 'corner-right-front') {
    //    ,   .
    //       .
    sideKey = 'right';
  } else {
    return null;
  }

  const offsetsMm = getSectionOffsetsMm(sectionData) || {};
  const prop = sideKey + 'Mm';
  const baseCm =
    typeof offsetsMm[prop] === 'number' ? offsetsMm[prop] / 10 : 0;

  return { sideKey, baseCm };
}

const _SIDE_TRIM_MESH_RE = /^(SideOverlay|SidePlank)(Left|Right|Front|Back)$/;

/** Если секция сдвинута от стены, а leftMm/rightMm ещё 0 — подтянуть offsets из позиции. */
function syncSectionOffsetsFromWorldPosition(sectionData) {
  if (!sectionData?.group || !state.room?.group) return;
  const wallName = sectionData.wallName || 'back';
  const o = sectionData.offsets || {};
  const along = computeSectionAlongOffsetsCmFromWorld(sectionData);

  if (wallName === 'back' || wallName === 'front') {
    const leftMm = Math.max(0, Math.round((along.left || 0) * 10));
    const rightMm = Math.max(0, Math.round((along.right || 0) * 10));
    //            .
    if (leftMm > 5 && (o.leftMm || 0) <= 5) {
      sectionData.offsets = { ...o, leftMm, rightMm: o.rightMm ?? rightMm };
    } else if (rightMm > 5 && (o.rightMm || 0) <= 5) {
      sectionData.offsets = { ...o, rightMm, leftMm: o.leftMm ?? leftMm };
    }
  } else if (wallName === 'left' || wallName === 'right') {
    const frontMm = Math.max(0, Math.round((along.front || 0) * 10));
    const backMm = Math.max(0, Math.round((along.back || 0) * 10));
    if (frontMm > 5 && (o.frontMm || 0) <= 5) {
      sectionData.offsets = { ...o, frontMm, backMm: o.backMm ?? backMm };
    } else if (backMm > 5 && (o.backMm || 0) <= 5) {
      sectionData.offsets = { ...o, backMm, frontMm: o.frontMm ?? frontMm };
    }
  }
}

/**
 * Планка 50 мм vs накладка 16 мм должны совпадать с offsets.leftMm/rightMm.
 *      SidePlank    .
 * @param {string} wallName
 * @param {{ skipFurnitureUpdate?: boolean }} [opts]
 *   skipFurnitureUpdate — place: только боковины, без updateFurnitureInSection (Clodis×N на мосту).
 */
export function reconcileSectionSideTrimForWall(wallName, opts = {}) {
  if (!Array.isArray(state.customSections)) return;
  const norm = String(wallName || '').trim().toLowerCase();
  const skipFurnitureUpdate = opts?.skipFurnitureUpdate === true;

  for (const sec of state.customSections) {
    if ((sec.wallName || '').toLowerCase() !== norm || !sec?.group || !sec?.size) continue;
    syncSectionOffsetsFromWorldPosition(sec);
    const off = getSectionOffsetsMm(sec);
    const eps = 5;
    const spanOpen = getSectionSpanOpenEnds(sec, state.room);
    const alongX = norm === 'front' || norm === 'back';
    const suppressA = alongX
      ? shouldSuppressWindowBridgeBaySeamOverlay(sec, 'left')
      : shouldSuppressWindowBridgeBaySeamOverlay(sec, 'front');
    const suppressB = alongX
      ? shouldSuppressWindowBridgeBaySeamOverlay(sec, 'right')
      : shouldSuppressWindowBridgeBaySeamOverlay(sec, 'back');
    const needOL =
      alongX
        ? (off.leftMm > eps || spanOpen.openMin) && !suppressA
        : (off.frontMm > eps || spanOpen.openMin) && !suppressA;
    const needOR =
      alongX
        ? (off.rightMm > eps || spanOpen.openMax) && !suppressB
        : (off.backMm > eps || spanOpen.openMax) && !suppressB;
    let hasOL = false;
    let hasPL = false;
    let hasOR = false;
    let hasPR = false;
    const nameA = alongX ? 'Left' : 'Front';
    const nameB = alongX ? 'Right' : 'Back';
    sec.group.traverse((obj) => {
      const n = obj?.name || '';
      if (n === `SideOverlay${nameA}`) hasOL = true;
      if (n === `SidePlank${nameA}`) hasPL = true;
      if (n === `SideOverlay${nameB}`) hasOR = true;
      if (n === `SidePlank${nameB}`) hasPR = true;
    });
    const needRebuild =
      (needOL && (!hasOL || hasPL)) ||
      (!needOL && hasOL) ||
      (needOR && (!hasOR || hasPR)) ||
      (!needOR && hasOR);
    if (!needRebuild) continue;

    const toRemove = [];
    sec.group.traverse((obj) => {
      if (obj?.isMesh && _SIDE_TRIM_MESH_RE.test(obj.name || '')) toRemove.push(obj);
    });
    for (const obj of toRemove) {
      try {
        obj.geometry?.dispose?.();
        obj.parent?.remove(obj);
      } catch (_) {}
    }

    addSidePlanksIfNeeded(
      sec.group,
      sec.size.x,
      sec.size.y,
      sec.size.z,
      norm,
      {
        left: off.leftMm / 10,
        right: off.rightMm / 10,
        front: off.frontMm / 10,
        back: off.backMm / 10,
        bottom: off.bottomMm / 10,
        top: off.topMm / 10,
      },
      sec
    );
    // Иначе сырой MeshStandard без step5/IKEA → чёрные накладки (особенно после place-lite).
    try {
      applyStep5DecorToFurnitureGroupImmediate(sec.group);
    } catch (_) {}
    if (typeof window !== 'undefined' && window.__CLD_DEBUG_PLACE === true) {
      console.log('[TRIM-RECONCILE] боковины пересобраны', {
        sectionId: sec.id,
        leftMm: off.leftMm,
        rightMm: off.rightMm,
        overlayLeft: needOL,
        overlayRight: needOR,
        skipFurnitureUpdate,
      });
    }
    //   _sectionGeomRelayoutPending / _relayoutZonesFromPosition:
    //   forceByPosition  computeSectionLayout →  place/
    //    bbox     (cohabit21/22).
    if (
      !skipFurnitureUpdate &&
      typeof window.__clodisUpdateFurnitureInSection === 'function'
    ) {
      try {
        window.__clodisUpdateFurnitureInSection(sec);
      } catch (e) {
        console.warn('[TRIM-RECONCILE] updateFurnitureInSection', e);
      }
    }
  }
}

/**
 *       .
 *   ,       : 50  
 * , 16      .    
 * SidePlank: от пола секции до верха верхней планки (full section height).
 *
 *       (worldToLocal).
 */
function syncEndCabinetWallPlanks(sectionData) {
  const sectionGroup = sectionData?.group;
  if (!sectionGroup) return;

  const stale = [];
  sectionGroup.traverse((obj) => {
    if (obj?.userData?.isEndCabinetWallPlank) stale.push(obj);
  });
  for (const obj of stale) {
    try {
      obj.geometry?.dispose?.();
      obj.parent?.remove(obj);
    } catch (_) {}
  }

  const wallName = sectionData.wallName || 'back';
  const offsets = sectionData.offsets || {};
  const bottomMm = Math.round(Number(offsets.bottomMm) || 0);
  const topMm = Math.round(Number(offsets.topMm) || 0);
  //  createSidePlank:     /  ,
  //      .
  let fullHeight =
    Number(sectionData.size?.y) ||
    Math.max(0, (Number(state.room?.height) || 0) - bottomMm - topMm) ||
    0;

  let topPlankMesh = null;
  sectionGroup.traverse((obj) => {
    if (topPlankMesh || !obj?.userData?.isTopPlank || obj.userData?.isTopPlankSegment) return;
    topPlankMesh = obj;
  });
  if (topPlankMesh?.geometry?.parameters) {
    const topLocal =
      Number(topPlankMesh.position.y) +
      Number(topPlankMesh.geometry.parameters.height || TOP_PLANK_HEIGHT_MM) / 2;
    if (Number.isFinite(topLocal) && topLocal > 1) {
      fullHeight = Math.max(fullHeight, topLocal);
    }
  }
  if (!(fullHeight > 0)) return;

  sectionGroup.updateMatrixWorld(true);

  END_CABINET_SIDES.forEach((side) => {
    if (!isEndCabinetActive(sectionData, side)) return;
    const box = getEndCabinetSlot(sectionData, side)?.wallPlank;
    if (!box || !(box.widthMm > 0)) return;

    const fromSlot = Number(box.sectionHeightMm) || 0;
    const plankH = Math.max(fullHeight, fromSlot);
    const sizeX = Math.max(1, Number(box.size?.x) || END_CABINET_WALL_PLANK_THICKNESS_MM);
    const sizeZ = Math.max(1, Number(box.size?.z) || END_CABINET_WALL_PLANK_WIDTH_MM);
    //     :       .
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(sizeX, plankH, sizeZ),
      createPlankMaterial()
    );
    //        SidePlankLeft,  /
    // опознавали деталь; isEndCabinetWallPlank отличает от обычной планки.
    const sideLabel = String(side).charAt(0).toUpperCase() + String(side).slice(1);
    plank.name = `EndCabinetWallPlank_${sideLabel}`;
    plank.userData.isSidePlank = true;
    plank.userData.isFacade = true;
    plank.userData.isSectionFacadeTrim = true;
    plank.userData.sectionTrimUsesOutsideDecor = true;
    plank.userData.isEndCabinetWallPlank = true;
    plank.userData.endCabinetSide = side;
    plank.userData.plankHeight = plankH;
    plank.userData.sectionId = sectionData.id;
    assignTrimPartKeyToMesh(plank, wallName);
    const local = sectionGroup.worldToLocal(
      new THREE.Vector3(box.center.x, 0, box.center.z)
    );
    // Как createSidePlank: центр по Y на mid-height, низ на локальном 0 секции.
    plank.position.set(local.x, plankH / 2, local.z);
    sectionGroup.add(plank);
  });
}

/**     ,     . */
function syncEndCabinetTopPlanks(sectionData) {
  const sectionGroup = sectionData?.group;
  if (!sectionGroup) return;

  const stale = [];
  sectionGroup.traverse((obj) => {
    if (obj?.userData?.isEndCabinetTopPlank) stale.push(obj);
  });
  for (const obj of stale) {
    try {
      obj.geometry?.dispose?.();
      obj.parent?.remove(obj);
    } catch (_) {}
  }

  sectionGroup.updateMatrixWorld(true);
  END_CABINET_SIDES.forEach((side) => {
    if (!isEndCabinetActive(sectionData, side)) return;
    const box = getEndCabinetSlot(sectionData, side)?.topPlank;
    if (!box || !(box.heightMm > 0)) return;

    const sizeX = Math.max(1, Number(box.size?.x) || 0);
    const sizeY = Math.max(1, Number(box.size?.y) || TOP_PLANK_HEIGHT_MM);
    const sizeZ = Math.max(1, Number(box.size?.z) || 0);
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(sizeX, sizeY, sizeZ),
      createPlankMaterial()
    );
    const sideLabel = String(side).charAt(0).toUpperCase() + String(side).slice(1);
    plank.name = `EndCabinetTopPlank_${sideLabel}`;
    plank.userData.isFacade = true;
    plank.userData.isSectionFacadeTrim = true;
    plank.userData.sectionTrimUsesOutsideDecor = true;
    plank.userData.isEndCabinetTopPlank = true;
    plank.userData.endCabinetSide = side;
    plank.userData.plankHeight = sizeY;
    plank.userData.sectionId = sectionData.id;
    assignTrimPartKeyToMesh(plank, sectionData.wallName || 'back');

    const local = sectionGroup.worldToLocal(box.center.clone());
    plank.position.copy(local);
    sectionGroup.add(plank);
  });
  try {
    applyStep5DecorToFurnitureGroupImmediate(sectionGroup);
  } catch (_) {}
}

/**     :     . */
function runEndCabinetSyncSteps(sectionData, steps) {
  for (const [name, fn] of steps) {
    try {
      fn(sectionData);
    } catch (e) {
      console.warn(`[END-CAB] sync ${name} failed`, e);
    }
  }
}

/**
 *   :   ,     (10016  ),
 *     .       
 *  ,         .
 */
function syncEndCabinetPlinths(sectionData) {
  const sectionGroup = sectionData?.group;
  if (!sectionGroup) return;

  const stale = [];
  sectionGroup.traverse((obj) => {
    if (obj?.userData?.isEndCabinetPlinth) stale.push(obj);
  });
  for (const obj of stale) {
    try {
      obj.geometry?.dispose?.();
      obj.parent?.remove(obj);
    } catch (_) {}
  }

  let rowPlinth = null;
  sectionGroup.traverse((obj) => {
    if (rowPlinth || !obj?.userData?.isBottomPlank) return;
    rowPlinth = obj;
  });
  const rowPlinthHeight = Number(rowPlinth?.geometry?.parameters?.height) || 0;
  const rowPlinthY = Number(rowPlinth?.position?.y);

  sectionGroup.updateMatrixWorld(true);
  END_CABINET_SIDES.forEach((side) => {
    if (!isEndCabinetActive(sectionData, side)) return;
    const box = getEndCabinetSlot(sectionData, side)?.plinth;
    if (!box || !(box.heightMm > 0)) return;

    const sizeY = Math.max(1, rowPlinthHeight || Number(box.size?.y) || BOTTOM_PLANK_HEIGHT_MM);
    const sizeX = Math.max(1, Number(box.size?.x) || 0);
    const sizeZ = Math.max(1, Number(box.size?.z) || 0);
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(sizeX, sizeY, sizeZ),
      createPlankMaterial()
    );
    const sideLabel = String(side).charAt(0).toUpperCase() + String(side).slice(1);
    plinth.name = `EndCabinetPlinth_${sideLabel}`;
    plinth.userData.isFacade = true;
    plinth.userData.isSectionFacadeTrim = true;
    plinth.userData.sectionTrimUsesOutsideDecor = true;
    plinth.userData.isEndCabinetPlinth = true;
    plinth.userData.endCabinetSide = side;
    plinth.userData.plankHeight = sizeY;
    plinth.userData.sectionId = sectionData.id;
    assignTrimPartKeyToMesh(plinth, sectionData.wallName || 'back');

    const local = sectionGroup.worldToLocal(box.center.clone());
    plinth.position.set(
      local.x,
      Number.isFinite(rowPlinthY) ? rowPlinthY : sizeY / 2,
      local.z
    );
    sectionGroup.add(plinth);
  });
  try {
    applyStep5DecorToFurnitureGroupImmediate(sectionGroup);
  } catch (_) {}
}

/**
 * Фасадные полосы одного шкафа: реальные bbox ролей facades_main/facades_top —
 *     ,     .
 *  null,        .
 */
function facadeBandsFromFurnitureGroup(source, sectionData, fallbackHeightMm) {
  if (!source || !sectionData?.group) return null;
  const sectionWorld = new THREE.Vector3();
  sectionData.group.getWorldPosition(sectionWorld);

  const byRole = { facades_main: [], facades_top: [], facades: [] };
  source.traverse((obj) => {
    const role = String(
      obj?.userData?.layoutRole ??
        obj?.userData?.sectionLayoutRole ??
        obj?.userData?.cldBuildItem?.layout_role ??
        ''
    )
      .trim()
      .toLowerCase();
    if (!byRole[role]) return;
    //      ,      bbox.
    let parent = obj.parent;
    while (parent && parent !== source) {
      const parentRole = String(
        parent?.userData?.layoutRole ??
          parent?.userData?.sectionLayoutRole ??
          parent?.userData?.cldBuildItem?.layout_role ??
          ''
      )
        .trim()
        .toLowerCase();
      if (parentRole === role) return;
      parent = parent.parent;
    }
    byRole[role].push(obj);
  });

  const bandFromRoles = (roles, bandRole) => {
    const box = new THREE.Box3();
    for (const role of roles) {
      for (const node of byRole[role] || []) {
        const nodeBox = new THREE.Box3().setFromObject(node);
        if (!nodeBox.isEmpty()) box.union(nodeBox);
      }
    }
    if (box.isEmpty()) return null;
    const minY = Math.max(0, box.min.y - sectionWorld.y);
    //              .
    const maxY = Math.min(Math.max(1, fallbackHeightMm), box.max.y - sectionWorld.y);
    return maxY - minY > 1 ? { role: bandRole, minY, maxY } : null;
  };

  return withFurnitureDoorSwingsClosedForMeasure(source, () => {
    //         .
    if (source.userData?.unifiedFacade === true) {
      const united = bandFromRoles(['facades', 'facades_main', 'facades_top'], 'facades');
      if (united) return [united];
    }
    const main = bandFromRoles(['facades_main'], 'facades_main');
    const top = bandFromRoles(['facades_top'], 'facades_top');
    if (main && top) return [main, top].sort((a, b) => a.minY - b.minY);
    const whole = bandFromRoles(['facades'], 'facades');
    if (whole) return [whole];
    return null;
  });
}

/**     ,    . */
function findEndCabinetFurnitureGroup(sectionData, side) {
  if (!state.scene || !sectionData?.id) return null;
  let found = null;
  state.scene.traverse((obj) => {
    if (found || !obj?.isGroup) return;
    const ud = obj.userData;
    if (!ud?.isFurniture || ud.isEndCabinet !== true) return;
    if (String(ud.sectionId) !== String(sectionData.id)) return;
    if (String(ud.endCabinetSide || '') !== String(side)) return;
    found = obj;
  });
  return found;
}

/**           . */
function findRowFacadeSourceGroup(sectionData, side) {
  if (!state.scene || !sectionData?.id) return null;
  const groups = [];
  state.scene.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?.isFurniture || obj.userData?.isEndCabinet) return;
    if (String(obj.userData.sectionId) !== String(sectionData.id)) return;
    if (obj.userData.__placementKind === PLACEMENT_KIND.STANDALONE_FLOOR) return;
    groups.push(obj);
  });
  if (!groups.length) return null;
  const preferLowZone = side === 'left' || side === 'front';
  groups.sort((a, b) => {
    const az = Number(a.userData?.zoneIndex);
    const bz = Number(b.userData?.zoneIndex);
    const av = Number.isFinite(az) ? az : 0;
    const bv = Number.isFinite(bz) ? bz : 0;
    return preferLowZone ? av - bv : bv - av;
  });
  return groups[0];
}

/**
 *             
 * (    ).  :     (30 ,
 *     4). :   ,    .
 */
function facadeBandsFromSectionRules(sectionData, fallbackHeightMm) {
  const metrics = getSlotVerticalMetrics(sectionData);
  const plinthMm = Math.max(0, Number(metrics.bottomPlankMm) || 0);
  const overhangMm = Math.max(0, Number(resolveLowerFacadeBottomOverhangMm(plinthMm)) || 0);
  const minY = Math.max(0, plinthMm - overhangMm);
  const nicheTopMm = plinthMm + Math.max(0, Number(metrics.innerHeightMm) || 0);
  const maxY = Math.min(Math.max(1, fallbackHeightMm), nicheTopMm);
  return maxY - minY > 1 ? [{ role: 'facades', minY, maxY }] : null;
}

/**
 *     .
 * 1)          ,    ;
 * 2)        ;
 * 3)        ,  .
 */
function resolveEndCabinetOverlayBands(sectionData, side, fallbackHeightMm) {
  const fallback = [{ role: 'facades', minY: 0, maxY: Math.max(1, fallbackHeightMm) }];
  if (!state.scene || !sectionData?.id || !sectionData.group) return fallback;

  const own = findEndCabinetFurnitureGroup(sectionData, side);
  const ownBands = facadeBandsFromFurnitureGroup(own, sectionData, fallbackHeightMm);
  if (ownBands) return ownBands;

  const row = findRowFacadeSourceGroup(sectionData, side);
  const rowBands = facadeBandsFromFurnitureGroup(row, sectionData, fallbackHeightMm);
  if (rowBands) return rowBands;

  return facadeBandsFromSectionRules(sectionData, fallbackHeightMm) || fallback;
}

/**
 *          .
 * Одна деталь для цельного фасада либо две детали по facades_main/facades_top.
 */
function syncEndCabinetFacadeOverlays(sectionData) {
  const sectionGroup = sectionData?.group;
  if (!sectionGroup) return;

  const stale = [];
  sectionGroup.traverse((obj) => {
    if (obj?.userData?.isEndCabinetFacadeOverlay) stale.push(obj);
  });
  for (const obj of stale) {
    try {
      obj.geometry?.dispose?.();
      obj.parent?.remove(obj);
    } catch (_) {}
  }

  sectionGroup.updateMatrixWorld(true);
  END_CABINET_SIDES.forEach((side) => {
    if (!isEndCabinetActive(sectionData, side)) return;
    const slot = getEndCabinetSlot(sectionData, side);
    const overlayBox = slot?.facadeOverlay;
    if (!overlayBox || !(overlayBox.thicknessMm > 0)) return;

    const bands = resolveEndCabinetOverlayBands(sectionData, side, Number(slot.heightMm) || 0);
    const sideLabel = String(side).charAt(0).toUpperCase() + String(side).slice(1);
    for (const band of bands) {
      const height = Math.max(1, Number(band.maxY) - Number(band.minY));
      const sizeX = Math.max(1, Number(overlayBox.size?.x) || 0);
      const sizeZ = Math.max(1, Number(overlayBox.size?.z) || 0);
      const overlay = new THREE.Mesh(
        new THREE.BoxGeometry(sizeX, height, sizeZ),
        createPlankMaterial()
      );
      const bandLabel =
        band.role === 'facades_main'
          ? 'Main'
          : band.role === 'facades_top'
            ? 'Top'
            : 'Whole';
      overlay.name = `EndCabinetFacadeOverlay_${sideLabel}_${bandLabel}`;
      overlay.userData.isFacade = true;
      overlay.userData.isSectionFacadeTrim = true;
      overlay.userData.sectionTrimUsesOutsideDecor = true;
      overlay.userData.isEndCabinetFacadeOverlay = true;
      overlay.userData.endCabinetSide = side;
      overlay.userData.layoutRole = band.role;
      overlay.userData.plankHeight = height;
      overlay.userData.sectionId = sectionData.id;
      assignTrimPartKeyToMesh(overlay, sectionData.wallName || 'back');

      const worldCenter = new THREE.Vector3(
        overlayBox.center.x,
        sectionWorldY(sectionData) + Number(band.minY) + height / 2,
        overlayBox.center.z
      );
      const local = sectionGroup.worldToLocal(worldCenter);
      overlay.position.copy(local);
      sectionGroup.add(overlay);
    }
  });
  try {
    applyStep5DecorToFurnitureGroupImmediate(sectionGroup);
  } catch (_) {}
}

function sectionWorldY(sectionData) {
  const world = new THREE.Vector3();
  sectionData?.group?.getWorldPosition?.(world);
  return world.y;
}

//   : /   .
// offsets — реальные отступы в сантиметрах из формы (left/right для front/back стены, front/back для боковых).
/**
 * Выставить №1/№3 по мировому span U (единый контракт computeHorizontalTrimSpanU).
 * axisAlongU: 'x' для front/back, 'z' для left/right.
 */
function _applyHorizontalPlanksWorldSpanU(sectionGroup, wallName, uLo, uHi, kind, sectionData = null) {
  if (!sectionGroup || !(uHi - uLo > 1)) return;
  const useZ = wallName === 'left' || wallName === 'right';
  const pivot = sectionGroup.position;
  const span = uHi - uLo;
  const centerU = (uLo + uHi) / 2;
  const isTop = kind === 'top';
  //  TOP_PLANK_HEIGHT_MM:   filler.topMm     50  
  //       .
  const plankH = isTop
    ? resolveSectionTopPlankHeightMm(sectionData)
    : BOTTOM_PLANK_HEIGHT_MM;
  if (isTop && !(plankH > 0)) return;
  const plankD = isTop ? TOP_PLANK_THICKNESS_MM : BOTTOM_PLANK_THICKNESS_MM;
  const sizeY = Number(sectionData?.size?.y) || 0;

  sectionGroup.traverse((child) => {
    if (!child?.userData) return;
    if (isTop && !child.userData.isTopPlank) return;
    if (!isTop && !child.userData.isBottomPlank) return;
    // 6.6 length  6.2 TopPlankSegment    transition;  span 1/3
    //     (    center = size/2).
    if (child.userData.isPlankLengthSegment) return;
    if (child.userData.isTopPlankSegment) return;
    if (child.userData.isEndCabinetTopPlank || child.userData.isEndCabinetBottomPlank) return;
    // U  :         span.
    if (child.userData.isWindowBridgePart) return;

    if (child.geometry) child.geometry.dispose();
    if (useZ) {
      child.geometry = new THREE.BoxGeometry(TOP_PLANK_THICKNESS_MM, plankH, span);
      child.position.z = centerU - pivot.z;
    } else {
      child.geometry = new THREE.BoxGeometry(span, plankH, plankD);
      child.position.x = centerU - pivot.x;
    }
    if (isTop && sizeY > 0 && plankH >= 0) {
      child.position.y = sizeY - plankH / 2;
      child.userData.plankHeight = plankH;
    }
  });
}

/** Применить эталонный span №1/№3; L-overlapMm режет max-край (правый/задний). */
function _applySectionHorizontalPlanksFromContract(sectionData, sectionGroup, wallName, lOverlapMaxMm = 0, lOverlapMinMm = 0) {
  if (!sectionData?.group && sectionData) sectionData.group = sectionGroup;
  if (!sectionData?.size || !sectionGroup) return false;
  try {
    const top = computeHorizontalTrimSpanU(sectionData, { forPlinth: false });
    const bot = computeHorizontalTrimSpanU(sectionData, { forPlinth: true });
    let topLo = top.uLo + lOverlapMinMm;
    let topHi = top.uHi - lOverlapMaxMm;
    let botLo = bot.uLo + lOverlapMinMm;
    let botHi = bot.uHi - lOverlapMaxMm;
    if (!(topHi - topLo > 1) || !(botHi - botLo > 1)) return false;
    _applyHorizontalPlanksWorldSpanU(sectionGroup, wallName, topLo, topHi, 'top', sectionData);
    _applyHorizontalPlanksWorldSpanU(sectionGroup, wallName, botLo, botHi, 'bottom', sectionData);
    if (typeof window !== 'undefined' && window.__CLD_DEBUG_PLACE === true) {
      console.log('[H-TRIM-SPAN]', {
        wall: wallName,
        minKind: top.minKind,
        maxKind: top.maxKind,
        topMm: Math.round(topHi - topLo),
        botMm: Math.round(botHi - botLo),
        outer: [Math.round(top.bounds.outerMinU), Math.round(top.bounds.outerMaxU)],
        inner: [Math.round(top.bounds.innerStartU), Math.round(top.bounds.innerEndU)],
      });
    }
    return true;
  } catch (e) {
    console.warn('[H-TRIM-SPAN] fail', e);
    return false;
  }
}

/**     (trio / bay / legacy bridge)      UX. */
function isWindowAlongLayoutSection(sectionData) {
  if (!sectionData) return false;
  if (sectionData.windowAlongWallGroupId || sectionData.windowAlongWallRole) return true;
  if (sectionData.underWindowBay) return true;
  const role = String(sectionData.windowBridgeRole || '');
  return (
    role === 'under-window' ||
    role === 'tall-left' ||
    role === 'tall-right'
  );
}

/**
 *   /   L (6.8 A1):  .
 *    . L   blanket-exclude ( 4.0   left/right).
 */
function isStraightLayoutSection(sectionData) {
  if (!sectionData) return false;
  if (isWindowAlongLayoutSection(sectionData)) return false;
  return true;
}

function setSectionEmptyFrameMeshesVisible(sectionGroup, visible) {
  if (!sectionGroup) return;
  const show = !!visible;
  sectionGroup.traverse((obj) => {
    if (obj === sectionGroup) return;
    if (!isEmptySectionFrameTrimObject(obj)) return;
    obj.visible = show;
  });
}

/**
 *    :
 *   →    (   insets / 5  );
 *    →     ; - ;
 *   : TopPlankSegment (6.2)  length-  ;    .
 *  forcibly  isPlankLengthSegment     6.2 (  ).
 */
function applyStraightFrameVisibility(sectionData) {
  const g = sectionData?.group;
  if (!g) return;
  const hasFurn = sectionHasPlacedFurniture(sectionData);
  if (!hasFurn) {
    setSectionEmptyFrameMeshesVisible(g, false);
    return;
  }
  let hasTopPlankSegment = false;
  g.traverse((obj) => {
    if (obj?.userData?.isTopPlankSegment) hasTopPlankSegment = true;
  });
  g.traverse((obj) => {
    if (obj === g) return;
    if (!isEmptySectionFrameTrimObject(obj)) return;
    const ud = obj.userData || {};
    if (ud.isSidePlank || ud.isSideOverlay) {
      const n = String(obj.name || '');
      let side = null;
      if (/Left/i.test(n)) side = 'left';
      else if (/Right/i.test(n)) side = 'right';
      else if (/Front/i.test(n)) side = 'left';
      else if (/Back/i.test(n)) side = 'right';
      obj.visible = !side || sectionHasFurnitureNearLocalSide(sectionData, side);
      return;
    }
    if (ud.isTopPlankSegment) {
      obj.visible = true;
      return;
    }
    if (ud.isTopPlank && ud.isPlankLengthSegment) {
      //  6.2     length-  .
      obj.visible = !hasTopPlankSegment;
      return;
    }
    if (ud.isBottomPlank && ud.isPlankLengthSegment) {
      obj.visible = true;
      return;
    }
    obj.visible = false;
  });
}

/**     .        (  ). */
export function syncStraightEmptyFrameVisibility(sectionData) {
  if (!isStraightLayoutSection(sectionData)) return false;
  if (!sectionData.group) return false;
  applyStraightFrameVisibility(sectionData);
  return true;
}

/**   :    create / place / resize. */
export function syncSectionEmptyFrameVisibility(sectionData) {
  if (!sectionData) return false;
  if (isWindowAlongLayoutSection(sectionData)) {
    return syncWindowAlongEmptyFrameVisibility(sectionData);
  }
  return syncStraightEmptyFrameVisibility(sectionData);
}

function sectionHasPlacedFurniture(sectionData) {
  if (!sectionData?.id || !state.scene) return false;
  const sid = String(sectionData.id);
  let found = false;
  state.scene.traverse((obj) => {
    if (found) return;
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    if (obj.userData.isEndCabinetSlot === true) return;
    if (obj.userData.isGhost || obj.userData.isGhostClodisPrebuild) return;
    if (String(obj.userData.sectionId) !== sid) return;
    found = true;
  });
  return found;
}

/**       ( /)       . */
function sectionHasNicheWardrobe(sectionData) {
  if (!sectionData?.id || !state.scene) return false;
  const sid = String(sectionData.id);
  let found = false;
  state.scene.traverse((obj) => {
    if (found) return;
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    if (obj.userData.isEndCabinetSlot === true) return;
    if (obj.userData.isGhost || obj.userData.isGhostClodisPrebuild) return;
    if (String(obj.userData.sectionId) !== sid) return;
    const pk = String(obj.userData.__placementKind || obj.userData.placementKind || '');
    //  /          .
    if (isLowFurniturePlacementKind(pk)) return;
    found = true;
  });
  return found;
}

/**
 *  TopPlank (    ).
 *             ; /  AutoTop  .
 */
function sectionShouldHaveCeilingTopPlank(sectionData) {
  if (!sectionData) return false;
  if (Number(sectionData.fixedHeightMm) > 0 || sectionData.underWindowBay) return false;
  if (String(sectionData.windowAlongWallRole || sectionData.windowBridgeRole || '') === 'under-window') {
    return false;
  }
  if (isWindowAlongLayoutSection(sectionData)) {
    return sectionHasNicheWardrobe(sectionData);
  }
  return true;
}

/**
 *      ,    / (   ).
 * =     (standalone / sill),  roomH   + .
 */
function getWindowAlongDresserSideTrimHeightMm(sectionData) {
  if (!sectionData || !isWindowAlongLayoutSection(sectionData)) return 0;
  if (sectionHasNicheWardrobe(sectionData)) return 0;

  let sillH = 0;
  const gid = sectionData.windowAlongWallGroupId || sectionData.windowBridgeGroupId;
  if (gid && Array.isArray(state.customSections)) {
    for (const sec of state.customSections) {
      if (!sec) continue;
      if (sec.windowAlongWallGroupId !== gid && sec.windowBridgeGroupId !== gid) continue;
      const role = String(sec.windowAlongWallRole || sec.windowBridgeRole || '');
      const isUnder =
        role === 'under-window' ||
        !!sec.underWindowBay ||
        Number(sec.fixedHeightMm) > 0;
      if (!isUnder) continue;
      const hy =
        Number(sec.fixedHeightMm) ||
        Number(sec.sillMm) ||
        Number(sec.size?.y) ||
        0;
      if (hy > 50) {
        sillH = Math.round(hy);
        break;
      }
    }
  }

  const floorH = Number(sectionData.standaloneFloorHeightMm) || 0;
  if (floorH > 0 && sillH > 0) return Math.min(Math.round(floorH), sillH);
  if (floorH > 0) return Math.round(floorH);
  if (sillH > 0) return sillH;
  return 0;
}

/**
 *        SideOverlay/    .
 * which: 'left'|'right' = logical min/max  world-U ( 6.3):
 *   back/front → Left/Right; left/right → Front/Back (Front=min, Back=max).
 *   ,  `_filterFurnitureNearSectionUEdge` ( local-X ).
 */
function sectionHasFurnitureNearLocalSide(sectionData, which) {
  if (!sectionData?.id || !sectionData.group || !sectionData.size || !state.scene) {
    return false;
  }
  const wall = String(sectionData.wallName || 'back').toLowerCase();
  const useZ = wall === 'left' || wall === 'right';
  const size = sectionData.size;
  const span = useZ ? Number(size.z) || 0 : Number(size.x) || 0;
  if (!(span > 10)) return false;

  try {
    sectionData.group.updateMatrixWorld(true);
  } catch (_) {}
  const pos = sectionData.group.position;
  // World-U   ( setFromObject  markers/   span).
  let secUMin;
  let secUMax;
  if (wall === 'back') {
    secUMin = pos.x;
    secUMax = pos.x + span;
  } else if (wall === 'front') {
    secUMin = pos.x - span;
    secUMax = pos.x;
  } else if (wall === 'left') {
    secUMin = pos.z - span;
    secUMax = pos.z;
  } else if (wall === 'right') {
    secUMin = pos.z;
    secUMax = pos.z + span;
  } else {
    return false;
  }

  const part = Number(sectionData.division?.partSize) || 0;
  const band = Math.max(part > 10 ? part * 0.55 : 275, 275);
  const edgeIsMin = which === 'left';
  const sid = String(sectionData.id);
  let found = false;

  state.scene.traverse((obj) => {
    if (found) return;
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    if (obj.userData.isEndCabinetSlot === true) return;
    if (obj.userData.isGhost || obj.userData.isGhostClodisPrebuild) return;
    if (String(obj.userData.sectionId) !== sid) return;
    let b;
    try {
      b = new THREE.Box3().setFromObject(obj);
    } catch (_) {
      return;
    }
    if (b.isEmpty()) return;
    const fMin = useZ ? b.min.z : b.min.x;
    const fMax = useZ ? b.max.z : b.max.x;
    if (edgeIsMin) {
      if (fMin <= secUMin + band) found = true;
    } else if (fMax >= secUMax - band) {
      found = true;
    }
  });
  return found;
}

/**
 *   TopPlank.
 * @param {THREE.Object3D} sectionGroup
 * @param {{ includeSegments?: boolean }} [opts]
 *   includeSegments   6.6 length / 6.2 TopPlankSegment (   filler.topMm,
 *       50  ,  ensure  hasTop   ).
 */
function removeCeilingTopPlankMeshes(sectionGroup, opts = {}) {
  if (!sectionGroup) return;
  const includeSegments = opts.includeSegments === true;
  const toRemove = [];
  sectionGroup.traverse((obj) => {
    if (obj === sectionGroup) return;
    const ud = obj.userData;
    if (!ud) return;
    if (ud.isEndCabinetTopPlank) return;
    if (!includeSegments && (ud.isTopPlankSegment || ud.isPlankLengthSegment)) return;
    if (
      ud.isTopPlank ||
      ud.isTopPlankSegment ||
      (ud.isPlankLengthSegment && ud.isTopPlank) ||
      /^TopPlank/.test(String(obj.name || ''))
    ) {
      toRemove.push(obj);
    }
  });
  for (const obj of toRemove) {
    try {
      obj.geometry?.dispose?.();
      obj.parent?.remove(obj);
    } catch (_) {}
  }
}

function isEmptySectionFrameTrimObject(obj) {
  if (!obj?.userData) return false;
  const ud = obj.userData;
  if (ud.isSectionTransitionPart) return false;
  if (ud.isEndCabinetTopPlank || ud.isEndCabinetBottomPlank || ud.isEndCabinetPlinth) {
    return false;
  }
  if (ud.isEndCabinetFacadeOverlay) return false;
  //  /   /    ..  6.6  legacy bridge.
  if (ud.isTopPlank || ud.isBottomPlank) return true;
  if (ud.isTopPlankSegment || ud.isPlankLengthSegment) return true;
  if (ud.isSideOverlay || ud.isSidePlank) return true;
  if (ud.isWindowBridgePart && (ud.isTopPlank || ud.isBottomPlank || ud.isSideOverlay || ud.isSidePlank)) {
    return true;
  }
  const n = String(obj.name || '');
  return /^(TopPlank|BottomPlank|SideOverlay|SidePlank)/.test(n);
}

function removeWindowAlongEmptyFrameMeshes(sectionGroup) {
  if (!sectionGroup) return;
  const toRemove = [];
  sectionGroup.traverse((obj) => {
    if (obj === sectionGroup) return;
    if (!isEmptySectionFrameTrimObject(obj)) return;
    toRemove.push(obj);
  });
  for (const obj of toRemove) {
    try {
      obj.geometry?.dispose?.();
      obj.parent?.remove(obj);
    } catch (_) {}
  }
}

/**
 *  3 (Opus):    plan.uSpan  ;  plinth     BottomPlank.
 */
function _applyWindowRowPlinthsFromPlan(sectionData, plinthParts, diff) {
  const g = sectionData?.group;
  if (!g) return;
  const wallName = String(sectionData.wallName || 'back').toLowerCase();
  const useZ = wallName === 'left' || wallName === 'right';
  const size = sectionData.size;
  const parts = Array.isArray(plinthParts) ? plinthParts : [];

  const existing = [];
  g.traverse((obj) => {
    if (obj === g || !obj?.isMesh) return;
    if (obj.userData?.isBottomPlank) existing.push(obj);
  });
  const template = existing[0] || null;
  const mat =
    template?.material?.clone?.() ||
    (typeof createPlankMaterial === 'function' ? createPlankMaterial() : null);
  const posY = template ? Number(template.position.y) : BOTTOM_PLANK_HEIGHT_MM / 2;
  const depthAlong =
    template && !useZ
      ? Number(template.position.z)
      : template && useZ
        ? Number(template.position.x)
        : null;

  for (const obj of existing) {
    diff.removed.push(String(obj.userData?.windowRowTrimKey || obj.name || obj.uuid));
    try {
      obj.geometry?.dispose?.();
      obj.parent?.remove(obj);
    } catch (_) {}
  }

  if (!parts.length || !size || !mat) return;

  const pivot = g.position;
  parts.forEach((p, index) => {
    const uLo = Number(p?.uSpan?.min);
    const uHi = Number(p?.uSpan?.max);
    const spanU = uHi - uLo;
    if (!(spanU > 5) || !Number.isFinite(uLo) || !Number.isFinite(uHi)) return;
    const centerU = (uLo + uHi) / 2;

    let mesh;
    if (useZ) {
      let plankX = depthAlong;
      if (!Number.isFinite(plankX)) {
        plankX =
          wallName === 'left'
            ? size.x - TOP_PLANK_THICKNESS_MM / 2
            : -size.x + TOP_PLANK_THICKNESS_MM / 2;
      }
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(BOTTOM_PLANK_THICKNESS_MM, BOTTOM_PLANK_HEIGHT_MM, spanU),
        mat.clone?.() || mat
      );
      mesh.position.set(plankX, posY, centerU - pivot.z);
    } else {
      let plankZ = depthAlong;
      if (!Number.isFinite(plankZ)) {
        plankZ =
          wallName === 'front'
            ? -size.z + TOP_PLANK_THICKNESS_MM + BOTTOM_PLANK_THICKNESS_MM / 2
            : size.z - TOP_PLANK_THICKNESS_MM - BOTTOM_PLANK_THICKNESS_MM / 2;
      }
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(spanU, BOTTOM_PLANK_HEIGHT_MM, BOTTOM_PLANK_THICKNESS_MM),
        mat.clone?.() || mat
      );
      mesh.position.set(centerU - pivot.x, posY, plankZ);
    }

    mesh.name = index === 0 ? 'BottomPlank' : `BottomPlank_${index}`;
    mesh.userData.isBottomPlank = true;
    mesh.userData.isFacade = true;
    mesh.userData.isSectionFacadeTrim = true;
    mesh.userData.sectionTrimUsesOutsideDecor = true;
    mesh.userData.plankHeight = BOTTOM_PLANK_HEIGHT_MM;
    mesh.userData.isPlankLengthSegment = parts.length > 1 || index > 0;
    mesh.userData.windowRowTrimKey = p.key;
    mesh.userData.sectionId = sectionData.id;
    assignTrimPartKeyToMesh(mesh, wallName);
    g.add(mesh);
    diff.created.push(p.key);
  });
}

/**
 *  3:  TopPlank  plan.uSpan ( hasWardrobe  ).
 */
function _applyWindowRowTopPlanksFromPlan(sectionData, topParts, diff) {
  const g = sectionData?.group;
  if (!g) return;
  const wallName = String(sectionData.wallName || 'back').toLowerCase();
  const useZ = wallName === 'left' || wallName === 'right';
  const size = sectionData.size;
  const parts = Array.isArray(topParts) ? topParts : [];
  const height = Number(size?.y) || 0;

  const existing = [];
  g.traverse((obj) => {
    if (obj === g || !obj?.isMesh) return;
    if (obj.userData?.isTopPlank || /^TopPlank/.test(String(obj.name || ''))) {
      existing.push(obj);
    }
  });
  const template = existing[0] || null;
  const mat =
    template?.material?.clone?.() ||
    (typeof createPlankMaterial === 'function' ? createPlankMaterial() : null);

  for (const obj of existing) {
    diff.removed.push(String(obj.userData?.windowRowTrimKey || obj.name || obj.uuid));
    try {
      obj.geometry?.dispose?.();
      obj.parent?.remove(obj);
    } catch (_) {}
  }

  if (!parts.length || !size || !mat || !(height > 50)) return;

  const pivot = g.position;
  const topH = resolveSectionTopPlankHeightMm(sectionData);
  if (!(topH > 0)) return;
  const posY = height - topH / 2;
  parts.forEach((p, index) => {
    const uLo = Number(p?.uSpan?.min);
    const uHi = Number(p?.uSpan?.max);
    const spanU = uHi - uLo;
    if (!(spanU > 5) || !Number.isFinite(uLo) || !Number.isFinite(uHi)) return;
    const centerU = (uLo + uHi) / 2;

    let mesh;
    if (useZ) {
      const plankX =
        wallName === 'left'
          ? size.x - TOP_PLANK_THICKNESS_MM / 2
          : -size.x + TOP_PLANK_THICKNESS_MM / 2;
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(TOP_PLANK_THICKNESS_MM, topH, spanU),
        mat.clone?.() || mat
      );
      mesh.position.set(plankX, posY, centerU - pivot.z);
    } else {
      const plankZ =
        wallName === 'front'
          ? -size.z + TOP_PLANK_THICKNESS_MM / 2
          : size.z - TOP_PLANK_THICKNESS_MM / 2;
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(spanU, topH, TOP_PLANK_THICKNESS_MM),
        mat.clone?.() || mat
      );
      mesh.position.set(centerU - pivot.x, posY, plankZ);
    }

    mesh.name = index === 0 ? 'TopPlank' : `TopPlank_${index}`;
    mesh.userData.isTopPlank = true;
    mesh.userData.isFacade = true;
    mesh.userData.isSectionFacadeTrim = true;
    mesh.userData.sectionTrimUsesOutsideDecor = true;
    mesh.userData.plankHeight = topH;
    mesh.userData.windowRowTrimKey = p.key;
    mesh.userData.sectionId = sectionData.id;
    assignTrimPartKeyToMesh(mesh, wallName);
    g.add(mesh);
    diff.created.push(p.key);
  });
}

/**
 *  3: sidePlank / sideOverlay    ( = yTo).
 */
function _applyWindowRowSidesFromPlan(sectionData, sideParts, diff) {
  const g = sectionData?.group;
  if (!g) return;
  const wallName = String(sectionData.wallName || 'back').toLowerCase();
  const size = sectionData.size;
  const parts = Array.isArray(sideParts) ? sideParts : [];

  const existing = [];
  g.traverse((obj) => {
    if (obj === g || !obj?.isMesh) return;
    if (obj.userData?.isSidePlank || obj.userData?.isSideOverlay) existing.push(obj);
  });
  for (const obj of existing) {
    diff.removed.push(String(obj.userData?.windowRowTrimKey || obj.name || obj.uuid));
    try {
      obj.geometry?.dispose?.();
      obj.parent?.remove(obj);
    } catch (_) {}
  }

  if (!parts.length || !size) return;
  const mat = createPlankMaterial();
  const alongX = wallName === 'front' || wallName === 'back';

  for (const p of parts) {
    const side = String(p.side || '');
    const h = Math.max(1, Math.round(Number(p.yTo) || Number(size.y) || 0));
    const th = Math.max(1, Math.round(Number(p.thicknessMm) || 16));
    const isOverlay = p.kind === 'sideOverlay';

    let mesh;
    if (alongX) {
      const frontZ =
        wallName === 'front'
          ? -size.z + TOP_PLANK_THICKNESS_MM / 2
          : size.z - TOP_PLANK_THICKNESS_MM / 2;
      const frontCenterZ = wallName === 'front' ? -size.z / 2 : size.z / 2;
      const innerLeftX = wallName === 'front' ? -size.x : 0;
      const innerRightX = wallName === 'front' ? 0 : size.x;

      if (isOverlay) {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(th, h, size.z),
          mat.clone?.() || mat
        );
        const x =
          side === 'left'
            ? innerLeftX + th / 2
            : innerRightX - th / 2;
        mesh.position.set(x, h / 2, frontCenterZ);
        mesh.name = side === 'left' ? 'SideOverlayLeft' : 'SideOverlayRight';
        mesh.userData.isSideOverlay = true;
      } else {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(th, h, TOP_PLANK_THICKNESS_MM),
          mat.clone?.() || mat
        );
        const x =
          side === 'left'
            ? innerLeftX + th / 2
            : innerRightX - th / 2;
        mesh.position.set(x, h / 2, frontZ);
        mesh.name = side === 'left' ? 'SidePlankLeft' : 'SidePlankRight';
        mesh.userData.isSidePlank = true;
      }
    } else {
      // left/right:     (W).  7/8  size.x  plankW  U.
      const overlayCenterX = wallName === 'left' ? size.x / 2 : -size.x / 2;
      const isFront = side === 'front';
      if (isOverlay) {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(size.x, h, th),
          mat.clone?.() || mat
        );
        const z = isFront
          ? wallName === 'left'
            ? -size.z + th / 2
            : th / 2
          : wallName === 'left'
            ? -th / 2
            : size.z - th / 2;
        mesh.position.set(overlayCenterX, h / 2, z);
        mesh.name = isFront ? 'SideOverlayFront' : 'SideOverlayBack';
        mesh.userData.isSideOverlay = true;
      } else {
        const plankW = Math.max(1, th);
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(size.x, h, plankW),
          mat.clone?.() || mat
        );
        const z = isFront
          ? wallName === 'left'
            ? -size.z + plankW / 2
            : plankW / 2
          : wallName === 'left'
            ? -plankW / 2
            : size.z - plankW / 2;
        mesh.position.set(overlayCenterX, h / 2, z);
        mesh.name = isFront ? 'SidePlankFront' : 'SidePlankBack';
        mesh.userData.isSidePlank = true;
      }
    }

    if (!mesh) continue;
    mesh.userData.isFacade = true;
    mesh.userData.isSectionFacadeTrim = true;
    mesh.userData.sectionTrimUsesOutsideDecor = true;
    mesh.userData.windowRowTrimKey = p.key;
    mesh.userData.sectionId = sectionData.id;
    assignTrimPartKeyToMesh(mesh, wallName);
    g.add(mesh);
    diff.created.push(p.key);
  }
}

/**
 *  3 Opus: reconcile     frame,   parts  .
 */
function reconcileWindowRowCellByPlan(sectionData, cell, cellParts) {
  const g = sectionData?.group;
  const diff = { created: [], updated: [], removed: [] };
  if (!g) return diff;
  const parts = Array.isArray(cellParts) ? cellParts : [];

  //   frame-   ensure/legacy    .
  const before = [];
  g.traverse((obj) => {
    if (obj === g) return;
    if (!isEmptySectionFrameTrimObject(obj)) return;
    before.push(String(obj.userData?.windowRowTrimKey || obj.name || obj.uuid));
  });
  removeWindowAlongEmptyFrameMeshes(g);
  diff.removed.push(...before);

  _applyWindowRowPlinthsFromPlan(
    sectionData,
    parts.filter((p) => p && p.kind === 'plinth'),
    diff
  );
  _applyWindowRowTopPlanksFromPlan(
    sectionData,
    parts.filter((p) => p && p.kind === 'topPlank'),
    diff
  );
  _applyWindowRowSidesFromPlan(
    sectionData,
    parts.filter((p) => p && (p.kind === 'sidePlank' || p.kind === 'sideOverlay')),
    diff
  );

  void cell;
  return diff;
}

/** @deprecated alias   3  reconcileWindowRowCellByPlan */
function pruneWindowRowCellByPlan(sectionData, cell, cellParts) {
  return reconcileWindowRowCellByPlan(sectionData, cell, cellParts);
}

/**
 *  :     // (  ).
 *  3:       sync   (syncWindowRowTrimForWall).
 */
export function syncWindowAlongEmptyFrameVisibility(sectionData) {
  if (!isWindowAlongLayoutSection(sectionData)) return false;
  if (!isWindowRowTrimApplying() && wallHasWindowRowSections(sectionData.wallName)) {
    syncWindowRowTrimForWall(sectionData.wallName || 'back');
    return true;
  }
  const g = sectionData.group;
  if (!g) return false;
  if (!sectionHasPlacedFurniture(sectionData)) {
    removeWindowAlongEmptyFrameMeshes(g);
    return true;
  }
  if (!sectionShouldHaveCeilingTopPlank(sectionData)) {
    removeCeilingTopPlankMeshes(g);
  }
  let hasBottom = false;
  g.traverse((obj) => {
    if (obj?.userData?.isBottomPlank) hasBottom = true;
  });
  if (!hasBottom && sectionData.size) {
    try {
      addDefaultBottomPlank(
        g,
        sectionData.size.x,
        sectionData.size.y,
        sectionData.size.z,
        sectionData.wallName || 'back',
        sectionData
      );
    } catch (_) {}
  }
  g.traverse((obj) => {
    if (obj === g) return;
    if (!isEmptySectionFrameTrimObject(obj)) return;
    obj.visible = true;
  });
  return true;
}

/**  rebuild transitions:       . */
export function syncWindowAlongEmptyFramesOnWall(wallName, opts = {}) {
  const norm = String(wallName || '').trim().toLowerCase();
  //  3:    →  → apply.
  if (!isWindowRowTrimApplying() && wallHasWindowRowSections(norm)) {
    syncWindowRowTrimForWall(norm);
    return;
  }
  if (!Array.isArray(state.customSections)) return;
  const ensureFrames = opts?.ensureFrames === true;
  for (const sec of state.customSections) {
    if (!sec || (sec.wallName || '').toLowerCase() !== norm) continue;
    try {
      if (ensureFrames && isWindowAlongLayoutSection(sec) && sectionHasPlacedFurniture(sec)) {
        ensureWindowAlongFrameMeshes(sec);
      }
      if (ensureFrames && isStraightLayoutSection(sec)) {
        ensureStraightFrameMeshes(sec);
      }
      syncSectionEmptyFrameVisibility(sec);
    } catch (_) {}
  }
}

/**
 *    tall↔:  ,   tall   (  16  ).
 * under-window:      ( ).
 */
function shouldSuppressWindowJunctionOverlayUntilWardrobe(sectionData, side) {
  if (!sectionData) return false;
  const role = String(
    sectionData.windowAlongWallRole || sectionData.windowBridgeRole || ''
  );
  const wall = String(sectionData.wallName || 'back').toLowerCase();
  const alongX = wall === 'front' || wall === 'back';
  if (role === 'under-window' || sectionData.underWindowBay) return true;
  if (sectionHasNicheWardrobe(sectionData)) return false;
  if (role === 'tall-left') {
    return alongX ? side === 'right' : side === 'back';
  }
  if (role === 'tall-right') {
    return alongX ? side === 'left' : side === 'front';
  }
  return false;
}

export function ensureWindowAlongFrameMeshes(sectionData) {
  if (!isWindowAlongLayoutSection(sectionData)) return;
  //  3:      ;  apply   ensure.
  if (!isWindowRowTrimApplying() && wallHasWindowRowSections(sectionData.wallName)) {
    syncWindowRowTrimForWall(sectionData.wallName || 'back');
    return;
  }
  if (!sectionHasPlacedFurniture(sectionData)) return;
  const g = sectionData.group;
  const size = sectionData.size;
  const wallName = sectionData.wallName || 'back';
  if (!g || !size) return;
  let hasBottom = false;
  let hasTop = false;
  g.traverse((obj) => {
    if (!obj?.isMesh) return;
    if (obj.userData?.isBottomPlank) hasBottom = true;
    if (obj.userData?.isTopPlank && !obj.userData?.isTopPlankSegment) hasTop = true;
  });
  const off = getSectionOffsetsMm(sectionData);
  const offsetsCm = {
    left: (off.leftMm || 0) / 10,
    right: (off.rightMm || 0) / 10,
    front: (off.frontMm || 0) / 10,
    back: (off.backMm || 0) / 10,
    bottom: (off.bottomMm || 0) / 10,
    top: (off.topMm || 0) / 10,
  };
  if (!hasBottom) {
    addDefaultBottomPlank(g, size.x, size.y, size.z, wallName, sectionData);
  }
  const wantCeilingTop = sectionShouldHaveCeilingTopPlank(sectionData);
  if (!hasTop && wantCeilingTop) {
    addDefaultTopPlank(g, size.x, size.y, size.z, wallName, sectionData);
  } else if (hasTop && !wantCeilingTop) {
    removeCeilingTopPlankMeshes(g);
  }
  addSidePlanksIfNeeded(g, size.x, size.y, size.z, wallName, offsetsCm, sectionData);
}

/**
 *  :  //    (/offsets),
 *      syncStraightEmptyFrameVisibility.
 */
export function ensureStraightFrameMeshes(sectionData) {
  if (!isStraightLayoutSection(sectionData)) return;
  const g = sectionData.group;
  const size = sectionData.size;
  const wallName = sectionData.wallName || 'back';
  if (!g || !size) return;
  let hasBottom = false;
  let hasTop = false;
  g.traverse((obj) => {
    if (!obj?.isMesh) return;
    if (obj.userData?.isBottomPlank) hasBottom = true;
    //   6.2 TopPlankSegment    adjustTop    TopPlank.
    if (obj.userData?.isTopPlank) hasTop = true;
  });
  const off = getSectionOffsetsMm(sectionData);
  const offsetsCm = {
    left: (off.leftMm || 0) / 10,
    right: (off.rightMm || 0) / 10,
    front: (off.frontMm || 0) / 10,
    back: (off.backMm || 0) / 10,
    bottom: (off.bottomMm || 0) / 10,
    top: (off.topMm || 0) / 10,
  };
  if (!hasBottom) {
    addDefaultBottomPlank(g, size.x, size.y, size.z, wallName, sectionData);
  }
  const wantCeilingTop = sectionShouldHaveCeilingTopPlank(sectionData);
  if (!hasTop && wantCeilingTop) {
    addDefaultTopPlank(g, size.x, size.y, size.z, wallName, sectionData);
  } else if (hasTop && !wantCeilingTop) {
    removeCeilingTopPlankMeshes(g);
  }
  addSidePlanksIfNeeded(g, size.x, size.y, size.z, wallName, offsetsCm, sectionData);
  applyStraightFrameVisibility(sectionData);
}

/**  split : ensure       . */
export function ensureStraightFrameMeshesOnWall(wallName) {
  if (!Array.isArray(state.customSections)) return;
  const norm = String(wallName || '').trim().toLowerCase();
  for (const sec of state.customSections) {
    if (!sec || (sec.wallName || '').toLowerCase() !== norm) continue;
    try {
      ensureStraightFrameMeshes(sec);
    } catch (_) {}
  }
}

function addSidePlanksIfNeeded(sectionGroup, width, height, depth, wallName, offsets = null, sectionData = null) {
  if (!state.room || !state.room.group || !wallName) return;

  //        // (   ).
  if (sectionData && isWindowAlongLayoutSection(sectionData) && !sectionHasPlacedFurniture(sectionData)) {
    removeWindowAlongEmptyFrameMeshes(sectionGroup);
    return;
  }
  //  3:      applyTrimPlan (ensure  ).
  if (
    sectionData &&
    isWindowAlongLayoutSection(sectionData) &&
    !isWindowRowTrimApplying() &&
    wallHasWindowRowSections(wallName)
  ) {
    return;
  }

  //          open-end   .
  removeSectionSideTrimMeshes(sectionGroup);

  const topPlankH = resolveSectionTopPlankHeightMm(sectionData);
  const usableHeight = height - topPlankH;
  if (usableHeight <= 0) return;
  //   :     ( ),      .
  let fullHeight = height;
  if (sectionData && isWindowAlongLayoutSection(sectionData) && !sectionHasNicheWardrobe(sectionData)) {
    const dresserTrimH = getWindowAlongDresserSideTrimHeightMm(sectionData);
    if (dresserTrimH > 0) {
      fullHeight = Math.min(height, dresserTrimH);
    }
  }
  if (!(fullHeight > 0)) return;

  const plankLeftW = resolveSectionSidePlankWidthMm(sectionData, 'left');
  const plankRightW = resolveSectionSidePlankWidthMm(sectionData, 'right');
  const plankFrontW = resolveSectionSidePlankWidthMm(sectionData, 'front');
  const plankBackW = resolveSectionSidePlankWidthMm(sectionData, 'back');

  // Унифицированный ключ L‑угла (нужен для корректных проверок corner-back-right/left и др.).
  // Важно: legacy back‑углы имеют lShape.type = corner-wardrobe/top-right, но typeKey будет corner-back-right.
  const lTypeKey = getLShapeTypeKey(sectionData);
  const jointPlan = getCornerJointTrimPlan(sectionData, findCornerPairSection);

  const roomWorldPos = new THREE.Vector3();
  state.room.group.getWorldPosition(roomWorldPos);

  const pivotWorld = sectionGroup.position.clone();
  const localX = pivotWorld.x - roomWorldPos.x;
  const localZ = pivotWorld.z - roomWorldPos.z;

  const mat = createPlankMaterial();

  function createSidePlank(sizeX, sizeZ, centerX, centerZ, name) {
    // Vertical end planks must reach the ceiling (full section height),
    // not stop under the top plank.
    const geom = new THREE.BoxGeometry(sizeX, fullHeight, sizeZ);
    const plank = new THREE.Mesh(geom, mat);
    plank.name = name;
    plank.userData.isSidePlank = true;
    plank.userData.isFacade = true;
    plank.userData.isSectionFacadeTrim = true;
    plank.userData.sectionTrimUsesOutsideDecor = true;
    assignTrimPartKeyToMesh(plank, wallName);
    plank.position.set(centerX, fullHeight / 2, centerZ);
    sectionGroup.add(plank);
  }

  if (wallName === 'front' || wallName === 'back') {
    //  :    /     ,    .
    let leftGapMm = 0;
    let rightGapMm = 0;
    let touchLeft = true;
    let touchRight = true;
    let needOverlayLeft = false;
    let needOverlayRight = false;

    //     sectionData ( )
    const logicalOffsets = getSectionOffsetsMm(sectionData);

    if (logicalOffsets.leftMm > 0 || logicalOffsets.rightMm > 0) {
      const wallEps = 5; // 5    
      leftGapMm = logicalOffsets.leftMm;
      rightGapMm = logicalOffsets.rightMm;

      touchLeft = leftGapMm <= wallEps;
      touchRight = rightGapMm <= wallEps;
      needOverlayLeft = !touchLeft && leftGapMm > wallEps;
      needOverlayRight = !touchRight && rightGapMm > wallEps;
    } else if (offsets && typeof offsets.left === 'number' && typeof offsets.right === 'number') {
      //     ()
      const wallEps = 5;
      leftGapMm = offsets.left * 10;
      rightGapMm = offsets.right * 10;

      touchLeft = leftGapMm <= wallEps;
      touchRight = rightGapMm <= wallEps;
      needOverlayLeft = !touchLeft && leftGapMm > wallEps;
      needOverlayRight = !touchRight && rightGapMm > wallEps;
    }

    //   /:   =  (  ),   offsets=0.
    const spanOpen = getSectionSpanOpenEnds(sectionData, state.room);
    if (spanOpen.openMin) {
      touchLeft = false;
      needOverlayLeft = true;
    }
    if (spanOpen.openMax) {
      touchRight = false;
      needOverlayRight = true;
    }

    // Тип угла — только из lShape секции. pending/selected — лишь пока lShape ещё нет
    // (момент create). Иначе после постановки правой selectedRoomLayout=right
    //      update    5  → .
    // fixedHeight (низкая под окном) и legacy bay — не угол.
    const activeLayoutKey =
      state.pendingLayoutKey ||
      (window.selectedRoomLayout && window.selectedRoomLayout.key) ||
      null;
    const hasLShape = !!(sectionData && sectionData.lShape);
    const isLowFixedOrBay =
      Number(sectionData?.fixedHeightMm) > 0 ||
      !!sectionData?.underWindowBay ||
      sectionData?.windowBridgeRole === 'under-window';
    const isLShapeBack =
      (hasLShape &&
        (lTypeKey === 'corner-back-right' || isUShapeBackSection(sectionData)) &&
        sectionData.lShape.role === 'back') ||
      (!hasLShape &&
        wallName === 'back' &&
        (activeLayoutKey === 'corner-wardrobe' ||
          activeLayoutKey === 'top-right' ||
          isUShapeLayoutKey(activeLayoutKey)) &&
        !isLowFixedOrBay);
    const isLShapeBackLeft =
      (hasLShape &&
        (lTypeKey === 'corner-back-left' || isUShapeBackSection(sectionData)) &&
        sectionData.lShape.role === 'back') ||
      (!hasLShape &&
        wallName === 'back' &&
        (activeLayoutKey === 'corner-wardrobe-left' ||
          activeLayoutKey === 'top-left' ||
          isUShapeLayoutKey(activeLayoutKey)) &&
        !isLowFixedOrBay);

    // 6.8.3: /    joint,   typeKey.
    if (jointPlan) {
      for (const side of jointPlan.jointSides) {
        if (side === 'left') {
          if (jointPlan.role === 'primary') {
            leftGapMm =
              logicalOffsets.leftMm > 0 ? logicalOffsets.leftMm : jointPlan.gapMm;
            touchLeft = false;
          }
          needOverlayLeft = false;
        }
        if (side === 'right') {
          if (jointPlan.role === 'primary') {
            rightGapMm =
              logicalOffsets.rightMm > 0 ? logicalOffsets.rightMm : jointPlan.gapMm;
            touchRight = false;
          }
          needOverlayRight = false;
        }
      }
    } else if (isLShapeBack) {
      const FIXED_RIGHT_GAP_MM = 50;
      rightGapMm =
        logicalOffsets.rightMm > 0 ? logicalOffsets.rightMm : FIXED_RIGHT_GAP_MM;
      touchRight = false;
      needOverlayRight = false;
    } else if (isLShapeBackLeft) {
      const FIXED_LEFT_GAP_MM = 50;
      leftGapMm =
        logicalOffsets.leftMm > 0 ? logicalOffsets.leftMm : FIXED_LEFT_GAP_MM;
      touchLeft = false;
      needOverlayLeft = false;
    }

    const size = getSectionSizeFromArgs(sectionData, width, height, depth);
    const frontZ =
      wallName === 'front'
        ? -size.z + TOP_PLANK_THICKNESS_MM / 2
        : size.z - TOP_PLANK_THICKNESS_MM / 2;
    const frontCenterZ = wallName === 'front' ? -size.z / 2 : size.z / 2;

    const innerLeftX = wallName === 'front' ? -size.x : 0;
    const innerRightX = wallName === 'front' ? 0 : size.x;

    //  L‑:    (primary,  joint).
    let suppressLeftSide =
      !!(jointPlan?.suppressJoint && jointPlan.jointSides.includes('left')) ||
      (!jointPlan && isLShapeBackLeft);
    let suppressRightSide =
      !!(jointPlan?.suppressJoint && jointPlan.jointSides.includes('right')) ||
      (!jointPlan && isLShapeBack);
    // Низкая fixedHeight / legacy bay: боковые накладки у высоких соседей (SideCap).
    const isLowNiche =
      Number(sectionData?.fixedHeightMm) > 0 || !!sectionData?.underWindowBay;
    if (isLowNiche) {
      suppressLeftSide = true;
      suppressRightSide = true;
      needOverlayLeft = false;
      needOverlayRight = false;
    }
    // Tall L/R  :            .
    if (shouldSuppressWindowJunctionOverlayUntilWardrobe(sectionData, 'left')) {
      suppressLeftSide = true;
      needOverlayLeft = false;
    }
    if (shouldSuppressWindowJunctionOverlayUntilWardrobe(sectionData, 'right')) {
      suppressRightSide = true;
      needOverlayRight = false;
    }
    //   :      (   ≠   ).
    if (
      sectionData &&
      isWindowAlongLayoutSection(sectionData) &&
      !sectionHasNicheWardrobe(sectionData)
    ) {
      if (!sectionHasFurnitureNearLocalSide(sectionData, 'left')) {
        suppressLeftSide = true;
        needOverlayLeft = false;
      }
      if (!sectionHasFurnitureNearLocalSide(sectionData, 'right')) {
        suppressRightSide = true;
        needOverlayRight = false;
      }
    }
    // Legacy :     →  .
    if (shouldSuppressWindowBridgeBaySeamOverlay(sectionData, 'left')) {
      suppressLeftSide = true;
      needOverlayLeft = false;
    }
    if (shouldSuppressWindowBridgeBaySeamOverlay(sectionData, 'right')) {
      suppressRightSide = true;
      needOverlayRight = false;
    }
    //  overlay-  suppress-,   
    // верхней/нижней планки (cutLeft/cutRight ниже) не применяла 16mm trim к несуществующим накладкам.
    if (suppressLeftSide)  needOverlayLeft  = false;
    if (suppressRightSide) needOverlayRight = false;

    // Торцевой: SideOverlay на этом торце глушим — шов тумба↔торцевой = SideCap.
    if (shouldSuppressSideTrimForEndCabinet(sectionData, 'left')) {
      suppressLeftSide = true;
      needOverlayLeft = false;
    }
    if (shouldSuppressSideTrimForEndCabinet(sectionData, 'right')) {
      suppressRightSide = true;
      needOverlayRight = false;
    }

    //  : suppress =    →   .
    if (!suppressLeftSide) {
      if (needOverlayLeft) {
        const overlayGeom = new THREE.BoxGeometry(TOP_PLANK_THICKNESS_MM, fullHeight, size.z);
        const overlay = new THREE.Mesh(overlayGeom, mat);
        overlay.name = 'SideOverlayLeft';
        overlay.userData.isSideOverlay = true;
        overlay.userData.isFacade = true;
        overlay.userData.isSectionFacadeTrim = true;
        overlay.userData.sectionTrimUsesOutsideDecor = true;
        assignTrimPartKeyToMesh(overlay, wallName);
        overlay.position.set(innerLeftX + TOP_PLANK_THICKNESS_MM / 2, fullHeight / 2, frontCenterZ);
        sectionGroup.add(overlay);
      } else {
        createSidePlank(
          plankLeftW,
          TOP_PLANK_THICKNESS_MM,
          innerLeftX + plankLeftW / 2,
          frontZ,
          'SidePlankLeft'
        );
      }
    }

    //  : suppress =    →   .
    if (!suppressRightSide) {
      if (needOverlayRight) {
        const overlayGeom = new THREE.BoxGeometry(TOP_PLANK_THICKNESS_MM, fullHeight, size.z);
        const overlay = new THREE.Mesh(overlayGeom, mat);
        overlay.name = 'SideOverlayRight';
        overlay.userData.isSideOverlay = true;
        overlay.userData.isFacade = true;
        overlay.userData.isSectionFacadeTrim = true;
        overlay.userData.sectionTrimUsesOutsideDecor = true;
        assignTrimPartKeyToMesh(overlay, wallName);
        overlay.position.set(innerRightX - TOP_PLANK_THICKNESS_MM / 2, fullHeight / 2, frontCenterZ);
        sectionGroup.add(overlay);
      } else {
        createSidePlank(
          plankRightW,
          TOP_PLANK_THICKNESS_MM,
          innerRightX - plankRightW / 2,
          frontZ,
          'SidePlankRight'
        );
      }
    }

    //     ,     ,     .
    //      (L‑) 
    //          .
    //
    // :           ( 50 )
    //    .  ""     :
    // overlap = thicknessRight - rightGapBack, а не просто thicknessRight.
    //     ,     ,     .
    //      (L‑) 
    //   /       .
    // Horizontal planks (№1 / №3): единый контракт computeHorizontalTrimSpanU.
    // L-угол: overlap дополнительно режет max/min край.
    let lOverlapMaxMm = 0;
    let lOverlapMinMm = 0;
    const fbCuts = jointPlanOverlapCuts(wallName, jointPlan);
    lOverlapMinMm = fbCuts.min;
    lOverlapMaxMm = fbCuts.max;

    //   :   /       = 0
    // (        ).
    if ((isLShapeBack || isLShapeBackLeft) && wallName === 'back' && shouldShowCornerPlankDebugMarkers()) {
      const cornerDir = isLShapeBack ? 1 : -1; // +1 = правый угол, -1 = левый
      sectionGroup.traverse((child) => {
        if (!child.userData || !child.geometry || !child.geometry.parameters) return;
        if (child.userData.isTopPlank) {
          const w = child.geometry.parameters.width || width;
          const endCorner = new THREE.Vector3(child.position.x + (w / 2) * cornerDir, child.position.y, child.position.z);
          addDebugMarkerToSection(sectionGroup, endCorner, 0xff00ff, 'TopPlankCornerEnd');
        } else if (child.userData.isBottomPlank) {
          const w = child.geometry.parameters.width || width;
          const endCorner = new THREE.Vector3(child.position.x + (w / 2) * cornerDir, child.position.y, child.position.z);
          addDebugMarkerToSection(sectionGroup, endCorner, 0x00ffff, 'BottomPlankCornerEnd');
        }
      });
    }

    const appliedContract = sectionData
      ? _applySectionHorizontalPlanksFromContract(
          sectionData,
          sectionGroup,
          wallName,
          lOverlapMaxMm,
          lOverlapMinMm
        )
      : false;

    // Fallback (нет sectionData): старое cut/extend по флагам.
    if (!appliedContract) {
      let cutLeft = 0;
      let cutRight = 0;
      if (!suppressLeftSide) {
        cutLeft = needOverlayLeft ? 0 : plankLeftW;
      }
      if (!suppressRightSide) {
        cutRight = needOverlayRight ? 0 : plankRightW;
      }
      const extendLeft = sectionData ? getEndCabinetReserveMm(sectionData, 'left') : 0;
      const extendRight = sectionData ? getEndCabinetReserveMm(sectionData, 'right') : 0;
      const plinthInsetLeft = sectionData ? getEndCabinetRowPlinthInsetMm(sectionData, 'left') : 0;
      const plinthInsetRight = sectionData ? getEndCabinetRowPlinthInsetMm(sectionData, 'right') : 0;
      cutRight += lOverlapMaxMm;
      cutLeft += lOverlapMinMm;
      if (cutLeft > 0 || cutRight > 0 || extendLeft > 0 || extendRight > 0) {
        const effWidth = width - cutLeft - cutRight + extendLeft + extendRight;
        if (effWidth > 0) {
          const centerX =
            wallName === 'front'
              ? -size.x - extendLeft + cutLeft + effWidth / 2
              : -extendLeft + cutLeft + effWidth / 2;
          const plinthExtendLeft = Math.max(0, extendLeft - plinthInsetLeft);
          const plinthExtendRight = Math.max(0, extendRight - plinthInsetRight);
          const plinthWidth = Math.max(
            1,
            width - cutLeft - cutRight + plinthExtendLeft + plinthExtendRight
          );
          const plinthCenterX =
            wallName === 'front'
              ? -size.x - plinthExtendLeft + cutLeft + plinthWidth / 2
              : -plinthExtendLeft + cutLeft + plinthWidth / 2;
          sectionGroup.traverse((child) => {
            if (!child.userData) return;
            if (child.userData.isTopPlank) {
              if (child.geometry) child.geometry.dispose();
              child.geometry = new THREE.BoxGeometry(
                effWidth,
                topPlankH,
                TOP_PLANK_THICKNESS_MM
              );
              child.position.x = centerX;
              child.userData.plankHeight = topPlankH;
            } else if (child.userData.isBottomPlank) {
              if (child.geometry) child.geometry.dispose();
              child.geometry = new THREE.BoxGeometry(
                plinthWidth,
                BOTTOM_PLANK_HEIGHT_MM,
                BOTTOM_PLANK_THICKNESS_MM
              );
              child.position.x = plinthCenterX;
            }
          });
        }
      }
    } else if ((isLShapeBack || isLShapeBackLeft) && wallName === 'back' && shouldShowCornerPlankDebugMarkers()) {
      const cornerDir = isLShapeBack ? 1 : -1;
      sectionGroup.traverse((child) => {
        if (!child.userData || !child.geometry || !child.geometry.parameters) return;
        if (child.userData.isTopPlank) {
          const w = child.geometry.parameters.width || width;
          const endCorner = new THREE.Vector3(
            child.position.x + (w / 2) * cornerDir,
            child.position.y,
            child.position.z
          );
          addDebugMarkerToSection(sectionGroup, endCorner, 0xff00ff, 'TopPlankCornerEnd');
        } else if (child.userData.isBottomPlank) {
          const w = child.geometry.parameters.width || width;
          const endCorner = new THREE.Vector3(
            child.position.x + (w / 2) * cornerDir,
            child.position.y,
            child.position.z
          );
          addDebugMarkerToSection(sectionGroup, endCorner, 0x00ffff, 'BottomPlankCornerEnd');
        }
      });
    }
  } else if (wallName === 'left' || wallName === 'right') {
    // Для боковых стен используем offsets.front/back (логические мм) только
    //     ,     .
    let frontGapMm = 0;
    let backGapMm = 0;
    let touchFront = true;
    let touchBack = true;
    let needOverlayFront = false;
    let needOverlayBack = false;

    const logicalOffsets = getSectionOffsetsMm(sectionData);

    if (logicalOffsets.frontMm > 0 || logicalOffsets.backMm > 0) {
      const wallEps = 5;
      frontGapMm = logicalOffsets.frontMm;
      backGapMm = logicalOffsets.backMm;
      touchFront = frontGapMm <= wallEps;
      touchBack = backGapMm <= wallEps;
      needOverlayFront = !touchFront && frontGapMm > wallEps;
      needOverlayBack = !touchBack && backGapMm > wallEps;
    } else if (offsets && typeof offsets.front === 'number' && typeof offsets.back === 'number') {
      //     ()
      const wallEps = 5;
      frontGapMm = offsets.front * 10;
      backGapMm = offsets.back * 10;
      touchFront = frontGapMm <= wallEps;
      touchBack = backGapMm <= wallEps;
      needOverlayFront = !touchFront && frontGapMm > wallEps;
      needOverlayBack = !touchBack && backGapMm > wallEps;
    } else {
      // fallback  :      
      const eps = 5; //    
      if (wallName === 'left') {
        // Левая стена: пивот у задней стены. Секция по Z от (localZ - depth) до localZ. Зад комнаты = room.depth.
        const sectionFrontZ = localZ - depth; // торец к передней стене комнаты
        const sectionBackZ = localZ;           // торец к задней стене (примыкает)
        const gapFront = sectionFrontZ;       // от переднего торца секции до передней стены (0)
        const gapBack = state.room.depth - sectionBackZ; // от заднего торца до задней стены
        touchFront = gapFront <= eps;
        touchBack = gapBack <= eps;
        needOverlayFront = !touchFront && gapFront > eps;
        needOverlayBack = !touchBack && gapBack > eps;
      } else if (wallName === 'right') {
        const z0 = localZ;
        const z1 = state.room.depth - (localZ + depth);
        touchFront = z0 <= eps;
        touchBack = z1 <= eps;
        needOverlayFront = !touchFront;
        needOverlayBack = !touchBack;
      } else {
        const z0 = localZ;
        const z1 = state.room.depth - (localZ + depth);
        touchFront = z0 <= eps;
        touchBack = z1 <= eps;
        needOverlayFront = !touchFront;
        needOverlayBack = !touchBack;
      }
    }

    //   /   .
    const spanOpenSide = getSectionSpanOpenEnds(sectionData, state.room);
    if (spanOpenSide.openMin) {
      touchFront = false;
      needOverlayFront = true;
    }
    if (spanOpenSide.openMax) {
      touchBack = false;
      needOverlayBack = true;
    }

    // 6.8.3:    joint ( role===left/right + typeKey).
    if (jointPlan) {
      for (const side of jointPlan.jointSides) {
        if (side === 'front') {
          if (jointPlan.role === 'primary') {
            frontGapMm =
              logicalOffsets.frontMm > 0 ? logicalOffsets.frontMm : jointPlan.gapMm;
            touchFront = false;
          }
          needOverlayFront = false;
        }
        if (side === 'back') {
          if (jointPlan.role === 'primary') {
            backGapMm =
              logicalOffsets.backMm > 0 ? logicalOffsets.backMm : jointPlan.gapMm;
            touchBack = false;
          }
          needOverlayBack = false;
        }
      }
    }

    const size = getSectionSizeFromArgs(sectionData, width, height, depth);

    //   (  ),        :
    // - левая стена: фасад при X=width, планка при X=width - 8;
    // - правая стена: фасад при X=-width, планка при X=-width + 8.
    const plankCenterX =
      wallName === 'left'
        ? width - TOP_PLANK_THICKNESS_MM / 2
        : -width + TOP_PLANK_THICKNESS_MM / 2;
    const overlayCenterX = wallName === 'left' ? width / 2 : -width / 2;

    // Правая секция: локальный Z 0..size.z (перед=0, зад=size.z). Левая: Z от -size.z до 0 (перед=-size.z, зад=0).
    const frontZCenter = wallName === 'left' ? -size.z + TOP_PLANK_THICKNESS_MM / 2 : TOP_PLANK_THICKNESS_MM / 2;
    const backZCenter = wallName === 'left' ? -TOP_PLANK_THICKNESS_MM / 2 : size.z - TOP_PLANK_THICKNESS_MM / 2;
    const frontPlankCenter = wallName === 'left' ? -size.z + plankFrontW / 2 : plankFrontW / 2;
    const backPlankCenter = wallName === 'left' ? -plankBackW / 2 : size.z - plankBackW / 2;

    //  L‑:         
    // (как legacy: у задней секции back+right скрыт правый торец через if(!isLShapeBack)).
    // Тип 'corner-right-front': первая группа = стена основной секции, вторая = приставная.
    // right+front → угол у Z=room.depth → задний торец; right+back → угол у Z=0 → передний торец.
    let suppressFront = !!(jointPlan?.suppressJoint && jointPlan.jointSides.includes('front'));
    let suppressBack = !!(jointPlan?.suppressJoint && jointPlan.jointSides.includes('back'));
    if (
      Number(sectionData?.fixedHeightMm) > 0 ||
      sectionData?.underWindowBay
    ) {
      suppressFront = true;
      suppressBack = true;
    }
    if (shouldSuppressWindowJunctionOverlayUntilWardrobe(sectionData, 'front')) {
      suppressFront = true;
      needOverlayFront = false;
    }
    if (shouldSuppressWindowJunctionOverlayUntilWardrobe(sectionData, 'back')) {
      suppressBack = true;
      needOverlayBack = false;
    }
    if (shouldSuppressWindowBridgeBaySeamOverlay(sectionData, 'front')) {
      suppressFront = true;
      needOverlayFront = false;
    }
    if (shouldSuppressWindowBridgeBaySeamOverlay(sectionData, 'back')) {
      suppressBack = true;
      needOverlayBack = false;
    }
    // Торцевой на боковой стене: глушим SideOverlay/планку — шов через SideCap.
    if (shouldSuppressSideTrimForEndCabinet(sectionData, 'front')) {
      suppressFront = true;
      needOverlayFront = false;
    }
    if (shouldSuppressSideTrimForEndCabinet(sectionData, 'back')) {
      suppressBack = true;
      needOverlayBack = false;
    }

    //  :  / .
    // 7   11   left/right       (W).
    //  createSidePlank(1650  )     .
    if (!suppressFront) {
      if (needOverlayFront) {
        const overlayGeom = new THREE.BoxGeometry(width, fullHeight, TOP_PLANK_THICKNESS_MM);
        const overlay = new THREE.Mesh(overlayGeom, mat);
        overlay.name = 'SideOverlayFront';
        overlay.userData.isSideOverlay = true;
        overlay.userData.isFacade = true;
        overlay.userData.isSectionFacadeTrim = true;
        overlay.userData.sectionTrimUsesOutsideDecor = true;
        assignTrimPartKeyToMesh(overlay, wallName);
        overlay.position.set(overlayCenterX, fullHeight / 2, frontZCenter);
        sectionGroup.add(overlay);
      } else {
        const plankGeom = new THREE.BoxGeometry(width, fullHeight, plankFrontW);
        const plank = new THREE.Mesh(plankGeom, mat);
        plank.name = 'SidePlankFront';
        plank.userData.isSidePlank = true;
        plank.userData.isFacade = true;
        plank.userData.isSectionFacadeTrim = true;
        plank.userData.sectionTrimUsesOutsideDecor = true;
        assignTrimPartKeyToMesh(plank, wallName);
        plank.position.set(
          overlayCenterX,
          fullHeight / 2,
          wallName === 'left' ? -size.z + plankFrontW / 2 : plankFrontW / 2
        );
        sectionGroup.add(plank);
      }
    }

    //  :  (  W).
    if (!suppressBack) {
      if (needOverlayBack) {
        const overlayGeom = new THREE.BoxGeometry(width, fullHeight, TOP_PLANK_THICKNESS_MM);
        const overlay = new THREE.Mesh(overlayGeom, mat);
        overlay.name = 'SideOverlayBack';
        overlay.userData.isSideOverlay = true;
        overlay.userData.isFacade = true;
        overlay.userData.isSectionFacadeTrim = true;
        overlay.userData.sectionTrimUsesOutsideDecor = true;
        assignTrimPartKeyToMesh(overlay, wallName);
        overlay.position.set(overlayCenterX, fullHeight / 2, backZCenter);
        sectionGroup.add(overlay);
      } else {
        const plankGeom = new THREE.BoxGeometry(width, fullHeight, plankBackW);
        const plank = new THREE.Mesh(plankGeom, mat);
        plank.name = 'SidePlankBack';
        plank.userData.isSidePlank = true;
        plank.userData.isFacade = true;
        plank.userData.isSectionFacadeTrim = true;
        plank.userData.sectionTrimUsesOutsideDecor = true;
        assignTrimPartKeyToMesh(plank, wallName);
        plank.position.set(
          overlayCenterX,
          fullHeight / 2,
          wallName === 'left' ? -plankBackW / 2 : size.z - plankBackW / 2
        );
        sectionGroup.add(plank);
      }
    }

    //  /    .
    //  cut ( filler /  0) + L-overlap →    .
    let cutFront = 0;
    let cutBack = 0;
    if (!suppressFront) {
      cutFront = needOverlayFront ? 0 : plankFrontW;
    }
    if (!suppressBack) {
      cutBack = needOverlayBack ? 0 : plankBackW;
    }
    const baseCutFront = cutFront;
    const baseCutBack = cutBack;
    const extendFront = sectionData ? getEndCabinetReserveMm(sectionData, 'front') : 0;
    const extendBack = sectionData ? getEndCabinetReserveMm(sectionData, 'back') : 0;

    const sideCuts = jointPlanOverlapCuts(wallName, jointPlan);
    cutFront += sideCuts.min;
    cutBack += sideCuts.max;

    const lOverlapFront = Math.max(0, cutFront - baseCutFront);
    const lOverlapBack = Math.max(0, cutBack - baseCutBack);
    const appliedSideContract = sectionData
      ? _applySectionHorizontalPlanksFromContract(
          sectionData,
          sectionGroup,
          wallName,
          lOverlapBack,
          lOverlapFront
        )
      : false;

    if (!appliedSideContract && (cutFront > 0 || cutBack > 0 || extendFront > 0 || extendBack > 0)) {
      const effDepth = depth - cutFront - cutBack + extendFront + extendBack;
      const minZ = wallName === 'left' ? -depth : 0;
      const centerZ = minZ - extendFront + cutFront + effDepth / 2;
      if (effDepth > 0) {
        sectionGroup.traverse((child) => {
          if (!child || !child.userData) return;
          if (child.userData.isTopPlank) {
            if (child.geometry) child.geometry.dispose();
            child.geometry = new THREE.BoxGeometry(
              TOP_PLANK_THICKNESS_MM,
              topPlankH,
              effDepth
            );
            child.position.z = centerZ;
            child.userData.plankHeight = topPlankH;
          } else if (child.userData.isBottomPlank) {
            if (child.geometry) child.geometry.dispose();
            child.geometry = new THREE.BoxGeometry(
              TOP_PLANK_THICKNESS_MM,
              BOTTOM_PLANK_HEIGHT_MM,
              effDepth
            );
            child.position.z = centerZ;
          }
        });
      }
    }

    if (
      wallName === 'left' &&
      shouldShowCornerPlankDebugMarkers() &&
      jointPlan?.role === 'primary'
    ) {
      const cornerEndZ = jointPlan.cornerAtStart ? -1 : 1;
      sectionGroup.traverse((child) => {
        if (!child.userData || !child.geometry || !child.geometry.parameters) return;
        if (child.userData.isTopPlank) {
          const d = child.geometry.parameters.depth || depth;
          const endAtCorner = new THREE.Vector3(
            child.position.x,
            child.position.y,
            child.position.z + (d / 2) * cornerEndZ
          );
          addDebugMarkerToSection(sectionGroup, endAtCorner, 0xff00ff, 'TopPlankRightEnd');
        } else if (child.userData.isBottomPlank) {
          const d = child.geometry.parameters.depth || depth;
          const endAtCorner = new THREE.Vector3(
            child.position.x,
            child.position.y,
            child.position.z + (d / 2) * cornerEndZ
          );
          addDebugMarkerToSection(sectionGroup, endAtCorner, 0x00ffff, 'BottomPlankRightEnd');
        }
      });
    }
  }

  //  :    remove mesh;    visible=false ( ).
  if (sectionData) {
    try {
      syncSectionEmptyFrameVisibility(sectionData);
    } catch (_) {}
  }
}

import { removeSectionGhost, showTempLCornerGhostForSection } from './section-ghost.js?v=20260925-corner44y';
import { createDimensionLabel, rebuildSectionZoneEditIconsForSection } from '../ui/scene-icons.js';
import { addCabinetMarkers, updateCabinetMarkersForSection } from '../ui/cabinet-markers.js?v=20260925-corner44y';
import {
  rebuildAllTransitions,
  rebuildWallTransitions,
  rebuildTransitionsForWall,
  scheduleRebuildTransitions,
  isRebuildingTransitions,
  getSectionZoneTransitionGaps,
  cumulativeTransitionGapMm,
  applyWindowAsLowSlotLikeStraightSection,
  isHorizontalTallLowFurniturePair,
} from './section-transition-manager.js?v=20260925-corner44y';
import { classifyCapBetweenZones } from './trim-junction-classify.js?v=20260923-cohabit38';

// =====  ""   (    ) =====
//         :
// -  :    (  )
// -  :    (        )
function createSectionZones(sectionData) {
  if (!sectionData || !sectionData.group || !sectionData.division) return;

  // Ensure cap/module segments are fresh before zone rendering.
  // This guarantees that SectionZoneCap reflects the current 16mm gap.
  try {
    computeSectionLayout(sectionData);
  } catch (_) {}

  const division = sectionData.division;
  const sectionGroup = sectionData.group;
  const size = sectionData.size;
  const wallName = division.wallName || sectionData.wallName || 'back';
  const sectionPos = sectionGroup.position.clone();
  const axes = getWallAxes(wallName);
  const isAlongX = axes.u.axis === 'x';
  //  ""   ()  X/Z    .
  // Основано на аксиоме parentLocalBounds в createSectionAtPosition: дети ставим от min-угла.
  const localMinX =
    axes.w.axis === 'x'
      ? axes.w.sign > 0
        ? 0
        : -size.x
      : axes.u.axis === 'x'
      ? axes.u.sign > 0
        ? 0
        : -size.x
      : 0;
  const localMinZ =
    axes.w.axis === 'z'
      ? axes.w.sign > 0
        ? 0
        : -size.z
      : axes.u.axis === 'z'
      ? axes.u.sign > 0
        ? 0
        : -size.z
      : 0;
  //     U ( U   Z,     ).
  const localUMin =
    axes.u.axis === 'z' ? (axes.u.sign > 0 ? 0 : -size.z) : null;
  const localUMax =
    axes.u.axis === 'z' ? (axes.u.sign > 0 ? size.z : 0) : null;

  const isDivisionLShapeBack = !!division && division.isLShapeBack && wallName === 'back';
  //   primary L‑ ( ):
  //  -   (freeSizeMm)      /;
  //  - угловая одинарная имеет ширину = глубине приставной секции (cornerSingleWidthMm).
  let isLShapeBack = isDivisionLShapeBack;
  let cornerSingleWidthMm =
    division && typeof division.cornerWidthMm === 'number' ? division.cornerWidthMm : null;
  let freeSizeMm =
    division && typeof division.freeSizeMm === 'number' ? division.freeSizeMm : null;

  // 6.8 / wall-universal: primary L    (  back).
  const lMeta = getLShapeMeta(sectionData);
  const isLCornerPrimary = !!lMeta;
  if (isLCornerPrimary) {
    isLShapeBack = true;
    if (cornerSingleWidthMm == null || freeSizeMm == null) {
      let thicknessMm =
        lMeta.primary === 'left' || lMeta.primary === 'right' ? size.x : size.z;
      try {
        const pairId = sectionData.lShape.pairId || null;
        if (pairId && Array.isArray(state.customSections)) {
          const attached = state.customSections.find(
            (s) =>
              s.id === pairId &&
              s.lShape &&
              getLShapeTypeKey(s) === lMeta.typeKey &&
              s.lShape.role === lMeta.attached
          );
          if (attached?.size) {
            const attFB =
              lMeta.attached === 'front' || lMeta.attached === 'back';
            const t = attFB
              ? Number(attached.size.z)
              : Number(attached.size.x);
            if (Number.isFinite(t) && t > 0) thicknessMm = t;
          }
        }
      } catch (e) {
        console.warn(
          '⚠️ createSectionZones:    L‑:',
          e
        );
      }
      if (cornerSingleWidthMm == null) {
        cornerSingleWidthMm = Math.max(0, thicknessMm);
      }
      if (freeSizeMm == null && cornerSingleWidthMm != null) {
        const spanU =
          axes.u.axis === 'z'
            ? Number(size.z) || 0
            : Number(size.x) || 0;
        const rawFree = spanU - cornerSingleWidthMm;
        freeSizeMm = rawFree > 0 ? rawFree : null;
      }
    }
  } else if (
    // legacy fallback  back,  meta 
    wallName === 'back' &&
    sectionData?.lShape?.role === 'back' &&
    (getLShapeTypeKey(sectionData) === 'corner-back-right' ||
      getLShapeTypeKey(sectionData) === 'corner-back-left')
  ) {
    isLShapeBack = true;
    if (cornerSingleWidthMm == null || freeSizeMm == null) {
      let thicknessMm = size.z;
      try {
        const pairId = sectionData.lShape.pairId || null;
        const lTypeKey = getLShapeTypeKey(sectionData);
        const attachedRole = lTypeKey === 'corner-back-left' ? 'left' : 'right';
        if (pairId && Array.isArray(state.customSections)) {
          const attached = state.customSections.find(
            (s) =>
              s.id === pairId &&
              s.lShape &&
              getLShapeTypeKey(s) === lTypeKey &&
              s.lShape.role === attachedRole
          );
          if (attached && attached.size && Number.isFinite(attached.size.x)) {
            thicknessMm = attached.size.x;
          }
        }
      } catch (e) {
        console.warn(
          '⚠️ createSectionZones:        L‑:',
          e
        );
      }
      cornerSingleWidthMm = Math.max(0, thicknessMm);
    }
  }

  // free/corner на division (§6.8); S обязателен — иначе спец рисуется как partSize и snap мимо.
  if (
    isLShapeBack &&
    division &&
    freeSizeMm != null &&
    cornerSingleWidthMm != null
  ) {
    division.freeSizeMm = freeSizeMm;
    division.cornerWidthMm = cornerSingleWidthMm;
    if (lMeta?.typeKey) division.typeKey = lMeta.typeKey;
    if (lMeta?.primary === 'back' || wallName === 'back') {
      division.isLShapeBack = true;
    }
    if (lMeta?.primary === 'right') division.isLShapeRightFront = true;
    if (lMeta?.primary === 'left') division.isLShapeLeftFront = true;
    if (lMeta?.primary === 'front') division.isLShapeFrontPrimary = true;
    resolveLShapeSingleWidthMm(division);
    ensureLShapeDivisionSegments(division);
  }

  if (!state.sectionZones) {
    state.sectionZones = {};
  }

  //   ,  
  const existingZones = state.sectionZones[sectionData.id];
  if (existingZones && Array.isArray(existingZones)) {
    existingZones.forEach((zoneGroup) => {
      if (!zoneGroup) return;
      zoneGroup.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      if (zoneGroup.parent) {
        zoneGroup.parent.remove(zoneGroup);
      } else if (state.scene) {
        state.scene.remove(zoneGroup);
      }
    });
  }

  //            ( ).
  //    (  ) .
  if (window.sectionSingleZoneLabels && Array.isArray(window.sectionSingleZoneLabels)) {
    window.sectionSingleZoneLabels = window.sectionSingleZoneLabels.filter((label) => {
      if (!label) return false;
      const sameSection =
        label.userData &&
        label.userData.sectionId &&
        sectionData &&
        sectionData.id &&
        label.userData.sectionId === sectionData.id;

      if (sameSection) {
        if (label.parentNode) {
          label.parentNode.removeChild(label);
        }
        return false; //   
      }

      return true; //    
    });
  }

  state.sectionZones[sectionData.id] = [];

  const { partSize, sectionStart, parts } = division;
  if (!partSize || !parts || parts <= 0) return;

  const transitionGaps = getSectionZoneTransitionGaps(sectionData.id, wallName, parts);
  const moduleWidthsFromCache = sectionData._layoutCache?.moduleWidthsMm;
  const moduleWidths =
    Array.isArray(moduleWidthsFromCache) && moduleWidthsFromCache.length === parts
      ? moduleWidthsFromCache
      : null;
  const sumModuleWidthsBefore = (idx) => {
    if (!moduleWidths || idx <= 0) return 0;
    let s = 0;
    for (let k = 0; k < idx; k++) s += moduleWidths[k];
    return s;
  };

  if (typeof window !== 'undefined' && window.DEBUG_LAYOUT_ZONES === true) {
    console.log('[ZONES][section]', {
      sectionId: sectionData.id,
      wallName,
      parts,
      partSize,
      sectionStart,
      sectionSize: { ...size },
      hasLShapeSegments: !!(division.segmentsLShape || division.segmentsLShapeBack),
    });
  }

  const singleWidthForLShape = resolveLShapeSingleWidthMm(division);

  const segmentsAny = Array.isArray(division.segmentsLShapeBack)
    ? division.segmentsLShapeBack
    : Array.isArray(division.segmentsLShape)
    ? division.segmentsLShape
    : null;

  const useSegments =
    !!segmentsAny &&
    segmentsAny.length > 0 &&
    (isLShapeBack ||
      division.isLShapeRightFront === true ||
      division.isLShapeLeftFront === true ||
      division.isLShapeFrontPrimary === true);

  //     Z     ;  .

  const getSegStartWorld = (seg) =>
    typeof seg.startWorldU === 'number' ? seg.startWorldU : seg.startWorldX;

  const doubleSegments = useSegments
    ? segmentsAny.filter((s) => s.type === 'double' || s.type === 'special')
    : null;
  const hasExtraSingleSegment = useSegments && segmentsAny.some((s) => s.type === 'single');

  if (useSegments && hasExtraSingleSegment) {
    const singleSeg = segmentsAny.find((s) => s.type === 'single');
    if (singleSeg) {
      const sWidth = singleSeg.widthMm;
      const singleGroup = new THREE.Group();
      singleGroup.name = `SectionZoneSingle_${sectionData.id}_extra`;
      const singleLineMat = new THREE.LineBasicMaterial({ color: 0xffb74d, transparent: true, opacity: 0.45, depthTest: false });
      const singleFillMat = new THREE.MeshBasicMaterial({ color: 0xffb74d, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthTest: false });
      const pivotMarkerSingle = new THREE.Mesh(new THREE.SphereGeometry(25, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffb74d, transparent: true, opacity: 0.9 }));

      if (isAlongX) {
        const sDepth = size.z;
        const sLocalX = getSegStartWorld(singleSeg) - sectionPos.x;
        const singleGeom = new THREE.BoxGeometry(sWidth, size.y, sDepth);
        const singleEdges = new THREE.EdgesGeometry(singleGeom);
        const singleWire = new THREE.LineSegments(singleEdges, singleLineMat);
        singleWire.position.set(sWidth / 2, size.y / 2, sDepth / 2);
        const singleFill = new THREE.Mesh(singleGeom, singleFillMat);
        singleFill.position.copy(singleWire.position);
        singleGroup.add(singleWire);
        singleGroup.add(singleFill);
        singleGroup.add(pivotMarkerSingle);
        singleGroup.position.set(sLocalX, 0, localMinZ);
      } else {
        // U = Z (боковые стены): "extra single" — короткая зона вдоль Z.
        const sDepth = sWidth;
        let sLocalZ = getSegStartWorld(singleSeg) - sectionPos.z;
        if (localUMin != null && localUMax != null) {
          if (sLocalZ < localUMin) sLocalZ = localUMin;
          if (sLocalZ > localUMax) sLocalZ = localUMax;
        }
        const singleGeom = new THREE.BoxGeometry(size.x, size.y, sDepth);
        const singleEdges = new THREE.EdgesGeometry(singleGeom);
        const singleWire = new THREE.LineSegments(singleEdges, singleLineMat);
        singleWire.position.set(size.x / 2, size.y / 2, sDepth / 2);
        const singleFill = new THREE.Mesh(singleGeom, singleFillMat);
        singleFill.position.copy(singleWire.position);
        singleGroup.add(singleWire);
        singleGroup.add(singleFill);
        singleGroup.add(pivotMarkerSingle);
        singleGroup.position.set(localMinX, 0, sLocalZ);
      }

      sectionGroup.add(singleGroup);
      state.sectionZones[sectionData.id].push(singleGroup);
    }
  }

  const doubleMinMmZones = getSectionDoubleMinMmFromConfig();
  // doorKind для каждой зоны берём из layoutCache (авторитетный источник).
  const layoutSegments = sectionData._layoutCache?.segments || [];
  const getDoorKindForZone = (zoneIdx) => {
    const seg = layoutSegments.find((s) => s.type === 'module' && s.zoneIndex === zoneIdx);
    return seg ? seg.doorKind : null;
  };

  for (let i = 0; i < parts; i++) {
    let worldStart;
    let baseWidth;
    if (useSegments && doubleSegments && doubleSegments[i]) {
      worldStart = getSegStartWorld(doubleSegments[i]);
      baseWidth = doubleSegments[i].widthMm;
    } else {
      const extraSingleLeft =
        isLShapeBack && division.extraSingleLeft && singleWidthForLShape != null;
      const baseOffsetForL = extraSingleLeft ? singleWidthForLShape : 0;
      worldStart =
        sectionStart +
        baseOffsetForL +
        (moduleWidths ? sumModuleWidthsBefore(i) : i * partSize) +
        cumulativeTransitionGapMm(transitionGaps, i);
      if (
        wallName === 'back' &&
        isLShapeBack &&
        singleWidthForLShape != null &&
        freeSizeMm != null &&
        cornerSingleWidthMm != null &&
        i === parts - 1
      ) {
        worldStart = sectionStart + freeSizeMm - singleWidthForLShape;
        baseWidth = singleWidthForLShape + cornerSingleWidthMm;
      } else {
        baseWidth = moduleWidths ? moduleWidths[i] : partSize;
      }
    }

    const zoneDoorKind = getDoorKindForZone(i);
    //             .
    // Слот ≥80 см — как двустворчатый по геометрии (совпадает с пунктиром в cabinet-markers), даже если
    // doorKind    single     .
    const isClearlyDoubleSlot = baseWidth >= _TWO_DOOR_MIN_MM;
    const isSingleDoorZone =
      !isClearlyDoubleSlot &&
      (zoneDoorKind === 'single' ||
        (!useSegments &&
          baseWidth > 0 &&
          (baseWidth < doubleMinMmZones || baseWidth < _SINGLE_DOOR_VISUAL_MAX_MM)));
    if (
      isSingleDoorZone &&
      !(useSegments && doubleSegments && doubleSegments[i])
    ) {
      const singleGroup = new THREE.Group();
      singleGroup.name = `SectionZoneSingle_${sectionData.id}_single_${i}`;
      if (isAlongX) {
        const sW = baseWidth;
        const sDepth = size.z;
        const sLocalX = worldStart - sectionPos.x;
        const singleGeom = new THREE.BoxGeometry(sW, size.y, sDepth);
        const singleEdges = new THREE.EdgesGeometry(singleGeom);
        const singleLineMat = new THREE.LineBasicMaterial({
          color: 0xffb74f,
          transparent: true,
          opacity: 0.45,
          depthTest: false,
        });
        const singleWire = new THREE.LineSegments(singleEdges, singleLineMat);
        singleWire.position.set(sW / 2, size.y / 2, sDepth / 2);
        const singleFillMat = new THREE.MeshBasicMaterial({
          color: 0xffb74f,
          transparent: true,
          opacity: 0.18,
          side: THREE.DoubleSide,
          depthTest: false,
        });
        const singleFill = new THREE.Mesh(singleGeom, singleFillMat);
        singleFill.position.copy(singleWire.position);
        const pivotMarkerSingle = new THREE.Mesh(
          new THREE.SphereGeometry(25, 8, 6),
          new THREE.MeshBasicMaterial({ color: 0xffb74f, transparent: true, opacity: 0.9 })
        );
        singleGroup.add(singleWire);
        singleGroup.add(singleFill);
        singleGroup.add(pivotMarkerSingle);
        singleGroup.position.set(sLocalX, 0, localMinZ);
      } else {
        const sW = size.x;
        let sDepth = baseWidth;
        let sLocalZ = worldStart - sectionPos.z;
        if (localUMin != null && localUMax != null) {
          if (sLocalZ < localUMin) sLocalZ = localUMin;
          if (sLocalZ > localUMax) sLocalZ = localUMax;
          if (sLocalZ + sDepth > localUMax) {
            sDepth = Math.max(0, localUMax - sLocalZ);
          }
        }
        const singleGeom = new THREE.BoxGeometry(sW, size.y, sDepth);
        const singleEdges = new THREE.EdgesGeometry(singleGeom);
        const singleLineMat = new THREE.LineBasicMaterial({
          color: 0xffb74f,
          transparent: true,
          opacity: 0.45,
          depthTest: false,
        });
        const singleWire = new THREE.LineSegments(singleEdges, singleLineMat);
        singleWire.position.set(sW / 2, size.y / 2, sDepth / 2);
        const singleFillMat = new THREE.MeshBasicMaterial({
          color: 0xffb74f,
          transparent: true,
          opacity: 0.18,
          side: THREE.DoubleSide,
          depthTest: false,
        });
        const singleFill = new THREE.Mesh(singleGeom, singleFillMat);
        singleFill.position.copy(singleWire.position);
        const pivotMarkerSingle = new THREE.Mesh(
          new THREE.SphereGeometry(25, 8, 6),
          new THREE.MeshBasicMaterial({ color: 0xffb74f, transparent: true, opacity: 0.9 })
        );
        singleGroup.add(singleWire);
        singleGroup.add(singleFill);
        singleGroup.add(pivotMarkerSingle);
        singleGroup.position.set(localMinX, 0, sLocalZ);
      }
      sectionGroup.add(singleGroup);
      state.sectionZones[sectionData.id].push(singleGroup);
      // Ширины зон в мм — только DEBUG_LAYOUT_ZONES (основные размеры секции — addSectionDimensionLabels).
      if (typeof window !== 'undefined' && window.DEBUG_LAYOUT_ZONES === true) {
        try {
          const labelText = `${Math.round(baseWidth)} мм`;
          const zoneWorldPos = new THREE.Vector3();
          singleGroup.updateMatrixWorld(true);
          if (isAlongX) {
            singleGroup.localToWorld(zoneWorldPos.set(baseWidth / 2, size.y + 50, size.z / 2));
          } else {
            singleGroup.localToWorld(zoneWorldPos.set(size.x / 2, size.y + 50, baseWidth / 2));
          }
          const label = createDimensionLabel(labelText, zoneWorldPos, 'section-single-width-label');
          if (label) {
            if (!label.userData) label.userData = {};
            label.userData.sectionId = sectionData.id;
            if (!window.sectionSingleZoneLabels) window.sectionSingleZoneLabels = [];
            window.sectionSingleZoneLabels.push(label);
          }
        } catch (e) {}
      }
      continue;
    }

    const doubleZoneGroup = new THREE.Group();
    doubleZoneGroup.name = `SectionZoneDouble_${sectionData.id}_${i}`;

    let baseDepth;
    let baseLocalX = 0;
    let baseLocalZ = 0;

    if (isAlongX) {
      baseDepth = size.z;
      baseLocalX = worldStart - sectionPos.x;
      baseLocalZ = localMinZ;
    } else {
      // U = Z:  .     Z    .
      const moduleUSize = useSegments ? baseWidth : partSize;
      baseWidth = size.x;
      baseDepth = moduleUSize;

      let localOffsetZ = worldStart - sectionPos.z;
      if (localUMin != null && localUMax != null) {
        if (localOffsetZ < localUMin) localOffsetZ = localUMin;
        if (localOffsetZ > localUMax) localOffsetZ = localUMax;
        if (localOffsetZ + baseDepth > localUMax) {
          baseDepth = Math.max(0, localUMax - localOffsetZ);
        }
      }

      baseLocalX = localMinX;
      baseLocalZ = localOffsetZ;
    }

    const doubleGeom = new THREE.BoxGeometry(baseWidth, size.y, baseDepth);
    const doubleEdges = new THREE.EdgesGeometry(doubleGeom);
    const doubleLineMat = new THREE.LineBasicMaterial({
      color: 0xffd54f, //  
      linewidth: 1,
      transparent: true,
      opacity: 0.35,
      depthTest: false,
    });
    const doubleWire = new THREE.LineSegments(doubleEdges, doubleLineMat);
    doubleWire.position.set(baseWidth / 2, size.y / 2, baseDepth / 2);
    doubleWire.renderOrder = 100;

    const doubleFillMat = new THREE.MeshBasicMaterial({
      color: 0xffd54f,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthTest: false,
    });
    const doubleFill = new THREE.Mesh(doubleGeom, doubleFillMat);
    doubleFill.position.copy(doubleWire.position);
    doubleFill.renderOrder = 100;

    const pivotMarkerDouble = new THREE.Mesh(
      new THREE.SphereGeometry(30, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffd54f, transparent: true, opacity: 0.9 })
    );
    pivotMarkerDouble.position.set(0, 0, 0);
    pivotMarkerDouble.renderOrder = 120;

    doubleZoneGroup.add(doubleWire);
    doubleZoneGroup.add(doubleFill);
    doubleZoneGroup.add(pivotMarkerDouble);
    doubleZoneGroup.position.set(baseLocalX, 0, baseLocalZ);
    sectionGroup.add(doubleZoneGroup);
    state.sectionZones[sectionData.id].push(doubleZoneGroup);

    // ===      ===
    // При customZoneWidthsMm ширина жёлтой «двойной» = moduleWidths[i], а половинки раньше
    // считались как partSize/2 (среднее по секции) → сумма не совпадала с baseWidth, зоны
    //      .
    const defaultSingleWidth =
      singleWidthForLShape != null
        ? singleWidthForLShape
        : moduleWidths && Number.isFinite(moduleWidths[i])
          ? moduleWidths[i] / 2
          : partSize / 2;

    //     .
    const singleWidths = [defaultSingleWidth, defaultSingleWidth];

    // Primary L: ‑   (S+D),     cornerAtStart.
    if (isLShapeBack && freeSizeMm != null && cornerSingleWidthMm != null) {
      const cornerAtStart =
        lMeta?.cornerAtStart === true ||
        (sectionData?.lShape &&
          getLShapeTypeKey(sectionData) === 'corner-back-left' &&
          sectionData.lShape.role === 'back');

      if (useSegments && doubleSegments && doubleSegments[i] && doubleSegments[i].type === 'special') {
        const S = singleWidthForLShape != null ? singleWidthForLShape : defaultSingleWidth;
        const D = cornerSingleWidthMm;
        if (cornerAtStart) {
          //    U:   = D,  = S.
          singleWidths[0] = D;
          singleWidths[1] = S;
        } else {
          //    U:  = S,  = D.
          singleWidths[0] = S;
          singleWidths[1] = D;
        }
      } else if (!useSegments && singleWidthForLShape != null && i === parts - 1) {
        //    segments: ‑   .
        singleWidths[0] = singleWidthForLShape;
        singleWidths[1] = cornerSingleWidthMm;
      } else {
        // Legacy:    freeSizeMm.
        const useAsymmetricSingles =
          isLShapeBack && !freeSizeMm && i === parts - 1 && cornerSingleWidthMm != null;

        if (useAsymmetricSingles) {
          const cornerW = Math.min(cornerSingleWidthMm, partSize);
          const leftW = Math.max(0, partSize - cornerW);
          singleWidths[0] = leftW;
          singleWidths[1] = cornerW;
        }
      }
    }

    // :    , :    
    for (let j = 0; j < 2; j++) {
      const singleGroup = new THREE.Group();
      singleGroup.name = `SectionZoneSingle_${sectionData.id}_${i}_${j}`;

      let sWidth;
      let sDepth;
      let sLocalX = 0;
      let sLocalZ = 0;

      if (isAlongX) {
        const sWidthLocal = singleWidths[j];
        sWidth = sWidthLocal;
        sDepth = size.z;

        //  back: worldStart     ,    .
        const offsetInDouble = j === 0 ? 0 : singleWidths[0];
        const singleWorldStart = worldStart + offsetInDouble;
        const singleLocalOffsetX = singleWorldStart - sectionPos.x;
        sLocalX = singleLocalOffsetX;
        sLocalZ = localMinZ;
      } else {
        //  :      (  ).
        sWidth = size.x;
        const singleWidth =
          moduleWidths && Number.isFinite(moduleWidths[i])
            ? moduleWidths[i] / 2
            : partSize / 2;
        sDepth = singleWidth;

        const singleWorldStart = worldStart + j * singleWidth;
        let singleLocalOffsetZ = singleWorldStart - sectionPos.z;
        if (localUMin != null && localUMax != null) {
          if (singleLocalOffsetZ < localUMin) singleLocalOffsetZ = localUMin;
          if (singleLocalOffsetZ > localUMax) singleLocalOffsetZ = localUMax;
          if (singleLocalOffsetZ + sDepth > localUMax) {
            sDepth = Math.max(0, localUMax - singleLocalOffsetZ);
          }
        }
        sLocalX = localMinX;
        sLocalZ = singleLocalOffsetZ;
      }

      const singleGeom = new THREE.BoxGeometry(sWidth, size.y, sDepth);
      const singleEdges = new THREE.EdgesGeometry(singleGeom);
      const singleLineMat = new THREE.LineBasicMaterial({
        color: 0xffb74d, // -  
        linewidth: 1,
        transparent: true,
        opacity: 0.45,
        depthTest: false,
      });
      const singleWire = new THREE.LineSegments(singleEdges, singleLineMat);
      singleWire.position.set(sWidth / 2, size.y / 2, sDepth / 2);
      singleWire.renderOrder = 100;

      const singleFillMat = new THREE.MeshBasicMaterial({
        color: 0xffb74d,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthTest: false,
      });
      const singleFill = new THREE.Mesh(singleGeom, singleFillMat);
      singleFill.position.copy(singleWire.position);
      singleFill.renderOrder = 100;

      const pivotMarkerSingle = new THREE.Mesh(
        new THREE.SphereGeometry(25, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xffb74d, transparent: true, opacity: 0.9 })
      );
      pivotMarkerSingle.position.set(0, 0, 0);
      pivotMarkerSingle.renderOrder = 120;

      singleGroup.add(singleWire);
      singleGroup.add(singleFill);
      singleGroup.add(pivotMarkerSingle);
      singleGroup.position.set(sLocalX, 0, sLocalZ);

      sectionGroup.add(singleGroup);
      state.sectionZones[sectionData.id].push(singleGroup);

      if (typeof window !== 'undefined' && window.DEBUG_LAYOUT_ZONES === true) {
        try {
          const labelText = `${Math.round(sWidth)} мм`;
          const zoneWorldPos = new THREE.Vector3();
          singleGroup.updateMatrixWorld(true);
          singleGroup.localToWorld(zoneWorldPos.set(sWidth / 2, size.y + 50, sDepth / 2));
          const label = createDimensionLabel(
            labelText,
            zoneWorldPos,
            'section-single-width-label'
          );
          if (!window.sectionSingleZoneLabels) {
            window.sectionSingleZoneLabels = [];
          }
          if (label) {
            if (!label.userData) {
              label.userData = {};
            }
            if (sectionData && sectionData.id) {
              label.userData.sectionId = sectionData.id;
            }
            window.sectionSingleZoneLabels.push(label);
          }
        } catch (e) {
          console.warn('⚠️       :', e);
        }
      }
    }
  }

  // .    L (legacy  singleWidthMm)   primary-,  U.
  if (
    isLShapeBack &&
    freeSizeMm != null &&
    freeSizeMm > 0 &&
    cornerSingleWidthMm != null &&
    cornerSingleWidthMm > 0 &&
    !singleWidthForLShape
  ) {
    try {
      const cornerStartWorld = sectionStart + freeSizeMm;
      const cornerWidth = cornerSingleWidthMm;
      let cornerDepthLabel = cornerWidth;

      const cornerGroup = new THREE.Group();
      cornerGroup.name = `SectionZoneSingleCorner_${sectionData.id}`;

      if (isAlongX) {
        const cornerLocalOffsetX = cornerStartWorld - sectionPos.x;
        const cornerDepth = size.z;
        cornerDepthLabel = cornerDepth;
        const cornerGeom = new THREE.BoxGeometry(cornerWidth, size.y, cornerDepth);
        const cornerEdges = new THREE.EdgesGeometry(cornerGeom);
        const cornerLineMat = new THREE.LineBasicMaterial({
          color: 0xffb74d,
          linewidth: 1,
          transparent: true,
          opacity: 0.45,
          depthTest: false,
        });
        const cornerWire = new THREE.LineSegments(cornerEdges, cornerLineMat);
        cornerWire.position.set(cornerWidth / 2, size.y / 2, cornerDepth / 2);
        cornerWire.renderOrder = 100;

        const cornerFillMat = new THREE.MeshBasicMaterial({
          color: 0xffb74d,
          transparent: true,
          opacity: 0.18,
          side: THREE.DoubleSide,
          depthTest: false,
        });
        const cornerFill = new THREE.Mesh(cornerGeom, cornerFillMat);
        cornerFill.position.copy(cornerWire.position);
        cornerFill.renderOrder = 100;

        const pivotMarkerCorner = new THREE.Mesh(
          new THREE.SphereGeometry(25, 8, 6),
          new THREE.MeshBasicMaterial({ color: 0xffb74d, transparent: true, opacity: 0.9 })
        );
        pivotMarkerCorner.position.set(0, 0, 0);
        pivotMarkerCorner.renderOrder = 120;

        cornerGroup.add(cornerWire);
        cornerGroup.add(cornerFill);
        cornerGroup.add(pivotMarkerCorner);
        cornerGroup.position.set(cornerLocalOffsetX, 0, localMinZ);
      } else {
        let cornerLocalOffsetZ = cornerStartWorld - sectionPos.z;
        let cornerDepth = cornerWidth;
        if (localUMin != null && localUMax != null) {
          if (cornerLocalOffsetZ < localUMin) cornerLocalOffsetZ = localUMin;
          if (cornerLocalOffsetZ > localUMax) cornerLocalOffsetZ = localUMax;
          if (cornerLocalOffsetZ + cornerDepth > localUMax) {
            cornerDepth = Math.max(0, localUMax - cornerLocalOffsetZ);
          }
        }
        cornerDepthLabel = cornerDepth;
        const cornerGeom = new THREE.BoxGeometry(size.x, size.y, cornerDepth);
        const cornerEdges = new THREE.EdgesGeometry(cornerGeom);
        const cornerLineMat = new THREE.LineBasicMaterial({
          color: 0xffb74d,
          linewidth: 1,
          transparent: true,
          opacity: 0.45,
          depthTest: false,
        });
        const cornerWire = new THREE.LineSegments(cornerEdges, cornerLineMat);
        cornerWire.position.set(size.x / 2, size.y / 2, cornerDepth / 2);
        cornerWire.renderOrder = 100;

        const cornerFillMat = new THREE.MeshBasicMaterial({
          color: 0xffb74d,
          transparent: true,
          opacity: 0.18,
          side: THREE.DoubleSide,
          depthTest: false,
        });
        const cornerFill = new THREE.Mesh(cornerGeom, cornerFillMat);
        cornerFill.position.copy(cornerWire.position);
        cornerFill.renderOrder = 100;

        const pivotMarkerCorner = new THREE.Mesh(
          new THREE.SphereGeometry(25, 8, 6),
          new THREE.MeshBasicMaterial({ color: 0xffb74d, transparent: true, opacity: 0.9 })
        );
        pivotMarkerCorner.position.set(0, 0, 0);
        pivotMarkerCorner.renderOrder = 120;

        cornerGroup.add(cornerWire);
        cornerGroup.add(cornerFill);
        cornerGroup.add(pivotMarkerCorner);
        cornerGroup.position.set(localMinX, 0, cornerLocalOffsetZ);
      }

      sectionGroup.add(cornerGroup);
      state.sectionZones[sectionData.id].push(cornerGroup);

      if (typeof window !== 'undefined' && window.DEBUG_LAYOUT_ZONES === true) {
        const labelText = `${Math.round(cornerWidth)} мм`;
        const zoneWorldPos = new THREE.Vector3();
        cornerGroup.updateMatrixWorld(true);
        cornerGroup.localToWorld(zoneWorldPos.set(cornerWidth / 2, size.y + 50, cornerDepthLabel / 2));
        const label = createDimensionLabel(labelText, zoneWorldPos, 'section-single-width-label');
        if (!window.sectionSingleZoneLabels) {
          window.sectionSingleZoneLabels = [];
        }
        if (label) {
          if (!label.userData) {
            label.userData = {};
          }
          if (sectionData && sectionData.id) {
            label.userData.sectionId = sectionData.id;
          }
          window.sectionSingleZoneLabels.push(label);
        }
      }
    } catch (e) {
      console.warn('⚠️       L‑:', e);
    }
  }

  // Cap 16 мм: wireframe только в отладке («Ниши» / зоны). Иначе — «линии от накладок».
  const showCapDebug =
    !!state.showDoubleZones ||
    !!state.showSingleZones ||
    (typeof window !== 'undefined' && window.DEBUG_COLOR_SECTIONS === true);
  const capSegs = sectionData._layoutCache?.segments?.filter((s) => s.type === 'cap');
  if (showCapDebug && capSegs && capSegs.length > 0) {
    const capLineMat = new THREE.LineBasicMaterial({
      color: 0x7ea7d8,
      transparent: true,
      opacity: 0.35,
      depthTest: false,
    });
    const capFillMat = new THREE.MeshBasicMaterial({
      color: 0x7ea7d8,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthTest: false,
    });

    for (const capSeg of capSegs) {
      try {
        const capWidthU = capSeg.endU - capSeg.startU;
        const capGroup = new THREE.Group();
        capGroup.name = `SectionZoneCap_${sectionData.id}_${capSeg.nicheZoneIndex}`;

        if (isAlongX) {
          const capLocalX = capSeg.startU - sectionPos.x;
          const capGeom = new THREE.BoxGeometry(capWidthU, size.y, size.z);
          const capEdges = new THREE.EdgesGeometry(capGeom);
          const capWire = new THREE.LineSegments(capEdges, capLineMat);
          capWire.position.set(capWidthU / 2, size.y / 2, size.z / 2);
          const capFill = new THREE.Mesh(capGeom, capFillMat.clone());
          capFill.position.copy(capWire.position);
          capGroup.add(capWire);
          capGroup.add(capFill);
          capGroup.position.set(capLocalX, 0, localMinZ);
        } else {
          const capLocalZ = capSeg.startU - sectionPos.z;
          const capGeom = new THREE.BoxGeometry(size.x, size.y, capWidthU);
          const capEdges = new THREE.EdgesGeometry(capGeom);
          const capWire = new THREE.LineSegments(capEdges, capLineMat);
          capWire.position.set(size.x / 2, size.y / 2, capWidthU / 2);
          const capFill = new THREE.Mesh(capGeom, capFillMat.clone());
          capFill.position.copy(capWire.position);
          capGroup.add(capWire);
          capGroup.add(capFill);
          capGroup.position.set(localMinX, 0, capLocalZ);
        }

        sectionGroup.add(capGroup);
        state.sectionZones[sectionData.id].push(capGroup);
      } catch (e) {
        console.warn('⚠️ createSectionZones: cap segment render error', e);
      }
    }
  }

  updateZoneVisibility();
  //  4+: /Cap     place.
  try {
    const step = typeof window !== 'undefined' ? Number(window.currentRoomStep) : 0;
    if (step >= 4 && typeof window.setStep5SectionZonesVisible === 'function') {
      window.setStep5SectionZonesVisible(false);
    }
  } catch (_) {}
}

/**
 *        .
 * :    ,   
 *       (   ),
 *     .
 *
 *  ""       ( ),
 *  ""   .
 *
 * Комната по часовой: back → right → front → left → back.
 *
 * @param {'front'|'back'|'left'|'right'} primaryWall
 * @param {'right'|'left'} cornerType
 * @returns {'front'|'back'|'left'|'right'|null}
 */
/**
 * Универсальный конфиг L‑углов: typeKey → primary, attached, cornerAtStart.
 * cornerAtStart: true = спец‑зона D у начала U (меньшая координата), false = у конца.
 */
export const L_CORNER_CONFIG = {
  'corner-back-right': { primary: 'back', attached: 'right', cornerAtStart: false },
  'corner-back-left': { primary: 'back', attached: 'left', cornerAtStart: true },
  'corner-right-front': { primary: 'right', attached: 'front', cornerAtStart: false },
  'corner-right-back': { primary: 'right', attached: 'back', cornerAtStart: true },
  'corner-front-left': { primary: 'front', attached: 'left', cornerAtStart: false },
  'corner-front-right': { primary: 'front', attached: 'right', cornerAtStart: true },
  'corner-left-front': { primary: 'left', attached: 'front', cornerAtStart: true },
  /**    ,    (      ). */
  'corner-left-back': { primary: 'left', attached: 'back', cornerAtStart: false },
};

/** Маппинг legacy lShape.type → typeKey */
const L_SHAPE_TYPE_TO_KEY = {
  'corner-wardrobe': 'corner-back-right',
  'top-right': 'corner-back-right',
  'corner-back-right': 'corner-back-right',
  'corner-back-left': 'corner-back-left',
  'corner-wardrobe-left': 'corner-back-left',
  'top-left': 'corner-back-left',
  'corner-right-front': 'corner-right-front',
  'corner-left-front': 'corner-left-front',
  'corner-left-back': 'corner-left-back',
};

/**  typeKey   L‑ (  ) */
function getLShapeTypeKey(sectionData) {
  const t = sectionData?.lShape?.type;
  if (!t) return null;
  const mapped = L_SHAPE_TYPE_TO_KEY[t];
  if (mapped) return mapped;
  // Универсальные типы создаются как `corner-${primaryWall}-${attachedWall}`.
  //          .
  if (t in L_CORNER_CONFIG) return t;
  return null;
}

/**
 *   L‑  .
 * Возвращает { typeKey, primary, attached, cornerAtStart, role } только для основной секции угла,
 *  null.
 *
 * @param {{ lShape?: { type: string, role: string }, wallName?: string }} sectionData
 * @returns {{ typeKey: string, primary: string, attached: string, cornerAtStart: boolean, role: string } | null}
 */
export function getLShapeMeta(sectionData) {
  if (!sectionData?.lShape?.type || !sectionData.wallName) return null;
  const joint = resolveSectionCornerJoint(sectionData);
  if (joint && sectionData.wallName === joint.primary) {
    const cornerAtStart =
      typeof sectionData.lShape.cornerAtStart === 'boolean'
        ? sectionData.lShape.cornerAtStart
        : joint.cornerAtStart;
    return {
      typeKey: joint.typeKey,
      primary: joint.primary,
      attached: joint.attached,
      cornerAtStart,
      role: sectionData.lShape.role,
    };
  }
  const typeKey = getLShapeTypeKey(sectionData);
  if (!typeKey || !(typeKey in L_CORNER_CONFIG)) {
    return null;
  }
  const cfg = L_CORNER_CONFIG[typeKey];
  const role = sectionData.lShape.role;
  if (role !== cfg.primary) {
    return null; //   
  }
  const cornerAtStart =
    typeof sectionData.lShape.cornerAtStart === 'boolean'
      ? sectionData.lShape.cornerAtStart
      : cfg.cornerAtStart;
  const meta = {
    typeKey,
    primary: cfg.primary,
    attached: cfg.attached,
    cornerAtStart,
    role,
  };
  return meta;
}

/**  - L (). null =  /  primary. */
export function getLShapeSpecialZoneIndex(sectionData) {
  if (!sectionData?.lShape || !sectionData.division) return null;
  const div = sectionData.division;
  const parts = Math.floor(Number(div.parts) || 0);
  if (parts < 1) return null;
  const segs = div.segmentsLShapeBack || div.segmentsLShape;
  if (Array.isArray(segs)) {
    const sp = segs.find((s) => s && s.type === 'special');
    if (sp != null && Number.isFinite(Number(sp.zoneIndex)) && Number(sp.zoneIndex) >= 0) {
      return Number(sp.zoneIndex);
    }
  }
  const layoutSegs = sectionData._layoutCache?.segments;
  if (Array.isArray(layoutSegs)) {
    const spLay = layoutSegs.find(
      (s) => s && (s.type === 'special' || s.isLSpecial === true)
    );
    if (spLay != null && Number.isFinite(Number(spLay.zoneIndex)) && Number(spLay.zoneIndex) >= 0) {
      return Number(spLay.zoneIndex);
    }
  }
  try {
    const meta = getLShapeMeta(sectionData);
    if (meta?.cornerAtStart === true) return 0;
    if (meta?.cornerAtStart === false) return parts - 1;
  } catch (_) {}
  const typeKey = div.typeKey || getLShapeTypeKey(sectionData);
  const cfg = typeKey && L_CORNER_CONFIG ? L_CORNER_CONFIG[typeKey] : null;
  if (cfg) {
    if (sectionData.lShape.role && sectionData.lShape.role !== cfg.primary) return null;
    return cfg.cornerAtStart ? 0 : parts - 1;
  }
  return null;
}

/**
 * Ячейка S для L (одинарная половина спец S+D).
 * Часто отсутствует на division после authoritative path → snap даёт zi=parts-2
 * вместо special (лог: specialZi:4, zoneIndex:3, segs пустые).
 * Как findOptimalLShapeBackDivision: S ∈ [400,600], ближе к 500;
 * extraSingleLeft → free = 2*parts*S, иначе free = (2*parts−1)*S.
 */
export function resolveLShapeSingleWidthMm(division) {
  if (!division) return null;
  let S = Number(division.singleWidthMm);
  if (Number.isFinite(S) && S > 0) return S;
  const free = Number(division.freeSizeMm);
  const parts = Math.floor(Number(division.parts) || 0);
  const S_MIN = 400;
  const S_MAX = 600;
  const S_IDEAL = 500;
  if (Number.isFinite(free) && free > 0 && parts >= 1) {
    const candidates = [];
    if (division.extraSingleLeft === true) {
      candidates.push({ S: free / (2 * parts), extra: true });
    } else if (division.extraSingleLeft === false) {
      candidates.push({ S: free / Math.max(1, 2 * parts - 1), extra: false });
    } else {
      candidates.push({ S: free / (2 * parts), extra: true });
      candidates.push({ S: free / Math.max(1, 2 * parts - 1), extra: false });
    }
    let best = null;
    let bestScore = -Infinity;
    for (const c of candidates) {
      if (!(c.S > 0) || !Number.isFinite(c.S)) continue;
      if (c.S < S_MIN || c.S > S_MAX) continue;
      const score = 1000 - Math.abs(c.S - S_IDEAL);
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    if (!best) {
      // Вне диапазона — всё же ближайший к 500 (лучше съехавшая спец, чем null).
      for (const c of candidates) {
        if (!(c.S > 0) || !Number.isFinite(c.S)) continue;
        const score = -Math.abs(c.S - S_IDEAL);
        if (score > bestScore) {
          bestScore = score;
          best = c;
        }
      }
    }
    if (best) {
      division.singleWidthMm = best.S;
      if (division.extraSingleLeft == null) division.extraSingleLeft = best.extra;
      return best.S;
    }
  }
  const ps = Number(division.partSize);
  if (Number.isFinite(ps) && ps > 0) {
    S = ps / 2;
    if (S >= S_MIN && S <= S_MAX) {
      division.singleWidthMm = S;
      return S;
    }
  }
  return null;
}

/**
 * Если segmentsLShape* пусты — собрать doubles + special (S+D), чтобы маркеры/layout/snap
 * совпадали со спец-ячейкой угла (§6.8), а не с равномерной сеткой partSize.
 */
export function ensureLShapeDivisionSegments(division) {
  if (!division) return false;
  const cfg = division.typeKey && L_CORNER_CONFIG[division.typeKey];
  if (!cfg) return false;
  const has =
    (Array.isArray(division.segmentsLShapeBack) && division.segmentsLShapeBack.length > 0) ||
    (Array.isArray(division.segmentsLShape) && division.segmentsLShape.length > 0);
  if (has) return true;
  const S = resolveLShapeSingleWidthMm(division);
  const D = Number(division.cornerWidthMm);
  let free = Number(division.freeSizeMm);
  const start = Number(division.sectionStart);
  const sectionEnd = Number(division.sectionEnd);
  const parts = Math.floor(Number(division.parts) || 0);
  if (!(S > 0) || !(D > 0) || !Number.isFinite(start) || parts < 1) {
    return false;
  }
  if (Number.isFinite(sectionEnd) && sectionEnd > start && D > 0) {
    const freeFromSpan = sectionEnd - start - D;
    if (freeFromSpan > 0 && (!Number.isFinite(free) || free > freeFromSpan + 0.5)) {
      free = freeFromSpan;
      division.freeSizeMm = free;
    }
  }
  if (!(free > 0)) return false;
  const segs = [];
  const add = (type, widthMm, startU, zoneIndex) => {
    segs.push({ type, widthMm, startWorldU: startU, zoneIndex });
  };
  if (cfg.cornerAtStart) {
    let spW = S + D;
    if (Number.isFinite(sectionEnd) && start + spW > sectionEnd + 0.5) {
      spW = Math.max(1, sectionEnd - start);
    }
    add('special', spW, start, 0);
    let u = start + spW;
    const freeArm = Math.max(0, (Number.isFinite(sectionEnd) ? sectionEnd : start + free + D) - u);
    const nReg = parts - 1;
    if (nReg > 0 && freeArm > 0) {
      const doubleW = freeArm / nReg;
      for (let j = 0; j < nReg; j++) {
        add('double', doubleW, u, j + 1);
        u += doubleW;
      }
    }
  } else {
    const freeArm = free - S;
    const nReg = parts - 1;
    let u = start;
    if (nReg > 0 && freeArm > 0) {
      const doubleW = freeArm / nReg;
      for (let j = 0; j < nReg; j++) {
        add('double', doubleW, u, j);
        u += doubleW;
      }
    }
    const spStart = start + free - S;
    let spW = S + D;
    if (Number.isFinite(sectionEnd) && spStart + spW > sectionEnd + 0.5) {
      spW = Math.max(1, sectionEnd - spStart);
    }
    add('special', spW, spStart, parts - 1);
  }
  division.segmentsLShape = segs;
  if (division.isLShapeBack || cfg.primary === 'back') {
    division.segmentsLShapeBack = segs.map((s) => ({
      ...s,
      startWorldX: s.startWorldU,
    }));
  }
  if (!(Number(division.partSize) > 0) && S > 0) {
    division.partSize = 2 * S;
  }
  console.log('[L-CORNER] ensureLShapeDivisionSegments', {
    parts,
    S,
    D,
    free,
    segs: segs.map((s) => ({ type: s.type, zi: s.zoneIndex, w: s.widthMm })),
  });
  return true;
}

/** Подтянуть сегмент special к фактическим snap-bounds (не залезать в зазор 50). */
function syncLShapeSpecialSegmentToBounds(division, sp) {
  if (!division || !sp) return;
  const lists = [division.segmentsLShape, division.segmentsLShapeBack];
  for (const segs of lists) {
    if (!Array.isArray(segs)) continue;
    for (const s of segs) {
      if (!s || s.type !== 'special') continue;
      if (Number(s.zoneIndex) !== Number(sp.zoneIndex)) continue;
      s.startWorldU = sp.zoneStart;
      s.widthMm = sp.moduleWidth;
      if (s.startWorldX != null) s.startWorldX = sp.zoneStart;
    }
  }
}

/**
 * Границы спец-зоны L (S+D) в оси U. null = нет typeKey/S/D/free.
 * Нужен и snap, и buildZoneSnap — иначе authSnap затирает ширину в partSize (куцый призрак).
 *
 * Важно (§6.8 / CORNER_GAP 50): спец не должна вылезать за sectionEnd в зазор у стены.
 * Планка №1 сидит на размере секции (с 5 см); если free устарел и free+D > span —
 * корпус лезет до стены, планка — нет.
 */
export function getLShapeSpecialSnapBounds(division) {
  if (!division) return null;
  const cfg = division.typeKey && L_CORNER_CONFIG[division.typeKey];
  if (!cfg) return null;
  const S = resolveLShapeSingleWidthMm(division);
  const D = Number(division.cornerWidthMm);
  let free = Number(division.freeSizeMm);
  const start = Number(division.sectionStart);
  const sectionEnd = Number(division.sectionEnd);
  const parts = Math.floor(Number(division.parts) || 0);
  if (!(parts >= 1) || !(S > 0) || !(D > 0) || !Number.isFinite(start)) {
    return null;
  }
  // Сверить free со span секции (sectionEnd уже с зазором 50 у угла).
  if (Number.isFinite(sectionEnd) && sectionEnd > start) {
    const span = sectionEnd - start;
    const freeFromSpan = span - D;
    if (freeFromSpan > 0 && (!Number.isFinite(free) || free > freeFromSpan + 0.5)) {
      console.log('[L-CORNER] free clamped to sectionEnd−D', {
        wasFree: free,
        freeFromSpan,
        span,
        D,
      });
      free = freeFromSpan;
      division.freeSizeMm = free;
    }
  }
  if (!(free > 0)) return null;

  ensureLShapeDivisionSegments(division);

  const zoneIndex = cfg.cornerAtStart ? 0 : parts - 1;
  let zoneStart = cfg.cornerAtStart ? start : start + free - S;
  let moduleWidth = S + D;
  let zEnd = zoneStart + moduleWidth;
  if (cfg.cornerAtStart && Number.isFinite(start) && zoneStart < start - 0.5) {
    zoneStart = start;
    zEnd = zoneStart + moduleWidth;
  }
  if (Number.isFinite(sectionEnd) && zEnd > sectionEnd + 0.5) {
    console.log('[L-CORNER] special zEnd clamped to sectionEnd', {
      wasZEnd: zEnd,
      sectionEnd,
      moduleWidthBefore: moduleWidth,
    });
    zEnd = sectionEnd;
    moduleWidth = Math.max(1, zEnd - zoneStart);
  }
  const bounds = {
    zoneIndex,
    zoneStart,
    moduleWidth,
    zEnd,
    S,
    D,
  };
  syncLShapeSpecialSegmentToBounds(division, bounds);
  return bounds;
}

function layoutSegmentsFromLShape(division) {
  // Перед чтением — подтянуть special к sectionEnd (иначе stale S+D после создания пары).
  if (division?.typeKey && L_CORNER_CONFIG[division.typeKey]) {
    getLShapeSpecialSnapBounds(division);
  }
  const raw = Array.isArray(division?.segmentsLShapeBack)
    ? division.segmentsLShapeBack
    : Array.isArray(division?.segmentsLShape)
      ? division.segmentsLShape
      : null;
  if (!raw || !raw.length) return null;
  const segments = [];
  for (const s of raw) {
    if (!s) continue;
    if (s.type !== 'double' && s.type !== 'special' && s.type !== 'single') continue;
    const zi = Number(s.zoneIndex);
    const startU = Number(s.startWorldU ?? s.startWorldX);
    const w = Number(s.widthMm);
    if (!(Number.isFinite(zi) && zi >= 0 && Number.isFinite(startU) && w > 0)) continue;
    segments.push({
      type: 'module',
      zoneIndex: zi,
      startU,
      endU: startU + w,
      doorKind: s.type === 'special' || w >= _TWO_DOOR_MIN_MM ? 'double' : 'single',
    });
  }
  return segments.length ? segments : null;
}

function findCornerPairSection(section, joint) {
  if (!section?.lShape || !Array.isArray(state.customSections)) return null;
  const ls = section.lShape;
  let pairId = ls.pairId || null;
  if (joint?.hand === 'left' && ls.pairIdLeft) pairId = ls.pairIdLeft;
  if (joint?.hand === 'right' && ls.pairIdRight) pairId = ls.pairIdRight;
  if (!pairId) return null;
  return state.customSections.find((s) => s && s.id === pairId) || null;
}

function jointPlanOverlapCuts(wallName, plan) {
  const out = { min: 0, max: 0 };
  if (!plan || plan.role !== 'primary' || !(plan.overlapMm > 0)) return out;
  if (plan.uShape) {
    out.min = plan.overlapMm;
    out.max = plan.overlapMm;
    return out;
  }
  const axes = getWallAxes(wallName);
  const atStart = plan.cornerAtStart === true;
  const cutMin = axes.u.sign > 0 ? atStart : !atStart;
  if (cutMin) out.min = plan.overlapMm;
  else out.max = plan.overlapMm;
  return out;
}

/**
 *     .
 *  :     (  ).
 *  back↔right, right↔back, front↔left, left↔back (на левой стене — справа = back).
 * Левый угол: back↔left, left↔back, front↔right, right↔front.
 */
// (L‑corner) getAttachedWallForCorner / isCornerLayoutKey вынесены в `l-corner.js`

function shouldDebugOnlyBackStraightSection() {
  //  :       .
  return false;
}

/**
 *    :   -     back.
 * ,         .
 */
export function enforceDebugOnlyBackStraightSectionVisibility() {
  if (!shouldDebugOnlyBackStraightSection()) return;
  if (!Array.isArray(state.customSections)) return;
  state.customSections.forEach((sec) => {
    if (!sec || !sec.group) return;
    const isCorner =
      !!sec.lShape ||
      (sec.group.userData && sec.group.userData.isCornerSection === true);
    const isBack = (sec.wallName || sec.group.userData?.wallName) === 'back';
    // :      +    back
    sec.group.visible = isCorner || isBack;
  });
}

/**
 *    ( / )   
 */
export function updateZoneVisibility() {
  if (!state.sectionZones) return;
  for (const sectionId of Object.keys(state.sectionZones)) {
    const zones = state.sectionZones[sectionId];
    if (!Array.isArray(zones)) continue;
    zones.forEach((g) => {
      if (!g || !g.name) return;
      if (g.name.startsWith('SectionZoneDouble')) {
        g.visible = !!state.showDoubleZones;
      } else if (
        g.name.startsWith('SectionZoneSingle') ||
        g.name.startsWith('SectionZoneSingleCorner')
      ) {
        // В т.ч. SectionZoneSingleCornerLeft_ (спец L) — иначе остаётся после place.
        g.visible = !!state.showSingleZones;
      } else if (g.name.startsWith('SectionZoneCap')) {
        //   visible:   place   4    .
        g.visible =
          !!state.showDoubleZones ||
          !!state.showSingleZones ||
          (typeof window !== 'undefined' && window.DEBUG_COLOR_SECTIONS === true);
      }
    });
  }
}

/**
 * Snap hit coordinate to zone (double module) - returns pivot coord for zone
 * @param {number} hitCoord - World coord along division axis (X for front/back, Z for left/right)
 * @param {Object} division - { partSize, sectionStart, sectionEnd, parts, wallName }
 * @param {string} wallName - Wall name (optional override)
 * @param {string} [sectionIdOpt] - если задан, учитываем зазор 16 мм перед зоной после накладки шкаф/тумба
 * @returns {{ pivotCoord: number, zoneIndex: number, moduleWidth: number }|null}
 */
/**
 * Возвращает тип двери зоны: 'single' | 'double' | null.
 * Ширина слота — источник истины (после split half-width не должен оставаться «double»
 * из-за устаревшего doorKind в _layoutCache).
 */
export function getZoneDoorKind(section, zoneIndex) {
  const division = section?.division;
  if (!division) return null;

  const specialZi = getLShapeSpecialZoneIndex(section);
  if (specialZi != null && Number(zoneIndex) === specialZi) {
    const sd = Number(division.singleWidthMm) || 0;
    const cd = Number(division.cornerWidthMm) || 0;
    if (sd + cd >= _TWO_DOOR_MIN_MM) return 'double';
    return 'double';
  }

  const segments = section?._layoutCache?.segments || [];
  const seg = segments.find((s) => s.type === 'module' && s.zoneIndex === zoneIndex);

  let wz = null;
  if (seg && Number.isFinite(seg.endU - seg.startU) && seg.endU > seg.startU) {
    wz = seg.endU - seg.startU;
  } else {
    const cw = Number(
      division.customZoneWidthsMm?.[zoneIndex] ??
        division.customZoneWidthsMm?.[String(zoneIndex)]
    );
    if (Number.isFinite(cw) && cw > 0) wz = cw;
    else if (Number(division.partSize) > 0) wz = Number(division.partSize);
  }

  if (!(wz > 0)) {
    if (seg?.doorKind === 'single' || seg?.doorKind === 'double') return seg.doorKind;
    return null;
  }

  // allSingles / mixedLeftSingle — как в computeSectionLayout
  if (division.layoutKind === 'allSingles') return 'single';
  if (division.layoutKind === 'mixedLeftSingle') {
    const parts = Math.max(0, Math.floor(Number(division.parts) || 0));
    if (parts <= 0) return 'double';
    return zoneIndex === parts - 1 ? 'single' : 'double';
  }

  const doubleMinMm = getSectionDoubleMinMmFromConfig();
  const nStrip = Number(division.stripCountN);
  const evenAllDoubles =
    Number.isFinite(nStrip) &&
    nStrip >= 2 &&
    nStrip % 2 === 0 &&
    division.layoutKind !== 'mixedLeftSingle';

  // Сначала жёстко < 60 см — однодверная (иначе stale doorKind:double после split).
  if (wz < _SINGLE_DOOR_VISUAL_MAX_MM) return 'single';
  if (wz < doubleMinMm) return 'single';
  if (evenAllDoubles) return 'double';
  if (wz >= _TWO_DOOR_MIN_MM) return 'double';
  return 'single';
}

export function snapToZoneDoubleModule(hitCoord, division, wallName, sectionIdOpt) {
  if (!division || division.partSize == null || division.parts <= 0) return null;
  const { partSize, sectionStart, sectionEnd, parts } = division;
  const w = wallName || division.wallName || 'back';

  let zoneIndex;
  let zoneStart;
  let moduleWidth;

  // L S+D: спец НЕ на сетке partSize. Hit в диапазоне — сразу specialZi
  // (до segments/layout/grid), иначе над оранжевой часто zi = parts-2.
  const lSpecialSnap = getLShapeSpecialSnapBounds(division);
  if (
    lSpecialSnap &&
    Number.isFinite(hitCoord) &&
    hitCoord >= lSpecialSnap.zoneStart - 0.5 &&
    hitCoord < lSpecialSnap.zEnd + 0.5
  ) {
    const axesEarly = getWallAxes(w);
    const pivotCoord =
      axesEarly.u.sign < 0
        ? lSpecialSnap.zoneStart + lSpecialSnap.moduleWidth
        : lSpecialSnap.zoneStart;
    if (typeof window !== 'undefined' && window.__cldLCornerSnapLog !== false) {
      console.log('[L-CORNER] snap hit special (S+D range first)', {
        hitCoord,
        zoneIndex: lSpecialSnap.zoneIndex,
        zoneStart: lSpecialSnap.zoneStart,
        moduleWidth: lSpecialSnap.moduleWidth,
        S: lSpecialSnap.S,
        D: lSpecialSnap.D,
        typeKey: division.typeKey,
      });
    }
    return {
      pivotCoord,
      zoneIndex: lSpecialSnap.zoneIndex,
      moduleWidth: lSpecialSnap.moduleWidth,
    };
  }

  // Как getLShapeSpecialZoneIndex: Back авторитетнее (пустой segmentsLShape не должен перекрывать Back).
  const segments =
    Array.isArray(division.segmentsLShapeBack) && division.segmentsLShapeBack.length > 0
      ? division.segmentsLShapeBack
      : Array.isArray(division.segmentsLShape) && division.segmentsLShape.length > 0
        ? division.segmentsLShape
        : null;
  if (Array.isArray(segments) && segments.length > 0) {
    const doubleSegs = segments.filter((s) => s && (s.type === 'double' || s.type === 'special'));
    let found = null;
    for (let j = 0; j < doubleSegs.length; j++) {
      const seg = doubleSegs[j];
      const segStart = typeof seg.startWorldU === 'number' ? seg.startWorldU : seg.startWorldX;
      const segEnd = segStart + Number(seg.widthMm || 0);
      if (!(Number.isFinite(segStart) && segEnd > segStart)) continue;
      if (hitCoord >= segStart && hitCoord < segEnd) {
        found = {
          zoneIndex: seg.zoneIndex >= 0 ? seg.zoneIndex : j,
          zoneStart: segStart,
          moduleWidth: seg.widthMm,
          type: seg.type,
        };
        break;
      }
    }
    // Промах: ближайший сегмент (не всегда parts-1 — ломает спец у начала U).
    if (!found && doubleSegs.length > 0) {
      let best = null;
      let bestD = Infinity;
      for (let j = 0; j < doubleSegs.length; j++) {
        const seg = doubleSegs[j];
        const segStart = typeof seg.startWorldU === 'number' ? seg.startWorldU : seg.startWorldX;
        const ww = Number(seg.widthMm || 0);
        if (!(Number.isFinite(segStart) && ww > 0)) continue;
        const mid = segStart + ww / 2;
        const d = Math.abs(hitCoord - mid);
        if (d < bestD) {
          bestD = d;
          best = {
            zoneIndex: seg.zoneIndex >= 0 ? seg.zoneIndex : j,
            zoneStart: segStart,
            moduleWidth: ww,
            type: seg.type,
          };
        }
      }
      found = best;
    }
    if (found) {
      zoneIndex = found.zoneIndex;
      zoneStart = found.zoneStart;
      moduleWidth = found.moduleWidth;
    }
  }

  // Нет сегментов / промах: попадание в S+D спец — сразу specialZi (до сетки partSize).
  if (
    zoneIndex == null &&
    lSpecialSnap &&
    hitCoord >= lSpecialSnap.zoneStart &&
    hitCoord < lSpecialSnap.zEnd
  ) {
    zoneIndex = lSpecialSnap.zoneIndex;
    zoneStart = lSpecialSnap.zoneStart;
    moduleWidth = lSpecialSnap.moduleWidth;
    if (typeof window !== 'undefined' && window.__cldLCornerSnapLog !== false) {
      console.log('[L-CORNER] snap hit special (no segs / S+D range)', {
        hitCoord,
        zoneIndex,
        zoneStart,
        moduleWidth,
        typeKey: division.typeKey,
      });
    }
  }

  if (zoneIndex == null) {
    // Деление зон в мировой оси U; zoneIndex 0..parts-1 от sectionStart.
    const axes = getWallAxes(w);

    // Авторитетная разметка из computeSectionLayout: реальные границы модулей (startU/endU).
    const hasLShapeSeg =
      (Array.isArray(division.segmentsLShape) && division.segmentsLShape.length > 0) ||
      (Array.isArray(division.segmentsLShapeBack) && division.segmentsLShapeBack.length > 0);
    if (sectionIdOpt && !hasLShapeSeg) {
      const sec =
        Array.isArray(state.customSections) &&
        state.customSections.find((s) => s && s.id === sectionIdOpt);
      const layoutSegs = sec?._layoutCache?.segments;
      if (Array.isArray(layoutSegs) && layoutSegs.length > 0) {
        // Спец L: не доверять равной сетке layout, если hit в S+D (уже обработано выше).
        // Если layout всё же вернул не-спец при hit в спец — ниже перебьём.
        let m = layoutSegs
          .filter((s) => s && s.type === 'module')
          .find((s) => hitCoord >= s.startU && hitCoord < s.endU);
        if (!m) {
          const modSegs = layoutSegs.filter((s) => s && s.type === 'module');
          if (modSegs.length > 0) {
            let best = modSegs[0];
            let bestD = Infinity;
            for (const seg of modSegs) {
              const mid = (seg.startU + seg.endU) / 2;
              const d = Math.abs(hitCoord - mid);
              if (d < bestD) {
                bestD = d;
                best = seg;
              }
            }
            m = best;
          }
        }
        if (m) {
          zoneIndex = m.zoneIndex;
          zoneStart = m.startU;
          moduleWidth = m.endU - m.startU;
          // Перебить: hit в S+D спец, а layout дал другой zi.
          if (
            lSpecialSnap &&
            hitCoord >= lSpecialSnap.zoneStart &&
            hitCoord < lSpecialSnap.zEnd &&
            Number(zoneIndex) !== lSpecialSnap.zoneIndex
          ) {
            zoneIndex = lSpecialSnap.zoneIndex;
            zoneStart = lSpecialSnap.zoneStart;
            moduleWidth = lSpecialSnap.moduleWidth;
            console.log('[L-CORNER] snap override layout→special', {
              hitCoord,
              wasZi: m.zoneIndex,
              zoneIndex,
            });
          }
          const pivotCoord =
            axes.u.sign < 0 ? zoneStart + moduleWidth : zoneStart;
          return { pivotCoord, zoneIndex, moduleWidth };
        }
      }
    }

    const extraBefore =
      sectionIdOpt && parts > 0
        ? getSectionZoneTransitionGaps(sectionIdOpt, w, parts)
        : null;
    const hasGap = extraBefore && extraBefore.some((v) => Number(v) > 0);

    if (hasGap) {
      let bestJ = 0;
      let bestD = Infinity;
      for (let j = 0; j < parts; j++) {
        const zs =
          sectionStart + j * partSize + cumulativeTransitionGapMm(extraBefore, j);
        const mid = zs + partSize / 2;
        const d = Math.abs(hitCoord - mid);
        if (d < bestD) {
          bestD = d;
          bestJ = j;
        }
      }
      zoneIndex = bestJ;
      zoneStart =
        sectionStart +
        zoneIndex * partSize +
        cumulativeTransitionGapMm(extraBefore, zoneIndex);
    } else {
      zoneIndex = Math.floor((hitCoord - sectionStart) / partSize);
      zoneIndex = Math.max(0, Math.min(zoneIndex, parts - 1));
      zoneStart = sectionStart + zoneIndex * partSize;
    }
    moduleWidth = partSize;

    // Специальная логика для угловой зоны L‑шкафа (cornerAtStart → zoneIndex 0, иначе parts-1)
    const cfg = division.typeKey && L_CORNER_CONFIG[division.typeKey];
    const cornerZoneIndex = cfg?.cornerAtStart ? 0 : parts - 1;
    if (
      cfg &&
      zoneIndex === cornerZoneIndex &&
      typeof division.singleWidthMm === 'number' &&
      typeof division.freeSizeMm === 'number' &&
      typeof division.cornerWidthMm === 'number' &&
      division.singleWidthMm > 0 &&
      division.freeSizeMm > 0 &&
      division.cornerWidthMm > 0
    ) {
      const S = division.singleWidthMm;
      const D = division.cornerWidthMm;
      if (cfg.cornerAtStart) {
        zoneStart = sectionStart;
        moduleWidth = S + D;
      } else {
        const cornerStartWorld = sectionStart + division.freeSizeMm;
        zoneStart = cornerStartWorld - S;
        moduleWidth = S + D;
      }
    }

    // Ещё раз: равномерная сетка могла дать zi=3 при hit в спец zi=4.
    if (
      lSpecialSnap &&
      hitCoord >= lSpecialSnap.zoneStart &&
      hitCoord < lSpecialSnap.zEnd
    ) {
      if (Number(zoneIndex) !== lSpecialSnap.zoneIndex) {
        console.log('[L-CORNER] snap override grid→special', {
          hitCoord,
          wasZi: zoneIndex,
          zoneIndex: lSpecialSnap.zoneIndex,
        });
      }
      zoneIndex = lSpecialSnap.zoneIndex;
      zoneStart = lSpecialSnap.zoneStart;
      moduleWidth = lSpecialSnap.moduleWidth;
    }

    const pivotCoord =
      axes.u.sign < 0 ? zoneStart + moduleWidth : zoneStart;
    return { pivotCoord, zoneIndex, moduleWidth };
  }

  const zoneEnd = zoneStart + moduleWidth;

  //              :
  //     .
  //             :
  //     ,       .
  const pivotCoord =
    w === 'left' || w === 'front'
      ? zoneEnd
      : zoneStart;

  return { pivotCoord, zoneIndex, moduleWidth };
}

/**
 * Get zone pivot world position for furniture placement (pivot-to-pivot)
 * @param {Object} section - Section data with group, division
 * @param {{ pivotCoord: number }} snap - Result from snapToZoneDoubleModule
 * @param {string} wallName - Wall name
 * @returns {THREE.Vector3}
 */
/**
 *      :    (inner),    bbox .
 */
export function resolveSectionFurniturePlacement(section, wallNameOpt) {
  if (!section?.group) return null;
  const wallName = wallNameOpt || section.wallName || 'back';
  if (section.division) {
    computeSectionLayout(section);
  }
  const div = section.division || {};
  let innerWidthMm = 0;
  const innerStart = Number(div.sectionStart);
  const innerEnd = Number(div.sectionEnd);
  if (Number.isFinite(innerStart) && Number.isFinite(innerEnd) && innerEnd > innerStart) {
    innerWidthMm = innerEnd - innerStart;
  } else {
    innerWidthMm =
      wallName === 'front' || wallName === 'back'
        ? Number(section.size?.x) || 0
        : Number(section.size?.z ?? section.size?.depth) || 0;
  }
  const position = section.group.position.clone();
  if (innerWidthMm > 0 && Number.isFinite(innerStart)) {
    if (wallName === 'front' || wallName === 'back') position.x = innerStart;
    else position.z = innerStart;
  }
  const depthMm =
    wallName === 'left' || wallName === 'right'
      ? Number(section.size?.x) || 0
      : Number(section.size?.z ?? section.size?.depth) || 0;
  return { position, innerWidthMm, depthMm, wallName };
}

/**
 * Сдвиг шкафа вдоль оси деления, если bbox выходит за innerStart…innerEnd (боковые планки).
 * @param {boolean} [skipLayout] — true внутри computeSectionLayout (избежать рекурсии).
 */
/** Диагностика щели/пивота: window.DEBUG_PIVOT_TRACE = true или __clodisPivotTrace(true) */
function _pivotTraceOn() {
  return typeof window !== 'undefined' && window.DEBUG_PIVOT_TRACE === true;
}

function _r1(n) {
  return Math.round(Number(n) * 10) / 10;
}

/**
 * Снимок U: group.position / bbox / zone / section.
 * @param {string} step
 * @param {THREE.Object3D} furnitureGroup
 * @param {{ wallName?: string, zoneStart?: number, zoneEnd?: number, section?: object, extra?: object }} [ctx]
 */
export function logFurniturePivotTrace(step, furnitureGroup, ctx = {}) {
  if (!_pivotTraceOn() || !furnitureGroup) return null;
  try {
    const section = ctx.section || null;
    const wallName =
      ctx.wallName ||
      section?.wallName ||
      section?.division?.wallName ||
      furnitureGroup.userData?.wallName ||
      'back';
    const axes = getWallAxes(wallName);
    const axis = axes.u.axis;
    furnitureGroup.updateMatrixWorld(true);
    const bbox = computeFurnitureWorldBBoxNoAo(furnitureGroup);
    const groupU = axis === 'x' ? furnitureGroup.position.x : furnitureGroup.position.z;
    const bboxMinU = getAxisCoord(bbox.min, axis);
    const bboxMaxU = getAxisCoord(bbox.max, axis);
    const zoneStart = Number(ctx.zoneStart);
    const zoneEnd = Number(ctx.zoneEnd);
    const sectionStart = Number(section?.division?.sectionStart);
    const sectionEnd = Number(section?.division?.sectionEnd);
    const pivotAtEnd = wallName === 'left' || wallName === 'front';
    const expectedPivotU =
      Number.isFinite(zoneStart) && Number.isFinite(zoneEnd)
        ? pivotAtEnd
          ? zoneEnd
          : zoneStart
        : NaN;
    const row = {
      step,
      wall: wallName,
      zoneIndex: furnitureGroup.userData?.zoneIndex,
      uuid8: String(furnitureGroup.uuid || '').slice(0, 8),
      groupU: _r1(groupU),
      bboxMinU: _r1(bboxMinU),
      bboxMaxU: _r1(bboxMaxU),
      bboxW: _r1(bboxMaxU - bboxMinU),
      zoneStart: Number.isFinite(zoneStart) ? _r1(zoneStart) : undefined,
      zoneEnd: Number.isFinite(zoneEnd) ? _r1(zoneEnd) : undefined,
      zoneW:
        Number.isFinite(zoneStart) && Number.isFinite(zoneEnd)
          ? _r1(zoneEnd - zoneStart)
          : undefined,
      sectionStart: Number.isFinite(sectionStart) ? _r1(sectionStart) : undefined,
      sectionEnd: Number.isFinite(sectionEnd) ? _r1(sectionEnd) : undefined,
      deltaPivotMm: Number.isFinite(expectedPivotU) ? _r1(groupU - expectedPivotU) : undefined,
      deltaToZoneEndMm: Number.isFinite(zoneEnd) ? _r1(zoneEnd - bboxMaxU) : undefined,
      overhangPastSectionEndMm: Number.isFinite(sectionEnd)
        ? _r1(bboxMaxU - sectionEnd)
        : undefined,
      ...(ctx.extra || {}),
    };
    console.log('[PIVOT-TRACE]', row);
    return row;
  } catch (e) {
    console.warn('[PIVOT-TRACE] error', step, e);
    return null;
  }
}

function _shiftFurnitureToSectionInnerBounds(furnitureGroup, section) {
  if (!furnitureGroup || !section?.division) return false;
  const wallName = section.wallName || section.division?.wallName || 'back';
  const innerStart = Number(section.division.sectionStart);
  const innerEnd = Number(section.division.sectionEnd);
  if (!Number.isFinite(innerStart) || !Number.isFinite(innerEnd) || innerEnd <= innerStart) {
    return false;
  }
  const axes = getWallAxes(wallName);
  furnitureGroup.updateMatrixWorld(true);
  const bbox = _layoutBBoxForZoneFit(furnitureGroup);
  const minU = getAxisCoord(bbox.min, axes.u.axis);
  const maxU = getAxisCoord(bbox.max, axes.u.axis);
  let shifted = false;
  let reason = '';
  let appliedDelta = 0;
  if (_pivotTraceOn()) {
    logFurniturePivotTrace('align:before', furnitureGroup, {
      wallName,
      section,
      extra: { innerStart: _r1(innerStart), innerEnd: _r1(innerEnd), minU: _r1(minU), maxU: _r1(maxU) },
    });
  }
  if (maxU > innerEnd + 0.5) {
    const delta = maxU - innerEnd;
    if (axes.u.axis === 'x') furnitureGroup.position.x -= delta;
    else furnitureGroup.position.z -= delta;
    shifted = true;
    reason = 'clamp_max_to_sectionEnd';
    appliedDelta = -delta;
  }
  if (minU < innerStart - 0.5) {
    const delta = innerStart - minU;
    if (axes.u.axis === 'x') furnitureGroup.position.x += delta;
    else furnitureGroup.position.z += delta;
    shifted = true;
    reason = reason ? `${reason}+clamp_min_to_sectionStart` : 'clamp_min_to_sectionStart';
    appliedDelta += delta;
  }
  if (shifted) furnitureGroup.updateMatrixWorld(true);
  if (_pivotTraceOn()) {
    logFurniturePivotTrace('align:after', furnitureGroup, {
      wallName,
      section,
      extra: {
        shifted,
        reason: reason || 'none',
        appliedDeltaMm: _r1(appliedDelta),
        innerStart: _r1(innerStart),
        innerEnd: _r1(innerEnd),
        note:
          shifted && reason.includes('clamp_max') && reason.includes('clamp_min')
            ? 'both_clamps_used_stale_minU'
            : undefined,
      },
    });
  }
  return shifted;
}

export function alignFurnitureBBoxToSectionInnerBounds(furnitureGroup, section, skipLayout = false) {
  if (!furnitureGroup || !section?.division) return false;
  if (!skipLayout && !section._layoutComputing) {
    computeSectionLayout(section);
  }
  return _shiftFurnitureToSectionInnerBounds(furnitureGroup, section);
}

/**
 * Snap для размещения по zoneIndex из _layoutCache (реальные startU/endU),
 * а не по сетке sectionStart + i×partSize — иначе призрак в однодверной зоне,
 *  pivot    () .
 */
export function buildZoneSnapForSection(section, zoneIndex, wallNameOpt) {
  const division = section?.division;
  if (!division || zoneIndex == null || !Number.isFinite(Number(zoneIndex))) return null;
  const zi = Math.max(0, Math.floor(Number(zoneIndex)));
  const wallName = wallNameOpt || section.wallName || division.wallName || 'back';

  // Спец L = S+D, не partSize и не half double из layout.
  const specialZi = getLShapeSpecialZoneIndex(section);
  const spBounds = getLShapeSpecialSnapBounds(division);
  if (spBounds && specialZi != null && zi === specialZi) {
    const pivotCoord =
      wallName === 'left' || wallName === 'front'
        ? spBounds.zoneStart + spBounds.moduleWidth
        : spBounds.zoneStart;
    return {
      pivotCoord,
      zoneIndex: zi,
      moduleWidth: Math.round(spBounds.moduleWidth),
    };
  }

  const layout = computeSectionLayout(section);
  const seg = (layout.segments || []).find(
    (s) => s.type === 'module' && s.zoneIndex === zi
  );
  if (seg) {
    const moduleWidth = Math.max(0, seg.endU - seg.startU);
    const pivotCoord = wallName === 'left' || wallName === 'front' ? seg.endU : seg.startU;
    return { pivotCoord, zoneIndex: zi, moduleWidth };
  }
  const parts = Math.max(0, Math.floor(Number(division.parts) || 0));
  if (parts <= 0 || zi >= parts) return null;
  const partSize = Number(division.partSize) || 0;
  const sectionStart = Number(division.sectionStart) || 0;
  const extra =
    section?.id && parts > 0
      ? getSectionZoneTransitionGaps(section.id, wallName, parts)
      : null;
  let zoneStart = sectionStart + zi * partSize;
  if (extra) zoneStart += cumulativeTransitionGapMm(extra, zi);
  const moduleWidth = partSize;
  const pivotCoord =
    wallName === 'left' || wallName === 'front' ? zoneStart + moduleWidth : zoneStart;
  return { pivotCoord, zoneIndex: zi, moduleWidth };
}

export function getZonePivotWorldPosition(section, snap, wallName) {
  const pos = section.group.position;
  if (wallName === 'front' || wallName === 'back') {
    return new THREE.Vector3(snap.pivotCoord, pos.y, pos.z);
  }
  //    (left/right)    ,    1.59:
  //        ,  pivotCoord  
  //     ( Z).   =  .
  return new THREE.Vector3(pos.x, pos.y, snap.pivotCoord);
}

/**  id  (Date.now      ). */
let __cldSectionIdSeq = 0;
function nextSectionId(prefix) {
  __cldSectionIdSeq += 1;
  return `${prefix}_${Date.now()}_${__cldSectionIdSeq}`;
}

/**
 * Create a section at the specified position on a wall
 * @param {THREE.Vector3} position - World position
 * @param {string} wallName - Wall name ('front', 'back', 'left', 'right')
 * @param {{ skipAttached?: boolean, span?: object }} options - skipAttached: не создавать приставную L‑секцию
 */
export function createSectionAtPosition(position, wallName, options = {}) {
  if (!state.pendingSectionData) {
    console.error('❌     ');
    return;
  }

  const spanFromOpt = options.span || state.pendingSectionData.span || null;
  // under-window: отдельная секция с fixedHeightMm / underWindowBay (не мост).
  let width;
  let height;
  let depth;
  let pose = null;

  if (spanFromOpt && state.room) {
    const heightOverride = Number(options.heightMm);
    pose = spanToSectionPose(
      state.room,
      wallName,
      spanFromOpt,
      Number.isFinite(heightOverride) && heightOverride > 0
        ? heightOverride
        : state.pendingSectionData.height
    );
    width = pose.width;
    height = pose.height;
    depth = pose.depth;
  } else {
    ({ width, height, depth } = state.pendingSectionData);
  }
  
  // Create section directly (not through createCustomSection for full-wall sections)
  const sectionId = nextSectionId('wall_section');
  const sectionName = `Секция на стене ${wallName}`;
  
  const sectionGroup = new THREE.Group();
  sectionGroup.name = sectionName;
  sectionGroup.userData.isCustomSection = true;
  sectionGroup.userData.sectionId = sectionId;
  
  // Create geometry (section outline should be very subtle and unobtrusive).
  // :    ;   (, , )      .
  //    translate()       :   ,   .
  // back:  local X [0, width],  Y [0, height], Z [0, depth]       — пивот left-back-bottom
  // right: local X [-width, 0], Y [0, height], Z [0, depth]        — пивот front-right-bottom
  // left:  local X [0, width],  Y [0, height], Z [-depth, 0]        — пивот back-left-bottom
  // front: local X [-width, 0], Y [0, height], Z [-depth, 0]        — пивот right-back-bottom (короб влево и вглубь)
  let geometry = new THREE.BoxGeometry(width, height, depth);
  if (wallName === 'right') {
    geometry.translate(-width / 2, height / 2, depth / 2);
  } else if (wallName === 'left') {
    geometry.translate(width / 2, height / 2, -depth / 2);
  } else if (wallName === 'front') {
    geometry.translate(-width / 2, height / 2, -depth / 2);
  } else {
    geometry.translate(width / 2, height / 2, depth / 2);
  }
  const parentLocalBounds = {
    back: { x: [0, width], y: [0, height], z: [0, depth] },
    right: { x: [-width, 0], y: [0, height], z: [0, depth] },
    left: { x: [0, width], y: [0, height], z: [-depth, 0] },
    front: { x: [-width, 0], y: [0, height], z: [-depth, 0] },
  };
  if (parentLocalBounds[wallName]) {
    console.log('[SEC-AXIOM] Родитель (зелёная секция) локальные границы — дети должны быть внутри:', {
      wallName,
      localBounds: parentLocalBounds[wallName],
      size: { width, height, depth },
    });
  }

  const isSectionDebug = __sectionNicheVisualsEnabled;
  const sectionDebugColor = isSectionDebug ? __debugSectionColorHex(sectionId) : 0x00aa00;
  const lineOpacity = isSectionDebug ? 0.35 : 0.15;
  const fillOpacity = isSectionDebug ? 0.12 : 0.05;

  const edges = new THREE.EdgesGeometry(geometry);
  const lineMaterial = new THREE.LineBasicMaterial({ 
    color: sectionDebugColor,
    linewidth: 1,
    transparent: true,
    opacity: lineOpacity,
    //      depth buffer      (   ).
    depthWrite: false,
  });
  const wireframe = new THREE.LineSegments(edges, lineMaterial);
  wireframe.position.set(0, 0, 0);
  wireframe.visible = isSectionDebug;
  wireframe.userData.isSectionNicheDebugPart = true;
  wireframe.userData.debugSectionId = sectionId;
  wireframe.userData.debugPartKind = 'wire';
  sectionGroup.add(wireframe);
  
  // Very transparent fill (section should be barely visible)
  const fillMaterial = new THREE.MeshBasicMaterial({
    color: sectionDebugColor,
    transparent: true,
    opacity: fillOpacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const fillMesh = new THREE.Mesh(geometry, fillMaterial);
  fillMesh.position.set(0, 0, 0);
  fillMesh.visible = isSectionDebug;
  fillMesh.userData.isSectionNicheDebugPart = true;
  fillMesh.userData.debugSectionId = sectionId;
  fillMesh.userData.debugPartKind = 'fill';
  sectionGroup.add(fillMesh);

  const pivotMarker = new THREE.Mesh(
    new THREE.SphereGeometry(40, 8, 6),
    new THREE.MeshBasicMaterial({
      color: sectionDebugColor,
      transparent: true,
      opacity: isSectionDebug ? 0.95 : 0.8,
      depthTest: false,
    })
  );
  pivotMarker.position.set(0, 0, 0);
  pivotMarker.visible = isSectionDebug;
  pivotMarker.userData.isSectionNicheDebugPart = true;
  pivotMarker.userData.debugSectionId = sectionId;
  pivotMarker.userData.debugPartKind = 'pivot';
  pivotMarker.renderOrder = 120;
  sectionGroup.add(pivotMarker);

  // Временный sectionData для фасадной логики (offsets будут обновлены при редактировании)
  const spanAlongA = spanFromOpt
    ? Number(spanFromOpt.alongA)
    : 0;
  const spanAlongB = spanFromOpt
    ? Number(spanFromOpt.alongB)
    : wallName === 'left' || wallName === 'right'
      ? state.room.depth
      : state.room.width;

  const tempSectionData = {
    size: { x: width, y: height, z: depth },
    wallName,
    group: sectionGroup,
    spanAlongA: Number.isFinite(spanAlongA) ? spanAlongA : 0,
    spanAlongB: Number.isFinite(spanAlongB)
      ? spanAlongB
      : spanAlongA + (wallName === 'left' || wallName === 'right' ? depth : width),
    offsets: {
      leftMm: 0,
      rightMm: 0,
      frontMm: 0,
      backMm: 0,
      bottomMm: 0,
      topMm: 0,
    },
  };
  const isFixedHeightSection = Number(options.fixedHeightMm) > 0;
  if (isFixedHeightSection) {
    tempSectionData.fixedHeightMm = Math.round(Number(options.fixedHeightMm));
  }
  if (options.underWindowBay || options.windowBridgeRole === 'under-window') {
    tempSectionData.underWindowBay = true;
    if (!isFixedHeightSection) {
      // Legacy: старые сейвы без fixedHeightMm.
      tempSectionData.windowBridgeRole = 'under-window';
    }
  }
  if (options.windowBridgeRole && !tempSectionData.windowBridgeRole && !isFixedHeightSection) {
    tempSectionData.windowBridgeRole = options.windowBridgeRole;
  }
  if (options.windowBridgeGroupId && !isFixedHeightSection) {
    tempSectionData.windowBridgeGroupId = options.windowBridgeGroupId;
  }

  // Сначала ставим позицию секции: addSidePlanksIfNeeded для левой/правой стены считает
  //      ( vs ).    (0,0,0),  
  //   localZ          .
  const roomWorldPos = new THREE.Vector3();
  state.room.group.getWorldPosition(roomWorldPos);
  const gap = 2;

  let finalX = 0;
  let finalY = 0;
  let finalZ = 0;

  if (pose) {
    finalX = pose.finalX;
    finalY = pose.finalY;
    finalZ = pose.finalZ;
  } else {
    switch (wallName) {
      case 'front':
        finalX = state.room.width;
        finalY = 0;
        finalZ = state.room.depth - gap;
        break;
      case 'back':
        finalX = 0;
        finalY = 0;
        finalZ = gap;
        break;
      case 'left':
        finalX = gap;
        finalY = 0;
        finalZ = state.room.depth;
        break;
      case 'right': {
        finalX = state.room.width;
        finalY = 0;
        finalZ = 0;
        break;
      }
      default:
        finalX = position.x - roomWorldPos.x;
        finalY = position.y - roomWorldPos.y;
        finalZ = position.z - roomWorldPos.z;
        console.warn('⚠️ createSectionAtPosition: неизвестная стена, позиция взята из raycast:', wallName);
        break;
    }
  }

  if (wallName === 'front' || wallName === 'back' || wallName === 'left' || wallName === 'right') {
    sectionGroup.position.set(roomWorldPos.x + finalX, roomWorldPos.y + finalY, roomWorldPos.z + finalZ);
  } else {
    sectionGroup.position.copy(position);
  }

  //  ;         ( = sill).
  //       / (  ).
  // : /   (5  / insets  ),   sync.
  const skipEmptyWinFrame =
    isWindowAlongLayoutSection(tempSectionData) &&
    !sectionHasPlacedFurniture(tempSectionData);
  if (!skipEmptyWinFrame) {
    if (!tempSectionData.fixedHeightMm && !tempSectionData.underWindowBay) {
      addDefaultTopPlank(sectionGroup, width, height, depth, wallName, tempSectionData);
    }
    addDefaultBottomPlank(sectionGroup, width, height, depth, wallName, tempSectionData);
    addSidePlanksIfNeeded(sectionGroup, width, height, depth, wallName, null, tempSectionData);
  } else {
    removeWindowAlongEmptyFrameMeshes(sectionGroup);
  }
  //    ‑‑      
  addBackSectionCornerMarker(sectionGroup, width, height, depth, wallName, tempSectionData);
  //    ‑‑      
  addBackSectionCornerMarkerLeft(sectionGroup, width, height, depth, wallName, tempSectionData);

  //       
  const frontLeft = new THREE.Vector3(roomWorldPos.x, roomWorldPos.y, roomWorldPos.z);
  const frontRight = new THREE.Vector3(roomWorldPos.x + state.room.width, roomWorldPos.y, roomWorldPos.z);
  const backRight = new THREE.Vector3(
    roomWorldPos.x + state.room.width,
    roomWorldPos.y,
    roomWorldPos.z + state.room.depth
  );
  const backLeft = new THREE.Vector3(
    roomWorldPos.x,
    roomWorldPos.y,
    roomWorldPos.z + state.room.depth
  );

  let targetCorner = null;
  if (wallName === 'back') targetCorner = frontLeft;
  if (wallName === 'front') targetCorner = backLeft;
  if (wallName === 'right') targetCorner = frontRight;

  console.log('[SEC-CREATE] createSectionAtPosition', {
    wallName,
    raycastWorldPos: position,
    roomWorldPos,
    pendingSize: { width, height, depth },
    finalLocal: { x: finalX, y: finalY, z: finalZ },
    finalWorld: sectionGroup.position.clone(),
    cornerMatch: targetCorner
      ? {
          targetName: wallName === 'back' ? 'front-left (far)' : wallName === 'front' ? 'back-left (near)' : 'front-right (corner 2)',
          targetPos: targetCorner,
          delta: sectionGroup.position.clone().sub(targetCorner),
        }
      : null,
  });
  
  console.log('✅    :', {
    wallName: wallName,
    position: sectionGroup.position.clone(),
    width: width,
    height: height,
    depth: depth
  });
  
  // Save section data
  const spanMeta = spanFromOpt || state.pendingSectionData?.span || null;
  const sectionData = {
    id: sectionId,
    name: options.sectionName || sectionName,
    size: { x: width, y: height, z: depth },
    facadeDepthMm:
      wallName === 'left' || wallName === 'right' ? width : depth,
    topPlankHeight: TOP_PLANK_HEIGHT_MM,
    bottomPlankHeightMm: BOTTOM_PLANK_HEIGHT_MM,
    position: {
      x: sectionGroup.position.x,
      y: sectionGroup.position.y,
      z: sectionGroup.position.z
    },
    wallName: wallName,
    group: sectionGroup,
    spanAlongA: tempSectionData.spanAlongA,
    spanAlongB: tempSectionData.spanAlongB,
    offsets: {
      leftMm: 0,
      rightMm: 0,
      frontMm: 0,
      backMm: 0,
      bottomMm: 0,
      topMm: 0,
    },
    filler: makeDefaultSectionFiller(),
    endCabinets: {},
    /**      (). . getSlotVerticalMetrics / wall_hung zones. */
    wallHungFloorClearanceMm: DEFAULT_WALL_HUNG_FLOOR_CLEARANCE_MM,
    wallHungCeilingClearanceMm: DEFAULT_WALL_HUNG_CEILING_CLEARANCE_MM,
  };
  if (Number.isFinite(options.fixedHeightMm) && options.fixedHeightMm > 0) {
    sectionData.fixedHeightMm = Math.round(Number(options.fixedHeightMm));
    //          ;   .
    sectionData.topPlankHeight = 0;
  }
  // Legacy bridge flags — только если явно переданы (старый путь / сейвы).
  if (options.windowBridgeGroupId) {
    sectionData.windowBridgeGroupId = options.windowBridgeGroupId;
  }
  if (options.windowAlongWallGroupId) {
    sectionData.windowAlongWallGroupId = options.windowAlongWallGroupId;
  }
  if (options.windowAlongWallRole) {
    sectionData.windowAlongWallRole = options.windowAlongWallRole;
  }
  if (options.windowBridgeRole) {
    sectionData.windowBridgeRole = options.windowBridgeRole;
  }
  // Низкий слот у окна (как комод на прямой) — данные для applyWindowAsLowSlotLikeStraightSection.
  if (options.windowLowSlot) {
    sectionData.windowLowSlot = {
      notchAlongA: options.windowLowSlot.notchAlongA,
      notchAlongB: options.windowLowSlot.notchAlongB,
      sillMm: options.windowLowSlot.sillMm,
    };
    if (Number(options.windowLowSlot.sillMm) > 0) {
      sectionData.sillMm = Math.round(Number(options.windowLowSlot.sillMm));
    }
  }
  if (options.underWindowBay || options.windowBridgeRole === 'under-window') {
    sectionData.underWindowBay = true;
    sectionData.windowBridgeRole = 'under-window';
    sectionData.topPlankHeight = UNDER_WINDOW_TOP_THICKNESS_MM;
    if (Number.isFinite(options.sillMm) && options.sillMm > 0) {
      sectionData.sillMm = options.sillMm;
    }
  }
  
  state.customSections.push(sectionData);
  state.scene.add(sectionGroup);
  try {
    syncSectionEmptyFrameVisibility(sectionData);
  } catch (_) {}
  if (typeof window !== 'undefined') {
    window.activeSectionId = sectionId;
    if (typeof window.__clodisRefreshStep4VariantDisplay === 'function') {
      try {
        window.__clodisRefreshStep4VariantDisplay(sectionId);
      } catch (_) {}
    }
  }
  patchSectionNicheDepthWrite(state.scene);
  refreshSectionVerticalLayout(sectionData);
  if (__horizontalRoleSectionsEnabled) {
    createHorizontalRoleSections(sectionData);
  }
  //   /    .
  try {
    if (typeof window !== 'undefined' && typeof window.recalcSectionTrimPricing === 'function') {
      window.recalcSectionTrimPricing();
    }
    initStep5DefaultDecorsFromRoomConfig({ refresh: false });
    scheduleRefreshSectionTrimEdgesInRoom();
  } catch (_) {}
  
  //           
  // ,     "",  
  // /        ""  Apply.
  // У правой стены pendingSectionData: width = толщина (600), depth = длина (4000).
  // updateSectionSize ожидает newDepth = толщина в см, поэтому передаём width/10.
  // left   :   size → /   (cohabit31).
  if (wallName === 'right') {
    try {
      updateSectionSize(
        sectionData,
        {
          front: 0,
          back: 0,
          bottom: 0,
          top: 0,
        },
        width / 10 // newDepth (см) = толщина внутрь комнаты
      );
    } catch (e) {
      console.warn('⚠️ updateSectionSize failed for right wall on create:', e);
    }
  }

  // Add dimension labels (TODO: extract to dimension-labels module)
  if (typeof addSectionDimensionLabels !== 'undefined') {
    addSectionDimensionLabels(sectionId, sectionGroup, width, height, depth, wallName);
  }
  
  // Add cabinet markers and division data for zones
  addCabinetMarkers(sectionId, sectionGroup, width, height, depth, wallName);

  // Дефолт: Maatkasten-старт = первый double-ряд (счётчик 1). «−» → allSingles.
  if (sectionData.division) {
    const div = sectionData.division;
    const innerW = (Number(div.sectionEnd) - Number(div.sectionStart)) || 0;
    const divCfg = getRoomSectionDivisionCfg();
    const variants = buildSectionDivisionVariants(innerW, divCfg);
    if (variants.length > 0) {
      applySectionDivisionVariant(
        sectionId,
        defaultStripVariantInternalIndex(variants, sectionData),
        divCfg
      );
    } else {
      createSectionZones(sectionData);
    }
    if (typeof window.__clodisRefreshStep4VariantDisplay === 'function') {
      try {
        window.__clodisRefreshStep4VariantDisplay(sectionId);
      } catch (_) {}
    }
  }

  // Окно: каркас trim после division. Ячейки уже из variant/createSectionZones
  // (computeSectionLayout видит windowLowSlot). Не дублировать зоны до markers.
  if (sectionData.windowLowSlot) {
    try {
      rebuildWallTransitions(wallName);
    } catch (e) {
      console.warn('⚠️ rebuildWallTransitions after windowLowSlot failed:', e);
    }
  }
  
  console.log('✅ Пользовательская секция создана:', sectionData);

  //     "  (/)",
  //       
  //    (wallName).
  // skipAttached:    L‑.
  if (!options.skipAttached) {
    const activeLayoutKey2 =
      state.pendingLayoutKey ||
      (window.selectedRoomLayout && window.selectedRoomLayout.key) ||
      null;
    const isCornerLayoutRight2 =
      activeLayoutKey2 === 'corner-wardrobe' || activeLayoutKey2 === 'top-right';
    const jointDeps = () => {
      const roomWorldPos = new THREE.Vector3();
      if (state.room?.group) state.room.group.getWorldPosition(roomWorldPos);
      return {
        createCustomSection,
        updateSectionSize,
        updateCabinetMarkersForSection,
        createSectionZones,
        getSectionOffsetsMm,
        room: state.room,
        roomWorldPos,
      };
    };

    if (isCornerLayoutRight2) {
      try {
        createLinkedSectionFromJoint(sectionData, 'right', jointDeps());
        showTempLCornerGhostForSection(sectionData);
      } catch (e) {
          console.warn('⚠️ Не удалось создать L‑секцию (правый угол):', e);
      }
    }

    const isCornerLayoutLeft =
      activeLayoutKey2 === 'corner-wardrobe-left' || activeLayoutKey2 === 'top-left';
    if (isCornerLayoutLeft) {
      try {
        createLinkedSectionFromJoint(sectionData, 'left', jointDeps());
        showTempLCornerGhostForSection(sectionData);
      } catch (e) {
          console.warn('⚠️ Не удалось создать L‑секцию (правый угол):', e);
      }
    }

    if (isUShapeLayoutKey(activeLayoutKey2)) {
      try {
        createUShapeArmsFromJoints(sectionData, jointDeps());
      } catch (e) {
        console.warn('⚠️ Не удалось создать П‑секции (left+right):', e);
      }
    }
  }

  //        
  //   " back- ".
  enforceDebugOnlyBackStraightSectionVisibility();

  return sectionData;
}

/**
 *      L‑  .
 * primarySection — любая секция, attachedWallName — соседняя перпендикулярная стена.
 *
 *      :
 *  - задняя + правая (corner-wardrobe / top-right),
 *  - задняя + левая  (corner-wardrobe-left / top-left).
 *
 *    UI ‑    activeLayoutKey,
 *    L‑    .
 *
 * @param {Object} primarySectionData
 * @param {'front'|'back'|'left'|'right'} attachedWallName
 */
function createLinkedAttachedSection(primarySectionData, attachedWallName) {
  if (!primarySectionData || !attachedWallName || !state.room) return null;
  const primaryWall = primarySectionData.wallName || 'back';
  const hand =
    getAttachedWallForCorner(primaryWall, 'right') === attachedWallName
      ? 'right'
      : getAttachedWallForCorner(primaryWall, 'left') === attachedWallName
        ? 'left'
        : null;
  if (!hand) return null;
  const roomWorldPos = new THREE.Vector3();
  state.room.group.getWorldPosition(roomWorldPos);
  return createLinkedSectionFromJoint(primarySectionData, hand, {
    createCustomSection,
    updateSectionSize,
    updateCabinetMarkersForSection,
    createSectionZones,
    getSectionOffsetsMm,
    room: state.room,
    roomWorldPos,
  });
}

// (L‑corner) createLinkedRightSectionForBack / createLinkedLeftSectionForBack вынесены в `l-corner.js`

/**
 * Create a custom section with specified dimensions
 * @param {number} width - Width in mm
 * @param {number} height - Height in mm
 * @param {number} depth - Depth in mm
 * @param {THREE.Vector3} position - Optional position
 * @param {string} wallName - Optional wall name
 * @returns {Object} Section data
 */
export function createCustomSection(width, height, depth, position = null, wallName = null) {
  console.log('🏗️ Создание пользовательской секции:', { width, height, depth });
  
  const sectionId = nextSectionId('custom_section');
  const sectionName = `Секция ${state.customSections.length + 1}`;
  
  const sectionSize = { x: width, y: height, z: depth };
  const sizeInMm = { x: width, y: height, z: depth };
  
  // Create visual representation
  const sectionGroup = new THREE.Group();
  sectionGroup.name = sectionName;
  sectionGroup.userData.isCustomSection = true;
  sectionGroup.userData.sectionId = sectionId;
  sectionGroup.userData.sectionSize = sectionSize;
  
  // Create wireframe box
  let geometry = new THREE.BoxGeometry(sizeInMm.x, sizeInMm.y, sizeInMm.z);
  // Локальная система координат должна совпадать с createSectionAtPosition,
  //     (//)    
  //    .
  if (wallName === 'right') {
    geometry.translate(-sizeInMm.x / 2, sizeInMm.y / 2, sizeInMm.z / 2);
  } else if (wallName === 'left') {
    geometry.translate(sizeInMm.x / 2, sizeInMm.y / 2, -sizeInMm.z / 2);
  } else if (wallName === 'front') {
    geometry.translate(-sizeInMm.x / 2, sizeInMm.y / 2, -sizeInMm.z / 2);
  } else {
    // back (default)
    geometry.translate(sizeInMm.x / 2, sizeInMm.y / 2, sizeInMm.z / 2);
  }
  const edges = new THREE.EdgesGeometry(geometry);
  const lineMaterial = new THREE.LineBasicMaterial({ 
    color: 0x00aa00,
    linewidth: 1,
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
  });
  const wireframe = new THREE.LineSegments(edges, lineMaterial);
  wireframe.position.set(0, 0, 0);
  wireframe.visible = __sectionNicheVisualsEnabled;
  wireframe.userData.isSectionNicheDebugPart = true;
  wireframe.userData.debugSectionId = sectionId;
  wireframe.userData.debugPartKind = 'wire';
  sectionGroup.add(wireframe);
  
  const fillMaterial = new THREE.MeshBasicMaterial({
    color: 0x00aa00,
    transparent: true,
    opacity: 0.05,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const fillMesh = new THREE.Mesh(geometry, fillMaterial);
  fillMesh.position.set(0, 0, 0);
  fillMesh.visible = __sectionNicheVisualsEnabled;
  fillMesh.userData.isSectionNicheDebugPart = true;
  fillMesh.userData.debugSectionId = sectionId;
  fillMesh.userData.debugPartKind = 'fill';
  sectionGroup.add(fillMesh);

  const pivotMarker = new THREE.Mesh(
    new THREE.SphereGeometry(40, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0x00aa00, transparent: true, opacity: 0.8, depthTest: false })
  );
  pivotMarker.position.set(0, 0, 0);
  pivotMarker.visible = __sectionNicheVisualsEnabled;
  pivotMarker.userData.isSectionNicheDebugPart = true;
  pivotMarker.userData.debugSectionId = sectionId;
  pivotMarker.userData.debugPartKind = 'pivot';
  pivotMarker.renderOrder = 120;
  sectionGroup.add(pivotMarker);

  // Временный sectionData для фасадной логики (offsets по умолчанию = 0)
  const tempSectionData = {
    size: sectionSize,
    wallName: wallName || 'back',
    group: sectionGroup,
    offsets: {
      leftMm: 0,
      rightMm: 0,
      frontMm: 0,
      backMm: 0,
      bottomMm: 0,
      topMm: 0,
    },
  };

  //  /   (   5      insets).
  addDefaultTopPlank(sectionGroup, sizeInMm.x, sizeInMm.y, sizeInMm.z, wallName || 'back', tempSectionData);
  addDefaultBottomPlank(sectionGroup, sizeInMm.x, sizeInMm.y, sizeInMm.z, wallName || 'back', tempSectionData);
  if (wallName) {
    addSidePlanksIfNeeded(sectionGroup, sizeInMm.x, sizeInMm.y, sizeInMm.z, wallName, null, tempSectionData);
  }
  
  // Position section
  if (position && wallName) {
    // Place on wall
    const gap = 2; // 2    (  )
    const inset = 0.05;
    const roomWorldPos = new THREE.Vector3();
    if (state.room && state.room.group) {
      state.room.group.getWorldPosition(roomWorldPos);
    }
    
    const localPos = position.clone().sub(roomWorldPos);
    const extent = { x: sizeInMm.x, y: sizeInMm.y, z: sizeInMm.z };
    
    let finalX, finalZ;
    
    switch (wallName) {
      case 'front':
        finalX = THREE.MathUtils.clamp(
          localPos.x,
          inset + extent.x / 2,
          state.room.width - inset - extent.x / 2
        );
        finalZ = state.room.depth - gap;
        break;
      case 'back':
        finalX = THREE.MathUtils.clamp(
          localPos.x,
          inset + extent.x / 2,
          state.room.width - inset - extent.x / 2
        );
        finalZ = gap;
        break;
      case 'left':
        finalX = gap;
        // Угол у задней стены: пивот сзади (как sectionPivotFromSpanOffsets), не clamp в середину.
        if (Math.abs(localPos.z - state.room.depth) <= Math.max(50, extent.z * 0.25)) {
          finalZ = state.room.depth;
        } else {
          finalZ = THREE.MathUtils.clamp(
            localPos.z,
            inset + extent.z / 2,
            state.room.depth - inset - extent.z / 2
          );
        }
        break;
      case 'right':
        finalX = state.room.width - gap;
        // Угол у задней стены: пивот у стыка с задней (front-offset применит updateSectionSize).
        if (Math.abs(localPos.z - state.room.depth) <= Math.max(50, extent.z * 0.25)) {
          finalZ = state.room.depth - extent.z;
        } else {
          finalZ = state.room.depth - inset - extent.z / 2;
        }
        break;
      default:
        finalX = 0;
        finalZ = 0;
    }
    
    sectionGroup.position.set(finalX + roomWorldPos.x, 0, finalZ + roomWorldPos.z);
    console.log('📍    :', {
      wallName,
      clickWorldPos: position,
      roomWorldPos,
      localPos,
      extent,
      finalLocal: { x: finalX, z: finalZ },
      finalWorld: {
        x: finalX + roomWorldPos.x,
        y: 0 + roomWorldPos.y,
        z: finalZ + roomWorldPos.z,
      },
    });
  } else {
    // Place at center
    sectionGroup.position.set(0, 0, 0);
    console.log('📍     ');
  }
  
  // Save section data
  const wn = wallName || 'back';
  const sectionData = {
    id: sectionId,
    name: sectionName,
    size: sectionSize,
    facadeDepthMm:
      wn === 'left' || wn === 'right' ? sectionSize.x : sectionSize.z,
    topPlankHeight: TOP_PLANK_HEIGHT_MM,
    bottomPlankHeightMm: BOTTOM_PLANK_HEIGHT_MM,
    wallName: wn,
    position: {
      x: sectionGroup.position.x,
      y: sectionGroup.position.y,
      z: sectionGroup.position.z
    },
    group: sectionGroup,
    offsets: {
      leftMm: 0,
      rightMm: 0,
      frontMm: 0,
      backMm: 0,
      bottomMm: 0,
      topMm: 0,
    },
    filler: makeDefaultSectionFiller(),
    endCabinets: {},
    wallHungFloorClearanceMm: DEFAULT_WALL_HUNG_FLOOR_CLEARANCE_MM,
    wallHungCeilingClearanceMm: DEFAULT_WALL_HUNG_CEILING_CLEARANCE_MM,
  };
  
  state.customSections.push(sectionData);
  state.scene.add(sectionGroup);
  patchSectionNicheDepthWrite(state.scene);
  refreshSectionVerticalLayout(sectionData);
  
  //   /    .
  try {
    if (typeof window !== 'undefined' && typeof window.recalcSectionTrimPricing === 'function') {
      window.recalcSectionTrimPricing();
    }
    initStep5DefaultDecorsFromRoomConfig({ refresh: false });
  } catch (_) {}
  
  sectionGroup.updateMatrixWorld(true);
  
  console.log('✅ Пользовательская секция создана:', sectionData);
  console.log('📐 Всего секций:', state.customSections.length);

  try {
    if (
      typeof window !== 'undefined' &&
      window.currentRoomStep === 4 &&
      typeof window.__clodisRefreshStep4SectionEditIcons === 'function'
    ) {
      window.__clodisRefreshStep4SectionEditIcons();
    }
  } catch (_) {}

  return sectionData;
}

/**     -    ,   float */
const SECTION_BOUNDS_EPSILON_MM = 2;

/**
 * Find section that contains the given position
 * @param {THREE.Vector3} position - World position to check
 * @returns {Object|null} Section data if found, null otherwise
 */
export function findSectionAtPosition(position) {
  console.log('🔍 Поиск секции для позиции:', position);
  console.log('📐 Всего секций:', state.customSections.length);

  const hits = [];
  for (const section of state.customSections) {
    if (!section?.group || !section.size) continue;
    const sectionPos = section.group.position;
    const size = section.size;
    const wallName = section.wallName || 'back';

    const xMin =
      wallName === 'right' || wallName === 'front'
        ? sectionPos.x - size.x
        : sectionPos.x;
    const xMax =
      wallName === 'right' || wallName === 'front'
        ? sectionPos.x
        : sectionPos.x + size.x;

    //   Z      :
    // - back/right: локальный Z [0, size.z]  → мировые [sectionPos.z, sectionPos.z + size.z]
    // - front/left: локальный Z [-size.z, 0] → мировые [sectionPos.z - size.z, sectionPos.z]
    let zMin, zMax;
    if (wallName === 'front' || wallName === 'left') {
      zMin = sectionPos.z - size.z;
      zMax = sectionPos.z;
    } else {
      zMin = sectionPos.z;
      zMax = sectionPos.z + size.z;
    }

    if (
      position.x >= xMin &&
      position.x <= xMax &&
      position.y >= sectionPos.y &&
      position.y <= sectionPos.y + size.y &&
      position.z >= zMin &&
      position.z <= zMax
    ) {
      hits.push(section);
    }
  }

  if (!hits.length) {
    console.log('❌   ');
    return null;
  }

  // Несколько AABB (стык bay↔tall): берём секцию, чей spanAlong содержит точку;
  //      .   bay    tall-right  .
  const alongHint =
    hits[0].wallName === 'left' || hits[0].wallName === 'right'
      ? Number(position.z)
      : Number(position.x);
  const spanScore = (sec) => {
    const a = Number(sec.spanAlongA);
    const b = Number(sec.spanAlongB);
    if (!Number.isFinite(a) || !Number.isFinite(b) || !(b > a)) return 1e15;
    if (!(alongHint >= a - 0.5 && alongHint <= b + 0.5)) return 1e14 + (b - a);
    return b - a;
  };
  hits.sort((a, b) => {
    const ds = spanScore(a) - spanScore(b);
    if (Math.abs(ds) > 0.5) return ds;
    return (Number(a.size?.y) || 0) - (Number(b.size?.y) || 0);
  });
  console.log('✅ Позиция находится внутри секции:', hits[0].name);
  return hits[0];
}

function placeEndCabinetPlaceholder(sectionData, side) {
  const slot = getEndCabinetSlot(sectionData, side);
  if (!slot || !state.scene) return null;
  state.scene.traverse((obj) => {
    if (
      obj?.userData?.isEndCabinet &&
      obj.userData.sectionId === sectionData.id &&
      obj.userData.endCabinetSide === side &&
      obj.parent
    ) {
      obj.parent.remove(obj);
    }
  });

  //    :      (  width/depth ).
  const along = slot.alongWallMm || slot.widthMm;
  const into = slot.intoRoomMm || slot.depthMm;
  const h = slot.heightMm;
  const geom = new THREE.BoxGeometry(along, h, into);
  if (slot.wallName === 'back') {
    geom.translate(along / 2, h / 2, into / 2);
  } else if (slot.wallName === 'front') {
    geom.translate(-along / 2, h / 2, -into / 2);
  } else if (slot.wallName === 'left') {
    geom.translate(into / 2, h / 2, -along / 2);
  } else if (slot.wallName === 'right') {
    geom.translate(-into / 2, h / 2, along / 2);
  }
  const mat = new THREE.MeshStandardMaterial({
    color: 0xb8c5ce,
    metalness: 0.05,
    roughness: 0.85,
    transparent: true,
    opacity: 0.55,
  });
  const mesh = new THREE.Mesh(geom, mat);
  const group = new THREE.Group();
  group.name = `EndCabinetSlot_${side}`;
  group.add(mesh);
  //       ;    rotationY  .
  group.position.copy(slot.position);
  group.rotation.y = 0;
  const rule = getEndCabinetRule();
  const entry = sectionData.endCabinets?.[side] || {};
  group.userData.isFurniture = true;
  group.userData.isEndCabinet = true;
  group.userData.isEndCabinetSlot = true;
  group.userData.endCabinetSide = side;
  group.userData.sectionId = sectionData.id;
  group.userData.catalogType = entry.catalogType || rule.catalogType || '';
  group.userData.catalogName = (rule.label || 'Торцевой шкаф') + ' (слот)';
  group.userData.__cldSkipSectionAutoRescale = true;
  group.userData.__endCabinetSectionSizeMm = { ...slot.sectionSize };
  group.userData.priceRubTotal = 0;
  state.scene.add(group);
  if (sectionData.endCabinets?.[side]) {
    sectionData.endCabinets[side].furnitureUuid = group.uuid;
    sectionData.endCabinets[side].pendingPlace = true;
  }
  return group;
}

/**
 *  :       .
 * Как при создании обычной прямой секции — defaultStripVariantInternalIndex
 * ( 1:      0  .),    2.
 */
function refreshSectionZonesAfterEndCabinet(sectionData) {
  if (!sectionData?.division || !sectionData.id) return;
  try {
    if (sectionData.division.customZoneWidthsMm) {
      delete sectionData.division.customZoneWidthsMm;
    }
    sectionData._relayoutZonesFromPosition = true;
    sectionData._sectionGeomRelayoutPending = true;
    computeSectionLayout(sectionData);
    const innerW =
      Number(sectionData._layoutCache?.innerWidthMm) ||
      Math.max(
        0,
        (Number(sectionData.division.sectionEnd) || 0) -
          (Number(sectionData.division.sectionStart) || 0)
      );
    const cfg = getRoomSectionDivisionCfg();
    const variants = buildSectionDivisionVariants(innerW, cfg);
    if (!variants.length) {
      createSectionZones(sectionData);
      delete sectionData._relayoutZonesFromPosition;
      delete sectionData._sectionGeomRelayoutPending;
      updateCabinetMarkersForSection(sectionData.id);
      return;
    }

    const idx = defaultStripVariantInternalIndex(variants, sectionData);
    console.warn('[END-CAB] refresh zones like straight section', {
      sectionId: sectionData.id,
      innerW: Math.round(innerW),
      chosenIdx: idx,
      chosenKind: variants[idx]?.kind,
      chosenParts: variants[idx]?.parts,
      label: variants[idx]?.label,
    });

    applySectionDivisionVariant(sectionData.id, idx, cfg);
    delete sectionData._relayoutZonesFromPosition;
    delete sectionData._sectionGeomRelayoutPending;
    updateCabinetMarkersForSection(sectionData.id);
  } catch (e) {
    console.warn('[END-CAB] refresh zones failed', e);
  }
}

/** Текущий вариант деления в терминах buildSectionDivisionVariants. */
function snapshotSectionDivisionVariant(sectionData) {
  const div = sectionData?.division;
  if (!div) return null;
  const kind =
    div.layoutKind === 'allSingles'
      ? 'allSingles'
      : div.layoutKind === 'mixedLeftSingle'
        ? 'mixedLeftSingle'
        : 'equal';
  return {
    kind,
    stripCountN: Number(div.stripCountN) || 0,
    parts: Math.max(1, Math.round(Number(div.parts) || 1)),
  };
}

/**
 *    ( )    
 *    ,    :  
 * buildSectionDivisionVariants. Прежний вариант сохраняем, если он ещё
 * допустим для новой ширины, иначе — дефолтный (defaultStripVariantInternalIndex).
 */
function reapplySectionDivisionAfterWidthChange(sectionData, prevVariant) {
  if (!sectionData?.division || !sectionData.id) return;
  try {
    sectionData._relayoutZonesFromPosition = true;
    sectionData._sectionGeomRelayoutPending = true;
    computeSectionLayout(sectionData);
    const innerW =
      Number(sectionData._layoutCache?.innerWidthMm) ||
      Math.max(
        0,
        (Number(sectionData.division.sectionEnd) || 0) -
          (Number(sectionData.division.sectionStart) || 0)
      );
    const cfg = getRoomSectionDivisionCfg();
    const variants = buildSectionDivisionVariants(innerW, cfg);
    delete sectionData._relayoutZonesFromPosition;
    delete sectionData._sectionGeomRelayoutPending;
    if (!variants.length) {
      createSectionZones(sectionData);
      updateCabinetMarkersForSection(sectionData.id);
      return;
    }

    let idx = -1;
    if (prevVariant) {
      idx = variants.findIndex((v) => {
        if (v.kind !== prevVariant.kind) return false;
        if (v.kind === 'allSingles') return true;
        return Number(v.stripCountN) === Number(prevVariant.stripCountN);
      });
    }
    const kept = idx >= 0;
    if (!kept) idx = defaultStripVariantInternalIndex(variants, sectionData);

    console.warn('[END-CAB] recalc row division after depth change', {
      sectionId: sectionData.id,
      innerW: Math.round(innerW),
      prevVariant,
      keptPrev: kept,
      chosenIdx: idx,
      chosenKind: variants[idx]?.kind,
      label: variants[idx]?.label,
    });

    applySectionDivisionVariant(sectionData.id, idx, cfg);
    updateCabinetMarkersForSection(sectionData.id);
    try {
      if (typeof window.__clodisRefreshStep4VariantDisplay === 'function') {
        window.__clodisRefreshStep4VariantDisplay(sectionData.id);
      }
    } catch (_) {}
  } catch (e) {
    console.warn('[END-CAB] recalc row division failed', e);
  }
}

function syncEndCabinetsAfterSectionUpdate(sectionData) {
  if (!sectionData?.endCabinets || !state.scene) return;
  for (const side of Object.keys(sectionData.endCabinets)) {
    if (!isEndCabinetActive(sectionData, side)) continue;
    const slot = getEndCabinetSlot(sectionData, side);
    if (!slot) continue;
    const grp = findEndCabinetFurnitureGroup(sectionData, side);
    if (!grp) continue;

    if (grp.userData.isEndCabinetSlot) {
      placeEndCabinetPlaceholder(sectionData, side);
      continue;
    }

    //    (  /  )  ,
    //  group.scale:        .
    const prev = grp.userData.__endCabinetSectionSizeMm || grp.userData.__initialSectionSizeMm;
    const target = slot.sectionSize;
    const sizeChanged =
      !prev ||
      !target ||
      Math.abs((Number(prev.x) || 0) - (Number(target.x) || 0)) > 1 ||
      Math.abs((Number(prev.y) || 0) - (Number(target.y) || 0)) > 1 ||
      Math.abs((Number(prev.z) || 0) - (Number(target.z) || 0)) > 1 ||
      Math.abs(
        (Number(grp.userData.__endCabinetSlotHeightMm) || 0) - (Number(slot.heightMm) || 0)
      ) > 1;
    if (sizeChanged) {
      if (!rebuildEndCabinetForSectionSlot(sectionData, side)) {
        fitEndCabinetGroupToSlot(grp, slot);
      }
    } else {
      fitEndCabinetGroupToSlot(grp, slot);
    }
  }
}

function findPlacedEndCabinetGroup(sectionData, side) {
  const grp = findEndCabinetFurnitureGroup(sectionData, side);
  if (!grp || grp.userData?.isEndCabinetSlot) return null;
  return grp;
}

/**     ,    .      . */
function isFacadeHandleObject(obj) {
  let p = obj;
  for (let i = 0; i < 16 && p; i++) {
    if (p.userData?.isFacadeHandle === true || p.name === '__cld_facade_handle') return true;
    p = p.parent;
  }
  return false;
}

/**
 *   :  , AO     .
 *           ,     
 *          .
 */
function measureEndCabinetGroupBBox(group) {
  return withFurnitureDoorSwingsClosedForMeasure(group, () => {
    const out = new THREE.Box3();
    let has = false;
    group.updateMatrixWorld(true);
    group.traverse((obj) => {
      if (shouldExcludeMeshFromFurnitureBBox(obj)) return;
      if (isFacadeHandleObject(obj)) return;
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

/**
 *       :  bbox  rotation.y = 0
 * (x — вглубь комнаты, z — вдоль стены), scale под слот, ±90°, snap в пятно.
 * ,      sectionSize:     
 *     ,  pivot-    .
 */
function fitEndCabinetGroupToSlot(grp, slot) {
  if (!grp || !slot?.sectionSize) return;
  const target = slot.sectionSize;
  grp.position.copy(slot.position);
  grp.rotation.y = 0;
  grp.updateMatrixWorld(true);

  const targetBBoxY = Number(slot.heightMm) > 1 ? Number(slot.heightMm) : Number(target.y);
  try {
    const size = measureEndCabinetGroupBBox(grp).getSize(new THREE.Vector3());
    if (size.x > 1 && size.y > 1 && size.z > 1) {
      const sx = Number(target.x) / size.x;
      const sy = targetBBoxY / size.y;
      const sz = Number(target.z) / size.z;
      if ([sx, sy, sz].every((v) => Number.isFinite(v) && v > 0)) {
        grp.scale.set(grp.scale.x * sx, grp.scale.y * sy, grp.scale.z * sz);
        grp.updateMatrixWorld(true);
      }
    }
  } catch (e) {
    console.warn('[END-CAB] measure before fit failed', e);
  }

  grp.userData.__endCabinetSectionSizeMm = { ...target };
  grp.userData.__initialSectionSizeMm = { ...target };
  grp.userData.__endCabinetSlotHeightMm = targetBBoxY;
  grp.rotation.y = slot.rotationY;
  try {
    grp.userData.rotation = slot.rotationY;
  } catch (_) {}
  grp.updateMatrixWorld(true);
  snapEndCabinetGroupToSlot(
    grp,
    slot,
    measureEndCabinetGroupBBox,
    getFurnitureFloorContactWorldYNoAo
  );
  logEndCabinetFitMismatch(grp, slot);
}

/**     :       ,  . */
function logEndCabinetFitMismatch(grp, slot) {
  try {
    const bb = measureEndCabinetGroupBBox(grp);
    if (!bb || bb.isEmpty?.()) return;
    const fp = slot.footprint;
    const d = {
      minX: Math.round(bb.min.x - fp.min.x),
      maxX: Math.round(bb.max.x - fp.max.x),
      minZ: Math.round(bb.min.z - fp.min.z),
      maxZ: Math.round(bb.max.z - fp.max.z),
    };
    if (Object.values(d).every((v) => Math.abs(v) <= 1)) return;
    const plank = slot.wallPlank
      ? {
          minX: Math.round(slot.wallPlank.center.x - slot.wallPlank.size.x / 2),
          maxX: Math.round(slot.wallPlank.center.x + slot.wallPlank.size.x / 2),
          minZ: Math.round(slot.wallPlank.center.z - slot.wallPlank.size.z / 2),
          maxZ: Math.round(slot.wallPlank.center.z + slot.wallPlank.size.z / 2),
        }
      : null;
    console.warn('[END-CAB-FIT] модуль не совпал с пятном слота, мм', {
      side: slot.side,
      wall: slot.wallName,
      deltaFaces: d,
      slotMm: {
        alongWall: Math.round(slot.alongWallMm),
        intoRoom: Math.round(slot.intoRoomMm),
        fullIntoRoom: Math.round(slot.fullIntoRoomMm),
        facadeThickness: Math.round(slot.facadeThicknessMm),
        wallPlank: Math.round(slot.wallPlankWidthMm),
      },
      moduleMm: {
        x: Math.round(bb.max.x - bb.min.x),
        z: Math.round(bb.max.z - bb.min.z),
      },
      footprintMm: {
        minX: Math.round(fp.min.x),
        maxX: Math.round(fp.max.x),
        minZ: Math.round(fp.min.z),
        maxZ: Math.round(fp.max.z),
      },
      wallPlankMm: plank,
    });
  } catch (_) {}
}

/**
 * После Apply: диалоги торцевого (v1 — только прямая front/back).
 *  (offset)  .   → widthMm  .
 * intoRoom =  .  =  −  − .
 */
async function runEndCabinetApplyDialogs(sectionData, offsetsCm, depthCmIn) {
  const acceptedSides = [];
  const candidates = collectEndCabinetDialogCandidates(sectionData, offsetsCm);
  const rule = getEndCabinetRule();
  //    ( ), .
  const defaultEndDepthCm = 60;

  for (const c of candidates) {
    const yes = await promptEndCabinetYesNo({
      side: c.side,
      gapMm: c.gapMm,
      label: rule.label,
    });
    if (!yes) continue;

    const endDepthCm = await promptEndCabinetDepthCm(defaultEndDepthCm);
    if (endDepthCm == null) continue;

    const alongWallMm = Math.round(Number(endDepthCm) * 10);
    if (!(alongWallMm >= 100)) continue;

    const sectionDepthMm = Math.round(
      (Number.isFinite(Number(depthCmIn)) && Number(depthCmIn) > 0 ? Number(depthCmIn) : 60) * 10
    );

    // offsetsCm[c.side]     .
    setEndCabinetMode(sectionData, c.side, {
      widthMm: alongWallMm,
      savedGapMm: c.gapMm,
      intoRoomMm: sectionDepthMm,
      catalogType: rule.catalogType,
      catalogCategoryId: rule.catalogCategoryId,
      pendingPlace: true,
    });
    acceptedSides.push(c.side);
  }

  return { depthCm: depthCmIn, acceptedSides, offsetsCm };
}

/**
 * Presentation-only: Clodis field labels/units for edit-section form.
 * Does not change input ids, values, or handlers.
 */
function decorateEditSectionFormPresentation(root) {
  if (!root) return;
  root.querySelectorAll('label').forEach((label) => {
    label.classList.add('cld-edit-section-label');
    const text = String(label.textContent || '')
      .replace(/\s*\(см\)\s*:?\s*$/i, '')
      .replace(/:\s*$/, '')
      .trim();
    label.textContent = text;
    label.removeAttribute('style');
  });
  root.querySelectorAll('input[type="number"]').forEach((input) => {
    input.classList.add('cld-edit-section-input');
    const parent = input.parentElement;
    const parentHidden =
      parent &&
      (parent.style.display === 'none' ||
        /display:\s*none/i.test(parent.getAttribute('style') || ''));
    if (parentHidden) return;
    if (parent && parent.classList.contains('cld-edit-section-input-wrap')) return;
    const wrap = document.createElement('div');
    wrap.className = 'cld-edit-section-input-wrap';
    input.removeAttribute('style');
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    const unit = document.createElement('span');
    unit.className = 'cld-edit-section-unit';
    unit.textContent = '';
    unit.setAttribute('aria-hidden', 'true');
    wrap.appendChild(unit);
  });
  Array.from(root.children).forEach((row) => {
    if (!(row instanceof HTMLElement)) return;
    if (row.style.display === 'none') return;
    row.classList.add('cld-edit-section-field');
  });
}

/**
 *     ↔   :    .
 *    far     (   base).
 */
function bindFarWallOffsetSync(root) {
  const farEl = root?.querySelector?.('#section-offset-far-wall');
  if (!farEl) return;
  const doorId = farEl.getAttribute('data-door-input');
  const baseMm = Number(farEl.getAttribute('data-base-mm'));
  const doorEl = doorId ? document.getElementById(doorId) : null;
  if (!doorEl || !Number.isFinite(baseMm)) return;

  const baseCm = baseMm / 10;
  const roundTenth = (n) => Math.round(n * 10) / 10;
  let lock = false;

  farEl.min = '0';

  const syncFromDoor = () => {
    if (lock) return;
    //   far,    .
    if (document.activeElement === farEl) return;
    lock = true;
    const doorCm = Math.max(0, parseFloat(doorEl.value) || 0);
    farEl.value = String(roundTenth(baseCm + doorCm));
    lock = false;
  };

  const applyFarToDoor = (commit) => {
    if (lock) return;
    const raw = String(farEl.value || '').trim().replace(',', '.');
    if (!commit && (raw === '' || raw === '-' || /\.$/.test(raw))) return;
    const farParsed = parseFloat(raw);
    if (!Number.isFinite(farParsed)) {
      if (commit) {
        lock = true;
        farEl.value = String(roundTenth(baseCm));
        doorEl.value = '0';
        lock = false;
        doorEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return;
    }
    lock = true;
    const doorCm = roundTenth(Math.max(0, farParsed - baseCm));
    doorEl.value = String(doorCm);
    if (commit) {
      farEl.value = String(roundTenth(baseCm + doorCm));
    }
    lock = false;
    doorEl.dispatchEvent(new Event('input', { bubbles: true }));
  };

  farEl.addEventListener('input', () => applyFarToDoor(false));
  farEl.addEventListener('change', () => applyFarToDoor(true));
  farEl.addEventListener('blur', () => applyFarToDoor(true));
  doorEl.addEventListener('input', syncFromDoor);
  doorEl.addEventListener('change', syncFromDoor);
}

/**
 *          4 (,  ).
 */
function showSectionSizeLimitModal(text, onClose) {
  const msg = String(text || '').trim();
  if (!msg) return;
  let overlay = document.getElementById('section-limit-modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'section-limit-modal-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(0,0,0,0.25)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '30000',
    });
    const box = document.createElement('div');
    box.id = 'section-limit-modal-box';
    Object.assign(box.style, {
      background: '#fff',
      borderRadius: '12px',
      padding: '24px 28px',
      maxWidth: '480px',
      width: '90%',
      boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
      fontFamily: 'inherit',
    });
    const textEl = document.createElement('div');
    textEl.id = 'section-limit-modal-text';
    textEl.style.fontSize = '14px';
    textEl.style.color = '#333';
    textEl.style.lineHeight = '1.5';
    textEl.style.marginBottom = '20px';
    textEl.style.whiteSpace = 'pre-line';
    box.appendChild(textEl);
    const btn = document.createElement('button');
    btn.id = 'section-limit-modal-ok';
    btn.type = 'button';
    btn.textContent = ',  ';
    Object.assign(btn.style, {
      borderRadius: '999px',
      border: 'none',
      background: '#1976d2',
      color: '#fff',
      fontSize: '14px',
      fontWeight: '600',
      padding: '8px 22px',
      cursor: 'pointer',
    });
    btn.addEventListener('click', () => {
      overlay.style.display = 'none';
      const cb = overlay._onClose;
      overlay._onClose = null;
      if (typeof cb === 'function') cb();
    });
    box.appendChild(btn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }
  const textEl = document.getElementById('section-limit-modal-text');
  if (textEl) textEl.textContent = msg;
  overlay._onClose = onClose || null;
  overlay.style.display = 'flex';
}

function fmtCmHint(mm) {
  const n = Math.round(Number(mm) || 0) / 10;
  return String(Math.round(n * 10) / 10).replace('.', ',');
}

/** Размеры секции при заданных отступах (как в updateSectionSize), без применения. */
function previewSectionSizeMm(sectionData, offsetsCm, newDepthCm) {
  const wallName = sectionData?.wallName || 'back';
  const o = offsetsCm || {};
  const depthMm = (Number(newDepthCm) || 0) * 10;
  let widthMm = 0;
  let heightMm = 0;
  if (wallName === 'front' || wallName === 'back') {
    const endCabL = getEndCabinetReserveMm(sectionData, 'left');
    const endCabR = getEndCabinetReserveMm(sectionData, 'right');
    const baseAlong = sectionAlongBaseMm(sectionData, state.room);
    widthMm =
      baseAlong -
      (Number(o.left) || 0) * 10 -
      (Number(o.right) || 0) * 10 -
      endCabL -
      endCabR;
    heightMm =
      state.room.height -
      (Number(o.bottom) || 0) * 10 -
      (Number(o.top) || 0) * 10;
  } else {
    const endCabF = getEndCabinetReserveMm(sectionData, 'front');
    const endCabB = getEndCabinetReserveMm(sectionData, 'back');
    const baseAlong = sectionAlongBaseMm(sectionData, state.room);
    widthMm =
      baseAlong -
      (Number(o.front) || 0) * 10 -
      (Number(o.back) || 0) * 10 -
      endCabF -
      endCabB;
    heightMm =
      state.room.height -
      (Number(o.bottom) || 0) * 10 -
      (Number(o.top) || 0) * 10;
  }
  return { widthMm, heightMm, depthMm };
}

/**
 *    Apply.
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
function assessSectionOffsetsForApply(sectionData, offsetsCm, newDepthCm) {
  const size = previewSectionSizeMm(sectionData, offsetsCm, newDepthCm);
  const div = getRoomSectionDivisionCfg();
  const minAlong = div.singleMinMm > 0 ? div.singleMinMm : 300;
  const wallName = sectionData?.wallName || 'back';
  const hasOpening = !!(
    getSectionOffsetFieldLabels(
      sectionData,
      state.room,
      Array.isArray(state.roomEditOpenings) ? state.roomEditOpenings : []
    ).hasOpeningEnds
  );

  if (size.depthMm <= 0) {
    return {
      ok: false,
      message:
        '     0 .\n    .',
    };
  }
  if (size.heightMm <= 0) {
    return {
      ok: false,
      message:
        '   0  .\n     .',
    };
  }
  if (size.widthMm <= 0) {
    const sideHint = hasOpening
      ? '    /          .'
      : wallName === 'left' || wallName === 'right'
        ? '    .'
        : '     .';
    return {
      ok: false,
      message: `Так нельзя: ширина секции получается 0 или меньше.\n${sideHint}`,
    };
  }
  if (size.widthMm < minAlong) {
    const sideHint = hasOpening
      ? '    (    )         ,   .'
      : wallName === 'left' || wallName === 'right'
        ? '        ,   .'
        : '         ,   .';
    return {
      ok: false,
      message:
        `Ширина секции получится ${fmtCmHint(size.widthMm)} см — меньше минимума ${fmtCmHint(minAlong)} см.\n` +
        sideHint,
    };
  }
  return { ok: true };
}

  const EDIT_SECTION_INPUT_IDS = [
  'section-offset-left',
  'section-offset-right',
  'section-offset-front',
  'section-offset-back',
  'section-offset-bottom',
  'section-offset-top',
  'section-offset-far-wall',
  'section-depth',
  'section-wall-hung-clearance',
];

function snapshotEditSectionInputs() {
  const out = {};
  EDIT_SECTION_INPUT_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) out[id] = el.value;
  });
  return out;
}

function restoreEditSectionInputs(snap) {
  if (!snap) return;
  Object.keys(snap).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = snap[id];
  });
}

/**
 *   L/R/Top ():  inner → layout/zones +  .
 *    ; offsets (  )  .
 */
export function applySectionFillers(sectionData, leftMm, rightMm, topMm) {
  if (!sectionData?.group) return false;
  ensureSectionFillerDefaults(sectionData);
  //   L/R:      inner     N,   .
  const prevDivisionVariant = snapshotSectionDivisionVariant(sectionData);
  applySectionFillerUiMm(sectionData, leftMm, rightMm, topMm);

  const g = sectionData.group;
  try {
    //  :     50 ,  ensure    .
    removeCeilingTopPlankMeshes(g, { includeSegments: true });
  } catch (_) {}
  try {
    removeSectionSideTrimMeshes(g);
  } catch (_) {}

  try {
    ensureStraightFrameMeshes(sectionData);
  } catch (e) {
    console.warn('[filler] ensureStraightFrameMeshes', e);
  }

  // L/R  inner →   ,    :  +  + .
  try {
    if (sectionData.division) {
      reapplySectionDivisionAfterWidthChange(sectionData, prevDivisionVariant);
    }
  } catch (e) {
    console.warn('[filler] reapplySectionDivisionAfterWidthChange', e);
    sectionData._sectionGeomRelayoutPending = true;
    try {
      if (sectionData.division) computeSectionLayout(sectionData);
    } catch (e2) {
      console.warn('[filler] computeSectionLayout', e2);
    }
  }
  try {
    refreshSectionVerticalLayout(sectionData);
  } catch (_) {}
  //      ( =  −  − ).
  // :  skip-rescale  ,      50  .
  try {
    const groups = [];
    state.scene?.traverse((obj) => {
      if (obj?.userData?.isFurniture && obj.userData.sectionId === sectionData.id) {
        if (obj.userData.isEndCabinet) return;
        groups.push(obj);
      }
    });
    for (const g of groups) {
      if (g.userData) g.userData.__cldFillerHeightResync = true;
    }
    updateFurnitureInSection(sectionData);
    for (const g of groups) {
      if (g.userData) delete g.userData.__cldFillerHeightResync;
    }
  } catch (e) {
    console.warn('[filler] updateFurnitureInSection', e);
  }
  // Split/transitions      50 .
  try {
    const wall = sectionData.wallName || 'back';
    rebuildTransitionsForWall(wall);
  } catch (e) {
    console.warn('[filler] rebuildTransitionsForWall', e);
  }
  try {
    if (sectionData.id) updateCabinetMarkersForSection(sectionData.id);
  } catch (_) {}
  try {
    if (typeof window !== 'undefined' && typeof window.recalcSectionTrimPricing === 'function') {
      window.recalcSectionTrimPricing();
    }
  } catch (_) {}
  try {
    if (typeof window.updateSectionDimensionLabels === 'function') {
      window.updateSectionDimensionLabels();
    }
  } catch (_) {}
  try {
    if (sectionData.id && typeof window.__clodisRefreshStep4VariantDisplay === 'function') {
      window.__clodisRefreshStep4VariantDisplay(sectionData.id);
    }
  } catch (_) {}

  console.log('[filler] applied', {
    sectionId: sectionData.id,
    filler: getSectionFillerUiMm(sectionData),
    inner: computeSectionInnerBoundsU(sectionData),
  });
  return true;
}

/**
 *   (Maatkasten):     (4.1).
 *  > 5  →  16      .
 * @param {Object} sectionData
 * @param {{ focus?: 'left'|'right'|'top' }} [opts]
 */
export function showSectionFillerModal(sectionData, opts = {}) {
  if (!sectionData || !sectionData.group) {
    console.error('❌    (filler)');
    return;
  }

  const modal = document.getElementById('section-filler-modal');
  const content = document.getElementById('section-filler-content');
  if (!modal || !content) {
    console.error('❌     ');
    return;
  }

  window.editingFillerSection = sectionData;
  ensureSectionFillerDefaults(sectionData);
  const ui = getSectionFillerUiMm(sectionData);
  const toCm = (mm) => (Number(mm) / 10).toFixed(1).replace(/\.0$/, '');

  const editable = getSectionFillerEditableFields(sectionData);
  try {
    const open = getSectionSpanOpenEnds(sectionData, state.room);
    if (open?.openMin) editable.left = false;
    if (open?.openMax) editable.right = false;
  } catch (_) {}
  if (!sectionShouldHaveCeilingTopPlank(sectionData)) {
    editable.top = false;
  }

  const focus = String(opts.focus || '').toLowerCase();
  const fields = [];
  if (editable.left) {
    fields.push(`
    <div class="cld-edit-section-field">
      <label class="cld-edit-section-label" for="filler-left-cm"> </label>
      <div class="cld-edit-section-input-wrap">
        <input type="number" id="filler-left-cm" class="cld-edit-section-input" value="${toCm(ui.leftMm)}" min="${FILLER_SIDE_MIN_MM / 10}" max="${FILLER_SIDE_MAX_MM / 10}" step="0.1">
        <span class="cld-edit-section-unit"></span>
      </div>
    </div>`);
  }
  if (editable.right) {
    fields.push(`
    <div class="cld-edit-section-field">
      <label class="cld-edit-section-label" for="filler-right-cm"> </label>
      <div class="cld-edit-section-input-wrap">
        <input type="number" id="filler-right-cm" class="cld-edit-section-input" value="${toCm(ui.rightMm)}" min="${FILLER_SIDE_MIN_MM / 10}" max="${FILLER_SIDE_MAX_MM / 10}" step="0.1">
        <span class="cld-edit-section-unit"></span>
      </div>
    </div>`);
  }
  if (editable.top) {
    fields.push(`
    <div class="cld-edit-section-field">
      <label class="cld-edit-section-label" for="filler-top-cm"> </label>
      <div class="cld-edit-section-input-wrap">
        <input type="number" id="filler-top-cm" class="cld-edit-section-input" value="${toCm(ui.topMm)}" min="${FILLER_TOP_MIN_MM / 10}" max="${FILLER_TOP_MAX_MM / 10}" step="0.1">
        <span class="cld-edit-section-unit"></span>
      </div>
    </div>`);
  }

  const overlayHints = [];
  if (!editable.left && editable.minKind === 'overlay') {
    overlayHints.push('  &gt; 5&nbsp;   16&nbsp;,   .');
  }
  if (!editable.right && editable.maxKind === 'overlay') {
    overlayHints.push('  &gt; 5&nbsp;   16&nbsp;,   .');
  }

  content.innerHTML = `
    <p class="cld-filler-hint">    ( ≤ 5&nbsp;).            .</p>
    ${overlayHints.map((h) => `<p class="cld-filler-hint">${h}</p>`).join('')}
    ${
      fields.length
        ? fields.join('')
        : '<p class="cld-filler-hint">      .</p>'
    }
  `;

  modal.style.display = 'block';
  //   (Maatkasten): slide  /
  requestAnimationFrame(() => {
    modal.classList.add('is-open');
  });

  const focusId =
    focus === 'right' && editable.right
      ? 'filler-right-cm'
      : focus === 'top' && editable.top
        ? 'filler-top-cm'
        : editable.left
          ? 'filler-left-cm'
          : editable.right
            ? 'filler-right-cm'
            : editable.top
              ? 'filler-top-cm'
              : null;
  try {
    if (focusId) {
      const el = document.getElementById(focusId);
      if (el && !el.disabled) {
        el.focus();
        el.select?.();
      }
    }
  } catch (_) {}

  const closeFiller = () => {
    modal.classList.remove('is-open');
    const onEnd = (e) => {
      if (e.target !== modal) return;
      if (e.propertyName && e.propertyName !== 'transform') return;
      modal.style.display = 'none';
      modal.removeEventListener('transitionend', onEnd);
    };
    modal.addEventListener('transitionend', onEnd);
    window.editingFillerSection = null;
    try {
      if (typeof window.__cldSyncRoomEditFillerButtons === 'function') {
        window.__cldSyncRoomEditFillerButtons();
      }
    } catch (_) {}
  };

  const applyBtn = document.getElementById('section-filler-apply-btn');
  const cancelBtn = document.getElementById('section-filler-cancel-btn');
  const backBtn = document.getElementById('section-filler-back-btn');

  if (applyBtn) {
    const newApply = applyBtn.cloneNode(true);
    applyBtn.parentNode.replaceChild(newApply, applyBtn);
    newApply.disabled = fields.length === 0;
    newApply.addEventListener('click', () => {
      const sec = window.editingFillerSection;
      if (!sec) return;
      const cur = getSectionFillerUiMm(sec);
      const readCm = (id, fallbackMm) => {
        const el = document.getElementById(id);
        if (!el) return fallbackMm / 10;
        const v = parseFloat(el.value);
        return Number.isFinite(v) ? v : fallbackMm / 10;
      };
      const leftMm = Math.round(readCm('filler-left-cm', cur.leftMm) * 10);
      const rightMm = Math.round(readCm('filler-right-cm', cur.rightMm) * 10);
      const topMm = Math.round(readCm('filler-top-cm', cur.topMm) * 10);
      applySectionFillers(sec, leftMm, rightMm, topMm);
      closeFiller();
    });
  }

  if (cancelBtn) {
    const newCancel = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
    newCancel.addEventListener('click', closeFiller);
  }

  if (backBtn) {
    const newBack = backBtn.cloneNode(true);
    backBtn.parentNode.replaceChild(newBack, backBtn);
    newBack.addEventListener('click', closeFiller);
  }
}

/** Active visual on section settings button while edit-section modal is open. */
function syncStep4SectionEditActiveState() {
  const modal = document.getElementById('edit-section-modal');
  const open = !!(modal && modal.style.display !== 'none' && modal.style.display !== '');
  const editingId =
    window.editingSection && window.editingSection.id != null
      ? String(window.editingSection.id)
      : '';
  (window.step4SectionEditIcons || []).forEach((icon) => {
    if (!icon || !icon.classList || !icon.classList.contains('step4-section-edit-icon')) return;
    const sid =
      icon._step4SectionData && icon._step4SectionData.id != null
        ? String(icon._step4SectionData.id)
        : '';
    icon.classList.toggle('is-active', open && !!editingId && sid === editingId);
  });
}

/**
 * Show modal for editing section properties
 * @param {Object} sectionData - Section data to edit
 */
export function showEditSectionModal(sectionData) {
  if (!sectionData || !sectionData.group) {
    console.error('❌   ');
    return;
  }

  const modal = document.getElementById('edit-section-modal');
  const content = document.getElementById('edit-section-content');

  if (!modal || !content) {
    console.error('❌    ');
    return;
  }

  //      (   legacy )
  window.editingSection = sectionData;
  try {
    if (typeof window.clearModuleEditFocusFog === 'function') {
      window.clearModuleEditFocusFog();
    }
  } catch (_) {}

  //        (//  ).
  //      lShape        .
  window.showSectionDimensionLabels = true;

  const wallName = sectionData.wallName || 'back';
  const currentSize = sectionData.size;
  const roomWorldPos = new THREE.Vector3();
  state.room.group.getWorldPosition(roomWorldPos);
  const sectionPos = sectionData.group.position.clone();
  const localPos = sectionPos.clone().sub(roomWorldPos);

  //   :   (),    .
  const currentOffsets = {};
  const storedOffsetsMm = sectionData.offsets || {};
  const hasLogicalLR =
    typeof storedOffsetsMm.leftMm === 'number' ||
    typeof storedOffsetsMm.rightMm === 'number';
  const hasLogicalFB =
    typeof storedOffsetsMm.frontMm === 'number' ||
    typeof storedOffsetsMm.backMm === 'number';
  const alongFromWorld = computeSectionAlongOffsetsCmFromWorld(sectionData);

  switch (wallName) {
    case 'front':
    case 'back':
      if (hasLogicalLR) {
        currentOffsets.left = (storedOffsetsMm.leftMm || 0) / 10;
        currentOffsets.right = (storedOffsetsMm.rightMm || 0) / 10;
      } else {
        currentOffsets.left = alongFromWorld.left;
        currentOffsets.right = alongFromWorld.right;
      }
      currentOffsets.bottom =
        typeof storedOffsetsMm.bottomMm === 'number'
          ? storedOffsetsMm.bottomMm / 10
          : localPos.y / 10;
      currentOffsets.top =
        typeof storedOffsetsMm.topMm === 'number'
          ? storedOffsetsMm.topMm / 10
          : (state.room.height - localPos.y - currentSize.y) / 10;
      break;
    case 'left': {
      if (hasLogicalFB) {
        currentOffsets.front = (storedOffsetsMm.frontMm || 0) / 10;
        currentOffsets.back = (storedOffsetsMm.backMm || 0) / 10;
      } else {
        currentOffsets.front = alongFromWorld.front;
        currentOffsets.back = alongFromWorld.back;
      }

      currentOffsets.bottom = localPos.y / 10;
      currentOffsets.top =
        (state.room.height - localPos.y - currentSize.y) / 10;
      break;
    }
    case 'right': {
      if (hasLogicalFB) {
        currentOffsets.front = (storedOffsetsMm.frontMm || 0) / 10;
        currentOffsets.back = (storedOffsetsMm.backMm || 0) / 10;
      } else {
        currentOffsets.front = alongFromWorld.front;
        currentOffsets.back = alongFromWorld.back;
      }

      currentOffsets.bottom = localPos.y / 10;
      currentOffsets.top =
        (state.room.height - localPos.y - currentSize.y) / 10;
      break;
    }
  }

  //   L‑    /  ,
  //   "0"       /
  // ,     .    
  //       .
  const backCornerBase = getBackAttachedCornerBase(sectionData);
  if (backCornerBase && wallName === 'back') {
    const k = backCornerBase.sideKey; // 'left' или 'right'
    if (typeof currentOffsets[k] === 'number') {
      currentOffsets[k] = Math.max(
        0,
        currentOffsets[k] - backCornerBase.baseCm
      );
    }
  }
  const frontCornerBase = getFrontAttachedCornerBase(sectionData);
  if (frontCornerBase && wallName === 'front') {
    const k = frontCornerBase.sideKey; // 'left' или 'right'
    if (typeof currentOffsets[k] === 'number') {
      currentOffsets[k] = Math.max(
        0,
        currentOffsets[k] - frontCornerBase.baseCm
      );
    }
  }

  //     ,  ,
  //      
  console.log('[SEC-EDIT] showEditSectionModal', {
    sectionId: sectionData.id,
    wallName,
    roomWorldPos,
    sectionWorldPos: sectionPos,
    localPos,
    currentSize,
    currentOffsets,
    storedOffsetsMm: sectionData.offsets || null,
  });

  //     :   ,  offset .
  const lModalTypeKey = getLShapeTypeKey(sectionData);
  const lModalCfg = lModalTypeKey && L_CORNER_CONFIG[lModalTypeKey];
  const lModalRole = sectionData.lShape?.role;
  const isCornerBack = lModalCfg && lModalRole === 'back' && lModalTypeKey === 'corner-back-right';
  const isCornerRight = lModalCfg && lModalRole === 'right' && lModalTypeKey === 'corner-back-right';
  const isCornerBackLeft = lModalCfg && lModalRole === 'back' && lModalTypeKey === 'corner-back-left';
  const isCornerLeft = lModalCfg && lModalRole === 'left' && lModalTypeKey === 'corner-back-left';
  const isCornerFrontAttachedRight = lModalCfg && lModalRole === 'front' && lModalTypeKey === 'corner-right-front';
  const isCornerRightPrimaryUniversal = lModalCfg && lModalRole === 'right' && lModalTypeKey === 'corner-right-front';
  const isCornerFrontAttachedLeft = lModalCfg && lModalRole === 'front' && lModalTypeKey === 'corner-left-front';
  const isCornerLeftPrimaryUniversal = lModalCfg && lModalRole === 'left' && lModalTypeKey === 'corner-left-front';
  const isCornerLeftBackPrimary = lModalCfg && lModalRole === 'left' && lModalTypeKey === 'corner-left-back';
  const isCornerBackAttachedFromLeft = lModalCfg && lModalRole === 'back' && lModalTypeKey === 'corner-left-back';

  //  HTML      
  let html = '';
  const openingList = Array.isArray(state.roomEditOpenings) ? state.roomEditOpenings : [];
  const offsetLabels = getSectionOffsetFieldLabels(sectionData, state.room, openingList);
  const fmtOffsetCm = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return '0';
    return String(Math.round(n * 10) / 10);
  };
  const farAlongMm =
    wallName === 'left' || wallName === 'right'
      ? {
          frontMm: (currentOffsets.front || 0) * 10,
          backMm: (currentOffsets.back || 0) * 10,
        }
      : {
          leftMm: (currentOffsets.left || 0) * 10,
          rightMm: (currentOffsets.right || 0) * 10,
        };
  const farWallInfo = getFarRoomWallOffsetInfo(sectionData, state.room, farAlongMm);
  /**  : 1)  , 2)    , 3)    . */
  const buildLrOffsetRows = (
    leftLabel,
    rightLabel,
    leftVal,
    rightVal,
    leftInputId = 'section-offset-left',
    rightInputId = 'section-offset-right'
  ) => {
    const row = (label, id, val, extraAttrs = ' min="0"') =>
      `<div style="margin-bottom: 20px;">` +
      `<label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">${label} (см):</label>` +
      `<input type="number" id="${id}" value="${fmtOffsetCm(val)}" step="0.1"${extraAttrs} style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">` +
      `</div>`;
    const leftRow = row(leftLabel, leftInputId, leftVal);
    const rightRow = row(rightLabel, rightInputId, rightVal);

    const doorSide = offsetLabels.doorUiSide;
    const wallSide = offsetLabels.wallUiSide;
    if (
      offsetLabels.hasOpeningEnds &&
      (doorSide === 'left' || doorSide === 'right') &&
      (wallSide === 'left' || wallSide === 'right') &&
      doorSide !== wallSide
    ) {
      const doorLabel = offsetLabels.doorLabel || (doorSide === 'left' ? leftLabel : rightLabel);
      const wallLabel =
        offsetLabels.wallLabel ||
        (wallSide === 'left' ? 'Отступ слева' : 'Отступ справа');
      const doorRow = row(
        doorLabel,
        doorSide === 'left' ? leftInputId : rightInputId,
        doorSide === 'left' ? leftVal : rightVal
      );
      const wallRow = row(
        wallLabel,
        wallSide === 'left' ? leftInputId : rightInputId,
        wallSide === 'left' ? leftVal : rightVal
      );
      let farRow = '';
      if (farWallInfo) {
        const doorInputId = doorSide === 'left' ? leftInputId : rightInputId;
        farRow = row(
          farWallInfo.label,
          'section-offset-far-wall',
          farWallInfo.valueCm,
          ` data-base-mm="${farWallInfo.baseMm}" data-door-input="${doorInputId}" min="0"`
        );
      }
      //  →    →   .
      return doorRow + farRow + wallRow;
    }
    return leftRow + rightRow;
  };

  if (wallName === 'front' || wallName === 'back') {
    // Для front: стороны отступов зеркальны (вид из комнаты) — swap left/right
    const leftVal = wallName === 'front' ? currentOffsets.right : currentOffsets.left;
    const rightVal = wallName === 'front' ? currentOffsets.left : currentOffsets.right;
    const leftLabel = offsetLabels.left;
    const rightLabel = offsetLabels.right;

    const legacyCornerHtml = getLegacyBackCornerModalHtml({
      sectionData,
      wallName,
      currentOffsets,
      currentSize,
      leftVal,
      rightVal,
    });

    //     :   
    //   ↔   (),     (/).
    if (wallName === 'back' && (isCornerBack || isCornerBackLeft)) {
      html =
        buildLrOffsetRows(leftLabel, rightLabel, leftVal, rightVal) +
        `
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-offset-bottom" value="${fmtOffsetCm(currentOffsets.bottom)}" min="0" step="0.1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-offset-top" value="${fmtOffsetCm(currentOffsets.top)}" min="0" step="0.1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-depth" value="${fmtOffsetCm(currentSize.z / 10)}" min="10" step="0.1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
      `;
    } else if (legacyCornerHtml) {
      html = legacyCornerHtml;
    } else if (wallName === 'back' && isCornerBackAttachedFromLeft) {
      //    (    ):  ,    .
      html = `
        <div style="display: none;"><input type="number" id="section-offset-left" value="${leftVal}" /></div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-offset-right" value="${rightVal}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-offset-bottom" value="${currentOffsets.bottom}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-offset-top" value="${currentOffsets.top}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-depth" value="${currentSize.z / 10}" min="10" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
      `;
    } else if (wallName === 'front' && isCornerFrontAttachedRight) {
      //      ( right+front):    .
      html = `
        <div style="display: none;">
          <input type="number" id="section-offset-left" value="${leftVal}" />
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-offset-right" value="${rightVal}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-offset-bottom" value="${currentOffsets.bottom}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-offset-top" value="${currentOffsets.top}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-depth" value="${currentSize.z / 10}" min="10" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
      `;
    } else if (wallName === 'front' && isCornerFrontAttachedLeft) {
      //    ( left+front):    .
      html = `
        <div style="display: none;">
          <input type="number" id="section-offset-right" value="${rightVal}" />
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-offset-left" value="${leftVal}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-offset-bottom" value="${currentOffsets.bottom}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-offset-top" value="${currentOffsets.top}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-depth" value="${currentSize.z / 10}" min="10" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
      `;
    } else {
      html =
        buildLrOffsetRows(leftLabel, rightLabel, leftVal, rightVal) +
        `
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-offset-bottom" value="${fmtOffsetCm(currentOffsets.bottom)}" min="0" step="0.1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-offset-top" value="${fmtOffsetCm(currentOffsets.top)}" min="0" step="0.1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-depth" value="${fmtOffsetCm(currentSize.z / 10)}" min="10" step="0.1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
      `;
    }
  } else if (wallName === 'left' || wallName === 'right') {
    //    ,      
    //     :
    // -  :       (front),     (back);
    // -  :      (back),     (front).
    let leftVal;
    let rightVal;
    let leftId;
    let rightId;

    if (wallName === 'right') {
      //  :     ,   .
      leftVal = currentOffsets.front;
      rightVal = currentOffsets.back;
      leftId = 'section-offset-front';
      rightId = 'section-offset-back';
    } else {
      //  :   ,   .
      leftVal = currentOffsets.back;
      rightVal = currentOffsets.front;
      leftId = 'section-offset-back';
      rightId = 'section-offset-front';
    }

    const legacyCornerHtml = getLegacyBackCornerModalHtml({
      sectionData,
      wallName,
      currentOffsets,
      currentSize,
      leftVal,
      rightVal,
    });

    if (legacyCornerHtml) {
      html = legacyCornerHtml;
    } else if (wallName === 'right' && isCornerRight) {
      //   :   ,    (back).
      html = `
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-offset-back" value="${rightVal}" min="0" step="0.1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-offset-bottom" value="${currentOffsets.bottom}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-offset-top" value="${currentOffsets.top}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-depth" value="${currentSize.x / 10}" min="10" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
      `;
    } else if (wallName === 'left' && isCornerLeft) {
      //   :  (front-offset,   )   .
      // " " =      = back-offset.
      // leftVal = currentOffsets.back (маппинг для 'left': leftVal = back, rightVal = front).
      html = `
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-offset-back" value="${leftVal}" min="0" step="0.1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-offset-bottom" value="${currentOffsets.bottom}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-offset-top" value="${currentOffsets.top}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-depth" value="${currentSize.x / 10}" min="10" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
      `;
    } else if (wallName === 'right' && isCornerRightPrimaryUniversal) {
      //      (right+front)   .
      html = `
        <div style="display: none;">
          <input type="number" id="${rightId}" value="${rightVal}" />
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="${leftId}" value="${leftVal}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-offset-bottom" value="${currentOffsets.bottom}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-offset-top" value="${currentOffsets.top}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-depth" value="${currentSize.x / 10}" min="10" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
      `;
    } else if (wallName === 'left' && isCornerLeftPrimaryUniversal) {
      // Основная секция corner-left-front: стык у одного края, редактируем другой (справа).
      html = `
        <div style="display: none;">
          <input type="number" id="${leftId}" value="${leftVal}" />
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="${rightId}" value="${rightVal}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-offset-bottom" value="${currentOffsets.bottom}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-offset-top" value="${currentOffsets.top}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-depth" value="${currentSize.x / 10}" min="10" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
      `;
    } else if (wallName === 'left' && isCornerLeftBackPrimary) {
      // Основная секция corner-left-back: стык справа (back), свободный край слева (front).
      //     (back),  (front)   5 .
      html = `
        <div style="display: none;">
          <input type="number" id="${rightId}" value="5" />
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="${leftId}" value="${leftVal}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-offset-bottom" value="${currentOffsets.bottom}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-offset-top" value="${currentOffsets.top}" min="0" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-depth" value="${currentSize.x / 10}" min="10" step="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
      `;
    } else {
      //   :     /,  .
      html =
        buildLrOffsetRows(
          offsetLabels.left,
          offsetLabels.right,
          leftVal,
          rightVal,
          leftId,
          rightId
        ) +
        `
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-offset-bottom" value="${fmtOffsetCm(currentOffsets.bottom)}" min="0" step="0.1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-offset-top" value="${fmtOffsetCm(currentOffsets.top)}" min="0" step="0.1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">Отступ сверху (см):</label>
          <input type="number" id="section-depth" value="${fmtOffsetCm(currentSize.x / 10)}" min="10" step="0.1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;">
        </div>
      `;
    }
  }

  content.innerHTML = html;
  decorateEditSectionFormPresentation(content);
  //  :   ( / ).
  if (!(Number(sectionData.fixedHeightMm) > 0)) {
    const clearanceCm = (
      (Number.isFinite(Number(sectionData.wallHungFloorClearanceMm))
        ? Number(sectionData.wallHungFloorClearanceMm)
        : DEFAULT_WALL_HUNG_FLOOR_CLEARANCE_MM) / 10
    )
      .toFixed(1)
      .replace(/\.0$/, '');
    const ceilingCm = (
      (Number.isFinite(Number(sectionData.wallHungCeilingClearanceMm))
        ? Number(sectionData.wallHungCeilingClearanceMm)
        : DEFAULT_WALL_HUNG_CEILING_CLEARANCE_MM) / 10
    )
      .toFixed(1)
      .replace(/\.0$/, '');
    const row = document.createElement('div');
    row.className = 'cld-edit-section-field';
    row.innerHTML = `
      <label class="cld-edit-section-label" for="section-wall-hung-clearance">   </label>
      <div class="cld-edit-section-input-wrap">
        <input type="number" id="section-wall-hung-clearance" class="cld-edit-section-input" value="${clearanceCm}" min="0" max="200" step="0.1">
        <span class="cld-edit-section-unit"></span>
      </div>
      <p class="cld-filler-hint"> :       .</p>
      <label class="cld-edit-section-label" for="section-wall-hung-ceiling-clearance" style="margin-top:12px;">   </label>
      <div class="cld-edit-section-input-wrap">
        <input type="number" id="section-wall-hung-ceiling-clearance" class="cld-edit-section-input" value="${ceilingCm}" min="0" max="200" step="0.1">
        <span class="cld-edit-section-unit"></span>
      </div>
      <p class="cld-filler-hint"> :        .</p>
    `;
    content.appendChild(row);
  }
  bindFarWallOffsetSync(content);
  window._editSectionInputSnapshot = snapshotEditSectionInputs();
  modal.style.display = 'block';
  syncStep4SectionEditActiveState();

  //        3D 
  addSectionOffsetLabels(sectionData, currentOffsets, wallName);
  if (typeof updateSectionDimensionLabels === 'function') {
    updateSectionDimensionLabels();
  } else if (typeof window.updateSectionDimensionLabels === 'function') {
    window.updateSectionDimensionLabels();
  }

  //           
  setupOffsetLabelsUpdate(sectionData, wallName);

  // ,     
  if (sectionData.id) {
    updateCabinetMarkersForSection(sectionData.id);
  }

  // ==== Привязка кнопок "Применить" / "Отмена" (порт из legacy initEditSectionModal) ====
  const applyBtn = document.getElementById('edit-section-apply-btn');
  const cancelBtn = document.getElementById('edit-section-cancel-btn');
  const planksBtn = document.getElementById('edit-section-planks-btn');

  if (planksBtn) {
    const newPlanks = planksBtn.cloneNode(true);
    planksBtn.parentNode.replaceChild(newPlanks, planksBtn);
    newPlanks.addEventListener('click', () => {
      const sec = window.editingSection;
      if (!sec?.group) return;
      showSectionFillerModal(sec);
    });
  }

  if (applyBtn) {
    //    ,  
    const newApply = applyBtn.cloneNode(true);
    applyBtn.parentNode.replaceChild(newApply, applyBtn);

    newApply.addEventListener('click', async () => {
      const currentSection = window.editingSection;
      if (!currentSection) {
        console.error('❌    ');
        return;
      }

      const currentWallName = currentSection.wallName || 'back';
      const offsets = {};
      let newDepth = 0;

      const clearanceEl = document.getElementById('section-wall-hung-clearance');
      if (clearanceEl) {
        const cm = parseFloat(clearanceEl.value);
        if (Number.isFinite(cm) && cm >= 0) {
          currentSection.wallHungFloorClearanceMm = Math.round(cm * 10);
          try {
            refreshSectionVerticalLayout(currentSection);
          } catch (_) {}
        }
      }
      const ceilingClearanceEl = document.getElementById('section-wall-hung-ceiling-clearance');
      if (ceilingClearanceEl) {
        const cm = parseFloat(ceilingClearanceEl.value);
        if (Number.isFinite(cm) && cm >= 0) {
          currentSection.wallHungCeilingClearanceMm = Math.round(cm * 10);
          try {
            refreshSectionVerticalLayout(currentSection);
          } catch (_) {}
        }
      }

      if (currentWallName === 'front' || currentWallName === 'back') {
        const leftEl = document.getElementById('section-offset-left');
        const rightEl = document.getElementById('section-offset-right');
        //    :     DOM   0 (  
        //      "" ).
        let offsetLeft = parseFloat(leftEl?.value || '0');
        let offsetRight = parseFloat(rightEl?.value || '0');
        const offsetBottom = parseFloat(document.getElementById('section-offset-bottom')?.value || '0');
        const offsetTop = parseFloat(document.getElementById('section-offset-top')?.value || '0');
        newDepth = parseFloat(document.getElementById('section-depth')?.value || '60');

        // Для приставных секций на задней/передней стене (универсальные corner-*-back / corner-*-front)
        //  0     ,    .
        //      .
        if (currentWallName === 'back') {
          const backCornerBase = getBackAttachedCornerBase(currentSection);
          if (backCornerBase) {
            if (backCornerBase.sideKey === 'left') {
              offsetLeft += backCornerBase.baseCm;
            } else if (backCornerBase.sideKey === 'right') {
              offsetRight += backCornerBase.baseCm;
            }
          }
        } else if (currentWallName === 'front') {
          const frontCornerBase = getFrontAttachedCornerBase(currentSection);
          if (frontCornerBase) {
            // Для front: мировые "left/right" инверсированы относительно полей формы:
            // world.left → UI right, world.right → UI left.
            if (frontCornerBase.sideKey === 'left') {
              offsetRight += frontCornerBase.baseCm;
            } else if (frontCornerBase.sideKey === 'right') {
              offsetLeft += frontCornerBase.baseCm;
            }
          }
        }

        // Для front: стороны отступов зеркальны — swap при передаче в updateSectionSize
        if (currentWallName === 'front') {
          offsets.left = offsetRight;
          offsets.right = offsetLeft;
        } else {
          offsets.left = offsetLeft;
          offsets.right = offsetRight;
        }
        offsets.bottom = offsetBottom;
        offsets.top = offsetTop;
      } else if (currentWallName === 'left' || currentWallName === 'right') {
        const offsetFrontInput = document.getElementById('section-offset-front');
        const offsetBackInput = document.getElementById('section-offset-back');
        const offsetBottom = parseFloat(document.getElementById('section-offset-bottom')?.value || '0');
        const offsetTop = parseFloat(document.getElementById('section-offset-top')?.value || '0');
        newDepth = parseFloat(document.getElementById('section-depth')?.value || '60');

        const isCornerRightApply =
          currentWallName === 'right' &&
          currentSection.lShape &&
          getLShapeTypeKey(currentSection) === 'corner-back-right' &&
          currentSection.lShape.role === 'right';

        const isCornerLeftApply =
          currentWallName === 'left' &&
          currentSection.lShape &&
          getLShapeTypeKey(currentSection) === 'corner-back-left' &&
          currentSection.lShape.role === 'left';

        if (isCornerRightApply) {
          //   :
          //  -   (front)       ;
          //  -    " " (back).
          const offsetBackUi = parseFloat(offsetBackInput?.value || '0');

          const pairId = currentSection.lShape.pairId;
          const backSection = state.customSections.find((s) => s.id === pairId);
          const roomWorldPos2 = new THREE.Vector3();
          state.room.group.getWorldPosition(roomWorldPos2);
          const markerWorldPos = getBackSectionCornerMarkerWorldPos(backSection);

          let frontOffsetCm = 0;
          if (markerWorldPos && backSection) {
            //         (  ).
            const gapMm = backSection.position.z - roomWorldPos2.z;
            const jointMm = markerWorldPos.z - roomWorldPos2.z - gapMm;
            frontOffsetCm = jointMm / 10;
          } else {
            // Fallback:   front‑
            frontOffsetCm = (currentSection.offsets.frontMm || 0) / 10;
          }

          offsets.front = frontOffsetCm;
          offsets.back = offsetBackUi;
        } else if (isCornerLeftApply) {
          //   :    ;       .
          const offsetBackUi = offsetBackInput != null
            ? parseFloat(offsetBackInput.value || '0')
            : (currentSection.offsets?.backMm ?? 0) / 10;

          const pairId = currentSection.lShape.pairId;
          const backSection = state.customSections.find((s) => s.id === pairId);
          const roomWorldPos2 = new THREE.Vector3();
          state.room.group.getWorldPosition(roomWorldPos2);
          const markerWorldPos = getBackSectionCornerMarkerLeftWorldPos(backSection);

          let frontOffsetCm = 0;
          if (markerWorldPos && backSection) {
            // front-offset = расстояние от задней стены (low-Z) до стыка.
            const gapMm = backSection.position.z - roomWorldPos2.z;
            const jointMm = markerWorldPos.z - roomWorldPos2.z - gapMm;
            frontOffsetCm = jointMm / 10;
          } else {
            frontOffsetCm = (currentSection.offsets.frontMm || 0) / 10;
          }

          offsets.front = frontOffsetCm;  // стык — фиксирован по маркеру
          offsets.back = offsetBackUi;    // свободный конец — задаёт пользователь
        } else {
          const offsetFront = parseFloat(offsetFrontInput?.value || '0');
          const offsetBack = parseFloat(offsetBackInput?.value || '0');
          offsets.front = offsetFront;
          offsets.back = offsetBack;
        }

        offsets.bottom = offsetBottom;
        offsets.top = offsetTop;
      }

      // Торцевой держит свой резерв в endCabinets.widthMm; зазор (offsets) не обнуляем.

      const sizeCheck = assessSectionOffsetsForApply(currentSection, offsets, newDepth);
      if (!sizeCheck.ok) {
        showSectionSizeLimitModal(sizeCheck.message, () => {
          restoreEditSectionInputs(window._editSectionInputSnapshot);
        });
        return;
      }

      // v1:       (front/back).
      let acceptedSides = [];
      try {
        if (isStraightWallSection(currentSection)) {
          const dlg = await runEndCabinetApplyDialogs(currentSection, offsets, newDepth);
          newDepth = dlg.depthCm;
          acceptedSides = dlg.acceptedSides || [];
        }
      } catch (e) {
        console.warn('[END-CAB] dialogs failed', e);
      }

      //   
      updateSectionSize(currentSection, offsets, newDepth);
      window._editSectionInputSnapshot = snapshotEditSectionInputs();

      for (const side of acceptedSides) {
        try {
          placeEndCabinetPlaceholder(currentSection, side);
        } catch (e) {
          console.warn('[END-CAB] placeholder failed', side, e);
        }
      }
      if (acceptedSides.length) {
        runEndCabinetSyncSteps(currentSection, [
          ['wallPlanks', syncEndCabinetWallPlanks],
          ['topPlanks', syncEndCabinetTopPlanks],
          ['plinths', syncEndCabinetPlinths],
          ['facadeOverlays', syncEndCabinetFacadeOverlays],
        ]);
      }
      if (acceptedSides.length) {
        refreshSectionZonesAfterEndCabinet(currentSection);
      }

      if (acceptedSides.length) {
        const rule = getEndCabinetRule();
        const firstSide = acceptedSides[0];
        setPendingEndCabinetPlacement({
          sectionId: currentSection.id,
          side: firstSide,
          catalogType: rule.catalogType,
          catalogCategoryId: rule.catalogCategoryId,
          catalogFilterTag: rule.catalogFilterTag,
          label: rule.label,
        });
        try {
          if (typeof window.__cldOpenStep4ForEndCabinet === 'function') {
            window.__cldOpenStep4ForEndCabinet();
          }
        } catch (e) {
          console.warn('[END-CAB] open step4 failed', e);
        }
      }

      //       
      if (currentSection.id) {
        updateCabinetMarkersForSection(currentSection.id);
      }

      //  :    L‑   .
      if (
        currentWallName === 'right' &&
        currentSection.lShape &&
        getLShapeTypeKey(currentSection) === 'corner-back-right' &&
        currentSection.lShape.role === 'right'
      ) {
        const pairId = currentSection.lShape.pairId;
        const backSection = (state.customSections || []).find(
          (s) =>
            s.id === pairId &&
            s.lShape &&
            getLShapeTypeKey(s) === 'corner-back-right' &&
            s.lShape.role === 'back'
        );
        if (backSection && backSection.id) {
          try {
            updateCabinetMarkersForSection(backSection.id);
            if (backSection.division) {
              createSectionZones(backSection);
            }
          } catch (e) {
            console.warn('⚠️           L‑:', e);
          }
        }
      }

      //  :    L‑    .
      if (
        currentWallName === 'left' &&
        currentSection.lShape &&
        getLShapeTypeKey(currentSection) === 'corner-back-left' &&
        currentSection.lShape.role === 'left'
      ) {
        const pairId = currentSection.lShape.pairId;
        const backSection = (state.customSections || []).find(
          (s) =>
            s.id === pairId &&
            s.lShape &&
            getLShapeTypeKey(s) === 'corner-back-left' &&
            s.lShape.role === 'back'
        );
        if (backSection && backSection.id) {
          try {
            updateCabinetMarkersForSection(backSection.id);
            if (backSection.division) {
              createSectionZones(backSection);
            }
          } catch (e) {
            console.warn('⚠️           L‑:', e);
          }
        }
      }

      //   
      const m = document.getElementById('edit-section-modal');
      if (m) {
        m.style.display = 'none';
      }

      window.editingSection = null;
      syncStep4SectionEditActiveState();
    });
  }

  if (cancelBtn) {
    const newCancel = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

    newCancel.addEventListener('click', () => {
      //   
      removeSectionOffsetLabels();

      //    
      if (window.offsetLabelsUpdateHandlers) {
        window.offsetLabelsUpdateHandlers.forEach((handler) => {
          if (handler.element && handler.event) {
            handler.element.removeEventListener(handler.event, handler.callback);
          }
        });
        window.offsetLabelsUpdateHandlers = [];
      }

      //    
      const currentSection = window.editingSection;
      if (currentSection && currentSection.id) {
        updateCabinetMarkersForSection(currentSection.id);
      }

      const m = document.getElementById('edit-section-modal');
      if (m) {
        m.style.display = 'none';
      }

      window.editingSection = null;
      syncStep4SectionEditActiveState();
    });
  }
}

/**    (    ). */
export function confirmPendingSectionPlacement() {
  if (
    !state.isPlacingSection ||
    !state.sectionGhost?.visible ||
    !state.sectionGhostPosition ||
    !state.sectionGhostWall
  ) {
    return false;
  }

  const spans = Array.isArray(state.sectionPlacementSpans) ? state.sectionPlacementSpans : [];
  const freeSpans = spans.filter((s) => s && s.placeable);
  if (freeSpans.length > 1 || state.sectionPlacementPlaceProfile) {
    const sel = state.sectionPlacementSelectedIds || [];
    const hasSel =
      !!state.sectionPlacementPlaceProfile ||
      !!state.sectionPlacementPlaceAll ||
      sel.some((id) => freeSpans.some((s) => s.id === id));
    if (!hasSel) return false;
    state.sectionPlacementSelectionLocked = true;
  }

  const placedWall = state.sectionGhostWall;
  const placedPos = state.sectionGhostPosition.clone();

  if (
    state.room?.walls?.[placedWall] &&
    state.room.walls[placedWall].visible === false
  ) {
    console.warn('⚠️      ');
    return false;
  }

  const selectedIds = Array.isArray(state.sectionPlacementSelectedIds)
    ? state.sectionPlacementSelectedIds
    : [];
  let toPlace = spans.filter((s) => s && s.placeable && selectedIds.includes(s.id));
  if (!toPlace.length && state.pendingSectionData?.span) {
    toPlace = [state.pendingSectionData.span];
  }
  //        .
  toPlace = toPlace.filter(
    (s) => s && s.kind !== 'under-window' && s.kind !== 'window-bridge'
  );
  if (!toPlace.length) {
    toPlace = spans.filter(
      (s) =>
        s &&
        s.placeable &&
        selectedIds.includes(s.id) &&
        s.kind !== 'under-window' &&
        s.kind !== 'window-bridge'
    );
  }

  if (!toPlace.length) return false;

  //  .
  state.sectionPlacementPlaceBridge = false;
  state.sectionPlacementBridgeSpan = null;

  const openings = Array.isArray(state.roomEditOpenings) ? state.roomEditOpenings : [];
  const heightProfile = findWallWindowHeightProfile(
    state.room,
    placedWall,
    spans,
    openings,
    { minPlaceMm: getMinPlaceMmFromRoomConfig() }
  );

  const spanPayload = (span) => ({
    id: span.id,
    alongA: span.alongA,
    alongB: span.alongB,
    lengthMm: span.lengthMm,
  });
  const createOptsForSpan = (span, extra = {}) => ({
    ...extra,
    span: spanPayload(span),
  });

  const pendingBackup = state.pendingSectionData
    ? {
        ...state.pendingSectionData,
        span: state.pendingSectionData.span
          ? { ...state.pendingSectionData.span }
          : null,
      }
    : null;

  const activeLayoutKey =
    state.pendingLayoutKey ||
    (window.selectedRoomLayout && window.selectedRoomLayout.key) ||
    null;
  const isCornerLayout = isCornerLayoutKey(activeLayoutKey);
  const isULayout = isUShapeLayoutKey(activeLayoutKey);
  const isStraight = !isCornerLayout && !isULayout;

  // Вариант 1 (активен): три секции L | under | R — у каждой свои отступы/ячейки.
  // Вариант 2 (одна windowLowSlot): window.__CLD_WINDOW_PLACE_ONE_SLOT = true
  const placeOneWindowSlot =
    typeof window !== 'undefined' && window.__CLD_WINDOW_PLACE_ONE_SLOT === true;

  const wantsWindowAlongWall =
    isStraight &&
    heightProfile &&
    !!state.sectionPlacementPlaceProfile;

  if (wantsWindowAlongWall && !placeOneWindowSlot) {
    const roomH = Number(state.room?.height) || Number(pendingBackup?.height) || 2500;
    const sillMm = Math.max(1, Math.round(Number(heightProfile.sillMm) || 900));
    const bands = Array.isArray(heightProfile.heightBands)
      ? heightProfile.heightBands
      : [];
    if (bands.length < 3) {
      console.warn('⚠️ heightBands < 3 — fallback на одну секция windowLowSlot');
    } else {
      const alongGroupId = `win-along_${Date.now()}`;
      bands.forEach((band) => {
        if (!band) return;
        const role = String(band.role || '');
        const isUnder = role === 'under-window';
        const bandH = isUnder
          ? sillMm
          : Math.max(1, Math.round(Number(band.heightMm) || roomH));
        const span = {
          id: `${heightProfile.id}-${role || 'band'}`,
          alongA: Number(band.alongA),
          alongB: Number(band.alongB),
          lengthMm: Number(band.alongB) - Number(band.alongA),
          kind: isUnder ? 'under-window' : undefined,
        };
        if (!(span.lengthMm > 1)) return;

        state.pendingSectionData = {
          ...(pendingBackup || {}),
          height: bandH,
          span: spanPayload(span),
        };
        const opts = {
          skipAttached: true,
          span: spanPayload(span),
          heightMm: bandH,
          windowAlongWallGroupId: alongGroupId,
          windowAlongWallRole: role || undefined,
        };
        if (isUnder) {
          opts.fixedHeightMm = sillMm;
          opts.underWindowBay = true;
          opts.sillMm = sillMm;
        } else if (role === 'tall-left' || role === 'tall-right') {
          //  groupId   ;   trim (     ).
          opts.windowBridgeRole = role;
        }
        createSectionAtPosition(placedPos, placedWall, opts);
      });

      //      (   span).
      try {
        const leftSeed = (state.customSections || []).find(
          (s) =>
            s &&
            s.windowAlongWallGroupId === alongGroupId &&
            s.windowAlongWallRole === 'tall-left'
        );
        if (leftSeed) {
          syncUnderWindowBayToSideOverlays(leftSeed, {
            updateSectionSize,
            getSectionOffsetsMm,
          });
        }
      } catch (e) {
        console.warn('[WIN-BAY] initial sync failed', e);
      }

  try {
    rebuildWallTransitions(placedWall);
  } catch (e) {
    console.warn('⚠️ rebuildWallTransitions after window trio failed:', e);
  }
  try {
    syncWindowAlongEmptyFramesOnWall(placedWall);
  } catch (_) {}

      try {
        healAllLegacyBackCornerJoints({
          updateSectionSize,
          getSectionOffsetsMm,
        });
      } catch (_) {}

      removeSectionGhost();
      state.isPlacingSection = false;
      state.pendingSectionData = null;
      state.sectionGhostWall = null;
      state.sectionGhostPosition = null;
      state.pendingLayoutKey = null;
      state.sectionPlacementPlaceProfile = false;
      state.sectionPlacementHeightProfile = null;
      if (state.room?.resetWallHighlight) state.room.resetWallHighlight();
      console.log('✅ Три секции у окна (вариант 1):', placedWall);
      return true;
    }
  }

  //  2:     (windowLowSlot)   .
  if (wantsWindowAlongWall) {
    const roomH = Number(state.room?.height) || Number(pendingBackup?.height) || 2500;
    state.pendingSectionData = {
      ...(pendingBackup || {}),
      height: roomH,
      span: {
        id: heightProfile.id,
        alongA: heightProfile.alongA,
        alongB: heightProfile.alongB,
        lengthMm: heightProfile.lengthMm,
        kind: 'window-low-slot',
      },
    };
    createSectionAtPosition(placedPos, placedWall, {
      skipAttached: true,
      span: state.pendingSectionData.span,
      heightMm: roomH,
      windowLowSlot: {
        notchAlongA: heightProfile.notchAlongA,
        notchAlongB: heightProfile.notchAlongB,
        sillMm: heightProfile.sillMm,
      },
    });

    try {
      healAllLegacyBackCornerJoints({
        updateSectionSize,
        getSectionOffsetsMm,
      });
    } catch (_) {}

    removeSectionGhost();
    state.isPlacingSection = false;
    state.pendingSectionData = null;
    state.sectionGhostWall = null;
    state.sectionGhostPosition = null;
    state.pendingLayoutKey = null;
    state.sectionPlacementPlaceProfile = false;
    state.sectionPlacementHeightProfile = null;
    if (state.room?.resetWallHighlight) state.room.resetWallHighlight();
    console.log('✅ Одна секция windowLowSlot (вариант 2):', placedWall);
    return true;
  }

  /**   :   →  ,  → . */
  const cornerLayoutKeyForSpan = (span) => {
    const side = spanDoorSide(span, spans);
    if (side) return cornerLayoutKeyForSide(side);
    return 'top-wall';
  };

  //   + : -    (  ).
  if (toPlace.length === 1 && isCornerLayout) {
    const side = spanDoorSide(toPlace[0], spans);
    if (side) applyCornerLayoutForDoorSide(side);
  }

  if (toPlace.length > 1) {
    //   ,    .
    const orderedPlace = [...toPlace].sort(
      (a, b) => (Number(a.alongA) || 0) - (Number(b.alongA) || 0)
    );
    orderedPlace.forEach((span, idx) => {
      const prevLayout = state.pendingLayoutKey;
      const isFirst = idx === 0;
      const isLast = idx === orderedPlace.length - 1;
      if (isCornerLayout) {
        state.pendingLayoutKey = cornerLayoutKeyForSpan(span);
      } else if (isULayout) {
        // :    ;  ( )  .
        if (isFirst) state.pendingLayoutKey = 'corner-wardrobe-left';
        else if (isLast) state.pendingLayoutKey = 'corner-wardrobe';
        else state.pendingLayoutKey = 'top-wall';
      }
      state.pendingSectionData = {
        ...(pendingBackup || {}),
        span: spanPayload(span),
      };
      const attachL =
        isCornerLayout || (isULayout && (isFirst || isLast));
      createSectionAtPosition(
        placedPos,
        placedWall,
        createOptsForSpan(span, { skipAttached: !attachL })
      );
      state.pendingLayoutKey = prevLayout;
    });
  } else {
    const span = toPlace[0];
    if (span && pendingBackup) {
      state.pendingSectionData = {
        ...pendingBackup,
        span: spanPayload(span),
      };
    }
    createSectionAtPosition(
      placedPos,
      placedWall,
      span
        ? createOptsForSpan(span)
        : { span: state.pendingSectionData?.span || null }
    );
  }

  //         L ( heal ).
  try {
    healAllLegacyBackCornerJoints({
      updateSectionSize,
      getSectionOffsetsMm,
    });
  } catch (_) {}

  removeSectionGhost();
  state.isPlacingSection = false;
  state.pendingSectionData = null;
  state.sectionGhostWall = null;
  state.sectionGhostPosition = null;
  state.pendingLayoutKey = null;
  if (state.room?.resetWallHighlight) state.room.resetWallHighlight();
  console.log('✅ Секция размещена на стене:', placedWall, { count: toPlace.length });
  return true;
}

if (typeof window !== 'undefined') {
  window.__cldConfirmPendingSectionPlacement = confirmPendingSectionPlacement;
}

/**
 * Cancel section placement mode
 */
export function cancelSectionPlacement() {
  if (state.sectionGhost) {
    removeSectionGhost();
  }
  if (state.room && state.room.resetWallHighlight) {
    state.room.resetWallHighlight();
  }
  state.pendingSectionData = null;
  state.isPlacingSection = false;
  state.sectionGhostWall = null;
  state.sectionGhostPosition = null;
  console.log('❌   ');
}

// Make findSectionAtPosition available globally for backward compatibility
window.findSectionAtPosition = findSectionAtPosition;

export { removeSectionGhost };

// ===== Dimension labels for sections =====

/**
 *    .
 *         (   ) 
 *  =  .  /       .
 */
function resolveSectionDimensionHeightMm(sectionData, fallbackMm) {
  const fallback = Math.round(Number(fallbackMm) || Number(sectionData?.size?.y) || 0);
  if (!state.scene || sectionData?.id == null) return fallback;

  const sid = String(sectionData.id);
  let hasAny = false;
  let maxFurnMm = 0;

  state.scene.traverse((obj) => {
    if (!obj?.userData?.isFurniture) return;
    if (String(obj.userData.sectionId) !== sid) return;
    hasAny = true;
    let h = Number(obj.userData.customHeightMm) || 0;
    if (h < 1) {
      try {
        const bbox = computeFurnitureWorldBBoxNoAo(obj);
        if (!bbox.isEmpty()) h = Math.max(0, bbox.max.y - bbox.min.y);
      } catch (_) {}
    }
    if (h > maxFurnMm) maxFurnMm = h;
  });

  if (!hasAny || !(maxFurnMm > 0)) return fallback;
  if (fallback > 0 && maxFurnMm < fallback * 0.85) {
    const fromSection = Number(sectionData.standaloneFloorHeightMm) || 0;
    return Math.round(Math.max(maxFurnMm, fromSection));
  }
  return fallback;
}

function refreshSectionDimensionLabelsForSection(sectionId) {
  const sectionData =
    (state.customSections || []).find((s) => s && String(s.id) === String(sectionId)) || null;
  if (!sectionData?.group) return;
  const size = sectionData.size || {};
  const width = Number(size.x) || 0;
  const height = Number(size.y) || 0;
  const depth = Number(size.z) || 0;
  if (width < 1 || height < 1) return;
  addSectionDimensionLabels(
    sectionData.id,
    sectionData.group,
    width,
    height,
    depth,
    sectionData.wallName || 'back'
  );
}

/** После комодов в tall L/R — обновить плашки у всего моста (L + bay + R). */
function refreshWindowBridgeDimensionLabels(sectionOrId) {
  const sectionData =
    sectionOrId && typeof sectionOrId === 'object'
      ? sectionOrId
      : (state.customSections || []).find((s) => s && String(s.id) === String(sectionOrId)) ||
        null;
  if (!sectionData) return;
  const gid = sectionData.windowBridgeGroupId;
  if (!gid) {
    refreshSectionDimensionLabelsForSection(sectionData.id);
    return;
  }
  for (const s of state.customSections || []) {
    if (s?.windowBridgeGroupId === gid) {
      refreshSectionDimensionLabelsForSection(s.id);
    }
  }
}

function addSectionDimensionLabels(
  sectionId,
  sectionGroup,
  width,
  height,
  depth,
  wallName
) {
  if (!window.sceneIconsContainer) return;

  if (!state.sectionDimensionLabels) {
    state.sectionDimensionLabels = {};
  }

  // Remove old labels for this section
  if (state.sectionDimensionLabels[sectionId]) {
    state.sectionDimensionLabels[sectionId].forEach((label) => {
      if (label && label.parentNode) {
        label.parentNode.removeChild(label);
      }
    });
  }
  state.sectionDimensionLabels[sectionId] = [];

  sectionGroup.updateMatrixWorld(true);
  const sectionPos = new THREE.Vector3();
  sectionGroup.getWorldPosition(sectionPos);

  const sectionData =
    (state.customSections || []).find((s) => s.id === sectionId) || null;

  //  :  tall+     ,   size.y
  height = resolveSectionDimensionHeightMm(sectionData, height);

  const labels = [];

  //    L‑ 
  if (sectionData && sectionData.lShape) {
    const dbgTypeKey = getLShapeTypeKey(sectionData);
    const dbgRole = sectionData.lShape.role;
    console.log('[L-DIM]', {
      id: sectionId,
      wallName,
      typeKey: dbgTypeKey,
      role: dbgRole,
      widthMm: width,
      depthMm: depth,
    });
  }

  //     :    , , .       ,        .
  const offset = 180; //    
  const roomFloorY = state.room && state.room.group
    ? (() => { const p = new THREE.Vector3(); state.room.group.getWorldPosition(p); return p.y; })()
    : sectionPos.y;
  const depthLabelY = roomFloorY - 80; // глубина всегда у пола

  let posTop, posSide, posBottom; // мировые координаты: верх секции, сбоку, низ (центры граней)

  switch (wallName) {
    case 'back':
      posTop = new THREE.Vector3(sectionPos.x + width / 2, sectionPos.y + height - 80, sectionPos.z + depth / 2);
      posSide = new THREE.Vector3(sectionPos.x + width + offset, sectionPos.y + height / 2, sectionPos.z + depth / 2);
      posBottom = new THREE.Vector3(sectionPos.x + width / 2, depthLabelY, sectionPos.z + depth / 2);
      break;
    case 'front': {
      const frontMidZ = sectionPos.z - depth / 2;
      const frontMidX = sectionPos.x - width / 2;
      posTop = new THREE.Vector3(frontMidX, sectionPos.y + height - 80, frontMidZ);
      posSide = new THREE.Vector3(sectionPos.x - width - offset, sectionPos.y + height / 2, frontMidZ);
      posBottom = new THREE.Vector3(frontMidX, depthLabelY, frontMidZ);
      break;
    }
    case 'left': {
      const leftMidZ = sectionPos.z - depth / 2;
      posTop = new THREE.Vector3(sectionPos.x + width / 2, sectionPos.y + height - 80, leftMidZ);
      posSide = new THREE.Vector3(sectionPos.x + width + offset, sectionPos.y + height / 2, leftMidZ);
      posBottom = new THREE.Vector3(sectionPos.x + width / 2, depthLabelY, leftMidZ);
      break;
    }
    case 'right':
      posTop = new THREE.Vector3(sectionPos.x - width / 2, sectionPos.y + height - 80, sectionPos.z + depth / 2);
      posSide = new THREE.Vector3(sectionPos.x - width - offset, sectionPos.y + height / 2, sectionPos.z + depth / 2);
      posBottom = new THREE.Vector3(sectionPos.x - width / 2, depthLabelY, sectionPos.z + depth / 2);
      break;
    default:
      posTop = new THREE.Vector3(sectionPos.x + width / 2, sectionPos.y + height - 80, sectionPos.z + depth / 2);
      posSide = new THREE.Vector3(sectionPos.x + width + offset, sectionPos.y + height / 2, sectionPos.z + depth / 2);
      posBottom = new THREE.Vector3(sectionPos.x + width / 2, depthLabelY, sectionPos.z + depth / 2);
  }

  // corner-back-right / back: дефолт высоты = правый край (у угла с приставной) → оба «250»
  //   .  left:        ( ).
  if (
    sectionData &&
    sectionData.lShape &&
    wallName === 'back' &&
    sectionData.lShape.role === 'back' &&
    getLShapeTypeKey(sectionData) === 'corner-back-right'
  ) {
    posSide = new THREE.Vector3(
      sectionPos.x - offset,
      sectionPos.y + height / 2,
      sectionPos.z + depth / 2
    );
  }

  // :
  // -     ( ) → ,
  // -  → ,
  // -    → .
  //
  //  /    = width.
  //  /       Z,   depth.
  let widthTopCm =
    wallName === 'left' || wallName === 'right' ? depth / 10 : width / 10;
  const baseWidthTopCm = widthTopCm;

  //  :   L‑    .
  //        :
  //   _ () +    .
  if (
    wallName === 'left' &&
    sectionData &&
    sectionData.lShape &&
    getLShapeTypeKey(sectionData) === 'corner-back-left' &&
    sectionData.lShape.role === 'left'
  ) {
    try {
      const pairId = sectionData.lShape.pairId;
      const backSection = (state.customSections || []).find(
        (s) =>
          s.id === pairId &&
          s.lShape &&
          getLShapeTypeKey(s) === 'corner-back-left' &&
          s.lShape.role === 'back'
      );
      if (backSection && backSection.size && backSection.size.z) {
        const backDepthCm = backSection.size.z / 10; // фиксированная глубина прямой
        const attachedLenCm = depth / 10;            // текущая длина приставной
        widthTopCm = Math.round(backDepthCm + attachedLenCm);
      }
    } catch (e) {
      console.warn(
        '⚠️         :',
        e
      );
    }
  }

  //   ():   L‑    .
  //        " " (  +  ).
  if (
    wallName === 'right' &&
    sectionData &&
    sectionData.lShape &&
    getLShapeTypeKey(sectionData) === 'corner-back-right' &&
    sectionData.lShape.role === 'right'
  ) {
    try {
      const pairId = sectionData.lShape.pairId;
      // :      back-     lShape.
      // Нам достаточно глубины back-секции (size.z) по pairId.
      const backSection = (state.customSections || []).find((s) => s && s.id === pairId) || null;
      if (backSection && backSection.size && backSection.size.z) {
        const backDepthCm = backSection.size.z / 10;
        const attachedLenCm = depth / 10;
        widthTopCm = Math.round(backDepthCm + attachedLenCm);
      }
    } catch (e) {
      console.warn(
        '⚠️         :',
        e
      );
    }
  }

  //  ‑:      (right+front)   .
  // :  " " =     +    .
  if (
    wallName === 'front' &&
    sectionData &&
    sectionData.lShape &&
    getLShapeTypeKey(sectionData) === 'corner-right-front' &&
    sectionData.lShape.role === 'front'
  ) {
    try {
      const pairId = sectionData.lShape.pairId;
      //      lShape   
      //    .     (size.x)  pairId.
      const primaryRight =
        (pairId &&
          (state.customSections || []).find(
            (s) => s && s.id === pairId
          )) ||
        null;
      if (primaryRight && primaryRight.size && primaryRight.size.x) {
        const primaryDepthCm = primaryRight.size.x / 10;
        const attachedLenCm = width / 10;
        const sum = primaryDepthCm + attachedLenCm;
        console.log('[L-DIM][corner-right-front/front] primaryDepthCm=', primaryDepthCm, 'attachedLenCm=', attachedLenCm, 'sum=', sum);
        widthTopCm = Math.round(sum);
      }
    } catch (e) {
      console.warn('⚠️         :', e);
    }
  }

  //   :   =      ,
  //      5  (    ).
  if (sectionData && sectionData.lShape) {
    const typeKey = getLShapeTypeKey(sectionData);
    const role = sectionData.lShape.role;
    const off = sectionData.offsets || {};
    let gapCmToAdd = 0;

    // : back+right (   ).
    if (typeKey === 'corner-back-right' && role === 'back' && wallName === 'back') {
      gapCmToAdd = (off.rightMm || 0) / 10;
    }
    if (typeKey === 'corner-back-right' && role === 'right' && wallName === 'right') {
      gapCmToAdd = (off.backMm || 0) / 10;
    }

    // Зеркально: back+left (угол у левой стены) — раньше leftMm не добавляли → 197.5 vs 203.
    if (typeKey === 'corner-back-left' && role === 'back' && wallName === 'back') {
      gapCmToAdd = (off.leftMm || 0) / 10;
    }
    if (typeKey === 'corner-back-left' && role === 'left' && wallName === 'left') {
      gapCmToAdd = (off.frontMm || 0) / 10;
    }

    // Поворот по часовой: right+front, front+left, left+back.
    if (typeKey === 'corner-right-front' && role === 'right' && wallName === 'right') {
      gapCmToAdd = (off.backMm || 0) / 10;
    }
    if (typeKey === 'corner-right-front' && role === 'front' && wallName === 'front') {
      gapCmToAdd = (off.leftMm || 0) / 10;
    }
    if (typeKey === 'corner-front-left' && role === 'front' && wallName === 'front') {
      gapCmToAdd = (off.leftMm || 0) / 10;
    }
    if (typeKey === 'corner-front-left' && role === 'left' && wallName === 'left') {
      gapCmToAdd = (off.backMm || 0) / 10;
    }
    if (typeKey === 'corner-left-back' && role === 'left' && wallName === 'left') {
      gapCmToAdd = (off.backMm || 0) / 10;
    }
    if (typeKey === 'corner-left-back' && role === 'back' && wallName === 'back') {
      gapCmToAdd = (off.rightMm || 0) / 10;
    }

    if (gapCmToAdd) {
      const before = widthTopCm;
      widthTopCm = Math.round((widthTopCm + gapCmToAdd) * 10) / 10;
      console.log('[L-DIM][gap]', {
        id: sectionId,
        wallName,
        typeKey,
        role,
        baseWidthTopCm,
        before,
        gapCmToAdd,
        widthTopCm,
      });
    }
  }

  const depthBottomMm =
    wallName === 'left' || wallName === 'right' ? width / 10 : depth / 10;

  //      
  if (sectionData && sectionData.lShape) {
    console.log('[L-DIM][final]', {
      id: sectionId,
      wallName,
      typeKey: getLShapeTypeKey(sectionData),
      role: sectionData.lShape.role,
      baseWidthTopCm,
      widthTopCm,
      depthBottomCm: depthBottomMm,
    });
  }

  labels.push(
    { text: `${widthTopCm} см`, position: posTop, className: 'section-dimension-label section-width' },
    { text: `${height / 10} см`, position: posSide, className: 'section-dimension-label section-height', extraStyle: { transform: 'rotate(-90deg)' } },
    { text: `${depthBottomMm} см`, position: posBottom, className: 'section-dimension-label section-depth' }
  );

  labels.forEach((labelData) => {
    const label = createDimensionLabel(
      labelData.text,
      labelData.position,
      labelData.className,
      labelData.extraStyle || {}
    );
    if (label) {
      state.sectionDimensionLabels[sectionId].push(label);
      label.userData.sectionId = sectionId;
      label.userData.sectionGroup = sectionGroup;
    }
  });

  if (
    typeof window.scheduleRebuildAllDimensionLines === 'function' &&
    (window.showAllDimensionLabels || window.showSectionDimensionLabels)
  ) {
    window.scheduleRebuildAllDimensionLines();
  }
}

function updateSectionDimensionLabels() {
  if (!state.sectionDimensionLabels) return;
  // Maat SVG (cldDimensionSpecs) — основной слой; legacy HTML прячем.
  if ((window.cldDimensionSpecs || []).length > 0) {
    Object.values(state.sectionDimensionLabels).forEach((labels) => {
      labels?.forEach((label) => {
        if (label) label.style.display = 'none';
      });
    });
    return;
  }
  if (window.showAllDimensionLabels) {
    Object.values(state.sectionDimensionLabels).forEach((labels) => {
      labels?.forEach((label) => {
        if (label) label.style.display = 'none';
      });
    });
  }

  const container = window.sceneIconsContainer;
  if (!container) return;
  const widthHalf = container.clientWidth / 2;
  const heightHalf = container.clientHeight / 2;

  Object.keys(state.sectionDimensionLabels).forEach((sectionId) => {
    const labels = state.sectionDimensionLabels[sectionId];
    if (!labels) return;

    labels.forEach((label) => {
      if (!label || !label.userData || !label.userData.position3D) return;
      const vector = label.userData.position3D.clone();
      vector.project(state.camera);
      const x = vector.x * widthHalf + widthHalf;
      const y = -vector.y * heightHalf + heightHalf;
      label.style.left = x + 'px';
      label.style.top = y + 'px';
      const showSectionDims =
        window.showAllDimensionLabels === true || window.showSectionDimensionLabels === true;
      const inFront = vector.z <= 1;
      label.style.display = showSectionDims && inFront ? 'block' : 'none';
    });
  });

  //    
  state.sectionOffsetLabels.forEach((label) => {
    if (label && label.userData && label.userData.position3D) {
      const vector = label.userData.position3D.clone();
      vector.project(state.camera);

      const container = window.sceneIconsContainer;
      if (!container) return;

      const widthHalf = container.clientWidth / 2;
      const heightHalf = container.clientHeight / 2;

      const x = vector.x * widthHalf + widthHalf;
      const y = -vector.y * heightHalf + heightHalf;

      label.style.left = x + 'px';
      label.style.top = y + 'px';
      const showSectionDims =
        window.showAllDimensionLabels === true || window.showSectionDimensionLabels === true;
      const inFront = vector.z <= 1;
      label.style.display = showSectionDims && inFront ? 'block' : 'none';
    }
  });
}

// ===== Offset labels for sections (lines and labels on walls) =====

function addSectionOffsetLabels(sectionData, offsets, wallName) {
  if (!sectionData || !sectionData.group || !state.scene) {
    console.warn('⚠️ addSectionOffsetLabels: нет данных секции или сцены');
    return;
  }

  console.log('🎨   :', {
    offsets,
    wallName,
    sectionData,
  });

  removeSectionOffsetLabels();

  const roomWorldPos = new THREE.Vector3();
  state.room.group.getWorldPosition(roomWorldPos);
  const sectionPos = sectionData.group.position.clone();
  const localPos = sectionPos.clone().sub(roomWorldPos);
  const currentSize = sectionData.size;
  const gap = 2;

  console.log('📍 :', {
    roomWorldPos,
    sectionPos,
    localPos,
    currentSize,
    roomSize: {
      width: state.room.width,
      height: state.room.height,
      depth: state.room.depth,
    },
  });

  const scene = state.scene;

  if (wallName === 'front' || wallName === 'back') {
    const wallZ =
      wallName === 'back'
        ? roomWorldPos.z
        : roomWorldPos.z + state.room.depth;

    if (offsets.left > 0) {
      const centerY = sectionPos.y + currentSize.y / 2;
      const sectionLeftX =
        wallName === 'front' ? sectionPos.x - currentSize.x : sectionPos.x;
      const lineStart = new THREE.Vector3(roomWorldPos.x, centerY, wallZ);
      const lineEnd = new THREE.Vector3(sectionLeftX, centerY, wallZ);

      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        lineStart,
        lineEnd,
      ]);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x0066ff,
        linewidth: 3,
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      state.sectionOffsetLines.push(line);

      const labelPos = new THREE.Vector3(
        (lineStart.x + lineEnd.x) / 2,
        centerY + 100,
        wallZ
      );
      const label = createDimensionLabel(
        `${offsets.left.toFixed(1)} см`,
        labelPos,
        'section-offset-label section-offset-left'
      );
      if (label) state.sectionOffsetLabels.push(label);
    }

    if (offsets.right > 0) {
      const centerY = sectionPos.y + currentSize.y / 2;
      const sectionRightX =
        wallName === 'front' ? sectionPos.x : sectionPos.x + currentSize.x;
      const lineStart = new THREE.Vector3(
        sectionRightX,
        centerY,
        wallZ
      );
      const lineEnd = new THREE.Vector3(
        roomWorldPos.x + state.room.width,
        centerY,
        wallZ
      );

      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        lineStart,
        lineEnd,
      ]);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x0066ff,
        linewidth: 3,
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      state.sectionOffsetLines.push(line);

      const labelPos = new THREE.Vector3(
        (lineStart.x + lineEnd.x) / 2,
        centerY + 100,
        wallZ
      );
      const label = createDimensionLabel(
        `${offsets.right.toFixed(1)} см`,
        labelPos,
        'section-offset-label section-offset-right'
      );
      if (label) state.sectionOffsetLabels.push(label);
    }

    if (offsets.bottom > 0) {
      const lineStart = new THREE.Vector3(
        roomWorldPos.x,
        roomWorldPos.y,
        wallZ
      );
      const lineEnd = new THREE.Vector3(
        roomWorldPos.x + state.room.width,
        roomWorldPos.y,
        wallZ
      );

      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        lineStart,
        lineEnd,
      ]);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x0066ff,
        linewidth: 3,
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      state.sectionOffsetLines.push(line);

      const labelPos = new THREE.Vector3(
        (lineStart.x + lineEnd.x) / 2,
        lineStart.y + 100,
        wallZ
      );
      const label = createDimensionLabel(
        `${offsets.bottom.toFixed(1)} см`,
        labelPos,
        'section-offset-label section-offset-bottom'
      );
      if (label) state.sectionOffsetLabels.push(label);
    }

    if (offsets.top > 0) {
      const lineStart = new THREE.Vector3(
        roomWorldPos.x,
        roomWorldPos.y + state.room.height,
        wallZ
      );
      const lineEnd = new THREE.Vector3(
        roomWorldPos.x + state.room.width,
        roomWorldPos.y + state.room.height,
        wallZ
      );

      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        lineStart,
        lineEnd,
      ]);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x0066ff,
        linewidth: 3,
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      state.sectionOffsetLines.push(line);

      const labelPos = new THREE.Vector3(
        (lineStart.x + lineEnd.x) / 2,
        lineStart.y + 100,
        wallZ
      );
      const label = createDimensionLabel(
        `${offsets.top.toFixed(1)} см`,
        labelPos,
        'section-offset-label section-offset-top'
      );
      if (label) state.sectionOffsetLabels.push(label);
    }
  } else if (wallName === 'left' || wallName === 'right') {
    const wallX =
      wallName === 'left'
        ? roomWorldPos.x
        : roomWorldPos.x + state.room.width;
    const roomFrontZ = roomWorldPos.z;
    const roomBackZ = roomWorldPos.z + state.room.depth;

    // Левая стена: пивот сзади (sectionPos.z = зад комнаты), секция по Z от (sectionPos.z - depth) до sectionPos.z.
    // Правая: пивот спереди (sectionPos.z = перед), секция от sectionPos.z до sectionPos.z + depth.
    const sectionFrontZ =
      wallName === 'left'
        ? sectionPos.z - currentSize.z
        : sectionPos.z;
    const sectionBackZ =
      wallName === 'left'
        ? sectionPos.z
        : sectionPos.z + currentSize.z;

    //     :    (back) ,
    //   .     front‑/,    .
    const isCornerRightOffsets =
      sectionData &&
      sectionData.lShape &&
      getLShapeTypeKey(sectionData) === 'corner-back-right' &&
      sectionData.lShape.role === 'right' &&
      wallName === 'right';

    if (offsets.front > 0 && !isCornerRightOffsets) {
      const centerY = sectionPos.y + currentSize.y / 2;
      //          ( = )
      const lineStart = new THREE.Vector3(wallX, centerY, roomFrontZ);
      const lineEnd = new THREE.Vector3(wallX, centerY, sectionFrontZ);

      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        lineStart,
        lineEnd,
      ]);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x0066ff,
        linewidth: 3,
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      state.sectionOffsetLines.push(line);

      const labelPos = new THREE.Vector3(
        wallX,
        centerY + 100,
        (lineStart.z + lineEnd.z) / 2
      );
      const label = createDimensionLabel(
        `${offsets.front.toFixed(1)} см`,
        labelPos,
        'section-offset-label section-offset-front'
      );
      if (label) state.sectionOffsetLabels.push(label);
    }

    if (offsets.back > 0) {
      const centerY = sectionPos.y + currentSize.y / 2;
      //          ( = )
      const lineStart = new THREE.Vector3(wallX, centerY, sectionBackZ);
      const lineEnd = new THREE.Vector3(wallX, centerY, roomBackZ);

      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        lineStart,
        lineEnd,
      ]);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x0066ff,
        linewidth: 3,
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      state.sectionOffsetLines.push(line);

      const labelPos = new THREE.Vector3(
        wallX,
        centerY + 100,
        (lineStart.z + lineEnd.z) / 2
      );
      const label = createDimensionLabel(
        `${offsets.back.toFixed(1)} см`,
        labelPos,
        'section-offset-label section-offset-back'
      );
      if (label) state.sectionOffsetLabels.push(label);
    }
  }
}

function removeSectionOffsetLabels() {
  //  HTML 
  state.sectionOffsetLabels.forEach((label) => {
    if (label && label.parentNode) {
      label.parentNode.removeChild(label);
    }
  });
  state.sectionOffsetLabels = [];

  //  Three.js 
  state.sectionOffsetLines.forEach((line) => {
    if (line && line.parent) {
      state.scene.remove(line);
      if (line.geometry) line.geometry.dispose();
      if (line.material) {
        if (Array.isArray(line.material)) {
          line.material.forEach((m) => m.dispose());
        } else {
          line.material.dispose();
        }
      }
    }
  });
  state.sectionOffsetLines = [];

  //  Three.js 
  state.sectionOffsetSprites.forEach((sprite) => {
    if (sprite && sprite.parent) {
      state.scene.remove(sprite);
      if (sprite.material && sprite.material.map) {
        sprite.material.map.dispose();
      }
      if (sprite.material) sprite.material.dispose();
    }
  });
  state.sectionOffsetSprites = [];
}

function setupOffsetLabelsUpdate(sectionData, wallName) {
  if (window.offsetLabelsUpdateHandlers) {
    window.offsetLabelsUpdateHandlers.forEach((handler) => {
      if (handler.element && handler.event) {
        handler.element.removeEventListener(handler.event, handler.callback);
      }
    });
  }
  window.offsetLabelsUpdateHandlers = [];

  const inputs = [];
  if (wallName === 'front' || wallName === 'back') {
    inputs.push(
      'section-offset-left',
      'section-offset-right',
      'section-offset-bottom',
      'section-offset-top',
      'section-depth'
    );
  } else {
    inputs.push(
      'section-offset-front',
      'section-offset-back',
      'section-offset-bottom',
      'section-offset-top',
      'section-depth'
    );
  }

  inputs.forEach((inputId) => {
    const input = document.getElementById(inputId);
    if (input) {
      const handler = () => {
        const offsets = {};
        let newDepth = 0;
        if (wallName === 'front' || wallName === 'back') {
          let rawLeft = parseFloat(
            document.getElementById('section-offset-left')?.value || '0'
          );
          let rawRight = parseFloat(
            document.getElementById('section-offset-right')?.value || '0'
          );

          // Для приставных секций на задней/передней стене (corner-*-back / corner-*-front)
          //     ""   ,  .
          if (wallName === 'back') {
            const backCornerBase = getBackAttachedCornerBase(sectionData);
            if (backCornerBase) {
              if (backCornerBase.sideKey === 'left') {
                rawLeft += backCornerBase.baseCm;
              } else if (backCornerBase.sideKey === 'right') {
                rawRight += backCornerBase.baseCm;
              }
            }
          } else if (wallName === 'front') {
            const frontCornerBase = getFrontAttachedCornerBase(sectionData);
            if (frontCornerBase) {
              // Для front: мировые "left/right" инверсированы относительно полей формы.
              if (frontCornerBase.sideKey === 'left') {
                rawRight += frontCornerBase.baseCm;
              } else if (frontCornerBase.sideKey === 'right') {
                rawLeft += frontCornerBase.baseCm;
              }
            }
          }

          //  front:     swap
          offsets.left = wallName === 'front' ? rawRight : rawLeft;
          offsets.right = wallName === 'front' ? rawLeft : rawRight;
          offsets.bottom = parseFloat(
            document.getElementById('section-offset-bottom')?.value || '0'
          );
          offsets.top = parseFloat(
            document.getElementById('section-offset-top')?.value || '0'
          );
          newDepth = parseFloat(
            document.getElementById('section-depth')?.value || '60'
          );
        } else {
          // Для приставной правой L‑секции в модалке только section-offset-back; для приставной левой — поля отступа слева нет.
          const isCornerRightLive =
            sectionData &&
            sectionData.lShape &&
            getLShapeTypeKey(sectionData) === 'corner-back-right' &&
            sectionData.lShape.role === 'right' &&
            wallName === 'right';
          const isCornerLeftLive =
            sectionData &&
            sectionData.lShape &&
            getLShapeTypeKey(sectionData) === 'corner-back-left' &&
            sectionData.lShape.role === 'left' &&
            wallName === 'left';

          if (isCornerRightLive) {
            offsets.front = (sectionData.offsets && sectionData.offsets.frontMm || 0) / 10;
            offsets.back = parseFloat(
              document.getElementById('section-offset-back')?.value || '0'
            );
          } else if (isCornerLeftLive) {
            offsets.front = (sectionData.offsets && sectionData.offsets.frontMm || 0) / 10;
            offsets.back = (sectionData.offsets && sectionData.offsets.backMm || 0) / 10;
          } else {
            offsets.front = parseFloat(
              document.getElementById('section-offset-front')?.value || '0'
            );
            offsets.back = parseFloat(
              document.getElementById('section-offset-back')?.value || '0'
            );
          }
          offsets.bottom = parseFloat(
            document.getElementById('section-offset-bottom')?.value || '0'
          );
          offsets.top = parseFloat(
            document.getElementById('section-offset-top')?.value || '0'
          );
          newDepth = parseFloat(
            document.getElementById('section-depth')?.value || '60'
          );
        }

        let newWidth;
        let newHeight;
        let newDepthMm;
        newDepthMm = newDepth * 10;

        if (wallName === 'front' || wallName === 'back') {
          newWidth =
            state.room.width -
            offsets.left * 10 -
            offsets.right * 10;
          newHeight =
            state.room.height -
            offsets.bottom * 10 -
            offsets.top * 10;
        } else if (wallName === 'left' || wallName === 'right') {
          //   :
          // - длина секции вдоль стены = room.depth - front - back (это size.z)
          // - ""    =    ( size.x)
          newWidth =
            state.room.depth -
            offsets.front * 10 -
            offsets.back * 10;
          newHeight =
            state.room.height -
            offsets.bottom * 10 -
            offsets.top * 10;
        }

        if (
          isNaN(newWidth) ||
          isNaN(newHeight) ||
          isNaN(newDepthMm)
        ) {
          console.warn('⚠️ Некорректные вычисленные размеры (NaN):', {
            newWidth,
            newHeight,
            newDepthMm,
            offsets,
            room: {
              width: state.room.width,
              height: state.room.height,
              depth: state.room.depth,
            },
          });
          return;
        }

        addSectionOffsetLabels(sectionData, offsets, wallName);

        if (
          sectionData.id &&
          newWidth > 0 &&
          newHeight > 0 &&
          newDepthMm > 0
        ) {
          sectionData.size =
            wallName === 'left' || wallName === 'right'
              ? { x: newDepthMm, y: newHeight, z: newWidth }
              : { x: newWidth, y: newHeight, z: newDepthMm };
          console.log('🔄     :', {
            sectionId: sectionData.id,
            newSize: sectionData.size,
            wallName: wallName,
            newWidth,
            newHeight,
            newDepthMm,
          });
          updateCabinetMarkersForSection(sectionData.id);
        } else {
          console.warn(
            '⚠️       :',
            {
              sectionId: sectionData.id,
              newWidth,
              newHeight,
              newDepthMm,
              isValid:
                newWidth > 0 && newHeight > 0 && newDepthMm > 0,
            }
          );
        }
      };

      input.addEventListener('input', handler);
      window.offsetLabelsUpdateHandlers.push({
        element: input,
        event: 'input',
        callback: handler,
      });
    }
  });
}

/** Есть накладной фасад (дверь / ящик) — корпус короче ниши на facade_thickness_mm. */
function furnitureGroupHasOverlayFacadeShell(furnitureGroup) {
  const ud = furnitureGroup?.userData || {};
  try {
    const raw = readUserDataClodisRoots(ud) || readUserDataClodisData(ud);
    if (!raw) return false;
    const nodes = Array.isArray(raw) ? raw : [raw];
    return planRootsHaveFacadeShell(nodes);
  } catch (_) {
    return false;
  }
}

/**      ( ).
 * W  : back:+Z, front:−Z, left:+X, right:−X (wall-coords.js).
 *  =    =  W → left:min.x, right:max.x.
 */
export function getFurnitureBackWorldCoord(furnitureGroup, wallName) {
  if (!furnitureGroup) return 0;
  furnitureGroup.updateMatrixWorld(true);
  const bbox = computeFurnitureWorldBBoxNoAo(furnitureGroup);
  const w = String(wallName || 'back').trim().toLowerCase();
  if (w === 'back') return bbox.min.z;
  if (w === 'front') return bbox.max.z;
  if (w === 'left') return bbox.min.x;
  if (w === 'right') return bbox.max.x;
  return bbox.min.z;
}

/**        ( − ,     ). */
export function anchorFurnitureBackWorldCoord(furnitureGroup, wallName, targetBackWorld) {
  if (!furnitureGroup || !Number.isFinite(Number(targetBackWorld))) return;
  const target = Number(targetBackWorld);
  furnitureGroup.updateMatrixWorld(true);
  const current = getFurnitureBackWorldCoord(furnitureGroup, wallName);
  const delta = target - current;
  if (Math.abs(delta) < 0.5) return;
  const w = String(wallName || 'back').trim().toLowerCase();
  if (w === 'back' || w === 'front') {
    furnitureGroup.position.z += delta;
  } else if (w === 'left' || w === 'right') {
    furnitureGroup.position.x += delta;
  }
  furnitureGroup.updateMatrixWorld(true);
}

/**       ( ).
 * left:    (local X≥0); right:    (local X≤0) → back = pos.x.
 */
export function getSectionBackWorldCoord(section, wallName) {
  if (!section?.group?.position || !section?.size) return null;
  const pos = section.group.position;
  const size = section.size;
  const w = String(wallName || section.wallName || 'back').trim().toLowerCase();
  if (w === 'back') return pos.z;
  if (w === 'front') return pos.z - Number(size.z || 0);
  if (w === 'left') return pos.x;
  if (w === 'right') return pos.x;
  return pos.z;
}

/**      (   =  W). */
export function getFurnitureFrontWorldCoord(furnitureGroup, wallName) {
  if (!furnitureGroup) return 0;
  furnitureGroup.updateMatrixWorld(true);
  const bbox = computeFurnitureWorldBBoxNoAo(furnitureGroup);
  const w = String(wallName || 'back').trim().toLowerCase();
  if (w === 'back') return bbox.max.z;
  if (w === 'front') return bbox.min.z;
  if (w === 'left') return bbox.max.x;
  if (w === 'right') return bbox.min.x;
  return bbox.max.z;
}

/**   :    ,    . */
export function anchorFurnitureFrontWorldCoord(furnitureGroup, wallName, targetFrontWorld) {
  if (!furnitureGroup || !Number.isFinite(Number(targetFrontWorld))) return;
  const target = Number(targetFrontWorld);
  furnitureGroup.updateMatrixWorld(true);
  const current = getFurnitureFrontWorldCoord(furnitureGroup, wallName);
  const delta = target - current;
  if (Math.abs(delta) < 0.5) return;
  const w = String(wallName || 'back').trim().toLowerCase();
  if (w === 'back' || w === 'front') {
    furnitureGroup.position.z += delta;
  } else if (w === 'left' || w === 'right') {
    furnitureGroup.position.x += delta;
  }
  furnitureGroup.updateMatrixWorld(true);
}

/**    ()      . */
export function getSectionFacadeFrontWorldCoord(section, wallName) {
  if (!section?.group?.position || !section?.size) return null;
  const pos = section.group.position;
  const size = section.size;
  const w = String(wallName || section.wallName || 'back').trim().toLowerCase();
  if (w === 'back') return pos.z + Number(size.z || 0);
  if (w === 'front') return pos.z - Number(size.z || 0);
  if (w === 'left') return pos.x + Number(size.x || 0);
  if (w === 'right') return pos.x - Number(size.x || 0);
  return pos.z + Number(size.z || 0);
}

/**
 *  /  / customDepth:     W.
 *   ():    .
 *  customDepth ():    ,   .
 *    ( / ):  −16  →     .
 */
export function alignSectionStandaloneFurnitureFront(furnitureGroup, section, wallNameOpt) {
  if (!furnitureGroup || !section) return false;
  const ud = furnitureGroup.userData || {};
  const isStandalone = isLowFurniturePlacementKind(ud.__placementKind);
  const isHung = isWallHungPlacementKind(ud.__placementKind);
  const hasCustomDepth = Number(ud.customDepthMm || 0) > 0;
  if (!isStandalone && !isHung && !hasCustomDepth) return false;
  const wn = wallNameOpt || section.wallName || 'back';

  return withFurnitureDoorSwingsClosedForMeasure(furnitureGroup, () => {
    if (
      isHung ||
      (!hasCustomDepth && furnitureGroupHasOverlayFacadeShell(furnitureGroup))
    ) {
      const back = getSectionBackWorldCoord(section, wn);
      if (back == null) return false;
      anchorFurnitureBackWorldCoord(furnitureGroup, wn, back);
      return true;
    }

    const front = getSectionFacadeFrontWorldCoord(section, wn);
    if (front == null) return false;
    anchorFurnitureFrontWorldCoord(furnitureGroup, wn, front);
    return true;
  });
}

function _relayoutSizeMmClose(a, b, eps = 1) {
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

/** Целевой sectionSize из layout без bbox@scale1 (для fast-path / deferred rebuild). */
function _resolveRelayoutTargetSizeMm(
  grp,
  sectionData,
  layout,
  wallName,
  sectionWidth,
  depthForWall,
  division
) {
  if (!grp || !sectionData) return null;
  const customDepthMm = Number(grp.userData?.customDepthMm || 0) || 0;
  const targetDepthMm =
    customDepthMm > 0 ? Math.min(customDepthMm, depthForWall) : depthForWall;
  const placementKind = grp.userData?.__placementKind || 'floor_in_niche';
  const initialY = Number(grp.userData?.__initialSectionSizeMm?.y || 0);
  const size = sectionData.size || {};

  const segsForScale = layout?.segments || [];
  let _segForScale = segsForScale.find(
    (s) => s.type === 'module' && s.furnitureUuid === grp.uuid
  );
  if (!_segForScale) {
    const zi =
      typeof grp.userData?.zoneIndex === 'number' ? grp.userData.zoneIndex : null;
    if (zi != null) {
      _segForScale = segsForScale.find(
        (s) => s.type === 'module' && s.zoneIndex === zi
      );
    }
  }
  const _partSizeMm = Number(division?.partSize || 0);
  const _initialXmm = Number(grp.userData?.__initialSectionSizeMm?.x || 0);
  const _zoneWidthMm = _segForScale
    ? _segForScale.endU - _segForScale.startU
    : _partSizeMm > 1
      ? _partSizeMm
      : _initialXmm > 1
        ? _initialXmm
        : sectionWidth;
  if (!(_zoneWidthMm > 0) || !(targetDepthMm > 0)) return null;

  const customHeightMm = Number(grp.userData?.customHeightMm || 0) || 0;
  const _catalogTypeStr = (() => {
    const ct = grp.userData?.catalogType;
    return ct != null && String(ct).trim() !== '' ? String(ct).trim() : null;
  })();
  let _sectionStandaloneH = 0;
  if (typeof window !== 'undefined') {
    if (typeof window.__cldGetSectionStandaloneFloorHeight === 'function') {
      _sectionStandaloneH =
        window.__cldGetSectionStandaloneFloorHeight(sectionData, _catalogTypeStr) || 0;
    } else if (
      _catalogTypeStr &&
      typeof window.__cldGetStandaloneHeightForCatalog === 'function'
    ) {
      _sectionStandaloneH =
        window.__cldGetStandaloneHeightForCatalog(sectionData, _catalogTypeStr) || 0;
    }
  }
  if (!_sectionStandaloneH) {
    _sectionStandaloneH = Number(sectionData.standaloneFloorHeightMm || 0) || 0;
  }
  const standaloneHeightMm =
    customHeightMm > 0
      ? customHeightMm
      : _sectionStandaloneH > 0
        ? _sectionStandaloneH
        : initialY > 0
          ? initialY
          : 0;

  if (placementKind === PLACEMENT_KIND.STANDALONE_FLOOR && standaloneHeightMm > 0) {
    return { x: _zoneWidthMm, y: standaloneHeightMm, z: targetDepthMm };
  }

  try {
    const slotMetrics = getSlotVerticalMetrics(sectionData);
    const corpusBodyStored = Math.max(0, Number(grp.userData?.corpusBodyMm || 0) || 0);
    const corpusAntStored = Math.max(0, Number(grp.userData?.corpusAntresolMm || 0) || 0);
    const roleBandStored = corpusBodyStored > 0 || corpusAntStored > 0;
    const bpPlace = Number(sectionData.bottomPlankHeightMm);
    const varsForZones = {
      h_bottom:
        Number.isFinite(bpPlace) && bpPlace >= 0 ? bpPlace : BOTTOM_PLANK_HEIGHT_MM,
      h_top: roleBandStored
        ? Number(grp.userData?.hTopCatalogMm || 0) || 0
        : Number(grp.userData?.hTopCatalogMm ?? (grp.userData?.__layoutZones?.zones?.hTopMm || 0)) ||
          0,
    };
    if (corpusBodyStored > 0) varsForZones.corpus_body_mm = corpusBodyStored;
    if (corpusAntStored > 0) varsForZones.corpus_antresol_mm = corpusAntStored;
    const techStored = Math.max(0, Number(grp.userData?.techZoneMm || 0) || 0);
    if (techStored > 0) varsForZones.tech_zone_mm = techStored;
    const catalogHForZones = isWallHungPlacementKind(placementKind)
      ? Math.max(
          0,
          Number(grp.userData?.customHeightMm) ||
            Number(standaloneHeightMm) ||
            Number(grp.userData?.__initialSectionSizeMm?.y) ||
            0
        )
      : 0;
    const layoutZones = computePlacementVerticalZones(slotMetrics, {
      placementKind,
      variables: varsForZones,
      catalogHeightMm: catalogHForZones,
    });
    const z = layoutZones && layoutZones.zones ? layoutZones.zones : null;
    let roleAwareTotalHeight = null;
    if (z) {
      if (Number.isFinite(Number(z.bodyMm)) && Number(z.bodyMm) > 0) {
        roleAwareTotalHeight =
          Math.max(0, Number(z.bodyMm)) + Math.max(0, Number(z.hTopMm || 0));
      } else if (
        Number.isFinite(Number(z.plinthMm)) ||
        Number.isFinite(Number(z.carcassMm)) ||
        Number.isFinite(Number(z.hTopMm)) ||
        Number.isFinite(Number(z.serviceMm))
      ) {
        roleAwareTotalHeight =
          Math.max(0, Number(z.plinthMm || 0)) +
          Math.max(0, Number(z.carcassMm || 0)) +
          Math.max(0, Number(z.hTopMm || 0)) +
          Math.max(0, Number(z.serviceMm || 0));
      }
    }
    const fallbackTargetHeight = Math.max(
      0,
      (size.y || size.height || 0) -
        TOP_PLANK_HEIGHT_MM -
        (Number.isFinite(Number(sectionData.bottomPlankHeightMm))
          ? Number(sectionData.bottomPlankHeightMm)
          : BOTTOM_PLANK_HEIGHT_MM)
    );
    const targetHeight =
      roleAwareTotalHeight != null ? roleAwareTotalHeight : fallbackTargetHeight;
    if (!(targetHeight > 0)) return null;
    return { x: _zoneWidthMm, y: targetHeight, z: targetDepthMm };
  } catch (_) {
    return null;
  }
}

let _deferredClodisResizeQueue = [];
let _deferredClodisResizeRaf = 0;

function _queueDeferredClodisResize(grp, sectionData, targetSize) {
  if (!grp || !sectionData || !targetSize) return;
  //  job  uuid   target .
  _deferredClodisResizeQueue = _deferredClodisResizeQueue.filter(
    (j) => j.grp !== grp && j.grp?.uuid !== grp.uuid
  );
  _deferredClodisResizeQueue.push({ grp, sectionData, targetSize: { ...targetSize } });
  if (_deferredClodisResizeRaf) return;
  const raf =
    typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame
      : (cb) => setTimeout(cb, 0);
  const pump = () => {
    _deferredClodisResizeRaf = 0;
    const job = _deferredClodisResizeQueue.shift();
    if (!job?.grp || !job.sectionData) {
      if (_deferredClodisResizeQueue.length) {
        _deferredClodisResizeRaf = raf(pump);
      } else {
        try {
          if (typeof window !== 'undefined' && typeof window.__cldScheduleIkeaRoomLightSync === 'function') {
            window.__cldScheduleIkeaRoomLightSync();
          }
        } catch (_) {}
      }
      return;
    }
    try {
      rebuildFurnitureGroupForSectionResize(job.grp, job.sectionData, job.targetSize);
      try {
        delete job.grp.userData.__cldDeferredResize;
      } catch (_) {}
      job.grp.updateMatrixWorld(true);
      //      fit    ( scale   ).
      try {
        const zi = job.grp.userData?.zoneIndex;
        if (zi != null && Number.isFinite(Number(zi))) {
          fitFurnitureToSectionZone(job.grp, job.sectionData, zi);
        }
      } catch (_) {}
    } catch (e) {
      console.warn('[RELAYOUT-DEFER] rebuild failed', e);
    }
    if (_deferredClodisResizeQueue.length) {
      _deferredClodisResizeRaf = raf(pump);
    } else {
      try {
        if (typeof window !== 'undefined' && typeof window.__cldScheduleIkeaRoomLightSync === 'function') {
          window.__cldScheduleIkeaRoomLightSync();
        }
      } catch (_) {}
    }
  };
  _deferredClodisResizeRaf = raf(pump);
}

function _isGhostFurnitureOverlay(obj) {
  if (!obj) return true;
  const ud = obj.userData || {};
  if (ud.isGhostClodisPrebuild || ud.isGhost) return true;
  let p = obj.parent;
  for (let i = 0; i < 12 && p; i++) {
    if (p.userData?.isGhost || p.userData?.isGhostClodisPrebuild || p.name === 'FurnitureGhost') {
      return true;
    }
    p = p.parent;
  }
  return false;
}

/**
 * Place (onlyUuids): не пересчитывать всю секцию — взять _layoutCache и
 * прописать furnitureUuid на сегмент зоны. Нет кэша → полный computeSectionLayout.
 */
function _layoutCacheForScopedPlace(sectionData, workGroups) {
  const cache = sectionData?._layoutCache;
  const parts = Math.max(0, Math.floor(Number(sectionData?.division?.parts) || 0));
  const moduleSegs = Array.isArray(cache?.segments)
    ? cache.segments.filter((s) => s && s.type === 'module')
    : [];
  const cacheOk =
    cache &&
    moduleSegs.length > 0 &&
    (parts <= 0 || moduleSegs.length >= Math.min(parts, moduleSegs.length));
  if (!cacheOk) {
    return computeSectionLayout(sectionData);
  }
  for (const grp of workGroups || []) {
    if (!grp) continue;
    const zi = Number(grp.userData?.zoneIndex);
    if (!Number.isFinite(zi)) continue;
    const seg = moduleSegs.find((s) => Number(s.zoneIndex) === zi);
    if (seg) seg.furnitureUuid = grp.uuid;
  }
  return cache;
}

/**
 * @param {object} sectionData
 * @param {{ onlyUuids?: string[]|Set<string>|string }} [opts]
 *   onlyUuids — тяжёлый bbox/fit/scale только для этих корней (постановка N-го шкафа).
 *   Полный pass без onlyUuids: смена деления, rebuild, шкаф↔тумба (cap 16 мм).
 */
function updateFurnitureInSection(sectionData, opts = {}) {
  if (!state.scene || !sectionData || !sectionData.group) return;
  const onlyUuids = (() => {
    const raw = opts?.onlyUuids ?? opts?.furnitureLayoutOnlyUuids;
    if (raw == null || raw === '') return null;
    const arr = raw instanceof Set ? [...raw] : Array.isArray(raw) ? raw : [raw];
    const set = new Set(arr.map((u) => String(u || '')).filter(Boolean));
    return set.size ? set : null;
  })();

  // Scoped place: не гоняем ensureFullHeight / mixed-wall на каждый шкаф.
  if (!onlyUuids) {
    try {
      ensureSectionFullHeightForMixedWall(sectionData);
    } catch (e) {
      console.warn('[SECTION] ensureSectionFullHeightForMixedWall', e);
    }
  }

  const wallName = sectionData.wallName || 'back';
  const size = sectionData.size;
  const division = sectionData.division;

  const sectionWidth = (wallName === 'front' || wallName === 'back') ? size.x : size.z;
  const depthForWall = (wallName === 'left' || wallName === 'right') ? size.x : size.z;
  const furnitureGroups = [];
  const seen = new Set();

  if (onlyUuids) {
    // Только нужные корни — без полного traverse секции и без Box3-fallback.
    state.scene.traverse((child) => {
      if (!onlyUuids.has(String(child.uuid))) return;
      if (!child.userData?.isFurniture || seen.has(child)) return;
      if (child.userData.isEndCabinet) return;
      if (_isGhostFurnitureOverlay(child)) return;
      seen.add(child);
      furnitureGroups.push(child);
    });
    for (const child of state.scene.children) {
      if (!onlyUuids.has(String(child.uuid)) || seen.has(child)) continue;
      if (!child?.userData?.isFurniture) continue;
      if (child.userData.isEndCabinet || _isGhostFurnitureOverlay(child)) continue;
      seen.add(child);
      furnitureGroups.push(child);
    }
  } else {
    state.scene.traverse((child) => {
      if (child.userData?.sectionId === sectionData.id && child.userData?.isFurniture && !seen.has(child)) {
        if (child.userData.isEndCabinet) return;
        if (_isGhostFurnitureOverlay(child)) return;
        seen.add(child);
        furnitureGroups.push(child);
      }
    });
    // Fallback: ищем по позиции — мебель без sectionId или scene.children-группы в секции
    for (const child of state.scene.children) {
      if (child === state.room?.group) continue;
      const ud = child.userData || {};
      if (!child.isGroup || seen.has(child) || ud.isSection || ud.isCustomSection) continue;
      if (ud.isEndCabinet) continue;
      if (_isGhostFurnitureOverlay(child)) continue;
      if (
        ud.isSectionTransitionPart ||
        ud.isTopPlankSegment ||
        ud.isTopPlank ||
        ud.isBottomPlank ||
        ud.isSidePlank ||
        ud.isSideOverlay ||
        ud.isSectionFacadeTrim
      ) continue;
      const c = new THREE.Vector3();
      new THREE.Box3().setFromObject(child).getCenter(c);
      if (findSectionAtPosition(c)?.id === sectionData.id) {
        seen.add(child);
        furnitureGroups.push(child);
        child.userData.sectionId = sectionData.id;
        child.userData.isFurniture = true;
      }
    }
  }

  const workGroups = furnitureGroups;
  if (onlyUuids && workGroups.length === 0) return;

  // Place: переиспользуем _layoutCache (деление уже есть). Полный compute — только если кэша нет.
  let layout;
  if (onlyUuids) {
    layout = _layoutCacheForScopedPlace(sectionData, workGroups);
  } else {
    layout = computeSectionLayout(sectionData);
  }
  const transitionGaps =
    division && Number(division.parts || 0) > 0
      ? getSectionZoneTransitionGaps(sectionData.id, wallName, division.parts)
      : [];

  // Полный pass: сброс меток/петель по комнате. Scoped place — не трогаем соседей.
  if (!onlyUuids) {
    if (window.furnitureWidthLabels && Array.isArray(window.furnitureWidthLabels)) {
      window.furnitureWidthLabels.forEach((label) => {
        if (label && label.parentNode) {
          label.parentNode.removeChild(label);
        }
      });
      window.furnitureWidthLabels = [];
    }
    try {
      clearHingeRoleMarkers();
    } catch (_) {}
  }

  const applyScaleToTarget = (grp, targetSize, currentSize, skipAutoRescale) => {
    if (skipAutoRescale) return;
    if (targetSize.x <= 0 || targetSize.y <= 0 || targetSize.z <= 0) return;
    if (currentSize.x < 1 || currentSize.y < 1 || currentSize.z < 1) return;
    const sx = targetSize.x / currentSize.x;
    const sy = targetSize.y / currentSize.y;
    const sz = targetSize.z / currentSize.z;
    if (sx > 1.3 || sx < 0.7) {
      console.warn('[SCALE-X-JUMP]', {
        uuid: grp.uuid,
        sx: Number(sx.toFixed(3)),
        targetXmm: Math.round(targetSize.x),
        currentXmm: Math.round(currentSize.x),
      });
    }
    grp.scale.set(sx, sy, sz);
  };

  for (const grp of workGroups) {
    if (grp.userData?.isEndCabinet) {
      // Вне зон ряда: размер/посадка через syncEndCabinetsAfterSectionUpdate (rebuild).
      continue;
    }
    // Копия placePendingFurniture: bbox при scale=1, итоговый scale = target/current (не *=).
    const savedPos = grp.position.clone();
    const savedRot = grp.rotation.clone();
    const savedScale = grp.scale.clone();

    const customDepthMmEarly = Number(grp.userData?.customDepthMm || 0) || 0;
    const placementKindEarly = grp.userData?.__placementKind || 'floor_in_niche';
  /** Шкаф в нише: глубина через uniform-scale (scene-icons), не сбрасывать scale.z при relayout. */
    const preserveNicheCustomDepth =
      customDepthMmEarly > 0 &&
      placementKindEarly !== PLACEMENT_KIND.STANDALONE_FLOOR;

    let targetSize = null;
    let currentSize = null;
    const skipAutoRescale = grp.userData?.__cldSkipSectionAutoRescale === true;

    // Как в рабочей копии «2.4 перед правкой»: без RELAYOUT-SKIP / deferred.
    // Каждый relayout → rebuild Clodis под ширину зоны (синяя линия → линия).
    // Fast-path оставлял cabW ≈ zoneW−8 → щели / наезды при 3-м шкафе.
    if (preserveNicheCustomDepth) {
      grp.position.copy(savedPos);
      grp.rotation.copy(savedRot);
      grp.scale.copy(savedScale);
      grp.updateMatrixWorld(true);
    } else {
    grp.position.set(0, 0, 0);
    grp.rotation.set(0, 0, 0);
    grp.scale.set(1, 1, 1);
    grp.updateMatrixWorld(true);

    // ВАЖНО: не учитываем WallContactAO (оно шире шкафа на ~8%),
    //        zone.partSize →   .
    // Только geometry mesh (без потомков-петель) — иначе currentSize.x раздут на ~7 мм.
    const bbox = (() => {
      const out = new THREE.Box3();
      let has = false;
      try {
        grp.traverse((obj) => {
          if (shouldExcludeMeshFromFurnitureBBox(obj)) return;
          if (!obj.isMesh || !obj.geometry) return;
          const geom = obj.geometry;
          if (!geom.boundingBox) geom.computeBoundingBox();
          const bb = geom.boundingBox;
          if (!bb || bb.isEmpty()) return;
          const b = new THREE.Box3();
          const wp = obj.matrixWorld;
          const c = new THREE.Vector3();
          for (let ix = 0; ix <= 1; ix++) {
            for (let iy = 0; iy <= 1; iy++) {
              for (let iz = 0; iz <= 1; iz++) {
                c.set(
                  ix ? bb.max.x : bb.min.x,
                  iy ? bb.max.y : bb.min.y,
                  iz ? bb.max.z : bb.min.z
                ).applyMatrix4(wp);
                b.expandByPoint(c);
              }
            }
          }
          if (b.isEmpty()) return;
          if (!has) {
            out.copy(b);
            has = true;
          } else out.union(b);
        });
      } catch (e) {}
      if (!has) out.setFromObject(grp);
      return out;
    })();
    currentSize = {
      x: bbox.max.x - bbox.min.x,
      y: bbox.max.y - bbox.min.y,
      z: bbox.max.z - bbox.min.z,
    };

    if (currentSize.x < 1 || currentSize.y < 1 || currentSize.z < 1) {
      grp.position.copy(savedPos);
      grp.rotation.copy(savedRot);
      grp.scale.copy(savedScale);
      continue;
    }

    // Clodis: local x=ширина вдоль стены, z=глубина.
    const customDepthMm = Number(grp.userData?.customDepthMm || 0) || 0;
    const targetDepthMm =
      customDepthMm > 0 ? Math.min(customDepthMm, depthForWall) : depthForWall;

    const placementKind = grp.userData?.__placementKind || 'floor_in_niche';
    const initialY = Number(grp.userData?.__initialSectionSizeMm?.y || 0);

    // Per-zone width: сегмент по uuid → по zoneIndex → partSize → ширина посадки → секция.
    //    uuid     →    3+ .
    const segsForScale = layout.segments || [];
    let _segForScale = segsForScale.find(
      (s) => s.type === 'module' && s.furnitureUuid === grp.uuid
    );
    if (!_segForScale) {
      const zi =
        typeof grp.userData?.zoneIndex === 'number' ? grp.userData.zoneIndex : null;
      if (zi != null) {
        _segForScale = segsForScale.find(
          (s) => s.type === 'module' && s.zoneIndex === zi
        );
      }
    }
    const _partSizeMm = Number(division?.partSize || 0);
    const _initialXmm = Number(grp.userData?.__initialSectionSizeMm?.x || 0);
    // Спец L: всегда sp.moduleWidth (§6.8.3), иначе шаг 5 / transitions раздувают до стены.
    let _zoneWidthMm = 0;
    const _zi =
      typeof grp.userData?.zoneIndex === 'number' ? grp.userData.zoneIndex : null;
    const _specialZi = getLShapeSpecialZoneIndex(sectionData);
    if (
      _specialZi != null &&
      _zi != null &&
      Number(_zi) === Number(_specialZi) &&
      division
    ) {
      const sp = getLShapeSpecialSnapBounds(division);
      if (sp?.moduleWidth > 0) _zoneWidthMm = sp.moduleWidth;
    }
    if (!(_zoneWidthMm > 0)) {
      _zoneWidthMm = _segForScale
        ? _segForScale.endU - _segForScale.startU
        : _partSizeMm > 1
          ? _partSizeMm
          : _initialXmm > 1
            ? _initialXmm
            : sectionWidth;
    }

    if (typeof window !== 'undefined' && window.__CLD_DEBUG_REBUILD === true) {
      console.warn('[RELAYOUT-WIDTH]', {
        uuid: grp.uuid,
        zoneWidthMm: Math.round(_zoneWidthMm),
        hasSeg: !!_segForScale,
        zoneIndex: grp.userData?.zoneIndex,
        partSizeMm: Math.round(_partSizeMm),
        sectionWidthMm: Math.round(sectionWidth),
        initialXmm: Math.round(_initialXmm),
        currentWidthMm: Math.round(currentSize.x),
        isEndCab: !!grp.userData?.isEndCabinet,
      });
    }

    // Standalone ():    / ,
    //      Y  .
    const customHeightMm = Number(grp.userData?.customHeightMm || 0) || 0;
    const _catalogTypeStr = (() => {
      const ct = grp.userData?.catalogType;
      return ct != null && String(ct).trim() !== '' ? String(ct).trim() : null;
    })();
    let _sectionStandaloneH = 0;
    if (typeof window !== 'undefined') {
      if (typeof window.__cldGetSectionStandaloneFloorHeight === 'function') {
        _sectionStandaloneH =
          window.__cldGetSectionStandaloneFloorHeight(sectionData, _catalogTypeStr) || 0;
      } else if (
        _catalogTypeStr &&
        typeof window.__cldGetStandaloneHeightForCatalog === 'function'
      ) {
        _sectionStandaloneH =
          window.__cldGetStandaloneHeightForCatalog(sectionData, _catalogTypeStr) || 0;
      }
    }
    if (!_sectionStandaloneH) {
      _sectionStandaloneH = Number(sectionData.standaloneFloorHeightMm || 0) || 0;
    }
    const standaloneHeightMm =
      customHeightMm > 0
        ? customHeightMm
        : _sectionStandaloneH > 0
          ? _sectionStandaloneH
          : initialY > 0
            ? initialY
            : 0;
    if (placementKind === PLACEMENT_KIND.STANDALONE_FLOOR && standaloneHeightMm > 0) {
      targetSize = { x: _zoneWidthMm, y: standaloneHeightMm, z: targetDepthMm };
      if (targetSize.x <= 0 || targetSize.y <= 0 || targetSize.z <= 0) {
        grp.position.copy(savedPos);
        grp.rotation.copy(savedRot);
        grp.scale.copy(savedScale);
        continue;
      }
      const clodisRebuild =
        skipAutoRescale && grp.userData?.__clodisDataForBuild;
      let clodisResized = false;
      if (clodisRebuild) {
        clodisResized = rebuildFurnitureGroupForSectionResize(
          grp,
          sectionData,
          targetSize
        );
        if (!clodisResized) {
          console.warn('[SECTION-RESIZE] Clodis rebuild failed (standalone), scale fallback', {
            uuid: grp.uuid,
            targetSize,
          });
        }
      }
      if (!clodisResized) {
        const blockScale =
          skipAutoRescale && placementKind !== PLACEMENT_KIND.STANDALONE_FLOOR;
        applyScaleToTarget(grp, targetSize, currentSize, blockScale);
      }
      grp.rotation.copy(savedRot);
    } else {
      // Для role-based шкафов (plinth/corpus/top) высота должна считаться как в placePendingFurniture:
      // через layoutZones, а не как raw-top-bottom. Иначе корпус «не дотягивается» при изменении отступов.
      const slotMetrics = getSlotVerticalMetrics(sectionData);
      const corpusBodyStored = Math.max(0, Number(grp.userData?.corpusBodyMm || 0) || 0);
      const corpusAntStored = Math.max(0, Number(grp.userData?.corpusAntresolMm || 0) || 0);
      const roleBandStored = corpusBodyStored > 0 || corpusAntStored > 0;
      const bpPlace = Number(sectionData.bottomPlankHeightMm);
      const varsForZones = {
        h_bottom:
          Number.isFinite(bpPlace) && bpPlace >= 0 ? bpPlace : BOTTOM_PLANK_HEIGHT_MM,
        h_top:
          roleBandStored
            ? Number(grp.userData?.hTopCatalogMm || 0) || 0
            : Number(grp.userData?.hTopCatalogMm ?? (grp.userData?.__layoutZones?.zones?.hTopMm || 0)) ||
              0,
      };
      if (corpusBodyStored > 0) varsForZones.corpus_body_mm = corpusBodyStored;
      if (corpusAntStored > 0) varsForZones.corpus_antresol_mm = corpusAntStored;
      const techStored = Math.max(0, Number(grp.userData?.techZoneMm || 0) || 0);
      if (techStored > 0) varsForZones.tech_zone_mm = techStored;
      const catalogHForZones = isWallHungPlacementKind(placementKind)
        ? Math.max(
            0,
            Number(grp.userData?.customHeightMm) ||
              Number(standaloneHeightMm) ||
              Number(grp.userData?.__initialSectionSizeMm?.y) ||
              0
          )
        : 0;
      const layoutZones = computePlacementVerticalZones(slotMetrics, {
        placementKind,
        variables: varsForZones,
        catalogHeightMm: catalogHForZones,
      });
      if (grp.userData) {
        grp.userData.__layoutZones = layoutZones;
      }
      const z = layoutZones && layoutZones.zones ? layoutZones.zones : null;
      let roleAwareTotalHeight = null;
      if (z) {
        if (Number.isFinite(Number(z.bodyMm)) && Number(z.bodyMm) > 0) {
          // wall_hung / corpus_only
          roleAwareTotalHeight =
            Math.max(0, Number(z.bodyMm)) + Math.max(0, Number(z.hTopMm || 0));
        } else if (
          Number.isFinite(Number(z.plinthMm)) ||
          Number.isFinite(Number(z.carcassMm)) ||
          Number.isFinite(Number(z.hTopMm)) ||
          Number.isFinite(Number(z.serviceMm))
        ) {
          roleAwareTotalHeight =
            Math.max(0, Number(z.plinthMm || 0)) +
            Math.max(0, Number(z.carcassMm || 0)) +
            Math.max(0, Number(z.hTopMm || 0)) +
            Math.max(0, Number(z.serviceMm || 0));
        }
      }
      const fallbackTargetHeight = Math.max(
        0,
        (size.y || size.height || 0) -
          resolveSectionTopPlankHeightMm(sectionData) -
          (Number.isFinite(Number(sectionData.bottomPlankHeightMm))
            ? Number(sectionData.bottomPlankHeightMm)
            : BOTTOM_PLANK_HEIGHT_MM)
      );
      const targetHeight = roleAwareTotalHeight != null ? roleAwareTotalHeight : fallbackTargetHeight;

      targetSize = { x: _zoneWidthMm, y: targetHeight, z: targetDepthMm };

      if (targetSize.x <= 0 || targetSize.y <= 0 || targetSize.z <= 0) {
        grp.position.copy(savedPos);
        grp.rotation.copy(savedRot);
        grp.scale.copy(savedScale);
        continue;
      }
      const clodisRebuild =
        (skipAutoRescale || grp.userData?.__cldFillerHeightResync) &&
        grp.userData?.__clodisDataForBuild;
      let clodisResized = false;
      if (clodisRebuild) {
        clodisResized = rebuildFurnitureGroupForSectionResize(
          grp,
          sectionData,
          targetSize,
          { force: true }
        );
        if (!clodisResized) {
          console.warn('[SECTION-RESIZE] Clodis rebuild failed (niche), scale fallback', {
            uuid: grp.uuid,
            targetSize,
          });
        }
      }
      if (!clodisResized) {
        const blockScale = skipAutoRescale && !grp.userData?.__cldFillerHeightResync;
        applyScaleToTarget(grp, targetSize, currentSize, blockScale);
      }
      grp.rotation.copy(savedRot);
    }
    } // else !preserveNicheCustomDepth

    // Position furniture using the authoritative layout segments.
    if (division && division.sectionStart != null && division.partSize != null) {
      // Find the pre-computed segment for this furniture item.
      const seg = (layout.segments || []).find(
        (s) => s.type === 'module' && s.furnitureUuid === grp.uuid
      );

      let zoneStart, zoneEnd, zoneIndex;
      if (seg) {
        // Authoritative path: use exact U-coordinates from layout.
        zoneStart = seg.startU;
        zoneEnd   = seg.endU;
        zoneIndex = seg.zoneIndex;
      } else {
        // Fallback: L-shape или нет furnitureUuid на сегменте — границы зоны из _layoutCache.
        zoneIndex = typeof grp.userData?.zoneIndex === 'number'
          ? grp.userData.zoneIndex
          : 0;
        const modSegByZone = (layout.segments || []).find(
          (s) => s.type === 'module' && s.zoneIndex === zoneIndex
        );
        if (modSegByZone) {
          zoneStart = modSegByZone.startU;
          zoneEnd = modSegByZone.endU;
        } else {
          if (zoneIndex == null) {
            const axisCoord =
              wallName === 'front' || wallName === 'back' ? savedPos.x : savedPos.z;
            const rawIndex = Math.floor(
              (axisCoord - division.sectionStart) / Math.max(1, division.partSize)
            );
            zoneIndex = Math.max(0, Math.min(rawIndex, division.parts - 1));
          }
          const widths = layout.moduleWidthsMm || [];
          let u = division.sectionStart;
          for (let zi = 0; zi < zoneIndex; zi++) {
            const wPrev = widths[zi] != null ? widths[zi] : division.partSize;
            u += wPrev;
            if (transitionGaps[zi + 1] > 0) u += transitionGaps[zi + 1];
          }
          zoneStart = u;
          const wz = widths[zoneIndex] != null ? widths[zoneIndex] : division.partSize;
          zoneEnd = zoneStart + wz;
        }
      }

      grp.userData = grp.userData || {};
      grp.userData.zoneIndex = zoneIndex;

      // Remove furniture that no longer fits within the section (тумба без зоны — из комнаты).
      if (typeof zoneIndex !== 'number' || zoneIndex < 0 || zoneIndex >= division.parts) {
        _removeFurnitureGroupsFromRoom([grp], sectionData);
        continue;
      }

      const zoneWidthMm = Math.max(0, zoneEnd - zoneStart);
      // Door-pair rebuild ДО fit: после swap local-origin другой, без повторной
      //     ~7  (      ).
      try {
        tryApplyDoorPairCatalogSwap(grp, sectionData, layout);
      } catch (e) {
        console.warn('[door-pair] swap check', e);
      }
      const pivotCoord = wallName === 'left' || wallName === 'front' ? zoneEnd : zoneStart;
      const snap = {
        pivotCoord,
        zoneIndex,
        moduleWidth: zoneWidthMm > 0 ? zoneWidthMm : division.partSize,
      };
      const zonePos = getZonePivotWorldPosition(sectionData, snap, wallName);
      grp.position.copy(zonePos);
      if (_pivotTraceOn()) {
        logFurniturePivotTrace('relayout:after_zonePos', grp, {
          wallName,
          zoneStart,
          zoneEnd,
          section: sectionData,
          extra: { pivotCoord: _r1(pivotCoord) },
        });
      }
      const fitOpts = {
        zoneIndex,
        partsCount: division.parts,
      };
      _placeFurnitureInZone(grp, sectionData, zoneStart, zoneEnd, wallName, zoneWidthMm, fitOpts);
      if (_pivotTraceOn()) {
        logFurniturePivotTrace('relayout:after_place', grp, {
          wallName,
          zoneStart,
          zoneEnd,
          section: sectionData,
        });
      }

      // Debug: verify cabinet bbox aligns with zone edges (solid lines).
      // Enable via: window.DEBUG_CAP_ALIGNMENT = true
      if (typeof window !== 'undefined' && window.DEBUG_CAP_ALIGNMENT === true) {
        try {
          window.__DEBUG_CAP_ALIGNMENT_LOGGED =
            window.__DEBUG_CAP_ALIGNMENT_LOGGED || new Set();
          const key = `${sectionData.id}|${wallName}|${grp.uuid}|${zoneIndex}`;
          if (!window.__DEBUG_CAP_ALIGNMENT_LOGGED.has(key)) {
            window.__DEBUG_CAP_ALIGNMENT_LOGGED.add(key);

            const bbox = computeFurnitureWorldBBoxNoAo(grp);
            const axis = wallName === 'left' || wallName === 'right' ? 'z' : 'x';
            const bboxMinU = axis === 'x' ? bbox.min.x : bbox.min.z;
            const bboxMaxU = axis === 'x' ? bbox.max.x : bbox.max.z;
            const cabinetWidthU = bboxMaxU - bboxMinU;
            const zoneWidthU = zoneEnd - zoneStart;
            const sectionWidthU = (wallName === 'left' || wallName === 'right')
              ? Number(sectionData?.size?.z || 0)
              : Number(sectionData?.size?.x || 0);
            const sectionStartU = Number(division.sectionStart || 0);
            const sectionEndU =
              sectionStartU +
              Number(division.partSize || 0) * Number(division.parts || 0) +
              cumulativeTransitionGapMm(transitionGaps, division.parts);

            const wallKey = String(wallName || '').trim().toLowerCase();
            const capList = state?.capBoundaries instanceof Map
              ? state.capBoundaries.get(wallKey) || []
              : [];
            const capForSection = capList.filter((c) => c && c.sectionId === sectionData.id);

            console.log('[CAP-ALIGN]', {
              sectionId: sectionData.id,
              wallName,
              axisU: axis,
              division: {
                sectionStart: division.sectionStart,
                partSize: division.partSize,
                parts: division.parts,
              },
              transitionGaps,
              zoneIndex,
              zoneStart,
              zoneEnd,
              pivotCoord,
              expectedEdges: { start: zoneStart, end: zoneEnd },
              bboxEdgesU: { min: bboxMinU, max: bboxMaxU },
              realSizesMm: {
                sectionWidthU,
                sectionStartU,
                sectionEndU,
                zoneWidthU,
                cabinetWidthU,
                deltaCabinetFromZoneStart: bboxMinU - zoneStart,
                deltaCabinetToZoneEnd: zoneEnd - bboxMaxU,
              },
              capBoundaries: capForSection.map((c) => ({ start: c.capStartU, end: c.capEndU })),
              grpPosition: { x: grp.position.x, y: grp.position.y, z: grp.position.z },
            });
          }
        } catch (e) {
          console.warn('[CAP-ALIGN] debug error', e);
        }
      }

    } else {
      //       (  ).
      grp.position.copy(sectionData.group.position);
    }

    grp.updateMatrixWorld(true);

    // Detailed runtime log (expensive bbox)  only ?placeDbg=1
    if (typeof window !== 'undefined' && window.__CLD_DEBUG_PLACE === true) {
      try {
        const b2 = computeFurnitureWorldBBoxNoAo(grp);
        const axisU = wallName === 'left' || wallName === 'right' ? 'z' : 'x';
        const minU = axisU === 'x' ? b2.min.x : b2.min.z;
        const maxU = axisU === 'x' ? b2.max.x : b2.max.z;
        const seg = (layout.segments || []).find(
          (s) => s.type === 'module' && s.furnitureUuid === grp.uuid
        );
        console.log('[LAYOUT-RECALC][FURNITURE]', {
          sectionId: sectionData.id,
          wallName,
          furniture: grp.name || '(group)',
          uuid: grp.uuid,
          placementKind: grp.userData?.__placementKind,
          zoneIndex: grp.userData?.zoneIndex,
          targetSizeMm: targetSize,
          actualSizeMm: {
            widthU: maxU - minU,
            height: b2.max.y - b2.min.y,
            depthW: axisU === 'x' ? (b2.max.z - b2.min.z) : (b2.max.x - b2.min.x),
          },
          actualEdgesU: { minU, maxU },
          expectedZoneFromLayout: seg
            ? { startU: seg.startU, endU: seg.endU, widthMm: seg.endU - seg.startU }
            : null,
        });
      } catch (e) {
        console.warn('[LAYOUT-RECALC][FURNITURE] log error', e);
      }
    }

    //  :  ,    + wallHungFloorClearanceMm.
    // ВАЖНО: НЕ используем secBox.min.y (bbox геометрии секции) — она может выходить
    //       ,    .
    try {
      const roomWorldPos = new THREE.Vector3();
      if (state.room && state.room.group) {
        state.room.group.getWorldPosition(roomWorldPos);
      }
      let targetBottomY = roomWorldPos.y;
      const pkAlign = String(grp.userData?.__placementKind || '');
      if (isWallHungPlacementKind(pkAlign)) {
        const m = getSlotVerticalMetrics(sectionData);
        const bodyH = Math.max(
          1,
          Number(grp.userData?.customHeightMm) ||
            Number(grp.userData?.__layoutZones?.zones?.bodyMm) ||
            Number(grp.userData?.__initialSectionSizeMm?.y) ||
            0
        );
        if (isWallHungHighPlacementKind(pkAlign)) {
          const topY =
            roomWorldPos.y +
            Math.max(0, Number(m.rawHeightMm) || 0) -
            Math.max(0, Number(m.topPlankMm) || 0) -
            Math.max(0, Number(m.ceilingClearanceMm) || 0);
          targetBottomY = topY - bodyH;
        } else {
          targetBottomY =
            roomWorldPos.y + Math.max(0, resolveWallHungFloorClearanceMm(grp, sectionData));
        }
      }
      const bboxMinY = getFurnitureFloorContactWorldYNoAo(grp);
      const tol = 1;
      const dbg =
        typeof window !== 'undefined' &&
        window.DEBUG_NICHE_Y === true;
      if (dbg) {
        const bboxNoAo = computeFurnitureWorldBBoxNoAo(grp);
        const bboxFull = new THREE.Box3().setFromObject(grp);
        console.log('[NICHE-Y] updateFurnitureInSection', {
          sectionId: sectionData.id,
          roomFloorY: roomWorldPos.y,
          targetBottomY,
          placementKind: grp.userData?.__placementKind,
          floorContactY: bboxMinY,
          bboxMinY_wholeNoAo: bboxNoAo.min.y,
          bboxMinY_full: bboxFull.min.y,
        });
      }
      if (Math.abs(bboxMinY - targetBottomY) > tol) {
        const d = targetBottomY - bboxMinY;
        grp.position.y += d;
        grp.updateMatrixWorld(true);
        if (dbg) {
          console.log('[NICHE-Y] updateFurnitureInSection correction Y +=', d, {
            floorContactY_after: getFurnitureFloorContactWorldYNoAo(grp),
            bboxMinY_wholeNoAo_after: computeFurnitureWorldBBoxNoAo(grp).min.y,
          });
        }
      }
    } catch (_) {}

    if (typeof window !== 'undefined' && window.__CLD_DEBUG_PLACE === true) {
      console.log(
        skipAutoRescale
          ? '📐 Мебель: зона/позиция без uniform-scale (Clodis/конструктор, __cldSkipSectionAutoRescale):'
          : '📐      (  ):',
        {
          sectionId: sectionData.id,
          skipAutoRescale: !!skipAutoRescale,
          targetSize,
          currentSize,
          scale: grp.scale.toArray(),
        }
      );

      //   :     .
      try {
        const widthMm = Math.round(targetSize.x);
        const bboxWorld = new THREE.Box3().setFromObject(grp);
        const center = bboxWorld.getCenter(new THREE.Vector3());
        const topPos = new THREE.Vector3(center.x, bboxWorld.max.y + 50, center.z);

        if (!window.furnitureWidthLabels) {
          window.furnitureWidthLabels = [];
        }

        const label = createDimensionLabel(
          `${widthMm} `,
          topPos,
          'section-dimension-label furniture-width-label'
        );
        if (label) {
          label.userData.furnitureGroup = grp;
          window.furnitureWidthLabels.push(label);
        }
      } catch (e) {
        console.warn('⚠️      :', e);
      }
    }
  }

  try {
    if (!onlyUuids) {
      refreshAllHingeRoleMarkersInRoom();
    }
    // Place: маркеры петель уже mount в placePendingFurniture — не дублируем.
  } catch (e) {
    console.warn('[updateFurnitureInSection] hinge role markers', e);
  }

  if (
    !onlyUuids &&
    typeof window.scheduleRebuildAllDimensionLines === 'function' &&
    (window.showAllDimensionLabels || window.showFurnitureDimensionLabels)
  ) {
    window.scheduleRebuildAllDimensionLines();
  }

  // Маркеры/зоны: при place деление не меняется — skip. Полный pass после смены деления.
  if (
    !onlyUuids &&
    sectionData.division &&
    Number(sectionData.division.parts || 0) > 0
  ) {
    try {
      updateCabinetMarkersForSection(sectionData.id);
    } catch (e) {
      console.warn('[updateFurnitureInSection] updateCabinetMarkersForSection', e);
    }
    try {
      createSectionZones(sectionData);
    } catch (e) {
      console.warn('[updateFurnitureInSection] createSectionZones', e);
    }
  }

  //   /:    layout   .
  // Geom-relayout всегда полный (без onlyUuids). При place (onlyUuids) не раздуваем
  // scoped pass во второй полный — иначе снова O(n) на N-й шкаф.
  if (sectionData._sectionGeomRelayoutPending && !sectionData._furnitureLayoutSecondPass) {
    delete sectionData._sectionGeomRelayoutPending;
    if (!onlyUuids) {
      sectionData._furnitureLayoutSecondPass = true;
      updateFurnitureInSection(sectionData);
      delete sectionData._furnitureLayoutSecondPass;
    }
  }

  /**
   * Studio: place уже bind'ит новый шкаф; onlyUuids — skip (соседи уже на IKEA).
   *  pass /   ForRoots  .
   */
  if (!onlyUuids) {
    try {
      const studioSectionId = sectionData?.id;
      if (typeof window.__cldSyncRoomCabinetStudioForRoots === 'function') {
        window.__cldSyncRoomCabinetStudioForRoots(furnitureGroups, {
          sectionId: studioSectionId,
        });
      } else if (
        studioSectionId != null &&
        studioSectionId !== '' &&
        typeof window.__cldSyncRoomCabinetStudioForSection === 'function'
      ) {
        window.__cldSyncRoomCabinetStudioForSection(studioSectionId);
      } else if (typeof window.__cldSyncAllRoomCabinetStudio === 'function') {
        window.__cldSyncAllRoomCabinetStudio();
      }
    } catch (_) {}
  } else {
    try {
      if (typeof window.__cldScheduleIkeaRoomLightSync === 'function') {
        window.__cldScheduleIkeaRoomLightSync();
      }
    } catch (_) {}
  }

  try {
    if (onlyUuids) {
      const segs = (layout.segments || []).filter((s) => s && s.type === 'module');
      for (const grp of workGroups) {
        if (!grp?.userData?.isFurniture || grp.userData.isEndCabinet) continue;
        if (String(grp.userData?.__placementKind || '') === PLACEMENT_KIND.STANDALONE_FLOOR) {
          continue;
        }
        const zi = Number(grp.userData.zoneIndex);
        const seg =
          segs.find((s) => s.furnitureUuid === grp.uuid) ||
          segs.find((s) => s.zoneIndex === zi) ||
          null;
        if (!seg) continue;
        _snapNicheWorldBBoxToZone(grp, Number(seg.startU), Number(seg.endU), wallName);
      }
    } else {
      _snapAllNicheFurnitureInSectionToZones(sectionData, wallName, layout);
    }
  } catch (e) {
    console.warn('[ZONE-FIT] final niche snap', e);
  }
  //  async /GLB bbox    +7     .
  try {
    const secRef = sectionData;
    const wallRef = wallName;
    const onlyRef = onlyUuids ? [...onlyUuids] : null;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          if (!secRef?.id) return;
          const lay =
            secRef._layoutCache && Array.isArray(secRef._layoutCache.segments)
              ? secRef._layoutCache
              : computeSectionLayout(secRef);
          if (onlyRef && onlyRef.length) {
            const segs = (lay.segments || []).filter((s) => s && s.type === 'module');
            const want = new Set(onlyRef.map(String));
            state.scene?.traverse((grp) => {
              if (!grp?.userData?.isFurniture || !want.has(String(grp.uuid))) return;
              if (grp.userData.sectionId !== secRef.id) return;
              if (String(grp.userData?.__placementKind || '') === PLACEMENT_KIND.STANDALONE_FLOOR) {
                return;
              }
              const zi = Number(grp.userData.zoneIndex);
              const seg =
                segs.find((s) => s.furnitureUuid === grp.uuid) ||
                segs.find((s) => s.zoneIndex === zi) ||
                null;
              if (!seg) return;
              _snapNicheWorldBBoxToZone(grp, Number(seg.startU), Number(seg.endU), wallRef);
            });
          } else {
            _snapAllNicheFurnitureInSectionToZones(secRef, wallRef, lay);
          }
        } catch (_) {}
      });
    });
  } catch (_) {}
}

/** Cap width in mm  must match SIDE_CAP_W_MM in section-transition-manager.js. */
const _CAP_W_MM = 16;

/**
 *     → HeightMismatch   (16 ).    layout,
 *     ( SideCap  ↔).
 */
function _pairNeedsHangLowSideCoverCap(leftGrp, rightGrp) {
  const leftHang = isWallHungLowPlacementKind(leftGrp?.userData?.__placementKind);
  const rightHang = isWallHungLowPlacementKind(rightGrp?.userData?.__placementKind);
  if (!leftHang && !rightHang) return false;
  try {
    leftGrp?.updateMatrixWorld?.(true);
    rightGrp?.updateMatrixWorld?.(true);
  } catch (_) {}
  const leftBox = computeFurnitureCorpusLayoutWorldBBoxNoAo(leftGrp);
  const rightBox = computeFurnitureCorpusLayoutWorldBBoxNoAo(rightGrp);
  if (!leftBox || leftBox.isEmpty() || !rightBox || rightBox.isEmpty()) return false;
  if (leftHang && leftBox.max.y > rightBox.max.y + 2) return true;
  if (rightHang && rightBox.max.y > leftBox.max.y + 2) return true;
  return false;
}

/** Legacy addCabinetMarkers / findOptimalDivision: мин. ширина однодверного модуля (мм). */
const _DEFAULT_MIN_MODULE_WIDTH_MM = 400;

function _furnitureCenterAlongU(furnitureGroup, axis) {
  if (!furnitureGroup) return 0;
  try {
    furnitureGroup.updateMatrixWorld(true);
    const bbox = computeFurnitureWorldBBoxNoAo(furnitureGroup);
    if (axis === 'x') return (bbox.min.x + bbox.max.x) * 0.5;
    return (bbox.min.z + bbox.max.z) * 0.5;
  } catch (_) {
    return axis === 'x' ? furnitureGroup.position.x : furnitureGroup.position.z;
  }
}

/**
 * После построения segments: привязать zoneIndex по центру bbox к реальным startU/endU.
 */
/**
 *   :   parts →   (  ).
 *            .
 *   (−/+ / strip / variant)  ;    
 * applySectionDivisionVariant / end-cab refresh,    sync.
 */
function _syncPartsToFurnitureOnRelayout(division, furniture, forceRelayout) {
  void furniture;
  void forceRelayout;
  return Math.max(0, Math.floor(Number(division?.parts) || 0));
}

/**      2+      0..parts−1  .
 *  : base+upper  cohabit- (  )   .
 */
function _pkCohabitApi() {
  return typeof window !== 'undefined' ? window.__cldPlacementKindProfiles : null;
}

function _resolveFurnitureCohabitSpec(grp) {
  const api = _pkCohabitApi();
  if (api && typeof api.resolveZoneCohabitSpecFromUserData === 'function') {
    return api.resolveZoneCohabitSpecFromUserData(grp?.userData || {}, null);
  }
  const pk = String(grp?.userData?.__placementKind || '').trim();
  if (pk === PLACEMENT_KIND.STANDALONE_FLOOR || pk === PLACEMENT_KIND.WALL_HUNG_LOW) {
    return { role: 'base', group: 'wall_column' };
  }
  if (pk === PLACEMENT_KIND.WALL_HUNG || pk === PLACEMENT_KIND.WALL_HUNG_HIGH) {
    return { role: 'upper', group: 'wall_column' };
  }
  return { role: 'full', group: '' };
}

function _canFurnitureCohabitPair(a, b) {
  if (!a || !b) return false;
  const api = _pkCohabitApi();
  const sa = _resolveFurnitureCohabitSpec(a);
  const sb = _resolveFurnitureCohabitSpec(b);
  if (api && typeof api.canCohabitInSameZone === 'function') {
    return api.canCohabitInSameZone(sa, sb);
  }
  return false;
}

/**   : 1 ,    base+upper. */
function _zoneOccupantsAllowedTogether(arr) {
  if (!arr || arr.length <= 1) return true;
  if (arr.length > 2) return false;
  return _canFurnitureCohabitPair(arr[0], arr[1]);
}

function _findAssignedOccupantInZone(furniture, assignedZoneByUuid, zoneIndex, excludeUuid) {
  for (const f of furniture) {
    if (excludeUuid && f.uuid === excludeUuid) continue;
    if (assignedZoneByUuid.get(f.uuid) === zoneIndex) return f;
  }
  return null;
}

/** true =   f     z0 (cohabit  ). */
function _canClaimOccupiedZone(f, z0, furniture, assignedZoneByUuid) {
  const occ = _findAssignedOccupantInZone(furniture, assignedZoneByUuid, z0, f.uuid);
  return !!(occ && _canFurnitureCohabitPair(f, occ));
}

function _spreadFurnitureOnePerZone(furniture, parts, axis, assignedZoneByUuid) {
  if (parts <= 0 || furniture.length === 0) return assignedZoneByUuid;
  const byZone = new Map();
  for (const f of furniture) {
    const z = assignedZoneByUuid.get(f.uuid);
    if (typeof z !== 'number') continue;
    if (!byZone.has(z)) byZone.set(z, []);
    byZone.get(z).push(f);
  }
  let collision = false;
  for (const arr of byZone.values()) {
    if (arr.length > 1 && !_zoneOccupantsAllowedTogether(arr)) collision = true;
  }
  if (!collision) return assignedZoneByUuid;
  const sorted = [...furniture].sort((a, b) =>
    axis === 'x' ? a.position.x - b.position.x : a.position.z - b.position.z
  );
  const out = new Map();
  for (let i = 0; i < sorted.length; i++) {
    out.set(sorted[i].uuid, Math.min(i, parts - 1));
  }
  return out;
}

function _assignZonesByModuleSegments(furniture, segments, axis) {
  const modules = (segments || []).filter((s) => s.type === 'module');
  if (!modules.length || !furniture.length) return new Map();
  const out = new Map();
  for (const f of furniture) {
    const centerU = _furnitureCenterAlongU(f, axis);
    let hit = modules.find((m) => centerU >= m.startU && centerU < m.endU);
    if (!hit) {
      let bestD = Infinity;
      for (const m of modules) {
        const mid = (m.startU + m.endU) * 0.5;
        const d = Math.abs(centerU - mid);
        if (d < bestD) {
          bestD = d;
          hit = m;
        }
      }
    }
    if (hit && typeof hit.zoneIndex === 'number') out.set(f.uuid, hit.zoneIndex);
  }
  return out;
}

const _ZONE_U_FIT_EPS_MM = 0.5;

/** Bbox для zone-fit: тумба — корпус; ниша — zoneFit (без петель/ручек), как посадка. */
function _layoutBBoxForZoneFit(furnitureGroup) {
  const pk = String(furnitureGroup?.userData?.__placementKind || '');
  if (isLowFurniturePlacementKind(pk)) {
    return computeFurnitureCorpusLayoutWorldBBoxNoAo(furnitureGroup);
  }
  return computeFurnitureZoneFitWorldBBox(furnitureGroup);
}

/**
 * Чистый snap ниши к краю зоны (тот же bbox, что fit/check).
 *  5     /    bbox.
 */
function _snapNicheWorldBBoxToZone(grp, zoneStart, zoneEnd, wallName) {
  if (!grp || !Number.isFinite(zoneStart) || !Number.isFinite(zoneEnd)) return false;
  if (isLowFurniturePlacementKind(grp.userData?.__placementKind)) return false;
  const w = String(wallName || 'back').trim().toLowerCase();
  const axis = getWallAxes(w).u.axis;
  const pivotAtEnd = w === 'left' || w === 'front';
  let any = false;
  for (let iter = 0; iter < 5; iter++) {
    grp.updateMatrixWorld(true);
    const bbox = computeFurnitureZoneFitWorldBBox(grp);
    const minU = getAxisCoord(bbox.min, axis);
    const maxU = getAxisCoord(bbox.max, axis);
    const delta = pivotAtEnd ? zoneEnd - maxU : zoneStart - minU;
    if (!Number.isFinite(delta) || Math.abs(delta) < 0.5) break;
    if (axis === 'x') grp.position.x += delta;
    else grp.position.z += delta;
    any = true;
  }
  if (any) grp.updateMatrixWorld(true);
  return any;
}

function _snapAllNicheFurnitureInSectionToZones(sectionData, wallName, layout) {
  if (!sectionData || !layout || !state.scene) return;
  const segs = (layout.segments || []).filter((s) => s && s.type === 'module');
  if (!segs.length) return;
  state.scene.traverse((grp) => {
    if (!grp?.userData?.isFurniture || grp.userData.isEndCabinet) return;
    if (grp.userData.sectionId !== sectionData.id) return;
    if (isLowFurniturePlacementKind(grp.userData?.__placementKind)) return;
    const zi = Number(grp.userData.zoneIndex);
    const seg =
      segs.find((s) => s.furnitureUuid === grp.uuid) ||
      segs.find((s) => s.zoneIndex === zi) ||
      null;
    if (!seg) return;
    _snapNicheWorldBBoxToZone(grp, Number(seg.startU), Number(seg.endU), wallName);
  });
}

/**
 *  bbox  .
 * Ниша: пивот стены (back/right → minU, front/left → maxU) — одинаково для всех зон.
 * :    (last→max),  .
 */
function _zoneFitAnchorEdge(zoneIndex, partsCount, wallName, placementKind) {
  if (isLowFurniturePlacementKind(placementKind)) {
    const parts = Math.max(1, Math.floor(Number(partsCount) || 0));
    const zi = Math.max(0, Math.floor(Number(zoneIndex) || 0));
    if (parts <= 1) return 'max';
    if (zi >= parts - 1) return 'max';
    if (zi === 0) return 'min';
    return 'min';
  }
  const w = String(wallName || 'back').trim().toLowerCase();
  return w === 'left' || w === 'front' ? 'max' : 'min';
}

/** Одна посадка в зону. Как 1.46: fit → inner-align → второй fit → snap. */
function _placeFurnitureInZone(grp, sectionData, zoneStart, zoneEnd, wallName, zoneWidthMm, fitOpts) {
  _fitFurnitureBBoxToZoneBounds(grp, zoneStart, zoneEnd, wallName, fitOpts);
  _enforceFurnitureWidthInZone(grp, sectionData, zoneStart, zoneEnd, wallName, zoneWidthMm, fitOpts);
  alignFurnitureBBoxToSectionInnerBounds(grp, sectionData, true);
  alignSectionStandaloneFurnitureFront(grp, sectionData, wallName);
  if (!isLowFurniturePlacementKind(grp.userData?.__placementKind)) {
    _fitFurnitureBBoxToZoneBounds(grp, zoneStart, zoneEnd, wallName, fitOpts);
    _snapNicheWorldBBoxToZone(grp, zoneStart, zoneEnd, wallName);
  }
}

/**
 * Пивот зоны = левый/передний край (back/right) или правый (front/left).
 * После rebuild: якорный snap + clamp min/max в [zoneStart, zoneEnd],
 * иначе корпус «плывёт» и правый край тумбы заезжает на SideOverlay / SideCap.
 */
function _fitFurnitureBBoxToZoneBounds(furnitureGroup, zoneStart, zoneEnd, wallName, fitOpts = {}) {
  if (!furnitureGroup || !Number.isFinite(zoneStart) || !Number.isFinite(zoneEnd)) return false;
  const axes = getWallAxes(wallName);
  const eps = _ZONE_U_FIT_EPS_MM;
  let shifted = false;
  const anchorEdge =
    fitOpts.anchorEdge === 'min' || fitOpts.anchorEdge === 'max'
      ? fitOpts.anchorEdge
      : _zoneFitAnchorEdge(
          fitOpts.zoneIndex,
          fitOpts.partsCount,
          wallName,
          furnitureGroup?.userData?.__placementKind
        );

  const readU = () => {
    furnitureGroup.updateMatrixWorld(true);
    const bbox = _layoutBBoxForZoneFit(furnitureGroup);
    return {
      minU: getAxisCoord(bbox.min, axes.u.axis),
      maxU: getAxisCoord(bbox.max, axes.u.axis),
    };
  };

  const applyDeltaU = (deltaU) => {
    if (!Number.isFinite(deltaU) || Math.abs(deltaU) < eps) return false;
    if (axes.u.axis === 'x') furnitureGroup.position.x += deltaU;
    else furnitureGroup.position.z += deltaU;
    return true;
  };

  let { minU, maxU } = readU();
  const anchorDelta = anchorEdge === 'max' ? zoneEnd - maxU : zoneStart - minU;

  if (_pivotTraceOn()) {
    logFurniturePivotTrace('snap:before', furnitureGroup, {
      wallName,
      zoneStart,
      zoneEnd,
      extra: {
        anchorEdge,
        plannedDeltaMm: _r1(anchorDelta),
        cabWidthMm: _r1(maxU - minU),
        zoneWidthMm: _r1(zoneEnd - zoneStart),
      },
    });
  }

  if (applyDeltaU(anchorDelta)) {
    shifted = true;
    ({ minU, maxU } = readU());
  }

  const zoneW = zoneEnd - zoneStart;
  let cabW = maxU - minU;
  const isNiche =
    String(furnitureGroup?.userData?.__placementKind || '') !== PLACEMENT_KIND.STANDALONE_FLOOR;

  // Ниша: не clamp max→zoneEnd — при cabW чуть шире зоны это сдвигало корпус на −7 мм.
  // Тумба: clamp оставляем (накладка / SideCap).
  if (!isNiche) {
    if (anchorEdge === 'min' && maxU > zoneEnd + eps) {
      if (applyDeltaU(-(maxU - zoneEnd))) {
        shifted = true;
        ({ minU, maxU } = readU());
        cabW = maxU - minU;
      }
    } else if (anchorEdge === 'max' && maxU > zoneEnd + eps) {
      if (applyDeltaU(-(maxU - zoneEnd))) {
        shifted = true;
        ({ minU, maxU } = readU());
        cabW = maxU - minU;
      }
    }
    if (anchorEdge === 'min' && minU < zoneStart - eps && cabW <= zoneW + eps) {
      if (applyDeltaU(zoneStart - minU)) {
        shifted = true;
        ({ minU, maxU } = readU());
        cabW = maxU - minU;
      }
    }
  } else if (anchorEdge === 'min' && minU < zoneStart - eps && cabW <= zoneW + eps) {
    if (applyDeltaU(zoneStart - minU)) {
      shifted = true;
      ({ minU, maxU } = readU());
      cabW = maxU - minU;
    }
  }

  // Спец L / catalog_44: ниша иначе не clamp max→zoneEnd → корпус в зазор 50 (§6.8.3).
  if (fitOpts.clampMaxToZoneEnd === true && maxU > zoneEnd + eps) {
    if (applyDeltaU(-(maxU - zoneEnd))) {
      shifted = true;
      ({ minU, maxU } = readU());
      cabW = maxU - minU;
    }
  }

  if (cabW > zoneW + eps + 1) {
    console.warn('[ZONE-FIT] bbox шире зоны — нужен rebuild/ширина каталога', {
      wallName,
      zoneStart: _r1(zoneStart),
      zoneEnd: _r1(zoneEnd),
      zoneWidthMm: _r1(zoneW),
      cabinetWidthMm: _r1(cabW),
      uuid: furnitureGroup.uuid?.slice?.(0, 8),
    });
  }

  if (_pivotTraceOn()) {
    logFurniturePivotTrace('snap:after', furnitureGroup, {
      wallName,
      zoneStart,
      zoneEnd,
      extra: {
        shifted,
        anchorEdge,
        minU: _r1(minU),
        maxU: _r1(maxU),
        deltaToZoneEndMm: _r1(zoneEnd - maxU),
      },
    });
  }
  return shifted;
}

/** Если bbox ≠ ширине зоны — rebuild под zoneWidthMm (тумба), затем повторный fit. */
function _enforceFurnitureWidthInZone(grp, sectionData, zoneStart, zoneEnd, wallName, zoneWidthMm, fitOpts = {}) {
  if (!grp || !(zoneWidthMm > 1)) return false;
  const placementKind = String(grp.userData?.__placementKind || '');
  if (!isLowFurniturePlacementKind(placementKind)) return false;
  const axes = getWallAxes(wallName);
  const measureW = () => {
    grp.updateMatrixWorld(true);
    const bbox = _layoutBBoxForZoneFit(grp);
    const minU = getAxisCoord(bbox.min, axes.u.axis);
    const maxU = getAxisCoord(bbox.max, axes.u.axis);
    return { minU, maxU, cabW: maxU - minU };
  };
  let { cabW } = measureW();
  const zoneW = Math.max(0, zoneEnd - zoneStart);
  const widthMismatch = Math.abs(cabW - zoneW) > _ZONE_U_FIT_EPS_MM + 1;
  if (!widthMismatch) return false;

  const customH = Number(grp.userData?.customHeightMm || 0) || 0;
  const catType = grp.userData?.catalogType;
  let sectionH = Number(sectionData?.standaloneFloorHeightMm || 0) || 0;
  if (typeof window !== 'undefined' && catType && typeof window.__cldGetStandaloneHeightForCatalog === 'function') {
    sectionH = window.__cldGetStandaloneHeightForCatalog(sectionData, catType) || sectionH;
  }
  const targetY =
    customH > 0 ? customH : sectionH > 0 ? sectionH : Number(grp.userData?.__initialSectionSizeMm?.y || 0);
  const wall = wallName || sectionData?.wallName || 'back';
  const targetZ =
    wall === 'left' || wall === 'right'
      ? Number(sectionData?.size?.x || 0)
      : Number(sectionData?.size?.z || sectionData?.size?.depth || 0);

  const hasClodis =
    !!(readUserDataClodisRoots(grp.userData) || readUserDataClodisData(grp.userData));
  let rebuilt = false;
  if (hasClodis && targetY > 0 && targetZ > 0) {
    rebuilt = rebuildFurnitureGroupForSectionResize(grp, sectionData, {
      x: zoneWidthMm,
      y: targetY,
      z: targetZ,
    });
  }
  if (rebuilt) {
    _fitFurnitureBBoxToZoneBounds(grp, zoneStart, zoneEnd, wallName, fitOpts);
    ({ cabW } = measureW());
  }
  if (Math.abs(cabW - zoneW) > _ZONE_U_FIT_EPS_MM + 1 && cabW > 1) {
    const sx = (grp.scale.x || 1) * (zoneW / cabW);
    grp.scale.set(sx, grp.scale.y, grp.scale.z);
    grp.updateMatrixWorld(true);
    _fitFurnitureBBoxToZoneBounds(grp, zoneStart, zoneEnd, wallName, fitOpts);
    console.warn('[ZONE-FIT] standalone подогнан по X под ширину зоны', {
      zoneWidthMm: Math.round(zoneW),
      cabinetWidthWasMm: Math.round(cabW),
      sx: Number(sx.toFixed(4)),
      uuid: grp.uuid?.slice?.(0, 8),
    });
    return true;
  }
  return rebuilt;
}

/** @deprecated internal alias */
function _snapFurnitureBBoxToZoneEdges(furnitureGroup, zoneStart, zoneEnd, wallName) {
  return _fitFurnitureBBoxToZoneBounds(furnitureGroup, zoneStart, zoneEnd, wallName);
}

/** Snap + clamp bbox мебели в границы зоны layout (для placePendingFurniture). */
export function fitFurnitureBBoxToZoneBounds(furnitureGroup, zoneStart, zoneEnd, wallName, fitOpts) {
  return _fitFurnitureBBoxToZoneBounds(furnitureGroup, zoneStart, zoneEnd, wallName, fitOpts);
}

/** Snap + clamp по zoneIndex из _layoutCache. */
export function fitFurnitureToSectionZone(furnitureGroup, section, zoneIndex, layoutOpt) {
  if (!furnitureGroup || !section?.division || zoneIndex == null) return false;
  const zi = Math.max(0, Math.floor(Number(zoneIndex)));
  const layout = layoutOpt || computeSectionLayout(section);
  const seg = (layout.segments || []).find((s) => s.type === 'module' && s.zoneIndex === zi);
  if (!seg) return false;
  const wallName = section.wallName || section.division?.wallName || 'back';
  let zoneStart = seg.startU;
  let zoneEnd = seg.endU;
  // Спец L: границы как у призрака (S+D → sectionEnd), не устаревший seg.
  const specialZi = getLShapeSpecialZoneIndex(section);
  const sp = getLShapeSpecialSnapBounds(section.division);
  const isLSpecial = !!(sp && specialZi != null && zi === specialZi);
  if (isLSpecial) {
    zoneStart = sp.zoneStart;
    zoneEnd = sp.zEnd;
  }
  const zoneWidthMm = zoneEnd - zoneStart;
  const fitOpts = {
    zoneIndex: zi,
    partsCount: Math.max(1, Math.floor(Number(section.division?.parts) || 0)),
    clampMaxToZoneEnd: isLSpecial,
  };
  const fitted = fitFurnitureBBoxToZoneBounds(furnitureGroup, zoneStart, zoneEnd, wallName, fitOpts);
  const enforced = _enforceFurnitureWidthInZone(
    furnitureGroup,
    section,
    zoneStart,
    zoneEnd,
    wallName,
    zoneWidthMm,
    fitOpts
  );
  // Обычная ниша: snap min→zoneStart. Спец: после snap снова clamp max (иначе зазор 50).
  const snapped = _snapNicheWorldBBoxToZone(furnitureGroup, zoneStart, zoneEnd, wallName);
  let reclamp = false;
  if (isLSpecial && snapped) {
    reclamp = fitFurnitureBBoxToZoneBounds(furnitureGroup, zoneStart, zoneEnd, wallName, fitOpts);
  }
  return fitted || enforced || snapped || reclamp;
}

function _isStandaloneFloorFurniture(grp) {
  return isLowFurniturePlacementKind(grp?.userData?.__placementKind);
}

/**           (    0). */
function _removeFurnitureGroupsFromRoom(groups, sectionData) {
  if (!groups?.length) return;
  const removedUuids = new Set(groups.map((g) => g.uuid));
  for (const grp of groups) {
    try {
      const B = typeof window !== 'undefined' ? window.ClodisBuilder : null;
      if (B && typeof B.unregisterDoorSwingGroupsFromRoot === 'function') {
        B.unregisterDoorSwingGroupsFromRoot(grp);
      }
    } catch (_) {}
    if (grp.parent) grp.parent.remove(grp);
    else if (state.scene) state.scene.remove(grp);
    grp.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    });
    if (state.furniture?.group === grp) state.furniture = null;
    if (state.selectedFurniture?.group === grp) state.selectedFurniture = null;
  }
  console.log('[LAYOUT] standalone removed  no zone after section shrink', {
    sectionId: sectionData?.id,
    count: groups.length,
    uuids: [...removedUuids].map((u) => u?.slice(0, 8)),
  });
  try {
    recalcFurniturePricingAfterGeometryChange();
  } catch (_) {}
}

function _pruneStandaloneFromFurnitureList(furniture, toRemove, sectionData) {
  if (!toRemove?.length) return;
  const drop = new Set(toRemove.map((g) => g.uuid));
  _removeFurnitureGroupsFromRoom(toRemove, sectionData);
  for (let i = furniture.length - 1; i >= 0; i--) {
    if (drop.has(furniture[i].uuid)) furniture.splice(i, 1);
  }
}

/** Сохранить явный zoneIndex (из размещения призрака), не перетирать при relayout. */
function _claimStoredZoneIndices(furniture, parts, assignedZoneByUuid, opts = {}) {
  const pruneOrphanStandalone = !!opts.pruneOrphanStandalone;
  const used = new Set();
  const unassigned = [];
  const removedStandalone = [];
  for (const f of furniture) {
    const z0 = Number(f.userData?.zoneIndex);
    if (
      pruneOrphanStandalone &&
      _isStandaloneFloorFurniture(f) &&
      Number.isFinite(z0) &&
      z0 >= parts
    ) {
      removedStandalone.push(f);
      continue;
    }
    if (Number.isFinite(z0) && z0 >= 0 && z0 < parts) {
      if (!used.has(z0)) {
        assignedZoneByUuid.set(f.uuid, z0);
        used.add(z0);
        continue;
      }
      //   : base+upper       .
      if (_canClaimOccupiedZone(f, z0, furniture, assignedZoneByUuid)) {
        assignedZoneByUuid.set(f.uuid, z0);
        continue;
      }
      unassigned.push(f);
    } else {
      unassigned.push(f);
    }
  }
  return { used, unassigned, removedStandalone };
}

function _fillZonesByOrder(unassigned, parts, axis, assignedZoneByUuid, used, opts = {}) {
  const pruneOrphanStandalone = !!opts.pruneOrphanStandalone;
  const removedStandalone = [];
  const ordered = [...unassigned].sort((a, b) =>
    axis === 'x' ? a.position.x - b.position.x : a.position.z - b.position.z
  );
  let next = 0;
  for (const f of ordered) {
    while (next < parts && used.has(next)) next++;
    if (next >= parts) {
      if (pruneOrphanStandalone && _isStandaloneFloorFurniture(f)) {
        removedStandalone.push(f);
        continue;
      }
      const z = parts - 1;
      assignedZoneByUuid.set(f.uuid, z);
      if (!used.has(z)) used.add(z);
      continue;
    }
    assignedZoneByUuid.set(f.uuid, next);
    used.add(next);
    next++;
  }
  return removedStandalone;
}

/**
 * Мировые U краёв окна (notch) в той же системе, что sectionStart / segments.
 */
function _windowLowSlotNotchWorldU(sectionData) {
  const slot = sectionData?.windowLowSlot;
  if (!slot || !state.room?.group) return null;
  const notchA = Number(slot.notchAlongA);
  const notchB = Number(slot.notchAlongB);
  if (!(notchB > notchA + 1)) return null;
  const wallName = String(sectionData.wallName || 'back').trim().toLowerCase();
  const roomWorld = new THREE.Vector3();
  state.room.group.getWorldPosition(roomWorld);
  const roomW = Number(state.room.width) || 0;
  const roomD = Number(state.room.depth) || 0;
  let uA;
  let uB;
  if (wallName === 'back') {
    uA = roomWorld.x + notchA;
    uB = roomWorld.x + notchB;
  } else if (wallName === 'front') {
    uA = roomWorld.x + (roomW - notchB);
    uB = roomWorld.x + (roomW - notchA);
  } else if (wallName === 'left') {
    uA = roomWorld.z + (roomD - notchB);
    uB = roomWorld.z + (roomD - notchA);
  } else if (wallName === 'right') {
    uA = roomWorld.z + notchA;
    uB = roomWorld.z + notchB;
  } else {
    return null;
  }
  if (!(uB > uA + 1)) {
    const t = uA;
    uA = uB;
    uB = t;
  }
  return { notchUA: uA, notchUB: uB, sillMm: Number(slot.sillMm) || 0 };
}

/**
 * A: края окна задают полосы tall | low | tall (ячейки стабильны).
 * forceNotchCaps: 16 мм на notch только на пустой секции; с мебелью — gap только от шкаф|комод.
 */
function _applyWindowLowSlotDivisionLayout(
  sectionData,
  gapBeforeZone,
  parts,
  sectionStart,
  sectionWidth,
  minModuleW,
  opts = {}
) {
  const forceNotchCaps = opts.forceNotchCaps !== false;
  const notch = _windowLowSlotNotchWorldU(sectionData);
  if (!notch || parts < 3) return null;
  const sectionEnd = sectionStart + sectionWidth;
  const uA = Math.max(
    sectionStart + minModuleW,
    Math.min(notch.notchUA, sectionEnd - minModuleW * 2)
  );
  const uB = Math.max(
    uA + minModuleW,
    Math.min(notch.notchUB, sectionEnd - minModuleW)
  );
  if (!(uB > uA + minModuleW) || !(uA > sectionStart + 10) || !(sectionEnd - uB > 10)) {
    return null;
  }

  const leftLen = uA - sectionStart;
  const midRaw = uB - uA;
  const rightLen = sectionEnd - uB;

  const gaps = new Array(parts).fill(0);
  for (let z = 0; z < parts; z++) {
    gaps[z] = Math.max(0, Number(gapBeforeZone?.[z]) || 0);
  }

  // Ширины полос: с cap на пустой — mid/right отдают 16 мм; с мебелью — полная полоса.
  let midLen = midRaw;
  let rightMod = rightLen;
  if (forceNotchCaps) {
    midLen = midRaw - _CAP_W_MM;
    rightMod = rightLen - _CAP_W_MM;
  }
  if (leftLen < minModuleW || midLen < minModuleW || rightMod < minModuleW) return null;

  const totalLen = leftLen + midLen + rightMod;
  let nL = Math.max(1, Math.round((parts * leftLen) / totalLen));
  let nM = Math.max(1, Math.round((parts * midLen) / totalLen));
  let nR = parts - nL - nM;
  if (nR < 1) {
    if (nL >= nM && nL > 1) nL -= 1;
    else if (nM > 1) nM -= 1;
    nR = parts - nL - nM;
  }
  if (nR < 1) {
    nL = 1;
    nM = Math.max(1, parts - 2);
    nR = parts - nL - nM;
  }
  while (nL + nM + nR > parts) {
    if (nL >= nM && nL >= nR && nL > 1) nL -= 1;
    else if (nM >= nR && nM > 1) nM -= 1;
    else if (nR > 1) nR -= 1;
    else break;
  }
  while (nL + nM + nR < parts) {
    if (rightMod >= midLen && rightMod >= leftLen) nR += 1;
    else if (midLen >= leftLen) nM += 1;
    else nL += 1;
  }
  if (nL + nM + nR !== parts || nL < 1 || nM < 1 || nR < 1) return null;

  if (forceNotchCaps) {
    gaps[nL] = Math.max(gaps[nL], _CAP_W_MM);
    gaps[nL + nM] = Math.max(gaps[nL + nM], _CAP_W_MM);
  }

  const widths = new Array(parts).fill(0);
  const wL = leftLen / nL;
  const wM = midLen / nM;
  const wR = rightMod / nR;
  for (let i = 0; i < nL; i++) widths[i] = wL;
  for (let i = 0; i < nM; i++) widths[nL + i] = wM;
  for (let i = 0; i < nR; i++) widths[nL + nM + i] = wR;

  const capTotal = gaps.reduce((s, v) => s + (v > 0 ? v : 0), 0);
  if (forceNotchCaps) {
    const expectedCaps = _CAP_W_MM * 2;
    if (capTotal > expectedCaps + 0.5) {
      const extra = capTotal - expectedCaps;
      const shrink = extra / parts;
      for (let i = 0; i < parts; i++) {
        widths[i] = Math.max(minModuleW * 0.5, widths[i] - shrink);
      }
    }
  }

  const sumW = widths.reduce((a, b) => a + b, 0);
  const targetW = sectionWidth - capTotal;
  if (sumW > 0 && Math.abs(sumW - targetW) > 0.5) {
    const k = targetW / sumW;
    for (let i = 0; i < parts; i++) widths[i] *= k;
  }

  const partSize = widths.reduce((a, b) => a + b, 0) / Math.max(1, widths.length);

  sectionData._windowLowSlotBands = {
    nL,
    nM,
    nR,
    notchUA: uA,
    notchUB: uB,
    sillMm: notch.sillMm,
    forceNotchCaps,
  };

  return {
    gapBeforeZone: gaps,
    moduleWidthsMm: widths,
    partSize,
    capCount: gaps.reduce((s, v) => s + (v > 0 ? 1 : 0), 0),
  };
}

/**
 * Сортировка мебели и назначение зон + зазоров 16 мм между шкаф↔тумба (как в computeSectionLayout).
 * @param {{ forceByPosition?: boolean, layoutKind?: string }} [opts] — после resize: зоны по позиции на стене.
 */
function _assignFurnitureZonesAndGaps(furniture, parts, axis, opts = {}) {
  const forceByPosition = !!opts.forceByPosition;
  const layoutKind = opts.layoutKind || null;
  const pruneOrphanStandalone = !!opts.pruneOrphanStandalone;
  const zoneOpts = { pruneOrphanStandalone };
  furniture.sort((a, b) =>
    axis === 'x' ? a.position.x - b.position.x : a.position.z - b.position.z
  );
  const assignedZoneByUuid = new Map();
  const removedStandalone = [];
  if (forceByPosition && parts > 0) {
    const claimed = _claimStoredZoneIndices(furniture, parts, assignedZoneByUuid, zoneOpts);
    const { used, unassigned } = claimed;
    removedStandalone.push(...(claimed.removedStandalone || []));
    if (layoutKind === 'mixedLeftSingle') {
      const rest = [];
      const niche = [];
      for (const f of unassigned) {
        const lk = String(f.userData?.__placementKind || PLACEMENT_KIND.FLOOR_IN_NICHE);
        if (lk === PLACEMENT_KIND.FLOOR_IN_NICHE) niche.push(f);
        else rest.push(f);
      }
      rest.sort((a, b) =>
        axis === 'x' ? a.position.x - b.position.x : a.position.z - b.position.z
      );
      niche.sort((a, b) =>
        axis === 'x' ? a.position.x - b.position.x : a.position.z - b.position.z
      );
      const ordered = [...rest, ...niche];
      let next = 0;
      for (const f of ordered) {
        while (next < parts && used.has(next)) next++;
        if (next >= parts) {
          if (pruneOrphanStandalone && _isStandaloneFloorFurniture(f)) {
            removedStandalone.push(f);
            continue;
          }
          const z = parts - 1;
          assignedZoneByUuid.set(f.uuid, z);
          if (!used.has(z)) used.add(z);
          continue;
        }
        assignedZoneByUuid.set(f.uuid, next);
        used.add(next);
        next++;
      }
    } else {
      removedStandalone.push(
        ..._fillZonesByOrder(unassigned, parts, axis, assignedZoneByUuid, used, zoneOpts)
      );
    }
    furniture.sort((a, b) => {
      const za = assignedZoneByUuid.get(a.uuid) ?? 0;
      const zb = assignedZoneByUuid.get(b.uuid) ?? 0;
      if (za !== zb) return za - zb;
      return axis === 'x' ? a.position.x - b.position.x : a.position.z - b.position.z;
    });
  } else {
    furniture.sort((a, b) => {
      const ziA = typeof a.userData?.zoneIndex === 'number' ? a.userData.zoneIndex : 9999;
      const ziB = typeof b.userData?.zoneIndex === 'number' ? b.userData.zoneIndex : 9999;
      if (ziA !== ziB) return ziA - ziB;
      return axis === 'x' ? a.position.x - b.position.x : a.position.z - b.position.z;
    });
    const usedZones = new Set();
    let nextFreeZone = 0;
    const allocNextFree = () => {
      while (nextFreeZone < parts && usedZones.has(nextFreeZone)) nextFreeZone++;
      if (nextFreeZone >= parts) return parts - 1;
      const z = nextFreeZone;
      usedZones.add(z);
      nextFreeZone++;
      return z;
    };
    for (const f of furniture) {
      const z0 = Number(f.userData?.zoneIndex);
      if (Number.isFinite(z0) && z0 >= 0 && z0 < parts) {
        if (!usedZones.has(z0)) {
          usedZones.add(z0);
          assignedZoneByUuid.set(f.uuid, z0);
          continue;
        }
        if (_canClaimOccupiedZone(f, z0, furniture, assignedZoneByUuid)) {
          assignedZoneByUuid.set(f.uuid, z0);
          continue;
        }
      }
      assignedZoneByUuid.set(f.uuid, allocNextFree());
    }
    furniture.sort((a, b) => {
      const za = assignedZoneByUuid.get(a.uuid) ?? 0;
      const zb = assignedZoneByUuid.get(b.uuid) ?? 0;
      if (za !== zb) return za - zb;
      return axis === 'x' ? a.position.x - b.position.x : a.position.z - b.position.z;
    });
  }
  const gapBeforeZone = new Array(parts).fill(0);
  //  16        classify (  = low),
  //      hang|wardrobe   ( /).
  const byZone = new Map();
  for (const f of furniture) {
    const z = assignedZoneByUuid.get(f.uuid);
    if (typeof z !== 'number') continue;
    if (!byZone.has(z)) byZone.set(z, []);
    byZone.get(z).push(f);
  }
  for (let zr = 1; zr < parts; zr++) {
    const leftList = byZone.get(zr - 1);
    const rightList = byZone.get(zr);
    if (!leftList?.length || !rightList?.length) continue;
    const zoneL = {
      occupants: leftList.map((g) => ({
        uuid: g.uuid,
        placementKind: String(g.userData?.__placementKind || PLACEMENT_KIND.FLOOR_IN_NICHE),
      })),
    };
    const zoneR = {
      occupants: rightList.map((g) => ({
        uuid: g.uuid,
        placementKind: String(g.userData?.__placementKind || PLACEMENT_KIND.FLOOR_IN_NICHE),
      })),
    };
    if (classifyCapBetweenZones(zoneL, zoneR)) {
      gapBeforeZone[zr] = _CAP_W_MM;
      continue;
    }
    //        HeightMismatch ( ).
    if (
      leftList.length &&
      rightList.length &&
      _pairNeedsHangLowSideCoverCap(leftList[0], rightList[0])
    ) {
      gapBeforeZone[zr] = _CAP_W_MM;
    }
  }
  return { assignedZoneByUuid, gapBeforeZone, removedStandalone };
}

/**
 * Compute the authoritative linear layout for a section.
 *
 * - Sorts furniture by existing zoneIndex (stable), then world position.
 * - Detects wardrobe↔dresser transitions and inserts 16 mm cap gaps.
 * - Sets division.partSize = (sectionWidth − capCount16) / parts.
 * - Assigns sequential grp.userData.zoneIndex to every furniture item.
 * - Stores result in sectionData._layoutCache for cross-module reads.
 *
 * @returns {{ partSize, capCount, sectionStart, segments }}
 *   segments: [{type:'module'|'cap', zoneIndex?, startU, endU, furnitureUuid?}]
 */
function computeSectionLayout(sectionData) {
  const division = sectionData?.division;
  if (!division || !sectionData?.group || !state.scene) {
    return { partSize: 0, capCount: 0, sectionStart: 0, segments: [] };
  }
  if (sectionData._layoutComputing) {
    return (
      sectionData._layoutCache || {
        partSize: Number(division.partSize || 0),
        capCount: 0,
        sectionStart: Number(division.sectionStart ?? 0),
        segments: [],
      }
    );
  }
  sectionData._layoutComputing = true;
  try {
  // §6.8.3: спец S+D не дальше sectionEnd (CORNER_GAP 50). Иначе layout/rebuild
  // на шаге 5 снова раздувают корпус и цоколь до стены, а планка №1 остаётся короткой.
  if (division.typeKey && L_CORNER_CONFIG[division.typeKey]) {
    getLShapeSpecialSnapBounds(division);
  }
  const lSegs = layoutSegmentsFromLShape(division);
  if (lSegs) {
    const cache = {
      partSize: division.partSize || 0,
      capCount: 0,
      sectionStart: Number(division.sectionStart ?? 0),
      segments: lSegs,
    };
    sectionData._layoutCache = cache;
    return cache;
  }

  const wallName = sectionData.wallName || division.wallName || 'back';
  const axis = (wallName === 'left' || wallName === 'right') ? 'z' : 'x';
  const outerWidthU = axis === 'x' ? (sectionData.size?.x || 0) : (sectionData.size?.z || 0);
  let parts = Math.max(0, Math.floor(Number(division.parts) || 0));
  // Окно: минимум 3 ячейки (tall | low | tall), иначе notch некуда закрепить.
  if (sectionData.windowLowSlot && parts > 0 && parts < 3) {
    parts = 3;
    division.parts = 3;
  }

  // Внутренние границы ряда — единый контракт §4 / §4.1 / торцевой (section-edge-trim-insets.js).
  const computeInnerBoundsU = () => computeSectionInnerBoundsU(sectionData);

  const inner = computeInnerBoundsU();
  const sectionWidth = inner.innerWidthU;
  const sectionStart = inner.innerStartU;
  const prevPartSize = Number(division.partSize || 0);

  //           (parts=0).
  division.sectionStart = sectionStart;
  division.sectionEnd = sectionStart + sectionWidth;

  const realignFurnitureInSection = () => {
    if (!state.scene) return;
    if (_pivotTraceOn()) {
      console.log('[PIVOT-TRACE] realignFurnitureInSection', {
        sectionId: sectionData.id,
        sectionStart: _r1(sectionData.division?.sectionStart),
        sectionEnd: _r1(sectionData.division?.sectionEnd),
        innerStartU: _r1(sectionStart),
        innerEndU: _r1(sectionStart + sectionWidth),
      });
    }
    state.scene.traverse((obj) => {
      if (!obj?.userData?.isFurniture || obj.userData.sectionId !== sectionData.id) return;
      if (obj.userData.isEndCabinet) return;
      if (_isGhostFurnitureOverlay(obj)) return;
      try {
        if (_pivotTraceOn()) {
          logFurniturePivotTrace('realign:before_shift', obj, {
            wallName,
            section: sectionData,
          });
        }
        _shiftFurnitureToSectionInnerBounds(obj, sectionData);
      } catch (_) {}
    });
  };

  if (parts === 0 || sectionWidth <= 0) {
    sectionData._layoutCache = { partSize: 0, capCount: 0, sectionStart, segments: [] };
    realignFurnitureInSection();
    return sectionData._layoutCache;
  }

  // 1. Collect all furniture in this section from the scene.
  const furniture = [];
  state.scene.traverse((obj) => {
    if (!obj?.userData?.isFurniture || obj.userData.sectionId !== sectionData.id) return;
    if (obj.userData.isEndCabinet) return;
    if (_isGhostFurnitureOverlay(obj)) return;
    furniture.push(obj);
  });

  const relayoutFromSectionGeom =
    sectionData._relayoutZonesFromPosition === true ||
    sectionData._sectionGeomRelayoutPending === true;
  const prevInnerW = Number(sectionData._layoutCache?.innerWidthMm);
  const forceZoneByPosition =
    relayoutFromSectionGeom ||
    (Number.isFinite(prevInnerW) && Math.abs(prevInnerW - sectionWidth) > 2);
  if (sectionData._relayoutZonesFromPosition) {
    delete sectionData._relayoutZonesFromPosition;
  }
  const zoneAssignOpts = {
    forceByPosition: forceZoneByPosition,
    layoutKind: division.layoutKind || null,
    //        ,      0.
    pruneOrphanStandalone: forceZoneByPosition,
  };

  parts = _syncPartsToFurnitureOnRelayout(division, furniture, forceZoneByPosition);
  // Спец-секция под окном: всегда ≥3 ячейки (tall | low | tall), даже после sync к числу мебели.
  if (sectionData.windowLowSlot && parts > 0 && parts < 3) {
    parts = 3;
    division.parts = 3;
  }

  const minModuleW =
    Number.isFinite(Number(division.minModuleWidthMm)) && Number(division.minModuleWidthMm) > 0
      ? Number(division.minModuleWidthMm)
      : _DEFAULT_MIN_MODULE_WIDTH_MM;

  let assignedZoneByUuid = new Map();
  let gapBeforeZone = [];
  let capCount = 0;
  let partSize = 0;

  const isMixedLeft =
    division.layoutKind === 'mixedLeftSingle' &&
    Number(division.leftSingleWidthMm) > 0 &&
    Number(division.doubleWidthMm) > 0 &&
    Number(division.doubleCount) >= 1;

  /** Per-zone width along U (мм); для равномерного деления заполняется после цикла. */
  let moduleWidthsMm = null;

  if (isMixedLeft) {
    const nD = Math.floor(Number(division.doubleCount));
    parts = 1 + nD;
    division.parts = parts;
    const mix = _assignFurnitureZonesAndGaps(furniture, parts, axis, zoneAssignOpts);
    _pruneStandaloneFromFurnitureList(furniture, mix.removedStandalone, sectionData);
    assignedZoneByUuid = mix.assignedZoneByUuid;
    gapBeforeZone = mix.gapBeforeZone;
    capCount = gapBeforeZone.reduce((s, v) => s + (v > 0 ? 1 : 0), 0);
    const S0 = Number(division.leftSingleWidthMm);
    const D0 = Number(division.doubleWidthMm);
    // Слева направо: сначала двойные, однодверная справа (имя поля leftSingleWidthMm историческое)
    const raw = [...Array(nD).fill(D0), S0];
    const capTotal = gapBeforeZone.reduce((s, v) => s + v, 0);
    const sumW = raw.reduce((a, b) => a + b, 0);
    const target = sectionWidth - capTotal;
    moduleWidthsMm = raw;
    if (sumW > 0 && Math.abs(sumW - target) > 0.5) {
      const k = target / sumW;
      moduleWidthsMm = raw.map((w) => w * k);
    }
    partSize =
      moduleWidthsMm.length > 0
        ? moduleWidthsMm.reduce((a, b) => a + b, 0) / moduleWidthsMm.length
        : D0;
  } else {
    // Деление из варианта (−/+) не пересчитываем «уменьшением parts» — иначе 5×980 превращается в 10×490,
    //  stripCountN        .
    const hasCustomZoneWidths =
      division.customZoneWidthsMm &&
      typeof division.customZoneWidthsMm === 'object' &&
      Object.keys(division.customZoneWidthsMm).length > 0;
    const skipShrinkForVariant =
      division.layoutKind === 'mixedLeftSingle' ||
      division.layoutKind === 'allSingles' ||
      hasCustomZoneWidths ||
      (Number.isFinite(Number(division.stripCountN)) && Number(division.stripCountN) >= 2);

    if (!skipShrinkForVariant) {
      // Shrink division.parts when recalculated partSize falls below minimum module width
      // (legacy addCabinetMarkers / findOptimalDivision behaviour).
      let partsWereReduced = false;
      while (true) {
        if (parts <= 0) {
          break;
        }

        const pass = _assignFurnitureZonesAndGaps(furniture, parts, axis, zoneAssignOpts);
        _pruneStandaloneFromFurnitureList(furniture, pass.removedStandalone, sectionData);
        assignedZoneByUuid = pass.assignedZoneByUuid;
        gapBeforeZone = pass.gapBeforeZone;
        capCount = gapBeforeZone.reduce((s, v) => s + (v > 0 ? 1 : 0), 0);

        // 5. partSize = (sectionWidth − caps16) / parts
        partSize = (sectionWidth - capCount * _CAP_W_MM) / parts;
        if (!Number.isFinite(partSize) || partSize <= 0) {
          return { partSize: 0, capCount: 0, sectionStart, segments: [] };
        }

        if (partSize >= minModuleW || parts <= 1) {
          break;
        }

        parts -= 1;
        partsWereReduced = true;
        division.parts = parts;
        const toDrop = [];
        for (const f of furniture) {
          const z0 = Number(f.userData?.zoneIndex);
          if (!Number.isFinite(z0) || z0 < parts) continue;
          if (forceZoneByPosition && _isStandaloneFloorFurniture(f)) {
            toDrop.push(f);
          } else {
            f.userData.zoneIndex = parts - 1;
          }
        }
        _pruneStandaloneFromFurnitureList(furniture, toDrop, sectionData);
        console.log('[LAYOUT] parts reduced: partSize < minModuleWidthMm', {
          sectionId: sectionData.id,
          newParts: parts,
          minModuleW,
          partSizeWasMm: Math.round(partSize),
        });
      }
      if (partsWereReduced) {
        delete division.stripCountN;
        delete division.divisionVariantIndex;
        const again = _assignFurnitureZonesAndGaps(furniture, parts, axis, {
          forceByPosition: true,
          layoutKind: division.layoutKind || null,
          pruneOrphanStandalone: true,
        });
        _pruneStandaloneFromFurnitureList(furniture, again.removedStandalone, sectionData);
        assignedZoneByUuid = again.assignedZoneByUuid;
        gapBeforeZone = again.gapBeforeZone;
        capCount = gapBeforeZone.reduce((s, v) => s + (v > 0 ? 1 : 0), 0);
        partSize = (sectionWidth - capCount * _CAP_W_MM) / parts;
        moduleWidthsMm = Array(parts).fill(partSize);
      }
    } else {
      const pass = _assignFurnitureZonesAndGaps(furniture, parts, axis, zoneAssignOpts);
      _pruneStandaloneFromFurnitureList(furniture, pass.removedStandalone, sectionData);
      assignedZoneByUuid = pass.assignedZoneByUuid;
      gapBeforeZone = pass.gapBeforeZone;
      capCount = gapBeforeZone.reduce((s, v) => s + (v > 0 ? 1 : 0), 0);
      partSize = (sectionWidth - capCount * _CAP_W_MM) / parts;
      if (!Number.isFinite(partSize) || partSize <= 0) {
        return { partSize: 0, capCount: 0, sectionStart, segments: [] };
      }
    }
    moduleWidthsMm = Array(parts).fill(partSize);
  }

  //    (   ).
  //       ;     .
  if (division.customZoneWidthsMm && typeof division.customZoneWidthsMm === 'object') {
    const _custom = division.customZoneWidthsMm;
    let _customSum = 0;
    const _customMask = [];
    let _hasAnyCustom = false;
    for (let _z = 0; _z < parts; _z++) {
      const _cw = Number(_custom[_z]);
      if (Number.isFinite(_cw) && _cw > 0) {
        _customMask.push(_cw);
        _customSum += _cw;
        _hasAnyCustom = true;
      } else {
        _customMask.push(null);
      }
    }
    if (_hasAnyCustom) {
      const _capTotal = gapBeforeZone.reduce((s, v) => s + v, 0);
      const _avail = Math.max(10, sectionWidth - _capTotal);
      if (_customSum > _avail + 1) {
        const scaleK = _avail / _customSum;
        for (let _z = 0; _z < parts; _z++) {
          if (_customMask[_z] !== null) {
            const scaled = Math.max(minModuleW, _customMask[_z] * scaleK);
            _customMask[_z] = scaled;
            division.customZoneWidthsMm[_z] = Math.round(scaled);
          }
        }
        _customSum = _customMask.reduce((s, v) => s + (v !== null ? v : 0), 0);
        if (typeof window !== 'undefined' && window.__CLD_DEBUG_PLACE === true) {
          console.log('[ZONE-WIDTH] scaled customZoneWidthsMm to fit section', {
            sectionId: sectionData?.id,
            sectionWidthMm: sectionWidth,
            capTotalMm: _capTotal,
            scaleK: Math.round(scaleK * 1000) / 1000,
          });
        }
      }
      const _remaining = Math.max(0, _avail - _customSum);
      const _freeCount = _customMask.filter((v) => v === null).length;
      const _freeWidth = _freeCount > 0 ? _remaining / _freeCount : 0;
      moduleWidthsMm = _customMask.map((v) => (v !== null ? v : _freeWidth));
      partSize =
        moduleWidthsMm.length > 0
          ? moduleWidthsMm.reduce((a, b) => a + b, 0) / moduleWidthsMm.length
          : partSize;
      if (typeof window !== 'undefined' && window.__CLD_DEBUG_PLACE === true) {
        console.log('[ZONE-WIDTH] computeSectionLayout(custom)', {
          sectionId: sectionData?.id,
          parts,
          sectionWidthMm: sectionWidth,
          capTotalMm: _capTotal,
          customSumMm: _customSum,
          remainingMm: _remaining,
          freeZones: _freeCount,
          freeWidthMm: _freeWidth,
          customZoneWidthsMm: { ...division.customZoneWidthsMm },
          moduleWidthsMm: moduleWidthsMm.slice(),
        });
      }
    }
  }

  assignedZoneByUuid = _spreadFurnitureOnePerZone(
    furniture,
    parts,
    axis,
    assignedZoneByUuid
  );
  for (const f of furniture) {
    const z = assignedZoneByUuid.get(f.uuid);
    if (typeof z === 'number') f.userData.zoneIndex = z;
  }

  // Спец-секция под окном (не мост): ширины полос tall|low|tall всегда от notch.
  // 16        ;   gap  |.
  if (sectionData.windowLowSlot) {
    const winLay = _applyWindowLowSlotDivisionLayout(
      sectionData,
      gapBeforeZone,
      parts,
      sectionStart,
      sectionWidth,
      minModuleW,
      { forceNotchCaps: furniture.length === 0 }
    );
    if (winLay) {
      gapBeforeZone = winLay.gapBeforeZone;
      moduleWidthsMm = winLay.moduleWidthsMm;
      partSize = winLay.partSize;
      capCount = winLay.capCount;
    }
  }

  // 6. Build full segment list: all module zones + cap zones.
  // This is the key: modules are based on `parts`, not on furniture count.
  const segments = [];
  const moduleStartByZone = new Map();
  let currentU = sectionStart;
  for (let z = 0; z < parts; z++) {
    if (z > 0 && gapBeforeZone[z] > 0) {
      // Insert a dedicated 16 mm "cap section" before module z.
      const prevF = furniture.find((f) => assignedZoneByUuid.get(f.uuid) === z - 1);
      const lk = String(prevF?.userData?.__placementKind || PLACEMENT_KIND.FLOOR_IN_NICHE);
      segments.push({
        type: 'cap',
        startU: currentU,
        endU: currentU + gapBeforeZone[z],
        dresserSide: lk === PLACEMENT_KIND.FLOOR_IN_NICHE ? 'right' : 'left',
        nicheZoneIndex: z - 1,
        dresserZoneIndex: z,
      });
      currentU += gapBeforeZone[z];
    }
    const startU = currentU;
    const wz = moduleWidthsMm && moduleWidthsMm[z] != null ? moduleWidthsMm[z] : partSize;
    const endU = startU + wz;
    //     ,    800 : 2q   < 800,      .
    let doorKind;
    if (isMixedLeft) {
      doorKind = z === parts - 1 ? 'single' : 'double';
    } else if (division.layoutKind === 'allSingles') {
      doorKind = 'single';
    } else {
      const nStrip = Number(division.stripCountN);
      const evenAllDoubles =
        Number.isFinite(nStrip) &&
        nStrip >= 2 &&
        nStrip % 2 === 0 &&
        division.layoutKind !== 'mixedLeftSingle';
      const doubleMinMm = getSectionDoubleMinMmFromConfig();
      // Сначала жёстко &lt; 60 см — однодверная (иначе при низком min_mm в конфиге 500 мм оставалась «double» + пунктир).
      if (wz < _SINGLE_DOOR_VISUAL_MAX_MM) {
        doorKind = 'single';
      } else {
        doorKind =
          wz < doubleMinMm
            ? 'single'
            : evenAllDoubles
              ? 'double'
              : wz >= _TWO_DOOR_MIN_MM
                ? 'double'
                : 'single';
      }
    }
    segments.push({
      type: 'module',
      zoneIndex: z,
      startU,
      endU,
      doorKind,
      furnitureUuid: null,
    });
    moduleStartByZone.set(z, { startU, endU });
    currentU = endU;
  }

  //  resize     zoneIndex    .
  //   /          .
  if (forceZoneByPosition && furniture.length > 0 && !relayoutFromSectionGeom) {
    const refined = _assignZonesByModuleSegments(furniture, segments, axis);
    if (refined.size > 0) {
      for (const [uuid, z] of refined.entries()) assignedZoneByUuid.set(uuid, z);
    }
    assignedZoneByUuid = _spreadFurnitureOnePerZone(
      furniture,
      parts,
      axis,
      assignedZoneByUuid
    );
    for (const f of furniture) {
      const z = assignedZoneByUuid.get(f.uuid);
      if (typeof z === 'number') f.userData.zoneIndex = z;
    }
  }

  // Bind furniture items to their assigned module zones.
  for (const f of furniture) {
    const z = assignedZoneByUuid.get(f.uuid);
    if (typeof z !== 'number') continue;
    f.userData.zoneIndex = z;
    const centerU = _furnitureCenterAlongU(f, axis);
    let seg = segments.find(
      (s) =>
        s.type === 'module' &&
        s.zoneIndex === z &&
        !s.furnitureUuid &&
        centerU >= s.startU &&
        centerU < s.endU
    );
    if (!seg) {
      seg = segments.find((s) => s.type === 'module' && s.zoneIndex === z && !s.furnitureUuid);
    }
    if (seg) seg.furnitureUuid = f.uuid;
  }

  // 7. Persist partSize and section end to keep marker frame authoritative.
  // The division start/end must reflect INNER plank faces (not outer green section).
  division.sectionStart = sectionStart;
  division.partSize = isMixedLeft && moduleWidthsMm && moduleWidthsMm.length > 1
    ? Math.max(...moduleWidthsMm.slice(1))
    : partSize;
  // Lock section end to the inner width to avoid drift beyond room/outer bounds.
  division.sectionEnd = sectionStart + sectionWidth;

  // 8. Cache on sectionData so section-transition-manager and markers can read.
  const result = {
    partSize,
    capCount,
    sectionStart,
    segments,
    moduleWidthsMm,
    innerWidthMm: sectionWidth,
  };
  sectionData._layoutCache = result;
  const capSegments = segments.filter((s) => s.type === 'cap');
  const moduleSegments = segments.filter((s) => s.type === 'module');
  const sectionRightU = sectionStart + sectionWidth;
  const sectionLeftU = sectionStart;
  let cursorFromRight = sectionRightU;
  const rtlBreakdown = [];
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    const widthMm = seg.endU - seg.startU;
    const fromU = cursorFromRight;
    const toU = cursorFromRight - widthMm;
    rtlBreakdown.push({
      orderFromRight: rtlBreakdown.length,
      type: seg.type,
      zoneIndex: seg.type === 'module' ? seg.zoneIndex : undefined,
      dresserZoneIndex: seg.type === 'cap' ? seg.dresserZoneIndex : undefined,
      widthMm,
      fromU,
      toU,
      expectedStartU: seg.startU,
      expectedEndU: seg.endU,
      deltaStartMm: toU - seg.startU,
      deltaEndMm: fromU - seg.endU,
    });
    cursorFromRight = toU;
  }
  const rtlClosureDeltaMm = cursorFromRight - sectionLeftU;

  if (typeof window !== 'undefined' && window.DEBUG_LAYOUT_RECALC === true) {
    console.log('[LAYOUT-RECALC][SECTION]', {
      sectionId: sectionData.id,
      wallName,
      sectionWidthMm: sectionWidth,
      parts,
      partSizeAfterMm: partSize,
      capCount,
    });
  }
  realignFurnitureInSection();
  return result;
  } finally {
    sectionData._layoutComputing = false;
  }
}

/** //    bbox       . */
function rebuildTrimAndTransitionsAfterFurnitureGeometry(sectionData, opts = {}) {
  if (state.scene && Array.isArray(state.customSections)) {
    for (const sec of state.customSections) {
      if (!sec?.id) continue;
      state.scene.traverse((obj) => {
        if (!obj?.userData?.isFurniture) return;
        if (String(obj.userData.sectionId) !== String(sec.id)) return;
        obj.updateMatrixWorld(true);
      });
      syncEndCabinetFacadeOverlays(sec);
    }
  }
  try {
    const wall = sectionData?.wallName || null;
    if (wall) rebuildTransitionsForWall(wall, opts);
    else rebuildAllTransitions();
  } catch (e) {
    console.warn('[FURNITURE-GEOM] rebuild transitions failed', e);
  }
  try {
    if (sectionData) syncSectionEmptyFrameVisibility(sectionData);
    const gid = sectionData?.windowAlongWallGroupId || sectionData?.windowBridgeGroupId;
    if (gid && Array.isArray(state.customSections)) {
      for (const sec of state.customSections) {
        if (!sec || sec === sectionData) continue;
        if (
          sec.windowAlongWallGroupId === gid ||
          sec.windowBridgeGroupId === gid
        ) {
          syncSectionEmptyFrameVisibility(sec);
        }
      }
    }
  } catch (_) {}
  try {
    scheduleRefreshSectionTrimEdgesInRoom();
  } catch (_) {}
}

let _trimRebuildAfterFurnitureRaf = 0;
let _trimRebuildAfterFurnitureOpts = null;

/**   /    bbox     . */
function scheduleTrimRebuildAfterFurnitureGeometry(sectionData, opts = {}) {
  if (typeof window === 'undefined') return;
  // Каскад: reconcile внутри wall-transitions не должен снова гнать full rebuild.
  if (isRebuildingTransitions()) {
    scheduleRebuildTransitions(
      sectionData?.wallName ? { wallName: sectionData.wallName } : { all: true }
    );
    return;
  }
  if (opts && typeof opts === 'object') {
    _trimRebuildAfterFurnitureOpts = {
      ...(_trimRebuildAfterFurnitureOpts || {}),
      ...opts,
    };
  }
  if (_trimRebuildAfterFurnitureRaf) {
    cancelAnimationFrame(_trimRebuildAfterFurnitureRaf);
  }
  _trimRebuildAfterFurnitureRaf = requestAnimationFrame(() => {
    _trimRebuildAfterFurnitureRaf = 0;
    const flushOpts = _trimRebuildAfterFurnitureOpts || {};
    _trimRebuildAfterFurnitureOpts = null;
    if (sectionData?.id && state.scene) {
      state.scene.traverse((obj) => {
        if (!obj?.userData?.isFurniture) return;
        if (String(obj.userData.sectionId) !== String(sectionData.id)) return;
        obj.updateMatrixWorld(true);
      });
    }
    rebuildTrimAndTransitionsAfterFurnitureGeometry(sectionData, flushOpts);
  });
}

// Expose updateFurnitureInSection for cross-module use (section-transition-manager.js)
// to avoid circular ES-module imports.
if (typeof window !== 'undefined') {
  window.__clodisUpdateFurnitureInSection = updateFurnitureInSection;
  window.__cldSnapNicheFurnitureRoot = function (obj) {
    if (!obj) return false;
    let root = obj;
    for (let i = 0; i < 32 && root; i++) {
      if (root.isGroup && root.userData?.isFurniture) break;
      root = root.parent;
    }
    if (!root?.userData?.isFurniture) return false;
    const sec = (state.customSections || []).find((s) => s && s.id === root.userData.sectionId);
    if (!sec) return false;
    const wallName = sec.wallName || root.userData.wallName || 'back';
    const layout =
      sec._layoutCache && Array.isArray(sec._layoutCache.segments)
        ? sec._layoutCache
        : computeSectionLayout(sec);
    const segs = (layout.segments || []).filter((s) => s && s.type === 'module');
    const zi = Number(root.userData.zoneIndex);
    const seg =
      segs.find((s) => s.furnitureUuid === root.uuid) ||
      segs.find((s) => s.zoneIndex === zi) ||
      null;
    if (!seg) return false;
    if (String(root.userData?.__placementKind || '') === PLACEMENT_KIND.STANDALONE_FLOOR) {
      return false;
    }
    _snapNicheWorldBBoxToZone(root, Number(seg.startU), Number(seg.endU), wallName);
    return true;
  };
  window.__clodisRebuildTrimAfterFurnitureGeometry = rebuildTrimAndTransitionsAfterFurnitureGeometry;
  window.__clodisScheduleTrimRebuildAfterFurnitureGeometry = scheduleTrimRebuildAfterFurnitureGeometry;
  window.__cldSyncWindowAlongEmptyFrameVisibility = syncWindowAlongEmptyFrameVisibility;
  window.__cldSyncWindowAlongEmptyFramesOnWall = syncWindowAlongEmptyFramesOnWall;
  window.__cldSyncSectionEmptyFrameVisibility = syncSectionEmptyFrameVisibility;
  window.__cldSyncStraightEmptyFrameVisibility = syncStraightEmptyFrameVisibility;
  window.__cldEnsureWindowAlongFrameMeshes = ensureWindowAlongFrameMeshes;
  window.__cldEnsureStraightFrameMeshes = ensureStraightFrameMeshes;
  window.__cldEnsureStraightFrameMeshesOnWall = ensureStraightFrameMeshesOnWall;
  window.__cldWindowRowTrimApi = {
    removeCellFrames: (sec) => {
      if (sec?.group) removeWindowAlongEmptyFrameMeshes(sec.group);
    },
    ensureCellFrames: (sec) => {
      ensureWindowAlongFrameMeshes(sec);
    },
    reconcileCellByPlan: (sec, cell, parts) =>
      reconcileWindowRowCellByPlan(sec, cell, parts),
    pruneCellByPlan: (sec, cell, parts) =>
      reconcileWindowRowCellByPlan(sec, cell, parts),
  };
  window.__clodisComputeSectionLayout = computeSectionLayout;
  window.__clodisComputeSectionInnerBoundsU = computeSectionInnerBoundsU;
  window.__clodisComputeHorizontalTrimSpanU = computeHorizontalTrimSpanU;
  window.__clodisDebugHorizontalTrim = function __clodisDebugHorizontalTrim(sectionIdOrIndex = 0) {
    const sections = Array.isArray(state.customSections) ? state.customSections : [];
    const sec =
      typeof sectionIdOrIndex === 'number'
        ? sections[sectionIdOrIndex]
        : sections.find((s) => s && String(s.id) === String(sectionIdOrIndex));
    if (!sec?.group) {
      console.warn('[H-TRIM] секция не найдена', sectionIdOrIndex);
      return null;
    }
    const span = computeHorizontalTrimSpanU(sec, { forPlinth: false });
    const spanBot = computeHorizontalTrimSpanU(sec, { forPlinth: true });
    const useZ = sec.wallName === 'left' || sec.wallName === 'right';
    const boxU = (obj) => {
      obj.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(obj);
      return useZ
        ? { min: b.min.z, max: b.max.z, w: b.max.z - b.min.z }
        : { min: b.min.x, max: b.max.x, w: b.max.x - b.min.x };
    };
    const tops = [];
    const bots = [];
    const overlays = [];
    sec.group.traverse((o) => {
      if (!o?.isMesh) return;
      const n = String(o.name || '');
      if (o.userData?.isTopPlank) tops.push({ name: n, ...boxU(o), seg: !!o.userData.isPlankLengthSegment });
      if (o.userData?.isBottomPlank) bots.push({ name: n, ...boxU(o), seg: !!o.userData.isPlankLengthSegment });
      if (/^SideOverlay|EndCabinetFacadeOverlay/i.test(n)) overlays.push({ name: n, ...boxU(o) });
    });
    const round = (v) => (Number.isFinite(v) ? Math.round(v * 10) / 10 : v);
    const out = {
      wall: sec.wallName,
      expectTop: { uLo: round(span.uLo), uHi: round(span.uHi), kinds: [span.minKind, span.maxKind] },
      expectBot: { uLo: round(spanBot.uLo), uHi: round(spanBot.uHi) },
      tops: tops.map((t) => ({ ...t, min: round(t.min), max: round(t.max), w: round(t.w) })),
      bots: bots.map((t) => ({ ...t, min: round(t.min), max: round(t.max), w: round(t.w) })),
      overlays: overlays.map((t) => ({ ...t, min: round(t.min), max: round(t.max), w: round(t.w) })),
      deltaTopMaxToOuter: tops[0] ? round(span.bounds.outerMaxU - tops[0].max) : null,
      deltaTopMinToOuter: tops[0] ? round(tops[0].min - span.bounds.outerMinU) : null,
    };
    console.log('[H-TRIM]', out);
    return out;
  };
  window.__clodisDebugZoneFit = function __clodisDebugZoneFit(sectionIdOrIndex = 0) {
    const sections = Array.isArray(state.customSections) ? state.customSections : [];
    const sec =
      typeof sectionIdOrIndex === 'number'
        ? sections[sectionIdOrIndex]
        : sections.find((s) => s && String(s.id) === String(sectionIdOrIndex));
    if (!sec) {
      console.warn('[ZONE-FIT-DEBUG] секция не найдена', sectionIdOrIndex);
      return null;
    }
    const inner = computeSectionInnerBoundsU(sec);
    const layout = computeSectionLayout(sec);
    const wallName = sec.wallName || 'back';
    const axis = wallName === 'left' || wallName === 'right' ? 'z' : 'x';
    const furn = [];
    if (state.scene) {
      state.scene.traverse((o) => {
        if (o?.userData?.isFurniture && String(o.userData.sectionId) === String(sec.id)) {
          furn.push(o);
        }
      });
    }
    const rows = furn.map((grp) => {
      grp.updateMatrixWorld(true);
      const bbox = computeFurnitureLayoutWorldBBoxNoAo(grp);
      const minU = getAxisCoord(bbox.min, axis);
      const maxU = getAxisCoord(bbox.max, axis);
      const zi = grp.userData?.zoneIndex;
      const seg = (layout.segments || []).find((s) => s.type === 'module' && s.zoneIndex === zi);
      return {
        name: grp.userData?.catalogName || grp.name,
        zoneIndex: zi,
        cabWidthMm: Math.round(maxU - minU),
        zoneStart: seg ? Math.round(seg.startU) : null,
        zoneEnd: seg ? Math.round(seg.endU) : null,
        zoneWidthMm: seg ? Math.round(seg.endU - seg.startU) : null,
        deltaToZoneEndMm: seg ? Math.round(seg.endU - maxU) : null,
        overlapOverlayMm: seg ? Math.round(maxU - seg.endU) : null,
      };
    });
    const out = { sectionId: sec.id, wallName, inner, rows };
    console.table(rows);
    console.log('[ZONE-FIT-DEBUG]', out);
    return out;
  };
  /** Вернуть шкаф в нишу после отладки петель (пересчёт зоны/пола без hole/debug в bbox). */
  window.__cldRealignCabinetInRoom = function __cldRealignCabinetInRoom() {
    const sections = Array.isArray(state.customSections) ? state.customSections : [];
    let n = 0;
    for (const sec of sections) {
      if (!sec || !sec.group) continue;
      try {
        updateFurnitureInSection(sec);
        n++;
      } catch (e) {
        console.warn('[CLD] realign cabinet skip', sec.id, e);
      }
    }
    console.warn('[CLD] realignCabinetInRoom: sections=' + n);
    return n;
  };
  window.__clodisCreateSectionZones = createSectionZones;
  /**   :         . */
  window.__cldDumpEndCab = function __cldDumpEndCab() {
    const out = [];
    const sections = Array.isArray(state.customSections) ? state.customSections : [];
    for (const sec of sections) {
      if (!sec?.group) continue;
      for (const side of END_CABINET_SIDES) {
        if (!isEndCabinetActive(sec, side)) continue;
        const slot = getEndCabinetSlot(sec, side);
        const secY = sectionWorldY(sec);
        const rowGroups = [];
        state.scene?.traverse((obj) => {
          if (!obj?.isGroup || !obj.userData?.isFurniture || obj.userData?.isEndCabinet) return;
          if (String(obj.userData.sectionId) !== String(sec.id)) return;
          rowGroups.push(obj);
        });
        const roles = {};
        for (const grp of rowGroups) {
          grp.traverse((obj) => {
            const role = String(
              obj?.userData?.layoutRole ??
                obj?.userData?.sectionLayoutRole ??
                obj?.userData?.cldBuildItem?.layout_role ??
                ''
            )
              .trim()
              .toLowerCase();
            if (role !== 'facades' && role !== 'facades_main' && role !== 'facades_top') return;
            const b = new THREE.Box3().setFromObject(obj);
            if (b.isEmpty()) return;
            const cur = roles[role] || { count: 0, minY: Infinity, maxY: -Infinity };
            cur.count += 1;
            cur.minY = Math.min(cur.minY, Math.round(b.min.y - secY));
            cur.maxY = Math.max(cur.maxY, Math.round(b.max.y - secY));
            roles[role] = cur;
          });
        }
        const overlays = [];
        sec.group.traverse((obj) => {
          if (!obj?.userData?.isEndCabinetFacadeOverlay) return;
          const b = new THREE.Box3().setFromObject(obj);
          overlays.push({
            name: obj.name,
            role: obj.userData.layoutRole,
            minY: Math.round(b.min.y - secY),
            maxY: Math.round(b.max.y - secY),
          });
        });
        out.push({
          sectionId: sec.id,
          side,
          slotHeightMm: Math.round(Number(slot?.heightMm) || 0),
          rowGroups: rowGroups.length,
          unifiedFacade: rowGroups.map((g) => g.userData?.unifiedFacade === true),
          roles,
          overlays,
        });
      }
    }
    //  :         .
    const furnitureInfo = [];
    let furnitureFlagCount = 0;
    state.scene?.traverse((obj) => {
      const ud = obj?.userData;
      if (!ud?.isFurniture) return;
      furnitureFlagCount += 1;
      if (obj.isGroup !== true) return;
      const b = new THREE.Box3().setFromObject(obj);
      furnitureInfo.push({
        name: obj.name || obj.uuid.slice(0, 8),
        sectionId: ud.sectionId ?? null,
        zoneIndex: ud.zoneIndex ?? null,
        isEndCabinet: ud.isEndCabinet === true,
        unifiedFacade: ud.unifiedFacade === true,
        parent: obj.parent?.name || obj.parent?.type || null,
        sizeMm: b.isEmpty()
          ? null
          : {
              x: Math.round(b.max.x - b.min.x),
              y: Math.round(b.max.y - b.min.y),
              z: Math.round(b.max.z - b.min.z),
            },
      });
    });
    const sectionsInfo = sections.map((s) => ({
      id: s?.id,
      wall: s?.wallName,
      sizeMm: s?.size ? { x: Math.round(s.size.x), y: Math.round(s.size.y) } : null,
      children: (s?.group?.children || []).map((c) => c.name || c.type),
    }));
    const payload = {
      endCabinets: out,
      sections: sectionsInfo,
      furnitureFlagCount,
      furniture: furnitureInfo,
    };
    console.warn('[END-CAB-DUMP]', JSON.stringify(payload, null, 2));
    return payload;
  };
  window.__clodisDumpSectionDebug = function __clodisDumpSectionDebug() {
    try {
      const sections = Array.isArray(state.customSections) ? state.customSections : [];
      const rows = [];
      for (const sec of sections) {
        if (!sec || !sec.group || !sec.division) continue;
        const wall = sec.wallName || sec.division.wallName || 'back';
        const axis = wall === 'left' || wall === 'right' ? 'z' : 'x';
        const secWidthU = axis === 'x' ? Number(sec.size?.x || 0) : Number(sec.size?.z || 0);
        const sectionStartU = Number(sec.division.sectionStart || 0);
        const partSize = Number(sec.division.partSize || 0);
        const parts = Number(sec.division.parts || 0);
        const gaps = getSectionZoneTransitionGaps(sec.id, wall, parts);
        const sectionEndU = sectionStartU + partSize * parts + cumulativeTransitionGapMm(gaps, parts);
        rows.push({
          type: 'section',
          sectionId: sec.id,
          wall,
          secWidthU,
          sectionStartU,
          sectionEndU,
          partSize,
          parts,
          gaps,
        });

        if (state.scene) {
          state.scene.traverse((obj) => {
            if (!obj?.userData?.isFurniture) return;
            if (obj.userData.sectionId !== sec.id) return;
            const b = computeFurnitureWorldBBoxNoAo(obj);
            const minU = axis === 'x' ? b.min.x : b.min.z;
            const maxU = axis === 'x' ? b.max.x : b.max.z;
            rows.push({
              type: 'furniture',
              sectionId: sec.id,
              wall,
              name: obj.name || '(group)',
              zoneIndex: obj.userData?.zoneIndex,
              widthU: maxU - minU,
              minU,
              maxU,
            });
          });
        }
      }
      console.table(rows);
      return rows;
    } catch (e) {
      console.warn('[DUMP-SECTION-DEBUG] error', e);
      return [];
    }
  };
  window.__clodisDumpLayoutRecalc = function __clodisDumpLayoutRecalc() {
    try {
      const rows = [];
      const sections = Array.isArray(state.customSections) ? state.customSections : [];
      const sectionRows = [];
      let sceneFurnitureCount = 0;
      try {
        if (state.scene) {
          state.scene.traverse((obj) => {
            if (obj?.userData?.isFurniture) sceneFurnitureCount++;
          });
        }
      } catch (_) {}
      for (const sec of sections) {
        if (!sec || !sec.division) continue;
        const wall = sec.wallName || sec.division.wallName || 'back';
        const axis = wall === 'left' || wall === 'right' ? 'z' : 'x';
        const sectionWidthU = axis === 'x' ? Number(sec.size?.x || 0) : Number(sec.size?.z || 0);
        const cache = sec._layoutCache || { segments: [] };
        const capSegs = (cache.segments || []).filter((s) => s.type === 'cap');
        const moduleSegs = (cache.segments || []).filter((s) => s.type === 'module');

        rows.push({
          type: 'section',
          sectionId: sec.id,
          wall,
          sectionWidthU,
          partSize: Number(sec.division.partSize || 0),
          parts: Number(sec.division.parts || 0),
          capCount: capSegs.length,
          capTotalMm: capSegs.reduce((sum, s) => sum + (s.endU - s.startU), 0),
          sectionStartU: Number(sec.division.sectionStart || 0),
          sectionEndByLayout: moduleSegs.length > 0
            ? Math.max(...moduleSegs.map((s) => s.endU), ...capSegs.map((s) => s.endU))
            : Number(sec.division.sectionStart || 0),
        });
        sectionRows.push(rows[rows.length - 1]);

        if (state.scene) {
          state.scene.traverse((obj) => {
            if (!obj?.userData?.isFurniture) return;
            if (obj.userData.sectionId !== sec.id) return;
            const seg = moduleSegs.find((s) => s.furnitureUuid === obj.uuid) || null;
            const b = computeFurnitureWorldBBoxNoAo(obj);
            const minU = axis === 'x' ? b.min.x : b.min.z;
            const maxU = axis === 'x' ? b.max.x : b.max.z;
            rows.push({
              type: 'furniture',
              sectionId: sec.id,
              wall,
              name: obj.name || '(group)',
              uuid: obj.uuid,
              zoneIndex: obj.userData?.zoneIndex,
              expectedStartU: seg ? seg.startU : null,
              expectedEndU: seg ? seg.endU : null,
              bboxMinU: minU,
              bboxMaxU: maxU,
              expectedWidth: seg ? seg.endU - seg.startU : null,
              actualWidth: maxU - minU,
              deltaFromStart: seg ? (minU - seg.startU) : null,
              deltaToEnd: seg ? (seg.endU - maxU) : null,
            });
          });
        }
      }
      console.log('[LAYOUT-RECALC][DIAG]', {
        sectionsTotal: sections.length,
        sceneFurnitureCount,
        rowsTotal: rows.length,
        sectionsWithLayoutCache: sections.filter((s) => s?._layoutCache?.segments?.length > 0).length,
      });
      // Wall-level chain debug: check section continuity from right plank to left plank.
      try {
        const roomBounds = (() => {
          if (!state.room?.group) return null;
          const b = new THREE.Box3().setFromObject(state.room.group);
          return {
            minX: b.min.x, maxX: b.max.x,
            minZ: b.min.z, maxZ: b.max.z,
          };
        })();
        const byWall = new Map();
        for (const s of sectionRows) {
          const arr = byWall.get(s.wall) || [];
          const startU = Number(s.sectionStartU || 0);
          const endU = Number(s.sectionEndByLayout || startU);
          arr.push({
            sectionId: s.sectionId,
            wall: s.wall,
            leftVerticalPlankU: Math.min(startU, endU),
            rightVerticalPlankU: Math.max(startU, endU),
            widthByPlanksMm: Math.abs(endU - startU),
            sectionWidthU: Number(s.sectionWidthU || 0),
            partSize: Number(s.partSize || 0),
            parts: Number(s.parts || 0),
            capCount: Number(s.capCount || 0),
          });
          byWall.set(s.wall, arr);
        }
        for (const [wall, arr] of byWall.entries()) {
          arr.sort((a, b) => b.rightVerticalPlankU - a.rightVerticalPlankU); // right -> left
          const chain = [];
          for (let i = 0; i < arr.length; i++) {
            const cur = arr[i];
            const prev = i > 0 ? arr[i - 1] : null;
            const next = i < arr.length - 1 ? arr[i + 1] : null;
            const joinDeltaFromRightNeighbor = prev
              ? cur.rightVerticalPlankU - prev.leftVerticalPlankU
              : null;
            const joinDeltaToLeftNeighbor = next
              ? cur.leftVerticalPlankU - next.rightVerticalPlankU
              : null;
            chain.push({
              orderFromRight: i,
              sectionId: cur.sectionId,
              wall,
              rightVerticalPlankU: cur.rightVerticalPlankU,
              leftVerticalPlankU: cur.leftVerticalPlankU,
              widthByPlanksMm: cur.widthByPlanksMm,
              sectionWidthU: cur.sectionWidthU,
              widthDeltaMm: cur.widthByPlanksMm - cur.sectionWidthU,
              joinDeltaFromRightNeighbor,
              joinDeltaToLeftNeighbor,
              parts: cur.parts,
              capCount: cur.capCount,
              partSize: cur.partSize,
            });
          }
          let roomOverflow = null;
          if (roomBounds) {
            const axis = wall === 'left' || wall === 'right' ? 'z' : 'x';
            const roomMin = axis === 'x' ? roomBounds.minX : roomBounds.minZ;
            const roomMax = axis === 'x' ? roomBounds.maxX : roomBounds.maxZ;
            const wallMin = Math.min(...arr.map((x) => x.leftVerticalPlankU));
            const wallMax = Math.max(...arr.map((x) => x.rightVerticalPlankU));
            roomOverflow = {
              axis,
              roomMin,
              roomMax,
              wallMin,
              wallMax,
              overflowLeftMm: roomMin - wallMin,
              overflowRightMm: wallMax - roomMax,
            };
          }
          console.log('[LAYOUT-R2L][WALL-CHAIN]', {
            wall,
            sectionsCount: arr.length,
            roomOverflow,
            chain,
          });
        }
      } catch (e) {
        console.warn('[LAYOUT-R2L][WALL-CHAIN] error', e);
      }
      if (rows.length === 0) {
        console.warn(
          '[LAYOUT-RECALC][DIAG] Empty report. Add at least one section with furniture, then run debug again.'
        );
      }
      console.table(rows);
      return rows;
    } catch (e) {
      console.warn('[DUMP-LAYOUT-RECALC] error', e);
      return [];
    }
  };
  window.__clodisRunSectionDebug = function __clodisRunSectionDebug() {
    try {
      window.DEBUG_CAP_ALIGNMENT = true;
      window.DEBUG_PIVOT_TRACE = true;
      window.__DEBUG_CAP_ALIGNMENT_LOGGED = new Set();
      window.__DEBUG_CAP_MARKERS_LOGGED = new Set();
      console.log('[PIVOT-TRACE] ON (via __clodisRunSectionDebug)');
      if (Array.isArray(state.customSections)) {
        for (const sec of state.customSections) {
          if (typeof window.__clodisUpdateFurnitureInSection === 'function') {
            window.__clodisUpdateFurnitureInSection(sec);
          }
        }
      }
      try {
        rebuildAllTransitions();
      } catch (_) {}
      return window.__clodisDumpSectionDebug();
    } catch (e) {
      console.warn('[RUN-SECTION-DEBUG] error', e);
      return [];
    }
  };
  window.__clodisRunLayoutRecalcDebug = function __clodisRunLayoutRecalcDebug() {
    try {
      window.DEBUG_CAP_ALIGNMENT = true;
      window.__DEBUG_CAP_ALIGNMENT_LOGGED = new Set();
      if (Array.isArray(state.customSections)) {
        for (const sec of state.customSections) {
          if (typeof window.__clodisUpdateFurnitureInSection === 'function') {
            window.__clodisUpdateFurnitureInSection(sec);
          }
        }
      }
      try {
        rebuildAllTransitions();
      } catch (_) {}
      return window.__clodisDumpLayoutRecalc();
    } catch (e) {
      console.warn('[RUN-LAYOUT-RECALC-DEBUG] error', e);
      return [];
    }
  };
  window.__clodisDiagRuntimeState = function __clodisDiagRuntimeState() {
    try {
      const out = {
        customSectionsCount: Array.isArray(state.customSections) ? state.customSections.length : 0,
        sceneExists: !!state.scene,
        sceneSectionGroups: 0,
        sceneFurnitureGroups: 0,
      };
      if (state.scene) {
        state.scene.traverse((obj) => {
          if (obj?.userData?.isSection || obj?.userData?.isCustomSection) out.sceneSectionGroups++;
          if (obj?.userData?.isFurniture) out.sceneFurnitureGroups++;
        });
      }
      console.log('[LAYOUT-RECALC][RUNTIME-STATE]', out);
      return out;
    } catch (e) {
      console.warn('[LAYOUT-RECALC][RUNTIME-STATE] error', e);
      return null;
    }
  };

  // :     GAP  CAP.
  try {
    Object.defineProperty(window, 'DEBUG_GAP_ALIGNMENT', {
      configurable: true,
      enumerable: true,
      get() {
        return !!window.DEBUG_CAP_ALIGNMENT;
      },
      set(v) {
        window.DEBUG_CAP_ALIGNMENT = !!v;
      },
    });
  } catch (_) {
    window.DEBUG_GAP_ALIGNMENT = false;
  }

  /**
   * Пивот шкафа (group.position) vs зона секции vs bbox корпуса (без AO).
   * Контракт back/right: pivotU = zoneStart (= bbox.minU при ширине = зоне).
   * front/left: pivotU = zoneEnd (= bbox.maxU).
   * Запуск: __clodisCheckFurniturePivot()
   */
  window.__clodisCheckFurniturePivot = function __clodisCheckFurniturePivot() {
    const rows = [];
    try {
      if (!state.scene) {
        console.warn('[PIVOT-CHECK] нет scene');
        return rows;
      }
      const sections = Array.isArray(state.customSections) ? state.customSections : [];
      for (const sec of sections) {
        if (!sec?.division) continue;
        const wall = String(sec.wallName || sec.division.wallName || 'back');
        const axis = wall === 'left' || wall === 'right' ? 'z' : 'x';
        const layout =
          sec._layoutCache && Array.isArray(sec._layoutCache.segments)
            ? sec._layoutCache
            : typeof computeSectionLayout === 'function'
              ? computeSectionLayout(sec)
              : null;
        const segs = (layout?.segments || []).filter((s) => s.type === 'module');
        const sectionStart = Number(sec.division.sectionStart);
        const sectionEnd = Number(sec.division.sectionEnd);
        state.scene.traverse((obj) => {
          if (!obj?.userData?.isFurniture) return;
          if (obj.userData.sectionId !== sec.id) return;
          const zi = Number(obj.userData.zoneIndex);
          const seg =
            segs.find((s) => s.furnitureUuid === obj.uuid) ||
            segs.find((s) => s.zoneIndex === zi) ||
            null;
          if (!seg) {
            rows.push({
              sectionId: sec.id,
              wall,
              name: obj.name || '(group)',
              verdict: 'NO_ZONE_SEG',
            });
            return;
          }
          const zoneStart = Number(seg.startU);
          const zoneEnd = Number(seg.endU);
          const zoneW = zoneEnd - zoneStart;
          const pivotAtEnd = wall === 'left' || wall === 'front';
          const expectedPivotU = pivotAtEnd ? zoneEnd : zoneStart;
          const grpPivotU = axis === 'x' ? obj.position.x : obj.position.z;
          obj.updateMatrixWorld(true);
          const bb = computeFurnitureZoneFitWorldBBox(obj);
          const layoutBb = computeFurnitureLayoutWorldBBoxNoAo(obj);
          const bboxMinU = axis === 'x' ? bb.min.x : bb.min.z;
          const bboxMaxU = axis === 'x' ? bb.max.x : bb.max.z;
          const layoutMinU = axis === 'x' ? layoutBb.min.x : layoutBb.min.z;
          const bboxW = bboxMaxU - bboxMinU;
          const dPivot = grpPivotU - expectedPivotU;
          const dStart = bboxMinU - zoneStart;
          const dEnd = zoneEnd - bboxMaxU;
          const dWidth = zoneW - bboxW;
          let verdict = 'OK';
          if (Math.abs(dStart) > 1 || Math.abs(dEnd) > 1) verdict = 'SHIFT';
          else if (Math.abs(dPivot) > 1) verdict = 'PIVOT_OFF';
          rows.push({
            sectionId: sec.id,
            wall,
            zoneIndex: zi,
            name: obj.name || '(group)',
            expectedPivotU: Math.round(expectedPivotU * 10) / 10,
            groupPivotU: Math.round(grpPivotU * 10) / 10,
            deltaPivotMm: Math.round(dPivot * 10) / 10,
            zoneStart: Math.round(zoneStart * 10) / 10,
            zoneEnd: Math.round(zoneEnd * 10) / 10,
            zoneW: Math.round(zoneW * 10) / 10,
            bboxMinU: Math.round(bboxMinU * 10) / 10,
            bboxMaxU: Math.round(bboxMaxU * 10) / 10,
            bboxW: Math.round(bboxW * 10) / 10,
            layoutVsWorldMm: Math.round((layoutMinU - bboxMinU) * 10) / 10,
            deltaFromStartMm: Math.round(dStart * 10) / 10,
            deltaToEndMm: Math.round(dEnd * 10) / 10,
            shortfallMm: Math.round(dWidth * 10) / 10,
            sectionStart: Number.isFinite(sectionStart) ? Math.round(sectionStart * 10) / 10 : undefined,
            sectionEnd: Number.isFinite(sectionEnd) ? Math.round(sectionEnd * 10) / 10 : undefined,
            zoneEndVsSectionEndMm:
              Number.isFinite(sectionEnd) && Number.isFinite(zoneEnd)
                ? Math.round((zoneEnd - sectionEnd) * 10) / 10
                : undefined,
            verdict,
          });
        });
      }
      console.table(rows);
      console.log(
        '[PIVOT-CHECK] OK = пивот на краю зоны и bbox заполняет зону. ' +
          'PIVOT_OFF = group.position не на zoneStart/End. ' +
          'GAP_AT_ZONE_END / SHORT_RIGHT_OR_WIDTH = пивот ок, шкаф уже зоны (щель справа на back). ' +
          'Смотри zoneEndVsSectionEndMm: если >0 — зона длиннее sectionEnd (clamp уедет влево).'
      );
      return rows;
    } catch (e) {
      console.warn('[PIVOT-CHECK] error', e);
      return rows;
    }
  };

  /**
   *    bbox   (U):    min/max.
   * Запуск: __clodisDumpBBoxWidthContrib()
   * Опц.: __clodisDumpBBoxWidthContrib(4) — только zoneIndex
   */
  window.__clodisDumpBBoxWidthContrib = function __clodisDumpBBoxWidthContrib(zoneIndexFilter) {
    const out = [];
    try {
      if (!state.scene) {
        console.warn('[BBOX-W] нет scene');
        return out;
      }
      const ziFilter =
        zoneIndexFilter != null && Number.isFinite(Number(zoneIndexFilter))
          ? Number(zoneIndexFilter)
          : null;
      const classify = (obj) => {
        const nm = String(obj.name || '');
        const ud = obj.userData || {};
        let p = obj;
        for (let i = 0; i < 20 && p; i++) {
          const pud = p.userData || {};
          const pn = String(p.name || '');
          if (pud.isHandle || /ручк/i.test(pn) || /handle/i.test(pn)) return 'handle';
          if (pn === '__door_swing' || pud.cldDoorSwing) return 'door_swing';
          if (pud.isFacade || pud.isFacadeShell || /фасад/i.test(pn) || /^facades_/i.test(pn))
            return 'facade';
          if (
            pud.fromDrillTemplateModel ||
            pud.cldHingeCatalogModel ||
            pud.isHingeCabinetModelMetal ||
            /^furni_hinge_/i.test(pn)
          )
            return 'hinge_or_drill';
          if (pud.layoutRole === 'corpus' || pud.isBody || /корпус/i.test(pn)) return 'corpus';
          if (pud.layoutRole === 'plinth' || /цокол/i.test(pn)) return 'plinth';
          if (pud.layoutRole === 'top' || /крыш|антресол/i.test(pn)) return 'top';
          p = p.parent;
        }
        if (ud.isFacade) return 'facade';
        if (ud.isBody) return 'corpus';
        return nm ? `other:${nm.slice(0, 40)}` : 'other';
      };

      state.scene.traverse((grp) => {
        if (!grp?.userData?.isFurniture) return;
        const zi = Number(grp.userData.zoneIndex);
        if (ziFilter != null && zi !== ziFilter) return;
        const wall = String(grp.userData.wallName || 'back');
        const axis = wall === 'left' || wall === 'right' ? 'z' : 'x';
        grp.updateMatrixWorld(true);

        const meshes = [];
        grp.traverse((obj) => {
          if (shouldExcludeMeshFromFurnitureBBox(obj)) return;
          try {
            const b = new THREE.Box3().setFromObject(obj);
            const minU = axis === 'x' ? b.min.x : b.min.z;
            const maxU = axis === 'x' ? b.max.x : b.max.z;
            if (!Number.isFinite(minU) || !Number.isFinite(maxU)) return;
            meshes.push({
              name: String(obj.name || '(mesh)').slice(0, 60),
              kind: classify(obj),
              minU: _r1(minU),
              maxU: _r1(maxU),
              w: _r1(maxU - minU),
              uuid8: String(obj.uuid || '').slice(0, 8),
            });
          } catch (_) {}
        });
        if (!meshes.length) return;

        let gMin = Infinity;
        let gMax = -Infinity;
        for (const m of meshes) {
          if (m.minU < gMin) gMin = m.minU;
          if (m.maxU > gMax) gMax = m.maxU;
        }
        const eps = 0.6;
        const atMin = meshes.filter((m) => m.minU <= gMin + eps).sort((a, b) => a.minU - b.minU);
        const atMax = meshes.filter((m) => m.maxU >= gMax - eps).sort((a, b) => b.maxU - a.maxU);

        const byKind = {};
        for (const m of meshes) {
          const k = m.kind;
          if (!byKind[k]) byKind[k] = { minU: m.minU, maxU: m.maxU };
          else {
            byKind[k].minU = Math.min(byKind[k].minU, m.minU);
            byKind[k].maxU = Math.max(byKind[k].maxU, m.maxU);
          }
        }
        const kindRows = Object.keys(byKind)
          .map((k) => ({
            kind: k,
            minU: _r1(byKind[k].minU),
            maxU: _r1(byKind[k].maxU),
            w: _r1(byKind[k].maxU - byKind[k].minU),
          }))
          .sort((a, b) => b.w - a.w);

        let closedW = null;
        try {
          withFurnitureDoorSwingsClosedForMeasure(grp, () => {
            const bb = computeFurnitureWorldBBoxNoAo(grp);
            const a = axis === 'x' ? bb.min.x : bb.min.z;
            const b = axis === 'x' ? bb.max.x : bb.max.z;
            closedW = _r1(b - a);
          });
        } catch (_) {}

        const sec = (Array.isArray(state.customSections) ? state.customSections : []).find(
          (s) => s?.id === grp.userData.sectionId
        );
        let zoneW = null;
        let zoneStart = null;
        let zoneEnd = null;
        try {
          const segs = sec?._layoutCache?.segments || [];
          const seg =
            segs.find((s) => s.type === 'module' && s.furnitureUuid === grp.uuid) ||
            segs.find((s) => s.type === 'module' && s.zoneIndex === zi) ||
            null;
          if (seg) {
            zoneStart = _r1(seg.startU);
            zoneEnd = _r1(seg.endU);
            zoneW = _r1(seg.endU - seg.startU);
          }
        } catch (_) {}

        const row = {
          zoneIndex: zi,
          wall,
          uuid8: String(grp.uuid || '').slice(0, 8),
          scaleX: _r1(grp.scale.x),
          initialW: grp.userData?.__initialSectionSizeMm?.x ?? null,
          bboxMinU: _r1(gMin),
          bboxMaxU: _r1(gMax),
          bboxW: _r1(gMax - gMin),
          zoneStart,
          zoneEnd,
          zoneW,
          excessMm: zoneW != null ? _r1(gMax - gMin - zoneW) : null,
          bboxW_doorsClosed: closedW,
          atMin: atMin.slice(0, 8),
          atMax: atMax.slice(0, 8),
          byKind: kindRows,
        };
        out.push(row);
        console.log('[BBOX-W] furniture', {
          zoneIndex: row.zoneIndex,
          bboxW: row.bboxW,
          zoneW: row.zoneW,
          excessMm: row.excessMm,
          scaleX: row.scaleX,
          initialW: row.initialW,
          bboxW_doorsClosed: row.bboxW_doorsClosed,
        });
        console.log('[BBOX-W] byKind (extремумы по типу)');
        console.table(kindRows);
        console.log('[BBOX-W] meshes at MIN edge (кто тянет влево)');
        console.table(atMin.slice(0, 8));
        console.log('[BBOX-W] meshes at MAX edge (кто тянет вправо / +7)');
        console.table(atMax.slice(0, 8));
      });
      if (!out.length) console.warn('[BBOX-W] мебель не найдена');
      return out;
    } catch (e) {
      console.warn('[BBOX-W] error', e);
      return out;
    }
  };

  /**
   * Трассировка place/relayout: __clodisPivotTrace(true)
   * Сразу прогоняет updateFurnitureInSection по секциям (логи [PIVOT-TRACE]), затем pivot-check.
   * Выкл: __clodisPivotTrace(false)
   */
  window.__clodisPivotTrace = function __clodisPivotTrace(on) {
    window.DEBUG_PIVOT_TRACE = on !== false;
    console.log(
      '[PIVOT-TRACE] ' +
        (window.DEBUG_PIVOT_TRACE
          ? 'ON   relayout '
          : 'OFF')
    );
    if (!window.DEBUG_PIVOT_TRACE) return false;
    let n = 0;
    try {
      if (Array.isArray(state.customSections)) {
        for (const sec of state.customSections) {
          if (!sec?.division) continue;
          updateFurnitureInSection(sec);
          n++;
        }
      }
    } catch (e) {
      console.warn('[PIVOT-TRACE] relayout error', e);
    }
    console.log('[PIVOT-TRACE] relayout done, sections=', n, '— смотри строки выше; фильтр: PIVOT-TRACE');
    try {
      if (typeof window.__clodisCheckFurniturePivot === 'function') {
        window.__clodisCheckFurniturePivot();
      }
    } catch (_) {}
    return true;
  };
}

function updateSectionSize(sectionData, offsets, newDepth) {
  if (!sectionData || !sectionData.group || !state.room) {
    console.error('❌     ');
    return;
  }

  const wallName = sectionData.wallName || 'back';
  const gap = 2;

  let newWidth;
  let newHeight;
  let newDepthMm;

  // newDepth ()  ""  (  )
  newDepthMm = newDepth * 10;

  //   5    ;    - 
  //     ( /   / ).   .

  //      ,    
  console.log('[SEC-UPD] updateSectionSize start', {
    sectionId: sectionData.id,
    wallName,
    offsets,
    newDepthCm: newDepth,
    room: {
      width: state.room.width,
      depth: state.room.depth,
      height: state.room.height,
    },
  });

  if (wallName === 'front' || wallName === 'back') {
    const endCabL = getEndCabinetReserveMm(sectionData, 'left');
    const endCabR = getEndCabinetReserveMm(sectionData, 'right');
    const baseAlong = sectionAlongBaseMm(sectionData, state.room);
    newWidth =
      baseAlong - offsets.left * 10 - offsets.right * 10 - endCabL - endCabR;
    if (Number(sectionData.fixedHeightMm) > 0) {
      const locked = Number(sectionData.fixedHeightMm);
      newHeight = Math.max(
        100,
        locked - (offsets.bottom ?? 0) * 10 - (offsets.top ?? 0) * 10
      );
    } else if (sectionData.underWindowBay) {
      const sill =
        Number(sectionData.sillMm) ||
        Number(sectionData.size?.y) ||
        900;
      newHeight = Math.max(
        100,
        sill - (offsets.bottom ?? 0) * 10 - (offsets.top ?? 0) * 10
      );
    } else {
      newHeight =
        state.room.height -
        offsets.bottom * 10 -
        offsets.top * 10;
    }
  } else if (wallName === 'left' || wallName === 'right') {
    // Для боковых стен длина вдоль стены считается по пролёту (или room.depth) и offsets.front/back,
    // но это будет размер по Z. Толщина внутрь комнаты = newDepthMm (размер по X).
    const endCabF = getEndCabinetReserveMm(sectionData, 'front');
    const endCabB = getEndCabinetReserveMm(sectionData, 'back');
    const baseAlong = sectionAlongBaseMm(sectionData, state.room);
    newWidth =
      baseAlong - offsets.front * 10 - offsets.back * 10 - endCabF - endCabB;
    if (Number(sectionData.fixedHeightMm) > 0) {
      const locked = Number(sectionData.fixedHeightMm);
      newHeight = Math.max(
        100,
        locked - (offsets.bottom ?? 0) * 10 - (offsets.top ?? 0) * 10
      );
    } else if (sectionData.underWindowBay) {
      const sill =
        Number(sectionData.sillMm) ||
        Number(sectionData.size?.y) ||
        900;
      newHeight = Math.max(
        100,
        sill - (offsets.bottom ?? 0) * 10 - (offsets.top ?? 0) * 10
      );
    } else {
      newHeight =
        state.room.height -
        offsets.bottom * 10 -
        offsets.top * 10;
    }
  }

  if (newWidth <= 0 || newHeight <= 0 || newDepthMm <= 0) {
    showSectionSizeLimitModal(
      ' .      .\n        ,   .'
    );
    return;
  }

  console.log('[SEC-UPD] computed logical sizes', {
    wallName,
    newWidthMm: newWidth,
    newHeightMm: newHeight,
    newDepthMm,
  });

  const roomWorldPos = new THREE.Vector3();
  state.room.group.getWorldPosition(roomWorldPos);

  const extent =
    wallName === 'left' || wallName === 'right'
      ? { x: newDepthMm, y: newHeight, z: newWidth } // X=толщина внутрь комнаты, Z=длина вдоль стены
      : { x: newWidth, y: newHeight, z: newDepthMm };

  let finalX;
  let finalY;
  let finalZ;

  switch (wallName) {
    case 'front': {
      const endCabR = getEndCabinetReserveMm(sectionData, 'right');
      const piv = sectionPivotFromSpanOffsets(
        sectionData,
        state.room,
        offsets,
        extent.x,
        0,
        endCabR
      );
      finalX = piv.finalX;
      finalY = piv.finalY;
      finalZ = piv.finalZ;
      break;
    }
    case 'back': {
      const endCabL = getEndCabinetReserveMm(sectionData, 'left');
      const piv = sectionPivotFromSpanOffsets(
        sectionData,
        state.room,
        offsets,
        extent.x,
        endCabL,
        0
      );
      finalX = piv.finalX;
      finalY = piv.finalY;
      finalZ = piv.finalZ;
      break;
    }
    case 'left': {
      const endCabF = getEndCabinetReserveMm(sectionData, 'front');
      const piv = sectionPivotFromSpanOffsets(
        sectionData,
        state.room,
        offsets,
        extent.z,
        endCabF,
        0
      );
      finalX = piv.finalX;
      finalY = piv.finalY;
      finalZ = piv.finalZ;
      break;
    }
    case 'right': {
      const endCabF = getEndCabinetReserveMm(sectionData, 'front');
      const piv = sectionPivotFromSpanOffsets(
        sectionData,
        state.room,
        offsets,
        extent.z,
        endCabF,
        0
      );
      finalX = piv.finalX;
      finalY = piv.finalY;
      finalZ = piv.finalZ;
      break;
    }
    default:
      console.error('❌ Неизвестная стена:', wallName);
      return;
  }

  const newWorldPos = new THREE.Vector3(
    roomWorldPos.x + finalX,
    roomWorldPos.y + finalY,
    roomWorldPos.z + finalZ
  );

  //      (    )
  const frontLeft = new THREE.Vector3(roomWorldPos.x, roomWorldPos.y, roomWorldPos.z);
  const frontRight = new THREE.Vector3(
    roomWorldPos.x + state.room.width,
    roomWorldPos.y,
    roomWorldPos.z
  );
  const backRight = new THREE.Vector3(
    roomWorldPos.x + state.room.width,
    roomWorldPos.y,
    roomWorldPos.z + state.room.depth
  );
  const backLeft = new THREE.Vector3(
    roomWorldPos.x,
    roomWorldPos.y,
    roomWorldPos.z + state.room.depth
  );

  let targetCorner = null;
  if (wallName === 'back') targetCorner = frontLeft;
  if (wallName === 'front') targetCorner = backLeft;
  if (wallName === 'right') targetCorner = frontRight;

  console.log('[SEC-UPD] final transform', {
    wallName,
    extent,
    finalLocal: { x: finalX, y: finalY, z: finalZ },
    newWorldPos,
    cornerMatch: targetCorner
      ? {
          targetName: wallName === 'back' ? 'front-left (far)' : wallName === 'front' ? 'back-left (near)' : 'front-right (corner 2)',
          targetPos: targetCorner,
          delta: newWorldPos.clone().sub(targetCorner),
        }
      : null,
  });

  const sectionGroup = sectionData.group;
  const childrenToRemove = [];
  sectionGroup.traverse((child) => {
    if (child.isMesh || child.isLineSegments) {
      childrenToRemove.push(child);
    }
  });
  childrenToRemove.forEach((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose());
      } else {
        child.material.dispose();
      }
    }
    sectionGroup.remove(child);
  });

  let geometry = new THREE.BoxGeometry(extent.x, extent.y, extent.z);
  if (wallName === 'right') {
    geometry.translate(-extent.x / 2, extent.y / 2, extent.z / 2);
  } else if (wallName === 'left') {
    geometry.translate(extent.x / 2, extent.y / 2, -extent.z / 2);
  } else if (wallName === 'front') {
    geometry.translate(-extent.x / 2, extent.y / 2, -extent.z / 2);
  } else {
    geometry.translate(extent.x / 2, extent.y / 2, extent.z / 2);
  }
  const edges = new THREE.EdgesGeometry(geometry);
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x00aa00,
    linewidth: 1,
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
  });
  const wireframe = new THREE.LineSegments(edges, lineMaterial);
  wireframe.position.set(0, 0, 0);
  wireframe.visible = __sectionNicheVisualsEnabled;
  wireframe.userData.isSectionNicheDebugPart = true;
  wireframe.userData.debugSectionId = sectionData.id;
  wireframe.userData.debugPartKind = 'wire';
  sectionGroup.add(wireframe);

  const fillMaterial = new THREE.MeshBasicMaterial({
    color: 0x00aa00,
    transparent: true,
    opacity: 0.05,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const fillMesh = new THREE.Mesh(geometry, fillMaterial);
  fillMesh.position.set(0, 0, 0);
  fillMesh.visible = __sectionNicheVisualsEnabled;
  fillMesh.userData.isSectionNicheDebugPart = true;
  fillMesh.userData.debugSectionId = sectionData.id;
  fillMesh.userData.debugPartKind = 'fill';
  sectionGroup.add(fillMesh);

  const pivotMarker = new THREE.Mesh(
    new THREE.SphereGeometry(40, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0x00aa00, transparent: true, opacity: 0.8, depthTest: false })
  );
  pivotMarker.position.set(0, 0, 0);
  pivotMarker.visible = __sectionNicheVisualsEnabled;
  pivotMarker.userData.isSectionNicheDebugPart = true;
  pivotMarker.userData.debugSectionId = sectionData.id;
  pivotMarker.userData.debugPartKind = 'pivot';
  pivotMarker.renderOrder = 120;
  sectionGroup.add(pivotMarker);

  //       sectionData
  sectionData.offsets = {
    leftMm: (offsets.left ?? 0) * 10 || 0,
    rightMm: (offsets.right ?? 0) * 10 || 0,
    frontMm: (offsets.front ?? 0) * 10 || 0,
    backMm: (offsets.back ?? 0) * 10 || 0,
    bottomMm: (offsets.bottom ?? 0) * 10 || 0,
    topMm: (offsets.top ?? 0) * 10 || 0,
  };

  //     ,
  //      (/)
  //     sectionData.size.
  sectionData.size = { x: extent.x, y: extent.y, z: extent.z };
  sectionData.facadeDepthMm =
    wallName === 'left' || wallName === 'right' ? extent.x : extent.z;

  if (!sectionData.fixedHeightMm) {
    if (
      sectionShouldHaveCeilingTopPlank(sectionData) &&
      !(
        isWindowAlongLayoutSection(sectionData) &&
        !sectionHasPlacedFurniture(sectionData)
      )
    ) {
      addDefaultTopPlank(sectionGroup, extent.x, extent.y, extent.z, wallName, sectionData);
    } else if (
      isWindowAlongLayoutSection(sectionData) &&
      !sectionShouldHaveCeilingTopPlank(sectionData)
    ) {
      removeCeilingTopPlankMeshes(sectionGroup);
    }
    if (sectionData.windowLowSlot) {
      try {
        applyWindowAsLowSlotLikeStraightSection(sectionData);
      } catch (e) {
        console.warn('⚠️ applyWindowAsLowSlotLikeStraightSection failed on updateSectionSize:', e);
      }
    }
  }
  if (
    isWindowAlongLayoutSection(sectionData) &&
    !sectionHasPlacedFurniture(sectionData)
  ) {
    removeWindowAlongEmptyFrameMeshes(sectionGroup);
  } else {
    addDefaultBottomPlank(sectionGroup, extent.x, extent.y, extent.z, wallName, sectionData);
    addSidePlanksIfNeeded(sectionGroup, extent.x, extent.y, extent.z, wallName, offsets, sectionData);
  }
  try {
    syncSectionEmptyFrameVisibility(sectionData);
  } catch (_) {}

  // Recompute partSize / parts AFTER planks are created so computeInnerBoundsU
  // sees the correct SidePlank / SideOverlay insets (50 mm vs 16 mm).
  if (sectionData.division) {
    sectionData._sectionGeomRelayoutPending = true;
    sectionData._relayoutZonesFromPosition = true;
    computeSectionLayout(sectionData);
  }
  //          (  )
  addBackSectionCornerMarker(sectionGroup, extent.x, extent.y, extent.z, wallName, sectionData);
  addBackSectionCornerMarkerLeft(sectionGroup, extent.x, extent.y, extent.z, wallName, sectionData);

  sectionGroup.position.copy(newWorldPos);

  sectionData.position = {
    x: newWorldPos.x,
    y: newWorldPos.y,
    z: newWorldPos.z,
  };

  if (state.sectionDimensionLabels[sectionData.id]) {
    state.sectionDimensionLabels[sectionData.id].forEach((label) => {
      if (label && label.parentNode) {
        label.parentNode.removeChild(label);
      }
    });
    delete state.sectionDimensionLabels[sectionData.id];
  }

  addSectionDimensionLabels(
    sectionData.id,
    sectionGroup,
    extent.x,
    extent.y,
    extent.z,
    wallName
  );

  updateCabinetMarkersForSection(sectionData.id);
  if (sectionData.division) {
    createSectionZones(sectionData);
  }

  refreshSectionVerticalLayout(sectionData);
  if (__horizontalRoleSectionsEnabled) {
    createHorizontalRoleSections(sectionData);
  }

  //           
  if (typeof updateFurnitureInSection === 'function') {
    updateFurnitureInSection(sectionData);
  }
  //     :      .
  runEndCabinetSyncSteps(sectionData, [
    ['wallPlanks', syncEndCabinetWallPlanks],
    ['furniture', syncEndCabinetsAfterSectionUpdate],
    ['topPlanks', syncEndCabinetTopPlanks],
    ['plinths', syncEndCabinetPlinths],
    ['facadeOverlays', syncEndCabinetFacadeOverlays],
  ]);
  //        (  resize   / ).
  try {
    if (typeof rebuildSectionZoneEditIconsForSection === 'function') {
      rebuildSectionZoneEditIconsForSection(sectionData.id);
    }
  } catch (e) {}
  //           
  // (     ).
  try {
    recalcFurniturePricingAfterGeometryChange();
  } catch (e) {}

  console.log('✅   :', {
    id: sectionData.id,
    newSize: sectionData.size,
    newPosition: sectionData.position,
  });

  //     →   : +  .
  try {
    syncUnderWindowBayToSideOverlays(sectionData, {
      updateSectionSize,
      getSectionOffsetsMm,
    });
  } catch (e) {
    console.warn('[WIN-BAY] syncUnderWindowBayToSideOverlays', e);
  }

  // Rebuild transition caps (side/top) between neighboring sections
  try {
    rebuildAllTransitions();
  } catch (e) {
    console.error('[SEC-UPD] rebuildAllTransitions failed', e);
  }

  try {
    if (typeof window !== 'undefined' && typeof window.refreshFurnitureDecors === 'function') {
      window.refreshFurnitureDecors();
    } else {
      scheduleRefreshSectionTrimEdgesInRoom();
    }
  } catch (_) {}

  // Legacy back- (   ):     .
  const legacyType = sectionData?.lShape?.type || null;
  const isLegacyBackCorner =
    legacyType === 'corner-wardrobe' ||
    legacyType === 'top-right' ||
    legacyType === 'corner-wardrobe-left' ||
    legacyType === 'top-left';
  if (isLegacyBackCorner) {
    syncLegacyBackCornerIfNeeded(sectionData, extent, { updateSectionSize, getSectionOffsetsMm });
  }

  // L‑sync:    typeKey
  const lSyncTypeKey = getLShapeTypeKey(sectionData);
  if (
    !isLegacyBackCorner &&
    !isLShapeSyncInProgress &&
    lSyncTypeKey &&
    L_CORNER_CONFIG[lSyncTypeKey] &&
    sectionData.lShape?.pairId
  ) {
    const cfg = L_CORNER_CONFIG[lSyncTypeKey];
    const role = sectionData.lShape.role;
    const other = state.customSections.find((s) => s.id === sectionData.lShape.pairId);
    if (other) {
      try {
        isLShapeSyncInProgress = true;
        if (role === cfg.primary) {
          if (lSyncTypeKey === 'corner-back-right') {
            const roomWorldPos2 = new THREE.Vector3();
            state.room.group.getWorldPosition(roomWorldPos2);
            const markerWorldPos = getBackSectionCornerMarkerWorldPos(sectionData);
            if (markerWorldPos) {
              const zJointMm = markerWorldPos.z - roomWorldPos2.z;
              const otherOffsetsMm = getSectionOffsetsMm(other);
              updateSectionSize(other, {
                front: zJointMm / 10,
                back: (otherOffsetsMm.backMm || 0) / 10,
                bottom: (otherOffsetsMm.bottomMm || 0) / 10,
                top: (otherOffsetsMm.topMm || 0) / 10,
              }, (other.size?.x ?? extent.x) / 10);
            }
          } else if (lSyncTypeKey === 'corner-back-left') {
            const roomWorldPos2 = new THREE.Vector3();
            state.room.group.getWorldPosition(roomWorldPos2);
            const markerWorldPos = getBackSectionCornerMarkerLeftWorldPos(sectionData);
            if (markerWorldPos) {
              const zJointMm = markerWorldPos.z - roomWorldPos2.z;
              const otherOffsetsMm = getSectionOffsetsMm(other);
              updateSectionSize(other, {
                front: zJointMm / 10,
                back: (otherOffsetsMm.backMm || 0) / 10,
                bottom: (otherOffsetsMm.bottomMm || 0) / 10,
                top: (otherOffsetsMm.topMm || 0) / 10,
              }, (other.size?.x ?? extent.x) / 10);
            }
          } else if (lSyncTypeKey === 'corner-right-front') {
            const otherOffsetsMm = getSectionOffsetsMm(other);
            const Dcm = (sectionData.size?.x ?? extent.x) / 10;
            updateSectionSize(other, {
              left: (otherOffsetsMm.leftMm || 0) / 10,
              right: Dcm,
              bottom: (otherOffsetsMm.bottomMm || 0) / 10,
              top: (otherOffsetsMm.topMm || 0) / 10,
            }, (other.size?.z ?? extent.z) / 10);
          } else if (lSyncTypeKey === 'corner-left-front') {
            const otherOffsetsMm = getSectionOffsetsMm(other);
            const Dcm = (sectionData.size?.x ?? extent.x) / 10;
            updateSectionSize(other, {
              left: Dcm,
              right: (otherOffsetsMm.rightMm || 0) / 10,
              bottom: (otherOffsetsMm.bottomMm || 0) / 10,
              top: (otherOffsetsMm.topMm || 0) / 10,
            }, (other.size?.z ?? extent.z) / 10);
          } else if (lSyncTypeKey === 'corner-left-back') {
            const otherOffsetsMm = getSectionOffsetsMm(other);
            const Dcm = (sectionData.size?.x ?? extent.x) / 10;
            updateSectionSize(other, {
              left: Dcm,
              right: (otherOffsetsMm.rightMm || 0) / 10,
              bottom: (otherOffsetsMm.bottomMm || 0) / 10,
              top: (otherOffsetsMm.topMm || 0) / 10,
            }, (other.size?.z ?? extent.z) / 10);
          }
        } else if (role === cfg.attached) {
          const otherOffsetsMm = getSectionOffsetsMm(other);
          const syncOffsets = {
            bottom: (otherOffsetsMm.bottomMm || 0) / 10,
            top: (otherOffsetsMm.topMm || 0) / 10,
          };
          if (cfg.primary === 'back') {
            Object.assign(syncOffsets, {
              left: (otherOffsetsMm.leftMm || 0) / 10,
              right: (otherOffsetsMm.rightMm || 0) / 10,
            });
          } else {
            Object.assign(syncOffsets, {
              front: (otherOffsetsMm.frontMm || 0) / 10,
              back: (otherOffsetsMm.backMm || 0) / 10,
            });
          }
          const depthCm = cfg.primary === 'back'
            ? (other.size?.z ?? extent.z) / 10
            : (other.size?.x ?? extent.x) / 10;
          updateSectionSize(other, syncOffsets, depthCm);
        }
      } catch (e) {
        console.warn('⚠️ L‑sync error:', lSyncTypeKey, e);
      } finally {
        isLShapeSyncInProgress = false;
      }
    }
  }

  // Legacy back-left: спец-зона у левого края (угловой шкаф).
  ensureLegacyBackLeftSpecialZone(sectionData, extent, wallName, sectionGroup);
}

/**  4:        . */
async function editEndCabinetDepthFromStep4(sectionId, side) {
  const sectionData = (state.customSections || []).find(
    (s) => s && String(s.id) === String(sectionId)
  );
  if (!sectionData || !isEndCabinetActive(sectionData, side)) return false;

  const entry = sectionData.endCabinets?.[side];
  const oldReserveMm = Math.max(0, Math.round(Number(entry?.widthMm) || 0));
  if (!(oldReserveMm > 0)) return false;

  const wallName = sectionData.wallName || 'back';
  const currentHand =
    entry?.zoneHand === 'left' || entry?.zoneHand === 'right'
      ? entry.zoneHand
      : resolveDefaultEndCabinetZoneHand(wallName, side);
  const result = await promptEndCabinetEdit({
    depthCm: oldReserveMm / 10,
    zoneHand: currentHand,
  });
  if (!result) return false;

  const nextReserveMm = Math.round(Number(result.depthCm) * 10);
  const nextHand = result.zoneHand === 'right' ? 'right' : 'left';
  const depthChanged = nextReserveMm >= 100 && nextReserveMm !== oldReserveMm;
  const handChanged = nextHand !== currentHand;
  if (!depthChanged && !handChanged) return false;

  if (depthChanged) {
    const currentMainWidthMm =
      wallName === 'left' || wallName === 'right'
        ? Number(sectionData.size?.z) || 0
        : Number(sectionData.size?.x) || 0;
    const nextMainWidthMm = currentMainWidthMm + oldReserveMm - nextReserveMm;

    //      ,    :  
    //        .
    const cfg = getRoomSectionDivisionCfg();
    const oldInnerWidthMm =
      Number(sectionData._layoutCache?.innerWidthMm) || currentMainWidthMm;
    const nextInnerWidthMm = Math.max(
      1,
      oldInnerWidthMm + oldReserveMm - nextReserveMm
    );
    const nextVariants = buildSectionDivisionVariants(nextInnerWidthMm, cfg);
    if (!nextVariants.length || !(nextMainWidthMm > 0)) {
      const message =
        '          4';
      if (typeof window.showToast === 'function') window.showToast(message, 'warning');
      else alert(message);
      return false;
    }

    //    ,      
    //   (    ).
    const prevVariant = snapshotSectionDivisionVariant(sectionData);
    if (sectionData.division?.customZoneWidthsMm) {
      delete sectionData.division.customZoneWidthsMm;
    }

    entry.widthMm = nextReserveMm;
    const offsetsMm = getSectionOffsetsMm(sectionData);
    const offsetsCm = {
      left: offsetsMm.leftMm / 10,
      right: offsetsMm.rightMm / 10,
      front: offsetsMm.frontMm / 10,
      back: offsetsMm.backMm / 10,
      bottom: offsetsMm.bottomMm / 10,
      top: offsetsMm.topMm / 10,
    };
    const sectionDepthCm =
      (Number(sectionData.facadeDepthMm) ||
        (wallName === 'left' || wallName === 'right'
          ? Number(sectionData.size?.x)
          : Number(sectionData.size?.z)) ||
        600) / 10;
    updateSectionSize(sectionData, offsetsCm, sectionDepthCm);
    //       updateSectionSize
    // (syncEndCabinetsAfterSectionUpdate → rebuildEndCabinetForSectionSlot).
    //          4.
    reapplySectionDivisionAfterWidthChange(sectionData, prevVariant);
    runEndCabinetSyncSteps(sectionData, [
      ['wallPlanks', syncEndCabinetWallPlanks],
      ['furniture', syncEndCabinetsAfterSectionUpdate],
      ['topPlanks', syncEndCabinetTopPlanks],
      ['plinths', syncEndCabinetPlinths],
      ['facadeOverlays', syncEndCabinetFacadeOverlays],
    ]);
  }

  if (handChanged) {
    entry.zoneHand = nextHand;
    entry.zoneHandManual = true;
    if (!applyEndCabinetZoneHand(sectionData, side, nextHand) && entry.pendingPlace !== true) {
      console.warn('[END-CAB] не удалось применить сторону открывания', {
        sectionId,
        side,
        zoneHand: nextHand,
      });
    }
  }

  //          3D-.
  delete sectionData.__cldStep4IconPos3D;
  try {
    if (typeof window.__clodisRefreshStep4SectionEditIcons === 'function') {
      window.__clodisRefreshStep4SectionEditIcons();
    }
  } catch (_) {}
  return true;
}

// Expose helpers globally for backward compatibility with other modules
window.addSectionDimensionLabels = addSectionDimensionLabels;
window.updateSectionDimensionLabels = updateSectionDimensionLabels;
window.refreshSectionDimensionLabelsForSection = refreshSectionDimensionLabelsForSection;
window.refreshWindowBridgeDimensionLabels = refreshWindowBridgeDimensionLabels;
window.updateSectionSize = updateSectionSize;
window.__cldEditEndCabinetDepth = editEndCabinetDepthFromStep4;
window.__clodisReconcileSectionSideTrimForWall = reconcileSectionSideTrimForWall;

// ─── Section division helpers for Step 4 +/- UI ──────────────────────────

/**     4 ()    . */
function getRoomSectionDivisionCfg() {
  try {
    const cfg =
      typeof window !== 'undefined' && typeof window.getRoomStepsConfig === 'function'
        ? window.getRoomStepsConfig()
        : null;
    if (!cfg || !cfg.steps) {
      return {
        doubleMinMm: 800,
        doubleMaxMm: 1200,
        singleMinMm: 300,
        singleMaxMm: 600,
        stepMm: 100,
      };
    }
    const step4 = cfg.steps.find((s) => s.stepId === 4);
    const sd = step4 && step4.section_division;
    return {
      doubleMinMm: sd && Number(sd.min_mm) > 0 ? Number(sd.min_mm) : 800,
      doubleMaxMm: sd && Number(sd.max_mm) > 0 ? Number(sd.max_mm) : 1200,
      singleMinMm: sd && Number(sd.single_min_mm) > 0 ? Number(sd.single_min_mm) : 300,
      singleMaxMm: sd && Number(sd.single_max_mm) > 0 ? Number(sd.single_max_mm) : 600,
      stepMm: sd && Number(sd.step_mm) > 0 ? Number(sd.step_mm) : 100,
    };
  } catch (_) {
    return {
      doubleMinMm: 800,
      doubleMaxMm: 1200,
      singleMinMm: 300,
      singleMaxMm: 600,
      stepMm: 100,
    };
  }
}

/** Вариант 0: только одностворчатые, минимум зон N ⇒ максимальная ширина q=W/N в вилке [singleMin,singleMax]. */
function buildAllSinglesVariantIfFeasible(Wmm, singleMin, singleMax) {
  const W = Number(Wmm);
  const smin = Number(singleMin) > 0 ? Number(singleMin) : 300;
  const smax = Number(singleMax) > 0 ? Number(singleMax) : 600;
  if (!Number.isFinite(W) || W <= 0 || smax < smin) return null;
  const lo = Math.max(1, Math.ceil(W / smax));
  const hi = Math.max(1, Math.floor(W / smin));
  if (lo > hi) return null;
  for (let N = lo; N <= hi; N++) {
    const q = W / N;
    if (q < smin - 1e-6 || q > smax + 1e-6) continue;
    const qR = Math.round(q);
    return {
      kind: 'allSingles',
      stripModel: 'allSingles',
      stripCountN: 0,
      parts: N,
      partSizeMm: qR,
      label: `только одн.: ${N} × ~${qR} мм`,
    };
  }
  return null;
}

/**
 *      (Maatkasten).
 *   =  double- ( 1, ).
 * − → allSingles ( ,  ).
 * Угол / bay / мост: тот же double-старт, если есть allSingles-слот.
 */
function defaultStripVariantInternalIndex(variants, sectionData) {
  if (!variants || variants.length === 0) return 0;
  // 0 = allSingles (если есть) → старт на 1 = первый double/mixed.
  if (variants[0].kind === 'allSingles') {
    return variants.length > 1 ? 1 : 0;
  }
  return 0;
}

/**
 * Вариант 0 (если возможен): все зоны одностворчатые, q≈W/N в [singleMin,singleMax], N минимален.
 *    W   N , q = round(W/N):
 * - **N :** N/2    2q.
 * - **N нечётное:** (N−1)/2 двустворчатых по 2q, справа 1 одностворчатая q.
 * Индексы в API 0-based: 0 = все одн., 1 = первый смешанный/двойной ряд, …
 */
export function buildSectionDivisionVariants(innerWidthMm, cfg) {
  const W = Number(innerWidthMm);
  if (!Number.isFinite(W) || W <= 0) return [];
  const doubleMin = Number(cfg?.doubleMinMm) > 0 ? Number(cfg.doubleMinMm) : 800;
  const doubleMax = Number(cfg?.doubleMaxMm) > 0 ? Number(cfg.doubleMaxMm) : 1200;
  const singleMin = Number(cfg?.singleMinMm) > 0 ? Number(cfg.singleMinMm) : 300;
  const singleMax = Number(cfg?.singleMaxMm) > 0 ? Number(cfg.singleMaxMm) : 600;
  const maxN = Number(cfg?.maxStripCount) > 0 ? Math.floor(Number(cfg.maxStripCount)) : 41;

  const head = buildAllSinglesVariantIfFeasible(W, singleMin, singleMax);
  const out = [];
  for (let N = 2; N <= maxN; N++) {
    const q = Math.round(W / N);
    const dq = 2 * q;
    if (N % 2 === 0) {
      const k = N / 2;
      if (dq < doubleMin || dq > doubleMax) continue;
      out.push({
        kind: 'equal',
        stripModel: 'evenN',
        stripCountN: N,
        partSizeMm: dq,
        parts: k,
        label: `N=${N}: ${k} дв. × ${dq} мм`,
      });
    } else {
      const k = (N - 1) / 2;
      if (q < singleMin || q > singleMax) continue;
      if (dq < doubleMin || dq > doubleMax) continue;
      out.push({
        kind: 'mixedLeftSingle',
        stripModel: 'oddN',
        stripCountN: N,
        leftSingleMm: q,
        doubleMm: dq,
        doubleCount: k,
        parts: 1 + k,
        label: `N=${N}: ${k}×${dq} + 1×${q} мм`,
      });
    }
  }
  out.sort((a, b) => a.stripCountN - b.stripCountN);
  return head ? [head, ...out] : out;
}

export function resolveDivisionVariantIndex(sectionId, divisionCfg) {
  const sec = Array.isArray(state.customSections)
    ? state.customSections.find((s) => s.id === sectionId)
    : null;
  if (!sec?.division) return 0;
  computeSectionLayout(sec);
  const freeMm = Number(sec.division.freeSizeMm);
  const innerW =
    sec.lShape && Number.isFinite(freeMm) && freeMm > 0
      ? freeMm
      : (Number(sec.division.sectionEnd) - Number(sec.division.sectionStart)) || 0;
  const variants = buildSectionDivisionVariants(innerW, divisionCfg || {});
  if (!variants.length) return 0;
  const div = sec.division;
  const explicit = Number(div.divisionVariantIndex);
  //  +/−:    (create /  /  )   .
  // Не rematch на «вариант 2 = 5 двухдверных» и не apply как side-effect чтения.
  if (Number.isFinite(explicit) && explicit >= 0 && explicit < variants.length) {
    return explicit;
  }
  const mi = variants.findIndex((v) => _variantMatchesDivision(div, v));
  if (mi >= 0) return mi;
  return defaultStripVariantInternalIndex(variants, sec);
}

function _variantMatchesDivision(div, v) {
  if (!div || !v) return false;
  const nStored = Number(div.stripCountN);
  if (v.kind === 'allSingles') {
    if (div.layoutKind !== 'allSingles') return false;
    if (Math.floor(Number(div.parts) || 0) !== v.parts) return false;
    if (Number(nStored) !== 0) return false;
    return true;
  }
  if (v.kind === 'equal') {
    if (div.layoutKind === 'mixedLeftSingle' || div.layoutKind === 'allSingles') return false;
    const p = Math.floor(Number(div.parts) || 0);
    const ps = Number(div.partSize) || 0;
    if (p !== v.parts || Math.abs(ps - v.partSizeMm) >= 2) return false;
    if (Number.isFinite(nStored) && nStored !== v.stripCountN) return false;
    return true;
  }
  if (v.kind === 'mixedLeftSingle') {
    if (div.layoutKind !== 'mixedLeftSingle') return false;
    if (
      Math.floor(Number(div.doubleCount) || 0) !== v.doubleCount ||
      Math.abs(Number(div.leftSingleWidthMm) - v.leftSingleMm) >= 2 ||
      Math.abs(Number(div.doubleWidthMm) - v.doubleMm) >= 2
    ) {
      return false;
    }
    if (Number.isFinite(nStored) && nStored !== v.stripCountN) return false;
    return true;
  }
  return false;
}

/**
 * Returns layout info for a section: current parts, partSize, inner width, variant index.
 */
export function getSectionLayoutInfo(sectionId) {
  const sec = Array.isArray(state.customSections)
    ? state.customSections.find((s) => s.id === sectionId)
    : null;
  if (!sec || !sec.division) return null;
  const sectionEnd = Number(sec.division.sectionEnd) || 0;
  const sectionStart = Number(sec.division.sectionStart) || 0;
  let innerWidthMm = Math.round(sectionEnd - sectionStart);
  // L primary:      ( -).
  const freeMm = Number(sec.division.freeSizeMm);
  if (sec.lShape && Number.isFinite(freeMm) && freeMm > 0) {
    innerWidthMm = Math.round(freeMm);
  }
  return {
    parts: Math.max(1, Math.floor(Number(sec.division.parts) || 1)),
    partSizeMm: Math.round(Number(sec.division.partSize) || 0),
    innerWidthMm: innerWidthMm > 0 ? innerWidthMm : 0,
    divisionVariantIndex: Number.isFinite(Number(sec.division.divisionVariantIndex))
      ? Number(sec.division.divisionVariantIndex)
      : null,
    layoutKind: sec.division.layoutKind || null,
    sectionId,
  };
}

/**
 * Применить вариант деления по индексу (0-based: 0 = все одностворчатые при наличии, иначе 0 = первый N-полосный).
 */
export function applySectionDivisionVariant(sectionId, variantIndex0Based, divisionCfg) {
  const sec = Array.isArray(state.customSections)
    ? state.customSections.find((s) => s.id === sectionId)
    : null;
  if (!sec || !sec.division) {
    console.warn('[SECT-VAR] section not found:', sectionId);
    return;
  }
  computeSectionLayout(sec);
  const freeMm = Number(sec.division.freeSizeMm);
  const innerW =
    sec.lShape && Number.isFinite(freeMm) && freeMm > 0
      ? freeMm
      : (Number(sec.division.sectionEnd) - Number(sec.division.sectionStart)) || 0;
  const variants = buildSectionDivisionVariants(innerW, divisionCfg || {});
  if (!variants.length) {
    console.warn('[SECT-VAR] no variants for width', innerW);
    return;
  }
  const idx = Math.max(0, Math.min(Math.floor(variantIndex0Based), variants.length - 1));
  const v = variants[idx];
  const div = sec.division;
  div.divisionVariantIndex = idx;
  div.stripCountN = v.stripCountN;
  delete div.customZoneWidthsMm;
  if (v.kind === 'allSingles') {
    div.layoutKind = 'allSingles';
    delete div.leftSingleWidthMm;
    delete div.doubleWidthMm;
    delete div.doubleCount;
    div.parts = v.parts;
    div.partSize = v.partSizeMm;
  } else if (v.kind === 'equal') {
    delete div.layoutKind;
    delete div.leftSingleWidthMm;
    delete div.doubleWidthMm;
    delete div.doubleCount;
    div.parts = v.parts;
    div.partSize = v.partSizeMm;
  } else {
    div.layoutKind = 'mixedLeftSingle';
    div.leftSingleWidthMm = v.leftSingleMm;
    div.doubleWidthMm = v.doubleMm;
    div.doubleCount = v.doubleCount;
    div.parts = v.parts;
    div.partSize = v.doubleMm;
  }
  computeSectionLayout(sec);
  updateCabinetMarkersForSection(sectionId);
  createSectionZones(sec);
  if (typeof updateFurnitureInSection === 'function') {
    updateFurnitureInSection(sec);
  }
  try {
    if (typeof window.__clodisRebuildAllTransitions === 'function') {
      window.__clodisRebuildAllTransitions();
    }
  } catch (e) {}
  try {
    if (typeof rebuildSectionZoneEditIconsForSection === 'function') {
      rebuildSectionZoneEditIconsForSection(sectionId);
    }
  } catch (e) {}
  console.log('[SECT-VAR] applySectionDivisionVariant', { sectionId, idx, kind: v.kind });
}

/**
 * Changes division.parts for the given section, then rebuilds layout,
 * markers, zones, and transitions.
 */
export function setSectionParts(sectionId, newParts) {
  const sec = Array.isArray(state.customSections)
    ? state.customSections.find((s) => s.id === sectionId)
    : null;
  if (!sec || !sec.division) {
    console.warn('[SECT-PARTS] section not found:', sectionId);
    return;
  }
  delete sec.division.layoutKind;
  delete sec.division.stripCountN;
  delete sec.division.leftSingleWidthMm;
  delete sec.division.doubleWidthMm;
  delete sec.division.doubleCount;
  delete sec.division.customZoneWidthsMm;
  sec.division.divisionVariantIndex = null;
  const clamped = Math.max(1, Math.floor(Number(newParts)));
  sec.division.parts = clamped;
  computeSectionLayout(sec);
  updateCabinetMarkersForSection(sectionId);
  createSectionZones(sec);
  if (typeof updateFurnitureInSection === 'function') {
    updateFurnitureInSection(sec);
  }
  try {
    if (typeof window.__clodisRebuildAllTransitions === 'function') {
      window.__clodisRebuildAllTransitions();
    }
  } catch (e) {}
  try {
    if (typeof rebuildSectionZoneEditIconsForSection === 'function') {
      rebuildSectionZoneEditIconsForSection(sectionId);
    }
  } catch (e) {}
  console.log('[SECT-PARTS] setSectionParts', { sectionId, parts: clamped });
}

/** Returns the id of the first available section (fallback for active section). */
function getFirstSectionId() {
  return Array.isArray(state.customSections) && state.customSections.length > 0
    ? state.customSections[0].id
    : null;
}

/**
 *    ()    .
 *           .
 * widthMm=null/0       .
 */
export function setZoneCustomWidthMm(sectionId, zoneIndex, widthMm) {
  const zi = Math.floor(Number(zoneIndex));
  if (!Number.isFinite(zi) || zi < 0) {
    console.warn('[ZONE-WIDTH] setZoneCustomWidthMm: invalid zoneIndex', { zoneIndex, sectionId });
    return;
  }
  const sec = Array.isArray(state.customSections)
    ? state.customSections.find((s) => s.id === sectionId)
    : null;
  if (!sec || !sec.division) {
    console.warn('[ZONE-WIDTH] section not found:', sectionId);
    return;
  }
  const parts = Math.max(1, Math.floor(Number(sec.division.parts) || 0));
  if (zi >= parts) {
    console.warn('[ZONE-WIDTH] setZoneCustomWidthMm: zoneIndex >= parts', {
      zi,
      parts,
      sectionId,
    });
  }
  if (!sec.division.customZoneWidthsMm || typeof sec.division.customZoneWidthsMm !== 'object') {
    sec.division.customZoneWidthsMm = {};
  }
  const wMm = Number(widthMm);
  if (Number.isFinite(wMm) && wMm > 0) {
    sec.division.customZoneWidthsMm[zi] = wMm;
  } else {
    delete sec.division.customZoneWidthsMm[zi];
  }
  if (Object.keys(sec.division.customZoneWidthsMm).length === 0) {
    delete sec.division.customZoneWidthsMm;
  }
  console.log('[ZONE-WIDTH] setZoneCustomWidthMm(before layout)', {
    sectionId,
    zoneIndex: zi,
    widthMmArg: widthMm,
    storedMm: wMm,
    parts,
    customZoneWidthsMm: sec.division.customZoneWidthsMm
      ? { ...sec.division.customZoneWidthsMm }
      : null,
  });
  computeSectionLayout(sec);
  updateCabinetMarkersForSection(sectionId);
  createSectionZones(sec);
  if (typeof updateFurnitureInSection === 'function') updateFurnitureInSection(sec);
  try {
    if (typeof window.__clodisRebuildAllTransitions === 'function') window.__clodisRebuildAllTransitions();
  } catch (e) {}
  try {
    if (typeof rebuildSectionZoneEditIconsForSection === 'function') rebuildSectionZoneEditIconsForSection(sectionId);
  } catch (e) {}
  const lc = sec._layoutCache;
  console.log('[ZONE-WIDTH] setZoneCustomWidthMm(done)', {
    sectionId,
    zoneIndex: zi,
    partSize: sec.division?.partSize,
    moduleWidthsMm: lc?.moduleWidthsMm ? lc.moduleWidthsMm.slice() : null,
  });
}

window.__clodisSetSectionParts = setSectionParts;
window.__clodisGetSectionLayoutInfo = getSectionLayoutInfo;
window.__clodisGetFirstSectionId = getFirstSectionId;
window.__clodisApplySectionDivisionVariant = applySectionDivisionVariant;
window.__clodisBuildSectionDivisionVariants = buildSectionDivisionVariants;
window.__clodisResolveDivisionVariantIndex = resolveDivisionVariantIndex;
window.__clodisSetZoneCustomWidthMm = setZoneCustomWidthMm;

/** Подписи стен для переключателя плеч L (Maatkasten: Обзор | сторона | сторона). */
const _L_ARM_WALL_LABEL = {
  back: '',
  front: '',
  left: '',
  right: '',
};

/**
 *  L-    .
 * @returns {{ primary: object, attached: object, primaryWall: string, attachedWall: string }|null}
 */
export function getLShapePairForSection(sectionData) {
  if (!sectionData?.lShape?.pairId || !Array.isArray(state.customSections)) return null;
  const other = state.customSections.find(
    (s) => s && String(s.id) === String(sectionData.lShape.pairId)
  );
  if (!other?.lShape) return null;
  const typeKey = getLShapeTypeKey(sectionData) || getLShapeTypeKey(other);
  const cfg = typeKey && L_CORNER_CONFIG[typeKey] ? L_CORNER_CONFIG[typeKey] : null;
  let primary = sectionData;
  let attached = other;
  if (cfg) {
    if (sectionData.lShape.role === cfg.attached) {
      primary = other;
      attached = sectionData;
    } else if (other.lShape.role === cfg.primary) {
      primary = other;
      attached = sectionData;
    } else if (sectionData.lShape.role !== cfg.primary) {
      // fallback: role === wallName
      if (other.lShape.role === cfg.primary) {
        primary = other;
        attached = sectionData;
      }
    }
  }
  return {
    primary,
    attached,
    primaryWall: primary.wallName || primary.lShape?.role || 'back',
    attachedWall: attached.wallName || attached.lShape?.role || 'right',
  };
}

/**  L-   hint      lShape. */
function __resolveLShapePair(hintSectionId) {
  const list = state.customSections || [];
  const byId = (id) =>
    id != null ? list.find((s) => s && String(s.id) === String(id)) : null;

  let hint = byId(hintSectionId);
  if (hint?.lShape?.pairId) {
    const p = getLShapePairForSection(hint);
    if (p) return p;
  }
  const focus = window.__cldLArmFocus;
  if (focus?.primaryId) {
    const prim = byId(focus.primaryId);
    if (prim?.lShape?.pairId) {
      const p = getLShapePairForSection(prim);
      if (p) return p;
    }
  }
  if (focus?.attachedId) {
    const att = byId(focus.attachedId);
    if (att?.lShape?.pairId) {
      const p = getLShapePairForSection(att);
      if (p) return p;
    }
  }
  const any = list.find((s) => s && s.lShape?.pairId);
  return any ? getLShapePairForSection(any) : null;
}

function __sectionsOnWall(wallName) {
  const wn = String(wallName || '').toLowerCase();
  return (state.customSections || []).filter(
    (s) => s && String(s.wallName || '').toLowerCase() === wn
  );
}

function __clearSectionFocusHelpers() {
  (state.customSections || []).forEach((s) => {
    const helper = s?.__cldFocusHelper;
    if (!helper) return;
    try {
      helper.parent?.remove(helper);
      if (helper.geometry) helper.geometry.dispose?.();
      if (helper.material) {
        if (Array.isArray(helper.material)) helper.material.forEach((m) => m.dispose?.());
        else helper.material.dispose?.();
      }
    } catch (_) {}
    s.__cldFocusHelper = null;
  });
}

/**
 * Обводка секции: active = оранжевая, ghost = лёгкий голубой «призрак».
 * @param {'active'|'ghost'|null} kind
 */
function __setSectionFocusHelper(sectionData, kind) {
  if (!sectionData?.group || !kind) return;
  const root = sectionData.group;
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  if (size.x < 1 && size.y < 1 && size.z < 1) return;

  const color = kind === 'active' ? 0xff9f1c : 0x7eb6ff;
  const opacity = kind === 'active' ? 0.95 : 0.55;
  const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(size.x, size.y, size.z));
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthTest: true,
  });
  const helper = new THREE.LineSegments(geo, mat);
  helper.position.copy(center);
  helper.userData.isLArmFocusHelper = true;
  helper.renderOrder = 10;
  // В мировых координатах — в scene, не в group (group может быть смещён).
  if (state.scene) state.scene.add(helper);
  else root.add(helper);
  sectionData.__cldFocusHelper = helper;
}

/**
 *   ,  / (≥2   ).
 * left = меньший spanAlongA, right = больший.
 */
export function getDoorFlankSectionsForWall(wallName = 'back') {
  const wn = String(wallName || 'back').toLowerCase();
  const list = (state.customSections || [])
    .filter((s) => s && String(s.wallName || '').toLowerCase() === wn)
    .slice()
    .sort((a, b) => (Number(a.spanAlongA) || 0) - (Number(b.spanAlongA) || 0));
  if (list.length < 2) return null;
  return {
    wallName: wn,
    left: list[0],
    right: list[list.length - 1],
    all: list,
  };
}

/**
 * UI  :  |          ≥2 .
 * activeSide только в mode=flank (не путать с activeSectionId при «Задняя»).
 */
export function describeDoorFlankForUi(_hintSectionId) {
  const focus = window.__cldLArmFocus || {};
  const wall =
    focus.mode === 'wall' || focus.mode === 'flank'
      ? String(focus.wallName || focus.flankWall || '').toLowerCase()
      : '';
  if (!wall) return null;
  const flanks = getDoorFlankSectionsForWall(wall);
  if (!flanks) return null;
  return {
    wallName: flanks.wallName,
    leftId: flanks.left.id,
    rightId: flanks.right.id,
    leftLabel: '',
    rightLabel: '',
    activeSide: focus.mode === 'flank' ? focus.flankSide || null : null,
  };
}

/** ,     (   ). */
export function listWallsWithSections() {
  return ['back', 'front', 'left', 'right']
    .map((w) => ({
      wall: w,
      label: _L_ARM_WALL_LABEL[w] || w,
      sections: __sectionsOnWall(w),
    }))
    .filter((x) => x.sections.length > 0);
}

/**
 *  :  +  (  L-      U).
 */
export function describeWallFocusForUi(hintSectionId) {
  const walls = listWallsWithSections();
  if (!walls.length) return null;
  const hasMulti = walls.some((w) => w.sections.length >= 2);
  if (walls.length < 2 && !hasMulti) return null;
  const focus = window.__cldLArmFocus || {};
  const pair = __resolveLShapePair(hintSectionId);
  return {
    walls: walls.map((w) => ({
      wall: w.wall,
      label: w.label,
      count: w.sections.length,
    })),
    showOverview: walls.length >= 2,
    mode: focus.mode || 'overview',
    activeWall:
      focus.mode === 'wall' || focus.mode === 'flank'
        ? focus.wallName || focus.flankWall || null
        : null,
    //    UI primary/attached
    primaryWall: pair?.primaryWall || walls[0]?.wall || 'back',
    attachedWall: pair?.attachedWall || walls[1]?.wall || null,
    primaryLabel: _L_ARM_WALL_LABEL[pair?.primaryWall] || walls[0]?.label,
    attachedLabel: _L_ARM_WALL_LABEL[pair?.attachedWall] || walls[1]?.label,
  };
}

function __doorFlankActiveSide(flanks) {
  const focus = window.__cldLArmFocus;
  if (!focus || focus.mode !== 'flank') return null;
  if (focus.flankSide === 'left' || focus.flankSide === 'right') return focus.flankSide;
  const fid = focus.focusedSectionId;
  if (fid == null || !flanks) return null;
  if (String(fid) === String(flanks.left.id)) return 'left';
  if (String(fid) === String(flanks.right.id)) return 'right';
  return null;
}

function __applyFocusDimExcept(keepSectionId) {
  const keep = keepSectionId != null ? String(keepSectionId) : null;
  __clearSectionFocusHelpers();
  (state.customSections || []).forEach((s) => {
    if (!s) return;
    const on = keep != null && String(s.id) === keep;
    __setSectionGroupDimmed(s, keep != null && !on);
    if (on) __setSectionFocusHelper(s, 'active');
    else if (keep != null) __setSectionFocusHelper(s, 'ghost');
  });
}

function __applyWallFocusVisuals(wallName, flankSide) {
  const wn = String(wallName || '').toLowerCase();
  __clearSectionFocusHelpers();
  (state.customSections || []).forEach((s) => {
    if (!s) return;
    __setSectionGroupDimmed(s, false);
  });
  if (!wn) return;

  if (flankSide === 'left' || flankSide === 'right') {
    const flanks = getDoorFlankSectionsForWall(wn);
    const keep = flankSide === 'right' ? flanks?.right : flanks?.left;
    if (keep) __applyFocusDimExcept(keep.id);
    return;
  }

  const wallFlanks = getDoorFlankSectionsForWall(wn);
  const waitFlank = !!(wallFlanks && wallFlanks.all.length >= 2);
  (state.customSections || []).forEach((s) => {
    if (!s) return;
    const onWall = String(s.wallName || '').toLowerCase() === wn;
    __setSectionGroupDimmed(s, !onWall);
    if (!onWall) __setSectionFocusHelper(s, 'ghost');
    else if (waitFlank) __setSectionFocusHelper(s, 'ghost'); // ждём Слева/Справа
    else __setSectionFocusHelper(s, 'active');
  });
}

function __frameWallOrSection(wallName, sections, focusedSection) {
  try {
    if (focusedSection && typeof window.__cldFrameCameraToSection === 'function') {
      window.__cldFrameCameraToSection(focusedSection, { instant: true });
      return;
    }
    const pair = __resolveLShapePair(null);
    if (typeof window.__cldFrameCameraForLArmFocus === 'function' && pair) {
      window.__cldFrameCameraForLArmFocus(
        { mode: 'primary', primaryWall: wallName },
        pair,
        { instant: true, primaryWallSections: sections }
      );
      return;
    }
    if (sections?.[0] && typeof window.__cldFrameCameraToSection === 'function') {
      window.__cldFrameCameraToSection(sections[0], { instant: true });
    }
  } catch (_) {}
}

/**
 *   ( ):  /  / .
 */
export function setWallFocus(wallName, hintSectionId) {
  const wn = String(wallName || '').toLowerCase();
  const sections = __sectionsOnWall(wn);
  if (!sections.length) return null;
  const pair = __resolveLShapePair(hintSectionId);
  const flanks = getDoorFlankSectionsForWall(wn);
  const hasFlanks = !!(flanks && flanks.all.length >= 2);

  window.__cldLArmFocus = {
    mode: 'wall',
    wallName: wn,
    flankSide: null,
    flankWall: hasFlanks ? wn : null,
    focusedSectionId: hasFlanks ? null : sections[0].id,
    primaryId: pair?.primary?.id ?? null,
    attachedId: pair?.attached?.id ?? null,
    primaryWall: pair?.primaryWall ?? wn,
    attachedWall: pair?.attachedWall ?? null,
    pairId: pair?.primary?.id ?? null,
  };
  window.activeSectionId = hasFlanks ? sections[0].id : sections[0].id;

  __applyWallFocusVisuals(wn, null);
  __frameWallOrSection(wn, sections, hasFlanks ? null : sections[0]);

  try {
    if (typeof window.__clodisRefreshStep4VariantDisplay === 'function') {
      window.__clodisRefreshStep4VariantDisplay(window.activeSectionId);
    }
  } catch (_) {}
  try {
    if (typeof window.__clodisRefreshStep4LArmPills === 'function') {
      window.__clodisRefreshStep4LArmPills();
    }
  } catch (_) {}
  console.log('[L-ARM] wall', window.__cldLArmFocus);
  return window.__cldLArmFocus;
}

export function setOverviewFocus(hintSectionId) {
  const pair = __resolveLShapePair(hintSectionId);
  const walls = listWallsWithSections();
  window.__cldLArmFocus = {
    mode: 'overview',
    wallName: null,
    flankSide: null,
    flankWall: null,
    focusedSectionId: null,
    primaryId: pair?.primary?.id ?? null,
    attachedId: pair?.attached?.id ?? null,
    primaryWall: pair?.primaryWall ?? null,
    attachedWall: pair?.attachedWall ?? null,
    pairId: pair?.primary?.id ?? null,
  };
  __clearSectionFocusHelpers();
  (state.customSections || []).forEach((s) => {
    if (s) __setSectionGroupDimmed(s, false);
  });
  try {
    if (pair && typeof window.__cldFrameCameraForLArmFocus === 'function') {
      window.__cldFrameCameraForLArmFocus(window.__cldLArmFocus, pair, { instant: true });
    } else if (walls.length && typeof window.__cldFrameCameraForLArmFocus === 'function') {
      const fakePair = {
        primary: walls[0].sections[0],
        attached: walls[walls.length - 1].sections[0],
        primaryWall: walls[0].wall,
        attachedWall: walls[walls.length - 1].wall,
      };
      window.__cldFrameCameraForLArmFocus(window.__cldLArmFocus, fakePair, { instant: true });
    }
  } catch (_) {}
  try {
    if (typeof window.__clodisRefreshStep4LArmPills === 'function') {
      window.__clodisRefreshStep4LArmPills();
    }
  } catch (_) {}
  console.log('[L-ARM] overview', window.__cldLArmFocus);
  return window.__cldLArmFocus;
}

/**
 *   /   ( ).
 * @param {'left'|'right'} side
 */
export function setDoorFlankFocus(side, hintSectionId) {
  const focus = window.__cldLArmFocus || {};
  let wall = String(focus.wallName || focus.flankWall || '').toLowerCase();
  if (!wall) {
    const desc = describeWallFocusForUi(hintSectionId);
    wall = String(desc?.primaryWall || 'back').toLowerCase();
  }
  const flanks = getDoorFlankSectionsForWall(wall);
  if (!flanks) return null;
  const focused = side === 'right' ? flanks.right : flanks.left;
  if (!focused) return null;

  const pair = __resolveLShapePair(focused.id) || __resolveLShapePair(hintSectionId);

  window.__cldLArmFocus = {
    mode: 'flank',
    wallName: wall,
    flankSide: side === 'right' ? 'right' : 'left',
    flankWall: wall,
    focusedSectionId: focused.id,
    primaryId: pair?.primary?.id ?? null,
    attachedId: pair?.attached?.id ?? null,
    primaryWall: pair?.primaryWall ?? wall,
    attachedWall: pair?.attachedWall ?? null,
    pairId: pair?.primary?.id ?? null,
  };
  window.activeSectionId = focused.id;

  __applyWallFocusVisuals(wall, window.__cldLArmFocus.flankSide);

  try {
    if (typeof window.__cldFrameCameraToSection === 'function') {
      window.__cldFrameCameraToSection(focused, { instant: true });
    }
  } catch (_) {}
  try {
    if (typeof window.__clodisRefreshStep4VariantDisplay === 'function') {
      window.__clodisRefreshStep4VariantDisplay(focused.id);
    }
  } catch (_) {}
  try {
    if (typeof window.__clodisRefreshStep4LArmPills === 'function') {
      window.__clodisRefreshStep4LArmPills();
    }
  } catch (_) {}
  console.log('[L-ARM] door flank', window.__cldLArmFocus);
  return window.__cldLArmFocus;
}

/**
 * Совместимость: overview | primary | attached → обзор / стена primary / стена attached.
 */
export function setLArmFocusMode(mode, hintSectionId) {
  if (mode === 'overview' || !mode) return setOverviewFocus(hintSectionId);
  const pair = __resolveLShapePair(hintSectionId);
  if (!pair) return setOverviewFocus(hintSectionId);
  if (mode === 'primary') return setWallFocus(pair.primaryWall || 'back', hintSectionId);
  if (mode === 'attached') return setWallFocus(pair.attachedWall || 'right', hintSectionId);
  return setOverviewFocus(hintSectionId);
}

function __setSectionGroupDimmed(sectionData, dimmed) {
  const root = sectionData?.group;
  if (!root) return;
  const opacity = dimmed ? 0.28 : 1;
  root.traverse((obj) => {
    if (!obj?.isMesh || !obj.material) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of mats) {
      if (!mat) continue;
      if (mat.userData?.__cldLArmSaved == null) {
        mat.userData = mat.userData || {};
        mat.userData.__cldLArmSaved = {
          transparent: !!mat.transparent,
          opacity: Number.isFinite(mat.opacity) ? mat.opacity : 1,
          depthWrite: mat.depthWrite !== false,
        };
      }
      if (!dimmed) {
        const s = mat.userData.__cldLArmSaved;
        mat.transparent = s.transparent;
        mat.opacity = s.opacity;
        mat.depthWrite = s.depthWrite;
        delete mat.userData.__cldLArmSaved;
      } else {
        const s = mat.userData.__cldLArmSaved;
        mat.transparent = true;
        mat.opacity = Math.min(Number(s?.opacity) || 1, opacity);
        mat.depthWrite = false;
      }
      mat.needsUpdate = true;
    }
  });
  //   
  if (!state.scene || sectionData.id == null) return;
  const sid = String(sectionData.id);
  state.scene.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    if (String(obj.userData.sectionId) !== sid) return;
    obj.traverse((child) => {
      if (!child?.isMesh || !child.material) return;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (const mat of mats) {
        if (!mat) continue;
        if (mat.userData?.__cldLArmFurnSaved == null) {
          mat.userData = mat.userData || {};
          mat.userData.__cldLArmFurnSaved = {
            transparent: !!mat.transparent,
            opacity: Number.isFinite(mat.opacity) ? mat.opacity : 1,
            depthWrite: mat.depthWrite !== false,
          };
        }
        if (!dimmed) {
          const s = mat.userData.__cldLArmFurnSaved;
          mat.transparent = s.transparent;
          mat.opacity = s.opacity;
          mat.depthWrite = s.depthWrite;
          delete mat.userData.__cldLArmFurnSaved;
        } else {
          const s = mat.userData.__cldLArmFurnSaved;
          mat.transparent = true;
          mat.opacity = Math.min(s?.opacity ?? 1, opacity);
          mat.depthWrite = false;
        }
        mat.needsUpdate = true;
      }
    });
  });
}

function __applyLArmFocusVisuals(pair, mode, opts = {}) {
  __clearSectionFocusHelpers();
  //   dim   (    ).
  (state.customSections || []).forEach((s) => {
    if (s) __setSectionGroupDimmed(s, false);
  });
  if (!pair || mode === 'overview') return;

  const primaryWall = String(pair.primaryWall || 'back').toLowerCase();
  const onPrimary =
    opts.onPrimaryWall ||
    (state.customSections || []).filter(
      (s) => s && String(s.wallName || '').toLowerCase() === primaryWall
    );
  const flanks = opts.flanks || getDoorFlankSectionsForWall(primaryWall);

  if (mode === 'primary') {
    (state.customSections || []).forEach((s) => {
      if (!s) return;
      const onWall = String(s.wallName || '').toLowerCase() === primaryWall;
      __setSectionGroupDimmed(s, !onWall);
      if (onWall) __setSectionFocusHelper(s, 'active');
      else __setSectionFocusHelper(s, 'ghost');
    });
    return;
  }

  if (mode === 'attached') {
    (state.customSections || []).forEach((s) => {
      if (!s) return;
      const isAtt = String(s.id) === String(pair.attached.id);
      __setSectionGroupDimmed(s, !isAtt);
      __setSectionFocusHelper(s, isAtt ? 'active' : 'ghost');
    });
    return;
  }

  // flank / fallback
  __setSectionGroupDimmed(pair.primary, mode !== 'primary');
  __setSectionGroupDimmed(pair.attached, mode !== 'attached');
  if (flanks?.all) {
    flanks.all.forEach((s) => {
      if (s && String(s.id) !== String(pair.primary.id) && String(s.id) !== String(pair.attached.id)) {
        __setSectionGroupDimmed(s, true);
        __setSectionFocusHelper(s, 'ghost');
      }
    });
  }
}

export function getLArmFocusState() {
  return window.__cldLArmFocus || { mode: 'overview', focusedSectionId: null };
}

export function describeLArmFocusForUi(hintSectionId) {
  const wallUi = describeWallFocusForUi(hintSectionId);
  if (wallUi) {
    return {
      ...wallUi,
      primaryId: wallUi.walls?.[0] ? null : null,
      attachedId: null,
      primaryLabel: wallUi.primaryLabel,
      attachedLabel: wallUi.attachedLabel,
      mode: wallUi.mode,
    };
  }
  return null;
}

window.__clodisGetLShapePairForSection = (id) => {
  const sec = (state.customSections || []).find((s) => s && String(s.id) === String(id));
  return sec ? getLShapePairForSection(sec) : null;
};
window.__clodisSetLArmFocusMode = setLArmFocusMode;
window.__clodisSetWallFocus = setWallFocus;
window.__clodisSetOverviewFocus = setOverviewFocus;
window.__clodisGetLArmFocusState = getLArmFocusState;
window.__clodisDescribeLArmFocusForUi = describeLArmFocusForUi;
window.__clodisDescribeWallFocusForUi = describeWallFocusForUi;
window.__clodisDescribeDoorFlankForUi = describeDoorFlankForUi;
window.__clodisSetDoorFlankFocus = setDoorFlankFocus;
window.__clodisGetDoorFlankSectionsForWall = getDoorFlankSectionsForWall;
if (typeof window !== 'undefined') {
  window.showEditSectionModal = showEditSectionModal;
  window.showSectionFillerModal = showSectionFillerModal;
  window.applySectionFillers = applySectionFillers;
  window.getSectionFillerUiMm = getSectionFillerUiMm;
  window.getSectionFillerEditableFields = getSectionFillerEditableFields;
  window.__cldConfirmPendingSectionPlacement = confirmPendingSectionPlacement;
}
// ─────────────────────────────────────────────────────────────────────────
