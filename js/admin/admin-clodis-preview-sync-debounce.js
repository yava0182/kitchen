/**
 * admin-clodis-preview-sync-debounce.js — debounce wrapper for Clodis preview sync
 * Extracted from admin-new.html for better Cursor performance
 */
(function() {
  'use strict';

  let __cldSyncTimeout = null;

  /**
   * Выполняет синхронизацию с debounce (40мс) — быстрый отклик на изменения размеров.
   * @param {Function} fn - функция, внутри которой делается sync (size/vars/materials/tree)
   */
  function debounceClodisPreviewSync(fn) {
    if (__cldSyncTimeout) clearTimeout(__cldSyncTimeout);
    __cldSyncTimeout = setTimeout(() => {
      __cldSyncTimeout = null;
      requestAnimationFrame(() => {
        try { fn && fn(); } catch (e) { console.error('[CLD][preview-sync] debounce error', e); }
      });
    }, 40);
  }

  window.__cldDebouncePreviewSync = debounceClodisPreviewSync;
})();

