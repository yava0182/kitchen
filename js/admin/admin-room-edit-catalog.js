/**
 * Админка: «Управление комнатой 2 → Редактирование комнаты»
 * Каталоги дверей / окон / материалов → room_steps_config.roomEdit
 */
(function () {
  'use strict';

  var KEY = 'room_steps_config';
  var workingCfg = null;
  var TABS = [
    { id: 'doors', label: 'Двери', kind: 'opening' },
    { id: 'windows', label: 'Окна', kind: 'opening' },
    { id: 'walls', label: 'Стены', kind: 'material' },
    { id: 'floors', label: 'Пол', kind: 'material' },
    { id: 'ceilings', label: 'Потолок', kind: 'material' },
  ];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function getCfg() {
    if (typeof window.__cldAdminGetRoomStepsConfig === 'function') {
      try {
        return window.__cldAdminGetRoomStepsConfig() || { steps: [] };
      } catch (_) {}
    }
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var c = JSON.parse(raw);
        if (c && typeof c === 'object') return c;
      }
    } catch (_) {}
    return { steps: [] };
  }

  function saveCfg(cfg) {
    if (typeof window.__cldAdminSaveRoomStepsConfig === 'function') {
      return window.__cldAdminSaveRoomStepsConfig(cfg);
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(cfg));
      fetch('/api/room_steps_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      }).catch(function () {});
      return true;
    } catch (_) {
      return false;
    }
  }

  function emptyRoomEdit() {
    return {
      doors: [
        {
          id: 're-door-clodis-fluted',
          name: 'Дверь фрезерованная',
          group: 'Межкомнатные двери',
          thumb: '/models/doors/thumbs/clodis_door_fluted.svg',
          modelUrl: '/models/doors/clodis_door_fluted.glb',
          defaultWidthCm: 95,
          defaultHeightCm: 207,
          kind: 'interior',
        },
      ],
      windows: [
        {
          id: 're-win-plastic-01-triple',
          name: 'Окно тройное',
          group: 'Пластиковые',
          thumb: '',
          modelUrl: '/models/windows/set-of-plastic-windows-01-01-triple.glb',
          defaultWidthCm: 264,
          defaultHeightCm: 153,
          defaultSillCm: 90,
        },
        {
          id: 're-win-plastic-02-double',
          name: 'Окно двухстворчатое',
          group: 'Пластиковые',
          thumb: '',
          modelUrl: '/models/windows/set-of-plastic-windows-01-02-double.glb',
          defaultWidthCm: 214,
          defaultHeightCm: 153,
          defaultSillCm: 90,
        },
        {
          id: 're-win-plastic-03-small',
          name: 'Окно маленькое',
          group: 'Пластиковые',
          thumb: '',
          modelUrl: '/models/windows/set-of-plastic-windows-01-03-single-small.glb',
          defaultWidthCm: 66,
          defaultHeightCm: 51,
          defaultSillCm: 120,
        },
        {
          id: 're-win-plastic-04-tall',
          name: 'Окно высокое',
          group: 'Пластиковые',
          thumb: '',
          modelUrl: '/models/windows/set-of-plastic-windows-01-04-tall.glb',
          defaultWidthCm: 132,
          defaultHeightCm: 153,
          defaultSillCm: 90,
        },
        {
          id: 're-win-plastic-05-h-double',
          name: 'Окно горизонтальное',
          group: 'Пластиковые',
          thumb: '',
          modelUrl: '/models/windows/set-of-plastic-windows-01-05-horizontal-double.glb',
          defaultWidthCm: 143,
          defaultHeightCm: 44,
          defaultSillCm: 120,
        },
        {
          id: 're-win-plastic-07-h-wide',
          name: 'Окно широкое низкое',
          group: 'Пластиковые',
          thumb: '',
          modelUrl: '/models/windows/set-of-plastic-windows-01-07-horizontal-wide.glb',
          defaultWidthCm: 214,
          defaultHeightCm: 44,
          defaultSillCm: 120,
        },
      ],
      materials: { walls: [], floors: [], ceilings: [] },
    };
  }

  function ensureRoomEdit(cfg) {
    if (!cfg.roomEdit || typeof cfg.roomEdit !== 'object') cfg.roomEdit = emptyRoomEdit();
    var re = cfg.roomEdit;
    if (!Array.isArray(re.doors)) re.doors = [];
    if (!Array.isArray(re.windows)) re.windows = [];
    if (!re.windows.length) re.windows = emptyRoomEdit().windows;
    if (!re.materials || typeof re.materials !== 'object') re.materials = {};
    if (!Array.isArray(re.materials.walls)) re.materials.walls = [];
    if (!Array.isArray(re.materials.floors)) re.materials.floors = [];
    if (!Array.isArray(re.materials.ceilings)) re.materials.ceilings = [];
    return re;
  }

  function getWorking() {
    if (!workingCfg) {
      workingCfg = getCfg();
      ensureRoomEdit(workingCfg);
    }
    return workingCfg;
  }

  function listForTab(re, tabId) {
    if (tabId === 'doors') return re.doors;
    if (tabId === 'windows') return re.windows;
    if (tabId === 'walls') return re.materials.walls;
    if (tabId === 'floors') return re.materials.floors;
    if (tabId === 'ceilings') return re.materials.ceilings;
    return [];
  }

  function setListForTab(re, tabId, items) {
    if (tabId === 'doors') re.doors = items;
    else if (tabId === 'windows') re.windows = items;
    else if (tabId === 'walls') re.materials.walls = items;
    else if (tabId === 'floors') re.materials.floors = items;
    else if (tabId === 'ceilings') re.materials.ceilings = items;
  }

  function previewHtml(it) {
    var thumb = (it.thumb || '').trim();
    var hex = (it.hex || '').trim();
    if (thumb) {
      return (
        '<img src="' +
        esc(thumb) +
        '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" onerror="this.style.display=\'none\'">'
      );
    }
    if (hex) {
      var h = hex.charAt(0) === '#' ? hex : '#' + hex;
      return '<span style="display:block;width:100%;height:100%;background:' + esc(h) + ';border-radius:6px;"></span>';
    }
    return '<i class="fa fa-image" style="font-size:22px;color:#999;"></i>';
  }

  function itemRowHtml(it, tabId, idx) {
    var kind = tabId === 'doors' || tabId === 'windows' ? 'opening' : 'material';
    var extra = '';
    var modelRow = '';
    if (kind === 'opening') {
      extra +=
        '<input type="number" class="form-control form-control-sm room2-re-w" placeholder="Ширина см" title="Ширина по умолчанию, см" value="' +
        esc(it.defaultWidthCm != null ? it.defaultWidthCm : '') +
        '" style="width:88px;">' +
        '<input type="number" class="form-control form-control-sm room2-re-h" placeholder="Высота см" title="Высота по умолчанию, см" value="' +
        esc(it.defaultHeightCm != null ? it.defaultHeightCm : '') +
        '" style="width:88px;">';
      if (tabId === 'windows') {
        extra +=
          '<input type="number" class="form-control form-control-sm room2-re-sill" placeholder="До пола см" title="Расстояние до пола, см" value="' +
          esc(it.defaultSillCm != null ? it.defaultSillCm : '') +
          '" style="width:96px;">';
      }
      if (tabId === 'doors') {
        extra +=
          '<select class="form-control form-control-sm room2-re-kind" title="Тип" style="width:140px;">' +
          '<option value="interior"' +
          (it.kind === 'interior' || !it.kind ? ' selected' : '') +
          '>Межкомнатная</option>' +
          '<option value="exterior"' +
          (it.kind === 'exterior' ? ' selected' : '') +
          '>Входная</option>' +
          '<option value="opening"' +
          (it.kind === 'opening' ? ' selected' : '') +
          '>Проём</option>' +
          '</select>';
      }
      var modelPh =
        tabId === 'doors' ? '/models/doors/….glb или /files/Door/….glb' : '/models/windows/….glb или /files/…';
      modelRow =
        '<div class="d-flex align-items-center flex-wrap gap-2 mt-2" style="padding-left:64px;">' +
        '<span class="text-muted" style="font-size:12px;white-space:nowrap;">3D модель</span>' +
        '<input type="text" class="form-control form-control-sm room2-re-model" placeholder="' +
        esc(modelPh) +
        '" title="Путь к GLB на сервере" value="' +
        esc(it.modelUrl || '') +
        '" style="flex:1;min-width:280px;max-width:520px;">' +
        '<button type="button" class="btn btn-sm btn-primary room2-re-model-btn" title="Выбрать GLB из файлового менеджера">' +
        '<i class="fa fa-cube"></i> Выбрать GLB</button>' +
        '</div>';
    } else {
      extra +=
        '<input type="text" class="form-control form-control-sm room2-re-hex" placeholder="#HEX" value="' +
        esc(it.hex || '') +
        '" style="width:90px;">';
    }
    return (
      '<div class="room2-re-item border-bottom pb-2 mb-2" data-idx="' +
      idx +
      '">' +
      '<div class="d-flex align-items-center flex-wrap gap-2">' +
      '<div class="room2-re-preview" style="width:56px;height:56px;flex:0 0 56px;display:flex;align-items:center;justify-content:center;background:#fff;border:1px solid #ddd;border-radius:8px;overflow:hidden;">' +
      previewHtml(it) +
      '</div>' +
      '<input type="text" class="form-control form-control-sm room2-re-name" placeholder="Название" value="' +
      esc(it.name || '') +
      '" style="width:160px;">' +
      '<input type="text" class="form-control form-control-sm room2-re-group" placeholder="Группа (заголовок)" value="' +
      esc(it.group || '') +
      '" style="width:170px;">' +
      '<input type="text" class="form-control form-control-sm room2-re-thumb" placeholder="URL картинки (иконка)" value="' +
      esc(it.thumb || '') +
      '" style="width:200px;">' +
      '<button type="button" class="btn btn-sm btn-outline-secondary room2-re-upload-btn" title="Загрузить/выбрать картинку-иконку"><i class="fa fa-image"></i> Иконка</button>' +
      extra +
      '<button type="button" class="btn btn-sm btn-outline-danger room2-re-del" title="Удалить"><i class="fa fa-trash"></i></button>' +
      '</div>' +
      modelRow +
      '</div>'
    );
  }

  function currentTab() {
    var on = document.querySelector('.room2-re-tab.is-active');
    return on ? on.getAttribute('data-re-tab') : 'doors';
  }

  function readItemsFromDom(tabId) {
    var box = document.getElementById('room2-re-items');
    if (!box) return [];
    var items = [];
    box.querySelectorAll('.room2-re-item').forEach(function (row, i) {
      var name = (row.querySelector('.room2-re-name') || {}).value || '';
      var group = (row.querySelector('.room2-re-group') || {}).value || '';
      var thumb = (row.querySelector('.room2-re-thumb') || {}).value || '';
      var hexEl = row.querySelector('.room2-re-hex');
      var it = {
        id: 're-' + tabId + '-' + (i + 1),
        name: String(name).trim(),
        group: String(group).trim(),
        thumb: String(thumb).trim(),
      };
      if (hexEl) it.hex = String(hexEl.value || '').trim();
      var w = row.querySelector('.room2-re-w');
      var h = row.querySelector('.room2-re-h');
      var sill = row.querySelector('.room2-re-sill');
      var kind = row.querySelector('.room2-re-kind');
      var model = row.querySelector('.room2-re-model');
      if (w && w.value !== '') it.defaultWidthCm = Number(w.value);
      if (h && h.value !== '') it.defaultHeightCm = Number(h.value);
      if (sill && sill.value !== '') it.defaultSillCm = Number(sill.value);
      if (kind) it.kind = kind.value || 'interior';
      if (model) {
        var mu = String(model.value || '').trim();
        if (mu) it.modelUrl = mu;
      }
      if (it.name || it.thumb || it.hex || it.modelUrl) items.push(it);
    });
    return items;
  }

  function renderList(tabId) {
    var box = document.getElementById('room2-re-items');
    var hint = document.getElementById('room2-re-hint');
    if (!box) return;
    var cfg = getWorking();
    var re = ensureRoomEdit(cfg);
    var items = listForTab(re, tabId);
    var meta = TABS.find(function (t) {
      return t.id === tabId;
    });
    if (hint) {
      if (tabId === 'doors') {
        hint.textContent =
          'Иконка — кнопка «Иконка» (JPG/PNG). 3D — синяя кнопка «Выбрать GLB» под карточкой (папка Door). Сохранить → Ctrl+F5 в комнате.';
      } else if (tabId === 'windows') {
        hint.textContent =
          'Иконка — «Иконка». 3D — «Выбрать GLB». «До пола» — см до низа окна.';
      } else {
        hint.textContent =
          'Образцы в панели «Стиль» комнаты. Цвет #HEX или URL картинки (thumb). Клик по карточке сразу меняет стены / пол / потолок.';
      }
    }
    if (!items.length) {
      box.innerHTML =
        '<div class="text-muted p-2 room2-re-empty">Пока пусто. Нажмите «Добавить» — пункт появится в конструкторе после сохранения и Ctrl+F5.</div>';
    } else {
      box.innerHTML = items.map(function (it, i) {
        return itemRowHtml(it, tabId, i);
      }).join('');
    }
    bindItemEvents(box);
    document.querySelectorAll('.room2-re-tab').forEach(function (btn) {
      var on = btn.getAttribute('data-re-tab') === tabId;
      btn.classList.toggle('is-active', on);
      btn.classList.toggle('btn-primary', on);
      btn.classList.toggle('btn-outline-primary', !on);
    });
    var count = document.getElementById('room2-re-count');
    if (count) count.textContent = String(items.length) + ' · ' + ((meta && meta.label) || tabId);
  }

  function bindItemEvents(box) {
    box.querySelectorAll('.room2-re-del').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var row = this.closest('.room2-re-item');
        if (row) row.remove();
      });
    });
    box.querySelectorAll('.room2-re-thumb').forEach(function (input) {
      input.addEventListener('input', function () {
        var prev = this.closest('.room2-re-item') && this.closest('.room2-re-item').querySelector('.room2-re-preview');
        if (!prev) return;
        var v = this.value.trim();
        if (v) {
          prev.innerHTML =
            '<img src="' +
            v.replace(/"/g, '&quot;') +
            '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">';
        }
      });
    });
    box.querySelectorAll('.room2-re-hex').forEach(function (input) {
      input.addEventListener('input', function () {
        var row = this.closest('.room2-re-item');
        var prev = row && row.querySelector('.room2-re-preview');
        var thumb = row && row.querySelector('.room2-re-thumb');
        if (!prev || (thumb && thumb.value.trim())) return;
        var h = this.value.trim();
        if (!h) return;
        if (h.charAt(0) !== '#') h = '#' + h;
        prev.innerHTML =
          '<span style="display:block;width:100%;height:100%;background:' +
          h.replace(/"/g, '') +
          ';border-radius:6px;"></span>';
      });
    });
    box.querySelectorAll('.room2-re-upload-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var row = this.closest('.room2-re-item');
        var thumbInput = row && row.querySelector('.room2-re-thumb');
        if (!thumbInput) return;
        if (typeof window.openFileManager === 'function') {
          window.openFileManager({
            allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
            initialPath: 'room_icons',
            onSelect: function (r) {
              if (r && r.url) {
                thumbInput.value = r.url;
                thumbInput.dispatchEvent(new Event('input', { bubbles: true }));
              }
            },
          });
          return;
        }
        var fileInput = document.getElementById('room2-re-thumb-upload');
        if (!fileInput) return;
        window._room2ReUploadTarget = thumbInput;
        fileInput.click();
      });
    });
    box.querySelectorAll('.room2-re-model-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var row = this.closest('.room2-re-item');
        var modelInput = row && row.querySelector('.room2-re-model');
        if (!modelInput) return;
        if (typeof window.openFileManager !== 'function') {
          if (typeof toastr !== 'undefined') {
            toastr.warning('Файловый менеджер недоступен. Впишите путь вручную, напр. /files/Door/….glb');
          }
          return;
        }
        var tabId = currentTab();
        window.openFileManager({
          allowedExt: ['.glb', '.gltf'],
          initialPath: tabId === 'doors' ? 'Door' : 'files',
          onSelect: function (r) {
            if (r && r.url) {
              modelInput.value = r.url;
              modelInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
          },
        });
      });
    });
  }

  function addItem() {
    var tabId = currentTab();
    var box = document.getElementById('room2-re-items');
    if (!box) return;
    // Только пустой плейсхолдер — не трогать строки (у них тоже есть .text-muted «3D модель»)
    var emptyHint = box.querySelector('.room2-re-empty');
    if (emptyHint) box.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.innerHTML = itemRowHtml({ name: '', group: '', thumb: '', hex: '', kind: 'interior' }, tabId, 0);
    var row = wrap.firstElementChild;
    box.appendChild(row);
    bindItemEvents(box);
  }

  function stashCurrentTab() {
    var tabId = currentTab();
    var cfg = getWorking();
    var re = ensureRoomEdit(cfg);
    setListForTab(re, tabId, readItemsFromDom(tabId));
    cfg.roomEdit = re;
    return cfg;
  }

  function saveCurrentTab() {
    var cfg = stashCurrentTab();
    var tabId = currentTab();
    if (saveCfg(cfg)) {
      if (typeof toastr !== 'undefined') {
        toastr.success('Сохранено. В конструкторе: Ctrl+F5, «Редактировать комнату».');
      } else {
        alert('Сохранено');
      }
      renderList(tabId);
    } else if (typeof toastr !== 'undefined') {
      toastr.error('Не удалось сохранить');
    } else {
      alert('Ошибка сохранения');
    }
  }

  function switchTab(tabId) {
    if (currentTab() && currentTab() !== tabId) stashCurrentTab();
    renderList(tabId);
  }

  function init() {
    var page = document.getElementById('room2-room-edit');
    if (!page) return;
    workingCfg = getCfg();
    ensureRoomEdit(workingCfg);
    document.querySelectorAll('.room2-re-tab').forEach(function (btn) {
      if (btn._reBound) return;
      btn._reBound = true;
      btn.addEventListener('click', function () {
        switchTab(this.getAttribute('data-re-tab'));
      });
    });
    var addBtn = document.getElementById('room2-re-add-btn');
    if (addBtn && !addBtn._reBound) {
      addBtn._reBound = true;
      addBtn.addEventListener('click', addItem);
    }
    var saveBtn = document.getElementById('room2-re-save-btn');
    if (saveBtn && !saveBtn._reBound) {
      saveBtn._reBound = true;
      saveBtn.addEventListener('click', saveCurrentTab);
    }
    var fileInput = document.getElementById('room2-re-thumb-upload');
    if (fileInput && !fileInput._reBound) {
      fileInput._reBound = true;
      fileInput.addEventListener('change', function () {
        var target = window._room2ReUploadTarget;
        window._room2ReUploadTarget = null;
        var file = this.files && this.files[0];
        if (!file || !target) {
          this.value = '';
          return;
        }
        var fd = new FormData();
        fd.append('file', file);
        var inputEl = this;
        fetch('/api/upload/room_icon', { method: 'POST', body: fd })
          .then(function (r) {
            return r.json();
          })
          .then(function (data) {
            inputEl.value = '';
            if (data.files && data.files[0] && data.files[0].url) {
              target.value = data.files[0].url;
              target.dispatchEvent(new Event('input', { bubbles: true }));
              if (typeof toastr !== 'undefined') toastr.success('Картинка загружена');
            } else if (typeof toastr !== 'undefined') toastr.error(data.error || 'Ошибка загрузки');
          })
          .catch(function () {
            inputEl.value = '';
            if (typeof toastr !== 'undefined') toastr.error('Ошибка загрузки');
          });
      });
    }
    renderList(currentTab() || 'doors');
  }

  window.initRoom2RoomEditCatalog = init;
})();
