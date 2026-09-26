/**
 * Единый кадр тип 3 (T-стык): шкаф, админ-превью, CFRN.
 * Роли: face = пласть (mountSide face), edge = торец (mountSide edge).
 * Базис от пятна контакта (полоса стыка на торце edge):
 *   eZ — вдоль шва; eY — вдоль кромки торца (16 мм); eX — от наружной пласти face к торцу edge.
 * O — наружная пласть face на линии шва (пивот шаблона).
 */
import * as THREE from '/node_modules/three/build/three.module.js';
import { panelThinAxisWorld, panelThicknessMm } from '/js/joint-engine-v2.js?v=20260715-joint-flush-active';
import { getJointStripeFrameWorld } from '/js/panel-edge-frame.js';

const _DRILL_DIR_VEC = {
  x: [1, 0, 0],
  '-x': [-1, 0, 0],
  y: [0, 1, 0],
  '-y': [0, -1, 0],
  z: [0, 0, 1],
  '-z': [0, 0, -1],
};

/** Направление ключа шаблона в мире через базис кадра (PlanPlace: R · templateDir). */
export function jointTemplateDirWorldFromFrame(dirKey, eX, eY, eZ) {
  const k = String(dirKey || '-z').toLowerCase();
  const arr = _DRILL_DIR_VEC[k] || _DRILL_DIR_VEC['-z'];
  return new THREE.Vector3()
    .addScaledVector(eX, arr[0])
    .addScaledVector(eY, arr[1])
    .addScaledVector(eZ, arr[2])
    .normalize();
}

/** Кватернион базиса кадра (столбцы = eX, eY, eZ). */
export function setup3FrameQuaternion(frame) {
  const m = new THREE.Matrix4().makeBasis(
    frame.eX.clone().normalize(),
    frame.eY.clone().normalize(),
    frame.eZ.clone().normalize(),
  );
  return new THREE.Quaternion().setFromRotationMatrix(m);
}

/**
 * Ориентация панели-пласти (face) для правила бочонков.
 */
function _setup3FacePanelOrient(facePanel) {
  let cur = facePanel;
  for (let i = 0; i < 8 && cur; i++) {
    const o = String(
      cur?.config?.spec?.orientation ||
      cur?.config?.orientation ||
      cur?.userData?.orientation ||
      '',
    ).toLowerCase();
    if (o === 'v' || o === 'vertical') return 'v';
    if (o === 'h' || o === 'horizontal') return 'h';
    if (o === 'f' || o === 'frontal' || o === 'front' || o === 'face') return 'f';
    if (cur?.userData?.isFacade) return 'f';
    if (cur?.userData?.isSidePlank || cur?.userData?.isSideOverlay) return 'v';
    cur = cur.parent;
  }
  return 'f';
}

/** eZ вдоль шва: предпочитаем +Y / +Z / +X (стабильная база). */
export function alignSetup3SeamDirCanonical(eZ) {
  if (!eZ || eZ.lengthSq() < 1e-18) return eZ;
  const prefer = [
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(1, 0, 0),
  ];
  let best = prefer[0];
  let bestAbs = -1;
  for (const a of prefer) {
    const ad = Math.abs(eZ.dot(a));
    if (ad > bestAbs) {
      bestAbs = ad;
      best = a;
    }
  }
  if (eZ.dot(best) < 0) eZ.negate();
  return eZ;
}

/**
 * Базис бочонка эксцентра (Базис / мебель):
 *  — одна стойка (v), верх+низ: точечки в ОДНУ сторону;
 *  — фасад/полка (f|h), лево+право (две параллельные): друг на друга
 *    («Снаружи» разворачивает оба через facing flip).
 */
