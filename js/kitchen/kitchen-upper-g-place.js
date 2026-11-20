/**
 * Посадка в upperCornerCell (shape G):
 * — mid (НШ1) или top/антресоль (НШ2)
 * — «Угловой Г обр» / приставной ВМУ
 * Пивот ячейки = угол комнаты.
 */

import { state } from '../utils/state.js';
import {
  listKitchenJoints,
  getJointUpperHostSection,
  getJointUpperOtherSection,
  seatKitchenJointUpperCorner,
  resolveKitchenUpperCornerDepthMm,
  KITCHEN_UPPER_CORNER_CELL_WIDTH_MM,
  KITCHEN_UPPER_CORNER_CELL_DEPTH_MM,
} from './kitchen-joint.js?v=20261116-lCorner1050';
import {
  resolveUpperGCellWorldFrame,
  UPPER_G_ARM_MM,
  UPPER_G_DEPTH_MM,
} from './kitchen-upper-g-cell.js?v=20261115-upperGTop15';
import { isKitchenWallCornerGroup } from './kitchen-base-engine.js?v=20261115-upperGLeft27';
import { buildKitchenCornerReturnVars } from './kitchen-section-layout.js?v=20261118-overlayL6';
import {
  readUserDataClodisRoots,
  writeUserDataClodisRoots,
  readUserDataClodisData,
  writeUserDataClodisData,
  readUserDataClodisVariables,
  writeUserDataClodisVariables,
} from '../clodis-json-fields.js';
import { getClodisDataForBuild } from '../furniture/furniture-clodis.js?v=20261115-upperGTop9';

const __BUILD = '20261117-upperGCorpusSpan1';
/**
 * Админ-размеры/vars → ячейка.
 * Крыло: rotY=90 + size stub×H×depthB → фасад в комнату от other-стены.
 * scale.x=-1 + pos.z=depthA → «Бок правый» на дальнем конце рукава
 * (справа от зрителя), иначе торец оказывается у корпуса (зеркально).
 * Ярус: mid (НШ1) или top/антресоль (НШ2) — тот же план Г, Y/H от профиля.
 */
const UPPER_G_POSE_MODE = 'cell_wing_mirror1';

/** Vars Г как у НМУ corner_return_*: stub = arm − depthA (300→300, 350→250). */
export function buildUpperGReturnVars(armMm, depthAMm, depthBMm) {
  const arm = Math.round(Number(armMm) || UPPER_G_ARM_MM);
  const dA = Math.round(Number(depthAMm) || UPPER_G_DEPTH_MM);
  const dB = Math.round(Number(depthBMm) || dA || UPPER_G_DEPTH_MM);
  const stub = Math.max(50, arm - dA);
  return {
    corner_g_arm_mm: arm,
    corner_g_depth_a_mm: dA,
    corner_g_depth_b_mm: dB,
    corner_g_stub_mm: stub,
    // Host live «Шкаф/корпус»: width = v:corner_corpus_span_mm.
    // Без var → x=0 → s:x/s:x-33 нули → бока/дно/зад схлопнуты у угла (не крыло).
    corner_corpus_span_mm: arm,
  };
}

function _THREE() {
  return (typeof window !== 'undefined' && window.THREE) || null;
}

/** Дерево упоминает G-рукав (роль / имя / v:corner_g_*). */
function _treeHasUpperGArmSignal(roots) {
  const stack = Array.isArray(roots) ? [...roots] : roots ? [roots] : [];
  while (stack.length) {
    const n = stack.pop();
    if (!n || typeof n !== 'object') continue;
    const lr = String(n.layout_role || n.sectionLayoutRole || '')
      .trim()
      .toLowerCase();
    if (lr === 'corner_g_return') return true;
    if (/приставка\s*г/i.test(String(n.name || ''))) return true;
    for (const bag of [n.size, n.pos]) {
      if (!bag || typeof bag !== 'object') continue;
      for (const v of Object.values(bag)) {
        if (/v:\s*corner_g_/i.test(String(v || ''))) return true;
      }
    }
    if (Array.isArray(n.children)) stack.push(...n.children);
  }
  return false;
}

/** Дерево / карточка = «Угловой Г обр» (два рукава), не приставной ВМУ1. */
export function isKitchenUpperGModuleData(furnitureDataOrItem) {
  const raw = furnitureDataOrItem?.catalogItem || furnitureDataOrItem || null;
  if (!raw) return false;
  const name = String(
    raw.name ||
      raw.title ||
      raw.data?.name ||
      furnitureDataOrItem?.name ||
      ''
  ).trim();
  if (/угловой\s*г/i.test(name) || /\bг\s*обр/i.test(name)) return true;
  const ct = String(
    furnitureDataOrItem?.catalogType ||
      raw.catalog_type ||
      raw.catalogType ||
      raw.data?.catalog_type ||
      ''
  )
    .replace(/^catalog_/i, '')
    .trim();
  const id =
    Number(raw.id ?? raw.data?.id ?? furnitureDataOrItem?.catalogItemId) || 0;
  if ((ct === '54' || /54$/.test(ct)) && (id === 3 || id === 4)) return true;

  const roots =
    furnitureDataOrItem?.constructor_structure ||
    raw.constructor_structure ||
    raw.clodisJSON ||
    raw.data?.constructor_structure ||
    raw.data?.clodisJSON ||
    null;
  return _treeHasUpperGArmSignal(roots);
}

export function isKitchenUpperGModuleGroup(group) {
  if (!group?.userData) return false;
  const ud = group.userData;
  if (ud.__kitchenUpperGKind === 'g_arms') return true;
  if (/угловой\s*г/i.test(String(ud.catalogName || ''))) return true;
  const ct = String(ud.catalogType || '')
    .replace(/^catalog_/i, '')
    .trim();
  const id = Number(ud.catalogItemId) || 0;
  if ((ct === '54' || ct === 'catalog_54') && (id === 3 || id === 4)) {
    return true;
  }
  try {
    const roots =
      readUserDataClodisRoots(ud) || readUserDataClodisData(ud) || null;
    if (roots && _treeHasUpperGArmSignal(roots)) return true;
    if (roots && isKitchenUpperGModuleData({ constructor_structure: roots })) {
      return true;
    }
  } catch (_) {}
  return false;
}

function _normWall(name) {
  const w = String(name || '')
    .trim()
    .toLowerCase();
  return w === 'front' || w === 'back' || w === 'left' || w === 'right'
    ? w
    : null;
}

function _secDepthMm(sec) {
  if (!sec?.size) return 0;
  const w = _normWall(sec.wallName);
  const mm =
    w === 'left' || w === 'right' ? Number(sec.size.x) : Number(sec.size.z);
  return Number.isFinite(mm) && mm > 0 ? Math.round(mm) : 0;
}

/** Глубина рукава: carcass-like с секции, иначе профиль навеса. */
export function resolveUpperGArmDepthMm(sec) {
  const d = _secDepthMm(sec);
  if (d >= 200 && d <= 450) return d;
  const profile = resolveKitchenUpperCornerDepthMm();
  if (profile >= 200 && profile <= 700) return profile;
  return UPPER_G_DEPTH_MM || KITCHEN_UPPER_CORNER_CELL_DEPTH_MM;
}

