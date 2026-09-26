/**
 * admin-materials-keys.js — Работа с типами материалов (ЛДСП, ХДФ и т.д.)
 * Extracted from admin-new.html for better Cursor performance
 */
(function() {
  'use strict';

  const materialsKeysPagination = {
    currentPage: 1,
    perPage: 20,
    allData: []
  };

  function updateMaterialsSubmenu(materialsKeys) {
    const submenu = document.getElementById('materials-submenu');
    if (!submenu) return;
    submenu.querySelectorAll('li[data-material-key]').forEach(item => item.remove());
    if (!materialsKeys || !Array.isArray(materialsKeys) || materialsKeys.length === 0) return;
    materialsKeys.forEach(mat => {
      const id = mat?.id;
      const name = (mat?.name || '').toString().trim();
      if (!name) return;
      const typeKey = `material_${id ?? name}`;
      const li = document.createElement('li');
      li.setAttribute('data-material-key', String(id ?? name));
      li.style.position = 'relative';
      const link = document.createElement('a');
      link.href = `#materials-items?type=${encodeURIComponent(typeKey)}`;
      link.setAttribute('data-page', 'materials-items');
      link.setAttribute('data-catalog-type', typeKey);
      link.setAttribute('data-catalog-name', name);
      link.setAttribute('data-material-id', String(id ?? ''));
      link.setAttribute('data-material-name', name);
      const icon = document.createElement('i');
      icon.className = 'fa fa-folder';
      link.appendChild(icon);
      link.appendChild(document.createTextNode(` ${name}`));
      li.appendChild(link);
      submenu.appendChild(li);
    });
  }

  async function loadMaterialsKeys() {
    try {
      const tbody = document.getElementById('materials-keys-table-body');
      if (!tbody) return;
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Загрузка...</td></tr>';

      const timestamp = new Date().getTime();
      const response = await fetch(`/api/catalog/items_get/materials_keys?t=${timestamp}`, {
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      const responseData = await response.json();
      let allData = [];
      if (Array.isArray(responseData)) allData = responseData;
      else if (responseData && Array.isArray(responseData.items)) allData = responseData.items;
      else if (responseData && responseData.data && Array.isArray(responseData.data)) allData = responseData.data;

      materialsKeysPagination.allData = allData;
      materialsKeysPagination.currentPage = 1;

      updateMaterialsSubmenu(allData);
      renderMaterialsKeysTable();
    } catch (error) {
      console.error('❌ Ошибка загрузки материалов:', error);
      const tbody = document.getElementById('materials-keys-table-body');
      if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#999;">Ошибка загрузки данных</td></tr>';
      renderMaterialsKeysPagination(0);
    }
  }

  function renderMaterialsKeysTable() {
    const tbody = document.getElementById('materials-keys-table-body');
    if (!tbody) return;
    const { currentPage, perPage, allData } = materialsKeysPagination;
    tbody.innerHTML = '';

    if (!Array.isArray(allData) || allData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#999;">Нет данных</td></tr>';
      renderMaterialsKeysPagination(0);
      return;
    }

    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const pageData = allData.slice(startIndex, endIndex);

    pageData.forEach(item => {
      const row = document.createElement('tr');
      const checkboxCell = document.createElement('td');
      checkboxCell.style.width = '10px';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = item.id;
      checkbox.className = 'material-key-checkbox';
      checkboxCell.appendChild(checkbox);

      const idCell = document.createElement('td');
      idCell.style.width = '50px';
      idCell.textContent = item.id || '-';
      const keyCell = document.createElement('td');
      keyCell.style.width = '80px';
      keyCell.textContent = item.key || '-';
      const nameCell = document.createElement('td');
      nameCell.textContent = item.name || '-';

      const actionsCell = document.createElement('td');
      actionsCell.className = 'col-actions';
      actionsCell.style.width = '150px';
      actionsCell.style.textAlign = 'center';

      const editLink = document.createElement('a');
      editLink.href = `#material-key-edit?id=${item.id}`;
      editLink.onclick = (e) => { e.preventDefault(); openMaterialKeyEdit(item.id); };
      const editIcon = document.createElement('i');
      editIcon.className = 'fa fa-edit btn btn-outline btn-success';
      editIcon.title = 'Редактировать';
      editLink.appendChild(editIcon);

      const copyLink = document.createElement('a');
      copyLink.href = '#';
      copyLink.onclick = (e) => {
        e.preventDefault();
        if (typeof window.copyMaterialKey === 'function') window.copyMaterialKey(item.id);
      };
      const copyIcon = document.createElement('i');
      copyIcon.className = 'fa fa-link btn btn-outline btn-primary';
      copyIcon.style.marginLeft = '5px';
      copyIcon.title = 'Копировать';
      copyLink.appendChild(copyIcon);

      const deleteIcon = document.createElement('i');
      deleteIcon.className = 'fa fa-trash btn btn-outline btn-danger';
      deleteIcon.style.cursor = 'pointer';
      deleteIcon.style.marginLeft = '5px';
      deleteIcon.title = 'Удалить';
      deleteIcon.onclick = () => {
        if (typeof window.deleteMaterialKey === 'function') window.deleteMaterialKey(item.id, item.name);
      };

      actionsCell.appendChild(editLink);
      actionsCell.appendChild(copyLink);
      actionsCell.appendChild(deleteIcon);
      row.appendChild(checkboxCell);
      row.appendChild(idCell);
      row.appendChild(keyCell);
      row.appendChild(nameCell);
      row.appendChild(actionsCell);
      tbody.appendChild(row);
    });

    renderMaterialsKeysPagination(allData.length);
    const fromEl = document.getElementById('materials-keys-items-from');
    const toEl = document.getElementById('materials-keys-items-to');
    const totalEl = document.getElementById('materials-keys-items-total');
    if (fromEl) fromEl.textContent = allData.length > 0 ? startIndex + 1 : 0;
    if (toEl) toEl.textContent = Math.min(endIndex, allData.length);
    if (totalEl) totalEl.textContent = allData.length;
  }

  function renderMaterialsKeysPagination(totalItems) {
    const paginationTop = document.getElementById('materials-keys-pagination-top');
    const paginationBottom = document.getElementById('materials-keys-pagination-bottom');
    const { currentPage, perPage } = materialsKeysPagination;
    const totalPages = Math.ceil(totalItems / perPage);

    [paginationTop, paginationBottom].forEach(pagination => {
      if (!pagination) return;
      let html = '';
      if (totalPages > 0) {
        html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="1">&lt;&lt;</a></li>`;
        html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage - 1}">&lt;</a></li>`;
        const maxPagesToShow = 9;
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
        if (endPage - startPage < maxPagesToShow - 1) startPage = Math.max(1, endPage - maxPagesToShow + 1);
        for (let i = startPage; i <= endPage; i++) {
          html += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
        }
        html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage + 1}">&gt;</a></li>`;
        html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${totalPages}">&gt;&gt;</a></li>`;
      }
      pagination.innerHTML = html;
      pagination.querySelectorAll('a.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const page = parseInt(link.getAttribute('data-page'));
          if (page && page >= 1 && page <= totalPages) {
            materialsKeysPagination.currentPage = page;
            renderMaterialsKeysTable();
          }
        });
      });
    });
  }

  function openMaterialKeyEdit(itemId) {
    const editPage = document.getElementById('material-key-edit');
    if (editPage) {
      document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
      editPage.classList.add('active');
      window.history.pushState({ page: 'material-key-edit' }, '', `#material-key-edit?id=${itemId}`);
      loadMaterialKeyEdit(itemId);
    }
  }

  async function loadMaterialKeyEdit(itemId) {
    try {
      const itemIdInput = document.getElementById('material-key-item-id');
      const nameInput = document.getElementById('material-key-name');
      const edgesSetInput = document.getElementById('material-key-edges-set');
      const edgeInMenuInput = document.getElementById('material-key-edge-in-menu');
      const titleElement = document.getElementById('material-key-edit-title');
      const submitUrlInput = document.getElementById('material_key_form_submit_url');
      if (!itemIdInput || !nameInput || !titleElement || !submitUrlInput) return;

      if (edgesSetInput) {
        try {
          const edgesRes = await fetch('/api/catalog/items_get/edges_keys');
          const edgesList = edgesRes.ok ? (await edgesRes.json()) : [];
          edgesSetInput.innerHTML = '';
          (Array.isArray(edgesList) ? edgesList : []).forEach(e => {
            const opt = document.createElement('option');
            opt.value = (e.key || e.name || '').toString();
            opt.textContent = e.name || e.key || opt.value;
            edgesSetInput.appendChild(opt);
          });
          if (edgesSetInput.options.length === 0) {
            const def = document.createElement('option');
            def.value = 'butts';
            def.textContent = 'Набор по умолчанию';
            edgesSetInput.appendChild(def);
          }
        } catch (e) {}
      }

      if (itemId === 0) {
        itemIdInput.value = '0';
        nameInput.value = '';
        if (edgesSetInput) edgesSetInput.value = edgesSetInput.options[0]?.value || 'butts';
        if (edgeInMenuInput) edgeInMenuInput.checked = false;
        titleElement.textContent = 'Добавить Материал';
        submitUrlInput.value = '/api/catalog/item_add/materials_keys/';
      } else {
        const response = await fetch(`/api/catalog/item/materials_keys/${itemId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        itemIdInput.value = result.id;
        nameInput.value = result.name || '';
        if (edgesSetInput) edgesSetInput.value = (result.edges_set || result.edgesSet || 'butts').toString();
        if (edgeInMenuInput) edgeInMenuInput.checked = (result.edge_in_menu ?? result.edgeInMenu ?? 0) == 1;
        titleElement.textContent = `Редактировать Материал #${result.id}`;
        submitUrlInput.value = `/api/catalog/item_edit/materials_keys/${result.id}`;
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки материала:', error);
      alert('Ошибка загрузки: ' + error.message);
    }
  }

  async function saveMaterialKey() {
    try {
      const itemId = parseInt(document.getElementById('material-key-item-id').value) || 0;
      const name = document.getElementById('material-key-name').value.trim();
      const edgesSet = (document.getElementById('material-key-edges-set')?.value || 'butts').toString();
      const edgeInMenu = document.getElementById('material-key-edge-in-menu')?.checked ? 1 : 0;
      if (!name) { alert('Введите название материала'); return; }

      const url = itemId === 0 ? '/api/catalog/item_add/materials_keys/' : `/api/catalog/item_edit/materials_keys/${itemId}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, edges_set: edgesSet, edge_in_menu: edgeInMenu })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      if (typeof toastr !== 'undefined') toastr.success('Материал успешно сохранен');
      else alert('Материал успешно сохранен');
      await loadMaterialsKeys();
      if (window.location.hash !== '#materials-keys') window.location.hash = '#materials-keys';
    } catch (error) {
      console.error('❌ Ошибка сохранения:', error);
      if (typeof toastr !== 'undefined') toastr.error('Ошибка сохранения: ' + error.message);
      else alert('Ошибка сохранения: ' + error.message);
    }
  }

  window.copyMaterialKey = async function copyMaterialKey(itemId) {
    try {
      const response = await fetch(`/api/catalog/item/materials_keys/${itemId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const originalItem = await response.json();
      const copyData = { name: `${originalItem.name} (копия)`, order: (originalItem.order || 0) + 1, active: originalItem.active || 1 };
      const saveResponse = await fetch('/api/catalog/item_add/materials_keys/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(copyData)
      });
      if (!saveResponse.ok) throw new Error(`HTTP ${saveResponse.status}`);
      if (typeof toastr !== 'undefined') toastr.success('Материал успешно скопирован');
      else alert('Материал успешно скопирован');
      await loadMaterialsKeys();
    } catch (error) {
      console.error('❌ Ошибка копирования:', error);
      if (typeof toastr !== 'undefined') toastr.error('Ошибка копирования: ' + error.message);
      else alert('Ошибка копирования: ' + error.message);
    }
  };

  window.deleteMaterialKey = function(itemId, itemName) {
    if (typeof Swal === 'undefined') {
      if (confirm(`Удалить материал "${itemName}"?`)) performDeleteMaterialKey(itemId);
      return;
    }
    Swal.fire({
      title: 'Удалить материал?',
      text: `Вы уверены, что хотите удалить материал "${itemName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Да, удалить',
      cancelButtonText: 'Отмена'
    }).then((result) => { if (result.isConfirmed) performDeleteMaterialKey(itemId); });
  };

  async function performDeleteMaterialKey(itemId) {
    try {
      const response = await fetch(`/api/catalog/item_delete/materials_keys/${itemId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (typeof toastr !== 'undefined') toastr.success('Материал успешно удален');
      else alert('Материал успешно удален');
      setTimeout(() => loadMaterialsKeys(), 300);
    } catch (error) {
      console.error('❌ Ошибка удаления:', error);
      if (typeof toastr !== 'undefined') toastr.error('Ошибка удаления: ' + error.message);
      else alert('Ошибка удаления: ' + error.message);
    }
  }

  window.loadMaterialsKeys = loadMaterialsKeys;
  window.openMaterialKeyEdit = openMaterialKeyEdit;
  window.saveMaterialKey = saveMaterialKey;
  window.updateMaterialsSubmenu = updateMaterialsSubmenu;

  document.addEventListener('DOMContentLoaded', function() {
    const saveBtn = document.getElementById('save-material-key-btn');
    if (saveBtn) saveBtn.addEventListener('click', () => { if (typeof window.saveMaterialKey === 'function') window.saveMaterialKey(); });
  });
})();
