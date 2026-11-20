/**
 * Кухонный шаг 1: форма пространства (как IKEA «Choose room shape»).
 * Комната всегда kitchen; геометрия v1 = прямоугольник + openings (kind: opening).
 */

import { state } from '../utils/state.js';
import {
  footprintSpecForShape,
  isNonRectKitchenShape,
  normalizeShapeOrient,
  shapeHasOrientVariants,
} from './room-footprint.js?v=20261005-shape-orient1';

export const KITCHEN_ROOM_TYPE = {
  key: 'kitchen',
  name: 'Кухня',
  icon: 'fa-utensils',
  image: '',
  categoryId: null,
};

/** 6 форм как у IKEA: 3 enclosed + 3 open. */
export const DEFAULT_KITCHEN_ROOM_SHAPES = [
  {
    id: 'ks-enclosed-rect',
    key: 'enclosed_rect',
    name: 'Прямоугольник',
    group: 'enclosed',
    groupLabel: 'Закрытая кухня',
    desc: 'Четыре стены',
    order: 0,
  },
  {
    id: 'ks-enclosed-notch',
    key: 'enclosed_notch',
    name: 'С вырезом',
    group: 'enclosed',
    groupLabel: 'Закрытая кухня',
    desc: 'Ниша в углу',
    order: 1,
  },
  {
    id: 'ks-enclosed-chamfer',
    key: 'enclosed_chamfer',
    name: 'Со срезом угла',
    group: 'enclosed',
    groupLabel: 'Закрытая кухня',
    desc: 'Срезанный угол',
    order: 2,
  },
  {
    id: 'ks-open-one',
    key: 'open_one_wall',
    name: 'Открытая стена',
    group: 'open',
    groupLabel: 'Открытая кухня',
    desc: 'Одна сторона без стены',
    order: 3,
  },
  {
    id: 'ks-open-corner',
    key: 'open_corner',
    name: 'Открытый угол',
    group: 'open',
    groupLabel: 'Открытая кухня',
    desc: 'Две соседние стороны открыты',
    order: 4,
  },
  {
    id: 'ks-open-protrusion',
    key: 'open_protrusion',
    name: 'Выступ',
    group: 'open',
    groupLabel: 'Открытая кухня',
    desc: 'Частично открытая стена',
    order: 5,
  },
];

const SHAPE_KEYS = new Set(DEFAULT_KITCHEN_ROOM_SHAPES.map((s) => s.key));

export function isKitchenProductLineConfig(config) {
  try {
    if (config && String(config.productLine || '').trim().toLowerCase() === 'kitchen') {
      return true;
    }
  } catch (_) {}
  try {
    if (typeof window !== 'undefined' && window.__cldPlacementKindProfiles) {
      const api = window.__cldPlacementKindProfiles;
      if (typeof api.isKitchenProductLine === 'function') {
        return !!api.isKitchenProductLine(config);
      }
    }
  } catch (_) {}
  try {
    const raw = localStorage.getItem('room_steps_config');
    if (raw) {
      const c = JSON.parse(raw);
      if (c && String(c.productLine || '').trim().toLowerCase() === 'kitchen') return true;
    }
  } catch (_) {}
  return true;
}

export function isKitchenRoomShapeKey(key) {
  return SHAPE_KEYS.has(String(key || '').trim());
}

export function getKitchenRoomShapes(config) {
  const step1 = config?.steps?.find((s) => Number(s?.stepId) === 1);
  const fromCfg = Array.isArray(step1?.items) ? step1.items : [];
  const mapped = fromCfg
    .filter((it) => isKitchenRoomShapeKey(it?.key))
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((it) => {
      const base = DEFAULT_KITCHEN_ROOM_SHAPES.find((d) => d.key === it.key) || {};
      return {
        ...base,
        ...it,
        id: it.id || base.id,
        key: it.key,
        name: it.name || base.name,
        group: it.group || base.group,
        groupLabel: it.groupLabel || base.groupLabel,
        desc: it.desc || base.desc || '',
        order: it.order != null ? it.order : base.order,
      };
    });
  if (mapped.length >= 3) return mapped;
  return DEFAULT_KITCHEN_ROOM_SHAPES.map((s) => ({ ...s }));
}

