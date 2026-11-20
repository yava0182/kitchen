/**
 * Fix CP1251-misread UTF-8 mojibake (РЎРІРµС‚ → Свет).
 * Usage: node scripts/fix-mojibake.cjs [--write]
 */
const fs = require('fs');
const path = require('path');

function buildRev() {
  const m = new Map();
  for (let i = 0; i < 128; i++) m.set(i, i);
  const table = {
    0x0402: 0x80, 0x0403: 0x81, 0x201a: 0x82, 0x0453: 0x83, 0x201e: 0x84,
    0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x20ac: 0x88, 0x2030: 0x89,
    0x0409: 0x8a, 0x2039: 0x8b, 0x040a: 0x8c, 0x040c: 0x8d, 0x040b: 0x8e,
    0x040f: 0x8f, 0x0452: 0x90, 0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93,
    0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x2122: 0x99,
    0x0459: 0x9a, 0x203a: 0x9b, 0x045a: 0x9c, 0x045c: 0x9d, 0x045b: 0x9e,
    0x045f: 0x9f, 0x00a0: 0xa0, 0x040e: 0xa1, 0x045e: 0xa2, 0x0408: 0xa3,
    0x00a4: 0xa4, 0x0490: 0xa5, 0x00a6: 0xa6, 0x00a7: 0xa7, 0x0401: 0xa8,
    0x00a9: 0xa9, 0x0404: 0xaa, 0x00ab: 0xab, 0x00ac: 0xac, 0x00ad: 0xad,
    0x00ae: 0xae, 0x0407: 0xaf, 0x00b0: 0xb0, 0x00b1: 0xb1, 0x0406: 0xb2,
    0x0456: 0xb3, 0x0491: 0xb4, 0x00b5: 0xb5, 0x00b6: 0xb6, 0x00b7: 0xb7,
    0x0451: 0xb8, 0x2116: 0xb9, 0x0454: 0xba, 0x00bb: 0xbb, 0x0458: 0xbc,
    0x0405: 0xbd, 0x0455: 0xbe, 0x0457: 0xbf,
  };
  for (const [u, b] of Object.entries(table)) m.set(+u, +b);
  for (let i = 0; i < 32; i++) {
    m.set(0x0410 + i, 0xc0 + i);
    m.set(0x0430 + i, 0xe0 + i);
  }
  for (let i = 0xa0; i <= 0xff; i++) {
    if (!m.has(i)) m.set(i, i);
  }
  return m;
}

const REV = buildRev();
const WRITE = process.argv.includes('--write');

/** Count classic double-UTF8 markers: ER/ES + CP1251 high Cyrillic */
function mojCount(s) {
  let n = 0;
  for (let i = 0; i < s.length - 1; i++) {
    const a = s.codePointAt(i);
    const b = s.codePointAt(i + 1);
    // Р (0420) or С (0421) followed by a char that is a CP1251 mapping of a UTF-8 continuation
    if ((a === 0x0420 || a === 0x0421) && b > 0x7f && REV.has(b) && b !== a) n++;
  }
  return n;
}

function tryFix(s) {
  const bytes = [];
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (cp < 128) bytes.push(cp);
    else if (REV.has(cp)) bytes.push(REV.get(cp));
    else return null;
  }
  try {
    const out = Buffer.from(bytes).toString('utf8');
    if (out.includes('\uFFFD')) return null;
    if (!/[А-Яа-яЁё]/.test(out) && !/[—«»…]/.test(out)) return null;
    // Fixed text must look LESS like mojibake than input
    if (mojCount(out) >= mojCount(s) && mojCount(s) > 0) return null;
    if (mojCount(out) > 2 && mojCount(out) > out.length / 10) return null;
    return out;
  } catch {
    return null;
  }
}

function looksMojibake(s) {
  return mojCount(s) >= 2 || /вЂ/.test(s) || /В[«»]/.test(s);
}

function isAsciiOkInRun(c) {
  return /[ \t.,;:!?\-()[\]{}'"«»/+*=#@%?]/.test(c);
}

function fixText(s) {
  let out = '';
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    const cp = ch.codePointAt(0);
    if (cp > 127 && REV.has(cp)) {
      let j = i;
      let run = '';
      while (j < s.length) {
        const c2 = s[j];
        const cp2 = c2.codePointAt(0);
        if (cp2 < 128) {
          if (isAsciiOkInRun(c2)) {
            run += c2;
            j++;
            continue;
          }
          break;
        }
        if (REV.has(cp2)) {
          run += c2;
          j++;
          continue;
        }
        break;
      }
      if (looksMojibake(run)) {
        let fixed = tryFix(run);
        if (!fixed) {
          const t = run.replace(/\s+$/, '');
          const trail = run.slice(t.length);
          fixed = tryFix(t);
          if (fixed) {
            out += fixed + trail;
            i = j;
            continue;
          }
        } else {
          out += fixed;
          i = j;
          continue;
        }
      }
      out += ch;
      i++;
    } else {
      out += ch;
      i++;
    }
  }
  return out;
}

function walk(d, acc = []) {
  for (const n of fs.readdirSync(d, { withFileTypes: true })) {
    if (
      [
        'node_modules',
        '.git',
        'vendor',
        'assets',
        'catalog_items',
        'dist',
        'builds',
        '.cursor',
        'AgentStores',
        'scripts',
      ].includes(n.name)
    ) {
      continue;
    }
    const p = path.join(d, n.name);
    if (n.isDirectory()) walk(p, acc);
    else if (/\.(js|html|css|json|md)$/.test(n.name)) acc.push(p);
  }
  return acc;
}

const root = path.resolve(__dirname, '..');
const files = walk(root);

// Self-test
const t1 = tryFix('РЎРІРµС‚');
const t2 = tryFix('РІРµРґРёС‚Рµ РЅР°Р·РІР°РЅРёРµ');
console.log('selftest', t1, t2, mojCount('РЎРІРµС‚'));

const report = [];
for (const f of files) {
  let s;
  try {
    s = fs.readFileSync(f, 'utf8');
  } catch {
    continue;
  }
  if (mojCount(s) < 2 && !/вЂ/.test(s) && !/В[«»]/.test(s)) continue;
  const fixed = fixText(s);
  if (fixed === s) continue;
  const before = mojCount(s);
  const after = mojCount(fixed);
  const rel = path.relative(root, f).replace(/\\/g, '/');
  report.push({ rel, before, after, delta: before - after });
  if (WRITE) fs.writeFileSync(f, fixed, 'utf8');
}

report.sort((a, b) => b.delta - a.delta);
console.log(JSON.stringify({ write: WRITE, files: report.length, top: report }, null, 2));
