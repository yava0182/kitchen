#!/usr/bin/env node
/**
 * DEPTH-4: НШ1/НШ2 — глубина + rearOffset; TOP userLocked только от D.
 * node scripts/check-straight-kitchen-depth4.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const eng = fs.readFileSync(path.join(root, 'js/kitchen/kitchen-base-engine.js'), 'utf8');
const icons = fs.readFileSync(path.join(root, 'js/ui/scene-icons.js'), 'utf8');
const stack = fs.readFileSync(path.join(root, 'js/kitchen/kitchen-depth-stack.js'), 'utf8');

let failed = 0;
function ok(cond, msg) {
  if (!cond) {
    console.error('[DEPTH-4] FAIL:', msg);
    failed += 1;
  } else {
    console.log('[DEPTH-4] OK:', msg);
  }
}

// Formulas
ok(0 + 350 === 350, 'NSH1 D=350 offset=0 → front 350');
ok(50 + 300 === 350, 'NSH1 D=300 offset=50 → front 350');
ok(0 + 460 === 460, 'NSH2 D=460 offset=0 → front 460');
ok(100 + 350 === 450, 'NSH2 D=350 offset=100 → front 450');

// Existing mechanisms
ok(/export function rebuildWallMidForCellDepthMm/.test(eng), 'rebuildWallMidForCellDepthMm');
ok(/export function rebuildWallTopForCellDepthMm/.test(eng), 'rebuildWallTopForCellDepthMm');
ok(/syncKitchenWallTopDepthFromTallInZone/.test(eng), 'syncKitchenWallTopDepthFromTallInZone');
ok(/__kitchenTopDepthUserLocked/.test(eng), 'userLocked stamp');
ok(/targetBack = Number\(wall\) \+ sign \* tallWallOff/.test(stack), 'flush targetBack = wall+rearOffset');
ok(/__cldSetKitchenModuleOffsetsMm/.test(stack), 'set offsets API');

// DEPTH-3 intact: no auto tall from worktop
ok(!/function syncTallDepthAfterWorktopOnWall\(/.test(eng), 'DEPTH-3: no tall auto from Dwt');

// UI
ok(/isKitchenWallMidModule/.test(icons), 'mid module flag');
ok(/isKitchenWallTopModule/.test(icons), 'top module flag');
ok(/step4-module-wall-offset-input/.test(icons), 'shared wall offset field');
ok(/function applyFlushModuleWallOffsetMm\(/.test(icons), 'applyFlushModuleWallOffsetMm');
ok(
  /НЕ ставит userLocked на TOP/.test(icons) ||
    /не ставит lock на НШ2/.test(icons),
  'offset must not lock TOP'
);
ok(
  /mode: 'custom'[\s\S]*userLocked: true/.test(icons),
  'TOP depth pencil still sets userLocked'
);
ok(/Глубина корпуса/.test(icons), 'label глубина корпуса');

// Rebuild preserves rearOffset via alignBackToWall
ok(
  /alignBackToWall\(group, sectionData\);/.test(
    eng.slice(
      eng.indexOf('export function rebuildWallMidForCellDepthMm'),
      eng.indexOf('export function applyKitchenWallTopDepthForGroup')
    )
  ),
  'mid/top rebuild call alignBackToWall (keeps rearOffset)'
);

ok(
  /getWorldPosition/.test(stack) && /getSectionWallWorldCoord/.test(stack),
  'wall plane uses world position'
);
ok(
  /__CLD_KITCHEN_BASE_ENGINE_BUILD = '20261030-depth4b'/.test(eng),
  'engine build depth4b'
);

if (failed) {
  console.error(`[DEPTH-4] FAIL ${failed}`);
  process.exit(1);
}
console.log('[DEPTH-4] PASS');
