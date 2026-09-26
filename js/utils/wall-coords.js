/**
 * Wall-local coordinate adapter.
 *
 * U — along the wall (division axis for markers/zones)
 * W — into the room (perpendicular to the wall)
 * V — up (world Y)
 *
 * Notes about this project:
 * - Sections are NOT rotated; only their geometry is translated, so local axes align with world axes.
 * - For robust snapping we define signed U to follow the direction of section growth:
 *   back: +X, front: -X, left: -Z, right: +Z
 *   W always points into the room: back:+Z, front:-Z, left:+X, right:-X
 */
const WALL_AXES = {
  back: {
    u: { axis: 'x', sign: +1 },
    w: { axis: 'z', sign: +1 },
  },
  front: {
    u: { axis: 'x', sign: -1 },
    w: { axis: 'z', sign: -1 },
  },
  left: {
    u: { axis: 'z', sign: -1 },
    w: { axis: 'x', sign: +1 },
  },
  right: {
    u: { axis: 'z', sign: +1 },
    w: { axis: 'x', sign: -1 },
  },
};

function axisToDir(axis, sign) {
  if (axis === 'x') return new THREE.Vector3(sign, 0, 0);
  if (axis === 'y') return new THREE.Vector3(0, sign, 0);
  if (axis === 'z') return new THREE.Vector3(0, 0, sign);
  throw new Error('wall-coords: unknown axis ' + axis);
}

export function getAxisCoord(point, axis) {
  if (axis === 'x') return point.x;
  if (axis === 'y') return point.y;
  if (axis === 'z') return point.z;
  return 0;
}

function setAxisCoord(point, axis, value) {
  if (axis === 'x') point.x = value;
  else if (axis === 'y') point.y = value;
  else if (axis === 'z') point.z = value;
  return point;
}

/**
 * @param {'front'|'back'|'left'|'right'} wallName
 * @returns {{u:{axis:'x'|'z',sign:number},w:{axis:'x'|'z',sign:number},v:{axis:'y',sign:number},uDir:THREE.Vector3,wDir:THREE.Vector3,vDir:THREE.Vector3}}
 */
export function getWallAxes(wallName) {
  const key = wallName in WALL_AXES ? wallName : 'back';
  const def = WALL_AXES[key];
  const uDir = axisToDir(def.u.axis, def.u.sign);
  const wDir = axisToDir(def.w.axis, def.w.sign);
  const vDir = axisToDir('y', +1);
  return {
    u: { axis: def.u.axis, sign: def.u.sign },
    w: { axis: def.w.axis, sign: def.w.sign },
    v: { axis: 'y', sign: +1 },
    uDir,
    wDir,
    vDir,
  };
}

/**
 * Convert absolute world point to signed wall coords (relative to world origin).
 * @param {'front'|'back'|'left'|'right'} wallName
 * @param {THREE.Vector3} worldPoint
 * @returns {{u:number,w:number,v:number}}
 */
export function worldToWallPoint(wallName, worldPoint) {
  const axes = getWallAxes(wallName);
  const u = axes.u.sign * getAxisCoord(worldPoint, axes.u.axis);
  const w = axes.w.sign * getAxisCoord(worldPoint, axes.w.axis);
  const v = worldPoint.y;
  return { u, w, v };
}

/**
 * Convert wall-local offsets (u,w,v) to a world point, using sectionGroup.position as origin.
 * @param {'front'|'back'|'left'|'right'} wallName
 * @param {{position:THREE.Vector3}|THREE.Vector3} sectionGroup
 * @param {{u:number,w:number,v:number}} point
 * @returns {THREE.Vector3}
 */
export function wallToWorldPoint(wallName, sectionGroup, point) {
  const axes = getWallAxes(wallName);
  const origin =
    sectionGroup && sectionGroup.isVector3
      ? sectionGroup
      : sectionGroup && sectionGroup.position
      ? sectionGroup.position
      : new THREE.Vector3();
  const out = origin.clone();
  if (point && Number.isFinite(point.u) && point.u !== 0) {
    out.add(axes.uDir.clone().multiplyScalar(point.u));
  }
  if (point && Number.isFinite(point.w) && point.w !== 0) {
    out.add(axes.wDir.clone().multiplyScalar(point.w));
  }
  if (point && Number.isFinite(point.v) && point.v !== 0) {
    out.y += point.v;
  }
  return out;
}

/**
 * Describe section pivot position in wall coords (signed), and optionally sizes in U/W/V.
 * @param {{position:THREE.Vector3}|null} sectionGroup
 * @param {'front'|'back'|'left'|'right'} wallName
 * @param {{x:number,y:number,z:number}|null} size Optional (mm)
 * @returns {{position:{u:number,w:number,v:number}, size?:{u:number,w:number,v:number}}|null}
 */
export function sectionWorldToWall(sectionGroup, wallName, size = null) {
  if (!sectionGroup || !sectionGroup.position) return null;
  const axes = getWallAxes(wallName);
  const position = worldToWallPoint(wallName, sectionGroup.position);
  if (!size) return { position };
  const uSize =
    axes.u.axis === 'x'
      ? Math.abs(size.x)
      : axes.u.axis === 'z'
      ? Math.abs(size.z)
      : 0;
  const wSize =
    axes.w.axis === 'x'
      ? Math.abs(size.x)
      : axes.w.axis === 'z'
      ? Math.abs(size.z)
      : 0;
  const vSize = Math.abs(size.y);
  return { position, size: { u: uSize, w: wSize, v: vSize } };
}

/**
 * Convert a world axis coordinate (X for front/back, Z for left/right) to signed U.
 * This is for division/snap math only (scalar along the division axis).
 * @param {'front'|'back'|'left'|'right'} wallName
 * @param {number} axisCoord
 * @returns {number}
 */
export function axisCoordToSignedU(wallName, axisCoord) {
  const axes = getWallAxes(wallName);
  return axes.u.sign * axisCoord;
}

/**
 * Convert signed U back to world axis coordinate (X or Z).
 * @param {'front'|'back'|'left'|'right'} wallName
 * @param {number} u
 * @returns {number}
 */
export function signedUToAxisCoord(wallName, u) {
  const axes = getWallAxes(wallName);
  return axes.u.sign * u;
}

/**
 * Build a world point by setting U/W axis coords directly (absolute coords), keeping the other axis as-is.
 * Useful for constructing marker endpoints without branching.
 * @param {'front'|'back'|'left'|'right'} wallName
 * @param {{uAxisCoord:number,wAxisCoord:number,vY:number}} p
 * @returns {THREE.Vector3}
 */
export function makeWorldPointFromWallAxes(wallName, p) {
  const axes = getWallAxes(wallName);
  const out = new THREE.Vector3(0, p.vY || 0, 0);
  // Set along U axis
  setAxisCoord(out, axes.u.axis, p.uAxisCoord || 0);
  // Set along W axis
  setAxisCoord(out, axes.w.axis, p.wAxisCoord || 0);
  return out;
}

