/**
 * Kitchen side-panels — clearance check (STEP 2V).
 * Pure metric evaluation in section-local U/Y/Z (mm).
 * Does not touch scene, balancer, rebuild, userData.sidePanels, or meshes.
 *
 * Caller must supply already-trusted corpus/section intervals.
 * Live scene gathering / left-right→U mapping is intentionally out of scope here.
 */

/** Фиксированная толщина накладки v1 (мм). */
export const KITCHEN_SIDE_PANEL_OVERLAY_THICKNESS_MM = 16;

/** @typedef {'minU'|'maxU'} KitchenSidePanelClearanceFace */
/** @typedef {'clear'|'blocked'|'unknown'} KitchenSidePanelClearanceStatus */

/**
 * @typedef {object} KitchenSidePanelBoxMm
 * @property {string} [id]
 * @property {number} u0
 * @property {number} u1
 * @property {number} y0
 * @property {number} y1
 * @property {number} z0
 * @property {number} z1
 * @property {string} [kind]
 */

/**
 * @typedef {object} KitchenSidePanelClearanceResult
 * @property {KitchenSidePanelClearanceStatus} status
 * @property {number|null} availableMm
 * @property {number} requiredMm
 * @property {string} reasonCode
 * @property {string|null} blockerId
 */

/**
 * @param {unknown} n
 * @returns {boolean}
 */
function _finite(n) {
  return Number.isFinite(Number(n));
}

/**
 * @param {unknown} raw
 * @returns {KitchenSidePanelBoxMm|null}
 */
export function normalizeKitchenSidePanelBoxMm(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  const u0 = Number(o.u0);
  const u1 = Number(o.u1);
  const y0 = Number(o.y0);
  const y1 = Number(o.y1);
  const z0 = Number(o.z0);
  const z1 = Number(o.z1);
  if (![u0, u1, y0, y1, z0, z1].every((v) => Number.isFinite(v))) return null;
  if (!(u1 > u0) || !(y1 > y0) || !(z1 > z0)) return null;
  const id = o.id != null ? String(o.id) : undefined;
  const kind = o.kind != null ? String(o.kind) : undefined;
  return {
    ...(id != null ? { id } : {}),
    ...(kind != null ? { kind } : {}),
    u0,
    u1,
    y0,
    y1,
    z0,
    z1,
  };
}

/**
 * Собрать корпусный AABB в локали секции из уже достоверных размеров посадки.
 * Не читает THREE / mesh.
 *
 * @param {object} input
 * @param {string} [input.id]
 * @param {string} [input.kind]
 * @param {number} input.zoneStartU — начало зоны по U (мм)
 * @param {number} input.widthMm — ширина корпуса/ячейки по U
 * @param {number} input.y0 — низ корпуса (мм от пола)
 * @param {number} input.heightMm
 * @param {number} input.z0 — зад корпуса (мм от стены / section rear)
 * @param {number} input.depthMm — глубина корпуса
 * @returns {KitchenSidePanelBoxMm|null}
 */
export function buildKitchenModuleCorpusBoxMm(input) {
  if (!input || typeof input !== 'object') return null;
  const zoneStartU = Number(input.zoneStartU);
  const widthMm = Number(input.widthMm);
  const y0 = Number(input.y0);
  const heightMm = Number(input.heightMm);
  const z0 = Number(input.z0);
  const depthMm = Number(input.depthMm);
  if (![zoneStartU, widthMm, y0, heightMm, z0, depthMm].every((v) => Number.isFinite(v))) {
    return null;
  }
  if (!(widthMm > 0) || !(heightMm > 0) || !(depthMm > 0)) return null;
  return normalizeKitchenSidePanelBoxMm({
    id: input.id,
    kind: input.kind || 'module',
    u0: zoneStartU,
    u1: zoneStartU + widthMm,
    y0,
    y1: y0 + heightMm,
    z0,
    z1: z0 + depthMm,
  });
}

/**
 * @param {number} a0
 * @param {number} a1
 * @param {number} b0
 * @param {number} b1
 * @returns {boolean}
 */
export function kitchenSidePanelIntervalsOverlap(a0, a1, b0, b1) {
  return a0 < b1 && b0 < a1;
}

/**
 * Пересечение по высоте и глубине (объём будущей детали vs сосед).
 * @param {KitchenSidePanelBoxMm} a
 * @param {KitchenSidePanelBoxMm} b
 */
export function kitchenSidePanelBoxesOverlapYZ(a, b) {
  return (
    kitchenSidePanelIntervalsOverlap(a.y0, a.y1, b.y0, b.y1) &&
    kitchenSidePanelIntervalsOverlap(a.z0, a.z1, b.z0, b.z1)
  );
}

/**
 * @param {KitchenSidePanelClearanceStatus} status
 * @param {string} reasonCode
 * @param {number} requiredMm
 * @param {number|null} availableMm
 * @param {string|null} blockerId
 * @returns {KitchenSidePanelClearanceResult}
 */
function _result(status, reasonCode, requiredMm, availableMm, blockerId) {
  return {
    status,
    availableMm: availableMm == null ? null : availableMm,
    requiredMm,
    reasonCode,
    blockerId: blockerId == null ? null : String(blockerId),
  };
}

