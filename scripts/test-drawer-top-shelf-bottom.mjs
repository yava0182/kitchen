/**
 * 50/50, якорь bottom, 1 ящик у дна — полка drawer_top_shelf с зазором topShelfGapMm (26).
 */
import fs from 'fs';
import { applyFillPoliciesToCatalogTemplateTree } from '../js/furniture/furniture-interior-layout.js';
import '../js/furniture/furniture-interior-templates.js';

const H = 1950;
const c38 = JSON.parse(
  fs.readFileSync(new URL('../catalog_items/catalog_38.json', import.meta.url), 'utf8')
);
const item = c38.find((x) => x.id === 5);
const data = item.data || item;
const section = data.constructor_structure.children.find(
  (n) => String(n.type).toLowerCase() === 'fill_section'
);
const flat = JSON.parse(
  JSON.stringify(section.children.filter((c) => /ящик|полк/i.test(String(c.name || ''))))
);

const layout = {
  zones: [
    { name: 'Верх', position: 'top', heightPercent: 50, content: 'shelves', id: 'zt' },
    {
      name: 'Низ',
      position: 'bottom',
      heightPercent: 50,
      content: 'drawers',
      drawerRules: {
        anchor: 'bottom',
        offsetMm: 0,
        count: 1,
        gapMm: 3,
        topShelfGapMm: 26,
        forceShelfAboveDrawers: true,
      },
      id: 'zb',
    },
  ],
};

const catalogItem = {
  ...data,
  id: 5,
  catalog_type: 'catalog_38',
  interiorLayout: layout,
  shelfStack: { enabled: true, distribution: 'even', stepMm: 290, shelfThicknessMm: 16, maxCount: 12 },
  drawerStack: { enabled: true, gapMm: 3 },
  data: { ...data, interiorLayout: layout },
};

const tree = applyFillPoliciesToCatalogTemplateTree(flat, catalogItem, {
  sectionSizeMm: { x: 400, y: H, z: 600 },
  variables: { h_bottom: 0, h_top: 0 },
  catalogTypeHint: 'catalog_38',
  forPreview: true,
});

const drawers = tree.filter((c) => /ящик/i.test(String(c.name || '')));
const shelves = tree.filter((c) => {
  const role = String(c.sectionLayoutRole || c.layout_role || '').toLowerCase();
  return /полк/i.test(String(c.name || '')) || role === 'drawer_top_shelf' || role === 'zone_divider';
});

const drawerY = Number(drawers[0]?.pos?.y);
const drawerH = Number(drawers[0]?.size?.y) || 162;
const topShelf = shelves.find(
  (s) => String(s.sectionLayoutRole || s.layout_role || '').toLowerCase() === 'drawer_top_shelf'
);
const shelfY = Number(topShelf?.pos?.y);
const shelfT = Number(topShelf?.size?.y) || 16;
const drawerTop = drawerY + drawerH;
const shelfBottom = shelfY - shelfT / 2;
const gap = shelfBottom - drawerTop;

const ok =
  drawers.length === 1 &&
  topShelf &&
  Math.abs(gap - 26) < 2 &&
  drawerY >= 15 &&
  drawerY <= 25;

console.log(ok ? 'PASS bottom anchor shelf above drawer' : 'FAIL bottom anchor shelf', {
  drawerY,
  shelfY,
  gap,
  roles: shelves.map((s) => s.sectionLayoutRole || s.layout_role),
});
process.exit(ok ? 0 : 1);
