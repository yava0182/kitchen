/**
 * Единый движок присадки (как Базис): одна математика для
 * редактора шаблона / стыка в конструкторе / CFRN.
 *
 * Конвенция мм шаблона:
 *   P = O + x·eX − y·eY − z·eZ
 * Тип установки (1–4) задаёт только макет/кадр. Ось сверла — из отверстия
 * (direction в СК шаблона → eX/eY/eZ), как в Базисе: перпендикуляр плоскости отверстия.
 * 3D-модель: та же формула от O + jointModelVisualOffsetMm.
 *
 * Векторы plain {x,y,z} — без зависимости от THREE.
 */

export const DIR_VEC = {
  x: [1, 0, 0],
  '-x': [-1, 0, 0],
  y: [0, 1, 0],
  '-y': [0, -1, 0],
  z: [0, 0, 1],
  '-z': [0, 0, -1],
};

export function v3(x, y, z) {
  return { x: Number(x) || 0, y: Number(y) || 0, z: Number(z) || 0 };
}

export function vAdd(a, b) {
  return v3(a.x + b.x, a.y + b.y, a.z + b.z);
}

export function vScale(a, s) {
  return v3(a.x * s, a.y * s, a.z * s);
}

export function vLen(a) {
  return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
}

export function vNorm(a) {
  const L = vLen(a);
  if (!(L > 1e-12)) return v3(1, 0, 0);
  return vScale(a, 1 / L);
}

export function vDot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function dirFromKey(dirKey) {
  const k = String(dirKey || '-z').toLowerCase();
  const a = DIR_VEC[k] || DIR_VEC['-z'];
  return v3(a[0], a[1], a[2]);
}

/** P = O + x·eX − y·eY − z·eZ (мм / mmPerUnit). */
export function templatePoint(O, eX, eY, eZ, xMm, yMm, zMm, mmPerUnit) {
  const u = Number(mmPerUnit) > 0 ? Number(mmPerUnit) : 1;
  return vAdd(
    O,
    vAdd(
      vScale(eX, (Number(xMm) || 0) / u),
      vAdd(
        vScale(eY, -(Number(yMm) || 0) / u),
        vScale(eZ, -(Number(zMm) || 0) / u),
      ),
    ),
  );
}

export function applyFacingFlip(yMm, zMm, dirKey, facing) {
  const face = String(facing || 'inside').toLowerCase();
  const flip = face === 'outside' || Number(facing) === 180;
  if (!flip) {
    return {
      yMm: Number(yMm) || 0,
      zMm: Number(zMm) || 0,
      dirKey: String(dirKey ?? '-z').toLowerCase(),
    };
  }
  const k = String(dirKey ?? '-z').toLowerCase();
  let next = k;
  if (k === 'y') next = '-y';
  else if (k === '-y') next = 'y';
  else if (k === 'z') next = '-z';
  else if (k === '-z') next = 'z';
  return {
    yMm: -(Number(yMm) || 0),
    zMm: -(Number(zMm) || 0),
    dirKey: next,
  };
}

export function classifyIsFace(hole, faceThickMm) {
  const side = String(hole?.mountSide || hole?.mount_side || 'auto').toLowerCase();
  if (side === 'face' || side === 'plast') return true;
  if (side === 'edge' || side === 'torets') return false;
  const xMm = Number(hole?.xMm ?? hole?.x) || 0;
  const thick = Number(faceThickMm) > 0 ? Number(faceThickMm) : 16;
  return Math.abs(xMm) < thick * 0.5 - 0.5;
}

/**
 * Ось сверла = direction отверстия в СК кадра (Базис: нормаль плоскости отверстия).
 * setupType не подменяет ось — один движок для конфирмата/эксцентра/любой фурнитуры.
 */
export function drillDirInFrame(_setupType, dirKey, eX, eY, eZ) {
  const local = dirFromKey(dirKey);
  return vNorm(
    vAdd(
      vScale(eX, local.x),
      vAdd(vScale(eY, local.y), vScale(eZ, local.z)),
    ),
  );
}

/**
 * Кадр макета редактора шаблона (как buildPanels + origin в admin).
 */
export function buildEditorMockFrame(opts = {}) {
  const setupType = Number(opts.setupType) || 3;
  const fw = Number(opts.frameW) > 0 ? Number(opts.frameW) : 100;
  const fh = Number(opts.frameH) > 0 ? Number(opts.frameH) : 100;
  const fd = Number(opts.frameD) > 0 ? Number(opts.frameD) : 100;
  const T = Number(opts.panelThickMm) > 0 ? Number(opts.panelThickMm) : 16;
  const u = Number(opts.mmPerUnit) > 0 ? Number(opts.mmPerUnit) : 1;

  const W = fw * u;
  const H = fh * u;
  const D = fd * u;
  let originX = 0;
  let originY = 0;
  let originZ = D / 2;
  switch (setupType) {
    case 2:
      originX = -W / 2 + T * u;
      originY = -H / 2 + T * u;
      originZ = 0;
      break;
    case 3:
      originX = -W / 2;
      originY = 0;
      originZ = 0;
      break;
    case 4:
      originX = 0;
      originY = 0;
      originZ = D / 2;
      break;
    default:
      originX = 0;
      originY = 0;
      originZ = D / 2;
      break;
  }

  return {
    setupType,
    O: v3(originX, originY, originZ),
    eX: v3(1, 0, 0),
    eY: v3(0, 1, 0),
    eZ: v3(0, 0, 1),
    faceThickMm: T,
    mmPerUnit: u,
    frameW: fw,
    frameH: fh,
    frameD: fd,
  };
}

