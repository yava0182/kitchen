/**
 * Единый канон угла L и П (один алгоритм).
 *
 * L = 1 Joint. П = 2 Joint (left/right), каждый как одна L.
 * Разворот = flip hostSide одного Joint; другие Joint не трогаем.
 * Глобально вместе — только настройки кухни (D и т.п.), не углы.
 *
 * Joint / CornerCell — правда угла. Секция — стена + обычные ячейки + резерв.
 * Special/host-map — не канон (не выставляем kitchenCornerHostHand).
 */
import { state } from '../utils/state.js';

function _normWall(name) {
  const w = String(name || '').trim().toLowerCase();
  return w === 'front' || w === 'back' || w === 'left' || w === 'right' ? w : null;
}

function _jointsMap() {
  if (!state.kitchenJoints || typeof state.kitchenJoints !== 'object') {
    state.kitchenJoints = Object.create(null);
  }
  return state.kitchenJoints;
}

function _stableId(parts) {
  return parts.filter((p) => p != null && p !== '').map(String).join('|');
}

function _secById(id) {
  if (id == null || !Array.isArray(state.customSections)) return null;
  return state.customSections.find((s) => s && String(s.id) === String(id)) || null;
}

/**
 * @typedef {object} KitchenCornerCell
 * @property {string} cornerCellId
 * @property {string} hostWall
 * @property {string} otherWall
 * @property {boolean} atStart — приставка к стыку (левый=true / правый=false)
 * @property {number} widthMm — габарит ячейки вдоль host (= шкаф), канон 1050
 * @property {number} depthMm — глубина ячейки в комнату
 * @property {number} clearMm
 * @property {number} returnMm
 */

/**
 * @typedef {object} KitchenJoint
 * @property {string} jointId
 * @property {string} cornerCellId
 * @property {KitchenCornerCell|null} cornerCell
 * @property {'L'|'U'} kind
 * @property {'left'|'right'|null} hand
 * @property {string} sectionAId
 * @property {string} sectionBId
 * @property {string} wallA
 * @property {string} wallB
 * @property {'A'|'B'} hostSide
 * @property {string} hostSectionId
 * @property {string|null} moduleUuid — низ (НМУ)
 * @property {string} upperCornerCellId
 * @property {object|null} upperCornerCell — верхний слой (W=600)
 * @property {'A'|'B'} upperHostSide
 * @property {string} upperHostSectionId
 * @property {string|null} upperModuleUuid — верх (ВМУ), позже
 */

/** Канон W угловой ячейки/шкафа (нога+приставка). Не equal-grid. */
export const KITCHEN_CORNER_CELL_WIDTH_MM = 1050;
/** Верхний слой пирога (приставной ВМУ): своя ячейка, не 1050 низа. */
export const KITCHEN_UPPER_CORNER_CELL_WIDTH_MM = 600;
/** Fallback глубины навеса, если профиль ещё не готов. */
export const KITCHEN_UPPER_CORNER_CELL_DEPTH_MM = 350;
/**
 * Уголок/вставка между глубиной ВМУ и посадочной зоной НШ1 в угле 600×600.
 * НШ1 старт вдоль чужого плеча: depth + POST (=390 при D=350); seat = 600 − inset (=210).
 */
export const KITCHEN_UPPER_CORNER_POST_MM = 40;

/**
 * Глубина верхней угловой ячейки = глубина навеса из «Управление кухней».
 * Под 600×600; при 300 → плечо 300 (не зашито 350). Низ не трогает.
 */
export function resolveKitchenUpperCornerDepthMm() {
  try {
    const api =
      typeof window !== 'undefined' ? window.__cldKitchenManufacturing : null;
    if (api && typeof api.getProfile === 'function') {
      const p = api.getProfile();
      const wd = Math.round(Number(p?.wall?.carcassDepthMm?.value) || 0);
      if (wd >= 200 && wd <= 700) return wd;
    }
  } catch (_) {}
  return KITCHEN_UPPER_CORNER_CELL_DEPTH_MM;
}