/** Joint с upperCornerCell G у секции (A или B). */
export function findUpperGJointForSection(section) {
  if (!section?.id) return null;
  const sid = String(section.id);
  const joints = listKitchenJoints();
  for (const j of joints) {
    if (!j?.upperCornerCell || j.upperCornerCell.shape !== 'G') continue;
    if (String(j.sectionAId) === sid || String(j.sectionBId) === sid) return j;
  }
  return null;
}

/** mid | top — pending / карточка / папка «2 ярус» / активный пояс / hitY. */
export function resolveUpperGBandFromContext(furnitureData, pendingZone, group) {
  const z = pendingZone || {};
  const rawZ = String(z.upperGBand || z.band || z.wallBand || '')
    .trim()
    .toLowerCase();
  if (rawZ === 'top' || rawZ === 'antresol' || rawZ === 'wall_top') return 'top';
  if (rawZ === 'mid' || rawZ === 'wall_mid') return 'mid';
  const ud = group?.userData || {};
  const udBand = String(ud.__kitchenUpperGBand || '').trim().toLowerCase();
  if (udBand === 'top') return 'top';
  if (udBand === 'mid') return 'mid';
  const fd = furnitureData || {};
  const item = fd.catalogItem || fd;
  const pk = String(
    fd.__placementKindProfileId ||
      fd.placementKindProfileId ||
      fd.placementKind ||
      item?.placementKind ||
      ud.__placementKindProfileId ||
      ''
  )
    .trim()
    .toLowerCase();
  if (pk === 'kitchen_wall_top') return 'top';
  const stamp = String(
    fd.__kitchenWallBand || item?.__kitchenWallBand || ud.__kitchenWallBand || ''
  )
    .trim()
    .toLowerCase();
  if (stamp === 'top') return 'top';
  if (stamp === 'mid') return 'mid';
  const folder = String(
    fd.catalogFolder || item?.catalogFolder || item?.folder || ''
  )
    .trim()
    .toLowerCase();
  if (folder === 'top' || /2\s*ярус|антресол/.test(folder)) return 'top';
  const prod = String(fd.productKind || item?.productKind || ud.productKind || '')
    .trim()
    .toLowerCase();
  if (prod === 'kitchen_wall_top') return 'top';

  // Активный пояс «Ячейки» mid|top → ярус Г.
  try {
    const vs = state.kitchenBandGridsView;
    if (vs && vs.enabled === true) {
      const b = String(vs.band || '')
        .trim()
        .toLowerCase();
      if (b === 'top' || b === 'antresol') return 'top';
      if (b === 'mid') return 'mid';
    }
  } catch (_) {}

  // По hitY: TOP только если курсор на ярусе антресоли (y ≥ низ TOP).
  // Раньше порог (midY+topY)/2 ≈ середина НШ1 → Г с 1 яруса «вылетал» на 2-й.
  const hitY = Number(z.hitY ?? z.worldY ?? z.hitPointY);
  if (Number.isFinite(hitY) && hitY > 0) {
    let topY = 2140;
    try {
      const api =
        typeof window !== 'undefined' ? window.__cldKitchenManufacturing : null;
      if (api?.resolveKitchenWallTopPlaceSizing) {
        const s = api.resolveKitchenWallTopPlaceSizing({});
        const y = Math.round(Number(s?.floorClearanceMm) || 0);
        if (y > 0) topY = y;
      }
    } catch (_) {}
    if (hitY >= topY - 20) return 'top';
  }
  return 'mid';
}

/** Reseat Г: depthA = host, depthB = other (при flip host рукава меняются местами). */
export function reseatUpperGCellArmDepths(joint) {
  if (!joint) return null;
  const host = getJointUpperHostSection(joint);
  const other = getJointUpperOtherSection(joint);
  if (!host || !other) return null;
  const prevW = Math.round(Number(joint.upperCornerCell?.armMm) || 0);
  const atStart =
    typeof joint.upperCornerCell?.atStart === 'boolean'
      ? joint.upperCornerCell.atStart
      : undefined;
  return seatKitchenJointUpperCorner(joint, {
    widthMm:
      prevW >= 300 && prevW <= 900 ? prevW : KITCHEN_UPPER_CORNER_CELL_WIDTH_MM,
    depthAMm: resolveUpperGArmDepthMm(host),
    depthBMm: resolveUpperGArmDepthMm(other),
    atStart,
  });
}

function _isHostArmNode(n) {
  if (!n || typeof n !== 'object') return false;
  const name = String(n.name || '');
  const role = String(n.layout_role || n.sectionLayoutRole || '').trim();
  if (/приставка\s*г/i.test(name)) return false;
  if (role === 'corner_g_return') return false;
  // Корень рукава host: cabinet_root / «Шкаф…» / корпус (не только live_catalog).
  if (role === 'cabinet_root') return true;
  if (/корпус/i.test(name)) return true;
  if (/шкаф/i.test(name) && !/приставка/i.test(name)) return true;
  if (n.spec?.live_catalog && /корпус|шкаф/i.test(String(n.spec.key || name))) {
    return !/приставка/i.test(String(n.spec.key || name));
  }
  return false;
}

function _isOtherArmNode(n) {
  if (!n || typeof n !== 'object') return false;
  if (String(n.layout_role || '') === 'corner_g_return') return true;
  return /приставка\s*г/i.test(String(n.name || ''));
}

/**
 * Vars + TRS крыла под G-ячейку (X=host, Z=other).
 * rotY=90, size stub×H×depthB, pos z=depthA, scale.x=-1:
 * фасад → hostDir; торец («Бок правый») на дальнем конце вдоль other.
 */
