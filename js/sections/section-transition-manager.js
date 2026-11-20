/**
 * section-transition-manager.js
 *
 * Handles geometry at the boundary between adjacent furniture items
 * when they have different placement types (wardrobe vs dresser).
 *
 * Transition types handled:
 *   floor_in_niche → standalone_floor  — wardrobe left, dresser right
 *   standalone_floor → floor_in_niche  — dresser left, wardrobe right
 *
 * Works by scanning furniture groups directly in state.scene (NOT sections),
 * because multiple furniture items can share the same sectionId.
 *
 * Adds to state.scene (NOT to furniture groups):
 *   TransitionSideCap       — vertical overlay at wardrobe/dresser junction
 *   TransitionTopCap        — крышка тумбы: от внешнего торца накладки до дальнего края тумбы
 *   TransitionTopPlankCover — covers the shared TopPlank above dresser area
 *   TransitionEndPlankTrim  — trims end side-plank height at dresser boundary (Step 4)
 *
 * Поведение обклада (таблицы требований vs код): docs/SECTION_TRIM_BEHAVIOR_SPEC.md
 *
 * All added objects: userData.isSectionTransitionPart = true
 *                    userData.transitionKey = string key for cleanup
 */

/* global THREE */
import { state } from '../utils/state.js';
import { assignTrimPartKeyToMesh } from './trim-part-registry.js?v=20260822-edge-insets';
import { syncTrimNominalSizeFromGeometry } from './section-trim-edges.js?v=20260921-ghost-wh1';
import {
  shouldExcludeMeshFromFurnitureBBox,
  computeFurnitureCorpusLayoutWorldBBoxNoAo,
  findCatalogHorizontalTopWallGroup,
  setCatalogHorizontalTopVisible,
} from '../furniture/furniture-bbox.js?v=20261011-bbox-fix2';
import {
  PLACEMENT_KIND,
  isLowFurniturePlacementKind,
  isWallHungLowPlacementKind,
  isWallHungHighPlacementKind,
  isTallFurniturePlacementKind,
  isTallLowJunctionPair,
  needsFloorPlinthPlacementKind,
} from './vertical-layout.js?v=20260921-whh1';
import { isKitchenBaseGroup } from '../kitchen/kitchen-base-engine.js?v=20261103-wdepth5';
import { buildWindowRowState, computeTrimPlan } from './window-row-model.js?v=20260923-cohabit38';
import { classifyCapBetweenZones } from './trim-junction-classify.js?v=20260923-cohabit38';
import {
  getEndCabinetReserveMm,
  getEndCabinetRowPlinthInsetMm,
} from './section-end-cabinet.js?v=20260917-endcab-nobridge';
import {
  detectSectionEdgeTrimMeshes,
  computeSectionInnerBoundsU,
  computeHorizontalTrimSpanU,
} from './section-edge-trim-insets.js?v=20260919-filler-a9';
/* Мост отключён */
function setUnderWindowBayTopVisible() {}

/* ─── Constants ─── */

const PLANK_THICKNESS_MM = 16;
const SIDE_CAP_W_MM      = 16;
const AUTO_TOP_HEIGHT_LIMIT_MM = 1500;
/** Макс. длина детали обклада вдоль стены (U): топ тумбы, верхняя/нижняя планка — 275 см. */
const AUTO_TOP_MERGE_MAX_U_MM = 2750;
/** Разница topY (мм): иначе отдельный AutoTopCap на каждую высоту тумбы. */
const AUTO_TOP_Y_MERGE_TOLERANCE_MM = 10;
const TOP_PLANK_H_MM = 50;
const BOTTOM_PLANK_H_MM = 100;
const H_PLANK_DEPTH_MM = 16;
/** Ширина боковой планки секции (мм) — как в section-manager. */
const SIDE_PLANK_WIDTH_MM = 50;

/** Высота верхней планки секции (мм): filler.topMm → topPlankHeight → 50. */
function _sectionTopPlankHeightMm(sec) {
  const fromFiller = Number(sec?.filler?.topMm);
  if (Number.isFinite(fromFiller) && fromFiller >= 0) return Math.round(fromFiller);
  const fromTop = Number(sec?.topPlankHeight);
  if (Number.isFinite(fromTop) && fromTop >= 0) return Math.round(fromTop);
  return TOP_PLANK_H_MM;
}
/** Зазор bbox по U между соседними тумбами (если нет пары zoneIndex). */
const AUTO_TOP_ADJACENT_GAP_MM = 45;
/** Макс. зазор bbox при соседних zoneIndex+1 (модуль уже в зоне 1085, bbox уже). */
const AUTO_TOP_ZONE_SEAM_MAX_GAP_MM = 130;
/** Торец AutoTopCap за внешнюю грань накладки (не +16 мм толщины). */
const OVERLAY_TOP_OVERHANG_MM = 1;

// ─── Material ────────────────────────────────────────────────────────────────

function _makeMat(color = 0xffffff) {
  return new THREE.MeshStandardMaterial({ color, metalness: 0.1, roughness: 0.8 });
}

function _addThinBlackEdgeFrame(mesh, wallName, transitionKey, sectionId) {
  try {
    const edges = new THREE.EdgesGeometry(mesh.geometry);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.95 })
    );
    line.name = 'TransitionTopCapEdgeFrame';
    _tagMesh(line, wallName, transitionKey, sectionId);
    line.userData.isTransitionTopCapEdgeFrame = true;
    line.position.copy(mesh.position);
    line.rotation.copy(mesh.rotation);
    line.renderOrder = (mesh.renderOrder || 0) + 1;
    state.scene.add(line);
  } catch (_) {}
}

// ─── Filtered bounding box ────────────────────────────────────────────────────

/**
 * Compute the bounding box of a furniture group while excluding:
 *   - WallContactAO / ContactShadow planes
 *   - Debug pivot/bbox markers
 * This prevents shadow planes and debug spheres from inflating the box.
 */
function _furnitureBBox(grp) {
  // Как furniture-bbox: без Hole_*/__furniture_own/петлевого GLB —
  // иначе bbox раздувается и нарождаются лишние SideCap/планки (история 21.07).
  const out = new THREE.Box3();
  let has = false;
  try {
    grp.traverse((obj) => {
      if (shouldExcludeMeshFromFurnitureBBox(obj)) return;
      const b = new THREE.Box3().setFromObject(obj);
      if (!has) { out.copy(b); has = true; }
      else out.union(b);
    });
  } catch (_) {}
  if (!has && grp) {
    try {
      out.setFromObject(grp);
    } catch (_) {}
  }
  return out;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * All furniture groups on a wall sorted left→right (X) or front→back (Z).
 * Groups with no wallName are included in every wall search (never silently dropped).
 *
 * Nested hinge mounts (Furniture_Присадка / isCatalogHingeModule) must NOT appear here:
 * they used to spawn TransitionSideOverlayHeightMismatch and break TopPlank (21.07).
 */
function _isTransitionWallFurnitureRoot(child) {
  if (!child?.isGroup || !child.userData?.isFurniture) return false;
  if (child.userData?.isGhostClodisPrebuild || child.userData?.isGhost) return false;
  if (child.userData?.isSectionTransitionPart || child.userData?.isTopPlankSegment) return false;
  const ud = child.userData || {};
  // Слот-заглушка торцевого — не мебель ряда. Сам торцевой (isEndCabinet) участвует
  // в парах как «шкаф»: SideCap/TopCap со соседней тумбой — как floor_in_niche↔standalone.
  if (ud.isEndCabinetSlot === true) return false;
  if (
    ud.isCatalogHingeModule ||
    ud.isHingeBazisExport ||
    ud.cldHingeCatalogModel ||
    Number(ud.cfrnDrillTemplateId) > 0 ||
    ud.hingeDrillPart ||
    ud.isDrillPlaceholder
  ) {
    return false;
  }
  const nm = String(child.name || '');
  if (nm.startsWith('Furniture_') && /присадк/i.test(nm)) return false;
  // Только корневые шкафы: вложенный isFurniture (петля внутри шкафа) — не пара переходов.
  let p = child.parent;
  for (let i = 0; i < 40 && p; i++) {
    if (p.userData?.isFurniture) return false;
    if (p.userData?.isCatalogHingeModule) return false;
    if (p.userData?.isGhost || p.userData?.isGhostClodisPrebuild || p.name === 'FurnitureGhost') {
      return false;
    }
    p = p.parent;
  }
  return true;
}

function _getFurnitureOnWallSorted(wallName) {
  if (!state.scene) return [];
  const norm = String(wallName || '').trim().toLowerCase();
  const isZAxis = (norm === 'left' || norm === 'right');
  const groups = [];
  const seen = new Set();

  // Traverse full scene graph — furniture groups can be direct or nested children.
  state.scene.traverse((child) => {
    if (!_isTransitionWallFurnitureRoot(child)) return;
    if (seen.has(child.uuid)) return;
    const fw = String(child.userData?.wallName || '').trim().toLowerCase();
    if (fw && fw !== norm) return;
    seen.add(child.uuid);
    groups.push(child);
  });

  groups.sort((a, b) => {
    const wa = new THREE.Vector3();
    const wb = new THREE.Vector3();
    a.getWorldPosition(wa);
    b.getWorldPosition(wb);
    return isZAxis ? (wa.z - wb.z) : (wa.x - wb.x);
  });

  return groups;
}

/** Restore catalog tops when removing transition top meshes. */
function _restoreCatalogTopsFromTransitionMesh(obj) {
  if (!obj?.userData) return;
  const uuids = [];
  if (obj.userData.transitionStandaloneUuid) uuids.push(obj.userData.transitionStandaloneUuid);
  if (Array.isArray(obj.userData.mergedTopFurnitureUuids)) {
    for (const id of obj.userData.mergedTopFurnitureUuids) {
      if (id && !uuids.includes(id)) uuids.push(id);
    }
  }
  const isTop =
    obj.userData.isTransitionTopCap || obj.userData.isTransitionAutoTopCap;
  if (!isTop || !uuids.length) return;
  for (const id of uuids) {
    const grp = _findFurnitureGrpByUuid(id);
    if (grp) setCatalogHorizontalTopVisible(grp, true);
  }
}

/**
 * Крыша модуля (админка horizontal_top) + топ комнаты (§6.4) — оба.
 * Каталожную никогда не прячем; Transition садится на верх крышки.
 */
function _ensureCatalogTopsVisibleOnWall(wallName) {
  if (!state.scene) return;
  for (const grp of _getFurnitureOnWallSorted(wallName)) {
    if (!isLowFurniturePlacementKind(grp.userData?.__placementKind)) {
      continue;
    }
    setCatalogHorizontalTopVisible(grp, true);
  }
}

/** Верх для посадки Transition: корпус, а если есть Крышка — её max.y. */
function _standaloneLidTopYMm(grp) {
  const corpus = computeFurnitureCorpusLayoutWorldBBoxNoAo(grp);
  let topY = !corpus.isEmpty() ? corpus.max.y : 0;
  const cat = findCatalogHorizontalTopWallGroup(grp);
  if (cat) {
    try {
      cat.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(cat);
      if (!b.isEmpty() && Number.isFinite(b.max.y)) {
        topY = Math.max(topY, b.max.y);
      }
    } catch (_) {}
  }
  if (!(topY > 0)) {
    const full = _furnitureBBox(grp);
    if (!full.isEmpty()) topY = full.max.y;
  }
  return topY;
}

/** Remove all transition objects for a given key. */
function _clearTransitionObjects(key) {
  if (!state.scene) return;
  const toRemove = [];
  state.scene.traverse((obj) => {
    if (obj.userData?.isSectionTransitionPart && obj.userData?.transitionKey === key)
      toRemove.push(obj);
  });
  for (const obj of toRemove) {
    _restoreCatalogTopsFromTransitionMesh(obj);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
    if (obj.parent) obj.parent.remove(obj);
  }
}

/** Remove all transition objects for a wall. */
function _clearAllTransitionsOnWall(wallName) {
  if (!state.scene) return;
  const norm = String(wallName || '').trim().toLowerCase();
  const toRemove = [];
  state.scene.traverse((obj) => {
    if (
      obj.userData?.isSectionTransitionPart &&
      String(obj.userData?.wallName || '').trim().toLowerCase() === norm
    ) toRemove.push(obj);
  });
  for (const obj of toRemove) {
    _restoreCatalogTopsFromTransitionMesh(obj);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
    if (obj.parent) obj.parent.remove(obj);
  }
  // Clear cap boundaries for this wall so section-manager/cabinet-markers refresh.
  if (state.capBoundaries instanceof Map) {
    state.capBoundaries.delete(norm);
  }
}

function _tagMesh(mesh, wallName, transitionKey, sectionId) {
  mesh.userData.isSectionTransitionPart = true;
  mesh.userData.transitionKey = transitionKey;
  mesh.userData.wallName = wallName;
  if (sectionId != null) mesh.userData.sectionId = sectionId;
}

function _tagAsFacadeTrim(mesh, trimKind, wallName) {
  // Transition parts belong to outside/facade trim:
  // they must use the same pricing/edging/color logic as facade planks/overlays.
  mesh.userData.isFacade = true;
  mesh.userData.isSectionFacadeTrim = true;
  mesh.userData.sectionTrimUsesOutsideDecor = true;
  if (trimKind === 'side' && !mesh.userData?.isTransitionSideCap) {
    mesh.userData.isSideOverlay = true;
  }
  // TopCap/AutoTop: флаги isTransition* выставлять ДО _tagAsFacadeTrim — иначе isTopPlank.
  if (trimKind === 'top' && !mesh.userData?.isTransitionTopCap && !mesh.userData?.isTransitionAutoTopCap) {
    mesh.userData.isTopPlank = true;
  }
  assignTrimPartKeyToMesh(mesh, wallName);
}

function _wallUsesZAxis(wallName) {
  const norm = String(wallName || '').trim().toLowerCase();
  return norm === 'left' || norm === 'right';
}

/** Пара base+upper в одной ячейке — не горизонтальный стык SideCap/TopCap. */
function _isSameZoneCohabitPair(a, b) {
  if (!a || !b) return false;
  if (String(a.userData?.sectionId ?? '') !== String(b.userData?.sectionId ?? '')) {
    return false;
  }
  const za = Number(a.userData?.zoneIndex);
  const zb = Number(b.userData?.zoneIndex);
  if (!Number.isFinite(za) || !Number.isFinite(zb) || za !== zb) return false;
  const api =
    typeof window !== 'undefined' ? window.__cldPlacementKindProfiles : null;
  if (api && typeof api.canCohabitInSameZone === 'function') {
    const sa = api.resolveZoneCohabitSpecFromUserData?.(a.userData, null);
    const sb = api.resolveZoneCohabitSpecFromUserData?.(b.userData, null);
    return !!api.canCohabitInSameZone(sa, sb);
  }
  const ak = String(a.userData?.__placementKind || '');
  const bk = String(b.userData?.__placementKind || '');
  return (
    (isWallHungHighPlacementKind(ak) && isLowFurniturePlacementKind(bk)) ||
    (isLowFurniturePlacementKind(ak) && isWallHungHighPlacementKind(bk))
  );
}

/** Низкий партнёр в той же ячейке (колонна base+upper), иначе null. */
function _sameZoneCohabitLowPartner(grp) {
  if (!grp || !state.scene) return null;
  let found = null;
  state.scene.traverse((o) => {
    if (found || o === grp || !_isTransitionWallFurnitureRoot(o)) return;
    if (!_isSameZoneCohabitPair(grp, o)) return;
    if (isLowFurniturePlacementKind(o.userData?.__placementKind)) found = o;
  });
  return found;
}

/**
 * Горизонтальный стык шкаф↔низкий (в т.ч. колонна навесов).
 * Если в сортировке рядом верхний навес — берём нижнего из ячейки (как шкаф↔тумба).
 * @returns {null|{ niche: object, standalone: object, dresserSide: 'left'|'right' }}
 */
function _resolveHorizontalTallLowPartners(leftGrp, rightGrp) {
  if (!leftGrp || !rightGrp) return null;
  if (_isSameZoneCohabitPair(leftGrp, rightGrp)) return null;

  let L = leftGrp;
  let R = rightGrp;
  // Верхний навес в колонне → стык с шкафом как у нижнего (SideCap/TopCap).
  if (isWallHungHighPlacementKind(L.userData?.__placementKind)) {
    const low = _sameZoneCohabitLowPartner(L);
    if (low) L = low;
  }
  if (isWallHungHighPlacementKind(R.userData?.__placementKind)) {
    const low = _sameZoneCohabitLowPartner(R);
    if (low) R = low;
  }

  const lk = String(L.userData?.__placementKind || '');
  const rk = String(R.userData?.__placementKind || '');
  if (!isTallLowJunctionPair(lk, rk)) return null;

  if (isTallFurniturePlacementKind(lk) && isLowFurniturePlacementKind(rk)) {
    return { niche: L, standalone: R, dresserSide: 'right' };
  }
  if (isLowFurniturePlacementKind(lk) && isTallFurniturePlacementKind(rk)) {
    return { niche: R, standalone: L, dresserSide: 'left' };
  }
  return null;
}

/** Горизонтальный стык tall↔low (не пара base+upper в одной ячейке). */
function _isHorizontalTallLowJunction(a, b) {
  return !!_resolveHorizontalTallLowPartners(a, b);
}

/**
 * §6.7.2: оба tall — wall_hung_high | шкаф без низкого в ячейке навеса.
 * Колонна → SideCap через tall|low (remap); сюда не входит.
 */
function _isHangWardrobeSideCapPair(a, b) {
  if (!a || !b || _isSameZoneCohabitPair(a, b)) return false;
  const aPk = String(a.userData?.__placementKind || '').trim();
  const bPk = String(b.userData?.__placementKind || '').trim();
  const aHang = isWallHungHighPlacementKind(aPk);
  const bHang = isWallHungHighPlacementKind(bPk);
  const aWard =
    !aHang &&
    !isLowFurniturePlacementKind(aPk) &&
    (aPk === PLACEMENT_KIND.FLOOR_IN_NICHE || aPk === '');
  const bWard =
    !bHang &&
    !isLowFurniturePlacementKind(bPk) &&
    (bPk === PLACEMENT_KIND.FLOOR_IN_NICHE || bPk === '');
  if (!(aHang && bWard) && !(aWard && bHang)) return false;
  const hangGrp = aHang ? a : b;
  if (_sameZoneCohabitLowPartner(hangGrp)) return false;
  return true;
}

/** Соседняя пара высокий ↔ низкий — для неё уже строятся SideCap + TopCap. */
function _isWardrobeDresserPair(leftKind, rightKind) {
  return isTallLowJunctionPair(leftKind, rightKind);
}

/** Низкий модуль рядом с высоким: не дублировать TransitionAutoTopCap (есть TransitionTopCap). */
function _standaloneUuidsWithWardrobeTopCap(sorted) {
  const skip = new Set();
  for (let i = 0; i < sorted.length - 1; i++) {
    const partners = _resolveHorizontalTallLowPartners(sorted[i], sorted[i + 1]);
    if (!partners?.standalone?.uuid) continue;
    skip.add(partners.standalone.uuid);
  }
  return skip;
}

/**
 * Ширина модуля вдоль оси деления стены U (мм) — та же, что при snap/зонах
 * (см. placePendingFurniture → __initialSectionSizeMm).
 */
function _moduleWidthAlongWallMm(grp, wallName) {
  const norm = String(wallName || '').trim().toLowerCase();
  const sz = grp?.userData?.__initialSectionSizeMm;
  if (!sz || typeof sz !== 'object') return null;
  if (norm === 'left' || norm === 'right') {
    const w = Number(sz.z);
    return Number.isFinite(w) && w > 10 ? w : null;
  }
  const w = Number(sz.x);
  return Number.isFinite(w) && w > 10 ? w : null;
}

/**
 * Мировая координата вдоль оси деления (X для back/front, Z для left/right):
 * внешняя грань шкафа (niche), обращённая к тумбе.
 * Секция-manager: back/right — пивот у начала зоны, рост +U; front/left — пивот у конца зоны, рост −U.
 * BBox мешей часто не совпадает с этой плоскостью (фасад/паз) → отсюда щели и сдвиг TopCap на ~16 мм.
 */
function _nicheOuterAxisCoordWorld(nicheGrp, wallName, dresserSide) {
  const norm = String(wallName || '').trim().toLowerCase();
  const wMm = _moduleWidthAlongWallMm(nicheGrp, norm);
  const isRight = dresserSide === 'right';

  const fromPivot = () => {
    if (wMm == null) return null;
    if (norm === 'back') {
      const p = nicheGrp.position.x;
      return isRight ? p + wMm : p;
    }
    if (norm === 'front') {
      const p = nicheGrp.position.x;
      return isRight ? p : p - wMm;
    }
    if (norm === 'right') {
      const p = nicheGrp.position.z;
      return isRight ? p + wMm : p;
    }
    if (norm === 'left') {
      const p = nicheGrp.position.z;
      return isRight ? p : p - wMm;
    }
    return null;
  };

  let coord = fromPivot();
  const box = _furnitureBBox(nicheGrp);
  if (!box.isEmpty()) {
    const fromBox =
      norm === 'back' || norm === 'right'
        ? (isRight ? (norm === 'back' ? box.max.x : box.max.z) : norm === 'back' ? box.min.x : box.min.z)
        : (isRight ? (norm === 'front' ? box.max.x : box.max.z) : norm === 'front' ? box.min.x : box.min.z);
    if (coord == null || !Number.isFinite(coord)) {
      coord = fromBox;
    } else if (Number.isFinite(fromBox) && Math.abs(coord - fromBox) > 80) {
      // сильный разъезд pivot/размера и bbox — оставляем pivot-логику, но подстрахуемся bbox
      coord = (coord + fromBox) / 2;
    }
  }
  return Number.isFinite(coord) ? coord : null;
}

/** Дальний от шкафа торец тумбы по той же оси (мировая координата). */
function _standFarAxisCoordWorld(standGrp, wallName, dresserSide) {
  const norm = String(wallName || '').trim().toLowerCase();
  const wMm = _moduleWidthAlongWallMm(standGrp, norm);
  const isRight = dresserSide === 'right';

  const fromPivot = () => {
    if (wMm == null) return null;
    if (norm === 'back') {
      const p = standGrp.position.x;
      return isRight ? p + wMm : p;
    }
    if (norm === 'front') {
      const p = standGrp.position.x;
      return isRight ? p : p - wMm;
    }
    if (norm === 'right') {
      const p = standGrp.position.z;
      return isRight ? p + wMm : p;
    }
    if (norm === 'left') {
      const p = standGrp.position.z;
      return isRight ? p : p - wMm;
    }
    return null;
  };

  let coord = fromPivot();
  const box = _furnitureBBox(standGrp);
  if (!box.isEmpty()) {
    const fromBox =
      norm === 'back' || norm === 'right'
        ? (isRight ? (norm === 'back' ? box.max.x : box.max.z) : norm === 'back' ? box.min.x : box.min.z)
        : (isRight ? (norm === 'front' ? box.max.x : box.max.z) : norm === 'front' ? box.min.x : box.min.z);
    if (coord == null || !Number.isFinite(coord)) {
      coord = fromBox;
    } else if (Number.isFinite(fromBox) && Math.abs(coord - fromBox) > 80) {
      coord = (coord + fromBox) / 2;
    }
  }
  return Number.isFinite(coord) ? coord : null;
}

/**
 * Layout-сегмент cap 16 мм именно для пары шкаф↔тумба (не первый попавшийся в секции).
 * При 2+ SideCap `.find(type==='cap')` брал левый стык и портил правый (~1–2 мм / Basis).
 */
function _findLayoutCapSegmentForPair(sec, nicheGrp, standaloneGrp) {
  const segs = (sec?._layoutCache?.segments || []).filter((s) => s && s.type === 'cap');
  if (!segs.length) return null;
  const nZi = Number(nicheGrp?.userData?.zoneIndex);
  const sZi = Number(standaloneGrp?.userData?.zoneIndex);
  if (Number.isFinite(nZi) && Number.isFinite(sZi)) {
    const lo = Math.min(nZi, sZi);
    const hi = Math.max(nZi, sZi);
    const hit = segs.find(
      (s) =>
        Number(s.nicheZoneIndex) === lo && Number(s.dresserZoneIndex) === hi
    );
    if (hit) return hit;
  }
  if (segs.length === 1) return segs[0];
  return null;
}

// ─── Step 3A: Vertical side cap ───────────────────────────────────────────────

/**
 * Vertical накладка at the junction between wardrobe (nicheGrp) and dresser (standaloneGrp).
 * Spans from floor (nicheBox.min.y) to wardrobe top (nicheBox.max.y).
 * Centered on the wardrobe/dresser boundary in X.
 */
function _buildSideCapFromGroups(nicheGrp, standaloneGrp, dresserSide, wallName, transitionKey, opts = null) {
  if (!state.scene) return;
  // Кухня НМ: не шкаф↔тумба SideCap.
  if (isKitchenBaseGroup(nicheGrp) || isKitchenBaseGroup(standaloneGrp)) return;
  const sectionId = standaloneGrp?.userData?.sectionId || nicheGrp?.userData?.sectionId || null;
  try {
    const _sec = Array.isArray(state.customSections)
      ? state.customSections.find((s) => s?.id === (nicheGrp.userData?.sectionId || sectionId))
      : null;
    const nicheBox  = _furnitureBBox(nicheGrp);
    const standBox  = _furnitureBBox(standaloneGrp);
    if (nicheBox.isEmpty() || standBox.isEmpty()) return;

    const _secFullH = _sec?.size?.y;
    let capH = (Number.isFinite(_secFullH) && _secFullH > 0) ? _secFullH : (nicheBox.max.y - nicheBox.min.y);
    let capFloorY = (_sec?.group?.position?.y != null) ? _sec.group.position.y : nicheBox.min.y;
    // Колонка с верхним навесом: накладка от низа навеса вверх (не fullH от пола).
    if (
      opts &&
      Number.isFinite(Number(opts.yBottom)) &&
      Number.isFinite(Number(opts.yTop)) &&
      Number(opts.yTop) - Number(opts.yBottom) > 5
    ) {
      capFloorY = Number(opts.yBottom);
      capH = Number(opts.yTop) - Number(opts.yBottom);
    }
    const useZ = _wallUsesZAxis(wallName);
    const norm = String(wallName || '').trim().toLowerCase();

    // Cap thickness is ALWAYS along the wall axis (U):
    // - back/front: U = X
    // - left/right: U = Z
    const capW = SIDE_CAP_W_MM;

    // Глубина в комнату — как голубая SectionZoneCap (size секции), не bbox тумбы/комода.
    const layoutDepthU = useZ
      ? Number(_sec?.size?.x || 0)
      : Number(_sec?.size?.z || 0);
    const secDepthU = layoutDepthU > 0 ? layoutDepthU : _sectionTrimDepthMm(_sec);
    let spanW = Math.max(secDepthU, 10);
    if (capH < 10 || spanW < 10) return;

    // Источник стыка: layout cap этой пары (после fit), иначе bbox шкафа.
    let boundaryU = useZ
      ? (dresserSide === 'right' ? nicheBox.max.z : nicheBox.min.z)
      : (dresserSide === 'right' ? nicheBox.max.x : nicheBox.min.x);
    // Явный Y-спан (навес|шкаф): только bbox шкафа — layout/endCabinet уводили на наружный торец.
    const forceBBoxBoundary =
      opts &&
      Number.isFinite(Number(opts.yBottom)) &&
      Number.isFinite(Number(opts.yTop));
    if (!forceBBoxBoundary && nicheGrp?.userData?.isEndCabinet && _sec) {
      try {
        const bounds = computeSectionInnerBoundsU(_sec);
        const fromSec =
          dresserSide === 'right' ? bounds.outerMinU : bounds.outerMaxU;
        if (Number.isFinite(fromSec)) boundaryU = fromSec;
      } catch (_) {}
    } else if (!forceBBoxBoundary) {
      const capSeg = _findLayoutCapSegmentForPair(_sec, nicheGrp, standaloneGrp);
      if (capSeg) {
        // Грань шкафа у слота 16 мм: right → startU, left → endU.
        const fromLayout = dresserSide === 'right' ? capSeg.startU : capSeg.endU;
        if (Number.isFinite(fromLayout)) boundaryU = fromLayout;
      }
    }

    // Ряд у окна: стык у внешней грани накладки tall (не внутри overlay).
    if (!forceBBoxBoundary && _sec && _isWindowBridgeTallSection(_sec)) {
      try {
        const tallBounds = computeSectionInnerBoundsU(_sec);
        if (dresserSide === 'right' && Number.isFinite(tallBounds.outerMaxU)) {
          boundaryU = tallBounds.outerMaxU;
        } else if (dresserSide === 'left' && Number.isFinite(tallBounds.outerMinU)) {
          boundaryU = tallBounds.outerMinU;
        }
      } catch (_) {}
    }

    // Cap sits flush against the wardrobe's outer face — no extra PLANK_THICKNESS offset.
    const sign = dresserSide === 'right' ? +1 : -1;
    const centerU = boundaryU + sign * capW / 2;

    // Register cap boundary so section-manager and cabinet-markers can render it as a
    // proper 16mm section with solid lines on both sides.
    {
      const capStartU = dresserSide === 'right' ? boundaryU : boundaryU - capW;
      const capEndU   = dresserSide === 'right' ? boundaryU + capW : boundaryU;
      if (!(state.capBoundaries instanceof Map)) state.capBoundaries = new Map();
      const wallKey = String(wallName || '').trim().toLowerCase();
      const list = state.capBoundaries.get(wallKey) || [];
      // Avoid duplicates for the same section boundary.
      const alreadyExists = list.some(
        (c) => Math.abs(c.capStartU - capStartU) < 4 && c.sectionId === sectionId
      );
      if (!alreadyExists) {
        list.push({ sectionId, capStartU, capEndU, wallName: wallKey });
        if (typeof window !== 'undefined' && window.DEBUG_CAP_ALIGNMENT === true) {
          console.log('[CAP-BOUNDARY]', {
            wallName: wallKey,
            sectionId,
            dresserSide,
            boundaryU,
            capStartU,
            capEndU,
          });
        }
        state.capBoundaries.set(wallKey, list);
      }
    }
    const centerY = capFloorY + capH / 2;
    let centerW = _sectionLayoutCapDepthCenterWorld(_sec, wallName, secDepthU);
    if (centerW == null) {
      centerW = useZ
        ? (nicheBox.min.x + nicheBox.max.x) / 2
        : (nicheBox.min.z + nicheBox.max.z) / 2;
    }

    const geom = useZ
      ? new THREE.BoxGeometry(spanW, capH, capW)   // X span into room, Z thickness along wall
      : new THREE.BoxGeometry(capW, capH, spanW);  // X thickness along wall, Z span into room
    const mesh = new THREE.Mesh(geom, _makeMat());
    mesh.name = 'TransitionSideCap';
    _tagMesh(mesh, wallName, transitionKey, sectionId);
    _tagAsFacadeTrim(mesh, 'side', wallName);
    mesh.userData.isTransitionSideCap = true;
    mesh.userData.trimPartKey = 'transition_side_cap';
    mesh.position.set(
      useZ ? centerW : centerU,
      centerY,
      useZ ? centerU : centerW
    );
    state.scene.add(mesh);

    console.log('[TRANSITION] ✅ SideCap', {
      dresserSide,
      capW: Math.round(capW), capH: Math.round(capH),
      x: Math.round(mesh.position.x), y: Math.round(centerY), z: Math.round(mesh.position.z),
    });
  } catch (e) {
    console.warn('[TRANSITION] _buildSideCapFromGroups error', e);
  }
}

/**
 * Вертикальный зазор между тумбами разной высоты (мм, world Y).
 * bbox.max.y — верх корпуса; крышки TransitionAutoTopCap лежат на нём [corpusTop … corpusTop+t].
 * Обычный случай: от верхней грани крышки низкой до нижней грани крышки высокой.
 * Нижний навес выше соседа: от пола секции до низа топа навеса (закрыть открытый бок/опоры).
 */
function _heightMismatchOverlayVerticalSpanMm(
  shorterCorpusTop,
  tallerCorpusTop,
  topThicknessMm,
  opts = null
) {
  const t = Number(topThicknessMm) > 0 ? Number(topThicknessMm) : PLANK_THICKNESS_MM;
  const fromFloorY = opts?.fromFloorY;
  const yBottom =
    fromFloorY != null && Number.isFinite(Number(fromFloorY))
      ? Number(fromFloorY)
      : shorterCorpusTop + t;
  const yTop = tallerCorpusTop;
  const capH = yTop - yBottom;
  return { yBottom, yTop, capH, topThickness: t, fromFloor: fromFloorY != null };
}

function _findFurnitureGrpByUuid(uuid) {
  if (!state.scene || !uuid) return null;
  let found = null;
  state.scene.traverse((o) => {
    if (found || !o?.userData?.isFurniture) return;
    if (o.uuid === uuid) found = o;
  });
  return found;
}

/** Крышка тумбы: по mergedTopFurnitureUuids или по XZ + corpusTop. */
function _findTopCapForFurniture(grp, wallName) {
  if (!state.scene || !grp?.uuid) return null;
  const norm = String(wallName || '').trim().toLowerCase();
  const uuid = grp.uuid;
  let byUuid = null;
  state.scene.traverse((obj) => {
    if (byUuid || !obj?.isMesh) return;
    const ud = obj.userData || {};
    if (ud.isUnderWindowBayTop) return;
    if (ud.autoBottomHangHigh || ud.isTransitionAutoBottomCap) return;
    if (!ud.isTransitionAutoTopCap && !ud.isTransitionTopCap) return;
    if (String(ud.wallName || '').toLowerCase() !== norm) return;
    const uuids = ud.mergedTopFurnitureUuids;
    if (Array.isArray(uuids) && uuids.includes(uuid)) byUuid = obj;
  });
  if (byUuid) return byUuid;

  const fbox = _furnitureBBox(grp);
  if (fbox.isEmpty()) return null;
  const corpusTop = fbox.max.y;
  let best = null;
  state.scene.traverse((obj) => {
    if (!obj?.isMesh) return;
    const ud = obj.userData || {};
    if (ud.isUnderWindowBayTop) return;
    if (ud.autoBottomHangHigh || ud.isTransitionAutoBottomCap) return;
    if (!ud.isTransitionAutoTopCap && !ud.isTransitionTopCap) return;
    if (String(ud.wallName || '').toLowerCase() !== norm) return;
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj);
    if (!_boxesOverlapXZ(fbox, box)) return;
    if (Math.abs(box.min.y - corpusTop) > 4) return;
    if (!best || box.max.y > best.maxY) best = { mesh: obj, maxY: box.max.y };
  });
  return best?.mesh || null;
}