export function ensureKitchenJoint({
  kind,
  hand = null,
  sectionA,
  sectionB,
  preferHostId = null,
}) {
  if (!sectionA?.id || !sectionB?.id) return null;
  const wallA = _normWall(sectionA.wallName);
  const wallB = _normWall(sectionB.wallName);
  if (!wallA || !wallB || wallA === wallB) return null;

  const idKind = kind === 'U' ? 'U' : 'L';
  const handKey = idKind === 'U' && (hand === 'left' || hand === 'right') ? hand : 'pair';
  const jointId = _stableId(['kj', idKind, handKey, sectionA.id, sectionB.id]);
  const map = _jointsMap();
  let j = map[jointId];
  if (!j) {
    const prefer =
      preferHostId != null &&
      (String(preferHostId) === String(sectionA.id) ||
        String(preferHostId) === String(sectionB.id))
        ? String(preferHostId)
        : String(sectionA.id);
    const hostSide = prefer === String(sectionA.id) ? 'A' : 'B';
    j = {
      jointId,
      cornerCellId: _stableId(['cc', jointId]),
      cornerCell: null,
      // Верхний слой пирога: свой host, не делит flip с низом.
      upperCornerCellId: _stableId(['ucc', jointId]),
      upperCornerCell: null,
      upperHostSide: hostSide,
      upperHostSectionId: prefer,
      kind: idKind,
      hand: idKind === 'U' ? handKey : null,
      sectionAId: String(sectionA.id),
      sectionBId: String(sectionB.id),
      wallA,
      wallB,
      hostSide,
      hostSectionId: prefer,
      moduleUuid: null,
      upperModuleUuid: null,
    };
    map[jointId] = j;
  } else {
    j.wallA = wallA;
    j.wallB = wallB;
    j.sectionAId = String(sectionA.id);
    j.sectionBId = String(sectionB.id);
    if (!j.cornerCellId) j.cornerCellId = _stableId(['cc', j.jointId]);
    if (!j.upperCornerCellId) j.upperCornerCellId = _stableId(['ucc', j.jointId]);
    if (j.upperModuleUuid === undefined) j.upperModuleUuid = null;
    if (j.upperHostSide !== 'A' && j.upperHostSide !== 'B') {
      j.upperHostSide = j.hostSide === 'B' ? 'B' : 'A';
      j.upperHostSectionId =
        j.upperHostSide === 'A' ? String(j.sectionAId) : String(j.sectionBId);
    }
  }
  return j;
}

/**
 * Ячейка угла = коробочка под шкаф. Разворот = та же ячейка на новый host, W не меняется.
 * @param {KitchenJoint} joint
 * @param {{ widthMm?: number, depthMm?: number, atStart?: boolean, clearMm?: number, returnMm?: number }} [opts]
 */
export function recomputeJointCornerCell(joint, opts = {}) {
  if (!joint) return null;
  const host = getJointHostSection(joint);
  const other = getJointOtherSection(joint);
  const hostWall = _normWall(host?.wallName) || joint.wallA;
  const otherWall =
    _normWall(other?.wallName) ||
    (hostWall === joint.wallA ? joint.wallB : joint.wallA);
  let atStart = typeof opts.atStart === 'boolean' ? opts.atStart : null;
  if (atStart == null) {
    const r = host?._kitchenJointReserves?.[joint.jointId];
    if (r && typeof r.atStart === 'boolean') atStart = r.atStart === true;
  }
  if (atStart == null) {
    if (hostWall === 'back') atStart = otherWall === 'left';
    else if (hostWall === 'front') atStart = otherWall === 'right';
    else if (hostWall === 'left') atStart = otherWall === 'back';
    else if (hostWall === 'right') atStart = otherWall === 'back';
    else atStart = true;
  }
  // W: opts → customZoneWidthsMm на host → cornerCell → канон 1050.
  // Диапазон как у setZoneCustomWidthMm (300–1200), иначе карандаш «не меняет размер».
  let widthMm = Math.round(Number(opts.widthMm) || 0);
  const _wOk = (w) => w >= 300 && w <= 1200;
  if (!_wOk(widthMm) && host?.division) {
    const partsW = Math.max(1, Math.floor(Number(host.division.parts) || 1));
    const ziW = atStart === true ? 0 : partsW - 1;
    const cw = Math.round(
      Number(
        host.division.customZoneWidthsMm?.[ziW] ??
          host.division.customZoneWidthsMm?.[String(ziW)]
      ) || 0
    );
    if (_wOk(cw)) widthMm = cw;
  }
  if (!_wOk(widthMm)) {
    widthMm = Math.round(Number(joint.cornerCell?.widthMm) || 0);
  }
  if (!_wOk(widthMm)) widthMm = KITCHEN_CORNER_CELL_WIDTH_MM;
  const depthMm =
    Math.round(Number(opts.depthMm) || 0) ||
    _depthMmFromSection(host) ||
    _depthMmFromSection(other) ||
    Math.round(Number(joint.cornerCell?.depthMm) || 0) ||
    600;
  const clearMm = Math.max(
    0,
    Math.round(
      Number.isFinite(Number(opts.clearMm))
        ? Number(opts.clearMm)
        : Number(joint.cornerCell?.clearMm) || 10
    )
  );
  const returnMm =
    Math.round(Number(opts.returnMm) || 0) ||
    Math.round(Number(joint.cornerCell?.returnMm) || 0) ||
    depthMm;
  joint.cornerCell = {
    cornerCellId: joint.cornerCellId,
    hostWall,
    otherWall,
    atStart: atStart === true,
    widthMm,
    depthMm,
    clearMm,
    returnMm,
  };
  return joint.cornerCell;
}