export function applyUpperGArmSizesToRoots(roots, frame, opts = {}) {
  if (!roots || !frame) return { ok: false, reason: 'no_args' };
  const arm = Math.round(Number(frame.armMm) || UPPER_G_ARM_MM);
  const dA = Math.round(Number(frame.depthAMm) || UPPER_G_DEPTH_MM);
  const dB = Math.round(Number(frame.depthBMm) || dA || UPPER_G_DEPTH_MM);
  const H = Math.round(Number(frame.heightMm) || 720);
  const stubLen = Math.max(50, arm - dA);
  let hostN = 0;
  let otherN = 0;
  let wingPatched = 0;
  let sectionPatched = 0;
  void opts;

  const walk = (n) => {
    if (!n || typeof n !== 'object') return;
    if (
      n.type === 'section' &&
      (!n.name || String(n.name) === 'Секция') &&
      n.pivot &&
      typeof n.pivot === 'object'
    ) {
      const px = Number(n.pivot.x);
      const py = Number(n.pivot.y);
      const pz = Number(n.pivot.z);
      if (px !== -1 || py !== -1 || pz !== -1) {
        n.pivot = { x: -1, y: -1, z: -1 };
        sectionPatched++;
      }
    }
    if (_isHostArmNode(n)) {
      hostN++;
      // Явно arm×H×depthA — не s:x: иначе при правом L s:x схлопывается (~толщина)
      // и оба бока остаются у угла, а «Деталь» торчит полкой в объёме рукава.
      n.size = {
        x: 'v:corner_g_arm_mm',
        y: 's:y',
        z: 'v:corner_g_depth_a_mm',
      };
      n.pos = n.pos && typeof n.pos === 'object' ? n.pos : { x: 0, y: 0, z: 0 };
      n.pivot = { x: -1, y: -1, z: -1 };
    } else if (_isOtherArmNode(n)) {
      otherN++;
      n.size = {
        x: 'v:corner_g_stub_mm',
        y: 's:y',
        z: 'v:corner_g_depth_b_mm',
      };
      // depthA: после scale.x=-1 stub занимает [depthA, arm] вдоль other.
      n.pos = { x: 0, y: 0, z: 'v:corner_g_depth_a_mm' };
      n.pivot = { x: -1, y: -1, z: -1 };
      n.rot = { x: 0, y: 90, z: 0 };
      n.scale = { x: -1, y: 1, z: 1 };
      wingPatched++;
    }
    for (const c of n.children || []) walk(c);
  };
  const list = Array.isArray(roots) ? roots : [roots];
  for (const r of list) walk(r);

  return {
    ok: hostN > 0 && otherN > 0,
    hostN,
    otherN,
    wingPatched,
    sectionPatched,
    phase: 'both',
    armMm: arm,
    depthAMm: dA,
    depthBMm: dB,
    stubLen,
    stubPos: [0, 0, dA],
    stubSize: [stubLen, H, dB],
    pivot: [-1, -1, -1],
    rotY: 90,
    scaleX: -1,
  };
}

/**
 * Перенос админ-секции 600×600 в объём жёлтой Г:
 *   module +X = hostDir (плечо A), +Z = otherDir (плечо B), +Y = up.
 * Пивот = угол ячейки. Локальный разворот крыла из админки сохраняется.
 * scale±1 не трогаем. Матрицу ячейки не даём переписать updateMatrix().
 */
export function applyUpperGCellPoseToGroup(group, frame) {
  if (!group || !frame) return { ok: false, reason: 'no_args' };
  const THREE = _THREE();
  if (!THREE) return { ok: false, reason: 'no_three' };

  const hx = Number(frame.hostDir?.x) || 0;
  const hz = Number(frame.hostDir?.z) || 0;
  let ox = Number(frame.otherDir?.x);
  let oz = Number(frame.otherDir?.z);
  if (!Number.isFinite(ox) || !Number.isFinite(oz) || ox * ox + oz * oz < 1e-8) {
    ox = Number(frame.hostInto?.x) || 0;
    oz = Number(frame.hostInto?.z) || 0;
  }
  const cx = Number(frame.cornerX) || 0;
  const cy = Number(frame.floorY) || 0;
  const cz = Number(frame.cornerZ) || 0;

  const xAxis = new THREE.Vector3(hx, 0, hz);
  if (xAxis.lengthSq() < 1e-8) xAxis.set(1, 0, 0);
  else xAxis.normalize();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const zAxis = new THREE.Vector3(ox, 0, oz);
  if (zAxis.lengthSq() < 1e-8) zAxis.set(0, 0, 1);
  else zAxis.normalize();

  // Г-ячейка в плане: +u=host, +v=other — модуль должен занять тот же объём.
  const basis = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
  basis.setPosition(cx, cy, cz);

  const applyBasis = () => {
    group.matrixAutoUpdate = false;
    group.matrix.copy(basis);
    group.matrixWorldNeedsUpdate = true;
    group.position.set(cx, cy, cz);
    group.scale.set(1, 1, 1);
  };
  applyBasis();
  try {
    const zRh = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize();
    const rh = new THREE.Matrix4().makeBasis(
      xAxis,
      yAxis,
      zRh.lengthSq() > 1e-8 ? zRh : zAxis
    );
    group.quaternion.setFromRotationMatrix(rh);
    group.rotation.setFromQuaternion(group.quaternion, 'YXZ');
  } catch (_) {}
  applyBasis();

  try {
    if (group.__cldUpperGUpdateMatrixHooked !== true) {
      group.__cldUpperGUpdateMatrixHooked = true;
      const prevUpdate = group.updateMatrix.bind(group);
      group.updateMatrix = function lockedUpperGUpdateMatrix() {
        if (
          this.userData?.__kitchenUpperGMatrixLock &&
          this.userData?.__kitchenUpperGBasis
        ) {
          this.matrixAutoUpdate = false;
          this.matrix.fromArray(this.userData.__kitchenUpperGBasis);
          this.matrixWorldNeedsUpdate = true;
          return;
        }
        return prevUpdate();
      };
    }
  } catch (_) {}

  try {
    group.updateMatrixWorld(true);
  } catch (_) {}

  const ud = group.userData || (group.userData = {});
  ud.__kitchenUpperGSeated = true;
  ud.__kitchenSkipSectionScale = true;
  ud.__kitchenUpperGMatrixLock = true;
  ud.__kitchenUpperGPoseMode = UPPER_G_POSE_MODE;
  ud.__kitchenUpperGBasis = basis.toArray();
  ud.__kitchenUpperGFrame = {
    jointId: frame.jointId,
    cornerCellId: frame.cornerCellId,
    armMm: frame.armMm,
    depthAMm: frame.depthAMm,
    depthBMm: frame.depthBMm,
    heightMm: Math.round(Number(frame.heightMm) || 0) || null,
    floorY: Number(frame.floorY) || null,
    band: frame.band === 'top' ? 'top' : 'mid',
    atStart: frame.atStart === true,
    hostWall: frame.hostWall,
    otherWall: frame.otherWall,
    poseMode: UPPER_G_POSE_MODE,
  };
  if (ud.__kitchenUpperGFrame.heightMm > 0) {
    ud.customHeightMm = ud.__kitchenUpperGFrame.heightMm;
  }
  if (ud.__kitchenUpperGFrame.band) {
    ud.__kitchenUpperGBand = ud.__kitchenUpperGFrame.band;
  }

  try {
    console.warn('[UPPER-G-PLACE]', {
      build: __BUILD,
      mode: UPPER_G_POSE_MODE,
      jointId: frame.jointId,
      corner: [Math.round(cx), Math.round(cy), Math.round(cz)],
      host: frame.hostWall,
      other: frame.otherWall,
    });
  } catch (_) {}

  try {
    let mark = group.getObjectByName('UpperGModulePivot');
    if (!mark) {
      mark = new THREE.Mesh(
        new THREE.SphereGeometry(32, 12, 10),
        new THREE.MeshBasicMaterial({
          color: 0x22c55e,
          transparent: true,
          opacity: 0.98,
          depthTest: false,
          depthWrite: false,
        })
      );
      mark.name = 'UpperGModulePivot';
      mark.renderOrder = 1003;
      mark.userData.isUpperGModulePivot = true;
      mark.userData.__cldDbgPivotKind = 'upper_g_module';
      group.add(mark);
      const ax = new THREE.AxesHelper(140);
      ax.name = 'UpperGModulePivotAxes';
      ax.renderOrder = 1004;
      group.add(ax);
    }
    mark.position.set(0, 0, 0);
    const ax2 = group.getObjectByName('UpperGModulePivotAxes');
    if (ax2) ax2.position.set(0, 0, 0);
  } catch (_) {}

  return {
    ok: true,
    yaw: group.rotation.y,
    poseMode: UPPER_G_POSE_MODE,
    corner: { x: cx, y: cy, z: cz },
    basis: {
      x: [xAxis.x, xAxis.y, xAxis.z],
      y: [yAxis.x, yAxis.y, yAxis.z],
      z: [zAxis.x, zAxis.y, zAxis.z],
    },
  };
}

