/**
 * Kitchen Brain — Room Adapter (v1.0 / stage 1)
 *
 * CONTRACT
 * --------
 * - Units: ALL geometric values are millimetres (mm). Never centimetres.
 * - Output is a pure JSON-serializable POJO (no THREE, DOM, functions).
 * - Read-only: does not mutate `state`, Room meshes, or UI.
 * - Does NOT include kitchen project params (legHeight, plinth, worktop, carcass).
 * - wallId stability: derived from footprint segment.id (preferred) or wallName.
 *   After shape/edge changes, segment ids/names may be reassigned by the existing
 *   room footprint pipeline — wallId is stable only within a given footprint
 *   generation, not across arbitrary reshape. This adapter does not rebuild walls.
 *
 * Walls / along placement (do not confuse):
 * - walls[].start/end = geometry direction of footprint segment (CCW ring).
 * - alongMm (openings / wall-mounted utilities) = placement coordinate measured using
 *   walls[].axis + walls[].alongOriginMm + walls[].alongDirection.
 * - Kitchen Brain MUST use the along-system for objects on a wall, and start/end
 *   only for wall geometry. Never derive alongDirection from start→end.
 * - along* fields mirror existing Room.wallAlongAxis / wallAlongOrigin behaviour
 *   (absolute room X or Z; origin = min endpoint on that axis; direction always +x/+z).
 *
 * Public API: getKitchenRoomSnapshot()
 * Debug: window.__cldGetKitchenRoomSnapshot()
 */

import { state, WALL_THICKNESS } from '../utils/state.js';
import { footprintSpecForShape } from '../room/room-footprint.js';

export const KITCHEN_ROOM_SNAPSHOT_VERSION = 1;
export const KITCHEN_ROOM_SNAPSHOT_UNITS = 'mm';

