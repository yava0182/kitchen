// Main refactored entry point - imports all modules and initializes the application
// This file replaces the monolithic main.js

// Import core modules
import { init } from './core/init.js?v=20261107-ucorner23';
import { animate } from './core/renderer.js?v=20261104-ikl-prod6';
import { setupCameraControls } from './core/camera.js?v=20261107-ucorner23';

// Needed for rounded edge geometry parity with constructor preview
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Expose to classic scripts (ClodisBuilder.js is loaded via classic <script>)
if (typeof window !== 'undefined') {
  window.RoundedBoxGeometry = RoundedBoxGeometry;
}

import './room-edge-visual.js?v=20261102-penal1';
import './placement-kind-profiles.js?v=20261102-penal1';
import './kitchen/kitchen-manufacturing-profile.js?v=20261102-penal1';
import './kitchen/kitchen-base-engine.js?v=';
import './kitchen/kitchen-side-panels-scene-adapter.js?v=20261102-penal1';
import './kitchen/kitchen-side-panels-overlay-api.js?v=20261102-penal1';
import './kitchen/kitchen-section-layout.js?v=20261107-ucorner23';
import './clodis/clodis-prepare-for-build.js?v=20261102-penal1';
import './clodis/clodis-build-contract.js?v=20261107-ucorner13';
import './kitchen/kitchen-depth-stack.js?v=20261102-penal1';
import './kitchen/kitchen-run-overlays.js?v=20261107-ucorner13';
import './kitchen/kitchen-section-engine.js?v=20261107-ucorner15';
import './room/room-furniture-xray.js?v=20261102-penal1';
import './room/room-parity-probe.js?v=20261102-penal1';
// Kitchen Brain v1 — room snapshot only (no generator / no scene writes).
import './kitchen-brain/roomAdapter.js?v=20261102-penal1';
import './room-furniture-tags.js?v=20261107-ucorner13';

// Import event handlers
import { setupEventListeners } from './events/mouse-handler.js';

// Import UI modules
import { addSceneIcons } from './ui/scene-icons.js?v=20261107-ucorner15';
import './kitchen/kitchen-band-grids-view.js?v=20261107-ucorner23';
// [encoding cleaned]
import {
  rebuildAllDimensionLines,
  scheduleRebuildAllDimensionLines,
} from './ui/dimension-lines.js?v=20261102-penal1';
if (typeof window !== 'undefined') {
  window.rebuildAllDimensionLines = rebuildAllDimensionLines;
  window.scheduleRebuildAllDimensionLines = scheduleRebuildAllDimensionLines;
}

// Import furniture modules
import { initFurnitureActions } from './furniture/furniture-actions.js?v=20261102-penal1';
import { ensureDrawerCatalog33FreshFromApi } from './furniture/furniture-drawer-stack.js?v=20261102-penal1';

// Import section modules
import { cancelSectionPlacement } from './sections/section-manager.js?v=20261107-ucorner15';
// [encoding cleaned]
import './sections/window-row-model.js?v=20261102-penal1';
import './sections/window-row-trim-apply.js?v=20261102-penal1';

// Import modal modules
import { initCabinetModal } from './modals/cabinet-modal.js';

// Import room modules
import { showEditRoomModal } from './room/room-manager.js?v=20261107-ucorner15';

// Room steps (wizard)
import { initRoomSteps, getRoomStepsConfig } from './ui/room-steps.js?v=20261107-ucorner13';
import { installKitchenManageUi } from './ui/kitchen-manage-panel.js?v=20261102-penal1';
import { setRoomTotalPriceRub } from './ui/price.js?v=20261102-penal1';
import { initPriceReportPanel } from './ui/price-report.js';

import { installCabinetLookTuner } from './furniture/room-cabinet-studio.js?v=20261104-ikl-prod6';
import {
  installIkeaRoomFixtureConsole,
  maybeAutoRestoreIkeaRoomFixture,
} from './furniture/ikea-room-fixture.js?v=20261107-ucorner15';
import {
  bootRoomDraftAutosave,
  installRoomDraftAutosaveConsole,
} from './room/room-draft-autosave.js?v=20261107-ucorner15';


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
    console.warn('[CLD] initializeApp: уже инициализировано, повторный запуск пропущен (защита от потери WebGL).');
    return;
  }

  console.log('?? Initializing refactored application...');

  try {
    await init();
    window.__CLD_REFACTORED_INIT__ = true;
// [encoding cleaned]
    window.appState = state;
    window.__cldAppState = state;
    if (state.scene) window.__cldRoomScene = state.scene;

    ensureDrawerCatalog33FreshFromApi().catch((e) => {
      console.warn('[DRAWER-NO-HANDLE] startup catalog_33 sync:', e);
    });

    const uiSteps = [
      ['initCabinetModal', () => initCabinetModal()],
      ['initFurnitureActions', () => initFurnitureActions()],
      ['initRoomSteps', () => initRoomSteps()],
      ['setRoomTotalPriceRub', () => setRoomTotalPriceRub(0)],
      ['initPriceReportPanel', () => initPriceReportPanel()],
      ['installCabinetLookTuner', () => installCabinetLookTuner()],
      [
        'installKitchenManageUi',
        () => {
          try {
            installKitchenManageUi(getRoomStepsConfig());
          } catch (_) {}
        },
      ],
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
      installRoomDraftAutosaveConsole();
      const ikeaRestored = await maybeAutoRestoreIkeaRoomFixture();
      const skipChoice =
        !!(ikeaRestored && ikeaRestored.ok) ||
        (typeof window !== 'undefined' &&
          new URLSearchParams(window.location.search).get('ikeaFixture') === '1');
      await bootRoomDraftAutosave({ skipChoice });
      // Kitchen lighting: refresh cast/receive after furniture appears.
      try {
        window.__cldIkeaKitchenLighting?.refreshShadows?.();
        window.__cldIkeaKitchenLighting?.install?.();
      } catch (_) {}
    } catch (e) {
      console.warn('[IKEA fixture / room-draft] init skipped:', e);
    }

    console.log('? Application initialized successfully!');
    console.log('?? State:', {
      scene: !!state.scene,
      camera: !!state.camera,
      renderer: !!state.renderer,
      room: !!state.room,
      sameSingleton:
        state ===
        (typeof window !== 'undefined' ? window.__CLD_STATE_SINGLETON__ : null),
    });
// [encoding cleaned]
    if (state.renderer?.domElement && !state._canvasClickBound) {
      try {
        setupEventListeners();
        state._canvasClickBound = true;
      } catch (_) {}
    }
  } catch (error) {
    window.__cldLastInitError = error;
    console.error('? Error initializing application:', error);
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
console.log('?? Main refactored module loaded');
