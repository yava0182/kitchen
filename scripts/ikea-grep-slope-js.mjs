import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../docs/ikea-kitchen-slope-dump');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f));
const needles = [
  '1300',
  '1400',
  'SlopedCeilingState',
  'getBaseHeightOneSlope',
  'getSlopeSingleFace',
  'updateSlopedWallSVG',
  'sloped-ceiling',
  'SlopedWall',
  'slopeHeight',
  'slopeDepth',
  'remainingWall',
  'MeasureA',
  'measureA',
  'paramA',
  'paramB',
  'paramC',
  'angleC',
  'createSloped',
  'AddSloped',
];

const out = [];
for (const f of files) {
  const t = fs.readFileSync(path.join(dir, f), 'utf8');
  const entry = { file: f, size: t.length, hits: {} };
  for (const needle of needles) {
    const list = [];
    let idx = 0;
    let n = 0;
    while ((idx = t.indexOf(needle, idx)) >= 0 && n < 8) {
      list.push({
        at: idx,
        ctx: t.slice(Math.max(0, idx - 120), idx + 240).replace(/\s+/g, ' '),
      });
      idx += needle.length;
      n++;
    }
    if (list.length) entry.hits[needle] = list;
  }
  out.push(entry);
}

const dest = path.join(dir, 'js-geometry-hits.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 2), 'utf8');
console.log('Wrote', dest);
for (const e of out) {
  console.log(e.file, Object.keys(e.hits));
}