export function bindModuleToUpperGJoint(group, joint) {
  if (!group || !joint) return;
  const ud = group.userData || (group.userData = {});
  ud.__kitchenJointId = joint.jointId;
  ud.__kitchenJointKind = joint.kind;
  ud.__kitchenUpperCornerCellId = joint.upperCornerCellId;
  ud.__kitchenUpperCornerSeat = 'G';
  const band =
    ud.__kitchenUpperGBand === 'top' || ud.__kitchenWallBand === 'top'
      ? 'top'
      : 'mid';
  ud.__zoneSlotRole = band;
  try {
    delete ud.__kitchenCornerCellId;
  } catch (_) {}
  // mid и top живут в одной G-ячейке плана — uuid по ярусу, не затирать друг друга.
  if (band === 'top') {
    joint.upperModuleUuidTop = group.uuid || null;
  } else {
    joint.upperModuleUuid = group.uuid || null;
  }
  if (joint.upperCornerCell) {
    if (band === 'top') {
      joint.upperCornerCell.moduleUuidTop = group.uuid || null;
    } else {
      joint.upperCornerCell.moduleUuid = group.uuid || null;
    }
  }
}

function _readRootsCopy(ud) {
  let roots = readUserDataClodisRoots(ud);
  if (!roots) {
    const data = readUserDataClodisData(ud);
    if (data) roots = Array.isArray(data) ? data : [data];
  }
  if (!roots) return null;
  return JSON.parse(JSON.stringify(Array.isArray(roots) ? roots : [roots]));
}

function _writeRoots(ud, copy) {
  writeUserDataClodisRoots(ud, copy);
  writeUserDataClodisData(ud, Array.isArray(copy) ? copy[0] : copy);
}

function _rebuildUpperGGeometry(group, host, frame, opts = {}) {
  if (!host) return false;
  const fn =
    typeof window !== 'undefined'
      ? window.__cldRebuildFurnitureGroupForSectionResize
      : null;
  if (typeof fn !== 'function') return false;
  const kind = String(opts.kind || 'g_arms');
  const target = {
    x: frame.armMm,
    y: frame.heightMm || 720,
    // Г-обр: конверт arm×arm. Приставной: глубина корпуса = depthA (как НМУ/ВМУ).
    z: kind === 'return' ? frame.depthAMm || UPPER_G_DEPTH_MM : frame.armMm,
  };
  return !!fn(group, host, target, {
    force: true,
    upperGArms: kind === 'g_arms',
    skipCanonicalRestore: true,
  });
}

/**
 * G-поза: приставка у X=0. В карточке «правая» уголок сидит на x=-40
 * (стык при классическом правом place) → при origin=угол уходит в стену,
 * конфирматы оголяются. Для G-позы нужен уголок на стыке (s:x) — как у левой
 * catalog_55. Карточку ВМУ1 правый не меняем; только embed приставки.
 * Г-обр (g_arms) сюда не заходит.
 */
function _repointRightReturnEmbedForGPose(ud) {
  const roots = readUserDataClodisRoots(ud);
  if (!roots) return false;
  let changed = false;
  const walk = (n) => {
    if (!n || typeof n !== 'object') return;
    const lr = String(n.layout_role || n.layoutRole || '');
    const et = String(n.spec?.element_type || n.spec?.elementType || '')
      .trim()
      .toLowerCase();
    const nm = String(n.name || '');
    const isReturn =
      lr === 'corner_return' ||
      et === 'catalog_55' ||
      /приставка\s*верхн/i.test(nm);
    if (isReturn) {
      const id = String(n.spec?.id ?? n.spec?.catalog_id ?? '').trim();
      const isRight = /прав/i.test(nm) || id === '2';
      if (isRight) {
        n.spec = n.spec && typeof n.spec === 'object' ? { ...n.spec } : {};
        n.spec.id = 1;
        if (/правая/i.test(nm)) n.name = nm.replace(/правая/gi, 'левая');
        else if (/правый/i.test(nm)) n.name = nm.replace(/правый/gi, 'левый');
        // Сбросить кэш дерева — builder подтянет левую catalog_55.
        try {
          delete n.spec.template_tree;
        } catch (_) {}
        try {
          delete n.children;
        } catch (_) {}
        changed = true;
      }
    }
    for (const c of n.children || []) walk(c);
    for (const c of n.spec?.template_tree || []) walk(c);
  };
  const list = Array.isArray(roots) ? roots : [roots];
  for (const r of list) walk(r);
  if (changed) {
    writeUserDataClodisRoots(ud, roots);
    try {
      writeUserDataClodisData(ud, Array.isArray(roots) ? roots[0] : roots);
    } catch (_) {}
  }
  return changed;
}

/**
 * Приставной угловой в G: corner_return_* как НМУ, W=arm.
 * G-поза: origin = угол, +X вдоль host. Локально return_pos у 0.
 * Правый/левый мир — матрица frame. Уголок правого embed → левый (s:x).
 */
