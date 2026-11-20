/**
 * Форма стенки (реф pp.custom.wall_types + CabinetWall._build_spec).
 * Контур в мм в плоскости real_size (v: x=глубина, y=высота), затем Extrude по толщине.
 */

function n(v, fallback = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
}

/** Реф type_params: плоские числа или { value }. */
export function cldWallTpVal(field, fallback = 0) {
  if (field == null) return fallback;
  if (typeof field === 'object' && !Array.isArray(field) && 'value' in field) {
    return field.value;
  }
  return field;
}

function tpNum(field, fallback = 0) {
  return n(cldWallTpVal(field, fallback), fallback);
}

function tpStr(field, fallback = '') {
  const v = cldWallTpVal(field, fallback);
  return v == null ? fallback : String(v);
}

function rectPoints(rx, ry) {
  return [
    { x: 0, y: 0, radius: 0 },
    { x: rx, y: 0, radius: 0 },
    { x: rx, y: ry, radius: 0 },
    { x: 0, y: ry, radius: 0 },
  ];
}

/** Одна L-выемка в углу (реф case l_shape). */
export function cldWallLShapePoints(rx, ry, o, d1, d2, r = 0, rConcave = 0) {
  const U = Math.max(0, Math.min(d1, ry));
  const W = Math.max(0, Math.min(d2, rx));
  const a4 = Math.max(0, r);
  const a5 = Math.max(0, rConcave);
  switch (String(o || 'ctr')) {
    case 'ctl':
      return [
        { x: 0, y: 0, radius: 0 },
        { x: rx, y: 0, radius: 0 },
        { x: rx, y: ry, radius: 0 },
        { x: W, y: ry, radius: a4, dir: true },
        { x: W, y: ry - U, radius: a5, dir: false },
        { x: 0, y: ry - U, radius: a4, dir: true },
      ];
    case 'cbl':
      return [
        { x: 0, y: U, radius: a4, dir: true },
        { x: W, y: U, radius: a5, dir: false },
        { x: W, y: 0, radius: a4, dir: true },
        { x: rx, y: 0, radius: 0 },
        { x: rx, y: ry, radius: 0 },
        { x: 0, y: ry, radius: 0 },
      ];
    case 'cbr':
      return [
        { x: 0, y: 0, radius: 0 },
        { x: rx - W, y: 0, radius: a4, dir: true },
        { x: rx - W, y: U, radius: a5, dir: false },
        { x: rx, y: U, radius: a4, dir: true },
        { x: rx, y: ry, radius: 0 },
        { x: 0, y: ry, radius: 0 },
      ];
    case 'ctr':
    default:
      return [
        { x: 0, y: 0, radius: 0 },
        { x: rx, y: 0, radius: 0 },
        { x: rx, y: ry - U, radius: a4, dir: true },
        { x: rx - W, y: ry - U, radius: a5, dir: false },
        { x: rx - W, y: ry, radius: a4, dir: true },
        { x: 0, y: ry, radius: 0 },
      ];
  }
}

/**
 * Вставить C-углубление на сторону контура (реф c_shapes).
 * o: ctl=лево, cbr=право, ctr=верх, cbl=низ (как в wall_types).
 */
function applyCNotch(points, rx, ry, o, depth, width, offset, r = 0, rConcave = 0) {
  const d = Math.max(0, depth);
  const w = Math.max(0, width);
  if (!(d > 0 && w > 0) || !points.length) return points;
  const off = Math.max(0, offset);
  const a4 = Math.max(0, r);
  const a5 = Math.max(0, rConcave);
  const side = String(o || 'cbr');

  // Строим заново прямоугольник с одной C + сохраняем уже сделанные L через
  // последовательную вставку на ребро (для Gola: сначала L, потом C).
  if (side === 'cbr') {
    // Право (x=rx), снизу вверх: offset от низа до начала выемки.
    const y0 = Math.min(off, ry);
    const y1 = Math.min(y0 + w, ry);
    const out = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      out.push(a);
      const onRight =
        Math.abs(a.x - rx) < 1e-6 && Math.abs(b.x - rx) < 1e-6 && b.y > a.y;
      if (!onRight) continue;
      if (y0 <= a.y || y1 >= b.y) continue;
      out.push({ x: rx, y: y0, radius: a4, dir: true });
      out.push({ x: rx - d, y: y0, radius: a5 });
      out.push({ x: rx - d, y: y1, radius: a5 });
      out.push({ x: rx, y: y1, radius: a4, dir: true });
    }
    return out.length >= 3 ? out : points;
  }
  if (side === 'ctl') {
    // Лево (x=0), сверху вниз в рефе — offset от верха.
    const yTop = ry - off;
    const yBot = Math.max(0, yTop - w);
    const out = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      out.push(a);
      const onLeft =
        Math.abs(a.x) < 1e-6 && Math.abs(b.x) < 1e-6 && b.y < a.y;
      if (!onLeft) continue;
      if (yTop >= a.y || yBot <= b.y) continue;
      out.push({ x: 0, y: yTop, radius: a4, dir: true });
      out.push({ x: d, y: yTop, radius: a5 });
      out.push({ x: d, y: yBot, radius: a5 });
      out.push({ x: 0, y: yBot, radius: a4, dir: true });
    }
    return out.length >= 3 ? out : points;
  }
  return points;
}

function unwrapShapeItem(item) {
  if (!item || typeof item !== 'object') return {};
  return {
    o: tpStr(item.o, 'ctr'),
    d1: tpNum(item.d1, 0),
    d2: tpNum(item.d2, 0),
    w1: tpNum(item.w1, 0),
    offset: tpNum(item.offset, 0),
    r: tpNum(item.r, 0),
    r_concave: tpNum(item.r_concave, 0),
  };
}

