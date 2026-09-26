/**
 * section-neighbor-utils.js
 *
 * Read-only utilities for detecting neighboring sections on a wall
 * and the types of furniture placed in them.
 *
 * Does NOT modify any state or section geometry — purely analytical.
 */

import { state } from '../utils/state.js';
import { PLACEMENT_KIND, isLowFurniturePlacementKind } from './vertical-layout.js?v=20260919-wh-bands2';

// ─── Internal helpers ────────────────────────────────────────────────────────

/**
 * Get world X (for back/front wall) or world Z (for left/right wall)
 * of the pivot of a section group.
 */
function _sectionPivotCoord(sec) {
  if (!sec || !sec.group) return null;
  const pos = sec.group.position;
  const wall = sec.wallName || 'back';
  if (wall === 'left' || wall === 'right') return pos.z;
  return pos.x;
}

/**
 * Width of a section along its wall axis (mm).
 */
function _sectionWidthMm(sec) {
  if (!sec || !sec.size) return 0;
  const wall = sec.wallName || 'back';
  if (wall === 'left' || wall === 'right') return Number(sec.size.z || 0);
  return Number(sec.size.x || 0);
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns all sections on the given wall, sorted by pivot coordinate
 * from min to max (left-to-right for back/front, front-to-back for left/right).
 *
 * @param {string} wallName - 'back' | 'front' | 'left' | 'right'
 * @returns {Array} sorted array of sectionData objects
 */
export function getSectionsOnWallSorted(wallName) {
  if (!Array.isArray(state.customSections)) return [];
  const targetWall = String(wallName || '').trim().toLowerCase();
  return state.customSections
    .filter((s) => s && String(s.wallName || '').trim().toLowerCase() === targetWall)
    .sort((a, b) => {
      const ca = _sectionPivotCoord(a) ?? 0;
      const cb = _sectionPivotCoord(b) ?? 0;
      return ca - cb;
    });
}

/**
 * Find the direct left neighbor and right neighbor of a section on the same wall.
 * "left" = smaller pivot coordinate, "right" = larger.
 *
 * @param {Object} sectionData
 * @returns {{ left: Object|null, right: Object|null }}
 */
export function getSectionNeighbors(sectionData) {
  if (!sectionData) return { left: null, right: null };
  const wall = sectionData.wallName || 'back';
  const sorted = getSectionsOnWallSorted(wall);
  const idx = sorted.findIndex((s) => s.id === sectionData.id);
  if (idx < 0) return { left: null, right: null };
  return {
    left: idx > 0 ? sorted[idx - 1] : null,
    right: idx < sorted.length - 1 ? sorted[idx + 1] : null,
  };
}

/**
 * Find all furniture groups (THREE.Group) placed inside a section.
 * Uses userData.sectionId on each scene child.
 *
 * @param {Object} sectionData
 * @returns {THREE.Group[]}
 */
export function getFurnitureInSection(sectionData) {
  if (!sectionData || !state.scene) return [];
  const results = [];
  for (const child of state.scene.children) {
    if (
      child.userData?.isFurniture &&
      child.userData?.sectionId === sectionData.id
    ) {
      results.push(child);
    }
  }
  console.log('[NEIGHBOR] getFurnitureInSection', sectionData.id,
    'found:', results.length,
    results.map(g => ({ placementKind: g.userData?.__placementKind, sectionId: g.userData?.sectionId }))
  );
  return results;
}

/**
 * Returns the placementKind of the first furniture item in a section,
 * or null if the section has no furniture.
 *
 * @param {Object} sectionData
 * @returns {string|null}
 */
export function getSectionFurniturePlacementKind(sectionData) {
  const groups = getFurnitureInSection(sectionData);
  if (!groups.length) return null;
  return groups[0].userData?.__placementKind || PLACEMENT_KIND.FLOOR_IN_NICHE;
}

/**
 * Returns a human-readable summary of a section's furniture type:
 *   'empty'             — no furniture
 *   'floor_in_niche'    — wardrobe / tall unit / upper wall-hung
 *   'standalone_floor'  — dresser / low unit / lower wall-hung
 *   'other'             — something else
 *
 * @param {Object} sectionData
 * @returns {string}
 */
export function getSectionFurnitureType(sectionData) {
  const pk = getSectionFurniturePlacementKind(sectionData);
  if (pk === null) return 'empty';
  if (pk === PLACEMENT_KIND.FLOOR_IN_NICHE) return 'floor_in_niche';
  if (isLowFurniturePlacementKind(pk)) return 'standalone_floor';
  if (
    pk === PLACEMENT_KIND.WALL_HUNG ||
    pk === PLACEMENT_KIND.WALL_HUNG_HIGH
  ) {
    return 'floor_in_niche';
  }
  return 'other';
}

/**
 * Detect the transition type at the boundary between two adjacent sections.
 *
 * Returns one of:
 *   'niche_to_niche'       — both are tall cabinets
 *   'niche_to_standalone'  — left=wardrobe, right=dresser
 *   'standalone_to_niche'  — left=dresser, right=wardrobe
 *   'standalone_to_standalone' — both are dressers
 *   'niche_to_empty'
 *   'standalone_to_empty'
 *   'empty_to_niche'
 *   'empty_to_standalone'
 *   'empty_to_empty'
 *   'unknown'
 *
 * @param {Object} leftSection
 * @param {Object} rightSection
 * @returns {string}
 */
export function getSectionTransitionType(leftSection, rightSection) {
  const leftType = leftSection ? getSectionFurnitureType(leftSection) : 'empty';
  const rightType = rightSection ? getSectionFurnitureType(rightSection) : 'empty';

  if (leftType === 'floor_in_niche' && rightType === 'floor_in_niche') return 'niche_to_niche';
  if (leftType === 'floor_in_niche' && rightType === 'standalone_floor') return 'niche_to_standalone';
  if (leftType === 'standalone_floor' && rightType === 'floor_in_niche') return 'standalone_to_niche';
  if (leftType === 'standalone_floor' && rightType === 'standalone_floor') return 'standalone_to_standalone';
  if (leftType === 'floor_in_niche' && rightType === 'empty') return 'niche_to_empty';
  if (leftType === 'standalone_floor' && rightType === 'empty') return 'standalone_to_empty';
  if (leftType === 'empty' && rightType === 'floor_in_niche') return 'empty_to_niche';
  if (leftType === 'empty' && rightType === 'standalone_floor') return 'empty_to_standalone';
  if (leftType === 'empty' && rightType === 'empty') return 'empty_to_empty';
  return 'unknown';
}

/**
 * Returns a full ordered description of all sections on a wall with their
 * furniture types and transition types between neighbors.
 * Useful for debugging and for Step 4 logic.
 *
 * @param {string} wallName
 * @returns {Array<{
 *   section: Object,
 *   furnitureType: string,
 *   widthMm: number,
 *   transitionToRight: string|null
 * }>}
 */
export function getWallSectionLayout(wallName) {
  const sorted = getSectionsOnWallSorted(wallName);
  return sorted.map((sec, i) => {
    const right = sorted[i + 1] || null;
    return {
      section: sec,
      furnitureType: getSectionFurnitureType(sec),
      widthMm: _sectionWidthMm(sec),
      transitionToRight: right
        ? getSectionTransitionType(sec, right)
        : null,
    };
  });
}
