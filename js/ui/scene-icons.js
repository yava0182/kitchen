// Scene icons module - 2D overlay icons that follow 3D positions
// Handles all 2D UI overlays on the 3D scene

import { state } from '../utils/state.js';
import * as THREE from 'three';
import { exportFurnitureForBasisOBJ, exportFurnitureForBasisSTL } from '../export/basis-export.js';
import { downloadCFRN, exportToBazisCloud } from '../export/bazis-cfrn-export.js?v=20260918-cfrn-tops';
import { exportCutlistAndEdges, exportCutlistSingleSheetDxf } from '../export/cutlist-export.js';
import {
  exportRoomToAssemblyAndOpen,
  downloadAssemblySnapshotJson,
} from '../export/assembly-export.js?v=20260624-asm-geom1';
import { hideAllSectionMarkers, showSectionPerimeterMarker } from './markers.js';
import {
  rebuildAllDimensionLines,
  clearAllDimensionLines,
  updateDimensionLineLabelPositions,
  syncDimensionModeModuleVisibility,
} from './dimension-lines.js?v=20260915-zone-gest26';
import { computeFurnitureWorldBBoxNoAo, withFurnitureDoorSwingsClosedForMeasure } from '../furniture/furniture-bbox.js?v=20260907-shelf-props';
import {
  getFurnitureFrontWorldCoord,
  getSectionFacadeFrontWorldCoord,
  anchorFurnitureFrontWorldCoord,
  alignSectionStandaloneFurnitureFront,
} from '../sections/section-manager.js?v=20260923-cohabit40';
import {
  END_CABINET_SIDES,
  getEndCabinetSlot,
  isEndCabinetActive,
} from '../sections/section-end-cabinet.js?v=20260917-endcab-nobridge';

/** Layer 2 — legacy; hide через visible (один render pass, layer 0). */
const FACADE_LIGHT_HIDE_LAYER = 2;

function isRoomFacadesHidden() {
  return typeof window !== 'undefined' && window.__cldRoomFacadesHidden === true;
}

function __isSwingRoot(o) {
  if (!o) return false;
  if (o.name === '__door_swing' || o.userData?.cldDoorSwing) return true;
  return false;
}

function __walkSwingRoots(root, fn) {
  if (!root) return;
  root.traverse((o) => {
    if (__isSwingRoot(o)) fn(o);
  });
}

function syncRoomFacadesLightHide(scene) {
  const root = scene || state.scene;
  if (!root) return;
  const hide = isRoomFacadesHidden();
  __walkSwingRoots(root, (swing) => {
    swing.visible = !hide;
  });
}

function setRoomFacadesHidden(hidden) {
  if (typeof window !== 'undefined') {
    window.__cldRoomFacadesHidden = !!hidden;
  }
  syncRoomFacadesLightHide(state.scene);
  return isRoomFacadesHidden();
}

function hasRefDimensionLines() {
  return (window.cldDimensionSpecs || []).length > 0;
}

/** Сплошные/пунктирные линии разметки секций (cabinet-markers) вместе с режимом размеров. */
function syncSectionMarkupWithDimensions(on) {
  try {
    if (on) {
      setStep5CabinetMarkersVisible(true);
      return;
    }
    const step = typeof window.currentRoomStep === 'number' ? window.currentRoomStep : 0;
    // Шаг 5+: разметка скрыта. 1–4 — видна (посадка модулей).
    if (step >= 5) {
      setStep5CabinetMarkersVisible(false);
    } else if (step >= 1 && step <= 4) {
      setStep5CabinetMarkersVisible(true);
    }
  } catch (_) {}
}

function isAnyDimensionModeActive() {
  return (
    isAllDimensionLabelsVisible() ||
    isSectionDimensionLabelsVisible() ||
    isFurnitureDimensionLabelsVisible()
  );
}

function syncRefDimensionLines() {
  const any =
    isAllDimensionLabelsVisible() ||
    isSectionDimensionLabelsVisible() ||
    isFurnitureDimensionLabelsVisible();
  if (any) {
    rebuildAllDimensionLines();
    syncSectionMarkupWithDimensions(true);
  } else {
    clearAllDimensionLines();
    syncSectionMarkupWithDimensions(false);
    syncDimensionModeModuleVisibility();
  }
}
function __pkApi() {
  return typeof window !== 'undefined' ? window.__cldPlacementKindProfiles : null;
}

function __resolveModuleDepthDisplayMm(targetFurniture, sectionDepthMm, isSide) {
  if (targetFurniture?.userData?.customDepthMm) {
    const custom = Number(targetFurniture.userData.customDepthMm) || 0;
    if (custom > 0) return custom;
  }
  if (sectionDepthMm > 0) return sectionDepthMm;
  if (targetFurniture) {
    const bbox = __computeGroupBBoxNoAo(targetFurniture);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const bboxDepth = isSide ? size.x : size.z;
    if (bboxDepth > 0) return bboxDepth;
  }
  return 0;
}

const __iconScratchCenter = new THREE.Vector3();
const __iconScratchMinCorner = new THREE.Vector3();
const __iconScratchWorldCenter = new THREE.Vector3();
const __iconScratchWorldMinCorner = new THREE.Vector3();
let __iconWorldPosFrame = 0;
let __iconWorldPosRecomputeThisFrame = false;
const __ICON_WORLD_POS_RECOMPUTE_EVERY = 6;

function __meshExcludedFromIconBBox(obj) {
  if (!obj || !obj.isMesh) return true;
  const ud = obj.userData || {};
  if (ud.isWallAo || ud.isContactShadow) return true;
  if (ud.isShelfProp === true || ud.isRodCompanion === true) return true;
  if (ud.isFacade === true || ud.cldDoorPick || ud.cldDrawerPick) return true;
  if (ud.cldDoorSwing || ud.cldSlide) return true;
  if (obj.name && (obj.name.includes('PivotMarker') || obj.name.includes('BBox'))) return true;
  let p = obj;
  for (let i = 0; i < 16 && p; i++) {
    const pud = p.userData || {};
    if (p.name === '__door_swing' || pud.cldDoorSwing) return true;
    const lr = String(pud.layoutRole || '').toLowerCase();
    if (/^facades/.test(lr) || lr === 'facades') return true;
    if (pud.isFacade === true && pud.isBody !== true) return true;
    if (pud.isFurniture === true && p !== obj) break;
    p = p.parent;
  }
  return false;
}

function __computeGroupBBoxNoAo(root) {
  const out = new THREE.Box3();
  let has = false;
  if (!root) return out;
  root.traverse((obj) => {
    if (__meshExcludedFromIconBBox(obj)) return;
    try {
      const b = new THREE.Box3().setFromObject(obj);
      if (!has) {
        out.copy(b);
        has = true;
      } else {
        out.union(b);
      }
    } catch (_) {}
  });
  // Не setFromObject(root): туда попадают открытые двери / lifestyle.
  return out;
}

function __getGroupLocalBBoxNoAoCached(root) {
  if (!root) return null;
  const ud = root.userData || (root.userData = {});
  if (ud.__cldIconLocalBbox instanceof THREE.Box3) {
    return ud.__cldIconLocalBbox;
  }
  // Корпус без фасадов/дверей; двери временно в 0 на случай остатков в bbox.
  let bbox = null;
  withFurnitureDoorSwingsClosedForMeasure(root, () => {
    bbox = __computeGroupBBoxNoAo(root);
  });
  if (!bbox) bbox = __computeGroupBBoxNoAo(root);
  try {
    root.updateMatrixWorld(true);
    bbox.applyMatrix4(new THREE.Matrix4().copy(root.matrixWorld).invert());
  } catch (_) {}
  ud.__cldIconLocalBbox = bbox.clone();
  return ud.__cldIconLocalBbox;
}

export function invalidateGroupIconBBoxCache(root) {
  if (!root?.userData) return;
  delete root.userData.__cldIconLocalBbox;
  delete root.userData.__cldStep4IconPos3D;
}

let __sharedIconFrontFrame = -1;
const __sharedIconFrontByWall = Object.create(null);

function __frontCoordFromWorldBox(wb, wallName) {
  // Как getSectionFacadeFrontWorldCoord: передняя пласть ниши в комнату.
  const wn = wallName || 'back';
  if (wn === 'back') return wb.max.z;
  if (wn === 'front') return wb.min.z;
  if (wn === 'left') return wb.max.x;
  if (wn === 'right') return wb.min.x;
  return wb.max.z;
}

function __mergeSharedFront(best, front, wallName) {
  if (!Number.isFinite(front)) return best;
  if (best == null) return front;
  const wn = wallName || 'back';
  if (wn === 'back' || wn === 'left') return Math.max(best, front);
  return Math.min(best, front);
}

/** Общая линия «перед рядом» на стене — один Z/X для всех карандашей. */
function __sharedIconFrontLineWorld(wallName) {
  const wn = String(wallName || 'back');
  if (__iconWorldPosFrame === __sharedIconFrontFrame && __sharedIconFrontByWall[wn] != null) {
    return __sharedIconFrontByWall[wn];
  }
  if (__iconWorldPosFrame !== __sharedIconFrontFrame) {
    __sharedIconFrontFrame = __iconWorldPosFrame;
    Object.keys(__sharedIconFrontByWall).forEach((k) => {
      delete __sharedIconFrontByWall[k];
    });
  }
  let best = null;
  // Сначала плоскость фасада секций на стене — одна линия для всего ряда.
  try {
    (state.customSections || []).forEach((sec) => {
      if (!sec || String(sec.wallName || 'back') !== wn) return;
      best = __mergeSharedFront(best, getSectionFacadeFrontWorldCoord(sec, wn), wn);
    });
  } catch (_) {}
  // Если секций нет — корпус мебели без дверей/lifestyle.
  if (best == null) {
    const scene = state?.scene;
    if (scene?.traverse) {
      scene.traverse((obj) => {
        if (!obj?.isGroup || obj.userData?.isFurniture !== true) return;
        if (String(obj.userData.wallName || 'back') !== wn) return;
        const localBb = __getGroupLocalBBoxNoAoCached(obj);
        if (!localBb || localBb.isEmpty()) return;
        const wb = localBb.clone().applyMatrix4(obj.matrixWorld);
        best = __mergeSharedFront(best, __frontCoordFromWorldBox(wb, wn), wn);
      });
    }
  }
  if (best != null) __sharedIconFrontByWall[wn] = best;
  return best;
}

/** Сброс якорей карандашей/лейблов после open/close дверей или lifestyle. */
export function invalidateAllFurnitureIconAnchors(scene) {
  const root = scene || state?.scene;
  if (!root?.traverse) return;
  __sharedIconFrontFrame = -1;
  Object.keys(__sharedIconFrontByWall).forEach((k) => {
    delete __sharedIconFrontByWall[k];
  });
  root.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    invalidateGroupIconBBoxCache(obj);
  });
  (window.step5FurnitureIcons || []).forEach((icon) => {
    if (icon) delete icon._step5IconPos3D;
  });
  (state.customSections || []).forEach((sec) => {
    if (sec) delete sec.__cldStep4IconPos3D;
  });
  (window.sectionZoneEditIcons || []).forEach((icon) => {
    if (icon?.userData) delete icon.userData.__cldLiveAnchor;
  });
}

/** Шаг 4/5 layout icons: зазор перед общей линией фасадов ряда. */
const _STEP5_LAYOUT_ICON_OFFSET_MM = 320;
/** Карандаш модуля: один зазор от общей линии фасадов. */
const _ZONE_PENCIL_AHEAD_GAP_MM = 80;
const _ZONE_PENCIL_FLOOR_LIFT_MM = 20;
/** Диаметр карандаша зоны в px (как на референсе Maatkasten). */
const ZONE_EDIT_ICON_SIZE_PX = 32;
/** Небольшой сдвиг вниз в screen-space, чтобы кнопка сидела под цоколем. */
const ZONE_EDIT_ICON_SCREEN_NUDGE_Y_PX = 12;

function __placeIconOnSharedFrontLine(iconPos3D, wallName, gapMm, fallbackHalfDepth) {
  const wn = wallName || 'back';
  const gap = Number.isFinite(Number(gapMm)) ? Number(gapMm) : _ZONE_PENCIL_AHEAD_GAP_MM;
  const shared = __sharedIconFrontLineWorld(wn);
  const half = Math.max(Number(fallbackHalfDepth) || 0, 0);
  if (wn === 'back') {
    iconPos3D.z = (shared != null ? shared : iconPos3D.z + half) + gap;
  } else if (wn === 'front') {
    iconPos3D.z = (shared != null ? shared : iconPos3D.z - half) - gap;
  } else if (wn === 'left') {
    iconPos3D.x = (shared != null ? shared : iconPos3D.x + half) + gap;
  } else if (wn === 'right') {
    iconPos3D.x = (shared != null ? shared : iconPos3D.x - half) - gap;
  }
  return iconPos3D;
}

function __worldIconAnchorFromGroup(group, wallName, aheadGapMm) {
  const localBb = __getGroupLocalBBoxNoAoCached(group);
  if (!localBb || localBb.isEmpty()) return null;
  localBb.getCenter(__iconScratchCenter);
  __iconScratchMinCorner.set(localBb.min.x, localBb.min.y, localBb.min.z);
  group.localToWorld(__iconScratchWorldCenter.copy(__iconScratchCenter));
  group.localToWorld(__iconScratchWorldMinCorner.copy(__iconScratchMinCorner));
  const iconPos3D = __iconScratchWorldCenter.clone();
  iconPos3D.y = __iconScratchWorldMinCorner.y + 150;
  const wn = wallName || 'back';
  const halfDepthMm =
    wn === 'left' || wn === 'right'
      ? (localBb.max.x - localBb.min.x) / 2
      : (localBb.max.z - localBb.min.z) / 2;
  const gap = Number.isFinite(Number(aheadGapMm)) ? Number(aheadGapMm) : _STEP5_LAYOUT_ICON_OFFSET_MM;
  return __placeIconOnSharedFrontLine(iconPos3D, wn, gap, halfDepthMm);
}

/** Якорь карандаша модуля: центр по ширине корпуса, сразу под низом (в т.ч. wall_hung). */
function __worldZonePencilAnchorFromGroup(group, wallName) {
  let localBb = __getGroupLocalBBoxNoAoCached(group);
  if (!localBb || localBb.isEmpty()) {
    // Пустой icon-bbox (все меши = фасады/ящики) — fallback на корпусной bbox.
    try {
      invalidateGroupIconBBoxCache(group);
      const worldBb = computeFurnitureWorldBBoxNoAo(group);
      if (worldBb && !worldBb.isEmpty()) {
        group.updateMatrixWorld(true);
        localBb = worldBb.clone().applyMatrix4(
          new THREE.Matrix4().copy(group.matrixWorld).invert()
        );
        group.userData.__cldIconLocalBbox = localBb.clone();
      }
    } catch (_) {}
  }
  if (!localBb || localBb.isEmpty()) return null;
  localBb.getCenter(__iconScratchCenter);
  __iconScratchMinCorner.set(localBb.min.x, localBb.min.y, localBb.min.z);
  group.localToWorld(__iconScratchWorldCenter.copy(__iconScratchCenter));
  group.localToWorld(__iconScratchWorldMinCorner.copy(__iconScratchMinCorner));
  const iconPos3D = __iconScratchWorldCenter.clone();
  // Низ корпуса в мире (+ lift). Для навеса это clearance, не пол ряда.
  iconPos3D.y = __iconScratchWorldMinCorner.y + _ZONE_PENCIL_FLOOR_LIFT_MM;
  const wn = wallName || 'back';
  const halfDepthMm =
    wn === 'left' || wn === 'right'
      ? (localBb.max.x - localBb.min.x) / 2
      : (localBb.max.z - localBb.min.z) / 2;
  return __placeIconOnSharedFrontLine(iconPos3D, wn, _ZONE_PENCIL_AHEAD_GAP_MM, halfDepthMm);
}

function __projectZonePencilToScreen(icon, position3D) {
  if (!icon || !position3D || !window.sceneIconsContainer || !state?.camera) return;
  const vector = position3D.clone().project(state.camera);
  const container = window.sceneIconsContainer;
  const widthHalf = container.clientWidth / 2;
  const heightHalf = container.clientHeight / 2;
  const x = vector.x * widthHalf + widthHalf;
  const y = -vector.y * heightHalf + heightHalf;
  icon.style.left = x - ZONE_EDIT_ICON_SIZE_PX / 2 + 'px';
  icon.style.top = y - ZONE_EDIT_ICON_SIZE_PX / 2 + ZONE_EDIT_ICON_SCREEN_NUDGE_Y_PX + 'px';
  const inFront = vector.z <= 1;
  icon.style.display =
    window.showSectionZoneEditIcons && inFront ? 'flex' : 'none';
}

function __findFurnitureGroupForZone(sectionId, zoneIndex) {
  if (!state?.scene || sectionId == null || zoneIndex == null || zoneIndex === '') return null;
  const zi = Number(zoneIndex);
  if (!Number.isFinite(zi)) return null;
  let found = null;
  state.scene.traverse((obj) => {
    if (found || !obj?.isGroup) return;
    const ud = obj.userData;
    if (!ud?.isFurniture) return;
    if (String(ud.sectionId) !== String(sectionId)) return;
    if (Number(ud.zoneIndex) !== zi) return;
    found = obj;
  });
  return found;
}

/** Удалить карандаш зоны (например после delete модуля).
 *  @param {string|number} [furnitureUuid] — если задан, только иконка этого модуля (пара base+upper в одной ячейке).
 */
export function removeSectionZoneEditIcon(sectionId, zoneIndex, furnitureUuid) {
  window.sectionZoneEditIcons = (window.sectionZoneEditIcons || []).filter((icon) => {
    if (!icon || !icon.userData) return false;
    const match =
      String(icon.userData.sectionId) === String(sectionId) &&
      Number(icon.userData.zoneIndex) === Number(zoneIndex);
    if (!match) return true;
    if (furnitureUuid != null && furnitureUuid !== '') {
      const iconFu = icon.userData.furnitureUuid;
      if (iconFu != null && String(iconFu) !== String(furnitureUuid)) return true;
    }
    if (icon.parentNode) icon.parentNode.removeChild(icon);
    return false;
  });
}

function __resolveZonePencilFurnitureGroup(icon) {
  if (!icon?.userData) return null;
  let group = icon.userData.furnitureGroup || null;
  if (group && group.parent) return group;
  group = __findFurnitureGroupForZone(icon.userData.sectionId, icon.userData.zoneIndex);
  if (group) {
    icon.userData.furnitureGroup = group;
    icon.userData.furnitureUuid = group.uuid;
  }
  return group;
}

function __shouldRecomputeIconWorldPositions() {
  return __iconWorldPosRecomputeThisFrame;
}

/** Focus: выбранный шкаф без изменений; остальные — flat white ghost
 *  (MeshBasic fade). Color-lerp на белом ЛДСП не читается.
 */
let __moduleEditFocusFadeMat = null;

function __getModuleEditFocusFadeMat() {
  if (!__moduleEditFocusFadeMat) {
    __moduleEditFocusFadeMat = new THREE.MeshBasicMaterial({
      color: 0xf3f3f1,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      toneMapped: false,
    });
  }
  return __moduleEditFocusFadeMat;
}

function __restoreMeshFocusMaterials(mesh) {
  if (!mesh?.isMesh || !mesh.userData?.__cldModEditFocusOrigMat) return;
  const orig = mesh.userData.__cldModEditFocusOrigMat;
  mesh.material = orig;
  delete mesh.userData.__cldModEditFocusOrigMat;
}

export function clearModuleEditFocusFog() {
  if (!state?.scene) {
    window.__cldModuleEditFocusKey = null;
    return;
  }
  state.scene.traverse((obj) => {
    if (obj?.isMesh) __restoreMeshFocusMaterials(obj);
  });
  window.__cldModuleEditFocusKey = null;
}

/**
 * @param {string|number} sectionId
 * @param {number|string} zoneIndex
 * @param {THREE.Object3D|null} [focusGroupHint]
 */
