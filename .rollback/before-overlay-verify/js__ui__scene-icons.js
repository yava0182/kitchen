// Scene icons module - 2D overlay icons that follow 3D positions
// Handles all 2D UI overlays on the 3D scene

import { state } from '../utils/state.js';
import * as THREE from 'three';
import { exportFurnitureForBasisOBJ, exportFurnitureForBasisSTL } from '../export/basis-export.js';
import { downloadCFRN, exportToBazisCloud } from '../export/bazis-cfrn-export.js?v=20261010-gola6mm1';
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
} from './dimension-lines.js?v=20261027-nmu142k';
import { computeFurnitureWorldBBoxNoAo, withFurnitureDoorSwingsClosedForMeasure } from '../furniture/furniture-bbox.js?v=20261104-talltopd1';
import {
  getFurnitureFrontWorldCoord,
  getSectionFacadeFrontWorldCoord,
  anchorFurnitureFrontWorldCoord,
  alignSectionStandaloneFurnitureFront,
} from '../sections/section-manager.js?v=20261028-vmu5';
import {
  END_CABINET_SIDES,
  getEndCabinetSlot,
  isEndCabinetActive,
} from '../sections/section-end-cabinet.js?v=20260917-endcab-nobridge';
import { syncCabinetPivotDebugVisibility } from '../debug/cabinet-pivot-visibility.js?v=20261025-cell7';
import { reorientKitchenCornerModule } from '../kitchen/kitchen-corner-reorient.js?v=20261108-gplace18';
import {
  reorientKitchenCornerCell,
  reorientKitchenUpperCornerCell,
} from '../kitchen/kitchen-corner-cell.js?v=20261116-cornerReset1';
import {
  buildKitchenSidePanelsModuleEditHtml,
  bindKitchenSidePanelsModuleEdit,
  readSidePanelsForModuleEdit,
} from './kitchen-side-panels-module-edit.js?v=20261118-plinthSafe1';
import {
  setKitchenBandGridsViewEnabled,
  setKitchenBandGridsViewBand,
  setKitchenBandGridsViewLabelsVisible,
  getKitchenBandGridsViewState,
  updateKitchenBandGridsViewLabels,
} from '../kitchen/kitchen-band-grids-view.js?v=20261116-cornerReset1';
import {
  resolveActiveKitchenBandEditId,
  resolveKitchenBandCustomZoneWidthsMmForEdit,
  resolveKitchenModuleWidthsMm,
  getKitchenBandPartsForEdit,
} from '../kitchen/kitchen-section-layout.js?v=20261116-lCorner1050';
import { computeSectionInnerBoundsU } from '../sections/section-edge-trim-insets.js';

try {
  if (typeof window !== 'undefined') {
    window.__cldSyncCabinetPivotDebugVisibility = syncCabinetPivotDebugVisibility;
    window.__cldReorientKitchenCornerModule = reorientKitchenCornerModule;
    window.__cldReorientKitchenCornerCell = reorientKitchenCornerCell;
    window.__cldReorientKitchenUpperCornerCell = reorientKitchenUpperCornerCell;
  }
} catch (_) {}

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
    // IKEA-режим: сетка ячеек спит — разметку не показываем.
    if (state.kitchenCellsUiEnabled === false) {
      setStep5CabinetMarkersVisible(false);
      setStep5SectionZonesVisible(false);
      return;
    }
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

function __isKitchenTallFurniture(group) {
  if (typeof window !== 'undefined' && typeof window.__cldIsKitchenTallGroup === 'function') {
    return !!window.__cldIsKitchenTallGroup(group);
  }
  const eng = typeof window !== 'undefined' ? window.__cldKitchenBaseEngine : null;
  if (eng && typeof eng.isKitchenTallGroup === 'function') {
    return !!eng.isKitchenTallGroup(group);
  }
  const ud = group?.userData || {};
  const pk = String(ud.__placementKindProfileId || ud.placementKind || ud.__placementKind || '');
  return pk === 'kitchen_tall' || String(ud.productKind || '') === 'kitchen_tall';
}

/** Только НМ (столешка/корпус). Пенал — отдельно, иначе UI «Глубина НМ» ломает посадку. */
function __isKitchenBaseFurniture(group) {
  if (__isKitchenTallFurniture(group)) return false;
  if (typeof window !== 'undefined' && typeof window.__cldIsKitchenNmCarcassGroup === 'function') {
    return !!window.__cldIsKitchenNmCarcassGroup(group);
  }
  const eng = typeof window !== 'undefined' ? window.__cldKitchenBaseEngine : null;
  if (eng && typeof eng.isKitchenNmCarcassGroup === 'function') {
    return !!eng.isKitchenNmCarcassGroup(group);
  }
  if (eng && typeof eng.isKitchenBaseGroup === 'function') {
    return !!eng.isKitchenBaseGroup(group) && !__isKitchenTallFurniture(group);
  }
  const ud = group?.userData || {};
  const pk = String(ud.__placementKindProfileId || ud.placementKind || ud.__placementKind || '');
  return pk === 'kitchen_base' || pk === 'kitchen_base_gola' || String(ud.productKind || '') === 'kitchen_base';
}

/** Угловой НМУ — поле «отступ от стены». */
function __isKitchenCornerBaseFurniture(group) {
  if (!group) return false;
  if (typeof window !== 'undefined' && typeof window.__cldIsKitchenCornerBaseGroup === 'function') {
    return !!window.__cldIsKitchenCornerBaseGroup(group);
  }
  const eng = typeof window !== 'undefined' ? window.__cldKitchenBaseEngine : null;
  if (eng && typeof eng.isKitchenCornerBaseGroup === 'function') {
    return !!eng.isKitchenCornerBaseGroup(group);
  }
  const ud = group?.userData || {};
  if (ud.__kitchenCornerSideAtMinU != null) {
    const pkEarly = String(ud.__placementKindProfileId || ud.placementKind || ud.__placementKind || '');
    if (pkEarly === 'kitchen_wall_corner') return false;
    return true;
  }
  const pk = String(ud.__placementKindProfileId || ud.placementKind || ud.__placementKind || '');
  return pk === 'kitchen_base_corner' || pk.includes('kitchen_base_corner');
}

/** Угловой навесной (ВМУ / Г) — не путать с нижней спец-ячейкой 1050. */
function __isKitchenUpperCornerFurniture(group) {
  if (!group?.userData) return false;
  const ud = group.userData;
  if (ud.__kitchenUpperGSeated === true) return true;
  const kind = String(ud.__kitchenUpperGKind || '');
  if (kind === 'g_arms' || kind === 'return') return true;
  const seat = String(ud.__kitchenUpperCornerSeat || '');
  if (seat === 'G' || seat === 'A') return true;
  const pk = String(
    ud.__placementKindProfileId || ud.placementKind || ud.__placementKind || ''
  ).trim();
  return pk === 'kitchen_wall_corner';
}

/** Угол пирога: НМУ или приставной ВМУ. */
function __isKitchenCornerModuleFurniture(group) {
  if (!group) return false;
  if (__isKitchenUpperCornerFurniture(group)) return true;
  if (typeof window !== 'undefined' && typeof window.__cldIsKitchenCornerModuleGroup === 'function') {
    return !!window.__cldIsKitchenCornerModuleGroup(group);
  }
  const eng = typeof window !== 'undefined' ? window.__cldKitchenBaseEngine : null;
  if (eng && typeof eng.isKitchenCornerModuleGroup === 'function') {
    return !!eng.isKitchenCornerModuleGroup(group);
  }
  return __isKitchenCornerBaseFurniture(group);
}

/** НШ1/НШ2: Y от ритма (plinth+bands), не поле «Отступ» шкафа 0–80 см. */
function __isKitchenWallHungFurniture(group) {
  const ud = group?.userData || {};
  const pk = String(ud.__placementKindProfileId || ud.placementKind || ud.__placementKind || '');
  const prod = String(ud.productKind || '');
  return (
    pk === 'kitchen_wall_mid' ||
    pk === 'kitchen_wall_top' ||
    pk === 'kitchen_wall_corner' ||
    prod === 'kitchen_wall_mid' ||
    prod === 'kitchen_wall_top'
  );
}

function __isKitchenWallMidFurniture(group) {
  if (!group || __isKitchenTallFurniture(group)) return false;
  if (typeof window !== 'undefined' && typeof window.__cldIsKitchenWallCornerGroup === 'function') {
    if (window.__cldIsKitchenWallCornerGroup(group)) return false;
  }
  const eng = typeof window !== 'undefined' ? window.__cldKitchenBaseEngine : null;
  if (eng && typeof eng.isKitchenWallMidGroup === 'function') {
    return !!eng.isKitchenWallMidGroup(group) && !eng.isKitchenWallTopGroup?.(group);
  }
  if (typeof window !== 'undefined' && typeof window.__cldIsKitchenWallMidGroup === 'function') {
    return !!window.__cldIsKitchenWallMidGroup(group);
  }
  const ud = group?.userData || {};
  const pk = String(ud.__placementKindProfileId || ud.placementKind || ud.__placementKind || '');
  return pk === 'kitchen_wall_mid' || String(ud.productKind || '') === 'kitchen_wall_mid';
}

function __isKitchenWallTopFurniture(group) {
  if (!group || __isKitchenTallFurniture(group)) return false;
  if (typeof window !== 'undefined' && typeof window.__cldIsKitchenWallCornerGroup === 'function') {
    if (window.__cldIsKitchenWallCornerGroup(group)) return false;
  }
  const eng = typeof window !== 'undefined' ? window.__cldKitchenBaseEngine : null;
  if (eng && typeof eng.isKitchenWallTopGroup === 'function') {
    return !!eng.isKitchenWallTopGroup(group);
  }
  if (typeof window !== 'undefined' && typeof window.__cldIsKitchenWallTopGroup === 'function') {
    return !!window.__cldIsKitchenWallTopGroup(group);
  }
  const ud = group?.userData || {};
  const pk = String(ud.__placementKindProfileId || ud.placementKind || ud.__placementKind || '');
  return pk === 'kitchen_wall_top' || String(ud.productKind || '') === 'kitchen_wall_top';
}

function __kitchenWorktopDepthMmFromGroup(group) {
  const ud = group?.userData || {};
  const fromUd = Number(ud.__kitchenWorktopDepthMm) || 0;
  if (fromUd > 0) return Math.round(fromUd);
  try {
    const api = window.__cldKitchenManufacturing;
    if (api && typeof api.getProjectWorktopDepthMm === 'function') {
      const p = Number(api.getProjectWorktopDepthMm()) || 0;
      if (p > 0) return Math.round(p);
    }
  } catch (_) {}
  return 600;
}

function __kitchenCarcassDepthMmFromGroup(group) {
  const ud = group?.userData || {};
  const c =
    Number(ud.__kitchenCarcassDepthMm) ||
    Number(ud.customDepthMm) ||
    0;
  if (c > 0 && c <= 560) return Math.round(c);
  return 550;
}

/** Диапазон глубины НМ (см): min…(Dwtв€’40в€’10)/10; default = max. */
function __kitchenCarcassDepthBoundsCm(worktopDepthMm) {
  const dwt = Number(worktopDepthMm) || 600;
  try {
    const api = window.__cldKitchenManufacturing;
    if (api && typeof api.getBaseCarcassDepthBoundsMm === 'function') {
      const b = api.getBaseCarcassDepthBoundsMm(dwt);
      const minCm = (Number(b.minMm) || 150) / 10;
      const maxCm = (Number(b.maxMm) || 0) / 10;
      return {
        ok: !!b.ok && maxCm >= minCm,
        minCm,
        maxCm,
        defaultCm: maxCm >= minCm ? maxCm : minCm,
      };
    }
  } catch (_) {}
  const minCm = 15;
  const maxCm = (dwt - 40 - 10) / 10;
  return {
    ok: maxCm >= minCm,
    minCm,
    maxCm,
    defaultCm: maxCm >= minCm ? maxCm : minCm,
  };
}