/** @returns {number|null} */
function mmOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** @returns {string|null} */
function strOrNull(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function roundMm(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return null;
  return Math.round(x);
}

/**
 * Resolve wallId for a wallName / segment key used by openings & objects.
 * Prefer matching wallName on a wall entry, then sourceId / wallId.
 */
function resolveWallId(walls, wallName) {
  const key = strOrNull(wallName);
  if (!key) return null;
  const byName = walls.find((w) => w.wallName === key);
  if (byName) return byName.wallId;
  const byId = walls.find((w) => w.wallId === key || w.sourceId === key);
  if (byId) return byId.wallId;
  return key;
}

/**
 * Pure fallback when Room was built via buildRectangularRoom()
 * (no footprintSpec / wallSegments yet). Matches footprintSpecForShape('enclosed_rect').
 * Does not mutate Room.
 */
function resolveFootprintSpec(room) {
  const live = room?.footprintSpec;
  if (
    live &&
    typeof live === 'object' &&
    Array.isArray(live.segments) &&
    live.segments.length
  ) {
    return live;
  }
  const w = Number(room?.width);
  const d = Number(room?.depth);
  if (!(w > 0 && d > 0)) return null;
  const shapeKey =
    strOrNull(state.kitchenRoomShapeKey) ||
    strOrNull(room?.shapeKey) ||
    'enclosed_rect';
  const params = state.kitchenFootprintParams || null;
  try {
    return footprintSpecForShape(shapeKey, w, d, params);
  } catch (_) {
    return footprintSpecForShape('enclosed_rect', w, d, null);
  }
}

/**
 * Along placement system used by openings/objects (Room.wallAlongAxis / wallAlongOrigin).
 * Not derived from footprint segment start→end.
 * @param {object|null} room
 * @param {string} wallKey wallName or segment id
 * @param {{ x1:number,z1:number,x2:number,z2:number }|null} seg
 * @returns {{ axis: 'x'|'z', alongOriginMm: number, alongDirection: '+x'|'+z' }}
 */
function resolveAlongSystem(room, wallKey, seg) {
  let axis = null;
  let origin = null;
  const key = strOrNull(wallKey);

  if (room && key && typeof room.wallAlongAxis === 'function') {
    axis = room.wallAlongAxis(key) === 'z' ? 'z' : 'x';
    if (typeof room.wallAlongOrigin === 'function') {
      origin = roundMm(room.wallAlongOrigin(key));
    }
  } else if (key === 'front' || key === 'back') {
    axis = 'x';
  } else if (key === 'left' || key === 'right') {
    axis = 'z';
  } else if (seg) {
    // Same fallback as Room.wallAlongAxis for unnamed polygon edges.
    const dx = Math.abs(Number(seg.x2) - Number(seg.x1));
    const dz = Math.abs(Number(seg.z2) - Number(seg.z1));
    axis = dx >= dz ? 'x' : 'z';
  }

  if (axis !== 'x' && axis !== 'z') axis = 'x';

  if (origin == null && seg) {
    origin =
      axis === 'x'
        ? roundMm(Math.min(Number(seg.x1), Number(seg.x2)))
        : roundMm(Math.min(Number(seg.z1), Number(seg.z2)));
  }
  if (origin == null) origin = 0;

  // Existing placement convention: alongMm is absolute room X or Z and grows with +axis.
  const alongDirection = axis === 'z' ? '+z' : '+x';
  return { axis, alongOriginMm: origin, alongDirection };
}

/**
 * Build normalized walls from footprint segments (inner contour, mm).
 * @param {object|null} room
 * @param {object|null} footprintSpec
 * @returns {object[]}
 */
function buildWalls(room, footprintSpec) {
  const segs =
    (room && Array.isArray(room.wallSegments) && room.wallSegments.length
      ? room.wallSegments
      : footprintSpec?.segments) || [];

  const walls = [];
  const usedIds = new Set();

  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    if (!s) continue;
    const sourceId = strOrNull(s.id) || `seg_${i}`;
    const wallName = strOrNull(s.wallName);
    // Prefer segment.id as wallId (stable within footprint); fall back to wallName / index.
    let wallId = sourceId;
    if (usedIds.has(wallId)) {
      wallId = wallName && !usedIds.has(wallName) ? wallName : `${sourceId}_${i}`;
    }
    usedIds.add(wallId);

    const x1 = roundMm(s.x1);
    const z1 = roundMm(s.z1);
    const x2 = roundMm(s.x2);
    const z2 = roundMm(s.z2);
    let lengthMm = null;
    if (x1 != null && z1 != null && x2 != null && z2 != null) {
      lengthMm = roundMm(Math.hypot(x2 - x1, z2 - z1));
    } else if (wallName && room && typeof room.wallLengthOf === 'function') {
      lengthMm = roundMm(room.wallLengthOf(wallName));
    }

    // Lookup key for Room along APIs: wallName when present, else segment id.
    const alongKey = wallName || sourceId;
    const along = resolveAlongSystem(room, alongKey, s);

    walls.push({
      wallId,
      sourceId,
      wallName,
      start: { xMm: x1, zMm: z1 },
      end: { xMm: x2, zMm: z2 },
      lengthMm,
      open: !!s.open,
      axis: along.axis,
      alongOriginMm: along.alongOriginMm,
      alongDirection: along.alongDirection,
    });
  }

  return walls;
}

function buildFootprint(room, footprintSpec) {
  const spec = footprintSpec || null;
  if (!spec || typeof spec !== 'object') return null;
  const vertices = Array.isArray(spec.vertices)
    ? spec.vertices.map((v) => ({
        xMm: roundMm(v?.x),
        zMm: roundMm(v?.z),
      }))
    : [];
  const segments = Array.isArray(spec.segments)
    ? spec.segments.map((s, i) => ({
        id: strOrNull(s?.id) || `e${i}`,
        wallName: strOrNull(s?.wallName),
        x1Mm: roundMm(s?.x1),
        z1Mm: roundMm(s?.z1),
        x2Mm: roundMm(s?.x2),
        z2Mm: roundMm(s?.z2),
        open: !!s?.open,
      }))
    : [];
  return {
    shapeKey: strOrNull(spec.shapeKey) || strOrNull(room?.shapeKey),
    vertices,
    segments,
    params: state.kitchenFootprintParams
      ? { ...state.kitchenFootprintParams }
      : spec.params && typeof spec.params === 'object'
        ? { ...spec.params }
        : null,
  };
}

function buildOpenings(walls) {
  const list = Array.isArray(state.roomEditOpenings) ? state.roomEditOpenings : [];
  return list
    .filter((o) => o && typeof o === 'object')
    .map((o) => {
      const type = strOrNull(o.type);
      const sill = mmOrNull(o.sillMm);
      // Doors store sillMm = 0; windows use sill as height from floor.
      let heightFromFloorMm = null;
      if (type === 'window') {
        heightFromFloorMm = sill != null ? roundMm(sill) : null;
      } else if (type === 'door') {
        heightFromFloorMm = sill != null ? roundMm(sill) : 0;
      } else if (sill != null) {
        heightFromFloorMm = roundMm(sill);
      }

      return {
        id: strOrNull(o.id),
        type,
        wallId: resolveWallId(walls, o.wallName),
        alongMm: roundMm(o.alongMm),
        widthMm: roundMm(o.widthMm),
        heightMm: roundMm(o.heightMm),
        heightFromFloorMm,
        openingDirection: strOrNull(o.openingDirection),
        handleSide: strOrNull(o.handleSide),
        kind: strOrNull(o.kind),
      };
    });
}

