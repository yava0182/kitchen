/**
 * Этап 1: торец ↔ пласть (Базис).
 *
 * Глобальная логика (любая панель, без имён/кейсов каталога):
 *  1) стык = torets↔plast, gap≈0, пятно = overlap; дедуп по соседу;
 *  2) условие = роль грани хоста × ось пятна → conditionKey;
 *  3) группа = все контакты с одним conditionKey (одно условие + параллель);
 *  4) «Следующие» = следующая группа; активная ≠ остальные (цвета).
 *
 * Частные изделия (ящик/шкаф/фасад) — только следствия правила, не ветки if(name).
 */
import * as THREE from '/node_modules/three/build/three.module.js';
import {
  listPanelFaces,
  panelBBoxWorld,
  panelThicknessMm,
  neighborFaceTypeAt,
  isToretsPlastPair,
  resolveJointContactForIdx,
} from '/js/joint-engine-v2.js?v=20260727-ecc-export';
import {
  measureJointNeighborPair,
} from '/js/joint-panel-contact.js?v=20260725-toret-plast-v21';

/** «Зазор 0 мм» в float/mesh: |gap| ≤ ε */
export const TORET_PLAST_GAP_EPS_MM = 0.5;
/** Мин. перекрытие вдоль длины/ширины стыка, мм */
export const TORET_PLAST_OVERLAP_MIN_MM = 5;

function _panelName(p) {
  return (
    p?.config?.name ||
    p?.name ||
    p?.userData?.own_object?.name ||
    p?.constructor?.name ||
    '?'
  );
}

function _enumeratePanels(rootGroup) {
  const out = [];
  if (!rootGroup) return out;
  rootGroup.traverse((ch) => {
    if (!ch?.userData) return;
    if (ch.userData.isDetail && ch.userData.__cldPivotCodes) {
      const dt = String(ch.userData.detailType || ch.userData.type || 'wall').toLowerCase();
      if (dt === 'wall' || dt === 'facade' || ch.userData.isBody || ch.userData.isFacade) out.push(ch);
      return;
    }
    if (!ch.userData.own_object || !ch.calculated?.size) return;
    const t = String(ch?.config?.type || ch?.userData?.type || '').toLowerCase();
    if (t === 'wall' || t === 'facade') out.push(ch);
    else if (/Wall|Facade/i.test(String(ch?.constructor?.name || ''))) out.push(ch);
  });
  return out;
}

function _classify(hostType, neighborType) {
  if (hostType === 'torets' && neighborType === 'plast') return 'torets-plast';
  if (hostType === 'plast' && neighborType === 'torets') return 'plast-torets';
  if (hostType === 'torets' && neighborType === 'torets') return 'torets-torets';
  if (hostType === 'plast' && neighborType === 'plast') return 'plast-plast';
  return 'unknown';
}

function _contactAreaMm2(c) {
  return Math.max(0, Number(c.seamOverlapMm) || 0) * Math.max(0, Number(c.edgeOverlapMm) || 0);
}

function _neighborKey(c) {
  const p = c?.neighborPanel;
  if (p?.uuid) return String(p.uuid);
  if (p?.id != null) return `id:${p.id}`;
  return `name:${c?.neighborName || '?'}`;
}

/**
 * Один сосед → один стык (как в БМ на ящике).
 * Нельзя один стык подсветить дважды (торец-хост и пласть-хост).
 * Разные соседи (фасад / зад / дно) — отдельные стыки, все оставляем.
 */
function _dedupeContactsByNeighbor(contacts) {
  const best = new Map();
  for (const c of contacts || []) {
    const key = _neighborKey(c);
    const area = _contactAreaMm2(c);
    const prev = best.get(key);
    if (!prev || area > (Number(prev._area) || 0)) {
      best.set(key, Object.assign({}, c, { _area: area }));
    }
  }
  return [...best.values()].map((c) => {
    const copy = Object.assign({}, c);
    delete copy._area;
    return copy;
  });
}

