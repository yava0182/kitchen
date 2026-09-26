/**
 * Паз (CabinetPath) — геометрия 1:1 с рефом main_core_v2_part19 / part2 path_types / part21 p_shapes.common.
 * Сечение → Shape, траектория → CurvePath, ExtrudeGeometry + повороты под ориентацию панели.
 */

/** 7 профилей как pp.custom.path_types в рефе. */
export const CLD_PATH_TYPES = {
  common: { name: 'Обычная', params: {} },
  cut_corners: {
    name: 'Обрезанные углы',
    params: {
      cbl: { key: 'cbl', name: 'Нижний левый', default: 0 },
      ctl: { key: 'ctl', name: 'Верхний левый', default: 0 },
      ctr: { key: 'ctr', name: 'Верхний правый', default: 0 },
      cbr: { key: 'cbr', name: 'Нижний правый', default: 0 },
    },
  },
  angle: {
    name: 'Треугольник на всю глубину',
    params: { angle: { key: 'angle', name: 'Угол', default: 45 } },
  },
  dx_angle: {
    name: 'Треугольник с отступом',
    params: { angle: { key: 'angle', name: 'Угол', default: 45 } },
  },
  radius: {
    name: 'Радиус',
    params: { r: { key: 'r', name: 'Радиус', default: 5 } },
  },
  rounded_corners: {
    name: 'Радиусные углы',
    params: {
      cbl: { key: 'cbl', name: 'Нижний левый', default: 0 },
      ctl: { key: 'ctl', name: 'Верхний левый', default: 0 },
      ctr: { key: 'ctr', name: 'Верхний правый', default: 0 },
      cbr: { key: 'cbr', name: 'Нижний правый', default: 0 },
    },
  },
  trapeze_cut_by_offset: {
    name: 'Трапеция',
    params: {
      w1: { key: 'w1', name: 'Ширина спереди', default: 150 },
      h1: { key: 'h1', name: 'Высота спереди', default: 150 },
      w2: { key: 'w2', name: 'Ширина сзади', default: 75 },
      h2: { key: 'h2', name: 'Высота сзади', default: 75 },
      o: { key: 'o', name: 'Ориентация', default: 'left' },
    },
  },
};

export const CLD_PATH_TYPE_KEYS = Object.keys(CLD_PATH_TYPES);

/** Реф add_rounded_corner (part21) — дуга угла для rounded_corners. */
function addRoundedCorner(shape, prev, cur, next, fromPt, THREE) {
  const w = Number(cur.radius) || 0;
  if (!(w > 0)) {
    shape.lineTo(cur.x, cur.y);
    return { p1: cur, p2: cur };
  }
  let A = prev.x - cur.x;
  let Aj = prev.y - cur.y;
  let B = next.x - cur.x;
  let Bm = next.y - cur.y;
  const C = Math.sqrt(A * A + Aj * Aj) || 1;
  const D = Math.sqrt(B * B + Bm * Bm) || 1;
  const F = cur.x + (A / C) * w;
  const Cy = cur.y + (Aj / C) * w;
  const G = cur.x + (B / D) * w;
  const ky = cur.y + (Bm / D) * w;
  const midX = (F + G) / 2;
  const midY = (Cy + ky) / 2;
  const I = Math.sqrt((G - F) ** 2 + (ky - Cy) ** 2);
  const J = I ? Math.sqrt(Math.max(w * w - (I / 2) ** 2, 0)) : 0;
  const K = (ky - Cy) / Math.max(I, 0.0001);
  const Ii = -(G - F) / Math.max(I, 0.0001);
  const crossPos = A * Bm - Aj * B > 0;
  const N = cur.dir !== undefined ? !!cur.dir : crossPos;
  let Ox;
  let Oy;
  if (!crossPos && N) {
    Ox = midX - K * J;
    Oy = midY - Ii * J;
  } else {
    Ox = midX + K * J;
    Oy = midY + Ii * J;
  }
  const p1 = new THREE.Vector2(F, Cy);
  const p2 = new THREE.Vector2(G, ky);
  if (fromPt) shape.lineTo(p1.x, p1.y);
  else shape.moveTo(p1.x, p1.y);
  const a0 = Math.atan2(p1.y - Oy, p1.x - Ox);
  const a1 = Math.atan2(p2.y - Oy, p2.x - Ox);
  shape.absarc(Ox, Oy, w, a0, a1, !N);
  return { p1, p2 };
}

