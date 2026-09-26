/**
 * IKEA PAX — dump окна v2 (имена Custom Mesh*, не window/sash).
 * Комната с ОКВЛЕННЫМ окном в 3D → кликните ВНУТРЬ страницы планировщика
 * (чтобы clipboard сработал) → F12 Console → вставить → Enter.
 * Пришлите JSON в чат (или copy(JSON.stringify(window.__IKEA_WIN_DUMP,null,2))).
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
    while (q.length && n < 60000) {
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
        if (a && b && a.x != null) {
          return {
            min: a,
            max: b,
            sizeMm: {
              x: Math.round((b.x - a.x) * 1000),
              y: Math.round((b.y - a.y) * 1000),
              z: Math.round((b.z - a.z) * 1000),
            },
            center: {
              x: +((a.x + b.x) / 2).toFixed(4),
              y: +((a.y + b.y) / 2).toFixed(4),
              z: +((a.z + b.z) / 2).toFixed(4),
            },
          };
        }
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
    const out = {
      name: mat.name ?? mat._name ?? null,
      className: mat.constructor?.name ?? null,
      albedo: rgb(mat.albedoColor ?? mat.albedo ?? mat._albedoColor),
      color: rgb(mat.color ?? mat._color ?? mat.baseColor),
      roughness: num(mat.roughness ?? mat._roughness),
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
        mat.occlusionTexture ?? mat.occlusion_texture ?? mat._occlusionTexture
      ),
      normalTex: texInfo(mat.normalTexture ?? mat.bumpTexture),
    };
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

  function meshMats(mesh) {
    const mats = [];
    try {
      const m = mesh.material ?? mesh._material;
      if (Array.isArray(m)) m.forEach((x) => mats.push(matDump(x)));
      else if (m) mats.push(matDump(m));
    } catch (_) {}
    return mats.filter(Boolean);
  }

  function meshRow(mesh) {
    const name = mesh.name ?? mesh._name ?? '';
    const wb = worldBox(mesh);
    let layerMask = null;
    try {
      layerMask =
        mesh.layerMask ?? mesh._layerMask ?? mesh.get_layer_mask?.() ?? mesh.renderingGroupId ?? null;
    } catch (_) {}
    const mats = meshMats(mesh);
    return {
      name,
      className: mesh.constructor?.name ?? null,
      visible: mesh.isVisible ?? mesh.visible ?? null,
      receiveShadows: mesh.receiveShadows ?? mesh._receiveShadows ?? null,
      castShadows: mesh.castShadows ?? mesh._castShadows ?? null,
      layerMask,
      worldBox: wb,
      materials: mats.slice(0, 8),
      matNames: mats.map((m) => m?.name).filter(Boolean),
    };
  }

  /** Окно: широкий+высокий, тонкий по одной оси (5–120 мм). */
  function looksLikeWindowPanel(row) {
    const s = row.worldBox?.sizeMm;
    if (!s) return false;
    const dims = [s.x, s.y, s.z].sort((a, b) => a - b);
    const thin = dims[0];
    const mid = dims[1];
    const long = dims[2];
    if (thin < 2 || thin > 120) return false;
    if (mid < 400 || long < 500) return false;
    if (long / Math.max(thin, 1) < 8) return false;
    return true;
  }

  function looksLikeHandle(row) {
    const s = row.worldBox?.sizeMm;
    if (!s) return false;
    const dims = [s.x, s.y, s.z].sort((a, b) => a - b);
    // маленькая фурнитура
    return dims[2] < 250 && dims[1] < 120 && dims[0] < 80 && dims[2] > 15;
  }

  const core = findCore();
  if (!core?.betraktaViewer) {
    console.error('[IKEA win dump v2] betraktaViewer not found');
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

  let arr = [];
  try {
    const list =
      scene?.meshes ??
      (typeof scene?.getMeshes === 'function' ? scene.getMeshes() : null) ??
      [];
    arr = Array.from(list || []);
  } catch (e) {
    console.warn(e);
  }

  const allNamed = arr
    .map((m) => m?.name ?? m?._name ?? '')
    .filter((n) => n != null && String(n).length > 0);

  const allRows = arr.map(meshRow);
  const windowPanels = allRows.filter(looksLikeWindowPanel);
  const handles = allRows.filter(looksLikeHandle).slice(0, 40);

  // Custom Mesh* рядом с оконными панелями (по Y-центру)
  const panelYs = new Set(
    windowPanels.map((r) => (r.worldBox?.center?.y != null ? r.worldBox.center.y.toFixed(3) : null)).filter(Boolean)
  );
  const nearPanels = allRows
    .filter((r) => {
      const y = r.worldBox?.center?.y;
      if (y == null) return false;
      return [...panelYs].some((py) => Math.abs(y - Number(py)) < 0.6);
    })
    .slice(0, 60);

  const customMeshes = allRows
    .filter((r) => /^custom\s*mesh/i.test(String(r.name || '')) || r.name === '')
    .slice(0, 80);

  let soft = null;
  try {
    const softR =
      lm?._soft_shadow_renderer || lm?.soft_shadow_renderer || lm?.softShadow || lm?.soft_shadows;
    soft = softR
      ? {
          className: softR.constructor?.name ?? null,
          intensity: softR.intensity ?? softR._intensity ?? softR.get_intensity?.() ?? null,
          reference_height:
            softR.reference_height ?? softR._reference_height ?? softR.get_reference_height?.() ?? null,
          render_layer_mask:
            softR._render_layer_mask?.bitmap ?? softR.render_layer_mask?.bitmap ?? null,
          block_layer_mask: softR._block_layer_mask?.bitmap ?? softR.block_layer_mask?.bitmap ?? null,
        }
      : null;
  } catch (e) {
    soft = { error: String(e?.message || e) };
  }

  // Simulated_Shadow / AO decals
  const shadowDecals = allRows
    .filter((r) => /shadow|ao|decal|имитац/i.test(String(r.name || '') + ' ' + (r.matNames || []).join(' ')))
    .slice(0, 40);

  const out = {
    meta: {
      when: new Date().toISOString(),
      purpose: 'window v2 — Custom Mesh + size heuristics',
      url: location.href,
      totalMeshes: arr.length,
      windowPanelHits: windowPanels.length,
    },
    soft,
    windowPanels,
    nearPanels,
    handles,
    customMeshes,
    shadowDecals,
    depthCompare: windowPanels
      .map((r) => ({
        name: r.name,
        sizeMm: r.worldBox?.sizeMm,
        center: r.worldBox?.center,
        matNames: r.matNames,
        receiveShadows: r.receiveShadows,
        castShadows: r.castShadows,
      }))
      .sort((a, b) => (a.center?.z ?? 0) - (b.center?.z ?? 0)),
    nameSample: allNamed.filter((n) => /custom|mesh|wall|door|win|glass|hand|frame|shadow|paint/i.test(n)).slice(0, 150),
    nameSampleAllFirst120: allNamed.slice(0, 120),
  };

  window.__IKEA_WIN_DUMP = out;
  const json = JSON.stringify(out, null, 2);
  console.log('[IKEA win dump v2]', out);
  console.log(json);
  console.log(
    '%cГотово. Скопируйте: copy(JSON.stringify(window.__IKEA_WIN_DUMP,null,2))',
    'color:#0a0;font-weight:bold'
  );
  try {
    await navigator.clipboard.writeText(json);
    console.log('[IKEA win dump v2] clipboard OK');
  } catch (_) {
    console.warn('[IKEA win dump v2] clipboard blocked — use copy(...) above');
  }
  return out;
})();
