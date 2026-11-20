/**
 * Dev fixture + Stage2 room draft: снимок / восстановление комнаты (секции, модули, room extras).
 * Не меняет бизнес-логику размещения — только сериализация поверх существующих API.
 */
import { state } from '../utils/state.js';
import { getDataForBuild } from './furniture-clodis.js';
import {
  UD_CLODIS_DATA,
  UD_CLODIS_ROOTS,
  UD_CLODIS_VARS,
  readUserDataClodisData,
  readUserDataClodisRoots,
  readUserDataClodisVariables,
  writeUserDataClodisData,
  writeUserDataClodisRoots,
  writeUserDataClodisVariables,
} from '../clodis-json-fields.js';
import {
  createSectionAtPosition,
  applySectionDivisionVariant,
  setSectionParts,
  setZoneCustomWidthMm,
} from '../sections/section-manager.js';
import {
  serializeKitchenBandZoneGrids,
  applyKitchenBandZoneGrids,
} from '../kitchen/kitchen-section-layout.js?v=20261031-zwsrc2';
import {
  serializeKitchenSidePanelsFromUserData,
  applyKitchenSidePanelsToUserData,
  ensureKitchenSidePanelsOnUserData,
  userDataLooksLikeKitchenModule,
  normalizeKitchenSidePanels,
} from '../kitchen/kitchen-side-panels-contract.js?v=20261031-side4b';
import { applyKitchenSidePanelOverlayToClodisRoots } from '../kitchen/kitchen-side-panels-overlay-geometry.js?v=20261031-side4b';
import {
  applyRoomCabinetStudioLook,
  applySectionTrimStudioLookForSectionId,
  syncAllSectionTrimStudio,
  refreshCabinetStudioAfterDecor,
} from './room-cabinet-studio.js?v=20261023-room3';
import { goToRoomStepByNumber } from '../ui/room-steps.js';
import {
  updateRoomDimensions,
  recreateRoomWithShape,
} from '../room/room-manager.js?v=20261030-autosave2';
import { reapplyRoomEditOpenings } from '../room/room-edit-openings.js?v=20261030-autosave2';

const THREE = typeof window !== 'undefined' ? window.THREE : null;

export const IKEA_FIXTURE_PROJECT_NAME = 'ikea_light_fixture';
export const IKEA_FIXTURE_PROJECT_ID = 'ikea_v0_cab';
export const IKEA_FIXTURE_FILE = `${IKEA_FIXTURE_PROJECT_NAME}_${IKEA_FIXTURE_PROJECT_ID}.json`;

/** Stage2 local draft (тот же kind/формат collect). */
export const ROOM_DRAFT_LS_KEY = 'clodis_room_draft_v2';
export const ROOM_FIXTURE_VERSION = 2;

function deepCloneJson(v) {
  if (v == null) return null;
  try {
    return JSON.parse(JSON.stringify(v));
  } catch (_) {
    return null;
  }
}

function furnitureRootGroups(scene) {
  const out = [];
  if (!scene) return out;
  scene.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    let p = obj.parent;
    while (p && p !== scene) {
      if (p.isGroup && p.userData?.isFurniture) return;
      p = p.parent;
    }
    out.push(obj);
  });
  return out;
}

function serializeDivision(div) {
  if (!div || typeof div !== 'object') return null;
  const customZoneWidthsMm =
    div.customZoneWidthsMm && typeof div.customZoneWidthsMm === 'object'
      ? { ...div.customZoneWidthsMm }
      : null;
  const customZoneWidthsSource =
    div.customZoneWidthsSource === 'user' || div.customZoneWidthsSource === 'auto'
      ? div.customZoneWidthsSource
      : null;
  return {
    sectionStart: div.sectionStart,
    sectionEnd: div.sectionEnd,
    wallName: div.wallName,
    parts: div.parts ?? null,
    partSize: div.partSize ?? null,
    customZoneWidthsMm,
    customZoneWidthsSource,
    modules: Array.isArray(div.modules)
      ? div.modules.map((m) => ({
          start: m.start,
          end: m.end,
          width: m.width,
          doorKind: m.doorKind,
        }))
      : null,
    variantIndex: div.divisionVariantIndex ?? div.variantIndex ?? div.activeVariantIndex ?? null,
  };
}

function serializeLShape(ls) {
  if (!ls || typeof ls !== 'object') return null;
  return deepCloneJson(ls);
}

function serializeOpenings() {
  const list = Array.isArray(state.roomEditOpenings) ? state.roomEditOpenings : [];
  return list
    .filter(Boolean)
    .map((op) => {
      const raw = deepCloneJson(op);
      if (!raw || typeof raw !== 'object') return null;
      delete raw._side;
      delete raw._axis;
      return raw;
    })
    .filter(Boolean);
}

function serializeRoomEditObjects() {
  const list = Array.isArray(state.roomEditObjects) ? state.roomEditObjects : [];
  return list.filter(Boolean).map((o) => deepCloneJson(o)).filter(Boolean);
}

function serializeKitchenJoints() {
  const map = state.kitchenJoints;
  if (!map || typeof map !== 'object') return null;
  return deepCloneJson(map);
}

/**
 * Структурная пустота: нет секций и мебели.
 * Используется ТОЛЬКО для empty-overwrite guard — не ослаблять kitchenProject.
 * Иначе падение сцены с ненулевым kitchenProject могло бы затереть кухню в draft.
 */
function isEmptyFixture(fixture) {
  if (!fixture || typeof fixture !== 'object') return true;
  const secN = Array.isArray(fixture.sections) ? fixture.sections.length : 0;
  const furnN = Array.isArray(fixture.furniture) ? fixture.furniture.length : 0;
  return secN === 0 && furnN === 0;
}

export function isEmptyRoomFixture(fixture) {
  return isEmptyFixture(fixture);
}

/**
 * Отличие kitchenProject от заводских дефолтов (collect всегда пишет kitchenProject).
 * Нужно, чтобы «пустая» комната с опорами 120 / Gola / depth / bandMid давала Continue.
 */
export function kitchenProjectHasUserOverrides(kp) {
  if (!kp || typeof kp !== 'object') return false;
  const plinth = Math.round(Number(kp.plinthHeightMm) || 0);
  if (plinth > 0 && plinth !== 100) return true;
  if (kp.frontMode === 'gola' || kp.kitchenSystem === 'gola') return true;
  const worktop = Math.round(Number(kp.worktopDepthMm) || 0);
  if (worktop > 0 && worktop !== 600) return true;
  const carcass = Math.round(Number(kp.baseCarcassDepthMm) || 0);
  if (carcass > 0 && carcass !== 550) return true;
  if (kp.bandMidMm != null && Number(kp.bandMidMm) > 0) return true;
  return false;
}

/**
 * Draft стоит предлагать / восстанавливать (Continue), даже без мебели.
 * Не путать с isEmptyRoomFixture (guard overwrite).
 */
export function isContinuableRoomDraft(fixture) {
  if (!fixture || typeof fixture !== 'object' || fixture.kind !== 'ikea-room-fixture') {
    return false;
  }
  if (!isEmptyFixture(fixture)) return true;
  // Stage9: пользователь намеренно очистил секции/мебель — draft пустой, но валидный.
  if (fixture.intentionallyEmpty === true) return true;
  if (Array.isArray(fixture.openings) && fixture.openings.length > 0) return true;
  if (Array.isArray(fixture.roomEditObjects) && fixture.roomEditObjects.length > 0) return true;
  if (kitchenProjectHasUserOverrides(fixture.kitchenProject)) return true;
  return false;
}

export function readRoomDraftRaw() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ROOM_DRAFT_LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.kind !== 'ikea-room-fixture') return null;
    return parsed;
  } catch (e) {
    console.warn('[room-draft] parse failed', e);
    return null;
  }
}

/** Stage3 «Начать новый»: очистить сцену без записи draft. */
export function clearRoomSceneForNewProject() {
  clearOpeningsAndObjects();
  clearRoomFurnitureAndSections();
  try {
    if (typeof window !== 'undefined' && typeof window.clearStep4SectionEditIcons === 'function') {
      window.clearStep4SectionEditIcons();
    }
  } catch (_) {}
  return { ok: true };
}

function remapId(id, sectionIdMap) {
  if (id == null) return id;
  const key = String(id);
  return sectionIdMap.has(key) ? sectionIdMap.get(key) : key;
}

