/**
 * admin-accessories-library.js — Страница "Комплектующие и фурнитура" (библиотека)
 * Extracted from admin-new.html for better Cursor performance
 */
(function() {
  'use strict';

  const accessoriesLibraryPage = {
    currentPage: 1,
    perPage: 20,
    searchQuery: '',
    categoryFilter: '',
    allItems: []
  };

  async function loadAccessoriesLibrary() {
    const tbody = document.getElementById('accessories-library-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px;">Загрузка...</td></tr>';

    try {
      const lib = window.__cldAccessoriesLib || {
        types: [],
        items: {}
      };

      let allItems = [];
      if (lib.types && Array.isArray(lib.types)) {
        lib.types.forEach(type => {
          const typeKey = type.key || String(type.id);
          const items = lib.items && lib.items[typeKey] ? lib.items[typeKey] : [];
          items.forEach(item => {
            allItems.push({
              id: item.id,
              name: item.name || '',
              sku: item.sku || item.article || '',
              category: type.name || '',
              price: item.price || 0,
              type: type.name || 'Общий',
              visible: item.visible !== false
            });
          });
        });
      }

      accessoriesLibraryPage.allItems = allItems;

      let filtered = allItems;
      if (accessoriesLibraryPage.searchQuery) {
        const q = accessoriesLibraryPage.searchQuery.toLowerCase();
        filtered = filtered.filter(item =>
          (item.name && item.name.toLowerCase().includes(q)) ||
          (item.sku && item.sku.toLowerCase().includes(q))
        );
      }
      if (accessoriesLibraryPage.categoryFilter) {
        filtered = filtered.filter(item => item.category === accessoriesLibraryPage.categoryFilter);
      }

      const perPage = accessoriesLibraryPage.perPage;
      const totalPages = Math.ceil(filtered.length / perPage);
      const start = (accessoriesLibraryPage.currentPage - 1) * perPage;
      const end = start + perPage;
      const pageItems = filtered.slice(start, end);

      if (pageItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#999;">Комплектующие не найдены</td></tr>';
      } else {
        const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        tbody.innerHTML = pageItems.map(item => `
          <tr>
            <td>${esc(item.id)}</td>
            <td>${esc(item.sku)}</td>
            <td>${esc(item.name)}</td>
            <td>${esc(item.category)}</td>
            <td>${esc(item.price)}</td>
            <td>${esc(item.type)}</td>
            <td style="text-align:center;">
              <button type="button" class="cld-acc-lib-toggle-visibility" data-id="${esc(item.id)}" style="background:${item.visible ? '#10b981' : '#e5e7eb'}; color:${item.visible ? '#fff' : '#666'}; border:none; width:32px; height:32px; border-radius:50%; padding:0; cursor:pointer; display:inline-flex; align-items:center; justify-content:center;">
                <i class="fa fa-eye" style="width:16px; height:16px;"></i>
              </button>
            </td>
            <td style="text-align:center;">
              <button type="button" class="cld-acc-lib-edit" data-id="${esc(item.id)}" style="background:#1c84c6; color:#fff; border:none; width:32px; height:32px; padding:0; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; margin-right:4px; border-radius:4px;">
                <i class="fa fa-pencil" style="width:14px; height:14px;"></i>
              </button>
              <button type="button" class="cld-acc-lib-delete" data-id="${esc(item.id)}" style="background:#ed5565; color:#fff; border:none; width:32px; height:32px; padding:0; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; border-radius:4px;">
                <i class="fa fa-trash" style="width:14px; height:14px;"></i>
              </button>
            </td>
          </tr>
        `).join('');

        tbody.querySelectorAll('.cld-acc-lib-edit').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (typeof window.openAccessoryEditModal === 'function') {
              window.openAccessoryEditModal(id);
            }
          });
        });

        tbody.querySelectorAll('.cld-acc-lib-delete').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (typeof window.deleteAccessoryFromLibrary === 'function') {
              window.deleteAccessoryFromLibrary(id);
            }
          });
        });

        tbody.querySelectorAll('.cld-acc-lib-toggle-visibility').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (typeof window.toggleAccessoryVisibility === 'function') {
              window.toggleAccessoryVisibility(id);
            }
          });
        });
      }

      renderAccessoriesLibraryPagination(totalPages);
      updateAccessoriesCategoryFilter(allItems);

    } catch (error) {
      console.error('[CLD][accessories-library] Ошибка загрузки:', error);
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#ed5565;">Ошибка загрузки данных</td></tr>';
    }
  }

  function renderAccessoriesLibraryPagination(totalPages) {
    const paginationTop = document.getElementById('accessories-library-pagination-top');
    const paginationBottom = document.getElementById('accessories-library-pagination-bottom');
    const currentPage = accessoriesLibraryPage.currentPage;

    if (!paginationTop || !paginationBottom) return;

    let html = '';
    if (totalPages > 1) {
      html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="1">&lt;&lt;</a>
      </li>`;
      html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage - 1}">&lt;</a>
      </li>`;

      for (let i = 1; i <= Math.min(totalPages, 9); i++) {
        html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>`;
      }

      html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage + 1}">&gt;</a>
      </li>`;
      html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${totalPages}">&gt;&gt;</a>
      </li>`;
    }

    paginationTop.innerHTML = html;
    paginationBottom.innerHTML = html;

    [paginationTop, paginationBottom].forEach(pag => {
      pag.querySelectorAll('a.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const page = parseInt(link.getAttribute('data-page'));
          if (page && page !== currentPage && page >= 1 && page <= totalPages) {
            accessoriesLibraryPage.currentPage = page;
            loadAccessoriesLibrary();
          }
        });
      });
    });
  }

  function updateAccessoriesCategoryFilter(allItems) {
    const filter = document.getElementById('accessories-category-filter');
    if (!filter) return;

    const categories = [...new Set(allItems.map(item => item.category).filter(Boolean))];
    const currentValue = filter.value;

    filter.innerHTML = '<option value="">Нет</option>' +
      categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');

    if (currentValue) {
      filter.value = currentValue;
    }
  }

  function initAccessoriesLibraryHandlers() {
    const searchInput = document.getElementById('accessories-library-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        accessoriesLibraryPage.searchQuery = searchInput.value;
        accessoriesLibraryPage.currentPage = 1;
        loadAccessoriesLibrary();
      });
    }

    const categoryFilter = document.getElementById('accessories-category-filter');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', () => {
        accessoriesLibraryPage.categoryFilter = categoryFilter.value;
        accessoriesLibraryPage.currentPage = 1;
        loadAccessoriesLibrary();
      });
    }

    const perPageSelect = document.getElementById('accessories-per-page-select');
    if (perPageSelect) {
      perPageSelect.addEventListener('change', () => {
        accessoriesLibraryPage.perPage = parseInt(perPageSelect.value);
        accessoriesLibraryPage.currentPage = 1;
        loadAccessoriesLibrary();
      });
    }

    const addBtn = document.getElementById('accessories-library-add-btn');
    if (addBtn && !addBtn.getAttribute('data-cld-handler-attached')) {
      addBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof window.openAccessoryEditModal === 'function') {
          window.openAccessoryEditModal(null);
        } else {
          alert('Ошибка: функция открытия модального окна не найдена. Перезагрузите страницу.');
        }
      });
      addBtn.setAttribute('data-cld-handler-attached', 'true');
    }

    const saveBtn = document.getElementById('accessory-edit-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        if (typeof window.saveAccessoryFromModal === 'function') {
          window.saveAccessoryFromModal();
        }
      });
    }

    const exportBtn = document.getElementById('accessories-library-export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const lib = window.__cldAccessoriesLib || { types: [], items: {} };
        const json = JSON.stringify(lib, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'accessories.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
    }

    const importBtn = document.getElementById('accessories-library-import-btn');
    const importFile = document.getElementById('accessories-library-import-file');
    if (importBtn && importFile) {
      importBtn.addEventListener('click', () => importFile.click());
      importFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          const parsed = JSON.parse(text);
          window.__cldAccessoriesLib = parsed;
          loadAccessoriesLibrary();
          alert('Библиотека комплектующих успешно загружена!');
        } catch (error) {
          alert('Ошибка загрузки файла: ' + error.message);
        }
        e.target.value = '';
      });
    }

    const clearBtn = document.getElementById('accessories-library-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите очистить всю библиотеку комплектующих?')) {
          window.__cldAccessoriesLib = { types: [], items: {} };
          loadAccessoriesLibrary();
          alert('Библиотека очищена!');
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    initAccessoriesLibraryHandlers();
  });

  window.accessoriesLibraryPage = accessoriesLibraryPage;
  window.loadAccessoriesLibrary = loadAccessoriesLibrary;
  window.renderAccessoriesLibraryPagination = renderAccessoriesLibraryPagination;
  window.updateAccessoriesCategoryFilter = updateAccessoriesCategoryFilter;
})();
