/**
 * Реестр ролей обклада секции (планки/накладки комнаты).
 * Ключ trimPartKey — связь админки «Управление комнатой 2 → Обклад» и рантайма.
 */

/** Подписи сторон кромкования по схеме каталога (constructor-clodis). */
export const TRIM_EDGE_SIDE_LABELS = {
  f: { 1: 'низ', 2: 'верх', 3: 'лево', 4: 'право' },
  v: { 1: 'низ', 2: 'верх', 3: 'зад', 4: 'перед' },
  h: { 1: 'зад', 2: 'перед', 3: 'лево', 4: 'право' },
};

/** Старые ключи localStorage → новые роли. */
export const TRIM_LEGACY_KEY_ALIASES = {
  top_plank: 'top_plank_facade',
  bottom_plank: 'bottom_plank_facade',
};

export const TRIM_PART_LIST = [
  {
    key: 'top_plank_facade',
    label: 'Верхняя планка (фасадная секция)',
    meshNames: ['TopPlank'],
    previewOrientation: 'h',
    edgeOrientation: 'f',
    roomWall: 'front',
  },
  {
    key: 'top_plank_side',
    label: 'Верхняя планка (приставная секция углового)',
    meshNames: ['TopPlank'],
    previewOrientation: 'h',
    edgeOrientation: 'f',
    roomWall: 'side',
  },
  {
    key: 'bottom_plank_facade',
    label: 'Цоколь (основная прямая секция)',
    meshNames: ['BottomPlank'],
    previewOrientation: 'h',
    edgeOrientation: 'f',
    roomWall: 'front',
  },
  {
    key: 'bottom_plank_side',
    label: 'Цоколь (приставная угловой)',
    meshNames: ['BottomPlank'],
    previewOrientation: 'h',
    edgeOrientation: 'f',
    roomWall: 'side',
  },
  { key: 'side_plank_left', label: 'Боковая планка (левая, прямой-угловой)', meshNames: ['SidePlankLeft'], previewOrientation: 'v', edgeOrientation: 'f' },
  { key: 'side_plank_right', label: 'Боковая планка правая (угловой приставной)', meshNames: ['SidePlankRight'], previewOrientation: 'v', edgeOrientation: 'f' },
  { key: 'side_plank_front', label: 'Боковая планка (передняя)', meshNames: ['SidePlankFront'], previewOrientation: 'v', edgeOrientation: 'f' },
  { key: 'side_plank_back', label: 'Боковая планка (задняя)', meshNames: ['SidePlankBack'], previewOrientation: 'v', edgeOrientation: 'f' },
  // front/back: 16×H×D — кромка v (торцы по Y/Z, пласть ±X)
  { key: 'side_overlay_left', label: 'Накладка (левая)', meshNames: ['SideOverlayLeft'], previewOrientation: 'f', edgeOrientation: 'v' },
  { key: 'side_overlay_right', label: 'Накладка (правая)', meshNames: ['SideOverlayRight'], previewOrientation: 'f', edgeOrientation: 'v' },
  // left/right стены: W×H×16 — кромка f (торцы по X/Y, пласть ±Z)
  { key: 'side_overlay_front', label: 'Накладка (передняя)', meshNames: ['SideOverlayFront'], previewOrientation: 'f', edgeOrientation: 'f' },
  { key: 'side_overlay_back', label: 'Накладка (задняя)', meshNames: ['SideOverlayBack'], previewOrientation: 'f', edgeOrientation: 'f' },
  { key: 'top_plank_segment', label: 'Сегмент верхней планки (переход)', meshNames: [], previewOrientation: 'h', edgeOrientation: 'f' },
  {
    key: 'transition_side_cap',
    label: 'Накладка стык шкаф↔тумба (16 мм)',
    meshNames: ['TransitionSideCap'],
    previewOrientation: 'v',
    edgeOrientation: 'v',
  },
  {
    key: 'transition_top_cap',
    label: 'Крышка тумбы (переход шкаф↔тумба)',
    meshNames: ['TransitionTopCap', 'TransitionAutoTopCap'],
    previewOrientation: 'h',
    edgeOrientation: 'h',
  },
  {
    key: 'end_cabinet_facade_overlay_whole',
    label: 'Торцевой — накладка (цельный фасад ряда)',
    meshNames: [],
    previewOrientation: 'v',
    edgeOrientation: 'v',
  },
  {
    key: 'end_cabinet_facade_overlay_main',
    label: 'Торцевой — накладка (основная полоса)',
    meshNames: [],
    previewOrientation: 'v',
    edgeOrientation: 'v',
  },
  {
    key: 'end_cabinet_facade_overlay_top',
    label: 'Торцевой — накладка (антresоль)',
    meshNames: [],
    previewOrientation: 'v',
    edgeOrientation: 'v',
  },
  {
    key: 'end_cabinet_top_plank',
    label: 'Торцевой — верхняя планка',
    meshNames: [],
    previewOrientation: 'h',
    edgeOrientation: 'v',
  },
  {
    key: 'end_cabinet_plinth',
    label: 'Торцевой — цоколь',
    meshNames: [],
    previewOrientation: 'h',
    edgeOrientation: 'v',
  },
];

/** Порядковый № детали обклада (1…N) — как в админке «Обклад» и на метках в комнате. */
export const TRIM_PART_NUMBER_BY_KEY = Object.fromEntries(
  TRIM_PART_LIST.map((row, index) => [row.key, index + 1])
);

export function getTrimPartNumber(trimPartKey) {
  if (!trimPartKey) return null;
  const n = TRIM_PART_NUMBER_BY_KEY[normalizeTrimPartKey(String(trimPartKey))];
  return Number.isFinite(n) ? n : null;
}

export function getTrimPartRowByKey(trimPartKey) {
  const key = normalizeTrimPartKey(String(trimPartKey || ''));
  return TRIM_PART_LIST.find((r) => r.key === key) || null;
}

/** «12 · Крышка тумбы…» для списка админки; short=true → только «12». */
export function formatTrimPartNumberLabel(trimPartKey, short = false) {
  const n = getTrimPartNumber(trimPartKey);
  if (!n) return null;
  if (short) return String(n);
  const row = getTrimPartRowByKey(trimPartKey);
  return `${n} · ${row?.label || trimPartKey}`;
}

/** Константы геометрии обклада в комнате (section-manager.js). */
export const TRIM_GEOM_MM = {
  plankThickness: 16,
  topPlankHeight: 50,
  bottomPlankHeight: 100,
  sidePlankWidth: 50,
  sectionHeight: 2200,
  sectionDepth: 600,
  sectionWidth: 1000,
};

/** Высота полосы антresоли в превью обkлада торцевого (основная / верх). */
const END_CABINET_PREVIEW_ANTRESOL_MM = 360;

/** Как в addSidePlanksIfNeeded: ≤5 мм — планка, >5 мм — накладка. */
export const TRIM_ROOM_GAP_THRESHOLD_MM = 5;

export const TRIM_DEFAULT_SECTION = {
  width: TRIM_GEOM_MM.sectionWidth,
  height: TRIM_GEOM_MM.sectionHeight,
  depth: TRIM_GEOM_MM.sectionDepth,
};

export function trimNeedsOverlayForGapMm(gapMm) {
  return Number(gapMm) > TRIM_ROOM_GAP_THRESHOLD_MM;
}