function _applyHeightMismatchOverlayVerticalSpan(mesh, yBottom, yTop) {
  if (!mesh?.isMesh || !(yTop > yBottom + 4)) return false;
  const capH = yTop - yBottom;
  mesh.updateMatrixWorld(true);
  const trimBox = new THREE.Box3().setFromObject(mesh);
  const params = mesh.geometry?.parameters;
  const w = params?.width ?? (trimBox.max.x - trimBox.min.x);
  const d = params?.depth ?? (trimBox.max.z - trimBox.min.z);
  mesh.geometry.dispose();
  mesh.geometry = new THREE.BoxGeometry(w, capH, d);
  mesh.position.set(
    (trimBox.min.x + trimBox.max.x) / 2,
    yBottom + capH / 2,
    (trimBox.min.z + trimBox.max.z) / 2
  );
  const hm = mesh.userData.heightMismatch || {};
  mesh.userData.heightMismatch = { ...hm, capH, yBottom, yTop };
  mesh.userData.cldTrimBaseSize = { w, h: capH, d };
  mesh.userData.cldTrimBasePosition = mesh.position.clone();
  _syncTrimNominalAfterHeightChange(mesh);
  return true;
}

/** После TransitionAutoTopCap — точные Y по геометрии крышек (не по bbox корпуса). */
function _finalizeHeightMismatchOverlayVertical(mesh, wallName) {
  const hm = mesh.userData?.heightMismatch;
  if (!hm) return false;

  // Шкаф|навес / навес|низкий сосед: Y уже заданы — не пересчитывать.
  if (hm.wardrobeVsHangHigh === true || hm.hangHighVsAdjacentLow === true) {
    return _applyHeightMismatchOverlayVerticalSpan(
      mesh,
      Number(hm.yBottom),
      Number(hm.yTop)
    );
  }

  const shorterGrp = hm.shorterUuid ? _findFurnitureGrpByUuid(hm.shorterUuid) : null;
  const tallerGrp = hm.tallerUuid ? _findFurnitureGrpByUuid(hm.tallerUuid) : null;
  const shorterTopMesh = shorterGrp ? _findTopCapForFurniture(shorterGrp, wallName) : null;
  const tallerTopMesh = tallerGrp ? _findTopCapForFurniture(tallerGrp, wallName) : null;

  let yBottom;
  let yTop;
  // Нижний навес выше соседа: накладка от пола до низа топа (не от крышки низкой).
  const hangFromFloor =
    hm.fromFloor === true ||
    isWallHungLowPlacementKind(tallerGrp?.userData?.__placementKind);
  if (hangFromFloor) {
    const secId = mesh.userData?.sectionId;
    const sec =
      secId && Array.isArray(state.customSections)
        ? state.customSections.find((s) => String(s?.id) === String(secId))
        : null;
    yBottom =
      sec?.group != null
        ? Number(sec.group.position.y || 0)
        : Number(hm.yBottom) || 0;
  } else if (shorterTopMesh) {
    shorterTopMesh.updateMatrixWorld(true);
    yBottom = new THREE.Box3().setFromObject(shorterTopMesh).max.y;
  } else {
    const t = hm.topThickness || PLANK_THICKNESS_MM;
    yBottom = Number(hm.shorterTop) + t;
  }
  if (tallerTopMesh) {
    yTop = _topCapBottomWorldY(tallerTopMesh);
  } else {
    yTop = Number(hm.tallerTop);
  }
  return _applyHeightMismatchOverlayVerticalSpan(mesh, yBottom, yTop);
}

function _applyHeightMismatchOverlayDepth(mesh, wallName, depthMm, depthCenterWorld) {
  if (!mesh?.isMesh || !(depthMm > 0) || depthCenterWorld == null) return false;
  const useZ = _wallUsesZAxis(wallName);
  mesh.updateMatrixWorld(true);
  const trimBox = new THREE.Box3().setFromObject(mesh);
  const params = mesh.geometry?.parameters;
  const capH = params?.height ?? (trimBox.max.y - trimBox.min.y);
  const capW = useZ
    ? (params?.depth ?? (trimBox.max.z - trimBox.min.z))
    : (params?.width ?? (trimBox.max.x - trimBox.min.x));
  mesh.geometry.dispose();
  mesh.geometry = useZ
    ? new THREE.BoxGeometry(depthMm, capH, capW)
    : new THREE.BoxGeometry(capW, capH, depthMm);
  mesh.position.set(
    useZ ? depthCenterWorld : (trimBox.min.x + trimBox.max.x) / 2,
    mesh.position.y,
    useZ ? (trimBox.min.z + trimBox.max.z) / 2 : depthCenterWorld
  );
  const hm = mesh.userData.heightMismatch || {};
  mesh.userData.heightMismatch = { ...hm, depthMm, depthCenterWorld };
  const w = useZ ? depthMm : capW;
  const d = useZ ? capW : depthMm;
  mesh.userData.cldTrimBaseSize = { w, h: capH, d };
  mesh.userData.cldTrimBasePosition = mesh.position.clone();
  _syncTrimNominalAfterHeightChange(mesh);
  return true;
}

function _finalizeHeightMismatchOverlayDepth(mesh, wallName) {
  const secId = mesh.userData?.sectionId;
  const sec =
    secId && Array.isArray(state.customSections)
      ? state.customSections.find((s) => String(s?.id) === String(secId))
      : null;
  if (!sec?.group) return false;
  const bounds = _sectionDepthOuterBoundsWorld(sec, wallName);
  if (!bounds) return false;
  const { depthMm, center } = _depthSpanRecessedFromFront(bounds, OVERLAY_TOP_OVERHANG_MM);
  return _applyHeightMismatchOverlayDepth(mesh, wallName, depthMm, center);
}

function _finalizeHeightMismatchOverlaysOnWall(wallName) {
  if (!state.scene) return;
  const norm = String(wallName || '').trim().toLowerCase();
  state.scene.traverse((obj) => {
    if (!obj?.userData?.isTransitionHeightMismatch) return;
    if (String(obj.userData?.wallName || '').toLowerCase() !== norm) return;
    _finalizeHeightMismatchOverlayVertical(obj, norm);
    _finalizeHeightMismatchOverlayDepth(obj, norm);
  });
}

/**
 * Rule: if two adjacent furniture items have different heights, add a 16mm vertical overlay
 * on the side of the TALLER item facing the shorter one, spanning only the height delta.
 * This does NOT consume layout width; it's a facade/trim element for the step.
 */
function _buildHeightMismatchSideOverlay(leftGrp, rightGrp, wallName, transitionKey) {
  if (!state.scene) return;
  // Кухня НМ: без 16мм HeightMismatch (шкафная/тумбовая обкладка).
  if (isKitchenBaseGroup(leftGrp) || isKitchenBaseGroup(rightGrp)) return;
  try {
    const leftBox = _furnitureBBox(leftGrp);
    const rightBox = _furnitureBBox(rightGrp);
    if (leftBox.isEmpty() || rightBox.isEmpty()) return;

    const epsH = 2; // mm
    const leftTop = leftBox.max.y;
    const rightTop = rightBox.max.y;
    if (Math.abs(leftTop - rightTop) <= epsH) return;

    const tallerGrp = leftTop > rightTop ? leftGrp : rightGrp;
    const shorterGrp = leftTop > rightTop ? rightGrp : leftGrp;
    const shorterTop = Math.min(leftTop, rightTop);
    const tallerBox = leftTop > rightTop ? leftBox : rightBox;
    const tallerTop = Math.max(leftTop, rightTop);

    const useZ = _wallUsesZAxis(wallName);
    const capW = SIDE_CAP_W_MM;
    const sectionId =
      tallerGrp.userData?.sectionId || shorterGrp.userData?.sectionId || null;
    const _sec = sectionId && Array.isArray(state.customSections)
      ? state.customSections.find((s) => s?.id === sectionId)
      : null;
    // Нижний навес выше соседа: закрыть открытый бок/опоры — от пола до низа топа.
    const tallerIsHangLow = isWallHungLowPlacementKind(
      tallerGrp.userData?.__placementKind
    );
    const floorY = _sec?.group != null ? Number(_sec.group.position.y || 0) : 0;
    const span = _heightMismatchOverlayVerticalSpanMm(
      shorterTop,
      tallerTop,
      _sectionTopCapThicknessMm(_sec, wallName),
      tallerIsHangLow ? { fromFloorY: floorY } : null
    );
    const { yBottom, yTop, capH } = span;
    if (capH < 5) return;
    const secDepthW = _sectionTrimDepthMm(_sec);
    const furnDepthW = useZ
      ? tallerBox.max.x - tallerBox.min.x
      : tallerBox.max.z - tallerBox.min.z;
    const fullDepthW = Math.max(furnDepthW, secDepthW, 10);
    if (fullDepthW < 10) return;

    // Side facing neighbor: if taller is left, overlay on its RIGHT side; else on LEFT side.
    const side = tallerGrp === leftGrp ? 'right' : 'left';
    const boundaryU = useZ
      ? (side === 'right' ? tallerBox.max.z : tallerBox.min.z)
      : (side === 'right' ? tallerBox.max.x : tallerBox.min.x);
    const sign = side === 'right' ? +1 : -1;
    const centerU = boundaryU + sign * capW / 2;
    const centerY = yBottom + capH / 2;
    const fallbackDepthCenter = _sec
      ? _sectionTrimDepthCenterWorld(_sec, wallName)
      : (useZ
        ? tallerBox.min.x + furnDepthW / 2
        : tallerBox.min.z + furnDepthW / 2);
    const depthPose = _heightMismatchOverlayDepthPose(
      _sec,
      wallName,
      fullDepthW,
      fallbackDepthCenter
    );
    const spanW = depthPose.depthMm;
    const centerW = depthPose.center ?? fallbackDepthCenter;

    const geom = useZ
      ? new THREE.BoxGeometry(spanW, capH, capW)
      : new THREE.BoxGeometry(capW, capH, spanW);
    const mesh = new THREE.Mesh(geom, _makeMat());
    mesh.name = 'TransitionSideOverlayHeightMismatch';
    _tagMesh(mesh, wallName, `${transitionKey}_hm_${side}`, tallerGrp.userData?.sectionId || null);
    _tagAsFacadeTrim(mesh, 'side', wallName);
    mesh.userData.isTransitionHeightMismatch = true;
    mesh.userData.heightMismatch = {
      side,
      tallerTop,
      shorterTop,
      capH,
      yBottom,
      yTop,
      topThickness: span.topThickness,
      fromFloor: !!span.fromFloor,
      tallerUuid: tallerGrp.uuid,
      shorterUuid: shorterGrp.uuid,
    };
    mesh.position.set(
      useZ ? centerW : centerU,
      centerY,
      useZ ? centerU : centerW
    );
    state.scene.add(mesh);
    console.log('[TRANSITION] ✅ HeightMismatchSideOverlay', {
      wallName,
      side,
      capW: Math.round(capW),
      capH: Math.round(capH),
      yFrom: Math.round(yBottom),
      yTo: Math.round(yTop),
    });
  } catch (e) {
    console.warn('[TRANSITION] _buildHeightMismatchSideOverlay error', e);
  }
}

function _footprintSpanAlongUMm(fp, useZ) {
  return useZ ? fp.maxZ - fp.minZ : fp.maxX - fp.minX;
}

/** Глубина секции для обклада (W): не сжимается вместе с customDepthMm тумбы. */
function _sectionTrimDepthMm(sec) {
  if (!sec?.size) return 0;
  const wallName = sec.wallName || 'back';
  const useZ = _wallUsesZAxis(wallName);
  const stored = Number(sec.facadeDepthMm || 0);
  if (stored > 0) return stored;
  return useZ ? Number(sec.size.x || 0) : Number(sec.size.z || 0);
}

/** Мировой центр на оси глубины (торец у стены … передний край секции). */
function _sectionTrimDepthCenterWorld(sec, wallName) {
  const norm = String(wallName || sec?.wallName || 'back').trim().toLowerCase();
  const useZ = _wallUsesZAxis(norm);
  const depth = _sectionTrimDepthMm(sec);
  const p = sec?.group?.position;
  if (!p || !(depth > 0)) return null;
  if (!useZ) {
    return norm === 'front' ? p.z - depth / 2 : p.z + depth / 2;
  }
  return norm === 'left' ? p.x + depth / 2 : p.x - depth / 2;
}

/** Центр глубины накладки — как SectionZoneCap (size секции, не bbox мебели). */
function _sectionLayoutCapDepthCenterWorld(sec, wallName, depthMm) {
  const norm = String(wallName || sec?.wallName || 'back').trim().toLowerCase();
  const useZ = _wallUsesZAxis(norm);
  const depth = Number(depthMm);
  const p = sec?.group?.position;
  if (!p || !(depth > 0)) return null;
  if (!useZ) {
    return norm === 'front' ? p.z - depth / 2 : p.z + depth / 2;
  }
  return norm === 'left' ? p.x + depth / 2 : p.x - depth / 2;
}

/** Локальный центр по глубине (пивот секции у стены → +W в комнату). */
function _sectionTrimDepthCenterLocal(sec, wallName) {
  const depth = _sectionTrimDepthMm(sec);
  if (!(depth > 0)) return null;
  const norm = String(wallName || sec?.wallName || 'back').trim().toLowerCase();
  const useZ = _wallUsesZAxis(norm);
  if (!useZ) {
    return norm === 'front' ? -depth / 2 : depth / 2;
  }
  return norm === 'left' ? depth / 2 : -depth / 2;
}

/** Внешние грани секции по оси глубины (стена … фасад), world. */
function _sectionDepthOuterBoundsWorld(sec, wallName) {
  const norm = String(wallName || sec?.wallName || 'back').trim().toLowerCase();
  const useZ = _wallUsesZAxis(norm);
  const p = sec?.group?.position;
  const depthW = _sectionTrimDepthMm(sec);
  if (!p || !(depthW > 0)) return null;
  if (!useZ) {
    const wallCoord = p.z;
    const lo = norm === 'front' ? wallCoord - depthW : wallCoord;
    const hi = norm === 'front' ? wallCoord : wallCoord + depthW;
    return { axis: 'z', lo, hi, frontAtMax: norm !== 'front' };
  }
  const wallCoord = p.x;
  const lo = norm === 'right' ? wallCoord - depthW : wallCoord;
  const hi = norm === 'right' ? wallCoord : wallCoord + depthW;
  return { axis: 'x', lo, hi, frontAtMax: norm === 'left' };
}

/** Укоротить span по глубине с фасада на recessMm (топ выступает на 1 мм). */
function _depthSpanRecessedFromFront(bounds, recessMm) {
  const r = Math.max(0, Number(recessMm) || 0);
  let lo = bounds.lo;
  let hi = bounds.hi;
  if (bounds.frontAtMax) hi -= r;
  else lo += r;
  const depthMm = Math.max(10, hi - lo);
  return { depthMm, center: (lo + hi) / 2 };
}

/** Глубина стыковой накладки: как топ секции, но −1 мм с фасада. */
function _heightMismatchOverlayDepthPose(sec, wallName, fallbackDepthMm, fallbackCenterWorld) {
  const bounds = sec ? _sectionDepthOuterBoundsWorld(sec, wallName) : null;
  if (bounds) return _depthSpanRecessedFromFront(bounds, OVERLAY_TOP_OVERHANG_MM);
  const depthMm = Math.max(10, Number(fallbackDepthMm) - OVERLAY_TOP_OVERHANG_MM);
  if (fallbackCenterWorld == null) return { depthMm, center: null };
  const norm = String(wallName || sec?.wallName || 'back').trim().toLowerCase();
  const useZ = _wallUsesZAxis(norm);
  const shift = OVERLAY_TOP_OVERHANG_MM / 2;
  const sign = !useZ ? (norm === 'front' ? 1 : -1) : (norm === 'left' ? -1 : 1);
  return { depthMm, center: fallbackCenterWorld + sign * shift };
}

/** Глубина в комнату (W) — по секции (как SideCap), не по узкому bbox тумбы. */
function _extendFootprintDepthToSection(fp, sec, wallName, useZ) {
  if (!fp || !sec?.group || !sec?.size) return fp;
  const norm = String(wallName || '').trim().toLowerCase();
  const p = sec.group.position;
  const depthW = _sectionTrimDepthMm(sec);

  if (!useZ) {
    const outerMin = norm === 'front' ? (p.z - depthW) : p.z;
    const outerMax = norm === 'front' ? p.z : (p.z + depthW);
    if (outerMax > outerMin + 1) {
      fp.minZ = outerMin;
      fp.maxZ = outerMax;
    }
  } else if (norm === 'left') {
    const outerMin = p.x;
    const outerMax = p.x + depthW;
    if (outerMax > outerMin + 1) {
      fp.minX = outerMin;
      fp.maxX = outerMax;
    }
  } else if (norm === 'right') {
    const outerMin = p.x - depthW;
    const outerMax = p.x;
    if (outerMax > outerMin + 1) {
      fp.minX = outerMin;
      fp.maxX = outerMax;
    }
  }
  return fp;
}

function _shouldExtendTopFootprintDepthToSection(grp, sec) {
  if (!grp || !sec?.size) return false;
  const pk = grp.userData?.__placementKind;
  if (
    !isLowFurniturePlacementKind(pk) &&
    !isWallHungHighPlacementKind(pk)
  ) {
    return false;
  }
  const customDepthMm = Number(grp.userData?.customDepthMm || 0) || 0;
  if (customDepthMm > 0) return true;
  const secDepth = _sectionTrimDepthMm(sec);
  if (!(secDepth > 10)) return false;
  const useZ = _wallUsesZAxis(sec.wallName);
  const box = _furnitureBBox(grp);
  if (box.isEmpty()) return false;
  const furnDepth = useZ ? box.max.x - box.min.x : box.max.z - box.min.z;
  return furnDepth > 10 && furnDepth < secDepth - 8;
}

/**
 * Footprint для топа низкой мебели (с расширением до планки/накладки секции).
 * @returns {null|{ minX,maxX,minZ,maxZ,topY,h,sectionId }}
 */
function _computeExtendedTopFootprint(grp, wallName) {
  if (!grp) return null;
  // Верхний навес: фасадный топ снизу корпуса, не сверху.
  if (isWallHungHighPlacementKind(grp.userData?.__placementKind)) return null;
  // Кухня НМ: без «крышки тумбы» (TransitionAutoTopCap) — только монтажные планки из JSON.
  if (isKitchenBaseGroup(grp)) return null;
  // U/глубина — по корпусу; topY — по крышке админки (если есть), иначе верх корпуса.
  const corpus = computeFurnitureCorpusLayoutWorldBBoxNoAo(grp);
  const box = !corpus.isEmpty() ? corpus : _furnitureBBox(grp);
  if (box.isEmpty()) return null;
  const h = box.max.y - box.min.y;
  if (!Number.isFinite(h) || h >= AUTO_TOP_HEIGHT_LIMIT_MM) return null;

  const topY = _standaloneLidTopYMm(grp);
  if (!(topY > 0)) return null;

  const useZ = _wallUsesZAxis(wallName);

  let minX = box.min.x;
  let maxX = box.max.x;
  let minZ = box.min.z;
  let maxZ = box.max.z;

  const secId = grp.userData?.sectionId || null;
  const sec = secId && Array.isArray(state.customSections)
    ? state.customSections.find((s) => s?.id === secId)
    : null;
  if (sec?.group && sec?.size) {
    const bounds = computeSectionInnerBoundsU(sec);
    const nearEps = 28;
    const kindMin = bounds.minEdge?.kind;
    const kindMax = bounds.maxEdge?.kind;
    const isOverlayMin = kindMin === 'overlay' || kindMin === 'end_cabinet_overlay';
    const isOverlayMax = kindMax === 'overlay' || kindMax === 'end_cabinet_overlay';
    const isPlankMin = kindMin === 'plank';
    const isPlankMax = kindMax === 'plank';

    if (!useZ) {
      if (isPlankMin && Math.abs(minX - bounds.innerStartU) <= nearEps) minX = bounds.outerMinU;
      if (isPlankMax && Math.abs(maxX - bounds.innerEndU) <= nearEps) maxX = bounds.outerMaxU;
      if (isOverlayMin && Math.abs(minX - bounds.innerStartU) <= nearEps) {
        minX = bounds.outerMinU - OVERLAY_TOP_OVERHANG_MM;
      }
      if (isOverlayMax && Math.abs(maxX - bounds.innerEndU) <= nearEps) {
        maxX = bounds.outerMaxU + OVERLAY_TOP_OVERHANG_MM;
      }
    } else {
      if (isPlankMin && Math.abs(minZ - bounds.innerStartU) <= nearEps) minZ = bounds.outerMinU;
      if (isPlankMax && Math.abs(maxZ - bounds.innerEndU) <= nearEps) maxZ = bounds.outerMaxU;
      if (isOverlayMin && Math.abs(minZ - bounds.innerStartU) <= nearEps) {
        minZ = bounds.outerMinU - OVERLAY_TOP_OVERHANG_MM;
      }
      if (isOverlayMax && Math.abs(maxZ - bounds.innerEndU) <= nearEps) {
        maxZ = bounds.outerMaxU + OVERLAY_TOP_OVERHANG_MM;
      }
    }
  }

  const fp = {
    minX,
    maxX,
    minZ,
    maxZ,
    topY,
    h,
    sectionId: secId,
  };
  if (sec && _shouldExtendTopFootprintDepthToSection(grp, sec)) {
    _extendFootprintDepthToSection(fp, sec, wallName, useZ);
  }

  if (fp.maxX - fp.minX < 10 || fp.maxZ - fp.minZ < 10) return null;
  return fp;
}

function _createAutoTopCapFromFootprint(fp, wallName, transitionKey, extra = {}) {
  if (!state.scene || !fp) return;
  const wX = fp.maxX - fp.minX;
  const dZ = fp.maxZ - fp.minZ;
  if (wX < 10 || dZ < 10) return;

  const geom = new THREE.BoxGeometry(wX, PLANK_THICKNESS_MM, dZ);
  const mesh = new THREE.Mesh(geom, _makeMat());
  mesh.name = 'TransitionAutoTopCap';
  _tagMesh(mesh, wallName, `${transitionKey}_auto_top`, fp.sectionId || null);
  mesh.userData.isTransitionAutoTopCap = true;
  _tagAsFacadeTrim(mesh, 'top', wallName);
  mesh.userData.trimPartKey = 'transition_top_cap';
  mesh.userData.autoTopRule = {
    maxHeightMm: AUTO_TOP_HEIGHT_LIMIT_MM,
    furnitureHeightMm: fp.h,
    mergeMaxUMm: AUTO_TOP_MERGE_MAX_U_MM,
    ...extra,
  };
  if (extra.furnitureUuids) mesh.userData.mergedTopFurnitureUuids = extra.furnitureUuids;
  mesh.position.set(
    (fp.minX + fp.maxX) / 2,
    fp.topY + PLANK_THICKNESS_MM / 2,
    (fp.minZ + fp.maxZ) / 2
  );
  state.scene.add(mesh);
}

/** Фасадный «топ» снизу верхнего навеса (как перевёрнутый нижний). */
function _createAutoBottomCapFromFootprint(fp, wallName, transitionKey, extra = {}) {
  if (!state.scene || !fp) return;
  const wX = fp.maxX - fp.minX;
  const dZ = fp.maxZ - fp.minZ;
  if (wX < 10 || dZ < 10) return;
  const bottomY = Number(fp.bottomY);
  if (!Number.isFinite(bottomY)) return;

  const geom = new THREE.BoxGeometry(wX, PLANK_THICKNESS_MM, dZ);
  const mesh = new THREE.Mesh(geom, _makeMat());
  mesh.name = 'TransitionAutoBottomCap';
  _tagMesh(mesh, wallName, `${transitionKey}_auto_bottom`, fp.sectionId || null);
  mesh.userData.isTransitionAutoBottomCap = true;
  mesh.userData.isTransitionAutoTopCap = true; // фасадный цвет / cleanup как топ
  _tagAsFacadeTrim(mesh, 'top', wallName);
  mesh.userData.trimPartKey = 'transition_top_cap';
  mesh.userData.autoBottomHangHigh = true;
  if (extra.furnitureUuids) mesh.userData.mergedTopFurnitureUuids = extra.furnitureUuids;
  mesh.position.set(
    (fp.minX + fp.maxX) / 2,
    bottomY - PLANK_THICKNESS_MM / 2,
    (fp.minZ + fp.maxZ) / 2
  );
  state.scene.add(mesh);
}

/**
 * Footprint нижней фасадной крышки верхнего навеса.
 * @returns {null|{ minX,maxX,minZ,maxZ,bottomY,h,sectionId }}
 */
function _computeExtendedBottomFootprintHangHigh(grp, wallName) {
  if (!grp || !isWallHungHighPlacementKind(grp.userData?.__placementKind)) return null;
  const corpus = computeFurnitureCorpusLayoutWorldBBoxNoAo(grp);
  const box = !corpus.isEmpty() ? corpus : _furnitureBBox(grp);
  if (box.isEmpty()) return null;
  const h = box.max.y - box.min.y;
  if (!Number.isFinite(h) || h < 10) return null;
  const bottomY = box.min.y;
  if (!Number.isFinite(bottomY)) return null;

  const useZ = _wallUsesZAxis(wallName);
  let minX = box.min.x;
  let maxX = box.max.x;
  let minZ = box.min.z;
  let maxZ = box.max.z;
  const secId = grp.userData?.sectionId;
  const sec =
    secId && Array.isArray(state.customSections)
      ? state.customSections.find((s) => s?.id === secId)
      : null;
  if (sec) {
    const fp = { minX, maxX, minZ, maxZ, bottomY, h, sectionId: sec.id };
    if (_shouldExtendTopFootprintDepthToSection(grp, sec)) {
      _extendFootprintDepthToSection(fp, sec, wallName, useZ);
    }
    // Extend U like top for hang high (reuse plank bounds if any)
    try {
      const bounds = computeSectionInnerBoundsU(sec, wallName);
      if (bounds) {
        const zi = grp.userData?.zoneIndex;
        // keep corpus U; depth already extended
        void zi;
      }
    } catch (_) {}
    return fp;
  }
  return {
    minX,
    maxX,
    minZ,
    maxZ,
    bottomY,
    h,
    sectionId: secId ?? null,
  };
}

/** Нижние фасадные крышки ряда верхних навесов. */
function _buildWallHungHighBottomCapsOnWall(wallName, sorted) {
  if (!state.scene) return;
  const norm = String(wallName || '').trim().toLowerCase();
  let meshIdx = 0;
  for (const grp of sorted || []) {
    if (!isWallHungHighPlacementKind(grp?.userData?.__placementKind)) continue;
    if (!_furnitureSectionIsOrdinaryStraight(grp)) continue;
    const fw = String(grp.userData?.wallName || norm).trim().toLowerCase();
    if (fw !== norm) continue;
    const fp = _computeExtendedBottomFootprintHangHigh(grp, wallName);
    if (!fp) continue;
    const key = `furn_${wallName}_auto_btm_${meshIdx++}`;
    try {
      _createAutoBottomCapFromFootprint(fp, wallName, key, {
        furnitureUuids: [grp.uuid],
      });
    } catch (e) {
      console.warn('[TRANSITION] AutoBottomCap hang-high failed', e);
    }
  }
}

/**
 * Сосед-шкаф (ниша) слева/справа от навеса. Пусто / комод → null.
 * side: 'left'|'right' относительно hangGrp.
 * Соседство: zoneIndex ±1 или U-зазор ≤ 200 мм.
 */
function _findAdjacentWardrobeNeighborForHang(hangGrp, side, sorted, wallName) {
  if (!hangGrp || !sorted?.length) return null;
  const useZ = _wallUsesZAxis(wallName);
  let hBox = computeFurnitureCorpusLayoutWorldBBoxNoAo(hangGrp);
  if (!hBox || hBox.isEmpty()) hBox = _furnitureBBox(hangGrp);
  if (hBox.isEmpty()) return null;
  const myLo = useZ ? hBox.min.z : hBox.min.x;
  const myHi = useZ ? hBox.max.z : hBox.max.x;
  const hangSid = String(hangGrp.userData?.sectionId ?? '');
  const hangZi = Number(hangGrp.userData?.zoneIndex);
  const gapTol = 200;

  let best = null;
  let bestDist = Infinity;
  for (const other of sorted) {
    if (!other || other === hangGrp) continue;
    if (_isSameZoneCohabitPair(hangGrp, other)) continue;
    const pk =
      String(other.userData?.__placementKind || '').trim() ||
      PLACEMENT_KIND.FLOOR_IN_NICHE;
    // Шкаф в нише (не навес, не комод).
    if (isLowFurniturePlacementKind(pk) || isWallHungHighPlacementKind(pk)) continue;
    if (pk !== PLACEMENT_KIND.FLOOR_IN_NICHE && pk !== '') continue;
    if (String(other.userData?.sectionId ?? '') !== hangSid) continue;
    const oZi = Number(other.userData?.zoneIndex);
    if (Number.isFinite(hangZi) && Number.isFinite(oZi) && oZi === hangZi) continue;

    const zoneAdj =
      Number.isFinite(hangZi) &&
      Number.isFinite(oZi) &&
      Math.abs(oZi - hangZi) === 1 &&
      ((side === 'left' && oZi < hangZi) || (side === 'right' && oZi > hangZi));

    let oBox = computeFurnitureCorpusLayoutWorldBBoxNoAo(other);
    if (!oBox || oBox.isEmpty()) oBox = _furnitureBBox(other);
    if (oBox.isEmpty()) continue;
    const oLo = useZ ? oBox.min.z : oBox.min.x;
    const oHi = useZ ? oBox.max.z : oBox.max.x;

    if (side === 'left') {
      const dist = myLo - oHi;
      const nearU = dist >= -25 && dist <= gapTol && oLo < myLo - 5;
      if (!zoneAdj && !nearU) continue;
      const score = zoneAdj ? Math.min(dist, 0) : dist;
      if (score < bestDist) {
        bestDist = score;
        best = other;
      }
    } else {
      const dist = oLo - myHi;
      const nearU = dist >= -25 && dist <= gapTol && oHi > myHi + 5;
      if (!zoneAdj && !nearU) continue;
      const score = zoneAdj ? Math.min(dist, 0) : dist;
      if (score < bestDist) {
        bestDist = score;
        best = other;
      }
    }
  }
  return best;
}

/** Окно / bay — спец (не §6.7). L целиком больше не спец: см. `_furnitureSectionIsOrdinaryStraight` / §6.8 A1. */
function _isSpecialLayoutSection(sec) {
  if (!sec) return true;
  if (
    sec.windowAlongWallGroupId ||
    sec.windowAlongWallRole ||
    sec.windowBridgeGroupId ||
    sec.windowBridgeRole ||
    sec.underWindowBay ||
    sec.windowLowSlot
  ) {
    return true;
  }
  // lShape: не blanket-special (путь A). §6.3/§6.6 — `_isStraightSectionForTrimHeight` (A1: L = true).
  return false;
}

/**
 * §6.8: cornerAtStart по typeKey (локальная копия, без импорта section-manager).
 * @returns {boolean|null}
 */
function _lCornerAtStartForSection(sec) {
  if (sec?.lShape && typeof sec.lShape.cornerAtStart === 'boolean') {
    return sec.lShape.cornerAtStart;
  }
  const typeKey = String(sec?.division?.typeKey || sec?.lShape?.type || '').trim();
  const map = {
    'corner-back-right': false,
    'corner-wardrobe': false,
    'top-right': false,
    'corner-back-left': true,
    'corner-wardrobe-left': true,
    'top-left': true,
    'corner-right-front': false,
    'corner-right-back': true,
    'corner-front-left': false,
    'corner-front-right': true,
    'corner-left-front': true,
    'corner-left-back': false,
  };
  if (typeKey in map) return map[typeKey];
  return null;
}

/**
 * Спец-зона угла L / торцевой — не свободное плечо (§6.8).
 */
function _isLCornerSpecialFurniture(grp, sec) {
  if (!grp || !sec?.lShape) return false;
  const ud = grp.userData || {};
  if (ud.isEndCabinet === true || ud.isEndCabinetSlot === true) return true;

  const div = sec.division;
  const freeSize = Number(div?.freeSizeMm);
  const sectionStart = Number(div?.sectionStart);
  const cornerAtStart = _lCornerAtStartForSection(sec);

  if (
    Number.isFinite(freeSize) &&
    freeSize > 0 &&
    Number.isFinite(sectionStart) &&
    cornerAtStart != null
  ) {
    const useZ = _wallUsesZAxis(sec.wallName || ud.wallName);
    let box = null;
    try {
      box = computeFurnitureCorpusLayoutWorldBBoxNoAo(grp);
    } catch (_) {}
    if (!box || box.isEmpty()) box = _furnitureBBox(grp);
    if (!box || box.isEmpty()) return false;
    const mid = useZ
      ? (box.min.z + box.max.z) / 2
      : (box.min.x + box.max.x) / 2;
    if (cornerAtStart) {
      const cornerW = Number(div.cornerWidthMm) || 0;
      const freeLo = sectionStart + Math.max(0, cornerW);
      const freeHi = freeLo + freeSize;
      // Вне свободного U → спец угла (или зазор).
      return !(mid >= freeLo - 8 && mid <= freeHi + 8);
    }
    const freeLo = sectionStart;
    const freeHi = sectionStart + freeSize;
    return !(mid >= freeLo - 8 && mid < freeHi + 8);
  }

  // Fallback: cornerAtStart → zone 0, иначе последняя зона.
  const parts = Math.max(
    1,
    Number(div?.parts) || 0,
    Number(div?.partCount) || 0
  );
  const zi = Number(ud.zoneIndex);
  if (!Number.isFinite(zi) || cornerAtStart == null) {
    // Нет разметки свободного плеча — не считаем спец (лучше §6.7 на плече, чем skip всего).
    return false;
  }
  const cornerZi = cornerAtStart ? 0 : parts - 1;
  return zi === cornerZi;
}

/**
 * §6.7 / §6.8 A1: обычная прямая ИЛИ свободное плечо L (не спец угла, не окно/bay).
 */
function _getFurnitureSection(grp) {
  if (!grp?.userData?.sectionId || !Array.isArray(state.customSections)) return null;
  return (
    state.customSections.find(
      (s) => String(s?.id) === String(grp.userData.sectionId)
    ) || null
  );
}

function _furnitureIsLCornerSpecial(grp) {
  const sec = _getFurnitureSection(grp);
  return !!(sec?.lShape && _isLCornerSpecialFurniture(grp, sec));
}

