/**
 * Вещи на полке (IKEA propping): слоты на верхней пласти, не сетка как у штанги.
 * Конфиг — interiorTemplates.shelfProps на карточке наполнения.
 */
(function initClodisShelfProps(global) {
  'use strict';

  function isTruthyFlag(v) {
    return v === true || v === 1 || v === '1';
  }

  function num(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function hashU32(str) {
    let h = 2166136261;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /**
   * Пустые полки ≈ IKEA: ~10–15%, чаще низ колонки (не жёсткий «каждая 4-я»).
   * Высота модели (preview_ref.y) должна влазить в проём до следующей полки.
   */
  const OPENING_CLEARANCE_MM = 10;
  /** Доля пустых: база + бонус у низа колонки (colRank01: 0=низ, 1=верх). */
  const EMPTY_BASE = 0.08;
  const EMPTY_BOTTOM_EXTRA = 0.14;

  /**
   * Доп. пул без карточек / collection shelf (после отбора: KEEP=30).
   * stack|bag|shoes в lifestyle; box/hat тоже в extras — если включим kind в SHELF_LIFESTYLE_KINDS.
   */
  const COLLECTION_SHELF_EXTRAS = [
    { id: 'sp-folded-things-1', kind: 'stack', model: '/models/shelf-props/folded-things-1.glb', y: 160 },
    { id: 'cc-shelf-group_folded-items01', kind: 'stack', model: '/models/lifestyle-props/collection-clothing/shelf/shelf-group_folded-items01.glb', y: 160 },
    { id: 'cc-shelf-group_folded-items1', kind: 'stack', model: '/models/lifestyle-props/collection-clothing/shelf/shelf-group_folded-items1.glb', y: 180 },
    { id: 'cc-shelf-group_folded_items2', kind: 'stack', model: '/models/lifestyle-props/collection-clothing/shelf/shelf-group_folded_items2.glb', y: 170 },
    { id: 'cc-shelf-group_folded_items3', kind: 'stack', model: '/models/lifestyle-props/collection-clothing/shelf/shelf-group_folded_items3.glb', y: 150 },
    { id: 'cc-shelf-group_knitted_sweater', kind: 'stack', model: '/models/lifestyle-props/collection-clothing/shelf/shelf-group_knitted_sweater.glb', y: 140 },
    { id: 'cc-shelf-drip-city-tote003', kind: 'bag', model: '/models/lifestyle-props/collection-clothing/shelf/shelf-drip-city-tote003.glb', y: 280 },
    { id: 'cc-shelf-box_white', kind: 'box', model: '/models/lifestyle-props/collection-clothing/shelf/shelf-box_white.glb', y: 220 },
    { id: 'cc-shelf-cloth_box1', kind: 'box', model: '/models/lifestyle-props/collection-clothing/shelf/shelf-cloth_box1.glb', y: 180 },
    { id: 'cc-shelf-cloth_box2', kind: 'box', model: '/models/lifestyle-props/collection-clothing/shelf/shelf-cloth_box2.glb', y: 180 },
    { id: 'cc-shelf-cloth_crate', kind: 'box', model: '/models/lifestyle-props/collection-clothing/shelf/shelf-cloth_crate.glb', y: 200 },
    { id: 'cc-shelf-cloth_crate001', kind: 'box', model: '/models/lifestyle-props/collection-clothing/shelf/shelf-cloth_crate001.glb', y: 200 },
    { id: 'cc-shelf-rattan_box', kind: 'box', model: '/models/lifestyle-props/collection-clothing/shelf/shelf-rattan_box.glb', y: 180 },
    { id: 'cc-shelf-hat_classic', kind: 'hat', model: '/models/lifestyle-props/collection-clothing/shelf/shelf-hat_classic.glb', y: 120 },
    // wardrobe-5 (set_14) — стопки-кластеры / шляпа / сумка (KEEP)
    // 011/012 были «сумками» с дырами — теперь плотные стопки (split islands + pack).
    { id: 'w5-stack-set_14_025', kind: 'stack', model: '/models/lifestyle-props/wardrobe-5/shelf/w5-shelf-stack-set_14_025.glb', y: 220 },
    { id: 'w5-stack-set_14_026', kind: 'stack', model: '/models/lifestyle-props/wardrobe-5/shelf/w5-shelf-stack-set_14_026.glb', y: 210 },
    { id: 'w5-stack-set_14_011', kind: 'stack', model: '/models/lifestyle-props/wardrobe-5/shelf/w5-shelf-stack-set_14_011.glb', y: 250 },
    { id: 'w5-stack-set_14_042', kind: 'stack', model: '/models/lifestyle-props/wardrobe-5/shelf/w5-shelf-stack-set_14_042.glb', y: 140 },
    { id: 'w5-stack-set_14_038', kind: 'stack', model: '/models/lifestyle-props/wardrobe-5/shelf/w5-shelf-stack-set_14_038.glb', y: 120 },
    { id: 'w5-hat-set_14_040', kind: 'hat', model: '/models/lifestyle-props/wardrobe-5/shelf/w5-shelf-hat-set_14_040.glb', y: 110 },
    { id: 'w5-bag-set_14_044', kind: 'bag', model: '/models/lifestyle-props/wardrobe-5/shelf/w5-shelf-bag-set_14_044.glb', y: 200 },
  ];

  /** Виды на полку (IKEA lifestyle) — весь KEEP-набор пользователя. */
  const SHELF_LIFESTYLE_KINDS = new Set(['stack', 'bag', 'shoes', 'box', 'hat']);

  function defaultPreviewForKind(kind) {
    const k = String(kind || '').toLowerCase();
    if (k === 'bag') return { x: 320, y: 280, z: 160 };
    if (k === 'shoes') return { x: 280, y: 110, z: 200 };
    if (k === 'box') return { x: 320, y: 220, z: 280 };
    if (k === 'hat') return { x: 220, y: 120, z: 220 };
    return { x: 280, y: 160, z: 200 };
  }

  function injectCollectionShelfExtrasIntoMap(map) {
    if (!map) return;
    for (let i = 0; i < COLLECTION_SHELF_EXTRAS.length; i++) {
      const e = COLLECTION_SHELF_EXTRAS[i];
      const id = String(e.id);
      if (map[id]?.params?.models?.[0]?.model) continue;
      const preview = defaultPreviewForKind(e.kind);
      if (Number(e.y) > 0) preview.y = Number(e.y);
      map[id] = {
        params: {
          models: [
            {
              model: e.model,
              params: {
                kind: e.kind,
                preview_ref_mm: preview,
                rot: { x: 0, y: 0, z: 0, order: 'XYZ' },
                scale: { x: 100, y: 100, z: 100 },
              },
            },
          ],
        },
      };
    }
  }

  function listLifestyleShelfIdsFromMap(map) {
    const ids = [];
    const seen = new Set();
    const add = (id) => {
      const key = String(id || '').trim();
      if (!key || seen.has(key)) return;
      const models = map?.[key]?.params?.models;
      const kind = String(models?.[0]?.params?.kind || '').trim().toLowerCase();
      if (!SHELF_LIFESTYLE_KINDS.has(kind)) return;
      if (!String(models?.[0]?.model || '').trim()) return;
      seen.add(key);
      ids.push(key);
    };
    if (map && typeof map === 'object') {
      Object.keys(map).forEach(add);
    }
    for (let i = 0; i < COLLECTION_SHELF_EXTRAS.length; i++) add(COLLECTION_SHELF_EXTRAS[i].id);
    return ids;
  }

  /** Конфиг для комнаты шаг 7: весь пул stack/bag/shoes, enabled. */
  function buildRoomLifestyleShelfPropsConfig(map) {
    injectCollectionShelfExtrasIntoMap(map);
    const ids = listLifestyleShelfIdsFromMap(map);
    // Хаотичный порядок слотов (детерминированно от mix — перетасуем по hash id).
    ids.sort((a, b) => (hashU32('pool|' + a) >>> 0) - (hashU32('pool|' + b) >>> 0));
    return {
      enabled: 1,
      slots: ids.map((id) => ({
        model_id: id,
        label: '',
        x_mm: 0,
        y_mm: 0,
        z_mm: 0,
        rot_y: 0,
      })),
    };
  }

  function expandPoolFromLibrary(pool, map) {
    injectCollectionShelfExtrasIntoMap(map);
    const have = new Set((pool || []).map((s) => String(s.model_id || '')));
    const extra = [];
    const ids = listLifestyleShelfIdsFromMap(map);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      if (have.has(id)) continue;
      extra.push({ model_id: id, label: '', x_mm: 0, y_mm: 0, z_mm: 0, rot_y: 0 });
    }
    const merged = (pool || []).concat(extra).filter((s) => {
      if (!s?.model_id) return false;
      const kind = catalogSlotKind(s, map);
      return !kind || SHELF_LIFESTYLE_KINDS.has(kind);
    });
    // Перемешать для хаоса между шкафами (порядок кандидатов).
    merged.sort((a, b) => {
      const ka = hashU32('mix|' + String(a.model_id));
      const kb = hashU32('mix|' + String(b.model_id));
      return ka - kb;
    });
    return merged;
  }

  function catalogSlotHeightMm(slot, map) {
    const id = slot && slot.model_id;
    const models = map?.[id]?.params?.models;
    const y = Number(models && models[0] && models[0].params && models[0].params.preview_ref_mm
      ? models[0].params.preview_ref_mm.y
      : 0);
    return Number.isFinite(y) && y > 0 ? y : 0;
  }

  function catalogSlotKind(slot, map) {
    const id = slot && slot.model_id;
    const models = map?.[id]?.params?.models;
    const kind = models && models[0] && models[0].params ? models[0].params.kind : '';
    return String(kind || '').trim().toLowerCase();
  }

  function preparedHeightMm(root, THREE) {
    const b = meshWorldBox(root, THREE);
    return b ? b.max.y - b.min.y : 0;
  }

  function slotFitsOpening(h, limit) {
    return !Number.isFinite(h) || h <= 0 || h <= limit;
  }

  /** 0=низ колонки … 1=верх. Без rank — нейтраль 0.5. */
  function normalizeColRank01(raw) {
    const r = Number(raw);
    if (!Number.isFinite(r)) return 0.5;
    return Math.max(0, Math.min(1, r));
  }

  function shouldLeaveShelfEmpty(mixKey, shelfIndex, colRank01) {
    const rank = normalizeColRank01(colRank01);
    // Низ чаще пустой (как на кадре IKEA), середина/верх плотнее.
    const pEmpty = EMPTY_BASE + (1 - rank) * EMPTY_BOTTOM_EXTRA;
    const h = hashU32(String(mixKey || '') + '|empty|' + String(shelfIndex)) / 4294967295;
    return h < pEmpty;
  }

  /** Лёгкий вес зоны (IKEA): верх — box, середина — bag/stack, низ — stack. */
  function zoneKindBonus(kind, colRank01) {
    const k = String(kind || '').trim().toLowerCase();
    const rank = normalizeColRank01(colRank01);
    if (rank >= 0.7) {
      if (k === 'box') return 0;
      if (k === 'stack') return 1;
      if (k === 'bag') return 2;
      return 3;
    }
    if (rank <= 0.25) {
      if (k === 'stack' || k === 'shoes') return 0;
      if (k === 'bag') return 2;
      if (k === 'box') return 3;
      return 1;
    }
    if (k === 'stack' || k === 'bag') return 0;
    if (k === 'box') return 1;
    return 2;
  }

  /**
   * Одна вещь на полку; ~10–15% пустых (чаще низ); влазит в проём.
   * excludeKinds — не тот же kind на соседней полке в колонке.
   * usedIds — Map model_id → сколько раз уже ставили: сначала все разные, потом least-used.
   * colRank01 — высота в колонке 0=низ … 1=верх (для пустых + лёгкой зоны kind).
   */
  function pickFittingSlot(
    pool,
    shelfIndex,
    mixKey,
    openingMm,
    heightOf,
    kindOf,
    excludeKinds,
    usedIds,
    colRank01,
    allowEmpty
  ) {
    if (!pool.length) return null;
    const i = Number.isFinite(Number(shelfIndex)) ? Math.max(0, Number(shelfIndex)) : 0;
    if (allowEmpty !== false && shouldLeaveShelfEmpty(mixKey, i, colRank01)) return null;
    const start = hashU32(String(mixKey || '')) % Math.max(1, pool.length * 4);
    const filled = i + start;
    const n = pool.length;
    const open = Number(openingMm);
    const limit = Number.isFinite(open) && open > 0 ? open - OPENING_CLEARANCE_MM : 0;
    if (!(limit > 0)) return null;
    const exclude =
      excludeKinds instanceof Set
        ? excludeKinds
        : new Set(Array.isArray(excludeKinds) ? excludeKinds : []);
    const useCount = (id) => {
      const key = String(id || '');
      if (!key) return 0;
      let n = 0;
      if (usedIds && typeof usedIds.get === 'function') n += Number(usedIds.get(key) || 0);
      n += Number(roomUsedModelIds.get(key) || 0);
      return n;
    };
    const tieBreak = (id, order) => {
      return (hashU32(String(mixKey || '') + '|' + i + '|' + id) % 997) + order * 0.001;
    };
    const tryPick = (respectKind, onlyUnused) => {
      const cands = [];
      for (let t = 0; t < n; t++) {
        const slot = pool[(filled + t) % n];
        if (!slot) continue;
        const h = heightOf(slot);
        if (!slotFitsOpening(h, limit)) continue;
        const kind = kindOf ? kindOf(slot) : '';
        if (respectKind && exclude.size) {
          if (kind && exclude.has(kind)) continue;
        }
        const id = String(slot.model_id || '');
        const uses = useCount(id);
        if (onlyUnused && uses > 0) continue;
        cands.push({
          slot,
          uses,
          zone: zoneKindBonus(kind, colRank01),
          tie: tieBreak(id, t),
          id,
        });
      }
      if (!cands.length) return null;
      cands.sort((a, b) => a.uses - b.uses || a.zone - b.zone || a.tie - b.tie);
      return cands[0].slot;
    };
    // 1) другой kind + ещё не ставили
    const freshOtherKind = tryPick(true, true);
    if (freshOtherKind) return freshOtherKind;
    // 2) любой ещё не ставили (даже тот же kind) — чтобы пройти весь пул
    const freshAny = tryPick(false, true);
    if (freshAny) return freshAny;
    // 3) другой kind least-used
    const usedOtherKind = tryPick(true, false);
    if (usedOtherKind) return usedOtherKind;
    // 4) любой least-used
    return tryPick(false, false);
  }

  function mapImageReady(map) {
    const img = map && map.image;
    if (!img) return false;
    if (img.width > 0 || img.height > 0) return true;
    if (img.complete === true && (img.naturalWidth > 0 || img.naturalHeight > 0)) return true;
    return false;
  }

  /** Ждём image у map, иначе MeshBasic заливает дефолтным бежем. */
  function waitForTextureMaps(root, ms) {
    const timeout = Number.isFinite(ms) && ms > 0 ? ms : 8000;
    return new Promise((resolve) => {
      if (!root) {
        resolve(false);
        return;
      }
      const maps = [];
      root.traverse((o) => {
        if (!o?.isMesh) return;
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        for (let i = 0; i < mats.length; i++) {
          const m = mats[i];
          if (m?.map) maps.push(m.map);
        }
      });
      if (!maps.length) {
        resolve(true);
        return;
      }
      const allReady = () => maps.every(mapImageReady);
      if (allReady()) {
        resolve(true);
        return;
      }
      let settled = false;
      const done = (ok) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        clearInterval(poll);
        resolve(!!ok);
      };
      const timer = setTimeout(() => done(allReady()), timeout);
      const poll = setInterval(() => {
        if (allReady()) done(true);
      }, 50);
      maps.forEach((map) => {
        const img = map && map.image;
        if (mapImageReady(map)) return;
        if (img && typeof img.decode === 'function') {
          img.decode().then(() => {
            if (allReady()) done(true);
          }, () => {});
        }
        if (img && typeof img.addEventListener === 'function') {
          img.addEventListener(
            'load',
            () => {
              if (allReady()) done(true);
            },
            { once: true }
          );
        }
      });
    });
  }

  /** Object3D.clone шарит material — изолируем, иначе один map=null коричневит все полки. */
  function cloneShelfPropRoot(root) {
    if (!root) return null;
    const c = root.clone(true);
    c.traverse((o) => {
      if (!o?.isMesh || !o.material) return;
      if (Array.isArray(o.material)) {
        o.material = o.material.map((m) => (m && m.clone ? m.clone() : m));
      } else if (o.material.clone) {
        o.material = o.material.clone();
      }
    });
    return c;
  }

  function normalizeSlot(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const modelId = String(raw.model_id ?? raw.modelId ?? '').trim();
    return {
      model_id: modelId,
      label: String(raw.label || '').trim(),
      x_mm: num(raw.x_mm ?? raw.x, 0),
      y_mm: num(raw.y_mm ?? raw.y, 0),
      z_mm: num(raw.z_mm ?? raw.z, 0),
      rot_y: num(raw.rot_y ?? raw.rotY, 0),
    };
  }

  function defaultShelfProps() {
    return {
      enabled: 0,
      slots: [
        { model_id: '', x_mm: -20, y_mm: 0, z_mm: 0, rot_y: 0 },
        { model_id: '', x_mm: 90, y_mm: 0, z_mm: 0, rot_y: 0 },
      ],
    };
  }

  function parseShelfPropsConfig(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const slots = (Array.isArray(src.slots) ? src.slots : [])
      .map(normalizeSlot)
      .filter((s) => s && s.model_id);
    return {
      enabled: isTruthyFlag(src.enabled),
      slots,
    };
  }

  function readRawShelfPropsFromItem(item) {
    if (!item || typeof item !== 'object') return null;
    const direct = item.interiorTemplates?.shelfProps || item.shelfProps;
    if (direct) return direct;
    let data = item.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (_) {
        data = null;
      }
    }
    if (data && typeof data === 'object') {
      return data.interiorTemplates?.shelfProps || data.shelfProps || null;
    }
    return null;
  }

  function extractShelfPropsFromCatalogItem(item) {
    const extract =
      typeof global.__cldExtractInteriorTemplatesFromCatalogItem === 'function'
        ? global.__cldExtractInteriorTemplatesFromCatalogItem
        : null;
    const templates = extract ? extract(item) : item?.interiorTemplates;
    return parseShelfPropsConfig(templates?.shelfProps || readRawShelfPropsFromItem(item));
  }

  function localMeshUnionBox(group, THREE) {
    if (!group || !THREE) return null;
    group.updateMatrixWorld(true);
    const box = new THREE.Box3();
    const tmp = new THREE.Box3();
    const toLocal = new THREE.Matrix4().copy(group.matrixWorld).invert();
    let any = false;
    group.traverse((o) => {
      if (!o?.isMesh || !o.geometry) return;
      const ud = o.userData || {};
      if (ud.isShelfProp || ud.isRodCompanion || ud.previewOnly) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      if (!o.geometry.boundingBox || o.geometry.boundingBox.isEmpty()) return;
      tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld).applyMatrix4(toLocal);
      if (!any) {
        box.copy(tmp);
        any = true;
      } else {
        box.union(tmp);
      }
    });
    return any && !box.isEmpty() ? box : null;
  }

  function worldMeshUnionBox(group, THREE) {
    if (!group || !THREE) return null;
    group.updateMatrixWorld(true);
    const box = new THREE.Box3();
    const tmp = new THREE.Box3();
    let any = false;
    group.traverse((o) => {
      if (!o?.isMesh || !o.geometry) return;
      const ud = o.userData || {};
      if (ud.isShelfProp || ud.isRodCompanion || ud.previewOnly) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      if (!o.geometry.boundingBox || o.geometry.boundingBox.isEmpty()) return;
      tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
      if (!any) {
        box.copy(tmp);
        any = true;
      } else {
        box.union(tmp);
      }
    });
    return any && !box.isEmpty() ? box : null;
  }

  function meshWorldBox(root, THREE) {
    if (!root || !THREE) return null;
    root.updateMatrixWorld(true);
    const box = new THREE.Box3();
    const tmp = new THREE.Box3();
    root.traverse((o) => {
      if (!o?.isMesh || !o.geometry) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      if (!o.geometry.boundingBox || o.geometry.boundingBox.isEmpty()) return;
      tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
      if (box.isEmpty()) box.copy(tmp);
      else box.union(tmp);
    });
    return box.isEmpty() ? null : box;
  }

  function sitLiftY(root, THREE) {
    if (!root || !THREE) return 0;
    const cached = Number(root.userData?._shelfSitLiftY);
    if (Number.isFinite(cached)) return cached;
    const box = meshWorldBox(root, THREE);
    const lift = box ? -box.min.y : 0;
    root.userData = root.userData || {};
    root.userData._shelfSitLiftY = lift;
    return lift;
  }

  /** Равномерный min-fit сжимает Sketchfab-стопку (после rot высота ~4 мм). В карточку — по осям. */
  function fitRootPerAxisMm(root, refMm, THREE) {
    if (!root || !refMm || !THREE) return;
    const rx = Number(refMm.x);
    const ry = Number(refMm.y);
    const rz = Number(refMm.z);
    if (!(rx > 0 && ry > 0 && rz > 0)) return;
    const box = meshWorldBox(root, THREE);
    if (!box) return;
    const size = box.getSize(new THREE.Vector3());
    if (size.x > 1e-8) root.scale.x *= rx / size.x;
    if (size.y > 1e-8) root.scale.y *= ry / size.y;
    if (size.z > 1e-8) root.scale.z *= rz / size.z;
    root.updateMatrixWorld(true);
    const box2 = meshWorldBox(root, THREE);
    if (!box2) return;
    const c = box2.getCenter(new THREE.Vector3());
    root.position.x -= c.x;
    root.position.y -= c.y;
    root.position.z -= c.z;
    root.updateMatrixWorld(true);
    if (root.userData) delete root.userData._shelfSitLiftY;
  }

  const preparedTplCache = new Map();
  const fabricMatCache = new Map();
  const tintTexCache = new Map();
  /** Сколько раз ставили model_id за сессию комнаты (не сбрасывать на каждом шкафу). */
  const roomUsedModelIds = new Map();
  const _noRaycast = function noShelfPropRaycast() {};

  function clearPreparedShelfPropCache() {
    preparedTplCache.clear();
  }

  function fabricHexFromName(name) {
    const nm = String(name || '').toLowerCase();
    if (/grey|gray|middle/.test(nm)) return 0x9e9e9c;
    if (/beige|bottom/.test(nm)) return 0xbfaa8f;
    if (/bag|handle/.test(nm)) return 0xc9b89e;
    if (/collar_seam/.test(nm)) return 0xd7d4cc;
    if (/milk|top|collar/.test(nm)) return 0xeeebe2;
    return 0xbfaa8f;
  }

  function parseFabricTintHex(raw) {
    const s = String(raw || '').trim();
    if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
    return '';
  }

  /** Лайм/цветная карта → яркость × беж. Не id модели, только params.fabric_tint. */
  function luminanceTintMap(map, THREE, hex) {
    if (!map || !THREE || !hex) return map;
    const img = map.image;
    const w = img && (img.width || img.videoWidth);
    const h = img && (img.height || img.videoHeight);
    if (!w || !h) return map;
    const cacheKey = map.uuid + '_' + hex + '_' + w + 'x' + h;
    const cached = tintTexCache.get(cacheKey);
    if (cached) return cached;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return map;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h);
      const t = new THREE.Color(hex);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        const lum = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255;
        const lift = 0.14 + lum * 0.92;
        px[i] = Math.round(Math.min(255, lift * t.r * 255));
        px[i + 1] = Math.round(Math.min(255, lift * t.g * 255));
        px[i + 2] = Math.round(Math.min(255, lift * t.b * 255));
      }
      ctx.putImageData(data, 0, 0);
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = map.wrapS;
      tex.wrapT = map.wrapT;
      tex.flipY = map.flipY;
      if (map.colorSpace != null) tex.colorSpace = map.colorSpace;
      else if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      tex.userData.cldFabricTint = hex;
      tintTexCache.set(cacheKey, tex);
      return tex;
    } catch (_) {
      return map;
    }
  }

  /**
   * Unlit для lifestyle: карта/цвет из GLB. Не подменять бежем, если в GLB уже был цвет или map.
   * @param {'shelf'|'rod'} [markKind]
   */
  function applyShelfPropFabricLook(root, THREE, tintHex, markKind) {
    if (!root || !THREE) return;
    const tint = parseFabricTintHex(tintHex || root.userData?.fabricTint);
    const asRod = markKind === 'rod';
    root.traverse((o) => {
      if (!o?.isMesh) return;
      const src = Array.isArray(o.material) ? o.material[0] : o.material;
      const hadMap = !!(src && src.map && !src.userData?.__cldIkeaV0);
      let map = hadMap ? src.map : null;
      if (map && tint && !map.userData?.cldFabricTint) {
        const tinted = luminanceTintMap(map, THREE, tint);
        if (tinted) map = tinted;
      }
      let color = new THREE.Color(0xbfaa8f);
      if (map) {
        // GLTF: color = baseColorFactor × map. Не затирать factor белым — иначе стопки «полотенца».
        if (src && src.color?.isColor && !src.userData?.__cldIkeaV0) {
          color = src.color.clone();
        } else {
          color = new THREE.Color(0xffffff);
        }
      } else if (src && src.color?.isColor && !src.userData?.__cldIkeaV0) {
        const c = src.color;
        const sum = c.r + c.g + c.b;
        // GLTF default (1,1,1) без map → не оставлять белым «полотенцем».
        if (sum >= 0.04 && !(c.r > 0.92 && c.g > 0.92 && c.b > 0.92)) color = c.clone();
        else color = new THREE.Color(fabricHexFromName(o.name));
      } else {
        color = new THREE.Color(fabricHexFromName(o.name));
      }
      const side = src && src.side === THREE.DoubleSide ? THREE.DoubleSide : THREE.FrontSide;
      // Не шарим «nomap»-материалы между мешами — иначе один ранний brown заливает все.
      const mat = new THREE.MeshBasicMaterial({
        color,
        map: map || null,
        side,
      });
      mat.userData.cldShelfPropMat = true;
      if (hadMap) mat.userData.cldShelfPropExpectMap = true;
      o.material = mat;
      o.castShadow = false;
      o.receiveShadow = false;
      o.frustumCulled = true;
      o.raycast = _noRaycast;
      o.userData = o.userData || {};
      if (asRod) {
        o.userData.isRodCompanion = true;
        o.userData.isShelfProp = false;
      } else {
        o.userData.isShelfProp = true;
      }
    });
  }

  function countMeshMaps(root) {
    let n = 0;
    if (!root) return 0;
    root.traverse((o) => {
      if (!o?.isMesh) return;
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (let i = 0; i < mats.length; i++) {
        if (mats[i]?.map) n += 1;
      }
    });
    return n;
  }

  function shelfPropMapsReady(root) {
    if (!root) return true;
    let ok = true;
    root.traverse((o) => {
      if (!ok || !o?.isMesh) return;
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (let i = 0; i < mats.length; i++) {
        const m = mats[i];
        if (!m?.map) continue;
        if (!mapImageReady(m.map)) ok = false;
      }
    });
    return ok;
  }

  function clearShelfPropsUnder(group) {
    if (!group?.children) return;
    const remove = [];
    for (const ch of group.children) {
      if (ch.userData?.isShelfProp || String(ch.name || '').startsWith('shelf_prop_')) {
        remove.push(ch);
      }
    }
    remove.forEach((ch) => {
      group.remove(ch);
      /** Геометрия общая с кэшем GLB — dispose ломает все копии и гоняет GPU. */
    });
  }

  async function spawnShelfPropsIntoGroup(opts) {
    if (
      typeof global !== 'undefined' &&
      typeof global.__cldRoomShelfLifestyleEnabled === 'function' &&
      !global.__cldRoomShelfLifestyleEnabled()
    ) {
      return { spawned: 0, kind: '', modelId: '' };
    }
    const group = opts?.group;
    const config = opts?.config;
    const THREE = opts?.THREE;
    const loader = global.__cldRoomCabinetModels;
    if (!group || !config?.enabled || !config.slots?.length || !THREE || !loader) {
      return { spawned: 0, kind: '', modelId: '' };
    }
    if (typeof loader.ensureCabinetModelLibraryMap !== 'function') {
      return { spawned: 0, kind: '', modelId: '' };
    }
    if (typeof loader.prepareCabinetModelRoot !== 'function') {
      return { spawned: 0, kind: '', modelId: '' };
    }

    const size = opts.sizeMm || {};
    const box = localMeshUnionBox(group, THREE);
    const cx = box ? (box.min.x + box.max.x) * 0.5 : (Number(size.x) || 0) * 0.5;
    const topY = box ? box.max.y : (Number(size.y) || 16) * 0.5;
    const cz = box ? (box.min.z + box.max.z) * 0.5 : (Number(size.z) || 0) * 0.5;

    clearShelfPropsUnder(group);

    const map = await loader.ensureCabinetModelLibraryMap();
    let spawned = 0;
    let pickedKind = '';
    let pickedModelId = '';
    const epoch = Number(opts.epoch) || 0;
    const isStale = typeof opts.isStale === 'function' ? opts.isStale : () => false;
    const usedIds = opts.usedModelIds;
    const pool = expandPoolFromLibrary(
      config.slots.filter((s) => s && s.model_id),
      map
    );
    let slotsToSpawn = pool;
    if (opts.onePerShelf !== false && pool.length) {
      const ranked = [];
      const seen = new Set();
      const heightOf = (s) => catalogSlotHeightMm(s, map);
      const kindOf = (s) => catalogSlotKind(s, map);
      const colRank01 = opts.colRank01;
      // Пустость один раз (не на каждом retry кандидата).
      if (shouldLeaveShelfEmpty(opts.mixKey, opts.shelfIndex, colRank01)) {
        slotsToSpawn = [];
      } else {
        // Несколько кандидатов: если у первого карта не встала — берём следующего, не беж.
        for (let attempt = 0; attempt < 8; attempt++) {
          const excl = new Set(
            opts.excludeKinds instanceof Set ? opts.excludeKinds : opts.excludeKinds || []
          );
          const picked = pickFittingSlot(
            pool.filter((s) => s && !seen.has(String(s.model_id || ''))),
            opts.shelfIndex,
            String(opts.mixKey || '') + '|try' + attempt,
            opts.openingMm,
            heightOf,
            kindOf,
            excl,
            usedIds,
            colRank01,
            false
          );
          if (!picked) break;
          const pid = String(picked.model_id || '');
          if (!pid || seen.has(pid)) break;
          seen.add(pid);
          ranked.push(picked);
        }
        slotsToSpawn = ranked;
      }
    }

    for (let i = 0; i < slotsToSpawn.length; i++) {
      if (isStale()) return { spawned, kind: pickedKind, modelId: pickedModelId };
      const slot = slotsToSpawn[i];
      const id = String(slot.model_id || '');
      const libEntry = map?.[id] || map?.[Number(id)];
      const paramsRoot =
        (libEntry && libEntry.params && typeof libEntry.params === 'object' ? libEntry.params : null) ||
        (libEntry && typeof libEntry === 'object' ? libEntry : null);
      const models = paramsRoot?.models;
      const variant = Array.isArray(models) && models.length ? models[0] : null;
      const urlRaw = String(variant?.model || '').trim();
      if (!urlRaw) continue;

      const variantParams =
        variant?.params && typeof variant.params === 'object' ? variant.params : {};
      const fabricTint = parseFabricTintHex(
        variantParams.fabric_tint || variantParams.fabricTint
      );
      const preview =
        (variantParams.preview_ref_mm && typeof variantParams.preview_ref_mm === 'object'
          ? variantParams.preview_ref_mm
          : null) || { x: 200, y: 80, z: 200 };
      const mergedSpec = {
        id,
        ...variantParams,
        rot: { x: 0, y: 0, z: 0, order: 'XYZ' },
        preview_ref_mm: preview,
        fitToSize: true,
        fit_to_size: 1,
        isShelfProp: true,
      };
      let prepared = null;
      const cached = preparedTplCache.get(id);
      if (cached && cached.userData?.cldShelfPropMapsOk === true) {
        prepared = cloneShelfPropRoot(cached);
      } else {
        if (cached) preparedTplCache.delete(id);
        let tpl = null;
        try {
          const url =
            typeof loader.resolveAssetUrl === 'function' ? loader.resolveAssetUrl(urlRaw) : urlRaw;
          tpl = await loader.loadAssetRootOnce(url);
          if (!tpl && urlRaw.indexOf('/shelf-props/') === -1) {
            const name = String(urlRaw.split('/').pop() || '').trim();
            if (name) {
              const alt =
                typeof loader.resolveAssetUrl === 'function'
                  ? loader.resolveAssetUrl('/models/shelf-props/' + name)
                  : '/models/shelf-props/' + name;
              tpl = await loader.loadAssetRootOnce(alt);
            }
          }
        } catch (_) {
          tpl = null;
        }
        if (!tpl) continue;
        if (isStale()) return { spawned, kind: pickedKind, modelId: pickedModelId };
        // Сначала дождаться карт на шаблоне, потом готовить — иначе mapsBefore=0 и MeshBasic белеет.
        await waitForTextureMaps(tpl, 10000);
        if (isStale()) return { spawned, kind: pickedKind, modelId: pickedModelId };
        const mapsBefore = countMeshMaps(tpl);
        const first = loader.prepareCabinetModelRoot(tpl, mergedSpec, variant, preview);
        if (!first) continue;
        fitRootPerAxisMm(first, preview, THREE);
        if (fabricTint) {
          first.userData = first.userData || {};
          first.userData.fabricTint = fabricTint;
        }
        await waitForTextureMaps(first, 10000);
        if (isStale()) return { spawned, kind: pickedKind, modelId: pickedModelId };
        if (mapsBefore > 0 && !shelfPropMapsReady(first)) {
          continue;
        }
        applyShelfPropFabricLook(first, THREE, fabricTint);
        const mapsAfter = countMeshMaps(first);
        const mapsOk = mapsBefore <= 0 || (mapsAfter > 0 && shelfPropMapsReady(first));
        if (mapsBefore > 0 && !mapsOk) {
          continue;
        }
        // Белый unlit без map = провал текстуры, не кешируем.
        let blankWhite = false;
        first.traverse((o) => {
          if (!o?.isMesh || blankWhite) return;
          const m = Array.isArray(o.material) ? o.material[0] : o.material;
          if (!m || m.map) return;
          const c = m.color;
          if (c && c.r > 0.92 && c.g > 0.92 && c.b > 0.92) blankWhite = true;
        });
        if (blankWhite && mapsBefore > 0) continue;
        first.userData = first.userData || {};
        first.userData.cldShelfPropMapsOk = true;
        first.position.y += sitLiftY(first, THREE);
        preparedTplCache.set(id, first);
        prepared = cloneShelfPropRoot(first);
      }
      if (!prepared) continue;
      if (isStale()) return { spawned, kind: pickedKind, modelId: pickedModelId };
      const open = Number(opts.openingMm);
      if (Number.isFinite(open) && open > 0) {
        const h = preparedHeightMm(prepared, THREE);
        if (h > open - OPENING_CLEARANCE_MM) continue;
      }

      const wrapper = new THREE.Group();
      wrapper.name = `shelf_prop_${id}_${i}`;
      wrapper.userData.isShelfProp = true;
      wrapper.userData.previewOnly = false;
      const xOff = opts.onePerShelf !== false ? 0 : slot.x_mm;
      wrapper.position.set(cx + xOff, topY + slot.y_mm, cz + slot.z_mm);
      const yawDeg = num(variantParams.rot?.y, 0) + slot.rot_y;
      if (yawDeg) wrapper.rotateY(-THREE.MathUtils.degToRad(yawDeg));
      wrapper.add(prepared);
      prepared.traverse((o) => {
        if (!o) return;
        o.userData = o.userData || {};
        o.userData.isShelfProp = true;
      });
      group.add(wrapper);
      spawned++;
      try {
        const show =
          typeof global !== 'undefined' &&
          typeof global.__cldIsRoomLifestyleStep === 'function' &&
          global.__cldIsRoomLifestyleStep();
        wrapper.visible = !!show;
        if (typeof global.__cldSyncRoomLifestyleVisibility === 'function') {
          global.__cldSyncRoomLifestyleVisibility();
        }
      } catch (_) {}
      pickedModelId = id;
      pickedKind = catalogSlotKind(slot, map) || String(variantParams.kind || '').trim().toLowerCase();
      if (id) {
        roomUsedModelIds.set(id, Number(roomUsedModelIds.get(id) || 0) + 1);
        if (usedIds && typeof usedIds.set === 'function') {
          usedIds.set(id, Number(usedIds.get(id) || 0) + 1);
        }
      }
      void epoch;
      // onePerShelf: один удачный кандидат — стоп (не ставим всех из ranked).
      if (opts.onePerShelf !== false && spawned > 0) break;
    }
    return { spawned, kind: pickedKind, modelId: pickedModelId };
  }

  function openingMmBetweenHosts(entry, all, THREE) {
    const box = entry?.box;
    if (!box || !THREE) return 0;
    const cx = (box.min.x + box.max.x) * 0.5;
    const cz = (box.min.z + box.max.z) * 0.5;
    let nextMinY = Infinity;
    for (let i = 0; i < all.length; i++) {
      const o = all[i];
      if (!o || o === entry || !o.box) continue;
      const ocx = (o.box.min.x + o.box.max.x) * 0.5;
      const ocz = (o.box.min.z + o.box.max.z) * 0.5;
      if (Math.abs(ocx - cx) > 100 || Math.abs(ocz - cz) > 100) continue;
      if (o.box.min.y > box.max.y + 1) {
        nextMinY = Math.min(nextMinY, o.box.min.y);
      }
    }
    if (nextMinY < Infinity) return nextMinY - box.max.y;
    let n = entry.group && entry.group.parent;
    for (let k = 0; k < 16 && n; k++) {
      n.updateMatrixWorld(true);
      const pb = new THREE.Box3().setFromObject(n);
      if (!pb.isEmpty() && pb.max.y > box.max.y + 40) {
        return Math.max(0, pb.max.y - 16 - box.max.y);
      }
      n = n.parent;
    }
    return 0;
  }

  function hostHasShelfProps(group) {
    if (!group?.children) return false;
    for (let i = 0; i < group.children.length; i++) {
      const ch = group.children[i];
      if (ch?.userData?.isShelfProp || String(ch?.name || '').startsWith('shelf_prop_')) {
        return true;
      }
    }
    return false;
  }

  /**
   * Шаг 7: дозаполнить пустые полки (хосты cldShelfPropHost).
   * По умолчанию НЕ трогает уже стоящие вещи — иначе при входе на шаг 7 всё «прыгает».
   * force:true — полная перестановка (отладка / смена пула).
   */
  async function resyncAllRoomShelfProps(scene, opts) {
    if (
      typeof global !== 'undefined' &&
      typeof global.__cldRoomShelfLifestyleEnabled === 'function' &&
      !global.__cldRoomShelfLifestyleEnabled()
    ) {
      return 0;
    }
    const force = opts && opts.force === true;
    if (force) {
      clearPreparedShelfPropCache();
      // Сброс кэша GLB-загрузчика — иначе старые solid wire без jpeg.
      try {
        const loader = global.__cldRoomCabinetModels;
        if (loader && typeof loader.clearAssetRootCache === 'function') {
          loader.clearAssetRootCache();
        }
      } catch (_) {}
    }
    const THREE = global.THREE;
    const loader = global.__cldRoomCabinetModels;
    const root =
      scene ||
      (typeof global !== 'undefined' ? global.__cldRoomScene : null) ||
      null;
    if (!THREE || !loader || !root || typeof root.traverse !== 'function') return 0;

    const hosts = [];
    root.traverse((o) => {
      if (!o?.userData?.cldShelfPropHost) return;
      if (!force && hostHasShelfProps(o)) return;
      hosts.push(o);
    });
    if (!hosts.length) return 0;

    if (force) resetRoomShelfPropUsage();
    const map =
      typeof loader.ensureCabinetModelLibraryMap === 'function'
        ? await loader.ensureCabinetModelLibraryMap()
        : {};
    const cfg = buildRoomLifestyleShelfPropsConfig(map || {});
    if (!cfg?.enabled || !cfg.slots?.length) return 0;

    const infos = hosts.map((group, shelfIndex) => {
      group.updateMatrixWorld(true);
      const host = group.userData.cldShelfPropHost || {};
      const token = {};
      group.userData._shelfPropToken = token;
      return {
        group,
        size: host.sizeMm || { x: 0, y: 16, z: 0 },
        shelfIndex,
        token,
        cfg,
        mixKey: String(host.mixKey || 'resync'),
        box: worldMeshUnionBox(group, THREE),
      };
    });

    const sorted = infos.slice().sort((a, b) => {
      const acx = a.box ? (a.box.min.x + a.box.max.x) * 0.5 : 0;
      const bcx = b.box ? (b.box.min.x + b.box.max.x) * 0.5 : 0;
      if (Math.abs(acx - bcx) > 80) return acx - bcx;
      return (a.box?.max.y || 0) - (b.box?.max.y || 0);
    });

    const colBuckets = new Map();
    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i];
      if (!p?.box) continue;
      const cx = (p.box.min.x + p.box.max.x) * 0.5;
      const colKey = Math.round(cx / 80) * 80;
      if (!colBuckets.has(colKey)) colBuckets.set(colKey, []);
      colBuckets.get(colKey).push(p);
    }
    colBuckets.forEach((list) => {
      list.sort((a, b) => (a.box?.max.y || 0) - (b.box?.max.y || 0));
      const n = list.length;
      for (let j = 0; j < n; j++) {
        list[j].colRank01 = n <= 1 ? 0.5 : j / (n - 1);
      }
    });

    const lastKindByCol = new Map();
    const usedModelIds = new Map();
    let total = 0;
    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i];
      if (!p?.group) continue;
      const openingMm = openingMmBetweenHosts(p, infos, THREE);
      const cx = p.box ? (p.box.min.x + p.box.max.x) * 0.5 : 0;
      const colKey = Math.round(cx / 80) * 80;
      const prevKind = lastKindByCol.get(colKey) || '';
      const excludeKinds = prevKind ? new Set([prevKind]) : new Set();
      const token = p.token;
      let result = null;
      try {
        result = await spawnShelfPropsIntoGroup({
          group: p.group,
          config: p.cfg,
          THREE,
          sizeMm: p.size,
          shelfIndex: p.shelfIndex,
          mixKey: p.mixKey,
          onePerShelf: true,
          openingMm,
          excludeKinds,
          usedModelIds,
          colRank01: p.colRank01,
          isStale: () => p.group.userData?._shelfPropToken !== token,
        });
      } catch (_) {
        result = null;
      }
      const spawned = Number(result?.spawned) || 0;
      total += spawned;
      const kind = String(result?.kind || '').trim().toLowerCase();
      if (kind) lastKindByCol.set(colKey, kind);
    }
    try {
      if (typeof global.__cldSyncRoomLifestyleVisibility === 'function') {
        global.__cldSyncRoomLifestyleVisibility();
      }
    } catch (_) {}
    return total;
  }

  function resetRoomShelfPropUsage() {
    roomUsedModelIds.clear();
  }

  const api = {
    defaultShelfProps,
    parseShelfPropsConfig,
    extractShelfPropsFromCatalogItem,
    buildRoomLifestyleShelfPropsConfig,
    injectCollectionShelfExtrasIntoMap,
    spawnShelfPropsIntoGroup,
    clearShelfPropsUnder,
    worldMeshUnionBox,
    catalogSlotKind,
    pickFittingSlot,
    resetRoomShelfPropUsage,
    resyncAllRoomShelfProps,
    clearPreparedShelfPropCache,
    getRoomShelfPropUsage: () => new Map(roomUsedModelIds),
    applyShelfPropFabricLook,
    waitForTextureMaps,
    countMeshMaps,
    shelfPropMapsReady,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (global) {
    global.__cldShelfProps = api;
    // Дефолт до installRoomLifestyleStepApi (main module) — иначе ранний build шкафа без пула.
    if (typeof global.__cldRoomShelfLifestyleEnabled !== 'function') {
      global.__cldRoomShelfLifestyleEnabled = () => true;
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
