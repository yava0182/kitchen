(function () {
  'use strict';

  var ROOM_STEPS_CONFIG_KEY = 'room_steps_config';
  var DRAWER_CATALOG_TYPE = 'catalog_33';
  var GUIDE_CATALOG_TYPE = 'catalog_34';
  var drawerItemsCache = null;
  var guideItemsCache = null;
  var pickerTargetRow = null;
  var pickerMode = 'drawer';

  function num(v, fallback) {
    var n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function normalizeRules(raw) {
    var arr = Array.isArray(raw) ? raw : [];
    return arr
      .map(function (r, idx) {
        var minDepthMm = Math.round(Math.max(0, num(r && r.minDepthMm, 0)));
        var maxDepthMm = Math.round(Math.max(minDepthMm, num(r && r.maxDepthMm, minDepthMm)));
        var drawerCatalogId = String((r && (r.drawerCatalogId != null ? r.drawerCatalogId : r.catalogId)) || '').trim();
        var guideCatalogId = String((r && (r.guideCatalogId != null ? r.guideCatalogId : (r.railKey != null ? r.railKey : (r.drawerRailKey != null ? r.drawerRailKey : '')))) || '').trim();
        var name = String((r && r.name) || '').trim();
        var order = Number.isFinite(Number(r && r.order)) ? Number(r.order) : idx + 1;
        return {
          minDepthMm: minDepthMm,
          maxDepthMm: maxDepthMm,
          drawerCatalogId: drawerCatalogId,
          guideCatalogId: guideCatalogId,
          name: name,
          order: order
        };
      })
      .sort(function (a, b) {
        if (a.order !== b.order) return a.order - b.order;
        return a.minDepthMm - b.minDepthMm;
      });
  }

  function readConfig() {
    try {
      if (typeof window.getRoomStepsConfig === 'function') return window.getRoomStepsConfig() || { steps: [] };
      var raw = localStorage.getItem(ROOM_STEPS_CONFIG_KEY);
      return raw ? JSON.parse(raw) : { steps: [] };
    } catch (_) {
      return { steps: [] };
    }
  }

  function saveConfig(cfg) {
    try {
      if (typeof window.saveRoomStepsConfig === 'function') return !!window.saveRoomStepsConfig(cfg);
      localStorage.setItem(ROOM_STEPS_CONFIG_KEY, JSON.stringify(cfg));
      return true;
    } catch (_) {
      return false;
    }
  }

  function getTbody() { return document.getElementById('drawer-depth-rules-tbody'); }
  function getStatus() { return document.getElementById('drawer-depth-rules-status'); }

  function setStatus(msg, isError) {
    var el = getStatus();
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#d32f2f' : '#6b7280';
  }

  function rowHtml(rule, idx) {
    return (
      '<tr data-idx="' + idx + '">' +
        '<td><input type="number" min="1" step="1" class="form-control form-control-sm" data-field="order" value="' + String(rule.order || (idx + 1)) + '"></td>' +
        '<td><input type="number" min="0" step="1" class="form-control form-control-sm" data-field="minDepthMm" value="' + String(rule.minDepthMm || 0) + '"></td>' +
        '<td><input type="number" min="0" step="1" class="form-control form-control-sm" data-field="maxDepthMm" value="' + String(rule.maxDepthMm || 0) + '"></td>' +
        '<td><div style="display:flex; gap:6px;"><input type="text" class="form-control form-control-sm" data-field="drawerCatalogId" value="' + String(rule.drawerCatalogId || '').replace(/"/g, '&quot;') + '" placeholder="напр. 500"><button type="button" class="btn btn-white btn-xs drawer-depth-rule-pick-drawer">…</button></div></td>' +
        '<td><div style="display:flex; gap:6px;"><input type="text" class="form-control form-control-sm" data-field="guideCatalogId" value="' + String(rule.guideCatalogId || '').replace(/"/g, '&quot;') + '" placeholder="напр. 2"><button type="button" class="btn btn-white btn-xs drawer-depth-rule-pick-guide">…</button></div></td>' +
        '<td><input type="text" class="form-control form-control-sm" data-field="name" value="' + String(rule.name || '').replace(/"/g, '&quot;') + '" placeholder="Направляющие 500"></td>' +
        '<td><button type="button" class="btn btn-link btn-sm text-danger p-0 drawer-depth-rule-del">×</button></td>' +
      '</tr>'
    );
  }

  function renderRules() {
    var page = document.getElementById('drawer-depth-rules');
    if (!page) return;
    var tbody = getTbody();
    if (!tbody) return;
    var cfg = readConfig();
    var rules = normalizeRules(cfg.drawerDepthRulesGlobal || []);
    if (!rules.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-muted">Правил пока нет. Нажмите «Добавить интервал».</td></tr>';
      return;
    }
    tbody.innerHTML = rules.map(function (r, i) { return rowHtml(r, i); }).join('');
  }

  function collectRulesFromDom() {
    var tbody = getTbody();
    if (!tbody) return [];
    var rows = tbody.querySelectorAll('tr[data-idx]');
    var out = [];
    rows.forEach(function (tr, idx) {
      var order = num(tr.querySelector('[data-field="order"]') && tr.querySelector('[data-field="order"]').value, idx + 1);
      var minDepthMm = Math.round(Math.max(0, num(tr.querySelector('[data-field="minDepthMm"]') && tr.querySelector('[data-field="minDepthMm"]').value, 0)));
      var maxDepthMm = Math.round(Math.max(minDepthMm, num(tr.querySelector('[data-field="maxDepthMm"]') && tr.querySelector('[data-field="maxDepthMm"]').value, minDepthMm)));
      var drawerCatalogId = String((tr.querySelector('[data-field="drawerCatalogId"]') && tr.querySelector('[data-field="drawerCatalogId"]').value) || '').trim();
      var guideCatalogId = String((tr.querySelector('[data-field="guideCatalogId"]') && tr.querySelector('[data-field="guideCatalogId"]').value) || '').trim();
      var name = String((tr.querySelector('[data-field="name"]') && tr.querySelector('[data-field="name"]').value) || '').trim();
      out.push({
        order: order,
        minDepthMm: minDepthMm,
        maxDepthMm: maxDepthMm,
        drawerCatalogId: drawerCatalogId,
        guideCatalogId: guideCatalogId,
        name: name
      });
    });
    return normalizeRules(out);
  }

  function addRule() {
    var cfg = readConfig();
    var rules = normalizeRules(cfg.drawerDepthRulesGlobal || []);
    var nextOrder = rules.length ? Math.max.apply(null, rules.map(function (r) { return Number(r.order) || 0; })) + 1 : 1;
    rules.push({ order: nextOrder, minDepthMm: 455, maxDepthMm: 504, drawerCatalogId: '', guideCatalogId: '', name: '' });
    cfg.drawerDepthRulesGlobal = normalizeRules(rules);
    if (!saveConfig(cfg)) {
      setStatus('Ошибка сохранения.', true);
      return;
    }
    renderRules();
    setStatus('Интервал добавлен.');
  }

  function saveRules() {
    var rules = collectRulesFromDom();
    var cfg = readConfig();
    cfg.drawerDepthRulesGlobal = rules;
    if (!saveConfig(cfg)) {
      setStatus('Ошибка сохранения.', true);
      return;
    }
    renderRules();
    setStatus('Сохранено.');
    if (typeof toastr !== 'undefined') toastr.success('Подбор ящиков сохранен');
  }

  function bindEvents() {
    var addBtn = document.getElementById('drawer-depth-rules-add-btn');
    if (addBtn && !addBtn._bound) {
      addBtn._bound = true;
      addBtn.addEventListener('click', addRule);
    }
    var saveBtn = document.getElementById('drawer-depth-rules-save-btn');
    if (saveBtn && !saveBtn._bound) {
      saveBtn._bound = true;
      saveBtn.addEventListener('click', saveRules);
    }
    var tbody = getTbody();
    if (tbody && !tbody._bound) {
      tbody._bound = true;
      tbody.addEventListener('click', function (e) {
        var del = e.target.closest('.drawer-depth-rule-del');
        if (!del) return;
        var tr = del.closest('tr[data-idx]');
        if (tr) tr.remove();
      });
      tbody.addEventListener('click', function (e) {
        var pickDrawerBtn = e.target.closest('.drawer-depth-rule-pick-drawer');
        var pickGuideBtn = e.target.closest('.drawer-depth-rule-pick-guide');
        if (!pickDrawerBtn && !pickGuideBtn) return;
        var srcBtn = pickGuideBtn || pickDrawerBtn;
        var tr = srcBtn.closest('tr[data-idx]');
        if (!tr) return;
        pickerTargetRow = tr;
        pickerMode = pickGuideBtn ? 'guide' : 'drawer';
        openPicker();
      });
    }
    bindPickerEvents();
  }

  function normalizeCatalogItems(data) {
    var raw = Array.isArray(data) ? data : (data && data.items != null ? data.items : []);
    if (!Array.isArray(raw)) raw = Object.values(raw || {});
    return raw
      .filter(Boolean)
      .map(function (it) {
        var d = it.data || {};
        var p = it.params || d.params || d || {};
        return {
          id: String(it.id ?? it.ID ?? '').trim(),
          name: String(it.name || d.name || p.name || 'Без названия').trim(),
          code: String(it.code || d.code || p.code || it.article || d.article || '').trim()
        };
      })
      .filter(function (it) { return !!it.id; });
  }

  async function loadCatalogItems(catalogType, force) {
    if (catalogType === DRAWER_CATALOG_TYPE && drawerItemsCache && !force) return drawerItemsCache;
    if (catalogType === GUIDE_CATALOG_TYPE && guideItemsCache && !force) return guideItemsCache;
    var resp = await fetch('/api/catalog/items_get/' + encodeURIComponent(catalogType) + '?t=' + Date.now(), { cache: 'no-cache' });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    var data = await resp.json();
    var normalized = normalizeCatalogItems(data);
    if (catalogType === DRAWER_CATALOG_TYPE) drawerItemsCache = normalized;
    if (catalogType === GUIDE_CATALOG_TYPE) guideItemsCache = normalized;
    return normalized;
  }

  function pickerModalEl() { return document.getElementById('drawer-depth-rules-picker-modal'); }
  function pickerBodyEl() { return document.getElementById('drawer-depth-rules-picker-body'); }
  function pickerSearchEl() { return document.getElementById('drawer-depth-rules-picker-search'); }

  function closePicker() {
    var m = pickerModalEl();
    if (m) m.style.display = 'none';
  }

  function openPicker() {
    var m = pickerModalEl();
    if (!m) return;
    var t = document.getElementById('drawer-depth-rules-picker-title');
    if (t) t.textContent = pickerMode === 'guide' ? 'Выбор направляющей из каталога' : 'Выбор ящика из каталога';
    m.style.display = 'block';
    renderPickerRows();
  }

  function applyPickerSelection(item) {
    if (!pickerTargetRow || !item) return;
    var idField = pickerMode === 'guide' ? 'guideCatalogId' : 'drawerCatalogId';
    var idEl = pickerTargetRow.querySelector('[data-field="' + idField + '"]');
    var nameEl = pickerTargetRow.querySelector('[data-field="name"]');
    if (idEl) idEl.value = String(item.id || '').trim();
    if (nameEl && (!String(nameEl.value || '').trim() || pickerMode === 'drawer')) {
      nameEl.value = String(item.name || '').trim();
    }
  }

  function renderPickerRows() {
    var body = pickerBodyEl();
    if (!body) return;
    var q = String((pickerSearchEl() && pickerSearchEl().value) || '').trim().toLowerCase();
    body.innerHTML = '<tr><td colspan="4" class="text-muted">Загрузка…</td></tr>';
    var catalogType = pickerMode === 'guide' ? GUIDE_CATALOG_TYPE : DRAWER_CATALOG_TYPE;
    loadCatalogItems(catalogType, false)
      .then(function (items) {
        var list = q
          ? items.filter(function (it) {
              return (
                (it.name || '').toLowerCase().indexOf(q) !== -1 ||
                (it.code || '').toLowerCase().indexOf(q) !== -1 ||
                String(it.id).indexOf(q) !== -1
              );
            })
          : items;
        if (!list.length) {
          body.innerHTML = '<tr><td colspan="4" class="text-muted">Ничего не найдено</td></tr>';
          return;
        }
        body.innerHTML = list.map(function (it) {
          return (
            '<tr>' +
              '<td>' + String(it.id).replace(/</g, '&lt;') + '</td>' +
              '<td>' + String(it.name || '').replace(/</g, '&lt;') + '</td>' +
              '<td>' + String(it.code || '').replace(/</g, '&lt;') + '</td>' +
              '<td><button type="button" class="btn btn-primary btn-xs drawer-depth-picker-select" data-id="' + String(it.id).replace(/"/g, '&quot;') + '">Выбрать</button></td>' +
            '</tr>'
          );
        }).join('');
      })
      .catch(function (e) {
        body.innerHTML = '<tr><td colspan="4" class="text-danger">Ошибка загрузки: ' + String((e && e.message) || e) + '</td></tr>';
      });
  }

  function bindPickerEvents() {
    var closeBtn = document.getElementById('drawer-depth-rules-picker-close');
    if (closeBtn && !closeBtn._bound) {
      closeBtn._bound = true;
      closeBtn.addEventListener('click', closePicker);
    }
    var closeFooterBtn = document.getElementById('drawer-depth-rules-picker-close-footer');
    if (closeFooterBtn && !closeFooterBtn._bound) {
      closeFooterBtn._bound = true;
      closeFooterBtn.addEventListener('click', closePicker);
    }
    var refreshBtn = document.getElementById('drawer-depth-rules-picker-refresh');
    if (refreshBtn && !refreshBtn._bound) {
      refreshBtn._bound = true;
      refreshBtn.addEventListener('click', function () {
        if (pickerMode === 'guide') guideItemsCache = null;
        else drawerItemsCache = null;
        renderPickerRows();
      });
    }
    var searchEl = pickerSearchEl();
    if (searchEl && !searchEl._bound) {
      searchEl._bound = true;
      searchEl.addEventListener('input', renderPickerRows);
    }
    var body = pickerBodyEl();
    if (body && !body._bound) {
      body._bound = true;
      body.addEventListener('click', function (e) {
        var btn = e.target.closest('.drawer-depth-picker-select');
        if (!btn) return;
        var id = String(btn.getAttribute('data-id') || '').trim();
        if (!id) return;
        var cache = pickerMode === 'guide' ? (guideItemsCache || []) : (drawerItemsCache || []);
        var hit = cache.find(function (x) { return String(x.id) === id; });
        applyPickerSelection(hit || { id: id, name: '' });
        closePicker();
      });
    }
    var modal = pickerModalEl();
    if (modal && !modal._bound) {
      modal._bound = true;
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closePicker();
      });
    }
  }

  function onHashMaybeRender() {
    var page = document.getElementById('drawer-depth-rules');
    if (!page) return;
    bindEvents();
    renderRules();
    setStatus('');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onHashMaybeRender);
  } else {
    onHashMaybeRender();
  }
  window.addEventListener('load', onHashMaybeRender);
  setTimeout(onHashMaybeRender, 200);
  window.addEventListener('hashchange', onHashMaybeRender);
})();
