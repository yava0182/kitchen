const fs = require('fs');
const path = require('path');

const refPath =
  'D:/Копии конструктора/Копии Clodis-Kitchen/1.79 с этого начать/Clodis-Kitchen/js/furniture/furniture-manager.js';
const curPath = 'D:/Clodis-Kitchen/js/furniture/furniture-manager.js';

function load(p) {
  return fs.readFileSync(p, 'utf8').replace(/\?v=[^'"\s]+/g, '?v=BUST');
}

const ref = load(refPath);
const cur = load(curPath);

function extract(src, startRe, endRe) {
  const m = startRe.exec(src);
  if (!m) return { text: null, line: -1 };
  const start = m.index;
  let end = Math.min(src.length, start + 80000);
  if (endRe) {
    endRe.lastIndex = 0;
    const rest = src.slice(start + m[0].length);
    const m2 = endRe.exec(rest);
    if (m2) end = start + m[0].length + m2.index;
  }
  const text = src.slice(start, end);
  const line = src.slice(0, start).split(/\n/).length;
  return { text, line };
}

function dumpDiff(name, R, C, outDir) {
  console.log('====', name, '====');
  console.log(
    'REF line',
    R.line,
    'lines',
    R.text ? R.text.split(/\n/).length : 'MISS',
    'CUR line',
    C.line,
    'lines',
    C.text ? C.text.split(/\n/).length : 'MISS'
  );
  if (!R.text || !C.text) {
    console.log('missing chunk');
    return;
  }
  if (R.text === C.text) {
    console.log('CHUNK SAME');
    return;
  }
  fs.writeFileSync(path.join(outDir, name + '.ref.txt'), R.text);
  fs.writeFileSync(path.join(outDir, name + '.cur.txt'), C.text);
  const rl = R.text.split(/\n/);
  const cl = C.text.split(/\n/);
  let i = 0;
  let j = 0;
  let shown = 0;
  while ((i < rl.length || j < cl.length) && shown < 80) {
    if (i < rl.length && j < cl.length && rl[i] === cl[j]) {
      i++;
      j++;
      continue;
    }
    console.log('--- drift REF@' + (R.line + i) + ' CUR@' + (C.line + j) + ' ---');
    for (let k = 0; k < 5 && i + k < rl.length; k++) console.log('REF|' + rl[i + k]);
    for (let k = 0; k < 5 && j + k < cl.length; k++) console.log('CUR|' + cl[j + k]);
    // skip ahead a bit on both to find next equal
    const window = 40;
    let synced = false;
    for (let a = 1; a < window && !synced; a++) {
      for (let b = 1; b < window; b++) {
        if (i + a < rl.length && j + b < cl.length && rl[i + a] === cl[j + b] && rl[i + a].trim()) {
          i += a;
          j += b;
          synced = true;
          break;
        }
      }
    }
    if (!synced) {
      i++;
      j++;
    }
    shown += 10;
  }
}

const outDir = 'D:/Clodis-Kitchen/.tmp-diff-1.79';
const jobs = [
  [
    'refreshImmediate',
    /function refreshFurnitureDecorsImmediate\s*\(/,
    /\nfunction refreshFurnitureDecors\s*\(/,
  ],
  [
    'applyOutside',
    /function __applyStep5OutsideDecorToMesh\s*\(/,
    /\nfunction [A-Za-z_]/,
  ],
  [
    'usesOutsideBlock',
    /const usesOutsideDecor =/,
    /if \(usesOutsideDecor && effectiveOutside/,
  ],
];

for (const [name, a, b] of jobs) {
  dumpDiff(name, extract(ref, a, b), extract(cur, a, b), outDir);
  console.log('');
}

// Key markers presence
const markers = [
  'usesOutsideDecor',
  'sectionTrimUsesOutsideDecor',
  'cldFacadeMaterialGroup',
  '__cldSidePanelReplacementAppearance',
  'step5DecorChannel',
  '__getFurnitureRootGroupForMesh',
  '__getFurnitureRootForDecorMesh',
];
console.log('==== marker counts ====');
for (const m of markers) {
  const rc = (ref.match(new RegExp(m, 'g')) || []).length;
  const cc = (cur.match(new RegExp(m, 'g')) || []).length;
  console.log(m + ': REF=' + rc + ' CUR=' + cc + (rc === cc ? '' : '  <--'));
}
