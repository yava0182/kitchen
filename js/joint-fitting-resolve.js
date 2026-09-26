/**
 * Единая логика стыковых отверстий (превью constructor-clodis + CFRN export).
 * Setup 1,2,4: базис от хоста (nIn, u1, u2), смещения (x, −y, −z).
 * Setup 3 (T-стык): станция схемы на линии стыка (= клик в рефе) + мм шаблона
 *   через ClodisDrillEngine.placeTemplateHoles:
 *   P = O + x·eX − y·eY − z·eZ; ось = direction отверстия (как Базис).
 *
 * mmPerWorldUnit: в конструкторе UNITS_MM (10), в комнате CFRN — 1 мм на юнит сцены.
 */
import * as THREE from '/node_modules/three/build/three.module.js';
import { panelThicknessMm } from '/js/joint-engine-v2.js?v=20260727-ecc-export';
import { getJointStripeFrameWorld } from '/js/panel-edge-frame.js?v=20260727-blb-seam';
import {
  buildSetup3CanonicalFrameWorld,
  jointTemplateDirWorldFromFrame,
  setup3TemplatePointWorld,
} from '/js/joint-setup3-frame.js?v=20260727-drawer-holes';
import {
  mapJointIdxForStandAnchor,
} from '/js/joint-panel-local.js?v=20260727-drawer-holes';
import {
  placeTemplateHoles,
  placeTemplateHardware,
  buildEditorMockFrame,
  templatePoint,
} from '/js/clodis-drill-engine.js?v=20260727-drawer-holes';

export { jointTemplateDirWorldFromFrame, buildSetup3CanonicalFrameWorld } from '/js/joint-setup3-frame.js?v=20260727-drawer-holes';
export {
  placeTemplateHoles,
  placeTemplateHardware,
  buildEditorMockFrame,
  templatePoint,
} from '/js/clodis-drill-engine.js?v=20260727-drawer-holes';

/** Пивот панели в мире (угол core по __cldPivotCodes). */
function _panelPivotWorld(panelRoot) {
  if (!panelRoot?.traverse) return null;
  let codes = null;
  let core = null;
  panelRoot.traverse((ch) => {
    if (ch.userData?.__cldPivotCodes && !codes) codes = { ...ch.userData.__cldPivotCodes };
    if (ch.isMesh && String(ch.name || '').endsWith('_core') && !core) core = ch;
  });
  if (!core?.geometry) return null;
  if (!codes) codes = { x: -1, y: -1, z: -1 };
  core.updateWorldMatrix(true);
  const p = core.geometry.parameters || {};
  const w = p.width ?? 0;
  const h = p.height ?? 0;
  const d = p.depth ?? 0;
  const lx = codes.x === 1 ? w / 2 : codes.x === -1 ? -w / 2 : 0;
  const ly = codes.y === 1 ? h / 2 : codes.y === -1 ? -h / 2 : 0;
  const lz = codes.z === 1 ? d / 2 : codes.z === -1 ? -d / 2 : 0;
  const v = new THREE.Vector3(lx, ly, lz);
  v.add(core.position);
  v.applyMatrix4(core.matrixWorld);
  return v;
}

/**
 * Точка на линии стыка (CAD): pMm от края контакта вдоль шва.
 * При наличии contact.seamOverlap* — отрезок перекрытия, не полный край панели/секции.
 */
export function jointSeamWorldPoint(panelRoot, jointIdx, seamLenMm, pMm, mmPerWorldUnit = 10, contact = null) {
  const u = Number(mmPerWorldUnit) > 0 ? Number(mmPerWorldUnit) : 10;
  const fromContact = _jointSeamWorldPointFromContact(contact, pMm, u);
  if (fromContact) return fromContact;
  // Без отрезка контакта — нет линии стыка (Базис). Не ехать по полному торцу панели.
  void panelRoot;
  void jointIdx;
  void seamLenMm;
  return null;
}

/**
 * CAD: станции вдоль отрезка контакта (seamOverlapMin/Max), длина = seamOverlapMm.
 * Как фиолетовая лента Базиса: линия на ПЯТНЕ стыка (mid по edge), не в центре пласти панели.
 */
function _jointSeamWorldPointFromContact(contact, pMm, mmPerWorldUnit) {
  if (!contact?.hostFaceCenterWorld || !contact?.hostSeamDirWorld) return null;
  const ovMm = Number(contact.seamOverlapMm) || 0;
  const sMin = Number(contact.seamOverlapMinWorld);
  const sMax = Number(contact.seamOverlapMaxWorld);
  if (!(ovMm > 1) || !Number.isFinite(sMin) || !Number.isFinite(sMax) || !(sMax > sMin)) {
    return null;
  }
  const u = Number(mmPerWorldUnit) > 0 ? Number(mmPerWorldUnit) : 10;
  const seamDir = contact.hostSeamDirWorld.clone().normalize();
  const c = contact.hostFaceCenterWorld.clone();
  // Сдвиг на середину пятна по короткой оси — иначе крепёж с пласти фасада
  // садится в центр панели, а лента уже на стыке с боком.
  const eMin = Number(contact.edgeOverlapMinWorld);
  const eMax = Number(contact.edgeOverlapMaxWorld);
  if (
    contact.hostEdgeDirWorld &&
    Number.isFinite(eMin) &&
    Number.isFinite(eMax) &&
    eMax > eMin
  ) {
    const edgeDir = contact.hostEdgeDirWorld.clone().normalize();
    const midE = (eMin + eMax) * 0.5;
    c.addScaledVector(edgeDir, midE - c.dot(edgeDir));
  }
  const cS = c.dot(seamDir);
  const p0 = c.clone().addScaledVector(seamDir, sMin - cS);
  const p1 = c.clone().addScaledVector(seamDir, sMax - cS);
  const pivot = _panelPivotWorld(contact.hostPanel);
  let start = p0;
  let dir = seamDir;
  if (pivot && pivot.distanceToSquared(p1) < pivot.distanceToSquared(p0)) {
    start = p1;
    dir = seamDir.clone().multiplyScalar(-1);
  }
  const t = Math.max(0, Math.min(1, (Number(pMm) || 0) / ovMm));
  return start.clone().addScaledVector(dir, t * (ovMm / u));
}

/**
 * Длина линии стыка (мм) — как в Базис Мебельщик:
 * «Стык — общая часть торцов и/или пластей двух (трёх) панелей».
 * Берём только seamOverlap контакта. Без перекрытия → 0
 * (не подставлять полный край панели / frame — это и есть «линия в пустоту»).
 */
