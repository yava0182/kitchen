/**
 * Сам открывает IKEA Kitchen iframe и снимает A/B/C со стен (без ручной консоли).
 *
 *   node scripts/ikea-probe-slope-walls.mjs
 *   node scripts/ikea-probe-slope-walls.mjs --headed
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dir, '../docs/ikea-kitchen-slope-dump');
const HEADED = process.argv.includes('--headed');
const URL = 'https://kitchen.planner.ikea.com/lv/ru/planner/';

const PROBE_FN = () => {
  const g = globalThis;

  // webpack: ищем модуль/инстанс с getWalls
  function findViaWebpack() {
    const chunks =
      g.webpackChunk ||
      g.webpackChunkbyme ||
      g.webpackChunkkitchen ||
      Object.keys(g)
        .filter((k) => /^webpackChunk/i.test(k))
        .map((k) => g[k])[0];
    const found = [];
    try {
      if (Array.isArray(chunks)) {
        for (const c of chunks) {
          if (!Array.isArray(c) || !c[1]) continue;
          const mods = c[1];
          for (const id of Object.keys(mods)) {
            try {
              const m = { exports: {} };
              mods[id](m, m.exports, (x) => x);
            } catch (_) {}
          }
        }
      }
    } catch (_) {}
    // обход всех объектов с getWalls
    const seen = new Set();
    function walk(obj, path, depth) {
      if (!obj || depth > 4 || seen.has(obj) || found.length > 5) return;
      if (typeof obj !== 'object' && typeof obj !== 'function') return;
      seen.add(obj);
      try {
        if (typeof obj.getWalls === 'function') {
          found.push({ path: path + '.getWalls', walls: obj.getWalls().length });
        }
        if (obj.level && typeof obj.level.getWalls === 'function') {
          found.push({ path: path + '.level', walls: obj.level.getWalls().length, obj });
        }
      } catch (_) {}
      if (depth >= 3) return;
      let keys = [];
      try {
        keys = Object.getOwnPropertyNames(obj).slice(0, 50);
      } catch (_) {
        return;
      }
      for (const k of keys) {
        if (k === 'window' || k === 'self' || k === 'document' || k === 'frames') continue;
        try {
          walk(obj[k], path + '.' + k, depth + 1);
        } catch (_) {}
      }
    }
    walk(g.app, 'app', 0);
    walk(g.ByMeAPI, 'ByMeAPI', 0);
    // типичные синглтоны
    for (const k of Object.getOwnPropertyNames(g)) {
      if (!/app|App|by|By|core|Core|engine|Engine|kitchen|Kitchen|viewer|Viewer/i.test(k)) continue;
      try {
        walk(g[k], k, 0);
      } catch (_) {}
    }
    return found;
  }

  function findApp() {
    // прямые кандидаты (в дампе есть global `app` и `ByMeAPI`)
    const direct = [g.app, g.ByMeAPI, g.byMe && g.byMe.app, g.__APP__];
    for (const v of direct) {
      try {
        if (!v) continue;
        if (v.viewer && v.level && typeof v.level.getWalls === 'function') return v;
        if (v.level && typeof v.level.getWalls === 'function') return v;
        if (v.getLevel && typeof v.getLevel === 'function') {
          const lvl = v.getLevel();
          if (lvl && typeof lvl.getWalls === 'function') return { level: lvl, viewer: v.viewer || v };
        }
        if (v.app && v.app.level && typeof v.app.level.getWalls === 'function') return v.app;
      } catch (_) {}
    }
    const keys = Object.getOwnPropertyNames(g);
    for (let i = 0; i < keys.length; i++) {
      try {
        const v = g[keys[i]];
        if (!v || typeof v !== 'object') continue;
        if (v.viewer && v.level && typeof v.level.getWalls === 'function') return v;
        if (v._app && v._app.viewer && v._app.level) return v._app;
        if (v.app && v.app.viewer && v.app.level) return v.app;
        if (v.level && typeof v.level.getWalls === 'function') return v;
      } catch (_) {}
    }
    // webpack / deep walk
    try {
      const hits = findViaWebpack();
      for (const h of hits) {
        if (h.obj && h.obj.level && typeof h.obj.level.getWalls === 'function') return h.obj;
        if (h.obj && typeof h.obj.getWalls === 'function') return { level: h.obj };
      }
    } catch (_) {}
    return null;
  }
  function wallInfo(wall) {
    const info = {
      type: wall && wall.constructor && wall.constructor.name,
      height: null,
      baseHeightOneSlope: null,
      depthOneSlope: null,
      angleOneSlope: null,
      thickness: null,
      length: null,
      hasSlope: false,
      edge: null,
      methods: [],
    };
    try {
      if (wall.getHeight) info.height = wall.getHeight();
    } catch (_) {}
    try {
      if (wall.getBaseHeightOneSlope) {
        info.baseHeightOneSlope = wall.getBaseHeightOneSlope();
        info.hasSlope = true;
      }
    } catch (_) {}
    try {
      if (wall.getDepthOneSlope) info.depthOneSlope = wall.getDepthOneSlope();
    } catch (_) {}
    try {
      if (wall.getAngleOneSlope) info.angleOneSlope = wall.getAngleOneSlope();
    } catch (_) {}
    try {
      if (wall.getThickness) info.thickness = wall.getThickness();
    } catch (_) {}
    try {
      if (wall.edge && wall.edge.segment && wall.edge.segment.getLength)
        info.length = wall.edge.segment.getLength();
    } catch (_) {}
    try {
      const seg = wall.edge && wall.edge.segment;
      if (seg && seg.getPoint) {
        const a = seg.getPoint(0);
        const b = seg.getPoint(1);
        if (a && b) info.edge = { a: { x: a.x, y: a.y, z: a.z }, b: { x: b.x, y: b.y, z: b.z } };
      }
    } catch (_) {}
    try {
      info.methods = Object.getOwnPropertyNames(Object.getPrototypeOf(wall) || {})
        .filter((n) => /slope|Slope|height|Height|depth|Depth|angle|Angle|thick|Thick|URV|facet|Facet|mesh|Mesh|geom|Geom/i.test(n))
        .slice(0, 120);
    } catch (_) {}
    return info;
  }

  let webpackHits = [];
  try {
    webpackHits = findViaWebpack();
  } catch (_) {}
  const app = findApp();
  if (!app) {
    return {
      ok: false,
      err: 'app_not_found',
      webpackHits: webpackHits.map((h) => ({ path: h.path, walls: h.walls })),
      webpackChunkKeys: Object.getOwnPropertyNames(g).filter((k) => /webpack/i.test(k)),
    };
  }
  const walls = app.level.getWalls();
  const report = {
    ok: true,
    ts: new Date().toISOString(),
    wallCount: walls.length,
    walls: [],
    sloped: [],
  };
  for (let i = 0; i < walls.length; i++) {
    const info = wallInfo(walls[i]);
    report.walls.push(Object.assign({ i }, info));
    if (info.hasSlope || info.depthOneSlope > 0) report.sloped.push(Object.assign({ i }, info));
  }
  return report;
};

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: !HEADED });
  const context = await browser.newContext({
    locale: 'ru-LV',
    viewport: { width: 1400, height: 900 },
  });
  const page = await context.newPage();
  console.log('goto', URL);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(8000);

  // cookie / continue if any
  for (const label of ['Принять', 'Accept', 'OK', 'Продолжить', 'Agree']) {
    try {
      const b = page.getByRole('button', { name: label });
      if (await b.count()) await b.first().click({ timeout: 2000 });
    } catch (_) {}
  }
  await page.waitForTimeout(5000);

  let kitchen = null;
  for (let t = 0; t < 40; t++) {
    kitchen = page.frames().find((f) => /ikea-prod\.by\.me\/Kitchen/i.test(f.url()));
    if (kitchen) break;
    await page.waitForTimeout(1000);
  }
  if (!kitchen) {
    console.error('Kitchen iframe not found. frames=', page.frames().map((f) => f.url()));
    await browser.close();
    process.exit(1);
  }
  console.log('kitchenFrame', kitchen.url());

  // try open sloped ceiling tool by text
  for (const name of [
    'Добавить скошенный потолок',
    'скошенный потолок',
    'Нарисовать план',
    'Объекты',
  ]) {
    try {
      const loc = kitchen.getByText(name, { exact: false });
      if (await loc.count()) {
        await loc.first().click({ timeout: 3000 });
        console.log('clicked', name);
        await page.waitForTimeout(1500);
      }
    } catch (_) {}
  }

  let probe = await kitchen.evaluate(PROBE_FN);
  console.log('probe1', JSON.stringify(probe).slice(0, 400));

  // if no sloped yet — wait (user may create in headed) or retry
  for (let i = 0; i < 15; i++) {
    if (probe && probe.ok && probe.sloped && probe.sloped.length) break;
    await page.waitForTimeout(2000);
    probe = await kitchen.evaluate(PROBE_FN);
  }

  const out = join(OUT_DIR, `probe-walls-${Date.now()}.json`);
  writeFileSync(out, JSON.stringify(probe, null, 2));
  console.log('wrote', out);
  console.log('slopedCount', probe.sloped ? probe.sloped.length : 0);

  // доп. попытки кликнуть стену / Создать (если UI открыт)
  for (const name of ['Создать', 'Create', 'OK']) {
    try {
      const loc = kitchen.getByRole('button', { name });
      if (await loc.count()) {
        await loc.first().click({ timeout: 2000 });
        console.log('clicked btn', name);
        await page.waitForTimeout(2000);
      }
    } catch (_) {}
  }
  probe = await kitchen.evaluate(PROBE_FN);
  const out2 = join(OUT_DIR, `probe-walls-final-${Date.now()}.json`);
  writeFileSync(out2, JSON.stringify(probe, null, 2));
  console.log('wrote', out2);
  console.log(JSON.stringify(probe, null, 2).slice(0, 2500));

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
