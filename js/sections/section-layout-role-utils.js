import { computeFurnitureWorldBBoxNoAo } from '../furniture/furniture-bbox.js';

/** Глобальный THREE (как в furniture-bbox.js) */
function __getTHREE() {
  return typeof THREE !== 'undefined' ? THREE : typeof window !== 'undefined' ? window.THREE : null;
}

/**
 * Минимальный мировой Y нижней грани логического параллелепипеда секции (мм).
 * Для пустой подсекции с ролью plinth — нижняя плоскость по originalSize и matrixWorld,
 * а не по мешам дочернего корпуса (иначе шкаф «садится» в пол на высоту цоколя).
 * @param {import('three').Object3D} sectionGroup
 * @returns {number}
 */
function __worldMinYFromSectionLogicalBox(sectionGroup) {
  const T = __getTHREE();
  if (!sectionGroup || !T) return NaN;
  const os = sectionGroup.userData?.originalSize;
  if (!os || typeof os !== 'object') return NaN;
  const sx = Number(os.x);
  const sy = Number(os.y);
  const sz = Number(os.z);
  if (!Number.isFinite(sx) || !Number.isFinite(sy) || !Number.isFinite(sz)) return NaN;
  if (sy < 0.5 || sx < 0.5 || sz < 0.5) return NaN;

  sectionGroup.updateMatrixWorld(true);
  const box = new T.Box3(new T.Vector3(0, 0, 0), new T.Vector3(sx, sy, sz));
  box.applyMatrix4(sectionGroup.matrixWorld);
  if (typeof box.isEmpty === 'function' && box.isEmpty()) return NaN;
  if (!Number.isFinite(box.min.y)) return NaN;
  return box.min.y;
}

/**
 * Поиск встроенной группы подсекции по layout_role (после ClodisBuilder).
 * @param {import('three').Object3D} rootObject — обычно state.furniture.group
 * @param {string} layoutRole — например 'plinth', 'corpus'
 */
export function findSectionGroupByLayoutRole(rootObject, layoutRole) {
  if (!rootObject || !layoutRole) return null;
  const want = String(layoutRole).trim();
  if (!want) return null;
  let out = null;
  rootObject.traverse((obj) => {
    if (out) return;
    const ud = obj.userData;
    if (ud && ud.isSection && ud.layoutRole === want) out = obj;
  });
  return out;
}

/**
 * @param {import('three').Box3} box
 * @returns {boolean}
 */
function __box3LooksValid(box) {
  if (!box) return false;
  if (typeof box.isEmpty === 'function' && box.isEmpty()) return false;
  const dy = box.max.y - box.min.y;
  const dx = box.max.x - box.min.x;
  const dz = box.max.z - box.min.z;
  if (!Number.isFinite(dy) || !Number.isFinite(dx) || !Number.isFinite(dz)) return false;
  // Нет ни одного заметного габарита — как у пустой группы после setFromObject
  if (dy < 0.5 && dx < 0.5 && dz < 0.5) return false;
  if (!Number.isFinite(box.min.y) || !Number.isFinite(box.max.y)) return false;
  return true;
}

/**
 * Мировой Y низа «опоры на пол» для выравнивания в нише.
 * Если задана подсекция с role plinth — берём низ её геометрии (без AO),
 * но только если bbox цоколя осмысленный: иначе (пустая подсекция, только
 * контейнер без мешей, роль повешена не на ту ветку) откат к низу всего модуля.
 * Иначе коррекция Y даёт тысячи мм и шкаф «пропадает» из комнаты.
 *
 * Опоры: placeholder/GLB должны быть в computeFurnitureWorldBBoxNoAo (см. furniture-bbox.js).
 *
 * @param {import('three').Object3D} furnitureGroup
 * @returns {number}
 */
export function getFurnitureFloorContactWorldYNoAo(furnitureGroup) {
  if (!furnitureGroup) return 0;
  const whole = computeFurnitureWorldBBoxNoAo(furnitureGroup);
  if (!__box3LooksValid(whole)) {
    return Number.isFinite(whole.min.y) ? whole.min.y : 0;
  }

  const plinth = findSectionGroupByLayoutRole(furnitureGroup, 'plinth');
  if (!plinth) {
    return whole.min.y;
  }

  const pb = computeFurnitureWorldBBoxNoAo(plinth);
  if (!__box3LooksValid(pb)) {
    const logicalBottomY = __worldMinYFromSectionLogicalBox(plinth);
    // Пустой цоколь: низ по габариту секции; не смешивать с низом корпуса (whole.min.y)
    if (
      Number.isFinite(logicalBottomY) &&
      logicalBottomY <= whole.min.y + 2
    ) {
      return logicalBottomY;
    }
    return whole.min.y;
  }

  const cabH = whole.max.y - whole.min.y;
  const maxLift = Math.max(500, cabH * 0.55 + 100);
  // Низ цоколя должен быть у нижней части шкафа, а не у «верхней» подсекции с ошибочной ролью
  if (pb.min.y > whole.min.y + maxLift) {
    return whole.min.y;
  }
  if (pb.min.y < whole.min.y - 250) {
    return whole.min.y;
  }

  return pb.min.y;
}
