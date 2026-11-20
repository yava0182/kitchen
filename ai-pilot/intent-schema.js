/**
 * AI Pilot — контракт intent (шкаф/гардероб).
 * Конструктор / комната НЕ вызываются отсюда.
 */

export const FILL_OPTIONS = [
  { id: 'rail', label: 'Штанга' },
  { id: 'shelves', label: 'Полки' },
  { id: 'drawers', label: 'Ящики' },
  { id: 'pants', label: 'Брючница' },
  { id: 'shoes', label: 'Обувница' },
  { id: 'antresol', label: 'Антресоль' },
];

export const INTENT_EXAMPLE = {
  product: 'wardrobe',
  layout: 'straight',
  room_mm: { width: 2400, depth: 600, height: 2700 },
  zones: 2,
  style: 'modern',
  handles: 'none',
  fill: ['rail', 'shelves'],
  notes: '',
  ready: false,
  assistant_message: 'Уточните глубину ниши, если она не 600 мм.',
  questions: ['Глубина ниши?', 'Нужна антресоль?'],
};

/** Готовые ТЗ без AI — для быстрого старта. */
export const PRESETS = [
  {
    id: 'niche_2400_straight',
    title: 'Ниша 2400 прямой',
    intent: {
      product: 'wardrobe',
      layout: 'straight',
      room_mm: { width: 2400, depth: 600, height: 2700 },
      zones: 2,
      style: 'modern',
      handles: 'none',
      fill: ['rail', 'shelves'],
      notes: 'preset:niche_2400_straight',
    },
  },
  {
    id: 'hallway_1800',
    title: 'Прихожая 1800',
    intent: {
      product: 'wardrobe',
      layout: 'straight',
      room_mm: { width: 1800, depth: 550, height: 2400 },
      zones: 2,
      style: 'modern',
      handles: 'default',
      fill: ['rail', 'shelves', 'shoes'],
      notes: 'preset:hallway_1800',
    },
  },
  {
    id: 'corner_l',
    title: 'Угловой L 1800×1200',
    intent: {
      product: 'wardrobe',
      layout: 'corner',
      room_mm: { width: 1800, depth: 600, height: 2500 },
      zones: 3,
      style: 'modern',
      handles: 'none',
      fill: ['rail', 'shelves', 'drawers'],
      notes: 'preset:corner_l (вторая стена 1200 — в notes)',
    },
  },
  {
    id: 'closet_u',
    title: 'Гардеробная П-обр.',
    intent: {
      product: 'closet',
      layout: 'u',
      room_mm: { width: 3000, depth: 2000, height: 2700 },
      zones: 4,
      style: 'scandi',
      handles: 'none',
      fill: ['rail', 'shelves', 'drawers', 'pants', 'antresol'],
      notes: 'preset:closet_u',
    },
  },
];

const LAYOUT_RU = { straight: 'прямой', corner: 'угловой', u: 'П-образный', unknown: 'не задан' };
const PRODUCT_RU = { wardrobe: 'шкаф', closet: 'гардеробная', unknown: 'не задано' };
const HANDLES_RU = { none: 'без ручек', default: 'с ручками', unknown: 'не заданы' };
const FILL_RU = Object.fromEntries(FILL_OPTIONS.map((o) => [o.id, o.label]));

/** Человекочитаемое ТЗ (без AI). */
export function summarizeIntent(intent) {
  const i = normalizeIntent(intent);
  const lines = [];
  lines.push(`Изделие: ${PRODUCT_RU[i.product] || i.product}`);
  lines.push(`Компоновка: ${LAYOUT_RU[i.layout] || i.layout}`);
  const { width, depth, height } = i.room_mm;
  lines.push(
    `Ниша: ${width ?? '—'} × ${depth ?? '—'} × ${height ?? '—'} мм (Ш×Г×В)`
  );
  lines.push(`Зоны: ${i.zones ?? '—'}`);
  lines.push(`Стиль: ${i.style || '—'}`);
  lines.push(`Ручки: ${HANDLES_RU[i.handles] || i.handles}`);
  lines.push(
    `Наполнение: ${
      i.fill.length ? i.fill.map((f) => FILL_RU[f] || f).join(', ') : '—'
    }`
  );
  if (i.notes) lines.push(`Заметки: ${i.notes}`);
  lines.push(`Готовность (ready): ${i.ready ? 'да' : 'нет'}`);
  if (!i.ready && i.questions.length) {
    lines.push(`Уточнить: ${i.questions.join(' ')}`);
  }
  return lines.join('\n');
}