/** @deprecated пресеты; UI использует __kitchenCarcassDepthBoundsCm */
function __kitchenCarcassDepthOptionsCm(worktopDepthMm) {
  const b = __kitchenCarcassDepthBoundsCm(worktopDepthMm);
  if (!b.ok) return [];
  return [b.defaultCm];
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
/** Диаметр карандаша угловой ячейки (крупный). */
const ZONE_EDIT_ICON_SIZE_PX = 32;
/** Обычные ячейки — тонкий карандаш, чтоб угол отличался. */
const ZONE_EDIT_ICON_SIZE_PX_SLIM = 20;
/** Небольшой сдвиг вниз в screen-space, чтобы кнопка сидела под цоколем. */
const ZONE_EDIT_ICON_SCREEN_NUDGE_Y_PX = 12;

/** Угловая спец-зона L/П (крупный карандаш); остальные — slim. */
function __isKitchenCornerSpecialZone(sectionId, zoneIndex) {
  try {
    const sec = (state.customSections || []).find(
      (s) => s && String(s.id) === String(sectionId)
    );
    if (!sec?.lShape || !sec.division) return false;
    const zi = Math.floor(Number(zoneIndex));
    if (!Number.isFinite(zi) || zi < 0) return false;
    const specials =
      typeof window.__cldGetLShapeSpecialZoneIndices === 'function'
        ? window.__cldGetLShapeSpecialZoneIndices(sec)
        : typeof window.__cldGetLShapeSpecialZoneIndex === 'function'
          ? (() => {
              const one = window.__cldGetLShapeSpecialZoneIndex(sec);
              return one != null ? [one] : [];
            })()
          : [];
    if (Array.isArray(specials) && specials.some((z) => Number(z) === zi)) {
      return true;
    }
    // Joint host special по atStart
    const reserves = sec._kitchenJointReserves;
    if (reserves && typeof reserves === 'object') {
      const parts = Math.max(1, Math.floor(Number(sec.division.parts) || 1));
      for (const r of Object.values(reserves)) {
        if (!r || r.isHost !== true) continue;
        const want = r.atStart === true ? 0 : parts - 1;
        if (want === zi) return true;
      }
    }
  } catch (_) {}
  return false;
}

function __zonePencilSizePx(icon) {
  const n = Math.round(Number(icon?.userData?.iconSizePx) || 0);
  if (n >= 12 && n <= 48) return n;
  return ZONE_EDIT_ICON_SIZE_PX;
}

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

/**
 * Якорь карандаша пустой зоны: середина U-сегмента layout, у пола, перед фасадом секции.
 */
function __worldZonePencilAnchorFromEmptyZone(section, zoneIndex) {
  if (!section?.group || zoneIndex == null || zoneIndex === '') return null;
  const wallName = section.wallName || section.division?.wallName || 'back';
  const zi = Math.floor(Number(zoneIndex));
  if (!Number.isFinite(zi) || zi < 0) return null;
  try {
    if (typeof window.__clodisComputeSectionLayout === 'function') {
      window.__clodisComputeSectionLayout(section);
    }
  } catch (_) {}
  let startU = null;
  let endU = null;
  // Спец L/П: якорь/ширина из bounds (1050). П — оба zi, не только первый.
  try {
    const specialZis =
      typeof window.__cldGetLShapeSpecialZoneIndices === 'function'
        ? window.__cldGetLShapeSpecialZoneIndices(section)
        : typeof window.__cldGetLShapeSpecialZoneIndex === 'function'
          ? (() => {
              const one = window.__cldGetLShapeSpecialZoneIndex(section);
              return one != null ? [one] : [];
            })()
          : [];
    const isThisSpecial =
      Array.isArray(specialZis) && specialZis.some((z) => Number(z) === zi);
    if (
      isThisSpecial &&
      typeof window.__cldGetLShapeSpecialSnapBounds === 'function'
    ) {
      const sp = window.__cldGetLShapeSpecialSnapBounds(section.division, zi);
      if (sp && Number(sp.moduleWidth) > 0 && Number.isFinite(sp.zoneStart)) {
        startU = Number(sp.zoneStart);
        endU = startU + Number(sp.moduleWidth);
      }
    }
  } catch (_) {}
  const segs = section._layoutCache?.segments;
  if (!(Number.isFinite(startU) && Number.isFinite(endU) && endU > startU) && Array.isArray(segs)) {
    const seg = segs.find(
      (s) =>
        s &&
        Number(s.zoneIndex) === zi &&
        (s.type === 'module' || s.type === 'special' || s.isLSpecial === true)
    );
    if (seg && Number.isFinite(seg.startU) && Number.isFinite(seg.endU)) {
      startU = Number(seg.startU);
      endU = Number(seg.endU);
    }
  }
  if (!(Number.isFinite(startU) && Number.isFinite(endU) && endU > startU)) {
    const div = section.division;
    const parts = Math.max(0, Math.floor(Number(div?.parts) || 0));
    if (!div || zi >= parts) return null;
    const widths = section._layoutCache?.moduleWidthsMm;
    const ss = Number(div.sectionStart) || 0;
    if (Array.isArray(widths) && widths.length === parts) {
      startU = ss;
      for (let i = 0; i < zi; i++) startU += Number(widths[i]) || 0;
      endU = startU + (Number(widths[zi]) || 0);
    } else {
      // 600+жертва: ширины из customZoneWidthsMm / base grid (без равного partSize).
      const custom =
        div.customZoneWidthsMm ||
        section.kitchenBandGrids?.base?.customZoneWidthsMm ||
        null;
      const ps = Number(div.partSize) || 0;
      startU = ss;
      for (let i = 0; i < zi; i++) {
        const wi =
          custom != null
            ? Number(custom[i] ?? custom[String(i)])
            : NaN;
        startU += Number.isFinite(wi) && wi > 0 ? wi : ps;
      }
      const wZi =
        custom != null
          ? Number(custom[zi] ?? custom[String(zi)])
          : NaN;
      const wUse = Number.isFinite(wZi) && wZi > 0 ? wZi : ps;
      if (!(wUse > 0)) return null;
      endU = startU + wUse;
    }
  }
  if (!(endU > startU)) return null;
  const midU = (startU + endU) / 2;
  const pos = section.group.position;
  const iconPos = new THREE.Vector3();
  if (wallName === 'front' || wallName === 'back') {
    iconPos.set(midU, pos.y + _ZONE_PENCIL_FLOOR_LIFT_MM, pos.z);
  } else {
    iconPos.set(pos.x, pos.y + _ZONE_PENCIL_FLOOR_LIFT_MM, midU);
  }
  const facade = getSectionFacadeFrontWorldCoord(section, wallName);
  if (Number.isFinite(facade)) {
    if (wallName === 'back' || wallName === 'front') iconPos.z = facade;
    else iconPos.x = facade;
  }
  const depthMm =
    wallName === 'left' || wallName === 'right'
      ? Number(section.size?.x) || 0
      : Number(section.size?.z ?? section.size?.depth) || 0;
  return __placeIconOnSharedFrontLine(
    iconPos,
    wallName,
    _ZONE_PENCIL_AHEAD_GAP_MM,
    Math.max(0, depthMm / 2)
  );
}

/** Якорь карандаша модуля: центр по ширине корпуса, сразу под низом (в т.ч. wall_hung). */
function __worldZonePencilAnchorFromGroup(group, wallName) {
  const wn = wallName || group?.userData?.wallName || 'back';
  // Upper-G / matrix-lock: local→world min-corner часто даёт Y≈пол (bbox в локали кривой).
  // Берём world AABB: карандаш под навесом / под верхней ячейкой.
  if (
    group?.userData?.__kitchenUpperGMatrixLock ||
    __isKitchenUpperCornerFurniture(group) ||
    __isKitchenWallHungFurniture(group)
  ) {
    try {
      group.updateMatrixWorld?.(true);
      const worldBb = computeFurnitureWorldBBoxNoAo(group);
      if (worldBb && !worldBb.isEmpty()) {
        const iconPos3D = new THREE.Vector3(
          (worldBb.min.x + worldBb.max.x) / 2,
          worldBb.min.y + _ZONE_PENCIL_FLOOR_LIFT_MM,
          (worldBb.min.z + worldBb.max.z) / 2
        );
        const halfDepthMm =
          wn === 'left' || wn === 'right'
            ? Math.abs(worldBb.max.x - worldBb.min.x) / 2
            : Math.abs(worldBb.max.z - worldBb.min.z) / 2;
        return __placeIconOnSharedFrontLine(
          iconPos3D,
          wn,
          _ZONE_PENCIL_AHEAD_GAP_MM,
          halfDepthMm
        );
      }
    } catch (_) {}
  }
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
  const sz = __zonePencilSizePx(icon);
  icon.style.left = x - sz / 2 + 'px';
  icon.style.top = y - sz / 2 + ZONE_EDIT_ICON_SCREEN_NUDGE_Y_PX + 'px';
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

// Глобальные флаги показа размеров — по умолчанию ВЫКЛ.
// Включает пользователь кнопкой «Размеры», когда нужно.
if (typeof window.showSectionDimensionLabels === 'undefined') {
  window.showSectionDimensionLabels = false;
}
if (typeof window.showFurnitureDimensionLabels === 'undefined') {
  window.showFurnitureDimensionLabels = false;
}
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
  // Шаг 1–3: прячем. На шаге 4+ один раз включаем (кнопка cm потом может выключить).
  if (!show && isAllDimensionLabelsVisible()) {
    setAllDimensionLabelsVisible(false);
  } else if (show && window.__cldDimsAutoOnStep4 !== true) {
    window.__cldDimsAutoOnStep4 = true;
    if (!isAllDimensionLabelsVisible()) setAllDimensionLabelsVisible(true);
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
 * В room-edit / kitchen 2D — как у IKEA: размер на каждом ребре стены, клик → правка.
 */
export function updateRoomDimensionLabels() {
  const editingAxis = window.__cldRoomDimEditing;
  if (
    editingAxis != null &&
    document.activeElement &&
    document.activeElement.classList.contains('cld-room-outer-dim-input')
  ) {
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

  const editable = !!(window.__cldRoomEditOpen && window.__cldRoomEditView !== '3d');
  const fp = state.room.footprintSpec;
  const verts = fp && Array.isArray(fp.vertices) ? fp.vertices : null;
  const segs = fp && Array.isArray(fp.segments) ? fp.segments : null;

  if (verts && verts.length >= 3 && editable) {
    updatePolygonEdgeDimensionLabels(verts, segs, editable);
    return;
  }

  const rw = state.room.width;
  const rd = state.room.depth;
  const wCm = Math.round(Number(rw) || 0) / 10;
  const dCm = Math.round(Number(rd) || 0) / 10;
  const fmtRoomCm = (cmVal) => Number(cmVal).toFixed(1).replace('.', ',') + ' см';
  const wLabel = fmtRoomCm(wCm);
  const dLabel = fmtRoomCm(dCm);
  const out = 100 + 280;
  const y = 0;
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
    const lineSegs = [];
    if (!hide.top) {
      lineSegs.push({
        axis: 'width',
        labelClass: '.dimension-width-top',
        p1: new THREE.Vector3(-rw / 2, y, -rd / 2 - out),
        p2: new THREE.Vector3(rw / 2, y, -rd / 2 - out),
      });
    }
    if (!hide.bottom) {
      lineSegs.push({
        axis: 'width',
        labelClass: '.dimension-width-bottom',
        p1: new THREE.Vector3(-rw / 2, y, rd / 2 + out),
        p2: new THREE.Vector3(rw / 2, y, rd / 2 + out),
      });
    }
    if (!hide.left) {
      lineSegs.push({
        axis: 'depth',
        labelClass: '.dimension-depth-left',
        p1: new THREE.Vector3(-rw / 2 - out, y, -rd / 2),
        p2: new THREE.Vector3(-rw / 2 - out, y, rd / 2),
      });
    }
    if (!hide.right) {
      lineSegs.push({
        axis: 'depth',
        labelClass: '.dimension-depth-right',
        p1: new THREE.Vector3(rw / 2 + out, y, -rd / 2),
        p2: new THREE.Vector3(rw / 2 + out, y, rd / 2),
      });
    }
    window.__cldRoomOuterDimSegs = lineSegs;
    redrawRoomOuterDimLines();
  } else {
    const layer = document.getElementById('cld-room-outer-dim-lines');
    if (layer) layer.replaceChildren();
  }
}

/** Размеры снаружи каждого ребра footprint (как IKEA). */
function updatePolygonEdgeDimensionLabels(verts, segments, editable) {
  const rw = state.room.width;
  const rd = state.room.depth;
  const ox = -rw / 2;
  const oz = -rd / 2;
  const out = 100 + 280;
  const y = 0;
  const n = verts.length;
  const fmtRoomCm = (cmVal) => Number(cmVal).toFixed(1).replace('.', ',') + ' см';
  const lineSegs = [];

  const edgeFilter =
    window.__cldKitchenDimEdgeFilter && typeof window.__cldKitchenDimEdgeFilter.has === 'function'
      ? window.__cldKitchenDimEdgeFilter
      : null;

  for (let i = 0; i < n; i++) {
    const seg = segments && segments[i];
    if (seg && seg.open) continue;
    if (edgeFilter && !edgeFilter.has(i)) continue;
    // Дверь/окно на стене: скрыть полный размер ребра (остаются сегменты проёма)
    const hideKeys = window.__cldHideRoomDimWallKeys;
    const segKey = seg && (seg.wallName || seg.id);
    if (hideKeys && segKey && typeof hideKeys.has === 'function' && hideKeys.has(segKey)) {
      continue;
    }
    const hideSides = window.__cldHideRoomDimSides;
    if (hideSides && seg && seg.wallName) {
      const wn = seg.wallName;
      if (
        (wn === 'back' && hideSides.top) ||
        (wn === 'front' && hideSides.bottom) ||
        (wn === 'left' && hideSides.left) ||
        (wn === 'right' && hideSides.right)
      ) {
        continue;
      }
    }
    const a = verts[i];
    const b = verts[(i + 1) % n];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    if (len < 40) continue;
    const ux = dx / len;
    const uz = dz / len;
    // CCW outward
    const nx = uz;
    const nz = -ux;
    const midX = (a.x + b.x) / 2;
    const midZ = (a.z + b.z) / 2;
    const labelPos = new THREE.Vector3(ox + midX + nx * out, y, oz + midZ + nz * out);
    const cm = Math.round(len) / 10;
    const ang = (Math.atan2(uz, ux) * 180) / Math.PI;
    // читаемый угол подписи (-90..90)
    let rot = ang;
    if (rot > 90) rot -= 180;
    if (rot < -90) rot += 180;
    const extra = Math.abs(rot) > 5 ? { transform: 'rotate(' + rot.toFixed(1) + 'deg)' } : {};
    const cls =
      'dimension-label dimension-edge dimension-edge-' +
      i +
      (editable ? ' is-room-dim-editable' : '');
    const meta = editable
      ? { kind: 'edge', edgeIndex: i, axis: 'edge:' + i, valueCm: cm }
      : null;
    const label = createDimensionLabel(fmtRoomCm(cm), labelPos, cls, extra, meta);
    if (label) window.roomDimensionLabels.push(label);

    lineSegs.push({
      axis: 'edge:' + i,
      labelClass: '.dimension-edge-' + i,
      p1: new THREE.Vector3(ox + a.x + nx * out, y, oz + a.z + nz * out),
      p2: new THREE.Vector3(ox + b.x + nx * out, y, oz + b.z + nz * out),
    });
  }

  window.__cldRoomOuterDimSegs = lineSegs;
  if (editable) redrawRoomOuterDimLines();
  else {
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
    // line 1: start в†’ gap start
    const l1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l1.setAttribute('x1', String(x1)); l1.setAttribute('y1', String(y1));
    l1.setAttribute('x2', String(gapStartX)); l1.setAttribute('y2', String(gapStartY));
    l1.setAttribute('stroke', '#333'); l1.setAttribute('stroke-width', '1.25');
    g.appendChild(l1);
    // line 2: gap end в†’ end
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

function applyRoomDimAxis(axis, cmVal, edgeIndex) {
  const n = Math.round(Number(String(cmVal).replace(',', '.')));
  if (!Number.isFinite(n)) return;
  const isEdge =
    axis === 'edge' || (typeof axis === 'string' && axis.indexOf('edge:') === 0);
  const minCm = isEdge ? 40 : 100;
  const maxCm = 2000;
  const clamped = Math.max(minCm, Math.min(maxCm, n));

  if (isEdge) {
    const ei =
      Number.isFinite(edgeIndex) ? edgeIndex : parseInt(String(axis).split(':')[1], 10);
    window.__cldRoomDimEditing = null;
    if (typeof window.__cldApplyRoomEdgeLength === 'function') {
      window.__cldApplyRoomEdgeLength(ei, clamped);
    }
    return;
  }

  const wEl = document.getElementById('room-width-input');
  const dEl = document.getElementById('room-depth-input');
  if (axis === 'width' && wEl) wEl.value = String(clamped);
  if (axis === 'depth' && dEl) dEl.value = String(clamped);
  window.__cldRoomDimEditing = null;
  if (typeof window.__cldApplyRoomDimensions === 'function') {
    window.__cldApplyRoomDimensions();
  }
}

function beginRoomDimEdit(label, axis, valueCm, edgeIndex) {
  window.__cldRoomDimEditing = axis;
  label.classList.add('is-editing');
  label.textContent = '';
  const isEdge =
    axis === 'edge' || (typeof axis === 'string' && axis.indexOf('edge:') === 0);
  const minCm = isEdge ? 40 : 100;
  const maxCm = 2000;
  const input = document.createElement('input');
  input.type = 'text';
  input.inputMode = 'decimal';
  input.autocomplete = 'off';
  input.className = 'cld-room-outer-dim-input';
  input.value = String(Math.round(Number(valueCm)) || '');
  input.setAttribute('min', String(minCm));
  input.setAttribute('max', String(maxCm));
  input.title = 'От ' + minCm + ' до ' + maxCm + ' см';
  input.setAttribute(
    'aria-label',
    (axis === 'width'
      ? 'Ширина комнаты, см'
      : axis === 'depth'
        ? 'Глубина комнаты, см'
        : 'Длина стены, см') +
      ' (макс. ' +
      maxCm +
      ' см)'
  );
  const finish = (commit) => {
    const v = input.value;
    label.classList.remove('is-editing');
    if (commit) applyRoomDimAxis(axis, v, edgeIndex);
    else {
      window.__cldRoomDimEditing = null;
      updateRoomDimensionLabels();
    }
  };
  let selectPending = true;
  input.addEventListener('mousedown', (e) => e.stopPropagation());
  input.addEventListener('click', (e) => e.stopPropagation());
  input.addEventListener('mouseup', (e) => {
    if (!selectPending) return;
    e.preventDefault();
    selectPending = false;
    try {
      input.select();
    } catch (_) {}
  });
  input.addEventListener('input', () => {
    selectPending = false;
    let raw = String(input.value ?? '');
    if (/^0+[1-9]/.test(raw) || /^0{2,}$/.test(raw)) {
      raw = raw.replace(/^0+/, '') || '0';
      input.value = raw;
    }
    const n = Number(String(raw).replace(',', '.'));
    if (Number.isFinite(n) && n > maxCm) {
      input.classList.add('is-over-max');
      input.title = 'Максимум ' + maxCm + ' см';
    } else {
      input.classList.remove('is-over-max');
      input.title = 'От ' + minCm + ' до ' + maxCm + ' см';
    }
  });
  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    selectPending = false;
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
    try {
      input.select();
    } catch (_) {}
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
    label.title = 'Изменить размер';
    label.setAttribute('role', 'button');
    label.tabIndex = 0;
    label.addEventListener('mousedown', (e) => e.stopPropagation());
    label.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.__cldRoomDimEditing) return;
      const ax = editMeta.axis || (editMeta.kind === 'edge' ? 'edge:' + editMeta.edgeIndex : null);
      beginRoomDimEdit(label, ax, editMeta.valueCm, editMeta.edgeIndex);
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
    text += ` В· id ${ud.catalogItemId}`;
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

  const isCorner = __isKitchenCornerSpecialZone(sectionId, zoneIndex);
  const iconSize = isCorner ? ZONE_EDIT_ICON_SIZE_PX : ZONE_EDIT_ICON_SIZE_PX_SLIM;
  const penPx = isCorner ? 15 : 10;
  const icon = document.createElement('div');
  icon.className =
    'section-zone-edit-icon' + (isCorner ? ' section-zone-edit-icon--corner' : ' section-zone-edit-icon--slim');
  icon.innerHTML =
    `<svg class="section-zone-edit-icon__pen" width="${penPx}" height="${penPx}" viewBox="0 0 24 24" fill="none" aria-hidden="true">` +
    '<path d="M12 20h9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
    '<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';
  icon.title = isCorner
    ? group
      ? 'Угловая ячейка / модуль'
      : 'Угловая ячейка'
    : group
      ? 'Редактировать модуль'
      : 'Настройка зоны';
  icon.setAttribute('aria-label', icon.title);
  icon.setAttribute('role', 'button');
  icon.style.position = 'absolute';
  icon.style.pointerEvents = 'auto';
  icon.style.zIndex = isCorner ? '1003' : '1002';
  icon.style.width = iconSize + 'px';
  icon.style.height = iconSize + 'px';
  icon.style.minWidth = iconSize + 'px';
  icon.style.minHeight = iconSize + 'px';

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
    isCornerSpecial: isCorner,
    iconSizePx: iconSize,
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
  try {
    updateKitchenBandGridsViewLabels();
  } catch (_) {}

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

  // Карандаши зон: с мебелью — якорь от корпуса; пустая зона — от layout U.
  const _isStep5 = window.currentRoomStep === 5;
  if (window.sectionZoneEditIcons) {
    window.sectionZoneEditIcons = window.sectionZoneEditIcons.filter((icon) => {
      if (!icon || !icon.userData) return false;
      const group = __resolveZonePencilFurnitureGroup(icon);
      let livePos = null;
      if (group && group.parent) {
        livePos = __worldZonePencilAnchorFromGroup(
          group,
          group.userData?.wallName || 'back'
        );
      } else {
        const sec = (state.customSections || []).find(
          (s) => s && String(s.id) === String(icon.userData.sectionId)
        );
        livePos = sec
          ? __worldZonePencilAnchorFromEmptyZone(sec, icon.userData.zoneIndex)
          : null;
        if (livePos) {
          icon.userData.furnitureGroup = null;
          icon.userData.furnitureUuid = null;
        }
      }
      if (!livePos) {
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

function rebuildAllSectionZoneEditIcons() {
  const list = Array.isArray(state.customSections) ? state.customSections : [];
  for (const sec of list) {
    if (sec?.id != null) rebuildSectionZoneEditIconsForSection(sec.id);
  }
}

// Пересоздать карандаши зон секции (с мебелью и пустые — по division/layout).
export function rebuildSectionZoneEditIconsForSection(sectionId) {
  try {
    if (typeof window !== 'undefined') {
      window.__cldRebuildSectionZoneEditIconsForSection =
        rebuildSectionZoneEditIconsForSection;
      window.__cldRebuildAllSectionZoneEditIcons = rebuildAllSectionZoneEditIcons;
    }
  } catch (_) {}

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

    const coveredZones = new Set();
    state.scene.traverse((obj) => {
      if (!obj || !obj.isGroup || !obj.userData || !obj.userData.isFurniture) return;
      const ud = obj.userData;
      if (String(ud.sectionId) !== String(sectionId)) return;
      if (typeof ud.zoneIndex !== 'number') return;

      // Карандаш модуля: у пола, сразу перед фасадом (как Maatkasten).
      const iconPos = __worldZonePencilAnchorFromGroup(obj, ud.wallName || 'back');
      if (!iconPos) return;

      coveredZones.add(Number(ud.zoneIndex));
      createSectionZoneEditIcon(String(sectionId), ud.zoneIndex, iconPos, obj);
    });

    // Пустые зоны: карандаш ячейки (до постановки модуля).
    // На шагах 2–4 после компоновки — всегда (ячейки правятся сами).
    // Иначе — только если UI ячеек не выключен (IKEA-sleep).
    {
      const step = Number(window.currentRoomStep) || 0;
      const composeSteps = step >= 2 && step <= 4;
      if (!composeSteps && state.kitchenCellsUiEnabled === false) return;
    }
    const sec = (state.customSections || []).find(
      (s) => s && String(s.id) === String(sectionId)
    );
    if (!sec?.division) return;
    try {
      if (typeof window.__clodisComputeSectionLayout === 'function') {
        window.__clodisComputeSectionLayout(sec);
      }
    } catch (_) {}
    const parts = Math.max(0, Math.floor(Number(sec.division.parts) || 0));
    // Кухня L/П: карандаши только на угловых special (остальные ячейки скрыты).
    let onlyZis = null;
    try {
      const kitchenOn =
        typeof window.__cldIsKitchenSectionLayoutActive === 'function'
          ? window.__cldIsKitchenSectionLayoutActive()
          : false;
      if (kitchenOn && sec.lShape && typeof window.__cldGetLShapeSpecialZoneIndices === 'function') {
        onlyZis = window.__cldGetLShapeSpecialZoneIndices(sec);
        if (!Array.isArray(onlyZis) || !onlyZis.length) return;
      }
    } catch (_) {}
    for (let zi = 0; zi < parts; zi++) {
      if (coveredZones.has(zi)) continue;
      if (
        Array.isArray(onlyZis) &&
        !onlyZis.some((z) => Number(z) === zi)
      ) {
        continue;
      }
      const iconPos = __worldZonePencilAnchorFromEmptyZone(sec, zi);
      if (!iconPos) continue;
      createSectionZoneEditIcon(String(sectionId), zi, iconPos, null);
    }
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
  const show = state.kitchenCellsUiEnabled === false ? false : !!visible;
  state.scene.traverse((obj) => {
    if (!obj?.name) return;
    if (
      obj.name.startsWith('SectionZoneSingle_') ||
      obj.name.startsWith('SectionZoneDouble_') ||
      obj.name.startsWith('SectionZoneCap_') ||
      obj.name.startsWith('SectionZoneSingleCorner') ||
      obj.name.startsWith('SectionZoneSpecialCorner') ||
      obj.name.startsWith('CellVol') ||
      obj.name.startsWith('CellVolumes')
    ) {
      obj.visible = show;
    }
  });
  try {
    const map = state.sectionZones;
    if (map && typeof map === 'object') {
      Object.keys(map).forEach((id) => {
        const arr = map[id];
        if (Array.isArray(arr)) arr.forEach((g) => { if (g) g.visible = show; });
      });
    }
  } catch (_) {}
}
if (typeof window !== 'undefined') {
  window.setStep5SectionZonesVisible = setStep5SectionZonesVisible;
}

/** Сплошные и пунктирные линии разметки шкафов (cabinet-markers.js). */
export function setStep5CabinetMarkersVisible(visible) {
  const show = state.kitchenCellsUiEnabled === false ? false : !!visible;
  try {
    const map = state.sectionCabinetMarkers;
    if (map && typeof map === 'object') {
      Object.keys(map).forEach((id) => {
        const arr = map[id];
        if (Array.isArray(arr)) {
          arr.forEach((obj) => {
            if (obj) obj.visible = show;
          });
        }
      });
    }
  } catch (_) {}
  if (!state?.scene) return;
  state.scene.traverse((obj) => {
    if (obj?.userData?.isCabinetMarker) obj.visible = show;
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
  // Секции/ячейки спят: без иконок редактирования секции.
  if (state.kitchenSectionsEnabled === false) return;
  if (state.kitchenCellsUiEnabled === false) return;

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

  // Ячейки: default выкл.; не форсируем вкл. при старте.
  if (state.kitchenCellsUiEnabled === false) {
    state.showSingleZones = false;
    state.showDoubleZones = false;
  }
  {
    const layerOn =
      state.kitchenCellsUiEnabled !== false &&
      !!(state.showSingleZones || state.showDoubleZones);
    try {
      window.showSectionDimensionLabels = false;
    } catch (_) {}
    try {
      setStep5SectionZonesVisible(layerOn);
      setStep5CabinetMarkersVisible(layerOn);
    } catch (_) {}
    try {
      if (typeof window.__cldSyncCellVolumeMeshes === 'function') {
        window.__cldSyncCellVolumeMeshes();
      }
    } catch (_) {}
    try {
      if (typeof window.updateSectionDimensionLabels === 'function') {
        window.updateSectionDimensionLabels();
      }
    } catch (_) {}
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
    if (isAllDimensionLabelsVisible()) {
      try {
        syncRefDimensionLines();
      } catch (_) {}
    }
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

  // Пресеты вида: 3D / сверху / прямо / сбоку (орто)
  const viewPillsWrap = document.createElement('div');
  viewPillsWrap.className = 'scene-view-pills';
  viewPillsWrap.setAttribute('role', 'group');
  viewPillsWrap.setAttribute('aria-label', 'Вид сцены');

  const viewPillsTrack = document.createElement('div');
  viewPillsTrack.className = 'scene-view-pills__track';

  const viewPillsSlider = document.createElement('div');
  viewPillsSlider.className = 'scene-view-pills__slider';
  viewPillsTrack.appendChild(viewPillsSlider);

  const VIEW_PRESETS = [
    { mode: '3d', label: '3D', title: 'Объёмный вид' },
    { mode: 'top', label: 'Сверху', title: 'План сверху (2D)' },
    { mode: 'front', label: 'Прямо', title: 'Вид прямо (фасад)' },
    { mode: 'side', label: 'Сбоку', title: 'Вид сбоку' },
  ];
  const viewPillButtons = VIEW_PRESETS.map(({ mode, label, title }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'scene-view-pill';
    btn.dataset.viewMode = mode;
    btn.textContent = label;
    btn.title = title;
    btn.setAttribute('aria-pressed', mode === '3d' ? 'true' : 'false');
    viewPillsTrack.appendChild(btn);
    return btn;
  });
  viewPillsWrap.appendChild(viewPillsTrack);

  // Тот же режим, что admin «Прозрачные контуры» (transparentOutlineMode).
  const xrayBtn = document.createElement('button');
  xrayBtn.type = 'button';
  xrayBtn.className = 'scene-view-pill scene-view-pill--xray';
  xrayBtn.id = 'cld-room-furniture-xray-btn';
  xrayBtn.textContent = 'Контуры';
  xrayBtn.title = 'Как в админке: прозрачные панели + рёбра, крепёж алюминием';
  xrayBtn.setAttribute('aria-pressed', 'false');
  xrayBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const fn =
      typeof window.__cldToggleRoomFurnitureXray === 'function'
        ? window.__cldToggleRoomFurnitureXray
        : null;
    if (!fn) {
      console.warn('[ROOM-XRAY] toggle not loaded');
      return;
    }
    const on = !!fn();
    xrayBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    xrayBtn.classList.toggle('is-active', on);
  });
  viewPillsWrap.appendChild(xrayBtn);

  // Старая сетка секции (SectionZone*) — скрыта: мешает поясам BASE/MID/TOP.
  // Оставляем API sync, чтобы place/угол не падали; кнопку не показываем.
  try {
    state.showSingleZones = false;
    state.showDoubleZones = false;
    if (typeof window.__cldSetCellVolumesVisible === 'function') {
      window.__cldSetCellVolumesVisible(false);
    } else if (typeof window.__cldSyncCellVolumeMeshes === 'function') {
      window.__cldSyncCellVolumeMeshes();
    }
  } catch (_) {}
  const syncCellsBtn = () => {};
  window.__cldSyncSectionCellsBtn = syncCellsBtn;

  // Ячейки поясов: просмотр kitchenBandGrids (BASE/MID/TOP). Отдельно от сетки секции.
  const bandCellsBtn = document.createElement('button');
  bandCellsBtn.type = 'button';
  bandCellsBtn.className = 'scene-view-pill scene-view-pill--xray scene-view-pill--band-cells';
  bandCellsBtn.id = 'cld-room-band-cells-btn';
  bandCellsBtn.textContent = 'Ячейки';
  bandCellsBtn.title =
    'Просмотр ячеек поясов BASE / MID / TOP (kitchenBandGrids). Только просмотр.';
  bandCellsBtn.setAttribute('aria-pressed', 'false');

  const bandTogglesWrap = document.createElement('div');
  bandTogglesWrap.id = 'cld-room-band-cells-toggles';
  bandTogglesWrap.style.cssText =
    'display:none;gap:6px;align-items:center;flex-wrap:wrap;';
  const bandToggleDefs = [
    { id: 'base', label: 'Низ' },
    { id: 'mid', label: 'Верх' },
    { id: 'top', label: 'Антресоли' },
  ];
  /** @type {Record<string, HTMLButtonElement>} */
  const bandToggleBtns = {};
  for (const def of bandToggleDefs) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'scene-view-pill scene-view-pill--band-toggle';
    b.dataset.band = def.id;
    b.textContent = def.label;
    b.title = `Показать сетку ${def.id.toUpperCase()}`;
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      setKitchenBandGridsViewBand(def.id);
      syncBandCellsUi();
    });
    bandToggleBtns[def.id] = b;
    bandTogglesWrap.appendChild(b);
  }

  const syncBandCellsUi = () => {
    const st = getKitchenBandGridsViewState();
    bandCellsBtn.setAttribute('aria-pressed', st.enabled ? 'true' : 'false');
    bandCellsBtn.classList.toggle('is-active', !!st.enabled);
    bandTogglesWrap.style.display = st.enabled ? 'flex' : 'none';
    for (const def of bandToggleDefs) {
      const btn = bandToggleBtns[def.id];
      if (!btn) continue;
      const on = st.enabled && st.band === def.id;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.classList.toggle('is-active', on);
    }
  };

  bandCellsBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const st = getKitchenBandGridsViewState();
    setKitchenBandGridsViewEnabled(!st.enabled);
    syncBandCellsUi();
  });

  viewPillsWrap.appendChild(bandCellsBtn);
  viewPillsWrap.appendChild(bandTogglesWrap);
  // Не форсируем вкл.: ячейки включает apply*ComposePreview после выбора карточки шага 2.
  syncBandCellsUi();
  window.__cldSyncBandCellsUi = syncBandCellsUi;

  // Подписи мм / «пенал» на ячейках. Default: выкл — включать по необходимости.
  const sizeLabelsBtn = document.createElement('button');
  sizeLabelsBtn.type = 'button';
  sizeLabelsBtn.className =
    'scene-view-pill scene-view-pill--xray scene-view-pill--size-labels';
  sizeLabelsBtn.id = 'cld-room-band-size-labels-btn';
  sizeLabelsBtn.textContent = 'Размеры';
  sizeLabelsBtn.title =
    'Подписи ширины ячеек (мм) и «пенал». По умолчанию выкл.';
  const syncSizeLabelsBtn = () => {
    const st = getKitchenBandGridsViewState();
    const on = st.labels === true;
    sizeLabelsBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    sizeLabelsBtn.classList.toggle('is-active', on);
  };
  sizeLabelsBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const st = getKitchenBandGridsViewState();
    setKitchenBandGridsViewLabelsVisible(!(st.labels === true));
    syncSizeLabelsBtn();
  });
  viewPillsWrap.appendChild(sizeLabelsBtn);
  syncSizeLabelsBtn();
  window.__cldSyncBandSizeLabelsBtn = syncSizeLabelsBtn;

  // Пивоты: секция + опоры/корпус/столешка модуля (сбоку куда что входит).
  const pivotsBtn = document.createElement('button');
  pivotsBtn.type = 'button';
  pivotsBtn.className = 'scene-view-pill scene-view-pill--xray scene-view-pill--pivots';
  pivotsBtn.id = 'cld-room-section-pivots-btn';
  pivotsBtn.textContent = 'Пивоты';
  pivotsBtn.title =
    'Пивоты секции, опор, корпуса, столешки — смотреть сбоку, не вылезает ли за ячейку.';
  pivotsBtn.setAttribute('aria-pressed', 'false');
  const syncPivotsBtn = () => {
    const on =
      typeof window.__cldGetKitchenInspectPivotsVisible === 'function'
        ? !!window.__cldGetKitchenInspectPivotsVisible()
        : false;
    pivotsBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    pivotsBtn.classList.toggle('is-active', on);
  };
  pivotsBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    const cur =
      typeof window.__cldGetKitchenInspectPivotsVisible === 'function'
        ? !!window.__cldGetKitchenInspectPivotsVisible()
        : false;
    try {
      if (typeof window.__cldSetKitchenInspectPivotsVisible === 'function') {
        window.__cldSetKitchenInspectPivotsVisible(!cur);
      }
    } catch (e) {
      console.warn('[PIVOTS] toggle', e);
    }
    syncPivotsBtn();
  });
  viewPillsWrap.appendChild(pivotsBtn);
  syncPivotsBtn();
  window.__cldSyncSectionPivotsBtn = syncPivotsBtn;

  window.sceneIconsContainer.appendChild(viewPillsWrap);

  function updateViewPillSlider(activeBtn) {
    if (!viewPillsSlider) return;
    if (!activeBtn || !viewPillsWrap.parentNode) {
      viewPillsSlider.style.opacity = '0';
      return;
    }
    const trackRect = viewPillsTrack.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    viewPillsSlider.style.width = `${btnRect.width}px`;
    viewPillsSlider.style.transform = `translateX(${btnRect.left - trackRect.left}px)`;
    viewPillsSlider.style.opacity = '1';
  }

  function syncViewPillVisual(mode) {
    const m = String(mode || '3d').toLowerCase();
    let active = null;
    viewPillButtons.forEach((btn) => {
      const on = btn.dataset.viewMode === m;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) active = btn;
    });
    updateViewPillSlider(active || viewPillButtons[0]);
  }

  function applySceneViewPreset(mode) {
    const fn =
      typeof window.__cldSetSceneViewPreset === 'function'
        ? window.__cldSetSceneViewPreset
        : null;
    if (!fn) {
      console.warn('[SCENE-VIEW] setSceneViewPreset not loaded');
      return;
    }
    const res = fn(mode);
    syncViewPillVisual(res?.mode || mode);
  }

  viewPillButtons.forEach((btn) => {
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      applySceneViewPreset(btn.dataset.viewMode || '3d');
    });
  });

  window.__cldSyncSceneViewPills = syncViewPillVisual;
  requestAnimationFrame(() => {
    const cur =
      typeof window.__cldGetSceneViewPreset === 'function'
        ? window.__cldGetSceneViewPreset()
        : window.__cldSceneViewPreset || '3d';
    syncViewPillVisual(cur);
  });

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

  // Старые zone/section debug pills убраны (кнопка sliders больше не нужна).
  window.__clodisSectionSceneToolsVisible = false;
  window.__clodisApplySectionSceneToolsVisibility = () => {};
  ['zone-debug-panel', 'section-debug-panel'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });

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
        let isKitchenBaseModule = false;
        /** userData для блока «Боковины» в карточке карандаша. */
        let moduleEditSidePanelsUd = null;
        let isKitchenTallModule = false;
        let isKitchenWallMidModule = false;
        let isKitchenWallTopModule = false;
        let showFloorClearanceField = false;
        let floorClearanceCmText = '30,0';
        let floorClearanceMinCm = 0;
        let floorClearanceMaxCm = 80;
        let showSideWallClearanceField = false;
        let sideWallClearanceMmText = '10';
        let sideWallClearanceMinMm = 0;
        let sideWallClearanceMaxMm = 200;
        let moduleEditProfile = null;
        let syncHeightInSection = true;
        let showModuleWidthField = true;
        /** Карандаш верхнего Г/ВМУ — без UI нижней ячейки 1050. */
        let isUpperCornerModuleEdit = false;
        let isBaseCornerModuleEdit = false;

        // Ищем секцию и деление, чтобы показать реальные глубину и ширину модуля.
        let depthCmText = '60,0';
        let depthFieldLabel = 'Глубина модуля';
        let worktopDepthCmText = '60,0';
        let widthCmText = '97,1';
        let heightCmText = '40,0';
        let actualZoneWidthMm = null;
        let zoneDoorKind = 'double';
        let moduleZoneHand = 'left';
        let secRef = null;
        let kitchenWallName = 'back';
        let kitchenCarcassBounds = { ok: true, minCm: 15, maxCm: 55, defaultCm: 55 };
        let worktopMinCm = 20;
        let worktopMaxCm = 80;
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

            // 1) Модуль с карандаша (пирог: base/mid/top в одной зоне) — не «первый в зоне».
            let targetFurniture = null;
            if (furnitureGroup && furnitureGroup.isObject3D) {
              const udFg = furnitureGroup.userData || {};
              if (
                furnitureGroup.parent &&
                udFg.isFurniture &&
                String(udFg.sectionId) === String(sectionId) &&
                Number(udFg.zoneIndex) === Number(zoneIndex)
              ) {
                targetFurniture = furnitureGroup;
              }
            }
            if (!targetFurniture && state.furniture && state.furniture.group) {
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
              // kitchen_wall_* в†’ baseKind wall_hung_low, но отступ = ритм (~142 см), не шкаф 0–80.
              showFloorClearanceField =
                pkUd === 'wall_hung_low' && !__isKitchenWallHungFurniture(targetFurniture);
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
              isUpperCornerModuleEdit =
                __isKitchenUpperCornerFurniture(targetFurniture);
              isBaseCornerModuleEdit =
                __isKitchenCornerBaseFurniture(targetFurniture);
              // Отступ от стены — только НМУ. kitchenCorner=true у wall_corner ловил верх.
              showSideWallClearanceField =
                !isUpperCornerModuleEdit &&
                (isBaseCornerModuleEdit ||
                  moduleEditProfile?.editPopup?.showSideWallClearance === true);
              if (showSideWallClearanceField) {
                const rawClr = Math.round(
                  Number(targetFurniture.userData?.__kitchenSideWallClearanceMm)
                );
                const clrMm =
                  Number.isFinite(rawClr) && rawClr >= 0 ? rawClr : 10;
                targetFurniture.userData.__kitchenSideWallClearanceMm = clrMm;
                sideWallClearanceMmText = String(clrMm);
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
              isKitchenTallModule = __isKitchenTallFurniture(targetFurniture);
              isKitchenWallTopModule =
                !isKitchenTallModule && __isKitchenWallTopFurniture(targetFurniture);
              isKitchenWallMidModule =
                !isKitchenTallModule &&
                !isKitchenWallTopModule &&
                __isKitchenWallMidFurniture(targetFurniture);
              isKitchenBaseModule =
                !isKitchenTallModule &&
                !isKitchenWallMidModule &&
                !isKitchenWallTopModule &&
                __isKitchenBaseFurniture(targetFurniture);
              if (
                isKitchenBaseModule ||
                isKitchenWallMidModule ||
                isKitchenWallTopModule ||
                isKitchenTallModule
              ) {
                moduleEditSidePanelsUd = targetFurniture.userData || null;
              }
              kitchenWallName = wallName;
              if (isKitchenTallModule) {
                // Пенал: каталог 560, к стене; не поля столешки/НМ.
                let tallMm =
                  Number(targetFurniture.userData?.__kitchenCarcassDepthMm) ||
                  Number(targetFurniture.userData?.customDepthMm) ||
                  0;
                if (!(tallMm > 0)) {
                  tallMm = __resolveModuleDepthDisplayMm(
                    targetFurniture,
                    sectionDepthMm,
                    isSide
                  );
                }
                if (!(tallMm > 0)) tallMm = 560;
                depthMm = tallMm;
                depthMinCm = 40;
                depthMaxCm = 70;
              } else if (isKitchenBaseModule) {
                const wtMm = __kitchenWorktopDepthMmFromGroup(targetFurniture);
                const carMm = __kitchenCarcassDepthMmFromGroup(targetFurniture);
                worktopDepthCmText = (wtMm / 10).toFixed(1).replace('.', ',');
                depthMm = carMm;
                kitchenCarcassBounds = __kitchenCarcassDepthBoundsCm(wtMm);
                depthMinCm = kitchenCarcassBounds.minCm;
                depthMaxCm = kitchenCarcassBounds.maxCm;
                try {
                  const api = window.__cldKitchenManufacturing;
                  const defs =
                    api && typeof api.getWorktopDepthDefaults === 'function'
                      ? api.getWorktopDepthDefaults()
                      : null;
                  if (defs && Number(defs.minWorktopDepthMm) > 0) {
                    worktopMinCm = Number(defs.minWorktopDepthMm) / 10;
                  }
                } catch (_) {}
              } else if (__isKitchenUpperCornerFurniture(targetFurniture)) {
                // Г/ВМУ: customDepthMm часто = arm (600) ради rebuild — это не глубина корпуса.
                // В карандаше показываем depthA (в комнату от стены), не 60→clamp 45.
                const udD = targetFurniture.userData || {};
                let dA =
                  Math.round(Number(udD.__kitchenUpperGDepthAMm) || 0) ||
                  Math.round(Number(sectionDepthMm) || 0);
                const custom = Math.round(Number(udD.customDepthMm) || 0);
                if (!(dA > 0) && custom > 0 && custom < 500) dA = custom;
                if (!(dA > 0)) dA = 350;
                depthMm = dA;
                depthMinCm = 25;
                depthMaxCm = 45;
                depthFieldLabel = 'Глубина корпуса';
                isUpperCornerModuleEdit = true;
              } else {
                depthMm = __resolveModuleDepthDisplayMm(
                  targetFurniture,
                  sectionDepthMm,
                  isSide
                );
              }
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
            // Активный пояс (Ячейки → Низ/Верх/Антресоли): ширина из kitchenBandGrids.
            let activeBandEditId = 'base';
            try {
              activeBandEditId = resolveActiveKitchenBandEditId(
                getKitchenBandGridsViewState()
              );
            } catch (_) {
              activeBandEditId = 'base';
            }
            if (activeBandEditId === 'mid' || activeBandEditId === 'top') {
              try {
                const inner = computeSectionInnerBoundsU(sec);
                const avail = Math.max(10, Number(inner?.innerWidthU) || 0);
                const bandParts = Math.max(
                  1,
                  getKitchenBandPartsForEdit(sec, activeBandEditId) ||
                    Math.floor(Number(div?.parts) || 0)
                );
                const custom = resolveKitchenBandCustomZoneWidthsMmForEdit(
                  sec,
                  activeBandEditId
                );
                const widths = resolveKitchenModuleWidthsMm({
                  parts: bandParts,
                  sectionWidth: avail,
                  customZoneWidthsMm: custom,
                  minModuleW: 300,
                });
                const ziNum = Number(zoneIndex);
                if (
                  Number.isFinite(ziNum) &&
                  ziNum >= 0 &&
                  ziNum < widths.length &&
                  Number(widths[ziNum]) > 0
                ) {
                  actualZoneWidthMm = Number(widths[ziNum]);
                  moduleWidthMm = actualZoneWidthMm;
                }
              } catch (eBand) {
                console.warn('[ZONE-WIDTH] mid/top modal width', eBand);
              }
            }
            // Предпочитаем точную ширину зоны из layoutCache (учитывает кастомные ширины).
            if (actualZoneWidthMm == null && sec._layoutCache) {
              const lc = sec._layoutCache;
              if (lc.moduleWidthsMm && Number.isFinite(lc.moduleWidthsMm[zoneIndex])) {
                actualZoneWidthMm = lc.moduleWidthsMm[zoneIndex];
                moduleWidthMm = actualZoneWidthMm;
              }
              if (Array.isArray(lc.segments)) {
                const seg = lc.segments.find(
                  (s) =>
                    s &&
                    Number(s.zoneIndex) === Number(zoneIndex) &&
                    (s.type === 'module' ||
                      s.type === 'special' ||
                      s.isLSpecial === true)
                );
                if (seg) {
                  if (seg.doorKind) zoneDoorKind = seg.doorKind;
                  if (actualZoneWidthMm == null) actualZoneWidthMm = seg.endU - seg.startU;
                }
              }
            }
            // Верхний Г/ВМУ: W=arm (600), не нижняя спец 1050.
            if (targetFurniture && __isKitchenUpperCornerFurniture(targetFurniture)) {
              isUpperCornerModuleEdit = true;
              const udW = targetFurniture.userData || {};
              const armW =
                Math.round(Number(udW.__kitchenUpperGArmMm) || 0) ||
                Math.round(Number(udW.__kitchenCellWidthMm) || 0) ||
                Math.round(Number(udW.customWidthMm) || 0) ||
                Math.round(Number(udW.__initialSectionSizeMm?.x) || 0) ||
                600;
              if (armW > 50) {
                actualZoneWidthMm = armW;
                moduleWidthMm = armW;
              }
            } else if (activeBandEditId === 'base') {
              // Спец L/П (угловая ячейка): ширина 1050 — не partSize сетки.
              // П: два special — проверять indices (plural), иначе правый угол берёт equal ~49 см.
              // MID/TOP grid-edit: не подменять шириной угла/модуля.
              try {
                const ziNum = Number(zoneIndex);
                const specialZis =
                  typeof window.__cldGetLShapeSpecialZoneIndices === 'function'
                    ? window.__cldGetLShapeSpecialZoneIndices(sec)
                    : typeof window.__cldGetLShapeSpecialZoneIndex === 'function'
                      ? (() => {
                          const one = window.__cldGetLShapeSpecialZoneIndex(sec);
                          return one != null ? [one] : [];
                        })()
                      : [];
                const isThisSpecial =
                  Array.isArray(specialZis) &&
                  specialZis.some((z) => Number(z) === ziNum);
                if (
                  isThisSpecial &&
                  typeof window.__cldGetLShapeSpecialSnapBounds === 'function' &&
                  div
                ) {
                  const sp = window.__cldGetLShapeSpecialSnapBounds(div, ziNum);
                  if (sp?.moduleWidth > 0) {
                    actualZoneWidthMm = Number(sp.moduleWidth);
                    moduleWidthMm = actualZoneWidthMm;
                    zoneDoorKind = 'double';
                  }
                }
              } catch (_) {}
              // Своя W модуля (после карандаша), не обязательно = ширина зоны.
              if (targetFurniture) {
                const ownW =
                  Math.round(Number(targetFurniture.userData?.customWidthMm) || 0) ||
                  Math.round(Number(targetFurniture.userData?.__initialSectionSizeMm?.x) || 0);
                if (ownW > 50) moduleWidthMm = ownW;
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

        // НМ: свободно min…(Dwtв€’40в€’10); спереди всегда −40, сзади ≥10.
        if (isKitchenBaseModule && kitchenCarcassBounds) {
          depthMinCm = kitchenCarcassBounds.minCm;
          depthMaxCm = kitchenCarcassBounds.maxCm;
          bodyText =
            'Глубина корпуса НМ. Спереди всегда −40 мм от торца столешницы; сзади не меньше 10 мм (можно больше). Диапазон: ' +
            String(depthMinCm).replace('.', ',') +
            '…' +
            String(depthMaxCm).replace('.', ',') +
            ' см.';
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
        let _activeBandForWidth = 'base';
        try {
          _activeBandForWidth = resolveActiveKitchenBandEditId(
            getKitchenBandGridsViewState()
          );
        } catch (_) {
          _activeBandForWidth = 'base';
        }
        const _editBandGridOnly =
          _activeBandForWidth === 'mid' || _activeBandForWidth === 'top';
        let _hasCustomWidth = false;
        if (secRef && secRef.division) {
          if (_editBandGridOnly) {
            try {
              const bw = resolveKitchenBandCustomZoneWidthsMmForEdit(
                secRef,
                _activeBandForWidth
              );
              _hasCustomWidth =
                !!bw &&
                Number.isFinite(Number(bw[zoneIndex] ?? bw[String(zoneIndex)]));
            } catch (_) {
              _hasCustomWidth = false;
            }
          } else {
            _hasCustomWidth =
              !!secRef.division.customZoneWidthsMm &&
              Number.isFinite(
                Number(secRef.division.customZoneWidthsMm[zoneIndex])
              );
          }
        }

        // Пустая зона: только ширина (customZoneWidthsMm) — до установки мебели.
        // MID/TOP: сетка пояса — тот же карандаш / «Настройка зоны», без place верхних.
        const zoneHasFurniture = !!(
          (furnitureGroup && furnitureGroup.isObject3D && furnitureGroup.parent) ||
          __findFurnitureGroupForZone(sectionId, zoneIndex)
        );
        if (!zoneHasFurniture || _editBandGridOnly) {
          title = 'Настройка зоны';
          isStandaloneFloorModule = false;
          showFloorClearanceField = false;
          showModuleWidthField = true;
        }
        // Пустая угловая спец — разворот ячейки без модуля.
        const isEmptyCornerSpecialZone =
          !zoneHasFurniture &&
          !!secRef?.lShape &&
          __isKitchenCornerSpecialZone(sectionId, zoneIndex);

        if (isUpperCornerModuleEdit && zoneHasFurniture) {
          title = 'Настройка углового навесного';
        } else if (isBaseCornerModuleEdit && zoneHasFurniture) {
          title = 'Настройка углового нижнего';
        }

        const zoneIndexNum = Number(zoneIndex);
        const zoneIndexMatches = (udZi) =>
          Number.isFinite(zoneIndexNum) && Number(udZi) === zoneIndexNum;

        // Модуль с этого карандаша (не любой из зоны — в пироге base/mid/top).
        function findFurnitureInZone(sec) {
          let targetFurniture = null;
          const preferUuid =
            furnitureGroup && furnitureGroup.isObject3D
              ? String(furnitureGroup.uuid || '')
              : '';
          const tryPick = (obj, { requireUuid = false } = {}) => {
            if (!obj || !obj.userData) return;
            const ud = obj.userData;
            if (!ud.isFurniture) return;
            if (String(ud.sectionId) !== String(sectionId)) return;
            if (!zoneIndexMatches(ud.zoneIndex)) return;
            if (requireUuid && preferUuid && String(obj.uuid) !== preferUuid) return;
            targetFurniture = obj;
          };
          // 1) Тот же Object3D с карандаша (после rebuild parent обычно жив).
          if (furnitureGroup && furnitureGroup.isObject3D && furnitureGroup.parent) {
            const udFg = furnitureGroup.userData || {};
            if (
              udFg.isFurniture &&
              String(udFg.sectionId) === String(sectionId) &&
              zoneIndexMatches(udFg.zoneIndex)
            ) {
              targetFurniture = furnitureGroup;
            }
          }
          // 2) По uuid — если ссылка на icon устарела после rebuild.
          if (!targetFurniture && preferUuid && state.scene) {
            state.scene.traverse((obj) => {
              if (targetFurniture) return;
              tryPick(obj, { requireUuid: true });
            });
          }
          if (!targetFurniture && state.furniture && state.furniture.group) {
            tryPick(state.furniture.group);
          }
          // 3) Пирог: предпочесть НМ/НМУ (base), не mid/top в той же зоне.
          if (!targetFurniture && state.scene) {
            let floorHit = null;
            let anyHit = null;
            state.scene.traverse((obj) => {
              if (!obj?.userData?.isFurniture) return;
              const ud = obj.userData;
              if (String(ud.sectionId) !== String(sectionId)) return;
              if (!zoneIndexMatches(ud.zoneIndex)) return;
              if (!anyHit) anyHit = obj;
              const pk = String(
                ud.__placementKindProfileId || ud.__placementKind || ''
              ).trim();
              if (
                !floorHit &&
                (pk === 'kitchen_base' ||
                  pk === 'kitchen_base_gola' ||
                  pk === 'kitchen_base_corner')
              ) {
                floorHit = obj;
              }
            });
            targetFurniture = floorHit || anyHit;
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

            // Пенал: 560 к стене (rear=0), не стек НМ.
            if (__isKitchenTallFurniture(targetFurniture)) {
              const fn =
                typeof window.__cldKitchenBaseEngine?.rebuildTallForCellDepthMm === 'function'
                  ? window.__cldKitchenBaseEngine.rebuildTallForCellDepthMm.bind(
                      window.__cldKitchenBaseEngine
                    )
                  : typeof window.__cldKitchenBaseEngine?.rebuildForCellDepthMm === 'function'
                    ? window.__cldKitchenBaseEngine.rebuildForCellDepthMm.bind(
                        window.__cldKitchenBaseEngine
                      )
                    : null;
              if (typeof fn !== 'function') {
                console.warn('[KITCHEN-DEPTH] tall depth rebuild missing');
                return false;
              }
              const r = fn(targetFurniture, sec, Math.round(newDepthCm * 10));
              if (!r?.ok) {
                console.warn('[KITCHEN-DEPTH] tall depth rebuild failed', {
                  sectionId,
                  zoneIndex,
                  newDepthCm,
                  r,
                });
                return false;
              }
              if (typeof window.recalcFurniturePricingAfterGeometryChange === 'function') {
                window.recalcFurniturePricingAfterGeometryChange();
              }
              return true;
            }

            // НМ: parametric Z корпуса + посадка −40 от переда столешницы (не scale).
            if (__isKitchenBaseFurniture(targetFurniture)) {
              const fn =
                typeof window.__clodisRebuildKitchenBaseForCellDepthMm === 'function'
                  ? window.__clodisRebuildKitchenBaseForCellDepthMm
                  : window.__cldKitchenBaseEngine?.rebuildForCellDepthMm;
              if (typeof fn !== 'function') {
                console.warn('[KITCHEN-DEPTH] rebuildForCellDepthMm missing');
                return false;
              }
              // Глубина только этого НМ. НМУ соседа не трогаем (свой карандаш / place из project).
              const r = fn(targetFurniture, sec, Math.round(newDepthCm * 10), {
                followCorner: false,
              });
              if (!r?.ok) {
                console.warn('[KITCHEN-DEPTH] NM depth rebuild failed', {
                  sectionId,
                  zoneIndex,
                  newDepthCm,
                  r,
                });
                return false;
              }
              console.warn('[KITCHEN-DEPTH] after NM depth', {
                sectionId,
                zoneIndex,
                newDepthCm,
                r,
                scenePreset: window.__cldSceneViewPreset,
                roomEditOpen: !!window.__cldRoomEditOpen,
                roomEditView: window.__cldRoomEditView,
                shapePlan: !!window.__cldKitchenShapePlan,
                xray: !!window.__cldRoomFurnitureXray,
              });
              if (typeof window.recalcFurniturePricingAfterGeometryChange === 'function') {
                window.recalcFurniturePricingAfterGeometryChange();
              }
              return true;
            }

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

        /** Столешница ряда на стене → все НМ под ней (план 10+корпус+40). */
        function applyKitchenWorktopDepthCm(newWorktopCm) {
          try {
            if (!isFinite(newWorktopCm) || newWorktopCm <= 0) return false;
            const wall =
              kitchenWallName ||
              secRef?.wallName ||
              (secRef?.division && secRef.division.wallName) ||
              'back';
            const fn =
              typeof window.__clodisApplyKitchenWorktopDepthOnWall === 'function'
                ? window.__clodisApplyKitchenWorktopDepthOnWall
                : window.__cldKitchenBaseEngine?.applyWorktopDepthOnWall;
            if (typeof fn !== 'function') {
              console.warn('[KITCHEN-DEPTH] applyWorktopDepthOnWall missing');
              return false;
            }
            const r = fn(wall, Math.round(newWorktopCm * 10));
            if (!r?.ok) {
              console.warn('[KITCHEN-DEPTH] worktop apply failed', { wall, newWorktopCm, r });
              return false;
            }
            if (!(r.updated > 0)) {
              console.warn('[KITCHEN-DEPTH] worktop apply: 0 modules updated', {
                wall,
                newWorktopCm,
                r,
              });
            }
            console.warn('[KITCHEN-DEPTH] after worktop depth', {
              wall,
              newWorktopCm,
              r,
              scenePreset: window.__cldSceneViewPreset,
              roomEditOpen: !!window.__cldRoomEditOpen,
              roomEditView: window.__cldRoomEditView,
              shapePlan: !!window.__cldKitchenShapePlan,
              xray: !!window.__cldRoomFurnitureXray,
            });
            if (typeof window.recalcFurniturePricingAfterGeometryChange === 'function') {
              window.recalcFurniturePricingAfterGeometryChange();
            }
            return true;
          } catch (e) {
            console.warn('⚠️ Ошибка применения глубины столешницы:', e);
            return false;
          }
        }

        // НМ/НМУ: ширина = вся ячейка/зона (customZoneWidthsMm + sync модуля).
        // MID/TOP (Ячейки): только kitchenBandGrids — без place верхних.
        // Прочие модули: только корпус. Пустая зона → customZoneWidthsMm.
        function applyModuleWidthCm(newWidthCm) {
          try {
            if (!isFinite(newWidthCm) || newWidthCm <= 0) return;
            const mm = newWidthCm * 10;
            const sec =
              (state.customSections || []).find(
                (s) => String(s.id) === String(sectionId)
              ) || null;
            let bandEditId = 'base';
            try {
              bandEditId = resolveActiveKitchenBandEditId(
                getKitchenBandGridsViewState()
              );
            } catch (_) {
              bandEditId = 'base';
            }
            if (bandEditId === 'mid' || bandEditId === 'top') {
              if (typeof window.__clodisSetZoneCustomWidthMm !== 'function') {
                console.warn('[ZONE-WIDTH] applyModuleWidthCm: __clodisSetZoneCustomWidthMm missing');
                return;
              }
              console.log('[ZONE-WIDTH] applyModuleWidthCm (band grid)', {
                sectionId,
                zoneIndex,
                bandId: bandEditId,
                widthCm: newWidthCm,
                widthMm: mm,
              });
              window.__clodisSetZoneCustomWidthMm(sectionId, zoneIndex, mm);
              return;
            }
            const tf = sec ? findFurnitureInZone(sec) : null;
            const kitchenCell =
              !!tf &&
              (isKitchenBaseModule ||
                __isKitchenCornerModuleFurniture(tf) ||
                __isKitchenBaseFurniture(tf));
            if (kitchenCell) {
              if (typeof window.__clodisSetZoneCustomWidthMm !== 'function') {
                console.warn('[ZONE-WIDTH] applyModuleWidthCm: __clodisSetZoneCustomWidthMm missing');
                return;
              }
              console.log('[ZONE-WIDTH] applyModuleWidthCm (kitchen cell)', {
                sectionId,
                zoneIndex,
                widthCm: newWidthCm,
                widthMm: mm,
                uuid: tf.uuid,
              });
              window.__clodisSetZoneCustomWidthMm(sectionId, zoneIndex, mm);
              if (typeof window.scheduleRebuildAllDimensionLines === 'function') {
                window.scheduleRebuildAllDimensionLines();
              } else if (typeof window.rebuildAllDimensionLines === 'function') {
                window.rebuildAllDimensionLines();
              }
              return;
            }
            if (tf) {
              console.log('[MODULE-WIDTH] applyModuleWidthCm', {
                sectionId,
                zoneIndex,
                widthCm: newWidthCm,
                widthMm: mm,
                uuid: tf.uuid,
                productKind: tf.userData?.productKind,
              });
              if (typeof window.__clodisApplyModuleCustomWidthCm === 'function') {
                const ok = window.__clodisApplyModuleCustomWidthCm(tf, sec, newWidthCm);
                if (!ok) {
                  console.warn('[MODULE-WIDTH] rebuild failed', {
                    sectionId,
                    zoneIndex,
                    newWidthCm,
                  });
                }
              } else {
                console.warn('[MODULE-WIDTH] __clodisApplyModuleCustomWidthCm missing');
              }
              return;
            }
            if (typeof window.__clodisSetZoneCustomWidthMm !== 'function') {
              console.warn('[ZONE-WIDTH] applyModuleWidthCm: __clodisSetZoneCustomWidthMm missing');
              return;
            }
            console.log('[ZONE-WIDTH] applyModuleWidthCm (empty zone)', {
              sectionId,
              zoneIndex,
              widthCm: newWidthCm,
              widthMm: mm,
            });
            window.__clodisSetZoneCustomWidthMm(sectionId, zoneIndex, mm);
            try {
              if (typeof window.__cldSyncKitchenBandGridsView === 'function') {
                window.__cldSyncKitchenBandGridsView();
              }
            } catch (_) {}
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

        const showDoorHandField = zoneHasFurniture && zoneDoorKind === 'single';

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
          const initialWorktopCmForModal = Math.min(
            Math.max(
              parseFloat(String(worktopDepthCmText).replace(',', '.')) || 60,
              worktopMinCm
            ),
            worktopMaxCm
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
          const initialSideWallClearanceMmForModal = Math.min(
            Math.max(
              Math.round(
                parseFloat(String(sideWallClearanceMmText).replace(',', '.')) || 10
              ),
              sideWallClearanceMinMm
            ),
            sideWallClearanceMaxMm
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
                ${
                  zoneHasFurniture && isKitchenTallModule
                    ? `
                <div class="cld-module-edit__field">
                  <div class="cld-module-edit__label-row">
                    <label class="cld-module-edit__label" for="step4-module-depth-input">Глубина пенала</label>
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
                  <div class="cld-module-edit__hint">К стене вплотную (зад = 0). Перед совпадает с корпусом НМ; столешка выпирает +4 см. Обычно 56 см.</div>
                </div>
                `
                    : zoneHasFurniture && isKitchenBaseModule
                    ? `
                <div class="cld-module-edit__field">
                  <div class="cld-module-edit__label-row">
                    <label class="cld-module-edit__label" for="step4-kitchen-worktop-depth-input">Глубина столешницы</label>
                  </div>
                  <div class="cld-module-edit__input-wrap">
                    <span id="step4-kitchen-worktop-depth-valid-indicator" class="cld-module-edit__validity" data-field-state="valid" aria-hidden="true"></span>
                    <input
                      id="step4-kitchen-worktop-depth-input"
                      class="cld-module-edit__input"
                      type="number"
                      step="0.1"
                      min="${worktopMinCm}"
                      max="${worktopMaxCm}"
                      value="${initialWorktopCmForModal}"
                    />
                    <span class="cld-module-edit__unit">см</span>
                  </div>
                  <div class="cld-module-edit__hint">На всю секцию/ряд. Спереди корпуса всегда −4 см; сзади ≥1 см. НМ по умолчанию = столешка −5 см.</div>
                </div>
                <div class="cld-module-edit__field">
                  <div class="cld-module-edit__label-row">
                    <label class="cld-module-edit__label" for="step4-module-depth-input">Глубина НМ</label>
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
                  <div class="cld-module-edit__hint">Только этот модуль. От ${String(depthMinCm).replace('.', ',')} до ${String(depthMaxCm).replace('.', ',')} см (перед всегда −4 см).</div>
                </div>
                `
                    : zoneHasFurniture
                    ? `
                <div class="cld-module-edit__field">
                  <div class="cld-module-edit__label-row">
                    <label class="cld-module-edit__label" for="step4-module-depth-input">${depthFieldLabel}</label>
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
                `
                    : ''
                }
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
                  showSideWallClearanceField
                    ? `
                <div class="cld-module-edit__field">
                  <div class="cld-module-edit__label-row">
                    <label class="cld-module-edit__label" for="step4-module-side-wall-clearance-input">Отступ от стены</label>
                  </div>
                  <div class="cld-module-edit__input-wrap">
                    <span id="step4-module-side-wall-clearance-valid-indicator" class="cld-module-edit__validity" data-field-state="valid" aria-hidden="true"></span>
                    <input
                      id="step4-module-side-wall-clearance-input"
                      class="cld-module-edit__input"
                      type="number"
                      step="1"
                      min="${sideWallClearanceMinMm}"
                      max="${sideWallClearanceMaxMm}"
                      value="${initialSideWallClearanceMmForModal}"
                    />
                    <span class="cld-module-edit__unit">мм</span>
                  </div>
                  <div class="cld-module-edit__hint">Щель НМУ до боковой стены. По умолчанию 10 мм.</div>
                </div>
                `
                    : ''
                }
                ${
                  showModuleWidthField
                    ? `
                <div class="cld-module-edit__field">
                  <div class="cld-module-edit__label-row">
                    <label class="cld-module-edit__label" for="step4-module-width-input">${zoneHasFurniture ? 'Ширина модуля' : 'Ширина зоны'}</label>
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
                  !zoneHasFurniture && showModuleWidthField && !secRef?.lShape
                    ? `
                <div class="cld-module-edit__field">
                  <div class="cld-module-edit__hint">Ширина ячейки низа (BASE). Соседи подстроятся. Объединить/разделить — позже.</div>
                </div>
                `
                    : ''
                }
                ${
                  !zoneHasFurniture &&
                  showModuleWidthField &&
                  !!secRef?.lShape &&
                  !isEmptyCornerSpecialZone
                    ? `
                <div class="cld-module-edit__field">
                  <div class="cld-module-edit__hint">Угловая сетка L: обычная ячейка на плече.</div>
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
                ${
                  isEmptyCornerSpecialZone || isBaseCornerModuleEdit
                    ? `
                <div class="cld-module-edit__field">
                  <button type="button" id="step4-module-reorient-corner-btn" class="cld-module-edit__save" style="width:100%;">
                    Развернуть нижнюю ячейку
                  </button>
                  <div class="cld-module-edit__hint">${
                    isEmptyCornerSpecialZone
                      ? 'Низ без модуля: тот же угол, длинная сторона на перпендикуляр (W≈1050).'
                      : 'Низ: тот же угол → длинная на перпендикуляр.'
                  }</div>
                </div>
                `
                    : ''
                }
                ${
                  isEmptyCornerSpecialZone || isUpperCornerModuleEdit
                    ? `
                <div class="cld-module-edit__field">
                  <button type="button" id="step4-module-reorient-upper-corner-btn" class="cld-module-edit__save" style="width:100%;">
                    Развернуть верхнюю ячейку (600)
                  </button>
                  <div class="cld-module-edit__hint">Верх пирога: W=600, без отступа низа. Низ не двигается.</div>
                </div>
                `
                    : ''
                }
                ${
                  zoneHasFurniture &&
                  (isKitchenBaseModule ||
                    isKitchenWallMidModule ||
                    isKitchenWallTopModule ||
                    isKitchenTallModule) &&
                  moduleEditSidePanelsUd
                    ? buildKitchenSidePanelsModuleEditHtml(
                        readSidePanelsForModuleEdit(moduleEditSidePanelsUd),
                        {
                          replacementEnabled: (() => {
                            try {
                              const rootsRaw =
                                typeof window.__cldReadUserDataClodisRoots === 'function'
                                  ? window.__cldReadUserDataClodisRoots(moduleEditSidePanelsUd)
                                  : moduleEditSidePanelsUd.clodisJSON || null;
                              if (!rootsRaw) return false;
                              const clone = JSON.parse(
                                JSON.stringify(Array.isArray(rootsRaw) ? rootsRaw : [rootsRaw])
                              );
                              const fn = window.__cldKitchenSidePanelReplacementSupported;
                              if (typeof fn !== 'function') return false;
                              return !!fn(clone)?.ok;
                            } catch (_) {
                              return false;
                            }
                          })(),
                        }
                      )
                    : ''
                }
                ${
                  zoneHasFurniture
                    ? `
                <button type="button" id="step4-module-delete-btn" class="cld-module-edit__delete">
                  <i class="fas fa-trash-alt" aria-hidden="true"></i>
                  <span>Удалить модуль</span>
                </button>
                `
                    : ''
                }
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
          if (zoneHasFurniture) {
            try {
              applyModuleEditFocusFog(sectionId, zoneIndex, furnitureGroup);
            } catch (e) {
              console.warn('[MODULE-FOCUS] apply failed', e);
            }
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
          const reorientCornerBtn = document.getElementById(
            'step4-module-reorient-corner-btn'
          );
          if (reorientCornerBtn) {
            reorientCornerBtn.onclick = function (ev) {
              ev.preventDefault();
              ev.stopPropagation();
              try {
                const sec =
                  (state.customSections || []).find(
                    (s) => String(s.id) === String(sectionId)
                  ) || null;
                const tf = sec ? findFurnitureInZone(sec) : null;
                // Низ: без модуля — ячейка; с НМУ — ячейка+модуль. ВМУ сюда не путать.
                let r;
                const isWallTf =
                  tf &&
                  (typeof window.__cldIsKitchenWallCornerGroup === 'function'
                    ? window.__cldIsKitchenWallCornerGroup(tf)
                    : String(tf.userData?.__placementKindProfileId || '') ===
                      'kitchen_wall_corner');
                if (!tf || isWallTf) {
                  const fn =
                    typeof reorientKitchenCornerCell === 'function'
                      ? reorientKitchenCornerCell
                      : typeof window.__cldReorientKitchenCornerCell === 'function'
                        ? window.__cldReorientKitchenCornerCell
                        : null;
                  r = fn
                    ? fn(sectionId, zoneIndex)
                    : {
                        ok: false,
                        message: 'Разворот нижней ячейки не загружен — refresh ?v=vmu4.',
                      };
                } else {
                  r =
                    typeof reorientKitchenCornerModule === 'function'
                      ? reorientKitchenCornerModule(tf)
                      : { ok: false, message: 'Функция разворота не загружена.' };
                }
                if (!r?.ok) {
                  const msg =
                    r?.message || 'Не удалось развернуть угловую ячейку.';
                  if (typeof window.showToast === 'function') {
                    window.showToast(msg, 'warning');
                  } else {
                    console.warn('[CORNER-CELL]', msg);
                  }
                  return;
                }
                if (typeof window.showToast === 'function' && r.message) {
                  window.showToast(r.message, 'success');
                }
                closeModal();
                try {
                  if (typeof window.__cldRebuildSectionZoneEditIconsForSection === 'function') {
                    window.__cldRebuildSectionZoneEditIconsForSection(sectionId);
                    if (sec?.lShape?.pairId != null) {
                      window.__cldRebuildSectionZoneEditIconsForSection(sec.lShape.pairId);
                    }
                  }
                } catch (_) {}
              } catch (e) {
                console.warn('[CORNER-CELL] click failed', e);
              }
            };
          }
          const reorientUpperBtn = document.getElementById(
            'step4-module-reorient-upper-corner-btn'
          );
          if (reorientUpperBtn) {
            reorientUpperBtn.onclick = function (ev) {
              ev.preventDefault();
              ev.stopPropagation();
              try {
                const fn =
                  typeof reorientKitchenUpperCornerCell === 'function'
                    ? reorientKitchenUpperCornerCell
                    : typeof window.__cldReorientKitchenUpperCornerCell === 'function'
                      ? window.__cldReorientKitchenUpperCornerCell
                      : null;
                const r = fn
                  ? fn(sectionId, zoneIndex)
                  : {
                      ok: false,
                      message: 'Разворот верхней ячейки не загружен — refresh ?v=vmu4.',
                    };
                if (!r?.ok) {
                  const msg = r?.message || 'Не удалось развернуть верхнюю ячейку.';
                  if (typeof window.showToast === 'function') {
                    window.showToast(msg, 'warning');
                  } else {
                    console.warn('[CORNER-CELL-UPPER]', msg);
                  }
                  return;
                }
                if (typeof window.showToast === 'function' && r.message) {
                  window.showToast(r.message, 'success');
                }
                closeModal();
                try {
                  if (typeof window.__cldRebuildSectionZoneEditIconsForSection === 'function') {
                    window.__cldRebuildSectionZoneEditIconsForSection(sectionId);
                  }
                } catch (_) {}
              } catch (e) {
                console.warn('[CORNER-CELL-UPPER] click failed', e);
              }
            };
          }
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

          function assessSideWallClearanceInput(raw, val) {
            const s = _normalizeNumRaw(raw);
            if (_isIncompleteNumericRaw(s) || !Number.isFinite(val)) {
              return { state: 'pending', showModal: false, reason: 'sideWallClearanceRange' };
            }
            if (val < sideWallClearanceMinMm) {
              if (_canBecomeValidInRange(val, sideWallClearanceMinMm, sideWallClearanceMaxMm)) {
                return { state: 'pending', showModal: false, reason: 'sideWallClearanceRange' };
              }
              return { state: 'invalid', showModal: true, reason: 'sideWallClearanceRange' };
            }
            if (val > sideWallClearanceMaxMm) {
              if (_canBecomeValidInRange(val, sideWallClearanceMinMm, sideWallClearanceMaxMm)) {
                return { state: 'pending', showModal: false, reason: 'sideWallClearanceRange' };
              }
              return { state: 'invalid', showModal: true, reason: 'sideWallClearanceRange' };
            }
            return { state: 'valid', showModal: false, reason: 'sideWallClearanceRange' };
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
            } else if (reason === 'sideWallClearanceRange') {
              text =
                `Введённый отступ от стены выходит за допустимые пределы. ` +
                `Выберите значение от ${sideWallClearanceMinMm} до ${sideWallClearanceMaxMm} мм.`;
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
          let appliedWorktopCm = initialWorktopCmForModal;
          let appliedHeightCm = initialHeightCmForModal;
          let appliedFloorClearanceCm = initialFloorClearanceCmForModal;
          let appliedSideWallClearanceMm = initialSideWallClearanceMmForModal;
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
            // Пустая зона / нет поля глубины — не блокируем Save (иначе ширина не пишется).
            if (!document.getElementById('step4-module-depth-input')) return true;
            const raw = opts.raw != null ? opts.raw : String(val);
            const showModal = opts.showModal !== false;
            // НМ / пенал: непрерывный диапазон; sectionDepth не ограничивает.
            const assess =
              isKitchenBaseModule || isKitchenTallModule
              ? (() => {
                  const s = _normalizeNumRaw(raw);
                  if (_isIncompleteNumericRaw(s) || !Number.isFinite(val)) {
                    return { state: 'pending', showModal: false, reason: 'range' };
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
                  return { state: 'valid', showModal: false, reason: 'range' };
                })()
              : assessDepthInput(raw, val);
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
            console.log('[MODULE-RESIZE][LIVE] depth', {
              val,
              sectionId,
              zoneIndex: zoneIndexNum,
              kitchen: isKitchenBaseModule,
            });
            return true;
          }

          function tryApplyWorktopVal(val, opts = {}) {
            if (!isKitchenBaseModule) return true;
            const raw = opts.raw != null ? opts.raw : String(val);
            const showModal = opts.showModal !== false;
            const s = _normalizeNumRaw(raw);
            if (_isIncompleteNumericRaw(s) || !Number.isFinite(val)) {
              return opts.allowPending === true;
            }
            if (val < worktopMinCm || val > worktopMaxCm) {
              if (showModal) {
                showDepthLimitModal('range', {
                  inputId: 'step4-kitchen-worktop-depth-input',
                  indicatorId: 'step4-kitchen-worktop-depth-valid-indicator',
                  fieldKind: 'depth',
                  value: appliedWorktopCm,
                });
              }
              return false;
            }
            if (
              isFinite(appliedWorktopCm) &&
              Math.abs(val - appliedWorktopCm) < DEPTH_UNCHANGED_EPS_CM
            ) {
              return true;
            }
            if (!applyKitchenWorktopDepthCm(val)) return false;
            appliedWorktopCm = val;
            // После смены столешки: диапазон НМ и дефолт = max (Dwtв€’40в€’10).
            kitchenCarcassBounds = __kitchenCarcassDepthBoundsCm(Math.round(val * 10));
            depthMinCm = kitchenCarcassBounds.minCm;
            depthMaxCm = kitchenCarcassBounds.maxCm;
            const defaultCm = kitchenCarcassBounds.ok
              ? kitchenCarcassBounds.defaultCm
              : appliedDepthCm;
            const depthEl = document.getElementById('step4-module-depth-input');
            if (depthEl) {
              depthEl.min = String(depthMinCm);
              depthEl.max = String(depthMaxCm);
              if (Number.isFinite(defaultCm)) {
                appliedDepthCm = defaultCm;
                depthEl.value = String(defaultCm);
              }
            } else if (Number.isFinite(defaultCm)) {
              appliedDepthCm = defaultCm;
            }
            console.log('[MODULE-RESIZE][LIVE] worktop', {
              val,
              sectionId,
              wall: kitchenWallName,
            });
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

          function tryApplySideWallClearanceVal(mmRaw, opts = {}) {
            if (!showSideWallClearanceField) return true;
            const raw = opts.raw != null ? opts.raw : String(mmRaw);
            const showModal = opts.showModal !== false;
            const val = Number(mmRaw);
            const assess = assessSideWallClearanceInput(raw, val);
            if (assess.state === 'pending') return opts.allowPending === true;
            if (assess.state === 'invalid') {
              if (showModal) {
                showDepthLimitModal(assess.reason, {
                  inputId: 'step4-module-side-wall-clearance-input',
                  indicatorId: 'step4-module-side-wall-clearance-valid-indicator',
                  fieldKind: 'sideWallClearance',
                  value: appliedSideWallClearanceMm,
                });
              }
              return false;
            }
            const clear = Math.max(0, Math.round(val));
            if (
              Number.isFinite(appliedSideWallClearanceMm) &&
              Math.abs(clear - appliedSideWallClearanceMm) < 0.5
            ) {
              return true;
            }
            const sec =
              (state.customSections || []).find(
                (s) => String(s.id) === String(sectionId)
              ) || null;
            const tf = sec ? findFurnitureInZone(sec) : null;
            if (!tf) return false;
            const ud = tf.userData || (tf.userData = {});
            ud.__kitchenSideWallClearanceMm = clear;
            // Карандаш отступа: приставка = worktopв€’40в€’clear; нога/фасад стоят.
            // (Ширина ячейки сама приставку не трогает — stamp здесь.)
            const wt =
              Math.round(Number(ud.__kitchenWorktopDepthMm) || 0) || 600;
            const retD = Math.max(150, Math.round(wt - 40 - clear));
            ud.__kitchenCornerReturnMm = retD;
            const layout = window.__cldKitchenSectionLayout;
            const cellW =
              Math.round(Number(ud.__kitchenCellWidthMm) || Number(ud.customWidthMm) || 0) ||
              Math.round(Number(layout?.resolveKitchenCornerSpecialWidthMm?.()) || 1050);
            ud.__kitchenCellWidthMm = cellW;
            ud.customWidthMm = cellW;
            // Корпус = ячейка−clear; фасад на месте, уезжает край у стены.
            // Якорь facade — не путать с шириной ячейки (там wall).
            const rebuildW =
              typeof window.__clodisRebuildKitchenBaseForCellWidthMm === 'function'
                ? window.__clodisRebuildKitchenBaseForCellWidthMm
                : window.__cldKitchenBaseEngine?.rebuildForCellWidthMm;
            let rebuilt = false;
            try {
              if (typeof rebuildW === 'function') {
                const r = rebuildW(tf, sec, cellW, { anchor: 'facade' });
                rebuilt = !!(r && r.ok !== false);
              }
            } catch (e) {
              console.warn('[MODULE-RESIZE][LIVE] sideWallClearance rebuild failed', e);
            }
            if (!rebuilt) {
              try {
                if (layout && typeof layout.buildKitchenCornerReturnVars === 'function') {
                  const atMin = ud.__kitchenCornerSideAtMinU === true;
                  // Как 1.42: приставка = worktopв€’40в€’clear (нога не жмётся).
                  const wt =
                    Math.round(Number(ud.__kitchenWorktopDepthMm) || 0) || 600;
                  const retD = Math.max(150, Math.round(wt - 40 - clear));
                  const cornerVars = layout.buildKitchenCornerReturnVars(
                    cellW,
                    atMin,
                    retD,
                    clear,
                    clear
                  );
                  const readVars = window.__cldReadUserDataClodisVariables;
                  const prevRaw =
                    typeof readVars === 'function' ? readVars(ud) : ud.__clodisVariables;
                  const prev =
                    prevRaw && typeof prevRaw === 'object' ? { ...prevRaw } : {};
                  ud.__clodisVariables = { ...prev, ...cornerVars };
                }
              } catch (_) {}
            }
            try {
              const wall = String(sec?.wallName || ud.wallName || kitchenWallName || '').trim();
              const ov = window.__cldKitchenRunOverlays;
              if (wall && ov && typeof ov.syncKitchenRunOverlaysOnWall === 'function') {
                ov.syncKitchenRunOverlaysOnWall(wall);
              }
            } catch (_) {}
            appliedSideWallClearanceMm = clear;
            try {
              if (typeof window.scheduleRebuildAllDimensionLines === 'function') {
                window.scheduleRebuildAllDimensionLines();
              } else if (typeof window.rebuildAllDimensionLines === 'function') {
                window.rebuildAllDimensionLines();
              }
            } catch (_) {}
            console.log('[MODULE-RESIZE][LIVE] sideWallClearance', {
              clearMm: clear,
              cellW,
              rebuilt,
              retX: ud.__kitchenCornerReturnMm,
              carcassZ: ud.__kitchenCarcassDepthMm,
              rear: ud.__kitchenRearOverhangMm,
              sectionId,
              zoneIndex: zoneIndexNum,
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

          document
            .querySelectorAll('#step4-module-hand-row .step4-module-hand-btn')
            .forEach((btn) => {
            if (btn._zoneHandBound) return;
            btn._zoneHandBound = true;
            btn.addEventListener('click', () => {
              const hand = btn.getAttribute('data-hand') || 'left';
              tryApplyZoneHand(hand);
            });
          });

          if (
            zoneHasFurniture &&
            (isKitchenBaseModule ||
              isKitchenWallMidModule ||
              isKitchenWallTopModule ||
              isKitchenTallModule)
          ) {
            try {
              bindKitchenSidePanelsModuleEdit({
                getGroup: () => {
                  const sec =
                    (state.customSections || []).find(
                      (s) => String(s.id) === String(sectionId)
                    ) || null;
                  return sec ? findFurnitureInZone(sec) : null;
                },
              });
            } catch (eSpUi) {
              console.warn('[SIDE-PANELS] module card bind failed', eSpUi);
            }
          }

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
              const sec =
                (state.customSections || []).find(
                  (s) => String(s.id) === String(sectionId)
                ) || null;
              const tf = sec ? findFurnitureInZone(sec) : null;
              if (tf && sec) {
                // К зоне: снять свою W, rebuild под layout зоны.
                let zoneMm =
                  actualZoneWidthMm != null
                    ? Math.round(Number(actualZoneWidthMm))
                    : Math.round(Number(sec._layoutCache?.moduleWidthsMm?.[zoneIndex]) || 0);
                if (!(zoneMm > 50)) {
                  zoneMm = Math.round(Number(sec.division?.partSize) || 0);
                }
                if (zoneMm > 50 && typeof window.__clodisApplyModuleCustomWidthCm === 'function') {
                  window.__clodisApplyModuleCustomWidthCm(tf, sec, zoneMm / 10);
                }
              } else if (typeof window.__clodisSetZoneCustomWidthMm === 'function') {
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

          const sideWallClrInput = document.getElementById(
            'step4-module-side-wall-clearance-input'
          );
          if (sideWallClrInput) {
            _bindNumericFieldInput(
              sideWallClrInput,
              assessSideWallClearanceInput,
              tryApplySideWallClearanceVal,
              'step4-module-side-wall-clearance-valid-indicator',
              'sideWallClearance',
              () => appliedSideWallClearanceMm
            );
          }

          if (depthInput) {
            _bindNumericFieldInput(
              depthInput,
              isKitchenBaseModule
                ? (raw, val) => {
                    const s = _normalizeNumRaw(raw);
                    if (_isIncompleteNumericRaw(s) || !Number.isFinite(val)) {
                      return { state: 'pending', showModal: false, reason: 'range' };
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
                    return { state: 'valid', showModal: false, reason: 'range' };
                  }
                : assessDepthInput,
              tryApplyDepthVal,
              'step4-module-depth-valid-indicator',
              'depth',
              () => appliedDepthCm
            );
          }

          const worktopInput = document.getElementById('step4-kitchen-worktop-depth-input');
          if (worktopInput && isKitchenBaseModule) {
            _bindNumericFieldInput(
              worktopInput,
              (raw, val) => {
                const s = _normalizeNumRaw(raw);
                if (_isIncompleteNumericRaw(s) || !Number.isFinite(val)) {
                  return { state: 'pending', showModal: false, reason: 'range' };
                }
                if (val < worktopMinCm || val > worktopMaxCm) {
                  if (_canBecomeValidInRange(val, worktopMinCm, worktopMaxCm)) {
                    return { state: 'pending', showModal: false, reason: 'range' };
                  }
                  return { state: 'invalid', showModal: true, reason: 'range' };
                }
                return { state: 'valid', showModal: false, reason: 'range' };
              },
              tryApplyWorktopVal,
              'step4-kitchen-worktop-depth-valid-indicator',
              'depth',
              () => appliedWorktopCm
            );
          }

          function commitModuleZoneEditSave() {
            const depthInputEl = document.getElementById('step4-module-depth-input');
            const worktopInputEl = document.getElementById(
              'step4-kitchen-worktop-depth-input'
            );
            const heightInputEl = document.getElementById('step4-module-height-input');
            const floorClrInputEl = document.getElementById(
              'step4-module-floor-clearance-input'
            );
            const sideWallClrInputEl = document.getElementById(
              'step4-module-side-wall-clearance-input'
            );
            const widthInputEl = document.getElementById('step4-module-width-input');
            const wtRaw = worktopInputEl ? worktopInputEl.value : '';
            const hRaw = heightInputEl ? heightInputEl.value : '';
            const cRaw = floorClrInputEl ? floorClrInputEl.value : '';
            const swRaw = sideWallClrInputEl ? sideWallClrInputEl.value : '';
            const wRaw = widthInputEl ? widthInputEl.value : '';
            const wtVal = parseFloat(_normalizeNumRaw(wtRaw));
            const hVal = parseFloat(_normalizeNumRaw(hRaw));
            const cVal = parseFloat(_normalizeNumRaw(cRaw));
            const swVal = parseFloat(_normalizeNumRaw(swRaw));
            const wVal = parseFloat(_normalizeNumRaw(wRaw));
            // Сначала столешница: список НМ и дефолт (max ≤ Dwt−40−10) обновляются в select.
            if (isKitchenBaseModule && worktopInputEl) {
              if (!tryApplyWorktopVal(wtVal, { raw: wtRaw })) return;
            }
            // Нет поля глубины (пустая зона) — не валим Save на «pending» глубине.
            if (depthInputEl) {
              const dRaw = depthInputEl.value;
              const dVal = parseFloat(_normalizeNumRaw(dRaw));
              if (!tryApplyDepthVal(dVal, { raw: dRaw })) return;
            }
            if (heightInputEl) {
              if (!tryApplyHeightVal(hVal, { raw: hRaw })) return;
            }
            if (floorClrInputEl) {
              if (!tryApplyFloorClearanceVal(cVal, { raw: cRaw })) return;
            }
            if (sideWallClrInputEl) {
              if (!tryApplySideWallClearanceVal(swVal, { raw: swRaw })) return;
            }
            if (showModuleWidthField || widthInputEl) {
              if (!tryApplyWidthVal(wVal, { raw: wRaw })) return;
            }
            if (!tryApplyZoneHand(appliedZoneHand)) return;
            const secAfter =
              (state.customSections || []).find(
                (s) => String(s.id) === String(sectionId)
              ) || null;
            const tfAfter = secAfter ? findFurnitureInZone(secAfter) : null;
            if (
              tfAfter &&
              !isStandaloneFloorModule &&
              !isKitchenBaseModule &&
              Number(tfAfter.userData?.customDepthMm || 0) > 0
            ) {
              alignSectionStandaloneFurnitureFront(tfAfter, secAfter);
            }
            // НМ / пенал: после save enforce на стене (пенал → rear=0).
            if (isKitchenBaseModule || isKitchenTallModule) {
              try {
                const wall =
                  kitchenWallName ||
                  secAfter?.wallName ||
                  'back';
                const depthApi = window.__cldKitchenDepthStack;
                if (
                  depthApi &&
                  typeof depthApi.enforceKitchenDepthStackOnAllModules === 'function'
                ) {
                  depthApi.enforceKitchenDepthStackOnAllModules(wall);
                }
              } catch (_) {}
            }
            console.log('[MODULE-RESIZE][SAVE] close modal', {
              kitchen: isKitchenBaseModule,
              tall: isKitchenTallModule,
            });
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
  window.__cldRebuildSectionZoneEditIconsForSection = rebuildSectionZoneEditIconsForSection;
  window.__cldRebuildAllSectionZoneEditIcons = rebuildAllSectionZoneEditIcons;
  window.applyModuleEditFocusFog = applyModuleEditFocusFog;
  window.clearModuleEditFocusFog = clearModuleEditFocusFog;
  window.isAllDimensionLabelsVisible = isAllDimensionLabelsVisible;
  window.setAllDimensionLabelsVisible = setAllDimensionLabelsVisible;
  window.toggleAllDimensionLabels = toggleAllDimensionLabels;
  window.invalidateGroupIconBBoxCache = invalidateGroupIconBBoxCache;
  window.invalidateAllFurnitureIconAnchors = invalidateAllFurnitureIconAnchors;
}
