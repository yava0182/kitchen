/**
 * Этап 1: Mode A — слоты ящиков от центральной полки вниз.
 * 5→1: убираем снизу; слот 1 всегда под полкой.
 */
import {
  computeDrawerSlotsBelowCenterDivider,
  selectDrawerSlots,
} from '../js/furniture/furniture-drawer-stack.js';

const H = 1950;
const splitY = Math.round(H / 2); // 975
const drawerH = 162;
const gapMm = 3;
const topShelfGapMm = 26;
const shelfT = 16;

const all = computeDrawerSlotsBelowCenterDivider({
  splitYMm: splitY,
  drawerHeightMm: drawerH,
  gapMm,
  topShelfGapMm,
  shelfThicknessMm: shelfT,
  floorYMm: 0,
  maxCount: 5,
});

console.log('splitY', splitY);
console.log('all slots (bottom Y, top→bottom)', all);

// Слот 1: низ полки − 26 − 162
const expectedFirst = Math.round(splitY - shelfT / 2 - topShelfGapMm - drawerH);
const okFirst = all[0] === expectedFirst;

const c5 = selectDrawerSlots(all, 5, 'below_divider');
const c3 = selectDrawerSlots(all, 3, 'below_divider');
const c1 = selectDrawerSlots(all, 1, 'below_divider');

const ok5 = c5.length === 5 && c5[0] === all[0] && c5[4] === all[4];
const ok3 = c3.length === 3 && c3[0] === all[0] && c3[2] === all[2] && !c3.includes(all[3]);
const ok1 = c1.length === 1 && c1[0] === all[0];

// Зазор полка → верх ящика 1 = 26
const topOfDrawer1 = all[0] + drawerH;
const bottomOfShelf = splitY - shelfT / 2;
const gapShelfToDrawer = bottomOfShelf - topOfDrawer1;
const okGap = Math.abs(gapShelfToDrawer - topShelfGapMm) < 0.5;

// Шаг между низами соседних ящиков
const stepOk =
  all.length >= 2 &&
  all.every((y, i) => (i === 0 ? true : Math.abs(all[i - 1] - y - (drawerH + gapMm)) < 0.5));

const ok = okFirst && ok5 && ok3 && ok1 && okGap && stepOk && all.length === 5;
console.log(ok ? 'PASS Mode A slots' : 'FAIL Mode A slots', {
  okFirst,
  expectedFirst,
  ok5,
  ok3,
  ok1,
  okGap,
  gapShelfToDrawer,
  stepOk,
  c5,
  c3,
  c1,
});
process.exit(ok ? 0 : 1);