/** Слияние: previous + patch; известные поля patch перекрывают. */
export function mergePreferDefined(previous, patch) {
  const base = normalizeIntent(previous || {});
  const next = normalizeIntent(patch || {});
  const out = { ...base };

  if (next.product && next.product !== 'unknown') out.product = next.product;
  if (next.layout && next.layout !== 'unknown') out.layout = next.layout;
  if (next.handles && next.handles !== 'unknown') out.handles = next.handles;
  if (next.style) out.style = next.style;
  if (next.zones != null) out.zones = next.zones;

  out.room_mm = {
    width: next.room_mm.width ?? base.room_mm.width,
    depth: next.room_mm.depth ?? base.room_mm.depth,
    height: next.room_mm.height ?? base.room_mm.height,
  };

  out.fill = [...new Set([...(base.fill || []), ...(next.fill || [])])];
  if (next.notes && !String(next.notes).startsWith('provider=mock')) {
    out.notes = next.notes;
  } else if (base.notes) {
    out.notes = base.notes;
  }
  out.assistant_message = next.assistant_message || '';
  out.questions = next.questions || [];
  return out;
}

/** Будущий контракт apply — только описание, без вызова конструктора. */
export const APPLY_CONTRACT = {
  version: 1,
  applyToConstructor: false,
  status: 'spec_only',
  description:
    'Когда конструктор будет готов, intent превратится в команды ниже. Сейчас они НЕ выполняются.',
  requiredIntentFields: ['product', 'layout', 'room_mm.width', 'room_mm.height', 'room_mm.depth'],
  commands: [
    {
      id: 'set_niche',
      args: ['width_mm', 'depth_mm', 'height_mm'],
      note: 'Задать габарит ниши/зоны размещения',
    },
    {
      id: 'set_layout',
      args: ['straight|corner|u'],
      note: 'Тип компоновки',
    },
    {
      id: 'split_zones',
      args: ['zones'],
      note: 'Разбить на секции/зоны',
    },
    {
      id: 'set_fill',
      args: ['fill[]'],
      note: 'Наполнение: rail/shelves/drawers/…',
    },
    {
      id: 'set_handles',
      args: ['none|default|collectionId'],
      note: 'Ручки по правилам админки',
    },
    {
      id: 'build_preview',
      args: [],
      note: 'Собрать черновик в сцене — только после явного «Применить»',
    },
  ],
  exampleFromIntent: {
    intent: INTENT_EXAMPLE,
    plannedCommands: [
      { id: 'set_niche', width_mm: 2400, depth_mm: 600, height_mm: 2700 },
      { id: 'set_layout', layout: 'straight' },
      { id: 'split_zones', zones: 2 },
      { id: 'set_fill', fill: ['rail', 'shelves'] },
      { id: 'set_handles', handles: 'none' },
    ],
  },
};

export const SYSTEM_PROMPT = `Ты помощник мебельного конструктора шкафов и гардеробных (Clodis).
Сейчас ты НЕ собираешь 3D и НЕ вызываешь конструктор. Твоя задача — уточнить ТЗ и вернуть JSON intent.

Отвечай ТОЛЬКО валидным JSON-объектом (без markdown), поля:
{
  "product": "wardrobe" | "closet" | "unknown",
  "layout": "straight" | "corner" | "u" | "unknown",
  "room_mm": { "width": number|null, "depth": number|null, "height": number|null },
  "zones": number|null,
  "style": string|null,
  "handles": "none" | "default" | "unknown",
  "fill": string[],
  "notes": string,
  "ready": boolean,
  "assistant_message": string,
  "questions": string[]
}

Правила:
- Размеры в миллиметрах. Если пользователь сказал метры (2.4) — переведи в мм (2400).
- ready=true только если есть width и height (depth можно default 600) и понятен product и layout.
- fill: rail, shelves, drawers, pants, shoes, antresol.
- Пиши assistant_message и questions по-русски.
- Не выдумывай кухню, если речь про шкаф/гардероб.`;