function _stampAndRebuildUpperGReturnCorner(group, frame, host, opts = {}) {
  const ud = group.userData || (group.userData = {});
  const doGeom = opts.rebuildGeometry !== false;
  const arm = Math.round(Number(frame.armMm) || UPPER_G_ARM_MM);
  const dA = Math.round(Number(frame.depthAMm) || UPPER_G_DEPTH_MM);
  const worldAtStart = frame.atStart === true;
  const localAtStart = true;
  let rebuilt = false;

  try {
    const cornerVars = buildKitchenCornerReturnVars(arm, localAtStart, dA, 0, 0);
    const prev =
      readUserDataClodisVariables(ud) &&
      typeof readUserDataClodisVariables(ud) === 'object'
        ? readUserDataClodisVariables(ud)
        : {};
    writeUserDataClodisVariables(ud, {
      ...prev,
      ...cornerVars,
      h_bottom: 0,
      corner_at_start: worldAtStart ? 1 : 0,
      corner_g_pose_local_at_start: 1,
    });
    ud.__kitchenCellWidthMm = arm;
    ud.customWidthMm = arm;
    ud.__kitchenCarcassDepthMm = dA;
    ud.customDepthMm = dA;
    ud.__kitchenCornerReturnMm = dA;
    ud.__kitchenSideWallClearanceMm = 0;
    ud.__kitchenUpperGKind = 'return';
    ud.__kitchenUpperGReturnLocalAtStart = true;
    ud.__kitchenUpperGWorldAtStart = worldAtStart;
    // Мир/зона — worldAtStart; локальный уголок чинит repoint embed.
    ud.__kitchenCornerSideAtMinU = worldAtStart;
    // Правый embed (−40) → левый (s:x) до и после rebuild (builder тянет по spec.id).
    if (!worldAtStart) {
      _repointRightReturnEmbedForGPose(ud);
    }
    if (doGeom) {
      rebuilt = _rebuildUpperGGeometry(group, host, frame, { kind: 'return' });
      if (!worldAtStart) {
        _repointRightReturnEmbedForGPose(ud);
        _forceUgolokAtJointForGPose(ud);
        // Второй rebuild только если дерево уголка поправили после первого.
        if (ud.__kitchenUpperGUgolokForced === true) {
          rebuilt =
            _rebuildUpperGGeometry(group, host, frame, { kind: 'return' }) ||
            rebuilt;
          ud.__kitchenUpperGUgolokForced = false;
        }
      }
    }
  } catch (e) {
    console.warn('[UPPER-G-PLACE] return-corner stamp', e);
    return { ok: false, rebuilt, reason: 'return_stamp_fail' };
  }
  return { ok: true, rebuilt, kind: 'return', armMm: arm, depthAMm: dA };
}

/**
 * Запасной патч: если embed всё ещё с уголком x=-40 — на стык s:x.
 * Только return/G-pose; g_arms не вызывает.
 */
function _forceUgolokAtJointForGPose(ud) {
  const roots = readUserDataClodisRoots(ud);
  if (!roots) return false;
  let changed = false;
  const walk = (n) => {
    if (!n || typeof n !== 'object') return;
    if (/уголок/i.test(String(n.name || ''))) {
      n.pos = n.pos && typeof n.pos === 'object' ? { ...n.pos } : {};
      const cur = n.pos.x;
      const isNeg40 =
        cur === -40 ||
        cur === '-40' ||
        String(cur || '').replace(/\s/g, '') === '-40';
      if (isNeg40 || cur !== 's:x') {
        n.pos.x = 's:x';
        changed = true;
      }
      // Правый L-уголок: вторая деталь была s:x-16 — как у левого.
      for (const ch of n.children || []) {
        if (!ch || typeof ch !== 'object') continue;
        if (!/детал/i.test(String(ch.name || ''))) continue;
        const px = String(ch.pos?.x ?? '').replace(/\s/g, '');
        if (px === 's:x-16') {
          ch.pos = { ...(ch.pos || {}), x: 0, z: 16 };
          changed = true;
        }
      }
    }
    for (const c of n.children || []) walk(c);
    for (const c of n.spec?.template_tree || []) walk(c);
    for (const c of n.template?.tree || []) walk(c);
  };
  const list = Array.isArray(roots) ? roots : [roots];
  for (const r of list) walk(r);
  if (changed) {
    ud.__kitchenUpperGUgolokForced = true;
    writeUserDataClodisRoots(ud, roots);
    try {
      writeUserDataClodisData(ud, Array.isArray(roots) ? roots[0] : roots);
    } catch (_) {}
  }
  return changed;
}

/** Один проход: vars (как НМУ) + формулы в дереве + один rebuild. */
function _stampAndRebuildUpperGArms(group, frame, host, opts = {}) {
  const ud = group.userData || (group.userData = {});
  const doGeom = opts.rebuildGeometry !== false;
  let armApply = null;
  let rebuilt = false;

  try {
    const gVars = buildUpperGReturnVars(
      frame.armMm,
      frame.depthAMm,
      frame.depthBMm
    );
    const prev =
      readUserDataClodisVariables(ud) &&
      typeof readUserDataClodisVariables(ud) === 'object'
        ? readUserDataClodisVariables(ud)
        : {};
    writeUserDataClodisVariables(ud, { ...prev, ...gVars });

    // Размеры/vars + TRS крыла (rotY=90, scale.x=-1, pos.z=depthA).
    const copy = _readRootsCopy(ud);
    armApply = copy
      ? applyUpperGArmSizesToRoots(copy, frame, { phase: 'both' })
      : { ok: false, reason: 'no_roots' };
    if (copy) _writeRoots(ud, copy);

    ud.__kitchenCellWidthMm = frame.armMm;
    ud.customWidthMm = frame.armMm;
    ud.__kitchenCarcassDepthMm = frame.armMm;
    ud.customDepthMm = frame.armMm;
    ud.__kitchenUpperGArmMm = frame.armMm;
    ud.__kitchenUpperGDepthAMm = frame.depthAMm;
    ud.__kitchenUpperGDepthBMm = frame.depthBMm;
    ud.__kitchenUpperGStubMm = gVars.corner_g_stub_mm;
    // Чтобы restore/rebuild не сжал конверт до depth ниши (350).
    const envH = Math.round(Number(frame.heightMm) || 720);
    const env = {
      x: frame.armMm,
      y: envH,
      z: frame.armMm,
    };
    ud.__targetSectionSizeMm = { ...env };
    ud.__initialSectionSizeMm = { ...env };
    ud.customHeightMm = envH;
    if (frame.band === 'top' || frame.band === 'mid') {
      ud.__kitchenUpperGBand = frame.band;
    }

    if (doGeom) rebuilt = _rebuildUpperGGeometry(group, host, frame) || rebuilt;
  } catch (e) {
    console.warn('[UPPER-G-PLACE] arm stamp vars', e);
    return { armApply, rebuilt, reason: 'stamp_fail' };
  }
  return { armApply, rebuilt };
}

/**
 * Полная посадка в Г-ячейку Joint.
 * Г-обр → stamp рукавов; приставной (corner_return) → vars как НМУ на W=arm.
 */
