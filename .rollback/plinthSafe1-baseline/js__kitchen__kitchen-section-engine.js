/**
 * Kitchen section engine (пїЅпїЅ) пїЅ пїЅпїЅпїЅпїЅпїЅпїЅ + пїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅ.
 * пїЅпїЅпїЅпїЅпїЅпїЅпїЅ: kitchen-depth-stack.js (пїЅпїЅпїЅпїЅпїЅ+10 > пїЅпїЅпїЅпїЅпїЅпїЅ > ?40 пїЅпїЅ пїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ 600).
 */
import { state } from '../utils/state.js';
// depth-stack пїЅпїЅ section-manager пїЅ пїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅ furniture-manager-engine пїЅпїЅпїЅпїЅпїЅпїЅ window API.
import {
  alignKitchenModuleBackToWall as alignDepthStack,
  enforceKitchenDepthStackPlacement as enforceDepthOne,
  enforceKitchenDepthStackOnAllModules as enforceDepthAll,
  measureKitchenNmDepthReport as measureDepth,
} from './kitchen-depth-stack.js?v=20261104-talltopd1';
import { syncKitchenRunOverlaysOnWall } from './kitchen-run-overlays.js?v=20261118-plinthSafe1';
import {
  buildKitchenEqualCellLayout,
  assignKitchenZonesSimple,
  isKitchenSectionLayoutActive,
  resolveKitchenWallCornerWidthMm,
  isKitchenStraightBaseBandSection,
  buildKitchenBandCellLayoutForSection,
  writeKitchenBandZoneWidthsMm,
  resolveKitchenBandCustomZoneWidthsMmForEdit,
} from './kitchen-section-layout.js?v=20261116-lCorner1050';
import {
  syncKitchenBaseInZoneToWidthMm,
  rebuildForCellWidthMm,
  isKitchenBaseGroup,
  isKitchenWallCornerGroup,
  isKitchenWallMidGroup,
  isKitchenWallTopGroup,
  isKitchenTallGroup,
  applyKitchenWallTopDepthForGroup,
  isKitchenTallColumnZone,
} from './kitchen-base-engine.js?v=20261115-upperGLeft27';
import {
  isKitchenBasePlacementKind,
  isKitchenTallPlacementKind,
  isKitchenWallMidPlacementKind,
  isKitchenWallTopPlacementKind,
} from '../sections/vertical-layout.js?v=20261104-talltopd1';
import {
  findSectionAtPosition,
  buildZoneSnapForSection,
  getZonePivotWorldPosition,
  fitFurnitureToSectionZone,
  alignFurnitureBBoxToSectionInnerBounds,
  getLShapeSpecialSnapBounds,
  getLShapeSpecialZoneIndex,
  getLShapeSpecialZoneIndices,
  L_CORNER_CONFIG,
} from '../sections/section-manager.js?v=20261104-talltopd1';
function rawPkFromFurnitureData(furnitureData) {
  if (!furnitureData || typeof furnitureData !== 'object') {
    return String(furnitureData || '').trim();
  }
  const stamp = String(furnitureData.__kitchenWallBand || '')
    .trim()
    .toLowerCase();
  if (stamp === 'top') return 'kitchen_wall_top';
  if (stamp === 'mid') return 'kitchen_wall_mid';
  const ct = String(
    furnitureData?.catalogItem?.catalog_type ||
      furnitureData?.catalogItem?.catalogType ||
      furnitureData?.catalogType ||
      furnitureData?.catalogItem?.element_type ||
      ''
  )
    .trim()
    .toLowerCase()
    .replace(/^catalog_/, '');
  if (ct === '51') return 'kitchen_wall_top';
  if (ct === '50' || ct === '42' || ct === '43') return 'kitchen_wall_mid';
  // Сырой kitchen_* раньше mapped placementKind (kitchen_tall > floor_in_niche).
  const fromCatalog =
    furnitureData?.catalogItem?.placementKind ||
    (furnitureData?.catalogItem?.data &&
    typeof furnitureData.catalogItem.data === 'object'
      ? furnitureData.catalogItem.data.placementKind
      : null) ||
    furnitureData.__placementKindProfileId ||
    furnitureData.placementKindProfileId;
  const pick = (v) =>
    typeof v === 'string' && v.trim() && v.trim() !== 'floor_in_niche'
      ? v.trim()
      : '';
  const catalogRaw = pick(fromCatalog);
  if (catalogRaw) return catalogRaw;
  const direct = pick(furnitureData.placementKind);
  if (direct) return direct;
  return String(furnitureData.placementKind || fromCatalog || '').trim();
}