function _furnitureSectionIsOrdinaryStraight(grp) {
  const sec = _getFurnitureSection(grp);
  if (!sec) return false;
  if (_isSpecialLayoutSection(sec)) return false;
  if (sec.lShape) {
    return !_isLCornerSpecialFurniture(grp, sec);
  }
  return true;
}

/**
 * §6.8 A2: hangward SideCap — high на плече + шкаф в спец угла той же секции
 * (шкаф не ordinary, но стык нужен).
 */
function _hangWardrobeSideCapAllowed(hangGrp, wardrobe) {
  if (!_furnitureSectionIsOrdinaryStraight(hangGrp)) return false;
  if (_furnitureSectionIsOrdinaryStraight(wardrobe)) return true;
  const hSec = _getFurnitureSection(hangGrp);
  const wSec = _getFurnitureSection(wardrobe);
  if (!hSec?.lShape || !wSec?.lShape) return false;
  if (String(hSec.id) !== String(wSec.id)) return false;
  return _isLCornerSpecialFurniture(wardrobe, wSec);
}

/**
 * Есть ли мебель у world-U торца секции (min/max).
 * Совпадает с полосой `_filterFurnitureNearSectionUEdge` / near-side рамки.
 */
function _sectionWorldUEdgeHasFurniture(sec, wallName, logicalEdge) {
  if (!sec?.group || !state.scene || !logicalEdge) return false;
  const useZ = _wallUsesZAxis(wallName);
  const sid = String(sec.id);
  const inSec = [];
  state.scene.traverse((o) => {
    if (!_isTransitionWallFurnitureRoot(o)) return;
    if (String(o.userData?.sectionId ?? '') !== sid) return;
    if (o.userData?.isGhost || o.userData?.isGhostClodisPrebuild) return;
    o.updateMatrixWorld(true);
    const box = _furnitureBBox(o);
    if (box.isEmpty()) return;
    inSec.push({ box, fU: _worldUSpanFromBox(box, useZ) });
  });
  if (!inSec.length) return false;
  const size = sec.size || {};
  const span = useZ ? Number(size.z) || 0 : Number(size.x) || 0;
  const pos = sec.group.position;
  const wall = String(wallName || '').trim().toLowerCase();
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
  const band = _TRIM_OUTER_EDGE_EPS_MM + 220;
  return inSec.some(({ fU }) =>
    logicalEdge === 'min' ? fU.min <= secUMin + band : fU.max >= secUMax - band
  );
}

/**
 * Стык навес|шкаф: SideCap fullH в buildPairs.
 * Свободный бок верхнего навеса при низком соседе — см. _buildHangHighSideOverlaysVsAdjacentLowOnWall.
 */
function _buildWardrobeSideOverlayFromHangHighBottomOnWall(_wallName, _sorted) {
  return;
}

/**
 * Соседняя ячейка слева/справа: низкий (комод/тумба/нижний навес), не шкаф.
 * Пусто / шкаф → null. side: 'left'|'right' от hangGrp.
 */
function _findAdjacentLowNeighborForHang(hangGrp, side, sorted, wallName) {
  if (!hangGrp || !sorted?.length) return null;
  const useZ = _wallUsesZAxis(wallName);
  let hBox = computeFurnitureCorpusLayoutWorldBBoxNoAo(hangGrp);
  if (!hBox || hBox.isEmpty()) hBox = _furnitureBBox(hangGrp);
  if (hBox.isEmpty()) return null;
  const myLo = useZ ? hBox.min.z : hBox.min.x;
  const myHi = useZ ? hBox.max.z : hBox.max.x;
  const hangZi = Number(hangGrp.userData?.zoneIndex);
  const hangSid = String(hangGrp.userData?.sectionId ?? '');
  const gapTol = 200;

  let best = null;
  let bestDist = Infinity;
  for (const other of sorted) {
    if (!other || other === hangGrp) continue;
    if (_isSameZoneCohabitPair(hangGrp, other)) continue;
    const pk = String(other.userData?.__placementKind || '');
    if (!isLowFurniturePlacementKind(pk)) continue;
    if (String(other.userData?.sectionId ?? '') !== hangSid) continue;
    const oZi = Number(other.userData?.zoneIndex);
    if (Number.isFinite(hangZi) && Number.isFinite(oZi) && oZi === hangZi) continue;

    const zoneAdj =
      Number.isFinite(hangZi) &&
      Number.isFinite(oZi) &&
      Math.abs(oZi - hangZi) === 1 &&
      ((side === 'left' && oZi < hangZi) || (side === 'right' && oZi > hangZi));

    let oBox = computeFurnitureCorpusLayoutWorldBBoxNoAo(other);
    if (!oBox || oBox.isEmpty()) oBox = _furnitureBBox(other);
    if (oBox.isEmpty()) continue;
    const oLo = useZ ? oBox.min.z : oBox.min.x;
    const oHi = useZ ? oBox.max.z : oBox.max.x;

    if (side === 'left') {
      const dist = myLo - oHi;
      const nearU = dist >= -25 && dist <= gapTol && oLo < myLo - 5;
      if (!zoneAdj && !nearU) continue;
      const score = zoneAdj ? Math.min(dist, 0) : dist;
      if (score < bestDist) {
        bestDist = score;
        best = other;
      }
    } else {
      const dist = oLo - myHi;
      const nearU = dist >= -25 && dist <= gapTol && oHi > myHi + 5;
      if (!zoneAdj && !nearU) continue;
      const score = zoneAdj ? Math.min(dist, 0) : dist;
      if (score < bestDist) {
        bestDist = score;
        best = other;
      }
    }
  }
  return best;
}

/**
 * Верхний навес + слева/справа низкий: накладка на свободном боку навеса.
 * Высота = корпус навеса + снизу AutoBottom (16) + сверху потолочная планка.
 * Сторона со шкафом — не трогаем (SideCap fullH).
 */
function _buildHangHighSideOverlaysVsAdjacentLowOnWall(wallName, sorted) {
  if (!state.scene || !sorted?.length) return;
  const norm = String(wallName || '').trim().toLowerCase();
  const useZ = _wallUsesZAxis(wallName);
  let meshIdx = 0;

  for (const grp of sorted) {
    if (!isWallHungHighPlacementKind(grp?.userData?.__placementKind)) continue;
    // Спец-секции (окно/L) — не этот эталон.
    if (!_furnitureSectionIsOrdinaryStraight(grp)) continue;
    const fw = String(grp.userData?.wallName || norm).trim().toLowerCase();
    if (fw !== norm) continue;

    let hangBox = computeFurnitureCorpusLayoutWorldBBoxNoAo(grp);
    if (!hangBox || hangBox.isEmpty()) hangBox = _furnitureBBox(grp);
    if (hangBox.isEmpty()) continue;

    const sectionId = grp.userData?.sectionId || null;
    const _sec =
      sectionId && Array.isArray(state.customSections)
        ? state.customSections.find((s) => s?.id === sectionId)
        : null;
    // Корпус + нижняя фасадная крышка навеса + верхняя планка №1.
    const yBottom = hangBox.min.y - PLANK_THICKNESS_MM;
    const yTop = hangBox.max.y + _sectionTopPlankHeightMm(_sec);
    if (!(yTop - yBottom > 5)) continue;

    for (const side of ['left', 'right']) {
      if (_findAdjacentWardrobeNeighborForHang(grp, side, sorted, wallName)) {
        continue;
      }
      const lowNeighbor = _findAdjacentLowNeighborForHang(
        grp,
        side,
        sorted,
        wallName
      );
      if (!lowNeighbor) continue;

      const secDepthW = _sectionTrimDepthMm(_sec);
      const furnDepthW = useZ
        ? hangBox.max.x - hangBox.min.x
        : hangBox.max.z - hangBox.min.z;
      const fullDepthW = Math.max(furnDepthW, secDepthW, 10);
      if (fullDepthW < 10) continue;

      const capW = SIDE_CAP_W_MM;
      const capH = yTop - yBottom;
      const boundaryU = useZ
        ? side === 'right'
          ? hangBox.max.z
          : hangBox.min.z
        : side === 'right'
          ? hangBox.max.x
          : hangBox.min.x;
      const sign = side === 'right' ? +1 : -1;
      const centerU = boundaryU + (sign * capW) / 2;
      const centerY = yBottom + capH / 2;
      const fallbackDepthCenter = _sec
        ? _sectionTrimDepthCenterWorld(_sec, wallName)
        : useZ
          ? hangBox.min.x + furnDepthW / 2
          : hangBox.min.z + furnDepthW / 2;
      const depthPose = _heightMismatchOverlayDepthPose(
        _sec,
        wallName,
        fullDepthW,
        fallbackDepthCenter
      );
      const spanW = depthPose.depthMm;
      const centerW = depthPose.center ?? fallbackDepthCenter;
      const key = `furn_${wallName}_hang_adjlow_${meshIdx++}_${side}`;
      const geom = useZ
        ? new THREE.BoxGeometry(spanW, capH, capW)
        : new THREE.BoxGeometry(capW, capH, spanW);
      const mesh = new THREE.Mesh(geom, _makeMat());
      mesh.name = 'TransitionSideOverlayHeightMismatch';
      _tagMesh(mesh, wallName, key, sectionId);
      _tagAsFacadeTrim(mesh, 'side', wallName);
      mesh.userData.isTransitionHeightMismatch = true;
      mesh.userData.hangHighVsAdjacentLow = true;
      mesh.userData.heightMismatch = {
        side,
        tallerTop: yTop,
        shorterTop: yBottom,
        capH,
        yBottom,
        yTop,
        topThickness: 0,
        fromFloor: false,
        tallerUuid: grp.uuid,
        hangHighVsAdjacentLow: true,
      };
      mesh.position.set(
        useZ ? centerW : centerU,
        centerY,
        useZ ? centerU : centerW
      );
      state.scene.add(mesh);
      console.log('[TRANSITION] ✅ HangHighVsAdjacentLow', {
        wallName,
        side,
        capH: Math.round(capH),
        yFrom: Math.round(yBottom),
        yTo: Math.round(yTop),
      });
    }
  }
}

/** Колонка с верхним навесом у стыка — fullH SideCap не ставить. */
function _standaloneIsHangColumnWithHigh(standaloneGrp) {
  if (!standaloneGrp) return false;
  if (isWallHungHighPlacementKind(standaloneGrp.userData?.__placementKind)) {
    return true;
  }
  if (!isLowFurniturePlacementKind(standaloneGrp.userData?.__placementKind)) {
    return false;
  }
  return !!_sameZoneCohabitPartnerHangHigh(standaloneGrp);
}

function _sameZoneCohabitPartnerHangHigh(grp) {
  if (!grp || !state.scene) return null;
  let found = null;
  state.scene.traverse((o) => {
    if (found || o === grp || !_isTransitionWallFurnitureRoot(o)) return;
    if (!_isSameZoneCohabitPair(grp, o)) return;
    if (isWallHungHighPlacementKind(o.userData?.__placementKind)) found = o;
  });
  return found;
}

/** Ширина тумбы вдоль U для лимита 2750 — зона секции (1085), не union bbox. */
function _topCapWidthAlongUMm(grp, wallName, fp, useZ) {
  let mod = _moduleWidthAlongWallMm(grp, wallName);
  const secId = grp.userData?.sectionId;
  const sec =
    secId && Array.isArray(state.customSections)
      ? state.customSections.find((s) => s?.id === secId)
      : null;
  const partSize = Number(sec?.division?.partSize);
  if (
    (!Number.isFinite(mod) || mod <= 10 || mod > AUTO_TOP_MERGE_MAX_U_MM + 200) &&
    Number.isFinite(partSize) &&
    partSize > 10
  ) {
    mod = partSize;
  }
  if (Number.isFinite(mod) && mod > 10) return mod;
  return _footprintSpanAlongUMm(fp, useZ);
}

function _ensureSectionLayoutForTopMerge(sec) {
  if (!sec) return;
  if (typeof window.__clodisComputeSectionLayout === 'function') {
    try {
      window.__clodisComputeSectionLayout(sec);
    } catch (e) {
      console.warn('[TRANSITION] layout for AutoTopCap', e);
    }
  }
}

/** Актуальный layout всех секций на стене (топы, планки, зоны). */
function _ensureWallSectionsLayout(wallName) {
  if (!Array.isArray(state.customSections)) return;
  const norm = String(wallName || '').trim().toLowerCase();
  for (const sec of state.customSections) {
    if ((sec.wallName || '').toLowerCase() !== norm) continue;
    _ensureSectionLayoutForTopMerge(sec);
  }
}

/**
 * Топ высокой мебели до внешней грани TransitionSideOverlayHeightMismatch вплотную.
 * Без OVERLAY_TOP_OVERHANG_MM: упирается в накладку, не выступает за неё.
 * Накладка: tallerUuid ∈ furnitureUuids, side left|right.
 */
function _extendTopUSpanToHeightMismatchFlush(wallName, furnitureUuids, uLo, uHi) {
  let lo = uLo;
  let hi = uHi;
  if (!state.scene || !furnitureUuids?.length) return { uLo: lo, uHi: hi };
  const useZ = _wallUsesZAxis(wallName);
  const norm = String(wallName || '').trim().toLowerCase();
  const uuidSet = new Set(
    furnitureUuids.map((u) => String(u || '')).filter(Boolean)
  );
  if (!uuidSet.size) return { uLo: lo, uHi: hi };

  state.scene.traverse((obj) => {
    if (!obj?.userData?.isTransitionHeightMismatch) return;
    if (String(obj.userData?.wallName || '').trim().toLowerCase() !== norm) return;
    const tallerUuid = String(obj.userData?.heightMismatch?.tallerUuid || '');
    if (!uuidSet.has(tallerUuid)) return;
    const side = obj.userData?.heightMismatch?.side;
    try {
      obj.updateMatrixWorld(true);
    } catch (_) {}
    const box = new THREE.Box3().setFromObject(obj);
    if (box.isEmpty()) return;
    const oLo = useZ ? box.min.z : box.min.x;
    const oHi = useZ ? box.max.z : box.max.x;
    if (side === 'right') {
      hi = Math.max(hi, oHi);
    } else if (side === 'left') {
      lo = Math.min(lo, oLo);
    }
  });
  return { uLo: lo, uHi: hi };
}

/** Расширить span чанка до внешней грани планки/накладки (не на резерв торцевого). */
function _extendUSpanForChunkPlanks(sec, uLo, uHi, chunk, _wallName) {
  let lo = uLo;
  let hi = uHi;
  if (!sec?.group || !chunk?.length) return { uLo: lo, uHi: hi };

  const edgeEps = 28;
  try {
    const bounds = computeSectionInnerBoundsU(sec);
    const innerMinU = bounds.innerStartU;
    const innerMaxU = bounds.innerEndU;
    if (!(Number.isFinite(innerMinU) && Number.isFinite(innerMaxU) && innerMaxU > innerMinU)) {
      return { uLo: lo, uHi: hi };
    }
    const kindMin = bounds.minEdge?.kind;
    const kindMax = bounds.maxEdge?.kind;
    const isOverlayMin = kindMin === 'overlay' || kindMin === 'end_cabinet_overlay';
    const isOverlayMax = kindMax === 'overlay' || kindMax === 'end_cabinet_overlay';
    const isPlankMin = kindMin === 'plank';
    const isPlankMax = kindMax === 'plank';

    if (uLo <= innerMinU + edgeEps) {
      if (isOverlayMin) lo = bounds.outerMinU - OVERLAY_TOP_OVERHANG_MM;
      else if (isPlankMin) lo = bounds.outerMinU;
    }
    if (uHi >= innerMaxU - edgeEps) {
      if (isOverlayMax) hi = bounds.outerMaxU + OVERLAY_TOP_OVERHANG_MM;
      else if (isPlankMax) hi = bounds.outerMaxU;
    }
  } catch (_) {}
  return { uLo: lo, uHi: hi };
}

/**
 * Жадно от торца у шкафа (min U в chain): merge растёт от cap, лимит 2750 мм;
 * «хвост» — отдельная плита на дальнем торце (не изолированная тумба у шкафа).
 */
function _partitionLayoutChainByMaxU(chain, maxUMm) {
  const groups = [];
  let start = 0;
  while (start < chain.length) {
    let end = start;
    let sumW = Number(chain[start].widthU) || 0;
    while (end < chain.length - 1) {
      const addW = Number(chain[end + 1].widthU) || 0;
      if (sumW + addW > maxUMm + 0.5) break;
      end += 1;
      sumW += addW;
    }
    groups.push(chain.slice(start, end + 1));
    start = end + 1;
  }
  return groups;
}

/** Разбить цепочку тумб по высоте верха (topY): разная высота → отдельные топы. */
function _partitionChainByTopY(chain, toleranceMm) {
  const tol = Number.isFinite(toleranceMm) ? toleranceMm : AUTO_TOP_Y_MERGE_TOLERANCE_MM;
  const groups = [];
  let current = [];
  for (const c of chain) {
    if (current.length) {
      const prevY = Number(current[current.length - 1]?.fp?.topY);
      const nextY = Number(c?.fp?.topY);
      if (
        Number.isFinite(prevY) &&
        Number.isFinite(nextY) &&
        Math.abs(prevY - nextY) > tol
      ) {
        groups.push(current);
        current = [];
      }
    }
    current.push(c);
  }
  if (current.length) groups.push(current);
  return groups.length ? groups : [chain];
}

function _emitLayoutTopCapChunks(sec, chain, wallName, useZ, keyFn, allSectionItems = [], skipWardrobeSingle = null) {
  const covered = new Set();
  if (!chain.length) return covered;
  const heightGroups = _partitionChainByTopY(chain, AUTO_TOP_Y_MERGE_TOLERANCE_MM);
  for (const heightChain of heightGroups) {
  const parts = _partitionLayoutChainByMaxU(heightChain, AUTO_TOP_MERGE_MAX_U_MM);
  for (const chunk of parts) {
    // Одна тумба у шкафа: TransitionTopCap уже есть — не дублировать AutoTopCap.
    if (
      chunk.length === 1 &&
      skipWardrobeSingle?.size &&
      skipWardrobeSingle.has(chunk[0]?.fp?.grp?.uuid)
    ) {
      continue;
    }

    let uLo = Math.min(...chunk.map((c) => c.seg.startU));
    let uHi = Math.max(...chunk.map((c) => c.seg.endU));

    let minZ = Infinity;
    let maxZ = -Infinity;
    let topY = 0;
    let h = 0;
    for (const c of chunk) {
      minZ = Math.min(minZ, c.fp.minZ);
      maxZ = Math.max(maxZ, c.fp.maxZ);
      topY = Math.max(topY, c.fp.topY);
      h = Math.max(h, c.fp.h);
    }
    if (!Number.isFinite(minZ) || !Number.isFinite(maxZ)) continue;

    const furnUuids = chunk.map((c) => c.fp.grp?.uuid).filter(Boolean);
    // HM-накладка: топ вплотную к внешней грани (без +1 мм). Потом торец секции §4.1.
    const hmExt = _extendTopUSpanToHeightMismatchFlush(wallName, furnUuids, uLo, uHi);
    uLo = hmExt.uLo;
    uHi = hmExt.uHi;
    const ext = _extendUSpanForChunkPlanks(sec, uLo, uHi, chunk, wallName);
    uLo = ext.uLo;
    uHi = ext.uHi;

    const fp = {
      minX: Math.min(...chunk.map((c) => c.fp.minX)),
      maxX: Math.max(...chunk.map((c) => c.fp.maxX)),
      minZ,
      maxZ,
      topY,
      h,
      sectionId: sec.id,
    };
    if (!useZ) {
      fp.minX = uLo;
      fp.maxX = uHi;
    } else {
      fp.minZ = uLo;
      fp.maxZ = uHi;
    }
    _extendFootprintDepthToSection(fp, sec, wallName, useZ);

    const sumModuleW = chunk.reduce((s, c) => s + (Number(c.widthU) || 0), 0);
    if (chunk.length >= 2) {
      for (const id of furnUuids) covered.add(id);
    }
    const key = keyFn();
    try {
      _createAutoTopCapFromFootprint(fp, wallName, key, {
        mergedTumbaCount: chunk.length,
        uSpanMm: Math.round(uHi - uLo),
        sumModuleWidthMm: Math.round(sumModuleW),
        furnitureUuids: furnUuids,
        layoutDriven: true,
      });
      console.log('[TRANSITION] ✅ AutoTopCap layout', {
        wallName,
        key,
        tumbaCount: chunk.length,
        topYmm: Math.round(topY),
        uSpanMm: Math.round(uHi - uLo),
        sumModuleWidthMm: Math.round(sumModuleW),
        zones: chunk.map((c) => c.seg.zoneIndex),
        sectionId: sec.id,
      });
    } catch (e) {
      console.warn('[TRANSITION] _emitLayoutTopCapChunks error', e);
    }
  }
  }
  return covered;
}

/** Убрать TransitionTopCap на тумбе, если её зона вошла в общий AutoTopCap (≥2 модулей). */
function _removeTransitionTopCapsForMergedStandalones(uuids) {
  if (!state.scene || !uuids?.size) return;
  const remove = [];
  state.scene.traverse((obj) => {
    if (!obj?.userData?.isTransitionTopCap) return;
    if (uuids.has(obj.userData.transitionStandaloneUuid)) remove.push(obj);
  });
  for (const obj of remove) {
    const standaloneUuid = obj.userData?.transitionStandaloneUuid;
    try {
      obj.geometry?.dispose?.();
      if (obj.parent) obj.parent.remove(obj);
      else state.scene.remove(obj);
    } catch (_) {}
    if (standaloneUuid) {
      const grp = _findFurnitureGrpByUuid(standaloneUuid);
      if (grp) setCatalogHorizontalTopVisible(grp, true);
    }
  }
}

/**
 * Топы тумб: цепочки по зонам, лимит 2750 мм.
 * Через границы секций на стене (окно: tall|под окном|tall) — тот же merge, без windowBridge*.
 * @returns {Set<string>} uuid тумб в merge ≥2 (снять дубль TransitionTopCap)
 */
function _buildMergedAutoTopCapsOnWall(wallName, sorted) {
  const multiMergedStandalone = new Set();
  if (!state.scene || !Array.isArray(state.customSections)) return multiMergedStandalone;
  const norm = String(wallName || '').trim().toLowerCase();
  const useZ = _wallUsesZAxis(wallName);
  const fpByUuid = new Map();
  const skipWardrobeSingle = _standaloneUuidsWithWardrobeTopCap(sorted);

  for (const grp of sorted) {
    const base = _computeExtendedTopFootprint(grp, wallName);
    if (!base) continue;
    fpByUuid.set(grp.uuid, { ...base, grp });
  }

  let meshIdx = 0;
  const nextKey = () => `furn_${wallName}_auto_${meshIdx++}`;

  const crossHandled = _buildCrossSectionAdjacentAutoTops(
    wallName,
    sorted,
    fpByUuid,
    useZ,
    nextKey,
    skipWardrobeSingle
  );
  for (const id of crossHandled.uuids) multiMergedStandalone.add(id);

  for (const sec of state.customSections) {
    if ((sec.wallName || '').toLowerCase() !== norm) continue;
    // Legacy underWindowBay (крышка 16 мм): не дублировать AutoTop.
    if (sec.underWindowBay && !sec.fixedHeightMm) continue;
    if (crossHandled.sectionIds.has(String(sec.id))) continue;
    _ensureSectionLayoutForTopMerge(sec);
    const covered = _mergeTumbaTopsOnSection(
      sec,
      fpByUuid,
      wallName,
      useZ,
      nextKey,
      skipWardrobeSingle
    );
    for (const id of covered) multiMergedStandalone.add(id);
  }
  return multiMergedStandalone;
}

/**
 * Один AutoTop на непрерывный низкий ряд через ≥2 секции стены (без windowBridgeGroupId).
 */
function _buildCrossSectionAdjacentAutoTops(
  wallName,
  sorted,
  fpByUuid,
  useZ,
  nextKey,
  skipWardrobeSingle
) {
  const uuids = new Set();
  const sectionIds = new Set();
  if (!Array.isArray(state.customSections)) return { uuids, sectionIds };

  const norm = String(wallName || '').trim().toLowerCase();
  const members = state.customSections.filter(
    (s) => s && (s.wallName || '').toLowerCase() === norm
  );
  if (members.length < 2) return { uuids, sectionIds };

  const items = [];
  for (const grp of sorted) {
    const sid = grp.userData?.sectionId;
    if (sid == null) continue;
    const fp = fpByUuid.get(grp.uuid);
    if (!fp) continue;
    const startU = useZ ? fp.minZ : fp.minX;
    const endU = useZ ? fp.maxZ : fp.maxX;
    if (!Number.isFinite(startU) || !Number.isFinite(endU)) continue;
    items.push({
      fp,
      seg: { startU, endU, zoneIndex: grp.userData?.zoneIndex },
      widthU: Math.max(10, endU - startU),
    });
  }
  items.sort((a, b) => a.seg.startU - b.seg.startU);
  if (!items.length) return { uuids, sectionIds };

  const chains = [];
  let chain = [];
  for (const item of items) {
    if (chain.length) {
      const gapU = Number(item.seg.startU) - Number(chain[chain.length - 1].seg.endU);
      if (gapU > 25) {
        chains.push(chain);
        chain = [];
      }
    }
    chain.push(item);
  }
  if (chain.length) chains.push(chain);

  const repSec =
    members.find((s) => Number(s.fixedHeightMm) > 0) ||
    members.find((s) => s.underWindowBay) ||
    members[0];

  let mergedCross = false;
  for (const ch of chains) {
    const heightGroups = _partitionChainByTopY(ch, AUTO_TOP_Y_MERGE_TOLERANCE_MM);
    for (const heightChain of heightGroups) {
      const secInChunk = new Set(
        heightChain.map((c) => String(c.fp?.grp?.userData?.sectionId ?? ''))
      );
      secInChunk.delete('');
      if (secInChunk.size < 2) continue;
      const covered = _emitLayoutTopCapChunks(
        repSec,
        heightChain,
        wallName,
        useZ,
        nextKey,
        items,
        skipWardrobeSingle
      );
      for (const id of covered) uuids.add(id);
      for (const c of heightChain) {
        const id = c.fp?.grp?.uuid;
        if (id) uuids.add(id);
      }
      for (const id of secInChunk) sectionIds.add(id);
      mergedCross = true;
    }
  }
  if (mergedCross) {
    for (const s of members) {
      if (s.underWindowBay && !s.fixedHeightMm) {
        try {
          setUnderWindowBayTopVisible(s, false);
        } catch (_) {}
      }
    }
  }
  return { uuids, sectionIds };
}

// ─── TopPlank / BottomPlank: разбиение по зонам ≤ 2750 мм (как §6.4.1) ───────

function _getZoneEntriesForHorizontalPlankSplit(sec) {
  _ensureSectionLayoutForTopMerge(sec);
  const spanTop = computeHorizontalTrimSpanU(sec, { forPlinth: false });
  // Крайние сегменты №1/№3 всегда до эталонного span (outer при overlay, reserve при торцевом).
  const expandEntries = (entries) => {
    if (!entries?.length) return entries;
    if (!(spanTop.widthU > 10)) return entries;
    const out = entries.map((e) => ({ ...e }));
    out[0].uLo = spanTop.uLo;
    out[0].widthU = out[0].uHi - out[0].uLo;
    const last = out[out.length - 1];
    last.uHi = spanTop.uHi;
    last.widthU = last.uHi - last.uLo;
    return out;
  };

  const segs = sec._layoutCache?.segments;
  if (Array.isArray(segs) && segs.length) {
    const modules = segs
      .filter((s) => s.type === 'module')
      .map((s) => ({
        uLo: Number(s.startU),
        uHi: Number(s.endU),
        widthU: Math.max(10, Number(s.endU - s.startU) || 0),
      }))
      .filter((e) => Number.isFinite(e.uLo) && Number.isFinite(e.uHi))
      .sort((a, b) => a.uLo - b.uLo);
    if (modules.length) return expandEntries(modules);
  }
  if (spanTop.widthU > 10) {
    return [{ uLo: spanTop.uLo, uHi: spanTop.uHi, widthU: spanTop.widthU }];
  }
  return null;
}

function _splitIntervalByMaxUFromRight(uLo, uHi, maxUMm) {
  const out = [];
  let hi = uHi;
  while (hi - uLo > maxUMm + 0.5) {
    const lo = hi - maxUMm;
    out.push({ uLo: lo, uHi: hi, widthU: hi - lo });
    hi = lo;
  }
  out.push({ uLo, uHi: hi, widthU: hi - uLo });
  return out.reverse();
}

/** Жадно справа по зонам; одна зона > maxU — режем по длине без привязки к мебели. */
function _partitionZoneEntriesForPlankMaxU(entries, maxUMm) {
  if (!entries?.length) return [];
  const sorted = [...entries].sort((a, b) => a.uLo - b.uLo);
  const chains = [];
  let chain = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].uLo - chain[chain.length - 1].uHi;
    if (gap > 25) {
      chains.push(chain);
      chain = [sorted[i]];
    } else {
      chain.push(sorted[i]);
    }
  }
  chains.push(chain);

  const ranges = [];
  for (const ch of chains) {
    const spanW = ch[ch.length - 1].uHi - ch[0].uLo;
    if (ch.length === 1 && spanW > maxUMm + 0.5) {
      ranges.push(..._splitIntervalByMaxUFromRight(ch[0].uLo, ch[0].uHi, maxUMm));
      continue;
    }
    let end = ch.length - 1;
    while (end >= 0) {
      let start = end;
      let sumW = Number(ch[end].widthU) || 0;
      while (start > 0) {
        const addW = Number(ch[start - 1].widthU) || 0;
        if (sumW + addW > maxUMm + 0.5) break;
        start -= 1;
        sumW += addW;
      }
      ranges.push({
        uLo: ch[start].uLo,
        uHi: ch[end].uHi,
        widthU: ch[end].uHi - ch[start].uLo,
      });
      end = start - 1;
    }
  }
  return ranges;
}

function _removePlankLengthSegments(sec, kind) {
  const toRemove = [];
  sec.group.traverse((obj) => {
    if (!obj?.isMesh || !obj.userData?.isPlankLengthSegment) return;
    if (kind === 'top' && obj.userData.isTopPlank) toRemove.push(obj);
    if (kind === 'bottom' && obj.userData.isBottomPlank) toRemove.push(obj);
  });
  for (const o of toRemove) {
    try {
      o.geometry?.dispose?.();
      o.parent?.remove(o);
    } catch (_) {}
  }
}

function _findBaseHorizontalPlank(sec, kind) {
  let base = null;
  let firstLengthSeg = null;
  sec.group.traverse((obj) => {
    if (!obj?.isMesh) return;
    if (kind === 'top' && obj.userData?.isTopPlank && !obj.userData?.isTopPlankSegment) {
      if (!obj.userData?.isPlankLengthSegment) base = base || obj;
      else firstLengthSeg = firstLengthSeg || obj;
    }
    if (kind === 'bottom' && obj.userData?.isBottomPlank) {
      if (!obj.userData?.isPlankLengthSegment) base = base || obj;
      else firstLengthSeg = firstLengthSeg || obj;
    }
  });
  return base || firstLengthSeg;
}

function _createHorizontalPlankSegment(sec, template, range, wallName, kind, index) {
  const useZ = _wallUsesZAxis(wallName);
  const spanU = range.uHi - range.uLo;
  if (spanU < 5 || !template) return null;

  const pivot = sec.group.position;
  const centerU = (range.uLo + range.uHi) / 2;

  const mat =
    template.material?.clone?.() ||
    new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.8 });

  const isTop = kind === 'top';
  const plankH = isTop ? _sectionTopPlankHeightMm(sec) : BOTTOM_PLANK_H_MM;
  const sizeY = Number(sec?.size?.y) || 0;
  // Y не копировать с template: после смены filler.topMm шаблон мог быть 50 мм,
  // а сегмент должен сидеть у потолка секции на своей высоте.
  const posY = isTop && sizeY > 0 ? sizeY - plankH / 2 : template.position.y;

  let mesh;
  if (useZ) {
    mesh = new THREE.Mesh(new THREE.BoxGeometry(H_PLANK_DEPTH_MM, plankH, spanU), mat);
    mesh.position.set(template.position.x, posY, centerU - pivot.z);
  } else {
    mesh = new THREE.Mesh(new THREE.BoxGeometry(spanU, plankH, H_PLANK_DEPTH_MM), mat);
    mesh.position.set(centerU - pivot.x, posY, template.position.z);
  }

  mesh.name = isTop ? (index === 0 ? 'TopPlank' : `TopPlank_${index}`) : (index === 0 ? 'BottomPlank' : `BottomPlank_${index}`);
  mesh.userData.isFacade = true;
  mesh.userData.isSectionFacadeTrim = true;
  mesh.userData.sectionTrimUsesOutsideDecor = true;
  mesh.userData.isPlankLengthSegment = true;
  if (isTop) {
    mesh.userData.isTopPlank = true;
    mesh.userData.plankHeight = plankH;
  } else {
    mesh.userData.isBottomPlank = true;
    mesh.userData.plankHeight = BOTTOM_PLANK_H_MM;
  }
  assignTrimPartKeyToMesh(mesh, wallName);
  return mesh;
}

/** Крайние диапазоны цоколя: подрезаем на толщину фасада торцевого. */
function _insetPlinthRangesForEndCabinet(sec, ranges) {
  const wallName = String(sec?.wallName || 'back').toLowerCase();
  const alongFrontBack = wallName === 'front' || wallName === 'back';
  const insetLo = getEndCabinetRowPlinthInsetMm(sec, alongFrontBack ? 'left' : 'front');
  const insetHi = getEndCabinetRowPlinthInsetMm(sec, alongFrontBack ? 'right' : 'back');
  if (!(insetLo > 0) && !(insetHi > 0)) return ranges;

  const out = ranges.map((r) => ({ ...r }));
  const sorted = [...out].sort((a, b) => a.uLo - b.uLo);
  if (insetLo > 0) {
    const first = sorted[0];
    first.uLo = Math.min(first.uHi - 5, first.uLo + insetLo);
    first.widthU = first.uHi - first.uLo;
  }
  if (insetHi > 0) {
    const last = sorted[sorted.length - 1];
    last.uHi = Math.max(last.uLo + 5, last.uHi - insetHi);
    last.widthU = last.uHi - last.uLo;
  }
  return out;
}

function _expandOccupiedEntriesToTrimEdges(entries, spanTop) {
  if (!entries?.length || !(spanTop?.widthU > 10)) return entries || [];
  const eps = 80;
  const out = entries.map((e) => ({ ...e }));
  if (Math.abs(out[0].uLo - spanTop.uLo) <= eps) {
    out[0].uLo = spanTop.uLo;
    out[0].widthU = out[0].uHi - out[0].uLo;
  }
  const last = out[out.length - 1];
  if (Math.abs(last.uHi - spanTop.uHi) <= eps) {
    last.uHi = spanTop.uHi;
    last.widthU = last.uHi - last.uLo;
  }
  return out;
}

