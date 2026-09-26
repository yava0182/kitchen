/**
 * Превью админки: плоское дерево (без fill_section) — apply ящиков должен срабатывать.
 */
import fs from 'fs';
import { applyInteriorDrawerStackToRoots } from '../js/furniture/furniture-drawer-stack.js';
import '../js/furniture/furniture-interior-templates.js';

const H = 1950;
const c38 = JSON.parse(
  fs.readFileSync(new URL('../catalog_items/catalog_38.json', import.meta.url), 'utf8')
);
const item = c38.find((x) => x.name === 'SA1_3PL_5Y');
const section = (item.data || item).constructor_structure.children.find(
  (n) => String(n.type).toLowerCase() === 'fill_section'
);
const flat = JSON.parse(
  JSON.stringify(
    section.children.filter(
      (c) => /ящик|полк/i.test(String(c.name || ''))
    )
  )
);

const layout = {
  zones: [
    { name: 'Верх', position: 'top', heightPercent: 50, content: 'shelves', id: 'zt' },
    {
      name: 'Низ',
      position: 'bottom',
      heightPercent: 50,
      content: 'drawers',
      drawerRules: { anchor: 'below_divider', count: 5, gapMm: 3, topShelfGapMm: 26 },
      id: 'zb',
    },
  ],
};

const tree = flat;
const changed = applyInteriorDrawerStackToRoots(tree, {
  policy: { enabled: true, gapMm: 3 },
  interiorLayout: layout,
  sectionSizeMm: { x: 400, y: H, z: 600 },
  variables: { h_bottom: 0, h_top: 0 },
  catalogItem: item,
  forPreview: true,
});

const ys = tree
  .filter((c) => /ящик/i.test(String(c.name || '')))
  .map((d) => Number(d.pos?.y))
  .sort((a, b) => a - b);

const ok = changed && ys.length === 5 && ys[0] >= 100 && ys[0] <= 125 && ys[4] >= 770;
console.log(ok ? 'PASS flat tree drawer apply' : 'FAIL flat tree drawer apply', { changed, ys });
process.exit(ok ? 0 : 1);
