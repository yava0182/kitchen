/**
 * Логика админ-панели
 */

console.log('📦 Загрузка admin-panel.js...');

(function() {
  'use strict';
  
  console.log('✅ admin-panel.js загружен и выполняется');
  
  // Состояние админ-панели
  const adminState = {
    currentSection: null,
    currentCatalogType: null,
    currentTab: 'main'
  };
  
  /**
   * Инициализация админ-панели
   */
  function initAdminPanel() {
    console.log('🚀 Инициализация админ-панели');
    
    // Добавляем стили для активных пунктов меню
    addMenuStyles();
    
    // Инициализируем меню
    initSidebarMenu();
    
    // Загружаем состояние из URL
    loadStateFromURL();
    
    // Обновляем подменю каталога при инициализации
    setTimeout(() => {
      console.log('🔄 Обновляем подменю каталога');
      updateCatalogSubmenu();
      // ⭐ УБРАНО: setInterval для периодического обновления (вызывал постоянные логи)
      // Типы каталога загружаются из localStorage синхронно, периодическое обновление не нужно
    }, 500);
    
    console.log('✅ Админ-панель инициализирована');
  }
  
  /**
   * Добавление стилей для меню
   */
  function addMenuStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .navbar-default .nav > li > a:hover {
        background: rgba(255,255,255,0.1) !important;
      }
      
      .navbar-default .nav > li.active > a {
        background: #18bc9c !important;
      }
      
      .navbar-default .nav-second-level li > a:hover {
        background: rgba(255,255,255,0.05) !important;
        color: #fff !important;
      }
      
      .navbar-default .nav-second-level li.active > a {
        background: #18bc9c !important;
        color: #fff !important;
      }
      
      .fa.arrow:before {
        content: "\\f107";
        font-family: "Font Awesome 6 Free";
        font-weight: 900;
      }
      
      .navbar-default .nav > li.active > a .fa.arrow:before {
        content: "\\f106";
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * Инициализация левого меню
   */
  function initSidebarMenu() {
    const menuItems = document.querySelectorAll('.navbar-default .nav > li > a');
    
    menuItems.forEach((item, index) => {
      item.addEventListener('click', function(e) {
        // Не обрабатываем клики по подпунктам (они обрабатываются в initCatalogSubmenu)
        if (this.closest('.nav-second-level')) {
          return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        const label = this.querySelector('.nav-label')?.textContent || this.textContent;
        const menuItem = this.closest('li');
        const submenu = menuItem.querySelector('.nav-second-level');
        const hasSubmenu = submenu && submenu.children.length > 0;
        
        // Если есть подменю, переключаем его видимость
        if (hasSubmenu) {
          const isActive = menuItem.classList.contains('active');
          
          // Убираем active со всех пунктов меню
          document.querySelectorAll('.navbar-default .nav > li').forEach(li => {
            li.classList.remove('active');
            const sub = li.querySelector('.nav-second-level');
            if (sub) {
              sub.style.display = 'none';
            }
          });
          
          // Переключаем текущий пункт
          if (!isActive) {
            menuItem.classList.add('active');
            submenu.style.display = 'block';
            
            // Инициализируем обработчики для подменю
            initCatalogSubmenu();
          }
        } else {
          // Если нет подменю, переключаем раздел
          document.querySelectorAll('.navbar-default .nav > li').forEach(li => {
            li.classList.remove('active');
            const sub = li.querySelector('.nav-second-level');
            if (sub) {
              sub.style.display = 'none';
            }
          });
          menuItem.classList.add('active');
          
          const sectionName = this.querySelector('.nav-label')?.textContent.trim();
          
          if (sectionName) {
            handleSectionChange(sectionName);
          }
        }
      });
    });
    
    // Инициализируем обработчики для "Каталог элементов" при загрузке
    const catalogMenuItem = document.querySelector('.navbar-default .nav > li.active');
    if (catalogMenuItem) {
      const submenu = catalogMenuItem.querySelector('.nav-second-level');
      if (submenu) {
        initCatalogSubmenu();
      }
    }
  }
  
  /**
   * Обновление подменю "Каталог элементов" - добавляет типы каталога динамически
   */
  function updateCatalogSubmenu() {
    const catalogSubmenu = document.querySelector('.navbar-default .nav-second-level');
    if (!catalogSubmenu) {
      console.warn('⚠️ [updateCatalogSubmenu] Подменю каталога не найдено');
      return;
    }
    
    // Находим маркер для вставки динамических типов
    const marker = catalogSubmenu.querySelector('li:has(+ li[data-dynamic-marker])') || 
                   catalogSubmenu.querySelector('li:last-child');
    
    // Удаляем старые динамические типы
    catalogSubmenu.querySelectorAll('li[data-catalog-type]').forEach(li => li.remove());
    
    // Загружаем типы каталога
    let catalogTypes = [];
    try {
      if (window.loadCatalogTypes && typeof window.loadCatalogTypes === 'function') {
        catalogTypes = window.loadCatalogTypes();
      } else {
        const typesJson = localStorage.getItem('catalogTypes');
        if (typesJson) {
          catalogTypes = JSON.parse(typesJson);
        }
      }
    } catch (e) {
      console.error('❌ [updateCatalogSubmenu] Ошибка загрузки типов каталога:', e);
    }
    
    // ⭐ УБРАНО: Лог загрузки типов (слишком частый, засоряет консоль)
    // console.log('📋 [updateCatalogSubmenu] Загружено типов каталога:', catalogTypes.length);
    
    // Добавляем типы в подменю
    catalogTypes.forEach(type => {
      const li = document.createElement('li');
      li.style.position = 'relative';
      li.setAttribute('data-catalog-type', type.id);
      
      const a = document.createElement('a');
      a.href = '#';
      a.style.cssText = 'display:block; padding:8px 20px 8px 46px; text-decoration:none; font-size:13px; transition:all 0.2s;';
      a.textContent = type.name || type.id;
      
      a.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const subItem = this.closest('li');
        const typeId = type.id;
        const typeName = type.name || type.id;
        
        // Убираем active со всех подпунктов
        document.querySelectorAll('.navbar-default .nav-second-level li').forEach(li => {
          li.classList.remove('active');
        });
        
        // Добавляем active текущему
        subItem.classList.add('active');
        
        // Открываем страницу со списком элементов - строго по референсу
        if (window.openTypeItemsModal && typeof window.openTypeItemsModal === 'function') {
          hideAllAdminContent();
          window.openTypeItemsModal(typeId, typeName);
        }
      });
      
      li.appendChild(a);
      
      // Вставляем после маркера или в конец
      if (marker && marker.nextSibling) {
        catalogSubmenu.insertBefore(li, marker.nextSibling);
      } else {
        catalogSubmenu.appendChild(li);
      }
    });
    
    // ⭐ УБРАНО: Лог обновления подменю (слишком частый, засоряет консоль)
    // console.log('✅ [updateCatalogSubmenu] Подменю обновлено, добавлено типов:', catalogTypes.length);
  }
  
  /**
   * Инициализация подменю "Каталог элементов" - строго по референсу
   */
  function initCatalogSubmenu() {
    updateCatalogSubmenu();
    
    const catalogSubItems = document.querySelectorAll('.navbar-default .nav-second-level li > a');
    
    catalogSubItems.forEach((item) => {
      if (item.hasAttribute('data-handler-attached')) {
        return;
      }
      
      item.setAttribute('data-handler-attached', 'true');
      
      item.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const subItem = this.closest('li');
        const catalogType = this.textContent.trim();
        
        // Убираем active со всех подпунктов
        document.querySelectorAll('.navbar-default .nav-second-level li').forEach(li => {
          li.classList.remove('active');
        });
        
        // Добавляем active текущему
        subItem.classList.add('active');
        
        // Проверяем, является ли это динамическим типом каталога
        const typeId = subItem.getAttribute('data-catalog-type');
        if (typeId && catalogType !== 'Типы элементов' && catalogType !== 'Группы') {
          // Динамический тип - открываем страницу со списком элементов
          if (window.openTypeItemsModal && typeof window.openTypeItemsModal === 'function') {
              hideAllAdminContent();
            window.openTypeItemsModal(typeId, catalogType);
            return;
          }
        }
        
        // Для "Типы элементов" и "Группы" открываем страницы
        showCatalogModal(catalogType);
      });
    });
  }
  
  /**
   * Универсальная функция: скрыть все контенты админки
   * Вызывается перед открытием любого нового раздела
   * По образцу Clodis: удаляем модалки из DOM, а не просто скрываем
   */
  function hideAllAdminContent() {
    // ⭐ ИСКЛЮЧАЕМ HTML страницы админки (clients-orders-container, constructor-code-container и т.д.)
    // Они управляются отдельно, не через JS создание
    
    // Скрываем все страницы каталога - строго по референсу
    const containers = [
      'type-elements-container',
      'element-types-container',
      'catalog-groups-container',
      'catalog-item-edit-container'
    ];
    
    containers.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = 'none';
    }
    });
    
    // Закрываем динамические модалки
    if (window.ModalManager && typeof window.ModalManager.closeAllModals === 'function') {
      window.ModalManager.closeAllModals();
    }
    
    // Удаляем старые модалки из DOM
    const oldModals = [
      'type-elements-backdrop',
      'type-elements-backdrop-dynamic',
      'admin-section-container',
      'materials-manager-backdrop',
      'materials-manager'
    ];
    
    oldModals.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.remove();
      }
    });
  }
  
  /**
   * Показать страницу каталога - строго по референсу
   */
  function showCatalogModal(catalogType) {
    hideAllAdminContent();
    
    // "Типы элементов" -> открываем страницу element-types-container
    if (catalogType === 'Типы элементов') {
      const typesContainer = document.getElementById('element-types-container');
      if (typesContainer) {
        typesContainer.style.display = 'block';
          if (window.renderElementTypes && typeof window.renderElementTypes === 'function') {
            setTimeout(() => window.renderElementTypes(''), 100);
          }
        }
        return;
    }
    
    // "Группы" -> открываем страницу catalog-groups-container
    if (catalogType === 'Группы') {
      const groupsContainer = document.getElementById('catalog-groups-container');
      if (groupsContainer) {
        groupsContainer.style.display = 'block';
          if (window.renderCatalogGroups && typeof window.renderCatalogGroups === 'function') {
            setTimeout(() => window.renderCatalogGroups(''), 100);
          }
        }
        return;
      }
    }
    
  /**
   * Обработка переключения раздела
   */
  function handleSectionChange(sectionName) {
    console.log('🔄 Переключение раздела:', sectionName);
    
    // ⭐ СКРЫВАЕМ ВСЕ КОНТЕНТЫ ПЕРЕД ОТКРЫТИЕМ НОВОГО РАЗДЕЛА
    hideAllAdminContent();
    
    // ⭐ "Заявки на расчет" - используем HTML страницу (по референсу, без кнопки "Добавить" и поиска)
    if (sectionName === 'Заявки на расчет') {
      // Скрываем #app
      const appContainer = document.getElementById('app');
      if (appContainer) {
        appContainer.style.display = 'none';
          }
      // Скрываем admin-section-container если есть (JS созданный)
      const adminSectionContainer = document.getElementById('admin-section-container');
      if (adminSectionContainer) {
        adminSectionContainer.style.display = 'none';
      }
      // Скрываем все другие HTML страницы админки
      const allAdminPages = document.querySelectorAll('[id$="-container"]');
      allAdminPages.forEach(page => {
        if (page.id !== 'clients-orders-container') {
          page.style.display = 'none';
        }
      });
      // Показываем HTML страницу "Заявки на расчет"
      const clientsOrdersPage = document.getElementById('clients-orders-container');
      if (clientsOrdersPage) {
        clientsOrdersPage.style.display = 'block';
        console.log('✅ Показана HTML страница "Заявки на расчет"');
        adminState.currentSection = 'requests';
        saveStateToURL();
      return;
      } else {
        console.error('❌ HTML страница clients-orders-container не найдена!');
      }
    }
    
    // Маппинг названий разделов на ключи
    const sectionMap = {
      'Заявки на расчет': 'requests',
      'Код конструктора': 'constructor_code',
      'Настройки конструктора': 'constructor_settings',
      'Расчет цен': 'pricing',
      'Настройка меню': 'menu_settings',
      'Пользователи': 'users',
      'Глобальные переменные': 'global_vars',
      'Каталог элементов': 'catalog',
      'Плитные материалы': 'materials',
      'Кромки': 'edges',
      'Шаблоны присадки': 'drilling_templates',
      'Каталог 3D моделей': 'models',
      'Фасады': 'facades',
      'Карниз': 'cornice',
      'Столешница': 'tabletop',
      'Цоколь': 'plinth',
      'Ручки': 'handles'
    };
    
    const sectionKey = sectionMap[sectionName] || sectionName.toLowerCase().replace(/\s+/g, '_');
    console.log('  - Ключ раздела:', sectionKey);
    
    adminState.currentSection = sectionKey;
    
    // ⭐ УДАЛЕН СТАРЫЙ КОД: больше не создаем страницы динамически через showSectionTable
    // Теперь используем только HTML страницы по референсу
    
    // ⭐ Обработка других HTML страниц админки (будут добавлены по мере реализации)
    if (sectionKey === 'constructor_code') {
      const page = document.getElementById('constructor-code-container');
      if (page) {
        document.getElementById('app').style.display = 'none';
        hideAllAdminContent();
        page.style.display = 'block';
        saveStateToURL();
        return;
      }
    } else if (sectionKey === 'constructor_settings') {
      const page = document.getElementById('constructor-settings-container');
      if (page) {
        document.getElementById('app').style.display = 'none';
        hideAllAdminContent();
        page.style.display = 'block';
        saveStateToURL();
        return;
      }
    }
    
    // ⭐ Для остальных разделов - заглушка (будут добавлены HTML страницы по референсу)
    console.log('  - ⚠️ Раздел "' + sectionName + '" еще не реализован (нужна HTML страница по референсу)');
    
    saveStateToURL();
    console.log('  - ✅ handleSectionChange завершена');
  }
  
  /**
   * Показать раздел с таблицей
   */
  function showSectionTable(sectionName, sectionKey) {
    console.log('📊 showSectionTable вызвана');
    console.log('  - sectionName:', sectionName);
    console.log('  - sectionKey:', sectionKey);
    console.log('  - window.AdminSections доступен:', typeof window.AdminSections !== 'undefined');
    
    // ⭐ СКРЫВАЕМ ВСЕ ДРУГИЕ КОНТЕНТЫ ПЕРЕД ОТКРЫТИЕМ РАЗДЕЛА
    hideAllAdminContent();
    
    if (window.AdminSections) {
      console.log('  - Доступные ключи AdminSections:', Object.keys(window.AdminSections));
      console.log('  - AdminSections[' + sectionKey + ']:', window.AdminSections[sectionKey]);
      console.log('  - Проверка наличия ключа:', {
        hasKey: typeof window.AdminSections[sectionKey] !== 'undefined',
        keys: Object.keys(window.AdminSections).filter(k => k.includes('global') || k.includes('var'))
      });
    } else {
      console.error('  - ❌ window.AdminSections не определен!');
      showSectionPlaceholder(sectionName, sectionKey);
      return;
    }
    
    // Проверяем, есть ли шаблон для этого раздела
    if (!window.AdminSections || !window.AdminSections[sectionKey]) {
      console.warn('  - ⚠️ Шаблон для раздела не найден, показываем заглушку');
      console.warn('  - Доступные разделы:', Object.keys(window.AdminSections));
      showSectionPlaceholder(sectionName, sectionKey);
      return;
    }
    
    // Удаляем старый контейнер, если есть
    const oldContainer = document.getElementById('admin-section-container');
    if (oldContainer) {
      oldContainer.remove();
    }
    
    const sectionConfig = window.AdminSections[sectionKey];
    console.log('  - Конфигурация раздела:', sectionConfig);
    
    // Создаем контейнер для раздела
    const container = document.createElement('div');
    container.id = 'admin-section-container';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 250px;
      right: 0;
      bottom: 0;
      background: #f9fafb;
      z-index: 100;
      overflow: auto;
    `;
    
    // Генерируем HTML таблицы
    const tableHtml = window.AdminSections.createTableSection({
      title: sectionConfig.title,
      columns: sectionConfig.columns,
      items: loadSectionData(sectionConfig.storageKey),
      addButtonText: 'Добавить',
      onAdd: () => console.log('Add clicked'),
      onEdit: (id) => console.log('Edit clicked', id),
      onDelete: (id) => console.log('Delete clicked', id)
    });
    
    container.innerHTML = tableHtml;
    document.body.appendChild(container);
    
    // Заполняем таблицу данными
    renderTableData(sectionConfig);
    
    // Подключаем обработчик к кнопке "Добавить"
    // ⚠️ ВАЖНО: Используем setTimeout, чтобы убедиться, что DOM обновлен
    setTimeout(() => {
      const addBtn = container.querySelector('.admin-add-btn');
      console.log('  - 🔍 Поиск кнопки "Добавить":', {
        found: !!addBtn,
        container: container.id,
        sectionKey: sectionKey
      });
      
      if (addBtn) {
        console.log('  - ✅ Кнопка "Добавить" найдена, добавляем обработчик');
        addBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('  - 🆕 Кнопка "Добавить" нажата для раздела:', sectionKey);
          console.log('  - 📋 Конфигурация:', sectionConfig);
          try {
            showAddEditModal(sectionKey, sectionConfig);
          } catch (error) {
            console.error('  - ❌ Ошибка при открытии модального окна:', error);
            alert('Ошибка при открытии модального окна: ' + error.message);
          }
        });
      } else {
        console.error('  - ❌ Кнопка "Добавить" не найдена!');
        console.log('  - 🔍 HTML контейнера:', container.innerHTML.substring(0, 500));
      }
    }, 100);
    
    console.log('✅ Таблица раздела отображена');
  }
  
  /**
   * Показать заглушку для нереализованного раздела
   */
  function showSectionPlaceholder(sectionName, sectionKey) {
    console.log('📢 showSectionPlaceholder вызвана');
    
    // Удаляем старый контейнер, если есть
    const oldContainer = document.getElementById('admin-section-container');
    if (oldContainer) {
      oldContainer.remove();
    }
    
    // Создаем заглушку
    const container = document.createElement('div');
    container.id = 'admin-section-container';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 250px;
      right: 0;
      bottom: 0;
      background: #f9fafb;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    container.innerHTML = `
      <div style="background:white; padding:40px; border-radius:8px; box-shadow:0 4px 20px rgba(0,0,0,0.15); max-width:500px; text-align:center;">
        <h2 style="margin-bottom:16px; font-size:24px; color:#111;">${sectionName}</h2>
        <p style="margin-bottom:24px; color:#666; font-size:14px;">
          Раздел "${sectionName}" будет реализован в ближайшее время.
        </p>
        <button class="back-to-catalog-btn" 
                style="padding:10px 20px; background:#2563eb; color:white; border:none; border-radius:6px; cursor:pointer; font-size:14px;">
          Закрыть
        </button>
      </div>
    `;
    
    container.querySelector('.back-to-catalog-btn').addEventListener('click', function() {
      container.remove();
    });
    
    document.body.appendChild(container);
    console.log('✅ Заглушка отображена');
  }
  
  /**
   * Загрузить данные раздела из localStorage
   */
  function loadSectionData(storageKey) {
    try {
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Ошибка загрузки данных:', e);
      return [];
    }
  }
  
  /**
   * Отрисовать данные в таблице
   */
  function renderTableData(sectionConfig) {
    console.log('📊 renderTableData вызвана для:', sectionConfig.storageKey);
    const tbody = document.querySelector('.admin-table-body');
    if (!tbody) {
      console.warn('  - ⚠️ tbody не найден!');
      return;
    }
    console.log('  - ✅ tbody найден');
    
    const data = loadSectionData(sectionConfig.storageKey);
    console.log('  - Данные для таблицы:', data);
    console.log('  - Количество элементов:', data.length);
    
    tbody.innerHTML = '';
    
    data.forEach(item => {
      const row = document.createElement('tr');
      row.style.borderBottom = '1px solid #e5e7eb';
      
      // Чекбокс
      row.innerHTML = `
        <td style="padding:12px; text-align:center;">
          <input type="checkbox" data-id="${item.id}">
        </td>
      `;
      
      // Данные по колонкам
      sectionConfig.columns.forEach(col => {
        const td = document.createElement('td');
        td.style.padding = '12px';
        td.style.fontSize = '13px';
        td.style.color = '#374151';
        
        let value = item[col.key];
        
        // Специальная обработка для некоторых типов
        if (col.key === 'icon' || col.key === 'preview') {
          if (item.icon) {
            value = `<div style="width:40px; height:40px; background:#e5e7eb; border-radius:4px; overflow:hidden;">
              <img src="${item.icon}" style="width:100%; height:100%; object-fit:cover;">
            </div>`;
          } else {
            value = '<div style="width:40px; height:40px; background:#e5e7eb; border-radius:4px; display:flex; align-items:center; justify-content:center;"><i class="fa fa-image" style="color:#9ca3af;"></i></div>';
          }
        } else if (col.key === 'active') {
          value = item.active ? '✅ Да' : '❌ Нет';
        }
        
        td.innerHTML = value || '-';
        row.appendChild(td);
      });
      
      // Действия
      const actionsCell = document.createElement('td');
      actionsCell.style.padding = '12px';
      actionsCell.style.textAlign = 'center';
      actionsCell.innerHTML = `
        <button class="edit-btn" data-id="${item.id}" style="padding:4px 8px; margin:0 2px; border:1px solid #d0d7e2; border-radius:4px; background:#fff; cursor:pointer; font-size:12px;">
          Изменить
        </button>
        <button class="delete-btn" data-id="${item.id}" style="padding:4px 8px; margin:0 2px; border:1px solid #d0d7e2; border-radius:4px; background:#fff; cursor:pointer; font-size:12px;">
          Удалить
        </button>
      `;
      
      // Обработчики для кнопок
      const editBtn = actionsCell.querySelector('.edit-btn');
      const deleteBtn = actionsCell.querySelector('.delete-btn');
      
      editBtn.addEventListener('click', () => {
        console.log('  - ✏️ Редактирование элемента:', item.id);
        showAddEditModal(sectionConfig.storageKey.replace('clodis_', ''), sectionConfig, item.id);
      });
      
      deleteBtn.addEventListener('click', () => {
        if (confirm('Удалить элемент?')) {
          console.log('  - 🗑️ Удаление элемента:', item.id);
          const data = loadSectionData(sectionConfig.storageKey);
          const index = data.findIndex(i => i.id === item.id);
          if (index !== -1) {
            data.splice(index, 1);
            localStorage.setItem(sectionConfig.storageKey, JSON.stringify(data));
            renderTableData(sectionConfig);
            console.log('  - ✅ Элемент удален');
          }
        }
      });
      
      row.appendChild(actionsCell);
      
      tbody.appendChild(row);
    });
    
    // Обновляем счетчик
    const itemsTotal = document.querySelector('.items-total');
    if (itemsTotal) {
      itemsTotal.textContent = data.length;
    }
  }
  
  /**
   * Показать модальное окно добавления/редактирования
   */
  function showAddEditModal(sectionKey, sectionConfig, itemId = null) {
    console.log('📝 showAddEditModal вызвана');
    console.log('  - sectionKey:', sectionKey);
    console.log('  - sectionConfig:', sectionConfig);
    console.log('  - itemId:', itemId);
    
    // Проверяем, что sectionConfig передан
    if (!sectionConfig) {
      console.error('❌ showAddEditModal: sectionConfig не передан!');
      alert('Ошибка: конфигурация раздела не найдена');
      return;
    }
    
    // Загружаем данные
    const data = loadSectionData(sectionConfig.storageKey);
    const item = itemId ? data.find(i => i.id === itemId) : null;
    const isEdit = !!item;
    
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.id = 'admin-edit-modal';
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    // Функция для экранирования HTML
    function escapeHtml(text) {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    
    // Формируем поля формы в зависимости от раздела
    let formFields = '';
    
    if (sectionKey === 'global_vars') {
      // Форма для глобальных переменных
      formFields = `
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Ключ *</label>
          <input type="text" id="field-key" value="${item ? item.key : ''}" 
            placeholder="variable_key" 
            style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px;">
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Название *</label>
          <input type="text" id="field-name" value="${item ? item.name : ''}" 
            placeholder="Название переменной" 
            style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px;">
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Значение</label>
          <input type="text" id="field-value" value="${item ? item.value : ''}" 
            placeholder="Значение переменной" 
            style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px;">
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Тип *</label>
          <select id="field-type" 
            style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px;">
            <option value="number" ${item && item.type === 'number' ? 'selected' : ''}>Число</option>
            <option value="boolean" ${item && item.type === 'boolean' ? 'selected' : ''}>Логическое</option>
            <option value="string" ${item && item.type === 'string' ? 'selected' : ''}>Строка</option>
          </select>
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Единица измерения</label>
          <input type="text" id="field-unit" value="${item ? (item.unit || '') : ''}" 
            placeholder="мм, м, кг и т.д." 
            style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px;">
        </div>
      `;
    } else if (sectionKey === 'materials') {
      formFields = `
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Название *</label>
          <input type="text" id="field-name" value="${item ? item.name : ''}" 
            placeholder="Дуб Гудзон бискотти" 
            style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px;">
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Артикул</label>
          <input type="text" id="field-code" value="${item ? item.code : ''}" 
            placeholder="K527" 
            style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px;">
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Категория *</label>
          <select id="field-category" 
            style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px;">
            <option value="Clodis" ${item && item.category === 'Clodis' ? 'selected' : ''}>Clodis</option>
            <option value="Egger" ${item && item.category === 'Egger' ? 'selected' : ''}>Egger</option>
            <option value="Kronospan" ${item && item.category === 'Kronospan' ? 'selected' : ''}>Kronospan</option>
          </select>
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Порядок</label>
          <input type="number" id="field-order" value="${item ? item.order : '1'}" 
            placeholder="1" 
            style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px;">
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Иконка</label>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div id="icon-preview" style="width: 80px; height: 80px; border: 2px dashed #d0d7e2; border-radius: 4px; display: flex; align-items: center; justify-content: center; background: #f9fafb; overflow: hidden; flex-shrink: 0;">
              ${item && item.icon ? `<img src="${item.icon}" style="width: 100%; height: 100%; object-fit: cover;">` : '<i class="fa fa-image" style="font-size: 24px; color: #9ca3af;"></i>'}
            </div>
            <div style="flex: 1;">
              <input type="file" id="field-icon-file" accept="image/*" style="display: none;">
              <button type="button" id="upload-icon-btn" style="width: 100%; padding: 8px 12px; border: 1px solid #d0d7e2; border-radius: 4px; background: #fff; cursor: pointer; font-size: 13px; color: #374151; margin-bottom: 8px;">
                <i class="fa fa-folder-open"></i> Выбрать изображение
              </button>
              <div style="font-size: 12px; color: #6b7280;">Рекомендуемый размер: 256x256px</div>
              <input type="hidden" id="field-icon" value="${item && item.icon ? item.icon : ''}">
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: flex; align-items: center; cursor: pointer;">
            <input type="checkbox" id="field-active" ${item && item.active !== false ? 'checked' : ''} 
              style="margin-right: 8px;">
            <span style="font-size: 14px; font-weight: 500;">Отображать в конструкторе?</span>
          </label>
        </div>
      `;
    } else {
      // Универсальная форма для других разделов
      formFields = sectionConfig.columns.filter(col => col.key !== 'id').map(col => `
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">${col.label}</label>
          <input type="text" id="field-${col.key}" value="${item ? (item[col.key] || '') : ''}" 
            style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px;">
        </div>
      `).join('');
    }
    
    modal.innerHTML = `
      <div style="background: #fff; border-radius: 8px; width: 1400px; max-width: 95vw; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;">
        <!-- Заголовок -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid #e5e7eb; flex-shrink: 0;">
          <h3 style="font-size: 20px; font-weight: 600; margin: 0;">${isEdit ? 'Редактировать' : 'Добавить'} ${sectionKey === 'global_vars' ? 'глобальную переменную' : sectionKey === 'materials' ? 'материал ЛДСП' : 'элемент'}</h3>
          <button class="modal-close-btn" style="background: none; border: none; font-size: 28px; color: #999; cursor: pointer; padding: 0; width: 32px; height: 32px;">×</button>
        </div>
        
        ${sectionKey === 'global_vars' ? '' : `
        <!-- Вкладки -->
        <div style="border-bottom: 1px solid #e5e7eb; flex-shrink: 0;">
          <ul style="display: flex; list-style: none; margin: 0; padding: 0 24px;">
            <li style="margin-right: 8px;">
              <button class="tab-btn active" data-tab="main" 
                style="padding: 12px 20px; border: none; background: none; cursor: pointer; font-size: 14px; color: #666; border-bottom: 2px solid transparent; transition: all 0.2s;">
                Основные параметры
              </button>
            </li>
            <li style="margin-right: 8px;">
              <button class="tab-btn" data-tab="display" 
                style="padding: 12px 20px; border: none; background: none; cursor: pointer; font-size: 14px; color: #666; border-bottom: 2px solid transparent; transition: all 0.2s;">
                Параметры отображения
              </button>
            </li>
            <li>
              <button class="tab-btn" data-tab="params" 
                style="padding: 12px 20px; border: none; background: none; cursor: pointer; font-size: 14px; color: #666; border-bottom: 2px solid transparent; transition: all 0.2s;">
                Параметры
              </button>
            </li>
          </ul>
        </div>
        `}
        
        <!-- Контент вкладок -->
        <div style="flex: 1; overflow-y: auto; padding: 24px;">
          ${sectionKey === 'global_vars' ? `
          <!-- Для глобальных переменных показываем форму без вкладок -->
          <div>
            ${formFields}
          </div>
          ` : `
          <!-- Вкладка: Основные параметры -->
          <div class="tab-content active" data-tab="main">
            ${formFields}
          </div>
          
          `}
          ${sectionKey === 'global_vars' ? '' : `
          <!-- Вкладка: Параметры отображения -->
          <div class="tab-content" data-tab="display" style="display: none;">
            <!-- Тип отображения -->
            <div style="margin-bottom: 20px;">
              <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Отображение</label>
              <select id="field-display-mode" style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px;">
                <option value="custom" ${item && item.displayMode === 'custom' ? 'selected' : ''}>Свои параметры</option>
                <option value="decor" ${item && item.displayMode === 'decor' ? 'selected' : ''}>Декор</option>
              </select>
            </div>

            <!-- Контейнер с колонками -->
            <div style="display: flex; gap: 20px;">
              <!-- Левая колонка: Параметры материала -->
              <div style="flex: 0 0 350px;">
                <div style="margin-bottom: 16px;">
                  <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Цвет</label>
                  <div style="display: flex; gap: 10px; align-items: center;">
                    <input type="color" id="field-color" value="${item && item.color ? item.color : '#ffffff'}" 
                      style="width: 60px; height: 40px; border: 1px solid #d0d7e2; border-radius: 4px; cursor: pointer;">
                    <input type="text" id="field-color-hex" value="${item && item.color ? item.color : '#ffffff'}" 
                      placeholder="#ffffff" 
                      style="flex: 1; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px; font-family: monospace;">
                  </div>
                </div>

                <div style="margin-bottom: 16px;">
                  <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Шероховатость</label>
                  <input type="number" id="field-roughness" value="${item && item.roughness !== undefined ? item.roughness : '0.8'}" 
                    min="0" max="1" step="0.01" 
                    style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px;">
                </div>

                <div style="margin-bottom: 16px;">
                  <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Metalness</label>
                  <input type="number" id="field-metalness" value="${item && item.metalness !== undefined ? item.metalness : '0'}" 
                    min="0" max="1" step="0.01" 
                    style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px;">
                </div>

                <div style="margin-bottom: 16px;">
                  <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                    <input type="checkbox" id="field-transparent" ${item && item.transparent ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                    <span style="font-size: 14px; font-weight: 500;">Прозрачный</span>
                  </label>
                </div>

                <div id="transparency-fields" style="display: ${item && item.transparent ? 'block' : 'none'};">
                  <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Коэфф. прозрачности</label>
                    <input type="number" id="field-opacity" value="${item && item.opacity !== undefined ? item.opacity : '1'}" 
                      min="0" max="1" step="0.01" 
                      style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px;">
                  </div>

                  <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Карта прозрачности</label>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <div id="alphamap-preview" style="width: 78px; height: 78px; border: 1px solid #e0e0e0; border-radius: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #f9fafb;">
                        ${item && item.alphaMap ? '<img src="' + item.alphaMap + '" style="width: 100%; height: 100%; object-fit: cover;">' : '<i class="fa fa-picture-o" style="font-size: 30px; color: #ccc;"></i>'}
                      </div>
                      <input type="file" id="alphamap-upload" accept="image/*" style="display: none;">
                      <button type="button" id="alphamap-upload-btn" style="padding: 8px 16px; background: #f0f0f0; border: 1px solid #d0d7e2; border-radius: 4px; cursor: pointer; font-size: 13px;">
                        Выбрать изображение
                      </button>
                      <input type="hidden" id="field-alphamap" value="${item && item.alphaMap ? item.alphaMap : ''}">
                    </div>
                  </div>
                </div>

                <div style="margin-bottom: 16px;">
                  <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Файл текстуры</label>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div id="texture-preview" style="width: 78px; height: 78px; border: 1px solid #e0e0e0; border-radius: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #f9fafb;">
                      ${item && item.texture ? '<img src="' + item.texture + '" style="width: 100%; height: 100%; object-fit: cover;">' : '<i class="fa fa-picture-o" style="font-size: 30px; color: #ccc;"></i>'}
                    </div>
                    <input type="file" id="texture-upload" accept="image/*" style="display: none;">
                    <button type="button" id="texture-upload-btn" style="padding: 8px 16px; background: #f0f0f0; border: 1px solid #d0d7e2; border-radius: 4px; cursor: pointer; font-size: 13px;">
                      Выбрать изображение
                    </button>
                    <input type="hidden" id="field-texture" value="${item && item.texture ? item.texture : ''}">
                  </div>
                </div>

                <div style="margin-bottom: 16px;">
                  <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Карта нормалей</label>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div id="normalmap-preview" style="width: 78px; height: 78px; border: 1px solid #e0e0e0; border-radius: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #f9fafb;">
                      ${item && item.normalMap ? '<img src="' + item.normalMap + '" style="width: 100%; height: 100%; object-fit: cover;">' : '<i class="fa fa-picture-o" style="font-size: 30px; color: #ccc;"></i>'}
                    </div>
                    <input type="file" id="normalmap-upload" accept="image/*" style="display: none;">
                    <button type="button" id="normalmap-upload-btn" style="padding: 8px 16px; background: #f0f0f0; border: 1px solid #d0d7e2; border-radius: 4px; cursor: pointer; font-size: 13px;">
                      Выбрать изображение
                    </button>
                    <input type="hidden" id="field-normalmap" value="${item && item.normalMap ? item.normalMap : ''}">
                  </div>
                </div>

                <div style="margin-bottom: 16px;">
                  <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Карта шероховатости</label>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div id="roughnessmap-preview" style="width: 78px; height: 78px; border: 1px solid #e0e0e0; border-radius: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #f9fafb;">
                      ${item && item.roughnessMap ? '<img src="' + item.roughnessMap + '" style="width: 100%; height: 100%; object-fit: cover;">' : '<i class="fa fa-picture-o" style="font-size: 30px; color: #ccc;"></i>'}
                    </div>
                    <input type="file" id="roughnessmap-upload" accept="image/*" style="display: none;">
                    <button type="button" id="roughnessmap-upload-btn" style="padding: 8px 16px; background: #f0f0f0; border: 1px solid #d0d7e2; border-radius: 4px; cursor: pointer; font-size: 13px;">
                      Выбрать изображение
                    </button>
                    <input type="hidden" id="field-roughnessmap" value="${item && item.roughnessMap ? item.roughnessMap : ''}">
                  </div>
                </div>

                <div style="margin-bottom: 16px;">
                  <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                    <input type="checkbox" id="field-stretch-width" ${item && item.stretchWidth ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                    <span style="font-size: 14px; font-weight: 500;">Растягивать по ширине</span>
                  </label>
                </div>

                <div style="margin-bottom: 16px;">
                  <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                    <input type="checkbox" id="field-stretch-height" ${item && item.stretchHeight ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                    <span style="font-size: 14px; font-weight: 500;">Растягивать по высоте</span>
                  </label>
                </div>

                <div style="display: flex; gap: 10px; margin-bottom: 16px;">
                  <div style="flex: 1;">
                    <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Реальная ширина текстуры (мм)</label>
                    <input type="number" id="field-texture-width" value="${item && item.textureWidth ? item.textureWidth : '1000'}" 
                      min="1" step="1" 
                      style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px;">
                  </div>
                  <div style="flex: 1;">
                    <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Реальная высота текстуры (мм)</label>
                    <input type="number" id="field-texture-height" value="${item && item.textureHeight ? item.textureHeight : '1000'}" 
                      min="1" step="1" 
                      style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px;">
                  </div>
                </div>
              </div>

              <!-- Правая колонка: Three.js превью -->
              <div style="flex: 1;">
                <div style="margin-bottom: 10px;">
                  <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Размер превью</label>
                  <div style="display: flex; gap: 10px; align-items: center;">
                    <div style="flex: 1;">
                      <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Ширина</label>
                      <input type="number" id="preview-width" value="300" min="100" 
                        style="width: 100%; padding: 8px 10px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 13px;">
                    </div>
                    <div style="flex: 1;">
                      <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Высота</label>
                      <input type="number" id="preview-height" value="300" min="100" 
                        style="width: 100%; padding: 8px 10px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 13px;">
                    </div>
                  </div>
                </div>
                <div id="material-preview" style="width: 100%; height: 500px; border: 1px solid #e0e0e0; border-radius: 4px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                  <span style="color: #999; font-size: 14px;">Загрузка превью...</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Вкладка: Параметры -->
          <div class="tab-content" data-tab="params" style="display: none;">
            
            <!-- Раздел: Кромка -->
            <div style="margin-bottom: 30px;">
              <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #111;">Кромка</h3>
              
              <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                <div style="flex: 1;">
                  <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Набор кромок</label>
                  <select disabled style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px; background: #f9fafb; color: #6b7280;">
                    <option value="butts">Набор по умолчанию</option>
                  </select>
                </div>
                
                <div style="flex: 1;">
                  <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Выберите материал</label>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="flex: 1;">
                      <a href="#" id="butt-material-link" style="color: #1890ff; text-decoration: none; font-size: 14px;">
                        <span id="butt-material-text">${item && item.buttMaterialId && item.buttMaterialId !== '0' ? (item.buttMaterialId + ': ') : ''}${item && item.buttMaterial ? escapeHtml(item.buttMaterial) : 'Выбрать'}</span>
                      </a>
                      <button type="button" id="butt-material-edit-btn" style="margin-left: 8px; padding: 4px 8px; background: #1ab394; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
                        <i class="fa fa-edit"></i>
                      </button>
                      ${item && item.buttMaterialId && item.buttMaterialId !== '0' ? `<a href="#" target="_blank" style="margin-left: 8px; padding: 4px 8px; background: #1ab394; color: white; text-decoration: none; border-radius: 3px; font-size: 12px; display: inline-block;"><i class="fa fa-link"></i></a>` : ''}
                    </div>
                  </div>
                  <input type="hidden" id="field-butt-material-id" value="${item && item.buttMaterialId ? item.buttMaterialId : '0'}">
                  <input type="hidden" id="field-butt-material" value="${item && item.buttMaterial ? escapeHtml(item.buttMaterial) : ''}">
                </div>
              </div>
            </div>

            <!-- Раздел: Варианты -->
            <div style="margin-bottom: 30px;">
              <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #111;">Варианты</h3>
              
              <div id="variants-container" style="margin-bottom: 16px;">
                <!-- Вариант будет добавлен динамически -->
              </div>
              
              <button type="button" id="add-variant-btn" style="padding: 8px 16px; background: #1890ff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                Добавить вариант
              </button>
            </div>

            <!-- Прочие параметры -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
              <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #111;">Дополнительные параметры</h3>
              
              <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Толщина по умолчанию (мм)</label>
                <input type="number" id="field-thickness" value="${item && item.thickness ? item.thickness : '16'}" 
                  placeholder="16" 
                  style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px;">
              </div>
              
              <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Группа материала</label>
                <select id="field-group" style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px;">
                  <option value="g0" ${item && item.group === 'g0' ? 'selected' : ''}>Группа 0</option>
                  <option value="g1" ${item && item.group === 'g1' ? 'selected' : ''}>Группа 1</option>
                  <option value="g2" ${item && item.group === 'g2' ? 'selected' : ''}>Группа 2</option>
                </select>
              </div>
              
              <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Описание</label>
                <textarea id="field-description" 
                  placeholder="Дополнительное описание материала" 
                  style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px; min-height: 100px; resize: vertical;">${item && item.description ? escapeHtml(item.description) : ''}</textarea>
              </div>
            </div>
          </div>
          `}
        </div>
        
        <!-- Футер с кнопками -->
        <div style="display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid #e5e7eb; flex-shrink: 0;">
          <button class="modal-cancel-btn" style="padding: 10px 20px; border: 1px solid #d0d7e2; background: #fff; border-radius: 6px; cursor: pointer; font-size: 14px; color: #666;">
            Отмена
          </button>
          <button class="modal-save-btn" style="padding: 10px 24px; background: #1890ff; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
            Сохранить
          </button>
          <button class="modal-save-exit-btn" style="padding: 10px 24px; background: #52c41a; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
            Сохранить и выйти
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Устанавливаем значение для textarea после создания (чтобы избежать проблем с экранированием)
    if (item && item.description) {
      const descField = modal.querySelector('#field-description');
      if (descField) {
        descField.value = item.description;
      }
    }
    
    // Обработчики закрытия
    const closeModal = () => modal.remove();
    modal.querySelector('.modal-close-btn').addEventListener('click', closeModal);
    modal.querySelector('.modal-cancel-btn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    
    // Обработчики переключения вкладок (только если есть вкладки)
    const tabButtons = modal.querySelectorAll('.tab-btn');
    const tabContents = modal.querySelectorAll('.tab-content');
    
    // Для global_vars вкладок нет, пропускаем обработчики
    if (sectionKey !== 'global_vars' && tabButtons.length > 0) {
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');
        
        // Убираем активный класс у всех кнопок и контента
        tabButtons.forEach(b => {
          b.classList.remove('active');
          b.style.color = '#666';
          b.style.borderBottomColor = 'transparent';
        });
        tabContents.forEach(c => {
          c.classList.remove('active');
          c.style.display = 'none';
        });
        
        // Добавляем активный класс к текущей кнопке и контенту
        btn.classList.add('active');
        btn.style.color = '#1890ff';
        btn.style.borderBottomColor = '#1890ff';
        
        const activeContent = modal.querySelector('.tab-content[data-tab=' + JSON.stringify(tabName) + ']');
        if (activeContent) {
          activeContent.classList.add('active');
          activeContent.style.display = 'block';
        }
      });
    });
    }
    
    // Устанавливаем стили для активной вкладки при загрузке (только если есть вкладки)
    if (sectionKey !== 'global_vars') {
      const activeTabBtn = modal.querySelector('.tab-btn.active');
      if (activeTabBtn) {
        activeTabBtn.style.color = '#1890ff';
        activeTabBtn.style.borderBottomColor = '#1890ff';
      }
    }
    
    // Обработчики для материалов
    if (sectionKey === 'materials') {
      // Обработчик загрузки иконки
      const uploadBtn = modal.querySelector('#upload-icon-btn');
      const fileInput = modal.querySelector('#field-icon-file');
      const iconPreview = modal.querySelector('#icon-preview');
      const iconField = modal.querySelector('#field-icon');
      
      if (uploadBtn && iconPreview && iconField) {
        uploadBtn.addEventListener('click', () => {
          if (typeof window.openFileManager === 'function') {
            window.openFileManager({
              allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
              initialPath: 'common_assets/images/materials',
              onSelect: function(r) {
                if (r && r.url) {
                  iconPreview.innerHTML = '<img src="' + (r.url || '').replace(/"/g, '&quot;') + '" style="width: 100%; height: 100%; object-fit: cover;">';
                  iconField.value = r.url;
                  if (typeof updateMaterialPreview === 'function') updateMaterialPreview();
                }
              }
            });
          } else if (window.toastr) window.toastr.warning('Файловый менеджер не загружен.');
          else alert('Файловый менеджер недоступен.');
        });
        
        const fileInput = modal.querySelector('#field-icon-file');
        if (fileInput) fileInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
            if (!file.type.startsWith('image/')) {
              alert('Пожалуйста, выберите изображение');
              return;
            }
            if (file.size > 5 * 1024 * 1024) {
              alert('Размер файла не должен превышать 5MB');
              return;
            }
            
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target.result;
              iconPreview.innerHTML = '<img src="' + base64 + '" style="width: 100%; height: 100%; object-fit: cover;">';
              iconField.value = base64;
              console.log('  - 📸 Иконка загружена:', file.name);
            };
            reader.readAsDataURL(file);
          }
        });
      }
      
      // Синхронизация color picker и hex input
      const colorPicker = modal.querySelector('#field-color');
      const colorHexInput = modal.querySelector('#field-color-hex');
      if (colorPicker && colorHexInput) {
        colorPicker.addEventListener('input', (e) => {
          colorHexInput.value = e.target.value;
          updateMaterialPreview();
        });
        colorHexInput.addEventListener('input', (e) => {
          const hex = e.target.value;
          if (/^#[0-9A-F]{6}$/i.test(hex)) {
            colorPicker.value = hex;
            updateMaterialPreview();
          }
        });
      }
      
      // Обработчик чекбокса прозрачности
      const transparentCheckbox = modal.querySelector('#field-transparent');
      const transparencyFields = modal.querySelector('#transparency-fields');
      if (transparentCheckbox && transparencyFields) {
        transparentCheckbox.addEventListener('change', (e) => {
          transparencyFields.style.display = e.target.checked ? 'block' : 'none';
          updateMaterialPreview();
        });
      }
      
      // Функция загрузки изображения (универсальная)
      const setupImageUpload = (btnId, inputId, previewId, fieldId) => {
        const btn = modal.querySelector(btnId);
        const input = modal.querySelector(inputId);
        const preview = modal.querySelector(previewId);
        const field = modal.querySelector(fieldId);
        
        if (btn && preview && field) {
          btn.addEventListener('click', () => {
            if (typeof window.openFileManager === 'function') {
              window.openFileManager({
                allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
                initialPath: 'common_assets/images/materials',
                onSelect: function(r) {
                  if (r && r.url) {
                    preview.innerHTML = '<img src="' + (r.url || '').replace(/"/g, '&quot;') + '" style="width: 100%; height: 100%; object-fit: cover;">';
                    field.value = r.url;
                    if (typeof updateMaterialPreview === 'function') updateMaterialPreview();
                  }
                }
              });
            } else if (window.toastr) window.toastr.warning('Файловый менеджер не загружен.');
            else alert('Файловый менеджер недоступен.');
          });
          
          if (input) input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
              if (!file.type.startsWith('image/')) {
                alert('Пожалуйста, выберите изображение');
                return;
              }
              if (file.size > 10 * 1024 * 1024) {
                alert('Размер файла не должен превышать 10MB');
                return;
              }
              
              const reader = new FileReader();
              reader.onload = (event) => {
                const base64 = event.target.result;
                preview.innerHTML = '<img src="' + base64 + '" style="width: 100%; height: 100%; object-fit: cover;">';
                field.value = base64;
                console.log('  - 📸 Изображение загружено:', file.name);
                updateMaterialPreview();
              };
              reader.readAsDataURL(file);
            }
          });
        }
      };
      
      // Настраиваем загрузчики для всех карт
      setupImageUpload('#texture-upload-btn', '#texture-upload', '#texture-preview', '#field-texture');
      setupImageUpload('#normalmap-upload-btn', '#normalmap-upload', '#normalmap-preview', '#field-normalmap');
      setupImageUpload('#roughnessmap-upload-btn', '#roughnessmap-upload', '#roughnessmap-preview', '#field-roughnessmap');
      setupImageUpload('#alphamap-upload-btn', '#alphamap-upload', '#alphamap-preview', '#field-alphamap');
      
      // Обработчики для обновления превью при изменении параметров
      const previewUpdateFields = ['#field-roughness', '#field-metalness', '#field-opacity', '#field-texture-width', '#field-texture-height'];
      previewUpdateFields.forEach(selector => {
        const field = modal.querySelector(selector);
        if (field) {
          field.addEventListener('input', () => updateMaterialPreview());
        }
      });
      
      // Чекбоксы растяжения
      ['#field-stretch-width', '#field-stretch-height'].forEach(selector => {
        const field = modal.querySelector(selector);
        if (field) {
          field.addEventListener('change', () => updateMaterialPreview());
        }
      });
      
      // Three.js превью материала
      let previewScene, previewCamera, previewRenderer, previewMaterial, previewMesh;
      
      function initMaterialPreview() {
        const container = modal.querySelector('#material-preview');
        if (!container || !window.THREE) {
          console.warn('Three.js не загружен или контейнер не найден');
          return;
        }
        
        try {
          // Создаем сцену
          previewScene = new THREE.Scene();
          previewScene.background = new THREE.Color(0xf0f0f0);
          
          // Камера
          previewCamera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
          previewCamera.position.set(0, 0, 400);
          previewCamera.lookAt(0, 0, 0);
          
          // Рендерер
          previewRenderer = new THREE.WebGLRenderer({ antialias: true });
          previewRenderer.setSize(container.clientWidth, container.clientHeight);
          container.innerHTML = '';
          container.appendChild(previewRenderer.domElement);
          
          // Материал и геометрия (плоскость)
          const geometry = new THREE.BoxGeometry(300, 300, 10);
          previewMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.8,
            metalness: 0
          });
          previewMesh = new THREE.Mesh(geometry, previewMaterial);
          previewScene.add(previewMesh);
          
          // Освещение
          const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
          previewScene.add(ambientLight);
          
          const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
          directionalLight.position.set(1, 1, 1);
          previewScene.add(directionalLight);
          
          // Анимация (вращение)
          function animate() {
            if (!previewMesh) return;
            previewMesh.rotation.y += 0.005;
            previewRenderer.render(previewScene, previewCamera);
            requestAnimationFrame(animate);
          }
          animate();
          
          console.log('  - 🎨 Three.js превью инициализировано');
        } catch (err) {
          console.error('Ошибка инициализации Three.js превью:', err);
          container.innerHTML = '<span style="color: #999; font-size: 14px;">Ошибка загрузки превью</span>';
        }
      }
      
      function updateMaterialPreview() {
        if (!previewMaterial) return;
        
        try {
          // Цвет
          const colorField = modal.querySelector('#field-color');
          if (colorField) {
            previewMaterial.color.set(colorField.value);
          }
          
          // Шероховатость
          const roughnessField = modal.querySelector('#field-roughness');
          if (roughnessField) {
            previewMaterial.roughness = parseFloat(roughnessField.value) || 0.8;
          }
          
          // Metalness
          const metalnessField = modal.querySelector('#field-metalness');
          if (metalnessField) {
            previewMaterial.metalness = parseFloat(metalnessField.value) || 0;
          }
          
          // Прозрачность
          const transparentField = modal.querySelector('#field-transparent');
          const opacityField = modal.querySelector('#field-opacity');
          if (transparentField && opacityField) {
            previewMaterial.transparent = transparentField.checked;
            previewMaterial.opacity = transparentField.checked ? (parseFloat(opacityField.value) || 1) : 1;
          }
          
          // Текстура
          const textureField = modal.querySelector('#field-texture');
          if (textureField && textureField.value && textureField.value.startsWith('data:image')) {
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(textureField.value, (texture) => {
              texture.wrapS = THREE.RepeatWrapping;
              texture.wrapT = THREE.RepeatWrapping;
              
              // Растяжение
              const stretchWidth = modal.querySelector('#field-stretch-width')?.checked;
              const stretchHeight = modal.querySelector('#field-stretch-height')?.checked;
              const textureWidth = parseFloat(modal.querySelector('#field-texture-width')?.value) || 1000;
              const textureHeight = parseFloat(modal.querySelector('#field-texture-height')?.value) || 1000;
              
              if (!stretchWidth) texture.repeat.x = 300 / textureWidth;
              if (!stretchHeight) texture.repeat.y = 300 / textureHeight;
              
              previewMaterial.map = texture;
              previewMaterial.needsUpdate = true;
            });
          }
          
          // Карта нормалей
          const normalmapField = modal.querySelector('#field-normalmap');
          if (normalmapField && normalmapField.value && normalmapField.value.startsWith('data:image')) {
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(normalmapField.value, (texture) => {
              previewMaterial.normalMap = texture;
              previewMaterial.needsUpdate = true;
            });
          }
          
          // Карта шероховатости
          const roughnessmapField = modal.querySelector('#field-roughnessmap');
          if (roughnessmapField && roughnessmapField.value && roughnessmapField.value.startsWith('data:image')) {
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(roughnessmapField.value, (texture) => {
              previewMaterial.roughnessMap = texture;
              previewMaterial.needsUpdate = true;
            });
          }
          
          // Карта прозрачности
          const alphamapField = modal.querySelector('#field-alphamap');
          if (alphamapField && alphamapField.value && alphamapField.value.startsWith('data:image')) {
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(alphamapField.value, (texture) => {
              previewMaterial.alphaMap = texture;
              previewMaterial.needsUpdate = true;
            });
          }
          
          previewMaterial.needsUpdate = true;
        } catch (err) {
          console.error('Ошибка обновления превью:', err);
        }
      }
      
      // Инициализируем превью при открытии вкладки "Параметры отображения"
      const displayTabBtn = modal.querySelector('.tab-btn[data-tab="display"]');
      if (displayTabBtn) {
        displayTabBtn.addEventListener('click', () => {
          setTimeout(() => {
            if (!previewRenderer) {
              initMaterialPreview();
              updateMaterialPreview();
            }
          }, 100);
        });
      }
      
      // Логика для работы с вариантами (структура как в Clodis)
      let variants = item && item.variants ? JSON.parse(JSON.stringify(item.variants)) : [{
        name: '',
        code: '',
        width: 0,          // Ширина листа (мм)
        height: 0,         // Высота листа (мм)
        thickness: 0,      // Толщина материала (мм)
        price: 0,          // Цена
        price_mode: 'm',   // Режим ввода: 'm' - ручной, 'a' - по ID, 'c' - по артикулу
        price_type: 'p',   // Тип расчета: 'p' - р/шт, 'm' - р/п.м, 'm2' - р/м²
        price_acc_id: 0,   // ID комплектующего
        params: {}         // Дополнительные параметры
      }];
      
      function createVariantHTML(variant, index) {
        return `
          <div class="variant-item" data-index="${index}" style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin-bottom: 16px; position: relative; background: #f9fafb;">
            <div style="position: absolute; right: 16px; top: 16px; display: flex; gap: 8px;">
              <button type="button" class="variant-move-up" ${index === 0 ? 'disabled' : ''} style="padding: 6px 10px; background: #fff; border: 1px solid #d0d7e2; border-radius: 4px; cursor: ${index === 0 ? 'not-allowed' : 'pointer'}; opacity: ${index === 0 ? '0.5' : '1'};">
                <i class="fa fa-chevron-up"></i>
              </button>
              <button type="button" class="variant-move-down" ${index === variants.length - 1 ? 'disabled' : ''} style="padding: 6px 10px; background: #fff; border: 1px solid #d0d7e2; border-radius: 4px; cursor: ${index === variants.length - 1 ? 'not-allowed' : 'pointer'}; opacity: ${index === variants.length - 1 ? '0.5' : '1'};">
                <i class="fa fa-chevron-down"></i>
              </button>
              <button type="button" class="variant-delete" ${variants.length === 1 ? 'disabled' : ''} style="padding: 6px 10px; background: #fff; border: 1px solid #ef4444; color: #ef4444; border-radius: 4px; cursor: ${variants.length === 1 ? 'not-allowed' : 'pointer'}; opacity: ${variants.length === 1 ? '0.5' : '1'};">
                <i class="fa fa-trash"></i>
              </button>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 16px;">
              <div>
                <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Название</label>
                <input type="text" class="variant-name" value="${escapeHtml(variant.name || '')}" 
                  placeholder="Название варианта"
                  style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px;">
              </div>
              
              <div>
                <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Артикул</label>
                <input type="text" class="variant-code" value="${escapeHtml(variant.code || '')}" 
                  placeholder="Артикул"
                  style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px;">
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px;">
              <div>
                <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Ширина, мм</label>
                <input type="number" class="variant-width" value="${variant.width || 0}" 
                  placeholder="0" min="0" step="1"
                  style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px;">
              </div>
              
              <div>
                <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Высота, мм</label>
                <input type="number" class="variant-height" value="${variant.height || 0}" 
                  placeholder="0" min="0" step="1"
                  style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px;">
              </div>
              
              <div>
                <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Толщина, мм</label>
                <input type="number" class="variant-thickness" value="${variant.thickness || 0}" 
                  placeholder="0" min="0" step="1"
                  style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px;">
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
              <div>
                <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Тип расчета</label>
                <select class="variant-price-type" style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px;">
                  <option value="p" ${variant.price_type === 'p' ? 'selected' : ''}>р/шт.</option>
                  <option value="m" ${variant.price_type === 'm' ? 'selected' : ''}>р/п.м.</option>
                  <option value="m2" ${variant.price_type === 'm2' ? 'selected' : ''}>р/м²</option>
                </select>
              </div>
              
              <div>
                <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Ввод цен</label>
                <select class="variant-price-mode" style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px;">
                  <option value="m" ${variant.price_mode === 'm' ? 'selected' : ''}>Ручной ввод</option>
                  <option value="a" ${variant.price_mode === 'a' ? 'selected' : ''}>По ID из комплектующих</option>
                  <option value="c" ${variant.price_mode === 'c' ? 'selected' : ''}>По артикулу из комплектующих</option>
                </select>
              </div>
              
              <div class="variant-price-field" style="${variant.price_mode === 'm' ? '' : 'display: none;'}">
                <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px;">Цена</label>
                <input type="number" class="variant-price" value="${variant.price || 0}" 
                  placeholder="0.00" min="0" step="0.01"
                  style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px;">
              </div>
            </div>
          </div>
        `;
      }
      
      function renderVariants() {
        const container = modal.querySelector('#variants-container');
        container.innerHTML = variants.map((v, i) => createVariantHTML(v, i)).join('');
        
        // Обработчики для каждого варианта
        container.querySelectorAll('.variant-item').forEach((variantEl, index) => {
          // Удаление
          const deleteBtn = variantEl.querySelector('.variant-delete');
          if (deleteBtn && !deleteBtn.disabled) {
            deleteBtn.addEventListener('click', () => {
              if (confirm('Удалить этот вариант?')) {
                variants.splice(index, 1);
                renderVariants();
              }
            });
          }
          
          // Перемещение вверх
          const moveUpBtn = variantEl.querySelector('.variant-move-up');
          if (moveUpBtn && !moveUpBtn.disabled) {
            moveUpBtn.addEventListener('click', () => {
              [variants[index], variants[index - 1]] = [variants[index - 1], variants[index]];
              renderVariants();
            });
          }
          
          // Перемещение вниз
          const moveDownBtn = variantEl.querySelector('.variant-move-down');
          if (moveDownBtn && !moveDownBtn.disabled) {
            moveDownBtn.addEventListener('click', () => {
              [variants[index], variants[index + 1]] = [variants[index + 1], variants[index]];
              renderVariants();
            });
          }
          
          // Показ/скрытие поля цены
          const priceModeSelect = variantEl.querySelector('.variant-price-mode');
          const priceField = variantEl.querySelector('.variant-price-field');
          priceModeSelect.addEventListener('change', (e) => {
            priceField.style.display = e.target.value === 'm' ? '' : 'none';
          });
        });
      }
      
      // Добавление нового варианта
      const addVariantBtn = modal.querySelector('#add-variant-btn');
      if (addVariantBtn) {
        addVariantBtn.addEventListener('click', () => {
          variants.push({
            name: '',
            code: '',
            width: 0,
            height: 0,
            thickness: 0,
            price: 0,
            price_mode: 'm',
            price_type: 'p',
            price_acc_id: 0,
            params: {}
          });
          renderVariants();
        });
      }
      
      // Инициализация
      renderVariants();
      
      // Обработчик выбора материала кромки
      const buttMaterialLink = modal.querySelector('#butt-material-link');
      const buttMaterialEditBtn = modal.querySelector('#butt-material-edit-btn');
      
      const openButtMaterialModal = () => {
        // Создаем простое модальное окно для выбора материала кромки
        const buttModal = document.createElement('div');
        buttModal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';
        
        buttModal.innerHTML = `
          <div style="background: #fff; border-radius: 8px; width: 600px; max-width: 90vw; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;">
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid #e5e7eb;">
              <h3 style="font-size: 18px; font-weight: 600; margin: 0;">Выбрать материал кромки</h3>
              <button class="butt-modal-close" style="background: none; border: none; font-size: 24px; color: #999; cursor: pointer;">×</button>
            </div>
            
            <div style="flex: 1; overflow-y: auto; padding: 24px;">
              <div style="margin-bottom: 16px;">
                <input type="text" id="butt-search" placeholder="Поиск материалов кромки..." 
                  style="width: 100%; padding: 10px 12px; border: 1px solid #d0d7e2; border-radius: 4px; font-size: 14px;">
              </div>
              
              <div id="butt-materials-list" style="display: flex; flex-direction: column; gap: 8px;">
                <!-- Примеры материалов кромок -->
                <div class="butt-material-item" data-id="1" data-name="Кромка ABC Белый премиум 0,8*18" style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer; transition: all 0.2s;">
                  <div style="font-weight: 500; color: #111;">Кромка ABC Белый премиум 0,8*18</div>
                  <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Артикул: W1000ST19</div>
                </div>
                
                <div class="butt-material-item" data-id="2" data-name="Кромка ПВХ GALOPLAST Альби" style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer; transition: all 0.2s;">
                  <div style="font-weight: 500; color: #111;">Кромка ПВХ GALOPLAST Альби</div>
                  <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Артикул: 50195994</div>
                </div>
                
                <div class="butt-material-item" data-id="3" data-name="Кромка ПВХ GP-PLAST Безмолвная пустыня" style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer; transition: all 0.2s;">
                  <div style="font-weight: 500; color: #111;">Кромка ПВХ GP-PLAST Безмолвная пустыня</div>
                  <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Артикул: K514</div>
                </div>
                
                <div class="butt-material-item" data-id="0" data-name="" style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer; transition: all 0.2s; background: #fef3f2;">
                  <div style="font-weight: 500; color: #ef4444;">Без кромки (сбросить выбор)</div>
                </div>
              </div>
            </div>
            
            <div style="padding: 16px 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end;">
              <button class="butt-modal-close" style="padding: 10px 20px; border: 1px solid #d0d7e2; background: #fff; border-radius: 6px; cursor: pointer; font-size: 14px;">
                Отмена
              </button>
            </div>
          </div>
        `;
        
        document.body.appendChild(buttModal);
        
        // Обработчики
        const closeButtModal = () => buttModal.remove();
        
        buttModal.querySelectorAll('.butt-modal-close').forEach(btn => {
          btn.addEventListener('click', closeButtModal);
        });
        
        buttModal.addEventListener('click', (e) => {
          if (e.target === buttModal) closeButtModal();
        });
        
        // Выбор материала
        buttModal.querySelectorAll('.butt-material-item').forEach(item => {
          item.addEventListener('mouseenter', () => {
            item.style.background = '#f0f9ff';
            item.style.borderColor = '#1890ff';
          });
          
          item.addEventListener('mouseleave', () => {
            if (item.dataset.id !== '0') {
              item.style.background = '#fff';
              item.style.borderColor = '#e5e7eb';
            } else {
              item.style.background = '#fef3f2';
              item.style.borderColor = '#e5e7eb';
            }
          });
          
          item.addEventListener('click', () => {
            const materialId = item.dataset.id;
            const materialName = item.dataset.name;
            
            document.getElementById('field-butt-material-id').value = materialId;
            document.getElementById('field-butt-material').value = materialName;
            
            const textEl = modal.querySelector('#butt-material-text');
            if (materialId === '0') {
              textEl.textContent = 'Выбрать';
            } else {
              textEl.textContent = materialId + ': ' + materialName;
            }
            
            closeButtModal();
          });
        });
        
        // Поиск
        const searchInput = buttModal.querySelector('#butt-search');
        searchInput.addEventListener('input', (e) => {
          const searchTerm = e.target.value.toLowerCase();
          buttModal.querySelectorAll('.butt-material-item').forEach(item => {
            const name = item.dataset.name.toLowerCase();
            if (name.includes(searchTerm) || searchTerm === '') {
              item.style.display = 'block';
            } else {
              item.style.display = 'none';
            }
          });
        });
      };
      
      if (buttMaterialLink) {
        buttMaterialLink.addEventListener('click', (e) => {
          e.preventDefault();
          openButtMaterialModal();
        });
      }
      
      if (buttMaterialEditBtn) {
        buttMaterialEditBtn.addEventListener('click', openButtMaterialModal);
      }
    }
    
    // Обработчик сохранения
    modal.querySelector('.modal-save-btn').addEventListener('click', () => {
      console.log('  - 💾 Сохранение данных');
      
      // Собираем данные из формы
      const newItem = {
        id: item ? item.id : Date.now()
      };
      
      if (sectionKey === 'materials') {
        const name = document.getElementById('field-name').value.trim();
        if (!name) {
          alert('Ошибка: Введите название материала');
          return;
        }
        
        // Валидация вариантов (как в Clodis)
        const variantItems = modal.querySelectorAll('.variant-item');
        if (!variantItems.length) {
          alert('Ошибка: Должен быть хотя бы один вариант материала');
          return;
        }
        
        // Основные параметры
        newItem.name = name;
        newItem.code = document.getElementById('field-code').value.trim();
        newItem.category = document.getElementById('field-category').value;
        newItem.order = parseInt(document.getElementById('field-order').value) || 1;
        newItem.active = document.getElementById('field-active').checked;
        newItem.icon = document.getElementById('field-icon').value || '';
        
        // Параметры отображения
        newItem.displayMode = document.getElementById('field-display-mode')?.value || 'custom';
        newItem.color = document.getElementById('field-color')?.value || '#ffffff';
        newItem.roughness = parseFloat(document.getElementById('field-roughness')?.value) || 0.8;
        newItem.metalness = parseFloat(document.getElementById('field-metalness')?.value) || 0;
        newItem.transparent = document.getElementById('field-transparent')?.checked || false;
        newItem.opacity = parseFloat(document.getElementById('field-opacity')?.value) || 1;
        newItem.texture = document.getElementById('field-texture')?.value || '';
        newItem.normalMap = document.getElementById('field-normalmap')?.value || '';
        newItem.roughnessMap = document.getElementById('field-roughnessmap')?.value || '';
        newItem.alphaMap = document.getElementById('field-alphamap')?.value || '';
        newItem.stretchWidth = document.getElementById('field-stretch-width')?.checked || false;
        newItem.stretchHeight = document.getElementById('field-stretch-height')?.checked || false;
        newItem.textureWidth = parseInt(document.getElementById('field-texture-width')?.value) || 1000;
        newItem.textureHeight = parseInt(document.getElementById('field-texture-height')?.value) || 1000;
        
        // Параметры
        newItem.thickness = parseInt(document.getElementById('field-thickness')?.value) || 16;
        newItem.group = document.getElementById('field-group')?.value || 'g0';
        newItem.description = document.getElementById('field-description')?.value.trim() || '';
        newItem.buttMaterialId = document.getElementById('field-butt-material-id')?.value || '0';
        newItem.buttMaterial = document.getElementById('field-butt-material')?.value || '';
        
        // Собираем варианты (структура Clodis)
        const variantsData = [];
        modal.querySelectorAll('.variant-item').forEach((variantEl) => {
          variantsData.push({
            name: variantEl.querySelector('.variant-name')?.value.trim() || '',
            code: variantEl.querySelector('.variant-code')?.value.trim() || '',
            width: parseFloat(variantEl.querySelector('.variant-width')?.value) || 0,
            height: parseFloat(variantEl.querySelector('.variant-height')?.value) || 0,
            thickness: parseFloat(variantEl.querySelector('.variant-thickness')?.value) || 0,
            price: parseFloat(variantEl.querySelector('.variant-price')?.value) || 0,
            price_mode: variantEl.querySelector('.variant-price-mode')?.value || 'm',
            price_type: variantEl.querySelector('.variant-price-type')?.value || 'p',
            price_acc_id: 0,
            params: {}
          });
        });
        newItem.variants = variantsData;
        
        // Структура кромки (как в Clodis)
        newItem.butt = {
          key: 'butts'
        };
        newItem.material = parseInt(newItem.buttMaterialId) || 0;
      } else if (sectionKey === 'global_vars') {
        // Сохранение для глобальных переменных
        const keyField = document.getElementById('field-key');
        const nameField = document.getElementById('field-name');
        const valueField = document.getElementById('field-value');
        const typeField = document.getElementById('field-type');
        const unitField = document.getElementById('field-unit');
        
        if (keyField) newItem.key = keyField.value;
        if (nameField) newItem.name = nameField.value;
        if (valueField) newItem.value = valueField.value;
        if (typeField) newItem.type = typeField.value;
        if (unitField) newItem.unit = unitField.value;
        
        // Валидация обязательных полей
        if (!newItem.key || !newItem.name || !newItem.type) {
          alert('Пожалуйста, заполните все обязательные поля (Ключ, Название, Тип)');
          return;
        }
      } else {
        // Универсальное сохранение для других разделов
        sectionConfig.columns.filter(col => col.key !== 'id').forEach(col => {
          const field = document.getElementById(`field-${col.key}`);
          if (field) {
            newItem[col.key] = field.value;
          }
        });
      }
      
      // Обновляем или добавляем
      if (isEdit) {
        const index = data.findIndex(i => i.id === item.id);
        if (index !== -1) {
          data[index] = newItem;
        }
      } else {
        data.push(newItem);
      }
      
      // Сохраняем в localStorage
      localStorage.setItem(sectionConfig.storageKey, JSON.stringify(data));
      
      // Обновляем таблицу
      renderTableData(sectionConfig);
      
      // Закрываем модалку
      closeModal();
      
      console.log('  - ✅ Данные сохранены:', newItem);
    });
    
    // Обработчик "Сохранить и выйти"
    const saveExitBtn = modal.querySelector('.modal-save-exit-btn');
    if (saveExitBtn) {
      saveExitBtn.addEventListener('click', () => {
        // Триггерим событие сохранения
        modal.querySelector('.modal-save-btn').click();
        // Модалка закроется автоматически после сохранения
      });
    }
    
    console.log('✅ Модальное окно показано');
  }
  
  /**
   * Сохранить состояние в URL
   */
  function saveStateToURL() {
    const params = new URLSearchParams();
    if (adminState.currentSection) {
      params.set('section', adminState.currentSection);
    }
    if (adminState.currentCatalogType) {
      params.set('catalog', adminState.currentCatalogType);
    }
    if (adminState.currentTab) {
      params.set('tab', adminState.currentTab);
    }
    window.location.hash = params.toString();
  }
  
  /**
   * Загрузить состояние из URL
   */
  function loadStateFromURL() {
    const params = new URLSearchParams(window.location.hash.substring(1));
    adminState.currentSection = params.get('section');
    adminState.currentCatalogType = params.get('catalog');
    adminState.currentTab = params.get('tab') || 'main';
    
    console.log('📥 Состояние загружено из URL:', adminState);
    
    // ⭐ Если загружается section=requests, показываем HTML страницу (по референсу)
    if (adminState.currentSection === 'requests') {
      const clientsOrdersPage = document.getElementById('clients-orders-container');
      if (clientsOrdersPage) {
        // Скрываем #app
        const appContainer = document.getElementById('app');
        if (appContainer) {
          appContainer.style.display = 'none';
        }
        // Скрываем admin-section-container если есть
        const adminSectionContainer = document.getElementById('admin-section-container');
        if (adminSectionContainer) {
          adminSectionContainer.style.display = 'none';
        }
        // Показываем HTML страницу
        clientsOrdersPage.style.display = 'block';
        console.log('✅ При загрузке показана HTML страница "Заявки на расчет"');
      }
    }
  }
  
  // Инициализация при загрузке DOM - ОДИН РАЗ
  let isInitialized = false;
  
  function tryInit() {
    // Предотвращаем множественную инициализацию
    if (isInitialized) {
      console.log('⚠️ AdminPanel уже инициализирована, пропускаем');
      return true;
    }
    
    const sidebarExists = document.querySelector('.navbar-default');
    
    if (sidebarExists) {
      console.log('✅ Элементы найдены, запускаем инициализацию');
      initAdminPanel();
      isInitialized = true;
      if (window.AdminPanel) {
        window.AdminPanel.initialized = true;
      }
      return true;
    }
    return false;
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(() => {
        if (!isInitialized && !tryInit()) {
          console.warn('⚠️ Элементы не найдены при DOMContentLoaded, повторная попытка через 500ms');
          setTimeout(tryInit, 500);
        }
      }, 100);
    });
  } else {
    // DOM уже загружен
    setTimeout(() => {
      if (!isInitialized && !tryInit()) {
        console.warn('⚠️ Элементы не найдены, повторная попытка через 500ms');
        setTimeout(tryInit, 500);
      }
    }, 100);
  }
  
  // Экспорт функций для использования в других модулях
  window.AdminPanel = {
    init: function() {
      if (!isInitialized) {
        initAdminPanel();
        isInitialized = true;
        window.AdminPanel.initialized = true;
      } else {
        console.log('⚠️ AdminPanel уже инициализирована');
      }
    },
    hideAllAdminContent: hideAllAdminContent, // Экспортируем функцию для использования в других модулях
    initialized: false
  };
  
})();