/**
 * Жёстко обрезать ranges в [span.uLo, span.uHi].
 * Нужно для №3: expand с eps=80 не всегда; цоколь не должен лезть в зазор 50 у L (§4.0.3 / §6.8.3).
 */
function _clampRangesToHorizontalSpan(ranges, span) {
  if (!ranges?.length) return ranges || [];
  const sLo = Number(span?.uLo);
  const sHi = Number(span?.uHi);
  if (!(Number.isFinite(sLo) && Number.isFinite(sHi) && sHi > sLo + 10)) {
    return ranges;
  }
  const out = [];
  for (const r of ranges) {
    const uLo = Math.max(Number(r.uLo), sLo);
    const uHi = Math.min(Number(r.uHi), sHi);
    if (!(uHi - uLo > 10)) continue;
    out.push({ ...r, uLo, uHi, widthU: uHi - uLo });
  }
  return out.length ? out : ranges;
}

/** Expand №1 к торцу секции только если между краем шкафа и стеной нет комода. */
function _expandTallTopAvoidingLow(tallEntries, lowEntries, spanTop) {
  if (!tallEntries?.length || !(spanTop?.widthU > 10)) return tallEntries || [];
  const eps = 80;
  const out = tallEntries
    .map((e) => ({ uLo: e.uLo, uHi: e.uHi, widthU: e.widthU }))
    .sort((a, b) => a.uLo - b.uLo);
  const lowBetween = (lo, hi) =>
    (lowEntries || []).some((l) => l.uHi > lo + 5 && l.uLo < hi - 5);
  if (
    Math.abs(out[0].uLo - spanTop.uLo) <= eps &&
    !lowBetween(spanTop.uLo, out[0].uLo + 1)
  ) {
    out[0].uLo = spanTop.uLo;
    out[0].widthU = out[0].uHi - out[0].uLo;
  }
  const last = out[out.length - 1];
  if (
    Math.abs(last.uHi - spanTop.uHi) <= eps &&
    !lowBetween(last.uHi - 1, spanTop.uHi)
  ) {
    last.uHi = spanTop.uHi;
    last.widthU = last.uHi - last.uLo;
  }
  return out;
}

/** Мебель секции с флагом высокой (≥1500) — для топа только над шкафом и разрыва цоколя на стыке. */
function _getOccupiedFurnitureUEntriesWithTall(sec) {
  if (!sec?.id) return [];
  const sid = String(sec.id);
  const wallName = sec.wallName || 'back';
  const useZ = _wallUsesZAxis(wallName);
  const out = [];
  for (const g of _getFurnitureOnWallSorted(wallName)) {
    if (String(g.userData?.sectionId ?? '') !== sid) continue;
    if (g.userData?.isGhost || g.userData?.isGhostClodisPrebuild) continue;
    // Корпус без дверей/декора — иначе открытая дверь раздувает U и «увозит» №1.
    let b = computeFurnitureCorpusLayoutWorldBBoxNoAo(g);
    if (!b || b.isEmpty()) b = _furnitureBBox(g);
    if (b.isEmpty()) continue;
    const uLo = useZ ? b.min.z : b.min.x;
    const uHi = useZ ? b.max.z : b.max.x;
    if (!(uHi - uLo > 10)) continue;
    out.push({
      uLo,
      uHi,
      widthU: uHi - uLo,
      isTall: _furnitureIsTallForTrim(g, b),
      needsPlinth: needsFloorPlinthPlacementKind(g.userData?.__placementKind),
      zoneIndex: Number.isFinite(Number(g.userData?.zoneIndex))
        ? Number(g.userData.zoneIndex)
        : null,
      grp: g,
    });
  }
  return out.sort((a, b) => a.uLo - b.uLo);
}

/** Склеивать по U только одинаковые по высоте (высокая|низкая) — разрыв цоколя на накладке шкаф↔комод. */
function _partitionOccupiedByTallBand(entries, maxUMm) {
  if (!entries?.length) return [];
  const sorted = [...entries].sort((a, b) => a.uLo - b.uLo);
  const bands = [];
  let band = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const prev = band[band.length - 1];
    const cur = sorted[i];
    const gap = cur.uLo - prev.uHi;
    if (gap > 25 || !!cur.isTall !== !!prev.isTall) {
      bands.push(band);
      band = [cur];
    } else {
      band.push(cur);
    }
  }
  bands.push(band);
  const ranges = [];
  for (const ch of bands) {
    ranges.push(..._partitionZoneEntriesForPlankMaxU(ch, maxUMm));
  }
  return ranges;
}

/** №1 только над высокими модулями; U из layout (+ стык cap), не из раздутого bbox. */
function _getTallTopRangesFromLayout(sec) {
  _ensureSectionLayoutForTopMerge(sec);
  const segs = sec?._layoutCache?.segments;
  if (!Array.isArray(segs) || !segs.length) return null;

  const modules = segs.filter((s) => s && s.type === 'module');
  const caps = segs.filter((s) => s && s.type === 'cap');
  if (!modules.length) return null;
  // Пока uuid зон не проставлены — layout ещё не привязан к мебели, берём bbox-fallback.
  if (!modules.some((m) => m.furnitureUuid)) return null;

  const ranges = [];
  for (const mod of modules) {
    const uuid = mod.furnitureUuid;
    let grp = uuid ? _findFurnitureGrpByUuid(uuid) : null;
    let b = grp ? computeFurnitureCorpusLayoutWorldBBoxNoAo(grp) : null;
    if (!b || b.isEmpty()) b = grp ? _furnitureBBox(grp) : null;
    // В ячейке может быть base+upper: furnitureUuid часто у нижнего — ищем высокий в зоне.
    if (!grp || !b || b.isEmpty() || !_furnitureIsTallForTrim(grp, b)) {
      const zi = Number(mod.zoneIndex);
      const sid = sec?.id;
      if (sid != null && Number.isFinite(zi) && state.scene) {
        let tallGrp = null;
        state.scene.traverse((o) => {
          if (tallGrp || !o?.userData?.isFurniture) return;
          if (String(o.userData.sectionId) !== String(sid)) return;
          if (Number(o.userData.zoneIndex) !== zi) return;
          let bb = computeFurnitureCorpusLayoutWorldBBoxNoAo(o);
          if (!bb || bb.isEmpty()) bb = _furnitureBBox(o);
          if (!bb.isEmpty() && _furnitureIsTallForTrim(o, bb)) tallGrp = o;
        });
        if (tallGrp) {
          grp = tallGrp;
          b = computeFurnitureCorpusLayoutWorldBBoxNoAo(grp);
          if (!b || b.isEmpty()) b = _furnitureBBox(grp);
        }
      }
    }
    if (!grp || !b || b.isEmpty() || !_furnitureIsTallForTrim(grp, b)) continue;

    let uLo = Number(mod.startU);
    let uHi = Number(mod.endU);
    if (!(uHi > uLo + 10)) continue;

    // Стык cap: топ заканчивается на грани накладки со стороны шкафа (не заезжает на комод).
    for (const cap of caps) {
      const cLo = Number(cap.startU);
      const cHi = Number(cap.endU);
      if (!(cHi > cLo)) continue;
      // Cap сразу справа от модуля шкафа.
      if (cLo >= uHi - 5 && cLo <= uHi + 25) {
        uHi = Math.min(uHi, cLo);
      }
      // Cap сразу слева от модуля шкафа.
      if (cHi <= uLo + 5 && cHi >= uLo - 25) {
        uLo = Math.max(uLo, cHi);
      }
    }

    if (uHi - uLo > 10) {
      ranges.push({
        uLo,
        uHi,
        widthU: uHi - uLo,
        zoneIndex: Number.isFinite(Number(mod.zoneIndex))
          ? Number(mod.zoneIndex)
          : null,
        grp,
      });
    }
  }
  return ranges.sort((a, b) => a.uLo - b.uLo);
}

function _splitSectionHorizontalPlanks(sec, wallName) {
  if (!_isStraightSectionForTrimHeight(sec)) return;

  const items = _getOccupiedFurnitureUEntriesWithTall(sec);
  if (!items.length) {
    _removePlankLengthSegments(sec, 'top');
    _removePlankLengthSegments(sec, 'bottom');
    return;
  }

  const spanTop = computeHorizontalTrimSpanU(sec, { forPlinth: false });
  const tallItems = items.filter((e) => e.isTall);
  const lowItems = items.filter((e) => !e.isTall);

  // Топ: сначала layout-зоны высоких (стабильно при посадке комода), иначе bbox.
  let topSource = _getTallTopRangesFromLayout(sec);
  if (topSource == null) {
    topSource = _clampTallTopAtLowNeighbors(
      tallItems.map((e) => ({
        uLo: e.uLo,
        uHi: e.uHi,
        widthU: e.widthU,
        zoneIndex: e.zoneIndex,
        grp: e.grp,
      })),
      lowItems
    );
  } else {
    // Layout-ranges тоже не режем нижним навесом той же ячейки.
    topSource = _clampTallTopAtLowNeighbors(topSource, lowItems);
  }
  if (topSource.length) {
    if (!lowItems.length) {
      topSource = _expandOccupiedEntriesToTrimEdges(topSource, spanTop);
    } else {
      topSource = _expandTallTopAvoidingLow(topSource, lowItems, spanTop);
    }
  }
  const topRanges = topSource.length
    ? _partitionZoneEntriesForPlankMaxU(topSource, AUTO_TOP_MERGE_MAX_U_MM)
    : [];

  // Цоколь: только под напольными (шкаф/тумба). Навес — без №3.
  const plinthItems = items.filter((e) => e.needsPlinth);
  const bottomRangesRaw = plinthItems.length
    ? _partitionOccupiedByTallBand(plinthItems, AUTO_TOP_MERGE_MAX_U_MM)
    : [];
  let bottomRanges = bottomRangesRaw.length
    ? _insetPlinthRangesForEndCabinet(sec, bottomRangesRaw)
    : [];
  // §4.0.3: цоколь под шкафом = ширина шкафа (как №1). Не длиннее топа / span.
  // Иначе у L спец bbox/сегмент цоколя лезет в CORNER_GAP 50, а №1 уже по зоне.
  if (bottomRanges.length) {
    if (topRanges.length && !lowItems.length) {
      const topLo = Math.min(...topRanges.map((r) => Number(r.uLo)));
      const topHi = Math.max(...topRanges.map((r) => Number(r.uHi)));
      bottomRanges = _clampRangesToHorizontalSpan(bottomRanges, {
        uLo: topLo,
        uHi: topHi,
        widthU: topHi - topLo,
      });
    } else {
      const spanBot = computeHorizontalTrimSpanU(sec, { forPlinth: true });
      bottomRanges = _expandOccupiedEntriesToTrimEdges(bottomRanges, spanBot);
      bottomRanges = _clampRangesToHorizontalSpan(bottomRanges, spanBot);
    }
  }

  for (const kind of ['top', 'bottom']) {
    const kindRanges = kind === 'top' ? topRanges : bottomRanges;
    if (!kindRanges?.length) {
      _removePlankLengthSegments(sec, kind);
      const templateGone = _findBaseHorizontalPlank(sec, kind);
      if (templateGone) {
        try {
          templateGone.geometry?.dispose?.();
          templateGone.parent?.remove(templateGone);
        } catch (_) {}
      }
      continue;
    }
    const template = _findBaseHorizontalPlank(sec, kind);
    if (!template) continue;

    _removePlankLengthSegments(sec, kind);
    try {
      template.geometry?.dispose?.();
      template.parent?.remove(template);
    } catch (_) {}

    kindRanges.forEach((range, index) => {
      const mesh = _createHorizontalPlankSegment(sec, template, range, wallName, kind, index);
      if (mesh) {
        mesh.visible = true;
        sec.group.add(mesh);
      }
    });
  }

  console.log('[PLANK-SPLIT] section', {
    sectionId: sec.id,
    wall: wallName,
    occupiedCount: items.length,
    tallCount: tallItems.length,
    topFromLayout: true,
    topRangeCount: topRanges.length,
    bottomRangeCount: bottomRanges.length,
    topSpansMm: topRanges.map((r) => Math.round(r.widthU)),
    bottomSpansMm: bottomRanges.map((r) => Math.round(r.widthU)),
    maxUMm: AUTO_TOP_MERGE_MAX_U_MM,
  });
}

function _splitHorizontalPlanksForWall(wallName) {
  if (!state.scene || !Array.isArray(state.customSections)) return;
  const norm = String(wallName || '').trim().toLowerCase();
  try {
    if (typeof window.__cldEnsureStraightFrameMeshesOnWall === 'function') {
      window.__cldEnsureStraightFrameMeshesOnWall(wallName);
    }
  } catch (_) {}
  for (const sec of state.customSections) {
    if ((sec.wallName || '').toLowerCase() !== norm) continue;
    _splitSectionHorizontalPlanks(sec, wallName);
  }
}

// ─── Step 3B: Horizontal top cap + cover of shared TopPlank ──────────────────

/**
 * Horizontal «крышка» тумбы: от грани SideCap со стороны тумбы до дальнего торца тумбы.
 * Не от грани шкафа — иначе топ заезжает на накладку №14 (симптом «топ смещён», лечится 2-м комодом через AutoTop).
 */
function _buildTopCapFromGroups(nicheGrp, standaloneGrp, dresserSide, wallName, transitionKey) {
  if (!state.scene) return;
  // Кухня НМ: без TransitionTopCap (крышка тумбы).
  if (isKitchenBaseGroup(nicheGrp) || isKitchenBaseGroup(standaloneGrp)) return;
  const sectionId = standaloneGrp?.userData?.sectionId || nicheGrp?.userData?.sectionId || null;
  try {
    const nicheBox = _furnitureBBox(nicheGrp);
    const standBox = _furnitureBBox(standaloneGrp);
    const corpusBox = computeFurnitureCorpusLayoutWorldBBoxNoAo(standaloneGrp);
    const spanBox = !corpusBox.isEmpty() ? corpusBox : standBox;
    if (nicheBox.isEmpty() || spanBox.isEmpty()) return;

    const topY = _standaloneLidTopYMm(standaloneGrp);
    if (!(topY > 0)) return;

    const norm = String(wallName || '').trim().toLowerCase();
    const useZ = norm === 'left' || norm === 'right';
    const _sec = Array.isArray(state.customSections)
      ? state.customSections.find((s) => s?.id === sectionId)
      : null;
    const secDepthW = _sectionTrimDepthMm(_sec);
    const sign = dresserSide === 'right' ? +1 : -1;

    // Граница шкафа (как SideCap), затем торец топа = грань SideCap со стороны тумбы.
    let wardrobeFaceU = useZ
      ? dresserSide === 'right'
        ? nicheBox.max.z
        : nicheBox.min.z
      : dresserSide === 'right'
        ? nicheBox.max.x
        : nicheBox.min.x;
    if (nicheGrp?.userData?.isEndCabinet && _sec) {
      try {
        const bounds = computeSectionInnerBoundsU(_sec);
        const fromSec =
          dresserSide === 'right' ? bounds.outerMinU : bounds.outerMaxU;
        if (Number.isFinite(fromSec)) wardrobeFaceU = fromSec;
      } catch (_) {}
    }

    let boundaryU = wardrobeFaceU + sign * SIDE_CAP_W_MM;
    const capSeg = _findLayoutCapSegmentForPair(_sec, nicheGrp, standaloneGrp);
    if (capSeg) {
      // Со стороны тумбы: right → endU, left → startU (не путать с границей SideCap у шкафа).
      const dresserFaceOfCap = dresserSide === 'right' ? capSeg.endU : capSeg.startU;
      if (Number.isFinite(dresserFaceOfCap)) {
        boundaryU = dresserFaceOfCap;
      }
    }

    // Ряд у окна: топ комода до внешней грани накладки tall.
    {
      const nicheSec = Array.isArray(state.customSections)
        ? state.customSections.find(
            (s) => s && String(s.id) === String(nicheGrp?.userData?.sectionId ?? '')
          )
        : null;
      if (nicheSec && _isWindowBridgeTallSection(nicheSec)) {
        try {
          const tallBounds = computeSectionInnerBoundsU(nicheSec);
          if (dresserSide === 'right' && Number.isFinite(tallBounds.outerMaxU)) {
            boundaryU = tallBounds.outerMaxU;
          } else if (dresserSide === 'left' && Number.isFinite(tallBounds.outerMinU)) {
            boundaryU = tallBounds.outerMinU;
          }
        } catch (_) {}
      }
    }

    // U тумбы: зона layout, иначе корпус.
    let dresserLo = useZ ? spanBox.min.z : spanBox.min.x;
    let dresserHi = useZ ? spanBox.max.z : spanBox.max.x;
    const zi = Number(standaloneGrp?.userData?.zoneIndex);
    const segs = _sec?._layoutCache?.segments || [];
    const modSeg = segs.find(
      (s) =>
        s &&
        s.type === 'module' &&
        (s.furnitureUuid === standaloneGrp.uuid ||
          (Number.isFinite(zi) && s.zoneIndex === zi))
    );
    if (modSeg && Number.isFinite(modSeg.startU) && Number.isFinite(modSeg.endU)) {
      dresserLo = Math.min(modSeg.startU, modSeg.endU);
      dresserHi = Math.max(modSeg.startU, modSeg.endU);
    }

    let uLo;
    let uHi;
    if (dresserSide === 'right') {
      uLo = boundaryU;
      uHi = dresserHi;
    } else {
      uLo = dresserLo;
      uHi = boundaryU;
    }
    if (uHi < uLo) {
      const t = uLo;
      uLo = uHi;
      uHi = t;
    }

    // Продлевать только дальний торец у стены (§4.1), не стык у SideCap.
    if (_sec) {
      const ext = _extendUSpanForChunkPlanks(_sec, uLo, uHi, [{ uLo, uHi }], wallName);
      if (dresserSide === 'right') {
        // стык слева (boundary) — не трогаем; справа можно к накладке стены
        uHi = ext.uHi;
      } else {
        uLo = ext.uLo;
      }
    }

    // Сторона к низкой тумбе: до внешней грани HeightMismatch вплотную (без выступа).
    {
      const hm = _extendTopUSpanToHeightMismatchFlush(
        wallName,
        [standaloneGrp.uuid],
        uLo,
        uHi
      );
      if (dresserSide === 'right') {
        uHi = hm.uHi;
      } else {
        uLo = hm.uLo;
      }
    }

    let geomW;
    let geomD;
    let cx;
    let cz;
    if (!useZ) {
      geomW = uHi - uLo;
      geomD =
        secDepthW > 10 ? secDepthW : standBox.max.z - standBox.min.z;
      cx = (uLo + uHi) / 2;
      if (_sec?.group?.position && secDepthW > 10) {
        const p = _sec.group.position;
        cz =
          norm === 'front' ? p.z - secDepthW / 2 : p.z + secDepthW / 2;
      } else {
        cz = (standBox.min.z + standBox.max.z) / 2;
      }
    } else {
      geomW =
        secDepthW > 10 ? secDepthW : standBox.max.x - standBox.min.x;
      geomD = uHi - uLo;
      cz = (uLo + uHi) / 2;
      if (_sec?.group?.position && secDepthW > 10) {
        const p = _sec.group.position;
        cx =
          norm === 'left' ? p.x + secDepthW / 2 : p.x - secDepthW / 2;
      } else {
        cx = (standBox.min.x + standBox.max.x) / 2;
      }
    }

    if (geomW < 5 || geomD < 5) return;

    const centerY = topY + PLANK_THICKNESS_MM / 2;
    const geom = new THREE.BoxGeometry(geomW, PLANK_THICKNESS_MM, geomD);
    const mesh = new THREE.Mesh(geom, _makeMat());
    mesh.name = 'TransitionTopCap';
    _tagMesh(mesh, wallName, transitionKey, sectionId);
    mesh.userData.isTransitionTopCap = true;
    _tagAsFacadeTrim(mesh, 'top', wallName);
    mesh.userData.trimPartKey = 'transition_top_cap';
    mesh.userData.transitionStandaloneUuid = standaloneGrp.uuid;
    mesh.userData.mergedTopFurnitureUuids = [standaloneGrp.uuid];
    mesh.position.set(cx, centerY, cz);
    state.scene.add(mesh);

    console.log('[TRANSITION] ✅ TopCap (шкаф↔тумба → накладка)', {
      wall: wallName,
      dresserSide,
      alongWallMm: Math.round(!useZ ? geomW : geomD),
      depthMm: Math.round(!useZ ? geomD : geomW),
      x: Math.round(cx),
      y: Math.round(centerY),
      z: Math.round(cz),
      boundaryU: Math.round(boundaryU),
      wardrobeFaceU: Math.round(wardrobeFaceU),
    });
  } catch (e) {
    console.warn('[TRANSITION] _buildTopCapFromGroups error', e);
  }
}

/**
 * Cover the portion of the section's default TopPlank that lies above the dresser,
 * so the top-line looks like it "ends" at the wardrobe boundary.
 */
function _coverTopPlankAboveDresser(standaloneGrp, dresserBox, wallName, transitionKey) {
  try {
    if (!Array.isArray(state.customSections)) return;
    const sectionId = standaloneGrp?.userData?.sectionId;
    if (!sectionId) return;
    const sec = state.customSections.find((s) => s && s.id === sectionId);
    if (!sec?.group) return;

    const isZAxis = wallName === 'left' || wallName === 'right';
    const dresserCenter = dresserBox.getCenter(new THREE.Vector3());

    sec.group.traverse((obj) => {
      if (!obj?.isMesh || !obj.userData?.isTopPlank) return;
      try {
        const tpBox = new THREE.Box3().setFromObject(obj);
        if (tpBox.isEmpty()) return;
        const tpCenter = tpBox.getCenter(new THREE.Vector3());
        const tpSize   = tpBox.getSize(new THREE.Vector3());

        // Cover width = dresser width on horizontal axis; depth = TopPlank thickness
        const coverW = isZAxis ? tpSize.x : (dresserBox.max.x - dresserBox.min.x);
        const coverD = isZAxis ? (dresserBox.max.z - dresserBox.min.z) : tpSize.z;
        const coverH = tpSize.y + 2; // +2 to fully hide the plank edge

        const cover = new THREE.Mesh(
          new THREE.BoxGeometry(coverW, coverH, coverD),
          _makeMat()
        );
        cover.name = 'TransitionTopPlankCover';
        _tagMesh(cover, wallName, transitionKey, sectionId);
        _tagAsFacadeTrim(cover, 'top', wallName);
        cover.renderOrder = 1;
        cover.position.set(
          isZAxis ? tpCenter.x : dresserCenter.x,
          tpCenter.y,
          isZAxis ? dresserCenter.z : tpCenter.z
        );
        state.scene.add(cover);
      } catch (_) {}
    });
  } catch (e) {
    console.warn('[TRANSITION] _coverTopPlankAboveDresser error', e);
  }
}

// ─── Vertical trim height (планки 5/6 и накладки 9/10 по зоне мебели) ────────

const _VERTICAL_TRIM_MESH_RE = /^(SideOverlay|SidePlank)(Left|Right|Front|Back)$/;
const _TRIM_U_OVERLAP_EPS_MM = 28;
const _TRIM_OUTER_EDGE_EPS_MM = 55;

/**
 * Секция проходит §6.3 / §6.6 (высоты вертикалей, split топ/цоколь).
 * §6.8 A1: L с `lShape` больше НЕ blanket-skip — свободное плечо = как прямая.
 * Спец угла отсекается по мебели (`_isLCornerSpecialFurniture` / ordinaryStraight),
 * не отключением всей секции.
 * Legacy `segmentsLShape*` без path-A lShape — по-прежнему skip.
 */
function _isStraightSectionForTrimHeight(sec) {
  if (!sec?.group) return false;
  const div = sec.division;
  if (sec.lShape) {
    // Path A: плечо + стык A2; спец угла не через этот флаг.
    return true;
  }
  if (Array.isArray(div?.segmentsLShape) || Array.isArray(div?.segmentsLShapeBack)) {
    return false;
  }
  return true;
}

function _worldUSpanFromBox(box, useZ) {
  if (useZ) return { min: box.min.z, max: box.max.z };
  return { min: box.min.x, max: box.max.x };
}

function _uSpansOverlap(aMin, aMax, bMin, bMax, eps = _TRIM_U_OVERLAP_EPS_MM) {
  return !(aMax <= bMin + eps || bMax <= aMin + eps);
}

function _furnitureIsTallForTrim(grp, box) {
  const pk = String(grp.userData?.__placementKind || '').trim();
  // Верхний навес: потолочная №1 как у шкафа (даже при H < 1500).
  if (isWallHungHighPlacementKind(pk)) return true;
  // Комод/тумба / нижний навес — никогда потолочный №1.
  if (isLowFurniturePlacementKind(pk)) return false;
  // Ниша и прочее: только по фактической высоте. Низкий шкаф в нише (<1500)
  // не тянет TopPlank через накладку на соседний модуль.
  const h = box.max.y - box.min.y;
  return Number.isFinite(h) && h >= AUTO_TOP_HEIGHT_LIMIT_MM;
}

/**
 * SidePlank/накладка = только корпус (низ ≠ пол): оба навеса.
 * Нижний: корпус в воздухе. Стык с более низким соседом — HeightMismatch от пола (отдельно).
 */
function _furnitureNeedsCorpusOnlySidePlanks(grp) {
  const pk = grp?.userData?.__placementKind;
  return isWallHungLowPlacementKind(pk) || isWallHungHighPlacementKind(pk);
}

/** Обрезать U высокой мебели по стыку с низкой (накладка / heightMismatch).
 *  Низкий навес в той же ячейке (cohabit) не режет потолочную №1 верхнего.
 */
function _clampTallTopAtLowNeighbors(tallEntries, lowEntries) {
  if (!tallEntries?.length) return [];
  const lows = lowEntries || [];
  const out = tallEntries.map((e) => ({
    uLo: e.uLo,
    uHi: e.uHi,
    widthU: e.widthU,
    zoneIndex: e.zoneIndex,
    grp: e.grp,
  }));
  for (const t of out) {
    for (const l of lows) {
      if (
        t.grp &&
        l.grp &&
        _isSameZoneCohabitPair(t.grp, l.grp)
      ) {
        continue;
      }
      if (
        Number.isFinite(t.zoneIndex) &&
        Number.isFinite(l.zoneIndex) &&
        t.zoneIndex === l.zoneIndex
      ) {
        continue;
      }
      // Низкая справа вплотную / через SideCap 16 — топ не заходит на неё.
      if (l.uLo >= t.uLo - 5 && l.uLo <= t.uHi + 40) {
        t.uHi = Math.min(t.uHi, l.uLo);
      }
      // Низкая слева.
      if (l.uHi <= t.uHi + 5 && l.uHi >= t.uLo - 40) {
        t.uLo = Math.max(t.uLo, l.uHi);
      }
    }
    t.widthU = t.uHi - t.uLo;
  }
  return out.filter((t) => t.widthU > 10);
}

/** В секции только комоды/тумбы (нет шкафа в нише) — цоколь только под стоящими. */
function _sectionHasOnlyStandaloneFurniture(sec) {
  if (!sec?.id || !state.scene) return false;
  const sid = String(sec.id);
  const wallName = sec.wallName || 'back';
  let any = false;
  const sorted = _getFurnitureOnWallSorted(wallName);
  for (const g of sorted) {
    if (String(g.userData?.sectionId ?? '') !== sid) continue;
    if (g.userData?.isGhost || g.userData?.isGhostClodisPrebuild) continue;
    any = true;
    const pk = String(g.userData?.__placementKind || '');
    if (!isLowFurniturePlacementKind(pk)) return false;
  }
  return any;
}

/** Мировые U-диапазоны стоящей мебели секции (для цоколя только под модулями). */
function _getOccupiedFurnitureUEntries(sec) {
  if (!sec?.id) return [];
  const sid = String(sec.id);
  const wallName = sec.wallName || 'back';
  const useZ = _wallUsesZAxis(wallName);
  const out = [];
  for (const g of _getFurnitureOnWallSorted(wallName)) {
    if (String(g.userData?.sectionId ?? '') !== sid) continue;
    if (g.userData?.isGhost || g.userData?.isGhostClodisPrebuild) continue;
    const b = _furnitureBBox(g);
    if (b.isEmpty()) continue;
    const uLo = useZ ? b.min.z : b.min.x;
    const uHi = useZ ? b.max.z : b.max.x;
    if (!(uHi - uLo > 10)) continue;
    out.push({ uLo, uHi, widthU: uHi - uLo });
  }
  return out.sort((a, b) => a.uLo - b.uLo);
}

/** Мебель секции и на той же стене в пределах span секции по U. */
/** Высокая секция у окна (L/R) — комод в средней не подрезает её накладки. */
function _isWindowBridgeTallSection(sec) {
  const role = String(
    sec?.windowAlongWallRole || sec?.windowBridgeRole || ''
  );
  return role === 'tall-left' || role === 'tall-right';
}

function _furnitureBelongsToUnderWindowBay(grp) {
  const sid = grp?.userData?.sectionId;
  if (sid == null || !Array.isArray(state.customSections)) return false;
  const sec = state.customSections.find((s) => s && String(s.id) === String(sid));
  if (!sec) return false;
  if (sec.underWindowBay || sec.windowBridgeRole === 'under-window') return true;
  if (sec.windowAlongWallRole === 'under-window') return true;
  return Number(sec.fixedHeightMm) > 0 && Number(sec.sillMm) > 0;
}

function _collectFurnitureForVerticalTrim(sec, trimU, wallName) {
  const out = [];
  const seen = new Set();
  if (!state.scene || !sec?.id) return out;
  const sid = String(sec.id);
  const norm = String(sec.wallName || wallName || '').trim().toLowerCase();
  const useZ = _wallUsesZAxis(norm);
  const tallBridge = _isWindowBridgeTallSection(sec);

  sec.group.updateMatrixWorld(true);
  const secBox = new THREE.Box3().setFromObject(sec.group);
  const secU = _worldUSpanFromBox(secBox, useZ);

  const add = (grp, box) => {
    if (seen.has(grp.uuid)) return;
    seen.add(grp.uuid);
    out.push({ grp, box });
  };

  state.scene.traverse((obj) => {
    if (!_isTransitionWallFurnitureRoot(obj)) return;
    const fw = String(obj.userData?.wallName || norm).trim().toLowerCase();
    if (fw !== norm) return;
    const box = _furnitureBBox(obj);
    if (box.isEmpty()) return;
    const fU = _worldUSpanFromBox(box, useZ);

    if (String(obj.userData?.sectionId) === sid) {
      add(obj, box);
      return;
    }
    // Tall у окна: комод в bay не подрезает накладки/планки высоких секций.
    if (tallBridge && _furnitureBelongsToUnderWindowBay(obj)) return;
    if (
      _uSpansOverlap(trimU.min, trimU.max, fU.min, fU.max) ||
      _uSpansOverlap(secU.min, secU.max, fU.min, fU.max)
    ) {
      add(obj, box);
    }
  });
  return out;
}

function _pickEdgeFurniture(furniture, useZ, edge) {
  let best = null;
  let bestU = edge === 'min' ? Infinity : -Infinity;
  for (const item of furniture) {
    const fU = _worldUSpanFromBox(item.box, useZ);
    const key = edge === 'min' ? fU.min : fU.max;
    if (edge === 'min' ? key < bestU : key > bestU) {
      bestU = key;
      best = item;
    }
  }
  return best;
}

/** На торце: сначала крайняя низкая мебель (тумба), иначе шкаф в потолок — как без отступа. */
function _pickEdgeFurniturePreferLow(furniture, useZ, edge) {
  const lowOnly = furniture.filter(({ grp, box }) => !_furnitureIsTallForTrim(grp, box));
  if (lowOnly.length) return _pickEdgeFurniture(lowOnly, useZ, edge);
  return _pickEdgeFurniture(furniture, useZ, edge);
}

/** Мебель у торца секции по U (отсекает шкаф в центре при отступе слева/справа). */
function _filterFurnitureNearSectionUEdge(furniture, secU, useZ, edge) {
  const band = _TRIM_OUTER_EDGE_EPS_MM + 220;
  return furniture.filter(({ box }) => {
    const fU = _worldUSpanFromBox(box, useZ);
    if (edge === 'min') return fU.min <= secU.min + band;
    return fU.max >= secU.max - band;
  });
}

function _isTrimAtSectionOuterEdge(trimU, secU) {
  const trimW = trimU.max - trimU.min;
  const trimCenterU = (trimU.min + trimU.max) / 2;
  const atMin =
    Math.abs(trimCenterU - secU.min) <= _TRIM_OUTER_EDGE_EPS_MM + trimW;
  const atMax =
    Math.abs(trimCenterU - secU.max) <= _TRIM_OUTER_EDGE_EPS_MM + trimW;
  return { atMin, atMax };
}

/** Торец секции по имени mesh (накладка/планка) — не по bbox группы с мебелью. */
function _verticalTrimLogicalEdge(meshName, wallName) {
  const n = String(meshName || '');
  const norm = String(wallName || '').trim().toLowerCase();
  if (norm === 'front' || norm === 'back') {
    if (n === 'SideOverlayLeft' || n === 'SidePlankLeft') return 'min';
    if (n === 'SideOverlayRight' || n === 'SidePlankRight') return 'max';
    return null;
  }
  if (norm === 'left' || norm === 'right') {
    if (n === 'SideOverlayFront' || n === 'SidePlankFront') return 'min';
    if (n === 'SideOverlayBack' || n === 'SidePlankBack') return 'max';
    return null;
  }
  return null;
}

function _furnitureGroupByUuid(uuid) {
  if (!state.scene || !uuid) return null;
  let found = null;
  state.scene.traverse((o) => {
    if (found || !o?.userData?.isFurniture) return;
    if (o.uuid === uuid) found = o;
  });
  return found;
}

function _furnitureTopLocalForTrim(sec, wallName, mesh, grp, box, secFloorY) {
  let topLocal = _verticalTrimTopLocalFromFurniture(sec, wallName, mesh, grp, box, secFloorY);
  const customH = Number(grp?.userData?.customHeightMm);
  // customHeightMm ниши/шкафа не тянет вертикаль у низкой тумбы в потолок (§6.1).
  // Resize тумбы: customH < 1500 и корпус сам низкий.
  // wall_hung_low/high: customH = высота корпуса, не «верх от пола» — не подменять topLocal.
  if (
    customH > 0 &&
    customH < AUTO_TOP_HEIGHT_LIMIT_MM &&
    !_furnitureIsTallForTrim(grp, box) &&
    !_furnitureNeedsCorpusOnlySidePlanks(grp)
  ) {
    topLocal = Math.max(topLocal, customH);
  }
  return topLocal;
}

