/**
 * ВТОРОЙ скрипт — если первый нашёл URV-стену, но meshes пустые.
 * Вставляй в ТОТ ЖЕ Kitchen frame, после Создать.
 * Ищет в scene graph меши рядом со стеной и печает bbox/вершины.
 */

(function ikeaSlopeMeshDump() {
  'use strict';

  function findViewer() {
    const w = window;
    for (const k of Object.getOwnPropertyNames(w)) {
      try {
        const v = w[k];
        if (v && v.viewer && v.viewer.scene) return v.viewer;
        if (v && v.app && v.app.viewer && v.app.viewer.scene) return v.app.viewer;
      } catch (_) {}
    }
    return null;
  }

  const viewer = findViewer();
  if (!viewer || !viewer.scene) {
    console.error('[slope-mesh] viewer.scene не найден — не тот frame');
    return;
  }

  const rows = [];
  let n = 0;
  viewer.scene.traverse((o) => {
    if (!o || !o.isMesh || !o.geometry) return;
    n++;
    const pos = o.geometry.attributes && o.geometry.attributes.position;
    if (!pos || pos.count < 3) return;
    let minY = Infinity,
      maxY = -Infinity,
      minX = Infinity,
      maxX = -Infinity,
      minZ = Infinity,
      maxZ = -Infinity;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i),
        y = pos.getY(i),
        z = pos.getZ(i);
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    const sy = maxY - minY;
    const sx = maxX - minX;
    const sz = maxZ - minZ;
    // скошенные стены обычно высотой ~1–3м и не пол, не мелочь
    if (sy < 800 || sy > 4000) return;
    if (Math.max(sx, sz) < 200) return;
    rows.push({
      name: o.name || '',
      verts: pos.count,
      size: { x: +sx.toFixed(1), y: +sy.toFixed(1), z: +sz.toFixed(1) },
      min: { x: +minX.toFixed(1), y: +minY.toFixed(1), z: +minZ.toFixed(1) },
      max: { x: +maxX.toFixed(1), y: +maxY.toFixed(1), z: +maxZ.toFixed(1) },
      // эвристика «трапеция / скос»: высота не на всю комнату равномерно
      aspect: +(Math.max(sx, sz) / sy).toFixed(3),
    });
  });

  rows.sort((a, b) => b.size.y * Math.max(b.size.x, b.size.z) - a.size.y * Math.max(a.size.x, a.size.z));
  const report = { meshTotal: n, candidates: rows.slice(0, 30) };
  console.log('[slope-mesh] RESULT:');
  console.log(JSON.stringify(report, null, 2));
  try {
    copy(JSON.stringify(report, null, 2));
    console.log('[slope-mesh] в clipboard');
  } catch (_) {}
  window.__IKEA_SLOPE_MESH__ = report;
  return report;
})();