export function jointSeamGeomLenPreferContactMm(contact, bbox, jointIdx, mmPerWorldUnit = 1, frameSeamLenWorld = 0) {
  void bbox;
  void jointIdx;
  void mmPerWorldUnit;
  void frameSeamLenWorld;
  const ov = Number(contact?.seamOverlapMm) || 0;
  return ov > 1 ? ov : 0;
}

/**
 * Отрезок линии стыка в мире: длина + центр по перекрытию контакта.
 * @returns {{ seamLenMm: number, seamLenWorld: number, centerWorld: THREE.Vector3, seamDir: THREE.Vector3 }|null}
 */
export function jointSeamSegmentFromContact(contact, mmPerWorldUnit = 10) {
  if (!contact?.hostSeamDirWorld || !contact?.hostFaceCenterWorld) return null;
  if (!contact.neighborPanel || contact.neighborPanel?.userData?.__soloJointNeighbor) return null;
  const ovMm = Number(contact.seamOverlapMm) || 0;
  const sMin = Number(contact.seamOverlapMinWorld);
  const sMax = Number(contact.seamOverlapMaxWorld);
  if (!(ovMm > 1) || !Number.isFinite(sMin) || !Number.isFinite(sMax) || !(sMax > sMin)) {
    return null;
  }
  const u = Number(mmPerWorldUnit) > 0 ? Number(mmPerWorldUnit) : 10;
  const seamDir = contact.hostSeamDirWorld.clone().normalize();
  const c0 = contact.hostFaceCenterWorld;
  const midS = (sMin + sMax) * 0.5;
  const centerWorld = c0.clone().addScaledVector(seamDir, midS - c0.dot(seamDir));
  // Сдвиг по ребру: иначе два бока на пласти фасада рисуются в одну точку (центр панели).
  const eMin = Number(contact.edgeOverlapMinWorld);
  const eMax = Number(contact.edgeOverlapMaxWorld);
  if (
    contact.hostEdgeDirWorld &&
    Number.isFinite(eMin) &&
    Number.isFinite(eMax) &&
    eMax > eMin
  ) {
    const edgeDir = contact.hostEdgeDirWorld.clone().normalize();
    const midE = (eMin + eMax) * 0.5;
    centerWorld.addScaledVector(edgeDir, midE - c0.dot(edgeDir));
  }
  return {
    seamLenMm: ovMm,
    seamLenWorld: ovMm / u,
    centerWorld,
    seamDir,
  };
}

function _panelOrientation(panelRoot) {
  // Комната: ориентация на userData (__cldPanelOrientation), не на config.spec.
  let cur = panelRoot;
  for (let i = 0; i < 8 && cur; i++) {
    const ud = cur.userData || {};
    const o = String(
      ud.__cldPanelOrientation ||
        cur.config?.spec?.orientation ||
        cur.config?.orientation ||
        ''
    )
      .trim()
      .toLowerCase();
    if (o === 'v' || o === 'vertical') return 'v';
    if (o === 'h' || o === 'horizontal') return 'h';
    if (o === 'f' || o === 'frontal' || o === 'front' || o === 'face') return 'f';
    if (ud.isShelfPlank || ud.isTopPlank || ud.isBottomPlank) return 'h';
    if (ud.isSidePlank || ud.isSideOverlay) return 'v';
    if (ud.isFacade) return 'f';
    cur = cur.parent;
  }
  return '';
}

/** Стойка корпуса (бок): orientation v. */
function _isStandOrient(o) {
  return o === 'v';
}

/**
 * «Полка» в роли BM face: горизонталь h или фасад f (крепёж как у детали).
 * Пара f+v = фасад к боку, те же face/edge, что h+v.
 */
function _isShelfLikeOrient(o) {
  return o === 'h' || o === 'f';
}

/**
 * T-стык тип 3: «стойка» = v (бок), «полка» = h|f (полка или фасад) — как деталь для крепежа.
 */
export function identifySetup3TemplateRoles(hostPanel, neighborPanel) {
  if (!hostPanel || !neighborPanel) {
    return { verticalStand: null, horizontalShelf: null, hostIsStand: true };
  }
  const ho = _panelOrientation(hostPanel);
  const no = _panelOrientation(neighborPanel);
  if (_isStandOrient(ho) && _isShelfLikeOrient(no)) {
    return { verticalStand: hostPanel, horizontalShelf: neighborPanel, hostIsStand: true };
  }
  if (_isShelfLikeOrient(ho) && _isStandOrient(no)) {
    return { verticalStand: neighborPanel, horizontalShelf: hostPanel, hostIsStand: false };
  }
  return { verticalStand: hostPanel, horizontalShelf: neighborPanel, hostIsStand: true };
}

/**
 * T-стык: CONTACT plast/torets → панели кадра шаблона типа 3.
 * Как в редакторе шаблона: face = пласть (в макете стойка v), edge = торец (в макете полка h).
 */
export function identifySetup3FaceEdgePanels(hostPanel, neighborPanel, hostFaceType, neighborFaceType) {
  const hft = String(hostFaceType || '').toLowerCase();
  const nft = String(neighborFaceType || '').toLowerCase();
  if (hft === 'plast' && nft === 'torets' && hostPanel && neighborPanel) {
    return { facePanel: hostPanel, edgePanel: neighborPanel, hostIsEdge: false };
  }
  if (hft === 'torets' && nft === 'plast' && hostPanel && neighborPanel) {
    return { facePanel: neighborPanel, edgePanel: hostPanel, hostIsEdge: true };
  }
  if (nft === 'plast' && neighborPanel) {
    return { facePanel: neighborPanel, edgePanel: hostPanel, hostIsEdge: true };
  }
  if (hft === 'plast' && hostPanel) {
    return { facePanel: hostPanel, edgePanel: neighborPanel, hostIsEdge: false };
  }
  // Без типов контакта — только ориентация: не выдумываем plast/torets из h/v.
  return { facePanel: null, edgePanel: null, hostIsEdge: false };
}

/**
 * jointIdx полосы на панели-торце (CONTACT edge).
 * L/R на полке h: полоса остаётся на полке (edge=host).
 * L/R на фасаде f: реальный торец — у бока (перед), не 2/3 бока (=зад/перед).
 * edgeOutwardWant — наружная нормаль искомого торца соседа (обычно −hostOutward).
 *
 * synthetic jointIdx (>3) с пласти фасада: только поиск по outward среди 0..3 — иначе
 * getJointStripeFrameWorld(…, 534) пустой и крепёж не ставится.
 */
