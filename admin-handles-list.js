// ============================================
// Модуль: Список моделей ручек (handles) — по образцу cabinet_model
// ============================================

(function() {
  'use strict';

  const HANDLES_LIST_TYPE = 'handles';
  const handlesListState = { allData: [], categories: [], filtered: [], currentPage: 1, perPage: 20, total: 0 };
  const collectionPageState = { collectionId: 0, collection: null };
  let __cmPickContext = null;

  function normalizeHandlesResponse(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items;
    if (data && Array.isArray(data.series)) return data.series;
    return [];
  }

  /** Коллекция для шага 6; строки-размеры (legacy) в основном списке не показываем. */
  function isHandleCollection(item) {
    if (!item || typeof item !== 'object') return false;
    if (Number(item.parentCollectionId) > 0) return false;
    const et = String(item.entityType || 'collection').toLowerCase();
    if (et === 'size' || et === 'variant') return false;
    return true;
  }

  function collectionModelsCount(item) {
    const n = Array.isArray(item?.models) ? item.models.length : 0;
    if (n > 0) return n;
    return Number(item?.cabinetModelId) > 0 ? 1 : 0;
  }

  function kindLabel(kind) {
    const k = String(kind || 'knob').toLowerCase();
    if (k === 'bar') return 'Скоба';
    if (k === 'push') return 'Без ручки (push)';
    if (k === 'loop') return 'Петля';
    return 'Кнопка';
  }

  function getHandleCategoryName(item) {
    const cid = Number(item?.categoryId);
    if (!Number.isFinite(cid)) return '';
    const cat = (handlesListState.categories || []).find((c) => Number(c?.id) === cid);
    return cat ? String(cat.name || '') : '';
  }

  function mkIconCellHtml(item) {
    const iconUrl = (item?.icon || '').toString().trim();
    if (iconUrl) {
      return `<img class="admin-list-thumb" src="${iconUrl.replace(/"/g, '&quot;')}" alt="" onerror="this.style.display='none'">`;
    }
    return '<div class="admin-list-thumb-empty"></div>';
  }

  function renderHandlesCategorySelect() {
    const sel = document.getElementById('handles-list-category-filter');
    if (!sel) return;
    const cats = (handlesListState.categories || []).slice().sort((a, b) => (a.order || a.id || 0) - (b.order || b.id || 0));
    const opts = '<option value="">Все</option>' + cats.map((c) => {
      const name = (c.name || '').replace(/"/g, '&quot;');
      return `<option value="${Number(c.id)}">${name}</option>`;
    }).join('');
    const cur = sel.value || '';
    sel.innerHTML = opts;
    if (cur) sel.value = cur;
  }

  function renderHandlesPagination(totalItems, onPageChange) {
    const top = document.getElementById('handles-list-pagination-top');
    const bottom = document.getElementById('handles-list-pagination-bottom');
    const fromEl = document.getElementById('handles-list-from');
    const toEl = document.getElementById('handles-list-to');
    const totalEl = document.getElementById('handles-list-total');
    if (!top || !bottom) return;
    const perPage = handlesListState.perPage || 20;
    const currentPage = handlesListState.currentPage || 1;
    const totalPages = Math.max(1, Math.ceil((totalItems || 0) / perPage));
    const start = totalItems ? (currentPage - 1) * perPage + 1 : 0;
    const end = totalItems ? Math.min(currentPage * perPage, totalItems) : 0;
    if (fromEl) fromEl.textContent = String(start);
    if (toEl) toEl.textContent = String(end);
    if (totalEl) totalEl.textContent = String(totalItems || 0);
    const mk = (host) => {
      let html = '';
      html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="1">&lt;&lt;</a></li>`;
      html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage - 1}">&lt;</a></li>`;
      for (let p = Math.max(1, currentPage - 2); p <= Math.min(totalPages, currentPage + 2); p++) {
        html += `<li class="page-item ${p === currentPage ? 'active' : ''}"><a class="page-link" href="#" data-page="${p}">${p}</a></li>`;
      }
      html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage + 1}">&gt;</a></li>`;
      html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${totalPages}">&gt;&gt;</a></li>`;
      host.innerHTML = html;
      host.querySelectorAll('a.page-link').forEach((a) => {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          const p = parseInt(a.getAttribute('data-page') || '0', 10);
          if (p >= 1 && p <= totalPages) {
            handlesListState.currentPage = p;
            onPageChange();
          }
        });
      });
    };
    mk(top);
    mk(bottom);
  }

  function applyHandlesFilters() {
    const searchInput = document.getElementById('handles-list-search-input');
    const categoryFilter = document.getElementById('handles-list-category-filter');
    const searchQuery = (searchInput?.value || '').toString().trim().toLowerCase();
    const categoryValue = (categoryFilter?.value || '').toString().trim();
    let filtered = Array.isArray(handlesListState.allData) ? [...handlesListState.allData] : [];
    if (searchQuery) {
      filtered = filtered.filter((item) => {
        const name = (item?.name || '').toString().toLowerCase();
        const key = (item?.key || '').toString().toLowerCase();
        const id = String(item?.id ?? '');
        return name.includes(searchQuery) || key.includes(searchQuery) || id.includes(searchQuery);
      });
    }
    if (categoryValue) {
      const cid = Number(categoryValue);
      filtered = filtered.filter((item) => Number(item?.categoryId) === cid);
    }
    filtered = filtered.filter(isHandleCollection);
    filtered.sort((a, b) => (Number(a?.order) || 0) - (Number(b?.order) || 0));
    handlesListState.filtered = filtered;
  }

  async function loadHandlesList() {
    const tbody = document.getElementById('handles-list-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px;">Загрузка...</td></tr>';
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 20000);
      const resp = await fetch(`/api/catalog/items_get/${encodeURIComponent(HANDLES_LIST_TYPE)}?t=${Date.now()}`, {
        cache: 'no-cache',
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      handlesListState.categories = Array.isArray(data?.categories) ? data.categories : [];
      handlesListState.allData = normalizeHandlesResponse(data);
      handlesListState.currentPage = 1;
      renderHandlesCategorySelect();
      renderHandlesListTable();
    } catch (e) {
      console.error('❌ Ошибка загрузки ручек:', e);
      const msg = e?.name === 'AbortError' ? 'Сервер не отвечает (таймаут). Перезапустите server.js на порту 8030.' : (e?.message || e);
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#c00;">Ошибка загрузки: ' + escAttr(msg) + '</td></tr>';
      renderHandlesPagination(0, () => {});
    }
  }

  function renderHandlesListTable() {
    const tbody = document.getElementById('handles-list-table-body');
    if (!tbody) return;
    applyHandlesFilters();
    const data = handlesListState.filtered;
    tbody.innerHTML = '';
    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#999;">Нет коллекций. Нажмите «Добавить коллекцию».</td></tr>';
      renderHandlesPagination(0, renderHandlesListTable);
      return;
    }
    const perPage = handlesListState.perPage || 20;
    const start = (handlesListState.currentPage - 1) * perPage;
    const pageData = data.slice(start, start + perPage);
    for (const item of pageData) {
      const active = (item?.active ?? 1) == 1 || item?.active === true || item?.active === '1';
      const eyeClass = active ? 'fa-eye' : 'fa-eye-slash';
      const eyeColor = active ? 'btn-success' : 'btn-default';
      const eyeTitle = active ? 'Видим' : 'Скрыт';
      const tr = document.createElement('tr');
      const itemId = item?.id ?? 0;
      const itemName = (item?.name || '').replace(/"/g, '&quot;');
      tr.innerHTML = `
        <td style="width: 50px;">${item?.id ?? '-'}</td>
        <td class="col-icon">${mkIconCellHtml(item)}</td>
        <td style="font-weight:600;">${(item?.name || '-').toString().replace(/</g, '&lt;')}</td>
        <td class="col-vis">
          <i class="fa ${eyeClass} btn btn-outline ${eyeColor}" style="cursor: pointer;" data-h-action="toggle-visibility" data-h-id="${itemId}" data-h-active="${active ? '1' : '0'}" title="${eyeTitle}"></i>
        </td>
        <td class="col-actions">
          <div class="cld-row-actions">
            <i title="Открыть" class="fa fa-folder-open btn btn-outline btn-primary" style="cursor:pointer;" data-h-action="open" data-h-id="${itemId}" data-h-name="${itemName}"></i>
            <i title="Удалить" class="fa fa-trash btn btn-outline btn-danger" style="cursor:pointer;" data-h-action="delete" data-h-id="${itemId}" data-h-name="${itemName}"></i>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    }
    renderHandlesPagination(data.length, renderHandlesListTable);
  }

  function openHandlesCollection(collectionId) {
    const hash = `#handles-collection?id=${encodeURIComponent(String(collectionId || 0))}`;
    if (window.location.hash !== hash) {
      window.location.hash = hash;
      return;
    }
    document.querySelectorAll('.admin-page').forEach((p) => p.classList.remove('active'));
    const page = document.getElementById('handles-collection');
    if (page) {
      page.classList.add('active');
      loadHandlesCollectionPage(collectionId || 0);
    }
  }

  function openHandlesItemEdit(itemId, collectionId, modelId) {
    const q = new URLSearchParams();
    q.set('id', String(itemId || 0));
    const cid = Number(collectionId) || Number(collectionPageState.collectionId) || 0;
    if (cid) q.set('collectionId', String(cid));
    if (modelId) q.set('modelId', String(modelId));
    const hash = `#handles-item-edit?${q.toString()}`;
    if (window.location.hash !== hash) {
      window.location.hash = hash;
      return;
    }
    document.querySelectorAll('.admin-page').forEach((p) => p.classList.remove('active'));
    const page = document.getElementById('handles-item-edit');
    if (page) {
      page.classList.add('active');
      loadHandlesItemEdit(itemId || 0);
    }
  }

  function openHandlesItemEditFromCollection(collectionId, handleId, modelId) {
    openHandlesItemEdit(handleId || 0, collectionId || 0, modelId || '');
  }

  /** @deprecated — используйте handles-item-edit с collectionId */
  function openHandlesSizeEdit(collectionId, sizeCode) {
    openHandlesItemEditFromCollection(collectionId, 0, sizeCode || '');
  }

  async function fetchCollectionById(id) {
    const cid = Number(id) || 0;
    if (!cid) return null;
    try {
      const resp = await fetch(`/api/catalog/item/${encodeURIComponent(HANDLES_LIST_TYPE)}/${encodeURIComponent(String(cid))}?t=${Date.now()}`, { cache: 'no-cache' });
      if (resp.ok) return await resp.json();
    } catch (e) {
      console.warn('[Handles] fetch collection:', e);
    }
    return (handlesListState.allData || []).find((it) => Number(it?.id) === cid) || null;
  }

  async function saveCollectionRecord(item) {
    const id = Number(item?.id) || 0;
    const url = id
      ? `/api/catalog/item_update/${encodeURIComponent(HANDLES_LIST_TYPE)}/${encodeURIComponent(String(id))}/`
      : `/api/catalog/item_add/${encodeURIComponent(HANDLES_LIST_TYPE)}/`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, id }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data?.error || data?.message || resp.statusText);
    if (typeof window.invalidateHandlesCatalogCache === 'function') window.invalidateHandlesCatalogCache();
    return data?.item || data;
  }

  async function reloadHandlesCatalogState() {
    try {
      const resp = await fetch(`/api/catalog/items_get/${encodeURIComponent(HANDLES_LIST_TYPE)}?t=${Date.now()}`, { cache: 'no-cache' });
      if (!resp.ok) return;
      const data = await resp.json();
      handlesListState.categories = Array.isArray(data?.categories) ? data.categories : [];
      handlesListState.allData = normalizeHandlesResponse(data);
    } catch (e) {
      console.warn('[Handles] reload catalog:', e);
    }
  }

  function legacyModelCodeFromHandle(item) {
    const key = String(item?.key || '').trim();
    if (key.startsWith('handle-')) return key.slice(7);
    return key || String(item?.id || '');
  }

  function getCollectionHandleRows(collectionId, collection) {
    const cid = Number(collectionId) || 0;
    const children = (handlesListState.allData || [])
      .filter((it) => Number(it?.parentCollectionId) === cid)
      .sort((a, b) => (Number(a?.order) || 0) - (Number(b?.order) || 0));
    const coveredCodes = new Set(children.map((ch) => legacyModelCodeFromHandle(ch)));
    const models = Array.isArray(collection?.models) ? collection.models : [];
    const legacy = models
      .filter((m) => !coveredCodes.has(String(m?.id || '')))
      .map((model) => ({ kind: 'legacy-model', model, collection }));
    return [
      ...children.map((item) => ({ kind: 'item', item })),
      ...legacy,
    ];
  }

  async function loadHandlesCollectionPage(collectionId) {
    const cid = Number(collectionId) || 0;
    collectionPageState.collectionId = cid;
    const tbody = document.getElementById('handles-collection-sizes-body');
    const title = document.getElementById('handles-collection-title');
    const sub = document.getElementById('handles-collection-subtitle');
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;">Загрузка...</td></tr>';
    await reloadHandlesCatalogState();
    const item = await fetchCollectionById(cid);
    collectionPageState.collection = item;
    if (!item) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="color:#c00;text-align:center;padding:20px;">Коллекция не найдена</td></tr>';
      return;
    }
    if (title) title.textContent = item.name || 'Коллекция';
    if (sub) sub.textContent = `Ручки в коллекции «${item.name || ''}»`;
    renderCollectionHandlesTable(item);
  }

  function renderCollectionHandlesTable(collection) {
    const tbody = document.getElementById('handles-collection-sizes-body');
    if (!tbody) return;
    const cid = collectionPageState.collectionId || Number(collection?.id) || 0;
    const rows = getCollectionHandleRows(cid, collection);
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#999;">Нет ручек. Нажмите «Добавить ручку».</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    for (const row of rows) {
      const tr = document.createElement('tr');
      if (row.kind === 'item') {
        const item = row.item;
        const itemId = item?.id ?? 0;
        const active = (item?.active ?? 1) == 1 || item?.active === true || item?.active === '1';
        const eyeClass = active ? 'fa-eye' : 'fa-eye-slash';
        const eyeTitle = active ? 'Видим' : 'Скрыт';
        const itemName = (item?.name || '').replace(/"/g, '&quot;');
        tr.innerHTML = `
          <td>${itemId || '—'}</td>
          <td>${mkIconCellHtml(item)}</td>
          <td><a href="#" data-ch-action="edit" data-ch-id="${itemId}" style="font-weight:600;">${(item?.name || '-').toString().replace(/</g, '&lt;')}</a></td>
          <td>${getHandleCategoryName(item).replace(/</g, '&lt;') || '—'}</td>
          <td>${String(item?.order ?? 0)}</td>
          <td><i class="fa ${eyeClass} btn btn-outline" style="cursor:pointer;" data-ch-action="toggle" data-ch-id="${itemId}" data-ch-active="${active ? '1' : '0'}" title="${eyeTitle}"></i></td>
          <td>
            <a href="#" data-ch-action="edit" data-ch-id="${itemId}"><i title="Изменить" class="fa fa-pencil btn btn-outline btn-success"></i></a>
            <i title="Копировать" class="fa fa-copy btn btn-outline btn-info" style="margin:0 6px;cursor:pointer;" data-ch-action="copy" data-ch-id="${itemId}" data-ch-name="${itemName}"></i>
            <i title="Удалить" class="fa fa-trash btn btn-outline btn-danger" style="cursor:pointer;" data-ch-action="delete" data-ch-id="${itemId}" data-ch-name="${itemName}"></i>
          </td>`;
      } else {
        const m = row.model;
        const coll = row.collection || collection;
        const code = escAttr(m?.id || '');
        const label = (m?.label || m?.id || '—').toString().replace(/</g, '&lt;');
        const active = (coll?.active ?? 1) == 1 || coll?.active === true || coll?.active === '1';
        const eyeClass = active ? 'fa-eye' : 'fa-eye-slash';
        const pseudo = { icon: coll?.icon || '', name: m?.label || m?.id };
        tr.innerHTML = `
          <td><span class="text-muted" style="font-size:11px;">legacy</span></td>
          <td>${mkIconCellHtml(pseudo)}</td>
          <td><a href="#" data-ch-action="edit-legacy" data-ch-model="${code}" style="font-weight:600;">${label}</a></td>
          <td>${getHandleCategoryName(coll).replace(/</g, '&lt;') || '—'}</td>
          <td>${String(coll?.order ?? 100)}</td>
          <td><i class="fa ${eyeClass} btn btn-outline" style="opacity:0.45;cursor:default;" title="Сохраните ручку — тогда можно менять видимость"></i></td>
          <td>
            <a href="#" data-ch-action="edit-legacy" data-ch-model="${code}"><i title="Изменить" class="fa fa-pencil btn btn-outline btn-success"></i></a>
            <i title="Удалить" class="fa fa-trash btn btn-outline btn-danger" style="margin-left:6px;cursor:pointer;" data-ch-action="delete" data-ch-id="0" data-ch-model="${code}" data-ch-name="${escAttr(m?.label || m?.id || '')}"></i>
          </td>`;
      }
      tbody.appendChild(tr);
    }
    tbody.querySelectorAll('[data-ch-action]').forEach((el) => {
      el.addEventListener('click', async (e) => {
        e.preventDefault();
        const act = el.getAttribute('data-ch-action');
        const hid = Number(el.getAttribute('data-ch-id') || 0) || 0;
        const name = el.getAttribute('data-ch-name') || '';
        const modelId = el.getAttribute('data-ch-model') || '';
        if (act === 'edit' || act === 'edit-legacy') {
          openHandlesItemEditFromCollection(cid, act === 'edit' ? hid : 0, modelId);
        } else if (act === 'copy') copyHandlesItem(hid);
        else if (act === 'delete') await deleteHandleFromCollection(cid, hid, name, modelId);
        else if (act === 'toggle') toggleHandlesVisibility(hid, el);
      });
    });
  }

  async function deleteHandleFromCollection(collectionId, handleId, handleName, legacyModelId) {
    const cid = Number(collectionId) || 0;
    const hid = Number(handleId) || 0;
    const code = String(legacyModelId || '').trim();
    if (hid) {
      let modelCode = code;
      try {
        const resp = await fetch(`/api/catalog/item/${encodeURIComponent(HANDLES_LIST_TYPE)}/${encodeURIComponent(String(hid))}?t=${Date.now()}`);
        if (resp.ok) {
          const it = await resp.json();
          modelCode = legacyModelCodeFromHandle(it) || code;
        }
      } catch (_) {}
      await deleteHandlesItem(hid, handleName);
      if (modelCode) await removeModelFromCollection(cid, modelCode);
      await reloadHandlesCatalogState();
      await loadHandlesCollectionPage(cid);
      return;
    }
    if (!code || !confirm('Удалить эту ручку из коллекции?')) return;
    await removeModelFromCollection(cid, code);
    await loadHandlesCollectionPage(cid);
    if (window.toastr) window.toastr.success('Удалено');
  }

  async function removeModelFromCollection(collectionId, modelCode) {
    const code = String(modelCode || '').trim();
    if (!code) return;
    const item = await fetchCollectionById(collectionId);
    if (!item || !Array.isArray(item.models)) return;
    item.models = item.models.filter((m) => String(m?.id) !== code);
    await saveCollectionRecord(item);
  }

  function extractBarLengthMmFromHandle(item, modelCode) {
    const sizes = Array.isArray(item?.sizes) ? item.sizes : [];
    if (sizes[0]?.centerDistance != null) return Number(sizes[0].centerDistance) || undefined;
    const fromName = String(item?.name || '').match(/(\d+)\s*мм/i);
    if (fromName) return Number(fromName[1]);
    const code = String(modelCode || item?.key || '').replace(/\D/g, '');
    if (code) return Number(code) || undefined;
    return undefined;
  }

  /** Метаданные коллекции (без 3D) — у каждой ручки своя модель из каталога 3D. */
  function applyCollectionMetaToNewHandle(item, coll) {
    if (!item || !coll) return;
    item.kind = coll.kind || item.kind || 'bar';
    item.categoryId = coll.categoryId ?? null;
    item.icon = coll.icon || '';
    item.order = coll.order ?? item.order;
    item.active = coll.active ?? 1;
  }

  async function applyCabinetModelToHandleItem(item, cabinetModelId) {
    const cid = Number(cabinetModelId) || 0;
    if (!item || cid <= 0) return;
    item.cabinetModelId = cid;
    const cmItem = await fetchCabinetModelItemById(cid);
    const parsed = parseCabinetModelItemData(cmItem);
    if (!parsed?.modelPath) return;
    const mp = parsed.modelParams || {};
    item.modelParams = {
      modelType: 'normal',
      modelPath: parsed.modelPath,
      color: mp.color || '#000000',
      roughness: mp.roughness != null ? Number(mp.roughness) : 0.8,
      metalness: mp.metalness != null ? Number(mp.metalness) : 0,
      texture: mp.texture || mp.map || '',
      normalMap: mp.normalMap || '',
      holesDiameter: mp.holesDiameter != null ? Number(mp.holesDiameter) : 0,
      holesCount: mp.holesCount != null ? Number(mp.holesCount) : 1,
    };
    item.sizeType = 'normal';
  }

  function deriveHandleModelCode(handleItem, legacyModelCode) {
    const legacy = String(legacyModelCode || '').trim();
    if (legacy) return legacy;
    const sizes = Array.isArray(handleItem?.sizes) ? handleItem.sizes : [];
    const center = sizes[0]?.centerDistance != null ? Number(sizes[0].centerDistance) : 0;
    if (center > 0) return String(center);
    const key = String(handleItem?.key || '').trim();
    if (key.startsWith('handle-')) return key.slice(7);
    return key || String(handleItem?.id || '');
  }

  async function syncHandleToCollectionModels(collectionId, handleItem, legacyModelCode) {
    const cid = Number(collectionId) || 0;
    if (!cid || !handleItem) return;
    const coll = await fetchCollectionById(cid);
    if (!coll) return;
    const models = Array.isArray(coll.models) ? coll.models.slice() : [];
    const code = deriveHandleModelCode(handleItem, legacyModelCode);
    const barFromSizes = Array.isArray(handleItem.sizes) && handleItem.sizes[0]?.centerDistance != null
      ? Number(handleItem.sizes[0].centerDistance) || undefined
      : undefined;
    const entry = {
      id: code,
      label: handleItem.name || code,
      cabinetModelId: Number(handleItem.cabinetModelId) || 0,
      barLengthMm: barFromSizes || extractBarLengthMmFromHandle(handleItem, code),
    };
    const idx = models.findIndex((m) => String(m?.id) === code);
    if (idx >= 0) models[idx] = { ...models[idx], ...entry };
    else models.push(entry);
    coll.models = models;
    if (!coll.cabinetModelId && entry.cabinetModelId) coll.cabinetModelId = entry.cabinetModelId;
    await saveCollectionRecord(coll);
  }

  function setHandlesEditTabsMode(mode) {
    const tabsHost = document.getElementById('handles-item-tabs');
    if (!tabsHost) return;
    const show = (tab) => {
      const link = tabsHost.querySelector(`[data-handles-tab="${tab}"]`);
      if (link?.parentElement) link.parentElement.style.display = '';
    };
    const hide = (tab) => {
      const link = tabsHost.querySelector(`[data-handles-tab="${tab}"]`);
      if (link?.parentElement) link.parentElement.style.display = 'none';
    };
    const handlePane = document.getElementById('handles-item-sizes-handle-pane');
    const collPane = document.getElementById('handles-item-sizes-collection-pane');
    const sizesLink = tabsHost.querySelector('[data-handles-tab="sizes"]');
    ['basic', 'model', 'sizes', 'roles'].forEach(show);
    if (handlePane) handlePane.style.display = 'none';
    if (collPane) collPane.style.display = 'none';
    if (mode === 'handle') {
      hide('roles');
      if (handlePane) handlePane.style.display = 'block';
      if (sizesLink) sizesLink.textContent = 'Размеры';
    } else if (mode === 'rules') {
      hide('basic');
      hide('model');
      hide('sizes');
    } else {
      hide('sizes');
    }
  }

  function defaultHandleSizesFromItem(item, urlModelId) {
    const bar = extractBarLengthMmFromHandle(item, urlModelId) || 0;
    return [{
      name: item?.name || '',
      article: '',
      centerDistance: bar,
      width: 0,
      height: 0,
      depth: 0,
      priceMode: 'manual',
      price: 0,
    }];
  }

  function readHideSizesInCatalogFromDom() {
    const el = document.getElementById('handles-item-hide-sizes-in-catalog');
    return el ? !!el.checked : false;
  }

  function openCollectionAddModal() {
    const modal = document.getElementById('handles-collection-add-modal');
    if (!modal) return;
    document.getElementById('handles-collection-add-name').value = '';
    setCollectionAddIcon('');
    modal.style.display = 'block';
  }

  function closeCollectionAddModal() {
    const modal = document.getElementById('handles-collection-add-modal');
    if (modal) modal.style.display = 'none';
  }

  function setCollectionAddIcon(url) {
    const hidden = document.getElementById('handles-collection-add-icon');
    const prev = document.getElementById('handles-collection-add-icon-preview');
    const wrap = document.getElementById('handles-collection-add-icon-preview-wrap');
    const ph = document.getElementById('handles-collection-add-icon-placeholder');
    const v = (url || '').trim();
    if (hidden) hidden.value = v;
    if (v && prev && wrap && ph) {
      prev.src = v;
      wrap.style.display = 'block';
      ph.style.display = 'none';
    } else if (prev && wrap && ph) {
      prev.src = '';
      wrap.style.display = 'none';
      ph.style.display = 'flex';
    }
  }

  async function saveNewCollectionFromModal() {
    const name = (document.getElementById('handles-collection-add-name')?.value || '').trim();
    const icon = (document.getElementById('handles-collection-add-icon')?.value || '').trim();
    if (!name) { alert('Введите название коллекции'); return; }
    try {
      const payload = {
        entityType: 'collection',
        name,
        key: 'collection-' + Date.now(),
        order: 100,
        active: 1,
        kind: 'bar',
        icon,
        models: [],
        defaults: null,
        placementRules: [],
        hideSizesInCatalog: true,
      };
      const saved = await saveCollectionRecord(payload);
      closeCollectionAddModal();
      if (window.toastr) window.toastr.success('Коллекция создана');
      await loadHandlesList();
      const newId = Number(saved?.id) || 0;
      if (newId) openHandlesCollection(newId);
    } catch (e) {
      alert('Ошибка: ' + (e.message || e));
    }
  }

  async function loadHandlesCategoriesIntoSelect(selectEl, selectedId) {
    if (!selectEl) return;
    try {
      const r = await fetch(`/api/catalog/categories_get/${encodeURIComponent(HANDLES_LIST_TYPE)}?t=${Date.now()}`);
      const cats = await r.json();
      const arr = Array.isArray(cats) ? cats : [];
      handlesListState.categories = arr;
      selectEl.innerHTML = '<option value="">—</option>' + arr.map((c) => {
        const id = Number(c.id);
        const name = (c.name || '').replace(/"/g, '&quot;');
        const sel = Number(selectedId) === id ? ' selected' : '';
        return `<option value="${id}"${sel}>${name}</option>`;
      }).join('');
    } catch (e) {
      console.warn('[Handles] categories:', e);
    }
  }

  function escAttr(v) {
    return String(v == null ? '' : v).replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function categoryIdToKind(categoryId) {
    const cat = (handlesListState.categories || []).find((c) => Number(c.id) === Number(categoryId));
    const key = String(cat?.key || '').toLowerCase();
    if (key === 'push') return 'push';
    if (key === 'bar') return 'bar';
    if (key === 'knob') return 'knob';
    if (key === 'loop') return 'loop';
    return 'knob';
  }

  const HANDLE_KIND_VALUES = ['knob', 'bar', 'push', 'loop'];

  function normalizeHandleKind(kind, categoryId) {
    const k = String(kind || '').toLowerCase();
    if (HANDLE_KIND_VALUES.includes(k)) return k;
    return categoryIdToKind(categoryId);
  }

  function setHandleKindInDom(kind, categoryId) {
    const el = document.getElementById('handles-item-kind');
    if (!el) return;
    const v = normalizeHandleKind(kind, categoryId);
    el.value = HANDLE_KIND_VALUES.includes(v) ? v : 'knob';
  }

  function readKindFromDom() {
    const v = String(document.getElementById('handles-item-kind')?.value || '').toLowerCase();
    if (HANDLE_KIND_VALUES.includes(v)) return v;
    const categoryId = Number(document.getElementById('handles-item-category')?.value || '') || null;
    return categoryIdToKind(categoryId);
  }

  function defaultModelParams() {
    return {
      modelType: 'normal',
      modelPath: '',
      color: '#000000',
      roughness: 0.8,
      metalness: 0,
      texture: '',
      normalMap: '',
      holesDiameter: 0,
      holesCount: 1,
    };
  }

  function readModelParamsFromItem(item) {
    const mp = item?.modelParams && typeof item.modelParams === 'object' ? item.modelParams : {};
    return {
      modelType: 'normal',
      modelPath: mp.modelPath || mp.model || '',
      color: mp.color || '#000000',
      roughness: mp.roughness != null ? Number(mp.roughness) : 0.8,
      metalness: mp.metalness != null ? Number(mp.metalness) : 0,
      texture: mp.texture || '',
      normalMap: mp.normalMap || '',
      holesDiameter: mp.holesDiameter != null ? Number(mp.holesDiameter) : 0,
      holesCount: mp.holesCount != null ? Number(mp.holesCount) : 1,
    };
  }

  function setImageBlock(hiddenId, previewId, placeholderId, url) {
    const hidden = document.getElementById(hiddenId);
    const preview = document.getElementById(previewId);
    const placeholder = document.getElementById(placeholderId);
    const v = (url || '').toString().trim();
    if (hidden) hidden.value = v;
    if (preview && placeholder) {
      if (v) {
        preview.src = v;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
      } else {
        preview.src = '';
        preview.style.display = 'none';
        placeholder.style.display = 'flex';
      }
    }
  }

  function normalizeHandleSizePriceMode(row) {
    const pm = row?.priceMode || row?.price_mode || 'manual';
    if (pm === 'm' || pm === 'manual') return 'manual';
    if (pm === 'c' || pm === 'article') return 'article';
    return String(pm);
  }

  /** Clodis legacy: sizes[].width = межосевое; у нас — centerDistance + габариты. */
  function normalizeHandleSizeForUi(row) {
    row = row || {};
    const article = String(row.article || row.code || '').trim();
    const priceMode = normalizeHandleSizePriceMode(row);
    const price = Number(row.price) || 0;
    if (row.centerDistance != null || row.axis_size != null) {
      return {
        name: row.name || '',
        article,
        centerDistance: Number(row.centerDistance ?? row.axis_size ?? 0) || 0,
        width: Number(row.width) || 0,
        height: Number(row.height) || 0,
        depth: Number(row.depth) || 0,
        priceMode,
        price,
      };
    }
    return {
      name: row.name || '',
      article,
      centerDistance: Number(row.width) || 0,
      width: 0,
      height: Number(row.height) || 0,
      depth: Number(row.depth) || 0,
      priceMode,
      price,
    };
  }

  function getHandleSizesFromItem(item, urlModelId) {
    let sizes = [];
    if (Array.isArray(item?.sizes) && item.sizes.length) {
      sizes = item.sizes.map(normalizeHandleSizeForUi);
    } else if (typeof item?.variants === 'string' && item.variants.trim()) {
      try {
        const parsed = JSON.parse(item.variants);
        if (Array.isArray(parsed)) sizes = parsed.map(normalizeHandleSizeForUi);
      } catch (_) {}
    } else if (Array.isArray(item?.variants) && item.variants.length) {
      sizes = item.variants.map(normalizeHandleSizeForUi);
    }
    if (!sizes.length) sizes = defaultHandleSizesFromItem(item, urlModelId);
    return sizes;
  }

  function cloneHandleSizeRow(row) {
    try {
      return JSON.parse(JSON.stringify(normalizeHandleSizeForUi(row || {})));
    } catch (_) {
      return normalizeHandleSizeForUi(row || {});
    }
  }

  function bindHandlesSizeRows(host) {
    if (!host) return;
    host.querySelectorAll('.handles-size-del').forEach((btn) => {
      if (btn._handlesBound) return;
      btn._handlesBound = true;
      btn.addEventListener('click', function() {
        const list = document.getElementById('handles-item-sizes-list');
        if (!list) return;
        if (list.querySelectorAll('.handles-size-row').length <= 1) return;
        this.closest('.handles-size-row')?.remove();
        bindHandlesSizeRows(list);
        updateHandlesSizeRowControls(list);
      });
    });
    host.querySelectorAll('.handles-size-up').forEach((btn) => {
      if (btn._handlesBound) return;
      btn._handlesBound = true;
      btn.addEventListener('click', function() {
        const row = this.closest('.handles-size-row');
        const prev = row?.previousElementSibling;
        if (row && prev && prev.classList.contains('handles-size-row')) {
          row.parentNode.insertBefore(row, prev);
          updateHandlesSizeRowControls(host);
        }
      });
    });
    host.querySelectorAll('.handles-size-down').forEach((btn) => {
      if (btn._handlesBound) return;
      btn._handlesBound = true;
      btn.addEventListener('click', function() {
        const row = this.closest('.handles-size-row');
        const next = row?.nextElementSibling;
        if (row && next && next.classList.contains('handles-size-row')) {
          row.parentNode.insertBefore(next, row);
          updateHandlesSizeRowControls(host);
        }
      });
    });
  }

  function updateHandlesSizeRowControls(host) {
    if (!host) return;
    const rows = host.querySelectorAll('.handles-size-row');
    const total = rows.length;
    rows.forEach((row, idx) => {
      const del = row.querySelector('.handles-size-del');
      const up = row.querySelector('.handles-size-up');
      const down = row.querySelector('.handles-size-down');
      if (del) del.style.display = total > 1 ? '' : 'none';
      if (up) up.style.display = idx > 0 ? '' : 'none';
      if (down) down.style.display = idx < total - 1 ? '' : 'none';
    });
  }

  function handlesSizeRowHtml(row, idx, total) {
    row = normalizeHandleSizeForUi(row);
    const priceMode = row.priceMode || 'manual';
    const showDel = total > 1;
    const showUp = idx > 0;
    const showDown = idx < total - 1;
    return '' +
      '<div class="handles-size-row mb-4" data-idx="' + idx + '" style="padding:12px 50px 12px 12px;position:relative;border:1px solid #e7eaec;border-radius:2px;background:#FAFAFB;">' +
      '  <div class="variant_controls" style="position:absolute;right:5px;top:5px;bottom:0;height:100%;display:flex;flex-direction:column;">' +
      (showDel ? '    <button type="button" class="btn btn-sm btn-outline-danger handles-size-del" title="Удалить" style="position:absolute;right:0;top:0;"><i class="fa fa-trash"></i></button>' : '') +
      (showUp ? '    <button type="button" class="btn btn-sm btn-outline-success handles-size-up" title="Выше" style="position:absolute;right:0;top:50px;"><i class="fa fa-chevron-up"></i></button>' : '') +
      (showDown ? '    <button type="button" class="btn btn-sm btn-outline-success handles-size-down" title="Ниже" style="position:absolute;right:0;top:81px;"><i class="fa fa-chevron-down"></i></button>' : '') +
      '  </div>' +
      '  <div class="row mb-2">' +
      '    <div class="col-sm-1 d-flex align-items-end pb-1">' +
      '      <span class="handles-size-drag text-muted" style="cursor:grab;padding:2px 4px;" title="Переместить"><i class="fa fa-bars"></i></span>' +
      '    </div>' +
      '    <div class="col-sm-4">' +
      '      <label class="mb-0" style="font-size:12px;">Название</label>' +
      '      <input type="text" class="form-control form-control-sm handles-size-name" value="' + escAttr(row.name || '') + '">' +
      '    </div>' +
      '    <div class="col-sm-3">' +
      '      <label class="mb-0" style="font-size:12px;">Артикул</label>' +
      '      <input type="text" class="form-control form-control-sm handles-size-article" value="' + escAttr(row.article || '') + '">' +
      '    </div>' +
      '    <div class="col-sm-4">' +
      '      <label class="mb-0" style="font-size:12px;">Межосевое расстояние</label>' +
      '      <input type="number" class="form-control form-control-sm handles-size-center" min="0" step="1" value="' + escAttr(row.centerDistance != null ? row.centerDistance : 0) + '">' +
      '    </div>' +
      '  </div>' +
      '  <div class="row mb-2">' +
      '    <div class="col-sm-4">' +
      '      <label class="mb-0" style="font-size:12px;">Ширина (мм.)</label>' +
      '      <input type="number" class="form-control form-control-sm handles-size-w" min="0" step="1" value="' + escAttr(row.width != null ? row.width : 0) + '">' +
      '    </div>' +
      '    <div class="col-sm-4">' +
      '      <label class="mb-0" style="font-size:12px;">Высота (мм.)</label>' +
      '      <input type="number" class="form-control form-control-sm handles-size-h" min="0" step="1" value="' + escAttr(row.height != null ? row.height : 0) + '">' +
      '    </div>' +
      '    <div class="col-sm-4">' +
      '      <label class="mb-0" style="font-size:12px;">Глубина (мм.)</label>' +
      '      <input type="number" class="form-control form-control-sm handles-size-d" min="0" step="1" value="' + escAttr(row.depth != null ? row.depth : 0) + '">' +
      '    </div>' +
      '  </div>' +
      '  <div class="row mb-0">' +
      '    <div class="col-sm-4">' +
      '      <label class="mb-0" style="font-size:12px;">Ввод цен</label>' +
      '      <select class="form-control form-control-sm handles-size-price-mode">' +
      '        <option value="manual"' + (priceMode === 'manual' ? ' selected' : '') + '>Ручной ввод</option>' +
      '        <option value="article"' + (priceMode === 'article' ? ' selected' : '') + '>По артикулу</option>' +
      '      </select>' +
      '    </div>' +
      '    <div class="col-sm-4">' +
      '      <label class="mb-0" style="font-size:12px;">Цена</label>' +
      '      <input type="number" class="form-control form-control-sm handles-size-price" min="0" step="0.01" value="' + escAttr(row.price != null ? row.price : 0) + '">' +
      '    </div>' +
      '  </div>' +
      '</div>';
  }

  function renderHandlesSizesList(sizes) {
    const host = document.getElementById('handles-item-sizes-list');
    if (!host) return;
    const arr = (Array.isArray(sizes) ? sizes : []).map(normalizeHandleSizeForUi);
    host.innerHTML = arr.length ? arr.map((row, idx) => handlesSizeRowHtml(row, idx, arr.length)).join('') : '';
    bindHandlesSizeRows(host);
    updateHandlesSizeRowControls(host);
  }

  function addHandleSizeRow() {
    const host = document.getElementById('handles-item-sizes-list');
    if (!host) return;
    const existing = collectHandlesSizesFromDom();
    const name = (document.getElementById('handles-item-name')?.value || '').trim();
    let next;
    if (existing.length) {
      next = cloneHandleSizeRow(existing[existing.length - 1]);
    } else {
      next = defaultHandleSizesFromItem({ name }, '')[0];
    }
    if (!next.name) next.name = name;
    renderHandlesSizesList(existing.concat([next]));
  }

  function collectHandlesSizesFromDom() {
    const host = document.getElementById('handles-item-sizes-list');
    if (!host) return [];
    const out = [];
    host.querySelectorAll('.handles-size-row').forEach((row) => {
      const article = (row.querySelector('.handles-size-article')?.value || '').trim();
      const priceMode = row.querySelector('.handles-size-price-mode')?.value || 'manual';
      out.push({
        name: (row.querySelector('.handles-size-name')?.value || '').trim(),
        article,
        code: article,
        centerDistance: Number(row.querySelector('.handles-size-center')?.value || 0) || 0,
        width: Number(row.querySelector('.handles-size-w')?.value || 0) || 0,
        height: Number(row.querySelector('.handles-size-h')?.value || 0) || 0,
        depth: Number(row.querySelector('.handles-size-d')?.value || 0) || 0,
        priceMode,
        price_mode: priceMode === 'article' ? 'c' : 'm',
        price: Number(row.querySelector('.handles-size-price')?.value || 0) || 0,
      });
    });
    return out;
  }

  function switchHandlesEditTab(tabName) {
    const tabs = document.querySelectorAll('#handles-item-tabs li');
    tabs.forEach((li) => li.classList.remove('active'));
    const link = document.querySelector('#handles-item-tabs [data-handles-tab="' + tabName + '"]');
    if (link) link.closest('li')?.classList.add('active');
    document.querySelectorAll('.handles-tab-pane').forEach((p) => { p.style.display = 'none'; });
    const pane = document.getElementById('handles-item-tab-' + tabName);
    if (pane) pane.style.display = 'block';
    if (tabName === 'roles' && typeof window !== 'undefined' && window.__cldHandlePlacementRulesAdmin?.loadPlacementRulesUi) {
      window.__cldHandlePlacementRulesAdmin.loadPlacementRulesUi();
    }
    if (tabName === 'sizes') {
      const isHandle = Number(document.getElementById('handles-item-parent-collection-id')?.value || 0) > 0;
      if (!isHandle && typeof window !== 'undefined' && window.__cldHandlePlacementRulesAdmin?.loadCollectionSizesUi) {
        const collPane = document.getElementById('handles-item-sizes-collection-pane');
        const handlePane = document.getElementById('handles-item-sizes-handle-pane');
        if (handlePane) handlePane.style.display = 'none';
        if (collPane) collPane.style.display = 'block';
        window.__cldHandlePlacementRulesAdmin.loadCollectionSizesUi();
      }
    }
    const previewCol = document.getElementById('handles-item-preview-col');
    const formCol = document.getElementById('handles-item-form-col');
    if (previewCol && formCol) {
      if (tabName === 'model') {
        previewCol.style.display = '';
        formCol.className = 'col-lg-6';
        initHandlesPreview();
        setTimeout(() => refreshHandlesPreview(), 400);
      } else {
        previewCol.style.display = 'none';
        formCol.className = 'col-lg-12';
      }
    }
  }

  let __handlesPreviewIframe = null;
  let __handlesPreviewReady = false;
  let __handlesCabinetModelCache = null;
  let __handlesCabinetModelsListCache = null;
  let __handlesSyncSizeTimeout = null;

  const CABINET_MODEL_TYPE = 'cabinet_model';

  async function fetchCabinetModelItemById(id) {
    const cid = Number(id) || 0;
    if (!cid) return null;
    try {
      const resp = await fetch(`/api/catalog/item/${encodeURIComponent(CABINET_MODEL_TYPE)}/${encodeURIComponent(String(cid))}?t=${Date.now()}`, { cache: 'no-cache' });
      if (resp.ok) return await resp.json();
    } catch (e) {
      console.warn('[Handles] fetch cabinet_model:', e);
    }
    return null;
  }

  async function loadCabinetModelsListForPicker() {
    if (__handlesCabinetModelsListCache) return __handlesCabinetModelsListCache;
    try {
      const resp = await fetch(`/api/catalog/items_get/${encodeURIComponent(CABINET_MODEL_TYPE)}?t=${Date.now()}`, { cache: 'no-cache' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      __handlesCabinetModelsListCache = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      console.warn('[Handles] load cabinet_model list:', e);
      __handlesCabinetModelsListCache = [];
    }
    return __handlesCabinetModelsListCache;
  }

  function parseCabinetModelItemData(item) {
    if (!item) return null;
    let itemData = item.data;
    if (typeof itemData === 'string') {
      try { itemData = JSON.parse(itemData); } catch (_) { itemData = null; }
    }
    const paramsObj = (itemData && itemData.params) ? itemData.params : (itemData || {});
    const firstModel = (paramsObj.models && paramsObj.models[0]) ? paramsObj.models[0] : {};
    return {
      paramsObj,
      firstModel,
      modelPath: String(firstModel.model || '').trim(),
      modelParams: firstModel.params || {},
      previewSize: {
        w: Number(item.width) || 600,
        h: Number(item.height) || 720,
        d: Number(item.depth) || 600,
      },
    };
  }

  function computeCabinetPreviewRefMm(paramsObj, previewSize) {
    const m0 = paramsObj && paramsObj.models && paramsObj.models[0];
    const p = (m0 && m0.params) || {};
    if (p.preview_ref_mm && typeof p.preview_ref_mm === 'object') {
      const x = Number(p.preview_ref_mm.x);
      const y = Number(p.preview_ref_mm.y);
      const z = Number(p.preview_ref_mm.z);
      if (x > 0 && y > 0 && z > 0) return { x, y, z };
    }
    const w = Number(previewSize?.w);
    const h = Number(previewSize?.h);
    const d = Number(previewSize?.d);
    if (w > 0 && h > 0 && d > 0) return { x: w, y: h, z: d };
    return null;
  }

  function buildTransformFromCabinetModelParsed(parsed) {
    const p = parsed?.modelParams || {};
    const scale = p.scale || {};
    const pos = p.pos || {};
    const rot = p.rot || {};
    return {
      scale: {
        x: (Number(scale.x) || 100) / 100,
        y: (Number(scale.y) || 100) / 100,
        z: (Number(scale.z) || 100) / 100,
      },
      position: {
        x: Number(pos.x) || 0,
        y: Number(pos.y) || 0,
        z: Number(pos.z) || 0,
      },
      rotation: {
        x: Number(rot.x) || 0,
        y: Number(rot.y) || 0,
        z: Number(rot.z) || 0,
      },
    };
  }

  function syncHandlesPreviewSize(sizeMm) {
    if (!__handlesPreviewIframe?.contentWindow) return;
    if (__handlesSyncSizeTimeout) clearTimeout(__handlesSyncSizeTimeout);
    __handlesSyncSizeTimeout = setTimeout(() => {
      __handlesSyncSizeTimeout = null;
      const w = Number(sizeMm?.w) || 600;
      const h = Number(sizeMm?.h) || 720;
      const d = Number(sizeMm?.d) || 600;
      __handlesPreviewIframe.contentWindow.postMessage({
        type: 'cld:setSize',
        sizeMm: { w, h, d },
      }, '*');
    }, 150);
  }

  function readHandlesPreviewMaterial() {
    return {
      color: document.getElementById('handles-item-model-color')?.value || '#000000',
      roughness: Number(document.getElementById('handles-item-model-roughness')?.value || 0.8),
      metalness: Number(document.getElementById('handles-item-model-metalness')?.value || 0),
    };
  }

  function postHandlePreviewLoad(message) {
    const send = () => {
      if (!__handlesPreviewIframe?.contentWindow) return;
      __handlesPreviewIframe.contentWindow.postMessage(message, '*');
    };
    if (__handlesPreviewReady) send();
    else {
      const onReady = (ev) => {
        if (ev?.data?.type === 'cld:iframeReady') {
          __handlesPreviewReady = true;
          window.removeEventListener('message', onReady);
          send();
        }
      };
      window.addEventListener('message', onReady);
    }
  }

  function loadHandleInPreviewFromCabinetModel(item, mat) {
    const parsed = parseCabinetModelItemData(item);
    if (!parsed?.modelPath) return;
    syncHandlesPreviewSize(parsed.previewSize);
    const transform = buildTransformFromCabinetModelParsed(parsed);
    const modelParams = { ...parsed.modelParams, color: mat.color, roughness: mat.roughness, metalness: mat.metalness };
    const previewRefMm = computeCabinetPreviewRefMm(parsed.paramsObj, parsed.previewSize);
    const hlAxis = String(parsed.firstModel?.hl_axis || '').trim().toLowerCase();
    const handleBarFit =
      !!hlAxis ||
      /ruchka_|volna/i.test(parsed.modelPath || '');
    setTimeout(() => {
      postHandlePreviewLoad({
        type: 'cld:loadModel',
        modelPath: parsed.modelPath,
        transform: { ...transform, modelParams },
        previewRefMm: previewRefMm || undefined,
        handleBarFit,
      });
    }, 200);
  }

  function syncHandleModelPathHidden(modelPath) {
    const hidden = document.getElementById('handles-item-model-path');
    const v = (modelPath || '').toString().trim();
    if (hidden) hidden.value = v;
    const dlBtn = document.getElementById('handles-item-download-model-btn');
    if (dlBtn) dlBtn.style.display = v ? '' : 'none';
  }

  function getResolvedHandleModelPath() {
    const parsed = parseCabinetModelItemData(__handlesCabinetModelCache);
    if (parsed?.modelPath) return parsed.modelPath;
    return (document.getElementById('handles-item-model-path')?.value || '').trim();
  }

  async function inferCabinetModelIdForHandleItem(item) {
    const direct = Number(item?.cabinetModelId) || 0;
    if (direct > 0) return direct;
    const modelPath = String(item?.modelParams?.modelPath || item?.modelParams?.model || '').trim();
    if (!modelPath) return 0;
    if (/volna/i.test(modelPath)) return 3;
    const list = await loadCabinetModelsListForPicker();
    for (const it of list) {
      const p = parseCabinetModelItemData(it);
      if (p?.modelPath && p.modelPath === modelPath) return Number(it?.id) || 0;
    }
    return 0;
  }

  async function refreshHandlesPreview() {
    const cmId = Number(document.getElementById('handles-item-cabinet-model-id')?.value || 0) || 0;
    if (!cmId) return;
    if (!__handlesPreviewIframe?.contentWindow) return;
    const mat = readHandlesPreviewMaterial();
    let item = __handlesCabinetModelCache;
    if (!item || Number(item.id) !== cmId) {
      item = await fetchCabinetModelItemById(cmId);
      __handlesCabinetModelCache = item;
    }
    if (item) {
      syncHandleModelPathHidden(parseCabinetModelItemData(item)?.modelPath || '');
      loadHandleInPreviewFromCabinetModel(item, mat);
    }
  }

  async function updateHandlesCabinetModelUi(cabinetModelId, prefetchedItem) {
    const idEl = document.getElementById('handles-item-cabinet-model-id');
    const labelEl = document.getElementById('handles-item-cabinet-model-label');
    const pathEl = document.getElementById('handles-item-cabinet-model-path');
    const emptyEl = document.getElementById('handles-item-cabinet-model-empty');
    const selectedEl = document.getElementById('handles-item-cabinet-model-selected');
    const clearBtn = document.getElementById('handles-item-cabinet-model-clear-btn');
    const editLink = document.getElementById('handles-item-cabinet-model-edit-link');
    const cid = Number(cabinetModelId) || 0;
    if (idEl) idEl.value = cid ? String(cid) : '';
    if (!cid) {
      if (labelEl) labelEl.textContent = '';
      if (pathEl) pathEl.textContent = '';
      if (emptyEl) emptyEl.style.display = '';
      if (selectedEl) selectedEl.style.display = 'none';
      if (clearBtn) clearBtn.style.display = 'none';
      if (editLink) editLink.style.display = 'none';
      __handlesCabinetModelCache = null;
      syncHandleModelPathHidden('');
      return null;
    }
    let item = prefetchedItem;
    if (!item || Number(item.id) !== cid) {
      item = await fetchCabinetModelItemById(cid);
    }
    __handlesCabinetModelCache = item;
    const parsed = parseCabinetModelItemData(item);
    const name = item?.name || ('id=' + cid);
    const sz = parsed?.previewSize;
    const sizeTxt = sz ? `${sz.w}×${sz.h}×${sz.d} мм` : '';
    if (labelEl) labelEl.textContent = `#${cid} — ${name}${sizeTxt ? ' (' + sizeTxt + ')' : ''}`;
    if (pathEl) pathEl.textContent = parsed?.modelPath ? `Файл: ${parsed.modelPath}` : '';
    if (emptyEl) emptyEl.style.display = 'none';
    if (selectedEl) selectedEl.style.display = '';
    if (clearBtn) clearBtn.style.display = '';
    if (editLink) {
      editLink.href = `#models3d-item-edit?id=${encodeURIComponent(String(cid))}`;
      editLink.style.display = '';
    }
    syncHandleModelPathHidden(parsed?.modelPath || '');
    return item;
  }

  async function applyHandlesCabinetModelSelection(cabinetModelId) {
    if (__cmPickContext === 'size') {
      const hidden = document.getElementById('handles-size-cabinet-model-id');
      const lbl = document.getElementById('handles-size-cm-label');
      const cid = Number(cabinetModelId) || 0;
      if (hidden) hidden.value = cid ? String(cid) : '';
      if (lbl) lbl.textContent = cid > 0 ? `Модель #${cid}` : 'Не выбрана';
      __cmPickContext = null;
      return null;
    }
    const item = await updateHandlesCabinetModelUi(cabinetModelId);
    if (__handlesPreviewIframe?.contentWindow) refreshHandlesPreview();
    return item;
  }

  function closeHandlesCabinetModelPicker() {
    const modal = document.getElementById('handles-cabinet-model-picker-modal');
    if (modal) modal.style.display = 'none';
  }

  async function openHandlesCabinetModelPicker(context) {
    __cmPickContext = context || 'main';
    const modal = document.getElementById('handles-cabinet-model-picker-modal');
    const tbody = document.getElementById('handles-cabinet-model-picker-body');
    if (!modal || !tbody) return;
    modal.style.display = 'block';
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:16px;color:#999;">Загрузка...</td></tr>';
    const items = await loadCabinetModelsListForPicker();
    renderHandlesCabinetModelPickerRows(items, (document.getElementById('handles-cabinet-model-picker-search')?.value || '').trim());
  }

  function renderHandlesCabinetModelPickerRows(items, query) {
    const tbody = document.getElementById('handles-cabinet-model-picker-body');
    if (!tbody) return;
    const q = (query || '').toLowerCase();
    let list = Array.isArray(items) ? items.slice() : [];
    if (q) {
      list = list.filter((it) => {
        const name = String(it?.name || '').toLowerCase();
        const id = String(it?.id ?? '');
        return name.includes(q) || id.includes(q);
      });
    }
    list.sort((a, b) => (Number(a?.order) || 0) - (Number(b?.order) || 0));
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:16px;color:#999;">Ничего не найдено</td></tr>';
      return;
    }
    tbody.innerHTML = list.map((it) => {
      const id = Number(it?.id) || 0;
      const name = String(it?.name || '-').replace(/</g, '&lt;');
      const w = Number(it?.width) || 0;
      const h = Number(it?.height) || 0;
      const d = Number(it?.depth) || 0;
      const sz = (w || h || d) ? `${w}×${h}×${d}` : '—';
      return `<tr>
        <td>${id}</td>
        <td>${name}</td>
        <td>${sz}</td>
        <td><button type="button" class="btn btn-primary btn-xs handles-cm-pick-row" data-id="${id}">Выбрать</button></td>
      </tr>`;
    }).join('');
    tbody.querySelectorAll('.handles-cm-pick-row').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute('data-id') || 0) || 0;
        if (!id) return;
        await applyHandlesCabinetModelSelection(id);
        closeHandlesCabinetModelPicker();
        if (window.toastr) window.toastr.success('Привязана 3D модель #' + id);
      });
    });
  }

  function initHandlesPreview() {
    const container = document.getElementById('handles-viewport');
    if (!container) return;
    if (__handlesPreviewIframe && container.contains(__handlesPreviewIframe)) return;
    container.innerHTML = '';
    const placeholder = document.getElementById('handles-preview-placeholder');
    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Clodis 3D — превью ручки');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.minHeight = '538px';
    iframe.style.border = '0';
    iframe.style.display = 'block';
    iframe.style.borderRadius = '4px';
    iframe.src = '/constructor-clodis.html?embedded=1&context=models3d&v=20260623-volna960-bar-fit';
    __handlesPreviewIframe = iframe;
    __handlesPreviewReady = false;
    container.appendChild(iframe);
    if (placeholder) placeholder.style.display = 'none';
  }

  function setHandlesIconPreview(iconUrl) {
    const hidden = document.getElementById('handles-item-icon');
    const prevWrap = document.getElementById('handles-item-icon-preview-wrapper');
    const prevImg = document.getElementById('handles-item-icon-preview');
    const placeholder = document.getElementById('handles-item-icon-placeholder');
    const url = (iconUrl || '').toString().trim();
    if (hidden) hidden.value = url;
    if (prevWrap && prevImg && placeholder) {
      if (url) {
        prevWrap.style.display = 'block';
        placeholder.style.display = 'none';
        prevImg.src = url;
      } else {
        prevWrap.style.display = 'none';
        placeholder.style.display = 'flex';
        prevImg.src = '';
      }
    }
  }

  async function loadHandlesItemEdit(itemId) {
    const id = Number(itemId) || 0;
    document.querySelectorAll('.admin-page').forEach((p) => p.classList.remove('active'));
    const page = document.getElementById('handles-item-edit');
    if (page) page.classList.add('active');

    const hashParams = new URLSearchParams((window.location.hash || '').split('?')[1] || '');
    const requestedTab = (hashParams.get('tab') || '').toLowerCase();
    const urlCollectionId = Number(hashParams.get('collectionId') || 0) || 0;
    const urlModelId = String(hashParams.get('modelId') || '').trim();

    document.getElementById('handles_item_id').value = String(id);
    const parentHidden = document.getElementById('handles-item-parent-collection-id');
    const modelIdHidden = document.getElementById('handles-item-edit-model-id');
    if (modelIdHidden) modelIdHidden.value = urlModelId;

    let item = null;
    if (id) {
      try {
        const resp = await fetch(`/api/catalog/item/${encodeURIComponent(HANDLES_LIST_TYPE)}/${encodeURIComponent(String(id))}?t=${Date.now()}`, { cache: 'no-cache' });
        if (resp.ok) item = await resp.json();
      } catch (e) {
        console.warn('[Handles] load item:', e);
      }
    }
    if (!item && id && Array.isArray(handlesListState.allData)) {
      item = handlesListState.allData.find((it) => Number(it?.id) === id) || null;
    }

    const parentCollectionId = urlCollectionId
      || Number(item?.parentCollectionId)
      || 0;
    const isRulesOnly = requestedTab === 'roles' && id > 0 && !urlCollectionId;
    const isHandleForm = parentCollectionId > 0 && !isRulesOnly;

    if (parentHidden) parentHidden.value = isHandleForm ? String(parentCollectionId) : '0';

    if (!item && isHandleForm) {
      item = { id: 0, name: '', key: '', icon: '', order: 100, active: 1, kind: 'knob', categoryId: null, entityType: 'size', parentCollectionId };
      const coll = await fetchCollectionById(parentCollectionId);
      if (urlModelId && coll) {
        const legacy = coll?.models?.find((m) => String(m?.id) === urlModelId) || null;
        if (legacy) {
          item.name = legacy.label || legacy.id || '';
          item.key = `handle-${legacy.id || urlModelId}`;
          if (legacy.barLengthMm != null) {
            item.sizes = [{ centerDistance: legacy.barLengthMm, name: item.name }];
          }
          applyCollectionMetaToNewHandle(item, coll);
          await applyCabinetModelToHandleItem(item, legacy.cabinetModelId);
        }
      } else if (coll) {
        applyCollectionMetaToNewHandle(item, coll);
      }
    } else if (isHandleForm && item && !Number(item.parentCollectionId)) {
      item.parentCollectionId = parentCollectionId;
    } else if (!item) {
      item = { id: 0, name: '', key: '', icon: '', order: 100, active: 1, kind: 'knob', categoryId: null, entityType: 'collection' };
    }
    if (!item.entityType && !isHandleForm) item.entityType = 'collection';

    const title = document.getElementById('handles-item-edit-title');
    if (title) {
      if (isRulesOnly) title.textContent = `Правила: ${item?.name || ''}`;
      else if (isHandleForm) title.textContent = id ? (item?.name || 'Модель ручки') : 'Добавить модель ручки';
      else title.textContent = id ? `Коллекция: ${item?.name || ''}` : 'Новая коллекция ручек';
    }

    setHandlesEditTabsMode(isRulesOnly ? 'rules' : (isHandleForm ? 'handle' : 'collection'));

    const cancelBtn = document.getElementById('cancel-handles-item-btn');
    const returnHash = sessionStorage.getItem('handlesEditReturn') || '';
    if (cancelBtn) {
      if (isHandleForm && parentCollectionId) {
        cancelBtn.setAttribute('href', `#handles-collection?id=${encodeURIComponent(String(parentCollectionId))}`);
      } else if (isRulesOnly && returnHash) {
        cancelBtn.setAttribute('href', returnHash);
      } else {
        cancelBtn.setAttribute('href', '#handles-list');
        sessionStorage.removeItem('handlesEditReturn');
      }
    }

    const mp = readModelParamsFromItem(item);
    document.getElementById('handles-item-name').value = item?.name || '';
    document.getElementById('handles-item-key').value = item?.key || '';
    document.getElementById('handles-item-order').value = String(item?.order ?? 100);
    document.getElementById('handles-item-active').checked = (item?.active ?? 1) == 1 || item?.active === true;
    await loadHandlesCategoriesIntoSelect(document.getElementById('handles-item-category'), item?.categoryId);
    setHandleKindInDom(item?.kind, item?.categoryId);

    syncHandleModelPathHidden(mp.modelPath || '');
    document.getElementById('handles-item-model-color').value = mp.color || '#000000';
    document.getElementById('handles-item-model-roughness').value = String(mp.roughness);
    document.getElementById('handles-item-model-metalness').value = String(mp.metalness);
    document.getElementById('handles-item-holes-diameter').value = String(mp.holesDiameter);
    document.getElementById('handles-item-holes-count').value = String(mp.holesCount);
    setImageBlock('handles-item-texture', 'handles-item-texture-preview', 'handles-item-texture-placeholder', mp.texture);
    setImageBlock('handles-item-normal-map', 'handles-item-normal-preview', 'handles-item-normal-placeholder', mp.normalMap);
    setHandlesIconPreview(item?.icon || '');

    const cmId = await inferCabinetModelIdForHandleItem(item);
    if (!isHandleForm && (!Array.isArray(item.models) || !item.models.length) && cmId > 0) {
      item.models = [
        {
          id: 'main',
          label: item.name || 'Основной',
          cabinetModelId: cmId,
        },
      ];
    }
    await updateHandlesCabinetModelUi(cmId);

    const placementAdmin = typeof window !== 'undefined' ? window.__cldHandlePlacementRulesAdmin : null;
    if (!isHandleForm && placementAdmin?.loadPlacementUi) {
      await placementAdmin.loadPlacementUi(item);
    }

    if (isHandleForm) {
      const hideSizesEl = document.getElementById('handles-item-hide-sizes-in-catalog');
      if (hideSizesEl) {
        hideSizesEl.checked = !!(item?.hideSizesInCatalog === true || item?.hideSizesInCatalog === 1 || item?.hideSizesInCatalog === '1');
      }
      renderHandlesSizesList(getHandleSizesFromItem(item, urlModelId));
    }

    if (isRulesOnly) switchHandlesEditTab('roles');
    else if (isHandleForm) switchHandlesEditTab('basic');
    else switchHandlesEditTab(requestedTab === 'roles' ? 'roles' : 'basic');
    if (cmId) setTimeout(() => refreshHandlesPreview(), 300);
  }

  function collectModelParamsFromDom() {
    return {
      modelType: 'normal',
      modelPath: getResolvedHandleModelPath(),
      color: document.getElementById('handles-item-model-color')?.value || '#000000',
      roughness: Number(document.getElementById('handles-item-model-roughness')?.value || 0.8),
      metalness: Number(document.getElementById('handles-item-model-metalness')?.value || 0),
      texture: (document.getElementById('handles-item-texture')?.value || '').trim(),
      normalMap: (document.getElementById('handles-item-normal-map')?.value || '').trim(),
      holesDiameter: Number(document.getElementById('handles-item-holes-diameter')?.value || 0),
      holesCount: Number(document.getElementById('handles-item-holes-count')?.value || 1),
    };
  }

  async function saveHandlesItem(exitAfter) {
    try {
      const id = Number(document.getElementById('handles_item_id')?.value || '0') || 0;
      const parentCollectionId = Number(document.getElementById('handles-item-parent-collection-id')?.value || 0) || 0;
      const legacyModelId = String(document.getElementById('handles-item-edit-model-id')?.value || '').trim();
      const isHandleChild = parentCollectionId > 0;
      const categoryId = Number(document.getElementById('handles-item-category')?.value || '') || null;
      const modelParams = collectModelParamsFromDom();
      let cabinetModelId = Number(document.getElementById('handles-item-cabinet-model-id')?.value || 0) || null;

      if (isHandleChild) {
        if (!cabinetModelId) {
          alert('Выберите 3D модель на вкладке «Параметры модели» — у каждой ручки в коллекции своя модель.');
          return;
        }
        if (!modelParams.modelPath) {
          await updateHandlesCabinetModelUi(cabinetModelId);
          modelParams.modelPath = getResolvedHandleModelPath();
        }
        const payload = {
          entityType: 'size',
          parentCollectionId,
          name: (document.getElementById('handles-item-name')?.value || '').toString().trim(),
          key: (document.getElementById('handles-item-key')?.value || '').toString().trim(),
          order: Number(document.getElementById('handles-item-order')?.value || '100') || 100,
          active: document.getElementById('handles-item-active')?.checked ? 1 : 0,
          kind: readKindFromDom(),
          categoryId,
          cabinetModelId: cabinetModelId || null,
          icon: (document.getElementById('handles-item-icon')?.value || '').trim(),
          sizeType: 'normal',
          modelParams,
          sizes: collectHandlesSizesFromDom(),
          hideSizesInCatalog: readHideSizesInCatalogFromDom(),
        };
        if (!payload.sizes.length) {
          payload.sizes = defaultHandleSizesFromItem({ name: payload.name }, legacyModelId);
        }
        if (!payload.name) {
          alert('Введите название');
          return;
        }
        const modelCode = deriveHandleModelCode(payload, legacyModelId);
        if (modelCode && (!payload.key || /^handle-\d{10,}$/.test(payload.key))) {
          payload.key = 'handle-' + modelCode;
          const keyEl = document.getElementById('handles-item-key');
          if (keyEl) keyEl.value = payload.key;
        }
        if (!payload.key && !id) payload.key = 'handle-' + (modelCode || Date.now());
        const url = id
          ? `/api/catalog/item_update/${encodeURIComponent(HANDLES_LIST_TYPE)}/${encodeURIComponent(String(id))}/`
          : `/api/catalog/item_add/${encodeURIComponent(HANDLES_LIST_TYPE)}/`;
        const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, id }) });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data?.error || data?.message || resp.statusText);
        const saved = data?.item || data;
        const savedId = Number(saved?.id ?? data?.id ?? id ?? 0) || 0;
        await syncHandleToCollectionModels(parentCollectionId, { ...payload, id: savedId, sizes: payload.sizes }, modelCode || legacyModelId);
        if (window.toastr) window.toastr.success('Сохранено');
        if (typeof window.invalidateHandlesCatalogCache === 'function') window.invalidateHandlesCatalogCache();
        await reloadHandlesCatalogState();
        const backHash = `#handles-collection?id=${encodeURIComponent(String(parentCollectionId))}`;
        sessionStorage.removeItem('handlesEditReturn');
        window.location.hash = backHash;
        openHandlesCollection(parentCollectionId);
        return;
      }

      const placementAdmin = typeof window !== 'undefined' ? window.__cldHandlePlacementRulesAdmin : null;
      const placementExtra = placementAdmin?.collectPlacementPayload ? placementAdmin.collectPlacementPayload() : {};
      if (placementAdmin?.resolvePrimaryCabinetModelId) {
        const resolvedCm = placementAdmin.resolvePrimaryCabinetModelId(placementExtra, cabinetModelId);
        if (resolvedCm > 0) cabinetModelId = resolvedCm;
      }
      if (!cabinetModelId) {
        alert('Выберите 3D модель: вкладка «Параметры модели» или «По ролям» → размер в коллекции');
        return;
      }
      if (!modelParams.modelPath) {
        await updateHandlesCabinetModelUi(cabinetModelId);
        modelParams.modelPath = getResolvedHandleModelPath();
      }
      const payload = {
        entityType: 'collection',
        name: (document.getElementById('handles-item-name')?.value || '').toString().trim(),
        key: (document.getElementById('handles-item-key')?.value || '').toString().trim(),
        order: Number(document.getElementById('handles-item-order')?.value || '100') || 100,
        active: document.getElementById('handles-item-active')?.checked ? 1 : 0,
        kind: readKindFromDom(),
        categoryId,
        cabinetModelId: cabinetModelId || null,
        icon: (document.getElementById('handles-item-icon')?.value || '').toString().trim(),
        sizeType: 'normal',
        modelParams,
        hideSizesInCatalog: true,
        models: Array.isArray(placementExtra.models) ? placementExtra.models : [],
        defaults: placementExtra.defaults === null ? null : placementExtra.defaults || undefined,
        placementRules: Array.isArray(placementExtra.placementRules) ? placementExtra.placementRules : [],
      };
      if (!payload.name) {
        alert('Введите название');
        return;
      }
      if (!payload.key && !id) {
        payload.key = 'collection-' + Date.now();
      }
      const url = id
        ? `/api/catalog/item_update/${encodeURIComponent(HANDLES_LIST_TYPE)}/${encodeURIComponent(String(id))}/`
        : `/api/catalog/item_add/${encodeURIComponent(HANDLES_LIST_TYPE)}/`;
      const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, id }) });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || data?.message || resp.statusText);
      if (window.toastr) window.toastr.success('Сохранено');
      if (typeof window.invalidateHandlesCatalogCache === 'function') window.invalidateHandlesCatalogCache();
      if (exitAfter) {
        const returnHash = sessionStorage.getItem('handlesEditReturn') || '#handles-list';
        sessionStorage.removeItem('handlesEditReturn');
        window.location.hash = returnHash;
        if (returnHash.indexOf('handles-collection') === 1) {
          const rp = new URLSearchParams(returnHash.split('?')[1] || '');
          const cid = Number(rp.get('id') || 0) || 0;
          openHandlesCollection(cid);
        } else {
          document.querySelectorAll('.admin-page').forEach((p) => p.classList.remove('active'));
          const listPage = document.getElementById('handles-list');
          if (listPage) listPage.classList.add('active');
          await loadHandlesList();
        }
      } else {
        const newId = Number(data?.item?.id ?? data?.id ?? id ?? 0) || 0;
        if (newId && newId !== id) {
          document.getElementById('handles_item_id').value = String(newId);
          window.location.hash = `#handles-item-edit?id=${newId}`;
        }
        await loadHandlesItemEdit(newId || id);
      }
    } catch (e) {
      console.error('❌ Ошибка сохранения ручки:', e);
      alert('Ошибка сохранения: ' + (e.message || e));
    }
  }

  async function deleteHandlesItem(itemId, itemName) {
    if (!confirm(`Удалить коллекцию «${itemName}»?`)) return;
    try {
      const resp = await fetch(`/api/catalog/item_delete/${encodeURIComponent(HANDLES_LIST_TYPE)}/${encodeURIComponent(String(itemId))}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      if (window.toastr) window.toastr.success('Удалено');
      if (typeof window.invalidateHandlesCatalogCache === 'function') window.invalidateHandlesCatalogCache();
      await loadHandlesList();
    } catch (e) {
      console.error('❌ Ошибка удаления:', e);
      alert('Ошибка удаления');
    }
  }

  async function copyHandlesItem(itemId) {
    try {
      const resp = await fetch(`/api/catalog/item/${encodeURIComponent(HANDLES_LIST_TYPE)}/${encodeURIComponent(String(itemId))}?t=${Date.now()}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const item = await resp.json();
      const parentCid = collectionPageState.collectionId || Number(item?.parentCollectionId) || 0;
      const copy = {
        ...item,
        id: 0,
        name: `${item?.name || 'Серия'} (копия)`,
        key: (item?.key || 'series') + '-copy-' + Date.now(),
        entityType: parentCid > 0 ? 'size' : (item?.entityType || 'collection'),
        parentCollectionId: parentCid > 0 ? parentCid : (item?.parentCollectionId || null),
      };
      const addResp = await fetch(`/api/catalog/item_add/${encodeURIComponent(HANDLES_LIST_TYPE)}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(copy),
      });
      const addData = await addResp.json();
      if (!addResp.ok) throw new Error(addData?.error || `HTTP ${addResp.status}`);
      if (parentCid > 0) {
        const saved = addData?.item || addData;
        await syncHandleToCollectionModels(parentCid, { ...copy, id: Number(saved?.id) || 0 });
        await reloadHandlesCatalogState();
        await loadHandlesCollectionPage(parentCid);
      } else {
        await loadHandlesList();
      }
      if (window.toastr) window.toastr.success('Скопировано');
    } catch (e) {
      console.error('❌ Ошибка копирования:', e);
      alert('Ошибка копирования');
    }
  }

  async function toggleHandlesVisibility(itemId, iconElement) {
    try {
      const currentActive = iconElement.getAttribute('data-h-active') === '1';
      const newActive = !currentActive;
      const resp = await fetch(`/api/catalog/item/${encodeURIComponent(HANDLES_LIST_TYPE)}/${encodeURIComponent(String(itemId))}?t=${Date.now()}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const item = await resp.json();
      const updateResp = await fetch(`/api/catalog/item_update/${encodeURIComponent(HANDLES_LIST_TYPE)}/${encodeURIComponent(String(itemId))}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, active: newActive ? 1 : 0 }),
      });
      if (!updateResp.ok) throw new Error(`HTTP ${updateResp.status}`);
      iconElement.className = `fa ${newActive ? 'fa-eye' : 'fa-eye-slash'} btn btn-outline ${newActive ? 'btn-success' : 'btn-default'}`;
      iconElement.setAttribute('data-h-active', newActive ? '1' : '0');
      iconElement.setAttribute('title', newActive ? 'Видим' : 'Скрыт');
      if (window.toastr) window.toastr.success(newActive ? 'Показано' : 'Скрыто');
      const cid = collectionPageState.collectionId || Number(item?.parentCollectionId) || 0;
      if (cid > 0) await loadHandlesCollectionPage(cid);
    } catch (e) {
      console.error('❌ Ошибка видимости:', e);
      alert('Ошибка изменения видимости');
    }
  }

  function initHandlesImagePicker(placeholderId, previewId, hiddenId, placeholderBoxId, allowedExt, initialPath, uploadUrl) {
    const placeholder = document.getElementById(placeholderId);
    const preview = document.getElementById(previewId);
    const hidden = document.getElementById(hiddenId);
    const openPicker = () => {
      if (typeof window.openFileManager === 'function') {
        window.openFileManager({
          allowedExt,
          initialPath,
          onSelect: (r) => {
            if (r && r.url) setImageBlock(hiddenId, previewId, placeholderBoxId, r.url);
          },
        });
      }
    };
    if (placeholder && !placeholder._handlesImgBound) {
      placeholder._handlesImgBound = true;
      placeholder.addEventListener('click', openPicker);
    }
    if (preview && !preview._handlesImgBound) {
      preview._handlesImgBound = true;
      preview.addEventListener('click', openPicker);
    }
    return { hidden, preview, placeholder };
  }

  function initCollectionAddIconUpload() {
    const placeholder = document.getElementById('handles-collection-add-icon-placeholder');
    const preview = document.getElementById('handles-collection-add-icon-preview');
    const openPicker = () => {
      if (typeof window.openFileManager === 'function') {
        window.openFileManager({
          allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tif', '.tiff'],
          initialPath: 'files',
          onSelect: (r) => {
            if (r && r.url) setCollectionAddIcon(r.url);
          },
        });
      }
    };
    if (placeholder && !placeholder._handlesCollIconBound) {
      placeholder._handlesCollIconBound = true;
      placeholder.addEventListener('click', openPicker);
    }
    if (preview && !preview._handlesCollIconBound) {
      preview._handlesCollIconBound = true;
      preview.addEventListener('click', openPicker);
    }
    const clearBtn = document.getElementById('handles-collection-add-icon-clear');
    if (clearBtn && !clearBtn._handlesCollIconBound) {
      clearBtn._handlesCollIconBound = true;
      clearBtn.addEventListener('click', () => setCollectionAddIcon(''));
    }
  }

  function initCollectionModalHandlers() {
    if (window.__handlesCollectionModalBound) return;
    window.__handlesCollectionModalBound = true;
    initCollectionAddIconUpload();
    const modal = document.getElementById('handles-collection-add-modal');
    const close = () => closeCollectionAddModal();
    ['handles-collection-add-modal-close', 'handles-collection-add-cancel'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', close);
    });
    const saveBtn = document.getElementById('handles-collection-add-save');
    if (saveBtn) saveBtn.addEventListener('click', () => saveNewCollectionFromModal());
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
      });
    }
  }

  function initHandlesCollectionPageHandlers() {
    if (window.__handlesCollectionPageBound) return;
    window.__handlesCollectionPageBound = true;
    const addSizeBtn = document.getElementById('handles-collection-add-size-btn');
    if (addSizeBtn) {
      addSizeBtn.addEventListener('click', () => {
        const cid = collectionPageState.collectionId || 0;
        if (cid) openHandlesItemEditFromCollection(cid, 0, '');
      });
    }
    const rulesBtn = document.getElementById('handles-collection-rules-btn');
    if (rulesBtn) {
      rulesBtn.addEventListener('click', () => {
        const cid = collectionPageState.collectionId || 0;
        if (!cid) return;
        sessionStorage.setItem('handlesEditReturn', `#handles-collection?id=${encodeURIComponent(String(cid))}`);
        window.location.hash = `#handles-item-edit?id=${encodeURIComponent(String(cid))}&tab=roles`;
      });
    }
  }

  function initHandlesIconUpload() {
    const placeholder = document.getElementById('handles-item-icon-placeholder');
    const previewWrap = document.getElementById('handles-item-icon-preview-wrapper');
    const fileInput = document.getElementById('handles-item-icon-file');
    const openPicker = () => {
      if (typeof window.openFileManager === 'function') {
        window.openFileManager({
          allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
          initialPath: 'room_icons',
          onSelect: (r) => {
            if (r && r.url) setHandlesIconPreview(r.url);
          },
        });
      } else if (fileInput) {
        fileInput.click();
      }
    };
    if (placeholder) placeholder.addEventListener('click', openPicker);
    if (previewWrap) previewWrap.addEventListener('click', openPicker);
    const clearBtn = document.getElementById('handles-item-icon-clear');
    if (clearBtn && !clearBtn._handlesBound) {
      clearBtn._handlesBound = true;
      clearBtn.addEventListener('click', () => setHandlesIconPreview(''));
    }
    if (fileInput && !fileInput._handlesBound) {
      fileInput._handlesBound = true;
      fileInput.addEventListener('change', async () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('file', file);
        try {
          const r = await fetch('/api/upload/room_icon', { method: 'POST', body: fd });
          const data = await r.json();
          if (data.files && data.files[0] && data.files[0].url) {
            setHandlesIconPreview(data.files[0].url);
            if (window.toastr) window.toastr.success('Иконка загружена');
          }
        } catch (e) {
          if (window.toastr) window.toastr.error('Ошибка загрузки');
        }
        fileInput.value = '';
      });
    }
  }

  function initHandlesEditHandlers() {
    if (window.__handlesEditHandlersBound) return;
    window.__handlesEditHandlersBound = true;

    const tabsHost = document.getElementById('handles-item-tabs');
    if (tabsHost) {
      tabsHost.addEventListener('click', (e) => {
        const link = e.target.closest('[data-handles-tab]');
        if (!link) return;
        e.preventDefault();
        switchHandlesEditTab(link.getAttribute('data-handles-tab'));
      });
    }

    initHandlesIconUpload();
    initHandlesImagePicker(
      'handles-item-texture-placeholder', 'handles-item-texture-preview', 'handles-item-texture',
      'handles-item-texture-placeholder', ['.jpg', '.jpeg', '.png', '.webp'], 'common_assets/images', null
    );
    initHandlesImagePicker(
      'handles-item-normal-placeholder', 'handles-item-normal-preview', 'handles-item-normal-map',
      'handles-item-normal-placeholder', ['.jpg', '.jpeg', '.png', '.webp'], 'common_assets/images', null
    );

    const cmPickBtn = document.getElementById('handles-item-cabinet-model-pick-btn');
    const cmClearBtn = document.getElementById('handles-item-cabinet-model-clear-btn');
    const cmPickerClose = document.getElementById('handles-cabinet-model-picker-close');
    const cmPickerCloseFooter = document.getElementById('handles-cabinet-model-picker-close-footer');
    const cmPickerSearch = document.getElementById('handles-cabinet-model-picker-search');
    const cmPickerSearchBtn = document.getElementById('handles-cabinet-model-picker-search-btn');
    const cmPickerModal = document.getElementById('handles-cabinet-model-picker-modal');

    if (cmPickBtn) cmPickBtn.addEventListener('click', () => openHandlesCabinetModelPicker());
    if (cmClearBtn) {
      cmClearBtn.addEventListener('click', async () => {
        await updateHandlesCabinetModelUi(0);
      });
    }
    if (cmPickerClose) cmPickerClose.addEventListener('click', closeHandlesCabinetModelPicker);
    if (cmPickerCloseFooter) cmPickerCloseFooter.addEventListener('click', closeHandlesCabinetModelPicker);
    if (cmPickerModal) {
      cmPickerModal.addEventListener('click', (e) => {
        if (e.target === cmPickerModal) closeHandlesCabinetModelPicker();
      });
    }
    const runCmPickerSearch = () => {
      loadCabinetModelsListForPicker().then((items) => {
        renderHandlesCabinetModelPickerRows(items, cmPickerSearch?.value || '');
      });
    };
    if (cmPickerSearchBtn) cmPickerSearchBtn.addEventListener('click', runCmPickerSearch);
    if (cmPickerSearch) {
      cmPickerSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); runCmPickerSearch(); }
      });
    }

    ['handles-item-model-color', 'handles-item-model-roughness', 'handles-item-model-metalness'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        const sync = () => {
          if (Number(document.getElementById('handles-item-cabinet-model-id')?.value || 0)) refreshHandlesPreview();
        };
        el.addEventListener('change', sync);
        el.addEventListener('input', sync);
      }
    });

    const sizesAddBtn = document.getElementById('handles-item-sizes-add-btn');
    if (sizesAddBtn) {
      sizesAddBtn.addEventListener('click', () => {
        addHandleSizeRow();
      });
    }

    const dlBtn = document.getElementById('handles-item-download-model-btn');
    if (dlBtn) {
      dlBtn.addEventListener('click', () => {
        const path = getResolvedHandleModelPath();
        if (!path) return;
        const a = document.createElement('a');
        a.href = path.startsWith('/') ? path : '/' + path;
        a.download = '';
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
    }

    const cancelBtn = document.getElementById('cancel-handles-item-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.hash = '#handles-list';
      });
    }

    if (!window.__handlesPreviewMsgBound) {
      window.__handlesPreviewMsgBound = true;
      window.addEventListener('message', (ev) => {
        if (ev?.data?.type === 'cld:iframeReady') __handlesPreviewReady = true;
      });
    }
  }

  function initHandlesListHandlers() {
    initCollectionModalHandlers();
    initHandlesCollectionPageHandlers();

    const addBtn = document.getElementById('handles-list-add-btn');
    if (addBtn && !addBtn._handlesBound) {
      addBtn._handlesBound = true;
      addBtn.addEventListener('click', () => openCollectionAddModal());
    }
    const catBtn = document.getElementById('handles-list-categories-btn');
    if (catBtn && !catBtn._handlesBound) {
      catBtn._handlesBound = true;
      catBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.hash = `#edges-categories?type=${encodeURIComponent(HANDLES_LIST_TYPE)}&name=${encodeURIComponent('Ручки')}`;
      });
    }
    const perPage = document.getElementById('handles-list-per-page');
    if (perPage && !perPage._handlesBound) {
      perPage._handlesBound = true;
      perPage.addEventListener('change', (e) => {
        handlesListState.perPage = parseInt(e.target.value || '20', 10) || 20;
        handlesListState.currentPage = 1;
        renderHandlesListTable();
      });
    }
    const catFilter = document.getElementById('handles-list-category-filter');
    if (catFilter && !catFilter._handlesBound) {
      catFilter._handlesBound = true;
      catFilter.addEventListener('change', () => {
        handlesListState.currentPage = 1;
        renderHandlesListTable();
      });
    }
    const searchInput = document.getElementById('handles-list-search-input');
    if (searchInput && !searchInput._handlesBound) {
      searchInput._handlesBound = true;
      let t = null;
      searchInput.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          handlesListState.currentPage = 1;
          renderHandlesListTable();
        }, 300);
      });
    }
    const tbody = document.getElementById('handles-list-table-body');
    if (tbody && !tbody._handlesBound) {
      tbody._handlesBound = true;
      tbody.addEventListener('click', (e) => {
        const el = e.target.closest('[data-h-action]');
        if (!el) return;
        e.preventDefault();
        const action = el.getAttribute('data-h-action');
        const id = Number(el.getAttribute('data-h-id') || '0');
        const name = el.getAttribute('data-h-name') || '';
        if (action === 'open' || action === 'edit') openHandlesCollection(id);
        else if (action === 'copy') copyHandlesItem(id);
        else if (action === 'delete') deleteHandlesItem(id, name);
        else if (action === 'toggle-visibility') toggleHandlesVisibility(id, el);
      });
    }
    const saveBtn = document.getElementById('save-handles-item-btn');
    const saveExitBtn = document.getElementById('save-and-exit-handles-item-btn');
    if (saveBtn && !saveBtn._handlesBound) {
      saveBtn._handlesBound = true;
      saveBtn.addEventListener('click', () => saveHandlesItem(false));
    }
    if (saveExitBtn && !saveExitBtn._handlesBound) {
      saveExitBtn._handlesBound = true;
      saveExitBtn.addEventListener('click', () => saveHandlesItem(true));
    }
    initHandlesEditHandlers();
  }

  function handleHandlesRouting() {
    const hash = window.location.hash || '';
    if (hash.startsWith('#handles-list')) {
      document.querySelectorAll('.admin-page').forEach((p) => p.classList.remove('active'));
      const listPage = document.getElementById('handles-list');
      if (listPage) {
        listPage.classList.add('active');
        loadHandlesList();
      }
    } else if (hash.startsWith('#handles-collection')) {
      const params = new URLSearchParams(hash.split('?')[1] || '');
      const id = Number(params.get('id') || '0') || 0;
      document.querySelectorAll('.admin-page').forEach((p) => p.classList.remove('active'));
      const page = document.getElementById('handles-collection');
      if (page) {
        page.classList.add('active');
        loadHandlesCollectionPage(id);
      }
    } else if (hash.startsWith('#handles-size-edit')) {
      const params = new URLSearchParams(hash.split('?')[1] || '');
      const collectionId = Number(params.get('collectionId') || '0') || 0;
      const sizeId = params.get('sizeId') || params.get('modelId') || '';
      openHandlesItemEditFromCollection(collectionId, 0, sizeId);
    } else if (hash.startsWith('#handles-item-edit')) {
      const params = new URLSearchParams(hash.split('?')[1] || '');
      const id = params.get('id') || '0';
      document.querySelectorAll('.admin-page').forEach((p) => p.classList.remove('active'));
      const editPage = document.getElementById('handles-item-edit');
      if (editPage) {
        editPage.classList.add('active');
        loadHandlesItemEdit(id);
      }
    }
  }

  window.loadHandlesList = loadHandlesList;
  window.loadHandlesCollectionPage = loadHandlesCollectionPage;
  window.openHandlesCollection = openHandlesCollection;
  window.__cldSetCollectionAddIcon = setCollectionAddIcon;
  window.loadHandlesListFromUI = function() {
    handlesListState.currentPage = 1;
    renderHandlesListTable();
  };
  window.openHandlesItemEdit = openHandlesItemEdit;
  window.openHandlesItemEditFromCollection = openHandlesItemEditFromCollection;
  window.loadHandlesItemEdit = loadHandlesItemEdit;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initHandlesListHandlers();
      handleHandlesRouting();
    });
  } else {
    initHandlesListHandlers();
    handleHandlesRouting();
  }
  window.addEventListener('hashchange', handleHandlesRouting);
  window.addEventListener('popstate', handleHandlesRouting);
})();
