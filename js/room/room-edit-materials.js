/**
 * Room materials panel (IKEA-like coverings): presets + walls / floor / ceiling.
 * Applies via existing Room meshes + IKEA v0 bind. Does not change UV / tileSize / lights.
 */
import * as THREE from 'three';
import { state } from '../utils/state.js';
import { isIkeaRoomLightV0 } from '../furniture/ikea-light-gate.js?v=20260907-nospeed1';
import {
  bindMeshToIkeaV0,
  resyncIkeaRoomFloorMap,
} from '../furniture/ikea-room-light-v0.js?v=20260913-hang-lite';

const WALL_NAMES = ['front', 'back', 'left', 'right'];
/** Default tile if material has no tileMm (IKEA dump / light herringbone). */
const FLOOR_TILE_MM_DEFAULT = 640;
/** Enlarged tile for denser Clodis oak / natural herringbone maps. */
const FLOOR_TILE_MM_LARGE = 2000;
const WALL_TILE_MM = 380;
const textureCache = new Map();

/** Legacy fallback only if WebP missing — prefer catalog WebP in ROOM_FLOOR_MATERIALS. */
export const LEGACY_FLOOR_HERRINGBONE_THUMB =
  '/assets/textures/floor/herringbone-light.webp';

export const ROOM_FLOOR_TEXTURE_DIR = '/assets/textures/floor/';

export const ROOM_WALL_MATERIALS = Object.freeze([
  { id: 'milk', name: 'Молочный', color: '#F2EFE8' },
  { id: 'warm-white', name: 'Тёплый белый', color: '#EAE7DF' },
  { id: 'greige', name: 'Greige', color: '#D8D2C8' },
  { id: 'sand', name: 'Песочный', color: '#D9C7AE' },
  { id: 'cashmere', name: 'Кашемир', color: '#C8B8A8' },
  { id: 'dusty-pink', name: 'Пыльно-розовый', color: '#D7BFC0' },
  { id: 'sage', name: 'Шалфейный', color: '#AEB8A7' },
  { id: 'smoky-blue', name: 'Дымчато-голубой', color: '#AAB9BF' },
  { id: 'graphite', name: 'Графитовый', color: '#56585A' },
  { id: 'ivory', name: 'Айвори', color: '#F1EBDD' },
  { id: 'oatmeal', name: 'Овсяный', color: '#DDD3C2' },
  { id: 'pearl', name: 'Жемчужный', color: '#E4E2DC' },
  { id: 'mushroom', name: 'Грибной', color: '#B9AC9D' },
  { id: 'taupe', name: 'Тауп', color: '#A99B8D' },
  { id: 'clay', name: 'Глиняный', color: '#B9967D' },
  { id: 'mocha', name: 'Мокко', color: '#8D796A' },
  { id: 'light-gray', name: 'Светло-серый', color: '#D6D6D2' },
  { id: 'stone-gray', name: 'Каменно-серый', color: '#B8B8B2' },
  { id: 'warm-gray', name: 'Тёплый серый', color: '#AAA69E' },
  { id: 'eucalyptus', name: 'Эвкалипт', color: '#91A397' },
  { id: 'olive', name: 'Оливковый', color: '#8D9274' },
  { id: 'deep-green', name: 'Глубокий зелёный', color: '#59675D' },
  { id: 'mist-blue', name: 'Туманный голубой', color: '#C5D0D2' },
  { id: 'denim-blue', name: 'Джинсовый', color: '#8299A3' },
  { id: 'deep-blue', name: 'Глубокий синий', color: '#536A73' },
  { id: 'powder-pink', name: 'Пудровый', color: '#E2CFCA' },
  { id: 'terracotta-soft', name: 'Мягкая терракота', color: '#C58F78' },
]);

/** Popular wall ids on the main materials screen (not the full catalog). */
export const ROOM_WALL_POPULAR_IDS = Object.freeze([
  'milk',
  'warm-white',
  'greige',
  'sand',
  'sage',
  'smoky-blue',
]);

/**
 * Filter chips for full wall catalog. One id may appear in several filters;
 * material objects themselves are not duplicated.
 */
export const ROOM_WALL_FILTERS = Object.freeze([
  { id: 'all', label: 'Все' },
  {
    id: 'light',
    label: 'Светлые',
    ids: Object.freeze(['milk', 'warm-white', 'ivory', 'pearl']),
  },
  {
    id: 'beige',
    label: 'Бежевые',
    ids: Object.freeze([
      'greige',
      'sand',
      'cashmere',
      'oatmeal',
      'mushroom',
      'taupe',
      'clay',
      'mocha',
    ]),
  },
  {
    id: 'gray',
    label: 'Серые',
    ids: Object.freeze(['light-gray', 'stone-gray', 'warm-gray', 'graphite']),
  },
  {
    id: 'green',
    label: 'Зелёные',
    ids: Object.freeze(['sage', 'eucalyptus', 'olive', 'deep-green']),
  },
  {
    id: 'blue',
    label: 'Голубые',
    ids: Object.freeze(['smoky-blue', 'mist-blue', 'denim-blue', 'deep-blue']),
  },
  {
    id: 'pink',
    label: 'Розовые',
    ids: Object.freeze(['dusty-pink', 'powder-pink', 'terracotta-soft']),
  },
  {
    id: 'dark',
    label: 'Тёмные',
    ids: Object.freeze(['graphite', 'mocha', 'deep-green', 'deep-blue']),
  },
]);

