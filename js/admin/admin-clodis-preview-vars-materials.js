/**
 * admin-clodis-preview-vars-materials.js — sync vars/materials to Clodis iframe preview
 * Extracted from admin-new.html for better Cursor performance
 */
(function() {
  'use strict';

  function buildMaterialsPayloadFallback() {
    // fallback — повторяем логику локально
    const lib = window.__cldMaterialsLib;
    const st = window.__cldMaterialsState || { groupOverrides: {} };
    const out = {};
    for (const g of (lib?.groups || [])) {
      const key = g?.key;
      if (!key) continue;
      const ov = st.groupOverrides?.[key] || {};
      const materialKey = ov.material_key || g.material || 'ldsp';
      const materialId = ov.material_id || 0;
      const thickness = Number(ov.thickness ?? g.thickness ?? 16);
      out[key] = { thickness, material: { key: materialKey, id: materialId, variant_id: 0 } };
    }
    if (!out.g0) {
      const ov0 = st.groupOverrides?.g0 || {};
      out.g0 = {
        thickness: Number(ov0.thickness ?? 16),
        material: { key: ov0.material_key || 'material_2', id: ov0.material_id || 0, variant_id: 0 },
      };
    }
    const g0t = out.g0?.thickness ?? 16;
    return { vars: { _wt: Number(g0t) || 16 }, materials: out };
  }

  /** Есть ли в дереве (clodisJSON / constructor_structure / DOM) секция/модуль с ролью corpus_antresol. */
  function __cldTreeHasCorpusAntresolRole(root) {
    const norm = (raw) =>
      typeof window.__cldNormalizeSectionLayoutRole === 'function'
        ? window.__cldNormalizeSectionLayoutRole(raw)
        : String(raw == null ? '' : raw).trim();
    const stack = [];
    const pp = root?.nodeData?.clodisJSON;
    if (Array.isArray(pp)) stack.push(...pp);
    const cs = root?.nodeData?.constructor_structure;
    if (cs && typeof cs === 'object') {
      const tpl = cs.template?.structure;
      if (Array.isArray(tpl)) stack.push(...tpl);
      const spec = cs.spec?.template?.tree;
      if (Array.isArray(spec)) stack.push(...spec);
      if (Array.isArray(cs.children)) stack.push(...cs.children);
    }
    while (stack.length) {
      const n = stack.pop();
      if (!n || typeof n !== 'object') continue;
      if (norm(n.layout_role ?? n.sectionLayoutRole ?? '') === 'corpus_antresol') return true;
      if (Array.isArray(n.children)) stack.push(...n.children);
    }
    // Фолбэк: дерево JSON ещё не пересобрано — пробежать живой DOM.
    try {
      const domStack = [root];
      while (domStack.length) {
        const el = domStack.pop();
        if (!el) continue;
        const nd = el.nodeData;
        if (nd && norm(nd.sectionLayoutRole ?? nd.layout_role ?? '') === 'corpus_antresol') return true;
        const wrap = el.querySelector?.(':scope > .tree-node-children');
        if (!wrap) continue;
        const kids = wrap.children ? Array.from(wrap.children) : [];
        for (const k of kids) {
          if (k && k.classList && k.classList.contains('constructor-tree-node')) domStack.push(k);
        }
      }
    } catch (_) {}
    return false;
  }

  function __cldTreeHasFacadeShellRole(root) {
    const norm = (raw) =>
      typeof window.__cldNormalizeSectionLayoutRole === 'function'
        ? window.__cldNormalizeSectionLayoutRole(raw)
        : String(raw == null ? '' : raw).trim();
    const facadeRoles = new Set(['facades', 'facades_main', 'facades_top']);
    const stack = [];
    const pp = root?.nodeData?.clodisJSON;
    if (Array.isArray(pp)) stack.push(...pp);
    const cs = root?.nodeData?.constructor_structure;
    if (cs && typeof cs === 'object') {
      const tpl = cs.template?.structure;
      if (Array.isArray(tpl)) stack.push(...tpl);
      const spec = cs.spec?.template?.tree;
      if (Array.isArray(spec)) stack.push(...spec);
      if (Array.isArray(cs.children)) stack.push(...cs.children);
    }
    while (stack.length) {
      const n = stack.pop();
      if (!n || typeof n !== 'object') continue;
      if (facadeRoles.has(norm(n.layout_role ?? n.sectionLayoutRole ?? ''))) return true;
      if (Array.isArray(n.children)) stack.push(...n.children);
    }
    try {
      const domStack = [root];
      while (domStack.length) {
        const el = domStack.pop();
        if (!el) continue;
        const nd = el.nodeData;
        if (nd && facadeRoles.has(norm(nd.sectionLayoutRole ?? nd.layout_role ?? ''))) return true;
        const wrap = el.querySelector?.(':scope > .tree-node-children');
        if (!wrap) continue;
        const kids = wrap.children ? Array.from(wrap.children) : [];
        for (const k of kids) {
          if (k && k.classList && k.classList.contains('constructor-tree-node')) domStack.push(k);
        }
      }
    } catch (_) {}
    return false;
  }

  function readModuleVars() {
    const root = document.getElementById('constructor-root-module');
    const out = {};

    // Legacy format: variables.main
    const main = root?.nodeData?.variables?.main;
    if (main && typeof main === 'object') {
      for (const [k, v] of Object.entries(main)) {
        const key = String(k || '').trim();
        if (!key || key === '_wt') continue;
        const n = Number(v);
        if (!Number.isFinite(n)) continue;
        out[key] = n;
      }
    }

    // Current format after migration: variables.groups[].vars[]
    const groups = root?.nodeData?.variables?.groups;
    if (Array.isArray(groups)) {
      for (const g of groups) {
        if (!g || g.enabled === false) continue;
        for (const v of (g.vars || [])) {
          if (!v || v.enabled === false) continue;
          const key = String(v.key || '').trim();
          if (!key || key === '_wt') continue;
          if (Object.prototype.hasOwnProperty.call(out, key)) continue;
          const cur = Number(v.value);
          const def = Number(v.default);
          const n = Number.isFinite(cur) ? cur : (Number.isFinite(def) ? def : NaN);
          if (!Number.isFinite(n)) continue;
          out[key] = n;
        }
      }
    }

    // Фолбэк (паритет с save: admin-new-bundle ~line 12550 / extractModuleVariablesFromFurnitureData):
    // если у элемента в дереве есть роль corpus_antresol, но переменная не задана (часто бывает,
    // когда constructor_structure.variables.main потерял её при ре-сохранении), подставляем 1950.
    // Без этого секция top "Антресоль" с формулой
    //   s:y - v:h_bottom - v:corpus_antresol_mm - v:tech_zone_mm
    // вычисляется ≈ s:y - h_bottom и растягивается на всю высоту корня.
    if (!Number.isFinite(Number(out.corpus_antresol_mm)) || Number(out.corpus_antresol_mm) <= 0) {
      try {
        if (__cldTreeHasCorpusAntresolRole(root)) {
          out.corpus_antresol_mm = 1950;
        }
      } catch (_) {}
    }

    if (!Number.isFinite(Number(out.facade_thickness_mm)) || Number(out.facade_thickness_mm) <= 0) {
      try {
        if (__cldTreeHasFacadeShellRole(root)) {
          out.facade_thickness_mm = 16;
        }
      } catch (_) {}
    }

    return out;
  }

  /**
   * Синхронизация vars/materials в iframe превью.
   * @param {HTMLIFrameElement} iframe
   */
  function syncVarsMaterialsToIframe(iframe) {
    if (!iframe || !iframe.contentWindow) return;

    // Включаем отладку материалов в iframe, если включен общий debug в админке
    if (window.__CLD_DEBUG || window.__CLD_DEBUG_MATERIALS) {
      iframe.contentWindow.postMessage({ type: 'cld:setDebug', flags: { materials: true } }, '*');
    }

    const payload = (typeof window.__cldBuildMaterialsPayload === 'function')
      ? window.__cldBuildMaterialsPayload()
      : (window.__cldMaterialsLib ? buildMaterialsPayloadFallback() : { vars: { _wt: 16 }, materials: {} });

    // Переменные модуля (из вкладки "Переменные") добавляем в ctx.vars,
    // но НЕ перетираем системный _wt (он идёт из материалов g0 и управляет толщиной).
    const moduleVars = readModuleVars();
    const mergedVars = { ...(moduleVars || {}), ...(payload.vars || {}) };

    iframe.contentWindow.postMessage({ type: 'cld:setVars', vars: mergedVars }, '*');
    iframe.contentWindow.postMessage({ type: 'cld:setMaterials', materials: payload.materials || {} }, '*');

    if (window.__CLD_DEBUG) {
      const thickIn = document.getElementById('catalog-constructor-property-material-thickness');
      console.log('[CLD][preview-sync] -> iframe vars/materials', {
        vars: mergedVars,
        g0: payload.materials?.g0,
        groups: Object.keys(payload.materials || {}),
        hasBuilder: typeof window.__cldBuildMaterialsPayload === 'function',
        hasLib: !!window.__cldMaterialsLib,
        g0t: payload.materials?.g0?.thickness,
        uiThickness: thickIn?.value,
        moduleVars,
      });
    }

    // Если библиотека материалов ещё не загрузилась — догружаем и пересинхронизируем (один раз).
    if (!window.__cldMaterialsLib && !window.__cldMaterialsLoading && typeof window.__cldEnsureMaterialsLoaded === 'function') {
      window.__cldEnsureMaterialsLoaded()
        .then(() => {
          if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
        })
        .catch(() => {});
    }
  }

  window.__cldSyncPreviewVarsMaterialsToIframe = syncVarsMaterialsToIframe;
})();