export function alignSetup3BarrelLook(eX, eY, eZ, { facePanel, faceBBox, seamWorld }) {
  if (!eX || !eY || !eZ || !faceBBox || !seamWorld) return { eY, eZ };
  alignSetup3SeamDirCanonical(eZ);
  eY.copy(new THREE.Vector3().crossVectors(eZ, eX).normalize());

  const ori = _setup3FacePanelOrient(facePanel);
  const faceC = faceBBox.getCenter(new THREE.Vector3());

  if (ori === 'v') {
    // Одна деталь, два края: общий «внутрь корпуса» (один и тот же вектор для верха и низа).
    const thin = panelThinAxisWorld(facePanel, faceBBox);
    let interior = thin && thin.lengthSq() > 1e-12
      ? thin.clone().normalize()
      : new THREE.Vector3(0, 0, 1);
    const towardScene = new THREE.Vector3(-faceC.x, -faceC.y, -faceC.z);
    if (towardScene.lengthSq() > 1e-12 && interior.dot(towardScene) < 0) interior.negate();
    interior.sub(eX.clone().multiplyScalar(interior.dot(eX)));
    if (interior.lengthSq() < 1e-12) return { eY, eZ };
    interior.normalize();
    if (eY.dot(interior) < 0) {
      eY.negate();
      eZ.negate();
    }
    return { eY, eZ };
  }

  // f|h: параллельные бока — бочонки друг на друга (к центру пласти).
  const toCenter = faceC.clone().sub(seamWorld);
  toCenter.sub(eX.clone().multiplyScalar(toCenter.dot(eX)));
  if (toCenter.lengthSq() < 1e-12) return { eY, eZ };
  toCenter.normalize();

  if (Math.abs(eY.dot(toCenter)) > 0.25) {
    if (eY.dot(toCenter) < 0) {
      eY.negate();
      eZ.negate();
    }
  } else if (eX.dot(toCenter) > 0) {
    // eY ⊥ toCenter: зеркало одного края, чтобы смотрели друг к другу.
    eY.negate();
    eZ.negate();
  }
  return { eY, eZ };
}

/** @deprecated см. alignSetup3BarrelLook */
export function alignSetup3FrameEyEzCanonical(eX, eY, eZ) {
  alignSetup3SeamDirCanonical(eZ);
  if (eX && eY && eZ && eX.lengthSq() > 1e-18 && eZ.lengthSq() > 1e-18) {
    const y = new THREE.Vector3().crossVectors(eZ, eX);
    if (y.lengthSq() > 1e-18) eY.copy(y.normalize());
  }
  return { eY, eZ };
}

/**
 * Кадр тип 3 из ролей пласть/торец (не из ориентации v/h).
 * edgeJointIdx — jointIdx на панели-торце (полоса стыка / пятно контакта).
 * contact — тот же контакт, что фиолетовая лента: оси/толщины с пятна.
 */