/** Popular floor ids on the main screen. */
export const ROOM_FLOOR_POPULAR_IDS = Object.freeze([
  'lightHerringbone',
  'lightOak',
  'naturalOak',
  'naturalHerringbone',
  'darkOak',
]);

export const ROOM_FLOOR_FILTERS = Object.freeze([
  { id: 'all', label: 'Все' },
  {
    id: 'oak',
    label: 'Дуб',
    ids: Object.freeze([
      'whitewashedOak',
      'lightOak',
      'naturalOak',
      'honeyOak',
      'darkOak',
    ]),
  },
  {
    id: 'herringbone',
    label: 'Ёлочка',
    ids: Object.freeze(['lightHerringbone', 'naturalHerringbone']),
  },
  {
    id: 'light',
    label: 'Светлые',
    ids: Object.freeze(['lightHerringbone', 'whitewashedOak', 'lightOak']),
  },
  {
    id: 'natural',
    label: 'Натуральные',
    ids: Object.freeze(['naturalOak', 'naturalHerringbone', 'honeyOak']),
  },
  {
    id: 'dark',
    label: 'Тёмные',
    ids: Object.freeze(['darkOak']),
  },
]);

/**
 * Floor materials: seamless WebP under ROOM_FLOOR_TEXTURE_DIR.
 * tileMm = physical size of one seamless square (shader floorMapTileM).
 */
export const ROOM_FLOOR_MATERIALS = Object.freeze([
  {
    id: 'lightHerringbone',
    name: 'Ёлочка светлая',
    thumb: ROOM_FLOOR_TEXTURE_DIR + 'herringbone-light.webp',
    fallbackThumb: LEGACY_FLOOR_HERRINGBONE_THUMB,
    hex: '#E0D0B0',
    tileMm: FLOOR_TILE_MM_DEFAULT,
  },
  {
    id: 'naturalHerringbone',
    name: 'Ёлочка натуральная',
    thumb: ROOM_FLOOR_TEXTURE_DIR + 'herringbone-natural.webp',
    fallbackThumb: LEGACY_FLOOR_HERRINGBONE_THUMB,
    hex: '#C9A66B',
    tileMm: FLOOR_TILE_MM_LARGE,
  },
  {
    id: 'whitewashedOak',
    name: 'Дуб белёный',
    thumb: ROOM_FLOOR_TEXTURE_DIR + 'oak-whitewashed.webp',
    hex: '#E8E2D8',
    tileMm: FLOOR_TILE_MM_LARGE,
  },
  {
    id: 'lightOak',
    name: 'Дуб светлый',
    thumb: ROOM_FLOOR_TEXTURE_DIR + 'oak-light.webp',
    hex: '#D8D6D2',
    tileMm: FLOOR_TILE_MM_LARGE,
  },
  {
    id: 'naturalOak',
    name: 'Дуб натуральный',
    thumb: ROOM_FLOOR_TEXTURE_DIR + 'oak-natural.webp',
    hex: '#C4A574',
    tileMm: FLOOR_TILE_MM_DEFAULT,
  },
  {
    id: 'honeyOak',
    name: 'Дуб медовый',
    thumb: ROOM_FLOOR_TEXTURE_DIR + 'oak-honey.webp',
    hex: '#C9A05A',
    tileMm: FLOOR_TILE_MM_LARGE,
  },
  {
    id: 'darkOak',
    name: 'Дуб тёмный',
    thumb: ROOM_FLOOR_TEXTURE_DIR + 'oak-dark.webp',
    hex: '#6B5A48',
    tileMm: FLOOR_TILE_MM_LARGE,
  },
]);

export const ROOM_CEILING_MATERIALS = Object.freeze([
  { id: 'white', name: 'Белый', color: '#F5F5F2' },
  { id: 'warm-white', name: 'Тёплый белый', color: '#EEEAE2' },
  { id: 'greige', name: 'Greige', color: '#D8D2C8' },
]);

/** Preset applies wall + floor + ceiling together; card preview is a static Blender image. */
export const ROOM_MATERIAL_PRESET_DIR = '/assets/material-presets/';
const PRESET_PREVIEW_BUST = '?v=20260913-preset-contrast-smoky';

/** Catalog presets — Blender card previews under ROOM_MATERIAL_PRESET_DIR. */
export const ROOM_MATERIAL_PRESETS = Object.freeze([
  {
    id: 'light',
    name: 'Светлая',
    preview: ROOM_MATERIAL_PRESET_DIR + 'light.webp' + PRESET_PREVIEW_BUST,
    wall: 'milk',
    floor: 'lightHerringbone',
    ceiling: 'white',
  },
  {
    id: 'warm',
    name: 'Тёплая',
    preview: ROOM_MATERIAL_PRESET_DIR + 'warm.webp' + PRESET_PREVIEW_BUST,
    wall: 'sand',
    floor: 'lightHerringbone',
    ceiling: 'warm-white',
  },
  {
    id: 'natural',
    name: 'Natural',
    preview: ROOM_MATERIAL_PRESET_DIR + 'natural.webp' + PRESET_PREVIEW_BUST,
    wall: 'sage',
    floor: 'naturalHerringbone',
    ceiling: 'white',
  },
  {
    id: 'color',
    name: 'Цветная',
    preview: ROOM_MATERIAL_PRESET_DIR + 'color.webp' + PRESET_PREVIEW_BUST,
    wall: 'smoky-blue',
    floor: 'lightHerringbone',
    ceiling: 'white',
  },
  {
    id: 'contrast',
    name: 'Акцентная',
    preview: ROOM_MATERIAL_PRESET_DIR + 'contrast.webp' + PRESET_PREVIEW_BUST,
    /** Fallback if wallsBySide missing — not used for accent apply. */
    wall: 'smoky-blue',
    wallsBySide: Object.freeze({
      back: 'smoky-blue',
      front: 'milk',
      left: 'milk',
      right: 'milk',
    }),
    floor: 'lightHerringbone',
    ceiling: 'white',
  },
]);