function remapLShape(ls, sectionIdMap) {
  if (!ls || typeof ls !== 'object') return null;
  const next = deepCloneJson(ls);
  if (!next) return null;
  if (next.pairId != null) next.pairId = remapId(next.pairId, sectionIdMap);
  if (next.pairIdLeft != null) next.pairIdLeft = remapId(next.pairIdLeft, sectionIdMap);
  if (next.pairIdRight != null) next.pairIdRight = remapId(next.pairIdRight, sectionIdMap);
  return next;
}

function remapKitchenJoints(rawMap, sectionIdMap) {
  if (!rawMap || typeof rawMap !== 'object') return null;
  const out = Object.create(null);
  for (const [oldId, j] of Object.entries(rawMap)) {
    if (!j || typeof j !== 'object') continue;
    const next = deepCloneJson(j);
    if (!next) continue;
    next.sectionAId = remapId(next.sectionAId, sectionIdMap);
    next.sectionBId = remapId(next.sectionBId, sectionIdMap);
    next.hostSectionId = remapId(next.hostSectionId, sectionIdMap);
    next.upperHostSectionId = remapId(next.upperHostSectionId, sectionIdMap);
    // Stage12D: ключ временно old jointId; атомарный remap id → после мебели.
    out[String(next.jointId || oldId)] = next;
  }
  return out;
}

/** Mirror kitchen-joint.js `_stableId` / ensureKitchenJoint id formula (orchestration only). */
function _stableKitchenJointParts(parts) {
  return parts.filter((p) => p != null && p !== '').map(String).join('|');
}

/**
 * Canonical jointId from remapped section ids (same as ensureKitchenJoint).
 * L: kj|L|pair|A|B ; U: kj|U|left|A|B or kj|U|right|A|B
 */
function computeCanonicalKitchenJointId(joint) {
  if (!joint) return null;
  const idKind = joint.kind === 'U' ? 'U' : 'L';
  const handKey =
    idKind === 'U' && (joint.hand === 'left' || joint.hand === 'right')
      ? joint.hand
      : 'pair';
  const a = joint.sectionAId;
  const b = joint.sectionBId;
  if (a == null || b == null) return null;
  return _stableKitchenJointParts(['kj', idKind, handKey, a, b]);
}

function _derivedCornerCellId(jointId) {
  return _stableKitchenJointParts(['cc', jointId]);
}

function _derivedUpperCornerCellId(jointId) {
  return _stableKitchenJointParts(['ucc', jointId]);
}

/**
 * Stage12D: old jointId → canonical id from current sectionAId/BId.
 * Atomic: builds new map first; on conflict does not assign.
 * Updates furniture stamps + section reserve keys.
 */
function atomicRemapKitchenJointIdsAfterRestore() {
  const map = state.kitchenJoints;
  if (!map || typeof map !== 'object') {
    return { ok: true, remapped: 0, skipped: true, idMap: {} };
  }
  const entries = Object.entries(map).filter(([, j]) => j && typeof j === 'object');
  if (!entries.length) {
    return { ok: true, remapped: 0, skipped: true, idMap: {} };
  }

  const idMap = Object.create(null); // oldJointId → newJointId
  const newMap = Object.create(null);
  const usedNew = new Set();

  for (const [mapKey, j] of entries) {
    const oldId = String(j.jointId || mapKey);
    const newId = computeCanonicalKitchenJointId(j);
    if (!newId) {
      return {
        ok: false,
        reason: 'canonical_id_null',
        oldId,
        sectionAId: j.sectionAId,
        sectionBId: j.sectionBId,
      };
    }
    if (usedNew.has(newId)) {
      return {
        ok: false,
        reason: 'new_joint_id_conflict',
        newId,
        oldId,
        otherOld: Object.keys(idMap).find((k) => idMap[k] === newId) || null,
      };
    }
    usedNew.add(newId);
    idMap[oldId] = newId;
    if (mapKey !== oldId) idMap[String(mapKey)] = newId;

    const next = j;
    next.jointId = newId;
    next.cornerCellId = _derivedCornerCellId(newId);
    next.upperCornerCellId = _derivedUpperCornerCellId(newId);
    if (next.cornerCell && typeof next.cornerCell === 'object') {
      next.cornerCell.cornerCellId = next.cornerCellId;
    }
    if (next.upperCornerCell && typeof next.upperCornerCell === 'object') {
      next.upperCornerCell.cornerCellId = next.upperCornerCellId;
    }
    newMap[newId] = next;
  }

  if (Object.keys(newMap).length !== entries.length) {
    return {
      ok: false,
      reason: 'remap_count_mismatch',
      before: entries.length,
      after: Object.keys(newMap).length,
    };
  }

  // Commit map only after full build.
  state.kitchenJoints = newMap;

  // Furniture stamps
  if (state.scene) {
    state.scene.traverse((obj) => {
      if (!obj?.isGroup || !obj.userData?.isFurniture) return;
      const ud = obj.userData;
      const oldJ = ud.__kitchenJointId != null ? String(ud.__kitchenJointId) : null;
      if (oldJ && idMap[oldJ]) {
        const nid = idMap[oldJ];
        ud.__kitchenJointId = nid;
        ud.__kitchenCornerCellId = _derivedCornerCellId(nid);
      }
    });
  }

  // Section reserve maps keyed by jointId (usually empty pre-seat; still rekey).
  for (const sec of state.customSections || []) {
    if (!sec) continue;
    for (const key of ['_kitchenJointReserves', '_kitchenJointUpperReserves']) {
      const bag = sec[key];
      if (!bag || typeof bag !== 'object') continue;
      const nextBag = Object.create(null);
      let changed = false;
      for (const [jid, val] of Object.entries(bag)) {
        const nid = idMap[String(jid)] || String(jid);
        if (nid !== String(jid)) changed = true;
        nextBag[nid] = val;
        if (val && typeof val === 'object' && idMap[String(jid)]) {
          const j = newMap[idMap[String(jid)]];
          if (j) {
            if (key === '_kitchenJointReserves') val.cornerCellId = j.cornerCellId;
            if (key === '_kitchenJointUpperReserves') {
              val.cornerCellId = j.upperCornerCellId;
            }
          }
        }
      }
      if (changed) sec[key] = nextBag;
    }
  }

  return {
    ok: true,
    remapped: Object.keys(newMap).length,
    idMap: { ...idMap },
    jointIds: Object.keys(newMap),
  };
}

function applyRoomSizeFromFixture(fixture) {
  const roomSnap = fixture?.room;
  if (!roomSnap || !state.scene) return { ok: false, reason: 'no_room_snap' };
  const w = Number(roomSnap.width);
  const d = Number(roomSnap.depth);
  const h = Number(roomSnap.height);
  if (!(w >= 1000) || !(d >= 1000) || !(h >= 2000)) {
    return { ok: false, reason: 'invalid_room_dims' };
  }

  const shapeKey =
    (fixture.kitchenRoomShapeKey && String(fixture.kitchenRoomShapeKey)) ||
    state.kitchenRoomShapeKey ||
    state.room?.shapeKey ||
    'enclosed_rect';

  let hasInputs = false;
  try {
    const wi = document.getElementById('room-width-input');
    const di = document.getElementById('room-depth-input');
    const hi = document.getElementById('room-height-input');
    if (wi && di && hi) {
      wi.value = String(Math.round(w / 10));
      di.value = String(Math.round(d / 10));
      hi.value = String(Math.round(h / 10));
      hasInputs = true;
    }
  } catch (_) {}

  state.kitchenRoomShapeKey = shapeKey;
  if (typeof window !== 'undefined') {
    window.selectedKitchenRoomShape = {
      ...(window.selectedKitchenRoomShape || {}),
      key: shapeKey,
    };
  }
  if (fixture.kitchenFootprintParams && typeof fixture.kitchenFootprintParams === 'object') {
    state.kitchenFootprintParams = deepCloneJson(fixture.kitchenFootprintParams);
  }
  if (Array.isArray(fixture.kitchenInteriorWalls)) {
    state.kitchenInteriorWalls = deepCloneJson(fixture.kitchenInteriorWalls) || [];
  }

  // Уже совпадает — не пересобирать комнату (меньше побочных эффектов).
  const cur = state.room;
  const sameSize =
    cur &&
    Math.round(Number(cur.width)) === Math.round(w) &&
    Math.round(Number(cur.depth)) === Math.round(d) &&
    Math.round(Number(cur.height)) === Math.round(h);
  const sameShape = String(cur?.shapeKey || state.kitchenRoomShapeKey || '') === String(shapeKey);
  if (sameSize && sameShape) {
    return { ok: true, width: w, depth: d, height: h, shapeKey, skipped: true };
  }

  try {
    if (hasInputs) {
      updateRoomDimensions();
    } else {
      recreateRoomWithShape(shapeKey, { quiet: true });
    }
  } catch (e) {
    console.warn('[IKEA fixture] applyRoomSize', e);
    return { ok: false, reason: String(e?.message || e) };
  }
  return { ok: true, width: w, depth: d, height: h, shapeKey };
}

