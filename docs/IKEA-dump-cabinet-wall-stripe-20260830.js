/**
 * IKEA PAX — dump «шкаф в комнате»: soft heightmap, wall stripe, casters, Spot SM.
 * Куда: Chrome → ikea.com/addon-app/storageone/pax/web/latest/us/en/ → комната + шкаф у стены → F12 Console.
 * Прислать: весь JSON из console (copy).
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

  function ser(v, d = 0) {
    if (v == null || d > 2) return v == null ? v : typeof v;
    if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') return v;
    if (typeof v === 'function') return '[fn]';
    if (v.x != null || v._x != null) {
      return {
        x: +(v.x ?? v._x),
        y: +(v.y ?? v._y),
        z: +(v.z ?? v._z),
        w: v.w != null || v._w != null ? +(v.w ?? v._w) : undefined,
      };
    }
    if (Array.isArray(v)) return v.slice(0, 12).map((x) => ser(x, d + 1));
    if (typeof v === 'object') {
      const o = { _c: v.constructor?.name };
      for (const k of Object.getOwnPropertyNames(v).slice(0, 30)) {
        try {
          const x = v[k];
          const t = typeof x;
          if (t === 'number' || t === 'boolean' || t === 'string') o[k] = x;
          else if (t === 'function') o[k] = '[fn]';
        } catch {}
      }
      return o;
    }
    return String(v);
  }

  async function readHmStats(engine, tex) {
    if (!tex || !engine?.readTexturePixels) return { err: 'no readTexturePixels' };
    const size = tex.getSize?.() || { width: tex.width || 80, height: tex.height || 80 };
    const w = size.width;
    const h = size.height;
    const data = await engine.readTexturePixels(tex, 0, 0, w, h);
    let min = 1;
    let max = 0;
    let sum = 0;
    let nz = 0;
    const n = w * h;
    for (let i = 0; i < n; i++) {
      const v = data[i * 4] / 255;
      if (v > 0.001) nz += 1;
      min = Math.min(min, v);
      max = Math.max(max, v);
      sum += v;
    }
    return { w, h, min, max, mean: sum / n, nonzero: nz };
  }

  const core = findCore();
  if (!core?.betraktaViewer) {
    const err = { err: 'no betraktaViewer', href: location.href };
    console.error(err);
    return err;
  }

  const bv = core.betraktaViewer;
  const lm = bv._light_manager || bv.light_manager;
  const ssr = lm?._soft_shadow_renderer;
  const engine = bv._engine || bv.engine;
  const scene = bv.scene || bv._scene;
  const meshes = scene?.meshes || [];

  const hmTex = ssr?.get_blurred_heightmap?.() || ssr?.texture || null;
  const hmStatsPromise = readHmStats(engine, hmTex);

  const wallSamples = [];
  const cabSamples = [];
  for (const m of meshes) {
    const nm = String(m.name || '');
    const matName = String(m.material?.name || m.material?.id || '');
    const low = (nm + ' ' + matName).toLowerCase();
    if (/dimension|gizmo|ui_|label|viewerui|helper/i.test(low)) continue;
    const row = {
      mesh: nm.slice(0, 72),
      mat: matName.slice(0, 48),
      layerMask: m.layerMask ?? m._layerMask ?? null,
      receiveShadows: m.receiveShadows ?? m._receiveShadows ?? null,
      castShadows: m.castShadows ?? m._castShadows ?? null,
    };
    if (/paint|wall|new_wall/i.test(low) && wallSamples.length < 10) wallSamples.push(row);
    if (/010_white|white_frame|003_back|90458221|20458205/i.test(low) && cabSamples.length < 14) {
      cabSamples.push(row);
    }
  }

  let wallMatShader = null;
  const wallMesh = meshes.find((m) =>
    String(m.material?.name || '').includes('paint_30x30')
  );
  if (wallMesh?.material?.getEffect) {
    try {
      const eff = wallMesh.material.getEffect();
      wallMatShader = {
        ENABLE_SOFT_SHADOWS: eff?.defines?.ENABLE_SOFT_SHADOWS,
        ACTIVE_LIGHTS: eff?.defines?.ACTIVE_LIGHTS,
        ACTIVE_SHADOW_LIGHTS: eff?.defines?.ACTIVE_SHADOW_LIGHTS,
      };
    } catch {}
  }

  const scm = lm?._shadow_caster_manager;
  const casterSize = scm?._shadow_caster_data?.size ?? scm?.shadow_casters?.length ?? null;

  return hmStatsPromise.then((hmStats) => {
    const out = {
      ok: true,
      schema: 'ikea-cabinet-wall-stripe-20260830',
      when: new Date().toISOString(),
      href: location.href,
      soft: ssr
        ? {
            intensity: ssr._intensity ?? ssr.intensity,
            resolution: ssr._resolution ?? ssr.resolution,
            reference_height: ssr._reference_height,
            render_layer_mask: ssr._render_layer_mask?.bitmap ?? ssr._render_layer_mask,
            block_layer_mask: ssr._block_layer_mask?.bitmap ?? ssr._block_layer_mask,
            center: ser(ssr._center || ssr._soft_shadow_box?.center),
            size: ser(ssr._size || ssr._soft_shadow_box?.size),
            blur_scale: ssr._blur_effect?._blur_scale ?? null,
            heightmap: hmStats,
            ikeaRef: { nzMax: 0.806, nzMean: 0.03, nonzero: 1598, note: 'empty-vs-cabinet dump 2026-08-26' },
          }
        : null,
      spot: lm?.mainLight
        ? {
            class: lm.mainLight.constructor?.name,
            intensity: lm.mainLight.intensity,
            pos: ser(lm.mainLight.position),
            shadow: lm.mainLight.shadowEnabled ?? lm.mainLight._shadowEnabled,
          }
        : null,
      wallSamples,
      cabSamples,
      wallMatShader,
      shadowCasters: casterSize,
      meshCount: meshes.length,
      clodisGapNotes: [
        'Wall stripe = soft heightmap AO on IBL (ENABLE_SOFT_SHADOWS), NOT procedural cone',
        'Spot added WITHOUT ao multiply on walls (dump GLSL)',
        'Casters layerMask 3 (0+1); soft renderMask=2 blockMask=32',
        'Walls receiveShadows=true paint_30x30',
      ],
    };
    const s = JSON.stringify(out, null, 2);
    console.log(s);
    try {
      copy(s);
      console.log('%c→ JSON в буфере', 'color:#0a0;font-weight:bold');
    } catch {}
    window.__cldIkeaCabinetWallStripeDump = out;
    return out;
  });
})();