export function buildSetup3CanonicalFrameWorld({
  facePanel,
  edgePanel,
  faceBBox,
  edgeBBox,
  seamWorld,
  tSeamWorld,
  mmPerWorldUnit,
  edgeJointIdx = null,
  contact = null,
  /** @deprecated use facePanel */
  standPanel = null,
  /** @deprecated use edgePanel */
  shelfPanel = null,
  /** @deprecated use faceBBox */
  standBBox = null,
  /** @deprecated use edgeBBox */
  shelfBBox = null,
  /** @deprecated use edgeJointIdx */
  standJointIdx = null,
}) {
  const fp = facePanel || shelfPanel;
  const ep = edgePanel || standPanel;
  const fb = faceBBox || shelfBBox;
  const eb = edgeBBox || standBBox;
  const jIdx = Number.isFinite(Number(edgeJointIdx))
    ? Number(edgeJointIdx)
    : Number(standJointIdx);
  const u = Number(mmPerWorldUnit) > 0 ? Number(mmPerWorldUnit) : 10;

  if (!fp || !ep || !fb || !eb || !seamWorld) return null;

  const faceC = fb.getCenter(new THREE.Vector3());
  const edgeC = eb.getCenter(new THREE.Vector3());

  let faceThickMm = panelThicknessMm(fp, fb, u);
  let edgeThickMm = panelThicknessMm(ep, eb, u);
  if (Number(contact?.plastThickMm) > 0 && Number(contact.plastThickMm) <= 64) {
    faceThickMm = Number(contact.plastThickMm);
  }
  if (Number(contact?.toretsThickMm) > 0 && Number(contact.toretsThickMm) <= 64) {
    edgeThickMm = Number(contact.toretsThickMm);
  }
  // Иначе O = seam ± (сотни мм) — крепёж улетает мимо фиолетовой линии.
  if (!(faceThickMm > 0) || faceThickMm > 64) faceThickMm = 16;
  if (!(edgeThickMm > 0) || edgeThickMm > 64) edgeThickMm = 16;

  let eZ;
  let eX;
  let eY;

  if (contact?.hostSeamDirWorld && contact?.hostOutwardWorld) {
    // Как фиолетовая лента / линия стыка в БМ: оси только с пятна контакта.
    eZ = contact.hostSeamDirWorld.clone().normalize();
    const hostOut = contact.hostOutwardWorld.clone().normalize();
    if (String(contact.hostFaceType || '') === 'plast') {
      eX = hostOut.clone(); // пласть → торец
    } else {
      eX = hostOut.clone().multiplyScalar(-1);
    }
    eX.sub(eZ.clone().multiplyScalar(eZ.dot(eX)));
    if (eX.lengthSq() < 1e-12) {
      eX = edgeC.clone().sub(faceC);
      eX.sub(eZ.clone().multiplyScalar(eZ.dot(eX)));
    }
    if (eX.lengthSq() < 1e-12) {
      eX = panelThinAxisWorld(fp, fb).clone();
      eX.sub(eZ.clone().multiplyScalar(eZ.dot(eX)));
    }
    if (eX.lengthSq() < 1e-12) eX.set(1, 0, 0);
    eX.normalize();
    // Ортонормировка как лента стыка (seam × edge), без barrel-flip — иначе y/z шаблона уезжают с линии.
    let edgeDir = contact.hostEdgeDirWorld
      ? contact.hostEdgeDirWorld.clone().normalize()
      : new THREE.Vector3();
    edgeDir.sub(eZ.clone().multiplyScalar(eZ.dot(edgeDir)));
    if (edgeDir.lengthSq() < 1e-12) {
      edgeDir = new THREE.Vector3().crossVectors(eZ, eX);
    }
    if (edgeDir.lengthSq() < 1e-12) edgeDir.set(0, 1, 0);
    edgeDir.normalize();
    let n = new THREE.Vector3().crossVectors(eZ, edgeDir);
    if (n.dot(eX) < 0) n.negate();
    if (n.lengthSq() > 1e-12) eX.copy(n.normalize());
    eY = new THREE.Vector3().crossVectors(eZ, eX).normalize();
  } else {
    const stripe =
      Number.isFinite(jIdx) && jIdx >= 0 && jIdx <= 3
        ? getJointStripeFrameWorld(ep, jIdx)
        : null;

    if (stripe?.outwardWorld && stripe?.seamDirWorld) {
      eZ = stripe.seamDirWorld.clone().normalize();
      eX = stripe.outwardWorld.clone().normalize().multiplyScalar(-1);
      eX.sub(eZ.clone().multiplyScalar(eZ.dot(eX)));
      if (eX.lengthSq() < 1e-12) {
        eX = edgeC.clone().sub(faceC);
        eX.sub(eZ.clone().multiplyScalar(eZ.dot(eX)));
      }
      if (eX.lengthSq() < 1e-12) {
        eX = panelThinAxisWorld(fp, fb).clone();
        eX.sub(eZ.clone().multiplyScalar(eZ.dot(eX)));
      }
      if (eX.lengthSq() < 1e-12) eX.set(1, 0, 0);
      eX.normalize();
      eY = new THREE.Vector3().crossVectors(eZ, eX).normalize();
    } else {
      eZ = (tSeamWorld || new THREE.Vector3(0, 0, 1)).clone().normalize();
      eX = edgeC.clone().sub(faceC);
      eX.sub(eZ.clone().multiplyScalar(eZ.dot(eX)));
      if (eX.lengthSq() < 1e-12) {
        const thin = panelThinAxisWorld(fp, fb).clone();
        eX.copy(thin);
        eX.sub(eZ.clone().multiplyScalar(eZ.dot(eX)));
      }
      if (eX.lengthSq() < 1e-12) {
        eX = new THREE.Vector3().crossVectors(eZ, new THREE.Vector3(0, 1, 0));
        if (eX.lengthSq() < 1e-12) eX.set(1, 0, 0);
      }
      eX.normalize();
      eY = new THREE.Vector3().crossVectors(eZ, eX).normalize();
    }
  }

  // Barrel-look (v32): одна деталь v → точки в одну сторону; f|h параллельные → друг на друга.
  // Контакт задаёт оси шва; знаки eY/eZ всё равно выравниваем под правило бочонков.
  alignSetup3BarrelLook(eX, eY, eZ, {
    facePanel: fp,
    faceBBox: fb,
    seamWorld,
  });

  const toEdgeNorm = eX.clone();
  const O = seamWorld.clone().addScaledVector(eX, -(faceThickMm / u));

  // Сверло в пласть = вдоль eX (к торцу), не eX×eY (= шов).
  const plastDrill = eX.clone().normalize();

  return {
    O,
    seamWorld: seamWorld.clone(),
    eX,
    eY,
    eZ,
    faceThickMm,
    edgeThickMm,
    facePanel: fp,
    edgePanel: ep,
    shelfPanel: fp,
    standPanel: ep,
    standThickMm: faceThickMm,
    shelfThickMm: edgeThickMm,
    toEdgeNorm,
    edgeShelfAttach: true,
    plastThroughShelf: plastDrill,
    plastInward: eX.clone(),
    edgeIntoStand: toEdgeNorm.clone(),
  };
}