export function placeModuleIntoUpperGCell(group, joint, opts = {}) {
  if (!group || !joint) return { ok: false, reason: 'no_args' };
  // Только угол/Г. Обычный НШ1/НШ2 сюда не сажаем (иначе «переезд в секцию Г»).
  const isGMod =
    opts.forceGArms === true ||
    opts.kind === 'g_arms' ||
    isKitchenUpperGModuleGroup(group) ||
    (opts.furnitureData
      ? isKitchenUpperGModuleData(opts.furnitureData)
      : false);
  if (
    !isGMod &&
    !isKitchenWallCornerGroup(group) &&
    opts.force !== true
  ) {
    const pk = String(group.userData?.__placementKindProfileId || '').trim();
    if (pk && pk !== 'kitchen_wall_corner') {
      return { ok: false, reason: 'not_wall_corner' };
    }
  }

  const band = resolveUpperGBandFromContext(
    opts.furnitureData,
    opts.pendingZone || opts.zoneInfo,
    group
  );
  const bandFinal =
    opts.band === 'top' || opts.upperGBand === 'top' || band === 'top'
      ? 'top'
      : opts.band === 'mid' || opts.upperGBand === 'mid' || band === 'mid'
        ? 'mid'
        : 'mid';

  reseatUpperGCellArmDepths(joint);
  const frame = resolveUpperGCellWorldFrame(joint, { band: bandFinal });
  if (!frame) return { ok: false, reason: 'no_frame' };

  const host = getJointUpperHostSection(joint);
  const rebuildArms = opts.rebuildArms !== false;
  let armApply = null;
  let rebuilt = false;
  const ud = group.userData || (group.userData = {});

  // Свежее дерево из карточки админки (600×600 + разворот крыла) → в ud.
  try {
    const src = opts.furnitureData?.catalogItem || opts.furnitureData || null;
    let rootsAdmin = null;
    if (src) {
      const built = getClodisDataForBuild({ catalogItem: src });
      if (Array.isArray(built) && built.length) rootsAdmin = built;
    }
    if (!rootsAdmin) {
      rootsAdmin =
        (Array.isArray(src?.clodisJSON) && src.clodisJSON) ||
        (Array.isArray(src?.data?.clodisJSON) && src.data.clodisJSON) ||
        null;
    }
    if (Array.isArray(rootsAdmin) && rootsAdmin.length) {
      _writeRoots(ud, JSON.parse(JSON.stringify(rootsAdmin)));
    }
  } catch (ePull) {
    console.warn('[UPPER-G-PLACE] admin tree pull failed', ePull);
  }

  let rootsForKind = null;
  try {
    rootsForKind =
      readUserDataClodisRoots(ud) || readUserDataClodisData(ud) || null;
  } catch (_) {
    rootsForKind = null;
  }
  const isGArms =
    opts.forceGArms === true ||
    opts.kind === 'g_arms' ||
    isKitchenUpperGModuleGroup(group) ||
    _treeHasUpperGArmSignal(rootsForKind) ||
    (opts.furnitureData
      ? isKitchenUpperGModuleData(opts.furnitureData)
      : false);
  const kind = isGArms ? 'g_arms' : 'return';

  if (rebuildArms) {
    if (isGArms) {
      const r = _stampAndRebuildUpperGArms(group, frame, host, opts);
      armApply = r.armApply;
      rebuilt = !!r.rebuilt;
    } else {
      const r = _stampAndRebuildUpperGReturnCorner(group, frame, host, opts);
      armApply = r;
      rebuilt = !!r.rebuilt;
    }
  } else {
    ud.__kitchenCellWidthMm = frame.armMm;
    ud.customWidthMm = frame.armMm;
    ud.__kitchenCarcassDepthMm = isGArms ? frame.armMm : frame.depthAMm;
    ud.customDepthMm = ud.__kitchenCarcassDepthMm;
    ud.__kitchenUpperGDepthAMm = frame.depthAMm;
    ud.__kitchenUpperGDepthBMm = frame.depthBMm;
    ud.__kitchenUpperGKind = kind;
  }

  ud.__kitchenUpperGKind = kind;
  ud.__kitchenUpperGBand = bandFinal;
  if (bandFinal === 'top') {
    ud.productKind = 'kitchen_wall_top';
    ud.__placementKindProfileId = 'kitchen_wall_top';
    ud.__kitchenProfileId = 'kitchen_wall_top';
    ud.__kitchenWallBand = 'top';
  } else {
    ud.__kitchenWallBand = 'mid';
    if (!ud.__placementKindProfileId || ud.__placementKindProfileId === 'kitchen_wall_top') {
      ud.__placementKindProfileId = 'kitchen_wall_corner';
    }
  }
  bindModuleToUpperGJoint(group, joint);
  // Приставной = seat A; Г-обр = seat G (bind по умолчанию ставил G всем).
  ud.__kitchenUpperCornerSeat = kind === 'g_arms' ? 'G' : 'A';
  if (host) {
    ud.sectionId = host.id;
    // MID/TOP special, НЕ division.parts−1 низа: иначе zi Г = 7 совпадает
    // с mid-соседом 600 и same-role блокирует НШ1 «слева от угла».
    // atStart — от hostCornerHostAtStart секции, не от frame (frame может врать).
    const bandParts = Math.max(
      0,
      Math.floor(Number(host.kitchenBandGrids?.[bandFinal]?.parts) || 0)
    );
    const bandSp = Math.floor(
      Number(host.kitchenBandGrids?.[bandFinal]?.specialZoneIndex)
    );
    const hostAtStart = host.division?.kitchenCornerHostAtStart === true;
    if (Number.isFinite(bandSp) && bandSp >= 0) {
      ud.zoneIndex = bandSp;
    } else if (bandParts > 0) {
      ud.zoneIndex = hostAtStart ? 0 : bandParts - 1;
    } else {
      const parts = Math.max(1, Math.floor(Number(host.division?.parts) || 1));
      ud.zoneIndex = hostAtStart ? 0 : parts - 1;
    }
  }

  const posed = applyUpperGCellPoseToGroup(group, frame);

  // После pose — один проход крепежа по финальным world-матрицам (в т.ч. scale.x=-1 крыла).
  try {
    group.updateMatrixWorld?.(true);
    if (typeof window.__cldApplyJointFittingHoles === 'function') {
      window.__cldApplyJointFittingHoles(group);
    }
    if (typeof window.__cldRepositionJointSchemeFurniture === 'function') {
      window.__cldRepositionJointSchemeFurniture(group);
    }
  } catch (eJoint) {
    console.warn('[UPPER-G-PLACE] joint holes refresh', eJoint);
  }

  // Rebuild геометрии сбрасывает меши — вернуть step5 / икеевский декор.
  try {
    if (typeof window.__cldApplyStep5DecorToFurnitureGroupImmediate === 'function') {
      window.__cldApplyStep5DecorToFurnitureGroupImmediate(group);
    } else if (typeof window.refreshFurnitureDecorsImmediate === 'function') {
      window.refreshFurnitureDecorsImmediate({ root: group, placementPreview: true });
    }
  } catch (eDecor) {
    console.warn('[UPPER-G-PLACE] step5 decor refresh', eDecor);
  }

  try {
    if (typeof window.__cldSyncUpperGCellMeshes === 'function') {
      window.__cldSyncUpperGCellMeshes();
    }
  } catch (_) {}

  console.warn('[UPPER-G-PLACE] seated', {
    build: __BUILD,
    kind,
    band: bandFinal,
    jointId: joint.jointId,
    cornerCellId: joint.upperCornerCellId,
    armMm: frame.armMm,
    depthAMm: frame.depthAMm,
    depthBMm: frame.depthBMm,
    floorY: frame.floorY,
    heightMm: frame.heightMm,
    atStart: frame.atStart === true,
    armApply,
    rebuilt,
    posed,
  });

  return {
    ok: !!(posed && posed.ok),
    kind,
    band: bandFinal,
    jointId: joint.jointId,
    cornerCellId: joint.upperCornerCellId,
    frame,
    armApply,
    rebuilt,
    posed,
  };
}

