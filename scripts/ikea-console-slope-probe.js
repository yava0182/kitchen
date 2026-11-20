/**
 * Вставь в Console IKEA ПОСЛЕ «Создать» скошенный потолок.
 *
 * Как открыть нужный frame:
 * 1) F12 → Console
 * 2) Вверху слева dropdown контекста: выбери frame
 *    `Kitchen` / `ikea-prod.by.me` / `Kitchen/?ln=...`
 *    (НЕ верхний kitchen.planner.ikea.com — там пусто)
 * 3) Вставь блок целиком, Enter
 * 4) Скопируй JSON из консоли → кинь мне
 */

(function ikeaSlopeProbe() {
  'use strict';

  function findApp(root) {
    const w = root || window;
    const keys = Object.getOwnPropertyNames(w);
    for (const k of keys) {
      try {
        const v = w[k];
        if (!v || typeof v !== 'object') continue;
        if (v.viewer && v.level && typeof v.level.getWalls === 'function') return v;
        if (v._app && v._app.viewer && v._app.level) return v._app;
        if (v.app && v.app.viewer && v.app.level) return v.app;
      } catch (_) {}
    }
    // обход webpack модулей / by.me
    try {
      if (w.byMe && w.byMe.app) return w.byMe.app;
    } catch (_) {}
    return null;
  }

  function wallInfo(wall) {
    const info = {
      type: wall && wall.constructor && wall.constructor.name,
      isURV: !!(wall && wall.getBaseHeightOneSlope),
      height: null,
      baseHeightOneSlope: null,
      depthOneSlope: null,
      angleOneSlope: null,
      thickness: null,
      length: null,
      hasSlope: false,
    };
    try {
      if (typeof wall.getHeight === 'function') info.height = wall.getHeight();
    } catch (_) {}
    try {
      if (typeof wall.getBaseHeightOneSlope === 'function') {
        info.baseHeightOneSlope = wall.getBaseHeightOneSlope();
        info.hasSlope = true;
      }
    } catch (_) {}
    try {
      if (typeof wall.getDepthOneSlope === 'function') {
        info.depthOneSlope = wall.getDepthOneSlope();
      }
    } catch (_) {}
    try {
      if (typeof wall.getAngleOneSlope === 'function') {
        info.angleOneSlope = wall.getAngleOneSlope();
      }
    } catch (_) {}
    try {
      if (typeof wall.getThickness === 'function') info.thickness = wall.getThickness();
    } catch (_) {}
    try {
      if (wall.edge && wall.edge.segment && typeof wall.edge.segment.getLength === 'function') {
        info.length = wall.edge.segment.getLength();
      }
    } catch (_) {}
    // точки ребра
    try {
      const seg = wall.edge && wall.edge.segment;
      if (seg) {
        const a = seg.getPoint ? seg.getPoint(0) : seg.line && seg.line.ptO;
        const b = seg.getPoint ? seg.getPoint(1) : seg.line && seg.line.ptE;
        if (a && b) {
          info.edge = {
            a: { x: a.x, y: a.y, z: a.z },
            b: { x: b.x, y: b.y, z: b.z },
          };
        }
      }
    } catch (_) {}
    return info;
  }

  function sampleMesh(obj, maxVerts) {
    const out = [];
    if (!obj) return out;
    const geom = obj.geometry || obj;
    let pos =
      geom.attributes && geom.attributes.position
        ? geom.attributes.position
        : geom.getAttribute && geom.getAttribute('position');
    if (!pos) return out;
    const n = pos.count;
    const step = Math.max(1, Math.floor(n / (maxVerts || 24)));
    for (let i = 0; i < n; i += step) {
      out.push({
        i,
        x: +pos.getX(i).toFixed(2),
        y: +pos.getY(i).toFixed(2),
        z: +pos.getZ(i).toFixed(2),
      });
    }
    // bbox
    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity,
      maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity;
    for (let i = 0; i < n; i++) {
      const x = pos.getX(i),
        y = pos.getY(i),
        z = pos.getZ(i);
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
    }
    return {
      vertCount: n,
      bbox: {
        min: { x: +minX.toFixed(2), y: +minY.toFixed(2), z: +minZ.toFixed(2) },
        max: { x: +maxX.toFixed(2), y: +maxY.toFixed(2), z: +maxZ.toFixed(2) },
        size: {
          x: +(maxX - minX).toFixed(2),
          y: +(maxY - minY).toFixed(2),
          z: +(maxZ - minZ).toFixed(2),
        },
      },
      sample: out.slice(0, maxVerts || 24),
    };
  }

  function collectPresenterMeshes(app, wall) {
    const meshes = [];
    try {
      const vc =
        app._viewController ||
        app.viewController ||
        (app.viewer && app.viewer.viewController);
      const level = app.level;
      // типичные пути by.me
      const candidates = [];
      if (vc && typeof vc.getModelMapping === 'function') {
        candidates.push(vc.getModelMapping(wall));
      }
      if (level && typeof level.getPresenter === 'function') {
        const p = level.getPresenter('WallPresenter') || level.getPresenter('Wall3DPresenter');
        if (p && typeof p.getModelMapping === 'function') candidates.push(p.getModelMapping(wall));
      }
      // selection
      try {
        const sel = app.viewer && app.viewer.selection && app.viewer.selection.getSelection();
        if (sel && sel.length) {
          for (const s of sel) {
            if (s && s.model === wall && s.object) candidates.push(s.object);
            if (s && s.object) candidates.push(s.object);
          }
        }
      } catch (_) {}

      for (const c of candidates) {
        if (!c) continue;
        const roots = Array.isArray(c) ? c : [c];
        for (const root of roots) {
          if (!root) continue;
          if (root.geometry || (root.attributes && root.attributes.position)) {
            meshes.push({ path: 'direct', mesh: sampleMesh(root) });
          }
          if (typeof root.traverse === 'function') {
            root.traverse((o) => {
              if (o && o.isMesh && o.geometry) {
                meshes.push({
                  name: o.name || o.type,
                  mesh: sampleMesh(o),
                });
              }
            });
          }
        }
      }
    } catch (e) {
      meshes.push({ error: String(e && e.message ? e.message : e) });
    }
    return meshes;
  }

  const app = findApp(window);
  if (!app) {
    console.error(
      '[slope-probe] app не найден. Смени frame в DevTools на Kitchen/ikea-prod.by.me и запусти снова.'
    );
    console.log(
      'frames:',
      [...document.querySelectorAll('iframe')].map((f) => f.src).slice(0, 10)
    );
    return;
  }

  const walls = app.level.getWalls();
  const report = {
    ts: new Date().toISOString(),
    wallCount: walls.length,
    walls: walls.map((w, i) => ({ i, ...wallInfo(w) })),
    sloped: [],
  };

  for (let i = 0; i < walls.length; i++) {
    const w = walls[i];
    const info = wallInfo(w);
    if (!info.hasSlope && !(info.depthOneSlope > 0)) continue;
    const entry = {
      i,
      ...info,
      meshes: collectPresenterMeshes(app, w),
    };
    // сырые ключи объекта стены (имена методов/полей со slope)
    try {
      const proto = Object.getPrototypeOf(w) || {};
      entry.methods = Object.getOwnPropertyNames(proto)
        .filter((n) => /slope|Slope|height|Height|depth|Depth|angle|Angle|thick/i.test(n))
        .slice(0, 80);
    } catch (_) {}
    report.sloped.push(entry);
  }

  // selection fallback
  try {
    const sel = app.viewer.selection.getSelection();
    report.selection = (sel || []).map((s) => ({
      hasModel: !!s.model,
      info: s.model ? wallInfo(s.model) : null,
    }));
  } catch (_) {}

  console.log('[slope-probe] RESULT — скопируй весь объект ниже:');
  console.log(JSON.stringify(report, null, 2));
  try {
    copy(JSON.stringify(report, null, 2));
    console.log('[slope-probe] уже в clipboard (copy)');
  } catch (_) {
    console.log('[slope-probe] copy() недоступен — выдели JSON вручную');
  }
  window.__IKEA_SLOPE_PROBE__ = report;
  return report;
})();