export function applyModuleEditFocusFog(sectionId, zoneIndex, focusGroupHint = null) {
  if (!state?.scene) return;
  clearModuleEditFocusFog();

  let focusGroup =
    focusGroupHint && focusGroupHint.isObject3D && focusGroupHint.parent
      ? focusGroupHint
      : null;
  if (!focusGroup) focusGroup = __findFurnitureGroupForZone(sectionId, zoneIndex);
  const focusUuid = focusGroup ? focusGroup.uuid : null;
  window.__cldModuleEditFocusKey = `${String(sectionId)}:${String(zoneIndex)}`;

  if (!focusUuid) {
    console.warn('[MODULE-FOCUS] no focus group', { sectionId, zoneIndex });
    return;
  }

  const fadeMat = __getModuleEditFocusFadeMat();
  let dimmedMeshes = 0;

  state.scene.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    if (obj.uuid === focusUuid) return;

    obj.traverse((mesh) => {
      if (!mesh?.isMesh || !mesh.material) return;
      if (mesh.userData.__cldModEditFocusOrigMat) return;
      if (mesh.userData?.isWallAo || mesh.userData?.isContactShadow) return;
      if (mesh.name && (mesh.name.includes('PivotMarker') || mesh.name.includes('BBox'))) return;

      mesh.userData.__cldModEditFocusOrigMat = mesh.material;
      mesh.material = fadeMat;
      dimmedMeshes += 1;
    });
  });

  if (dimmedMeshes === 0) {
    // Один общий корень / не нашли соседей — не оставляем «всё серое».
    console.warn('[MODULE-FOCUS] nothing to dim (only one furniture group?)', {
      sectionId,
      zoneIndex,
      focusUuid: focusUuid.slice(0, 8),
    });
  }
}

/** Подтверждение: применить новую высоту ко всем тумбам того же каталога в секции. */
function showStandaloneHeightSyncConfirmModal(otherCount, heightCm, onChoose, opts = {}) {
  let overlay = document.getElementById('standalone-height-sync-modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'standalone-height-sync-modal-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(0,0,0,0.35)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '31000',
    });
    const box = document.createElement('div');
    box.id = 'standalone-height-sync-modal-box';
    Object.assign(box.style, {
      background: '#fff',
      borderRadius: '12px',
      padding: '24px 28px',
      maxWidth: '440px',
      width: '90%',
      boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
      fontFamily: 'inherit',
    });
    const textEl = document.createElement('div');
    textEl.id = 'standalone-height-sync-modal-text';
    textEl.style.fontSize = '15px';
    textEl.style.color = '#333';
    textEl.style.lineHeight = '1.5';
    textEl.style.marginBottom = '20px';
    box.appendChild(textEl);
    const btnRow = document.createElement('div');
    Object.assign(btnRow.style, {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
    });
    const noBtn = document.createElement('button');
    noBtn.id = 'standalone-height-sync-modal-no';
    noBtn.type = 'button';
    noBtn.textContent = 'Нет';
    Object.assign(noBtn.style, {
      borderRadius: '999px',
      border: '1px solid #c5d0de',
      background: '#fff',
      color: '#333',
      fontSize: '14px',
      fontWeight: '600',
      padding: '8px 22px',
      cursor: 'pointer',
    });
    const yesBtn = document.createElement('button');
    yesBtn.id = 'standalone-height-sync-modal-yes';
    yesBtn.type = 'button';
    yesBtn.textContent = 'Да';
    Object.assign(yesBtn.style, {
      borderRadius: '999px',
      border: 'none',
      background: '#1976d2',
      color: '#fff',
      fontSize: '14px',
      fontWeight: '600',
      padding: '8px 22px',
      cursor: 'pointer',
    });
    btnRow.appendChild(noBtn);
    btnRow.appendChild(yesBtn);
    box.appendChild(btnRow);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }
  const textEl = document.getElementById('standalone-height-sync-modal-text');
  const n = Math.max(1, Math.floor(Number(otherCount) || 0));
  const hText = Number.isFinite(Number(heightCm))
    ? String(heightCm).replace('.', ',')
    : '—';
  const modWord =
    n % 10 === 1 && n % 100 !== 11
      ? 'модулю'
      : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)
        ? 'модулям'
        : 'модулям';
  if (textEl) {
    const fieldWhat = opts.fieldWhat || 'высоту';
    const fieldTitle = opts.fieldTitle || 'Высота';
    textEl.textContent =
      `Вы хотите заменить ${fieldWhat} всех элементов? ` +
      `${fieldTitle} ${hText} см будет применена ещё к ${n} ${modWord} того же каталога в ряду.`;
  }
  const yesBtn = document.getElementById('standalone-height-sync-modal-yes');
  const noBtn = document.getElementById('standalone-height-sync-modal-no');
  const close = () => {
    overlay.style.display = 'none';
  };
  if (yesBtn) {
    yesBtn.onclick = () => {
      close();
      if (typeof onChoose === 'function') onChoose(true);
    };
  }
  if (noBtn) {
    noBtn.onclick = () => {
      close();
      if (typeof onChoose === 'function') onChoose(false);
    };
  }
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      close();
      if (typeof onChoose === 'function') onChoose(false);
    }
  };
  overlay.style.display = 'flex';
}

/**
 * При посадке тумбы/комода: своя высота каталога или высота уже стоящих в секции.
 * @returns {Promise<'own'|'neighbor'>}
 */
export function askStandalonePlaceHeightChoice({ ownHeightMm, neighborHeightMm } = {}) {
  return new Promise((resolve) => {
    let overlay = document.getElementById('standalone-place-height-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'standalone-place-height-modal-overlay';
      Object.assign(overlay.style, {
        position: 'fixed',
        inset: '0',
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '31000',
      });
      const box = document.createElement('div');
      box.id = 'standalone-place-height-modal-box';
      Object.assign(box.style, {
        background: '#fff',
        borderRadius: '12px',
        padding: '24px 28px',
        maxWidth: '460px',
        width: '90%',
        boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
        fontFamily: 'inherit',
      });
      const textEl = document.createElement('div');
      textEl.id = 'standalone-place-height-modal-text';
      textEl.style.fontSize = '15px';
      textEl.style.color = '#333';
      textEl.style.lineHeight = '1.5';
      textEl.style.marginBottom = '20px';
      box.appendChild(textEl);
      const btnRow = document.createElement('div');
      Object.assign(btnRow.style, {
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
        flexWrap: 'wrap',
      });
      const ownBtn = document.createElement('button');
      ownBtn.id = 'standalone-place-height-modal-own';
      ownBtn.type = 'button';
      Object.assign(ownBtn.style, {
        borderRadius: '999px',
        border: '1px solid #c5d0de',
        background: '#fff',
        color: '#333',
        fontSize: '14px',
        fontWeight: '600',
        padding: '8px 18px',
        cursor: 'pointer',
      });
      const neighborBtn = document.createElement('button');
      neighborBtn.id = 'standalone-place-height-modal-neighbor';
      neighborBtn.type = 'button';
      Object.assign(neighborBtn.style, {
        borderRadius: '999px',
        border: 'none',
        background: '#1976d2',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '600',
        padding: '8px 18px',
        cursor: 'pointer',
      });
      btnRow.appendChild(ownBtn);
      btnRow.appendChild(neighborBtn);
      box.appendChild(btnRow);
      overlay.appendChild(box);
      document.body.appendChild(overlay);
    }

    const fmtCm = (mm) => {
      const cm = Number(mm) / 10;
      if (!Number.isFinite(cm) || cm <= 0) return '—';
      const rounded = Math.round(cm * 10) / 10;
      return String(rounded).replace('.', ',');
    };
    const ownCm = fmtCm(ownHeightMm);
    const neighborCm = fmtCm(neighborHeightMm);
    const textEl = document.getElementById('standalone-place-height-modal-text');
    if (textEl) {
      textEl.textContent =
        `В секции уже есть модули высотой ${neighborCm} см. ` +
        `Оставить свою высоту ${ownCm} см или применить высоту как у них?`;
    }
    const ownBtn = document.getElementById('standalone-place-height-modal-own');
    const neighborBtn = document.getElementById('standalone-place-height-modal-neighbor');
    if (ownBtn) ownBtn.textContent = `Свою (${ownCm} см)`;
    if (neighborBtn) neighborBtn.textContent = `Как в секции (${neighborCm} см)`;

    const finish = (choice) => {
      overlay.style.display = 'none';
      resolve(choice === 'neighbor' ? 'neighbor' : 'own');
    };
    if (ownBtn) ownBtn.onclick = () => finish('own');
    if (neighborBtn) neighborBtn.onclick = () => finish('neighbor');
    overlay.onclick = (e) => {
      if (e.target === overlay) finish('own');
    };
    overlay.style.display = 'flex';
  });
}

// Storage for scene icons
window.sceneIcons = [];
window.roomDimensionLabels = [];
window.furnitureWidthLabels = [];
/** Подписи названий модулей из каталога над мебелью в комнате. */
window.furnitureCatalogNameLabels = [];
if (typeof window.__CLD_SHOW_CATALOG_NAME_LABELS === 'undefined') {
  window.__CLD_SHOW_CATALOG_NAME_LABELS = false;
}
window.hingeRoleMarkersLabels = window.hingeRoleMarkersLabels || [];
window.sectionSingleZoneLabels = window.sectionSingleZoneLabels || [];
window.sectionZoneEditIcons = window.sectionZoneEditIcons || [];
// Карандаши на зонах — отдельно от панелей отладки: по умолчанию видны (редактирование глубины/ширины).
window.showSectionZoneEditIcons = true;
window.__clodisSectionSceneToolsVisible = false;

// Локальная копия чтения room_steps_config (как в room-steps/constructor-price-subline)
function getRoomStepsConfigLocal() {
  try {
    const raw = localStorage.getItem('room_steps_config');
    if (raw) {
      const c = JSON.parse(raw);
      if (c && c.steps && c.steps.length) return c;
    }
  } catch (e) {}
  return null;
}

// Глобальные флаги показа размеров (по умолчанию выключены)
window.showSectionDimensionLabels = window.showSectionDimensionLabels || false;
window.showFurnitureDimensionLabels = window.showFurnitureDimensionLabels || false;
if (typeof window.showAllDimensionLabels === 'undefined') {
  window.showAllDimensionLabels = false;
}

const ALL_DIMS_ACTIVE_BG = '#2563eb';
const ALL_DIMS_ACTIVE_COLOR = '#fff';

export function isAllDimensionLabelsVisible() {
  return window.showAllDimensionLabels === true;
}

export function isSectionDimensionLabelsVisible() {
  return window.showAllDimensionLabels === true || window.showSectionDimensionLabels === true;
}

export function isFurnitureDimensionLabelsVisible() {
  return window.showAllDimensionLabels === true || window.showFurnitureDimensionLabels === true;
}

function ensureDimensionModeStyles() {
  if (document.getElementById('cld-dimension-mode-styles')) return;
  const style = document.createElement('style');
  style.id = 'cld-dimension-mode-styles';
  style.textContent = `
    .cld-all-dimensions-on .dimension-label:not(.cld-ref-dimension-label),
    .cld-all-dimensions-on .section-single-width-label,
    .cld-all-dimensions-on .furniture-width-label {
      color: #1565c0 !important;
      border: 1px solid #42a5f5 !important;
      background: rgba(255, 255, 255, 0.95) !important;
      font-weight: 600 !important;
    }
    .cld-dim-hover-tooltip {
      position: fixed;
      z-index: 10050;
      padding: 6px 10px;
      font-size: 12px;
      color: #fff;
      background: rgba(0, 0, 0, 0.82);
      border-radius: 6px;
      pointer-events: none;
      white-space: nowrap;
    }
  `;
  document.head.appendChild(style);
}

function positionDimensionTooltip(tip, ev) {
  if (!tip) return;
  const margin = 8;
  const offset = 12;
  tip.style.left = '0';
  tip.style.top = '0';
  tip.style.visibility = 'hidden';
  const rect = tip.getBoundingClientRect();
  let left = ev.clientX + offset;
  let top = ev.clientY + offset;
  if (left + rect.width > window.innerWidth - margin) {
    left = ev.clientX - rect.width - offset;
  }
  if (top + rect.height > window.innerHeight - margin) {
    top = ev.clientY - rect.height - offset;
  }
  left = Math.max(margin, Math.min(left, window.innerWidth - rect.width - margin));
  top = Math.max(margin, Math.min(top, window.innerHeight - rect.height - margin));
  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
  tip.style.visibility = 'visible';
}

function attachDimensionTooltip(el, text) {
  if (!el) return;
  let tip = null;
  const show = (e) => {
    if (isAllDimensionLabelsVisible()) return;
    tip = document.createElement('div');
    tip.className = 'cld-dim-hover-tooltip';
    tip.textContent = text;
    document.body.appendChild(tip);
    const move = (ev) => {
      positionDimensionTooltip(tip, ev);
    };
    move(e);
    el._cldDimTipMove = move;
    document.addEventListener('mousemove', move);
  };
  const hide = () => {
    if (el._cldDimTipMove) {
      document.removeEventListener('mousemove', el._cldDimTipMove);
      el._cldDimTipMove = null;
    }
    tip?.remove();
    tip = null;
  };
  el.addEventListener('mouseenter', show);
  el.addEventListener('mouseleave', hide);
}

function applyAllDimensionsButtonUi(btn, on) {
  if (!btn) return;
  btn.style.background = on ? ALL_DIMS_ACTIVE_BG : 'white';
  btn.style.color = on ? ALL_DIMS_ACTIVE_COLOR : '#333';
  btn.style.border = on ? `2px solid ${ALL_DIMS_ACTIVE_BG}` : '2px solid #ccc';
  btn.title = on ? 'Скрыть размеры' : 'Показать размеры';
  btn.setAttribute('aria-label', btn.title);
}

function isAllDimsButtonStepActive() {
  const step = typeof window.currentRoomStep === 'number' ? window.currentRoomStep : 0;
  return step >= 4;
}

/** Кнопка «cm» — только с шага 4 (тумбы) и далее. */
export function syncAllDimsButtonVisibility() {
  const btn = window.__clodisAllDimsBtn;
  if (!btn) return;
  const show = isAllDimsButtonStepActive();
  btn.style.display = show ? 'flex' : 'none';
  if (!show && isAllDimensionLabelsVisible()) {
    setAllDimensionLabelsVisible(false);
  }
}

function syncLegacyDimensionButtonsUi() {
  const sectionBtn = window.__clodisSectionDimsBtn;
  const furnitureBtn = window.__clodisFurnitureDimsBtn;
  if (sectionBtn) {
    const on = isSectionDimensionLabelsVisible();
    sectionBtn.style.background = on ? '#333' : 'white';
    sectionBtn.style.color = on ? '#fff' : '#333';
  }
  if (furnitureBtn) {
    const on = isFurnitureDimensionLabelsVisible();
    furnitureBtn.style.background = on ? '#333' : 'white';
    furnitureBtn.style.color = on ? '#fff' : '#333';
  }
}

function afterIndividualDimensionToggle() {
  window.showAllDimensionLabels =
    window.showSectionDimensionLabels && window.showFurnitureDimensionLabels;
  ensureDimensionModeStyles();
  if (window.sceneIconsContainer) {
    window.sceneIconsContainer.classList.toggle(
      'cld-all-dimensions-on',
      window.showAllDimensionLabels
    );
  }
  syncRefDimensionLines();
  applyAllDimensionsButtonUi(window.__clodisAllDimsBtn, window.showAllDimensionLabels);
  syncLegacyDimensionButtonsUi();
}

export function setAllDimensionLabelsVisible(on) {
  ensureDimensionModeStyles();
  const enable = !!on;
  window.showAllDimensionLabels = enable;
  window.showSectionDimensionLabels = enable;
  window.showFurnitureDimensionLabels = enable;

  if (window.sceneIconsContainer) {
    window.sceneIconsContainer.classList.toggle('cld-all-dimensions-on', enable);
  }

  syncRefDimensionLines();

  applyAllDimensionsButtonUi(window.__clodisAllDimsBtn, enable);
  syncLegacyDimensionButtonsUi();
}

export function toggleAllDimensionLabels() {
  setAllDimensionLabelsVisible(!isAllDimensionLabelsVisible());
}
/** Размеры петель (Y / цепочка) в комнате — синхрон с DEBUG_HINGE_ROLE_MARKERS */
if (typeof window.showHingeDimensionLabels === 'undefined') {
  window.showHingeDimensionLabels =
    window.DEBUG_HINGE_ROLE_MARKERS === true || window.DEBUG_HINGE_ROLE_MARKERS === 1;
}
/** Синие № деталей обклада на планках — по умолчанию выключены. */
if (typeof window.__CLD_SHOW_TRIM_PART_LABELS === 'undefined') {
  window.__CLD_SHOW_TRIM_PART_LABELS = false;
}

// ─── Шаг 5: иконки-шкафов и выделение ───────────────────────────────────────
window.step5FurnitureIcons = window.step5FurnitureIcons || [];
window.step5SelectedFurnitureUuid = null;
const _STEP5_POP_OUT_MM = 90; // насколько шкаф «выезжает» вперёд при выборе
// _STEP5_LAYOUT_ICON_OFFSET_MM / ZONE_EDIT_ICON_SIZE_PX — выше, у __worldIconAnchorFromGroup

/**
 * Create a scene icon - 2D HTML element positioned on the scene
 * @param {string} iconHtml - HTML content for the icon
 * @param {object} position - Position object with left/top/right/bottom/transform
 * @param {object} options - Additional options (className, style, cursor)
 * @returns {HTMLElement} The created icon element
 */
export function createSceneIcon(iconHtml, position, options = {}) {
  if (!window.sceneIconsContainer) {
    console.warn('⚠️ Контейнер для иконок не создан');
    return null;
  }
  
  const div = document.createElement('div');
  div.className = options.className || 'scene-icon';
  div.innerHTML = iconHtml;
  div.style.position = 'absolute';
  div.style.pointerEvents = 'auto';
  div.style.cursor = options.cursor || 'pointer';
  div.style.userSelect = 'none';
  div.style.zIndex = '1001';
  if (options.title) {
    div.title = options.title;
  }
  if (options.ariaLabel || options.title) {
    div.setAttribute('aria-label', options.ariaLabel || options.title);
  }
  if (options.role) {
    div.setAttribute('role', options.role);
  }
  
  // Если position - объект с left/top/right/bottom, используем его напрямую
  if (position && typeof position === 'object' && (position.left !== undefined || position.top !== undefined || position.right !== undefined || position.bottom !== undefined)) {
    if (position.left !== undefined) div.style.left = position.left;
    if (position.top !== undefined) div.style.top = position.top;
    if (position.right !== undefined) div.style.right = position.right;
    if (position.bottom !== undefined) div.style.bottom = position.bottom;
    if (position.transform) div.style.transform = position.transform;
  }
  
  // Применяем дополнительные стили если переданы
  if (options.style) {
    Object.assign(div.style, options.style);
  }
  
  const parent = options.parent || window.sceneIconsContainer;
  parent.appendChild(div);
  window.sceneIcons.push(div);
  
  return div;
}

/**
 * Update/create room dimension labels on the plan.
 * В room-edit 2D — как у IKEA: клик по «500 см» → ввод, синхрон с панелью формы.
 * На стене с проёмом полный размер скрыт — вместо него сегменты (194,5 | 111 | 194,5 см).
 */
