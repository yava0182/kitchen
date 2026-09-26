/**
 * IKEA PAX — ОДИН съём EMPTY: всё, чего у нас ещё нет.
 *
 * Когда: планировщик, комната ПУСТАЯ (без шкафа), обычный Chrome.
 * Как: F12 → Console → вставить весь файл → Enter.
 * JSON копируется в буфер → вставьте в чат.
 *
 * Уже есть в SoT (этот скрипт всё равно переснимет для сверки):
 *   Spot 115 / 65°/106° / dir down, env 0.6 rot 80, exposure 2, paint, Soft 80×10×2.74
 * Ещё нет (ради этого съём):
 *   PBR cone/atten, heightmap pixels empty, floor URL, LUT, camera pose,
 *   shadow-plane mesh, light UBO, clearColor, room size, blur internals
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
    if (t === 'number' || t === 'boolean' || t === 'string') return t === 'string' ? v.slice(0, 160) : v;
    if (t === 'function') return '[fn]';
    if (Array.isArray(v)) return v.slice(0, 12).map((x) => ser(x, d + 1));
    if (t === 'object') {
      if (v.x != null || v._x != null) return vec(v);
      const o = { _c: v.constructor?.name };
      let keys = [];
      try {
        keys = Object.getOwnPropertyNames(v).slice(0, 36);
      } catch {
        return o;
      }
      for (const k of keys) {
        try {
          const x = v[k];
          const xt = typeof x;
          if (xt === 'number' || xt === 'boolean' || xt === 'string') o[k] = xt === 'string' ? x.slice(0, 120) : x;
          else if (xt === 'function') o[k] = '[fn]';
          else if (x && xt === 'object' && (x.x != null || x._x != null)) o[k] = vec(x);
        } catch {}
      }
      return o;
    }
    return String(t);
  }

  function snip(src, re, pad = 360) {
    if (!src || typeof src !== 'string') return null;
    const m = src.match(re);
    if (!m || m.index == null) return null;
    return src.slice(Math.max(0, m.index - 70), Math.min(src.length, m.index + pad));
  }

  function collectShaderText(obj, into, tag) {
    if (!obj || into.length > 12) return;
    const keys = [
      '_fragmentSource', 'fragmentSource', '_fragmentCode', 'fragmentCode',
      '_vertexSource', 'vertexSource',
      'glCompiledFull', '_glCompiledFull',
    ];
    for (const k of keys) {
      try {
        const s = obj[k];
        if (typeof s === 'string' && s.length > 800) into.push({ tag: tag + '.' + k, len: s.length, text: s });
        if (Array.isArray(s)) {
          s.forEach((x, i) => {
            if (typeof x === 'string' && x.length > 800) into.push({ tag: tag + '.' + k + i, len: x.length, text: x });
          });
        }
      } catch {}
    }
  }

  function texInfo(t) {
    if (!t) return null;
    try {
      return {
        class: t.constructor?.name,
        name: t.name || t._name || null,
        url: String(t.url || t._url || t.name || '').slice(0, 140),
        w: t.getSize?.()?.width ?? t.width ?? t._width ?? null,
        h: t.getSize?.()?.height ?? t.height ?? t._height ?? null,
      };
    } catch {
      return { class: t.constructor?.name };
    }
  }

  function lightDump(L) {
    if (!L) return null;
    const o = { class: L.constructor?.name };
    const names = Object.getOwnPropertyNames(L).slice(0, 50);
    o.ownKeys = names;
    for (const k of names) {
      try {
        const x = L[k];
        const t = typeof x;
        if (t === 'number' || t === 'boolean' || t === 'string') o[k] = x;
        else if (x && t === 'object' && (x.x != null || x._x != null)) o[k] = vec(x);
      } catch {}
    }
    try { o.get_intensity_candela = L.get_intensity_candela?.(); } catch {}
    try { o.get_intensity_lumen = L.get_intensity_lumen?.(); } catch {}
    try { o.pos = vec(L.get_position?.() || L.position || L._position); } catch {}
    try { o.dir = vec(L.get_direction?.() || L.direction || L._direction); } catch {}
    try {
      const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(L) || {});
      o.protoLight = proto.filter((n) => /intensity|angle|shadow|color|range|cone|decay/i.test(n)).slice(0, 40);
    } catch {}
    return o;
  }

  const core = findCore();
  if (!core?.betraktaViewer) {
    const err = { err: 'no betraktaViewer — свой Chrome, empty PAX' };
    console.error(err);
    return err;
  }

  const bv = core.betraktaViewer;
  const lm = bv._light_manager || bv.light_manager;
  const lightsApi = core.lights;
  const rs = lightsApi?.renderSettings || lm?._render_settings || {};
  const ssr = lm?._soft_shadow_renderer;
  const scene = bv.scene || bv._scene;
  const engine = bv.engine || bv._engine || scene?.getEngine?.();

  // --- lights ---
  let punctual = [];
  try {
    punctual = lm?.get_punctual_lights?.() || lm?.lights || [];
    if (!Array.isArray(punctual)) punctual = [...(punctual || [])];
  } catch {}

  let ambient = null;
  try {
    const a = lm?.ambient_light || lm?._ambient_light;
    ambient = a ? { class: a.constructor?.name, intensity: a.intensity ?? a._intensity } : null;
  } catch {}

  // --- env ---
  let env = null;
  try {
    const e = lm?.environment || lm?._environment || rs.environment;
    env = {
      intensity: num(e?.intensity ?? e?._intensity),
      rotation: num(e?.rotation ?? e?._rotation),
      url: e?.url || e?._url || rs.environment?.url || null,
      fileType: e?.fileType || e?._file_type,
      localMode: ser(e?.localMode || e?._local_mode || rs.environment?.localMode),
      mip: e?.mipLevels ?? e?._mip_levels,
    };
  } catch (e) {
    env = { err: e.message };
  }

  // --- camera / post ---
  let camera = null;
  try {
    const c = bv.camera || bv._camera || core.camera;
    camera = {
      class: c?.constructor?.name,
      fov: num(c?.fov ?? c?._fov),
      minZ: num(c?.minZ ?? c?._minZ),
      maxZ: num(c?.maxZ ?? c?._maxZ),
      pos: vec(c?.position || c?._position),
      target: vec(c?.target || c?._target),
      exposureLinear: num(
        bv.get_camera_exposure_linear?.() ?? bv._camera_exposure_linear ?? c?.exposure
      ),
    };
  } catch {}

  const lut = bv.get_lut_effect?.() || bv._lut_effect || bv.lut_effect;
  let lutDump = null;
  try {
    lutDump = {
      class: lut?.constructor?.name,
      url: lut?._url || lut?.url || lut?._lut_texture?.url,
      intensity: lut?.intensity ?? lut?._intensity,
      keys: lut ? Object.getOwnPropertyNames(lut).slice(0, 30) : null,
    };
  } catch {}

  let post = null;
  try {
    post = {
      exposureLinear: num(bv.get_camera_exposure_linear?.()),
      ipcTonemap:
        rs.imageProcessing?.toneMappingEnabled ??
        rs.toneMappingEnabled ??
        rs.imageProcessing?.toneMapping,
      ssao: rs.screenSpaceAmbientOcclusion ?? rs.ssao ?? rs.features?.ssao,
      gtao: rs.gtao ?? rs.features?.gtao,
      msaa: rs.samples ?? rs.msaa ?? engine?.samples ?? engine?._samples,
      features: ser(rs.features),
    };
  } catch {}

  // --- canvas / clear ---
  const canvas = document.querySelector('canvas');
  let glClear = null;
  try {
    const gl =
      canvas?.getContext('webgl2', { preserveDrawingBuffer: true }) ||
      canvas?.getContext('webgl', { preserveDrawingBuffer: true });
    if (gl) {
      const p = gl.getParameter(gl.COLOR_CLEAR_VALUE);
      glClear = { r: p[0], g: p[1], b: p[2], a: p[3] };
    }
  } catch {}
  let sceneBg = null;
  try {
    sceneBg = {
      background: scene?.background ?? scene?._background ?? null,
      clearColor: vec(scene?.clearColor || scene?._clearColor),
      autoClear: scene?.autoClear ?? scene?._autoClear,
    };
  } catch {}

  // --- soft ---
  let soft = null;
  let heightPixels = null;
  try {
    const hm =
      (typeof ssr?.get_blurred_heightmap === 'function' && ssr.get_blurred_heightmap()) ||
      ssr?.texture ||
      null;
    const gen = ssr?._generate_shadow_plane_texture_effect;
    const blur = ssr?._blur_effect;
    const planeT = ssr?._shadow_plane_target;
    soft = {
      class: ssr?.constructor?.name,
      intensity: ssr?._intensity ?? ssr?.intensity,
      resolution: ssr?._resolution ?? ssr?.resolution,
      center: vec(ssr?._tracked_center_position || ssr?.center),
      size: vec(ssr?._tracked_size || ssr?.size),
      refH: ssr?._reference_height ?? ssr?.reference_height,
      renderMask: ssr?._render_layer_mask?.bitmap ?? ssr?._render_layer_mask,
      blockMask: ssr?._block_layer_mask?.bitmap ?? ssr?._block_layer_mask,
      viewport: ssr?._blurred_heightmap_viewport || ssr?.blurredHeightmapViewport || null,
      heightmap: texInfo(hm),
      blur: blur
        ? {
            class: blur.constructor?.name,
            samples: blur._samples ?? blur.samples,
            scale: vec(blur.scale || blur._scale),
            direction: vec(blur.direction || blur._direction),
            keys: Object.getOwnPropertyNames(blur).slice(0, 40),
            options: ser(blur._options || blur.options),
          }
        : null,
      generatePlane: gen
        ? {
            class: gen.constructor?.name,
            keys: Object.getOwnPropertyNames(gen).slice(0, 40),
            options: ser(gen._options || gen.options),
            scaleRatio: ser(gen._scaleRatio),
            texelSize: ser(gen._texelSize),
          }
        : null,
      shadowPlaneTarget: planeT ? { class: planeT.constructor?.name, tex: texInfo(planeT) } : null,
      pipeline: {
        transfer: !!ssr?._transfer_depth,
        blur: !!ssr?._blur_effect,
        generate: !!ssr?._generate_shadow_plane_texture_effect,
        target: !!ssr?._shadow_plane_target,
      },
    };

    // heightmap stats via WebGL if InternalTexture
    try {
      const gl =
        canvas?.getContext('webgl2') ||
        canvas?.getContext('webgl');
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
        const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
        if (ok) {
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
            mean: n ? +(sum / n).toFixed(2) : 0,
            nonzero: nz,
            corners: [buf[0], buf[(w - 1) * 4], buf[(h - 1) * w * 4], buf[(n - 1) * 4]],
            center: buf[(Math.floor(h / 2) * w + Math.floor(w / 2)) * 4],
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

  // --- meshes / materials ---
  const list = scene?.meshes || scene?.getActiveMeshes?.()?.data || [];
  const arr = Array.isArray(list) ? list : [...(list || [])];
  const meshes = [];
  const shaders = [];
  let shadowPlaneMesh = null;
  let roomSize = null;

  for (const mesh of arr) {
    const name = String(mesh.name || mesh.id || '');
    const mat = mesh.material || mesh._material;
    const matName = String(mat?.name || mat?.id || '');
    const low = (name + ' ' + matName).toLowerCase();
    if (/dimension|gizmo|ui_|label|viewerui|measure/i.test(low)) continue;

    const interesting = /paint|wall|floor|herring|ceiling|010_white|soft|shadow.?plane|room/i.test(low);
    if (!interesting && meshes.length > 18) continue;

    let occ = null;
    try {
      const s = mat?.occlusion_sampler;
      occ = s ? { name: s.name, channel: ser(s._channel), uv: s.uv_set } : null;
    } catch {}

    const row = {
      mesh: name.slice(0, 90),
      mat: matName.slice(0, 90),
      matClass: mat?.constructor?.name,
      receiveShadows: mesh.receiveShadows ?? mesh._receiveShadows,
      castShadows: mesh.castShadows ?? mesh._castShadows,
      layerMask: mesh.layerMask ?? mesh._layerMask ?? null,
      occStr: mat?._occlusion_strength ?? null,
      occ,
      rough: mat?._roughness ?? mat?.roughness ?? null,
      metal: mat?._metallic ?? mat?.metallic ?? null,
      albedoTex: texInfo(mat?.albedoTexture || mat?._albedo_texture || mat?.baseTexture),
      occTex: texInfo(mat?.ambientTexture || mat?._occlusion_texture),
      pos: vec(mesh.position || mesh._position),
    };
    try {
      const srgb = mat?._base_color_factor_srgb || mat?.base_color_factor_srgb;
      if (srgb) row.base_srgb = { r: num(srgb.r ?? srgb.x), g: num(srgb.g ?? srgb.y), b: num(srgb.b ?? srgb.z) };
    } catch {}
    try {
      const bb = mesh.getBoundingInfo?.()?.boundingBox || mesh.getBoundingBox?.();
      if (bb) {
        row.bbMin = vec(bb.minimumWorld || bb.minimum);
        row.bbMax = vec(bb.maximumWorld || bb.maximum);
      }
    } catch {}

    if (/shadow.?plane|soft.?shadow/i.test(low)) shadowPlaneMesh = row;
    if (interesting) meshes.push(row);
    if (meshes.length >= 24) continue;

    if (/paint_30x30|herring|ceiling/i.test(low) && mat) {
      collectShaderText(mat, shaders, matName.slice(0, 40));
      collectShaderText(mat._drawWrapper || mat._effect, shaders, 'draw');
    }
  }

  try {
    const floors = meshes.filter((m) => /floor|herring/i.test(m.mesh + m.mat));
    const walls = meshes.filter((m) => /paint|wall/i.test(m.mesh + m.mat));
    const xs = [];
    const zs = [];
    const ys = [];
    for (const m of [...floors, ...walls]) {
      if (m.bbMin) {
        xs.push(m.bbMin.x, m.bbMax?.x);
        zs.push(m.bbMin.z, m.bbMax?.z);
        ys.push(m.bbMin.y, m.bbMax?.y);
      }
    }
    if (xs.length) {
      roomSize = {
        minX: Math.min(...xs.filter(Number.isFinite)),
        maxX: Math.max(...xs.filter(Number.isFinite)),
        minY: Math.min(...ys.filter(Number.isFinite)),
        maxY: Math.max(...ys.filter(Number.isFinite)),
        minZ: Math.min(...zs.filter(Number.isFinite)),
        maxZ: Math.max(...zs.filter(Number.isFinite)),
      };
    }
  } catch {}

  const longest = shaders.sort((a, b) => b.len - a.len)[0];
  let shaderSnips = null;
  if (longest?.text) {
    const src = longest.text;
    shaderSnips = {
      tag: longest.tag,
      len: longest.len,
      defines: (src.match(/#define [A-Z0-9_]+[^\n]*/g) || [])
        .filter((d) => /SOFT|SPOT|DIR|LIGHT|EXPOSURE|SHADOW|ENV|OCCLU|ACTIVE/i.test(d))
        .slice(0, 50),
      snips: {
        soft: snip(src, /ENABLE_SOFT_SHADOWS|blurred_heightmap|softH|reference_height/i),
        spot: snip(src, /spot|coneCos|innerAngle|outerAngle|lightDir|BetraktaSpot/i),
        atten: snip(src, /inv.?square|attenuation|distance2|rangeAtten|candela|lumen/i),
        exposure: snip(src, /exposure|tonemap|betraktaOutput/i),
        occ: snip(src, /occlusion|ao\s*\*?=/i),
        env: snip(src, /environment|irradiance|specular.?env|ibl/i),
      },
    };
  }

  let ubo = null;
  try {
    const buf = lm?._light_buffer || lm?.scene_uniform_buffer || lm?._scene_uniform_buffer;
    ubo = buf
      ? {
          class: buf.constructor?.name,
          keys: Object.getOwnPropertyNames(buf).slice(0, 40),
          names: buf._uniformNames || buf.uniformNames || buf.getUniformNames?.() || null,
        }
      : null;
  } catch {}

  const out = {
    ok: true,
    purpose: 'ALL-empty',
    when: new Date().toISOString(),
    note: 'empty PAX — полный съём пробелов',
    punctualCount: punctual.length,
    punctual: punctual.slice(0, 4).map(lightDump),
    ambient,
    env,
    camera,
    post,
    lut: lutDump,
    glClear,
    sceneBg,
    canvas: canvas ? { w: canvas.width, h: canvas.height } : null,
    soft,
    heightPixels,
    shadowPlaneMesh,
    roomSize,
    roomMaterialsSettings: rs.roomMaterials || rs.environment || null,
    meshes,
    shaderSnips,
    ubo,
    renderSettingsKeys: rs && typeof rs === 'object' ? Object.keys(rs).slice(0, 50) : null,
  };

  const s = JSON.stringify(out, null, 2);
  console.log(s);
  try {
    copy(s);
    console.log('%c→ буфер ALL-empty — вставьте в чат', 'color:#0a0;font-weight:bold');
  } catch {}
  window.__cldIkeaAllEmpty = out;
  return out;
})();
