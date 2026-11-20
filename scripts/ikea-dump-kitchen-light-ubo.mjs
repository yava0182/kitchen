/**
 * Живой дамп света/теней кухни IKEA через UBO (доработка 2026-10-30).
 * Хуки ставятся addInitScript до WebGL — работают и в iframe kitchen.ikea-prod.by.me.
 *
 * Съём только когда в скомпилированном шейдере есть `#define USE_STATIC_SHADOWMAP`
 * и в ubFSEnvironment dirCount > 0. Три состояния: покой / орбита / клик по UI.
 *
 * node scripts/ikea-dump-kitchen-light-ubo.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const WRAPPER_URL = 'https://kitchen.planner.ikea.com/lv/ru/planner/';
const OUT_DIR = path.resolve('docs/ikea-kitchen-shadow-dump');
const WAIT_MINUTES = 15;

const HOOK_JS = `(() => {
  const S = (window.__cldUbo = {
    ubo: [],
    blocks: [],
    shaders: [],
    shaderDefines: [],
    depths: [],
    fbo: [],
    programs: [],
    errors: [],
    maxLen: 0,
    hasDefineStaticShadow: false,
    bindSlot: {},
  });
  const asFloats = (data) => {
    try {
      if (typeof data === 'number') return null;
      if (data instanceof Float32Array) return Array.from(data);
      if (data instanceof ArrayBuffer) return Array.from(new Float32Array(data));
      if (data && data.buffer instanceof ArrayBuffer) {
        const len = Math.floor((data.byteLength ?? 0) / 4);
        if (len > 0) return Array.from(new Float32Array(data.buffer, data.byteOffset ?? 0, len));
      }
    } catch (_) {}
    return null;
  };
  const round = (a) => a.map((v) => (isFinite(v) ? +v.toFixed(6) : null));
  const sig8 = (f) => (f || []).slice(0, 8).map((v) => +Number(v).toFixed(4)).join(',');
  const recordUbo = (item) => {
    S.maxLen = Math.max(S.maxLen, item.len);
    const key = item.call + '|' + item.len + '|' + (item.binding ?? '') + '|' + sig8(item.floats);
    const same = S.ubo.find((u) => u.key === key);
    if (same) {
      same.floats = item.floats;
      same.seen = (same.seen || 1) + 1;
      same.binding = item.binding ?? same.binding;
      return;
    }
    if (S.ubo.length < 200) S.ubo.push({ ...item, key, seen: 1 });
  };
  const pushCap = (arr, item, cap) => {
    if (arr.length >= cap) return;
    arr.push(item);
  };

  const patch = (proto, label) => {
    if (!proto) return;
    const UNIFORM_BUFFER = 0x8a11;
    const TEXTURE_2D = 0x0de1;
    const TEXTURE_2D_ARRAY = 0x8c1a;
    const DEPTH_COMPONENT = 0x1902;
    const DEPTH_COMPONENT16 = 0x81a5;
    const DEPTH_COMPONENT24 = 0x81a6;
    const DEPTH24_STENCIL8 = 0x88f0;
    const DEPTH_COMPONENT32F = 0x8cac;
    const isDepth = (fmt) =>
      fmt === DEPTH_COMPONENT || fmt === DEPTH_COMPONENT16 || fmt === DEPTH_COMPONENT24 ||
      fmt === DEPTH24_STENCIL8 || fmt === DEPTH_COMPONENT32F || fmt === 0x84f9;

    const origBindBufferBase = proto.bindBufferBase;
    if (origBindBufferBase) {
      proto.bindBufferBase = function (target, index, buffer) {
        try {
          if (target === UNIFORM_BUFFER && buffer) S.bindSlot[index] = buffer;
        } catch (_) {}
        return origBindBufferBase.call(this, target, index, buffer);
      };
    }
    const origBindBufferRange = proto.bindBufferRange;
    if (origBindBufferRange) {
      proto.bindBufferRange = function (target, index, buffer, offset, size) {
        try {
          if (target === UNIFORM_BUFFER && buffer) S.bindSlot[index] = buffer;
        } catch (_) {}
        return origBindBufferRange.call(this, target, index, buffer, offset, size);
      };
    }

    const origBufferData = proto.bufferData;
    if (origBufferData) {
      proto.bufferData = function (target, data, ...rest) {
        try {
          if (target === UNIFORM_BUFFER) {
            const f = asFloats(data);
            if (f && f.length > 0 && f.length <= 8192) {
              let binding = null;
              try {
                const bound = this.getParameter(this.UNIFORM_BUFFER_BINDING);
                for (const [k, v] of Object.entries(S.bindSlot)) {
                  if (v === bound) { binding = Number(k); break; }
                }
              } catch (_) {}
              recordUbo({ api: label, call: 'bufferData', len: f.length, binding, floats: round(f) });
            }
          }
        } catch (e) { pushCap(S.errors, String(e).slice(0, 160), 20); }
        return origBufferData.call(this, target, data, ...rest);
      };
    }

    const origBufferSubData = proto.bufferSubData;
    if (origBufferSubData) {
      proto.bufferSubData = function (target, offset, data, ...rest) {
        try {
          if (target === UNIFORM_BUFFER) {
            const f = asFloats(data);
            if (f && f.length > 0 && f.length <= 8192) {
              recordUbo({ api: label, call: 'bufferSubData@' + offset, len: f.length, floats: round(f) });
            }
          }
        } catch (e) { pushCap(S.errors, String(e).slice(0, 160), 20); }
        return origBufferSubData.call(this, target, offset, data, ...rest);
      };
    }

    const origShaderSource = proto.shaderSource;
    if (origShaderSource) {
      proto.shaderSource = function (shader, src) {
        try {
          if (typeof src === 'string') {
            if (/#define\\s+USE_STATIC_SHADOWMAP\\b/.test(src)) S.hasDefineStaticShadow = true;
            const defs = [];
            const re = /#define\\s+(\\S+)([^\\n]*)/g;
            let m;
            while ((m = re.exec(src)) && defs.length < 80) defs.push((m[1] + ' ' + m[2]).trim());
            if (defs.length && S.shaderDefines.length < 12) {
              pushCap(S.shaderDefines, {
                hasDefineStaticShadow: /#define\\s+USE_STATIC_SHADOWMAP\\b/.test(src),
                hasIfDefinedStatic: /#if\\s+defined\\s*\\(\\s*USE_STATIC_SHADOWMAP/.test(src),
                hasLighting: defs.some((d) => d.startsWith('HAS_LIGHTING')),
                defines: defs.slice(0, 50),
                prefix: src.slice(0, 1800),
              }, 12);
            }
            const blocks = src.match(/layout\\s*\\([^)]*\\)\\s*uniform\\s+\\w+\\s*\\{[\\s\\S]{0,1600}?\\n\\}/g);
            if (blocks) {
              blocks.forEach((b) => {
                if (S.blocks.length < 80 && !S.blocks.includes(b)) S.blocks.push(b);
              });
            }
            const keep =
              /#define\\s+USE_STATIC_SHADOWMAP\\b/.test(src) ||
              /spotLightDirectionShadowmapIndex|directionalLightDirectionShadowmapIndex/.test(src);
            if (keep && S.shaders.length < 6) S.shaders.push(src.slice(0, 50000));
          }
        } catch (e) { pushCap(S.errors, String(e).slice(0, 160), 20); }
        return origShaderSource.call(this, shader, src);
      };
    }

    const origTexStorage2D = proto.texStorage2D;
    if (origTexStorage2D) {
      proto.texStorage2D = function (target, levels, internalformat, w, h) {
        try {
          if (isDepth(internalformat) || w >= 1024) {
            pushCap(S.depths, { api: label, call: 'texStorage2D', target, levels, internalformat, w, h, depthFmt: isDepth(internalformat) }, 40);
          }
        } catch (_) {}
        return origTexStorage2D.call(this, target, levels, internalformat, w, h);
      };
    }
    const origTexImage2D = proto.texImage2D;
    if (origTexImage2D) {
      proto.texImage2D = function (...args) {
        try {
          if (args.length >= 6) {
            const w = args[3];
            const h = args[4];
            const fmt = args[2];
            if ((typeof w === 'number' && w >= 1024) || isDepth(fmt)) {
              pushCap(S.depths, { api: label, call: 'texImage2D', w, h, internalformat: fmt, depthFmt: isDepth(fmt) }, 40);
            }
          }
        } catch (_) {}
        return origTexImage2D.apply(this, args);
      };
    }
    const origFb = proto.bindFramebuffer;
    if (origFb) {
      proto.bindFramebuffer = function (target, fb) {
        try {
          if (fb && S.fbo.length < 8) pushCap(S.fbo, { api: label, target, hasFb: true }, 8);
        } catch (_) {}
        return origFb.call(this, target, fb);
      };
    }
  };

  try { patch(window.WebGL2RenderingContext && window.WebGL2RenderingContext.prototype, 'webgl2'); } catch (e) {}
  try { patch(window.WebGLRenderingContext && window.WebGLRenderingContext.prototype, 'webgl1'); } catch (e) {}
})();`;

const SNAP_JS = `(() => {
  const s = window.__cldUbo;
  if (!s) return { error: 'hook missing' };
  const env = (s.ubo || []).filter((u) => u.len >= 1844);
  const latestEnv = env[env.length - 1] || (s.ubo || []).reduce((a, b) => (b.len >= (a?.len || 0) ? b : a), null);
  const f = latestEnv?.floats || [];
  const offDir = 8;
  return {
    maxLen: s.maxLen,
    hasDefineStaticShadow: s.hasDefineStaticShadow === true,
    shaderDefineSets: (s.shaderDefines || []).map((d) => ({
      hasDefineStaticShadow: d.hasDefineStaticShadow,
      hasIfDefinedStatic: d.hasIfDefinedStatic,
      hasLighting: d.hasLighting,
      defines: d.defines,
    })),
    blocks: s.blocks,
    shaders: s.shaders,
    shaderDefines: s.shaderDefines,
    ubo: s.ubo,
    depths: s.depths,
    fbo: s.fbo,
    errors: s.errors,
    parsedEnv: f.length >= 16 ? {
      len: f.length,
      binding: latestEnv?.binding ?? null,
      call: latestEnv?.call,
      seen: latestEnv?.seen,
      ambientColor: f.slice(0, 3),
      ambientIntensity: f[3],
      dirCount: f[4],
      pointCount: f[5],
      spotCount: f[6],
      dirColorIntensity: f.slice(offDir, offDir + 4),
      dirDirectionShadowIndex: f.slice(offDir + 4, offDir + 8),
    } : null,
  };
})()`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function stamp() {
  return new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
}

async function kitchenFrame(page) {
  return page.frames().find((f) => /ikea-prod\.by\.me/.test(f.url())) || null;
}

async function snap(frame) {
  return frame.evaluate(SNAP_JS);
}

async function saveState(page, frame, tag) {
  const t = stamp();
  const data = await snap(frame);
  const base = path.join(OUT_DIR, `kitchen-live-${tag}-${t}`);
  fs.writeFileSync(base + '.json', JSON.stringify({ tag, url: page.url(), frame: frame.url(), data }, null, 2));
  await page.screenshot({ path: base + '.png' }).catch(() => {});
  console.log('WROTE', base + '.json', 'dirCount', data?.parsedEnv?.dirCount, 'defineStatic', data?.hasDefineStaticShadow);
  return { tag, file: base + '.json', png: base + '.png', data };
}

async function dragOrbit(page, frame) {
  const box = await frame.locator('canvas').first().boundingBox().catch(() => null);
  if (!box) {
    console.log('orbit: no canvas bbox');
    return false;
  }
  const x = box.x + box.width * 0.55;
  const y = box.y + box.height * 0.45;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 120, y + 30, { steps: 12 });
  await page.mouse.up();
  return true;
}

async function clickSafeUi(frame) {
  const tried = [];
  const labels = ['Двери', 'Цвет', 'Фасад', 'Добавьте индивидуальности', 'Столешница'];
  for (const t of labels) {
    try {
      const loc = frame.getByText(t, { exact: false }).first();
      if (await loc.count()) {
        await loc.click({ timeout: 2500 });
        tried.push({ t, ok: true });
        return tried;
      }
    } catch (e) {
      tried.push({ t, ok: false, err: String(e).slice(0, 80) });
    }
  }
  try {
    await frame.locator('canvas').first().click({ position: { x: 200, y: 200 }, timeout: 2000 });
    tried.push({ t: 'canvas', ok: true });
  } catch (e) {
    tried.push({ t: 'canvas', ok: false, err: String(e).slice(0, 80) });
  }
  return tried;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: false });
  const context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
  await context.addInitScript(HOOK_JS);
  const page = await context.newPage();

  console.log('open', WRAPPER_URL);
  await page.goto(WRAPPER_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  console.log('');
  console.log('>>> В ЭТОМ окне Chrome: форма комнаты -> готовый вариант -> 3D.');
  console.log('>>> Нужны шкафы и тень на столешнице. Окно не закрывай.');
  console.log('');

  const deadline = Date.now() + WAIT_MINUTES * 60000;
  let frame = null;
  let best = null;
  while (Date.now() < deadline) {
    await sleep(3000);
    frame = await kitchenFrame(page);
    if (!frame) continue;
    let st = null;
    try {
      st = await frame.evaluate(() => {
        const s = window.__cldUbo;
        if (!s) return { hook: false };
        const env = (s.ubo || []).filter((u) => u.len >= 1844);
        const f = env.length ? env[env.length - 1].floats : [];
        return {
          hook: true,
          maxLen: s.maxLen,
          uboKinds: s.ubo.length,
          hasDefineStaticShadow: s.hasDefineStaticShadow === true,
          dirCount: f[4] || 0,
          pointCount: f[5] || 0,
          spotCount: f[6] || 0,
          depths: (s.depths || []).length,
        };
      });
    } catch (_) {}
    if (!st) continue;
    console.log('ждём…', JSON.stringify(st));
    best = st;
    if (st.hasDefineStaticShadow && st.dirCount > 0) {
      console.log('кухня с static shadow и directional — снимаю');
      break;
    }
  }

  if (!frame) {
    console.log('FRAME NOT FOUND');
    await browser.close();
    process.exit(1);
  }

  const states = [];
  try {
    await sleep(2500);
    states.push(await saveState(page, frame, 'idle'));

    const orb = await dragOrbit(page, frame);
    console.log('orbit', orb);
    await sleep(2500);
    states.push(await saveState(page, frame, 'orbit'));

    const ui = await clickSafeUi(frame);
    console.log('ui', JSON.stringify(ui));
    await sleep(2500);
    states.push(await saveState(page, frame, 'action'));
  } catch (e) {
    console.log('STATE FAIL', e);
    try {
      states.push(await saveState(page, frame, 'partial'));
    } catch (_) {}
  }

  const index = path.join(OUT_DIR, `kitchen-live-index-${stamp()}.json`);
  fs.writeFileSync(
    index,
    JSON.stringify(
      {
        waitLast: best,
        states: states.map((s) => ({
          tag: s.tag,
          file: s.file,
          png: s.png,
          hasDefineStaticShadow: s.data?.hasDefineStaticShadow,
          parsedEnv: s.data?.parsedEnv || null,
          depthCount: s.data?.depths?.length ?? 0,
        })),
      },
      null,
      2
    )
  );
  console.log('INDEX', index);
  await browser.close();
}

main().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