function _isUSpineSection(sec) {
  if (!sec?.lShape && !sec?.division) return false;
  return (
    sec.lShape?.type === 'u-wardrobe' ||
    sec.division?.uShape === true ||
    (sec.lShape?.pairIdLeft != null && sec.lShape?.pairIdRight != null)
  );
}

/** Снять stale W=1050 с секции, где этот Joint больше не host. */
function _clearJointCornerProjectionOnSection(sec, joint) {
  if (!sec?.division || !joint) return;
  const parts = Math.max(1, Math.floor(Number(sec.division.parts) || 1));
  const r = sec._kitchenJointReserves?.[joint.jointId];
  let zi = null;
  if (r && typeof r.atStart === 'boolean') {
    zi = r.atStart === true ? 0 : parts - 1;
  } else if (joint.hand === 'left') zi = 0;
  else if (joint.hand === 'right') zi = parts - 1;
  else if (typeof joint.cornerCell?.atStart === 'boolean') {
    zi = joint.cornerCell.atStart === true ? 0 : parts - 1;
  }
  if (zi == null) return;
  if (sec.division.customZoneWidthsMm && typeof sec.division.customZoneWidthsMm === 'object') {
    delete sec.division.customZoneWidthsMm[zi];
    delete sec.division.customZoneWidthsMm[String(zi)];
  }
  sec.division.segmentsLShape = null;
  sec.division.segmentsLShapeBack = null;
}

/** Проекция CornerCell на host: customZoneWidthsMm спец = W ячейки (1050). */
export function projectCornerCellOntoHostSection(joint) {
  if (!joint?.cornerCell) return null;
  const host = getJointHostSection(joint);
  if (!host?.division) return null;
  const parts = Math.max(1, Math.floor(Number(host.division.parts) || 1));
  const atStart = joint.cornerCell.atStart === true;
  const zi = atStart ? 0 : parts - 1;
  const w = Math.round(Number(joint.cornerCell.widthMm) || KITCHEN_CORNER_CELL_WIDTH_MM);
  if (!host.division.customZoneWidthsMm || typeof host.division.customZoneWidthsMm !== 'object') {
    host.division.customZoneWidthsMm = {};
  }
  host.division.customZoneWidthsMm[zi] = w;
  host.division.customZoneWidthsMm[String(zi)] = w;
  // П-спина: два угла — один boolean затрёт второй. L / плечо — один special.
  if (_isUSpineSection(host)) {
    delete host.division.kitchenCornerHostAtStart;
  } else {
    host.division.kitchenCornerHostAtStart = atStart;
  }
  delete host.division.kitchenCornerSeatAway;
  if (host.lShape) delete host.lShape.kitchenCornerSeatAway;
  host.division.segmentsLShape = null;
  host.division.segmentsLShapeBack = null;
  return { section: host, zoneIndex: zi, widthMm: w, atStart };
}

/**
 * Посадка одного угла. L и каждая рука П — один и тот же путь.
 * atStart из резерва стен (не hand-хардкод) → левый/правый симметричны.
 */
export function seatKitchenJointCorner(joint, opts = {}) {
  if (!joint) return null;
  applyJointReserves(joint, opts.depthMm);
  const widthOpt = Math.round(Number(opts.widthMm) || 0);
  recomputeJointCornerCell(joint, {
    // Не форсировать 1050 — иначе карандаш ширины сразу откатывается.
    widthMm: widthOpt >= 300 && widthOpt <= 1200 ? widthOpt : undefined,
    depthMm: opts.depthMm,
    atStart: typeof opts.atStart === 'boolean' ? opts.atStart : undefined,
    clearMm: Number.isFinite(Number(opts.clearMm)) ? Number(opts.clearMm) : 10,
    returnMm: opts.returnMm,
  });
  syncJointDerivedSectionFlags(joint);
  const other = getJointOtherSection(joint);
  if (other) _clearJointCornerProjectionOnSection(other, joint);
  projectCornerCellOntoHostSection(joint);
  return joint.cornerCell;
}

