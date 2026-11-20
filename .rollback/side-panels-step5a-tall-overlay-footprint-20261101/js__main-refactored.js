// Main refactored entry point - imports all modules and initializes the application
// This file replaces the monolithic main.js

// Import core modules
import { init } from './core/init.js?v=20261017-plinth-clean1';
import { animate } from './core/renderer.js?v=20261017-plinth-clean1';
import { setupCameraControls } from './core/camera.js?v=20261028-sectionsleep2';

// Needed for rounded edge geometry parity with constructor preview
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Expose to classic scripts (ClodisBuilder.js is loaded via classic <script>)
if (typeof window !== 'undefined') {
  window.RoundedBoxGeometry = RoundedBoxGeometry;
}

import './room-edge-visual.js?v=20260712-edge-same-decor';
import './placement-kind-profiles.js?v=20261025-vmu23';
import './kitchen/kitchen-manufacturing-profile.js?v=20261011-kitchen-rhythm';
import './kitchen/kitchen-base-engine.js?v=20261101-side5a2';
import './kitchen/kitchen-side-panels-scene-adapter.js?v=20261031-side4b';
import './kitchen/kitchen-side-panels-overlay-api.js?v=20261101-side5a2';
import './kitchen/kitchen-section-layout.js?v=20261031-zwsrc2';
import './clodis/clodis-prepare-for-build.js?v=20261027-nmu142g';
import './clodis/clodis-build-contract.js?v=20261025-vmu23';
import './kitchen/kitchen-depth-stack.js?v=20261030-depth4b';
import './kitchen/kitchen-run-overlays.js?v=20261027-nmu142h';
import './kitchen/kitchen-section-engine.js?v=20261030-depthlog1';
import './room/room-furniture-xray.js?v=20261010-unify1';
import './room/room-parity-probe.js?v=20261010-unify1';
// Kitchen Brain v1 � room snapshot only (no generator / no scene writes).
import './kitchen-brain/roomAdapter.js?v=20261007-kb-room1';
import './room-furniture-tags.js?v=20261010-rfc-kitchen1';

// Import event handlers
import { setupEventListeners } from './events/mouse-handler.js';

// Import UI modules
import { addSceneIcons } from './ui/scene-icons.js?v=20261031-side4b';
import './kitchen/kitchen-band-grids-view.js?v=20261028-bands15';
// ������� ���: ��������� bind ��������� (�� ������ ����� ?v= � bbox).
import {
  rebuildAllDimensionLines,
  scheduleRebuildAllDimensionLines,
} from './ui/dimension-lines.js?v=20261027-nmu142k';
if (typeof window !== 'undefined') {
  window.rebuildAllDimensionLines = rebuildAllDimensionLines;
  window.scheduleRebuildAllDimensionLines = scheduleRebuildAllDimensionLines;
}

// Import furniture modules
import { initFurnitureActions } from './furniture/furniture-actions.js?v=20261030-indivdel10';
import { ensureDrawerCatalog33FreshFromApi } from './furniture/furniture-drawer-stack.js?v=20260907-shelf-props';

// Import section modules
import { cancelSectionPlacement } from './sections/section-manager.js?v=20261031-zwsrc2';
// ���� 1: ������ ���� � ���� + __cldWindowRowAudit (��������� ������� �� ������).
import './sections/window-row-model.js?v=20260918-straight-s12';
import './sections/window-row-trim-apply.js?v=20260918-straight-s12';

// Import modal modules
import { initCabinetModal } from './modals/cabinet-modal.js';

// Import room modules
import { showEditRoomModal } from './room/room-manager.js?v=20261030-autosave2';

// Room steps (wizard)
import { initRoomSteps, getRoomStepsConfig } from './ui/room-steps.js?v=20261031-side3d1';
import { installKitchenManageUi } from './ui/kitchen-manage-panel.js?v=20261030-kitchen-gs7';
import { setRoomTotalPriceRub } from './ui/price.js?v=20260903-ui-nav-p1';
import { initPriceReportPanel } from './ui/price-report.js';

import { installCabinetLookTuner } from './furniture/room-cabinet-studio.js?v=20261023-room3';
import {
  installIkeaRoomFixtureConsole,
  maybeAutoRestoreIkeaRoomFixture,
} from './furniture/ikea-room-fixture.js?v=20261031-side3d1';
import {
  bootRoomDraftAutosave,
  installRoomDraftAutosaveConsole,
} from './room/room-draft-autosave.js?v=20261030-empty9';

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
    // Vite HMR / ������ ?v= ����� �������� window.appState �� ������ ��������� state.
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
    // ���� ����� ���������� ��?�� ������� ������ ��� renderer � ������ ���� ���.
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
