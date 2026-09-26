/**
 * admin-catalog-types.js — Работа с типами элементов каталога (catalogs_keys)
 * Extracted from admin-new.html for better performance
 */
(function() {
  'use strict';

  // ============================================
  // Состояние и пагинация
  // ============================================
  const catalogTypesPagination = {
    currentPage: 1,
    perPage: 20,
    allData: []
  };

  // ============================================
  // Загрузка типов элементов
  // ============================================
  async function loadCatalogTypes() {
    try {
      const tbody = document.getElementById('catalog-types-table-body');
      if (!tbody) return;
      
      // Показываем загрузку
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Загрузка...</td></tr>';
      
      // Загружаем данные с API
      const response = await fetch('/api/catalog/items_get/catalogs_keys');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const allData = await response.json();
      console.log('✅ Данные типов элементов загружены:', allData);
      
      // Сохраняем все данные для пагинации
      catalogTypesPagination.allData = allData || [];
      
      // Применяем пагинацию
      renderCatalogTypesTable();
      
    } catch (error) {
      console.error('❌ Ошибка загрузки типов элементов:', error);
      
      // Fallback: список типов по умолчанию
      const fallbackTypes = [
        { id: 1, key: 'catalog_1', name: 'Кухни' },
        { id: 2, key: 'catalog_2', name: 'Двери кухонных модулей' },
        { id: 4, key: 'catalog_4', name: 'Полки' },
        { id: 5, key: 'catalog_5', name: 'Полкодержатели' },
        { id: 6, key: 'catalog_6', name: 'Петли накладные' },
        { id: 7, key: 'catalog_7', name: 'Опоры' },
        { id: 8, key: 'catalog_8', name: 'Двери для шкафов' },
        { id: 9, key: 'catalog_9', name: 'Шкафы' },
        { id: 10, key: 'catalog_10', name: 'Ящики для шкафов' },
        { id: 11, key: 'catalog_11', name: 'Полки и перегородки для шкафов' },
        { id: 12, key: 'catalog_12', name: 'Двери для углового модуля' },
        { id: 13, key: 'catalog_13', name: 'Петли угловые' },
        { id: 16, key: 'catalog_16', name: 'ШАБЛОНЫ КОРПУСОВ' },
        { id: 17, key: 'catalog_17', name: 'ШАБЛОНЫ КОРПУСОВ GOLA' },
        { id: 18, key: 'catalog_18', name: 'Сушки' },
        { id: 19, key: 'catalog_19', name: 'Профиль Gola' },
        { id: 20, key: 'catalog_20', name: 'Духовые шкафы' },
        { id: 21, key: 'catalog_21', name: 'Встроенные микроволновки' },
        { id: 22, key: 'catalog_22', name: 'Бутылочницы' },
        { id: 24, key: 'catalog_24', name: 'Ящики' }
      ];
      
      catalogTypesPagination.allData = fallbackTypes;
      renderCatalogTypesTable();
    }
  }

  // ============================================
  // Рендеринг таблицы типов элементов
  // ============================================
  function renderCatalogTypesTable() {
    const tbody = document.getElementById('catalog-types-table-body');
    if (!tbody) return;
    
    const { currentPage, perPage, allData } = catalogTypesPagination;
    
    // Очищаем таблицу
    tbody.innerHTML = '';
    
    // Если данных нет
    if (!allData || (Array.isArray(allData) && allData.length === 0)) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#999;">Нет данных</td></tr>';
      renderCatalogTypesPagination(0);
      return;
    }
    
    // Вычисляем индексы для текущей страницы
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const pageData = allData.slice(startIndex, endIndex);
    
    // Рендерим данные текущей страницы
    pageData.forEach(item => {
      const row = document.createElement('tr');
      
      // Чекбокс
      const checkboxCell = document.createElement('td');
      checkboxCell.style.width = '10px';
      checkboxCell.style.verticalAlign = 'middle';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = item.id;
      checkbox.className = 'catalog-type-checkbox';
      checkboxCell.appendChild(checkbox);
      
      // ID
      const idCell = document.createElement('td');
      idCell.style.width = '50px';
      idCell.style.verticalAlign = 'middle';
      idCell.textContent = item.id || '-';
      
      // Ключ (key)
      const keyCell = document.createElement('td');
      keyCell.style.verticalAlign = 'middle';
      keyCell.style.fontFamily = 'monospace';
      keyCell.style.fontSize = '12px';
      keyCell.textContent = item.key || `catalog_${item.id}` || '-';
      
      // Название
      const nameCell = document.createElement('td');
      nameCell.style.verticalAlign = 'middle';
      nameCell.textContent = item.name || '-';
      
      // Действия
      const actionsCell = document.createElement('td');
      actionsCell.className = 'col-actions';
      actionsCell.style.width = '150px';
      actionsCell.style.verticalAlign = 'middle';
      actionsCell.style.textAlign = 'center';
      
      // Редактировать
      const editLink = document.createElement('a');
      editLink.href = `#catalog-type-edit?id=${item.id}`;
      editLink.onclick = (e) => {
        e.preventDefault();
        openCatalogTypeEdit(item.id);
      };
      const editIcon = document.createElement('i');
      editIcon.className = 'fa fa-edit btn btn-outline btn-success';
      editIcon.title = 'Редактировать';
      editLink.appendChild(editIcon);
      
      // Удалить
      const deleteIcon = document.createElement('i');
      deleteIcon.className = 'fa fa-trash btn btn-outline btn-danger';
      deleteIcon.style.cursor = 'pointer';
      deleteIcon.style.marginLeft = '6px';
      deleteIcon.title = 'Удалить';
      deleteIcon.onclick = () => {
        if (typeof window.deleteCatalogType === 'function') {
          window.deleteCatalogType(item.id, item.name);
        } else {
          console.error('❌ Функция deleteCatalogType не найдена');
          alert('Ошибка: функция удаления не найдена. Перезагрузите страницу.');
        }
      };
      
      actionsCell.appendChild(editLink);
      actionsCell.appendChild(deleteIcon);
      
      // Добавляем ячейки в строку
      row.appendChild(checkboxCell);
      row.appendChild(idCell);
      row.appendChild(keyCell);
      row.appendChild(nameCell);
      row.appendChild(actionsCell);
      
      // Добавляем строку в таблицу
      tbody.appendChild(row);
    });
    
    console.log('✅ Таблица типов элементов отрендерена (страница', currentPage, 'из', Math.ceil(allData.length / perPage) + ')');
    
    // Обновляем подменю "Каталог элементов" с типами
    updateCatalogSubmenu(allData);
    
    // Рендерим пагинацию
    renderCatalogTypesPagination(allData.length);
  }

  // ============================================
  // Пагинация
  // ============================================
  function renderCatalogTypesPagination(totalItems) {
    const pagination = document.getElementById('catalog-types-pagination');
    if (!pagination) return;
    
    const { currentPage, perPage } = catalogTypesPagination;
    const totalPages = Math.ceil(totalItems / perPage);
    
    let html = '';
    if (totalPages > 1) {
      // Первая страница
      html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="1" title="Первая страница">&lt;&lt;</a>
      </li>`;
      // Предыдущая страница
      html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage - 1}" title="Предыдущая страница">&lt;</a>
      </li>`;
      
      // Номера страниц (показываем до 9 страниц)
      const maxPagesToShow = 9;
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      
      if (endPage - startPage < maxPagesToShow - 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>`;
      }
      
      // Следующая страница
      html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage + 1}" title="Следующая страница">&gt;</a>
      </li>`;
      // Последняя страница
      html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${totalPages}" title="Последняя страница">&gt;&gt;</a>
      </li>`;
    }
    
    pagination.innerHTML = html;
    
    // Обработчики кликов на пагинацию
    pagination.querySelectorAll('a.page-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = parseInt(link.getAttribute('data-page'));
        if (page && page !== currentPage && page >= 1 && page <= totalPages) {
          catalogTypesPagination.currentPage = page;
          renderCatalogTypesTable();
        }
      });
    });
  }

  // ============================================
  // Обновление подменю "Каталог элементов"
  // ============================================
  function updateCatalogSubmenu(catalogTypes) {
    const submenu = document.getElementById('catalog-submenu');
    if (!submenu) {
      console.warn('⚠️ Подменю "Каталог элементов" не найдено');
      return;
    }
    
    // Удаляем старые динамические типы (сохраняем "Типы элементов" и "Группы")
    const existingDynamicItems = submenu.querySelectorAll('li[data-catalog-type]');
    existingDynamicItems.forEach(item => item.remove());
    
    if (!catalogTypes || !Array.isArray(catalogTypes) || catalogTypes.length === 0) {
      console.log('📋 Нет типов элементов для добавления в меню');
      return;
    }
    
    // Добавляем каждый тип элемента в меню
    catalogTypes.forEach(type => {
      const key = type.key || `catalog_${type.id}`;
      const name = type.name || '';
      
      // Создаем элемент меню
      const li = document.createElement('li');
      li.setAttribute('data-catalog-type', key);
      li.style.position = 'relative';
      
      // Создаем ссылку
      const link = document.createElement('a');
      link.href = `#catalog-items?type=${key}`;
      link.textContent = name;
      link.setAttribute('data-page', 'catalog-items');
      link.setAttribute('data-catalog-type', key);
      link.setAttribute('data-catalog-name', name);
      li.appendChild(link);
      
      // Создаем кнопку "Категории"
      const catButton = document.createElement('div');
      catButton.className = 'cat_button';
      catButton.title = `Категории ${name}`;
      const catButtonLink = document.createElement('a');
      catButtonLink.href = `#catalog-categories?type=${key}`;
      catButtonLink.innerHTML = '<i class="fa fa-folder-open-o"></i>';
      catButton.appendChild(catButtonLink);
      li.appendChild(catButton);
      
      // Добавляем в подменю
      submenu.appendChild(li);
    });
    
    console.log('✅ Подменю "Каталог элементов" обновлено, добавлено типов:', catalogTypes.length);
  }

  // ============================================
  // Открытие страницы редактирования типа элемента
  // ============================================
  window.openCatalogTypeEdit = function openCatalogTypeEdit(itemId = 0) {
    // Скрываем все страницы
    document.querySelectorAll('.admin-page').forEach(page => {
      page.classList.remove('active');
    });
    
    // Показываем страницу редактирования
    const editPage = document.getElementById('catalog-type-edit');
    if (editPage) {
      editPage.classList.add('active');
      
      // Обновляем URL
      window.history.pushState({ page: 'catalog-type-edit' }, '', `#catalog-type-edit?id=${itemId}`);
      
      // Загружаем данные
      loadCatalogTypeEdit(itemId);
    }
  };

  // ============================================
  // Загрузка данных для редактирования
  // ============================================
  async function loadCatalogTypeEdit(itemId) {
    try {
      const itemIdInput = document.getElementById('catalog-type-item-id');
      const nameInput = document.getElementById('catalog-type-name');
      const keyInput = document.getElementById('catalog-type-key');
      const orderInput = document.getElementById('catalog-type-order');
      const activeInput = document.getElementById('catalog-type-active');
      const titleElement = document.getElementById('catalog-type-edit-title');
      const submitUrlInput = document.getElementById('form_submit_url');
      
      if (!itemIdInput || !nameInput || !orderInput || !activeInput || !titleElement || !submitUrlInput) {
        console.error('❌ Элементы формы не найдены');
        return;
      }
      
      itemIdInput.value = itemId;
      
      if (itemId === '0' || itemId === 0) {
        // Режим добавления
        titleElement.textContent = 'Добавить Тип элемента';
        nameInput.value = '';
        if (keyInput) keyInput.value = '';
        orderInput.value = '0';
        activeInput.checked = true;
        submitUrlInput.value = '/api/catalog/item_add/catalogs_keys/';
      } else {
        // Режим редактирования
        titleElement.textContent = `Редактировать Тип элемента #${itemId}`;
        submitUrlInput.value = `/api/catalog/item_edit/catalogs_keys/${itemId}`;
        
        // Загружаем данные элемента
        const response = await fetch(`/api/catalog/item/catalogs_keys/${itemId}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const item = await response.json();
        console.log('✅ Данные типа элемента загружены:', item);
        
        nameInput.value = item.name || '';
        if (keyInput) keyInput.value = item.key || `catalog_${item.id}` || '';
        orderInput.value = item.order || '0';
        activeInput.checked = item.active !== undefined ? item.active == 1 : true;
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки типа элемента:', error);
      alert(`Ошибка загрузки: ${error.message}`);
    }
  }

  // ============================================
  // Сохранение типа элемента
  // ============================================
  async function saveCatalogType(exitAfterSave = false) {
    try {
      const itemId = document.getElementById('catalog-type-item-id').value;
      const name = document.getElementById('catalog-type-name').value;
      const keyInput = document.getElementById('catalog-type-key');
      const key = keyInput ? keyInput.value.trim() : '';
      const order = document.getElementById('catalog-type-order').value;
      const active = document.getElementById('catalog-type-active').checked ? '1' : '0';
      const submitUrl = document.getElementById('form_submit_url').value;
      
      if (!name || name.trim() === '') {
        alert('Введите название типа элемента');
        return;
      }
      
      const data = {
        name: name.trim(),
        order: parseInt(order) || 0,
        active: active
      };
      if (key) data.key = key;
      
      const formData = new FormData();
      formData.append('data', JSON.stringify(data));
      
      const response = await fetch(submitUrl, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Тип элемента сохранен:', result);
      
      if (typeof toastr !== 'undefined') {
        toastr.success('Тип элемента успешно сохранен');
      } else {
        alert('Тип элемента успешно сохранен');
      }
      
      if (exitAfterSave) {
        // Возвращаемся к списку и обновляем его
        window.location.hash = '#catalog-types';
        setTimeout(() => {
          loadCatalogTypes();
        }, 100);
      } else {
        // Обновляем ID элемента после создания (если это был новый элемент)
        if (result.item && result.item.id) {
          document.getElementById('catalog-type-item-id').value = result.item.id;
          // Обновляем заголовок
          const titleElement = document.getElementById('catalog-type-edit-title');
          if (titleElement) {
            titleElement.textContent = `Редактировать Тип элемента #${result.item.id}`;
          }
          // Обновляем URL формы для редактирования
          const submitUrlInput = document.getElementById('form_submit_url');
          if (submitUrlInput) {
            submitUrlInput.value = `/api/catalog/item_edit/catalogs_keys/${result.item.id}`;
          }
        }
      }
    } catch (error) {
      console.error('❌ Ошибка сохранения типа элемента:', error);
      alert(`Ошибка сохранения: ${error.message}`);
    }
  }

  // ============================================
  // Удаление типа элемента
  // ============================================
  window.deleteCatalogType = async function deleteCatalogType(itemId, itemName) {
    // Используем sweetalert если доступен, иначе confirm
    if (typeof swal !== 'undefined') {
      swal({
        title: "Вы уверены?",
        text: `Вы действительно хотите удалить тип элемента "${itemName}"?`,
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        cancelButtonText: "Нет",
        confirmButtonText: "Да",
        closeOnConfirm: true
      }, async function(isConfirm) {
        if (isConfirm) {
          await performDeleteCatalogType(itemId);
        }
      });
    } else {
      // Fallback на обычный confirm
      if (confirm(`Вы уверены, что хотите удалить тип элемента "${itemName}"?`)) {
        await performDeleteCatalogType(itemId);
      }
    }
  };

  async function performDeleteCatalogType(itemId) {
    try {
      console.log('🗑️ Удаление типа элемента, ID:', itemId);
      
      const response = await fetch(`/api/catalog/item_delete/catalogs_keys/${itemId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Тип элемента удален:', result);
      
      if (typeof toastr !== 'undefined') {
        toastr.success('Тип элемента успешно удален');
      } else {
        alert('Тип элемента успешно удален');
      }
      
      // Обновляем список
      loadCatalogTypes();
    } catch (error) {
      console.error('❌ Ошибка удаления типа элемента:', error);
      if (typeof toastr !== 'undefined') {
        toastr.error(`Ошибка удаления: ${error.message}`);
      } else {
        alert(`Ошибка удаления: ${error.message}`);
      }
    }
  }

  // ============================================
  // Инициализация
  // ============================================
  document.addEventListener('DOMContentLoaded', function() {
    // Обработчики кнопок сохранения
    const saveCatalogTypeBtn = document.getElementById('save-catalog-type-btn');
    if (saveCatalogTypeBtn) {
      saveCatalogTypeBtn.addEventListener('click', () => saveCatalogType(false));
    }
    
    const saveAndExitCatalogTypeBtn = document.getElementById('save-and-exit-catalog-type-btn');
    if (saveAndExitCatalogTypeBtn) {
      saveAndExitCatalogTypeBtn.addEventListener('click', () => saveCatalogType(true));
    }
  });

  // Экспорт функций для глобального использования
  window.loadCatalogTypes = loadCatalogTypes;
  window.updateCatalogSubmenu = updateCatalogSubmenu;

})();
