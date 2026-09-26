/**
 * 50/50 полки + ящики: even_fixed N = разделитель + (N−1) полок вверху на глобальной сетке.
 */
import fs from 'fs';
import { applyFillPoliciesToCatalogTemplateTree } from '../js/furniture/furniture-interior-layout.js';
import { normalizeShelfStackPolicy, computeShelfLayout } from '../js/furniture/furniture-shelf-stack.js';
import '../js/furniture/furniture-interior-templates.js';
import '../js/furniture/furniture-drawer-stack.js';

const H = 1950;
const t = 16;
const splitY = Math.round(H / 2);
const span = H - 2 * t;

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
    { name: 'Верх', position: 'top', heightPercent: 50, content: 'shelves', id: 'zt' },
    {
      name: 'Низ',
      position: 'bottom',
      heightPercent: 50,
      content: 'drawers',
      drawerRules: { anchor: 'bottom', count: 3, gapMm: 3, topShelfGapMm: 26, forceShelfAboveDrawers: true },
      id: 'zb',
    },
  ],
};

function runCase(label, shelfStack) {
  const catalogItem = {
    ...data,
    id: 5,
    catalog_type: 'catalog_38',
    interiorLayout: layout,
    shelfStack,
    drawerStack: { ...(data.drawerStack || {}), enabled: true, gapMm: 3 },
    data: { ...data, interiorLayout: layout, shelfStack },
  };
  let tree = [JSON.parse(JSON.stringify(section))];
  tree = applyFillPoliciesToCatalogTemplateTree(tree, catalogItem, {
    sectionSizeMm: { x: 400, y: H, z: 600 },
    variables: { h_bottom: 0, h_top: 0, _wt: 16 },
    catalogTypeHint: 'catalog_38',
    forPreview: true,
  });
  const shelves = (tree[0]?.children || []).filter((c) => /полк/i.test(String(c.name || '')));
  const divider = shelves.find((s) => s.sectionLayoutRole === 'zone_divider');
  const topYs = shelves
    .filter((s) => s !== divider)
    .map((s) => Number(s.pos?.y))
    .sort((a, b) => a - b);
  return { label, shelves: shelves.length, dividerY: Number(divider?.pos?.y), topYs };
}

const policyEven = normalizeShelfStackPolicy({
  enabled: true,
  distribution: 'even',
  stepMm: 290,
  maxCount: 12,
  shelfThicknessMm: 16,
});
const fullEven = computeShelfLayout(span, policyEven, t);
const gridEvenTop = fullEven.positionsFromBottomMm.map((p) => t + p).filter((y) => y > splitY + 8);

const evenCase = runCase('even', policyEven);
const evenOk =
  evenCase.shelves === 3 &&
  Math.abs(evenCase.dividerY - splitY) < 4 &&
  evenCase.topYs.length === 2 &&
  gridEvenTop.every((y) => evenCase.topYs.includes(y));

const policyFixed3 = normalizeShelfStackPolicy({
  enabled: true,
  distribution: 'even_fixed',
  maxCount: 3,
  shelfThicknessMm: 16,
});
const fixedCase = runCase('even_fixed 3', policyFixed3);
const fixedOk =
  fixedCase.shelves === 3 &&
  Math.abs(fixedCase.dividerY - splitY) < 4 &&
  fixedCase.topYs.length === 2 &&
  gridEvenTop.every((y) => fixedCase.topYs.includes(y));

console.log('even', evenCase, evenOk ? 'PASS' : 'FAIL');
console.log('even_fixed 3', fixedCase, fixedOk ? 'PASS' : 'FAIL');
process.exit(evenOk && fixedOk ? 0 : 1);