function _syncCornerMeshesSafe() {
  try {
    if (typeof window.__cldSyncCornerCellMeshes === 'function') {
      window.__cldSyncCornerCellMeshes();
    }
  } catch (_) {}
}

/** L: один Joint = один угол. */
export function ensureJointsForLPair(primary, attached) {
  if (!primary || !attached) return [];
  const j = ensureKitchenJoint({
    kind: 'L',
    sectionA: primary,
    sectionB: attached,
    preferHostId: primary.id,
  });
  if (!j) return [];
  seatKitchenJointCorner(j, {});
  seatKitchenJointUpperCorner(j, {});
  try {
    const applyFn =
      typeof window !== 'undefined'
        ? window.__cldApplyKitchenLFreeArm600SacrificeWidths
        : null;
    if (typeof applyFn === 'function') {
      applyFn(primary);
      applyFn(attached);
    }
  } catch (_) {}
  _syncCornerMeshesSafe();
  return [j];
}

/**
 * П: два Joint, каждый = одна L (тот же seatKitchenJointCorner).
 * sectionA = spine, sectionB = arm.
 */
export function ensureJointsForUBundle(spine, leftArm, rightArm) {
  const out = [];
  if (!spine) return out;
  if (leftArm) {
    const jL = ensureKitchenJoint({
      kind: 'U',
      hand: 'left',
      sectionA: spine,
      sectionB: leftArm,
      preferHostId: spine.id,
    });
    if (jL) {
      seatKitchenJointCorner(jL, {});
      seatKitchenJointUpperCorner(jL, {});
      try {
        const applyFn =
          typeof window !== 'undefined'
            ? window.__cldApplyKitchenLFreeArm600SacrificeWidths
            : null;
        if (typeof applyFn === 'function') {
          applyFn(spine);
          applyFn(leftArm);
        }
      } catch (_) {}
      out.push(jL);
    }
  }
  if (rightArm) {
    const jR = ensureKitchenJoint({
      kind: 'U',
      hand: 'right',
      sectionA: spine,
      sectionB: rightArm,
      preferHostId: spine.id,
    });
    if (jR) {
      seatKitchenJointCorner(jR, {});
      seatKitchenJointUpperCorner(jR, {});
      try {
        const applyFn =
          typeof window !== 'undefined'
            ? window.__cldApplyKitchenLFreeArm600SacrificeWidths
            : null;
        if (typeof applyFn === 'function') {
          applyFn(spine);
          applyFn(rightArm);
        }
      } catch (_) {}
      out.push(jR);
    }
  }
  _syncCornerMeshesSafe();
  return out;
}

export function getKitchenJoint(jointId) {
  if (!jointId) return null;
  return _jointsMap()[String(jointId)] || null;
}

export function findKitchenJointByModule(group) {
  const id = group?.userData?.__kitchenJointId;
  if (id) {
    const j = getKitchenJoint(id);
    if (j) return j;
  }
  const uuid = group?.uuid;
  if (!uuid) return null;
  for (const j of Object.values(_jointsMap())) {
    if (!j) continue;
    if (j.moduleUuid === uuid) return j;
    // ВМУ в пироге: uuid на upperModuleUuid, не на moduleUuid низа.
    if (j.upperModuleUuid === uuid) return j;
  }
  return null;
}

export function getJointHostSection(joint) {
  return joint ? _secById(joint.hostSectionId) : null;
}

export function getJointOtherSection(joint) {
  if (!joint) return null;
  const host = String(joint.hostSectionId);
  const otherId =
    host === String(joint.sectionAId) ? joint.sectionBId : joint.sectionAId;
  return _secById(otherId);
}

export function flipJointHostSide(joint) {
  if (!joint) return null;
  if (joint.hostSide === 'A') {
    joint.hostSide = 'B';
    joint.hostSectionId = String(joint.sectionBId);
  } else {
    joint.hostSide = 'A';
    joint.hostSectionId = String(joint.sectionAId);
  }
  return joint;
}