/** Admin / room_steps_config fallback shape (legacy keys hex/thumb). */
export const DEFAULT_ROOM_EDIT_MATERIALS = Object.freeze({
  walls: Object.freeze(
    ROOM_WALL_MATERIALS.map((m) =>
      Object.freeze({ id: m.id, name: m.name, group: 'Краска', hex: m.color })
    )
  ),
  floors: Object.freeze(
    ROOM_FLOOR_MATERIALS.map((m) =>
      Object.freeze({
        id: m.id,
        name: m.name,
        group: 'Пол',
        thumb: m.fallbackThumb || m.thumb,
        hex: m.hex || '',
      })
    )
  ),
  ceilings: Object.freeze(
    ROOM_CEILING_MATERIALS.map((m) =>
      Object.freeze({ id: m.id, name: m.name, group: '', hex: m.color })
    )
  ),
});

function findWall(id) {
  return ROOM_WALL_MATERIALS.find((m) => m.id === id) || null;
}

function findFloor(id) {
  return ROOM_FLOOR_MATERIALS.find((m) => m.id === id) || null;
}

function findCeiling(id) {
  return ROOM_CEILING_MATERIALS.find((m) => m.id === id) || null;
}

function findPreset(id) {
  return ROOM_MATERIAL_PRESETS.find((m) => m.id === id) || null;
}

function wallToItem(m) {
  if (!m) return null;
  return { id: m.id, name: m.name, surface: 'walls', hex: normalizeHex(m.color), thumb: '' };
}

function floorToItem(m) {
  if (!m) return null;
  return {
    id: m.id,
    name: m.name,
    surface: 'floors',
    hex: normalizeHex(m.hex || ''),
    thumb: (m.thumb || '').trim(),
    fallbackThumb: (m.fallbackThumb || '').trim(),
    tileMm: Number(m.tileMm) > 0 ? Number(m.tileMm) : FLOOR_TILE_MM_DEFAULT,
  };
}

function resolveFloorTileMm(item) {
  const id = item?.id || item?.catalogId || '';
  const fromCat = id ? findFloor(id) : null;
  const n = Number(item?.tileMm ?? fromCat?.tileMm);
  return n > 0 ? n : FLOOR_TILE_MM_DEFAULT;
}

function ceilingToItem(m) {
  if (!m) return null;
  return { id: m.id, name: m.name, surface: 'ceilings', hex: normalizeHex(m.color), thumb: '' };
}

function ensureMaterialsState() {
  if (!state.roomEditMaterials || typeof state.roomEditMaterials !== 'object') {
    state.roomEditMaterials = {
      walls: null,
      floors: null,
      ceilings: null,
      presetId: null,
      wallsBySide: null,
    };
  }
  if (!('presetId' in state.roomEditMaterials)) {
    state.roomEditMaterials.presetId = null;
  }
  ensureWallsBySide();
  return state.roomEditMaterials;
}

function wallEntryFromItem(item) {
  if (!item) return null;
  return {
    catalogId: item.id || item.catalogId || '',
    name: item.name || '',
    hex: item.hex || '',
    thumb: item.thumb || '',
    fallbackThumb: item.fallbackThumb || '',
  };
}

function itemFromWallEntry(entry) {
  if (!entry) return null;
  return {
    id: entry.catalogId || entry.id || '',
    name: entry.name || '',
    surface: 'walls',
    hex: normalizeHex(entry.hex || '') || '',
    thumb: (entry.thumb || '').trim(),
    fallbackThumb: (entry.fallbackThumb || '').trim(),
  };
}

/** Seed / keep wallsBySide in sync with legacy walls when missing. */
function ensureWallsBySide() {
  const mats = state.roomEditMaterials;
  if (!mats || typeof mats !== 'object') return null;
  const seed = mats.walls;
  if (!mats.wallsBySide || typeof mats.wallsBySide !== 'object') {
    mats.wallsBySide = {
      front: seed ? { ...seed } : null,
      back: seed ? { ...seed } : null,
      left: seed ? { ...seed } : null,
      right: seed ? { ...seed } : null,
    };
  }
  WALL_NAMES.forEach((side) => {
    if (!mats.wallsBySide[side] && seed) {
      mats.wallsBySide[side] = { ...seed };
    }
  });
  return mats.wallsBySide;
}

function setAllWallsBySideFromItem(item) {
  const mats = ensureMaterialsState();
  const entry = wallEntryFromItem(item);
  ensureWallsBySide();
  WALL_NAMES.forEach((side) => {
    mats.wallsBySide[side] = entry ? { ...entry } : null;
  });
}

