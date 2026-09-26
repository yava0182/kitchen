/**
 * admin-groups.js — логика групп материалов (materials_groups)
 * Перенесено из резервной копии D:\Configurator-Clodis-ThreeJS-11\Configurator-Clodis-ThreeJS-7
 */
(function() {
  'use strict';

  // ============================================
  // Группы материалов (materials_groups)
  // ============================================
  const materialsGroupsPagination = {
    currentPage: 1,
    perPage: 20,
    allData: []
  };

  async function loadMaterialsGroups() {
    try {
      const tbody = document.getElementById('materials-groups-table-body');
      if (!tbody) return;
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">Загрузка...</td></tr>';
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/catalog/items_get/materials_groups?t=${timestamp}`, {
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const responseData = await response.json();
      let allData = [];
      if (Array.isArray(responseData)) allData = responseData;
      else if (responseData && Array.isArray(responseData.data)) allData = responseData.data;
      else if (responseData && responseData.items && Array.isArray(responseData.items)) allData = responseData.items;
      materialsGroupsPagination.allData = allData;
      materialsGroupsPagination._allDataBackup = allData;
      renderMaterialsGroupsTable();
    } catch (error) {
      console.error('❌ Ошибка загрузки групп материалов:', error);
      const tbody = document.getElementById('materials-groups-table-body');
      if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:#999;">Ошибка загрузки данных</td></tr>';
      renderMaterialsGroupsPagination(0);
    }
  }

  function renderMaterialsGroupsTable() {
    const tbody = document.getElementById('materials-groups-table-body');
    if (!tbody) return;
    const { currentPage, perPage } = materialsGroupsPagination;
    let allData = materialsGroupsPagination.allData;
    if (!Array.isArray(allData)) { allData = []; materialsGroupsPagination.allData = []; }
    tbody.innerHTML = '';
    if (!allData || allData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:#999;">Нет данных</td></tr>';
      renderMaterialsGroupsPagination(0);
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
      checkbox.className = 'material-group-checkbox';
      checkboxCell.appendChild(checkbox);
      const idCell = document.createElement('td');
      idCell.style.width = '50px';
      idCell.style.verticalAlign = 'middle';
      idCell.textContent = item.id || '-';
      const keyCell = document.createElement('td');
      keyCell.style.width = '80px';
      keyCell.style.verticalAlign = 'middle';
      keyCell.textContent = item.key || '-';
      const nameCell = document.createElement('td');
      nameCell.style.verticalAlign = 'middle';
      nameCell.textContent = item.name || '-';
      const orderCell = document.createElement('td');
      orderCell.style.verticalAlign = 'middle';
      orderCell.textContent = item.order !== undefined ? item.order : '-';
      const activeCell = document.createElement('td');
      activeCell.style.verticalAlign = 'middle';
      activeCell.style.width = '80px';
      activeCell.innerHTML = (item.active !== undefined && item.active !== 0 && item.active !== '0') ? '<i class="fa fa-eye text-success"></i>' : '<i class="fa fa-eye-slash text-muted"></i>';
      const actionsCell = document.createElement('td');
      actionsCell.className = 'col-actions';
      actionsCell.style.width = '150px';
      actionsCell.style.verticalAlign = 'middle';
      actionsCell.style.textAlign = 'center';
      const editLink = document.createElement('a');
      editLink.href = `#material-group-edit?id=${item.id}`;
      editLink.onclick = (e) => { e.preventDefault(); if (typeof window.openMaterialGroupEdit === 'function') window.openMaterialGroupEdit(item.id); };
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
        if (typeof window.deleteMaterialGroup === 'function') window.deleteMaterialGroup(item.id, item.name);
        else alert('Функция удаления не найдена.');
      };
      actionsCell.appendChild(editLink);
      actionsCell.appendChild(deleteIcon);
      row.appendChild(checkboxCell);
      row.appendChild(idCell);
      row.appendChild(keyCell);
      row.appendChild(nameCell);
      row.appendChild(orderCell);
      row.appendChild(activeCell);
      row.appendChild(actionsCell);
      tbody.appendChild(row);
    });
    renderMaterialsGroupsPagination(allData.length);
  }

  function renderMaterialsGroupsPagination(totalItems) {
    const pagination = document.getElementById('materials-groups-pagination');
    if (!pagination) return;
    const { currentPage, perPage } = materialsGroupsPagination;
    const totalPages = Math.ceil(totalItems / perPage);
    let html = '';
    if (totalPages > 1) {
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
          materialsGroupsPagination.currentPage = page;
          renderMaterialsGroupsTable();
        }
      });
    });
  }

  window.doMaterialsGroupsSearch = function() {
    const searchInput = document.getElementById('materials-groups-search-input');
    const searchTerm = (searchInput?.value || '').toString().trim().toLowerCase();
    if (!searchTerm) {
      materialsGroupsPagination.allData = materialsGroupsPagination._allDataBackup || materialsGroupsPagination.allData;
      materialsGroupsPagination.currentPage = 1;
      renderMaterialsGroupsTable();
      return;
    }
    materialsGroupsPagination._allDataBackup = materialsGroupsPagination._allDataBackup || materialsGroupsPagination.allData.slice();
    const filtered = (materialsGroupsPagination._allDataBackup || []).filter(item => {
      const name = (item.name || '').toString().toLowerCase();
      return name.includes(searchTerm);
    });
    materialsGroupsPagination.allData = filtered;
    materialsGroupsPagination.currentPage = 1;
    renderMaterialsGroupsTable();
  };

  window.loadMaterialsGroups = loadMaterialsGroups;
  window.materialsGroupsPagination = materialsGroupsPagination;

  window.openMaterialGroupEdit = function(id = 0) {
    const pages = document.querySelectorAll('.admin-page');
    pages.forEach(p => p.classList.remove('active'));
    const editPage = document.getElementById('material-group-edit');
    if (editPage) {
      editPage.classList.add('active');
      if (typeof window.initMaterialGroupVue === 'function') window.initMaterialGroupVue();
      const titleEl = document.getElementById('material-group-edit-title');
      if (titleEl) titleEl.textContent = id > 0 ? 'Редактировать группу материалов' : 'Добавить группу материалов';
      if (id > 0) {
        loadMaterialGroupEdit(id);
      } else {
        resetMaterialGroupForm();
        populateMaterialGroupSelects().then(() => {});
      }
      window.history.pushState({ page: 'material-group-edit', id }, '', `#material-group-edit?id=${id}`);
    }
  };

  function resetMaterialGroupForm() {
    const itemIdEl = document.getElementById('material-group-item-id');
    const submitUrlEl = document.getElementById('material_group_form_submit_url');
    if (itemIdEl) itemIdEl.value = '0';
    if (submitUrlEl) submitUrlEl.value = '/api/catalog/item_add/materials_groups/';
    const app = window.materialGroupVueApp;
    if (app) {
      app.form = {
        name: '',
        key: '',
        order: 0,
        showInMenu: 1,
        availableMaterials: [],
        defaultMaterial: null,
        moduleGroups: []
      };
    }
  }

  async function populateMaterialGroupSelects() {
    try {
      const [materialsResp, modulesResp] = await Promise.all([
        fetch('/api/catalog/items_get/materials_keys?t=' + Date.now()),
        fetch('/api/catalog/items_get/modules_groups?t=' + Date.now())
      ]);
      const materials = materialsResp.ok ? await materialsResp.json() : [];
      const modules = modulesResp.ok ? await modulesResp.json() : [];
      const app = window.materialGroupVueApp;
      if (app) {
        app.materialsOptions = (Array.isArray(materials) ? materials : []).map(m => ({
          id: m.key || m.id,
          name: (m.name || m.key || m.id || '—').toString()
        }));
        app.moduleGroupsOptions = (Array.isArray(modules) ? modules : []).map(g => ({
          id: g.key || g.id,
          label: (g.name || g.key || g.id || '—').toString()
        }));
      }
    } catch (e) {
      console.warn('Ошибка загрузки списков для формы группы материалов:', e);
    }
  }

  async function loadMaterialGroupEdit(id) {
    try {
      await populateMaterialGroupSelects();
      const response = await fetch(`/api/catalog/item/materials_groups/${id}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const item = await response.json();
      const itemIdEl = document.getElementById('material-group-item-id');
      const submitUrlInput = document.getElementById('material_group_form_submit_url');
      if (itemIdEl) itemIdEl.value = String(item.id || '0');
      if (submitUrlInput) submitUrlInput.value = `/api/catalog/item_edit/materials_groups/${id}`;
      const available = item.available || item.available_materials || [];
      const defaultMat = item.default || item.default_material || '';
      const modGroups = item.module_groups || item.available_module_groups || [];
      const showInMenu = item.show_in_menu !== undefined ? item.show_in_menu : item.active;
      const app = window.materialGroupVueApp;
      if (app) {
        app.form = {
          name: (item.name || '').toString(),
          key: (item.key || '').toString(),
          order: Number(item.order ?? 0),
          showInMenu: (showInMenu !== undefined && showInMenu !== 0 && showInMenu !== '0') ? 1 : 0,
          availableMaterials: Array.isArray(available) ? available.map(a => (a && (a.id || a.key || a)) || '').filter(Boolean) : [],
          defaultMaterial: defaultMat ? (defaultMat.id || defaultMat.key || defaultMat) : null,
          moduleGroups: Array.isArray(modGroups) ? modGroups.map(g => (g && (g.id || g.key || g)) || '').filter(Boolean) : []
        };
      }
    } catch (e) {
      console.error('❌ Ошибка загрузки группы материалов:', e);
      alert('Ошибка загрузки группы материалов.');
    }
  }

  window.saveMaterialGroup = async function(exitAfter = false) {
    try {
      const id = Number(document.getElementById('material-group-item-id')?.value || '0') || 0;
      const app = window.materialGroupVueApp;
      let name, key, order, showInMenu, available, defaultMaterial, moduleGroups;
      if (app) {
        name = (app.form.name || '').toString().trim();
        key = (app.form.key || '').toString().trim();
        order = Number(app.form.order ?? 0) || 0;
        showInMenu = app.form.showInMenu ? 1 : 0;
        available = Array.isArray(app.form.availableMaterials) ? app.form.availableMaterials.map(v => (v && (v.id || v.key || v)) || v).filter(v => v !== null && v !== undefined && v !== '') : [];
        defaultMaterial = (app.form.defaultMaterial != null && app.form.defaultMaterial !== '') ? String(app.form.defaultMaterial) : '';
        moduleGroups = Array.isArray(app.form.moduleGroups) ? app.form.moduleGroups.map(v => (v && (v.id || v.key || v)) || v).filter(v => v !== null && v !== undefined && v !== '') : [];
      } else {
        name = (document.getElementById('material-group-name')?.value || '').toString().trim();
        key = (document.getElementById('material-group-key')?.value || '').toString().trim();
        order = Number(document.getElementById('material-group-order')?.value || '0') || 0;
        const showInMenuEl = document.getElementById('material-group-show-in-menu');
        showInMenu = showInMenuEl?.checked ? 1 : 0;
        available = [];
        defaultMaterial = '';
        moduleGroups = [];
      }
      if (!name) { alert('Введите название'); return; }
      const payload = { id, name, order, active: showInMenu, show_in_menu: showInMenu, key, available, default: defaultMaterial, default_material: defaultMaterial, module_groups: moduleGroups };
      const url = id > 0 ? `/api/catalog/item_edit/materials_groups/${id}` : '/api/catalog/item_add/materials_groups/';
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      if (window.toastr) window.toastr.success('Сохранено');
      if (exitAfter) {
        window.location.hash = '#materials-groups';
        document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
        const listPage = document.getElementById('materials-groups');
        if (listPage) listPage.classList.add('active');
        loadMaterialsGroups();
      } else {
        const result = await resp.json();
        if (result && result.item && result.item.id) {
          const itemIdEl = document.getElementById('material-group-item-id');
          const titleEl = document.getElementById('material-group-edit-title');
          const submitUrlEl = document.getElementById('material_group_form_submit_url');
          if (itemIdEl) itemIdEl.value = String(result.item.id);
          if (titleEl) titleEl.textContent = 'Редактировать группу материалов #' + result.item.id;
          if (submitUrlEl) submitUrlEl.value = `/api/catalog/item_edit/materials_groups/${result.item.id}`;
        }
      }
    } catch (e) {
      console.error('❌ Ошибка сохранения группы материалов:', e);
      alert('Ошибка сохранения.');
    }
  };

  window.deleteMaterialGroup = async function(id, name) {
    if (!confirm(`Удалить группу материалов "${name}"?`)) return;
    try {
      const resp = await fetch(`/api/catalog/item_delete/materials_groups/${id}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      if (window.toastr) window.toastr.success('Удалено');
      loadMaterialsGroups();
    } catch (e) {
      console.error('❌ Ошибка удаления группы материалов:', e);
      alert('Ошибка удаления.');
    }
  };

  console.log('[admin-groups] модуль групп материалов загружен');
})();
