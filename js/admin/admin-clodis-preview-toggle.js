/**
 * admin-clodis-preview-toggle.js — утилита управления iframe-превью (Clodis)
 * Extracted from admin-new.html for better Cursor performance
 */
(function() {
  'use strict';

  // Утилита для управления iframe-превью из консоли/других хендлеров
  window.__ppToggleModuleToIframe = function(on) {
    const iframe = window.__ppPreviewIframe;
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage({ type: 'cld:toggleModule', on: !!on }, '*');
  };
})();