/**
 * Контакты торец↔пласть для выбранной панели при зазоре ≈ 0.
 * @returns {Array<{
 *   id: string,
 *   pair: string,
 *   hostFaceType: string,
 *   neighborFaceType: string,
 *   neighborName: string,
 *   gapMm: number,
 *   seamOverlapMm: number,
 *   edgeOverlapMm: number,
 *   toretsThickMm: number,
 *   plastThickMm: number,
 *   seamOverlapMinWorld: number,
 *   seamOverlapMaxWorld: number,
 *   edgeOverlapMinWorld: number,
 *   edgeOverlapMaxWorld: number,
 *   hostOutwardWorld: THREE.Vector3,
 *   hostSeamDirWorld: THREE.Vector3,
 *   hostEdgeDirWorld: THREE.Vector3,
 *   hostFaceCenterWorld: THREE.Vector3,
 *   hostPanel: object,
 *   neighborPanel: object,
 *   faceKey: string,
 * }>}
 */
export function detectToretsAgainstPlast(hostPanel, rootGroup, opts = {}) {
  const u = Number(opts.mmPerWorldUnit) > 0 ? Number(opts.mmPerWorldUnit) : 10;
  const eps = Number.isFinite(Number(opts.gapEpsMm)) ? Number(opts.gapEpsMm) : TORET_PLAST_GAP_EPS_MM;
  const ovMin = Number.isFinite(Number(opts.overlapMinMm))
    ? Number(opts.overlapMinMm)
    : TORET_PLAST_OVERLAP_MIN_MM;

  const hBBox = panelBBoxWorld(hostPanel);
  if (!hBBox || !rootGroup) return [];

  const faces = listPanelFaces(hostPanel);
  const candidates = _enumeratePanels(rootGroup);
  const cSelf = hBBox.getCenter(new THREE.Vector3());
  const hostThickMm = panelThicknessMm(hostPanel, hBBox, u);
  const tol = {
    gapMin: -eps / u,
    gapMax: eps / u,
    overlapMin: ovMin / u,
  };

  const out = [];
  let idx = 0;

  for (const face of faces) {
    const hostOutward = face.outwardWorld.clone().normalize();
    const hostType = face.kind === 'plast' ? 'plast' : 'torets';
    // На пласти — все соседи (lockNormal). На торце — тоже lockNormal к этой грани.
    const basis = {
      s: face.seamDirWorld.clone().normalize(),
      e: face.edgeDirWorld.clone().normalize(),
    };

    for (const cand of candidates) {
      if (cand === hostPanel) continue;
      const cBBox = panelBBoxWorld(cand);
      if (!cBBox) continue;

      const m = measureJointNeighborPair(hBBox, cBBox, {
        hasFrame: true,
        lockNormal: true,
        nPlane: hostOutward,
        sDir: basis.s,
        eDir: basis.e,
        cSelf,
        faceAxis: 'x',
        faceSign: 1,
        seamAx: 'x',
        edgeAx: 'y',
        faceCoord: 0,
        tol,
      });
      if (!m.gapInRange) continue;

      const gapMm = m.dist * u;
      if (Math.abs(gapMm) > eps + 1e-6) continue;

      const seamOvMm = m.seamOv * u;
      const edgeOvMm = m.edgeOv * u;
      if (seamOvMm < ovMin || edgeOvMm < ovMin * 0.4) continue;

      const nFaceType = neighborFaceTypeAt(cand, cBBox, hostOutward);
      const pair = _classify(hostType, nFaceType);
      if (!isToretsPlastPair(pair)) continue;

      const neighborThickMm = panelThicknessMm(cand, cBBox, u);
      const toretsThickMm = hostType === 'torets' ? hostThickMm : neighborThickMm;
      const plastThickMm = hostType === 'plast' ? hostThickMm : neighborThickMm;

      // Ось ГРУППЫ / линия крепежа = длинная сторона пятна контакта.
      // У пласти фасада face.seamDir = ширина панели → без перестановки
      // seamOverlap≈толщина бока (~16), а стык с боком идёт по высоте (~191).
      const longIsSeam = seamOvMm >= edgeOvMm;
      const jointLenMm = longIsSeam ? seamOvMm : edgeOvMm;
      const jointWidthMm = longIsSeam ? edgeOvMm : seamOvMm;
      const jointSeamDir = longIsSeam ? basis.s : basis.e;
      const jointEdgeDir = longIsSeam ? basis.e : basis.s;
      const jointSeamMin = longIsSeam ? m.seamMin : m.edgeMin;
      const jointSeamMax = longIsSeam ? m.seamMax : m.edgeMax;
      const jointEdgeMin = longIsSeam ? m.edgeMin : m.seamMin;
      const jointEdgeMax = longIsSeam ? m.edgeMax : m.seamMax;

      const lx = Math.abs(jointSeamDir.x);
      const ly = Math.abs(jointSeamDir.y);
      const lz = Math.abs(jointSeamDir.z);
      let longAxis = 'y';
      if (ly >= lx && ly >= lz) longAxis = 'y';
      else if (lx >= ly && lx >= lz) longAxis = 'x';
      else longAxis = 'z';

      const nbName = _panelName(cand);
      out.push({
        // Стабильный id без Three uuid — иначе после rebuild store не находит контакт.
        id: `${face.faceKey || hostType}_${nbName || 'nb'}_${longAxis}_${hostType}`,
        pair,
        hostFaceType: hostType,
        neighborFaceType: nFaceType,
        neighborName: nbName,
        gapMm,
        seamOverlapMm: jointLenMm,
        edgeOverlapMm: jointWidthMm,
        toretsThickMm,
        plastThickMm,
        seamWidthMm: Math.max(0, Math.min(jointWidthMm, toretsThickMm || jointWidthMm)),
        seamOverlapMinWorld: Number.isFinite(jointSeamMin) ? jointSeamMin : 0,
        seamOverlapMaxWorld: Number.isFinite(jointSeamMax) ? jointSeamMax : 0,
        edgeOverlapMinWorld: Number.isFinite(jointEdgeMin) ? jointEdgeMin : 0,
        edgeOverlapMaxWorld: Number.isFinite(jointEdgeMax) ? jointEdgeMax : 0,
        hostOutwardWorld: hostOutward.clone(),
        hostSeamDirWorld: jointSeamDir.clone(),
        hostEdgeDirWorld: jointEdgeDir.clone(),
        hostFaceCenterWorld: face.faceCenterWorld.clone(),
        hostPanel,
        neighborPanel: cand,
        faceKey: face.faceKey || null,
        hostJointIdx: face.jointIdx == null ? -1 : Number(face.jointIdx),
        /** Длинная ось пятна: y = вертикальный стык, x|z = горизонтальный */
        seamAxis: longAxis,
        groupKey: longAxis === 'y' ? 'vertical' : 'horizontal',
      });
      idx += 1;
    }
  }

  return _dedupeContactsByNeighbor(out);
}

