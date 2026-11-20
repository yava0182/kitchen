/**
 * STEP 2V: clearance for fixed 16mm side overlay.
 * node scripts/test-kitchen-side-panels-clearance.mjs
 */
import {
  KITCHEN_SIDE_PANEL_OVERLAY_THICKNESS_MM,
  buildKitchenModuleCorpusBoxMm,
  evaluateKitchenSidePanelClearance,
  kitchenSidePanelBoxesOverlapYZ,
  normalizeKitchenSidePanelBoxMm,
} from '../js/kitchen/kitchen-side-panels-clearance.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('[FAIL]', msg);
  } else {
    console.log('[OK]', msg);
  }
}

assert(KITCHEN_SIDE_PANEL_OVERLAY_THICKNESS_MM === 16, 'overlay thickness 16');

const REQ = 16;

function baseBox(id, u0, width, y0 = 100, h = 720, z0 = 10, d = 550) {
  return buildKitchenModuleCorpusBoxMm({
    id,
    kind: 'module',
    zoneStartU: u0,
    widthMm: width,
    y0,
    heightMm: h,
    z0,
    depthMm: d,
  });
}

function tallBox(id, u0, width) {
  return buildKitchenModuleCorpusBoxMm({
    id,
    kind: 'tall',
    zoneStartU: u0,
    widthMm: width,
    y0: 0,
    heightMm: 2100,
    z0: 0,
    depthMm: 560,
  });
}

function wallMidBox(id, u0, width) {
  return buildKitchenModuleCorpusBoxMm({
    id,
    kind: 'module',
    zoneStartU: u0,
    widthMm: width,
    y0: 1400,
    heightMm: 720,
    z0: 0,
    depthMm: 350,
  });
}

// --- invalid / unknown ---
{
  const a = evaluateKitchenSidePanelClearance(null);
  assert(a.status === 'unknown' && a.reasonCode === 'invalid_context', 'null → unknown');
  assert(a.availableMm === null && a.requiredMm === 16, 'null keeps required 16, available null');
  const b = evaluateKitchenSidePanelClearance({
    face: 'minU',
    subject: baseBox('a', 0, 600),
  });
  assert(b.status === 'unknown' && b.reasonCode === 'insufficient_bounds', 'no bounds → unknown');
  const c = evaluateKitchenSidePanelClearance({
    subject: baseBox('a', 0, 600),
    section: { u0: 0, u1: 3000 },
  });
  assert(c.status === 'unknown' && c.reasonCode === 'missing_face', 'no face → unknown');
}

// --- two lower cabinets flush → blocked ---
{
  const left = baseBox('nm-left', 0, 600);
  const right = baseBox('nm-right', 600, 600);
  const r = evaluateKitchenSidePanelClearance({
    face: 'minU',
    subject: right,
    occupiers: [left, right],
    section: { u0: 0, u1: 1200 },
  });
  assert(r.status === 'blocked', 'flush lowers → blocked');
  assert(r.availableMm === 0, 'flush available 0');
  assert(r.requiredMm === REQ, 'required 16');
  assert(r.blockerId === 'nm-left', 'blocker is left neighbor');
}

// --- free end with confirmed ≥16 mm → clear ---
{
  const mod = baseBox('nm-end', 16, 600);
  const r = evaluateKitchenSidePanelClearance({
    face: 'minU',
    subject: mod,
    occupiers: [],
    section: { u0: 0, u1: 2000 },
  });
  assert(r.status === 'clear', '16mm to section wall → clear');
  assert(r.availableMm === 16, 'availableMm=16');
  assert(r.blockerId === null, 'no blocker on clear');
}

// --- upper overlay independent of lower (no Y overlap) ---
{
  const lower = baseBox('nm', 0, 600);
  const upper = wallMidBox('wm', 0, 600);
  assert(!kitchenSidePanelBoxesOverlapYZ(lower, upper), 'lower/upper Y do not overlap');
  // Upper face minU: only section bound; lower not relevant
  const upClear = evaluateKitchenSidePanelClearance({
    face: 'minU',
    subject: upper,
    occupiers: [lower],
    section: { u0: -20, u1: 2000 },
  });
  assert(upClear.status === 'clear' && upClear.availableMm === 20, 'upper clear despite lower flush U');
  // Lower face: tall-like flush neighbor blocks lower only
  const lowerNeighbor = baseBox('nm2', 600, 600);
  const lowBlocked = evaluateKitchenSidePanelClearance({
    face: 'maxU',
    subject: lower,
    occupiers: [lowerNeighbor],
    section: { u0: 0, u1: 2000 },
  });
  assert(lowBlocked.status === 'blocked', 'lower still blocked by lower neighbor');
  const upStill = evaluateKitchenSidePanelClearance({
    face: 'maxU',
    subject: upper,
    occupiers: [lowerNeighbor],
    section: { u0: 0, u1: 2000 },
  });
  assert(upStill.status === 'clear', 'upper not blocked by lower-band neighbor (no Y overlap)');
}

