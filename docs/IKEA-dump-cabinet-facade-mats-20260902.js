/**
 * IKEA PAX live — facade / 010_White / wall / lights (one JSON).
 * Chrome → ikea.com/.../pax/... planner, шкаф с ЗАКРЫТОЙ белой дверью, 3D готов.
 * F12 Console → paste → Enter. JSON копируется в буфер — пришлите в чат.
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
    while (q.length && n < 40000) {
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

  function rgb(v) {
    if (v == null) return null;
    const r = num(v.r ?? v.x ?? v[0]);
    const g = num(v.g ?? v.y ?? v[1]);
    const b = num(v.b ?? v.z ?? v[2]);
    if (r == null || g == null || b == null) return null;
    return { r, g, b, br: r > 1e-6 ? +(b / r).toFixed(4) : null };
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

  function interestingMat(meshName, matName) {
    const s = `${meshName} ${matName}`;
    return /010_White|003_Back|011_White|paint_30x30|FORSAND|forsand|facade|door|Door|корпус|Backside/i.test(
      s
    );
  }

  function matRow(mesh, mat) {
    const meshName = String(mesh?.name || mesh?.id || '');
    const matName = String(mat?.name || mat?.id || '');
    let srgb = null;
    let linear = null;
    try {
      srgb = rgb(mat._base_color_factor_srgb || mat.base_color_factor_srgb);
    } catch {}
    try {
      linear = rgb(
        mat._diffuseColorFactor ||
          mat.diffuseColorFactor ||
          mat._baseColor ||
          mat.baseColor ||
          mat._base_color_factor ||
          mat.base_color_factor
      );
    } catch {}
    return {
      mesh: meshName.slice(0, 90),
      mat: matName.slice(0, 90),
      matClass: mat?.constructor?.name || null,
      rough: num(mat._roughness ?? mat.roughness ?? mat.roughness_factor),
      metal: num(mat._metallic ?? mat.metallic ?? mat.metallic_factor),
      occStr: num(mat._occlusion_strength ?? mat.occlusionStrength),
      base_srgb: srgb,
      base_linear: linear,
      receiveShadows: mesh?.receiveShadows ?? mesh?._receiveShadows ?? null,
      layerMask: mesh?.layerMask ?? mesh?._layerMask ?? null,
    };
  }

  const core = findCore();
  if (!core?.betraktaViewer) {
    const err = { err: 'no betraktaViewer — дождитесь 3D на ikea.com/pax', href: location.href };
    console.error(err);
    return err;
  }

  const bv = core.betraktaViewer;
  const scene = bv.scene || bv._scene;
  const lm = bv.light_manager || bv.lightManager || bv._light_manager;
  const rs = core.lights?.renderSettings || lm?._render_settings || {};
  const list = scene?.meshes || [];
  const arr = Array.isArray(list) ? list : [...(list || [])];

  const byMat = {};
  const samples = [];
  for (const mesh of arr) {
    const mat = mesh.material || mesh._material;
    if (!mat) continue;
    const meshName = String(mesh.name || mesh.id || '');
    const matName = String(mat.name || mat.id || '');
    if (/dimension|measure|gizmo|helper|ui_|label/i.test(meshName + matName)) continue;
    byMat[matName] = (byMat[matName] || 0) + 1;
    if (!interestingMat(meshName, matName)) continue;
    if (samples.length < 40) samples.push(matRow(mesh, mat));
  }

  const unique = [];
  const seen = new Set();
  for (const row of samples) {
    const k = `${row.mat}|${row.rough}|${JSON.stringify(row.base_srgb)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    unique.push(row);
  }

  let lightsJs = [];
  try {
    const raw = lm?.lights || lm?._lights || scene?.lights || [];
    const larr = Array.isArray(raw) ? raw : Object.values(raw || {});
    lightsJs = larr.slice(0, 8).map((L) => ({
      class: L?.constructor?.name,
      intensity: num(L?.intensity ?? L?._intensity),
      intensityMode: L?.intensityMode ?? L?._intensityMode ?? null,
      position: vec(L?.position || L?._position || L?.get_position?.()),
      direction: vec(L?.direction || L?._direction || L?.get_direction?.()),
    }));
  } catch (e) {
    lightsJs = [{ err: e.message }];
  }

  const out = {
    ok: true,
    when: new Date().toISOString(),
    href: location.href,
    meshCount: arr.length,
    exposureLinear: num(bv.get_camera_exposure_linear?.()),
    env: {
      intensity: num(rs?.environmentMap?.intensity ?? rs?.environment?.intensity),
      rotation: num(rs?.environmentMap?.rotation ?? rs?.environment?.rotation),
      url: rs?.environmentMap?.url || rs?.environment?.url || null,
    },
    mainLight: rs?.mainLight
      ? {
          intensity: num(rs.mainLight.intensity),
          innerAngleDegrees: num(rs.mainLight.innerAngleDegrees),
          outerAngleDegrees: num(rs.mainLight.outerAngleDegrees),
          colorTemperature: num(rs.mainLight.colorTemperature),
        }
      : null,
    lightsJs,
    materialCounts: byMat,
    uniqueInteresting: unique,
  };

  console.log(out);
  try {
    await navigator.clipboard.writeText(JSON.stringify(out, null, 2));
    console.log('[dump] JSON copied to clipboard');
  } catch {
    console.log('[dump] copy failed — copy the object from console');
  }
  return out;
})();
