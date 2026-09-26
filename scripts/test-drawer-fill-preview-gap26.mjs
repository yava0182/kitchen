/**
 * Превью наполнения: один проход apply, зазор под полкой 26 мм (как в шкафу).
 */
import fs from 'fs';
import { applyFillPoliciesToCatalogTemplateTree } from '../js/furniture/furniture-interior-layout.js';
import '../js/furniture/furniture-interior-templates.js';

const H = 1950;
const c38 = JSON.parse(
  fs.readFileSync(new URL('../catalog_items/catalog_38.json', import.meta.url), 'utf8')
);
const item = c38.find((x) => x.id === 5);
const section = item.data.constructor_structure.children.find(
  (n) => String(n.type).toLowerCase() === 'fill_section'
);
const flat = JSON.parse(
  JSON.stringify(section.children.filter((c) => /ящик|полк/i.test(String(c.name || ''))))
);

const layout = JSON.parse(JSON.stringify(item.data.interiorLayout));
layout.zones[1].drawerRules.count = 5;
layout.zones[1].drawerRules.gapMm = 28;
layout.zones[1].drawerRules.topShelfGapMm = 26;

const catalogItem = {
  ...item.data,
  id: 5,
  catalog_type: 'catalog_38',
  interiorLayout: layout,
  shelfStack: { enabled: true, distribution: 'even', stepMm: 290, shelfThicknessMm: 16, maxCount: 12 },
  drawerStack: { enabled: true, gapMm: 28, maxCount: 8 },
  data: { ...item.data, interiorLayout: layout },
};

let tree = JSON.parse(JSON.stringify(flat));
tree = applyFillPoliciesToCatalogTemplateTree(tree, catalogItem, {
  sectionSizeMm: { x: 400, y: H, z: 600 },
  variables: { h_bottom: 0, h_top: 0 },
  catalogTypeHint: 'catalog_38',
  forPreview: true,
});

const ys = tree
  .filter((c) => /ящик/i.test(String(c.name || '')))
  .map((d) => Number(d.pos?.y))
  .sort((a, b) => a - b);
const top = ys[ys.length - 1];
const split = 975;
const gapShelf = split - 8 - (top + 162);
const ok = ys.length === 5 && Math.abs(gapShelf - 26) < 1 && top >= 770;
console.log(ok ? 'PASS fill preview single apply gap26' : 'FAIL fill preview gap', { ys, gapShelf });
process.exit(ok ? 0 : 1);
