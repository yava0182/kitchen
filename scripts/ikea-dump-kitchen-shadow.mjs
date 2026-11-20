/**
 * IKEA Kitchen Planner — дамп настроек теней их движка.
 *
 * Зачем: betrakta-sot.js снят с планировщика PAX (шкафы). Кухня — отдельный стенд,
 * параметры теней там могут быть свои. 3D кухни живёт в кросс-доменном iframe
 * (kitchen.ikea-prod.by.me), из вкладки браузера он недоступен — только Playwright.
 *
 * Run:
 *   node scripts/ikea-dump-kitchen-shadow.mjs
 *   node scripts/ikea-dump-kitchen-shadow.mjs --headed
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dir, '../docs/ikea-kitchen-shadow-dump');
const URL =
  process.env.IKEA_KITCHEN_URL || 'https://kitchen.planner.ikea.com/lv/ru/planner/';
const HEADED = process.argv.includes('--headed') || process.env.HEADED === '1';

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

/** Выполняется внутри фрейма планировщика. Движок ищем всеми известными способами. */
const PROBE_JS = `(() => {
  const out = { when: new Date().toISOString(), url: location.href };

  function vec(v) {
    if (!v || typeof v !== 'object') return null;
    const x = v.x ?? v._x, y = v.y ?? v._y, z = v.z ?? v._z, w = v.w ?? v._w;
    if (x == null && y == null && z == null) return null;
    return { x: +x || 0, y: +y || 0, z: +z || 0, w: w == null ? undefined : +w };
  }
  function num(v) {
    return typeof v === 'number' && isFinite(v) ? v : null;
  }

  /** Betrakta viewer висит в React-контексте — тот же поиск, что в ikea-dump-cabinet.mjs. */
  function findBetraktaCore() {
    const rootEl = document.querySelector('#root') || document.body;
    const key = Object.keys(rootEl).find(
      (k) => k.startsWith('__reactContainer') || k.startsWith('__reactFiber')
    );
    let fiber = key ? rootEl[key] : null;
    if (fiber?.stateNode?.current) fiber = fiber.stateNode.current;
    const q = [fiber];
    let n = 0;
    while (q.length && n < 35000) {
      const f = q.shift();
      n++;
      const v = f?.memoizedProps?.value;
      if (v?.betraktaViewer) return v;
      if (f?.child) q.push(f.child);
      if (f?.sibling) q.push(f.sibling);
    }
    return null;
  }

  function dumpShadowGenerator(sg) {
    if (!sg) return null;
    let size = null;
    try {
      size = sg.getShadowMap?.()?.getSize?.() ?? null;
    } catch (_) {}
    return {
      class: sg.constructor?.name,
      mapSize: num(sg.mapSize),
      shadowMapSize: size,
      filter: num(sg.filter),
      filteringQuality: num(sg.filteringQuality),
      usePercentageCloserFiltering: sg.usePercentageCloserFiltering ?? null,
      useContactHardeningShadow: sg.useContactHardeningShadow ?? null,
      useBlurExponentialShadowMap: sg.useBlurExponentialShadowMap ?? null,
      useCloseExponentialShadowMap: sg.useCloseExponentialShadowMap ?? null,
      usePoissonSampling: sg.usePoissonSampling ?? null,
      blurKernel: num(sg.blurKernel),
      blurScale: num(sg.blurScale),
      blurBoxOffset: num(sg.blurBoxOffset),
      contactHardeningLightSizeUVRatio: num(sg.contactHardeningLightSizeUVRatio),
      bias: num(sg.bias),
      normalBias: num(sg.normalBias),
      depthScale: num(sg.depthScale),
      darkness: num(sg.darkness),
      frustumEdgeFalloff: num(sg.frustumEdgeFalloff),
      transparencyShadow: sg.transparencyShadow ?? null,
      forceBackFacesOnly: sg.forceBackFacesOnly ?? null,
      casterCount: sg.getShadowMap?.()?.renderList?.length ?? null,
    };
  }

  function dumpLight(l) {
    if (!l) return null;
    let sg = null;
    try {
      sg = l.getShadowGenerator?.() ?? null;
    } catch (_) {}
    return {
      class: l.constructor?.name,
      name: String(l.name ?? l.id ?? ''),
      intensity: num(l.intensity ?? l._intensity),
      range: num(l.range),
      angleDeg: num(l.angle) == null ? null : +((l.angle * 180) / Math.PI).toFixed(3),
      innerAngleDeg:
        num(l.innerAngle) == null ? null : +((l.innerAngle * 180) / Math.PI).toFixed(3),
      exponent: num(l.exponent),
      position: vec(l.position || l._position),
      direction: vec(l.direction || l._direction),
      shadowEnabled: l.shadowEnabled ?? l.enableShadows ?? l._enable_shadows ?? null,
      shadowMinZ: num(l.shadowMinZ),
      shadowMaxZ: num(l.shadowMaxZ),
      shadowGenerator: dumpShadowGenerator(sg),
    };
  }

  /** Мягкая тень Betrakta: отдельный renderer с картой высот, не ShadowGenerator. */
  function dumpSoft(ssr) {
    if (!ssr) return null;
    let hmSize = null;
    try {
      const hm =
        (typeof ssr.get_blurred_heightmap === 'function' && ssr.get_blurred_heightmap()) ||
        ssr.texture ||
        null;
      hmSize = hm?.getSize?.() ?? null;
    } catch (_) {}
    return {
      class: ssr.constructor?.name,
      renderMask: ssr._render_layer_mask?.bitmap ?? ssr._render_layer_mask ?? null,
      blockMask: ssr._block_layer_mask?.bitmap ?? ssr._block_layer_mask ?? null,
      center: vec(ssr._tracked_center_position || ssr.center),
      size: vec(ssr._tracked_size || ssr.size),
      referenceHeight: num(ssr._reference_height ?? ssr.reference_height),
      intensity: num(ssr._intensity ?? ssr.intensity),
      resolution: num(ssr._resolution ?? ssr.resolution),
      heightmapSize: hmSize,
      viewport: ssr._blurred_heightmap_viewport ?? null,
    };
  }

  const core = findBetraktaCore();
  const bv = core?.betraktaViewer || null;
  out.hasBetraktaViewer = !!bv;

  if (bv) {
    const lm = bv._light_manager || bv.light_manager || null;
    let punctual = [];
    try {
      punctual = lm?.get_punctual_lights?.() ?? [];
    } catch (_) {}
    const scene = bv.scene || bv._scene || null;
    out.betrakta = {
      viewerClass: bv.constructor?.name,
      lightManagerClass: lm?.constructor?.name ?? null,
      punctualLights: punctual.map(dumpLight),
      soft: dumpSoft(lm?._soft_shadow_renderer),
      sceneLights: (scene?.lights || []).map(dumpLight),
      meshCount: scene?.meshes?.length ?? null,
      shadowCasterCount: (scene?.meshes || []).filter(
        (m) => m.castShadows ?? m._castShadows
      ).length,
      accumulation: {
        frameCount:
          num(bv._accumulation_buffer?._accumulation_frame_count) ??
          num(bv._accumulation_buffer?.accumulation_frame_count) ??
          num(bv._accumulation_frame_count),
        bufferClass: bv._accumulation_buffer?.constructor?.name ?? null,
      },
    };
  }

  /** Если Betrakta не найден — чем вообще рисуют. */
  out.engines = {
    BABYLON: typeof window.BABYLON !== 'undefined',
    babylonVersion: window.BABYLON?.Engine?.Version ?? null,
    THREE: typeof window.THREE !== 'undefined',
    unityInstance: typeof window.unityInstance !== 'undefined',
    hasUnitySendMessage: !!window.unityInstance?.SendMessage,
    Module: typeof window.Module === 'object',
  };

  if (window.BABYLON?.EngineStore?.Instances?.length) {
    const eng = window.BABYLON.EngineStore.Instances[0];
    const sc = eng?.scenes?.[0] || null;
    out.babylon = {
      instances: window.BABYLON.EngineStore.Instances.length,
      scenes: eng?.scenes?.length ?? null,
      lights: (sc?.lights || []).map(dumpLight),
      meshCount: sc?.meshes?.length ?? null,
      customRenderTargets: (sc?.customRenderTargets || []).map((rt) => ({
        name: String(rt.name ?? ''),
        size: rt.getSize?.() ?? null,
      })),
      postProcesses: (sc?.postProcesses || []).map((p) => String(p.name ?? '')),
    };
  }

  out.canvases = [...document.querySelectorAll('canvas')].map((c) => ({
    w: c.width,
    h: c.height,
    id: c.id || null,
    cls: c.className || null,
  }));
  out.windowKeys = Object.keys(window)
    .filter((k) => /babylon|betrakta|engine|scene|viewer|unity|module|kitchen|render/i.test(k))
    .slice(0, 60);

  return out;
})()`;