export function updateRoomDimensionLabels() {
  const editingAxis = window.__cldRoomDimEditing;
  if (editingAxis && document.activeElement && document.activeElement.classList.contains('cld-room-outer-dim-input')) {
    // Не сносить поле во время ввода
    projectRoomDimensionLabels();
    redrawRoomOuterDimLines();
    return;
  }

  if (window.roomDimensionLabels) {
    window.roomDimensionLabels.forEach((label) => {
      if (label && label.parentNode) label.parentNode.removeChild(label);
    });
  }
  window.roomDimensionLabels = [];
  window.__cldRoomOuterDimSegs = [];

  if (!state.room || !window.sceneIconsContainer) return;

  const rw = state.room.width;
  const rd = state.room.depth;
  const wCm = Math.round(Number(rw) || 0) / 10;
  const dCm = Math.round(Number(rd) || 0) / 10;
  const fmtRoomCm = (cmVal) => Number(cmVal).toFixed(1).replace('.', ',') + ' см';
  const wLabel = fmtRoomCm(wCm);
  const dLabel = fmtRoomCm(dCm);
  // Тот же out, что DIM_OUT_MM у opening dims — одна линия снаружи (ближе к стене ×2)
  const out = 100 + 280;
  const y = 0;
  const editable = !!(window.__cldRoomEditOpen && window.__cldRoomEditView !== '3d');
  const hide =
    window.__cldHideRoomDimSides && typeof window.__cldHideRoomDimSides === 'object'
      ? window.__cldHideRoomDimSides
      : {};

  const widthTopPos = new THREE.Vector3(0, y, -rd / 2 - out);
  const widthBottomPos = new THREE.Vector3(0, y, rd / 2 + out);
  const depthLeftPos = new THREE.Vector3(-rw / 2 - out, y, 0);
  const depthRightPos = new THREE.Vector3(rw / 2 + out, y, 0);

  if (!hide.top) {
    const widthTop = createDimensionLabel(
      wLabel,
      widthTopPos,
      'dimension-label dimension-width-top' + (editable ? ' is-room-dim-editable' : ''),
      {},
      editable ? { axis: 'width', valueCm: wCm } : null
    );
    if (widthTop) window.roomDimensionLabels.push(widthTop);
  }
  if (!hide.bottom) {
    const widthBottom = createDimensionLabel(
      wLabel,
      widthBottomPos,
      'dimension-label dimension-width-bottom' + (editable ? ' is-room-dim-editable' : ''),
      {},
      editable ? { axis: 'width', valueCm: wCm } : null
    );
    if (widthBottom) window.roomDimensionLabels.push(widthBottom);
  }
  if (!hide.left) {
    const depthLeft = createDimensionLabel(
      dLabel,
      depthLeftPos,
      'dimension-label dimension-depth-left' + (editable ? ' is-room-dim-editable' : ''),
      { transform: 'rotate(-90deg)' },
      editable ? { axis: 'depth', valueCm: dCm } : null
    );
    if (depthLeft) window.roomDimensionLabels.push(depthLeft);
  }
  if (!hide.right) {
    const depthRight = createDimensionLabel(
      dLabel,
      depthRightPos,
      'dimension-label dimension-depth-right' + (editable ? ' is-room-dim-editable' : ''),
      { transform: 'rotate(-90deg)' },
      editable ? { axis: 'depth', valueCm: dCm } : null
    );
    if (depthRight) window.roomDimensionLabels.push(depthRight);
  }

  if (editable) {
    const segs = [];
    if (!hide.top) {
      segs.push({
        axis: 'width',
        labelClass: '.dimension-width-top',
        p1: new THREE.Vector3(-rw / 2, y, -rd / 2 - out),
        p2: new THREE.Vector3(rw / 2, y, -rd / 2 - out),
      });
    }
    if (!hide.bottom) {
      segs.push({
        axis: 'width',
        labelClass: '.dimension-width-bottom',
        p1: new THREE.Vector3(-rw / 2, y, rd / 2 + out),
        p2: new THREE.Vector3(rw / 2, y, rd / 2 + out),
      });
    }
    if (!hide.left) {
      segs.push({
        axis: 'depth',
        labelClass: '.dimension-depth-left',
        p1: new THREE.Vector3(-rw / 2 - out, y, -rd / 2),
        p2: new THREE.Vector3(-rw / 2 - out, y, rd / 2),
      });
    }
    if (!hide.right) {
      segs.push({
        axis: 'depth',
        labelClass: '.dimension-depth-right',
        p1: new THREE.Vector3(rw / 2 + out, y, -rd / 2),
        p2: new THREE.Vector3(rw / 2 + out, y, rd / 2),
      });
    }
    window.__cldRoomOuterDimSegs = segs;
    redrawRoomOuterDimLines();
  } else {
    const layer = document.getElementById('cld-room-outer-dim-lines');
    if (layer) layer.replaceChildren();
  }
}

if (typeof window !== 'undefined') {
  window.__cldUpdateRoomDimensionLabels = updateRoomDimensionLabels;
}

function projectRoomDimensionLabels() {
  const container = window.sceneIconsContainer;
  if (!container || !state.camera) return;
  const widthHalf = container.clientWidth / 2;
  const heightHalf = container.clientHeight / 2;
  (window.roomDimensionLabels || []).forEach((label) => {
    const p = label.userData && label.userData.position3D;
    if (!p) return;
    const v = p.clone().project(state.camera);
    label.style.left = v.x * widthHalf + widthHalf + 'px';
    label.style.top = -(v.y * heightHalf) + heightHalf + 'px';
    label.style.display = v.z > 1 ? 'none' : 'block';
  });
}

function ensureRoomOuterDimSvg() {
  const box = window.sceneIconsContainer;
  if (!box) return null;
  let svg = document.getElementById('cld-room-outer-dim-svg');
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'cld-room-outer-dim-svg';
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText =
      'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:18;overflow:hidden';
    const lines = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    lines.id = 'cld-room-outer-dim-lines';
    svg.appendChild(lines);
    box.appendChild(svg);
  }
  return svg;
}

function redrawRoomOuterDimLines() {
  if (!(window.__cldRoomEditOpen && window.__cldRoomEditView !== '3d')) {
    const layer0 = document.getElementById('cld-room-outer-dim-lines');
    if (layer0) layer0.replaceChildren();
    return;
  }
  ensureRoomOuterDimSvg();
  const layer = document.getElementById('cld-room-outer-dim-lines');
  const container = window.sceneIconsContainer;
  if (!layer || !container || !state.camera) return;
  layer.replaceChildren();
  const w = container.clientWidth / 2;
  const h = container.clientHeight / 2;
  const tick = 9;
  (window.__cldRoomOuterDimSegs || []).forEach((seg) => {
    const a = seg.p1.clone().project(state.camera);
    const b = seg.p2.clone().project(state.camera);
    if (a.z > 1 && b.z > 1) return;
    const x1 = a.x * w + w;
    const y1 = -a.y * h + h;
    const x2 = b.x * w + w;
    const y2 = -b.y * h + h;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 2) return;
    const nx = -dy / len;
    const ny = dx / len;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // Gap at center of line where the dimension label sits
    // Label is always centered on the line, so split at midpoint
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    // Measure label to size gap; fallback 40px
    let gapHalf = 40;
    if (seg.labelClass) {
      const lbl = container.querySelector(seg.labelClass);
      if (lbl) {
        const r = lbl.getBoundingClientRect();
        gapHalf = Math.max(r.width, r.height) / 2 + 8;
      }
    }
    const gapStartX = midX - (dx / len) * gapHalf;
    const gapStartY = midY - (dy / len) * gapHalf;
    const gapEndX = midX + (dx / len) * gapHalf;
    const gapEndY = midY + (dy / len) * gapHalf;
    // line 1: start → gap start
    const l1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l1.setAttribute('x1', String(x1)); l1.setAttribute('y1', String(y1));
    l1.setAttribute('x2', String(gapStartX)); l1.setAttribute('y2', String(gapStartY));
    l1.setAttribute('stroke', '#333'); l1.setAttribute('stroke-width', '1.25');
    g.appendChild(l1);
    // line 2: gap end → end
    const l2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l2.setAttribute('x1', String(gapEndX)); l2.setAttribute('y1', String(gapEndY));
    l2.setAttribute('x2', String(x2)); l2.setAttribute('y2', String(y2));
    l2.setAttribute('stroke', '#333'); l2.setAttribute('stroke-width', '1.25');
    g.appendChild(l2);
    [
      [x1, y1],
      [x2, y2],
    ].forEach(([x, y]) => {
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      t.setAttribute('x1', String(x - (nx * tick) / 2));
      t.setAttribute('y1', String(y - (ny * tick) / 2));
      t.setAttribute('x2', String(x + (nx * tick) / 2));
      t.setAttribute('y2', String(y + (ny * tick) / 2));
      t.setAttribute('stroke', '#333');
      t.setAttribute('stroke-width', '1.25');
      g.appendChild(t);
    });
    layer.appendChild(g);
  });
}

function applyRoomDimAxis(axis, cmVal) {
  const n = Math.round(Number(cmVal));
  if (!Number.isFinite(n)) return;
  const clamped = Math.max(100, Math.min(2000, n));
  const wEl = document.getElementById('room-width-input');
  const dEl = document.getElementById('room-depth-input');
  if (axis === 'width' && wEl) wEl.value = String(clamped);
  if (axis === 'depth' && dEl) dEl.value = String(clamped);
  window.__cldRoomDimEditing = null;
  if (typeof window.__cldApplyRoomDimensions === 'function') {
    window.__cldApplyRoomDimensions();
  }
}

function beginRoomDimEdit(label, axis, valueCm) {
  window.__cldRoomDimEditing = axis;
  label.classList.add('is-editing');
  label.textContent = '';
  const input = document.createElement('input');
  input.type = 'text';
  input.inputMode = 'decimal';
  input.className = 'cld-room-outer-dim-input';
  input.value = String(valueCm);
  input.setAttribute('aria-label', axis === 'width' ? 'Ширина комнаты, см' : 'Глубина комнаты, см');
  const finish = (commit) => {
    const v = input.value;
    label.classList.remove('is-editing');
    if (commit) applyRoomDimAxis(axis, v);
    else {
      window.__cldRoomDimEditing = null;
      updateRoomDimensionLabels();
    }
  };
  input.addEventListener('mousedown', (e) => e.stopPropagation());
  input.addEventListener('click', (e) => e.stopPropagation());
  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      finish(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      finish(false);
    }
  });
  input.addEventListener('blur', () => {
    if (window.__cldRoomDimEditing === axis) finish(true);
  });
  label.appendChild(input);
  requestAnimationFrame(() => {
    input.focus();
    input.select();
  });
}

/**
 * Create a dimension label in 3D space
 * @param {string} text - Label text
 * @param {THREE.Vector3} position3D - 3D position
 * @param {string} className - CSS class name
 * @param {object} extraStyle - Additional styles
 * @param {{axis:string,valueCm:number}|null} editMeta - room-edit click-to-edit
 * @returns {HTMLElement} The created label element
 */
export function createDimensionLabel(text, position3D, className, extraStyle = {}, editMeta = null) {
  if (!window.sceneIconsContainer) return null;

  const label = document.createElement('div');
  label.className = className || 'dimension-label';
  label.textContent = text;
  label.style.position = 'absolute';
  label.style.pointerEvents = editMeta ? 'auto' : 'none';
  label.style.userSelect = 'none';
  label.style.fontSize = '14px';
  label.style.fontWeight = '500';
  label.style.color = '#333';
  label.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
  label.style.padding = '4px 8px';
  label.style.borderRadius = '4px';
  label.style.whiteSpace = 'nowrap';
  if (editMeta) {
    label.style.cursor = 'text';
    label.style.border = '1px solid #111';
    label.style.fontWeight = '600';
    label.title = 'Изменить размер комнаты';
    label.setAttribute('role', 'button');
    label.tabIndex = 0;
    label.addEventListener('mousedown', (e) => e.stopPropagation());
    label.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.__cldRoomDimEditing) return;
      beginRoomDimEdit(label, editMeta.axis, editMeta.valueCm);
    });
  }

  Object.assign(label.style, extraStyle);

  label.userData = {
    position3D: position3D.clone(),
    editMeta,
  };

  window.sceneIconsContainer.appendChild(label);

  const vector = position3D.clone();
  vector.project(state.camera);

  const container = window.sceneIconsContainer;
  const widthHalf = container.clientWidth / 2;
  const heightHalf = container.clientHeight / 2;

  const x = vector.x * widthHalf + widthHalf;
  const y = -(vector.y * heightHalf) + heightHalf;

  // Центрируем по точке проекции. Для повернутых лейблов порядок важен:
  // сначала translate в центр точки, потом rotate, иначе боковые размеры съезжают.
  const prevTransform = label.style.transform || '';
  const baseTranslate = 'translate(-50%, -50%)';
  label.style.transform = prevTransform
    ? baseTranslate + ' ' + prevTransform
    : baseTranslate;
  label.style.left = x + 'px';
  label.style.top = y + 'px';
  label.style.display = vector.z > 1 ? 'none' : 'block';

  return label;
}

export function clearFurnitureCatalogNameLabels() {
  if (!window.furnitureCatalogNameLabels) window.furnitureCatalogNameLabels = [];
  window.furnitureCatalogNameLabels.forEach((label) => {
    if (label?.parentNode) label.parentNode.removeChild(label);
  });
  window.furnitureCatalogNameLabels = [];
}

/** Временные подписи: название шкафа из каталога над каждым модулем в комнате. */
export function refreshFurnitureCatalogNameLabels() {
  clearFurnitureCatalogNameLabels();
  if (window.__CLD_SHOW_CATALOG_NAME_LABELS === false) return;
  const step = typeof window.currentRoomStep === 'number' ? window.currentRoomStep : 0;
  if (step !== 4 && step !== 5) return;
  if (!state?.scene || !window.sceneIconsContainer) return;

  state.scene.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    upsertFurnitureCatalogNameLabel(obj);
  });
}

/** Одна подпись для модуля (place) — без clear + setFromObject по всей комнате. */
export function upsertFurnitureCatalogNameLabel(obj) {
  if (!obj?.isGroup || !obj.userData?.isFurniture) return null;
  if (window.__CLD_SHOW_CATALOG_NAME_LABELS === false) return null;
  const step = typeof window.currentRoomStep === 'number' ? window.currentRoomStep : 0;
  if (step !== 4 && step !== 5) return null;
  if (!window.sceneIconsContainer) return null;

  if (!window.furnitureCatalogNameLabels) window.furnitureCatalogNameLabels = [];
  window.furnitureCatalogNameLabels = window.furnitureCatalogNameLabels.filter((label) => {
    if (label?.userData?.furnitureGroup === obj) {
      if (label.parentNode) label.parentNode.removeChild(label);
      return false;
    }
    return true;
  });

  const ud = obj.userData;
  // setFromObject по всей комнате на каждый place = O(n) hitch; берём грубый AABB по матрице корня.
  obj.updateWorldMatrix(true, false);
  const bb = new THREE.Box3().setFromObject(obj, false);
  if (bb.isEmpty()) return null;
  const center = bb.getCenter(new THREE.Vector3());
  const topPos = new THREE.Vector3(center.x, bb.max.y + 180, center.z);
  let text = ud.catalogName && String(ud.catalogName).trim();
  if (!text) {
    const z = typeof ud.zoneIndex === 'number' ? ud.zoneIndex + 1 : '?';
    text = `Шкаф (зона ${z})`;
  }
  if (ud.catalogItemId != null && ud.catalogItemId !== '') {
    text += ` · id ${ud.catalogItemId}`;
  }
  const label = createDimensionLabel(text, topPos, 'furniture-catalog-name-label', {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0d4f4a',
    backgroundColor: 'rgba(232, 255, 252, 0.95)',
    border: '1px solid #0d9488',
    zIndex: '1003',
    maxWidth: '240px',
    whiteSpace: 'normal',
    textAlign: 'center',
    lineHeight: '1.25',
  });
  if (label) {
    label.userData.furnitureGroup = obj;
    label.userData.isCatalogNameLabel = true;
    window.furnitureCatalogNameLabels.push(label);
  }
  return label;
}

/**
 * Create an editable zone icon (карандаш в кружке), привязанный к 3D‑позиции зоны секции.
 * @param {string} sectionId
 * @param {number} zoneIndex
 * @param {THREE.Vector3} position3D
 * @returns {HTMLElement|null}
 */
/** Активный карандаш зоны, пока открыта «Настройка модуля». */
function syncSectionZoneEditIconsActive() {
  const editing = window.__cldEditingModuleZone;
  const icons = window.sectionZoneEditIcons || [];
  icons.forEach((icon) => {
    if (!icon || !icon.classList) return;
    const ud = icon.userData || {};
    const match =
      editing &&
      String(ud.sectionId) === String(editing.sectionId) &&
      String(ud.zoneIndex) === String(editing.zoneIndex);
    icon.classList.toggle('is-active', !!match);
  });
}

export function createSectionZoneEditIcon(sectionId, zoneIndex, position3D, furnitureGroup = null) {
  if (!window.sceneIconsContainer) return null;

  // Удаляем старую иконку: при паре в ячейке — только этого модуля, иначе всю зону.
  window.sectionZoneEditIcons = window.sectionZoneEditIcons.filter((icon) => {
    if (!icon || !icon.userData) return false;
    const sameSection = String(icon.userData.sectionId) === String(sectionId);
    const sameZone = Number(icon.userData.zoneIndex) === Number(zoneIndex);
    if (!sameSection || !sameZone) return true;
    if (furnitureGroup && furnitureGroup.isObject3D) {
      const sameFu =
        icon.userData.furnitureGroup === furnitureGroup ||
        String(icon.userData.furnitureUuid || '') === String(furnitureGroup.uuid);
      if (!sameFu) return true;
    }
    if (icon.parentNode) icon.parentNode.removeChild(icon);
    return false;
  });

  const group =
    furnitureGroup && furnitureGroup.isObject3D
      ? furnitureGroup
      : __findFurnitureGroupForZone(sectionId, zoneIndex);

  const icon = document.createElement('div');
  icon.className = 'section-zone-edit-icon';
  icon.innerHTML =
    '<svg class="section-zone-edit-icon__pen" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M12 20h9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
    '<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';
  icon.title = 'Редактировать модуль';
  icon.setAttribute('aria-label', 'Редактировать модуль');
  icon.setAttribute('role', 'button');
  icon.style.position = 'absolute';
  icon.style.pointerEvents = 'auto';
  icon.style.zIndex = '1002';

  let anchor = position3D;
  if (group) {
    const live = __worldZonePencilAnchorFromGroup(group, group.userData?.wallName || 'back');
    if (live) anchor = live;
  }

  icon.userData = {
    position3D: anchor.clone(),
    sectionId,
    zoneIndex,
    furnitureGroup: group || null,
    furnitureUuid: group ? group.uuid : null,
  };

  window.sceneIconsContainer.appendChild(icon);
  window.sectionZoneEditIcons.push(icon);
  syncSectionZoneEditIconsActive();
  __projectZonePencilToScreen(icon, icon.userData.position3D);

  // Клик по иконке редактирования зоны секции
  icon.addEventListener('click', (e) => {
    e.stopPropagation();
    // Track which section is "active" for the Step 4 +/- buttons
    window.activeSectionId = sectionId;
    // L: карандаш на плече → режим этого плеча (как Maatkasten Левый/Правый)
    try {
      if (typeof window.__clodisGetLShapePairForSection === 'function') {
        const pair = window.__clodisGetLShapePairForSection(sectionId);
        if (pair && typeof window.__clodisSetLArmFocusMode === 'function') {
          const mode =
            String(pair.primary?.id) === String(sectionId) ? 'primary' : 'attached';
          window.__clodisSetLArmFocusMode(mode, sectionId);
        }
      }
    } catch (_) {}
    // Notify Step 4 controls to refresh their display
    if (typeof window.__clodisRefreshStep4VariantDisplay === 'function') {
      window.__clodisRefreshStep4VariantDisplay(sectionId);
    }
    if (typeof window.handleSectionZoneEditClick === 'function') {
      window.handleSectionZoneEditClick({
        sectionId,
        zoneIndex,
        furnitureGroup: icon.userData.furnitureGroup || group || null,
      });
    }
  });

  return icon;
}

/**
 * Update all scene icon positions (for 3D-positioned icons)
 */
