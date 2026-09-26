/**
 * window-row-model.js — фаза 1 плана docs/WINDOW-ROW-ARCHITECTURE-PLAN.md
 *
 * Одна производная модель ряда у окна (нормализатор флагов + один обход сцены).
 * Пока только чтение + аудит: существующие потребители НЕ переключены.
 *
 * Позже: computeTrimPlan / applyTrimPlan (фазы 3–5).
 */
/* global THREE */
import { state } from '../utils/state.js';
import { PLACEMENT_KIND, isLowFurniturePlacementKind } from './vertical-layout.js';
import {
  classifyCapBetweenZones,
  zoneEffectiveCapRole,
  zonePlacementKinds,
} from './trim-junction-classify.js?v=20260923-cohabit38';

const ROLE_TALL_LEFT = 'tall-left';
const ROLE_UNDER = 'under-window';
const ROLE_TALL_RIGHT = 'tall-right';
const ROLES = new Set([ROLE_TALL_LEFT, ROLE_UNDER, ROLE_TALL_RIGHT]);

/** @type {Map<string, { rev: number, builtAt: number, state: object }>} */
const _cacheByWall = new Map();
let _sceneRev = 0;
/** Последний diff applyTrimPlan — фазы 3+; для аудита. */
let _lastTrimDiff = null;

export function bumpWindowRowSceneRev() {
  _sceneRev += 1;
  _cacheByWall.clear();
}

export function invalidateWindowRowStateCache(wallName) {
  if (wallName == null || wallName === '') {
    _cacheByWall.clear();
    return;
  }
  _cacheByWall.delete(String(wallName).trim().toLowerCase());
}

/**
 * Нормализатор ссылки на ряд (все поколения флагов → один вид).
 * @returns {{ rowId: string, role: string, sillMm: number } | null}
 */
export function getWindowRowRef(section) {
  if (!section) return null;

  const rowId = String(
    section.windowAlongWallGroupId ||
      section.windowBridgeGroupId ||
      (section.windowLowSlot ? `lowslot:${section.id}` : '') ||
      ''
  ).trim();

  let role = String(
    section.windowAlongWallRole || section.windowBridgeRole || ''
  ).trim();

  if (!ROLES.has(role)) {
    if (section.underWindowBay || Number(section.fixedHeightMm) > 0 || section.windowLowSlot) {
      role = ROLE_UNDER;
    } else if (!rowId) {
      return null;
    } else {
      // Есть groupId, роль неизвестна — всё равно ряд (аудит покажет role: '').
      role = '';
    }
  }

  if (!rowId && !role && !section.windowLowSlot && !section.underWindowBay) {
    return null;
  }

  const sillMm = _resolveSillMm(section);
  const id = rowId || `orphan:${section.id}`;
  return { rowId: id, role: role || ROLE_UNDER, sillMm };
}

function _resolveSillMm(section) {
  const slot = Number(section?.windowLowSlot?.sillMm);
  if (Number.isFinite(slot) && slot > 50) return Math.round(slot);
  const fixed = Number(section?.fixedHeightMm) || Number(section?.sillMm) || 0;
  if (fixed > 50) return Math.round(fixed);
  if (section?.underWindowBay || String(section?.windowAlongWallRole || '') === ROLE_UNDER) {
    const sy = Number(section?.size?.y) || 0;
    if (sy > 50) return Math.round(sy);
  }
  return 0;
}

function _wallUsesZ(wallName) {
  const w = String(wallName || '').toLowerCase();
  return w === 'left' || w === 'right';
}

/**
 * Единый фильтр мебели ряда (как transition-root, без петли/слота/ghost).
 */