/**
 * Проверка свободного места под накладку fixed thickness на торце корпуса.
 *
 * Контекст (все длины в мм, локаль секции):
 * - subject: корпусный box проверяемого модуля
 * - face: 'minU' | 'maxU' — какой торец (маппинг left/right → face делает вызывающий код)
 * - occupiers: соседи / пеналы / стена / секционный SideOverlay|SidePlank
 * - section?: { u0, u1 } — границы секции; торец секции = стена/край ряда
 *
 * Без достоверных чисел → status "unknown" (не угадываем).
 *
 * @param {unknown} context
 * @returns {KitchenSidePanelClearanceResult}
 */
export function evaluateKitchenSidePanelClearance(context) {
  const requiredDefault = KITCHEN_SIDE_PANEL_OVERLAY_THICKNESS_MM;
  if (!context || typeof context !== 'object' || Array.isArray(context)) {
    return _result('unknown', 'invalid_context', requiredDefault, null, null);
  }
  const ctx = /** @type {Record<string, unknown>} */ (context);
  const requiredMm = _finite(ctx.requiredMm)
    ? Math.round(Number(ctx.requiredMm))
    : requiredDefault;
  if (!(requiredMm > 0)) {
    return _result('unknown', 'invalid_required_mm', requiredDefault, null, null);
  }

  const subject = normalizeKitchenSidePanelBoxMm(ctx.subject);
  if (!subject) {
    return _result('unknown', 'missing_subject_box', requiredMm, null, null);
  }

  const face = String(ctx.face || '').trim();
  if (face !== 'minU' && face !== 'maxU') {
    return _result('unknown', 'missing_face', requiredMm, null, null);
  }

  /** @type {KitchenSidePanelBoxMm[]} */
  const occupiers = [];
  if (Array.isArray(ctx.occupiers)) {
    for (const raw of ctx.occupiers) {
      const box = normalizeKitchenSidePanelBoxMm(raw);
      if (!box) {
        return _result('unknown', 'invalid_occupier', requiredMm, null, null);
      }
      // Сам субъект в списке — пропускаем по id.
      if (subject.id && box.id && String(box.id) === String(subject.id)) continue;
      occupiers.push(box);
    }
  } else if (ctx.occupiers != null) {
    return _result('unknown', 'invalid_occupiers', requiredMm, null, null);
  }

  let sectionU0 = null;
  let sectionU1 = null;
  if (ctx.section != null) {
    if (typeof ctx.section !== 'object' || Array.isArray(ctx.section)) {
      return _result('unknown', 'invalid_section_bounds', requiredMm, null, null);
    }
    const sec = /** @type {Record<string, unknown>} */ (ctx.section);
    if (!_finite(sec.u0) || !_finite(sec.u1) || !(Number(sec.u1) > Number(sec.u0))) {
      return _result('unknown', 'invalid_section_bounds', requiredMm, null, null);
    }
    sectionU0 = Number(sec.u0);
    sectionU1 = Number(sec.u1);
  }

  const edgeU = face === 'minU' ? subject.u0 : subject.u1;
  const outward = face === 'minU' ? -1 : 1;

  // Кандидаты, пересекающие объём детали по Y и Z.
  const relevant = occupiers.filter((o) => kitchenSidePanelBoxesOverlapYZ(subject, o));

  /** @type {{ id: string|null, gap: number, kind: string }[]} */
  const gaps = [];

  for (const o of relevant) {
    let gap;
    if (outward < 0) {
      // Свободное место слева от edgeU: край occupier должен быть ≤ edgeU.
      if (o.u1 <= edgeU + 1e-6) {
        gap = edgeU - o.u1;
      } else if (o.u0 < edgeU && o.u1 > edgeU) {
        // Заходит на торец / внутрь корпуса по U — зазор 0.
        gap = 0;
      } else {
        continue; // целиком с другой стороны
      }
    } else {
      if (o.u0 >= edgeU - 1e-6) {
        gap = o.u0 - edgeU;
      } else if (o.u0 < edgeU && o.u1 > edgeU) {
        gap = 0;
      } else {
        continue;
      }
    }
    const g = Math.max(0, Math.round(gap * 1000) / 1000);
    gaps.push({
      id: o.id != null ? String(o.id) : null,
      gap: g,
      kind: o.kind || 'occupier',
    });
  }

  // Граница секции / стена ряда — если передана.
  if (sectionU0 != null && sectionU1 != null) {
    if (outward < 0) {
      const gap = edgeU - sectionU0;
      if (!(gap >= 0)) {
        return _result('unknown', 'subject_outside_section', requiredMm, null, null);
      }
      gaps.push({ id: 'section_minU', gap: Math.round(gap * 1000) / 1000, kind: 'wall' });
    } else {
      const gap = sectionU1 - edgeU;
      if (!(gap >= 0)) {
        return _result('unknown', 'subject_outside_section', requiredMm, null, null);
      }
      gaps.push({ id: 'section_maxU', gap: Math.round(gap * 1000) / 1000, kind: 'wall' });
    }
  }

  if (!gaps.length) {
    // Нет ни соседа с пересечением YZ, ни границы секции — нельзя подтвердить зазор.
    return _result('unknown', 'insufficient_bounds', requiredMm, null, null);
  }

  gaps.sort((a, b) => a.gap - b.gap);
  const nearest = gaps[0];
  const availableMm = nearest.gap;

  if (availableMm + 1e-6 < requiredMm) {
    return _result('blocked', 'insufficient_clearance', requiredMm, availableMm, nearest.id);
  }
  return _result('clear', 'clearance_ok', requiredMm, availableMm, null);
}
