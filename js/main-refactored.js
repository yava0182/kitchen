// Main refactored entry point - imports all modules and initializes the application
// This file replaces the monolithic main.js

// Import core modules
import { init } from './core/init.js?v=20260923-cohabit43';
import { animate } from './core/renderer.js?v=20260923-cohabit43';
import { setupCameraControls } from './core/camera.js?v=20260923-cohabit42';

// Needed for rounded edge geometry parity with constructor preview
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Expose to classic scripts (ClodisBuilder.js is loaded via classic <script>)
if (typeof window !== 'undefined') {
  window.RoundedBoxGeometry = RoundedBoxGeometry;
}

import './room-edge-visual.js?v=20260712-edge-same-decor';
import './placement-kind-profiles.js?v=20260923-cohabit1';
import './room-furniture-tags.js?v=20260614-catalog-fix2';

// Import event handlers
import { setupEventListeners } from './events/mouse-handler.js';

// Import UI modules
import { addSceneIcons } from './ui/scene-icons.js?v=20260923-cohabit1';

// Import furniture modules
import { initFurnitureActions } from './furniture/furniture-actions.js?v=20260923-cohabit41';
import { ensureDrawerCatalog33FreshFromApi } from './furniture/furniture-drawer-stack.js?v=20260907-shelf-props';

// Import section modules
import { cancelSectionPlacement } from './sections/section-manager.js?v=20260925-corner44y';
// Фаза 1: модель ряда у окна + __cldWindowRowAudit (поведение рендера не меняет).
import './sections/window-row-model.js?v=20260918-straight-s12';
import './sections/window-row-trim-apply.js?v=20260918-straight-s12';

// Import modal modules
import { initCabinetModal } from './modals/cabinet-modal.js';

// Import room modules
import { showEditRoomModal } from './room/room-manager.js?v=20260923-cohabit42';

// Room steps (wizard)
import { initRoomSteps, getRoomStepsConfig } from './ui/room-steps.js?v=20260925-corner44y';
import { setRoomTotalPriceRub } from './ui/price.js?v=20260903-ui-nav-p1';
import { initPriceReportPanel } from './ui/price-report.js';

// Zone debug panel (temporary buttons to toggle double/single zones)
import { initZoneDebugPanel } from './ui/zone-debug.js';

// Section debug panel (toggle niche overlays + furniture part coloring)
import { initSectionDebugPanel } from './ui/section-debug-panel.js?v=20260907-shelf-props9';
import { installCabinetLookTuner } from './furniture/room-cabinet-studio.js?v=20260913-hang-lite';
import {
  installIkeaRoomFixtureConsole,
  maybeAutoRestoreIkeaRoomFixture,
} from './furniture/ikea-room-fixture.js?v=20260902-ikea-r3j43';

// Import state
import { state } from './utils/state.js';
import { attachHingeHoleOutlines } from './utils/hinge-hole-outlines.js';

if (typeof window !== 'undefined') {
  window.__CLD_attachHingeHoleOutlines = attachHingeHoleOutlines;
}

/**
 * Initialize the application
 */
async function initializeApp() {
  if (window.__CLD_REFACTORED_INIT__) {
    console.warn('[CLD] initializeApp: уже инициализировано, повторный запуск пропущен (защита от двойного WebGL).');
    return;
  }

  console.log('🚀 Initializing refactored application...');

  try {
    await init();
    window.__CLD_REFACTORED_INIT__ = true;

    ensureDrawerCatalog33FreshFromApi().catch((e) => {
      console.warn('[DRAWER-NO-HANDLE] startup catalog_33 sync:', e);
    });

    const uiSteps = [
      ['initCabinetModal', () => initCabinetModal()],
      ['initFurnitureActions', () => initFurnitureActions()],
      ['initRoomSteps', () => initRoomSteps()],
      ['setRoomTotalPriceRub', () => setRoomTotalPriceRub(0)],
      ['initPriceReportPanel', () => initPriceReportPanel()],
      ['initZoneDebugPanel', () => initZoneDebugPanel()],
      ['initSectionDebugPanel', () => initSectionDebugPanel()],
      ['installCabinetLookTuner', () => installCabinetLookTuner()],
    ];
    for (const [name, fn] of uiSteps) {
      try {
        fn();
      } catch (err) {
        console.warn(`[init] ${name} skipped:`, err);
      }
    }
    const editRoomBtn = document.getElementById('edit-room-btn');
    if (editRoomBtn) {
      window.editRoomButton = editRoomBtn;
      editRoomBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showEditRoomModal();
      });
    }
    
    // Initialize edit section modal handlers
    if (typeof initEditSectionModal === 'function') {
      initEditSectionModal();
    }

    window.getRoomStepsConfig = getRoomStepsConfig;

    try {
      installIkeaRoomFixtureConsole();
      await maybeAutoRestoreIkeaRoomFixture();
    } catch (e) {
      console.warn('[IKEA fixture] init skipped:', e);
    }

    console.log('✅ Application initialized successfully!');
    console.log('📊 State:', {
      scene: !!state.scene,
      camera: !!state.camera,
      renderer: !!state.renderer,
      room: !!state.room
    });
  } catch (error) {
    window.__cldLastInitError = error;
    console.error('❌ Error initializing application:', error);
    const isWebGL =
      /webgl|context/i.test(String(error?.message || error)) ||
      /WebGLRenderer/i.test(String(error));
    if (!isWebGL) {
      const msg = error?.message ? String(error.message) : String(error);
      alert(`Ошибка инициализации: ${msg}`);
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export for debugging
window.appState = state;
console.log('📦 Main refactored module loaded');
