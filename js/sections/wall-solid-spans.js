/**
 * Свободные пролёты стены между углами / дверями / окнами.
 * alongMm — та же ось, что у roomEditOpenings (front/back: X, left/right: Z), 0…wallLength.
 */

/** Зазор вокруг проёма (мм). 0 = вплотную к краю двери/окна; отступ задаёт пользователь в модалке. */
export const OPENING_CLEARANCE_MM = 0;
/** Зазор у углов комнаты для секции (v1: вплотную, как раньше). */
export const CORNER_CLEARANCE_MM = 0;
/** Мин. высота подоконника (мм), чтобы под окном имело смысл ставить тумбу. */
export const WINDOW_BRIDGE_MIN_SILL_MM = 400;
const WALL_GAP_MM = 2;

/**
 * @param {object} room
 * @param {'front'|'back'|'left'|'right'} wallName
 */
export function wallLengthMm(room, wallName) {
  if (!room) return 0;
  if (typeof room.wallLengthOf === 'function') return room.wallLengthOf(wallName);
  return wallName === 'left' || wallName === 'right' ? room.depth : room.width;
}

/**
 * Интервалы сплошной стены с учётом clearance вокруг проёмов.
 * @returns {{ solids: Array<{a:number,b:number}>, holes: Array<{a:number,b:number}> }}
 */
export function solidIntervalsAlong(lengthMm, openingsOnWall, clearanceMm = OPENING_CLEARANCE_MM) {
  const len = Math.max(0, Number(lengthMm) || 0);
  const cuts = (openingsOnWall || [])
    .map((op) => {
      const half = (Number(op.widthMm) || 0) / 2;
      const c = Number(op.alongMm);
      if (!Number.isFinite(c) || half <= 0) return null;
      return {
        a: Math.max(0, c - half - clearanceMm),
        b: Math.min(len, c + half + clearanceMm),
      };
    })
    .filter((h) => h && h.b - h.a > 1)
    .sort((x, y) => x.a - y.a);

  const merged = [];
  cuts.forEach((c) => {
    const last = merged[merged.length - 1];
    if (last && c.a <= last.b + 1) last.b = Math.max(last.b, c.b);
    else merged.push({ a: c.a, b: c.b });
  });

  const solids = [];
  let cursor = CORNER_CLEARANCE_MM;
  const end = Math.max(0, len - CORNER_CLEARANCE_MM);
  merged.forEach((c) => {
    if (c.a - cursor > 1) solids.push({ a: cursor, b: Math.min(c.a, end) });
    cursor = Math.max(cursor, c.b);
  });
  if (end - cursor > 1) solids.push({ a: cursor, b: end });
  return { solids, holes: merged };
}

function openingNoun(op) {
  if (!op) return 'проёма';
  return op.type === 'window' ? 'окна' : 'двери';
}

/** Подпись поля: «Отступ от двери/окна/проёма». */
export function openingOffsetLabel(op) {
  return `Отступ от ${openingNoun(op)}`;
}

function openingsOnWall(openings, wallName) {
  const wn = String(wallName || '').trim().toLowerCase();
  return (openings || []).filter(
    (op) => String(op?.wallName || '').trim().toLowerCase() === wn
  );
}

/** Ближайший проём к краю along (мм). */
function nearestOpeningAtAlong(ops, alongMm) {
  const list = ops || [];
  if (!list.length || !Number.isFinite(alongMm)) return null;
  let best = null;
  let bestDist = Infinity;
  list.forEach((op) => {
    const half = (Number(op.widthMm) || 0) / 2;
    const c = Number(op.alongMm);
    if (!Number.isFinite(c)) return;
    const edgeA = c - half;
    const edgeB = c + half;
    const d = Math.min(Math.abs(alongMm - edgeA), Math.abs(alongMm - edgeB), Math.abs(alongMm - c));
    if (d < bestDist) {
      bestDist = d;
      best = op;
    }
  });
  return best;
}

/**
 * Подписи полей отступов в модалке секции.
 * Без проёма на стене — как раньше («слева/справа»).
 * У открытого торца пролёта — «Отступ от двери/окна» (универсально «проёма»).
 *
 * @returns {{
 *   left: string,
 *   right: string,
 *   hasOpeningEnds: boolean,
 *   doorUiSide: 'left'|'right'|null,
 *   wallUiSide: 'left'|'right'|null,
 *   doorLabel: string|null,
 *   wallLabel: string|null,
 * }}
 *   left/right — уже для UI (для front учтён зеркальный swap).
 *   doorUiSide/wallUiSide — какой UI-край к проёму / к стене (для порядка строк в модалке).
 */
