/**
 * Стыковой крепёж в комнате: 3D-цилиндры по jointSchemes + шаблонам присадки.
 * Математика — joint-fitting-resolve.js + joint-engine-v2 (как превью / CFRN).
 */
import * as THREE from 'three';
import { detectJointContact, panelBBoxWorld, contactAllowsSchemeBySeamWidth } from '/js/joint-engine-v2.js?v=20260727-ecc-export';
import { getJointStripeFrameWorld } from '/js/panel-edge-frame.js?v=20261115-jointNegScale1';
import {
  resolveJointSchemeStationsMm,
  jointSeamGeomLenPreferContactMm,
  getJointTemplatePlacementsUnified,
  resolveJointFittingRolesUnified,
  jointTemplateHolesForSetup,
  normalizeJointHoleForFitting,
  resolveJointDrillTemplateSetupType,
  resolveJointHoleTargetPanel,
  identifySetup3FaceEdgePanels,
  jointSeamWorldPoint,
  resolveSchemeMinSeamWidthMm,
} from '/js/joint-fitting-resolve.js?v=20260727-drawer-holes';
import { resolveContactForJointSchemeEntry } from '/js/joint-toret-plast-detect.js?v=20260727-ecc-export';

const ROOM_MM_PER_UNIT = 1;
const CYL_Y = new THREE.Vector3(0, 1, 0);

