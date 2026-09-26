/**
 * mergeTemplateEdgesWithStep5: edge_variant_id по thickness стороны шаблона (0.4 / 1 мм).
 */
import fs from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(__dirname, '../js/step5-edge-bindings.js'), 'utf8');
const sandbox = { window: {}, globalThis: {} };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.fetch = () => Promise.resolve({ ok: false });
vm.runInContext(src, vm.createContext(sandbox));
const api = sandbox.window.__cldStep5Edge;

const edgeMint = {
  id: 7,
  variants: [
    { name: 'Мята — 1 мм', thickness: 1, price: 60 },
    { name: 'Мята — 0,4 мм', thickness: 0.4, price: 40 },
  ],
};
const edgeChampagne04 = { id: 6, variants: [{ name: 'Сатин 0.4', thickness: 0.4, price: 30 }] };
const edgeChampagne1 = { id: 12, variants: [{ name: 'Сатин 1', thickness: 1, price: 55 }] };

api.ingestEdgeList([edgeMint, edgeChampagne04, edgeChampagne1]);
api.ingestMaterialList([
  { id: 11, name: 'Мята', edge_ids: [7], texture: '/files/decor/mint.jpg' },
  { id: 8, name: 'Сатин', edge_ids: [6, 12], texture: '/files/decor/satin.jpg' },
]);

const templateEdges = {
  2: { enabled: true, thickness: 1, edge_id: '7', edge_name: 'Мята — 1 мм' },
  3: { enabled: true, thickness: 0.4, edge_id: '7', edge_name: 'Мята — 0,4 мм' },
  4: { enabled: true, thickness: 0.4, edge_id: '7', edge_name: 'Мята — 0,4 мм' },
};

const step5Edges = api.makeEdgesObject(
  {
    materialId: 11,
    edgeId: 7,
    edgeVariantId: 1,
    decorTexture: '/files/decor/mint.jpg',
  },
  { panelThicknessMm: 16 },
);

const merged = api.mergeTemplateEdgesWithStep5(templateEdges, step5Edges);

let ok = true;
const assert = (cond, msg) => {
  if (!cond) {
    console.error('FAIL:', msg);
    ok = false;
  }
};

assert(merged[2].edge_variant_id === 0, 'стор.2 (1 мм) → variant 0');
assert(merged[3].edge_variant_id === 1, 'стор.3 (0.4 мм) → variant 1');
assert(merged[4].edge_variant_id === 1, 'стор.4 (0.4 мм) → variant 1');
assert(merged[2].thickness === 1, 'стор.2 thickness из шаблона');
assert(merged[3].thickness === 0.4, 'стор.3 thickness из шаблона');
assert(merged[2].edge_id === '7', 'edge_id из материала шага 5');
assert(merged[2].texture === '/files/decor/mint.jpg', 'текстура из шага 5');

const step5Multi = api.makeEdgesObject(
  {
    materialId: 8,
    edgeId: 6,
    edgeVariantId: 0,
    decorTexture: '/files/decor/satin.jpg',
  },
  { panelThicknessMm: 16 },
);

const mergedMulti = api.mergeTemplateEdgesWithStep5(templateEdges, step5Multi);
assert(mergedMulti[2].edge_id === '12', 'multi edge_ids: 1 мм сторона → id 12');
assert(mergedMulti[3].edge_id === '6', 'multi edge_ids: 0.4 мм сторона → id 6');

if (ok) console.log('OK: step5 edge merge per side thickness');
process.exit(ok ? 0 : 1);
