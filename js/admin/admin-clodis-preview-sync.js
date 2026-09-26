/**
 * admin-clodis-preview-sync.js — главная функция синхронизации превью (size + tree + vars + materials)
 * Собирает все части и отправляет в iframe превью
 */
(function() {
  'use strict';

  function __cldIsLocalAdminHost() {
    try {
      const h = String(window.location.hostname || '');
      return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
    } catch (_) {
      return false;
    }
  }

  /** Сколько комплектующих в дереве и сколько с URL файла (GLB и т.д.) — для отладки превью. */
  function __cldCountAccessoriesInTree(nodes) {
    let accessoriesTotal = 0;
    let accessoriesWithFileUrl = 0;
    const sampleUrls = [];
    function walk(arr) {
      if (!Array.isArray(arr)) return;
      for (let i = 0; i < arr.length; i++) {
        const n = arr[i];
        if (!n || typeof n !== 'object') continue;
        const ac = n.accessories;
        if (Array.isArray(ac)) {
          accessoriesTotal += ac.length;
          for (let j = 0; j < ac.length; j++) {
            const a = ac[j];
            if (!a) continue;
            const u = a.modelUrl || a.glbUrl || a.glb || a.model3d || a.modelUrlFacade;
            if (u) {
              accessoriesWithFileUrl++;
              if (sampleUrls.length < 5) sampleUrls.push(String(u).slice(0, 120));
            }
          }
        }
        if (Array.isArray(n.children)) walk(n.children);
      }
    }
    walk(nodes);
    return { accessoriesTotal, accessoriesWithFileUrl, sampleUrls };
  }

  /**
   * Главная функция синхронизации превью: собирает размеры, дерево, переменные и материалы,
   * и отправляет всё в iframe превью.
   * Эта функция должна вызываться после загрузки модуля, изменения размеров, дерева или материалов.
   */
  function postModuleToIframe() {
    const iframe = window.__ppPreviewIframe;
    const logPreview = window.__CLD_DEBUG === true || __cldIsLocalAdminHost();
    if (!iframe || !iframe.contentWindow) {
      if (logPreview) {
        console.warn('[CLD][preview-sync] iframe превью не готов (откройте вкладку Конструктор)');
      }
      return;
    }
    if (logPreview) {
      console.info('[CLD][preview-sync] синхронизация превью → iframe (логи localhost: и здесь, и во frame constructor-clodis)');
    }

    // 1. Размеры модуля
    if (typeof window.__cldSyncPreviewSizeToIframe === 'function') {
      try {
        const size = window.__cldSyncPreviewSizeToIframe(iframe);
        if (window.__CLD_DEBUG) {
          console.log('[CLD][preview-sync] размеры отправлены:', size);
        }
      } catch (e) {
        console.error('[CLD][preview-sync] ошибка синхронизации размеров:', e);
      }
    }

    // 2. Переменные и материалы — отправляем ПЕРЕД деревом,
    // чтобы формулы v:* (h_bottom/h_top) корректно применялись на первом рендере.
    if (typeof window.__cldSyncPreviewVarsMaterialsToIframe === 'function') {
      try {
        window.__cldSyncPreviewVarsMaterialsToIframe(iframe);
        if (window.__CLD_DEBUG) {
          console.log('[CLD][preview-sync] переменные и материалы отправлены');
        }
      } catch (e) {
        console.error('[CLD][preview-sync] ошибка синхронизации переменных/материалов:', e);
      }
    }

    // 3. Дерево структуры (template.structure)
    if (typeof window.__cldBuildPreviewTree === 'function') {
      try {
        const { tree, hasTree } = window.__cldBuildPreviewTree();
        if (logPreview) {
          const acc = __cldCountAccessoriesInTree(Array.isArray(tree) ? tree : []);
          console.info('[CLD][preview-sync] дерево для iframe:', {
            treeLength: Array.isArray(tree) ? tree.length : 0,
            hasTree,
            accessoriesTotal: acc.accessoriesTotal,
            accessoriesWithFileUrl: acc.accessoriesWithFileUrl,
            sampleModelUrls: acc.sampleUrls,
            hint:
              acc.accessoriesWithFileUrl === 0
                ? 'В дереве нет accessories с modelUrl/glb — превью не сможет подтянуть ваши GLB. Добавьте файл в комплектующем и сохраните элемент.'
                : undefined,
          });
        }

        if (typeof window.__cldSyncPreviewTemplateTreeToIframe === 'function') {
          window.__cldSyncPreviewTemplateTreeToIframe(iframe, tree);
          if (window.__CLD_DEBUG) {
            console.log('[CLD][preview-sync] дерево отправлено в iframe');
          }
        } else {
          console.warn('[CLD][preview-sync] __cldSyncPreviewTemplateTreeToIframe не найдена');
        }
      } catch (e) {
        console.error('[CLD][preview-sync] ошибка синхронизации дерева:', e);
      }
    } else {
      console.warn('[CLD][preview-sync] __cldBuildPreviewTree не найдена');
    }

    // 3.1 Каталог 3D (cabinet_model) для узлов type:model / петли в iframe
    if (typeof window.__cldSyncPreviewCabinetModelLibraryToIframe === 'function') {
      try {
        window.__cldSyncPreviewCabinetModelLibraryToIframe(iframe);
        if (window.__CLD_DEBUG) {
          console.log('[CLD][preview-sync] запрошена отправка cabinet_model в iframe');
        }
      } catch (e) {
        console.error('[CLD][preview-sync] ошибка синхронизации cabinet_model:', e);
      }
    }

    if (logPreview) {
      console.info('[CLD][preview-sync] готово');
    }
  }

  // Legacy helper: НЕ перетираем __ppPostModuleToIframe — владелец = admin-preview-bridge / бандл.
  // Оставляем только именованный API для отладки и тонких вызовов.
  window.__cldLegacyPostModuleToIframe = postModuleToIframe;
  window.__cldPostModuleToIframeParts = postModuleToIframe;

  if (typeof window.__cldDebouncePreviewSync === 'function') {
    const debouncedPost = () => {
      window.__cldDebouncePreviewSync(() => {
        if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
        else postModuleToIframe();
      });
    };
    window.__ppPostModuleToIframeDebounced = debouncedPost;
    window.__cldPostModuleToIframeDebounced = debouncedPost;
  }
})();