function _isRowFurnitureRoot(obj) {
  if (!obj?.isGroup || !obj.userData?.isFurniture) return false;
  const ud = obj.userData;
  if (ud.isGhost || ud.isGhostClodisPrebuild) return false;
  if (ud.isEndCabinetSlot === true) return false;
  if (ud.isSectionTransitionPart || ud.isTopPlankSegment) return false;
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
  const nm = String(obj.name || '');
  if (nm.startsWith('Furniture_') && /присадк/i.test(nm)) return false;
  let p = obj.parent;
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

function _worldUSpanFromBox(box, useZ) {
  if (!box || box.isEmpty()) return { min: 0, max: 0 };
  return useZ
    ? { min: box.min.z, max: box.max.z }
    : { min: box.min.x, max: box.max.x };
}

function _furnitureBBox(grp) {
  try {
    grp.updateMatrixWorld(true);
    return new THREE.Box3().setFromObject(grp);
  } catch (_) {
    return new THREE.Box3();
  }
}

function _placementKind(ud) {
  return String(ud?.__placementKind || ud?.placementKind || PLACEMENT_KIND.FLOOR_IN_NICHE);
}

function _catalogType(ud) {
  const raw =
    ud?.catalogType ||
    ud?.catalogFolderId ||
    ud?.folderId ||
    ud?.productKind ||
    '';
  const s = String(raw || '').trim().replace(/^catalog_/, '');
  return s || null;
}

function _sectionWorldUSpan(sec, useZ) {
  if (!sec?.group) {
    const a = Number(sec?.spanAlongA);
    const b = Number(sec?.spanAlongB);
    if (Number.isFinite(a) && Number.isFinite(b) && b > a) return { min: a, max: b };
    return { min: 0, max: 0 };
  }
  try {
    sec.group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(sec.group);
    return _worldUSpanFromBox(box, useZ);
  } catch (_) {
    return { min: 0, max: 0 };
  }
}

/**
 * Зоны ячейки: из _layoutCache.segments или division.parts × partSize.
 */
function _buildZoneShells(sec, cellU, useZ) {
  const layout = sec?._layoutCache;
  const segs = Array.isArray(layout?.segments) ? layout.segments : null;
  if (segs && segs.length) {
    return segs.map((seg, index) => {
      const lo = Number(seg.startU ?? seg.uMin ?? seg.min);
      const hi = Number(seg.endU ?? seg.uMax ?? seg.max);
      return {
        index: Number.isFinite(Number(seg.zoneIndex)) ? Number(seg.zoneIndex) : index,
        uSpan: {
          min: Number.isFinite(lo) ? lo : cellU.min,
          max: Number.isFinite(hi) ? hi : cellU.max,
        },
        occupied: false,
        furnitureUuid: null,
        placementKind: null,
        topY: null,
      };
    });
  }

  const parts = Math.max(0, Math.floor(Number(sec?.division?.parts) || 0));
  const partSize = Number(sec?.division?.partSize) || 0;
  const start =
    Number(sec?.division?.sectionStart) ||
    (Number.isFinite(cellU.min) ? cellU.min : 0);

  if (parts > 0 && partSize > 10) {
    const zones = [];
    for (let i = 0; i < parts; i++) {
      const lo = start + i * partSize;
      const hi = lo + partSize;
      zones.push({
        index: i,
        uSpan: { min: lo, max: hi },
        occupied: false,
        furnitureUuid: null,
        furnitureUSpan: null,
        placementKind: null,
        topY: null,
      });
    }
    return zones;
  }

  // Одна «зона» = весь пролёт секции (parts=0).
  return [
    {
      index: 0,
      uSpan: { min: cellU.min, max: cellU.max },
      occupied: false,
      furnitureUuid: null,
      furnitureUSpan: null,
      placementKind: null,
      topY: null,
    },
  ];
}

function _uOverlap(a, b) {
  const lo = Math.max(a.min, b.min);
  const hi = Math.min(a.max, b.max);
  return hi - lo;
}

function _assignFurnitureToZones(zones, items) {
  for (const item of items) {
    const zi = item.zoneIndex;
    let zone = null;
    if (Number.isFinite(zi) && zi >= 0) {
      zone = zones.find((z) => z.index === zi) || null;
    }
    if (!zone) {
      let best = null;
      let bestOv = 0;
      for (const z of zones) {
        const ov = _uOverlap(z.uSpan, item.uSpan);
        if (ov > bestOv) {
          bestOv = ov;
          best = z;
        }
      }
      zone = bestOv > 15 ? best : null;
    }
    if (!zone) continue;

    if (!Array.isArray(zone.occupants)) zone.occupants = [];

    const fu = item.uSpan;
    let furnitureUSpan = null;
    if (fu && Number.isFinite(fu.min) && Number.isFinite(fu.max) && fu.max - fu.min > 10) {
      const lo = Math.max(zone.uSpan.min, fu.min);
      const hi = Math.min(zone.uSpan.max, fu.max);
      furnitureUSpan =
        hi - lo > 10 ? { min: lo, max: hi } : { min: fu.min, max: fu.max };
    }

    // Cohabit base+upper в одной зоне — оба жильца (не «оставить первого»).
    if (zone.occupied) {
      if (zone.occupants.length >= 2) continue;
      const already = zone.occupants.some((o) => o.uuid === item.uuid);
      if (already) continue;
      zone.occupants.push({
        uuid: item.uuid,
        placementKind: item.placementKind,
        topY: item.topY,
        furnitureUSpan,
      });
      if (!zone.cohabitPlacementKind) {
        zone.cohabitPlacementKind = item.placementKind;
        zone.cohabitFurnitureUuid = item.uuid;
      }
      if (item.topY != null && (zone.topY == null || item.topY > zone.topY)) {
        zone.topY = item.topY;
      }
      continue;
    }

    zone.occupied = true;
    zone.furnitureUuid = item.uuid;
    zone.placementKind = item.placementKind;
    zone.topY = item.topY;
    zone.furnitureUSpan = furnitureUSpan;
    zone.occupants.push({
      uuid: item.uuid,
      placementKind: item.placementKind,
      topY: item.topY,
      furnitureUSpan,
    });
  }
}

/**
 * Построить модель ряда на стене. Один traverse сцены.
 * @returns {object | null}
 */
export function buildWindowRowState(wallName, opts = {}) {
  const norm = String(wallName || '').trim().toLowerCase();
  if (!norm || !Array.isArray(state.customSections)) return null;

  const skipCache = opts.skipCache === true;
  if (!skipCache) {
    const hit = _cacheByWall.get(norm);
    if (hit && hit.rev === _sceneRev) return hit.state;
  }

  const t0 = performance.now();
  const useZ = _wallUsesZ(norm);

  // Секции ряда на этой стене (по getWindowRowRef).
  const rowSections = [];
  const rowIds = new Set();
  for (const sec of state.customSections) {
    if (!sec || String(sec.wallName || '').toLowerCase() !== norm) continue;
    const ref = getWindowRowRef(sec);
    if (!ref) continue;
    rowSections.push({ sec, ref });
    rowIds.add(ref.rowId);
  }
  if (!rowSections.length) return null;

  // Если на стене несколько rowId (редко) — берём самый частый / первый.
  let primaryRowId = [...rowIds][0];
  if (rowIds.size > 1) {
    const counts = new Map();
    for (const { ref } of rowSections) {
      counts.set(ref.rowId, (counts.get(ref.rowId) || 0) + 1);
    }
    let bestN = 0;
    for (const [id, n] of counts) {
      if (n > bestN) {
        bestN = n;
        primaryRowId = id;
      }
    }
  }

  const members = rowSections.filter((x) => x.ref.rowId === primaryRowId);
  let sillMm = 0;
  for (const { ref } of members) {
    if (ref.sillMm > sillMm) sillMm = ref.sillMm;
  }

  // Один обход: вся мебель стены.
  const wallFurniture = [];
  if (state.scene) {
    state.scene.traverse((obj) => {
      if (!_isRowFurnitureRoot(obj)) return;
      const fw = String(obj.userData?.wallName || '').trim().toLowerCase();
      if (fw && fw !== norm) return;
      const box = _furnitureBBox(obj);
      if (box.isEmpty()) return;
      const uSpan = _worldUSpanFromBox(box, useZ);
      const pk = _placementKind(obj.userData);
      wallFurniture.push({
        uuid: obj.uuid,
        sectionId: obj.userData?.sectionId != null ? String(obj.userData.sectionId) : null,
        zoneIndex:
          typeof obj.userData?.zoneIndex === 'number' ? obj.userData.zoneIndex : null,
        placementKind: pk,
        catalogType: _catalogType(obj.userData),
        customHeightMm: Number(obj.userData?.customHeightMm) || 0,
        topY: box.max.y,
        uSpan,
        midU: (uSpan.min + uSpan.max) / 2,
      });
    });
  }

  // Сортировка ячеек по U.
  const cells = members
    .map(({ sec, ref }) => {
      const cellU = _sectionWorldUSpan(sec, useZ);
      const zones = _buildZoneShells(sec, cellU, useZ);
      const inSec = wallFurniture.filter(
        (f) => f.sectionId != null && f.sectionId === String(sec.id)
      );
      // Fallback: мебель без sectionId, но U внутри ячейки.
      const byU = wallFurniture.filter((f) => {
        if (f.sectionId && f.sectionId === String(sec.id)) return false;
        const ov = _uOverlap(f.uSpan, cellU);
        return ov > 30;
      });
      _assignFurnitureToZones(zones, [...inSec, ...byU]);

      let hasWardrobe = false;
      let hasStandalone = false;
      for (const z of zones) {
        if (!z.occupied) continue;
        if (z.placementKind === PLACEMENT_KIND.STANDALONE_FLOOR) hasStandalone = true;
        else hasWardrobe = true;
      }
      // Также по сырому списку (на случай parts=0).
      for (const f of inSec) {
        if (f.placementKind === PLACEMENT_KIND.STANDALONE_FLOOR) hasStandalone = true;
        else hasWardrobe = true;
      }

      return {
        sectionId: sec.id,
        role: ref.role,
        uSpan: cellU,
        zones,
        hasWardrobe,
        hasStandalone,
        isEmpty: !zones.some((z) => z.occupied) && inSec.length === 0,
        fullHeightMm: Math.round(Number(sec.size?.y) || 0),
        _spanAlongA: Number(sec.spanAlongA) || cellU.min,
      };
    })
    .sort((a, b) => a._spanAlongA - b._spanAlongA || a.uSpan.min - b.uSpan.min);

  for (const c of cells) delete c._spanAlongA;

  // Высоты: одна область ряда.
  const byCatalogType = {};
  let rowStandaloneMm = 0;
  for (const f of wallFurniture) {
    if (f.placementKind !== PLACEMENT_KIND.STANDALONE_FLOOR) continue;
    const inRow = cells.some((c) => String(c.sectionId) === String(f.sectionId));
    if (!inRow) continue;
    const h =
      f.customHeightMm > 0
        ? f.customHeightMm
        : Math.round(Math.max(0, f.topY - (Number(state.room?.group?.position?.y) || 0)));
    if (h > 50 && h > rowStandaloneMm) rowStandaloneMm = h;
    if (f.catalogType) {
      const prev = byCatalogType[f.catalogType] || 0;
      if (h > prev) byCatalogType[f.catalogType] = h;
    }
  }
  // Map с секций (standaloneHeightsByCatalogType / floor).
  for (const { sec } of members) {
    const map = sec.standaloneHeightsByCatalogType;
    if (map && typeof map === 'object') {
      for (const [k, v] of Object.entries(map)) {
        const h = Math.round(Number(v) || 0);
        if (h > 50 && h > (byCatalogType[k] || 0)) byCatalogType[k] = h;
        if (h > rowStandaloneMm) rowStandaloneMm = h;
      }
    }
    const floor = Math.round(Number(sec.standaloneFloorHeightMm) || 0);
    if (floor > 50 && floor > rowStandaloneMm) rowStandaloneMm = floor;
  }
  if (!(rowStandaloneMm > 50) && sillMm > 50) rowStandaloneMm = sillMm;

  // Стыки: (1) между соседними ячейками ряда у окна; (2) между соседними зонами внутри ячейки.
  // Один словарь: classifyCapBetweenZones (tall↔low, колонна навеса = low).
  const junctions = [];
  const _pushZoneCapJunction = (leftCell, rightCell, zoneL, zoneR, u) => {
    const cap = classifyCapBetweenZones(zoneL, zoneR);
    if (!cap) return;
    const kindsL = zonePlacementKinds(zoneL);
    const kindsR = zonePlacementKinds(zoneR);
    const pickTallOcc = (zone) => {
      const occ = Array.isArray(zone.occupants) ? zone.occupants : [];
      const ward = occ.find((o) => {
        const pk = String(o?.placementKind || PLACEMENT_KIND.FLOOR_IN_NICHE).trim();
        return pk === PLACEMENT_KIND.FLOOR_IN_NICHE || pk === '';
      });
      if (ward) return ward;
      return occ[0] || { uuid: zone.furnitureUuid, placementKind: zone.placementKind };
    };
    const pickLowOcc = (zone) => {
      const occ = Array.isArray(zone.occupants) ? zone.occupants : [];
      const low = occ.find((o) => o && isLowFurniturePlacementKind(o.placementKind));
      return low || occ[0] || { uuid: zone.furnitureUuid, placementKind: zone.placementKind };
    };
    const leftIsTall = cap.leftRole === 'tall';
    const tallOcc = leftIsTall ? pickTallOcc(zoneL) : pickTallOcc(zoneR);
    const lowOcc = leftIsTall ? pickLowOcc(zoneR) : pickLowOcc(zoneL);
    junctions.push({
      leftCellId: leftCell.sectionId,
      rightCellId: rightCell.sectionId,
      leftRole: leftCell.role,
      rightRole: rightCell.role,
      leftZoneIndex: zoneL.index,
      rightZoneIndex: zoneR.index,
      u,
      dY: 0,
      needsOverlay: false,
      needsCap: true,
      capReason: cap.reason,
      dresserSide: cap.dresserSide,
      leftFurnitureUuid: zoneL.furnitureUuid || null,
      rightFurnitureUuid: zoneR.furnitureUuid || null,
      leftPlacementKind: kindsL[0] || null,
      rightPlacementKind: kindsR[0] || null,
      leftCohabitPk: kindsL[1] || null,
      rightCohabitPk: kindsR[1] || null,
      tallFurnitureUuid: tallOcc?.uuid || null,
      lowFurnitureUuid: lowOcc?.uuid || null,
    });
  };

  for (let i = 0; i < cells.length - 1; i++) {
    const left = cells[i];
    const right = cells[i + 1];
    const leftTops = left.zones.filter((z) => z.occupied && z.topY != null).map((z) => z.topY);
    const rightTops = right.zones.filter((z) => z.occupied && z.topY != null).map((z) => z.topY);
    const leftTop = leftTops.length ? Math.max(...leftTops) : null;
    const rightTop = rightTops.length ? Math.max(...rightTops) : null;
    const dY =
      leftTop != null && rightTop != null ? Math.round(rightTop - leftTop) : 0;

    const leftOcc = left.zones.filter((z) => z.occupied);
    const rightOcc = right.zones.filter((z) => z.occupied);
    const leftEdgeZ = leftOcc.length ? leftOcc[leftOcc.length - 1] : null;
    const rightEdgeZ = rightOcc.length ? rightOcc[0] : null;
    if (leftEdgeZ && rightEdgeZ) {
      _pushZoneCapJunction(
        left,
        right,
        leftEdgeZ,
        rightEdgeZ,
        (left.uSpan.max + right.uSpan.min) / 2
      );
    }

    // HeightMismatch только низкий↔низкий разной высоты (как раньше), без SideCap.
    const leftKinds = new Set(zonePlacementKinds(leftEdgeZ || {}));
    const rightKinds = new Set(zonePlacementKinds(rightEdgeZ || {}));
    const bothStandalone =
      leftKinds.has(PLACEMENT_KIND.STANDALONE_FLOOR) &&
      rightKinds.has(PLACEMENT_KIND.STANDALONE_FLOOR);
    const alreadyCap = junctions.some(
      (j) =>
        j.needsCap &&
        String(j.leftCellId) === String(left.sectionId) &&
        String(j.rightCellId) === String(right.sectionId) &&
        j.leftZoneIndex === leftEdgeZ?.index &&
        j.rightZoneIndex === rightEdgeZ?.index
    );
    if (
      !alreadyCap &&
      bothStandalone &&
      leftTop != null &&
      rightTop != null &&
      Math.abs(dY) > 2
    ) {
      junctions.push({
        leftCellId: left.sectionId,
        rightCellId: right.sectionId,
        leftRole: left.role,
        rightRole: right.role,
        u: (left.uSpan.max + right.uSpan.min) / 2,
        dY,
        needsOverlay: true,
        needsCap: false,
        leftFurnitureUuid: leftEdgeZ?.furnitureUuid || null,
        rightFurnitureUuid: rightEdgeZ?.furnitureUuid || null,
        leftPlacementKind: leftEdgeZ?.placementKind || null,
        rightPlacementKind: rightEdgeZ?.placementKind || null,
      });
    }
  }

  // Внутри каждой ячейки: стык соседних занятых зон (прямая с N зонами = главный случай).
  for (const cell of cells) {
    const occZones = (cell.zones || [])
      .filter((z) => z && z.occupied)
      .slice()
      .sort((a, b) => a.uSpan.min - b.uSpan.min || a.index - b.index);
    for (let i = 0; i < occZones.length - 1; i++) {
      const zL = occZones[i];
      const zR = occZones[i + 1];
      if (Math.abs(Number(zR.index) - Number(zL.index)) !== 1) {
        // Не обязательно index±1 если кастомные ширины — достаточно соседей по U.
        const gap = zR.uSpan.min - zL.uSpan.max;
        if (gap > 80) continue;
      }
      const u = (zL.uSpan.max + zR.uSpan.min) / 2;
      _pushZoneCapJunction(cell, cell, zL, zR, u);
    }
  }

  void zoneEffectiveCapRole;

  const hasWardrobe = cells.some((c) => c.hasWardrobe);
  const hasAnyFurniture = cells.some((c) => !c.isEmpty);
  const allLow =
    hasAnyFurniture &&
    !hasWardrobe &&
    cells.every((c) => c.isEmpty || c.hasStandalone);

  const rowState = {
    rowId: primaryRowId,
    wallName: norm,
    sillMm,
    cells,
    heights: { rowStandaloneMm, byCatalogType },
    junctions,
    flags: {
      hasWardrobe,
      allLow,
      empty: !hasAnyFurniture,
      ordinaryStraight: false,
    },
    _meta: {
      buildMs: Math.round((performance.now() - t0) * 10) / 10,
      sceneRev: _sceneRev,
      furnitureOnWall: wallFurniture.length,
    },
  };

  if (!skipCache) {
    _cacheByWall.set(norm, { rev: _sceneRev, builtAt: performance.now(), state: rowState });
  }
  return rowState;
}

/**
 * Фаза 7b: прямые секции на стене (без окна/L) — тот же RowState, 1 пролёт на секцию.
 * Стыки zone↔zone внутри секции + на границах секций — classifyCapBetweenZones.
 */
export function buildStraightWallRowState(wallName, opts = {}) {
  const norm = String(wallName || '').trim().toLowerCase();
  if (!norm || !Array.isArray(state.customSections)) return null;

  const skipCache = opts.skipCache === true;
  const cacheKey = `straight:${norm}`;
  if (!skipCache) {
    const hit = _cacheByWall.get(cacheKey);
    if (hit && hit.rev === _sceneRev) return hit.state;
  }

  const t0 = performance.now();
  const useZ = _wallUsesZ(norm);

  const members = [];
  for (const sec of state.customSections) {
    if (!sec || String(sec.wallName || '').toLowerCase() !== norm) continue;
    if (sec.lShape) continue;
    if (getWindowRowRef(sec)) continue;
    members.push(sec);
  }
  if (!members.length) return null;

  const wallFurniture = [];
  if (state.scene) {
    state.scene.traverse((obj) => {
      if (!_isRowFurnitureRoot(obj)) return;
      const fw = String(obj.userData?.wallName || '').trim().toLowerCase();
      if (fw && fw !== norm) return;
      const box = _furnitureBBox(obj);
      if (box.isEmpty()) return;
      const uSpan = _worldUSpanFromBox(box, useZ);
      const pk = _placementKind(obj.userData);
      wallFurniture.push({
        uuid: obj.uuid,
        sectionId: obj.userData?.sectionId != null ? String(obj.userData.sectionId) : null,
        zoneIndex:
          typeof obj.userData?.zoneIndex === 'number' ? obj.userData.zoneIndex : null,
        placementKind: pk,
        catalogType: _catalogType(obj.userData),
        customHeightMm: Number(obj.userData?.customHeightMm) || 0,
        topY: box.max.y,
        uSpan,
        midU: (uSpan.min + uSpan.max) / 2,
      });
    });
  }

  const cells = members
    .map((sec) => {
      const cellU = _sectionWorldUSpan(sec, useZ);
      const zones = _buildZoneShells(sec, cellU, useZ);
      const inSec = wallFurniture.filter(
        (f) => f.sectionId != null && f.sectionId === String(sec.id)
      );
      _assignFurnitureToZones(zones, inSec);

      let hasWardrobe = false;
      let hasStandalone = false;
      for (const z of zones) {
        if (!z.occupied) continue;
        for (const pk of zonePlacementKinds(z)) {
          if (pk === PLACEMENT_KIND.STANDALONE_FLOOR || pk === PLACEMENT_KIND.WALL_HUNG_LOW) {
            hasStandalone = true;
          } else {
            hasWardrobe = true;
          }
        }
      }

      return {
        sectionId: sec.id,
        role: 'straight',
        uSpan: cellU,
        zones,
        hasWardrobe,
        hasStandalone,
        isEmpty: !zones.some((z) => z.occupied) && inSec.length === 0,
        fullHeightMm: Math.round(Number(sec.size?.y) || 0),
        _spanAlongA: Number(sec.spanAlongA) || cellU.min,
      };
    })
    .sort((a, b) => a._spanAlongA - b._spanAlongA || a.uSpan.min - b.uSpan.min);

  for (const c of cells) delete c._spanAlongA;

  const junctions = [];
  const _push = (leftCell, rightCell, zoneL, zoneR, u) => {
    const cap = classifyCapBetweenZones(zoneL, zoneR);
    if (!cap) return;
    const kindsL = zonePlacementKinds(zoneL);
    const kindsR = zonePlacementKinds(zoneR);
    const pickTallOcc = (zone) => {
      const occ = Array.isArray(zone.occupants) ? zone.occupants : [];
      const ward = occ.find((o) => {
        const pk = String(o?.placementKind || PLACEMENT_KIND.FLOOR_IN_NICHE).trim();
        return pk === PLACEMENT_KIND.FLOOR_IN_NICHE || pk === '';
      });
      return ward || occ[0] || { uuid: zone.furnitureUuid, placementKind: zone.placementKind };
    };
    const pickLowOcc = (zone) => {
      const occ = Array.isArray(zone.occupants) ? zone.occupants : [];
      const low = occ.find((o) => o && isLowFurniturePlacementKind(o.placementKind));
      return low || occ[0] || { uuid: zone.furnitureUuid, placementKind: zone.placementKind };
    };
    const leftIsTall = cap.leftRole === 'tall';
    const tallOcc = leftIsTall ? pickTallOcc(zoneL) : pickTallOcc(zoneR);
    const lowOcc = leftIsTall ? pickLowOcc(zoneR) : pickLowOcc(zoneL);
    junctions.push({
      leftCellId: leftCell.sectionId,
      rightCellId: rightCell.sectionId,
      leftRole: 'straight',
      rightRole: 'straight',
      leftZoneIndex: zoneL.index,
      rightZoneIndex: zoneR.index,
      u,
      dY: 0,
      needsOverlay: false,
      needsCap: true,
      capReason: cap.reason,
      dresserSide: cap.dresserSide,
      leftFurnitureUuid: zoneL.furnitureUuid || null,
      rightFurnitureUuid: zoneR.furnitureUuid || null,
      leftPlacementKind: kindsL[0] || null,
      rightPlacementKind: kindsR[0] || null,
      leftCohabitPk: kindsL[1] || null,
      rightCohabitPk: kindsR[1] || null,
      tallFurnitureUuid: tallOcc?.uuid || null,
      lowFurnitureUuid: lowOcc?.uuid || null,
    });
  };

  for (const cell of cells) {
    const occZones = (cell.zones || [])
      .filter((z) => z && z.occupied)
      .slice()
      .sort((a, b) => a.uSpan.min - b.uSpan.min || a.index - b.index);
    for (let i = 0; i < occZones.length - 1; i++) {
      const zL = occZones[i];
      const zR = occZones[i + 1];
      const gap = zR.uSpan.min - zL.uSpan.max;
      if (gap > 80 && Math.abs(Number(zR.index) - Number(zL.index)) !== 1) continue;
      _push(cell, cell, zL, zR, (zL.uSpan.max + zR.uSpan.min) / 2);
    }
  }

  for (let i = 0; i < cells.length - 1; i++) {
    const left = cells[i];
    const right = cells[i + 1];
    const leftOcc = left.zones.filter((z) => z.occupied);
    const rightOcc = right.zones.filter((z) => z.occupied);
    const zL = leftOcc.length ? leftOcc[leftOcc.length - 1] : null;
    const zR = rightOcc.length ? rightOcc[0] : null;
    if (!zL || !zR) continue;
    _push(left, right, zL, zR, (left.uSpan.max + right.uSpan.min) / 2);
  }

  const hasWardrobe = cells.some((c) => c.hasWardrobe);
  const hasAnyFurniture = cells.some((c) => !c.isEmpty);
  const rowState = {
    rowId: `straight:${norm}`,
    wallName: norm,
    sillMm: 0,
    cells,
    heights: { rowStandaloneMm: 0, byCatalogType: {} },
    junctions,
    flags: {
      hasWardrobe,
      allLow: hasAnyFurniture && !hasWardrobe,
      empty: !hasAnyFurniture,
      ordinaryStraight: true,
    },
    _meta: {
      buildMs: Math.round((performance.now() - t0) * 10) / 10,
      sceneRev: _sceneRev,
      furnitureOnWall: wallFurniture.length,
    },
  };

  if (!skipCache) {
    _cacheByWall.set(cacheKey, { rev: _sceneRev, builtAt: performance.now(), state: rowState });
  }
  return rowState;
}

/** Заглушка фазы 3 — заменена ниже. */
export function computeTrimPlan(rowState) {
  if (!rowState || !Array.isArray(rowState.cells)) return [];
  const plan = [];
  const sill = Math.round(Number(rowState.sillMm) || 0);
  const rowH = Math.round(Number(rowState.heights?.rowStandaloneMm) || sill || 0);
  const dresserSideH = rowH > 50 ? rowH : sill > 50 ? sill : 0;
  const wall = String(rowState.wallName || 'back').toLowerCase();
  const overlayTh = 16;

  for (const cell of rowState.cells) {
    if (!cell || cell.isEmpty) continue;
    const cellId = cell.sectionId;
    const role = String(cell.role || '');
    const zones = Array.isArray(cell.zones) ? cell.zones : [];
    const occupied = zones.filter((z) => z && z.occupied);
    const fullH =
      Math.round(Number(cell.fullHeightMm) || 0) > 50
        ? Math.round(Number(cell.fullHeightMm))
        : dresserSideH;
    // Шкаф → вертикаль до потолка секции; только комоды → высота ряда (подоконник).
    const vertH = cell.hasWardrobe && fullH > 50 ? fullH : dresserSideH;

    // Цоколь: только под занятым участком мебели (не под всю зону, если зона шире модуля).
    let runStart = null;
    let runUMin = null;
    let runUMax = null;
    const zoneOccU = (z) => {
      const fu = z?.furnitureUSpan;
      if (fu && Number.isFinite(fu.min) && Number.isFinite(fu.max) && fu.max - fu.min > 10) {
        return { min: fu.min, max: fu.max };
      }
      return z?.uSpan || null;
    };
    const flushPlinth = (fromZ, toZ, uMin, uMax) => {
      if (!fromZ || !toZ) return;
      if (!(uMax - uMin > 5)) return;
      plan.push({
        key: `plinth:${cellId}:${fromZ.index}-${toZ.index}`,
        kind: 'plinth',
        cellId,
        role,
        uSpan: { min: uMin, max: uMax },
        yFrom: 0,
        yTo: 100,
        thicknessMm: 16,
        side: null,
      });
    };
    for (let i = 0; i < zones.length; i++) {
      const z = zones[i];
      if (z?.occupied) {
        const u = zoneOccU(z);
        if (!runStart) {
          runStart = z;
          runUMin = u.min;
          runUMax = u.max;
        } else {
          runUMin = Math.min(runUMin, u.min);
          runUMax = Math.max(runUMax, u.max);
        }
      } else if (runStart) {
        flushPlinth(runStart, zones[i - 1], runUMin, runUMax);
        runStart = null;
        runUMin = null;
        runUMax = null;
      }
    }
    if (runStart) flushPlinth(runStart, zones[zones.length - 1], runUMin, runUMax);

    // Потолочный TopPlank — только над шкафом (занятый участок), не на пустой хвост ячейки.
    if (cell.hasWardrobe) {
      let topUMin = null;
      let topUMax = null;
      for (const z of occupied) {
        if (z.placementKind === PLACEMENT_KIND.STANDALONE_FLOOR) continue;
        const u = zoneOccU(z);
        if (!u) continue;
        topUMin = topUMin == null ? u.min : Math.min(topUMin, u.min);
        topUMax = topUMax == null ? u.max : Math.max(topUMax, u.max);
      }
      if (topUMin == null || topUMax == null || !(topUMax - topUMin > 5)) {
        topUMin = cell.uSpan.min;
        topUMax = cell.uSpan.max;
      }
      plan.push({
        key: `topPlank:${cellId}`,
        kind: 'topPlank',
        cellId,
        role,
        uSpan: { min: topUMin, max: topUMax },
        yFrom: null,
        yTo: null,
        thicknessMm: 16,
        side: null,
      });
    }

    // Боковины: under-window — нет (низкая ниша).
    // tall-left / tall-right: «у края» по U мебели, не по ширине пустой зоны.
    if (role === 'under-window') {
      // только цоколь (+ autoTop — не фаза 3)
    } else if (role === 'tall-left' || role === 'tall-right') {
      if (!(vertH > 0)) continue;
      const firstOcc = occupied[0];
      const lastOcc = occupied[occupied.length - 1];
      const firstU = zoneOccU(firstOcc);
      const lastU = zoneOccU(lastOcc);
      const nearLeft =
        firstU &&
        Math.abs(firstU.min - cell.uSpan.min) <
          Math.max(40, (firstU.max - firstU.min) * 0.55);
      const nearRight =
        lastU &&
        Math.abs(cell.uSpan.max - lastU.max) <
          Math.max(40, (lastU.max - lastU.min) * 0.55);

      const wallSide = role === 'tall-left' ? 'left' : 'right';
      const junctionSide = role === 'tall-left' ? 'right' : 'left';
      const wallNear = wallSide === 'left' ? nearLeft : nearRight;

      if (wallNear) {
        plan.push({
          key: `sidePlank:${cellId}:${wallSide}`,
          kind: 'sidePlank',
          cellId,
          role,
          uSpan: { ...cell.uSpan },
          yFrom: 0,
          yTo: vertH,
          thicknessMm: 50,
          side: wallSide,
        });
      }
      if (cell.hasWardrobe) {
        plan.push({
          key: `sideOverlay:${cellId}:${junctionSide}`,
          kind: 'sideOverlay',
          cellId,
          role,
          uSpan: { ...cell.uSpan },
          yFrom: 0,
          yTo: vertH,
          thicknessMm: overlayTh,
          side: junctionSide,
        });
      }
    } else if (vertH > 0 && occupied.length) {
      plan.push({
        key: `sidePlank:${cellId}:left`,
        kind: 'sidePlank',
        cellId,
        role,
        uSpan: { ...cell.uSpan },
        yFrom: 0,
        yTo: vertH,
        thicknessMm: 50,
        side: 'left',
      });
      plan.push({
        key: `sidePlank:${cellId}:right`,
        kind: 'sidePlank',
        cellId,
        role,
        uSpan: { ...cell.uSpan },
        yFrom: 0,
        yTo: vertH,
        thicknessMm: 50,
        side: 'right',
      });
    }
  }

  // Opus §1: средняя тянется к боковым — топ и цоколь доходят до накладок высоких.
  _stretchUnderWindowHorizontalToTallOverlays(plan, rowState);

  // Фаза 4 (уже в модели): стыки — в плане для аудита; apply фазы 3 их не строит.
  const junctions = Array.isArray(rowState.junctions) ? rowState.junctions : [];
  for (const j of junctions) {
    if (!j) continue;
    if (j.needsOverlay && Math.abs(Number(j.dY) || 0) > 2) {
      plan.push({
        key: `heightMismatch:${j.leftCellId}:${j.rightCellId}`,
        kind: 'heightMismatch',
        cellId: j.leftCellId,
        role: `${j.leftRole}|${j.rightRole}`,
        uSpan: { min: j.u, max: j.u },
        yFrom: 0,
        yTo: Math.abs(Number(j.dY) || 0),
        thicknessMm: 16,
        side: null,
        leftFurnitureUuid: j.leftFurnitureUuid,
        rightFurnitureUuid: j.rightFurnitureUuid,
        dY: j.dY,
      });
    }
    if (j.needsCap) {
      plan.push({
        key: `cap:${j.leftCellId}:${j.rightCellId}:z${j.leftZoneIndex ?? 'x'}_${j.rightZoneIndex ?? 'x'}`,
        kind: 'cap',
        cellId: j.leftCellId,
        role: `${j.leftRole}|${j.rightRole}`,
        uSpan: { min: j.u, max: j.u },
        yFrom: 0,
        yTo: null,
        thicknessMm: 16,
        side: j.dresserSide || null,
        leftFurnitureUuid: j.leftFurnitureUuid,
        rightFurnitureUuid: j.rightFurnitureUuid,
        leftPlacementKind: j.leftPlacementKind,
        rightPlacementKind: j.rightPlacementKind,
        leftCohabitPk: j.leftCohabitPk || null,
        rightCohabitPk: j.rightCohabitPk || null,
        tallFurnitureUuid: j.tallFurnitureUuid || null,
        lowFurnitureUuid: j.lowFurnitureUuid || null,
        dresserSide: j.dresserSide || null,
        capReason: j.capReason || null,
      });
    }
  }

  void wall;
  return plan;
}

/**
 * Если у tall есть sideOverlay на стыке с окном — цоколь/топ under-window
 * дотягиваются до края средней ячейки (к накладке).
 */
function _stretchUnderWindowHorizontalToTallOverlays(plan, rowState) {
  if (!Array.isArray(plan) || !rowState?.cells) return;
  const under = rowState.cells.find((c) => String(c.role) === 'under-window');
  if (!under || under.isEmpty) return;
  const underId = String(under.sectionId);

  const leftOverlay = plan.some(
    (p) =>
      p &&
      p.kind === 'sideOverlay' &&
      p.side === 'right' &&
      String(p.role) === 'tall-left'
  );
  const rightOverlay = plan.some(
    (p) =>
      p &&
      p.kind === 'sideOverlay' &&
      p.side === 'left' &&
      String(p.role) === 'tall-right'
  );
  if (!leftOverlay && !rightOverlay) return;

  for (const kind of ['plinth', 'topPlank']) {
    const idxs = [];
    for (let i = 0; i < plan.length; i++) {
      if (plan[i] && plan[i].kind === kind && String(plan[i].cellId) === underId) {
        idxs.push(i);
      }
    }
    if (!idxs.length) continue;
    let uMin = Math.min(...idxs.map((i) => Number(plan[i].uSpan?.min)));
    let uMax = Math.max(...idxs.map((i) => Number(plan[i].uSpan?.max)));
    if (leftOverlay) uMin = Math.min(uMin, under.uSpan.min);
    if (rightOverlay) uMax = Math.max(uMax, under.uSpan.max);
    if (!(uMax - uMin > 5)) continue;
    const template = plan[idxs[0]];
    for (let k = idxs.length - 1; k >= 0; k--) plan.splice(idxs[k], 1);
    plan.push({
      ...template,
      key: `${kind}:${underId}:stretch`,
      uSpan: { min: uMin, max: uMax },
    });
  }
}

export function getLastWindowRowTrimDiff() {
  return _lastTrimDiff;
}

export function setLastWindowRowTrimDiff(diff) {
  _lastTrimDiff = diff;
}

/**
 * Модель ряда для секции (или null, если не ряд у окна).
 */
export function getWindowRowStateForSection(sectionData) {
  const ref = getWindowRowRef(sectionData);
  if (!ref || !sectionData) return null;
  const wall = String(sectionData.wallName || 'back').trim().toLowerCase() || 'back';
  const row = buildWindowRowState(wall);
  if (!row) return null;
  const sid = String(sectionData.id);
  const inCells = (row.cells || []).some((c) => String(c.sectionId) === sid);
  if (!inCells && String(row.rowId) !== String(ref.rowId)) return null;
  return row;
}

/** Подоконник / макс. высота комода в ряду (мм). */
export function getWindowRowSillMm(sectionData) {
  const row = getWindowRowStateForSection(sectionData);
  if (row?.sillMm > 50) return Math.round(row.sillMm);
  const ref = getWindowRowRef(sectionData);
  return ref?.sillMm > 50 ? Math.round(ref.sillMm) : 0;
}

/**
 * Высота уже стоящих комодов в ряду (мм).
 * catalogType — предпочтительно map этого каталога, иначе общая высота ряда.
 */
export function getWindowRowStandaloneHeightMm(sectionData, catalogType) {
  const row = getWindowRowStateForSection(sectionData);
  if (!row) return 0;
  if (catalogType) {
    const h = Number(row.heights?.byCatalogType?.[String(catalogType)]);
    if (Number.isFinite(h) && h > 50) return Math.round(h);
  }
  const rowH = Number(row.heights?.rowStandaloneMm);
  return Number.isFinite(rowH) && rowH > 50 ? Math.round(rowH) : 0;
}

/**
 * Высота для place/призрака у окна: ряд → sill → 0.
 * Не поднимает выше sill (clamp снаружи).
 */
export function resolveWindowRowPlaceHeightMm(sectionData, catalogType, ownHeightMm) {
  if (!getWindowRowRef(sectionData)) return 0;
  const sill = getWindowRowSillMm(sectionData);
  const existing = getWindowRowStandaloneHeightMm(sectionData, catalogType);
  let h = 0;
  // Старый ряд ниже подоконника — поднимаем к sill.
  if (existing > 0 && sill > 0 && existing < sill - 5) h = sill;
  else if (existing > 0) h = existing;
  else if (sill > 0) h = sill;
  else h = Math.round(Number(ownHeightMm) || 0);
  if (sill > 0 && h > sill) h = sill;
  return h > 0 ? h : 0;
}

/**
 * Аудит в консоль: модель + (позже) plan/diff.
 * @returns {object | null}
 */
export function auditWindowRow(wallName) {
  const norm = String(wallName || 'back').trim().toLowerCase();
  bumpWindowRowSceneRev(); // свежий снимок для аудита
  const t0 = performance.now();
  const rowState = buildWindowRowState(norm, { skipCache: true });
  const totalMs = Math.round((performance.now() - t0) * 10) / 10;
  const plan = rowState ? computeTrimPlan(rowState) : null;
  const out = {
    wallName: norm,
    ok: !!rowState,
    buildMs: rowState?._meta?.buildMs ?? totalMs,
    totalMs,
    under15ms: (rowState?._meta?.buildMs ?? totalMs) < 15,
    cells: rowState?.cells?.length ?? 0,
    roles: (rowState?.cells || []).map((c) => c.role),
    sillMm: rowState?.sillMm ?? 0,
    heights: rowState?.heights ?? null,
    flags: rowState?.flags ?? null,
    junctions: rowState?.junctions ?? [],
    zonesOccupied: (rowState?.cells || []).map((c) => ({
      sectionId: c.sectionId,
      role: c.role,
      isEmpty: c.isEmpty,
      zones: c.zones.map((z) => ({
        index: z.index,
        occupied: z.occupied,
        kind: z.placementKind,
        topY: z.topY != null ? Math.round(z.topY) : null,
        zoneU: z.uSpan
          ? { min: Math.round(z.uSpan.min), max: Math.round(z.uSpan.max) }
          : null,
        furnU: z.furnitureUSpan
          ? {
              min: Math.round(z.furnitureUSpan.min),
              max: Math.round(z.furnitureUSpan.max),
            }
          : null,
      })),
    })),
    plan,
    planKinds: Array.isArray(plan)
      ? plan.reduce((acc, p) => {
          const k = p?.kind || '?';
          acc[k] = (acc[k] || 0) + 1;
          return acc;
        }, {})
      : null,
    lastTrimDiff: _lastTrimDiff,
    rowState,
  };
  try {
    console.log('[WINDOW-ROW-AUDIT]', out);
  } catch (_) {}
  return out;
}

if (typeof window !== 'undefined') {
  window.__cldWindowRowAudit = auditWindowRow;
  window.__cldBuildWindowRowState = buildWindowRowState;
  window.__cldBuildStraightWallRowState = buildStraightWallRowState;
  window.__cldGetWindowRowRef = getWindowRowRef;
  window.__cldBumpWindowRowSceneRev = bumpWindowRowSceneRev;
  window.__cldGetWindowRowSillMm = getWindowRowSillMm;
  window.__cldGetWindowRowStandaloneHeightMm = getWindowRowStandaloneHeightMm;
  window.__cldResolveWindowRowPlaceHeightMm = resolveWindowRowPlaceHeightMm;
}