function emptyIntent(message = '', questions = []) {
  return {
    product: 'unknown',
    layout: 'unknown',
    room_mm: { width: null, depth: null, height: null },
    zones: null,
    style: null,
    handles: 'unknown',
    fill: [],
    notes: '',
    ready: false,
    assistant_message: message,
    questions,
  };
}

function toMm(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n > 0 && n < 30) return Math.round(n * 1000);
  return Math.round(n);
}

function numOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Выставляет ready / questions / defaults по текущим полям. */
export function finalizeIntent(intent, { source = 'mock' } = {}) {
  const out = normalizeIntent(intent);
  const missing = [];

  if (out.product === 'unknown') missing.push('Это шкаф/гардероб?');
  if (!out.room_mm.width) missing.push('Ширина ниши (мм)?');
  if (!out.room_mm.height) missing.push('Высота (мм)?');
  if (!out.room_mm.depth) missing.push('Глубина (мм)? Можно 600 по умолчанию.');
  if (out.layout === 'unknown') missing.push('Прямой, угловой или П-образный?');

  if (!out.room_mm.depth && out.room_mm.width && out.room_mm.height) {
    out.room_mm.depth = 600;
  }

  // пересчитать missing depth после default
  const missingFinal = missing.filter((q) => {
    if (q.startsWith('Глубина') && out.room_mm.depth) return false;
    return true;
  });

  out.ready =
    (out.product === 'wardrobe' || out.product === 'closet') &&
    !!out.room_mm.width &&
    !!out.room_mm.height &&
    !!out.room_mm.depth &&
    out.layout !== 'unknown';

  out.questions = missingFinal.slice(0, 5);

  if (!out.assistant_message) {
    if (out.ready) {
      out.assistant_message =
        `ТЗ готово (${source}). ${out.layout}, ${out.room_mm.width}×${out.room_mm.depth}×${out.room_mm.height} мм` +
        (out.zones ? `, зон: ${out.zones}` : '') +
        (out.fill.length ? `, наполнение: ${out.fill.join(', ')}` : '') +
        '. Сборка в конструктор отключена.';
    } else {
      out.assistant_message =
        missingFinal.length > 0
          ? `Нужно уточнить: ${missingFinal.join(' ')}`
          : 'Продолжайте описание ТЗ.';
    }
  }

  if (!out.notes) out.notes = `source=${source}`;
  return out;
}

/** Intent из формы мастера (без LLM). */
export function intentFromWizard(form = {}) {
  const fill = Array.isArray(form.fill)
    ? form.fill.map(String)
    : String(form.fill || '')
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);

  const intent = emptyIntent('');
  intent.product = form.product === 'closet' ? 'closet' : form.product === 'wardrobe' ? 'wardrobe' : 'wardrobe';
  intent.layout = ['straight', 'corner', 'u'].includes(form.layout) ? form.layout : 'unknown';
  intent.room_mm = {
    width: toMm(form.width ?? form.room_mm?.width),
    depth: toMm(form.depth ?? form.room_mm?.depth) || 600,
    height: toMm(form.height ?? form.room_mm?.height),
  };
  intent.zones = numOrNull(form.zones);
  intent.style = form.style ? String(form.style) : null;
  intent.handles = ['none', 'default', 'unknown'].includes(form.handles) ? form.handles : 'unknown';
  intent.fill = [...new Set(fill.filter((f) => FILL_OPTIONS.some((o) => o.id === f)))];
  intent.notes = String(form.notes || 'source=wizard');
  intent.assistant_message = '';
  return finalizeIntent(intent, { source: 'wizard' });
}

function mergePartial(base, patch) {
  const out = normalizeIntent({ ...base, ...patch, room_mm: { ...base.room_mm, ...(patch.room_mm || {}) } });
  if (Array.isArray(patch.fill) && patch.fill.length) {
    out.fill = [...new Set([...(base.fill || []), ...patch.fill])];
  }
  return out;
}