export function collectIkeaRoomFixture() {
  const sections = (state.customSections || []).map((s) => ({
    id: s.id,
    name: s.name,
    size: s.size ? { x: s.size.x, y: s.size.y, z: s.size.z } : null,
    position: s.position
      ? { x: s.position.x, y: s.position.y, z: s.position.z }
      : s.group
        ? {
            x: s.group.position.x,
            y: s.group.position.y,
            z: s.group.position.z,
          }
        : null,
    wallName: s.wallName || 'back',
    offsets: s.offsets ? { ...s.offsets } : null,
    filler: s.filler ? { ...s.filler } : null,
    facadeDepthMm: s.facadeDepthMm ?? null,
    topPlankHeight: s.topPlankHeight ?? null,
    bottomPlankHeightMm: s.bottomPlankHeightMm ?? null,
    division: serializeDivision(s.division),
    kitchenBandGrids: serializeKitchenBandZoneGrids(s),
    lShape: serializeLShape(s.lShape),
  }));

  const furniture = furnitureRootGroups(state.scene).map((g) => {
    const ud = g.userData || {};
    const clodisData = readUserDataClodisData(ud) ?? ud[UD_CLODIS_DATA] ?? null;
    const clodisRoots = readUserDataClodisRoots(ud) ?? ud[UD_CLODIS_ROOTS] ?? null;
    const clodisVariables = readUserDataClodisVariables(ud) ?? ud[UD_CLODIS_VARS] ?? null;
    return {
      uuid: g.uuid || null,
      catalogItemId: ud.catalogItemId ?? null,
      catalogType: ud.catalogType ?? null,
      catalogName: ud.catalogName ?? null,
      sectionId: ud.sectionId ?? null,
      zoneIndex: typeof ud.zoneIndex === 'number' ? ud.zoneIndex : null,
      wallName: ud.wallName ?? null,
      position: { x: g.position.x, y: g.position.y, z: g.position.z },
      rotationY: g.rotation.y,
      scale: { x: g.scale.x, y: g.scale.y, z: g.scale.z },
      clodisData: clodisData ? deepCloneJson(clodisData) : null,
      clodisRoots: clodisRoots ? deepCloneJson(clodisRoots) : null,
      clodisVariables: clodisVariables ? deepCloneJson(clodisVariables) : null,
      initialSectionSizeMm: ud.__initialSectionSizeMm
        ? { ...ud.__initialSectionSizeMm }
        : null,
      catalogSizeMm: ud.__catalogSizeMm ? { ...ud.__catalogSizeMm } : null,
      placementKind: ud.__placementKind ?? null,
      placementKindProfileId: ud.__placementKindProfileId ?? null,
      customDepthMm: ud.customDepthMm ?? null,
      customHeightMm: ud.customHeightMm ?? null,
      customWidthMm: ud.customWidthMm ?? null,
      rearOffsetMm: Number.isFinite(Number(ud.rearOffsetMm))
        ? Math.round(Number(ud.rearOffsetMm)) || 0
        : 0,
      frontOffsetMm: Number.isFinite(Number(ud.frontOffsetMm))
        ? Math.round(Number(ud.frontOffsetMm)) || 0
        : 0,
      kitchenTopDepthMode: ud.__kitchenTopDepthMode ?? null,
      kitchenTopCustomDepthMm: ud.__kitchenTopCustomDepthMm ?? null,
      kitchenTopDepthUserLocked: ud.__kitchenTopDepthUserLocked === true,
      kitchenCarcassDepthMm: ud.__kitchenCarcassDepthMm ?? null,
      doorLayout: ud.doorLayout ?? null,
      zoneHand: ud.zoneHand ?? null,
      doorKind: ud.doorKind ?? null,
      unifiedFacade: !!ud.unifiedFacade,
      layoutZones: ud.__layoutZones ? deepCloneJson(ud.__layoutZones) : null,
      productKind: ud.productKind ?? null,
      hBottomMm: ud.hBottomMm ?? null,
      drawerStackPolicy: ud.drawerStackPolicy ?? null,
      shelfStackPolicy: ud.shelfStackPolicy ?? null,
      kitchenJointId: ud.__kitchenJointId ?? null,
      step5ModuleOutside: ud.step5ModuleOutside ? deepCloneJson(ud.step5ModuleOutside) : null,
      step5ModuleInside: ud.step5ModuleInside ? deepCloneJson(ud.step5ModuleInside) : null,
      step5ModuleEndOverlay: ud.step5ModuleEndOverlay
        ? deepCloneJson(ud.step5ModuleEndOverlay)
        : null,
      // STEP 2A: боковые опции экземпляра (кухня); null для не-кухни.
      // ensure при save — старые инстансы получают default в памяти без смены геометрии.
      sidePanels: (() => {
        if (!userDataLooksLikeKitchenModule(ud)) return null;
        ensureKitchenSidePanelsOnUserData(ud);
        return serializeKitchenSidePanelsFromUserData(ud);
      })(),
    };
  });

  const room = state.room
    ? { width: state.room.width, depth: state.room.depth, height: state.room.height }
    : null;

  const kitchenProject =
    typeof window !== 'undefined' &&
    window.__cldKitchenManufacturing &&
    typeof window.__cldKitchenManufacturing.getKitchenProjectForSave === 'function'
      ? window.__cldKitchenManufacturing.getKitchenProjectForSave()
      : state.kitchenProject || null;

  return {
    version: ROOM_FIXTURE_VERSION,
    kind: 'ikea-room-fixture',
    exportedAt: new Date().toISOString(),
    step: typeof window !== 'undefined' ? Number(window.currentRoomStep) || 3 : 3,
    stripTrim: false,
    note: 'Stage2 room draft / IKEA fixture snapshot',
    kitchenProject,
    room,
    kitchenRoomShapeKey:
      state.kitchenRoomShapeKey || state.room?.shapeKey || null,
    kitchenFootprintParams: state.kitchenFootprintParams
      ? deepCloneJson(state.kitchenFootprintParams)
      : null,
    kitchenInteriorWalls: Array.isArray(state.kitchenInteriorWalls)
      ? deepCloneJson(state.kitchenInteriorWalls)
      : null,
    openings: serializeOpenings(),
    roomEditObjects: serializeRoomEditObjects(),
    kitchenJoints: serializeKitchenJoints(),
    sections,
    furniture,
    camera:
      state.camera && THREE
        ? {
            position: state.camera.position.toArray(),
            target: state.controls?.target?.toArray?.() || null,
          }
        : null,
  };
}

export async function saveIkeaRoomFixtureToServer(fixture) {
  const projectData = {
    ...fixture,
    project_settings: { project_id: IKEA_FIXTURE_PROJECT_ID, name: IKEA_FIXTURE_PROJECT_NAME },
    date_created: fixture.exportedAt,
    date_updated: fixture.exportedAt,
  };
  const res = await fetch('/api/projects/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: IKEA_FIXTURE_PROJECT_NAME, projectData }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.result === 'error') {
    throw new Error(json.error || `HTTP ${res.status}`);
  }
  return { ok: true, fileName: json.fileName || IKEA_FIXTURE_FILE, id: json.id };
}

