/**
 * IKEA PAX — вытащить ТОЛЬКО пробелы (вставить целиком в Console).
 *
 * Нужно: Spot candela/lumen/intensityMode, SoftShadow blur.scale,
 * exposure/LUT, live-список ламп (доказательство без Hemi).
 *
 * Как: открыть планировщик → поставить белый шкаф → F12 → Console →
 * вставить весь файл → Enter → в буфере JSON → прислать в чат.
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
    if (v == null || typeof v !== 'object') return null;
    if (v.x != null || v._x != null) {
      return {
        x: num(v.x ?? v._x),
        y: num(v.y ?? v._y),
        z: num(v.z ?? v._z),
      };
    }
    if (typeof v.asArray === 'function') {
      const a = v.asArray();
      return { x: num(a[0]), y: num(a[1]), z: num(a[2]) };
    }
    return null;
  }

  function call(obj, names) {
    for (const n of names) {
      try {
        const fn = obj?.[n];
        if (typeof fn === 'function') return fn.call(obj);
      } catch {}
    }
    return undefined;
  }

  function pickNums(obj, keys) {
    const o = {};
    if (!obj) return o;
    for (const k of keys) {
      try {
        const v = obj[k];
        if (typeof v === 'number' && Number.isFinite(v)) o[k] = v;
        else if (typeof v === 'boolean' || typeof v === 'string') o[k] = v;
      } catch {}
    }
    return o;
  }

  /** Рекурсивно ищем scale/blur/sigma на blur-эффекте SoftShadow. */
  function digBlurDeep(root, maxDepth = 4) {
    const hits = [];
    const seen = new Set();
    function walk(node, path, depth) {
      if (!node || typeof node !== 'object' || depth > maxDepth) return;
      if (seen.has(node)) return;
      seen.add(node);
      let keys = [];
      try {
        keys = Object.getOwnPropertyNames(node);
      } catch {
        return;
      }
      for (const k of keys) {
        if (keys.length > 80 && !/blur|scale|sigma|radius|kernel|weight|sample|uniform|option/i.test(k)) {
          continue;
        }
        let v;
        try {
          v = node[k];
        } catch {
          continue;
        }
        const p = path ? path + '.' + k : k;
        if (typeof v === 'number' && Number.isFinite(v)) {
          if (/scale|sigma|radius|blur|kernel|weight|intensity|sample/i.test(k) || /scale|sigma|blur/i.test(p)) {
            hits.push({ path: p, value: v });
          }
        } else if (v && typeof v === 'object' && 'value' in v) {
          const vv = v.value;
          if (typeof vv === 'number' && Number.isFinite(vv) && /scale|sigma|radius|blur|kernel|weight/i.test(k)) {
            hits.push({ path: p + '.value', value: vv });
          }
        } else if (v && typeof v === 'object' && typeof v !== 'function') {
          if (/uniform|effect|blur|option|param|wrapper/i.test(k) || depth < 2) {
            walk(v, p, depth + 1);
          }
        }
      }
      try {
        const proto = Object.getPrototypeOf(node);
        if (proto && proto !== Object.prototype) {
          for (const n of Object.getOwnPropertyNames(proto)) {
            if (!/^(get|set)?[A-Z_]?.*(scale|blur|sigma|radius|kernel)/i.test(n) && !/scale|blur|sigma/i.test(n)) {
              continue;
            }
            try {
              const g = node[n];
              if (typeof g === 'number' && Number.isFinite(g)) hits.push({ path: path + '.' + n, value: g });
              else if (typeof g === 'function' && /^get/i.test(n)) {
                const r = g.call(node);
                if (typeof r === 'number' && Number.isFinite(r)) hits.push({ path: path + '.' + n + '()', value: r });
              }
            } catch {}
          }
        }
      } catch {}
    }
    walk(root, 'blur', 0);
    return hits.slice(0, 60);
  }

  const core = findCore();
  if (!core) {
    const err = { ok: false, err: 'no core — откройте PAX, поставьте белый шкаф, повторите' };
    console.error(err);
    return err;
  }

  const bv = core.betraktaViewer;
  const lm = bv._light_manager || bv.light_manager;
  const scene = bv.scene || bv._scene;
  const rs = core.lights?.renderSettings || bv.renderSettings || null;

  // --- 1) Live lights (доказательство: только Spot) ---
  let liveLights = [];
  try {
    const punctual = lm?.get_punctual_lights?.() || lm?._punctual_lights || [];
    liveLights = (punctual || []).map((L, i) => ({
      i,
      class: L?.constructor?.name,
      name: L?.name || L?.id,
      intensity: num(L?.intensity ?? L?._intensity),
      intensityMode: L?.intensityMode ?? L?._intensityMode,
      range: num(L?.range ?? L?._range),
      radius: num(L?.radius ?? L?._radius),
      angle: num(L?.angle ?? L?._angle),
      innerAngle: num(L?.innerAngle ?? L?._innerAngle),
      outerAngle: num(L?.outerAngle ?? L?._outerAngle),
      position: vec(L?.position ?? L?._position),
      direction: vec(L?.direction ?? L?._direction ?? call(L, ['getDirection', 'direction'])),
      falloffType: L?.falloffType ?? L?._falloffType,
      diffuse: vec(L?.diffuse),
    }));
  } catch (e) {
    liveLights = [{ err: e.message }];
  }

  // scene lights (на случай если punctual пуст, а в scene есть)
  let sceneLights = [];
  try {
    const arr = scene?.lights || scene?._lights || [];
    sceneLights = arr.map((L) => ({
      class: L?.constructor?.name,
      name: L?.name,
      intensity: num(L?.intensity),
      intensityMode: L?.intensityMode,
    }));
  } catch {}

  // --- 2) Spot physical units ---
  const spot = liveLights[0] ? (lm?.get_punctual_lights?.()?.[0] || null) : null;
  let spotPhysical = null;
  try {
    const L = spot || lm?.get_punctual_lights?.()?.[0];
    spotPhysical = {
      raw: num(L?.intensity ?? L?._intensity),
      intensityMode: L?.intensityMode ?? L?._intensityMode,
      getScaledIntensity: num(call(L, ['getScaledIntensity'])),
      lumen: num(call(L, ['get_intensity_lumen', 'getIntensityLumen'])),
      candela: num(call(L, ['get_intensity_candela', 'getIntensityCandela'])),
      illuminance: num(call(L, ['get_intensity_illuminance', 'getIntensityIlluminance'])),
      methods: Object.getOwnPropertyNames(Object.getPrototypeOf(L) || {}).filter((n) =>
        /intensity|lumen|candela|illuminance|photometric|falloff|scaled/i.test(n)
      ),
      shadowMinZ: num(L?.shadowMinZ ?? L?._shadowMinZ),
      shadowMaxZ: num(L?.shadowMaxZ ?? L?._shadowMaxZ),
      shadowMapSize: L?.getShadowGenerator?.()?.getShadowMap?.()?.getSize?.() || null,
    };
  } catch (e) {
    spotPhysical = { err: e.message };
  }

  // --- 3) SoftShadow + blur.scale ---
  const ssr = lm?._soft_shadow_renderer || lm?.soft_shadow_renderer;
  const blur = ssr?._blur_effect || ssr?.blur_effect || ssr?._blur;
  let soft = null;
  try {
    soft = {
      ...pickNums(ssr, [
        'intensity',
        '_intensity',
        'resolution',
        '_resolution',
        'enabled',
        '_enabled',
      ]),
      size: vec(ssr?.size ?? ssr?._size),
      center: vec(ssr?.center ?? ssr?._center),
      direction: vec(ssr?.direction ?? ssr?._direction),
      blurClass: blur?.constructor?.name,
      blurHits: digBlurDeep(blur),
      blurOwnKeys: blur ? Object.getOwnPropertyNames(blur).slice(0, 60) : null,
      softOwnKeys: ssr ? Object.getOwnPropertyNames(ssr).slice(0, 60) : null,
    };
  } catch (e) {
    soft = { err: e.message };
  }

  // --- 4) Env live ---
  let env = null;
  try {
    const em = rs?.environmentMap || {};
    const tex = scene?.environmentTexture || scene?._environmentTexture;
    env = {
      fromSettings: {
        url: em.url || em._url,
        intensity: num(em.intensity ?? em._intensity),
        rotation: num(em.rotation ?? em._rotation),
        localMode: em.localMode || em._localMode || null,
      },
      sceneTexture: tex
        ? {
            class: tex.constructor?.name,
            url: tex.url || tex._url || tex.name,
            level: num(tex.level),
            rotationY: num(tex.rotationY ?? tex._rotationY),
          }
        : null,
      imageProcessingEnv:
        num(scene?.imageProcessingConfiguration?.exposure) != null
          ? pickNums(scene.imageProcessingConfiguration, [
              'exposure',
              'contrast',
              'toneMappingEnabled',
              'toneMappingType',
              'vignetteEnabled',
            ])
          : null,
    };
  } catch (e) {
    env = { err: e.message };
  }

  // --- 5) Exposure / pipeline / LUT ---
  let post = null;
  try {
    const ipc = scene?.imageProcessingConfiguration;
    const cam = bv.camera || bv._camera || core.camera;
    const lut = bv.get_lut_effect?.() || bv._lut_effect || bv.lut_effect;
    const pipe =
      bv.defaultPipeline ||
      bv._defaultPipeline ||
      scene?.postProcessRenderPipelineManager?._renderPipelines?.[0];
    post = {
      imageProcessing: ipc
        ? pickNums(ipc, [
            'exposure',
            'contrast',
            'toneMappingEnabled',
            'toneMappingType',
            'colorCurvesEnabled',
            'vignetteEnabled',
          ])
        : null,
      cameraExposure: num(cam?.exposure ?? cam?._exposure ?? bv.exposure),
      cameraFov: num(cam?.fov ?? cam?._fov),
      lut: lut
        ? {
            class: lut.constructor?.name,
            intensity: num(lut.intensity ?? lut._intensity),
            url: lut._url || lut.url || lut._lut_texture?.url,
            keys: Object.getOwnPropertyNames(lut).slice(0, 30),
          }
        : null,
      pipelineClass: pipe?.constructor?.name || null,
      renderSettingsDay: rs
        ? {
            ceilingLight: rs.ceilingLight || null,
            floorLight: rs.floorLight || null,
            ambient: rs.ambient || rs.ambientColor || null,
            directionalLight: rs.directionalLight || null,
            spotLight: rs.spotLight || null,
            lineLight: rs.lineLight || null,
          }
        : null,
      note: 'ceiling/floor в settings ≠ live lights; смотри liveLights',
    };
  } catch (e) {
    post = { err: e.message };
  }

  // --- 6) Follow Spot ↔ Soft ---
  let follow = null;
  try {
    const L = lm?.get_punctual_lights?.()?.[0];
    const sp = vec(L?.position);
    const sc = soft?.center;
    follow = {
      spotPos: sp,
      softCenter: sc,
      deltaXZ:
        sp && sc
          ? { x: +(sp.x - sc.x).toFixed(5), z: +(sp.z - sc.z).toFixed(5) }
          : null,
    };
  } catch {}

  const out = {
    ok: true,
    when: new Date().toISOString(),
    purpose: 'gaps: spotPhysical, soft.blurHits(scale), post.exposure/lut, liveLights',
    liveLights,
    sceneLights,
    spotPhysical,
    soft,
    env,
    post,
    follow,
  };

  const s = JSON.stringify(out, null, 2);
  console.log(s);
  try {
    copy(s);
    console.log('%c→ скопировано — вставьте JSON в чат', 'color:#0a0;font-weight:bold');
  } catch {
    console.log('%ccopy() недоступен — скопируйте JSON из лога', 'color:#a60');
  }
  return out;
})();