export function updateAllSceneIcons() {
  __iconWorldPosFrame += 1;
  __iconWorldPosRecomputeThisFrame = __iconWorldPosFrame % __ICON_WORLD_POS_RECOMPUTE_EVERY === 0;

  updateDimensionLineLabelPositions();

  if (isAnyDimensionModeActive()) {
    const hide = (el) => {
      if (el) el.style.display = 'none';
    };
    (window.roomDimensionLabels || []).forEach(hide);
    (window.furnitureWidthLabels || []).forEach(hide);
    (window.sectionSingleZoneLabels || []).forEach(hide);
    if (state.sectionDimensionLabels) {
      Object.values(state.sectionDimensionLabels).forEach((arr) => arr?.forEach(hide));
    }
    if (state.sectionOffsetLabels) state.sectionOffsetLabels.forEach(hide);
  }

  // Обновляем позиции меток размеров (legacy — скрыты, если есть ref-линии;
  // в room-edit 2D наружные размеры комнаты всегда на плане, как у IKEA)
  if (window.roomDimensionLabels && (!hasRefDimensionLines() || (window.__cldRoomEditOpen && window.__cldRoomEditView !== '3d'))) {
    window.roomDimensionLabels.forEach(label => {
      if (label && label.userData && label.userData.position3D) {
        const vector = label.userData.position3D.clone();
        vector.project(state.camera);
        
        const container = window.sceneIconsContainer;
        if (!container) return;
        
        const widthHalf = container.clientWidth / 2;
        const heightHalf = container.clientHeight / 2;
        
        const x = (vector.x * widthHalf) + widthHalf;
        const y = -(vector.y * heightHalf) + heightHalf;
        
        label.style.left = x + 'px';
        label.style.top = y + 'px';
        const inFront = vector.z <= 1;
        const roomEdit2d = !!(window.__cldRoomEditOpen && window.__cldRoomEditView !== '3d');
        label.style.display =
          (isAllDimensionLabelsVisible() || roomEdit2d) && inFront ? 'block' : 'none';
      }
    });
    if (window.__cldRoomEditOpen && window.__cldRoomEditView !== '3d') {
      redrawRoomOuterDimLines();
    }
  }

  // Обновляем позиции меток ширины мебели (legacy)
  if (window.furnitureWidthLabels && !hasRefDimensionLines()) {
    window.furnitureWidthLabels.forEach(label => {
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
        const inFront = vector.z <= 1;
        label.style.display =
          isFurnitureDimensionLabelsVisible() && inFront ? 'block' : 'none';
      }
    });
  }

  // Временные подписи названий каталога над шкафами
  if (window.furnitureCatalogNameLabels?.length) {
    const showCatalog =
      window.__CLD_SHOW_CATALOG_NAME_LABELS !== false &&
      (window.currentRoomStep === 4 || window.currentRoomStep === 5);
    window.furnitureCatalogNameLabels.forEach((label) => {
      if (!label?.userData?.position3D) return;
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
      const inFront = vector.z <= 1;
      label.style.display = showCatalog && inFront ? 'block' : 'none';
    });
  }

  // № деталей обклада (синие бейджи на планках/накладках)
  if (window.trimPartNumberLabels?.length) {
    const showTrim =
      typeof window.isTrimPartNumberLabelsVisible === 'function'
        ? window.isTrimPartNumberLabelsVisible()
        : window.__CLD_SHOW_TRIM_PART_LABELS === true &&
          Number(window.currentRoomStep) >= 2 &&
          Number(window.currentRoomStep) <= 6;
    window.trimPartNumberLabels.forEach((label) => {
      if (!label?.userData?.position3D) return;
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
      label.style.display = showTrim && vector.z <= 1 ? 'block' : 'none';
    });
  }

  // Метки ширины зон (мм) — только DEBUG_LAYOUT_ZONES; основные размеры секции — отдельно.
  if (window.sectionSingleZoneLabels && !hasRefDimensionLines()) {
    const showZoneMm =
      window.DEBUG_LAYOUT_ZONES === true && isSectionDimensionLabelsVisible();
    window.sectionSingleZoneLabels.forEach((label) => {
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
        const inFront = vector.z <= 1;
        label.style.display = showZoneMm && inFront ? 'block' : 'none';
      }
    });
  }

  // Карандаши зон: всегда следуют за живой группой шкафа; без группы / якоря — удаляем.
  const _isStep5 = window.currentRoomStep === 5;
  if (window.sectionZoneEditIcons) {
    window.sectionZoneEditIcons = window.sectionZoneEditIcons.filter((icon) => {
      if (!icon || !icon.userData) return false;
      const group = __resolveZonePencilFurnitureGroup(icon);
      if (!group || !group.parent) {
        if (icon.parentNode) icon.parentNode.removeChild(icon);
        return false;
      }
      const livePos = __worldZonePencilAnchorFromGroup(
        group,
        group.userData?.wallName || 'back'
      );
      if (!livePos) {
        // Не оставляем «залипший» карандаш у пола от раннего create.
        if (icon.parentNode) icon.parentNode.removeChild(icon);
        return false;
      }
      if (icon.userData.position3D) icon.userData.position3D.copy(livePos);
      else icon.userData.position3D = livePos.clone();
      __projectZonePencilToScreen(icon, livePos);
      if (_isStep5) icon.style.display = 'none';
      return true;
    });
  }

  // Обновляем позиции иконок-шкафов шага 5 (как карандаш: центр по XZ + сдвиг 1200 мм «к зрителю»)
  if (window.step5FurnitureIcons && window.step5FurnitureIcons.length > 0) {
    const recomputeWorldPos = __shouldRecomputeIconWorldPositions();
    window.step5FurnitureIcons.forEach((icon) => {
      const group = icon._step5Group;
      if (!group || !state.camera) return;

      if (recomputeWorldPos || !icon._step5IconPos3D) {
        icon._step5IconPos3D = __worldIconAnchorFromGroup(
          group,
          group.userData?.wallName || 'back',
          _STEP5_LAYOUT_ICON_OFFSET_MM
        );
      }
      const iconPos3D = icon._step5IconPos3D;
      if (!iconPos3D) return;

      const vector = iconPos3D.clone();
      vector.project(state.camera);

      const container = window.sceneIconsContainer;
      if (!container) return;

      const widthHalf = container.clientWidth / 2;
      const heightHalf = container.clientHeight / 2;

      const x = vector.x * widthHalf + widthHalf;
      const y = -vector.y * heightHalf + heightHalf;

      icon.style.left = (x - 20) + 'px';
      icon.style.top = (y - 20) + 'px';
      icon.style.display = vector.z <= 1 ? 'flex' : 'none';
    });
  }

  // Иконки настроек секции (шаг 4, после появления мебели)
  if (window.step4SectionEditIcons && window.step4SectionEditIcons.length > 0) {
    window.step4SectionEditIcons.forEach((icon) => {
      const sectionData = icon._step4SectionData;
      if (!sectionData?.group || !state.camera) return;
      const iconPos3D = icon._step4EndCabinetSide
        ? _step4EndCabinetEditIconWorldPosition(sectionData, icon._step4EndCabinetSide)
        : _step4SectionEditIconWorldPosition(sectionData);
      if (!iconPos3D) return;
      const vector = iconPos3D.clone().project(state.camera);
      const container = window.sceneIconsContainer;
      if (!container) return;
      const widthHalf = container.clientWidth / 2;
      const heightHalf = container.clientHeight / 2;
      const x = vector.x * widthHalf + widthHalf;
      const y = -vector.y * heightHalf + heightHalf;
      if (icon._step4EndCabinetSide) {
        // Те же экранные привязка и видимость, что у карандаша обычной зоны.
        icon.style.left = x - ZONE_EDIT_ICON_SIZE_PX / 2 + 'px';
        icon.style.top = y - ZONE_EDIT_ICON_SIZE_PX / 2 + ZONE_EDIT_ICON_SCREEN_NUDGE_Y_PX + 'px';
        icon.style.display =
          window.showSectionZoneEditIcons && vector.z <= 1 ? 'flex' : 'none';
      } else {
        icon.style.left = x - 22 + 'px';
        icon.style.top = y - 22 + 'px';
        icon.style.display = vector.z <= 1 ? 'flex' : 'none';
      }
    });
  }

  // Обновляем позиции меток размеров секций (через window — ES module scope)
  if (typeof window.updateSectionDimensionLabels === 'function') {
    window.updateSectionDimensionLabels();
  }
}

/**
 * Remove an icon from the scene
 * @param {HTMLElement} iconElement - The icon element to remove
 */
export function removeSceneIcon(iconElement) {
  if (!iconElement || !iconElement.parentNode) return;
  
  iconElement.parentNode.removeChild(iconElement);
  
  // Удаляем из массива
  const index = window.sceneIcons.indexOf(iconElement);
  if (index > -1) {
    window.sceneIcons.splice(index, 1);
  }
}

// Пересоздать карандаши для модулей в секции (как в 1.86: по sectionId+zoneIndex),
// чтобы после resize секции иконки не исчезали.
export function rebuildSectionZoneEditIconsForSection(sectionId) {
  try {
    if (!window.sceneIconsContainer || !state?.scene) return;

    // Удаляем существующие карандаши для этой секции
    window.sectionZoneEditIcons = (window.sectionZoneEditIcons || []).filter((icon) => {
      if (!icon || !icon.userData) return false;
      if (String(icon.userData.sectionId) === String(sectionId)) {
        if (icon.parentNode) icon.parentNode.removeChild(icon);
        return false;
      }
      return true;
    });

    state.scene.traverse((obj) => {
      if (!obj || !obj.isGroup || !obj.userData || !obj.userData.isFurniture) return;
      const ud = obj.userData;
      if (String(ud.sectionId) !== String(sectionId)) return;
      if (typeof ud.zoneIndex !== 'number') return;

      // Карандаш модуля: у пола, сразу перед фасадом (как Maatkasten).
      const iconPos = __worldZonePencilAnchorFromGroup(obj, ud.wallName || 'back');
      if (!iconPos) return;

      createSectionZoneEditIcon(String(sectionId), ud.zoneIndex, iconPos, obj);
    });
  } catch (e) {}
}

// ─── Шаг 5: иконки шкафов над мебелью ────────────────────────────────────────

function _getPopOutDelta(wallName) {
  const d = _STEP5_POP_OUT_MM;
  if (wallName === 'front') return { x: 0, y: 0, z: -d };
  if (wallName === 'left')  return { x: d,  y: 0, z: 0  };
  if (wallName === 'right') return { x: -d, y: 0, z: 0  };
  return { x: 0, y: 0, z: d }; // back (default)
}

/**
 * Торцевой развёрнут поперёк ряда, поэтому «к зрителю» для него — движение вбок.
 * Выдвигаем его по нормали собственного фасада (локальная ось +Z группы),
 * наружу от ряда.
 */
function _getPopOutDeltaForGroup(group) {
  const ud = group?.userData || {};
  if (ud.isEndCabinet !== true) return _getPopOutDelta(ud.wallName || 'back');

  const dir = new THREE.Vector3(0, 0, 1)
    .applyQuaternion(group.getWorldQuaternion(new THREE.Quaternion()))
    .setY(0);
  if (dir.lengthSq() < 1e-6) return _getPopOutDelta(ud.wallName || 'back');
  dir.normalize();

  // Фасад торцевого смотрит наружу от ряда: если нормаль указывает к центру
  // секции, разворачиваем её.
  try {
    const section = (state.customSections || []).find(
      (s) => String(s?.id) === String(ud.sectionId)
    );
    if (section?.group) {
      const sectionCenter = section.group.getWorldPosition(new THREE.Vector3());
      const outward = group
        .getWorldPosition(new THREE.Vector3())
        .sub(sectionCenter)
        .setY(0);
      if (outward.lengthSq() > 1e-6 && dir.dot(outward) < 0) dir.negate();
    }
  } catch (_) {}

  dir.multiplyScalar(_STEP5_POP_OUT_MM);
  return { x: dir.x, y: 0, z: dir.z };
}

function _deselectPreviousStep5Furniture() {
  if (!window.step5SelectedFurnitureUuid) return;
  if (!state?.scene) return;
  state.scene.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?._step5IsSelected) return;
    if (obj.userData._step5OrigPosition) {
      obj.position.copy(obj.userData._step5OrigPosition);
      delete obj.userData._step5OrigPosition;
    }
    delete obj.userData._step5IsSelected;
  });
  window.step5FurnitureIcons?.forEach((icon) => icon.classList.remove('step5-cabinet-icon--selected'));
  window.step5SelectedFurnitureUuid = null;
  if (typeof window.hideStep5ModuleColorPanel === 'function') {
    window.hideStep5ModuleColorPanel();
  }
}

function _selectStep5Furniture(group) {
  if (!group) return;
  if (window.step5SelectedFurnitureUuid === group.uuid) {
    // Повторный клик = снять выделение
    _deselectPreviousStep5Furniture();
    return;
  }
  _deselectPreviousStep5Furniture();

  const delta = _getPopOutDeltaForGroup(group);
  group.userData._step5OrigPosition = group.position.clone();
  group.userData._step5IsSelected = true;
  group.position.x += delta.x;
  group.position.y += delta.y;
  group.position.z += delta.z;

  window.step5FurnitureIcons?.forEach((icon) => {
    const sel = icon._step5Group?.uuid === group.uuid;
    icon.classList.toggle('step5-cabinet-icon--selected', sel);
  });
  window.step5SelectedFurnitureUuid = group.uuid;

  if (typeof window.showStep5ModuleColorPanel === 'function') {
    window.showStep5ModuleColorPanel(group);
  }
}

export function deselectAllStep5Furniture() {
  _deselectPreviousStep5Furniture();
}

export function clearStep5FurnitureIcons() {
  _deselectPreviousStep5Furniture();
  (window.step5FurnitureIcons || []).forEach((icon) => {
    if (icon.parentNode) icon.parentNode.removeChild(icon);
  });
  window.step5FurnitureIcons = [];
}

