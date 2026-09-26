/**
 * Окно: helpers без «моста».
 * Средняя (under-window) подстраивается под боковые на стыке.
 */
import { state } from '../utils/state.js';
import { computeSectionInnerBoundsU } from './section-edge-trim-insets.js?v=20260919-filler-a9';

export const UNDER_WINDOW_TOP_THICKNESS_MM = 16;

export function applyWindowBridgeTrim() {
  return false;
}

export function addUnderWindowBayTopCap() {
  return null;
}

export function shouldSuppressWindowBridgeBaySeamOverlay() {
  return false;
}

export function setUnderWindowBayTopVisible() {}

export function getWindowBridgeHeightMmAtAlong() {
  return null;
}

export function getWindowBridgeBayFacingSide() {
  return null;
}

function isUnderWindowSection(sec) {
  if (!sec) return false;
  if (sec.underWindowBay || sec.windowBridgeRole === 'under-window') return true;
  return Number(sec.fixedHeightMm) > 0 && Number(sec.sillMm) > 0;
}

/**
 * Края секции вдоль стены в координатах пролёта (0…room), не world.
 */
function sectionAlongEdgesRoomMm(sectionData, getOffsetsMm) {
  const wallName = sectionData?.wallName || 'back';
  const spanA = Number(sectionData?.spanAlongA);
  const spanB = Number(sectionData?.spanAlongB);
  const off =
    typeof getOffsetsMm === 'function'
      ? getOffsetsMm(sectionData)
      : sectionData?.offsets || {};

  if (Number.isFinite(spanA) && Number.isFinite(spanB) && spanB - spanA > 1) {
    if (wallName === 'front' || wallName === 'back') {
      const leftMm = Number(off.leftMm) || 0;
      const rightMm = Number(off.rightMm) || 0;
      return {
        outerMinU: spanA + leftMm,
        outerMaxU: spanB - rightMm,
      };
    }
    const frontMm = Number(off.frontMm) || 0;
    const backMm = Number(off.backMm) || 0;
    return {
      outerMinU: spanA + frontMm,
      outerMaxU: spanB - backMm,
    };
  }

  const bounds = computeSectionInnerBoundsU(sectionData);
  const rp = state.room?.group?.position;
  const originU =
    wallName === 'left' || wallName === 'right'
      ? Number(rp?.z) || 0
      : Number(rp?.x) || 0;
  return {
    outerMinU: bounds.outerMinU - originU,
    outerMaxU: bounds.outerMaxU - originU,
  };
}

function findWindowAlongTrio(seed) {
  if (!seed) return null;
  const gid = seed.windowAlongWallGroupId || seed.windowBridgeGroupId || null;
  let members = [];
  if (gid) {
    members = (state.customSections || []).filter(
      (s) =>
        s &&
        (s.windowAlongWallGroupId === gid || s.windowBridgeGroupId === gid)
    );
  }
  if (members.length < 2) {
    const wall = seed.wallName;
    members = (state.customSections || []).filter(
      (s) => s?.group && s.wallName === wall
    );
  }
  if (members.length < 2) return null;

  const bay = members.find((s) => isUnderWindowSection(s));
  if (!bay?.group) return null;

  let left = members.find(
    (s) =>
      s.windowAlongWallRole === 'tall-left' || s.windowBridgeRole === 'tall-left'
  );
  let right = members.find(
    (s) =>
      s.windowAlongWallRole === 'tall-right' ||
      s.windowBridgeRole === 'tall-right'
  );
  if (!left || !right) {
    const talls = members
      .filter((s) => s && s !== bay && !isUnderWindowSection(s))
      .slice()
      .sort(
        (a, b) => (Number(a.spanAlongA) || 0) - (Number(b.spanAlongA) || 0)
      );
    left = left || talls[0];
    right = right || talls[talls.length - 1];
  }
  if (!left?.group || !right?.group || left.id === right.id) return null;
  return { left, bay, right, groupId: gid };
}

/**
 * После отступа высокой секции от окна — растянуть/сжать секцию под окном
 * так, чтобы она всегда доходила до граней боковых на стыке.
 *
 * @param {object} changedSection
 * @param {{ updateSectionSize: Function, getSectionOffsetsMm?: Function }} api
 */
export function syncUnderWindowBayToSideOverlays(changedSection, api = {}) {
  const updateSectionSize = api.updateSectionSize;
  if (typeof updateSectionSize !== 'function' || !changedSection) return false;

  // Средняя не ведёт — только подстраивается под боковые.
  if (isUnderWindowSection(changedSection)) return false;
  if (state._syncingUnderWindowBay) return false;

  const trio = findWindowAlongTrio(changedSection);
  if (!trio) return false;
  const { left, bay, right, groupId } = trio;

  const wallName = bay.wallName || left.wallName || 'back';
  const getOff = api.getSectionOffsetsMm;
  let bayA;
  let bayB;
  try {
    const lb = sectionAlongEdgesRoomMm(left, getOff);
    const rb = sectionAlongEdgesRoomMm(right, getOff);
    // left → окно: outerMax; right → окно: outerMin (координаты пролёта).
    bayA = lb.outerMaxU;
    bayB = rb.outerMinU;
  } catch (e) {
    console.warn('[WIN-BAY] bounds failed', e);
    return false;
  }

  if (!(Number.isFinite(bayA) && Number.isFinite(bayB))) return false;
  if (bayB < bayA) {
    const t = bayA;
    bayA = bayB;
    bayB = t;
  }
  const len = bayB - bayA;
  if (len < 80) {
    console.warn('[WIN-BAY] слишком узко после отступа', { bayA, bayB, len });
    return false;
  }

  const prevA = Number(bay.spanAlongA);
  const prevB = Number(bay.spanAlongB);
  if (
    Number.isFinite(prevA) &&
    Number.isFinite(prevB) &&
    Math.abs(prevA - bayA) < 0.6 &&
    Math.abs(prevB - bayB) < 0.6
  ) {
    return false;
  }

  bay.spanAlongA = bayA;
  bay.spanAlongB = bayB;

  const offMm =
    typeof api.getSectionOffsetsMm === 'function'
      ? api.getSectionOffsetsMm(bay)
      : bay.offsets || {};
  const isFB = wallName === 'front' || wallName === 'back';
  const depthMm = isFB
    ? Number(bay.size?.z) || Number(left.size?.z) || 600
    : Number(bay.size?.x) || Number(left.size?.x) || 600;

  // Вдоль стены отступы средней = 0: она заполняет зазор между боковыми.
  const offsetsCm = isFB
    ? {
        left: 0,
        right: 0,
        bottom: (Number(offMm.bottomMm) || 0) / 10,
        top: (Number(offMm.topMm) || 0) / 10,
      }
    : {
        front: 0,
        back: 0,
        bottom: (Number(offMm.bottomMm) || 0) / 10,
        top: (Number(offMm.topMm) || 0) / 10,
      };

  try {
    state._syncingUnderWindowBay = true;
    updateSectionSize(bay, offsetsCm, depthMm / 10);
    console.log('[WIN-BAY] sync → стык боковых', {
      groupId,
      bayA: Math.round(bayA),
      bayB: Math.round(bayB),
      len: Math.round(len),
    });
    return true;
  } catch (e) {
    console.warn('[WIN-BAY] sync failed', e);
    return false;
  } finally {
    state._syncingUnderWindowBay = false;
  }
}

if (typeof window !== 'undefined') {
  window.__cldSyncUnderWindowBayToSideOverlays = syncUnderWindowBayToSideOverlays;
}