export function trimNeedsPlankForGapMm(gapMm) {
  return Number(gapMm) <= TRIM_ROOM_GAP_THRESHOLD_MM;
}

/**
 * Семантика превью: width/height/depth в конфиге = оси BoxGeometry в админ-превью.
 * Подписи полей и камера зависят от previewOrientation (h / v / f).
 */
const PREVIEW_PROFILE_BY_KEY = {
  top_plank_facade: {
    orientation: 'h',
    previewToolbarMode: 'top',
    labels: ['Ширина секции', 'Высота планки', 'Толщина ЛДСП'],
    defaults: { width: TRIM_GEOM_MM.sectionWidth, height: TRIM_GEOM_MM.topPlankHeight, depth: TRIM_GEOM_MM.plankThickness },
    lock: { height: TRIM_GEOM_MM.topPlankHeight, depth: TRIM_GEOM_MM.plankThickness },
    hint: 'Секция на передней/задней стене:  ширина×50×16 мм у проёма, между боковыми планками/накладками.',
    view: 'front',
  },
  top_plank_side: {
    orientation: 'h',
    previewToolbarMode: 'top_side',
    labels: ['Глубина секции', 'Высота планки', 'Толщина ЛДСП'],
    defaults: { width: TRIM_GEOM_MM.sectionDepth, height: TRIM_GEOM_MM.topPlankHeight, depth: TRIM_GEOM_MM.plankThickness },
    lock: { height: TRIM_GEOM_MM.topPlankHeight, depth: TRIM_GEOM_MM.plankThickness },
    hint: 'Как в комнате: 16×50×глубина у фасада приставной секции. Кромки 1–4 — как у фасадной верхней планки (низ/верх/лево/право).',
    view: 'edge',
    previewWall: 'side',
  },
  bottom_plank_facade: {
    orientation: 'h',
    previewToolbarMode: 'top',
    labels: ['Ширина секции', 'Высота планки', 'Толщина ЛДСП'],
    defaults: { width: TRIM_GEOM_MM.sectionWidth, height: TRIM_GEOM_MM.bottomPlankHeight, depth: TRIM_GEOM_MM.plankThickness },
    lock: { height: TRIM_GEOM_MM.bottomPlankHeight, depth: TRIM_GEOM_MM.plankThickness },
    hint: 'Цоколь у пола (передняя/задняя стена): ширина×100×16 мм — как BOTTOM_PLANK_HEIGHT_MM в комнате.',
    view: 'front',
  },
  bottom_plank_side: {
    orientation: 'h',
    previewToolbarMode: 'top_side',
    labels: ['Глубина секции', 'Высота планки', 'Толщина ЛДСП'],
    defaults: { width: TRIM_GEOM_MM.sectionDepth, height: TRIM_GEOM_MM.bottomPlankHeight, depth: TRIM_GEOM_MM.plankThickness },
    lock: { height: TRIM_GEOM_MM.bottomPlankHeight, depth: TRIM_GEOM_MM.plankThickness },
    hint: 'Как в комнате: цоколь 16×100×глубина у фасада приставной секции; кромки — как у цоколя основной прямой секции.',
    view: 'edge',
    previewWall: 'side',
  },
  top_plank_segment: {
    orientation: 'h',
    previewToolbarMode: 'top',
    labels: ['Длина сегмента', 'Высота планки', 'Толщина ЛДСП'],
    defaults: { width: 600, height: TRIM_GEOM_MM.topPlankHeight, depth: TRIM_GEOM_MM.plankThickness },
    lock: { depth: TRIM_GEOM_MM.plankThickness },
    hint: 'Кусок верхней планки (переход/низкая мебель) — те же пропорции, короче по длине.',
    view: 'front',
  },
  transition_top_cap: {
    orientation: 'h',
    previewToolbarMode: 'top',
    labels: ['Ширина вдоль стены', 'Толщина плиты', 'Глубина в комнату'],
    defaults: { width: 600, height: TRIM_GEOM_MM.plankThickness, depth: TRIM_GEOM_MM.sectionDepth },
    lock: { height: TRIM_GEOM_MM.plankThickness },
    hint: 'Горизонтальная крышка тумбы (16 мм): кромка на торцах (1–4), не на верхней/нижней пласти.',
    view: 'front',
  },
  side_plank_left: {
    orientation: 'v',
    previewToolbarMode: 'section',
    labels: ['Ширина секции', 'Высота секции', 'Глубина секции'],
    defaults: { width: TRIM_GEOM_MM.sectionWidth, height: TRIM_GEOM_MM.sectionHeight, depth: TRIM_GEOM_MM.sectionDepth },
    lock: {},
    hint:
      'Поля выше — габарит секции (силуэт). Деталь в превью: 50 × высота секции × 16 мм, вертикально у левого края у проёма. В комнате — при отступе слева ≤5 мм.',
    view: 'front',
    roomPlankKey: 'side_plank_left',
    roomOverlayKey: 'side_overlay_left',
  },
  side_plank_right: {
    orientation: 'v',
    previewToolbarMode: 'section',
    labels: ['Ширина секции', 'Высота секции', 'Глубина секции'],
    defaults: { width: TRIM_GEOM_MM.sectionWidth, height: TRIM_GEOM_MM.sectionHeight, depth: TRIM_GEOM_MM.sectionDepth },
    lock: {},
    hint:
      'Поля выше — габарит секции (силуэт). Деталь в превью: 50 × высота секции × 16 мм, вертикально у правого края у проёма. В комнате — при отступе справа ≤5 мм.',
    view: 'front',
    roomPlankKey: 'side_plank_right',
    roomOverlayKey: 'side_overlay_right',
  },
  side_plank_front: {
    orientation: 'v',
    previewToolbarMode: 'section',
    labels: ['Ширина секции', 'Высота секции', 'Глубина секции'],
    defaults: { width: TRIM_GEOM_MM.sectionWidth, height: TRIM_GEOM_MM.sectionHeight, depth: TRIM_GEOM_MM.sectionDepth },
    lock: {},
    hint: 'Боковая стена: планка 16×H×50 у фасада.',
    view: 'edge',
    roomPlankKey: 'side_plank_front',
    roomOverlayKey: 'side_overlay_front',
  },
  side_plank_back: {
    orientation: 'v',
    previewToolbarMode: 'section',
    labels: ['Ширина секции', 'Высота секции', 'Глубина секции'],
    defaults: { width: TRIM_GEOM_MM.sectionWidth, height: TRIM_GEOM_MM.sectionHeight, depth: TRIM_GEOM_MM.sectionDepth },
    lock: {},
    hint: 'Боковая стена: планка на задний торец.',
    view: 'edge',
    roomPlankKey: 'side_plank_back',
    roomOverlayKey: 'side_overlay_back',
  },
  side_overlay_left: {
    orientation: 'f',
    previewToolbarMode: 'section',
    labels: ['Ширина секции', 'Высота секции', 'Глубина секции'],
    defaults: { width: TRIM_GEOM_MM.sectionWidth, height: TRIM_GEOM_MM.sectionHeight, depth: TRIM_GEOM_MM.sectionDepth },
    lock: {},
    hint: 'Комната при отступе >5 мм: накладка 16×H×depth секции по центру глубины (как шкаф в лицо).',
    view: 'face',
    roomPlankKey: 'side_plank_left',
    roomOverlayKey: 'side_overlay_left',
  },
  side_overlay_right: {
    orientation: 'f',
    previewToolbarMode: 'section',
    labels: ['Ширина секции', 'Высота секции', 'Глубина секции'],
    defaults: { width: TRIM_GEOM_MM.sectionWidth, height: TRIM_GEOM_MM.sectionHeight, depth: TRIM_GEOM_MM.sectionDepth },
    lock: {},
    hint:
      'Комната при отступе справа >5 мм: накладка 16×H×глубина секции по центру глубины. Планка справа — только при отступе ≤5 мм.',
    view: 'face',
    roomPlankKey: 'side_plank_right',
    roomOverlayKey: 'side_overlay_right',
  },
  side_overlay_front: {
    orientation: 'f',
    previewToolbarMode: 'section',
    labels: ['Ширина секции', 'Высота секции', 'Глубина секции'],
    defaults: { width: TRIM_GEOM_MM.sectionWidth, height: TRIM_GEOM_MM.sectionHeight, depth: TRIM_GEOM_MM.sectionDepth },
    lock: {},
    hint: 'Боковая стена: накладка width×H×16 на торец (вся ширина и высота секции).',
    view: 'face',
    previewWall: 'side',
    roomPlankKey: 'side_plank_front',
    roomOverlayKey: 'side_overlay_front',
  },
  side_overlay_back: {
    orientation: 'f',
    previewToolbarMode: 'section',
    labels: ['Ширина секции', 'Высота секции', 'Глубина секции'],
    defaults: { width: TRIM_GEOM_MM.sectionWidth, height: TRIM_GEOM_MM.sectionHeight, depth: TRIM_GEOM_MM.sectionDepth },
    lock: {},
    hint: 'Накладка на задний торец боковой секции.',
    view: 'face',
    previewWall: 'side',
    roomPlankKey: 'side_plank_back',
    roomOverlayKey: 'side_overlay_back',
  },
  end_cabinet_facade_overlay_whole: {
    orientation: 'v',
    previewToolbarMode: 'section',
    labels: ['Ширина секции', 'Высота секции', 'Глубина секции'],
    defaults: {
      width: TRIM_GEOM_MM.sectionWidth,
      height: TRIM_GEOM_MM.sectionHeight,
      depth: TRIM_GEOM_MM.sectionDepth,
    },
    lock: {},
    hint:
      'Боковая накладка торцевого в плоскости фасадов ряда: 16×H×глубина. В комнате активна только одна из трёх позиций ниже — по режиму фасада (цельный / с антresолью).',
    view: 'edge',
  },
  end_cabinet_top_plank: {
    orientation: 'h',
    previewToolbarMode: 'top_side',
    labels: ['Длина вдоль глубины', 'Высота планки', 'Толщина ЛДСП'],
    defaults: {
      width: Math.max(1, TRIM_GEOM_MM.sectionDepth - TRIM_GEOM_MM.plankThickness),
      height: TRIM_GEOM_MM.topPlankHeight,
      depth: TRIM_GEOM_MM.plankThickness,
    },
    lock: { height: TRIM_GEOM_MM.topPlankHeight, depth: TRIM_GEOM_MM.plankThickness },
    hint: 'Верхняя планка торцевого: 16×50×(глубина−16), от стены до передней планки ряда.',
    view: 'edge',
  },
  end_cabinet_plinth: {
    orientation: 'h',
    previewToolbarMode: 'top_side',
    labels: ['Длина вдоль глубины', 'Высота цоколя', 'Толщина ЛДСП'],
    defaults: {
      width: TRIM_GEOM_MM.sectionDepth,
      height: TRIM_GEOM_MM.bottomPlankHeight,
      depth: TRIM_GEOM_MM.plankThickness,
    },
    lock: { height: TRIM_GEOM_MM.bottomPlankHeight, depth: TRIM_GEOM_MM.plankThickness },
    hint: 'Цоколь торцевого у пола: 16×100×длина до боковой планки у стены, в уровень с цоколем ряда.',
    view: 'edge',
  },
};