/** Host верхней угловой ячейки (слой mid) — независимо от низа. */
export function getJointUpperHostSection(joint) {
  if (!joint) return null;
  const side = joint.upperHostSide === 'B' ? 'B' : 'A';
  return _secById(side === 'A' ? joint.sectionAId : joint.sectionBId);
}

export function getJointUpperOtherSection(joint) {
  if (!joint) return null;
  const hostId = String(
    joint.upperHostSectionId ||
      (joint.upperHostSide === 'B' ? joint.sectionBId : joint.sectionAId)
  );
  const otherId =
    hostId === String(joint.sectionAId) ? joint.sectionBId : joint.sectionAId;
  return _secById(otherId);
}

/** Разворот только верхней ячейки — hostSide / CornerCell низа не трогаем. */
export function flipJointUpperHostSide(joint) {
  if (!joint) return null;
  if (joint.upperHostSide !== 'A' && joint.upperHostSide !== 'B') {
    joint.upperHostSide = joint.hostSide === 'B' ? 'B' : 'A';
  }
  if (joint.upperHostSide === 'A') {
    joint.upperHostSide = 'B';
    joint.upperHostSectionId = String(joint.sectionBId);
  } else {
    joint.upperHostSide = 'A';
    joint.upperHostSectionId = String(joint.sectionAId);
  }
  return joint;
}

/**
 * Резерв верхней ячейки: только host.
 * Чужое плечо — обычные ячейки MID под НШ1 (как сосед низа), без «дырки» от skip спец.
 */
export function applyJointUpperReserves(joint) {
  if (!joint || !Array.isArray(state.customSections)) return;
  const hostId = String(
    joint.upperHostSectionId ||
      (joint.upperHostSide === 'B' ? joint.sectionBId : joint.sectionAId)
  );
  const cc = joint.upperCornerCell;
  const widthMm = Math.round(
    Number(cc?.widthMm) || KITCHEN_UPPER_CORNER_CELL_WIDTH_MM
  );
  const depthMm = Math.round(
    Number(cc?.depthMm) || KITCHEN_UPPER_CORNER_CELL_DEPTH_MM
  );
  const jid = joint.jointId;
  for (const sid of [joint.sectionAId, joint.sectionBId]) {
    const sec = _secById(sid);
    if (!sec) continue;
    if (
      !sec._kitchenJointUpperReserves ||
      typeof sec._kitchenJointUpperReserves !== 'object'
    ) {
      sec._kitchenJointUpperReserves = Object.create(null);
    }
    const isHost = String(sid) === hostId;
    if (!isHost) {
      try {
        delete sec._kitchenJointUpperReserves[jid];
      } catch (_) {}
      continue;
    }
    const wall = _normWall(sec.wallName);
    const otherWall =
      String(sid) === String(joint.sectionAId) ? joint.wallB : joint.wallA;
    let atStart = true;
    if (wall === 'back') atStart = otherWall === 'left';
    else if (wall === 'front') atStart = otherWall === 'right';
    else if (wall === 'left') atStart = otherWall === 'back';
    else if (wall === 'right') atStart = otherWall === 'back';
    if (typeof cc?.atStart === 'boolean') atStart = cc.atStart === true;
    sec._kitchenJointUpperReserves[jid] = {
      cornerCellId: joint.upperCornerCellId,
      atStart,
      depthMm,
      widthMm,
      isHost: true,
      layer: 'upper',
      kind: joint.kind,
      hand: joint.hand,
    };
  }
}

/**
 * Верхняя угловая ячейка пирога (W=600).
 * Источник истины: joint.upperCornerCell. Не пишет customZoneWidthsMm низа.
 */
