/**
 * 50/50 even: глобальный стек = те же Y, что при 100% (разделитель = средняя полка).
 */
import fs from 'fs';
import {
  applyFillPoliciesToCatalogTemplateTree,
  applyInteriorFillToRoomRoots,
} from '../js/furniture/furniture-interior-layout.js';
import { normalizeShelfStackPolicy, computeShelfLayout } from '../js/furniture/furniture-shelf-stack.js';

const H = 1950;
const t = 16;
const policy = normalizeShelfStackPolicy({
  enabled: true,
  distribution: 'even',
  stepMm: 290,
  maxCount: 12,
  shelfThicknessMm: 16,
});

const fullSpan = H - 2 * t;
const fullStack = computeShelfLayout(fullSpan, policy, t);
const fullYs = fullStack.positionsFromBottomMm.map((p) => t + p);
const splitY = Math.round(H / 2);

const c38 = JSON.parse(
  fs.readFileSync(new URL('../catalog_items/catalog_38.json', import.meta.url), 'utf8')
);
const item = c38.find((x) => x.id === 10);
const data = item.data || item;
const layoutBothShelves = {
  zones: [
    {
      name: 'Верх',
      position: 'top',
      heightPercent: 50,
      content: 'shelves',
      id: 'z_top',
    },
    {
      name: 'Низ',
      position: 'bottom',
      heightPercent: 50,
      content: 'shelves',
      id: 'z_bot',
    },
  ],
};

const section = (data.constructor_structure?.children || []).find(
  (n) => String(n?.type || '').toLowerCase() === 'fill_section'
);
const tree = [JSON.parse(JSON.stringify(section))];
const catalogItem = {
  ...data,
  id: 10,
  interiorLayout: layoutBothShelves,
  data: { ...data, interiorLayout: layoutBothShelves },
};

applyInteriorFillToRoomRoots(tree, {
  layout: layoutBothShelves,
  policy,
  sectionSizeMm: { x: 600, y: H, z: 600 },
  variables: { h_bottom: 0 },
  corpusLocalFill: true,
  preserveManualShelves: false,
});

const shelfYs = (tree[0]?.children || [])
  .filter((c) => /полк/i.test(String(c.name || '')))
  .filter(
    (c) =>
      c.sectionLayoutRole !== 'zone_divider' && !String(c.id || '').includes('split')
  )
  .map((s) => Number(s.pos?.y))
  .filter((y) => Number.isFinite(y))
  .sort((a, b) => a - b);

const divider = (tree[0]?.children || []).find(
  (s) => s.sectionLayoutRole === 'zone_divider' || String(s.id || '').includes('split')
);
const dividerY = Number(divider?.pos?.y);

const below = fullYs.filter((y) => y < splitY - 8);
const above = fullYs.filter((y) => y > splitY + 8);

const matchDivider = Math.abs(dividerY - splitY) < 4;
const matchBelow = below.every((y) => shelfYs.includes(y));
const matchAbove = above.every((y) => shelfYs.includes(y));
const matchCount = shelfYs.length === below.length + above.length;

const ok = matchDivider && matchBelow && matchAbove && matchCount;
console.log('100% Y', fullYs);
console.log('50/50 shelves Y', shelfYs, 'divider', dividerY);
console.log(ok ? 'PASS 50/50 global even' : 'FAIL', {
  matchDivider,
  matchBelow,
  matchAbove,
  matchCount,
});
process.exit(ok ? 0 : 1);