function normalizeTrimPartKey(key) {
  if (!key) return key;
  return TRIM_LEGACY_KEY_ALIASES[key] || key;
}

/**
 * Подписи 1–4 в конфиге (edgeOrientation f) → физическая грань BoxGeometry в комнате/превью.
 * Не меняет размеры меша — только куда кладётся кромка.
 */
const TRIM_EDGE_STRIP_PHYSICS_MAP = {
  top_plank_side: { 1: ['f', 1], 2: ['f', 2], 3: ['h', 1], 4: ['h', 2] },
  bottom_plank_side: { 1: ['f', 1], 2: ['f', 2], 3: ['h', 1], 4: ['h', 2] },
  // back/front: Box(50×H×16) — пласть ±Z, торцы верх/низ + узкие ±X
  side_plank_left: { 1: ['f', 1], 2: ['f', 2], 3: ['f', 3], 4: ['f', 4] },
  side_plank_right: { 1: ['f', 1], 2: ['f', 2], 3: ['f', 3], 4: ['f', 4] },
  // left/right стены: Box(16×H×50) — пласть ±X, торцы ±Z
  side_plank_front: { 1: ['f', 1], 2: ['f', 2], 3: ['h', 1], 4: ['h', 2] },
  side_plank_back: { 1: ['f', 1], 2: ['f', 2], 3: ['h', 1], 4: ['h', 2] },
  // front/back: 16×H×D — торцы Y/Z (v), не пласть ±X
  side_overlay_left: { 1: ['v', 1], 2: ['v', 2], 3: ['v', 3], 4: ['v', 4] },
  side_overlay_right: { 1: ['v', 1], 2: ['v', 2], 3: ['v', 3], 4: ['v', 4] },
  // left/right: W×H×16 — торцы X/Y (f), не пласть ±Z
  side_overlay_front: { 1: ['f', 1], 2: ['f', 2], 3: ['f', 3], 4: ['f', 4] },
  side_overlay_back: { 1: ['f', 1], 2: ['f', 2], 3: ['f', 3], 4: ['f', 4] },
  end_cabinet_facade_overlay_whole: { 1: ['v', 1], 2: ['v', 2], 3: ['v', 3], 4: ['v', 4] },
  end_cabinet_facade_overlay_main: { 1: ['v', 1], 2: ['v', 2], 3: ['v', 3], 4: ['v', 4] },
  end_cabinet_facade_overlay_top: { 1: ['v', 1], 2: ['v', 2], 3: ['v', 3], 4: ['v', 4] },
  end_cabinet_top_plank: { 1: ['f', 1], 2: ['f', 2], 3: ['h', 1], 4: ['h', 2] },
  end_cabinet_plinth: { 1: ['f', 1], 2: ['f', 2], 3: ['h', 1], 4: ['h', 2] },
};

export function trimPartUsesAxisEdgeInsets(trimPartKey) {
  return !!TRIM_EDGE_STRIP_PHYSICS_MAP[normalizeTrimPartKey(trimPartKey)];
}

