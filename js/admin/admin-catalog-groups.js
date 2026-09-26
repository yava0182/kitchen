/**
 * admin-catalog-groups.js — Работа с группами модулей (modules_groups)
 * Extracted from admin-new.html for better performance
 */
(function() {
  'use strict';

  const catalogGroupsPagination = {
    currentPage: 1,
    perPage: 20,
    allData: []
  };

  async function loadCatalogGroups() {
    try {
      const tbody = document.getElementById('catalog-groups-table-body');
      if (!tbody) return;
      
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">Загрузка...</td></tr>';
      
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/catalog/items_get/modules_groups?t=${timestamp}`, {
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
      const responseData = await response.json();
      let allData = [];
      if (Array.isArray(responseData)) allData = responseData;
      else if (responseData && Array.isArray(responseData.data)) allData = responseData.data;
      else if (responseData && responseData.items && Array.isArray(responseData.items)) allData = responseData.items;
      
      catalogGroupsPagination.allData = allData;
      renderCatalogGroupsTable();
    } catch (error) {
      console.error('❌ Ошибка загрузки групп:', error);
      const tbody = document.getElementById('catalog-groups-table-body');
      if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#999;">Ошибка загрузки данных</td></tr>';
      renderCatalogGroupsPagination(0);
    }
  }

  function renderCatalogGroupsTable() {
    const tbody = document.getElementById('catalog-groups-table-body');
    if (!tbody) return;
    
    const { currentPage, perPage } = catalogGroupsPagination;
    let allData = catalogGroupsPagination.allData;
    if (!Array.isArray(allData)) { allData = []; catalogGroupsPagination.allData = []; }
    
    tbody.innerHTML = '';
    if (!allData || allData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#999;">Нет данных</td></tr>';
      renderCatalogGroupsPagination(0);
      return;
    }
    
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const pageData = allData.slice(startIndex, endIndex);
    
    pageData.forEach(item => {
      const row = document.createElement('tr');
      const checkboxCell = document.createElement('td');
      checkboxCell.style.width = '10px';
      checkboxCell.style.verticalAlign = 'middle';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = item.id;
      checkbox.className = 'catalog-group-checkbox';
      checkboxCell.appendChild(checkbox);
      
      const idCell = document.createElement('td');
      idCell.style.width = '50px';
      idCell.style.verticalAlign = 'middle';
      idCell.textContent = item.id || '-';
      
      const nameCell = document.createElement('td');
      nameCell.style.verticalAlign = 'middle';
      nameCell.textContent = item.name || '-';
      
      const actionsCell = document.createElement('td');
      actionsCell.className = 'col-actions';
      actionsCell.style.width = '150px';
      actionsCell.style.verticalAlign = 'middle';
      actionsCell.style.textAlign = 'center';
      
      const editLink = document.createElement('a');
      editLink.href = `#catalog-group-edit?id=${item.id}`;
      editLink.onclick = (e) => { e.preventDefault(); openCatalogGroupEdit(item.id); };
      const editIcon = document.createElement('i');
      editIcon.className = 'fa fa-edit btn btn-outline btn-success';
      editIcon.title = 'Редактировать';
      editLink.appendChild(editIcon);
      
      const deleteIcon = document.createElement('i');
      deleteIcon.className = 'fa fa-trash btn btn-outline btn-danger';
      deleteIcon.style.cursor = 'pointer';
      deleteIcon.style.marginLeft = '6px';
      deleteIcon.title = 'Удалить';
      deleteIcon.onclick = () => {
        if (typeof window.deleteCatalogGroup === 'function') {
          window.deleteCatalogGroup(item.id, item.name);
        } else {
          console.error('❌ Функция deleteCatalogGroup не найдена');
          alert('Ошибка: функция удаления не найдена. Перезагрузите страницу.');
        }
      };
      
      actionsCell.appendChild(editLink);
      actionsCell.appendChild(deleteIcon);
      row.appendChild(checkboxCell);
      row.appendChild(idCell);
      row.appendChild(nameCell);
      row.appendChild(actionsCell);
      tbody.appendChild(row);
    });
    
    renderCatalogGroupsPagination(allData.length);
  }

  function renderCatalogGroupsPagination(totalItems) {
    const pagination = document.getElementById('catalog-groups-pagination');
    if (!pagination) return;
    
    const { currentPage, perPage } = catalogGroupsPagination;
    const totalPages = Math.ceil(totalItems / perPage);
    
    let html = '';
    if (totalPages > 1) {
      html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="1" title="Первая страница">&lt;&lt;</a></li>`;
      html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage - 1}" title="Предыдущая страница">&lt;</a></li>`;
      const maxPagesToShow = 9;
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      if (endPage - startPage < maxPagesToShow - 1) startPage = Math.max(1, endPage - maxPagesToShow + 1);
      for (let i = startPage; i <= endPage; i++) {
        html += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
      }
      html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage + 1}" title="Следующая страница">&gt;</a></li>`;
      html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${totalPages}" title="Последняя страница">&gt;&gt;</a></li>`;
    }
    pagination.innerHTML = html;
    
    pagination.querySelectorAll('a.page-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = parseInt(link.getAttribute('data-page'));
        if (page && page !== currentPage && page >= 1 && page <= totalPages) {
          catalogGroupsPagination.currentPage = page;
          renderCatalogGroupsTable();
        }
      });
    });
  }

  window.openCatalogGroupEdit = function openCatalogGroupEdit(itemId = 0) {
    document.querySelectorAll('.admin-page').forEach(page => page.classList.remove('active'));
    const editPage = document.getElementById('catalog-group-edit');
    if (editPage) {
      editPage.classList.add('active');
      window.history.pushState({ page: 'catalog-group-edit' }, '', `#catalog-group-edit?id=${itemId}`);
      loadCatalogGroupEdit(itemId);
    }
  };

  async function loadCatalogGroupEdit(itemId) {
    try {
      const itemIdInput = document.getElementById('catalog-group-item-id');
      const nameInput = document.getElementById('catalog-group-name');
      const orderInput = document.getElementById('catalog-group-order');
      const activeInput = document.getElementById('catalog-group-active');
      const titleElement = document.getElementById('catalog-group-edit-title');
      const submitUrlInput = document.getElementById('group_form_submit_url');
      
      if (!itemIdInput || !nameInput || !orderInput || !activeInput || !titleElement || !submitUrlInput) return;
      
      itemIdInput.value = itemId;
      
      if (itemId === '0' || itemId === 0) {
        titleElement.textContent = 'Добавить Группу';
        nameInput.value = '';
        orderInput.value = '0';
        activeInput.checked = true;
        submitUrlInput.value = '/api/catalog/item_add/modules_groups/';
      } else {
        titleElement.textContent = `Редактировать Группу #${itemId}`;
        submitUrlInput.value = `/api/catalog/item_edit/modules_groups/${itemId}`;
        const response = await fetch(`/api/catalog/item/modules_groups/${itemId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const item = await response.json();
        nameInput.value = item.name || '';
        orderInput.value = item.order || '0';
        activeInput.checked = item.active !== undefined ? item.active == 1 : true;
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки группы:', error);
      alert(`Ошибка загрузки: ${error.message}`);
    }
  }

  async function saveCatalogGroup(exitAfterSave = false) {
    try {
      const itemId = document.getElementById('catalog-group-item-id').value;
      const name = document.getElementById('catalog-group-name').value;
      const order = document.getElementById('catalog-group-order').value;
      const active = document.getElementById('catalog-group-active').checked ? '1' : '0';
      const submitUrl = document.getElementById('group_form_submit_url').value;
      
      if (!name || name.trim() === '') {
        alert('Введите название группы');
        return;
      }
      
      const formData = new FormData();
      formData.append('data', JSON.stringify({ name: name.trim(), order: parseInt(order) || 0, active }));
      
      const response = await fetch(submitUrl, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
      const result = await response.json();
      if (typeof toastr !== 'undefined') toastr.success('Группа успешно сохранена');
      else alert('Группа успешно сохранена');
      
      if (exitAfterSave) {
        window.location.hash = '#catalog-groups';
        setTimeout(() => { catalogGroupsPagination.currentPage = 1; loadCatalogGroups(); }, 200);
      } else if (result.item && result.item.id) {
        document.getElementById('catalog-group-item-id').value = result.item.id;
        const titleElement = document.getElementById('catalog-group-edit-title');
        if (titleElement) titleElement.textContent = `Редактировать Группу #${result.item.id}`;
        const submitUrlInput = document.getElementById('group_form_submit_url');
        if (submitUrlInput) submitUrlInput.value = `/api/catalog/item_edit/modules_groups/${result.item.id}`;
      }
    } catch (error) {
      console.error('❌ Ошибка сохранения группы:', error);
      alert(`Ошибка сохранения: ${error.message}`);
    }
  }

  window.deleteCatalogGroup = async function deleteCatalogGroup(itemId, itemName) {
    if (typeof swal !== 'undefined') {
      swal({ title: "Вы уверены?", text: `Вы действительно хотите удалить группу "${itemName}"?`, type: "warning",
        showCancelButton: true, confirmButtonColor: "#DD6B55", cancelButtonText: "Нет", confirmButtonText: "Да", closeOnConfirm: true
      }, async function(isConfirm) { if (isConfirm) await performDeleteCatalogGroup(itemId); });
    } else {
      if (confirm(`Вы уверены, что хотите удалить группу "${itemName}"?`)) await performDeleteCatalogGroup(itemId);
    }
  };

  async function performDeleteCatalogGroup(itemId) {
    try {
      const response = await fetch(`/api/catalog/item_delete/modules_groups/${itemId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      if (typeof toastr !== 'undefined') toastr.success('Группа успешно удалена');
      else alert('Группа успешно удалена');
      catalogGroupsPagination.currentPage = 1;
      setTimeout(() => loadCatalogGroups(), 300);
    } catch (error) {
      console.error('❌ Ошибка удаления группы:', error);
      if (typeof toastr !== 'undefined') toastr.error(`Ошибка удаления: ${error.message}`);
      else alert(`Ошибка удаления: ${error.message}`);
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    const saveBtn = document.getElementById('save-catalog-group-btn');
    if (saveBtn) saveBtn.addEventListener('click', () => saveCatalogGroup(false));
    const saveAndExitBtn = document.getElementById('save-and-exit-catalog-group-btn');
    if (saveAndExitBtn) saveAndExitBtn.addEventListener('click', () => saveCatalogGroup(true));
    const cancelBtn = document.getElementById('cancel-catalog-group-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', (e) => { e.preventDefault(); window.location.hash = '#catalog-groups'; });
    
    const groupsPerPageSelect = document.getElementById('groups-per-page-select');
    if (groupsPerPageSelect) {
      groupsPerPageSelect.addEventListener('change', function(e) {
        catalogGroupsPagination.perPage = parseInt(e.target.value) || 20;
        catalogGroupsPagination.currentPage = 1;
        renderCatalogGroupsTable();
      });
    }
  });

  window.loadCatalogGroups = loadCatalogGroups;
  window.loadCatalogGroupEdit = loadCatalogGroupEdit;
  window.catalogGroupsPagination = catalogGroupsPagination;

})();