/**
 * Низ вертикали от пола секции.
 * Комод напольный → 0. Навес (низ/верх) → низ корпуса (планка = высота корпуса).
 */
function _furnitureBottomLocalForTrim(grp, box, secFloorY) {
  if (!_furnitureNeedsCorpusOnlySidePlanks(grp)) return 0;
  const corpus = grp ? computeFurnitureCorpusLayoutWorldBBoxNoAo(grp) : null;
  const useBox = corpus && !corpus.isEmpty() ? corpus : box;
  if (!useBox || useBox.isEmpty()) return 0;
  const bottomLocal = useBox.min.y - Number(secFloorY || 0);
  return bottomLocal > 5 ? bottomLocal : 0;
}

/**
 * Мебель у торца для низа §6.3 (bottomLocal).
 * Крайний модуль у торца — источник истины. Навес/комод в середине ряда
 * не поднимает низ планки у шкафа на краю.
 */
function _pickSectionEdgeLowFurniture(sec, wallName, mesh) {
  if (!sec?.group || !state.scene || !mesh) return null;
  const logicalEdge = _verticalTrimLogicalEdge(mesh.name, wallName);
  if (!logicalEdge) return null;
  const useZ = _wallUsesZAxis(wallName);
  const sid = String(sec.id);
  const inSec = [];
  state.scene.traverse((o) => {
    if (!_isTransitionWallFurnitureRoot(o)) return;
    if (String(o.userData?.sectionId ?? '') !== sid) return;
    o.updateMatrixWorld(true);
    const box = _furnitureBBox(o);
    if (box.isEmpty()) return;
    inSec.push({ grp: o, box, fU: _worldUSpanFromBox(box, useZ) });
  });
  if (!inSec.length) return null;
  sec.group.updateMatrixWorld(true);
  const secBox = new THREE.Box3().setFromObject(sec.group);
  const secU = _worldUSpanFromBox(secBox, useZ);
  const band = _TRIM_OUTER_EDGE_EPS_MM + 220;
  const nearEdge = inSec.filter(({ fU }) =>
    logicalEdge === 'min' ? fU.min <= secU.min + band : fU.max >= secU.max - band
  );
  const scope = nearEdge.length ? nearEdge : inSec;
  const edgePick = _pickEdgeFurniture(scope, useZ, logicalEdge);
  if (!edgePick) return null;
  // Шкаф у торца (не навес) → низ = 0, навес из середины не трогает.
  if (
    _furnitureIsTallForTrim(edgePick.grp, edgePick.box) &&
    !_furnitureNeedsCorpusOnlySidePlanks(edgePick.grp)
  ) {
    return null;
  }
  // Навес у торца — низ корпуса. Комод — тоже pick (bottomLocal даст 0).
  return edgePick;
}

/** Низ §6.3: у навеса — низ корпуса; у комода — 0. */
function _resolveVerticalTrimBottomLocal(sec, wallName, mesh) {
  if (!_isSectionEdgeVerticalTrimMesh(mesh) && !_isSideOverlayMesh(mesh)) return 0;
  if (!sec?.group) return 0;
  const pick = _pickSectionEdgeLowFurniture(sec, wallName, mesh);
  if (!pick) return 0;
  return _furnitureBottomLocalForTrim(pick.grp, pick.box, Number(sec.group.position.y || 0));
}

/** Высота вертикали по тумбе: не режем по sec.size.y, если модуль выше секции (resize одной тумбы). */
function _clampVerticalTrimTargetH(topLocal, fullH) {
  if (!(Number(topLocal) > 0)) return Math.max(10, Number(fullH) || 10);
  return Math.max(10, topLocal);
}

/** Секционные планка (50 мм) и накладка (16 мм) на торце — §6.3, одна логика высоты. */
function _isSectionEdgeVerticalTrimMesh(mesh) {
  const n = String(mesh?.name || '');
  if (mesh?.userData?.isTransitionHeightMismatch) return false;
  if (mesh?.userData?.isEndCabinetWallPlank) return true;
  return /^(SidePlank|SideOverlay)(Left|Right|Front|Back)$/.test(n);
}

/** Высота планки/накладки на торце = крайний модуль секции по U (layout + bbox). */
function _resolveSectionEdgeVerticalTrimHeight(sec, wallName, mesh, fullH) {
  if (!_isSectionEdgeVerticalTrimMesh(mesh) || !sec?.group) return null;
  const logicalEdge = _verticalTrimLogicalEdge(mesh.name, wallName);
  if (!logicalEdge) return null;

  const secFloorY = Number(sec.group.position.y || 0);
  const useZ = _wallUsesZAxis(wallName);
  const sid = String(sec.id);
  const inSec = [];
  state.scene?.traverse((o) => {
    if (!_isTransitionWallFurnitureRoot(o)) return;
    if (String(o.userData?.sectionId ?? '') !== sid) return;
    o.updateMatrixWorld(true);
    const box = _furnitureBBox(o);
    if (box.isEmpty()) return;
    inSec.push({ grp: o, box, fU: _worldUSpanFromBox(box, useZ) });
  });
  if (!inSec.length) return null;

  inSec.sort((a, b) => a.fU.min - b.fU.min);

  sec.group.updateMatrixWorld(true);
  const secBox = new THREE.Box3().setFromObject(sec.group);
  const secU = _worldUSpanFromBox(secBox, useZ);
  const band = _TRIM_OUTER_EDGE_EPS_MM + 220;
  const nearEdge = inSec.filter(({ fU }) =>
    logicalEdge === 'min' ? fU.min <= secU.min + band : fU.max >= secU.max - band
  );
  // Крайний модуль у торца — не «любой навес в полосе 220». Иначе шкаф|навес|шкаф
  // даёт планку шкафа по высоте/низу навеса.
  const scope = nearEdge.length ? nearEdge : inSec;
  const pick = _pickEdgeFurniture(scope, useZ, logicalEdge);
  if (!pick) return fullH;

  let pickGrp = pick.grp;
  let pickBox = pick.box;
  // Колонна у торца: высота торца = низкий («снизу как есть»).
  if (isWallHungHighPlacementKind(pickGrp.userData?.__placementKind)) {
    const low = _sameZoneCohabitLowPartner(pickGrp);
    if (low) {
      pickGrp = low;
      try {
        low.updateMatrixWorld(true);
      } catch (_) {}
      pickBox = _furnitureBBox(low);
    }
  }

  if (
    _furnitureIsTallForTrim(pickGrp, pickBox) &&
    !_furnitureNeedsCorpusOnlySidePlanks(pickGrp)
  ) {
    return fullH;
  }
  const topLocal = _furnitureTopLocalForTrim(sec, wallName, mesh, pickGrp, pickBox, secFloorY);
  return _clampVerticalTrimTargetH(topLocal, fullH);
}

/** §6.3 торец: высота по модулю в крайней занятой зоне layout. */
function _resolveEdgeTrimHeightFromLayoutZone(sec, wallName, mesh, fullH) {
  const logicalEdge = _verticalTrimLogicalEdge(mesh?.name, wallName);
  if (!logicalEdge || !sec?.group) return null;
  _ensureSectionLayoutForTopMerge(sec);
  const modules = (sec._layoutCache?.segments || [])
    .filter((s) => s.type === 'module' && s.furnitureUuid)
    .sort((a, b) => a.startU - b.startU);
  if (!modules.length) return null;
  const picks = logicalEdge === 'min' ? [modules[0]] : [modules[modules.length - 1]];
  const secFloorY = Number(sec.group.position.y || 0);
  const useZ = _wallUsesZAxis(wallName);
  sec.group.updateMatrixWorld(true);
  const secBox = new THREE.Box3().setFromObject(sec.group);
  const secU = _worldUSpanFromBox(secBox, useZ);
  const band = _TRIM_OUTER_EDGE_EPS_MM + 220;
  let best = 0;
  for (const seg of picks) {
    let grp = _furnitureGroupByUuid(seg.furnitureUuid);
    if (!grp) continue;
    // Колонна: торец по низкому.
    if (isWallHungHighPlacementKind(grp.userData?.__placementKind)) {
      const low = _sameZoneCohabitLowPartner(grp);
      if (low) grp = low;
    }
    grp.updateMatrixWorld(true);
    const box = _furnitureBBox(grp);
    if (box.isEmpty()) continue;
    const fU = _worldUSpanFromBox(box, useZ);
    const near =
      logicalEdge === 'min' ? fU.min <= secU.min + band : fU.max >= secU.max - band;
    if (!near) continue;
    if (
      _furnitureIsTallForTrim(grp, box) &&
      !_furnitureNeedsCorpusOnlySidePlanks(grp)
    ) {
      return fullH;
    }
    const topLocal = _furnitureTopLocalForTrim(sec, wallName, mesh, grp, box, secFloorY);
    if (topLocal > best) best = topLocal;
  }
  return best > 0 ? _clampVerticalTrimTargetH(best, fullH) : null;
}

/** Макс. topLocal низкой мебели у торца секции по bbox (полоса планки часто не ∩ bbox тумбы). */
function _maxLowTrimTopNearSectionEdge(sec, wallName, mesh, furniture, secFloorY, edge, secU, useZ, fullH) {
  const band = _TRIM_OUTER_EDGE_EPS_MM + 220;
  let bestTop = 0;
  let found = false;
  for (const { grp, box } of furniture) {
    grp.updateMatrixWorld(true);
    const fresh = _furnitureBBox(grp);
    const useBox = fresh.isEmpty() ? box : fresh;
    if (useBox.isEmpty()) continue;
    if (_furnitureIsTallForTrim(grp, useBox)) continue;
    const fU = _worldUSpanFromBox(useBox, useZ);
    const nearEdge =
      edge === 'min'
        ? fU.min <= secU.min + band
        : fU.max >= secU.max - band;
    if (!nearEdge) continue;
    found = true;
    const topLocal = _furnitureTopLocalForTrim(sec, wallName, mesh, grp, useBox, secFloorY);
    if (topLocal > bestTop) bestTop = topLocal;
  }
  return found && bestTop > 0 ? bestTop : null;
}

/** Макс. высота низкой мебели в секции — для торцов без пересечения по U (§6.3 / §8). */
function _maxLowFurnitureTrimTopInSection(sec, wallName, mesh, furniture, secFloorY) {
  let maxTop = 0;
  for (const { grp, box } of furniture) {
    if (_furnitureIsTallForTrim(grp, box)) continue;
    grp.updateMatrixWorld(true);
    const fresh = _furnitureBBox(grp);
    const useBox = fresh.isEmpty() ? box : fresh;
    const topLocal = _furnitureTopLocalForTrim(sec, wallName, mesh, grp, useBox, secFloorY);
    if (topLocal > maxTop) maxTop = topLocal;
  }
  return maxTop;
}

/** Высота по крайней тумбе на данном торце (min/max U); иначе — max низкой мебели в секции. */
function _resolveEdgeLowTrimHeight(
  sec,
  wallName,
  mesh,
  furniture,
  secFloorY,
  fullH,
  edge,
  scope,
  useZ
) {
  const edgePick = edge ? _pickEdgeFurniturePreferLow(scope, useZ, edge) : null;
  if (edgePick) {
    const { grp, box } = edgePick;
    grp.updateMatrixWorld(true);
    const useBox = _furnitureBBox(grp);
    const b = useBox.isEmpty() ? box : useBox;
    if (!_furnitureIsTallForTrim(grp, b)) {
      const topLocal = _furnitureTopLocalForTrim(sec, wallName, mesh, grp, b, secFloorY);
      if (topLocal > 0) return _clampVerticalTrimTargetH(topLocal, fullH);
    }
  }

  const maxTop = _maxLowFurnitureTrimTopInSection(sec, wallName, mesh, furniture, secFloorY);
  if (maxTop > 0) return _clampVerticalTrimTargetH(maxTop, fullH);
  return fullH;
}

/** Низкие тумбы секции с координатами U из layout (или bbox). */
function _lowTumbaLayoutItemsForSection(sec, fpByUuid, useZ) {
  const items = [];
  const segs = sec._layoutCache?.segments || [];
  const modByZone = new Map();
  for (const s of segs) {
    if (s.type === 'module' && typeof s.zoneIndex === 'number') {
      modByZone.set(s.zoneIndex, s);
    }
  }
  for (const fp of fpByUuid.values()) {
    if (fp.sectionId !== sec.id) continue;
    const zi = fp.grp?.userData?.zoneIndex;
    const lay = typeof zi === 'number' ? modByZone.get(zi) : null;
    let startU;
    let endU;
    if (lay) {
      startU = Number(lay.startU);
      endU = Number(lay.endU);
    } else {
      startU = useZ ? fp.minZ : fp.minX;
      endU = useZ ? fp.maxZ : fp.maxX;
    }
    if (!Number.isFinite(startU) || !Number.isFinite(endU)) continue;
    items.push({
      fp,
      seg: { startU, endU, zoneIndex: zi },
      widthU: Math.max(10, endU - startU),
    });
  }
  items.sort((a, b) => a.seg.startU - b.seg.startU);
  return items;
}

function _mergeTumbaTopsOnSection(sec, fpByUuid, wallName, useZ, nextKey, skipWardrobeSingle = null) {
  const covered = new Set();
  const allSectionItems = _lowTumbaLayoutItemsForSection(sec, fpByUuid, useZ);
  const segs = sec._layoutCache?.segments;
  const chain = [];
  const flush = () => {
    if (!chain.length) return;
    const ids = _emitLayoutTopCapChunks(
      sec,
      chain,
      wallName,
      useZ,
      nextKey,
      allSectionItems,
      skipWardrobeSingle
    );
    for (const id of ids) covered.add(id);
    chain.length = 0;
  };

  // §6.4.1: обход layout — cap (шкаф↔тумба) завершает цепочку; подряд идущие module (тумбы) — одна цепочка.
  if (Array.isArray(segs) && segs.length) {
    for (const seg of segs) {
      if (seg.type === 'cap') {
        flush();
        continue;
      }
      if (seg.type !== 'module') continue;
      const fp = _fpForLayoutModuleSegment(sec, seg, fpByUuid);
      if (!fp) continue;
      const startU = Number(seg.startU);
      const endU = Number(seg.endU);
      if (!Number.isFinite(startU) || !Number.isFinite(endU)) continue;
      chain.push({
        fp,
        seg: { startU, endU, zoneIndex: seg.zoneIndex },
        widthU: Math.max(10, endU - startU),
      });
    }
    flush();
    return covered;
  }

  // Fallback без layout: только разрыв по зазору U между тумбами (не cap шкаф↔тумба).
  const items = _lowTumbaLayoutItemsForSection(sec, fpByUuid, useZ);
  if (!items.length) return covered;
  chain.length = 0;
  for (const item of items) {
    if (chain.length) {
      const prev = chain[chain.length - 1];
      const gapU = Number(item.seg.startU) - Number(prev.seg.endU);
      if (gapU > 25) flush();
    }
    chain.push(item);
  }
  flush();
  return covered;
}

/** Footprint тумбы для merge: layout uuid, zoneIndex, перебор fpByUuid. */
function _fpForLayoutModuleSegment(sec, seg, fpByUuid) {
  if (!seg || seg.type !== 'module') return null;
  if (seg.furnitureUuid) {
    const hit = fpByUuid.get(seg.furnitureUuid);
    if (hit) return hit;
  }
  const z = seg.zoneIndex;
  if (typeof z !== 'number') return null;
  // В ячейке base+upper: uuid часто у верхнего (без AutoTop) — берём низкий footprint.
  let lowHit = null;
  let anyHit = null;
  for (const fp of fpByUuid.values()) {
    if (fp.sectionId !== sec.id) continue;
    if (fp.grp?.userData?.zoneIndex !== z) continue;
    anyHit = fp;
    if (isLowFurniturePlacementKind(fp.grp?.userData?.__placementKind)) {
      lowHit = fp;
      break;
    }
  }
  if (lowHit) return lowHit;
  if (anyHit) return anyHit;
  if (!state.scene) return null;
  let lowGrp = null;
  let anyGrp = null;
  state.scene.traverse((obj) => {
    if (!_isTransitionWallFurnitureRoot(obj)) return;
    if (obj.userData.sectionId !== sec.id) return;
    if (obj.userData.zoneIndex !== z) return;
    if (!anyGrp) anyGrp = obj;
    if (
      !lowGrp &&
      isLowFurniturePlacementKind(obj.userData?.__placementKind)
    ) {
      lowGrp = obj;
    }
  });
  const grp = lowGrp || anyGrp;
  if (!grp) return null;
  return fpByUuid.get(grp.uuid) || null;
}

function _isVerticalSectionTrimMesh(obj) {
  if (!obj?.isMesh) return false;
  const n = obj.name || '';
  if (!_VERTICAL_TRIM_MESH_RE.test(n)) return false;
  if (obj.userData?.isSectionTransitionPart) return false;
  return true;
}

function _boxesOverlapXZ(a, b, eps = 1) {
  return !(
    a.max.x <= b.min.x + eps ||
    a.min.x >= b.max.x - eps ||
    a.max.z <= b.min.z + eps ||
    a.min.z >= b.max.z - eps
  );
}

function _isSideOverlayMesh(mesh) {
  const n = String(mesh?.name || '');
  return !!mesh?.userData?.isSideOverlay || /^SideOverlay(Left|Right|Front|Back)$/.test(n);
}

/** Пересечение боковой накладки с тумбой/топом по глубине (Z на back/front). */
function _sideOverlayDepthOverlaps(trimBox, otherBox, wallName, meshName, eps = 1) {
  const n = String(meshName || '');
  const useZ = _wallUsesZAxis(wallName);
  const backFrontEdge = n === 'SideOverlayLeft' || n === 'SideOverlayRight';
  const leftRightEdge = n === 'SideOverlayFront' || n === 'SideOverlayBack';
  if (!useZ && backFrontEdge) {
    return !(
      trimBox.max.z <= otherBox.min.z + eps ||
      trimBox.min.z >= otherBox.max.z - eps
    );
  }
  if (useZ && leftRightEdge) {
    return !(
      trimBox.max.x <= otherBox.min.x + eps ||
      trimBox.min.x >= otherBox.max.x - eps
    );
  }
  return _boxesOverlapXZ(trimBox, otherBox, eps);
}

/** Топ тумбы режет высоту накладки при совпадении по глубине (или XZ у стыка разной высоты). */
function _topCapOverlapsOverlayForHeight(trimBox, topBox, wallName, mesh, eps = 1) {
  if (mesh?.userData?.isTransitionHeightMismatch) {
    return _boxesOverlapXZ(trimBox, topBox, eps);
  }
  if (_isSideOverlayMesh(mesh)) {
    return _sideOverlayDepthOverlaps(trimBox, topBox, wallName, mesh?.name, eps);
  }
  return _boxesOverlapXZ(trimBox, topBox, eps);
}

function _topCapBelongsToSection(topMesh, sec) {
  if (!sec) return false;
  const sid = topMesh.userData?.sectionId;
  if (sid != null && String(sid) === String(sec.id)) return true;
  const uuids = topMesh.userData?.mergedTopFurnitureUuids;
  if (!Array.isArray(uuids) || !uuids.length || !state.scene) return false;
  let hit = false;
  state.scene.traverse((o) => {
    if (hit || !o?.userData?.isFurniture) return;
    if (String(o.userData.sectionId) !== String(sec.id)) return;
    if (uuids.includes(o.uuid)) hit = true;
  });
  return hit;
}

function _isLowTumbaTopCapMesh(obj, secFloorY) {
  const ud = obj?.userData || {};
  // Крышка bay под окном — не TransitionAutoTopCap тумбы (иначе подрезки/merge по ней).
  if (ud.isUnderWindowBayTop) return false;
  // Нижняя фасадная крышка верхнего навеса — не стоп для вертикали.
  if (ud.autoBottomHangHigh || ud.isTransitionAutoBottomCap) return false;
  if (!ud.isTransitionAutoTopCap && !ud.isTransitionTopCap) return false;
  if (!obj?.isMesh) return false;
  obj.updateMatrixWorld(true);
  const topBox = new THREE.Box3().setFromObject(obj);
  if (topBox.isEmpty()) return false;
  const topHLocal = topBox.max.y - secFloorY;
  return topHLocal > 0 && topHLocal < AUTO_TOP_HEIGHT_LIMIT_MM;
}

/** Толщина горизонтального топа (мм) — из геометрии, иначе PLANK_THICKNESS_MM. */
function _topCapThicknessMm(topMesh) {
  if (!topMesh) return PLANK_THICKNESS_MM;
  topMesh.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(topMesh);
  const h = box.max.y - box.min.y;
  if (Number.isFinite(h) && h > 0.4 && h < 120) return h;
  return PLANK_THICKNESS_MM;
}

/** Нижняя грань топа в local Y секции: верх плиты − толщина материала. */
function _topCapBottomWorldY(topMesh) {
  topMesh.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(topMesh);
  return box.max.y - _topCapThicknessMm(topMesh);
}

/** Толщина топа в секции (для fallback по bbox мебели). */
function _sectionTopCapThicknessMm(sec, wallName) {
  if (!state.scene || !sec) return PLANK_THICKNESS_MM;
  const norm = String(wallName || sec.wallName || 'back').trim().toLowerCase();
  const secFloorY = Number(sec.group?.position?.y || 0);
  let found = null;
  state.scene.traverse((obj) => {
    if (found != null || !_isLowTumbaTopCapMesh(obj, secFloorY)) return;
    if (String(obj.userData?.wallName || '').toLowerCase() !== norm) return;
    if (!_topCapBelongsToSection(obj, sec)) return;
    found = _topCapThicknessMm(obj);
  });
  return found ?? PLANK_THICKNESS_MM;
}

/** Высота вертикали (мм) от пола секции до нижней грани топа (не от текущего низа mesh). */
function _findTopCapStopHeightMmForTrim(mesh, sec, wallName) {
  if (!state.scene || !sec?.group || !mesh?.isMesh) return null;
  mesh.updateMatrixWorld(true);
  const trimBox = new THREE.Box3().setFromObject(mesh);
  if (trimBox.isEmpty()) return null;
  const secFloorY = Number(sec.group.position.y || 0);
  const norm = String(wallName || sec.wallName || 'back').trim().toLowerCase();
  let minTopLocal = null;

  state.scene.traverse((obj) => {
    if (!_isLowTumbaTopCapMesh(obj, secFloorY)) return;
    if (String(obj.userData?.wallName || '').toLowerCase() !== norm) return;
    if (!_topCapBelongsToSection(obj, sec)) return;
    const topBox = new THREE.Box3().setFromObject(obj);
    if (!_topCapOverlapsOverlayForHeight(trimBox, topBox, norm, mesh)) return;
    const topLocal = _topCapBottomWorldY(obj) - secFloorY;
    if (!Number.isFinite(topLocal) || topLocal <= 0) return;
    if (minTopLocal == null || topLocal < minTopLocal) minTopLocal = topLocal;
  });

  return minTopLocal;
}

/** Верх корпуса от пола секции минус толщина крышки → низ топа (мм). */
function _corpusTopHeightMinusTopCapMm(mesh, sec, wallName, furnitureBox) {
  if (!mesh?.isMesh || !furnitureBox || furnitureBox.isEmpty()) return null;
  const secFloorY = Number(sec?.group?.position?.y || 0);
  const corpusTop = Math.max(0, furnitureBox.max.y - secFloorY);
  const thickness = _sectionTopCapThicknessMm(sec, wallName);
  return Math.max(10, corpusTop - thickness);
}

function _isVerticalTrimClipCandidate(mesh) {
  if (!mesh?.isMesh) return false;
  if (mesh.userData?.isTransitionSideCap) return false;
  if (mesh.userData?.isTransitionHeightMismatch) return true;
  // §6.3: секционные SideOverlay/SidePlank у тумбы — clip к низу TopCap.
  if (_isSectionEdgeVerticalTrimMesh(mesh)) return true;
  return _isSideOverlayMesh(mesh);
}

/**
 * Геометрически: вертикаль не выше нижней грани топа при пересечении footprint XZ.
 */
function _clipVerticalTrimAtTumbaTops(mesh, sec, wallName, fullH) {
  if (!_isVerticalTrimClipCandidate(mesh)) return false;
  // Стыковая накладка: высота задаётся по крышкам в _finalizeHeightMismatchOverlaysOnWall.
  if (mesh.userData?.isTransitionHeightMismatch) return false;
  if (
    mesh.userData?.isSideOverlay &&
    !mesh.userData?.isTransitionHeightMismatch &&
    !sec?.group
  ) {
    return false;
  }
  const fullSecH = Number(fullH || sec?.size?.y || 0);
  const dims = _getVerticalTrimMeshDims(mesh);
  if (!dims || !(dims.h > 0)) return false;

  mesh.updateMatrixWorld(true);
  const trimBox = new THREE.Box3().setFromObject(mesh);
  if (trimBox.isEmpty()) return false;

  // До потолка секции (шкаф) — не резать по низким топам.
  if (fullSecH > 0 && dims.h >= fullSecH - 5) return false;

  const secFloorY = sec?.group ? Number(sec.group.position.y || 0) : trimBox.min.y;
  const norm = String(wallName || sec?.wallName || 'back').trim().toLowerCase();
  let capTopY = trimBox.max.y;

  state.scene.traverse((obj) => {
    if (obj === mesh || !_isLowTumbaTopCapMesh(obj, secFloorY)) return;
    if (String(obj.userData?.wallName || '').toLowerCase() !== norm) return;
    if (!_topCapBelongsToSection(obj, sec)) return;

    const topBox = new THREE.Box3().setFromObject(obj);
    if (!_topCapOverlapsOverlayForHeight(trimBox, topBox, norm, mesh)) return;
    const topBottomY = _topCapBottomWorldY(obj);
    if (trimBox.max.y > topBottomY + 0.05 && topBottomY < capTopY) {
      capTopY = topBottomY;
    }
  });

  if (capTopY >= trimBox.max.y - 0.05) return false;

  const bottomWorldY = trimBox.min.y;
  const newH = Math.max(10, capTopY - bottomWorldY);
  if (newH < 40) return false;
  if (Math.abs(newH - dims.h) < 0.5) return false;

  let w = dims.w;
  let d = dims.d;
  if (mesh.userData?.isSideOverlay && sec) {
    const fixed = _sideOverlayBoxDimsForSection(sec, wallName, mesh.name, dims);
    w = fixed.w;
    d = fixed.d;
  }

  mesh.geometry.dispose();
  mesh.geometry = new THREE.BoxGeometry(w, newH, d);

  if (mesh.userData?.isSideOverlay && sec) {
    const secFloorY = Number(sec.group?.position?.y || 0);
    const bottomLocal = Math.max(0, bottomWorldY - secFloorY);
    const pose = _sideOverlayLocalPose(sec, wallName, mesh.name, newH, bottomLocal);
    if (pose) {
      if (pose.x != null) mesh.position.x = pose.x;
      if (pose.z != null) mesh.position.z = pose.z;
      mesh.position.y = pose.y;
    } else {
      mesh.position.y = bottomLocal + newH / 2;
    }
  } else {
    const centerWorld = new THREE.Vector3(
      (trimBox.min.x + trimBox.max.x) / 2,
      bottomWorldY + newH / 2,
      (trimBox.min.z + trimBox.max.z) / 2
    );
    if (mesh.parent) {
      mesh.parent.updateMatrixWorld(true);
      mesh.position.copy(mesh.parent.worldToLocal(centerWorld));
    } else {
      mesh.position.copy(centerWorld);
    }
  }
  mesh.userData.cldTrimBaseSize = { w, h: newH, d };
  mesh.userData.cldTrimBasePosition = mesh.position.clone();
  if (fullSecH > 0 && newH < fullSecH - 5) {
    mesh.userData._trimmedVerticalForFurniture = true;
    mesh.userData._trimmedSideOverlayForLow = !!mesh.userData?.isSideOverlay;
    mesh.userData._trimmedByTransition = true;
  }
  _syncTrimNominalAfterHeightChange(mesh);
  return true;
}

function _clipAllVerticalTrimsAtTumbaTopsForWall(wallName) {
  if (!state.scene || !Array.isArray(state.customSections)) return;
  const norm = String(wallName || '').trim().toLowerCase();
  let clipped = 0;

  for (const sec of state.customSections) {
    if ((sec.wallName || '').toLowerCase() !== norm || !sec?.group) continue;
    const fullH = Number(sec.size?.y || 0);
    sec.group.traverse((obj) => {
      if (_clipVerticalTrimAtTumbaTops(obj, sec, norm, fullH)) clipped++;
    });
  }

  state.scene.traverse((obj) => {
    if (!obj?.userData?.isTransitionHeightMismatch) return;
    if (String(obj.userData?.wallName || '').toLowerCase() !== norm) return;
    const secId = obj.userData?.sectionId;
    const sec =
      secId && Array.isArray(state.customSections)
        ? state.customSections.find((s) => String(s?.id) === String(secId))
        : null;
    if (_clipVerticalTrimAtTumbaTops(obj, sec, norm, sec?.size?.y || 0)) clipped++;
  });

  if (clipped > 0 && typeof window !== 'undefined' && window.DEBUG_TRIM_VERTICAL_HEIGHT === true) {
    console.log('[TRIM-OVERLAY-TOP] clipped at tumba tops', { wall: norm, clipped });
  }
}

/**
 * Высота вертикали = по мебели «под» полосой по U (верх тумбы / потолок у шкафа).
 * Топы тумб (merge 2750): docs/SECTION_TRIM_BEHAVIOR_SPEC.md §6.4.1
 */
function _capVerticalTrimAtTopCaps(sec, wallName, mesh, targetHLocal) {
  const fullH = Number(sec.size?.y || 0);
  let h = Math.max(10, Number(targetHLocal) || 0);
  if (!sec?.group || !mesh?.isMesh || fullH <= 0) return h;
  if (fullH > 0 && h >= fullH - 5) return h;

  mesh.updateMatrixWorld(true);
  const trimBox = new THREE.Box3().setFromObject(mesh);
  if (trimBox.isEmpty()) return h;

  const topCapH = _findTopCapStopHeightMmForTrim(mesh, sec, wallName);
  if (topCapH != null) h = Math.min(h, topCapH);

  if (_isSideOverlayMesh(mesh)) {
    const useZ = _wallUsesZAxis(wallName);
    const trimU = _worldUSpanFromBox(trimBox, useZ);
    const furniture = _collectFurnitureForVerticalTrim(sec, trimU, wallName);
    let maxCorpusStop = 0;
    for (const { grp, box } of furniture) {
      if (!_sideOverlayDepthOverlaps(trimBox, box, wallName, mesh.name)) continue;
      if (_furnitureIsTallForTrim(grp, box)) continue;
      const corpus = computeFurnitureCorpusLayoutWorldBBoxNoAo(grp);
      const useBox = corpus && !corpus.isEmpty() ? corpus : box;
      const stop = _corpusTopHeightMinusTopCapMm(mesh, sec, wallName, useBox);
      if (stop != null && stop > maxCorpusStop) maxCorpusStop = stop;
    }
    if (maxCorpusStop > 0) h = Math.min(h, maxCorpusStop);
  }

  return Math.max(10, h);
}

function _resolveVerticalTrimTargetH(sec, trimU, wallName, mesh) {
  const h = _resolveVerticalTrimTargetHCore(sec, trimU, wallName, mesh);
  // Накладка/планка у тумбы: до нижней грани TransitionTopCap / AutoTopCap.
  if (_isSectionEdgeVerticalTrimMesh(mesh) || _isSideOverlayMesh(mesh)) {
    return _capVerticalTrimAtTopCaps(sec, wallName, mesh, h);
  }
  return h;
}

/**
 * Верх мебели для высоты вертикали (§6.3):
 * - секционная накладка/планка у тумбы → верх корпуса (без каталожной крышки);
 * - иначе bbox; для SideOverlay дополнительно можно упереть в низ TopCap снаружи.
 */
function _verticalTrimTopLocalFromFurniture(sec, wallName, mesh, grp, box, secFloorY) {
  if (_isSectionEdgeVerticalTrimMesh(mesh)) {
    const corpus = grp ? computeFurnitureCorpusLayoutWorldBBoxNoAo(grp) : null;
    const useBox = corpus && !corpus.isEmpty() ? corpus : box;
    if (!useBox || useBox.isEmpty()) return 0;
    return Math.max(0, useBox.max.y - secFloorY);
  }
  if (_isSideOverlayMesh(mesh) && mesh?.isMesh && box && !box.isEmpty()) {
    const fromCorpus = _corpusTopHeightMinusTopCapMm(mesh, sec, wallName, box);
    if (fromCorpus != null) return fromCorpus;
  }
  return Math.max(0, box.max.y - secFloorY);
}

