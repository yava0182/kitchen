/**
 * Экспорт snapshot комнаты для assembly-player.
 * Не меняет логику комнаты — только читает state и сохраняет JSON.
 */
import { state } from '../utils/state.js';
import { computeFurnitureWorldBBoxNoAo } from '../furniture/furniture-bbox.js?v=20261011-bbox-fix2';
import { serializeFurnitureVisualMeshes } from './assembly-mesh-export.js';
import {
  buildAntresolScenarioFromGroup,
  buildCorpusScenarioFromGroup,
} from './assembly-scenario-builder.js';

const THREE = typeof window !== 'undefined' ? window.THREE : null;

export const ASSEMBLY_EXPORT_LS_KEY = 'cld_assembly_room_export_v1';
const DEMO_SCENARIO_BASE = '/data/assembly/demo';

function collectFurnitureRootGroups() {
  const candidates = [];
  if (!state?.scene) return candidates;
  state.scene.traverse((obj) => {
    if (!obj?.isGroup || !obj.userData?.isFurniture) return;
    let p = obj.parent;
    while (p && p !== state.scene) {
      if (p.isGroup && p.userData?.isFurniture) return;
      p = p.parent;
    }
    candidates.push(obj);
  });

  const modules = candidates.filter((g) => {
    const ud = g.userData || {};
    return !!(
      ud.__clodisDataForBuild ||
      ud.__clodisRoots ||
      ud.catalogName ||
      ud.catalogItemId ||
      ud.__initialSectionSizeMm
    );
  });

  const pool = modules.length ? modules : candidates;
  return dedupeLargestPerSection(pool);
}

/** В одной секции оставляем один корень — самый крупный (основной шкаф, не фасад/дверь). */
function dedupeLargestPerSection(groups) {
  const best = new Map();
  for (const g of groups) {
    const ud = g.userData || {};
    const key = `${ud.sectionId ?? 'none'}:${ud.zoneIndex ?? 0}`;
    let vol = 0;
    try {
      const bb = computeFurnitureWorldBBoxNoAo(g);
      const s = bb.getSize(new THREE.Vector3());
      vol = s.x * s.y * s.z;
    } catch (_) {}
    const prev = best.get(key);
    if (!prev || prev.vol < vol) best.set(key, { g, vol });
  }
  return [...best.values()].map((x) => x.g);
}

function walkClodisNodes(root, cb) {
  if (!root) return;
  const queue = Array.isArray(root) ? [...root] : [root];
  while (queue.length) {
    const n = queue.shift();
    if (!n || typeof n !== 'object') continue;
    cb(n);
    if (Array.isArray(n.children)) queue.push(...n.children);
  }
}

function moduleHasAntresolSection(ud) {
  const roots = ud.__clodisRoots || (ud.__clodisDataForBuild ? [ud.__clodisDataForBuild] : []);
  let found = false;
  for (const root of roots) {
    walkClodisNodes(root, (n) => {
      const lr = String(n.layout_role || n.layoutRole || '').toLowerCase();
      const name = String(n.name || '').toLowerCase();
      if (lr === 'top' || /антресол/.test(name)) found = true;
    });
  }
  return found;
}

function sortedFurnitureDimsMm(sizeVec) {
  const arr = [
    Math.abs(sizeVec.x),
    Math.abs(sizeVec.y),
    Math.abs(sizeVec.z),
  ]
    .filter((n) => n > 1)
    .sort((a, b) => a - b);
  if (arr.length < 3) {
    return {
      w: Math.round(Math.abs(sizeVec.x)),
      h: Math.round(Math.abs(sizeVec.y)),
      d: Math.round(Math.abs(sizeVec.z)),
    };
  }
  return { d: Math.round(arr[0]), w: Math.round(arr[1]), h: Math.round(arr[2]) };
}

function resolveAntresolHeightMm(ud, totalHeightMm) {
  const maxAnt = Math.max(280, Math.round(totalHeightMm * 0.38));
  const vars = ud.__clodisVariables || ud.clodisVariables || {};
  const v = Number(vars.corpus_antresol_mm ?? vars.antresol_mm ?? vars.antresol_height_mm);
  if (Number.isFinite(v) && v >= 200 && v <= maxAnt) {
    return Math.round(v);
  }
  return Math.min(420, Math.max(300, Math.round(totalHeightMm * 0.15)));
}

function buildDefaultParts(ud, antresolHeightMm, group, moduleMeta) {
  const meta = moduleMeta || {};
  const corpusScenario = group ? buildCorpusScenarioFromGroup(group, meta) : null;
  const parts = [
    {
      id: 'corpus',
      label: 'Корпус шкафа',
      scenarioUrl: corpusScenario ? undefined : `${DEMO_SCENARIO_BASE}/scenario-corpus-stub.json`,
      scenario: corpusScenario || undefined,
      recommendedFirst: true,
    },
  ];
  if (moduleHasAntresolSection(ud) || antresolHeightMm > 0) {
    const antScenario = group ? buildAntresolScenarioFromGroup(group, meta) : null;
    parts.push({
      id: 'antresol',
      label: 'Антресоль',
      scenarioUrl: antScenario ? undefined : `${DEMO_SCENARIO_BASE}/scenario-antresol.json`,
      scenario: antScenario || undefined,
    });
  }
  return parts;
}

