/**
 * IKEA PAX empty — v0 extract. copy() → буфер → Ctrl+V в чат.
 * Chrome, пустая комната, F12 → Console → вставить весь файл → Enter.
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

  function num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function vec(v) {
    if (v == null) return null;
    if (typeof v === 'object' && (v.x != null || v._x != null)) {
      return { x: num(v.x ?? v._x), y: num(v.y ?? v._y), z: num(v.z ?? v._z), w: num(v.w ?? v._w) };
    }
    if (typeof v?.asArray === 'function') {
      const a = v.asArray();
      return { x: num(a[0]), y: num(a[1]), z: num(a[2]), w: num(a[3]) };
    }
    return null;
  }

  function pickSpotAngles(L) {
    if (!L) return null;
    const inner =
      num(L.innerAngle ?? L._inner_angle ?? L._innerAngle ?? L.inner_angle) ??
      num(L.get_inner_angle?.());
    const outer =
      num(L.outerAngle ?? L._outer_angle ?? L._outerAngle ?? L.outer_angle) ??
      num(L.get_outer_angle?.());
    return { innerDeg: inner, outerDeg: outer };
  }

  function readHeightStats(hm, canvas) {
    if (!hm) return { note: 'no heightmap texture' };
    const w = hm.width ?? hm._width ?? hm.getSize?.()?.width;
    const h = hm.height ?? hm._height ?? hm.getSize?.()?.height;
    if (!w || !h) return { note: 'heightmap size unknown', class: hm.constructor?.name };
    try {
      const gl =
        canvas?.getContext('webgl2', { preserveDrawingBuffer: true }) ||
        canvas?.getContext('webgl', { preserveDrawingBuffer: true });
      if (!gl || !hm._texture) {
        return { w, h, note: 'no gl texture — use ALL-empty for pixels' };
      }
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, hm._texture, 0);
      const buf = new Float32Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, buf);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.deleteFramebuffer(fb);
      let min = Infinity;
      let max = -Infinity;
      let sum = 0;
      let nz = 0;
      for (let i = 0; i < w * h; i++) {
        const v = buf[i * 4];
        min = Math.min(min, v);
        max = Math.max(max, v);
        sum += v;
        if (v > 1e-6) nz++;
      }
      return { w, h, min, max, mean: +(sum / (w * h)).toFixed(4), nonzero: nz };
    } catch (e) {
      return { w, h, err: e.message };
    }
  }

  const core = findCore();
  if (!core?.betraktaViewer) {
    console.error({ err: 'no betraktaViewer — дождитесь 3D, повторите' });
    return { err: 'no core' };
  }

  const bv = core.betraktaViewer;
  const lm = bv._light_manager || bv.light_manager;
  const rs = core.lights?.renderSettings || lm?._render_settings || {};
  const ssr = lm?._soft_shadow_renderer;
  const canvas = document.querySelector('canvas');

  let punctual = [];
  try {
    punctual = lm?.get_punctual_lights?.() || [];
    if (!Array.isArray(punctual)) punctual = [...(punctual || [])];
  } catch {}

  const hm =
    (typeof ssr?.get_blurred_heightmap === 'function' && ssr.get_blurred_heightmap()) ||
    ssr?.texture ||
    null;

  const spot = punctual[0] || null;
  const angles = pickSpotAngles(spot);

  const out = {
    ok: true,
    when: new Date().toISOString(),
    purpose: 'ikea-v0-empty',
    env: rs.environmentMap || rs.environment || null,
    ambient: (() => {
      try {
        const a = lm?.ambient_light || lm?._ambient_light;
        return a ? { intensity: a.intensity ?? a._intensity } : null;
      } catch {
        return null;
      }
    })(),
    punctualCount: punctual.length,
    spot: spot
      ? {
          class: spot.constructor?.name,
          intensity: spot.intensity ?? spot._intensity,
          position: vec(spot.position || spot._position || spot.get_position?.()),
          direction: vec(spot.direction || spot._direction || spot.get_direction?.()),
          angles,
          shadowNear: spot.shadowNear ?? spot._shadow_near ?? spot.get_shadow?.()?.near,
          shadowFar: spot.shadowFar ?? spot._shadow_far ?? spot.get_shadow?.()?.far,
          shadowRes: spot.shadowResolution ?? spot._shadow_resolution,
        }
      : null,
    soft: ssr
      ? {
          intensity: ssr._intensity ?? ssr.intensity,
          resolution: ssr._resolution ?? ssr.resolution,
          center: vec(ssr._tracked_center_position || ssr.center),
          size: vec(ssr._tracked_size || ssr.size),
          refH: ssr.referenceHeight ?? ssr._reference_height,
          renderMask: ssr._render_layer_mask?.bitmap ?? ssr._render_layer_mask,
          blockMask: ssr._block_layer_mask?.bitmap ?? ssr._block_layer_mask,
          heightPixels: readHeightStats(hm, canvas),
        }
      : null,
    post: {
      exposureLinear: num(bv.get_camera_exposure_linear?.()),
      toneMapping: bv.toneMappingEnabled ?? bv._tone_mapping_enabled,
    },
    camera: (() => {
      try {
        const c = bv.camera || bv._camera || core.camera || bv.get_camera?.();
        return {
          class: c?.constructor?.name,
          fov: num(c?.fov ?? c?._fov),
          pos: vec(c?.position || c?._position),
          target: vec(c?.target || c?._target),
        };
      } catch {
        return null;
      }
    })(),
    note: 'Dump SoT: inner/outer 65°/106° if angles null; heightmap empty → nonzero=0',
  };

  const s = JSON.stringify(out, null, 2);
  window.__cldIkeaDump = out;
  console.log(s);

  let copied = false;
  try {
    copy(s);
    copied = true;
  } catch (e) {
    console.warn('copy() failed:', e.message);
  }

  if (copied) {
    console.log('%c→ скопировано в буфер — Ctrl+V в чат', 'color:#0a0;font-weight:bold;font-size:14px');
  } else {
    console.log('%c→ в буфере нет — выполните: copy(JSON.stringify(window.__cldIkeaDump, null, 2))', 'color:#a60;font-weight:bold');
  }

  return out;
})();
