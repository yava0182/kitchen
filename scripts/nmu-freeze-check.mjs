#!/usr/bin/env node
/** Freeze NMU 1.42: place clear=rear + FromClear on width. npm run freeze:nmu */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function md5_8(rel) {
  return crypto
    .createHash('md5')
    .update(fs.readFileSync(path.join(root, rel)))
    .digest('hex')
    .slice(0, 8)
    .toUpperCase();
}

let failed = 0;
const eng = fs.readFileSync(path.join(root, 'js/kitchen/kitchen-base-engine.js'), 'utf8');
const mgr = fs.readFileSync(path.join(root, 'js/furniture/furniture-manager.js'), 'utf8');

// Ширина: FromClear как fallback (нога едет; return/clear сохраняются из ud).
if (!/_cornerReturnDFromClearMm\(group, clearMm\)/.test(eng)) {
  console.error('[NMU-FREEZE] width must use FromClear');
  failed++;
}
if (!/syncCornerFromProject: true/.test(eng)) {
  console.error('[NMU-FREEZE] applyProjectDepth must syncCornerFromProject');
  failed++;
}
if (!/placeClearMm = Math\.max\(0, Math\.round\(Number\(projPlace\.rearMm\)/.test(mgr)) {
  console.error('[NMU-FREEZE] place clear must be projPlace.rearMm (not hardcoded 10)');
  failed++;
}
if (/const placeClearMm = 10;/.test(mgr)) {
  console.error('[NMU-FREEZE] forbidden placeClearMm = 10');
  failed++;
}

const pins = {
  'js/kitchen/kitchen-base-engine.js': md5_8('js/kitchen/kitchen-base-engine.js'),
  'js/furniture/furniture-manager.js': md5_8('js/furniture/furniture-manager.js'),
};
console.log('[NMU-FREEZE] pins', pins);
if (failed) {
  console.error('[NMU-FREEZE] FAIL ' + failed);
  process.exit(1);
}
console.log('[NMU-FREEZE] PASS 1.42 place+pencil+project');
