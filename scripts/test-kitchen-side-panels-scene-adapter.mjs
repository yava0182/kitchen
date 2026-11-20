/**
 * STEP 2G: scene adapter mapping + snapshot→clearance (без THREE).
 * node scripts/test-kitchen-side-panels-scene-adapter.mjs
 */
import {
  mapKitchenSidePanelSideToFace,
  kitchenSectionWallAxes,
  evaluateKitchenSidePanelClearanceFromSnapshot,
} from '../js/kitchen/kitchen-side-panels-scene-adapter.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('[FAIL]', msg);
  } else {
    console.log('[OK]', msg);
  }
}

// left/right → minU/maxU (канон ряда / Maatkasten)
assert(mapKitchenSidePanelSideToFace('left') === 'minU', 'left → minU');
assert(mapKitchenSidePanelSideToFace('right') === 'maxU', 'right → maxU');
assert(mapKitchenSidePanelSideToFace('LEFT') === 'minU', 'LEFT → minU');
assert(mapKitchenSidePanelSideToFace('front') == null, 'front not a module side');

// wall axes
assert(kitchenSectionWallAxes('back').u === 'x' && kitchenSectionWallAxes('back').d === 'z', 'back axes');
assert(kitchenSectionWallAxes('front').useZ === false, 'front useX');
assert(kitchenSectionWallAxes('left').u === 'z' && kitchenSectionWallAxes('left').d === 'x', 'left axes');
assert(kitchenSectionWallAxes('right').useZ === true, 'right useZ');

// --- snapshot cases (synthetic, same metrics live adapter would build) ---

// two lowers flush → blocked
{
  const r = evaluateKitchenSidePanelClearanceFromSnapshot({
    face: 'minU',
    requiredMm: 16,
    subject: { id: 'nm-b', kind: 'module', u0: 600, u1: 1200, y0: 100, y1: 820, z0: 10, z1: 560 },
    occupiers: [
      { id: 'nm-a', kind: 'module', u0: 0, u1: 600, y0: 100, y1: 820, z0: 10, z1: 560 },
    ],
    section: { u0: 0, u1: 1200 },
  });
  assert(r.status === 'blocked' && r.availableMm === 0, 'flush lowers → blocked');
  assert(r.blockerId === 'nm-a', 'blocker neighbor');
}

// free end 16mm → clear
{
  const r = evaluateKitchenSidePanelClearanceFromSnapshot({
    face: 'minU',
    requiredMm: 16,
    subject: { id: 'nm', kind: 'module', u0: 16, u1: 616, y0: 100, y1: 820, z0: 10, z1: 560 },
    occupiers: [],
    section: { u0: 0, u1: 2000 },
  });
  assert(r.status === 'clear' && r.availableMm === 16, 'free end 16 → clear');
}

// base next to tall → blocked / clear by gap
{
  const tall = { id: 'tall', kind: 'tall', u0: 0, u1: 600, y0: 0, y1: 2100, z0: 0, z1: 560 };
  const blocked = evaluateKitchenSidePanelClearanceFromSnapshot({
    face: 'minU',
    requiredMm: 16,
    subject: { id: 'nm', kind: 'module', u0: 600, u1: 1200, y0: 100, y1: 820, z0: 10, z1: 560 },
    occupiers: [tall],
    section: { u0: 0, u1: 3000 },
  });
  assert(blocked.status === 'blocked' && blocked.blockerId === 'tall', 'tall flush → blocked');

  const clear = evaluateKitchenSidePanelClearanceFromSnapshot({
    face: 'minU',
    requiredMm: 16,
    subject: { id: 'nm', kind: 'module', u0: 616, u1: 1216, y0: 100, y1: 820, z0: 10, z1: 560 },
    occupiers: [tall],
    section: { u0: 0, u1: 3000 },
  });
  assert(clear.status === 'clear' && clear.availableMm === 16, 'tall gap 16 → clear');
}

// upper independent of lower
{
  const lowerN = { id: 'low-n', kind: 'module', u0: 600, u1: 1200, y0: 100, y1: 820, z0: 10, z1: 560 };
  const upper = evaluateKitchenSidePanelClearanceFromSnapshot({
    face: 'maxU',
    requiredMm: 16,
    subject: { id: 'wm', kind: 'module', u0: 0, u1: 600, y0: 1400, y1: 2120, z0: 0, z1: 350 },
    occupiers: [lowerN],
    section: { u0: 0, u1: 2000 },
  });
  assert(upper.status === 'clear', 'upper ignores lower-band neighbor');
}

// section SideOverlay occupies end
{
  const r = evaluateKitchenSidePanelClearanceFromSnapshot({
    face: 'minU',
    requiredMm: 16,
    subject: { id: 'nm', kind: 'module', u0: 16, u1: 616, y0: 100, y1: 820, z0: 0, z1: 560 },
    occupiers: [
      {
        id: 'section_trim_min_overlay',
        kind: 'section_side_overlay',
        u0: 0,
        u1: 16,
        y0: 0,
        y1: 2500,
        z0: 0,
        z1: 600,
      },
    ],
    section: { u0: 0, u1: 2000 },
  });
  assert(r.status === 'blocked' && r.availableMm === 0, 'SideOverlay → blocked');
  assert(r.blockerId === 'section_trim_min_overlay', 'blocker trim');
}

// wall turn: same left→minU mapping on left wall axes (U along Z)
{
  assert(mapKitchenSidePanelSideToFace('left') === 'minU', 'left wall still left→minU');
  const r = evaluateKitchenSidePanelClearanceFromSnapshot({
    face: mapKitchenSidePanelSideToFace('left'),
    requiredMm: 16,
    // U values are world Z for left wall — clearance math identical
    subject: { id: 'nm', kind: 'module', u0: 100, u1: 700, y0: 100, y1: 820, z0: 0, z1: 560 },
    occupiers: [],
    section: { u0: 0, u1: 2000 },
  });
  assert(r.status === 'clear' && r.availableMm === 100, 'left-wall U (Z) orientation ok');
}

// wall abutment
{
  const r = evaluateKitchenSidePanelClearanceFromSnapshot({
    face: 'minU',
    requiredMm: 16,
    subject: { id: 'nm', kind: 'module', u0: 0, u1: 600, y0: 100, y1: 820, z0: 10, z1: 560 },
    occupiers: [],
    section: { u0: 0, u1: 2000 },
  });
  assert(r.status === 'blocked' && r.blockerId === 'section_minU', 'flush wall → blocked');
}

console.log('');
if (failed) {
  console.error(`[kitchen-side-panels-scene-adapter] FAIL (${failed})`);
  process.exit(1);
}
console.log('[kitchen-side-panels-scene-adapter] PASS');