export function resolveEdgeJointIdx(hostJointIdx, faceEdge, hostPanel, edgeOutwardWant = null) {
  const jRaw = Number(hostJointIdx);
  const jLegacy = Number.isFinite(jRaw) && jRaw >= 0 && jRaw <= 3 ? jRaw : null;
  if (!faceEdge?.edgePanel) return jLegacy != null ? jLegacy : 0;

  const want =
    edgeOutwardWant && edgeOutwardWant.lengthSq && edgeOutwardWant.lengthSq() > 1e-12
      ? edgeOutwardWant.clone().normalize()
      : null;

  const pickByOutward = (panel, fallback) => {
    if (!want || !panel) return fallback;
    let bestJ = fallback;
    let bestDot = -Infinity;
    for (let nj = 0; nj < 4; nj++) {
      const fr = getJointStripeFrameWorld(panel, nj);
      if (!fr?.outwardWorld) continue;
      const d = fr.outwardWorld.clone().normalize().dot(want);
      if (d > bestDot) {
        bestDot = d;
        bestJ = nj;
      }
    }
    return bestDot > -Infinity ? bestJ : fallback;
  };

  // Хост = торец: индекс полосы на хосте.
  if (faceEdge.hostIsEdge) {
    if (jLegacy != null) return jLegacy;
    return pickByOutward(faceEdge.edgePanel || hostPanel, 0);
  }

  // Хост = пласть: индекс торца на соседе.
  if (want) {
    const byWant = pickByOutward(faceEdge.edgePanel, jLegacy != null ? jLegacy : 0);
    const fr = getJointStripeFrameWorld(faceEdge.edgePanel, byWant);
    const dot =
      fr?.outwardWorld && want
        ? fr.outwardWorld.clone().normalize().dot(want)
        : -Infinity;
    if (dot >= 0.5) return byWant;
    // Synthetic / без legacy: берём лучший торец, даже если dot < 0.5.
    if (jLegacy == null) return byWant;
  }

  if (jLegacy == null) {
    const ho = _panelOrientation(hostPanel);
    if (ho === 'f' && _panelOrientation(faceEdge.edgePanel) === 'v') return 3;
    return pickByOutward(faceEdge.edgePanel, 0);
  }

  const j = jLegacy;
  const ho = _panelOrientation(hostPanel);
  if (ho === 'h') {
    if (j === 2 || j === 3) return j;
    if (j === 1) return 0;
    if (j === 0) return 1;
  }
  if (ho === 'f') {
    if (j === 2 || j === 3) {
      const eo = _panelOrientation(faceEdge.edgePanel);
      if (eo === 'v') return 3;
    }
    if (j === 1) return 0;
    if (j === 0) return 1;
  }
  return j;
}

/** @deprecated не использовать для seamWorld — индексы h/f не совпадают с подсветкой host */
function _hostJointIdxToFacePanelJoint(hostJointIdx) {
  const j = Number(hostJointIdx);
  if (j === 0) return 1;
  if (j === 1) return 0;
  if (j === 2) return 3;
  if (j === 3) return 2;
  return j;
}

/**
 * hostPanel из карточки БМ (vertical/horizontal) → стойка v / полка h|f.
 * facade/door → horizontal (роль face), не vertical — иначе фасад к боку ломается.
 */
function _normalizeBmHoleHostPanel(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (['vertical', 'vert', 'v', 'stand', 'side'].includes(s)) return 'vertical';
  if (
    ['horizontal', 'horiz', 'h', 'corpus', 'body', 'facade', 'door', 'frontal', 'f', 'front'].includes(s)
  ) {
    return 'horizontal';
  }
  return '';
}

function _pickStandOrShelfPanel(kind, hostPanel, neighborPanel, roles) {
  const r = roles || identifySetup3TemplateRoles(hostPanel, neighborPanel);
  if (kind === 'vertical') {
    if (r?.verticalStand) return r.verticalStand;
    if (_panelOrientation(hostPanel) === 'v') return hostPanel;
    if (_panelOrientation(neighborPanel) === 'v') return neighborPanel;
    return hostPanel;
  }
  if (r?.horizontalShelf) return r.horizontalShelf;
  if (_isShelfLikeOrient(_panelOrientation(hostPanel))) return hostPanel;
  if (_isShelfLikeOrient(_panelOrientation(neighborPanel))) return neighborPanel;
  return neighborPanel || hostPanel;
}

/**
 * Кому отверстие: Базис — пласть/торец стыка; BM h/v — только если типов контакта нет.
 * face = панель пласти, edge = панель торца.
 */
export function resolveJointHoleTargetPanel({
  setupType,
  isFace,
  hostPanel,
  neighborPanel,
  roles = null,
  faceEdge = null,
  holeHostPanel = null,
  mountSide = null,
}) {
  void setupType;
  const bmHost = _normalizeBmHoleHostPanel(holeHostPanel);
  const side = String(mountSide || '').toLowerCase();
  let wantFace = !!isFace;
  if (side === 'face' || side === 'plast') wantFace = true;
  else if (side === 'edge' || side === 'torets') wantFace = false;

  // 1) Явный hostPanel из шаблона BM.
  const r = roles || identifySetup3TemplateRoles(hostPanel, neighborPanel);
  if (bmHost === 'vertical' || bmHost === 'horizontal') {
    return _pickStandOrShelfPanel(bmHost, hostPanel, neighborPanel, r);
  }

  // 2) Контакт пласть↔торец (как в БМ на стыке) — главный источник для ящика/фасада.
  if (faceEdge?.facePanel && faceEdge?.edgePanel) {
    return wantFace ? faceEdge.facePanel : faceEdge.edgePanel;
  }

  // 3) Fallback как макет шаблона типа 3: face = стойка v, edge = полка h|f.
  if (r?.verticalStand && r?.horizontalShelf) {
    return wantFace ? r.verticalStand : r.horizontalShelf;
  }
  return wantFace ? (hostPanel || neighborPanel) : (neighborPanel || hostPanel);
}

/**
 * Приводит сырое отверстие шаблона к полям xMm/yMm/… (как после _normalizeDrillTemplateRawHoles).
 */
