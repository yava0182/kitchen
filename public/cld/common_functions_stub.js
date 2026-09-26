// Clean-room stub for legacy reference helpers.
// Provides only what admin-new.html needs: get_base_data().
//
// IMPORTANT:
// - Do NOT copy reference code.
// - Keep this minimal and project-specific.

(function () {
  function safeJsonParse(raw, fallback) {
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function readHiddenJson(id, fallback) {
    const el = document.getElementById(id);
    if (!el) return fallback;
    const v = String(el.value || '').trim();
    if (!v) return fallback;
    return safeJsonParse(v, fallback);
  }

  function readHiddenValue(id, fallback) {
    const el = document.getElementById(id);
    if (!el) return fallback;
    const v = String(el.value ?? '').trim();
    return v === '' ? fallback : v;
  }

  // Minimal global initializer used by admin-new.html.
  window.get_base_data = function get_base_data() {
    const base_url = readHiddenValue('ajax_base_url', '/api');
    const acc_url = readHiddenValue('acc_base_url', '/');
    const ini = readHiddenJson('ini_json', {});
    const lang = readHiddenJson('lang_json', {});

    // Keep shape flexible: consumers should feature-detect.
    return {
      base_url,
      acc_url,
      lang,
      ini,
      // Present for compatibility; admin sets/overrides these later anyway.
      item_id: readHiddenValue('item_id', '0'),
      controller_name: readHiddenValue('controller_name', ''),
    };
  };
})();