/** Миграция step1: убрать гостиные/спальни, поставить кухонные формы. */
export function ensureKitchenStep1ShapesInConfig(config) {
  if (!config || !Array.isArray(config.steps)) return config;
  if (!isKitchenProductLineConfig(config)) return config;

  config.productLine = 'kitchen';
  let step1 = config.steps.find((s) => Number(s?.stepId) === 1);
  if (!step1) {
    step1 = { stepId: 1, title: 'Форма кухни', items: [], columnsPerRow: 3 };
    config.steps.unshift(step1);
  }

  const items = Array.isArray(step1.items) ? step1.items : [];
  const hasShapes = items.some((it) => isKitchenRoomShapeKey(it?.key));
  const hasWardrobeRooms = items.some((it) =>
    /^(living-room|bedroom|nursery|hallway|laundry|balcony)$/.test(String(it?.key || ''))
  );

  if (!hasShapes || hasWardrobeRooms) {
    step1.items = DEFAULT_KITCHEN_ROOM_SHAPES.map((s, i) => ({
      id: s.id,
      name: s.name,
      icon: 'shape:' + s.key,
      image: '',
      key: s.key,
      group: s.group,
      groupLabel: s.groupLabel,
      desc: s.desc,
      categoryId: null,
      order: i,
    }));
  } else {
    // Подтянуть актуальные desc с дефолтов (убрать «пока прямоугольник»)
    step1.items = items.map((it) => {
      const base = DEFAULT_KITCHEN_ROOM_SHAPES.find((d) => d.key === it.key);
      if (!base) return it;
      const desc = String(it.desc || '');
      if (/пока прямоугольник/i.test(desc) || !desc) {
        return { ...it, desc: base.desc, name: it.name || base.name };
      }
      return it;
    });
  }

  const t = String(step1.title || '').trim();
  if (!t || t === 'Тип комнаты' || t === 'ТИП КОМНАТЫ') {
    step1.title = 'Форма кухни';
  }
  if (step1.columnsPerRow !== 1 && step1.columnsPerRow !== 2 && step1.columnsPerRow !== 3) {
    step1.columnsPerRow = 3;
  }

  if (!config.roomFurnitureByRoom || typeof config.roomFurnitureByRoom !== 'object') {
    config.roomFurnitureByRoom = {};
  }
  const step3 = config.steps.find((s) => Number(s?.stepId) === 3);
  const foldersFromStep3 = (step3?.items || [])
    .map((it) => String(it.key || it.categoryId || '').trim())
    .filter(Boolean);
  // Папки шага 3 = ключи catalog_* (46,42,43,44,48…). Синхронизируем привязку кухни,
  // иначе смена key (41→48) оставляет старый 41 в catalogFolderKeys и папка пропадает.
  const prevKitchen = config.roomFurnitureByRoom.kitchen;
  const layoutKeys = Array.isArray(prevKitchen?.layoutKeys) ? prevKitchen.layoutKeys : [];
  config.roomFurnitureByRoom.kitchen = {
    layoutKeys,
    catalogFolderKeys: foldersFromStep3.length
      ? foldersFromStep3
      : Array.isArray(prevKitchen?.catalogFolderKeys) && prevKitchen.catalogFolderKeys.length
        ? prevKitchen.catalogFolderKeys.map(String)
        : ['45'],
  };

  return config;
}

function wallLen(room, wallName) {
  if (!room) return 0;
  if (typeof room.wallLengthOf === 'function') return room.wallLengthOf(wallName);
  return wallName === 'left' || wallName === 'right' ? room.depth : room.width;
}

function makeOpeningGap(wallName, room, opts = {}) {
  const len = wallLen(room, wallName);
  const margin = Number.isFinite(opts.marginMm) ? opts.marginMm : 80;
  let widthMm = Number.isFinite(opts.widthMm) ? opts.widthMm : Math.max(600, len - margin * 2);
  widthMm = Math.min(widthMm, Math.max(400, len - 40));
  let alongMm = Number.isFinite(opts.alongMm) ? opts.alongMm : len / 2;
  const half = widthMm / 2;
  alongMm = Math.max(half + 20, Math.min(len - half - 20, alongMm));
  const heightMm = Math.max(800, (Number(room.height) || 2500) - 40);
  return {
    id: 'kitchen-shape-' + wallName + '-' + Math.floor(alongMm),
    type: 'door',
    kind: 'opening',
    wallName,
    alongMm,
    widthMm,
    heightMm,
    sillMm: 0,
    name: 'Открытый проём',
    thumb: '',
    modelUrl: '',
    openingDirection: 'INWARDS',
    handleSide: 'LEFT',
  };
}

export function openingsForKitchenRoomShape(shapeKey, room) {
  if (!room) return [];
  // Реальная геометрия: открытые стены = omit segment, не hole.
  if (room.footprintSpec && room.footprintSpec.shapeKey) {
    return [];
  }
  const key = String(shapeKey || '').trim();
  const lenFront = wallLen(room, 'front');

  switch (key) {
    case 'open_one_wall':
      return [makeOpeningGap('front', room)];
    case 'open_corner':
      return [makeOpeningGap('front', room), makeOpeningGap('right', room)];
    case 'open_protrusion': {
      const w = Math.max(800, Math.round(lenFront * 0.45));
      return [
        makeOpeningGap('front', room, {
          widthMm: w,
          alongMm: lenFront - w / 2 - 80,
        }),
      ];
    }
    case 'enclosed_rect':
    case 'enclosed_notch':
    case 'enclosed_chamfer':
    default:
      return [];
  }
}

/**
 * Применить форму: пересобрать Room по footprint (полигон).
 */