export function getSectionOffsetFieldLabels(sectionData, room, openings) {
  const wallName = sectionData?.wallName || 'back';
  const open = getSectionSpanOpenEnds(sectionData, room);
  const hasOpeningEnds = !!(open.openMin || open.openMax);
  const defaults = {
    left: 'Отступ слева',
    right: 'Отступ справа',
    hasOpeningEnds: false,
    doorUiSide: null,
    wallUiSide: null,
    doorLabel: null,
    wallLabel: null,
  };
  if (!hasOpeningEnds) return defaults;

  const a = Number(sectionData.spanAlongA);
  const b = Number(sectionData.spanAlongB);
  const ops = openingsOnWall(openings, wallName);
  const labelMin = open.openMin
    ? openingOffsetLabel(nearestOpeningAtAlong(ops, a))
    : null;
  const labelMax = open.openMax
    ? openingOffsetLabel(nearestOpeningAtAlong(ops, b))
    : null;

  /** UI left/right ↔ openMin/openMax зависит от стены. */
  let uiOpenLeft = false;
  let uiOpenRight = false;
  let left;
  let right;
  if (wallName === 'back') {
    left = labelMin || 'Отступ слева';
    right = labelMax || 'Отступ справа';
    uiOpenLeft = !!open.openMin;
    uiOpenRight = !!open.openMax;
  } else if (wallName === 'front') {
    // UI зеркалит: «слева» = logical right (max), «справа» = logical left (min).
    left = labelMax || 'Отступ слева';
    right = labelMin || 'Отступ справа';
    uiOpenLeft = !!open.openMax;
    uiOpenRight = !!open.openMin;
  } else if (wallName === 'right') {
    // UI: слева = front (min), справа = back (max).
    left = labelMin || 'Отступ слева';
    right = labelMax || 'Отступ справа';
    uiOpenLeft = !!open.openMin;
    uiOpenRight = !!open.openMax;
  } else {
    // left wall UI: слева = back (max), справа = front (min).
    left = labelMax || 'Отступ слева';
    right = labelMin || 'Отступ справа';
    uiOpenLeft = !!open.openMax;
    uiOpenRight = !!open.openMin;
  }

  // Один открытый торец у двери/окна → второй край = стена (слева или справа).
  let doorUiSide = null;
  let wallUiSide = null;
  if (uiOpenLeft && !uiOpenRight) {
    doorUiSide = 'left';
    wallUiSide = 'right';
  } else if (uiOpenRight && !uiOpenLeft) {
    doorUiSide = 'right';
    wallUiSide = 'left';
  }

  const doorLabel =
    doorUiSide === 'left' ? left : doorUiSide === 'right' ? right : null;
  const wallLabel =
    wallUiSide === 'left'
      ? 'Отступ слева'
      : wallUiSide === 'right'
        ? 'Отступ справа'
        : null;

  return {
    left,
    right,
    hasOpeningEnds: true,
    doorUiSide,
    wallUiSide,
    doorLabel,
    wallLabel,
  };
}

/**
 * Третье поле модалки: расстояние от дальней стены комнаты до края секции у проёма
 * (внутри уже ширина двери/окна + соседний пролёт).
 * Редактируется вместе с «Отступ от двери» — один зазор у проёма.
 *
 * @param {object} sectionData
 * @param {object} room
 * @param {{ leftMm?: number, rightMm?: number, frontMm?: number, backMm?: number }} alongMm
 * @returns {{
 *   label: string,
 *   valueCm: number,
 *   baseMm: number,
 *   doorEnd: 'min'|'max',
 *   doorUiSide: 'left'|'right',
 * } | null}
 */