function _resolveVerticalTrimTargetHCore(sec, trimU, wallName, mesh) {
  const fullH = Number(sec.size?.y || 0);
  if (!fullH) return fullH;
  const secFloorY = Number(sec.group?.position?.y || 0);
  const useZ = _wallUsesZAxis(wallName);

  if (_isSectionEdgeVerticalTrimMesh(mesh)) {
    const edgeH = _resolveSectionEdgeVerticalTrimHeight(sec, wallName, mesh, fullH);
    if (edgeH != null && edgeH > 0) return edgeH;
  }

  const furniture = _collectFurnitureForVerticalTrim(sec, trimU, wallName);
  if (!furniture.length) {
    // Пустая tall у окна: не fullH (иначе боковина до потолка в пустой ячейке).
    if (_isWindowBridgeTallSection(sec)) return 0;
    return fullH;
  }

  const logicalEdge = _verticalTrimLogicalEdge(mesh?.name, wallName);

  // Торец по имени mesh (§6.3): только мебель у этого торца — шкаф в центре не режет левую планку.
  if (logicalEdge) {
    sec.group.updateMatrixWorld(true);
    const secBox = new THREE.Box3().setFromObject(sec.group);
    const secU = _worldUSpanFromBox(secBox, useZ);
    let scope = _filterFurnitureNearSectionUEdge(furniture, secU, useZ, logicalEdge);
    if (!scope.length) {
      const lowAll = furniture.filter(({ grp, box }) => !_furnitureIsTallForTrim(grp, box));
      scope = lowAll.length ? lowAll : furniture;
    }

    let bestTop = 0;

    const layoutEdgeH = _resolveEdgeTrimHeightFromLayoutZone(sec, wallName, mesh, fullH);
    if (layoutEdgeH != null) bestTop = Math.max(bestTop, layoutEdgeH);

    const nearEdgeH = _maxLowTrimTopNearSectionEdge(
      sec,
      wallName,
      mesh,
      furniture,
      secFloorY,
      logicalEdge,
      secU,
      useZ,
      fullH
    );
    if (nearEdgeH != null) bestTop = Math.max(bestTop, nearEdgeH);

    const band = _TRIM_OUTER_EDGE_EPS_MM + 220;
    for (const { grp, box } of scope) {
      const fU = _worldUSpanFromBox(box, useZ);
      if (!_uSpansOverlap(trimU.min, trimU.max, fU.min, fU.max)) continue;
      grp.updateMatrixWorld(true);
      const b = _furnitureBBox(grp);
      const useBox = b.isEmpty() ? box : b;
      if (_furnitureIsTallForTrim(grp, useBox)) {
        // Навес у торца: планка/накладка = корпус, не fullH (иначе «накладка слева до потолка»).
        if (_furnitureNeedsCorpusOnlySidePlanks(grp)) {
          // Колонна: торец секции по низкому («снизу как есть»).
          // Открытый бок верхнего — отдельно HangHighOpenSideOverlay.
          if (
            isWallHungHighPlacementKind(grp.userData?.__placementKind) &&
            _sameZoneCohabitLowPartner(grp)
          ) {
            continue;
          }
          const topLocal = _furnitureTopLocalForTrim(
            sec,
            wallName,
            mesh,
            grp,
            useBox,
            secFloorY
          );
          if (topLocal > bestTop) bestTop = topLocal;
          continue;
        }
        const near =
          logicalEdge === 'min' ? fU.min <= secU.min + band : fU.max >= secU.max - band;
        if (near) return fullH;
        continue;
      }
      const topLocal = _furnitureTopLocalForTrim(sec, wallName, mesh, grp, useBox, secFloorY);
      if (topLocal > bestTop) bestTop = topLocal;
    }

    if (bestTop > 0) return _clampVerticalTrimTargetH(bestTop, fullH);

    return _resolveEdgeLowTrimHeight(
      sec,
      wallName,
      mesh,
      furniture,
      secFloorY,
      fullH,
      logicalEdge,
      scope,
      useZ
    );
  }

  sec.group.updateMatrixWorld(true);
  const secBox = new THREE.Box3().setFromObject(sec.group);
  const secU = _worldUSpanFromBox(secBox, useZ);
  const { atMin, atMax } = _isTrimAtSectionOuterEdge(trimU, secU);

  let scope = furniture;
  if (atMin && !atMax) {
    scope = _filterFurnitureNearSectionUEdge(furniture, secU, useZ, 'min');
    if (!scope.length) scope = furniture;
  } else if (atMax && !atMin) {
    scope = _filterFurnitureNearSectionUEdge(furniture, secU, useZ, 'max');
    if (!scope.length) scope = furniture;
  }

  let maxTopOverlap = 0;
  let hasOverlap = false;
  let hasTallOverlap = false;

  for (const { grp, box } of scope) {
    const fU = _worldUSpanFromBox(box, useZ);
    if (!_uSpansOverlap(trimU.min, trimU.max, fU.min, fU.max)) continue;
    hasOverlap = true;
    if (_furnitureIsTallForTrim(grp, box)) {
      // Навес = корпус, не fullH до потолка (иначе «накладка слева во всю нишу»).
      if (_furnitureNeedsCorpusOnlySidePlanks(grp)) {
        if (
          isWallHungHighPlacementKind(grp.userData?.__placementKind) &&
          _sameZoneCohabitLowPartner(grp)
        ) {
          continue;
        }
        const topLocal = _furnitureTopLocalForTrim(
          sec,
          wallName,
          mesh,
          grp,
          box,
          secFloorY
        );
        if (topLocal > maxTopOverlap) maxTopOverlap = topLocal;
        continue;
      }
      hasTallOverlap = true;
      break;
    }
    const topLocal = _verticalTrimTopLocalFromFurniture(sec, wallName, mesh, grp, box, secFloorY);
    if (topLocal > maxTopOverlap) maxTopOverlap = topLocal;
  }

  if (hasTallOverlap) return fullH;
  if (hasOverlap) return _clampVerticalTrimTargetH(maxTopOverlap, fullH);

  if (!atMin && !atMax) return fullH;

  return _resolveEdgeLowTrimHeight(
    sec,
    wallName,
    mesh,
    furniture,
    secFloorY,
    fullH,
    atMin ? 'min' : 'max',
    scope,
    useZ
  );
}

function _getVerticalTrimMeshDims(mesh) {
  const params = mesh.geometry?.parameters;
  if (params && Number.isFinite(params.height)) {
    return { w: params.width, h: params.height, d: params.depth };
  }
  mesh.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(mesh).getSize(new THREE.Vector3());
  if (size.y < 1) return null;
  return { w: size.x, h: size.y, d: size.z };
}

function _applyVerticalTrimMeshHeight(mesh, targetH, fullH, sec, wallName, bottomLocal = 0) {
  const dims = _getVerticalTrimMeshDims(mesh);
  if (!dims) return;
  const bottom = Math.max(0, Number(bottomLocal) || 0);
  // targetH уже = topFromFloor − bottom (и top уже capped по AutoTop от пола секции).
  let h = Math.max(10, Number(targetH) || 0);
  let w = dims.w;
  let d = dims.d;
  if (sec && mesh.userData?.isSideOverlay) {
    const fixed = _sideOverlayBoxDimsForSection(sec, wallName, mesh.name, dims);
    w = fixed.w;
    d = fixed.d;
  }
  if (mesh.userData?.isSideOverlay && sec) {
    const pose = _sideOverlayLocalPose(sec, wallName, mesh.name, h, bottom);
    if (pose) {
      if (pose.x != null && Math.abs(mesh.position.x - pose.x) >= 2) {
        mesh.position.x = pose.x;
      }
      if (pose.z != null && Math.abs(mesh.position.z - pose.z) >= 2) {
        mesh.position.z = pose.z;
      }
      mesh.position.y = pose.y;
      mesh.userData.cldTrimBasePosition = mesh.position.clone();
    }
  }
  const heightOk = Math.abs(dims.h - h) < 5;
  const bottomOk = Math.abs(mesh.position.y - (bottom + h / 2)) < 3;
  const depthOk =
    !mesh.userData?.isSideOverlay ||
    (Math.abs(dims.w - w) < 5 && Math.abs(dims.d - d) < 5);
  if (heightOk && depthOk && bottomOk) {
    if (!_clipVerticalTrimAtTumbaTops(mesh, sec, wallName, fullH)) {
      if (fullH > 0 && dims.h < fullH - 5) {
        mesh.userData._trimmedVerticalForFurniture = true;
        mesh.userData._trimmedSideOverlayForLow = !!mesh.userData?.isSideOverlay;
        mesh.userData._trimmedByTransition = true;
      } else {
        delete mesh.userData._trimmedVerticalForFurniture;
        delete mesh.userData._trimmedSideOverlayForLow;
        delete mesh.userData._trimmedByTransition;
      }
    }
    _syncTrimNominalAfterHeightChange(mesh);
    return;
  }
  mesh.geometry.dispose();
  mesh.geometry = new THREE.BoxGeometry(w, h, d);
  mesh.position.y = bottom + h / 2;
  if (mesh.userData?.isSideOverlay && sec) {
    const pose = _sideOverlayLocalPose(sec, wallName, mesh.name, h, bottom);
    if (pose) {
      if (pose.x != null) mesh.position.x = pose.x;
      if (pose.z != null) mesh.position.z = pose.z;
      mesh.position.y = pose.y;
    }
  }
  mesh.userData.cldTrimBaseSize = { w, h, d };
  mesh.userData.cldTrimBasePosition = mesh.position.clone();
  if (fullH > 0 && h < fullH - 5) {
    mesh.userData._trimmedVerticalForFurniture = true;
    mesh.userData._trimmedSideOverlayForLow = true;
    mesh.userData._trimmedByTransition = true;
  } else {
    delete mesh.userData._trimmedVerticalForFurniture;
    delete mesh.userData._trimmedSideOverlayForLow;
    delete mesh.userData._trimmedByTransition;
  }
  _clipVerticalTrimAtTumbaTops(mesh, sec, wallName, fullH);
  _syncTrimNominalAfterHeightChange(mesh);
}

function _syncTrimNominalAfterHeightChange(mesh) {
  // SidePlank тоже: иначе cldTrimBaseSize остаётся fullH и resetTrimMeshPlain
  // (кромки без enabled sides) поднимает планку обратно в потолок.
  if (
    !_isSideOverlayMesh(mesh) &&
    !mesh?.userData?.isTransitionHeightMismatch &&
    !mesh?.userData?.isSidePlank &&
    !_isSectionEdgeVerticalTrimMesh(mesh)
  ) {
    return;
  }
  try {
    syncTrimNominalSizeFromGeometry(mesh);
  } catch (_) {}
}

/** Повтор §6.3 после кромок шага 5 (prepareTrimMeshObkladVisual не должен откатывать высоту). */
function _reapplyVerticalTrimHeightsForAllWalls() {
  for (const wallName of ['back', 'front', 'left', 'right']) {
    _adjustSideOverlayForLowFurniture(wallName);
  }
}

/** Ширина накладки вдоль глубины секции (W), не по bbox тумбы. */
function _sideOverlaySpanAlongDepthMm(sec, wallName, meshName) {
  if (!sec?.size) return 0;
  const n = String(meshName || '');
  const useZ = _wallUsesZAxis(wallName);
  const spanDepth = _sectionTrimDepthMm(sec);
  if (!(spanDepth > 0)) return 0;
  if (!useZ && (n === 'SideOverlayLeft' || n === 'SideOverlayRight')) return spanDepth;
  if (useZ && (n === 'SideOverlayFront' || n === 'SideOverlayBack')) return spanDepth;
  return 0;
}

function _sideOverlayBoxDimsForSection(sec, wallName, meshName, params) {
  const w = Number(params?.width || 0);
  const d = Number(params?.depth || 0);
  const spanDepth = _sideOverlaySpanAlongDepthMm(sec, wallName, meshName);
  if (!(spanDepth > 0)) return { w, d };
  const n = String(meshName || '');
  const useZ = _wallUsesZAxis(wallName);
  if (!useZ && (n === 'SideOverlayLeft' || n === 'SideOverlayRight')) {
    return { w: w > 0 ? w : PLANK_THICKNESS_MM, d: spanDepth };
  }
  if (useZ && (n === 'SideOverlayFront' || n === 'SideOverlayBack')) {
    return { w: spanDepth, d: d > 0 ? d : PLANK_THICKNESS_MM };
  }
  return { w, d };
}

/** Локальная позиция накладки — как в addSidePlanksIfNeeded (центр по глубине секции). */
function _sideOverlayLocalPose(sec, wallName, meshName, heightMm, bottomLocal = 0) {
  const size = sec?.size;
  if (!size) return null;
  const norm = String(wallName || '').trim().toLowerCase();
  const n = String(meshName || '');
  const h = Math.max(10, Number(heightMm) || Number(size.y) || 0);
  const bottom = Math.max(0, Number(bottomLocal) || 0);
  const pose = { x: null, y: bottom + h / 2, z: null };

  if (norm === 'back' || norm === 'front') {
    if (n !== 'SideOverlayLeft' && n !== 'SideOverlayRight') return null;
    const depthCenter = _sectionTrimDepthCenterLocal(sec, norm);
    pose.z = depthCenter != null ? depthCenter : (norm === 'front' ? -size.z / 2 : size.z / 2);
    return pose;
  }
  if (norm === 'left' || norm === 'right') {
    if (n !== 'SideOverlayFront' && n !== 'SideOverlayBack') return null;
    const depthCenter = _sectionTrimDepthCenterLocal(sec, norm);
    pose.x =
      depthCenter != null ? depthCenter : (norm === 'left' ? size.x / 2 : -size.x / 2);
    if (n === 'SideOverlayFront') {
      pose.z =
        norm === 'left'
          ? -size.z + PLANK_THICKNESS_MM / 2
          : PLANK_THICKNESS_MM / 2;
    } else {
      pose.z =
        norm === 'left'
          ? -PLANK_THICKNESS_MM / 2
          : size.z - PLANK_THICKNESS_MM / 2;
    }
    return pose;
  }
  return null;
}

function _findSectionForTrimMesh(mesh) {
  if (!mesh || !Array.isArray(state.customSections)) return null;
  let node = mesh.parent;
  while (node) {
    for (const sec of state.customSections) {
      if (sec?.group === node) return sec;
    }
    node = node.parent;
  }
  return null;
}

/** Накладка: глубина и центр по секции (не по bbox тумбы). Высота — текущая (после §6.3). */
function _fixSideOverlayMeshSectionSize(mesh, sec, wallName) {
  if (!mesh?.isMesh || !sec?.size) return false;
  const n = mesh.name || '';
  if (!mesh.userData?.isSideOverlay && !/^SideOverlay(Left|Right|Front|Back)$/.test(n)) {
    return false;
  }
  const params = mesh.geometry?.parameters;
  if (!params) return false;
  const h = Math.max(10, Number(params.height) || 0);
  const { w, d } = _sideOverlayBoxDimsForSection(sec, wallName, n, params);
  const bottomLocal = Math.max(0, mesh.position.y - h / 2);
  const depthOk =
    (n === 'SideOverlayLeft' || n === 'SideOverlayRight')
      ? Math.abs(params.depth - d) < 5
      : (n === 'SideOverlayFront' || n === 'SideOverlayBack')
        ? Math.abs(params.width - w) < 5
        : true;
  const pose = _sideOverlayLocalPose(sec, wallName, n, h, bottomLocal);
  const posOk =
    !pose ||
    ((pose.x == null || Math.abs(mesh.position.x - pose.x) < 3) &&
      (pose.z == null || Math.abs(mesh.position.z - pose.z) < 3) &&
      Math.abs(mesh.position.y - pose.y) < 3);
  if (depthOk && posOk) {
    return _clipVerticalTrimAtTumbaTops(mesh, sec, wallName, sec?.size?.y || 0);
  }

  mesh.geometry.dispose();
  mesh.geometry = new THREE.BoxGeometry(w, h, d);
  if (pose) {
    if (pose.x != null) mesh.position.x = pose.x;
    mesh.position.y = pose.y;
    if (pose.z != null) mesh.position.z = pose.z;
  }
  mesh.userData.cldTrimBaseSize = { w, h, d };
  mesh.userData.cldTrimBasePosition = mesh.position.clone();
  _clipVerticalTrimAtTumbaTops(mesh, sec, wallName, sec?.size?.y || 0);
  return true;
}

/** Все боковые накладки на стене — габарит по секции (W × H_trim × sectionDepth). */
function _ensureSideOverlaysSectionSize(wallName) {
  if (!state.scene || !Array.isArray(state.customSections)) return;
  const norm = String(wallName || '').trim().toLowerCase();
  let fixed = 0;
  for (const sec of state.customSections) {
    if (!sec?.group || (sec.wallName || '').toLowerCase() !== norm) continue;
    if (!(Number(sec.facadeDepthMm) > 0) && sec.size) {
      const wn = sec.wallName || norm;
      sec.facadeDepthMm =
        wn === 'left' || wn === 'right'
          ? Number(sec.size.x || 0)
          : Number(sec.size.z || 0);
    }
    sec.group.traverse((obj) => {
      if (_fixSideOverlayMeshSectionSize(obj, sec, norm)) fixed++;
    });
  }
  if (fixed > 0 && typeof window !== 'undefined' && window.DEBUG_TRIM_VERTICAL_HEIGHT === true) {
    console.log('[TRIM-OVERLAY-DEPTH] ensured section size', { wall: norm, fixed });
  }
}

/** Сброс накладок до полной высоты и глубины секции перед пересборкой переходов. */
function _restoreSideOverlaysFullHeight(wallName) {
  if (!state.scene || !Array.isArray(state.customSections)) return;
  const norm = String(wallName || '').trim().toLowerCase();
  const overlayNameRe = /^SideOverlay(Left|Right|Front|Back)$/;

  for (const sec of state.customSections) {
    if (!sec?.group || (sec.wallName || '').toLowerCase() !== norm) continue;
    const fullH = Number(sec.size?.y || 0);
    if (!fullH) continue;

    sec.group.traverse((obj) => {
      if (!obj?.isMesh) return;
      const n = obj.name || '';
      if (!obj.userData?.isSideOverlay && !overlayNameRe.test(n)) return;
      try {
        const params = obj.geometry?.parameters;
        if (!params) return;
        const { w, d } = _sideOverlayBoxDimsForSection(sec, wallName, n, params);
        const heightOk = Math.abs(params.height - fullH) < 5;
        const depthOk =
          (n === 'SideOverlayLeft' || n === 'SideOverlayRight')
            ? Math.abs(params.depth - d) < 5
            : (n === 'SideOverlayFront' || n === 'SideOverlayBack')
              ? Math.abs(params.width - w) < 5
              : true;
        if (heightOk && depthOk) {
          delete obj.userData._trimmedSideOverlayForLow;
          return;
        }
        obj.geometry.dispose();
        obj.geometry = new THREE.BoxGeometry(w, fullH, d);
        const pose = _sideOverlayLocalPose(sec, wallName, n, fullH);
        if (pose) {
          if (pose.x != null) obj.position.x = pose.x;
          obj.position.y = pose.y;
          if (pose.z != null) obj.position.z = pose.z;
        } else {
          obj.position.y = fullH / 2;
        }
        delete obj.userData.cldTrimBaseSize;
        delete obj.userData.cldTrimBasePosition;
        delete obj.userData._trimmedSideOverlayForLow;
      } catch (e) {
        console.warn('[TRANSITION] _restoreSideOverlaysFullHeight error', e);
      }
    });
  }
}

/** Планки 50 мм и накладки 16 мм — одна логика высоты по зоне U. */
function _adjustVerticalTrimHeightsForWall(wallName) {
  if (!state.scene || !Array.isArray(state.customSections)) return;
  const norm = String(wallName || '').trim().toLowerCase();
  const useZ = _wallUsesZAxis(norm);

  let secMatched = 0;
  let meshFound = 0;
  const report = [];

  for (const sec of state.customSections) {
    if (!sec?.group || (sec.wallName || '').toLowerCase() !== norm) continue;
    const straight = _isStraightSectionForTrimHeight(sec);
    const fullH = Number(sec.size?.y || 0);
    if (!straight || !fullH) {
      report.push({ sectionId: sec.id, skipped: !straight ? 'not_straight' : 'no_height' });
      continue;
    }
    _ensureSectionLayoutForTopMerge(sec);
    secMatched++;

    const off = sec.offsets || {};
    let hasOL = false;
    let hasPL = false;
    sec.group.traverse((o) => {
      const n = o?.name || '';
      if (n === 'SideOverlayLeft') hasOL = true;
      if (n === 'SidePlankLeft') hasPL = true;
    });
    let furnInSec = 0;
    state.scene.traverse((o) => {
      if (_isTransitionWallFurnitureRoot(o) && o.userData.sectionId === sec.id) furnInSec++;
    });

    // Пустая tall L/R у окна: боковины в потолок не тянем (иначе «orphan» планка в пустой ячейке).
    // Удаление meshes — syncWindowAlongEmptyFrameVisibility; здесь только не поднимать fullH.
    const emptyWindowTall = _isWindowBridgeTallSection(sec) && furnInSec === 0;
    // §4.0: обычная прямая — пустая / торец без модуля → боковина скрыта.
    const ordinaryStraight = !_isSpecialLayoutSection(sec) && _isStraightSectionForTrimHeight(sec);
    const secPos = sec.group.position;
    const spanU = useZ ? Number(sec.size?.z) || 0 : Number(sec.size?.x) || 0;
    let edgeUMin = null;
    let edgeUMax = null;
    if (ordinaryStraight && spanU > 10) {
      if (norm === 'back') {
        edgeUMin = secPos.x;
        edgeUMax = secPos.x + spanU;
      } else if (norm === 'front') {
        edgeUMin = secPos.x - spanU;
        edgeUMax = secPos.x;
      } else if (norm === 'left') {
        edgeUMin = secPos.z - spanU;
        edgeUMax = secPos.z;
      } else if (norm === 'right') {
        edgeUMin = secPos.z;
        edgeUMax = secPos.z + spanU;
      }
    }

    sec.group.traverse((obj) => {
      if (!_isVerticalSectionTrimMesh(obj)) return;
      meshFound++;
      try {
        if (emptyWindowTall) {
          obj.visible = false;
          report.push({
            sectionId: sec.id,
            mesh: obj.name,
            skipped: 'empty_window_tall',
            furnitureInSection: 0,
          });
          return;
        }
        if (ordinaryStraight && furnInSec === 0) {
          obj.visible = false;
          report.push({
            sectionId: sec.id,
            mesh: obj.name,
            skipped: 'empty_straight_§4.0',
            furnitureInSection: 0,
          });
          return;
        }
        const logicalEdge = _verticalTrimLogicalEdge(obj.name, norm);
        if (
          ordinaryStraight &&
          logicalEdge &&
          edgeUMin != null &&
          edgeUMax != null &&
          furnInSec > 0
        ) {
          const band = _TRIM_OUTER_EDGE_EPS_MM + 220;
          let nearEdge = false;
          state.scene.traverse((o) => {
            if (nearEdge || !_isTransitionWallFurnitureRoot(o)) return;
            if (String(o.userData?.sectionId ?? '') !== String(sec.id)) return;
            if (o.userData?.isEndCabinetSlot === true) return;
            if (o.userData?.isGhost || o.userData?.isGhostClodisPrebuild) return;
            const box = _furnitureBBox(o);
            if (box.isEmpty()) return;
            const fMin = useZ ? box.min.z : box.min.x;
            const fMax = useZ ? box.max.z : box.max.x;
            if (logicalEdge === 'min') {
              if (fMin <= edgeUMin + band) nearEdge = true;
            } else if (fMax >= edgeUMax - band) {
              nearEdge = true;
            }
          });
          if (!nearEdge) {
            obj.visible = false;
            report.push({
              sectionId: sec.id,
              mesh: obj.name,
              skipped: 'empty_edge_§4.0',
              edge: logicalEdge,
              furnitureInSection: furnInSec,
            });
            return;
          }
        }
        obj.updateWorldMatrix(true);
        const trimBox = new THREE.Box3().setFromObject(obj);
        const trimU = _worldUSpanFromBox(trimBox, useZ);
        const beforeH = obj.geometry?.parameters?.height;
        // topLocal — от пола секции (уже с AutoTop). bottomLocal — 0 у комода, низ корпуса у навесной.
        const topLocal = _resolveVerticalTrimTargetH(sec, trimU, norm, obj);
        const bottomLocal = _resolveVerticalTrimBottomLocal(sec, norm, obj);
        const targetH = Math.max(10, topLocal - bottomLocal);
        _applyVerticalTrimMeshHeight(obj, targetH, fullH, sec, norm, bottomLocal);
        report.push({
          sectionId: sec.id,
          mesh: obj.name,
          isOverlay: !!obj.userData?.isSideOverlay,
          edge: _verticalTrimLogicalEdge(obj.name, norm),
          leftMm: off.leftMm || 0,
          hasOverlayLeft: hasOL,
          hasPlankLeft: hasPL,
          furnitureInSection: furnInSec,
          beforeMm: Math.round(beforeH || 0),
          targetMm: Math.round(targetH),
          topMm: Math.round(topLocal || 0),
          bottomMm: Math.round(bottomLocal || 0),
          afterMm: Math.round(obj.geometry?.parameters?.height || 0),
          fullMm: Math.round(fullH),
        });
      } catch (e) {
        console.warn('[TRANSITION] _adjustVerticalTrimHeightsForWall', e);
      }
    });
  }

  if (meshFound > 0) {
    console.log(`[TRIM-VERT2] wall=${norm} sections=${secMatched} meshes=${meshFound}`, report);
  }
}

function _adjustSideOverlayForLowFurniture(wallName) {
  _adjustVerticalTrimHeightsForWall(wallName);
  _ensureSideOverlaysSectionSize(wallName);
  _finalizeHeightMismatchOverlaysOnWall(wallName);
  _clipAllVerticalTrimsAtTumbaTopsForWall(wallName);
}

// ─── Top plank trim for low furniture ─────────────────────────────────────────

const _TOP_PLANK_H_MM = 50;  // fallback; live height → _sectionTopPlankHeightMm(sec)

/**
 * Top-plank behavior for low furniture (<1500):
 * - Collect furniture on this wall whose bbox overlaps THIS plank's world U-span (not sectionId).
 * - If any overlapping piece is low: hide original plank, add segments only above tall pieces.
 * - Never keep plank over free/empty areas within that plank span.
 */
/**
 * Мебель секции с окном: allLow → как ряд комодов на прямой (без tall-каркаса у notch).
 */
function _windowLowSlotOccupancy(sectionData) {
  const sid = String(sectionData?.id ?? '');
  const wallName = sectionData?.wallName || 'back';
  const useZ = _wallUsesZAxis(wallName);
  const slot = sectionData?.windowLowSlot;
  const notchA = Number(slot?.notchAlongA);
  const notchB = Number(slot?.notchAlongB);
  const spanA = Number(sectionData?.spanAlongA);
  const spanB = Number(sectionData?.spanAlongB);
  const roomWorld = new THREE.Vector3();
  if (state.room?.group) state.room.group.getWorldPosition(roomWorld);
  const roomW = Number(state.room?.width) || 0;
  const roomD = Number(state.room?.depth) || 0;
  const alongToWorldU = (along) => {
    const a = Number(along);
    if (wallName === 'back') return roomWorld.x + a;
    if (wallName === 'front') return roomWorld.x + (roomW - a);
    if (wallName === 'left') return roomWorld.z + (roomD - a);
    return roomWorld.z + a;
  };
  let uLeft0 = alongToWorldU(spanA);
  let uLeft1 = alongToWorldU(notchA);
  let uMid0 = alongToWorldU(notchA);
  let uMid1 = alongToWorldU(notchB);
  let uRight0 = alongToWorldU(notchB);
  let uRight1 = alongToWorldU(spanB);
  if (uLeft0 > uLeft1) {
    const t = uLeft0;
    uLeft0 = uLeft1;
    uLeft1 = t;
  }
  if (uMid0 > uMid1) {
    const t = uMid0;
    uMid0 = uMid1;
    uMid1 = t;
  }
  if (uRight0 > uRight1) {
    const t = uRight0;
    uRight0 = uRight1;
    uRight1 = t;
  }

  const items = [];
  let hasLow = false;
  let hasTall = false;
  const sorted = _getFurnitureOnWallSorted(wallName);
  for (const g of sorted) {
    if (String(g.userData?.sectionId ?? '') !== sid) continue;
    const b = _furnitureBBox(g);
    if (b.isEmpty()) continue;
    const h = b.max.y - b.min.y;
    const isLow = Number.isFinite(h) && h > 0 && h < AUTO_TOP_HEIGHT_LIMIT_MM;
    const isTall = Number.isFinite(h) && h >= AUTO_TOP_HEIGHT_LIMIT_MM;
    if (isLow) hasLow = true;
    if (isTall) hasTall = true;
    const minU = useZ ? b.min.z : b.min.x;
    const maxU = useZ ? b.max.z : b.max.x;
    items.push({ isLow, isTall, minU, maxU, h });
  }
  const overlaps = (lo, hi, it) => it.maxU > lo + 20 && it.minU < hi - 20;
  const lowIn = (lo, hi) => items.some((it) => it.isLow && overlaps(lo, hi, it));
  const anyIn = (lo, hi) => items.some((it) => overlaps(lo, hi, it));
  return {
    hasLow,
    hasTall,
    empty: !hasLow && !hasTall,
    allLow: hasLow && !hasTall,
    leftLow: lowIn(uLeft0, uLeft1),
    midLow: lowIn(uMid0, uMid1),
    rightLow: lowIn(uRight0, uRight1),
    midHasFurniture: anyIn(uMid0, uMid1),
    leftTallBand: !lowIn(uLeft0, uLeft1),
    rightTallBand: !lowIn(uRight0, uRight1),
  };
}

