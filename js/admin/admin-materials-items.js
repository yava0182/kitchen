/**
 * admin-materials-items.js — Список элементов материала (ЛДСП, ХДФ и т.д.)
 * Extracted from admin-new.html for better Cursor performance
 */
(function() {
  'use strict';

  const materialsItemsState = { type: '', name: '', currentPage: 1, perPage: 20, allData: [], filtered: [] };

  const materialsCategoriesCache = {};

  function buildMaterialCategoryFullName(cat, all) {
    const byId = {};
    all.forEach(c => { byId[String(c.id)] = c; });
    const chain = [];
    let cur = cat;
    while (cur) {
      if (cur.name) chain.unshift(cur.name);
      const parentId = cur.parent == null ? null : String(cur.parent);
      if (!parentId || !byId[parentId]) break;
      cur = byId[parentId];
    }
    return chain.join(' / ');
  }

  async function loadMaterialsCategoriesForCurrentType() {
    const typeKey = materialsItemsState.type || readMaterialsItemsParamsFromHash().type || '';
    if (!typeKey) return [];
    if (Array.isArray(materialsCategoriesCache[typeKey])) return materialsCategoriesCache[typeKey];
    try {
      const resp = await fetch(`/api/catalog/categories_get/${encodeURIComponent(typeKey)}?t=${Date.now()}`, { cache: 'no-cache' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      const data = await resp.json();
      const arr = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
      materialsCategoriesCache[typeKey] = arr;
      return arr;
    } catch (e) {
      console.warn('⚠️ Не удалось загрузить категории материалов для типа', typeKey, e);
      materialsCategoriesCache[typeKey] = [];
      return [];
    }
  }

  function readMaterialsItemsParamsFromHash() {
    const hash = window.location.hash || '';
    const params = new URLSearchParams(hash.split('?')[1] || '');
    return { type: params.get('type') || '' };
  }

  function getMaterialNameFromMenu(typeKey) {
    if (!typeKey) return '';
    const a = document.querySelector(`a[data-page="materials-items"][data-catalog-type="${CSS.escape(typeKey)}"]`);
    return a ? (a.getAttribute('data-catalog-name') || a.getAttribute('data-material-name') || '') : '';
  }

  function normalizeItemsResponse(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  }

  function getMatItemArticle(item) {
    return (item?.article ?? item?.code ?? item?.vendor_code ?? '').toString();
  }

  function getMatItemCategory(item) {
    const c = item?.category;
    if (Array.isArray(c)) return (c[0] ?? '').toString();
    return (c ?? item?.category_name ?? '').toString();
  }

  function applyMaterialsItemsFilters() {
    const q = (document.getElementById('materials-items-search-input')?.value || '').toString().trim().toLowerCase();
    const cat = (document.getElementById('materials-items-category-filter')?.value || '').toString();
    const all = Array.isArray(materialsItemsState.allData) ? materialsItemsState.allData : [];
    let out = all;
    if (q) {
      out = out.filter((it) => {
        const name = (it?.name || '').toString().toLowerCase();
        const art = getMatItemArticle(it).toLowerCase();
        const id = String(it?.id ?? '');
        return name.includes(q) || art.includes(q) || id.includes(q);
      });
    }
    if (cat) out = out.filter((it) => getMatItemCategory(it) === cat);
    materialsItemsState.filtered = out;
    const totalPages = Math.max(1, Math.ceil(out.length / (materialsItemsState.perPage || 20)));
    if (materialsItemsState.currentPage > totalPages) materialsItemsState.currentPage = totalPages;
    if (materialsItemsState.currentPage < 1) materialsItemsState.currentPage = 1;
  }

  async function renderMaterialsItemsCategories() {
    const sel = document.getElementById('materials-items-category-filter');
    const editSel = document.getElementById('material-item-category');
    if (!sel) return;
    const cats = await loadMaterialsCategoriesForCurrentType();
    const withNames = Array.isArray(cats)
      ? cats.map(c => {
          const full = buildMaterialCategoryFullName(c, cats) || (c.name || '');
          return { id: c.id, fullName: full };
        }).filter(c => c.fullName)
      : [];
    withNames.sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru'));

    const cur = sel.value || '';
    sel.innerHTML = `<option value="">Нет</option>` + withNames.map((c) => {
      const esc = c.fullName.replace(/"/g, '&quot;');
      return `<option value="${esc}">${esc}</option>`;
    }).join('');
    if (cur) sel.value = cur;
    if (editSel) {
      const curEdit = editSel.value || '';
      editSel.innerHTML = `<option value="">Нет</option>` + withNames.map((c) => {
        const esc = c.fullName.replace(/"/g, '&quot;');
        return `<option value="${esc}">${esc}</option>`;
      }).join('');
      if (curEdit) editSel.value = curEdit;
    }
  }

  function renderMaterialsItemsTable() {
    const tbody = document.getElementById('materials-items-table-body');
    if (!tbody) return;
    applyMaterialsItemsFilters();
    const data = materialsItemsState.filtered;
    tbody.innerHTML = '';
    if (!materialsItemsState.type) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:20px; color:#999;">Выберите тип материала из меню</td></tr>';
      renderMaterialsItemsPagination(0);
      return;
    }
    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:20px; color:#999;">Нет данных</td></tr>';
      renderMaterialsItemsPagination(0);
      return;
    }
    const startIndex = (materialsItemsState.currentPage - 1) * materialsItemsState.perPage;
    const endIndex = startIndex + materialsItemsState.perPage;
    const pageData = data.slice(startIndex, endIndex);

    for (const item of pageData) {
      const tr = document.createElement('tr');
      const tdChk = document.createElement('td');
      tdChk.style.width = '10px';
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.className = 'materials-item-checkbox';
      chk.value = item?.id ?? '';
      tdChk.appendChild(chk);

      const tdId = document.createElement('td');
      tdId.style.width = '60px';
      tdId.textContent = String(item?.id ?? '-');

      const tdIcon = document.createElement('td');
      tdIcon.style.width = '90px';
      const iconUrl = (item?.icon || item?.image || '').toString();
      if (iconUrl) {
        const img = document.createElement('img');
        img.src = iconUrl;
        img.alt = '';
        img.style.width = '70px';
        img.style.height = '70px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '6px';
        img.style.border = '1px solid #e5e7eb';
        tdIcon.appendChild(img);
      } else {
        tdIcon.innerHTML = '<div style="width:70px; height:70px; border:1px solid #e5e7eb; border-radius:6px; background:#f8fafc;"></div>';
      }

      const tdName = document.createElement('td');
      tdName.textContent = item?.name || '';
      const tdArt = document.createElement('td');
      tdArt.style.width = '140px';
      tdArt.innerHTML = `<span style="color:#334155;">${(getMatItemArticle(item) || '').replace(/</g, '&lt;')}</span>`;
      const tdCat = document.createElement('td');
      tdCat.textContent = getMatItemCategory(item) || '';
      const tdOrder = document.createElement('td');
      tdOrder.style.width = '90px';
      tdOrder.textContent = String(item?.order ?? item?.sort ?? '');
      const tdVis = document.createElement('td');
      tdVis.style.width = '110px';
      const active = (item?.active ?? 1) === 1 || item?.active === true || item?.active === '1';
      tdVis.innerHTML = active
        ? '<button type="button" class="btn btn-xs btn-outline btn-success" title="Видим"><i class="fa fa-eye"></i></button>'
        : '<button type="button" class="btn btn-xs btn-outline btn-default" title="Скрыт"><i class="fa fa-eye-slash"></i></button>';

      const tdAct = document.createElement('td');
      tdAct.style.width = '160px';
      const actWrap = document.createElement('div');
      actWrap.style.display = 'flex';
      actWrap.style.gap = '8px';
      actWrap.style.justifyContent = 'center';

      const mkBtn = (className, title, iconClass, action) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = className;
        b.title = title;
        b.setAttribute('data-mi-action', action);
        b.setAttribute('data-mi-id', String(item?.id || ''));
        b.setAttribute('data-mi-name', String(item?.name || '').replace(/"/g, '&quot;'));
        const ic = document.createElement('i');
        ic.className = iconClass;
        b.appendChild(ic);
        return b;
      };

      actWrap.appendChild(mkBtn('btn btn-xs btn-outline btn-primary', 'Редактировать', 'fa fa-pencil', 'edit'));
      actWrap.appendChild(mkBtn('btn btn-xs btn-outline btn-info', 'Копировать', 'fa fa-copy', 'copy'));
      actWrap.appendChild(mkBtn('btn btn-xs btn-outline btn-danger', 'Удалить', 'fa fa-trash', 'delete'));

      tdAct.appendChild(actWrap);
      tr.appendChild(tdChk);
      tr.appendChild(tdId);
      tr.appendChild(tdIcon);
      tr.appendChild(tdName);
      tr.appendChild(tdArt);
      tr.appendChild(tdCat);
      tr.appendChild(tdOrder);
      tr.appendChild(tdVis);
      tr.appendChild(tdAct);
      tbody.appendChild(tr);
    }
    renderMaterialsItemsPagination(data.length);
  }

  function renderMaterialsItemsPagination(totalItems) {
    const top = document.getElementById('materials-items-pagination-top');
    const bottom = document.getElementById('materials-items-pagination-bottom');
    const fromEl = document.getElementById('materials-items-from');
    const toEl = document.getElementById('materials-items-to');
    const totalEl = document.getElementById('materials-items-total');
    if (!top || !bottom) return;

    const perPage = materialsItemsState.perPage || 20;
    const currentPage = materialsItemsState.currentPage || 1;
    const totalPages = Math.max(1, Math.ceil((totalItems || 0) / perPage));
    const start = totalItems ? ((currentPage - 1) * perPage + 1) : 0;
    const end = totalItems ? Math.min(currentPage * perPage, totalItems) : 0;
    if (fromEl) fromEl.textContent = String(start);
    if (toEl) toEl.textContent = String(end);
    if (totalEl) totalEl.textContent = String(totalItems || 0);

    const renderTo = (host) => {
      let html = '';
      const add = (label, page, disabled = false, active = false) => {
        html += `<li class="page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}"><a class="page-link" href="#" data-page="${page}">${label}</a></li>`;
      };
      add('&lt;&lt;', 1, currentPage === 1);
      add('&lt;', Math.max(1, currentPage - 1), currentPage === 1);
      const windowSize = 9;
      let startPage = Math.max(1, currentPage - Math.floor(windowSize / 2));
      let endPage = Math.min(totalPages, startPage + windowSize - 1);
      startPage = Math.max(1, endPage - windowSize + 1);
      for (let p = startPage; p <= endPage; p++) add(String(p), p, false, p === currentPage);
      add('&gt;', Math.min(totalPages, currentPage + 1), currentPage === totalPages);
      add('&gt;&gt;', totalPages, currentPage === totalPages);
      host.innerHTML = html;
      host.querySelectorAll('a.page-link').forEach((a) => {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          const p = parseInt(a.getAttribute('data-page') || '0', 10);
          if (!p || p === materialsItemsState.currentPage) return;
          materialsItemsState.currentPage = p;
          renderMaterialsItemsTable();
        });
      });
    };
    renderTo(top);
    renderTo(bottom);
  }

  async function loadMaterialsItems(typeKey, name) {
    try {
      const tbody = document.getElementById('materials-items-table-body');
      if (!tbody) return;

      materialsItemsState.type = typeKey || '';
      materialsItemsState.name = name || getMaterialNameFromMenu(typeKey) || typeKey || 'Материалы';

      const title = document.getElementById('materials-items-title');
      const subtitle = document.getElementById('materials-items-subtitle');
      if (title) title.textContent = `Список ${materialsItemsState.name}`;
      if (subtitle) subtitle.textContent = materialsItemsState.name;

      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:20px;">Загрузка...</td></tr>';

      const resp = await fetch(`/api/catalog/items_get/${encodeURIComponent(typeKey)}?t=${Date.now()}`, { cache: 'no-cache' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      const data = await resp.json();
      const items = normalizeItemsResponse(data);

      materialsItemsState.allData = items;
      materialsItemsState.currentPage = 1;

      renderMaterialsItemsCategories();
      renderMaterialsItemsTable();
    } catch (e) {
      console.error('❌ Ошибка загрузки элементов материала:', e);
      const tbody = document.getElementById('materials-items-table-body');
      if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:20px; color:#999;">Ошибка загрузки данных</td></tr>';
      renderMaterialsItemsPagination(0);
    }
  }

  function loadMaterialsItemsFromHash() {
    const { type } = readMaterialsItemsParamsFromHash();
    if (!type) return;
    loadMaterialsItems(type, getMaterialNameFromMenu(type) || '');
  }

  function openMaterialItemEdit(itemId) {
    const type = materialsItemsState.type || readMaterialsItemsParamsFromHash().type || '';
    if (!type) return;
    const hash = `#material-item-edit?type=${encodeURIComponent(type)}&id=${encodeURIComponent(String(itemId || 0))}`;
    if (window.location.hash !== hash) window.location.hash = hash;

    document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById('material-item-edit');
    if (page) {
      page.classList.add('active');
      loadMaterialItemEdit(type, itemId || 0);
    }
  }

  async function loadMaterialItemEdit(typeKey, itemId) {
    try {
      const id = Number(itemId) || 0;
      const controller = typeKey || '';
      if (!controller) return;

      const hashParams = new URLSearchParams((window.location.hash || '').split('?')[1] || '');
      const backPage = (hashParams.get('back') || '').toString().trim();
      const backName = (hashParams.get('backName') || '').toString().trim();
      const successUrlInput = document.getElementById('material_item_form_success_url');
      if (successUrlInput) successUrlInput.value = backPage ? `#${backPage}` : (successUrlInput.value || '#materials-items');

      const submitUrlInput = document.getElementById('material_item_form_submit_url');
      const controllerInput = document.getElementById('material_item_controller_name');
      const idInput = document.getElementById('material_item_id');
      const title = document.getElementById('material-item-edit-title');
      const typeNameInput = document.getElementById('material_item_type_name');

      if (controllerInput) controllerInput.value = controller;
      if (idInput) idInput.value = String(id);
      if (typeNameInput) typeNameInput.value = backName || getMaterialNameFromMenu(controller) || controller;
      if (title) title.textContent = id ? 'Редактировать материал' : 'Добавить материал';

      let item = null;
      if (id !== 0 && materialsItemsState.type === controller && Array.isArray(materialsItemsState.allData)) {
        item = materialsItemsState.allData.find(it => Number(it?.id) === id) || null;
      }
      if (!item && id !== 0) {
        const resp = await fetch(`/api/catalog/item/${encodeURIComponent(controller)}/${encodeURIComponent(String(id))}?t=${Date.now()}`, { cache: 'no-cache' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        item = await resp.json();
      }
      if (!item) {
        item = { id: 0, name: '', article: '', category: '', order: 10000, active: 1, icon: '', description: '' };
      }

      document.getElementById('material-item-name').value = item?.name || '';
      document.getElementById('material-item-article').value = getMatItemArticle(item) || '';
      document.getElementById('material-item-category').value = getMatItemCategory(item) || '';
      document.getElementById('material-item-order').value = String(item?.order ?? 10000);
      document.getElementById('material-item-active').checked = (item?.active ?? 1) == 1 || item?.active === true;
      document.getElementById('material-item-icon').value = (item?.icon || '').toString();
      document.getElementById('material-item-description').value = (item?.description || '').toString();

      const displayModeEl = document.getElementById('material-display-mode');
      if (displayModeEl) displayModeEl.value = item?.displayMode || 'custom';
      const color = (item?.color || '#ffffff').toString();
      const colorInput = document.getElementById('material-color');
      const colorHexInput = document.getElementById('material-color-hex');
      if (colorInput) colorInput.value = color;
      if (colorHexInput) colorHexInput.value = color;
      const roughnessInput = document.getElementById('material-roughness');
      if (roughnessInput) roughnessInput.value = String(item?.roughness ?? 0.8);
      const metalnessInput = document.getElementById('material-metalness');
      if (metalnessInput) metalnessInput.value = String(item?.metalness ?? 0);
      const transparentInput = document.getElementById('material-transparent');
      const transparencyBlock = document.getElementById('material-transparency-block');
      const opacityInput = document.getElementById('material-opacity');
      const isTransparent = !!(item?.transparent);
      if (transparentInput) transparentInput.checked = isTransparent;
      if (transparencyBlock) transparencyBlock.style.display = isTransparent ? 'flex' : 'none';
      if (opacityInput) opacityInput.value = String(item?.opacity ?? 1);

      const textureUrl = (item?.texture || '').toString();
      const texturePreview = document.getElementById('material-texture-preview');
      const textureUrlInput = document.getElementById('material-texture-url');
      const textureFileInput = document.getElementById('material-texture-file');
      if (textureUrlInput) textureUrlInput.value = textureUrl;
      if (texturePreview) {
        if (textureUrl) {
          texturePreview.innerHTML = `<img src="${textureUrl}" style="width:100%; height:100%; object-fit:cover;"><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="material-texture-upload-icon"></i>`;
        } else {
          texturePreview.innerHTML = '<span style="color:#ccc; font-size:12px;">нет</span><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="material-texture-upload-icon"></i>';
        }
        setTimeout(function attachTextureIcon() {
          const icon = document.getElementById('material-texture-upload-icon');
          if (!icon || icon._cldFmAttached) return;
          icon._cldFmAttached = true;
          icon.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof window.openFileManager === 'function') {
              window.openFileManager({
                allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tif', '.tiff'],
                initialPath: 'files',
                onSelect: function(r) {
                  if (r && r.url && textureUrlInput) {
                    textureUrlInput.value = r.url;
                    textureUrlInput.dispatchEvent(new Event('input', { bubbles: true }));
                    if (texturePreview) {
                      texturePreview.innerHTML = '<img src="' + (r.url || '').replace(/"/g, '&quot;') + '" style="width:100%; height:100%; object-fit:cover;"><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="material-texture-upload-icon"></i>';
                      setTimeout(attachTextureIcon, 50);
                    }
                  }
                }
              });
            } else if (textureFileInput) textureFileInput.click();
          });
        }, 50);
      }
      const texW = document.getElementById('material-texture-width');
      const texH = document.getElementById('material-texture-height');
      if (texW) texW.value = String(item?.textureWidth ?? 1000);
      if (texH) texH.value = String(item?.textureHeight ?? 1000);
      const stretchW = document.getElementById('material-stretch-width');
      const stretchH = document.getElementById('material-stretch-height');
      if (stretchW) stretchW.checked = !!item?.stretchWidth;
      if (stretchH) stretchH.checked = !!item?.stretchHeight;

      const normalMapUrl = (item?.normalMap || '').toString();
      const normalMapPreview = document.getElementById('material-normal-map-preview');
      const normalMapUrlInput = document.getElementById('material-normal-map-url');
      const normalMapFileInput = document.getElementById('material-normal-map-file');
      if (normalMapUrlInput) normalMapUrlInput.value = normalMapUrl;
      if (normalMapPreview) {
        if (normalMapUrl) {
          normalMapPreview.innerHTML = `<img src="${normalMapUrl}" style="width:100%; height:100%; object-fit:cover;"><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="material-normal-map-upload-icon"></i>`;
        } else {
          normalMapPreview.innerHTML = '<span style="color:#ccc; font-size:12px;">256x256</span><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="material-normal-map-upload-icon"></i>';
        }
        setTimeout(function attachNormalMapIcon() {
          const icon = document.getElementById('material-normal-map-upload-icon');
          if (!icon || icon._cldFmAttached) return;
          icon._cldFmAttached = true;
          icon.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof window.openFileManager === 'function') {
              window.openFileManager({
                allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tif', '.tiff'],
                initialPath: 'files',
                onSelect: function(r) {
                  if (r && r.url && normalMapUrlInput) {
                    normalMapUrlInput.value = r.url;
                    normalMapUrlInput.dispatchEvent(new Event('input', { bubbles: true }));
                    if (normalMapPreview) {
                      normalMapPreview.innerHTML = '<img src="' + (r.url || '').replace(/"/g, '&quot;') + '" style="width:100%; height:100%; object-fit:cover;"><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="material-normal-map-upload-icon"></i>';
                      setTimeout(attachNormalMapIcon, 50);
                    }
                  }
                }
              });
            } else if (normalMapFileInput) normalMapFileInput.click();
          });
        }, 50);
      }

      const roughnessMapUrl = (item?.roughnessMap || '').toString();
      const roughnessMapPreview = document.getElementById('material-roughness-map-preview');
      const roughnessMapUrlInput = document.getElementById('material-roughness-map-url');
      const roughnessMapFileInput = document.getElementById('material-roughness-map-file');
      if (roughnessMapUrlInput) roughnessMapUrlInput.value = roughnessMapUrl;
      if (roughnessMapPreview) {
        if (roughnessMapUrl) {
          roughnessMapPreview.innerHTML = `<img src="${roughnessMapUrl}" style="width:100%; height:100%; object-fit:cover;"><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="material-roughness-map-upload-icon"></i>`;
        } else {
          roughnessMapPreview.innerHTML = '<span style="color:#ccc; font-size:12px;">256x256</span><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="material-roughness-map-upload-icon"></i>';
        }
        setTimeout(function attachRoughnessMapIcon() {
          const icon = document.getElementById('material-roughness-map-upload-icon');
          if (!icon || icon._cldFmAttached) return;
          icon._cldFmAttached = true;
          icon.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof window.openFileManager === 'function') {
              window.openFileManager({
                allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tif', '.tiff'],
                initialPath: 'files',
                onSelect: function(r) {
                  if (r && r.url && roughnessMapUrlInput) {
                    roughnessMapUrlInput.value = r.url;
                    roughnessMapUrlInput.dispatchEvent(new Event('input', { bubbles: true }));
                    if (roughnessMapPreview) {
                      roughnessMapPreview.innerHTML = '<img src="' + (r.url || '').replace(/"/g, '&quot;') + '" style="width:100%; height:100%; object-fit:cover;"><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="material-roughness-map-upload-icon"></i>';
                      setTimeout(attachRoughnessMapIcon, 50);
                    }
                  }
                }
              });
            } else if (roughnessMapFileInput) roughnessMapFileInput.click();
          });
        }, 50);
      }

      const realTexW = document.getElementById('material-real-texture-width');
      const realTexH = document.getElementById('material-real-texture-height');
      if (realTexW) realTexW.value = String(item?.realTextureWidth ?? item?.normal_map_width ?? 256);
      if (realTexH) realTexH.value = String(item?.realTextureHeight ?? item?.normal_map_height ?? 256);

      const oneSidedInput = document.getElementById('material-one-sided');
      if (oneSidedInput) oneSidedInput.checked = !!(item?.oneSided || item?.one_side);

      const previewW = document.getElementById('material-preview-width');
      const previewH = document.getElementById('material-preview-height');
      if (previewW) previewW.value = String(item?.previewWidth ?? 450);
      if (previewH) previewH.value = String(item?.previewHeight ?? 720);

      const thicknessInput = document.getElementById('material-thickness');
      if (thicknessInput) thicknessInput.value = String(item?.thickness ?? 16);
      const groupInput = document.getElementById('material-group');
      if (groupInput) groupInput.value = (item?.group || '');

      const iconUrl = (item?.icon || '').toString().trim();
      const prev = document.getElementById('material-item-icon-preview');
      const prevWrapper = document.getElementById('material-item-icon-preview-wrapper');
      const placeholder = document.getElementById('material-item-icon-placeholder');
      if (iconUrl && prev && prevWrapper && placeholder) {
        prev.src = iconUrl;
        prevWrapper.style.display = 'block';
        placeholder.style.display = 'none';
      } else if (prev && prevWrapper && placeholder) {
        prev.src = '';
        prevWrapper.style.display = 'none';
        placeholder.style.display = 'flex';
      }

      if (submitUrlInput) submitUrlInput.value = id ? `/api/catalog/item_edit/${controller}/${id}` : `/api/catalog/item_add/${controller}/`;

      const cancel = document.getElementById('cancel-material-item-btn');
      if (cancel) {
        const backUrl = (successUrlInput?.value || '').toString().trim() || '#materials-items';
        cancel.setAttribute('href', backUrl.startsWith('#materials-items') ? `#materials-items?type=${encodeURIComponent(controller)}` : backUrl);
      }
    } catch (e) {
      console.error('❌ Ошибка загрузки формы элемента материала:', e);
      alert('Ошибка загрузки элемента. Проверь сервер.');
    }
  }

  async function saveMaterialItem(exitAfter) {
    try {
      const controller = document.getElementById('material_item_controller_name')?.value || '';
      const id = Number(document.getElementById('material_item_id')?.value || '0') || 0;
      if (!controller) return;

      const successUrl = (document.getElementById('material_item_form_success_url')?.value || '#materials-items').toString().trim() || '#materials-items';

      const displayMode = document.getElementById('material-display-mode')?.value || 'custom';
      const color = (document.getElementById('material-color-hex')?.value || '#ffffff').toString().trim() || '#ffffff';
      const roughness = Number(document.getElementById('material-roughness')?.value || '0.8') || 0.8;
      const metalness = Number(document.getElementById('material-metalness')?.value || '0') || 0;
      const transparent = !!document.getElementById('material-transparent')?.checked;
      const opacity = Number(document.getElementById('material-opacity')?.value || '1') || 1;
      const texture = (document.getElementById('material-texture-url')?.value || '').toString().trim();
      const textureWidth = Number(document.getElementById('material-texture-width')?.value || '1000') || 1000;
      const textureHeight = Number(document.getElementById('material-texture-height')?.value || '1000') || 1000;
      const stretchWidth = !!document.getElementById('material-stretch-width')?.checked;
      const stretchHeight = !!document.getElementById('material-stretch-height')?.checked;
      const normalMap = (document.getElementById('material-normal-map-url')?.value || '').toString().trim();
      const roughnessMap = (document.getElementById('material-roughness-map-url')?.value || '').toString().trim();
      const realTextureWidth = Number(document.getElementById('material-real-texture-width')?.value || '256') || 256;
      const realTextureHeight = Number(document.getElementById('material-real-texture-height')?.value || '256') || 256;
      const oneSided = !!document.getElementById('material-one-sided')?.checked;
      const previewWidth = Number(document.getElementById('material-preview-width')?.value || '450') || 450;
      const previewHeight = Number(document.getElementById('material-preview-height')?.value || '720') || 720;
      const thickness = Number(document.getElementById('material-thickness')?.value || '16') || 16;
      const group = (document.getElementById('material-group')?.value || '').toString();
      const description = (document.getElementById('material-item-description')?.value || '').toString().trim();

      const payload = {
        id, name: (document.getElementById('material-item-name')?.value || '').toString().trim(),
        article: (document.getElementById('material-item-article')?.value || '').toString().trim(),
        category: (document.getElementById('material-item-category')?.value || '').toString().trim(),
        order: Number(document.getElementById('material-item-order')?.value || '10000') || 10000,
        active: document.getElementById('material-item-active')?.checked ? 1 : 0,
        icon: (document.getElementById('material-item-icon')?.value || '').toString().trim(),
        description, displayMode, color, roughness, metalness, transparent, opacity,
        texture, textureWidth, textureHeight, stretchWidth, stretchHeight,
        normalMap, roughnessMap, realTextureWidth, realTextureHeight,
        normal_map_width: realTextureWidth, normal_map_height: realTextureHeight,
        oneSided, one_side: oneSided, previewWidth, previewHeight, thickness, group,
      };

      if (!payload.name) { alert('Введите название'); return; }

      const url = id ? `/api/catalog/item_edit/${encodeURIComponent(controller)}/${id}` : `/api/catalog/item_add/${encodeURIComponent(controller)}/`;
      const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      const res = await resp.json();

      if (window.toastr) window.toastr.success('Сохранено');

      if (exitAfter) {
        const targetHash = successUrl.startsWith('#materials-items') ? `#materials-items?type=${encodeURIComponent(controller)}` : successUrl;
        if (window.location.hash !== targetHash) window.location.hash = targetHash;

        document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
        const basePageId = (targetHash || '').split('?')[0].replace('#', '');
        const listPage = document.getElementById(basePageId);
        if (listPage) listPage.classList.add('active');

        if (basePageId === 'materials-items') {
          materialsItemsState.type = controller;
          loadMaterialsItems(controller, getMaterialNameFromMenu(controller));
        } else if (basePageId === 'models3d-materials' && typeof window.loadModels3dMaterials === 'function') {
          window.loadModels3dMaterials();
        }
      } else {
        const newId = Number(res?.item?.id ?? res?.id ?? payload.id ?? 0) || 0;
        window.location.hash = `#material-item-edit?type=${encodeURIComponent(controller)}&id=${encodeURIComponent(String(newId))}`;
      }
    } catch (e) {
      console.error('❌ Ошибка сохранения элемента материала:', e);
      alert('Ошибка сохранения. Проверь сервер.');
    }
  }

  window.loadMaterialsItems = loadMaterialsItems;
  window.loadMaterialsItemsFromHash = loadMaterialsItemsFromHash;
  window.openMaterialItemEdit = openMaterialItemEdit;
  window.saveMaterialItem = saveMaterialItem;
  window.loadMaterialItemEdit = loadMaterialItemEdit;
  window.getMaterialNameFromMenu = getMaterialNameFromMenu;

  window.copyMaterialItem = async function(itemId) {
    try {
      const controller = materialsItemsState.type || readMaterialsItemsParamsFromHash().type || '';
      if (!controller) return;
      const resp = await fetch(`/api/catalog/item/${encodeURIComponent(controller)}/${encodeURIComponent(String(itemId))}?t=${Date.now()}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const item = await resp.json();
      const copy = { ...item, id: 0, name: `${item?.name || 'Материал'} (копия)` };
      const addResp = await fetch(`/api/catalog/item_add/${encodeURIComponent(controller)}/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(copy) });
      if (!addResp.ok) throw new Error(`HTTP ${addResp.status}`);
      if (window.toastr) window.toastr.success('Скопировано');
      await loadMaterialsItems(controller, getMaterialNameFromMenu(controller));
    } catch (e) {
      console.error('❌ Ошибка копирования:', e);
      alert('Ошибка копирования');
    }
  };

  window.deleteMaterialItem = async function(itemId, itemName) {
    try {
      const controller = materialsItemsState.type || readMaterialsItemsParamsFromHash().type || '';
      if (!controller) return;

      const doDel = async () => {
        const resp = await fetch(`/api/catalog/item_delete/${encodeURIComponent(controller)}/${encodeURIComponent(String(itemId))}`, { method: 'DELETE' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        if (window.toastr) window.toastr.success('Удалено');
        await loadMaterialsItems(controller, getMaterialNameFromMenu(controller));
      };

      if (window.Swal) {
        const r = await window.Swal.fire({
          title: 'Удалить?',
          text: itemName ? `Материал: ${itemName}` : 'Подтвердите удаление',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Удалить',
          cancelButtonText: 'Отмена'
        });
        if (r.isConfirmed) await doDel();
      } else {
        if (confirm(itemName ? `Удалить "${itemName}"?` : 'Удалить?')) await doDel();
      }
    } catch (e) {
      console.error('❌ Ошибка удаления:', e);
      alert('Ошибка удаления');
    }
  };

  window.setMaterialsItemsPerPageAndRender = (val) => {
    materialsItemsState.perPage = parseInt(val || '20', 10) || 20;
    materialsItemsState.currentPage = 1;
    renderMaterialsItemsTable();
  };

  window.setMaterialsItemsCurrentPageAndRender = () => {
    materialsItemsState.currentPage = 1;
    renderMaterialsItemsTable();
  };
})();