/** Точка отверстия: O (наружная пласть face) + x·eX − y·eY − z·eZ.
 * x > T/2 — продолжение в торец edge, но mountSide/isFace из шаблона важнее порога. */
export function setup3TemplatePointWorld(frame, xMm, yMm, zMm, mmPerWorldUnit, opts = null) {
  const u = mmPerWorldUnit;
  const pt = frame.O.clone()
    .addScaledVector(frame.eY, -yMm / u)
    .addScaledVector(frame.eZ, -zMm / u);

  const tMm = frame.faceThickMm ?? frame.standThickMm;
  const halfMm = tMm * 0.5;
  const side = String(opts?.mountSide || '').toLowerCase();
  let useEdgeBranch = !!(frame.edgeShelfAttach && frame.toEdgeNorm && xMm > halfMm + 0.5);
  if (opts?.isFace === true || side === 'face' || side === 'plast') useEdgeBranch = false;
  else if (opts?.isFace === false || side === 'edge' || side === 'torets') useEdgeBranch = true;
  if (useEdgeBranch && frame.toEdgeNorm) {
    pt.addScaledVector(frame.eX, halfMm / u);
    pt.addScaledVector(frame.toEdgeNorm, (xMm - halfMm) / u);
  } else {
    pt.addScaledVector(frame.eX, xMm / u);
  }
  return pt;
}

/** Направление сверла в торец: +x шаблона = в торец edge. */
export function setup3EdgeDrillDirWorld(dirKey, intoEdge, eX, eY, eZ) {
  const k = String(dirKey || 'x').toLowerCase();
  if (intoEdge && intoEdge.lengthSq() > 1e-18) {
    if (k === 'x') return intoEdge.clone().normalize();
    if (k === '-x') return intoEdge.clone().normalize().multiplyScalar(-1);
  }
  return jointTemplateDirWorldFromFrame(k, eX, eY, eZ);
}

/**
 * Направление сверла из direction отверстия (Базис: ось ⊥ плоскости, куда сверлят).
 * isFace не подменяет ось — пласть/торец задаются автором в шаблоне (x/y/z + direction).
 */
export function setup3ResolveDrillDir(frame, dirKey, _isFace) {
  if (!frame) return new THREE.Vector3(0, 0, -1);
  const k = String(dirKey || '-z').toLowerCase();
  // ±X в торец: совместить с геометрической нормалью торца, если кадр её знает.
  if ((k === 'x' || k === '-x') && frame.toEdgeNorm && frame.toEdgeNorm.lengthSq() > 1e-18) {
    return setup3EdgeDrillDirWorld(k, frame.toEdgeNorm, frame.eX, frame.eY, frame.eZ);
  }
  return jointTemplateDirWorldFromFrame(k, frame.eX, frame.eY, frame.eZ);
}

export function setup3ClassifyHoleFace(hole, faceThickMm) {
  const mountSide = String(hole?.mountSide || 'auto').toLowerCase();
  if (mountSide === 'face') return true;
  if (mountSide === 'edge') return false;
  const xMm = Number(hole?.xMm ?? hole?.x) || 0;
  const thick = Number(faceThickMm) > 0 ? Number(faceThickMm) : 16;
  return Math.abs(xMm) < thick * 0.5 - 0.5;
}

