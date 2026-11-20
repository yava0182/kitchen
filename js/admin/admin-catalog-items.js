/**
 * admin-catalog-items.js — Элементы каталога (catalog-items)
 * Extracted from admin-new.html for better Cursor performance
 */
(function() {
  'use strict';

  function readClodisJSON(obj) {
    if (typeof globalThis !== 'undefined' && typeof globalThis.__cldReadClodisJSON === 'function') {
      return globalThis.__cldReadClodisJSON(obj);
    }
    if (!obj || typeof obj !== 'object') return undefined;
    if (Array.isArray(obj)) return obj;
    if (obj.clodisJSON != null) return obj.clodisJSON;
    if (obj.data && typeof obj.data === 'object' && obj.data.clodisJSON != null) {
      return obj.data.clodisJSON;
    }
    return undefined;
  }

  // Состояние списка элементов (поиск, фильтры, пагинация)
  const state = {
    catalogType: '',
    catalogName: '',
    items: [],
    filteredItems: [],
    search: '',
    category: '',
    perPage: 20,
    currentPage: 1,
    categoriesHash: {},  // id -> name для отображения категорий по названию (как в референсе)
  };

  function escapeHtml(s) {
    const t = String(s ?? '');
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function normalizeCategories(value) {
    if (!value) return [];
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      if (Array.isArray(parsed)) {
        return parsed.map(String);
      }
      return [String(parsed)];
    } catch {
      return [String(value)];
    }
  }

  /** Извлекает поля для отображения: поддерживает format с data (catalog_25) и плоский (Clodis) */
  function getDisplayFields(item) {
    const d = item.data != null ? (typeof item.data === 'string' ? (() => { try { return JSON.parse(item.data); } catch { return {}; } })() : item.data) : {};
    let sizeText = '-';
    if (d.params && d.params.variants && d.params.variants[0]) {
      const v = d.params.variants[0];
      const w = v.width ?? v.size?.x ?? '-';
      const h = v.height ?? v.size?.y ?? '-';
      const dp = v.depth ?? v.size?.z ?? '-';
      sizeText = `${w}x${h}x${dp}`;
    } else if (d.width != null || d.height != null || d.depth != null) {
      sizeText = `${d.width ?? '-'}x${d.height ?? '-'}x${d.depth ?? '-'}`;
    }
    return {
      name: (d.name != null && String(d.name).trim() !== '' ? String(d.name).trim() : null) ?? item.name ?? '',
      icon: item.icon ?? d.icon ?? '',
      code: item.code ?? d.article ?? d.code ?? '',
      category: item.category ?? d.category ?? [],
      order: item.order ?? d.order ?? 0,
      active: item.active ?? d.active ?? 1,
      sizeText: sizeText
    };
  }

  /** Собирает уникальные категории для фильтра: id и имя (для отображения имён в dropdown) */
  function collectCategories(items) {
    const hash = state.categoriesHash || {};
    const byId = new Set();
    const byName = new Set();
    items.forEach((item) => {
      const fields = getDisplayFields(item);
      normalizeCategories(fields.category).forEach((c) => {
        const key = String(c).trim();
        if (!key) return;
        byId.add(key);
        const name = hash[key] || key;
        byName.add(name);
      });
    });
    return Array.from(byId).map((id) => ({ id, name: hash[id] || id })).sort((a, b) => String(a.name).localeCompare(String(b.name), 'ru'));
  }

  function applyFiltersAndRender() {
    const tbody = document.getElementById('catalog-items-table-body');
    const infoEl = document.getElementById('catalog-items-pagination-info');
    const paginationEl = document.getElementById('catalog-items-pagination');
    if (!tbody) return;

    const searchInput = document.getElementById('catalog-items-search-input');
    const categorySelect = document.getElementById('catalog-items-category-filter');
    const perPageSelect = document.getElementById('catalog-items-per-page');

    state.search = (searchInput?.value || '').trim().toLowerCase();
    state.category = (categorySelect?.value || '').trim();
    state.perPage = Number(perPageSelect?.value || state.perPage) || 20;

    let items = state.items || [];

    // Поиск по имени и коду
    if (state.search) {
      const q = state.search;
      items = items.filter((item) => {
        const f = getDisplayFields(item);
        const name = String(f.name || '').toLowerCase();
        const code = String(f.code || '').toLowerCase();
        return name.includes(q) || code.includes(q);
      });
    }

    // Фильтр по категории (state.category может быть id или имя)
    if (state.category) {
      const hash = state.categoriesHash || {};
      const selId = state.category;
      const selName = hash[selId] || selId;
      items = items.filter((item) => {
        const f = getDisplayFields(item);
        const cats = normalizeCategories(f.category);
        return cats.includes(selId) || cats.some((cid) => (hash[cid] || cid) === selName);
      });
    }

    state.filteredItems = items;

    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / state.perPage));
    if (state.currentPage > pages) state.currentPage = pages;
    if (state.currentPage < 1) state.currentPage = 1;

    const startIndex = (state.currentPage - 1) * state.perPage;
    const pageItems = items.slice(startIndex, startIndex + state.perPage);

    renderTable(pageItems);

    const from = total === 0 ? 0 : startIndex + 1;
    const to = startIndex + pageItems.length;
    if (infoEl) {
      infoEl.textContent = `Показано ${from}-${to} из ${total}`;
    }

    if (paginationEl) {
      paginationEl.innerHTML = '';
      if (pages <= 1) return;

      const makePageLi = (page, text, disabled = false, active = false) => {
        const li = document.createElement('li');
        li.className = 'page-item' + (disabled ? ' disabled' : '') + (active ? ' active' : '');
        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = '#';
        a.textContent = text;
        if (!disabled) {
          a.dataset.page = String(page);
        }
        li.appendChild(a);
        return li;
      };

      // prev
      paginationEl.appendChild(makePageLi(state.currentPage - 1, '«', state.currentPage === 1));

      for (let p = 1; p <= pages; p++) {
        paginationEl.appendChild(makePageLi(p, String(p), false, p === state.currentPage));
      }

      // next
      paginationEl.appendChild(makePageLi(state.currentPage + 1, '»', state.currentPage === pages));
    }
  }

  function renderTable(items) {
    const tbody = document.getElementById('catalog-items-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!items || !items.length) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:20px; color:#999;">Нет элементов</td></tr>';
      return;
    }

    const accUrl = (window.glob?.acc_url || '/').replace(/\/$/, '');

    items.forEach((item) => {
      const f = getDisplayFields(item);
      const row = document.createElement('tr');

      const checkboxCell = document.createElement('td');
      checkboxCell.className = 'col-check';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'catalog-item-checkbox';
      checkbox.value = item.id;
      checkboxCell.appendChild(checkbox);

      const idCell = document.createElement('td');
      idCell.className = 'col-id';
      idCell.textContent = item.id || '-';

      const iconCell = document.createElement('td');
      iconCell.className = 'col-icon';
      if (f.icon) {
        const img = document.createElement('img');
        img.src = accUrl + (f.icon.startsWith('/') ? '' : '/') + f.icon;
        img.className = 'admin-list-thumb';
        img.onerror = function() { this.style.display = 'none'; iconCell.innerHTML = '<div class="admin-list-thumb-empty"></div>'; };
        iconCell.appendChild(img);
      } else {
        iconCell.innerHTML = '<div class="admin-list-thumb-empty"></div>';
      }

      const nameCell = document.createElement('td');
      nameCell.textContent = f.name || '-';

      const sizeCell = document.createElement('td');
      sizeCell.style.width = '120px';
      sizeCell.textContent = f.sizeText;

      const codeCell = document.createElement('td');
      codeCell.style.width = '120px';
      codeCell.textContent = f.code || '-';

      const categoryCell = document.createElement('td');
      const hash = state.categoriesHash || {};
      const cats = normalizeCategories(f.category);
      const catNames = cats.map((id) => hash[id] || id);
      categoryCell.textContent = catNames.join(', ') || '-';

      const orderCell = document.createElement('td');
      orderCell.className = 'col-order';
      orderCell.textContent = String(f.order ?? '0');

      const visibilityCell = document.createElement('td');
      visibilityCell.className = 'col-vis';
      const active = (f.active == '1' || f.active === 1);
      visibilityCell.innerHTML = active
        ? '<button type="button" class="btn btn-xs btn-outline btn-success" title="Видим"><i class="fa fa-eye"></i></button>'
        : '<button type="button" class="btn btn-xs btn-outline btn-default" title="Скрыт"><i class="fa fa-eye-slash"></i></button>';

      const actionsCell = document.createElement('td');
      actionsCell.className = 'col-actions';

      const actionsWrap = document.createElement('div');
      actionsWrap.className = 'cld-row-actions';

      const editIcon = document.createElement('i');
      editIcon.className = 'fa fa-edit btn btn-outline btn-success';
      editIcon.title = 'Редактировать';
      editIcon.style.cursor = 'pointer';
      editIcon.onclick = () => {
        if (typeof window.openCatalogItemEdit === 'function') window.openCatalogItemEdit(item.id, state.catalogType, state.catalogName);
      };
      actionsWrap.appendChild(editIcon);

      const copyIcon = document.createElement('i');
      copyIcon.className = 'fa fa-link btn btn-outline btn-primary';
      copyIcon.title = 'Копировать в этот каталог';
      copyIcon.style.cursor = 'pointer';
      copyIcon.onclick = () => {
        if (typeof window.copyCatalogItem === 'function') {
          window.copyCatalogItem(item.id, state.catalogType, state.catalogName);
        } else {
          alert('Функция копирования не загружена. Обновите страницу (Ctrl+F5).');
        }
      };
      actionsWrap.appendChild(copyIcon);

      const copyOtherIcon = document.createElement('i');
      copyOtherIcon.className = 'fa fa-exchange btn btn-outline btn-info';
      copyOtherIcon.title = 'Копировать в другой каталог';
      copyOtherIcon.style.cursor = 'pointer';
      copyOtherIcon.onclick = () => {
        if (typeof window.copyCatalogItemToOther === 'function') {
          window.copyCatalogItemToOther(item.id, state.catalogType, state.catalogName);
        }
      };
      actionsWrap.appendChild(copyOtherIcon);

      const deleteIcon = document.createElement('i');
      deleteIcon.className = 'fa fa-trash btn btn-outline btn-danger';
      deleteIcon.title = 'Удалить';
      deleteIcon.style.cursor = 'pointer';
      deleteIcon.onclick = () => {
        if (confirm('Вы уверены, что хотите удалить этот элемент?')) {
          if (typeof window.deleteCatalogItem === 'function') window.deleteCatalogItem(item.id, state.catalogType, state.catalogName);
          else {}
        }
      };
      actionsWrap.appendChild(deleteIcon);

      actionsCell.appendChild(actionsWrap);

      row.appendChild(checkboxCell);
      row.appendChild(idCell);
      row.appendChild(iconCell);
      row.appendChild(nameCell);
      row.appendChild(sizeCell);
      row.appendChild(codeCell);
      row.appendChild(categoryCell);
      row.appendChild(orderCell);
      row.appendChild(visibilityCell);
      row.appendChild(actionsCell);
      tbody.appendChild(row);
    });

    if (typeof window.refreshHingeFacadePickCatalogUI === 'function') {
      try {
        window.refreshHingeFacadePickCatalogUI();
      } catch (pickErr) {
        console.warn('[catalog-items] hinge pick UI:', pickErr);
      }
    }
    if (typeof window.refreshInteriorTemplatePickCatalogUI === 'function') {
      try {
        window.refreshInteriorTemplatePickCatalogUI();
      } catch (pickErr) {
        console.warn('[catalog-items] interior template pick UI:', pickErr);
      }
    }
  }

  async function loadCatalogItems(catalogType, catalogName) {
    try {
      const tbody = document.getElementById('catalog-items-table-body');
      const titleElement = document.getElementById('catalog-items-title');
      const subtitleElement = document.getElementById('catalog-items-subtitle');

      if (!tbody) return;

      // Если тип не передан (например, при сабмите поиска) — берем из текущего состояния
      const effectiveType = catalogType || state.catalogType;
      const effectiveName = catalogName || state.catalogName || catalogName || catalogType;

      if (!effectiveType) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:20px; color:#999;">Выберите тип элементов из меню</td></tr>';
        return;
      }

      state.catalogType = effectiveType;
      state.catalogName = effectiveName || effectiveType;
      state.currentPage = 1;

      if (titleElement) titleElement.textContent = `Список ${state.catalogName}`;
      if (subtitleElement) subtitleElement.textContent = state.catalogName;

      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:20px;">Загрузка...</td></tr>';

      const response = await fetch(`/api/catalog/items_get/${encodeURIComponent(effectiveType)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      const data = await response.json();

      let items = [];
      if (Array.isArray(data)) items = data;
      else if (data && data.items && Array.isArray(data.items)) items = data.items;

      state.items = items || [];
      window.__cldLastCatalogItemsForPicker = {
        type: effectiveType,
        items: state.items,
        loadedAt: Date.now(),
      };

      // Загружаем категории для отображения имён вместо ID (как в референсе)
      try {
        const catResp = await fetch('/api/catalog/categories_get/' + encodeURIComponent(effectiveType) + '?t=' + Date.now(), { cache: 'no-cache' });
        if (catResp.ok) {
          const catArr = await catResp.json();
          const hash = {};
          (Array.isArray(catArr) ? catArr : []).forEach((c) => {
            if (c && (c.id != null || c.category_id != null)) {
              const id = String(c.id ?? c.category_id);
              hash[id] = c.name || c.label || id;
            }
          });
          state.categoriesHash = hash;
        } else {
          state.categoriesHash = {};
        }
      } catch (e) {
        state.categoriesHash = {};
      }

      // Заполняем список категорий для фильтра (названиями)
      const categorySelect = document.getElementById('catalog-items-category-filter');
      if (categorySelect) {
        const prev = categorySelect.value;
        const categories = collectCategories(state.items);
        categorySelect.innerHTML = '<option value="">Нет</option>' + categories.map((c) => `<option value="${escapeHtml(String(c.id))}">${escapeHtml(String(c.name))}</option>`).join('');
        if (prev && categories.some((c) => c.id === prev || c.name === prev)) categorySelect.value = prev;
      }

      applyFiltersAndRender();
    } catch (error) {
      console.error('❌ Ошибка загрузки элементов каталога:', error);
      const tbody = document.getElementById('catalog-items-table-body');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:20px; color:#dc3545;">Ошибка загрузки: ${error.message}</td></tr>`;
      }
    }
  }

  function loadCatalogItemsFromHash() {
    const hash = (window.location.hash || '').split('?')[1] || '';
    const params = new URLSearchParams(hash);
    const catalogType = params.get('type') || '';
    if (!catalogType) return;
    const menuLink = document.querySelector(`a[data-catalog-type="${CSS.escape(catalogType)}"]`);
    const catalogName = menuLink ? (menuLink.getAttribute('data-catalog-name') || catalogType) : catalogType;
    loadCatalogItems(catalogType, catalogName);
  }

  function isGenericSectionLabel(nm) {
    const s = String(nm || '').trim().toLowerCase();
    return s === 'секция' || s === 'section';
  }

  function walkConstructorNodes(node, visit) {
    if (!node || typeof visit !== 'function') return;
    if (Array.isArray(node)) {
      node.forEach((n) => walkConstructorNodes(n, visit));
      return;
    }
    if (typeof node !== 'object') return;
    visit(node);
    if (Array.isArray(node.children)) node.children.forEach((c) => walkConstructorNodes(c, visit));
    const st = node.template && Array.isArray(node.template.structure) ? node.template.structure : null;
    if (st) st.forEach((c) => walkConstructorNodes(c, visit));
    const tr =
      node.spec && node.spec.template && Array.isArray(node.spec.template.tree)
        ? node.spec.template.tree
        : null;
    if (tr) tr.forEach((c) => walkConstructorNodes(c, visit));
  }

  function firstAnimatorDoorOffset(tree) {
    let found = null;
    walkConstructorNodes(tree, (n) => {
      if (found) return;
      if (String(n.type || '').toLowerCase() !== 'animator') return;
      const off = n.spec && n.spec.door_offset;
      if (off && typeof off === 'object') {
        const x = Number(off.x) || 0;
        const y = Number(off.y) || 0;
        const z = Number(off.z) || 0;
        if (x || y || z) found = { x, y, z };
      }
    });
    return found;
  }

  /** Синхронизирует door_offset между clodisJSON и constructor_structure (после копии). */
  function reconcileAnimatorDoorOffsetInItemData(data) {
    if (!data || typeof data !== 'object') return;
    const ppj = readClodisJSON(data);
    const cs = data.constructor_structure;
    if (!ppj && !cs) return;
    const offPpj = ppj ? firstAnimatorDoorOffset(ppj) : null;
    const offCs = cs ? firstAnimatorDoorOffset(cs) : null;
    const src = offPpj || offCs;
    if (!src) return;
    const apply = (tree) => {
      walkConstructorNodes(tree, (n) => {
        if (String(n.type || '').toLowerCase() !== 'animator') return;
        if (!n.spec || typeof n.spec !== 'object') n.spec = {};
        const cur = n.spec.door_offset;
        const cx = cur && typeof cur === 'object' ? Number(cur.x) || 0 : 0;
        const cy = cur && typeof cur === 'object' ? Number(cur.y) || 0 : 0;
        const cz = cur && typeof cur === 'object' ? Number(cur.z) || 0 : 0;
        if (!cx && !cy && !cz) n.spec.door_offset = { ...src };
      });
    };
    if (ppj) apply(ppj);
    if (cs) apply(cs);
  }

  /** Имя карточки каталога — только вкладка «Основные» (не подпись детали в дереве). */
  function getCatalogModuleDisplayName() {
    const inp = document.getElementById('catalog-item-edit-name');
    const fromForm = inp && String(inp.value || '').trim();
    if (fromForm) return fromForm;
    try {
      const subForm = document.getElementById('catalog-item-edit-sub-form');
      const vm = subForm && subForm.__vue__;
      if (vm && vm.item && vm.item.name != null) {
        const n = String(vm.item.name).trim();
        if (n) return n;
      }
    } catch (_) {}
    return '';
  }

  /**
   * Имя в форме каталога и name у корневой секции в constructor_structure — разные поля.
   * По умолчанию узел «Секция» не переименовывается (preserveSectionLabels).
   */
  function syncCatalogDisplayNameIntoConstructorTree(tree, displayName, opts) {
    opts = opts || {};
    const preserveSectionLabels = opts.preserveSectionLabels !== false;
    const name = String(displayName || '').trim();
    if (!name || tree == null || typeof tree !== 'object') return;

    const patchSectionLike = function (n) {
      if (!n || typeof n !== 'object') return false;
      const t = String(n.type || '').toLowerCase();
      if (t === 'section' || t === 'fill_section') {
        if (preserveSectionLabels && isGenericSectionLabel(n.name)) return false;
        n.name = name;
        return true;
      }
      return false;
    };

    if (Array.isArray(tree)) {
      if (tree.length > 0) patchSectionLike(tree[0]);
      return;
    }

    const st = tree.template && Array.isArray(tree.template.structure) ? tree.template.structure : null;
    if (st && st.length > 0) patchSectionLike(st[0]);

    const tr =
      tree.spec && tree.spec.template && Array.isArray(tree.spec.template.tree)
        ? tree.spec.template.tree
        : null;
    if (tr && tr.length > 0 && tr[0] !== (st && st[0])) patchSectionLike(tr[0]);

    if (String(tree.type || '').toLowerCase() === 'module') {
      tree.name = name;
      if (Array.isArray(tree.children)) {
        const sec = tree.children.find(function (c) {
          if (!c) return false;
          var ct = String(c.type || '').toLowerCase();
          return ct === 'section' || ct === 'fill_section';
        });
        if (sec && !(preserveSectionLabels && isGenericSectionLabel(sec.name))) sec.name = name;
      }
    }
  }

  function prepareCatalogItemPayloadAfterClone(payload, newTitle, sourceBaseName) {
    const syncOpts = { preserveSectionLabels: true };
    const applyToTree = (tree) => {
      if (tree != null) syncCatalogDisplayNameIntoConstructorTree(tree, newTitle, syncOpts);
    };

    if (payload.data != null) {
      if (typeof payload.data === 'string') {
        try {
          const dParsed = JSON.parse(payload.data);
          dParsed.name = newTitle;
          applyToTree(dParsed.constructor_structure);
          applyToTree(readClodisJSON(dParsed));
          reconcileAnimatorDoorOffsetInItemData(dParsed);
          payload.data = JSON.stringify(dParsed);
        } catch (_) {
          /* оставляем строку как есть */
        }
      } else if (typeof payload.data === 'object') {
        payload.data.name = newTitle;
        payload.name = newTitle;
        applyToTree(payload.data.constructor_structure);
        applyToTree(readClodisJSON(payload.data));
        reconcileAnimatorDoorOffsetInItemData(payload.data);
      }
    }

    if (payload.constructor_structure != null) {
      applyToTree(payload.constructor_structure);
    }

    if (payload.data && typeof payload.data === 'object' && payload.data.constructor_structure) {
      payload.constructor_structure = JSON.parse(JSON.stringify(payload.data.constructor_structure));
    } else if (readClodisJSON(payload)) {
      applyToTree(readClodisJSON(payload));
    }

    if (payload.data && typeof payload.data === 'object') {
      reconcileAnimatorDoorOffsetInItemData(payload.data);
    }
    if (payload.constructor_structure) {
      const off = firstAnimatorDoorOffset(payload.data) || firstAnimatorDoorOffset(payload.constructor_structure);
      if (off) {
        walkConstructorNodes(payload.constructor_structure, (n) => {
          if (String(n.type || '').toLowerCase() !== 'animator') return;
          if (!n.spec || typeof n.spec !== 'object') n.spec = {};
          const cur = n.spec.door_offset;
          const cx = cur && typeof cur === 'object' ? Number(cur.x) || 0 : 0;
          const cy = cur && typeof cur === 'object' ? Number(cur.y) || 0 : 0;
          const cz = cur && typeof cur === 'object' ? Number(cur.z) || 0 : 0;
          if (!cx && !cy && !cz) n.spec.door_offset = { ...off };
        });
      }
    }
    payload.name = newTitle;
  }

  /**
   * Список типов каталога (Шкафы, Торцевые, …).
   */
  async function fetchCatalogKeysForCopy() {
    try {
      if (Array.isArray(window.__CLD_CATALOGS_KEYS) && window.__CLD_CATALOGS_KEYS.length) {
        return window.__CLD_CATALOGS_KEYS;
      }
    } catch (_) {}
    try {
      const res = await fetch('/api/catalog/items_get/catalogs_keys?t=' + Date.now(), { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
      const keys = arr
        .filter(Boolean)
        .map((k) => ({
          key: String(k.key || k.id || '').trim(),
          name: String(k.name || k.key || k.id || '').trim(),
        }))
        .filter((k) => k.key);
      try { window.__CLD_CATALOGS_KEYS = keys; } catch (_) {}
      return keys;
    } catch (e) {
      console.warn('[catalog-items] catalogs_keys:', e);
      return [];
    }
  }

  function catalogDisplayNameByKey(key, keys) {
    const hit = (keys || []).find((k) => k.key === key);
    return hit?.name || key;
  }

  /**
   * Модалка выбора другого каталога (исключая текущий).
   */
  function pickOtherCatalogType(excludeType) {
    return new Promise(async (resolve) => {
      const allKeys = await fetchCatalogKeysForCopy();
      const keys = allKeys.filter((k) => k.key && k.key !== excludeType);
      if (!keys.length) {
        if (typeof window.toastr !== 'undefined') {
          window.toastr.warning('Нет другого каталога для копирования');
        } else {
          alert('Нет другого каталога для копирования');
        }
        resolve(null);
        return;
      }

      const existing = document.getElementById('cld-catalog-copy-target-modal');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = 'cld-catalog-copy-target-modal';
      overlay.style.cssText =
        'position:fixed;inset:0;z-index:10050;background:rgba(15,23,42,0.45);display:flex;align-items:center;justify-content:center;padding:16px;';

      const box = document.createElement('div');
      box.style.cssText =
        'background:#fff;border-radius:8px;box-shadow:0 12px 40px rgba(0,0,0,0.2);max-width:420px;width:100%;padding:20px 22px;';

      const title = document.createElement('h4');
      title.textContent = 'Копировать в другой каталог';
      title.style.cssText = 'margin:0 0 8px;font-size:16px;font-weight:600;color:#111;';

      const hint = document.createElement('p');
      hint.textContent =
        'Создаётся новая карточка в выбранном каталоге со всем содержимым (конструктор, размеры, переменные). Обычное «Копировать» по-прежнему дублирует только в текущий список.';
      hint.style.cssText = 'margin:0 0 14px;font-size:13px;color:#64748b;line-height:1.4;';

      const label = document.createElement('label');
      label.textContent = 'Каталог назначения';
      label.style.cssText = 'display:block;font-size:13px;margin-bottom:6px;color:#334155;';

      const select = document.createElement('select');
      select.className = 'form-control';
      select.style.cssText = 'width:100%;height:34px;margin-bottom:16px;';
      keys.forEach((k, idx) => {
        const opt = document.createElement('option');
        opt.value = k.key;
        opt.textContent = k.name + ' (' + k.key + ')';
        if (idx === 0) opt.selected = true;
        select.appendChild(opt);
      });

      const footer = document.createElement('div');
      footer.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'btn btn-white btn-sm';
      cancelBtn.textContent = 'Отмена';

      const okBtn = document.createElement('button');
      okBtn.type = 'button';
      okBtn.className = 'btn btn-primary btn-sm';
      okBtn.textContent = 'Копировать';

      const finish = (val) => {
        try { overlay.remove(); } catch (_) {}
        resolve(val);
      };
      cancelBtn.onclick = () => finish(null);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) finish(null);
      });
      okBtn.onclick = () => finish(String(select.value || '').trim() || null);

      footer.appendChild(cancelBtn);
      footer.appendChild(okBtn);
      box.appendChild(title);
      box.appendChild(hint);
      box.appendChild(label);
      box.appendChild(select);
      box.appendChild(footer);
      overlay.appendChild(box);
      document.body.appendChild(overlay);
      try { select.focus(); } catch (_) {}
    });
  }

  /**
   * Общая запись копии: sourceType → targetType.
   * @returns {Promise<number|null>} новый id или null
   */
  async function cloneCatalogItemToType(itemId, sourceType, targetType) {
    const getResp = await fetch(
      `/api/catalog/item/${encodeURIComponent(sourceType)}/${encodeURIComponent(String(itemId))}`
    );
    if (!getResp.ok) throw new Error(`Не удалось загрузить элемент: HTTP ${getResp.status}`);
    const src = await getResp.json();
    if (!src || typeof src !== 'object') throw new Error('Пустой ответ сервера');

    const payload = JSON.parse(JSON.stringify(src));
    delete payload.id;
    if (payload.catalog_type != null) payload.catalog_type = targetType;
    if (payload.data && typeof payload.data === 'object') {
      if (payload.data.catalog_type != null) payload.data.catalog_type = targetType;
    }

    const baseName = String(payload.name || payload.data?.name || 'Элемент')
      .trim()
      .replace(/\s*\(копия(?:\s+\d+)?\)\s*$/i, '');
    let newTitle = targetType === sourceType ? baseName + ' (копия)' : baseName;
    if (targetType === sourceType) {
      try {
        const listResp = await fetch(
          `/api/catalog/items_get/${encodeURIComponent(targetType)}?t=${Date.now()}`,
          { cache: 'no-cache' }
        );
        if (listResp.ok) {
          const listData = await listResp.json();
          const arr = Array.isArray(listData)
            ? listData
            : Array.isArray(listData?.items)
              ? listData.items
              : [];
          const names = new Set(
            arr.map((it) =>
              String(it?.name || it?.data?.name || '')
                .trim()
                .toLowerCase()
            )
          );
          if (names.has(newTitle.toLowerCase())) {
            let n = 2;
            while (names.has(`${baseName} (копия ${n})`.toLowerCase()) && n < 100) n += 1;
            newTitle = `${baseName} (копия ${n})`;
          }
        }
      } catch (_) {}
    }
    payload.name = newTitle;
    prepareCatalogItemPayloadAfterClone(payload, newTitle, baseName);

    const postResp = await fetch(`/api/catalog/item_add/${encodeURIComponent(targetType)}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!postResp.ok) {
      const errText = await postResp.text().catch(() => '');
      throw new Error(`Сохранение копии: HTTP ${postResp.status} ${errText || ''}`.trim());
    }
    const result = await postResp.json().catch(() => ({}));
    return result.item && result.item.id != null ? result.item.id : null;
  }

  /**
   * Дубликат в том же каталоге (как в рефе «Копировать»).
   */
  async function copyCatalogItem(itemId, catalogType, catalogName) {
    try {
      const effectiveType = catalogType || state.catalogType;
      if (!effectiveType || itemId == null || itemId === '') return;

      const newId = await cloneCatalogItemToType(itemId, effectiveType, effectiveType);

      if (typeof window.toastr !== 'undefined') {
        window.toastr.success(
          newId != null
            ? 'Создана копия (id ' + newId + '). Откройте «Редактировать» у новой строки.'
            : 'Создана копия. Обновлён список — откройте «Редактировать» у новой строки.'
        );
      } else {
        alert('Копия создана. В списке появилась новая строка — нажмите «Редактировать».');
      }

      await loadCatalogItems(effectiveType, catalogName || state.catalogName || effectiveType);

      if (newId != null && typeof window.openCatalogItemEdit === 'function') {
        window.openCatalogItemEdit(newId, effectiveType, catalogName || state.catalogName || effectiveType);
      }
    } catch (error) {
      console.error('❌ Ошибка копирования элемента каталога:', error);
      if (typeof window.toastr !== 'undefined') {
        window.toastr.error(error.message || 'Ошибка копирования');
      } else {
        alert('Ошибка копирования: ' + (error.message || error));
      }
    }
  }

  /**
   * Копирование карточки в другой тип каталога (Шкафы → Торцевые и т.п.).
   */
  async function copyCatalogItemToOther(itemId, catalogType, catalogName) {
    try {
      const sourceType = catalogType || state.catalogType;
      if (!sourceType || itemId == null || itemId === '') return;

      const targetType = await pickOtherCatalogType(sourceType);
      if (!targetType) return;

      const keys = await fetchCatalogKeysForCopy();
      const targetName = catalogDisplayNameByKey(targetType, keys);
      const newId = await cloneCatalogItemToType(itemId, sourceType, targetType);

      if (typeof window.toastr !== 'undefined') {
        window.toastr.success(
          newId != null
            ? 'Карточка скопирована в «' + targetName + '» (id ' + newId + ')'
            : 'Карточка скопирована в «' + targetName + '»'
        );
      } else {
        alert('Карточка скопирована в «' + targetName + '»');
      }

      await loadCatalogItems(targetType, targetName);

      if (newId != null && typeof window.openCatalogItemEdit === 'function') {
        window.openCatalogItemEdit(newId, targetType, targetName);
      }
    } catch (error) {
      console.error('❌ Ошибка копирования в другой каталог:', error);
      if (typeof window.toastr !== 'undefined') {
        window.toastr.error(error.message || 'Ошибка копирования');
      } else {
        alert('Ошибка копирования: ' + (error.message || error));
      }
    }
  }

  /**
   * Массово: отмеченные строки → другой каталог.
   */
  async function copySelectedCatalogItemsToOther() {
    try {
      const sourceType = state.catalogType;
      if (!sourceType) {
        if (typeof window.toastr !== 'undefined') window.toastr.error('Тип каталога не определён');
        else alert('Тип каталога не определён');
        return;
      }

      const checked = Array.from(
        document.querySelectorAll('#catalog-items-table-body input.catalog-item-checkbox:checked')
      );
      const ids = checked
        .map((el) => Number(el.value || el.getAttribute('data-id') || el.dataset?.id))
        .filter((n) => Number.isFinite(n) && n > 0);

      if (!ids.length) {
        if (typeof window.toastr !== 'undefined') {
          window.toastr.info('Отметьте одну или несколько карточек, затем «Копировать в другой каталог».');
        } else {
          alert('Отметьте одну или несколько карточек, затем «Копировать в другой каталог».');
        }
        return;
      }

      const targetType = await pickOtherCatalogType(sourceType);
      if (!targetType) return;

      const keys = await fetchCatalogKeysForCopy();
      const targetName = catalogDisplayNameByKey(targetType, keys);

      if (!confirm('Скопировать ' + ids.length + ' карт. в «' + targetName + '»?')) return;

      let lastId = null;
      let ok = 0;
      for (const id of ids) {
        lastId = await cloneCatalogItemToType(id, sourceType, targetType);
        ok += 1;
      }

      if (typeof window.toastr !== 'undefined') {
        window.toastr.success('Скопировано в «' + targetName + '»: ' + ok);
      } else {
        alert('Скопировано в «' + targetName + '»: ' + ok);
      }

      await loadCatalogItems(targetType, targetName);
      if (lastId != null && ids.length === 1 && typeof window.openCatalogItemEdit === 'function') {
        window.openCatalogItemEdit(lastId, targetType, targetName);
      }
    } catch (error) {
      console.error('❌ Ошибка массового копирования в другой каталог:', error);
      if (typeof window.toastr !== 'undefined') {
        window.toastr.error(error.message || 'Ошибка копирования');
      } else {
        alert('Ошибка копирования: ' + (error.message || error));
      }
    }
  }

  // Удаление одного элемента каталога из списка
  async function deleteCatalogItem(itemId, catalogType, catalogName) {
    try {
      const effectiveType = catalogType || state.catalogType;
      if (!effectiveType || !itemId) return;

      const resp = await fetch(
        `/api/catalog/item_delete/${encodeURIComponent(effectiveType)}/${encodeURIComponent(String(itemId))}`,
        { method: 'DELETE' }
      );
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);

      if (typeof window.toastr !== 'undefined') {
        window.toastr.success('Элемент удалён');
      } else {
        alert('Элемент удалён');
      }

      // Перезагружаем список с тем же типом/именем
      await loadCatalogItems(effectiveType, catalogName || state.catalogName || effectiveType);
    } catch (error) {
      console.error('❌ Ошибка удаления элемента каталога:', error);
      if (typeof window.toastr !== 'undefined') {
        window.toastr.error(error.message || 'Ошибка удаления элемента');
      } else {
        alert('Ошибка удаления элемента: ' + (error.message || error));
      }
    }
  }

  function initCatalogItemsFilters() {
    if (window.__CLD_CATALOG_ITEMS_FILTERS_INITIALIZED) return;
    window.__CLD_CATALOG_ITEMS_FILTERS_INITIALIZED = true;

    const searchForm = document.getElementById('catalog-items-search-form');
    const categorySelect = document.getElementById('catalog-items-category-filter');
    const perPageSelect = document.getElementById('catalog-items-per-page');
    const paginationEl = document.getElementById('catalog-items-pagination');

    if (searchForm) {
      searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        state.currentPage = 1;
        // перезагружаем с тем же типом, но новым поиском
        loadCatalogItems();
      });
    }

    if (categorySelect) {
      categorySelect.addEventListener('change', function() {
        state.currentPage = 1;
        applyFiltersAndRender();
      });
    }

    if (perPageSelect) {
      perPageSelect.addEventListener('change', function() {
        state.currentPage = 1;
        applyFiltersAndRender();
      });
    }

    if (paginationEl) {
      paginationEl.addEventListener('click', function(e) {
        const link = e.target.closest('a[data-page]');
        if (!link) return;
        e.preventDefault();
        const page = Number(link.dataset.page || '1');
        if (!Number.isFinite(page) || page === state.currentPage) return;
        state.currentPage = page;
        applyFiltersAndRender();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCatalogItemsFilters);
  } else {
    initCatalogItemsFilters();
  }

  window.loadCatalogItems = loadCatalogItems;
  window.loadCatalogItemsFromHash = loadCatalogItemsFromHash;
  window.copyCatalogItem = copyCatalogItem;
  window.copyCatalogItemToOther = copyCatalogItemToOther;
  window.copySelectedCatalogItemsToOther = copySelectedCatalogItemsToOther;
  window.deleteCatalogItem = deleteCatalogItem;
  window.syncCatalogDisplayNameIntoConstructorTree = syncCatalogDisplayNameIntoConstructorTree;
  window.__cldGetCatalogModuleDisplayName = getCatalogModuleDisplayName;
})();