export function normalizeJointHoleForFitting(h) {
  if (!h) return null;
  const diameterMm = Number(h.diameterMm ?? h.diameter) || 0;
  const depthMm = Number(h.depthMm ?? h.depth) || 0;
  if (!(diameterMm > 0) || !(depthMm > 0)) return null;
  const hostPanel = _normalizeBmHoleHostPanel(h.hostPanel ?? h.host_panel);
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
    hostPanel: hostPanel || 'auto',
    global: h.global !== undefined && h.global !== null ? h.global : 1,
  };
}

/**
 * Setup 3 как в рефе/редакторе шаблона, но позицию даёт схема:
 * 1) линия стыка (contact) → станция seamPosMm  (= «клик» пользователя в рефе)
 * 2) face=пласть, edge=торец
 * 3) кадр O на наружной пласти, +x к торцу
 * 4) отверстия P = O + x·eX − y·eY − z·eZ (мм шаблона)
 * 5) сверло вдоль +x кадра (в торец) — ось конфирмата/эксцентра, не template −z→eZ
 */
function _setup3PlacementsViaSeamTemplate({
  holes,
  hostPanel,
  neighborPanel,
  hostBBox,
  neighborBBox,
  jointIdx,
  seamPosMm,
  seamLenMm,
  tSeamWorld,
  outward,
  classificationThickMm,
  mmPerWorldUnit,
  hostFaceType = null,
  neighborFaceType = null,
  facing = 'inside',
  templateFlipDeg = 0,
  contact = null,
}) {
  const roles = identifySetup3TemplateRoles(hostPanel, neighborPanel);
  const contactFE = identifySetup3FaceEdgePanels(
    hostPanel,
    neighborPanel,
    hostFaceType,
    neighborFaceType,
  );

  let facePanel = contactFE?.facePanel || roles?.verticalStand || null;
  let edgePanel = contactFE?.edgePanel || roles?.horizontalShelf || null;
  if (!facePanel || !edgePanel) {
    facePanel = roles?.verticalStand || null;
    edgePanel = roles?.horizontalShelf || null;
  }
  if (!facePanel || !edgePanel) return null;

  const faceBBox = facePanel === hostPanel ? hostBBox : neighborBBox;
  const edgeBBox = edgePanel === hostPanel ? hostBBox : neighborBBox;
  if (!faceBBox || faceBBox.isEmpty() || !edgeBBox || edgeBBox.isEmpty()) return null;

  const jNumRaw = Number(jointIdx);
  const jNum = Number.isFinite(jNumRaw) && jNumRaw >= 0 && jNumRaw <= 3 ? jNumRaw : 0;
  const hostIsFace = facePanel === hostPanel;
  const edgeWant =
    outward && outward.lengthSq() > 1e-12 ? outward.clone().normalize().negate() : null;
  let edgeJointIdx = jNum;
  if (contactFE?.facePanel && contactFE?.edgePanel) {
    edgeJointIdx = resolveEdgeJointIdx(jNumRaw, contactFE, hostPanel, edgeWant);
    if (!(Number(edgeJointIdx) >= 0 && Number(edgeJointIdx) <= 3)) edgeJointIdx = 0;
  } else if (!hostIsFace) {
    edgeJointIdx = mapJointIdxForStandAnchor(_panelOrientation(hostPanel), jointIdx, false);
  }

  const seamLenRef = Number(seamLenMm) > 0
    ? Number(seamLenMm)
    : (Number(contact?.seamOverlapMm) > 0 ? Number(contact.seamOverlapMm) : 0);
  const seamW =
    jointSeamWorldPoint(
      hostPanel,
      Number(jointIdx),
      seamLenRef,
      Number(seamPosMm) || 0,
      mmPerWorldUnit,
      contact,
    )
    || null;
  if (!seamW) return null;

  const frame = buildSetup3CanonicalFrameWorld({
    facePanel,
    edgePanel,
    faceBBox,
    edgeBBox,
    seamWorld: seamW,
    tSeamWorld: tSeamWorld || contact?.hostSeamDirWorld || null,
    mmPerWorldUnit,
    edgeJointIdx,
    contact,
  });
  if (!frame?.O || !frame?.eX) return null;

  const faceThick = Number(frame.faceThickMm) > 0
    ? Number(frame.faceThickMm)
    : (Number(classificationThickMm) > 0 ? Number(classificationThickMm) : 16);

  const facingKey = Number(templateFlipDeg) === 180
    ? 'outside'
    : (String(facing || 'inside').toLowerCase() === 'outside' ? 'outside' : 'inside');

  const frameFlip = facingKey === 'outside';
  const templateFrame = {
    O: frame.O.clone(),
    eX: frame.eX.clone().normalize(),
    eY: frame.eY.clone().normalize().multiplyScalar(frameFlip ? -1 : 1),
    eZ: frame.eZ.clone().normalize().multiplyScalar(frameFlip ? -1 : 1),
  };

  const faceEdge = contactFE?.facePanel && contactFE?.edgePanel
    ? contactFE
    : { facePanel, edgePanel, hostIsEdge: !hostIsFace };

  // Один движок: оси как у кадра (без flip осей); facing крутит y/z внутри координат.
  // templateFrame (с flip eY/eZ) — для 3D/якоря, не для mm→мир здесь.
  const placed = placeTemplateHoles({
    holes,
    O: frame.O,
    eX: frame.eX,
    eY: frame.eY,
    eZ: frame.eZ,
    mmPerWorldUnit,
    setupType: 3,
    faceThickMm: faceThick,
    facing: facingKey,
  });
  if (!placed.length) return null;

  const placements = placed.map((p) => ({
    hole: p.hole,
    worldEntry: new THREE.Vector3(p.entry.x, p.entry.y, p.entry.z),
    worldDir: new THREE.Vector3(p.dir.x, p.dir.y, p.dir.z).normalize(),
    isFace: p.isFace,
    diameter: p.diameter,
    depth: p.depth,
    through: p.through,
    setup3Frame: frame,
    templateFrame,
    setup3Roles: roles,
    setup3FaceEdge: faceEdge,
    setup3FurnitureRef: false,
    setup3SeamTemplate: true,
    axisPoint: new THREE.Vector3(p.axisPoint.x, p.axisPoint.y, p.axisPoint.z),
  }));
  return placements;
}

/**
 * Какой setupType (1–4) реально использовать для шаблона: override → currentSetupType/setupType →
 * первый непустой holesBySetup. Иначе схема с типом 3 могла читать holesBySetup['1'].
 */