export function normalizeSetup3Hole(h) {
  if (!h) return null;
  const diameterMm = Number(h.diameterMm ?? h.diameter) || 0;
  const depthMm = Number(h.depthMm ?? h.depth) || 0;
  if (!(diameterMm > 0) || !(depthMm > 0)) return null;
  return {
    name: String(h.name || ''),
    diameterMm,
    depthMm: Math.min(depthMm, 120),
    xMm: Number(h.xMm ?? h.x) || 0,
    yMm: Number(h.yMm ?? h.y) || 0,
    zMm: Number(h.zMm ?? h.z) || 0,
    through: !!h.through,
    dirKey: String(h.dirKey ?? h.direction ?? '-z').toLowerCase(),
    coordBase: String(h.coordBase || 'auto').toLowerCase(),
    mountSide: String(h.mountSide || 'auto').toLowerCase(),
  };
}

/** BBox макета buildPanels(2|3) в единицах сцены админки (как admin-new-bundle-r4 / PlanPlace). */
export function buildSetup3AdminMockBBoxes(fw, fh, fd, U, setupType = 3) {
  const T = 16 * U;
  const W = fw * U;
  const H = fh * U;
  const D = fd * U;
  const halfW = W / 2;
  const st = Number(setupType) || 3;
  const Wdetail = Math.max(T, W - T);

  const faceBBox = new THREE.Box3(
    new THREE.Vector3(-halfW, -H / 2, -D / 2),
    new THREE.Vector3(-halfW + T, H / 2, D / 2),
  );

  let edgeBBox;
  let seamX;
  let seamY;
  const seamZ = 0;

  if (st === 2) {
    edgeBBox = new THREE.Box3(
      new THREE.Vector3(T - halfW, -H / 2, -D / 2),
      new THREE.Vector3(halfW, -H / 2 + T, D / 2),
    );
    seamX = -halfW + T;
    seamY = -H / 2 + T;
  } else {
    edgeBBox = new THREE.Box3(
      new THREE.Vector3(T - halfW, -T / 2, -D / 2),
      new THREE.Vector3(halfW, T / 2, D / 2),
    );
    seamX = T - halfW;
    seamY = 0;
  }

  return {
    faceBBox,
    edgeBBox,
    standBBox: faceBBox,
    shelfBBox: edgeBBox,
    T,
    W,
    H,
    D,
    Wdetail,
    seamX,
    seamY,
    seamZ,
  };
}

/**
 * Кадр для 3D-превью шаблона в админке.
 * Вертикаль макета = пласть (face), горизонталь = торец (edge); полоса — левый торец полки (h, j=2).
 */
export function buildSetup3AdminPreviewFrame({
  fw,
  fh,
  fd,
  U,
  pMm = 0,
  seamLenMm = null,
  setupType = 3,
}) {
  const { faceBBox, edgeBBox, seamX, seamY, seamZ } = buildSetup3AdminMockBBoxes(fw, fh, fd, U, setupType);
  const mmPerWorldUnit = 1 / U;
  const st = Number(setupType) || 3;

  const seamWorld = new THREE.Vector3(seamX, seamY, seamZ);
  const tSeamWorld = new THREE.Vector3(0, 0, 1);

  const facePanel = { config: { orientation: 'v' } };
  const edgePanel = { config: { orientation: 'h' } };

  return buildSetup3CanonicalFrameWorld({
    facePanel,
    edgePanel,
    faceBBox,
    edgeBBox,
    seamWorld,
    tSeamWorld,
    mmPerWorldUnit,
    edgeJointIdx: st === 2 ? 1 : 2,
  });
}

/** @deprecated Используйте buildSetup3AdminPreviewFrame. */
export function buildSetup3AdminPreviewFrameWithPivot(opts) {
  return buildSetup3AdminPreviewFrame(opts);
}

/** @deprecated O задаётся в buildSetup3CanonicalFrameWorld. */
export function applyAdminPreviewPivotOnStandPlast(frame) {
  return frame;
}