/**
 * Utilities: water outlet, electric, ventilation, pipes (incl. gas kinds).
 * Heating physical bodies go to obstacles (see buildObstacles).
 */
function buildUtilities(walls) {
  const out = [];

  const water = state.roomEditWaterOutlet;
  if (water && typeof water === 'object' && water.wallName) {
    out.push({
      id: 'water-outlet',
      type: 'water',
      subtype: 'outlet',
      wallId: resolveWallId(walls, water.wallName),
      alongMm: roundMm(water.alongMm),
      heightFromFloorMm: null,
      widthMm: null,
      heightMm: null,
      depthMm: null,
      position: null,
      orientation: null,
      source: 'roomEditWaterOutlet',
    });
  }

  const objs = Array.isArray(state.roomEditObjects) ? state.roomEditObjects : [];
  for (const o of objs) {
    if (!o || typeof o !== 'object') continue;
    const cat = strOrNull(o.category);
    if (cat !== 'electric' && cat !== 'ventilation' && cat !== 'pipes') continue;

    let type = cat;
    let subtype = strOrNull(o.kind);
    if (cat === 'pipes' && subtype && /gas/i.test(subtype)) {
      type = 'gas';
    } else if (cat === 'pipes' && subtype && /water|hot|cold|drain|trap/i.test(subtype)) {
      type = 'water';
    }

    const mount = strOrNull(o.mount);
    out.push({
      id: strOrNull(o.id),
      type,
      subtype,
      wallId: mount === 'wall' ? resolveWallId(walls, o.wallName) : null,
      alongMm: mount === 'wall' ? roundMm(o.alongMm) : null,
      heightFromFloorMm: mount === 'wall' ? roundMm(o.elevMm) : 0,
      widthMm: roundMm(o.widthMm),
      heightMm: roundMm(o.heightMm),
      depthMm: roundMm(o.depthMm),
      position:
        mount === 'floor'
          ? { xMm: roundMm(o.xMm), zMm: roundMm(o.zMm) }
          : null,
      orientation: roundMm(o.rotationDeg),
      source: 'roomEditObjects',
      catalogId: strOrNull(o.catalogId),
      name: strOrNull(o.name),
      mount,
    });
  }

  return out;
}