function _adjustTopPlankForLowFurniture(wallName) {
  if (!state.scene || !Array.isArray(state.customSections)) return;
  const norm = String(wallName || '').trim().toLowerCase();
  const useZ = norm === 'left' || norm === 'right';
  const debugTop = !!window.DEBUG_TOP_PLANK;
  const wallFurniture = _getFurnitureOnWallSorted(wallName);
  const wallHeights = wallFurniture.map((f) => {
    const b = _furnitureBBox(f);
    return b.isEmpty() ? 0 : (b.max.y - b.min.y);
  });
  const hasAnyLowOnWall = wallHeights.some((h) => Number.isFinite(h) && h > 0 && h < AUTO_TOP_HEIGHT_LIMIT_MM);
  if (debugTop) {
    console.log('[TOP-PLANK][WALL-START]', {
      wall: norm,
      furnitureCount: wallFurniture.length,
      heightsMm: wallHeights.map((h) => Math.round(h)),
      hasAnyLowOnWall,
      thresholdMm: AUTO_TOP_HEIGHT_LIMIT_MM,
    });
  }

  for (const sec of state.customSections) {
    if (!sec?.group || (sec.wallName || '').toLowerCase() !== norm) continue;

    // Окно: notch-топ только пока секция пустая. С мебелью — обычный путь (как комод).
    if (sec.windowLowSlot) {
      const occ = _windowLowSlotOccupancy(sec);
      if (occ.empty) {
        const notchA = Number(sec.windowLowSlot.notchAlongA);
        const notchB = Number(sec.windowLowSlot.notchAlongB);
        const spanA = Number(sec.spanAlongA);
        const spanB = Number(sec.spanAlongB);
        const slotOk =
          Number.isFinite(notchA) &&
          Number.isFinite(notchB) &&
          Number.isFinite(spanA) &&
          Number.isFinite(spanB) &&
          notchB > notchA + 1 &&
          spanB > spanA + 1;
        const toRemoveSlot = [];
        sec.group.traverse((obj) => {
          if (obj.userData?.isTopPlankSegment) toRemoveSlot.push(obj);
        });
        toRemoveSlot.forEach((o) => {
          o.geometry?.dispose();
          if (o.material?.dispose) o.material.dispose();
          o.parent?.remove(o);
        });
        const baseSlot = [];
        sec.group.traverse((obj) => {
          if (obj.userData?.isTopPlank && !obj.userData?.isTopPlankSegment) {
            baseSlot.push(obj);
          }
        });
        for (const p of baseSlot) {
          p.visible = false;
          p.userData.windowLowSlotHidden = true;
        }
        if (slotOk && baseSlot.length) {
          const templatePlank =
            baseSlot.find((p) => !p.userData?.isPlankLengthSegment) || baseSlot[0];
          const plankH = _sectionTopPlankHeightMm(sec);
          const plankD = PLANK_THICKNESS_MM;
          const sizeYSlot = Number(sec.size?.y) || 0;
          const plankY = sizeYSlot > 0 ? sizeYSlot - plankH / 2 : templatePlank.position.y;
          const plankFixed = !useZ ? templatePlank.position.z : templatePlank.position.x;
          const mat =
            typeof templatePlank.material?.clone === 'function'
              ? templatePlank.material.clone()
              : new THREE.MeshStandardMaterial({
                  color: 0xffffff,
                  metalness: 0.1,
                  roughness: 0.8,
                });
          const sizeX = Number(sec.size?.x) || 0;
          const sizeZ = Number(sec.size?.z) || 0;
          for (const [a0, a1] of [
            [spanA, notchA],
            [notchB, spanB],
          ]) {
            const lo = Math.max(a0, spanA);
            const hi = Math.min(a1, spanB);
            if (hi - lo < 20) continue;
            const u0 = lo - spanA;
            const u1 = hi - spanA;
            const segW = u1 - u0;
            const localCenter = (u0 + u1) / 2;
            const geom = !useZ
              ? new THREE.BoxGeometry(segW, plankH, plankD)
              : new THREE.BoxGeometry(plankD, plankH, segW);
            const mesh = new THREE.Mesh(geom, mat);
            mesh.name = 'TopPlankSegment';
            mesh.userData.isTopPlankSegment = true;
            mesh.userData.isTopPlank = true;
            mesh.userData.isFacade = true;
            mesh.userData.isSectionFacadeTrim = true;
            mesh.userData.sectionTrimUsesOutsideDecor = true;
            mesh.userData.windowLowSlotPart = true;
            assignTrimPartKeyToMesh(mesh, norm);
            if (!useZ) {
              const x = norm === 'front' ? localCenter - sizeX : localCenter;
              mesh.position.set(x, plankY, plankFixed);
            } else {
              const z = norm === 'left' ? localCenter - sizeZ : localCenter;
              mesh.position.set(plankFixed, plankY, z);
            }
            mesh.visible = true;
            try {
              syncTrimNominalSizeFromGeometry(mesh);
            } catch (_) {}
            sec.group.add(mesh);
          }
        }
        if (debugTop) {
          console.log('[TOP-PLANK][SEC-DECISION]', {
            wall: norm,
            sectionId: sec.id,
            action: 'window_low_slot_empty_tall_only',
          });
        }
        continue;
      }
      // с мебелью — не continue, обычная логика ниже
    }

    // fixedHeight (под окном): при своей низкой мебели — только AutoTop на корпусе,
    // потолочную/подоконную планку секции убрать (как «только комоды» на прямой).
    if (Number(sec.fixedHeightMm) > 0) {
      const sid = String(sec.id);
      const ownLow = wallFurniture.some((g, i) => {
        if (String(g.userData?.sectionId) !== sid) return false;
        const h = wallHeights[i];
        return Number.isFinite(h) && h > 0 && h < AUTO_TOP_HEIGHT_LIMIT_MM;
      });
      if (ownLow) {
        const planks = [];
        sec.group.traverse((obj) => {
          if (obj.userData?.isTopPlank && !obj.userData?.isTopPlankSegment) {
            planks.push(obj);
          }
        });
        for (const p of planks) p.visible = false;
        const toRemoveSeg = [];
        sec.group.traverse((obj) => {
          if (obj.userData?.isTopPlankSegment) toRemoveSeg.push(obj);
        });
        toRemoveSeg.forEach((o) => {
          o.geometry?.dispose();
          if (o.material?.dispose) o.material.dispose();
          o.parent?.remove(o);
        });
        if (debugTop) {
          console.log('[TOP-PLANK][SEC-DECISION]', {
            wall: norm,
            sectionId: sec.id,
            action: 'hide_all',
            reason: 'fixed_height_own_low',
          });
        }
        continue;
      }
    }

    // Tall у окна (legacy role): как обычная секция — низкие → AutoTop, планку убрать.
    if (_isWindowBridgeTallSection(sec)) {
      const sid = String(sec.id);
      const own = [];
      for (let i = 0; i < wallFurniture.length; i++) {
        const g = wallFurniture[i];
        if (String(g.userData?.sectionId) !== sid) continue;
        own.push({ grp: g, h: wallHeights[i] });
      }
      const hasOwnLow = own.some(
        (o) => Number.isFinite(o.h) && o.h > 0 && o.h < AUTO_TOP_HEIGHT_LIMIT_MM
      );
      const hasOwnTall = own.some(
        (o) => Number.isFinite(o.h) && o.h >= AUTO_TOP_HEIGHT_LIMIT_MM
      );
      const tallPlanks = [];
      sec.group.traverse((obj) => {
        if (obj.userData?.isTopPlank && !obj.userData?.isTopPlankSegment) {
          tallPlanks.push(obj);
        }
      });
      if (!hasOwnLow && !hasOwnTall) {
        for (const p of tallPlanks) p.visible = true;
        if (debugTop) {
          console.log('[TOP-PLANK][SEC-DECISION]', {
            wall: norm,
            sectionId: sec.id,
            action: 'keep_original',
            reason: 'window_bridge_tall_empty',
          });
        }
        continue;
      }
      if (hasOwnLow && !hasOwnTall) {
        for (const p of tallPlanks) p.visible = false;
        const toRemoveSeg = [];
        sec.group.traverse((obj) => {
          if (obj.userData?.isTopPlankSegment) toRemoveSeg.push(obj);
        });
        toRemoveSeg.forEach((o) => {
          o.geometry?.dispose();
          if (o.material?.dispose) o.material.dispose();
          o.parent?.remove(o);
        });
        if (debugTop) {
          console.log('[TOP-PLANK][SEC-DECISION]', {
            wall: norm,
            sectionId: sec.id,
            action: 'hide_all',
            reason: 'window_bridge_tall_only_low',
          });
        }
        continue;
      }
      // hasOwnTall: fall through — но режем только по своей мебели (ниже via wallFurniture filter).
    }

    // Remove previous generated segments.
    const toRemove = [];
    sec.group.traverse((obj) => { if (obj.userData?.isTopPlankSegment) toRemove.push(obj); });
    toRemove.forEach((o) => { o.geometry?.dispose(); if (o.material?.dispose) o.material.dispose(); o.parent?.remove(o); });

    // Включая сегменты §6.6 (isPlankLengthSegment) — иначе планки остаются на потолке над тумбами.
    const basePlanks = [];
    sec.group.traverse((obj) => {
      if (obj.userData?.isTopPlank && !obj.userData?.isTopPlankSegment) {
        basePlanks.push(obj);
      }
    });
    if (!basePlanks.length) continue;
    const templatePlank = basePlanks.find((p) => !p.userData?.isPlankLengthSegment) || basePlanks[0];

    let plankMinU = Infinity;
    let plankMaxU = -Infinity;
    for (const p of basePlanks) {
      p.updateWorldMatrix(true);
      const plankBox = new THREE.Box3().setFromObject(p);
      plankMinU = Math.min(plankMinU, !useZ ? plankBox.min.x : plankBox.min.z);
      plankMaxU = Math.max(plankMaxU, !useZ ? plankBox.max.x : plankBox.max.z);
    }
    if (debugTop) {
      console.log('[TOP-PLANK][SEC-PLANK]', {
        wall: norm,
        sectionId: sec.id,
        plankMinU: Math.round(plankMinU),
        plankMaxU: Math.round(plankMaxU),
        spanMm: Math.round(plankMaxU - plankMinU),
      });
    }

    const eps = 2;
    // If there is no low furniture on this wall, keep original behavior.
    if (!hasAnyLowOnWall) {
      for (const p of basePlanks) p.visible = true;
      if (debugTop) {
        console.log('[TOP-PLANK][SEC-DECISION]', {
          wall: norm,
          sectionId: sec.id,
          action: 'keep_original',
          reason: 'no_low_on_wall',
          plankParts: basePlanks.length,
        });
      }
      continue;
    }

    for (const p of basePlanks) p.visible = false;

    // Предпочтительно U из layout высоких зон (как split) — bbox после посадки комода уезжает.
    const layoutTall = _getTallTopRangesFromLayout(sec);
    let remaining = [];
    if (layoutTall?.length) {
      remaining = layoutTall.map((r) => [r.uLo, r.uHi]);
    } else {
    // Build segments only above tall furniture that intersects this plank span.
    const tallRanges = [];
    const overlapLog = [];
    for (let i = 0; i < wallFurniture.length; i++) {
      const grp = wallFurniture[i];
      let b = computeFurnitureCorpusLayoutWorldBBoxNoAo(grp);
      if (!b || b.isEmpty()) b = _furnitureBBox(grp);
      if (b.isEmpty()) continue;
      const h = b.max.y - b.min.y;
      const minU = !useZ ? b.min.x : b.min.z;
      const maxU = !useZ ? b.max.x : b.max.z;
      const intersects = !(maxU <= plankMinU + eps || minU >= plankMaxU - eps);
      if (debugTop) {
        overlapLog.push({
          i,
          id: grp.userData?.id || grp.uuid,
          sectionId: grp.userData?.sectionId ?? null,
          hMm: Math.round(h),
          minU: Math.round(minU),
          maxU: Math.round(maxU),
          intersects,
          isTall: _furnitureIsTallForTrim(grp, b),
        });
      }
      if (!_furnitureIsTallForTrim(grp, b)) continue;
      if (!intersects) continue;
      // Clamp to original plank span.
      let cMin = Math.max(minU, plankMinU);
      let cMax = Math.min(maxU, plankMaxU);
      // Не заходить U на соседнюю низкую мебель (низкий шкаф / комод).
      // Низкий навес в той же ячейке (cohabit) не режет №1 верхнего.
      for (let j = 0; j < wallFurniture.length; j++) {
        if (j === i) continue;
        const og = wallFurniture[j];
        if (_isSameZoneCohabitPair(grp, og)) continue;
        let ob = computeFurnitureCorpusLayoutWorldBBoxNoAo(og);
        if (!ob || ob.isEmpty()) ob = _furnitureBBox(og);
        if (ob.isEmpty() || _furnitureIsTallForTrim(og, ob)) continue;
        const oMin = !useZ ? ob.min.x : ob.min.z;
        const oMax = !useZ ? ob.max.x : ob.max.z;
        if (oMin >= cMin - 5 && oMin <= cMax + 40) cMax = Math.min(cMax, oMin);
        if (oMax <= cMax + 5 && oMax >= cMin - 40) cMin = Math.max(cMin, oMax);
      }
      if (cMax - cMin > 5) tallRanges.push([cMin, cMax]);
    }
    if (debugTop) {
      console.log('[TOP-PLANK][SEC-OVERLAPS]', {
        wall: norm,
        sectionId: sec.id,
        overlapLog,
      });
    }
    if (tallRanges.length === 0) continue;

    // Merge touching tall ranges.
    tallRanges.sort((a, b) => a[0] - b[0]);
    for (const r of tallRanges) {
      if (!remaining.length || remaining[remaining.length - 1][1] < r[0] - 2) remaining.push([...r]);
      else remaining[remaining.length - 1][1] = Math.max(remaining[remaining.length - 1][1], r[1]);
    }
    } // end else bbox path

    if (debugTop) {
      console.log('[TOP-PLANK][SEC-RANGES]', {
        wall: norm,
        sectionId: sec.id,
        fromLayout: !!(layoutTall && layoutTall.length),
        mergedRanges: remaining.map(([a, b]) => [Math.round(a), Math.round(b)]),
      });
    }
    if (!remaining.length) continue;

    // Rebuild plank as segments over tall-only ranges.
    const pivot = sec.group.position;
    const plankH = _sectionTopPlankHeightMm(sec);
    const plankD = PLANK_THICKNESS_MM;
    const sizeY = Number(sec.size?.y) || 0;
    const plankY = sizeY > 0 ? sizeY - plankH / 2 : templatePlank.position.y;
    const plankFixed = !useZ ? templatePlank.position.z : templatePlank.position.x;
    const mat = typeof templatePlank.material?.clone === 'function'
      ? templatePlank.material.clone()
      : new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.8 });

    let builtSegments = 0;
    for (const [wMin, wMax] of remaining) {
      const segW = wMax - wMin;
      if (segW < 5) continue;
      // World → local U
      const localCenter = !useZ
        ? (wMin + segW / 2) - pivot.x
        : (wMin + segW / 2) - pivot.z;
      const geom = !useZ
        ? new THREE.BoxGeometry(segW, plankH, plankD)
        : new THREE.BoxGeometry(plankD, plankH, segW);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.name = 'TopPlankSegment';
      mesh.userData.isTopPlankSegment = true;
      mesh.userData.isTopPlank = true;
      mesh.userData.isFacade = true;
      mesh.userData.isSectionFacadeTrim = true;
      mesh.userData.sectionTrimUsesOutsideDecor = true;
      mesh.userData.isSectionTransitionPart = true;
      assignTrimPartKeyToMesh(mesh, norm);
      if (!useZ) mesh.position.set(localCenter, plankY, plankFixed);
      else       mesh.position.set(plankFixed, plankY, localCenter);
      mesh.visible = true;
      try {
        syncTrimNominalSizeFromGeometry(mesh);
      } catch (_) {}
      sec.group.add(mesh);
      builtSegments++;
    }
    if (debugTop) {
      console.log('[TOP-PLANK][SEC-RESULT]', {
        wall: norm,
        sectionId: sec.id,
        originalVisibleAfter: templatePlank.visible,
        builtSegments,
      });
    }
  }
  if (debugTop) console.log('[TOP-PLANK][WALL-END]', { wall: norm });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Стена с рядом у окна (три секции tall|under|tall или legacy bridge). */
function _wallHasWindowAlongLayout(wallName) {
  if (!Array.isArray(state.customSections)) return false;
  const norm = String(wallName || '').trim().toLowerCase();
  if (!norm) return false;
  for (const sec of state.customSections) {
    if (!sec || (sec.wallName || '').toLowerCase() !== norm) continue;
    if (
      sec.windowAlongWallGroupId ||
      sec.windowAlongWallRole ||
      sec.windowBridgeGroupId ||
      sec.windowBridgeRole ||
      sec.underWindowBay ||
      sec.windowLowSlot
    ) {
      return true;
    }
  }
  return false;
}

function _findFurnitureByUuid(uuid) {
  if (!uuid || !state.scene) return null;
  const want = String(uuid);
  let found = null;
  state.scene.traverse((o) => {
    if (found || !o?.isGroup) return;
    if (String(o.uuid) === want) found = o;
  });
  return found;
}

/**
 * Фаза 4: стыки ряда у окна — из plan (heightMismatch/cap ← junctions модели),
 * не из парного перебора sorted между разными sectionId.
 * @returns {{ capsBySectionId: Map<string, number>, actions: object[], row: object, plan: object[] } | null}
 */
function _collectWindowRowJunctionActions(wallName, planOpt = null, rowOpt = null) {
  const norm = String(wallName || '').trim().toLowerCase();
  let row = rowOpt;
  if (!row) {
    try {
      row = buildWindowRowState(norm, { skipCache: true });
    } catch (_) {
      return null;
    }
  }
  if (!row) return null;

  let plan = Array.isArray(planOpt) ? planOpt : null;
  if (!plan) {
    try {
      plan = computeTrimPlan(row);
    } catch (_) {
      plan = [];
    }
  }

  const capsBySectionId = new Map();
  const actions = [];
  const junctionParts = (plan || []).filter(
    (p) => p && (p.kind === 'heightMismatch' || p.kind === 'cap')
  );

  for (const p of junctionParts) {
    if (p.kind === 'heightMismatch') {
      const leftGrp = _findFurnitureByUuid(p.leftFurnitureUuid);
      const rightGrp = _findFurnitureByUuid(p.rightFurnitureUuid);
      if (!leftGrp || !rightGrp) continue;
      const key = String(p.key || `winrow_j_${p.cellId}`);
      actions.push({ type: 'overlay', leftGrp, rightGrp, wallName: norm, key });
      continue;
    }

    if (p.kind !== 'cap') continue;

    // Tall/low из плана первыми (колонна: low = комод). Не требовать left/right uuid.
    let niche = _findFurnitureByUuid(p.tallFurnitureUuid);
    let stand = _findFurnitureByUuid(p.lowFurnitureUuid);
    const leftGrp = _findFurnitureByUuid(p.leftFurnitureUuid);
    const rightGrp = _findFurnitureByUuid(p.rightFurnitureUuid);
    const lk = String(
      p.leftPlacementKind || leftGrp?.userData?.__placementKind || ''
    );
    const rk = String(
      p.rightPlacementKind || rightGrp?.userData?.__placementKind || ''
    );

    if (!niche || !stand || niche === stand) {
      if (!leftGrp || !rightGrp) continue;
      const cap = classifyCapBetweenZones(
        {
          occupants: [
            { uuid: leftGrp.uuid, placementKind: lk },
            p.leftCohabitPk
              ? { uuid: 'co_l', placementKind: p.leftCohabitPk }
              : null,
          ].filter(Boolean),
        },
        {
          occupants: [
            { uuid: rightGrp.uuid, placementKind: rk },
            p.rightCohabitPk
              ? { uuid: 'co_r', placementKind: p.rightCohabitPk }
              : null,
          ].filter(Boolean),
        }
      );
      if (cap?.leftRole === 'tall') {
        niche = leftGrp;
        stand = rightGrp;
      } else if (cap?.rightRole === 'tall') {
        niche = rightGrp;
        stand = leftGrp;
      } else if (isTallFurniturePlacementKind(lk) && isLowFurniturePlacementKind(rk)) {
        niche = leftGrp;
        stand = rightGrp;
      } else if (isLowFurniturePlacementKind(lk) && isTallFurniturePlacementKind(rk)) {
        niche = rightGrp;
        stand = leftGrp;
      } else {
        continue;
      }
    }

    const keyParts = String(p.key || '').split(':');
    const leftCellId = keyParts[1] || p.cellId;
    const rightCellId = keyParts[2] || null;
    const bump = (sid) => {
      if (sid == null) return;
      const k = String(sid);
      capsBySectionId.set(k, (capsBySectionId.get(k) || 0) + 1);
    };
    bump(leftCellId);
    bump(rightCellId);

    const useZ = _wallUsesZAxis(norm);
    const tBox = _furnitureBBox(niche);
    const lBox = _furnitureBBox(stand);
    let side = p.dresserSide || p.side || 'right';
    if (!tBox.isEmpty() && !lBox.isEmpty()) {
      const tMid = useZ
        ? (tBox.min.z + tBox.max.z) / 2
        : (tBox.min.x + tBox.max.x) / 2;
      const lMid = useZ
        ? (lBox.min.z + lBox.max.z) / 2
        : (lBox.min.x + lBox.max.x) / 2;
      side = lMid < tMid ? 'left' : 'right';
    }
    actions.push({
      type: 'cap',
      leftGrp: niche,
      rightGrp: stand,
      side,
      wallName: norm,
      key: String(p.key || `cap_${niche.uuid}_${stand.uuid}`),
    });
  }

  return { capsBySectionId, actions, row, plan };
}

function _buildWindowRowJunctionActions(actions) {
  if (!Array.isArray(actions) || !actions.length) return;
  for (const a of actions) {
    if (!a) continue;
    if (a.type === 'overlay') {
      _buildHeightMismatchSideOverlay(a.leftGrp, a.rightGrp, a.wallName, a.key);
    } else if (a.type === 'cap') {
      _buildSideCapFromGroups(a.leftGrp, a.rightGrp, a.side, a.wallName, a.key);
      _buildTopCapFromGroups(a.leftGrp, a.rightGrp, a.side, a.wallName, a.key);
    }
  }
}

/**
 * Фаза 4: layout cache для cap-секций + геометрия из plan.
 * Вызывается из applyTrimPlan (после фазы 3).
 */
function applyWindowRowJunctionsFromPlan(wallName, planOpt = null, rowOpt = null) {
  const collected = _collectWindowRowJunctionActions(wallName, planOpt, rowOpt);
  if (!collected) return null;

  _removeWindowRowJunctionMeshes(wallName);

  if (collected.capsBySectionId.size > 0 && Array.isArray(state.customSections)) {
    for (const [sid] of collected.capsBySectionId) {
      const sec = state.customSections.find((s) => s && String(s.id) === String(sid));
      if (!sec) continue;
      if (typeof window.__clodisComputeSectionLayout === 'function') {
        try {
          window.__clodisComputeSectionLayout(sec);
        } catch (_) {}
      }
    }
  }

  _buildWindowRowJunctionActions(collected.actions);
  return collected;
}

/** Снять только стыки ряда (не AutoTop). */
function _removeWindowRowJunctionMeshes(wallName) {
  if (!state.scene) return;
  const norm = String(wallName || '').trim().toLowerCase();
  const toRemove = [];
  state.scene.traverse((obj) => {
    const ud = obj?.userData;
    if (!ud?.isSectionTransitionPart) return;
    if (String(ud.wallName || '').trim().toLowerCase() !== norm) return;
    if (ud.isTransitionAutoTopCap) return;
    const k = String(ud.transitionKey || '');
    if (ud.isTransitionHeightMismatch) {
      toRemove.push(obj);
      return;
    }
    if (
      (ud.isTransitionSideCap || ud.isTransitionTopCap) &&
      (k.includes('winrow') || k.startsWith('cap:') || k.startsWith('heightMismatch:'))
    ) {
      toRemove.push(obj);
    }
  });
  for (const obj of toRemove) {
    try {
      _restoreCatalogTopsFromTransitionMesh(obj);
    } catch (_) {}
    try {
      obj.geometry?.dispose?.();
      obj.material?.dispose?.();
      obj.parent?.remove(obj);
    } catch (_) {}
  }
}

/** Lite-path legacy alias. */
function _applyWindowRowJunctionsFromModel(wallName) {
  return applyWindowRowJunctionsFromPlan(wallName);
}

/**
 * Rebuild all transition geometry for a given wall.
 * Scans furniture groups directly — works even when multiple items share one sectionId.
 * @param {string} wallName
 * @param {{ furnitureLayoutOnlyUuids?: string[]|string, placeLayoutOnly?: boolean }} [opts]
 *   furnitureLayoutOnlyUuids — при place: updateFurnitureInSection только для этих uuid
 *   placeLayoutOnly — без clear/caps/planks (ряд одинаковых шкафов); шкаф↔тумба → полный path
 */
function _reapplyWindowLowSlotsOnWall(wallName) {
  if (!Array.isArray(state.customSections)) return;
  const wn = String(wallName || '').trim().toLowerCase();
  for (const sec of state.customSections) {
    if (!sec?.windowLowSlot) continue;
    if (String(sec.wallName || '').trim().toLowerCase() !== wn) continue;
    try {
      applyWindowAsLowSlotLikeStraightSection(sec);
    } catch (e) {
      console.warn('⚠️ reapply windowLowSlot failed:', e);
    }
  }
}

/** Диагностика: какая ветка стыков и сколько стоит каждый шаг (см. docs/SECTION-UNIFIED-CONTRACT.md §7). */
const _txNow =
  typeof performance !== 'undefined' ? () => performance.now() : () => Date.now();
let _txDepth = 0;
let _txMarks = {};
let _txBranch = '?';

function _tx(label, fn) {
  const t = _txNow();
  try {
    return fn();
  } finally {
    _txMarks[label] = Math.round((_txMarks[label] || 0) + (_txNow() - t));
  }
}

export function rebuildWallTransitions(wallName, opts = {}) {
  if (_txDepth > 0) return _rebuildWallTransitionsImpl(wallName, opts);
  _txDepth += 1;
  _txMarks = {};
  _txBranch = '?';
  const t0 = _txNow();
  try {
    return _rebuildWallTransitionsImpl(wallName, opts);
  } finally {
    _txDepth -= 1;
    const timing = {
      wall: String(wallName || ''),
      branch: _txBranch,
      totalMs: Math.round(_txNow() - t0),
      steps: _txMarks,
    };
    if (typeof window !== 'undefined') {
      window.__cldLastTransitionsTime = timing;
      if (window.__CLD_DEBUG_PERF === true) console.log('[TX-TIME]', timing);
    }
  }
}

function _kitchenNmSectionAfterPlace(wallName) {
  try {
    const kse =
      typeof window !== 'undefined' ? window.__cldKitchenSectionEngine : null;
    if (kse && typeof kse.afterKitchenPlaceLayout === 'function') {
      kse.afterKitchenPlaceLayout(wallName);
      return;
    }
  } catch (_) {}
  _clearAllTransitionsOnWall(wallName);
  try {
    const strip =
      typeof window !== 'undefined'
        ? window.__cldStripWardrobeSectionTrimForKitchen
        : null;
    if (typeof strip === 'function') {
      const norm = String(wallName || '').trim().toLowerCase();
      for (const sec of state.customSections || []) {
        if (!sec || (sec.wallName || '').toLowerCase() !== norm) continue;
        strip(sec);
      }
    }
  } catch (_) {}
}

function _rebuildWallTransitionsImpl(wallName, opts = {}) {
  if (!state.scene) return;

  const onlyUuids = (() => {
    const raw = opts?.furnitureLayoutOnlyUuids;
    if (raw == null || raw === '') return null;
    const arr = Array.isArray(raw) ? raw : [raw];
    const set = new Set(arr.map((u) => String(u || '')).filter(Boolean));
    return set.size ? set : null;
  })();
  const layoutUpdateOpts = onlyUuids ? { onlyUuids: [...onlyUuids] } : null;

  // НМ kitchen_base: шкафной transition stack не запускаем (kitchen-section-engine).
  {
    const sortedKitchen = _getFurnitureOnWallSorted(wallName);
    const focus = onlyUuids
      ? sortedKitchen.filter((g) => onlyUuids.has(String(g.uuid)))
      : sortedKitchen;
    const kitchenFocus =
      focus.length > 0 && focus.every((g) => isKitchenBaseGroup(g));
    const wallAllKitchen =
      sortedKitchen.length > 0 && sortedKitchen.every((g) => isKitchenBaseGroup(g));
    if (kitchenFocus || wallAllKitchen) {
      _txBranch = 'kitchen-section-engine';
      _kitchenNmSectionAfterPlace(wallName);
      return;
    }
  }

  // Place: ряд ниши без шкаф↔тумба — только fit нового шкафа (~60мс), не 200мс clear+planks+caps.
  // Исключение: standalone (тумба/комод) — нужен AutoTopCap / подрезка (§6.4.1), иначе топ не строится.
  if (onlyUuids && opts.placeLayoutOnly === true) {
    const sorted = _getFurnitureOnWallSorted(wallName);
    let needsCap = false;
    for (let i = 0; i < sorted.length - 1; i++) {
      if (_isHorizontalTallLowJunction(sorted[i], sorted[i + 1])) {
        needsCap = true;
        break;
      }
    }
    // kitchen_base mapped→standalone_floor, но это НЕ тумба с AutoTop/SideCap.
    const placedStandalone = sorted.some(
      (g) =>
        onlyUuids.has(String(g.uuid)) &&
        isLowFurniturePlacementKind(g.userData?.__placementKind) &&
        !isKitchenBaseGroup(g)
    );
    const placedKitchenOnly =
      sorted.some((g) => onlyUuids.has(String(g.uuid)) && isKitchenBaseGroup(g)) &&
      !placedStandalone;
    const placedHangHigh = sorted.some(
      (g) =>
        onlyUuids.has(String(g.uuid)) &&
        isWallHungHighPlacementKind(g.userData?.__placementKind)
    );
    // §6.7.2: шкаф|верхний навес (оба tall) — нужен SideCap fullH + gap 16, не fitOnly.
    let needsHangWardrobeCap = false;
    for (let i = 0; i < sorted.length - 1; i++) {
      if (_isHangWardrobeSideCapPair(sorted[i], sorted[i + 1])) {
        needsHangWardrobeCap = true;
        break;
      }
    }
    if (
      (!needsCap && !placedStandalone && !placedHangHigh && !needsHangWardrobeCap) ||
      (placedKitchenOnly && !needsCap && !needsHangWardrobeCap && !placedHangHigh)
    ) {
      // Place уже собрал и посадил шкаф/кухню. Без шкаф↔тумба / AutoTop / SideCap.
      _txBranch = placedKitchenOnly ? 'kitchen-fitOnly' : 'niche-fitOnly';
      _tx('lowSlots', () => _reapplyWindowLowSlotsOnWall(wallName));
      try {
        if (typeof window.__cldSyncWindowAlongEmptyFramesOnWall === 'function') {
          _tx('winFrames', () =>
            window.__cldSyncWindowAlongEmptyFramesOnWall(wallName, { ensureFrames: true })
          );
        }
      } catch (_) {}
      if (!placedKitchenOnly) {
        // Шаблоны обклада после пустой секции → прежний split/adjust (шкаф/тумба).
        _tx('splitPlanks', () => _splitHorizontalPlanksForWall(wallName));
        _tx('adjustTop', () => _adjustTopPlankForLowFurniture(wallName));
      } else {
        // Кухня: снять оставшиеся шкафные Side/Top с секций стены + transition caps.
        try {
          _clearAllTransitionsOnWall(wallName);
          const norm = String(wallName || '').trim().toLowerCase();
          const strip =
            typeof window !== 'undefined'
              ? window.__cldStripWardrobeSectionTrimForKitchen
              : null;
          if (typeof strip === 'function') {
            for (const sec of state.customSections || []) {
              if (!sec || (sec.wallName || '').toLowerCase() !== norm) continue;
              strip(sec);
            }
          }
        } catch (_) {}
      }
      return;
    }
    // Комод/тумба без шкаф↔тумба: lite (без Clodis×N) — и прямая, и окно.
    // Эксперимент Clodis×N у окна откатили: долгий призрак + белый обклад до декора.
    if (!needsCap && placedStandalone) {
      if (typeof window !== 'undefined' && window.__CLD_DEBUG_PLACE === true) {
        console.log('[TRANSITIONS] placeLayoutOnly standalone lite', wallName);
      }
      _txBranch = 'standalone-lite';
      if (typeof window.__clodisReconcileSectionSideTrimForWall === 'function') {
        try {
          _tx('sideTrim', () =>
            window.__clodisReconcileSectionSideTrimForWall(wallName, {
              skipFurnitureUpdate: true,
            })
          );
        } catch (e) {
          console.error('[TRANSITIONS] reconcile lite failed', e);
        }
      }
      _tx('overlaysSize', () => _ensureSideOverlaysSectionSize(wallName));
      _tx('clearAll', () => _clearAllTransitionsOnWall(wallName));
      _tx('sectionsLayout', () => _ensureWallSectionsLayout(wallName));
      _tx('splitPlanks', () => _splitHorizontalPlanksForWall(wallName));
      _tx('adjustTop', () => _adjustTopPlankForLowFurniture(wallName));
      const sortedLite = _tx('sorted', () => _getFurnitureOnWallSorted(wallName));
      // Фаза 4: межъячеечные стыки — только из plan в sync/applyTrimPlan (ниже).
      // Cross-cell sorted на окне запрещён.
      const windowRowLite = _wallHasWindowAlongLayout(wallName);
      for (let i = 0; i < sortedLite.length - 1; i++) {
        const a = sortedLite[i];
        const b = sortedLite[i + 1];
        const aSid = a.userData?.sectionId;
        const bSid = b.userData?.sectionId;
        if (
          windowRowLite &&
          aSid != null &&
          bSid != null &&
          String(aSid) !== String(bSid)
        ) {
          continue;
        }
    if (_isSameZoneCohabitPair(a, b)) continue;
    const ak = String(a.userData?.__placementKind || '');
    const bk = String(b.userData?.__placementKind || '');
        if (
          !isLowFurniturePlacementKind(ak) ||
          !isLowFurniturePlacementKind(bk)
        ) {
          continue;
        }
        const boxA = _furnitureBBox(a);
        const boxB = _furnitureBBox(b);
        if (boxA.isEmpty() || boxB.isEmpty()) continue;
        if (Math.abs(boxA.max.y - boxB.max.y) <= 2) continue;
        _buildHeightMismatchSideOverlay(
          a,
          b,
          wallName,
          `furn_${wallName}_${i}_${i + 1}`
        );
      }
      const mergedUuids = _tx('mergedCaps', () =>
        _buildMergedAutoTopCapsOnWall(wallName, sortedLite)
      );
      _tx('hangHighBottom', () =>
        _buildWallHungHighBottomCapsOnWall(wallName, sortedLite)
      );
      _tx('hangHighOpenSide', () =>
        _buildHangHighSideOverlaysVsAdjacentLowOnWall(wallName, sortedLite)
      );
      _tx('removeMerged', () => _removeTransitionTopCapsForMergedStandalones(mergedUuids));
      _tx('hideCatalogTops', () => _ensureCatalogTopsVisibleOnWall(wallName));
      _tx('lowSlots', () => _reapplyWindowLowSlotsOnWall(wallName));
      try {
        if (typeof window.__cldSyncWindowAlongEmptyFramesOnWall === 'function') {
          _tx('winFrames', () =>
            window.__cldSyncWindowAlongEmptyFramesOnWall(wallName, { ensureFrames: true })
          );
        }
      } catch (_) {}
      // §6.3 после ensureFrames: addSidePlanksIfNeeded всегда снимает и ставит SidePlank на fullH.
      _tx('adjustSide', () => _adjustSideOverlayForLowFurniture(wallName));
      return;
    }
  }

  _txBranch = 'full';
  if (typeof window.__clodisReconcileSectionSideTrimForWall === 'function') {
    try {
      _tx('sideTrim', () =>
        window.__clodisReconcileSectionSideTrimForWall(
          wallName,
          opts.placeLayoutOnly === true ? { skipFurnitureUpdate: true } : undefined
        )
      );
    } catch (e) {
      console.error('[TRANSITIONS] reconcileSectionSideTrim failed', e);
    }
  }
  _tx('overlaysSize', () => _ensureSideOverlaysSectionSize(wallName));

  _tx('clearAll', () => _clearAllTransitionsOnWall(wallName));

  const sorted = _tx('sorted', () => _getFurnitureOnWallSorted(wallName));

  if (typeof window !== 'undefined' && window.__CLD_DEBUG_PLACE === true) {
    console.log('[TRANSITIONS] wall:', wallName, 'furniture:', sorted.length,
      sorted.map((g, i) => ({
        i,
        pk: g.userData?.__placementKind || '?',
        x: Math.round(g.position.x),
      }))
    );
  }

  if (sorted.length === 0) {
    _txBranch = 'full-empty';
    _tx('sectionsLayout', () => _ensureWallSectionsLayout(wallName));
    _tx('splitPlanks', () => _splitHorizontalPlanksForWall(wallName));
    // Пустая секция с окном: tall-топы через тот же adjust, что у комода.
    _tx('adjustTop', () => _adjustTopPlankForLowFurniture(wallName));
    _tx('lowSlots', () => _reapplyWindowLowSlotsOnWall(wallName));
    try {
      if (typeof window.__cldSyncWindowAlongEmptyFramesOnWall === 'function') {
        _tx('winFrames', () =>
          window.__cldSyncWindowAlongEmptyFramesOnWall(wallName, { ensureFrames: true })
        );
      }
    } catch (_) {}
    _tx('adjustSide', () => _adjustSideOverlayForLowFurniture(wallName));
    return;
  }

  if (sorted.length < 2) {
    _txBranch = 'full-single';
    _tx('divisionCaps', () => _adjustDivisionPartSizeForCaps(wallName));
    _tx('sectionsLayout', () => _ensureWallSectionsLayout(wallName));
    if (sorted.length === 1 && sorted[0].userData?.sectionId) {
      const sec0 = state.customSections?.find((s) => s?.id === sorted[0].userData.sectionId);
      if (sec0 && typeof window.__clodisUpdateFurnitureInSection === 'function') {
        try {
          _tx('updateFurniture', () =>
            window.__clodisUpdateFurnitureInSection(sec0, layoutUpdateOpts || undefined)
          );
        } catch (_) {}
      }
      _tx('sectionsLayout', () => _ensureWallSectionsLayout(wallName));
    }
    _tx('splitPlanks', () => _splitHorizontalPlanksForWall(wallName));
    _tx('adjustTop', () => _adjustTopPlankForLowFurniture(wallName));
    const mergedUuids1 = _tx('mergedCaps', () =>
      _buildMergedAutoTopCapsOnWall(wallName, sorted)
    );
    _tx('hangHighBottom', () => _buildWallHungHighBottomCapsOnWall(wallName, sorted));
    _tx('hangHighOpenSide', () =>
      _buildHangHighSideOverlaysVsAdjacentLowOnWall(wallName, sorted)
    );
    _tx('removeMerged', () => _removeTransitionTopCapsForMergedStandalones(mergedUuids1));
    _tx('hideCatalogTops', () => _ensureCatalogTopsVisibleOnWall(wallName));
    _tx('lowSlots', () => _reapplyWindowLowSlotsOnWall(wallName));
    try {
      if (typeof window.__cldSyncWindowAlongEmptyFramesOnWall === 'function') {
        _tx('winFrames', () =>
          window.__cldSyncWindowAlongEmptyFramesOnWall(wallName, { ensureFrames: true })
        );
      }
    } catch (_) {}
    _tx('adjustSide', () => _adjustSideOverlayForLowFurniture(wallName));
    return;
  }

  // Count caps + build junction geometry.
  // Окно: межъячеечные стыки из plan (applyTrimPlan).
  // Прямая: SideCap пока imperative (hangward / tall↔low). Plan-apply 7b отключён —
  // cohabit24–25 ломали стык; gap 16 мм остаётся через classify в layout.
  const capsBySectionId = new Map(); // sectionId -> count
  const windowRowWall = _wallHasWindowAlongLayout(wallName);
  let windowRowJunctionActions = null;

  if (windowRowWall) {
    const collected = _tx('winJunctionCollect', () =>
      _collectWindowRowJunctionActions(wallName)
    );
    if (collected?.capsBySectionId) {
      for (const [sid, n] of collected.capsBySectionId) {
        capsBySectionId.set(sid, (capsBySectionId.get(sid) || 0) + n);
      }
    }
    windowRowJunctionActions = null;
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const leftGrp = sorted[i];
    const rightGrp = sorted[i + 1];
    const leftSid = leftGrp.userData?.sectionId;
    const rightSid = rightGrp.userData?.sectionId;
    if (
      windowRowWall &&
      leftSid != null &&
      rightSid != null &&
      String(leftSid) !== String(rightSid)
    ) {
      continue;
    }
    // tall|low (колонна→remap) или §6.7.2 hang|шкаф (оба tall) — gap 16 в layout.
    if (
      !_isHorizontalTallLowJunction(leftGrp, rightGrp) &&
      !_isHangWardrobeSideCapPair(leftGrp, rightGrp)
    ) {
      continue;
    }
    const bump = (sid) => {
      if (sid == null) return;
      const k = String(sid);
      capsBySectionId.set(k, (capsBySectionId.get(k) || 0) + 1);
    };
    bump(leftSid);
    bump(rightSid);
  }

  // CRITICAL: layout с cap-слотами до fit (gap из kinds, без меша SideCap).
  // SideCap/HM/TopCap — только после fit по layout cap этой пары.
  if (capsBySectionId.size > 0 && Array.isArray(state.customSections)) {
    _tx('capsLayout', () => {
      for (const [sid] of capsBySectionId) {
        const sec = state.customSections.find((s) => s?.id === sid);
        if (!sec) continue;
        if (typeof window.__clodisComputeSectionLayout === 'function') {
          try {
            window.__clodisComputeSectionLayout(sec);
          } catch (_) {}
        }
      }
    });
  }

  // Фаза 4: на окне стыки — после fit вместе с SideCap/HM/TopCap (ниже).
  const _pendingWindowRowJunctionActions = windowRowJunctionActions;

  // Fit мебели в зоны с учётом cap-gap в layout (меш SideCap ещё не нужен).
  {
    const sectionsToUpdate = new Set();
    if (capsBySectionId.size > 0) {
      for (const [sid] of capsBySectionId) sectionsToUpdate.add(sid);
    }
    if (Array.isArray(state.customSections)) {
      for (const grp of sorted) {
        if (grp.userData?.sectionId != null) sectionsToUpdate.add(grp.userData.sectionId);
      }
    }
    if (sectionsToUpdate.size > 0 && Array.isArray(state.customSections)) {
      const _tUpd0 = _txNow();
      let updated = 0;
      for (const sid of sectionsToUpdate) {
        const sec = state.customSections.find((s) => s?.id === sid);
        if (!sec) continue;
        if (typeof window.__clodisUpdateFurnitureInSection !== 'function') continue;
        try {
          const hasCap = (capsBySectionId.get(sid) || 0) > 0;
          if (onlyUuids && !hasCap) {
            const owns = sorted.some(
              (g) => onlyUuids.has(String(g.uuid)) && g.userData?.sectionId === sid
            );
            if (!owns) continue;
            window.__clodisUpdateFurnitureInSection(sec, { onlyUuids: [...onlyUuids] });
          } else {
            window.__clodisUpdateFurnitureInSection(sec);
          }
          updated += 1;
        } catch (_) {}
      }
      _txMarks.updateFurniture = Math.round(_txNow() - _tUpd0);
      _txMarks.updateFurnitureCount = updated;
    }
  }

  _tx('sectionsLayout', () => _ensureWallSectionsLayout(wallName));
  // №1/№3 по зонам ≤2750 мм (§6.6), затем §6.2 над низкой мебелью.
  _tx('splitPlanks', () => _splitHorizontalPlanksForWall(wallName));
  _tx('adjustTop', () => _adjustTopPlankForLowFurniture(wallName));

  // После fit: SideCap → HM → TopCap → AutoTop (все по актуальным bbox / layout cap пары).
  if (_pendingWindowRowJunctionActions) {
    _tx('winRowJunctions', () =>
      _buildWindowRowJunctionActions(_pendingWindowRowJunctionActions)
    );
  }
  const sortedAfterFit = _tx('sortedAfterFit', () => _getFurnitureOnWallSorted(wallName));
  const _tPairs0 = _txNow();
  for (let i = 0; i < sortedAfterFit.length - 1; i++) {
    const leftGrp = sortedAfterFit[i];
    const rightGrp = sortedAfterFit[i + 1];
    const leftSid = leftGrp.userData?.sectionId;
    const rightSid = rightGrp.userData?.sectionId;
    if (
      windowRowWall &&
      leftSid != null &&
      rightSid != null &&
      String(leftSid) !== String(rightSid)
    ) {
      continue;
    }
    const partners = _resolveHorizontalTallLowPartners(leftGrp, rightGrp);
    if (!partners) continue;
    // Навес как «высокий» ↔ комод: SideCap на навесе не ставим.
    if (isWallHungHighPlacementKind(partners.niche?.userData?.__placementKind)) {
      continue;
    }
    const key = `furn_${wallName}_${i}_${i + 1}`;

    // Сторона по U: низкий/навес слева от шкафа → левый торец шкафа.
    const useZ = _wallUsesZAxis(wallName);
    const nicheBox = _furnitureBBox(partners.niche);
    const standBox = _furnitureBBox(partners.standalone);
    let dresserSide = partners.dresserSide;
    if (!nicheBox.isEmpty() && !standBox.isEmpty()) {
      const nMid = useZ
        ? (nicheBox.min.z + nicheBox.max.z) / 2
        : (nicheBox.min.x + nicheBox.max.x) / 2;
      const sMid = useZ
        ? (standBox.min.z + standBox.max.z) / 2
        : (standBox.min.x + standBox.max.x) / 2;
      dresserSide = sMid < nMid ? 'left' : 'right';
    }

    // FullH от пола секции до верха шкафа (§6 шкаф↔низкий/навес) — не укорачивать.
    if (typeof window !== 'undefined' && window.__CLD_DEBUG_PLACE === true) {
      console.log('[TRANSITIONS] pair', i, '→', i + 1, {
        dresserSide,
        niche: partners.niche.userData?.__placementKind,
        stand: partners.standalone.userData?.__placementKind,
      });
    }
    _buildSideCapFromGroups(
      partners.niche,
      partners.standalone,
      dresserSide,
      wallName,
      key,
      null
    );
  }

  // Шкаф | верхний навес (оба tall): SideCap fullH на торце шкафа со стороны навеса.
  for (let i = 0; i < sortedAfterFit.length - 1; i++) {
    const a = sortedAfterFit[i];
    const b = sortedAfterFit[i + 1];
    if (!_isHangWardrobeSideCapPair(a, b)) continue;
    const aPk = String(a.userData?.__placementKind || '').trim();
    const aHang = isWallHungHighPlacementKind(aPk);
    const hangGrp = aHang ? a : b;
    const wardrobe = aHang ? b : a;
    // §6.8 A2: шкаф в спец угла — SideCap всё равно на нём (плечо ordinary).
    if (!_hangWardrobeSideCapAllowed(hangGrp, wardrobe)) continue;

    const useZ2 = _wallUsesZAxis(wallName);
    const hBox0 = _furnitureBBox(hangGrp);
    const wBox0 = _furnitureBBox(wardrobe);
    if (hBox0.isEmpty() || wBox0.isEmpty()) continue;
    const hMid = useZ2
      ? (hBox0.min.z + hBox0.max.z) / 2
      : (hBox0.min.x + hBox0.max.x) / 2;
    const wMid = useZ2
      ? (wBox0.min.z + wBox0.max.z) / 2
      : (wBox0.min.x + wBox0.max.x) / 2;
    const dresserSide = hMid < wMid ? 'left' : 'right';
    const key = `furn_${wallName}_hangward_${i}`;
    _buildSideCapFromGroups(wardrobe, hangGrp, dresserSide, wallName, key, null);
  }
  for (let i = 0; i < sortedAfterFit.length - 1; i++) {
    const leftGrp = sortedAfterFit[i];
    const rightGrp = sortedAfterFit[i + 1];
    const leftSid = leftGrp.userData?.sectionId;
    const rightSid = rightGrp.userData?.sectionId;
    if (
      windowRowWall &&
      leftSid != null &&
      rightSid != null &&
      String(leftSid) !== String(rightSid)
    ) {
      continue;
    }
    if (_isSameZoneCohabitPair(leftGrp, rightGrp)) continue;
    if (_resolveHorizontalTallLowPartners(leftGrp, rightGrp)) continue;
    const leftKind = String(leftGrp.userData?.__placementKind || PLACEMENT_KIND.FLOOR_IN_NICHE);
    const rightKind = String(rightGrp.userData?.__placementKind || PLACEMENT_KIND.FLOOR_IN_NICHE);
    const key = `furn_${wallName}_${i}_${i + 1}`;
    // Оба высокие (шкаф|верхний навес без низкого в ячейке) — не HeightMismatch.
    if (
      isTallFurniturePlacementKind(leftKind) &&
      isTallFurniturePlacementKind(rightKind)
    ) {
      continue;
    }
    _buildHeightMismatchSideOverlay(leftGrp, rightGrp, wallName, key);
  }
  for (let i = 0; i < sortedAfterFit.length - 1; i++) {
    const leftGrp = sortedAfterFit[i];
    const rightGrp = sortedAfterFit[i + 1];
    const leftSid = leftGrp.userData?.sectionId;
    const rightSid = rightGrp.userData?.sectionId;
    if (
      windowRowWall &&
      leftSid != null &&
      rightSid != null &&
      String(leftSid) !== String(rightSid)
    ) {
      continue;
    }
    const partners = _resolveHorizontalTallLowPartners(leftGrp, rightGrp);
    if (!partners) continue;
    const key = `furn_${wallName}_${i}_${i + 1}`;
    _buildTopCapFromGroups(
      partners.niche,
      partners.standalone,
      partners.dresserSide,
      wallName,
      key
    );
  }
  _txMarks.buildPairs = Math.round(_txNow() - _tPairs0);

  const mergedUuids = _tx('mergedCaps', () =>
    _buildMergedAutoTopCapsOnWall(wallName, sortedAfterFit)
  );
  _tx('hangHighBottom', () =>
    _buildWallHungHighBottomCapsOnWall(wallName, sortedAfterFit)
  );
  _tx('hangHighOpenSide', () =>
    _buildHangHighSideOverlaysVsAdjacentLowOnWall(wallName, sortedAfterFit)
  );
  _tx('removeMerged', () => _removeTransitionTopCapsForMergedStandalones(mergedUuids));
  _tx('hideCatalogTops', () => _ensureCatalogTopsVisibleOnWall(wallName));
  _tx('lowSlots', () => _reapplyWindowLowSlotsOnWall(wallName));
  try {
    if (typeof window.__cldSyncWindowAlongEmptyFramesOnWall === 'function') {
      _tx('winFrames', () =>
        window.__cldSyncWindowAlongEmptyFramesOnWall(wallName, { ensureFrames: true })
      );
    }
  } catch (_) {}
  // Вертикали (§6.3) — последним: ensureFrames → addSidePlanksIfNeeded на fullH.
  _tx('adjustSide', () => _adjustSideOverlayForLowFurniture(wallName));
}