/** После смены depthA/depthB ячейки — пересобрать уже стоящий Г-модуль. */
export function syncPlacedUpperGModulesToJoints(opts = {}) {
  const THREE = _THREE();
  if (!THREE || !state.scene) return { n: 0 };
  const rebuildArms = opts.rebuildArms !== false && opts.poseOnly !== true;
  const groups = [];
  state.scene.traverse((o) => {
    if (!o?.userData) return;
    if (
      isKitchenUpperGModuleGroup(o) ||
      o.userData.__kitchenUpperGSeated === true ||
      String(o.userData.__kitchenUpperCornerSeat || '').toUpperCase() === 'G'
    ) {
      groups.push(o);
    }
  });
  let n = 0;
  for (const g of groups) {
    const ud = g.userData || {};
    const jid = ud.__kitchenJointId;
    let joint =
      jid && typeof window.__cldGetKitchenJoint === 'function'
        ? window.__cldGetKitchenJoint(jid)
        : null;
    if (!joint) {
      const sid = ud.sectionId;
      const sec = (state.customSections || []).find(
        (s) => s && String(s.id) === String(sid)
      );
      joint = sec ? findUpperGJointForSection(sec) : null;
    }
    if (!joint?.upperCornerCell) continue;
    const band = resolveUpperGBandFromContext(null, null, g);
    const r = placeModuleIntoUpperGCell(g, joint, {
      force: true,
      forceGArms: true,
      rebuildArms,
      rebuildGeometry: rebuildArms,
      band,
      upperGBand: band,
    });
    if (r?.ok) n++;
  }
  return { n, build: __BUILD, rebuildArms };
}

/** Ghost/place: snap к Г по hit-секции. opts.band = mid|top. */
export function resolveUpperGGhostTarget(hitSection, opts = {}) {
  if (!hitSection?.lShape) return null;
  try {
    if (typeof window.__cldEnsureAllCornerCells === 'function') {
      window.__cldEnsureAllCornerCells();
    }
  } catch (_) {}
  let joint = findUpperGJointForSection(hitSection);
  if (!joint?.upperCornerCell) return null;
  reseatUpperGCellArmDepths(joint);
  const zoneBag = {
    ...(opts.pendingZone || {}),
  };
  if (opts.hitY != null && zoneBag.hitY == null) zoneBag.hitY = opts.hitY;
  if (opts.band) zoneBag.upperGBand = opts.band;
  if (opts.upperGBand) zoneBag.upperGBand = opts.upperGBand;
  const band = resolveUpperGBandFromContext(
    opts.furnitureData ||
      (typeof window !== 'undefined'
        ? window.__cldState?.pendingFurnitureData
        : null),
    zoneBag,
    opts.group
  );
  const bandFinal =
    opts.band === 'top' || opts.upperGBand === 'top' || band === 'top'
      ? 'top'
      : 'mid';
  const frame = resolveUpperGCellWorldFrame(joint, { band: bandFinal });
  if (!frame) return null;
  const host = getJointUpperHostSection(joint) || hitSection;
  const bandParts = Math.max(
    0,
    Math.floor(Number(host?.kitchenBandGrids?.[bandFinal]?.parts) || 0)
  );
  const bandSp = Math.floor(
    Number(host?.kitchenBandGrids?.[bandFinal]?.specialZoneIndex)
  );
  let zi;
  if (Number.isFinite(bandSp) && bandSp >= 0) {
    zi = bandSp;
  } else if (bandParts > 0) {
    zi = frame.atStart === true ? 0 : bandParts - 1;
  } else {
    const parts = Math.max(1, Math.floor(Number(host?.division?.parts) || 1));
    zi = frame.atStart === true ? 0 : Math.max(0, parts - 1);
  }
  const wallName = host.wallName || 'back';
  const alongX = wallName === 'back' || wallName === 'front';
  const pivotCoord = alongX ? frame.cornerX : frame.cornerZ;
  return {
    section: host,
    wallName,
    specialZi: zi,
    upperGCell: true,
    upperGBand: bandFinal,
    jointId: joint.jointId,
    cornerCellId: joint.upperCornerCellId,
    frame,
    worldPos: {
      x: frame.cornerX,
      y: frame.floorY,
      z: frame.cornerZ,
    },
    snap: {
      pivotCoord,
      zoneIndex: zi,
      moduleWidth: frame.armMm,
    },
    wallCorner: true,
  };
}

/**
 * Дамп после place: live-корни, bbox/scale/pos vs G-frame.
 * Консоль: __cldDumpUpperGPlace()
 */
function _dumpAppState() {
  if (typeof window === 'undefined') return state || null;
  return (
    window.state ||
    window.__CLD_STATE_SINGLETON__ ||
    window.__cldAppState ||
    window.appState ||
    state ||
    null
  );
}

function _mm3(v, alreadyMm) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.round(alreadyMm ? n : n * 1000);
}