/**
 * Движок кухни не выставлен в window (всё module-scoped), поэтому параметры снимаем
 * на уровне WebGL: размеры render target и порядок проходов за кадр. Ставится через
 * addInitScript — до того, как их скрипты создадут текстуры.
 */
const GL_HOOK_JS = `(() => {
  if (window.__cldGlDump) return;
  const D = {
    ctx: [],
    fbs: {},
    passes: {},
    order: [],
    draws: 0,
    frames: 0,
    texCreates: [],
  };
  window.__cldGlDump = D;

  const ids = new WeakMap();
  let nextId = 1;
  const objId = (o) => {
    if (!o) return 0;
    let i = ids.get(o);
    if (!i) {
      i = nextId++;
      ids.set(o, i);
    }
    return i;
  };
  const texSize = new WeakMap();
  const rbSize = new WeakMap();

  function fmtName(gl, f) {
    for (const k of [
      'DEPTH_COMPONENT', 'DEPTH_COMPONENT16', 'DEPTH_COMPONENT24', 'DEPTH_COMPONENT32F',
      'DEPTH24_STENCIL8', 'DEPTH_STENCIL', 'RGBA', 'RGBA8', 'RGBA16F', 'RGBA32F',
      'RGB8', 'R8', 'R16F', 'R32F', 'RG16F', 'SRGB8_ALPHA8',
    ]) {
      if (gl[k] === f) return k;
    }
    return String(f);
  }

  function patch(proto, isGl2) {
    if (!proto || proto.__cldPatched) return;
    proto.__cldPatched = true;

    const state = new WeakMap();
    const st = (gl) => {
      let s = state.get(gl);
      if (!s) {
        s = { fb: 0, vp: [0, 0, 0, 0], tex: null, rb: null };
        state.set(gl, s);
      }
      return s;
    };

    const o = {
      bindTexture: proto.bindTexture,
      bindRenderbuffer: proto.bindRenderbuffer,
      bindFramebuffer: proto.bindFramebuffer,
      viewport: proto.viewport,
      texImage2D: proto.texImage2D,
      texStorage2D: proto.texStorage2D,
      renderbufferStorage: proto.renderbufferStorage,
      renderbufferStorageMultisample: proto.renderbufferStorageMultisample,
      framebufferTexture2D: proto.framebufferTexture2D,
      framebufferRenderbuffer: proto.framebufferRenderbuffer,
      drawElements: proto.drawElements,
      drawArrays: proto.drawArrays,
      drawElementsInstanced: proto.drawElementsInstanced,
      drawArraysInstanced: proto.drawArraysInstanced,
    };

    proto.bindTexture = function (t, tex) {
      st(this).tex = tex;
      return o.bindTexture.apply(this, arguments);
    };
    proto.bindRenderbuffer = function (t, rb) {
      st(this).rb = rb;
      return o.bindRenderbuffer.apply(this, arguments);
    };
    proto.bindFramebuffer = function (t, fb) {
      st(this).fb = objId(fb);
      return o.bindFramebuffer.apply(this, arguments);
    };
    proto.viewport = function (x, y, w, h) {
      st(this).vp = [x, y, w, h];
      return o.viewport.apply(this, arguments);
    };
    proto.texImage2D = function (target, level, internalformat, width, height) {
      if (typeof width === 'number' && typeof height === 'number' && level === 0) {
        const s = st(this);
        if (s.tex) texSize.set(s.tex, { w: width, h: height, fmt: fmtName(this, internalformat) });
        if (D.texCreates.length < 400) {
          D.texCreates.push({ w: width, h: height, fmt: fmtName(this, internalformat) });
        }
      }
      return o.texImage2D.apply(this, arguments);
    };
    if (isGl2 && o.texStorage2D) {
      proto.texStorage2D = function (target, levels, internalformat, width, height) {
        const s = st(this);
        if (s.tex) texSize.set(s.tex, { w: width, h: height, fmt: fmtName(this, internalformat) });
        if (D.texCreates.length < 400) {
          D.texCreates.push({ w: width, h: height, fmt: fmtName(this, internalformat) });
        }
        return o.texStorage2D.apply(this, arguments);
      };
    }
    proto.renderbufferStorage = function (target, internalformat, width, height) {
      const s = st(this);
      if (s.rb) rbSize.set(s.rb, { w: width, h: height, fmt: fmtName(this, internalformat) });
      return o.renderbufferStorage.apply(this, arguments);
    };
    if (o.renderbufferStorageMultisample) {
      proto.renderbufferStorageMultisample = function (target, samples, internalformat, width, height) {
        const s = st(this);
        if (s.rb) {
          rbSize.set(s.rb, { w: width, h: height, fmt: fmtName(this, internalformat), samples });
        }
        return o.renderbufferStorageMultisample.apply(this, arguments);
      };
    }
    proto.framebufferTexture2D = function (target, attachment, textarget, texture) {
      const id = st(this).fb;
      const info = texture ? texSize.get(texture) : null;
      if (id && info) {
        D.fbs[id] = D.fbs[id] || { attachments: [] };
        D.fbs[id].attachments.push({
          kind: 'tex',
          att: fmtName(this, attachment),
          ...info,
        });
      }
      return o.framebufferTexture2D.apply(this, arguments);
    };
    proto.framebufferRenderbuffer = function (target, attachment, rbtarget, rb) {
      const id = st(this).fb;
      const info = rb ? rbSize.get(rb) : null;
      if (id && info) {
        D.fbs[id] = D.fbs[id] || { attachments: [] };
        D.fbs[id].attachments.push({
          kind: 'rb',
          att: fmtName(this, attachment),
          ...info,
        });
      }
      return o.framebufferRenderbuffer.apply(this, arguments);
    };

    const onDraw = function (gl) {
      const s = st(gl);
      const key = s.fb + '@' + s.vp[2] + 'x' + s.vp[3];
      if (!D.passes[key]) {
        D.passes[key] = { fb: s.fb, vpW: s.vp[2], vpH: s.vp[3], draws: 0, firstFrame: D.frames };
        if (D.order.length < 80) D.order.push(key);
      }
      D.passes[key].draws++;
      D.draws++;
    };
    for (const name of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
      if (!o[name]) continue;
      proto[name] = function () {
        onDraw(this);
        return o[name].apply(this, arguments);
      };
    }
  }

  patch(window.WebGLRenderingContext?.prototype, false);
  patch(window.WebGL2RenderingContext?.prototype, true);

  const origGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, attrs) {
    const gl = origGetContext.apply(this, arguments);
    if (/webgl/i.test(String(type))) {
      D.ctx.push({
        type: String(type),
        attrs: attrs ? JSON.parse(JSON.stringify(attrs)) : null,
        canvas: { w: this.width, h: this.height, id: this.id || null },
      });
    }
    return gl;
  };

  const origRaf = window.requestAnimationFrame;
  window.requestAnimationFrame = function (cb) {
    return origRaf.call(window, function (t) {
      D.frames++;
      return cb(t);
    });
  };
})()`;