function wallsBySideAreMixed() {
  const by = ensureWallsBySide();
  if (!by) return false;
  const ids = WALL_NAMES.map((s) => by[s] && by[s].catalogId).filter(Boolean);
  if (ids.length < 2) return false;
  return ids.some((id) => id !== ids[0]);
}

function normalizeHex(raw) {
  if (raw == null || raw === '') return null;
  let s = String(raw).trim();
  if (!s.startsWith('#')) s = '#' + s;
  if (!/^#[0-9a-fA-F]{3,8}$/.test(s)) return null;
  if (s.length === 4) {
    s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
  }
  return s;
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function prepareMapTexture(texture, repeatX, repeatY) {
  if (!texture) return null;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 4;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  if (typeof window.__cldPrepareIkeaV0Map === 'function') {
    window.__cldPrepareIkeaV0Map(texture);
  } else if (texture.colorSpace !== undefined && THREE.SRGBColorSpace !== undefined) {
    texture.colorSpace = THREE.SRGBColorSpace;
  }
  if (typeof texture.updateMatrix === 'function') texture.updateMatrix();
  return texture;
}

function loadTexture(url) {
  const key = String(url || '');
  if (!key) return Promise.resolve(null);
  if (textureCache.has(key)) return Promise.resolve(textureCache.get(key));
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      key,
      (tex) => {
        textureCache.set(key, tex);
        resolve(tex);
      },
      undefined,
      () => resolve(null)
    );
  });
}

function bindVisual(mesh, kind, opts) {
  if (!mesh?.isMesh) return;
  if (isIkeaRoomLightV0()) {
    bindMeshToIkeaV0(mesh, kind, { ...opts, forceVisual: true });
    return;
  }
  const mat = mesh.material;
  if (!mat) return;
  if (opts.map) {
    mat.map = opts.map;
    mat.color.set(0xffffff);
  } else if (opts.color?.isColor) {
    mat.map = null;
    mat.color.copy(opts.color);
  }
  mat.needsUpdate = true;
}

function applyHex(mesh, kind, hex) {
  if (!hex) return;
  bindVisual(mesh, kind, { color: new THREE.Color(hex) });
}

async function applyThumb(mesh, kind, thumb, room, repeatX, repeatY) {
  if (!thumb) return false;
  const src = await loadTexture(thumb);
  if (!src) return false;
  prepareMapTexture(src, repeatX, repeatY);
  bindVisual(mesh, kind, { map: src });
  if (kind === 'floor' && room) {
    room.floorTexture = src;
    if (isIkeaRoomLightV0()) resyncIkeaRoomFloorMap(room, src);
  }
  return true;
}

async function applyItemToMesh(mesh, kind, item, room, repeatX, repeatY) {
  if (!mesh || !item) return;
  const thumbs = [item.thumb, item.fallbackThumb].filter(Boolean);
  for (let i = 0; i < thumbs.length; i++) {
    const ok = await applyThumb(mesh, kind, thumbs[i], room, repeatX, repeatY);
    if (ok) return;
  }
  if (item.hex) applyHex(mesh, kind, item.hex);
}

async function applyWalls(item) {
  const room = state.room;
  if (!room?.wallInners || !item) return;
  const normalized = item.id ? item : itemFromWallEntry(item);
  if (!normalized) return;
  const rw = room.width;
  const rd = room.depth;
  const jobs = [];
  WALL_NAMES.forEach((name) => {
    const inner = room.wallInners[name];
    const frame = room.walls && room.walls[name];
    const repeatX = name === 'left' || name === 'right' ? rd / WALL_TILE_MM : rw / WALL_TILE_MM;
    const repeatY = room.height / WALL_TILE_MM;
    if (inner) jobs.push(applyItemToMesh(inner, 'wall', normalized, room, repeatX, repeatY));
    if (frame) jobs.push(applyItemToMesh(frame, 'frame', normalized, room, repeatX, repeatY));
  });
  await Promise.all(jobs);
  setAllWallsBySideFromItem(normalized);
}

/** Paint a single room side (frame + inner). Used by contrast preset. */
export async function applyWallBySide(side, item) {
  if (!WALL_NAMES.includes(side) || !item || !state.room) return false;
  const normalized = item.id ? item : itemFromWallEntry(item);
  if (!normalized) return false;
  ensureWallsBySide();
  const room = state.room;
  const rw = room.width;
  const rd = room.depth;
  const inner = room.wallInners && room.wallInners[side];
  const frame = room.walls && room.walls[side];
  const repeatX = side === 'left' || side === 'right' ? rd / WALL_TILE_MM : rw / WALL_TILE_MM;
  const repeatY = room.height / WALL_TILE_MM;
  const jobs = [];
  if (inner) jobs.push(applyItemToMesh(inner, 'wall', normalized, room, repeatX, repeatY));
  if (frame) jobs.push(applyItemToMesh(frame, 'frame', normalized, room, repeatX, repeatY));
  await Promise.all(jobs);
  ensureMaterialsState().wallsBySide[side] = wallEntryFromItem(normalized);
  return true;
}

async function applyFloor(item) {
  const room = state.room;
  if (!room?.floorCoating) return;
  const normalized = item.id ? item : { ...item, id: item.catalogId };
  const tileMm = resolveFloorTileMm(normalized);
  const rx = room.width / tileMm;
  const ry = room.depth / tileMm;
  await applyItemToMesh(room.floorCoating, 'floor', normalized, room, rx, ry);
  const mat = room.floorCoating.material;
  if (mat?.uniforms?.floorMapTileM) {
    mat.uniforms.floorMapTileM.value = tileMm / 1000;
  }
}

