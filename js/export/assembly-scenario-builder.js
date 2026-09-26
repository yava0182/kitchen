/**
 * Генерация сценариев сборки из Clodis JSON (__clodisDataForBuild).
 * Использует ClodisBuilder.evaluateSize/Position в комнате (только чтение).
 */
import {
  readUserDataClodisData,
  readUserDataClodisRoots,
  readUserDataClodisVariables,
} from '../clodis-json-fields.js';

const ANTRESOL_STEP_ORDER = [
  'horizontal_bottom',
  'vertical_left',
  'vertical_right',
  'back_front',
  'horizontal_top',
];

const STEP_HINTS = {
  horizontal_bottom: 'Найдите деталь с такой же надписью на наклейке',
  vertical_left: 'Приложите к длинной стороне дна',
  vertical_right: 'Зеркально левому боку',
  back_front: 'Вставьте в паз между боковинами',
  horizontal_top: 'Уложите сверху на боковины',
};

const MATE_PART_KEY = {
  vertical_left: 'horizontal_bottom',
  vertical_right: 'horizontal_bottom',
  back_front: 'vertical_left',
  horizontal_top: 'vertical_left',
};

function normalizeRole(node) {
  return String(node?.layout_role || node?.layoutRole || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');
}

function isActiveNode(node) {
  return !(node?.active === 0 || node?.active === false);
}

function slugPartKey(name, detailTypeId) {
  if (detailTypeId) return String(detailTypeId);
  return String(name || 'part')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function createEvaluator(ud, rootSizeMm) {
  const Builder = typeof window !== 'undefined' ? window.ClodisBuilder : null;
  if (!Builder) return null;

  const builder = new Builder();
  const vars = readUserDataClodisVariables(ud) || ud.__clodisVariables || {};
  const wt = Number(vars._wt) > 0 ? Number(vars._wt) : 16;

  builder.variables = {
    vysota_cokolya: 100,
    glubina_cokolya: 100,
    otstup_paza: 0,
    ...vars,
  };
  builder.groups = {
    g0: { thickness: wt },
    g1: { thickness: 3 },
    hdf1: { thickness: 3 },
  };

  const rs = rootSizeMm || { x: 800, y: 2400, z: 600 };
  builder.rootSectionContext = {
    size: {
      x: Number(rs.x) || 800,
      y: Number(rs.y) || 2400,
      z: Number(rs.z) || 600,
    },
  };

  return builder;
}

function makeSectionCtx(node, size) {
  return {
    name: node?.name || 'section',
    size: { x: size.x, y: size.y, z: size.z },
    sourceItem: node,
    layoutRole: normalizeRole(node),
  };
}

/** Как ClodisBuilder.buildWall: тонкое измерение = thickness по orientation. */
function resolveWallGeometryMm(builder, wallNode, logicalSize) {
  const orientation = String(wallNode?.spec?.orientation || '').toLowerCase();
  const thickness = builder.getMaterialThickness(wallNode?.spec?.material);
  const sx = Number(logicalSize.x) || 0;
  const sy = Number(logicalSize.y) || 0;
  const sz = Number(logicalSize.z) || 0;

  if (orientation === 'v') {
    return { x: thickness, y: sy, z: sz, orientation };
  }
  if (orientation === 'h') {
    return { x: sx, y: thickness, z: sz, orientation };
  }
  if (orientation === 'f') {
    return { x: sx, y: sy, z: thickness, orientation };
  }
  return { x: sx, y: sy, z: sz, orientation: orientation || 'box' };
}

function evalWall(builder, wallNode, parentSection) {
  const logicalSize = builder.evaluateSize(wallNode.size || {}, parentSection);
  const pos = builder.evaluatePosition(wallNode.pos || {}, parentSection, logicalSize);
  const geom = resolveWallGeometryMm(builder, wallNode, logicalSize);
  const pivotObj = wallNode.pivot || { x: -1, y: -1, z: -1 };
  const pivotMm = builder.evaluatePivot(pivotObj, geom);
  const detailTypeId =
    wallNode.spec?.detailTypeId || wallNode.spec?.detail_type_id || '';
  const partKey = slugPartKey(wallNode.name, detailTypeId);

  const centerMm = [
    Math.round(pos.x - pivotMm.x),
    Math.round(pos.y - pivotMm.y),
    Math.round(pos.z - pivotMm.z),
  ];

  return {
    partKey,
    detailTypeId: detailTypeId || partKey,
    label: wallNode.name || partKey,
    sizeMm: [Math.round(geom.x), Math.round(geom.y), Math.round(geom.z)],
    slotMm: {
      pos: [Math.round(pos.x), Math.round(pos.y), Math.round(pos.z)],
      pivot: [pivotObj.x ?? -1, pivotObj.y ?? -1, pivotObj.z ?? -1],
    },
    centerMm,
  };
}

function dedupePartsByDetailType(parts) {
  const seen = new Set();
  const out = [];
  for (const p of parts) {
    const key = p.detailTypeId || p.partKey;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

function isAntresolSection(node) {
  const type = String(node?.type || '').toLowerCase();
  if (type !== 'section' && type !== 'module') return false;
  if (normalizeRole(node) === 'top') return true;
  return /антресол/i.test(String(node?.name || ''));
}

function extractAntresolWalls(builder, node, parentSection) {
  const type = String(node?.type || '').toLowerCase();
  if (type !== 'module' && type !== 'section') return null;

  const size = builder.evaluateSize(node.size || {}, parentSection);
  const ctx = makeSectionCtx(node, size);

  if (isAntresolSection(node)) {
    const walls = [];
    const secCtx = makeSectionCtx(node, size);
    for (const child of node.children || []) {
      if (!isActiveNode(child)) continue;
      if (String(child.type || '').toLowerCase() !== 'wall') continue;
      walls.push(evalWall(builder, child, secCtx));
    }
    return { sectionName: node.name, sectionSize: size, walls };
  }

  for (const child of node.children || []) {
    const found = extractAntresolWalls(builder, child, ctx);
    if (found) return found;
  }
  return null;
}

function orderParts(parts) {
  return [...parts].sort((a, b) => {
    const ia = ANTRESOL_STEP_ORDER.indexOf(a.detailTypeId);
    const ib = ANTRESOL_STEP_ORDER.indexOf(b.detailTypeId);
    if (ia >= 0 && ib >= 0) return ia - ib;
    if (ia >= 0) return -1;
    if (ib >= 0) return 1;
    return String(a.label || '').localeCompare(String(b.label || ''), 'ru');
  });
}

function spawnForPart(part, secSize) {
  const sw = Number(secSize?.x) || part.sizeMm[0] || 800;
  const sh = Number(secSize?.y) || part.sizeMm[1] || 360;
  const d = part.sizeMm[2] || 300;
  const cx = sw / 2;
  const byType = {
    horizontal_bottom: [cx, -120, d + 80],
    vertical_left: [-120, part.sizeMm[1] / 2 + 16, d + 80],
    vertical_right: [sw + 120, part.sizeMm[1] / 2 + 16, d + 80],
    back_front: [cx, part.sizeMm[1] / 2 + 16, -100],
    horizontal_top: [cx, sh + 120, d + 80],
  };
  return byType[part.detailTypeId] || [cx, sh / 2 + 180, d + 160];
}

function buildSteps(parts, secSize) {
  const ordered = orderParts(parts);
  const byKey = new Map(ordered.map((p, i) => [p.partKey, { ...p, no: i + 1 }]));
  const numbered = ordered.map((p, i) => ({ ...p, no: i + 1 }));

  return numbered.map((p, i) => {
    const mateKey = MATE_PART_KEY[p.detailTypeId];
    const mate = mateKey ? byKey.get(mateKey) : null;
    return {
      id: `s${String(i + 1).padStart(2, '0')}`,
      index: i + 1,
      title: p.label,
      hint: STEP_HINTS[p.detailTypeId] || 'Соедините по меткам на детали',
      pickPart: { no: p.no, partKey: p.partKey, label: p.label },
      mateWith: mate
        ? { no: mate.no, partKey: mate.partKey, label: mate.label }
        : null,
      spawnFromMm: spawnForPart(p, secSize),
      highlightHoles: /vertical|horizontal_top/.test(p.detailTypeId),
    };
  });
}

function guessDetailTypeFromName(name) {
  const n = String(name || '').toLowerCase();
  if (/^дено|дно/.test(n)) return 'horizontal_bottom';
  if (/бок.*лев/.test(n)) return 'vertical_left';
  if (/бок.*прав/.test(n)) return 'vertical_right';
  if (/задн/.test(n)) return 'back_front';
  if (/крыш|верх/.test(n)) return 'horizontal_top';
  return '';
}

/** Fallback: панели из visualMeshes (segment antresol). */
export function buildAntresolScenarioFromMeshes(visualMeshes, dimensionsMm) {
  const raw = (visualMeshes?.panels || []).filter((p) => p.segment === 'antresol');
  if (!raw.length) return null;

  const parts = raw.map((p, i) => {
    const detailTypeId = guessDetailTypeFromName(p.name) || `panel_${i}`;
    const sizeMm = [...(p.sizeMm || [1, 1, 1])];
    const centerMm = [...(p.positionMm || [0, 0, 0])];
    return {
      partKey: slugPartKey(p.name, detailTypeId),
      detailTypeId,
      label: p.name || `Деталь ${i + 1}`,
      sizeMm,
      centerMm,
      slotMm: { pos: centerMm, pivot: [0, 0, 0] },
    };
  });

  const ordered = orderParts(parts);
  const secSize = {
    x: dimensionsMm?.w || ordered[0]?.sizeMm[0],
    y: dimensionsMm?.h || 360,
    z: dimensionsMm?.d || ordered[0]?.sizeMm[2],
  };

  const scenarioParts = ordered.map((p, i) => ({ ...p, no: i + 1 }));
  return {
    version: 1,
    constructId: 'antresol_from_meshes',
    moduleLabel: 'Антресоль',
    dimensionsMm: {
      w: Math.round(secSize.x),
      h: Math.round(secSize.y),
      d: Math.round(secSize.z),
    },
    source: 'mesh_fallback',
    parts: scenarioParts,
    steps: buildSteps(scenarioParts, secSize),
  };
}

/**
 * @param {THREE.Group} group
 * @param {{ fullDimensionsMm?: object, antresolDimensionsMm?: object, visualMeshes?: object }} moduleMeta
 */
export function buildAntresolScenarioFromGroup(group, moduleMeta = {}) {
  const ud = group?.userData || {};
  const roots = readUserDataClodisRoots(ud) || readUserDataClodisData(ud);
  const root = Array.isArray(roots) ? roots[0] : roots;

  const rootSize =
    ud.__initialSectionSizeMm ||
    ud.__targetSectionSizeMm ||
    (moduleMeta.fullDimensionsMm
      ? {
          x: moduleMeta.fullDimensionsMm.w,
          y: moduleMeta.fullDimensionsMm.h,
          z: moduleMeta.fullDimensionsMm.d,
        }
      : null);

  const ad = moduleMeta.antresolDimensionsMm;
  const meshFallbackDims = ad
    ? { w: ad.w, h: ad.h, d: ad.d }
    : { w: rootSize?.x, h: 360, d: rootSize?.z };

  if (!root) {
    return buildAntresolScenarioFromMeshes(moduleMeta.visualMeshes, meshFallbackDims);
  }

  const builder = createEvaluator(ud, rootSize);
  if (!builder) {
    return buildAntresolScenarioFromMeshes(moduleMeta.visualMeshes, meshFallbackDims);
  }

  const extracted = extractAntresolWalls(builder, root, null);
  if (!extracted?.walls?.length) {
    return buildAntresolScenarioFromMeshes(moduleMeta.visualMeshes, meshFallbackDims);
  }

  const { sectionName, sectionSize, walls } = extracted;
  const ordered = orderParts(dedupePartsByDetailType(walls));
  const parts = ordered.map((p, i) => ({ ...p, no: i + 1 }));

  return {
    version: 1,
    constructId: 'antresol_from_clodis',
    moduleLabel: sectionName || 'Антресоль',
    dimensionsMm: {
      w: Math.round(sectionSize.x),
      h: Math.round(sectionSize.y),
      d: Math.round(sectionSize.z),
    },
    source: 'clodis',
    parts,
    steps: buildSteps(parts, sectionSize),
  };
}

/**
 * Корпус: пока только дно + боковины из cabinet_root (без цоколя/антресоли/фасадов).
 */
export function buildCorpusScenarioFromGroup(group, moduleMeta = {}) {
  const ud = group?.userData || {};
  const roots = readUserDataClodisRoots(ud) || readUserDataClodisData(ud);
  const root = Array.isArray(roots) ? roots[0] : roots;
  if (!root) return null;

  const builder = createEvaluator(
    ud,
    ud.__initialSectionSizeMm ||
      (moduleMeta.fullDimensionsMm
        ? {
            x: moduleMeta.fullDimensionsMm.w,
            y: moduleMeta.fullDimensionsMm.h,
            z: moduleMeta.fullDimensionsMm.d,
          }
        : null)
  );
  if (!builder) return null;

  const corpusWalls = [];
  const skipRoles = new Set(['top', 'plinth', 'facades', 'facades_main', 'facades_top', 'drawer']);

  function walkCorpus(node, parentSection, depth = 0) {
    const type = String(node?.type || '').toLowerCase();
    if (!isActiveNode(node)) return;
    if (type !== 'module' && type !== 'section') return;

    const role = normalizeRole(node);
    const size = builder.evaluateSize(node.size || {}, parentSection);
    const ctx = makeSectionCtx(node, size);

    if (isAntresolSection(node) || skipRoles.has(role)) {
      return;
    }

    if (role === 'cabinet_root' || role === 'corpus' || depth <= 2) {
      for (const child of node.children || []) {
        const ct = String(child.type || '').toLowerCase();
        if (ct === 'wall' && isActiveNode(child)) {
          corpusWalls.push(evalWall(builder, child, ctx));
        } else if (ct === 'section' || ct === 'module') {
          walkCorpus(child, ctx, depth + 1);
        }
      }
    }
  }

  walkCorpus(root, null, 0);
  if (!corpusWalls.length) return null;

  const dims = moduleMeta.dimensionsMm || moduleMeta.fullDimensionsMm || {};
  const limited = corpusWalls.slice(0, 8);
  const parts = limited.map((p, i) => ({ ...p, no: i + 1 }));

  return {
    version: 1,
    constructId: 'corpus_from_clodis_partial',
    moduleLabel: 'Корпус шкафа',
    dimensionsMm: {
      w: Math.round(dims.w || 800),
      h: Math.round(dims.h || 2200),
      d: Math.round(dims.d || 600),
    },
    source: 'clodis_partial',
    parts,
    steps: parts.map((p, i) => ({
      id: `c${String(i + 1).padStart(2, '0')}`,
      index: i + 1,
      title: p.label,
      hint:
        i === 0
          ? 'Начните сборку корпуса с этой детали'
          : 'Соедините с уже установленными деталями',
      pickPart: { no: p.no, partKey: p.partKey, label: p.label },
      mateWith: i > 0 ? { no: 1, partKey: parts[0].partKey, label: parts[0].label } : null,
      spawnFromMm: spawnForPart(p, dims),
      stub: i > 2,
    })),
  };
}
