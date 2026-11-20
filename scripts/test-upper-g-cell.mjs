/**
 * Геометрия контура MID Г-ячейки (без browser).
 * node scripts/test-upper-g-cell.mjs
 */

function buildUpperGCellPlanPolygon(armMm, depthAMm, depthBMm) {
  const A = Math.round(Number(armMm) || 600);
  const dA = Math.round(Number(depthAMm) || 350);
  const dB = Math.round(Number(depthBMm) || 350);
  return [
    { u: 0, v: 0 },
    { u: A, v: 0 },
    { u: A, v: dA },
    { u: dB, v: dA },
    { u: dB, v: A },
    { u: 0, v: A },
  ];
}

let failed = 0;
function assert(name, cond) {
  if (!cond) {
    failed += 1;
    console.error('FAIL', name);
  } else console.log('PASS', name);
}

const p = buildUpperGCellPlanPolygon(600, 350, 350);
assert('6 vertices', p.length === 6);
assert('starts at corner', p[0].u === 0 && p[0].v === 0);
assert('host arm 600', p[1].u === 600 && p[1].v === 0);
assert('host depth 350', p[2].u === 600 && p[2].v === 350);
assert('inner reentrant', p[3].u === 350 && p[3].v === 350);
assert('other arm 600', p[4].u === 350 && p[4].v === 600);
assert('other wall end', p[5].u === 0 && p[5].v === 600);

// Площадь Г = 600*350 + 600*350 - 350*350 (угол один раз)
const areaBoxes = 600 * 350 + 600 * 350 - 350 * 350;
assert('area formula 297500', areaBoxes === 297500);

// Нет точки внутри «дырки» квадрата (350..600)×(350..600) на контуре
const holeCorner = p.some((q) => q.u === 600 && q.v === 600);
assert('no far outer corner on poly', !holeCorner);

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nAll upper-G plan checks passed');