export function getFarRoomWallOffsetInfo(sectionData, room, alongMm = {}) {
  const open = getSectionSpanOpenEnds(sectionData, room);
  if (!open.openMin && !open.openMax) return null;
  if (open.openMin && open.openMax) return null;

  const wallName = sectionData?.wallName || 'back';
  const len = wallLengthMm(room, wallName);
  const a = Number(sectionData.spanAlongA) || 0;
  const b = Number(sectionData.spanAlongB) || len;
  const isFB = wallName === 'front' || wallName === 'back';
  const minMm = Math.max(0, Number(isFB ? alongMm.leftMm : alongMm.frontMm) || 0);
  const maxMm = Math.max(0, Number(isFB ? alongMm.rightMm : alongMm.backMm) || 0);

  // UI-сторона двери (как в getSectionOffsetFieldLabels).
  let doorUiSide = null;
  if (wallName === 'back' || wallName === 'right') {
    doorUiSide = open.openMin ? 'left' : 'right';
  } else if (wallName === 'front') {
    doorUiSide = open.openMax ? 'left' : 'right';
  } else {
    // left wall
    doorUiSide = open.openMax ? 'left' : 'right';
  }

  if (open.openMin && !open.openMax) {
    const baseMm = a;
    return {
      label: isFB ? 'Отступ от левой стены' : 'Отступ от передней стены',
      valueCm: (baseMm + minMm) / 10,
      baseMm,
      doorEnd: 'min',
      doorUiSide,
    };
  }
  // openMax only
  const baseMm = Math.max(0, len - b);
  return {
    label: isFB ? 'Отступ от правой стены' : 'Отступ от задней стены',
    valueCm: (baseMm + maxMm) / 10,
    baseMm,
    doorEnd: 'max',
    doorUiSide,
  };
}

function formatSpanLengthCm(mm) {
  const n = Number(mm);
  if (!Number.isFinite(n)) return '0 см';
  return (Math.round(n) / 10).toFixed(1).replace('.', ',') + ' см';
}

/**
 * Подписи пролётов для UI.
 */
function labelForSpan(spanIndex, spans, openingsOnWall) {
  const n = spans.length;
  const span = spans[spanIndex];
  const lenLabel = formatSpanLengthCm(span.alongB - span.alongA);
  if (n === 1) return `Вся стена · ${lenLabel}`;

  const ops = (openingsOnWall || []).slice().sort((a, b) => a.alongMm - b.alongMm);
  if (n === 2 && ops.length >= 1) {
    const side = spanIndex === 0 ? 'Слева' : 'Справа';
    return `${side} от ${openingNoun(ops[0])} · ${lenLabel}`;
  }
  if (spanIndex === 0) return `Слева · ${lenLabel}`;
  if (spanIndex === n - 1) return `Справа · ${lenLabel}`;
  return `Между проёмами · ${lenLabel}`;
}

/**
 * @param {object} room
 * @param {'front'|'back'|'left'|'right'} wallName
 * @param {Array} openings all room openings
 * @param {{ minPlaceMm?: number, clearanceMm?: number }} [opts]
 * @returns {Array<{id:string, wallName:string, alongA:number, alongB:number, lengthMm:number, label:string, tooNarrow:boolean, placeable:boolean}>}
 */
export function computeWallSolidSpans(room, wallName, openings, opts = {}) {
  const len = wallLengthMm(room, wallName);
  const clearanceMm =
    Number.isFinite(opts.clearanceMm) && opts.clearanceMm >= 0
      ? opts.clearanceMm
      : OPENING_CLEARANCE_MM;
  const minPlaceMm =
    Number.isFinite(opts.minPlaceMm) && opts.minPlaceMm > 0 ? opts.minPlaceMm : 300;

  const onWall = (openings || []).filter((o) => o && o.wallName === wallName);
  const { solids } = solidIntervalsAlong(len, onWall, clearanceMm);

  const raw = solids.map((s, i) => {
    const alongA = s.a;
    const alongB = s.b;
    const lengthMm = alongB - alongA;
    return {
      id: `${wallName}-span-${i}`,
      wallName,
      index: i,
      alongA,
      alongB,
      lengthMm,
      tooNarrow: lengthMm < minPlaceMm,
      placeable: lengthMm >= minPlaceMm,
      label: '',
    };
  });

  raw.forEach((sp, i) => {
    sp.label = labelForSpan(i, raw, onWall);
  });
  // Мост удалён — только обычные сплошные пролёты.
  return raw;
}

/**
 * Мост удалён — under-window как отдельный пролёт не создаём.
 */
export function appendUnderWindowSpans(room, wallName, spans) {
  return Array.isArray(spans) ? spans.slice() : [];
}

