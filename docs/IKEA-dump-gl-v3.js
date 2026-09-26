/**
 * IKEA PAX — GL/PBR dump v3: НЕ ждёт поворота камеры.
 * 1) Ищет GLSL в Betrakta/Babylon объектах (уже скомпилировано)
 * 2) Вешает hook + принудительно dirty (night/quality/resize)
 *
 * Пустая комната OK. F12 → вставить → ждать до ~12 с → JSON в чат.
 */
(() => {
  function findCore() {
    const rootEl = document.querySelector('#root') || document.body;
    const key = Object.keys(rootEl).find(
      (k) => k.startsWith('__reactContainer') || k.startsWith('__reactFiber')
    );
    let fiber = key ? rootEl[key] : null;
    if (fiber?.stateNode?.current) fiber = fiber.stateNode.current;
    const q = [fiber];
    let n = 0;
    while (q.length && n < 30000) {
      const f = q.shift();
      n++;
      const v = f?.memoizedProps?.value;
      if (v?.betraktaViewer) return v;
      if (f?.child) q.push(f.child);
      if (f?.sibling) q.push(f.sibling);
    }
    return null;
  }

  function looksGlsl(s) {
    if (typeof s !== 'string' || s.length < 1200) return false;
    return /#version|void main\s*\(|gl_FragColor|out vec4|ENABLE_SOFT|betrakta|precision\s+(medium|high)p/i.test(
      s
    );
  }

  function snip(src, re, n = 560) {
    if (!src) return null;
    const m = src.match(re);
    if (!m || m.index == null) return null;
    return src.slice(Math.max(0, m.index - 80), Math.min(src.length, m.index + n));
  }

  function score(s) {
    let sc = Math.min(s.length / 1000, 40);
    if (/ENABLE_SOFT_SHADOWS|blurred_heightmap/i.test(s)) sc += 80;
    if (/BetraktaSpot|punctual|coneCos|innerAngle/i.test(s)) sc += 40;
    if (/exposure|betraktaOutput/i.test(s)) sc += 20;
    if (/paint|SOFT_SHADOW/i.test(s)) sc += 10;
    return sc;
  }

  const found = [];
  const seen = new WeakSet();
  const seenStr = new Set();

  function addStr(s, tag) {
    if (!looksGlsl(s) || seenStr.has(s.slice(0, 200) + s.length)) return;
    seenStr.add(s.slice(0, 200) + s.length);
    found.push({ tag, len: s.length, text: s, score: score(s) });
  }

  function walk(o, tag, depth) {
    if (o == null || depth > 5 || found.length > 40) return;
    const t = typeof o;
    if (t === 'string') {
      addStr(o, tag);
      return;
    }
    if (t !== 'object') return;
    if (seen.has(o)) return;
    try {
      seen.add(o);
    } catch {
      return;
    }

    // arrays
    if (Array.isArray(o)) {
      const lim = Math.min(o.length, 30);
      for (let i = 0; i < lim; i++) walk(o[i], tag + '[' + i + ']', depth + 1);
      return;
    }

    let keys = [];
    try {
      keys = Object.getOwnPropertyNames(o);
    } catch {
      return;
    }
    // prioritize shader-ish keys first
    keys.sort((a, b) => {
      const ra = /shader|fragment|vertex|glsl|compiled|source|effect|code/i.test(a) ? 0 : 1;
      const rb = /shader|fragment|vertex|glsl|compiled|source|effect|code/i.test(b) ? 0 : 1;
      return ra - rb;
    });
    const lim = Math.min(keys.length, depth <= 2 ? 80 : 40);
    for (let i = 0; i < lim; i++) {
      const k = keys[i];
      if (/^_|password|cookie|token/i.test(k) && !/shader|fragment|vertex|compiled|source|effect/i.test(k)) {
        // still allow underscore shader fields
        if (!/shader|fragment|vertex|compiled|source|effect|glsl|code|pipeline/i.test(k)) continue;
      }
      let v;
      try {
        v = o[k];
      } catch {
        continue;
      }
      const vt = typeof v;
      if (vt === 'string') addStr(v, tag + '.' + k);
      else if (vt === 'object' && v) walk(v, tag + '.' + k, depth + 1);
      else if (vt === 'function' && /shader|fragment|getCompiled|getSource/i.test(k)) {
        try {
          const r = v.call(o);
          if (typeof r === 'string') addStr(r, tag + '.' + k + '()');
          else if (r && typeof r === 'object') walk(r, tag + '.' + k + '()', depth + 1);
        } catch {}
      }
    }
  }

  const core = findCore();
  if (!core?.betraktaViewer) {
    const err = { err: 'no betraktaViewer' };
    console.error(err);
    return err;
  }
  const bv = core.betraktaViewer;
  const lm = bv._light_manager || bv.light_manager;
  const scene = bv.scene || bv._scene;
  const engine = bv.engine || bv._engine || scene?.getEngine?.();

  // --- 1) walk live objects for GLSL ---
  walk(engine, 'engine', 0);
  walk(lm, 'lm', 0);
  try {
    const list = scene?.meshes || scene?.getActiveMeshes?.()?.data || [];
    const arr = Array.isArray(list) ? list : [...(list || [])];
    let nMat = 0;
    for (const mesh of arr) {
      const mat = mesh.material || mesh._material;
      if (!mat) continue;
      const name = String(mat.name || mat.id || '');
      if (!/paint|floor|herring|ceiling|010_white|betrakta/i.test(name + mat.constructor?.name)) continue;
      walk(mat, 'mat:' + name.slice(0, 40), 0);
      nMat++;
      if (nMat >= 12) break;
    }
  } catch {}

  // --- 2) GL hooks + force dirty ---
  const canvas = document.querySelector('canvas');
  const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
  const dbg = gl?.getExtension?.('WEBGL_debug_shaders');
  const hookedSources = [];
  let restore = null;

  if (gl) {
    const proto = WebGLRenderingContext.prototype;
    const proto2 = window.WebGL2RenderingContext?.prototype;
    const origSrc = proto.shaderSource;
    const origSrc2 = proto2?.shaderSource;
    const origCompile = proto.compileShader;
    const origCompile2 = proto2?.compileShader;
    const shaders = [];

    function wrapSrc(fn) {
      return function (shader, source) {
        try {
          if (typeof source === 'string' && source.length > 1200) {
            hookedSources.push(source);
            addStr(source, 'hook.shaderSource');
            shaders.push(shader);
          }
        } catch {}
        return fn.call(this, shader, source);
      };
    }
    function wrapCompile(fn) {
      return function (shader) {
        try {
          if (dbg) {
            const t = dbg.getTranslatedShaderSource(shader);
            if (typeof t === 'string' && t.length > 1200) {
              hookedSources.push(t);
              addStr(t, 'hook.translated');
            }
          }
        } catch {}
        return fn.call(this, shader);
      };
    }

    proto.shaderSource = wrapSrc(origSrc);
    proto.compileShader = wrapCompile(origCompile);
    if (proto2) {
      if (origSrc2) proto2.shaderSource = wrapSrc(origSrc2);
      if (origCompile2) proto2.compileShader = wrapCompile(origCompile2);
    }
    restore = () => {
      proto.shaderSource = origSrc;
      proto.compileShader = origCompile;
      if (proto2) {
        if (origSrc2) proto2.shaderSource = origSrc2;
        if (origCompile2) proto2.compileShader = origCompile2;
      }
    };
  }

  // Force recompile / dirty paths
  const dirtyLog = [];
  try {
    const spot = lm?.get_punctual_lights?.()?.[0];
    if (spot) {
      const q = spot._quality ?? spot.quality ?? 0;
      try {
        spot._quality = q === 0 ? 1 : 0;
        dirtyLog.push('spot.quality toggle');
      } catch {}
      try {
        spot.mark_light_and_shadow_dirty?.();
        dirtyLog.push('spot.mark_dirty');
      } catch {}
      try {
        // restore
        spot._quality = q;
      } catch {}
    }
  } catch (e) {
    dirtyLog.push('spot err ' + e.message);
  }
  try {
    lm?.mark_all_shadowmaps_dirty?.();
    dirtyLog.push('lm.shadowmaps_dirty');
  } catch {}
  try {
    bv.mark_scene_dirty?.();
    dirtyLog.push('bv.scene_dirty');
  } catch {}
  try {
    const list = scene?.meshes || [];
    const arr = Array.isArray(list) ? list : [...(list || [])];
    for (const mesh of arr.slice(0, 30)) {
      const mat = mesh.material || mesh._material;
      if (!mat) continue;
      try {
        mat.markAsDirty?.();
        mat._mark_as_dirty?.();
        mat.mark_dirty?.();
      } catch {}
      try {
        // flip a harmless define if API exists
        if (typeof mat.setDefined === 'function') {
          mat.setDefined('CLD_DUMP_PROBE', true);
          mat.setDefined('CLD_DUMP_PROBE', false);
          dirtyLog.push('setDefined probe');
        }
      } catch {}
    }
  } catch {}
  try {
    // Night mode button if present
    const btns = [...document.querySelectorAll('button, [role="button"]')];
    const night = btns.find((b) => /night/i.test(b.getAttribute('aria-label') || b.title || b.textContent || ''));
    if (night) {
      night.click();
      setTimeout(() => {
        try {
          night.click();
        } catch {}
      }, 400);
      dirtyLog.push('night click');
    }
  } catch {}
  try {
    const w = canvas.width;
    const h = canvas.height;
    canvas.width = Math.max(2, w - 2);
    canvas.height = h;
    canvas.width = w;
    canvas.height = h;
    window.dispatchEvent(new Event('resize'));
    dirtyLog.push('canvas resize');
  } catch {}

  function finish() {
    try {
      restore?.();
    } catch {}

    // one more walk after dirty
    try {
      walk(engine, 'engine2', 0);
      const list = scene?.meshes || [];
      const arr = Array.isArray(list) ? list : [...(list || [])];
      for (const mesh of arr.slice(0, 20)) {
        const mat = mesh.material || mesh._material;
        if (mat) walk(mat, 'mat2', 0);
      }
    } catch {}

    found.sort((a, b) => b.score - a.score || b.len - a.len);
    const best = found[0];
    const src = best?.text || '';
    const defs = (src.match(/#define [A-Z0-9_]+[^\n]*/g) || []).filter((d) =>
      /SOFT|SPOT|DIR|LIGHT|EXPOSURE|SHADOW|ENV|OCCLU|ACTIVE/i.test(d)
    );

    const out = {
      ok: true,
      purpose: 'gl-v3-walk+dirty',
      when: new Date().toISOString(),
      hasDebugShaders: !!dbg,
      dirtyLog,
      foundCount: found.length,
      hookedCount: hookedSources.length,
      top: found.slice(0, 8).map((f) => ({ tag: f.tag, len: f.len, score: f.score })),
      bestTag: best?.tag || null,
      len: src.length,
      defines: defs.slice(0, 60),
      snips: {
        soft: snip(src, /ENABLE_SOFT_SHADOWS|blurred_heightmap|softH|reference_height/i),
        spot: snip(src, /spot|coneCos|innerAngle|outerAngle|lightDir|BetraktaSpot/i),
        atten: snip(src, /inv.?square|attenuation|distance2|rangeAtten|candela|physical/i),
        exposure: snip(src, /exposure|tonemap|betraktaOutput/i),
        occ: snip(src, /occlusion|ao\s*\*?=/i),
        env: snip(src, /environment|irradiance|ibl/i),
      },
    };

    // full best shader separately (может быть большой) — первые 8k + хвост
    if (src.length) {
      out.shaderHead = src.slice(0, 8000);
      out.shaderTail = src.slice(-4000);
    }

    const s = JSON.stringify(out, null, 2);
    console.log(s);
    try {
      copy(s);
      console.log('%c→ буфер gl-v3 — вставьте JSON в чат', 'color:#0a0;font-weight:bold');
    } catch {}
    window.__cldIkeaGlV3 = out;
    // полный текст если нужен отдельно
    window.__cldIkeaGlV3Full = src || null;
    return out;
  }

  console.log('%cИщу GLSL в объектах + dirty, ~12с…', 'color:#08c;font-weight:bold');
  // immediate partial from walk
  console.log('[gl-v3] walk so far', found.length, found.slice(0, 5).map((f) => f.tag + ':' + f.len));
  setTimeout(finish, 12000);
  return { hooked: true, walkNow: found.length, hasDebugShaders: !!dbg };
})();
