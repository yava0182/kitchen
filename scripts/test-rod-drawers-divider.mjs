/**
 * Штанга сверху + ящики снизу: одна полка-разделитель на 975, без врезания.
 */
import fs from 'fs';
import { applyFillPoliciesToCatalogTemplateTree } from '../js/furniture/furniture-interior-layout.js';
import { applyInteriorDrawerStackToRoots } from '../js/furniture/furniture-drawer-stack.js';
import '../js/furniture/furniture-interior-templates.js';

const H = 1950;
const splitY = Math.round(H / 2);
const c38 = JSON.parse(
  fs.readFileSync(new URL('../catalog_items/catalog_38.json', import.meta.url), 'utf8')
);
const item = c38.find((x) => x.id === 5);
const data = item.data || item;
const section = (data.constructor_structure?.children || []).find(
  (n) => String(n?.type || '').toLowerCase() === 'fill_section'
);

const layout = {
  zones: [
    {
      name: 'Верх',
      position: 'top',
      heightPercent: 50,
      content: 'rod',
      rodRules: { anchor: 'top', offsetMm: 80, companionMode: 'none' },
      id: 'zt',
    },
    {
      name: 'Низ',
      position: 'bottom',
      heightPercent: 50,
      content: 'drawers',
      drawerRules: {
        anchor: 'bottom',
        count: 3,
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
  shelfStack: {
    enabled: true,
    distribution: 'even',
    stepMm: 290,
    shelfThicknessMm: 16,
    maxCount: 12,
  },
  drawerStack: { ...(data.drawerStack || {}), enabled: true, gapMm: 3 },
  data: { ...data, interiorLayout: layout },
};

let tree = [JSON.parse(JSON.stringify(section))];
tree = applyFillPoliciesToCatalogTemplateTree(tree, catalogItem, {
  sectionSizeMm: { x: 400, y: H, z: 600 },
  variables: { h_bottom: 0, h_top: 0, _wt: 16 },
  catalogTypeHint: 'catalog_38',
  forPreview: true,
});

// Повторный проход как в превью админки
const cloned = JSON.parse(JSON.stringify(tree));
applyInteriorDrawerStackToRoots(cloned, {
  policy: catalogItem.drawerStack,
  interiorLayout: layout,
  sectionSizeMm: { x: 400, y: H, z: 600 },
  variables: { h_bottom: 0 },
  forPreview: true,
  catalogItem,
});

function shelfNodes(roots) {
  return (roots[0]?.children || []).filter((c) => {
    const role = String(c.sectionLayoutRole || c.layout_role || '');
    const et = String(c.spec?.element_type || '').toLowerCase();
    return (
      role === 'zone_divider' ||
      role === 'drawer_top_shelf' ||
      et === 'catalog_29' ||
      /полк/i.test(String(c.name || ''))
    );
  });
}

const shelves = shelfNodes(cloned);
const nearSplit = shelves.filter((s) => Math.abs(Number(s.pos?.y) - splitY) <= 30);
const belowSplit = shelves.filter((s) => Number(s.pos?.y) < splitY - 2);
const drawers = (cloned[0]?.children || []).filter(
  (c) => String(c.spec?.element_type || '').toLowerCase() === 'catalog_33'
);
const rods = (cloned[0]?.children || []).filter((c) => /штанг/i.test(String(c.name || '')));

const ok =
  nearSplit.length === 1 &&
  Math.abs(Number(nearSplit[0]?.pos?.y) - splitY) < 2 &&
  drawers.length === 3 &&
  rods.length === 1;

const drawerTopShelf = shelves.find(
  (s) => String(s.sectionLayoutRole || s.layout_role || '').toLowerCase() === 'drawer_top_shelf'
);
const okShelfAbove =
  drawerTopShelf &&
  Number(drawerTopShelf.pos?.y) < splitY - 8 &&
  Number(drawerTopShelf.pos?.y) > 0;
const topDrawerY = Math.max(...drawers.map((d) => Number(d.pos?.y) || 0));
const drawerH = 162;
const shelfT = 16;
const gapShelf =
  Number(drawerTopShelf?.pos?.y) - shelfT / 2 - (topDrawerY + drawerH);
const okGap = okShelfAbove && Math.abs(gapShelf - 26) < 3;

console.log('shelves', shelves.map((s) => ({ y: s.pos?.y, role: s.sectionLayoutRole })));
console.log('drawers', drawers.map((d) => d.pos?.y).sort((a, b) => b - a));
console.log('rods', rods.map((r) => r.pos?.y));
console.log(ok && okGap ? 'PASS rod+drawers divider + shelf above drawers' : 'FAIL', {
  nearSplit: nearSplit.length,
  belowSplit: belowSplit.length,
  totalShelves: shelves.length,
  drawers: drawers.length,
  rods: rods.length,
  okShelfAbove,
  gapShelf,
});

// Регрессия: лишняя полка над ящиками (y≈1025) + разделитель 975
const bugTree = JSON.parse(JSON.stringify(cloned));
const kids = bugTree[0]?.children || [];
kids.push({
  type: 'module',
  id: 'stray_shelf_1025',
  name: 'Полка',
  spec: { id: '6', element_type: 'catalog_29' },
  size: { x: 's:x-32', y: 16, z: 's:z' },
  pos: { x: 16, y: 1025, z: 3 },
  pivot: { x: -1, y: 0, z: -1 },
});
applyInteriorDrawerStackToRoots(bugTree, {
  policy: catalogItem.drawerStack,
  interiorLayout: layout,
  sectionSizeMm: { x: 400, y: H, z: 600 },
  variables: { h_bottom: 0 },
  forPreview: true,
  catalogItem,
});
const shelves2 = shelfNodes(bugTree);
const ok2 =
  shelves2.some((s) => Math.abs(Number(s.pos?.y) - splitY) < 2) &&
  !shelves2.some((s) => Math.abs(Number(s.pos?.y) - 1025) < 5);
console.log(ok2 ? 'PASS stray shelf removed' : 'FAIL stray', shelves2.map((s) => s.pos?.y));
const fillRod = shelves.filter(
  (s) => String(s.sectionLayoutRole || s.layout_role || '').toLowerCase() === 'drawer_zone_fill_shelf'
);
const okNoTightFill = fillRod.length === 0;
console.log(okNoTightFill ? 'PASS no tight fill shelf rod+3drawers' : 'FAIL tight fill', fillRod.map((s) => s.pos?.y));
process.exit(ok && ok2 && okGap && okNoTightFill ? 0 : 1);
