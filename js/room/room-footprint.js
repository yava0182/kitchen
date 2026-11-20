/**
 * Кухонный footprint (XZ mm): полигон + сегменты стен.
 * Соотношения совпадают с createKitchenRoomShapeIcon.
 * Origin: back-left (x=0,z=0), front = +z (как Room.js).
 *
 * orient 0..3 — в каком углу AABB «вкус» формы (вырез / срез / открытая сторона),
 * как варианты L у IKEA: один AABB, cutout в разных углах (не поворот с swap w/d).
 */

/**
 * @typedef {{ x: number, z: number }} FootprintVertex
 * @typedef {{
 *   id: string,
 *   wallName: string|null,
 *   x1: number, z1: number, x2: number, z2: number,
 *   open: boolean
 * }} FootprintSegment
 * @typedef {{
 *   shapeKey: string,
 *   vertices: FootprintVertex[],
 *   segments: FootprintSegment[]
 * }} FootprintSpec
 */

export function normalizeShapeOrient(o) {
  const n = Math.floor(Number(o));
  if (!Number.isFinite(n)) return 0;
  return ((n % 4) + 4) % 4;
}

export function shapeHasOrientVariants(shapeKey) {
  const k = String(shapeKey || '').trim();
  return (
    k === 'enclosed_notch' ||
    k === 'enclosed_chamfer' ||
    k === 'open_one_wall' ||
    k === 'open_corner' ||
    k === 'open_protrusion'
  );
}

function seg(id, wallName, x1, z1, x2, z2, open) {
  return {
    id,
    wallName: wallName || null,
    x1,
    z1,
    x2,
    z2,
    open: !!open,
  };
}

function closeSegmentsFromRing(vertices, openEdgeKeys) {
  const open = openEdgeKeys instanceof Set ? openEdgeKeys : new Set(openEdgeKeys || []);
  const segs = [];
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % n];
    const id = 'e' + i;
    segs.push(seg(id, null, a.x, a.z, b.x, b.z, open.has(id) || open.has(i)));
  }
  return segs;
}

/** Назначить legacy wallName ближайшим осевым рёбрам (для openings/секций). */
function assignLegacyWallNames(segments, width, depth) {
  const eps = Math.max(8, Math.min(width, depth) * 0.02);
  const candidates = { back: [], front: [], left: [], right: [] };

  for (const s of segments) {
    if (s.open) continue;
    const dx = s.x2 - s.x1;
    const dz = s.z2 - s.z1;
    const len = Math.hypot(dx, dz);
    if (len < 1) continue;
    const ax = Math.abs(dx);
    const az = Math.abs(dz);
    const mx = (s.x1 + s.x2) / 2;
    const mz = (s.z1 + s.z2) / 2;

    if (az <= eps && ax > eps) {
      if (mz <= eps) candidates.back.push({ s, len });
      else if (mz >= depth - eps) candidates.front.push({ s, len });
    } else if (ax <= eps && az > eps) {
      if (mx <= eps) candidates.left.push({ s, len });
      else if (mx >= width - eps) candidates.right.push({ s, len });
    }
  }

  for (const name of Object.keys(candidates)) {
    const list = candidates[name];
    if (!list.length) continue;
    list.sort((a, b) => b.len - a.len);
    list[0].s.wallName = name;
  }
  return segments;
}

/** cutX/cutZ — размеры ниши; nx/nz в params: nx=cutX, nz=d-cutZ (как orient 0). */
function notchVertices(w, d, cutX, cutZ, orient) {
  const o = normalizeShapeOrient(orient);
  if (o === 1) {
    return [
      { x: 0, z: 0 },
      { x: w, z: 0 },
      { x: w, z: d - cutZ },
      { x: w - cutX, z: d - cutZ },
      { x: w - cutX, z: d },
      { x: 0, z: d },
    ];
  }
  if (o === 2) {
    return [
      { x: 0, z: 0 },
      { x: w - cutX, z: 0 },
      { x: w - cutX, z: cutZ },
      { x: w, z: cutZ },
      { x: w, z: d },
      { x: 0, z: d },
    ];
  }
  if (o === 3) {
    return [
      { x: cutX, z: 0 },
      { x: w, z: 0 },
      { x: w, z: d },
      { x: 0, z: d },
      { x: 0, z: cutZ },
      { x: cutX, z: cutZ },
    ];
  }
  return [
    { x: 0, z: 0 },
    { x: w, z: 0 },
    { x: w, z: d },
    { x: cutX, z: d },
    { x: cutX, z: d - cutZ },
    { x: 0, z: d - cutZ },
  ];
}