export function seatKitchenJointUpperCorner(joint, opts = {}) {
  if (!joint) return null;
  if (joint.upperHostSide !== 'A' && joint.upperHostSide !== 'B') {
    joint.upperHostSide = joint.hostSide === 'B' ? 'B' : 'A';
    joint.upperHostSectionId =
      joint.upperHostSide === 'A' ? String(joint.sectionAId) : String(joint.sectionBId);
  } else {
    joint.upperHostSectionId =
      joint.upperHostSide === 'A' ? String(joint.sectionAId) : String(joint.sectionBId);
  }
  if (!joint.upperCornerCellId) {
    joint.upperCornerCellId = _stableId(['ucc', joint.jointId]);
  }
  const host = getJointUpperHostSection(joint);
  const other = getJointUpperOtherSection(joint);
  const hostWall = _normWall(host?.wallName) || joint.wallA;
  const otherWall =
    _normWall(other?.wallName) ||
    (hostWall === joint.wallA ? joint.wallB : joint.wallA);
  let atStart = typeof opts.atStart === 'boolean' ? opts.atStart : null;
  if (atStart == null && typeof joint.upperCornerCell?.atStart === 'boolean') {
    atStart = joint.upperCornerCell.atStart === true;
  }
  if (atStart == null) {
    if (hostWall === 'back') atStart = otherWall === 'left';
    else if (hostWall === 'front') atStart = otherWall === 'right';
    else if (hostWall === 'left') atStart = otherWall === 'back';
    else if (hostWall === 'right') atStart = otherWall === 'back';
    else atStart = true;
  }
  let widthMm = Math.round(Number(opts.widthMm) || 0);
  if (!(widthMm >= 300 && widthMm <= 900)) {
    widthMm = Math.round(Number(joint.upperCornerCell?.widthMm) || 0);
  }
  if (!(widthMm >= 300 && widthMm <= 900)) {
    widthMm = KITCHEN_UPPER_CORNER_CELL_WIDTH_MM;
  }
  // Глубина всегда из профиля навеса (если не передали opts.depthMm явно).
  // Не держим устаревшие 350 в upperCornerCell при смене настроек кухни.
  let depthMm = Math.round(Number(opts.depthMm) || 0);
  if (!(depthMm >= 200 && depthMm <= 700)) {
    depthMm = resolveKitchenUpperCornerDepthMm();
  }
  joint.upperCornerCell = {
    cornerCellId: joint.upperCornerCellId,
    layer: 'upper',
    hostWall,
    otherWall,
    atStart: atStart === true,
    widthMm,
    depthMm,
    clearMm: 0,
    returnMm: depthMm,
    moduleUuid: joint.upperModuleUuid || null,
  };
  applyJointUpperReserves(joint);
  return joint.upperCornerCell;
}

function _depthMmFromSection(sec) {
  if (!sec?.size) return 0;
  const w = _normWall(sec.wallName);
  const mm =
    w === 'left' || w === 'right' ? Number(sec.size.x) : Number(sec.size.z);
  return Number.isFinite(mm) && mm > 0 ? Math.round(mm) : 0;
}

/** Резерв CornerCell на обеих секциях стыка. */
export function applyJointReserves(joint, depthMmOpt) {
  if (!joint || !Array.isArray(state.customSections)) return;
  const host = _secById(joint.hostSectionId);
  const other = getJointOtherSection(joint);
  const depth =
    Math.max(0, Math.round(Number(depthMmOpt) || 0)) ||
    _depthMmFromSection(host) ||
    _depthMmFromSection(other) ||
    600;
  const hostId = String(joint.hostSectionId);
  for (const sid of [joint.sectionAId, joint.sectionBId]) {
    const sec = _secById(sid);
    if (!sec) continue;
    if (!sec._kitchenJointReserves || typeof sec._kitchenJointReserves !== 'object') {
      sec._kitchenJointReserves = Object.create(null);
    }
    const isHost = String(sid) === hostId;
    const wall = _normWall(sec.wallName);
    const otherWall =
      String(sid) === String(joint.sectionAId) ? joint.wallB : joint.wallA;
    // Как _atStartTowardAdjacent / L_CORNER_CONFIG: right+back=start (левый),
    // right+front=end (правый). Было ==='front' → резерв не на том краю,
    // левый в правом дальнем углу не дотягивал столешку до угла.
    let atStart = true;
    if (wall === 'back') atStart = otherWall === 'left';
    else if (wall === 'front') atStart = otherWall === 'right';
    else if (wall === 'left') atStart = otherWall === 'back';
    else if (wall === 'right') atStart = otherWall === 'back';
    sec._kitchenJointReserves[joint.jointId] = {
      cornerCellId: joint.cornerCellId,
      atStart,
      depthMm: depth,
      isHost,
      kind: joint.kind,
      hand: joint.hand,
    };
  }
}