function applyInsetToAxes(insets, orientation, edgeNum, thickness) {
  const o = orientation;
  const n = edgeNum;
  const t = thickness;
  if (o === 'f') {
    if (n === 1) insets.yLo = t;
    else if (n === 2) insets.yHi = t;
    else if (n === 3) insets.xLo = t;
    else if (n === 4) insets.xHi = t;
  } else if (o === 'h') {
    if (n === 1) insets.zLo = t;
    else if (n === 2) insets.zHi = t;
    else if (n === 3) insets.xLo = t;
    else if (n === 4) insets.xHi = t;
  } else if (o === 'v') {
    if (n === 1) insets.yLo = t;
    else if (n === 2) insets.yHi = t;
    else if (n === 3) insets.zLo = t;
    else if (n === 4) insets.zHi = t;
  }
}

export function getTrimPartEdgeStripPhysics(trimPartKey, configEdgeNum, boxSize) {
  const key = normalizeTrimPartKey(trimPartKey);
  const n = Number(configEdgeNum);
  if (!Number.isFinite(n) || n < 1 || n > 4) {
    return { orientation: 'f', edgeNum: 1 };
  }
  const row = TRIM_EDGE_STRIP_PHYSICS_MAP[key];
  if (row?.[n]) {
    const [orientation, edgeNum] = row[n];
    return { orientation, edgeNum };
  }
  const orientation = getTrimPartEdgeOrientation(key, boxSize);
  return { orientation, edgeNum: n };
}

/**
 * Превью обклада: боковые планки на передней/задней стене (50×H×16).
 * Торцы 3–4 — по X (лево/право), не по Z (как ошибочно давал TRIM_EDGE_STRIP_PHYSICS_MAP для комнаты).
 */
export function getTrimPartPreviewEdgeStripPhysics(trimPartKey, configEdgeNum) {
  const key = normalizeTrimPartKey(trimPartKey);
  const n = Number(configEdgeNum);
  if (!Number.isFinite(n) || n < 1 || n > 4) return null;
  if (key === 'side_plank_left' || key === 'side_plank_right') {
    return { orientation: 'f', edgeNum: n };
  }
  return null;
}

export function collectTrimEdgeInsetsFromConfig(trimPartKey, edges, isEdgeActive) {
  const insets = { xLo: 0, xHi: 0, yLo: 0, yHi: 0, zLo: 0, zHi: 0 };
  const key = normalizeTrimPartKey(trimPartKey);
  const test =
    typeof isEdgeActive === 'function'
      ? isEdgeActive
      : (_i, ed) => !!(ed && ed.enabled === true);
  for (let i = 1; i <= 4; i++) {
    const ed = edges?.[i] || edges?.[String(i)];
    if (!test(i, ed)) continue;
    let t = 0;
    if (typeof ed.thickness === 'number' && Number.isFinite(ed.thickness)) t = ed.thickness;
    else {
      const parsed = parseFloat(ed.thickness || '0.8');
      t = Number.isFinite(parsed) ? parsed : 0.8;
    }
    const phys = getTrimPartEdgeStripPhysics(key, i);
    applyInsetToAxes(insets, phys.orientation, phys.edgeNum, t);
  }
  return insets;
}

export function shrinkTrimCoreFromAxisInsets(wOuter, hOuter, dOuter, insets) {
  const { xLo, xHi, yLo, yHi, zLo, zHi } = insets;
  return {
    coreW: Math.max(0.001, wOuter - xLo - xHi),
    coreH: Math.max(0.001, hOuter - yLo - yHi),
    coreD: Math.max(0.001, dOuter - zLo - zHi),
    ox: (xLo - xHi) / 2,
    oy: (yLo - yHi) / 2,
    oz: (zLo - zHi) / 2,
  };
}

function profileForKey(key) {
  const k = normalizeTrimPartKey(key);
  if (PREVIEW_PROFILE_BY_KEY[k]) return PREVIEW_PROFILE_BY_KEY[k];
  if (k.startsWith('side_plank')) return PREVIEW_PROFILE_BY_KEY.side_plank_left;
  if (k.startsWith('side_overlay')) return PREVIEW_PROFILE_BY_KEY.side_overlay_left;
  if (k.startsWith('end_cabinet_facade_overlay')) {
    return PREVIEW_PROFILE_BY_KEY.end_cabinet_facade_overlay_whole;
  }
  if (k === 'end_cabinet_plinth') return PREVIEW_PROFILE_BY_KEY.end_cabinet_plinth;
  if (k === 'end_cabinet_top_plank') return PREVIEW_PROFILE_BY_KEY.end_cabinet_top_plank;
  return PREVIEW_PROFILE_BY_KEY.top_plank_facade;
}

function endCabinetOverlayBandHeightMm(key, sectionHeightMm) {
  const sh = Math.max(1, Number(sectionHeightMm) || TRIM_GEOM_MM.sectionHeight);
  const ant = END_CABINET_PREVIEW_ANTRESOL_MM;
  if (key === 'end_cabinet_facade_overlay_top') return Math.min(sh, ant);
  if (key === 'end_cabinet_facade_overlay_main') return Math.max(1, sh - ant);
  return sh;
}

function defaultWallGapForKey(key) {
  if (key && key.startsWith('side_overlay')) return 50;
  if (key && key.startsWith('side_plank')) return 0;
  return 0;
}

function defaultPreviewForKey(key) {
  const p = profileForKey(key);
  const mode = p.previewToolbarMode || 'top';
  const section = { ...TRIM_DEFAULT_SECTION };
  if (mode === 'section') {
    return {
      section,
      wallGapMm: defaultWallGapForKey(key),
      width: section.width,
      height: section.height,
      depth: section.depth,
    };
  }
  const defs = p.defaults || { width: 800, height: 16, depth: 600 };
  return {
    section: {
      width: defs.width || TRIM_DEFAULT_SECTION.width,
      height: TRIM_GEOM_MM.sectionHeight,
      depth: TRIM_GEOM_MM.sectionDepth,
    },
    wallGapMm: defaultWallGapForKey(key),
    ...defs,
  };
}

/**
 * Старые сохранения путали размеры планки (50×2200×16) с полями секции.
 * Для боковых деталей в тулбаре всегда только габарит секции.
 */
export function normalizeTrimPartPreview(trimPartKey, preview) {
  const key = trimPartKey || '';
  const p = { ...(preview || {}) };
  const def = { ...TRIM_DEFAULT_SECTION };
  const prof = profileForKey(key);
  const mode = prof.previewToolbarMode || 'top';

  if (mode !== 'section') {
    return p;
  }

  const sec = { ...(p.section || {}) };
  let w = Number(sec.width);
  let h = Number(sec.height);
  let d = Number(sec.depth);
  if (!Number.isFinite(w)) w = Number(p.width);
  if (!Number.isFinite(h)) h = Number(p.height);
  if (!Number.isFinite(d)) d = Number(p.depth);

  if (h < 400 || d < 200 || w < 400) {
    w = def.width;
    h = def.height;
    d = def.depth;
  }

  p.section = { width: w, height: h, depth: d };
  p.width = w;
  p.height = h;
  p.depth = d;
  return p;
}

/** Габарит секции (силуэт) из preview. */
export function getTrimSectionEnvelope(preview, trimPartKey) {
  const norm = trimPartKey ? normalizeTrimPartPreview(trimPartKey, preview) : preview;
  const g = TRIM_GEOM_MM;
  const sec = norm?.section;
  return {
    width: Math.max(400, Number(sec?.width ?? norm?.width) || g.sectionWidth),
    height: Math.max(400, Number(sec?.height ?? norm?.height) || g.sectionHeight),
    depth: Math.max(200, Number(sec?.depth ?? norm?.depth) || g.sectionDepth),
  };
}