export function resolveJointDrillTemplateSetupType(template, setupTypeOverride) {
  const ov = Number(setupTypeOverride);
  const hbs = template?.holesBySetup;
  const hasHoles = (st) => {
    const k = String(st);
    return hbs && Array.isArray(hbs[k]) && hbs[k].length > 0;
  };
  if (Number.isFinite(ov) && ov >= 1 && ov <= 4 && (hasHoles(ov) || !hbs)) return ov;
  const preferred = Number(template?.currentSetupType ?? template?.setupType ?? 3);
  const pref = Number.isFinite(preferred) && preferred >= 1 && preferred <= 4 ? preferred : 3;
  if (hasHoles(pref)) return pref;
  if (hbs && typeof hbs === 'object') {
    for (let i = 1; i <= 4; i++) {
      if (hasHoles(i)) return i;
    }
  }
  return pref;
}

/**
 * Список отверстий шаблона: holesBySetup[setupKey], с fallback на первый непустой тип / legacy holes.
 */
export function jointTemplateHolesForSetup(template, setupTypeOverride) {
  const st = resolveJointDrillTemplateSetupType(template, setupTypeOverride);
  const key = String(st);
  const bySetup = template?.holesBySetup && template.holesBySetup[key];
  if (Array.isArray(bySetup) && bySetup.length) return bySetup;
  if (template?.holesBySetup && typeof template.holesBySetup === 'object') {
    for (let i = 1; i <= 4; i++) {
      const alt = template.holesBySetup[String(i)];
      if (Array.isArray(alt) && alt.length) return alt;
    }
  }
  return Array.isArray(template?.holes) ? template.holes : [];
}

/**
 * Начало координат шаблона в мире (fallback без setup3-кадра).
 * Тип 3: внешняя плоскость edge на шве (как (0,0,0) макета БАЗИС).
 * Тип 2: L-стык — центр пересечения толщин на шве.
 */
export function jointMebelshchikTemplateOriginWorld({
  setupType,
  seamWorld,
  nInWorld,
  u1World,
  jointIdx,
  panelThickMm,
  targetThickMm,
  mmPerWorldUnit,
}) {
  const O = seamWorld.clone();
  const st = Number(setupType) || 3;
  if (st === 3) {
    const inward = nInWorld?.clone?.();
    const faceThickMm = Number(targetThickMm) > 0 ? Number(targetThickMm) : Number(panelThickMm);
    if (inward && inward.lengthSq() > 1e-18 && faceThickMm > 0) {
      O.addScaledVector(inward.normalize(), -(faceThickMm / mmPerWorldUnit));
    }
    return O;
  }
  if (st === 2) {
    const nIn = nInWorld.clone().normalize();
    const thicknessMm = Number(targetThickMm) > 0 ? Number(targetThickMm) : Number(panelThickMm);
    const T = thicknessMm / mmPerWorldUnit;
    const u = u1World.clone().normalize();
    const outward = nIn.clone().multiplyScalar(-1);
    const j = Number(jointIdx);
    let faceSign = 1;
    if (j === 1 || j === 2) faceSign = -1;
    O.addScaledVector(outward, faceSign * T * 0.5);
    O.addScaledVector(u, -T * 0.5);
    return O;
  }
  return O;
}

/**
 * Разворот шаблона на 180° вокруг пивота (ось eX / толщины): O на месте, y↔−y, z↔−z.
 * Нужен, когда бочёнок эксцентра оказывается на видимой стороне («Снаружи»).
 */