function sectionAlongIntervalMm(sectionData, room) {
  const a = Number(sectionData?.spanAlongA);
  const b = Number(sectionData?.spanAlongB);
  if (Number.isFinite(a) && Number.isFinite(b) && b - a > 1) {
    return { a, b };
  }
  // Fallback: по позиции и размеру вдоль стены.
  const wallName = sectionData?.wallName || 'back';
  const size = sectionData?.size || {};
  const g = sectionData?.group;
  if (!g || !room) return null;
  const pos = g.position;
  if (wallName === 'back') {
    const w = Number(size.x) || 0;
    return { a: pos.x, b: pos.x + w };
  }
  if (wallName === 'front') {
    const w = Number(size.x) || 0;
    return { a: pos.x - w, b: pos.x };
  }
  if (wallName === 'left') {
    const d = Number(size.z) || 0;
    return { a: pos.z - d, b: pos.z };
  }
  if (wallName === 'right') {
    const d = Number(size.z) || 0;
    return { a: pos.z, b: pos.z + d };
  }
  return null;
}

function intervalsOverlapMm(a0, a1, b0, b1, eps = 5) {
  return !(a1 <= b0 + eps || a0 >= b1 - eps);
}

export function isCornerLayoutSection(sectionData) {
  if (!sectionData) return false;
  if (sectionData.group?.userData?.isCornerSection) return true;
  const t = String(sectionData.lShape?.type || '');
  if (!t) return false;
  return (
    t.startsWith('corner-') ||
    t === 'top-right' ||
    t === 'top-left' ||
    t === 'corner-wardrobe' ||
    t === 'corner-wardrobe-left'
  );
}

/**
 * Занятость пролётов при постановке (тип секции не важен — прямая и угол одинаково).
 * Занятый пролёт не placeable; ≥2 свободных → chooser; 1 свободный → без вариантов.
 *
 * @param {Array} spans
 * @param {{ wallName: string, sections?: Array }} opts
 * @returns {{
 *   spans: Array,
 *   allowBoth: boolean,
 *   freeCount: number,
 * }}
 */
export function applyPlacementConstraintsToSpans(spans, opts = {}) {
  const wallName = opts.wallName;
  const sections = Array.isArray(opts.sections) ? opts.sections : [];
  const room = opts.room || null;
  const onWall = sections.filter(
    (s) => s && String(s.wallName || '') === String(wallName || '')
  );

  const occupiedBy = (span) =>
    onWall.some((sec) => {
      const iv = sectionAlongIntervalMm(sec, room);
      if (!iv) return false;
      return intervalsOverlapMm(iv.a, iv.b, span.alongA, span.alongB);
    });

  const out = (spans || []).map((s) => {
    const busy = occupiedBy(s);
    const baseLabel = String(s.label || '');
    return {
      ...s,
      occupied: busy,
      placeable: !!s.placeable && !busy,
      tooNarrow: !!(s.tooNarrow || busy),
      label: busy
        ? baseLabel.includes('(занято)')
          ? baseLabel
          : `${baseLabel} (занято)`
        : baseLabel,
    };
  });

  const free = out.filter((s) => s.placeable);
  return {
    spans: out,
    allowBoth: free.length >= 2,
    freeCount: free.length,
  };
}

/**
 * Мин. ширина пролёта для постановки секции (single_min_mm из шага 4).
 */
export function getMinPlaceMmFromRoomConfig() {
  try {
    if (typeof window !== 'undefined' && typeof window.getRoomStepsConfig === 'function') {
      const cfg = window.getRoomStepsConfig();
      const s4 = cfg?.steps?.find((s) => s.stepId === 4);
      const sd = s4?.section_division;
      const single = Number(sd?.single_min_mm);
      if (Number.isFinite(single) && single > 0) return single;
      const m = Number(sd?.min_mm);
      if (Number.isFinite(m) && m > 0) return Math.min(m, 300);
    }
  } catch (_) {}
  return 300;
}

/**
 * Размеры pending-секции и локальный пивот (относительно room.group) для пролёта.
 * @returns {{ width:number, height:number, depth:number, finalX:number, finalY:number, finalZ:number, alongSize:number }}
 */