/**
 * Условие контакта (глобально): роль грани хоста × ось длинной стороны пятна.
 * Одинаковый ключ → одна группа (параллель + одно условие), любая деталь.
 */
export function contactConditionKey(contact) {
  const face = String(contact?.hostFaceType || 'torets') === 'plast' ? 'plast' : 'torets';
  const orient =
    contact?.groupKey === 'horizontal' ||
    (contact?.seamAxis && String(contact.seamAxis).toLowerCase() !== 'y')
      ? 'horizontal'
      : 'vertical';
  return `${face}_${orient}`;
}

/**
 * Контакт для записи jointSchemes (как превью constructor-clodis):
 * contactId / neighbor+condition → detectToretsAgainstPlast,
 * иначе jointIdx 0..3 → resolveJointContactForIdx,
 * иначе zip synthetic jointIdx (>3) по schemeId.
 */
export function resolveContactForJointSchemeEntry(panelRoot, schemeEntry, rootGroup, opts = {}) {
  if (!panelRoot || !schemeEntry || !rootGroup) return null;
  const contacts = detectToretsAgainstPlast(panelRoot, rootGroup, opts);
  const cid = schemeEntry.contactId != null ? String(schemeEntry.contactId) : '';
  if (cid) {
    const hit = contacts.find((c) => String(c.id) === cid);
    if (hit) return { ...hit, active: true, viaPlast: hit.hostFaceType === 'plast' };
  }
  const nb = String(schemeEntry.neighborName || '').trim();
  const cond = String(schemeEntry.conditionKey || '').trim();
  if (nb || cond) {
    const hit = contacts.find((c) => {
      if (nb && String(c.neighborName || '') !== nb) return false;
      if (cond && contactConditionKey(c) !== cond) return false;
      return true;
    });
    if (hit) return { ...hit, active: true, viaPlast: hit.hostFaceType === 'plast' };
  }
  const jIdx = Number(schemeEntry.jointIdx);
  if (Number.isFinite(jIdx) && jIdx >= 0 && jIdx <= 3) {
    return resolveJointContactForIdx(panelRoot, jIdx, rootGroup, opts);
  }
  if (Number.isFinite(jIdx) && jIdx > 3 && contacts.length) {
    const rawSchemes =
      panelRoot.userData?.jointSchemes ||
      panelRoot.config?.jointSchemes ||
      [];
    const sameScheme = (Array.isArray(rawSchemes) ? rawSchemes : [])
      .filter((s) => Number(s.schemeId) === Number(schemeEntry.schemeId))
      .slice()
      .sort((a, b) => Number(a.jointIdx) - Number(b.jointIdx));
    const sortedContacts = contacts
      .slice()
      .sort((a, b) =>
        String(a.neighborName || '').localeCompare(String(b.neighborName || ''), 'ru'),
      );
    const i = sameScheme.findIndex(
      (s) =>
        Number(s.jointIdx) === jIdx &&
        Number(s.schemeId) === Number(schemeEntry.schemeId),
    );
    if (i >= 0 && i < sortedContacts.length) {
      const hit = sortedContacts[i];
      return { ...hit, active: true, viaPlast: hit.hostFaceType === 'plast' };
    }
    if (sameScheme.length === 1 && sortedContacts.length === 1) {
      const hit = sortedContacts[0];
      return { ...hit, active: true, viaPlast: hit.hostFaceType === 'plast' };
    }
  }
  return null;
}

