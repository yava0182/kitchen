/**
 * Читает .b3d (Bazis-Mebelshchik) и вытаскивает UTF-16 строки + подозрительные размеры.
 * Использование: node tools/inspect-b3d.mjs path/to/model.b3d
 */
import fs from 'fs';
import path from 'path';

const filePath = process.argv[2];
if (!filePath) {
  console.error('Укажите файл: node tools/inspect-b3d.mjs path/to/model.b3d');
  process.exit(1);
}

const buf = fs.readFileSync(path.resolve(filePath));
console.log('Файл:', filePath);
console.log('Размер:', buf.length, 'байт');
console.log('Первые 16 байт (hex):', buf.subarray(0, 16).toString('hex'));
console.log('Первые 8 символов ASCII:', buf.subarray(0, 8).toString('ascii').replace(/\0/g, '.'));

function extractUtf16LE(minLen = 4) {
  const out = [];
  let i = 0;
  while (i < buf.length - 2) {
    let s = '';
    const start = i;
    while (i < buf.length - 1) {
      const code = buf.readUInt16LE(i);
      i += 2;
      if (code === 0) break;
      if (code < 32 || code > 0xfffd) {
        i = start + 2;
        break;
      }
      s += String.fromCharCode(code);
    }
    if (s.length >= minLen && /[\p{L}\d]/u.test(s)) {
      out.push(s.trim());
    }
    if (i === start) i += 2;
  }
  return [...new Set(out)];
}

function extractAsciiRuns(minLen = 6) {
  const out = [];
  let s = '';
  for (let i = 0; i < buf.length; i++) {
    const c = buf[i];
    if (c >= 32 && c < 127) s += String.fromCharCode(c);
    else {
      if (s.length >= minLen) out.push(s);
      s = '';
    }
  }
  if (s.length >= minLen) out.push(s);
  return [...new Set(out)];
}

const utf16 = extractUtf16LE(3);
const ascii = extractAsciiRuns(8);

const panelLike = utf16.filter(
  (s) =>
    /шкаф|дно|бок|крыш|полк|задн|facade|core|панел|стенк|LDSP|EDGE|EXP-/i.test(s) ||
    /_core$/i.test(s),
);

console.log('\n--- Строки UTF-16 (детали / материалы / проект) ---');
for (const s of utf16.slice(0, 120)) {
  if (s.length > 80) continue;
  console.log(' ', JSON.stringify(s));
}
if (utf16.length > 120) console.log(`  ... ещё ${utf16.length - 120} строк`);

if (panelLike.length) {
  console.log('\n--- Похоже на детали ---');
  panelLike.forEach((s) => console.log(' ', s));
}

console.log('\n--- ASCII фрагменты (заголовки) ---');
ascii.slice(0, 40).forEach((s) => console.log(' ', s));

/** Ищем float64 близкие к типичным мм (16, 100–2500) */
const dims = new Map();
for (let i = 0; i <= buf.length - 8; i += 4) {
  const v = buf.readDoubleLE(i);
  if (!Number.isFinite(v)) continue;
  if (v < 2 || v > 3500) continue;
  const rounded = Math.round(v * 1000) / 1000;
  const key = String(rounded);
  dims.set(key, (dims.get(key) || 0) + 1);
}
const topDims = [...dims.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 40)
  .filter(([k]) => {
    const n = Number(k);
    return n === 16 || n >= 50;
  });

console.log('\n--- Частые float64 в файле (возможные мм) ---');
topDims.forEach(([k, n]) => console.log(`  ${k} мм × ${n}`));

console.log('\nСовет: сравните с CFRN — скачайте export_*.cfrn (не cloud), откройте file.json → table.objects[objType=2].');
