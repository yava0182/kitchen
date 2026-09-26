/**
 * Сгенерировать catalog_items для эталонных модулей (88, 89, 16, 18)
 * и карточку шкафа с clodisJSON из reference_b3d/.
 *
 *   node tools/seed-reference-catalog.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const refDir = path.join(root, 'reference_b3d');
const outDir = path.join(root, 'catalog_items');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function catalogItemFromPlanTree(id, label, elementType, planTree) {
  const tree = Array.isArray(planTree) ? planTree : [planTree];
  return {
    id: String(id),
    name: label || `reference-${id}`,
    element_type: elementType,
    clodisJSON: tree,
    params: { clodisJSON: tree },
    data: JSON.stringify({ clodisJSON: tree }),
  };
}

function groupByElementType(manifest) {
  const map = new Map();
  for (const entry of manifest.items || []) {
    const et = String(entry.elementType || '').trim();
    if (!et) continue;
    if (!map.has(et)) map.set(et, []);
    const file = path.join(refDir, entry.file);
    const tree = readJson(file);
    map.get(et).push(
      catalogItemFromPlanTree(entry.catalogId, entry.label, et, tree)
    );
  }
  return map;
}

const manifest = readJson(path.join(refDir, 'REFERENCE_MANIFEST.json'));
const cabinetPlan = readJson(
  path.join(refDir, manifest.cabinet?.file || 'clodis-cabinet-antresol-dver-v-pol.json')
);
const size = manifest.cabinet?.sizeMm || { x: 400, y: 2600, z: 400 };

fs.mkdirSync(outDir, { recursive: true });

const byType = groupByElementType(manifest);
for (const [et, items] of byType) {
  const safe = et.replace(/[^a-z0-9_]/gi, '_');
  const outPath = path.join(outDir, `reference_catalog_${safe}.json`);
  fs.writeFileSync(outPath, JSON.stringify(items, null, 2), 'utf8');
  console.log('Wrote', outPath, `(${items.length} items)`);
}

const wardrobe = {
  id: 'ref-antresol-dver-v-pol',
  name: manifest.cabinet?.label || 'REF шкаф антресоль',
  width: String(size.x),
  height: String(size.y),
  depth: String(size.z),
  placementKind: 'floor_in_niche',
  clodisJSON: cabinetPlan,
  params: {
    sectionSize: size,
    clodisVariables: {
      vysota_dobora: 50,
      h_bottom: 0,
      h_top: 0,
      tech_zone_mm: 0,
      corpus_antresol_mm: Math.max(0, size.y - 2100),
    },
  },
};

const wardrobePath = path.join(outDir, 'reference_wardrobe_antresol_dver_v_pol.json');
fs.writeFileSync(wardrobePath, JSON.stringify([wardrobe], null, 2), 'utf8');
console.log('Wrote', wardrobePath);

console.log('\nИмпорт в localStorage (комната, после Ctrl+F5):');
for (const [et] of byType) {
  console.log(
    `  fetch('/catalog_items/reference_catalog_${et.replace(/[^a-z0-9_]/gi, '_')}.json').then(r=>r.json()).then(a=>localStorage.setItem('catalog_${et}', JSON.stringify(a)));`
  );
}
console.log(
  "  fetch('/catalog_items/reference_wardrobe_antresol_dver_v_pol.json').then(r=>r.json()).then(a=>localStorage.setItem('catalog_26', JSON.stringify(a)));"
);