export function bindModuleToJoint(group, joint) {
  if (!group || !joint) return;
  const ud = group.userData || (group.userData = {});
  ud.__kitchenJointId = joint.jointId;
  ud.__kitchenJointKind = joint.kind;
  if (joint.hand) ud.__uCornerHand = joint.hand;
  else delete ud.__uCornerHand;
  // Пирог: ВМУ → upperCornerCell / upperModuleUuid; низ (НМУ) не затираем.
  const pk = String(
    ud.__placementKindProfileId || ud.__kitchenProfileId || ud.__placementKind || ''
  )
    .trim()
    .toLowerCase();
  const ct = String(ud.catalogType || ud.__catalogType || '').toLowerCase();
  const isWallCorner =
    pk === 'kitchen_wall_corner' ||
    ct === 'catalog_54' ||
    ct === '54' ||
    /(^|_)54$/.test(ct);
  if (isWallCorner) {
    if (!joint.upperCornerCellId) {
      joint.upperCornerCellId = _stableId(['ucc', joint.jointId]);
    }
    joint.upperModuleUuid = group.uuid || null;
    ud.__kitchenUpperCornerCellId = joint.upperCornerCellId;
    ud.__kitchenCornerCellId = joint.upperCornerCellId;
    if (joint.upperCornerCell && typeof joint.upperCornerCell === 'object') {
      joint.upperCornerCell.moduleUuid = joint.upperModuleUuid;
    }
  } else {
    ud.__kitchenCornerCellId = joint.cornerCellId;
    joint.moduleUuid = group.uuid || null;
  }
}

/**
 * Производные флаги отрисовки. L и П — один смысл: host держит special, away — нет.
 * П-спина: host-map left/right (два угла); seatAway на спину не вешаем (второй угол жив).
 * Не выставляем kitchenCornerHostHand.
 */
export function syncJointDerivedSectionFlags(joint) {
  if (!joint || !Array.isArray(state.customSections)) return;
  const hostId = String(joint.hostSectionId);
  const secA = _secById(joint.sectionAId);
  const secB = _secById(joint.sectionBId);

  const applyHostAwayPair = (hostSec, awaySec, { allowSeatAwayOnAway }) => {
    for (const sec of [hostSec, awaySec]) {
      if (!sec) continue;
      sec.lShape = sec.lShape || {};
      delete sec.lShape.kitchenCornerHostHand;
      delete sec.lShape.kitchenCornerTypeKey;
    }
    if (awaySec) {
      if (allowSeatAwayOnAway) {
        awaySec.lShape.kitchenCornerSeatAway = true;
        if (awaySec.division) {
          awaySec.division.kitchenCornerSeatAway = true;
          delete awaySec.division.kitchenCornerHostAtStart;
          awaySec.division.segmentsLShape = null;
          awaySec.division.segmentsLShapeBack = null;
        }
      } else if (awaySec.lShape) {
        // Плечо П при host=spine: special режет _filterSpecialsByJointReserves (isHost false).
        delete awaySec.lShape.kitchenCornerSeatAway;
        if (awaySec.division) {
          delete awaySec.division.kitchenCornerSeatAway;
          delete awaySec.division.kitchenCornerHostAtStart;
          awaySec.division.segmentsLShape = null;
          awaySec.division.segmentsLShapeBack = null;
        }
      }
    }
    if (hostSec) {
      delete hostSec.lShape.kitchenCornerSeatAway;
      if (hostSec.division) delete hostSec.division.kitchenCornerSeatAway;
      let hostAt = null;
      const reserves = hostSec._kitchenJointReserves;
      if (reserves && typeof reserves === 'object') {
        const mine = reserves[joint.jointId];
        if (mine && mine.isHost === true && typeof mine.atStart === 'boolean') {
          hostAt = mine.atStart === true;
        } else {
          for (const r of Object.values(reserves)) {
            if (r && r.isHost === true && typeof r.atStart === 'boolean') {
              hostAt = r.atStart === true;
              break;
            }
          }
        }
      }
      if (hostSec.division) {
        if (_isUSpineSection(hostSec)) {
          delete hostSec.division.kitchenCornerHostAtStart;
        } else if (typeof hostAt === 'boolean') {
          hostSec.division.kitchenCornerHostAtStart = hostAt;
        } else {
          delete hostSec.division.kitchenCornerHostAtStart;
        }
        hostSec.division.segmentsLShape = null;
        hostSec.division.segmentsLShapeBack = null;
      }
    }
  };

  if (joint.kind === 'L') {
    const host = String(hostId) === String(secA?.id) ? secA : secB;
    const away = host === secA ? secB : secA;
    applyHostAwayPair(host, away, { allowSeatAwayOnAway: true });
    return;
  }

  // П: host-map на спине + host/away этого Joint (как L, без seatAway на spine).
  const spine = secA;
  const arm = secB;
  if (!spine?.lShape || !(joint.hand === 'left' || joint.hand === 'right')) return;
  const prev = spine.lShape.kitchenCornerHost || { left: 'spine', right: 'spine' };
  const next = {
    left: prev.left === 'arm' ? 'arm' : 'spine',
    right: prev.right === 'arm' ? 'arm' : 'spine',
  };
  const onArm = hostId === String(joint.sectionBId);
  next[joint.hand] = onArm ? 'arm' : 'spine';
  spine.lShape.kitchenCornerHost = next;
  if (spine.division) spine.division.kitchenCornerHost = { ...next };

  const host = onArm ? arm : spine;
  const away = onArm ? spine : arm;
  // away=spine: не seatAway (второй угол). away=arm: можно seatAway.
  applyHostAwayPair(host, away, { allowSeatAwayOnAway: away === arm });
}

