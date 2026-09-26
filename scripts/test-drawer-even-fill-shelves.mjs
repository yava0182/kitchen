/**
 * Якорь bottom, count=1: fill-полка только если шаг сетки >= эталонного (331 слишком близко к drawer_top_shelf).
 */
import fs from 'fs';
import {
  applyFillPoliciesToCatalogTemplateTree,
  computeGlobalEvenShelfAbsYLines,
} from '../js/furniture/furniture-interior-layout.js';
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

const shelfStack = {
  enabled: true,
  distribution: 'even',
  stepMm: 290,
  shelfThicknessMm: 16,
  maxCount: 12,
};

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
  shelfStack,
  drawerStack: { enabled: true, gapMm: 3 },
  data: { ...data, interiorLayout: layout, shelfStack },
};

const tree = applyFillPoliciesToCatalogTemplateTree(flat, catalogItem, {
  sectionSizeMm: { x: 400, y: H, z: 600 },
  variables: { h_bottom: 0, h_top: 0 },
  catalogTypeHint: 'catalog_38',
  forPreview: true,
});

const shelves = tree.filter((c) => /полк/i.test(String(c.name || '')));
const fill = shelves.filter(
  (s) => String(s.sectionLayoutRole || s.layout_role || '') === 'drawer_zone_fill_shelf'
);
const topShelf = shelves.find(
  (s) => String(s.sectionLayoutRole || s.layout_role || '') === 'drawer_top_shelf'
);
const grid = computeGlobalEvenShelfAbsYLines(H, shelfStack, 0, 16);
const minStep = grid.length >= 2 ? Math.min(...grid.slice(1).map((y, i) => y - grid[i])) : 0;

const fillYs = fill.map((s) => Number(s.pos?.y)).sort((a, b) => a - b);
const topY = Number(topShelf?.pos?.y);
const okNo331 = !fillYs.includes(331);
const okStep =
  fillYs.length === 0 ||
  fillYs.every((y, i) => {
    const prev = i === 0 ? topY : fillYs[i - 1];
    return y - prev >= minStep - 1;
  });
const ok = topShelf && okNo331 && okStep;

console.log(ok ? 'PASS drawer even fill min step' : 'FAIL drawer even fill min step', {
  grid,
  minStep,
  fillYs,
  topShelfY: topY,
  okNo331,
});
process.exit(ok ? 0 : 1);
