// Debug probe for admin-new.html.
// Purpose: guarantee visible console signal + W/H/D change tracing even if the main bundle fails early.
(function () {
  try {
    // console.error — чтобы было видно даже при жёстких фильтрах уровней в консоли
    console.log('[CLD][probe] admin-debug-probe.js loaded v=20260319-10');
    window.__CLD_PROBE_LOADED = '20260319-10';
  } catch (_) {}

  // Probe — это временный диагностический инструмент. Чтобы он не мешал основным логам реанкора из бандла,
  // авто-поллинг и авто-реанкор включаются только явным флагом window.__CLD_PROBE_ENABLED = true.
  const shouldLog = () =>
    !!(window.__CLD_PROBE_ENABLED && (window.__CLD_DEBUG_REANCHOR || window.__CLD_DBG_REANCHOR));

  function __cldPickVisibleInputById(id) {
    try {
      const all = Array.from(document.querySelectorAll(`#${CSS.escape(id)}`));
      if (!all.length) return null;
      // prefer visible, enabled, type=number/text inputs
      const isVisible = (el) => {
        if (!el) return false;
        if (el.disabled) return false;
        // offsetParent null => display:none or detached (except fixed); also check rect
        const r = el.getBoundingClientRect?.();
        const hasBox = r && (r.width > 0 || r.height > 0);
        const notHidden = el.type !== 'hidden' && el.getAttribute('type') !== 'hidden';
        return notHidden && hasBox;
      };
      const visible = all.find(isVisible);
      return visible || all[0] || null;
    } catch (_) {
      return document.getElementById(id) || null;
    }
  }

  function __cldReanchorApply(prev, next) {
    try {
      const __dbg = shouldLog();
      const rootEl = document.getElementById('constructor-root-module');
      if (!rootEl) {
        if (__dbg) console.log('[CLD][reanchor][probe] no constructor-root-module; skip');
        return { ok: false, reason: 'no-root' };
      }
      rootEl.nodeData = rootEl.nodeData || {};

      const hasPrev = prev && Number(prev.x) > 0 && Number(prev.y) > 0 && Number(prev.z) > 0;
      const hasNext = next && Number(next.x) > 0 && Number(next.y) > 0 && Number(next.z) > 0;
      const shouldReanchor =
        hasPrev &&
        hasNext &&
        (Number(prev.x) !== Number(next.x) || Number(prev.y) !== Number(next.y) || Number(prev.z) !== Number(next.z));

      const isNumericString = (s) => typeof s === 'string' && /^\s*-?\d+(?:\.\d+)?\s*$/.test(s);
      const adjustAxis = (posVal, anchorVal, prevSize, nextSize) => {
        const isNum = typeof posVal === 'number' && Number.isFinite(posVal);
        const isNumStr = isNumericString(posVal);
        if (!isNum && !isNumStr) return posVal;
        const origWasString = typeof posVal === 'string';
        const n = isNum ? posVal : parseFloat(String(posVal).trim());
        if (!Number.isFinite(n)) return posVal;
        const a = Number(anchorVal);
        let out = n;
        if (a === 1) out = n + (nextSize - prevSize); // держим расстояние до max-грани
        else if (a === 0) out = n + (nextSize - prevSize) / 2; // держим расстояние до центра
        // -1: держим расстояние до min-грани

        if (!origWasString) return out;
        const rounded = Math.abs(out - Math.round(out)) < 1e-9 ? String(Math.round(out)) : String(out);
        return rounded;
      };

      const adjustSizeAxis = (sizeVal, delta) => {
        const isNum = typeof sizeVal === 'number' && Number.isFinite(sizeVal);
        const isNumStr = isNumericString(sizeVal);
        if (!isNum && !isNumStr) return sizeVal;
        const origWasString = typeof sizeVal === 'string';
        const n = isNum ? sizeVal : parseFloat(String(sizeVal).trim());
        if (!Number.isFinite(n)) return sizeVal;
        const out = n + delta;
        if (!origWasString) return out;
        const rounded = Math.abs(out - Math.round(out)) < 1e-9 ? String(Math.round(out)) : String(out);
        return rounded;
      };

      if (!shouldReanchor) {
        if (__dbg) console.log('[CLD][reanchor][probe] skipped', { prev, next, hasPrev, hasNext, shouldReanchor });
        rootEl.nodeData.__cldLastMainSizeMm = { x: Number(next.x) || 0, y: Number(next.y) || 0, z: Number(next.z) || 0 };
        return { ok: false, reason: 'no-diff' };
      }

      const dX = Number(next.x) - Number(prev.x);
      const dY = Number(next.y) - Number(prev.y);
      const dZ = Number(next.z) - Number(prev.z);

      const nodes = Array.from(document.querySelectorAll('.constructor-tree-node'));
      let nodesTotal = nodes.length;
      let nodesWithPos = 0;
      let nodesAdjusted = 0;
      let sizeCandidatesX = 0;
      let sizeCandidatesY = 0;
      let sizeResizedX = 0;
      let sizeResizedY = 0;
      const examples = [];

      nodes.forEach((nodeEl) => {
        const nd = nodeEl?.nodeData;
        if (!nd || typeof nd !== 'object') return;
        const pos = nd.position;
        const anchor = nd.anchor;
        const size = nd.size;
        if (!pos || typeof pos !== 'object') return;
        if (!anchor || typeof anchor !== 'object') return;
        nodesWithPos++;

        const detailTypeId = String(
          nd.detailType ||
          nd.detailTypeId ||
          nd.spec?.detailTypeId ||
          nodeEl.getAttribute('data-detail-type') ||
          ''
        ).trim();
        const orient = String(nd.spec?.orientation || nd.orientation || '').trim(); // 'v' | 'h' | 'f'

        const before = { x: pos.x, y: pos.y, z: pos.z };
        const after = {
          x: adjustAxis(pos.x, anchor.x, Number(prev.x), Number(next.x)),
          y: adjustAxis(pos.y, anchor.y, Number(prev.y), Number(next.y)),
          z: adjustAxis(pos.z, anchor.z, Number(prev.z), Number(next.z)),
        };
        pos.x = after.x;
        pos.y = after.y;
        pos.z = after.z;

        // Перерасчёт размеров деталей (ключевой фикс "плывёт"):
        // Ориентируемся на spec.orientation (это реальный движковый признак), а не только на detailTypeId.
        // - v: стойки/боковины — растягиваем по Y
        // - h: полки/крышки — растягиваем по X
        // - f: фронт/зад — чаще всего зависит от X (ширина), иногда от Y (высота), но пока трогаем только X
        let sizeChanged = false;
        const sizeBefore = size && typeof size === 'object' ? { x: size.x, y: size.y, z: size.z } : null;
        if (size && typeof size === 'object' && detailTypeId) {
          // candidates counters (для диагностики)
          if (dX && (orient === 'h' || orient === 'f' || detailTypeId.startsWith('horizontal_') || detailTypeId.startsWith('front_') || detailTypeId.startsWith('back_'))) {
            sizeCandidatesX++;
          }
          if (dY && (orient === 'v' || detailTypeId.startsWith('vertical_'))) {
            sizeCandidatesY++;
          }

          if ((orient === 'v' || detailTypeId.startsWith('vertical_')) && dY) {
            const ny = adjustSizeAxis(size.y, dY);
            if (String(ny) !== String(size.y)) {
              size.y = ny;
              sizeChanged = true;
              sizeResizedY++;
            }
          }
          if ((orient === 'h' || detailTypeId.startsWith('horizontal_')) && dX) {
            const nx = adjustSizeAxis(size.x, dX);
            if (String(nx) !== String(size.x)) {
              size.x = nx;
              sizeChanged = true;
              sizeResizedX++;
            }
          }
          if ((orient === 'f' || detailTypeId.startsWith('front_') || detailTypeId.startsWith('back_')) && dX) {
            const nx = adjustSizeAxis(size.x, dX);
            if (String(nx) !== String(size.x)) {
              size.x = nx;
              sizeChanged = true;
              sizeResizedX++;
            }
          }
          // depth (Z) пока не трогаем: часто это сознательная ручная настройка
          void dZ;
        }

        const changed =
          String(before.x) !== String(after.x) ||
          String(before.y) !== String(after.y) ||
          String(before.z) !== String(after.z) ||
          sizeChanged;
        if (changed) {
          nodesAdjusted++;
          if (examples.length < 3) {
            const name = String(nd.name || nodeEl.getAttribute('data-node-name') || '').trim();
            const id = String(nd.id || nodeEl.getAttribute('data-node-id') || '').trim();
            const dt = String(nd.detailType || nd.spec?.detailTypeId || nodeEl.getAttribute('data-detail-type') || '').trim();
            examples.push({
              name: name || '(без имени)',
              id,
              detailTypeId: dt,
              orientation: orient,
              anchor: { x: anchor.x, y: anchor.y, z: anchor.z },
              before,
              after,
              ...(sizeBefore ? { sizeBefore, sizeAfter: { x: size.x, y: size.y, z: size.z } } : {}),
            });
          }
        }
      });

      rootEl.nodeData.__cldLastMainSizeMm = { x: Number(next.x) || 0, y: Number(next.y) || 0, z: Number(next.z) || 0 };

      if (__dbg) {
        console.log('[CLD][reanchor][probe]', {
          prev,
          next,
          delta: { dX, dY, dZ },
          nodesTotal,
          nodesWithPos,
          nodesAdjusted,
          sizeCandidatesX,
          sizeCandidatesY,
          sizeResizedX,
          sizeResizedY,
          examples,
        });
      }

      try {
        if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
      } catch (_) {}

      return { ok: true, nodesAdjusted };
    } catch (e) {
      try { console.warn('[CLD][reanchor][probe] failed', e); } catch (_) {}
      return { ok: false, reason: 'error' };
    }
  }

  function readSizes() {
    const wEl = __cldPickVisibleInputById('catalog-item-edit-width');
    const hEl = __cldPickVisibleInputById('catalog-item-edit-height');
    const dEl = __cldPickVisibleInputById('catalog-item-edit-depth');
    const w = wEl?.value ?? null;
    const h = hEl?.value ?? null;
    const d = dEl?.value ?? null;
    return { w, h, d, __els: { wEl, hEl, dEl } };
  }

  function attach() {
    try {
      document.addEventListener(
        'input',
        (e) => {
          if (!shouldLog()) return;
          const t = e?.target;
          const id = t && t.id ? String(t.id) : '';
          if (id === 'catalog-item-edit-width' || id === 'catalog-item-edit-height' || id === 'catalog-item-edit-depth') {
            console.log('[CLD][reanchor][probe] DOM input', { id, value: t.value });
          }
        },
        true
      );

      document.addEventListener(
        'change',
        (e) => {
          if (!shouldLog()) return;
          const t = e?.target;
          const id = t && t.id ? String(t.id) : '';
          if (id === 'catalog-item-edit-width' || id === 'catalog-item-edit-height' || id === 'catalog-item-edit-depth') {
            console.log('[CLD][reanchor][probe] DOM change', { id, value: t.value });
          }
        },
        true
      );
    } catch (_) {}

    // Poll fallback: catches changes even if events are swallowed.
    let last = readSizes();
    let didIntroLog = false;
    setInterval(() => {
      if (!shouldLog()) return;
      if (!didIntroLog) {
        didIntroLog = true;
        const { __els } = last;
        // console.error — чтобы было видно даже при фильтрах уровней
        console.error('[CLD][reanchor][probe] poll active', {
          found: { w: !!__els.wEl, h: !!__els.hEl, d: !!__els.dEl },
          ids: { w: __els.wEl?.id ?? null, h: __els.hEl?.id ?? null, d: __els.dEl?.id ?? null },
          values: { w: last.w, h: last.h, d: last.d },
        });
      }
      const cur = readSizes();
      if (cur.w !== last.w || cur.h !== last.h || cur.d !== last.d) {
        // console.error — чтобы было видно даже при фильтрах уровней
        console.error('[CLD][reanchor][probe] size poll change', { w: cur.w, h: cur.h, d: cur.d, prev: { w: last.w, h: last.h, d: last.d } });

        // ВАЖНО: если Vue/маски не генерят input/change, то реанкор-логика в бандле не срабатывает.
        // Принудительно диспатчим события на изменившихся полях (один раз на изменение).
        try {
          const changed = [];
          if (cur.w !== last.w && cur.__els.wEl) changed.push(cur.__els.wEl);
          if (cur.h !== last.h && cur.__els.hEl) changed.push(cur.__els.hEl);
          if (cur.d !== last.d && cur.__els.dEl) changed.push(cur.__els.dEl);

          for (const el of changed) {
            // guard, чтобы не спамить при частом поллинге
            const stamp = `${Date.now()}`;
            el.__cldProbeLastDispatchStamp = stamp;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
          if (changed.length) {
            console.error('[CLD][reanchor][probe] dispatched synthetic input/change', changed.map(e => e.id));
          }
        } catch (_) {}

        // И главное: применяем реанкор прямо здесь (без зависимости от бандла).
        try {
          const rootEl = document.getElementById('constructor-root-module');
          const prevMm = rootEl?.nodeData?.__cldLastMainSizeMm || null;
          const nextMm = { x: Number(cur.w) || 0, y: Number(cur.h) || 0, z: Number(cur.d) || 0 };
          __cldReanchorApply(prevMm, nextMm);
        } catch (_) {}

        last = cur;
      }
    }, 300);
  }

  // Ручной пинг — чтобы не зависеть от таймера/событий/уровней логов.
  // В консоли: window.__CLD_PROBE_PING()
  try {
    window.__CLD_PROBE_PING = () => {
      const cur = readSizes();
      const { __els } = cur;
      console.error('[CLD][probe] PING', {
        flags: { __CLD_DEBUG_REANCHOR: !!window.__CLD_DEBUG_REANCHOR, __CLD_DBG_REANCHOR: !!window.__CLD_DBG_REANCHOR },
        probeEnabled: !!window.__CLD_PROBE_ENABLED,
        found: { w: !!__els.wEl, h: !!__els.hEl, d: !!__els.dEl },
        picked: {
          wType: __els.wEl?.getAttribute?.('type') ?? null,
          hType: __els.hEl?.getAttribute?.('type') ?? null,
          dType: __els.dEl?.getAttribute?.('type') ?? null,
        },
        values: { w: cur.w, h: cur.h, d: cur.d },
      });
      return { w: cur.w, h: cur.h, d: cur.d };
    };

    // Ручной запуск реанкора.
    // В консоли: window.__CLD_REANCHOR_PROBE_NOW()
    window.__CLD_REANCHOR_PROBE_NOW = () => {
      const rootEl = document.getElementById('constructor-root-module');
      const prev = rootEl?.nodeData?.__cldLastMainSizeMm || null;
      const next = {
        x: Number(document.getElementById('catalog-item-edit-width')?.value) || 0,
        y: Number(document.getElementById('catalog-item-edit-height')?.value) || 0,
        z: Number(document.getElementById('catalog-item-edit-depth')?.value) || 0,
      };
      return __cldReanchorApply(prev, next);
    };
  } catch (_) {}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach, { once: true });
  } else {
    attach();
  }
})();