/**
 * Размеры меша в комнате (и в превью) — section-manager.addSidePlanksIfNeeded / addDefaultTopPlank.
 */
export function resolveTrimPartRoomBox(trimPartKey, envelope) {
  const key = trimPartKey || 'top_plank';
  const sw = envelope.width;
  const sh = envelope.height >= 400 ? envelope.height : TRIM_GEOM_MM.sectionHeight;
  const sd = envelope.depth;
  const t = TRIM_GEOM_MM.plankThickness;
  const topH = TRIM_GEOM_MM.topPlankHeight;
  const bottomH = TRIM_GEOM_MM.bottomPlankHeight;
  const plankW = TRIM_GEOM_MM.sidePlankWidth;

  if (key === 'transition_top_cap') {
    return { width: sw, height: t, depth: sd, section: envelope };
  }
  if (key === 'top_plank_facade' || key === 'top_plank_segment' || key === 'top_plank') {
    return { width: sw, height: topH, depth: t, section: envelope };
  }
  if (key === 'bottom_plank_facade' || key === 'bottom_plank') {
    return { width: sw, height: bottomH, depth: t, section: envelope };
  }
  if (key === 'top_plank_side') {
    return { width: t, height: topH, depth: sd, section: envelope };
  }
  if (key === 'bottom_plank_side') {
    return { width: t, height: bottomH, depth: sd, section: envelope };
  }
  if (key === 'end_cabinet_plinth') {
    return {
      width: t,
      height: bottomH,
      depth: Math.max(1, sd - plankW - t),
      section: envelope,
    };
  }
  if (key === 'end_cabinet_top_plank') {
    return { width: t, height: topH, depth: Math.max(1, sd - t), section: envelope };
  }
  if (key === 'side_overlay_left' || key === 'side_overlay_right') {
    return { width: t, height: sh, depth: sd, section: envelope };
  }
  if (key === 'side_overlay_front' || key === 'side_overlay_back') {
    return { width: sw, height: sh, depth: t, section: envelope };
  }
  if (key.startsWith('end_cabinet_facade_overlay')) {
    const bandH = endCabinetOverlayBandHeightMm(key, sh);
    return { width: t, height: bandH, depth: sd, section: envelope };
  }
  if (key.startsWith('side_plank_')) {
    if (key === 'side_plank_front' || key === 'side_plank_back') {
      return { width: t, height: sh, depth: plankW, section: envelope };
    }
    return { width: plankW, height: sh, depth: t, section: envelope };
  }
  return { width: sw, height: sh, depth: t, section: envelope };
}

/** Какую деталь рисует комната при данном отступе (мм). */
export function resolveTrimRoomPartKeyForGap(trimPartKey, gapMm) {
  const prof = profileForKey(trimPartKey);
  if (!prof.roomPlankKey && !prof.roomOverlayKey) return trimPartKey;
  return trimNeedsOverlayForGapMm(gapMm) ? prof.roomOverlayKey || trimPartKey : prof.roomPlankKey || trimPartKey;
}

/** Значения панели превью → section + box детали. */
export function buildTrimPreviewState(trimPartKey, toolbar) {
  const key = normalizeTrimPartKey(trimPartKey);
  const toolbarNorm = normalizeTrimPartPreview(key, toolbar || {});
  const prof = profileForKey(key);
  const mode = prof.previewToolbarMode || 'top';
  const tw = Number(toolbarNorm?.width) || TRIM_DEFAULT_SECTION.width;
  const th = Number(toolbarNorm?.height) || TRIM_DEFAULT_SECTION.height;
  const td = Number(toolbarNorm?.depth) || TRIM_DEFAULT_SECTION.depth;
  const gap = Number(toolbarNorm?.wallGapMm ?? toolbar?.wallGapMm);
  const wallGapMm = Number.isFinite(gap) ? gap : defaultWallGapForKey(key);

  let section;
  if (mode === 'section') {
    section = getTrimSectionEnvelope(toolbarNorm, key);
  } else if (mode === 'top_side') {
    section = {
      width: TRIM_GEOM_MM.sectionWidth,
      height: TRIM_GEOM_MM.sectionHeight,
      depth: tw,
    };
  } else if (mode === 'top') {
    section = { width: tw, height: TRIM_GEOM_MM.sectionHeight, depth: TRIM_GEOM_MM.sectionDepth };
  } else {
    section = { width: tw, height: th, depth: td };
  }

  const roomRenderKey = resolveTrimRoomPartKeyForGap(key, wallGapMm);
  const box = resolveTrimPartRoomBox(roomRenderKey, section);
  return {
    section,
    wallGapMm,
    renderPartKey: roomRenderKey,
    partWidth: box.width,
    partHeight: box.height,
    partDepth: box.depth,
    width: section.width,
    height: section.height,
    depth: section.depth,
  };
}

export function getTrimPartPreviewProfile(trimPartKey) {
  const key = normalizeTrimPartKey(trimPartKey);
  const base = profileForKey(key);
  const row = TRIM_PART_LIST.find((r) => r.key === key);
  return {
    ...base,
    partKey: key,
    partLabel: row?.label || key,
    orientation: row?.previewOrientation || base.orientation || 'f',
    edgeOrientation: getTrimPartEdgeOrientation(key),
  };
}

export function getTrimPartPreviewOrientation(trimPartKey) {
  return getTrimPartPreviewProfile(trimPartKey).orientation;
}

/**
 * По габаритам box: тонкая ось → схема кромок, чтобы полоски ложились на торцы, не на пласть.
 * W×H×16 → f; 16×H×D → v; горизонт  W×16×D → h.
 */
export function inferTrimEdgeOrientationFromBox(w, h, d) {
  const THIN = 22;
  const w1 = Number(w);
  const h1 = Number(h);
  const d1 = Number(d);
  if (!Number.isFinite(w1) || !Number.isFinite(h1) || !Number.isFinite(d1)) return null;
  const min = Math.min(w1, h1, d1);
  if (min > THIN) return null;
  if (Math.abs(min - d1) < 0.5) return 'f';
  if (Math.abs(min - w1) < 0.5) return 'v';
  if (Math.abs(min - h1) < 0.5) return 'h';
  return null;
}

/** Ориентация для нумерации кромок 1–4 (как spec.orientation в каталоге). */
export function getTrimPartEdgeOrientation(trimPartKey, boxSize) {
  if (boxSize) {
    const fromBox = inferTrimEdgeOrientationFromBox(boxSize.w, boxSize.h, boxSize.d);
    if (fromBox) return fromBox;
  }
  const key = normalizeTrimPartKey(trimPartKey);
  const row = TRIM_PART_LIST.find((r) => r.key === key);
  if (row?.edgeOrientation) return row.edgeOrientation;
  if (key === 'side_overlay_left' || key === 'side_overlay_right') return 'v';
  if (key === 'side_overlay_front' || key === 'side_overlay_back') return 'f';
  if (key?.startsWith('side_plank')) return 'f';
  if (key === 'transition_top_cap') return 'h';
  if (key === 'transition_side_cap') return 'v';
  if (key === 'top_plank_facade' || key === 'bottom_plank_facade' || key === 'top_plank_segment') return 'f';
  if (key === 'top_plank_side' || key === 'bottom_plank_side') return 'f';
  return 'f';
}

