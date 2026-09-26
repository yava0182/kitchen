/**
 * IKEA PAX — dump Soft + wall/floor mats (v2).
 * Прошлый скрипт дал пусто: искал lm не там. Этот = рабочий путь из dump phase-gaps.
 *
 * 1) Пустая комната в PAX (или со шкафом — тоже ок)
 * 2) F12 → Console → вставить ВЕСЬ файл → Enter
 * 3) JSON в буфере → вставить в чат
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
      return { x: num(v.x ?? v._x), y: num(v.y ?? v._y), z: num(v.z ?? v._z) };
    }
    if (typeof v.asArray === 'function') {
      const a = v.asArray();
      return { x: num(a[0]), y: num(a[1]), z: num(a[2]) };
    }
    return null;
  }

  function digSoftKeys(mat) {
    if (!mat) return null;
    const keys = Object.getOwnPropertyNames(mat);
    const hit = keys.filter((k) =>
      /soft|height|shadow|ao|occlus|receive|blur|reference/i.test(k)
    );
    const vals = {};
    for (const k of hit.slice(0, 30)) {
      try {
        const x = mat[k];
        if (x == null || typeof x === 'number' || typeof x === 'boolean' || typeof x === 'string') {
          vals[k] = x;
        } else if (typeof x === 'object') {
          vals[k] = {
            _c: x.constructor?.name,
            keys: Object.getOwnPropertyNames(x).slice(0, 25),
            vec: vec(x),
          };
        } else if (typeof x === 'function') vals[k] = '[fn]';
      } catch (e) {
        vals[k] = 'err:' + e.message;
      }
    }
    return { hit, vals };
  }

  const core = findCore();
  if (!core) {
    const err = { err: 'no core — откройте именно PAX planner (#/planner), не главную ikea' };
    console.error(err);
    return err;
  }

  const bv = core.betraktaViewer;
  const lm = bv?._light_manager || bv?.light_manager;
  const lightsApi = core.lights;
  const rs = lightsApi?.renderSettings || lightsApi?._render_settings || null;
  const ssr = lm?._soft_shadow_renderer || lm?.soft_shadow_renderer;
  const punctual = (typeof lm?.get_punctual_lights === 'function' && lm.get_punctual_lights()) || [];
  const spot = punctual[0] || null;

  let soft = null;
  try {
    soft = {
      found: !!ssr,
      class: ssr?.constructor?.name || null,
      intensity: ssr?.intensity ?? ssr?._intensity ?? null,
      resolution: ssr?.resolution ?? ssr?._resolution ?? null,
      center: vec(ssr?.center || ssr?._center || ssr?._tracked_center_position),
      size: vec(ssr?.size || ssr?._size || ssr?._tracked_size),
      reference_height: ssr?._reference_height ?? ssr?.reference_height ?? null,
      keys: ssr ? Object.getOwnPropertyNames(ssr).slice(0, 80) : null,
      proto: ssr
        ? Object.getOwnPropertyNames(Object.getPrototypeOf(ssr) || {}).filter((n) =>
            /blur|shadow|height|plane|update|center|size|get_/i.test(n)
          )
        : null,
      lmKeys: lm ? Object.getOwnPropertyNames(lm).filter((k) => /soft|shadow/i.test(k)) : null,
    };
    const blur = ssr?._blur_effect || ssr?.blur_effect || ssr?.blur;
    if (blur) {
      soft.blurClass = blur.constructor?.name;
      soft.blurKeys = Object.getOwnPropertyNames(blur).slice(0, 40);
      soft.blurScale = vec(blur.scale || blur._scale);
    }
  } catch (e) {
    soft = { err: e.message };
  }

  let spotDump = null;
  try {
    spotDump = {
      count: punctual.length,
      class: spot?.constructor?.name,
      intensity: spot?.intensity ?? spot?._intensity,
      position: vec(spot?.position || spot?._position),
      direction: vec(spot?.direction || spot?._direction),
    };
  } catch (e) {
    spotDump = { err: e.message };
  }

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
      const low = (name + ' ' + matName + ' ' + (m.constructor?.name || '')).toLowerCase();
      if (!/paint|wall|floor|ceiling|010_white|white|herring|pax|backside|corpus|betraktapbr/i.test(low))
        continue;
      if (/dimension|measure|gizmo|ui_|label|viewerui/i.test(low)) continue;
      mats.push({
        mesh: name.slice(0, 120),
        mat: matName.slice(0, 120),
        matClass: m.constructor?.name,
        receiveShadows: mesh.receiveShadows ?? mesh._receiveShadows,
        castShadows: mesh.castShadows ?? mesh._castShadows,
        roughness: m.roughness ?? m._roughness,
        metallic: m.metallic ?? m._metallic ?? m.metalness,
        softDig: digSoftKeys(m),
      });
      if (mats.length >= 35) break;
    }
  } catch (e) {
    mats.push({ err: e.message });
  }

  const out = {
    ok: true,
    purpose: 'soft-on-walls-v2',
    when: new Date().toISOString(),
    hasViewer: !!bv,
    hasLm: !!lm,
    soft,
    spot: spotDump,
    materials: mats,
    enable_soft_shadows: rs?.enable_soft_shadows ?? rs?.features?.enable_soft_shadows ?? null,
  };

  const s = JSON.stringify(out, null, 2);
  console.log(s);
  try {
    copy(s);
    console.log('%c→ в буфере — вставьте в чат', 'color:#0a0;font-weight:bold');
  } catch {
    console.log('%ccopy() нет — скопируйте JSON из лога', 'color:#a60');
  }
  window.__cldIkeaSoftWallsDump = out;
  return out;
})();
