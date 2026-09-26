/**
 * admin-preview-bridge.js — единый мост admin ↔ iframe превью.
 *
 * Контракт:
 * - DOM админки = source of truth для дерева.
 * - Iframe только рисует (cld:setTemplateTree + sizeMm).
 * - Обратно в DOM — только явный pull (cld:pullClodisJSON → cld:clodisJSONReady с requestId).
 *
 * Sync-ядро (hydrate + postMessage tree) регистрирует бандл через adoptSyncCore.
 * Этот файл владеет mount, listener, API и entry-point __ppPostModuleToIframe.
 */
(function () {
  'use strict';

  const PREVIEW_V = '20260923-hinge-prev2';
  const PREVIEW_SRC = '/constructor-clodis.html?embedded=1&v=' + PREVIEW_V;

  let syncCore = null;

  function getIframe() {
    return window.__ppPreviewIframe || null;
  }

  function setIframe(iframe) {
    window.__ppPreviewIframe = iframe;
  }

  function installJsonReadyListener() {
    if (window.__ppClodisJsonReadyListenerAttached) return;
    window.__ppClodisJsonReadyListenerAttached = true;
    window.addEventListener('message', function onClodisJSONReady(ev) {
      if (ev?.data?.type !== 'cld:clodisJSONReady' || !Array.isArray(ev?.data?.clodisJSON)) return;
      const clodisJSON = ev.data.clodisJSON;
      const isPull =
        ev.data.pull === true ||
        (ev.data.requestId != null && String(ev.data.requestId) !== '') ||
        window.__ppAllowIframeTreePull === true;
      try {
        const rootModule = document.getElementById('constructor-root-module');
        if (rootModule) {
          rootModule.nodeData = rootModule.nodeData || {};
          rootModule.nodeData.clodisJSON = clodisJSON;
        }
      } catch (_) {}
      if (!isPull) return;
      window.__ppAllowIframeTreePull = false;
      window.__ppSuppressSyncUntil = Date.now() + 1500;
      if (typeof window.__cldInitConstructorTab === 'function') window.__cldInitConstructorTab();
      if (typeof window.loadConstructorTreeFromJSON === 'function') {
        window.loadConstructorTreeFromJSON({
          name: (document.getElementById('catalog-item-edit-name')?.value || '').trim() || undefined,
          template: { structure: clodisJSON },
        });
      }
    });
  }

  function forceEmptyPreview() {
    const iframe = getIframe();
    if (!iframe || !iframe.contentWindow) return;
    const wIn = document.getElementById('catalog-item-edit-width');
    const hIn = document.getElementById('catalog-item-edit-height');
    const dIn = document.getElementById('catalog-item-edit-depth');
    const w = wIn ? Number(wIn.value) || 300 : 300;
    const h = hIn ? Number(hIn.value) || 400 : 400;
    const d = dIn ? Number(dIn.value) || 200 : 200;
    try {
      iframe.contentWindow.postMessage({ type: 'cld:setPreviewDoorsOpen', open: false }, '*');
    } catch (_) {}
    try {
      iframe.contentWindow.postMessage(
        { type: 'cld:setTemplateTree', tree: [], structure: [], sizeMm: { w, h, d } },
        '*'
      );
    } catch (_) {}
  }

  function post(forceSync) {
    if (window.__cldAllowPreviewMount !== true) return;
    if (window.__ppSuppressPreviewSyncDuringTreeLoad && forceSync !== true) return;
    // Пока пользователь не на вкладке Конструктор — не гоняем hydrate/rebuild.
    try {
      const ctorActive = !!document.querySelector(
        '#catalog-item-edit .tab_menu_h li[data-tab="constructor"].active'
      );
      if (!ctorActive && forceSync !== 'force-hidden') return;
    } catch (_) {}
    const iframe = getIframe();
    if (!iframe || !iframe.contentWindow) return;
    const force = forceSync === true || forceSync === 'force-hidden';
    if (typeof syncCore === 'function') {
      return syncCore(force === true || forceSync === true);
    }
    if (typeof window.__ppSyncPreviewToIframeCore === 'function') {
      return window.__ppSyncPreviewToIframeCore(forceSync === true);
    }
  }

  function pullFromIframe() {
    const iframe = getIframe();
    if (!iframe || !iframe.contentWindow) return null;
    const requestId = 'pull_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    window.__ppAllowIframeTreePull = true;
    return new Promise((resolve) => {
      const t = setTimeout(() => {
        window.removeEventListener('message', onMsg);
        window.__ppAllowIframeTreePull = false;
        resolve(null);
      }, 4000);
      function onMsg(ev) {
        if (ev?.data?.type !== 'cld:clodisJSONReady') return;
        if (String(ev.data.requestId || '') !== requestId) return;
        clearTimeout(t);
        window.removeEventListener('message', onMsg);
        resolve(Array.isArray(ev.data.clodisJSON) ? ev.data.clodisJSON : []);
      }
      window.addEventListener('message', onMsg);
      try {
        iframe.contentWindow.postMessage({ type: 'cld:pullClodisJSON', requestId }, '*');
      } catch (_) {
        clearTimeout(t);
        window.removeEventListener('message', onMsg);
        window.__ppAllowIframeTreePull = false;
        resolve(null);
      }
    });
  }

  function ensureMounted() {
    const viewport = document.getElementById('viewport');
    if (!viewport) {
      console.error('[PREVIEW-BRIDGE] viewport не найден');
      return;
    }
    // Жёсткий стоп: без явного разрешения (__cldAllowPreviewMount) iframe не создаём.
    if (window.__cldAllowPreviewMount !== true) {
      try {
        if (typeof window.__cldShowPreviewPlaceholder === 'function') {
          window.__cldShowPreviewPlaceholder();
        }
      } catch (_) {}
      return;
    }
    try {
      const ctorActive = !!document.querySelector(
        '#catalog-item-edit .tab_menu_h li[data-tab="constructor"].active'
      );
      if (!ctorActive) return;
    } catch (_) {}
    viewport.setAttribute('data-preview', 'true');
    installJsonReadyListener();

    let iframe = getIframe();
    if (iframe) {
      if (window.__CLD_IS_NEW_MODULE === true) {
        forceEmptyPreview();
        return;
      }
      const curSrc = (iframe.getAttribute('src') || iframe.src || '').toString();
      const needReload = !curSrc.includes('v=' + PREVIEW_V);
      if (needReload) {
        try {
          window.__ppPreviewIframeReady = false;
        } catch (_) {}
        iframe.src = PREVIEW_SRC;
        const onReady = function (ev) {
          if (ev?.data?.type !== 'cld:iframeReady') return;
          window.__ppPreviewIframeReady = true;
          window.removeEventListener('message', onReady);
          // Sync после ready — в следующем тике, чтобы UI не клинил.
          setTimeout(() => post(true), 0);
        };
        window.addEventListener('message', onReady);
      } else {
        setTimeout(() => post(true), 0);
      }
      return;
    }

    viewport.innerHTML = '';
    iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Clodis Preview');
    iframe.setAttribute('loading', 'lazy');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';
    iframe.style.display = 'block';
    iframe.src = PREVIEW_SRC;
    setIframe(iframe);
    viewport.appendChild(iframe);

    window.addEventListener('message', function onReady(ev) {
      if (ev?.data?.type !== 'cld:iframeReady') return;
      window.__ppPreviewIframeReady = true;
      window.removeEventListener('message', onReady);
      setTimeout(() => post(true), 0);
    });

    iframe.addEventListener('load', function () {
      if (!window.__ppPreviewIframeReady) setTimeout(() => post(true), 0);
    });
  }

  function adoptSyncCore(fn) {
    if (typeof fn === 'function') syncCore = fn;
  }

  function takeOwnership() {
    installJsonReadyListener();
    // Entry-points: все старые вызовы идут сюда.
    window.__ppPostModuleToIframe = post;
    window.__ppSyncPreviewToIframe = post;
    window.ensureClodisPreviewMounted = ensureMounted;
    window.__cldForceEmptyPreviewIframe = forceEmptyPreview;
    window.__cldPreviewBridgeOwnsSync = true;
  }

  const bridge = {
    post,
    ensureMounted,
    pullFromIframe,
    forceEmpty: forceEmptyPreview,
    adoptSyncCore,
    takeOwnership,
    installJsonReadyListener,
    previewSrc: PREVIEW_SRC,
    version: PREVIEW_V,
  };

  window.__cldPreviewBridge = bridge;
  window.__cldPreviewBridgeInstallJsonReadyListener = installJsonReadyListener;
  window.__cldPullClodisJSONFromPreview = pullFromIframe;

  // Если бандл уже успел повесить core — подхватим после небольшой отсрочки.
  function tryAdoptExistingCore() {
    if (typeof window.__ppSyncPreviewToIframeCore === 'function') {
      adoptSyncCore(window.__ppSyncPreviewToIframeCore);
    }
    takeOwnership();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(tryAdoptExistingCore, 0));
  } else {
    setTimeout(tryAdoptExistingCore, 0);
  }
})();
