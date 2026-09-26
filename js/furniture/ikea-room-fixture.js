/**
 * Dev fixture: сохранить комнату (секции/обклад + шкаф) и открыть по ?ikeaFixture=1.
 * Не меняет бизнес-логику размещения — только снимок / восстановление для сверки IKEA света.
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
import { createSectionAtPosition, applySectionDivisionVariant } from '../sections/section-manager.js';
import {
  applyRoomCabinetStudioLook,
  applySectionTrimStudioLookForSectionId,
  syncAllSectionTrimStudio,
} from './room-cabinet-studio.js';
import { goToRoomStepByNumber } from '../ui/room-steps.js';

const THREE = typeof window !== 'undefined' ? window.THREE : null;

export const IKEA_FIXTURE_PROJECT_NAME = 'ikea_light_fixture';
export const IKEA_FIXTURE_PROJECT_ID = 'ikea_v0_cab';
export const IKEA_FIXTURE_FILE = `${IKEA_FIXTURE_PROJECT_NAME}_${IKEA_FIXTURE_PROJECT_ID}.json`;

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
  return {
    sectionStart: div.sectionStart,
    sectionEnd: div.sectionEnd,
    wallName: div.wallName,
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
  }));

  const furniture = furnitureRootGroups(state.scene).map((g) => {
    const ud = g.userData || {};
    const clodisData = readUserDataClodisData(ud) ?? ud[UD_CLODIS_DATA] ?? null;
    const clodisRoots = readUserDataClodisRoots(ud) ?? ud[UD_CLODIS_ROOTS] ?? null;
    const clodisVariables = readUserDataClodisVariables(ud) ?? ud[UD_CLODIS_VARS] ?? null;
    return {
      catalogItemId: ud.catalogItemId ?? null,
      catalogType: ud.catalogType ?? null,
      catalogName: ud.catalogName ?? null,
      sectionId: ud.sectionId ?? null,
      zoneIndex: typeof ud.zoneIndex === 'number' ? ud.zoneIndex : null,
      wallName: ud.wallName ?? null,
      position: { x: g.position.x, y: g.position.y, z: g.position.z },
      rotationY: g.rotation.y,
      scale: { x: g.scale.x, y: g.scale.y, z: g.scale.z },
      clodisData: clodisData ? JSON.parse(JSON.stringify(clodisData)) : null,
      clodisRoots: clodisRoots ? JSON.parse(JSON.stringify(clodisRoots)) : null,
      clodisVariables: clodisVariables ? JSON.parse(JSON.stringify(clodisVariables)) : null,
      initialSectionSizeMm: ud.__initialSectionSizeMm
        ? { ...ud.__initialSectionSizeMm }
        : null,
      catalogSizeMm: ud.__catalogSizeMm ? { ...ud.__catalogSizeMm } : null,
      placementKind: ud.__placementKind ?? null,
      doorLayout: ud.doorLayout ?? null,
      zoneHand: ud.zoneHand ?? null,
      doorKind: ud.doorKind ?? null,
      unifiedFacade: !!ud.unifiedFacade,
      layoutZones: ud.__layoutZones ? JSON.parse(JSON.stringify(ud.__layoutZones)) : null,
      productKind: ud.productKind ?? null,
      hBottomMm: ud.hBottomMm ?? null,
      drawerStackPolicy: ud.drawerStackPolicy ?? null,
      shelfStackPolicy: ud.shelfStackPolicy ?? null,
    };
  });

  const room = state.room
    ? { width: state.room.width, depth: state.room.depth, height: state.room.height }
    : null;

  return {
    version: 1,
    kind: 'ikea-room-fixture',
    exportedAt: new Date().toISOString(),
    step: typeof window !== 'undefined' ? Number(window.currentRoomStep) || 3 : 3,
    stripTrim: false,
    note: 'Секция+обклад+шкаф. Soft cast: только корпус layer2; обклад без soft (тот же шейдер)',
    room,
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
      (typeof window !== 'undefined' &&
        document.body?.innerText?.match(/20260830-p8z\d+/)?.[0]) ||
        '20260830-p8z40'
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
}

function resolveFurnitureCtor() {
  if (typeof window !== 'undefined' && typeof window.Furniture === 'function') {
    return window.Furniture;
  }
  try {
    // Classic script `class Furniture` — lexical global, не всегда на window.
    const ctor = Function('return typeof Furniture !== "undefined" ? Furniture : null')();
    if (typeof ctor === 'function') return ctor;
  } catch (_) {}
  return null;
}

function restoreOneFurniture(item, sectionIdMap) {
  const FurnitureCtor = resolveFurnitureCtor();
  if (!FurnitureCtor || !THREE) {
    throw new Error('Furniture / THREE unavailable');
  }
  const roots = item.clodisRoots || item.clodisData;
  if (!roots) {
    console.warn('[IKEA fixture] skip furniture without clodis', item.catalogName);
    return null;
  }
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
    decorOutside: null,
    decorInside: null,
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
  ud.doorLayout = item.doorLayout;
  ud.zoneHand = item.zoneHand;
  ud.doorKind = item.doorKind;
  ud.unifiedFacade = !!item.unifiedFacade;
  ud.productKind = item.productKind;
  ud.drawerStackPolicy = item.drawerStackPolicy;
  ud.shelfStackPolicy = item.shelfStackPolicy;
  if (item.hBottomMm != null) ud.hBottomMm = item.hBottomMm;
  if (item.layoutZones) ud.__layoutZones = item.layoutZones;

  const oldSid = item.sectionId != null ? String(item.sectionId) : null;
  const newSid = oldSid && sectionIdMap.has(oldSid) ? sectionIdMap.get(oldSid) : oldSid;
  if (newSid != null) ud.sectionId = newSid;
  if (typeof item.zoneIndex === 'number') ud.zoneIndex = item.zoneIndex;
  ud.wallName = item.wallName || 'back';

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
  return g;
}

export async function restoreIkeaRoomFixture(fixture) {
  if (!fixture || fixture.kind !== 'ikea-room-fixture') {
    throw new Error('invalid fixture kind');
  }
  if (!state.scene || !THREE) throw new Error('scene not ready');

  clearRoomFurnitureAndSections();

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
    if (s.division?.variantIndex != null && Number.isFinite(Number(s.division.variantIndex))) {
      try {
        applySectionDivisionVariant(created.id, Number(s.division.variantIndex));
      } catch (e) {
        console.warn('[IKEA fixture] division variant', e);
      }
    }
    applySectionTrimStudioLookForSectionId(created.id);
  }

  const furniture = Array.isArray(fixture.furniture) ? fixture.furniture : [];
  let placed = 0;
  for (const item of furniture) {
    try {
      if (restoreOneFurniture(item, sectionIdMap)) placed += 1;
    } catch (e) {
      console.warn('[IKEA fixture] furniture restore failed', e);
    }
  }

  syncAllSectionTrimStudio(state.scene);

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

  return {
    ok: placed > 0 && sectionIdMap.size > 0,
    sections: sectionIdMap.size,
    furniture: placed,
    step,
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

export function installIkeaRoomFixtureConsole() {
  if (typeof window === 'undefined') return;
  window.__cldExportIkeaRoomFixture = exportIkeaRoomFixture;
  window.__cldCollectIkeaRoomFixture = collectIkeaRoomFixture;
  window.__cldRestoreIkeaRoomFixture = async () => {
    const fixture = await loadIkeaRoomFixtureFromServer();
    return restoreIkeaRoomFixture(fixture);
  };
  window.__cldIkeaFixtureFile = IKEA_FIXTURE_FILE;
}