/** @param {object|string} furnitureDataOrPk */
export function isKitchenNmPlacement(furnitureDataOrPk) {
  const raw = rawPkFromFurnitureData(furnitureDataOrPk);
  return (
    isKitchenBasePlacementKind(raw) ||
    isKitchenTallPlacementKind(raw) ||
    isKitchenWallMidPlacementKind(raw) ||
    isKitchenWallTopPlacementKind(raw) ||
    /kitchen_base/i.test(raw) ||
    /kitchen_tall/i.test(raw) ||
    /kitchen_wall_mid/i.test(raw) ||
    /kitchen_wall_top/i.test(raw)
  );
}

export function findKitchenSectionAtPosition(position) {
  return findSectionAtPosition(position);
}

export function computeKitchenSectionCells(sectionData) {
  if (!sectionData?.division) {
    return {
      partSize: 0,
      capCount: 0,
      sectionStart: 0,
      moduleWidthsMm: [],
      gapBeforeZone: [],
      segments: [],
    };
  }
  // L: пїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅ (пїЅпїЅпїЅпїЅ 1050), пїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅ пїЅ пїЅпїЅпїЅпїЅпїЅ place пїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅ.
  try {
    const cached = sectionData._layoutCache;
    if (
      cached &&
      Array.isArray(cached.segments) &&
      cached.segments.length > 0 &&
      getLShapeSpecialZoneIndex(sectionData) != null
    ) {
      return cached;
    }
  } catch (_) {}
  const division = sectionData.division;
  const parts = Math.max(0, Math.floor(Number(division.parts) || 0));
  const sectionStart = Number(division.sectionStart) || 0;
  const sectionWidth =
    Number(division.sectionWidth) ||
    Number(division.sectionEnd) - sectionStart ||
    parts * (Number(division.partSize) || 0);
  let customZoneWidthsMm =
    division.customZoneWidthsMm || sectionData.customZoneWidthsMm || null;
  // ???? ????????: 1050 ? custom ??? ???? ????? ? (0 ? parts-1), ?? ?????? zi=0.
  try {
    const specialZis = getLShapeSpecialZoneIndices(sectionData);
    if (Array.isArray(specialZis) && specialZis.length) {
      customZoneWidthsMm = {
        ...(customZoneWidthsMm && typeof customZoneWidthsMm === 'object'
          ? customZoneWidthsMm
          : {}),
      };
      for (const specialZi of specialZis) {
        const sp = getLShapeSpecialSnapBounds(division, specialZi);
        const wSp = sp?.moduleWidth > 0 ? Math.round(sp.moduleWidth) : 0;
        if (wSp > 0) customZoneWidthsMm[specialZi] = wSp;
      }
    }
  } catch (_) {}
  return buildKitchenEqualCellLayout({
    sectionStart,
    sectionWidth: Math.max(0, sectionWidth),
    parts,
    customZoneWidthsMm,
    minModuleW: 300,
  });
}

export function assignKitchenZoneIndices(furniture, parts, axis) {
  return assignKitchenZonesSimple(furniture, parts, axis);
}

export function buildKitchenCellSnap(section, zoneIndex, wallNameOpt) {
  return buildZoneSnapForSection(section, zoneIndex, wallNameOpt);
}

export function getKitchenCellPivotWorldPosition(section, snap, wallName) {
  return getZonePivotWorldPosition(section, snap, wallName);
}

