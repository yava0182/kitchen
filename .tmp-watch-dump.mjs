import { chromium } from 'playwright';
import fs from 'fs';

const browser = await chromium.connectOverCDP('http://127.0.0.1:9334');
const context = browser.contexts()[0];
const page =
  context.pages().find((p) => /localhost:8100/.test(p.url())) ||
  context.pages()[0];

await page.screenshot({
  path: 'D:/Clodis-Kitchen/.tmp-watch-now.png',
  fullPage: false,
});

const info = await page.evaluate(() => {
  const s = window.__CLD_STATE_SINGLETON__ || window.state;
  const text = (document.body?.innerText || '').replace(/\s+/g, ' ').slice(0, 1200);
  const buttons = [...document.querySelectorAll('button, [role="button"], a')]
    .map((el) => (el.textContent || '').trim().replace(/\s+/g, ' '))
    .filter((t) => t && t.length < 80)
    .slice(0, 80);
  const pills = [...document.querySelectorAll('[class*="pill"], [class*="catalog"], [data-catalog]')]
    .map((el) => ({
      t: (el.textContent || '').trim().slice(0, 60),
      cls: el.className?.toString?.().slice?.(0, 80),
    }))
    .slice(0, 40);
  return {
    href: location.href,
    title: document.title,
    step: s?.currentRoomStep ?? s?.roomStep ?? s?.ui?.step ?? null,
    sections: (s?.customSections || []).length,
    kitchenOn: s?.kitchenSectionsEnabled,
    text,
    buttons,
    pills,
    hasNSH: /НШ|1 ярус|Навесн/i.test(text),
  };
});

fs.writeFileSync(
  'D:/Clodis-Kitchen/.tmp-watch-info.json',
  JSON.stringify(info, null, 2),
  'utf8'
);
console.log(JSON.stringify(info, null, 2));
process.exit(0);
