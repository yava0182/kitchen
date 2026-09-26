/**
 * admin-edges-keys.js — Работа с наборами кромок (edges_keys)
 * Extracted from admin-new.html for better Cursor performance
 */
(function() {
  'use strict';

  const edgesKeysPagination = { allData: [], currentPage: 1, perPage: 20 };

  async function loadEdgesKeys() {
    try {
      const tbody = document.getElementById('edges-keys-table-body');
      if (!tbody) return;
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">Загрузка...</td></tr>';

      const response = await fetch('/api/catalog/items_get/edges_keys');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const allData = Array.isArray(data) ? data : [];

      const searchVal = (document.getElementById('edges-keys-search-input')?.value || '').toLowerCase();
      let filtered = allData;
      if (searchVal) {
        filtered = allData.filter(item =>
          (item.name || '').toLowerCase().includes(searchVal) ||
          (item.key || '').toLowerCase().includes(searchVal)
        );
      }

      edgesKeysPagination.allData = filtered;
      edgesKeysPagination.currentPage = 1;
      edgesKeysPagination.perPage = parseInt(document.getElementById('edges-keys-per-page-select')?.value || '20') || 20;
      renderEdgesKeysTable();
      updateEdgesSubmenu(filtered);
    } catch (error) {
      console.error('❌ Ошибка загрузки наборов кромок:', error);
      const tbody = document.getElementById('edges-keys-table-body');
      if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#999;">Ошибка загрузки</td></tr>';
    }
  }

  function renderEdgesKeysTable() {
    const tbody = document.getElementById('edges-keys-table-body');
    if (!tbody) return;
    const { currentPage, perPage, allData } = edgesKeysPagination;
    tbody.innerHTML = '';

    if (!allData || allData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#999;">Нет данных</td></tr>';
      renderEdgesKeysPagination(0);
      return;
    }

    const start = (currentPage - 1) * perPage;
    const pageData = allData.slice(start, start + perPage);

    pageData.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="checkbox" class="edge-key-checkbox" value="${item.id}"></td>
        <td>${item.id || '-'}</td>
        <td>${(item.name || '-')}</td>
        <td class="col-actions">
          <a href="#edge-key-edit?id=${item.id}" onclick="event.preventDefault(); openEdgeKeyEdit(${item.id});"><i class="fa fa-edit btn btn-outline btn-success" title="Редактировать"></i></a>
          <a href="#" onclick="event.preventDefault(); copyEdgeKey(${item.id});"><i class="fa fa-link btn btn-outline btn-primary" style="margin-left:5px;" title="Копировать"></i></a>
          <i class="fa fa-trash btn btn-outline btn-danger" style="margin-left:5px; cursor:pointer;" title="Удалить" onclick="deleteEdgeKey(${item.id}, ${JSON.stringify(item.name || '')})"></i>
        </td>
      `;
      tbody.appendChild(tr);
    });

    renderEdgesKeysPagination(allData.length);
    const fromEl = document.getElementById('edges-keys-items-from');
    const toEl = document.getElementById('edges-keys-items-to');
    const totalEl = document.getElementById('edges-keys-items-total');
    if (fromEl) fromEl.textContent = allData.length ? start + 1 : 0;
    if (toEl) toEl.textContent = Math.min(start + perPage, allData.length);
    if (totalEl) totalEl.textContent = allData.length;
  }

  function renderEdgesKeysPagination(totalItems) {
    const { currentPage, perPage } = edgesKeysPagination;
    const totalPages = Math.ceil(totalItems / perPage) || 1;
    const paginations = [document.getElementById('edges-keys-pagination-top'), document.getElementById('edges-keys-pagination-bottom')];

    paginations.forEach(pag => {
      if (!pag) return;
      let html = '';
      html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="1">&lt;&lt;</a></li>`;
      html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage - 1}">&lt;</a></li>`;
      for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        html += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
      }
      html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage + 1}">&gt;</a></li>`;
      html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${totalPages}">&gt;&gt;</a></li>`;
      pag.innerHTML = html;
      pag.querySelectorAll('a.page-link').forEach(link => {
        link.addEventListener('click', e => {
          e.preventDefault();
          const p = parseInt(link.getAttribute('data-page'));
          if (p && p >= 1 && p <= totalPages) {
            edgesKeysPagination.currentPage = p;
            renderEdgesKeysTable();
          }
        });
      });
    });
  }

  function openEdgeKeyEdit(itemId) {
    const editPage = document.getElementById('edge-key-edit');
    if (!editPage) return;
    document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
    editPage.classList.add('active');
    window.history.pushState({ page: 'edge-key-edit' }, '', `#edge-key-edit?id=${itemId}`);
    loadEdgeKeyEdit(itemId);
  }

  async function loadEdgeKeyEdit(itemId) {
    try {
      const idInput = document.getElementById('edge-key-item-id');
      const nameInput = document.getElementById('edge-key-name');
      const keyInput = document.getElementById('edge-key-key');
      const keyRow = document.getElementById('edge-key-key-row');
      const errorDiv = document.getElementById('edge-key-error-msg');
      const titleEl = document.getElementById('edge-key-edit-title');
      const submitUrl = document.getElementById('edge_key_form_submit_url');
      if (errorDiv) errorDiv.style.display = 'none';

      if (itemId === 0) {
        idInput.value = '0';
        nameInput.value = '';
        if (keyInput) keyInput.value = '';
        if (keyRow) keyRow.style.display = 'none';
        titleEl.textContent = 'Добавить набор кромок';
        submitUrl.value = '/api/catalog/item_add/edges_keys/';
      } else {
        const res = await fetch(`/api/catalog/item/edges_keys/${itemId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const r = await res.json();
        idInput.value = r.id;
        nameInput.value = r.name || '';
        if (keyInput) { keyInput.value = r.key || ''; keyInput.readOnly = true; }
        if (keyRow) keyRow.style.display = 'flex';
        titleEl.textContent = `Редактировать набор кромок #${r.id}`;
        submitUrl.value = `/api/catalog/item_edit/edges_keys/${r.id}`;
      }
    } catch (e) {
      console.error('❌ Ошибка загрузки набора кромок:', e);
      alert('Ошибка загрузки: ' + e.message);
    }
  }

  async function saveEdgeKey(exitAfter) {
    const itemId = parseInt(document.getElementById('edge-key-item-id').value) || 0;
    const name = document.getElementById('edge-key-name').value.trim();
    const key = document.getElementById('edge-key-key')?.value?.trim() || '';
    const errorDiv = document.getElementById('edge-key-error-msg');
    if (errorDiv) errorDiv.style.display = 'none';

    if (!name) {
      if (errorDiv) { errorDiv.textContent = 'Название не заполнено!'; errorDiv.style.display = 'block'; }
      if (typeof toastr !== 'undefined') toastr.error('Ошибка');
      return;
    }

    const fdata = new FormData();
    fdata.append('id', itemId);
    fdata.append('name', name);
    fdata.append('key', key);

    const url = itemId === 0 ? '/api/catalog/item_add/edges_keys/' : `/api/catalog/item_edit/edges_keys/${itemId}`;
    try {
      const res = await fetch(url, { method: 'POST', body: fdata });
      const result = await res.json().catch(() => ({}));

      if (result === 'reserved_key' || result?.result === 'reserved_key' || result?.error === 'reserved_key') {
        if (errorDiv) { errorDiv.textContent = 'Данный ключ зарезервирован и не может быть добавлен вручную!'; errorDiv.style.display = 'block'; }
        if (typeof toastr !== 'undefined') toastr.error('Ошибка');
        return;
      }
      if (result === 'key_exists' || result?.result === 'key_exists' || result?.error === 'key_exists') {
        if (errorDiv) { errorDiv.textContent = 'Такой ключ уже существует!'; errorDiv.style.display = 'block'; }
        if (typeof toastr !== 'undefined') toastr.error('Ошибка');
        return;
      }
      if (result === 'empty_name' || result?.result === 'empty_name' || result?.error === 'empty_name') {
        if (errorDiv) { errorDiv.textContent = 'Название не заполнено!'; errorDiv.style.display = 'block'; }
        if (typeof toastr !== 'undefined') toastr.error('Ошибка');
        return;
      }
      if (result?.result !== 'success' && !result?.item) {
        if (errorDiv) { errorDiv.textContent = result?.error || result?.message || 'Произошла ошибка!'; errorDiv.style.display = 'block'; }
        if (typeof toastr !== 'undefined') toastr.error('Ошибка');
        return;
      }

      if (typeof toastr !== 'undefined') toastr.success('Успешно');
      await loadEdgesKeys();
      updateEdgesSubmenu(edgesKeysPagination.allData || []);
      if (exitAfter) window.location.hash = '#edges-keys';
      else if (result?.item?.id) {
        document.getElementById('edge-key-item-id').value = result.item.id;
        document.getElementById('edge_key_form_submit_url').value = `/api/catalog/item_edit/edges_keys/${result.item.id}`;
        if (result.item.key) document.getElementById('edge-key-key').value = result.item.key;
        document.getElementById('edge-key-edit-title').textContent = `Редактировать набор кромок #${result.item.id}`;
        document.getElementById('edge-key-key-row').style.display = 'flex';
      }
    } catch (e) {
      console.error('❌ Ошибка сохранения:', e);
      if (errorDiv) { errorDiv.textContent = e.message || 'Произошла ошибка!'; errorDiv.style.display = 'block'; }
      if (typeof toastr !== 'undefined') toastr.error('Ошибка');
    }
  }

  window.copyEdgeKey = async function copyEdgeKey(itemId) {
    try {
      const res = await fetch(`/api/catalog/item/edges_keys/${itemId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const orig = await res.json();
      const fdata = new FormData();
      fdata.append('id', 0);
      fdata.append('name', (orig.name || '') + ' (копия)');
      fdata.append('key', '');
      const saveRes = await fetch('/api/catalog/item_add/edges_keys/', { method: 'POST', body: fdata });
      const result = await saveRes.json();
      if (result?.result === 'success' || result?.item) {
        if (typeof toastr !== 'undefined') toastr.success('Копия создана');
        await loadEdgesKeys();
        updateEdgesSubmenu(edgesKeysPagination.allData || []);
      } else throw new Error(result?.error || 'Ошибка');
    } catch (e) {
      console.error('❌ Ошибка копирования:', e);
      if (typeof toastr !== 'undefined') toastr.error(e.message);
      else alert(e.message);
    }
  };

  function updateEdgesSubmenu(edgesList) {
    const submenu = document.getElementById('edges-submenu');
    if (!submenu) return;
    let html = '<li style="position:relative;"><a href="#edges-keys" data-page="edges-keys">Список наборов кромок</a><div class="cat_button" title="Категории кромок"><a href="#" class="edges-cat-modal-trigger"><i class="fa fa-folder-open-o"></i></a></div></li>';
    (edgesList || []).forEach(e => {
      const key = (e.key || '').toString().replace(/[^a-zA-Z0-9_]/g, '') || 'butts';
      const name = (e.name || key).replace(/"/g, '&quot;');
      html += `<li style="position:relative;"><a href="#edges-items?type=butt_${key}&name=${encodeURIComponent(e.name || key)}" data-page="edges-items" data-edges-type="butt_${key}" data-edges-name="${name}">${e.name || key}</a><div class="cat_button" title="Категории ${name}" style="position:absolute;top:5px;left:20px;width:30px;height:30px;font-size:16px;color:#3399ff;cursor:pointer;"><a href="#edges-categories?type=butt_${key}&name=${encodeURIComponent(e.name || key)}"><i class="fa fa-folder-open-o"></i></a></div></li>`;
    });
    submenu.innerHTML = html;
  }

  window.deleteEdgeKey = function(itemId, itemName) {
    if (!confirm(`Удалить набор кромок "${itemName}"?`)) return;
    fetch(`/api/catalog/item_delete/edges_keys/${itemId}`, { method: 'DELETE' })
      .then(res => res.ok ? res.json() : Promise.reject(new Error(res.statusText)))
      .then(() => {
        if (typeof toastr !== 'undefined') toastr.success('Удалено');
        loadEdgesKeys();
      })
      .catch(e => {
        console.error('❌ Ошибка удаления:', e);
        alert('Ошибка удаления: ' + e.message);
      });
  };

  window.loadEdgesKeys = loadEdgesKeys;
  window.openEdgeKeyEdit = openEdgeKeyEdit;
  window.saveEdgeKey = saveEdgeKey;
  window.updateEdgesSubmenu = updateEdgesSubmenu;
})();