/** Сводка GL-дампа: только то, что отвечает на «какие у них карты теней». */
const GL_SUMMARY_JS = `(() => {
  const D = window.__cldGlDump;
  if (!D) return { err: 'no gl hook' };
  const passes = Object.entries(D.passes)
    .map(([key, p]) => ({ key, ...p, attachments: D.fbs[p.fb]?.attachments ?? null }))
    .sort((a, b) => b.draws - a.draws);
  const texByKey = {};
  for (const t of D.texCreates) {
    const k = t.w + 'x' + t.h + ' ' + t.fmt;
    texByKey[k] = (texByKey[k] || 0) + 1;
  }
  const depth = passes.filter((p) =>
    (p.attachments || []).some((a) => /DEPTH/.test(String(a.att)) || /DEPTH/.test(String(a.fmt)))
  );
  const square = passes.filter((p) => p.vpW === p.vpH && p.vpW > 0);
  return {
    frames: D.frames,
    draws: D.draws,
    contexts: D.ctx,
    passCount: passes.length,
    passes: passes.slice(0, 40),
    passOrderFirstFrames: D.order.slice(0, 40),
    depthPasses: depth.slice(0, 20),
    squarePasses: square.slice(0, 20),
    textureSizes: texByKey,
  };
})()`;

async function safeEval(frame, expr) {
  try {
    return await frame.evaluate(expr);
  } catch (e) {
    return { err: String(e.message || e) };
  }
}

