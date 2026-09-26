/**
 * IKEA PAX — dump v3: слои Soft + heightmap + occlusion channel.
 * v2 уже дал Soft 80/1 и receiveShadows. Нужно: кто в heightmap (стены?) и как plane/PBR это ест.
 *
 * PAX planner → F12 Console → вставить целиком → JSON в чат.
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
    while (q.length && n < 25000) {
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

  function ser(v, d = 0) {
    if (v == null || d > 2) return v == null ? v : String(typeof v);
    if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') return v;
    if (typeof v === 'function') return '[fn]';
    if (Array.isArray(v)) return v.slice(0, 8).map((x) => ser(x, d + 1));
    if (typeof v === 'object') {
      if (v.x != null || v._x != null) {
        return { x: num(v.x ?? v._x), y: num(v.y ?? v._y), z: num(v.z ?? v._z), w: num(v.w ?? v._w) };
      }
      const o = { _c: v.constructor?.name };
      let keys = [];
      try {
        keys = Object.getOwnPropertyNames(v).slice(0, 24);
      } catch {
        return o;
      }
      for (const k of keys) {
        try {
          const x = v[k];
          const t = typeof x;
          if (t === 'number' || t === 'boolean' || t === 'string') o[k] = x;
          else if (t === 'function') o[k] = '[fn]';
        } catch {}
      }
      return o;
    }
    return String(typeof v);
  }

  const core = findCore();
  if (!core?.betraktaViewer) {
    const err = { err: 'no betraktaViewer' };
    console.error(err);
    return err;
  }
  const bv = core.betraktaViewer;
  const lm = bv._light_manager || bv.light_manager;
  const ssr = lm?._soft_shadow_renderer;
  if (!ssr) {
    const err = { err: 'no SoftShadowRenderer' };
    console.error(err);
    return err;
  }

  let heightmap = null;
  try {
    const hm =
      (typeof ssr.get_blurred_heightmap === 'function' && ssr.get_blurred_heightmap()) ||
      ssr.texture ||
      null;
    heightmap = hm
      ? {
          class: hm.constructor?.name,
          width: hm.getSize?.()?.width ?? hm.width ?? hm._width ?? null,
          height: hm.getSize?.()?.height ?? hm.height ?? hm._height ?? null,
          keys: Object.getOwnPropertyNames(hm).slice(0, 40),
        }
      : null;
  } catch (e) {
    heightmap = { err: e.message };
  }

  let gen = null;
  try {
    const g = ssr._generate_shadow_plane_texture_effect;
    gen = g
      ? {
          class: g.constructor?.name,
          keys: Object.getOwnPropertyNames(g).slice(0, 40),
          options: ser(g._options),
          scaleRatio: ser(g._scaleRatio),
          texelSize: ser(g._texelSize),
        }
      : null;
  } catch (e) {
    gen = { err: e.message };
  }

  const scene = bv.scene || bv._scene;
  const list = scene?.meshes || scene?.getActiveMeshes?.()?.data || [];
  const arr = Array.isArray(list) ? list : [...(list || [])];
  const meshLayers = [];
  for (const mesh of arr) {
    const name = String(mesh.name || '');
    const mat = mesh.material || mesh._material;
    const matName = String(mat?.name || mat?.id || '');
    const low = (name + ' ' + matName).toLowerCase();
    if (!/paint|wall|floor|herring|ceiling|010_white/i.test(low)) continue;
    if (/dimension|gizmo|ui_|label|viewerui/i.test(low)) continue;
    let layer = null;
    try {
      layer = mesh.layerMask ?? mesh._layerMask ?? mesh.renderingGroupId ?? null;
    } catch {}
    let occ = null;
    try {
      const s = mat?.occlusion_sampler;
      occ = s
        ? {
            name: s.name,
            channel: ser(s._channel),
            uv_set: s.uv_set,
          }
        : null;
    } catch {}
    meshLayers.push({
      mesh: name.slice(0, 80),
      mat: matName.slice(0, 80),
      receiveShadows: mesh.receiveShadows ?? mesh._receiveShadows,
      castShadows: mesh.castShadows ?? mesh._castShadows,
      layerMask: layer,
      occlusion_strength: mat?._occlusion_strength ?? null,
      occlusion: occ,
    });
    if (meshLayers.length >= 20) break;
  }

  const out = {
    ok: true,
    purpose: 'soft-layers-v3',
    when: new Date().toISOString(),
    layers: {
      render_layer_mask: ssr._render_layer_mask ?? null,
      block_layer_mask: ssr._block_layer_mask ?? null,
    },
    heightmap,
    generatePlane: gen,
    shadow_plane_target: ssr._shadow_plane_target
      ? { class: ssr._shadow_plane_target.constructor?.name }
      : null,
    meshLayers,
  };
  const s = JSON.stringify(out, null, 2);
  console.log(s);
  try {
    copy(s);
    console.log('%c→ в буфере — вставьте в чат', 'color:#0a0;font-weight:bold');
  } catch {}
  window.__cldIkeaSoftLayersV3 = out;
  return out;
})();
