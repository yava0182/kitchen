/**
 * IKEA Kitchen Planner — вытащить ИХ дефолты теней из скачанного бандла.
 *
 * Сначала: node scripts/ikea-kitchen-fetch-chunks.mjs
 * Потом:   node scripts/ikea-kitchen-extract-shadow-settings.mjs
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const CACHE = join(__dir, '../.tmp-ikea-kitchen-chunks');
const OUT = join(__dir, '../docs/ikea-kitchen-shadow-dump');

/** Блок дефолтов настроек виден по якорю staticShadowMapNearPlane. */
const ANCHORS = [
  'staticShadowMapNearPlane',
  'shadowMapKernelRadius',
  'USE_SHADOWMAP_TYPE_PCF',
  'computeShadowContribPCF',
  'PCFVogelShadowMap',
  'ssaoEnabled',
  'bloomEnabled',
];

function pick(text, anchor, before = 1200, after = 3000) {
  const i = text.indexOf(anchor);
  if (i < 0) return null;
  return {
    anchor,
    at: i,
    text: text.slice(Math.max(0, i - before), i + after),
  };
}

/** Все .set("ключ", значение) рядом с тенями/качеством — их дефолты как есть. */
function settingDefaults(text) {
  const out = {};
  const re = /\.set\("([A-Za-z0-9_]+)",\s*([^,)]{1,80})\)/g;
  let m;
  while ((m = re.exec(text))) {
    const [, key, raw] = m;
    if (!/shadow|ssao|bloom|soft|quality|antialias|msaa|sample|exposure|tone/i.test(key)) continue;
    if (out[key] == null) out[key] = raw.trim();
  }
  return out;
}

function main() {
  mkdirSync(OUT, { recursive: true });
  const files = readdirSync(CACHE).filter((f) => /\.js$/i.test(f) || /_js$/i.test(f));
  const report = { at: new Date().toISOString(), files: {} };

  for (const f of files) {
    const text = readFileSync(join(CACHE, f), 'utf8');
    if (!/staticShadow|shadowMapKernelRadius|PCFVogel/.test(text)) continue;
    const entry = { size: text.length, defaults: settingDefaults(text), blocks: [] };
    for (const a of ANCHORS) {
      const b = pick(text, a);
      if (b) entry.blocks.push(b);
    }
    report.files[f] = entry;

    console.log('=== ' + f + ' (' + (text.length / 1024).toFixed(0) + 'k)');
    console.log('--- settings defaults (shadow/ssao/bloom/quality):');
    for (const [k, v] of Object.entries(entry.defaults)) console.log('   ' + k + ' = ' + v);
  }

  const file = join(OUT, 'shadow-settings-extract.json');
  writeFileSync(file, JSON.stringify(report, null, 2));
  console.log('\nwrote', file);
}

main();