function buildObstacles(walls, room) {
  const out = [];

  const objs = Array.isArray(state.roomEditObjects) ? state.roomEditObjects : [];
  for (const o of objs) {
    if (!o || typeof o !== 'object') continue;
    const cat = strOrNull(o.category);
    if (cat !== 'structural' && cat !== 'heating') continue;

    const mount = strOrNull(o.mount);
    out.push({
      id: strOrNull(o.id),
      type: cat === 'heating' ? 'heating' : 'structural',
      subtype: strOrNull(o.kind),
      wallId: mount === 'wall' ? resolveWallId(walls, o.wallName) : null,
      alongMm: mount === 'wall' ? roundMm(o.alongMm) : null,
      heightFromFloorMm: mount === 'wall' ? roundMm(o.elevMm) : 0,
      widthMm: roundMm(o.widthMm),
      heightMm: roundMm(o.heightMm),
      depthMm: roundMm(o.depthMm),
      position:
        mount === 'floor'
          ? { xMm: roundMm(o.xMm), zMm: roundMm(o.zMm) }
          : null,
      orientation: roundMm(o.rotationDeg),
      source: 'roomEditObjects',
      catalogId: strOrNull(o.catalogId),
      name: strOrNull(o.name),
      mount,
    });
  }

  const interiors = Array.isArray(state.kitchenInteriorWalls)
    ? state.kitchenInteriorWalls
    : [];
  for (const w of interiors) {
    if (!w || typeof w !== 'object') continue;
    const x1 = roundMm(w.x1);
    const z1 = roundMm(w.z1);
    const x2 = roundMm(w.x2);
    const z2 = roundMm(w.z2);
    let lengthMm = null;
    if (x1 != null && z1 != null && x2 != null && z2 != null) {
      lengthMm = roundMm(Math.hypot(x2 - x1, z2 - z1));
    }
    out.push({
      id: strOrNull(w.id) || `interior-wall-${out.length}`,
      type: 'interior_wall',
      subtype: 'partition',
      wallId: null,
      alongMm: null,
      heightFromFloorMm: 0,
      widthMm: lengthMm,
      heightMm: roundMm(room?.height),
      depthMm: roundMm(WALL_THICKNESS),
      position: {
        start: { xMm: x1, zMm: z1 },
        end: { xMm: x2, zMm: z2 },
      },
      orientation: null,
      source: 'kitchenInteriorWalls',
    });
  }

  // Shape cutouts / steps as first-class obstacles when params exist.
  const shapeKey =
    strOrNull(state.kitchenRoomShapeKey) ||
    strOrNull(room?.shapeKey) ||
    strOrNull(room?.footprintSpec?.shapeKey);
  const params = state.kitchenFootprintParams || room?.footprintSpec?.params || null;
  if (shapeKey === 'enclosed_notch' && params) {
    out.push({
      id: 'shape-feature-notch',
      type: 'shape_feature',
      subtype: 'notch',
      wallId: null,
      alongMm: null,
      heightFromFloorMm: 0,
      widthMm: roundMm(params.nx),
      heightMm: roundMm(room?.height),
      depthMm: roundMm(params.nz),
      position: {
        orient: mmOrNull(params.orient),
        widthMm: roundMm(params.width),
        depthMm: roundMm(params.depth),
      },
      orientation: null,
      source: 'footprint',
    });
  } else if (shapeKey === 'open_protrusion' && params) {
    out.push({
      id: 'shape-feature-protrusion',
      type: 'shape_feature',
      subtype: 'protrusion',
      wallId: null,
      alongMm: null,
      heightFromFloorMm: 0,
      widthMm: roundMm(params.mid),
      heightMm: roundMm(room?.height),
      depthMm: roundMm(params.step),
      position: {
        orient: mmOrNull(params.orient),
        widthMm: roundMm(params.width),
        depthMm: roundMm(params.depth),
      },
      orientation: null,
      source: 'footprint',
    });
  } else if (shapeKey === 'enclosed_chamfer' && params) {
    out.push({
      id: 'shape-feature-chamfer',
      type: 'shape_feature',
      subtype: 'chamfer',
      wallId: null,
      alongMm: null,
      heightFromFloorMm: 0,
      widthMm: roundMm(params.c),
      heightMm: roundMm(room?.height),
      depthMm: roundMm(params.c),
      position: {
        orient: mmOrNull(params.orient),
        widthMm: roundMm(params.width),
        depthMm: roundMm(params.depth),
      },
      orientation: null,
      source: 'footprint',
    });
  }

  return out;
}

/**
 * Furniture POJO extract is a later stage.
 * Do not traverse the Three.js scene here.
 * @returns {object[]}
 */
function buildFurniture() {
  // TODO(kitchen-brain): furniture dual-write / extract without Three dependency.
  return [];
}

/**
 * Read-only snapshot of the current kitchen room for Kitchen Brain.
 * @returns {object}
 */
export function getKitchenRoomSnapshot() {
  const room = state.room || null;
  const footprintSpec = resolveFootprintSpec(room);
  const walls = buildWalls(room, footprintSpec);
  const footprint = buildFootprint(room, footprintSpec);

  const snapshot = {
    version: KITCHEN_ROOM_SNAPSHOT_VERSION,
    units: KITCHEN_ROOM_SNAPSHOT_UNITS,
    generatedAt: new Date().toISOString(),
    room: {
      shapeKey:
        strOrNull(state.kitchenRoomShapeKey) ||
        strOrNull(room?.shapeKey) ||
        strOrNull(footprint?.shapeKey) ||
        null,
      widthMm: roundMm(room?.width),
      depthMm: roundMm(room?.depth),
      heightMm: roundMm(room?.height),
      wallThicknessMm: roundMm(WALL_THICKNESS),
      footprint,
    },
    walls,
    openings: buildOpenings(walls),
    utilities: buildUtilities(walls),
    obstacles: buildObstacles(walls, room),
    furniture: buildFurniture(),
  };

  return snapshot;
}

if (typeof window !== 'undefined') {
  window.__cldGetKitchenRoomSnapshot = getKitchenRoomSnapshot;
}