async function applyCeiling(item) {
  const room = state.room;
  const mesh = room?.walls?.ceiling;
  if (!mesh) return;
  const normalized = item.id ? item : { ...item, id: item.catalogId };
  await applyItemToMesh(mesh, 'ceiling', normalized, room, 1, 1);
}

function storeSurface(surface, item) {
  const mats = ensureMaterialsState();
  const entry = {
    catalogId: item.id || item.catalogId || '',
    name: item.name || '',
    hex: item.hex || '',
    thumb: item.thumb || '',
    fallbackThumb: item.fallbackThumb || '',
  };
  if (surface === 'floors') {
    entry.tileMm = resolveFloorTileMm(item);
  }
  mats[surface] = entry;
  if (surface === 'walls') {
    setAllWallsBySideFromItem({ ...item, id: entry.catalogId });
  }
}

export async function applyRoomEditSurfaceMaterial(surface, item, opts) {
  if (!item || !state.room) return false;
  const clearPreset = !opts || opts.clearPreset !== false;
  storeSurface(surface, item);
  if (clearPreset) {
    ensureMaterialsState().presetId = null;
  }
  if (surface === 'walls') await applyWalls(item);
  else if (surface === 'floors') await applyFloor(item);
  else if (surface === 'ceilings') await applyCeiling(item);
  else return false;
  syncStyleCardSelection();
  return true;
}

export async function applyRoomMaterialPreset(presetId) {
  const preset = findPreset(presetId);
  if (!preset || !state.room) return false;
  const floorId = preset.floor || preset.floorId;
  const ceilingId = preset.ceiling || preset.ceilingId;
  const floor = floorToItem(findFloor(floorId));
  const ceiling = ceilingToItem(findCeiling(ceilingId));
  if (!floor || !ceiling) return false;

  const mats = ensureMaterialsState();
  mats.presetId = preset.id;

  if (preset.wallsBySide) {
    for (let i = 0; i < WALL_NAMES.length; i++) {
      const side = WALL_NAMES[i];
      const wid = preset.wallsBySide[side];
      const wItem = wallToItem(findWall(wid));
      if (!wItem) return false;
      await applyWallBySide(side, wItem);
    }
    // Legacy unified field for UI: front (milk) — does not rewrite wallsBySide.
    const uiWall = wallToItem(findWall(preset.wallsBySide.front || preset.wall));
    if (uiWall) {
      mats.walls = wallEntryFromItem(uiWall);
    }
  } else {
    const wallId = preset.wall || preset.wallId;
    const wall = wallToItem(findWall(wallId));
    if (!wall) return false;
    await applyRoomEditSurfaceMaterial('walls', wall, { clearPreset: false });
  }

  await applyRoomEditSurfaceMaterial('floors', floor, { clearPreset: false });
  await applyRoomEditSurfaceMaterial('ceilings', ceiling, { clearPreset: false });
  mats.presetId = preset.id;
  syncStyleCardSelection();
  return true;
}

function itemFromCard(card) {
  if (!card) return null;
  const surface = card.getAttribute('data-surface');
  if (!surface) return null;
  return {
    id: card.getAttribute('data-id') || '',
    name: card.getAttribute('data-name') || '',
    surface,
    hex: normalizeHex(card.getAttribute('data-hex') || ''),
    thumb: (card.getAttribute('data-thumb') || '').trim(),
    fallbackThumb: (card.getAttribute('data-fallback-thumb') || '').trim(),
  };
}

/** UI navigation inside the style panel (home vs full catalogs). */
let materialsUiView = 'home';
let wallFilterId = 'all';
let wallSearchQuery = '';
let floorFilterId = 'all';

