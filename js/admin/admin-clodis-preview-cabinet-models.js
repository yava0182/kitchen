/**
 * admin-clodis-preview-cabinet-models.js — каталог cabinet_model → iframe (cld:setCabinetModelLibrary)
 * Формат items как в constructor-clodis.js __ensureCabinetModelLibraryMap: { [id]: { params } }
 */
(function () {
  'use strict';

  let __cldCabModelLibCache = null;
  let __cldCabModelLibFetchPromise = null;

  function slotFitEnabled(sf) {
    if (!sf || typeof sf !== 'object') return false;
    if (sf.enabled === false || sf.enabled === 0) return false;
    const axes = ['x', 'y', 'z'];
    const s = sf.s && typeof sf.s === 'object' ? sf.s : {};
    const t = sf.t && typeof sf.t === 'object' ? sf.t : {};
    return axes.some((ax) => Number(s[ax]) || Number(t[ax]));
  }

  function mergeModelVariantParams(base, overlay) {
    if (!overlay || typeof overlay !== 'object') return base;
    if (!base || typeof base !== 'object') return overlay;
    const out = { ...base, ...overlay };
    if (base.params || overlay.params) {
      out.params = { ...(base.params || {}), ...(overlay.params || {}) };
      const bsf = base.params && base.params.slot_fit;
      const osf = overlay.params && overlay.params.slot_fit;
      if (osf && !slotFitEnabled(bsf)) {
        out.params.slot_fit = osf;
      }
      const bc = base.params && base.params.companions;
      const oc = overlay.params && overlay.params.companions;
      if (oc && oc.enabled && (!bc || !bc.enabled)) {
        out.params.companions = oc;
      }
    }
    return out;
  }

  function mergeCabinetModelLibraryEntry(baseEntry, overlayEntry) {
    if (!overlayEntry || !overlayEntry.params || typeof overlayEntry.params !== 'object') return baseEntry;
    if (!baseEntry || !baseEntry.params || typeof baseEntry.params !== 'object') return overlayEntry;
    const baseParams = baseEntry.params;
    const overlayParams = overlayEntry.params;
    const merged = { params: { ...baseParams, ...overlayParams } };
    const overlayModels = Array.isArray(overlayParams.models) ? overlayParams.models : null;
    if (overlayModels && overlayModels.length) {
      const baseModels = Array.isArray(baseParams.models) ? baseParams.models : [];
      merged.params.models = overlayModels.map(function (om, i) {
        return mergeModelVariantParams(baseModels[i], om);
      });
      if (baseModels.length > overlayModels.length) {
        merged.params.models = merged.params.models.concat(baseModels.slice(overlayModels.length));
      }
    }
    return merged;
  }

  function enrichCabinetModelMapFromLocal(map) {
    return fetch('/catalog_items/cabinet_model.json', { cache: 'no-store' })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (local) {
        if (!local || !map) return map;
        const localItems = Array.isArray(local)
          ? local
          : Array.isArray(local.items)
            ? local.items
            : [];
        for (let i = 0; i < localItems.length; i++) {
          const it = localItems[i];
          const id = String(it && it.id != null ? it.id : '').trim();
          if (!id) continue;
          let params = it.params;
          if (!params && it.data != null) {
            try {
              const d = typeof it.data === 'string' ? JSON.parse(it.data) : it.data;
              params = (d && d.params) || d;
            } catch (_) {
              params = {};
            }
          }
          const overlay = { params: params && typeof params === 'object' ? params : {} };
          if (map[id]) {
            map[id] = mergeCabinetModelLibraryEntry(map[id], overlay);
          } else {
            map[id] = overlay;
          }
        }
        return map;
      })
      .catch(function () {
        return map;
      });
  }

  function buildCabinetModelItemsMapFromPayload(payload) {
    const map = Object.create(null);
    const items = Array.isArray(payload && payload.items) ? payload.items : [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const id = String(it && it.id != null ? it.id : '').trim();
      if (!id) continue;
      let params = it.params;
      if (!params && it.data != null) {
        try {
          const d = typeof it.data === 'string' ? JSON.parse(it.data) : it.data;
          params = (d && d.params) || d;
        } catch (_) {
          params = {};
        }
      }
      map[id] = { params: params && typeof params === 'object' ? params : {} };
    }
    return map;
  }

  function fetchCabinetModelLibraryMap() {
    if (window.__cldCabinetModelLibraryItemsOverride && typeof window.__cldCabinetModelLibraryItemsOverride === 'object') {
      return Promise.resolve(window.__cldCabinetModelLibraryItemsOverride);
    }
    if (__cldCabModelLibCache) return Promise.resolve(__cldCabModelLibCache);
    if (__cldCabModelLibFetchPromise) return __cldCabModelLibFetchPromise;
    __cldCabModelLibFetchPromise = fetch('/api/catalog/items_get/cabinet_model', { cache: 'no-store' })
      .then(function (r) {
        return r.ok ? r.json() : { items: [] };
      })
      .then(function (payload) {
        const map = buildCabinetModelItemsMapFromPayload(payload);
        return enrichCabinetModelMapFromLocal(map);
      })
      .then(function (map) {
        __cldCabModelLibCache = map;
        __cldCabModelLibFetchPromise = null;
        return map;
      })
      .catch(function () {
        __cldCabModelLibFetchPromise = null;
        return null;
      });
    return __cldCabModelLibFetchPromise;
  }

  /**
   * @param {HTMLIFrameElement} iframe
   */
  function syncCabinetModelLibraryToIframe(iframe) {
    if (!iframe || !iframe.contentWindow) return;
    fetchCabinetModelLibraryMap().then(function (map) {
      if (!map || !iframe.contentWindow) return;
      iframe.contentWindow.postMessage({ type: 'cld:setCabinetModelLibrary', items: map }, '*');
      if (window.__CLD_DEBUG) {
        console.log('[CLD][preview-sync] -> iframe cabinet_model library', { count: Object.keys(map).length });
      }
    });
  }

  window.__cldBuildCabinetModelLibraryMapFromPayload = buildCabinetModelItemsMapFromPayload;
  window.__cldInvalidateCabinetModelLibraryCache = function () {
    __cldCabModelLibCache = null;
    __cldCabModelLibFetchPromise = null;
    try {
      if (window.__cldRoomCabinetModels && typeof window.__cldRoomCabinetModels.invalidateLibraryCache === 'function') {
        window.__cldRoomCabinetModels.invalidateLibraryCache();
      }
    } catch (_) {}
  };
  window.__cldSyncPreviewCabinetModelLibraryToIframe = syncCabinetModelLibraryToIframe;
})();
