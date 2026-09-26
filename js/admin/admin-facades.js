/**
 * admin-facades.js — Список фасадов (Модели фрезеровок)
 * Скопировано из резервной копии проекта (референс от 04.02.26).
 */
(function() {
  'use strict';

  const facadesState = { allData: [], filtered: [], currentPage: 1, perPage: 20 };
  const facadePickerCache = {
    loadedAt: 0,
    items: [],
  };

  function normalizeFacadesResponse(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  }

  function getFacadeCategory(item) {
    const c = item?.category;
    if (Array.isArray(c)) return (c[0] ?? '').toString();
    return (c ?? item?.category_name ?? '').toString();
  }

  function applyFacadesFilters() {
    const q = (document.getElementById('facades-items-search-input')?.value || '').toString().trim().toLowerCase();
    const cat = (document.getElementById('facades-items-category-filter')?.value || '').toString();
    const all = Array.isArray(facadesState.allData) ? facadesState.allData : [];
    let out = all;
    if (q) {
      out = out.filter((it) => {
        const name = (it?.name || '').toString().toLowerCase();
        const art = (it?.article || it?.code || '').toString().toLowerCase();
        const id = String(it?.id ?? '');
        return name.includes(q) || art.includes(q) || id.includes(q);
      });
    }
    if (cat) out = out.filter((it) => getFacadeCategory(it) === cat);
    facadesState.filtered = out;
    const totalPages = Math.max(1, Math.ceil(out.length / (facadesState.perPage || 20)));
    if (facadesState.currentPage > totalPages) facadesState.currentPage = totalPages;
    if (facadesState.currentPage < 1) facadesState.currentPage = 1;
  }

  function renderFacadesCategories() {
    const sel = document.getElementById('facades-items-category-filter');
    const all = Array.isArray(facadesState.allData) ? facadesState.allData : [];
    const cats = [...new Set(all.map(it => getFacadeCategory(it).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));
    const opts = '<option value="">Все категории</option>' + cats.map(c => `<option value="${(c || '').replace(/"/g, '&quot;')}">${c || ''}</option>`).join('');
    if (sel) sel.innerHTML = opts;
  }

  function renderFacadesTable() {
    const tbody = document.getElementById('facades-items-table-body');
    if (!tbody) return;
    applyFacadesFilters();
    const data = facadesState.filtered;
    tbody.innerHTML = '';
    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:#999;">Нет данных</td></tr>';
      renderFacadesPagination(0);
      return;
    }
    const perPage = facadesState.perPage || 20;
    const start = (facadesState.currentPage - 1) * perPage;
    const pageData = data.slice(start, start + perPage);
    const accUrl = (window.glob?.acc_url || '/').replace(/\/$/, '');
    for (const item of pageData) {
      const tr = document.createElement('tr');
      const iconUrl = (item?.icon || '').toString();
      const colorVal = (item?.color || '').toString().trim();
      let iconHtml = '';
      if (iconUrl) {
        iconHtml = `<img src="${accUrl}${iconUrl.startsWith('/') ? '' : '/'}${iconUrl}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;border:1px solid #e5e7eb;" onerror="this.style.display='none'">`;
      } else if (colorVal && /^#([0-9A-Fa-f]{6})$/.test(colorVal)) {
        iconHtml = `<div style="width:60px;height:60px;background-color:${colorVal};border-radius:4px;border:1px solid #e5e7eb;"></div>`;
      } else {
        iconHtml = '<div style="width:60px;height:60px;border:1px solid #e5e7eb;border-radius:4px;background:#f8fafc;"></div>';
      }
      const active = (item?.active ?? 1) == 1 || item?.active === true;
      const visHtml = active
        ? '<button type="button" class="btn btn-xs btn-outline btn-success" title="Видим"><i class="fa fa-eye"></i></button>'
        : '<button type="button" class="btn btn-xs btn-outline btn-default" title="Скрыт"><i class="fa fa-eye-slash"></i></button>';
      tr.innerHTML = `
        <td><input type="checkbox" class="facade-item-checkbox" value="${item?.id ?? ''}"></td>
        <td>${item?.id ?? '-'}</td>
        <td>${iconHtml}</td>
        <td>${(item?.name || '-').replace(/</g, '&lt;')}</td>
        <td>${(item?.article || item?.code || '-').replace(/</g, '&lt;')}</td>
        <td>${(getFacadeCategory(item) || '-').replace(/</g, '&lt;')}</td>
        <td>${visHtml}</td>
        <td class="col-actions" style="width:194px; white-space:nowrap;">
          <div style="display:flex; gap:8px; justify-content:center;">
            <button type="button" class="btn btn-xs btn-outline btn-primary" title="Редактировать" data-facade-action="edit" data-facade-id="${item?.id ?? 0}"><i class="fa fa-pencil"></i></button>
            <button type="button" class="btn btn-xs btn-outline btn-info" title="Копировать" data-facade-action="copy" data-facade-id="${item?.id ?? 0}"><i class="fa fa-copy"></i></button>
            <button type="button" class="btn btn-xs btn-outline btn-danger" title="Удалить" data-facade-action="delete" data-facade-id="${item?.id ?? 0}"><i class="fa fa-trash"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    }
    renderFacadesPagination(data.length);
  }

  function renderFacadesPagination(totalItems) {
    const top = document.getElementById('facades-items-pagination-top');
    const bottom = document.getElementById('facades-items-pagination-bottom');
    const fromEl = document.getElementById('facades-items-from');
    const toEl = document.getElementById('facades-items-to');
    const totalEl = document.getElementById('facades-items-total');
    if (!top || !bottom) return;
    const perPage = facadesState.perPage || 20;
    const currentPage = facadesState.currentPage || 1;
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
        a.addEventListener('click', e => { e.preventDefault(); const p = parseInt(a.getAttribute('data-page') || '0'); if (p >= 1 && p <= totalPages) { facadesState.currentPage = p; renderFacadesTable(); } });
      });
    };
    mkPag(top);
    mkPag(bottom);
  }

  async function loadFacades() {
    const tbody = document.getElementById('facades-items-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px;">Загрузка...</td></tr>';
    try {
      const resp = await fetch('/api/catalog/items_get/facades?t=' + Date.now(), { cache: 'no-cache' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      const items = normalizeFacadesResponse(data);

      const getActive = (it) => {
        const v = it?.active;
        return v === true || v === 1 || v === '1';
      };
      // Показываем весь активный список фасадов без эвристик по имени.
      facadesState.allData = items.filter(getActive);

      facadesState.currentPage = 1;
      renderFacadesCategories();
      renderFacadesTable();
    } catch (e) {
      console.error('❌ Ошибка загрузки фасадов:', e);
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#c00;">Ошибка загрузки</td></tr>';
      renderFacadesPagination(0);
    }
  }

  window.openFacadeItemEdit = function openFacadeItemEdit(itemId) {
    const id = Number(itemId) || 0;
    // Переходим на отдельную страницу редактирования фасада (facade-item-edit)
    const hash = `#facade-item-edit?id=${encodeURIComponent(String(id))}`;
    if (window.location.hash !== hash) window.location.hash = hash;

    const pages = document.querySelectorAll('.admin-page');
    pages.forEach(p => p.classList.remove('active'));
    const page = document.getElementById('facade-item-edit');
    if (page && typeof window.loadFacadeItemEdit === 'function') {
      page.classList.add('active');
      window.loadFacadeItemEdit(id);
    }
  };

  window.openFacadePickerModal = function openFacadePickerModal(callback) {
    try {
      const cb = typeof callback === 'function' ? callback : null;
      const MODAL_ID = 'cld-facade-picker-modal';
      const existing = document.getElementById(MODAL_ID);

      const ensureModal = () => {
        if (existing) return existing;
        const overlay = document.createElement('div');
        overlay.id = MODAL_ID;
        overlay.style.cssText = [
          'position:fixed',
          'inset:0',
          'background:rgba(0,0,0,0.35)',
          'display:none',
          'align-items:center',
          'justify-content:center',
          'z-index:10050',
          'padding:16px',
        ].join(';');

        overlay.innerHTML = `
          <div style="width:min(980px, 96vw); max-height:92vh; background:#fff; border-radius:10px; box-shadow:0 10px 40px rgba(0,0,0,0.2); display:flex; flex-direction:column; overflow:hidden;">
            <div style="padding:14px 16px; border-bottom:1px solid #e5e7eb; display:flex; align-items:center; justify-content:space-between; gap:10px;">
              <div style="font-size:15px; font-weight:700; color:#111827;">Выбор фасада</div>
              <button type="button" id="cld-facade-picker-close" class="btn btn-sm btn-default" style="min-width:42px;">✕</button>
            </div>

            <div style="padding:12px 16px; border-bottom:1px solid #e5e7eb; display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
              <input id="cld-facade-picker-search" type="text" class="form-control" placeholder="Поиск по имени / артикулу / ID" style="flex:1 1 340px; min-width:260px;">
              <select id="cld-facade-picker-category" class="form-control" style="flex:0 0 260px; min-width:220px;">
                <option value="">Все категории</option>
              </select>
              <button type="button" id="cld-facade-picker-refresh" class="btn btn-sm btn-outline btn-primary">Обновить</button>
            </div>

            <div style="padding:0; overflow:auto; flex:1;">
              <table class="table table-striped" style="margin:0;">
                <thead>
                  <tr>
                    <th style="width:60px;">ID</th>
                    <th style="width:74px;">Иконка</th>
                    <th>Название</th>
                    <th style="width:160px;">Артикул</th>
                    <th style="width:220px;">Категория</th>
                  </tr>
                </thead>
                <tbody id="cld-facade-picker-body">
                  <tr><td colspan="5" style="padding:18px; text-align:center; color:#6b7280;">Загрузка...</td></tr>
                </tbody>
              </table>
            </div>

            <div style="padding:12px 16px; border-top:1px solid #e5e7eb; display:flex; align-items:center; justify-content:space-between; gap:10px;">
              <div id="cld-facade-picker-selected" style="font-size:13px; color:#374151;">Не выбран</div>
              <div style="display:flex; gap:10px;">
                <button type="button" id="cld-facade-picker-cancel" class="btn btn-sm btn-default">Отмена</button>
                <button type="button" id="cld-facade-picker-apply" class="btn btn-sm btn-primary" disabled>Выбрать</button>
              </div>
            </div>
          </div>
        `;

        document.body.appendChild(overlay);
        return overlay;
      };

      const modal = ensureModal();
      const closeBtn = modal.querySelector('#cld-facade-picker-close');
      const cancelBtn = modal.querySelector('#cld-facade-picker-cancel');
      const applyBtn = modal.querySelector('#cld-facade-picker-apply');
      const refreshBtn = modal.querySelector('#cld-facade-picker-refresh');
      const searchInput = modal.querySelector('#cld-facade-picker-search');
      const categorySelect = modal.querySelector('#cld-facade-picker-category');
      const tbody = modal.querySelector('#cld-facade-picker-body');
      const selInfo = modal.querySelector('#cld-facade-picker-selected');

      let selected = { id: null, name: '', item: null };

      const accUrl = (window.glob?.acc_url || '/').replace(/\/$/, '');

      const hide = () => {
        modal.style.display = 'none';
      };

      const show = () => {
        modal.style.display = 'flex';
      };

      const render = (items) => {
        const q = (searchInput?.value || '').toString().trim().toLowerCase();
        const cat = (categorySelect?.value || '').toString();
        let out = Array.isArray(items) ? items : [];
        if (q) {
          out = out.filter((it) => {
            const name = String(it?.name || '').toLowerCase();
            const art = String(it?.article || it?.code || '').toLowerCase();
            const id = String(it?.id ?? '');
            return name.includes(q) || art.includes(q) || id.includes(q);
          });
        }
        if (cat) out = out.filter((it) => getFacadeCategory(it) === cat);

        if (!out.length) {
          tbody.innerHTML = `<tr><td colspan="5" style="padding:18px; text-align:center; color:#6b7280;">Нет данных</td></tr>`;
          return;
        }

        tbody.innerHTML = '';
        for (const it of out) {
          const tr = document.createElement('tr');
          tr.style.cursor = 'pointer';
          tr.dataset.id = String(it?.id ?? '');
          tr.dataset.name = String(it?.name ?? '');

          const iconUrl = (it?.icon || '').toString();
          const colorVal = (it?.color || '').toString().trim();
          let iconHtml = '';
          if (iconUrl) {
            iconHtml = `<img src="${accUrl}${iconUrl.startsWith('/') ? '' : '/'}${iconUrl}" style="width:46px;height:46px;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb;" onerror="this.style.display='none'">`;
          } else if (colorVal && /^#([0-9A-Fa-f]{6})$/.test(colorVal)) {
            iconHtml = `<div style="width:46px;height:46px;background-color:${colorVal};border-radius:6px;border:1px solid #e5e7eb;"></div>`;
          } else {
            iconHtml = '<div style="width:46px;height:46px;border:1px solid #e5e7eb;border-radius:6px;background:#f8fafc;"></div>';
          }

          tr.innerHTML = `
            <td style="vertical-align:middle;">${it?.id ?? '-'}</td>
            <td style="vertical-align:middle;">${iconHtml}</td>
            <td style="vertical-align:middle;"><div style="font-weight:600; color:#111827;">${String(it?.name || '-').replace(/</g, '&lt;')}</div></td>
            <td style="vertical-align:middle; color:#374151;">${String(it?.article || it?.code || '-').replace(/</g, '&lt;')}</td>
            <td style="vertical-align:middle; color:#374151;">${String(getFacadeCategory(it) || '-').replace(/</g, '&lt;')}</td>
          `;

          const markSelected = (on) => {
            tr.style.background = on ? '#eef2ff' : '';
          };

          tr.addEventListener('click', () => {
            tbody.querySelectorAll('tr').forEach((row) => { row.style.background = ''; });
            selected = { id: it?.id ?? null, name: it?.name ?? '', item: it };
            markSelected(true);
            if (selInfo) selInfo.textContent = selected.id != null ? `Выбрано: ${selected.id} — ${selected.name || ''}` : 'Не выбран';
            if (applyBtn) applyBtn.disabled = !(selected.id != null && String(selected.id) !== '');
          });
          tr.addEventListener('dblclick', () => {
            if (selected.id == null) {
              selected = { id: it?.id ?? null, name: it?.name ?? '', item: it };
            }
            if (cb && selected.id != null) cb(String(selected.id), String(selected.name || ''), selected.item);
            hide();
          });
          tbody.appendChild(tr);
        }
      };

      const fillCategories = (items) => {
        const all = Array.isArray(items) ? items : [];
        const cats = [...new Set(all.map(it => getFacadeCategory(it).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));
        const cur = (categorySelect?.value || '').toString();
        if (categorySelect) {
          categorySelect.innerHTML = '<option value="">Все категории</option>' + cats.map(c => `<option value="${(c || '').replace(/"/g, '&quot;')}">${c || ''}</option>`).join('');
          if (cur) categorySelect.value = cur;
        }
      };

      const load = async (force = false) => {
        const now = Date.now();
        const fresh = facadePickerCache.loadedAt && (now - facadePickerCache.loadedAt < 30_000);
        if (!force && fresh && Array.isArray(facadePickerCache.items) && facadePickerCache.items.length) {
          fillCategories(facadePickerCache.items);
          render(facadePickerCache.items);
          return;
        }
        tbody.innerHTML = `<tr><td colspan="5" style="padding:18px; text-align:center; color:#6b7280;">Загрузка...</td></tr>`;
        try {
          const resp = await fetch('/api/catalog/items_get/facades?t=' + Date.now(), { cache: 'no-cache' });
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          const data = await resp.json();
          const items = normalizeFacadesResponse(data);

          const getActive = (it) => {
            const v = it?.active;
            return v === true || v === 1 || v === '1';
          };
          // В выборе фасада тоже показываем весь активный список.
          facadePickerCache.items = items.filter(getActive);
          facadePickerCache.loadedAt = Date.now();
          fillCategories(facadePickerCache.items);
          render(facadePickerCache.items);
        } catch (e) {
          console.error('❌ Ошибка загрузки фасадов для выбора:', e);
          tbody.innerHTML = `<tr><td colspan="5" style="padding:18px; text-align:center; color:#b91c1c;">Ошибка загрузки</td></tr>`;
        }
      };

      const hideHandler = () => hide();
      if (closeBtn) closeBtn.onclick = hideHandler;
      if (cancelBtn) cancelBtn.onclick = hideHandler;
      if (!modal.dataset.cldFacadePickerOverlayClick) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) hide();
        });
        modal.dataset.cldFacadePickerOverlayClick = '1';
      }
      if (refreshBtn) refreshBtn.onclick = () => load(true);
      if (searchInput) searchInput.oninput = () => render(facadePickerCache.items);
      if (categorySelect) categorySelect.onchange = () => render(facadePickerCache.items);
      if (applyBtn) applyBtn.onclick = () => {
        if (!cb) { hide(); return; }
        if (selected.id == null) return;
        cb(String(selected.id), String(selected.name || ''), selected.item);
        hide();
      };

      selected = { id: null, name: '', item: null };
      if (selInfo) selInfo.textContent = 'Не выбран';
      if (applyBtn) applyBtn.disabled = true;
      if (searchInput) searchInput.value = '';
      if (categorySelect) categorySelect.value = '';
      show();
      load(false);
    } catch (e) {
      console.error('❌ Ошибка openFacadePickerModal:', e);
      alert('Не удалось открыть выбор фасада');
    }
  };

  function initFacadesHandlers() {
    const catBtn = document.getElementById('facades-items-categories-btn');
    if (catBtn) catBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = '#edges-categories?type=facades&name=' + encodeURIComponent('Фасады');
    });
    const addBtn = document.getElementById('facades-items-add-btn');
    if (addBtn) addBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof window.openFacadeItemEdit === 'function') window.openFacadeItemEdit(0);
    });
    const tbody = document.getElementById('facades-items-table-body');
    if (!tbody) return;
    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-facade-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-facade-action');
      const id = parseInt(btn.getAttribute('data-facade-id') || '0');
      const item = facadesState.allData?.find(it => Number(it?.id) === id);
      const name = item?.name || 'Фасад';
      if (action === 'edit') {
        if (window.openFacadeItemEdit) window.openFacadeItemEdit(id);
        else alert('Редактирование фасада: ID ' + id);
      } else if (action === 'copy') {
        if (window.copyFacadeItem) window.copyFacadeItem(id);
        else alert('Копирование: ID ' + id);
      } else if (action === 'delete') {
        if (window.Swal) {
          window.Swal.fire({ title: 'Удалить?', text: `Фасад "${name}"`, icon: 'warning', showCancelButton: true }).then(r => { if (r.isConfirmed && window.deleteFacadeItem) window.deleteFacadeItem(id, name); });
        } else if (confirm('Удалить фасад "' + name + '"?')) {
          if (window.deleteFacadeItem) window.deleteFacadeItem(id, name);
        }
      }
    });
    const searchForm = document.getElementById('facades-items-search-form');
    if (searchForm) searchForm.onsubmit = (e) => { e.preventDefault(); facadesState.currentPage = 1; renderFacadesTable(); };
    const perPageSel = document.getElementById('facades-items-per-page');
    if (perPageSel) perPageSel.onchange = () => { facadesState.perPage = parseInt(perPageSel.value || '20'); facadesState.currentPage = 1; renderFacadesTable(); };
    const catFilter = document.getElementById('facades-items-category-filter');
    if (catFilter) catFilter.onchange = () => { facadesState.currentPage = 1; renderFacadesTable(); };
  }

  window.deleteFacadeItem = function(itemId, itemName) {
    fetch('/api/catalog/item_delete/facades/' + itemId, { method: 'DELETE' })
      .then(res => res.ok ? res.json() : Promise.reject(new Error(res.statusText)))
      .then(() => { if (typeof toastr !== 'undefined') toastr.success('Удалено'); loadFacades(); })
      .catch(e => { console.error('❌ Ошибка удаления:', e); alert('Ошибка: ' + e.message); });
  };

  window.copyFacadeItem = async function(itemId) {
    try {
      const resp = await fetch('/api/catalog/item/facades/' + itemId + '?t=' + Date.now());
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const item = await resp.json();
      const copy = { ...item, id: 0, name: (item?.name || 'Фасад') + ' (копия)' };
      const addResp = await fetch('/api/catalog/item_add/facades/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(copy) });
      if (!addResp.ok) throw new Error('HTTP ' + addResp.status);
      if (typeof toastr !== 'undefined') toastr.success('Скопировано');
      loadFacades();
    } catch (e) {
      console.error('❌ Ошибка копирования:', e);
      alert('Ошибка копирования');
    }
  };

  window.loadFacades = loadFacades;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initFacadesHandlers(); });
  } else {
    initFacadesHandlers();
  }
})();

