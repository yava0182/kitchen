/**
 * Сам перехватывает сеть IKEA AutoDesign (BMPROJ / templates / products).
 * Ловит запросы из ВСЕХ frame (в т.ч. 3dvia_frame Kitchen).
 *
 *   node scripts/ikea-dump-autodesign.mjs --headed
 *
 * Скрипт откроет браузер. Если автоклики не дойдут до вариантов —
 * вручную дойди до 1…8 и покликай; сеть всё равно пишется.
 * Ctrl+C или подожди таймаут → JSON в docs/ikea-kitchen-autodesign-dump/
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '../docs/ikea-kitchen-autodesign-dump');
const URL =
  process.env.IKEA_KITCHEN_URL ||
  'https://kitchen.planner.ikea.com/lv/ru/planner/';
const HEADED = process.argv.includes('--headed') || process.env.HEADED === '1';
const WAIT_MS = Number(process.env.IKEA_AD_WAIT_MS || 180000);

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

const INTEREST = /BMPROJ|\/templates\/|autodesign|solution|products\?|water.?suppl|template/i;
const hits = [];

function note(row) {
  hits.push({ t: Date.now(), ...row });
  console.log('[AD]', row.kind, (row.url || '').slice(0, 120), row.status || '', row.bytes || '');
}

async function tryClick(scope, names) {
  for (const name of names) {
    try {
      const b = scope.getByRole('button', { name, exact: false }).first();
      if ((await b.count()) > 0) {
        await b.click({ timeout: 4000 });
        console.log('clicked', name);
        return name;
      }
    } catch (_) {}
    try {
      const t = scope.getByText(name, { exact: false }).first();
      if ((await t.count()) > 0) {
        await t.click({ timeout: 4000 });
        console.log('clicked text', name);
        return name;
      }
    } catch (_) {}
  }
  return null;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    headless: !HEADED,
    args: ['--disable-web-security'],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'ru-LV',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  page.on('request', (req) => {
    const url = req.url();
    if (!INTEREST.test(url)) return;
    note({ kind: 'req', method: req.method(), url, frame: req.frame()?.url?.() || null });
  });
  page.on('response', async (res) => {
    const url = res.url();
    if (!INTEREST.test(url)) return;
    let bytes = null;
    try {
      const buf = await res.body();
      bytes = buf?.length ?? null;
    } catch (_) {}
    note({
      kind: 'res',
      status: res.status(),
      url,
      contentType: res.headers()['content-type'] || null,
      bytes,
    });
  });

  console.log('goto', URL, HEADED ? 'headed' : 'headless');
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(5000);

  for (const t of ['Принять', 'Accept', 'Убрать уведомление', 'OK', 'Agree']) {
    await tryClick(page, [t]);
  }

  // ждём Kitchen frame
  let kitchen = null;
  for (let i = 0; i < 90; i++) {
    kitchen =
      page.frames().find((f) => /ikea-prod\.by\.me|Kitchen/i.test(f.url())) || null;
    if (kitchen) break;
    await page.waitForTimeout(1000);
  }
  console.log('kitchen frame', kitchen ? kitchen.url() : null);
  await page.waitForTimeout(8000);

  const scope = kitchen || page;

  // попытка пройти воронку (может не сработать без полной комнаты)
  await tryClick(scope, ['Продолжить', 'Continue']);
  await page.waitForTimeout(2000);
  await tryClick(scope, ['Вывод воды', 'Water']);
  await page.waitForTimeout(1500);
  await tryClick(scope, ['OK', 'Ок']);
  await page.waitForTimeout(2000);
  await tryClick(scope, ['Продолжить', 'Continue']);
  await page.waitForTimeout(3000);

  // клики по цифрам вариантов, если уже на шаге
  for (const n of ['1', '2', '3', '4']) {
    await tryClick(scope, [n]);
    await page.waitForTimeout(2500);
  }

  console.log(
    '\n=== Жду сеть ещё',
    Math.round(WAIT_MS / 1000),
    'с. Можешь сам кликать варианты 1…N в окне браузера ===\n'
  );
  await page.waitForTimeout(WAIT_MS);

  const bmproj = hits.filter((h) => /BMPROJ/i.test(h.url || ''));
  const uuids = Array.from(
    new Set(
      hits
        .flatMap((h) => String(h.url || '').match(/[0-9A-Fa-f-]{36}/g) || [])
    )
  );
  const out = {
    at: new Date().toISOString(),
    href: page.url(),
    kitchenFrame: kitchen ? kitchen.url() : null,
    hits,
    bmprojUrls: bmproj.map((h) => h.url),
    uuids,
  };
  const file = join(OUT, `playwright-${stamp()}.json`);
  writeFileSync(file, JSON.stringify(out, null, 2));
  console.log('wrote', file);
  console.log('bmproj count', bmproj.length, 'uuids', uuids.length);

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