/**
 * Отверстия (Базис): (x,y,z) = вход на плоскости; цилиндр вдоль dir на depth.
 * axisPoint = entry + dir·(depth/2) — геометрический центр объёма.
 */
export function placeTemplateHoles(opts = {}) {
  const holes = Array.isArray(opts.holes) ? opts.holes : [];
  const O = opts.O || v3(0, 0, 0);
  const eX = vNorm(opts.eX || v3(1, 0, 0));
  const eY = vNorm(opts.eY || v3(0, 1, 0));
  const eZ = vNorm(opts.eZ || v3(0, 0, 1));
  const u = Number(opts.mmPerWorldUnit) > 0 ? Number(opts.mmPerWorldUnit) : 1;
  const setupType = Number(opts.setupType) || 3;
  const faceThickMm = Number(opts.faceThickMm) > 0 ? Number(opts.faceThickMm) : 16;
  const facing = opts.facing || 'inside';

  const out = [];
  for (let i = 0; i < holes.length; i++) {
    const hole = holes[i];
    if (!hole) continue;
    const diameter = Number(hole.diameterMm ?? hole.diameter) || 0;
    let depth = Number(hole.depthMm ?? hole.depth) || 0;
    if (!(diameter > 0)) continue;
    if (!(depth > 0) && !hole.through) continue;

    const xMm = Number(hole.xMm ?? hole.x) || 0;
    const yRaw = Number(hole.yMm ?? hole.y) || 0;
    const zRaw = Number(hole.zMm ?? hole.z) || 0;
    const isFace = classifyIsFace(hole, faceThickMm);
    const flipped = applyFacingFlip(
      yRaw,
      zRaw,
      hole.dirKey ?? hole.direction ?? '-z',
      facing,
    );

    if (isFace && !hole.through) {
      depth = Math.min(depth || faceThickMm, faceThickMm);
    }
    if (!(depth > 0)) depth = isFace ? faceThickMm : 16;

    const entry = templatePoint(O, eX, eY, eZ, xMm, flipped.yMm, flipped.zMm, u);
    const dir = drillDirInFrame(setupType, flipped.dirKey, eX, eY, eZ);
    const half = (depth / u) * 0.5;
    const axisPoint = vAdd(entry, vScale(dir, half));

    out.push({
      hole,
      isFace,
      diameter,
      depth,
      through: !!hole.through,
      dirKey: flipped.dirKey,
      axisPoint,
      entry,
      dir,
      xMm,
      yMm: flipped.yMm,
      zMm: flipped.zMm,
    });
  }
  return out;
}

/** 3D: O + offset в тех же осях. */
export function placeTemplateHardware(opts = {}) {
  const O = opts.O || v3(0, 0, 0);
  const eX = vNorm(opts.eX || v3(1, 0, 0));
  const eY = vNorm(opts.eY || v3(0, 1, 0));
  const eZ = vNorm(opts.eZ || v3(0, 0, 1));
  const u = Number(opts.mmPerWorldUnit) > 0 ? Number(opts.mmPerWorldUnit) : 1;
  const off = opts.offsetMm || {};
  const position = templatePoint(
    O,
    eX,
    eY,
    eZ,
    Number(off.x) || 0,
    Number(off.y) || 0,
    Number(off.z) || 0,
    u,
  );
  return {
    position,
    offsetMm: {
      x: Number(off.x) || 0,
      y: Number(off.y) || 0,
      z: Number(off.z) || 0,
    },
  };
}

export function frameFromAny(O, eX, eY, eZ) {
  const pick = (v) => {
    if (!v) return v3(0, 0, 0);
    if (typeof v.x === 'number') return v3(v.x, v.y, v.z);
    if (Array.isArray(v)) return v3(v[0], v[1], v[2]);
    return v3(0, 0, 0);
  };
  return {
    O: pick(O),
    eX: vNorm(pick(eX)),
    eY: vNorm(pick(eY)),
    eZ: vNorm(pick(eZ)),
  };
}

const ClodisDrillEngine = {
  DIR_VEC,
  v3,
  vAdd,
  vScale,
  vNorm,
  vDot,
  templatePoint,
  applyFacingFlip,
  classifyIsFace,
  drillDirInFrame,
  buildEditorMockFrame,
  placeTemplateHoles,
  placeTemplateHardware,
  frameFromAny,
};

export default ClodisDrillEngine;

if (typeof globalThis !== 'undefined') {
  globalThis.ClodisDrillEngine = ClodisDrillEngine;
}
