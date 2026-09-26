// Clean-room stub for legacy account_settings.js.
// The real reference script listens to Glob_ready and mounts UI.
// We only keep a safe no-op listener so admin-new.html doesn't rely on reference code.

(function () {
  function onReady() {
    // No-op: settings UI is implemented in admin-new.html (or later in our own code).
    // Keep for compatibility with existing event dispatch.
  }

  document.addEventListener('Glob_ready', onReady);
})();