export function dumpUpperGPlace(label = '') {
  const THREE = _THREE();
  const out = {
    build: __BUILD,
    label: String(label || ''),
    cardCanon: {
      corpus: {
        size: ['s:x', 's:y', 'v:corner_g_depth_a_mm'],
        pos: [0, 0, 0],
        pivot: [-1, -1, -1],
      },
      stub: {
        // Live-крыло: rotY=90, scale.x=-1, pos.z=depthA — фасад в комнату, торец справа.
        size: ['v:corner_g_stub_mm', 's:y', 'v:corner_g_depth_b_mm'],
        pos: [0, 0, 'v:corner_g_depth_a_mm'],
        pivot: [-1, -1, -1],
        rotY: 90,
        scaleX: -1,
        lr: 'corner_g_return',
      },
      envelope: [600, 720, 600],
      sectionPivot: [-1, -1, -1],
      stubFormula: 'stub = arm - depthA',
    },
    joints: [],
    items: [],
  };

  try {
    const list =
      typeof window !== 'undefined' && typeof window.__cldListKitchenJoints === 'function'
        ? window.__cldListKitchenJoints() || []
        : listKitchenJoints() || [];
    for (const j of list) {
      if (!j?.upperCornerCell) continue;
      try {
        reseatUpperGCellArmDepths(j);
      } catch (_) {}
      const frame = resolveUpperGCellWorldFrame(j);
      out.joints.push({
        jointId: j.jointId,
        upperCornerCellId: j.upperCornerCellId,
        upperModuleUuid: j.upperModuleUuid || null,
        frame: frame
          ? {
              corner: [frame.cornerX, frame.floorY, frame.cornerZ],
              armMm: frame.armMm,
              depthAMm: frame.depthAMm,
              depthBMm: frame.depthBMm,
              hostWall: frame.hostWall,
              otherWall: frame.otherWall,
              hostDir: frame.hostDir,
              otherDir: frame.otherDir,
              atStart: frame.atStart === true,
            }
          : null,
      });
    }
  } catch (e) {
    out.jointsError = String(e?.message || e);
  }

  const groups = [];
  try {
    const st = _dumpAppState();
    const seen = new Set();
    const pushG = (g) => {
      if (!g || seen.has(g)) return;
      seen.add(g);
      groups.push(g);
    };
    for (const j of out.joints) {
      const uid = j?.upperModuleUuid;
      if (!uid || !st?.scene) continue;
      st.scene.traverse((o) => {
        if (o && o.uuid === uid) pushG(o);
      });
    }
    const arr = st?.furnitureItems || st?.furniture?.items || [];
    if (Array.isArray(arr)) {
      for (const it of arr) {
        const g = it?.group || it;
        if (g?.isObject3D || g?.position) pushG(g);
      }
    }
    if (st?.furniture?.group) pushG(st.furniture.group);
    const scene = st?.scene || (typeof window !== 'undefined' ? window.__cldRoomScene : null);
    if (scene) {
      scene.traverse((o) => {
        if (o?.userData && isKitchenUpperGModuleGroup(o)) pushG(o);
      });
    }
  } catch (_) {}

  for (const group of groups) {
    if (!group?.userData) continue;
    const ud = group.userData;
    const isG = isKitchenUpperGModuleGroup(group);
    if (!isG && ud.__kitchenUpperCornerSeat !== 'G') continue;

    const lives = [];
    try {
      const roots = readUserDataClodisRoots(ud);
      const walk = (n, path) => {
        if (!n || typeof n !== 'object') return;
        const live =
          n.spec?.live_catalog === true ||
          n.spec?.live_catalog === 1 ||
          !!n.spec?.element_type;
        const armish =
          /корпус|приставка/i.test(String(n.name || '')) ||
          String(n.layout_role || '') === 'corner_g_return';
        if ((live || armish) && String(n.type || '') === 'module') {
          lives.push({
            path,
            name: n.name,
            et: n.spec?.element_type || null,
            eid: n.spec?.id ?? null,
            live: !!(n.spec?.live_catalog),
            lr: n.layout_role || null,
            size: n.size || null,
            pos: n.pos || null,
            rot: n.rot || null,
            childN: Array.isArray(n.children) ? n.children.length : 0,
            hasTpl: Array.isArray(n.spec?.template_tree)
              ? n.spec.template_tree.length
              : 0,
          });
        }
        const kids = Array.isArray(n.children) ? n.children : [];
        for (let i = 0; i < kids.length; i++) {
          walk(kids[i], `${path}/${kids[i]?.name || i}`);
        }
      };
      const list = Array.isArray(roots) ? roots : roots ? [roots] : [];
      for (const r of list) walk(r, r?.name || 'root');
    } catch (e) {
      lives.push({ error: String(e?.message || e) });
    }

    let bbox = null;
    // Сцена в мм (ROOM_WIDTH=5000); не множить на 1000.
    const alreadyMm =
      Math.abs(Number(group.position?.x) || 0) > 50 ||
      Math.abs(Number(group.position?.z) || 0) > 50;
    try {
      if (THREE) {
        group.updateMatrixWorld?.(true);
        const box = new THREE.Box3().setFromObject(group);
        if (!box.isEmpty()) {
          bbox = {
            size: [
              _mm3(box.max.x - box.min.x, alreadyMm),
              _mm3(box.max.y - box.min.y, alreadyMm),
              _mm3(box.max.z - box.min.z, alreadyMm),
            ],
            min: [
              _mm3(box.min.x, alreadyMm),
              _mm3(box.min.y, alreadyMm),
              _mm3(box.min.z, alreadyMm),
            ],
            max: [
              _mm3(box.max.x, alreadyMm),
              _mm3(box.max.y, alreadyMm),
              _mm3(box.max.z, alreadyMm),
            ],
          };
        }
      }
    } catch (_) {}

    const pos = group.position;
    const scl = group.scale;
    out.items.push({
      uuid: group.uuid,
      name: ud.catalogName || ud.name || group.name || null,
      catalogType: ud.catalogType || null,
      catalogItemId: ud.catalogItemId ?? null,
      seated: ud.__kitchenUpperGSeated === true,
      seat: ud.__kitchenUpperCornerSeat || null,
      skipScale: ud.__kitchenSkipSectionScale === true,
      frameMeta: ud.__kitchenUpperGFrame || null,
      positionMm: pos
        ? [
            _mm3(pos.x, alreadyMm),
            _mm3(pos.y, alreadyMm),
            _mm3(pos.z, alreadyMm),
          ]
        : null,
      scale: scl ? [scl.x, scl.y, scl.z] : null,
      rotationY: group.rotation?.y ?? null,
      lives,
      liveCount: lives.filter((l) => l.et || l.live || l.lr).length,
      bboxMm: bbox,
      branchGuess: (() => {
        const nLive = lives.filter(
          (l) => l.et === 'catalog_49' || l.live || l.lr === 'corner_g_return' || /приставка/i.test(String(l.name || ''))
        ).length;
        const bz = bbox?.size?.[2];
        const bx = bbox?.size?.[0];
        if (nLive < 2) return 'missing_wing_build';
        if (bx >= 550 && bz >= 550) return 'build_ok_check_pose_if_visual_wrong';
        if (bz && bz < 450) return 'wrong_seat_or_collapsed_stub';
        return 'inspect';
      })(),
    });
  }

  out.n = out.items.length;
  out.summary =
    out.n === 0
      ? 'no_placed_g — поставь «Угловой Г обр» в G и вызови снова'
      : out.items.map((it) => it.branchGuess).join('; ');

  try {
    console.warn('[UPPER-G-DUMP]', out);
  } catch (_) {}
  if (typeof window !== 'undefined') {
    window.__cldLastUpperGDump = out;
  }
  return out;
}

if (typeof window !== 'undefined') {
  window.__cldPlaceModuleIntoUpperGCell = placeModuleIntoUpperGCell;
  window.__cldResolveUpperGGhostTarget = resolveUpperGGhostTarget;
  window.__cldApplyUpperGArmSizesToRoots = applyUpperGArmSizesToRoots;
  window.__cldBuildUpperGReturnVars = buildUpperGReturnVars;
  window.__cldApplyUpperGCellPoseToGroup = applyUpperGCellPoseToGroup;
  window.__cldUpperGPoseMode = UPPER_G_POSE_MODE;
  window.__cldFindUpperGJointForSection = findUpperGJointForSection;
  window.__cldReseatUpperGCellArmDepths = reseatUpperGCellArmDepths;
  window.__cldSyncPlacedUpperGModulesToJoints = syncPlacedUpperGModulesToJoints;
  window.__cldIsKitchenUpperGModuleData = isKitchenUpperGModuleData;
  window.__cldIsKitchenUpperGModuleGroup = isKitchenUpperGModuleGroup;
  window.__cldResolveUpperGBandFromContext = resolveUpperGBandFromContext;
  window.__cldDumpUpperGPlace = dumpUpperGPlace;
  window.__cldRepointRightReturnEmbedForGPose = _repointRightReturnEmbedForGPose;
  window.__cldForceUgolokAtJointForGPose = _forceUgolokAtJointForGPose;
  window.__cldUpperGPlaceBuild = __BUILD;
}
