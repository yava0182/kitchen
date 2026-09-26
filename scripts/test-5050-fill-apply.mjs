/**
 * Этап 1: 50/50 fill — зоны + раскладка полок/штанги в fill_section.
 */
import fs from 'fs';
import {
  applyFillPoliciesToCatalogTemplateTree,
  resolveInteriorZoneSpansMm,
} from '../js/furniture/furniture-interior-layout.js';

const catalogPath = new URL('../catalog_items/catalog_38.json', import.meta.url);
const items = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const item = items.find((x) => x.id === 3 || x.name === 'SA1_3PL_1H');
if (!item) {
  console.error('SA1_3PL_1H not found');
  process.exit(2);
}

const data = item.data || item;
const layout = data.interiorLayout;
const spans = resolveInteriorZoneSpansMm(1950, layout);
console.log('zones:', spans.map((s) => `${s.name}/${s.content}@${s.bottomMm}-${s.topMm}`).join(' | '));

const tpl =
  data.constructor_structure?.children ||
  data.clodisJSON ||
  [];
const fillRoots = Array.isArray(tpl) ? tpl : tpl.children || [];
const section = fillRoots.find((n) => {
  const t = String(n?.type || '').toLowerCase();
  return t === 'fill_section' || t === 'section';
});
if (!section) {
  console.error('no fill_section');
  process.exit(2);
}

const tree = JSON.parse(JSON.stringify([section]));
const catalogItem = { ...data, id: item.id, catalog_type: 'catalog_38', data };

const applied = applyFillPoliciesToCatalogTemplateTree(tree, catalogItem, {
  sectionSizeMm: { x: 400, y: 1950, z: 600 },
  variables: { h_bottom: 0, h_top: 0, _wt: 16 },
  catalogTypeHint: 'catalog_38',
  debugTag: 'test/5050',
});

const root = applied[0];
const children = root?.children || [];
const shelves = children.filter((c) => /полк|shelf/i.test(String(c.name || '')));
const rods = children.filter((c) => /штанг|rod/i.test(String(c.name || '')));

console.log('shelves:', shelves.length, shelves.map((s) => s.pos?.y).sort((a, b) => a - b));
console.log('rods:', rods.length, rods.map((r) => r.pos?.y));

const splitY = Math.round(1950 / 2);
const rodYs = rods.map((r) => Number(r.pos?.y));
const shelfYs = shelves
  .filter((s) => s.sectionLayoutRole !== 'zone_divider' && !String(s.id || '').includes('split'))
  .map((s) => Number(s.pos?.y));

const rodZone = spans.find((z) => z.content === 'rod');
const shelfZone = spans.find((z) => z.content === 'shelves');
const rodInRodZone =
  rodZone && rodYs.length > 0 && rodYs.every((y) => y >= rodZone.bottomMm && y <= rodZone.topMm);
const shelvesInShelfZone =
  shelfZone &&
  shelfYs.length > 0 &&
  shelfYs.every((y) => y >= shelfZone.bottomMm && y <= shelfZone.topMm);
const divider = shelves.find(
  (s) => s.sectionLayoutRole === 'zone_divider' || String(s.id || '').includes('split')
);
const hasDivider = divider && Math.abs(Number(divider.pos?.y) - splitY) < 30;

const ok = rodInRodZone && shelvesInShelfZone && hasDivider && shelves.length >= 2;
console.log(ok ? 'PASS 50/50 layout' : 'FAIL 50/50 layout', {
  rodInRodZone,
  shelvesInShelfZone,
  hasDivider,
  splitY,
});
process.exit(ok ? 0 : 1);