export function applyKitchenRoomShapeToRoom(shapeKey) {
  const key = String(shapeKey || 'enclosed_rect').trim();
  try {
    if (typeof window !== 'undefined') {
      window.selectedKitchenRoomShape = { key, at: Date.now() };
    }
    if (state) state.kitchenRoomShapeKey = key;
  } catch (_) {}

  if (typeof window !== 'undefined' && typeof window.__cldRecreateRoomWithShape === 'function') {
    return !!window.__cldRecreateRoomWithShape(key);
  }

  const room = state.room;
  if (!room || typeof room.applyOpenings !== 'function') return false;
  const list = openingsForKitchenRoomShape(shapeKey, room);
  state.roomEditOpenings = list.slice();
  room.applyOpenings(list);
  return true;
}

export { footprintSpecForShape, isNonRectKitchenShape, normalizeShapeOrient, shapeHasOrientVariants };

/**
 * SVG форм кухни: толстые стены как у PAX createLayoutIcon,
 * заливка пола + пунктир открытых сторон как у IKEA Choose room shape.
 * @param {string} shapeKey
 * @param {number} [size]
 * @param {number} [orient] 0..3 — вариант угла
 */
export function createKitchenRoomShapeIcon(shapeKey, size = 120, orient = 0) {
  const s = size;
  const m = 14;
  const x0 = m;
  const y0 = m;
  const x1 = s - m;
  const y1 = s - m;
  const wt = Math.max(9, Math.round(s * 0.1));
  const key = String(shapeKey || 'enclosed_rect');
  const o = normalizeShapeOrient(orient);

  /** Пол (заливка при выборе): замкнутый полигон */
  let floorPts = [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ];
  /** Стены: сегменты [[xA,yA],[xB,yB], ...] */
  let wallSegs = [];
  /** Открытые рёбра — пунктир */
  let openEdges = [];

  if (shapeHasOrientVariants(key)) {
    const fp = footprintSpecForShape(key, 1000, 1000, {
      orient: o,
      nx: 550,
      nz: 450,
      c: 300,
      mid: 520,
      step: 180,
    });
    const map = (x, z) => [
      x0 + (x / 1000) * (x1 - x0),
      y0 + (z / 1000) * (y1 - y0),
    ];
    floorPts = (fp.vertices || []).map((v) => map(v.x, v.z));
    wallSegs = [];
    openEdges = [];
    for (const seg of fp.segments || []) {
      const a = map(seg.x1, seg.z1);
      const b = map(seg.x2, seg.z2);
      if (seg.open) openEdges.push([a, b]);
      else wallSegs.push([a, b]);
    }
  } else {
    // enclosed_rect — четыре стены
    wallSegs = [
      [
        [x0, y0],
        [x1, y0],
      ],
      [
        [x1, y0],
        [x1, y1],
      ],
      [
        [x1, y1],
        [x0, y1],
      ],
      [
        [x0, y1],
        [x0, y0],
      ],
    ];
  }

  function ptsToD(pts, close) {
    if (!pts || !pts.length) return '';
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) d += ` L ${pts[i][0]} ${pts[i][1]}`;
    if (close) d += ' Z';
    return d;
  }

  /** Толстый сегмент стены — filled rect, как createLayoutIcon */
  function segRect(a, b) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const px = -uy * (wt / 2);
    const py = ux * (wt / 2);
    const ext = wt * 0.5;
    const ax = a[0] - ux * ext;
    const ay = a[1] - uy * ext;
    const bx = b[0] + ux * ext;
    const by = b[1] + uy * ext;
    const d =
      `M ${ax + px} ${ay + py}` +
      ` L ${bx + px} ${by + py}` +
      ` L ${bx - px} ${by - py}` +
      ` L ${ax - px} ${ay - py} Z`;
    return `<path d="${d}" />`;
  }

  const floorD = ptsToD(floorPts, true);
  const wallsHtml = wallSegs.map((seg) => segRect(seg[0], seg[1])).join('');
  const openSw = Math.max(3, Math.round(wt * 0.45));
  const openD = openEdges
    .map((edge) => `M ${edge[0][0]} ${edge[0][1]} L ${edge[1][0]} ${edge[1][1]}`)
    .join(' ');

  const floor = `<path class="kitchen-room-shape-icon__floor room-layout-scheme__room" d="${floorD}" />`;
  const walls = wallsHtml
    ? `<g class="kitchen-room-shape-icon__wall room-layout-scheme__furniture">${wallsHtml}</g>`
    : '';
  const opens = openD
    ? `<path class="kitchen-room-shape-icon__open" d="${openD}" fill="none" stroke-linecap="square" stroke-width="${openSw}" stroke-dasharray="${openSw * 1.6} ${openSw * 1.2}" />`
    : '';

  return (
    `<svg class="kitchen-room-shape-icon room-layout-scheme" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" aria-hidden="true">` +
    floor +
    walls +
    opens +
    `</svg>`
  );
}