/** Публично: горизонтальный стык tall↔low (не колонка base+upper). */
export function isHorizontalTallLowFurniturePair(a, b) {
  return _isHorizontalTallLowJunction(a, b);
}

/**
 * Count how many side-cap transitions are needed on a given wall.
 * Each tall ↔ low boundary = 1 cap (16 mm).
 */
export function getWallCapCount(wallName) {
  const sorted = _getFurnitureOnWallSorted(wallName);
  let count = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (_isHorizontalTallLowJunction(sorted[i], sorted[i + 1])) count++;
  }
  return count;
}

/**
 * Per-zone gap (mm) inserted BEFORE zone j (j >= 1) along the wall axis,
 * when a side cap sits between the previous zone and zone j.
 * Same section only; indices match furniture userData.zoneIndex on the right-hand item of each pair.
 */
export function getSectionZoneTransitionGaps(sectionId, wallName, parts) {
  const n = Math.max(0, Math.floor(Number(parts) || 0));
  const out = new Array(n).fill(0);
  if (!sectionId || n < 1) return out;

  // Primary: read from authoritative layout cache set by computeSectionLayout.
  const secData = Array.isArray(state.customSections)
    ? state.customSections.find((s) => s?.id === sectionId)
    : null;
  if (secData?._layoutCache?.segments?.length > 0) {
    for (const seg of secData._layoutCache.segments) {
      if (seg.type === 'cap' && typeof seg.dresserZoneIndex === 'number') {
        const zi = seg.dresserZoneIndex;
        if (zi >= 1 && zi < n) out[zi] = seg.endU - seg.startU; // = SIDE_CAP_W_MM
      }
    }
    return out;
  }

  // Fallback: position-based detection when cache is not yet built.
  // gap — перед zoneIndex правого модуля пары (не индекс в sorted[]).
  const sorted = _getFurnitureOnWallSorted(wallName).filter(
    (g) => g.userData?.sectionId === sectionId
  );
  for (let i = 0; i < sorted.length - 1; i++) {
    if (!_isHorizontalTallLowJunction(sorted[i], sorted[i + 1])) continue;
    const zi = Number(sorted[i + 1].userData?.zoneIndex);
    if (Number.isFinite(zi) && zi >= 1 && zi < n) out[zi] = SIDE_CAP_W_MM;
  }
  return out;
}

/** Sum of transition gaps before zone `zoneIndex` (zones 0..zoneIndex-1 boundaries). */
export function cumulativeTransitionGapMm(extraBeforeZone, zoneIndex) {
  let s = 0;
  const z = Math.max(0, Math.floor(Number(zoneIndex) || 0));
  for (let k = 1; k <= z && k < extraBeforeZone.length; k++) {
    s += Number(extraBeforeZone[k] || 0);
  }
  return s;
}

/**
 * Recalculate division.partSize for all sections on a given wall to account for
 * side caps between wardrobe/dresser transitions.
 * After changing partSize we defer a furniture-position update via window callback
 * (to avoid circular import with section-manager.js).
 */
function _adjustDivisionPartSizeForCaps(wallName, numCaps) {
  // No-op: partSize is NOT adjusted for caps.
  // The SideCap is a visual overlay; every zone keeps its full partSize = sectionWidth / parts.
}

let _rebuildTransitionsDepth = 0;
let _refreshDecorsAfterTransitionsScheduled = false;
let _pendingTransitionWalls = new Set();
let _pendingTransitionAll = false;
let _transitionScheduleRaf = 0;

function _transitionsDbg(...args) {
  if (typeof window !== 'undefined' && window.__CLD_DEBUG_PLACE === true) {
    try {
      console.log(...args);
    } catch (_) {}
  }
}

function _afterWallTransitionsRefresh(opts = {}) {
  const wallName = String(opts.wallName || '').trim();
  // Place fast-path: топы/обклад → IKEA+step5, но только по стене (не Soft по всей сцене).
  if (opts.placeLayoutOnly === true || opts.skipFurnitureDecorRefresh === true) {
    try {
      _refreshTransitionTrimLookAfterRebuild(wallName);
    } catch (_) {}
    try {
      if (opts.placeLayoutOnly !== true) {
        _reapplyVerticalTrimHeightsForAllWalls();
      }
    } catch (_) {}
    try {
      if (
        opts.skipFurnitureDecorRefresh === true &&
        typeof window !== 'undefined' &&
        typeof window.refreshTrimPartNumberLabels === 'function'
      ) {
        window.refreshTrimPartNumberLabels(state.scene);
      }
    } catch (_) {}
    try {
      if (typeof window !== 'undefined' && typeof window.__cldScheduleIkeaRoomLightSync === 'function') {
        window.__cldScheduleIkeaRoomLightSync();
      }
    } catch (_) {}
    return;
  }
  _scheduleRefreshFurnitureDecorsAfterTransitions();
  try {
    if (typeof window !== 'undefined' && typeof window.refreshTrimPartNumberLabels === 'function') {
      window.refreshTrimPartNumberLabels(state.scene);
    }
  } catch (_) {}
}

/**
 * IKEA-bind + декор «снаружи» на AutoTop/обклад.
 * Без syncIkeaRoomLightV0 (Soft) — его планирует _afterWallTransitionsRefresh один раз.
 */
function _refreshTransitionTrimLookAfterRebuild(wallName) {
  const norm = String(wallName || '').trim().toLowerCase();
  try {
    if (
      norm &&
      typeof window !== 'undefined' &&
      typeof window.__cldSyncSectionTrimStudioForWall === 'function'
    ) {
      window.__cldSyncSectionTrimStudioForWall(norm, { syncLight: false });
    } else if (typeof window !== 'undefined' && typeof window.__cldSyncAllSectionTrimStudio === 'function') {
      // Fallback: полный sync без Soft — патчим через forWall если есть.
      window.__cldSyncAllSectionTrimStudio(state.scene);
    }
  } catch (_) {}
  const reapplyOutside = () => {
    try {
      if (
        typeof window !== 'undefined' &&
        typeof window.__cldReapplyOutsideDecorToSectionTrimMeshes === 'function'
      ) {
        window.__cldReapplyOutsideDecorToSectionTrimMeshes();
      }
    } catch (_) {}
  };
  reapplyOutside();
  // После lite/ensureFrames + IKEA-bind планки сначала белые — повтор на следующем кадре
  // (когда уже есть selection «снаружи» и mesh в сцене).
  try {
    const raf =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame
        : (cb) => setTimeout(cb, 0);
    raf(() => reapplyOutside());
  } catch (_) {}
}

function _scheduleRefreshFurnitureDecorsAfterTransitions() {
  if (typeof window === 'undefined') return;
  if (_refreshDecorsAfterTransitionsScheduled) return;
  _refreshDecorsAfterTransitionsScheduled = true;
  requestAnimationFrame(() => {
    _refreshDecorsAfterTransitionsScheduled = false;
    (async () => {
      try {
        // Immediate: debounced refreshFurnitureDecors() возвращается до STEP5/TRIM-EDGE,
        // и _reapply до кромок бесполезен (потом resetTrimMeshPlain без флага).
        if (typeof window.refreshFurnitureDecorsImmediate === 'function') {
          await Promise.resolve(window.refreshFurnitureDecorsImmediate());
        } else if (typeof window.refreshFurnitureDecors === 'function') {
          await Promise.resolve(window.refreshFurnitureDecors());
        }
        _reapplyVerticalTrimHeightsForAllWalls();
      } catch (e) {
        console.error('[TRANSITIONS] refreshFurnitureDecors failed', e);
      }
    })();
  });
}

/**
 * Только одна стена — без clearAll по всей сцене (place / trim после габарита).
 * @param {string} wallName
 * @param {{ skipFurnitureDecorRefresh?: boolean }} [opts]
 */
export function rebuildTransitionsForWall(wallName, opts = {}) {
  const wall = String(wallName || '').trim();
  if (!wall) {
    rebuildAllTransitions();
    return;
  }
  if (_rebuildTransitionsDepth > 0) {
    scheduleRebuildTransitions({ wallName: wall });
    return;
  }
  _rebuildTransitionsDepth++;
  try {
    rebuildWallTransitions(wall, opts);
    _afterWallTransitionsRefresh({ ...opts, wallName: wall });
  } finally {
    _rebuildTransitionsDepth--;
  }
}

/** Coalesce: несколько вызовов за кадр → один flush (all или набор стен). */
export function scheduleRebuildTransitions(opts = {}) {
  const wall = opts.wallName != null ? String(opts.wallName).trim() : '';
  if (opts.all === true || !wall) _pendingTransitionAll = true;
  else _pendingTransitionWalls.add(wall);
  if (_transitionScheduleRaf) return;
  const raf =
    typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame
      : (cb) => setTimeout(cb, 0);
  _transitionScheduleRaf = raf(() => {
    _transitionScheduleRaf = 0;
    flushScheduledTransitions();
  });
}

export function flushScheduledTransitions() {
  if (_transitionScheduleRaf) {
    try {
      if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(_transitionScheduleRaf);
    } catch (_) {}
    _transitionScheduleRaf = 0;
  }
  const all = _pendingTransitionAll;
  const walls = [..._pendingTransitionWalls];
  _pendingTransitionAll = false;
  _pendingTransitionWalls.clear();
  if (all) {
    rebuildAllTransitions();
    return;
  }
  if (!walls.length) return;
  if (_rebuildTransitionsDepth > 0) {
    for (const w of walls) _pendingTransitionWalls.add(w);
    scheduleRebuildTransitions({ wallName: walls[0] });
    return;
  }
  _rebuildTransitionsDepth++;
  try {
    for (const w of walls) rebuildWallTransitions(w);
    _afterWallTransitionsRefresh();
  } finally {
    _rebuildTransitionsDepth--;
  }
}

export function isRebuildingTransitions() {
  return _rebuildTransitionsDepth > 0;
}

/**
 * Rebuild transitions for ALL walls.
 */
export function rebuildAllTransitions() {
  if (_rebuildTransitionsDepth > 0) {
    _pendingTransitionAll = true;
    scheduleRebuildTransitions({ all: true });
    return;
  }
  _rebuildTransitionsDepth++;
  try {
    // Hard reset to avoid stale caps/tops after furniture delete.
    clearAllTransitions();
    _clearLegacyTransitionResidue();

    // Also remove TopPlankSegments from section groups (they may not be in state.scene root).
    let segRemovedCount = 0;
    if (Array.isArray(state.customSections)) {
      for (const sec of state.customSections) {
        if (!sec?.group) continue;
        const staleSegments = [];
        sec.group.traverse((obj) => {
          if (obj?.userData?.isTopPlankSegment) staleSegments.push(obj);
        });
        for (const seg of staleSegments) {
          try {
            seg.geometry?.dispose();
          } catch (_) {}
          try {
            if (seg.material) {
              if (Array.isArray(seg.material))
                seg.material.forEach((m) => {
                  try {
                    m.dispose();
                  } catch (_) {}
                });
              else seg.material.dispose();
            }
          } catch (_) {}
          try {
            seg.parent?.remove(seg);
            segRemovedCount++;
          } catch (_) {}
        }
      }
    }
    _transitionsDbg('[TRANSITIONS] rebuildAllTransitions: segmentsRemoved=', segRemovedCount);

    for (const wallName of ['back', 'front', 'left', 'right']) {
      rebuildWallTransitions(wallName);
    }
    _afterWallTransitionsRefresh();
  } finally {
    _rebuildTransitionsDepth--;
  }
}

function _clearLegacyTransitionResidue() {
  if (!state.scene) return;
  const legacyNames = new Set([
    'TransitionSideCap',
    'TransitionTopCap',
    'TransitionAutoTopCap',
    'TransitionSideOverlayHeightMismatch',
    'TransitionTopPlankCover',
  ]);
  const toRemove = [];
  state.scene.traverse((obj) => {
    if (!obj) return;
    if (obj?.userData?.isTopPlankSegment) {
      toRemove.push(obj);
      return;
    }
    if (legacyNames.has(String(obj.name || ''))) {
      toRemove.push(obj);
    }
  });
  if (!toRemove.length) return;
  _transitionsDbg('[TRANSITIONS] legacyResidue: removing', toRemove.length, 'objects');
  for (const obj of toRemove) {
    try { if (obj.geometry) obj.geometry.dispose(); } catch (_) {}
    try {
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => { try { m.dispose(); } catch (_) {} });
        else obj.material.dispose();
      }
    } catch (_) {}
    try { obj.parent?.remove(obj); } catch (_) {}
  }
}

/**
 * Окно от обратного к комоду на прямой:
 * под проёмом max высота = sillMm (как высота комода), комода нет — условие то же.
 * TopPlank режет `_adjustTopPlankForLowFurniture`; здесь только AutoTop + SideCap.
 */
export function applyWindowAsLowSlotLikeStraightSection(sectionData) {
  if (!sectionData?.group || !state.scene || !state.room) return false;
  const slot = sectionData.windowLowSlot;
  if (!slot) return false;
  const notchA = Number(slot.notchAlongA);
  const notchB = Number(slot.notchAlongB);
  const sillMm = Number(slot.sillMm);
  const spanA = Number(sectionData.spanAlongA);
  const spanB = Number(sectionData.spanAlongB);
  const fullH = Number(sectionData.size?.y) || 0;
  if (
    !(notchB > notchA + 1) ||
    !(sillMm > 50) ||
    !(fullH > sillMm + 50) ||
    !(spanB > spanA + 1)
  ) {
    return false;
  }

  const wallName = sectionData.wallName || 'back';
  const useZ = _wallUsesZAxis(wallName);
  const transitionKey = `window-low-slot:${sectionData.id}`;
  const group = sectionData.group;
  const size = sectionData.size;
  const depthInto = useZ ? Number(size.x) || 600 : Number(size.z) || 600;

  // Убрать прошлые AutoTop/SideCap этого слота (TopPlankSegment — зона adjust).
  const stale = [];
  state.scene.traverse((obj) => {
    if (obj.userData?.transitionKey === transitionKey) stale.push(obj);
    if (
      obj.userData?.isSectionTransitionPart &&
      String(obj.userData?.sectionId) === String(sectionData.id) &&
      obj.userData?.windowLowSlotPart &&
      !obj.userData?.isTopPlankSegment
    ) {
      stale.push(obj);
    }
  });
  stale.forEach((obj) => {
    try {
      obj.geometry?.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose?.());
        else obj.material.dispose?.();
      }
      obj.parent?.remove(obj);
    } catch (_) {}
  });

  // Сплошной топ не восстанавливать на пустой секции.
  group.traverse((obj) => {
    if (obj.userData?.isTopPlank && !obj.userData?.isTopPlankSegment) {
      obj.visible = false;
      obj.userData.windowLowSlotHidden = true;
    }
  });

  const occ = _windowLowSlotOccupancy(sectionData);
  // С мебелью — только снять synthetic; SideCap/AutoTop строит обычный шкаф|комод / merge.
  if (!occ.empty) {
    return true;
  }

  const roomWorld = new THREE.Vector3();
  state.room.group.getWorldPosition(roomWorld);
  const secPos = group.position.clone();

  // Пустая секция: AutoTop на sill + SideCap на notch (каркас до первой мебели).
  const niche = depthInto;
  let minX;
  let maxX;
  let minZ;
  let maxZ;
  if (wallName === 'back') {
    minX = roomWorld.x + notchA;
    maxX = roomWorld.x + notchB;
    minZ = secPos.z;
    maxZ = secPos.z + niche;
  } else if (wallName === 'front') {
    minX = roomWorld.x + (state.room.width - notchB);
    maxX = roomWorld.x + (state.room.width - notchA);
    minZ = secPos.z - niche;
    maxZ = secPos.z;
  } else if (wallName === 'left') {
    minZ = roomWorld.z + (state.room.depth - notchB);
    maxZ = roomWorld.z + (state.room.depth - notchA);
    minX = secPos.x;
    maxX = secPos.x + niche;
  } else {
    minZ = roomWorld.z + notchA;
    maxZ = roomWorld.z + notchB;
    minX = secPos.x - niche;
    maxX = secPos.x;
  }
  _createAutoTopCapFromFootprint(
    {
      minX,
      maxX,
      minZ,
      maxZ,
      topY: (secPos.y || 0) + sillMm,
      h: sillMm,
      sectionId: sectionData.id,
    },
    wallName,
    transitionKey,
    { windowLowSlotPart: true }
  );
  state.scene.traverse((obj) => {
    if (
      obj.userData?.isTransitionAutoTopCap &&
      obj.userData?.transitionKey === `${transitionKey}_auto_top`
    ) {
      obj.userData.windowLowSlotPart = true;
      obj.userData.sectionId = sectionData.id;
    }
  });

  const addCap = (alongMm, towardLow) => {
    const capH = fullH;
    const capW = SIDE_CAP_W_MM;
    const centerAlong = alongMm + towardLow * (capW / 2);
    const geom = useZ
      ? new THREE.BoxGeometry(depthInto, capH, capW)
      : new THREE.BoxGeometry(capW, capH, depthInto);
    const mesh = new THREE.Mesh(geom, _makeMat());
    mesh.name = 'TransitionSideCap';
    _tagMesh(mesh, wallName, transitionKey, sectionData.id);
    _tagAsFacadeTrim(mesh, 'side', wallName);
    mesh.userData.isTransitionSideCap = true;
    mesh.userData.trimPartKey = 'transition_side_cap';
    mesh.userData.windowLowSlotPart = true;
    mesh.userData.isSectionTransitionPart = true;

    const centerY = (secPos.y || 0) + capH / 2;
    if (wallName === 'back') {
      mesh.position.set(roomWorld.x + centerAlong, centerY, secPos.z + depthInto / 2);
    } else if (wallName === 'front') {
      mesh.position.set(
        roomWorld.x + (state.room.width - centerAlong),
        centerY,
        secPos.z - depthInto / 2
      );
    } else if (wallName === 'left') {
      mesh.position.set(
        secPos.x + depthInto / 2,
        centerY,
        roomWorld.z + (state.room.depth - centerAlong)
      );
    } else {
      mesh.position.set(secPos.x - depthInto / 2, centerY, roomWorld.z + centerAlong);
    }
    state.scene.add(mesh);
  };
  addCap(notchA, +1);
  addCap(notchB, -1);

  return true;
}

/**
 * Remove all transition geometry from the scene.
 */
export function clearAllTransitions() {
  if (!state.scene) return;
  const toRemove = [];
  state.scene.traverse((obj) => {
    if (obj.userData?.isSectionTransitionPart) toRemove.push(obj);
  });
  _transitionsDbg(
    '[TRANSITIONS] clearAllTransitions: removing',
    toRemove.length,
    'objects',
    toRemove.map((o) => o.name || o.userData?.transitionKey || '?')
  );
  for (const obj of toRemove) {
    try { if (obj.geometry) obj.geometry.dispose(); } catch (_) {}
    try {
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => { try { m.dispose(); } catch (_) {} });
        else obj.material.dispose();
      }
    } catch (_) {}
    try { if (obj.parent) obj.parent.remove(obj); } catch (_) {}
  }
}

if (typeof window !== 'undefined') {
  window.__clodisRebuildAllTransitions = rebuildAllTransitions;
  window.__clodisRebuildTransitionsForWall = rebuildTransitionsForWall;
  window.__clodisScheduleRebuildTransitions = scheduleRebuildTransitions;
  window.__clodisFlushScheduledTransitions = flushScheduledTransitions;
  window.__clodisIsRebuildingTransitions = isRebuildingTransitions;
  window.__cldApplyWindowRowJunctionsFromPlan = applyWindowRowJunctionsFromPlan;
  window.__clodisReapplyVerticalTrimHeights = _reapplyVerticalTrimHeightsForAllWalls;
  window.__clodisFixSideOverlaySectionDepth = function __clodisFixSideOverlaySectionDepth(mesh) {
    if (!mesh?.isMesh) return false;
    const sec = _findSectionForTrimMesh(mesh);
    if (!sec) return false;
    return _fixSideOverlayMeshSectionSize(mesh, sec, sec.wallName || 'back');
  };
  window.__clodisClipVerticalTrimAtTumbaTops = function __clodisClipVerticalTrimAtTumbaTops(mesh) {
    if (!mesh?.isMesh) return false;
    const sec = _findSectionForTrimMesh(mesh);
    const wallName = sec?.wallName || mesh.userData?.wallName || 'back';
    return _clipVerticalTrimAtTumbaTops(mesh, sec, wallName, sec?.size?.y || 0);
  };
  /** Аудит бок↔бок / бок↔накладка без Basis. Порог 0.5 мм. */
  window.__cldAuditSideFlush = function __cldAuditSideFlush(epsMm = 0.5) {
    if (!state.scene || typeof THREE === 'undefined') return null;
    const eps = Number(epsMm) > 0 ? Number(epsMm) : 0.5;
    const issues = [];
    const furn = [];
    state.scene.traverse((o) => {
      if (!o?.isGroup || !o.userData?.isFurniture) return;
      if (o.userData.isGhost || o.userData.isGhostClodisPrebuild) return;
      const wall = String(o.userData.wallName || 'back').toLowerCase();
      const useZ = wall === 'left' || wall === 'right';
      const box = _furnitureBBox(o);
      if (box.isEmpty()) return;
      const uLo = useZ ? box.min.z : box.min.x;
      const uHi = useZ ? box.max.z : box.max.x;
      furn.push({
        uuid: o.uuid.slice(0, 8),
        wall,
        zi: o.userData.zoneIndex,
        pk: o.userData.__placementKind,
        sid: o.userData.sectionId,
        uLo,
        uHi,
      });
    });
    furn.sort((a, b) => a.uLo - b.uLo);
    for (let i = 0; i < furn.length - 1; i++) {
      const a = furn[i];
      const b = furn[i + 1];
      if (a.wall !== b.wall || String(a.sid) !== String(b.sid)) continue;
      const gap = b.uLo - a.uHi;
      const pairCap = isTallLowJunctionPair(a.pk, b.pk);
      const expect = pairCap ? SIDE_CAP_W_MM : 0;
      const d = gap - expect;
      if (Math.abs(d) > eps) {
        issues.push({
          type: 'module_gap',
          left: a.uuid,
          right: b.uuid,
          gap: +gap.toFixed(2),
          expect,
          delta: +d.toFixed(2),
        });
      }
    }
    state.scene.traverse((o) => {
      if (!o?.userData?.isTransitionSideCap && !o?.userData?.isTransitionHeightMismatch) return;
      const wall = String(o.userData.wallName || 'back').toLowerCase();
      const useZ = wall === 'left' || wall === 'right';
      try {
        o.updateMatrixWorld(true);
      } catch (_) {}
      const box = new THREE.Box3().setFromObject(o);
      if (box.isEmpty()) return;
      const oLo = useZ ? box.min.z : box.min.x;
      const oHi = useZ ? box.max.z : box.max.x;
      const onWall = furn.filter((f) => f.wall === wall);
      let left = null;
      let right = null;
      for (const f of onWall) {
        if (Math.abs(f.uHi - oLo) < 40) left = f;
        if (Math.abs(f.uLo - oHi) < 40) right = f;
      }
      if (o.userData.isTransitionSideCap) {
        if (left) {
          const g = oLo - left.uHi;
          if (Math.abs(g) > eps) {
            issues.push({
              type: 'sideCap_left',
              gap: +g.toFixed(2),
              mod: left.uuid,
              zi: left.zi,
            });
          }
        }
        if (right) {
          const g = right.uLo - oHi;
          if (Math.abs(g) > eps) {
            issues.push({
              type: 'sideCap_right',
              gap: +g.toFixed(2),
              mod: right.uuid,
              zi: right.zi,
            });
          }
        }
      }
      if (o.userData.isTransitionHeightMismatch) {
        const taller = String(o.userData.heightMismatch?.tallerUuid || '').slice(0, 8);
        const side = o.userData.heightMismatch?.side;
        const tallFurn = onWall.find((f) => f.uuid === taller);
        if (tallFurn && side === 'right') {
          const g = oLo - tallFurn.uHi;
          if (Math.abs(g) > eps) {
            issues.push({ type: 'hm_taller', side, gap: +g.toFixed(2), taller });
          }
        }
        if (tallFurn && side === 'left') {
          const g = tallFurn.uLo - oHi;
          if (Math.abs(g) > eps) {
            issues.push({ type: 'hm_taller', side, gap: +g.toFixed(2), taller });
          }
        }
      }
    });
    const report = { epsMm: eps, issueCount: issues.length, issues };
    console.log('[SIDE-AUDIT]', report);
    window.__cldLastSideAudit = report;
    return report;
  };
}