/**
 * Группы = бакеты по conditionKey. Без веток «если фасад / бок / шкаф».
 */
export function buildToretsPlastGroups(contacts) {
  const buckets = new Map();
  for (const c of contacts || []) {
    const key = contactConditionKey(c);
    c.conditionKey = key;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(c);
  }
  const order = [
    'torets_vertical',
    'torets_horizontal',
    'plast_vertical',
    'plast_horizontal',
  ];
  const titleOf = {
    torets_vertical: 'Торец · вертикаль',
    torets_horizontal: 'Торец · горизонталь',
    plast_vertical: 'Пласть · вертикаль',
    plast_horizontal: 'Пласть · горизонталь',
  };
  const groups = [];
  for (const key of order) {
    const items = buckets.get(key);
    if (!items?.length) continue;
    const neighbors = [...new Set(items.map((c) => c.neighborName).filter(Boolean))];
    groups.push({
      key,
      axis: key.endsWith('vertical') ? 'y' : 'horizontal',
      hostFaceType: key.startsWith('plast') ? 'plast' : 'torets',
      name: (titleOf[key] || key) + (neighbors.length ? (` · ${neighbors.join(', ')}`) : ''),
      count: items.length,
      contactIds: items.map((c) => c.id),
      contacts: items,
    });
  }
  return groups;
}

