/**
 * admin-edges-items.js — Список кромок в наборе (edges-items)
 * Extracted from admin-new.html for better Cursor performance
 * Depends on: window.edgesCategoriesData, window.EDGES_CATEGORIES_TYPE (from categories section)
 */
(function() {
  'use strict';

  const edgesItemsState = { type: '', name: '', allData: [], filtered: [], currentPage: 1, perPage: 20 };

  function readEdgesItemsParamsFromHash() {
    const hash = (window.location.hash || '').split('?')[1] || '';
    const p = new URLSearchParams(hash);
    return { type: p.get('type') || '', name: p.get('name') || '' };
  }

  function getEdgesNameFromMenu(typeKey) {
    const link = document.querySelector(`a[data-edges-type="${CSS.escape(typeKey || '')}"]`);
    return link ? (link.getAttribute('data-edges-name') || link.textContent || typeKey || '').trim() : (typeKey || '');
  }

  function normalizeEdgesItemsResponse(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items;
    return [];
  }

  function getEdgeItemCategory(item) {
    const c = item?.category;
    if (Array.isArray(c)) return (c[0] ?? '').toString();
    return (c ?? '').toString();
  }

  function applyEdgesItemsFilters() {
    const q = (document.getElementById('edges-items-search-input')?.value || '').toString().trim().toLowerCase();
    const cat = (document.getElementById('edges-items-category-filter')?.value || '').toString();
    const all = Array.isArray(edgesItemsState.allData) ? edgesItemsState.allData : [];
    let out = all;
    if (q) {
      out = out.filter((it) => {
        const name = (it?.name || '').toString().toLowerCase();
        const art = (it?.article || '').toString().toLowerCase();
        const id = String(it?.id ?? '');
        return name.includes(q) || art.includes(q) || id.includes(q);
      });
    }
    if (cat) out = out.filter((it) => getEdgeItemCategory(it) === cat);
    edgesItemsState.filtered = out;
    const totalPages = Math.max(1, Math.ceil(out.length / (edgesItemsState.perPage || 20)));
    if (edgesItemsState.currentPage > totalPages) edgesItemsState.currentPage = totalPages;
    if (edgesItemsState.currentPage < 1) edgesItemsState.currentPage = 1;
  }

  function renderEdgesItemsCategories() {
    const sel = document.getElementById('edges-items-category-filter');
    const editSel = document.getElementById('edge-item-category');
    const all = Array.isArray(edgesItemsState.allData) ? edgesItemsState.allData : [];
    const cats = [...new Set(all.map(it => getEdgeItemCategory(it).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));
    const opts = '<option value="">Нет</option>' + cats.map(c => `<option value="${(c || '').replace(/"/g, '&quot;')}">${c || ''}</option>`).join('');
    if (sel) sel.innerHTML = opts;
    const catsFromApi = window.edgesCategoriesData || [];
    if (editSel) {
      editSel.innerHTML = '<option value="">Нет</option>' + (catsFromApi.length ? catsFromApi.map(c => `<option value="${(c.name || '').replace(/"/g, '&quot;')}">${c.name || ''}</option>`).join('') : cats.map(c => `<option value="${(c || '').replace(/"/g, '&quot;')}">${c || ''}</option>`).join(''));
    }
  }

  function renderEdgesItemsTable() {
    const tbody = document.getElementById('edges-items-table-body');
    if (!tbody) return;
    applyEdgesItemsFilters();
    const data = edgesItemsState.filtered;
    tbody.innerHTML = '';
    if (!edgesItemsState.type) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:20px; color:#999;">Выберите набор кромок в меню слева</td></tr>';
      renderEdgesItemsPagination(0);
      return;
    }
    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:20px; color:#999;">Нет данных</td></tr>';
      renderEdgesItemsPagination(0);
      return;
    }
    const perPage = edgesItemsState.perPage || 20;
    const start = (edgesItemsState.currentPage - 1) * perPage;
    const pageData = data.slice(start, start + perPage);
    for (const item of pageData) {
      const tr = document.createElement('tr');
      const decorUrl = (item?.icon || item?.texture || item?.image || '').toString().trim();
      const colorVal = (item?.color || '').toString().trim();
      let iconHtml = '';
      if (decorUrl) {
        const src = typeof window.__cldResolveAdminMediaUrl === 'function'
          ? window.__cldResolveAdminMediaUrl(decorUrl)
          : (decorUrl.startsWith('/') ? window.location.origin + decorUrl : decorUrl);
        const safeSrc = src.replace(/"/g, '&quot;');
        iconHtml = `<img src="${safeSrc}" style="width:120px;height:70px;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb;" onerror="this.style.display='none'">`;
      } else if (colorVal && /^#([0-9A-Fa-f]{6})$/.test(colorVal)) {
        iconHtml = `<div style="width:120px;height:70px;background-color:${colorVal};border-radius:6px;border:1px solid #e5e7eb;"></div>`;
      } else {
        iconHtml = '<div style="width:70px;height:70px;border:1px solid #e5e7eb;border-radius:6px;background:#f8fafc;"></div>';
      }
      const active = (item?.active ?? 1) == 1 || item?.active === true;
      const visHtml = active
        ? '<button type="button" class="btn btn-xs btn-outline btn-success" title="Видим"><i class="fa fa-eye"></i></button>'
        : '<button type="button" class="btn btn-xs btn-outline btn-default" title="Скрыт"><i class="fa fa-eye-slash"></i></button>';
      tr.innerHTML = `
        <td><input type="checkbox" class="edges-item-checkbox" value="${item?.id ?? ''}"></td>
        <td>${item?.id ?? '-'}</td>
        <td>${iconHtml}</td>
        <td>${(item?.name || '-').replace(/</g, '&lt;')}</td>
        <td>${(item?.article || '-').replace(/</g, '&lt;')}</td>
        <td>${(getEdgeItemCategory(item) || '-').replace(/</g, '&lt;')}</td>
        <td>${String(item?.order ?? item?.sort ?? '-')}</td>
        <td>${visHtml}</td>
        <td class="col-actions" style="width:194px; white-space:nowrap;">
          <div style="display:flex; gap:8px; justify-content:center;">
            <button type="button" class="btn btn-xs btn-outline btn-primary" title="Редактировать" data-edge-action="edit" data-edge-id="${item?.id ?? 0}" data-edge-name="${(item?.name || '').replace(/"/g, '&quot;')}"><i class="fa fa-pencil"></i></button>
            <button type="button" class="btn btn-xs btn-outline btn-info" title="Копировать" data-edge-action="copy" data-edge-id="${item?.id ?? 0}" data-edge-name="${(item?.name || '').replace(/"/g, '&quot;')}"><i class="fa fa-copy"></i></button>
            <button type="button" class="btn btn-xs btn-outline btn-danger" title="Удалить" data-edge-action="delete" data-edge-id="${item?.id ?? 0}" data-edge-name="${(item?.name || '').replace(/"/g, '&quot;')}"><i class="fa fa-trash"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    }
    renderEdgesItemsPagination(data.length);
  }

  function renderEdgesItemsPagination(totalItems) {
    const top = document.getElementById('edges-items-pagination-top');
    const bottom = document.getElementById('edges-items-pagination-bottom');
    const fromEl = document.getElementById('edges-items-from');
    const toEl = document.getElementById('edges-items-to');
    const totalEl = document.getElementById('edges-items-total');
    if (!top || !bottom) return;
    const perPage = edgesItemsState.perPage || 20;
    const currentPage = edgesItemsState.currentPage || 1;
    const totalPages = Math.max(1, Math.ceil((totalItems || 0) / perPage));
    const start = totalItems ? (currentPage - 1) * perPage + 1 : 0;
    const end = totalItems ? Math.min(currentPage * perPage, totalItems) : 0;
    if (fromEl) fromEl.textContent = String(start);
    if (toEl) toEl.textContent = String(end);
    if (totalEl) totalEl.textContent = String(totalItems || 0);
    const mkPag = (host) => {
      let html = '';
      html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="1">&lt;&lt;</a></li>`;
      html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage - 1}">&lt;</a></li>`;
      for (let p = Math.max(1, currentPage - 2); p <= Math.min(totalPages, currentPage + 2); p++) {
        html += `<li class="page-item ${p === currentPage ? 'active' : ''}"><a class="page-link" href="#" data-page="${p}">${p}</a></li>`;
      }
      html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage + 1}">&gt;</a></li>`;
      html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${totalPages}">&gt;&gt;</a></li>`;
      host.innerHTML = html;
      host.querySelectorAll('a.page-link').forEach(a => {
        a.addEventListener('click', e => { e.preventDefault(); const p = parseInt(a.getAttribute('data-page') || '0'); if (p >= 1 && p <= totalPages) { edgesItemsState.currentPage = p; renderEdgesItemsTable(); } });
      });
    };
    mkPag(top);
    mkPag(bottom);
  }

  async function loadEdgesItems(typeKey, name) {
    const tbody = document.getElementById('edges-items-table-body');
    if (!tbody) return;
    edgesItemsState.type = typeKey || '';
    edgesItemsState.name = name || getEdgesNameFromMenu(typeKey) || typeKey || 'Кромки';
    const title = document.getElementById('edges-items-title');
    const subtitle = document.getElementById('edges-items-subtitle');
    if (title) title.textContent = edgesItemsState.name;
    if (subtitle) subtitle.textContent = edgesItemsState.name;
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:20px;">Загрузка...</td></tr>';
    if (!typeKey) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:20px; color:#999;">Выберите набор кромок в меню слева</td></tr>';
      return;
    }
    try {
      const resp = await fetch(`/api/catalog/items_get/${encodeURIComponent(typeKey)}?t=${Date.now()}`, { cache: 'no-cache' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const items = normalizeEdgesItemsResponse(data);
      edgesItemsState.allData = items;
      edgesItemsState.currentPage = 1;
      renderEdgesItemsCategories();
      renderEdgesItemsTable();
    } catch (e) {
      console.error('❌ Ошибка загрузки кромок:', e);
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:20px; color:#c00;">Ошибка загрузки</td></tr>';
      renderEdgesItemsPagination(0);
    }
  }

  function loadEdgesItemsFromHash() {
    const { type, name } = readEdgesItemsParamsFromHash();
    if (!type) return;
    loadEdgesItems(type, name || getEdgesNameFromMenu(type));
  }

  window.loadEdgesItemsFromHash = loadEdgesItemsFromHash;

  window.deleteEdgeItem = function(itemId, itemName) {
    if (!confirm(`Удалить кромку "${itemName}"?`)) return;
    const type = edgesItemsState.type || readEdgesItemsParamsFromHash().type;
    if (!type) return;
    fetch(`/api/catalog/item_delete/${encodeURIComponent(type)}/${itemId}`, { method: 'DELETE' })
      .then(res => res.ok ? res.json() : Promise.reject(new Error(res.statusText)))
      .then(() => { if (typeof toastr !== 'undefined') toastr.success('Удалено'); loadEdgesItems(type, edgesItemsState.name); })
      .catch(e => { console.error('❌ Ошибка удаления:', e); alert('Ошибка: ' + e.message); });
  };

  window.copyEdgeItem = async function(itemId) {
    try {
      const type = edgesItemsState.type || readEdgesItemsParamsFromHash().type;
      if (!type) return;
      const resp = await fetch(`/api/catalog/item/${encodeURIComponent(type)}/${itemId}?t=${Date.now()}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const item = await resp.json();
      const copy = { ...item, id: 0, name: `${item?.name || 'Кромка'} (копия)` };
      const addResp = await fetch(`/api/catalog/item_add/${encodeURIComponent(type)}/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(copy) });
      if (!addResp.ok) throw new Error(`HTTP ${addResp.status}`);
      if (typeof toastr !== 'undefined') toastr.success('Скопировано');
      loadEdgesItems(type, edgesItemsState.name || getEdgesNameFromMenu(type));
    } catch (e) {
      console.error('❌ Ошибка копирования:', e);
      alert('Ошибка копирования');
    }
  };

  function openEdgeItemEdit(itemId) {
    const params = readEdgesItemsParamsFromHash();
    const type = edgesItemsState.type || params.type;
    const name = edgesItemsState.name || params.name || getEdgesNameFromMenu(type);
    if (!type) return;
    edgesItemsState.type = type;
    edgesItemsState.name = name;
    const hash = `#edge-item-edit?type=${encodeURIComponent(type)}&id=${itemId || 0}&name=${encodeURIComponent(name || '')}`;
    if (window.location.hash !== hash) window.location.hash = hash;
    document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById('edge-item-edit');
    if (page) { page.classList.add('active'); loadEdgeItemEdit(type, itemId || 0); }
  }

  async function loadEdgeItemEdit(typeKey, itemId) {
    try {
      const id = Number(itemId) || 0;
      if (!typeKey) return;
      document.getElementById('edge_item_controller_name').value = typeKey;
      document.getElementById('edge_item_id').value = String(id);
      const title = document.getElementById('edge-item-edit-title');
      const typeName = document.getElementById('edge_item_type_name');
      const name = edgesItemsState.name || getEdgesNameFromMenu(typeKey) || typeKey;
      if (typeName) typeName.value = name;
      if (title) title.innerHTML = id ? `Редактировать кромку <span>${name}</span>` : `Добавить кромку <span>${name}</span>`;
      const catsType = window.EDGES_CATEGORIES_TYPE || 'butts_keys';
      if (!window.edgesCategoriesData || window.edgesCategoriesData.length === 0) {
        try {
          const r = await fetch(`/api/catalog/categories_get/${catsType}`);
          const d = await r.json();
          window.edgesCategoriesData = Array.isArray(d) ? d : [];
        } catch (_) {}
      }
      let item = null;
      if (id && Array.isArray(edgesItemsState.allData)) item = edgesItemsState.allData.find(it => Number(it?.id) === id) || null;
      if (!item && id) {
        const resp = await fetch(`/api/catalog/item/${encodeURIComponent(typeKey)}/${id}?t=${Date.now()}`, { cache: 'no-cache' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        item = await resp.json();
      }
      if (!item) item = { id: 0, name: '', article: '', thickness: '', width: '', color: '', category: '', order: 10000, active: 1, icon: '', description: '', displayMode: 'custom', roughness: 0.8, metalness: 0, transparent: false, opacity: 1, texture: '', normalMap: '', roughnessMap: '', stretchWidth: false, stretchHeight: false, realTextureWidth: 256, realTextureHeight: 256, oneSided: false, previewWidth: 450, previewHeight: 720, edge_variants: [] };
      document.getElementById('edge-item-name').value = item?.name || '';
      document.getElementById('edge-item-article').value = item?.article || '';
      document.getElementById('edge-item-thickness').value = (item?.thickness ?? '').toString();
      document.getElementById('edge-item-width').value = (item?.width ?? '').toString();
      const colorVal = (item?.color ?? '#ffffff').toString().trim() || '#ffffff';
      document.getElementById('edge-item-color').value = colorVal;
      const colorPicker = document.getElementById('edge-item-color-picker');
      if (colorPicker) {
        const hex = /^#([0-9A-Fa-f]{6})$/.exec(colorVal);
        colorPicker.value = hex ? colorVal : '#ffffff';
      }
      const descEl = document.getElementById('edge-item-description');
      if (descEl) descEl.value = (item?.description ?? '').toString();
      document.getElementById('edge-item-order').value = String(item?.order ?? 10000);
      document.getElementById('edge-item-active').checked = (item?.active ?? 1) == 1 || item?.active === true;

      const displayModeEl = document.getElementById('edge-display-mode');
      if (displayModeEl) displayModeEl.value = (item?.displayMode || 'custom').toString();
      const roughnessEl = document.getElementById('edge-roughness');
      if (roughnessEl) roughnessEl.value = String(item?.roughness ?? 0.8);
      const metalnessEl = document.getElementById('edge-metalness');
      if (metalnessEl) metalnessEl.value = String(item?.metalness ?? 0);
      const transparentEl = document.getElementById('edge-transparent');
      const transparencyBlock = document.getElementById('edge-transparency-block');
      if (transparentEl) {
        transparentEl.checked = !!(item?.transparent || item?.transparency);
        if (transparencyBlock) transparencyBlock.style.display = transparentEl.checked ? 'flex' : 'none';
      }
      const opacityEl = document.getElementById('edge-opacity');
      if (opacityEl) opacityEl.value = String(item?.opacity ?? 1);

      const textureUrl = (item?.texture || '').toString();
      const texturePreview = document.getElementById('edge-texture-preview');
      const textureUrlInput = document.getElementById('edge-texture-url');
      if (textureUrlInput) textureUrlInput.value = textureUrl;
      if (texturePreview) {
        if (textureUrl) {
          texturePreview.innerHTML = `<img src="${textureUrl}" style="width:100%; height:100%; object-fit:cover;"><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="edge-texture-upload-icon"></i>`;
        } else {
          texturePreview.innerHTML = '<span style="color:#ccc; font-size:12px;">нет</span><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="edge-texture-upload-icon"></i>';
        }
        setTimeout(function attachEdgeTextureIcon() {
          const icon = document.getElementById('edge-texture-upload-icon');
          const fileInput = document.getElementById('edge-texture-file');
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
                      texturePreview.innerHTML = '<img src="' + (r.url || '').replace(/"/g, '&quot;') + '" style="width:100%; height:100%; object-fit:cover;"><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="edge-texture-upload-icon"></i>';
                      setTimeout(attachEdgeTextureIcon, 50);
                    }
                  }
                }
              });
            } else if (fileInput) fileInput.click();
          });
        }, 50);
      }

      const normalMapUrl = (item?.normalMap || '').toString();
      const normalMapPreview = document.getElementById('edge-normal-map-preview');
      const normalMapUrlInput = document.getElementById('edge-normal-map-url');
      if (normalMapUrlInput) normalMapUrlInput.value = normalMapUrl;
      if (normalMapPreview) {
        if (normalMapUrl) {
          normalMapPreview.innerHTML = `<img src="${normalMapUrl}" style="width:100%; height:100%; object-fit:cover;"><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="edge-normal-map-upload-icon"></i>`;
        } else {
          normalMapPreview.innerHTML = '<span style="color:#ccc; font-size:12px;">256x256</span><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="edge-normal-map-upload-icon"></i>';
        }
        setTimeout(function attachEdgeNormalMapIcon() {
          const icon = document.getElementById('edge-normal-map-upload-icon');
          const fileInput = document.getElementById('edge-normal-map-file');
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
                      normalMapPreview.innerHTML = '<img src="' + (r.url || '').replace(/"/g, '&quot;') + '" style="width:100%; height:100%; object-fit:cover;"><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="edge-normal-map-upload-icon"></i>';
                      setTimeout(attachEdgeNormalMapIcon, 50);
                    }
                  }
                }
              });
            } else if (fileInput) fileInput.click();
          });
        }, 50);
      }

      const roughnessMapUrl = (item?.roughnessMap || '').toString();
      const roughnessMapPreview = document.getElementById('edge-roughness-map-preview');
      const roughnessMapUrlInput = document.getElementById('edge-roughness-map-url');
      if (roughnessMapUrlInput) roughnessMapUrlInput.value = roughnessMapUrl;
      if (roughnessMapPreview) {
        if (roughnessMapUrl) {
          roughnessMapPreview.innerHTML = `<img src="${roughnessMapUrl}" style="width:100%; height:100%; object-fit:cover;"><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="edge-roughness-map-upload-icon"></i>`;
        } else {
          roughnessMapPreview.innerHTML = '<span style="color:#ccc; font-size:12px;">256x256</span><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="edge-roughness-map-upload-icon"></i>';
        }
        setTimeout(function attachEdgeRoughnessMapIcon() {
          const icon = document.getElementById('edge-roughness-map-upload-icon');
          const fileInput = document.getElementById('edge-roughness-map-file');
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
                      roughnessMapPreview.innerHTML = '<img src="' + (r.url || '').replace(/"/g, '&quot;') + '" style="width:100%; height:100%; object-fit:cover;"><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="edge-roughness-map-upload-icon"></i>';
                      setTimeout(attachEdgeRoughnessMapIcon, 50);
                    }
                  }
                }
              });
            } else if (fileInput) fileInput.click();
          });
        }, 50);
      }

      const stretchW = document.getElementById('edge-stretch-width');
      const stretchH = document.getElementById('edge-stretch-height');
      if (stretchW) stretchW.checked = !!(item?.stretchWidth || item?.stretch_width);
      if (stretchH) stretchH.checked = !!(item?.stretchHeight || item?.stretch_height);

      const realTexW = document.getElementById('edge-real-texture-width');
      const realTexH = document.getElementById('edge-real-texture-height');
      if (realTexW) realTexW.value = String(item?.realTextureWidth ?? item?.normal_map_width ?? 256);
      if (realTexH) realTexH.value = String(item?.realTextureHeight ?? item?.normal_map_height ?? 256);

      const oneSidedInput = document.getElementById('edge-one-sided');
      if (oneSidedInput) oneSidedInput.checked = !!(item?.oneSided || item?.one_side);

      const previewW = document.getElementById('edge-preview-width');
      const previewH = document.getElementById('edge-preview-height');
      if (previewW) previewW.value = String(item?.previewWidth ?? 450);
      if (previewH) previewH.value = String(item?.previewHeight ?? 720);
      const catVal = getEdgeItemCategory(item) || (Array.isArray(item?.category) ? (item.category[0] || '') : (item?.category || ''));
      const catSel = document.getElementById('edge-item-category');
      const catsFromApi = window.edgesCategoriesData || [];
      if (catSel) {
        catSel.innerHTML = '<option value="">Нет</option>' + catsFromApi.map(c => `<option value="${(c.name || '').replace(/"/g, '&quot;')}">${c.name || ''}</option>`).join('');
        catSel.value = catVal;
        if (catVal && !catSel.querySelector(`option[value="${(catVal || '').replace(/"/g, '&quot;')}"]`)) {
          const o = document.createElement('option');
          o.value = catVal;
          o.textContent = catVal;
          catSel.appendChild(o);
          catSel.value = catVal;
        }
      }
      const iconUrl = (item?.icon || '').toString();
      document.getElementById('edge-item-icon').value = iconUrl;
      const prevWrap = document.getElementById('edge-item-icon-preview-wrapper');
      const prevImg = document.getElementById('edge-item-icon-preview');
      const placeholder = document.getElementById('edge-item-icon-placeholder');
      if (prevWrap && prevImg && placeholder) {
        if (iconUrl) { prevWrap.style.display = 'block'; placeholder.style.display = 'none'; prevImg.src = (iconUrl.startsWith('/') ? (window.glob?.acc_url || '/') : '') + iconUrl; }
        else { prevWrap.style.display = 'none'; placeholder.style.display = 'flex'; }
      }

      // --- Варианты кромки (цены/размеры) ---
      try {
        const hidden = document.getElementById('edge-variants-hidden');
        if (hidden) {
          const variants = Array.isArray(item?.edge_variants)
            ? item.edge_variants
            : Array.isArray(item?.variants)
            ? item.variants
            : [];
          hidden.value = JSON.stringify(variants || []);
          // отрисовать бейджи вариантов при открытии формы
          renderEdgeVariants();
        }
        // Первым вариантом заполняем инпуты, чтобы форма вела себя как у ЛДСП
        const v0 = (item && Array.isArray(item.edge_variants) && item.edge_variants.length)
          ? item.edge_variants[0]
          : (Array.isArray(item?.variants) && item.variants.length ? item.variants[0] : null);
        const nameEl = document.getElementById('edge-variant-name');
        const artEl = document.getElementById('edge-variant-article');
        const lenEl = document.getElementById('edge-variant-length');
        const widEl = document.getElementById('edge-variant-width');
        const thEl  = document.getElementById('edge-variant-thickness');
        const calcEl = document.getElementById('edge-calculation-type');
        const priceTypeEl = document.getElementById('edge-price-input-type');
        const priceEl = document.getElementById('edge-price-per-mp');
        if (v0) {
          if (nameEl) nameEl.value = (v0.name || '').toString();
          if (artEl) artEl.value = (v0.article || '').toString();
          if (lenEl && v0.length != null) lenEl.value = String(v0.length);
          if (widEl && v0.width != null) widEl.value = String(v0.width);
          if (thEl && v0.thickness != null) thEl.value = String(v0.thickness);
          if (calcEl && v0.calc_type) calcEl.value = v0.calc_type;
          if (priceTypeEl && v0.price_input_type) priceTypeEl.value = v0.price_input_type;
          if (priceEl && v0.price != null) priceEl.value = String(v0.price);
        } else if (priceEl) {
          priceEl.value = '';
        }
      } catch (e) {}

      try {
        document.dispatchEvent(new CustomEvent('cld-edge-item-edit-loaded', { detail: { item } }));
      } catch (_) {}
      if (typeof window.__cldUpdateEdgeDecorPreview === 'function') {
        setTimeout(window.__cldUpdateEdgeDecorPreview, 0);
        setTimeout(window.__cldUpdateEdgeDecorPreview, 400);
      }
    } catch (e) {
      console.error('❌ Ошибка загрузки кромки:', e);
      alert('Ошибка загрузки: ' + e.message);
    }
  }

  // --- Варианты кромки: helpers (UI / hidden поле) ---
  function getEdgeVariants() {
    const hidden = document.getElementById('edge-variants-hidden');
    if (!hidden || !hidden.value) return [];
    try { return JSON.parse(hidden.value); } catch (e) { return []; }
  }
  function setEdgeVariants(arr) {
    const hidden = document.getElementById('edge-variants-hidden');
    if (!hidden) return;
    hidden.value = JSON.stringify(Array.isArray(arr) ? arr : []);
    renderEdgeVariants();
  }
  function renderEdgeVariants() {
    const list = document.getElementById('edge-variants-list');
    if (!list) return;
    const variants = getEdgeVariants();
    list.innerHTML = '';
    if (!variants.length) return;
    variants.forEach((v, idx) => {
      const row = document.createElement('span');
      row.className = 'badge badge-light d-inline-flex align-items-center';
      row.style.cssText = 'padding:6px 10px; font-size:12px; margin:0 8px 8px 0;';
      const title = (v.name || '').toString() || ('Вариант ' + (idx + 1));
      const article = v.article ? ' (' + v.article + ')' : '';
      const unit = v.calc_type === 'per_m2' ? 'м²' : 'п.м';
      const price = (v.price != null && v.price !== '') ? ' — ' + v.price + ' ₽/' + unit : '';
      row.innerHTML = title + article + price + ' <button type="button" class="btn btn-link btn-sm p-0 ml-1" data-remove-edge-variant-idx="' + idx + '" style="color:#dc3545; font-size:14px;">&times;</button>';
      list.appendChild(row);
    });
  }

  // Удаление варианта
  document.addEventListener('click', function(e) {
    const rm = e.target && e.target.getAttribute && e.target.getAttribute('data-remove-edge-variant-idx');
    if (rm == null) return;
    if (!e.target.closest || !e.target.closest('#edge-variants-list')) return;
    const idx = parseInt(rm, 10);
    const arr = getEdgeVariants();
    if (idx >= 0 && idx < arr.length) {
      arr.splice(idx, 1);
      setEdgeVariants(arr);
    }
  });

  // Добавление варианта
  document.addEventListener('click', function(e) {
    if (!e.target) return;
    if (!(e.target.id === 'edge-variant-add-btn' || (e.target.closest && e.target.closest('#edge-variant-add-btn')))) return;
    e.preventDefault();
    const nameEl = document.getElementById('edge-variant-name');
    const artEl = document.getElementById('edge-variant-article');
    const lenEl = document.getElementById('edge-variant-length');
    const widEl = document.getElementById('edge-variant-width');
    const thEl  = document.getElementById('edge-variant-thickness');
    const calcEl = document.getElementById('edge-calculation-type');
    const priceTypeEl = document.getElementById('edge-price-input-type');
    const priceEl = document.getElementById('edge-price-per-mp');
    const v = {
      name: (nameEl && nameEl.value) ? nameEl.value.trim() : '',
      article: (artEl && artEl.value) ? artEl.value.trim() : '',
      length: lenEl && lenEl.value ? Number(lenEl.value) : null,
      width: widEl && widEl.value ? Number(widEl.value) : null,
      thickness: thEl && thEl.value ? Number(thEl.value) : null,
      calc_type: (calcEl && calcEl.value) ? calcEl.value : 'per_mp',
      price_input_type: (priceTypeEl && priceTypeEl.value) ? priceTypeEl.value : 'manual',
      price: priceEl && priceEl.value ? Number(priceEl.value) : null
    };
    if (!v.name) {
      const basicName = document.getElementById('edge-item-name');
      if (basicName && basicName.value) v.name = basicName.value.trim();
    }
    if (!v.article) {
      const basicArt = document.getElementById('edge-item-article');
      if (basicArt && basicArt.value) v.article = basicArt.value.trim();
    }
    if (!v.name && !v.article && typeof toastr !== 'undefined') {
      toastr.warning('Заполните хотя бы название или артикул варианта');
      return;
    }
    const arr = getEdgeVariants();
    arr.push(v);
    setEdgeVariants(arr);
  });

  // При открытии вкладки "Параметры" копируем название/артикул из основных полей, как у материалов
  function syncEdgeVariantFromBasic() {
    const nameBasic = document.getElementById('edge-item-name');
    const artBasic = document.getElementById('edge-item-article');
    const nameVar = document.getElementById('edge-variant-name');
    const artVar = document.getElementById('edge-variant-article');
    if (nameBasic && nameVar && !nameVar.value) nameVar.value = nameBasic.value || '';
    if (artBasic && artVar && !artVar.value) artVar.value = artBasic.value || '';
  }
  document.addEventListener('click', function(e) {
    if (e.target && (e.target.getAttribute && e.target.getAttribute('href') === '#edge-item-tab-params' ||
      (e.target.closest && e.target.closest('[href="#edge-item-tab-params"]')))) {
      setTimeout(syncEdgeVariantFromBasic, 0);
    }
  });

  async function saveEdgeItem(exitAfter) {
    const typeKey = document.getElementById('edge_item_controller_name')?.value || '';
    const id = parseInt(document.getElementById('edge_item_id')?.value || '0', 10);
    if (!typeKey) { alert('Тип не указан'); return; }

    const displayMode = document.getElementById('edge-display-mode')?.value || 'custom';
    const color = (document.getElementById('edge-item-color')?.value || '#ffffff').toString().trim() || '#ffffff';
    const roughness = Number(document.getElementById('edge-roughness')?.value || '0.8') || 0.8;
    const metalness = Number(document.getElementById('edge-metalness')?.value || '0') || 0;
    const transparent = !!document.getElementById('edge-transparent')?.checked;
    const opacity = Number(document.getElementById('edge-opacity')?.value || '1') || 1;
    const texture = (document.getElementById('edge-texture-url')?.value || '').toString().trim();
    const normalMap = (document.getElementById('edge-normal-map-url')?.value || '').toString().trim();
    const roughnessMap = (document.getElementById('edge-roughness-map-url')?.value || '').toString().trim();
    const stretchWidth = !!document.getElementById('edge-stretch-width')?.checked;
    const stretchHeight = !!document.getElementById('edge-stretch-height')?.checked;
    const realTextureWidth = Number(document.getElementById('edge-real-texture-width')?.value || '256') || 256;
    const realTextureHeight = Number(document.getElementById('edge-real-texture-height')?.value || '256') || 256;
    const oneSided = !!document.getElementById('edge-one-sided')?.checked;
    const previewWidth = Number(document.getElementById('edge-preview-width')?.value || '450') || 450;
    const previewHeight = Number(document.getElementById('edge-preview-height')?.value || '720') || 720;

    const payload = {
      name: (document.getElementById('edge-item-name')?.value || '').trim(),
      article: (document.getElementById('edge-item-article')?.value || '').trim(),
      thickness: (document.getElementById('edge-item-thickness')?.value || '').trim(),
      width: (document.getElementById('edge-item-width')?.value || '').trim(),
      color,
      category: (document.getElementById('edge-item-category')?.value || '').trim(),
      order: parseInt(document.getElementById('edge-item-order')?.value || '10000', 10),
      active: document.getElementById('edge-item-active')?.checked ? 1 : 0,
      icon: (document.getElementById('edge-item-icon')?.value || '').trim(),
      description: (document.getElementById('edge-item-description')?.value || '').trim(),
      displayMode,
      roughness,
      metalness,
      transparent,
      opacity,
      texture,
      normalMap,
      roughnessMap,
      stretchWidth,
      stretchHeight,
      realTextureWidth,
      realTextureHeight,
      normal_map_width: realTextureWidth,
      normal_map_height: realTextureHeight,
      oneSided,
      one_side: oneSided,
      previewWidth,
      previewHeight
    };

    // Варианты кромки (цены/размеры) — по аналогии с материалами
    let edge_variants = [];
    try {
      const raw = (document.getElementById('edge-variants-hidden')?.value || '[]').toString();
      const parsed = JSON.parse(raw);
      edge_variants = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      edge_variants = [];
    }
    if (!edge_variants || edge_variants.length === 0) {
      try {
        const nameEl = document.getElementById('edge-variant-name');
        const artEl = document.getElementById('edge-variant-article');
        const lenEl = document.getElementById('edge-variant-length');
        const widEl = document.getElementById('edge-variant-width');
        const thEl  = document.getElementById('edge-variant-thickness');
        const calcEl = document.getElementById('edge-calculation-type');
        const priceTypeEl = document.getElementById('edge-price-input-type');
        const priceEl = document.getElementById('edge-price-per-mp');
        const priceVal = priceEl && priceEl.value !== '' ? Number(priceEl.value) : null;
        if (priceVal != null && isFinite(priceVal)) {
          const v = {
            name: (nameEl && nameEl.value) ? nameEl.value.trim() : (document.getElementById('edge-item-name')?.value || '').toString().trim(),
            article: (artEl && artEl.value) ? artEl.value.trim() : (document.getElementById('edge-item-article')?.value || '').toString().trim(),
            length: lenEl && lenEl.value !== '' ? Number(lenEl.value) : null,
            width: widEl && widEl.value !== '' ? Number(widEl.value) : null,
            thickness: thEl && thEl.value !== '' ? Number(thEl.value) : null,
            calc_type: (calcEl && calcEl.value) ? calcEl.value : 'per_mp',
            price_input_type: (priceTypeEl && priceTypeEl.value) ? priceTypeEl.value : 'manual',
            price: priceVal
          };
          edge_variants = [v];
        }
      } catch (e) {}
    }
    payload.edge_variants = edge_variants;
    // Дублируем в generic поле variants, чтобы бэкенд и старый код могли его читать
    payload.variants = edge_variants;
    if (!payload.name) { alert('Введите название'); return; }
    const url = id ? `/api/catalog/item_edit/${encodeURIComponent(typeKey)}/${id}` : `/api/catalog/item_add/${encodeURIComponent(typeKey)}/`;
    const method = 'POST';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || res.statusText);
      if (data.result === 'success' || data.item) {
        if (typeof toastr !== 'undefined') toastr.success('Сохранено');
        if (exitAfter) {
          window.location.hash = `#edges-items?type=${encodeURIComponent(typeKey)}&name=${encodeURIComponent(edgesItemsState.name || '')}`;
          document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
          const page = document.getElementById('edges-items');
          if (page) page.classList.add('active');
          loadEdgesItems(typeKey, edgesItemsState.name);
        } else {
          loadEdgeItemEdit(typeKey, data.item?.id ?? id);
        }
      } else throw new Error(JSON.stringify(data));
    } catch (e) {
      console.error('❌ Ошибка сохранения кромки:', e);
      alert('Ошибка сохранения: ' + e.message);
    }
  }

  window.openEdgeItemEdit = openEdgeItemEdit;
  window.saveEdgeItem = saveEdgeItem;
  window.loadEdgesItems = loadEdgesItems;
  window.loadEdgeItemEdit = loadEdgeItemEdit;
  window.getEdgesNameFromMenu = getEdgesNameFromMenu;
  window.getEdgesItemsParams = () => ({
    type: edgesItemsState.type || readEdgesItemsParamsFromHash().type,
    name: edgesItemsState.name || readEdgesItemsParamsFromHash().name
  });
  window.setEdgesItemsPerPageAndRender = (val) => {
    edgesItemsState.perPage = val || 20;
    edgesItemsState.currentPage = 1;
    renderEdgesItemsTable();
  };
})();