export function getTrimPartEdgeSideLabel(trimPartKey, edgeNum) {
  const o = getTrimPartEdgeOrientation(trimPartKey);
  const map = TRIM_EDGE_SIDE_LABELS[o] || TRIM_EDGE_SIDE_LABELS.f;
  return map[edgeNum] || String(edgeNum);
}

/** Синхронизация с геометрией комнаты: секция + фактический box детали. */
export function applyPreviewLocks(trimPartKey, preview) {
  const key = normalizeTrimPartKey(trimPartKey);
  const norm = normalizeTrimPartPreview(key, preview || {});
  const state = buildTrimPreviewState(key, norm);
  return {
    ...norm,
    section: state.section,
    wallGapMm: state.wallGapMm,
    width: state.width,
    height: state.height,
    depth: state.depth,
    renderPartKey: state.renderPartKey,
    partWidth: state.partWidth,
    partHeight: state.partHeight,
    partDepth: state.partDepth,
  };
}

/** Секция на передней/задней стене комнаты (wallName front|back). */
const FRONT_WALL_SECTION_TRIM_KEYS = new Set([
  'top_plank_facade',
  'bottom_plank_facade',
  'top_plank_segment',
  'side_plank_left',
  'side_plank_right',
  'side_overlay_left',
  'side_overlay_right',
  'end_cabinet_facade_overlay_whole',
  'end_cabinet_facade_overlay_main',
  'end_cabinet_facade_overlay_top',
  'end_cabinet_top_plank',
  'end_cabinet_plinth',
]);

/** Секция на левой/правой стене (wallName left|right) — торцы по глубине комнаты. */
const SIDE_WALL_SECTION_TRIM_KEYS = new Set([
  'top_plank_side',
  'bottom_plank_side',
  'side_plank_front',
  'side_plank_back',
  'side_overlay_front',
  'side_overlay_back',
]);

export function getTrimPartPreviewWallContext(trimPartKey) {
  const key = normalizeTrimPartKey(trimPartKey);
  if (SIDE_WALL_SECTION_TRIM_KEYS.has(key)) return 'side';
  if (FRONT_WALL_SECTION_TRIM_KEYS.has(key)) return 'front';
  return 'front';
}

export function getTrimPartPreviewBoxSize(trimPartKey, partPreview) {
  const state = buildTrimPreviewState(trimPartKey, partPreview || {});
  return { width: state.partWidth, height: state.partHeight, depth: state.partDepth };
}

/**
 * Силуэт секции и позиция детали в превью (мм).
 * front: X вдоль стены, Z глубина, стена −Z, проём +Z (wallName front).
 * side: та же ось X = ширина секции вдоль стены, Z = глубина комнаты, стена −X (wallName left).
 */
export function getTrimPartPreviewLayout(trimPartKey, partPreview) {
  const configKey = normalizeTrimPartKey(trimPartKey);
  const state = buildTrimPreviewState(configKey, partPreview || {});
  const key = configKey || 'top_plank_facade';
  const renderKey = state.renderPartKey || key;
  const envelope = state.section;
  const pw = state.partWidth;
  const ph = state.partHeight;
  const pd = state.partDepth;
  const box = { width: pw, height: ph, depth: pd };
  const g = TRIM_GEOM_MM;
  const secH = envelope.height;
  const secD = envelope.depth;
  const wallCtx = getTrimPartPreviewWallContext(key);
  const secW = envelope.width;
  const gapMm = state.wallGapMm || 0;
  const gapActive = trimNeedsOverlayForGapMm(gapMm);
  const posKey = renderKey;
  let sectionOffsetX = 0;
  if (gapActive && posKey === 'side_overlay_left') sectionOffsetX = gapMm / 2;
  if (gapActive && posKey === 'side_overlay_right') sectionOffsetX = -gapMm / 2;
  if (gapActive && posKey === 'side_overlay_front') sectionOffsetX = gapMm / 2;
  if (gapActive && posKey === 'side_overlay_back') sectionOffsetX = -gapMm / 2;
  const t = g.plankThickness;
  const plankW = g.sidePlankWidth;
  const centerY = secH / 2;
  const frontInsideZ = secD / 2 - t / 2;

  const section = { width: secW, height: secH, depth: secD };
  const sectionCenter = { x: sectionOffsetX, y: secH / 2, z: 0 };
  let partPosition = { x: 0, y: secH - ph / 2, z: frontInsideZ };
  let anchor = 'top';

  if (wallCtx === 'front') {
    if (posKey === 'bottom_plank_facade') {
      partPosition = { x: 0, y: ph / 2, z: frontInsideZ };
      anchor = 'bottom';
    } else if (posKey === 'top_plank_facade') {
      partPosition = { x: 0, y: secH - ph / 2, z: frontInsideZ };
      anchor = 'top';
    } else if (posKey === 'top_plank_segment') {
      partPosition = { x: 0, y: secH - ph / 2, z: frontInsideZ };
      anchor = 'top-segment';
    } else if (posKey === 'side_plank_left') {
      partPosition = { x: -secW / 2 + pw / 2, y: centerY, z: frontInsideZ };
      anchor = 'left';
    } else if (posKey === 'side_plank_right') {
      partPosition = { x: secW / 2 - pw / 2, y: centerY, z: frontInsideZ };
      anchor = 'right';
    } else if (posKey === 'side_overlay_left') {
      partPosition = { x: -secW / 2 + t / 2, y: centerY, z: 0 };
      anchor = 'left-overlay';
    } else if (posKey === 'side_overlay_right') {
      partPosition = { x: secW / 2 - t / 2, y: centerY, z: 0 };
      anchor = 'right-overlay';
    }
  } else {
    const facadeX = secW / 2 - t / 2;
    if (posKey === 'top_plank_side') {
      partPosition = { x: facadeX, y: secH - ph / 2, z: 0 };
      anchor = 'top-side';
    } else if (posKey === 'bottom_plank_side') {
      partPosition = { x: facadeX, y: ph / 2, z: 0 };
      anchor = 'bottom-side';
    } else if (posKey === 'side_plank_front') {
      partPosition = { x: facadeX, y: centerY, z: -secD / 2 + plankW / 2 };
      anchor = 'front-plank';
    } else if (posKey === 'side_plank_back') {
      partPosition = { x: facadeX, y: centerY, z: secD / 2 - plankW / 2 };
      anchor = 'back-plank';
    } else if (posKey === 'side_overlay_front') {
      partPosition = { x: 0, y: centerY, z: -secD / 2 + t / 2 };
      anchor = 'front-overlay';
    } else if (posKey === 'side_overlay_back') {
      partPosition = { x: 0, y: centerY, z: secD / 2 - t / 2 };
      anchor = 'back-overlay';
    }
  }

  if (key.startsWith('end_cabinet_') && wallCtx === 'front') {
    const endX = secW / 2 - pw / 2;
    if (key.startsWith('end_cabinet_facade_overlay')) {
      let bandY = centerY;
      const ant = END_CABINET_PREVIEW_ANTRESOL_MM;
      if (key === 'end_cabinet_facade_overlay_top') bandY = secH - ph / 2;
      else if (key === 'end_cabinet_facade_overlay_main') bandY = Math.max(ph / 2, secH - ant - ph / 2);
      partPosition = { x: secW / 2 - t / 2, y: bandY, z: 0 };
      anchor = 'end-overlay';
    } else if (key === 'end_cabinet_top_plank') {
      partPosition = { x: endX, y: secH - ph / 2, z: 0 };
      anchor = 'end-top';
    } else if (key === 'end_cabinet_plinth') {
      partPosition = { x: endX, y: ph / 2, z: 0 };
      anchor = 'end-plinth';
    }
  }

  return {
    section,
    sectionCenter,
    partPosition,
    partBox: box,
    anchor,
    wallContext: wallCtx,
    wallPlane: wallCtx === 'side' ? 'left' : 'back',
    wallGapMm: gapMm,
    renderPartKey: renderKey,
    configPartKey: key,
  };
}

