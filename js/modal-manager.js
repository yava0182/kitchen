/**
 * Система динамических модалок по образцу Clodis
 * Модалки создаются динамически и удаляются при закрытии
 */

(function() {
  'use strict';

  // Хранилище активных модалок
  const activeModals = new Map();

  /**
   * Создать и показать модалку "Список элементов типа"
   */
  function createTypeItemsModal(typeId, typeName) {
    // Удаляем все существующие модалки перед созданием новой
    closeAllModals();

    // Скрываем все контенты админки
    if (window.AdminPanel && typeof window.AdminPanel.hideAllAdminContent === 'function') {
      window.AdminPanel.hideAllAdminContent();
    }

    // Создаем backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'type-elements-backdrop-dynamic';
    backdrop.style.cssText = `
      display: flex;
      position: fixed !important;
      top: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      left: 250px !important;
      background: rgba(0,0,0,0.45) !important;
      z-index: 10003 !important;
      align-items: flex-start;
      justify-content: center;
      padding-top: 40px;
      overflow-y: auto;
    `;

    // Создаем модалку
    const modal = document.createElement('div');
    modal.id = 'type-elements-modal-dynamic';
    modal.style.cssText = `
      background: #fff;
      border-radius: 10px;
      width: 1200px;
      max-width: calc(100vw - 300px);
      margin: 20px auto;
      display: flex;
      flex-direction: column;
      box-shadow: 0 10px 35px rgba(0,0,0,0.3);
      min-height: 600px;
      max-height: calc(100vh - 80px);
      position: relative !important;
      z-index: 10004 !important;
    `;

    // Шапка
    const header = document.createElement('div');
    header.style.cssText = 'padding: 16px 20px; border-bottom: 1px solid #e0e0e0; background: #fff;';
    header.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <div id="type-elements-title-dynamic" style="font-weight: 600; font-size: 18px;">Список ${typeName}</div>
        <button id="btn-type-elements-close-dynamic" style="border: none; background: none; font-size: 24px; line-height: 1; cursor: pointer; color: #888; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">✕</button>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <button class="btn btn-sm btn-primary" id="btn-type-elements-add-dynamic" style="padding: 6px 14px; font-size: 13px;">Добавить</button>
        <button class="btn btn-sm btn-success btn-outline" id="btn-type-elements-categories-dynamic" style="padding: 6px 14px; font-size: 13px;">Категории</button>
        <button class="btn btn-sm btn-success btn-outline" id="btn-type-elements-params-dynamic" style="padding: 6px 14px; font-size: 13px;">Параметры</button>
        <button class="btn btn-sm btn-success btn-outline" id="btn-type-elements-reset-materials-dynamic" style="padding: 6px 14px; font-size: 13px;">Сбросить материалы</button>
        <button class="btn btn-sm btn-success btn-outline" id="btn-type-elements-change-vars-dynamic" style="padding: 6px 14px; font-size: 13px;">Изменить переменные</button>
        <button class="btn btn-sm btn-success btn-outline" id="btn-type-elements-copy-dynamic" style="padding: 6px 14px; font-size: 13px;">Копировать модули</button>
      </div>
    `;

    // Поиск и фильтры
    const filters = document.createElement('div');
    filters.style.cssText = 'padding: 16px 20px; border-bottom: 1px solid #e0e0e0; background: #f8fafc;';
    filters.innerHTML = `
      <div style="display: flex; gap: 16px; align-items: flex-end;">
        <div style="flex: 1;">
          <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Поиск</label>
          <div style="display: flex; gap: 4px;">
            <input id="type-elements-search-dynamic" type="text" placeholder="Поиск" style="flex: 1; padding: 6px 10px; border-radius: 4px; border: 1px solid #d0d7e2; font-size: 13px; height: 30px;" />
            <button type="button" class="btn btn-primary" style="padding: 6px 12px; height: 30px; font-size: 12px;"><i class="fa fa-search"></i></button>
          </div>
        </div>
        <div style="width: 200px;">
          <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Категория</label>
          <select id="type-elements-category-filter-dynamic" style="width: 100%; padding: 6px 10px; border-radius: 4px; border: 1px solid #d0d7e2; font-size: 13px; height: 30px;">
            <option value="">Нет</option>
          </select>
        </div>
        <div style="width: 150px;">
          <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">Количество на странице</label>
          <select id="type-elements-per-page-dynamic" style="width: 100%; padding: 6px 10px; border-radius: 4px; border: 1px solid #d0d7e2; font-size: 13px; height: 30px;">
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
    `;

    // Таблица
    const tableContainer = document.createElement('div');
    tableContainer.style.cssText = 'flex: 1; overflow: auto;';
    tableContainer.innerHTML = `
      <table class="table table-hover table-bordered" style="width: 100%; border-collapse: collapse; font-size: 12px; margin: 0;">
        <thead style="background: #f3f4f6; position: sticky; top: 0; z-index: 1;">
          <tr>
            <th style="padding: 8px 10px; border: 1px solid #e0e0e0; width: 30px; text-align: center;">
              <input type="checkbox" id="type-elements-select-all-dynamic" />
            </th>
            <th style="padding: 8px 10px; border: 1px solid #e0e0e0; width: 50px; text-align: left;">ID</th>
            <th style="padding: 8px 10px; border: 1px solid #e0e0e0; width: 100px; text-align: left;">Иконка</th>
            <th style="padding: 8px 10px; border: 1px solid #e0e0e0; text-align: left; min-width: 200px;">Название</th>
            <th style="padding: 8px 10px; border: 1px solid #e0e0e0; width: 180px; text-align: left;">Размеры</th>
            <th style="padding: 8px 10px; border: 1px solid #e0e0e0; width: 150px; text-align: left;">Артикул</th>
            <th style="padding: 8px 10px; border: 1px solid #e0e0e0; width: 200px; text-align: left;">Категория</th>
            <th style="padding: 8px 10px; border: 1px solid #e0e0e0; width: 80px; text-align: left;">Порядок</th>
            <th style="padding: 8px 10px; border: 1px solid #e0e0e0; width: 90px; text-align: left;">Видимость</th>
            <th style="padding: 8px 10px; border: 1px solid #e0e0e0; width: 150px; text-align: left;">Действия</th>
          </tr>
        </thead>
        <tbody id="type-elements-table-body-dynamic">
          <!-- строки элементов типа рендерит скрипт -->
        </tbody>
      </table>
    `;

    // Пагинация
    const pagination = document.createElement('div');
    pagination.style.cssText = 'padding: 12px 20px; border-top: 1px solid #e0e0e0; background: #fff; display: flex; justify-content: space-between; align-items: center;';
    pagination.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <button class="btn btn-sm btn-primary" id="btn-type-elements-add-bottom-dynamic" style="padding: 6px 14px; font-size: 13px;">Добавить</button>
      </div>
      <div>
        <ul class="pagination" style="margin: 0; padding: 0; list-style: none; display: flex; gap: 4px;">
          <li><button class="btn btn-sm" disabled style="padding: 4px 8px;">&lt;&lt;</button></li>
          <li><button class="btn btn-sm" disabled style="padding: 4px 8px;">&lt;</button></li>
          <li><button class="btn btn-sm btn-primary" style="padding: 4px 8px;">1</button></li>
          <li><button class="btn btn-sm" style="padding: 4px 8px;">2</button></li>
          <li><button class="btn btn-sm" style="padding: 4px 8px;">3</button></li>
          <li><button class="btn btn-sm" style="padding: 4px 8px;">4</button></li>
          <li><button class="btn btn-sm" style="padding: 4px 8px;">5</button></li>
          <li><button class="btn btn-sm" style="padding: 4px 8px;">&gt;</button></li>
          <li><button class="btn btn-sm" style="padding: 4px 8px;">&gt;&gt;</button></li>
        </ul>
      </div>
    `;

    // Собираем модалку
    modal.appendChild(header);
    modal.appendChild(filters);
    modal.appendChild(tableContainer);
    modal.appendChild(pagination);
    backdrop.appendChild(modal);

    // Добавляем в body
    document.body.appendChild(backdrop);

    // Сохраняем в хранилище
    activeModals.set('type-elements', backdrop);

    // Обработчики событий
    const closeBtn = backdrop.querySelector('#btn-type-elements-close-dynamic');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => closeModal('type-elements'));
    }

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal('type-elements');
      }
    });

    // Сохраняем typeId для использования в renderTypeItemsTable
    window.currentTypeItemsId = typeId;
    
    // Рендерим таблицу сразу после создания модалки
    renderTypeItemsTableDynamic(backdrop, typeId).catch(err => console.error('Ошибка рендеринга таблицы:', err));
    
    // Обработчик поиска
    const searchInput = backdrop.querySelector('#type-elements-search-dynamic');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        renderTypeItemsTableDynamic(backdrop, typeId).catch(err => console.error('Ошибка рендеринга таблицы:', err));
      });
    }
    
    // Обработчик кнопки "Добавить"
    const addBtn = backdrop.querySelector('#btn-type-elements-add-dynamic');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        if (window.openCatalogItemEditModal) {
          window.openCatalogItemEditModal(typeName);
        }
      });
    }
    
    // Обработчики других кнопок (заглушки)
    const categoriesBtn = backdrop.querySelector('#btn-type-elements-categories-dynamic');
    if (categoriesBtn) {
      categoriesBtn.addEventListener('click', () => {
        console.log('Категории (не реализовано)');
      });
    }
    
    const paramsBtn = backdrop.querySelector('#btn-type-elements-params-dynamic');
    if (paramsBtn) {
      paramsBtn.addEventListener('click', () => {
        console.log('Параметры (не реализовано)');
      });
    }
    
    console.log('✅ [createTypeItemsModal] Модалка создана и показана');
  }

  /**
   * Рендеринг таблицы элементов для динамической модалки
   */
  async function renderTypeItemsTableDynamic(backdropEl, currentTypeId) {
    const tableBody = backdropEl.querySelector('#type-elements-table-body-dynamic');
    if (!tableBody) return;
    
    // ⭐ Сначала загружаем каталог с сервера для синхронизации
    try {
      // Используем относительный путь (в продакшене API на том же домене)
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001/catalog/items_list/'
        : '/catalog/items_list/';
      
      // Добавляем обработку ошибок сети без вывода в консоль
      let response;
      try {
        // Используем fetch с таймаутом через AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        response = await fetch(apiUrl, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (err) {
        // Тихая обработка ошибок сети (сервер недоступен)
        console.log('ℹ️ [renderTypeItemsTableDynamic] API сервер недоступен, используем локальный каталог');
        response = null;
      }
      
      if (!response || !response.ok) {
        // Сервер недоступен или ошибка, используем локальный каталог
        // Продолжаем выполнение с локальными данными
        console.log('ℹ️ [renderTypeItemsTableDynamic] Используем локальный каталог из localStorage');
      } else {
        const data = await response.json();
        if (data.result === 'success' && data.items) {
          // Преобразуем формат сервера в формат CatalogElement и сохраняем в localStorage
          const serverItems = data.items;
          const catalogElements = serverItems.map(item => {
            let clodisJSON = null;
            const readJson =
              typeof globalThis !== 'undefined' && typeof globalThis.__cldReadClodisJSON === 'function'
                ? globalThis.__cldReadClodisJSON
                : (o) => (o && Array.isArray(o.clodisJSON) ? o.clodisJSON : null);
            if (item.data) {
              try {
                const parsed = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
                clodisJSON =
                  readJson(parsed) ||
                  (parsed.params && Array.isArray(parsed.params) ? parsed.params : null);
              } catch (e) {
                console.warn('Ошибка парсинга data для элемента:', item.id, e);
              }
            } else {
              clodisJSON = readJson(item);
            }
            
            let size = { width: 600, height: 720, depth: 300 };
            if (clodisJSON && clodisJSON.length > 0) {
              const rootSection = clodisJSON.find(p => p.type === 'section');
              if (rootSection && rootSection.size) {
                size = {
                  width: typeof rootSection.size.x === 'number' ? rootSection.size.x : 600,
                  height: typeof rootSection.size.y === 'number' ? rootSection.size.y : 720,
                  depth: typeof rootSection.size.z === 'number' ? rootSection.size.z : 300
                };
              }
            }
            
            return {
              id: String(item.id),
              name: item.name || `Элемент ${item.id}`,
              type: item.element_type || 'section',
              elementType: item.element_type || 'section',
              metadata: {
                name: item.name || `Элемент ${item.id}`,
                type: item.element_type || 'section',
                size: size,
                createdAt: item.created_at || new Date().toISOString(),
                element_type: item.element_type || 'section',
                cabinet_tag: item.cabinet_tag || '',
                catalog_type: item.catalog_type || '',
                category: Array.isArray(item.category) ? item.category : []
              },
              clodisJSON: clodisJSON
            };
          });
          
          // Объединяем с существующими элементами из localStorage
          const existingKey = 'elementCatalog';
          const existingJson = localStorage.getItem(existingKey);
          let existingElements = [];
          if (existingJson) {
            try {
              existingElements = JSON.parse(existingJson);
            } catch (e) {
              console.warn('Ошибка парсинга существующих элементов:', e);
            }
          }
          
          const existingIds = new Set(existingElements.map(el => el.id));
          const mergedElements = [...existingElements];
          
          catalogElements.forEach(serverElement => {
            const existingIndex = mergedElements.findIndex(el => el.id === serverElement.id);
            if (existingIndex >= 0) {
              mergedElements[existingIndex] = serverElement;
            } else {
              mergedElements.push(serverElement);
            }
          });
          
          localStorage.setItem(existingKey, JSON.stringify(mergedElements));
          console.log('✅ [renderTypeItemsTableDynamic] Каталог синхронизирован с сервером:', mergedElements.length, 'элементов');
        }
      }
    } catch (error) {
      console.warn('⚠️ [renderTypeItemsTableDynamic] Ошибка загрузки каталога с сервера, используем localStorage:', error);
    }
    
    // Загружаем все элементы каталога из localStorage
    let allElements = [];
    try {
      const catalogKey = 'elementCatalog';
      const stored = localStorage.getItem(catalogKey) || '[]';
      allElements = JSON.parse(stored);
    } catch (e) {
      console.error('Ошибка загрузки элементов:', e);
      allElements = [];
    }
    
    // Фильтр по поиску
    const searchInput = backdropEl.querySelector('#type-elements-search-dynamic');
    const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
    
    let elements = allElements.slice();
    if (searchQuery) {
      elements = elements.filter(el => {
        const name = (el.name || '').toLowerCase();
        const article = ((el.metadata && el.metadata.article) || '').toLowerCase();
        return name.includes(searchQuery) || article.includes(searchQuery);
      });
    }
    
    if (!elements.length) {
      tableBody.innerHTML = '<tr><td colspan="10" style="padding:16px; text-align:center; color:#999;">Нет элементов для этого типа</td></tr>';
      return;
    }
    
    const rows = [];
    elements.forEach((el, index) => {
      const size = el.metadata?.size;
      const sizeStr = size && size.width && size.height && size.depth
        ? `${Math.round(size.width * 1000)}×${Math.round(size.height * 1000)}×${Math.round(size.depth * 1000)}`
        : '';
      const article = el.metadata?.article || '';
      const category = el.type || '';
      const elementId = el.id || `item-${index}`;
      
      const sizesHtml = sizeStr 
        ? `<p style="margin:2px 0;">${sizeStr}</p>`
        : '<p style="margin:2px 0;">&nbsp;</p>';
      
      const articlesHtml = article
        ? `<p style="margin:2px 0;">${article}&nbsp;</p>`
        : '<p style="margin:2px 0;">&nbsp;</p>';
      
      rows.push(`
        <tr>
          <td style="padding:6px; border:1px solid #e0e0e0; text-align:center; width:30px;">
            <input type="checkbox" value="${elementId}" />
          </td>
          <td style="padding:6px; border:1px solid #e0e0e0; width:50px;">${elementId}</td>
          <td style="padding:6px; border:1px solid #e0e0e0; width:100px;">
            <div style="width:100px; height:60px; border-radius:4px; background:#e5e9f0; display:block;"></div>
          </td>
          <td style="padding:6px; border:1px solid #e0e0e0;">
            <p style="margin:0;">${el.name || ''}</p>
          </td>
          <td style="padding:6px; border:1px solid #e0e0e0; width:180px;">${sizesHtml}</td>
          <td style="padding:6px; border:1px solid #e0e0e0; width:150px;">${articlesHtml}</td>
          <td style="padding:6px; border:1px solid #e0e0e0; width:200px;">
            <div><div><span>${category || ''}</span></div></div>
          </td>
          <td style="padding:6px; border:1px solid #e0e0e0; width:80px;">0</td>
          <td style="padding:6px; border:1px solid #e0e0e0; width:90px;">
            <i class="fa fa-eye btn btn-outline btn-primary" style="cursor:pointer; padding:4px 8px; font-size:12px;"></i>
          </td>
          <td style="padding:6px; border:1px solid #e0e0e0; width:150px;">
            <a href="#" class="btn-edit-item" data-id="${elementId}" style="text-decoration:none; margin-right:6px;">
              <i class="fa fa-edit btn btn-outline btn-success" title="Редактировать" style="cursor:pointer; padding:4px 8px; font-size:12px;"></i>
            </a>
            <i class="fa fa-copy btn btn-outline btn-info btn-copy-item" data-id="${elementId}" title="Копировать" style="cursor:pointer; padding:4px 8px; font-size:12px; margin:0 6px;"></i>
            <i class="fa fa-trash btn btn-outline btn-danger btn-delete-item" data-id="${elementId}" title="Удалить" style="cursor:pointer; padding:4px 8px; font-size:12px;"></i>
          </td>
        </tr>
      `);
    });
    
    tableBody.innerHTML = rows.join('');
    
    // Обработчики действий
    tableBody.querySelectorAll('.btn-edit-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        const element = elements.find(el => el.id === id);
        if (element && window.openCatalogItemEditModal) {
          const typeName = backdropEl.querySelector('#type-elements-title-dynamic')?.textContent.replace('Список ', '') || '';
          window.openCatalogItemEditModal(typeName, element);
        }
      });
    });
    
    tableBody.querySelectorAll('.btn-delete-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Удалить элемент?')) {
          // Удаление из localStorage
          const catalogKey = 'elementCatalog';
          const catalogJson = localStorage.getItem(catalogKey) || '[]';
          let catalogElements = [];
          try {
            catalogElements = JSON.parse(catalogJson);
          } catch (e) {
            console.error('Ошибка парсинга каталога:', e);
          }
          const updated = catalogElements.filter(el => el.id !== id);
          localStorage.setItem(catalogKey, JSON.stringify(updated));
          renderTypeItemsTableDynamic(backdropEl, currentTypeId).catch(err => console.error('Ошибка рендеринга:', err));
        }
      });
    });
  }

  /**
   * Закрыть конкретную модалку
   */
  function closeModal(modalId) {
    const modal = activeModals.get(modalId);
    if (modal) {
      modal.style.opacity = '0';
      modal.style.transition = 'opacity 0.3s';
      setTimeout(() => {
        modal.remove();
        activeModals.delete(modalId);
        console.log(`✅ [closeModal] Модалка ${modalId} удалена из DOM`);
      }, 300);
    }
  }

  /**
   * Закрыть все модалки
   */
  function closeAllModals() {
    activeModals.forEach((modal, id) => {
      modal.remove();
      console.log(`✅ [closeAllModals] Модалка ${id} удалена`);
    });
    activeModals.clear();
  }

  // Экспорт функций
  window.ModalManager = {
    createTypeItemsModal: createTypeItemsModal,
    closeModal: closeModal,
    closeAllModals: closeAllModals
  };

  console.log('✅ ModalManager инициализирован');

})();

