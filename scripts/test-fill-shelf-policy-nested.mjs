/**
 * Политика полок fill внутри корпуса: even из catalog_38, не step из catalog_27.
 */
import fs from 'fs';
import { applyFillPoliciesToCatalogTemplateTree } from '../js/furniture/furniture-interior-layout.js';

const c38 = JSON.parse(fs.readFileSync(new URL('../catalog_items/catalog_38.json', import.meta.url), 'utf8'));
const c27 = JSON.parse(fs.readFileSync(new URL('../catalog_items/catalog_27.json', import.meta.url), 'utf8'));
const fill = c38.find((x) => x.id === 10);
const shell = c27.find((x) => x.id === 1);
if (!fill || !shell) {
  console.error('items not found');
  process.exit(2);
}

const fillData = fill.data || fill;
const shellData = shell.data || shell;
const section = (fillData.constructor_structure?.children || []).find(
  (n) => String(n?.type || '').toLowerCase() === 'fill_section'
);
if (!section) {
  console.error('no fill_section');
  process.exit(2);
}

const tree = [JSON.parse(JSON.stringify(section))];
const catalogItem = { ...fillData, id: 10, catalog_type: 'catalog_38', data: fillData };
const shellCatalogItem = { ...shellData, id: 1, catalog_type: 'catalog_27', data: shellData };
const baseOpts = {
  sectionSizeMm: { x: 600, y: 1950, z: 600 },
  variables: { h_bottom: 0, h_top: 0, _wt: 16 },
  catalogTypeHint: 'catalog_38',
  debugTag: 'test/nested-policy',
};

function shelfYs(roots) {
  return (roots[0]?.children || [])
    .filter((c) => /полк/i.test(String(c.name || '')))
    .map((s) => Number(s.pos?.y))
    .filter((y) => Number.isFinite(y))
    .sort((a, b) => a - b);
}

const standalone = applyFillPoliciesToCatalogTemplateTree(JSON.parse(JSON.stringify(tree)), catalogItem, baseOpts);
const nested = applyFillPoliciesToCatalogTemplateTree(JSON.parse(JSON.stringify(tree)), catalogItem, {
  ...baseOpts,
  shellCatalogItem,
});

const ysA = shelfYs(standalone);
const ysB = shelfYs(nested);
console.log('standalone shelves Y:', ysA);
console.log('nested+shell shelves Y:', ysB);

const gaps = (ys) => {
  const all = [975, ...ys, 1950];
  const g = [];
  for (let i = 1; i < all.length; i++) g.push(all[i] - all[i - 1]);
  return g;
};
console.log('standalone gaps (divider..top):', gaps(ysA));
console.log('nested gaps (divider..top):', gaps(ysB));

const same = ysA.length === ysB.length && ysA.every((y, i) => Math.abs(y - ysB[i]) < 2);
console.log(same ? 'PASS same shelf layout' : 'FAIL shelf layout differs');
process.exit(same ? 0 : 1);
