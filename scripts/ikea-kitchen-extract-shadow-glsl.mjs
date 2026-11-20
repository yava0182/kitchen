/**
 * Выдернуть их GLSL-чанк теней (USE_STATIC_SHADOWMAP) в читаемый файл — исходник для порта.
 * Run: node scripts/ikea-kitchen-extract-shadow-glsl.mjs
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const CACHE = join(__dir, '../.tmp-ikea-kitchen-chunks');
const OUT = join(__dir, '../docs/ikea-kitchen-shadow-dump');

const START = '#if defined( USE_STATIC_SHADOWMAP )\\n    // UNIFORMS';

function main() {
  mkdirSync(OUT, { recursive: true });
  for (const f of readdirSync(CACHE)) {
    const text = readFileSync(join(CACHE, f), 'utf8');
    const i = text.indexOf(START);
    if (i < 0) continue;
    /** Чанк — JS-строка в кавычках: идём до неэкранированной закрывающей кавычки. */
    let end = i;
    for (let k = i; k < text.length; k++) {
      if (text[k] === '"' && text[k - 1] !== '\\') {
        end = k;
        break;
      }
    }
    const raw = text.slice(i, end);
    const glsl = raw.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"');
    const out = join(OUT, 'ikea-static-shadow.glsl');
    writeFileSync(out, glsl);
    console.log('from', f);
    console.log('chars', glsl.length, '->', out);
    const fns = [...glsl.matchAll(/^\s*float (compute\w+|texture2D\w+)\(/gm)].map((m) => m[1]);
    console.log('functions:', [...new Set(fns)].join(', '));
    return;
  }
  console.log('not found');
}

main();