// --- tall next to base / wall mid ---
{
  const tall = tallBox('tall', 0, 600);
  const nm = baseBox('nm', 600, 600);
  const r = evaluateKitchenSidePanelClearance({
    face: 'minU',
    subject: nm,
    occupiers: [tall],
    section: { u0: 0, u1: 3000 },
  });
  assert(r.status === 'blocked' && r.blockerId === 'tall', 'tall vs base flush → blocked');

  const wm = wallMidBox('wm', 616, 600);
  const r2 = evaluateKitchenSidePanelClearance({
    face: 'minU',
    subject: wm,
    occupiers: [tall],
    section: { u0: 0, u1: 3000 },
  });
  assert(r2.status === 'clear' && r2.availableMm === 16, 'tall→wall mid with 16 gap → clear');
  const r3 = evaluateKitchenSidePanelClearance({
    face: 'minU',
    subject: wallMidBox('wm2', 608, 600),
    occupiers: [tall],
    section: { u0: 0, u1: 3000 },
  });
  assert(r3.status === 'blocked' && r3.availableMm === 8, 'tall→wall mid 8mm → blocked');
}

// --- neighbor other height, no volume intersection ---
{
  const base = baseBox('base', 600, 600);
  const otherBand = buildKitchenModuleCorpusBoxMm({
    id: 'other-band',
    kind: 'module',
    zoneStartU: 0,
    widthMm: 600,
    y0: 2000,
    heightMm: 400,
    z0: 10,
    depthMm: 550,
  });
  assert(!kitchenSidePanelBoxesOverlapYZ(base, otherBand), 'other height no Y overlap');
  const r = evaluateKitchenSidePanelClearance({
    face: 'minU',
    subject: base,
    occupiers: [otherBand],
    section: { u0: 0, u1: 2000 },
  });
  // gap to section minU = 600 ≥ 16 → clear; otherBand ignored
  assert(r.status === 'clear' && r.availableMm === 600, 'other height ignored; section gap used');
}

// --- wall abutment ---
{
  const mod = baseBox('nm', 0, 600);
  const r = evaluateKitchenSidePanelClearance({
    face: 'minU',
    subject: mod,
    occupiers: [],
    section: { u0: 0, u1: 2000 },
  });
  assert(r.status === 'blocked' && r.availableMm === 0, 'flush to section/wall → blocked');
  assert(r.blockerId === 'section_minU', 'blocker section_minU');
}

// --- section SideOverlay on end ---
{
  const mod = baseBox('nm', 16, 600);
  const overlay = normalizeKitchenSidePanelBoxMm({
    id: 'sec-SideOverlayLeft',
    kind: 'section_side_overlay',
    u0: 0,
    u1: 16,
    y0: 0,
    y1: 2500,
    z0: 0,
    z1: 600,
  });
  const r = evaluateKitchenSidePanelClearance({
    face: 'minU',
    subject: mod,
    occupiers: [overlay],
    section: { u0: 0, u1: 2000 },
  });
  assert(r.status === 'blocked', 'section SideOverlay occupies 16 → blocked');
  assert(r.availableMm === 0, 'overlay flush available 0');
  assert(r.blockerId === 'sec-SideOverlayLeft', 'blocker is SideOverlay');
}

// --- depth non-overlap neighbor does not block ---
{
  const subject = baseBox('nm', 600, 600, 100, 720, 10, 550);
  const shallowNeighbor = buildKitchenModuleCorpusBoxMm({
    id: 'shallow',
    kind: 'module',
    zoneStartU: 0,
    widthMm: 600,
    y0: 100,
    heightMm: 720,
    z0: 700,
    depthMm: 100,
  });
  assert(!kitchenSidePanelBoxesOverlapYZ(subject, shallowNeighbor), 'no Z overlap');
  const r = evaluateKitchenSidePanelClearance({
    face: 'minU',
    subject,
    occupiers: [shallowNeighbor],
    section: { u0: 0, u1: 2000 },
  });
  assert(r.status === 'clear' && r.availableMm === 600, 'no Z overlap → not blocker');
}

// --- no mutations / WHD ---
{
  const subject = baseBox('nm', 100, 556, 100, 720, 10, 550);
  const neighbor = baseBox('n2', 700, 556);
  const section = { u0: 0, u1: 3000 };
  const ctx = {
    face: 'maxU',
    requiredMm: 16,
    subject,
    occupiers: [neighbor],
    section,
    customWidthMm: 556,
    customDepthMm: 550,
  };
  const before = JSON.stringify(ctx);
  const r = evaluateKitchenSidePanelClearance(ctx);
  assert(r.status === 'clear' || r.status === 'blocked' || r.status === 'unknown', 'eval ran');
  assert(JSON.stringify(ctx) === before, 'context not mutated');
  assert(subject.u1 - subject.u0 === 556, 'subject W untouched');
  assert(subject.z1 - subject.z0 === 550, 'subject D untouched');
}

// --- build helper rejects bad input ---
{
  assert(buildKitchenModuleCorpusBoxMm({ zoneStartU: 0, widthMm: 0, y0: 0, heightMm: 1, z0: 0, depthMm: 1 }) == null, 'width 0 → null');
  assert(normalizeKitchenSidePanelBoxMm({ u0: 1, u1: 0, y0: 0, y1: 1, z0: 0, z1: 1 }) == null, 'u inverted → null');
}

console.log('');
if (failed) {
  console.error(`[kitchen-side-panels-clearance] FAIL (${failed})`);
  process.exit(1);
}
console.log('[kitchen-side-panels-clearance] PASS');
