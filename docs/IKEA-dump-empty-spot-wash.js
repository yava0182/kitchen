/**
 * IKEA PAX — EMPTY room dump: почему у них нет круглого пятна Spot на стене.
 *
 * Когда: планировщик открыт, комната ПУСТАЯ (без шкафа), тот же ракурс что сравниваете.
 * Куда: Chrome IKEA → F12 Console → вставить целиком → JSON в чат (copy уже в буфере).
 *
 * Нужно: cone / falloff / light UBO / exposure в шейдере / soft viewport на empty.
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

  function vec(v) {
    if (v == null) return null;
    if (typeof v === 'object' && (v.x != null || v._x != null)) {
      return { x: num(v.x ?? v._x), y: num(v.y ?? v._y), z: num(v.z ?? v._z) };
    }
    if (typeof v?.asArray === 'function') {
      const a = v.asArray();
      return { x: num(a[0]), y: num(a[1]), z: num(a[2]) };
    }
    return null;
  }

  function snip(src, re, pad = 280) {
    if (!src || typeof src !== 'string') return null;
    const m = src.match(re);
    if (!m || m.index == null) return null;
    const i = m.index;
    return src.slice(Math.max(0, i - 80), Math.min(src.length, i + pad));
  }

  function grabCompiled(mat) {
    const out = { keys: [], snips: {} };
    try {
      out.keys = Object.getOwnPropertyNames(mat).filter((k) =>
        /shader|gl|compiled|fragment|vertex|effect/i.test(k)
      ).slice(0, 40);
    } catch {}
    const blobs = [];
    const tryPush = (x, tag) => {
      if (typeof x === 'string' && x.length > 200) blobs.push({ tag, len: x.length, text: x });
    };
    tryPush(mat._fragmentSource || mat.fragmentSource, 'fragSrc');
    tryPush(mat._vertexSource || mat.vertexSource, 'vertSrc');
    try {
      const fx = mat._drawWrapper || mat._effect || mat.effect;
      if (fx) {
        tryPush(fx._fragmentSource || fx.fragmentSource, 'fxFrag');
        tryPush(fx._vertexSource || fx.vertexSource, 'fxVert');
        const compiled = fx._compiledShaders || fx._shaders || fx.shaders;
        if (compiled) {
          const arr = Array.isArray(compiled) ? compiled : [compiled];
          arr.forEach((s, i) => {
            tryPush(s?.fragment || s?._fragment || s, 'compiled' + i);
          });
        }
      }
    } catch {}
    // WebGL program cache on engine
    try {
      const engine = mat.getEngine?.() || mat._engine;
      const cache = engine?._compiledEffects || engine?._compiledShaders;
      out.engineCacheType = cache ? typeof cache : null;
    } catch {}
    const patterns = {
      spot: /spot|SPOT|cone|innerAngle|outerAngle|cosAngle/i,
      falloff: /inv.?square|distance.?atten|range.?atten|decay|candela|lumen/i,
      soft: /soft.?shadow|blurred.?height|ENABLE_SOFT/i,
      exposure: /exposure|tonemap|betraktaOutput/i,
      env: /environment|ibl|irradiance|specular.?env/i,
    };
    const longest = blobs.sort((a, b) => b.len - a.len)[0];
    out.blobTag = longest?.tag || null;
    out.blobLen = longest?.len || 0;
    if (longest?.text) {
      for (const [k, re] of Object.entries(patterns)) {
        out.snips[k] = snip(longest.text, re, 420);
      }
      const defs = longest.text.match(/#define [A-Z0-9_]+[^\n]*/g);
      out.defines = (defs || []).filter((d) =>
        /SOFT|SPOT|DIR|LIGHT|EXPOSURE|SHADOW|ENV|OCCLU/i.test(d)
      ).slice(0, 40);
    }
    return out;
  }

  function lightFields(L) {
    if (!L) return null;
    const o = { class: L.constructor?.name };
    const keys = [
      'intensity', '_intensity', 'intensityMode', '_intensity_mode',
      'range', '_range', 'radius', '_radius',
      'innerAngle', '_inner_angle', 'outerAngle', '_outer_angle',
      'inner_cone_angle', 'outer_cone_angle',
      'angle', '_angle', 'penumbra',
      'decay', '_decay', 'exponent',
      'enableShadows', '_enable_shadows',
    ];
    for (const k of keys) {
      try {
        if (L[k] != null) o[k] = typeof L[k] === 'object' ? vec(L[k]) : L[k];
      } catch {}
    }
    try { o.get_intensity_candela = L.get_intensity_candela?.(); } catch {}
    try { o.get_intensity_lumen = L.get_intensity_lumen?.(); } catch {}
    try { o.pos = vec(L.position || L._position || L.get_position?.()); } catch {}
    try { o.dir = vec(L.direction || L._direction || L.get_direction?.()); } catch {}
    try { o.target = vec(L.target || L._target); } catch {}
    try {
      const sh = L.get_shadow?.() || L.shadow || L._shadow;
      o.shadow = sh
        ? {
            class: sh.constructor?.name,
            near: num(sh.near || sh._near),
            far: num(sh.far || sh._far),
            mapSize: num(sh.mapSize || sh._map_size || sh.resolution),
            enabled: sh.enabled ?? sh._enabled ?? L.enableShadows,
          }
        : null;
    } catch {}
    return o;
  }

  const core = findCore();
  if (!core?.betraktaViewer) {
    const err = { err: 'no betraktaViewer — empty PAX, свой Chrome' };
    console.error(err);
    return err;
  }
  const bv = core.betraktaViewer;
  const lm = bv._light_manager || bv.light_manager;
  const lightsApi = core.lights;
  const rs = lightsApi?.renderSettings || lm?._render_settings;

  let punctual = [];
  try {
    punctual = lm?.get_punctual_lights?.() || lm?.lights || [];
    if (!Array.isArray(punctual)) punctual = [...(punctual || [])];
  } catch {}

  const ssr = lm?._soft_shadow_renderer;
  let soft = null;
  try {
    const hm =
      (typeof ssr?.get_blurred_heightmap === 'function' && ssr.get_blurred_heightmap()) ||
      ssr?.texture ||
      null;
    soft = {
      intensity: ssr?._intensity ?? ssr?.intensity,
      resolution: ssr?._resolution ?? ssr?.resolution,
      center: vec(ssr?._tracked_center_position || ssr?.center),
      size: vec(ssr?._tracked_size || ssr?.size),
      refH: ssr?._reference_height ?? ssr?.reference_height,
      renderMask: ssr?._render_layer_mask?.bitmap ?? ssr?._render_layer_mask,
      blockMask: ssr?._block_layer_mask?.bitmap ?? ssr?._block_layer_mask,
      heightmap: hm
        ? {
            class: hm.constructor?.name,
            w: hm.getSize?.()?.width ?? hm.width ?? hm._width,
            h: hm.getSize?.()?.height ?? hm.height ?? hm._height,
          }
        : null,
      viewport:
        ssr?._blurred_heightmap_viewport ||
        ssr?.blurredHeightmapViewport ||
        null,
    };
  } catch (e) {
    soft = { err: e.message };
  }

  const scene = bv.scene || bv._scene;
  const list = scene?.meshes || scene?.getActiveMeshes?.()?.data || [];
  const arr = Array.isArray(list) ? list : [...(list || [])];
  const walls = [];
  let wallShader = null;
  for (const mesh of arr) {
    const name = String(mesh.name || '');
    const mat = mesh.material || mesh._material;
    const matName = String(mat?.name || mat?.id || '');
    const low = (name + ' ' + matName).toLowerCase();
    if (!/paint|wall|floor|herring|ceiling/i.test(low)) continue;
    if (/dimension|gizmo|ui_|label|viewerui/i.test(low)) continue;
    const row = {
      mesh: name.slice(0, 80),
      mat: matName.slice(0, 80),
      class: mat?.constructor?.name,
      receiveShadows: mesh.receiveShadows ?? mesh._receiveShadows,
      layerMask: mesh.layerMask ?? mesh._layerMask ?? null,
      occ: mat?._occlusion_strength ?? null,
      rough: mat?._roughness ?? mat?.roughness ?? null,
    };
    walls.push(row);
    if (!wallShader && /paint_30x30|wall/i.test(low) && mat) {
      wallShader = grabCompiled(mat);
      row.shaderGrab = true;
    }
    if (walls.length >= 12) break;
  }

  let cam = null;
  try {
    const c = bv.camera || bv._camera || core.camera;
    cam = {
      fov: num(c?.fov ?? c?._fov),
      fovIsRad: true,
      pos: vec(c?.position || c?._position),
      target: vec(c?.target || c?._target),
      exposure: num(
        bv.get_camera_exposure_linear?.() ??
          bv._camera_exposure_linear ??
          c?.exposure
      ),
    };
  } catch {}

  let env = null;
  try {
    const e = lm?.environment || lm?._environment || rs?.environment;
    env = {
      intensity: num(e?.intensity ?? e?._intensity),
      rotation: num(e?.rotation ?? e?._rotation),
      url: e?.url || e?._url || rs?.environment?.url,
    };
  } catch {}

  const out = {
    ok: true,
    purpose: 'empty-spot-wash',
    when: new Date().toISOString(),
    punctualCount: punctual.length,
    punctual: punctual.slice(0, 4).map(lightFields),
    settingsSpot: rs?.mainLight || rs?.spotLight || rs?.lights?.[0] || null,
    soft,
    env,
    camera: cam,
    post: {
      exposure: num(bv.get_camera_exposure_linear?.()),
      ipcTonemap: rs?.imageProcessing?.toneMappingEnabled ?? rs?.toneMappingEnabled,
    },
    walls,
    wallShader,
  };

  const s = JSON.stringify(out, null, 2);
  console.log(s);
  try {
    copy(s);
    console.log('%c→ в буфере — вставьте в чат', 'color:#0a0;font-weight:bold');
  } catch {}
  window.__cldIkeaEmptySpotWash = out;
  return out;
})();
