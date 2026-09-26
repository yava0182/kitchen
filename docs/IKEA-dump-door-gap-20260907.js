/**
 * IKEA PAX live — зазор между закрытыми дверями: геометрия + материал + запечённое AO.
 * Chrome → ikea.com/.../pax/... , шкаф стоит, двери ЗАКРЫТЫ, 3D дорисован.
 * F12 → Console → вставить → Enter. JSON уедет в буфер обмена.
 *
 * Вопрос дампа: у IKEA зазор между створками читается как узкая тёмная линия
 * (пипетка 2026-09-07: ширина 2-3 px, провал 9-19 ед. яркости на всех высотах),
 * у нас провал 2.6-4.0 ед. Нужно понять источник:
 *   gapToPrevMm > 0        → честная геометрическая щель, тёмный слот за ней;
 *   gapToPrevMm <= 0       → полотна вплотную, линия запечена в occTexture;
 *   doors[].minMm.z vs каркас → глубина слота за фасадом.
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
      if (f?.memoizedProps?.value?.betraktaViewer) return f.memoizedProps.value;
      if (f?.child) q.push(f.child);
      if (f?.sibling) q.push(f.sibling);
    }
    return null;
  }

  const num = (v) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : null;
  };
  const mm = (v) => (v == null ? null : Math.round(v * 1000));

  function vecOf(v) {
    if (!v) return null;
    const x = num(v.x ?? v._x ?? v[0]);
    const y = num(v.y ?? v._y ?? v[1]);
    const z = num(v.z ?? v._z ?? v[2]);
    if (x == null || y == null || z == null) return null;
    return { x, y, z };
  }

  /** Мировой bbox: движок неизвестен, поэтому перебираем известные API. */
  function worldBox(mesh) {
    const tries = [];
    const push = (src, a, b) => {
      if (a && b) tries.push([src, a, b]);
    };
    try {
      const bb = mesh.getBoundingInfo?.()?.boundingBox;
      if (bb) push('getBoundingInfo', bb.minimumWorld ?? bb.minimum, bb.maximumWorld ?? bb.maximum);
    } catch {}
    try {
      const bb = mesh._boundingInfo?.boundingBox;
      if (bb) push('_boundingInfo', bb.minimumWorld ?? bb.minimum, bb.maximumWorld ?? bb.maximum);
    } catch {}
    for (const k of ['world_bounds', 'worldBounds', 'boundingBox', '_worldBounds', 'bounds', '_bounds']) {
      try {
        const b = mesh[k] ?? mesh[`get_${k}`]?.() ?? null;
        if (b) push(k, b.min ?? b.minimum ?? b.minimumWorld, b.max ?? b.maximum ?? b.maximumWorld);
      } catch {}
    }
    for (const [src, mn, mx] of tries) {
      const a = vecOf(mn);
      const b = vecOf(mx);
      if (a && b) return { src, min: a, max: b };
    }
    return null;
  }

  function texInfo(t) {
    if (!t || typeof t !== 'object') return null;
    return {
      name: t.name ?? t._name ?? null,
      url: t.url ?? t._url ?? t.source?.url ?? t._source?.url ?? null,
      w: num(t.width ?? t._width ?? t.getSize?.()?.width),
      h: num(t.height ?? t._height ?? t.getSize?.()?.height),
    };
  }

  /** Какие поля вообще есть — страховка, чтобы не гонять второй дамп. */
  function probeKeys(obj, re) {
    if (!obj) return [];
    const out = new Set();
    let o = obj;
    for (let d = 0; d < 4 && o; d++) {
      for (const k of Object.getOwnPropertyNames(o)) if (re.test(k)) out.add(k);
      o = Object.getPrototypeOf(o);
    }
    return [...out].slice(0, 60);
  }

  const core = findCore();
  if (!core?.betraktaViewer) {
    const err = { err: 'no betraktaViewer — дождитесь 3D на ikea.com/pax', href: location.href };
    console.error(err);
    return err;
  }

  const bv = core.betraktaViewer;
  const scene = bv.scene || bv._scene;
  const meshes = [...(scene?.meshes || [])];

  const rows = [];
  for (const mesh of meshes) {
    const name = String(mesh?.name || mesh?.id || '');
    const mat = mesh?.material || mesh?._material;
    const matName = String(mat?.name || mat?.id || '');
    if (/dimension|measure|gizmo|helper|ui_|label/i.test(name + matName)) continue;
    const box = worldBox(mesh);
    if (!box) continue;
    const size = {
      x: box.max.x - box.min.x,
      y: box.max.y - box.min.y,
      z: box.max.z - box.min.z,
    };
    rows.push({ mesh, name, matName, box, size, mat });
  }

  const thin = (s) => Math.min(s.x, s.y, s.z);
  const isDoor = (r) =>
    /door|дверь|facade/i.test(r.name + ' ' + r.matName) ||
    (r.size.y > 1 && thin(r.size) < 0.06 && r.size.z === thin(r.size));

  const doors = rows
    .filter(isDoor)
    .sort((a, b) => (a.box.min.x + a.box.max.x) / 2 - (b.box.min.x + b.box.max.x) / 2);

  const doorOut = doors.slice(0, 12).map((r, i) => {
    const prev = i > 0 ? doors[i - 1] : null;
    return {
      i,
      name: r.name.slice(0, 70),
      mat: r.matName.slice(0, 70),
      boxSrc: r.box.src,
      minMm: { x: mm(r.box.min.x), y: mm(r.box.min.y), z: mm(r.box.min.z) },
      maxMm: { x: mm(r.box.max.x), y: mm(r.box.max.y), z: mm(r.box.max.z) },
      sizeMm: { x: mm(r.size.x), y: mm(r.size.y), z: mm(r.size.z) },
      gapToPrevMm: prev ? mm(r.box.min.x - prev.box.max.x) : null,
      receiveShadows: r.mesh?.receiveShadows ?? r.mesh?._receiveShadows ?? null,
      layerMask: r.mesh?.layerMask ?? r.mesh?._layerMask ?? null,
      vertexCount: num(r.mesh?.getTotalVertices?.() ?? r.mesh?.vertexCount),
    };
  });

  const dm = doors[0]?.mat;
  const doorMat = dm
    ? {
        matClass: dm?.constructor?.name || null,
        rough: num(dm._roughness ?? dm.roughness ?? dm.roughness_factor),
        metal: num(dm._metallic ?? dm.metallic ?? dm.metallic_factor),
        occStrength: num(dm._occlusion_strength ?? dm.occlusionStrength),
        occTexture: texInfo(dm._occlusion_texture ?? dm.occlusionTexture ?? dm.occlusion_sampler),
        baseTexture: texInfo(dm._base_color_texture ?? dm.baseColorTexture ?? dm.albedoTexture),
        normalTexture: texInfo(dm._normal_texture ?? dm.normalTexture ?? dm.bumpTexture),
        textureKeys: probeKeys(dm, /tex|sampler|map|occl/i),
      }
    : null;

  const big = rows
    .slice()
    .sort((a, b) => b.size.x * b.size.y - a.size.x * a.size.y)
    .slice(0, 8)
    .map((r) => ({
      name: r.name.slice(0, 70),
      mat: r.matName.slice(0, 70),
      minMm: { x: mm(r.box.min.x), y: mm(r.box.min.y), z: mm(r.box.min.z) },
      maxMm: { x: mm(r.box.max.x), y: mm(r.box.max.y), z: mm(r.box.max.z) },
    }));

  const out = {
    ok: true,
    when: new Date().toISOString(),
    href: location.href,
    meshCount: meshes.length,
    boxedCount: rows.length,
    doorCount: doors.length,
    doors: doorOut,
    doorMat,
    biggestMeshes: big,
    apiProbe: {
      meshKeys: probeKeys(doors[0]?.mesh ?? rows[0]?.mesh, /bound|bbox|vert|geom|matrix|position|scal|uv/i),
      names: rows.slice(0, 40).map((r) => r.name.slice(0, 50)),
    },
  };

  console.log(out);
  /**
   * navigator.clipboard требует фокус на странице, а при работе в консоли фокус у DevTools —
   * запись молча запрещается. Поэтому объект кладём на window и копируем командой DevTools:
   *   copy(__cldGapDump)
   */
  window.__cldGapDump = out;
  console.log('[dump] готово. В консоли выполните:  copy(__cldGapDump)  → затем Ctrl+V в чат');
  return out;
})();