async function findPlannerFrame(page) {
  for (let i = 0; i < 60; i++) {
    const f = page
      .frames()
      .find((fr) => /ikea-prod\.by\.me|by\.me\/Kitchen|kitchen\.ikea/i.test(fr.url()));
    if (f) return f;
    await page.waitForTimeout(1000);
  }
  return null;
}

/** Короткий срез видимого UI фрейма — чтобы править клики по факту, а не наугад. */
async function uiDump(frame) {
  return safeEval(
    frame,
    `(() => {
      const vis = (el) => {
        const r = el.getBoundingClientRect();
        return r.width > 2 && r.height > 2;
      };
      const btns = [...document.querySelectorAll('button,[role=button],a')]
        .filter(vis)
        .slice(0, 50)
        .map((b) => ({
          t: (b.innerText || '').trim().slice(0, 60),
          aria: b.getAttribute('aria-label'),
          id: b.id || null,
        }));
      const modal = document.querySelector('[class*=modal],[role=dialog]');
      return {
        btns,
        modalOpen: !!modal && vis(modal),
        modalText: modal ? (modal.innerText || '').trim().slice(0, 200) : null,
        bodyText: (document.body.innerText || '').trim().slice(0, 300),
      };
    })()`
  );
}

async function clickByTexts(target, labels) {
  const log = [];
  for (const label of labels) {
    try {
      const byRole = target.getByRole('button', { name: label }).first();
      if ((await byRole.count()) > 0) {
        await byRole.click({ timeout: 3000 });
        log.push({ label, ok: true, how: 'role' });
        continue;
      }
      const byText = target.getByText(label, { exact: false }).first();
      if ((await byText.count()) > 0) {
        await byText.click({ timeout: 3000 });
        log.push({ label, ok: true, how: 'text' });
        continue;
      }
      log.push({ label, ok: false });
    } catch (e) {
      log.push({ label, ok: false, err: String(e.message || e).slice(0, 160) });
    }
  }
  return log;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const out = { at: new Date().toISOString(), url: URL, headed: HEADED, steps: [] };

  /** Браузеры Playwright не скачаны — берём системный Chrome (нужен реальный WebGL). */
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: !HEADED,
    args: ['--disable-web-security', '--use-gl=angle', '--enable-unsafe-swiftshader'],
  });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    locale: 'ru-LV',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  await context.addInitScript({ content: GL_HOOK_JS });
  const page = await context.newPage();
  page.setDefaultTimeout(90000);

  console.log('goto', URL, HEADED ? '(headed)' : '(headless)');
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(4000);

  out.steps.push({
    step: 'shell-modals',
    log: await clickByTexts(page, ['Убрать уведомление', 'Принять', 'Accept', 'OK', 'Agree']),
  });

  const frame = await findPlannerFrame(page);
  out.plannerFrameUrl = frame ? frame.url() : null;
  console.log('plannerFrame', out.plannerFrameUrl);
  if (!frame) {
    out.err = 'planner frame not found';
    writeFileSync(join(OUT_DIR, `shadow-${stamp()}.json`), JSON.stringify(out, null, 2));
    await browser.close();
    return;
  }

  /** 3D поднимается не сразу — движку нужно время на boot и загрузку сцены. */
  await page.waitForTimeout(15000);
  out.probeBeforeClicks = await safeEval(frame, PROBE_JS);
  console.log(
    'probe#1 betrakta=',
    out.probeBeforeClicks?.hasBetraktaViewer,
    'canvases=',
    out.probeBeforeClicks?.canvases?.length
  );

  /**
   * Онбординг: модалка «Выбрать форму комнаты» перекрывает всё, пока её не закрыть.
   * Без шкафов в сцене прохода теней нет — надо дойти до готовой кухни.
   */
  const stages = [];
  async function stage(name, fn) {
    const before = await uiDump(frame);
    let err = null;
    try {
      await fn();
    } catch (e) {
      err = String(e.message || e).slice(0, 200);
    }
    await page.waitForTimeout(4000);
    const shot = join(OUT_DIR, `stage-${name}-${stamp()}.png`);
    try {
      await page.screenshot({ path: shot });
    } catch (_) {}
    stages.push({ name, err, shot, uiBefore: before, uiAfter: await uiDump(frame) });
    console.log('stage', name, err ? 'ERR ' + err : 'ok');
  }

  /**
   * Клики делаем через DOM: модалка висит оверлеем и перехватывает реальные события,
   * а закрывать её «крестиком» рискованно — #close-app закрывает всё приложение.
   */
  await stage('close-shape-modal', async () => {
    await page.keyboard.press('Escape').catch(() => {});
    await safeEval(
      frame,
      `(() => {
        const dlg = document.querySelector('[role=dialog],[class*=modal]');
        if (!dlg) return 'no dialog';
        const x = [...dlg.querySelectorAll('button')].find(
          (b) => b.id !== 'close-app' && /закрыть|close/i.test(b.getAttribute('aria-label') || b.innerText || '')
        );
        if (x) { x.click(); return 'closed'; }
        return 'no close button';
      })()`
    );
  });

  /** Готовая кухня = их автодизайн. Без него в сцене нет шкафов и нет прохода теней. */
  await stage('go-to-auto-design', async () => {
    const r = await safeEval(
      frame,
      `(() => {
        const b = document.querySelector('#go-to-auto-design');
        if (!b) return 'no button';
        b.click();
        return 'clicked';
      })()`
    );
    console.log('  go-to-auto-design:', r);
  });

  await stage('wait-auto-design', async () => {
    await page.waitForTimeout(20000);
  });

  await stage('view-3d', async () => {
    await safeEval(
      frame,
      `(() => {
        const b = [...document.querySelectorAll('button')].find(
          (x) => /трехмерный|трёхмерный|3d/i.test(x.getAttribute('aria-label') || '')
        );
        if (!b) return 'no 3d button';
        b.click();
        return 'clicked';
      })()`
    );
    await page.waitForTimeout(8000);
  });

  /** Сбросить счётчики: дальше считаем проходы уже на кухне со шкафами. */
  await safeEval(
    frame,
    `(() => { const D = window.__cldGlDump; if (!D) return 0; D.passes = {}; D.order = []; D.draws = 0; D.fbsAtReset = Object.keys(D.fbs).length; return 1; })()`
  );

  out.stages = stages;
  await page.waitForTimeout(10000);
  out.probeAfterClicks = await safeEval(frame, PROBE_JS);
  console.log(
    'probe#2 betrakta=',
    out.probeAfterClicks?.hasBetraktaViewer,
    'canvases=',
    out.probeAfterClicks?.canvases?.length
  );

  /** Дать движку покрутиться вхолостую — проходы теней видны только на живых кадрах. */
  await page.waitForTimeout(8000);
  out.gl = await safeEval(frame, GL_SUMMARY_JS);
  console.log(
    'gl frames=',
    out.gl?.frames,
    'draws=',
    out.gl?.draws,
    'passes=',
    out.gl?.passCount
  );

  const shot = join(OUT_DIR, `shadow-${stamp()}.png`);
  try {
    await page.screenshot({ path: shot, fullPage: false });
    out.screenshot = shot;
  } catch (_) {}

  const file = join(OUT_DIR, `shadow-${stamp()}.json`);
  writeFileSync(file, JSON.stringify(out, null, 2));
  console.log('wrote', file);
  await browser.close();
}

main().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
