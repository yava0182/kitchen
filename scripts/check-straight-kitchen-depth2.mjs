#!/usr/bin/env node
/**
 * DEPTH-2 (исторический): формулы стека НМ.
 * Auto tall sync от Dwt снят в DEPTH-3 — см. check-straight-kitchen-depth3.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const eng = fs.readFileSync(path.join(root, 'js/kitchen/kitchen-base-engine.js'), 'utf8');

let failed = 0;
function ok(cond, msg) {
  if (!cond) {
    console.error('[DEPTH-2] FAIL:', msg);
    failed += 1;
  } else {
    console.log('[DEPTH-2] OK:', msg);
  }
}

const FRONT = 40;
const REAR_MIN = 10;

ok(600 - FRONT - 550 === 10, 'preset 550 rear=10');
ok(600 - FRONT - 460 === 100, 'preset 460 rear=100');
ok(600 - FRONT === 560, 'NM front line at Dwt600 = 560');
ok(/export function applyWorktopDepthOnWall/.test(eng), 'applyWorktopDepthOnWall exists');
ok(/isKitchenNmCarcassGroup\(obj\)/.test(eng), 'worktop path filters NM');
ok(
  !/function syncTallDepthAfterWorktopOnWall\(/.test(eng),
  'DEPTH-3: no auto tall depth from worktop'
);

if (failed) {
  console.error(`[DEPTH-2] FAIL ${failed}`);
  process.exit(1);
}
console.log('[DEPTH-2] PASS (formulas; tall sync superseded by DEPTH-3)');
