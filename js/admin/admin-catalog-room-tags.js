/**
 * Каталог в комнате = тип из «Каталог элементов → Типы элементов» (catalogs_keys).
 * Никаких зашитых «1-й ярус» — только то, что создал пользователь.
 */
(function (global) {
  var catalogsKeysCache = null;
  var catalogsKeysPromise = null;

  function tagsApi() {
    return global.__cldRoomFurnitureTags || null;
  }

  function pkApi() {
    return global.__cldPlacementKindProfiles || null;
  }

  function isKitchenUnitApp(app) {
    var pk = pkApi();
    if (pk && typeof pk.isKitchenUnitCatalogType === 'function') {
      return !!pk.isKitchenUnitCatalogType(
        app && app.catalogType,
        app && app.item && app.item.catalog_type
      );
    }
    var api = tagsApi();
    return !!(api && typeof api.isKitchenProductLine === 'function' && api.isKitchenProductLine());
  }

  function normFolderKey(v) {
    var k = String(v || '').trim();
    if (k.indexOf('catalog_') === 0) k = k.replace(/^catalog_/, '');
    return k;
  }

  function fetchCatalogsKeys() {
    if (catalogsKeysCache) return Promise.resolve(catalogsKeysCache);
    if (catalogsKeysPromise) return catalogsKeysPromise;
    catalogsKeysPromise = fetch('/api/catalog/items_get/catalogs_keys?t=' + Date.now(), {
      cache: 'no-cache',
    })
      .then(function (r) {
        return r.ok ? r.json() : [];
      })
      .then(function (data) {
        var arr = Array.isArray(data) ? data : [];
        catalogsKeysCache = arr
          .map(function (it) {
            var key = normFolderKey(it.key != null ? it.key : it.id);
            var name = String(it.name || it.label || key || '').trim();
            if (!key || !name) return null;
            if (Number(it.active) === 0) return null;
            return {
              key: key,
              label: name,
              id: it.id != null ? it.id : key,
              order: it.order != null ? Number(it.order) : 0,
            };
          })
          .filter(Boolean)
          .sort(function (a, b) {
            return (a.order || 0) - (b.order || 0) || String(a.label).localeCompare(String(b.label), 'ru');
          });
        return catalogsKeysCache;
      })
      .catch(function () {
        catalogsKeysCache = [];
        return catalogsKeysCache;
      })
      .finally(function () {
        catalogsKeysPromise = null;
      });
    return catalogsKeysPromise;
  }

  function resolveSectionKey(app) {
    // Главное: каталог, который сейчас редактируем в сайдбаре.
    var admin = normFolderKey(app && app.catalogType);
    if (admin) return admin;
    var fromItem = normFolderKey(app && app.item && app.item.catalog_type);
    if (fromItem) return fromItem;
    var tags = app && app.item && app.item.roomTags;
    if (tags && Array.isArray(tags.catalogFolders) && tags.catalogFolders[0]) {
      return normFolderKey(tags.catalogFolders[0]);
    }
    return '';
  }

  function buildTagsForFolder(folderKey) {
    var key = normFolderKey(folderKey);
    if (!key) return { rooms: ['kitchen'], layouts: [], catalogFolders: [], categories: [] };
    return {
      rooms: ['kitchen'],
      layouts: [],
      catalogFolders: [key],
      categories: ['kitchen-' + key],
    };
  }

  function ensureKitchenAutoTags(app) {
    if (!app || !app.item || !isKitchenUnitApp(app)) return;
    var section = resolveSectionKey(app);
    if (!section) return;
    var tags = buildTagsForFolder(section);
    if (typeof app.$set === 'function') {
      app.$set(app.item, 'roomTags', tags);
      app.$set(app.item, 'catalog_type', 'catalog_' + section);
    } else {
      app.item.roomTags = tags;
      app.item.catalog_type = 'catalog_' + section;
    }
  }

  function selectedFolderFromTags(roomTags, fallback) {
    var tags = roomTags && typeof roomTags === 'object' ? roomTags : {};
    if (Array.isArray(tags.catalogFolders) && tags.catalogFolders.length) {
      return normFolderKey(tags.catalogFolders[0]);
    }
    if (Array.isArray(tags.categories) && tags.categories.length) {
      var m = String(tags.categories[0]).match(/^kitchen-(.+)$/);
      if (m) return normFolderKey(m[1]);
    }
    return normFolderKey(fallback);
  }

  function renderKitchenPanel(el, app, folders) {
    var section = resolveSectionKey(app);
    var selected = selectedFolderFromTags(app && app.item && app.item.roomTags, section) || section;
    var list = Array.isArray(folders) ? folders : [];
    var currentName =
      (list.find(function (f) {
        return String(f.key) === String(selected);
      }) || {}).label || selected || '—';

    var html =
      '<p class="form-text text-muted mb-2" style="font-size:12px;">' +
      'Каталоги создаются в <strong>Каталог элементов → Типы элементов</strong>, ' +
      'потом появляются слева в меню. Здесь выбираешь, в какой из них модуль попадёт в комнате ' +
      '(шаг «С чего начнём?»).' +
      '</p>';
    html +=
      '<p class="mb-2" style="font-size:13px;">Сейчас редактируешь: <strong>' +
      String(currentName).replace(/</g, '&lt;') +
      '</strong></p>';

    if (!list.length) {
      html +=
        '<span class="text-danger small">Нет типов каталога. Создай тип: Каталог элементов → Типы элементов.</span>';
      el.innerHTML = html;
      return;
    }

    list.forEach(function (f) {
      var checked = String(f.key) === String(selected);
      html +=
        '<label class="d-block mb-2" style="font-size:13px;cursor:pointer;">' +
        '<input type="radio" name="catalog-room-kitchen-folder" class="catalog-room-kitchen-folder" data-key="' +
        String(f.key).replace(/"/g, '&quot;') +
        '" ' +
        (checked ? 'checked' : '') +
        '> ' +
        '<strong>' +
        String(f.label).replace(/</g, '&lt;') +
        '</strong>' +
        '</label>';
    });
    el.innerHTML = html;
  }

  function getLegacyCategories() {
    var api = tagsApi();
    var cfg = typeof global.getRoomStepsConfig === 'function' ? global.getRoomStepsConfig() : null;
    if (api && typeof api.getCategories === 'function') return api.getCategories(cfg);
    return [];
  }

  function renderWardrobePanel(el, selectedKeys) {
    var cats = getLegacyCategories();
    var sel = selectedKeys || [];
    if (!cats.length) {
      el.innerHTML =
        '<span class="text-muted small">Сначала создайте категории в «Управление комнатой 2».</span>';
      return;
    }
    var html = '';
    cats.forEach(function (c) {
      var k = String(c.key || '');
      var checked = sel.indexOf(k) >= 0;
      html +=
        '<label class="d-block mb-2" style="font-size:13px;cursor:pointer;">' +
        '<input type="checkbox" class="catalog-room-category-chk" data-key="' +
        k.replace(/"/g, '&quot;') +
        '" ' +
        (checked ? 'checked' : '') +
        '> <strong>' +
        String(c.label || k).replace(/</g, '&lt;') +
        '</strong></label>';
    });
    el.innerHTML = html;
  }

  function readRoomTagsFromDom() {
    var app = global.catalogItemVueApp;
    if (app && isKitchenUnitApp(app)) {
      var radio = document.querySelector('.catalog-room-kitchen-folder:checked');
      var key = radio ? radio.getAttribute('data-key') : resolveSectionKey(app);
      return buildTagsForFolder(key);
    }
    var categories = [];
    document.querySelectorAll('.catalog-room-category-chk:checked').forEach(function (ch) {
      var k = ch.getAttribute('data-key');
      if (k) categories.push(k);
    });
    return { categories: categories };
  }

  function syncCatalogRoomTagsPanel(roomTags) {
    var el = document.getElementById('catalog-item-room-tags-categories');
    if (!el) return;
    var app = global.catalogItemVueApp;
    var label = document.querySelector('#catalog-item-room-tags-wrap > label.col-form-label');
    var hint = document.querySelector('#catalog-item-room-tags-wrap .form-text.text-muted.mb-2');

    if (isKitchenUnitApp(app)) {
      if (label) label.textContent = 'Каталог в комнате';
      if (hint) {
        hint.textContent =
          'Список = твои типы из «Типы элементов». Создаёшь тип → он появляется слева и здесь.';
      }
      ensureKitchenAutoTags(app);
      fetchCatalogsKeys().then(function (folders) {
        renderKitchenPanel(el, app, folders);
        var tags = readRoomTagsFromDom();
        if (app && app.item) {
          app.item.roomTags = tags;
          if (tags.catalogFolders && tags.catalogFolders[0]) {
            app.item.catalog_type = 'catalog_' + tags.catalogFolders[0];
          }
        }
      });
    } else {
      if (label) label.textContent = 'Категории для комнаты';
      if (hint) {
        hint.textContent = 'В каких категориях комнаты показывать модуль на шаге 4.';
      }
      var tags = roomTags && typeof roomTags === 'object' ? roomTags : { categories: [] };
      var selected = Array.isArray(tags.categories) ? tags.categories : [];
      renderWardrobePanel(el, selected);
    }
  }

  function patchOpenCatalogItemEdit() {
    var fn = global.openCatalogItemEdit;
    if (!fn || fn.__cldRoomTagsPatched) return;
    global.openCatalogItemEdit = function () {
      var r = fn.apply(this, arguments);
      setTimeout(function () {
        var app = global.catalogItemVueApp;
        if (isKitchenUnitApp(app)) ensureKitchenAutoTags(app);
        syncCatalogRoomTagsPanel((app && app.item && app.item.roomTags) || null);
      }, 80);
      return r;
    };
    global.openCatalogItemEdit.__cldRoomTagsPatched = true;
  }

  function patchSaveItem() {
    var app = global.catalogItemVueApp;
    if (!app || app.__cldRoomTagsSavePatched || typeof app.saveItem !== 'function') return;
    var orig = app.saveItem;
    app.saveItem = function (saveAndExit) {
      if (app.item) {
        var fromDom = readRoomTagsFromDom();
        app.item.roomTags = fromDom;
        if (isKitchenUnitApp(app) && fromDom.catalogFolders && fromDom.catalogFolders[0]) {
          app.item.catalog_type = 'catalog_' + fromDom.catalogFolders[0];
        }
      }
      return orig.call(this, saveAndExit);
    };
    app.__cldRoomTagsSavePatched = true;
  }

  function bindHandlers(container) {
    if (!container || container.__cldRoomTagsChkBound) return;
    container.__cldRoomTagsChkBound = true;
    container.addEventListener('change', function (ev) {
      var t = ev.target;
      if (!t || !t.classList) return;
      var app = global.catalogItemVueApp;
      if (!app || !app.item) return;
      if (
        t.classList.contains('catalog-room-kitchen-folder') ||
        t.classList.contains('catalog-room-category-chk')
      ) {
        var tags = readRoomTagsFromDom();
        app.item.roomTags = tags;
        if (isKitchenUnitApp(app) && tags.catalogFolders && tags.catalogFolders[0]) {
          app.item.catalog_type = 'catalog_' + tags.catalogFolders[0];
          var sel = document.getElementById('catalog-item-edit-element-type');
          if (sel) sel.value = app.item.catalog_type;
        }
      }
    });
  }

  function init() {
    patchOpenCatalogItemEdit();
    patchSaveItem();
    bindHandlers(document.getElementById('catalog-item-room-tags-categories'));
  }

  global.__cldSyncCatalogRoomTagsPanel = function (roomTags) {
    syncCatalogRoomTagsPanel(roomTags);
    bindHandlers(document.getElementById('catalog-item-room-tags-categories'));
  };
  global.__cldReadCatalogRoomTagsFromDom = readRoomTagsFromDom;
  global.__cldEnsureKitchenCatalogRoomTags = ensureKitchenAutoTags;
  global.__cldInvalidateCatalogsKeysCache = function () {
    catalogsKeysCache = null;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  global.addEventListener('load', init);
  var tries = 0;
  var t = setInterval(function () {
    patchOpenCatalogItemEdit();
    patchSaveItem();
    bindHandlers(document.getElementById('catalog-item-room-tags-categories'));
    if (++tries > 50) clearInterval(t);
  }, 300);
})(typeof window !== 'undefined' ? window : globalThis);