export function fitKitchenModuleToCell(furnitureGroup, section, zoneIndex, layoutOpt) {
  if (!furnitureGroup || !section || zoneIndex == null) return false;
  return fitFurnitureToSectionZone(furnitureGroup, section, zoneIndex, layoutOpt);
}

export function alignKitchenModuleInnerBounds(furnitureGroup, section) {
  return alignFurnitureBBoxToSectionInnerBounds(furnitureGroup, section, true);
}

export function alignKitchenModuleBackToWall(furnitureGroup, section, wallNameOpt) {
  return alignDepthStack(furnitureGroup, section, wallNameOpt);
}

export function enforceKitchenDepthStackPlacement(furnitureGroup, section, wallNameOpt) {
  return enforceDepthOne(furnitureGroup, section, wallNameOpt);
}

export function enforceKitchenDepthStackOnAllModules(wallNameOpt) {
  return enforceDepthAll(wallNameOpt);
}

export function measureKitchenNmDepthReport(wallNameOpt) {
  return measureDepth(wallNameOpt);
}

export function setKitchenCellWidthMm(sectionData, zoneIndex, widthMm) {
  return syncKitchenBaseInZoneToWidthMm(sectionData, zoneIndex, widthMm);
}

function clearKitchenWallTransitionParts(wallName) {
  if (!state.scene) return 0;
  const norm = String(wallName || '').trim().toLowerCase();
  if (!norm) return 0;
  const toRemove = [];
  state.scene.traverse((obj) => {
    if (
      obj.userData?.isSectionTransitionPart &&
      String(obj.userData?.wallName || '').trim().toLowerCase() === norm
    ) {
      toRemove.push(obj);
    }
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
  if (state.capBoundaries instanceof Map) {
    state.capBoundaries.delete(norm);
  }
  return toRemove.length;
}

function stripKitchenWallSectionTrim(wallName) {
  const strip =
    typeof window !== 'undefined' ? window.__cldStripWardrobeSectionTrimForKitchen : null;
  if (typeof strip !== 'function') return 0;
  const norm = String(wallName || '').trim().toLowerCase();
  let n = 0;
  for (const sec of state.customSections || []) {
    if (!sec || (sec.wallName || '').toLowerCase() !== norm) continue;
    try {
      strip(sec);
      n += 1;
    } catch (_) {}
  }
  return n;
}

/**
 * пїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅ: пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅ place.
 * пїЅпїЅпїЅпїЅпїЅ: пїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅ U = пїЅпїЅпїЅпїЅпїЅпїЅ (s:x). пїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅ (= rear) пїЅ пїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅ
 * пїЅпїЅпїЅпїЅпїЅ corner_corpus_span / wall_gap, пїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅ (пїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅ ? пїЅпїЅпїЅпїЅпїЅпїЅ).
 */
export function enforceKitchenCornerSideWallClearance(furnitureGroup, section, zoneIndexOpt) {
  if (!furnitureGroup || !section?.division) return { ok: false, reason: 'no_args' };
  if (!isKitchenSectionLayoutActive()) return { ok: false, reason: 'not_kitchen' };
  if (!isKitchenBaseGroup(furnitureGroup)) return { ok: false, reason: 'not_kitchen_base' };
  const specialZis = getLShapeSpecialZoneIndices(section);
  if (!specialZis.length) return { ok: false, reason: 'no_special' };
  const zi =
    zoneIndexOpt != null && Number.isFinite(Number(zoneIndexOpt))
      ? Math.floor(Number(zoneIndexOpt))
      : Math.floor(Number(furnitureGroup.userData?.zoneIndex));
  if (!(Number.isFinite(zi) && specialZis.includes(zi))) {
    return { ok: false, reason: 'not_corner_zone' };
  }
  const ud = furnitureGroup.userData || (furnitureGroup.userData = {});
  const typeKey = section.division?.typeKey || null;
  const cfg = typeKey && L_CORNER_CONFIG[typeKey] ? L_CORNER_CONFIG[typeKey] : null;
  const parts = Math.floor(Number(section.division?.parts) || 0);
  let atMin;
  if (section.division?.uShape === true) {
    atMin = zi === 0 ? true : parts >= 2 && zi === parts - 1 ? false : !!cfg?.cornerAtStart;
  } else if (ud.__kitchenCornerSideAtMinU != null) {
    atMin = ud.__kitchenCornerSideAtMinU === true;
  } else {
    atMin = !!cfg?.cornerAtStart;
  }
  const clearRaw = Math.round(Number(ud.__kitchenSideWallClearanceMm));
  const clear =
    Number.isFinite(clearRaw) && clearRaw >= 0 ? Math.max(0, clearRaw) : 10;
  ud.__kitchenCornerSideAtMinU = atMin;
  ud.__kitchenSideWallClearanceMm = clear;
  return { ok: true, shifted: false, atMin, clear, reason: 'canon_module_eq_cell' };
}

/**
 * пїЅпїЅпїЅпїЅпїЅ place пїЅпїЅ: trim/caps пїЅпїЅпїЅпїЅпїЅ > пїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅ пїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅ > пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ/пїЅпїЅпїЅпїЅпїЅпїЅ.
 */
export function afterKitchenPlaceLayout(wallName) {
  const wall = String(wallName || '').trim();
  if (!wall) return { ok: false, reason: 'no_wall' };
  const cleared = clearKitchenWallTransitionParts(wall);
  const stripped = stripKitchenWallSectionTrim(wall);
  // пїЅпїЅпїЅ: пїЅпїЅпїЅпїЅпїЅпїЅ = пїЅпїЅпїЅпїЅпїЅпїЅ пїЅ пїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅ side-clear.
  try {
    if (state.scene && Array.isArray(state.customSections)) {
      const norm = wall.toLowerCase();
      state.scene.traverse((obj) => {
        if (!obj?.isGroup || !obj.userData?.isFurniture) return;
        if (!isKitchenBaseGroup(obj)) return;
        if (String(obj.userData?.wallName || '').toLowerCase() !== norm) return;
        const sid = String(obj.userData?.sectionId || '');
        const sec = state.customSections.find((s) => String(s?.id) === sid);
        if (!sec) return;
        enforceKitchenCornerSideWallClearance(obj, sec, obj.userData?.zoneIndex);
      });
    }
  } catch (e) {
    console.warn('[KITCHEN-SECTION] corner side clearance failed', e);
  }
  let depth = enforceKitchenDepthStackOnAllModules(wall);
  // пїЅпїЅпїЅпїЅпїЅ fit/rebuild пїЅпїЅпїЅпїЅпїЅпїЅ пїЅ live пїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅ пїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅ (пїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ).
  let jointsMoved = 0;
  try {
    const reposition =
      typeof window !== 'undefined' ? window.__cldRepositionJointSchemeFurniture : null;
    if (typeof reposition === 'function' && state.scene) {
      const norm = wall.toLowerCase();
      state.scene.traverse((obj) => {
        if (!obj?.isGroup || !obj.userData?.isFurniture) return;
        if (!isKitchenBaseGroup(obj)) return;
        if (String(obj.userData?.wallName || '').toLowerCase() !== norm) return;
        jointsMoved += reposition(obj) || 0;
      });
    }
  } catch (e) {
    console.warn('[KITCHEN-SECTION] joint reposition failed', e);
  }
  // пїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅ: пїЅпїЅпїЅпїЅпїЅ rear=0 пїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅ / fit.
  depth = enforceKitchenDepthStackOnAllModules(wall);
  let overlays = depth?.overlays || null;
  try {
    // пїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅ пїЅ пїЅпїЅпїЅпїЅпїЅ span пїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅ bbox.
    overlays = syncKitchenRunOverlaysOnWall(wall);
  } catch (_) {
    if (!overlays) overlays = null;
  }
  try {
    if (typeof window.__cldRefreshRoomFurnitureXray === 'function') {
      window.__cldRefreshRoomFurnitureXray();
    }
  } catch (_) {}
  // GLB пїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ stale-epoch пїЅпїЅпїЅ rebuild пїЅ пїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅ settle.
  try {
    const ensure = typeof window !== 'undefined' ? window.__cldEnsureJointHardwareGlbs : null;
    if (typeof ensure === 'function' && state.scene) {
      const norm = wall.toLowerCase();
      const run = () => {
        let n = 0;
        state.scene.traverse((obj) => {
          if (!obj?.isGroup || !obj.userData?.isFurniture) return;
          if (!isKitchenBaseGroup(obj)) return;
          if (String(obj.userData?.wallName || '').toLowerCase() !== norm) return;
          n += ensure(obj) || 0;
        });
        if (n > 0) {
          console.warn('[KITCHEN-SECTION] joint GLB re-attach', n);
          try {
            window.__cldRefreshRoomFurnitureXray?.();
          } catch (_) {}
        }
      };
      setTimeout(run, 200);
      setTimeout(run, 900);
    }
  } catch (_) {}
  console.log('[KITCHEN-SECTION] afterPlace', {
    wall,
    cleared,
    stripped,
    depthCount: depth?.count ?? 0,
    jointsMoved,
    overlays,
  });
  // пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅ пїЅ пїЅпїЅ (пїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ).
  try {
    if (typeof window.__cldEnsureCellVolumesAfterNmPlace === 'function') {
      window.__cldEnsureCellVolumesAfterNmPlace();
    } else if (typeof window.__cldSyncCellVolumeMeshes === 'function') {
      window.__cldSyncCellVolumeMeshes();
    }
  } catch (_) {}
  return { ok: true, cleared, stripped, depth, jointsMoved, overlays };
}

/** Place: fit пїЅ пїЅпїЅпїЅпїЅпїЅпїЅ > пїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅ (пїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ ?40 = пїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅ). */
export function placeKitchenModuleInCell(furnitureGroup, section, zoneIndex, wallNameOpt) {
  if (!furnitureGroup || !section) return { ok: false };
  let zoneFitted = false;
  let widthRebuilt = false;
  if (zoneIndex != null && Number.isFinite(Number(zoneIndex))) {
    // Ячейка → parametric rebuild (stub _enforceFurnitureWidthInZone не трогаем).
    try {
      const zi = Math.floor(Number(zoneIndex));
      // zoneIndex до TOP-depth: иначе resolveKitchenWallTopDepthMm не видит колонку пенала.
      const ud0 = furnitureGroup.userData || (furnitureGroup.userData = {});
      ud0.zoneIndex = zi;
      const isWallMid =
        isKitchenWallMidGroup(furnitureGroup) &&
        !isKitchenWallCornerGroup(furnitureGroup);
      const isWallTop =
        isKitchenWallTopGroup(furnitureGroup) &&
        !isKitchenWallCornerGroup(furnitureGroup);
      let layout = null;
      if (isWallMid || isWallTop) {
        try {
          // Прямая + L/U: MID/TOP из kitchenBandGrids (у L спец 600, сосед = НШ1).
          layout = buildKitchenBandCellLayoutForSection(
            section,
            isWallTop ? 'top' : 'mid'
          );
        } catch (_) {
          layout = null;
        }
      }
      if (!layout) layout = computeKitchenSectionCells(section);
      const seg = (layout?.segments || []).find(
        (s) => s.type === 'module' && Number(s.zoneIndex) === zi,
      );
      let cellW = seg ? Math.round(Number(seg.endU) - Number(seg.startU)) : 0;
      const isWallCorner = isKitchenWallCornerGroup(furnitureGroup);
      try {
        const specialZis =
          typeof getLShapeSpecialZoneIndices === 'function'
            ? getLShapeSpecialZoneIndices(section)
            : [];
        const specialZi = getLShapeSpecialZoneIndex(section);
        const onSp =
          (Number.isFinite(zi) &&
            Array.isArray(specialZis) &&
            specialZis.some((z) => Number(z) === zi)) ||
          (specialZi != null && zi === Number(specialZi));
        // НШ1/антресоль: не подменять ширину на спец низа 1050.
        if (onSp && !isWallMid && !isWallTop && !isWallCorner) {
          const sp = getLShapeSpecialSnapBounds(section.division, zi);
          if (sp?.moduleWidth > 0) cellW = Math.round(sp.moduleWidth);
        }
      } catch (_) {}
      // ВМУ: своя верхняя ячейка (дефолт 600), не растягивать до W низа 1050.
      if (isWallCorner) {
        cellW = resolveKitchenWallCornerWidthMm(furnitureGroup);
      }
      if (cellW > 50) {
        const ud = furnitureGroup.userData || (furnitureGroup.userData = {});
        ud.__kitchenCellWidthMm = cellW;
        ud.customWidthMm = cellW;
        const wr = rebuildForCellWidthMm(furnitureGroup, section, cellW);
        widthRebuilt = !!(wr && wr.ok);
      }
      // ВМУ не fit на всю спец-зону 1050 — только W своей под-ячейки; pin в CornerCell place.
      if (!isWallCorner) {
        zoneFitted = !!fitKitchenModuleToCell(
          furnitureGroup,
          section,
          zoneIndex,
          (isWallMid || isWallTop) && layout ? layout : undefined
        );
      } else {
        zoneFitted = widthRebuilt;
      }
    } catch (e) {
      console.warn('[KITCHEN-SECTION] cell width rebuild failed', e);
    }
  }
  // НШ1/НШ2: не align на всю секцию — иначе после fit в соседнюю ячейку
  // корпус уезжает в угол (как base special 1050).
  const skipAlignWallBand =
    (isKitchenWallMidGroup(furnitureGroup) ||
      isKitchenWallTopGroup(furnitureGroup)) &&
    !isKitchenWallCornerGroup(furnitureGroup);
  const aligned =
    isKitchenWallCornerGroup(furnitureGroup) || skipAlignWallBand
      ? false
      : !!alignKitchenModuleInnerBounds(furnitureGroup, section);
  const wall = wallNameOpt || section.wallName || furnitureGroup.userData?.wallName;
  let depthR = enforceKitchenDepthStackPlacement(furnitureGroup, section, wall);
  let depthAligned = !!(depthR && depthR.ok);
  // пїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅ fit/rebuild пїЅ пїЅпїЅпїЅпїЅпїЅ baked пїЅ300 пїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅ 500.
  try {
    const reposition =
      typeof window !== 'undefined' ? window.__cldRepositionJointSchemeFurniture : null;
    if (typeof reposition === 'function') reposition(furnitureGroup);
  } catch (_) {}
  // пїЅпїЅпїЅпїЅпїЅ: пїЅпїЅпїЅпїЅпїЅ пїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅ пїЅ пїЅпїЅпїЅпїЅпїЅ пїЅ пїЅпїЅпїЅ пїЅпїЅпїЅ rear=0.
  depthR = enforceKitchenDepthStackPlacement(furnitureGroup, section, wall);
  depthAligned = !!(depthR && depthR.ok) || depthAligned;

  // TOP: над пеналом / ячейкой пенала → deep (= D ячейки), сразу при place.
  let topDepth = null;
  if (isKitchenWallTopGroup(furnitureGroup) && isKitchenStraightBaseBandSection(section)) {
    try {
      const udTop = furnitureGroup.userData || (furnitureGroup.userData = {});
      const ziTop = Math.floor(Number(udTop.zoneIndex));
      if (
        Number.isFinite(ziTop) &&
        isKitchenTallColumnZone(section, ziTop) &&
        udTop.__kitchenTopDepthUserLocked !== true
      ) {
        udTop.__kitchenTopDepthMode = 'deep';
        delete udTop.__kitchenTopCustomDepthMm;
      }
      topDepth = applyKitchenWallTopDepthForGroup(furnitureGroup, section);
      if (topDepth?.ok) {
        depthR = enforceKitchenDepthStackPlacement(furnitureGroup, section, wall);
        depthAligned = !!(depthR && depthR.ok) || depthAligned;
      }
    } catch (eTopD) {
      console.warn('[KITCHEN-SECTION] TOP depth apply', eTopD);
    }
  }

  // FULL: ширина из BASE; ячейку MID этой колонны подтянуть к BASE (остальные MID независимы).
  if (
    isKitchenTallGroup(furnitureGroup) &&
    isKitchenStraightBaseBandSection(section) &&
    zoneIndex != null &&
    Number.isFinite(Number(zoneIndex))
  ) {
    try {
      const ziTall = Math.floor(Number(zoneIndex));
      const baseLayout = buildKitchenBandCellLayoutForSection(section, 'base');
      const seg = (baseLayout?.segments || []).find(
        (s) => s.type === 'module' && Number(s.zoneIndex) === ziTall
      );
      const baseW = seg
        ? Math.round(Number(seg.endU) - Number(seg.startU))
        : Math.round(Number(baseLayout?.moduleWidthsMm?.[ziTall]) || 0);
      if (baseW > 50) {
        const wrTall = rebuildForCellWidthMm(furnitureGroup, section, baseW);
        widthRebuilt = !!(wrTall && wrTall.ok) || widthRebuilt;
        const midPrev =
          resolveKitchenBandCustomZoneWidthsMmForEdit(section, 'mid') || {};
        writeKitchenBandZoneWidthsMm(section, 'mid', {
          ...midPrev,
          [ziTall]: baseW,
          [String(ziTall)]: baseW,
        });
      }
    } catch (eTallPlace) {
      console.warn('[KITCHEN-SECTION] tall BASE/MID width', eTallPlace);
    }
  }

  let sideClear = { ok: false };
  try {
    sideClear = enforceKitchenCornerSideWallClearance(furnitureGroup, section, zoneIndex);
  } catch (_) {}
  return {
    ok: zoneFitted || aligned || depthAligned || widthRebuilt || !!(sideClear && sideClear.ok),
    zoneFitted,
    aligned,
    depthAligned,
    widthRebuilt,
    sideClear,
    topDepth,
    depth: depthR,
  };
}

export function kitchenSectionEngineActive() {
  return isKitchenSectionLayoutActive();
}

if (typeof window !== 'undefined') {
  // пїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅ depth-stack (пїЅпїЅ пїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅ пїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅпїЅ).
  const depthApi = window.__cldKitchenDepthStack || {
    alignKitchenModuleBackToWall: alignDepthStack,
    enforceKitchenDepthStackPlacement: enforceDepthOne,
    enforceKitchenDepthStackOnAllModules: enforceDepthAll,
    measureKitchenNmDepthReport: measureDepth,
  };
  window.__cldKitchenSectionEngine = {
    isKitchenNmPlacement,
    findKitchenSectionAtPosition,
    computeKitchenSectionCells,
    assignKitchenZoneIndices,
    buildKitchenCellSnap,
    getKitchenCellPivotWorldPosition,
    fitKitchenModuleToCell,
    alignKitchenModuleBackToWall: depthApi.alignKitchenModuleBackToWall,
    enforceKitchenDepthStackPlacement: depthApi.enforceKitchenDepthStackPlacement,
    enforceKitchenDepthStackOnAllModules: depthApi.enforceKitchenDepthStackOnAllModules,
    measureKitchenNmDepthReport: depthApi.measureKitchenNmDepthReport,
    setKitchenCellWidthMm,
    afterKitchenPlaceLayout,
    placeKitchenModuleInCell,
    enforceKitchenCornerSideWallClearance,
    isKitchenBaseGroup,
    build: '20261025-vmu17',
  };
  window.__cldKitchenEnforceDepthAll = depthApi.enforceKitchenDepthStackOnAllModules;
  window.__cldKitchenMeasureDepth = depthApi.measureKitchenNmDepthReport;
  console.warn(
    '[KITCHEN] joint-room4 LIVE: joints snap to panel face on resize'
  );
}
