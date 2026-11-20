/**
 * Категории для комнаты / кухни:
 * - roomFurnitureByRoom — связь шагов (для кухни: только kitchen + папки модулей)
 * - getCategories() — галочки в карточке; для кухни без «Гостиная — Тумбы»
 * - roomTags.categories на модуле — фильтр шага 4
 */
(function (global) {
  var WILDCARD = '*';
  var WARDROBE_ROOM_KEYS = {
    'living-room': 1,
    bedroom: 1,
    nursery: 1,
    hallway: 1,
    laundry: 1,
    balcony: 1,
  };

  function normKey(v) {
    return String(v || '').trim();
  }

  function isKitchenProductLine(config) {
    var cfg = config || getConfig();
    if (cfg && String(cfg.productLine || '').trim().toLowerCase() === 'kitchen') return true;
    try {
      var api = global.__cldPlacementKindProfiles;
      if (api && typeof api.isKitchenProductLine === 'function') {
        return !!api.isKitchenProductLine(cfg);
      }
    } catch (_) {}
    return true;
  }

  function normFolderKey(v) {
    var k = normKey(v);
    if (k.startsWith('catalog_')) k = k.replace(/^catalog_/, '');
    return k;
  }

  function categoryKey(roomKey, folderKey) {
    return normKey(roomKey) + '-' + normFolderKey(folderKey);
  }

  function tagArrayMatches(selectedKey, tags) {
    if (!selectedKey) return true;
    if (!Array.isArray(tags) || tags.length === 0) return true;
    if (tags.indexOf(WILDCARD) >= 0) return true;
    return tags.some(function (t) {
      return normKey(t) === selectedKey;
    });
  }

  function layoutKeysAllow(layoutKey, layoutKeys) {
    if (!Array.isArray(layoutKeys) || layoutKeys.length === 0) return true;
    if (layoutKeys.indexOf(WILDCARD) >= 0) return true;
    if (!layoutKey) return true;
    return layoutKeys.some(function (k) {
      return normKey(k) === normKey(layoutKey);
    });
  }

  function getStepItems(config, stepId) {
    if (!config || !Array.isArray(config.steps)) return [];
    var step = config.steps.find(function (s) {
      return s.stepId === stepId;
    });
    if (!step || !Array.isArray(step.items)) return [];
    return step.items
      .slice()
      .sort(function (a, b) {
        return (a.order || 0) - (b.order || 0);
      });
  }

  function getConfig() {
    return typeof global.getRoomStepsConfig === 'function' ? global.getRoomStepsConfig() : null;
  }

  function ensureRoomLinksShape(raw) {
    var out = {};
    if (!raw || typeof raw !== 'object') return out;
    Object.keys(raw).forEach(function (rk) {
      var row = raw[rk];
      if (!row || typeof row !== 'object') return;
      var key = normKey(rk);
      if (!key) return;
      out[key] = {
        layoutKeys: Array.isArray(row.layoutKeys)
          ? row.layoutKeys.map(normKey).filter(Boolean)
          : [],
        catalogFolderKeys: Array.isArray(row.catalogFolderKeys)
          ? row.catalogFolderKeys.map(normFolderKey).filter(Boolean)
          : [],
      };
    });
    return out;
  }

  function migrateCategoriesToRoomLinks(cfg) {
    var cats = cfg && Array.isArray(cfg.roomFurnitureCategories) ? cfg.roomFurnitureCategories : [];
    if (!cats.length) return {};
    var links = {};
    cats.forEach(function (c) {
      var rk = normKey(c.roomKey);
      if (!rk) return;
      if (!links[rk]) links[rk] = { layoutKeys: [], catalogFolderKeys: [] };
      var fk = normFolderKey(c.catalogFolderKey);
      if (fk && links[rk].catalogFolderKeys.indexOf(fk) < 0) {
        links[rk].catalogFolderKeys.push(fk);
      }
      (c.layoutKeys || []).forEach(function (lk) {
        var n = normKey(lk);
        if (n && links[rk].layoutKeys.indexOf(n) < 0) links[rk].layoutKeys.push(n);
      });
    });
    return links;
  }

  function readRoomFurnitureByRoomStorage() {
    try {
      if (typeof global.localStorage === 'undefined') return null;
      var raw = global.localStorage.getItem('room_furniture_by_room');
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      var shaped = ensureRoomLinksShape(parsed);
      return Object.keys(shaped).length ? shaped : null;
    } catch (_) {
      return null;
    }
  }

  function isKitchenShapeRoomKey(roomKey) {
    var k = normKey(roomKey);
    if (!k) return false;
    if (k === 'kitchen') return true;
    return /^(enclosed_|open_)/.test(k);
  }

  function sanitizeKitchenRoomLinks(links) {
    var shaped = ensureRoomLinksShape(links || {});
    var kitchen = (shaped && shaped.kitchen) || { layoutKeys: [], catalogFolderKeys: [] };
    var folders = [];
    var layouts = [];
    var pushUnique = function (arr, v) {
      var n = normKey(v);
      if (!n) return;
      if (arr.indexOf(n) < 0) arr.push(n);
    };
    var pushFolder = function (v) {
      var n = normFolderKey(v);
      if (!n) return;
      if (folders.indexOf(n) < 0) folders.push(n);
    };
    (Array.isArray(kitchen.catalogFolderKeys) ? kitchen.catalogFolderKeys : []).forEach(pushFolder);
    (Array.isArray(kitchen.layoutKeys) ? kitchen.layoutKeys : []).forEach(function (lk) {
      pushUnique(layouts, lk);
    });
    // Админка сохраняла галочки под формой (enclosed_rect…), а не под kitchen — собрать.
    Object.keys(shaped).forEach(function (rk) {
      if (rk === 'kitchen') return;
      var row = shaped[rk];
      if (!row) return;
      (row.catalogFolderKeys || []).forEach(pushFolder);
      (row.layoutKeys || []).forEach(function (lk) {
        pushUnique(layouts, lk);
      });
    });
    // Если пусто — берём ключи из шага 3 (то, что юзер набрал из Типов элементов).
    if (!folders.length) {
      var cfg = getConfig();
      folders = getStepItems(cfg, 3)
        .map(function (it) {
          return normFolderKey(it.key != null ? it.key : it.id);
        })
        .filter(Boolean);
    }
    // Угол кухни: 44 НМУ + 54 ВМУ всегда в связях (LS room_furniture_by_room часто без 54).
    ['44', '54'].forEach(pushFolder);
    return {
      kitchen: {
        layoutKeys: layouts,
        catalogFolderKeys: folders,
      },
    };
  }

  function getRoomLinks(config) {
    var cfg = config || getConfig();
    var fromKey = readRoomFurnitureByRoomStorage();
    var raw = fromKey;
    if (!raw) {
      if (cfg && cfg.roomFurnitureByRoom && typeof cfg.roomFurnitureByRoom === 'object') {
        var shaped = ensureRoomLinksShape(cfg.roomFurnitureByRoom);
        if (Object.keys(shaped).length) raw = shaped;
      }
    }
    if (!raw) raw = ensureRoomLinksShape(migrateCategoriesToRoomLinks(cfg));
    if (isKitchenProductLine(cfg)) return sanitizeKitchenRoomLinks(raw);
    return ensureRoomLinksShape(raw);
  }

  function getRoomLink(config, roomKey) {
    var links = getRoomLinks(config);
    var k = normKey(roomKey);
    if (links[k]) return links[k];
    // Кухня: шаг 1 = форма (enclosed_rect…), связи всегда под ключом kitchen.
    if (isKitchenProductLine(config) && isKitchenShapeRoomKey(k) && links.kitchen) {
      return links.kitchen;
    }
    return null;
  }

  function findStepLabel(items, key, fallback) {
    var k = normKey(key);
    var hit = (items || []).find(function (it) {
      return normKey(it.key != null ? it.key : it.id) === k;
    });
    return hit ? String(hit.name || hit.key || k).trim() : fallback || k;
  }

  /** Категории для галочек в карточке модуля (из настроек комнат / шага 3). */
  function buildCategoriesFromRoomLinks(config) {
    var cfg = config || getConfig();
    var kitchen = isKitchenProductLine(cfg);
    var links = getRoomLinks(cfg);
    var rooms = getStepItems(cfg, 1);
    var folders = getStepItems(cfg, 3);
    var out = [];
    var order = 0;
    Object.keys(links).forEach(function (rk) {
      if (kitchen && rk !== 'kitchen') return;
      var link = links[rk];
      var roomLabel = kitchen ? '' : findStepLabel(rooms, rk, rk);
      (link.catalogFolderKeys || []).forEach(function (fk) {
        var folderLabel = findStepLabel(folders, fk, fk);
        var label = kitchen ? folderLabel : roomLabel + ' — ' + folderLabel;
        out.push({
          id: 'rfc-' + rk + '-' + fk,
          key: categoryKey(rk, fk),
          label: label,
          roomKey: rk,
          layoutKeys: (link.layoutKeys || []).slice(),
          catalogFolderKey: normFolderKey(fk),
          order: order,
        });
        order += 1;
      });
    });
    // Кухня и шаг 3 пуст — категории из самих пунктов шага 3
    if (kitchen && !out.length && folders.length) {
      folders.forEach(function (f, i) {
        var fk = normFolderKey(f.key != null ? f.key : f.id);
        if (!fk) return;
        out.push({
          id: 'rfc-kitchen-' + fk,
          key: categoryKey('kitchen', fk),
          label: String(f.name || f.label || fk),
          roomKey: 'kitchen',
          layoutKeys: [],
          catalogFolderKey: fk,
          order: i,
        });
      });
    }
    return out;
  }

  /** Папка = админ-каталог, который редактируем (не выдуманные id). */
  function kitchenFolderKeyForPlacement(placementKind, adminCatalogType) {
    var admin = normFolderKey(adminCatalogType);
    if (admin) return admin;
    return '';
  }

  function kitchenFolderLabel(folderKey) {
    var fk = normFolderKey(folderKey);
    var cfg = getConfig();
    var fromStep = findStepLabel(getStepItems(cfg, 3), fk, '');
    return fromStep || fk;
  }

  /** Авто roomTags: каталог = текущий тип из Типов элементов. */
  function buildKitchenModuleRoomTags(placementKind, adminCatalogType) {
    var section = kitchenFolderKeyForPlacement(placementKind, adminCatalogType);
    if (!section) {
      return { rooms: ['kitchen'], layouts: [], catalogFolders: [], categories: [] };
    }
    return {
      rooms: ['kitchen'],
      layouts: [],
      catalogFolders: [section],
      categories: ['kitchen-' + section],
    };
  }

  function getCategories(config) {
    return buildCategoriesFromRoomLinks(config);
  }

  function findCategory(categories, key) {
    var k = normKey(key);
    return (
      (categories || []).find(function (c) {
        return normKey(c.key) === k;
      }) || null
    );
  }

  function buildDefaultRoomLinksFromSteps(config) {
    var rooms = getStepItems(config, 1);
    var folders = getStepItems(config, 3);
    var links = {};
    rooms.forEach(function (room) {
      var rk = normKey(room.key != null ? room.key : room.id);
      if (!rk) return;
      links[rk] = {
        layoutKeys: [],
        catalogFolderKeys: folders
          .map(function (f) {
            return normFolderKey(f.key != null ? f.key : f.id);
          })
          .filter(Boolean),
      };
    });
    return ensureRoomLinksShape(links);
  }

  function buildTaxonomyFromSteps(config) {
    var rooms = getStepItems(config, 1).map(function (it, i) {
      return {
        key: normKey(it.key) || normKey(it.id) || 'room-' + i,
        label: (it.name || it.key || 'Пункт').trim(),
        order: it.order != null ? it.order : i,
      };
    });
    var layouts = getStepItems(config, 2).map(function (it, i) {
      return {
        key: normKey(it.key) || normKey(it.id) || 'layout-' + i,
        label: (it.name || it.key || 'Пункт').trim(),
        order: it.order != null ? it.order : i,
      };
    });
    var catalogFolders = getStepItems(config, 3).map(function (it, i) {
      var key = normFolderKey(it.key != null ? it.key : it.id);
      return {
        key: key || String(i),
        label: (it.name || key || 'Пункт').trim(),
        order: it.order != null ? it.order : i,
      };
    });
    return { rooms: rooms, layouts: layouts, catalogFolders: catalogFolders };
  }

  function getTaxonomy(config) {
    var cfg = config || getConfig();
    if (cfg && cfg.roomFurnitureTaxonomy) {
      var t = cfg.roomFurnitureTaxonomy;
      return {
        rooms: Array.isArray(t.rooms) ? t.rooms : [],
        layouts: Array.isArray(t.layouts) ? t.layouts : [],
        catalogFolders: Array.isArray(t.catalogFolders) ? t.catalogFolders : [],
      };
    }
    return buildTaxonomyFromSteps(cfg);
  }

  function categoryMatchesContext(category, ctx) {
    if (!category) return false;
    var rk = normKey(ctx && ctx.roomKey);
    var lk = normKey(ctx && ctx.layoutKey);
    if (category.roomKey && rk && normKey(category.roomKey) !== rk) return false;
    if (!layoutKeysAllow(lk, category.layoutKeys)) return false;
    return true;
  }

  function getModuleCategoryKeys(item) {
    if (!item || typeof item !== 'object') return [];
    var raw =
      item.roomTags ||
      item.data?.roomTags ||
      (typeof item.data === 'string'
        ? (function () {
            try {
              var p = JSON.parse(item.data);
              return p && p.roomTags;
            } catch (_) {
              return null;
            }
          })()
        : null);
    if (raw && typeof raw === 'object' && Array.isArray(raw.categories)) {
      var fromTags = raw.categories.map(normKey).filter(Boolean);
      if (fromTags.length) return fromTags;
    }
    return [];
  }

  /** Legacy category id из item.category / categoryId (catalog_26 и выгрузка в localStorage). */
  function getLegacyCatalogCategoryIds(item) {
    if (!item || typeof item !== 'object') return [];
    var cid =
      item.categoryId != null
        ? item.categoryId
        : item.category_id != null
          ? item.category_id
          : null;
    if (cid != null) return [Number(cid)];
    var cat = item.category != null ? item.category : item.data?.category;
    if (cat == null) return [];
    if (typeof cat === 'number') return [cat];
    if (cat && cat.id != null) return [Number(cat.id)];
    if (!Array.isArray(cat)) return [];
    return cat
      .map(function (c) {
        if (typeof c === 'number') return c;
        if (typeof c === 'string' && c.trim() !== '' && !isNaN(Number(c))) return Number(c);
        if (c && c.id != null) return Number(c.id);
        return null;
      })
      .filter(function (x) {
        return x != null && Number.isFinite(x);
      });
  }

  function getModuleRoomTags(item) {
    if (!item || typeof item !== 'object') {
      return { rooms: [], layouts: [], catalogFolders: [], categories: [] };
    }
    var raw =
      item.roomTags ||
      item.data?.roomTags ||
      (typeof item.data === 'string'
        ? (function () {
            try {
              var p = JSON.parse(item.data);
              return p && p.roomTags;
            } catch (_) {
              return null;
            }
          })()
        : null);
    if (!raw || typeof raw !== 'object') {
      return { rooms: [], layouts: [], catalogFolders: [], categories: [] };
    }
    return {
      rooms: Array.isArray(raw.rooms) ? raw.rooms.map(normKey).filter(Boolean) : [],
      layouts: Array.isArray(raw.layouts) ? raw.layouts.map(normKey).filter(Boolean) : [],
      catalogFolders: Array.isArray(raw.catalogFolders)
        ? raw.catalogFolders.map(normFolderKey).filter(Boolean)
        : [],
      categories: Array.isArray(raw.categories) ? raw.categories.map(normKey).filter(Boolean) : [],
    };
  }

  function linksAllow(selectedKey, linkKeys) {
    if (!Array.isArray(linkKeys) || linkKeys.length === 0) return true;
    if (!selectedKey) return true;
    var sk = normKey(selectedKey);
    return linkKeys.some(function (k) {
      return normKey(k) === sk;
    });
  }

  function findTaxEntry(list, itemKey) {
    if (!Array.isArray(list) || !itemKey) return null;
    var k = normKey(itemKey);
    return (
      list.find(function (it) {
        return normKey(it.key) === k;
      }) || null
    );
  }

  function hasRoomLinksConfig(config) {
    return Object.keys(getRoomLinks(config)).length > 0;
  }

  /** Шаг 2: раскладки, разрешённые для выбранной комнаты. */
  function filterStep2Layouts(layoutItems, roomKey, config) {
    if (!Array.isArray(layoutItems) || !layoutItems.length) return layoutItems || [];
    var link = getRoomLink(config, roomKey);
    if (link) {
      var lks = link.layoutKeys || [];
      if (!lks.length) return layoutItems.slice();
      return layoutItems.filter(function (it) {
        return lks.indexOf(normKey(it.key != null ? it.key : it.id)) >= 0;
      });
    }
    var tax = getTaxonomy(config);
    if (!tax.layouts.length) return layoutItems.slice();
    var rk = normKey(roomKey);
    return layoutItems.filter(function (it) {
      var key = normKey(it.key != null ? it.key : it.id);
      var entry = findTaxEntry(tax.layouts, key);
      if (!entry) return true;
      return linksAllow(rk, entry.roomKeys);
    });
  }

  function filterStep3FoldersByRoomLinks(folders, ctx, config) {
    var link = getRoomLink(config, ctx && ctx.roomKey);
    if (!link) return null;
    var allowed = {};
    (link.catalogFolderKeys || []).forEach(function (fk) {
      allowed[normFolderKey(fk)] = true;
    });
    return folders.filter(function (folder) {
      var fk = normFolderKey(folder.id != null ? folder.id : folder.key);
      return !!allowed[fk];
    });
  }

  function filterStep3FoldersByTaxonomy(folders, ctx, config) {
    if (!Array.isArray(folders) || !folders.length) return folders || [];
    var tax = getTaxonomy(config);
    if (!tax.catalogFolders.length) return folders.slice();
    var lk = normKey(ctx && ctx.layoutKey);
    return folders.filter(function (folder) {
      var fk = normFolderKey(folder.id != null ? folder.id : folder.key);
      var entry = findTaxEntry(tax.catalogFolders, fk);
      if (!entry) return true;
      return linksAllow(lk, entry.layoutKeys);
    });
  }

  function getRoomContext() {
    var roomKey = normKey(global.selectedRoomType?.key);
    var layoutKey = normKey(global.selectedRoomLayout?.key);
    return { roomKey: roomKey, layoutKey: layoutKey };
  }

  function isShowAllCategoriesMode(opts) {
    if (opts && opts.showAllCategories) return true;
    return !!(global.step3ShowAllCategories);
  }

  /** Все ключи папок каталога (25, 26…), привязанные хотя бы к одной комнате. */
  function getAllLinkedCatalogFolderKeys(config) {
    var links = getRoomLinks(config);
    var set = {};
    Object.keys(links).forEach(function (rk) {
      (links[rk].catalogFolderKeys || []).forEach(function (fk) {
        var n = normFolderKey(fk);
        if (n) set[n] = true;
      });
    });
    return Object.keys(set);
  }

  function moduleMatchesRoomContext(item, ctx, opts) {
    opts = opts || {};
    var cfg = getConfig();
    var categories = getCategories(cfg);
    var catKeys = getModuleCategoryKeys(item);
    var showAll = isShowAllCategoriesMode(opts);
    // Кухня: selectedRoomType.key всегда 'kitchen' (форма — shapeKey).
    // Не режем модули, если ctx.roomKey вдруг пуст/старый.
    var kitchenLine = isKitchenProductLine(cfg);

    if (hasRoomLinksConfig(cfg) && categories.length && catKeys.length) {
      var folderKey = opts.catalogFolderKey ? normFolderKey(opts.catalogFolderKey) : '';
      return catKeys.some(function (ck) {
        var cat = findCategory(categories, ck);
        if (!cat) {
          // Категория kitchen-46 есть на модуле, но ещё не в taxonomy — для кухни не прячем.
          if (kitchenLine && folderKey && ck.indexOf(folderKey) >= 0) return true;
          return false;
        }
        if (!showAll && !categoryMatchesContext(cat, ctx)) {
          if (
            kitchenLine &&
            normKey(cat.roomKey) === 'kitchen' &&
            (!ctx || !ctx.roomKey || normKey(ctx.roomKey) === 'kitchen')
          ) {
            // ok — кухня
          } else {
            return false;
          }
        }
        if (folderKey && cat.catalogFolderKey) {
          return normFolderKey(cat.catalogFolderKey) === folderKey;
        }
        return true;
      });
    }

    var tags = getModuleRoomTags(item);
    var hasAnyRoomTag =
      tags.rooms.length > 0 ||
      tags.layouts.length > 0 ||
      tags.catalogFolders.length > 0 ||
      tags.categories.length > 0;
    // Модули без roomTags (типичный catalog_26 после «Выгрузить в конструктор») — показываем на шаге 4.
    if (!hasAnyRoomTag && !catKeys.length) {
      return true;
    }
    var roomKey = normKey(ctx && ctx.roomKey);
    var layoutKey = normKey(ctx && ctx.layoutKey);
    if (!tagArrayMatches(roomKey, tags.rooms)) return false;
    if (!tagArrayMatches(layoutKey, tags.layouts)) return false;
    if (opts.catalogFolderKey) {
      var fk = normFolderKey(opts.catalogFolderKey);
      if (!tagArrayMatches(fk, tags.catalogFolders)) return false;
    }
    return true;
  }

  function catalogHasMatchingModules(catalogFolderKey, ctx, catalogArray) {
    if (!Array.isArray(catalogArray) || !catalogArray.length) return false;
    var fk = normFolderKey(catalogFolderKey);
    return catalogArray.some(function (item) {
      return moduleMatchesRoomContext(item, ctx, { catalogFolderKey: fk });
    });
  }

  function loadCatalogFromStorage(folderKey) {
    var fk = normFolderKey(folderKey);
    if (!fk || typeof global.localStorage === 'undefined') return [];
    try {
      var raw = global.localStorage.getItem('catalog_' + fk);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }

  function filterStep3Folders(folders, ctx, showAll) {
    if (!Array.isArray(folders)) return [];
    var cfg = getConfig();
    if (showAll) {
      var union = getAllLinkedCatalogFolderKeys(cfg);
      if (union.length) {
        var allowed = {};
        union.forEach(function (fk) {
          allowed[fk] = true;
        });
        return folders.filter(function (folder) {
          var fk = normFolderKey(folder.id != null ? folder.id : folder.key);
          return !!allowed[fk];
        });
      }
      return folders.slice();
    }
    var byRoom = filterStep3FoldersByRoomLinks(folders, ctx, cfg);
    if (byRoom != null) {
      // Шаг 3: только настройки комнаты (③). Модули фильтруются на шаге 4.
      return byRoom;
    }
    var out = filterStep3FoldersByTaxonomy(folders, ctx, cfg);
    var hasContext = !!(ctx && (ctx.roomKey || ctx.layoutKey));
    if (!hasContext) return out;
    return out.filter(function (folder) {
      var fk = normFolderKey(folder.id != null ? folder.id : folder.key);
      var catalog = loadCatalogFromStorage(fk);
      if (catalogHasMatchingModules(fk, ctx, catalog)) return true;
      return false;
    });
  }

  var api = {
    WILDCARD: WILDCARD,
    ensureRoomLinksShape: ensureRoomLinksShape,
    getRoomLinks: getRoomLinks,
    getRoomLink: getRoomLink,
    getCategories: getCategories,
    buildCategoriesFromRoomLinks: buildCategoriesFromRoomLinks,
    buildDefaultRoomLinksFromSteps: buildDefaultRoomLinksFromSteps,
    findCategory: findCategory,
    categoryMatchesContext: categoryMatchesContext,
    buildTaxonomyFromSteps: buildTaxonomyFromSteps,
    getTaxonomy: getTaxonomy,
    getModuleCategoryKeys: getModuleCategoryKeys,
    getModuleRoomTags: getModuleRoomTags,
    getRoomContext: getRoomContext,
    isShowAllCategoriesMode: isShowAllCategoriesMode,
    getAllLinkedCatalogFolderKeys: getAllLinkedCatalogFolderKeys,
    moduleMatchesRoomContext: moduleMatchesRoomContext,
    catalogHasMatchingModules: catalogHasMatchingModules,
    filterStep2Layouts: filterStep2Layouts,
    filterStep3FoldersByTaxonomy: filterStep3FoldersByTaxonomy,
    filterStep3Folders: filterStep3Folders,
    normFolderKey: normFolderKey,
    categoryKey: categoryKey,
    isKitchenProductLine: isKitchenProductLine,
    kitchenFolderKeyForPlacement: kitchenFolderKeyForPlacement,
    kitchenFolderLabel: kitchenFolderLabel,
    buildKitchenModuleRoomTags: buildKitchenModuleRoomTags,
    sanitizeKitchenRoomLinks: sanitizeKitchenRoomLinks,
    isKitchenShapeRoomKey: isKitchenShapeRoomKey,
  };

  global.__cldRoomFurnitureTags = api;
})(typeof window !== 'undefined' ? window : globalThis);