/** Простой локальный разбор без LLM (provider=mock). */
export function mockParseIntent(userText, history = [], previousIntent = null) {
  const text = String(userText || '').trim();
  const textL = text.toLowerCase();
  const all = [...history.map((m) => String(m.content || '')), text].join(' \n ').toLowerCase();

  let intent = emptyIntent('');
  const prev = previousIntent ? normalizeIntent(previousIntent) : null;

  if (/кухн/.test(all) && !/шкаф|гардероб/.test(all)) {
    intent.product = 'unknown';
    intent.assistant_message =
      'Пока пилот только для шкафов/гардеробных. Опишите шкаф или откройте вкладку «Мастер».';
    intent.questions = ['Шкаф или гардероб?', 'Размеры ниши Ш×Г×В?'];
    intent.notes = 'provider=mock';
    return finalizeIntent(intent, { source: 'mock' });
  }
  if (/гардероб|шкаф|wardrobe|closet|купе|распашн|встроенн/.test(all)) {
    intent.product = 'wardrobe';
  }
  if (intent.product === 'unknown' && /спальн|прихож|гардеробн|детск|ниш/.test(all)) {
    intent.product = 'wardrobe';
  }

  if (/угл|г[\s-]?образ|l[\s-]?образ/.test(all)) intent.layout = 'corner';
  else if (/п[\s-]?образ|u[\s-]?образ|три\s*стен/.test(all)) intent.layout = 'u';
  else if (/прям|в\s*ряд|в\s*ниш|линейн|одноряд/.test(all)) intent.layout = 'straight';

  const wLab = all.match(/шир(ина)?\s*[:=]?\s*(\d+[.,]?\d*)/);
  const dLab = all.match(/глуб(ина)?\s*[:=]?\s*(\d+[.,]?\d*)/);
  const hLab = all.match(/выс(ота)?\s*[:=]?\s*(\d+[.,]?\d*)/);
  if (wLab) intent.room_mm.width = toMm(wLab[2]);
  if (dLab) intent.room_mm.depth = toMm(dLab[2]);
  if (hLab) intent.room_mm.height = toMm(hLab[2]);

  const sizes = [];
  const re =
    /(\d+[.,]?\d*)\s*(?:м(?:м|m)?|мм)?\s*(?:[xх×*на]\s*)(\d+[.,]?\d*)\s*(?:м(?:м|m)?|мм)?(?:\s*[xх×*на]\s*(\d+[.,]?\d*))?/gi;
  let m;
  while ((m = re.exec(all)) && sizes.length < 9) {
    const a = parseFloat(String(m[1]).replace(',', '.'));
    const b = parseFloat(String(m[2]).replace(',', '.'));
    const c = m[3] ? parseFloat(String(m[3]).replace(',', '.')) : NaN;
    if (Number.isFinite(a)) sizes.push(a);
    if (Number.isFinite(b)) sizes.push(b);
    if (Number.isFinite(c)) sizes.push(c);
  }
  const mm = sizes.map(toMm).filter((v) => v != null && v >= 200 && v <= 5000);

  if (!intent.room_mm.width && mm[0]) intent.room_mm.width = mm[0];
  if (mm.length >= 2) {
    if (!intent.room_mm.depth && !intent.room_mm.height) {
      if (mm[1] <= 900) {
        intent.room_mm.depth = mm[1];
        if (mm[2]) intent.room_mm.height = mm[2];
      } else {
        intent.room_mm.height = mm[1];
        if (mm[2] && mm[2] <= 900) intent.room_mm.depth = mm[2];
        else if (mm[2]) intent.room_mm.height = intent.room_mm.height || mm[2];
      }
    } else if (!intent.room_mm.height && mm[1] > 900) {
      intent.room_mm.height = mm[1];
    } else if (!intent.room_mm.depth && mm[1] <= 900) {
      intent.room_mm.depth = mm[1];
    }
  }

  const zonesM = all.match(/(\d+)\s*(?:зон|секц|двер)/);
  if (zonesM) intent.zones = parseInt(zonesM[1], 10);
  if (/двухдвер|2\s*двер/.test(all)) intent.zones = intent.zones || 2;
  if (/трёхдвер|трехдвер|3\s*двер/.test(all)) intent.zones = intent.zones || 3;

  if (/без\s*руч|ручек\s*нет|push[\s-]?to[\s-]?open|интегр(ированн)?ые\s*руч/.test(all)) {
    intent.handles = 'none';
  } else if (/с\s*ручк|ручк[аиуы]/.test(all)) {
    intent.handles = 'default';
  }

  if (/современ|модерн|минимал|лофт/.test(all)) intent.style = 'modern';
  if (/классик|неоклассик/.test(all)) intent.style = 'classic';
  if (/сканди/.test(all)) intent.style = 'scandi';

  if (/штанг|перекладин|штанга\s*для\s*одежд/.test(all)) intent.fill.push('rail');
  if (/полк/.test(all)) intent.fill.push('shelves');
  if (/ящик/.test(all)) intent.fill.push('drawers');
  if (/брюч|вешалк.\s*для\s*брюк/.test(all)) intent.fill.push('pants');
  if (/обув/.test(all)) intent.fill.push('shoes');
  if (/антресол/.test(all)) intent.fill.push('antresol');
  intent.fill = [...new Set(intent.fill)];

  if (/^(прям(ой|ая)?|straight)$/i.test(textL)) intent.layout = 'straight';
  if (/^(угл(ов(ой|ая))?|corner)$/i.test(textL)) intent.layout = 'corner';
  if (/^(п[\s-]?образ|u)$/i.test(textL)) intent.layout = 'u';
  if (/^(без\s*ручек|none)$/i.test(textL)) intent.handles = 'none';
  const onlyNum = textL.match(/^(\d+[.,]?\d*)\s*(мм|м)?$/);
  if (onlyNum) {
    const v = toMm(onlyNum[1]);
    if (v) {
      const baseW = intent.room_mm.width ?? prev?.room_mm?.width;
      const baseH = intent.room_mm.height ?? prev?.room_mm?.height;
      const baseD = intent.room_mm.depth ?? prev?.room_mm?.depth;
      if (!baseW) intent.room_mm.width = v;
      else if (!baseH) intent.room_mm.height = v;
      else if (!baseD) intent.room_mm.depth = v;
      else intent.room_mm.width = v;
    }
  }

  intent.assistant_message = '';
  intent.notes = 'provider=mock (локальный разбор, без внешнего AI)';

  if (/^(привет|здравств|help|помощ|старт)/i.test(textL)) {
    intent.assistant_message =
      'Опишите шкаф: размеры ниши (Ш×Г×В), прямой/угловой, зоны, наполнение, ручки. Или вкладка «Мастер» / «Пресеты».';
  }

  if (prev) {
    intent = mergePreferDefined(prev, intent);
    intent.notes = 'provider=mock + previousIntent';
    if (!/^(привет|здравств|help|помощ|старт)/i.test(textL)) {
      intent.assistant_message = '';
    }
  }

  return finalizeIntent(intent, { source: 'mock' });
}

export function normalizeIntent(raw) {
  const base = emptyIntent('');
  if (!raw || typeof raw !== 'object') return base;
  const out = { ...base, ...raw };
  out.room_mm = {
    width: numOrNull(raw.room_mm?.width),
    depth: numOrNull(raw.room_mm?.depth),
    height: numOrNull(raw.room_mm?.height),
  };
  out.zones = numOrNull(raw.zones);
  out.fill = Array.isArray(raw.fill) ? raw.fill.map(String) : [];
  out.questions = Array.isArray(raw.questions) ? raw.questions.map(String) : [];
  out.ready = !!raw.ready;
  out.assistant_message = String(raw.assistant_message || '');
  out.notes = String(raw.notes || '');
  out.product = String(raw.product || 'unknown');
  out.layout = String(raw.layout || 'unknown');
  out.handles = String(raw.handles || 'unknown');
  out.style = raw.style == null || raw.style === '' ? null : String(raw.style);
  return out;
}

export function extractJsonObject(text) {
  const s = String(text || '').trim();
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch (_) {
    /* fallthrough */
  }
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(s.slice(start, end + 1));
    } catch (_) {
      return null;
    }
  }
  return null;
}

export { emptyIntent, mergePartial };