export function buildStep5FurnitureIcons() {
  clearStep5FurnitureIcons();
  if (!state?.scene || !window.sceneIconsContainer) return;

  const furnitureGroups = [];
  state.scene.traverse((obj) => {
    if (obj?.isGroup && obj.userData?.isFurniture) furnitureGroups.push(obj);
  });

  furnitureGroups.forEach((group) => {
    const icon = document.createElement('div');
    icon.className = 'step5-cabinet-icon';
    icon._step5Group = group;
    // SVG иконка шкафа (силуэт)
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <rect x="3" y="2" width="18" height="20" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" stroke-width="1.4"/>
      <circle cx="9.5" cy="12" r="1" fill="currentColor"/>
      <circle cx="14.5" cy="12" r="1" fill="currentColor"/>
    </svg>`;
    icon.title = group.userData?.catalogName || 'Шкаф';

    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      _selectStep5Furniture(group);
    });

    window.sceneIconsContainer.appendChild(icon);
    window.step5FurnitureIcons.push(icon);
  });
}

export function setStep5SectionZonesVisible(visible) {
  if (!state?.scene) return;
  state.scene.traverse((obj) => {
    if (!obj?.name) return;
    if (
      obj.name.startsWith('SectionZoneSingle_') ||
      obj.name.startsWith('SectionZoneDouble_') ||
      obj.name.startsWith('SectionZoneCap_') ||
      obj.name.startsWith('SectionZoneSingleCorner')
    ) {
      obj.visible = visible;
    }
  });
}
if (typeof window !== 'undefined') {
  window.setStep5SectionZonesVisible = setStep5SectionZonesVisible;
}

/** Сплошные и пунктирные линии разметки шкафов (cabinet-markers.js): на шагах 4 и 5 скрыты. */
export function setStep5CabinetMarkersVisible(visible) {
  try {
    const map = state.sectionCabinetMarkers;
    if (map && typeof map === 'object') {
      Object.keys(map).forEach((id) => {
        const arr = map[id];
        if (Array.isArray(arr)) {
          arr.forEach((obj) => {
            if (obj) obj.visible = visible;
          });
        }
      });
    }
  } catch (_) {}
  if (!state?.scene) return;
  state.scene.traverse((obj) => {
    if (obj?.userData?.isCabinetMarker) obj.visible = visible;
  });
}

// ─── Шаг 4: иконка «настройки секции» — только если в сцене уже есть мебель ──
window.step4SectionEditIcons = window.step4SectionEditIcons || [];

function __hasAnyFurnitureInScene() {
  if (!state?.scene) return false;
  let found = false;
  state.scene.traverse((o) => {
    if (found) return;
    if (o?.isGroup && o.userData?.isFurniture) found = true;
  });
  return found;
}

function _step4SectionEditIconWorldPosition(sectionData) {
  const grp = sectionData?.group;
  if (!grp) return null;
  if (__shouldRecomputeIconWorldPositions() || !sectionData.__cldStep4IconPos3D) {
    sectionData.__cldStep4IconPos3D = __worldIconAnchorFromGroup(
      grp,
      sectionData.wallName || 'back',
      _STEP5_LAYOUT_ICON_OFFSET_MM
    );
  }
  return sectionData.__cldStep4IconPos3D;
}

/** Стоит ли в торцевом слоте реальный модуль (а не заглушка слота). */
function __findPlacedEndCabinetGroup(sectionData, side) {
  if (!state?.scene || !sectionData?.id) return null;
  let found = null;
  state.scene.traverse((obj) => {
    if (found || !obj?.isGroup) return;
    const ud = obj.userData;
    if (!ud?.isEndCabinet || ud.isEndCabinetSlot === true) return;
    if (String(ud.sectionId) !== String(sectionData.id)) return;
    if (String(ud.endCabinetSide) !== String(side)) return;
    found = obj;
  });
  return found;
}

function __hasPlacedEndCabinet(sectionData, side) {
  return !!__findPlacedEndCabinetGroup(sectionData, side);
}

function _step4EndCabinetEditIconWorldPosition(sectionData, side) {
  // Карандаш торцевого стоит там же, где иконка раскладки шага 5 для этой же
  // группы: вынос считается от стены ряда, а не от повёрнутого фасада модуля,
  // иначе иконка уезжает вдоль стены.
  const group = __findPlacedEndCabinetGroup(sectionData, side);
  if (group) {
    const anchor = __worldZonePencilAnchorFromGroup(
      group,
      group.userData?.wallName || 'back'
    );
    if (anchor) return anchor;
  }

  const slot = getEndCabinetSlot(sectionData, side);
  const fp = slot?.footprint;
  if (!fp?.min || !fp?.max) return null;
  const position = new THREE.Vector3(
    (fp.min.x + fp.max.x) / 2,
    fp.min.y + _ZONE_PENCIL_FLOOR_LIFT_MM,
    (fp.min.z + fp.max.z) / 2
  );
  const wallName = sectionData?.wallName || 'back';
  const halfDepthMm =
    wallName === 'left' || wallName === 'right'
      ? Math.abs(fp.max.x - fp.min.x) / 2
      : Math.abs(fp.max.z - fp.min.z) / 2;
  return __placeIconOnSharedFrontLine(
    position,
    wallName,
    _ZONE_PENCIL_AHEAD_GAP_MM,
    halfDepthMm
  );
}

export function clearStep4SectionEditIcons() {
  (window.step4SectionEditIcons || []).forEach((el) => {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  });
  window.step4SectionEditIcons = [];
}

export function buildStep4SectionEditIcons() {
  clearStep4SectionEditIcons();
  if (typeof window !== 'undefined' && window.currentRoomStep !== 4) return;
  if (!__hasAnyFurnitureInScene()) return;
  if (!window.sceneIconsContainer) return;

  (state.customSections || []).forEach((sectionData) => {
    if (!sectionData?.group) return;
    const icon = document.createElement('div');
    icon.className = 'step4-section-edit-icon';
    icon.innerHTML = '<i class="fas fa-sliders-h" aria-hidden="true"></i>';
    icon.title = 'Редактировать секцию';
    icon.setAttribute('aria-label', 'Редактировать секцию');
    icon.setAttribute('role', 'button');
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      window.activeSectionId = sectionData.id;
      if (typeof window.__clodisRefreshStep4VariantDisplay === 'function') {
        try {
          window.__clodisRefreshStep4VariantDisplay(sectionData.id);
        } catch (_) {}
      }
      try {
        hideAllSectionMarkers();
        showSectionPerimeterMarker(sectionData.group, sectionData.name, true);
      } catch (_) {}
      if (typeof window.showEditSectionModal === 'function') {
        window.showEditSectionModal(sectionData);
      }
    });
    icon._step4SectionData = sectionData;
    window.sceneIconsContainer.appendChild(icon);
    window.step4SectionEditIcons.push(icon);

    for (const side of END_CABINET_SIDES) {
      if (!isEndCabinetActive(sectionData, side)) continue;
      // Как у прямых зон: карандаш только под уже поставленный модуль, не под пустой слот.
      if (!__hasPlacedEndCabinet(sectionData, side)) continue;
      const endIcon = document.createElement('div');
      endIcon.className = 'section-zone-edit-icon';
      endIcon.innerHTML =
        '<svg class="section-zone-edit-icon__pen" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
        '<path d="M12 20h9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>';
      endIcon.style.position = 'absolute';
      endIcon.style.pointerEvents = 'auto';
      endIcon.style.zIndex = '1002';
      endIcon.title = 'Изменить глубину торцевого шкафа';
      endIcon.setAttribute('role', 'button');
      endIcon.setAttribute('aria-label', 'Изменить глубину торцевого шкафа');
      endIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof window.__cldEditEndCabinetDepth === 'function') {
          window.__cldEditEndCabinetDepth(sectionData.id, side);
        }
      });
      endIcon._step4SectionData = sectionData;
      endIcon._step4EndCabinetSide = side;
      window.sceneIconsContainer.appendChild(endIcon);
      window.step4SectionEditIcons.push(endIcon);
    }
  });
}

/**
 * Add all scene icons to the UI (as shown in screenshot) - 2D elements with fixed positions
 */
export function addSceneIcons() {
  if (!window.sceneIconsContainer) {
    console.warn('⚠️ Контейнер для иконок не создан');
    console.warn('[ZONE-WIDTH] addSceneIcons: нет sceneIconsContainer — обработчик зоны не зарегистрирован');
    return;
  }

  // Иконки слева — компактная вертикальная группа (визуал scene-control, без смены обработчиков)
  const leftStack = document.createElement('div');
  leftStack.className = 'scene-controls-stack';
  leftStack.setAttribute('role', 'toolbar');
  leftStack.setAttribute('aria-label', 'Инструменты сцены');
  window.sceneIconsContainer.appendChild(leftStack);

  const leftIcons = [
    { icon: 'fa-moon', title: 'Режим / освещение' },
    { icon: 'fa-tshirt', title: 'Оформление' },
    { icon: 'fa-window-maximize', title: 'Вид' },
  ];

  leftIcons.forEach((item) => {
    createSceneIcon(
      `<i class="fas ${item.icon}" aria-hidden="true"></i>`,
      null,
      {
        className: 'scene-control scene-icon-left',
        parent: leftStack,
        title: item.title,
        role: 'button',
      }
    );
  });

  const allDimsBtn = createSceneIcon(
    `<span style="font-size:11px;font-weight:700;line-height:1;letter-spacing:0.02em">cm</span>`,
    {
      right: '48px',
      top: '50%',
      transform: 'translateY(-50%)',
    },
    {
      className: 'scene-icon-all-dims',
      style: {
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        background: 'white',
        border: '2px solid #ccc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
      },
    }
  );
  if (allDimsBtn) {
    window.__clodisAllDimsBtn = allDimsBtn;
    applyAllDimensionsButtonUi(allDimsBtn, isAllDimensionLabelsVisible());
    allDimsBtn.addEventListener('click', () => toggleAllDimensionLabels());
    syncAllDimsButtonVisibility();
  }

  // === Кнопки сверху справа: размеры секций и модулей ===
  const topRightBaseStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    background: 'white',
    border: '1px solid #ddd',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    color: '#333',
    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
  };

  const sectionDimsBtn = createSceneIcon(
    `<i class="fas fa-ruler-combined"></i>`,
    {
      right: '20px',
      top: '20px',
    },
    {
      className: 'scene-icon-top-right scene-icon-section-dims',
      style: {
        ...topRightBaseStyle,
        opacity: 0.8,
      },
    }
  );

  const furnitureDimsBtn = createSceneIcon(
    `<i class="fas fa-ruler-horizontal"></i>`,
    {
      right: '70px',
      top: '20px',
    },
    {
      className: 'scene-icon-top-right scene-icon-furniture-dims',
      style: {
        ...topRightBaseStyle,
        opacity: 0.8,
        display: 'none',
      },
    }
  );
  window.__clodisSectionDimsBtn = sectionDimsBtn;
  window.__clodisFurnitureDimsBtn = furnitureDimsBtn;
  if (sectionDimsBtn) sectionDimsBtn.style.display = 'none';

  const hingeDimsBtn = createSceneIcon(
    `<i class="fas fa-arrows-alt-v"></i>`,
    {
      right: '120px',
      top: '20px',
    },
    {
      className: 'scene-icon-top-right scene-icon-hinge-dims',
      style: {
        ...topRightBaseStyle,
        opacity: 0.8,
      },
    }
  );
  if (hingeDimsBtn) {
    hingeDimsBtn.title = 'Размеры петель (Y)';
  }

  const trimPartLabelsBtn = createSceneIcon(
    `<i class="fas fa-list-ol"></i>`,
    {
      right: '170px',
      top: '20px',
    },
    {
      className: 'scene-icon-top-right scene-icon-trim-part-labels',
      style: {
        ...topRightBaseStyle,
        opacity: 0.8,
      },
      cursor: 'pointer',
    }
  );
  if (trimPartLabelsBtn) {
    trimPartLabelsBtn.title = 'Номера обклада';
  }

  const basisExportBtn = createSceneIcon(
    `<i class="fas fa-file-export"></i>`,
    {
      right: '220px',
      top: '20px',
    },
    {
      className: 'scene-icon-top-right scene-icon-basis-export',
      style: {
        ...topRightBaseStyle,
        opacity: 0.95,
      },
      cursor: 'pointer',
    }
  );

  const assemblyExportBtn = createSceneIcon(
    `<i class="fas fa-hammer"></i>`,
    { right: '370px', top: '20px' },
    {
      className: 'scene-icon-top-right scene-icon-assembly-export',
      style: { ...topRightBaseStyle, opacity: 0.95 },
      cursor: 'pointer',
    }
  );
  if (assemblyExportBtn) {
    assemblyExportBtn.title = 'В сборку: открыть инструкцию | Shift — скачать JSON';
    assemblyExportBtn.addEventListener('click', () => {
      const ev = window.event || null;
      try {
        if (ev?.shiftKey) downloadAssemblySnapshotJson();
        else exportRoomToAssemblyAndOpen();
      } catch (e) {
        console.error('[assembly-export]', e);
        alert(e?.message || 'Не удалось экспортировать в сборку');
      }
    });
  }

  const catalogNameLabelsBtn = createSceneIcon(
    `<i class="fas fa-tag"></i>`,
    {
      right: '270px',
      top: '20px',
    },
    {
      className: 'scene-icon-top-right scene-icon-catalog-name-labels',
      style: {
        ...topRightBaseStyle,
        opacity: 0.8,
      },
      cursor: 'pointer',
    }
  );

  function applyCatalogNameLabelsUi(on) {
    if (!catalogNameLabelsBtn) return;
    catalogNameLabelsBtn.style.background = on ? '#333' : 'white';
    catalogNameLabelsBtn.style.color = on ? '#fff' : '#333';
    catalogNameLabelsBtn.style.opacity = on ? 1 : 0.8;
    catalogNameLabelsBtn.title = on ? 'Скрыть названия модулей' : 'Показать названия модулей';
    catalogNameLabelsBtn.setAttribute('aria-label', catalogNameLabelsBtn.title);
  }

  if (catalogNameLabelsBtn) {
    applyCatalogNameLabelsUi(window.__CLD_SHOW_CATALOG_NAME_LABELS === true);
    catalogNameLabelsBtn.addEventListener('click', () => {
      const on = window.__CLD_SHOW_CATALOG_NAME_LABELS !== true;
      window.__CLD_SHOW_CATALOG_NAME_LABELS = on;
      applyCatalogNameLabelsUi(on);
      if (on) {
        refreshFurnitureCatalogNameLabels();
      } else {
        clearFurnitureCatalogNameLabels();
      }
    });
  }
  window.__clodisApplyCatalogNameLabelsUi = applyCatalogNameLabelsUi;

  // Обработчики клика: переключение показа размеров
  if (sectionDimsBtn) {
    sectionDimsBtn.addEventListener('click', () => {
      window.showSectionDimensionLabels = !window.showSectionDimensionLabels;
      afterIndividualDimensionToggle();
    });
  }

  if (furnitureDimsBtn) {
    furnitureDimsBtn.addEventListener('click', () => {
      window.showFurnitureDimensionLabels = !window.showFurnitureDimensionLabels;
      afterIndividualDimensionToggle();
    });
  }

  if (hingeDimsBtn) {
    const applyHingeDimsUi = (on) => {
      hingeDimsBtn.style.background = on ? '#333' : 'white';
      hingeDimsBtn.style.color = on ? '#fff' : '#333';
    };
    applyHingeDimsUi(!!window.showHingeDimensionLabels);
    hingeDimsBtn.addEventListener('click', () => {
      const on = !window.showHingeDimensionLabels;
      window.showHingeDimensionLabels = on;
      window.DEBUG_HINGE_ROLE_MARKERS = on;
      if (!on) {
        window.DEBUG_HINGE_ROLE_GUIDE_LINES = false;
      }
      applyHingeDimsUi(on);
      if (typeof window.refreshAllHingeRoleMarkersInRoom === 'function') {
        window.refreshAllHingeRoleMarkersInRoom();
      } else if (!on && typeof window.clearHingeRoleMarkers === 'function') {
        window.clearHingeRoleMarkers();
      }
    });
  }

  if (trimPartLabelsBtn) {
    const applyTrimPartLabelsUi = (on) => {
      trimPartLabelsBtn.style.background = on ? '#333' : 'white';
      trimPartLabelsBtn.style.color = on ? '#fff' : '#333';
      trimPartLabelsBtn.style.opacity = on ? 1 : 0.8;
    };
    applyTrimPartLabelsUi(window.__CLD_SHOW_TRIM_PART_LABELS === true);
    trimPartLabelsBtn.addEventListener('click', () => {
      const on = window.__CLD_SHOW_TRIM_PART_LABELS !== true;
      window.__CLD_SHOW_TRIM_PART_LABELS = on;
      applyTrimPartLabelsUi(on);
      if (typeof window.refreshTrimPartNumberLabels === 'function') {
        window.refreshTrimPartNumberLabels(window.__cldRoomScene || state?.scene);
      }
    });
  }

  if (basisExportBtn) {
    basisExportBtn.title = 'Экспорт: Ctrl=скачать CFRN | Ctrl+Shift=отправить в Bazis Cloud';
    basisExportBtn.addEventListener('click', () => {
      const ev = window.event || null;
      if (ev && ev.ctrlKey && ev.shiftKey) {
        exportToBazisCloud();
        return;
      }
      if (ev && ev.ctrlKey) {
        downloadCFRN();
        return;
      }
      // Alt+клик: экспорт раскроя/кромки (CSV+JSON)
      if (ev && ev.altKey) {
        // Alt+Shift: DXF (все детали на одном листе)
        if (ev.shiftKey) exportCutlistSingleSheetDxf();
        else exportCutlistAndEdges();
        return;
      }
      // По умолчанию OBJ (чаще всего поддерживается в импорте 3D моделей).
      // Shift+клик: STL
      if (ev && ev.shiftKey) exportFurnitureForBasisSTL();
      else exportFurnitureForBasisOBJ();
    });
  }

  /** Панели отладки секций — по умолчанию скрыты. */
  function applySectionSceneToolsVisibility(visible) {
    window.__clodisSectionSceneToolsVisible = !!visible;
    const zd = document.getElementById('zone-debug-panel');
    const sd = document.getElementById('section-debug-panel');
    if (zd) zd.style.display = visible ? 'flex' : 'none';
    if (sd) sd.style.display = visible ? 'flex' : 'none';
    updateAllSceneIcons();
  }
  window.__clodisApplySectionSceneToolsVisibility = applySectionSceneToolsVisibility;

  const sectionToolsBtn = createSceneIcon(
    `<i class="fas fa-sliders-h"></i>`,
    { right: '20px', top: '70px' },
    {
      className: 'scene-icon-top-right scene-icon-section-tools',
      style: {
        ...topRightBaseStyle,
        opacity: 0.95,
      },
      cursor: 'pointer',
    }
  );
  if (sectionToolsBtn) {
    sectionToolsBtn.title =
      'Отладка секций и панель «Свет»: показать / скрыть';
    sectionToolsBtn.addEventListener('click', () => {
      applySectionSceneToolsVisibility(!window.__clodisSectionSceneToolsVisible);
      const on = window.__clodisSectionSceneToolsVisible;
      sectionToolsBtn.style.background = on ? '#333' : 'white';
      sectionToolsBtn.style.color = on ? '#fff' : '#333';
    });
  }

  const doorToggleStyle = {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    background: 'white',
    border: '1px solid #ddd',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px',
    color: '#333',
    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
  };

  const doorToggleBtn = createSceneIcon(
    `<i class="fas fa-door-open" aria-hidden="true"></i>`,
    { right: '20px', top: '118px' },
    {
      className: 'scene-icon-top-right scene-icon-door-toggle',
      style: doorToggleStyle,
      cursor: 'pointer',
    }
  );
  if (doorToggleBtn) {
    doorToggleBtn.style.display = 'none';
  }

  const doorPillsWrap = document.createElement('div');
  doorPillsWrap.className = 'scene-door-pills';

  const doorPillsTrack = document.createElement('div');
  doorPillsTrack.className = 'scene-door-pills__track';

  const doorPillsSlider = document.createElement('div');
  doorPillsSlider.className = 'scene-door-pills__slider';
  doorPillsTrack.appendChild(doorPillsSlider);

  function createDoorPill(label, openValue) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'scene-door-pill';
    if (openValue === 'hide') {
      btn.dataset.mode = 'hide';
    } else {
      btn.dataset.openValue = openValue ? '1' : '0';
      btn.dataset.mode = 'swing';
    }
    btn.textContent = label;
    return btn;
  }

  const doorOpenBtn = createDoorPill('Открыть', true);
  const doorCloseBtn = createDoorPill('Закрывать', false);
  const doorHideBtn = createDoorPill('Без двери', 'hide');
  doorPillsTrack.appendChild(doorOpenBtn);
  doorPillsTrack.appendChild(doorCloseBtn);
  doorPillsTrack.appendChild(doorHideBtn);
  doorPillsWrap.appendChild(doorPillsTrack);
  window.sceneIconsContainer.appendChild(doorPillsWrap);

  function updateDoorPillSlider(activeBtn) {
    if (!doorPillsSlider) return;
    if (!activeBtn || !doorPillsWrap.parentNode || doorPillsWrap.style.display === 'none') {
      doorPillsSlider.style.opacity = '0';
      return;
    }
    const trackRect = doorPillsTrack.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    doorPillsSlider.style.width = `${btnRect.width}px`;
    doorPillsSlider.style.transform = `translateX(${btnRect.left - trackRect.left}px)`;
    doorPillsSlider.style.opacity = '1';
  }

  function syncDoorPillVisual(isOpen) {
    const hide = isRoomFacadesHidden();
    const open = !!isOpen;
    [doorOpenBtn, doorCloseBtn, doorHideBtn].forEach((btn) => {
      let active = false;
      if (hide) active = btn === doorHideBtn;
      else if (btn === doorHideBtn) active = false;
      else active = (btn === doorOpenBtn) === open;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    updateDoorPillSlider(hide ? doorHideBtn : open ? doorOpenBtn : doorCloseBtn);
  }

  function applyBulkDoorState(open) {
    const B = window.ClodisBuilder || window.ClodisBuilder;
    if (!B || typeof B.toggleAllDoors !== 'function') return false;
    setRoomFacadesHidden(false);
    const nextOpen = B.toggleAllDoors(!!open);
    window.__cldRoomDoorsDesiredOpen = !!nextOpen;
    syncDoorToggleBtnVisual(nextOpen);
    // Не дергаем полный refresh материалов — мешает анимации дверей/ящиков.
    window.clearTimeout(window.__cldDoorBulkToggleRetryTimer);
    window.__cldDoorBulkToggleRetryTimer = window.setTimeout(() => {
      try {
        const B2 = window.ClodisBuilder || window.ClodisBuilder;
        if (!B2 || typeof B2.toggleAllDoors !== 'function') return;
        const desired = window.__cldRoomDoorsDesiredOpen === true;
        B2.toggleAllDoors(desired);
        // Soft/Spot не от дверей — не syncAll (place раньше дёргал ×3 через applyBulkDoorState).
        if (typeof window.__cldScheduleIkeaRoomLightSync === 'function') {
          window.__cldScheduleIkeaRoomLightSync();
        }
      } catch (_) {}
    }, 120);
    return true;
  }

  function applyFacadesHiddenState() {
    // Только спрятать swing (layer 2). Углы Open/Close и ящики не трогаем.
    setRoomFacadesHidden(true);
    const B = window.ClodisBuilder || window.ClodisBuilder;
    const isOpen =
      B && typeof B._sceneDoorsAreOpen === 'function' ? B._sceneDoorsAreOpen() : false;
    syncDoorToggleBtnVisual(isOpen);
    syncDoorPillVisual(isOpen);
  }

  function syncDoorToggleBtnVisual(isOpen) {
    if (!doorToggleBtn) return;
    const hide = isRoomFacadesHidden();
    const open = !!isOpen;
    doorToggleBtn.style.background = hide ? '#607d8b' : open ? '#2196f3' : 'white';
    doorToggleBtn.style.color = hide || open ? '#fff' : '#333';
    doorToggleBtn.style.borderColor = hide ? '#546e7a' : open ? '#1976d2' : '#ddd';
    const icon = doorToggleBtn.querySelector('i');
    if (icon) {
      icon.className = hide ? 'fas fa-eye-slash' : open ? 'fas fa-door-open' : 'fas fa-door-closed';
    }
    doorToggleBtn.title = hide
      ? 'Без двери — нажмите Открыть/Закрывать'
      : open
        ? 'Закрыть все двери'
        : 'Открыть все двери';
    doorToggleBtn.setAttribute('aria-label', doorToggleBtn.title);
    syncDoorPillVisual(open);
  }

  if (doorToggleBtn) {
    syncDoorToggleBtnVisual(false);
    doorToggleBtn.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      if (isRoomFacadesHidden()) {
        setRoomFacadesHidden(false);
        applyBulkDoorState(true);
        return;
      }
      const B = window.ClodisBuilder || window.ClodisBuilder;
      if (!B || typeof B.toggleAllDoors !== 'function') return;
      const nextOpen = B.toggleAllDoors();
      window.__cldRoomDoorsDesiredOpen = !!nextOpen;
      syncDoorToggleBtnVisual(nextOpen);
    });
  }
  doorOpenBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    applyBulkDoorState(true);
  });
  doorCloseBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    applyBulkDoorState(false);
  });
  doorHideBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    applyFacadesHiddenState();
  });
  window.addEventListener('resize', () => {
    if (isRoomFacadesHidden()) updateDoorPillSlider(doorHideBtn);
    else {
      const isOpen = doorOpenBtn.getAttribute('aria-pressed') === 'true';
      updateDoorPillSlider(isOpen ? doorOpenBtn : doorCloseBtn);
    }
  });
  window.__clodisSyncDoorToggleBtn = syncDoorToggleBtnVisual;
  window.__clodisSetDoorPillsVisible = function (visible) {
    if (!doorPillsWrap) return;
    doorPillsWrap.style.display = visible ? 'flex' : 'none';
    if (visible) {
      const B = window.ClodisBuilder || window.ClodisBuilder;
      const isOpen =
        B && typeof B._sceneDoorsAreOpen === 'function' ? B._sceneDoorsAreOpen() : false;
      syncDoorPillVisual(isOpen);
      if (isRoomFacadesHidden()) syncRoomFacadesLightHide(state.scene);
    }
  };
  window.__clodisApplyDoorOpenState = function (open) {
    return applyBulkDoorState(open);
  };
  window.__clodisSetFacadesHidden = setRoomFacadesHidden;

  // Кнопки внизу слева (отмена/повтор) — отдельная горизонтальная группа, тот же scene-control
  const historyGroup = document.createElement('div');
  historyGroup.className = 'scene-controls-history';
  historyGroup.setAttribute('role', 'group');
  historyGroup.setAttribute('aria-label', 'История');
  window.sceneIconsContainer.appendChild(historyGroup);

  createSceneIcon(
    `<i class="fas fa-undo" aria-hidden="true"></i>`,
    null,
    {
      className: 'scene-control scene-icon-undo',
      parent: historyGroup,
      title: 'Отменить',
      role: 'button',
    }
  );

  createSceneIcon(
    `<i class="fas fa-redo" aria-hidden="true"></i>`,
    null,
    {
      className: 'scene-control scene-icon-redo',
      parent: historyGroup,
      title: 'Повторить',
      role: 'button',
    }
  );

  // Нижняя центральная кнопка — secondary scene-action (текст только UI)
  const editRoomBtn = createSceneIcon(
    `<i class="fas fa-pencil-alt" aria-hidden="true"></i>Изменить комнату`,
    {
      left: '50%',
      bottom: '80px',
      transform: 'translateX(-50%)'
    },
    {
      className: 'scene-control scene-action scene-icon-edit-room',
      title: 'Изменить комнату',
    }
  );

  // Сохраняем ссылку на кнопку редактирования для замены на "Готово"
  window.editRoomButton = editRoomBtn;
  
  // Обработчик клика на кнопку "Редактировать комнату"
  if (editRoomBtn) {
    editRoomBtn.addEventListener('click', () => {
      // TODO: Move showEditRoomModal to room module
      if (typeof showEditRoomModal !== 'undefined') {
        showEditRoomModal();
      }
    });
  }

  console.log('✅ Иконки добавлены на сцену (2D overlay)');

  // Глобальный обработчик клика по иконке редактирования зоны секции.
  // Тексты берём из room_steps_config, шаг 4 ("Управление комнатой 2").
  // Всегда перезаписываем (не «только если ещё не function»): иначе старая заглушка
  // с другого бандла блокировала бы актуальный обработчик и логи ZONE-WIDTH.
  window.handleSectionZoneEditClick = ({ sectionId, zoneIndex, furnitureGroup = null }) => {
      try {
        const config = getRoomStepsConfigLocal();
        let title = 'Настройка модуля';
        let bodyText = '';
        let depthMinCm = 30;
        let depthMaxCm = 70;
        let heightMinCm = 30;
        let heightMaxCm = 120;
        let heightLimitTextTemplate = '';
        let widthLimitTextTemplate = '';
        let depthLimitTextTemplate = '';
        let depthOverSectionTextTemplate = '';
        let sectionDepthCm = null;
        let isStandaloneFloorModule = false;
        let showFloorClearanceField = false;
        let floorClearanceCmText = '30,0';
        let floorClearanceMinCm = 0;
        let floorClearanceMaxCm = 80;
        let moduleEditProfile = null;
        let syncHeightInSection = true;
        let showModuleWidthField = true;

        // Ищем секцию и деление, чтобы показать реальные глубину и ширину модуля.
        let depthCmText = '60,0';
        let widthCmText = '97,1';
        let heightCmText = '40,0';
        let actualZoneWidthMm = null;
        let zoneDoorKind = 'double';
        let moduleZoneHand = 'left';
        let secRef = null;
        try {
          const sec = (state.customSections || []).find(
            (s) => String(s.id) === String(sectionId)
          );
          secRef = sec || null;
          if (sec && sec.size) {
            const wallName =
              sec.wallName || (sec.division && sec.division.wallName) || 'back';
            const isSide = wallName === 'left' || wallName === 'right';
            let depthMm = 0;
            let sectionDepthMm = isSide
              ? Number(sec.size.x || 0)
              : Number(sec.size.z || 0);
            if (sectionDepthMm > 0) {
              sectionDepthCm = sectionDepthMm / 10;
            }

            // 1) Пытаемся взять глубину ИЗ МОДУЛЯ в нужной зоне (customDepthMm или bbox).
            let targetFurniture = null;
            if (state.furniture && state.furniture.group) {
              const ud = state.furniture.group.userData || {};
              if (
                String(ud.sectionId) === String(sectionId) &&
                typeof ud.zoneIndex === 'number' &&
                ud.zoneIndex === zoneIndex
              ) {
                targetFurniture = state.furniture.group;
              }
            }
            if (!targetFurniture && state.scene) {
              state.scene.traverse((obj) => {
                if (targetFurniture) return;
                if (!obj.userData?.isFurniture) return;
                const ud = obj.userData;
                if (
                  String(ud.sectionId) === String(sectionId) &&
                  Number(ud.zoneIndex) === Number(zoneIndex)
                ) {
                  targetFurniture = obj;
                }
              });
            }
            if (targetFurniture) {
              state.selectedFurniture = { group: targetFurniture };
              const zhUd = String(targetFurniture.userData?.zoneHand || '').toLowerCase();
              if (zhUd === 'right' || zhUd === 'rtl') moduleZoneHand = 'right';
              const dkUd = String(targetFurniture.userData?.doorKind || '').toLowerCase();
              if (dkUd === 'single' || dkUd === 'double') zoneDoorKind = dkUd;
              moduleEditProfile =
                __pkApi() && typeof __pkApi().resolvePlacementKindProfileForGroup === 'function'
                  ? __pkApi().resolvePlacementKindProfileForGroup(targetFurniture.userData, config)
                  : null;
              if (moduleEditProfile) {
                isStandaloneFloorModule = moduleEditProfile.behavior?.fixedHeight === true;
                syncHeightInSection = moduleEditProfile.behavior?.syncHeightInSection !== false;
                showModuleWidthField = moduleEditProfile.editPopup?.showWidth !== false;
              } else {
                isStandaloneFloorModule =
                  String(targetFurniture.userData?.__placementKind || '').trim() ===
                  'standalone_floor';
              }
              const pkUd = String(targetFurniture.userData?.__placementKind || '').trim();
              showFloorClearanceField = pkUd === 'wall_hung_low';
              if (showFloorClearanceField) {
                let clrMm = null;
                if (typeof window.__cldResolveWallHungFloorClearanceMm === 'function') {
                  clrMm = window.__cldResolveWallHungFloorClearanceMm(
                    targetFurniture,
                    sec
                  );
                } else {
                  const raw = Number(targetFurniture.userData?.customFloorClearanceMm);
                  clrMm =
                    Number.isFinite(raw) && raw >= 0
                      ? raw
                      : Number(sec?.wallHungFloorClearanceMm);
                  if (!(Number.isFinite(clrMm) && clrMm >= 0)) clrMm = 300;
                }
                floorClearanceCmText = (clrMm / 10).toFixed(1).replace('.', ',');
              }
              if (isStandaloneFloorModule) {
                let hMm = Number(targetFurniture.userData?.customHeightMm) || 0;
                if (!hMm && moduleEditProfile?.behavior?.fixedHeight) {
                  const cm = moduleEditProfile.behavior.fixedHeightCm;
                  if (typeof cm === 'number' && cm > 0) hMm = Math.round(cm * 10);
                }
                if (!hMm) {
                  hMm = Number(targetFurniture.userData?.__initialSectionSizeMm?.y) || 0;
                }
                if (!hMm) {
                  const bboxH = __computeGroupBBoxNoAo(targetFurniture);
                  const szH = new THREE.Vector3();
                  bboxH.getSize(szH);
                  hMm = szH.y;
                }
                if (hMm > 0) {
                  heightCmText = (hMm / 10).toFixed(1).replace('.', ',');
                }
              }
            }
            if (targetFurniture) {
              depthMm = __resolveModuleDepthDisplayMm(
                targetFurniture,
                sectionDepthMm,
                isSide
              );
            } else {
              depthMm = sectionDepthMm;
            }

            if (depthMm > 0) {
              const dCm = depthMm / 10;
              depthCmText = dCm.toFixed(1).replace('.', ',');
            }

            const div = sec.division;
            let moduleWidthMm = null;
            if (div && typeof div.partSize === 'number' && div.partSize > 0) {
              moduleWidthMm = div.partSize;
            }
            // Предпочитаем точную ширину зоны из layoutCache (учитывает кастомные ширины).
            if (sec._layoutCache) {
              const lc = sec._layoutCache;
              if (lc.moduleWidthsMm && Number.isFinite(lc.moduleWidthsMm[zoneIndex])) {
                actualZoneWidthMm = lc.moduleWidthsMm[zoneIndex];
                moduleWidthMm = actualZoneWidthMm;
              }
              if (Array.isArray(lc.segments)) {
                const seg = lc.segments.find((s) => s.type === 'module' && s.zoneIndex === zoneIndex);
                if (seg) {
                  if (seg.doorKind) zoneDoorKind = seg.doorKind;
                  if (actualZoneWidthMm == null) actualZoneWidthMm = seg.endU - seg.startU;
                }
              }
            }
            if (moduleWidthMm != null) {
              const wCm = moduleWidthMm / 10;
              widthCmText = wCm.toFixed(1).replace('.', ',');
            }
          }
        } catch (e) {
          console.warn(
            '⚠️ Не удалось вычислить реальные размеры модуля для попапа:',
            e
          );
        }

        if (config && Array.isArray(config.steps)) {
          const step4 = config.steps.find((s) => s.stepId === 4);
          if (step4) {
            if (typeof step4.zoneEditTitle === 'string' && step4.zoneEditTitle.trim()) {
              title = step4.zoneEditTitle.trim();
              if (title === 'Настройте модуль') title = 'Настройка модуля';
            }
            if (typeof step4.zoneEditText === 'string' && step4.zoneEditText.trim()) {
              bodyText = step4.zoneEditText;
            }
            if (typeof step4.zoneEditDepthMinCm === 'number' && isFinite(step4.zoneEditDepthMinCm) && step4.zoneEditDepthMinCm > 0) {
              depthMinCm = step4.zoneEditDepthMinCm;
            }
            if (typeof step4.zoneEditDepthMaxCm === 'number' && isFinite(step4.zoneEditDepthMaxCm) && step4.zoneEditDepthMaxCm > 0) {
              depthMaxCm = step4.zoneEditDepthMaxCm;
            }
            if (typeof step4.zoneEditDepthLimitText === 'string' && step4.zoneEditDepthLimitText.trim()) {
              depthLimitTextTemplate = step4.zoneEditDepthLimitText;
            }
            if (typeof step4.zoneEditDepthOverSectionText === 'string' && step4.zoneEditDepthOverSectionText.trim()) {
              depthOverSectionTextTemplate = step4.zoneEditDepthOverSectionText;
            }
            if (typeof step4.zoneEditHeightMinCm === 'number' && isFinite(step4.zoneEditHeightMinCm) && step4.zoneEditHeightMinCm > 0) {
              heightMinCm = step4.zoneEditHeightMinCm;
            }
            if (typeof step4.zoneEditHeightMaxCm === 'number' && isFinite(step4.zoneEditHeightMaxCm) && step4.zoneEditHeightMaxCm > 0) {
              heightMaxCm = step4.zoneEditHeightMaxCm;
            }
            if (typeof step4.zoneEditHeightLimitText === 'string' && step4.zoneEditHeightLimitText.trim()) {
              heightLimitTextTemplate = step4.zoneEditHeightLimitText;
            }
            if (typeof step4.zoneEditWidthLimitText === 'string' && step4.zoneEditWidthLimitText.trim()) {
              widthLimitTextTemplate = step4.zoneEditWidthLimitText;
            }
            if (depthMaxCm <= depthMinCm) {
              depthMaxCm = depthMinCm + 1;
            }
            if (heightMaxCm <= heightMinCm) {
              heightMaxCm = heightMinCm + 1;
            }
          }
        }

        if (moduleEditProfile) {
          const step4Fb = (() => {
            if (!config || !Array.isArray(config.steps)) return {};
            const s4 = config.steps.find((s) => s.stepId === 4);
            if (!s4) return {};
            return {
              heightMinCm: s4.zoneEditHeightMinCm,
              heightMaxCm: s4.zoneEditHeightMaxCm,
              depthMinCm: s4.zoneEditDepthMinCm,
              depthMaxCm: s4.zoneEditDepthMaxCm,
              heightLimitText: s4.zoneEditHeightLimitText,
              depthLimitText: s4.zoneEditDepthLimitText,
            };
          })();
          const merged =
            __pkApi() && typeof __pkApi().applyEditPopupOverridesFromProfile === 'function'
              ? __pkApi().applyEditPopupOverridesFromProfile(
            {
              showHeight: isStandaloneFloorModule,
              showDepth: true,
              showWidth: true,
              heightMinCm,
              heightMaxCm,
              depthMinCm,
              depthMaxCm,
              heightLimitTextTemplate,
              depthLimitTextTemplate,
              isFixedHeightModule: isStandaloneFloorModule,
              syncHeightInSection,
            },
            moduleEditProfile,
            step4Fb
              )
              : null;
          if (!merged) {
            /* keep defaults */
          } else {
          if (merged.showHeight === true) isStandaloneFloorModule = true;
          if (merged.showHeight === false) isStandaloneFloorModule = false;
          if (typeof merged.heightMinCm === 'number') heightMinCm = merged.heightMinCm;
          if (typeof merged.heightMaxCm === 'number') heightMaxCm = merged.heightMaxCm;
          if (typeof merged.depthMinCm === 'number') depthMinCm = merged.depthMinCm;
          if (typeof merged.depthMaxCm === 'number') depthMaxCm = merged.depthMaxCm;
          if (merged.heightLimitTextTemplate) heightLimitTextTemplate = merged.heightLimitTextTemplate;
          if (merged.depthLimitTextTemplate) depthLimitTextTemplate = merged.depthLimitTextTemplate;
          if (merged.syncHeightInSection === false) syncHeightInSection = false;
          if (merged.showWidth === false) showModuleWidthField = false;
          }
        }

        // Ширина модуля — мин/макс из секции «section_division» в шаге 4 конфигурации.
        const _sectionDivSd = (() => {
          if (config && Array.isArray(config.steps)) {
            const _s4 = config.steps.find((s) => s.stepId === 4);
            return _s4 && _s4.section_division ? _s4.section_division : null;
          }
          return null;
        })();
        // Порог авто-однодверности: < этого значения зона становится single независимо от конфига
        const _singleMaxCm = (() => {
          const raw = _sectionDivSd && Number(_sectionDivSd.single_max_mm);
          return raw > 0 ? raw / 10 : 60;
        })();
        const _singleMinCm = (() => {
          const raw = _sectionDivSd && Number(_sectionDivSd.single_min_mm);
          return raw > 0 ? raw / 10 : 30;
        })();
        const _doubleMinCm = (() => {
          const raw = _sectionDivSd && Number(_sectionDivSd.min_mm);
          return raw > 0 ? raw / 10 : 60;
        })();
        const _doubleMaxCm = (() => {
          const raw = _sectionDivSd && Number(_sectionDivSd.max_mm);
          return raw > 0 ? raw / 10 : 120;
        })();
        /** Общий допустимый ввод: от мин. однодверного до макс. двухдверного (напр. 30–120 см). */
        const _widthOverallMinCm = _singleMinCm;
        const _widthOverallMaxCm = _doubleMaxCm;
        const widthMinCm = _widthOverallMinCm;
        const widthMaxCm = _widthOverallMaxCm;
        const widthCmValueNum =
          actualZoneWidthMm != null
            ? actualZoneWidthMm / 10
            : parseFloat(widthCmText.replace(',', '.')) || widthMinCm;
        const _hasCustomWidth =
          secRef &&
          secRef.division &&
          secRef.division.customZoneWidthsMm &&
          Number.isFinite(Number(secRef.division.customZoneWidthsMm[zoneIndex]));

        const zoneIndexNum = Number(zoneIndex);
        const zoneIndexMatches = (udZi) =>
          Number.isFinite(zoneIndexNum) && Number(udZi) === zoneIndexNum;

        // Найти корпус (модуль) в нужной секции/зоне.
        function findFurnitureInZone(sec) {
          let targetFurniture = null;
          const tryPick = (obj) => {
            if (!obj || !obj.userData) return;
            const ud = obj.userData;
            if (!ud.isFurniture) return;
            if (String(ud.sectionId) !== String(sectionId)) return;
            if (!zoneIndexMatches(ud.zoneIndex)) return;
            targetFurniture = obj;
          };
          if (state.furniture && state.furniture.group) {
            tryPick(state.furniture.group);
          }
          if (!targetFurniture && state.scene) {
            state.scene.traverse((obj) => {
              if (targetFurniture) return;
              tryPick(obj);
            });
          }
          if (targetFurniture) {
            state.selectedFurniture = { group: targetFurniture };
          }
          return targetFurniture;
        }

        function applyModuleDepthCm(newDepthCm) {
          try {
            if (!isFinite(newDepthCm) || newDepthCm <= 0) return false;
            const sec =
              (state.customSections || []).find(
                (s) => String(s.id) === String(sectionId)
              ) || null;
            if (!sec) return false;
            const targetFurniture = findFurnitureInZone(sec);
            if (!targetFurniture) return false;

            const pk = String(targetFurniture.userData?.__placementKind || '').trim();
            if (pk === 'standalone_floor') {
              if (typeof window.__clodisApplyModuleCustomDepthCm !== 'function') {
                console.warn('[MODULE-DEPTH] __clodisApplyModuleCustomDepthCm missing');
                return false;
              }
              const ok = window.__clodisApplyModuleCustomDepthCm(
                targetFurniture,
                sec,
                newDepthCm
              );
              if (!ok) {
                console.warn('[MODULE-DEPTH] rebuild failed', {
                  sectionId,
                  zoneIndex,
                  newDepthCm,
                });
              }
              return ok;
            }

            // Шкаф в нише: uniform-scale по глубине, передний торец на месте (ThreeJS-20).
            const wallName =
              sec.wallName || (sec.division && sec.division.wallName) || 'back';
            const isSide = wallName === 'left' || wallName === 'right';

            const newDepthMm = Math.round(newDepthCm * 10);
            const depthOk = withFurnitureDoorSwingsClosedForMeasure(targetFurniture, () => {
              targetFurniture.updateMatrixWorld(true);
              const savedPos = targetFurniture.position.clone();
              const bboxBefore = __computeGroupBBoxNoAo(targetFurniture);
              const sizeBefore = new THREE.Vector3();
              bboxBefore.getSize(sizeBefore);
              const currentDepthMm = isSide ? sizeBefore.x : sizeBefore.z;
              if (!currentDepthMm || currentDepthMm <= 0) {
                return false;
              }
              const k = newDepthMm / currentDepthMm;
              const scaleBefore = targetFurniture.scale.clone();
              if (isSide) {
                targetFurniture.scale.set(scaleBefore.x * k, scaleBefore.y, scaleBefore.z);
              } else {
                targetFurniture.scale.set(scaleBefore.x, scaleBefore.y, scaleBefore.z * k);
              }
              targetFurniture.updateMatrixWorld(true);
              if (!isSide) {
                const frontOld =
                  wallName === 'back' ? bboxBefore.max.z : bboxBefore.min.z;
                const bboxAfter = __computeGroupBBoxNoAo(targetFurniture);
                const frontNew =
                  wallName === 'back' ? bboxAfter.max.z : bboxAfter.min.z;
                const dz = frontNew - frontOld;
                targetFurniture.position.set(savedPos.x, savedPos.y, savedPos.z - dz);
                targetFurniture.updateMatrixWorld(true);
              } else {
                targetFurniture.position.copy(savedPos);
                targetFurniture.updateMatrixWorld(true);
              }
              return true;
            });
            if (!depthOk) return false;

            targetFurniture.userData = targetFurniture.userData || {};
            targetFurniture.userData.customDepthMm = newDepthMm;
            if (typeof window.recalcFurniturePricingAfterGeometryChange === 'function') {
              window.recalcFurniturePricingAfterGeometryChange();
            }
            return true;
          } catch (e) {
            console.warn('⚠️ Ошибка применения новой глубины модуля:', e);
            return false;
          }
        }

        // Хелпер: применяет кастомную ширину зоны через section-manager.
        function applyModuleWidthCm(newWidthCm) {
          try {
            if (!isFinite(newWidthCm) || newWidthCm <= 0) return;
            if (typeof window.__clodisSetZoneCustomWidthMm !== 'function') {
              console.warn('[ZONE-WIDTH] applyModuleWidthCm: __clodisSetZoneCustomWidthMm missing');
              return;
            }
            const mm = newWidthCm * 10;
            console.log('[ZONE-WIDTH] applyModuleWidthCm', {
              sectionId,
              zoneIndex,
              widthCm: newWidthCm,
              widthMm: mm,
            });
            window.__clodisSetZoneCustomWidthMm(sectionId, zoneIndex, mm);
          } catch (e) {
            console.warn('⚠️ Ошибка применения ширины модуля:', e);
          }
        }

        function applyModuleHeightCm(newHeightCm) {
          try {
            if (!isFinite(newHeightCm) || newHeightCm <= 0) return;
            const sec =
              (state.customSections || []).find(
                (s) => String(s.id) === String(sectionId)
              ) || null;
            if (!sec) return;
            const targetFurniture = findFurnitureInZone(sec);
            if (!targetFurniture) return;
            if (typeof window.__clodisApplyModuleCustomHeightCm !== 'function') {
              console.warn('[MODULE-HEIGHT] __clodisApplyModuleCustomHeightCm missing');
              return;
            }
            const ok = window.__clodisApplyModuleCustomHeightCm(
              targetFurniture,
              sec,
              newHeightCm
            );
            if (!ok) {
              console.warn('[MODULE-HEIGHT] rebuild failed', { sectionId, zoneIndex, newHeightCm });
            }
          } catch (e) {
            console.warn('⚠️ Ошибка применения высоты модуля:', e);
          }
        }

        const showDoorHandField = zoneDoorKind === 'single';

        // Строим «модальное окно модуля» поверх правой панели.
        const overlay = document.getElementById('step4-help-modal-overlay');
        const titleEl = document.getElementById('step4-help-modal-title');
        const contentEl = document.getElementById('step4-help-modal-content');
        const okBtn = document.getElementById('step4-help-modal-ok');
        if (overlay && contentEl) {
          const modalEl = overlay.querySelector('.step4-help-modal');
          if (modalEl) modalEl.classList.add('step4-help-modal--module-edit');
          if (titleEl) {
            titleEl.textContent = title || 'Настройка модуля';
            titleEl.style.display = 'none';
          }
          if (okBtn) okBtn.style.display = 'none';

          // Clodis presentation only — те же id полей и handlers.
          const depthText = bodyText || '';
          const panelTitle = String(title || 'Настройка модуля').replace(/</g, '&lt;');
          const initialDepthCmForModal = Math.min(
            Math.max(
              parseFloat(String(depthCmText).replace(',', '.')) || depthMinCm,
              depthMinCm
            ),
            depthMaxCm
          );
          const initialHeightCmForModal = Math.min(
            Math.max(
              parseFloat(String(heightCmText).replace(',', '.')) || heightMinCm,
              heightMinCm
            ),
            heightMaxCm
          );
          const initialFloorClearanceCmForModal = Math.min(
            Math.max(
              parseFloat(String(floorClearanceCmText).replace(',', '.')) || floorClearanceMinCm,
              floorClearanceMinCm
            ),
            floorClearanceMaxCm
          );
          const heightCmValueNum =
            parseFloat(String(heightCmText).replace(',', '.')) || initialHeightCmForModal;
          contentEl.innerHTML = `
            <div class="cld-module-edit">
              <div class="cld-module-edit__header">
                <h3 class="cld-module-edit__title">${panelTitle}</h3>
                <button type="button" class="cld-module-edit__close" id="step4-module-close-btn" aria-label="Закрыть" title="Закрыть">
                  <i class="fas fa-times" aria-hidden="true"></i>
                </button>
              </div>
              <div class="cld-module-edit__body">
                <div class="cld-module-edit__field">
                  <div class="cld-module-edit__label-row">
                    <label class="cld-module-edit__label" for="step4-module-depth-input">Глубина модуля</label>
                    ${
                      bodyText
                        ? '<span id="step4-module-depth-help" title="Подсказка" style="position:relative;width:18px;height:18px;border-radius:50%;border:1px solid #D0D0D0;display:inline-flex;align-items:center;justify-content:center;font-size:12px;color:#777;cursor:help;margin-left:auto;">?</span>'
                        : ''
                    }
                  </div>
                  <div class="cld-module-edit__input-wrap">
                    <span id="step4-module-depth-valid-indicator" class="cld-module-edit__validity" data-field-state="valid" aria-hidden="true"></span>
                    <input
                      id="step4-module-depth-input"
                      class="cld-module-edit__input"
                      type="number"
                      step="0.1"
                      min="${depthMinCm}"
                      max="${depthMaxCm}"
                      value="${initialDepthCmForModal}"
                    />
                    <span class="cld-module-edit__unit">см</span>
                  </div>
                  ${
                    depthText
                      ? `<div class="cld-module-edit__hint">${depthText.replace(/</g, '&lt;')}</div>`
                      : ''
                  }
                </div>
                ${
                  isStandaloneFloorModule
                    ? `
                <div class="cld-module-edit__field">
                  <label class="cld-module-edit__label" for="step4-module-height-input">Высота модуля</label>
                  <div class="cld-module-edit__input-wrap" style="margin-top:8px;">
                    <span id="step4-module-height-valid-indicator" class="cld-module-edit__validity" data-field-state="valid" aria-hidden="true"></span>
                    <input
                      id="step4-module-height-input"
                      class="cld-module-edit__input"
                      type="number"
                      step="0.1"
                      min="${heightMinCm}"
                      max="${heightMaxCm}"
                      value="${initialHeightCmForModal}"
                    />
                    <span class="cld-module-edit__unit">см</span>
                  </div>
                </div>
                `
                    : ''
                }
                ${
                  showFloorClearanceField
                    ? `
                <div class="cld-module-edit__field">
                  <label class="cld-module-edit__label" for="step4-module-floor-clearance-input">Отступ от пола</label>
                  <div class="cld-module-edit__input-wrap" style="margin-top:8px;">
                    <span id="step4-module-floor-clearance-valid-indicator" class="cld-module-edit__validity" data-field-state="valid" aria-hidden="true"></span>
                    <input
                      id="step4-module-floor-clearance-input"
                      class="cld-module-edit__input"
                      type="number"
                      step="0.1"
                      min="${floorClearanceMinCm}"
                      max="${floorClearanceMaxCm}"
                      value="${initialFloorClearanceCmForModal}"
                    />
                    <span class="cld-module-edit__unit">см</span>
                  </div>
                </div>
                `
                    : ''
                }
                ${
                  showModuleWidthField
                    ? `
                <div class="cld-module-edit__field">
                  <div class="cld-module-edit__label-row">
                    <label class="cld-module-edit__label" for="step4-module-width-input">Ширина модуля</label>
                    <button type="button" id="step4-width-reset-btn" class="cld-module-edit__reset" title="Сбросить к авто (равномерное деление)" style="${_hasCustomWidth ? '' : 'opacity:0.45;'}">Сбросить</button>
                  </div>
                  <div class="cld-module-edit__input-wrap">
                    <span id="step4-module-width-valid-indicator" class="cld-module-edit__validity" data-field-state="valid" aria-hidden="true"></span>
                    <input
                      id="step4-module-width-input"
                      class="cld-module-edit__input"
                      type="number"
                      step="0.1"
                      min="${widthMinCm}"
                      max="${widthMaxCm}"
                      value="${widthCmValueNum.toFixed(1)}"
                    />
                    <span class="cld-module-edit__unit">см</span>
                  </div>
                </div>
                `
                    : ''
                }
                ${
                  showDoorHandField
                    ? `
                <div class="cld-module-edit__field">
                  <div class="cld-module-edit__label">Открывание двери</div>
                  <div id="step4-module-hand-row" class="cld-module-edit__segment" style="margin-top:8px;">
                    <button type="button" class="step4-module-hand-btn${moduleZoneHand === 'left' ? ' is-selected' : ''}" data-hand="left">Левая</button>
                    <button type="button" class="step4-module-hand-btn${moduleZoneHand === 'right' ? ' is-selected' : ''}" data-hand="right">Правая</button>
                  </div>
                  <div class="cld-module-edit__hint">Петли и распашка фасада</div>
                </div>
                `
                    : ''
                }
                <button type="button" id="step4-module-delete-btn" class="cld-module-edit__delete">
                  <i class="fas fa-trash-alt" aria-hidden="true"></i>
                  <span>Удалить модуль</span>
                </button>
              </div>
              <div class="cld-module-edit__footer">
                <button type="button" id="step4-module-save-btn" class="cld-module-edit__save">Сохранить</button>
              </div>
            </div>
          `;

          overlay.style.display = 'flex';
          overlay.classList.add('step4-help-modal-overlay--module-edit');
          window.__cldEditingModuleZone = { sectionId, zoneIndex };
          syncSectionZoneEditIconsActive();
          try {
            applyModuleEditFocusFog(sectionId, zoneIndex, furnitureGroup);
          } catch (e) {
            console.warn('[MODULE-FOCUS] apply failed', e);
          }

          function closeModal() {
            overlay.style.display = 'none';
            overlay.classList.remove('step4-help-modal-overlay--module-edit');
            if (modalEl) modalEl.classList.remove('step4-help-modal--module-edit');
            if (titleEl) titleEl.style.display = '';
            if (okBtn) okBtn.style.display = '';
            window.__cldEditingModuleZone = null;
            syncSectionZoneEditIconsActive();
            try {
              clearModuleEditFocusFog();
            } catch (e) {
              console.warn('[MODULE-FOCUS] clear failed', e);
            }
          }
          const closeBtn = document.getElementById('step4-module-close-btn');
          if (closeBtn && !closeBtn._zoneEditBound) {
            closeBtn._zoneEditBound = true;
            closeBtn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              closeModal();
            });
          }
          const saveBtn = document.getElementById('step4-module-save-btn');
          const delBtn = document.getElementById('step4-module-delete-btn');
          const helpIcon = document.getElementById('step4-module-depth-help');
          if (helpIcon && bodyText && !helpIcon._zoneEditBound) {
            helpIcon._zoneEditBound = true;
            const tooltip = document.createElement('div');
            tooltip.className = 'step4-module-depth-tooltip';
            tooltip.textContent = bodyText;
            Object.assign(tooltip.style, {
              position: 'absolute',
              top: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              // Делаем тултип заметно уже основного попапа, чтобы текст не обрезался по краям
              width: '280px',
              background: 'white',
              borderRadius: '6px',
              padding: '8px 12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              fontSize: '12px',
              color: '#444',
              lineHeight: '1.4',
              /* Поверх модального окна и любых иконок сцены */
              zIndex: '21000',
              display: 'none',
              border: '1px solid #e0e0e0',
            });
            helpIcon.appendChild(tooltip);
            let hideTimer = null;
            const showTip = () => {
              if (hideTimer) {
                clearTimeout(hideTimer);
                hideTimer = null;
              }
              tooltip.style.display = 'block';
            };
            const scheduleHide = () => {
              hideTimer = setTimeout(() => {
                tooltip.style.display = 'none';
                hideTimer = null;
              }, 120);
            };
            helpIcon.addEventListener('mouseenter', showTip);
            helpIcon.addEventListener('mouseleave', scheduleHide);
            tooltip.addEventListener('mouseenter', showTip);
            tooltip.addEventListener('mouseleave', scheduleHide);
          }
          // Инпут глубины: при наборе — только индикатор (круг); попап — при явно недопустимом значении.
          const depthInput = document.getElementById('step4-module-depth-input');

          function _normalizeNumRaw(raw) {
            return String(raw == null ? '' : raw).trim().replace(',', '.');
          }

          function _isIncompleteNumericRaw(raw) {
            const s = _normalizeNumRaw(raw);
            return !s || s === '-' || s === '.' || s.endsWith('.');
          }

          /** Можно ли дописать цифру и попасть в [min, max] (напр. «6» → «60»). */
          function _canBecomeValidInRange(val, min, max, maxExtraDigits = 2) {
            if (!Number.isFinite(val) || !Number.isFinite(min) || !Number.isFinite(max)) return false;
            if (val >= min && val <= max) return false;
            const base = String(val);
            if (!base || base.indexOf('.') >= 0) return false;
            let prefixes = [base];
            for (let extra = 0; extra < maxExtraDigits; extra++) {
              const next = [];
              for (const p of prefixes) {
                for (let d = 0; d <= 9; d++) next.push(p + String(d));
              }
              for (const candidate of next) {
                const n = parseFloat(candidate);
                if (Number.isFinite(n) && n >= min && n <= max) return true;
              }
              prefixes = next;
            }
            return false;
          }

          function setFieldValidityIndicator(indicatorId, state, fieldKind = 'depth') {
            const el = document.getElementById(indicatorId);
            if (!el) return;
            const ok = state === 'valid';
            el.dataset.fieldState = ok ? 'valid' : 'invalid';
            el.setAttribute('aria-hidden', 'true');
            el.style.display = 'none';
            // Visual status dots removed (Clodis) — validation state still stored for handlers.
            void fieldKind;
          }

          function _formatCmRestore(val) {
            return Number.isFinite(val) ? Number(val).toFixed(1) : '';
          }

          let limitModalRestore = null;

          function assessDepthInput(raw, val) {
            const s = _normalizeNumRaw(raw);
            if (_isIncompleteNumericRaw(s) || !Number.isFinite(val)) {
              return { state: 'pending', showModal: false, reason: 'range' };
            }
            if (val <= 0) {
              return { state: 'invalid', showModal: true, reason: 'range' };
            }
            if (val < depthMinCm) {
              if (_canBecomeValidInRange(val, depthMinCm, depthMaxCm)) {
                return { state: 'pending', showModal: false, reason: 'range' };
              }
              return { state: 'invalid', showModal: true, reason: 'range' };
            }
            if (val > depthMaxCm) {
              if (_canBecomeValidInRange(val, depthMinCm, depthMaxCm)) {
                return { state: 'pending', showModal: false, reason: 'range' };
              }
              return { state: 'invalid', showModal: true, reason: 'range' };
            }
            if (sectionDepthCm != null && val > sectionDepthCm + 0.05) {
              return { state: 'invalid', showModal: true, reason: 'section' };
            }
            return { state: 'valid', showModal: false, reason: 'range' };
          }

          function assessHeightInput(raw, val) {
            const s = _normalizeNumRaw(raw);
            if (_isIncompleteNumericRaw(s) || !Number.isFinite(val)) {
              return { state: 'pending', showModal: false, reason: 'heightRange' };
            }
            if (val <= 0) {
              return { state: 'invalid', showModal: true, reason: 'heightRange' };
            }
            if (val < heightMinCm) {
              if (_canBecomeValidInRange(val, heightMinCm, heightMaxCm)) {
                return { state: 'pending', showModal: false, reason: 'heightRange' };
              }
              return { state: 'invalid', showModal: true, reason: 'heightRange' };
            }
            if (val > heightMaxCm) {
              if (_canBecomeValidInRange(val, heightMinCm, heightMaxCm)) {
                return { state: 'pending', showModal: false, reason: 'heightRange' };
              }
              return { state: 'invalid', showModal: true, reason: 'heightRange' };
            }
            return { state: 'valid', showModal: false, reason: 'heightRange' };
          }

          function assessFloorClearanceInput(raw, val) {
            const s = _normalizeNumRaw(raw);
            if (_isIncompleteNumericRaw(s) || !Number.isFinite(val)) {
              return { state: 'pending', showModal: false, reason: 'floorClearanceRange' };
            }
            if (val < 0) {
              return { state: 'invalid', showModal: true, reason: 'floorClearanceRange' };
            }
            if (val < floorClearanceMinCm) {
              if (_canBecomeValidInRange(val, floorClearanceMinCm, floorClearanceMaxCm)) {
                return { state: 'pending', showModal: false, reason: 'floorClearanceRange' };
              }
              return { state: 'invalid', showModal: true, reason: 'floorClearanceRange' };
            }
            if (val > floorClearanceMaxCm) {
              if (_canBecomeValidInRange(val, floorClearanceMinCm, floorClearanceMaxCm)) {
                return { state: 'pending', showModal: false, reason: 'floorClearanceRange' };
              }
              return { state: 'invalid', showModal: true, reason: 'floorClearanceRange' };
            }
            return { state: 'valid', showModal: false, reason: 'floorClearanceRange' };
          }

          function assessWidthInput(raw, val) {
            const s = _normalizeNumRaw(raw);
            if (_isIncompleteNumericRaw(s) || !Number.isFinite(val)) {
              return { state: 'pending', showModal: false, reason: 'widthRange' };
            }
            if (val <= 0) {
              return { state: 'invalid', showModal: true, reason: 'widthRange' };
            }
            if (val < _widthOverallMinCm || val > _widthOverallMaxCm) {
              if (_canBecomeValidInRange(val, _widthOverallMinCm, _widthOverallMaxCm)) {
                return { state: 'pending', showModal: false, reason: 'widthRange' };
              }
              return { state: 'invalid', showModal: true, reason: 'widthRange' };
            }
            const willBeSingle = val < _doubleMinCm;
            if (willBeSingle) {
              if (val < _singleMinCm) {
                if (_canBecomeValidInRange(val, _singleMinCm, Math.min(_doubleMinCm - 0.01, _widthOverallMaxCm))) {
                  return { state: 'pending', showModal: false, reason: 'widthRange' };
                }
                return { state: 'invalid', showModal: true, reason: 'widthRange' };
              }
            } else if (val > _doubleMaxCm) {
              if (_canBecomeValidInRange(val, _doubleMinCm, _doubleMaxCm)) {
                return { state: 'pending', showModal: false, reason: 'widthRange' };
              }
              return { state: 'invalid', showModal: true, reason: 'widthRange' };
            }
            return { state: 'valid', showModal: false, reason: 'widthRange' };
          }

          function showDepthLimitModal(reason, restore) {
            let text = '';
            if (reason === 'section') {
              if (depthOverSectionTextTemplate && depthOverSectionTextTemplate.trim()) {
                text = depthOverSectionTextTemplate;
                if (sectionDepthCm != null) {
                  text = text.replace(/\{SECTION\}/g, String(sectionDepthCm));
                }
              }
            } else if (reason === 'widthRange') {
              if (widthLimitTextTemplate && widthLimitTextTemplate.trim()) {
                text = widthLimitTextTemplate
                  .replace(/\{MIN\}/g, String(_widthOverallMinCm))
                  .replace(/\{MAX\}/g, String(_widthOverallMaxCm));
              }
            } else if (reason === 'heightRange') {
              if (heightLimitTextTemplate && heightLimitTextTemplate.trim()) {
                text = heightLimitTextTemplate
                  .replace(/\{MIN\}/g, String(heightMinCm))
                  .replace(/\{MAX\}/g, String(heightMaxCm));
              }
            } else if (reason === 'floorClearanceRange') {
              text =
                `Введённый отступ от пола выходит за допустимые пределы. ` +
                `Выберите значение от ${floorClearanceMinCm} до ${floorClearanceMaxCm} см.`;
            } else if (depthLimitTextTemplate && depthLimitTextTemplate.trim()) {
              text = depthLimitTextTemplate
                .replace(/\{MIN\}/g, String(depthMinCm))
                .replace(/\{MAX\}/g, String(depthMaxCm));
            }
            if (!text || !text.trim()) return;
            let overlay = document.getElementById('depth-limit-modal-overlay');
            if (!overlay) {
              overlay = document.createElement('div');
              overlay.id = 'depth-limit-modal-overlay';
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
              box.id = 'depth-limit-modal-box';
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
              textEl.id = 'depth-limit-modal-text';
              textEl.style.fontSize = '14px';
              textEl.style.color = '#333';
              textEl.style.lineHeight = '1.5';
              textEl.style.marginBottom = '20px';
              box.appendChild(textEl);
              const btn = document.createElement('button');
              btn.id = 'depth-limit-modal-ok';
              btn.type = 'button';
              btn.textContent = 'Хорошо, я понял';
              Object.assign(btn.style, {
                borderRadius: '999px',
                border: 'none',
                background: '#1976d2',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                padding: '8px 22px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              });
              btn.addEventListener('click', () => {
                overlay.style.display = 'none';
                if (limitModalRestore) {
                  const inp = document.getElementById(limitModalRestore.inputId);
                  if (inp) {
                    inp.value = _formatCmRestore(limitModalRestore.value);
                  }
                  if (limitModalRestore.indicatorId) {
                    setFieldValidityIndicator(
                      limitModalRestore.indicatorId,
                      'valid',
                      limitModalRestore.fieldKind || 'depth'
                    );
                  }
                  limitModalRestore = null;
                }
              });
              box.appendChild(btn);
              overlay.appendChild(box);
              document.body.appendChild(overlay);
            }
            const textElExisting = document.getElementById('depth-limit-modal-text');
            if (textElExisting) {
              textElExisting.textContent = text;
            }
            limitModalRestore = restore || null;
            overlay.style.display = 'flex';
          }

          const widthInput = document.getElementById('step4-module-width-input');
          const LIVE_APPLY_MS = 500;
          const DEPTH_UNCHANGED_EPS_CM = 0.12;
          const HEIGHT_UNCHANGED_EPS_CM = 0.12;
          const WIDTH_CHANGED_EPS_CM = 0.015;
          let appliedDepthCm = initialDepthCmForModal;
          let appliedHeightCm = initialHeightCmForModal;
          let appliedFloorClearanceCm = initialFloorClearanceCmForModal;
          let appliedWidthCm = widthCmValueNum;
          let appliedZoneHand = moduleZoneHand;
          /** null — ещё не спрашивали; true — ко всем; false — только этот модуль */
          let heightSyncAllDecision = null;
          let heightSyncConfirmOpen = false;
          let floorClrSyncAllDecision = null;
          let floorClrSyncConfirmOpen = false;

          function flushStandaloneDepthHeightResize(syncCategoryHeight) {
            if (!isStandaloneFloorModule) return;
            const sec =
              (state.customSections || []).find(
                (s) => String(s.id) === String(sectionId)
              ) || null;
            if (!sec) return;
            const tf = findFurnitureInZone(sec);
            if (syncCategoryHeight && tf) {
              const catalogType =
                tf.userData?.catalogType != null
                  ? String(tf.userData.catalogType).trim()
                  : null;
              const heightMm = Number(tf.userData?.customHeightMm) || 0;
              if (
                heightMm > 0 &&
                typeof window.__clodisSyncStandaloneCategoryHeight === 'function'
              ) {
                window.__clodisSyncStandaloneCategoryHeight(
                  sec,
                  catalogType,
                  heightMm,
                  tf.userData?.__placementKind || null
                );
                console.log('[MODULE-RESIZE][LIVE] category height synced', {
                  sectionId,
                  catalogType,
                  heightMm,
                  placementKind: tf.userData?.__placementKind || null,
                });
                return;
              }
            }
            if (typeof window.__clodisUpdateFurnitureInSection === 'function') {
              window.__clodisUpdateFurnitureInSection(sec);
            }
            if (typeof window.__clodisScheduleTrimRebuildAfterFurnitureGeometry === 'function') {
              window.__clodisScheduleTrimRebuildAfterFurnitureGeometry(sec);
            } else {
              try {
                if (typeof window.__clodisRebuildTrimAfterFurnitureGeometry === 'function') {
                  window.__clodisRebuildTrimAfterFurnitureGeometry();
                } else if (typeof window.__clodisRebuildAllTransitions === 'function') {
                  window.__clodisRebuildAllTransitions();
                }
              } catch (e) {
                console.warn('[MODULE-RESIZE][LIVE] trim/transitions rebuild failed', e);
              }
            }
            try {
              if (typeof window.refreshAllHingeRoleMarkersInRoom === 'function') {
                window.refreshAllHingeRoleMarkersInRoom();
              }
            } catch (_) {}
            try {
              if (typeof window.recalcFurniturePricingAfterGeometryChange === 'function') {
                window.recalcFurniturePricingAfterGeometryChange();
              }
            } catch (_) {}
          }

          function tryApplyDepthVal(val, opts = {}) {
            const raw = opts.raw != null ? opts.raw : String(val);
            const showModal = opts.showModal !== false;
            const assess = assessDepthInput(raw, val);
            if (assess.state === 'pending') return opts.allowPending === true;
            if (assess.state === 'invalid') {
              if (showModal) {
                showDepthLimitModal(assess.reason, {
                  inputId: 'step4-module-depth-input',
                  indicatorId: 'step4-module-depth-valid-indicator',
                  fieldKind: 'depth',
                  value: appliedDepthCm,
                });
              }
              return false;
            }
            if (
              !isFinite(val) ||
              (isFinite(appliedDepthCm) && Math.abs(val - appliedDepthCm) < DEPTH_UNCHANGED_EPS_CM)
            ) {
              return true;
            }
            const sec =
              (state.customSections || []).find(
                (s) => String(s.id) === String(sectionId)
              ) || null;
            const tf = sec ? findFurnitureInZone(sec) : null;
            if (!tf) return false;
            if (!applyModuleDepthCm(val)) return false;
            appliedDepthCm = val;
            console.log('[MODULE-RESIZE][LIVE] depth', { val, sectionId, zoneIndex: zoneIndexNum });
            return true;
          }

          function tryApplyHeightVal(hRaw, opts = {}) {
            if (!isStandaloneFloorModule) return true;
            const raw = opts.raw != null ? opts.raw : String(hRaw);
            const showModal = opts.showModal !== false;
            const assess = assessHeightInput(raw, hRaw);
            if (assess.state === 'pending') return opts.allowPending === true;
            if (assess.state === 'invalid') {
              if (showModal) {
                showDepthLimitModal(assess.reason, {
                  inputId: 'step4-module-height-input',
                  indicatorId: 'step4-module-height-valid-indicator',
                  fieldKind: 'height',
                  value: appliedHeightCm,
                });
              }
              return false;
            }
            if (
              !isFinite(hRaw) ||
              (isFinite(appliedHeightCm) &&
                Math.abs(hRaw - appliedHeightCm) < HEIGHT_UNCHANGED_EPS_CM)
            ) {
              return true;
            }
            const sec =
              (state.customSections || []).find(
                (s) => String(s.id) === String(sectionId)
              ) || null;
            const tf = sec ? findFurnitureInZone(sec) : null;
            if (!tf) return false;
            tf.userData = tf.userData || {};
            tf.userData.customHeightMm = Math.round(hRaw * 10);
            if (typeof window.__clodisApplyModuleCustomHeightCm === 'function') {
              window.__clodisApplyModuleCustomHeightCm(tf, sec, hRaw);
            }

            const targets =
              typeof window.__cldCountStandaloneHeightSyncTargets === 'function'
                ? window.__cldCountStandaloneHeightSyncTargets(sec, tf)
                : { others: 0, catalogType: null, total: 1 };

            const heightMm = Math.round(hRaw * 10);

            const applyHeightToAllInCatalog = () => {
              if (typeof window.__clodisSyncStandaloneCategoryHeight === 'function') {
                window.__clodisSyncStandaloneCategoryHeight(
                  sec,
                  targets.catalogType,
                  heightMm,
                  targets.placementKind || tf.userData?.__placementKind || null
                );
              } else {
                flushStandaloneDepthHeightResize(true);
              }
            };

            const applyHeightToCurrentOnly = () => {
              flushStandaloneDepthHeightResize(false);
            };

            const finishHeightApply = () => {
              appliedHeightCm = hRaw;
              console.log('[MODULE-RESIZE][LIVE] height', {
                hRaw,
                sectionId,
                zoneIndex: zoneIndexNum,
                syncAll: heightSyncAllDecision,
                others: targets.others,
              });
            };

            if ((targets.others || 0) <= 0) {
              applyHeightToAllInCatalog();
              finishHeightApply();
              return true;
            }
            if (!syncHeightInSection) {
              applyHeightToCurrentOnly();
              finishHeightApply();
              return true;
            }

            if (heightSyncAllDecision === true) {
              applyHeightToAllInCatalog();
              finishHeightApply();
              return true;
            }
            if (heightSyncAllDecision === false) {
              applyHeightToCurrentOnly();
              finishHeightApply();
              return true;
            }

            if (heightSyncConfirmOpen) {
              finishHeightApply();
              return true;
            }

            applyHeightToCurrentOnly();
            heightSyncConfirmOpen = true;
            showStandaloneHeightSyncConfirmModal(targets.others, hRaw, (yes) => {
              heightSyncConfirmOpen = false;
              heightSyncAllDecision = yes;
              if (yes) {
                applyHeightToAllInCatalog();
              }
              finishHeightApply();
            });
            return true;
          }

          function tryApplyFloorClearanceVal(cRaw, opts = {}) {
            if (!showFloorClearanceField) return true;
            const raw = opts.raw != null ? opts.raw : String(cRaw);
            const showModal = opts.showModal !== false;
            const assess = assessFloorClearanceInput(raw, cRaw);
            if (assess.state === 'pending') return opts.allowPending === true;
            if (assess.state === 'invalid') {
              if (showModal) {
                showDepthLimitModal(assess.reason, {
                  inputId: 'step4-module-floor-clearance-input',
                  indicatorId: 'step4-module-floor-clearance-valid-indicator',
                  fieldKind: 'floorClearance',
                  value: appliedFloorClearanceCm,
                });
              }
              return false;
            }
            if (
              !isFinite(cRaw) ||
              (isFinite(appliedFloorClearanceCm) &&
                Math.abs(cRaw - appliedFloorClearanceCm) < HEIGHT_UNCHANGED_EPS_CM)
            ) {
              return true;
            }
            const sec =
              (state.customSections || []).find(
                (s) => String(s.id) === String(sectionId)
              ) || null;
            const tf = sec ? findFurnitureInZone(sec) : null;
            if (!tf) return false;

            if (typeof window.__clodisApplyModuleFloorClearanceCm === 'function') {
              window.__clodisApplyModuleFloorClearanceCm(tf, sec, cRaw);
            } else {
              tf.userData = tf.userData || {};
              tf.userData.customFloorClearanceMm = Math.round(cRaw * 10);
            }

            const targets =
              typeof window.__cldCountStandaloneHeightSyncTargets === 'function'
                ? window.__cldCountStandaloneHeightSyncTargets(sec, tf)
                : { others: 0, catalogType: null, total: 1 };

            const clearanceMm = Math.round(cRaw * 10);

            const applyClrToAll = () => {
              if (typeof window.__clodisSyncWallHungFloorClearance === 'function') {
                window.__clodisSyncWallHungFloorClearance(
                  sec,
                  targets.catalogType,
                  clearanceMm,
                  targets.placementKind || tf.userData?.__placementKind || 'wall_hung_low'
                );
              }
            };

            const applyClrToCurrentOnly = () => {
              if (typeof window.__clodisApplyModuleFloorClearanceCm === 'function') {
                window.__clodisApplyModuleFloorClearanceCm(tf, sec, cRaw);
              }
              if (typeof window.__clodisScheduleTrimRebuildAfterFurnitureGeometry === 'function') {
                window.__clodisScheduleTrimRebuildAfterFurnitureGeometry(sec);
              }
            };

            const finishClrApply = () => {
              appliedFloorClearanceCm = cRaw;
              console.log('[MODULE-RESIZE][LIVE] floorClearance', {
                cRaw,
                sectionId,
                zoneIndex: zoneIndexNum,
                syncAll: floorClrSyncAllDecision,
                others: targets.others,
              });
            };

            if ((targets.others || 0) <= 0) {
              applyClrToAll();
              finishClrApply();
              return true;
            }
            if (!syncHeightInSection) {
              applyClrToCurrentOnly();
              finishClrApply();
              return true;
            }

            if (floorClrSyncAllDecision === true) {
              applyClrToAll();
              finishClrApply();
              return true;
            }
            if (floorClrSyncAllDecision === false) {
              applyClrToCurrentOnly();
              finishClrApply();
              return true;
            }

            if (floorClrSyncConfirmOpen) {
              finishClrApply();
              return true;
            }

            applyClrToCurrentOnly();
            floorClrSyncConfirmOpen = true;
            showStandaloneHeightSyncConfirmModal(
              targets.others,
              cRaw,
              (yes) => {
                floorClrSyncConfirmOpen = false;
                floorClrSyncAllDecision = yes;
                if (yes) applyClrToAll();
                finishClrApply();
              },
              { fieldWhat: 'отступ от пола', fieldTitle: 'Отступ' }
            );
            return true;
          }

          function tryApplyWidthVal(wRaw, opts = {}) {
            const raw = opts.raw != null ? opts.raw : String(wRaw);
            const showModal = opts.showModal !== false;
            const assess = assessWidthInput(raw, wRaw);
            if (assess.state === 'pending') return opts.allowPending === true;
            if (assess.state === 'invalid') {
              if (showModal) {
                showDepthLimitModal(assess.reason, {
                  inputId: 'step4-module-width-input',
                  indicatorId: 'step4-module-width-valid-indicator',
                  fieldKind: 'width',
                  value: appliedWidthCm,
                });
              }
              return false;
            }
            if (
              !isFinite(wRaw) ||
              wRaw <= 0 ||
              (isFinite(appliedWidthCm) && Math.abs(wRaw - appliedWidthCm) <= WIDTH_CHANGED_EPS_CM)
            ) {
              return true;
            }
            applyModuleWidthCm(wRaw);
            appliedWidthCm = wRaw;
            console.log('[MODULE-RESIZE][LIVE] width', { wRaw, sectionId, zoneIndex: zoneIndexNum });
            return true;
          }

          function _bindNumericFieldInput(inputEl, assessFn, applyFn, indicatorId, fieldKind, getApplied) {
            if (!inputEl) return;
            let liveTimer = null;
            inputEl.oninput = () => {
              if (inputEl.value.indexOf(',') !== -1) {
                inputEl.value = inputEl.value.replace(',', '.');
              }
              const raw = inputEl.value;
              const v = parseFloat(raw);
              const assess = assessFn(raw, v);
              setFieldValidityIndicator(indicatorId, assess.state, fieldKind);
              if (liveTimer) clearTimeout(liveTimer);
              liveTimer = setTimeout(() => {
                const raw2 = inputEl.value;
                const v2 = parseFloat(_normalizeNumRaw(raw2));
                const a2 = assessFn(raw2, v2);
                setFieldValidityIndicator(indicatorId, a2.state, fieldKind);
                if (a2.state === 'valid') {
                  applyFn(v2, { raw: raw2, showModal: false });
                } else if (a2.showModal) {
                  showDepthLimitModal(a2.reason, {
                    inputId: inputEl.id,
                    indicatorId,
                    fieldKind,
                    value: getApplied(),
                  });
                }
              }, LIVE_APPLY_MS);
            };
          }

          function updateDoorHandButtonsUi(activeHand) {
            document.querySelectorAll('.step4-module-hand-btn').forEach((btn) => {
              const h = String(btn.getAttribute('data-hand') || '');
              const on = h === activeHand;
              btn.classList.toggle('is-selected', on);
              btn.style.background = '';
              btn.style.color = '';
            });
          }

          function tryApplyZoneHand(hand, opts = {}) {
            if (!showDoorHandField) return true;
            const zh = String(hand || '').toLowerCase() === 'right' ? 'right' : 'left';
            if (zh === appliedZoneHand) return true;
            const sec =
              (state.customSections || []).find(
                (s) => String(s.id) === String(sectionId)
              ) || null;
            const tf = sec ? findFurnitureInZone(sec) : null;
            if (!tf) return false;
            if (typeof window.__clodisApplyModuleZoneHand !== 'function') {
              console.warn('[MODULE-HAND] __clodisApplyModuleZoneHand missing');
              return false;
            }
            const ok = window.__clodisApplyModuleZoneHand(tf, sec, zh);
            if (ok) {
              appliedZoneHand = zh;
              updateDoorHandButtonsUi(zh);
              console.log('[MODULE-HAND] applied', { sectionId, zoneIndex: zoneIndexNum, zoneHand: zh });
            }
            return ok;
          }

          document.querySelectorAll('.step4-module-hand-btn').forEach((btn) => {
            if (btn._zoneHandBound) return;
            btn._zoneHandBound = true;
            btn.addEventListener('click', () => {
              const hand = btn.getAttribute('data-hand') || 'left';
              tryApplyZoneHand(hand);
            });
          });

          if (widthInput) {
            _bindNumericFieldInput(
              widthInput,
              assessWidthInput,
              tryApplyWidthVal,
              'step4-module-width-valid-indicator',
              'width',
              () => appliedWidthCm
            );
          }
          // кнопка «сбросить» для ширины
          const widthResetBtnEl = document.getElementById('step4-width-reset-btn');
          if (widthResetBtnEl && !widthResetBtnEl._zoneEditBound) {
            widthResetBtnEl._zoneEditBound = true;
            widthResetBtnEl.addEventListener('click', () => {
              if (typeof window.__clodisSetZoneCustomWidthMm === 'function') {
                window.__clodisSetZoneCustomWidthMm(sectionId, zoneIndex, 0);
              }
              closeModal();
            });
          }

          const heightInput = document.getElementById('step4-module-height-input');
          if (heightInput) {
            _bindNumericFieldInput(
              heightInput,
              assessHeightInput,
              tryApplyHeightVal,
              'step4-module-height-valid-indicator',
              'height',
              () => appliedHeightCm
            );
          }

          const floorClrInput = document.getElementById('step4-module-floor-clearance-input');
          if (floorClrInput) {
            _bindNumericFieldInput(
              floorClrInput,
              assessFloorClearanceInput,
              tryApplyFloorClearanceVal,
              'step4-module-floor-clearance-valid-indicator',
              'floorClearance',
              () => appliedFloorClearanceCm
            );
          }

          if (depthInput) {
            _bindNumericFieldInput(
              depthInput,
              assessDepthInput,
              tryApplyDepthVal,
              'step4-module-depth-valid-indicator',
              'depth',
              () => appliedDepthCm
            );
          }

          function commitModuleZoneEditSave() {
            const depthInputEl = document.getElementById('step4-module-depth-input');
            const heightInputEl = document.getElementById('step4-module-height-input');
            const floorClrInputEl = document.getElementById(
              'step4-module-floor-clearance-input'
            );
            const widthInputEl = document.getElementById('step4-module-width-input');
            const dRaw = depthInputEl ? depthInputEl.value : '';
            const hRaw = heightInputEl ? heightInputEl.value : '';
            const cRaw = floorClrInputEl ? floorClrInputEl.value : '';
            const wRaw = widthInputEl ? widthInputEl.value : '';
            const dVal = parseFloat(_normalizeNumRaw(dRaw));
            const hVal = parseFloat(_normalizeNumRaw(hRaw));
            const cVal = parseFloat(_normalizeNumRaw(cRaw));
            const wVal = parseFloat(_normalizeNumRaw(wRaw));
            const dAssess = assessDepthInput(dRaw, dVal);
            const hAssess = assessHeightInput(hRaw, hVal);
            const cAssess = assessFloorClearanceInput(cRaw, cVal);
            const wAssess = assessWidthInput(wRaw, wVal);
            setFieldValidityIndicator('step4-module-depth-valid-indicator', dAssess.state, 'depth');
            if (heightInputEl) {
              setFieldValidityIndicator('step4-module-height-valid-indicator', hAssess.state, 'height');
            }
            if (floorClrInputEl) {
              setFieldValidityIndicator(
                'step4-module-floor-clearance-valid-indicator',
                cAssess.state,
                'floorClearance'
              );
            }
            if (widthInputEl) {
              setFieldValidityIndicator('step4-module-width-valid-indicator', wAssess.state, 'width');
            }
            if (!tryApplyDepthVal(dVal, { raw: dRaw })) return;
            if (!tryApplyHeightVal(hVal, { raw: hRaw })) return;
            if (!tryApplyFloorClearanceVal(cVal, { raw: cRaw })) return;
            if (!tryApplyWidthVal(wVal, { raw: wRaw })) return;
            if (!tryApplyZoneHand(appliedZoneHand)) return;
            const secAfter =
              (state.customSections || []).find(
                (s) => String(s.id) === String(sectionId)
              ) || null;
            const tfAfter = secAfter ? findFurnitureInZone(secAfter) : null;
            if (
              tfAfter &&
              !isStandaloneFloorModule &&
              Number(tfAfter.userData?.customDepthMm || 0) > 0
            ) {
              alignSectionStandaloneFurnitureFront(tfAfter, secAfter);
            }
            console.log('[MODULE-RESIZE][SAVE] close modal');
            closeModal();
          }

          window.__cldCommitModuleZoneEditSave = commitModuleZoneEditSave;
          if (saveBtn) {
            saveBtn.onclick = function (ev) {
              ev.preventDefault();
              ev.stopPropagation();
              commitModuleZoneEditSave();
            };
            console.log('[MODULE-RESIZE] save button bound (onclick)', {
              sectionId,
              zoneIndex: zoneIndexNum,
            });
          } else {
            console.warn('[MODULE-RESIZE] step4-module-save-btn not found in modal DOM');
          }
          if (delBtn) {
            delBtn.onclick = function () {
              try {
                const sec =
                  (state.customSections || []).find(
                    (s) => String(s.id) === String(sectionId)
                  ) || null;
                if (!sec || !sec.group) {
                  closeModal();
                  return;
                }
                const targetFurniture = findFurnitureInZone(sec);
                if (targetFurniture) {
                  console.log('[DELETE] Удалить модуль из zone-edit popup', {
                    sectionId, zoneIndex, name: targetFurniture.name || '?',
                  });
                  try {
                    removeSectionZoneEditIcon(sectionId, zoneIndex);
                  } catch (_) {}
                  try {
                    clearModuleEditFocusFog();
                  } catch (_) {}
                  if (targetFurniture.parent) {
                    targetFurniture.parent.remove(targetFurniture);
                  } else if (state.scene) {
                    state.scene.remove(targetFurniture);
                  }
                  targetFurniture.traverse((child) => {
                    if (child.geometry) try { child.geometry.dispose(); } catch (_) {}
                    if (child.material) {
                      if (Array.isArray(child.material)) {
                        child.material.forEach((m) => { try { m.dispose(); } catch (_) {} });
                      } else {
                        try { child.material.dispose(); } catch (_) {}
                      }
                    }
                  });
                  // Пересобрать переходы — топы/накладки должны исчезнуть
                  try {
                    if (typeof window.__clodisRebuildAllTransitions === 'function') {
                      window.__clodisRebuildAllTransitions();
                      console.log('[DELETE] rebuildAllTransitions after zone-edit delete ok');
                    }
                  } catch (e) {
                    console.warn('[DELETE] rebuildAllTransitions after delete failed', e);
                  }
                }
              } catch (e) {
                console.warn('⚠️ Ошибка удаления модуля из попапа:', e);
              }
              closeModal();
            };
          }
          if (okBtn) {
            okBtn.style.display = 'none';
          }
          overlay.onclick = function (e) {
            if (e.target === overlay) closeModal();
          };
        }
        console.log('[ZONE-WIDTH] modal open', {
          sectionId,
          zoneIndex,
          title,
          widthCmBaseline: widthCmValueNum,
          widthMinCm,
          widthMaxCm,
          actualZoneWidthMm,
          zoneDoorKind,
          hasSetZoneFn: typeof window.__clodisSetZoneCustomWidthMm === 'function',
        });
        console.log('[ZONE-EDIT] click', { sectionId, zoneIndex, title });
      } catch (e) {
        console.warn('⚠️ Ошибка обработки клика по иконке редактирования зоны:', e);
      }
    };
  console.log('[MODULE-RESIZE] scene-icons zone-edit v=20260605-depth-display');
  if (typeof window !== 'undefined' && window.__CLD_DEBUG_PLACE === true) {
    console.log('[ZONE-WIDTH] handleSectionZoneEditClick registered (клик по карандашу → модалка)');
  }

  if (!window.__cldZoneEditSaveDelegated) {
    window.__cldZoneEditSaveDelegated = true;
    const ov = document.getElementById('step4-help-modal-overlay');
    if (ov) {
      ov.addEventListener(
        'click',
        (e) => {
          const btn = e.target && e.target.closest ? e.target.closest('#step4-module-save-btn') : null;
          if (!btn) return;
          if (typeof window.__cldCommitModuleZoneEditSave === 'function') {
            e.preventDefault();
            e.stopPropagation();
            window.__cldCommitModuleZoneEditSave();
          }
        },
        true
      );
    }
  }
}

if (typeof window !== 'undefined') {
  window.buildStep4SectionEditIcons = buildStep4SectionEditIcons;
  window.clearStep4SectionEditIcons = clearStep4SectionEditIcons;
  window.__clodisRefreshStep4SectionEditIcons = buildStep4SectionEditIcons;
  window.syncSectionZoneEditIconsActive = syncSectionZoneEditIconsActive;
  window.removeSectionZoneEditIcon = removeSectionZoneEditIcon;
  window.rebuildSectionZoneEditIconsForSection = rebuildSectionZoneEditIconsForSection;
  window.applyModuleEditFocusFog = applyModuleEditFocusFog;
  window.clearModuleEditFocusFog = clearModuleEditFocusFog;
  window.isAllDimensionLabelsVisible = isAllDimensionLabelsVisible;
  window.setAllDimensionLabelsVisible = setAllDimensionLabelsVisible;
  window.toggleAllDimensionLabels = toggleAllDimensionLabels;
  window.invalidateGroupIconBBoxCache = invalidateGroupIconBBoxCache;
  window.invalidateAllFurnitureIconAnchors = invalidateAllFurnitureIconAnchors;
}
