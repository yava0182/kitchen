/**
 * admin-copy-utils.js — утилита копирования в буфер обмена
 * Extracted from admin-new.html for better Cursor performance
 */
(function() {
  'use strict';

  function __cldCopyText(text) {
    const s = String(text ?? '');
    if (!s) return false;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(s).then(() => {
        if (typeof toastr !== 'undefined') toastr.success('Скопировано');
      }).catch(() => {});
      return true;
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = s;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.style.top = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok && typeof toastr !== 'undefined') toastr.success('Скопировано');
      return ok;
    } catch {
      return false;
    }
  }

  window.__cldCopyText = __cldCopyText;
})();
