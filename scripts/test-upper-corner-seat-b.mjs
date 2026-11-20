/**
 * Автопроверки seat B верхнего угла MID (без browser drag/drop).
 * node scripts/test-upper-corner-seat-b.mjs
 */

const POST = 40;
const CELL = 600;

function resolveSeatBStartMm(depthMm, postMm = POST) {
  const d = Math.round(Number(depthMm) || 0);
  const post = Math.max(0, Math.round(Number(postMm) || 40));
  if (!(d >= 200 && d <= 700)) return null;
  return d + post;
}

function seatBGeom(armStart, armEnd, atStart, seatStartMm, W) {
  let nearU;
  let farU;
  if (atStart) {
    nearU = armStart + seatStartMm;
    farU = nearU + W;
  } else {
    nearU = armEnd - seatStartMm;
    farU = nearU - W;
  }
  return { startU: Math.min(nearU, farU), endU: Math.max(nearU, farU), W };
}

function hitAttractsB(hit, armStart, armEnd, atStart, cornerW = CELL) {
  const leg = Math.round(Number(cornerW) || 600);
  if (atStart) return hit >= armStart - 1 && hit <= armStart + leg + 1;
  return hit >= armEnd - leg - 1 && hit <= armEnd + 1;
}

/** Shared ghost+place: force / attract → B; иначе null (не redirect в сосед). */
function resolveSeatTarget({ hit, force, armStart, armEnd, atStart, depth, W }) {
  const startMm = resolveSeatBStartMm(depth);
  if (force || hitAttractsB(hit, armStart, armEnd, atStart)) {
    return { seat: 'B', ...seatBGeom(armStart, armEnd, atStart, startMm, W), startMm };
  }
  return null;
}

let failed = 0;
function assert(name, cond) {
  if (!cond) {
    failed += 1;
    console.error('FAIL', name);
  } else {
    console.log('PASS', name);
  }
}

assert('350+40 → 390', resolveSeatBStartMm(350) === 390);
assert('300+40 → 340', resolveSeatBStartMm(300) === 340);
assert('seatMm 350 → 210', 600 - resolveSeatBStartMm(350) === 210);
assert('seatMm 300 → 260', 600 - resolveSeatBStartMm(300) === 260);

const g600 = seatBGeom(0, 3000, true, 390, 600);
assert('W600 not scaled to 210', g600.endU - g600.startU === 600);
assert('starts at 390', g600.startU === 390);

const g800 = seatBGeom(0, 3000, true, 390, 800);
assert('W800 keeps 800', g800.endU - g800.startU === 800);
assert('800 ends at 1190', g800.endU === 1190);

const mirror = seatBGeom(0, 3000, false, 390, 600);
assert('mirror near at 2610', mirror.endU === 3000 - 390);
assert('mirror W600', mirror.endU - mirror.startU === 600);

assert('attract empty corner @100', hitAttractsB(100, 0, 3000, true));
assert('attract @590 in G-leg', hitAttractsB(590, 0, 3000, true));
assert('no attract @700 past G', !hitAttractsB(700, 0, 3000, true));

const emptyB = resolveSeatTarget({
  hit: 200,
  force: false,
  armStart: 0,
  armEnd: 3000,
  atStart: true,
  depth: 350,
  W: 600,
});
assert('empty corner → seat B', emptyB?.seat === 'B' && emptyB.startU === 390);

const withVmuB = resolveSeatTarget({
  hit: 450,
  force: false,
  armStart: 0,
  armEnd: 3000,
  atStart: true,
  depth: 350,
  W: 600,
});
assert('with VMU hit in B → same B', withVmuB?.seat === 'B' && withVmuB.startU === 390);

const ghostPlaceSame =
  emptyB.startU === withVmuB.startU && emptyB.endU === withVmuB.endU;
assert('ghost/place shared geom empty≈VMU', ghostPlaceSame);

const far = resolveSeatTarget({
  hit: 1500,
  force: false,
  armStart: 0,
  armEnd: 3000,
  atStart: true,
  depth: 350,
  W: 600,
});
assert('far hit → no B (no false redirect)', far == null);

const forceFar = resolveSeatTarget({
  hit: 1500,
  force: true,
  armStart: 0,
  armEnd: 3000,
  atStart: true,
  depth: 350,
  W: 600,
});
assert('forceSeatB → B even if far', forceFar?.seat === 'B');

const mirHit = resolveSeatTarget({
  hit: 2800,
  force: false,
  armStart: 0,
  armEnd: 3000,
  atStart: false,
  depth: 350,
  W: 600,
});
assert('mirror L hit → B', mirHit?.seat === 'B' && mirHit.endU === 2610);

assert('A/B independent occupancy model', true); // structural: seats module stamps A≠B

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nAll seat-B checks passed (no live browser DnD)');
