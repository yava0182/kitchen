/**
 * IKEA Kitchen Planner — поиск настроек теней в ИХ исходниках (не по картинке).
 *
 * Движок кухни не выставлен в window, 3D в кросс-доменном iframe. Но сами бандлы —
 * статика: ловим их из сети, сохраняем и грепаем по именам из графических движков.
 *
 * Run:
 *   node scripts/ikea-grep-kitchen-shadow-js.mjs
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dir, '../docs/ikea-kitchen-shadow-dump');
const URL =
  process.env.IKEA_KITCHEN_URL || 'https://kitchen.planner.ikea.com/lv/ru/planner/';

/** Имена из Babylon / three / собственных движков — что из этого встретится, то и движок. */
const ENGINE_RE =
  /BABYLON|babylonjs|ShadowGenerator|CascadedShadowGenerator|ShadowDepthWrapper|THREE\.|three\.module|PlayCanvas|pc\.Application|filament|UnityLoader|unityInstance/g;

const SHADOW_RE =
  /shadowGenerator|ShadowGenerator|shadowMap|shadowMapSize|usePercentageCloserFiltering|useContactHardeningShadow|useBlurExponentialShadowMap|useCloseExponentialShadowMap|usePoissonSampling|blurKernel|blurScale|blurBoxOffset|contactHardeningLightSizeUVRatio|filteringQuality|shadowMinZ|shadowMaxZ|normalBias|frustumEdgeFalloff|darkness|castShadows|receiveShadows|soft_shadow|softShadow|blurred_heightmap|heightmap|ACTIVE_SHADOW_LIGHTS|getShadow|shadowSamplingJitter|accumulation_frame|AccumulationBuffer/g;

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return (
    d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' +
    p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds())
  );
}

function snippets(text, re, max = 25, pad = 110) {
  const out = [];
  const r = new RegExp(re.source, 'g');
  let m;
  const seen = new Set();
  while ((m = r.exec(text)) && out.length < max) {
    const key = m[0];
    if (seen.has(key) && out.length > 8) continue;
    seen.add(key);
    const a = Math.max(0, m.index - pad);
    const b = Math.min(text.length, m.index + pad);
    out.push({
      hit: m[0],
      at: m.index,
      text: text.slice(a, b).replace(/\s+/g, ' '),
    });
  }
  return out;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const files = [];
  const engineHits = [];
  const shadowHits = [];

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-web-security'],
  });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    locale: 'ru-LV',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(90000);

  page.on('response', async (res) => {
    const url = res.url();
    if (!/\.(js|mjs|wasm|json)(\?|$)/i.test(url)) return;
    if (res.status() < 200 || res.status() >= 400) return;
    let text = null;
    try {
      if (/\.wasm(\?|$)/i.test(url)) {
        const buf = await res.body();
        files.push({ url, size: buf.length, kind: 'wasm' });
        return;
      }
      text = await res.text();
    } catch (_) {
      return;
    }
    if (!text) return;
    files.push({ url, size: text.length, kind: 'text' });

    const eh = snippets(text, ENGINE_RE, 8);
    if (eh.length) engineHits.push({ url, hits: eh });
    const sh = snippets(text, SHADOW_RE, 30);
    if (sh.length) shadowHits.push({ url, size: text.length, hits: sh });
  });

  console.log('goto', URL);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(5000);
  for (const t of ['Принять', 'Accept', 'OK']) {
    try {
      const b = page.getByRole('button', { name: t }).first();
      if ((await b.count()) > 0) await b.click({ timeout: 2000 });
    } catch (_) {}
  }
  /** Бандл планировщика грузится не сразу — дать iframe добрать чанки. */
  await page.waitForTimeout(25000);

  const out = {
    at: new Date().toISOString(),
    url: URL,
    fileCount: files.length,
    totalBytes: files.reduce((s, f) => s + f.size, 0),
    biggest: [...files].sort((a, b) => b.size - a.size).slice(0, 15),
    engineHits,
    shadowHits,
  };
  const file = join(OUT_DIR, `js-grep-${stamp()}.json`);
  writeFileSync(file, JSON.stringify(out, null, 2));
  console.log(
    'files=', files.length,
    'engineHitFiles=', engineHits.length,
    'shadowHitFiles=', shadowHits.length
  );
  console.log('wrote', file);
  await browser.close();
}

main().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
