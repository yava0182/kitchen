/**
 * Find HTML markup for sloped-ceiling overlay (defaults A/B/C) in Kitchen assets.
 *   node scripts/ikea-find-slope-html.mjs
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '../docs/ikea-kitchen-slope-dump');
mkdirSync(OUT, { recursive: true });

const NEEDLE = 'mod-overlay-container-sloped-ceiling';
const NEEDLES = [
  NEEDLE,
  'toggle-schema',
  'sloped_ceiling.description',
  'data-ui-selector="sloped',
  'sloped-ceiling-form',
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const matches = [];

  page.on('response', async (res) => {
    try {
      if (res.status() !== 200) return;
      const url = res.url();
      const ct = (res.headers()['content-type'] || '').toLowerCase();
      if (!/javascript|json|html|text|xml/i.test(ct) && !/\.(js|html|json|xml|svg)(\?|$)/i.test(url))
        return;
      let text;
      try {
        text = await res.text();
      } catch {
        return;
      }
      if (text.length > 12_000_000) text = text.slice(0, 12_000_000);
      for (const n of NEEDLES) {
        if (!text.includes(n)) continue;
        let idx = 0;
        let c = 0;
        while ((idx = text.indexOf(n, idx)) >= 0 && c < 3) {
          matches.push({
            url,
            needle: n,
            ctx: text.slice(Math.max(0, idx - 200), idx + 1200),
          });
          idx += n.length;
          c++;
        }
      }
    } catch (_) {}
  });

  await page.goto('https://kitchen.planner.ikea.com/lv/ru/planner/', {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  await page.waitForTimeout(20000);

  // also probe known static paths
  const probes = [
    '/Kitchen/assets/html/',
    '/Kitchen/templates/',
    '/Kitchen/assets/templates/',
    '/Kitchen/views/',
  ];
  const frame = page.frames().find((f) => /Kitchen/i.test(f.url()));
  const origin = 'https://kitchen.ikea-prod.by.me';
  for (const p of probes) {
    try {
      const r = await page.request.get(origin + p);
      matches.push({ probe: origin + p, status: r.status(), body: (await r.text()).slice(0, 300) });
    } catch (e) {
      matches.push({ probe: origin + p, err: String(e.message || e) });
    }
  }

  // Search webpack for HTML template literal with value="1300" near slope
  // Download the big vendors that are likely to contain UI templates
  const vendorUrls = [
    'https://kitchen.ikea-prod.by.me/vendors~Kitchen~KitchenRTL~TemplateEditor/vendors~Kitchen~KitchenRTL~TemplateEditor.js',
    'https://kitchen.ikea-prod.by.me/Kitchen/Kitchen.js',
    'https://kitchen.ikea-prod.by.me/Kitchen/KitchenRTL.js',
  ];
  for (const u of vendorUrls) {
    try {
      const r = await page.request.get(u);
      const text = await r.text();
      writeFileSync(
        join(OUT, 'extra-' + u.split('/').pop().replace(/[~]/g, '_')),
        text,
        'utf8'
      );
      for (const n of [...NEEDLES, '1300', 'value=\"13', 'slopedCeiling', 'SlopedCeilingEditor']) {
        if (!text.includes(n) && n !== '1300') continue;
        if (n === '1300') {
          // only keep if nearby slope
          let idx = 0;
          let c = 0;
          while ((idx = text.indexOf('1300', idx)) >= 0 && c < 20) {
            const ctx = text.slice(Math.max(0, idx - 80), idx + 80);
            if (/slop|ceiling|height|depth|wall|mm/i.test(ctx)) {
              matches.push({ url: u, needle: '1300@slopeish', ctx });
            }
            idx += 4;
            c++;
          }
          continue;
        }
        let idx = 0;
        let c = 0;
        while ((idx = text.indexOf(n, idx)) >= 0 && c < 4) {
          matches.push({
            url: u,
            needle: n,
            ctx: text.slice(Math.max(0, idx - 250), idx + 1500),
          });
          idx += n.length;
          c++;
        }
      }
    } catch (e) {
      matches.push({ url: u, err: String(e.message || e) });
    }
  }

  writeFileSync(join(OUT, 'slope-html-search.json'), JSON.stringify(matches, null, 2), 'utf8');
  console.log('matches', matches.length);
  const good = matches.filter((m) => m.ctx && /slop/i.test(m.ctx + (m.needle || '')));
  console.log('slopeish', good.length);
  for (const m of good.slice(0, 8)) {
    console.log('\n---', m.needle, (m.url || '').slice(-60));
    console.log((m.ctx || '').replace(/\s+/g, ' ').slice(0, 400));
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