export async function loadIkeaRoomFixtureFromServer() {
  const res = await fetch(`/api/projects/load/${encodeURIComponent(IKEA_FIXTURE_FILE)}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.result === 'error' || !json.project) {
    throw new Error(json.error || `HTTP ${res.status}`);
  }
  return json.project;
}

export async function exportIkeaRoomFixture() {
  const fixture = collectIkeaRoomFixture();
  if (!fixture.sections.length) {
    return { ok: false, reason: 'no sections (обклад)', fixture };
  }
  if (!fixture.furniture.length) {
    return { ok: false, reason: 'no furniture (шкаф)', fixture };
  }
  const saved = await saveIkeaRoomFixtureToServer(fixture);
  const summary = {
    ok: true,
    fileName: saved.fileName,
    sections: fixture.sections.length,
    furniture: fixture.furniture.length,
    step: fixture.step,
    room: fixture.room,
    openUrl: `index.html?v=${encodeURIComponent(
      (typeof window !== 'undefined' && window.__CLD_BUILD) || '20261030-draft1'
    )}&ikeaFixture=1`,
  };
  console.info('[IKEA fixture] saved', summary);
  return summary;
}

function clearRoomFurnitureAndSections() {
  const roots = furnitureRootGroups(state.scene);
  for (const g of roots) {
    g.parent?.remove(g);
  }
  for (const s of [...(state.customSections || [])]) {
    if (s.group) s.group.parent?.remove(s.group);
  }
  state.customSections = [];
  state.furniture = null;
  state.selectedFurniture = null;
  state.kitchenJoints = Object.create(null);
}

function clearOpeningsAndObjects() {
  state.roomEditOpenings = [];
  state.roomEditObjects = [];
  try {
    reapplyRoomEditOpenings();
  } catch (_) {}
  try {
    if (typeof window !== 'undefined' && typeof window.__cldReapplyRoomEditObjects === 'function') {
      window.__cldReapplyRoomEditObjects();
    }
  } catch (_) {}
}

function resolveFurnitureCtor() {
  if (typeof window !== 'undefined' && typeof window.Furniture === 'function') {
    return window.Furniture;
  }
  try {
    const ctor = Function('return typeof Furniture !== "undefined" ? Furniture : null')();
    if (typeof ctor === 'function') return ctor;
  } catch (_) {}
  return null;
}

/** Draft item → эвристика кухни до stamp userData (для overlay inject). */
function itemLooksLikeKitchenModule(item) {
  if (!item || typeof item !== 'object') return false;
  return userDataLooksLikeKitchenModule({
    __placementKindProfileId: item.placementKindProfileId,
    productKind: item.productKind,
    __placementKind: item.placementKind,
    __kitchenCarcassDepthMm: item.kitchenCarcassDepthMm,
    __kitchenCarcassHeightMm: item.hBottomMm != null ? 1 : undefined,
  });
}

/** Есть ли хотя бы одна сторона в mode=overlay. */
function sidePanelsHasOverlayMode(raw) {
  if (raw == null) return false;
  const sp = normalizeKitchenSidePanels(raw);
  return (
    String(sp.left?.mode || '').toLowerCase() === 'overlay' ||
    String(sp.right?.mode || '').toLowerCase() === 'overlay'
  );
}

/**
 * STEP 3G: перед FurnitureCtor — из контракта sidePanels наложить/снять
 * параметрическую накладку на клон дерева (идемпотентно: strip+reset внутри apply).
 * Только кухня + overlay; standard не трогаем (корни уже без накладки).
 */
function prepareClodisRootsForKitchenSidePanelRestore(rootsIn, item) {
  if (!itemLooksLikeKitchenModule(item) || !sidePanelsHasOverlayMode(item.sidePanels)) {
    return rootsIn;
  }
  let roots;
  try {
    roots = JSON.parse(JSON.stringify(Array.isArray(rootsIn) ? rootsIn : [rootsIn]));
  } catch (_) {
    return rootsIn;
  }
  try {
    applyKitchenSidePanelOverlayToClodisRoots(roots, {
      sidePanels: normalizeKitchenSidePanels(item.sidePanels),
      carcassDepthMm: item.kitchenCarcassDepthMm || item.customDepthMm || null,
    });
  } catch (e) {
    console.warn('[room-draft] sidePanel overlay restore inject failed', e);
    return rootsIn;
  }
  return Array.isArray(rootsIn) ? roots : roots[0];
}

function restoreOneFurniture(item, sectionIdMap) {
  const FurnitureCtor = resolveFurnitureCtor();
  if (!FurnitureCtor || !THREE) {
    throw new Error('Furniture / THREE unavailable');
  }
  const rootsRaw = item.clodisRoots || item.clodisData;
  if (!rootsRaw) {
    console.warn('[IKEA fixture] skip furniture without clodis', item.catalogName);
    return null;
  }
  const roots = prepareClodisRootsForKitchenSidePanelRestore(rootsRaw, item);
  const dataForBuild = getDataForBuild(roots) || roots;
  const sectionSize = item.initialSectionSizeMm || { x: 1000, y: 2100, z: 580 };
  const vars = item.clodisVariables && typeof item.clodisVariables === 'object'
    ? item.clodisVariables
    : {};
  const wallThicknessMm = Number(vars._wt) > 0 ? Number(vars._wt) : 16;
  const params = {
    sectionSize,
    wallThicknessMm,
    variables: {
      vysota_cokolya: 100,
      glubina_cokolya: 100,
      otstup_paza: 0,
      ...vars,
    },
    groups: {
      g0: { thickness: wallThicknessMm },
      g1: { thickness: 3 },
      hdf1: { thickness: 3 },
    },
    decorOutside: item.step5ModuleOutside || null,
    decorInside: item.step5ModuleInside || null,
    layoutZones: item.layoutZones || undefined,
    placementKind: item.placementKind || undefined,
    doorLayout: item.doorLayout || undefined,
    zoneHand: item.zoneHand || undefined,
    doorKind: item.doorKind || undefined,
    unifiedFacade: item.unifiedFacade || undefined,
    productKind: item.productKind || undefined,
  };

  const built = new FurnitureCtor(dataForBuild, params);
  const g = built.group;
  const ud = g.userData || (g.userData = {});
  writeUserDataClodisData(ud, dataForBuild);
  try {
    writeUserDataClodisRoots(
      ud,
      JSON.parse(JSON.stringify(Array.isArray(roots) ? roots : [roots]))
    );
  } catch (_) {}
  if (vars && typeof vars === 'object') {
    try {
      writeUserDataClodisVariables(ud, JSON.parse(JSON.stringify(vars)));
    } catch (_) {
      writeUserDataClodisVariables(ud, { ...vars });
    }
  }
  ud.isFurniture = true;
  ud.catalogItemId = item.catalogItemId;
  ud.catalogType = item.catalogType;
  ud.catalogName = item.catalogName || '';
  ud.__initialSectionSizeMm = sectionSize;
  if (item.catalogSizeMm) ud.__catalogSizeMm = item.catalogSizeMm;
  ud.__placementKind = item.placementKind;
  if (item.placementKindProfileId != null) {
    ud.__placementKindProfileId = item.placementKindProfileId;
  }
  ud.doorLayout = item.doorLayout;
  ud.zoneHand = item.zoneHand;
  ud.doorKind = item.doorKind;
  ud.unifiedFacade = !!item.unifiedFacade;
  ud.productKind = item.productKind;
  ud.drawerStackPolicy = item.drawerStackPolicy;
  ud.shelfStackPolicy = item.shelfStackPolicy;
  if (item.hBottomMm != null) ud.hBottomMm = item.hBottomMm;
  if (item.layoutZones) ud.__layoutZones = item.layoutZones;
  if (item.customDepthMm != null) ud.customDepthMm = item.customDepthMm;
  if (item.customHeightMm != null) ud.customHeightMm = item.customHeightMm;
  if (item.customWidthMm != null) ud.customWidthMm = item.customWidthMm;
  ud.rearOffsetMm = Math.max(0, Math.round(Number(item.rearOffsetMm) || 0));
  ud.frontOffsetMm = Math.max(0, Math.round(Number(item.frontOffsetMm) || 0));
  if (item.kitchenTopDepthMode) ud.__kitchenTopDepthMode = item.kitchenTopDepthMode;
  if (item.kitchenTopCustomDepthMm != null) {
    ud.__kitchenTopCustomDepthMm = item.kitchenTopCustomDepthMm;
  }
  if (item.kitchenTopDepthUserLocked === true) ud.__kitchenTopDepthUserLocked = true;
  if (item.kitchenCarcassDepthMm != null) {
    ud.__kitchenCarcassDepthMm = item.kitchenCarcassDepthMm;
  }
  if (item.kitchenJointId != null) ud.__kitchenJointId = item.kitchenJointId;
  if (item.step5ModuleOutside) ud.step5ModuleOutside = item.step5ModuleOutside;
  if (item.step5ModuleInside) ud.step5ModuleInside = item.step5ModuleInside;
  if (item.step5ModuleEndOverlay) ud.step5ModuleEndOverlay = item.step5ModuleEndOverlay;

  const oldSid = item.sectionId != null ? String(item.sectionId) : null;
  const newSid = oldSid && sectionIdMap.has(oldSid) ? sectionIdMap.get(oldSid) : oldSid;
  if (newSid != null) ud.sectionId = newSid;
  if (typeof item.zoneIndex === 'number') ud.zoneIndex = item.zoneIndex;
  ud.wallName = item.wallName || 'back';

  // STEP 2A: после stamp kind/product — sidePanels на кухонном экземпляре.
  if (userDataLooksLikeKitchenModule(ud)) {
    if (item.sidePanels != null) applyKitchenSidePanelsToUserData(ud, item.sidePanels);
    else ensureKitchenSidePanelsOnUserData(ud);
  }

  g.position.set(item.position.x, item.position.y, item.position.z);
  g.rotation.y = item.rotationY || 0;
  if (item.scale) {
    g.scale.set(item.scale.x || 1, item.scale.y || 1, item.scale.z || 1);
  }
  g.visible = true;
  applyRoomCabinetStudioLook(g);
  state.scene.add(g);
  g.updateMatrixWorld(true);
  state.furniture = built;
  if (newSid != null) applySectionTrimStudioLookForSectionId(newSid);

  return { group: g, oldUuid: item.uuid || null, needsDecor: !!(item.step5ModuleOutside || item.step5ModuleInside || item.step5ModuleEndOverlay) };
}

function restoreOpeningsAndObjects(fixture) {
  const openings = Array.isArray(fixture.openings) ? deepCloneJson(fixture.openings) : [];
  const objects = Array.isArray(fixture.roomEditObjects)
    ? deepCloneJson(fixture.roomEditObjects)
    : [];
  state.roomEditOpenings = Array.isArray(openings) ? openings : [];
  state.roomEditObjects = Array.isArray(objects) ? objects : [];
  try {
    reapplyRoomEditOpenings();
  } catch (e) {
    console.warn('[IKEA fixture] openings restore', e);
  }
  try {
    if (typeof window !== 'undefined' && typeof window.__cldReapplyRoomEditObjects === 'function') {
      window.__cldReapplyRoomEditObjects();
    }
  } catch (e) {
    console.warn('[IKEA fixture] roomEditObjects restore', e);
  }
  return {
    openings: state.roomEditOpenings.length,
    roomEditObjects: state.roomEditObjects.length,
  };
}

/**
 * lShape / kitchenJoints: метаданные + remap id.
 * Не вызываем seatKitchenJointCorner / ensureJointsForLPair (пересчёт геометрии угла).
 */
function restoreLShapeAndJoints(fixture, sectionIdMap, uuidMap) {
  const limitations = [];
  const sections = Array.isArray(fixture.sections) ? fixture.sections : [];
  for (const s of sections) {
    if (!s?.lShape || s.id == null) continue;
    const newId = sectionIdMap.get(String(s.id));
    const created = (state.customSections || []).find((x) => String(x.id) === String(newId));
    if (!created) continue;
    created.lShape = remapLShape(s.lShape, sectionIdMap);
    if (created.group?.userData) created.group.userData.isCornerSection = true;
  }

  const remapped = remapKitchenJoints(fixture.kitchenJoints, sectionIdMap);
  if (remapped) {
    for (const j of Object.values(remapped)) {
      if (!j || typeof j !== 'object') continue;
      if (j.moduleUuid && uuidMap.has(String(j.moduleUuid))) {
        j.moduleUuid = uuidMap.get(String(j.moduleUuid));
      }
      if (j.upperModuleUuid && uuidMap.has(String(j.upperModuleUuid))) {
        j.upperModuleUuid = uuidMap.get(String(j.upperModuleUuid));
      }
    }
    state.kitchenJoints = remapped;
  } else {
    state.kitchenJoints = Object.create(null);
  }

  if (sections.some((s) => s?.lShape) || (fixture.kitchenJoints && Object.keys(fixture.kitchenJoints).length)) {
    limitations.push(
      'lShape/kitchenJoints restored as metadata only (pending reviveKitchenJointsAfterRestore)'
    );
  }
  return { limitations };
}

function _fixtureSecById(id) {
  if (id == null || !Array.isArray(state.customSections)) return null;
  return state.customSections.find((s) => s && String(s.id) === String(id)) || null;
}

function _fixtureFurnitureByUuid(uuid) {
  if (!uuid || !state.scene) return null;
  const want = String(uuid);
  let found = null;
  state.scene.traverse((obj) => {
    if (found || !obj?.isGroup || !obj.userData?.isFurniture) return;
    if (String(obj.uuid) === want) found = obj;
  });
  return found;
}

function _snapshotZoneWidthsMm(sec) {
  const raw = sec?.division?.customZoneWidthsMm;
  const out = Object.create(null);
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw)) {
    const n = Math.round(Number(v) || 0);
    if (n > 0) out[String(k)] = n;
  }
  return out;
}

function _jointHostSpecialZi(joint) {
  const host = _fixtureSecById(joint?.hostSectionId);
  if (!host?.division) return null;
  const parts = Math.max(1, Math.floor(Number(host.division.parts) || 1));
  const atStart =
    typeof joint?.cornerCell?.atStart === 'boolean'
      ? joint.cornerCell.atStart === true
      : true;
  return atStart ? 0 : parts - 1;
}

function _jointOtherClearZi(joint) {
  const hostId = String(joint?.hostSectionId || '');
  const otherId =
    hostId === String(joint?.sectionAId) ? joint?.sectionBId : joint?.sectionAId;
  const other = _fixtureSecById(otherId);
  if (!other?.division) return { sectionId: otherId, zi: null };
  const parts = Math.max(1, Math.floor(Number(other.division.parts) || 1));
  const r = other._kitchenJointReserves?.[joint.jointId];
  let zi = null;
  if (r && typeof r.atStart === 'boolean') {
    zi = r.atStart === true ? 0 : parts - 1;
  } else if (typeof joint?.cornerCell?.atStart === 'boolean') {
    // Mirror host atStart heuristic for L edge toward corner.
    zi = joint.cornerCell.atStart === true ? 0 : parts - 1;
  }
  return { sectionId: otherId != null ? String(otherId) : null, zi };
}

function captureJointReviveInvariants(jointsList) {
  const jointIds = (jointsList || [])
    .map((j) => String(j?.jointId || ''))
    .filter(Boolean)
    .sort();
  const sections = Array.isArray(state.customSections) ? state.customSections : [];
  const sectionIds = sections.map((s) => String(s.id)).sort();
  const widths = Object.create(null);
  for (const s of sections) {
    if (!s?.id) continue;
    widths[String(s.id)] = _snapshotZoneWidthsMm(s);
  }
  const furniture = [];
  if (state.scene) {
    state.scene.traverse((obj) => {
      if (!obj?.isGroup || !obj.userData?.isFurniture) return;
      furniture.push({
        uuid: String(obj.uuid),
        x: obj.position.x,
        y: obj.position.y,
        z: obj.position.z,
        ry: obj.rotation.y,
      });
    });
  }
  furniture.sort((a, b) => (a.uuid < b.uuid ? -1 : a.uuid > b.uuid ? 1 : 0));
  return {
    jointIds,
    jointCount: jointIds.length,
    sectionIds,
    sectionCount: sectionIds.length,
    furnitureCount: furniture.length,
    furniture,
    widths,
  };
}

function compareJointReviveInvariants(before, after, jointsList) {
  if (before.sectionCount !== after.sectionCount) {
    return { ok: false, reason: 'section_count_changed', before: before.sectionCount, after: after.sectionCount };
  }
  if (before.furnitureCount !== after.furnitureCount) {
    return {
      ok: false,
      reason: 'furniture_count_changed',
      before: before.furnitureCount,
      after: after.furnitureCount,
    };
  }
  if (before.jointCount !== after.jointCount) {
    return { ok: false, reason: 'joint_count_changed', before: before.jointCount, after: after.jointCount };
  }
  const beforeKeys = before.jointIds.join('|');
  const afterKeys = after.jointIds.join('|');
  if (beforeKeys !== afterKeys) {
    return { ok: false, reason: 'joint_ids_changed', before: before.jointIds, after: after.jointIds };
  }

  const eps = 0.05;
  for (let i = 0; i < before.furniture.length; i += 1) {
    const a = before.furniture[i];
    const b = after.furniture[i];
    if (!b || a.uuid !== b.uuid) {
      return { ok: false, reason: 'furniture_identity_changed' };
    }
    if (
      Math.abs(a.x - b.x) > eps ||
      Math.abs(a.y - b.y) > eps ||
      Math.abs(a.z - b.z) > eps ||
      Math.abs(a.ry - b.ry) > eps
    ) {
      return { ok: false, reason: 'furniture_pose_changed', uuid: a.uuid };
    }
  }

  const allowedHost = Object.create(null);
  const allowedOtherClear = Object.create(null);
  for (const j of jointsList || []) {
    if (!j) continue;
    const hostId = String(j.hostSectionId || '');
    const zi = _jointHostSpecialZi(j);
    if (hostId && zi != null) {
      if (!allowedHost[hostId]) allowedHost[hostId] = new Set();
      allowedHost[hostId].add(String(zi));
    }
    const oc = _jointOtherClearZi(j);
    if (oc.sectionId != null && oc.zi != null) {
      if (!allowedOtherClear[oc.sectionId]) allowedOtherClear[oc.sectionId] = new Set();
      allowedOtherClear[oc.sectionId].add(String(oc.zi));
    }
  }

  for (const sid of Object.keys(before.widths)) {
    const bw = before.widths[sid] || Object.create(null);
    const aw = after.widths[sid] || Object.create(null);
    const keys = new Set([...Object.keys(bw), ...Object.keys(aw)]);
    for (const k of keys) {
      const bv = bw[k];
      const av = aw[k];
      if (bv === av) continue;
      const hostAllow = allowedHost[sid] && allowedHost[sid].has(String(k));
      if (hostAllow) continue;
      // Seat may delete projection width on non-host edge.
      if (bv != null && av == null && allowedOtherClear[sid]?.has(String(k))) continue;
      return {
        ok: false,
        reason: 'ordinary_zone_width_changed',
        sectionId: sid,
        zoneIndex: k,
        before: bv ?? null,
        after: av ?? null,
      };
    }
  }

  return { ok: true };
}

/**
 * Stage12B/D: seat existing Joints after id remap. No ensureJointsForLPair.
 * @returns {{ ok: boolean, revived?: number, reason?: string, limitations?: string[] }}
 */
function reviveKitchenJointsAfterRestore() {
  const map = state.kitchenJoints;
  if (!map || typeof map !== 'object') {
    return { ok: true, revived: 0, skipped: true };
  }
  const list = Object.values(map).filter((j) => j && typeof j === 'object');
  if (!list.length) return { ok: true, revived: 0, skipped: true };

  const seatFn =
    typeof window !== 'undefined' ? window.__cldSeatKitchenJointCorner : null;
  const seatUpperFn =
    typeof window !== 'undefined' ? window.__cldSeatKitchenJointUpperCorner : null;
  if (typeof seatFn !== 'function') {
    return { ok: false, reason: 'seat_api_missing', revived: 0 };
  }

  const before = captureJointReviveInvariants(list);
  let revived = 0;
  const touchedSectionIds = new Set();

  for (const j of list) {
    const secA = _fixtureSecById(j.sectionAId);
    const secB = _fixtureSecById(j.sectionBId);
    const host = _fixtureSecById(j.hostSectionId);
    if (!secA || !secB || !host) {
      return {
        ok: false,
        reason: 'joint_sections_missing',
        jointId: j.jointId,
        revived: 0,
      };
    }
    if (
      String(j.hostSectionId) !== String(j.sectionAId) &&
      String(j.hostSectionId) !== String(j.sectionBId)
    ) {
      return { ok: false, reason: 'joint_host_invalid', jointId: j.jointId, revived: 0 };
    }

    if (j.moduleUuid && !_fixtureFurnitureByUuid(j.moduleUuid)) {
      j.moduleUuid = null;
    }
    if (j.upperModuleUuid && !_fixtureFurnitureByUuid(j.upperModuleUuid)) {
      j.upperModuleUuid = null;
    }

    const cc = j.cornerCell && typeof j.cornerCell === 'object' ? j.cornerCell : null;
    const seatOpts = {};
    if (cc) {
      const w = Math.round(Number(cc.widthMm) || 0);
      if (w >= 300 && w <= 1200) seatOpts.widthMm = w;
      if (typeof cc.atStart === 'boolean') seatOpts.atStart = cc.atStart === true;
      if (Number.isFinite(Number(cc.clearMm))) seatOpts.clearMm = Number(cc.clearMm);
      if (Number.isFinite(Number(cc.returnMm))) seatOpts.returnMm = Number(cc.returnMm);
      if (Number.isFinite(Number(cc.depthMm))) seatOpts.depthMm = Number(cc.depthMm);
    }
    try {
      seatFn(j, seatOpts);
      revived += 1;
    } catch (e) {
      console.warn('[IKEA fixture] seatKitchenJointCorner failed', j.jointId, e);
      return {
        ok: false,
        reason: `seat_failed:${String(e?.message || e)}`,
        jointId: j.jointId,
        revived: 0,
      };
    }

    if (typeof seatUpperFn === 'function') {
      const uc =
        j.upperCornerCell && typeof j.upperCornerCell === 'object'
          ? j.upperCornerCell
          : null;
      const upperOpts = {};
      if (uc) {
        const uw = Math.round(Number(uc.widthMm) || 0);
        if (uw >= 300 && uw <= 900) upperOpts.widthMm = uw;
        if (typeof uc.atStart === 'boolean') upperOpts.atStart = uc.atStart === true;
        if (Number.isFinite(Number(uc.depthMm))) upperOpts.depthMm = Number(uc.depthMm);
      }
      try {
        seatUpperFn(j, upperOpts);
      } catch (e) {
        console.warn('[IKEA fixture] seatKitchenJointUpperCorner failed', j.jointId, e);
        return {
          ok: false,
          reason: `upper_seat_failed:${String(e?.message || e)}`,
          jointId: j.jointId,
          revived: 0,
        };
      }
    }

    touchedSectionIds.add(String(j.sectionAId));
    touchedSectionIds.add(String(j.sectionBId));
  }

  // Re-capture joint list after seat (same objects; ids must not grow).
  const afterList = Object.values(state.kitchenJoints || {}).filter(Boolean);
  const after = captureJointReviveInvariants(afterList);
  const cmp = compareJointReviveInvariants(before, after, list);
  if (!cmp.ok) {
    console.warn('[IKEA fixture] joint revive invariants failed', cmp);
    return { ok: false, revived: 0, ...cmp };
  }

  try {
    if (typeof window !== 'undefined' && typeof window.__cldSyncCornerCellMeshes === 'function') {
      window.__cldSyncCornerCellMeshes();
    }
  } catch (e) {
    console.warn('[IKEA fixture] sync corner meshes after revive', e);
  }

  try {
    const rebuild =
      typeof window !== 'undefined'
        ? window.__cldRebuildSectionZoneEditIconsForSection ||
          window.rebuildSectionZoneEditIconsForSection
        : null;
    if (typeof rebuild === 'function') {
      for (const sid of touchedSectionIds) {
        try {
          rebuild(sid);
        } catch (_) {}
      }
    }
  } catch (_) {}

  return { ok: true, revived, jointIds: before.jointIds };
}

export async function restoreIkeaRoomFixture(fixture) {
  if (!fixture || fixture.kind !== 'ikea-room-fixture') {
    throw new Error('invalid fixture kind');
  }
  if (!state.scene || !THREE) throw new Error('scene not ready');
  if (typeof window !== 'undefined' && !window.__CLD_REFACTORED_INIT__) {
    throw new Error('constructor not ready (__CLD_REFACTORED_INIT__)');
  }

  const limitations = [];

  try {
    const km = typeof window !== 'undefined' ? window.__cldKitchenManufacturing : null;
    if (km && typeof km.hydrateKitchenProjectFromSave === 'function') {
      km.hydrateKitchenProjectFromSave(fixture.kitchenProject || fixture, true);
    } else if (fixture.kitchenProject) {
      state.kitchenProject = { ...fixture.kitchenProject };
    }
  } catch (e) {
    console.warn('[IKEA fixture] kitchenProject hydrate', e);
  }

  // Комната до секций (стены/размер). updateRoomDimensions сам reconcile openings — чистим заранее.
  clearOpeningsAndObjects();
  const roomApply = applyRoomSizeFromFixture(fixture);
  if (!roomApply.ok && fixture.room) {
    limitations.push(`room size apply: ${roomApply.reason || 'failed'}`);
  }

  clearRoomFurnitureAndSections();

  const roomExtras = restoreOpeningsAndObjects(fixture);

  const sectionIdMap = new Map();
  const sections = Array.isArray(fixture.sections) ? fixture.sections : [];
  for (const s of sections) {
    if (!s?.size || !s?.position || !s?.wallName) {
      console.warn('[IKEA fixture] skip section', s);
      continue;
    }
    state.pendingSectionData = {
      width: s.size.x,
      height: s.size.y,
      depth: s.size.z,
    };
    const pos = new THREE.Vector3(s.position.x, s.position.y, s.position.z);
    const created = createSectionAtPosition(pos, s.wallName, { skipAttached: true });
    state.pendingSectionData = null;
    if (!created) continue;
    if (s.id != null) sectionIdMap.set(String(s.id), created.id);

    if (s.offsets && typeof s.offsets === 'object') {
      created.offsets = { ...s.offsets };
    }
    if (s.filler && typeof s.filler === 'object') {
      created.filler = { ...s.filler };
    }
    if (s.facadeDepthMm != null) created.facadeDepthMm = s.facadeDepthMm;
    if (s.topPlankHeight != null) created.topPlankHeight = s.topPlankHeight;
    if (s.bottomPlankHeightMm != null) created.bottomPlankHeightMm = s.bottomPlankHeightMm;

    if (s.division?.variantIndex != null && Number.isFinite(Number(s.division.variantIndex))) {
      try {
        applySectionDivisionVariant(created.id, Number(s.division.variantIndex));
      } catch (e) {
        console.warn('[IKEA fixture] division variant', e);
      }
    }
    if (s.division?.customZoneWidthsMm && typeof s.division.customZoneWidthsMm === 'object') {
      try {
        const partsN = Math.max(
          1,
          Math.floor(Number(s.division.parts) || 0) ||
            Object.keys(s.division.customZoneWidthsMm).length
        );
        setSectionParts(created.id, partsN);
        const entries = Object.entries(s.division.customZoneWidthsMm)
          .map(([k, v]) => [Number(k), Number(v)])
          .filter(([k, v]) => Number.isFinite(k) && v > 0)
          .sort((a, b) => a[0] - b[0]);
        for (const [zi, w] of entries) {
          setZoneCustomWidthMm(created.id, zi, w);
        }
        // setZone помечает user; восстановить origin из save (auto vs карандаш).
        const src = s.division.customZoneWidthsSource;
        if (src === 'auto' || src === 'user') {
          try {
            if (typeof window.__cldKitchenSectionLayout?.markCustomZoneWidthsSource === 'function') {
              window.__cldKitchenSectionLayout.markCustomZoneWidthsSource(created, src, {
                bandId: 'base',
                division: true,
              });
            } else if (created.division) {
              created.division.customZoneWidthsSource = src;
            }
          } catch (_) {}
        }
      } catch (e) {
        console.warn('[IKEA fixture] customZoneWidthsMm', e);
      }
    } else if (
      s.division?.customZoneWidthsSource === 'auto' ||
      s.division?.customZoneWidthsSource === 'user'
    ) {
      try {
        if (created.division) {
          created.division.customZoneWidthsSource = s.division.customZoneWidthsSource;
        }
      } catch (_) {}
    }
    applySectionTrimStudioLookForSectionId(created.id);

    const grids = s.kitchenBandGrids;
    if (grids && typeof grids === 'object') {
      try {
        applyKitchenBandZoneGrids(created, grids);
      } catch (e) {
        console.warn('[IKEA fixture] kitchenBandGrids', e);
      }
    }
  }

  const furniture = Array.isArray(fixture.furniture) ? fixture.furniture : [];
  let placed = 0;
  const uuidMap = new Map();
  const decorGroups = [];
  for (const item of furniture) {
    try {
      const res = restoreOneFurniture(item, sectionIdMap);
      if (res?.group) {
        placed += 1;
        if (res.oldUuid) uuidMap.set(String(res.oldUuid), res.group.uuid);
        if (res.needsDecor) decorGroups.push(res.group);
      }
    } catch (e) {
      console.warn('[IKEA fixture] furniture restore failed', e);
    }
  }

  if (decorGroups.length) {
    try {
      const bust =
        (typeof window !== 'undefined' && window.__CLD_BUILD) || '20261030-draft1';
      const fm = await import(`./furniture-manager.js?v=20261031-side4b`);
      const applyDecor = fm.applyStep5DecorToFurnitureGroupImmediate;
      if (typeof applyDecor === 'function') {
        for (const g of decorGroups) {
          try {
            applyDecor(g);
            refreshCabinetStudioAfterDecor(g, { syncLight: false });
          } catch (e) {
            console.warn('[IKEA fixture] decor restore', e);
          }
        }
      } else {
        limitations.push('step5 decor apply API missing after dynamic import');
      }
    } catch (e) {
      console.warn('[IKEA fixture] decor module import', e);
      limitations.push('step5 decor restore skipped (import failed)');
    }
  }

  const lj = restoreLShapeAndJoints(fixture, sectionIdMap, uuidMap);
  if (lj.limitations?.length) limitations.push(...lj.limitations);

  // Stage12D: atomic jointId → canonical (sectionA/B); then Stage12B seat.
  let jointRemap = null;
  let jointRevive = null;
  try {
    jointRemap = atomicRemapKitchenJointIdsAfterRestore();
    if (jointRemap?.ok === false) {
      limitations.push(`joint id remap failed: ${jointRemap.reason || 'conflict'}`);
      console.warn('[IKEA fixture] joint id remap failed', jointRemap);
    } else if (jointRemap?.remapped > 0) {
      console.info('[IKEA fixture] joint id remap ok', {
        remapped: jointRemap.remapped,
        jointIds: jointRemap.jointIds,
      });
    }
  } catch (e) {
    jointRemap = { ok: false, reason: String(e?.message || e) };
    limitations.push(`joint id remap exception: ${jointRemap.reason}`);
    console.warn('[IKEA fixture] joint id remap exception', e);
  }

  if (jointRemap?.ok !== false) {
    try {
      jointRevive = reviveKitchenJointsAfterRestore();
      if (jointRevive?.ok) {
        const pending =
          'lShape/kitchenJoints restored as metadata only (pending reviveKitchenJointsAfterRestore)';
        const idx = limitations.indexOf(pending);
        if (idx >= 0) limitations.splice(idx, 1);
        if (jointRevive.revived > 0) {
          console.info('[IKEA fixture] joint revive ok', {
            revived: jointRevive.revived,
            jointIds: jointRevive.jointIds,
          });
        }
      } else if (jointRevive && jointRevive.skipped !== true) {
        limitations.push(
          `joint revive failed: ${jointRevive.reason || 'invariants'}`
        );
        console.warn('[IKEA fixture] joint revive failed', jointRevive);
      }
    } catch (e) {
      jointRevive = { ok: false, reason: String(e?.message || e) };
      limitations.push(`joint revive exception: ${jointRevive.reason}`);
      console.warn('[IKEA fixture] joint revive exception', e);
    }
  } else {
    jointRevive = { ok: false, reason: 'skipped_after_remap_fail', skipped: true };
  }

  syncAllSectionTrimStudio(state.scene);

  // Stage8: тот же ceiling tiers, что после смены высоты комнаты.
  // Вызов ПОСЛЕ room + kitchenProject + sections + furniture (на пустой сцене tiers no-op).
  // Не создаёт модули; rebuild in-place. Dirty не зовёт; фаза restoring режет autosave.
  let ceilingTiers = null;
  if (placed > 0) {
    try {
      const eng =
        typeof window !== 'undefined' ? window.__cldKitchenBaseEngine : null;
      if (eng && typeof eng.applyKitchenCeilingTiersToScene === 'function') {
        ceilingTiers = eng.applyKitchenCeilingTiersToScene();
      } else if (
        typeof window !== 'undefined' &&
        typeof window.__clodisApplyKitchenCeilingTiersToModules === 'function'
      ) {
        ceilingTiers = window.__clodisApplyKitchenCeilingTiersToModules();
      } else {
        limitations.push('ceiling tiers API missing after furniture restore');
      }
    } catch (e) {
      console.warn('[IKEA fixture] ceiling tiers after restore', e);
      limitations.push(`ceiling tiers after restore: ${String(e?.message || e)}`);
    }
  }

  const step = Number(fixture.step) || 3;
  try {
    goToRoomStepByNumber(step);
  } catch (e) {
    console.warn('[IKEA fixture] goToStep', e);
  }

  if (fixture.camera?.position && state.camera) {
    state.camera.position.fromArray(fixture.camera.position);
    if (fixture.camera.target && state.controls?.target) {
      state.controls.target.fromArray(fixture.camera.target);
      state.controls.update?.();
    }
  }

  const hasStructure = sectionIdMap.size > 0 || placed > 0;
  // Stage9: пустой намеренный / room-only / openings / kitchen overrides — тоже ok.
  const emptyProjectOk = !hasStructure && isContinuableRoomDraft(fixture);

  return {
    ok: hasStructure || emptyProjectOk,
    sections: sectionIdMap.size,
    furniture: placed,
    openings: roomExtras.openings,
    roomEditObjects: roomExtras.roomEditObjects,
    room: roomApply,
    ceilingTiers,
    jointRemap,
    jointRevive,
    intentionallyEmpty: fixture.intentionallyEmpty === true,
    step,
    limitations,
  };
}

export async function maybeAutoRestoreIkeaRoomFixture() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  if (params.get('ikeaFixture') !== '1') return null;
  try {
    const fixture = await loadIkeaRoomFixtureFromServer();
    const result = await restoreIkeaRoomFixture(fixture);
    console.info('[IKEA fixture] auto-restore', result);
    window.__cldIkeaFixtureLastRestore = result;
    return result;
  } catch (e) {
    console.warn('[IKEA fixture] auto-restore failed', e);
    window.__cldIkeaFixtureLastRestore = { ok: false, error: String(e?.message || e) };
    return window.__cldIkeaFixtureLastRestore;
  }
}

function inspectFixture(fixture) {
  if (!fixture) {
    return { ok: false, reason: 'no_draft', key: ROOM_DRAFT_LS_KEY };
  }
  const sections = Array.isArray(fixture.sections) ? fixture.sections : [];
  const furniture = Array.isArray(fixture.furniture) ? fixture.furniture : [];
  const topModes = furniture.map((f) => ({
    name: f.catalogName,
    placementKind: f.placementKind,
    kitchenTopDepthMode: f.kitchenTopDepthMode,
    kitchenTopCustomDepthMm: f.kitchenTopCustomDepthMm,
    kitchenTopDepthUserLocked: f.kitchenTopDepthUserLocked,
    customDepthMm: f.customDepthMm,
    kitchenCarcassDepthMm: f.kitchenCarcassDepthMm,
    hasDecor: !!(f.step5ModuleOutside || f.step5ModuleInside),
  }));
  return {
    ok: true,
    key: ROOM_DRAFT_LS_KEY,
    version: fixture.version ?? null,
    kind: fixture.kind,
    exportedAt: fixture.exportedAt ?? null,
    step: fixture.step ?? null,
    room: fixture.room ?? null,
    kitchenRoomShapeKey: fixture.kitchenRoomShapeKey ?? null,
    sections: sections.length,
    furniture: furniture.length,
    openings: Array.isArray(fixture.openings) ? fixture.openings.length : 0,
    roomEditObjects: Array.isArray(fixture.roomEditObjects)
      ? fixture.roomEditObjects.length
      : 0,
    kitchenJoints: fixture.kitchenJoints ? Object.keys(fixture.kitchenJoints).length : 0,
    bandGridsSections: sections.filter((s) => s?.kitchenBandGrids).length,
    lShapeSections: sections.filter((s) => s?.lShape).length,
    empty: isEmptyFixture(fixture),
    furnitureDepth: topModes,
  };
}

/**
 * Stage2/9: сохранить черновик в localStorage (тот же формат collect).
 * @param {{ forceEmpty?: boolean, allowEmpty?: boolean }} [opts]
 * allowEmpty — только после явного user-clear (furniture_delete / sections_clear),
 * не при boot/restoring и не из «просто editing».
 */
export function saveRoomDraft(opts = {}) {
  const forceEmpty = opts?.forceEmpty === true;
  const allowEmpty = opts?.allowEmpty === true;
  let fixture;
  try {
    fixture = collectIkeaRoomFixture();
  } catch (e) {
    const err = {
      ok: false,
      reason: 'collect_threw',
      error: String(e?.message || e),
    };
    console.error('[room-draft] collect failed', err);
    return err;
  }
  const existing = readRoomDraftRaw();
  if (
    !forceEmpty &&
    !allowEmpty &&
    isEmptyFixture(fixture) &&
    existing &&
    !isEmptyFixture(existing)
  ) {
    const summary = {
      ok: false,
      reason: 'empty_overwrite_blocked',
      key: ROOM_DRAFT_LS_KEY,
      existing: inspectFixture(existing),
      incoming: inspectFixture(fixture),
    };
    console.warn('[room-draft] save blocked', summary);
    return summary;
  }
  // Пустой snapshot: пометить намеренную очистку (Continue + restore ok).
  if (isEmptyFixture(fixture)) {
    if (allowEmpty || forceEmpty || existing?.intentionallyEmpty === true) {
      fixture.intentionallyEmpty = true;
    }
  } else if (fixture && typeof fixture === 'object') {
    delete fixture.intentionallyEmpty;
  }
  try {
    localStorage.setItem(ROOM_DRAFT_LS_KEY, JSON.stringify(fixture));
  } catch (e) {
    const err = {
      ok: false,
      reason: 'storage_error',
      error: String(e?.message || e),
    };
    console.error('[room-draft] save failed', err);
    return err;
  }
  const summary = {
    ok: true,
    ...inspectFixture(fixture),
    intentionallyEmpty: fixture.intentionallyEmpty === true,
    allowEmpty: allowEmpty || forceEmpty,
  };
  console.info('[room-draft] saved', summary);
  return summary;
}

/** Stage2: восстановить черновик из localStorage. */
export async function loadRoomDraft() {
  if (typeof window !== 'undefined' && !window.__CLD_REFACTORED_INIT__) {
    const err = { ok: false, reason: 'constructor_not_ready' };
    console.warn('[room-draft] load', err);
    return err;
  }
  if (!state.scene) {
    return { ok: false, reason: 'scene_not_ready' };
  }
  const fixture = readRoomDraftRaw();
  if (!fixture) {
    return { ok: false, reason: 'no_draft', key: ROOM_DRAFT_LS_KEY };
  }
  // Структурно пустой draft ОК, если есть пользовательский kitchenProject / openings.
  if (!isContinuableRoomDraft(fixture)) {
    return { ok: false, reason: 'draft_empty', inspect: inspectFixture(fixture) };
  }
  try {
    const result = await restoreIkeaRoomFixture(fixture);
    const summary = { ok: !!result?.ok, restore: result, inspect: inspectFixture(fixture) };
    console.info('[room-draft] loaded', summary);
    window.__cldRoomDraftLastLoad = summary;
    return summary;
  } catch (e) {
    const err = { ok: false, reason: 'restore_failed', error: String(e?.message || e) };
    console.error('[room-draft] load failed', err);
    window.__cldRoomDraftLastLoad = err;
    return err;
  }
}

/** Stage2: инспекция сохранённого черновика без restore. */
export function inspectRoomDraft() {
  const summary = inspectFixture(readRoomDraftRaw());
  console.info('[room-draft] inspect', summary);
  return summary;
}

export function installIkeaRoomFixtureConsole() {
  if (typeof window === 'undefined') return;
  window.__cldExportIkeaRoomFixture = exportIkeaRoomFixture;
  window.__cldCollectIkeaRoomFixture = collectIkeaRoomFixture;
  window.__cldRestoreIkeaRoomFixture = async () => {
    const fixture = await loadIkeaRoomFixtureFromServer();
    return restoreIkeaRoomFixture(fixture);
  };
  window.__cldIkeaFixtureFile = IKEA_FIXTURE_FILE;
  window.__cldSaveRoomDraft = saveRoomDraft;
  window.__cldLoadRoomDraft = loadRoomDraft;
  window.__cldInspectRoomDraft = inspectRoomDraft;
  window.__cldRoomDraftKey = ROOM_DRAFT_LS_KEY;
  window.__cldIsContinuableRoomDraft = isContinuableRoomDraft;
  window.__cldKitchenProjectHasUserOverrides = kitchenProjectHasUserOverrides;
}
