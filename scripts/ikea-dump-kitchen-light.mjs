/**
 * Живой дамп светового рига кухонного планировщика IKEA — то же, что делали для PAX.
 * Движок кухни живёт в кросс-доменном iframe, поэтому ходим в него через Playwright frame,
 * а не из родительской страницы (оттуда JS фрейма недоступен).
 * Онбординг не проходим: рендерер и сцена создаются до расстановки, свет уже есть.
 *
 * node scripts/ikea-dump-kitchen-light.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const WRAPPER_URL = 'https://kitchen.planner.ikea.com/lv/ru/planner/';
const OUT_DIR = path.resolve('docs/ikea-kitchen-shadow-dump');

/** Ищем объект движка: у него есть getPainter + setSettingsValue (видно в их бандле). */
const FIND_JS = `(() => {
  const seen = new Set();
  const hits = [];
  const isEngine = (o) => {
    try {
      return o && typeof o === 'object'
        && typeof o.getPainter === 'function'
        && typeof o.setSettingsValue === 'function';
    } catch (_) { return false; }
  };
  const hasLights = (o) => {
    try {
      return o && typeof o === 'object' && Array.isArray(o._lights) && o._lights.length > 0;
    } catch (_) { return false; }
  };
  const walk = (root, label) => {
    const q = [[root, label, 0]];
    let guard = 0;
    while (q.length && guard < 60000) {
      guard += 1;
      const [node, pathLabel, depth] = q.shift();
      if (!node || typeof node !== 'object' || depth > 5) continue;
      if (seen.has(node)) continue;
      seen.add(node);
      if (isEngine(node)) hits.push({ kind: 'engine', path: pathLabel });
      if (hasLights(node)) hits.push({ kind: 'lights', path: pathLabel });
      let keys = [];
      try { keys = Object.keys(node); } catch (_) { continue; }
      for (const k of keys) {
        if (k.startsWith('__react') || k === 'parent' || k === 'ownerDocument') continue;
        let v;
        try { v = node[k]; } catch (_) { continue; }
        if (v && typeof v === 'object') q.push([v, pathLabel + '.' + k, depth + 1]);
      }
    }
  };
  walk(window, 'window');
  // Фиберы React: движок часто висит в props/state, а не в window.
  const nodes = document.querySelectorAll('*');
  for (let i = 0; i < nodes.length && i < 4000; i++) {
    const el = nodes[i];
    for (const k of Object.keys(el)) {
      if (!k.startsWith('__react')) continue;
      let f;
      try { f = el[k]; } catch (_) { continue; }
      let hop = 0;
      while (f && hop < 40) {
        if (f.stateNode && typeof f.stateNode === 'object') walk(f.stateNode, 'fiber.stateNode');
        if (f.memoizedProps) walk(f.memoizedProps, 'fiber.props');
        if (f.memoizedState) walk(f.memoizedState, 'fiber.state');
        f = f.return;
        hop += 1;
      }
    }
  }
  const uniq = [];
  const key = new Set();
  for (const h of hits) {
    const kk = h.kind + '|' + h.path;
    if (key.has(kk)) continue;
    key.add(kk);
    uniq.push(h);
  }
  return JSON.stringify({ hits: uniq.slice(0, 60), canvases: document.querySelectorAll('canvas').length });
})()`;