export function applyJointTemplateFacingFlip(yMm, zMm, dirKey, facing) {
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

/**
 * Размещения отверстий.
 * Setup 3: сначала как реф (furniture + CabinetHole._build_pos), иначе T-кадр.
 * Прочие: базис от хоста (nIn, u1, u2).
 */
export function getJointTemplatePlacementsUnified({
  seamWorld,
  outward,
  nInWorld,
  tSeamWorld,
  jointIdx,
  setupType,
  holes,
  panelThickMm,
  targetThickMm,
  classificationThickMm,
  mmPerWorldUnit,
  hostPanel = null,
  neighborPanel = null,
  hostBBox = null,
  neighborBBox = null,
  seamPosMm = null,
  seamLenMm = null,
  hostFaceType = null,
  neighborFaceType = null,
  seamSizeKey = 'z',
  facing = 'inside',
  templateFlipDeg = 0,
  contact = null,
}) {
  const st = Number(setupType) || 3;

  // Setup 3 — станция на линии стыка + мм шаблона (как реф, позиция от схемы).
  if (st === 3 && hostPanel && neighborPanel && hostBBox && neighborBBox && Array.isArray(holes) && holes.length) {
    const viaSeam = _setup3PlacementsViaSeamTemplate({
      holes,
      hostPanel,
      neighborPanel,
      hostBBox,
      neighborBBox,
      jointIdx,
      seamPosMm,
      seamLenMm,
      tSeamWorld,
      outward,
      classificationThickMm,
      mmPerWorldUnit,
      hostFaceType,
      neighborFaceType,
      facing,
      templateFlipDeg,
      contact,
    });
    if (viaSeam && viaSeam.length) {
      if (typeof window !== 'undefined' && window.__CLD_DEBUG_JOINT === true) {
        console.log('[CLD-JOINT] setup3 via seam+template (ref)', {
          jointIdx,
          hostFaceType,
          neighborFaceType,
          n: viaSeam.length,
          face: viaSeam.filter((p) => p.isFace).length,
          edge: viaSeam.filter((p) => !p.isFace).length,
        });
      }
      return viaSeam;
    }
  }

  const roles = (hostPanel && neighborPanel)
    ? identifySetup3TemplateRoles(hostPanel, neighborPanel)
    : null;

  // CONTACT plast/torets — только для кадра/полосы (нужны явные face types).
  const contactFE = (st === 3 && hostPanel && neighborPanel)
    ? identifySetup3FaceEdgePanels(hostPanel, neighborPanel, hostFaceType, neighborFaceType)
    : null;

  const jNumRaw = Number(jointIdx);
  const jNum = Number.isFinite(jNumRaw) && jNumRaw >= 0 && jNumRaw <= 3 ? jNumRaw : 0;
  const hostOri = _panelOrientation(hostPanel);

  // Макет шаблона типа 3: face = стойка v (бок), edge = полка/крыша h|f — 1:1 на шкаф.
  const productFace = roles?.verticalStand || null;
  const productEdge = roles?.horizontalShelf || null;

  // Кадр: полоса на торце шва. L/R на полке → торец = полка + исходный jointIdx.
  let facePanel = contactFE?.facePanel || null;
  let edgePanel = contactFE?.edgePanel || null;
  let edgeJointIdx = jNum;
  if (st === 3 && hostOri === 'h' && (jNum === 2 || jNum === 3)) {
    edgePanel = hostPanel;
    facePanel = neighborPanel || productFace || facePanel;
    edgeJointIdx = jNum;
  } else if (st === 3 && contactFE?.edgePanel && contactFE?.facePanel) {
    facePanel = contactFE.facePanel;
    edgePanel = contactFE.edgePanel;
    // Торец соседа смотрит на хост: −outward хоста (пласть/торец).
    // ВАЖНО: в resolve передаём исходный jointIdx (в т.ч. synthetic >3) — там clamp 0..3.
    const edgeWant =
      outward && outward.lengthSq() > 1e-12 ? outward.clone().normalize().negate() : null;
    edgeJointIdx = resolveEdgeJointIdx(jNumRaw, contactFE, hostPanel, edgeWant);
    if (!(Number(edgeJointIdx) >= 0 && Number(edgeJointIdx) <= 3)) edgeJointIdx = 0;
  } else if (st === 3 && productFace && productEdge) {
    // Без типов контакта: те же роли, что в редакторе шаблона (v=face, h=edge).
    facePanel = productFace;
    edgePanel = productEdge;
    edgeJointIdx = roles?.hostIsStand
      ? jNum
      : (hostOri === 'h' && (jNum === 2 || jNum === 3)
        ? jNum
        : mapJointIdxForStandAnchor(hostOri, jointIdx, false));
    // Полоса L/R на полке-хосте = торец; бок-сосед = пласть.
    if (hostOri === 'h' && (jNum === 2 || jNum === 3)) {
      edgePanel = hostPanel;
      facePanel = neighborPanel || productFace;
      edgeJointIdx = jNum;
    }
  }

  // CONTACT пласть/торец важнее fallback по ориентации (фасад↔бок).
  const faceEdge = (contactFE?.facePanel && contactFE?.edgePanel)
    ? contactFE
    : ((productFace && productEdge)
      ? { facePanel: productFace, edgePanel: productEdge, hostIsEdge: !roles?.hostIsStand }
      : null);

  const faceBBox = facePanel
    ? (facePanel === hostPanel ? hostBBox : neighborBBox)
    : null;
  const edgeBBox = edgePanel
    ? (edgePanel === hostPanel ? hostBBox : neighborBBox)
    : null;

  const seamLenRef = Number(seamLenMm) > 0 ? Number(seamLenMm) : 0;
  const seamOnHost = (hostPanel && seamLenRef > 0)
    ? jointSeamWorldPoint(
      hostPanel,
      Number(jointIdx),
      seamLenRef,
      Number(seamPosMm) || 0,
      mmPerWorldUnit,
      contact,
    )
    : null;
  const seamW = seamOnHost || seamWorld;

  const setup3Frame = (st === 3 && facePanel && edgePanel && faceBBox && edgeBBox && seamW)
    ? buildSetup3CanonicalFrameWorld({
      facePanel,
      edgePanel,
      faceBBox,
      edgeBBox,
      seamWorld: seamW,
      tSeamWorld,
      mmPerWorldUnit,
      edgeJointIdx,
      contact,
    })
    : null;

  let nIn;
  let u1;
  let u2;
  if (setup3Frame) {
    nIn = setup3Frame.eX.clone().normalize();
    u1 = setup3Frame.eZ.clone().normalize();
    u2 = setup3Frame.eY.clone().normalize();
  } else {
    nIn = nInWorld.clone().normalize();
    u1 = tSeamWorld.clone();
    u1.sub(nIn.clone().multiplyScalar(nIn.dot(u1)));
    if (u1.lengthSq() < 1e-18) {
      const aux = Math.abs(nIn.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
      u1.crossVectors(nIn, aux);
    }
    u1.normalize();
    u2 = new THREE.Vector3().crossVectors(nIn, u1).normalize();
  }

  const O = setup3Frame
    ? setup3Frame.O.clone()
    : jointMebelshchikTemplateOriginWorld({
      setupType,
      seamWorld: seamW || seamWorld,
      nInWorld: nIn,
      u1World: u1,
      jointIdx,
      panelThickMm,
      targetThickMm,
      mmPerWorldUnit,
    });

  const placements = [];
  const faceThick = setup3Frame
    ? setup3Frame.faceThickMm
    : (Number(classificationThickMm) > 0 ? Number(classificationThickMm) : (Number(panelThickMm) || 16));
  // Классификация face/edge по толщине панели пласти (face), как в макете шаблона.
  const productFaceThick = productFace
    ? panelThicknessMm(
      productFace,
      productFace === hostPanel ? hostBBox : neighborBBox,
      mmPerWorldUnit,
    )
    : 0;
  const classifyThick = productFaceThick > 0
    ? productFaceThick
    : (Number(classificationThickMm) > 0 ? Number(classificationThickMm) : faceThick);

  const facingKey = Number(templateFlipDeg) === 180
    ? 'outside'
    : (String(facing || 'inside').toLowerCase() === 'outside' ? 'outside' : 'inside');

  for (const hole of holes) {
    const xMm = Number(hole.xMm ?? hole.x) || 0;
    const yRaw = Number(hole.yMm ?? hole.y) || 0;
    const zRaw = Number(hole.zMm ?? hole.z) || 0;
    const diameter = Number(hole.diameterMm ?? hole.diameter) || 8;
    const depth = Number(hole.depthMm ?? hole.depth) || 16;
    const mountSide = String(hole.mountSide || 'auto').toLowerCase();
    let isFace = Math.abs(xMm) < classifyThick * 0.5 - 0.5;
    if (mountSide === 'face') isFace = true;
    else if (mountSide === 'edge') isFace = false;
    const flipped = applyJointTemplateFacingFlip(
      yRaw,
      zRaw,
      hole.dirKey ?? hole.direction ?? '-z',
      facingKey,
    );
    const yMm = flipped.yMm;
    const zMm = flipped.zMm;
    const dirKey = flipped.dirKey;

    // Как редактор шаблона: P = O + x·eX − y·eY − z·eZ (x не теряем).
    const tplZ = zMm;
    const worldEntry = setup3Frame
      ? setup3TemplatePointWorld(setup3Frame, xMm, yMm, tplZ, mmPerWorldUnit, {
        isFace,
        mountSide,
      })
      : O.clone()
        .addScaledVector(nIn, xMm / mmPerWorldUnit)
        .addScaledVector(u2, -yMm / mmPerWorldUnit)
        .addScaledVector(u1, -zMm / mmPerWorldUnit);

    const basisX = setup3Frame ? setup3Frame.eX : nIn;
    const basisY = setup3Frame ? setup3Frame.eY : u1;
    const basisZ = setup3Frame ? setup3Frame.eZ : u2;
    const worldDir = jointTemplateDirWorldFromFrame(dirKey, basisX, basisY, basisZ);
    // Общий frame шаблона нужен не только отверстиям: в рефе furniture и его
    // единая 3D-модель живут в той же системе координат, что и CabinetHole.
    // Отдаём frame для всех setup_type, а не только setup 3.
    const frameFlip = facingKey === 'outside';
    const templateFrame = {
      O: O.clone(),
      eX: basisX.clone().normalize(),
      eY: basisY.clone().normalize().multiplyScalar(frameFlip ? -1 : 1),
      eZ: basisZ.clone().normalize().multiplyScalar(frameFlip ? -1 : 1),
    };

    placements.push({
      hole,
      worldEntry,
      worldDir,
      isFace,
      diameter,
      depth,
      through: !!hole.through,
      setup3Frame: setup3Frame || null,
      templateFrame,
      setup3Roles: roles,
      setup3FaceEdge: faceEdge,
    });
  }
  return placements;
}

/**
 * Роли отверстий: mountSide из шаблона, иначе x относительно толщины панели пласти (face).
 */
export function resolveJointFittingRolesUnified({
  rawPlacements,
  outward,
  panelThickMm,
  neighborThickMm,
  classificationThickMm,
  templateName,
  schemeName,
  mmPerWorldUnit,
  setupType,
  hostPanel = null,
  neighborPanel = null,
  hostBBox = null,
  neighborBBox = null,
  hostFaceType = null,
  neighborFaceType = null,
}) {
  const o = outward.clone().normalize();
  const st = Number(setupType) || 3;
  const setup3Roles = (hostPanel && neighborPanel)
    ? identifySetup3TemplateRoles(hostPanel, neighborPanel)
    : null;
  const contactFaceEdge = (st === 3 && hostPanel && neighborPanel)
    ? identifySetup3FaceEdgePanels(hostPanel, neighborPanel, hostFaceType, neighborFaceType)
    : null;
  // CONTACT пласть/торец важнее; fallback = макет шаблона (v=face, h=edge).
  const setup3FaceEdge = (contactFaceEdge?.facePanel && contactFaceEdge?.edgePanel)
    ? contactFaceEdge
    : ((setup3Roles?.horizontalShelf && setup3Roles?.verticalStand)
      ? {
        facePanel: setup3Roles.verticalStand,
        edgePanel: setup3Roles.horizontalShelf,
        hostIsEdge: !setup3Roles.hostIsStand,
      }
      : null);
  const faceThickMm = setup3FaceEdge?.facePanel
    ? panelThicknessMm(
      setup3FaceEdge.facePanel,
      setup3FaceEdge.facePanel === hostPanel ? hostBBox : neighborBBox,
      mmPerWorldUnit,
    )
    : (Number(classificationThickMm) > 0 ? Number(classificationThickMm) : (Number(panelThickMm) || 16));
  const edgeThickMm = setup3FaceEdge?.edgePanel
    ? panelThicknessMm(
      setup3FaceEdge.edgePanel,
      setup3FaceEdge.edgePanel === hostPanel ? hostBBox : neighborBBox,
      mmPerWorldUnit,
    )
    : (Number(neighborThickMm) > 0 ? neighborThickMm : 16);
  const classifyThick = Number(classificationThickMm) > 0
    ? Number(classificationThickMm)
    : faceThickMm;

  return rawPlacements.map((p) => {
    const d = Number(p.diameter) || 0;
    const dep = Number(p.depth) || 0;
    let resolvedIsFace = p.isFace;
    const mountSide = String(p?.hole?.mountSide || 'auto').toLowerCase();
    const rawXmm = Number(p?.hole?.xMm ?? p?.hole?.x);
    if (Number.isFinite(rawXmm) && classifyThick > 0) {
      resolvedIsFace = Math.abs(rawXmm) < classifyThick * 0.5 - 0.5;
    }
    if (mountSide === 'face') resolvedIsFace = true;
    else if (mountSide === 'edge') resolvedIsFace = false;

    let resolvedEntry = p.worldEntry.clone();
    let resolvedDir = p.worldDir.clone().normalize();

    if (p.setup3FurnitureRef || p.setup3Frame) {
      resolvedDir = p.worldDir.clone().normalize();
    } else {
      resolvedDir = resolvedIsFace ? o.clone() : o.clone().multiplyScalar(-1);
    }

    const boreLenMm = p.through
      ? (resolvedIsFace ? faceThickMm : edgeThickMm)
      : p.depth;

    return {
      ...p,
      isFace: resolvedIsFace,
      worldEntry: resolvedEntry,
      worldDir: resolvedDir,
      boreLenMm,
      holeKind: resolvedIsFace ? 'face' : 'edge',
      setup3Roles,
      setup3FaceEdge,
    };
  });
}

function _fromBaseForcedSpreadArr(seamLen, forcedCount, fromPivot, off, minOpp, stepMm) {
  const step = Number(stepMm) > 0 ? Number(stepMm) : 32;
  const n = forcedCount;
  if (n <= 0) return [];
  let lo;
  let hi;
  if (fromPivot) {
    lo = off;
    const maxHi = seamLen - minOpp;
    hi = lo + Math.floor((maxHi - lo) / step) * step;
  } else {
    hi = seamLen - off;
    lo = hi - Math.floor((hi - minOpp) / step) * step;
  }
  if (hi < lo - 0.01) {
    return n >= 1 ? [seamLen / 2] : [];
  }
  if (n === 1) return [seamLen / 2];
  if (n === 2) return lo <= hi ? [lo, hi] : [hi, lo];
  const gap = (hi - lo) / (n - 1);
  return Array.from({ length: n }, (_, i) => lo + i * gap);
}

/** Позиции крепежа вдоль шва (мм) — как calcSchemePositions в admin-new-bundle / CFRN. */
export function calcJointSchemePositions(scheme, seamLenMm) {
  const seamLen = Number(seamLenMm) || 0;
  if (!scheme || seamLen <= 0) return [];
  let forcedCount = 0;
  const rules = (scheme.countRules || []).slice().sort((a, b) => a.from - b.from);
  for (const r of rules) {
    if (seamLen >= r.from && seamLen <= r.to) {
      forcedCount = r.count;
      break;
    }
  }
  if (scheme.schemeType === 'symmetric') {
    const off = Number(scheme.symOffset) || 50;
    if (forcedCount > 0) {
      if (forcedCount === 1) return [seamLen / 2];
      const gap = (seamLen - 2 * off) / (forcedCount - 1);
      return Array.from({ length: forcedCount }, (_, i) => off + i * gap);
    }
    if (seamLen - 2 * off <= 0) return [seamLen / 2];
    return [off, seamLen - off];
  }
  const off = Number(scheme.offsetFromBase) >= 0 ? Number(scheme.offsetFromBase) : 50;
  const step = Number(scheme.step) > 0 ? Number(scheme.step) : 32;
  const minOpp = Number(scheme.minOffsetOpposite) >= 0 ? Number(scheme.minOffsetOpposite) : 32;
  const maxPos = seamLen - minOpp;
  const minPos = minOpp;
  const fromPivot = String(scheme.base || 'back').toLowerCase() !== 'front';
  if (forcedCount > 0) {
    return _fromBaseForcedSpreadArr(seamLen, forcedCount, fromPivot, off, minOpp, step);
  }
  const arr = [];
  if (fromPivot) {
    let q = off;
    while (q <= maxPos + 0.01) {
      arr.push(q);
      q += step;
    }
  } else {
    let q = seamLen - off;
    while (q >= minPos - 0.01) {
      arr.push(q);
      q -= step;
    }
    arr.sort((a, b) => a - b);
  }
  return arr;
}

/**
 * CAD этап 2: длина шва для схемы размещения.
 * Живая геометрия важнее stamp seamLen с карточки полки/JSON.
 */
export function resolveJointSeamLenMm(seamGeomMm, seamStoredMm) {
  const g = Number(seamGeomMm) || 0;
  const s = Number(seamStoredMm) || 0;
  if (g > 1) return g;
  if (s > 0) return s;
  return 0;
}

/**
 * Длина шва по bbox панели (мм). jointIdx → ось шва как в комнате/CFRN.
 * mmPerWorldUnit: комната 1, превью UNITS_MM (10).
 */
export function jointSeamGeomLenMmFromBBox(bbox, jointIdx, mmPerWorldUnit = 1) {
  if (!bbox || typeof bbox.isEmpty === 'function' && bbox.isEmpty()) return 0;
  const u = Number(mmPerWorldUnit) > 0 ? Number(mmPerWorldUnit) : 1;
  const bSize = new THREE.Vector3();
  bbox.getSize(bSize);
  const minDim = Math.min(bSize.x, bSize.y, bSize.z);
  const thinAxis =
    Math.abs(bSize.x - minDim) < 0.0001 ? 'x'
      : Math.abs(bSize.y - minDim) < 0.0001 ? 'y' : 'z';
  const j = Number(jointIdx);
  let faceAxis;
  if (j === 0 || j === 1) {
    faceAxis = thinAxis === 'y' ? 'z' : 'y';
  } else {
    faceAxis = thinAxis === 'x' ? 'z' : 'x';
  }
  const perps = ['x', 'y', 'z'].filter((a) => a !== faceAxis);
  const a = perps[0];
  const b = perps[1];
  const seamAx = bSize[a] >= bSize[b] ? a : b;
  return (bSize[seamAx] || 0) * u;
}

/**
 * CAD этап 2: станции схемы вдоль шва.
 * Правила схемы × живой шов — один источник для превью / комнаты / CFRN.
 * Абсолютные positions из JSON не используются, если scheme есть
 * (иначе отступы «залипают» на seamLen карточки полки).
 *
 * @param {{
 *   scheme: object|null,
 *   seamGeomMm?: number,
 *   seamStoredMm?: number,
 *   authoredPositions?: number[],
 * }} opts
 * @returns {{ seamLenMm: number, positions: number[] }}
 */
export function resolveJointSchemeStationsMm(opts = {}) {
  const scheme = opts.scheme || null;
  const seamLenMm = resolveJointSeamLenMm(opts.seamGeomMm, opts.seamStoredMm);
  if (seamLenMm <= 0) return { seamLenMm: 0, positions: [] };

  if (scheme) {
    const positions = calcJointSchemePositions(scheme, seamLenMm);
    if (positions.length) return { seamLenMm, positions };
  }

  const authored = Array.isArray(opts.authoredPositions)
    ? opts.authoredPositions.map(Number).filter((n) => Number.isFinite(n))
    : [];
  return { seamLenMm, positions: authored };
}

/**
 * Базис «минимальная ширина стыка» (толщина ТОРЦА под ответку):
 * — явный scheme.minSeamWidthMm;
 * — иначе Ø отверстий В ТОРЕЦ (edge), не бочонок на пласти.
 * Иначе эксцентр Ø15 на пласти → авто 21 мм и стык 16 мм молча отбрасывается,
 * а конфирмат Ø7 проходит — как на скрине пользователя.
 */
export function resolveSchemeMinSeamWidthMm(scheme, template = null, setupType = null) {
  const explicit = Number(scheme?.minSeamWidthMm);
  if (explicit > 0) return explicit;
  if (!template) return 0;
  const st = resolveJointDrillTemplateSetupType(template, setupType ?? scheme?.setupType);
  const holes = jointTemplateHolesForSetup(template, st);
  let maxEdgeD = 0;
  let maxSmallFaceD = 0;
  for (const h of holes || []) {
    const d = Number(h?.diameterMm ?? h?.diameter) || 0;
    if (!(d > 0)) continue;
    const side = String(h?.mountSide || h?.mount_side || 'auto').toLowerCase();
    const x = Math.abs(Number(h?.xMm ?? h?.x) || 0);
    const isEdge =
      side === 'edge' ||
      side === 'torets' ||
      (side !== 'face' && side !== 'plast' && x >= 10);
    if (isEdge) {
      if (d > maxEdgeD) maxEdgeD = d;
    } else if (d < 12 && d > maxSmallFaceD) {
      // Мелкие face (шкант и т.п.) — учитываем; бочонок ≥12 на пласти — нет.
      maxSmallFaceD = d;
    }
  }
  const maxD = maxEdgeD > 0 ? maxEdgeD : maxSmallFaceD;
  if (maxD >= 4.5) return Math.max(12, Math.ceil(maxD + 6));
  if (maxD >= 2.5) return Math.max(8, Math.ceil(maxD + 4));
  return 0;
}

