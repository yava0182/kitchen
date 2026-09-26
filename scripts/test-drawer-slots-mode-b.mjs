/**
 * Mode B — «от низа ↑» в 50/50: стек от дна зоны (offset 19 мм), не сетка разделителя.
 */
import {
  computeDrawerYPositionsInZone,
  resolveDrawerYPositionsForZone,
  usesDividerDrawerSlotGrid,
} from '../js/furniture/furniture-drawer-stack.js';

const H = 1950;
const zoneH = Math.round(H / 2);
const zone = { bottomMm: 0, heightMm: zoneH, content: 'drawers' };
const drawerH = 162;
const gapMm = 3;
const layout = {
  zones: [
    { position: 'bottom', heightPercent: 50, content: 'drawers', id: 'zb' },
    { position: 'top', heightPercent: 50, content: 'shelves', id: 'zt' },
  ],
};
const rules = { anchor: 'bottom', gapMm, count: 0 };

const c5 = computeDrawerYPositionsInZone(zone, drawerH, { ...rules, count: 5 }, 0);
const c3 = computeDrawerYPositionsInZone(zone, drawerH, { ...rules, count: 3 }, 0);
const c1 = computeDrawerYPositionsInZone(zone, drawerH, { ...rules, count: 1 }, 0);

const step = drawerH + gapMm;
const ok1 = c1[0] === 19;
const ok5 = c5.length === 5 && c5[0] === 19 && c5[4] === 19 + 4 * step;
const ok3 = c3.length === 3 && c3[0] === 19 && c3[2] === 19 + 2 * step;

const resolved = resolveDrawerYPositionsForZone(
  zone,
  drawerH,
  { ...rules, count: 1 },
  0,
  { interiorLayout: layout, interiorHeightMm: H }
);
const okResolved =
  !usesDividerDrawerSlotGrid(zone, { anchor: 'bottom' }, layout, H) &&
  !resolved.slotGrid &&
  resolved.positions[0] === 19;

const ok = ok1 && ok5 && ok3 && okResolved;
console.log(ok ? 'PASS Mode B floor stack' : 'FAIL Mode B floor stack', {
  ok1,
  ok5,
  ok3,
  okResolved,
  c1,
  c3,
  c5,
});
process.exit(ok ? 0 : 1);
