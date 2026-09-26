#!/usr/bin/env node
/**
 * Разбор CFRN (или file.json) → читаемый JSON: панели, крепёж, отверстия в мм.
 *
 * Использование:
 *   node tools/parse-cfrn.mjs path/to/export.cfrn
 *   node tools/parse-cfrn.mjs path/to/file.json -o public/data/my_holes.json
 *   node tools/parse-cfrn.mjs export.cfrn --compare-clodis
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  IDENTITY_MATRIX,
  loadCfrnFile,
  mat4Multiply,
  panelSizeFromContour,
  resolveHoleSpec,
  resolveMaterialName,
  roundMm,
  roundVec3,
  transformDir,
  transformPoint,
} from './cfrn-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const CLODIS_TEMPLATE_1 = {
  id: 1,
  name: 'Конфирмат T-стык (бок + полка)',
  face: { diameter: 8, depth: 16, x: 8 },
  edge: { diameter: 5, depth: 35, x: 16, y: 16 },
  scheme: { offsetFromBase: 50, step: 32 },
};

function usage() {
  console.log(`Usage: node tools/parse-cfrn.mjs <file.cfrn|file.json> [-o out.json] [--compare-clodis]`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (!args.length || args.includes('-h') || args.includes('--help')) usage();
  let input = null;
  let output = null;
  let compareClodis = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '-o' || a === '--out') {
      output = args[++i];
      continue;
    }
    if (a === '--compare-clodis') {
      compareClodis = true;
      continue;
    }
    if (!a.startsWith('-') && !input) input = a;
  }
  if (!input) usage();
  if (!output) {
    const base = input.replace(/\.(cfrn|json)$/i, '');
    output = `${base}.holes.json`;
  }
  return { input, output, compareClodis };
}

function nodeLabel(table, node, fallbackPath) {
  const obj = table?.objects?.[node?.tableIndex];
  if (obj?.name) return String(obj.name);
  return fallbackPath || 'node';
}

function walkModel(nodes, table, parentMatrix, parentPath, acc) {
  for (const node of nodes || []) {
    const localM = Array.isArray(node.matrix) && node.matrix.length === 16 ? node.matrix : IDENTITY_MATRIX;
    const worldM = mat4Multiply(parentMatrix, localM);
    const label = nodeLabel(table, node, parentPath);
    const pathStr = parentPath ? `${parentPath} / ${label}` : label;
    const tbl = table?.objects?.[node.tableIndex];

    if (tbl) {
      if (tbl.objType === 2) {
        const size = panelSizeFromContour(tbl.contour);
        acc.panels.push({
          path: pathStr,
          name: tbl.name || label,
          thickness: tbl.thickness ?? null,
          material: resolveMaterialName(table, tbl),
          sizeMm: size,
          tableIndex: node.tableIndex,
          matrixWorld: worldM.map((v) => roundMm(v, 6)),
        });
      }

      if (tbl.objType === 5 && Array.isArray(tbl.holes) && tbl.holes.length) {
        const holes = [];
        for (const h of tbl.holes) {
          const spec = resolveHoleSpec(table, h.infoIndex);
          const local = roundVec3(h.pos);
          const world = roundVec3(transformPoint(worldM, h.pos));
          const dirLocal = roundVec3(h.dir, 4);
          const dirWorld = roundVec3(transformDir(worldM, h.dir), 4);
          holes.push({
            localMm: local,
            worldMm: world,
            dirLocal,
            dirWorld,
            diameter: spec?.diameter ?? null,
            depth: spec?.depth ?? null,
            infoIndex: h.infoIndex,
          });
        }
        acc.fasteners.push({
          path: pathStr,
          name: tbl.name || label,
          material: resolveMaterialName(table, tbl),
          tableIndex: node.tableIndex,
          holeCount: holes.length,
          holes,
        });
      }

      if (tbl.objType === 5 && tbl.triangleData != null) {
        acc.models.push({
          path: pathStr,
          name: tbl.name || label,
          material: resolveMaterialName(table, tbl),
          triangleIndex: tbl.triangleData,
          stl: table?.triangles?.[tbl.triangleData] || null,
        });
      }

      if (tbl.objType === 7) {
        acc.sections.push({ path: pathStr, name: tbl.name || label, isAssemblyUnit: !!tbl.isAssemblyUnit });
      }
    }

    if (Array.isArray(node.objs) && node.objs.length) {
      walkModel(node.objs, table, worldM, pathStr, acc);
    }
  }
}

function summarizeDiameterPairs(fasteners) {
  const pairs = new Map();
  for (const f of fasteners) {
    for (const h of f.holes) {
      const key = `${h.diameter}|${h.depth}`;
      if (!pairs.has(key)) pairs.set(key, { diameter: h.diameter, depth: h.depth, count: 0 });
      pairs.get(key).count += 1;
    }
  }
  return [...pairs.values()].sort((a, b) => b.count - a.count);
}

function compareWithClodisTemplate1(fasteners) {
  const t = CLODIS_TEMPLATE_1;
  const faceKey = `${t.face.diameter}|${t.face.depth}`;
  const edgeKey = `${t.edge.diameter}|${t.edge.depth}`;
  let faceCount = 0;
  let edgeCount = 0;
  const samples = { face: [], edge: [] };

  for (const f of fasteners) {
    for (const h of f.holes) {
      const key = `${h.diameter}|${h.depth}`;
      if (key === faceKey) {
        faceCount++;
        if (samples.face.length < 5) samples.face.push({ ...h, fastener: f.name, path: f.path });
      }
      if (key === edgeKey) {
        edgeCount++;
        if (samples.edge.length < 5) samples.edge.push({ ...h, fastener: f.name, path: f.path });
      }
    }
  }

  return {
    template: t.name,
    expected: {
      face: `${t.face.diameter}×${t.face.depth} мм (пласть)`,
      edge: `${t.edge.diameter}×${t.edge.depth} мм (торец)`,
    },
    found: { faceHoles: faceCount, edgeHoles: edgeCount },
    match:
      faceCount > 0 && edgeCount > 0
        ? 'partial — пары Ø/глубина найдены; координаты сверять по localMm/worldMm'
        : faceCount > 0 || edgeCount > 0
          ? 'weak — найдена только одна пара Ø/глубина'
          : 'none — в CFRN нет пар 8×16 и 5×35',
    samples,
  };
}

function inferSeamSpacing(fasteners) {
  /** Группы отверстий одного крепежа на одной панели — шаг вдоль оси с max разбросом */
  const steps = [];
  for (const f of fasteners) {
    if (f.holeCount < 2) continue;
    const xs = f.holes.map((h) => h.localMm?.x ?? 0);
    const ys = f.holes.map((h) => h.localMm?.y ?? 0);
    const zs = f.holes.map((h) => h.localMm?.z ?? 0);
    const ranges = [
      { axis: 'x', r: Math.max(...xs) - Math.min(...xs) },
      { axis: 'y', r: Math.max(...ys) - Math.min(...ys) },
      { axis: 'z', r: Math.max(...zs) - Math.min(...zs) },
    ].sort((a, b) => b.r - a.r);
    const axis = ranges[0].axis;
    const coords = f.holes.map((h) => h.localMm?.[axis] ?? 0).sort((a, b) => a - b);
    const deltas = [];
    for (let i = 1; i < coords.length; i++) {
      const d = roundMm(coords[i] - coords[i - 1]);
      if (d > 1) deltas.push(d);
    }
    if (deltas.length) {
      steps.push({
        fastener: f.name,
        path: f.path,
        axis,
        holeCount: f.holeCount,
        deltasMm: deltas,
        medianStepMm: roundMm(deltas.sort((a, b) => a - b)[Math.floor(deltas.length / 2)]),
      });
    }
  }
  return steps;
}

