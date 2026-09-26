/**
 * Этап 2: Mode A в applyInteriorDrawerStack — 50/50 ящики снизу от разделителя.
 */
import fs from 'fs';
import {
  applyFillPoliciesToCatalogTemplateTree,
} from '../js/furniture/furniture-interior-layout.js';
import {
  computeDrawerSlotsBelowCenterDivider,
  selectDrawerSlots,
} from '../js/furniture/furniture-drawer-stack.js';
// Регистрирует __cldResolveInteriorDrawerTemplate / shelf template на globalThis.
import '../js/furniture/furniture-interior-templates.js';

const H = 1950;
const splitY = Math.round(H / 2);
const c38 = JSON.parse(
  fs.readFileSync(new URL('../catalog_items/catalog_38.json', import.meta.url), 'utf8')
);
const item = c38.find((x) => x.id === 5 && x.name === 'SA1_3PL_5Y') || c38.find((x) => x.id === 5);
if (!item) {
  console.error('SA1_3PL_5Y id=5 not found');
  process.exit(2);
}

const data = item.data || item;
const section = (data.constructor_structure?.children || item.constructor_structure?.children || []).find(
  (n) => String(n?.type || '').toLowerCase() === 'fill_section'
);
if (!section) {
  console.error('no fill_section');
  process.exit(2);
}

function drawerYs(roots) {
  return (roots[0]?.children || [])
    .filter((c) => {
      const et = String(c?.spec?.element_type || '').toLowerCase();
      const role = String(c?.layout_role || c?.sectionLayoutRole || '').toLowerCase();
      return et === 'catalog_33' || role === 'drawer' || /ящик/i.test(String(c?.name || ''));
    })
    .map((d) => Number(d.pos?.y))
    .filter((y) => Number.isFinite(y))
    .sort((a, b) => b - a); // top → bottom
}

function runCount(count) {
  const layout = {
    zones: [
      {
        name: 'Низ — ящики',
        position: 'bottom',
        heightPercent: 50,
        content: 'drawers',
        drawerRules: {
          anchor: 'below_divider',
          offsetMm: 0,
          count,
          gapMm: 3,
          topShelfGapMm: 26,
          forceShelfAboveDrawers: true,
        },
        id: 'z_bot',
      },
      {
        name: 'Верх — полки',
        position: 'top',
        heightPercent: 50,
        content: 'shelves',
        id: 'z_top',
      },
    ],
  };
  const catalogItem = {
    ...data,
    id: item.id,
    catalog_type: 'catalog_38',
    interiorLayout: layout,
    shelfStack: {
      enabled: true,
      distribution: 'even',
      stepMm: 290,
      shelfThicknessMm: 16,
      maxCount: 12,
    },
    drawerStack: {
      ...(data.drawerStack || {}),
      enabled: true,
      gapMm: 3,
    },
    data: {
      ...data,
      interiorLayout: layout,
      shelfStack: {
        enabled: true,
        distribution: 'even',
        stepMm: 290,
        shelfThicknessMm: 16,
        maxCount: 12,
      },
      drawerStack: { ...(data.drawerStack || {}), enabled: true, gapMm: 3 },
    },
  };
  const tree = [JSON.parse(JSON.stringify(section))];
  const applied = applyFillPoliciesToCatalogTemplateTree(tree, catalogItem, {
    sectionSizeMm: { x: 600, y: H, z: 600 },
    variables: { h_bottom: 0, h_top: 0, _wt: 16 },
    catalogTypeHint: 'catalog_38',
    forPreview: true,
    debugTag: `test/drawer-mode-a/${count}`,
  });
  return { applied, ys: drawerYs(applied), treeBefore: tree };
}

const sampleDrawer = (section.children || []).find(
  (c) => String(c?.spec?.element_type || '').toLowerCase() === 'catalog_33'
);
const drawerH = Math.max(40, Number(sampleDrawer?.size?.y) || 162);
const gapMm = 3;
const expectedAll = computeDrawerSlotsBelowCenterDivider({
  splitYMm: splitY,
  drawerHeightMm: drawerH,
  gapMm,
  topShelfGapMm: 26,
  shelfThicknessMm: 16,
  floorYMm: 0,
  maxCount: 5,
});

console.log('drawerH', drawerH, 'expected slots', expectedAll);
console.log(
  'template drawers in section',
  (section.children || []).filter((c) => /ящик/i.test(c.name || '')).length
);
console.log('global drawer apply', typeof globalThis.__cldApplyInteriorDrawerStackToRoots);

const r5 = runCount(5);
const r3 = runCount(3);
const r1 = runCount(1);

const exp5 = selectDrawerSlots(expectedAll, 5, 'below_divider');
const exp3 = selectDrawerSlots(expectedAll, 3, 'below_divider');
const exp1 = selectDrawerSlots(expectedAll, 1, 'below_divider');

const same = (a, b) =>
  a.length === b.length && a.every((y, i) => Math.abs(y - b[i]) < 2);

const ok5 = same(r5.ys, exp5);
const ok3 = same(r3.ys, exp3);
const ok1 = same(r1.ys, exp1) && r1.ys[0] === exp5[0];

const divider5 = (r5.applied[0]?.children || []).find(
  (c) =>
    c.sectionLayoutRole === 'zone_divider' || String(c.id || '').includes('split')
);
const hasDivider = divider5 && Math.abs(Number(divider5.pos?.y) - splitY) < 4;

const extraTop = (r5.applied[0]?.children || []).filter(
  (c) => String(c.sectionLayoutRole || '') === 'drawer_top_shelf'
);
const noDupTop = extraTop.length === 0;

const shelvesBelowSplit = (r5.applied[0]?.children || []).filter((c) => {
  const role = String(c.sectionLayoutRole || '');
  if (role === 'zone_divider') return false;
  const et = String(c.spec?.element_type || '').toLowerCase();
  const name = String(c.name || '');
  if (et !== 'catalog_29' && !/полк/i.test(name)) return false;
  return Number(c.pos?.y) < splitY - 2;
});
const noShelfInDrawers = shelvesBelowSplit.length === 0;

const topDrawer = Math.max(...r5.ys);
const drawerTop = topDrawer + drawerH;
const dividerBottom = splitY - 8;
const gapOk = Math.abs(dividerBottom - drawerTop - 27) < 1;

const ok = ok5 && ok3 && ok1 && hasDivider && noDupTop && noShelfInDrawers && gapOk;
console.log('count5', r5.ys);
console.log('count3', r3.ys);
console.log('count1', r1.ys);
console.log(ok ? 'PASS Mode A apply' : 'FAIL Mode A apply', {
  ok5,
  ok3,
  ok1,
  hasDivider,
  noDupTop,
  noShelfInDrawers,
  gapOk,
  dividerBottom,
  drawerTop,
  gap: dividerBottom - drawerTop,
  dividerY: divider5?.pos?.y,
  extraTop: extraTop.length,
  shelvesBelowSplit: shelvesBelowSplit.map((s) => s.pos?.y),
  kids: (r5.applied[0]?.children || []).map((c) => ({
    n: c.name,
    y: c.pos?.y,
    et: c.spec?.element_type,
    role: c.sectionLayoutRole,
  })),
});
process.exit(ok ? 0 : 1);