/** Середина пятна стыка в мире (для подсветки). */
export function toretPlastPatchCenter(contact) {
  if (!contact?.hostFaceCenterWorld || !contact?.hostSeamDirWorld) return null;
  const s = contact.hostSeamDirWorld.clone().normalize();
  const e = (contact.hostEdgeDirWorld || new THREE.Vector3(0, 1, 0)).clone().normalize();
  const c0 = contact.hostFaceCenterWorld;
  const midS =
    (Number(contact.seamOverlapMinWorld) + Number(contact.seamOverlapMaxWorld)) * 0.5;
  const midE =
    (Number(contact.edgeOverlapMinWorld) + Number(contact.edgeOverlapMaxWorld)) * 0.5;
  if (!Number.isFinite(midS) || !Number.isFinite(midE)) return c0.clone();
  return c0
    .clone()
    .addScaledVector(s, midS - c0.dot(s))
    .addScaledVector(e, midE - c0.dot(e));
}

/**
 * Пятно стыка = площадь контакта (seamOverlap × edgeOverlap).
 * Для подсветки короткая сторона не тоньше VISUAL_MIN_MM — иначе HDF 3 мм
 * выглядит «ниткой» и кажется, что активного стыка нет (как на скрине бока).
 * В данных контакта реальные мм не меняем.
 */
export function addToretsPlastDebugRibbon(group, contact, mmPerWorldUnit = 10, color = 0xc084fc, opts = {}) {
  if (!group || !contact) return false;
  const u = Number(mmPerWorldUnit) > 0 ? Number(mmPerWorldUnit) : 10;
  const seamMm = Number(contact.seamOverlapMm) || 0;
  const edgeMm = Number(contact.edgeOverlapMm) || 0;
  // HDF 3 мм: короткая сторона может быть ~3 — всё равно стык.
  if (!(seamMm > 0.5) || !(edgeMm > 0.5)) return false;
  const center = toretPlastPatchCenter(contact);
  if (!center) return false;

  let seamDir = contact.hostSeamDirWorld.clone().normalize();
  let edgeDir = contact.hostEdgeDirWorld.clone().normalize();
  edgeDir = edgeDir.sub(seamDir.clone().multiplyScalar(seamDir.dot(edgeDir)));
  if (edgeDir.lengthSq() < 1e-12) {
    edgeDir = new THREE.Vector3(0, 1, 0).cross(seamDir);
    if (edgeDir.lengthSq() < 1e-12) edgeDir = new THREE.Vector3(1, 0, 0).cross(seamDir);
  }
  edgeDir.normalize();
  let n = new THREE.Vector3().crossVectors(seamDir, edgeDir);
  if (contact.hostOutwardWorld && n.dot(contact.hostOutwardWorld) < 0) n.negate();
  n.normalize();
  edgeDir = new THREE.Vector3().crossVectors(n, seamDir).normalize();

  const VISUAL_MIN_MM = 12;
  let dispSeam = seamMm;
  let dispEdge = edgeMm;
  if (dispSeam < dispEdge) dispSeam = Math.max(dispSeam, VISUAL_MIN_MM);
  else dispEdge = Math.max(dispEdge, VISUAL_MIN_MM);

  const active = !!opts.active;
  const seamL = dispSeam / u;
  const rib = dispEdge / u;
  // Активный и простой — одна толщина; отличается только цвет (как в БМ).
  const t = 0.006;
  const bump = u >= 5 ? 0.12 : 0.015;
  const pos = center.clone().addScaledVector(n, bump + t * 0.5);

  const geom = new THREE.BoxGeometry(Math.max(seamL, 0.001), Math.max(rib, 0.001), t);
  const m4 = new THREE.Matrix4();
  m4.makeBasis(seamDir, edgeDir, n);
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: active ? 0.92 : 0.72,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.setRotationFromMatrix(m4);
  mesh.position.copy(pos);
  mesh.renderOrder = active ? 18 : 17;
  mesh.name = '__cld_toret_plast_patch';
  mesh.userData.cannotSelect = true;
  mesh.userData.toretPlastPatch = true;
  mesh.userData.patchMm = { seam: seamMm, edge: edgeMm, dispSeam, dispEdge };
  mesh.userData.groupKey = contact.groupKey || null;
  mesh.userData.neighborName = contact.neighborName || null;
  group.add(mesh);
  return true;
}
