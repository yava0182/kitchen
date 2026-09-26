/**
 * 50/50: зона опускается до drawer_top; штанга+полка внутри зоны; у крыши — полка по сетке.
 */
import fs from 'fs';
import {
  applyFillPoliciesToCatalogTemplateTree,
  computeRodZoneExpansionAutoSteps,
} from '../js/furniture/furniture-interior-layout.js';
import { applyInteriorDrawerStackToRoots, predictDrawerTopShelfAbsY } from '../js/furniture/furniture-drawer-stack.js';
import '../js/furniture/furniture-interior-templates.js';

const H = 1950;
const c38 = JSON.parse(
  fs.readFileSync(new URL('../catalog_items/catalog_38.json', import.meta.url), 'utf8')
);
const item = c38.find((x) => x.id === 5);
const data = item.data || item;
const section = (data.constructor_structure?.children || []).find(
  (n) => String(n?.type || '').toLowerCase() === 'fill_section'
);

function buildLayout(drawerCount) {
  return {
    zones: [
      {
        position: 'top',
        heightPercent: 50,
        content: 'rod',
        rodRules: { companionMode: 'top_shelf', topShelfGapMm: 80 },
        id: 'zt',
      },
      {
        position: 'bottom',
        heightPercent: 50,
        content: 'drawers',
        drawerRules: {
          anchor: 'bottom',
          count: drawerCount,
          gapMm: 3,
          topShelfGapMm: 26,
          forceShelfAboveDrawers: true,
        },
        id: 'zb',
      },
    ],
  };
}

function runPipeline(layout) {
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
    drawerStack: { enabled: true, gapMm: 3 },
    data: { ...data, interiorLayout: layout },
  };
  let tree = [JSON.parse(JSON.stringify(section))];
  tree = applyFillPoliciesToCatalogTemplateTree(tree, catalogItem, {
    sectionSizeMm: { x: 400, y: H, z: 600 },
    variables: { h_bottom: 0, h_top: 0, _wt: 16 },
    catalogTypeHint: 'catalog_38',
    forPreview: true,
  });
  applyInteriorDrawerStackToRoots(tree, {
    policy: catalogItem.drawerStack,
    interiorLayout: layout,
    sectionSizeMm: { x: 400, y: H, z: 600 },
    variables: { h_bottom: 0 },
    forPreview: true,
    catalogItem,
  });
  return tree;
}

function roles(roots) {
  return (roots[0]?.children || [])
    .filter((c) => /shelf|полк|catalog_29/i.test(String(c.name || c.spec?.element_type || '')))
    .map((s) => ({ y: Number(s.pos?.y), role: String(s.sectionLayoutRole || s.layout_role || '') }))
    .sort((a, b) => a.y - b.y);
}

const sp = { enabled: true, distribution: 'even', stepMm: 290, shelfThicknessMm: 16, maxCount: 12 };
const layout5 = buildLayout(5);
const layout1 = buildLayout(1);
const drawerTop1 = Math.round(predictDrawerTopShelfAbsY({ interiorLayout: layout1, interiorHeightMm: H, drawerHeightMm: 162 }));

const r5 = roles(runPipeline(layout5));
const r1 = roles(runPipeline(layout1));
const rodTop5 = r5.find((s) => s.role === 'rod_top_shelf')?.y;
const rodTop1 = r1.find((s) => s.role === 'rod_top_shelf')?.y;
const ceiling1 = r1.find((s) => s.role === 'rod_zone_ceiling_fill_shelf')?.y;
const zoneTop1 = drawerTop1 + H / 2;

const ok5 = r5.find((s) => s.role === 'zone_divider')?.y === 975 && rodTop5 === 1782;
const baselineTopOffset = H - rodTop5;
const ok1 =
  computeRodZoneExpansionAutoSteps({ interiorHeightMm: H, layout: layout1, shelfPolicy: sp, drawerHeightMm: 162 }) === 1 &&
  r1.find((s) => s.role === 'zone_divider')?.y === drawerTop1 &&
  rodTop1 != null &&
  rodTop1 < rodTop5 &&
  Math.abs(rodTop1 - (zoneTop1 - baselineTopOffset)) < 8 &&
  ceiling1 != null &&
  ceiling1 > zoneTop1 + 100;

console.log('5 drawers', ok5 ? 'PASS' : 'FAIL', { rodTop5 });
console.log('1 drawer', ok1 ? 'PASS' : 'FAIL', { drawerTop1, zoneTop1, rodTop1, ceiling1, r1 });
process.exit(ok5 && ok1 ? 0 : 1);
