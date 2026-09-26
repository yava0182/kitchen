# IKEA — дожим пробелов (вставить в консоль Chrome на странице PAX)

**Когда:** открыт планировщик, **стоит белый шкаф** (как на эталонном кадре).  
**Как:** F12 → Console → вставить весь блок ниже → Enter.  
В конце должно быть `→ скопировано`. Пришлите сюда весь JSON (или файл).

Нужно для наших пунктов: сила лампы, мягкость тени на полу, env, экспозиция.

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
    while (q.length && n < 20000) {
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
    if (!v || typeof v !== 'object') return null;
    if (v.x != null) return { x: num(v.x), y: num(v.y), z: num(v.z) };
    if (typeof v.asArray === 'function') {
      const a = v.asArray();
      return { x: num(a[0]), y: num(a[1]), z: num(a[2]) };
    }
    return null;
  }

  function digEffectUniforms(effect) {
    if (!effect) return null;
    const out = { class: effect.constructor?.name, found: {} };
    const bags = [
      effect._uniforms,
      effect.uniforms,
      effect._effectWrapper?._uniforms,
      effect._effectWrapper?.uniforms,
      effect._drawWrapper?._uniforms,
      effect._drawWrapper?.uniforms,
    ];
    for (const bag of bags) {
      if (!bag || typeof bag !== 'object') continue;
      const keys = Object.keys(bag);
      for (const k of keys) {
        try {
          let val = bag[k];
          if (val && typeof val === 'object' && 'value' in val) val = val.value;
          if (typeof val === 'number' || typeof val === 'boolean' || typeof val === 'string') {
            out.found[k] = val;
          } else if (val && val.x != null) {
            out.found[k] = vec(val);
          }
        } catch {}
      }
    }
    // прямые поля scale / direction часто на самом эффекте
    for (const k of ['scale', '_scale', 'direction', '_direction', 'intensity', '_intensity', 'radius', '_radius']) {
      try {
        const v = effect[k];
        if (v != null && out.found[k] == null) {
          if (typeof v === 'number' || typeof v === 'boolean') out.found[k] = v;
          else if (v?.x != null) out.found[k] = vec(v);
        }
      } catch {}
    }
    try {
      out.proto = Object.getOwnPropertyNames(Object.getPrototypeOf(effect) || {}).filter((n) =>
        /blur|scale|radius|sigma|kernel|uniform|intensity|sample/i.test(n)
      );
    } catch {}
    return out;
  }

  function readTrackedColor(mat) {
    const o = {};
    const tryKeys = [
      '_base_color_factor_srgb',
      'base_color_factor_srgb',
      '_baseColor',
      'baseColor',
      'albedoColor',
    ];
    for (const k of tryKeys) {
      try {
        const v = mat[k];
        if (!v) continue;
        if (v.r != null) o[k] = { r: +v.r, g: +v.g, b: +v.b };
        else if (typeof v.getClassName === 'function' || v._x != null) {
          o[k] = {
            x: num(v.x ?? v._x),
            y: num(v.y ?? v._y),
            z: num(v.z ?? v._z),
            w: num(v.w ?? v._w),
          };
        }
      } catch {}
    }
    return o;
  }

  const core = findCore();
  if (!core) {
    const err = { err: 'no core — откройте PAX planner, поставьте шкаф, повторите' };
    console.error(err);
    return err;
  }

  const bv = core.betraktaViewer;
  const lm = bv._light_manager || bv.light_manager;
  const lightsApi = core.lights;
  const rs = lightsApi?.renderSettings || lightsApi?._render_settings || null;
  const ssr = lm?._soft_shadow_renderer || lm?.soft_shadow_renderer;
  const spot = lm?.get_punctual_lights?.()?.[0] || null;
  const punctual = lm?.get_punctual_lights?.() || [];

  // --- 1) Env ---
  let env = null;
  try {
    const em =
      rs?.environmentMap ||
      bv.environment ||
      bv._environment ||
      lm?.environment ||
      null;
    env = {
      fromSettings: rs?.environmentMap
        ? {
            url: rs.environmentMap.url,
            intensity: rs.environmentMap.intensity,
            rotation: rs.environmentMap.rotation,
            localMode: rs.environmentMap.localMode,
          }
        : null,
      live: em
        ? {
            class: em.constructor?.name,
            intensity: em.intensity ?? em._intensity,
            rotation: em.rotation ?? em._rotation,
            url: em.url ?? em._url ?? em.name,
            keys: Object.getOwnPropertyNames(em).slice(0, 40),
          }
        : null,
      sceneEnvIntensity: bv.scene?.environmentIntensity ?? bv._scene?.environmentIntensity,
    };
  } catch (e) {
    env = { err: e.message };
  }

  // --- 2) Spot / punctual ---
  let spotDump = null;
  try {
    spotDump = {
      count: punctual.length,
      names: punctual.map((p) => p?.constructor?.name),
      intensity_raw: spot?.intensity ?? spot?._intensity,
      intensity_lumen: (() => {
        try {
          return spot?.get_intensity_lumen?.();
        } catch {
          return null;
        }
      })(),
      intensity_candela: (() => {
        try {
          return spot?.get_intensity_candela?.();
        } catch {
          return null;
        }
      })(),
      cct: spot?.colorTemperature ?? spot?._color_temperature ?? spot?.cct,
      position: vec(spot?.position || spot?._position),
      direction: vec(spot?.direction || spot?._direction),
      inner: spot?.innerAngle ?? spot?._inner_angle,
      outer: spot?.outerAngle ?? spot?._outer_angle,
      enableShadows: spot?.enableShadows ?? spot?._enable_shadows,
      shadowNear: spot?.shadowNear ?? spot?._shadow_near ?? spot?.get_shadow?.()?.near,
      shadowFar: spot?.shadowFar ?? spot?._shadow_far ?? spot?.get_shadow?.()?.far,
      shadowRes: spot?.shadowResolution ?? spot?._shadow_resolution,
      mainLightCenter: vec(
        lm?.mainLightCenterPosition ||
          lm?._main_light_center ||
          lm?.get_main_light_center?.()
      ),
      settingsMain: rs?.mainLight || rs?.spotLight || null,
      settingsDir: rs?.directionalLight || null,
      settingsAmbient: rs?.ambient || null,
      settingsCeiling: rs?.ceilingLight || null,
      settingsFloor: rs?.floorLight || null,
    };
  } catch (e) {
    spotDump = { err: e.message };
  }

  // --- 3) SoftShadow ---
  let soft = null;
  try {
    soft = {
      class: ssr?.constructor?.name,
      intensity: ssr?.intensity ?? ssr?._intensity,
      resolution: ssr?.resolution ?? ssr?._resolution,
      center: vec(ssr?.center || ssr?._center || ssr?._tracked_center_position),
      size: vec(ssr?.size || ssr?._size || ssr?._tracked_size),
      keys: ssr ? Object.getOwnPropertyNames(ssr).slice(0, 60) : null,
      blur: digEffectUniforms(ssr?._blur_effect || ssr?.blur_effect),
      depthTransfer: digEffectUniforms(ssr?._transfer_depth_effect || ssr?._depth_transfer),
      generatePlane: digEffectUniforms(
        ssr?._generate_shadow_plane_texture_effect || ssr?._generate_plane
      ),
      methods: ssr
        ? Object.getOwnPropertyNames(Object.getPrototypeOf(ssr) || {}).filter((n) =>
            /blur|shadow|height|plane|update|center|size/i.test(n)
          )
        : null,
    };
  } catch (e) {
    soft = { err: e.message };
  }

  // --- 4) Exposure / tonemap / LUT ---
  let post = null;
  try {
    const lut = bv.get_lut_effect?.() || bv._lut_effect;
    post = {
      exposure:
        bv.exposure ??
        bv._exposure ??
        lightsApi?.exposure ??
        rs?.exposure ??
        core.camera?.exposure,
      toneMappingEnabled: bv.toneMappingEnabled ?? bv._tone_mapping_enabled,
      useHdr: bv.use_hdr_framebuffer ?? rs?.use_hdr_framebuffer,
      contrast: rs?.contrast ?? bv.contrast,
      lut: lut
        ? {
            class: lut.constructor?.name,
            intensity: lut.intensity ?? lut._intensity,
            url: lut.url ?? lut._url ?? lut._lut_texture?.url ?? lut._lut_texture?._url,
            keys: Object.getOwnPropertyNames(lut).slice(0, 40),
          }
        : null,
      ssao: rs?.temporalEffects?.screenSpaceAmbientOcclusion ?? rs?.screenSpaceAmbientOcclusion,
      temporal: rs?.temporalEffects || null,
    };
  } catch (e) {
    post = { err: e.message };
  }

  // --- 5) Материалы: стена / пол / белый корпус + receiveShadows ---
  const mats = [];
  try {
    const scene = bv.scene || bv._scene;
    const list = scene?.meshes || scene?.getActiveMeshes?.()?.data || [];
    const arr = Array.isArray(list) ? list : [...(list || [])];
    for (const mesh of arr) {
      const m = mesh.material || mesh._material;
      if (!m) continue;
      const name = String(mesh.name || '');
      const matName = String(m.name || m.id || '');
      const low = (name + ' ' + matName).toLowerCase();
      if (!/paint|wall|floor|010_white|white|herring|pax|backside|corpus|cabinet|frame/i.test(low))
        continue;
      if (/dimension|measure|gizmo|ui_|label|viewerui/i.test(low)) continue;
      mats.push({
        mesh: name.slice(0, 100),
        mat: matName.slice(0, 100),
        matClass: m.constructor?.name,
        receiveShadows: mesh.receiveShadows ?? mesh._receiveShadows,
        castShadows: mesh.castShadows ?? mesh._castShadows,
        roughness: m.roughness ?? m._roughness,
        metallic: m.metallic ?? m._metallic ?? m.metalness,
        envIntensity: m.environmentIntensity ?? m._environmentIntensity,
        colors: readTrackedColor(m),
      });
      if (mats.length >= 30) break;
    }
  } catch (e) {
    mats.push({ err: e.message });
  }

  // --- delta Spot.xz vs Soft center ---
  let follow = null;
  try {
    const sp = spotDump?.position;
    const sc = soft?.center;
    follow = {
      spotXZ: sp ? { x: sp.x, z: sp.z } : null,
      softXZ: sc ? { x: sc.x, z: sc.z } : null,
      deltaXZ:
        sp && sc
          ? { x: +(sp.x - sc.x).toFixed(5), z: +(sp.z - sc.z).toFixed(5) }
          : null,
    };
  } catch {}

  const out = {
    ok: true,
    when: new Date().toISOString(),
    note: 'Нужно: env, spot intensity, soft.blur.found.scale, post.exposure, mats receiveShadows',
    env,
    spot: spotDump,
    soft,
    post,
    follow,
    materials: mats,
  };

  const s = JSON.stringify(out, null, 2);
  console.log(s);
  try {
    copy(s);
    console.log('%c→ скопировано в буфер — вставьте в чат', 'color:#0a0;font-weight:bold');
  } catch {
    console.log('%ccopy() недоступен — скопируйте JSON из лога вручную', 'color:#a60');
  }
  return out;
})();
```

## Что смотреть в ответе (для нас)

| Поле | Зачем |
|------|--------|
| `env.fromSettings` | url / intensity 0.6 / rotation 80 |
| `spot.intensity_raw` | обычно 115 |
| `soft.blur.found.scale` | мягкость тени на полу |
| `soft.intensity` / `resolution` | SoftShadow |
| `post.exposure` | яркость картинки |
| `materials` → wall/010_White `receiveShadows` | тень на стене или нет |
| `follow.deltaXZ` | лампа и soft в одном центре |

После JSON — правим у нас **по пунктам** (env → лампа → пол → полость).