const MESH_NAME_TO_KEY = {};
for (const row of TRIM_PART_LIST) {
  for (const n of row.meshNames || []) {
    if (n === 'TopPlank' || n === 'BottomPlank') continue;
    MESH_NAME_TO_KEY[n] = row.key;
  }
}

/** Дефолт: какие стороны кромить (1–4, схема фасада). */
function edgeSides(enabledList) {
  const out = {};
  for (let i = 1; i <= 4; i++) {
    out[i] = { enabled: enabledList.indexOf(i) !== -1, thickness: 0.8 };
  }
  return out;
}

export function getDefaultSectionTrimParts() {
  const parts = {};
  for (const row of TRIM_PART_LIST) {
    let sides = [2, 3, 4];
    if (
      row.key === 'bottom_plank_facade' ||
      row.key === 'bottom_plank_side' ||
      row.key === 'end_cabinet_plinth'
    ) {
      sides = [1, 3, 4];
    }
    if (row.key.startsWith('side_overlay')) sides = [2, 4];
    if (row.key.startsWith('end_cabinet_facade_overlay')) sides = [1, 2, 3, 4];
    if (row.key === 'top_plank_segment') sides = [2, 3, 4];
    if (row.key === 'transition_top_cap' || row.key === 'transition_side_cap') sides = [1, 2, 3, 4];
    if (row.key === 'side_plank_left' || row.key === 'side_plank_right') sides = [1, 2, 3, 4];
    parts[row.key] = {
      label: row.label,
      edgeNumbering: true,
      preview: defaultPreviewForKey(row.key),
      edges: edgeSides(sides),
      fasteners: null,
    };
  }
  return parts;
}

const ROOM_STEPS_CONFIG_KEY = 'room_steps_config';

export function readRoomStepsConfigRaw() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(ROOM_STEPS_CONFIG_KEY) : null;
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Схемы обклада из room_steps_config.sectionTrimParts */
export function getSectionTrimPartsConfig() {
  const cfg = readRoomStepsConfigRaw();
  const stored = cfg?.sectionTrimParts;
  if (stored && typeof stored === 'object' && Object.keys(stored).length) {
    return mergeWithDefaults(stored);
  }
  return getDefaultSectionTrimParts();
}

function trimPartRegistryLabel(key) {
  const row = TRIM_PART_LIST.find((r) => r.key === key);
  return row?.label || null;
}

/** Старые подписи из storage → подставляем актуальное имя из TRIM_PART_LIST. */
const TRIM_LABEL_LEGACY = {
  side_plank_right: new Set([
    'Боковая планка (правая)',
    'Боковая планка (правая, прямой-угловой)',
  ]),
};

function isLegacyStoredTrimLabel(key, label) {
  const k = normalizeTrimPartKey(key);
  const set = TRIM_LABEL_LEGACY[k];
  const t = label != null ? String(label).trim() : '';
  return !!(set && t && set.has(t));
}

function stripTrimPartLabelNumber(label) {
  return String(label || '')
    .replace(/^(\d+\.\s*)+/, '')
    .trim();
}

function resolveTrimPartLabel(key, storedLabel, baseLabel) {
  const reg = trimPartRegistryLabel(key);
  const trimmed = storedLabel != null ? stripTrimPartLabelNumber(String(storedLabel)) : '';
  if (!trimmed || isLegacyStoredTrimLabel(key, trimmed)) {
    return reg || baseLabel || key;
  }
  return trimmed;
}

function mergeWithDefaults(stored) {
  const defs = getDefaultSectionTrimParts();
  const out = { ...defs };
  const normalized = {};
  for (const key of Object.keys(stored)) {
    const src = stored[key];
    if (!src || typeof src !== 'object') continue;
    const targetKey = normalizeTrimPartKey(key);
    normalized[targetKey] = { ...(normalized[targetKey] || {}), ...src, label: src.label };
  }
  for (const key of Object.keys(normalized)) {
    const src = normalized[key];
    const base = out[key] || defs[key] || { label: key, edges: edgeSides([]) };
    out[key] = {
      ...base,
      ...src,
      label: resolveTrimPartLabel(key, src.label, base.label),
      edges: mergeEdgeSides(base.edges, src.edges),
      preview: applyPreviewLocks(
        key,
        normalizeTrimPartPreview(key, {
          ...base.preview,
          ...(src.preview || {}),
          section: {
            ...(base.preview?.section || {}),
            ...((src.preview && src.preview.section) || {}),
          },
        })
      ),
    };
  }
  return out;
}

function mergeEdgeSides(defEdges, storedEdges) {
  const out = {};
  for (let i = 1; i <= 4; i++) {
    const d = defEdges?.[i] || defEdges?.[String(i)] || { enabled: false, thickness: 0.8 };
    const s = storedEdges?.[i] || storedEdges?.[String(i)];
    out[i] = s ? { ...d, ...s } : { ...d };
  }
  return out;
}

/**
 * При загрузке room_steps_config с сервера не терять sectionTrimParts из localStorage
 * (админка «Обклад» раньше писала только в localStorage).
 */
export function mergeRoomStepsConfigPreservingLocal(serverData, localData) {
  if (!serverData || typeof serverData !== 'object') return localData || serverData;
  if (!localData || typeof localData !== 'object') return serverData;
  const out = { ...serverData };
  const localTrim = localData.sectionTrimParts;
  if (!localTrim || typeof localTrim !== 'object' || !Object.keys(localTrim).length) {
    return out;
  }
  const defs = getDefaultSectionTrimParts();
  const serverTrim =
    serverData.sectionTrimParts && typeof serverData.sectionTrimParts === 'object'
      ? serverData.sectionTrimParts
      : {};
  const mergedTrim = { ...serverTrim };
  for (const key of Object.keys(localTrim)) {
    const l = localTrim[key];
    if (!l || typeof l !== 'object') continue;
    const s = mergedTrim[key];
    const base = defs[key] || { label: key, edges: edgeSides([]) };
    mergedTrim[key] = {
      ...base,
      ...(s && typeof s === 'object' ? s : {}),
      ...l,
      label: resolveTrimPartLabel(key, l.label || s?.label, base.label),
      edges: mergeEdgeSides(mergeEdgeSides(base.edges, s?.edges), l.edges),
      preview: applyPreviewLocks(
        key,
        normalizeTrimPartPreview(key, {
          ...(base.preview || {}),
          ...(s?.preview || {}),
          ...(l.preview || {}),
          section: {
            ...(base.preview?.section || {}),
            ...(s?.preview?.section || {}),
            ...(l.preview?.section || {}),
          },
        })
      ),
    };
  }
  out.sectionTrimParts = mergedTrim;
  const localRe = localData.roomEdit;
  const serverRe = serverData.roomEdit;
  if (localRe && typeof localRe === 'object') {
    const serverEmpty =
      !serverRe ||
      typeof serverRe !== 'object' ||
      ((!Array.isArray(serverRe.doors) || !serverRe.doors.length) &&
        (!Array.isArray(serverRe.windows) || !serverRe.windows.length) &&
        !(serverRe.materials && Object.keys(serverRe.materials).length));
    if (serverEmpty) out.roomEdit = localRe;
    else out.roomEdit = serverRe;
  }
  return out;
}