function _readLs(key) {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function _jointFaceInfo(jointIdx, bbox) {
  const bSize = new THREE.Vector3();
  bbox.getSize(bSize);
  const minDim = Math.min(bSize.x, bSize.y, bSize.z);
  const thinAxis =
    Math.abs(bSize.x - minDim) < 0.0001 ? 'x'
      : Math.abs(bSize.y - minDim) < 0.0001 ? 'y' : 'z';
  const j = Number(jointIdx);
  let faceAxis;
  let faceSign;
  if (j === 0 || j === 1) {
    faceAxis = thinAxis === 'y' ? 'z' : 'y';
    faceSign = j === 0 ? 1 : -1;
  } else {
    faceAxis = thinAxis === 'x' ? 'z' : 'x';
    faceSign = j === 2 ? -1 : 1;
  }
  return { faceAxis, faceSign, thinAxis };
}

function _jointFaceSeamAndEdgeAxes(bbox, jointIdx) {
  const bSize = new THREE.Vector3();
  bbox.getSize(bSize);
  const { faceAxis } = _jointFaceInfo(jointIdx, bbox);
  const perps = ['x', 'y', 'z'].filter((a) => a !== faceAxis);
  const a = perps[0];
  const b = perps[1];
  const seamAx = bSize[a] >= bSize[b] ? a : b;
  const edgeAx = seamAx === a ? b : a;
  return { seamAx, edgeAx, faceAxis };
}

function _seamGeomLenMm(bbox, jointIdx, contact = null) {
  return jointSeamGeomLenPreferContactMm(contact, bbox, jointIdx, ROOM_MM_PER_UNIT, 0);
}

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
  core.updateWorldMatrix(true, false);
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

function _seamPivotAtMin(bbox, seamAx, pivotWorld) {
  if (!pivotWorld) return true;
  const distMin = Math.abs(pivotWorld[seamAx] - bbox.min[seamAx]);
  const distMax = Math.abs(pivotWorld[seamAx] - bbox.max[seamAx]);
  return distMin <= distMax;
}

function _seamCoordOnAxis(bbox, seamAx, pMm, panelRoot) {
  const lo = bbox.min[seamAx];
  const hi = bbox.max[seamAx];
  const pivotW = _panelPivotWorld(panelRoot);
  const pivotAtMin = _seamPivotAtMin(bbox, seamAx, pivotW);
  const deltaM = Math.max(0, Number(pMm) || 0) / ROOM_MM_PER_UNIT;
  let raw = pivotAtMin ? lo + deltaM : hi - deltaM;
  if (raw < lo) raw = lo;
  if (raw > hi) raw = hi;
  return raw;
}

function _seamPointWorld(bbox, jointIdx, pMm, panelRoot, seamLenMm = 0, contact = null) {
  const pt = panelRoot
    ? jointSeamWorldPoint(panelRoot, jointIdx, seamLenMm, pMm, ROOM_MM_PER_UNIT, contact)
    : null;
  if (pt) return pt;
  const jIdx = Number(jointIdx);
  const { seamAx, edgeAx, faceAxis } = _jointFaceSeamAndEdgeAxes(bbox, jIdx);
  const { faceSign } = _jointFaceInfo(jIdx, bbox);
  const fallback = new THREE.Vector3();
  fallback[faceAxis] = faceSign > 0 ? bbox.max[faceAxis] : bbox.min[faceAxis];
  fallback[edgeAx] = (bbox.min[edgeAx] + bbox.max[edgeAx]) / 2;
  fallback[seamAx] = _seamCoordOnAxis(bbox, seamAx, pMm, panelRoot);
  return fallback;
}

function _panelThicknessMm(panelRoot, bbox) {
  const t = Number(panelRoot?.userData?.__cldNominalThicknessMm);
  if (Number.isFinite(t) && t > 0) return t;
  if (!bbox || bbox.isEmpty()) return 16;
  const s = new THREE.Vector3();
  bbox.getSize(s);
  return Math.min(s.x, s.y, s.z) * ROOM_MM_PER_UNIT;
}

function _neighborThicknessMm(neighborPanel, neighborBBox) {
  const t = Number(neighborPanel?.userData?.__cldNominalThicknessMm);
  if (Number.isFinite(t) && t > 0) return t;
  if (!neighborBBox || neighborBBox.isEmpty()) return 16;
  const s = new THREE.Vector3();
  neighborBBox.getSize(s);
  return Math.min(s.x, s.y, s.z) * ROOM_MM_PER_UNIT;
}

function _resolvePanelRoot(obj) {
  if (!obj) return null;
  if (obj.userData?.isDetail && obj.userData?.__cldPivotCodes) return obj;
  let cur = obj;
  for (let i = 0; i < 8 && cur; i++) {
    if (cur.userData?.isDetail && cur.userData?.__cldPivotCodes) return cur;
    cur = cur.parent;
  }
  return obj.parent || obj;
}

function _collectJointPanelTargets(furnitureRoot) {
  const out = [];
  const seen = new Set();
  furnitureRoot.traverse((ch) => {
    const schemes = ch.userData?.jointSchemes;
    if (!Array.isArray(schemes) || !schemes.length) return;
    // jointSchemes часто копируются и на *_core → второй проход = дубль отверстий/крепежа.
    if (/_core$/i.test(String(ch.name || ''))) return;
    const panelRoot = _resolvePanelRoot(ch);
    if (!panelRoot || seen.has(panelRoot.uuid)) return;
    // Тот же own_object / та же деталь под другим uuid — не дублировать.
    const attach = panelRoot.userData?.own_object || panelRoot;
    if (seen.has(attach.uuid)) return;
    seen.add(panelRoot.uuid);
    seen.add(attach.uuid);
    out.push({ panelRoot, schemes });
  });
  return out;
}

function _panelAttachRoot(panelRoot) {
  return panelRoot?.userData?.own_object || panelRoot;
}

function _clearJointHoleGroups(furnitureRoot) {
  if (!furnitureRoot?.traverse) return;
  const legacy = furnitureRoot.getObjectByName('__furni_joint_holes');
  if (legacy) {
    furnitureRoot.remove(legacy);
    legacy.traverse((ch) => {
      if (ch.geometry) ch.geometry.dispose();
      if (ch.material) ch.material.dispose();
    });
  }
  const doomed = [];
  furnitureRoot.traverse((o) => {
    if (o?.name === '__panel_joint_holes') doomed.push(o);
  });
  for (const g of doomed) {
    try {
      g.parent?.remove(g);
    } catch (_) {}
    g.traverse((ch) => {
      if (ch.geometry) ch.geometry.dispose();
      if (ch.material) ch.material.dispose();
    });
  }
}

/** Группа отверстий на панели — едет с аниматором ящика (как в constructor-clodis). */
function _ensurePanelHoleGroup(panelRoot) {
  const own = _panelAttachRoot(panelRoot);
  if (!own) return null;
  let g = own.children?.find?.((c) => c.name === '__panel_joint_holes')
    || own.getObjectByName?.('__panel_joint_holes');
  if (g) return g;
  g = new THREE.Group();
  g.name = '__panel_joint_holes';
  g.userData.isAccessory = true;
  g.userData.furniJointDrillHoles = true;
  g.userData.panelJointHoles = true;
  own.add(g);
  return g;
}

function _makeHoleMesh(entry, isFace, parentForLocal) {
  const boreLenMm = Number(entry.boreLenMm) > 0 ? Number(entry.boreLenMm) : Number(entry.depth) || 16;
  const boreLen = boreLenMm / ROOM_MM_PER_UNIT;
  const radius = Math.max((Number(entry.diameter) || 8) / (2 * ROOM_MM_PER_UNIT), 0.05);
  const dirWorld = entry.worldDir.clone().normalize();
  const centerWorld = entry.worldEntry.clone().addScaledVector(dirWorld, boreLen * 0.5);
  const mat = new THREE.MeshBasicMaterial({
    color: isFace ? 0x7c3aed : 0x22d3ee,
    transparent: true,
    opacity: 0.88,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const cyl = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, Math.max(boreLen, 0.05), 16, 1),
    mat,
  );
  // worldEntry — мир; родитель — локаль панели (own_object), иначе цилиндры не едут с ящиком.
  if (parentForLocal && typeof parentForLocal.worldToLocal === 'function') {
    parentForLocal.updateWorldMatrix(true, false);
    const localPos = centerWorld.clone();
    parentForLocal.worldToLocal(localPos);
    cyl.position.copy(localPos);
    // inv(matrix3), не quaternion: иначе scale.x<0 переворачивает ось отверстия.
    const invM = new THREE.Matrix4().copy(parentForLocal.matrixWorld).invert();
    const inv3 = new THREE.Matrix3().setFromMatrix4(invM);
    const localDir = dirWorld.clone().applyMatrix3(inv3);
    if (localDir.lengthSq() > 1e-12) {
      cyl.quaternion.setFromUnitVectors(CYL_Y, localDir.normalize());
    } else {
      cyl.quaternion.setFromUnitVectors(CYL_Y, dirWorld);
    }
  } else {
    cyl.quaternion.setFromUnitVectors(CYL_Y, dirWorld);
    cyl.position.copy(centerWorld);
  }
  cyl.renderOrder = 12;
  cyl.name = isFace ? 'furni_joint_hole_face' : 'furni_joint_hole_edge';
  cyl.userData.isAccessory = true;
  cyl.userData.furniDrillHole = true;
  return cyl;
}

/**
 * Жёсткий snap в WORLD: крепёж на грань bbox панели (лево/право по jointIdx).
 * Не зависит от BLB/center и от LS схем — baked ±300 после resize 600→500
 * больше не «висит» снаружи.
 */
function _snapJointFrameToPanelWorldFace(furn) {
  if (!furn?.parent || !furn.userData || typeof THREE === 'undefined') return false;
  const ud = furn.userData;
  const jIdx = Number(ud.jointIdx);
  let panelRoot = null;
  let p = furn.parent;
  for (let i = 0; i < 12 && p; i++) {
    const pud = p.userData || {};
    if (
      Array.isArray(pud.jointSchemes) ||
      pud.type === 'wall' ||
      pud.isDetail ||
      Number(pud.__cldCfrnSizeMm?.x) > 0 ||
      Number(pud.calculated?.size?.x) > 0
    ) {
      panelRoot = _resolvePanelRoot(p) || p;
      break;
    }
    p = p.parent;
  }
  if (!panelRoot) panelRoot = _resolvePanelRoot(furn.parent) || furn.parent;
  const hostBBox = panelBBoxWorld(panelRoot);
  if (!hostBBox || hostBBox.isEmpty()) return false;

  const parent = furn.parent;
  if (typeof parent.worldToLocal !== 'function') return false;
  parent.updateWorldMatrix(true, false);

  const wp = new THREE.Vector3();
  furn.getWorldPosition(wp);
  const target = wp.clone();

  // Гориз. панель (дно/планка): jointIdx 2/3 = minX/maxX. Вертик. бок — реже.
  const size = new THREE.Vector3();
  hostBBox.getSize(size);
  const thinIsY = size.y <= size.x && size.y <= size.z;
  const thinIsZ = size.z <= size.x && size.z <= size.y;
  // Тонкая по Y → горизонтальная панель, ширина по X
  if (thinIsY || (!thinIsZ && size.x >= size.z)) {
    if (jIdx === 2) target.x = hostBBox.min.x;
    else if (jIdx === 3) target.x = hostBBox.max.x;
    else {
      target.x =
        Math.abs(wp.x - hostBBox.min.x) <= Math.abs(wp.x - hostBBox.max.x)
          ? hostBBox.min.x
          : hostBBox.max.x;
    }
  } else {
    // вертикальная: стык по Z или X
    if (jIdx === 0) target.z = hostBBox.max.z;
    else if (jIdx === 1) target.z = hostBBox.min.z;
    else if (jIdx === 2) target.x = hostBBox.min.x;
    else if (jIdx === 3) target.x = hostBBox.max.x;
  }

  const local = target.clone();
  parent.worldToLocal(local);
  const nx = Math.round(local.x * 100) / 100;
  const ny = Math.round(local.y * 100) / 100;
  const nz = Math.round(local.z * 100) / 100;
  const dx = Math.abs((Number(furn.position.x) || 0) - nx);
  const dy = Math.abs((Number(furn.position.y) || 0) - ny);
  const dz = Math.abs((Number(furn.position.z) || 0) - nz);
  if (dx < 0.5 && dy < 0.5 && dz < 0.5) return false;
  furn.position.set(nx, ny, nz);
  return true;
}

/**
 * Как в админ-превью (_rebuildAllJointSchemeModelsLive): 3D-крепёж fromJointScheme
 * переставить на живой стык при текущем W×H×D, а не оставлять baked pos из JSON.
 * Иначе в админке 500 мм ок, в комнате при ячейке/rebuild — конфирматы «висят» снаружи.
 *
 * @param {THREE.Object3D} furnitureRoot корень шкафа
 * @param {{ mmPerWorldUnit?: number }} [options]
 * @returns {number} сколько узлов сдвинули
 */
export function repositionJointSchemeFurnitureInRoom(furnitureRoot, options = {}) {
  if (!furnitureRoot || typeof THREE === 'undefined') return 0;
  const mmPerWorldUnit =
    Number(options.mmPerWorldUnit) > 0 ? Number(options.mmPerWorldUnit) : ROOM_MM_PER_UNIT;
  const allSchemes = _readLs('clodis_drill_schemes_v1');
  const allTemplates = _readLs('clodis_drilling_templates_v2');

  furnitureRoot.updateMatrixWorld(true);
  const frames = [];
  furnitureRoot.traverse((o) => {
    if (!o?.isObject3D || !o.userData) return;
    const ud = o.userData;
    if (!ud.fromJointScheme) return;
    // Двигаем furniture-кадр, не child model.
    if (Number(ud.jointTemplateModel) === 1 || Number(ud.spec?.joint_template_model) === 1) return;
    const isFrame =
      Number(ud.jointTemplateFrame) === 1 ||
      Number(ud.spec?.joint_template_frame) === 1 ||
      (Number(ud.schemeId) > 0 &&
        (Number.isFinite(Number(ud.jointIdx)) || (ud.contactId != null && String(ud.contactId))));
    if (!isFrame) return;
    frames.push(o);
  });
  if (!frames.length) {
    console.warn('[CLD][joint-furniture] no frames to reposition', {
      root: furnitureRoot.name,
    });
    return 0;
  }

  // 1) World-face snap — всегда, без LS/контакта (главный фикс «не уменьшается с модулем»).
  let snapped = 0;
  for (const furn of frames) {
    if (_snapJointFrameToPanelWorldFace(furn)) snapped += 1;
  }
  if (snapped > 0) {
    furnitureRoot.updateMatrixWorld(true);
    console.log('[CLD][joint-furniture] world-face snap', { snapped, frames: frames.length });
  }

  if (!allSchemes.length || !allTemplates.length) return snapped;

  let moved = 0;
  for (const furn of frames) {
    const ud = furn.userData || {};
    const schemeId = Number(ud.schemeId) || 0;
    const jointIdx = Number(ud.jointIdx);
    const contactId = ud.contactId != null ? String(ud.contactId) : '';
    const seamPosMm = Number(ud.seamPosMm);
    const frameIndex = Number(ud.frameIndex ?? ud.index);
    if (!schemeId || (!Number.isFinite(jointIdx) && !contactId)) continue;

    let panelRoot = null;
    let schemes = null;
    let p = furn.parent;
    for (let i = 0; i < 12 && p; i++) {
      const js = p.userData?.jointSchemes;
      if (Array.isArray(js) && js.length) {
        panelRoot = _resolvePanelRoot(p);
        schemes = js;
        break;
      }
      p = p.parent;
    }
    if (!panelRoot || !schemes) continue;

    const jEntry = schemes.find((j) => {
      if (Number(j.schemeId) !== schemeId) return false;
      if (contactId && j.contactId != null && String(j.contactId) === contactId) return true;
      return Number.isFinite(jointIdx) && Number(j.jointIdx) === jointIdx;
    });
    if (!jEntry) continue;

    const scheme = allSchemes.find((s) => Number(s.id) === schemeId);
    if (!scheme) continue;
    const template = allTemplates.find((t) => Number(t.id) === Number(scheme.templateId));
    if (!template) continue;

    const hostBBox = panelBBoxWorld(panelRoot);
    if (!hostBBox || hostBBox.isEmpty()) continue;
    const jIdx = Number(jEntry.jointIdx);
    const contact =
      resolveContactForJointSchemeEntry(panelRoot, jEntry, furnitureRoot, { mmPerWorldUnit }) ||
      (Number.isFinite(jIdx) && jIdx >= 0 && jIdx <= 3
        ? detectJointContact(panelRoot, jIdx, furnitureRoot, { mmPerWorldUnit })
        : null);
    const hasContact =
      !!(contact?.active && contact?.neighborPanel && Number(contact.seamOverlapMm) >= 5);

    const setupType = resolveJointDrillTemplateSetupType(template, jEntry.setupType);
    const holeList = jointTemplateHolesForSetup(template, setupType)
      .map(normalizeJointHoleForFitting)
      .filter((h) => h && !h.through);
    if (!holeList.length) continue;

    const seamGeomMm = _seamGeomLenMm(hostBBox, jIdx, hasContact ? contact : null);
    const { seamLenMm: seamForScheme, positions } = resolveJointSchemeStationsMm({
      scheme,
      seamGeomMm,
      seamStoredMm: Number(jEntry.seamLen) || 0,
      authoredPositions: jEntry.positions,
    });
    if (!(seamForScheme > 0) || !positions.length) continue;

    let stationMm = null;
    if (Number.isFinite(seamPosMm)) {
      let best = null;
      let bestD = Infinity;
      for (const pMm of positions) {
        const d = Math.abs(Number(pMm) - seamPosMm);
        if (d < bestD) {
          bestD = d;
          best = Number(pMm);
        }
      }
      if (best != null && bestD <= 48) stationMm = best;
    }
    if (stationMm == null && Number.isFinite(frameIndex) && positions.length) {
      const idx = Math.max(0, Math.min(positions.length - 1, Math.floor(frameIndex)));
      stationMm = Number(positions[idx]);
    }
    if (stationMm == null) {
      const cur = new THREE.Vector3();
      furn.getWorldPosition(cur);
      let best = Number(positions[0]);
      let bestD = Infinity;
      for (const pMm of positions) {
        const seamW = _seamPointWorld(
          hostBBox,
          jIdx,
          pMm,
          panelRoot,
          seamForScheme,
          hasContact ? contact : null,
        );
        const d = cur.distanceTo(seamW);
        if (d < bestD) {
          bestD = d;
          best = Number(pMm);
        }
      }
      stationMm = best;
    }

    const parent = furn.parent;
    if (!parent || typeof parent.worldToLocal !== 'function') continue;
    parent.updateWorldMatrix(true, false);

    let O = null;
    if (hasContact) {
      const neighborBBox = contact.neighborBBox || panelBBoxWorld(contact.neighborPanel);
      if (neighborBBox && !neighborBBox.isEmpty()) {
        const outward = contact.hostOutwardWorld.clone().normalize();
        const nIn = outward.clone().multiplyScalar(-1).normalize();
        const tSeam = contact.hostSeamDirWorld.clone().normalize();
        const panelThickMm = _panelThicknessMm(panelRoot, hostBBox);
        const neighborThickMm = _neighborThicknessMm(contact.neighborPanel, neighborBBox);
        const { faceAxis, thinAxis } = _jointFaceInfo(jIdx, hostBBox);
        const hostFaceType =
          contact.hostFaceType || (faceAxis === thinAxis ? 'plast' : 'torets');
        const neighborFaceType = contact.neighborFaceType || 'torets';
        const targetThickMm =
          hostFaceType === 'torets' && neighborFaceType === 'plast'
            ? neighborThickMm
            : panelThickMm;
        const seamW = _seamPointWorld(
          hostBBox,
          jIdx,
          stationMm,
          panelRoot,
          seamForScheme,
          contact,
        );
        const raw = getJointTemplatePlacementsUnified({
          seamWorld: seamW,
          outward,
          nInWorld: nIn,
          tSeamWorld: tSeam,
          jointIdx: jIdx,
          setupType,
          holes: [holeList[0]],
          panelThickMm,
          targetThickMm,
          classificationThickMm: targetThickMm,
          mmPerWorldUnit,
          hostPanel: panelRoot,
          neighborPanel: contact.neighborPanel,
          hostBBox,
          neighborBBox,
          seamPosMm: stationMm,
          seamLenMm: seamForScheme,
          hostFaceType,
          neighborFaceType,
          seamSizeKey: String(jEntry.seamSizeKey || 'z'),
          facing:
            String(jEntry.facing || 'inside').toLowerCase() === 'outside'
              ? 'outside'
              : 'inside',
          contact,
        });
        if (Array.isArray(raw) && raw.length) {
          const framed =
            raw.find((h) => h?.templateFrame?.O || h?.setup3Frame?.O) || raw[0];
          O = framed?.templateFrame?.O || framed?.setup3Frame?.O || framed?.worldEntry || null;
        }
      }
    }

    // Без контакта соседа (частый случай после resize ячейки) — якорь на грань host.
    // Иначе baked ±300 при W=500 остаётся снаружи боковин.
    if (!O) {
      O = _seamPointWorld(
        hostBBox,
        jIdx,
        stationMm,
        panelRoot,
        seamForScheme,
        hasContact ? contact : null,
      );
    }
    if (!O) continue;

    const local = O.clone();
    parent.worldToLocal(local);
    const nx = Math.round(local.x * 100) / 100;
    const ny = Math.round(local.y * 100) / 100;
    const nz = Math.round(local.z * 100) / 100;
    const dx = Math.abs((Number(furn.position.x) || 0) - nx);
    const dy = Math.abs((Number(furn.position.y) || 0) - ny);
    const dz = Math.abs((Number(furn.position.z) || 0) - nz);
    if (dx < 0.35 && dy < 0.35 && dz < 0.35) continue;
    furn.position.set(nx, ny, nz);
    ud.seamPosMm = stationMm;
    if (Number.isFinite(frameIndex)) ud.frameIndex = frameIndex;
    moved += 1;
  }

  if (moved > 0) {
    furnitureRoot.updateMatrixWorld(true);
    console.log('[CLD][joint-furniture] live reposition (room=admin parity)', { moved });
  }
  return snapped + moved;
}

/**
 * @param {THREE.Object3D} furnitureRoot корень шкафа
 * @param {{ mmPerWorldUnit?: number }} [options]
 * @returns {number} число созданных цилиндров
 */
export function applyJointFittingHolesToFurnitureGroup(furnitureRoot, options = {}) {
  if (!furnitureRoot || typeof THREE === 'undefined') return 0;
  const mmPerWorldUnit = Number(options.mmPerWorldUnit) > 0 ? Number(options.mmPerWorldUnit) : ROOM_MM_PER_UNIT;
  const targets = _collectJointPanelTargets(furnitureRoot);
  if (!targets.length) return 0;

  const allSchemes = _readLs('clodis_drill_schemes_v1');
  const allTemplates = _readLs('clodis_drilling_templates_v2');
  if (!allSchemes.length || !allTemplates.length) return 0;

  _clearJointHoleGroups(furnitureRoot);
  furnitureRoot.updateWorldMatrix(true, true);
  let meshCount = 0;

  for (const { panelRoot, schemes } of targets) {
    const hostBBox = panelBBoxWorld(panelRoot);
    if (!hostBBox || hostBBox.isEmpty()) continue;
    const panelThickMm = _panelThicknessMm(panelRoot, hostBBox);

    for (const jEntry of schemes) {
      const jIdx = Number(jEntry.jointIdx);
      if (!Number.isFinite(jIdx)) continue;
      const scheme = allSchemes.find((s) => Number(s.id) === Number(jEntry.schemeId));
      if (!scheme) continue;
      const template = allTemplates.find((t) => Number(t.id) === Number(scheme.templateId));
      if (!template) continue;

      const setupType = resolveJointDrillTemplateSetupType(template, jEntry.setupType);
      const holeList = jointTemplateHolesForSetup(template, setupType)
        .map(normalizeJointHoleForFitting)
        .filter(Boolean);
      if (!holeList.length) continue;

      const contact =
        resolveContactForJointSchemeEntry(panelRoot, jEntry, furnitureRoot, { mmPerWorldUnit }) ||
        (Number.isFinite(jIdx) && jIdx >= 0 && jIdx <= 3
          ? detectJointContact(panelRoot, jIdx, furnitureRoot, { mmPerWorldUnit })
          : null);
      const canPlace =
        contact?.active &&
        contact?.neighborPanel &&
        Number(contact.seamOverlapMm) >= 5;
      if (!canPlace) continue;

      const minW = resolveSchemeMinSeamWidthMm(scheme, template, setupType);
      if (!contactAllowsSchemeBySeamWidth(contact, minW)) continue;

      const neighborBBox = contact.neighborBBox || panelBBoxWorld(contact.neighborPanel);
      if (!neighborBBox || neighborBBox.isEmpty()) continue;

      const seamGeomMm = _seamGeomLenMm(hostBBox, jIdx, contact);
      const seamStored = Number(jEntry.seamLen);
      // CAD этап 2: станции = схема × линия стыка (перекрытие контакта).
      const { seamLenMm: seamForScheme, positions } = resolveJointSchemeStationsMm({
        scheme,
        seamGeomMm,
        seamStoredMm: seamStored,
        authoredPositions: jEntry.positions,
      });
      if (seamForScheme <= 0 || !positions.length) continue;

      const outward = contact.hostOutwardWorld.clone().normalize();
      const nIn = outward.clone().multiplyScalar(-1).normalize();
      const tSeam = contact.hostSeamDirWorld.clone().normalize();

      const { faceAxis, thinAxis } = _jointFaceInfo(jIdx, hostBBox);
      const hostFaceType = contact.hostFaceType
        || (faceAxis === thinAxis ? 'plast' : 'torets');
      let neighborFaceType = contact.neighborFaceType || 'torets';
      if (!contact.neighborFaceType && contact.neighborPanel) {
        const nb = neighborBBox;
        const nbSize = new THREE.Vector3();
        nb.getSize(nbSize);
        const nbThin = Math.min(nbSize.x, nbSize.y, nbSize.z);
        const nbThinAxis =
          Math.abs(nbSize.x - nbThin) < 0.001 ? 'x'
            : Math.abs(nbSize.y - nbThin) < 0.001 ? 'y' : 'z';
        neighborFaceType = faceAxis === nbThinAxis ? 'plast' : 'torets';
      }
      const neighborThickMm = _neighborThicknessMm(contact.neighborPanel, neighborBBox);
      const targetThickMm =
        hostFaceType === 'torets' && neighborFaceType === 'plast' ? neighborThickMm : panelThickMm;
      let classificationThickMm = targetThickMm;
      if (setupType === 3 && contact.neighborPanel) {
        const fe = identifySetup3FaceEdgePanels(
          panelRoot,
          contact.neighborPanel,
          hostFaceType,
          neighborFaceType,
        );
        if (fe?.facePanel) {
          classificationThickMm = _panelThicknessMm(
            fe.facePanel,
            fe.facePanel === panelRoot ? hostBBox : neighborBBox,
          );
        }
      }

      for (const h of holeList) {
        if (h.through) continue;
        for (const pMm of positions) {
          const seamW = _seamPointWorld(hostBBox, jIdx, pMm, panelRoot, seamForScheme, contact);
          const raw = getJointTemplatePlacementsUnified({
            seamWorld: seamW,
            outward,
            nInWorld: nIn,
            tSeamWorld: tSeam,
            jointIdx: jIdx,
            setupType,
            holes: [h],
            panelThickMm,
            targetThickMm,
            classificationThickMm,
            mmPerWorldUnit,
            hostPanel: panelRoot,
            neighborPanel: contact.neighborPanel,
            hostBBox,
            neighborBBox,
            seamPosMm: Number(pMm) || 0,
            seamLenMm: seamForScheme,
            hostFaceType,
            neighborFaceType,
            seamSizeKey: String(jEntry.seamSizeKey || 'z'),
            facing: String(jEntry.facing || 'inside').toLowerCase() === 'outside' ? 'outside' : 'inside',
            contact,
          });
          const resolved = resolveJointFittingRolesUnified({
            rawPlacements: raw,
            outward,
            panelThickMm,
            neighborThickMm,
            classificationThickMm,
            templateName: template.name,
            schemeName: scheme.name || jEntry.schemeName,
            mmPerWorldUnit,
            setupType,
            hostPanel: panelRoot,
            neighborPanel: contact.neighborPanel,
            hostBBox,
            neighborBBox,
            hostFaceType,
            neighborFaceType,
          });
          for (const entry of resolved) {
            const targetPanel = resolveJointHoleTargetPanel({
              setupType,
              isFace: entry.isFace,
              hostPanel: panelRoot,
              neighborPanel: contact.neighborPanel,
              roles: entry.setup3Roles,
              faceEdge: entry.setup3FaceEdge,
              holeHostPanel: entry?.hole?.hostPanel ?? entry?.hole?.host_panel,
              mountSide: entry?.hole?.mountSide ?? entry?.hole?.mount_side,
            }) || panelRoot;
            const holeGroup = _ensurePanelHoleGroup(targetPanel);
            if (!holeGroup) continue;
            const cyl = _makeHoleMesh(entry, entry.isFace, holeGroup);
            holeGroup.add(cyl);
            meshCount += 1;
          }
        }
      }
    }
  }

  return meshCount;
}

export function removeJointFittingHolesFromFurnitureGroup(furnitureRoot) {
  _clearJointHoleGroups(furnitureRoot);
}
