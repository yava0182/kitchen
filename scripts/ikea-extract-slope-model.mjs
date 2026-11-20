/**
 * Phase 2: extract IKEA kitchen sloped-ceiling model from public assets + ByMeAPI.
 * No screenshot clicking.
 *
 *   node scripts/ikea-extract-slope-model.mjs
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dir, '../docs/ikea-kitchen-slope-dump');
mkdirSync(OUT_DIR, { recursive: true });

const ASSETS = [
  'https://kitchen.ikea-prod.by.me/Kitchen/assets/translation-master.json',
  'https://platform.ikea-prod.by.me/api/3/applicationdistributions/LV/translations/ru-LV',
  'https://kitchen.ikea-prod.by.me/Kitchen/assets/js/app.js',
  'https://kitchen.ikea-prod.by.me/common~Kitchen~Kitchen/common~Kitchen~KitchenRTL.js',
  'https://kitchen.ikea-prod.by.me/common~Kitchen~KitchenRTL~TemplateEditor/common~Kitchen~KitchenRTL~TemplateEditor.js',
];

const KEY_RE =
  /slope|sloping|sloped|attic|pitched|roof.?window|мансард|скос|скошен|потолк/i;

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      accept: '*/*',
    },
  });
  if (!res.ok) throw new Error(res.status + ' ' + url);
  return { url, status: res.status, text: await res.text() };
}

function walkJson(obj, path, out) {
  if (obj == null) return;
  if (typeof obj === 'string') {
    if (KEY_RE.test(path.join('.')) || KEY_RE.test(obj)) {
      out.push({ path: path.join('.'), value: obj });
    }
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => walkJson(v, path.concat(String(i)), out));
    return;
  }
  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) walkJson(v, path.concat(k), out);
  }
}

function extractJsSnippets(text, url) {
  const snippets = [];
  const re =
    /.{0,120}(sloped?[_\s-]?ceiling|sloping|add_sloped|sloped_wall|attic|Dimension[ABC]|knee.?wall|ceilingHeight|wallHeight|slopeDepth|slopeHeight).{0,180}/gi;
  let m;
  let n = 0;
  while ((m = re.exec(text)) && n < 80) {
    snippets.push(m[0].replace(/\s+/g, ' '));
    n++;
  }
  // also pull nearby identifiers around "sloped"
  const idRe = /[A-Za-z_][A-Za-z0-9_]{0,60}slop[A-Za-z0-9_]{0,60}/gi;
  const ids = new Set();
  while ((m = idRe.exec(text)) && ids.size < 100) ids.add(m[0]);
  return { url, snippets, identifiers: [...ids] };
}

async function dumpByMeAPI() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://kitchen.planner.ikea.com/lv/ru/planner/', {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  let frame = null;
  for (let i = 0; i < 60; i++) {
    frame = page.frames().find((f) => /ikea-prod\.by\.me\/Kitchen/i.test(f.url()));
    if (frame) break;
    await page.waitForTimeout(1000);
  }
  if (!frame) {
    await browser.close();
    return { err: 'no frame' };
  }
  await page.waitForTimeout(10000);
  const api = await frame.evaluate(() => {
    const api = window.ByMeAPI;
    if (!api) return { err: 'no ByMeAPI' };
    const proto = [];
    let cur = api;
    const seen = new Set();
    while (cur && proto.length < 200) {
      for (const k of Object.getOwnPropertyNames(cur)) {
        if (seen.has(k)) continue;
        seen.add(k);
        let t = typeof api[k];
        let sample = null;
        try {
          if (t === 'function') sample = 'fn';
          else if (t === 'object' && api[k]) sample = Object.keys(api[k]).slice(0, 40);
          else sample = api[k];
        } catch (e) {
          sample = 'err:' + e.message;
        }
        proto.push({ key: k, type: t, sample });
      }
      cur = Object.getPrototypeOf(cur);
    }
    // string dump of api if toString useful
    let str = null;
    try {
      str = String(api).slice(0, 500);
    } catch (_) {}
    // search nested for slope-ish keys
    const slopeish = [];
    const walk = (o, path, depth) => {
      if (!o || depth > 4 || slopeish.length > 80) return;
      if (typeof o !== 'object') return;
      for (const k of Object.keys(o)) {
        if (/slope|sloping|ceiling|attic|roof|wall/i.test(k)) {
          let v = o[k];
          let kind = typeof v;
          if (kind === 'function') v = 'fn';
          else if (kind === 'object' && v) v = Object.keys(v).slice(0, 30);
          slopeish.push({ path: path.concat(k).join('.'), kind, value: v });
        }
        try {
          if (typeof o[k] === 'object') walk(o[k], path.concat(k), depth + 1);
        } catch (_) {}
      }
    };
    walk(api, ['ByMeAPI'], 0);
    return { keys: proto, slopeish, str };
  });
  await browser.close();
  return api;
}

async function main() {
  const localeHits = [];
  const jsExtracts = [];

  for (const url of ASSETS) {
    console.log('fetch', url);
    try {
      const { text } = await fetchText(url);
      writeFileSync(
        join(OUT_DIR, url.split('/').pop().split('?')[0].replace(/[~]/g, '_')),
        text,
        'utf8'
      );
      if (url.endsWith('.json') || url.includes('/translations/')) {
        try {
          const json = JSON.parse(text);
          walkJson(json, [], localeHits);
        } catch (e) {
          // maybe wrapped
          const m = text.match(/\{[\s\S]*\}/);
          if (m) {
            try {
              walkJson(JSON.parse(m[0]), [], localeHits);
            } catch (_) {}
          }
        }
      } else {
        jsExtracts.push(extractJsSnippets(text, url));
      }
    } catch (e) {
      console.warn('fail', url, e.message);
    }
  }

  console.log('ByMeAPI introspect…');
  const byMe = await dumpByMeAPI();

  // Filter locale to slope-relevant only (already partially filtered by walk)
  const slopeLocale = localeHits.filter(
    (h) => KEY_RE.test(h.path) || KEY_RE.test(h.value)
  );

  const out = {
    schema: 'ikea-kitchen-slope-model-20261006',
    at: new Date().toISOString(),
    slopeLocale,
    jsExtracts,
    byMe,
  };
  const outPath = join(OUT_DIR, 'slope-model.json');
  writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote', outPath);
  console.log('locale keys', slopeLocale.length);
  console.log(
    'js ids',
    jsExtracts.map((j) => j.identifiers?.length || 0).join(',')
  );
  console.log('ByMeAPI keys', byMe?.keys?.length, 'slopeish', byMe?.slopeish?.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
