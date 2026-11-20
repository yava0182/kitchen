/**
 * IKEA: dismiss Error → скос → клик стены → Создать → 2D иконка → скрин UI.
 *   node scripts/ikea-click-slope-icon.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '../docs/ikea-kitchen-slope-dump');
mkdirSync(OUT, { recursive: true });
const URL = 'https://kitchen.planner.ikea.com/lv/ru/planner/';

const log = [];
const note = (m) => {
  console.log(m);
  log.push(String(m));
};

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, locale: 'ru-RU' });
page.setDefaultTimeout(60000);

async function shot(name) {
  const path = join(OUT, name);
  try {
    await page.locator('iframe').first().screenshot({ path });
  } catch (_) {
    await page.screenshot({ path }).catch(() => {});
  }
  note('shot ' + name);
}

async function findFrame() {
  for (let i = 0; i < 90; i++) {
    const f = page.frames().find((x) => /ikea-prod\.by\.me/i.test(x.url()));
    if (f) return f;
    await page.waitForTimeout(500);
  }
  return null;
}

async function dismissError(frame) {
  const body = await frame.evaluate(() => document.body?.innerText || '');
  if (!/encountered an error|Refresh the application/i.test(body)) {
    note('no error banner');
    return false;
  }
  note('ERROR BANNER present — dismiss');
  for (const t of ['Go back', 'Refresh', 'Обновить', 'Назад']) {
    try {
      await frame.getByRole('button', { name: new RegExp(t, 'i') }).first().click({ timeout: 2000 });
      note('clicked ' + t);
      await page.waitForTimeout(3000);
      return true;
    } catch (_) {}
    try {
      await frame.getByText(t, { exact: false }).first().click({ timeout: 1500 });
      note('text ' + t);
      await page.waitForTimeout(3000);
      return true;
    } catch (_) {}
  }
  return false;
}

async function hasAbc(frame) {
  return frame.evaluate(() => {
    if (document.querySelector('#sloped-ceiling-a')) return true;
    if (document.querySelector('.mod-overlay-container-sloped-ceiling .sloped-measures')) return true;
    if (document.querySelector('figure.illustration img')) return true;
    for (const b of document.querySelectorAll('button')) {
      if ((b.innerText || '').trim() === 'Создать') return true;
    }
    return false;
  });
}

async function probeApp(frame) {
  return frame.evaluate(() => {
    const g = window;
    const info = {
      hasApp: !!g.app,
      hasByMe: !!g.ByMeAPI,
      appType: g.app ? typeof g.app : null,
      appKeys: g.app ? Object.keys(g.app).slice(0, 60) : [],
      byKeys: g.ByMeAPI ? Object.keys(g.ByMeAPI).slice(0, 40) : [],
    };
    try {
      info.appLevel = !!(g.app && g.app.level);
      info.walls = g.app?.level?.getWalls?.()?.length;
    } catch (e) {
      info.appErr = String(e);
    }
    try {
      info.byLevel = !!(g.ByMeAPI && g.ByMeAPI.app && g.ByMeAPI.app.level);
      info.byWalls = g.ByMeAPI?.app?.level?.getWalls?.()?.length;
    } catch (e) {
      info.byErr = String(e);
    }
    // find state with SlopedCeiling
    try {
      const st = g.app?._lastState || g.app?.state || g.app?.currentState;
      info.stateName = st?.constructor?.name || typeof st;
      info.stateKeys = st ? Object.keys(st).slice(0, 40) : [];
    } catch (_) {}
    return info;
  });
}

try {
  note('goto ' + URL);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(4000);
  try {
    await page.getByText('Принять').first().click({ timeout: 4000 });
  } catch (_) {}

  let frame = await findFrame();
  if (!frame) throw new Error('no frame');
  note('frame ' + frame.url());
  await page.waitForTimeout(12000);

  // dismiss shape modal
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  await dismissError(frame);
  await page.waitForTimeout(2000);
  // re-find frame after refresh/go back
  frame = (await findFrame()) || frame;

  let appInfo = await probeApp(frame);
  note('app0 ' + JSON.stringify(appInfo));
  writeFileSync(join(OUT, 'click-slope-app0.json'), JSON.stringify(appInfo, null, 2));

  // If still error / no walls — reload iframe URL once
  if (appInfo.walls == null && appInfo.byWalls == null) {
    note('reload planner iframe');
    await frame.evaluate(() => location.reload());
    await page.waitForTimeout(15000);
    frame = (await findFrame()) || frame;
    await dismissError(frame);
    appInfo = await probeApp(frame);
    note('app1 ' + JSON.stringify(appInfo));
  }

  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // open tool
  await frame.locator('#draw-plan').click({ timeout: 10000 });
  await page.waitForTimeout(800);
  await frame.getByText('Добавить скошенный потолок').first().click({ timeout: 8000 });
  note('tool open');
  await page.waitForTimeout(3500);
  await shot('click-slope-04-slope-tool.png');
  await dismissError(frame);

  appInfo = await probeApp(frame);
  note('app2 ' + JSON.stringify(appInfo));
  writeFileSync(join(OUT, 'click-slope-app2.json'), JSON.stringify(appInfo, null, 2));

  // Prefer 2D for wall click? Tool forces 3D. Try switching to floor view while in tool.
  try {
    await frame.locator('#sloped-ceiling-layer').getByText('Вид на этаж').click({ timeout: 2000 });
    note('switched 2d in tool');
    await page.waitForTimeout(1000);
  } catch (_) {
    try {
      await frame.locator('#sloped-ceiling-layer button, #sloped-ceiling-layer [role="button"]').nth(0).click({ timeout: 1500 });
    } catch (_) {}
  }
  await shot('click-slope-04b-view.png');

  // Click walls — use page.mouse with canvas boundingBox (page coords)
  const canvas = frame.locator('#canvas, canvas').first();
  const box = await canvas.boundingBox();
  note('box ' + JSON.stringify(box));

  // In 3D: left/right walls are the bright vertical faces
  // Also try 2D: walls around center square ~ 0.35-0.65
  const pts = [
    // 3D left face
    [0.22, 0.45], [0.24, 0.5], [0.2, 0.4], [0.18, 0.55],
    // 3D right
    [0.78, 0.45], [0.8, 0.5], [0.76, 0.4], [0.82, 0.55],
    // 3D back (window wall) — click beside window
    [0.35, 0.3], [0.65, 0.3], [0.5, 0.25], [0.4, 0.35],
    // 2D-ish room walls
    [0.5, 0.28], [0.5, 0.72], [0.32, 0.5], [0.68, 0.5],
    [0.5, 0.33], [0.5, 0.67], [0.38, 0.5], [0.62, 0.5],
  ];

  let hit = false;
  for (const [rx, ry] of pts) {
    const x = box.x + box.width * rx;
    const y = box.y + box.height * ry;
    await page.mouse.click(x, y, { delay: 40 });
    await page.waitForTimeout(600);
    if (await hasAbc(frame)) {
      note(`HIT ${rx},${ry}`);
      hit = true;
      break;
    }
  }

  // If still no — try selecting wall via app API
  if (!hit) {
    note('trying API select/create slope');
    const apiRes = await frame.evaluate(() => {
      const app = window.app || window.ByMeAPI?.app;
      if (!app?.level) return { err: 'no level', appKeys: window.app ? Object.keys(window.app) : null };
      const walls = app.level.getWalls();
      const w = walls[0];
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(w) || {}).filter((n) =>
        /slope|Slope|setBase|setDepth|setAngle|Height|Depth|Angle/i.test(n)
      );
      const r = { methods, wallCount: walls.length, tried: [] };
      try {
        if (w.setBaseHeightOneSlope) {
          w.setBaseHeightOneSlope(1300);
          r.tried.push('setBaseHeightOneSlope');
        }
        if (w.setDepthOneSlope) {
          w.setDepthOneSlope(1400);
          r.tried.push('setDepthOneSlope');
        }
        if (w.setAngleOneSlope) {
          w.setAngleOneSlope(131);
          r.tried.push('setAngleOneSlope');
        }
      } catch (e) {
        r.setErr = String(e);
      }
      // find SlopedCeilingEditor state
      try {
        const st = app._lastState || app.state;
        r.state = st?.constructor?.name;
        if (st && typeof st._startEditPanel === 'function') {
          r.hasStartEdit = true;
        }
        // selection
        const sel = app.viewer?.selection;
        r.hasSel = !!sel;
        if (sel && typeof sel.add === 'function') {
          // try pick wall model
          r.tried.push('sel-exists');
        }
      } catch (e) {
        r.stErr = String(e);
      }
      try {
        app.viewer?.updateSlopedWallSVG?.();
        app.level?.updateGeometry2D?.();
        app.viewer?.askForRedraw?.();
      } catch (_) {}
      r.after = walls.map((wall, i) => {
        try {
          return { i, d: wall.getDepthOneSlope?.(), h: wall.getBaseHeightOneSlope?.() };
        } catch (e) {
          return { i, e: String(e) };
        }
      });
      return r;
    });
    note('api ' + JSON.stringify(apiRes).slice(0, 1200));
    writeFileSync(join(OUT, 'click-slope-api.json'), JSON.stringify(apiRes, null, 2));
    hit = await hasAbc(frame);
  }

  await shot(hit ? 'click-slope-05-abc.png' : 'click-slope-05-no-abc.png');

  if (hit || (await hasAbc(frame))) {
    await frame.locator('button:has-text("Создать")').first().click({ timeout: 5000 });
    note('create');
    await page.waitForTimeout(1500);
    await shot('click-slope-06-after-create.png');
  }

  // OK leave
  await frame.locator('button:has-text("OK"), button:has-text("ОК")').first().click({ timeout: 4000 }).catch(() => note('ok miss'));
  await page.waitForTimeout(1500);

  // 2D
  await frame.getByText('Вид на этаж').first().click({ timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await shot('click-slope-06b-2d.png');

  // icons
  const icons = await frame.evaluate(() =>
    [...document.querySelectorAll('img')].map((el) => {
      const r = el.getBoundingClientRect();
      const src = el.getAttribute('src') || '';
      return { src: src.slice(-140), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) };
    }).filter((i) => /slopedCeiling|feedback|slope/i.test(i.src) && i.w >= 8)
  );
  note('icons ' + JSON.stringify(icons));
  writeFileSync(join(OUT, 'click-slope-icons.json'), JSON.stringify(icons, null, 2));

  // also dump all small imgs
  const small = await frame.evaluate(() =>
    [...document.querySelectorAll('img')].map((el) => {
      const r = el.getBoundingClientRect();
      return { src: (el.getAttribute('src') || '').slice(-80), w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y) };
    }).filter((i) => i.w >= 20 && i.w <= 64 && i.h >= 20 && i.h <= 64)
  );
  note('smallImgs ' + JSON.stringify(small).slice(0, 800));

  if (icons[0]) {
    const ib = await page.locator('iframe').first().boundingBox();
    const ic = icons[0];
    note(`CLICK ICON @ ${ic.x},${ic.y}`);
    await page.mouse.click(ib.x + ic.x, ib.y + ic.y);
    await page.waitForTimeout(1600);
    await shot('click-slope-07-after-icon.png');
    const after = await frame.evaluate(() => {
      const texts = [];
      document.querySelectorAll('button, [role="button"], [class*="overlay"], [class*="action"]').forEach((el) => {
        const t = (el.innerText || '').trim().replace(/\s+/g, ' ');
        if (t && t.length < 200) texts.push(t.slice(0, 140));
      });
      return {
        texts: [...new Set(texts)].filter((t) => /Изменить|Удалить|Change|Delete|Зона|Zone|скош|Создать|Удал/i.test(t)),
        allShort: [...new Set(texts)].slice(0, 50),
        body: (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 4500),
      };
    });
    writeFileSync(join(OUT, 'click-slope-AFTER-ICON.txt'), JSON.stringify(after, null, 2));
    note('AFTER: ' + after.texts.join(' | '));
    try {
      await frame.getByText(/Изменить/).first().click({ timeout: 3000 });
      await page.waitForTimeout(1200);
      await shot('click-slope-08-change.png');
    } catch (_) {}
  } else {
    note('NO ICON');
    await shot('click-slope-07-no-icon.png');
    // final body dump
    const body = await frame.evaluate(() => (document.body.innerText || '').slice(0, 3000));
    writeFileSync(join(OUT, 'click-slope-final-body.txt'), body);
  }

  writeFileSync(join(OUT, 'click-slope-log.txt'), log.join('\n'));
  note('DONE');
  await page.waitForTimeout(4000);
} catch (e) {
  note('ERR ' + e);
  writeFileSync(join(OUT, 'click-slope-log.txt'), log.join('\n') + '\n' + e);
} finally {
  await browser.close();
}
