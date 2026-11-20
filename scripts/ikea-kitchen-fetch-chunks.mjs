/**
 * IKEA Kitchen Planner — скачать их чанки и найти настройки теней в исходниках.
 *
 * HTML фрейма (kitchen.ikea-prod.by.me/Kitchen/) отдаётся по прямому запросу и
 * перечисляет все чанки, включая vendor-бандлы с 3D-движком.
 *
 * Run: node scripts/ikea-kitchen-fetch-chunks.mjs
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync, statSync } from 'fs';
import { dirname, join, basename } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const BASE = 'https://kitchen.ikea-prod.by.me';
const PAGE = `${BASE}/Kitchen/?ln=ru-LV`;
const CACHE = join(__dir, '../.tmp-ikea-kitchen-chunks');
const OUT = join(__dir, '../docs/ikea-kitchen-shadow-dump');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const PATTERNS = {
  engine: /BABYLON|babylonjs|ShadowGenerator|CascadedShadow|ShadowDepthWrapper|THREE\.WebGLRenderer|three\.module|PlayCanvas|filament/,
  shadowApi:
    /shadowGenerator|ShadowGenerator|getShadowMap|shadowMapSize|usePercentageCloserFiltering|useContactHardeningShadow|useBlurExponentialShadowMap|useCloseExponentialShadowMap|usePoissonSampling|blurKernel|blurBoxOffset|contactHardeningLightSizeUVRatio|filteringQuality|frustumEdgeFalloff|shadowMinZ|shadowMaxZ|normalBias/,
  shadowGlsl:
    /sampler2DShadow|textureProj|SHADOWFLOAT|SHADOWPCF|SHADOWPOISSON|SHADOWCSM|shadowPixelDepth|depthValues|vPositionFromLight/,
  soft: /soft_shadow|softShadow|blurred_heightmap|heightmap|reference_height|occlusion_strength|accumulation_frame|AccumulationBuffer/,
  flags: /castShadows|receiveShadows|enableShadows|shadowsEnabled|shadowEnabled/,
};

async function get(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Referer: PAGE } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

function cachedGet(url) {
  const name = url.replace(/[^a-z0-9._~-]+/gi, '_').slice(-120);
  const file = join(CACHE, name);
  if (existsSync(file) && statSync(file).size > 0) {
    return { text: readFileSync(file, 'utf8'), file, cached: true };
  }
  return { file, cached: false };
}

function snippets(text, re, max = 40, pad = 160) {
  const out = [];
  const r = new RegExp(re.source, 'gi');
  let m;
  while ((m = r.exec(text)) && out.length < max) {
    const a = Math.max(0, m.index - pad);
    const b = Math.min(text.length, m.index + pad);
    out.push({ hit: m[0], at: m.index, text: text.slice(a, b).replace(/\s+/g, ' ') });
    r.lastIndex = m.index + Math.max(1, m[0].length) + 40;
  }
  return out;
}

async function main() {
  mkdirSync(CACHE, { recursive: true });
  mkdirSync(OUT, { recursive: true });

  const html = await get(PAGE);
  const assets = [
    ...new Set(
      [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|mjs|wasm))"/g)]
        .map((m) => m[1])
        .filter((u) => !/sentry-cdn/.test(u))
    ),
  ].map((u) => (u.startsWith('http') ? u : BASE + u));

  console.log('assets', assets.length);
  const report = { at: new Date().toISOString(), page: PAGE, files: [] };

  for (const url of assets) {
    let { text, file, cached } = cachedGet(url);
    if (!cached) {
      try {
        text = await get(url);
        writeFileSync(file, text);
      } catch (e) {
        console.log('  ERR', basename(url), String(e.message));
        report.files.push({ url, err: String(e.message) });
        continue;
      }
    }
    const entry = { url, size: text.length, cached, hits: {} };
    for (const [key, re] of Object.entries(PATTERNS)) {
      const s = snippets(text, re);
      if (s.length) entry.hits[key] = s;
    }
    const total = Object.values(entry.hits).reduce((a, b) => a + b.length, 0);
    console.log(
      `  ${(text.length / 1024).toFixed(0)}k  ${basename(url).slice(0, 60)}  hits=${total}`
    );
    report.files.push(entry);
  }

  const file = join(OUT, 'js-chunks-shadow-grep.json');
  writeFileSync(file, JSON.stringify(report, null, 2));
  console.log('wrote', file);
}

main().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
