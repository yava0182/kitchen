# IKEA dump — добить пробелы (вставить целиком)

```js
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
    while (q.length && n < 12000) {
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
    if (v == null || d > 3) return v == null ? v : typeof v;
    if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') return v;
    if (typeof v === 'function') return '[fn]';
    if (v.x != null && v.y != null) return { x: +v.x, y: +v.y, z: v.z != null ? +v.z : undefined };
    if (Array.isArray(v)) return v.slice(0, 20).map((x) => ser(x, d + 1));
    if (typeof v === 'object') {
      const o = { _c: v.constructor?.name };
      for (const k of Object.getOwnPropertyNames(v).slice(0, 40)) {
        try {
          const x = v[k];
          const t = typeof x;
          if (t === 'number' || t === 'boolean' || t === 'string') o[k] = x;
          else if (x && t === 'object' && x.x != null) o[k] = ser(x, d + 1);
          else if (t === 'function') o[k] = '[fn]';
        } catch {}
      }
      return o;
    }
    return String(v);
  }

  function digUniforms(effect) {
    if (!effect) return null;
    const out = { class: effect.constructor?.name };
    const cands = [
      effect._uniforms,
      effect.uniforms,
      effect._effectWrapper?._uniforms,
      effect._effectWrapper?.uniforms,
      effect.getEffect?.()?.getUniformNames?.(),
      effect._drawWrapper,
    ];
    for (let i = 0; i < cands.length; i++) {
      const u = cands[i];
      if (!u) continue;
      try {
        if (Array.isArray(u)) out['u' + i] = u.slice(0, 80);
        else if (typeof u === 'object') out['u' + i] = Object.keys(u).slice(0, 80);
      } catch {}
    }
    // prototype methods that look like blur params
    try {
      const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(effect) || {});
      out.proto = proto.filter((n) => /blur|radius|sigma|kernel|weight|size|sample/i.test(n));
    } catch {}
    return out;
  }

  const core = findCore();
  if (!core) return { err: 'no core' };
  const bv = core.betraktaViewer;
  const lm = bv._light_manager || bv.light_manager;
  const ssr = lm?._soft_shadow_renderer;
  const blur = ssr?._blur_effect;
  const lut = bv.get_lut_effect?.() || bv._lut_effect || bv.lut_effect;

  // --- materials: все меши, не только UI ---
  const mats = [];
  try {
    const scene = bv.scene || bv._scene;
    const meshes = scene?.meshes || scene?._meshes || [];
    for (const mesh of meshes) {
      const name = String(mesh.name || mesh.id || '');
      const m = mesh.material || mesh._material;
      if (!m) continue;
      const matName = String(m.name || m.id || m.constructor?.name || '');
      const low = (name + ' ' + matName).toLowerCase();
      // skip obvious UI
      if (/dimension|measure|gizmo|helper|ui_|label/.test(low)) continue;
      const entry = {
        mesh: name.slice(0, 80),
        mat: matName.slice(0, 80),
        matClass: m.constructor?.name,
        receiveShadows: mesh.receiveShadows ?? mesh._receiveShadows,
        castShadows: mesh.castShadows ?? mesh._castShadows,
        layerMask: mesh.layerMask ?? mesh._layerMask,
      };
      // try common Betrakta / Babylon PBR fields
      const fields = [
        'albedoColor', 'baseColor', '_albedoColor', '_baseColor',
        'albedoTexture', 'baseTexture',
        'roughness', '_roughness', 'metallic', '_metallic', 'metalness',
        'reflectivityColor', 'microSurface', '_microSurface',
        'clearCoat', 'clearcoat', 'environmentIntensity', '_environmentIntensity',
        'alpha', 'transparencyMode',
      ];
      for (const f of fields) {
        try {
          const v = m[f];
          if (v == null) continue;
          if (typeof v === 'object' && v.r != null)
            entry[f] = { r: v.r, g: v.g, b: v.b, a: v.a };
          else if (typeof v === 'object' && v.name)
            entry[f] = { tex: String(v.name || v.url || '').slice(0, 80) };
          else if (typeof v !== 'object') entry[f] = v;
        } catch {}
      }
      // internal material params bag
      try {
        const bag = m._material_parameters || m.materialParameters || m._params;
        if (bag && typeof bag === 'object') entry.paramsKeys = Object.keys(bag).slice(0, 40);
      } catch {}
      mats.push(entry);
      if (mats.length >= 40) break;
    }
  } catch (e) {
    mats.push({ err: e.message });
  }

  // wall / floor by room materials settings urls
  let roomMats = null;
  try {
    roomMats = core.lights?.renderSettings?.roomMaterials || null;
  } catch {}

  // LUT url
  let lutDump = null;
  try {
    lutDump = {
      class: lut?.constructor?.name,
      keys: lut ? Object.getOwnPropertyNames(lut).slice(0, 40) : null,
      url: lut?._url || lut?.url || lut?._lut_texture?.url || lut?._lut_texture?._url,
      intensity: lut?.intensity ?? lut?._intensity,
    };
  } catch (e) {
    lutDump = { err: e.message };
  }

  // exposure / camera
  let cam = null;
  try {
    const c = core.camera || bv.camera || bv._camera;
    cam = {
      class: c?.constructor?.name,
      exposure: c?.exposure ?? c?._exposure ?? bv.exposure,
      fov: c?.fov ?? c?._fov,
      minZ: c?.minZ ?? c?._minZ,
      maxZ: c?.maxZ ?? c?._maxZ,
    };
  } catch {}

  // Spot intensity physical
  const spot = lm?.get_punctual_lights?.()?.[0];
  let intensity = null;
  try {
    intensity = {
      raw: spot?.intensity ?? spot?._intensity,
      lumen: spot?.get_intensity_lumen?.() ?? spot?._intensity_lumen,
      candela: spot?.get_intensity_candela?.() ?? spot?._intensity_candela,
      methods: Object.getOwnPropertyNames(Object.getPrototypeOf(spot) || {}).filter((n) =>
        /intensity|lumen|candela/i.test(n)
      ),
    };
  } catch (e) {
    intensity = { err: e.message };
  }

  // SoftShadow blur dig
  const blurDeep = digUniforms(blur);
  let blurMore = null;
  try {
    const ew = blur?._effectWrapper || blur;
    blurMore = {
      samples: blur?._samples ?? blur?.samples,
      texelSize: blur?._texelSize,
      scaleRatio: blur?._scaleRatio,
      effectKeys: ew ? Object.getOwnPropertyNames(ew).slice(0, 50) : null,
      // sometimes weights live on thin engine post process
      options: ser(blur?.options || blur?._options || blur?._blur_parameters),
    };
  } catch (e) {
    blurMore = { err: e.message };
  }

  // wall receive: find meshes with wall in name OR room root
  const wallRecv = mats
    .filter((m) => /wall|floor|ceil|skirt|room|pax|frame|side|door|shelf|drawer|back/i.test(m.mesh + m.mat))
    .slice(0, 25);

  const out = {
    ok: true,
    blurUniforms: blurDeep,
    blurMore,
    lut: lutDump,
    camera: cam,
    intensity,
    roomMaterialsSettings: roomMats,
    materialsInteresting: wallRecv,
    materialsAllCount: mats.length,
    materialsAllHead: mats.slice(0, 15),
  };

  const s = JSON.stringify(out, null, 2);
  console.log(s);
  try {
    copy(s);
    console.log('→ в буфер');
  } catch {}
  return out;
})();
```