function chamferVertices(w, d, c, orient) {
  const o = normalizeShapeOrient(orient);
  if (o === 1) {
    return [
      { x: 0, z: 0 },
      { x: w, z: 0 },
      { x: w, z: d },
      { x: c, z: d },
      { x: 0, z: d - c },
    ];
  }
  if (o === 2) {
    return [
      { x: 0, z: c },
      { x: c, z: 0 },
      { x: w, z: 0 },
      { x: w, z: d },
      { x: 0, z: d },
    ];
  }
  if (o === 3) {
    return [
      { x: 0, z: 0 },
      { x: w - c, z: 0 },
      { x: w, z: c },
      { x: w, z: d },
      { x: 0, z: d },
    ];
  }
  return [
    { x: 0, z: 0 },
    { x: w, z: 0 },
    { x: w, z: d - c },
    { x: w - c, z: d },
    { x: 0, z: d },
  ];
}

/**
 * @param {string} shapeKey
 * @param {number} width mm
 * @param {number} depth mm
 * @param {Record<string, number>|null} [paramsIn]
 * @returns {FootprintSpec & { params: Record<string, number> }}
 */
export function footprintSpecForShape(shapeKey, width, depth, paramsIn) {
  let w = Math.max(1000, Number(width) || 5000);
  let d = Math.max(1000, Number(depth) || 4000);
  const key = String(shapeKey || 'enclosed_rect').trim();
  const pIn = paramsIn && typeof paramsIn === 'object' ? paramsIn : {};
  const orient = shapeHasOrientVariants(key) ? normalizeShapeOrient(pIn.orient) : 0;

  let vertices;
  /** @type {FootprintSegment[]} */
  let segments;
  /** @type {Record<string, number>} */
  let params = { width: w, depth: d };

  if (key === 'enclosed_notch') {
    let cutX = Number.isFinite(pIn.nx) ? Math.round(pIn.nx) : Math.round(w * 0.55);
    let nzAbs = Number.isFinite(pIn.nz) ? Math.round(pIn.nz) : Math.round(d * 0.45);
    cutX = Math.max(600, Math.min(w - 600, cutX));
    nzAbs = Math.max(600, Math.min(d - 600, nzAbs));
    let cutZ = d - nzAbs;
    cutZ = Math.max(600, Math.min(d - 600, cutZ));
    nzAbs = d - cutZ;
    params = { width: w, depth: d, nx: cutX, nz: nzAbs, orient };
    vertices = notchVertices(w, d, cutX, cutZ, orient);
    segments = closeSegmentsFromRing(vertices, []);
  } else if (key === 'enclosed_chamfer') {
    let c = Number.isFinite(pIn.c)
      ? Math.round(pIn.c)
      : Math.round(Math.min(w, d) * 0.3);
    c = Math.max(400, Math.min(Math.min(w, d) - 800, c));
    params = { width: w, depth: d, c, orient };
    vertices = chamferVertices(w, d, c, orient);
    segments = closeSegmentsFromRing(vertices, []);
  } else if (key === 'open_one_wall') {
    params = { width: w, depth: d, orient };
    vertices = [
      { x: 0, z: 0 },
      { x: w, z: 0 },
      { x: w, z: d },
      { x: 0, z: d },
    ];
    segments = [
      seg('back', 'back', 0, 0, w, 0, orient === 2),
      seg('right', 'right', w, 0, w, d, orient === 3),
      seg('front', 'front', w, d, 0, d, orient === 0),
      seg('left', 'left', 0, d, 0, 0, orient === 1),
    ];
  } else if (key === 'open_corner') {
    params = { width: w, depth: d, orient };
    vertices = [
      { x: 0, z: 0 },
      { x: w, z: 0 },
      { x: w, z: d },
      { x: 0, z: d },
    ];
    // o0 front+right, o1 front+left, o2 back+left, o3 back+right
    segments = [
      seg('back', 'back', 0, 0, w, 0, orient === 2 || orient === 3),
      seg('right', 'right', w, 0, w, d, orient === 0 || orient === 3),
      seg('front', 'front', w, d, 0, d, orient === 0 || orient === 1),
      seg('left', 'left', 0, d, 0, 0, orient === 1 || orient === 2),
    ];
  } else if (key === 'open_protrusion') {
    let mid = Number.isFinite(pIn.mid) ? Math.round(pIn.mid) : Math.round(w * 0.52);
    let step = Number.isFinite(pIn.step)
      ? Math.round(pIn.step)
      : Math.round(Math.min(w, d) * 0.18);
    mid = Math.max(600, Math.min(w - 600, mid));
    step = Math.max(400, Math.min(d - 600, step));
    params = { width: w, depth: d, mid, step, orient };
    if (orient === 1) {
      vertices = [
        { x: 0, z: 0 },
        { x: w, z: 0 },
        { x: w, z: d - step },
        { x: w - mid, z: d - step },
        { x: w - mid, z: d },
        { x: 0, z: d },
      ];
      segments = [
        seg('back', 'back', 0, 0, w, 0, false),
        seg('right', 'right', w, 0, w, d - step, false),
        seg('front_open', null, w, d - step, w - mid, d - step, true),
        seg('step', null, w - mid, d - step, w - mid, d, false),
        seg('front_l', 'front', w - mid, d, 0, d, false),
        seg('left', 'left', 0, d, 0, 0, false),
      ];
    } else if (orient === 2) {
      vertices = [
        { x: 0, z: 0 },
        { x: w - mid, z: 0 },
        { x: w - mid, z: step },
        { x: w, z: step },
        { x: w, z: d },
        { x: 0, z: d },
      ];
      segments = [
        seg('back_l', 'back', 0, 0, w - mid, 0, false),
        seg('step', null, w - mid, 0, w - mid, step, false),
        seg('back_open', null, w - mid, step, w, step, true),
        seg('right', 'right', w, step, w, d, false),
        seg('front', 'front', w, d, 0, d, false),
        seg('left', 'left', 0, d, 0, 0, false),
      ];
    } else if (orient === 3) {
      vertices = [
        { x: 0, z: step },
        { x: mid, z: step },
        { x: mid, z: 0 },
        { x: w, z: 0 },
        { x: w, z: d },
        { x: 0, z: d },
      ];
      segments = [
        seg('back_open', null, 0, step, mid, step, true),
        seg('step', null, mid, step, mid, 0, false),
        seg('back_r', 'back', mid, 0, w, 0, false),
        seg('right', 'right', w, 0, w, d, false),
        seg('front', 'front', w, d, 0, d, false),
        seg('left', 'left', 0, d, 0, step, false),
      ];
    } else {
      vertices = [
        { x: 0, z: 0 },
        { x: w, z: 0 },
        { x: w, z: d },
        { x: mid, z: d },
        { x: mid, z: d - step },
        { x: 0, z: d - step },
      ];
      segments = [
        seg('back', 'back', 0, 0, w, 0, false),
        seg('right', 'right', w, 0, w, d, false),
        seg('front_r', 'front', w, d, mid, d, false),
        seg('step', null, mid, d, mid, d - step, false),
        seg('front_open', null, mid, d - step, 0, d - step, true),
        seg('left', 'left', 0, d - step, 0, 0, false),
      ];
    }
  } else {
    params = { width: w, depth: d };
    vertices = [
      { x: 0, z: 0 },
      { x: w, z: 0 },
      { x: w, z: d },
      { x: 0, z: d },
    ];
    segments = [
      seg('back', 'back', 0, 0, w, 0, false),
      seg('right', 'right', w, 0, w, d, false),
      seg('front', 'front', w, d, 0, d, false),
      seg('left', 'left', 0, d, 0, 0, false),
    ];
  }

  if (key === 'enclosed_notch' || key === 'enclosed_chamfer') {
    assignLegacyWallNames(segments, w, d);
  }

  return { shapeKey: key, vertices, segments, params };
}