async function main() {
  const { input, output, compareClodis } = parseArgs(process.argv);
  const { source, fileJson } = await loadCfrnFile(input);

  if (!fileJson?.model?.objs || !fileJson?.table?.objects) {
    throw new Error('Некорректный file.json: нужны model.objs и table.objects');
  }

  const acc = { panels: [], fasteners: [], models: [], sections: [] };
  walkModel(fileJson.model.objs, fileJson.table, IDENTITY_MATRIX, '', acc);

  const diameterStats = summarizeDiameterPairs(acc.fasteners);
  const seamSpacing = inferSeamSpacing(acc.fasteners);

  const out = {
    source: path.basename(source),
    sourcePath: source,
    parsedAt: new Date().toISOString().slice(0, 10),
    parser: 'tools/parse-cfrn.mjs',
    modelParams: fileJson.modelParams || null,
    summary: {
      panels: acc.panels.length,
      fastenerGroups: acc.fasteners.length,
      totalHoles: acc.fasteners.reduce((n, f) => n + f.holeCount, 0),
      stlModels: acc.models.length,
      sections: acc.sections.length,
      diameterPairs: diameterStats,
    },
    seamSpacingHints: seamSpacing,
    panels: acc.panels,
    fasteners: acc.fasteners,
    models: acc.models,
    sections: acc.sections,
    notes: [
      'localMm — в системе координат панели (как в CFRN при экспорте из Clodis).',
      'worldMm — после умножения матриц дерева model.objs.',
      'Для сверки с шаблоном №1 Clodis смотрите пары diameter×depth и localMm на полках/стойках.',
    ],
  };

  if (compareClodis) {
    out.clodisTemplate1Comparison = compareWithClodisTemplate1(acc.fasteners);
  }

  const outAbs = path.resolve(output);
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  fs.writeFileSync(outAbs, JSON.stringify(out, null, 2), 'utf8');

  console.log(`Wrote ${outAbs}`);
  console.log(
    `  panels=${out.summary.panels} fasteners=${out.summary.fastenerGroups} holes=${out.summary.totalHoles}`
  );
  if (diameterStats.length) {
    console.log('  diameter×depth:', diameterStats.map((p) => `${p.diameter}×${p.depth}×${p.count}`).join(', '));
  }
  if (compareClodis && out.clodisTemplate1Comparison) {
    console.log('  Clodis template #1:', out.clodisTemplate1Comparison.match);
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
