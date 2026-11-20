/**
 * IKEA Kitchen — probe углового шкафа (поворот / linear / product).
 *
 * 1) Открой kitchen.planner.ikea.com → комната с угловым.
 * 2) F12 → Console → frame: Kitchen / ikea-prod.by.me (НЕ верхний planner.ikea.com).
 * 3) Вставь этот файл, Enter.
 * 4) Выдели угловой → window.__CLD_CORNER.dump()
 * 5) Нажми поворот в UI → снова dump() — сравни transfo / angle.
 */
(function ikeaCornerProbe() {
  'use strict';
  const api = (window.__CLD_CORNER = window.__CLD_CORNER || {});

  function findApp() {
    const keys = Object.keys(window);
    for (const k of keys) {
      try {
        const v = window[k];
        if (v && v.viewer && v.getAppStates && v._currentState) return v;
        if (v && v.app && v.app.viewer) return v.app;
      } catch (_) {}
    }
    // react / by.me common paths
    try {
      if (window.app && window.app.viewer) return window.app;
    } catch (_) {}
    return null;
  }

  function matSummary(tr) {
    if (!tr) return null;
    try {
      const e = tr.elements || tr;
      const arr = Array.isArray(e) ? e : e?.elements || null;
      if (arr && arr.length >= 16) {
        const a = [...arr].map((x) => +Number(x).toFixed(4));
        const ang = Math.atan2(a[1], a[0]);
        return {
          pos: { x: a[12], y: a[13], z: a[14] },
          yawRad: +ang.toFixed(4),
          yawDeg: +((ang * 180) / Math.PI).toFixed(2),
          m00: a[0],
          m10: a[1],
        };
      }
      if (tr.getPosition) {
        const p = tr.getPosition();
        return { pos: { x: +p.x, y: +p.y, z: +p.z } };
      }
    } catch (e) {
      return { err: String(e.message || e) };
    }
    return { rawType: typeof tr };
  }

  function productBrief(f) {
    const pi = f?.productInfo || f?.product || null;
    const tags = pi?.tags || f?.tags || null;
    return {
      name: pi?.name || pi?.title || f?.name || null,
      id: pi?.id || pi?.productId || null,
      tagsType: tags?.type || null,
      width: f?.getParameter ? undefined : null,
    };
  }

  api.dump = function dump() {
    const app = findApp();
    const out = {
      t: Date.now(),
      hasApp: !!app,
      selected: [],
      cornerFurnitures: [],
      notes: [],
    };
    if (!app) {
      out.notes.push('app not found — switch DevTools frame to Kitchen/ikea-prod.by.me');
      console.warn('[CLD-CORNER]', out);
      return out;
    }
    try {
      const sel = app.viewer?.selection || app.viewer?.getSelection?.() || [];
      const list = Array.isArray(sel) ? sel : [];
      for (const s of list) {
        const model = s?.model || s;
        out.selected.push({
          ctor: model?.constructor?.name || null,
          product: productBrief(model),
          transfo: matSummary(model?.transfo),
          hasCornerHint:
            String(productBrief(model).name || '').toLowerCase().includes('corner') ||
            String(JSON.stringify(productBrief(model).tagsType || '')).includes('Corner'),
        });
      }
    } catch (e) {
      out.notes.push('selection: ' + e);
    }
    try {
      const level = app.viewer?.getLevel?.() || app._currentState?._level || null;
      const furn = level?.getFurnitures?.() || [];
      for (const f of furn) {
        const brief = productBrief(f);
        const name = String(brief.name || '').toLowerCase();
        const tagStr = JSON.stringify(brief.tagsType || '');
        if (/corner/i.test(name) || /Corner/i.test(tagStr)) {
          out.cornerFurnitures.push({
            product: brief,
            transfo: matSummary(f.transfo),
          });
        }
      }
    } catch (e) {
      out.notes.push('furnitures: ' + e);
    }
    console.log('%c[CLD-CORNER] dump', 'color:#0a7', out);
    return out;
  };

  console.warn('[CLD-CORNER] ready — select corner cabinet, then __CLD_CORNER.dump()');
  return api;
})();