export function listKitchenJoints() {
  return Object.values(_jointsMap()).filter(Boolean);
}

/**
 * Карточка catalog_44: true = «Угловой левый», false = «Угловой правый».
 * Не путать с cornerCell.atStart на плече после flip (там оба atStart→back).
 */
export function resolveJointCatalogHandAtStart(joint) {
  if (!joint) return true;
  if (joint.kind === 'U') {
    if (joint.hand === 'left') return true;
    if (joint.hand === 'right') return false;
  }
  const host = getJointHostSection(joint);
  const other = getJointOtherSection(joint);
  const walls = new Set(
    [_normWall(host?.wallName), _normWall(other?.wallName)].filter(Boolean)
  );
  if (walls.has('left')) return true;
  if (walls.has('right')) return false;
  return joint.cornerCell?.atStart !== false;
}

/** Joint для секции + zoneIndex (host special). */
export function findKitchenJointForSectionZone(section, zoneIndex) {
  if (!section?.id || zoneIndex == null) return null;
  const zi = Math.floor(Number(zoneIndex));
  if (!Number.isFinite(zi) || zi < 0) return null;
  const sid = String(section.id);
  const parts = Math.max(1, Math.floor(Number(section.division?.parts) || 1));
  for (const j of listKitchenJoints()) {
    if (!j || String(j.hostSectionId) !== sid) continue;
    const wantZi =
      typeof j.cornerCell?.atStart === 'boolean'
        ? j.cornerCell.atStart === true
          ? 0
          : parts - 1
        : j.hand === 'left'
          ? 0
          : j.hand === 'right'
            ? parts - 1
            : 0;
    if (wantZi === zi) return j;
  }
  // Fallback: section participates in joint, match hand/zi for U spine
  for (const j of listKitchenJoints()) {
    if (!j) continue;
    if (String(j.sectionAId) !== sid && String(j.sectionBId) !== sid) continue;
    if (j.kind === 'U') {
      if (zi === 0 && j.hand === 'left') return j;
      if (zi === parts - 1 && j.hand === 'right') return j;
    }
    if (j.kind === 'L') return j;
  }
  return null;
}

try {
  if (typeof window !== 'undefined') {
    window.__cldEnsureKitchenJoint = ensureKitchenJoint;
    window.__cldEnsureJointsForLPair = ensureJointsForLPair;
    window.__cldEnsureJointsForUBundle = ensureJointsForUBundle;
    window.__cldSeatKitchenJointCorner = seatKitchenJointCorner;
    window.__cldSeatKitchenJointUpperCorner = seatKitchenJointUpperCorner;
    window.__cldApplyJointUpperReserves = applyJointUpperReserves;
    window.__cldFlipJointUpperHostSide = flipJointUpperHostSide;
    window.__cldResolveJointCatalogHandAtStart = resolveJointCatalogHandAtStart;
    window.__cldFindKitchenJointForSectionZone = findKitchenJointForSectionZone;
    window.__cldGetKitchenJoint = getKitchenJoint;
    window.__cldListKitchenJoints = listKitchenJoints;
    window.__cldRecomputeJointCornerCell = recomputeJointCornerCell;
    window.__cldProjectCornerCellOntoHost = projectCornerCellOntoHostSection;
    window.__cldKitchenCornerCellWidthMm = KITCHEN_CORNER_CELL_WIDTH_MM;
    window.__cldKitchenUpperCornerCellWidthMm = KITCHEN_UPPER_CORNER_CELL_WIDTH_MM;
    window.__cldKitchenUpperCornerPostMm = KITCHEN_UPPER_CORNER_POST_MM;
    window.__cldResolveKitchenUpperCornerDepthMm =
      resolveKitchenUpperCornerDepthMm;
  }
} catch (_) {}
