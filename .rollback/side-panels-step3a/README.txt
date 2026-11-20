STEP 3A rollback
- Restore *.js snapshots in this folder (names use __ for path)
- Delete new: js/kitchen/kitchen-side-panels-overlay-geometry.js
- Delete new: js/kitchen/kitchen-side-panels-overlay-api.js
- Delete new: scripts/test-kitchen-side-panels-overlay-geometry.mjs
- Adapter gate: js__kitchen__kitchen-side-panels-scene-adapter.js
  (internal clear no longer poisoned by unconfirmed section-end trim)
- Also touched (bust / engine build): index.html, js/core/init.js,
  js/furniture/furniture-manager.js, js/kitchen/kitchen-section-engine.js,
  js/sections/section-manager.js, js/main-refactored.js
  (__CLD_KITCHEN_BASE_ENGINE_BUILD → 20261031-side3a)

Test API (no UI):
  window.__cldSetKitchenSidePanelOverlay(group, 'left'|'right', true|false)
  window.__cldClearKitchenSidePanelOverlays(group)

Screens: .rollback/side-panels-step3a/screens/overlay-ON.png | overlay-OFF.png