/**
 * @param {string} type common|l_shape|c_l_shape
 * @param {object} typeParams
 * @param {number} realW mm (real_size.x)
 * @param {number} realH mm (real_size.y)
 * @returns {{ points: Array, type: string }}
 */
export function cldWallBuildContourPoints(type, typeParams, realW, realH) {
  const rx = Math.max(1e-3, n(realW, 1));
  const ry = Math.max(1e-3, n(realH, 1));
  const tp = typeParams && typeof typeParams === 'object' ? typeParams : {};
  const t = String(type || 'common').toLowerCase();

  if (t === 'l_shape') {
    const o = tpStr(tp.o, 'ctr');
    const d1 = tpNum(tp.d1, 57.5);
    const d2 = tpNum(tp.d2, 27);
    const r = tpNum(tp.r, 0);
    const rc = tpNum(tp.r_concave, 0);
    return {
      type: 'l_shape',
      points: cldWallLShapePoints(rx, ry, o, d1, d2, r, rc),
    };
  }

  if (t === 'c_l_shape') {
    let points = rectPoints(rx, ry);
    const lList = Array.isArray(tp.l_shapes) ? tp.l_shapes : [];
    const cList = Array.isArray(tp.c_shapes) ? tp.c_shapes : [];

    // Один L: строим контур целиком (как реф l_shape). Несколько L — последовательно от прямоугольника.
    if (lList.length === 1) {
      const L = unwrapShapeItem(lList[0]);
      points = cldWallLShapePoints(rx, ry, L.o, L.d1, L.d2, L.r, L.r_concave);
    } else if (lList.length > 1) {
      // Берём первый L как базу; остальные углы пока не сшиваем (Gola = 1×L + C).
      const L = unwrapShapeItem(lList[0]);
      points = cldWallLShapePoints(rx, ry, L.o, L.d1, L.d2, L.r, L.r_concave);
    }

    for (const raw of cList) {
      const C = unwrapShapeItem(raw);
      points = applyCNotch(
        points,
        rx,
        ry,
        C.o,
        C.d1,
        C.w1,
        C.offset,
        C.r,
        C.r_concave
      );
    }
    return { type: 'c_l_shape', points };
  }

  return { type: 'common', points: rectPoints(rx, ry) };
}

/**
 * Extrude контура → BufferGeometry в локали стенки (как реф part20).
 * @param {object} opts
 * @param {string} opts.orientation v|h|f
 * @param {{x:number,y:number,z:number}} opts.sizeMm size панели (не real_size)
 * @param {number} opts.unitsMm единицы сцены (мм на unit), 1 = мм
 * @param {*} THREE
 */
export function cldWallExtrudeGeometry(pointsMm, opts, THREE) {
  const orientation = String(opts?.orientation || 'f')[0];
  const size = opts?.sizeMm || { x: 16, y: 700, z: 560 };
  const units = Number(opts?.unitsMm) > 0 ? Number(opts.unitsMm) : 1;
  const { cldPathShapeFromPoints } = opts?.shapeFromPointsMod || {};

  let shape;
  if (typeof cldPathShapeFromPoints === 'function') {
    shape = cldPathShapeFromPoints(pointsMm, units, THREE);
  } else {
    shape = new THREE.Shape();
    const pts = pointsMm || [];
    if (pts.length) {
      shape.moveTo(pts[0].x / units, pts[0].y / units);
      for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i].x / units, pts[i].y / units);
      shape.lineTo(pts[0].x / units, pts[0].y / units);
    }
  }

  const depth =
    orientation === 'v'
      ? size.x / units
      : orientation === 'h'
        ? size.y / units
        : size.z / units;

  const G = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth,
    bevelEnabled: false,
  });

  if (orientation === 'h') {
    G.rotateX(Math.PI / 2);
    G.translate(-size.x / units / 2, size.y / units / 2, -size.z / units / 2);
  } else if (orientation === 'v') {
    G.rotateY(-Math.PI / 2);
    G.translate(size.x / units / 2, -size.y / units / 2, -size.z / units / 2);
  } else {
    G.translate(-size.x / units / 2, -size.y / units / 2, -size.z / units / 2);
  }
  return G;
}

export const CLD_WALL_SHAPE_OPTIONS = [
  { value: 'common', label: 'Обычная' },
  { value: 'l_shape', label: 'L-образная' },
  { value: 'c_l_shape', label: 'C-образные и L-образные' },
];

export function cldWallDefaultTypeParams(type) {
  const t = String(type || 'common');
  if (t === 'l_shape') {
    return { o: 'ctr', d1: 57.5, d2: 27, r: 0, r_concave: 0 };
  }
  if (t === 'c_l_shape') {
    // Gola L/C: острые наружные углы (r=0). Внутр. R фрезы — только в ЧПУ (__cldGrooves), не в контуре.
    return {
      l_shapes: [{ o: 'ctr', d1: 57.5, d2: 27, r: 0, r_concave: 0 }],
      c_shapes: [
        {
          o: 'cbr',
          d1: 27,
          w1: 73.5,
          offset: 360 - 73.5 / 2,
          r: 0,
          r_concave: 0,
        },
      ],
    };
  }
  return {};
}

/** Для ClodisBuilder (не ESM): window.__cldWallShapeMod */
if (typeof window !== 'undefined') {
  window.__cldWallShapeMod = {
    cldWallBuildContourPoints,
    cldWallExtrudeGeometry,
    cldWallDefaultTypeParams,
    cldWallLShapePoints,
    CLD_WALL_SHAPE_OPTIONS,
  };
}