export function spanToSectionPose(room, wallName, span, heightMm = null) {
  const cap = Number(span?.maxHeightMm);
  const requested =
    Number.isFinite(heightMm) && heightMm > 0
      ? Number(heightMm)
      : Number.isFinite(cap) && cap > 0
        ? cap
        : room.height;
  const h =
    Number.isFinite(cap) && cap > 0 ? Math.min(requested, cap) : requested;
  const a = Number(span.alongA) || 0;
  const b = Number(span.alongB) || 0;
  const alongSize = Math.max(1, b - a);
  const niche = 600;
  const gap = WALL_GAP_MM;

  if (wallName === 'back') {
    return {
      width: alongSize,
      height: h,
      depth: niche,
      finalX: a,
      finalY: 0,
      finalZ: gap,
      alongSize,
    };
  }
  if (wallName === 'front') {
    return {
      width: alongSize,
      height: h,
      depth: niche,
      finalX: b,
      finalY: 0,
      finalZ: room.depth - gap,
      alongSize,
    };
  }
  if (wallName === 'left') {
    return {
      width: niche,
      height: h,
      depth: alongSize,
      finalX: gap,
      finalY: 0,
      finalZ: b,
      alongSize,
    };
  }
  // right
  return {
    width: niche,
    height: h,
    depth: alongSize,
    finalX: room.width,
    finalY: 0,
    finalZ: a,
    alongSize,
  };
}

/**
 * База длины вдоль стены для updateSectionSize с учётом сохранённого пролёта.
 */
export function sectionAlongBaseMm(sectionData, room) {
  const wallName = sectionData?.wallName || 'back';
  const a = Number(sectionData?.spanAlongA);
  const b = Number(sectionData?.spanAlongB);
  if (Number.isFinite(a) && Number.isFinite(b) && b - a > 1) return b - a;
  return wallLengthMm(room, wallName);
}

/**
 * Пивот секции в локали комнаты при offsets (см) внутри пролёта.
 */
export function sectionPivotFromSpanOffsets(sectionData, room, offsetsCm, extentAlongMm, endCabStartMm, endCabEndMm) {
  const wallName = sectionData?.wallName || 'back';
  const gap = WALL_GAP_MM;
  const spanA = Number.isFinite(sectionData?.spanAlongA)
    ? Number(sectionData.spanAlongA)
    : 0;
  const spanB = Number.isFinite(sectionData?.spanAlongB)
    ? Number(sectionData.spanAlongB)
    : wallLengthMm(room, wallName);

  const left = (offsetsCm.left ?? 0) * 10;
  const right = (offsetsCm.right ?? 0) * 10;
  const front = (offsetsCm.front ?? 0) * 10;
  const back = (offsetsCm.back ?? 0) * 10;
  const bottom = (offsetsCm.bottom ?? 0) * 10;

  if (wallName === 'back') {
    return {
      finalX: spanA + left + (endCabStartMm || 0),
      finalY: bottom,
      finalZ: gap,
    };
  }
  if (wallName === 'front') {
    return {
      finalX: spanB - right - (endCabEndMm || 0),
      finalY: bottom,
      finalZ: room.depth - gap,
    };
  }
  if (wallName === 'left') {
    return {
      finalX: gap,
      finalY: bottom,
      finalZ: spanA + front + (endCabStartMm || 0) + extentAlongMm,
    };
  }
  // right: startCab = front end
  return {
    finalX: room.width,
    finalY: bottom,
    finalZ: spanA + front + (endCabStartMm || 0),
  };
}

/**
 * Пролёт под курсором (по alongMm пересечения со стеной).
 */
export function pickSpanAtAlong(spans, alongMm) {
  const list = (spans || []).filter((s) => s && s.placeable);
  if (!list.length) return null;
  for (let i = 0; i < list.length; i++) {
    const s = list[i];
    if (alongMm >= s.alongA - 0.5 && alongMm <= s.alongB + 0.5) return s;
  }
  let best = list[0];
  let bestDist = Infinity;
  list.forEach((s) => {
    const mid = (s.alongA + s.alongB) / 2;
    const d = Math.abs(mid - alongMm);
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  });
  return best;
}

/**
 * Кандидат: одна секция через окно с профилем высоты (полный | sill | полный).
 * Не мост — обычная секция + trim по полосам.
 * @returns {object|null}
 */
