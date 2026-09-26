/**
 * IKEA PAX — dump чтобы УБРАТЬ screenCal / screenLinear у нас.
 *
 * Когда: пустая комната (без шкафа), тот же ракурс что сравниваете.
 * Куда: свой Chrome → ikea.com PAX → F12 Console → вставить ВЕСЬ файл → Enter.
 * JSON копируется в буфер → пришлите в чат целиком.
 *
 * Цель съёма:
 *  1) Spot UBO color_line_and_range + intensity (без наших 0.28)
 *  2) Soft empty: render/block layer mask + heightmap pixels min/max/mean
 *  3) Wall paint после PBR (base linear/srgb, maps, occ)
 *  4) Floor herringbone (albedo URL, factors)
 *  5) exposure / ambient / clear
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
      return {
        x: num(v.x ?? v._x),
        y: num(v.y ?? v._y),
        z: num(v.z ?? v._z),
        w: num(v.w ?? v._w),
      };
    }
    if (typeof v?.asArray === 'function') {
      const a = v.asArray();
      return { x: num(a[0]), y: num(a[1]), z: num(a[2]), w: num(a[3]) };
    }
    if (Array.isArray(v) && v.length >= 2) {
      return { x: num(v[0]), y: num(v[1]), z: num(v[2]), w: num(v[3]) };
    }
    return null;
  }

  function ser(v, d = 0) {
    if (v == null || d > 2) return v == null ? v : String(typeof v);
    const t = typeof v;
    if (t === 'number' || t === 'boolean' || t === 'string') return t === 'string' ? v.slice(0, 200) : v;
    if (t === 'function') return '[fn]';
    if (Array.isArray(v)) return v.slice(0, 16).map((x) => ser(x, d + 1));
    if (t === 'object') {
      if (v.x != null || v._x != null) return vec(v);
      const o = { _c: v.constructor?.name };
      let keys = [];
      try {
        keys = Object.getOwnPropertyNames(v).slice(0, 48);
      } catch {
        return o;
      }
      for (const k of keys) {
        try {
          const x = v[k];
          const xt = typeof x;
          if (xt === 'number' || xt === 'boolean' || xt === 'string') o[k] = xt === 'string' ? x.slice(0, 140) : x;
          else if (xt === 'function') o[k] = '[fn]';
          else if (x && xt === 'object' && (x.x != null || x._x != null)) o[k] = vec(x);
        } catch {}
      }
      return o;
    }
    return String(t);
  }

  function texInfo(t) {
    if (!t) return null;
    try {
      return {
        class: t.constructor?.name,
        name: t.name || t.id || null,
        url: t.url || t._url || t.name || null,
        level: t.level ?? t._level ?? null,
        size: t.getSize?.() || { w: t.width, h: t.height },
      };
    } catch (e) {
      return { err: e.message };
    }
  }

  function snip(src, re, pad = 420) {
    if (!src || typeof src !== 'string') return null;
    const m = src.match(re);
    if (!m || m.index == null) return null;
    return src.slice(Math.max(0, m.index - 80), Math.min(src.length, m.index + pad));
  }

  function grabFrag(mat) {
    const blobs = [];
    const push = (s, tag) => {
      if (typeof s === 'string' && s.length > 400) blobs.push({ tag, len: s.length, text: s });
    };
    try {
      push(mat?._fragmentSource || mat?.fragmentSource, 'matFrag');
      const fx = mat?._drawWrapper || mat?._effect || mat?.effect;
      push(fx?._fragmentSource || fx?.fragmentSource, 'fxFrag');
    } catch {}
    const longest = blobs.sort((a, b) => b.len - a.len)[0];
    if (!longest) return null;
    return {
      tag: longest.tag,
      len: longest.len,
      snips: {
        spot: snip(longest.text, /spot|cone|color_line|LIGHT_SAMPLING|candela/i),
        soft: snip(longest.text, /soft.?shadow|heightmap|ENABLE_SOFT|occlusion/i),
        atten: snip(longest.text, /inv.?square|range.?atten|decay|ld2|distance/i),
        exposure: snip(longest.text, /exposure|tonemap|output/i),
      },
    };
  }

  function matRow(mesh, mat) {
    const name = String(mesh?.name || mesh?.id || '');
    const matName = String(mat?.name || mat?.id || '');
    const row = {
      mesh: name.slice(0, 100),
      mat: matName.slice(0, 100),
      matClass: mat?.constructor?.name,
      receiveShadows: mesh?.receiveShadows ?? mesh?._receiveShadows,
      castShadows: mesh?.castShadows ?? mesh?._castShadows,
      layerMask: mesh?.layerMask ?? mesh?._layerMask ?? null,
      rough: mat?._roughness ?? mat?.roughness ?? null,
      metal: mat?._metallic ?? mat?.metallic ?? null,
      occStr: mat?._occlusion_strength ?? mat?.occlusionStrength ?? null,
      albedoTex: texInfo(mat?.albedoTexture || mat?._albedo_texture || mat?.baseTexture),
      normalTex: texInfo(mat?.bumpTexture || mat?._bumpTexture || mat?.normalTexture),
      occTex: texInfo(mat?.ambientTexture || mat?._occlusion_texture),
      heightmapUniform: null,
    };
    try {
      const srgb = mat?._base_color_factor_srgb || mat?.base_color_factor_srgb;
      if (srgb) row.base_srgb = { r: num(srgb.r ?? srgb.x), g: num(srgb.g ?? srgb.y), b: num(srgb.b ?? srgb.z) };
    } catch {}
    try {
      const lin = mat?._diffuseColorFactor || mat?.diffuseColorFactor || mat?._baseColor || mat?.baseColor;
      if (lin) row.base_linear = { r: num(lin.r ?? lin.x), g: num(lin.g ?? lin.y), b: num(lin.b ?? lin.z) };
    } catch {}
    try {
      const keys = Object.getOwnPropertyNames(mat || {}).filter((k) =>
        /height|soft|shadow|occlusion|albedo|color_line|env/i.test(k)
      );
      row.matKeysHit = keys.slice(0, 40);
      for (const k of keys) {
        if (/heightmap|soft.?shadow|blurred.?height/i.test(k)) {
          try {
            row.heightmapUniform = ser(mat[k]);
          } catch {}
        }
      }
    } catch {}
    row.shader = grabFrag(mat);
    return row;
  }

  const core = findCore();
  if (!core?.betraktaViewer) {
    console.error('[dump] betraktaViewer не найден');
    return;
  }
  const bv = core.betraktaViewer;
  const scene = bv.scene || bv._scene;
  const lm = bv.light_manager || bv.lightManager || bv._light_manager;
  const ssr =
    lm?.soft_shadows ||
    lm?.softShadow ||
    lm?.soft_shadow_renderer ||
    (lm && Object.values(lm).find((x) => x && typeof x.get_blurred_heightmap === 'function'));

  // --- lights ---
  let lights = [];
  try {
    const arr = lm?.lights || lm?._lights || scene?.lights || [];
    const list = Array.isArray(arr) ? arr : Object.values(arr || {});
    lights = list.slice(0, 12).map((L) => {
      const o = {
        class: L?.constructor?.name,
        name: L?.name || L?.id,
        intensity: L?.intensity ?? L?._intensity,
        intensityMode: L?.intensityMode ?? L?._intensityMode,
        angle: L?.angle ?? L?._angle,
        innerAngle: L?.innerAngle ?? L?._innerAngle,
        range: L?.range ?? L?._range,
        pos: vec(L?.position || L?._position),
        dir: vec(L?.direction || L?._direction),
        diffuse: vec(L?.diffuse || L?._diffuse),
        enableShadows: L?.enableShadows ?? L?._shadowEnabled,
      };
      try {
        const ubo = L?._uniformBuffer || L?.uniformBuffer || L?._ubo;
        if (ubo) {
          o.uboClass = ubo.constructor?.name;
          o.uboKeys = Object.getOwnPropertyNames(ubo).slice(0, 40);
          for (const k of Object.getOwnPropertyNames(ubo)) {
            if (/color_line|range|light|spot/i.test(k)) {
              try {
                o['ubo_' + k] = ser(ubo[k]);
              } catch {}
            }
          }
        }
      } catch {}
      return o;
    });
  } catch (e) {
    lights = [{ err: e.message }];
  }

  // dig color_line_and_range anywhere on lm / spot
  let colorLineHits = [];
  try {
    const roots = [lm, ...(lights || [])];
    const walk = (obj, path, depth) => {
      if (!obj || depth > 3 || colorLineHits.length > 8) return;
      let keys = [];
      try {
        keys = Object.getOwnPropertyNames(obj);
      } catch {
        return;
      }
      for (const k of keys) {
        try {
          if (/color_line_and_range/i.test(k)) {
            colorLineHits.push({ path: path + '.' + k, value: ser(obj[k]) });
          }
          const v = obj[k];
          if (v && typeof v === 'object' && depth < 2) walk(v, path + '.' + k, depth + 1);
        } catch {}
      }
    };
    walk(lm, 'lm', 0);
  } catch {}

  // --- soft + heightmap pixels ---
  let soft = null;
  let heightPixels = null;
  try {
    const hm =
      (typeof ssr?.get_blurred_heightmap === 'function' && ssr.get_blurred_heightmap()) ||
      ssr?.texture ||
      null;
    soft = {
      class: ssr?.constructor?.name,
      intensity: ssr?._intensity ?? ssr?.intensity,
      resolution: ssr?._resolution ?? ssr?.resolution,
      center: vec(ssr?._tracked_center_position || ssr?.center),
      size: vec(ssr?._tracked_size || ssr?.size),
      refH: ssr?._reference_height ?? ssr?.reference_height,
      renderMask: ssr?._render_layer_mask?.bitmap ?? ssr?._render_layer_mask,
      blockMask: ssr?._block_layer_mask?.bitmap ?? ssr?._block_layer_mask,
      renderMaskObj: ser(ssr?._render_layer_mask),
      blockMaskObj: ser(ssr?._block_layer_mask),
      viewport: ser(ssr?._blurred_heightmap_viewport || ssr?.blurredHeightmapViewport),
      heightmap: texInfo(hm),
      blurScale: vec(ssr?._blur_effect?.scale || ssr?._blur_effect?._scale),
      pipeline: {
        transfer: !!ssr?._transfer_depth,
        blur: !!ssr?._blur_effect,
        generate: !!ssr?._generate_shadow_plane_texture_effect,
        target: !!ssr?._shadow_plane_target,
      },
      api: {
        get_blurred_heightmap: typeof ssr?.get_blurred_heightmap,
        update_shadow_plane_texture: typeof ssr?.update_shadow_plane_texture,
      },
    };

    try {
      const canvas = document.querySelector('canvas');
      const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
      const raw =
        hm?._texture?._webGLTexture ||
        hm?._webGLTexture ||
        hm?._internalTexture?._webGLTexture ||
        null;
      if (gl && raw && hm) {
        const w = hm.getSize?.()?.width ?? hm.width ?? 80;
        const h = hm.getSize?.()?.height ?? hm.height ?? 80;
        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, raw, 0);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
          const buf = new Uint8Array(w * h * 4);
          gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
          let min = 255;
          let max = 0;
          let sum = 0;
          let nz = 0;
          for (let i = 0; i < buf.length; i += 4) {
            const r = buf[i];
            if (r < min) min = r;
            if (r > max) max = r;
            sum += r;
            if (r > 2) nz++;
          }
          const n = w * h;
          heightPixels = {
            w,
            h,
            min,
            max,
            mean: n ? +(sum / n).toFixed(3) : 0,
            nonzero: nz,
            center: buf[(Math.floor(h / 2) * w + Math.floor(w / 2)) * 4],
            note: 'empty room Soft heightmap — если mean≈0 и walls не в mask, AO≈1',
          };
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.deleteFramebuffer(fb);
      }
    } catch (e) {
      heightPixels = { err: e.message };
    }
  } catch (e) {
    soft = { err: e.message };
  }

  // --- wall / floor mats ---
  const list = scene?.meshes || scene?.getActiveMeshes?.()?.data || [];
  const arr = Array.isArray(list) ? list : [...(list || [])];
  const walls = [];
  const floors = [];
  const ceilings = [];
  for (const mesh of arr) {
    const mat = mesh.material || mesh._material;
    const low = String(mesh.name || '') + ' ' + String(mat?.name || '');
    const L = low.toLowerCase();
    if (/dimension|gizmo|ui_|label|viewerui|measure/i.test(L)) continue;
    if (/paint_30x30|wall/i.test(L) && walls.length < 6) walls.push(matRow(mesh, mat));
    if (/herring|floor/i.test(L) && floors.length < 6) floors.push(matRow(mesh, mat));
    if (/ceiling/i.test(L) && ceilings.length < 3) ceilings.push(matRow(mesh, mat));
  }

  // --- camera / exposure / ambient ---
  let camera = null;
  let exposure = null;
  let ambient = null;
  let env = null;
  try {
    const cam = scene?.activeCamera || bv.camera;
    camera = {
      class: cam?.constructor?.name,
      fov: cam?.fov ?? cam?._fov,
      pos: vec(cam?.position || cam?._position),
    };
  } catch {}
  try {
    exposure = {
      get_camera_exposure_linear: bv.get_camera_exposure_linear?.() ?? null,
      exposure: bv.exposure ?? scene?.imageProcessingConfiguration?.exposure ?? null,
      toneMappingEnabled: scene?.imageProcessingConfiguration?.toneMappingEnabled ?? null,
    };
  } catch {}
  try {
    const amb = scene?.ambientColor || lm?.ambient;
    ambient = vec(amb) || ser(amb);
  } catch {}
  try {
    env = {
      intensity: bv.environmentIntensity ?? scene?.environmentIntensity,
      texture: texInfo(scene?.environmentTexture || bv.environmentTexture),
    };
  } catch {}

  let clear = null;
  try {
    const canvas = document.querySelector('canvas');
    const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
    const p = gl?.getParameter(gl.COLOR_CLEAR_VALUE);
    clear = p ? { r: p[0], g: p[1], b: p[2], a: p[3] } : null;
  } catch {}

  const out = {
    schema: 'ikea-dump-drop-screencal-20260826',
    when: new Date().toISOString(),
    url: location.href.slice(0, 180),
    goal: 'remove Clodis screenCalEmpty + wall.screenLinear — need dump Spot UBO / Soft empty / wall+floor PBR',
    lights,
    colorLineHits,
    soft,
    heightPixels,
    walls,
    floors,
    ceilings,
    camera,
    exposure,
    ambient,
    env,
    clear,
    sceneBackground: scene?.background ?? null,
  };

  const json = JSON.stringify(out, null, 2);
  console.log(json);
  console.log('[dump] chars', json.length, '→ copy buffer');
  window.__cldIkeaDumpDrop=out;
  return {ok:true,schema:out.schema,chars:JSON.stringify(out).length,lights:(out.lights||[]).length,walls:(out.walls||[]).length,floors:(out.floors||[]).length};
})();