function syncStyleCardSelection() {
  const mats = ensureMaterialsState();
  document.querySelectorAll('#cld-room-edit-catalog-style [data-surface]').forEach((card) => {
    const surface = card.getAttribute('data-surface');
    const id = card.getAttribute('data-id');
    const sel = mats[surface];
    card.classList.toggle('is-selected', !!(sel && sel.catalogId === id));
  });
  document.querySelectorAll('#cld-room-edit-catalog-style [data-preset]').forEach((card) => {
    const id = card.getAttribute('data-preset');
    card.classList.toggle('is-selected', mats.presetId === id);
  });
  document.querySelectorAll('#cld-room-edit-catalog-style [data-mat-filter]').forEach((chip) => {
    const id = chip.getAttribute('data-mat-filter');
    const active =
      materialsUiView === 'walls'
        ? id === wallFilterId
        : materialsUiView === 'floors'
          ? id === floorFilterId
          : false;
    chip.classList.toggle('is-active', active);
    chip.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function updateStylePanelChrome() {
  const panel = document.getElementById('cld-room-edit-panel-style');
  if (!panel) return;
  const title = panel.querySelector('.cld-room-edit-title');
  const hint = panel.querySelector('.cld-room-edit-hint');
  const home = materialsUiView === 'home';
  if (title) title.hidden = !home;
  if (hint) hint.hidden = !home;
  panel.classList.toggle('cld-style-panel--catalog', !home);
}

function bindPresetPreviewFallback(root) {
  root.querySelectorAll('.cld-mat-preset__img').forEach((img) => {
    if (img._rePresetFb) return;
    img._rePresetFb = true;
    img.addEventListener('error', () => {
      img.style.display = 'none';
      const wrap = img.parentElement;
      if (wrap) wrap.style.background = '#F5F5F5';
    });
  });
}

function bindFloorThumbFallback(root) {
  root.querySelectorAll('.cld-mat-swatch__img').forEach((img) => {
    if (img._reFloorFb) return;
    img._reFloorFb = true;
    img.addEventListener('error', () => {
      const card = img.closest('[data-fallback-thumb], [data-hex]');
      const fb = card && card.getAttribute('data-fallback-thumb');
      if (fb && img.getAttribute('src') !== fb) {
        img.setAttribute('src', fb);
        return;
      }
      img.style.display = 'none';
      const sw = img.parentElement;
      if (sw && card) {
        const hex = card.getAttribute('data-hex') || '#E8E8E8';
        sw.style.background = hex;
      }
    });
  });
}

function syncMatScrollFades(wrap) {
  if (!wrap) return;
  const row = wrap.querySelector('.cld-mat-row');
  if (!row) return;
  const max = Math.max(0, row.scrollWidth - row.clientWidth);
  const hasOverflow = max > 2;
  const atStart = row.scrollLeft <= 2;
  const atEnd = !hasOverflow || row.scrollLeft >= max - 2;
  wrap.classList.toggle('has-overflow', hasOverflow);
  wrap.classList.toggle('at-start', atStart);
  wrap.classList.toggle('at-end', atEnd);
}

/** Horizontal rows: wheel→scrollLeft, fade when overflow. */
function bindMaterialScrollRows(root) {
  if (!root) return;
  root.querySelectorAll('[data-mat-scroll]').forEach((wrap) => {
    const row = wrap.querySelector('.cld-mat-row');
    if (!row || row._matScrollBound) return;
    row._matScrollBound = true;

    const sync = () => syncMatScrollFades(wrap);
    row.addEventListener(
      'wheel',
      (e) => {
        const max = row.scrollWidth - row.clientWidth;
        if (max <= 2) return;
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
        const dy = e.deltaY;
        if (!dy) return;
        const atStart = row.scrollLeft <= 0;
        const atEnd = row.scrollLeft >= max - 1;
        if (dy < 0 && atStart) return;
        if (dy > 0 && atEnd) return;
        e.preventDefault();
        row.scrollLeft += dy;
        sync();
      },
      { passive: false }
    );
    row.addEventListener('scroll', sync, { passive: true });
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(sync);
      ro.observe(row);
      ro.observe(wrap);
    }
    row.querySelectorAll('img').forEach((img) => {
      if (!img.complete) img.addEventListener('load', sync, { once: true });
    });
    requestAnimationFrame(sync);
  });
}

function materialsByIds(list, ids) {
  const map = new Map(list.map((m) => [m.id, m]));
  return ids.map((id) => map.get(id)).filter(Boolean);
}

function filterMaterialsByChip(list, filters, filterId) {
  if (!filterId || filterId === 'all') return list.slice();
  const chip = filters.find((f) => f.id === filterId);
  if (!chip || !chip.ids) return list.slice();
  const allow = new Set(chip.ids);
  return list.filter((m) => allow.has(m.id));
}

function filterWallsForCatalog() {
  let list = filterMaterialsByChip(ROOM_WALL_MATERIALS, ROOM_WALL_FILTERS, wallFilterId);
  const q = wallSearchQuery.trim().toLowerCase();
  if (q) {
    list = list.filter((m) => String(m.name || '').toLowerCase().includes(q));
  }
  return list;
}

function filterFloorsForCatalog() {
  return filterMaterialsByChip(ROOM_FLOOR_MATERIALS, ROOM_FLOOR_FILTERS, floorFilterId);
}

function swatchButtonHtml(item, surface, opts) {
  const hex = item.hex || item.color || '#E8E8E8';
  const isFloor = surface === 'floors';
  const displayThumb = isFloor ? item.thumb || item.fallbackThumb || '' : '';
  const extraClass = opts && opts.catalog ? ' cld-mat-swatch--catalog' : '';
  let preview;
  if (isFloor && displayThumb) {
    preview =
      '<span class="cld-mat-swatch__preview" style="background:' +
      escapeHtml(hex) +
      '">' +
      '<img class="cld-mat-swatch__img" alt="" src="' +
      escapeHtml(displayThumb) +
      '" loading="lazy">' +
      '</span>';
  } else if (isFloor) {
    preview =
      '<span class="cld-mat-swatch__preview" style="background:' +
      escapeHtml(hex) +
      '"></span>';
  } else {
    preview =
      '<span class="cld-mat-swatch__preview" style="background:' +
      escapeHtml(hex) +
      '"></span>';
  }
  return (
    '<button type="button" class="cld-mat-swatch' +
    extraClass +
    '" data-surface="' +
    escapeHtml(surface) +
    '" data-id="' +
    escapeHtml(item.id) +
    '" data-name="' +
    escapeHtml(item.name) +
    '" data-hex="' +
    escapeHtml(hex) +
    '" data-thumb="' +
    escapeHtml(item.thumb || '') +
    '" data-fallback-thumb="' +
    escapeHtml(item.fallbackThumb || '') +
    '">' +
    preview +
    '<span class="cld-mat-swatch__name">' +
    escapeHtml(item.name) +
    '</span></button>'
  );
}

function presetCardHtml(preset) {
  const src = (preset.preview || '').trim();
  return (
    '<button type="button" class="cld-mat-preset" data-preset="' +
    escapeHtml(preset.id) +
    '" aria-label="' +
    escapeHtml(preset.name) +
    '">' +
    '<span class="cld-mat-preset__preview" aria-hidden="true">' +
    (src
      ? '<img class="cld-mat-preset__img" alt="" src="' +
        escapeHtml(src) +
        '" loading="lazy" width="148" height="118">'
      : '') +
    '</span>' +
    '<span class="cld-mat-preset__name">' +
    escapeHtml(preset.name) +
    '</span></button>'
  );
}

function sectionHeadHtml(title, moreLabel, openKey) {
  return (
    '<div class="cld-mat-section__head">' +
    '<h3 class="cld-mat-section__title">' +
    escapeHtml(title) +
    '</h3>' +
    '<button type="button" class="cld-mat-section__more" data-mat-open="' +
    escapeHtml(openKey) +
    '">' +
    escapeHtml(moreLabel) +
    '</button></div>'
  );
}

function sectionHtml(title, rowClass, cardsHtml, opts) {
  const scrollable = !opts || opts.scrollable !== false;
  const moreLabel = opts && opts.moreLabel;
  const openKey = opts && opts.openKey;
  const head =
    moreLabel && openKey
      ? sectionHeadHtml(title, moreLabel, openKey)
      : '<h3 class="cld-mat-section__title">' + escapeHtml(title) + '</h3>';
  const row =
    '<div class="cld-mat-row ' +
    escapeHtml(rowClass) +
    '">' +
    cardsHtml +
    '</div>';
  const body = scrollable
    ? '<div class="cld-mat-scroll" data-mat-scroll>' + row + '</div>'
    : row;
  return '<section class="cld-mat-section">' + head + body + '</section>';
}

function filterChipsHtml(filters, activeId) {
  return (
    '<div class="cld-mat-filters" role="toolbar" aria-label="Фильтры">' +
    filters
      .map((f) => {
        const active = f.id === activeId;
        return (
          '<button type="button" class="cld-mat-chip' +
          (active ? ' is-active' : '') +
          '" data-mat-filter="' +
          escapeHtml(f.id) +
          '" aria-pressed="' +
          (active ? 'true' : 'false') +
          '">' +
          escapeHtml(f.label) +
          '</button>'
        );
      })
      .join('') +
    '</div>'
  );
}

function catalogBackHtml() {
  return (
    '<button type="button" class="cld-mat-back" data-mat-back>' +
    '<span class="cld-mat-back__arrow" aria-hidden="true">←</span>' +
    ' Материалы комнаты</button>'
  );
}

function renderHomeCatalogHtml() {
  const presets = ROOM_MATERIAL_PRESETS.map(presetCardHtml).join('');
  const walls = materialsByIds(ROOM_WALL_MATERIALS, ROOM_WALL_POPULAR_IDS)
    .map((m) => swatchButtonHtml({ id: m.id, name: m.name, color: m.color, hex: m.color }, 'walls'))
    .join('');
  const floors = materialsByIds(ROOM_FLOOR_MATERIALS, ROOM_FLOOR_POPULAR_IDS)
    .map((m) => swatchButtonHtml(m, 'floors'))
    .join('');
  const ceilings = ROOM_CEILING_MATERIALS.map((m) =>
    swatchButtonHtml({ id: m.id, name: m.name, color: m.color, hex: m.color }, 'ceilings')
  ).join('');

  return (
    sectionHtml('Готовые сочетания', 'cld-mat-row--presets', presets) +
    sectionHtml('Стены', 'cld-mat-row--walls cld-mat-row--popular', walls, {
      scrollable: false,
      moreLabel: 'Все цвета →',
      openKey: 'walls',
    }) +
    sectionHtml('Пол', 'cld-mat-row--floors cld-mat-row--popular', floors, {
      scrollable: false,
      moreLabel: 'Все варианты →',
      openKey: 'floors',
    }) +
    sectionHtml('Потолок', 'cld-mat-row--ceilings cld-mat-row--home', ceilings, {
      scrollable: false,
      moreLabel: 'Все цвета →',
      openKey: 'ceilings',
    })
  );
}

function renderWallsCatalogHtml() {
  const items = filterWallsForCatalog();
  const grid = items
    .map((m) =>
      swatchButtonHtml(
        { id: m.id, name: m.name, color: m.color, hex: m.color },
        'walls',
        { catalog: true }
      )
    )
    .join('');
  return (
    '<div class="cld-mat-catalog" data-mat-catalog="walls">' +
    catalogBackHtml() +
    '<h2 class="cld-mat-catalog__title">Стены</h2>' +
    '<label class="cld-mat-search">' +
    '<span class="cld-mat-search__label">Поиск цвета</span>' +
    '<input type="search" class="cld-mat-search__input" data-mat-search placeholder="Название…" value="' +
    escapeHtml(wallSearchQuery) +
    '" autocomplete="off">' +
    '</label>' +
    filterChipsHtml(ROOM_WALL_FILTERS, wallFilterId) +
    '<div class="cld-mat-catalog-grid">' +
    (grid || '<p class="cld-mat-catalog__empty">Ничего не найдено</p>') +
    '</div></div>'
  );
}

function renderFloorsCatalogHtml() {
  const items = filterFloorsForCatalog();
  const grid = items.map((m) => swatchButtonHtml(m, 'floors', { catalog: true })).join('');
  return (
    '<div class="cld-mat-catalog" data-mat-catalog="floors">' +
    catalogBackHtml() +
    '<h2 class="cld-mat-catalog__title">Пол</h2>' +
    filterChipsHtml(ROOM_FLOOR_FILTERS, floorFilterId) +
    '<div class="cld-mat-catalog-grid">' +
    (grid || '<p class="cld-mat-catalog__empty">Ничего не найдено</p>') +
    '</div></div>'
  );
}

function renderCeilingsCatalogHtml() {
  const grid = ROOM_CEILING_MATERIALS.map((m) =>
    swatchButtonHtml(
      { id: m.id, name: m.name, color: m.color, hex: m.color },
      'ceilings',
      { catalog: true }
    )
  ).join('');
  return (
    '<div class="cld-mat-catalog" data-mat-catalog="ceilings">' +
    catalogBackHtml() +
    '<h2 class="cld-mat-catalog__title">Потолок</h2>' +
    '<div class="cld-mat-catalog-grid">' +
    grid +
    '</div></div>'
  );
}

function refreshMaterialsCatalogDom() {
  const container = document.getElementById('cld-room-edit-catalog-style');
  if (!container) return;
  updateStylePanelChrome();
  if (materialsUiView === 'walls') container.innerHTML = renderWallsCatalogHtml();
  else if (materialsUiView === 'floors') container.innerHTML = renderFloorsCatalogHtml();
  else if (materialsUiView === 'ceilings') container.innerHTML = renderCeilingsCatalogHtml();
  else container.innerHTML = renderHomeCatalogHtml();

  bindFloorThumbFallback(container);
  bindPresetPreviewFallback(container);
  bindMaterialScrollRows(container);
  syncStyleCardSelection();

  if (materialsUiView === 'walls') {
    const input = container.querySelector('[data-mat-search]');
    if (input && document.activeElement === input) {
      const len = input.value.length;
      input.setSelectionRange(len, len);
    }
  }
}

export function bindStyleCards() {
  const root = document.getElementById('cld-room-edit-catalog-style');
  if (!root) return;
  if (root._matUiBound) return;
  root._matUiBound = true;

  root.addEventListener('click', (e) => {
    const back = e.target.closest('[data-mat-back]');
    if (back) {
      materialsUiView = 'home';
      refreshMaterialsCatalogDom();
      return;
    }
    const open = e.target.closest('[data-mat-open]');
    if (open) {
      const key = open.getAttribute('data-mat-open');
      if (key === 'walls' || key === 'floors' || key === 'ceilings') {
        materialsUiView = key;
        refreshMaterialsCatalogDom();
      }
      return;
    }
    const chip = e.target.closest('[data-mat-filter]');
    if (chip) {
      const id = chip.getAttribute('data-mat-filter') || 'all';
      if (materialsUiView === 'walls') wallFilterId = id;
      else if (materialsUiView === 'floors') floorFilterId = id;
      refreshMaterialsCatalogDom();
      return;
    }
    const preset = e.target.closest('[data-preset].cld-mat-preset');
    if (preset) {
      const id = preset.getAttribute('data-preset');
      if (id) applyRoomMaterialPreset(id);
      return;
    }
    const card = e.target.closest('[data-surface].cld-mat-swatch');
    if (card) {
      const item = itemFromCard(card);
      if (item) applyRoomEditSurfaceMaterial(item.surface, item);
    }
  });

  root.addEventListener('input', (e) => {
    const input = e.target.closest('[data-mat-search]');
    if (!input) return;
    wallSearchQuery = input.value || '';
    // Rebuild grid without stealing focus awkwardly: full refresh + restore caret.
    const start = input.selectionStart;
    refreshMaterialsCatalogDom();
    const next = root.querySelector('[data-mat-search]');
    if (next) {
      next.focus();
      try {
        next.setSelectionRange(start, start);
      } catch (_) {}
    }
  });
}

/** Build style catalog DOM (presets + popular / full views). */
export function renderRoomMaterialsCatalog(container) {
  if (!container) return;
  refreshMaterialsCatalogDom();
}

export async function reapplyRoomEditMaterials() {
  const mats = ensureMaterialsState();
  ensureWallsBySide();
  const jobs = [];
  if (wallsBySideAreMixed()) {
    WALL_NAMES.forEach((side) => {
      const entry = mats.wallsBySide[side];
      if (entry) jobs.push(applyWallBySide(side, itemFromWallEntry(entry)));
    });
  } else if (mats.walls) {
    jobs.push(applyWalls(mats.walls));
  }
  if (mats.floors) jobs.push(applyFloor(mats.floors));
  if (mats.ceilings) jobs.push(applyCeiling(mats.ceilings));
  await Promise.all(jobs);
  syncStyleCardSelection();
}

export function mountRoomEditMaterials() {
  bindStyleCards();
  refreshMaterialsCatalogDom();
  reapplyRoomEditMaterials();
}

export function unmountRoomEditMaterials() {
  syncStyleCardSelection();
}

export function onRoomEditMaterialsPanelChanged() {
  syncStyleCardSelection();
}