/** Реф p_shapes.common — Shape из точек сечения (мм → world через unitsMm). */
export function cldPathShapeFromPoints(points, unitsMm, THREE) {
  const shape = new THREE.Shape();
  if (!Array.isArray(points) || !points.length) return shape;
  const u = Number(unitsMm) > 0 ? Number(unitsMm) : 1;

  if (points.length === 1 && points[0]?.center && Number(points[0].radius) > 0) {
    const c = points[0].center;
    const r = Number(points[0].radius) / u;
    shape.absarc(Number(c.x) / u, Number(c.y) / u, r, 0, Math.PI * 2, false);
    return shape;
  }

  const pts = points
    .filter((p) => p && (p.x != null || p.center))
    .map((p) => ({
      x: p.x != null ? Number(p.x) / u : Number(p.center.x) / u,
      y: p.y != null ? Number(p.y) / u : Number(p.center.y) / u,
      radius: (Number(p.radius) || 0) / u,
      center: p.center
        ? { x: Number(p.center.x) / u, y: Number(p.center.y) / u }
        : null,
      dir: p.dir || false,
    }));
  if (pts.length < 2) return shape;

  const plain = pts.filter((p) => !p.center);
  const holes = pts.filter((p) => p.center);
  if (plain.length) {
    const cornerMap = {};
    let cursor = null;
    if (plain[0].radius > 0) {
      cornerMap[0] = addRoundedCorner(
        shape,
        plain[plain.length - 1],
        plain[0],
        plain[1],
        null,
        THREE,
      );
      cursor = cornerMap[0].p2;
    } else {
      shape.moveTo(plain[0].x, plain[0].y);
      cursor = plain[0];
    }
    for (let y = 1; y < plain.length; y++) {
      const q = plain[y - 1];
      const uPt = plain[y];
      const v = plain[(y + 1) % plain.length];
      if (uPt.radius > 0) {
        cornerMap[y] = addRoundedCorner(shape, q, uPt, v, cursor, THREE);
        cursor = cornerMap[y].p2;
      } else {
        shape.lineTo(uPt.x, uPt.y);
        cursor = uPt;
      }
    }
    if (plain[0].radius > 0 && cornerMap[0]) {
      shape.lineTo(cornerMap[0].p1.x, cornerMap[0].p1.y);
    } else {
      shape.lineTo(plain[0].x, plain[0].y);
    }
  }
  holes.forEach((z) => {
    const hole = new THREE.Path();
    hole.absarc(z.center.x, z.center.y, z.radius, 0, Math.PI * 2, false);
    shape.holes.push(hole);
  });
  return shape;
}

/**
 * Реф CabinetPath._create_shape — точки сечения по spec.type.
 * sizeXMm = глубина (в материал), sizeYMm = ширина паза.
 */
