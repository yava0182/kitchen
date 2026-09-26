/**
 * Модуль «Управление комнатой» и «Шаги комнаты» для админки.
 * Вынесен из admin-new.html, чтобы уменьшить размер основного файла и нагрузку на редактор.
 */
(function () {
  'use strict';

  /** Кэш плитных материалов (material_2) для шага 5 — общий для сохранения и панели. */
  var __step5LdspById = null;

  const ROOM_SETTINGS_KEY = 'room_settings';
  async function loadRoomSettings() {
    initPriceSublineBlock();
    const container = document.getElementById('room-settings-catalog-list');
    if (!container) return;
    if (typeof window.loadRoomStepsUI === 'function') window.loadRoomStepsUI();
    container.innerHTML = '<div class="text-muted p-3">Загрузка типов каталога...</div>';
    let settings = {};
    try {
      const raw = localStorage.getItem(ROOM_SETTINGS_KEY);
      if (raw) settings = JSON.parse(raw);
    } catch (e) {}
    const visibleTypes = settings.visibleCatalogTypes || [];
    const categoryFilter = settings.categoryFilter || {};
    try {
      const res = await fetch('/api/catalog/items_get/catalogs_keys');
      const typesData = await res.json();
      const types = Array.isArray(typesData) ? typesData : (typesData.items || []);
      if (!types.length) {
        container.innerHTML = '<div class="text-muted p-3">Нет типов каталога. Добавьте типы в разделе «Каталог элементов → Типы элементов».</div>';
        return;
      }
      let html = '';
      for (const t of types) {
        const typeKey = (t.key || t.id || t.name || '').toString().trim() || ('catalog_' + (t.id || ''));
        const typeName = (t.name || typeKey).replace(/</g, '&lt;');
        const checked = visibleTypes.indexOf(typeKey) !== -1;
        const catFilter = categoryFilter[typeKey] || [];
        html += '<div class="border rounded p-3 mb-3" style="background:#fafafa;">';
        html += '<label class="d-flex align-items-center mb-2"><input type="checkbox" class="room-type-check mr-2" data-type="' + typeKey.replace(/"/g, '&quot;') + '" ' + (checked ? 'checked' : '') + '> <strong>' + typeName + '</strong></label>';
        html += '<div class="room-categories-wrap ml-4" data-type="' + typeKey.replace(/"/g, '&quot;') + '" style="' + (checked ? '' : 'display:none;') + '">';
        html += '<small class="text-muted d-block mb-2">Категории (если не отмечено ни одной — в комнате показываются все):</small>';
        html += '<div class="room-categories-list" data-type="' + typeKey.replace(/"/g, '&quot;') + '">Загрузка...</div>';
        html += '</div></div>';
      }
      container.innerHTML = html;
      container.querySelectorAll('.room-type-check').forEach(cb => {
        cb.addEventListener('change', function() {
          const wrap = container.querySelector('.room-categories-wrap[data-type="' + CSS.escape(this.getAttribute('data-type')) + '"]');
          if (wrap) wrap.style.display = this.checked ? '' : 'none';
        });
      });
      for (const t of types) {
        const typeKey = (t.key || t.id || t.name || '').toString().trim() || ('catalog_' + (t.id || ''));
        const listEl = container.querySelector('.room-categories-list[data-type="' + CSS.escape(typeKey) + '"]');
        if (!listEl) continue;
        try {
          const catRes = await fetch('/api/catalog/categories_get/' + encodeURIComponent(typeKey));
          const cats = await catRes.json();
          const arr = Array.isArray(cats) ? cats : [];
          const selectedIds = (categoryFilter[typeKey] || []).map(String);
          if (!arr.length) {
            listEl.innerHTML = '<span class="text-muted">Нет категорий</span>';
            continue;
          }
          const path = function(id, map) {
            const c = map[id];
            if (!c) return [];
            const p = c.parent !== undefined && c.parent !== null ? c.parent : c.parent_id;
            if (!p || !map[p]) return [c.name || ''];
            return path(p, map).concat([c.name || '']);
          };
          const map = {};
          arr.forEach(c => { map[c.id] = { id: c.id, name: c.name, parent: c.parent !== undefined && c.parent !== null ? c.parent : c.parent_id }; });
          let opts = '';
          arr.forEach(c => {
            const label = path(c.id, map).join(' / ') || (c.name || '');
            const sel = selectedIds.indexOf(String(c.id)) !== -1;
            opts += '<label class="d-block mb-1"><input type="checkbox" class="room-cat-check mr-2" data-type="' + typeKey.replace(/"/g, '&quot;') + '" data-id="' + c.id + '"' + (sel ? ' checked' : '') + '> ' + (label || '').replace(/</g, '&lt;') + '</label>';
          });
          listEl.innerHTML = opts;
        } catch (err) {
          listEl.innerHTML = '<span class="text-danger">Ошибка загрузки</span>';
        }
      }
    } catch (err) {
      console.error('loadRoomSettings:', err);
      container.innerHTML = '<div class="text-danger p-3">Ошибка загрузки. Проверьте консоль.</div>';
    }
  }
  function saveRoomSettings() {
    const container = document.getElementById('room-settings-catalog-list');
    if (!container) return;
    const visibleTypes = [];
    container.querySelectorAll('.room-type-check:checked').forEach(cb => visibleTypes.push(cb.getAttribute('data-type')));
    const categoryFilter = {};
    container.querySelectorAll('.room-categories-list[data-type]').forEach(listEl => {
      const typeKey = listEl.getAttribute('data-type');
      const ids = [];
      listEl.querySelectorAll('.room-cat-check:checked').forEach(ch => ids.push(parseInt(ch.getAttribute('data-id'), 10)));
      if (ids.length) categoryFilter[typeKey] = ids;
    });
    const settings = { visibleCatalogTypes: visibleTypes, categoryFilter: categoryFilter };
    try {
      localStorage.setItem(ROOM_SETTINGS_KEY, JSON.stringify(settings));
      if (typeof toastr !== 'undefined') toastr.success('Настройки комнаты сохранены');
      else alert('Настройки комнаты сохранены');
    } catch (e) {
      if (typeof toastr !== 'undefined') toastr.error('Ошибка сохранения');
      else alert('Ошибка сохранения');
    }
  }
  window.loadRoomSettings = loadRoomSettings;
  window.saveRoomSettings = saveRoomSettings;

  // ---------- Строка под ценой (в интерфейсе «Управление комнатой») ----------
  const CONSTRUCTOR_UI_API = '/api/constructor_ui_settings';
  const PRICE_SUBLINE_CONTAINER_ID = 'room-settings-price-subline';

  function ensurePriceSublineCollapseStyles() {
    if (document.getElementById('room2-price-subline-collapse-styles')) return;
    var style = document.createElement('style');
    style.id = 'room2-price-subline-collapse-styles';
    style.textContent = ''
      + '.room2-price-subline-ibox.collapsed .ibox-content,'
      + '.room2-step4-items-ibox.collapsed .ibox-content,'
      + '.room2-step4-pills-ibox.collapsed .ibox-content,'
      + '.room2-zone-edit-ibox.collapsed .ibox-content,'
      + '.room2-step5-color-tabs-ibox.collapsed .ibox-content,'
      + '.room2-step5-trim-edges-ibox.collapsed .ibox-content,'
      + '.room2-step5-wheel-ibox.collapsed .ibox-content,'
      + '.room2-step5-params-ibox.collapsed .ibox-content'
      + '{display:none !important}'
      + '.room2-price-subline-ibox .collapse-link,'
      + '.room2-step4-items-ibox .collapse-link,'
      + '.room2-step4-pills-ibox .collapse-link,'
      + '.room2-zone-edit-ibox .collapse-link,'
      + '.room2-step5-color-tabs-ibox .collapse-link,'
      + '.room2-step5-trim-edges-ibox .collapse-link,'
      + '.room2-step5-wheel-ibox .collapse-link,'
      + '.room2-step5-params-ibox .collapse-link'
      + '{cursor:pointer;display:inline-flex;align-items:center;padding:4px 8px;text-decoration:none}'
      + '.room2-price-subline-ibox .collapse-triangle,'
      + '.room2-step4-items-ibox .collapse-triangle,'
      + '.room2-step4-pills-ibox .collapse-triangle,'
      + '.room2-zone-edit-ibox .collapse-triangle,'
      + '.room2-step5-color-tabs-ibox .collapse-triangle,'
      + '.room2-step5-trim-edges-ibox .collapse-triangle,'
      + '.room2-step5-wheel-ibox .collapse-triangle,'
      + '.room2-step5-params-ibox .collapse-triangle'
      + '{font-size:14px;color:#333;font-weight:bold;line-height:1}';
    document.head.appendChild(style);
  }

  function getPriceSublineContainer() {
    var existing = document.getElementById(PRICE_SUBLINE_CONTAINER_ID);
    if (existing) {
      var room2 = document.getElementById('room-settings-2');
      if (room2 && room2.contains(existing)) {
        existing.remove();
        return null;
      }
      return existing;
    }
    var page = document.getElementById('room-settings');
    if (!page) return null;
    var wrapper = page.querySelector('.wrapper-content');
    if (!wrapper) return null;
    var el = document.createElement('div');
    el.id = PRICE_SUBLINE_CONTAINER_ID;
    el.innerHTML =
      '<div class="ibox" style="margin-bottom:20px;">' +
      '  <div class="ibox-title"><h5>Строка под ценой в конструкторе</h5></div>' +
      '  <div class="ibox-content">' +
      '    <p class="text-muted mb-2">Текст под блоком с ценой в правой панели конструктора. Галка включает или выключает показ строки.</p>' +
      '    <div class="form-group" style="margin-bottom:16px;">' +
      '      <label class="d-flex align-items-center gap-2" style="cursor:pointer;">' +
      '        <input type="checkbox" id="room-cu-show-price-subline" /> Показывать строку под ценой' +
      '      </label>' +
      '    </div>' +
      '    <div class="form-group" style="margin-bottom:16px;">' +
      '      <label>Текст строки</label>' +
      '      <input type="text" id="room-cu-price-subline-text" class="form-control" style="max-width:600px;" placeholder="Например: Условия доставки уточняйте у менеджера" />' +
      '    </div>' +
      '    <div class="form-group" style="margin-bottom:16px;">' +
      '      <label class="d-flex align-items-center gap-2" style="cursor:pointer;">' +
      '        <input type="checkbox" id="room-cu-show-price-subline-help" /> Показывать иконку ? (справка) после текста' +
      '      </label>' +
      '    </div>' +
      '    <div class="form-group" style="margin-bottom:16px;">' +
      '      <label>Текст справки (попап при нажатии на ?)</label>' +
      '      <textarea id="room-cu-price-subline-help-text" class="form-control" rows="4" style="max-width:600px;" placeholder="Текст подсказки для пользователя"></textarea>' +
      '    </div>' +
      '    <button type="button" class="btn btn-primary" id="room-cu-save-price-subline"><i class="fa fa-save"></i> Сохранить строку под ценой</button>' +
      '  </div>' +
      '</div>';
    var first = wrapper.firstElementChild || wrapper.firstChild;
    if (first && (first.tagName === 'P' || first.tagName === 'BUTTON') && first.classList && (first.classList.contains('text-muted') || first.id === 'room2-manage-right-panel-btn')) {
      first.insertAdjacentElement('afterend', el);
    } else {
      wrapper.insertBefore(el, wrapper.firstChild);
    }
    return el;
  }

  function getDefaultPriceSubline() {
    return {
      show_price_subline: false,
      price_subline_text: '',
      show_price_subline_help_icon: false,
      price_subline_help_text: ''
    };
  }
  function getPriceSublineForStep(stepId, config) {
    if (!config || !config.steps) return getDefaultPriceSubline();
    var step = config.steps.find(function (s) { return s.stepId === stepId; });
    var ps = step && step.price_subline;
    if (!ps || typeof ps !== 'object') return getDefaultPriceSubline();
    var out = {
      show_price_subline: !!ps.show_price_subline,
      price_subline_text: typeof ps.price_subline_text === 'string' ? ps.price_subline_text : '',
      show_price_subline_help_icon: !!ps.show_price_subline_help_icon,
      price_subline_help_text: typeof ps.price_subline_help_text === 'string' ? ps.price_subline_help_text : ''
    };
    if (stepId === 4) out.price_subline_hint_text = typeof ps.price_subline_hint_text === 'string' ? ps.price_subline_hint_text : '';
    if (typeof ps.price_subline_help_title === 'string') out.price_subline_help_title = ps.price_subline_help_title;
    if (typeof ps.price_subline_modal_text === 'string') out.price_subline_modal_text = ps.price_subline_modal_text;
    return out;
  }
  function loadPriceSublineSettings() {
    var config = getRoomStepsConfig();
    if (!config) config = { steps: [] };
    var setBlock = function (wrap) {
      if (!wrap) return;
      var prefix = wrap.getAttribute('data-cu-prefix');
      var stepId = 1;
      if (prefix && /^step(\d+)$/i.test(prefix)) stepId = parseInt(RegExp.$1, 10);
      var data = getPriceSublineForStep(stepId, config);
      var cb1 = wrap.querySelector('.room2-cu-show-price-subline, #room-cu-show-price-subline');
      var cb2 = wrap.querySelector('.room2-cu-show-price-subline-help, #room-cu-show-price-subline-help');
      var t1 = wrap.querySelector('.room2-cu-price-subline-text, #room-cu-price-subline-text');
      var t2 = wrap.querySelector('.room2-cu-price-subline-help-text, #room-cu-price-subline-help-text');
      var t3 = wrap.querySelector('.room2-cu-price-subline-hint-text');
      var t4 = wrap.querySelector('.room2-cu-price-subline-help-title');
      var t5 = wrap.querySelector('.room2-cu-price-subline-modal-text');
      if (cb1) cb1.checked = !!data.show_price_subline;
      if (cb2) cb2.checked = !!data.show_price_subline_help_icon;
      if (t1) t1.value = data.price_subline_text || '';
      if (t2) t2.value = data.price_subline_help_text || '';
      if (t3 && data.price_subline_hint_text !== undefined) t3.value = data.price_subline_hint_text || '';
      if (t4 && data.price_subline_help_title !== undefined) t4.value = data.price_subline_help_title || '';
      if (t5 && data.price_subline_modal_text !== undefined) t5.value = data.price_subline_modal_text || '';
    };
    var c = getPriceSublineContainer();
    if (c) setBlock(c);
    document.querySelectorAll('.room2-price-subline-ibox').forEach(setBlock);
  }

  function getPriceSublinePayloadFromBlock(wrap) {
    if (!wrap) return null;
    var cb1 = wrap.querySelector('.room2-cu-show-price-subline, #room-cu-show-price-subline');
    var cb2 = wrap.querySelector('.room2-cu-show-price-subline-help, #room-cu-show-price-subline-help');
    var t1 = wrap.querySelector('.room2-cu-price-subline-text, #room-cu-price-subline-text');
    var t2 = wrap.querySelector('.room2-cu-price-subline-help-text, #room-cu-price-subline-help-text');
    var t3 = wrap.querySelector('.room2-cu-price-subline-hint-text');
    var t4 = wrap.querySelector('.room2-cu-price-subline-help-title');
    var t5 = wrap.querySelector('.room2-cu-price-subline-modal-text');
    var payload = {
      show_price_subline: !!(cb1 && cb1.checked),
      price_subline_text: (t1 && t1.value) ? t1.value : '',
      show_price_subline_help_icon: !!(cb2 && cb2.checked),
      price_subline_help_text: (t2 && t2.value) ? t2.value : ''
    };
    if (t3) payload.price_subline_hint_text = (t3.value || '').trim();
    if (t4) payload.price_subline_help_title = (t4.value || '').trim();
    if (t5) payload.price_subline_modal_text = (t5.value || '').trim();
    return payload;
  }
  function savePriceSublineSettings(ev) {
    var wrap = null;
    var stepId = 1;
    var btn = (ev && ev.target) ? ev.target.closest('.room2-cu-save-price-subline, #room-cu-save-price-subline') : null;
    if (btn && btn.getAttribute('data-cu-prefix')) {
      var prefix = btn.getAttribute('data-cu-prefix');
      wrap = document.querySelector('.room2-price-subline-ibox[data-cu-prefix="' + CSS.escape(prefix) + '"]');
      if (prefix && /^step(\d+)$/i.test(prefix)) stepId = parseInt(RegExp.$1, 10);
    }
    if (!wrap) {
      var c = getPriceSublineContainer();
      if (c) wrap = c;
      else wrap = document.querySelector('.room2-price-subline-ibox');
      if (wrap) {
        var p = wrap.getAttribute('data-cu-prefix');
        if (p && /^step(\d+)$/i.test(p)) stepId = parseInt(RegExp.$1, 10);
      }
    }
    var payload = getPriceSublinePayloadFromBlock(wrap);
    if (!payload) return;
    var config = getRoomStepsConfig();
    if (!config || !config.steps) config = { steps: [] };
    config = ensureStepsInConfig(config);
    var step = config.steps.find(function (s) { return s.stepId === stepId; });
    if (!step) {
      config.steps.push({ stepId: stepId, title: 'Шаг ' + stepId, items: [], columnsPerRow: 2, price_subline: payload });
    } else {
      step.price_subline = payload;
    }
    if (saveRoomStepsConfig(config)) {
      if (typeof toastr !== 'undefined') toastr.success('Настройки строки под ценой (шаг ' + stepId + ') сохранены');
      else alert('Настройки строки под ценой (шаг ' + stepId + ') сохранены');
    } else {
      if (typeof toastr !== 'undefined') toastr.error('Ошибка сохранения');
      else alert('Ошибка сохранения');
    }
  }

  function initPriceSublineBlock() {
    ensurePriceSublineCollapseStyles();
    getPriceSublineContainer();
    loadPriceSublineSettings();
    if (!document._priceSublineSaveBound) {
      document._priceSublineSaveBound = true;
      document.addEventListener('click', function (e) {
        var btn = e.target.closest('.room2-cu-save-price-subline, #room-cu-save-price-subline');
        if (btn) {
          e.preventDefault();
          savePriceSublineSettings(e);
        }
      });
    }
    // Установить начальное состояние треугольника в каждом блоке
    document.querySelectorAll('.room2-price-subline-ibox .collapse-link .collapse-triangle, .room2-step4-items-ibox .collapse-link .collapse-triangle, .room2-step4-pills-ibox .collapse-link .collapse-triangle, .room2-zone-edit-ibox .collapse-link .collapse-triangle, .room2-step5-color-tabs-ibox .collapse-link .collapse-triangle, .room2-step5-trim-edges-ibox .collapse-link .collapse-triangle, .room2-step5-wheel-ibox .collapse-link .collapse-triangle, .room2-step5-params-ibox .collapse-link .collapse-triangle').forEach(function(tri) {
      var ibox = tri.closest('.room2-price-subline-ibox, .room2-step4-items-ibox, .room2-step4-pills-ibox, .room2-zone-edit-ibox, .room2-step5-color-tabs-ibox, .room2-step5-trim-edges-ibox, .room2-step5-wheel-ibox, .room2-step5-params-ibox');
      if (ibox) tri.textContent = ibox.classList.contains('collapsed') ? '\u25B6' : '\u25B2';
    });
    // Сворачивание/разворачивание по клику на треугольник
    if (!document._priceSublineCollapseBound) {
      document._priceSublineCollapseBound = true;
      document.addEventListener('click', function (e) {
        var link = e.target.closest('.room2-price-subline-ibox .collapse-link, .room2-step4-items-ibox .collapse-link, .room2-step4-pills-ibox .collapse-link, .room2-zone-edit-ibox .collapse-link, .room2-step5-color-tabs-ibox .collapse-link, .room2-step5-trim-edges-ibox .collapse-link, .room2-step5-wheel-ibox .collapse-link, .room2-step5-params-ibox .collapse-link');
        if (link) {
          e.preventDefault();
          var ibox = link.closest('.room2-price-subline-ibox, .room2-step4-items-ibox, .room2-step4-pills-ibox, .room2-zone-edit-ibox, .room2-step5-color-tabs-ibox, .room2-step5-trim-edges-ibox, .room2-step5-wheel-ibox, .room2-step5-params-ibox');
          if (ibox) {
            ibox.classList.toggle('collapsed');
            var tri = link.querySelector('.collapse-triangle');
            if (tri) tri.textContent = ibox.classList.contains('collapsed') ? '\u25B6' : '\u25B2';
          }
        }
      });
    }
  }
  window.initPriceSublineBlock = initPriceSublineBlock;

  // ---------- Шаги комнаты ----------
  const ROOM_STEPS_CONFIG_KEY = 'room_steps_config';
  const ROOM_FURNITURE_BY_ROOM_KEY = 'room_furniture_by_room';

  function readRoomFurnitureByRoomStorage() {
    try {
      var raw = localStorage.getItem(ROOM_FURNITURE_BY_ROOM_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      var api = typeof window !== 'undefined' ? window.__cldRoomFurnitureTags : null;
      var shaped =
        api && typeof api.ensureRoomLinksShape === 'function'
          ? api.ensureRoomLinksShape(parsed)
          : parsed;
      return shaped && Object.keys(shaped).length ? shaped : null;
    } catch (e) {
      return null;
    }
  }

  function shapeRoomFurnitureLinks(links) {
    var api = typeof window !== 'undefined' ? window.__cldRoomFurnitureTags : null;
    return api && typeof api.ensureRoomLinksShape === 'function'
      ? api.ensureRoomLinksShape(links || {})
      : links || {};
  }

  function writeRoomFurnitureByRoomStorage(links, opts) {
    opts = opts || {};
    try {
      var shaped = shapeRoomFurnitureLinks(links);
      localStorage.setItem(ROOM_FURNITURE_BY_ROOM_KEY, JSON.stringify(shaped));
      if (!opts.skipServer) {
        try {
          fetch('/api/room_furniture_by_room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(shaped),
          }).catch(function () {});
        } catch (_) {}
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function rfrHydrateFromServer() {
    return fetch('/api/room_furniture_by_room')
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (data) {
        if (data && typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length) {
          writeRoomFurnitureByRoomStorage(data, { skipServer: true });
        }
      })
      .catch(function () {});
  }

  function attachRoomFurnitureToConfig(config) {
    if (!config || typeof config !== 'object') return config;
    var fromKey = readRoomFurnitureByRoomStorage();
    if (fromKey) {
      config.roomFurnitureByRoom = fromKey;
    } else if (
      config.roomFurnitureByRoom &&
      typeof config.roomFurnitureByRoom === 'object' &&
      Object.keys(config.roomFurnitureByRoom).length
    ) {
      writeRoomFurnitureByRoomStorage(config.roomFurnitureByRoom);
    }
    return config;
  }
  const DEFAULT_STEP1_ITEMS = [
    { id: '1', name: 'Гостиная', icon: 'fa-couch', image: '', key: 'living-room', categoryId: null, order: 0 },
    { id: '2', name: 'Спальня', icon: 'fa-bed', image: '', key: 'bedroom', categoryId: null, order: 1 },
    { id: '3', name: 'Детская', icon: 'fa-child', image: '', key: 'nursery', categoryId: null, order: 2 },
    { id: '4', name: 'Прихожая', icon: 'fa-door-open', image: '', key: 'hallway', categoryId: null, order: 3 },
    { id: '5', name: 'Постирочная', icon: 'fa-tshirt', image: '', key: 'laundry', categoryId: null, order: 4 },
    { id: '6', name: 'Балкон', icon: 'fa-home', image: '', key: 'balcony', categoryId: null, order: 5 }
  ];
  const DEFAULT_STEP_TITLES = {
    1: 'Тип комнаты',
    2: 'Конфигурация мебели',
    3: 'С чего начнём?',
    4: 'Модули',
    5: 'Цвет и отделка',
    6: 'Ручки',
    7: 'Наполнение',
  };
  // Шаблон раскладок для шага 2 (как в конструкторе: shape = ключ для createLayoutIcon)
  const DEFAULT_LAYOUT_ITEMS = [
    { id: 'layout-1', name: 'Верхняя стена', icon: 'shape:top-wall', key: 'top-wall', categoryId: null, order: 0 },
    { id: 'layout-2', name: 'Угловой шкаф (задняя+правая)', icon: 'shape:top-right', key: 'corner-wardrobe', categoryId: null, order: 1 },
    { id: 'layout-2b', name: 'Угловой шкаф (задняя+левая)', icon: 'shape:top-left', key: 'corner-wardrobe-left', categoryId: null, order: 2 },
    { id: 'layout-6', name: 'П-образная', icon: 'shape:top-right-bottom-partition', key: 'top-right-bottom-partition', categoryId: null, order: 3 }
  ];
  function getRoomStepsConfig() {
    try {
      const raw = localStorage.getItem(ROOM_STEPS_CONFIG_KEY);
      if (raw) {
        const c = JSON.parse(raw);
        if (c && c.steps && c.steps.length) return attachRoomFurnitureToConfig(c);
      }
    } catch (e) {}
    var fallback = {
      steps: [
        { stepId: 1, title: 'Тип комнаты', items: DEFAULT_STEP1_ITEMS.map((it, i) => ({ ...it, order: i })), columnsPerRow: 2 },
        { stepId: 2, title: 'Конфигурация мебели', items: [], columnsPerRow: 2 },
        { stepId: 3, title: 'С чего начнём?', items: [], columnsPerRow: 2 }
      ]
    };
    return attachRoomFurnitureToConfig(fallback);
  }
  function ensureStepsInConfig(config) {
    [1, 2, 3, 4, 5, 6, 7].forEach(function(stepId) {
      var existing = config.steps.find(function(s) { return s.stepId === stepId; });
      if (!existing) {
        config.steps.push({ stepId: stepId, title: DEFAULT_STEP_TITLES[stepId] || 'Шаг ' + stepId, items: [], columnsPerRow: 2, price_subline: getDefaultPriceSubline() });
      } else {
        if (!existing.price_subline || typeof existing.price_subline !== 'object') {
          existing.price_subline = getDefaultPriceSubline();
        }
        if (stepId === 2) {
          var t = (existing.title || '').trim();
          if (!t || t === 'Тип комнаты' || t === 'ТИП КОМНАТЫ') {
            existing.title = DEFAULT_STEP_TITLES[2];
          }
        } else if (stepId === 3) {
          var t3 = (existing.title || '').trim();
          if (
            !t3 ||
            t3 === 'Шаг 3' ||
            t3 === 'Каталог' ||
            t3 === 'КАТАЛОГ' ||
            t3 === 'Выберите тип мебели'
          ) {
            existing.title = DEFAULT_STEP_TITLES[3];
          }
        } else if (stepId === 4) {
          var t4 = (existing.title || '').trim();
          if (!t4) existing.title = DEFAULT_STEP_TITLES[4];
          if (!Array.isArray(existing.moduleItems)) existing.moduleItems = [];
        } else if (stepId === 6) {
          var t6 = (existing.title || '').trim();
          if (!t6) existing.title = DEFAULT_STEP_TITLES[6];
        } else if (stepId === 7) {
          var t7 = (existing.title || '').trim();
          if (!t7) existing.title = DEFAULT_STEP_TITLES[7];
        }
      }
    });
    return config;
  }
  function saveRoomStepsConfig(config) {
    try {
      if (config && config.roomFurnitureByRoom) {
        writeRoomFurnitureByRoomStorage(config.roomFurnitureByRoom);
      }
      localStorage.setItem(ROOM_STEPS_CONFIG_KEY, JSON.stringify(config));
      try {
        fetch('/api/room_steps_config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        }).catch(function () {});
      } catch (_) {}
      return true;
    } catch (e) { return false; }
  }
  window.__cldAdminGetRoomStepsConfig = getRoomStepsConfig;
  window.__cldAdminSaveRoomStepsConfig = saveRoomStepsConfig;
  function hydrateRoomStepsConfigFromServer() {
    var pillApi =
      typeof ClodisRoomStep4PillSets !== 'undefined' ? ClodisRoomStep4PillSets : null;
    var localRaw = null;
    try {
      localRaw = localStorage.getItem(ROOM_STEPS_CONFIG_KEY);
    } catch (_) {}
    var local = null;
    try {
      local = localRaw ? JSON.parse(localRaw) : null;
    } catch (_) {}
    return fetch('/api/room_steps_config?ts=' + Date.now(), { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function (data) {
        if (!data || !Array.isArray(data.steps) || data.steps.length === 0) {
          return null;
        }
        var localPills = pillApi && local ? pillApi.countStep4PillsInConfig(local) : 0;
        var serverPills = pillApi ? pillApi.countStep4PillsInConfig(data) : 0;
        if (localPills > serverPills) {
          console.warn(
            '[room-steps] localStorage содержит больше pillSets (' +
              localPills +
              ' vs ' +
              serverPills +
              ') — сервер не перезаписывает localStorage'
          );
          // Шаг 2 (раскладки) всё же берём с API — иначе удаления в конфиге не видны в админке.
          try {
            var kept = JSON.parse(JSON.stringify(local));
            var srvStep2 =
              data.steps &&
              data.steps.find(function (s) {
                return s.stepId === 2;
              });
            var locStep2 =
              kept.steps &&
              kept.steps.find(function (s) {
                return s.stepId === 2;
              });
            if (srvStep2 && locStep2 && Array.isArray(srvStep2.items)) {
              locStep2.items = srvStep2.items;
              if (srvStep2.title) locStep2.title = srvStep2.title;
              if (srvStep2.columnsPerRow != null) {
                locStep2.columnsPerRow = srvStep2.columnsPerRow;
              }
              localStorage.setItem(ROOM_STEPS_CONFIG_KEY, JSON.stringify(kept));
              return kept;
            }
          } catch (_) {}
          return local;
        }
        var trimReg =
          typeof window !== 'undefined' && window.__cldTrimPartRegistry
            ? window.__cldTrimPartRegistry
            : null;
        var merged =
          trimReg && typeof trimReg.mergeRoomStepsConfigPreservingLocal === 'function'
            ? trimReg.mergeRoomStepsConfigPreservingLocal(data, local)
            : data;
        if (trimReg && typeof trimReg.writeRoomStepsConfig === 'function') {
          trimReg.writeRoomStepsConfig(merged);
        } else {
          localStorage.setItem(ROOM_STEPS_CONFIG_KEY, JSON.stringify(merged));
        }
        return merged;
      })
      .catch(function () {
        return null;
      });
  }
  function getCurrentStepId() {
    var el = document.getElementById('room-step-current-id');
    return el ? parseInt(el.value, 10) || 1 : 1;
  }
  function setCurrentStepId(stepId) {
    var el = document.getElementById('room-step-current-id');
    if (el) el.value = String(stepId);
  }
  function refreshRoomStepTabs(config) {
    var ul = document.getElementById('room-step-tabs');
    if (!ul || !config || !config.steps) return;
    var currentId = getCurrentStepId();
    ul.innerHTML = config.steps.sort(function(a, b) { return a.stepId - b.stepId; }).map(function(s) {
      var title = (s.title || 'Шаг ' + s.stepId).replace(/</g, '&lt;');
      var active = s.stepId === currentId ? ' active' : '';
      return '<li class="nav-item"><a class="nav-link room-step-tab' + active + '" href="#" data-step-id="' + s.stepId + '" role="tab">Шаг ' + s.stepId + ': ' + title + '</a></li>';
    }).join('');
  }
  function renderRoomStepsSummary() {
    var el = document.getElementById('room-steps-summary-text');
    if (!el) return;
    try {
      var config = getRoomStepsConfig();
      if (!config || !config.steps || config.steps.length === 0) {
        el.textContent = 'Нет сохранённых шагов. Добавьте пункты и нажмите «Сохранить шаги комнаты».';
        return;
      }
      var parts = [];
      config.steps.sort(function(a, b) { return a.stepId - b.stepId; }).forEach(function(s) {
        var items = Array.isArray(s.items) ? s.items : [];
        var names = items.sort(function(a, b) { return (a.order || 0) - (b.order || 0); }).map(function(it) { return it.name || '—'; });
        var title = (s.title || 'Шаг ' + s.stepId);
        if (names.length === 0) {
          parts.push('Шаг ' + s.stepId + ' (' + title + '): 0 шт.');
        } else {
          parts.push('Шаг ' + s.stepId + ' (' + title + '): ' + names.join(', ') + ' — ' + names.length + ' шт.');
        }
      });
      el.textContent = parts.join('  |  ');
    } catch (e) {
      el.textContent = 'Ошибка загрузки списка. Добавьте пункты ниже и нажмите «Сохранить шаги комнаты».';
    }
  }
  function buildStepItemHtml(it, idx, opts) {
    opts = opts || {};
    var iconVal = (it.icon || '').trim();
    var imageVal = (it.image || '').trim();
    var isShape = iconVal.indexOf('shape:') === 0;
    var isImg = !isShape && (/^https?:\/\//i.test(iconVal) || iconVal.startsWith('/'));
    var previewSrc = opts.includeImage && imageVal && imageVal.charAt(0) === '/' ? imageVal : '';
    var preview = previewSrc
      ? '<img src="' + previewSrc.replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline-block\';"><i class="fa fa-image" style="display:none;font-size:24px;color:#999;"></i>'
      : isImg
      ? '<img src="' + iconVal.replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:contain;border-radius:6px;" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline-block\';"><i class="fa fa-image" style="display:none;font-size:24px;color:#999;"></i>'
      : isShape
        ? '<span class="text-muted" style="font-size:11px;">схема</span>'
        : '<i class="fa ' + (iconVal || 'fa-circle').replace(/"/g, '') + '" style="font-size:28px;color:#333;"></i>';
    var imageRow = opts.includeImage
      ? '<div class="d-flex align-items-center flex-wrap gap-2 mt-2">' +
        '<span class="text-muted" style="font-size:12px;width:56px;flex-shrink:0;">Фото</span>' +
        '<input type="text" class="form-control form-control-sm room-step-image" placeholder="Путь к фото (/files/…)" value="' + (imageVal || '').replace(/"/g, '&quot;').replace(/</g, '&lt;') + '" style="width:220px;" title="Фотография карточки в конструкторе">' +
        '<button type="button" class="btn btn-sm btn-outline-secondary room-step-image-upload-btn" title="Загрузить фото карточки"><i class="fa fa-image"></i> Фото карточки</button>' +
        '</div>'
      : '';
    return '<div class="room-step-item border-bottom pb-2 mb-2" data-id="' + (it.id || idx).toString().replace(/"/g, '&quot;') + '">' +
      '<div class="d-flex align-items-center flex-wrap gap-2">' +
      '<div class="room-step-preview" style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;background:#fff;border:1px solid #ddd;border-radius:8px;flex-shrink:0;">' + preview + '</div>' +
      '<input type="text" class="form-control form-control-sm room-step-name" placeholder="Название" value="' + (it.name || '').replace(/"/g, '&quot;').replace(/</g, '&lt;') + '" style="width:130px;">' +
      '<input type="text" class="form-control form-control-sm room-step-icon" placeholder="fa-couch или URL" value="' + (iconVal || '').replace(/"/g, '&quot;').replace(/</g, '&lt;') + '" style="width:180px;">' +
      '<button type="button" class="btn btn-sm btn-outline-secondary room-step-upload-btn" title="Загрузить картинку"><i class="fa fa-upload"></i> Загрузить</button>' +
      '<input type="text" class="form-control form-control-sm room-step-key" placeholder="Ключ" value="' + (it.key || '').replace(/"/g, '&quot;').replace(/</g, '&lt;') + '" style="width:100px;">' +
      '<select class="form-control form-control-sm room-step-category" style="width:130px;"><option value="">— Категория —</option></select>' +
      '<input type="number" class="form-control form-control-sm room-step-order" placeholder="0" value="' + (it.order ?? idx) + '" style="width:50px;">' +
      '<button type="button" class="btn btn-sm btn-outline-danger room-step-del" title="Удалить"><i class="fa fa-trash"></i></button>' +
      '</div>' + imageRow + '</div>';
  }
  function updateRoomStepItemsCount() {
    var container = document.getElementById('room-step-items');
    var countEl = document.getElementById('room-step-items-count');
    if (countEl && container) countEl.textContent = container.querySelectorAll('.room-step-item').length;
  }
  function bindStepItemEvents(container) {
    if (!container) return;
    container.querySelectorAll('.room-step-del').forEach(function(btn) {
      btn.addEventListener('click', function() {
        this.closest('.room-step-item')?.remove();
        updateRoomStepItemsCount();
      });
    });
    container.querySelectorAll('.room-step-icon').forEach(function(input) {
      input.addEventListener('input', function() {
        var itemEl = this.closest('.room-step-item');
        var prev = itemEl?.querySelector('.room-step-preview');
        if (!prev) return;
        var v = this.value.trim();
        var isShape = v.indexOf('shape:') === 0;
        var isImg = !isShape && (/^https?:\/\//i.test(v) || v.startsWith('/'));
        if (isImg) prev.innerHTML = '<img src="' + v.replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:contain;border-radius:6px;" onerror="this.style.display=\'none\';"><i class="fa fa-image" style="font-size:24px;color:#999;"></i>';
        else if (isShape) prev.innerHTML = '<span class="text-muted" style="font-size:11px;">схема</span>';
        else prev.innerHTML = '<i class="fa ' + (v || 'fa-circle') + '" style="font-size:28px;color:#333;"></i>';
      });
    });
    container.querySelectorAll('.room-step-upload-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var row = this.closest('.room-step-item');
        var iconInput = row ? row.querySelector('.room-step-icon') : null;
        var prev = row ? row.querySelector('.room-step-preview') : null;
        if (!iconInput) return;
        if (typeof window.openFileManager === 'function') {
          window.openFileManager({
            allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
            initialPath: 'room_icons',
            onSelect: function(r) {
              if (r && r.url && iconInput) {
                iconInput.value = r.url;
                iconInput.dispatchEvent(new Event('input', { bubbles: true }));
                if (prev) prev.innerHTML = '<img src="' + (r.url || '').replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:contain;border-radius:6px;">';
              }
            }
          });
        } else if (window.toastr) {
          window.toastr.warning('Файловый менеджер не загружен. Обновите страницу.');
        } else {
          alert('Файловый менеджер недоступен. Обновите страницу.');
        }
      });
    });
  }
  var CATEGORIES_SOURCE_TYPE = 'catalog_26';
  async function fetchCategoriesForSteps() {
    try {
      var res = await fetch('/api/catalog/categories_get/' + encodeURIComponent(CATEGORIES_SOURCE_TYPE));
      var cats = await res.json();
      return Array.isArray(cats) ? cats : [];
    } catch (e) { return []; }
  }
  async function fetchCatalogTypesForStep3() {
    try {
      var res = await fetch('/api/catalog/items_get/catalogs_keys');
      var types = await res.json();
      return Array.isArray(types) ? types : [];
    } catch (e) { return []; }
  }
  async function populateCategorySelect(selectEl, rowEl, stepId) {
    if (!selectEl) return;
    var cfg = getRoomStepsConfig();
    var tax = getRoomFurnitureTaxonomyFromConfig(cfg);
    var arr;
    var label;
    var useTaxonomy = false;
    if (stepId === 1 && tax.rooms.length) {
      arr = tax.rooms;
      label = '— Категория комнаты —';
      useTaxonomy = true;
    } else if (stepId === 2 && tax.layouts.length) {
      arr = tax.layouts;
      label = '— Раскладка —';
      useTaxonomy = true;
    } else if (stepId === 3 && tax.catalogFolders.length) {
      arr = tax.catalogFolders;
      label = '— Раздел каталога —';
      useTaxonomy = true;
    } else if (stepId === 3) {
      arr = await fetchCatalogTypesForStep3();
      label = '— Тип каталога —';
    } else {
      arr = await fetchCategoriesForSteps();
      label = '— Категория —';
    }
    if (useTaxonomy) {
      selectEl.innerHTML =
        '<option value="">' + label + '</option>' +
        arr.map(function (c) {
          var k = String(c.key || '').replace(/"/g, '&quot;');
          var n = String(c.label || c.key || '').replace(/</g, '&lt;').replace(/"/g, '&quot;');
          return (
            '<option value="' + k + '" data-name="' + n + '" data-tax-key="' + k + '">' + n + '</option>'
          );
        }).join('');
    } else if (stepId === 3) {
      selectEl.innerHTML =
        '<option value="">' + label + '</option>' +
        arr.map(function (c) {
          var id = c.id != null ? c.id : c.key ? c.key.replace(/^catalog_/, '') : '';
          var name = (c.name || '').replace(/</g, '&lt;').replace(/"/g, '&quot;');
          return '<option value="' + id + '" data-name="' + name + '">' + name + '</option>';
        }).join('');
    } else {
      selectEl.innerHTML =
        '<option value="">' + label + '</option>' +
        arr.map(function (c) {
          return (
            '<option value="' +
            c.id +
            '" data-name="' +
            (c.name || '').replace(/</g, '&lt;').replace(/"/g, '&quot;') +
            '">' +
            (c.name || '').replace(/</g, '&lt;') +
            '</option>'
          );
        }).join('');
    }
    if (rowEl && stepId) {
      selectEl._roomStepId = stepId;
      selectEl._roomRowEl = rowEl;
      selectEl.removeEventListener('change', _onCategorySelectChange);
      selectEl.addEventListener('change', _onCategorySelectChange);
    }
  }
  function _onCategorySelectChange() {
    var sel = this;
    var opt = sel.options[sel.selectedIndex];
    if (!opt || !opt.value) return;
    var row = sel._roomRowEl;
    if (!row) return;
    var nameInp = row.querySelector('.room-step-name');
    var keyInp = row.querySelector('.room-step-key');
    if (nameInp && (!nameInp.value || !nameInp.value.trim())) {
      nameInp.value = (opt.getAttribute('data-name') || opt.textContent || '').trim();
    }
    if (keyInp) {
      var taxKey = opt.getAttribute('data-tax-key');
      if (taxKey) {
        keyInp.value = taxKey;
      } else if (sel._roomStepId === 3) {
        keyInp.value = String(opt.value);
      } else if (!keyInp.value || !keyInp.value.trim()) {
        keyInp.value = 'cat_' + opt.value;
      }
    }
  }
  async function loadCategoriesIntoStepItems(container, items, stepId) {
    if (!container) return;
    var cfg = getRoomStepsConfig();
    var tax = getRoomFurnitureTaxonomyFromConfig(cfg);
    var useTax =
      (stepId === 1 && tax.rooms.length) || (stepId === 2 && tax.layouts.length);
    var arr = useTax ? (stepId === 1 ? tax.rooms : tax.layouts) : await fetchCategoriesForSteps();
    var sorted = (items || []).slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    container.querySelectorAll('.room-step-item').forEach(function (row, idx) {
      var sel = row.querySelector('.room-step-category');
      var keyInp = row.querySelector('.room-step-key');
      var it = sorted[idx];
      if (!sel) return;
      if (useTax) {
        sel.innerHTML =
          '<option value="">— Категория —</option>' +
          arr.map(function (c) {
            var k = String(c.key || '');
            return (
              '<option value="' +
              k.replace(/"/g, '&quot;') +
              '" data-name="' +
              String(c.label || k).replace(/"/g, '&quot;') +
              '" data-tax-key="' +
              k.replace(/"/g, '&quot;') +
              '">' +
              String(c.label || k).replace(/</g, '&lt;') +
              '</option>'
            );
          }).join('');
        if (it && it.key) {
          sel.value = String(it.key);
        }
        if (keyInp && sel.value) keyInp.value = sel.value;
      } else {
        sel.innerHTML =
          '<option value="">— Категория —</option>' +
          arr.map(function (c) {
            return (
              '<option value="' +
              c.id +
              '">' +
              (c.name || '').replace(/</g, '&lt;') +
              '</option>'
            );
          }).join('');
        if (it && it.categoryId) sel.value = String(it.categoryId);
      }
    });
  }
  async function loadCatalogTypesIntoStep3Items(container, items) {
    if (!container) return;
    var cfg = getRoomStepsConfig();
    var tax = getRoomFurnitureTaxonomyFromConfig(cfg);
    var useTax = tax.catalogFolders.length > 0;
    var arr = useTax ? tax.catalogFolders : await fetchCatalogTypesForStep3();
    var sorted = (items || []).slice().sort(function(a, b) { return (a.order || 0) - (b.order || 0); });
    var validIds = useTax
      ? arr.map(function (c) { return String(c.key || ''); })
      : arr.map(function (c) {
          return String(c.id != null ? c.id : c.key ? c.key.replace(/^catalog_/, '') : '');
        });
    container.querySelectorAll('.room-step-item').forEach(function (row, idx) {
      var sel = row.querySelector('.room-step-category');
      var keyInp = row.querySelector('.room-step-key');
      var nameInp = row.querySelector('.room-step-name');
      var it = sorted[idx];
      if (!sel) return;
      if (useTax) {
        sel.innerHTML =
          '<option value="">— Раздел каталога —</option>' +
          arr.map(function (c) {
            var k = String(c.key || '');
            var n = String(c.label || k).replace(/</g, '&lt;').replace(/"/g, '&quot;');
            return (
              '<option value="' +
              k.replace(/"/g, '&quot;') +
              '" data-name="' +
              n +
              '" data-tax-key="' +
              k.replace(/"/g, '&quot;') +
              '">' +
              n +
              '</option>'
            );
          }).join('');
      } else {
        sel.innerHTML =
          '<option value="">— Тип каталога —</option>' +
          arr.map(function (c) {
            var id = c.id != null ? c.id : c.key ? c.key.replace(/^catalog_/, '') : '';
            return (
              '<option value="' +
              id +
              '" data-name="' +
              (c.name || '').replace(/</g, '&lt;').replace(/"/g, '&quot;') +
              '">' +
              (c.name || '').replace(/</g, '&lt;') +
              '</option>'
            );
          }).join('');
      }
      sel._roomStepId = 3;
      sel._roomRowEl = row;
      sel.removeEventListener('change', _onCategorySelectChange);
      sel.addEventListener('change', _onCategorySelectChange);
      var keyNum = (it && it.key) ? String(it.key).replace(/^catalog_/, '') : '';
      var name = (it && it.name) ? String(it.name).trim().toLowerCase() : '';
      if (keyNum && validIds.indexOf(keyNum) >= 0) {
        sel.value = keyNum;
      } else {
        var byName = arr.find(function (c) {
          var n = String((useTax ? c.label : c.name) || '')
            .trim()
            .toLowerCase();
          return n && name && n === name;
        });
        if (byName) {
          var id = useTax
            ? String(byName.key || '')
            : String(
                byName.id != null ? byName.id : byName.key ? byName.key.replace(/^catalog_/, '') : ''
              );
          sel.value = String(id);
          if (keyInp) keyInp.value = String(id);
        } else if (it && it.categoryId) {
          var catIdStr = String(it.categoryId);
          if (validIds.indexOf(catIdStr) >= 0) {
            sel.value = catIdStr;
            if (keyInp) keyInp.value = catIdStr;
          }
        }
      }
      if (keyInp && sel.value) keyInp.value = sel.value;
    });
  }
  function saveCurrentStepToConfig(stepIdToSave) {
    var config = getRoomStepsConfig();
    var stepId = (stepIdToSave !== undefined && stepIdToSave !== null) ? stepIdToSave : getCurrentStepId();
    var step = config.steps.find(function(s) { return s.stepId === stepId; });
    if (!step) return config;
    var titleEl = document.getElementById('room-step-title-input');
    var colsEl = document.getElementById('room-step-columns');
    var container = document.getElementById('room-step-items');
    step.title = (titleEl && titleEl.value) ? titleEl.value.trim() : (step.title || 'Шаг ' + stepId);
    step.columnsPerRow = colsEl && colsEl.value ? Math.max(1, Math.min(3, parseInt(colsEl.value, 10) || 2)) : 2;
    var prevItems = Array.isArray(step.items) ? step.items.slice() : [];
    step.items = [];
    if (container) {
      container.querySelectorAll('.room-step-item').forEach(function(row, idx) {
        var name = (row.querySelector('.room-step-name') && row.querySelector('.room-step-name').value || '').trim();
        var icon = (row.querySelector('.room-step-icon') && row.querySelector('.room-step-icon').value || '').trim();
        var key = (row.querySelector('.room-step-key') && row.querySelector('.room-step-key').value || '').trim();
        var cat = row.querySelector('.room-step-category') ? row.querySelector('.room-step-category').value : '';
        var order = parseInt((row.querySelector('.room-step-order') && row.querySelector('.room-step-order').value) || '0', 10);
        var imageEl = row.querySelector('.room-step-image');
        var rowId = row.getAttribute('data-id') || 'i' + idx;
        var prev = prevItems.find(function (p) { return p && String(p.id) === String(rowId); });
        step.items.push({
          id: rowId,
          name: name || 'Пункт ' + (idx + 1),
          icon: icon || 'fa-circle',
          image: imageEl ? (imageEl.value || '').trim() : ((prev && prev.image) || ''),
          key: key || 'item-' + idx,
          categoryId: cat && /^\d+$/.test(String(cat)) ? parseInt(cat, 10) : null,
          order: order,
        });
      });
    }
    return config;
  }
  async function renderStepPanel(stepId) {
    var config = getRoomStepsConfig();
    config = ensureStepsInConfig(config);
    var step = config.steps.find(function(s) { return s.stepId === stepId; }) || config.steps[0];
    var titleEl = document.getElementById('room-step-title-input');
    var colsEl = document.getElementById('room-step-columns');
    var container = document.getElementById('room-step-items');
    if (!container) return;
    if (titleEl) titleEl.value = step.title || ('Шаг ' + stepId);
    if (colsEl) colsEl.value = String(step.columnsPerRow && step.columnsPerRow >= 1 && step.columnsPerRow <= 3 ? step.columnsPerRow : 2);
    var items = Array.isArray(step.items) ? step.items : [];
    container.innerHTML = items.length === 0
      ? '<div class="text-muted p-2">Нет иконок. Нажмите «Добавить иконку».</div>'
      : items.sort(function(a, b) { return (a.order || 0) - (b.order || 0); }).map(function(it, idx) { return buildStepItemHtml(it, idx); }).join('');
    bindStepItemEvents(container);
    var countEl = document.getElementById('room-step-items-count');
    if (countEl) countEl.textContent = items.length;
    if (items.length > 0) await loadCategoriesIntoStepItems(container, items, stepId);
    setCurrentStepId(stepId);
    document.querySelectorAll('.room-step-tab').forEach(function(a) {
      a.classList.remove('active');
      if (parseInt(a.getAttribute('data-step-id'), 10) === stepId) a.classList.add('active');
    });
    if (stepId === 2) {
      var addBtn = document.getElementById('room-step-add-btn');
      var fillBtn = document.getElementById('room-step-fill-layouts-btn');
      if (!fillBtn && addBtn) {
        fillBtn = document.createElement('button');
        fillBtn.type = 'button';
        fillBtn.id = 'room-step-fill-layouts-btn';
        fillBtn.className = 'btn btn-outline-secondary btn-sm mr-2';
        fillBtn.innerHTML = '<i class="fa fa-th-large"></i> Заполнить из шаблона раскладок';
        fillBtn.title = 'Добавить в шаг 2 список раскладок как в конструкторе (Верхняя стена, Верхняя и правая и т.д.)';
        addBtn.parentNode.insertBefore(fillBtn, addBtn);
        fillBtn.addEventListener('click', function() {
          var cfg = saveCurrentStepToConfig(2);
          var step2 = cfg.steps.find(function(s) { return s.stepId === 2; });
          if (step2) {
            step2.items = DEFAULT_LAYOUT_ITEMS.map(function(it, i) { return { id: it.id, name: it.name, icon: it.icon, key: it.key, categoryId: null, order: i }; });
            saveRoomStepsConfig(cfg);
            renderStepPanel(2).then(renderRoomStepsSummary);
            renderRoomStepsSummary();
            if (typeof toastr !== 'undefined') toastr.success('Шаг 2 заполнен шаблоном раскладок');
            else alert('Шаг 2 заполнен шаблоном раскладок');
          }
        });
      }
      if (fillBtn) fillBtn.style.display = '';
    } else {
      var hideBtn = document.getElementById('room-step-fill-layouts-btn');
      if (hideBtn) hideBtn.style.display = 'none';
    }
  }
  function onRoomStepTabClick(e) {
    e.preventDefault();
    var tab = e.target.closest('.room-step-tab');
    if (!tab) return;
    var newStepId = parseInt(tab.getAttribute('data-step-id'), 10) || 1;
    var previousStepId = getCurrentStepId();
    if (newStepId === previousStepId) return;
    var config = saveCurrentStepToConfig(previousStepId);
    saveRoomStepsConfig(config);
    setCurrentStepId(newStepId);
    document.querySelectorAll('.room-step-tab').forEach(function(a) {
      a.classList.remove('active');
      if (parseInt(a.getAttribute('data-step-id'), 10) === newStepId) a.classList.add('active');
    });
    renderStepPanel(newStepId).then(function() { renderRoomStepsSummary(); });
    renderRoomStepsSummary();
  }
  async function loadRoomStepsUI() {
    await hydrateRoomStepsConfigFromServer();
    var config = getRoomStepsConfig();
    config = ensureStepsInConfig(config);
    var step4 = config.steps.find(function (s) { return s.stepId === 4; });
    var pillApi = getStep4PillSetsApi();
    if (step4 && pillApi && pillApi.recoverStep4PillSetAliases(step4, config)) {
      saveRoomStepsConfig(config);
    }
    if (step4 && pillApi && pillApi.seedDefaultStep4PillSetsIfEmpty(step4, config)) {
      saveRoomStepsConfig(config);
    }
    setCurrentStepId(1);
    refreshRoomStepTabs(config);
    var tabsWrap = document.getElementById('room-step-tabs');
    if (tabsWrap) {
      tabsWrap.addEventListener('click', function(e) {
        if (e.target.closest('.room-step-tab')) onRoomStepTabClick(e);
      });
    }
    await renderStepPanel(1);
    renderRoomStepsSummary();
  }
  (function() {
    const uploadInput = document.getElementById('room-step-icon-upload-input');
    if (uploadInput) {
      uploadInput.addEventListener('change', function() {
        const target = window._roomStepUploadTarget;
        window._roomStepUploadTarget = null;
        const file = this.files && this.files[0];
        if (!file || !target) { this.value = ''; return; }
        const fd = new FormData();
        fd.append('file', file);
        var inputEl = this;
        fetch('/api/upload/room_icon', { method: 'POST', body: fd })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            inputEl.value = '';
            if (data.files && data.files[0] && data.files[0].url) {
              target.value = data.files[0].url;
              target.dispatchEvent(new Event('input', { bubbles: true }));
              if (typeof toastr !== 'undefined') toastr.success('Картинка загружена');
            } else if (typeof toastr !== 'undefined') toastr.error(data.error || 'Ошибка загрузки');
          })
          .catch(function(err) {
            inputEl.value = '';
            if (typeof toastr !== 'undefined') toastr.error('Ошибка загрузки');
          });
      });
    }
  })();
  function saveRoomSteps() {
    var config = saveCurrentStepToConfig();
    if (saveRoomStepsConfig(config)) {
      if (typeof toastr !== 'undefined') toastr.success('Шаги комнаты сохранены');
      else alert('Шаги комнаты сохранены');
      refreshRoomStepTabs(config);
      renderRoomStepsSummary();
    } else {
      if (typeof toastr !== 'undefined') toastr.error('Ошибка сохранения');
      else alert('Ошибка сохранения');
    }
  }
  window.getRoomStepsConfig = getRoomStepsConfig;
  window.saveRoomStepsConfig = saveRoomStepsConfig;
  window.loadRoomStepsUI = loadRoomStepsUI;
  window.saveRoomSteps = saveRoomSteps;
  window.updateRoomStepItemsCount = updateRoomStepItemsCount;
  window.renderRoomStepsSummary = renderRoomStepsSummary;

  function bindRoomStepAddBtn() {
    var addBtn = document.getElementById('room-step-add-btn');
    if (!addBtn || addBtn._roomBound) return;
    addBtn._roomBound = true;
    addBtn.addEventListener('click', function() {
      var container = document.getElementById('room-step-items');
      if (!container) return;
      var firstMuted = container.querySelector('.text-muted');
      if (firstMuted) firstMuted.remove();
      var id = 'i' + Date.now();
      var newRow = document.createElement('div');
      newRow.className = 'room-step-item border-bottom pb-2 mb-2';
      newRow.setAttribute('data-id', id);
      newRow.innerHTML = '<div class="d-flex align-items-center flex-wrap gap-2">' +
        '<div class="room-step-preview" style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;background:#fff;border:1px solid #ddd;border-radius:8px;"><i class="fa fa-circle" style="font-size:28px;color:#333;"></i></div>' +
        '<input type="text" class="form-control form-control-sm room-step-name" placeholder="Название" style="width:130px">' +
        '<input type="text" class="form-control form-control-sm room-step-icon" placeholder="fa-couch или URL" value="fa-circle" style="width:180px">' +
        '<button type="button" class="btn btn-sm btn-outline-secondary room-step-upload-btn" title="Загрузить картинку"><i class="fa fa-upload"></i> Загрузить</button>' +
        '<input type="text" class="form-control form-control-sm room-step-key" placeholder="Ключ" style="width:100px">' +
        '<select class="form-control form-control-sm room-step-category" style="width:130px"><option value="">— Категория —</option></select>' +
        '<input type="number" class="form-control form-control-sm room-step-order" value="0" style="width:50px">' +
        '<button type="button" class="btn btn-sm btn-outline-danger room-step-del" title="Удалить"><i class="fa fa-trash"></i></button>' +
        '</div>';
      container.appendChild(newRow);
      newRow.querySelector('.room-step-del').addEventListener('click', function() { newRow.remove(); updateRoomStepItemsCount(); });
      var uploadBtn = newRow.querySelector('.room-step-upload-btn');
      if (uploadBtn) uploadBtn.addEventListener('click', function() {
        var iconInput = newRow.querySelector('.room-step-icon');
        var prev = newRow.querySelector('.room-step-preview');
        if (!iconInput) return;
        if (typeof window.openFileManager === 'function') {
          window.openFileManager({
            allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
            initialPath: 'room_icons',
            onSelect: function(r) {
              if (r && r.url && iconInput) {
                iconInput.value = r.url;
                iconInput.dispatchEvent(new Event('input', { bubbles: true }));
                if (prev) prev.innerHTML = '<img src="' + (r.url || '').replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:contain;border-radius:6px;">';
              }
            }
          });
        } else if (window.toastr) window.toastr.warning('Файловый менеджер не загружен.');
        else alert('Файловый менеджер недоступен.');
      });
      newRow.querySelector('.room-step-icon').addEventListener('input', function() {
        var v = this.value.trim();
        var isImg = /^https?:\/\//i.test(v) || v.startsWith('/');
        var isShape = v.indexOf('shape:') === 0;
        var prev = newRow.querySelector('.room-step-preview');
        if (!prev) return;
        if (isImg) prev.innerHTML = '<img src="' + v.replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:contain;border-radius:6px;" onerror="this.style.display=\'none\';"><i class="fa fa-image" style="font-size:24px;color:#999;"></i>';
        else if (isShape) prev.innerHTML = '<span class="text-muted" style="font-size:11px;">схема</span>';
        else prev.innerHTML = '<i class="fa ' + (v || 'fa-circle') + '" style="font-size:28px;color:#333;"></i>';
      });
      populateCategorySelect(newRow.querySelector('.room-step-category'), newRow, getCurrentStepId());
      updateRoomStepItemsCount();
    });
  }
  function bindRoomStepsSaveBtn() {
    var btn = document.getElementById('room-steps-save-btn');
    if (!btn || btn._roomBound) return;
    btn._roomBound = true;
    btn.addEventListener('click', saveRoomSteps);
  }
  function bindRoomSettingsSaveBtn() {
    var btn = document.getElementById('room-settings-save-btn');
    if (!btn || btn._roomBound) return;
    btn._roomBound = true;
    btn.addEventListener('click', saveRoomSettings);
  }
  function initRoomButtons() {
    var isRoomManagementPage = /admin-room-management\.html/i.test(window.location.pathname || window.location.href || '');
    if (!isRoomManagementPage) return;
    bindRoomStepAddBtn();
    bindRoomStepsSaveBtn();
    bindRoomSettingsSaveBtn();
  }
  var ROOM2_PAGES = ['room2-right-panel-page', 'room2-obklad', 'room2-placement-kinds', 'room2-furniture-tags', 'room2-room-edit', 'room2-step-1', 'room2-step-2', 'room2-step-3', 'room2-step-4', 'room2-step-5', 'room2-step-6', 'room2-step-7', 'room2-step-8', 'room2-step-9'];

  var room2PkProfilesState = [];
  var room2PkActiveIdx = -1;

  var PK_GEAR_SVG =
    '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96a7.02 7.02 0 0 0-1.63-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.22-1.13.53-1.63.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.41 1.04.72 1.63.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.22 1.13-.52 1.63-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 15.6 12 3.6 3.6 0 0 1 12 15.6z"/></svg>';

  var PK_TRASH_SVG =
    '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM7 9h2v9H7V9z"/></svg>';

  function pkApi() {
    return typeof window !== 'undefined' ? window.__cldPlacementKindProfiles : null;
  }

  function getDefaultPlacementKindProfiles() {
    var api = pkApi();
    if (api && typeof api.getDefaultPlacementKindProfiles === 'function') {
      return JSON.parse(JSON.stringify(api.getDefaultPlacementKindProfiles()));
    }
    return [
      { id: 'floor_in_niche', label: 'Шкаф в нише', baseKind: 'floor_in_niche', settings: {} },
      { id: 'standalone_floor', label: 'Тумба напольная', baseKind: 'standalone_floor', settings: {} },
      { id: 'wall_hung', label: 'Навесной модуль', baseKind: 'wall_hung', settings: {} },
      { id: 'corpus_only', label: 'Только корпус', baseKind: 'corpus_only', settings: {} },
    ];
  }

  function ensurePlacementKindProfilesInConfig(config) {
    config.placementKindProfiles = Array.isArray(config.placementKindProfiles)
      ? config.placementKindProfiles
      : null;
    if (!Array.isArray(config.placementKindProfiles) || config.placementKindProfiles.length === 0) {
      config.placementKindProfiles = getDefaultPlacementKindProfiles();
    } else {
      var api = pkApi();
      if (api && typeof api.ensureSystemPlacementKindProfiles === 'function') {
        config.placementKindProfiles = api.ensureSystemPlacementKindProfiles(
          config.placementKindProfiles
        );
      }
    }
    return config;
  }

  function pkBaseLabel(baseKind) {
    var api = pkApi();
    var opts = (api && api.PLACEMENT_KIND_BASE_OPTIONS) || [];
    var hit = opts.find(function (o) { return String(o.id) === String(baseKind); });
    return hit ? hit.label : String(baseKind || '');
  }

  function pkProfileHasCustomSettings(p) {
    return !!(p && p.settings && typeof p.settings === 'object' && Object.keys(p.settings).length > 0);
  }

  function pkLoadProfilesStateFromConfig() {
    var config = getRoomStepsConfig();
    if (!config || typeof config !== 'object') config = { steps: [] };
    config = ensureStepsInConfig(config);
    config = ensurePlacementKindProfilesInConfig(config);
    room2PkProfilesState = JSON.parse(JSON.stringify(config.placementKindProfiles || getDefaultPlacementKindProfiles()));
    return room2PkProfilesState;
  }

  function placementKindProfileRowHtml(p, idx) {
    var idVal = (p && p.id != null ? String(p.id) : '');
    var labelVal = (p && p.label != null ? String(p.label) : '');
    var active = idx === room2PkActiveIdx ? ' active' : '';
    var customDot = pkProfileHasCustomSettings(p)
      ? '<span class="room2-pk-custom-dot" title="Свои настройки">●</span>'
      : '';

    return (
      '<div class="room2-pk-profile-row' + active + '" data-idx="' + idx + '">' +
        '<button type="button" class="room2-pk-row-btn" title="Открыть свойства">' +
          '<span class="room2-pk-row-name">' + labelVal.replace(/</g, '&lt;') + customDot + '</span>' +
          '<span class="room2-pk-row-meta">' + idVal.replace(/</g, '&lt;') + '</span>' +
        '</button>' +
        '<button type="button" class="room2-pk-icon-btn room2-pk-edit-btn" title="Настройки">' + PK_GEAR_SVG + '</button>' +
        '<button type="button" class="room2-pk-icon-btn room2-pk-del-btn" title="Удалить">' + PK_TRASH_SVG + '</button>' +
      '</div>'
    );
  }

  function renderRoom2PlacementKindsPanel(opts) {
    opts = opts || {};
    var listEl = document.getElementById('room2-pk-profiles-list');
    if (!listEl) return;
    // Не перечитывать localStorage после «Применить» — иначе новый тип пропадает до «Сохранить».
    if (opts.reloadFromConfig) {
      pkLoadProfilesStateFromConfig();
    }
    if (room2PkActiveIdx >= room2PkProfilesState.length) {
      room2PkActiveIdx = room2PkProfilesState.length ? 0 : -1;
    }
    listEl.innerHTML = '';
    room2PkProfilesState.forEach(function (p, idx) {
      listEl.insertAdjacentHTML('beforeend', placementKindProfileRowHtml(p, idx));
    });
    if (room2PkActiveIdx >= 0 || room2PkActiveIdx === -1) {
      selectRoom2PkProfile(room2PkActiveIdx, true);
      if (room2PkActiveIdx >= 0) {
        var activeRow = listEl.querySelector('.room2-pk-profile-row[data-idx="' + room2PkActiveIdx + '"]');
        if (activeRow && typeof activeRow.scrollIntoView === 'function') {
          activeRow.scrollIntoView({ block: 'nearest' });
        }
      }
    } else {
      var panel = document.getElementById('room2-pk-properties-panel');
      if (panel) panel.classList.remove('has-selection');
    }
  }

  function saveRoom2PlacementKindsToConfig() {
    var config = getRoomStepsConfig();
    if (!config || typeof config !== 'object') config = { steps: [] };
    config = ensureStepsInConfig(config);
    var out = JSON.parse(JSON.stringify(room2PkProfilesState || []));
    if (out.length === 0) out = getDefaultPlacementKindProfiles();
    config.placementKindProfiles = out;
    saveRoomStepsConfig(config);
    return config;
  }

  function pkFillEditorSelects() {
    var baseSel = document.getElementById('room2-pk-editor-base');
    var prodSel = document.getElementById('room2-pk-h-productKind');
    var api = pkApi();
    if (baseSel) {
      var opts = (api && api.PLACEMENT_KIND_BASE_OPTIONS) || [];
      baseSel.innerHTML = opts.map(function (o) {
        return '<option value="' + o.id + '">' + String(o.label).replace(/</g, '&lt;') + '</option>';
      }).join('');
    }
    if (prodSel) {
      var popts = (api && api.PLACEMENT_KIND_PRODUCT_OPTIONS) || [];
      prodSel.innerHTML = popts.map(function (o) {
        return '<option value="' + o.id + '">' + String(o.label).replace(/</g, '&lt;') + '</option>';
      }).join('');
    }
  }

  function pkResolvedForProfile(p) {
    var api = pkApi();
    if (!api || typeof api.resolvePlacementKindProfile !== 'function') return null;
    var cfg = { placementKindProfiles: room2PkProfilesState };
    var id = (p && p.id) ? String(p.id) : '';
    return api.resolvePlacementKindProfile(id, cfg);
  }

  function pkReadEditorIntoProfile() {
    var idEl = document.getElementById('room2-pk-editor-id');
    var labelEl = document.getElementById('room2-pk-editor-label');
    var baseEl = document.getElementById('room2-pk-editor-base');
    var prodEl = document.getElementById('room2-pk-h-productKind');
    var id = idEl ? (idEl.value || '').trim() : '';
    var label = labelEl ? (labelEl.value || '').trim() : '';
    var baseKind = baseEl ? (baseEl.value || '').trim() : 'standalone_floor';
    if (!id) return null;

    var settings = {
      behavior: {
        fixedHeight: !!(document.getElementById('room2-pk-b-fixedHeight') && document.getElementById('room2-pk-b-fixedHeight').checked),
        syncHeightInSection: !!(document.getElementById('room2-pk-b-syncHeight') && document.getElementById('room2-pk-b-syncHeight').checked),
        anchorFrontOnDepthChange: !!(document.getElementById('room2-pk-b-anchorFront') && document.getElementById('room2-pk-b-anchorFront').checked),
        useLayoutZones: !!(document.getElementById('room2-pk-b-layoutZones') && document.getElementById('room2-pk-b-layoutZones').checked),
        allowNicheTransition: !!(document.getElementById('room2-pk-b-nicheTransition') && document.getElementById('room2-pk-b-nicheTransition').checked),
        zoneSlotRole: (function () {
          var el = document.getElementById('room2-pk-b-zoneSlotRole');
          var v = el ? String(el.value || '').trim() : '';
          return v === 'base' || v === 'upper' || v === 'full' ? v : 'full';
        })(),
        cohabitGroup: (function () {
          var el = document.getElementById('room2-pk-b-cohabitGroup');
          return el ? String(el.value || '').trim() : '';
        })(),
      },
      editPopup: {
        showHeight: !!(document.getElementById('room2-pk-e-showHeight') && document.getElementById('room2-pk-e-showHeight').checked),
        showDepth: !document.getElementById('room2-pk-e-showDepth') || document.getElementById('room2-pk-e-showDepth').checked !== false,
        showWidth: !document.getElementById('room2-pk-e-showWidth') || document.getElementById('room2-pk-e-showWidth').checked !== false,
      },
      hinges: {},
    };

    function numOrNull(elId) {
      var el = document.getElementById(elId);
      if (!el || el.value === '' || el.value == null) return null;
      var n = parseFloat(String(el.value).replace(',', '.'));
      return isFinite(n) && n > 0 ? n : null;
    }
    settings.editPopup.heightMinCm = numOrNull('room2-pk-e-heightMin');
    settings.editPopup.heightMaxCm = numOrNull('room2-pk-e-heightMax');
    settings.editPopup.depthMinCm = numOrNull('room2-pk-e-depthMin');
    settings.editPopup.depthMaxCm = numOrNull('room2-pk-e-depthMax');
    var ht = document.getElementById('room2-pk-e-heightText');
    var dt = document.getElementById('room2-pk-e-depthText');
    settings.editPopup.heightLimitText = ht ? (ht.value || '').trim() : '';
    settings.editPopup.depthLimitText = dt ? (dt.value || '').trim() : '';

    if (settings.behavior.fixedHeight) {
      var fhCm = numOrNull('room2-pk-b-fixedHeightCm');
      if (fhCm != null) settings.behavior.fixedHeightCm = fhCm;
    }

    var pk = prodEl ? (prodEl.value || '').trim() : '';
    if (pk) settings.hinges.productKind = pk;

    return { id: id, label: label || id, baseKind: baseKind, settings: settings };
  }

  function pkWriteEditorFromProfile(p) {
    var api = pkApi();
    var resolved = pkResolvedForProfile(p);
    if (!resolved && api && typeof api.getBasePreset === 'function') {
      var presetOnly = api.getBasePreset((p && p.baseKind) || 'standalone_floor');
      resolved = {
        behavior: presetOnly.behavior,
        editPopup: presetOnly.editPopup,
        hinges: presetOnly.hinges,
      };
    }
    var idxEl = document.getElementById('room2-pk-editor-idx');
    var titleEl = document.getElementById('room2-pk-editor-title');
    var idEl = document.getElementById('room2-pk-editor-id');
    var labelEl = document.getElementById('room2-pk-editor-label');
    var baseEl = document.getElementById('room2-pk-editor-base');
    var prodEl = document.getElementById('room2-pk-h-productKind');

    if (titleEl) {
      titleEl.textContent =
        p && p._idx === -1 ? 'Новый тип' : ((p && p.label) || (p && p.id) || 'Свойства');
    }
    if (idxEl) idxEl.value = p && p._idx != null ? String(p._idx) : '-1';

    var isSystem = api && typeof api.isSystemPlacementKindProfile === 'function' && api.isSystemPlacementKindProfile(p && p.id);
    if (idEl) {
      idEl.value = (p && p.id) || '';
      idEl.readOnly = !!isSystem;
    }
    if (labelEl) labelEl.value = (p && p.label) || '';
    if (baseEl) baseEl.value = (p && p.baseKind) || 'standalone_floor';

    var b = (resolved && resolved.behavior) || {};
    var ep = (resolved && resolved.editPopup) || {};
    var hk = (p && p.settings && p.settings.hinges) || {};

    function setChk(id, val) {
      var el = document.getElementById(id);
      if (el) el.checked = !!val;
    }
    setChk('room2-pk-b-fixedHeight', b.fixedHeight);
    setNum('room2-pk-b-fixedHeightCm', b.fixedHeightCm);
    pkSyncFixedHeightFieldVisibility();
    setChk('room2-pk-b-syncHeight', b.syncHeightInSection);
    setChk('room2-pk-b-anchorFront', b.anchorFrontOnDepthChange);
    setChk('room2-pk-b-layoutZones', b.useLayoutZones);
    setChk('room2-pk-b-nicheTransition', b.allowNicheTransition);
    var roleEl = document.getElementById('room2-pk-b-zoneSlotRole');
    if (roleEl) {
      var role = String(b.zoneSlotRole || 'full').trim();
      roleEl.value = role === 'base' || role === 'upper' || role === 'full' ? role : 'full';
    }
    var grpEl = document.getElementById('room2-pk-b-cohabitGroup');
    if (grpEl) grpEl.value = b.cohabitGroup != null ? String(b.cohabitGroup) : '';
    setChk('room2-pk-e-showHeight', ep.showHeight);
    setChk('room2-pk-e-showDepth', ep.showDepth !== false);
    setChk('room2-pk-e-showWidth', ep.showWidth !== false);

    function setNum(id, val) {
      var el = document.getElementById(id);
      if (!el) return;
      el.value = val != null && val !== '' ? String(val) : '';
    }
    setNum('room2-pk-e-heightMin', ep.heightMinCm);
    setNum('room2-pk-e-heightMax', ep.heightMaxCm);
    setNum('room2-pk-e-depthMin', ep.depthMinCm);
    setNum('room2-pk-e-depthMax', ep.depthMaxCm);
    var ht = document.getElementById('room2-pk-e-heightText');
    var dt = document.getElementById('room2-pk-e-depthText');
    if (ht) ht.value = ep.heightLimitText || '';
    if (dt) dt.value = ep.depthLimitText || '';
    if (prodEl) prodEl.value = (hk.productKind != null ? String(hk.productKind) : '');
  }

  function pkStripSettingsToDiff(profile) {
    var api = pkApi();
    if (!api || !profile) return {};
    var baseKind = profile.baseKind || profile.id;
    var preset = typeof api.getBasePreset === 'function' ? api.getBasePreset(baseKind) : null;
    if (!preset) return profile.settings || {};
    var s = profile.settings || {};
    var out = {};

    function diffSection(sectionKey, keys) {
      var custom = s[sectionKey];
      if (!custom || typeof custom !== 'object') return;
      var diff = {};
      keys.forEach(function (k) {
        var cv = custom[k];
        var pv = preset[sectionKey] ? preset[sectionKey][k] : undefined;
        if (sectionKey === 'hinges' && k === 'productKind') {
          if (cv && cv !== (preset.hinges && preset.hinges.productKind)) diff[k] = cv;
          return;
        }
        if (typeof cv === 'boolean' && cv !== pv) diff[k] = cv;
        else if (cv != null && cv !== '' && cv !== pv) diff[k] = cv;
      });
      if (Object.keys(diff).length) out[sectionKey] = diff;
    }

    diffSection('behavior', ['fixedHeight', 'fixedHeightCm', 'syncHeightInSection', 'anchorFrontOnDepthChange', 'useLayoutZones', 'allowNicheTransition', 'zoneSlotRole', 'cohabitGroup', 'wallHungAnchor']);
    diffSection('editPopup', ['showHeight', 'showDepth', 'showWidth', 'heightMinCm', 'heightMaxCm', 'depthMinCm', 'depthMaxCm', 'heightLimitText', 'depthLimitText']);
    diffSection('hinges', ['productKind']);
    return out;
  }

  function pkSyncFixedHeightFieldVisibility() {
    var wrap = document.getElementById('room2-pk-fixed-height-wrap');
    var chk = document.getElementById('room2-pk-b-fixedHeight');
    var inp = document.getElementById('room2-pk-b-fixedHeightCm');
    if (!wrap) return;
    var on = !!(chk && chk.checked);
    wrap.style.display = on ? '' : 'none';
    if (inp) inp.disabled = !on;
  }

  function pkUpdateEditorBanners() {
    var newBn = document.getElementById('room2-pk-new-banner');
    var editBn = document.getElementById('room2-pk-edit-banner');
    var isNew = room2PkActiveIdx === -1;
    if (newBn) newBn.style.display = isNew ? 'block' : 'none';
    if (editBn) editBn.style.display = !isNew && room2PkActiveIdx >= 0 ? 'block' : 'none';
  }

  function selectRoom2PkProfile(idx, skipRerender) {
    pkFillEditorSelects();
    room2PkActiveIdx = idx;
    var panel = document.getElementById('room2-pk-properties-panel');
    var p = null;
    if (idx >= 0 && room2PkProfilesState[idx]) {
      p = JSON.parse(JSON.stringify(room2PkProfilesState[idx]));
      p._idx = idx;
      if (panel) panel.classList.add('has-selection');
    } else if (idx === -1) {
      p = { id: '', label: '', baseKind: 'standalone_floor', settings: {}, _idx: -1 };
      if (panel) panel.classList.add('has-selection');
    } else {
      if (panel) panel.classList.remove('has-selection');
      return;
    }
    pkWriteEditorFromProfile(p);
    pkUpdateEditorBanners();
    if (!skipRerender) {
      var listEl = document.getElementById('room2-pk-profiles-list');
      if (listEl) {
        listEl.querySelectorAll('.room2-pk-profile-row').forEach(function (row) {
          row.classList.remove('active');
        });
        if (idx >= 0) {
          var activeRow = listEl.querySelector('.room2-pk-profile-row[data-idx="' + idx + '"]');
          if (activeRow) activeRow.classList.add('active');
        }
      }
    }
  }

  function initRoom2PlacementKinds() {
    pkFillEditorSelects();
    if (room2PkActiveIdx < 0) room2PkActiveIdx = 0;
    renderRoom2PlacementKindsPanel({ reloadFromConfig: true });

    var listEl = document.getElementById('room2-pk-profiles-list');
    var addBtn = document.getElementById('room2-pk-add-btn');
    var saveBtn = document.getElementById('room2-pk-save-btn');
    var applyBtn = document.getElementById('room2-pk-editor-apply');
    var resetBaseBtn = document.getElementById('room2-pk-editor-reset-base');
    var baseSel = document.getElementById('room2-pk-editor-base');

    if (listEl && !listEl._room2PkBound) {
      listEl._room2PkBound = true;
      listEl.addEventListener('click', function (e) {
        if (e.target.closest('.room2-pk-del-btn')) {
          e.stopPropagation();
          var row = e.target.closest('.room2-pk-profile-row');
          if (!row) return;
          var idx = parseInt(row.getAttribute('data-idx'), 10);
          var prof = room2PkProfilesState[idx];
          var api = pkApi();
          if (api && prof && api.isSystemPlacementKindProfile(prof.id)) {
            if (typeof toastr !== 'undefined') toastr.warning('Системный тип нельзя удалить');
            else alert('Системный тип нельзя удалить');
            return;
          }
          room2PkProfilesState.splice(idx, 1);
          if (room2PkActiveIdx === idx) room2PkActiveIdx = Math.min(idx, room2PkProfilesState.length - 1);
          else if (room2PkActiveIdx > idx) room2PkActiveIdx -= 1;
          renderRoom2PlacementKindsPanel({ reloadFromConfig: false });
          return;
        }
        var row = e.target.closest('.room2-pk-profile-row');
        if (row) {
          var idx = parseInt(row.getAttribute('data-idx'), 10);
          if (!isNaN(idx)) selectRoom2PkProfile(idx);
        }
      });
    }

    if (addBtn && !addBtn._room2PkBound) {
      addBtn._room2PkBound = true;
      addBtn.addEventListener('click', function () {
        room2PkActiveIdx = -1;
        selectRoom2PkProfile(-1);
        var idEl = document.getElementById('room2-pk-editor-id');
        var labelEl = document.getElementById('room2-pk-editor-label');
        if (idEl) {
          idEl.readOnly = false;
          idEl.value = '';
          idEl.focus();
        }
        if (labelEl) labelEl.value = '';
        pkUpdateEditorBanners();
      });
    }

    if (saveBtn && !saveBtn._room2PkBound) {
      saveBtn._room2PkBound = true;
      saveBtn.addEventListener('click', function () {
        saveRoom2PlacementKindsToConfig();
        renderRoom2PlacementKindsPanel({ reloadFromConfig: true });
        if (typeof toastr !== 'undefined') toastr.success('Типы размещения сохранены');
        else alert('Сохранено');
      });
    }

    if (applyBtn && !applyBtn._room2PkBound) {
      applyBtn._room2PkBound = true;
      applyBtn.addEventListener('click', function () {
        var raw = pkReadEditorIntoProfile();
        if (!raw || !raw.id) {
          var msg = 'Укажите ключ типа (латиница, без пробелов), например dresser_floor';
          if (typeof toastr !== 'undefined') toastr.error(msg);
          alert(msg);
          var idFocus = document.getElementById('room2-pk-editor-id');
          if (idFocus) idFocus.focus();
          return;
        }
        if (!/^[a-z][a-z0-9_]*$/i.test(raw.id)) {
          var msg2 = 'Ключ: только латиница, цифры и _, без пробелов (например dresser_floor)';
          if (typeof toastr !== 'undefined') toastr.error(msg2);
          alert(msg2);
          return;
        }
        var api = pkApi();
        var idx = room2PkActiveIdx;
        if (idx >= 0 && room2PkProfilesState[idx] && api && api.isSystemPlacementKindProfile(room2PkProfilesState[idx].id)) {
          if (String(raw.id) !== String(room2PkProfilesState[idx].id)) {
            var msg3 = 'Нельзя переименовать системный тип. Для комода нажмите «Добавить тип» слева внизу.';
            if (typeof toastr !== 'undefined') toastr.error(msg3);
            alert(msg3);
            return;
          }
        }
        var dup = room2PkProfilesState.findIndex(function (p, i) {
          return String(p.id) === String(raw.id) && i !== idx;
        });
        if (dup >= 0) {
          if (typeof toastr !== 'undefined') toastr.error('Ключ уже используется');
          alert('Ключ уже используется');
          return;
        }
        raw.settings = pkStripSettingsToDiff(raw);
        if (idx >= 0 && room2PkProfilesState[idx]) {
          if (api && api.isSystemPlacementKindProfile(room2PkProfilesState[idx].id)) {
            raw.id = room2PkProfilesState[idx].id;
          }
          room2PkProfilesState[idx] = raw;
          room2PkActiveIdx = idx;
        } else {
          room2PkProfilesState.push(raw);
          room2PkActiveIdx = room2PkProfilesState.length - 1;
        }
        saveRoom2PlacementKindsToConfig();
        renderRoom2PlacementKindsPanel({ reloadFromConfig: false });
        var okMsg = 'Сохранено: «' + (raw.label || raw.id) + '» (' + raw.id + '). Всего типов: ' + room2PkProfilesState.length;
        if (typeof toastr !== 'undefined') toastr.success(okMsg);
        else alert(okMsg);
      });
    }

    if (resetBaseBtn && !resetBaseBtn._room2PkBound) {
      resetBaseBtn._room2PkBound = true;
      resetBaseBtn.addEventListener('click', function () {
        var baseEl = document.getElementById('room2-pk-editor-base');
        var idEl = document.getElementById('room2-pk-editor-id');
        var labelEl = document.getElementById('room2-pk-editor-label');
        var baseKind = baseEl ? baseEl.value : 'standalone_floor';
        pkWriteEditorFromProfile({
          id: idEl ? idEl.value : '',
          label: labelEl ? labelEl.value : '',
          baseKind: baseKind,
          settings: {},
        });
      });
    }

    if (baseSel && !baseSel._room2PkBaseHintBound) {
      baseSel._room2PkBaseHintBound = true;
      baseSel.addEventListener('change', function () {
        var idEl = document.getElementById('room2-pk-editor-id');
        var labelEl = document.getElementById('room2-pk-editor-label');
        if (!window.confirm('Подставить пресет базового режима? Отличия будут сброшены.')) {
          var cur = room2PkActiveIdx >= 0 ? room2PkProfilesState[room2PkActiveIdx] : null;
          if (cur && baseSel) baseSel.value = cur.baseKind || 'standalone_floor';
          return;
        }
        pkWriteEditorFromProfile({
          id: idEl ? idEl.value : '',
          label: labelEl ? labelEl.value : '',
          baseKind: baseSel.value,
          settings: {},
        });
      });
    }

    var fixedHeightChk = document.getElementById('room2-pk-b-fixedHeight');
    if (fixedHeightChk && !fixedHeightChk._room2PkBound) {
      fixedHeightChk._room2PkBound = true;
      fixedHeightChk.addEventListener('change', pkSyncFixedHeightFieldVisibility);
    }
    pkSyncFixedHeightFieldVisibility();
  }
  function saveRoom2Step1ToConfig() {
    var config = getRoomStepsConfig();
    config = ensureStepsInConfig(config);
    var step = config.steps.find(function(s) { return s.stepId === 1; });
    if (!step) return config;
    var titleEl = document.getElementById('room2-step1-title');
    var colsEl = document.getElementById('room2-step1-columns');
    var container = document.getElementById('room2-step1-items');
    step.title = (titleEl && titleEl.value) ? titleEl.value.trim() : (step.title || 'Тип комнаты');
    step.columnsPerRow = colsEl && colsEl.value ? Math.max(1, Math.min(3, parseInt(colsEl.value, 10) || 2)) : 2;
    step.items = [];
    if (container) {
      container.querySelectorAll('.room-step-item').forEach(function(row, idx) {
        var name = (row.querySelector('.room-step-name') && row.querySelector('.room-step-name').value || '').trim();
        var icon = (row.querySelector('.room-step-icon') && row.querySelector('.room-step-icon').value || '').trim();
        var key = (row.querySelector('.room-step-key') && row.querySelector('.room-step-key').value || '').trim();
        var cat = row.querySelector('.room-step-category') ? row.querySelector('.room-step-category').value : '';
        var order = parseInt((row.querySelector('.room-step-order') && row.querySelector('.room-step-order').value) || '0', 10);
        var imageEl = row.querySelector('.room-step-image');
        step.items.push({
          id: row.getAttribute('data-id') || 'i' + idx,
          name: name || 'Пункт ' + (idx + 1),
          icon: icon || 'fa-circle',
          image: imageEl ? (imageEl.value || '').trim() : '',
          key: key || 'item-' + idx,
          categoryId: cat && /^\d+$/.test(String(cat)) ? parseInt(cat, 10) : null,
          order: order,
        });
      });
    }
    return config;
  }
  function saveRoom2Step5ToConfig() {
    var config = getRoomStepsConfig();
    config = ensureStepsInConfig(config);
    var step = config.steps.find(function (s) { return s.stepId === 5; });
    if (!step) {
      step = { stepId: 5, title: 'Цвет и отделка' };
      config.steps.push(step);
    }
    var labelOut = document.getElementById('room2-step5-tab-outside-label');
    var descOut = document.getElementById('room2-step5-tab-outside-desc');
    var labelIn = document.getElementById('room2-step5-tab-inside-label');
    var descIn = document.getElementById('room2-step5-tab-inside-desc');
    var labelPar = document.getElementById('room2-step5-tab-params-label');
    var descPar = document.getElementById('room2-step5-tab-params-desc');
    step.step5Tabs = step.step5Tabs || {};
    step.step5Tabs.outside = {
      label: labelOut && labelOut.value ? labelOut.value.trim() : ((step.step5Tabs.outside && step.step5Tabs.outside.label) || 'Снаружи'),
      desc: descOut && descOut.value ? descOut.value.trim() : ((step.step5Tabs.outside && step.step5Tabs.outside.desc) || ''),
    };
    step.step5Tabs.inside = {
      label: labelIn && labelIn.value ? labelIn.value.trim() : ((step.step5Tabs.inside && step.step5Tabs.inside.label) || 'Внутри'),
      desc: descIn && descIn.value ? descIn.value.trim() : ((step.step5Tabs.inside && step.step5Tabs.inside.desc) || ''),
    };
    step.step5Tabs.params = {
      label: labelPar && labelPar.value ? labelPar.value.trim() : ((step.step5Tabs.params && step.step5Tabs.params.label) || 'Параметры'),
      desc: descPar && descPar.value ? descPar.value.trim() : ((step.step5Tabs.params && step.step5Tabs.params.desc) || ''),
    };
    // Дефолтные декоры шага 5 (при создании новой комнаты): снаружи и внутри отдельно.
    var defOutsideSel = getStep5DefaultDecorSelectEl('outside');
    var defInsideSel = getStep5DefaultDecorSelectEl('inside');
    var legacyDefSel = document.getElementById('room2-step5-default-material');
    var outsideId = defOutsideSel && defOutsideSel.value ? defOutsideSel.value : null;
    var insideId = defInsideSel && defInsideSel.value ? defInsideSel.value : null;
    if (!outsideId && !insideId && legacyDefSel && legacyDefSel.value) {
      outsideId = legacyDefSel.value;
      insideId = legacyDefSel.value;
    }
    outsideId = normalizeDefaultDecorOptionValue(outsideId) || null;
    insideId = normalizeDefaultDecorOptionValue(insideId) || null;
    step.step5Defaults = step.step5Defaults || {};
    step.step5Defaults.outsideId = outsideId;
    step.step5Defaults.insideId = insideId;
    // Обратная совместимость: общий defaultId = снаружи, иначе внутри.
    step.step5Defaults.defaultId = outsideId || insideId || null;

    // Обклад: material_id из выбранного декора канала «снаружи» в комнате.
    delete step.step5SectionTrimEdgeByDecorId;
    delete step.step5TrimEdgeByMaterial;
    // Считываем декоры из списков внешнего и внутреннего кругов.
    function collectWheelRows(listId) {
      var list = document.getElementById(listId);
      var res = [];
      if (!list) return res;
      list.querySelectorAll('.room2-step5-wheel-row').forEach(function (row) {
        var slotId = (row.getAttribute('data-slot-id') || '').trim();
        var matSel = row.querySelector('.room2-wheel-material');
        var matIdRaw = matSel ? (matSel.value || '').trim() : '';
        if (!matIdRaw && matSel && matSel.getAttribute) {
          matIdRaw = (matSel.getAttribute('data-selected') || '').toString().trim();
        }
        var matId = matIdRaw !== '' && !isNaN(Number(matIdRaw)) ? Number(matIdRaw) : null;
        var id = slotId;
        var name = '';
        var texture = '';
        if (matId != null) {
          id = wheelDecorIdFromMaterialId(matId);
          var item = typeof __step5LdspById !== 'undefined' && __step5LdspById ? __step5LdspById[matId] : null;
          if (item) {
            name = (item.name || item.article || item.code || '').toString().trim();
            texture = String(item.texture || item.icon || item.image || '').trim();
          } else {
            var idEl = row.querySelector('.room2-wheel-id');
            var nameEl = row.querySelector('.room2-wheel-name');
            var texEl = row.querySelector('.room2-wheel-texture');
            if (idEl && idEl.value) id = idEl.value.trim();
            if (nameEl) name = (nameEl.value || '').trim();
            if (texEl) texture = (texEl.value || '').trim();
          }
        }
        if (!slotId && !id) return;
        var row = {
          id: id || slotId,
          name: name || id || slotId,
          texture: texture || '',
          material_type: matId != null ? 'material_2' : null,
          material_id: matId,
        };
        if (matId == null) row.hex = '#cccccc';
        res.push(row);
      });
      return res;
    }
    step.step5WheelOuter = collectWheelRows('room2-step5-wheel-outer-list');
    step.step5WheelInner = collectWheelRows('room2-step5-wheel-inner-list');
    migrateStep5DefaultDecorIds(step);
    return config;
  }
  function updateRoom2Step1Count() {
    var container = document.getElementById('room2-step1-items');
    var countEl = document.getElementById('room2-step1-items-count');
    if (countEl && container) countEl.textContent = container.querySelectorAll('.room-step-item').length;
  }
  function bindRoom2Step1ItemEvents(container) {
    if (!container) return;
    var uploadInput = document.getElementById('room2-step1-icon-upload');
    container.querySelectorAll('.room-step-del').forEach(function(btn) {
      btn.addEventListener('click', function() {
        this.closest('.room-step-item')?.remove();
        updateRoom2Step1Count();
      });
    });
    container.querySelectorAll('.room-step-icon').forEach(function(input) {
      input.addEventListener('input', function() {
        var itemEl = this.closest('.room-step-item');
        var prev = itemEl?.querySelector('.room-step-preview');
        if (!prev) return;
        var v = this.value.trim();
        var isShape = v.indexOf('shape:') === 0;
        var isImg = !isShape && (/^https?:\/\//i.test(v) || v.startsWith('/'));
        if (isImg) prev.innerHTML = '<img src="' + v.replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:contain;border-radius:6px;" onerror="this.style.display=\'none\';"><i class="fa fa-image" style="font-size:24px;color:#999;"></i>';
        else if (isShape) prev.innerHTML = '<span class="text-muted" style="font-size:11px;">схема</span>';
        else prev.innerHTML = '<i class="fa ' + (v || 'fa-circle') + '" style="font-size:28px;color:#333;"></i>';
      });
    });
    container.querySelectorAll('.room-step-upload-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var row = this.closest('.room-step-item');
        var iconInput = row ? row.querySelector('.room-step-icon') : null;
        var prev = row ? row.querySelector('.room-step-preview') : null;
        if (!iconInput) return;
        if (typeof window.openFileManager === 'function') {
          window.openFileManager({
            allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
            initialPath: 'room_icons',
            onSelect: function(r) {
              if (r && r.url && iconInput) {
                iconInput.value = r.url;
                iconInput.dispatchEvent(new Event('input', { bubbles: true }));
                if (prev) prev.innerHTML = '<img src="' + (r.url || '').replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:contain;border-radius:6px;">';
              }
            }
          });
        } else if (window.toastr) window.toastr.warning('Файловый менеджер не загружен.');
        else alert('Файловый менеджер недоступен.');
      });
    });
    container.querySelectorAll('.room-step-image-upload-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var row = this.closest('.room-step-item');
        var imageInput = row ? row.querySelector('.room-step-image') : null;
        var prev = row ? row.querySelector('.room-step-preview') : null;
        if (!imageInput) return;
        if (typeof window.openFileManager === 'function') {
          window.openFileManager({
            allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
            initialPath: 'room_icons',
            onSelect: function(r) {
              if (r && r.url && imageInput) {
                imageInput.value = r.url;
                imageInput.dispatchEvent(new Event('input', { bubbles: true }));
                if (prev) prev.innerHTML = '<img src="' + (r.url || '').replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">';
              }
            }
          });
        } else if (window.toastr) window.toastr.warning('Файловый менеджер не загружен.');
        else alert('Файловый менеджер недоступен.');
      });
    });
    container.querySelectorAll('.room-step-image').forEach(function(input) {
      input.addEventListener('input', function() {
        var itemEl = this.closest('.room-step-item');
        var prev = itemEl ? itemEl.querySelector('.room-step-preview') : null;
        if (!prev) return;
        var v = this.value.trim();
        if (v && v.charAt(0) === '/') {
          prev.innerHTML = '<img src="' + v.replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" onerror="this.style.display=\'none\';"><i class="fa fa-image" style="font-size:24px;color:#999;"></i>';
        }
      });
    });
  }
  function wheelDecorIdFromMaterialId(materialId) {
    var n = Number(materialId);
    return Number.isFinite(n) && n > 0 ? 'm-' + n : '';
  }

  function normalizeDefaultDecorOptionValue(savedId) {
    var s = savedId != null ? String(savedId).trim() : '';
    if (!s) return '';
    var at = s.indexOf('@');
    return at > 0 ? s.slice(0, at) : s;
  }

  /** Селекты дефолтов — только в блоке «цветовой круг» (избегаем дублей id в DOM). */
  function getStep5DefaultDecorSelectEl(ring) {
    var key = ring === 'inside' ? 'inside' : 'outside';
    var ibox = document.querySelector('.room2-step5-wheel-ibox');
    if (ibox) {
      var scoped = ibox.querySelector('#room2-step5-default-' + key);
      if (scoped) return scoped;
    }
    return document.getElementById('room2-step5-default-' + key);
  }

  function wheelEntryDecorId(entry) {
    if (!entry) return '';
    var mid = entry.material_id != null ? Number(entry.material_id) : (entry.materialId != null ? Number(entry.materialId) : null);
    if (Number.isFinite(mid) && mid > 0) return wheelDecorIdFromMaterialId(mid);
    return entry.id != null ? String(entry.id) : '';
  }

  function resolveSavedDecorIdForSelect(savedId, wheels) {
    var sid = savedId != null ? String(savedId).trim() : '';
    if (!sid) return '';
    var lists = Array.isArray(wheels) ? wheels : [wheels];
    var all = [];
    lists.forEach(function (w) {
      if (Array.isArray(w)) all = all.concat(w);
    });
    if (!all.length) return sid;
    if (all.some(function (c) { return c && String(c.id) === sid; })) return sid;
    var m = sid.match(/^m-(\d+)$/);
    if (m) {
      var mid = Number(m[1]);
      var byMat = all.find(function (c) {
        return c && Number(c.material_id != null ? c.material_id : c.materialId) === mid;
      });
      if (byMat) return wheelEntryDecorId(byMat);
    }
    var slot = sid.match(/^(outer|inner)-(\d+)$/);
    if (slot) {
      var wheel = slot[1] === 'inner' ? lists[1] || lists[0] : lists[0];
      if (!Array.isArray(wheel)) wheel = all;
      var idx = parseInt(slot[2], 10) - 1;
      if (idx >= 0 && idx < wheel.length) return wheelEntryDecorId(wheel[idx]) || sid;
    }
    return sid;
  }

  function setSelectValueIfExists(sel, value) {
    if (!sel || value == null || value === '') return;
    var v = String(value);
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === v) {
        sel.value = v;
        return;
      }
    }
    for (var j = 0; j < sel.options.length; j++) {
      var ov = sel.options[j].value;
      if (ov.indexOf(v + '@') === 0) {
        sel.value = ov;
        return;
      }
    }
  }

  /** После сохранения: outer-1 → m-8, если в секторе назначен материал. */
  function migrateStep5DefaultDecorIds(step) {
    if (!step || !step.step5Defaults) return;
    var defs = step.step5Defaults;
    function resolveLegacy(slotId, wheel) {
      if (!slotId || String(slotId).indexOf('m-') === 0) return slotId;
      var m = String(slotId).match(/^(outer|inner)-(\d+)$/);
      if (!m || !Array.isArray(wheel)) return slotId;
      var idx = parseInt(m[2], 10) - 1;
      if (idx < 0 || idx >= wheel.length) return slotId;
      var entry = wheel[idx];
      if (entry && entry.id) return entry.id;
      if (entry && entry.material_id != null) return wheelDecorIdFromMaterialId(entry.material_id);
      return slotId;
    }
    var allWheels = [step.step5WheelOuter, step.step5WheelInner];
    if (defs.outsideId) defs.outsideId = resolveLegacy(defs.outsideId, allWheels) || defs.outsideId;
    if (defs.insideId) defs.insideId = resolveLegacy(defs.insideId, allWheels) || defs.insideId;
    if (defs.defaultId) defs.defaultId = resolveLegacy(defs.defaultId, allWheels) || defs.defaultId;
  }

  function migrateStep5DefaultDecorSelects() {
    var legacy = document.getElementById('room2-step5-default-material');
    if (!legacy) return;
    var group = legacy.closest('.form-group');
    if (group && group.parentNode) group.remove();
  }
  function renderRoom2Step5Panel() {
    migrateStep5DefaultDecorSelects();
    var config = getRoomStepsConfig();
    config = ensureStepsInConfig(config);
    var step = config.steps.find(function (s) { return s.stepId === 5; });
    if (!step) {
      step = { stepId: 5, title: 'Цвет и отделка' };
      config.steps.push(step);
      saveRoomStepsConfig(config);
    }
    var tabs = step.step5Tabs || {};
    var outside = tabs.outside || {};
    var inside = tabs.inside || {};
    var params = tabs.params || {};
    var labelOut = document.getElementById('room2-step5-tab-outside-label');
    var descOut = document.getElementById('room2-step5-tab-outside-desc');
    var labelIn = document.getElementById('room2-step5-tab-inside-label');
    var descIn = document.getElementById('room2-step5-tab-inside-desc');
    var labelPar = document.getElementById('room2-step5-tab-params-label');
    var descPar = document.getElementById('room2-step5-tab-params-desc');
    var wheelOuterList = document.getElementById('room2-step5-wheel-outer-list');
    var wheelInnerList = document.getElementById('room2-step5-wheel-inner-list');
    var defOutsideSel = getStep5DefaultDecorSelectEl('outside');
    var defInsideSel = getStep5DefaultDecorSelectEl('inside');
    var legacyDefSel = document.getElementById('room2-step5-default-material');
    if (labelOut) labelOut.value = outside.label || 'Снаружи';
    if (descOut) descOut.value = outside.desc || '';
    if (labelIn) labelIn.value = inside.label || 'Внутри';
    if (descIn) descIn.value = inside.desc || '';
    if (labelPar) labelPar.value = params.label || 'Параметры';
    if (descPar) descPar.value = params.desc || '';

    // Количество секторов в круге — фиксированное (как в SVG‑круге).
    // Для каждого сектора сразу создаём строку в списке, чтобы
    // админ заполнял их по порядку.
    var OUTER_SECTORS_COUNT = 16;
    var INNER_SECTORS_COUNT = 6;

    function makeWheelListHeaderHtml() {
      return ''
        + '<div class="room2-step5-wheel-header d-flex align-items-center flex-wrap gap-2 mb-1 px-1" style="font-size:11px;font-weight:700;color:#666;">'
        + '  <div style="width:48px;flex-shrink:0;"></div>'
        + '  <div style="width:72px;">Сектор</div>'
        + '  <div style="width:160px;">Название в круге</div>'
        + '  <div style="width:280px;">Материал ЛДСП (ID)</div>'
        + '</div>';
    }

    function updateWheelRowMaterialHighlight(row) {
      if (!row) return;
      var sel = row.querySelector('select.room2-wheel-material');
      var hasMat = sel && (sel.value || '').trim() !== '';
      if (hasMat) {
        row.classList.remove('room2-wheel-row--no-material');
        row.style.borderLeft = '';
        row.style.paddingLeft = '';
      } else {
        row.classList.add('room2-wheel-row--no-material');
        row.style.borderLeft = '3px solid #f0ad4e';
        row.style.paddingLeft = '6px';
      }
    }

    function highlightAllWheelRows(listEl) {
      if (!listEl) return;
      listEl.querySelectorAll('.room2-step5-wheel-row').forEach(updateWheelRowMaterialHighlight);
    }

    function updateWheelRowPreview(row) {
      var texInput = row && row.querySelector('.room2-wheel-texture');
      var prev = row && row.querySelector('.room2-wheel-preview');
      if (!prev || !texInput) return;
      var url = (texInput.value || '').trim();
      if (url && (/^https?:\/\//i.test(url) || url.startsWith('/'))) {
        prev.innerHTML = '<img src="' + url.replace(/"/g, '&quot;').replace(/'/g, '&#39;') + '" style="width:100%;height:100%;object-fit:contain;border-radius:6px;" onerror="this.parentElement.innerHTML=\'<i class=\\\'fa fa-image\\\' style=\\\'font-size:20px;color:#999;\\\'></i>\';">';
      } else {
        prev.innerHTML = '<i class="fa fa-image" style="font-size:20px;color:#ddd;"></i>';
      }
    }

    function getLdspItemCached(materialId) {
      var n = Number(materialId);
      if (!Number.isFinite(n) || !__step5LdspById) return null;
      return __step5LdspById[n] || null;
    }

    function applyMaterialToWheelRow(row, materialId) {
      if (!row) return;
      var matNum = Number(materialId);
      var idEl = row.querySelector('.room2-wheel-id');
      var nameEl = row.querySelector('.room2-wheel-name');
      var texEl = row.querySelector('.room2-wheel-texture');
      var nameDisp = row.querySelector('.room2-wheel-name-display');
      if (!Number.isFinite(matNum) || matNum <= 0) {
        if (idEl) idEl.value = row.getAttribute('data-slot-id') || idEl.value || '';
        if (nameEl) nameEl.value = '';
        if (texEl) texEl.value = '';
        if (nameDisp) nameDisp.textContent = '—';
        updateWheelRowPreview(row);
        return;
      }
      function applyItem(item) {
        if (!item) return;
        var nm = (item.name || item.article || item.code || ('ID ' + matNum)).toString().trim();
        var url = String(item.texture || item.icon || item.image || '').trim();
        if (idEl) idEl.value = wheelDecorIdFromMaterialId(matNum);
        if (nameEl) nameEl.value = nm;
        if (texEl) texEl.value = url;
        if (nameDisp) nameDisp.textContent = nm;
        updateWheelRowPreview(row);
      }
      var cached = getLdspItemCached(matNum);
      if (cached) {
        applyItem(cached);
        return;
      }
      fetchJson('/api/catalog/item/material_2/' + encodeURIComponent(String(matNum)) + '?t=' + Date.now())
        .then(function (item) {
          if (item && item.id != null) {
            if (!__step5LdspById) __step5LdspById = {};
            __step5LdspById[Number(item.id)] = item;
          }
          applyItem(item);
        })
        .catch(function () {});
    }

    function syncAllWheelRowsFromMaterialSelects(listEl) {
      if (!listEl) return;
      listEl.querySelectorAll('.room2-step5-wheel-row').forEach(function (row) {
        var sel = row.querySelector('select.room2-wheel-material');
        var v = sel ? (sel.value || '').trim() : '';
        if (v) applyMaterialToWheelRow(row, v);
      });
    }

    function bindWheelMaterialSelectHandlers(listEl) {
      if (!listEl || listEl._materialBound) return;
      listEl._materialBound = true;
      listEl.addEventListener('change', function (e) {
        if (!e.target || !e.target.classList || !e.target.classList.contains('room2-wheel-material')) return;
        var row = e.target.closest('.room2-step5-wheel-row');
        updateWheelRowMaterialHighlight(row);
        applyMaterialToWheelRow(row, e.target.value);
      });
    }

    function collectWheelRowsMissingMaterial(listId) {
      var list = document.getElementById(listId);
      var missing = [];
      if (!list) return missing;
      list.querySelectorAll('.room2-step5-wheel-row').forEach(function (row) {
        var slot = (row.getAttribute('data-slot-id') || '').trim();
        var sel = row.querySelector('select.room2-wheel-material');
        if (!sel || !(sel.value || '').trim()) {
          if (slot) missing.push(slot);
        }
      });
      return missing;
    }

    function makeRowHtml(item, idx, slotPrefix) {
      item = item || {};
      slotPrefix = slotPrefix || 'outer';
      var slotId = (item._slotId || item.slotId || (slotPrefix + '-' + (idx + 1)));
      var matId = item.material_id != null ? Number(item.material_id) : (item.materialId != null ? Number(item.materialId) : null);
      var decorId = Number.isFinite(matId) && matId > 0
        ? wheelDecorIdFromMaterialId(matId)
        : (item.id && String(item.id).indexOf('m-') === 0 ? String(item.id) : slotId);
      var name = (item.name || '');
      var texture = (item.texture || '');
      var materialIdStr = Number.isFinite(matId) && matId > 0 ? String(matId) : '';
      var previewHtml = texture
        ? '<img src="' + texture.replace(/"/g, '&quot;').replace(/'/g, '&#39;') + '" style="width:100%;height:100%;object-fit:contain;border-radius:6px;" onerror="this.parentElement.innerHTML=\'<i class=\\\'fa fa-image\\\' style=\\\'font-size:20px;color:#999;\\\'></i>\';">'
        : '<i class="fa fa-image" style="font-size:20px;color:#ddd;"></i>';
      var nameLabel = name ? name.replace(/</g, '&lt;') : '—';
      return '' +
        '<div class="room2-step5-wheel-row d-flex align-items-center flex-wrap gap-2 mb-2" data-idx="' + idx + '" data-slot-id="' + slotId.replace(/"/g, '&quot;') + '" data-fixed-sector="1">' +
        '  <div class="room2-wheel-preview" style="width:48px;height:48px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:#fff;border:1px solid #ddd;border-radius:6px;overflow:hidden;">' + previewHtml + '</div>' +
        '  <div class="text-muted room2-wheel-slot-label" style="width:72px;font-size:12px;font-weight:600;">' + slotId.replace(/</g, '&lt;') + '</div>' +
        '  <div class="room2-wheel-name-display text-truncate" style="width:160px;font-size:13px;" title="Из карточки материала">' + nameLabel + '</div>' +
        '  <input type="hidden" class="room2-wheel-id" value="' + decorId.replace(/"/g, '&quot;') + '">' +
        '  <input type="hidden" class="room2-wheel-name" value="' + name.replace(/"/g, '&quot;') + '">' +
        '  <input type="hidden" class="room2-wheel-texture" value="' + texture.replace(/"/g, '&quot;') + '">' +
        '  <select class="form-control form-control-sm room2-wheel-material" style="width:280px;max-width:100%;" data-selected="' + materialIdStr.replace(/"/g, '&quot;') + '" title="Декор, название и кромка подставятся из карточки плитного материала">' +
        '    <option value="">— выберите материал —</option>' +
        '  </select>' +
        '</div>';
    }

    function fetchJson(url) {
      return fetch(url, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; });
    }
    function loadLdspMaterialsFull() {
      if (__step5LdspById) return Promise.resolve(__step5LdspById);
      return fetchJson('/api/catalog/items_get/material_2?t=' + Date.now())
        .then(function (data) {
          var items = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);
          __step5LdspById = {};
          (items || []).forEach(function (it) {
            if (it && it.id != null) __step5LdspById[Number(it.id)] = it;
          });
          return __step5LdspById;
        })
        .catch(function () { __step5LdspById = {}; return __step5LdspById; });
    }
    function loadLdspMaterials() {
      return loadLdspMaterialsFull().then(function (byId) {
        var out = Object.keys(byId || {}).map(function (k) {
          var it = byId[k];
          return { id: Number(k), name: (it && (it.name || it.article || it.code) || '').toString() };
        });
        out.sort(function (a, b) { return String(a.name || '').localeCompare(String(b.name || ''), 'ru'); });
        return out;
      });
    }

    function populateWheelMaterialSelects(listEl) {
      if (!listEl) return;
      loadLdspMaterials().then(function (items) {
        listEl.querySelectorAll('select.room2-wheel-material').forEach(function (sel) {
          if (sel._filled) return;
          sel._filled = true;
          var selected = (sel.getAttribute('data-selected') || '').trim();
          var html = '<option value="">— выберите материал ЛДСП —</option>';
          if (items && items.length) {
            html += items.map(function (it) {
              var nm = (it.name || ('ID ' + it.id)).replace(/</g, '&lt;').replace(/"/g, '&quot;');
              return '<option value="' + it.id + '">' + nm + ' (ID ' + it.id + ')</option>';
            }).join('');
          } else {
            html += '<option value="" disabled>(материалы ЛДСП не загружены)</option>';
          }
          sel.innerHTML = html;
          if (selected) sel.value = selected;
        });
        syncAllWheelRowsFromMaterialSelects(listEl);
        highlightAllWheelRows(listEl);
        try {
          var stepNow = getRoomStepsConfig().steps.find(function (s) { return s.stepId === 5; });
          if (stepNow) {
            step.step5WheelOuter = collectWheelRowsFromDom('room2-step5-wheel-outer-list');
            step.step5WheelInner = collectWheelRowsFromDom('room2-step5-wheel-inner-list');
            fixed.outer = step.step5WheelOuter;
            fixed.inner = step.step5WheelInner;
            refreshStep5DefaultDecorSelects();
          }
        } catch (eRefresh) {}
      });
    }

    function collectWheelRowsFromDom(listId) {
      var list = document.getElementById(listId);
      var res = [];
      if (!list) return res;
      list.querySelectorAll('.room2-step5-wheel-row').forEach(function (row) {
        var slotId = (row.getAttribute('data-slot-id') || '').trim();
        var matSel = row.querySelector('.room2-wheel-material');
        var matIdRaw = matSel ? (matSel.value || '').trim() : '';
        if (!matIdRaw && matSel && matSel.getAttribute) {
          matIdRaw = (matSel.getAttribute('data-selected') || '').toString().trim();
        }
        var matId = matIdRaw !== '' && !isNaN(Number(matIdRaw)) ? Number(matIdRaw) : null;
        var idEl = row.querySelector('.room2-wheel-id');
        var nameEl = row.querySelector('.room2-wheel-name');
        var texEl = row.querySelector('.room2-wheel-texture');
        var id = idEl ? (idEl.value || '').trim() : slotId;
        var name = nameEl ? (nameEl.value || '').trim() : '';
        var texture = texEl ? (texEl.value || '').trim() : '';
        if (matId != null) {
          id = wheelDecorIdFromMaterialId(matId);
          var item = __step5LdspById ? __step5LdspById[matId] : null;
          if (item) {
            name = (item.name || item.article || '').toString().trim();
            texture = String(item.texture || item.icon || '').trim();
          }
        }
        if (!slotId && !id) return;
        var rowDom = {
          id: id || slotId,
          _slotId: slotId,
          name: name || id || slotId,
          texture: texture || '',
          material_type: matId != null ? 'material_2' : null,
          material_id: matId,
        };
        if (matId == null) rowDom.hex = '#cccccc';
        res.push(rowDom);
      });
      return res;
    }

    function ensureFixedWheelArrays() {
      var outer = Array.isArray(step.step5WheelOuter) ? step.step5WheelOuter.slice() : [];
      var inner = Array.isArray(step.step5WheelInner) ? step.step5WheelInner.slice() : [];

      // Обрезаем лишнее, если когда‑то было больше строк.
      if (outer.length > OUTER_SECTORS_COUNT) outer = outer.slice(0, OUTER_SECTORS_COUNT);
      if (inner.length > INNER_SECTORS_COUNT) inner = inner.slice(0, INNER_SECTORS_COUNT);

      // Добавляем пустые элементы до нужной длины.
      while (outer.length < OUTER_SECTORS_COUNT) {
        outer.push({ id: 'outer-' + (outer.length + 1), hex: '#cccccc', name: '', texture: '' });
      }
      while (inner.length < INNER_SECTORS_COUNT) {
        inner.push({ id: 'inner-' + (inner.length + 1), hex: '#cccccc', name: '', texture: '' });
      }

      outer.forEach(function (it, i) {
        it._slotId = 'outer-' + (i + 1);
        if (it.material_id != null && Number(it.material_id) > 0) {
          it.id = wheelDecorIdFromMaterialId(it.material_id);
        }
      });
      inner.forEach(function (it, i) {
        it._slotId = 'inner-' + (i + 1);
        if (it.material_id != null && Number(it.material_id) > 0) {
          it.id = wheelDecorIdFromMaterialId(it.material_id);
        }
      });

      step.step5WheelOuter = outer;
      step.step5WheelInner = inner;
      return { outer: outer, inner: inner };
    }

    var fixed = ensureFixedWheelArrays();
    migrateStep5DefaultDecorIds(step);
    if (wheelOuterList) {
      wheelOuterList.innerHTML = makeWheelListHeaderHtml() + fixed.outer
        .map(function (it, i) { return makeRowHtml(it, i, 'outer'); })
        .join('');
      populateWheelMaterialSelects(wheelOuterList);
      bindWheelMaterialSelectHandlers(wheelOuterList);
    }
    if (wheelInnerList) {
      wheelInnerList.innerHTML = makeWheelListHeaderHtml() + fixed.inner
        .map(function (it, i) { return makeRowHtml(it, i, 'inner'); })
        .join('');
      populateWheelMaterialSelects(wheelInnerList);
      bindWheelMaterialSelectHandlers(wheelInnerList);
    }

    /** Оба круга равнозначны: список секторов с материалом для дефолтов и подсказок. */
    function allWheelDecorItems(fixed) {
      var list = [];
      (fixed.outer || []).forEach(function (it) {
        if (it) list.push(Object.assign({}, it, { _wheelLabel: 'Круг 1' }));
      });
      (fixed.inner || []).forEach(function (it) {
        if (it) list.push(Object.assign({}, it, { _wheelLabel: 'Круг 2' }));
      });
      return list;
    }

    // Дефолты: любой сектор любого круга с material_id (value = m-{id}, подпись — круг + слот).
    function buildDefaultDecorOptions(items) {
      var opts = '<option value="">— не задан —</option>';
      var seenValue = {};
      (items || []).forEach(function (it) {
        if (!it) return;
        var mid = it.material_id != null ? Number(it.material_id) : (it.materialId != null ? Number(it.materialId) : null);
        if (!Number.isFinite(mid) || mid <= 0) return;
        var decorId = wheelDecorIdFromMaterialId(mid);
        var slot = it._slotId || it.slotId || it.id || '';
        var wheel = it._wheelLabel || '';
        var optValue = decorId;
        if (seenValue[optValue] && slot) {
          optValue = decorId + '@' + slot;
        }
        if (seenValue[optValue]) return;
        seenValue[optValue] = true;
        var title = (it.name || ('Материал ' + mid)).toString();
        var label = (wheel ? wheel + ' · ' : '') + title + ' (ID ' + mid + ')' + (slot ? ' [' + slot + ']' : '');
        opts += '<option value="' + optValue.replace(/"/g, '&quot;') + '">' + label.replace(/</g, '&lt;') + '</option>';
      });
      return opts;
    }

    function refreshStep5DefaultDecorSelects() {
      var defs = step.step5Defaults || {};
      var currentOutsideId = defs.outsideId || defs.defaultId || '';
      var currentInsideId = defs.insideId || '';
      var allItems = allWheelDecorItems(fixed);
      var wheels = [fixed.outer, fixed.inner];
      if (defOutsideSel) {
        defOutsideSel.innerHTML = buildDefaultDecorOptions(allItems);
        setSelectValueIfExists(
          defOutsideSel,
          resolveSavedDecorIdForSelect(normalizeDefaultDecorOptionValue(currentOutsideId), wheels),
        );
      }
      if (defInsideSel) {
        defInsideSel.innerHTML = buildDefaultDecorOptions(allItems);
        setSelectValueIfExists(
          defInsideSel,
          resolveSavedDecorIdForSelect(normalizeDefaultDecorOptionValue(currentInsideId), wheels),
        );
      }
    }

    refreshStep5DefaultDecorSelects();
    // Старый одиночный селект (если страница ещё не перезагружалась после обновления).
    if (legacyDefSel && !defOutsideSel && !defInsideSel) {
      var legacyId = defs.defaultId || defs.outsideId || defs.insideId || '';
      var legacyOpts = buildDefaultDecorOptions(allWheelDecorItems(fixed));
      legacyDefSel.innerHTML = legacyOpts;
      if (legacyId) legacyDefSel.value = legacyId;
    }

    // Кнопка сохранения настроек шага 5 — используем общую "Сохранить шаги комнаты"
    // Привязываем обработчики для строк декоров и загрузки файлов.
    function bindWheelListEvents(listId, uploadInputId) {
      var list = document.getElementById(listId);
      var uploadInput = document.getElementById(uploadInputId);
      var addBtn =
        listId === 'room2-step5-wheel-outer-list'
          ? document.getElementById('room2-step5-wheel-outer-add')
          : document.getElementById('room2-step5-wheel-inner-add');
      if (addBtn && !addBtn._bound) {
        addBtn._bound = true;
        addBtn.addEventListener('click', function () {
          if (!list) return;
          var placeholder = list.querySelector('.text-muted');
          if (placeholder) placeholder.remove();
          var row = document.createElement('div');
          row.className = 'room2-step5-wheel-row d-flex align-items-center flex-wrap gap-2 mb-2';
          row.innerHTML = makeRowHtml({}, Date.now());
          list.appendChild(row);
          populateWheelMaterialSelects(list);
          updateWheelRowMaterialHighlight(row);
        });
      }
      if (list && !list._bound) {
        list._bound = true;
        list.addEventListener('click', function (e) {
          var delBtn = e.target.closest('.room2-wheel-del');
          if (delBtn) {
            var row = delBtn.closest('.room2-step5-wheel-row');
            if (row) row.remove();
            if (!list.querySelector('.room2-step5-wheel-row')) {
              list.innerHTML =
                '<div class="text-muted p-2">Нет декоров. Нажмите «Добавить декор».</div>';
            }
            return;
          }
          var uploadBtn = e.target.closest('.room2-wheel-upload');
          if (uploadBtn) {
            var row = uploadBtn.closest('.room2-step5-wheel-row');
            var texInput = row ? row.querySelector('.room2-wheel-texture') : null;
            var prev = row ? row.querySelector('.room2-wheel-preview') : null;
            if (texInput && typeof window.openFileManager === 'function') {
              window.openFileManager({
                allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
                initialPath: 'room_icons',
                onSelect: function(r) {
                  if (r && r.url && texInput) {
                    texInput.value = r.url;
                    texInput.dispatchEvent(new Event('input', { bubbles: true }));
                    if (prev) {
                      prev.innerHTML = '<img src="' + (r.url || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;') + '" style="width:100%;height:100%;object-fit:contain;border-radius:6px;" onerror="this.parentElement.innerHTML=\'<i class=\\\'fa fa-image\\\' style=\\\'font-size:20px;color:#999;\\\'></i>\';">';
                    }
                    if (typeof toastr !== 'undefined') toastr.success('Выбрана текстура');
                  }
                }
              });
            } else if (window.toastr) window.toastr.warning('Файловый менеджер не загружен.');
            else alert('Файловый менеджер недоступен.');
          }
        });
      }
      if (list && !list._inputBound) {
        list._inputBound = true;
      }
      if (uploadInput && !uploadInput._bound) {
        uploadInput._bound = true;
        uploadInput.addEventListener('change', function () {
          var row = uploadInput._targetRow;
          uploadInput._targetRow = null;
          var file = uploadInput.files && uploadInput.files[0];
          if (!file || !row) {
            uploadInput.value = '';
            return;
          }
          var fd = new FormData();
          fd.append('file', file);
          fetch('/api/upload/room_icon', { method: 'POST', body: fd })
            .then(function (r) { return r.json(); })
            .then(function (data) {
              uploadInput.value = '';
              if (data.files && data.files[0] && data.files[0].url) {
                var texInput = row.querySelector('.room2-wheel-texture');
                if (texInput) {
                  texInput.value = data.files[0].url;
                  updateWheelRowPreview(row);
                }
                if (typeof toastr !== 'undefined')
                  toastr.success('Текстура загружена');
              } else {
                if (typeof toastr !== 'undefined')
                  toastr.error(data.error || 'Ошибка загрузки');
              }
            })
            .catch(function () {
              uploadInput.value = '';
              if (typeof toastr !== 'undefined')
                toastr.error('Ошибка загрузки');
            });
        });
      }
    }

    bindWheelListEvents(
      'room2-step5-wheel-outer-list',
      'room2-step5-wheel-outer-upload',
    );
    bindWheelListEvents(
      'room2-step5-wheel-inner-list',
      'room2-step5-wheel-inner-upload',
    );

    var saveBtn = document.getElementById('room-steps-save-btn');
    if (saveBtn && !saveBtn._room2Step5Bound) {
      saveBtn._room2Step5Bound = true;
      saveBtn.addEventListener('click', function () {
        var cfg = saveRoom2Step5ToConfig();
        if (saveRoomStepsConfig(cfg)) {
          if (typeof toastr !== 'undefined') toastr.success('Настройки шага 5 сохранены');
          else alert('Настройки шага 5 сохранены');
        } else {
          if (typeof toastr !== 'undefined') toastr.error('Ошибка сохранения шага 5');
          else alert('Ошибка сохранения шага 5');
        }
      });
    }
    var wheelSaveBtn = document.getElementById('room2-step5-wheel-save-btn');
    if (wheelSaveBtn && !wheelSaveBtn._room2Step5Bound) {
      wheelSaveBtn._room2Step5Bound = true;
      wheelSaveBtn.addEventListener('click', function () {
        var missingOuter = collectWheelRowsMissingMaterial('room2-step5-wheel-outer-list');
        var missingInner = collectWheelRowsMissingMaterial('room2-step5-wheel-inner-list');
        loadLdspMaterialsFull().then(function () {
          syncAllWheelRowsFromMaterialSelects(document.getElementById('room2-step5-wheel-outer-list'));
          syncAllWheelRowsFromMaterialSelects(document.getElementById('room2-step5-wheel-inner-list'));
          var cfg = saveRoom2Step5ToConfig();
          if (saveRoomStepsConfig(cfg)) {
            var stepSaved = cfg.steps.find(function (s) { return s.stepId === 5; });
            if (stepSaved) {
              step = stepSaved;
              fixed.outer = step.step5WheelOuter || fixed.outer;
              fixed.inner = step.step5WheelInner || fixed.inner;
              try { refreshStep5DefaultDecorSelects(); } catch (eRf) {}
            }
            var warnParts = [];
            if (missingOuter.length) warnParts.push('внешний: ' + missingOuter.join(', '));
            if (missingInner.length) warnParts.push('внутренний: ' + missingInner.join(', '));
            if (warnParts.length) {
              var warnMsg = 'Сектора без материала ЛДСП (' + warnParts.join('; ') + '). В круге они пустые; цена и кромки — только у секторов с материалом.';
              if (typeof toastr !== 'undefined') {
                toastr.warning(warnMsg, '', { timeOut: 12000 });
              } else {
                alert(warnMsg);
              }
            }
            if (typeof toastr !== 'undefined') {
              toastr.success('Декоры и дефолты сохранены. Обновите конструктор (F5 на шаге 5).');
            } else {
              alert('Декоры и дефолты сохранены. Обновите конструктор (F5 на шаге 5).');
            }
          } else {
            if (typeof toastr !== 'undefined') toastr.error('Ошибка сохранения');
            else alert('Ошибка сохранения');
          }
        });
      });
    }
  }
  async function renderRoom2Step1Panel() {
    var config = getRoomStepsConfig();
    config = ensureStepsInConfig(config);
    var step = config.steps.find(function(s) { return s.stepId === 1; }) || config.steps[0];
    var titleEl = document.getElementById('room2-step1-title');
    var colsEl = document.getElementById('room2-step1-columns');
    var container = document.getElementById('room2-step1-items');
    if (!container) return;
    if (titleEl) titleEl.value = step.title || 'Тип комнаты';
    if (colsEl) colsEl.value = String(step.columnsPerRow && step.columnsPerRow >= 1 && step.columnsPerRow <= 3 ? step.columnsPerRow : 2);
    var items = Array.isArray(step.items) ? step.items : [];
    container.innerHTML = items.length === 0
      ? '<div class="text-muted p-2">Нет иконок. Нажмите «Добавить иконку».</div>'
      : items.sort(function(a, b) { return (a.order || 0) - (b.order || 0); }).map(function(it, idx) { return buildStepItemHtml(it, idx, { includeImage: true }); }).join('');
    bindRoom2Step1ItemEvents(container);
    updateRoom2Step1Count();
    if (items.length > 0) await loadCategoriesIntoStepItems(container, items, 1);
  }
  function initRoom2Step1() {
    var addBtn = document.getElementById('room2-step1-add-btn');
    var saveBtn = document.getElementById('room2-step1-save-btn');
    var uploadInput = document.getElementById('room2-step1-icon-upload');
    if (addBtn && !addBtn._room2Bound) {
      addBtn._room2Bound = true;
      addBtn.addEventListener('click', function() {
        var container = document.getElementById('room2-step1-items');
        if (!container) return;
        var firstMuted = container.querySelector('.text-muted');
        if (firstMuted) firstMuted.remove();
        var id = 'i' + Date.now();
        var newRow = document.createElement('div');
        newRow.className = 'room-step-item border-bottom pb-2 mb-2';
        newRow.setAttribute('data-id', id);
        newRow.innerHTML = '<div class="d-flex align-items-center flex-wrap gap-2">' +
          '<div class="room-step-preview" style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;background:#fff;border:1px solid #ddd;border-radius:8px;"><i class="fa fa-circle" style="font-size:28px;color:#333;"></i></div>' +
          '<input type="text" class="form-control form-control-sm room-step-name" placeholder="Название" style="width:130px">' +
          '<input type="text" class="form-control form-control-sm room-step-icon" placeholder="fa-couch или URL" value="fa-circle" style="width:180px">' +
          '<button type="button" class="btn btn-sm btn-outline-secondary room-step-upload-btn" title="Загрузить картинку"><i class="fa fa-upload"></i> Загрузить</button>' +
          '<input type="text" class="form-control form-control-sm room-step-key" placeholder="Ключ" style="width:100px">' +
          '<select class="form-control form-control-sm room-step-category" style="width:130px"><option value="">— Категория —</option></select>' +
          '<input type="number" class="form-control form-control-sm room-step-order" value="0" style="width:50px">' +
          '<button type="button" class="btn btn-sm btn-outline-danger room-step-del" title="Удалить"><i class="fa fa-trash"></i></button>' +
          '</div>' +
          '<div class="d-flex align-items-center flex-wrap gap-2 mt-2">' +
          '<span class="text-muted" style="font-size:12px;width:56px;flex-shrink:0;">Фото</span>' +
          '<input type="text" class="form-control form-control-sm room-step-image" placeholder="Путь к фото (/files/…)" style="width:220px;" title="Фотография карточки в конструкторе">' +
          '<button type="button" class="btn btn-sm btn-outline-secondary room-step-image-upload-btn" title="Загрузить фото карточки"><i class="fa fa-image"></i> Фото карточки</button>' +
          '</div>';
        container.appendChild(newRow);
        bindRoom2Step1ItemEvents(container);
        updateRoom2Step1Count();
        populateCategorySelect(newRow.querySelector('.room-step-category'), newRow, 1);
      });
    }
    if (saveBtn && !saveBtn._room2Bound) {
      saveBtn._room2Bound = true;
      saveBtn.addEventListener('click', function() {
        var cfg = saveRoom2Step1ToConfig();
        if (saveRoomStepsConfig(cfg)) {
          if (typeof toastr !== 'undefined') toastr.success('Шаг 1 сохранён');
          else alert('Шаг 1 сохранён');
        } else {
          if (typeof toastr !== 'undefined') toastr.error('Ошибка сохранения');
          else alert('Ошибка сохранения');
        }
      });
    }
    if (uploadInput && !uploadInput._room2Bound) {
      uploadInput._room2Bound = true;
      uploadInput.addEventListener('change', function() {
        var target = window._roomStepUploadTarget;
        window._roomStepUploadTarget = null;
        var file = this.files && this.files[0];
        if (!file || !target) { this.value = ''; return; }
        var fd = new FormData();
        fd.append('file', file);
        var inputEl = this;
        fetch('/api/upload/room_icon', { method: 'POST', body: fd })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            inputEl.value = '';
            if (data.files && data.files[0] && data.files[0].url) {
              target.value = data.files[0].url;
              target.dispatchEvent(new Event('input', { bubbles: true }));
              if (typeof toastr !== 'undefined') toastr.success('Картинка загружена');
            } else if (typeof toastr !== 'undefined') toastr.error(data.error || 'Ошибка загрузки');
          })
          .catch(function(err) { inputEl.value = ''; if (typeof toastr !== 'undefined') toastr.error('Ошибка загрузки'); });
      });
    }
  }
  function saveRoom2Step2ToConfig() {
    var config = getRoomStepsConfig();
    config = ensureStepsInConfig(config);
    var step = config.steps.find(function(s) { return s.stepId === 2; });
    if (!step) return config;
    var titleEl = document.getElementById('room2-step2-title');
    var colsEl = document.getElementById('room2-step2-columns');
    var container = document.getElementById('room2-step2-items');
    step.title = (titleEl && titleEl.value) ? titleEl.value.trim() : (step.title || 'Конфигурация мебели');
    step.columnsPerRow = colsEl && colsEl.value ? Math.max(1, Math.min(3, parseInt(colsEl.value, 10) || 2)) : 2;
    step.items = [];
    if (container) {
      container.querySelectorAll('.room-step-item').forEach(function(row, idx) {
        var name = (row.querySelector('.room-step-name') && row.querySelector('.room-step-name').value || '').trim();
        var icon = (row.querySelector('.room-step-icon') && row.querySelector('.room-step-icon').value || '').trim();
        var key = (row.querySelector('.room-step-key') && row.querySelector('.room-step-key').value || '').trim();
        var cat = row.querySelector('.room-step-category') ? row.querySelector('.room-step-category').value : '';
        var order = parseInt((row.querySelector('.room-step-order') && row.querySelector('.room-step-order').value) || '0', 10);
        step.items.push({
          id: row.getAttribute('data-id') || 'i' + idx,
          name: name || 'Пункт ' + (idx + 1),
          icon: icon || 'fa-circle',
          key: key || 'item-' + idx,
          categoryId: cat && /^\d+$/.test(String(cat)) ? parseInt(cat, 10) : null,
          order: order,
        });
      });
    }
    return config;
  }
  function updateRoom2Step2Count() {
    var container = document.getElementById('room2-step2-items');
    var countEl = document.getElementById('room2-step2-items-count');
    if (countEl && container) countEl.textContent = container.querySelectorAll('.room-step-item').length;
  }
  function bindRoom2Step2ItemEvents(container) {
    if (!container) return;
    var uploadInput = document.getElementById('room2-step2-icon-upload');
    container.querySelectorAll('.room-step-del').forEach(function(btn) {
      btn.addEventListener('click', function() {
        this.closest('.room-step-item')?.remove();
        updateRoom2Step2Count();
      });
    });
    container.querySelectorAll('.room-step-icon').forEach(function(input) {
      input.addEventListener('input', function() {
        var itemEl = this.closest('.room-step-item');
        var prev = itemEl?.querySelector('.room-step-preview');
        if (!prev) return;
        var v = this.value.trim();
        var isShape = v.indexOf('shape:') === 0;
        var isImg = !isShape && (/^https?:\/\//i.test(v) || v.startsWith('/'));
        if (isImg) prev.innerHTML = '<img src="' + v.replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:contain;border-radius:6px;" onerror="this.style.display=\'none\';"><i class="fa fa-image" style="font-size:24px;color:#999;"></i>';
        else if (isShape) prev.innerHTML = '<span class="text-muted" style="font-size:11px;">схема</span>';
        else prev.innerHTML = '<i class="fa ' + (v || 'fa-circle') + '" style="font-size:28px;color:#333;"></i>';
      });
    });
    container.querySelectorAll('.room-step-upload-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var row = this.closest('.room-step-item');
        var iconInput = row ? row.querySelector('.room-step-icon') : null;
        var prev = row ? row.querySelector('.room-step-preview') : null;
        if (!iconInput) return;
        if (typeof window.openFileManager === 'function') {
          window.openFileManager({
            allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
            initialPath: 'room_icons',
            onSelect: function(r) {
              if (r && r.url && iconInput) {
                iconInput.value = r.url;
                iconInput.dispatchEvent(new Event('input', { bubbles: true }));
                if (prev) prev.innerHTML = '<img src="' + (r.url || '').replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:contain;border-radius:6px;">';
              }
            }
          });
        } else if (window.toastr) window.toastr.warning('Файловый менеджер не загружен.');
        else alert('Файловый менеджер недоступен.');
      });
    });
  }
  async function renderRoom2Step2Panel() {
    await hydrateRoomStepsConfigFromServer();
    var config = getRoomStepsConfig();
    config = ensureStepsInConfig(config);
    var step = config.steps.find(function(s) { return s.stepId === 2; }) || config.steps[0];
    var titleEl = document.getElementById('room2-step2-title');
    var colsEl = document.getElementById('room2-step2-columns');
    var container = document.getElementById('room2-step2-items');
    if (!container) return;
    if (titleEl) titleEl.value = step.title || 'Конфигурация мебели';
    if (colsEl) colsEl.value = String(step.columnsPerRow && step.columnsPerRow >= 1 && step.columnsPerRow <= 3 ? step.columnsPerRow : 2);
    var items = Array.isArray(step.items) ? step.items : [];
    container.innerHTML = items.length === 0
      ? '<div class="text-muted p-2">Нет иконок. Нажмите «Добавить иконку» или «Заполнить из шаблона раскладок».</div>'
      : items.sort(function(a, b) { return (a.order || 0) - (b.order || 0); }).map(function(it, idx) { return buildStepItemHtml(it, idx); }).join('');
    bindRoom2Step2ItemEvents(container);
    updateRoom2Step2Count();
    if (items.length > 0) await loadCategoriesIntoStepItems(container, items, 2);
  }
  function initRoom2Step2() {
    var addBtn = document.getElementById('room2-step2-add-btn');
    var saveBtn = document.getElementById('room2-step2-save-btn');
    var fillBtn = document.getElementById('room2-step2-fill-layouts-btn');
    var uploadInput = document.getElementById('room2-step2-icon-upload');
    if (fillBtn && !fillBtn._room2Bound) {
      fillBtn._room2Bound = true;
      fillBtn.addEventListener('click', function() {
        var cfg = saveRoom2Step2ToConfig();
        var step2 = cfg.steps.find(function(s) { return s.stepId === 2; });
        if (step2) {
          step2.items = DEFAULT_LAYOUT_ITEMS.map(function(it, i) { return { id: it.id, name: it.name, icon: it.icon, key: it.key, categoryId: null, order: i }; });
          saveRoomStepsConfig(cfg);
          renderRoom2Step2Panel();
          if (typeof toastr !== 'undefined') toastr.success('Шаг 2 заполнен шаблоном раскладок');
          else alert('Шаг 2 заполнен шаблоном раскладок');
        }
      });
    }
    if (addBtn && !addBtn._room2Bound) {
      addBtn._room2Bound = true;
      addBtn.addEventListener('click', function() {
        var container = document.getElementById('room2-step2-items');
        if (!container) return;
        var firstMuted = container.querySelector('.text-muted');
        if (firstMuted) firstMuted.remove();
        var id = 'i' + Date.now();
        var newRow = document.createElement('div');
        newRow.className = 'room-step-item border-bottom pb-2 mb-2';
        newRow.setAttribute('data-id', id);
        newRow.innerHTML = '<div class="d-flex align-items-center flex-wrap gap-2">' +
          '<div class="room-step-preview" style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;background:#fff;border:1px solid #ddd;border-radius:8px;"><i class="fa fa-circle" style="font-size:28px;color:#333;"></i></div>' +
          '<input type="text" class="form-control form-control-sm room-step-name" placeholder="Название" style="width:130px">' +
          '<input type="text" class="form-control form-control-sm room-step-icon" placeholder="fa-couch или shape:top-wall" value="fa-circle" style="width:180px">' +
          '<button type="button" class="btn btn-sm btn-outline-secondary room-step-upload-btn" title="Загрузить картинку"><i class="fa fa-upload"></i> Загрузить</button>' +
          '<input type="text" class="form-control form-control-sm room-step-key" placeholder="Ключ" style="width:100px">' +
          '<select class="form-control form-control-sm room-step-category" style="width:130px"><option value="">— Категория —</option></select>' +
          '<input type="number" class="form-control form-control-sm room-step-order" value="0" style="width:50px">' +
          '<button type="button" class="btn btn-sm btn-outline-danger room-step-del" title="Удалить"><i class="fa fa-trash"></i></button>' +
          '</div>';
        container.appendChild(newRow);
        bindRoom2Step2ItemEvents(container);
        updateRoom2Step2Count();
        populateCategorySelect(newRow.querySelector('.room-step-category'), newRow, 2);
      });
    }
    if (saveBtn && !saveBtn._room2Bound) {
      saveBtn._room2Bound = true;
      saveBtn.addEventListener('click', function() {
        var cfg = saveRoom2Step2ToConfig();
        if (saveRoomStepsConfig(cfg)) {
          if (typeof toastr !== 'undefined') toastr.success('Шаг 2 сохранён');
          else alert('Шаг 2 сохранён');
        } else {
          if (typeof toastr !== 'undefined') toastr.error('Ошибка сохранения');
          else alert('Ошибка сохранения');
        }
      });
    }
    if (uploadInput && !uploadInput._room2Bound) {
      uploadInput._room2Bound = true;
      uploadInput.addEventListener('change', function() {
        var target = window._roomStepUploadTarget;
        window._roomStepUploadTarget = null;
        var file = this.files && this.files[0];
        if (!file || !target) { this.value = ''; return; }
        var fd = new FormData();
        fd.append('file', file);
        var inputEl = this;
        fetch('/api/upload/room_icon', { method: 'POST', body: fd })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            inputEl.value = '';
            if (data.files && data.files[0] && data.files[0].url) {
              target.value = data.files[0].url;
              target.dispatchEvent(new Event('input', { bubbles: true }));
              if (typeof toastr !== 'undefined') toastr.success('Картинка загружена');
            } else if (typeof toastr !== 'undefined') toastr.error(data.error || 'Ошибка загрузки');
          })
          .catch(function(err) { inputEl.value = ''; if (typeof toastr !== 'undefined') toastr.error('Ошибка загрузки'); });
      });
    }
  }
  function saveRoom2Step3ToConfig() {
    var config = getRoomStepsConfig();
    config = ensureStepsInConfig(config);
    var step = config.steps.find(function(s) { return s.stepId === 3; });
    if (!step) return config;
    var titleEl = document.getElementById('room2-step3-title');
    var colsEl = document.getElementById('room2-step3-columns');
    var container = document.getElementById('room2-step3-items');
    step.title = (titleEl && titleEl.value) ? titleEl.value.trim() : (step.title || DEFAULT_STEP_TITLES[3] || 'С чего начнём?');
    step.columnsPerRow = colsEl && colsEl.value ? Math.max(1, Math.min(3, parseInt(colsEl.value, 10) || 2)) : 2;
    var prevItems = Array.isArray(step.items) ? step.items.slice() : [];
    step.items = [];
    if (container) {
      container.querySelectorAll('.room-step-item').forEach(function(row, idx) {
        var name = (row.querySelector('.room-step-name') && row.querySelector('.room-step-name').value || '').trim();
        var icon = (row.querySelector('.room-step-icon') && row.querySelector('.room-step-icon').value || '').trim();
        var key = (row.querySelector('.room-step-key') && row.querySelector('.room-step-key').value || '').trim();
        var cat = row.querySelector('.room-step-category') ? row.querySelector('.room-step-category').value : '';
        var order = parseInt((row.querySelector('.room-step-order') && row.querySelector('.room-step-order').value) || '0', 10);
        var imageEl = row.querySelector('.room-step-image');
        var rowId = row.getAttribute('data-id') || 'i' + idx;
        var prev = prevItems.find(function (p) { return p && String(p.id) === String(rowId); });
        step.items.push({
          id: rowId,
          name: name || 'Пункт ' + (idx + 1),
          icon: icon || 'fa-circle',
          image: imageEl ? (imageEl.value || '').trim() : ((prev && prev.image) || ''),
          key: key || 'item-' + idx,
          categoryId: cat && /^\d+$/.test(String(cat)) ? parseInt(cat, 10) : null,
          order: order,
        });
      });
    }
    return config;
  }
  function updateRoom2Step3Count() {
    var container = document.getElementById('room2-step3-items');
    var countEl = document.getElementById('room2-step3-items-count');
    if (countEl && container) countEl.textContent = container.querySelectorAll('.room-step-item').length;
  }
  function bindRoom2Step3ItemEvents(container) {
    if (!container) return;
    var uploadInput = document.getElementById('room2-step3-icon-upload');
    container.querySelectorAll('.room-step-del').forEach(function(btn) {
      btn.addEventListener('click', function() {
        this.closest('.room-step-item')?.remove();
        updateRoom2Step3Count();
      });
    });
    container.querySelectorAll('.room-step-icon').forEach(function(input) {
      input.addEventListener('input', function() {
        var itemEl = this.closest('.room-step-item');
        var prev = itemEl?.querySelector('.room-step-preview');
        if (!prev) return;
        var imageInput = itemEl ? itemEl.querySelector('.room-step-image') : null;
        var imageVal = imageInput ? (imageInput.value || '').trim() : '';
        if (imageVal && imageVal.charAt(0) === '/') {
          prev.innerHTML = '<img src="' + imageVal.replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" onerror="this.style.display=\'none\';"><i class="fa fa-image" style="font-size:24px;color:#999;"></i>';
          return;
        }
        var v = this.value.trim();
        var isShape = v.indexOf('shape:') === 0;
        var isImg = !isShape && (/^https?:\/\//i.test(v) || v.startsWith('/'));
        if (isImg) prev.innerHTML = '<img src="' + v.replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:contain;border-radius:6px;" onerror="this.style.display=\'none\';"><i class="fa fa-image" style="font-size:24px;color:#999;"></i>';
        else if (isShape) prev.innerHTML = '<span class="text-muted" style="font-size:11px;">схема</span>';
        else prev.innerHTML = '<i class="fa ' + (v || 'fa-circle') + '" style="font-size:28px;color:#333;"></i>';
      });
    });
    container.querySelectorAll('.room-step-upload-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var row = this.closest('.room-step-item');
        var iconInput = row ? row.querySelector('.room-step-icon') : null;
        var prev = row ? row.querySelector('.room-step-preview') : null;
        if (!iconInput) return;
        if (typeof window.openFileManager === 'function') {
          window.openFileManager({
            allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
            initialPath: 'room_icons',
            onSelect: function(r) {
              if (r && r.url && iconInput) {
                iconInput.value = r.url;
                iconInput.dispatchEvent(new Event('input', { bubbles: true }));
                if (prev) prev.innerHTML = '<img src="' + (r.url || '').replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:contain;border-radius:6px;">';
              }
            }
          });
        } else if (window.toastr) window.toastr.warning('Файловый менеджер не загружен.');
        else alert('Файловый менеджер недоступен.');
      });
    });
    container.querySelectorAll('.room-step-image-upload-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var row = this.closest('.room-step-item');
        var imageInput = row ? row.querySelector('.room-step-image') : null;
        var prev = row ? row.querySelector('.room-step-preview') : null;
        if (!imageInput) return;
        if (typeof window.openFileManager === 'function') {
          window.openFileManager({
            allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'],
            initialPath: 'room_icons',
            onSelect: function(r) {
              if (r && r.url && imageInput) {
                imageInput.value = r.url;
                imageInput.dispatchEvent(new Event('input', { bubbles: true }));
                if (prev) prev.innerHTML = '<img src="' + (r.url || '').replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">';
              }
            }
          });
        } else if (window.toastr) window.toastr.warning('Файловый менеджер не загружен.');
        else alert('Файловый менеджер недоступен.');
      });
    });
    container.querySelectorAll('.room-step-image').forEach(function(input) {
      input.addEventListener('input', function() {
        var itemEl = this.closest('.room-step-item');
        var prev = itemEl ? itemEl.querySelector('.room-step-preview') : null;
        if (!prev) return;
        var v = this.value.trim();
        if (v && (v.charAt(0) === '/' || /^https?:\/\//i.test(v))) {
          prev.innerHTML = '<img src="' + v.replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" onerror="this.style.display=\'none\';"><i class="fa fa-image" style="font-size:24px;color:#999;"></i>';
        }
      });
    });
  }
  async function renderRoom2Step3Panel() {
    var config = getRoomStepsConfig();
    config = ensureStepsInConfig(config);
    var step = config.steps.find(function(s) { return s.stepId === 3; });
    if (!step) {
      config.steps.push({ stepId: 3, title: DEFAULT_STEP_TITLES[3] || 'С чего начнём?', items: [], columnsPerRow: 2 });
      step = config.steps[config.steps.length - 1];
    }
    var titleEl = document.getElementById('room2-step3-title');
    var colsEl = document.getElementById('room2-step3-columns');
    var container = document.getElementById('room2-step3-items');
    var headingEl = document.getElementById('room2-step3-heading-title');
    if (headingEl) headingEl.textContent = step.title || DEFAULT_STEP_TITLES[3] || 'С чего начнём?';
    if (!container) return;
    if (titleEl) titleEl.value = step.title || DEFAULT_STEP_TITLES[3] || 'С чего начнём?';
    if (colsEl) colsEl.value = String(step.columnsPerRow && step.columnsPerRow >= 1 && step.columnsPerRow <= 3 ? step.columnsPerRow : 2);
    var ibox = container.closest('.ibox');
    var iboxTitle = ibox ? ibox.querySelector('.ibox-title h5') : null;
    if (iboxTitle) iboxTitle.textContent = 'Пункты шага «' + (step.title || DEFAULT_STEP_TITLES[3] || 'С чего начнём?') + '»';
    var items = Array.isArray(step.items) ? step.items : [];
    container.innerHTML = items.length === 0
      ? '<div class="text-muted p-2">Нет иконок. Нажмите «Добавить иконку».</div>'
      : items.sort(function(a, b) { return (a.order || 0) - (b.order || 0); }).map(function(it, idx) { return buildStepItemHtml(it, idx, { includeImage: true }); }).join('');
    bindRoom2Step3ItemEvents(container);
    updateRoom2Step3Count();
    if (items.length > 0) await loadCatalogTypesIntoStep3Items(container, items);
  }
  function initRoom2Step3() {
    var addBtn = document.getElementById('room2-step3-add-btn');
    var saveBtn = document.getElementById('room2-step3-save-btn');
    var uploadInput = document.getElementById('room2-step3-icon-upload');
    if (addBtn && !addBtn._room2Bound) {
      addBtn._room2Bound = true;
      addBtn.addEventListener('click', function() {
        var container = document.getElementById('room2-step3-items');
        if (!container) return;
        var firstMuted = container.querySelector('.text-muted');
        if (firstMuted) firstMuted.remove();
        var id = 'i' + Date.now();
        var newRow = document.createElement('div');
        newRow.className = 'room-step-item border-bottom pb-2 mb-2';
        newRow.setAttribute('data-id', id);
        newRow.innerHTML = '<div class="d-flex align-items-center flex-wrap gap-2">' +
          '<div class="room-step-preview" style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;background:#fff;border:1px solid #ddd;border-radius:8px;"><i class="fa fa-circle" style="font-size:28px;color:#333;"></i></div>' +
          '<input type="text" class="form-control form-control-sm room-step-name" placeholder="Название" style="width:130px">' +
          '<input type="text" class="form-control form-control-sm room-step-icon" placeholder="fa-couch или URL" value="fa-circle" style="width:180px">' +
          '<button type="button" class="btn btn-sm btn-outline-secondary room-step-upload-btn" title="Загрузить картинку"><i class="fa fa-upload"></i> Загрузить</button>' +
          '<input type="text" class="form-control form-control-sm room-step-key" placeholder="Ключ" style="width:100px">' +
          '<select class="form-control form-control-sm room-step-category" style="width:130px"><option value="">— Категория —</option></select>' +
          '<input type="number" class="form-control form-control-sm room-step-order" value="0" style="width:50px">' +
          '<button type="button" class="btn btn-sm btn-outline-danger room-step-del" title="Удалить"><i class="fa fa-trash"></i></button>' +
          '</div>' +
          '<div class="d-flex align-items-center flex-wrap gap-2 mt-2">' +
          '<span class="text-muted" style="font-size:12px;width:56px;flex-shrink:0;">Фото</span>' +
          '<input type="text" class="form-control form-control-sm room-step-image" placeholder="Путь к фото (/files/…)" style="width:220px;" title="Фотография карточки в конструкторе">' +
          '<button type="button" class="btn btn-sm btn-outline-secondary room-step-image-upload-btn" title="Загрузить фото карточки"><i class="fa fa-image"></i> Фото карточки</button>' +
          '</div>';
        container.appendChild(newRow);
        bindRoom2Step3ItemEvents(container);
        updateRoom2Step3Count();
        populateCategorySelect(newRow.querySelector('.room-step-category'), newRow, 3);
      });
    }
    if (saveBtn && !saveBtn._room2Bound) {
      saveBtn._room2Bound = true;
      saveBtn.addEventListener('click', function() {
        var cfg = saveRoom2Step3ToConfig();
        if (saveRoomStepsConfig(cfg)) {
          if (typeof toastr !== 'undefined') toastr.success('Шаг 3 сохранён');
          else alert('Шаг 3 сохранён');
          renderRoom2Step3Panel();
        } else {
          if (typeof toastr !== 'undefined') toastr.error('Ошибка сохранения');
          else alert('Ошибка сохранения');
        }
      });
    }
    if (uploadInput && !uploadInput._room2Bound) {
      uploadInput._room2Bound = true;
      uploadInput.addEventListener('change', function() {
        var target = window._roomStepUploadTarget;
        window._roomStepUploadTarget = null;
        var file = this.files && this.files[0];
        if (!file || !target) { this.value = ''; return; }
        var fd = new FormData();
        fd.append('file', file);
        var inputEl = this;
        fetch('/api/upload/room_icon', { method: 'POST', body: fd })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            inputEl.value = '';
            if (data.files && data.files[0] && data.files[0].url) {
              target.value = data.files[0].url;
              target.dispatchEvent(new Event('input', { bubbles: true }));
              if (typeof toastr !== 'undefined') toastr.success('Картинка загружена');
            } else if (typeof toastr !== 'undefined') toastr.error(data.error || 'Ошибка загрузки');
          })
          .catch(function(err) { inputEl.value = ''; if (typeof toastr !== 'undefined') toastr.error('Ошибка загрузки'); });
      });
    }
  }
  // Овальные кнопки — название и категория (подкатегория внутри каталога шага 3: без дверей, с дверями и т.д.)
  function buildRoom2Step4PillHtml(it, idx) {
    var df = it.cabinetDoorFilter;
    var selAll = df !== 'single' && df !== 'double' ? ' selected' : '';
    var selSingle = df === 'single' ? ' selected' : '';
    var selDouble = df === 'double' ? ' selected' : '';
    var pg = it.pillGroup != null ? parseInt(it.pillGroup, 10) : 0;
    if (!Number.isFinite(pg) || pg < 0) pg = 0;
    var g0 = pg === 0 ? ' selected' : '';
    var g1 = pg === 1 ? ' selected' : '';
    var g2 = pg === 2 ? ' selected' : '';
    return '<div class="room-step-pill-item border-bottom pb-2 mb-2" data-id="' + (it.id || ('p' + idx)).toString().replace(/"/g, '&quot;') + '">' +
      '<div class="d-flex align-items-center flex-wrap gap-2">' +
      '<select class="form-control form-control-sm room-step-pill-group" style="width:88px" title="Ряд овала в комнате: в каждом ряду одна активная кнопка, фильтр = пересечение рядов (И).">' +
      '<option value="0"' + g0 + '>Ряд 1</option>' +
      '<option value="1"' + g1 + '>Ряд 2</option>' +
      '<option value="2"' + g2 + '>Ряд 3</option>' +
      '</select>' +
      '<input type="text" class="form-control form-control-sm room-step-pill-name" placeholder="Название" value="' + (it.name || '').replace(/"/g, '&quot;').replace(/</g, '&lt;') + '" style="width:200px">' +
      '<select class="form-control form-control-sm room-step-pill-category" style="width:165px"><option value="">— Подкатегория —</option></select>' +
      '<select class="form-control form-control-sm room-step-pill-or-category" style="width:130px" title="ИЛИ: вторая категория (OR-логика). Используйте для кнопки \\"с дверями\\" = Однодверные ИЛИ Двухдверные"><option value="">— ИЛИ кат. —</option></select>' +
      '<select class="form-control form-control-sm room-step-pill-door-filter" style="width:185px" title="Тип зоны и каталога: однодверная / двустворчатая секция. Связано с меткой doorKind у карточек каталога.">' +
      '<option value=""' + selAll + '>Тип зоны: любой</option>' +
      '<option value="single"' + selSingle + '>Тип зоны: однодверные</option>' +
      '<option value="double"' + selDouble + '>Тип зоны: двустворчатые</option>' +
      '</select>' +
      '<input type="number" class="form-control form-control-sm room-step-pill-order" value="' + (it.order ?? idx) + '" style="width:50px" placeholder="Порядок">' +
      '<button type="button" class="btn btn-sm btn-outline-danger room-step-pill-del" title="Удалить"><i class="fa fa-trash"></i></button>' +
      '</div></div>';
  }
  // Модули с иконками — как в шаге 1-3 (загрузка иконки, название, категория)
  function buildRoom2Step4ModuleHtml(it, idx) {
    var iconVal = (it.icon || '').trim();
    var isShape = iconVal.indexOf('shape:') === 0;
    var isImg = !isShape && (/^https?:\/\//i.test(iconVal) || iconVal.startsWith('/'));
    var preview = isImg
      ? '<img src="' + iconVal.replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:contain;border-radius:6px;" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline-block\';"><i class="fa fa-image" style="display:none;font-size:24px;color:#999;"></i>'
      : isShape
        ? '<span class="text-muted" style="font-size:11px;">схема</span>'
        : '<i class="fa ' + (iconVal || 'fa-circle').replace(/"/g, '') + '" style="font-size:28px;color:#333;"></i>';
    return '<div class="room-step-item border-bottom pb-2 mb-2" data-id="' + (it.id || ('i' + idx)).toString().replace(/"/g, '&quot;') + '">' +
      '<div class="d-flex align-items-center flex-wrap gap-2">' +
      '<div class="room-step-preview" style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;background:#fff;border:1px solid #ddd;border-radius:8px;flex-shrink:0;">' + preview + '</div>' +
      '<input type="text" class="form-control form-control-sm room-step-name" placeholder="Название" value="' + (it.name || '').replace(/"/g, '&quot;').replace(/</g, '&lt;') + '" style="width:130px">' +
      '<input type="text" class="form-control form-control-sm room-step-icon" placeholder="fa-couch или URL" value="' + iconVal.replace(/"/g, '&quot;').replace(/</g, '&lt;') + '" style="width:180px">' +
      '<button type="button" class="btn btn-sm btn-outline-secondary room-step-upload-btn" title="Загрузить картинку"><i class="fa fa-upload"></i> Загрузить</button>' +
      '<input type="text" class="form-control form-control-sm room-step-key" placeholder="Ключ" value="' + (it.key || '').replace(/"/g, '&quot;').replace(/</g, '&lt;') + '" style="width:100px">' +
      '<select class="form-control form-control-sm room-step-category" style="width:130px"><option value="">— Категория —</option></select>' +
      '<input type="number" class="form-control form-control-sm room-step-order" value="' + (it.order ?? idx) + '" style="width:50px">' +
      '<button type="button" class="btn btn-sm btn-outline-danger room-step-del" title="Удалить"><i class="fa fa-trash"></i></button>' +
      '</div></div>';
  }
  function getStep4PillSetsApi() {
    return typeof ClodisRoomStep4PillSets !== 'undefined' ? ClodisRoomStep4PillSets : null;
  }
  function getSelectedStep4PillsFolderKey() {
    var sel = document.getElementById('room2-step4-pills-folder-select');
    return sel && sel.value ? String(sel.value).trim() : '';
  }
  /** Записать кнопки из DOM в step.pillSets[выбранная папка]. */
  function persistStep4PillsDomToStep(step) {
    var api = getStep4PillSetsApi();
    if (!api || !step) return;
    var folderKey = getSelectedStep4PillsFolderKey();
    if (!folderKey) return;
    var pillsContainer = document.getElementById('room2-step4-pills');
    var pills = api.readPillsFromAdminContainer(pillsContainer);
    api.setStep4PillsForFolder(step, folderKey, pills);
  }
  function populateStep4PillsFolderSelect(config, selectedKey) {
    var sel = document.getElementById('room2-step4-pills-folder-select');
    if (!sel) return '';
    var api = getStep4PillSetsApi();
    var folders = api ? api.getStep3CatalogFolders(config) : [];
    if (folders.length === 0) {
      sel.innerHTML = '<option value="">— Нет папок: добавьте пункты в шаге 3 —</option>';
      return '';
    }
    var html = folders
      .map(function (f) {
        var k = (f.key || '').replace(/"/g, '&quot;');
        var label = (f.name || f.key || '').replace(/</g, '&lt;') + ' (ключ ' + k + ')';
        return '<option value="' + k + '">' + label + '</option>';
      })
      .join('');
    sel.innerHTML = html;
    var keys = folders.map(function (f) { return String(f.key).trim(); });
    var pick = selectedKey && keys.indexOf(String(selectedKey).trim()) >= 0
      ? String(selectedKey).trim()
      : keys[0];
    sel.value = pick;
    return pick;
  }
  function renderStep4PillsEditor(step, folderKey) {
    var pillsContainer = document.getElementById('room2-step4-pills');
    if (!pillsContainer) return;
    var api = getStep4PillSetsApi();
    var pills = api && folderKey
      ? (api.getStep4PillsRawForFolder
          ? api.getStep4PillsRawForFolder(step, folderKey, getRoomStepsConfig())
          : api.getStep4PillsForFolder(step, folderKey))
      : [];
    pillsContainer.innerHTML = pills.length === 0
      ? '<div class="text-muted p-2">Нет кнопок для этой папки. Нажмите «Добавить кнопку».</div>'
      : pills
          .sort(function (a, b) { return (a.order || 0) - (b.order || 0); })
          .map(function (it, idx) { return buildRoom2Step4PillHtml(it, idx); })
          .join('');
    bindRoom2Step4PillEvents(pillsContainer);
    updateRoom2Step4PillsCount();
    loadCategoriesIntoPills(pillsContainer, pills, folderKey);
  }
  function saveRoom2Step4ToConfig() {
    var config = getRoomStepsConfig();
    config = ensureStepsInConfig(config);
    var step = config.steps.find(function (s) { return s.stepId === 4; });
    if (!step) return config;
    var api = getStep4PillSetsApi();
    if (api) api.ensureStep4PillSets(step, config);
    var titleEl = document.getElementById('room2-step4-title');
    var colsEl = document.getElementById('room2-step4-columns');
    var pillsContainer = document.getElementById('room2-step4-pills');
    var itemsContainer = document.getElementById('room2-step4-items');
    var zoneEditTitleEl = document.getElementById('room2-step4-zoneedit-title');
    var zoneEditTextEl = document.getElementById('room2-step4-zoneedit-text');
    var depthMinEl = document.getElementById('room2-step4-depth-min');
    var depthMaxEl = document.getElementById('room2-step4-depth-max');
    var heightMinEl = document.getElementById('room2-step4-height-min');
    var heightMaxEl = document.getElementById('room2-step4-height-max');
    var heightLimitTextEl = document.getElementById('room2-step4-height-limit-text');
    var widthLimitTextEl = document.getElementById('room2-step4-width-limit-text');
    var depthLimitTextEl = document.getElementById('room2-step4-depth-limit-text');
    var depthOverSectionTextEl = document.getElementById('room2-step4-depth-over-section-text');
    step.title = (titleEl && titleEl.value) ? titleEl.value.trim() : (step.title || 'Шаг 4');
    step.columnsPerRow = (colsEl && colsEl.value) ? (parseInt(colsEl.value, 10) === 1 ? 1 : 2) : 2;
    step.items = [];
    persistStep4PillsDomToStep(step);
    // Модули с иконками: как в шаге 1-3
    step.moduleItems = [];
    if (itemsContainer) {
      itemsContainer.querySelectorAll('.room-step-item').forEach(function (row, idx) {
        var name = (row.querySelector('.room-step-name') && row.querySelector('.room-step-name').value || '').trim();
        var icon = (row.querySelector('.room-step-icon') && row.querySelector('.room-step-icon').value || '').trim();
        var key = (row.querySelector('.room-step-key') && row.querySelector('.room-step-key').value || '').trim();
        var cat = row.querySelector('.room-step-category') ? row.querySelector('.room-step-category').value : '';
        var order = parseInt((row.querySelector('.room-step-order') && row.querySelector('.room-step-order').value) || String(idx), 10);
        step.moduleItems.push({
          id: row.getAttribute('data-id') || 'i' + idx,
          name: name || 'Модуль ' + (idx + 1),
          icon: icon || 'fa-circle',
          key: key || ('item-' + idx),
          categoryId: cat ? parseInt(cat, 10) : null,
          order: order
        });
      });
    }
    // Дополнительный блок: тексты попапа при клике на иконку редактирования модуля.
    step.zoneEditTitle = zoneEditTitleEl && zoneEditTitleEl.value
      ? zoneEditTitleEl.value.trim()
      : (step.zoneEditTitle || '');
    step.zoneEditText = zoneEditTextEl && zoneEditTextEl.value
      ? zoneEditTextEl.value
      : (step.zoneEditText || '');
    // Ограничения глубины модуля (в см) + тексты попапов при выходе за пределы.
    var dMin = depthMinEl && depthMinEl.value ? parseFloat(depthMinEl.value.replace(',', '.')) : null;
    var dMax = depthMaxEl && depthMaxEl.value ? parseFloat(depthMaxEl.value.replace(',', '.')) : null;
    var depthLimitTextEl = document.getElementById('room2-step4-depth-limit-text');
    step.zoneEditDepthMinCm = isFinite(dMin) && dMin > 0 ? dMin : (step.zoneEditDepthMinCm || null);
    step.zoneEditDepthMaxCm = isFinite(dMax) && dMax > 0 ? dMax : (step.zoneEditDepthMaxCm || null);
    step.zoneEditDepthLimitText = depthLimitTextEl && depthLimitTextEl.value
      ? depthLimitTextEl.value
      : (step.zoneEditDepthLimitText || '');
    var depthOverSectionTextEl = document.getElementById('room2-step4-depth-over-section-text');
    step.zoneEditDepthOverSectionText = depthOverSectionTextEl && depthOverSectionTextEl.value
      ? depthOverSectionTextEl.value
      : (step.zoneEditDepthOverSectionText || '');
    var hMin = heightMinEl && heightMinEl.value ? parseFloat(heightMinEl.value.replace(',', '.')) : null;
    var hMax = heightMaxEl && heightMaxEl.value ? parseFloat(heightMaxEl.value.replace(',', '.')) : null;
    step.zoneEditHeightMinCm = isFinite(hMin) && hMin > 0 ? hMin : (step.zoneEditHeightMinCm || null);
    step.zoneEditHeightMaxCm = isFinite(hMax) && hMax > 0 ? hMax : (step.zoneEditHeightMaxCm || null);
    step.zoneEditHeightLimitText = heightLimitTextEl && heightLimitTextEl.value
      ? heightLimitTextEl.value
      : (step.zoneEditHeightLimitText || '');
    step.zoneEditWidthLimitText = widthLimitTextEl && widthLimitTextEl.value
      ? widthLimitTextEl.value
      : (step.zoneEditWidthLimitText || '');
    return config;
  }
  function updateRoom2Step4Count() {
    var container = document.getElementById('room2-step4-items');
    var countEl = document.getElementById('room2-step4-items-count');
    if (countEl && container) countEl.textContent = container.querySelectorAll('.room-step-item').length;
  }
  function updateRoom2Step4PillsCount() {
    var container = document.getElementById('room2-step4-pills');
    var countEl = document.getElementById('room2-step4-pills-count');
    if (countEl && container) countEl.textContent = container.querySelectorAll('.room-step-pill-item').length;
  }
  function readPillRowStateFromDom(row) {
    if (!row) return { categoryId: '', orCategoryId: '', doorFilter: '', pillGroup: '0' };
    var catSel = row.querySelector('.room-step-pill-category');
    var orSel = row.querySelector('.room-step-pill-or-category');
    var doorSel = row.querySelector('.room-step-pill-door-filter');
    var groupSel = row.querySelector('.room-step-pill-group');
    return {
      categoryId: catSel ? String(catSel.value || '') : '',
      orCategoryId: orSel ? String(orSel.value || '') : '',
      doorFilter: doorSel ? String(doorSel.value || '') : '',
      pillGroup: groupSel ? String(groupSel.value || '0') : '0',
    };
  }
  var __pillCategoryOptionsCache = {};
  async function loadCategoriesIntoPills(pillsContainer, items, catalogFolderKey) {
    if (!pillsContainer) return;
    var catKey = catalogFolderKey != null && String(catalogFolderKey).trim() !== ''
      ? String(catalogFolderKey).trim()
      : '26';
    var rows = pillsContainer.querySelectorAll('.room-step-pill-item');
    if (!rows.length) return;
    var domStates = [];
    rows.forEach(function (row) {
      domStates.push(readPillRowStateFromDom(row));
    });
    try {
      var cached = __pillCategoryOptionsCache[catKey];
      if (!cached) {
        var res = await fetch('/api/catalog/categories_get/catalog_' + encodeURIComponent(catKey));
        var cats = await res.json();
        var arr = Array.isArray(cats) ? cats : [];
        cached = {
          optionsHtml:
            '<option value="">— Подкатегория —</option>' +
            arr
              .map(function (c) {
                return (
                  '<option value="' +
                  (c.id || '') +
                  '">' +
                  (c.name || '').replace(/</g, '&lt;') +
                  '</option>'
                );
              })
              .join(''),
          orOptionsHtml:
            '<option value="">— ИЛИ кат. —</option>' +
            arr
              .map(function (c) {
                return (
                  '<option value="' +
                  (c.id || '') +
                  '">' +
                  (c.name || '').replace(/</g, '&lt;') +
                  '</option>'
                );
              })
              .join(''),
        };
        __pillCategoryOptionsCache[catKey] = cached;
      }
      var sorted = (items || []).slice().sort(function (a, b) {
        return (a.order || 0) - (b.order || 0);
      });
      rows.forEach(function (row, idx) {
        var sel = row.querySelector('.room-step-pill-category');
        var orSel = row.querySelector('.room-step-pill-or-category');
        var doorSel = row.querySelector('.room-step-pill-door-filter');
        var it = sorted[idx];
        var dom = domStates[idx] || {};
        var catVal =
          it && it.categoryId != null && it.categoryId !== ''
            ? String(it.categoryId)
            : dom.categoryId;
        var orVal =
          it && it.orCategoryId != null && it.orCategoryId !== ''
            ? String(it.orCategoryId)
            : dom.orCategoryId;
        var doorVal =
          it &&
          (it.cabinetDoorFilter === 'single' || it.cabinetDoorFilter === 'double')
            ? it.cabinetDoorFilter
            : dom.doorFilter;
        if (sel) {
          sel.innerHTML = cached.optionsHtml;
          if (catVal) sel.value = catVal;
        }
        if (orSel) {
          orSel.innerHTML = cached.orOptionsHtml;
          if (orVal) orSel.value = orVal;
        }
        if (doorSel && doorVal) doorSel.value = doorVal;
      });
    } catch (e) {}
  }
  async function loadCategoriesIntoPillRow(row, catalogFolderKey) {
    if (!row) return;
    var container = row.parentElement;
    if (!container) return;
    var api = getStep4PillSetsApi();
    var items = api ? api.readPillsFromAdminContainer(container) : [];
    await loadCategoriesIntoPills(container, items, catalogFolderKey);
  }
  function bindRoom2Step4ItemEvents(container) {
    if (!container) return;
    var uploadInput = document.getElementById('room2-step4-icon-upload');
    container.querySelectorAll('.room-step-del').forEach(function (btn) {
      btn.addEventListener('click', function () {
        this.closest('.room-step-item')?.remove();
        updateRoom2Step4Count();
      });
    });
    container.querySelectorAll('.room-step-icon').forEach(function (input) {
      input.addEventListener('input', function () {
        var itemEl = this.closest('.room-step-item');
        var prev = itemEl?.querySelector('.room-step-preview');
        if (!prev) return;
        var v = this.value.trim();
        var isShape = v.indexOf('shape:') === 0;
        var isImg = !isShape && (/^https?:\/\//i.test(v) || v.startsWith('/'));
        if (isImg) prev.innerHTML = '<img src="' + v.replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:contain;border-radius:6px;" onerror="this.style.display=\'none\';"><i class="fa fa-image" style="font-size:24px;color:#999;"></i>';
        else if (isShape) prev.innerHTML = '<span class="text-muted" style="font-size:11px;">схема</span>';
        else prev.innerHTML = '<i class="fa ' + (v || 'fa-circle') + '" style="font-size:28px;color:#333;"></i>';
      });
    });
    container.querySelectorAll('.room-step-upload-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var row = this.closest('.room-step-item');
        var iconInput = row ? row.querySelector('.room-step-icon') : null;
        var prev = row ? row.querySelector('.room-step-preview') : null;
        if (!iconInput) return;
        if (typeof window.openFileManager === 'function') {
          window.openFileManager({
            allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
            initialPath: 'room_icons',
            onSelect: function(r) {
              if (r && r.url && iconInput) {
                iconInput.value = r.url;
                iconInput.dispatchEvent(new Event('input', { bubbles: true }));
                if (prev) prev.innerHTML = '<img src="' + (r.url || '').replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:contain;border-radius:6px;">';
              }
            }
          });
        } else if (window.toastr) window.toastr.warning('Файловый менеджер не загружен.');
        else alert('Файловый менеджер недоступен.');
      });
    });
  }
  function bindRoom2Step4PillEvents(pillsContainer) {
    if (!pillsContainer) return;
    pillsContainer.querySelectorAll('.room-step-pill-del').forEach(function (btn) {
      btn.addEventListener('click', function () {
        this.closest('.room-step-pill-item')?.remove();
        updateRoom2Step4PillsCount();
      });
    });
  }
  var __room2Step4PillsFolderKey = '';
  async function renderRoom2Step4Panel() {
    var config = getRoomStepsConfig();
    config = ensureStepsInConfig(config);
    var step = config.steps.find(function (s) { return s.stepId === 4; });
    if (!step) {
      step = { stepId: 4, title: DEFAULT_STEP_TITLES[4] || 'Шаг 4', items: [], pillSets: {}, moduleItems: [], columnsPerRow: 2, price_subline: getDefaultPriceSubline() };
      config.steps.push(step);
      saveRoomStepsConfig(config);
    }
    var pillApi = getStep4PillSetsApi();
    if (pillApi) pillApi.ensureStep4PillSets(step, config);
    if (pillApi && pillApi.recoverStep4PillSetAliases(step, config)) {
      saveRoomStepsConfig(config);
    }
    if (pillApi && pillApi.seedDefaultStep4PillSetsIfEmpty(step, config)) {
      saveRoomStepsConfig(config);
    }
    if (!Array.isArray(step.moduleItems)) {
      step.moduleItems = [];
      if (Array.isArray(step.items) && step.items.length > 0 && step.items[0].icon !== undefined) {
        step.moduleItems = step.items.slice();
        step.items = [];
      }
      saveRoomStepsConfig(config);
    }
    var titleEl = document.getElementById('room2-step4-title');
    var colsEl = document.getElementById('room2-step4-columns');
    var pillsContainer = document.getElementById('room2-step4-pills');
    var itemsContainer = document.getElementById('room2-step4-items');
    var headingEl = document.getElementById('room2-step4-heading-title');
    if (headingEl) headingEl.textContent = 'Модули (иконки и названия)';
    if (titleEl) titleEl.value = step.title || 'Модули';
    if (colsEl) colsEl.value = String(step.columnsPerRow === 1 ? 1 : 2);
    var modules = Array.isArray(step.moduleItems) ? step.moduleItems : [];
    var folderKey = populateStep4PillsFolderSelect(
      config,
      __room2Step4PillsFolderKey || getSelectedStep4PillsFolderKey()
    );
    __room2Step4PillsFolderKey = folderKey;
    if (pillsContainer && folderKey && pillApi) {
      var rawPills = pillApi.getStep4PillsRawForFolder
        ? pillApi.getStep4PillsRawForFolder(step, folderKey, config)
        : pillApi.getStep4PillsForFolder(step, folderKey, config);
      renderStep4PillsEditor(step, folderKey);
    } else if (pillsContainer) {
      pillsContainer.innerHTML =
        '<div class="text-muted p-2">Сначала добавьте папки в <strong>шаге 3</strong> (Тумбы, Шкафы…), затем вернитесь сюда.</div>';
      updateRoom2Step4PillsCount();
    }
    if (itemsContainer) {
      itemsContainer.innerHTML = modules.length === 0
        ? '<div class="text-muted p-2">Нет модулей. Нажмите «Добавить модуль».</div>'
        : modules.sort(function (a, b) { return (a.order || 0) - (b.order || 0); }).map(function (it, idx) { return buildRoom2Step4ModuleHtml(it, idx); }).join('');
      bindRoom2Step4ItemEvents(itemsContainer);
      updateRoom2Step4Count();
      if (modules.length > 0) await loadCategoriesIntoStepItems(itemsContainer, modules);
    }
    upgradeRoom2Step4ZoneEditPanel();
    // Заполняем блок настройки кнопки редактирования модуля, если он есть.
    var zoneEditTitleEl = document.getElementById('room2-step4-zoneedit-title');
    var zoneEditTextEl = document.getElementById('room2-step4-zoneedit-text');
    var depthMinEl = document.getElementById('room2-step4-depth-min');
    var depthMaxEl = document.getElementById('room2-step4-depth-max');
    var heightMinEl = document.getElementById('room2-step4-height-min');
    var heightMaxEl = document.getElementById('room2-step4-height-max');
    var heightLimitTextEl = document.getElementById('room2-step4-height-limit-text');
    var widthLimitTextEl = document.getElementById('room2-step4-width-limit-text');
    var depthLimitTextEl = document.getElementById('room2-step4-depth-limit-text');
    var depthOverSectionTextEl = document.getElementById('room2-step4-depth-over-section-text');
    if (zoneEditTitleEl) zoneEditTitleEl.value = step.zoneEditTitle || '';
    if (zoneEditTextEl) zoneEditTextEl.value = step.zoneEditText || '';
    if (depthMinEl) depthMinEl.value = (step.zoneEditDepthMinCm != null ? step.zoneEditDepthMinCm : '').toString();
    if (depthMaxEl) depthMaxEl.value = (step.zoneEditDepthMaxCm != null ? step.zoneEditDepthMaxCm : '').toString();
    if (heightMinEl) heightMinEl.value = (step.zoneEditHeightMinCm != null ? step.zoneEditHeightMinCm : '').toString();
    if (heightMaxEl) heightMaxEl.value = (step.zoneEditHeightMaxCm != null ? step.zoneEditHeightMaxCm : '').toString();
    if (depthLimitTextEl) depthLimitTextEl.value = step.zoneEditDepthLimitText || '';
    if (depthOverSectionTextEl) depthOverSectionTextEl.value = step.zoneEditDepthOverSectionText || '';
    if (heightLimitTextEl) heightLimitTextEl.value = step.zoneEditHeightLimitText || '';
    if (widthLimitTextEl) widthLimitTextEl.value = step.zoneEditWidthLimitText || '';
  }

  /** Добавить блок высоты в старую панель (если HTML создавался до появления полей высоты). */
  function upgradeRoom2Step4ZoneEditPanel() {
    var content = document.querySelector('.room2-zone-edit-ibox .ibox-content');
    if (!content || document.getElementById('room2-step4-height-min')) return;
    var foot = content.querySelector('p.text-muted.mt-2');
    var html =
      '<div class="form-group room2-zone-edit-height-block" style="margin-top:16px;max-width:480px;">' +
      '  <label>Ограничения высоты тумбы (см)</label>' +
      '  <p class="text-muted mb-2" style="font-size:12px;">Только для тумб на полу. В попапе «Настройте модуль» — поле «Высота модуля».</p>' +
      '  <div class="d-flex align-items-center gap-2 mb-2">' +
      '    <input type="number" class="form-control form-control-sm" id="room2-step4-height-min" placeholder="От, см" style="max-width:120px;" value="30">' +
      '    <span>—</span>' +
      '    <input type="number" class="form-control form-control-sm" id="room2-step4-height-max" placeholder="До, см" style="max-width:120px;" value="120">' +
      '    <button type="button" class="btn btn-sm btn-primary" id="room2-step4-height-save-btn">Сохранить значения</button>' +
      '  </div>' +
      '  <p class="text-muted mb-2" style="font-size:12px;">Высота при редактировании тумбы будет ограничена этим диапазоном.</p>' +
      '  <label style="font-size:12px;margin-bottom:2px;">Текст попапа при недопустимой высоте (меньше MIN / больше MAX)</label>' +
      '  <textarea class="form-control form-control-sm" id="room2-step4-height-limit-text" rows="3" placeholder="Например: Высота тумбы от {MIN} до {MAX} см."></textarea>' +
      '  <p class="text-muted mb-0" style="margin-top:4px;font-size:12px;">Подстановки {MIN} и {MAX} — числа из диапазона выше.</p>' +
      '</div>' +
      '<div class="form-group room2-zone-edit-width-text-block" style="margin-top:16px;max-width:480px;">' +
      '  <label>Текст попапа при недопустимой ширине модуля</label>' +
      '  <p class="text-muted mb-2" style="font-size:12px;">Диапазон ширины задаётся в блоке «Деление секций» ниже (однодверный / двухдверный). Здесь — только текст ошибки.</p>' +
      '  <textarea class="form-control form-control-sm" id="room2-step4-width-limit-text" rows="3" placeholder="Например: Ширина модуля от {MIN} до {MAX} см."></textarea>' +
      '  <p class="text-muted mb-0" style="margin-top:4px;font-size:12px;">Подстановки {MIN} и {MAX} — общий допустимый диапазон ширины в см.</p>' +
      '</div>';
    if (foot) foot.insertAdjacentHTML('beforebegin', html);
    else content.insertAdjacentHTML('beforeend', html);
    var config = getRoomStepsConfig();
    config = ensureStepsInConfig(config);
    var step = config.steps.find(function (s) { return s.stepId === 4; });
    if (step) {
      var hm = document.getElementById('room2-step4-height-min');
      var hx = document.getElementById('room2-step4-height-max');
      var ht = document.getElementById('room2-step4-height-limit-text');
      var wt = document.getElementById('room2-step4-width-limit-text');
      if (hm) hm.value = step.zoneEditHeightMinCm != null ? String(step.zoneEditHeightMinCm) : '30';
      if (hx) hx.value = step.zoneEditHeightMaxCm != null ? String(step.zoneEditHeightMaxCm) : '120';
      if (ht) ht.value = step.zoneEditHeightLimitText || '';
      if (wt) wt.value = step.zoneEditWidthLimitText || '';
    }
  }

  function initRoom2Step4() {
    var addPillBtn = document.getElementById('room2-step4-add-pill-btn');
    var addBtn = document.getElementById('room2-step4-add-btn');
    var saveBtns = document.querySelectorAll('.room2-step4-save-btn');
    var depthSaveBtn = document.getElementById('room2-step4-depth-save-btn');
    var heightSaveBtn = document.getElementById('room2-step4-height-save-btn');
    var uploadInput = document.getElementById('room2-step4-icon-upload');
    upgradeRoom2Step4ZoneEditPanel();
    var pillsFolderSel = document.getElementById('room2-step4-pills-folder-select');
    if (pillsFolderSel && !pillsFolderSel._room2Bound) {
      pillsFolderSel._room2Bound = true;
      pillsFolderSel.addEventListener('change', function () {
        var config = getRoomStepsConfig();
        config = ensureStepsInConfig(config);
        var step = config.steps.find(function (s) { return s.stepId === 4; });
        if (!step) return;
        var api = getStep4PillSetsApi();
        if (api) api.ensureStep4PillSets(step, config);
        var newKey = getSelectedStep4PillsFolderKey();
        if (__room2Step4PillsFolderKey && api) {
          var pillsContainer = document.getElementById('room2-step4-pills');
          var pills = api.readPillsFromAdminContainer(pillsContainer);
          api.setStep4PillsForFolder(step, __room2Step4PillsFolderKey, pills);
        }
        __pillCategoryOptionsCache = {};
        saveRoomStepsConfig(config);
        __room2Step4PillsFolderKey = newKey;
        renderStep4PillsEditor(step, newKey);
      });
    }
    if (addPillBtn && !addPillBtn._room2Bound) {
      addPillBtn._room2Bound = true;
      addPillBtn.addEventListener('click', function () {
        if (!getSelectedStep4PillsFolderKey()) {
          if (typeof toastr !== 'undefined') toastr.warning('Выберите папку каталога (шаг 3)');
          else alert('Выберите папку каталога в шаге 3');
          return;
        }
        var container = document.getElementById('room2-step4-pills');
        if (!container) return;
        var firstMuted = container.querySelector('.text-muted');
        if (firstMuted) firstMuted.remove();
        var id = 'p' + Date.now();
        var wrap = document.createElement('div');
        wrap.className = 'room-step-pill-item border-bottom pb-2 mb-2';
        wrap.setAttribute('data-id', id);
        wrap.innerHTML = buildRoom2Step4PillHtml({ id: id, name: '', order: 0 }, 0);
        container.appendChild(wrap);
        bindRoom2Step4PillEvents(container);
        updateRoom2Step4PillsCount();
        loadCategoriesIntoPillRow(wrap, getSelectedStep4PillsFolderKey());
      });
    }
    if (addBtn && !addBtn._room2Bound) {
      addBtn._room2Bound = true;
      addBtn.addEventListener('click', function () {
        var container = document.getElementById('room2-step4-items');
        if (!container) return;
        var firstMuted = container.querySelector('.text-muted');
        if (firstMuted) firstMuted.remove();
        var id = 'i' + Date.now();
        var newRow = document.createElement('div');
        newRow.className = 'room-step-item border-bottom pb-2 mb-2';
        newRow.setAttribute('data-id', id);
        newRow.innerHTML = '<div class="d-flex align-items-center flex-wrap gap-2">' +
          '<div class="room-step-preview" style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;background:#fff;border:1px solid #ddd;border-radius:8px;"><i class="fa fa-circle" style="font-size:28px;color:#333;"></i></div>' +
          '<input type="text" class="form-control form-control-sm room-step-name" placeholder="Название" style="width:130px">' +
          '<input type="text" class="form-control form-control-sm room-step-icon" placeholder="fa-couch или URL" value="fa-circle" style="width:180px">' +
          '<button type="button" class="btn btn-sm btn-outline-secondary room-step-upload-btn" title="Загрузить картинку"><i class="fa fa-upload"></i> Загрузить</button>' +
          '<input type="text" class="form-control form-control-sm room-step-key" placeholder="Ключ" style="width:100px">' +
          '<select class="form-control form-control-sm room-step-category" style="width:130px"><option value="">— Категория —</option></select>' +
          '<input type="number" class="form-control form-control-sm room-step-order" value="0" style="width:50px">' +
          '<button type="button" class="btn btn-sm btn-outline-danger room-step-del" title="Удалить"><i class="fa fa-trash"></i></button>' +
          '</div>';
        container.appendChild(newRow);
        bindRoom2Step4ItemEvents(container);
        updateRoom2Step4Count();
      });
    }
    if (saveBtns && saveBtns.length) {
      saveBtns.forEach(function (btn) {
        if (btn._room2Bound) return;
        btn._room2Bound = true;
        btn.addEventListener('click', function () {
          var cfg = saveRoom2Step4ToConfig();
          if (saveRoomStepsConfig(cfg)) {
            if (typeof toastr !== 'undefined') toastr.success('Шаг 4 сохранён');
            else alert('Шаг 4 сохранён');
          } else {
            if (typeof toastr !== 'undefined') toastr.error('Ошибка сохранения');
            else alert('Ошибка сохранения');
          }
        });
      });
    }
    if (depthSaveBtn && !depthSaveBtn._room2Bound) {
      depthSaveBtn._room2Bound = true;
      depthSaveBtn.addEventListener('click', function () {
        var cfg = saveRoom2Step4ToConfig();
        if (saveRoomStepsConfig(cfg)) {
          if (typeof toastr !== 'undefined') toastr.success('Диапазон глубины сохранён');
          else alert('Диапазон глубины сохранён');
        } else {
          if (typeof toastr !== 'undefined') toastr.error('Ошибка сохранения диапазона');
          else alert('Ошибка сохранения диапазона');
        }
      });
    }
    if (heightSaveBtn && !heightSaveBtn._room2Bound) {
      heightSaveBtn._room2Bound = true;
      heightSaveBtn.addEventListener('click', function () {
        var cfg = saveRoom2Step4ToConfig();
        if (saveRoomStepsConfig(cfg)) {
          if (typeof toastr !== 'undefined') toastr.success('Диапазон высоты тумбы сохранён');
          else alert('Диапазон высоты тумбы сохранён');
        } else {
          if (typeof toastr !== 'undefined') toastr.error('Ошибка сохранения диапазона высоты');
          else alert('Ошибка сохранения диапазона высоты');
        }
      });
    }
    if (uploadInput && !uploadInput._room2Bound) {
      uploadInput._room2Bound = true;
      uploadInput.addEventListener('change', function () {
        var target = window._roomStepUploadTarget;
        window._roomStepUploadTarget = null;
        var file = this.files && this.files[0];
        if (!file || !target) { this.value = ''; return; }
        var fd = new FormData();
        fd.append('file', file);
        var inputEl = this;
        fetch('/api/upload/room_icon', { method: 'POST', body: fd })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            inputEl.value = '';
            if (data.files && data.files[0] && data.files[0].url) {
              target.value = data.files[0].url;
              target.dispatchEvent(new Event('input', { bubbles: true }));
              if (typeof toastr !== 'undefined') toastr.success('Картинка загружена');
            } else if (typeof toastr !== 'undefined') toastr.error(data.error || 'Ошибка загрузки');
          })
          .catch(function (err) { inputEl.value = ''; if (typeof toastr !== 'undefined') toastr.error('Ошибка загрузки'); });
      });
    }
  }
  // Создать блок «Строка под ценой» для шага 4 (если ещё нет)
  function ensureRoom2Step4Content() {
    var page = document.getElementById('room2-step-4');
    if (!page) return;
    // Удалить старый placeholder-блок «Настройки шага 4» (нужен был при начале разработки)
    page.querySelectorAll('.ibox').forEach(function (ibox) {
      var h5 = ibox.querySelector('.ibox-title h5');
      if (h5 && (h5.textContent || '').trim() === 'Настройки шага 4') {
        ibox.remove();
      }
    });
    var wrapper = page.querySelector('.wrapper-content');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'wrapper-content';
      page.appendChild(wrapper);
    }
    // Глобальная верхняя кнопка сохранения шага 4 (правый верх).
    if (!wrapper.querySelector('.room2-step4-save-top')) {
      var topSaveHtml =
        '<div class="d-flex justify-content-end mb-3 room2-step4-save-top">' +
        '  <button type="button" class="btn btn-primary btn-sm room2-step4-save-btn"><i class="fa fa-save"></i> Сохранить шаг 4</button>' +
        '</div>';
      wrapper.insertAdjacentHTML('afterbegin', topSaveHtml);
    }

    if (!wrapper.querySelector('#room2-step4-pills')) {
      var pillsHtml =
        '<div class="ibox room2-step4-pills-ibox collapsed" style="margin-bottom:20px;">' +
        '  <div class="ibox-title"><h5>Овальные кнопки</h5><div class="ibox-tools"><a class="collapse-link" href="#" title="Свернуть/развернуть"><span class="collapse-triangle">&#9654;</span></a></div></div>' +
        '  <div class="ibox-content">' +
        '    <p class="text-muted mb-2">Для каждой папки шага 3 — свой набор. Как в референсе: <strong>2 ряда по 2 кнопки</strong> (не 4 отдельных!). <strong>Ряд 1</strong> — с дверями / без (подкатегория). <strong>Ряд 2</strong> — однодверные / двустворчатые (тип зоны). В комнате в каждом ряду одна активная, каталог = <strong>пересечение</strong> (И).</p>' +
        '    <div class="form-group" style="max-width:480px;margin-bottom:12px;">' +
        '      <label for="room2-step4-pills-folder-select"><strong>Папка каталога (шаг 3)</strong></label>' +
        '      <select class="form-control form-control-sm" id="room2-step4-pills-folder-select"><option value="">— Сначала настройте шаг 3 —</option></select>' +
        '      <p class="text-muted mb-0 mt-1" style="font-size:12px;">Ключ папки (25, 26…) должен совпадать с полем «Ключ» в шаге 3.</p>' +
        '    </div>' +
        '    <p class="mb-2"><strong>Кнопки для выбранной папки:</strong> <span id="room2-step4-pills-count" class="text-muted">0</span></p>' +
        '    <div id="room2-step4-pills" class="border rounded p-3 mb-3" style="background:#fafafa; max-height: 280px; overflow-y: auto;"></div>' +
        '    <button type="button" class="btn btn-outline-primary btn-sm" id="room2-step4-add-pill-btn"><i class="fa fa-plus"></i> Добавить кнопку</button>' +
        '  </div>' +
        '</div>';
      wrapper.insertAdjacentHTML('beforeend', pillsHtml);
    }
    var pillsIboxContent = wrapper.querySelector('.room2-step4-pills-ibox .ibox-content');
    if (pillsIboxContent && !pillsIboxContent.querySelector('#room2-step4-pills-folder-select')) {
      var folderSelectHtml =
        '<div class="form-group" style="max-width:480px;margin-bottom:12px;">' +
        '  <label for="room2-step4-pills-folder-select"><strong>Папка каталога (шаг 3)</strong></label>' +
        '  <select class="form-control form-control-sm" id="room2-step4-pills-folder-select"><option value="">— Сначала настройте шаг 3 —</option></select>' +
        '  <p class="text-muted mb-0 mt-1" style="font-size:12px;">Ключ папки (25, 26…) = поле «Ключ» в шаге 3.</p>' +
        '</div>';
      var pillsList = pillsIboxContent.querySelector('#room2-step4-pills');
      if (pillsList) {
        pillsList.insertAdjacentHTML('beforebegin', folderSelectHtml);
      } else {
        pillsIboxContent.insertAdjacentHTML('afterbegin', folderSelectHtml);
      }
      var hint = pillsIboxContent.querySelector('p.text-muted.mb-2');
      if (hint) {
        hint.textContent =
          'Отдельный набор кнопок для каждой папки шага 3 (Тумбы, Шкафы…). Подкатегория — из категорий выбранного каталога. Тип зоны — однодверные / двустворчатые.';
      }
    }
    if (!wrapper.querySelector('#room2-step4-items')) {
      var itemsHtml =
        '<div class="ibox room2-step4-items-ibox collapsed" style="margin-bottom:20px;">' +
        '  <div class="ibox-title"><h5 id="room2-step4-heading-title">Модули (иконки и названия)</h5><div class="ibox-tools"><a class="collapse-link" href="#" title="Свернуть/развернуть"><span class="collapse-triangle">&#9654;</span></a></div></div>' +
        '  <div class="ibox-content">' +
        '    <input type="file" id="room2-step4-icon-upload" accept="image/*" style="display:none;">' +
        '    <p class="text-muted mb-2">Модули с загрузкой иконки, названием и категорией — как в шагах 1–3.</p>' +
        '    <div class="form-group" style="margin-bottom:12px;">' +
        '      <label>Название шага</label>' +
        '      <input type="text" class="form-control" id="room2-step4-title" style="max-width:400px;" placeholder="Например: Модули">' +
        '    </div>' +
        '    <div class="form-group" style="margin-bottom:12px;max-width:260px;">' +
        '      <label>Картинок в строке (сетка)</label>' +
        '      <select class="form-control" id="room2-step4-columns">' +
        '        <option value="1">1 — одна картинка в строке</option>' +
        '        <option value="2" selected>2 — две картинки в строке</option>' +
        '      </select>' +
        '    </div>' +
        '    <p class="mb-2"><strong>Модули:</strong> <span id="room2-step4-items-count" class="text-muted">0</span></p>' +
        '    <div id="room2-step4-items" class="border rounded p-3 mb-3" style="background:#fafafa; max-height: 420px; overflow-y: auto;"></div>' +
        '    <button type="button" class="btn btn-outline-primary btn-sm" id="room2-step4-add-btn"><i class="fa fa-plus"></i> Добавить модуль</button>' +
        '  </div>' +
        '</div>';
      wrapper.insertAdjacentHTML('beforeend', itemsHtml);
    }
    var itemsIbox = wrapper.querySelector('.room2-step4-items-ibox');
    var addBtn = document.getElementById('room2-step4-add-btn');
    var saveBtnAny = wrapper.querySelector('.room2-step4-save-btn');
    var uploadInput = document.getElementById('room2-step4-icon-upload');
    if (itemsIbox && (!addBtn || !saveBtnAny || !uploadInput)) {
      var iboxContent = itemsIbox.querySelector('.ibox-content');
      if (iboxContent) {
        if (!uploadInput) {
          var inp = document.createElement('input');
          inp.type = 'file';
          inp.id = 'room2-step4-icon-upload';
          inp.accept = 'image/*';
          inp.style.display = 'none';
          iboxContent.insertBefore(inp, iboxContent.firstChild);
        }
        if (!addBtn || !saveBtnAny) {
          var btnsWrap = document.createElement('div');
          btnsWrap.className = 'mt-2';
          btnsWrap.innerHTML = '<button type="button" class="btn btn-outline-primary btn-sm" id="room2-step4-add-btn"><i class="fa fa-plus"></i> Добавить модуль</button> ' +
            '<button type="button" class="btn btn-primary btn-sm ml-2 room2-step4-save-btn"><i class="fa fa-save"></i> Сохранить шаг 4</button>';
          iboxContent.appendChild(btnsWrap);
        }
      }
    }
    if (!wrapper.querySelector('.room2-price-subline-ibox[data-cu-prefix="step4"]')) {
      var html =
        '<div class="ibox room2-price-subline-ibox collapsed" style="margin-bottom:20px;" data-cu-prefix="step4">' +
        '  <div class="ibox-title"><h5>Строка под ценой в конструкторе (шаг 4)</h5><div class="ibox-tools"><a class="collapse-link" href="#" title="Свернуть/развернуть"><span class="collapse-triangle">&#9654;</span></a></div></div>' +
        '  <div class="ibox-content">' +
        '    <p class="text-muted mb-2">Текст под блоком с ценой в правой панели конструктора на шаге 4. Галка включает или отключает показ строки.</p>' +
        '    <div class="form-group" style="margin-bottom:16px;">' +
        '      <label class="d-flex align-items-center gap-2" style="cursor:pointer;">' +
        '        <input type="checkbox" class="room2-cu-show-price-subline" data-cu-prefix="step4" /> Показывать строку под ценой' +
        '      </label>' +
        '    </div>' +
        '    <div class="form-group" style="margin-bottom:16px;">' +
        '      <label>Строка под ценой (первая строка)</label>' +
        '      <input type="text" class="room2-cu-price-subline-text form-control" data-cu-prefix="step4" style="max-width:600px;" placeholder="Выберите количество вариантов планировки в вашем шкафу." />' +
        '    </div>' +
        '    <div class="form-group" style="margin-bottom:16px;">' +
        '      <label class="d-flex align-items-center gap-2" style="cursor:pointer;">' +
        '        <input type="checkbox" class="room2-cu-show-price-subline-help" data-cu-prefix="step4" /> Показывать иконку ? (справка) после текста' +
        '      </label>' +
        '    </div>' +
        '    <div class="form-group" style="margin-bottom:16px;">' +
        '      <label>Текст подсказки для иконки ? (попап при наведении, как в шагах 1–3)</label>' +
        '      <textarea class="room2-cu-price-subline-help-text form-control" data-cu-prefix="step4" rows="4" style="max-width:600px;" placeholder="Текст подсказки для пользователя"></textarea>' +
        '    </div>' +
        '    <div class="form-group" style="margin-bottom:16px;">' +
        '      <label>Подсказка под ней (вторая строка)</label>' +
        '      <input type="text" class="room2-cu-price-subline-hint-text form-control" data-cu-prefix="step4" style="max-width:600px;" placeholder="Например: Нажимайте и размещайте модули в шкафу (ссылка «Как это работает?» добавляется автоматически)" />' +
        '    </div>' +
        '    <div class="form-group" style="margin-bottom:16px;">' +
        '      <label>Текст модального окна «Как это работает?» (заголовок и содержимое)</label>' +
        '      <input type="text" class="room2-cu-price-subline-help-title form-control" data-cu-prefix="step4" style="max-width:600px;margin-bottom:8px;" placeholder="Заголовок модального окна" />' +
        '      <textarea class="room2-cu-price-subline-modal-text form-control" data-cu-prefix="step4" rows="4" style="max-width:600px;" placeholder="Текст при клике на ссылку «Как это работает?»"></textarea>' +
        '    </div>' +
        '    <button type="button" class="btn btn-primary room2-cu-save-price-subline" data-cu-prefix="step4"><i class="fa fa-save"></i> Сохранить строку под ценой (шаг 4)</button>' +
        '  </div>' +
        '</div>';
      wrapper.insertAdjacentHTML('beforeend', html);
    }

    // Глобальная нижняя кнопка сохранения шага 4 (правый низ).
    if (!wrapper.querySelector('.room2-step4-save-bottom')) {
      var bottomSaveHtml =
        '<div class="d-flex justify-content-end mt-3 room2-step4-save-bottom">' +
        '  <button type="button" class="btn btn-primary btn-sm room2-step4-save-btn"><i class="fa fa-save"></i> Сохранить шаг 4</button>' +
        '</div>';
      wrapper.insertAdjacentHTML('beforeend', bottomSaveHtml);
    }
    // Блок «Настройка кнопки редактирования модуля» под строкой под ценой.
    if (!wrapper.querySelector('.room2-zone-edit-ibox')) {
      var zoneHtml =
        '<div class="ibox room2-zone-edit-ibox collapsed" style="margin-bottom:20px;">' +
        '  <div class="ibox-title"><h5>Настройка кнопки редактирования модуля</h5><div class="ibox-tools"><a class="collapse-link" href="#" title="Свернуть/развернуть"><span class="collapse-triangle">&#9654;</span></a></div></div>' +
        '  <div class="ibox-content">' +
        '    <p class="text-muted mb-3">Тексты всплывающего окна, которое открывается при клике на иконку карандаша под модулем на шаге 4.</p>' +
        '    <div class="form-group" style="margin-bottom:12px;max-width:480px;">' +
        '      <label>Заголовок попапа</label>' +
        '      <input type="text" class="form-control" id="room2-step4-zoneedit-title" placeholder="Например: Настройте модуль">' +
        '    </div>' +
        '    <div class="form-group" style="margin-bottom:0;max-width:600px;">' +
        '      <label>Текст попапа (описание настройки выбранного модуля)</label>' +
        '      <textarea class="form-control" id="room2-step4-zoneedit-text" rows="4" placeholder="Например: Выберите глубину и внутреннее наполнение модуля."></textarea>' +
        '    </div>' +
        '    <div class="form-group" style="margin-top:16px;max-width:360px;">' +
        '      <label>Ограничения глубины модуля (см)</label>' +
        '      <div class="d-flex align-items-center gap-2 mb-2">' +
        '        <input type="number" class="form-control form-control-sm" id="room2-step4-depth-min" placeholder="От, см" style="max-width:120px;">' +
        '        <span>—</span>' +
        '        <input type="number" class="form-control form-control-sm" id="room2-step4-depth-max" placeholder="До, см" style="max-width:120px;">' +
        '        <button type="button" class="btn btn-sm btn-primary" id="room2-step4-depth-save-btn">Сохранить значения</button>' +
        '      </div>' +
        '      <p class="text-muted mb-2" style="font-size:12px;">Глубина при редактировании модуля будет ограничена этим диапазоном.</p>' +
        '      <label style="font-size:12px;margin-bottom:2px;">Текст попапа при недопустимом значении глубины (меньше MIN / больше MAX)</label>' +
        '      <textarea class="form-control form-control-sm" id="room2-step4-depth-limit-text" rows="3" placeholder="Например: Это модуль с вешалкой, его минимальная глубина {MIN} см. Введите значение от {MIN} до {MAX} см."></textarea>' +
        '      <p class="text-muted mb-2" style="margin-top:4px;font-size:12px;">Можно использовать подстановки {MIN} и {MAX} — они заменятся на числа из диапазона.</p>' +
        '      <label style="font-size:12px;margin-bottom:2px;">Текст попапа, если глубина модуля больше глубины секции</label>' +
        '      <textarea class="form-control form-control-sm" id="room2-step4-depth-over-section-text" rows="3" placeholder="Например: Чтобы применить такую глубину, сначала увеличьте глубину секции до нужного значения."></textarea>' +
        '      <p class="text-muted mb-0" style="margin-top:4px;font-size:12px;">Здесь можно подсказать, что нужно увеличить глубину самой секции.</p>' +
        '    </div>' +
        '    <div class="form-group" style="margin-top:16px;max-width:480px;">' +
        '      <label>Ограничения высоты тумбы (см)</label>' +
        '      <p class="text-muted mb-2" style="font-size:12px;">Только для тумб на полу. В попапе «Настройте модуль» — поле «Высота модуля».</p>' +
        '      <div class="d-flex align-items-center gap-2 mb-2">' +
        '        <input type="number" class="form-control form-control-sm" id="room2-step4-height-min" placeholder="От, см" style="max-width:120px;" value="30">' +
        '        <span>—</span>' +
        '        <input type="number" class="form-control form-control-sm" id="room2-step4-height-max" placeholder="До, см" style="max-width:120px;" value="120">' +
        '        <button type="button" class="btn btn-sm btn-primary" id="room2-step4-height-save-btn">Сохранить значения</button>' +
        '      </div>' +
        '      <p class="text-muted mb-2" style="font-size:12px;">Высота при редактировании тумбы будет ограничена этим диапазоном.</p>' +
        '      <label style="font-size:12px;margin-bottom:2px;">Текст попапа при недопустимой высоте (меньше MIN / больше MAX)</label>' +
        '      <textarea class="form-control form-control-sm" id="room2-step4-height-limit-text" rows="3" placeholder="Например: Высота тумбы от {MIN} до {MAX} см."></textarea>' +
        '      <p class="text-muted mb-2" style="margin-top:4px;font-size:12px;">Подстановки {MIN} и {MAX} — числа из диапазона выше.</p>' +
        '    </div>' +
        '    <div class="form-group" style="margin-top:16px;max-width:480px;">' +
        '      <label>Текст попапа при недопустимой ширине модуля</label>' +
        '      <p class="text-muted mb-2" style="font-size:12px;">Числовой диапазон ширины — в блоке «Деление секций» на этой странице. Здесь только текст ошибки для попапа.</p>' +
        '      <textarea class="form-control form-control-sm" id="room2-step4-width-limit-text" rows="3" placeholder="Например: Ширина модуля от {MIN} до {MAX} см."></textarea>' +
        '      <p class="text-muted mb-0" style="margin-top:4px;font-size:12px;">Подстановки {MIN} и {MAX} — общий допустимый диапазон ширины (см).</p>' +
        '    </div>' +
        '    <p class="text-muted mt-2 mb-0">Все настройки этого блока сохраняются вместе с кнопкой «Сохранить шаг 4» выше.</p>' +
        '  </div>' +
        '</div>';
      wrapper.insertAdjacentHTML('beforeend', zoneHtml);
    }
  }
  // Шаг 5: настройки табов цвета (Снаружи / Внутри / Параметры)
  function ensureRoom2Step5Content() {
    var page = document.getElementById('room2-step-5');
    if (!page) return;
    var wrapper = page.querySelector('.wrapper-content');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'wrapper-content';
      page.appendChild(wrapper);
    }
    if (!wrapper.querySelector('.room2-step5-color-tabs-ibox')) {
      var html =
        '<div class="ibox room2-step5-color-tabs-ibox collapsed" style="margin-bottom:20px;">' +
        '  <div class="ibox-title"><h5>Шаг 5 — вкладки цвета</h5><div class="ibox-tools"><a class="collapse-link" href="#" title="Свернуть/развернуть"><span class="collapse-triangle">&#9654;</span></a></div></div>' +
        '  <div class="ibox-content">' +
        '    <p class="text-muted mb-3">Задайте названия вкладок и их назначение для шага 5 в конструкторе (панель «Цвет и отделка»).</p>' +
        '    <div class="form-group" style="max-width:420px;margin-bottom:12px;">' +
        '      <label>Название вкладки «Снаружи»</label>' +
        '      <input type="text" class="form-control" id="room2-step5-tab-outside-label" placeholder="Например: Снаружи">' +
        '    </div>' +
        '    <div class="form-group" style="max-width:420px;margin-bottom:16px;">' +
        '      <label>Назначение вкладки «Снаружи» (подсказка)</label>' +
        '      <input type="text" class="form-control" id="room2-step5-tab-outside-desc" placeholder="Например: Цвет фасадов">' +
        '    </div>' +
        '    <div class="form-group" style="max-width:420px;margin-bottom:12px;">' +
        '      <label>Название вкладки «Внутри»</label>' +
        '      <input type="text" class="form-control" id="room2-step5-tab-inside-label" placeholder="Например: Внутри">' +
        '    </div>' +
        '    <div class="form-group" style="max-width:420px;margin-bottom:16px;">' +
        '      <label>Назначение вкладки «Внутри» (подсказка)</label>' +
        '      <input type="text" class="form-control" id="room2-step5-tab-inside-desc" placeholder="Например: Цвет корпуса">' +
        '    </div>' +
        '    <div class="form-group" style="max-width:420px;margin-bottom:12px;">' +
        '      <label>Название вкладки «Параметры»</label>' +
        '      <input type="text" class="form-control" id="room2-step5-tab-params-label" placeholder="Например: Параметры">' +
        '    </div>' +
        '    <div class="form-group" style="max-width:420px;margin-bottom:4px;">' +
        '      <label>Назначение вкладки «Параметры» (подсказка)</label>' +
        '      <input type="text" class="form-control" id="room2-step5-tab-params-desc" placeholder="Например: Дополнительные опции цвета">' +
        '    </div>' +
        '    <p class="text-muted mb-0" style="font-size:12px;">Эти поля влияют только на подписи и описания вкладок на шаге 5 в конструкторе.</p>' +
        '  </div>' +
        '</div>';
      wrapper.insertAdjacentHTML('beforeend', html);
    }
    if (!wrapper.querySelector('.room2-step5-wheel-ibox')) {
      var wheelHtml =
        '<div class="ibox room2-step5-wheel-ibox collapsed" style="margin-bottom:20px;">' +
        '  <div class="ibox-title"><h5>Шаг 5 — цветовой круг</h5><div class="ibox-tools"><a class="collapse-link" href="#" title="Свернуть/развернуть"><span class="collapse-triangle">&#9654;</span></a></div></div>' +
        '  <div class="ibox-content">' +
        '    <p class="text-muted mb-3"><b>Два круга равнозначны</b> — только разное расположение (16 + 6 секторов), в любой сектор можно назначить любой материал. В каждом секторе — <b>материал ЛДСП</b> (название, текстура, кромки из карточки). В конструкторе кнопки «Снаружи»/«Внутри» — это <b>фасад и корпус</b>, не привязка к кольцам. «Сохранить декоры».</p>' +
        '    <div class="form-group" style="max-width:420px;margin-bottom:12px;">' +
        '      <label>Дефолтный декор «Снаружи» для новой комнаты</label>' +
        '      <select class="form-control form-control-sm" id="room2-step5-default-outside">' +
        '        <option value="">— не задан —</option>' +
        '      </select>' +
        '      <p class="text-muted mb-0" style="font-size:12px;margin-top:4px;">Дефолт канала «Снаружи» в комнате — материал из любого сектора кругов 1 или 2.</p>' +
        '    </div>' +
        '    <div class="form-group" style="max-width:420px;margin-bottom:16px;">' +
        '      <label>Дефолтный декор «Внутри» для новой комнаты</label>' +
        '      <select class="form-control form-control-sm" id="room2-step5-default-inside">' +
        '        <option value="">— не задан —</option>' +
        '      </select>' +
        '      <p class="text-muted mb-0" style="font-size:12px;margin-top:4px;">Дефолт канала «Внутри» (корпус) — тот же общий список материалов.</p>' +
        '    </div>' +
        '    <div class="form-group" style="max-width:100%;margin-bottom:16px;">' +
        '      <label>Круг 1 — большое кольцо (16 секторов)</label>' +
        '      <div id="room2-step5-wheel-outer-list" class="border rounded p-2 mb-2" style="background:#fafafa;max-width:1100px;"></div>' +
        '      <p class="text-muted mb-0" style="font-size:12px;">Любой материал в любой сектор.</p>' +
        '    </div>' +
        '    <div class="form-group" style="max-width:100%;margin-bottom:16px;">' +
        '      <label>Круг 2 — малое кольцо (6 секторов)</label>' +
        '      <div id="room2-step5-wheel-inner-list" class="border rounded p-2 mb-2" style="background:#fafafa;max-width:1100px;"></div>' +
        '      <p class="text-muted mb-0" style="font-size:12px;">Те же правила, что у круга 1.</p>' +
        '    </div>' +
        '    <button type="button" class="btn btn-primary" id="room2-step5-wheel-save-btn"><i class="fa fa-save"></i> Сохранить декоры</button>' +
        '    <input type="file" id="room2-step5-wheel-outer-upload" accept="image/*" style="display:none;">' +
        '    <input type="file" id="room2-step5-wheel-inner-upload" accept="image/*" style="display:none;">' +
        '  </div>' +
        '</div>';
      wrapper.insertAdjacentHTML('beforeend', wheelHtml);
    }
  }
  function switchToRoom2Page(pageId) {
    document.querySelectorAll('.admin-page').forEach(function(p) { p.classList.remove('active'); });
    var page = document.getElementById(pageId);
    if (page) page.classList.add('active');
    window.history.pushState({ page: pageId }, '', '#' + pageId);
    if (pageId === 'room2-step-1') {
      initRoom2Step1();
      renderRoom2Step1Panel();
      initPriceSublineBlock();
    } else if (pageId === 'room2-step-2') {
      initRoom2Step2();
      renderRoom2Step2Panel();
      initPriceSublineBlock();
    } else if (pageId === 'room2-step-3') {
      initRoom2Step3();
      renderRoom2Step3Panel();
      initPriceSublineBlock();
    } else if (pageId === 'room2-step-4') {
      ensureRoom2Step4Content();
      initRoom2Step4();
      renderRoom2Step4Panel();
      initPriceSublineBlock();
    } else if (pageId === 'room2-step-5') {
      ensureRoom2Step5Content();
      renderRoom2Step5Panel();
    } else if (pageId === 'room2-step-6') {
      initRoom2Step6();
      renderRoom2Step6Panel();
    } else if (pageId === 'room2-placement-kinds') {
      initRoom2PlacementKinds();
    } else if (pageId === 'room2-furniture-tags') {
      initRoom2FurnitureTags();
    } else if (pageId === 'room2-obklad') {
      if (typeof window.initRoom2ObkladPanel === 'function') window.initRoom2ObkladPanel();
    } else if (pageId === 'room2-room-edit') {
      if (typeof window.initRoom2RoomEditCatalog === 'function') window.initRoom2RoomEditCatalog();
    }
  }
  function getRoomFurnitureTaxonomyFromConfig(cfg) {
    var api = window.__cldRoomFurnitureTags;
    if (api && typeof api.getTaxonomy === 'function') {
      return api.getTaxonomy(cfg);
    }
    return { rooms: [], layouts: [], catalogFolders: [] };
  }
  function getRfcStepSourceItems(level) {
    var cfg = ensureStepsInConfig(getRoomStepsConfig());
    var stepId = level === 'room' ? 1 : level === 'layout' ? 2 : 3;
    var step = cfg.steps.find(function (s) {
      return s.stepId === stepId;
    });
    var items = step && Array.isArray(step.items) ? step.items.slice() : [];
    if (level === 'room' && !items.length) items = DEFAULT_STEP1_ITEMS.slice();
    if (level === 'layout' && !items.length) items = DEFAULT_LAYOUT_ITEMS.slice();
    items.sort(function (a, b) {
      return (a.order || 0) - (b.order || 0);
    });
    var seen = {};
    var out = [];
    items.forEach(function (it) {
      var raw = it.key != null ? it.key : it.id || '';
      var k = level === 'folder' ? rfrNormFolderKey(raw) : String(raw).trim();
      if (!k || seen[k]) return;
      seen[k] = true;
      out.push({ key: k, label: String(it.name || it.key || k).trim() });
    });
    if (level === 'folder' && Array.isArray(window.__rfcExtraFolderSources)) {
      window.__rfcExtraFolderSources.forEach(function (s) {
        var k = rfrNormFolderKey(s.key || '');
        if (!k || seen[k]) return;
        seen[k] = true;
        out.push({ key: k, label: String(s.label || k).trim() });
      });
    }
    return out;
  }

  var room2RfrLinksState = {};
  var room2RfrActiveRoomKey = '';

  function rfrApi() {
    return typeof window !== 'undefined' ? window.__cldRoomFurnitureTags : null;
  }

  function rfrNormFolderKey(v) {
    var api = rfrApi();
    if (api && typeof api.normFolderKey === 'function') return api.normFolderKey(v);
    var k = String(v || '').trim();
    if (k.indexOf('catalog_') === 0) k = k.replace(/^catalog_/, '');
    return k;
  }

  function rfrFolderKeyInList(list, folderKey) {
    var fk = rfrNormFolderKey(folderKey);
    if (!fk) return false;
    return (list || []).some(function (saved) {
      return rfrNormFolderKey(saved) === fk;
    });
  }

  function rfrEnsureLinks(raw) {
    var api = rfrApi();
    if (api && typeof api.ensureRoomLinksShape === 'function') {
      return api.ensureRoomLinksShape(raw);
    }
    return raw && typeof raw === 'object' ? raw : {};
  }

  function rfrPruneLinksToStep1Rooms(links) {
    links = rfrEnsureLinks(links);
    var rooms = getRfcStepSourceItems('room');
    var valid = {};
    rooms.forEach(function (r) {
      var k = String(r.key || '').trim();
      if (k) valid[k] = true;
    });
    var out = {};
    Object.keys(links).forEach(function (rk) {
      if (valid[rk]) out[rk] = links[rk];
    });
    return out;
  }

  function rfrLoadFromConfig() {
    var cfg = getRoomStepsConfig();
    var api = rfrApi();
    room2RfrLinksState = rfrPruneLinksToStep1Rooms(
      api && typeof api.getRoomLinks === 'function' ? api.getRoomLinks(cfg) : cfg.roomFurnitureByRoom || {}
    );
    return room2RfrLinksState;
  }

  function rfrGetRoomRow(room) {
    var key = String(room.key || '').trim();
    var link = room2RfrLinksState[key] || { layoutKeys: [], catalogFolderKeys: [] };
    var layoutsN = link.layoutKeys && link.layoutKeys.length ? link.layoutKeys.length : 'все';
    var foldersN = (link.catalogFolderKeys || []).length;
    var meta = foldersN + ' разд. · раскл. ' + layoutsN;
    var active = key === room2RfrActiveRoomKey ? ' active' : '';
    var dot =
      foldersN > 0
        ? '<span class="room2-rft-config-dot" title="Настроено">●</span>'
        : '';
    return (
      '<div class="room2-rfc-room-row' + active + '" data-room-key="' + key.replace(/"/g, '&quot;') + '">' +
        '<button type="button" class="room2-rfc-row-btn" title="Настройки комнаты">' +
          '<span class="room2-rfc-row-name">' + String(room.label || key).replace(/</g, '&lt;') + dot + '</span>' +
          '<span class="room2-rfc-row-meta">' + meta.replace(/</g, '&lt;') + ' · ' + key.replace(/</g, '&lt;') + '</span>' +
        '</button>' +
        '<button type="button" class="room2-rfc-icon-btn room2-rfc-edit-btn" title="Настройки">' + PK_GEAR_SVG + '</button>' +
      '</div>'
    );
  }

  function rfrRenderRoomList() {
    var listEl = document.getElementById('room2-rfc-rooms-list');
    if (!listEl) return;
    var rooms = getRfcStepSourceItems('room');
    if (!rooms.length) {
      listEl.innerHTML =
        '<p class="text-muted small px-3 py-2 mb-0">Нет комнат — настройте <a href="#room2-step-1">шаг 1</a>.</p>';
      return;
    }
    listEl.innerHTML = rooms.map(rfrGetRoomRow).join('');
  }

  function rfrGetLinkForRoom(roomKey) {
    var k = String(roomKey || '').trim();
    if (!room2RfrLinksState[k]) {
      room2RfrLinksState[k] = { layoutKeys: [], catalogFolderKeys: [] };
    }
    return room2RfrLinksState[k];
  }

  function rfrRenderRoomEditor(roomKey) {
    var rk = String(roomKey || '').trim();
    var titleEl = document.getElementById('room2-rfc-editor-title');
    var metaEl = document.getElementById('room2-rfc-editor-meta');
    var layoutBox = document.getElementById('room2-rfc-layout-checks');
    var folderBox = document.getElementById('room2-rfc-folder-checks');
    var allChk = document.getElementById('room2-rfc-layout-all');
    if (!rk || !layoutBox || !folderBox) return;

    var rooms = getRfcStepSourceItems('room');
    var room = rooms.find(function (r) {
      return String(r.key) === rk;
    }) || { key: rk, label: rk };
    var link = rfrGetLinkForRoom(rk);
    var layouts = getRfcStepSourceItems('layout');
    var folders = getRfcStepSourceItems('folder');

    if (titleEl) titleEl.textContent = room.label || rk;
    if (metaEl) metaEl.textContent = rk;

    var allLayouts = !(link.layoutKeys && link.layoutKeys.length);
    if (allChk) allChk.checked = allLayouts;
    layoutBox.innerHTML = layouts.length
      ? layouts
          .map(function (l) {
            var lk = String(l.key);
            var checked = allLayouts || (link.layoutKeys || []).indexOf(lk) >= 0;
            return (
              '<label class="pk-check" style="display:block;margin-bottom:4px;">' +
              '<input type="checkbox" class="room2-rfr-layout-chk" data-layout-key="' +
              lk.replace(/"/g, '&quot;') +
              '" ' +
              (checked ? 'checked' : '') +
              '> ' +
              String(l.label || lk).replace(/</g, '&lt;') +
              '</label>'
            );
          })
          .join('')
      : '<span class="text-muted small">Нет раскладок — <a href="#room2-step-2">шаг 2</a>.</span>';

    folderBox.innerHTML = folders.length
      ? folders
          .map(function (f) {
            var fk = String(f.key);
            var checked = rfrFolderKeyInList(link.catalogFolderKeys, fk);
            return (
              '<label class="pk-check" style="display:block;margin-bottom:4px;">' +
              '<input type="checkbox" class="room2-rfr-folder-chk" data-folder-key="' +
              fk.replace(/"/g, '&quot;') +
              '" ' +
              (checked ? 'checked' : '') +
              '> ' +
              String(f.label || fk).replace(/</g, '&lt;') +
              '</label>'
            );
          })
          .join('')
      : '<span class="text-muted small">Нет разделов — <a href="#room2-step-3">шаг 3</a>.</span>';

    rfrSyncLayoutAllVisibility();
  }

  function rfrSyncLayoutAllVisibility() {
    var allChk = document.getElementById('room2-rfc-layout-all');
    var box = document.getElementById('room2-rfc-layout-checks');
    if (!box) return;
    var on = !!(allChk && allChk.checked);
    box.style.opacity = on ? '0.45' : '1';
    box.querySelectorAll('.room2-rfr-layout-chk').forEach(function (ch) {
      ch.disabled = on;
      if (on) ch.checked = true;
    });
  }

  function rfrReadEditorToState(roomKey) {
    var rk = String(roomKey || '').trim();
    if (!rk) return;
    var link = rfrGetLinkForRoom(rk);
    var allChk = document.getElementById('room2-rfc-layout-all');
    if (allChk && allChk.checked) {
      link.layoutKeys = [];
    } else {
      link.layoutKeys = [];
      document.querySelectorAll('.room2-rfr-layout-chk:checked').forEach(function (ch) {
        var lk = ch.getAttribute('data-layout-key');
        if (lk) link.layoutKeys.push(lk);
      });
    }
    link.catalogFolderKeys = [];
    document.querySelectorAll('.room2-rfr-folder-chk:checked').forEach(function (ch) {
      var fk = rfrNormFolderKey(ch.getAttribute('data-folder-key'));
      if (fk && !rfrFolderKeyInList(link.catalogFolderKeys, fk)) {
        link.catalogFolderKeys.push(fk);
      }
    });
  }

  function rfrSelectRoom(roomKey, skipList) {
    var nextKey = String(roomKey || '').trim();
    if (room2RfrActiveRoomKey && room2RfrActiveRoomKey !== nextKey) {
      rfrReadEditorToState(room2RfrActiveRoomKey);
    }
    room2RfrActiveRoomKey = nextKey;
    var panel = document.getElementById('room2-rfc-properties-panel');
    if (!room2RfrActiveRoomKey) {
      if (panel) panel.classList.remove('has-selection');
      return;
    }
    if (panel) panel.classList.add('has-selection');
    rfrRenderRoomEditor(room2RfrActiveRoomKey);
    if (!skipList) rfrRenderRoomList();
  }

  function rfrSaveToConfig() {
    if (room2RfrActiveRoomKey) rfrReadEditorToState(room2RfrActiveRoomKey);
    var cfg = ensureStepsInConfig(getRoomStepsConfig());
    cfg.roomFurnitureByRoom = JSON.parse(JSON.stringify(rfrEnsureLinks(room2RfrLinksState)));
    delete cfg.roomFurnitureCategories;
    if (!saveRoomStepsConfig(cfg)) {
      if (typeof toastr !== 'undefined') {
        toastr.error('Не удалось сохранить в localStorage (room_steps_config)');
      }
      return null;
    }
    return cfg;
  }

  function initRoom2FurnitureTags() {
    function refreshPanel() {
      rfrLoadFromConfig();
      var rooms = getRfcStepSourceItems('room');
      if (
        !room2RfrActiveRoomKey ||
        !rooms.some(function (r) {
          return String(r.key) === room2RfrActiveRoomKey;
        })
      ) {
        room2RfrActiveRoomKey = rooms.length ? String(rooms[0].key) : '';
      }
      rfrRenderRoomList();
      if (room2RfrActiveRoomKey) rfrSelectRoom(room2RfrActiveRoomKey, true);
      else {
        var panel = document.getElementById('room2-rfc-properties-panel');
        if (panel) panel.classList.remove('has-selection');
      }
    }

    rfrHydrateFromServer().finally(refreshPanel);
    if (!window.__rfcExtraFolderSources || !window.__rfcExtraFolderSources.length) {
      fetchCatalogTypesForStep3()
        .then(function (cats) {
          window.__rfcExtraFolderSources = (cats || [])
            .map(function (c) {
              var raw = c.id != null ? c.id : c.key || '';
              return {
                key: rfrNormFolderKey(raw),
                label: String(c.name || c.id || '').trim(),
              };
            })
            .filter(function (s) {
              return s.key;
            });
        })
        .catch(function () {
          window.__rfcExtraFolderSources = window.__rfcExtraFolderSources || [];
        })
        .finally(function () {
          if (room2RfrActiveRoomKey) rfrRenderRoomEditor(room2RfrActiveRoomKey);
        });
    }

    var listEl = document.getElementById('room2-rfc-rooms-list');
    var editorEl = document.getElementById('room2-rfc-editor');
    var saveBtn = document.getElementById('room2-rfc-save-btn');
    var syncBtn = document.getElementById('room2-rfc-sync-btn');
    var allChk = document.getElementById('room2-rfc-layout-all');

    if (listEl && !listEl._room2RfrBound) {
      listEl._room2RfrBound = true;
      listEl.addEventListener('click', function (e) {
        var row = e.target.closest('.room2-rfc-room-row');
        if (!row) return;
        var key = row.getAttribute('data-room-key');
        if (key) rfrSelectRoom(key);
      });
    }

    if (editorEl && !editorEl._room2RfrBound) {
      editorEl._room2RfrBound = true;
      editorEl.addEventListener('change', function (e) {
        if (!room2RfrActiveRoomKey) return;
        if (
          e.target.id === 'room2-rfc-layout-all' ||
          e.target.classList.contains('room2-rfr-layout-chk') ||
          e.target.classList.contains('room2-rfr-folder-chk')
        ) {
          if (e.target.id === 'room2-rfc-layout-all') rfrSyncLayoutAllVisibility();
          rfrReadEditorToState(room2RfrActiveRoomKey);
          rfrRenderRoomList();
        }
      });
    }

    if (allChk && !allChk._room2RfrBound) {
      allChk._room2RfrBound = true;
      allChk.addEventListener('change', rfrSyncLayoutAllVisibility);
    }

    if (syncBtn && !syncBtn._room2RfrBound) {
      syncBtn._room2RfrBound = true;
      syncBtn.addEventListener('click', function () {
        var api = rfrApi();
        var cfg = getRoomStepsConfig();
        if (!api || typeof api.buildDefaultRoomLinksFromSteps !== 'function') return;
        room2RfrLinksState = rfrEnsureLinks(api.buildDefaultRoomLinksFromSteps(cfg));
        refreshPanel();
        if (typeof toastr !== 'undefined') toastr.success('Для всех комнат включены все раскладки и разделы');
        else alert('Для всех комнат включены все раскладки и разделы');
      });
    }

    if (saveBtn && !saveBtn._room2RfrBound) {
      saveBtn._room2RfrBound = true;
      saveBtn.addEventListener('click', function () {
        var saved = rfrSaveToConfig();
        if (!saved) return;
        room2RfrLinksState = rfrPruneLinksToStep1Rooms(
          rfrApi() && typeof rfrApi().getRoomLinks === 'function'
            ? rfrApi().getRoomLinks(saved)
            : saved.roomFurnitureByRoom || {}
        );
        rfrRenderRoomList();
        if (room2RfrActiveRoomKey) rfrRenderRoomEditor(room2RfrActiveRoomKey);
        if (typeof toastr !== 'undefined') toastr.success('Сохранено');
        else alert('Сохранено');
      });
    }
  }
  function applyRoom2Hash() {
    var hash = (window.location.hash || '').replace('#', '');
    if (ROOM2_PAGES.indexOf(hash) !== -1) {
      switchToRoom2Page(hash);
    }
  }
  function applyRoom2HashSilent() {
    var hash = (window.location.hash || '').replace('#', '');
    if (ROOM2_PAGES.indexOf(hash) !== -1) {
      document.querySelectorAll('.admin-page').forEach(function(p) { p.classList.remove('active'); });
      var page = document.getElementById(hash);
      if (page) page.classList.add('active');
      if (hash === 'room2-step-1') {
        initRoom2Step1();
        renderRoom2Step1Panel();
        initPriceSublineBlock();
      } else if (hash === 'room2-step-2') {
        initRoom2Step2();
        renderRoom2Step2Panel();
        initPriceSublineBlock();
      } else if (hash === 'room2-step-3') {
        initRoom2Step3();
        renderRoom2Step3Panel();
        initPriceSublineBlock();
      } else if (hash === 'room2-step-4') {
        ensureRoom2Step4Content();
        initRoom2Step4();
        renderRoom2Step4Panel();
        initPriceSublineBlock();
      } else if (hash === 'room2-step-5') {
        ensureRoom2Step5Content();
        renderRoom2Step5Panel();
      } else if (hash === 'room2-step-6') {
        initRoom2Step6();
        renderRoom2Step6Panel();
      } else if (hash === 'room2-placement-kinds') {
        initRoom2PlacementKinds();
      } else if (hash === 'room2-furniture-tags') {
        initRoom2FurnitureTags();
      } else if (hash === 'room2-obklad') {
        if (typeof window.initRoom2ObkladPanel === 'function') window.initRoom2ObkladPanel();
      } else if (hash === 'room2-room-edit') {
        if (typeof window.initRoom2RoomEditCatalog === 'function') window.initRoom2RoomEditCatalog();
      }
    }
  }
  function initRoom2StepButtons() {
    var container = document.getElementById('room2-step-buttons');
    if (!container || container._room2StepBound) return;
    container._room2StepBound = true;
    container.addEventListener('click', function(e) {
      var link = e.target.closest('.room2-step-btn[data-page]');
      if (!link) return;
      e.preventDefault();
      var pageId = link.getAttribute('data-page');
      if (pageId) switchToRoom2Page(pageId);
    });
  }
  function initRoom2RightPanelHandlers() {
    var btn = document.getElementById('room2-manage-right-panel-btn');
    if (btn && !btn._room2Bound) {
      btn._room2Bound = true;
      btn.addEventListener('click', function() {
        switchToRoom2Page('room2-right-panel-page');
      });
    }
    var obkladBtn = document.getElementById('room2-manage-obklad-btn');
    if (obkladBtn && !obkladBtn._room2Bound) {
      obkladBtn._room2Bound = true;
      obkladBtn.addEventListener('click', function() {
        switchToRoom2Page('room2-obklad');
      });
    }
    var pkBtn = document.getElementById('room2-manage-placement-kinds-btn');
    if (pkBtn && !pkBtn._room2Bound) {
      pkBtn._room2Bound = true;
      pkBtn.addEventListener('click', function() {
        switchToRoom2Page('room2-placement-kinds');
      });
    }
    var rftBtn = document.getElementById('room2-manage-furniture-tags-btn');
    if (rftBtn && !rftBtn._room2Bound) {
      rftBtn._room2Bound = true;
      rftBtn.addEventListener('click', function() {
        switchToRoom2Page('room2-furniture-tags');
      });
    }
    var reBtn = document.getElementById('room2-manage-room-edit-btn');
    if (reBtn && !reBtn._room2Bound) {
      reBtn._room2Bound = true;
      reBtn.addEventListener('click', function() {
        switchToRoom2Page('room2-room-edit');
      });
    }
    document.addEventListener('click', function(e) {
      var backLink = e.target.closest('a.room2-back-to-settings, a.room2-back-to-list, a[href="#room-settings-2"][data-page="room-settings-2"], a[href="#room2-right-panel-page"][data-page="room2-right-panel-page"]');
      if (!backLink || backLink.closest('#side-menu')) return;
      var pageId = backLink.getAttribute('data-page');
      if (!pageId) return;
      e.preventDefault();
      switchToRoom2Page(pageId);
    });
  }
  function onAdminPageShow() {
    var hash = (window.location.hash || '').replace('#', '');
    if (hash === 'room-settings-2') {
      var existing = document.getElementById(PRICE_SUBLINE_CONTAINER_ID);
      if (existing) {
        var room2 = document.getElementById('room-settings-2');
        if (room2 && room2.contains(existing)) existing.remove();
      }
      loadPriceSublineSettings();
    }
  }
  function initBulkExportButton() {
    var btn = document.getElementById('admin-top-export-all');
    if (!btn) {
      var settingsBtn = document.getElementById('admin-top-export-settings');
      if (settingsBtn && settingsBtn.parentNode) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-success btn-sm';
        btn.id = 'admin-top-export-all';
        btn.title = 'Выгрузить все каталоги разом (модели, категории)';
        btn.innerHTML = '<i class="fa fa-database"></i> Выгрузить всё в конструктор';
        settingsBtn.parentNode.insertBefore(btn, settingsBtn.nextSibling);
      }
    }
    if (!btn || btn._bulkExportBound) return;
    btn._bulkExportBound = true;
    btn.addEventListener('click', function() {
      btn.disabled = true;
      if (btn.querySelector('.fa')) btn.querySelector('.fa').className = 'fa fa-spinner fa-spin';

      fetch('/api/catalog/export_all_for_constructor')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          // ─── 1. Сначала СНОСИМ все старые catalog_* ключи из localStorage ───────
          // Иначе удалённые или опустевшие каталоги продолжают показывать старые карточки.
          var staleCatalogKeys = [];
          for (var si = 0; si < localStorage.length; si++) {
            var sk = localStorage.key(si);
            if (sk && sk.startsWith('catalog_') && !sk.startsWith('catalogCategories_') && sk !== 'catalogs_keys') {
              staleCatalogKeys.push(sk);
            }
          }
          staleCatalogKeys.forEach(function(sk) {
            try { localStorage.removeItem(sk); } catch (e) {}
          });

          // ─── 2. Записываем свежие данные от сервера ──────────────────────────────
          var count = 0;
          var parts = [];
          var emptyKeys = [];
          if (data.catalogs) {
            Object.keys(data.catalogs).forEach(function(key) {
              try {
                var arr = data.catalogs[key];
                localStorage.setItem(key, JSON.stringify(Array.isArray(arr) ? arr : []));
                var n = Array.isArray(arr) ? arr.length : 0;
                count += n;
                if (n > 0) {
                  parts.push(key + ': ' + n);
                } else {
                  emptyKeys.push(key);
                }
              } catch (e) { console.error('localStorage.setItem', key, e); }
            });
          }
          if (data.categories) {
            Object.keys(data.categories).forEach(function(key) {
              try {
                localStorage.setItem('catalogCategories_' + key, JSON.stringify(data.categories[key]));
              } catch (e) { console.error('localStorage.setItem categories', key, e); }
            });
          }

          // ─── 3. Библиотека присадки (шаблоны+схемы) → сервер, как .config в БМ ──
          var drillExport = Promise.resolve(null);
          if (typeof window.__cldExportDrillLibraryToServer === 'function') {
            drillExport = window.__cldExportDrillLibraryToServer().catch(function(err) {
              console.warn('drill library export:', err);
              return { ok: false, error: err && err.message ? err.message : String(err) };
            });
          }

          return drillExport.then(function(drillRes) {
            var detail = parts.length ? ' (' + parts.join(', ') + ')' : '';
            var warnEmpty = emptyKeys.length
              ? ' ⚠ Пустые каталоги (нет clodisJSON, в конструкторе очищено): ' + emptyKeys.join(', ') + '.'
              : '';
            var drillMsg = '';
            if (drillRes && drillRes.ok) {
              drillMsg = ' Присадка: ' + (drillRes.schemeCount || 0) + ' схем / ' + (drillRes.templateCount || 0) + ' шаблонов → сервер.';
            } else if (drillRes && drillRes.skipped) {
              drillMsg = '';
            } else if (drillRes && drillRes.error) {
              drillMsg = ' ⚠ Присадка не выгружена: ' + drillRes.error;
            }
            if (typeof toastr !== 'undefined') {
              toastr.success('Выгружено ' + count + ' модулей' + detail + '.' + warnEmpty + drillMsg, '', { timeOut: emptyKeys.length || (drillRes && drillRes.error) ? 12000 : 5000 });
            } else {
              alert('Выгружено ' + count + ' модулей' + detail + warnEmpty + drillMsg);
            }
          });
        })
        .catch(function(e) {
          console.error('export_all_for_constructor:', e);
          if (typeof toastr !== 'undefined') toastr.error('Ошибка выгрузки: ' + (e.message || e));
          else alert('Ошибка выгрузки');
        })
        .finally(function() {
          btn.disabled = false;
          if (btn.querySelector('.fa')) btn.querySelector('.fa').className = 'fa fa-database';
        });
    });
  }

  // ─── Шаг 4: настройки деления секций (min/max ширина) ────────────────────
  function loadStep4SectionDivisionSettings() {
    var minEl = document.getElementById('room2-step4-section-min-mm');
    var maxEl = document.getElementById('room2-step4-section-max-mm');
    var stepEl = document.getElementById('room2-step4-section-step-mm');
    var sMinEl = document.getElementById('room2-step4-section-single-min-mm');
    var sMaxEl = document.getElementById('room2-step4-section-single-max-mm');
    if (!minEl && !maxEl && !stepEl && !sMinEl && !sMaxEl) return;
    var config = getRoomStepsConfig();
    var step4 = config && Array.isArray(config.steps) ? config.steps.find(function(s) { return s.stepId === 4; }) : null;
    var sd = step4 && step4.section_division;
    if (minEl) minEl.value = (sd && Number(sd.min_mm) > 0) ? String(sd.min_mm) : '600';
    if (maxEl) maxEl.value = (sd && Number(sd.max_mm) > 0) ? String(sd.max_mm) : '1200';
    if (stepEl) stepEl.value = (sd && Number(sd.step_mm) > 0) ? String(sd.step_mm) : '100';
    if (sMinEl) sMinEl.value = (sd && Number(sd.single_min_mm) > 0) ? String(sd.single_min_mm) : '300';
    if (sMaxEl) sMaxEl.value = (sd && Number(sd.single_max_mm) > 0) ? String(sd.single_max_mm) : '600';
  }

  function saveStep4SectionDivisionSettings() {
    var minEl = document.getElementById('room2-step4-section-min-mm');
    var maxEl = document.getElementById('room2-step4-section-max-mm');
    var stepEl = document.getElementById('room2-step4-section-step-mm');
    var sMinEl = document.getElementById('room2-step4-section-single-min-mm');
    var sMaxEl = document.getElementById('room2-step4-section-single-max-mm');
    var statusEl = document.getElementById('room2-step4-section-size-save-status');
    var minMm = minEl ? (parseInt(minEl.value, 10) || 600) : 600;
    var maxMm = maxEl ? (parseInt(maxEl.value, 10) || 1200) : 1200;
    var stepMm = stepEl ? (parseInt(stepEl.value, 10) || 100) : 100;
    if (minMm <= 0) minMm = 100;
    if (maxMm < minMm) maxMm = minMm + 100;
    if (stepMm <= 0) stepMm = 1;
    var singleMinMm = sMinEl ? (parseInt(sMinEl.value, 10) || 300) : 300;
    var singleMaxMm = sMaxEl ? (parseInt(sMaxEl.value, 10) || 600) : 600;
    if (singleMinMm <= 0) singleMinMm = 200;
    if (singleMaxMm < singleMinMm) singleMaxMm = singleMinMm + 50;
    var config = getRoomStepsConfig();
    if (!config || !config.steps) config = { steps: [] };
    config = ensureStepsInConfig(config);
    var step4 = config.steps.find(function(s) { return s.stepId === 4; });
    if (!step4) {
      step4 = { stepId: 4, title: 'Шаг 4', items: [], pillSets: {}, columnsPerRow: 2 };
      config.steps.push(step4);
    }
    step4.section_division = {
      min_mm: minMm,
      max_mm: maxMm,
      step_mm: stepMm,
      single_min_mm: singleMinMm,
      single_max_mm: singleMaxMm,
    };
    if (saveRoomStepsConfig(config)) {
      if (statusEl) {
        statusEl.style.display = 'inline';
        setTimeout(function() { statusEl.style.display = 'none'; }, 2500);
      }
      if (typeof toastr !== 'undefined') toastr.success('Настройки деления секций сохранены');
    } else {
      if (typeof toastr !== 'undefined') toastr.error('Ошибка сохранения');
      else alert('Ошибка сохранения');
    }
  }

  function initStep4SectionDivisionSettings() {
    loadStep4SectionDivisionSettings();
    var saveBtn = document.getElementById('room2-step4-section-size-save');
    if (saveBtn && !saveBtn._sectionDivBound) {
      saveBtn._sectionDivBound = true;
      saveBtn.addEventListener('click', saveStep4SectionDivisionSettings);
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  // ─── Шаг 6: ручки — длина скобы + серии с иконками ───────────────────────
  var STEP6_KIND_OPTIONS = [
    { v: 'push', l: 'Без ручки (push)' },
    { v: 'bar', l: 'Скоба' },
    { v: 'knob', l: 'Кнопка' },
    { v: 'loop', l: 'Петля' },
  ];

  function buildRoom2Step6ItemHtml(it, idx) {
    it = it || {};
    var iconVal = (it.icon || '').trim();
    var isImg = /^https?:\/\//i.test(iconVal) || iconVal.startsWith('/');
    var preview = isImg
      ? '<img src="' + iconVal.replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:contain;border-radius:6px;" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline-block\';"><i class="fa fa-image" style="display:none;font-size:24px;color:#999;"></i>'
      : '<i class="fa fa-hand-paper-o" style="font-size:28px;color:#333;"></i>';
    var kind = String(it.kind || it.handleKind || 'bar').trim();
    var kindOpts = STEP6_KIND_OPTIONS.map(function(o) {
      return '<option value="' + o.v + '"' + (kind === o.v ? ' selected' : '') + '>' + o.l + '</option>';
    }).join('');
    var seriesId = String(it.key || it.seriesId || it.id || '').trim();
    var cabId = it.cabinetModelId != null && it.cabinetModelId !== '' ? String(it.cabinetModelId) : '';
    var collId = it.catalogCollectionId != null ? Number(it.catalogCollectionId) : 0;
    var openBtn = collId > 0
      ? '<a href="#handles-collection?id=' + collId + '" class="btn btn-sm btn-primary room2-step6-open-collection" title="Ручки внутри коллекции">Открыть</a>'
      : '<button type="button" class="btn btn-sm btn-outline-secondary" disabled title="Укажите ключ seriesId из каталога">Открыть</button>';
    var keyHint = seriesId.indexOf('/models/') === 0
      ? ' title="⚠ Это путь к FBX, не ключ! Нажмите «Подтянуть из каталога»" style="width:180px;border-color:#e67e22;"'
      : ' title="Ключ из каталога ручек (handles.json), напр. handle-1781380433836" style="width:180px;"';
    return '<div class="room-step-item room2-step6-item border-bottom pb-2 mb-2" data-id="' + (it.id || idx).toString().replace(/"/g, '&quot;') + '">' +
      '<div class="d-flex align-items-center flex-wrap gap-2 mb-1" style="font-size:11px;color:#6b7280;">' +
      '<span style="width:56px;">Превью</span>' +
      '<span style="width:140px;">Название</span>' +
      '<span style="width:160px;">URL иконки</span>' +
      '<span style="width:72px;"></span>' +
      '<span style="width:180px;">Ключ seriesId</span>' +
      '<span style="width:130px;">Тип</span>' +
      '<span style="width:72px;">3D id</span>' +
      '<span style="width:50px;">Пор.</span>' +
      '<span style="width:72px;"></span>' +
      '</div>' +
      '<div class="d-flex align-items-center flex-wrap gap-2">' +
      '<div class="room-step-preview" style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;background:#fff;border:1px solid #ddd;border-radius:8px;flex-shrink:0;">' + preview + '</div>' +
      '<input type="text" class="form-control form-control-sm room-step-name" placeholder="Ручка Волна" value="' + (it.name || '').replace(/"/g, '&quot;').replace(/</g, '&lt;') + '" style="width:140px;">' +
      '<input type="text" class="form-control form-control-sm room-step-icon" placeholder="URL иконки (PNG)" value="' + iconVal.replace(/"/g, '&quot;').replace(/</g, '&lt;') + '" style="width:160px;">' +
      '<button type="button" class="btn btn-sm btn-outline-secondary room-step-upload-btn" title="Загрузить картинку для карточки шага 6"><i class="fa fa-upload"></i></button>' +
      '<input type="text" class="form-control form-control-sm room-step-key" placeholder="handle-…" value="' + seriesId.replace(/"/g, '&quot;').replace(/</g, '&lt;') + '"' + keyHint + '>' +
      '<select class="form-control form-control-sm room2-step6-kind" style="width:130px;">' + kindOpts + '</select>' +
      '<input type="number" class="form-control form-control-sm room2-step6-cabinet-model" placeholder="3" value="' + cabId.replace(/"/g, '&quot;') + '" style="width:72px;" title="cabinet_model.json id (Волна = 3). Не 0!">' +
      '<input type="number" class="form-control form-control-sm room-step-order" placeholder="0" value="' + (it.order != null ? it.order : idx) + '" style="width:50px;">' +
      openBtn +
      '<button type="button" class="btn btn-sm btn-outline-danger room-step-del" title="Удалить"><i class="fa fa-trash"></i></button>' +
      '</div></div>';
  }

  function updateRoom2Step6Count() {
    var container = document.getElementById('room2-step6-items');
    var countEl = document.getElementById('room2-step6-items-count');
    if (countEl && container) countEl.textContent = container.querySelectorAll('.room-step-item').length;
    updateRoom2Step6DefaultSeriesDropdown(true);
  }

  function collectRoom2Step6ItemsFromDom() {
    var container = document.getElementById('room2-step6-items');
    if (!container) return [];
    var items = [];
    container.querySelectorAll('.room-step-item').forEach(function(row, idx) {
      var name = (row.querySelector('.room-step-name') && row.querySelector('.room-step-name').value || '').trim();
      var key = (row.querySelector('.room-step-key') && row.querySelector('.room-step-key').value || '').trim();
      if (!key) return;
      items.push({
        name: name || 'Серия ' + (idx + 1),
        key: key,
        seriesId: key,
        order: parseInt((row.querySelector('.room-step-order') && row.querySelector('.room-step-order').value) || String(idx), 10),
      });
    });
    items.sort(function(a, b) { return (a.order || 0) - (b.order || 0); });
    return items;
  }

  function escapeRoom2Step6OptionText(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function updateRoom2Step6DefaultSeriesDropdown(preserveSelection) {
    var el = document.getElementById('room2-step6-default-series');
    if (!el || el.tagName !== 'SELECT') return;
    var selected = preserveSelection === true ? String(el.value || '').trim() : '';
    var items = collectRoom2Step6ItemsFromDom();
    var html = '<option value="">— не задано —</option>';
    items.forEach(function(it) {
      var key = String(it.key || it.seriesId || '').trim();
      if (!key) return;
      var name = String(it.name || key).trim();
      var sel = key === selected ? ' selected' : '';
      html += '<option value="' + escapeRoom2Step6OptionText(key) + '"' + sel + '>' +
        escapeRoom2Step6OptionText(name) + '</option>';
    });
    el.innerHTML = html;
    var pick = selected;
    if (pick && !Array.prototype.some.call(el.options, function(o) { return o.value === pick; })) {
      pick = '';
    }
    if (pick) el.value = pick;
    else if (items.length === 1) el.value = String(items[0].key || items[0].seriesId || '');
  }

  function bindRoom2Step6ItemEvents(container) {
    if (!container) return;
    container.querySelectorAll('.room-step-del').forEach(function(btn) {
      if (btn._room2Step6Bound) return;
      btn._room2Step6Bound = true;
      btn.addEventListener('click', function() {
        this.closest('.room-step-item')?.remove();
        updateRoom2Step6Count();
      });
    });
    container.querySelectorAll('.room-step-icon').forEach(function(input) {
      if (input._room2Step6Bound) return;
      input._room2Step6Bound = true;
      input.addEventListener('input', function() {
        var itemEl = this.closest('.room-step-item');
        var prev = itemEl?.querySelector('.room-step-preview');
        if (!prev) return;
        var v = this.value.trim();
        var isImg = /^https?:\/\//i.test(v) || v.startsWith('/');
        if (isImg) prev.innerHTML = '<img src="' + v.replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:contain;border-radius:6px;" onerror="this.style.display=\'none\';"><i class="fa fa-image" style="font-size:24px;color:#999;"></i>';
        else prev.innerHTML = '<i class="fa fa-hand-paper-o" style="font-size:28px;color:#333;"></i>';
      });
    });
    container.querySelectorAll('.room-step-upload-btn').forEach(function(btn) {
      if (btn._room2Step6Bound) return;
      btn._room2Step6Bound = true;
      btn.addEventListener('click', function() {
        var row = this.closest('.room-step-item');
        var iconInput = row ? row.querySelector('.room-step-icon') : null;
        if (!iconInput) return;
        if (typeof window.openFileManager === 'function') {
          window.openFileManager({
            allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
            initialPath: 'room_icons',
            onSelect: function(r) {
              if (r && r.url && iconInput) {
                iconInput.value = r.url;
                iconInput.dispatchEvent(new Event('input', { bubbles: true }));
              }
            }
          });
        } else {
          var uploadInput = document.getElementById('room2-step6-icon-upload');
          if (uploadInput) {
            window._roomStepUploadTarget = iconInput;
            uploadInput.click();
          } else if (window.toastr) window.toastr.warning('Файловый менеджер не загружен.');
          else alert('Файловый менеджер недоступен.');
        }
      });
    });
    container.querySelectorAll('.room-step-key').forEach(function(input) {
      if (input._room2Step6KeyBound) return;
      input._room2Step6KeyBound = true;
      input.addEventListener('input', function() {
        updateRoom2Step6DefaultSeriesDropdown(true);
      });
    });
    container.querySelectorAll('.room-step-name').forEach(function(input) {
      if (input._room2Step6NameBound) return;
      input._room2Step6NameBound = true;
      input.addEventListener('input', function() {
        updateRoom2Step6DefaultSeriesDropdown(true);
      });
    });
  }

  function loadStep6HandleBarSettings() {
    var minEl = document.getElementById('room2-step6-bar-min-mm');
    var maxEl = document.getElementById('room2-step6-bar-max-mm');
    var stepEl = document.getElementById('room2-step6-bar-step-mm');
    var nMinEl = document.getElementById('room2-step6-bar-narrow-min-mm');
    var nMaxEl = document.getElementById('room2-step6-bar-narrow-max-mm');
    if (!minEl && !maxEl) return;
    var config = getRoomStepsConfig();
    config = ensureStepsInConfig(config);
    var step6 = config.steps.find(function(s) { return s.stepId === 6; });
    var br = step6 && step6.handle_bar_rules;
    if (minEl) minEl.value = (br && Number(br.min_mm) > 0) ? String(br.min_mm) : '128';
    if (maxEl) maxEl.value = (br && Number(br.max_mm) > 0) ? String(br.max_mm) : '768';
    if (stepEl) stepEl.value = (br && Number(br.step_mm) > 0) ? String(br.step_mm) : '32';
    if (nMinEl) nMinEl.value = (br && Number(br.narrow_min_mm) > 0) ? String(br.narrow_min_mm) : '300';
    if (nMaxEl) nMaxEl.value = (br && Number(br.narrow_max_mm) > 0) ? String(br.narrow_max_mm) : '450';
  }

  function saveStep6HandleBarSettings() {
    var minEl = document.getElementById('room2-step6-bar-min-mm');
    var maxEl = document.getElementById('room2-step6-bar-max-mm');
    var stepEl = document.getElementById('room2-step6-bar-step-mm');
    var nMinEl = document.getElementById('room2-step6-bar-narrow-min-mm');
    var nMaxEl = document.getElementById('room2-step6-bar-narrow-max-mm');
    var statusEl = document.getElementById('room2-step6-bar-rules-save-status');
    var minMm = minEl ? (parseInt(minEl.value, 10) || 128) : 128;
    var maxMm = maxEl ? (parseInt(maxEl.value, 10) || 768) : 768;
    var stepMm = stepEl ? (parseInt(stepEl.value, 10) || 32) : 32;
    if (minMm <= 0) minMm = 50;
    if (maxMm < minMm) maxMm = minMm + 32;
    if (stepMm <= 0) stepMm = 1;
    var narrowMinMm = nMinEl ? (parseInt(nMinEl.value, 10) || 300) : 300;
    var narrowMaxMm = nMaxEl ? (parseInt(nMaxEl.value, 10) || 450) : 450;
    if (narrowMinMm <= 0) narrowMinMm = 200;
    if (narrowMaxMm < narrowMinMm) narrowMaxMm = narrowMinMm + 50;
    var config = getRoomStepsConfig();
    config = ensureStepsInConfig(config);
    var step6 = config.steps.find(function(s) { return s.stepId === 6; });
    if (!step6) {
      step6 = { stepId: 6, title: DEFAULT_STEP_TITLES[6] || 'Ручки', items: [], columnsPerRow: 2 };
      config.steps.push(step6);
    }
    step6.handle_bar_rules = {
      min_mm: minMm,
      max_mm: maxMm,
      step_mm: stepMm,
      narrow_min_mm: narrowMinMm,
      narrow_max_mm: narrowMaxMm,
    };
    if (saveRoomStepsConfig(config)) {
      if (statusEl) {
        statusEl.style.display = 'inline';
        setTimeout(function() { statusEl.style.display = 'none'; }, 2500);
      }
      if (typeof toastr !== 'undefined') toastr.success('Настройки длины скобы сохранены');
    } else {
      if (typeof toastr !== 'undefined') toastr.error('Ошибка сохранения');
      else alert('Ошибка сохранения');
    }
  }

  function initStep6HandleBarSettings() {
    loadStep6HandleBarSettings();
    var saveBtn = document.getElementById('room2-step6-bar-rules-save');
    if (saveBtn && !saveBtn._step6BarBound) {
      saveBtn._step6BarBound = true;
      saveBtn.addEventListener('click', saveStep6HandleBarSettings);
    }
  }

  function parseHandlesCatalogPayload(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.series)) return data.series;
    if (data && Array.isArray(data.items)) return data.items;
    return [];
  }

  async function fetchHandlesCatalogForAdmin() {
    try {
      var res = await fetch('/api/catalog/items_get/handles?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        var data = await res.json();
        var list = parseHandlesCatalogPayload(data);
        if (list.length) return list;
      }
    } catch (e) {}
    try {
      var res2 = await fetch('/catalog_items/handles.json', { cache: 'no-store' });
      if (res2.ok) {
        var data2 = await res2.json();
        return parseHandlesCatalogPayload(data2);
      }
    } catch (e2) {}
    return [];
  }

  /** Коллекция для шага 6; размеры/варианты с parentCollectionId не показываем. */
  function isHandleCollectionSeries(s) {
    if (!s || typeof s !== 'object') return false;
    if (Number(s.parentCollectionId) > 0) return false;
    var et = String(s.entityType || 'collection').toLowerCase();
    return et !== 'size' && et !== 'variant';
  }

  function filterHandleCollectionsForStep6(seriesList) {
    return (seriesList || []).filter(function(s) {
      return s && (s.active == null || Number(s.active) !== 0) && isHandleCollectionSeries(s);
    });
  }

  function resolveHandleCabinetModelId(s) {
    if (!s || typeof s !== 'object') return null;
    if (Number(s.cabinetModelId) > 0) return Number(s.cabinetModelId);
    if (Array.isArray(s.models) && s.models[0] && Number(s.models[0].cabinetModelId) > 0) {
      return Number(s.models[0].cabinetModelId);
    }
    if (Array.isArray(s.variants) && s.variants[0] && s.variants[0].cabinetModelId != null) {
      return Number(s.variants[0].cabinetModelId) || null;
    }
    var path = String((s.modelParams && s.modelParams.modelPath) || (s.modelParams && s.modelParams.model) || '').toLowerCase();
    if (path.indexOf('volna') >= 0) return 3;
    return null;
  }

  function findCatalogSeriesForStep6ItemAdmin(it, catalogSeries) {
    it = it || {};
    var list = catalogSeries || [];
    var key = String(it.key || it.seriesId || '').trim();
    if (key) {
      var byKey = list.find(function(s) {
        var sk = String(s.key || s.id || '').trim();
        return sk === key || String(s.id) === key;
      });
      if (byKey) return byKey;
    }
    if (key.indexOf('/models/') === 0 || /volna/i.test(key)) {
      var byPath = list.find(function(s) {
        var p = String((s.modelParams && s.modelParams.modelPath) || (s.modelParams && s.modelParams.model) || '').trim();
        if (key.indexOf('/models/') === 0 && p === key) return true;
        return /volna/i.test(p);
      });
      if (byPath) return byPath;
    }
    var name = String(it.name || '').trim();
    if (name) {
      var byName = list.find(function(s) { return String(s.name || '').trim() === name; });
      if (byName) return byName;
    }
    return null;
  }

  /** Найти коллекцию: прямое совпадение или родитель для строки-размера. */
  function resolveStep6CollectionFromItem(it, catalogSeries) {
    var entry = findCatalogSeriesForStep6ItemAdmin(it, catalogSeries);
    if (!entry) return null;
    if (isHandleCollectionSeries(entry)) return entry;
    var pid = Number(entry.parentCollectionId);
    if (pid > 0) {
      var parent = (catalogSeries || []).find(function(s) { return Number(s.id) === pid; });
      if (parent && isHandleCollectionSeries(parent)) return parent;
    }
    return null;
  }

  function filterAndDedupeStep6Items(items, catalogSeries) {
    var seen = {};
    var out = [];
    (items || []).forEach(function(it) {
      var enriched = enrichStep6ItemFromCatalog(it, catalogSeries);
      var k = String(enriched.key || enriched.seriesId || '').trim();
      if (!k || seen[k]) return;
      if (!resolveStep6CollectionFromItem(enriched, catalogSeries)) return;
      seen[k] = true;
      out.push(enriched);
    });
    return out;
  }

  function enrichStep6ItemFromCatalog(it, catalogSeries) {
    var cat = resolveStep6CollectionFromItem(it, catalogSeries);
    var mpFromKey = (function() {
      var k = String(it.key || it.seriesId || '').trim();
      return k.indexOf('/models/') === 0 && /\.(fbx|glb|gltf)$/i.test(k) ? k : '';
    })();
    if (!cat) {
      return {
        id: it.id || 'h-step6',
        name: it.name || 'Ручка',
        icon: it.icon || '',
        key: mpFromKey || it.key || it.seriesId || '',
        seriesId: mpFromKey || it.key || it.seriesId || '',
        kind: it.kind || 'knob',
        cabinetModelId: (it.cabinetModelId != null && Number(it.cabinetModelId) > 0)
          ? Number(it.cabinetModelId)
          : (mpFromKey ? resolveHandleCabinetModelId({ modelParams: { modelPath: mpFromKey } }) : null),
        modelPath: String(it.modelPath || '').trim() || mpFromKey || '',
        order: it.order != null ? it.order : 0,
      };
    }
    var cabId = resolveHandleCabinetModelId(cat);
    var slug = String(cat.key || cat.id || '').trim();
    var modelPath = String((cat.modelParams && cat.modelParams.modelPath) || (cat.modelParams && cat.modelParams.model) || '').trim();
    return {
      id: it.id || ('h' + String(cat.id || '')),
      catalogCollectionId: Number(cat.id) || null,
      name: cat.name || it.name || slug,
      icon: it.icon || cat.icon || '',
      key: slug,
      seriesId: slug,
      kind: it.kind || cat.kind || 'bar',
      cabinetModelId: (it.cabinetModelId != null && Number(it.cabinetModelId) > 0)
        ? Number(it.cabinetModelId)
        : cabId,
      modelPath: modelPath,
      order: it.order != null ? it.order : (cat.order != null ? cat.order : 0),
    };
  }

  function mapHandlesSeriesToStep6Items(seriesList) {
    return filterHandleCollectionsForStep6(seriesList).map(function(s, i) {
      var cabId = resolveHandleCabinetModelId(s);
      var slug = String(s.key || s.id || '').trim();
      var kind = s.kind || 'bar';
      if (String((s.modelParams && s.modelParams.modelType) || '').toLowerCase() === 'normal' ||
          /volna/i.test(String((s.modelParams && s.modelParams.modelPath) || ''))) {
        kind = kind === 'push' ? kind : 'bar';
      }
      return {
        id: 'h' + String(s.id || i),
        catalogCollectionId: Number(s.id) || null,
        name: s.name || slug || String(s.id || i),
        icon: s.icon || '',
        key: slug,
        seriesId: slug,
        kind: kind,
        cabinetModelId: cabId,
        modelPath: String((s.modelParams && s.modelParams.modelPath) || (s.modelParams && s.modelParams.model) || '').trim(),
        order: s.order != null ? Number(s.order) : i,
      };
    });
  }

  async function saveRoom2Step6ToConfig() {
    var config = getRoomStepsConfig();
    config = ensureStepsInConfig(config);
    var step = config.steps.find(function(s) { return s.stepId === 6; });
    if (!step) {
      step = { stepId: 6, title: DEFAULT_STEP_TITLES[6] || 'Ручки', items: [], columnsPerRow: 2 };
      config.steps.push(step);
    }
    var titleEl = document.getElementById('room2-step6-title');
    var colsEl = document.getElementById('room2-step6-columns');
    var hintEl = document.getElementById('room2-step6-hint');
    var defSeriesEl = document.getElementById('room2-step6-default-series');
    var container = document.getElementById('room2-step6-items');
    step.title = (titleEl && titleEl.value) ? titleEl.value.trim() : (step.title || DEFAULT_STEP_TITLES[6]);
    step.columnsPerRow = colsEl && colsEl.value ? Math.max(1, Math.min(3, parseInt(colsEl.value, 10) || 2)) : 2;
    step.hintText = hintEl ? hintEl.value.trim() : (step.hintText || '');
    var defSeries = defSeriesEl ? defSeriesEl.value.trim() : '';
    var catalogSeries = await fetchHandlesCatalogForAdmin();
    step.items = [];
    if (container) {
      container.querySelectorAll('.room-step-item').forEach(function(row, idx) {
        var name = (row.querySelector('.room-step-name') && row.querySelector('.room-step-name').value || '').trim();
        var icon = (row.querySelector('.room-step-icon') && row.querySelector('.room-step-icon').value || '').trim();
        var key = (row.querySelector('.room-step-key') && row.querySelector('.room-step-key').value || '').trim();
        var kindEl = row.querySelector('.room2-step6-kind');
        var kind = kindEl ? kindEl.value : 'bar';
        var cabEl = row.querySelector('.room2-step6-cabinet-model');
        var cabRaw = cabEl ? cabEl.value : '';
        var cabinetModelId = cabRaw !== '' && !isNaN(parseInt(cabRaw, 10)) ? parseInt(cabRaw, 10) : null;
        var order = parseInt((row.querySelector('.room-step-order') && row.querySelector('.room-step-order').value) || '0', 10);
        var draft = {
          id: row.getAttribute('data-id') || 'h' + idx,
          name: name || 'Серия ' + (idx + 1),
          icon: icon,
          key: key || 'series-' + idx,
          seriesId: key || 'series-' + idx,
          kind: kind,
          cabinetModelId: cabinetModelId,
          order: order,
        };
        var enriched = enrichStep6ItemFromCatalog(draft, catalogSeries);
        if (key.indexOf('/models/') === 0 && enriched.key !== key) {
          if (typeof toastr !== 'undefined') {
            toastr.warning('Ключ «' + key + '» заменён на «' + enriched.key + '» из каталога');
          }
        }
        if ((!cabinetModelId || cabinetModelId <= 0) && enriched.cabinetModelId > 0 && cabEl) {
          cabEl.value = String(enriched.cabinetModelId);
        }
        if (enriched.key !== key) {
          var keyEl = row.querySelector('.room-step-key');
          if (keyEl) keyEl.value = enriched.key;
        }
        step.items.push(enriched);
      });
    }
    step.items = filterAndDedupeStep6Items(step.items, catalogSeries);
    if (step.items.length && defSeriesEl) {
      var firstKey = String(step.items[0].key || step.items[0].seriesId || '').trim();
      if (!defSeries || defSeries === 'volna' || defSeries.indexOf('/models/') === 0) {
        defSeries = firstKey || defSeries;
        defSeriesEl.value = defSeries;
      }
    }
    step.handleDefaults = { seriesId: defSeries || 'volna', finishId: step.handleDefaults?.finishId || null };
    step.defaultHandleSeriesId = defSeries || 'volna';
    return config;
  }

  async function syncRoom2Step6FromHandlesCatalog() {
    var catalogSeries = await fetchHandlesCatalogForAdmin();
    if (!catalogSeries.length) {
      if (typeof toastr !== 'undefined') toastr.error('Каталог ручек пуст (handles.json)');
      else alert('Каталог ручек пуст');
      return;
    }
    var items = mapHandlesSeriesToStep6Items(catalogSeries);
    var container = document.getElementById('room2-step6-items');
    var defSeriesEl = document.getElementById('room2-step6-default-series');
    if (container) {
      container.innerHTML = items.map(function(it, idx) { return buildRoom2Step6ItemHtml(it, idx); }).join('');
      bindRoom2Step6ItemEvents(container);
      updateRoom2Step6Count();
    }
    if (defSeriesEl && items[0]) {
      updateRoom2Step6DefaultSeriesDropdown(false);
      defSeriesEl.value = String(items[0].key || items[0].seriesId || '');
    }
    if (typeof toastr !== 'undefined') {
      toastr.success('Подтянуто коллекций из каталога: ' + items.length);
    }
  }

  async function renderRoom2Step6Panel() {
    var config = getRoomStepsConfig();
    config = ensureStepsInConfig(config);
    var step = config.steps.find(function(s) { return s.stepId === 6; });
    if (!step) {
      step = { stepId: 6, title: DEFAULT_STEP_TITLES[6] || 'Ручки', items: [], columnsPerRow: 2 };
      config.steps.push(step);
    }
    var titleEl = document.getElementById('room2-step6-title');
    var colsEl = document.getElementById('room2-step6-columns');
    var hintEl = document.getElementById('room2-step6-hint');
    var defSeriesEl = document.getElementById('room2-step6-default-series');
    var headingEl = document.getElementById('room2-step6-heading-title');
    var pageHeadingEl = document.getElementById('room2-step6-page-heading');
    var warnEl = document.getElementById('room2-step6-config-warn');
    var container = document.getElementById('room2-step6-items');
    if (!container) return;
    var stepTitle = step.title || DEFAULT_STEP_TITLES[6] || 'Ручки';
    if (headingEl) headingEl.textContent = 'Коллекции ручек — «' + stepTitle + '»';
    if (pageHeadingEl) pageHeadingEl.textContent = stepTitle;
    if (titleEl) titleEl.value = stepTitle;
    if (colsEl) colsEl.value = String(step.columnsPerRow && step.columnsPerRow >= 1 && step.columnsPerRow <= 3 ? step.columnsPerRow : 2);
    if (hintEl) hintEl.value = step.hintText || '';
    var catalogSeries = await fetchHandlesCatalogForAdmin();
    var items = Array.isArray(step.items) ? step.items.slice() : [];
    if (!items.length) {
      items = mapHandlesSeriesToStep6Items(catalogSeries);
    } else {
      items = filterAndDedupeStep6Items(items, catalogSeries);
    }
    var badKeys = items.filter(function(it) {
      var k = String(it.key || it.seriesId || '');
      return k.indexOf('/models/') === 0 || !resolveStep6CollectionFromItem(it, catalogSeries);
    });
    if (warnEl) {
      if (badKeys.length) {
        warnEl.style.display = 'block';
        warnEl.innerHTML = '⚠ В ключе seriesId указан путь к FBX или неизвестная серия. Нажмите «Подтянуть из каталога» или «Сохранить шаг 6» — ключи исправятся автоматически.';
      } else {
        warnEl.style.display = 'none';
        warnEl.innerHTML = '';
      }
    }
    var defId = '';
    if (defSeriesEl) {
      defId = (step.handleDefaults && step.handleDefaults.seriesId) || step.defaultHandleSeriesId || '';
      var defCat = resolveStep6CollectionFromItem({ key: defId, seriesId: defId }, catalogSeries);
      if (defCat) defId = String(defCat.key || defCat.id || defId);
      else if (items[0]) defId = String(items[0].key || items[0].seriesId || defId);
    }
    loadStep6HandleBarSettings();
    container.innerHTML = items.length === 0
      ? '<div class="text-muted p-2">Нет коллекций. Нажмите «Подтянуть из каталога» или проверьте catalog_items/handles.json.</div>'
      : items.sort(function(a, b) { return (a.order || 0) - (b.order || 0); }).map(function(it, idx) { return buildRoom2Step6ItemHtml(it, idx); }).join('');
    bindRoom2Step6ItemEvents(container);
    updateRoom2Step6Count();
    if (defSeriesEl && defSeriesEl.tagName === 'SELECT') {
      updateRoom2Step6DefaultSeriesDropdown(false);
      if (defId) defSeriesEl.value = defId;
    } else if (defSeriesEl) {
      defSeriesEl.value = defId || 'volna';
    }
  }

  function initRoom2Step6() {
    initStep6HandleBarSettings();
    var addBtn = document.getElementById('room2-step6-add-btn');
    var saveBtns = document.querySelectorAll('.room2-step6-save-btn');
    var uploadInput = document.getElementById('room2-step6-icon-upload');
    var syncBtn = document.getElementById('room2-step6-sync-catalog-btn');
    if (syncBtn && !syncBtn._room2Bound) {
      syncBtn._room2Bound = true;
      syncBtn.addEventListener('click', function() {
        syncRoom2Step6FromHandlesCatalog();
      });
    }
    if (addBtn && !addBtn._room2Bound) {
      addBtn._room2Bound = true;
      addBtn.addEventListener('click', function() {
        var container = document.getElementById('room2-step6-items');
        if (!container) return;
        var firstMuted = container.querySelector('.text-muted');
        if (firstMuted) firstMuted.remove();
        var id = 'h' + Date.now();
        var newRow = document.createElement('div');
        newRow.className = 'room-step-item room2-step6-item border-bottom pb-2 mb-2';
        newRow.setAttribute('data-id', id);
        newRow.innerHTML = buildRoom2Step6ItemHtml({ id: id, name: '', key: '', kind: 'bar', order: 0 }, 0);
        container.appendChild(newRow);
        bindRoom2Step6ItemEvents(container);
        updateRoom2Step6Count();
      });
    }
    if (saveBtns && saveBtns.length) {
      saveBtns.forEach(function(btn) {
        if (btn._room2Bound) return;
        btn._room2Bound = true;
        btn.addEventListener('click', function() {
          saveRoom2Step6ToConfig().then(function(cfg) {
            if (saveRoomStepsConfig(cfg)) {
              if (typeof toastr !== 'undefined') toastr.success('Шаг 6 сохранён');
              else alert('Шаг 6 сохранён');
              renderRoom2Step6Panel();
            } else {
              if (typeof toastr !== 'undefined') toastr.error('Ошибка сохранения');
              else alert('Ошибка сохранения');
            }
          }).catch(function(e) {
            console.error('[STEP6] save failed', e);
            if (typeof toastr !== 'undefined') toastr.error('Ошибка сохранения шага 6');
          });
        });
      });
    }
    if (uploadInput && !uploadInput._room2Bound) {
      uploadInput._room2Bound = true;
      uploadInput.addEventListener('change', function() {
        var target = window._roomStepUploadTarget;
        window._roomStepUploadTarget = null;
        var file = this.files && this.files[0];
        if (!file || !target) { this.value = ''; return; }
        var fd = new FormData();
        fd.append('file', file);
        var inputEl = this;
        fetch('/api/upload/room_icon', { method: 'POST', body: fd })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            inputEl.value = '';
            if (data.files && data.files[0] && data.files[0].url) {
              target.value = data.files[0].url;
              target.dispatchEvent(new Event('input', { bubbles: true }));
              if (typeof toastr !== 'undefined') toastr.success('Картинка загружена');
            } else if (typeof toastr !== 'undefined') toastr.error(data.error || 'Ошибка загрузки');
          })
          .catch(function() {
            inputEl.value = '';
            if (typeof toastr !== 'undefined') toastr.error('Ошибка загрузки');
          });
      });
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  // ─── Шаг 5: управление пунктами вкладки «Параметры» ────────────────────
  function step5ParamRowHtml(item, idx) {
    item = item || {};
    var id = (item.id || ('param_' + Date.now() + '_' + idx));
    var label = (item.label || '');
    var popupTitle = (item.popupTitle || '');
    var popupText = (item.popupText || '');
    var options = Array.isArray(item.options) ? item.options.join(' | ') : '';
    var selectedOption = (item.selectedOption || '');
    var hintText = (item.hintText || '');
    return '' +
      '<div class="room2-step5-param-row d-flex flex-wrap gap-2 mb-3" data-idx="' + idx + '" style="align-items:flex-start;border:1px solid #e5e7eb;border-radius:8px;padding:12px;background:#fff;">' +
      '  <div style="flex:1;min-width:200px;">' +
      '    <label class="small text-muted mb-1" style="display:block;">Название пункта (видит пользователь)</label>' +
      '    <input type="text" class="form-control form-control-sm room2-sp-label" placeholder="Напр. Толщина полок" value="' + label.replace(/"/g, '&quot;') + '">' +
      '  </div>' +
      '  <div style="flex:1;min-width:200px;">' +
      '    <label class="small text-muted mb-1" style="display:block;">Заголовок попапа (иконка ?)</label>' +
      '    <input type="text" class="form-control form-control-sm room2-sp-popup-title" placeholder="Напр. Толщина полок" value="' + popupTitle.replace(/"/g, '&quot;') + '">' +
      '  </div>' +
      '  <div style="flex:1 1 100%;min-width:200px;">' +
      '    <label class="small text-muted mb-1" style="display:block;">Текст попапа (подробное описание)</label>' +
      '    <textarea class="form-control form-control-sm room2-sp-popup-text" rows="3" placeholder="Описание для пользователя…">' + popupText.replace(/</g, '&lt;') + '</textarea>' +
      '  </div>' +
      '  <div style="flex:1 1 100%;min-width:220px;">' +
      '    <label class="small text-muted mb-1" style="display:block;">Кнопки-варианты (через |)</label>' +
      '    <input type="text" class="form-control form-control-sm room2-sp-options" placeholder="Напр. Нет | Да или 18 мм | 25 мм" value="' + options.replace(/"/g, '&quot;') + '">' +
      '  </div>' +
      '  <div style="flex:1;min-width:220px;">' +
      '    <label class="small text-muted mb-1" style="display:block;">Выбранная кнопка по умолчанию</label>' +
      '    <input type="text" class="form-control form-control-sm room2-sp-selected-option" placeholder="Напр. Нет" value="' + selectedOption.replace(/"/g, '&quot;') + '">' +
      '  </div>' +
      '  <div style="flex:1 1 100%;min-width:220px;">' +
      '    <label class="small text-muted mb-1" style="display:block;">Пояснительная строка под кнопками</label>' +
      '    <textarea class="form-control form-control-sm room2-sp-hint-text" rows="2" placeholder="Напр. Это автоматически применяется ко всему вашему шкафу.">' + hintText.replace(/</g, '&lt;') + '</textarea>' +
      '  </div>' +
      '  <div style="display:flex;gap:4px;align-items:center;margin-top:4px;">' +
      '    <button type="button" class="btn btn-sm btn-outline-secondary room2-sp-up" title="Вверх"><i class="fa fa-arrow-up"></i></button>' +
      '    <button type="button" class="btn btn-sm btn-outline-secondary room2-sp-down" title="Вниз"><i class="fa fa-arrow-down"></i></button>' +
      '    <button type="button" class="btn btn-sm btn-outline-danger room2-sp-del" title="Удалить"><i class="fa fa-trash"></i></button>' +
      '  </div>' +
      '</div>';
  }

  function collectStep5Params() {
    var list = document.getElementById('room2-step5-params-list');
    if (!list) return [];
    var items = [];
    list.querySelectorAll('.room2-step5-param-row').forEach(function(row, idx) {
      var label = (row.querySelector('.room2-sp-label') || {}).value || '';
      var popupTitle = (row.querySelector('.room2-sp-popup-title') || {}).value || '';
      var popupText = (row.querySelector('.room2-sp-popup-text') || {}).value || '';
      var optionsRaw = (row.querySelector('.room2-sp-options') || {}).value || '';
      var selectedOption = ((row.querySelector('.room2-sp-selected-option') || {}).value || '').trim();
      var hintText = (row.querySelector('.room2-sp-hint-text') || {}).value || '';
      var options = optionsRaw
        .split('|')
        .map(function(s) { return (s || '').trim(); })
        .filter(function(s) { return !!s; });
      if (!label.trim() && !popupText.trim() && options.length === 0 && !hintText.trim()) return;
      items.push({
        id: 'param_' + idx,
        label: label.trim(),
        popupTitle: popupTitle.trim(),
        popupText: popupText.trim(),
        options: options,
        selectedOption: selectedOption,
        hintText: hintText.trim(),
      });
    });
    return items;
  }

  function renderStep5ParamsAdmin() {
    var list = document.getElementById('room2-step5-params-list');
    if (!list) return;
    var config = getRoomStepsConfig();
    config = ensureStepsInConfig(config);
    var step = config.steps.find(function(s) { return s.stepId === 5; });
    var items = (step && Array.isArray(step.step5ParamsItems)) ? step.step5ParamsItems : [];
    if (items.length === 0) {
      list.innerHTML = '<div class="text-muted p-2">Нет пунктов. Нажмите «Добавить пункт».</div>';
    } else {
      list.innerHTML = items.map(function(it, i) { return step5ParamRowHtml(it, i); }).join('');
    }
  }

  function bindStep5ParamsEvents() {
    var list = document.getElementById('room2-step5-params-list');
    var addBtn = document.getElementById('room2-step5-params-add-btn');
    var saveBtn = document.getElementById('room2-step5-params-save-btn');
    if (addBtn && !addBtn._bound) {
      addBtn._bound = true;
      addBtn.addEventListener('click', function() {
        if (!list) return;
        var placeholder = list.querySelector('.text-muted');
        if (placeholder) placeholder.remove();
        var idx = list.querySelectorAll('.room2-step5-param-row').length;
        var div = document.createElement('div');
        div.innerHTML = step5ParamRowHtml({}, idx);
        list.appendChild(div.firstElementChild);
      });
    }
    if (saveBtn && !saveBtn._bound) {
      saveBtn._bound = true;
      saveBtn.addEventListener('click', function() {
        var config = saveRoom2Step5ToConfig();
        var step = config.steps.find(function(s) { return s.stepId === 5; });
        if (!step) { step = { stepId: 5, title: 'Цвет и отделка' }; config.steps.push(step); }
        step.step5ParamsItems = collectStep5Params();
        if (saveRoomStepsConfig(config)) {
          if (typeof toastr !== 'undefined') {
            toastr.success('Шаг 5 сохранён: круги, дефолты снаружи/внутри, параметры (' + step.step5ParamsItems.length + ' пунктов)');
          } else {
            alert('Сохранено');
          }
        } else if (typeof toastr !== 'undefined') {
          toastr.error('Ошибка сохранения');
        }
      });
    }
    if (list && !list._bound) {
      list._bound = true;
      list.addEventListener('click', function(e) {
        var del = e.target.closest('.room2-sp-del');
        if (del) { var row = del.closest('.room2-step5-param-row'); if (row) row.remove(); return; }
        var up = e.target.closest('.room2-sp-up');
        if (up) { var row = up.closest('.room2-step5-param-row'); if (row && row.previousElementSibling) row.parentNode.insertBefore(row, row.previousElementSibling); return; }
        var down = e.target.closest('.room2-sp-down');
        if (down) { var row = down.closest('.room2-step5-param-row'); if (row && row.nextElementSibling) row.parentNode.insertBefore(row.nextElementSibling, row); return; }
      });
    }
  }

  function initRoom2Step5Params() {
    renderStep5ParamsAdmin();
    bindStep5ParamsEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initBulkExportButton();
      initRoomButtons();
      initRoom2RightPanelHandlers();
      initRoom2StepButtons();
      initRoom2Step1();
      initRoom2Step2();
      initRoom2Step3();
      initPriceSublineBlock();
      initStep4SectionDivisionSettings();
      initStep6HandleBarSettings();
      initRoom2Step6();
      initRoom2Step5Params();
      applyRoom2Hash();
      onAdminPageShow();
    });
  } else {
    initBulkExportButton();
    initRoomButtons();
    initRoom2RightPanelHandlers();
    initRoom2StepButtons();
    initRoom2Step1();
    initRoom2Step2();
    initRoom2Step3();
    initPriceSublineBlock();
    initStep4SectionDivisionSettings();
    initStep6HandleBarSettings();
    initRoom2Step6();
    initRoom2Step5Params();
    applyRoom2Hash();
    onAdminPageShow();
  }
  window.addEventListener('hashchange', function() {
    onAdminPageShow();
    var hash = (window.location.hash || '').replace('#', '');
    if (ROOM2_PAGES.indexOf(hash) !== -1) applyRoom2Hash();
  });
  window.addEventListener('popstate', function() {
    var hash = (window.location.hash || '').replace('#', '');
    if (ROOM2_PAGES.indexOf(hash) !== -1) applyRoom2HashSilent();
  });

  function publishRoomStepsApi() {
    window.getRoomStepsConfig = getRoomStepsConfig;
    window.saveRoomStepsConfig = saveRoomStepsConfig;
    window.loadRoomStepsUI = loadRoomStepsUI;
    window.saveRoomSteps = saveRoomSteps;
  }
  publishRoomStepsApi();
  window.addEventListener('load', publishRoomStepsApi);
})();
