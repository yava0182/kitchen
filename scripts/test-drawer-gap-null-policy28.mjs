/**
 * gapMm=null в зоне + drawerStack.gapMm=28 не должен давать только 4 ящика при count=5.
 */
import fs from 'fs';
import { applyFillPoliciesToCatalogTemplateTree } from '../js/furniture/furniture-interior-layout.js';
import { applyInteriorDrawerStackToRoots } from '../js/furniture/furniture-drawer-stack.js';
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
layout.zones[1].drawerRules.gapMm = null;

const catalogItem = {
  ...item.data,
  id: 5,
  catalog_type: 'catalog_38',
  interiorLayout: layout,
  shelfStack: { enabled: true, distribution: 'even', stepMm: 290, shelfThicknessMm: 16, maxCount: 12 },
  drawerStack: { enabled: true, gapMm: 28, maxCount: 8 },
  data: {
    ...item.data,
    interiorLayout: layout,
    drawerStack: { enabled: true, gapMm: 28, maxCount: 8 },
  },
};

let tree = JSON.parse(JSON.stringify(flat));
tree = applyFillPoliciesToCatalogTemplateTree(tree, catalogItem, {
  sectionSizeMm: { x: 400, y: H, z: 600 },
  variables: { h_bottom: 0, h_top: 0 },
  catalogTypeHint: 'catalog_38',
  forPreview: true,
});
applyInteriorDrawerStackToRoots(tree, {
  policy: catalogItem.drawerStack,
  interiorLayout: layout,
  sectionSizeMm: { x: 400, y: H, z: 600 },
  variables: { h_bottom: 100, h_top: 0 },
  catalogItem,
  forPreview: true,
});

const ys = tree
  .filter((c) => /ящик/i.test(String(c.name || '')))
  .map((d) => Number(d.pos?.y))
  .sort((a, b) => a - b);

const ok = ys.length === 5 && ys[0] >= 150 && ys[4] >= 800;
console.log(ok ? 'PASS drawer gap null ignores facade policy 28' : 'FAIL drawer gap null', { ys });
process.exit(ok ? 0 : 1);