export function cldPathCreateSectionPoints(spec, sizeXMm, sizeYMm, evalNum) {
  const type = String(spec?.type || 'common');
  const tp = spec?.type_params && typeof spec.type_params === 'object' ? spec.type_params : {};
  const n = (v, fb = 0) => {
    if (typeof evalNum === 'function') {
      const x = evalNum(v);
      return Number.isFinite(x) ? x : fb;
    }
    const x = Number(v);
    return Number.isFinite(x) ? x : fb;
  };
  const k = Number(sizeXMm) || 0;
  const m = Number(sizeYMm) || 0;
  const reverse = !!spec?.reverse;
  const cbl = n(tp.cbl, 0);
  const cbr = n(tp.cbr, 0);
  const ctl = n(tp.ctl, 0);
  const ctr = n(tp.ctr, 0);
  const w1 = n(tp.w1, 0);
  const h1 = n(tp.h1, 0);
  const w2 = n(tp.w2, 0);
  const h2 = n(tp.h2, 0);
  const r = n(tp.r, 0);

  switch (type) {
    case 'angle':
    case 'dx_angle':
      return reverse
        ? [
            { x: 0, y: 0, radius: 0 },
            { x: k, y: 0, radius: 0 },
            { x: 0, y: -m, radius: 0 },
          ]
        : [
            { x: 0, y: 0, radius: 0 },
            { x: k, y: 0, radius: 0 },
            { x: 0, y: m, radius: 0 },
          ];
    case 'radius':
      return [{ center: { x: 0, y: 0 }, radius: r > 0 ? r : 5, dir: true }];
    case 'rounded_corners':
      return [
        { x: 0, y: 0, radius: cbl, dir: true },
        { x: k, y: 0, radius: cbr, dir: true },
        { x: k, y: m, radius: ctr, dir: true },
        { x: 0, y: m, radius: ctl, dir: true },
      ];
    case 'trapeze_cut_by_offset':
      return [
        { x: w1, y: 0, radius: 0 },
        { x: k, y: h1, radius: 0 },
        { x: k - w2, y: m, radius: 0 },
        { x: h2, y: m, radius: 0 },
      ];
    case 'cut_corners': {
      const pts = [];
      if (cbl > 0) {
        pts.push({ x: 0, y: cbl, radius: 0 }, { x: cbl, y: 0, radius: 0 });
      } else {
        pts.push({ x: 0, y: 0, radius: 0 });
      }
      if (cbr > 0) {
        pts.push({ x: k - cbr, y: 0, radius: 0 }, { x: k, y: cbr, radius: 0 });
      } else {
        pts.push({ x: k, y: 0, radius: 0 });
      }
      if (ctr > 0) {
        pts.push({ x: k, y: m - ctr, radius: 0 }, { x: k - ctr, y: m, radius: 0 });
      } else {
        pts.push({ x: k, y: m, radius: 0 });
      }
      if (ctl > 0) {
        pts.push({ x: ctl, y: m, radius: 0 }, { x: 0, y: m - ctl, radius: 0 });
      } else {
        pts.push({ x: 0, y: m, radius: 0 });
      }
      return pts;
    }
    default:
      return [
        { x: 0, y: 0, radius: 0 },
        { x: k, y: 0, radius: 0 },
        { x: k, y: m, radius: 0 },
        { x: 0, y: m, radius: 0 },
      ];
  }
}

/**
 * Реф _build_trajectory — линия паза по панели (мм), затем CurvePath в world units.
 * parentSizeMm: {x,y,z}, parentOrient f|h|v, pathOrient h|v, direction z|-z.
 */
export function cldPathBuildTrajectoryMm(opts) {
  const parentSize = opts.parentSizeMm || {};
  const lx = Number(parentSize.x) || 0;
  const ly = Number(parentSize.y) || 0;
  const pathOrient = String(opts.pathOrient || 'h').toLowerCase() === 'v' ? 'v' : 'h';
  const parentOrient = String(opts.parentOrient || 'f').toLowerCase();
  const dir = String(opts.direction || '-z').toLowerCase();
  const dz = Number(opts.dz) || 0;
  const dz2 = Number(opts.dz2) || 0;
  const THREE = opts.THREE;

  let w; // display trajectory (как f.trajectory в рефе)
  if (pathOrient === 'v') {
    w = [
      new THREE.Vector3(0, dz, 0),
      new THREE.Vector3(0, ly - dz2, 0),
    ];
  } else {
    w = [
      new THREE.Vector3(dz, 0, 0),
      new THREE.Vector3(lx - dz2, 0, 0),
    ];
  }

  // Реф: x — скорректированная траектория под parentOrient + direction
  let x;
  switch (parentOrient) {
    case 'h':
    case 'v':
      x =
        pathOrient === 'v'
          ? dir === '-z'
            ? [new THREE.Vector3(0, dz, 0), new THREE.Vector3(0, ly - dz2, 0)]
            : [new THREE.Vector3(0, dz2, 0), new THREE.Vector3(0, ly - dz, 0)]
          : dir === 'z'
            ? [new THREE.Vector3(dz, 0, 0), new THREE.Vector3(lx - dz2, 0, 0)]
            : [new THREE.Vector3(dz2, 0, 0), new THREE.Vector3(lx - dz, 0, 0)];
      break;
    default:
      x =
        pathOrient === 'v'
          ? dir === 'z'
            ? [new THREE.Vector3(0, dz, 0), new THREE.Vector3(0, ly - dz2, 0)]
            : [new THREE.Vector3(0, dz2, 0), new THREE.Vector3(0, ly - dz, 0)]
          : dir === '-z'
            ? [new THREE.Vector3(dz, 0, 0), new THREE.Vector3(lx - dz2, 0, 0)]
            : [new THREE.Vector3(dz2, 0, 0), new THREE.Vector3(lx - dz, 0, 0)];
      break;
  }

  return { displayMm: w, extrudeMm: x };
}