/** localStorage + POST /api/room_steps_config (как «Управление комнатой 2»). */
export function writeRoomStepsConfig(config) {
  if (!config || typeof config !== 'object') return false;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ROOM_STEPS_CONFIG_KEY, JSON.stringify(config));
    }
  } catch {
    return false;
  }
  try {
    if (typeof fetch !== 'undefined') {
      fetch('/api/room_steps_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      }).catch(() => {});
    }
  } catch (_) {}
  return true;
}

/** Все 4 стороны enabled (галочка «со всех сторон кромим» в админке). */
export function expandTrimPartEdgesAllSides(edges) {
  const out = {};
  for (let i = 1; i <= 4; i++) {
    const s = edges?.[i] || edges?.[String(i)] || {};
    const th = s.thickness != null && s.thickness !== '' ? s.thickness : 0.8;
    out[i] = { ...s, enabled: true, thickness: th };
  }
  return out;
}

export function getTrimPartConfig(trimPartKey) {
  if (!trimPartKey) return null;
  const key = normalizeTrimPartKey(trimPartKey);
  const all = getSectionTrimPartsConfig();
  const cfg = all[key] || null;
  if (!cfg || cfg.edgeAllSides !== true) return cfg;
  return { ...cfg, edges: expandTrimPartEdgesAllSides(cfg.edges) };
}

/**
 * Определить ключ роли по мешу обклада.
 */
function trimKeyForTopBottom(ud, wallName) {
  const w = wallName || ud.trimWallName || '';
  if (ud.isTopPlank) {
    return w === 'left' || w === 'right' ? 'top_plank_side' : 'top_plank_facade';
  }
  if (ud.isBottomPlank) {
    return w === 'left' || w === 'right' ? 'bottom_plank_side' : 'bottom_plank_facade';
  }
  return null;
}

export function resolveTrimPartKeyFromMesh(mesh, wallNameHint) {
  const ud = mesh?.userData || {};
  if (ud.trimPartKey) return normalizeTrimPartKey(String(ud.trimPartKey));
  const name = (mesh?.name || '').trim();
  if (ud.isEndCabinetTopPlank) return 'end_cabinet_top_plank';
  if (ud.isEndCabinetPlinth) return 'end_cabinet_plinth';
  if (ud.isEndCabinetFacadeOverlay) {
    const role = String(ud.layoutRole || '').trim().toLowerCase();
    if (role === 'facades_main') return 'end_cabinet_facade_overlay_main';
    if (role === 'facades_top') return 'end_cabinet_facade_overlay_top';
    return 'end_cabinet_facade_overlay_whole';
  }
  if (ud.isTransitionSideCap || name === 'TransitionSideCap') return 'transition_side_cap';
  if (ud.isTransitionTopCap || ud.isTransitionAutoTopCap || name === 'TransitionTopCap' || name === 'TransitionAutoTopCap') {
    return 'transition_top_cap';
  }
  if (name && MESH_NAME_TO_KEY[name]) return MESH_NAME_TO_KEY[name];
  if (ud.isTopPlankSegment) return 'top_plank_segment';
  const tb = trimKeyForTopBottom(ud, wallNameHint);
  if (tb) return tb;
  if (ud.isSideOverlay) {
    if (name.includes('Left')) return 'side_overlay_left';
    if (name.includes('Right')) return 'side_overlay_right';
    if (name.includes('Front')) return 'side_overlay_front';
    if (name.includes('Back')) return 'side_overlay_back';
    return 'side_overlay_left';
  }
  if (ud.isSidePlank) {
    if (name.includes('Left')) return 'side_plank_left';
    if (name.includes('Right')) return 'side_plank_right';
    if (name.includes('Front')) return 'side_plank_front';
    if (name.includes('Back')) return 'side_plank_back';
    return 'side_plank_left';
  }
  if (ud.transitionKey) return `transition_${ud.transitionKey}`;
  return null;
}

export function assignTrimPartKeyToMesh(mesh, wallName) {
  if (!mesh?.userData) return null;
  if (wallName) mesh.userData.trimWallName = wallName;
  const key = resolveTrimPartKeyFromMesh(mesh, wallName);
  if (key) {
    mesh.userData.trimPartKey = key;
    const no = getTrimPartNumber(key);
    if (no != null) mesh.userData.trimPartNo = no;
  }
  return key;
}

/**
 * Слияние схемы сторон из админки с метаданными кромки (шаг 5 / каталог).
 */
export function mergeTrimPartEdgesWithBinding(partConfig, catalogMeta) {
  const partEdges = partConfig?.edges || {};
  const sample = catalogMeta
    ? {
        enabled: true,
        edge_id: catalogMeta.id,
        edge_name: catalogMeta.name,
        decor_id: catalogMeta.id,
        decor_name: catalogMeta.name,
        color: catalogMeta.color,
        thickness: catalogMeta.thicknessMm,
        roughness: catalogMeta.roughness,
        metalness: catalogMeta.metalness,
        texture: catalogMeta.texture || '',
        icon: catalogMeta.texture || '',
        type: catalogMeta.edgeType || 'butt_butts',
        variant_id: catalogMeta.variantId,
        realTextureWidth: catalogMeta.realTextureWidth,
        realTextureHeight: catalogMeta.realTextureHeight,
        stretchWidth: catalogMeta.stretchWidth,
        stretchHeight: catalogMeta.stretchHeight,
        normalMap: catalogMeta.normalMap || '',
        roughnessMap: catalogMeta.roughnessMap || '',
        oneSided: catalogMeta.oneSided,
      }
    : null;

  const out = {};
  let anyEnabled = false;

  for (let i = 1; i <= 4; i++) {
    const side = partEdges[i] || partEdges[String(i)] || null;
    if (!side || side.enabled !== true) {
      out[i] = { enabled: false };
      continue;
    }
    anyEnabled = true;
    const merged = sample ? { ...sample, enabled: true } : { enabled: true };
    if (side.thickness != null && side.thickness !== '') {
      const t = Number(side.thickness);
      if (Number.isFinite(t)) merged.thickness = t;
    }
    if (side.edge_id != null && side.edge_id !== '') {
      merged.edge_id = String(side.edge_id);
      merged.decor_id = String(side.decor_id ?? side.edge_id);
    }
    if (side.edge_name) merged.edge_name = side.edge_name;
    if (side.decor_name) merged.decor_name = side.decor_name;
    if (side.variant_id != null && side.variant_id !== '') merged.variant_id = side.variant_id;
    out[i] = merged;
  }

  if (!anyEnabled && sample) {
    return null;
  }
  return out;
}