/** Снимаем свет по найденному пути. */
const DUMP_JS = `(() => {
  const num = (v) => (typeof v === 'number' && isFinite(v) ? +v.toFixed(6) : v ?? null);
  const vec = (v) => (v && typeof v === 'object'
    ? { x: num(v.x), y: num(v.y), z: num(v.z) }
    : null);
  const seen = new Set();
  const lightsFound = [];
  const settingsFound = [];
  const looksLight = (o) => {
    try {
      if (!o || typeof o !== 'object') return false;
      const hasPos = o.position && typeof o.position === 'object' && 'x' in o.position;
      return hasPos && ('castShadow' in o || 'intensity' in o || 'isStatic' in o);
    } catch (_) { return false; }
  };
  const dumpLight = (o, where) => {
    const out = { where, ctor: o.constructor?.name ?? null };
    for (const k of ['intensity','castShadow','isStatic','angle','innerAngle','outerAngle',
      'penumbra','range','distance','decay','shadowBias','near','far','id','name','type','visible']) {
      try { if (k in o) out[k] = num(o[k]); } catch (_) {}
    }
    for (const k of ['position','direction','target','color','rotation','scale','up']) {
      try { if (o[k]) out[k] = vec(o[k]) ?? (Array.isArray(o[k]) ? o[k].map(num) : null); } catch (_) {}
    }
    try { if (o.matrixWorld?.elements) out.matrixWorld = [...o.matrixWorld.elements].map(num); } catch (_) {}
    try { if (typeof o.getWorldPosition === 'function') out.worldPosition = vec(o.getWorldPosition({ x:0,y:0,z:0, set(){return this;}, copy(){return this;}, applyMatrix4(){return this;} })); } catch (_) {}
    lightsFound.push(out);
  };
  const walk = (root, label, depth = 0) => {
    const q = [[root, label, depth]];
    let guard = 0;
    while (q.length && guard < 80000) {
      guard += 1;
      const [node, pathLabel, d] = q.shift();
      if (!node || typeof node !== 'object' || d > 6) continue;
      if (seen.has(node)) continue;
      seen.add(node);
      if (Array.isArray(node._lights)) {
        node._lights.forEach((l, i) => { if (l && typeof l === 'object') dumpLight(l, pathLabel + '._lights[' + i + ']'); });
      }
      if (looksLight(node) && node.constructor?.name) dumpLight(node, pathLabel);
      if (node._settings && typeof node._settings.get === 'function') {
        const keys = ['staticShadowMapSize','staticShadowMapSampleCount','staticShadowMapType',
          'shadowMapKernelRadius','shadowMapDarkness','shadowMapConstantBias',
          'spotLightShadowMapNormalBias','staticShadowMapNearPlane','staticShadowsEnabled',
          'ssaoEnabled','ssaoAoRadius','ssaoAoSamplesCount','bloomEnabled','exposure'];
        const got = {};
        for (const k of keys) { try { const v = node._settings.get(k); got[k] = (v && typeof v === 'object') ? JSON.parse(JSON.stringify(v)) : v; } catch (_) {} }
        settingsFound.push({ where: pathLabel, settings: got });
      }
      let keys = [];
      try { keys = Object.keys(node); } catch (_) { continue; }
      for (const k of keys) {
        if (k.startsWith('__react') || k === 'parent' || k === 'ownerDocument') continue;
        let v;
        try { v = node[k]; } catch (_) { continue; }
        if (v && typeof v === 'object') q.push([v, pathLabel + '.' + k, d + 1]);
      }
    }
  };
  walk(window, 'window');
  const nodes = document.querySelectorAll('*');
  for (let i = 0; i < nodes.length && i < 4000; i++) {
    const el = nodes[i];
    for (const k of Object.keys(el)) {
      if (!k.startsWith('__react')) continue;
      let f;
      try { f = el[k]; } catch (_) { continue; }
      let hop = 0;
      while (f && hop < 40) {
        if (f.stateNode && typeof f.stateNode === 'object') walk(f.stateNode, 'fiber.stateNode');
        if (f.memoizedProps) walk(f.memoizedProps, 'fiber.props');
        if (f.memoizedState) walk(f.memoizedState, 'fiber.state');
        f = f.return;
        hop += 1;
      }
    }
  }
  const dedupe = [];
  const key = new Set();
  for (const l of lightsFound) {
    const kk = JSON.stringify([l.ctor, l.position, l.intensity, l.castShadow]);
    if (key.has(kk)) continue;
    key.add(kk);
    dedupe.push(l);
  }
  return JSON.stringify({ lights: dedupe.slice(0, 40), settings: settingsFound.slice(0, 4) });
})()`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: false });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const log = [];
  page.on('console', (m) => {
    if (log.length < 200) log.push(m.type() + ': ' + m.text().slice(0, 200));
  });

  console.log('open', WRAPPER_URL);
  await page.goto(WRAPPER_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });

  let frame = null;
  for (let i = 0; i < 60; i++) {
    await sleep(2000);
    frame = page.frames().find((f) => /ikea-prod\.by\.me/.test(f.url()));
    if (!frame) continue;
    let canvases = 0;
    try {
      canvases = await frame.evaluate(() => document.querySelectorAll('canvas').length);
    } catch (_) {}
    console.log('try', i, 'frame', !!frame, 'canvases', canvases);
    if (canvases > 0) break;
  }
  if (!frame) {
    console.log('FRAME NOT FOUND');
    await browser.close();
    return;
  }

  let find = null;
  for (let i = 0; i < 30; i++) {
    try {
      find = JSON.parse(await frame.evaluate(FIND_JS));
    } catch (e) {
      find = { error: String(e).slice(0, 200) };
    }
    console.log('scan', i, JSON.stringify(find).slice(0, 300));
    if (find?.hits?.length) break;
    await sleep(3000);
  }

  let dump = null;
  try {
    dump = JSON.parse(await frame.evaluate(DUMP_JS));
  } catch (e) {
    dump = { error: String(e).slice(0, 400) };
  }

  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
  const file = path.join(OUT_DIR, `kitchen-light-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify({ url: page.url(), find, dump, console: log }, null, 2));
  await page.screenshot({ path: path.join(OUT_DIR, `kitchen-light-${stamp}.png`) }).catch(() => {});
  console.log('WROTE', file);
  console.log('lights:', dump?.lights?.length ?? 0, 'settings:', dump?.settings?.length ?? 0);
  if (dump?.lights?.length) console.log(JSON.stringify(dump.lights.slice(0, 6), null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