export function cldPathCurveFromMm(pointsMm, unitsMm, THREE) {
  const u = Number(unitsMm) > 0 ? Number(unitsMm) : 1;
  const path = new THREE.CurvePath();
  const pts = (pointsMm || []).map(
    (p) => new THREE.Vector3(Number(p.x) / u, Number(p.y) / u, Number(p.z || 0) / u),
  );
  for (let i = 0; i < pts.length - 1; i++) {
    path.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
  }
  return path;
}

/**
 * Реф _build_helpers / _build_spec — повороты ExtrudeGeometry под parentOrient + pathOrient + direction.
 * parentSizeMm в мм; unitsMm — делитель.
 */
export function cldPathApplyExtrudeOrientation(geo, opts) {
  const THREE = opts.THREE;
  const parentOrient = String(opts.parentOrient || 'f').toLowerCase();
  const pathOrient = String(opts.pathOrient || 'h').toLowerCase() === 'v' ? 'v' : 'h';
  const dir = String(opts.direction || '-z').toLowerCase();
  const u = Number(opts.unitsMm) > 0 ? Number(opts.unitsMm) : 1;
  const ps = opts.parentSizeMm || {};
  const psx = (Number(ps.x) || 0) / u;
  const psy = (Number(ps.y) || 0) / u;
  const psz = (Number(ps.z) || 0) / u;

  switch (parentOrient) {
    case 'h':
      geo.rotateX(Math.PI / 2);
      if (pathOrient === 'v' && dir === '-z') geo.rotateZ(Math.PI);
      if (pathOrient === 'v' && dir === 'z') {
        geo.rotateY(Math.PI);
        geo.translate(0, 0, psz);
      }
      if (pathOrient === 'h' && dir === '-z') {
        geo.rotateY(Math.PI);
        geo.rotateX(Math.PI);
        geo.translate(psx, 0, 0);
      }
      break;
    case 'v':
      geo.rotateY(Math.PI / 2);
      if (pathOrient === 'v' && dir === 'z') {
        geo.rotateZ(Math.PI);
        geo.translate(0, psy, 0);
      }
      if (pathOrient === 'h' && dir === 'z') {
        geo.rotateX(Math.PI);
        geo.rotateZ(Math.PI);
      }
      if (pathOrient === 'h' && dir === '-z') geo.translate(0, 0, psz);
      break;
    default:
      if (pathOrient === 'v' && dir === 'z') geo.rotateY(Math.PI);
      if (pathOrient === 'v' && dir === '-z') {
        geo.rotateY(Math.PI);
        geo.rotateX(Math.PI);
        geo.translate(0, psy, 0);
      }
      if (pathOrient === 'h' && dir === 'z') {
        geo.rotateY(Math.PI);
        geo.translate(psx, 0, 0);
      }
      break;
  }
  return geo;
}

/** Размер сечения с учётом angle / dx_angle (реф _build_size). */
export function cldPathResolveSectionSizeMm(spec, sizeCfg, parentThickZMm, evalNum) {
  const type = String(spec?.type || 'common');
  const n = (v, fb = 0) => {
    if (typeof evalNum === 'function') {
      const x = evalNum(v);
      return Number.isFinite(x) ? x : fb;
    }
    const x = Number(v);
    return Number.isFinite(x) ? x : fb;
  };
  const angleDeg = n(spec?.type_params?.angle ?? 45, 45);
  const rad = (angleDeg * Math.PI) / 180;
  let sx;
  let sy;
  if (type === 'angle') {
    sx = Number(parentThickZMm) || n(sizeCfg?.x, 10);
    sy = Math.tan(rad) * sx;
  } else if (type === 'dx_angle') {
    sx = n(sizeCfg?.x, 10);
    sy = Math.tan(rad) * sx;
  } else if (type === 'radius') {
    const r = n(spec?.type_params?.r ?? sizeCfg?.x ?? 5, 5);
    sx = r;
    sy = r;
  } else {
    sx = n(sizeCfg?.x, 10);
    sy = n(sizeCfg?.y, 10);
  }
  return {
    x: sx > 0 ? sx : 10,
    y: sy > 0 ? sy : 10,
    z: n(sizeCfg?.z, 0),
  };
}
