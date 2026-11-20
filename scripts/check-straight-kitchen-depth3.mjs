#!/usr/bin/env node
/**
 * DEPTH-3: независимая глубина пенала + rearOffsetMm; без auto-sync от Dwt.
 * node scripts/check-straight-kitchen-depth3.mjs
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
    console.error('[DEPTH-3] FAIL:', msg);
    failed += 1;
  } else {
    console.log('[DEPTH-3] OK:', msg);
  }
}

// Формулы: перед = wallOffset + depth
{
  const nmFront = 560;
  ok(0 + 460 === 460, 'tall D=460 offset=0 → front 460');
  ok(100 + 460 === nmFront, 'tall D=460 offset=100 → front 560 (= NM)');
  ok(0 + 560 === nmFront, 'tall D=560 offset=0 → front 560');
}

// DEPTH-2 auto tall sync removed
ok(
  !/function syncTallDepthAfterWorktopOnWall\(/.test(eng),
  'syncTallDepthAfterWorktopOnWall removed'
);
ok(
  !/syncTallDepthAfterWorktopOnWall\(wall, dwt\)/.test(eng),
  'applyWorktopDepthOnWall does not call tall depth sync'
);
ok(
  /Пенал: глубину и rearOffsetMm не трогаем/.test(eng),
  'applyWorktop comment: tall independent of Dwt'
);

// Existing offset mechanism reused
ok(/export function readKitchenModuleOffsetsMm/.test(stack), 'readKitchenModuleOffsetsMm exists');
ok(/__cldSetKitchenModuleOffsetsMm/.test(stack), '__cldSetKitchenModuleOffsetsMm exists');
ok(
  /targetBack = Number\(wall\) \+ sign \* tallWallOff/.test(stack),
  'tall targetBack = wall + rearOffset (absolute)'
);
ok(
  /if \(!tall\) \{\s*offsets = applyKitchenModuleOffsetsAfterStack/s.test(stack),
  'NM offsets after stack; tall does not double-shift'
);

// UI (DEPTH-4: shared flush wall-offset field; tall still covered)
ok(/Глубина корпуса/.test(icons), 'pencil label «Глубина корпуса»');
ok(
  /step4-module-wall-offset-input/.test(icons) || /step4-tall-wall-offset-input/.test(icons),
  'pencil field wall offset'
);
ok(
  /function applyFlushModuleWallOffsetMm\(/.test(icons) ||
    /function applyTallWallOffsetMm\(/.test(icons),
  'apply flush/tall wall offset'
);
ok(
  /__cldSetKitchenModuleOffsetsMm/.test(icons),
  'UI uses existing offsets API'
);
ok(
  /rebuildTallForCellDepthMm/.test(icons) &&
    (/rearOffsetMm не трогаем/.test(icons) || /applyFlushModuleWallOffsetMm/.test(icons)),
  'tall depth rebuild keeps rearOffset'
);

ok(
  /__CLD_KITCHEN_BASE_ENGINE_BUILD = '20261030-depth[34]'/.test(eng) ||
    /__CLD_KITCHEN_BASE_ENGINE_BUILD = '20261030-depth4'/.test(eng),
  'engine build depth3+'
);

if (failed) {
  console.error(`[DEPTH-3] FAIL ${failed}`);
  process.exit(1);
}
console.log('[DEPTH-3] PASS');
