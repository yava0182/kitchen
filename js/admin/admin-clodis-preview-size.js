/**
 * admin-clodis-preview-size.js — sync module size to Clodis iframe preview
 * Extracted from admin-new.html for better Cursor performance
 */
(function() {
  'use strict';

  function readSizeMmFromInputs() {
    const widthInput = document.getElementById('catalog-item-width');
    const heightInput = document.getElementById('catalog-item-height');
    const depthInput = document.getElementById('catalog-item-depth');

    const w = widthInput ? Number(widthInput.value) || 300 : 300;
    const h = heightInput ? Number(heightInput.value) || 400 : 400;
    const d = depthInput ? Number(depthInput.value) || 200 : 200;

    return { w, h, d };
  }

  /**
   * Reads size from UI and posts `cld:setSize` to iframe.
   * Returns {w,h,d} in mm for further calculations.
   * @param {HTMLIFrameElement} iframe
   */
  function syncPreviewSizeToIframe(iframe) {
    const { w, h, d } = readSizeMmFromInputs();
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'cld:setSize', sizeMm: { w, h, d } }, '*');
    }
    return { w, h, d };
  }

  window.__cldSyncPreviewSizeToIframe = syncPreviewSizeToIframe;
})();

