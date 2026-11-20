/**
 * Pull sloped-ceiling overlay HTML/templates + ru-LV strings via Playwright session.
 *   node scripts/ikea-extract-slope-overlay.mjs
 */
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '../docs/ikea-kitchen-slope-dump');
mkdirSync(OUT, { recursive: true });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    locale: 'ru-LV',
  });
  const page = await context.newPage();

  const captured = [];
  page.on('response', async (res) => {
    const url = res.url();
    try {
      if (/translations\/ru-LV/i.test(url) && res.status() === 200) {
        const text = await res.text();
        writeFileSync(join(OUT, 'translations-ru-LV.json'), text, 'utf8');
        captured.push({ kind: 'ru-LV', url, size: text.length });
      }
      if (/sloped|slope|ceiling/i.test(url) && res.status() === 200) {
        const ct = res.headers()['content-type'] || '';
        if (/json|html|javascript|text|xml/i.test(ct)) {
          const text = await res.text();
          const name =
            'net-' +
            url
              .split('/')
              .pop()
              .split('?')[0]
              .replace(/[^\w.-]+/g, '_')
              .slice(0, 80);
          writeFileSync(join(OUT, name), text, 'utf8');
          captured.push({ kind: 'slope-url', url, size: text.length, name });
        }
      }
    } catch (_) {}
  });

  await page.goto('https://kitchen.planner.ikea.com/lv/ru/planner/', {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });

  let frame = null;
  for (let i = 0; i < 90; i++) {
    frame = page.frames().find((f) => /ikea-prod\.by\.me\/Kitchen/i.test(f.url()));
    if (frame) break;
    await page.waitForTimeout(1000);
  }
  await page.waitForTimeout(15000);

  // Extract overlay factory + any HTML strings with A/B from app.js already on disk,
  // plus live DOM templates if present in frame.
  const live = await frame.evaluate(() => {
    const htmlBits = [];
    for (const el of document.querySelectorAll('[class*="sloped"],[id*="sloped"],[data-ui*="sloped"],figure.illustration')) {
      htmlBits.push({
        tag: el.tagName,
        id: el.id,
        cls: el.className,
        html: el.outerHTML.slice(0, 2000),
      });
    }
    // search all script/template tags
    const templates = [];
    for (const el of document.querySelectorAll('template, script[type="text/template"], script[type="text/html"]')) {
      const t = el.innerHTML || '';
      if (/slop|скос|ceiling/i.test(t)) templates.push(t.slice(0, 4000));
    }
    // scan inline HTML for measure A/B labels
    const body = document.body ? document.body.innerHTML : '';
    const idxs = [];
    for (const needle of ['sloped-ceiling', 'mod-overlay-container-sloped', 'Measure A', 'measure-a', 'param-a', 'toggle-schema']) {
      let i = body.indexOf(needle);
      if (i >= 0) idxs.push({ needle, ctx: body.slice(i, i + 800) });
    }
    return { htmlBits, templates, idxs, bodyLen: body.length };
  });

  // Grep app.js on disk for the full overlay module around "sloped-ceiling-overlay"
  const appPath = join(OUT, 'app.js');
  let overlayModule = null;
  if (readFileSync) {
    try {
      const app = readFileSync(appPath, 'utf8');
      const key = 'sloped-ceiling-overlay';
      const i = app.indexOf(key);
      if (i >= 0) {
        overlayModule = app.slice(Math.max(0, i - 500), i + 3500);
      }
      // also find HTML template strings containing illustration / radio
      const hits = [];
      const re = /[^]{0,80}sloped-ceiling[^]{0,400}/gi;
      let m;
      let n = 0;
      while ((m = re.exec(app)) && n < 25) {
        hits.push(m[0].replace(/\s+/g, ' '));
        n++;
      }
      writeFileSync(join(OUT, 'app-sloped-overlay-slice.js'), overlayModule || '', 'utf8');
      writeFileSync(join(OUT, 'app-sloped-hits.json'), JSON.stringify(hits, null, 2), 'utf8');
    } catch (e) {
      live.appErr = String(e.message || e);
    }
  }

  // Try to pull HTML partials from Kitchen static
  const partialUrls = [
    'https://kitchen.ikea-prod.by.me/Kitchen/assets/html/sloped-ceiling.html',
    'https://kitchen.ikea-prod.by.me/Kitchen/partials/sloped-ceiling.html',
    'https://kitchen.ikea-prod.by.me/Kitchen/assets/templates/sloped-ceiling.html',
  ];
  const partials = [];
  for (const u of partialUrls) {
    try {
      const r = await page.request.get(u);
      partials.push({ url: u, status: r.status(), body: (await r.text()).slice(0, 5000) });
    } catch (e) {
      partials.push({ url: u, err: String(e.message || e) });
    }
  }

  // From common bundle: extract functions mentioning SlopeFace / baseHeight
  const common = readFileSync(join(OUT, 'common_Kitchen_KitchenRTL.js'), 'utf8');
  const geo = {};
  for (const name of [
    'getSlopeSingleFace2DA',
    'getBaseHeightOneSlope',
    'getDirectionOfSlope',
    'SlopeFacePresenter2D',
    'SlopedCeiling',
    'slopedWall',
    'slopeAngle',
    'baseHeight',
  ]) {
    const list = [];
    let idx = 0;
    let n = 0;
    while ((idx = common.indexOf(name, idx)) >= 0 && n < 6) {
      list.push(common.slice(Math.max(0, idx - 80), idx + 320).replace(/\s+/g, ' '));
      idx += name.length;
      n++;
    }
    if (list.length) geo[name] = list;
  }

  // Russian locale filter if captured
  let ruSlope = null;
  try {
    const ru = JSON.parse(readFileSync(join(OUT, 'translations-ru-LV.json'), 'utf8'));
    const flat = [];
    const walk = (o, p) => {
      if (o == null) return;
      if (typeof o === 'string') {
        if (/slop|скос|потолк|мансард|attic/i.test(p + o)) flat.push({ path: p, value: o });
        return;
      }
      if (typeof o === 'object') {
        for (const [k, v] of Object.entries(o)) walk(v, p ? p + '.' + k : k);
      }
    };
    walk(ru, '');
    ruSlope = flat;
  } catch (_) {}

  const out = {
    schema: 'ikea-slope-overlay-20261006',
    at: new Date().toISOString(),
    captured,
    live,
    partials,
    geo,
    ruSlope,
  };
  writeFileSync(join(OUT, 'slope-overlay.json'), JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote slope-overlay.json');
  console.log('captured', captured.length, 'ru keys', ruSlope?.length, 'geo keys', Object.keys(geo));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