/**
 * Изменить длину ребра footprint (см → мм внутри). Возвращает новые width/depth/params.
 * @returns {{ width: number, depth: number, params: Record<string, number> }|null}
 */
export function applyFootprintEdgeLengthCm(shapeKey, width, depth, params, edgeIndex, lengthCm) {
  const lenMm = Math.round(Math.max(40, Number(lengthCm) || 0) * 10);
  if (!Number.isFinite(lenMm) || lenMm < 400) return null;
  const key = String(shapeKey || 'enclosed_rect').trim();
  let w = Math.max(1000, Number(width) || 5000);
  let d = Math.max(1000, Number(depth) || 4000);
  const p = { ...(params || {}) };
  const i = Number(edgeIndex);
  const orient = normalizeShapeOrient(p.orient);

  const cur = footprintSpecForShape(key, w, d, p);
  const verts = cur.vertices || [];
  const n = verts.length;
  if (!Number.isFinite(i) || i < 0 || i >= n) return null;

  const a = verts[i];
  const b = verts[(i + 1) % n];
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const edgeLen = Math.hypot(dx, dz) || 1;
  const mx = (a.x + b.x) / 2;
  const mz = (a.z + b.z) / 2;
  const eps = Math.max(8, Math.min(w, d) * 0.02);
  const isH = Math.abs(dz) <= eps && Math.abs(dx) > eps;
  const isV = Math.abs(dx) <= eps && Math.abs(dz) > eps;
  const onBack = isH && mz <= eps;
  const onFront = isH && mz >= d - eps;
  const onLeft = isV && mx <= eps;
  const onRight = isV && mx >= w - eps;
  const onOuter = onBack || onFront || onLeft || onRight;
  const fullW = Math.abs(edgeLen - w) <= eps * 8;
  const fullD = Math.abs(edgeLen - d) <= eps * 8;

  if (key === 'enclosed_notch') {
    let cutX = Number.isFinite(p.nx) ? p.nx : Math.round(w * 0.55);
    let cutZ = Number.isFinite(p.nz) ? d - p.nz : Math.round(d * 0.55);

    if (onOuter && isH && fullW) w = lenMm;
    else if (onOuter && isV && fullD) d = lenMm;
    else if (!onOuter && isV) cutX = lenMm;
    else if (!onOuter && isH) cutZ = lenMm;
    else if (onOuter && isH) {
      if (Math.abs(edgeLen - cutX) <= Math.abs(edgeLen - (w - cutX))) cutX = lenMm;
      else cutX = w - lenMm;
    } else if (onOuter && isV) {
      if (Math.abs(edgeLen - cutZ) <= Math.abs(edgeLen - (d - cutZ))) cutZ = lenMm;
      else cutZ = d - lenMm;
    } else return null;

    w = Math.max(1000, w);
    d = Math.max(1000, d);
    cutX = Math.max(600, Math.min(w - 600, cutX));
    cutZ = Math.max(600, Math.min(d - 600, cutZ));
    p.nx = cutX;
    p.nz = d - cutZ;
    p.orient = orient;
    p.width = w;
    p.depth = d;
    return { width: w, depth: d, params: p };
  }

  if (key === 'enclosed_chamfer') {
    const c0 = Number.isFinite(p.c) ? p.c : Math.round(Math.min(w, d) * 0.3);
    const isDiag = !isH && !isV;
    if (isDiag) p.c = Math.round(lenMm / Math.SQRT2);
    else if (onOuter && isH && fullW) w = lenMm;
    else if (onOuter && isV && fullD) d = lenMm;
    else if (onOuter && isH) p.c = w - lenMm;
    else if (onOuter && isV) p.c = d - lenMm;
    else return null;
    if (!Number.isFinite(p.c)) p.c = c0;
    p.orient = orient;
  } else if (key === 'open_protrusion') {
    if (onOuter && isH && fullW) w = lenMm;
    else if (onOuter && isV && fullD) d = lenMm;
    else if (isV) p.step = lenMm;
    else if (isH) p.mid = lenMm;
    else return null;
    p.orient = orient;
  } else {
    if (isH) w = lenMm;
    else if (isV) d = lenMm;
    else return null;
    if (shapeHasOrientVariants(key)) p.orient = orient;
  }

  w = Math.max(1000, w);
  d = Math.max(1000, d);
  p.width = w;
  p.depth = d;
  return { width: w, depth: d, params: p };
}

export function isNonRectKitchenShape(shapeKey) {
  const k = String(shapeKey || '').trim();
  return (
    k === 'enclosed_notch' ||
    k === 'enclosed_chamfer' ||
    k === 'open_one_wall' ||
    k === 'open_corner' ||
    k === 'open_protrusion'
  );
}
