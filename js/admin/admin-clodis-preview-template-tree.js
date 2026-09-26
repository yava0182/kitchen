/**
 * admin-clodis-preview-template-tree.js — sync template tree to Clodis iframe preview
 * Extracted from admin-new.html for better Cursor performance
 */
(function() {
  'use strict';

  /**
   * Posts cld:setTemplateTree with legacy + new keys.
   * @param {HTMLIFrameElement} iframe
   * @param {any[]} tree
   */
  function syncTemplateTreeToIframe(iframe, tree) {
    if (!iframe || !iframe.contentWindow) return;
    const arr = Array.isArray(tree) ? tree : [];
    iframe.contentWindow.postMessage({
      type: 'cld:setTemplateTree',
      tree: arr,
      structure: arr,
    }, '*');
  }

  window.__cldSyncPreviewTemplateTreeToIframe = syncTemplateTreeToIframe;
})();

