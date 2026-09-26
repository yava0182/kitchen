/**
 * IKEA v0 — GAP-fill: всё что не вошло в ALL-empty / pipette.
 * Пустая комната → F12 → Console → целиком → Enter → copy() → Ctrl+V в чат.
 *
 * Должен вернуть: defines, env 0.6, UBO slot0, heightPixels (engine read),
 * GLSL snippet lengths, soft keys, SH polynomial, viewport if any.
 */
(() => {
  function findCore() {
    const rootEl = document.querySelector('#root') || document.body;
    const key = Object.keys(rootEl).find(
      (k) => k.startsWith('__reactFiber') || k.startsWith('__reactContainer')
    );
    let fiber = key ? rootEl[key] : null;
    if (fiber?.stateNode?.current) fiber = fiber.stateNode.current;
    const q = [fiber];
    while (q.length) {
      const f = q.shift();
      const v = f?.memoizedProps?.value;
      if (v?.betraktaViewer) return v;
      if (f?.child) q.push(f.child);
      if (f?.sibling) q.push(f.sibling);
    }
    return null;
  }

  const core = findCore();
  const bv = core?.betraktaViewer;
  if (!bv) {
    console.error({ err: 'no betraktaViewer' });
    return { err: 'no bv' };
  }

  const lm = bv._light_manager || bv.light_manager;
  const scene = bv.scene || bv._scene;
  const engine = bv.engine || bv._engine;
  const ssr = lm?._soft_shadow_renderer;
  const rs = core?.lights?.renderSettings || lm?._render_settings || {};

  const out = {
    ok: true,
    purpose: 'GAP-fill',
    when: new Date().toISOString(),
  };

  // env 0.6 live
  out.env = rs.environmentMap || rs.environment || null;
  if (lm?.environment) {
    out.envObj = {
      rotation: lm.environment._rotation ?? lm.environment.rotation,
      url: lm.environment._environment_map_url,
      localMode: lm.environment._environment_map_local_mode_settings,
    };
  }

  // shader defines
  try {
    const mat = scene.meshes.find((m) =>
      String(m.material?.name || '').includes('paint')
    )?.material;
    const eff = mat?.getEffect?.();
    out.shaderDefines = eff?.defines ? String(eff.defines) : null;
  } catch (e) {
    out.shaderDefinesErr = e.message;
  }

  // UBO slot0
  try {
    const buf = lm.scene_uniform_buffer;
    out.activePunctual = buf?._active_punctual_lights_count;
    out.lightUniformSlot0 = buf?._light_uniform_data?.[0] || null;
  } catch (e) {
    out.uboErr = e.message;
  }

  // heightPixels via engine
  try {
    const hm =
      (typeof ssr?.get_blurred_heightmap === 'function' && ssr.get_blurred_heightmap()) ||
      ssr?.texture;
    const w = hm?.getSize?.()?.width || 80;
    const h = hm?.getSize?.()?.height || 80;
    const buf = new Uint8Array(w * h * 4);
    engine._readTexturePixels(hm, w, h, null, buf, false, false, 0, 0, true);
    let min = 255,
      max = 0,
      sum = 0,
      nz = 0;
    for (let i = 0; i < buf.length; i += 4) {
      const r = buf[i];
      if (r < min) min = r;
      if (r > max) max = r;
      sum += r;
      if (r > 2) nz++;
    }
    out.heightPixels = {
      w,
      h,
      min,
      max,
      mean: +(sum / (w * h)).toFixed(2),
      nonzero: nz,
      method: 'engine._readTexturePixels',
    };
  } catch (e) {
    out.heightPixelsErr = e.message;
  }

  // soft viewport + all ssr keys matching viewport
  out.soft = {
    center: ssr?._tracked_center_position,
    size: ssr?._tracked_size,
    refH: ssr?._reference_height,
    renderMask: ssr?._render_layer_mask?.bitmap ?? ssr?._render_layer_mask,
    blockMask: ssr?._block_layer_mask?.bitmap ?? ssr?._block_layer_mask,
    viewport: ssr?._blurred_heightmap_viewport || ssr?.blurredHeightmapViewport || null,
  };
  out.softKeys = ssr
    ? Object.getOwnPropertyNames(ssr).filter((k) =>
        /viewport|height|blur|plane|center|size|mask/i.test(k)
      )
    : null;

  // GLSL — только meta + первые 120 символов (полный JSON большой)
  try {
    const eff = scene.meshes.find((m) => m.material?.getEffect?.())?.material?.getEffect?.();
    const store = eff?.constructor?.IncludesShadersStore;
    if (store) {
      const keys = [
        'betrakta_material_renderer',
        'betrakta_output',
        'betrakta_brdf_ggx',
      ];
      out.glslMeta = {};
      for (const k of keys) {
        const src = store[k];
        if (typeof src === 'string') {
          out.glslMeta[k] = { len: src.length, head: src.slice(0, 120) };
        }
      }
      out.glslStoreKeyCount = Object.keys(store).length;
    }
  } catch (e) {
    out.glslErr = e.message;
  }

  // SH polynomial (live)
  try {
    const env = lm.environment;
    const tex = env?.texture || env?._texture;
    const poly = tex?.sphericalPolynomial || tex?._sphericalPolynomial;
    const rgb = (c) => (c ? [c.r ?? c.x, c.g ?? c.y, c.b ?? c.z] : null);
    if (poly) {
      out.shPolynomial = {
        x: rgb(poly.x),
        y: rgb(poly.y),
        z: rgb(poly.z),
        xx: rgb(poly.xx),
        yy: rgb(poly.yy),
        zz: rgb(poly.zz),
        xy: rgb(poly.xy),
        yz: rgb(poly.yz),
        zx: rgb(poly.zx),
      };
    }
  } catch (e) {
    out.shErr = e.message;
  }

  // gl clear HDR
  try {
    const gl = engine._gl;
    out.glClear = gl ? Array.from(gl.getParameter(gl.COLOR_CLEAR_VALUE)) : null;
  } catch {}

  const s = JSON.stringify(out, null, 2);
  window.__cldIkeaGapFill = out;
  console.log(s);
  try {
    copy(s);
    console.log('%c→ GAP-fill JSON в буфере — Ctrl+V в чат', 'color:#0a0;font-weight:bold');
  } catch (e) {
    console.warn('copy failed');
  }
  return out;
})();
