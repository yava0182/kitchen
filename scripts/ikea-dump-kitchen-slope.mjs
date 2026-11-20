/**
 * IKEA Kitchen Planner — dump «скошенный потолок» без кликов на глаз.
 *
 * Что делает:
 *  1) Перехват сети (json/js/wasm/locale) → grep slope/ceiling/скос/A/B
 *  2) Playwright getByText / role (не координаты)
 *  3) Дамп iframe DOM + accessibility (если Unity отдаёт a11y)
 *
 * Run:
 *   node scripts/ikea-dump-kitchen-slope.mjs
 *   node scripts/ikea-dump-kitchen-slope.mjs --headed
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dir, '../docs/ikea-kitchen-slope-dump');
const OUT_JSON = join(OUT_DIR, `dump-${stamp()}.json`);
const URL =
  process.env.IKEA_KITCHEN_URL ||
  'https://kitchen.planner.ikea.com/lv/ru/planner/';

const HEADED = process.argv.includes('--headed') || process.env.HEADED === '1';

const SLOPE_RE =
  /slope|sloping|sloped|ceiling.?slope|pitched|мансард|скос|скошен|потолк|attic|roof.?angle|knee.?wall|DimensionA|DimensionB|paramA|paramB|ceilingHeight|wallHeightA/i;

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return (
    d.getFullYear() +
    p(d.getMonth() + 1) +
    p(d.getDate()) +
    '-' +
    p(d.getHours()) +
    p(d.getMinutes()) +
    p(d.getSeconds())
  );
}

function clip(s, n = 400) {
  if (s == null) return null;
  const t = String(s);
  return t.length > n ? t.slice(0, n) + '…' : t;
}

function extractHits(text, url) {
  if (!text || typeof text !== 'string') return [];
  const hits = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (SLOPE_RE.test(lines[i])) {
      hits.push({ url, line: i + 1, text: clip(lines[i], 240) });
      if (hits.length >= 40) break;
    }
  }
  if (!hits.length && SLOPE_RE.test(text)) {
    // binary-ish / minified: pull nearby snippets via regex
    const re = new RegExp(SLOPE_RE.source, 'gi');
    let m;
    let n = 0;
    while ((m = re.exec(text)) && n < 30) {
      const a = Math.max(0, m.index - 80);
      const b = Math.min(text.length, m.index + 120);
      hits.push({ url, line: null, text: clip(text.slice(a, b).replace(/\s+/g, ' '), 220) });
      n++;
    }
  }
  return hits;
}

async function safeEval(frame, fn, arg) {
  try {
    return await frame.evaluate(fn, arg);
  } catch (e) {
    return { err: String(e.message || e) };
  }
}

async function dumpFrameTree(page) {
  const frames = page.frames();
  const out = [];
  for (const f of frames) {
    const url = f.url();
    const name = f.name();
    const a11y = await safeEval(f, () => {
      const nodes = [];
      const walk = (el, depth) => {
        if (!el || depth > 6 || nodes.length > 200) return;
        const role = el.getAttribute?.('role') || el.tagName?.toLowerCase();
        const name =
          el.getAttribute?.('aria-label') ||
          el.getAttribute?.('title') ||
          (el.innerText || '').trim().slice(0, 80);
        if (name || ['button', 'a', 'input', 'select'].includes(role)) {
          nodes.push({ role, name, tag: el.tagName });
        }
        for (const c of el.children || []) walk(c, depth + 1);
      };
      walk(document.body, 0);
      return {
        title: document.title,
        bodyText: (document.body?.innerText || '').slice(0, 1500),
        canvas: [...document.querySelectorAll('canvas')].map((c) => ({
          w: c.width,
          h: c.height,
          id: c.id,
          cls: c.className,
        })),
        buttons: [...document.querySelectorAll('button,[role=button]')].slice(0, 80).map((b) => ({
          text: (b.innerText || '').trim().slice(0, 80),
          aria: b.getAttribute('aria-label'),
        })),
        nodes,
      };
    });
    out.push({ name, url, a11y });
  }
  return out;
}

async function tryClickByTexts(frame, labels) {
  const tried = [];
  for (const label of labels) {
    const entry = { label, ok: false, how: null, err: null };
    try {
      const loc = frame.getByText(label, { exact: false }).first();
      const count = await loc.count();
      entry.count = count;
      if (count > 0) {
        await loc.click({ timeout: 5000 });
        entry.ok = true;
        entry.how = 'getByText';
        tried.push(entry);
        return tried;
      }
    } catch (e) {
      entry.err = String(e.message || e).slice(0, 200);
    }
    try {
      const loc = frame.getByRole('button', { name: label }).first();
      const count = await loc.count();
      entry.countRole = count;
      if (count > 0) {
        await loc.click({ timeout: 5000 });
        entry.ok = true;
        entry.how = 'getByRole';
        tried.push(entry);
        return tried;
      }
    } catch (e) {
      entry.err = (entry.err || '') + ' | ' + String(e.message || e).slice(0, 160);
    }
    tried.push(entry);
  }
  return tried;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const hits = [];
  const networkMeta = [];
  const savedBodies = [];

  const browser = await chromium.launch({
    headless: !HEADED,
    args: ['--disable-web-security'], // allow probing cross-frame where possible
  });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    locale: 'ru-LV',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(90000);

  page.on('response', async (res) => {
    try {
      const url = res.url();
      const ct = (res.headers()['content-type'] || '').toLowerCase();
      const status = res.status();
      const interesting =
        /json|javascript|wasm|text|xml|octet|unity|data|locale|i18n|lang|config|bundle/i.test(ct) ||
        /\.(json|js|mjs|wasm|data|unityweb|bundle|xml|txt)(\?|$)/i.test(url) ||
        /locale|i18n|lang|config|catalog|project|room|ceiling|slope/i.test(url);
      if (!interesting) return;
      networkMeta.push({ url: clip(url, 220), status, ct: clip(ct, 80) });
      if (status < 200 || status >= 400) return;
      // skip huge binaries except for string scan of small-ish text
      let text = null;
      try {
        if (/json|javascript|text|xml|locale/i.test(ct) || /\.(json|js|mjs|xml|txt)(\?|$)/i.test(url)) {
          text = await res.text();
        }
      } catch (_) {
        return;
      }
      if (!text) return;
      if (text.length > 8_000_000) text = text.slice(0, 8_000_000);
      const h = extractHits(text, url);
      if (h.length) {
        hits.push(...h);
        savedBodies.push({
          url: clip(url, 260),
          size: text.length,
          sampleHits: h.slice(0, 8),
        });
      }
    } catch (_) {}
  });

  console.log('goto', URL, HEADED ? '(headed)' : '(headless)');
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(4000);

  // dismiss cookie / notice on shell
  for (const t of ['Убрать уведомление', 'Принять', 'Accept', 'OK', 'Agree']) {
    try {
      const b = page.getByRole('button', { name: t }).first();
      if ((await b.count()) > 0) await b.click({ timeout: 2000 });
    } catch (_) {}
  }

  // wait for planner iframe
  let plannerFrame = null;
  for (let i = 0; i < 60; i++) {
    plannerFrame =
      page.frames().find((f) => /ikea-prod\.by\.me|by\.me\/Kitchen|kitchen\.ikea/i.test(f.url())) ||
      null;
    if (plannerFrame) break;
    await page.waitForTimeout(1000);
  }
  console.log('plannerFrame', plannerFrame ? plannerFrame.url() : null);

  // give Unity time to boot + fire locale packs
  await page.waitForTimeout(12000);

  const framesBefore = await dumpFrameTree(page);

  // Script clicks by TEXT — not by xy
  const clickLog = [];
  const targets = plannerFrame || page;

  clickLog.push({
    step: 'draw_plan',
    tried: await tryClickByTexts(targets, [
      'Нарисовать план',
      'Draw plan',
      'Draw Plan',
    ]),
  });
  await page.waitForTimeout(2000);

  clickLog.push({
    step: 'add_slope',
    tried: await tryClickByTexts(targets, [
      'Добавить скошенный потолок',
      'Add sloped ceiling',
      'sloped ceiling',
      'скошенный потолок',
    ]),
  });
  await page.waitForTimeout(3000);

  const framesAfter = await dumpFrameTree(page);

  // Also probe window globals in planner frame for Unity/Module hooks
  const globals = plannerFrame
    ? await safeEval(plannerFrame, () => {
        const keys = Object.keys(window).filter((k) =>
          /unity|Module|gameInstance|SendMessage|byme|kitchen|room|slope|ceiling/i.test(k)
        );
        const out = { keys: keys.slice(0, 80) };
        try {
          if (window.unityInstance?.SendMessage) out.hasUnitySendMessage = true;
        } catch (_) {}
        try {
          if (typeof window.Module === 'object') out.moduleKeys = Object.keys(window.Module).slice(0, 40);
        } catch (_) {}
        return out;
      })
    : { err: 'no planner frame' };

  // Dedupe hits
  const seen = new Set();
  const uniqueHits = [];
  for (const h of hits) {
    const k = (h.url || '') + '|' + (h.text || '');
    if (seen.has(k)) continue;
    seen.add(k);
    uniqueHits.push(h);
  }

  const out = {
    schema: 'ikea-kitchen-slope-dump-20261006',
    agent: 'playwright scripts/ikea-dump-kitchen-slope.mjs',
    url: URL,
    headed: HEADED,
    at: new Date().toISOString(),
    plannerFrame: plannerFrame ? plannerFrame.url() : null,
    clickLog,
    globals,
    networkCount: networkMeta.length,
    networkSample: networkMeta.slice(0, 120),
    slopeHits: uniqueHits.slice(0, 200),
    bodiesWithHits: savedBodies.slice(0, 40),
    framesBefore,
    framesAfter,
  };

  writeFileSync(OUT_JSON, JSON.stringify(out, null, 2), 'utf8');
  writeFileSync(join(OUT_DIR, 'latest.json'), JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote', OUT_JSON);
  console.log('slopeHits', uniqueHits.length, 'network', networkMeta.length);
  console.log(
    'click ok?',
    clickLog.map((c) => c.step + ':' + c.tried.some((t) => t.ok)).join(' ')
  );

  if (!HEADED) await browser.close();
  else {
    console.log('headed: browser left open 60s for manual assist…');
    await page.waitForTimeout(60000);
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