function resolveNicheFromRoom() {
  const secs = Array.isArray(state.customSections) ? state.customSections : [];
  if (secs.length) {
    let widthMm = 0;
    let heightMm = 0;
    let depthMm = 0;
    for (const s of secs) {
      const sz = s.size || s.group?.userData?.sectionSize || {};
      widthMm = Math.max(widthMm, Number(sz.x) || 0);
      heightMm = Math.max(heightMm, Number(sz.y) || 0);
      depthMm = Math.max(depthMm, Number(sz.z) || 0);
    }
    if (widthMm > 0) {
      return {
        widthMm,
        heightMm: heightMm || 2700,
        depthMm: depthMm || 600,
        sectionId: secs[0].id,
        wallName: secs[0].wallName || 'back',
      };
    }
  }
  return { widthMm: 2400, heightMm: 2700, depthMm: 600, sectionId: null, wallName: 'back' };
}

function furnitureToModule(group, index, nicheOrigin) {
  const ud = group.userData || {};
  group.updateMatrixWorld(true);
  const bb = computeFurnitureWorldBBoxNoAo(group);
  const size = bb.getSize(new THREE.Vector3());
  const min = bb.min.clone();
  const { w, h, d } = sortedFurnitureDimsMm(size);

  const posX = Math.round(min.x - nicheOrigin.x);
  const posY = 0;
  const posZ = Math.round(min.z - nicheOrigin.z);

  const hasAntresol = moduleHasAntresolSection(ud);
  const antH = hasAntresol ? resolveAntresolHeightMm(ud, h) : 0;
  const corpusH = hasAntresol ? Math.max(h - antH, Math.round(h * 0.55)) : h;

  const visualMeshes = serializeFurnitureVisualMeshes(group, { corpusHeightMm: corpusH });
  const moduleMeta = {
    fullDimensionsMm: { w, h, d },
    dimensionsMm: { w, h: corpusH, d },
    antresolDimensionsMm: hasAntresol ? { w, h: antH, d } : null,
    visualMeshes,
  };

  return {
    id: ud.sectionId ? `mod_${ud.sectionId}_${index}` : `furniture_${index}`,
    label: ud.catalogName || group.name || `Модуль ${index + 1}`,
    positionMm: [posX, posY, posZ],
    fullDimensionsMm: { w, h, d },
    dimensionsMm: { w, h: corpusH, d },
    antresolDimensionsMm: hasAntresol ? { w, h: antH, d } : null,
    sectionId: ud.sectionId ?? null,
    zoneIndex: ud.zoneIndex ?? null,
    catalogName: ud.catalogName || null,
    visualMeshes,
    parts: buildDefaultParts(ud, antH, group, moduleMeta),
    exportMeta: {
      worldBBoxMin: [Math.round(min.x), Math.round(min.y), Math.round(min.z)],
      worldSizeMm: { w, h, d },
      corpusHeightMm: corpusH,
      antresolHeightMm: antH,
      visualPanelCount: visualMeshes.panelCount,
    },
  };
}

/**
 * @returns {object} room-snapshot для assembly-player
 */
export function buildAssemblySnapshotFromRoom() {
  if (!THREE) throw new Error('Three.js не загружен');
  const groups = collectFurnitureRootGroups();
  if (!groups.length) {
    throw new Error('В комнате нет размещённой мебели. Сначала поставьте модуль в секцию.');
  }
  if (groups.length > 1) {
    console.warn('[assembly-export] несколько модулей:', groups.length, groups.map((g) => g.userData?.catalogName));
  }

  const niche = resolveNicheFromRoom();
  const nicheOrigin = new THREE.Vector3(0, 0, 0);
  const primarySection = (state.customSections || []).find((s) => s.id === niche.sectionId) ||
    state.customSections?.[0];
  if (primarySection?.group) {
    primarySection.group.updateMatrixWorld(true);
    const sbb = new THREE.Box3().setFromObject(primarySection.group);
    nicheOrigin.set(sbb.min.x, 0, sbb.min.z);
  }

  const modules = groups.map((g, i) => furnitureToModule(g, i, nicheOrigin));

  return {
    version: 1,
    source: 'room',
    exportedAt: new Date().toISOString(),
    orderId: `room-${Date.now()}`,
    label: 'Из комнаты',
    niche: {
      widthMm: niche.widthMm,
      heightMm: niche.heightMm,
      depthMm: niche.depthMm,
      wallName: niche.wallName,
      sectionId: niche.sectionId,
    },
    modules,
  };
}

export function saveAssemblySnapshot(snapshot) {
  localStorage.setItem(ASSEMBLY_EXPORT_LS_KEY, JSON.stringify(snapshot));
  return snapshot;
}

export function loadAssemblySnapshotFromStorage() {
  try {
    const raw = localStorage.getItem(ASSEMBLY_EXPORT_LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Экспорт + открытие assembly-player в новой вкладке.
 */
export function exportRoomToAssemblyAndOpen() {
  const snapshot = buildAssemblySnapshotFromRoom();
  saveAssemblySnapshot(snapshot);
  const url = `${location.origin}${location.pathname.replace(/[^/]*$/, '')}assembly-player.html?source=room`;
  window.open(url, '_blank');
  console.log('[assembly-export] saved', snapshot);
  return snapshot;
}

/**
 * Только скачать JSON (Shift+клик).
 */
export function downloadAssemblySnapshotJson() {
  const snapshot = buildAssemblySnapshotFromRoom();
  saveAssemblySnapshot(snapshot);
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `assembly_export_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  return snapshot;
}

if (typeof window !== 'undefined') {
  window.__cldExportRoomToAssembly = exportRoomToAssemblyAndOpen;
  window.__cldDownloadAssemblySnapshot = downloadAssemblySnapshotJson;
}
