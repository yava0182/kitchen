/**
 * count=5, gap=28 мм: верхний ящик у разделителя (зазор 26 мм), не укладка снизу вверх.
 */
import fs from 'fs';
import { resolveDrawerYPositionsForZone } from '../js/furniture/furniture-drawer-stack.js';
import { resolveInteriorZoneSpansMm } from '../js/furniture/furniture-interior-layout.js';

const H = 1950;
const c38 = JSON.parse(
  fs.readFileSync(new URL('../catalog_items/catalog_38.json', import.meta.url), 'utf8')
);
const item = c38.find((x) => x.id === 5);
const layout = JSON.parse(JSON.stringify(item.data.interiorLayout));
layout.zones[1].drawerRules.count = 5;
layout.zones[1].drawerRules.gapMm = 28;
layout.zones[1].drawerRules.topShelfGapMm = 26;
layout.zones[1].drawerRules.offsetMm = 27;

const interior = H - 100;
const zones = resolveInteriorZoneSpansMm(interior, layout);
const z = zones.find((x) => x.content === 'drawers');
const rules = { ...z.drawerRules, count: 5, gapMm: 28, anchor: 'below_divider', topShelfGapMm: 26 };
const resolved = resolveDrawerYPositionsForZone(z, 162, rules, 100, {
  interiorLayout: layout,
  interiorHeightMm: interior,
  maxCount: 8,
});

const ys = resolved.positions.slice().sort((a, b) => a - b);
const top = ys[ys.length - 1];
const split = 100 + 925;
const gapShelf = split - 8 - (top + 162);
const step = 162 + 28;
const ok =
  ys.length === 5 &&
  Math.abs(gapShelf - 26) < 1 &&
  top >= 820 &&
  ys[4] - ys[3] === step;

console.log(ok ? 'PASS gap28 count5 divider anchor' : 'FAIL gap28 count5', { ys, gapShelf });
process.exit(ok ? 0 : 1);
