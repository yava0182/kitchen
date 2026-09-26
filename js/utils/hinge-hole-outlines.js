/**
 * Красные контуры отверстий петли (debug overlay).
 * Фасад: Ø35 + 2× Ø3.5 на ±9.5 мм по Y от центра чашки.
 * Корпус: 2× Ø3.5 на ±16 мм по Y.
 * Контуры рисуются в локальной СК родителя (mFac / mDoor).
 */
import * as THREE from 'three';

function isHiddenByFlag() {
  try {
    return typeof window !== 'undefined' && window.__CLD_SHOW_HINGE_HOLE_OUTLINES === false;
  } catch {
    return false;
  }
}

function removeExisting(parent) {
  if (!parent) return;
  const rm = [];
  parent.traverse((o) => {
    if (o.name === 'hinge_hole_debug') rm.push(o);
  });
  rm.forEach((o) => {
    if (o.parent) o.parent.remove(o);
  });
}

function makeLineLoopXY(cx, cy, z, rMm, mmToScene, segments) {
  const r = rMm * mmToScene;
  const pts = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    pts.push(
      (cx * mmToScene) + r * Math.cos(t),
      (cy * mmToScene) + r * Math.sin(t),
      z * mmToScene
    );
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.LineLoop(geo);
}

function makeLineLoopYZ(x, cy, cz, rMm, mmToScene, segments) {
  const r = rMm * mmToScene;
  const pts = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    pts.push(
      x * mmToScene,
      (cy * mmToScene) + r * Math.cos(t),
      (cz * mmToScene) + r * Math.sin(t)
    );
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.LineLoop(geo);
}

/**
 * @param {THREE.Object3D} parent — меш или группа петли (локальная СК после ориентации модели)
 * @param {{ kind: 'facade'|'door', mmToScene: number }} opts — мм → единицы сцены (превью: 1/UNITS_MM, комната: 1)
 */
export function attachHingeHoleOutlines(parent, opts) {
  if (!parent || isHiddenByFlag()) return;
  const kind = opts?.kind;
  const mmToScene = Number(opts?.mmToScene);
  if (kind !== 'facade' && kind !== 'door') return;
  if (!Number.isFinite(mmToScene) || mmToScene <= 0) return;

  removeExisting(parent);

  // Превью: линии иначе утопают в геометрии двери/бока (depth buffer). Для отладки присадки — всегда поверх.
  const mat = new THREE.LineBasicMaterial({
    color: 0xff2222,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    opacity: 0.95,
  });
  const segs = 48;

  const g = new THREE.Group();
  g.name = 'hinge_hole_debug';
  g.renderOrder = 1000;
  g.frustumCulled = false;

  const eps = 1;

  if (kind === 'facade') {
    const zFace = 2 + eps;
    const cup = makeLineLoopXY(0, 0, zFace, 17.5, mmToScene, segs);
    cup.material = mat;
    g.add(cup);
    const s1 = makeLineLoopXY(0, -9.5, zFace, 1.75, mmToScene, segs);
    s1.material = mat;
    g.add(s1);
    const s2 = makeLineLoopXY(0, 9.5, zFace, 1.75, mmToScene, segs);
    s2.material = mat;
    g.add(s2);
  } else {
    const xFace = 6 + eps;
    const d1 = makeLineLoopYZ(xFace, 16, 0, 1.75, mmToScene, segs);
    d1.material = mat;
    g.add(d1);
    const d2 = makeLineLoopYZ(xFace, -16, 0, 1.75, mmToScene, segs);
    d2.material = mat;
    g.add(d2);
  }

  g.traverse((o) => {
    if (o.isLine || o.isLineSegments || o.isLineLoop) {
      o.renderOrder = 1000;
      o.frustumCulled = false;
    }
  });

  parent.add(g);
}