export function findWallWindowHeightProfile(room, wallName, spans, openings, opts = {}) {
  if (!room || !wallName) return null;
  const minSill =
    Number.isFinite(opts.minSillMm) && opts.minSillMm > 0
      ? opts.minSillMm
      : WINDOW_BRIDGE_MIN_SILL_MM;
  const minPlaceMm =
    Number.isFinite(opts.minPlaceMm) && opts.minPlaceMm > 0
      ? opts.minPlaceMm
      : 300;

  const placeable = (spans || [])
    .filter((s) => s && s.placeable && !s.kind)
    .slice()
    .sort((a, b) => (Number(a.alongA) || 0) - (Number(b.alongA) || 0));
  if (placeable.length < 2) return null;

  const windows = (openings || []).filter(
    (op) =>
      op &&
      String(op.wallName || '') === String(wallName) &&
      String(op.type || '') === 'window'
  );
  if (!windows.length) return null;

  for (let i = 0; i < placeable.length - 1; i++) {
    const left = placeable[i];
    const right = placeable[i + 1];
    const gapA = Number(left.alongB);
    const gapB = Number(right.alongA);
    if (!(gapB - gapA > 1)) continue;

    const win = windows.find((op) => {
      const half = (Number(op.widthMm) || 0) / 2;
      const c = Number(op.alongMm);
      if (!Number.isFinite(c) || half <= 0) return false;
      const wa = c - half;
      const wb = c + half;
      return c >= gapA - 1 && c <= gapB + 1 && wa >= gapA - 40 && wb <= gapB + 40;
    });
    if (!win) continue;

    const sillMm = Math.max(0, Number(win.sillMm) || 0);
    if (sillMm < minSill) continue;
    if (left.lengthMm < minPlaceMm || right.lengthMm < minPlaceMm) continue;

    const alongA = Number(left.alongA);
    const alongB = Number(right.alongB);
    const lengthMm = alongB - alongA;
    if (!(lengthMm > 1)) continue;

    const roomH = Number(room.height) || 2500;
    const heightBands = [
      { alongA, alongB: gapA, heightMm: roomH, role: 'tall-left' },
      { alongA: gapA, alongB: gapB, heightMm: sillMm, role: 'under-window' },
      { alongA: gapB, alongB, heightMm: roomH, role: 'tall-right' },
    ];

    return {
      id: `${wallName}-height-profile-${i}`,
      kind: 'height-profile',
      wallName,
      alongA,
      alongB,
      lengthMm,
      placeable: true,
      tooNarrow: false,
      label: `Вдоль стены с окном · ${formatSpanLengthCm(lengthMm)}`,
      heightBands,
      sillMm,
      notchAlongA: gapA,
      notchAlongB: gapB,
      sourceSpanIds: [left.id, right.id],
    };
  }
  return null;
}

/** Позы призрака по полосам высоты. */
export function heightBandsToPoses(room, wallName, heightBands, heightFallbackMm = null) {
  const bands = Array.isArray(heightBands) ? heightBands : [];
  return bands
    .map((band) => {
      if (!band) return null;
      const h =
        Number.isFinite(band.heightMm) && band.heightMm > 0
          ? band.heightMm
          : heightFallbackMm;
      const pose = spanToSectionPose(
        room,
        wallName,
        { alongA: band.alongA, alongB: band.alongB },
        h
      );
      return { band, pose };
    })
    .filter((x) => x && x.pose && x.pose.alongSize > 1);
}

/**
 * @deprecated мост удалён — используй findWallWindowHeightProfile
 * @returns {null}
 */
export function findWindowBridgeCandidate() {
  return null;
}

export function alongFromRoomLocal(wallName, local) {
  if (wallName === 'front' || wallName === 'back') return local.x;
  return local.z;
}

/**
 * Открытые торцы пролёта (не угол комнаты) → боковая накладка, как при отступе.
 * @returns {{ openMin: boolean, openMax: boolean }}
 *   front/back: openMin=лево (меньший along), openMax=право
 *   left/right: openMin=front (меньший along/Z), openMax=back
 */
export function getSectionSpanOpenEnds(sectionData, room) {
  const wallName = sectionData?.wallName || 'back';
  const a = Number(sectionData?.spanAlongA);
  const b = Number(sectionData?.spanAlongB);
  const eps = 5;
  if (!Number.isFinite(a) || !Number.isFinite(b) || b - a < 1 || !room) {
    return { openMin: false, openMax: false };
  }
  const len = wallLengthMm(room, wallName);
  return {
    openMin: a > eps,
    openMax: b < len - eps,
  };
}

if (typeof window !== 'undefined') {
  window.__cldComputeWallSolidSpans = computeWallSolidSpans;
  window.__cldFindWallWindowHeightProfile = findWallWindowHeightProfile;
}
