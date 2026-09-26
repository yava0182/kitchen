/**
 * admin-clodis-preview-mount.js — DEPRECATED stub.
 * Mount владеет admin-preview-bridge.js. Этот файл больше не перетирает ensureClodisPreviewMounted.
 */
(function () {
  'use strict';
  // no-op: keep file so old HTML includes don't 404
  if (typeof window.__cldPreviewBridge?.ensureMounted === 'function') {
    window.ensureClodisPreviewMounted = function () {
      return window.__cldPreviewBridge.ensureMounted();
    };
  }
})();
