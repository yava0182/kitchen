/**
 * IKEA PAX live — окно: рама / створка / ручка / тени / soft.
 * Chrome → ikea.com/.../pax/... , КОМНАТА С ОКВЛЕННЫМ ОКМ (3D готов).
 * F12 → Console → вставить весь скрипт → Enter.
 * JSON уйдёт в буфер + console — пришлите JSON в чат.
 *
 * Нужно понять у IKEA:
 *  - как затенена ручка (цвет / map / occlusion / Simulated_Shadow);
 *  - есть ли перепад Z створки vs наружная рама;
 *  - soft / receiveShadows на окне и стене у проёма.
 */
(async () => {
  function findCore() {
    const rootEl = document.querySelector('#root') || document.body;
    const key = Object.keys(rootEl).find(
      (k) => k.startsWith('__reactContainer') || k.startsWith('__reactFiber')
    );
    let fiber = key ? rootEl[key] : null;
    if (fiber?.stateNode?.current) fiber = fiber.stateNode.current;
    const q = [fiber];
    let n = 0;
    while (q.length && n < 50000) {
      const f = q.shift();
      n++;
      const v = f?.memoizedProps?.value;
      if (v?.betraktaViewer) return v;
      if (f?.child) q.push(f.child);
      if (f?.sibling) q.push(f.sibling);
    }
    return null;
  }

  const num = (v) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : null;
  };

  function rgb(v) {
    if (v == null) return null;
    const r = num(v.r ?? v.x ?? v[0]);
    const g = num(v.g ?? v.y ?? v[1]);
    const b = num(v.b ?? v.z ?? v[2]);
    if (r == null || g == null || b == null) return null;
    return {
      r: +r.toFixed(5),
      g: +g.toFixed(5),
      b: +b.toFixed(5),
      lum: +((r + g + b) / 3).toFixed(5),
    };
  }

  function vec(v) {
    if (!v) return null;
    if (typeof v.asArray === 'function') {
      const a = v.asArray();
      return { x: num(a[0]), y: num(a[1]), z: num(a[2]) };
    }
    return {
      x: num(v.x ?? v._x ?? v[0]),
      y: num(v.y ?? v._y ?? v[1]),
      z: num(v.z ?? v._z ?? v[2]),
    };
  }

  function worldBox(mesh) {
    try {
      const bb = mesh.getBoundingInfo?.()?.boundingBox;
      if (bb) {
        const a = vec(bb.minimumWorld ?? bb.minimum);
        const b = vec(bb.maximumWorld ?? bb.maximum);
        if (a && b && a.x != null)
          return {
            min: a,
            max: b,
            sizeMm: {
              x: Math.round((b.x - a.x) * 1000),
              y: Math.round((b.y - a.y) * 1000),
              z: Math.round((b.z - a.z) * 1000),
            },
          };
      }
    } catch (_) {}
    return null;
  }

  function texInfo(t) {
    if (!t || typeof t !== 'object') return null;
    return {
      name: t.name ?? t._name ?? null,
      url: t.url ?? t._url ?? t.source?.url ?? t._source?.url ?? null,
    };
  }

  function matDump(mat) {
    if (!mat) return null;
    const name = mat.name ?? mat._name ?? null;
    const out = {
      name,
      className: mat.constructor?.name ?? null,
      albedo: rgb(mat.albedoColor ?? mat.albedo ?? mat._albedoColor),
      baseColor: rgb(mat.baseColor ?? mat._baseColor),
      color: rgb(mat.color ?? mat._color),
      roughness: num(mat.roughness ?? mat._roughness ?? mat.metallicRoughness?.roughness),
      metalness: num(mat.metallic ?? mat.metalness ?? mat._metallic),
      opacity: num(mat.alpha ?? mat.opacity ?? mat._alpha),
      occlusionStrength: num(
        mat.occlusionStrength ?? mat._occlusion_strength ?? mat.ambientOcclusionStrength
      ),
      receiveShadows: mat.receiveShadows ?? mat._receiveShadows ?? null,
      albedoTex: texInfo(
        mat.albedoTexture ?? mat.albedo_texture ?? mat._albedoTexture ?? mat.baseColorTexture
      ),
      occlusionTex: texInfo(
        mat.occlusionTexture ??
          mat.occlusion_texture ??
          mat._occlusionTexture ??
          mat.ambientTexture
      ),
      normalTex: texInfo(mat.normalTexture ?? mat.bumpTexture ?? mat._normalTexture),
    };
    // common Betrakta getters
    for (const g of [
      'get_albedo_color',
      'get_roughness',
      'get_metallic',
      'get_occlusion_strength',
      'get_receive_shadows',
    ]) {
      try {
        if (typeof mat[g] === 'function') {
          const v = mat[g]();
          if (g.includes('albedo') || g.includes('color')) out[g] = rgb(v);
          else if (g.includes('shadow')) out[g] = v;
          else out[g] = num(v) ?? v;
        }
      } catch (_) {}
    }
    return out;
  }

  function isWindowish(name) {
    return /window|sash|handle|frame|glass|pane|opening|casement|mullion|sill|ручка|створк|окн|форточ|имитац.*тен|simulated.?shadow/i.test(
      String(name || '')
    );
  }

  function meshRow(mesh) {
    const name = mesh.name ?? mesh._name ?? '';
    const mats = [];
    try {
      const m = mesh.material ?? mesh._material;
      if (Array.isArray(m)) m.forEach((x) => mats.push(matDump(x)));
      else if (m) mats.push(matDump(m));
    } catch (_) {}
    let layerMask = null;
    try {
      layerMask =
        mesh.layerMask ??
        mesh._layerMask ??
        mesh.get_layer_mask?.() ??
        mesh.renderingGroupId ??
        null;
    } catch (_) {}
    return {
      name,
      className: mesh.constructor?.name ?? null,
      enabled: mesh.isEnabled?.() ?? mesh.isEnabled ?? mesh.enabled ?? null,
      visible: mesh.isVisible ?? mesh.visible ?? null,
      receiveShadows: mesh.receiveShadows ?? mesh._receiveShadows ?? null,
      castShadows: mesh.castShadows ?? mesh._castShadows ?? null,
      layerMask,
      worldBox: worldBox(mesh),
      materials: mats.filter(Boolean).slice(0, 6),
    };
  }

  const core = findCore();
  if (!core?.betraktaViewer) {
    console.error('[IKEA window dump] betraktaViewer not found');
    return;
  }
  const viewer = core.betraktaViewer;
  const scene = viewer.scene ?? viewer._scene ?? viewer.get_scene?.();
  const lm =
    viewer.light_manager ??
    viewer.lightManager ??
    viewer._light_manager ??
    scene?.light_manager ??
    null;

  const allMeshes = [];
  try {
    const list =
      scene?.meshes ??
      scene?.meshes?.data ??
      (typeof scene?.getMeshes === 'function' ? scene.getMeshes() : null) ??
      [];
    const arr = Array.from(list || []);
    for (const mesh of arr) {
      const name = mesh?.name ?? mesh?._name ?? '';
      if (isWindowish(name)) allMeshes.push(meshRow(mesh));
    }
    // fallback: any mesh with window-like material names
    if (allMeshes.length < 3) {
      for (const mesh of arr) {
        const name = mesh?.name ?? '';
        let matNames = '';
        try {
          const m = mesh.material;
          const ms = Array.isArray(m) ? m : m ? [m] : [];
          matNames = ms.map((x) => x?.name || '').join(' ');
        } catch (_) {}
        if (isWindowish(name + ' ' + matNames) && !allMeshes.some((r) => r.name === name)) {
          allMeshes.push(meshRow(mesh));
        }
      }
    }
  } catch (e) {
    console.warn('mesh scan', e);
  }

  // depth steps: group by name tokens, compare sizeMm.z / center z
  const depthHints = allMeshes
    .filter((m) => m.worldBox?.sizeMm)
    .map((m) => ({
      name: m.name,
      sizeMm: m.worldBox.sizeMm,
      centerZ: m.worldBox.min && m.worldBox.max
        ? +(((m.worldBox.min.z + m.worldBox.max.z) / 2)).toFixed(4)
        : null,
      centerY: m.worldBox.min && m.worldBox.max
        ? +(((m.worldBox.min.y + m.worldBox.max.y) / 2)).toFixed(4)
        : null,
    }))
    .sort((a, b) => (a.centerZ ?? 0) - (b.centerZ ?? 0));

  let soft = null;
  try {
    const softR =
      lm?._soft_shadow_renderer ||
      lm?.soft_shadow_renderer ||
      lm?.softShadow ||
      lm?.soft_shadows;
    soft = softR
      ? {
          className: softR.constructor?.name ?? null,
          intensity: softR.intensity ?? softR._intensity ?? softR.get_intensity?.() ?? null,
          reference_height:
            softR.reference_height ?? softR._reference_height ?? softR.get_reference_height?.() ?? null,
          tracked_size: (() => {
            try {
              const s = softR._tracked_size ?? softR.tracked_size ?? softR.get_tracked_size?.();
              return vec(s) || s || null;
            } catch (_) {
              return null;
            }
          })(),
          render_layer_mask:
            softR._render_layer_mask?.bitmap ??
            softR.render_layer_mask?.bitmap ??
            softR._render_layer_mask ??
            null,
          block_layer_mask:
            softR._block_layer_mask?.bitmap ??
            softR.block_layer_mask?.bitmap ??
            softR._block_layer_mask ??
            null,
        }
      : null;
  } catch (e) {
    soft = { error: String(e?.message || e) };
  }

  let lights = [];
  try {
    const live = lm?.liveLights ?? lm?._live_lights ?? lm?.get_live_lights?.() ?? [];
    lights = Array.from(live || [])
      .slice(0, 12)
      .map((L) => ({
        name: L.name ?? L._name ?? L.constructor?.name ?? null,
        intensity: num(L.intensity ?? L._intensity),
        type: L.constructor?.name ?? null,
      }));
  } catch (_) {}

  const out = {
    meta: {
      when: new Date().toISOString(),
      purpose: 'window sash/handle shadows vs frame depth',
      url: location.href,
      meshHits: allMeshes.length,
    },
    soft,
    lights,
    windowMeshes: allMeshes.slice(0, 80),
    depthHints: depthHints.slice(0, 80),
    nameHints: {
      note: 'Ищем mesh с window/sash/handle/frame/glass/Simulated_Shadow в имени',
      sampleAllMeshNames: (() => {
        try {
          const list = scene?.meshes ?? [];
          return Array.from(list)
            .map((m) => m?.name)
            .filter(Boolean)
            .filter((n) => /win|sash|hand|glass|frame|shadow|door|wall/i.test(n))
            .slice(0, 120);
        } catch (_) {
          return [];
        }
      })(),
    },
  };

  const json = JSON.stringify(out, null, 2);
  console.log('[IKEA window dump]', out);
  console.log(json);
  try {
    await navigator.clipboard.writeText(json);
    console.log('[IKEA window dump] copied to clipboard');
  } catch (e) {
    console.warn('[IKEA window dump] clipboard failed — copy JSON from console', e);
  }
  return out;
})();
