/**
 * Галочки «Категории для комнаты» в карточке модуля каталога.
 */
(function (global) {
  function getCategories() {
    var api = global.__cldRoomFurnitureTags;
    var cfg = typeof global.getRoomStepsConfig === 'function' ? global.getRoomStepsConfig() : null;
    if (api && typeof api.getCategories === 'function') return api.getCategories(cfg);
    return [];
  }

  function renderCategoryList(containerId, selectedKeys) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var cats = getCategories();
    var sel = selectedKeys || [];
    if (!cats.length) {
      el.innerHTML =
        '<span class="text-muted small">Сначала создайте категории: «Управление комнатой 2» → «Категории для комнаты».</span>';
      return;
    }
    var html =
      '<p class="form-text text-muted mb-2" style="font-size:12px;">На шаге 4 в конструкторе появятся только модули с отмеченными категориями (например «Гостиная — Тумбы»).</p>';
    cats.forEach(function (c) {
      var k = String(c.key || '');
      var checked = sel.indexOf(k) >= 0;
      var meta = [];
      if (c.roomKey) meta.push(c.roomKey);
      if (c.catalogFolderKey) meta.push('раздел ' + c.catalogFolderKey);
      html +=
        '<label class="d-block mb-2" style="font-size:13px;cursor:pointer;">' +
        '<input type="checkbox" class="catalog-room-category-chk" data-key="' +
        k.replace(/"/g, '&quot;') +
        '" ' +
        (checked ? 'checked' : '') +
        '> ' +
        '<strong>' +
        String(c.label || k).replace(/</g, '&lt;') +
        '</strong>';
      if (meta.length) {
        html +=
          ' <span class="text-muted small">(' + meta.join(', ').replace(/</g, '&lt;') + ')</span>';
      }
      html += '</label>';
    });
    el.innerHTML = html;
  }

  function readRoomTagsFromDom() {
    var categories = [];
    document.querySelectorAll('.catalog-room-category-chk:checked').forEach(function (ch) {
      var key = ch.getAttribute('data-key');
      if (key) categories.push(key);
    });
    return { categories: categories };
  }

  function syncCatalogRoomTagsPanel(roomTags) {
    var tags =
      roomTags && typeof roomTags === 'object' ? roomTags : { categories: [] };
    var selected = Array.isArray(tags.categories)
      ? tags.categories
      : Array.isArray(tags.categoryKeys)
        ? tags.categoryKeys
        : [];
    renderCategoryList('catalog-item-room-tags-categories', selected);
  }

  function patchOpenCatalogItemEdit() {
    var fn = global.openCatalogItemEdit;
    if (!fn || fn.__cldRoomTagsPatched) return;
    global.openCatalogItemEdit = function () {
      var r = fn.apply(this, arguments);
      setTimeout(function () {
        var app = global.catalogItemVueApp;
        var tags = (app && app.item && app.item.roomTags) || null;
        syncCatalogRoomTagsPanel(tags);
      }, 50);
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
        app.item.roomTags = readRoomTagsFromDom();
      }
      return orig.call(this, saveAndExit);
    };
    app.__cldRoomTagsSavePatched = true;
  }

  function bindCategoryCheckboxHandlers(container) {
    if (!container || container.__cldRoomTagsChkBound) return;
    container.__cldRoomTagsChkBound = true;
    container.addEventListener('change', function (ev) {
      var t = ev.target;
      if (!t || !t.classList || !t.classList.contains('catalog-room-category-chk')) return;
      var app = global.catalogItemVueApp;
      if (app && app.item) {
        app.item.roomTags = readRoomTagsFromDom();
      }
    });
  }

  function init() {
    patchOpenCatalogItemEdit();
    patchSaveItem();
    bindCategoryCheckboxHandlers(
      document.getElementById('catalog-item-room-tags-categories')
    );
  }

  global.__cldSyncCatalogRoomTagsPanel = function (roomTags) {
    syncCatalogRoomTagsPanel(roomTags);
    bindCategoryCheckboxHandlers(
      document.getElementById('catalog-item-room-tags-categories')
    );
  };
  global.__cldReadCatalogRoomTagsFromDom = readRoomTagsFromDom;

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
    bindCategoryCheckboxHandlers(
      document.getElementById('catalog-item-room-tags-categories')
    );
    if (++tries > 50) clearInterval(t);
  }, 300);
})(typeof window !== 'undefined' ? window : globalThis);
