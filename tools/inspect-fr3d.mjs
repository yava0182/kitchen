/**
 * Читает .fr3d / .f3d (BZ85) из БАЗИС-Мебельщик: UTF-16 строки, имена полей, подозрительные размеры.
 * node tools/inspect-fr3d.mjs path/to/file.fr3d
 */
import fs from 'fs';
import path from 'path';

const file = process.argv[2];
if (!file) {
  console.error('Укажите файл: node tools/inspect-fr3d.mjs path/to/file.fr3d');
  process.exit(1);
}

const data = fs.readFileSync(file);
console.log('Файл:', path.resolve(file));
console.log('Размер:', data.length, 'байт');
console.log('Заголовок ASCII:', data.subarray(0, 32).toString('ascii').replace(/\0/g, '\\0'));

function utf16leStrings(buf, minLen = 4) {
  const out = [];
  let cur = '';
  for (let i = 0; i + 1 < buf.length; i += 2) {
    const c = buf.readUInt16LE(i);
    if (c >= 0x20 && (c < 0xd800 || c > 0xdfff)) {
      cur += String.fromCharCode(c);
    } else {
      if (cur.length >= minLen) out.push(cur);
      cur = '';
    }
  }
  if (cur.length >= minLen) out.push(cur);
  return out;
}

function cp1251Strings(buf, minLen = 5) {
  const out = [];
  let cur = '';
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i];
    if ((b >= 0x20 && b <= 0x7e) || b >= 0xc0) {
      cur += Buffer.from([b]).toString('latin1');
    } else {
      if (cur.length >= minLen) {
        try {
          out.push(Buffer.from(cur, 'latin1').toString('cp1251'));
        } catch {
          out.push(cur);
        }
      }
      cur = '';
    }
  }
  return out;
}

const u16 = [...new Set(utf16leStrings(data))];
const cp = [...new Set(cp1251Strings(data))];

const keys = /конфирмат|стяжк|эксцентр|minifix|rafix|евровинт|отверст|панел|полк|бок|дно|крыш|ящик|фасад|hole|drill|fast|panel|furn/i;

console.log('\n--- UTF-16 строки (все уникальные,', u16.length, ') ---');
for (const s of u16.sort((a, b) => b.length - a.length)) {
  if (keys.test(s) || s.length >= 12) console.log(' ', s.slice(0, 160));
}

console.log('\n--- CP1251 / ASCII фрагменты (интересные) ---');
for (const s of cp.sort((a, b) => b.length - a.length).slice(0, 80)) {
  if (keys.test(s)) console.log(' ', s.slice(0, 160));
}

// BZ85 field names at start
const asciiFields = [];
let acc = '';
for (let i = 0; i < Math.min(data.length, 4096); i++) {
  const b = data[i];
  if (b >= 0x20 && b <= 0x7e) acc += String.fromCharCode(b);
  else {
    if (acc.length >= 3) asciiFields.push(acc);
    acc = '';
  }
}
console.log('\n--- Поля заголовка BZ85 (первые 4KB) ---');
console.log(asciiFields.filter((s) => /^[A-Za-z][A-Za-z0-9._]*$/.test(s)).join(', '));

// floats 1..3000
const floats = [];
for (let i = 0; i <= data.length - 4; i += 1) {
  const v = data.readFloatLE(i);
  if (Number.isFinite(v) && Math.abs(v) >= 1 && Math.abs(v) <= 3000) {
    const r = Math.round(v);
    if (Math.abs(v - r) < 0.02) floats.push({ i, v: r });
  }
}
const freq = new Map();
for (const f of floats) freq.set(f.v, (freq.get(f.v) || 0) + 1);
const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25);
console.log('\n--- Частые round float (мм?) ---');
console.log(top.map(([v, c]) => `${v}:${c}`).join(', '));
