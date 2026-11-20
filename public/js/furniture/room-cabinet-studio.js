/**
 * WIPED — studio-look / Soft / Spot sync старого v0 сняты.
 * Заглушки под импорты furniture-manager / fixture / main.
 * Vite publicDir отдаёт public/js/* раньше корневого js/ — держим паритет.
 */
export const CABINET_FILL_LAYER = 2;

export function refreshCabinetEdgeIkeaV0() {
  return false;
}

export function applyRoomCabinetStudioLook() {
  return 0;
}

export function refreshCabinetStudioAfterDecor() {
  return 0;
}

export function syncAllRoomCabinetStudio() {
  return 0;
}

export function syncRoomCabinetStudioForSectionId() {
  return 0;
}

export function syncRoomCabinetStudioForRoots() {
  return 0;
}

export function syncAllSectionTrimStudio() {
  return 0;
}

export function syncSectionTrimStudioForWall() {
  return 0;
}

export function applySectionTrimStudioLookForSectionId() {
  return 0;
}

export function stripSectionTrimSoftHeightForSectionId() {
  return 0;
}

export function scheduleCabinetStudioRebind() {}

export function scheduleIkeaRoomLightSync() {}

export function flushPendingCabinetStudioRebinds() {
  return 0;
}

export function installCabinetLookTuner() {}

if (typeof window !== 'undefined') {
  window.__cldScheduleIkeaRoomLightSync = scheduleIkeaRoomLightSync;
  window.__cldBindMeshToIkeaV0 = () => false;
}
