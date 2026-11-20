import { state } from '../utils/state.js';

/**
 * Синхронизирует видимость отладочных pivot/bbox мебели (ClodisBuilder) с флагами UI.
 * Роли (plinth/corpus/top) — только при «Шкаф по ролям» (DEBUG_COLOR_FURNITURE_PARTS).
 * Корень — при «Корень pivot» (DEBUG_ROOT_SECTION_PIVOTS).
 */
export function syncCabinetPivotDebugVisibility() {
  if (!state?.scene) return;
  const showRoot = typeof window !== 'undefined' && window.DEBUG_ROOT_SECTION_PIVOTS === true;
  const showRole =
    typeof window !== 'undefined' && window.DEBUG_COLOR_FURNITURE_PARTS === true;

  state.scene.traverse((obj) => {
    if (!obj || !obj.userData) return;
    const kind = obj.userData.__cldDbgPivotKind;
    if (!kind) return;
    obj.visible = kind === 'root' ? showRoot : showRole;
  });
}

try {
  if (typeof window !== 'undefined') {
    window.__cldSyncCabinetPivotDebugVisibility = syncCabinetPivotDebugVisibility;
  }
} catch (_) {}
