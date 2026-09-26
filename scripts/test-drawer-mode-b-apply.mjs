/**
 * Mode B apply — от низа ↑, нижний ящик Y=19 (дефолтный отступ секции).
 */
import fs from 'fs';
import { applyFillPoliciesToCatalogTemplateTree } from '../js/furniture/furniture-interior-layout.js';
import { computeDrawerYPositionsInZone } from '../js/furniture/furniture-drawer-stack.js';
import '../js/furniture/furniture-interior-templates.js';

const H = 1950;
const zoneH = Math.round(H / 2);
const c38 = JSON.parse(
  fs.readFileSync(new URL('../catalog_items/catalog_38.json', import.meta.url), 'utf8')
);
const item = c38.find((x) => x.id === 5 && x.name === 'SA1_3PL_5Y') || c38.find((x) => x.id === 5);
const data = item.data || item;
const section = (data.constructor_structure?.children || []).find(
  (n) => String(n?.type || '').toLowerCase() === 'fill_section'
);

function drawerYs(roots) {
  return (Array.isArray(roots) ? roots : [])
    .filter((c) => /ящик/i.test(String(c?.name || '')))
    .map((d) => Number(d.pos?.y))
    .filter((y) => Number.isFinite(y))
    .sort((a, b) => a - b);
}

function runCount(count, flat) {
  const layout = {
    zones: [
      {
        name: 'Низ',
        position: 'bottom',
        heightPercent: 50,
        content: 'drawers',
        drawerRules: {
          anchor: 'bottom',
          offsetMm: 0,
          count,
          gapMm: 3,
          topShelfGapMm: 26,
          forceShelfAboveDrawers: false,
        },
        id: 'z_bot',
      },
      { name: 'Верх', position: 'top', heightPercent: 50, content: 'shelves', id: 'z_top' },
    ],
  };
  const catalogItem = {
    ...data,
    id: item.id,
    catalog_type: 'catalog_38',
    interiorLayout: layout,
    shelfStack: { enabled: true, distribution: 'even', stepMm: 290, shelfThicknessMm: 16, maxCount: 12 },
    drawerStack: { enabled: true, gapMm: 3 },
    data: { ...data, interiorLayout: layout },
  };
  const base = flat
    ? JSON.parse(JSON.stringify(section.children.filter((c) => /ящик|полк/i.test(c.name || ''))))
    : [JSON.parse(JSON.stringify(section))];
  const applied = applyFillPoliciesToCatalogTemplateTree(base, catalogItem, {
    sectionSizeMm: { x: 400, y: H, z: 600 },
    variables: { h_bottom: 0, h_top: 0, _wt: 16 },
    catalogTypeHint: 'catalog_38',
    forPreview: true,
  });
  return drawerYs(applied);
}

const sampleDrawer = section.children.find((c) => String(c?.spec?.element_type || '') === 'catalog_33');
const drawerH = Math.max(40, Number(sampleDrawer?.size?.y) || 162);
const zone = { bottomMm: 0, heightMm: zoneH };
const rules = { anchor: 'bottom', gapMm: 3 };

const exp3 = computeDrawerYPositionsInZone(zone, drawerH, { ...rules, count: 3 }, 0);
const r3flat = runCount(3, true);
const r1flat = runCount(1, true);

const ok3 = r3flat.length === 3 && r3flat.every((y, i) => Math.abs(y - exp3[i]) < 2);
const ok1 = r1flat.length === 1 && r1flat[0] === 19;
const ok = ok3 && ok1;
console.log('exp3', exp3);
console.log('r3 flat', r3flat);
console.log('r1 flat', r1flat);
console.log(ok ? 'PASS Mode B flat apply' : 'FAIL Mode B flat apply', { ok3, ok1 });
process.exit(ok ? 0 : 1);
