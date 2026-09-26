            editIcon.title = 'Редактировать';
            editLink.appendChild(editIcon);
            
          // Удалить (по референсу: <i class="fa fa-trash btn btn-outline btn-danger"></i> с show_swal)
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
            
          // Добавляем ячейки в строку (по референсу: Чекбокс, ID, Название, Действия)
            row.appendChild(checkboxCell);
            row.appendChild(idCell);
            row.appendChild(nameCell);
            row.appendChild(actionsCell);
            
          // Добавляем строку в таблицу
            tbody.appendChild(row);
          });
        // Обновляем подменю "Каталог элементов" с типами (по референсу) - используем все данные
        updateCatalogSubmenu(allData);
        
        // Рендерим пагинацию
        renderCatalogTypesPagination(allData.length);
      }
    
    // Рендеринг пагинации для типов элементов
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
    
    // Обновление подменю "Каталог элементов" с типами (по референсу admin-full-REFERENCE.html)
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
        return;
      }
      
      // Добавляем каждый тип элемента в меню (по референсу)
      catalogTypes.forEach(type => {
        // Генерируем key из name (например, "Кухни" -> "catalog_module")
        // В референсе используется key из данных, но у нас его нет, поэтому генерируем
        const key = type.key || `catalog_${type.id}`;
        const name = type.name || '';
        
        // Создаем элемент меню (по референсу: <li style="position: relative">)
        const li = document.createElement('li');
        li.setAttribute('data-catalog-type', type.id);
        li.style.position = 'relative';
        
        // Создаем ссылку (по референсу: /catalog/items/catalog_module)
        const link = document.createElement('a');
        link.href = `#catalog-items?type=${key}`;
        link.textContent = name;
        link.setAttribute('data-page', 'catalog-items');
        link.setAttribute('data-catalog-type', key);
        link.setAttribute('data-catalog-name', name);
        li.appendChild(link);
        
        // Создаем кнопку "Категории" (по референсу: cat_button)
        const catButton = document.createElement('div');
        catButton.className = 'cat_button';
        catButton.title = `Категории ${name}`;
        const catButtonLink = document.createElement('a');
        // Используем универсальную страницу дерева категорий (edges-categories),
        // передаём туда тип каталога. Это та же логика, что и у кнопки "Категории"
        // в шапке списка элементов.
        catButtonLink.href = `#edges-categories?type=${key}`;
        catButtonLink.innerHTML = '<i class="fa fa-folder-open-o"></i>';
        catButton.appendChild(catButtonLink);
        li.appendChild(catButton);
        
        // Добавляем в подменю
        submenu.appendChild(li);
      });
    }

    // Обновление подменю "Плитные материалы" динамическими типами (ЛДСП/ХДФ/...)
    function updateMaterialsSubmenu(materialsKeys) {
      const submenu = document.getElementById('materials-submenu');
      if (!submenu) {
        console.warn('⚠️ Подменю "Плитные материалы" не найдено');
        return;
      }

      // Удаляем старые динамические пункты (сохраняем "Список материалов" и "Группы материалов")
      const existingDynamicItems = submenu.querySelectorAll('li[data-material-key]');
      existingDynamicItems.forEach(item => item.remove());

      if (!materialsKeys || !Array.isArray(materialsKeys) || materialsKeys.length === 0) {
        return;
      }

      // Добавляем каждый материал в меню как "папку" (по аналогии с рефом)
      materialsKeys.forEach(mat => {
        const id = mat?.id;
        const name = (mat?.name || '').toString().trim();
        if (!name) return;

        const typeKey = `material_${id ?? name}`;

        const li = document.createElement('li');
        li.setAttribute('data-material-key', String(id ?? name));
        li.style.position = 'relative';

        const link = document.createElement('a');
        // По аналогии с "Каталог элементов": ведём на страницу списка элементов конкретного типа
        link.href = `#materials-items?type=${encodeURIComponent(typeKey)}`;
        link.setAttribute('data-page', 'materials-items');
        // Используем те же атрибуты, что и для каталога, чтобы работала общая навигация
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
    
    // loadCatalogItems - admin-catalog-items.js

    // loadClientsOrders - admin-orders.js

    // loadMenuSettings, saveMenuSettings - admin-menu.js

        // Простая логика переключения страниц (без старого кода)
    document.addEventListener('DOMContentLoaded', function() {
      // Обработчик раскрытия/скрытия подменю (как в референсе metismenu)
      // Находим все ссылки, у которых есть стрелка (.fa.arrow) - это родительские пункты меню с подменю
      const menuItemsWithSubmenu = document.querySelectorAll('#side-menu > li > a .fa.arrow');
      menuItemsWithSubmenu.forEach(arrow => {
        const link = arrow.closest('a');
        if (link) {
          link.addEventListener('click', function(e) {
            const submenu = this.nextElementSibling;
            if (submenu && submenu.classList.contains('nav-second-level')) {
              e.preventDefault();
              e.stopPropagation(); // Предотвращаем всплытие события
              const isCollapsed = submenu.classList.contains('collapse');
              
              // Закрываем все другие подменю
              document.querySelectorAll('.nav-second-level').forEach(menu => {
                if (menu !== submenu) {
                  menu.classList.add('collapse');
                  const parentLink = menu.previousElementSibling;
                  if (parentLink) {
                    const parentArrow = parentLink.querySelector('.fa.arrow');
                    if (parentArrow) parentArrow.classList.remove('active');
                  }
                }
              });
              
              // Переключаем текущее подменю
              if (isCollapsed) {
                submenu.classList.remove('collapse');
                arrow.classList.add('active');
              } else {
                submenu.classList.add('collapse');
                arrow.classList.remove('active');
              }
            }
          });
        }
      });
      
      const pages = document.querySelectorAll('.admin-page');
      
      // Обработчик клика на ссылки меню (делегирование событий для динамически созданных ссылок)
      document.getElementById('side-menu').addEventListener('click', function(e) {
        const link = e.target.closest('a[data-page]');
        if (!link) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const pageId = link.getAttribute('data-page');
        // Убираем active со всех пунктов меню
        document.querySelectorAll('#side-menu li').forEach(li => {
          li.classList.remove('active');
        });
        
        // Добавляем active текущему пункту
        const parentLi = link.closest('li');
        if (parentLi) {
          parentLi.classList.add('active');
          // Также делаем активным родительский пункт, если есть
          const parentMenu = parentLi.closest('.nav-second-level');
          if (parentMenu) {
            const parentLink = parentMenu.previousElementSibling;
            if (parentLink && parentLink.tagName === 'A') {
              parentLink.closest('li').classList.add('active');
              // Раскрываем подменю
              parentMenu.classList.remove('collapse');
              const arrow = parentLink.querySelector('.fa.arrow');
              if (arrow) arrow.classList.add('active');
            }
          }
        }
        
        // Скрываем все страницы
        pages.forEach(page => {
          page.classList.remove('active');
        });
        
        // Показываем нужную страницу
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
          targetPage.classList.add('active');
          // Обновляем URL в строке браузера (по референсу: URL меняется при переключении)
          const catalogType = link.getAttribute('data-catalog-type');
          const catalogName = link.getAttribute('data-catalog-name');
          const edgesType = link.getAttribute('data-edges-type');
          const edgesName = link.getAttribute('data-edges-name');
          let newHash = '#' + pageId;
          if (catalogType) {
            newHash += `?type=${encodeURIComponent(catalogType)}`;
          } else if (edgesType && pageId === 'edges-items') {
            newHash += `?type=${encodeURIComponent(edgesType)}&name=${encodeURIComponent(edgesName || '')}`;
          }
          if (window.location.hash !== newHash) {
            window.history.pushState({ page: pageId, type: catalogType || edgesType }, '', newHash);
          }
          
          // Загружаем заявки при открытии страницы "Заявки на расчет"
          if (pageId === 'clients-orders') {
            loadClientsOrders();
          }
          
          // Загружаем меню при открытии страницы "Настройка меню"
          if (pageId === 'menu-settings') {
            loadMenuSettings();
          }
          
          // Загружаем типы элементов при открытии страницы "Типы элементов"
          if (pageId === 'catalog-types') {
            loadCatalogTypes();
          }
          
          // Обрабатываем страницу списка элементов каталога (Кухни, Двери и т.д.)
          if (pageId === 'catalog-items') {
            const catalogTypeFromLink = link.getAttribute('data-catalog-type');
            const catalogNameFromLink = link.getAttribute('data-catalog-name');
            
            // Извлекаем тип из URL, если не нашли в атрибутах
            const hash = window.location.hash;
            const urlParams = new URLSearchParams(hash.split('?')[1] || '');
            const catalogType = catalogTypeFromLink || urlParams.get('type');
            const catalogName = catalogNameFromLink || catalogType || 'Элементы';
            if (catalogType) {
              loadCatalogItems(catalogType, catalogName);
            } else {
              console.warn('⚠️ Тип каталога не найден, показываем пустую страницу');
            }
          }
          
          // Обрабатываем страницу редактирования типа элемента
          if (pageId === 'catalog-type-edit') {
            const urlParams = new URLSearchParams(window.location.search);
            const itemId = urlParams.get('id') || '0';
            loadCatalogTypeEdit(itemId);
          }
          
          // Обрабатываем страницу групп
          if (pageId === 'catalog-groups') {
            loadCatalogGroups();
          }
          
          // Обрабатываем страницу редактирования группы
          if (pageId === 'catalog-group-edit') {
            const urlParams = new URLSearchParams(window.location.search);
            const itemId = urlParams.get('id') || '0';
            loadCatalogGroupEdit(itemId);
          }
          
          // Обрабатываем страницу групп материалов
          if (pageId === 'materials-groups') {
            if (typeof loadMaterialsGroups === 'function') loadMaterialsGroups();
          }
          
          // Обрабатываем страницу редактирования группы материалов
          if (pageId === 'material-group-edit') {
            const hash = window.location.hash;
            const urlParams = new URLSearchParams(hash.split('?')[1] || '');
            const itemId = parseInt(urlParams.get('id') || '0', 10);
            if (typeof window.openMaterialGroupEdit === 'function') window.openMaterialGroupEdit(itemId);
          }
          
          // Обрабатываем страницу глобальных переменных
          if (pageId === 'global-vars') {
            if (typeof window.loadGlobalVars === 'function') {
              window.loadGlobalVars();
            } else {
              console.error('❌ Функция loadGlobalVars не найдена');
            }
          }
          
          // Обрабатываем страницу списка материалов
          if (pageId === 'materials-keys') {
            if (typeof window.loadMaterialsKeys === 'function') {
              window.loadMaterialsKeys();
            } else {
              console.error('❌ Функция loadMaterialsKeys не найдена');
            }
          }

          // Каталог 3D моделей — материалы
          if (pageId === 'models3d-materials') {
            if (typeof window.loadModels3dMaterials === 'function') {
              window.loadModels3dMaterials();
            }
          }

          // Каталог 3D моделей — список моделей
          if (pageId === 'models3d-list') {
            if (typeof window.loadModels3dList === 'function') {
              window.loadModels3dList();
            }
          }

          // Каталог 3D моделей — редактирование 3D модели
          if (pageId === 'models3d-item-edit') {
            const hash = window.location.hash;
            const urlParams = new URLSearchParams(hash.split('?')[1] || '');
            const itemId = parseInt(urlParams.get('id') || '0', 10);
            if (typeof window.loadModels3dItemEdit === 'function') {
              window.loadModels3dItemEdit(itemId);
            }
          }

          // Каталог 3D моделей — редактирование ключ-материала (как в рефе)
          if (pageId === 'model-key-material-edit') {
            const hash = window.location.hash;
            const urlParams = new URLSearchParams(hash.split('?')[1] || '');
            const itemId = parseInt(urlParams.get('id') || '0', 10);
            if (typeof window.loadModelKeyMaterialEdit === 'function') {
              window.loadModelKeyMaterialEdit(itemId);
            }
          }
          
          // Управление комнатой
          if (pageId === 'room-settings') {
            if (typeof window.loadRoomSettings === 'function') window.loadRoomSettings();
          }
          
          // Обрабатываем страницу списка наборов кромок
          if (pageId === 'edges-keys') {
            if (typeof window.loadEdgesKeys === 'function') window.loadEdgesKeys();
          }
          if (pageId === 'edges-categories') {
            if (typeof window.loadEdgesCategories === 'function') window.loadEdgesCategories();
          }
          // Обрабатываем страницу списка кромок (как materials-items: тип и название из ссылки)
          if (pageId === 'edges-items') {
            const typeFromLink = link.getAttribute('data-edges-type');
            const nameFromLink = link.getAttribute('data-edges-name') || '';
            const hash = window.location.hash;
            const urlParams = new URLSearchParams(hash.split('?')[1] || '');
            const typeKey = typeFromLink || urlParams.get('type') || '';
            const edgesName = nameFromLink || (typeof getEdgesNameFromMenu === 'function' ? getEdgesNameFromMenu(typeKey) : '') || typeKey;
            if (typeKey && typeof loadEdgesItems === 'function') {
              loadEdgesItems(typeKey, edgesName);
            } else if (typeof window.loadEdgesItemsFromHash === 'function') {
              window.loadEdgesItemsFromHash();
            }
          }

          // Обрабатываем страницу "Модели фрезеровок" (список фасадов)
          if (pageId === 'facades-items') {
            if (typeof window.loadFacades === 'function') {
              window.loadFacades();
            } else {
              console.error('❌ Функция loadFacades не найдена при переходе на страницу facades-items');
            }
          }
          
          // Обрабатываем страницу редактирования набора кромок
          if (pageId === 'edge-key-edit') {
            const urlParams = new URLSearchParams(window.location.search);
            const hash = window.location.hash;
            const urlParamsFromHash = new URLSearchParams(hash.split('?')[1] || '');
            const itemId = parseInt(urlParams.get('id') || urlParamsFromHash.get('id') || '0', 10);
            if (typeof window.openEdgeKeyEdit === 'function') {
              window.openEdgeKeyEdit(itemId);
            }
          }

      // Обрабатываем страницу редактирования кромки (edge-item-edit)
          if (pageId === 'edge-item-edit') {
            const hash = window.location.hash;
            const urlParams = new URLSearchParams(hash.split('?')[1] || '');
            const typeKey = urlParams.get('type') || '';
            const itemId = parseInt(urlParams.get('id') || '0', 10);
            if (typeof window.loadEdgeItemEdit === 'function' && typeKey) {
              loadEdgeItemEdit(typeKey, itemId);
            }
          }

      // Обрабатываем страницу редактирования фасада (facade-item-edit)
      if (pageId === 'facade-item-edit') {
        const hash = window.location.hash;
        const urlParams = new URLSearchParams(hash.split('?')[1] || '');
        const itemId = parseInt(urlParams.get('id') || '0', 10);
        if (typeof window.loadFacadeItemEdit === 'function') {
          window.loadFacadeItemEdit(itemId);
        }
      }

          // Обрабатываем страницу элементов конкретного типа материала (ЛДСП/ХДФ/...)
          if (pageId === 'materials-items') {
            const typeFromLink = link.getAttribute('data-catalog-type');
            const nameFromLink = link.getAttribute('data-catalog-name') || link.getAttribute('data-material-name') || '';
            const hash = window.location.hash;
            const urlParams = new URLSearchParams(hash.split('?')[1] || '');
            const typeKey = typeFromLink || urlParams.get('type') || '';
            const matName = nameFromLink || getMaterialNameFromMenu(typeKey) || typeKey;
            if (typeKey) loadMaterialsItems(typeKey, matName);
          }
          
          // Обрабатываем страницу редактирования материала
          if (pageId === 'material-key-edit') {
            const urlParams = new URLSearchParams(window.location.search);
            const itemId = urlParams.get('id') || '0';
            if (typeof window.loadMaterialKeyEdit === 'function') {
              window.loadMaterialKeyEdit(parseInt(itemId));
            } else {
              console.error('❌ Функция loadMaterialKeyEdit не найдена');
            }
          }

          // Обрабатываем страницу редактирования элемента материала
          if (pageId === 'material-item-edit') {
            const hash = window.location.hash;
            const urlParams = new URLSearchParams(hash.split('?')[1] || '');
            const typeKey = urlParams.get('type') || '';
            const itemId = parseInt(urlParams.get('id') || '0', 10);
            loadMaterialItemEdit(typeKey, itemId);
          }
          
          // Обрабатываем страницу редактирования элемента каталога
          if (pageId === 'catalog-item-edit') {
            const hash = window.location.hash;
            const urlParams = new URLSearchParams(hash.split('?')[1] || '');
            const catalogType = urlParams.get('type') || '';
            const itemId = parseInt(urlParams.get('id') || '0');
            const catalogName = urlParams.get('name') || 'Элемент';
            openCatalogItemEdit(itemId, catalogType, catalogName);
          }
          
          // Загружаем библиотеку комплектующих при открытии страницы "Комплектующие и фурнитура"
          if (pageId === 'accessories-library') {
            loadAccessoriesLibrary();
            // Убеждаемся, что обработчики привязаны (на случай если DOMContentLoaded уже сработал)
            setTimeout(() => {
              const addBtn = document.getElementById('accessories-library-add-btn');
              if (addBtn && !addBtn.hasAttribute('data-cld-handler-attached')) {
                addBtn.setAttribute('data-cld-handler-attached', 'true');
                addBtn.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (typeof window.openAccessoryEditModal === 'function') {
                    window.openAccessoryEditModal(null);
                  } else {
                    console.error('[CLD][accessories-library] Функция openAccessoryEditModal не найдена!');
                    alert('Ошибка: функция открытия модального окна не найдена. Перезагрузите страницу.');
                  }
                });
              }
            }, 100);
          }
        } else {
          console.warn('⚠️ Страница не найдена:', pageId);
        }
      });
      
      // Обработчик кнопки "Добавить" для типов элементов
      const addCatalogTypeBtn = document.getElementById('add-catalog-type-btn');
      if (addCatalogTypeBtn) {
        addCatalogTypeBtn.addEventListener('click', function() {
          openCatalogTypeEdit(0);
        });
      }
      
      // Обработчик чекбокса "Выбрать все" для типов элементов
      const selectAllCheckbox = document.getElementById('select-all-catalog-types');
      if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function(e) {
          const checkboxes = document.querySelectorAll('.catalog-type-checkbox');
          checkboxes.forEach(checkbox => {
            checkbox.checked = e.target.checked;
          });
        });
      }
      
      // Обработчик изменения количества на странице для типов элементов
      const perPageSelect = document.getElementById('per-page-select');
      if (perPageSelect) {
        perPageSelect.addEventListener('change', function(e) {
          const newPerPage = parseInt(e.target.value) || 20;
          catalogTypesPagination.perPage = newPerPage;
          catalogTypesPagination.currentPage = 1; // Сбрасываем на первую страницу
          renderCatalogTypesTable();
        });
      }
      
      // Обработчик кнопки "Сохранить" для глобальных переменных (верхняя)
      const saveGlobalVarsBtn = document.getElementById('save-global-vars-btn');
      if (saveGlobalVarsBtn) {
        saveGlobalVarsBtn.addEventListener('click', function() {
          if (typeof window.saveGlobalVars === 'function') {
            window.saveGlobalVars();
          } else {
            console.error('❌ Функция saveGlobalVars не найдена');
            alert('Ошибка: функция сохранения не найдена. Перезагрузите страницу.');
          }
        });
      }
      
      // Обработчик кнопки "Сохранить" для глобальных переменных (нижняя)
      const saveGlobalVarsBottomBtn = document.getElementById('save-global-vars-bottom-btn');
      if (saveGlobalVarsBottomBtn) {
        saveGlobalVarsBottomBtn.addEventListener('click', function() {
          if (typeof window.saveGlobalVars === 'function') {
            window.saveGlobalVars();
          } else {
            console.error('❌ Функция saveGlobalVars не найдена');
            alert('Ошибка: функция сохранения не найдена. Перезагрузите страницу.');
          }
        });
      }
      
      // Управление комнатой: кнопка сохранения
      const roomSettingsSaveBtn = document.getElementById('room-settings-save-btn');
      if (roomSettingsSaveBtn) {
        roomSettingsSaveBtn.addEventListener('click', function() {
          if (typeof window.saveRoomSettings === 'function') window.saveRoomSettings();
        });
      }
      // Шаги комнаты: добавить иконку (текущий выбранный шаг)
      var roomStepAddBtn = document.getElementById('room-step-add-btn');
      if (roomStepAddBtn) {
        roomStepAddBtn.addEventListener('click', function() {
          var container = document.getElementById('room-step-items');
          if (!container) return;
          var firstMuted = container.querySelector('.text-muted');
          if (firstMuted) firstMuted.remove();
          var id = 'i' + Date.now();
          var newRow = document.createElement('div');
          newRow.className = 'room-step-item border-bottom pb-2 mb-2';
          newRow.setAttribute('data-id', id);
          newRow.innerHTML = '<div class="d-flex align-items-center flex-wrap gap-2">' +
            '<div class="room-step-preview" style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;background:#fff;border:1px solid #ddd;border-radius:8px;"><i class="fa fa-circle" style="font-size:28px;color:#333;"></i></div>' +
            '<input type="text" class="form-control form-control-sm room-step-name" placeholder="Название" style="width:130px">' +
            '<input type="text" class="form-control form-control-sm room-step-icon" placeholder="fa-couch или URL" value="fa-circle" style="width:180px">' +
            '<button type="button" class="btn btn-sm btn-outline-secondary room-step-upload-btn" title="Загрузить картинку"><i class="fa fa-upload"></i> Загрузить</button>' +
            '<input type="text" class="form-control form-control-sm room-step-key" placeholder="Ключ" style="width:100px">' +
            '<select class="form-control form-control-sm room-step-category" style="width:130px"><option value="">— Категория —</option></select>' +
            '<input type="number" class="form-control form-control-sm room-step-order" value="0" style="width:50px">' +
            '<button type="button" class="btn btn-sm btn-outline-danger room-step-del" title="Удалить"><i class="fa fa-trash"></i></button>' +
            '</div>';
          container.appendChild(newRow);
          newRow.querySelector('.room-step-del').addEventListener('click', function() { newRow.remove(); });
          var uploadBtn = newRow.querySelector('.room-step-upload-btn');
          if (uploadBtn) uploadBtn.addEventListener('click', function() {
            window._roomStepUploadTarget = newRow.querySelector('.room-step-icon');
            var upl = document.getElementById('room-step-icon-upload-input');
            if (upl) upl.click();
          });
          newRow.querySelector('.room-step-icon').addEventListener('input', function() {
            var v = this.value.trim();
            var isImg = /^https?:\/\//i.test(v) || v.startsWith('/');
            var prev = newRow.querySelector('.room-step-preview');
            if (prev) {
              if (isImg) prev.innerHTML = '<img src="' + v.replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:contain;border-radius:6px;" onerror="this.style.display=\'none\';"><i class="fa fa-image" style="font-size:24px;color:#999;"></i>';
              else prev.innerHTML = '<i class="fa ' + (v || 'fa-circle') + '" style="font-size:28px;color:#333;"></i>';
            }
          });
          updateRoomStepItemsCount();
        });
      }
      const roomStepsSaveBtn = document.getElementById('room-steps-save-btn');
      if (roomStepsSaveBtn) {
        roomStepsSaveBtn.addEventListener('click', function() {
          if (typeof window.saveRoomSteps === 'function') window.saveRoomSteps();
        });
      }
      
      // Обработчик кнопки "Добавить переменную"
      const addGlobalVarBtn = document.getElementById('add-global-var-btn');
      if (addGlobalVarBtn) {
        addGlobalVarBtn.addEventListener('click', function() {
          if (typeof window.addGlobalVar === 'function') {
            window.addGlobalVar();
          } else {
            console.error('❌ Функция addGlobalVar не найдена');
            alert('Ошибка: функция добавления не найдена. Перезагрузите страницу.');
          }
        });
      }
      
      // Обработчик кнопки "Добавить" для групп
      const addCatalogGroupBtn = document.getElementById('add-catalog-group-btn');
      if (addCatalogGroupBtn) {
        addCatalogGroupBtn.addEventListener('click', function() {
          openCatalogGroupEdit(0);
        });
      }
      
      // Обработчик чекбокса "Выбрать все" для групп
      const selectAllGroupsCheckbox = document.getElementById('select-all-catalog-groups');
      if (selectAllGroupsCheckbox) {
        selectAllGroupsCheckbox.addEventListener('change', function(e) {
          const checkboxes = document.querySelectorAll('.catalog-group-checkbox');
          checkboxes.forEach(checkbox => {
            checkbox.checked = e.target.checked;
          });
        });
      }
      
      // Обработчик изменения количества на странице для групп
      const groupsPerPageSelect = document.getElementById('groups-per-page-select');
      if (groupsPerPageSelect) {
        groupsPerPageSelect.addEventListener('change', function(e) {
          const newPerPage = parseInt(e.target.value) || 20;
          catalogGroupsPagination.perPage = newPerPage;
          catalogGroupsPagination.currentPage = 1;
          renderCatalogGroupsTable();
        });
      }
      
      // Обработчик кнопки "Добавить" для групп материалов
      const addMaterialGroupBtn = document.getElementById('add-material-group-btn');
      if (addMaterialGroupBtn) {
        addMaterialGroupBtn.addEventListener('click', function() {
          if (typeof window.openMaterialGroupEdit === 'function') window.openMaterialGroupEdit(0);
        });
      }
      const selectAllMaterialsGroupsCheckbox = document.getElementById('select-all-materials-groups');
      if (selectAllMaterialsGroupsCheckbox) {
        selectAllMaterialsGroupsCheckbox.addEventListener('change', function(e) {
          document.querySelectorAll('.material-group-checkbox').forEach(function(cb) { cb.checked = e.target.checked; });
        });
      }
      const materialsGroupsPerPageSelect = document.getElementById('materials-groups-per-page-select');
      if (materialsGroupsPerPageSelect) {
        materialsGroupsPerPageSelect.addEventListener('change', function(e) {
          const newPerPage = parseInt(e.target.value) || 20;
          if (window.materialsGroupsPagination) {
            window.materialsGroupsPagination.perPage = newPerPage;
            window.materialsGroupsPagination.currentPage = 1;
          }
          if (typeof window.loadMaterialsGroups === 'function') window.loadMaterialsGroups();
        });
      }
      
      // Обработчики кнопок сохранения для групп материалов
      const saveMaterialGroupBtn = document.getElementById('save-material-group-btn');
      if (saveMaterialGroupBtn) {
        saveMaterialGroupBtn.addEventListener('click', () => {
          if (typeof window.saveMaterialGroup === 'function') window.saveMaterialGroup(false);
        });
      }
      const saveAndExitMaterialGroupBtn = document.getElementById('save-and-exit-material-group-btn');
      if (saveAndExitMaterialGroupBtn) {
        saveAndExitMaterialGroupBtn.addEventListener('click', () => {
          if (typeof window.saveMaterialGroup === 'function') window.saveMaterialGroup(true);
        });
      }
      const cancelMaterialGroupBtn = document.getElementById('cancel-material-group-btn');
      if (cancelMaterialGroupBtn) {
        cancelMaterialGroupBtn.addEventListener('click', function(e) {
          e.preventDefault();
          window.location.hash = '#materials-groups';
        });
      }
      const materialsGroupsSearchForm = document.getElementById('materials-groups-search-form');
      if (materialsGroupsSearchForm) {
        materialsGroupsSearchForm.addEventListener('submit', function(e) {
          e.preventDefault();
          if (typeof doMaterialsGroupsSearch === 'function') doMaterialsGroupsSearch();
        });
      }
      
      // Обработчик кнопки "Добавить" для материалов (сверху)
      const addMaterialKeyBtn = document.getElementById('add-material-key-btn');
      if (addMaterialKeyBtn) {
        addMaterialKeyBtn.addEventListener('click', function() {
          if (typeof window.openMaterialKeyEdit === 'function') {
            window.openMaterialKeyEdit(0);
          } else {
            console.error('❌ Функция openMaterialKeyEdit не найдена');
            alert('Ошибка: функция открытия формы не найдена. Перезагрузите страницу.');
          }
        });
      }
      
      // Обработчик кнопки "Добавить" для материалов (снизу, как в референсе)
      const addMaterialKeyBottomBtn = document.getElementById('add-material-key-bottom-btn');
      if (addMaterialKeyBottomBtn) {
        addMaterialKeyBottomBtn.addEventListener('click', function() {
          if (typeof window.openMaterialKeyEdit === 'function') {
            window.openMaterialKeyEdit(0);
          } else {
            console.error('❌ Функция openMaterialKeyEdit не найдена');
            alert('Ошибка: функция открытия формы не найдена. Перезагрузите страницу.');
          }
        });
      }
      
      // Обработчики для наборов кромок (edges_keys)
      const addEdgeKeyBtn = document.getElementById('add-edge-key-btn');
      if (addEdgeKeyBtn) addEdgeKeyBtn.addEventListener('click', () => { if (window.openEdgeKeyEdit) window.openEdgeKeyEdit(0); });
      const addEdgeKeyBottomBtn = document.getElementById('add-edge-key-bottom-btn');
      if (addEdgeKeyBottomBtn) addEdgeKeyBottomBtn.addEventListener('click', () => { if (window.openEdgeKeyEdit) window.openEdgeKeyEdit(0); });
      const saveAndExitEdgeKeyBtn = document.getElementById('save-and-exit-edge-key-btn');
      if (saveAndExitEdgeKeyBtn) saveAndExitEdgeKeyBtn.addEventListener('click', () => saveEdgeKey(true));
      const cancelEdgeKeyBtn = document.getElementById('cancel-edge-key-btn');
      if (cancelEdgeKeyBtn) cancelEdgeKeyBtn.addEventListener('click', (e) => { e.preventDefault(); window.location.hash = '#edges-keys'; });
      const edgesKeysCategoriesBtn = document.getElementById('edges-keys-categories-btn');
      if (edgesKeysCategoriesBtn) edgesKeysCategoriesBtn.addEventListener('click', () => { window.location.hash = '#edges-categories'; });
      // Категории кромок: Добавить, Развернуть все, Свернуть все
      const edgesCatAddBtn = document.getElementById('edges-categories-add-btn');
      const edgesCatExpandBtn = document.getElementById('edges-categories-expand-all-btn');
      const edgesCatCollapseBtn = document.getElementById('edges-categories-collapse-all-btn');
      const edgesCatModal = document.getElementById('edges-category-add-modal');
      const edgesCatAddSubmit = document.getElementById('edges-category-add-submit');
      function fillEdgesCategoryParentSelect(exceptId) {
        const parentSelect = document.getElementById('edges-category-parent');
        if (!parentSelect) return;
        parentSelect.innerHTML = '<option value="0">Нет</option>';
        (edgesCategoriesData || []).forEach(c => {
          if (exceptId && (c.id === exceptId || String(c.id) === String(exceptId))) return;
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = (c.name || 'Без названия');
          parentSelect.appendChild(opt);
        });
      }
      function openEdgesCategoryModalForAdd(parentId) {
        document.getElementById('edges-category-edit-id').value = '0';
        const titleEl = document.querySelector('#edges-category-add-modal .modal-title');
        if (titleEl) titleEl.textContent = 'Добавить категорию';
        const submitBtn = document.getElementById('edges-category-add-submit');
        if (submitBtn) submitBtn.textContent = 'Добавить';
        fillEdgesCategoryParentSelect();
        document.getElementById('edges-category-name').value = '';
        document.getElementById('edges-category-description').value = '';
        const parentSelect = document.getElementById('edges-category-parent');
        if (parentSelect && parentId != null && parentId !== '') parentSelect.value = String(parentId);
        if (edgesCatModal) edgesCatModal.style.display = 'flex';
      }
      function openEdgesCategoryModalForEdit(catId) {
        const cat = (edgesCategoriesData || []).find(c => c.id === parseInt(catId) || String(c.id) === String(catId));
        if (!cat) return;
        document.getElementById('edges-category-edit-id').value = String(cat.id);
        const titleEl = document.querySelector('#edges-category-add-modal .modal-title');
        if (titleEl) titleEl.textContent = 'Редактировать категорию';
        const submitBtn = document.getElementById('edges-category-add-submit');
        if (submitBtn) submitBtn.textContent = 'Сохранить';
        fillEdgesCategoryParentSelect(cat.id);
        document.getElementById('edges-category-name').value = cat.name || '';
        document.getElementById('edges-category-parent').value = (cat.parent == null || cat.parent === '') ? '0' : String(cat.parent);
        document.getElementById('edges-category-description').value = cat.description || '';
        if (edgesCatModal) edgesCatModal.style.display = 'flex';
      }
      if (edgesCatAddBtn) edgesCatAddBtn.addEventListener('click', () => openEdgesCategoryModalForAdd(null));
      if (edgesCatExpandBtn) edgesCatExpandBtn.addEventListener('click', () => {
        edgesCategoriesExpanded = { '': true };
        (edgesCategoriesData || []).forEach(c => { edgesCategoriesExpanded[String(c.id)] = true; });
        renderEdgesCategoriesTree();
      });
      if (edgesCatCollapseBtn) edgesCatCollapseBtn.addEventListener('click', () => {
        edgesCategoriesExpanded = { '': true };
        renderEdgesCategoriesTree();
      });
      const edgesCatTreeEl = document.getElementById('edges-categories-tree');
      if (edgesCatTreeEl) {
        edgesCatTreeEl.addEventListener('click', function(e) {
          e.preventDefault();
          const expandEl = e.target.closest('.pp-tree-expand[data-cat-expand]');
          if (expandEl) {
            const key = expandEl.getAttribute('data-cat-expand');
            edgesCategoriesExpanded[key] = !edgesCategoriesExpanded[key];
            renderEdgesCategoriesTree();
            return;
          }
          const actionEl = e.target.closest('a[data-cat-action]');
          if (!actionEl) return;
          const action = actionEl.getAttribute('data-cat-action');
          const catId = actionEl.getAttribute('data-cat-id');
          const typeForApi = (window.location.hash || '').split('?')[1] ? new URLSearchParams((window.location.hash || '').split('?')[1]).get('type') || EDGES_CATEGORIES_TYPE : EDGES_CATEGORIES_TYPE;
          if (action === 'add') openEdgesCategoryModalForAdd(catId);
          if (action === 'edit') openEdgesCategoryModalForEdit(catId);
          if (action === 'visibility') {
            const cat = (edgesCategoriesData || []).find(c => String(c.id) === String(catId));
            if (!cat) return;
            const newActive = (cat.active === 1 || cat.active === true) ? 0 : 1;
            fetch('/api/catalog/category_edit/' + encodeURIComponent(typeForApi), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: parseInt(catId), active: newActive })
            }).then(r => r.json()).then(() => { loadEdgesCategories(); if (typeof toastr !== 'undefined') toastr.success(newActive ? 'Категория отображается' : 'Категория скрыта'); }).catch(() => {});
          }
          if (action === 'delete') {
            const cat = (edgesCategoriesData || []).find(c => String(c.id) === String(catId));
            if (!cat || !confirm('Удалить категорию «' + (cat.name || '') + '»?')) return;
            fetch('/api/catalog/category_delete/' + encodeURIComponent(typeForApi), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: parseInt(catId, 10) })
            }).then(function(r) {
              var ct = (r.headers.get('Content-Type') || '').toLowerCase();
              if (!ct.includes('application/json')) return r.text().then(function(text) { throw new Error('Сервер вернул не JSON. Проверьте, что запрос идёт на тот же порт (например localhost:8000).'); });
              return r.json();
            }).then(function(data) {
              if (data && data.error === 'has_children') {
                alert('У категории есть подкатегории (' + (data.count || 0) + '). Сначала удалите их или переместите.');
                return;
              }
              if (data && data.result === 'success') { loadEdgesCategories(); if (typeof toastr !== 'undefined') toastr.success('Категория удалена'); }
              else alert('Ошибка: ' + (data && data.error ? data.error : 'Неизвестная ошибка'));
            }).catch(function(err) { alert('Ошибка: ' + (err && err.message ? err.message : String(err))); });
          }
        });
      }
      if (edgesCatModal) {
        edgesCatModal.querySelectorAll('.close, [data-dismiss="modal"], .btn-white').forEach(btn => {
          btn.addEventListener('click', () => { edgesCatModal.style.display = 'none'; });
        });
      }
      if (edgesCatAddSubmit) edgesCatAddSubmit.addEventListener('click', async () => {
        const editId = (document.getElementById('edges-category-edit-id')?.value || '0').trim();
        const name = (document.getElementById('edges-category-name')?.value || '').trim();
        const parent = document.getElementById('edges-category-parent')?.value || '0';
        const description = (document.getElementById('edges-category-description')?.value || '').trim();
        if (!name) { alert('Введите название'); return; }
        const hash = (window.location.hash || '').split('?')[1] || '';
        const typeForApi = new URLSearchParams(hash).get('type') || EDGES_CATEGORIES_TYPE;
        const isEdit = editId && editId !== '0';
        try {
          if (isEdit) {
            const res = await fetch(`/api/catalog/category_edit/${encodeURIComponent(typeForApi)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: parseInt(editId), name, parent: parent === '0' ? null : parseInt(parent), description })
            });
            const data = await res.json();
            if (data.result === 'success') {
              if (edgesCatModal) edgesCatModal.style.display = 'none';
              loadEdgesCategories();
              if (typeof toastr !== 'undefined') toastr.success('Категория сохранена');
            } else { alert('Ошибка: ' + (data.error || JSON.stringify(data))); }
          } else {
            const res = await fetch(`/api/catalog/category_add/${encodeURIComponent(typeForApi)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, parent: parent === '0' ? null : parseInt(parent), description })
            });
            const data = await res.json();
            if (data === 'empty_name') { alert('Введите название'); return; }
            if (data.result === 'success') {
              if (edgesCatModal) edgesCatModal.style.display = 'none';
              loadEdgesCategories();
              if (typeof toastr !== 'undefined') toastr.success('Категория добавлена');
            } else { alert('Ошибка: ' + (data.error || JSON.stringify(data))); }
          }
        } catch (e) {
          console.error('❌ Ошибка сохранения категории:', e);
          alert('Ошибка: ' + e.message);
        }
      });
      const edgesKeysPerPageSelect = document.getElementById('edges-keys-per-page-select');
      if (edgesKeysPerPageSelect) edgesKeysPerPageSelect.addEventListener('change', () => { edgesKeysPagination.perPage = parseInt(edgesKeysPerPageSelect.value) || 20; loadEdgesKeys(); });

      // Обработчики для списка кромок в наборе (edges-items)
      const edgesItemsAddBtn = document.getElementById('edges-items-add-btn');
      if (edgesItemsAddBtn) edgesItemsAddBtn.addEventListener('click', () => { if (typeof window.openEdgeItemEdit === 'function') window.openEdgeItemEdit(0); });
      const edgesItemsCategoriesBtn = document.getElementById('edges-items-categories-btn');
      if (edgesItemsCategoriesBtn) edgesItemsCategoriesBtn.addEventListener('click', () => {
        const type = edgesItemsState.type || readEdgesItemsParamsFromHash().type;
        const name = edgesItemsState.name || readEdgesItemsParamsFromHash().name;
        window.location.hash = `#edges-categories?type=${encodeURIComponent(type || 'butts_keys')}&name=${encodeURIComponent(name || '')}`;
      });
      const edgesItemsImportDecors = document.getElementById('edges-items-import-from-decors-btn');
      if (edgesItemsImportDecors) edgesItemsImportDecors.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof window.openEdgesDecorsSelectModal === 'function') window.openEdgesDecorsSelectModal();
      });
      const edgesItemsParams = document.getElementById('edges-items-params-btn');
      if (edgesItemsParams) edgesItemsParams.addEventListener('click', (e) => { e.preventDefault(); (window.toastr ? window.toastr.info('Параметры — в разработке') : alert('Параметры — в разработке')); });
      const edgesItemsTableBody = document.getElementById('edges-items-table-body');
      if (edgesItemsTableBody) {
        edgesItemsTableBody.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-edge-action]');
          if (!btn) return;
          const action = btn.getAttribute('data-edge-action');
          const id = Number(btn.getAttribute('data-edge-id') || '0') || 0;
          const name = btn.getAttribute('data-edge-name') || '';
          if (action === 'edit') window.openEdgeItemEdit(id);
          if (action === 'copy') window.copyEdgeItem(id);
          if (action === 'delete') window.deleteEdgeItem(id, name);
        });
      }
      const edgesItemsPerPage = document.getElementById('edges-items-per-page');
      if (edgesItemsPerPage) edgesItemsPerPage.addEventListener('change', () => {
        edgesItemsState.perPage = parseInt(edgesItemsPerPage.value) || 20;
        edgesItemsState.currentPage = 1;
        renderEdgesItemsTable();
      });

      // Обработчики для модалки выбора декоров кромки (butt_butts), как в рефе
      const edgesDecorsSearchBtn = document.getElementById('edges-decors-search-btn');
      const edgesDecorsResetBtn = document.getElementById('edges-decors-reset-btn');
      const edgesDecorsSearchInput = document.getElementById('edges-decors-search-input');
      const edgesDecorsCategoryFilter = document.getElementById('edges-decors-category-filter');
      const edgesDecorsPerPage = document.getElementById('edges-decors-per-page');
      if (edgesDecorsSearchBtn) {
        edgesDecorsSearchBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (typeof renderEdgesDecorsTable === 'function') {
            edgesDecorsState.currentPage = 1;
            renderEdgesDecorsTable();
          }
        });
      }
      if (edgesDecorsResetBtn) {
        edgesDecorsResetBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (edgesDecorsSearchInput) edgesDecorsSearchInput.value = '';
          if (edgesDecorsCategoryFilter) edgesDecorsCategoryFilter.value = '';
          edgesDecorsState.currentPage = 1;
          if (typeof renderEdgesDecorsTable === 'function') renderEdgesDecorsTable();
        });
      }
      if (edgesDecorsSearchInput) {
        edgesDecorsSearchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            edgesDecorsState.currentPage = 1;
            if (typeof renderEdgesDecorsTable === 'function') renderEdgesDecorsTable();
          }
        });
      }
      if (edgesDecorsCategoryFilter) {
        edgesDecorsCategoryFilter.addEventListener('change', () => {
          edgesDecorsState.currentPage = 1;
          if (typeof renderEdgesDecorsTable === 'function') renderEdgesDecorsTable();
        });
      }
      if (edgesDecorsPerPage) {
        edgesDecorsPerPage.addEventListener('change', () => {
          const v = parseInt(edgesDecorsPerPage.value || '20', 10);
          edgesDecorsState.perPage = v || 20;
          edgesDecorsState.currentPage = 1;
          if (typeof renderEdgesDecorsTable === 'function') renderEdgesDecorsTable();
        });
      }
      const edgesItemsSelectAll = document.getElementById('edges-items-select-all');
      if (edgesItemsSelectAll) edgesItemsSelectAll.addEventListener('change', (e) => {
        document.querySelectorAll('.edges-item-checkbox').forEach(cb => { cb.checked = e.target.checked; });
      });
      const saveEdgeItemBtn = document.getElementById('save-edge-item-btn');
      if (saveEdgeItemBtn) saveEdgeItemBtn.addEventListener('click', () => saveEdgeItem(false));
      const saveAndExitEdgeItemBtn = document.getElementById('save-and-exit-edge-item-btn');
      if (saveAndExitEdgeItemBtn) saveAndExitEdgeItemBtn.addEventListener('click', () => saveEdgeItem(true));
      const cancelEdgeItemBtn = document.getElementById('cancel-edge-item-btn');
      if (cancelEdgeItemBtn) cancelEdgeItemBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const type = edgesItemsState.type || readEdgesItemsParamsFromHash().type;
        const name = edgesItemsState.name || readEdgesItemsParamsFromHash().name;
        window.location.hash = `#edges-items?type=${encodeURIComponent(type || '')}&name=${encodeURIComponent(name || '')}`;
        document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
        const page = document.getElementById('edges-items');
        if (page) page.classList.add('active');
        if (type) loadEdgesItems(type, name);
      });
      const edgeItemIconPlaceholder = document.getElementById('edge-item-icon-placeholder');
      const edgeItemIconPreview = document.getElementById('edge-item-icon-preview-wrapper');
      const edgeItemIconFile = document.getElementById('edge-item-icon-file');
      if (edgeItemIconPlaceholder) edgeItemIconPlaceholder.addEventListener('click', () => { if (edgeItemIconFile) edgeItemIconFile.click(); });
      if (edgeItemIconPreview) edgeItemIconPreview.querySelectorAll('.open_file').forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); if (edgeItemIconFile) edgeItemIconFile.click(); }));
      if (edgeItemIconFile) edgeItemIconFile.addEventListener('change', async () => {
        const file = edgeItemIconFile.files && edgeItemIconFile.files[0];
        if (!file) return;
        try {
          const fd = new FormData();
          fd.append('file', file);
          const resp = await fetch('/api/upload/material_icon', { method: 'POST', body: fd });
          if (!resp.ok) throw new Error('Ошибка загрузки');
          const data = await resp.json();
          const url = data.url || data.path || data.icon || '';
          if (url) {
            document.getElementById('edge-item-icon').value = url;
            const prev = document.getElementById('edge-item-icon-preview');
            const wrap = document.getElementById('edge-item-icon-preview-wrapper');
            const ph = document.getElementById('edge-item-icon-placeholder');
            if (prev) prev.src = url.startsWith('/') ? url : '/' + url;
            if (wrap) wrap.style.display = 'block';
            if (ph) ph.style.display = 'none';
          }
        } catch (e) { console.error('Ошибка загрузки иконки:', e); alert('Ошибка загрузки: ' + e.message); }
        edgeItemIconFile.value = '';
      });
      const edgeItemColorPicker = document.getElementById('edge-item-color-picker');
      const edgeItemColorText = document.getElementById('edge-item-color');
      if (edgeItemColorPicker && edgeItemColorText) {
        edgeItemColorPicker.addEventListener('input', () => { edgeItemColorText.value = edgeItemColorPicker.value; });
        edgeItemColorText.addEventListener('input', () => {
          const v = (edgeItemColorText.value || '').trim();
          if (/^#([0-9A-Fa-f]{6})$/.test(v)) edgeItemColorPicker.value = v;
        });
      }
      
      // Обработчик чекбокса "Выбрать все" для материалов
      const selectAllMaterialsKeysCheckbox = document.getElementById('select-all-materials-keys');
      if (selectAllMaterialsKeysCheckbox) {
        selectAllMaterialsKeysCheckbox.addEventListener('change', function(e) {
          const checkboxes = document.querySelectorAll('.material-key-checkbox');
          checkboxes.forEach(checkbox => {
            checkbox.checked = e.target.checked;
          });
        });
      }

      // ============================
      // Загрузка иконки и карты нормалей для фасада
      // ============================
      const facadeIconPlaceholder = document.getElementById('facade-item-icon-placeholder');
      const facadeIconPreviewWrapper = document.getElementById('facade-item-icon-preview-wrapper');
      if (facadeIconPlaceholder) {
        const openIconManager = () => {
          window.openFileManager({
            initialPath: 'decor', // папка по умолчанию, можно поменять
            allowedExt: ['.png', '.jpg', '.jpeg', '.webp'],
            onSelect: ({ url }) => {
              const hidden = document.getElementById('facade-item-icon');
              const prev = document.getElementById('facade-item-icon-preview');
              const wrap = document.getElementById('facade-item-icon-preview-wrapper');
              const ph = document.getElementById('facade-item-icon-placeholder');
              if (hidden) hidden.value = url;
              if (prev) prev.src = url;
              if (wrap) wrap.style.display = 'block';
              if (ph) ph.style.display = 'none';
            },
          });
        };
        facadeIconPlaceholder.addEventListener('click', openIconManager);
        if (facadeIconPreviewWrapper) {
          facadeIconPreviewWrapper.querySelectorAll('.open_file').forEach((btn) => {
            btn.addEventListener('click', (e) => {
              e.preventDefault();
              openIconManager();
            });
          });
        }
      }

      const facadeNormalPlaceholder = document.getElementById('facade-item-normal-placeholder');
      const facadeNormalPreviewWrapper = document.getElementById('facade-item-normal-preview-wrapper');
      if (facadeNormalPlaceholder) {
        const openNormalManager = () => {
          window.openFileManager({
            initialPath: 'decor',
            allowedExt: ['.png', '.jpg', '.jpeg', '.webp'],
            onSelect: ({ url }) => {
              const hidden = document.getElementById('facade-item-normal-map');
              const prev = document.getElementById('facade-item-normal-preview');
              const wrap = document.getElementById('facade-item-normal-preview-wrapper');
              const ph = document.getElementById('facade-item-normal-placeholder');
              if (hidden) hidden.value = url;
              if (prev) prev.src = url;
              if (wrap) wrap.style.display = 'block';
              if (ph) ph.style.display = 'none';
            },
          });
        };
        facadeNormalPlaceholder.addEventListener('click', openNormalManager);
        if (facadeNormalPreviewWrapper) {
          facadeNormalPreviewWrapper.querySelectorAll('.open_file').forEach((btn) => {
            btn.addEventListener('click', (e) => {
              e.preventDefault();
              openNormalManager();
            });
          });
        }
      }
      
      // Обработчик изменения количества на странице для материалов
      const materialsKeysPerPageSelect = document.getElementById('materials-keys-per-page-select');
      if (materialsKeysPerPageSelect) {
        materialsKeysPerPageSelect.addEventListener('change', function(e) {
          const newPerPage = parseInt(e.target.value) || 20;
          materialsKeysPagination.perPage = newPerPage;
          materialsKeysPagination.currentPage = 1;
          renderMaterialsKeysTable();
        });
      }
      
      // Обработчики кнопок сохранения материала
      const saveMaterialKeyBtn = document.getElementById('save-material-key-btn');
      if (saveMaterialKeyBtn) {
        saveMaterialKeyBtn.addEventListener('click', () => {
          if (typeof window.saveMaterialKey === 'function') {
            window.saveMaterialKey();
          } else {
            console.error('❌ Функция saveMaterialKey не найдена');
            alert('Ошибка: функция сохранения не найдена. Перезагрузите страницу.');
          }
        });
      }
      
      const saveAndExitMaterialKeyBtn = document.getElementById('save-and-exit-material-key-btn');
      if (saveAndExitMaterialKeyBtn) {
        saveAndExitMaterialKeyBtn.addEventListener('click', async () => {
          if (typeof window.saveMaterialKey === 'function') {
            await window.saveMaterialKey();
            window.location.hash = '#materials-keys';
          } else {
            console.error('❌ Функция saveMaterialKey не найдена');
            alert('Ошибка: функция сохранения не найдена. Перезагрузите страницу.');
          }
        });
      }
      
      // Обработчик кнопки "Отмена" для материала
      const cancelMaterialKeyBtn = document.getElementById('cancel-material-key-btn');
      if (cancelMaterialKeyBtn) {
        cancelMaterialKeyBtn.addEventListener('click', function(e) {
          e.preventDefault();
          window.location.hash = '#materials-keys';
        });
      }

      // ============================
      // materials-items (ЛДСП/ХДФ/...)
      // ============================
      const materialsItemsAddBtn = document.getElementById('materials-items-add-btn');
      if (materialsItemsAddBtn) {
        materialsItemsAddBtn.addEventListener('click', () => {
          if (typeof window.openMaterialItemEdit === 'function') window.openMaterialItemEdit(0);
        });
      }

      const materialsItemsPerPage = document.getElementById('materials-items-per-page');
      if (materialsItemsPerPage) {
        materialsItemsPerPage.addEventListener('change', (e) => {
          materialsItemsState.perPage = parseInt(e.target.value || '20', 10) || 20;
          materialsItemsState.currentPage = 1;
          renderMaterialsItemsTable();
        });
      }

      const materialsItemsCat = document.getElementById('materials-items-category-filter');
      if (materialsItemsCat) {
        materialsItemsCat.addEventListener('change', () => {
          materialsItemsState.currentPage = 1;
          renderMaterialsItemsTable();
        });
      }

      const materialsItemsSelectAll = document.getElementById('materials-items-select-all');
      if (materialsItemsSelectAll) {
        materialsItemsSelectAll.addEventListener('change', (e) => {
          document.querySelectorAll('.materials-item-checkbox').forEach((cb) => { cb.checked = e.target.checked; });
        });
      }

      const materialsItemsSearchInput = document.getElementById('materials-items-search-input');
      if (materialsItemsSearchInput) {
        let t = null;
        materialsItemsSearchInput.addEventListener('input', () => {
          clearTimeout(t);
          t = setTimeout(() => {
            materialsItemsState.currentPage = 1;
            renderMaterialsItemsTable();
          }, 150);
        });
      }

      const miImport = document.getElementById('materials-items-import-from-decors-btn');
      miImport && miImport.addEventListener('click', (e) => { e.preventDefault(); (window.toastr ? window.toastr.info('Импорт из декоров — в разработке') : alert('Импорт из декоров — в разработке')); });
      const miCats = document.getElementById('materials-items-categories-btn');
      if (miCats) {
        miCats.addEventListener('click', (e) => {
          e.preventDefault();
          try {
            // Определяем текущий тип материала (ldsp, hdf и т.п.) и его человеко-понятное имя
            const typeFromState = materialsItemsState.type || readMaterialsItemsParamsFromHash().type || '';
            if (!typeFromState) {
              (window.toastr ? window.toastr.warning('Сначала выберите тип материала в меню слева') : alert('Сначала выберите тип материала в меню слева'));
              return;
            }
            const typeName = getMaterialNameFromMenu(typeFromState) || typeFromState;
            // Используем общую страницу дерева категорий (edges-categories), как для фасадов и 3D-моделей
            const hash = `#edges-categories?type=${encodeURIComponent(typeFromState)}&name=${encodeURIComponent(typeName)}`;
            window.location.hash = hash;
          } catch (err) {
            console.error('❌ Ошибка при переходе к категориям материалов:', err);
            (window.toastr ? window.toastr.error('Не удалось открыть категории материалов') : alert('Не удалось открыть категории материалов'));
          }
        });
      }
      const miParams = document.getElementById('materials-items-params-btn');
      miParams && miParams.addEventListener('click', (e) => { e.preventDefault(); (window.toastr ? window.toastr.info('Параметры — в разработке') : alert('Параметры — в разработке')); });

      // ============================
      // models3d-materials (Материалы 3D моделей)
      // Примечание: обработчики событий вынесены в admin-models3d-materials.js
      // ============================

      // material-item-edit
      const saveMaterialItemBtn = document.getElementById('save-material-item-btn');
      saveMaterialItemBtn && saveMaterialItemBtn.addEventListener('click', () => window.saveMaterialItem(false));
      const saveExitMaterialItemBtn = document.getElementById('save-and-exit-material-item-btn');
      saveExitMaterialItemBtn && saveExitMaterialItemBtn.addEventListener('click', () => window.saveMaterialItem(true));

      // Загрузка иконки материала (как в рефе) + обновление большого превью справа
      const iconInput = document.getElementById('material-item-icon');
      const iconFileInput = document.getElementById('material-item-icon-file');
      const iconPlaceholder = document.getElementById('material-item-icon-placeholder');
      const iconPreview = document.getElementById('material-item-icon-preview');
      const iconPreviewWrapper = document.getElementById('material-item-icon-preview-wrapper');
      const materialPreview = document.getElementById('material-preview');

      const applyIconUrl = (url) => {
        if (!iconInput || !iconPreview || !iconPreviewWrapper || !iconPlaceholder || !materialPreview) return;

        if (!url) {
          iconInput.value = '';
          iconPreview.src = '';
          iconPreviewWrapper.style.display = 'none';
          iconPlaceholder.style.display = 'flex';
          // Сбрасываем превью материала (белый прямоугольник внутри)
          const innerDiv = materialPreview.querySelector('div');
          if (innerDiv) {
            innerDiv.style.backgroundImage = '';
            innerDiv.innerHTML = '3D-превью материала (в разработке)';
          }
          return;
        }

        iconInput.value = url;
        iconPreview.src = url;
        iconPreviewWrapper.style.display = 'block';
        iconPlaceholder.style.display = 'none';

        // Отображаем иконку в правом превью (в белом прямоугольнике внутри, как в рефе)
        const innerDiv = materialPreview.querySelector('div');
        if (innerDiv) {
          innerDiv.style.backgroundImage = `url('${url}')`;
          innerDiv.style.backgroundSize = 'cover';
          innerDiv.style.backgroundPosition = 'center';
          innerDiv.innerHTML = ''; // Убираем текст, показываем только изображение
        }
      };

      if (iconInput && iconPreview && iconPreviewWrapper && iconPlaceholder) {
        const currentUrl = (iconInput.value || '').toString().trim();
        if (currentUrl) applyIconUrl(currentUrl);
      }

      const triggerFileDialog = () => {
        if (iconFileInput) iconFileInput.click();
      };

      if (iconPlaceholder) {
        iconPlaceholder.addEventListener('click', (e) => {
          e.preventDefault();
          triggerFileDialog();
        });
      }
      if (iconPreviewWrapper) {
        iconPreviewWrapper.querySelectorAll('.open_file').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            triggerFileDialog();
          });
        });
      }

      if (iconFileInput) {
        iconFileInput.addEventListener('change', async () => {
          const file = iconFileInput.files && iconFileInput.files[0];
          if (!file) return;
          try {
            const fd = new FormData();
            fd.append('file', file);
            const resp = await fetch('/api/upload/material_icon', {
              method: 'POST',
              body: fd
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            if (!data || !data.url) throw new Error('Нет url в ответе');
            applyIconUrl(data.url);
            if (window.toastr) window.toastr.success('Иконка загружена');
          } catch (err) {
            console.error('❌ Ошибка загрузки иконки материала:', err);
            alert('Ошибка загрузки иконки');
          } finally {
            iconFileInput.value = '';
          }
        });
      }

      // ============================
      // Загрузка текстуры материала
      // ============================
      const textureFileInput = document.getElementById('material-texture-file');
      const textureUploadBtn = document.getElementById('material-texture-upload-btn');
      const textureUploadIcon = document.getElementById('material-texture-upload-icon');
      const texturePreview = document.getElementById('material-texture-preview');
      const textureUrlInput = document.getElementById('material-texture-url');

      if (textureUploadBtn && textureFileInput && texturePreview && textureUrlInput) {
        // Клик по кнопке
        textureUploadBtn.addEventListener('click', (e) => {
          e.preventDefault();
          textureFileInput.click();
        });
        // Клик по иконке папки
        if (textureUploadIcon) {
          textureUploadIcon.addEventListener('click', (e) => {
            e.preventDefault();
            textureFileInput.click();
          });
        }

        textureFileInput.addEventListener('change', async () => {
          const file = textureFileInput.files && textureFileInput.files[0];
          if (!file) return;
          try {
            const fd = new FormData();
            fd.append('file', file);
            const resp = await fetch('/api/upload/material_icon', {
              method: 'POST',
              body: fd
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            if (!data || !data.url) throw new Error('Нет url в ответе');
            textureUrlInput.value = data.url;
            texturePreview.innerHTML = `<img src="${data.url}" style="width:100%; height:100%; object-fit:cover;"><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="material-texture-upload-icon"></i>`;
            // Переподключаем обработчик клика на иконку после обновления HTML
            setTimeout(() => {
              const newIcon = document.getElementById('material-texture-upload-icon');
              if (newIcon && textureFileInput) {
                newIcon.addEventListener('click', (e) => {
                  e.preventDefault();
                  textureFileInput.click();
                });
              }
            }, 50);
            if (window.toastr) window.toastr.success('Текстура загружена');
          } catch (err) {
            console.error('❌ Ошибка загрузки текстуры материала:', err);
            alert('Ошибка загрузки текстуры');
          } finally {
            textureFileInput.value = '';
          }
        });
      }

      // ============================
      // Загрузка карты нормалей
      // ============================
      const normalMapFileInput = document.getElementById('material-normal-map-file');
      const normalMapUploadBtn = document.getElementById('material-normal-map-upload-btn');
      const normalMapUploadIcon = document.getElementById('material-normal-map-upload-icon');
      const normalMapPreview = document.getElementById('material-normal-map-preview');
      const normalMapUrlInput = document.getElementById('material-normal-map-url');

      if (normalMapUploadBtn && normalMapFileInput && normalMapPreview && normalMapUrlInput) {
        // Клик по кнопке
        normalMapUploadBtn.addEventListener('click', (e) => {
          e.preventDefault();
          normalMapFileInput.click();
        });
        // Клик по иконке папки
        if (normalMapUploadIcon) {
          normalMapUploadIcon.addEventListener('click', (e) => {
            e.preventDefault();
            normalMapFileInput.click();
          });
        }

        normalMapFileInput.addEventListener('change', async () => {
          const file = normalMapFileInput.files && normalMapFileInput.files[0];
          if (!file) return;
          try {
            const fd = new FormData();
            fd.append('file', file);
            const resp = await fetch('/api/upload/material_icon', {
              method: 'POST',
              body: fd
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            if (!data || !data.url) throw new Error('Нет url в ответе');
            normalMapUrlInput.value = data.url;
            normalMapPreview.innerHTML = `<img src="${data.url}" style="width:100%; height:100%; object-fit:cover;"><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="material-normal-map-upload-icon"></i>`;
            // Переподключаем обработчик клика на иконку после обновления HTML
            const newIcon = document.getElementById('material-normal-map-upload-icon');
            if (newIcon) {
              newIcon.addEventListener('click', (e) => {
                e.preventDefault();
                normalMapFileInput.click();
              });
            }
            if (window.toastr) window.toastr.success('Карта нормалей загружена');
          } catch (err) {
            console.error('❌ Ошибка загрузки карты нормалей:', err);
            alert('Ошибка загрузки карты нормалей');
          } finally {
            normalMapFileInput.value = '';
          }
        });
      }

      // ============================
      // Загрузка карты шероховатости
      // ============================
      const roughnessMapFileInput = document.getElementById('material-roughness-map-file');
      const roughnessMapUploadBtn = document.getElementById('material-roughness-map-upload-btn');
      const roughnessMapUploadIcon = document.getElementById('material-roughness-map-upload-icon');
      const roughnessMapPreview = document.getElementById('material-roughness-map-preview');
      const roughnessMapUrlInput = document.getElementById('material-roughness-map-url');

      if (roughnessMapUploadBtn && roughnessMapFileInput && roughnessMapPreview && roughnessMapUrlInput) {
        // Клик по кнопке
        roughnessMapUploadBtn.addEventListener('click', (e) => {
          e.preventDefault();
          roughnessMapFileInput.click();
        });
        // Клик по иконке папки
        if (roughnessMapUploadIcon) {
          roughnessMapUploadIcon.addEventListener('click', (e) => {
            e.preventDefault();
            roughnessMapFileInput.click();
          });
        }

        roughnessMapFileInput.addEventListener('change', async () => {
          const file = roughnessMapFileInput.files && roughnessMapFileInput.files[0];
          if (!file) return;
          try {
            const fd = new FormData();
            fd.append('file', file);
            const resp = await fetch('/api/upload/material_icon', {
              method: 'POST',
              body: fd
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            if (!data || !data.url) throw new Error('Нет url в ответе');
            roughnessMapUrlInput.value = data.url;
            roughnessMapPreview.innerHTML = `<img src="${data.url}" style="width:100%; height:100%; object-fit:cover;"><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="material-roughness-map-upload-icon"></i>`;
            // Переподключаем обработчик клика на иконку после обновления HTML
            const newIcon = document.getElementById('material-roughness-map-upload-icon');
            if (newIcon) {
              newIcon.addEventListener('click', (e) => {
                e.preventDefault();
                roughnessMapFileInput.click();
              });
            }
            if (window.toastr) window.toastr.success('Карта шероховатости загружена');
          } catch (err) {
            console.error('❌ Ошибка загрузки карты шероховатости:', err);
            alert('Ошибка загрузки карты шероховатости');
          } finally {
            roughnessMapFileInput.value = '';
          }
        });
      }

      // ============================
      // Прозрачность: показать/скрыть блок
      // ============================
      const transparentCheckbox = document.getElementById('material-transparent');
      const transparencyBlock = document.getElementById('material-transparency-block');
      if (transparentCheckbox && transparencyBlock) {
        transparentCheckbox.addEventListener('change', () => {
          transparencyBlock.style.display = transparentCheckbox.checked ? 'flex' : 'none';
        });
      }

      // ============================
      // Табы material-item-edit (Основные / Параметры отображения / Параметры)
      // ============================
      const materialTabLinks = document.querySelectorAll('#material-item-edit .nav-tabs .nav-link');
      const materialTabPanes = document.querySelectorAll('#material-item-edit .tab-pane');
      if (materialTabLinks.length && materialTabPanes.length) {
        // Изначально скрываем неактивные вкладки
        materialTabPanes.forEach(pane => {
          if (pane.classList.contains('active')) {
            pane.style.display = 'block';
          } else {
            pane.style.display = 'none';
          }
        });

        materialTabLinks.forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSelector = link.getAttribute('href') || '';
            const targetId = targetSelector.replace('#', '');

            // Переключаем активную вкладку
            materialTabLinks.forEach(l => {
              l.classList.remove('active');
              const li = l.closest('.nav-item');
              if (li) li.classList.remove('active');
            });
            const li = link.closest('.nav-item');
            if (li) li.classList.add('active');
            link.classList.add('active');

            // Показываем только нужную панель
            materialTabPanes.forEach(pane => {
              if (pane.id === targetId) {
                pane.style.display = 'block';
              } else {
                pane.style.display = 'none';
              }
            });
          });
        });
      }

      // Табы edge-item-edit (Основные / Параметры отображения / Параметры)
      const edgeTabLinks = document.querySelectorAll('#edge-item-edit .nav-tabs .nav-link');
      const edgeTabPanes = document.querySelectorAll('#edge-item-edit .tab-pane');
      if (edgeTabLinks.length && edgeTabPanes.length) {
        edgeTabPanes.forEach(pane => {
          if (pane.classList.contains('active')) pane.style.display = 'block';
          else pane.style.display = 'none';
        });
        edgeTabLinks.forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = (link.getAttribute('href') || '').replace('#', '');
            edgeTabLinks.forEach(l => { l.classList.remove('active'); const li = l.closest('.nav-item'); if (li) li.classList.remove('active'); });
            const li = link.closest('.nav-item');
            if (li) li.classList.add('active');
            link.classList.add('active');
            edgeTabPanes.forEach(pane => { pane.style.display = pane.id === targetId ? 'block' : 'none'; });
          });
        });
      }

      // ============================
      // Загрузка текстуры кромки
      // ============================
      const edgeTextureFileInput = document.getElementById('edge-texture-file');
      const edgeTextureUploadBtn = document.getElementById('edge-texture-upload-btn');
      const edgeTextureUploadIcon = document.getElementById('edge-texture-upload-icon');
      const edgeTexturePreview = document.getElementById('edge-texture-preview');
      const edgeTextureUrlInput = document.getElementById('edge-texture-url');

      if (edgeTextureUploadBtn && edgeTextureFileInput && edgeTexturePreview && edgeTextureUrlInput) {
        edgeTextureUploadBtn.addEventListener('click', (e) => {
          e.preventDefault();
          edgeTextureFileInput.click();
        });
        if (edgeTextureUploadIcon) {
          edgeTextureUploadIcon.addEventListener('click', (e) => {
            e.preventDefault();
            edgeTextureFileInput.click();
          });
        }
        edgeTextureFileInput.addEventListener('change', async () => {
          const file = edgeTextureFileInput.files && edgeTextureFileInput.files[0];
          if (!file) return;
          try {
            const fd = new FormData();
            fd.append('file', file);
            const resp = await fetch('/api/upload/material_icon', { method: 'POST', body: fd });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            if (!data || !data.url) throw new Error('Нет url в ответе');
            edgeTextureUrlInput.value = data.url;
            edgeTexturePreview.innerHTML = `<img src="${data.url}" style="width:100%; height:100%; object-fit:cover;"><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="edge-texture-upload-icon"></i>`;
            setTimeout(() => {
              const newIcon = document.getElementById('edge-texture-upload-icon');
              if (newIcon && edgeTextureFileInput) {
                newIcon.addEventListener('click', (e) => { e.preventDefault(); edgeTextureFileInput.click(); });
              }
            }, 50);
            if (window.toastr) window.toastr.success('Текстура загружена');
          } catch (err) {
            console.error('❌ Ошибка загрузки текстуры кромки:', err);
            alert('Ошибка загрузки текстуры');
          } finally {
            edgeTextureFileInput.value = '';
          }
        });
      }

      // ============================
      // Загрузка карты нормалей кромки
      // ============================
      const edgeNormalMapFileInput = document.getElementById('edge-normal-map-file');
      const edgeNormalMapUploadBtn = document.getElementById('edge-normal-map-upload-btn');
      const edgeNormalMapUploadIcon = document.getElementById('edge-normal-map-upload-icon');
      const edgeNormalMapPreview = document.getElementById('edge-normal-map-preview');
      const edgeNormalMapUrlInput = document.getElementById('edge-normal-map-url');

      if (edgeNormalMapUploadBtn && edgeNormalMapFileInput && edgeNormalMapPreview && edgeNormalMapUrlInput) {
        edgeNormalMapUploadBtn.addEventListener('click', (e) => {
          e.preventDefault();
          edgeNormalMapFileInput.click();
        });
        if (edgeNormalMapUploadIcon) {
          edgeNormalMapUploadIcon.addEventListener('click', (e) => {
            e.preventDefault();
            edgeNormalMapFileInput.click();
          });
        }
        edgeNormalMapFileInput.addEventListener('change', async () => {
          const file = edgeNormalMapFileInput.files && edgeNormalMapFileInput.files[0];
          if (!file) return;
          try {
            const fd = new FormData();
            fd.append('file', file);
            const resp = await fetch('/api/upload/material_icon', { method: 'POST', body: fd });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            if (!data || !data.url) throw new Error('Нет url в ответе');
            edgeNormalMapUrlInput.value = data.url;
            edgeNormalMapPreview.innerHTML = `<img src="${data.url}" style="width:100%; height:100%; object-fit:cover;"><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="edge-normal-map-upload-icon"></i>`;
            const newIcon = document.getElementById('edge-normal-map-upload-icon');
            if (newIcon) {
              newIcon.addEventListener('click', (e) => { e.preventDefault(); edgeNormalMapFileInput.click(); });
            }
            if (window.toastr) window.toastr.success('Карта нормалей загружена');
          } catch (err) {
            console.error('❌ Ошибка загрузки карты нормалей кромки:', err);
            alert('Ошибка загрузки карты нормалей');
          } finally {
            edgeNormalMapFileInput.value = '';
          }
        });
      }

      // ============================
      // Загрузка карты шероховатости кромки
      // ============================
      const edgeRoughnessMapFileInput = document.getElementById('edge-roughness-map-file');
      const edgeRoughnessMapUploadBtn = document.getElementById('edge-roughness-map-upload-btn');
      const edgeRoughnessMapUploadIcon = document.getElementById('edge-roughness-map-upload-icon');
      const edgeRoughnessMapPreview = document.getElementById('edge-roughness-map-preview');
      const edgeRoughnessMapUrlInput = document.getElementById('edge-roughness-map-url');

      if (edgeRoughnessMapUploadBtn && edgeRoughnessMapFileInput && edgeRoughnessMapPreview && edgeRoughnessMapUrlInput) {
        edgeRoughnessMapUploadBtn.addEventListener('click', (e) => {
          e.preventDefault();
          edgeRoughnessMapFileInput.click();
        });
        if (edgeRoughnessMapUploadIcon) {
          edgeRoughnessMapUploadIcon.addEventListener('click', (e) => {
            e.preventDefault();
            edgeRoughnessMapFileInput.click();
          });
        }
        edgeRoughnessMapFileInput.addEventListener('change', async () => {
          const file = edgeRoughnessMapFileInput.files && edgeRoughnessMapFileInput.files[0];
          if (!file) return;
          try {
            const fd = new FormData();
            fd.append('file', file);
            const resp = await fetch('/api/upload/material_icon', { method: 'POST', body: fd });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            if (!data || !data.url) throw new Error('Нет url в ответе');
            edgeRoughnessMapUrlInput.value = data.url;
            edgeRoughnessMapPreview.innerHTML = `<img src="${data.url}" style="width:100%; height:100%; object-fit:cover;"><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="edge-roughness-map-upload-icon"></i>`;
            const newIcon = document.getElementById('edge-roughness-map-upload-icon');
            if (newIcon) {
              newIcon.addEventListener('click', (e) => { e.preventDefault(); edgeRoughnessMapFileInput.click(); });
            }
            if (window.toastr) window.toastr.success('Карта шероховатости загружена');
          } catch (err) {
            console.error('❌ Ошибка загрузки карты шероховатости кромки:', err);
            alert('Ошибка загрузки карты шероховатости');
          } finally {
            edgeRoughnessMapFileInput.value = '';
          }
        });
      }

      // ============================
      // Прозрачность кромки: показать/скрыть блок
      // ============================
      const edgeTransparentCheckbox = document.getElementById('edge-transparent');
      const edgeTransparencyBlock = document.getElementById('edge-transparency-block');
      if (edgeTransparentCheckbox && edgeTransparencyBlock) {
        edgeTransparentCheckbox.addEventListener('change', () => {
          edgeTransparencyBlock.style.display = edgeTransparentCheckbox.checked ? 'flex' : 'none';
        });
      }

      // ============================
      // Vue-приложение для формы группы материалов (v-select, treeselect по референсу)
      // ============================
      window.initMaterialGroupVue = function() {
        const container = document.getElementById('material-group-edit-vue-app');
        if (!container || window.materialGroupVueApp) return;
        if (typeof Vue === 'undefined' || typeof VueTreeselect === 'undefined') return;
        if (typeof VueSelect === 'undefined' && typeof window.VueSelect === 'undefined') return;
        const VueSelectComp = (typeof VueSelect !== 'undefined' ? VueSelect : window.VueSelect).default || (typeof VueSelect !== 'undefined' ? VueSelect : window.VueSelect);
        Vue.component('v-select', VueSelectComp);
        Vue.component('treeselect', VueTreeselect.default || VueTreeselect);
        window.materialGroupVueApp = new Vue({
          el: '#material-group-edit-vue-app',
          data: {
            form: {
              name: '',
              key: '',
              order: 0,
              showInMenu: 1,
              availableMaterials: [],
              defaultMaterial: null,
              moduleGroups: []
            },
            materialsOptions: [],
            moduleGroupsOptions: []
          },
          methods: {
            normModuleGroup: function(node) {
              return { id: node.id || node.key || '', label: (node.label || node.name || node.key || node.id || '').toString() };
            }
          }
        });
      };

      // ============================
      // Табы material-group-edit (Основные параметры)
      // ============================
      const materialGroupTabLinks = document.querySelectorAll('#material-group-edit .nav-tabs .nav-link');
      const materialGroupTabPanes = document.querySelectorAll('#material-group-edit .tab-pane');
      if (materialGroupTabLinks.length && materialGroupTabPanes.length) {
        materialGroupTabLinks.forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSelector = link.getAttribute('href') || '';
            const targetId = targetSelector.replace('#', '');
            materialGroupTabLinks.forEach(l => {
              l.classList.remove('active');
              const li = l.closest('.nav-item');
              if (li) li.classList.remove('active');
            });
            const li = link.closest('.nav-item');
            if (li) li.classList.add('active');
            link.classList.add('active');
            materialGroupTabPanes.forEach(pane => {
              pane.style.display = pane.id === targetId ? 'block' : 'none';
            });
          });
        });
      }

      // Показ формы добавления материала из списка (кнопки в таблице)
      document.querySelectorAll('#materials-items-table-body').forEach((tbody) => {
        tbody.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-mi-action]');
          if (!btn) return;
          const action = btn.getAttribute('data-mi-action');
          const id = Number(btn.getAttribute('data-mi-id') || '0') || 0;
          const name = btn.getAttribute('data-mi-name') || '';
          if (action === 'edit') window.openMaterialItemEdit(id);
          if (action === 'copy') window.copyMaterialItem(id);
          if (action === 'delete') window.deleteMaterialItem(id, name);
        });
      });
      
      // Обработчик кнопки "Добавить" для элементов каталога (Кухни, Двери и т.д.)
      const addCatalogItemBtn = document.getElementById('add-catalog-item-btn');
      if (addCatalogItemBtn) {
        addCatalogItemBtn.addEventListener('click', function() {
          // Извлекаем тип каталога из текущего URL (из hash параметров)
          const hash = window.location.hash;
          const urlParams = new URLSearchParams(hash.split('?')[1] || '');
          const catalogType = urlParams.get('type');
          const catalogName = document.getElementById('catalog-items-subtitle')?.textContent || 'Элемент';
          
          if (catalogType) {
            openCatalogItemEdit(0, catalogType, catalogName);
          } else {
            alert('Тип каталога не определен. Откройте список элементов каталога через меню.');
          }
        });
      }
      
      
      // Открытие страницы редактирования элемента каталога (глобальная функция)
      window.openCatalogItemEdit = function openCatalogItemEdit(itemId = 0, catalogType = '', catalogName = 'Элемент') {
        // Скрываем все страницы
        document.querySelectorAll('.admin-page').forEach(page => {
          page.classList.remove('active');
        });
        
        // Показываем страницу редактирования
        const editPage = document.getElementById('catalog-item-edit');
        if (editPage) {
          editPage.classList.add('active');
          
          // Устанавливаем значения в скрытые поля
          document.getElementById('controller_name').value = catalogType;
          document.getElementById('item_id').value = itemId;
          document.getElementById('form_submit_url').value = itemId > 0 
            ? `/api/catalog/item_edit/${catalogType}/${itemId}`
            : `/api/catalog/item_add/${catalogType}/`;
          document.getElementById('form_success_url').value = `#catalog-items?type=${catalogType}`;
          
          // Обновляем заголовок
          const titleElement = document.getElementById('catalog-item-edit-title');
          if (titleElement) {
            titleElement.textContent = itemId > 0 ? `Редактировать ${catalogName}` : `Добавить ${catalogName}`;
          }
          
          // Обновляем URL
          window.history.pushState({ page: 'catalog-item-edit', type: catalogType, id: itemId }, '', `#catalog-item-edit?type=${catalogType}&id=${itemId}`);
          
          // Инициализируем Vue.js приложение для этой страницы (если еще не инициализировано)
          if (!window.catalogItemVueApp) {
            initCatalogItemVue(catalogType, catalogName);
          if (itemId > 0) {
              loadCatalogItemData(itemId, catalogType);
            }
          } else {
            // Обновляем данные Vue приложения
            window.catalogItemVueApp.catalogType = catalogType;
            window.catalogItemVueApp.catalogName = catalogName;
            if (itemId > 0) {
              // Редактирование существующего элемента
              loadCatalogItemData(itemId, catalogType);
            } else {
              // Создание нового элемента
              // Базовый шаблон (по умолчанию — модуль каталога)
              window.catalogItemVueApp.item = {
                name: '',
                category: '',
                show_in_spec: '1',
                include_nested: '1',
                show_in_constructor: '1',
                order: 0,
                icon: '',
                module_group: 'bottom',
                drag_type: 'top',
                stick_type: 'common',
                is_fill: '0',
                width: 300,
                height: 400,
                depth: 200
              };
              // Для фасадов не запускаем конструктор и не сбрасываем JSON,
              // оставляем только форму заполнения (как в референсе "Добавить фрезеровку").
              if (catalogType !== 'facades') {
                window.__CLD_IS_NEW_MODULE = true;
                // Инициализируем НОВЫЙ конструктор через обёртку __cldInitConstructorTab
                if (typeof window.__cldInitConstructorTab === 'function') window.__cldInitConstructorTab();
                if (typeof window.loadConstructorTreeFromJSON === 'function') window.loadConstructorTreeFromJSON(null);
                try { localStorage.removeItem('cld:json_tab:draft'); } catch(e){}
                var __jt = document.getElementById('catalog-item-json-textarea'); if (__jt) __jt.value = '';
                window.__CLD_JSON_TAB_INITIALIZED = false;
              }
            }
            // Загружаем список категорий для выпадающего списка «Категория» (как в референсе)
            if (window.catalogItemVueApp && typeof window.catalogItemVueApp.loadCategories === 'function') {
              window.catalogItemVueApp.loadCategories();
            }
          }
          
          // ДЕБАГ: Проверяем структуру колонок
          setTimeout(function() {
            const row = document.querySelector('#catalog-item-edit .wrapper-content > .row');
            const cols = row ? row.querySelectorAll('.col-lg-6') : [];
            cols.forEach((col, idx) => {
              const styles = window.getComputedStyle(col);
            });
          }, 50);
          
          // Раньше здесь автоматически монтировалось 3D-превью (ensureClodisPreviewMounted).
          // По запросу отключили автозапуск превью, чтобы не тянуть лишние ресурсы и убрать
          // побочные ошибки от движка превью. При необходимости его можно вызвать вручную из консоли:
          //   window.ensureClodisPreviewMounted && window.ensureClodisPreviewMounted();
        } else {
          console.error('❌ Страница редактирования элемента каталога не найдена');
        }
      }
      
      // Инициализация Vue.js приложения для страницы редактирования элемента каталога
      function initCatalogItemVue(catalogType, catalogName) {
        const subForm = document.getElementById('catalog-item-edit-sub-form');
        if (!subForm || window.catalogItemVueApp) return;
        
        // Регистрируем Vue Treeselect компонент
        Vue.component('treeselect', VueTreeselect.default || VueTreeselect);
        
        window.catalogItemVueApp = new Vue({
          el: '#catalog-item-edit-sub-form',
          data: {
            catalogType: catalogType,
            catalogName: catalogName,
            item: {
              name: '',
              category: '',
              show_in_spec: '1',
              include_nested: '1',
              show_in_constructor: '1',
              order: 0,
              icon: '',
              module_group: 'bottom',
              drag_type: 'top',
              stick_type: 'common',
              is_fill: '0',
              no_intersections: '0',
              catalog_type: '',
              width: 300,
              height: 400,
              depth: 200
            },
            categories: [], // Данные для Vue Treeselect
            categoriesReady: false,
            categorySelectOptions: [] // Плоский список для select «Категория» с путём (как в референсе: Родитель / Дочерняя)
          },
          methods: {
            // Загрузка категорий и заполнение выпадающего списка во вкладке «Основные» (как в референсе)
            loadCategories: async function() {
              try {
                const controllerName = document.getElementById('controller_name')?.value || this.catalogType;
                if (!controllerName) {
                  this.categories = [];
                  this.categorySelectOptions = [];
                  this.categoriesReady = true;
                  return;
                }
                const response = await fetch(`/api/catalog/categories_get/${controllerName}`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const categoriesData = await response.json();
                if (Array.isArray(categoriesData)) {
                  this.categories = this.buildCategoryTree(categoriesData);
                  this.categorySelectOptions = this.buildCategorySelectOptions(categoriesData);
                } else {
                  this.categories = categoriesData;
                  this.categorySelectOptions = [];
                }
                this.categoriesReady = true;
              } catch (error) {
                console.error('❌ Ошибка загрузки категорий:', error);
                this.categories = [];
                this.categorySelectOptions = [];
                this.categoriesReady = true;
              }
            },
            // Плоский список для select с путём «Родитель / Дочерняя» (как pp_category в референсе)
            buildCategorySelectOptions: function(categories) {
              if (!Array.isArray(categories) || categories.length === 0) return [];
              const map = {};
              categories.forEach(cat => {
                map[cat.id || cat.category_id] = { id: cat.id || cat.category_id, name: cat.name || cat.label || 'Без названия', parent: cat.parent !== undefined && cat.parent !== null ? cat.parent : cat.parent_id };
              });
              function path(id) {
                const c = map[id];
                if (!c) return [];
                if (!c.parent || !map[c.parent]) return [c.name];
                return path(c.parent).concat([c.name]);
              }
              return categories.map(cat => ({ id: cat.id || cat.category_id, path: path(cat.id || cat.category_id).join(' / ') }));
            },
            // Построение дерева категорий из плоского массива
            buildCategoryTree: function(categories) {
              if (!Array.isArray(categories) || categories.length === 0) {
                return [];
              }
              
              // Создаем карту категорий по ID
              const categoryMap = {};
              const rootCategories = [];
              
              categories.forEach(cat => {
                const category = {
                  id: cat.id || cat.category_id,
                  label: cat.name || cat.label || cat.title || 'Без названия',
                  children: []
                };
                categoryMap[category.id] = category;
              });
              
              // Строим дерево: поддерживаем и parent, и parent_id (референс — parent)
              categories.forEach(cat => {
                const category = categoryMap[cat.id || cat.category_id];
                const parentId = cat.parent !== undefined && cat.parent !== null ? cat.parent : cat.parent_id;
                if (parentId && categoryMap[parentId]) {
                  categoryMap[parentId].children.push(category);
                } else {
                  rootCategories.push(category);
                }
              });
              
              return rootCategories;
            },
            // Открытие модального окна выбора иконки
            openIconModal: function() {
              const iconModal = document.querySelector('#catalog-item-edit .image_filemanager');
              if (iconModal) {
                $(iconModal).modal('show');
              }
            },
            // Сохранение элемента
            saveItem: async function(saveAndExit = false) {
              try {
                const formData = new FormData();
                const itemId = document.getElementById('item_id').value;
                const controllerName = document.getElementById('controller_name').value;
                
                // Подготавливаем данные для отправки
                const dataToSave = {
                  name: this.item.name,
                  category: this.item.category,
                  show_in_spec: this.item.show_in_spec,
                  include_nested: this.item.include_nested,
                  show_in_constructor: this.item.show_in_constructor,
                  order: this.item.order,
                  icon: this.item.icon,
                  module_group: this.item.module_group,
                  drag_type: this.item.drag_type,
                  stick_type: this.item.stick_type,
                  is_fill: this.item.is_fill,
                  no_intersections: this.item.no_intersections,
                  catalog_type: this.item.catalog_type,
                  width: this.item.width,
                  height: this.item.height,
                  depth: this.item.depth
                };
                
                // Собираем структуру конструктора в JSON
                if (typeof window.getConstructorTreeJSON === 'function') {
                  const constructorTree = window.getConstructorTreeJSON();
                  if (constructorTree) {
                    dataToSave.constructor_structure = constructorTree;
                  }
                }
                
                formData.append('data', JSON.stringify(dataToSave));
                
                const url = itemId === '0' 
                  ? `/api/catalog/item_add/${controllerName}/`
                  : `/api/catalog/item_edit/${controllerName}/${itemId}`;
                
                const response = await fetch(url, {
                  method: 'POST',
                  body: formData
                });
                
                if (!response.ok) {
                  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const result = await response.json();
                if (saveAndExit) {
                  const successUrl = document.getElementById('form_success_url').value;
                  window.location.hash = successUrl;
                }
              } catch (error) {
                console.error('❌ Ошибка сохранения элемента:', error);
                alert('Ошибка сохранения: ' + error.message);
              }
            }
          },
          mounted: function() {
            const self = this;
            
            // Инициализация вкладок
            initCatalogItemTabs();
            
            // Инициализация функций для вкладки "Размеры"
            initDimensionsTab();
            
            // ⚠️ ВАЖНО: "Конструктор" инициализируем ТОЛЬКО при выборе вкладки (через initCatalogItemTabs),
            // чтобы не вешать страницу при открытии формы с 10 вкладками.
            
            // Загрузка категорий
            this.loadCategories();
            
            // Обработчик клика на иконку для открытия модального окна
            // ВРЕМЕННО ОТКЛЮЧЕНО: модальное окно требует полного file browser функционала
            // const iconPlaceholder = document.querySelector('#catalog-item-edit .pp_img_placeholder, #catalog-item-edit .open_file');
            // if (iconPlaceholder) {
            //   iconPlaceholder.addEventListener('click', function() {
            //     self.openIconModal();
            //   });
            // }
            
            // Обработчики кнопок сохранения
            const saveBtn = document.getElementById('save-catalog-item-btn');
            const saveAndExitBtn = document.getElementById('save-and-exit-catalog-item-btn');
            const cancelBtn = document.getElementById('cancel-catalog-item-btn');
            
            if (saveBtn) {
              saveBtn.addEventListener('click', function() {
                self.saveItem(false);
              });
            }
            
            if (saveAndExitBtn) {
              saveAndExitBtn.addEventListener('click', function() {
                self.saveItem(true);
              });
            }
            
            if (cancelBtn) {
              cancelBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const successUrl = document.getElementById('form_success_url').value;
                window.location.hash = successUrl;
              });
            }

            // «Выгрузить настройки в конструктор»: записать текущий элемент в localStorage (каталог по item.catalog_type)
            const exportBtn = document.getElementById('admin-top-export-settings');
            if (exportBtn && !exportBtn.dataset.exportBound) {
              exportBtn.dataset.exportBound = '1';
              exportBtn.addEventListener('click', function() {
                const app = window.catalogItemVueApp;
                if (!app || !app.item) {
                  alert('Откройте элемент каталога (Кухни → редактировать элемент) для выгрузки в конструктор.');
                  return;
                }
                const item = app.item;
                const catalogType = (item.catalog_type || '').trim() || (document.getElementById('controller_name') && document.getElementById('controller_name').value) || '';
                if (!catalogType) {
                  alert('Выберите «Тип каталога» во вкладке Основные (например Кухни), чтобы модуль отображался в нужном каталоге в конструкторе комнаты.');
                  return;
                }
                const tree = typeof window.getConstructorTreeJSON === 'function' ? window.getConstructorTreeJSON() : null;
                const clodisJSON = (tree && tree.template && Array.isArray(tree.template.structure)) ? tree.template.structure : ((tree && tree.spec && tree.spec.template && Array.isArray(tree.spec.template.tree)) ? tree.spec.template.tree : []);
                const clodisVariables = (tree && tree.variables && tree.variables.main && typeof tree.variables.main === 'object')
                  ? tree.variables.main
                  : {};
                const payload = {
                  id: (document.getElementById('item_id') && document.getElementById('item_id').value) || '',
                  name: item.name || '',
                  icon: item.icon || '',
                  clodisJSON: clodisJSON,
                  clodisVariables: clodisVariables,
                  show_in_constructor: item.show_in_constructor,
                  showInRoom: item.show_in_constructor === '1' || item.show_in_constructor === true,
                  catalog_type: item.catalog_type || catalogType,
                  module_group: item.module_group || 'bottom',
                  drag_type: item.drag_type || 'top',
                  stick_type: item.stick_type || 'common',
                  category: item.category,
                  width: item.width,
                  height: item.height,
                  depth: item.depth
                };
                const key = 'catalog_' + String(catalogType).replace(/^catalog_/, '');
                let list = [];
                try {
                  const raw = localStorage.getItem(key);
                  if (raw) list = JSON.parse(raw);
                } catch (e) {}
                const id = payload.id || payload.name;
                const idx = list.findIndex(function(x) { return (x.id && String(x.id) === String(id)) || (x.name === payload.name); });
                if (idx >= 0) list[idx] = payload; else list.push(payload);
                localStorage.setItem(key, JSON.stringify(list));
                // Категории конструктор читает из localStorage (catalogCategories_<type>). Подгружаем с сервера.
                fetch('/api/catalog/categories_get/' + encodeURIComponent(catalogType) + '?t=' + Date.now(), { cache: 'no-cache' })
                  .then(function(r) { return r.ok ? r.json() : []; })
                  .then(function(cats) {
                    var arr = Array.isArray(cats) ? cats : [];
                    try { localStorage.setItem('catalogCategories_' + catalogType, JSON.stringify(arr)); } catch (e) {}
                  })
                  .catch(function() {});
                if (window.toastr) window.toastr.success('Настройки выгружены в конструктор (каталог «' + catalogType + '»). Откройте конструктор комнаты.');
                else alert('Настройки выгружены в конструктор. Откройте конструктор комнаты.');
              });
            }
          }
        });
      }
      
      // Инициализация функционала вкладки "Размеры"
      function initDimensionsTab() {
        // ===== Размерные лимиты (из активного шаблона) =====
        // Clean-room аналог референса sizes_limit: min/max width/height/depth.
        window.__cldGetActiveSizesLimit = window.__cldGetActiveSizesLimit || function() {
          const root = document.getElementById('constructor-root-module');
          const st = root?.nodeData;
          const templates = Array.isArray(st?.templates) ? st.templates : [];
          const selectedId = st?.selectedTemplateId || templates?.[0]?.id || null;
          const tpl = templates.find(t => String(t?.id) === String(selectedId)) || templates?.[0] || null;
          const min = (tpl?.min && typeof tpl.min === 'object') ? tpl.min : { w: 0, h: 0, d: 0 };
          const max = (tpl?.max && typeof tpl.max === 'object') ? tpl.max : { w: 0, h: 0, d: 0 };
          return {
            min_width: Number(min.w) || 0,
            min_height: Number(min.h) || 0,
            min_depth: Number(min.d) || 0,
            max_width: Number(max.w) || 0,
            max_height: Number(max.h) || 0,
            max_depth: Number(max.d) || 0,
          };
        };
        window.__cldClampSizeValue = window.__cldClampSizeValue || function(val, min, max) {
          let n = Number(val);
          if (!Number.isFinite(n)) n = 0;
          const mn = Number(min) || 0;
          const mx = Number(max) || 0;
          if (mn > 0 && n < mn) n = mn;
          if (mx > 0 && n > mx) n = mx;
          return n;
        };
        window.__cldClampMainSizeInputs = window.__cldClampMainSizeInputs || function() {
          const lim = window.__cldGetActiveSizesLimit?.() || {};
          const wIn = document.getElementById('catalog-item-edit-width');
          const hIn = document.getElementById('catalog-item-edit-height');
          const dIn = document.getElementById('catalog-item-edit-depth');
          if (wIn) wIn.value = String(window.__cldClampSizeValue(wIn.value, lim.min_width, lim.max_width) || 0);
          if (hIn) hIn.value = String(window.__cldClampSizeValue(hIn.value, lim.min_height, lim.max_height) || 0);
          if (dIn) dIn.value = String(window.__cldClampSizeValue(dIn.value, lim.min_depth, lim.max_depth) || 0);
        };
        window.__cldFilterVariantsByLimits = window.__cldFilterVariantsByLimits || function() {
          const lim = window.__cldGetActiveSizesLimit?.() || {};
          const within = (v) => {
            const w = Number(v?.width);
            const h = Number(v?.height);
            const d = Number(v?.depth);
            if (!Number.isFinite(w) || !Number.isFinite(h) || !Number.isFinite(d)) return false;
            if (lim.min_width > 0 && w < lim.min_width) return false;
            if (lim.max_width > 0 && w > lim.max_width) return false;
            if (lim.min_height > 0 && h < lim.min_height) return false;
            if (lim.max_height > 0 && h > lim.max_height) return false;
            if (lim.min_depth > 0 && d < lim.min_depth) return false;
            if (lim.max_depth > 0 && d > lim.max_depth) return false;
            return true;
          };
          const before = Array.isArray(window.catalogItemSizeVariants) ? window.catalogItemSizeVariants.length : 0;
          window.catalogItemSizeVariants = (window.catalogItemSizeVariants || []).filter(within);
          const after = window.catalogItemSizeVariants.length;
          return { before, after, removed: before - after, limits: lim };
        };

        // Массив вариантов размеров
        window.catalogItemSizeVariants = window.catalogItemSizeVariants || [];
        
        // Применяем лимиты (как в референсе: отбрасываем неподходящие варианты)
        try { window.__cldClampMainSizeInputs && window.__cldClampMainSizeInputs(); } catch {}
        try { window.__cldFilterVariantsByLimits && window.__cldFilterVariantsByLimits(); } catch {}

        // Функция обновления select размера по умолчанию
        function updateDefaultSizeSelect() {
          const defaultSizeSelect = document.getElementById('catalog-item-edit-default-size');
          if (!defaultSizeSelect) return;
          
          const currentValue = defaultSizeSelect.value;
          defaultSizeSelect.innerHTML = '<option value="0x0x0">0x0x0</option>';
          
          // Добавляем варианты размеров в select
          (window.catalogItemSizeVariants || []).forEach((v, i) => {
            const sizeStr = `${v.width}x${v.height}x${v.depth}`;
            const option = document.createElement('option');
            option.value = sizeStr;
            option.textContent = `${v.name || 'Вариант ' + (i + 1)} (${sizeStr})`;
            defaultSizeSelect.appendChild(option);
          });
          
          // Восстанавливаем выбранное значение
          if (currentValue && Array.from(defaultSizeSelect.options).some(opt => opt.value === currentValue)) {
            defaultSizeSelect.value = currentValue;
          }
        }
        
        // Функция рендеринга списка вариантов
        function renderSizeVariants() {
          const variantsList = document.getElementById('catalog-item-edit-variants-list');
          if (!variantsList) return;

          // каждый раз перед рендером гарантируем соответствие лимитам
          try { window.__cldFilterVariantsByLimits && window.__cldFilterVariantsByLimits(); } catch {}
          
          if (!window.catalogItemSizeVariants || window.catalogItemSizeVariants.length === 0) {
            variantsList.innerHTML = '<div style="padding:12px; text-align:center; color:#999; font-size:12px;">Вариантов размеров пока нет</div>';
            updateDefaultSizeSelect();
            return;
          }
          
          variantsList.innerHTML = window.catalogItemSizeVariants.map((v, i) => `
            <div style="padding:10px; border:1px solid #e5e7eb; border-radius:6px; margin-bottom:8px; background:#f9fafb;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="font-weight:600; font-size:13px; margin-bottom:4px;">${v.name || 'Без названия'}</div>
                  <div style="font-size:12px; color:#666;">
                    Артикул: ${v.article || '-'} | Цена: ${v.price} ₽ | Размеры: ${v.width}×${v.height}×${v.depth} мм
                  </div>
                </div>
                <button type="button" class="btn btn-sm btn-outline btn-danger" data-variant-index="${i}" style="padding:4px 8px; font-size:11px;">🗑 Удалить</button>
              </div>
            </div>
          `).join('');
          
          // Обработчики удаления
          variantsList.querySelectorAll('button[data-variant-index]').forEach(btn => {
            btn.addEventListener('click', function() {
              const index = parseInt(this.getAttribute('data-variant-index') || '0');
              window.catalogItemSizeVariants.splice(index, 1);
              renderSizeVariants();
            });
          });
          
          updateDefaultSizeSelect();
        }
        
        // Функция настройки кнопок для полей размеров
        function setupVariantSizeButtons(inputId, prefix) {
          const input = document.getElementById(inputId);
          if (!input) return;
          
          // Кнопка "× 2"
          const multiplyBtn = document.querySelector(`.${prefix}-btn-multiply`);
          if (multiplyBtn) {
            multiplyBtn.addEventListener('click', function(e) {
              e.preventDefault();
              const currentValue = parseFloat(input.value) || 0;
              input.value = String(currentValue * 2);
            });
          }
          
          // Кнопка "÷ 2"
          const divideBtn = document.querySelector(`.${prefix}-btn-divide`);
          if (divideBtn) {
            divideBtn.addEventListener('click', function(e) {
              e.preventDefault();
              const currentValue = parseFloat(input.value) || 0;
              input.value = String(currentValue / 2);
            });
          }
          
          // Кнопка "+{a}" - заглушка
          const addVarBtn = document.querySelector(`.${prefix}-btn-add-var`);
          if (addVarBtn) {
            addVarBtn.addEventListener('click', function(e) {
              e.preventDefault();
              console.log(`ℹ️ [${prefix}] Кнопка "Добавить переменную" - будет реализована позже`);
            });
          }
          
          // Кнопка "{aa}" - переключение режима
          const modeBtn = document.querySelector(`.${prefix}-btn-mode`);
          if (modeBtn) {
            let isPrettyMode = modeBtn.getAttribute('data-mode') === 'pretty';
            modeBtn.addEventListener('click', function(e) {
              e.preventDefault();
              isPrettyMode = !isPrettyMode;
              this.textContent = isPrettyMode ? '{aa}' : 'a:a';
              this.setAttribute('data-mode', isPrettyMode ? 'pretty' : 'real');
            });
          }
        }
        
        // Инициализация кнопок для полей размеров
        setupVariantSizeButtons('catalog-item-edit-variant-width', 'variant-width');
        setupVariantSizeButtons('catalog-item-edit-variant-height', 'variant-height');
        setupVariantSizeButtons('catalog-item-edit-variant-depth', 'variant-depth');
        
        // Обработчик кнопки "Добавить" вариант
        const variantAddBtn = document.getElementById('catalog-item-edit-variant-add');
        if (variantAddBtn) {
          variantAddBtn.addEventListener('click', function() {
            const variantNameInput = document.getElementById('catalog-item-edit-variant-name');
            const variantArticleInput = document.getElementById('catalog-item-edit-variant-article');
            const variantPriceInput = document.getElementById('catalog-item-edit-variant-price');
            const variantWidthInput = document.getElementById('catalog-item-edit-variant-width');
            const variantHeightInput = document.getElementById('catalog-item-edit-variant-height');
            const variantDepthInput = document.getElementById('catalog-item-edit-variant-depth');
            
            if (!variantNameInput || !variantArticleInput || !variantPriceInput || !variantWidthInput || !variantHeightInput || !variantDepthInput) {
              console.error('❌ Поля варианта не найдены');
              return;
            }
            
            const name = variantNameInput.value.trim();
            const article = variantArticleInput.value.trim();
            const price = parseFloat(variantPriceInput.value) || 0;
            const width = parseFloat(variantWidthInput.value) || 0;
            const height = parseFloat(variantHeightInput.value) || 0;
            const depth = parseFloat(variantDepthInput.value) || 0;
            
            if (!name) {
              alert('Введите название варианта');
              return;
            }
            
            if (!window.catalogItemSizeVariants) {
              window.catalogItemSizeVariants = [];
            }

            // лимиты из активного шаблона (как в референсе)
            const lim = window.__cldGetActiveSizesLimit?.() || {};
            const bad =
              (lim.min_width > 0 && width < lim.min_width) || (lim.max_width > 0 && width > lim.max_width) ||
              (lim.min_height > 0 && height < lim.min_height) || (lim.max_height > 0 && height > lim.max_height) ||
              (lim.min_depth > 0 && depth < lim.min_depth) || (lim.max_depth > 0 && depth > lim.max_depth);
            if (bad) {
              alert(`Размер варианта выходит за ограничения активного шаблона.\n\n` +
                `Ограничения (0 = без лимита):\n` +
                `Ширина: ${lim.min_width} … ${lim.max_width}\n` +
                `Высота: ${lim.min_height} … ${lim.max_height}\n` +
                `Глубина: ${lim.min_depth} … ${lim.max_depth}`);
              return;
            }
            
            window.catalogItemSizeVariants.push({ name, article, price, width, height, depth });
            renderSizeVariants();
            
            // Очищаем поля
            variantNameInput.value = '';
            variantArticleInput.value = '';
            variantPriceInput.value = '0';
            variantWidthInput.value = '0';
            variantHeightInput.value = '0';
            variantDepthInput.value = '0';
          });
        }
        
        // Инициализация списка вариантов
        renderSizeVariants();
        
        // Обработчик кнопки "Добавить" в секции "Комплектующие"
        const accessoriesAddBtn = document.getElementById('catalog-item-edit-accessories-add');
        if (accessoriesAddBtn) {
          accessoriesAddBtn.addEventListener('click', function() {
            // TODO: Открыть модальное окно для выбора комплектующих (как в референсе - #acc_modal)
            alert('Функционал "Добавить комплектующие" будет реализован позже');
          });
        }
        
        // Обработчик кнопки "Добавить" в секции "Кнопки действий"
        const dimensionsAddBtn = document.getElementById('catalog-item-edit-dimensions-add');
        if (dimensionsAddBtn) {
          dimensionsAddBtn.addEventListener('click', function() {
            // TODO: Функционал добавления (пока неясно что именно добавлять)
            alert('Функционал кнопки "Добавить" будет реализован позже');
          });
        }
        
        // Обработчик кнопки "Проверить артикулы"
        const checkArticlesBtn = document.getElementById('catalog-item-edit-check-articles');
        if (checkArticlesBtn) {
          checkArticlesBtn.addEventListener('click', function() {
            if (!window.catalogItemSizeVariants || window.catalogItemSizeVariants.length === 0) {
              alert('Нет вариантов размеров для проверки артикулов');
              return;
            }
            
            // Проверяем дубликаты артикулов
            const articles = window.catalogItemSizeVariants
              .map(v => v.article)
              .filter(article => article && article.trim() !== '');
            
            const duplicates = articles.filter((article, index) => articles.indexOf(article) !== index);
            
            if (duplicates.length > 0) {
              const uniqueDuplicates = [...new Set(duplicates)];
              alert(`⚠️ Найдены дубликаты артикулов:\n${uniqueDuplicates.join(', ')}`);
            } else {
              alert(`✅ Проверка завершена. Найдено ${articles.length} уникальных артикулов. Дубликатов не обнаружено.`);
            }
          });
        }
      }
      
      // Инициализация вкладок страницы редактирования элемента каталога
      function initCatalogItemTabs() {
        const tabButtons = document.querySelectorAll('#catalog-item-edit .tab_menu_h li');
        const tabContents = document.querySelectorAll('#catalog-item-edit .tab-content');

        const controllerInput = document.getElementById('controller_name');
        const controllerName = (controllerInput && controllerInput.value) || '';
        const isFacades = controllerName === 'facades';

        // Для фасадов ведём себя как в рефе "Добавить фрезеровку":
        // скрываем все конструкторские вкладки, оставляя только форму параметров.
        if (isFacades) {
          tabButtons.forEach(btn => {
            const tab = btn.getAttribute('data-tab');
            if (tab === 'constructor' || tab === 'variables' || tab === 'templates' ||
                tab === 'json' || tab === 'events' || tab === 'params') {
              btn.style.display = 'none';
            }
          });
          tabContents.forEach(content => {
            const id = content.id || '';
            if (id === 'tab-content-constructor' ||
                id === 'tab-content-variables' ||
                id === 'tab-content-templates' ||
                id === 'tab-content-json' ||
                id === 'tab-content-events' ||
                id === 'tab-content-params') {
              content.style.display = 'none';
            }
          });
        }
        
        tabButtons.forEach(button => {
          button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Убираем active со всех вкладок
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => {
              content.classList.remove('active');
              content.style.display = 'none';
            });
            
            // Добавляем active текущей вкладке
            this.classList.add('active');
            const targetContent = document.getElementById(`tab-content-${tabName}`);
            if (targetContent) {
              targetContent.classList.add('active');
              // Для вкладки "Конструктор" используем flex, для остальных - block
              targetContent.style.display = (tabName === 'constructor' && !isFacades) ? 'flex' : 'block';
              
              // Инициализируем функционал вкладки "Размеры" при открытии
              if (tabName === 'dimensions') {
                setTimeout(() => initDimensionsTab(), 100);
              }
              
              // Инициализируем функционал вкладки "Конструктор" при открытии
              if (tabName === 'constructor' && !isFacades) {
                setTimeout(() => {
                  try {
                    initConstructorTab();
                  } catch (err) {
                    window.__CLD_CONSTRUCTOR_INITIALIZED = false;
                    console.error('[CLD][init] Ошибка в initConstructorTab:', err);
                  }
                }, 100);
              }

              // JSON: чистый textarea-редактор (без jsoneditor/CDN)
              if (tabName === 'json') {
                setTimeout(() => { if (typeof window.initJsonTab === 'function') window.initJsonTab(); }, 0);
              }

              // Переменные: редактор переменных модуля (clean-room)
              if (tabName === 'variables') {
                setTimeout(() => initVariablesTab(), 0);
              }

              // Шаблоны: список/выбор/синхронизация с конструктором (clean-room)
              if (tabName === 'templates') {
                setTimeout(() => initTemplatesTab(), 0);
              }

              // Материалы: группы/толщины/материалы (clean-room)
              if (tabName === 'materials') {
                setTimeout(() => initMaterialsTab(), 0);
              }

              // Комплектующие: библиотека комплектующих (clean-room)
              if (tabName === 'accessories') {
                setTimeout(() => initAccessoriesTab(), 0);
              }

              // События: управление событиями узлов конструктора (clean-room)
              if (tabName === 'events') {
                setTimeout(() => initEventsTab(), 0);
              }

              // Параметры: управление параметрами узлов конструктора (clean-room)
              if (tabName === 'params') {
                setTimeout(() => initParamsTab(), 0);
              }
            }
          });
        });
        
        // Референс: проверяем если вкладка "Конструктор" уже активна при загрузке
        const constructorTab = document.querySelector('[data-tab="constructor"]');
        const constructorContent = document.getElementById('tab-content-constructor');
        if (constructorTab && constructorTab.classList.contains('active') && constructorContent && constructorContent.classList.contains('active')) {
          setTimeout(() => initConstructorTab(), 100);
        }
      }

      // ===== Вкладка "Переменные" (clean-room) =====
      // Хранение:
      // - UI: root.nodeData.variables.groups[] (группы + enabled + vars[])
      // - Экспорт/движок: constructor_structure.variables.main (flat object key->number, только enabled=true)
      // Синхронизация: в iframe как ctx.vars через cld:setVars (см. __ppSyncPreviewToIframe)
      // ===== Вкладка "Шаблоны" (clean-room) =====
      // UI как в референсе: форма шаблона (название/артикул + min/max размеров + комплектующие + "Редактировать шаблон" + "Добавить").
      function initTemplatesTab() {
        if (window.__CLD_TEMPLATES_TAB_INITIALIZED) {
          try { window.__CLD_TEMPLATES_RENDER && window.__CLD_TEMPLATES_RENDER(); } catch {}
          return;
        }
        window.__CLD_TEMPLATES_TAB_INITIALIZED = true;

        const host = document.getElementById('cld-templates-container');
        const btnAddBottom = document.getElementById('cld-templates-add-bottom');
        const activeSelect = document.getElementById('catalog-item-edit-active-template');
        if (!host || !btnAddBottom) return;

        const esc = (s) => String(s ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');

        const getRoot = () => document.getElementById('constructor-root-module');
        const snapshotFromConstructor = () => {
          if (typeof window.getConstructorTreeJSON !== 'function') return {};
          try { return JSON.parse(JSON.stringify(window.getConstructorTreeJSON() || {})); } catch { return {}; }
        };

        const ensureState = () => {
          const root = getRoot();
          if (!root) return null;
          root.nodeData = root.nodeData || { name: '(модуль без названия)' };
          root.nodeData.templates = Array.isArray(root.nodeData.templates) ? root.nodeData.templates : [];
          if (!root.nodeData.selectedTemplateId) root.nodeData.selectedTemplateId = null;

          if (!root.nodeData.templates.length) {
            const tpl = {
              id: 'tpl_' + Math.random().toString(36).slice(2),
              name: '',
              article: '',
              min: { w: 0, h: 0, d: 0 },
              max: { w: 0, h: 0, d: 0 },
              accessories: [],
              constructor_structure: snapshotFromConstructor(),
            };
            root.nodeData.templates.push(tpl);
            root.nodeData.selectedTemplateId = tpl.id;
          }
          if (!root.nodeData.selectedTemplateId) root.nodeData.selectedTemplateId = root.nodeData.templates[0]?.id || null;
          return root.nodeData;
        };

        const setSelected = (id) => {
          const st = ensureState();
          if (!st) return;
          st.selectedTemplateId = id;
        };

        const getSelectedId = () => {
          const st = ensureState();
          return st?.selectedTemplateId || st?.templates?.[0]?.id || null;
        };

        const syncActiveSelect = () => {
          if (!activeSelect) return;
          const st = ensureState();
          if (!st) return;
          const tpls = st.templates || [];
          const cur = getSelectedId();
          const prev = String(activeSelect.value || '');
          activeSelect.innerHTML = '';
          const optAuto = document.createElement('option');
          optAuto.value = 'auto';
          optAuto.textContent = 'Авто';
          activeSelect.appendChild(optAuto);
          for (const t of tpls) {
            const opt = document.createElement('option');
            opt.value = String(t.id);
            opt.textContent = String(t.name || 'Шаблон');
            activeSelect.appendChild(opt);
          }
          activeSelect.value = (cur && tpls.some(t => String(t.id) === String(cur))) ? String(cur) : 'auto';
          if (prev && prev !== 'auto' && tpls.some(t => String(t.id) === prev)) activeSelect.value = prev;
        };

        const loadTemplateIntoConstructor = (tplId) => {
          const st = ensureState();
          if (!st) return;
          const t = (st.templates || []).find(x => String(x.id) === String(tplId));
          if (!t) return;
          if (typeof window.loadConstructorTreeFromJSON === 'function') {
            window.loadConstructorTreeFromJSON(t.constructor_structure || {});
          }
          if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
        };

        const render = () => {
          const st = ensureState();
          if (!st) return;
          const tpls = st.templates || [];
          const selectedId = getSelectedId();

          host.innerHTML = tpls.map((t) => {
            const sel = String(t.id) === String(selectedId);
            const min = t.min || {};
            const max = t.max || {};
            return `
              <div data-tpl-id="${esc(t.id)}" style="border:1px solid #e5e7eb; border-radius:6px; padding:16px; background:#fff; margin-bottom:16px; ${sel ? 'box-shadow: 0 0 0 2px rgba(0,123,255,0.25);' : ''}">
                <div class="row" style="margin-bottom:12px;">
                  <div class="col-sm-6">
                    <label style="font-weight:600; font-size:13px;">Название</label>
                    <input type="text" class="form-control cld-tpl-name" value="${esc(t.name || '')}">
                  </div>
                  <div class="col-sm-6">
                    <label style="font-weight:600; font-size:13px;">Артикул</label>
                    <input type="text" class="form-control cld-tpl-article" value="${esc(t.article || '')}">
                  </div>
                </div>

                <div class="row" style="margin-bottom:12px;">
                  <div class="col-sm-6">
                    <div class="row" style="margin-bottom:8px;">
                      <div class="col-sm-6" style="padding-right:8px;">
                        <label style="font-size:13px;">Минимальная ширина</label>
                      </div>
                      <div class="col-sm-6" style="padding-left:8px;">
                        <input type="number" class="form-control cld-tpl-min-w" value="${esc(min.w ?? 0)}">
                      </div>
                    </div>
                    <div class="row" style="margin-bottom:8px;">
                      <div class="col-sm-6" style="padding-right:8px;">
                        <label style="font-size:13px;">Минимальная высота</label>
                      </div>
                      <div class="col-sm-6" style="padding-left:8px;">
                        <input type="number" class="form-control cld-tpl-min-h" value="${esc(min.h ?? 0)}">
                      </div>
                    </div>
                    <div class="row">
                      <div class="col-sm-6" style="padding-right:8px;">
                        <label style="font-size:13px;">Минимальная глубина</label>
                      </div>
                      <div class="col-sm-6" style="padding-left:8px;">
                        <input type="number" class="form-control cld-tpl-min-d" value="${esc(min.d ?? 0)}">
                      </div>
                    </div>
                  </div>
                  <div class="col-sm-6">
                    <div class="row" style="margin-bottom:8px;">
                      <div class="col-sm-6" style="padding-right:8px;">
                        <label style="font-size:13px;">Максимальная ширина</label>
                      </div>
                      <div class="col-sm-6" style="padding-left:8px;">
                        <input type="number" class="form-control cld-tpl-max-w" value="${esc(max.w ?? 0)}">
                      </div>
                    </div>
                    <div class="row" style="margin-bottom:8px;">
                      <div class="col-sm-6" style="padding-right:8px;">
                        <label style="font-size:13px;">Максимальная высота</label>
                      </div>
                      <div class="col-sm-6" style="padding-left:8px;">
                        <input type="number" class="form-control cld-tpl-max-h" value="${esc(max.h ?? 0)}">
                      </div>
                    </div>
                    <div class="row">
                      <div class="col-sm-6" style="padding-right:8px;">
                        <label style="font-size:13px;">Максимальная глубина</label>
                      </div>
                      <div class="col-sm-6" style="padding-left:8px;">
                        <input type="number" class="form-control cld-tpl-max-d" value="${esc(max.d ?? 0)}">
                      </div>
                    </div>
                  </div>
                </div>

                <div style="margin-top:14px;">
                  <div style="font-size:13px; font-weight:600; margin-bottom:8px;">Комплектующие</div>
                  <button type="button" class="btn btn-primary btn-sm cld-tpl-acc-add">Добавить</button>
                  <div class="cld-tpl-acc-list" style="margin-top:10px;">
                    ${Array.isArray(t.accessories) && t.accessories.length ? `
                      <table class="table table-bordered table-sm" style="margin:0;">
                        <thead>
                          <tr>
                            <td class="col-6">Название</td>
                            <td class="col-3">Артикул</td>
                            <td class="col-2">Кол-во</td>
                            <td class="col-1"></td>
                          </tr>
                        </thead>
                        <tbody>
                          ${t.accessories.map((a) => `
                            <tr data-acc-id="${esc(a?.id)}">
                              <td>${esc(a?.name || '')}</td>
                              <td>${esc(a?.sku || '')}</td>
                              <td>
                                <input type="number" min="1" class="form-control form-control-sm cld-tpl-acc-count" value="${esc(a?.count ?? 1)}" style="width:80px;">
                              </td>
                              <td>
                                <button type="button" class="btn btn-white btn-sm cld-tpl-acc-del" title="Удалить">×</button>
                              </td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    ` : `<div style="font-size:12px; color:#6b7280;">Нет добавленных комплектующих</div>`}
                  </div>
                </div>

                <div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
                  <button type="button" class="btn btn-primary cld-tpl-edit">Редактировать шаблон</button>
                  <button type="button" class="btn btn-white cld-tpl-delete">Удалить</button>
                </div>
              </div>
            `;
          }).join('');

          syncActiveSelect();
        };

        // interactions
        host.addEventListener('click', (e) => {
          const card = e.target?.closest?.('[data-tpl-id]');
          const id = card?.getAttribute?.('data-tpl-id');
          if (!id) return;

          // select card on any click (как "выбранный шаблон")
          setSelected(id);
          render();

          if (e.target?.closest?.('.cld-tpl-edit')) {
            loadTemplateIntoConstructor(id);
            const btn = document.querySelector('#catalog-item-edit .tab_menu_h li[data-tab="constructor"]');
            btn && btn.click();
            return;
          }

          if (e.target?.closest?.('.cld-tpl-acc-add')) {
            if (typeof window.openAccessoriesModalForTemplate === 'function') {
              window.openAccessoriesModalForTemplate(id);
            } else {
              alert('Модалка комплектующих ещё не инициализирована (открой вкладку "Конструктор" один раз).');
            }
            return;
          }

          if (e.target?.closest?.('.cld-tpl-delete')) {
            const st = ensureState();
            if (!st) return;
            st.templates = (st.templates || []).filter(t => String(t.id) !== String(id));
            if (!st.templates.length) {
              const tpl = {
                id: 'tpl_' + Math.random().toString(36).slice(2),
                name: '',
                article: '',
                min: { w: 0, h: 0, d: 0 },
                max: { w: 0, h: 0, d: 0 },
                accessories: [],
                constructor_structure: snapshotFromConstructor(),
              };
              st.templates = [tpl];
              st.selectedTemplateId = tpl.id;
            } else {
              st.selectedTemplateId = st.templates[0].id;
            }
            render();
          }
        });

        host.addEventListener('click', (e) => {
          const card = e.target?.closest?.('[data-tpl-id]');
          const id = card?.getAttribute?.('data-tpl-id');
          if (!id) return;
          const delBtn = e.target?.closest?.('.cld-tpl-acc-del');
          if (!delBtn) return;
          const row = delBtn.closest?.('tr[data-acc-id]');
          const aid = row?.getAttribute?.('data-acc-id');
          if (!aid) return;
          const st = ensureState();
          const t = (st?.templates || []).find(x => String(x.id) === String(id));
          if (!t) return;
          t.accessories = (t.accessories || []).filter(a => String(a?.id) !== String(aid));
          render();
        });

        host.addEventListener('input', (e) => {
          const card = e.target?.closest?.('[data-tpl-id]');
          const id = card?.getAttribute?.('data-tpl-id');
          if (!id) return;
          const st = ensureState();
          if (!st) return;
          const t = (st.templates || []).find(x => String(x.id) === String(id));
          if (!t) return;
          t.min = t.min || { w: 0, h: 0, d: 0 };
          t.max = t.max || { w: 0, h: 0, d: 0 };

          if (e.target?.classList?.contains('cld-tpl-name')) t.name = String(e.target.value || '');
          if (e.target?.classList?.contains('cld-tpl-article')) t.article = String(e.target.value || '');

          const n = Number(e.target.value);
          const nn = Number.isFinite(n) ? n : 0;
          if (e.target?.classList?.contains('cld-tpl-min-w')) t.min.w = nn;
          if (e.target?.classList?.contains('cld-tpl-min-h')) t.min.h = nn;
          if (e.target?.classList?.contains('cld-tpl-min-d')) t.min.d = nn;
          if (e.target?.classList?.contains('cld-tpl-max-w')) t.max.w = nn;
          if (e.target?.classList?.contains('cld-tpl-max-h')) t.max.h = nn;
          if (e.target?.classList?.contains('cld-tpl-max-d')) t.max.d = nn;

          // перерисовывать не будем, чтобы не сбивать фокус; обновим селект активного шаблона, если меняли имя
          if (e.target?.classList?.contains('cld-tpl-name')) syncActiveSelect();

          // count change for accessory
          if (e.target?.classList?.contains('cld-tpl-acc-count')) {
            const row = e.target.closest?.('tr[data-acc-id]');
            const aid = row?.getAttribute?.('data-acc-id');
            if (!aid) return;
            t.accessories = Array.isArray(t.accessories) ? t.accessories : [];
            const a = t.accessories.find(x => x && String(x.id) === String(aid));
            if (!a) return;
            const n2 = Number(e.target.value);
            a.count = (Number.isFinite(n2) && n2 > 0) ? n2 : 1;
          }

          // если меняем лимиты — применяем их к текущим размерам/вариантам (как в референсе)
          if (
            e.target?.classList?.contains('cld-tpl-min-w') ||
            e.target?.classList?.contains('cld-tpl-min-h') ||
            e.target?.classList?.contains('cld-tpl-min-d') ||
            e.target?.classList?.contains('cld-tpl-max-w') ||
            e.target?.classList?.contains('cld-tpl-max-h') ||
            e.target?.classList?.contains('cld-tpl-max-d')
          ) {
            try { window.__cldClampMainSizeInputs && window.__cldClampMainSizeInputs(); } catch {}
            try { window.__cldFilterVariantsByLimits && window.__cldFilterVariantsByLimits(); } catch {}
          }
        });

        btnAddBottom.addEventListener('click', () => {
          const st = ensureState();
          if (!st) return;
          const tpl = {
            id: 'tpl_' + Math.random().toString(36).slice(2),
            name: '',
            article: '',
            min: { w: 0, h: 0, d: 0 },
            max: { w: 0, h: 0, d: 0 },
            accessories: [],
            constructor_structure: snapshotFromConstructor(),
          };
          st.templates.push(tpl);
          st.selectedTemplateId = tpl.id;
          render();
        });

        if (activeSelect && !activeSelect.__cldBoundTemplates) {
          activeSelect.addEventListener('change', () => {
            const v = String(activeSelect.value || 'auto');
            if (v === 'auto') return;
            setSelected(v);
            loadTemplateIntoConstructor(v);
          });
          activeSelect.__cldBoundTemplates = true;
        }

        window.__CLD_TEMPLATES_RENDER = render;
        render();
      }

      // ===== Вкладка "Материалы" (clean-room) =====
      // UI как в референсе по смыслу: список групп материалов, толщина, выбранный материал по группе.
      function initMaterialsTab() {
        if (window.__CLD_MATERIALS_TAB_INITIALIZED) {
          try { window.__CLD_MATERIALS_RENDER && window.__CLD_MATERIALS_RENDER(); } catch {}
          return;
        }
        window.__CLD_MATERIALS_TAB_INITIALIZED = true;

        const host = document.getElementById('cld-materials-container');
        const btnReset = document.getElementById('cld-materials-reset');
        const btnApply = document.getElementById('cld-materials-apply');
        if (!host || !btnReset || !btnApply) return;

        // гарантируем, что материалы-утилиты существуют даже если вкладку "Конструктор" ещё не открывали
        window.__cldMaterialsLib = window.__cldMaterialsLib || null;
        window.__cldMaterialsState = window.__cldMaterialsState || { groupOverrides: {} };
        window.__cldMaterialsLoading = window.__cldMaterialsLoading || null;

        async function __cldFetchJson(url) {
          const r = await fetch(url, { cache: 'no-store' });
          if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
          return await r.json();
        }
        if (typeof window.__cldEnsureMaterialsLoaded !== 'function') {
          window.__cldEnsureMaterialsLoaded = async function __cldEnsureMaterialsLoaded() {
            if (window.__cldMaterialsLib) return window.__cldMaterialsLib;
            if (window.__cldMaterialsLoading) return window.__cldMaterialsLoading;
            window.__cldMaterialsLoading = (async () => {
              const [groups, keys] = await Promise.all([
                __cldFetchJson('/data/materials_groups.json'),
                __cldFetchJson('/data/materials_keys.json'),
              ]);
              const itemsByKey = {};
              for (const k of (keys || [])) {
                const key = k?.key;
                if (!key) continue;
                try { itemsByKey[key] = await __cldFetchJson(`/data/materials_${key}_items.json`); }
                catch { itemsByKey[key] = []; }
              }
              window.__cldMaterialsLib = { groups: groups || [], keys: keys || [], itemsByKey };
              return window.__cldMaterialsLib;
            })();
            try { return await window.__cldMaterialsLoading; }
            finally { window.__cldMaterialsLoading = null; }
          };
        }
        if (typeof window.__cldBuildMaterialsPayload !== 'function') {
          const _norm = (k) => (typeof window.__cldNormalizeMaterialKey === 'function' ? window.__cldNormalizeMaterialKey(k) : k) || 'material_2';
          const _def = () => (window.__cldMaterialsLib?.keys?.[0]?.key) || 'material_2';
          window.__cldBuildMaterialsPayload = function __cldBuildMaterialsPayload() {
            const lib = window.__cldMaterialsLib;
            const out = {};
            const st = window.__cldMaterialsState || { groupOverrides: {} };
            const defaultWt = 16;
            if (!lib) return { vars: { _wt: defaultWt }, materials: { g0: { thickness: defaultWt, material: { key: 'material_2', id: 0, variant_id: 0 } } } };
            for (const g of (lib.groups || [])) {
              const key = g?.key;
              if (!key) continue;
              const ov = st.groupOverrides?.[key] || {};
              const thickness = Number(ov.thickness ?? g.thickness ?? (key === 'g0' ? defaultWt : 16));
              out[key] = {
                thickness,
                material: { key: _norm(ov.material_key || g.material) || _def(), id: ov.material_id || 0, variant_id: 0 },
              };
            }
            if (!out.g0) out.g0 = { thickness: defaultWt, material: { key: _def(), id: 0, variant_id: 0 } };
            return { vars: { _wt: Number(out.g0.thickness) || defaultWt }, materials: out };
          };
        }

        const getRoot = () => document.getElementById('constructor-root-module');
        const persistToRoot = () => {
          const root = getRoot();
          if (!root) return;
          root.nodeData = root.nodeData || {};
          root.nodeData.materials_overrides = JSON.parse(JSON.stringify(window.__cldMaterialsState?.groupOverrides || {}));
        };
        const restoreFromRoot = () => {
          const root = getRoot();
          const ov = root?.nodeData?.materials_overrides;
          if (ov && typeof ov === 'object') {
            window.__cldMaterialsState.groupOverrides = { ...(ov || {}) };
          }
        };

        const esc = (s) => String(s ?? '')
          .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
          .replace(/"/g,'&quot;').replace(/'/g,'&#039;');

        const getMatName = (lib, matKey, matId) => {
          const items = Array.isArray(lib?.itemsByKey?.[matKey]) ? lib.itemsByKey[matKey] : [];
          const it = items.find(x => String(x?.id) === String(matId));
          return it?.name || '';
        };

        // Модель как в рефе: список групп материалов в модуле (можно добавлять/удалять), а значения (толщина/материал)
        // лежат в overrides по ключу группы.
        const ensureModuleGroups = async () => {
          const root = getRoot();
          if (!root) return null;
          root.nodeData = root.nodeData || {};
          const lib = await window.__cldEnsureMaterialsLoaded();
          const globalGroups = Array.isArray(lib?.groups) ? lib.groups : [];
          const keys = Array.isArray(lib?.keys) ? lib.keys : [];
          const defaultsKey = keys?.[0]?.key || 'material_2';

          if (!Array.isArray(root.nodeData.material_groups)) {
            // инициализируем из global groups (как минимум g0)
            const base = globalGroups.length ? globalGroups : [{ key: 'g0', name: 'Корпус', thickness: 16, material: defaultsKey }];
            root.nodeData.material_groups = base.map((g, idx) => ({
              name: g.name || g.key || 'Группа',
              key: g.key || ('g' + idx),
              local: 0,
              locked: 0,
              is_default: (g.key === 'g0') ? 1 : 0,
              allowed_keys: [g.material || defaultsKey],
            }));
          }
          return root.nodeData.material_groups;
        };

        const openAddGroupModal = () => {
          const m = document.getElementById('cld-mat-group-modal');
          if (!m) return;
          const n = document.getElementById('cld-mat-group-name');
          const k = document.getElementById('cld-mat-group-key');
          if (n) n.value = 'Корпус';
          if (k) k.value = 'g' + Math.floor(Math.random() * 100);
          m.style.display = 'flex';
        };
        const closeAddGroupModal = () => {
          const m = document.getElementById('cld-mat-group-modal');
          if (m) m.style.display = 'none';
        };
        const openAddFromGlobalModal = async () => {
          const m = document.getElementById('cld-mat-group-global-modal');
          const body = document.getElementById('cld-mat-group-global-body');
          if (!m || !body) return;
          const lib = await window.__cldEnsureMaterialsLoaded();
          const groups = Array.isArray(lib?.groups) ? lib.groups : [];
          body.innerHTML = groups.map((g) => `
            <tr>
              <td style="padding:8px; border:1px solid #e5e7eb;">${esc(g.name || g.key || '')}</td>
              <td style="padding:8px; border:1px solid #e5e7eb; width:140px;">${esc(g.key || '')}</td>
              <td style="padding:8px; border:1px solid #e5e7eb; width:140px; text-align:right;">
                <button type="button" class="btn btn-primary btn-sm cld-mat-global-add" data-gk="${esc(g.key)}">Добавить</button>
              </td>
            </tr>
          `).join('') || `<tr><td colspan="3" style="padding:12px; text-align:center; color:#6b7280;">Нет групп</td></tr>`;
          m.style.display = 'flex';
        };
        const closeAddFromGlobalModal = () => {
          const m = document.getElementById('cld-mat-group-global-modal');
          if (m) m.style.display = 'none';
        };

        const getItemName = (lib, matKey, matId) => {
          const items = Array.isArray(lib?.itemsByKey?.[matKey]) ? lib.itemsByKey[matKey] : [];
          const it = items.find(x => String(x?.id) === String(matId));
          return it?.name || '';
        };

        const render = async () => {
          restoreFromRoot();
          const lib = await window.__cldEnsureMaterialsLoaded();
          const keys = Array.isArray(lib?.keys) ? lib.keys : [];
          const st = window.__cldMaterialsState || { groupOverrides: {} };
          const groups = await ensureModuleGroups();
          if (!groups) return;

          host.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:12px;">
              <div style="font-size:18px; font-weight:700;">Группы материалов</div>
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <button type="button" class="btn btn-primary" id="cld-mat-add">Добавить</button>
                <button type="button" class="btn btn-primary" id="cld-mat-add-global">Добавить из глобальных групп</button>
              </div>
            </div>

            ${groups.map((g) => {
              const gk = String(g.key || '').trim();
              const ov = st.groupOverrides?.[gk] || {};
              const defaultsKey = (lib?.keys?.[0]?.key) || 'material_2';
              const allowedKey = (Array.isArray(g.allowed_keys) && g.allowed_keys[0]) ? __cldNormalizeMaterialKey(g.allowed_keys[0]) : (__cldNormalizeMaterialKey(ov.material_key) || defaultsKey);
              const matKey = __cldNormalizeMaterialKey(ov.material_key) || allowedKey || defaultsKey;
              const matId = ov.material_id || 0;
              const thickness = Number(ov.thickness ?? 0);
              const matTypeName = keys.find(k => String(k.key) === String(matKey))?.name || matKey;
              const matName = matId ? (getItemName(lib, matKey, matId) || String(matId)) : 'не задан';
              const isDefault = !!g.is_default;
              const locked = !!g.locked;
              const local = !!g.local;

              return `
                <div data-gk="${esc(gk)}" style="border-top:1px solid #e5e7eb; padding-top:14px; margin-top:14px;">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                    <div class="row" style="flex:1; margin:0;">
                      <div class="col-sm-6">
                        <label style="font-weight:600; font-size:13px;">Название</label>
                        <input type="text" class="form-control form-control-sm cld-mg-name" value="${esc(g.name || '')}">
                      </div>
                      <div class="col-sm-4">
                        <label style="font-weight:600; font-size:13px;">Ключ</label>
                        <input type="text" class="form-control form-control-sm cld-mg-key" value="${esc(gk)}" ${gk === 'g0' ? 'readonly' : ''}>
                      </div>
                    </div>
                    <button type="button" class="btn btn-white btn-sm cld-mg-del" title="Удалить" ${gk === 'g0' ? 'disabled' : ''}>🗑</button>
                  </div>

                  <div style="margin-top:12px;">
                    <div style="font-size:13px; font-weight:600; margin-bottom:8px;">Доступные материалы:</div>
                    <table class="table table-bordered table-sm" style="margin:0; max-width:560px;">
                      <thead>
                        <tr>
                          <td class="col-6">Материал</td>
                          <td class="col-3">Толщина</td>
                          <td class="col-3">Категория</td>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>${esc(matTypeName)}</td>
                          <td>${Number.isFinite(thickness) && thickness > 0 ? esc(thickness) : '(не задана)'}</td>
                          <td>(не задана)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div style="margin-top:12px; display:flex; gap:16px; flex-wrap:wrap; align-items:center;">
                    <div style="min-width:320px;">
                      <div style="font-size:13px; font-weight:600; margin-bottom:6px;">Материал по умолчанию:</div>
                      <div style="font-size:12px; color:#111;">
                        ${esc(matTypeName)} / ${esc(matName)}
                      </div>
                      <div style="margin-top:8px;">
                        <button type="button" class="btn btn-primary btn-sm cld-mg-pick">Изменить</button>
                      </div>
                    </div>

                    <div style="display:flex; gap:22px; flex-wrap:wrap;">
                      <div>
                        <div style="font-size:12px; color:#111; margin-bottom:6px;">Локальная группа:</div>
                        <label class="switch">
                          <input type="checkbox" class="cld-mg-local" ${local ? 'checked' : ''}>
                          <span class="slider round"></span>
                        </label>
                      </div>
                      <div>
                        <div style="font-size:12px; color:#111; margin-bottom:6px;">Забл. изменение:</div>
                        <label class="switch">
                          <input type="checkbox" class="cld-mg-locked" ${locked ? 'checked' : ''}>
                          <span class="slider round"></span>
                        </label>
                      </div>
                      <div>
                        <div style="font-size:12px; color:#111; margin-bottom:6px;">По умолчанию:</div>
                        <label class="switch">
                          <input type="checkbox" class="cld-mg-default" ${isDefault ? 'checked' : ''}>
                          <span class="slider round"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}

            <div style="margin-top:16px; display:flex; gap:10px; flex-wrap:wrap;">
              <button type="button" class="btn btn-primary" id="cld-mat-add-bottom">Добавить</button>
              <button type="button" class="btn btn-primary" id="cld-mat-add-global-bottom">Добавить из глобальных групп</button>
            </div>
          `;

          // wire buttons
          host.querySelector('#cld-mat-add')?.addEventListener('click', openAddGroupModal);
          host.querySelector('#cld-mat-add-bottom')?.addEventListener('click', openAddGroupModal);
          host.querySelector('#cld-mat-add-global')?.addEventListener('click', openAddFromGlobalModal);
          host.querySelector('#cld-mat-add-global-bottom')?.addEventListener('click', openAddFromGlobalModal);
        };

        // debounce apply to preview
        let t = null;
        const schedulePreview = () => {
          if (t) clearTimeout(t);
          t = setTimeout(() => {
            persistToRoot();
            if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
          }, 250);
        };

        host.addEventListener('input', (e) => {
          const wrap = e.target?.closest?.('[data-gk]');
          const gk = wrap?.getAttribute?.('data-gk');
          if (!gk) return;
          const root = getRoot();
          const groups = root?.nodeData?.material_groups;
          const g = Array.isArray(groups) ? groups.find(x => String(x?.key) === String(gk)) : null;
          if (!g) return;

          if (e.target?.classList?.contains('cld-mg-name')) {
            g.name = String(e.target.value || '');
            persistToRoot();
            return;
          }
          if (e.target?.classList?.contains('cld-mg-key')) {
            if (String(gk) === 'g0') return;
            const newKey = String(e.target.value || '').trim();
            if (!newKey) return;
            // перенос overrides на новый ключ
            const st = window.__cldMaterialsState || (window.__cldMaterialsState = { groupOverrides: {} });
            if (st.groupOverrides[gk] && newKey !== gk) {
              st.groupOverrides[newKey] = { ...(st.groupOverrides[gk] || {}) };
              delete st.groupOverrides[gk];
            }
            g.key = newKey;
            persistToRoot();
            schedulePreview();
            return;
          }
        });

        host.addEventListener('change', (e) => {
          const wrap = e.target?.closest?.('[data-gk]');
          const gk = wrap?.getAttribute?.('data-gk');
          if (!gk) return;
          const root = getRoot();
          const groups = root?.nodeData?.material_groups;
          const g = Array.isArray(groups) ? groups.find(x => String(x?.key) === String(gk)) : null;
          if (!g) return;

          if (e.target?.classList?.contains('cld-mg-local')) {
            g.local = e.target.checked ? 1 : 0;
            persistToRoot();
            return;
          }
          if (e.target?.classList?.contains('cld-mg-locked')) {
            g.locked = e.target.checked ? 1 : 0;
            persistToRoot();
            return;
          }
          if (e.target?.classList?.contains('cld-mg-default')) {
            // только одна группа default
            if (Array.isArray(groups)) {
              for (const gg of groups) gg.is_default = 0;
            }
            g.is_default = e.target.checked ? 1 : 0;
            if (!g.is_default) g.is_default = 1; // как в рефе: всегда есть default
            persistToRoot();
            return;
          }
        });

        host.addEventListener('click', (e) => {
          const wrap = e.target?.closest?.('[data-gk]');
          const gk = wrap?.getAttribute?.('data-gk');
          if (!gk) return;
          const root = getRoot();
          const groups = root?.nodeData?.material_groups;
          const g = Array.isArray(groups) ? groups.find(x => String(x?.key) === String(gk)) : null;
          if (!g) return;

          if (e.target?.closest?.('.cld-mg-del')) {
            e.preventDefault();
            if (String(gk) === 'g0') return;
            root.nodeData.material_groups = (root.nodeData.material_groups || []).filter(x => String(x?.key) !== String(gk));
            const st = window.__cldMaterialsState || (window.__cldMaterialsState = { groupOverrides: {} });
            delete st.groupOverrides[gk];
            persistToRoot();
            schedulePreview();
            try { window.__CLD_MATERIALS_RENDER && window.__CLD_MATERIALS_RENDER(); } catch {}
            return;
          }

          if (e.target?.closest?.('.cld-mg-pick')) {
            e.preventDefault();
            const st = window.__cldMaterialsState || (window.__cldMaterialsState = { groupOverrides: {} });
            const ov = st.groupOverrides[gk] || {};
            const mk = __cldNormalizeMaterialKey(ov.material_key) || (Array.isArray(g.allowed_keys) ? __cldNormalizeMaterialKey(g.allowed_keys[0]) : null) || (window.__cldMaterialsLib?.keys?.[0]?.key) || 'material_2';
            // контекст для модалки
            window.__CLD_MATERIAL_MODAL_CONTEXT = { kind: 'groupDefault', groupKey: String(gk), materialKey: String(mk) };
            window.__CLD_MATERIAL_TARGET = { kind: 'groupDefault', groupKey: String(gk), materialKey: String(mk) };
            if (typeof window.openMaterialSelectModal === 'function') window.openMaterialSelectModal();
            return;
          }

          // add from global groups modal
          const addBtn = e.target?.closest?.('.cld-mat-global-add');
          if (addBtn) {
            e.preventDefault();
            const gk2 = addBtn.getAttribute('data-gk');
            if (!gk2) return;
            (async () => {
              const lib = await window.__cldEnsureMaterialsLoaded();
              const gg = (lib.groups || []).find(x => String(x?.key) === String(gk2));
              if (!gg) return;
              const list = await ensureModuleGroups();
              if (!list) return;
              if (list.some(x => String(x?.key) === String(gk2))) return;
              list.push({
                name: gg.name || gk2,
                key: gk2,
                local: 0,
                locked: 0,
                is_default: 0,
                allowed_keys: [__cldNormalizeMaterialKey(gg.material) || (window.__cldMaterialsLib?.keys?.[0]?.key) || 'material_2'],
              });
              persistToRoot();
              closeAddFromGlobalModal();
              try { window.__CLD_MATERIALS_RENDER && window.__CLD_MATERIALS_RENDER(); } catch {}
            })();
            return;
          }
        });

        // перехват выбора материала из модалки: если target=groupDefault — пишем в overrides, иначе оставляем поведение конструктора
        if (!window.__CLD_MATERIALS_PATCHED_SELECT && typeof window.selectMaterialForNode === 'function') {
          const orig = window.selectMaterialForNode;
          window.selectMaterialForNode = function(materialId, materialName) {
            const target = window.__CLD_MATERIAL_TARGET;
            if ((target?.kind === 'groupDefault') && target.groupKey) {
              const gk = String(target.groupKey);
              const st = window.__cldMaterialsState || (window.__cldMaterialsState = { groupOverrides: {} });
              st.groupOverrides[gk] = st.groupOverrides[gk] || {};
              const materialKey = String(__cldNormalizeMaterialKey(target.materialKey || st.groupOverrides[gk].material_key) || (window.__cldMaterialsLib?.keys?.[0]?.key) || 'material_2');
              st.groupOverrides[gk].material_key = materialKey;
              st.groupOverrides[gk].material_id = materialId;
              persistToRoot();
              try { window.closeMaterialSelectModal && window.closeMaterialSelectModal(); } catch {}
              window.__CLD_MATERIAL_MODAL_CONTEXT = null;
              window.__CLD_MATERIAL_TARGET = null;
              schedulePreview();
              try { window.__CLD_MATERIALS_RENDER && window.__CLD_MATERIALS_RENDER(); } catch {}
              return;
            }
            return orig(materialId, materialName);
          };
          window.__CLD_MATERIALS_PATCHED_SELECT = true;
        }

        btnReset.addEventListener('click', () => {
          window.__cldMaterialsState = window.__cldMaterialsState || { groupOverrides: {} };
          window.__cldMaterialsState.groupOverrides = {};
          persistToRoot();
          try { window.__CLD_MATERIALS_RENDER && window.__CLD_MATERIALS_RENDER(); } catch {}
          if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
        });

        btnApply.addEventListener('click', () => {
          persistToRoot();
          if (typeof toastr !== 'undefined') toastr.success('Материалы применены');
          if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
        });

        // save new material group from modal
        const mgSave = document.getElementById('cld-mat-group-save');
        if (mgSave && !mgSave.__cldBound) {
          mgSave.addEventListener('click', async () => {
            const root = getRoot();
            if (!root) return;
            const nameEl = document.getElementById('cld-mat-group-name');
            const keyEl = document.getElementById('cld-mat-group-key');
            const name = String(nameEl?.value || '').trim() || 'Группа';
            const key = String(keyEl?.value || '').trim() || ('g' + Math.floor(Math.random() * 100));
            const list = await ensureModuleGroups();
            if (!list) return;
            if (list.some(x => String(x?.key) === String(key))) {
              alert('Группа с таким ключом уже существует');
              return;
            }
            list.push({ name, key, local: 1, locked: 0, is_default: 0, allowed_keys: [(window.__cldMaterialsLib?.keys?.[0]?.key) || 'material_2'] });
            persistToRoot();
            document.getElementById('cld-mat-group-modal').style.display = 'none';
            try { window.__CLD_MATERIALS_RENDER && window.__CLD_MATERIALS_RENDER(); } catch {}
          });
          mgSave.__cldBound = true;
        }

        window.__CLD_MATERIALS_RENDER = render;
        render();
      }

      // ===== Вкладка "Комплектующие" (clean-room) =====
      // Управление библиотекой комплектующих (furniture/model): просмотр, добавление, редактирование
      function initAccessoriesTab() {
        if (window.__CLD_ACCESSORIES_TAB_INITIALIZED) {
          try { window.__CLD_ACCESSORIES_RENDER && window.__CLD_ACCESSORIES_RENDER(); } catch {}
          return;
        }
        window.__CLD_ACCESSORIES_TAB_INITIALIZED = true;

        const host = document.getElementById('cld-accessories-container');
        if (!host) return;

        // Библиотека комплектующих: загружаем из /data/accessories.json или используем пустую структуру
        let accessoriesLib = window.__cldAccessoriesLib || null;
        const ensureLib = async () => {
          if (accessoriesLib) return accessoriesLib;
          try {
            const r = await fetch('/data/accessories.json', { cache: 'no-store' });
            if (r.ok) {
              accessoriesLib = await r.json();
              window.__cldAccessoriesLib = accessoriesLib;
              return accessoriesLib;
            }
          } catch (e) {
            console.warn('[CLD][accessories] Не удалось загрузить библиотеку из /data/accessories.json:', e);
          }
          // Fallback: пустая структура
          accessoriesLib = {
            types: [],
            items: {}
          };
          window.__cldAccessoriesLib = accessoriesLib;
          return accessoriesLib;
        };

        const esc = (s) => String(s ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');

        const render = async () => {
          const lib = await ensureLib();
          const types = Array.isArray(lib.types) ? lib.types : [];
          const items = lib.items && typeof lib.items === 'object' ? lib.items : {};

          host.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:16px;">
              <div style="font-size:18px; font-weight:700;">Библиотека комплектующих</div>
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <button type="button" class="btn btn-primary" id="cld-acc-add-type">Добавить тип</button>
                <button type="button" class="btn btn-primary" id="cld-acc-add-item">Добавить комплектующее</button>
                <button type="button" class="btn btn-white" id="cld-acc-export">Экспорт JSON</button>
                <button type="button" class="btn btn-white" id="cld-acc-import">Импорт JSON</button>
                <input id="cld-acc-import-file" type="file" accept=".json,application/json" style="display:none;" />
              </div>
            </div>

            <div style="margin-bottom:20px; padding:12px; background:#f9fafb; border-radius:6px; font-size:13px; color:#6b7280;">
              <strong>Примечание:</strong> Библиотека комплектующих хранится в <code>/data/accessories.json</code>.
              ${!lib || !lib.types || !lib.types.length ? '<br><span style="color:#dc2626;">⚠️ Файл не найден или пуст. Создайте JSON библиотеки (см. ниже).</span>' : ''}
            </div>

            ${types.length ? `
              <div style="margin-bottom:20px;">
                <div style="font-size:14px; font-weight:600; margin-bottom:10px;">Типы комплектующих (${types.length})</div>
                <table class="table table-bordered table-sm" style="margin:0;">
                  <thead>
                    <tr>
                      <td style="width:60px;">ID</td>
                      <td>Название</td>
                      <td style="width:200px;">Ключ</td>
                      <td style="width:100px;">Элементов</td>
                      <td style="width:140px;"></td>
                    </tr>
                  </thead>
                  <tbody>
                    ${types.map((t) => {
                      const typeItems = Array.isArray(items[t.key]) ? items[t.key] : [];
                      return `
                        <tr data-type-key="${esc(t.key)}">
                          <td>${esc(t.id || '')}</td>
                          <td><strong>${esc(t.name || t.key || '')}</strong></td>
                          <td><code>${esc(t.key || '')}</code></td>
                          <td>${typeItems.length}</td>
                          <td style="text-align:right;">
                            <button type="button" class="btn btn-white btn-sm cld-acc-edit-type">Редактировать</button>
                            <button type="button" class="btn btn-white btn-sm cld-acc-del-type">Удалить</button>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}

            ${Object.keys(items).length ? `
              <div>
                <div style="font-size:14px; font-weight:600; margin-bottom:10px;">Все комплектующие</div>
                <div style="overflow:auto; max-height:500px;">
                  <table class="table table-bordered table-sm" style="margin:0; min-width:800px;">
                    <thead>
                      <tr>
                        <td style="width:80px;">ID</td>
                        <td>Название</td>
                        <td>Артикул</td>
                        <td>Тип</td>
                        <td style="width:100px;">Цена</td>
                        <td style="width:140px;"></td>
                      </tr>
                    </thead>
                    <tbody>
                      ${Object.entries(items).flatMap(([typeKey, typeItems]) => {
                        if (!Array.isArray(typeItems)) return [];
                        return typeItems.map((item) => `
                          <tr data-item-id="${esc(item.id)}" data-item-type="${esc(typeKey)}">
                            <td>${esc(item.id || '')}</td>
                            <td><strong>${esc(item.name || '')}</strong></td>
                            <td><code>${esc(item.sku || item.code || '')}</code></td>
                            <td>${esc(typeKey)}</td>
                            <td>${item.price ? esc(Number(item.price).toFixed(2)) : '—'}</td>
                            <td style="text-align:right;">
                              <button type="button" class="btn btn-white btn-sm cld-acc-edit-item">Редактировать</button>
                              <button type="button" class="btn btn-white btn-sm cld-acc-del-item">Удалить</button>
                            </td>
                          </tr>
                        `);
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            ` : '<div style="padding:40px; text-align:center; color:#6b7280;">Нет комплектующих. Добавьте первый элемент.</div>'}

            <div style="margin-top:30px; padding:16px; background:#f9fafb; border-radius:6px; font-size:12px; color:#374151;">
              <strong>Формат JSON библиотеки:</strong>
              <pre style="margin:8px 0 0; padding:12px; background:#fff; border:1px solid #e5e7eb; border-radius:4px; overflow:auto; font-size:11px; line-height:1.4;">{
  "types": [
    { "id": 1, "key": "handles", "name": "Ручки" },
    { "id": 2, "key": "hinges", "name": "Петли" }
  ],
  "items": {
    "handles": [
      { "id": 1, "name": "Ручка круглая", "sku": "H001", "price": 150 },
      { "id": 2, "name": "Ручка квадратная", "sku": "H002", "price": 180 }
    ],
    "hinges": [
      { "id": 1, "name": "Петля стандартная", "sku": "P001", "price": 50 }
    ]
  }
}</pre>
            </div>
          `;

          // Wire buttons
          host.querySelector('#cld-acc-export')?.addEventListener('click', () => {
            const json = JSON.stringify(accessoriesLib, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'accessories.json';
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            if (typeof toastr !== 'undefined') toastr.success('JSON экспортирован');
          });

          host.querySelector('#cld-acc-import')?.addEventListener('click', () => {
            document.getElementById('cld-acc-import-file')?.click();
          });

          const importFile = document.getElementById('cld-acc-import-file');
          if (importFile && !importFile.__cldBound) {
            importFile.addEventListener('change', async (e) => {
              const f = e.target?.files?.[0];
              if (!f) return;
              try {
                const text = await f.text();
                const parsed = JSON.parse(text);
                if (parsed && (Array.isArray(parsed.types) || parsed.items)) {
                  accessoriesLib = parsed;
                  window.__cldAccessoriesLib = accessoriesLib;
                  // TODO: сохранить на сервер в /data/accessories.json
                  if (typeof toastr !== 'undefined') toastr.success('JSON импортирован (в память)');
                  render();
                } else {
                  alert('Неверный формат JSON');
                }
              } catch (err) {
                alert('Ошибка парсинга JSON: ' + (err?.message || err));
              }
            });
            importFile.__cldBound = true;
          }

          // Add/Edit/Delete handlers (заглушки)
          host.querySelector('#cld-acc-add-type')?.addEventListener('click', () => {
            alert('Добавление типа: будет реализовано позже');
          });
          host.querySelector('#cld-acc-add-item')?.addEventListener('click', () => {
            alert('Добавление комплектующего: будет реализовано позже');
          });
        };

        window.__CLD_ACCESSORIES_RENDER = render;
        render();
      }
      
      // ===== Страница "Комплектующие и фурнитура" (библиотека) =====
      let accessoriesLibraryPage = {
        currentPage: 1,
        perPage: 20,
        searchQuery: '',
        categoryFilter: '',
        allItems: []
      };
      
      async function loadAccessoriesLibrary() {
        const tbody = document.getElementById('accessories-library-table-body');
        if (!tbody) return;
        
        // Показываем загрузку
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px;">Загрузка...</td></tr>';
        
        try {
          // Загружаем библиотеку комплектующих
          const lib = window.__cldAccessoriesLib || {
            types: [],
            items: {}
          };
          
          // Собираем все комплектующие из библиотеки в один массив
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
          
          // Применяем фильтры
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
          
          // Пагинация
          const perPage = accessoriesLibraryPage.perPage;
          const totalPages = Math.ceil(filtered.length / perPage);
          const start = (accessoriesLibraryPage.currentPage - 1) * perPage;
          const end = start + perPage;
          const pageItems = filtered.slice(start, end);
          
          // Рендерим таблицу (как в референсе: иконки в квадратных кнопках)
          if (pageItems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#999;">Комплектующие не найдены</td></tr>';
          } else {
            tbody.innerHTML = pageItems.map(item => {
              const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
              return `
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
            `;
            }).join('');
            
            // Добавляем обработчики после рендеринга
            tbody.querySelectorAll('.cld-acc-lib-edit').forEach(btn => {
              btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                if (typeof window.openAccessoryEditModal === 'function') {
                  window.openAccessoryEditModal(id);
                } else {
                  console.error('[CLD][accessories-library] Функция openAccessoryEditModal не найдена!');
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
                } else {
                  console.error('[CLD][accessories-library] Функция deleteAccessoryFromLibrary не найдена!');
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
                } else {
                  console.error('[CLD][accessories-library] Функция toggleAccessoryVisibility не найдена!');
                }
              });
            });
          }
          
          // Обновляем пагинацию
          renderAccessoriesLibraryPagination(totalPages);
          
          // Обновляем категории в фильтре
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
        
        // Обработчики кликов на пагинацию
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
      
      // Обработчики для страницы библиотеки комплектующих
      document.addEventListener('DOMContentLoaded', function() {
        // Поиск
        const searchInput = document.getElementById('accessories-library-search');
        if (searchInput) {
          searchInput.addEventListener('input', () => {
            accessoriesLibraryPage.searchQuery = searchInput.value;
            accessoriesLibraryPage.currentPage = 1;
            loadAccessoriesLibrary();
          });
        }
        
        // Фильтр категории
        const categoryFilter = document.getElementById('accessories-category-filter');
        if (categoryFilter) {
          categoryFilter.addEventListener('change', () => {
            accessoriesLibraryPage.categoryFilter = categoryFilter.value;
            accessoriesLibraryPage.currentPage = 1;
            loadAccessoriesLibrary();
          });
        }
        
        // Количество на странице
        const perPageSelect = document.getElementById('accessories-per-page-select');
        if (perPageSelect) {
          perPageSelect.addEventListener('change', () => {
            accessoriesLibraryPage.perPage = parseInt(perPageSelect.value);
            accessoriesLibraryPage.currentPage = 1;
            loadAccessoriesLibrary();
          });
        }
        
        // Кнопка "Добавить"
        const addBtn = document.getElementById('accessories-library-add-btn');
        if (addBtn) {
          // Удаляем старый обработчик если есть
          const newAddBtn = addBtn.cloneNode(true);
          addBtn.parentNode.replaceChild(newAddBtn, addBtn);
          
          newAddBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof window.openAccessoryEditModal === 'function') {
              window.openAccessoryEditModal(null);
            } else {
              console.error('[CLD][accessories-library] Функция openAccessoryEditModal не найдена!');
              alert('Ошибка: функция открытия модального окна не найдена. Перезагрузите страницу.');
            }
          });
          newAddBtn.setAttribute('data-cld-handler-attached', 'true');
        } else {
          console.warn('[CLD][accessories-library] Кнопка "Добавить" не найдена в DOM!');
        }
        
        // Кнопка сохранения в модальном окне
        const saveBtn = document.getElementById('accessory-edit-save-btn');
        if (saveBtn) {
          saveBtn.addEventListener('click', () => {
            if (typeof window.saveAccessoryFromModal === 'function') {
              window.saveAccessoryFromModal();
            } else {
              console.error('[CLD][accessories-library] Функция saveAccessoryFromModal не найдена!');
            }
          });
        }
        
        // Кнопка "Экспорт JSON"
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
        
        // Кнопка "Импорт JSON"
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
        
        // Кнопка "Очистить базу"
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
      });

      // ===== Вкладка "События" (clean-room) =====
      // Централизованное управление событиями всех узлов конструктора
      function initEventsTab() {
        if (window.__CLD_EVENTS_TAB_INITIALIZED) {
          try { window.__CLD_EVENTS_RENDER && window.__CLD_EVENTS_RENDER(); } catch {}
          return;
        }
        window.__CLD_EVENTS_TAB_INITIALIZED = true;

        const host = document.getElementById('cld-events-container');
        if (!host) return;

        const esc = (s) => String(s ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');

        // Собираем все узлы из дерева конструктора
        const collectAllNodes = () => {
          const nodes = [];
          const root = document.getElementById('constructor-root-module');
          if (!root) return nodes;

          const walk = (el, path = '') => {
            if (!el || !el.nodeData) return;
            const name = el.nodeData.name || el.querySelector('.tree-node-name')?.textContent?.trim() || 'Без названия';
            const type = el.getAttribute('data-node-type') || 'unknown';
            const nodeId = el.getAttribute('data-node-id') || '';
            const currentPath = path ? `${path} > ${name}` : name;

            const events = el.nodeData.events || {
              on_before_params: '',
              on_before_build: '',
              on_after_build: '',
              on_drag_end: ''
            };

            nodes.push({
              element: el,
              nodeId,
              type,
              name,
              path: currentPath,
              events: { ...events }
            });

            const children = el.querySelector('.tree-node-children');
            if (children) {
              const childNodes = children.querySelectorAll('.constructor-tree-node');
              childNodes.forEach(child => walk(child, currentPath));
            }
          };

          walk(root, 'Корневой модуль');
          return nodes;
        };

        const render = () => {
          const nodes = collectAllNodes();

          host.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:16px;">
              <div style="font-size:18px; font-weight:700;">События узлов конструктора</div>
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <button type="button" class="btn btn-white" id="cld-events-refresh">Обновить</button>
                <button type="button" class="btn btn-primary" id="cld-events-apply">Применить изменения</button>
              </div>
            </div>

            <div style="margin-bottom:12px; padding:10px; background:#f0f9ff; border-radius:4px; font-size:12px; color:#1e40af;">
              <strong>События:</strong> JavaScript-код, выполняемый на разных этапах работы с узлом.
              <ul style="margin:6px 0 0 20px; padding:0;">
                <li><code>on_before_params</code> — перед вычислением параметров</li>
                <li><code>on_before_build</code> — перед построением геометрии</li>
                <li><code>on_after_build</code> — после построения геометрии</li>
                <li><code>on_drag_end</code> — после завершения перетаскивания</li>
              </ul>
            </div>

            ${nodes.length ? `
              <div style="overflow:auto; max-height:600px;">
                <table class="table table-bordered table-sm" style="margin:0; min-width:1000px;">
                  <thead style="position:sticky; top:0; background:#fff; z-index:10;">
                    <tr>
                      <td style="width:200px; font-weight:600;">Узел</td>
                      <td style="width:120px; font-weight:600;">Тип</td>
                      <td style="width:200px; font-weight:600;">on_before_params</td>
                      <td style="width:200px; font-weight:600;">on_before_build</td>
                      <td style="width:200px; font-weight:600;">on_after_build</td>
                      <td style="width:200px; font-weight:600;">on_drag_end</td>
                    </tr>
                  </thead>
                  <tbody>
                    ${nodes.map((node, idx) => `
                      <tr data-node-id="${esc(node.nodeId)}" data-node-idx="${idx}">
                        <td>
                          <div style="font-weight:600; font-size:13px;">${esc(node.name)}</div>
                          <div style="font-size:11px; color:#6b7280; margin-top:2px;">${esc(node.path)}</div>
                        </td>
                        <td><code style="font-size:11px;">${esc(node.type)}</code></td>
                        <td>
                          <input
                            type="text"
                            class="form-control form-control-sm cld-event-input"
                            data-event="on_before_params"
                            value="${esc(node.events.on_before_params || '')}"
                            placeholder="код..."
                            style="font-size:11px; font-family:ui-monospace, monospace;"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            class="form-control form-control-sm cld-event-input"
                            data-event="on_before_build"
                            value="${esc(node.events.on_before_build || '')}"
                            placeholder="код..."
                            style="font-size:11px; font-family:ui-monospace, monospace;"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            class="form-control form-control-sm cld-event-input"
                            data-event="on_after_build"
                            value="${esc(node.events.on_after_build || '')}"
                            placeholder="код..."
                            style="font-size:11px; font-family:ui-monospace, monospace;"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            class="form-control form-control-sm cld-event-input"
                            data-event="on_drag_end"
                            value="${esc(node.events.on_drag_end || '')}"
                            placeholder="код..."
                            style="font-size:11px; font-family:ui-monospace, monospace;"
                          />
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : '<div style="padding:40px; text-align:center; color:#6b7280;">Нет узлов в конструкторе. Добавьте элементы во вкладке "Конструктор".</div>'}
          `;

          // Сохраняем изменения при вводе
          host.querySelectorAll('.cld-event-input').forEach(input => {
            input.addEventListener('input', (e) => {
              const tr = e.target?.closest?.('tr[data-node-id]');
              if (!tr) return;
              const nodeId = tr.getAttribute('data-node-id');
              const eventName = e.target?.getAttribute('data-event');
              const value = String(e.target?.value || '').trim();

              // Находим элемент узла
              const nodeEl = nodeId ? document.querySelector(`[data-node-id="${nodeId}"]`) : null;
              if (nodeEl && nodeEl.nodeData && eventName) {
                if (!nodeEl.nodeData.events) nodeEl.nodeData.events = {};
                nodeEl.nodeData.events[eventName] = value;
              }
            });
          });

          // Кнопка "Обновить"
          host.querySelector('#cld-events-refresh')?.addEventListener('click', () => {
            render();
            if (typeof toastr !== 'undefined') toastr.info('Список обновлён');
          });

          // Кнопка "Применить изменения"
          host.querySelector('#cld-events-apply')?.addEventListener('click', () => {
            // Все изменения уже сохранены в nodeData при вводе
            // Обновляем превью
            if (typeof window.__ppPostModuleToIframe === 'function') {
              window.__ppPostModuleToIframe();
            }
            if (typeof toastr !== 'undefined') toastr.success('События применены');
          });
        };

        window.__CLD_EVENTS_RENDER = render;
        render();
      }

      // ===== Вкладка "Параметры" (clean-room) =====
      // Управление параметрами узлов конструктора (флаги поведения)
      function initParamsTab() {
        if (window.__CLD_PARAMS_TAB_INITIALIZED) {
          try { window.__CLD_PARAMS_RENDER && window.__CLD_PARAMS_RENDER(); } catch {}
          return;
        }
        window.__CLD_PARAMS_TAB_INITIALIZED = true;

        const host = document.getElementById('cld-params-container');
        if (!host) return;

        const esc = (s) => String(s ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');

        // Собираем все узлы из дерева конструктора
        const collectAllNodes = () => {
          const nodes = [];
          const root = document.getElementById('constructor-root-module');
          if (!root) return nodes;

          const walk = (el, path = '') => {
            if (!el || !el.nodeData) return;
            const name = el.nodeData.name || el.querySelector('.tree-node-name')?.textContent?.trim() || 'Без названия';
            const type = el.getAttribute('data-node-type') || 'unknown';
            const nodeId = el.getAttribute('data-node-id') || '';
            const currentPath = path ? `${path} > ${name}` : name;

            nodes.push({
              element: el,
              nodeId,
              type,
              name,
              path: currentPath,
              hide_when_filled: el.nodeData.hide_when_filled || false,
              active: el.nodeData.active !== undefined ? el.nodeData.active : true,
              visible: el.nodeData.visible !== undefined ? el.nodeData.visible : true,
              consider_size: el.nodeData.consider_size || false,
              consider_cuts: el.nodeData.consider_cuts || false,
              consider_intersections: el.nodeData.consider_intersections || false,
            });

            const children = el.querySelector('.tree-node-children');
            if (children) {
              const childNodes = children.querySelectorAll('.constructor-tree-node');
              childNodes.forEach(child => walk(child, currentPath));
            }
          };

          walk(root, 'Корневой модуль');
          return nodes;
        };

        const render = () => {
          const nodes = collectAllNodes();

          host.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:16px;">
              <div style="font-size:18px; font-weight:700;">Параметры узлов конструктора</div>
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <button type="button" class="btn btn-white" id="cld-params-refresh">Обновить</button>
                <button type="button" class="btn btn-primary" id="cld-params-apply">Применить изменения</button>
              </div>
            </div>

            <div style="margin-bottom:12px; padding:10px; background:#f0f9ff; border-radius:4px; font-size:12px; color:#1e40af;">
              <strong>Параметры поведения узлов:</strong>
              <ul style="margin:6px 0 0 20px; padding:0;">
                <li><code>active</code> — узел активен (участвует в построении)</li>
                <li><code>visible</code> — узел видим в 3D</li>
                <li><code>hide_when_filled</code> — скрывать при заполнении</li>
                <li><code>consider_size</code> — учитывать размер при расчётах</li>
                <li><code>consider_cuts</code> — учитывать разрезы</li>
                <li><code>consider_intersections</code> — учитывать пересечения</li>
              </ul>
            </div>

            ${nodes.length ? `
              <div style="overflow:auto; max-height:600px;">
                <table class="table table-bordered table-sm" style="margin:0; min-width:900px;">
                  <thead style="position:sticky; top:0; background:#fff; z-index:10;">
                    <tr>
                      <td style="width:200px; font-weight:600;">Узел</td>
                      <td style="width:100px; font-weight:600;">Тип</td>
                      <td style="width:100px; font-weight:600; text-align:center;">active</td>
                      <td style="width:100px; font-weight:600; text-align:center;">visible</td>
                      <td style="width:120px; font-weight:600; text-align:center;">hide_when_filled</td>
                      <td style="width:120px; font-weight:600; text-align:center;">consider_size</td>
                      <td style="width:120px; font-weight:600; text-align:center;">consider_cuts</td>
                      <td style="width:140px; font-weight:600; text-align:center;">consider_intersections</td>
                    </tr>
                  </thead>
                  <tbody>
                    ${nodes.map((node, idx) => `
                      <tr data-node-id="${esc(node.nodeId)}" data-node-idx="${idx}">
                        <td>
                          <div style="font-weight:600; font-size:13px;">${esc(node.name)}</div>
                          <div style="font-size:11px; color:#6b7280; margin-top:2px;">${esc(node.path)}</div>
                        </td>
                        <td><code style="font-size:11px;">${esc(node.type)}</code></td>
                        <td style="text-align:center;">
                          <input
                            type="checkbox"
                            class="cld-param-checkbox"
                            data-param="active"
                            ${node.active ? 'checked' : ''}
                          />
                        </td>
                        <td style="text-align:center;">
                          <input
                            type="checkbox"
                            class="cld-param-checkbox"
                            data-param="visible"
                            ${node.visible ? 'checked' : ''}
                          />
                        </td>
                        <td style="text-align:center;">
                          <input
                            type="checkbox"
                            class="cld-param-checkbox"
                            data-param="hide_when_filled"
                            ${node.hide_when_filled ? 'checked' : ''}
                          />
                        </td>
                        <td style="text-align:center;">
                          <input
                            type="checkbox"
                            class="cld-param-checkbox"
                            data-param="consider_size"
                            ${node.consider_size ? 'checked' : ''}
                          />
                        </td>
                        <td style="text-align:center;">
                          <input
                            type="checkbox"
                            class="cld-param-checkbox"
                            data-param="consider_cuts"
                            ${node.consider_cuts ? 'checked' : ''}
                          />
                        </td>
                        <td style="text-align:center;">
                          <input
                            type="checkbox"
                            class="cld-param-checkbox"
                            data-param="consider_intersections"
                            ${node.consider_intersections ? 'checked' : ''}
                          />
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : '<div style="padding:40px; text-align:center; color:#6b7280;">Нет узлов в конструкторе. Добавьте элементы во вкладке "Конструктор".</div>'}
          `;

          // Сохраняем изменения при изменении чекбоксов
          host.querySelectorAll('.cld-param-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
              const tr = e.target?.closest?.('tr[data-node-id]');
              if (!tr) return;
              const nodeId = tr.getAttribute('data-node-id');
              const paramName = e.target?.getAttribute('data-param');
              const value = e.target?.checked;

              // Находим элемент узла
              const nodeEl = nodeId ? document.querySelector(`[data-node-id="${nodeId}"]`) : null;
              if (nodeEl && nodeEl.nodeData && paramName) {
                nodeEl.nodeData[paramName] = value;
              }
            });
          });

          // Кнопка "Обновить"
          host.querySelector('#cld-params-refresh')?.addEventListener('click', () => {
            render();
            if (typeof toastr !== 'undefined') toastr.info('Список обновлён');
          });

          // Кнопка "Применить изменения"
          host.querySelector('#cld-params-apply')?.addEventListener('click', () => {
            // Все изменения уже сохранены в nodeData при изменении чекбоксов
            // Обновляем превью
            if (typeof window.__ppPostModuleToIframe === 'function') {
              window.__ppPostModuleToIframe();
            }
            if (typeof toastr !== 'undefined') toastr.success('Параметры применены');
          });
        };

        window.__CLD_PARAMS_RENDER = render;
        render();
      }

      function initVariablesTab() {
        if (window.__CLD_VARS_TAB_INITIALIZED) {
          // при каждом открытии вкладки в референсе выбран root ("Переменные") -> справа пусто
          try { window.__CLD_VARS_SELECT_ROOT && window.__CLD_VARS_SELECT_ROOT(); } catch {}
          return;
        }
        window.__CLD_VARS_TAB_INITIALIZED = true;

        const groupsHost = document.getElementById('cld-vars-groups');
        const btnApply = document.getElementById('cld-vars-apply-btn');
        const btnReset = document.getElementById('cld-vars-reset-btn');
        const menuBtn = document.getElementById('cld-vars-tree-menu-btn');
        const menu = document.getElementById('cld-vars-context-menu');
        const mAddGroup = document.getElementById('cld-vars-menu-add-group');
        const mAddVar = document.getElementById('cld-vars-menu-add-var');
        const mAddGlobal = document.getElementById('cld-vars-menu-add-global');
        const mEnableAll = document.getElementById('cld-vars-menu-enable-all');
        const mDisableAll = document.getElementById('cld-vars-menu-disable-all');
        const mImport = document.getElementById('cld-vars-menu-import');
        const mCopy = document.getElementById('cld-vars-menu-copy');
        const mPaste = document.getElementById('cld-vars-menu-paste');
        const mDelete = document.getElementById('cld-vars-menu-delete');
        const treeRootItem = document.getElementById('cld-vars-tree-item');
        const treeGroupsHost = document.getElementById('cld-vars-tree-groups');
        const treeToggle = document.getElementById('cld-vars-tree-toggle');

        if (!groupsHost || !btnApply || !btnReset || !menuBtn || !menu) return;

        const getRootNodeData = () => {
          const root = document.getElementById('constructor-root-module');
          if (!root) return null;
          if (!root.nodeData) root.nodeData = { name: '(модуль без названия)' };
          if (!root.nodeData.variables) root.nodeData.variables = {};
          // миграция старого формата main{} -> groups[]
          if (!Array.isArray(root.nodeData.variables.groups)) {
            const legacyMain = (root.nodeData.variables.main && typeof root.nodeData.variables.main === 'object')
              ? root.nodeData.variables.main
              : null;
            root.nodeData.variables.groups = [
              {
                id: 'grp_' + Date.now().toString(36),
                name: 'Основные',
                enabled: true,
                vars: [],
                collapsed: false,
              }
            ];
            if (legacyMain) {
              for (const [k, v] of Object.entries(legacyMain)) {
                const key = String(k || '').trim();
                const n = Number(v);
                if (!key || !Number.isFinite(n)) continue;
                root.nodeData.variables.groups[0].vars.push({
                  id: 'var_' + Math.random().toString(36).slice(2),
                  key,
                  value: n,
                  enabled: true,
                  scope: 'module',
                });
              }
            }
            delete root.nodeData.variables.main;
          }
          // по умолчанию выбран корень (как в референсе)
          if (!root.nodeData.variables._selectedNodeType) root.nodeData.variables._selectedNodeType = 'root';
          if (root.nodeData.variables._treeGroupsCollapsed == null) root.nodeData.variables._treeGroupsCollapsed = false;
          return root.nodeData;
        };

        const RESERVED = new Set(['_wt']); // _wt считаем системным (идёт из материалов g0)
        const CLIP_KEY = 'cld_vars_clipboard_v1';

        const readUiThickness = () => {
          const el = document.getElementById('catalog-constructor-property-material-thickness');
          const n = Number(el?.value);
          return Number.isFinite(n) ? n : 16;
        };

        const escapeHtml = (s) => String(s ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');

        const getSelectedGroupId = () => {
          const nd = getRootNodeData();
          const groups = nd?.variables?.groups || [];
          return nd?.variables?._selectedGroupId || groups?.[0]?.id || null;
        };

        const setSelectedGroupId = (id) => {
          const nd = getRootNodeData();
          if (!nd) return;
          nd.variables._selectedGroupId = id;
        };

        const setSelectedNodeType = (t) => {
          const nd = getRootNodeData();
          if (!nd) return;
          nd.variables._selectedNodeType = t; // 'root' | 'group'
        };

        const buildFlatEnabledMain = () => {
          const nd = getRootNodeData();
          const out = {};
          for (const g of (nd?.variables?.groups || [])) {
            if (!g || g.enabled === false) continue;
            for (const v of (g.vars || [])) {
              if (!v || v.enabled === false) continue;
              const key = String(v.key || '').trim();
              if (!key || RESERVED.has(key)) continue;
              const cur = Number(v.value);
              const def = Number(v.default);
              const n = Number.isFinite(cur) ? cur : (Number.isFinite(def) ? def : undefined);
              if (!Number.isFinite(n)) continue;
              out[key] = n;
            }
          }
          return out;
        };

        const render = () => {
          const nd = getRootNodeData();
          const groups = Array.isArray(nd?.variables?.groups) ? nd.variables.groups : [];
          const selectedGroupId = getSelectedGroupId();
          if (!selectedGroupId && groups[0]) setSelectedGroupId(groups[0].id);

          const wt = readUiThickness();

          const renderValueControl = (v) => {
            const type = v.type || 'number';
            const disabled = (v.fixed === 1 || v.fixed === true);

            if (type === 'select') {
              const options = Array.isArray(v.params?.options) ? v.params.options : [];
              const cur = String(v.value ?? '');
              return `
                <select class="p_input form-control form-control-sm cld-var-control cld-var-val" data-vtype="select" ${disabled ? 'disabled' : ''}>
                  ${options.map((o) => `<option value="${escapeHtml(o?.value ?? '')}" ${String(o?.value ?? '') === cur ? 'selected' : ''}>${escapeHtml(o?.name ?? o?.value ?? '')}</option>`).join('')}
                </select>
              `;
            } else if (type === 'boolean') {
              const cur = String(v.value ?? '1');
              return `
                <select class="p_input form-control form-control-sm cld-var-control cld-var-val" data-vtype="boolean" ${disabled ? 'disabled' : ''}>
                  <option value="1" ${cur === '1' ? 'selected' : ''}>Да</option>
                  <option value="0" ${cur === '0' ? 'selected' : ''}>Нет</option>
                </select>
              `;
            } else {
              const step = v.params?.step ?? 1;
              const min = v.params?.min ?? 1;
              const max = v.params?.max ?? '';
              const cur = (v.value ?? v.default ?? 1);
              return `
                <input type="number" step="${escapeHtml(step)}" min="${escapeHtml(min)}" ${max !== '' ? `max="${escapeHtml(max)}"` : ''} value="${escapeHtml(cur)}"
                  class="p_input form-control form-control-sm cld-var-control cld-var-val" data-vtype="number" ${disabled ? 'disabled' : ''} />
              `;
            }
          };

          // В референсе справа редактируется выбранная группа (даже если она пустая).
          // Это НЕ "панель параметров": показываем переменные группы (а не только editable/show_in_params).
          const renderGroupEditor = (g) => {
            if (!g) return '';
            const vars = Array.isArray(g?.vars) ? g.vars : [];
            const rows = vars.map((v) => {
              const type = v.type || 'number';
              const name = String(v.name || v.key || 'Переменная');
              const key = String(v.key || '');
              const isGlobal = (v.local === 0 || v.local === false || v.scope === 'global');
              return `
                <div class="p_input_group flex_row flex_vcenter"
                     data-group-id="${escapeHtml(g.id)}"
                     data-var-id="${escapeHtml(v.id)}"
                     style="border-bottom:1px solid #eef2f7;">
                  <div class="w50" style="display:flex; align-items:center; gap:8px; min-width:0;">
                    <input type="checkbox" class="cld-var-enabled" ${v.enabled === false ? '' : 'checked'} />
                    <div style="min-width:0;">
                      <div style="font-size:13px; color:#111; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                        ${escapeHtml(name)}
                        ${isGlobal ? `<span style="font-size:11px; color:#6b7280; border:1px solid #e5e7eb; border-radius:999px; padding:1px 6px; margin-left:6px;">global</span>` : ''}
                      </div>
                      <div style="font-size:11px; color:#6b7280;"><code>${escapeHtml(key)}</code></div>
                    </div>
                  </div>
                  <div class="w50" style="display:flex; align-items:center; gap:8px;">
                    <div style="flex:1; min-width:0;">${renderValueControl({ ...v, type })}</div>
                    <button type="button" class="btn btn-sm btn-white" data-action="edit-var" title="Редактировать">✎</button>
                    <button type="button" class="btn btn-sm btn-white" data-action="del-var" title="Удалить">×</button>
                  </div>
                </div>
              `;
            }).join('');

            const emptyHint = vars.length
              ? ''
              : `<div style="padding:16px; color:#6b7280; font-size:13px;">Пока нет переменных.</div>`;

            return `
              <div data-group-id="${escapeHtml(g.id)}" style="background:#fff;">
                <div class="p_input_group flex_row flex_vcenter" style="padding:10px 12px; border-bottom:1px solid #e5e7eb;">
                  <div class="w50" style="font-size:13px; color:#111; font-weight:600;">Название</div>
                  <div class="w50">
                    <input type="text" class="form-control form-control-sm cld-group-name" value="${escapeHtml(g.name || 'Группа')}" />
                  </div>
                </div>
                <div style="padding:0;">
                  ${emptyHint}
                  ${rows}
                </div>
              </div>
            `;
          };

          const selected = (nd?.variables?._selectedNodeType || 'root');
          const right = document.getElementById('cld-vars-right');
          const help = document.getElementById('cld-vars-help');
          const buttons = document.getElementById('cld-vars-buttons');

          // Рендер левого дерева групп (чтобы было видно, что "Добавить группу" сработало)
          if (treeGroupsHost) {
            const curType = (nd?.variables?._selectedNodeType || 'root');
            const curGid = getSelectedGroupId();
            const collapsed = !!(nd?.variables?._treeGroupsCollapsed);
            treeGroupsHost.innerHTML = groups.map((g) => {
              const isSel = curType === 'group' && String(curGid) === String(g?.id);
              return `
                <div class="pp-tree-item ${isSel ? 'pp-tree-selected' : ''}"
                     data-vars-node="group"
                     data-group-id="${escapeHtml(g.id)}"
                     style="display:flex; align-items:center; padding-left:28px; cursor:pointer;">
                  <span style="margin-left:0px;"></span>
                  <span style="margin-left:8px; font-size:13px; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(g.name || 'Группа')}</span>
                  <div class="pp-tree-buttons" style="margin-left:auto;">
                    <button type="button" class="cld-vars-group-menu-btn" data-group-id="${escapeHtml(g.id)}"><i class="icon icon_menu"></i></button>
                  </div>
                </div>
              `;
            }).join('');
            treeGroupsHost.style.display = collapsed ? 'none' : 'block';
            const tgl = document.getElementById('cld-vars-tree-toggle');
            if (tgl) tgl.textContent = collapsed ? '▸' : '▾';
          }

          if (right) right.style.display = 'block';
          if (help) help.style.display = 'none';
          if (buttons) buttons.style.display = 'none';
          if (!groupsHost) return;

          if (selected === 'group') {
            const gid = getSelectedGroupId();
            const g = (groups || []).find((x) => x && String(x.id) === String(gid)) || (groups || [])[0] || null;
            groupsHost.style.display = 'block';
            groupsHost.innerHTML = renderGroupEditor(g);
            return;
          }

          // root -> правая панель пустая
          groupsHost.style.display = 'none';
          groupsHost.innerHTML = '';
        };

        const apply = () => {
          const nd = getRootNodeData();
          if (!nd) return;
          // Собираем flat main для экспорта/движка
          nd.variables.main = buildFlatEnabledMain();
          if (window.__CLD_DEBUG) console.log('[CLD][vars] apply', { groups: nd.variables.groups, main: nd.variables.main });
          if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
          if (typeof toastr !== 'undefined') toastr.success('Переменные применены');
        };

        const reset = () => {
          const nd = getRootNodeData();
          if (!nd) return;
          nd.variables = {
            groups: [{
              id: 'grp_' + Date.now().toString(36),
              name: 'Основные',
              enabled: true,
              vars: [],
              collapsed: false,
            }],
            main: {},
          };
          render();
          if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
          if (typeof toastr !== 'undefined') toastr.info('Переменные сброшены');
        };

        const hasClipboard = () => {
          try { return !!localStorage.getItem(CLIP_KEY); } catch { return false; }
        };

        const setPasteEnabled = () => {
          if (!mPaste) return;
          const ok = hasClipboard();
          if (ok) {
            mPaste.classList.remove('disabled');
            mPaste.style.cursor = 'pointer';
            mPaste.style.opacity = '1';
          } else {
            mPaste.classList.add('disabled');
            mPaste.style.cursor = 'not-allowed';
            mPaste.style.opacity = '.5';
          }
        };

        const closeMenu = () => { menu.style.display = 'none'; };
        const openMenuAt = (x, y) => {
          setPasteEnabled();
          // delete доступно только для группы (как в референсе: меню группы)
          if (mDelete) {
            const nd = getRootNodeData();
            const t = (nd?.variables?._selectedNodeType || 'root');
            mDelete.style.display = (t === 'group') ? 'block' : 'none';
          }
          menu.style.left = `${x}px`;
          menu.style.top = `${y}px`;
          menu.style.display = 'block';
        };

        menuBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const r = menuBtn.getBoundingClientRect();
          openMenuAt(Math.round(r.left), Math.round(r.bottom + 6));
        });
        document.addEventListener('click', () => closeMenu());
        menu.addEventListener('click', (e) => e.stopPropagation());

        // root expand/collapse (как в референсе)
        treeToggle && treeToggle.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const nd = getRootNodeData();
          if (!nd) return;
          nd.variables._treeGroupsCollapsed = !nd.variables._treeGroupsCollapsed;
          render();
        });

        const addGroup = (name = 'Группа') => {
          const nd = getRootNodeData();
          if (!nd) return;
          const g = {
            id: 'grp_' + Math.random().toString(36).slice(2),
            name,
            enabled: true,
            vars: [],
            collapsed: false,
          };
          nd.variables.groups.push(g);
          setSelectedGroupId(g.id);
          setSelectedNodeType('group');
          render();
        };

        const addVarToGroup = (groupId, opts = {}) => {
          const nd = getRootNodeData();
          const g = (nd?.variables?.groups || []).find((x) => x && x.id === groupId) || (nd?.variables?.groups || [])[0];
          if (!g) return;
          g.vars = Array.isArray(g.vars) ? g.vars : [];
          g.vars.push({
            id: 'var_' + Math.random().toString(36).slice(2),
            key: opts.key || '',
            value: Number.isFinite(Number(opts.value)) ? Number(opts.value) : 0,
            enabled: opts.enabled !== false,
            scope: opts.scope || 'module',
          });
          render();
        };

        const setAllEnabled = (on) => {
          const nd = getRootNodeData();
          for (const g of (nd?.variables?.groups || [])) {
            g.enabled = !!on;
            for (const v of (g.vars || [])) v.enabled = !!on;
          }
          render();
        };

        const copyToClipboard = () => {
          const nd = getRootNodeData();
          const payload = { groups: nd?.variables?.groups || [] };
          try {
            localStorage.setItem(CLIP_KEY, JSON.stringify(payload));
            if (typeof toastr !== 'undefined') toastr.success('Скопировано');
          } catch {
            if (typeof toastr !== 'undefined') toastr.error('Не удалось скопировать');
          }
        };

        const pasteFromClipboard = () => {
          const nd = getRootNodeData();
          try {
            const raw = localStorage.getItem(CLIP_KEY);
            if (!raw) {
              if (typeof toastr !== 'undefined') toastr.warning('Буфер пуст');
              return;
            }
            const parsed = JSON.parse(raw);
            const groups = Array.isArray(parsed?.groups) ? parsed.groups : [];
            nd.variables.groups = groups.map((g) => ({
              id: g.id || ('grp_' + Math.random().toString(36).slice(2)),
              name: g.name || 'Группа',
              enabled: g.enabled !== false,
              collapsed: !!g.collapsed,
              vars: Array.isArray(g.vars) ? g.vars.map((v) => ({
                id: v.id || ('var_' + Math.random().toString(36).slice(2)),
                key: String(v.key || '').trim(),
                value: Number(v.value),
                enabled: v.enabled !== false,
                scope: v.scope || 'module',
              })) : [],
            }));
            setSelectedGroupId(nd.variables.groups?.[0]?.id || null);
            render();
            if (typeof toastr !== 'undefined') toastr.success('Вставлено');
          } catch {
            if (typeof toastr !== 'undefined') toastr.error('Не удалось вставить');
          }
        };

        // Правая панель: изменение value как в референсе (number с debounce + clamp min/max)
        let __cldVarDebounce = null;
        const VAR_INPUT_DELAY = 500;
        const scheduleSync = () => {
          clearTimeout(__cldVarDebounce);
          __cldVarDebounce = setTimeout(() => {
            const nd = getRootNodeData();
            if (!nd) return;
            nd.variables.main = buildFlatEnabledMain();
            if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
          }, VAR_INPUT_DELAY);
        };

        groupsHost.addEventListener('input', (e) => {
          // rename group in right panel
          const gName = e.target?.closest?.('.cld-group-name');
          if (gName) {
            const groupEl = gName.closest?.('[data-group-id]');
            const gid = groupEl?.getAttribute?.('data-group-id');
            if (!gid) return;
            const nd = getRootNodeData();
            const g = (nd?.variables?.groups || []).find((x) => x && String(x.id) === String(gid));
            if (!g) return;
            g.name = String(gName.value || '').trim() || 'Группа';
            // update label in left tree without full render (keep focus)
            try {
              const node = treeGroupsHost?.querySelector?.(`[data-vars-node="group"][data-group-id="${CSS.escape(String(gid))}"]`);
              const span = node?.querySelector?.('span[style*="font-size:13px"]') || node?.querySelector?.('span:last-child');
              if (span) span.textContent = g.name;
            } catch {}
            return;
          }

          // toggle enabled
          const en = e.target?.closest?.('.cld-var-enabled');
          if (en) {
            const row = en.closest('[data-var-id]');
            const gid = row?.getAttribute('data-group-id');
            const vid = row?.getAttribute('data-var-id');
            if (!gid || !vid) return;
            const nd = getRootNodeData();
            const g = (nd?.variables?.groups || []).find((x) => x && String(x.id) === String(gid));
            const v = g?.vars?.find((x) => x && String(x.id) === String(vid));
            if (!v) return;
            v.enabled = !!en.checked;
            scheduleSync();
            return;
          }

          // number input
          const ctrl = e.target?.closest?.('.cld-var-control');
          if (!ctrl) return;
          const row = ctrl.closest('[data-var-id]');
          const gid = row?.getAttribute('data-group-id');
          const vid = row?.getAttribute('data-var-id');
          if (!gid || !vid) return;
          const nd = getRootNodeData();
          const g = (nd?.variables?.groups || []).find((x) => x && String(x.id) === String(gid));
          const v = g?.vars?.find((x) => x && String(x.id) === String(vid));
          if (!v) return;

          const vtype = ctrl.getAttribute('data-vtype') || v.type || 'number';
          if (vtype === 'number') {
            const min = parseFloat(v.params?.min ?? 1);
            const maxRaw = v.params?.max ?? '';
            const max = maxRaw === '' ? null : parseFloat(maxRaw);
            let val = parseFloat(ctrl.value);
            if (!Number.isFinite(val)) return;
            if (Number.isFinite(min) && val < min) val = min;
            if (Number.isFinite(max) && max != null && val > max) val = max;
            v.value = val;
            ctrl.value = String(val);
            scheduleSync();
          }
        });

        groupsHost.addEventListener('change', (e) => {
          // toggle enabled
          const en = e.target?.closest?.('.cld-var-enabled');
          if (en) {
            const row = en.closest('[data-var-id]');
            const gid = row?.getAttribute('data-group-id');
            const vid = row?.getAttribute('data-var-id');
            if (!gid || !vid) return;
            const nd = getRootNodeData();
            const g = (nd?.variables?.groups || []).find((x) => x && String(x.id) === String(gid));
            const v = g?.vars?.find((x) => x && String(x.id) === String(vid));
            if (!v) return;
            v.enabled = !!en.checked;
            nd.variables.main = buildFlatEnabledMain();
            if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
            return;
          }

          const ctrl = e.target?.closest?.('.cld-var-control');
          if (!ctrl) return;
          const row = ctrl.closest('[data-var-id]');
          const gid = row?.getAttribute('data-group-id');
          const vid = row?.getAttribute('data-var-id');
          if (!gid || !vid) return;
          const nd = getRootNodeData();
          const g = (nd?.variables?.groups || []).find((x) => x && String(x.id) === String(gid));
          const v = g?.vars?.find((x) => x && String(x.id) === String(vid));
          if (!v) return;

          const vtype = ctrl.getAttribute('data-vtype') || v.type || 'number';
          if (vtype === 'select') {
            v.value = String(ctrl.value ?? '');
            nd.variables.main = buildFlatEnabledMain();
            if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
          } else if (vtype === 'boolean') {
            v.value = Number(String(ctrl.value ?? '1')) ? 1 : 0;
            nd.variables.main = buildFlatEnabledMain();
            if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
          }
        });

        // ===== Модалка переменной (1:1) =====
        // ===== Модалка группы (как в референсе: "Добавить группу") =====
        const groupModal = document.getElementById('cld-var-group-modal');
        const groupName = document.getElementById('cld-var-group-name');
        const groupCancel = document.getElementById('cld-var-group-cancel');
        const groupSave = document.getElementById('cld-var-group-save');
        const groupClose = document.getElementById('cld-var-group-close');

        const openGroupModal = () => {
          if (!groupModal) return;
          if (groupName) groupName.value = 'Группа';
          groupModal.style.display = 'flex';
          setTimeout(() => { try { groupName?.focus?.(); groupName?.select?.(); } catch {} }, 0);
        };
        const closeGroupModal = () => {
          if (!groupModal) return;
          groupModal.style.display = 'none';
        };
        const saveGroupFromModal = () => {
          const name = String(groupName?.value || '').trim() || 'Группа';
          addGroup(name);
          closeGroupModal();
          apply();
        };

        groupCancel && groupCancel.addEventListener('click', closeGroupModal);
        groupClose && groupClose.addEventListener('click', closeGroupModal);
        groupSave && groupSave.addEventListener('click', saveGroupFromModal);
        groupModal && groupModal.addEventListener('click', (e) => { if (e.target === groupModal) closeGroupModal(); });
        groupName && groupName.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); saveGroupFromModal(); }
          if (e.key === 'Escape') { e.preventDefault(); closeGroupModal(); }
        });

        const varModal = document.getElementById('cld-variable-modal');
        const varMode = document.getElementById('cld-variable-modal-mode');
        const varGroupId = document.getElementById('cld-variable-modal-group-id');
        const varVarId = document.getElementById('cld-variable-modal-var-id');
        const fName = document.getElementById('cld-variable-name');
        const fKey = document.getElementById('cld-variable-key');
        const fShow = document.getElementById('cld-variable-show-in-params');
        const fLocal = document.getElementById('cld-variable-local');
        const fInSizes = document.getElementById('cld-variable-in-size-variants');
        const fLocked = document.getElementById('cld-variable-locked');
        const fType = document.getElementById('cld-variable-type');
        const fDef = document.getElementById('cld-variable-default');
        const fMin = document.getElementById('cld-variable-min');
        const fMax = document.getElementById('cld-variable-max');
        const fStep = document.getElementById('cld-variable-step');
        const fDefSelect = document.getElementById('cld-variable-default-select');
        const fDefBool = document.getElementById('cld-variable-default-boolean');
        const optHost = document.getElementById('cld-variable-options');
        const optAdd = document.getElementById('cld-variable-option-add');
        const typeNumber = document.getElementById('cld-variable-type-number');
        const typeSelect = document.getElementById('cld-variable-type-select');
        const typeBoolean = document.getElementById('cld-variable-type-boolean');
        const btnCancel = document.getElementById('cld-variable-cancel-btn');
        const btnSave = document.getElementById('cld-variable-save-btn');
        const closeX = document.getElementById('cld-variable-close');

        const VAR_PARAMS = {
          number: { min: 1, max: '', step: 1 },
          select: { options: [] },
          boolean: {},
        };

        const translitRu = (s) => {
          const map = {
            а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'
          };
          return String(s || '').toLowerCase().split('').map(ch => map[ch] ?? map[ch?.toLowerCase?.()] ?? ch).join('');
        };

        const filterKey = (s) => String(s || '')
          .trim()
          .replace(/\s+/g, '_')
          .replace(/[^a-zA-Z0-9_]/g, '_')
          .replace(/_+/g, '_');

        const setTypeUi = (t) => {
          const type = (t === 'select' || t === 'boolean') ? t : 'number';
          if (typeNumber) typeNumber.style.display = (type === 'number') ? 'block' : 'none';
          if (typeSelect) typeSelect.style.display = (type === 'select') ? 'block' : 'none';
          if (typeBoolean) typeBoolean.style.display = (type === 'boolean') ? 'block' : 'none';
        };

        const renderOptions = (options) => {
          if (!optHost) return;
          const opts = Array.isArray(options) ? options : [];
          optHost.innerHTML = '';
          if (!opts.length) {
            optHost.innerHTML = `<div style="color:#6b7280; font-size:12px;">Нет опций</div>`;
            return;
          }
          opts.forEach((o, idx) => {
            const row = document.createElement('div');
            row.className = 'p_input_group flex_row flex_vcenter';
            row.style.borderBottom = 'none';
            row.innerHTML = `
              <div class="w50" style="display:flex; gap:8px;">
                <input type="text" class="p_input form-control cld-opt-name" placeholder="Название" value="${escapeHtml(o?.name ?? '')}" />
              </div>
              <div class="w50" style="display:flex; gap:8px;">
                <input type="text" class="p_input form-control cld-opt-val" placeholder="Значение" value="${escapeHtml(o?.value ?? '')}" />
                <button type="button" class="btn btn-sm btn-white cld-opt-del" data-idx="${idx}">×</button>
              </div>
            `;
            optHost.appendChild(row);
          });
        };

        const readOptions = () => {
          if (!optHost) return [];
          const rows = Array.from(optHost.querySelectorAll('.p_input_group'));
          return rows.map((row) => {
            const name = row.querySelector('.cld-opt-name')?.value ?? '';
            const value = row.querySelector('.cld-opt-val')?.value ?? '';
            return { name: String(name), value: String(value) };
          }).filter((o) => String(o.name || '').trim() || String(o.value || '').trim());
        };

        const openVarModal = ({ mode, groupId, scope, varId } = {}) => {
          const nd = getRootNodeData();
          if (!nd || !varModal) return;
          const gid = groupId || getSelectedGroupId();

          varMode.value = mode || 'add';
          varGroupId.value = gid || '';
          varVarId.value = varId || '';

          // defaults like reference (hide_var_add)
          fName.value = '';
          fKey.value = '';
          fShow.checked = false;     // editable
          fLocal.checked = true;     // local=1
          fInSizes.checked = false;  // variants
          fLocked.checked = false;   // fixed
          fType.value = 'number';
          fDef.value = '1';
          fMin.value = '1';
          fMax.value = '';
          fStep.value = '1';
          if (fDefSelect) fDefSelect.value = '';
          if (fDefBool) fDefBool.value = '1';
          renderOptions([]);
          setTypeUi('number');

          if (varMode.value === 'edit' && varId) {
            const g = (nd.variables.groups || []).find((x) => x && x.id === gid);
            const v = g?.vars?.find((x) => x && String(x.id) === String(varId));
            if (v) {
              fName.value = v.name || '';
              fKey.value = v.key || '';
              fShow.checked = !!(v.editable ?? v.show_in_params);
              fLocal.checked = (v.local === 1 || v.local === true) ? true : (v.scope !== 'global');
              fInSizes.checked = !!(v.variants ?? v.in_size_variants);
              fLocked.checked = !!(v.fixed ?? v.locked);
              fType.value = v.type || 'number';
              const params = v.params || {};
              if (fType.value === 'number') {
                fDef.value = (v.value ?? v.default ?? 1);
                fMin.value = (params.min ?? v.min ?? 1);
                fMax.value = (params.max ?? v.max ?? '');
                fStep.value = (params.step ?? v.step ?? 1);
              } else if (fType.value === 'select') {
                if (fDefSelect) fDefSelect.value = (v.value ?? '');
                renderOptions(params.options || []);
              } else if (fType.value === 'boolean') {
                if (fDefBool) fDefBool.value = String(v.value ?? 1);
              }
              setTypeUi(fType.value);
            }
            btnSave.textContent = 'Сохранить';
          } else {
            // scope: global -> local=0
            fLocal.checked = (scope !== 'global');
            btnSave.textContent = 'Добавить';
          }

          varModal.style.display = 'flex';
          setTimeout(() => fName?.focus(), 0);
        };

        const closeVarModal = () => {
          if (varModal) varModal.style.display = 'none';
        };
        window.closeCldVariableModal = closeVarModal;

        const saveVarFromModal = () => {
          const nd = getRootNodeData();
          if (!nd) return;
          const gid = String(varGroupId.value || '').trim();
          const g = (nd.variables.groups || []).find((x) => x && x.id === gid) || (nd.variables.groups || [])[0];
          if (!g) return;

          const name = String(fName.value || '').trim();
          const key = String(fKey.value || '').trim();
          if (!name) { alert('Введите "Название"'); return; }
          if (!key) { alert('Введите "Ключ"'); return; }
          if (RESERVED.has(key)) { alert('Этот ключ зарезервирован системой'); return; }

          // уникальность key в пределах модуля
          const all = (nd.variables.groups || []).flatMap((gg) => (gg?.vars || []));
          const same = all.find((vv) => vv && String(vv.key) === key && String(vv.id) !== String(varVarId.value || ''));
          if (same) { alert('Переменная с таким ключом уже существует'); return; }

          const type = (fType.value === 'select' || fType.value === 'boolean') ? fType.value : 'number';
          const params = JSON.parse(JSON.stringify(VAR_PARAMS[type] || {}));
          if (type === 'number') {
            params.min = (fMin.value === '' ? 1 : Number(fMin.value));
            params.max = (fMax.value === '' ? '' : Number(fMax.value));
            params.step = (fStep.value === '' ? 1 : Number(fStep.value));
          }
          if (type === 'select') {
            params.options = readOptions();
          }

          const vObj = {
            id: (varMode.value === 'edit' && varVarId.value) ? String(varVarId.value) : ('var_' + Math.random().toString(36).slice(2)),
            name,
            key,
            enabled: true,
            // референсные флаги/поля
            editable: fShow.checked ? 1 : 0,
            local: fLocal.checked ? 1 : 0,
            fixed: fLocked.checked ? 1 : 0,
            variants: fInSizes.checked ? 1 : 0,
            type,
            params,
          };

          // value по умолчанию (как в референсе: variable.value)
          if (type === 'number') vObj.value = Number(fDef.value);
          if (type === 'select') vObj.value = String(fDefSelect?.value ?? '');
          if (type === 'boolean') vObj.value = Number(fDefBool?.value ?? 1);

          g.vars = Array.isArray(g.vars) ? g.vars : [];
          if (varMode.value === 'edit') {
            const idx = g.vars.findIndex((x) => x && String(x.id) === String(vObj.id));
            if (idx >= 0) {
              // preserve enabled/value if already существовали
              const prev = g.vars[idx] || {};
              vObj.enabled = prev.enabled !== false;
              vObj.value = (prev.value !== undefined && prev.value !== null) ? prev.value : vObj.value;
              g.vars[idx] = { ...prev, ...vObj };
            } else {
              g.vars.push(vObj);
            }
          } else {
            g.vars.push(vObj);
          }

          closeVarModal();
          render();
          // сразу применяем как в референсе (после "Добавить" переменная активна)
          apply();
        };

        btnCancel && btnCancel.addEventListener('click', closeVarModal);
        btnSave && btnSave.addEventListener('click', saveVarFromModal);
        closeX && closeX.addEventListener('click', closeVarModal);
        varModal && varModal.addEventListener('click', (e) => {
          if (e.target === varModal) closeVarModal();
        });

        fType && fType.addEventListener('change', () => {
          setTypeUi(fType.value);
          if (fType.value === 'select') renderOptions(readOptions());
        });
        // автогенерация key из name (как var_change_name)
        fName && fName.addEventListener('input', () => {
          const cur = String(fKey?.value || '').trim();
          if (cur) return;
          const auto = filterKey(translitRu(fName.value)).toLowerCase().replaceAll(' ', '_');
          if (fKey) fKey.value = auto;
        });
        optAdd && optAdd.addEventListener('click', () => {
          const opts = readOptions();
          opts.push({ name: '', value: '' });
          renderOptions(opts);
        });
        optHost && optHost.addEventListener('click', (e) => {
          const btn = e.target?.closest?.('.cld-opt-del');
          if (!btn) return;
          const idx = Number(btn.getAttribute('data-idx'));
          const opts = readOptions();
          if (Number.isFinite(idx)) opts.splice(idx, 1);
          renderOptions(opts);
        });

        // dblclick по строке переменной -> редактировать
        groupsHost.addEventListener('dblclick', (e) => {
          const row = e.target?.closest?.('[data-var-id]');
          const groupEl = e.target?.closest?.('[data-group-id]');
          if (!row || !groupEl) return;
          const gid = groupEl.getAttribute('data-group-id');
          const vid = row.getAttribute('data-var-id');
          if (!gid || !vid) return;
          openVarModal({ mode: 'edit', groupId: gid, varId: vid });
        });

        // click actions: select group / add var / delete / collapse
        groupsHost.addEventListener('click', (e) => {
          const btn = e.target?.closest?.('[data-action]');
          if (!btn) return;
          const action = btn.getAttribute('data-action');
          const groupEl = btn.closest?.('[data-group-id]');
          const gid = groupEl?.getAttribute?.('data-group-id');
          if (!gid) return;

          const nd = getRootNodeData();
          const g = (nd?.variables?.groups || []).find((x) => x && String(x.id) === String(gid));
          if (!g) return;

          if (action === 'select-group') {
            setSelectedGroupId(gid);
            render();
            return;
          }
          if (action === 'add-var') {
            setSelectedGroupId(gid);
            openVarModal({ mode: 'add', groupId: gid, scope: 'module' });
            return;
          }
          if (action === 'toggle-collapse') {
            g.collapsed = !g.collapsed;
            render();
            return;
          }
          if (action === 'del-group') {
            nd.variables.groups = (nd.variables.groups || []).filter((x) => String(x?.id) !== String(gid));
            if (!nd.variables.groups.length) {
              nd.variables.groups = [{
                id: 'grp_' + Date.now().toString(36),
                name: 'Основные',
                enabled: true,
                vars: [],
                collapsed: false,
              }];
            }
            setSelectedGroupId(nd.variables.groups?.[0]?.id || null);
            render();
            apply();
            return;
          }
          if (action === 'del-var') {
            const row = btn.closest?.('[data-var-id]');
            const vid = row?.getAttribute?.('data-var-id');
            if (!vid) return;
            g.vars = (g.vars || []).filter((x) => String(x?.id) !== String(vid));
            render();
            apply();
            return;
          }
          if (action === 'edit-var') {
            const row = btn.closest?.('[data-var-id]');
            const vid = row?.getAttribute?.('data-var-id');
            if (!vid) return;
            openVarModal({ mode: 'edit', groupId: gid, varId: vid });
            return;
          }
        });

        // Root click -> выбрать корень (как в референсе) и спрятать правую панель
        treeRootItem && treeRootItem.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          setSelectedNodeType('root');
          render();
        });

        // Group click in tree
        treeGroupsHost && treeGroupsHost.addEventListener('click', (e) => {
          const menuBtnEl = e.target?.closest?.('.cld-vars-group-menu-btn');
          if (menuBtnEl) {
            e.preventDefault();
            e.stopPropagation();
            const gid = menuBtnEl.getAttribute('data-group-id');
            if (gid) {
              setSelectedGroupId(gid);
              setSelectedNodeType('group');
              render();
            }
            const r = menuBtnEl.getBoundingClientRect();
            openMenuAt(Math.round(r.left), Math.round(r.bottom + 6));
            return;
          }
          const el = e.target?.closest?.('[data-vars-node="group"]');
          if (!el) return;
          const gid = el.getAttribute('data-group-id');
          if (!gid) return;
          setSelectedGroupId(gid);
          setSelectedNodeType('group');
          render();
        });

        // действия меню
        mAddGroup && mAddGroup.addEventListener('click', () => { closeMenu(); openGroupModal(); });
        mAddVar && mAddVar.addEventListener('click', () => { closeMenu(); openVarModal({ mode: 'add', groupId: getSelectedGroupId(), scope: 'module' }); });
        mAddGlobal && mAddGlobal.addEventListener('click', () => { closeMenu(); openVarModal({ mode: 'add', groupId: getSelectedGroupId(), scope: 'global' }); });
        mEnableAll && mEnableAll.addEventListener('click', () => { closeMenu(); setAllEnabled(true); });
        mDisableAll && mDisableAll.addEventListener('click', () => { closeMenu(); setAllEnabled(false); });
        mImport && mImport.addEventListener('click', () => { closeMenu(); if (typeof toastr !== 'undefined') toastr.info('Импорт из вложенных модулей будет подключён на этапе “Шаблоны/Каталог модулей”'); });
        mCopy && mCopy.addEventListener('click', () => { closeMenu(); copyToClipboard(); setPasteEnabled(); });
        mPaste && mPaste.addEventListener('click', () => {
          if (mPaste.classList.contains('disabled')) return;
          closeMenu();
          pasteFromClipboard();
        });
        mDelete && mDelete.addEventListener('click', () => {
          closeMenu();
          const nd = getRootNodeData();
          if (!nd) return;
          const t = (nd?.variables?._selectedNodeType || 'root');
          if (t !== 'group') return;
          const gid = getSelectedGroupId();
          if (!gid) return;
          nd.variables.groups = (nd.variables.groups || []).filter((x) => String(x?.id) !== String(gid));
          if (!nd.variables.groups.length) {
            nd.variables.groups = [{
              id: 'grp_' + Date.now().toString(36),
              name: 'Основные',
              enabled: true,
              vars: [],
              collapsed: false,
            }];
          }
          setSelectedNodeType('root');
          setSelectedGroupId(nd.variables.groups?.[0]?.id || null);
          render();
          apply();
        });

        btnApply.addEventListener('click', apply);
        btnReset.addEventListener('click', reset);

        window.__CLD_VARS_RENDER = render;
        window.__CLD_VARS_SELECT_ROOT = () => { try { setSelectedNodeType('root'); render(); } catch {} };
        // при первом открытии вкладки тоже выбран root -> справа пусто
        setSelectedNodeType('root');
        render();
      }

      // Вкладка JSON: экспорт/импорт constructor_structure (включая template.structure)
      function legacyInitJsonTab() {
        const ta = document.getElementById('catalog-item-json-textarea');
        const btnRefresh = document.getElementById('catalog-item-json-refresh');
        const btnApply = document.getElementById('catalog-item-json-apply');
        const btnFormat = document.getElementById('catalog-item-json-format');
        const btnCopy = document.getElementById('catalog-item-json-copy');
        const btnDownload = document.getElementById('catalog-item-json-download');
        const btnUpload = document.getElementById('catalog-item-json-upload');
        const inpFile = document.getElementById('catalog-item-json-file');
        const statusEl = document.getElementById('catalog-item-json-status');
        if (!ta || !btnRefresh || !btnApply) return;
        if (window.__CLD_JSON_TAB_INITIALIZED) {
          // При повторном открытии просто обновим статус/валидность и покажем актуальный JSON, если пусто.
          try {
            const raw = String(ta.value || '').trim();
            if (!raw) btnRefresh.click();
          } catch {}
          return;
        }
        window.__CLD_JSON_TAB_INITIALIZED = true;

        const LS_KEY = 'cld:json_tab:draft';

        const setStatus = (text, kind) => {
          if (!statusEl) return;
          statusEl.textContent = text || '';
          statusEl.style.color = kind === 'ok' ? '#16a34a' : kind === 'err' ? '#dc2626' : '#6b7280';
        };

        const posToLineCol = (raw, pos) => {
          const upTo = raw.slice(0, Math.max(0, pos));
          const lines = upTo.split('\n');
          const line = lines.length;
          const col = (lines[lines.length - 1] || '').length + 1;
          return { line, col };
        };

        const validate = (raw) => {
          const txt = String(raw || '').trim();
          if (!txt) { setStatus('Пусто', 'muted'); return { ok: false, parsed: null }; }
          try {
            const parsed = JSON.parse(txt);
            setStatus('JSON валиден', 'ok');
            return { ok: true, parsed };
          } catch (e) {
            // попробуем достать позицию из сообщения "at position N"
            const msg = String(e?.message || e || '');
            const m = msg.match(/position\s+(\d+)/i);
            if (m) {
              const pos = Number(m[1]);
              if (Number.isFinite(pos)) {
                const lc = posToLineCol(txt, pos);
                setStatus(`Ошибка JSON (строка ${lc.line}, столбец ${lc.col})`, 'err');
                return { ok: false, parsed: null };
              }
            }
            setStatus('Ошибка JSON', 'err');
            return { ok: false, parsed: null };
          }
        };

        const refresh = () => {
          // Гарантируем, что конструктор инициализирован перед экспортом JSON
          if (typeof window.__cldInitConstructorTab === 'function') window.__cldInitConstructorTab();
          if (typeof window.getConstructorTreeJSON !== 'function') {
            ta.value = '';
            setStatus('Конструктор не готов', 'muted');
            return;
          }
          try {
            const tree = window.getConstructorTreeJSON();
            ta.value = JSON.stringify(tree, null, 2);
            try { localStorage.removeItem(LS_KEY); } catch {}
            validate(ta.value);
          } catch (e) {
            console.error('❌ [JSON] Не удалось собрать JSON из конструктора:', e);
            ta.value = '';
            setStatus('Не удалось собрать JSON', 'err');
          }
        };

        const format = () => {
          const raw = String(ta.value || '');
          const v = validate(raw);
          if (!v.ok) return;
          ta.value = JSON.stringify(v.parsed, null, 2);
          validate(ta.value);
        };

        const apply = () => {
          if (typeof window.loadConstructorTreeFromJSON !== 'function') return;
          const raw = String(ta.value || '').trim();
          if (!raw) return;
          try {
            const parsed = JSON.parse(raw);
            window.loadConstructorTreeFromJSON(parsed);
            if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
            if (typeof toastr !== 'undefined') toastr.success('JSON применён в конструктор');
            setStatus('Применено', 'ok');
          } catch (e) {
            console.error('❌ [JSON] Ошибка парсинга JSON:', e);
            alert('Ошибка JSON: ' + (e?.message || e));
            validate(raw);
          }
        };

        const copy = async () => {
          const raw = String(ta.value || '');
          if (!raw.trim()) return;
          try {
            await navigator.clipboard.writeText(raw);
            setStatus('Скопировано', 'ok');
          } catch {
            // fallback
            ta.focus();
            ta.select();
            try { document.execCommand('copy'); setStatus('Скопировано', 'ok'); } catch { setStatus('Не удалось скопировать', 'err'); }
            try { ta.setSelectionRange(0, 0); } catch {}
          }
        };

        const download = () => {
          const raw = String(ta.value || '').trim();
          if (!raw) return;
          const v = validate(raw);
          if (!v.ok) return;
          const blob = new Blob([JSON.stringify(v.parsed, null, 2)], { type: 'application/json;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'constructor_structure.json';
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          setStatus('Файл скачан', 'ok');
        };

        const uploadPick = () => {
          if (!inpFile) return;
          inpFile.value = '';
          inpFile.click();
        };

        const uploadHandle = async (file) => {
          if (!file) return;
          const text = await file.text();
          ta.value = text;
          validate(ta.value);
          try { localStorage.setItem(LS_KEY, ta.value); } catch {}
          setStatus(`Загружено: ${file.name}`, 'ok');
        };

        btnRefresh.onclick = refresh;
        btnApply.onclick = apply;
        if (btnFormat) btnFormat.onclick = format;
        if (btnCopy) btnCopy.onclick = copy;
        if (btnDownload) btnDownload.onclick = download;
        if (btnUpload) btnUpload.onclick = uploadPick;
        if (inpFile) {
          inpFile.addEventListener('change', (e) => {
            const f = e.target?.files?.[0];
            uploadHandle(f);
          });
        }

        // Автосохранение черновика + подсветка валидности
        // УПРОЩЕНО: в рефе вкладка JSON всегда отражает актуальный constructor_structure,
        // поэтому черновик из localStorage убираем, чтобы не затирать структурой "[]"
        // уже существующую модель.
        ta.addEventListener('input', () => {
          const raw = String(ta.value || '');
          validate(raw);
        });
        
        // При открытии вкладки — всегда показываем актуальный JSON из конструктора
        // (как в референсе: constructor_structure -> JSON).
        refresh();
      }
      
      // Инициализация функционала вкладки "Конструктор"
      // Используем исходную реализацию из admin-new.html,
      // чтобы панель свойств и поведение остались как раньше.
      function initConstructorTab() {
        if (window.__CLD_CONSTRUCTOR_INITIALIZED) return;
        window.__CLD_CONSTRUCTOR_INITIALIZED = true;
        // Получаем корневой модуль СРАЗУ (нужен для всех функций)
        // Референс: логируем начало инициализации конструктора
        const rootModule = document.getElementById('constructor-root-module');
        if (!rootModule) {
          console.error('[CLD][init] ❌ Корневой модуль не найден!');
          return;
        }
        // Текущий выбранный элемент дерева
        let currentSelectedNode = null;
        window.__cldCurrentSelectedNode = null;
        
        // Инициализируем выпадающие списки "Тип" кромки на панели свойств (список наборов кромок)
        try { __cldPopulateConstructorEdgeTypeSelects(); } catch (e) { console.warn('[CLD][edges] init edge types failed', e); }
        
        // Состояние раскрытия корневого модуля
        let isRootExpanded = true;
        
        // Референс: pp.engine.item_types + item_types_names — типы как в Clodis
        const TYPE_NAMES = {
          'section': 'Секция',
          'fillable_section': 'Наполняемая секция',
          'detail': 'Деталь',
          'element': 'Элемент',
          'model': 'Модель',
          'facade': 'Фасад',
          'countertop': 'Столешница',
          'plinth': 'Цоколь',
          'fitting': 'Присадка',
          'cutout': 'Вырез',
          'animator': 'Аниматор',
          'size': 'Размер',
          'mouse_target': 'Цель для мыши',
          'information': 'Информация',
          'attachment_point': 'Точка прилипания',
          'module': 'Модуль',
          'wall': 'Стенка'
        };
        // Обратный маппинг: кириллица → ключ (для сохранения из поля "Тип")
        const TYPE_NAMES_REVERSE = {};
        for (const k of Object.keys(TYPE_NAMES)) TYPE_NAMES_REVERSE[TYPE_NAMES[k]] = k;
        
        // ============================================
        // Вспомогательные функции (определяем заранее)
        // ============================================

        // Дефолты для 9 типов деталей (clean-room).
        // Нужны и для UI (панель свойств), и для установки значений при создании детали.
        function cldGetDetailDefaults(detailTypeId) {
          const id = String(detailTypeId || '');
          const z0 = 0;
          const zDepth = '@section.depth';
          switch (id) {
            case 'back_front':
              return {
                size: { x: '@section.width', y: '@section.height', z: '@section.depth' },
                pos: { x: 0, y: 0, z: 0 },
                pivot: { x: -1, y: -1, z: -1 },
                spec: { orientation: 'f', direction: 'z', side: 'back' },
              };
            case 'vertical_left':
              return {
                size: { x: '@section.width', y: '@section.height', z: '@section.depth' },
                pos: { x: 0, y: 0, z: z0 },
                pivot: { x: -1, y: -1, z: -1 },
                spec: { orientation: 'v', direction: 'z', side: 'left' },
              };
            case 'vertical_right':
              return {
                size: { x: '@section.width', y: '@section.height', z: zDepth },
                pos: { x: '@section.width', y: 0, z: z0 },
                pivot: { x: 1, y: -1, z: -1 },
                spec: { orientation: 'v', direction: 'z', side: 'right' },
              };
            case 'vertical_middle':
              return {
                size: { x: '@section.width', y: '@section.height', z: zDepth },
                pos: { x: '@section.width / 2', y: 0, z: z0 },
                pivot: { x: 0, y: -1, z: -1 },
                spec: { orientation: 'v', direction: 'z', side: 'center' },
              };
            case 'horizontal_bottom':
              return {
                size: { x: '@section.width', y: '@section.height', z: zDepth },
                pos: { x: 0, y: 0, z: z0 },
                pivot: { x: -1, y: -1, z: -1 },
                spec: { orientation: 'h', direction: 'z', side: 'bottom' },
              };
            case 'horizontal_top':
              return {
                size: { x: '@section.width', y: '@section.height', z: zDepth },
                pos: { x: 0, y: '@section.height', z: z0 },
                pivot: { x: -1, y: 1, z: -1 },
                spec: { orientation: 'h', direction: 'z', side: 'top' },
              };
            case 'horizontal_middle':
              return {
                size: { x: '@section.width', y: '@section.height', z: zDepth },
                pos: { x: 0, y: '@section.height / 2', z: z0 },
                pivot: { x: -1, y: 0, z: -1 },
                spec: { orientation: 'h', direction: 'z', side: 'center' },
              };
            case 'front_front':
              return {
                size: { x: '@section.width', y: '@section.height', z: '@section.depth' },
                pos: { x: 0, y: 0, z: '@section.depth' },
                pivot: { x: -1, y: -1, z: -1 },
                spec: { orientation: 'f', direction: 'z', side: 'front' },
              };
            case 'front_middle':
              return {
                size: { x: '@section.width', y: '@section.height', z: '@section.depth' },
                pos: { x: 0, y: 0, z: '@section.depth / 2' },
                pivot: { x: -1, y: -1, z: 0 },
                spec: { orientation: 'f', direction: 'z', side: 'center' },
              };
            default:
              return null;
          }
        }

        // экспортируем на window для других участков файла
        window.__cldGetDetailDefaults = cldGetDetailDefaults;
        
        // Получение глубины узла в дереве
        function getNodeDepth(node) {
          if (node === rootModule) return 0;
          let depth = 0;
          let current = node;
          while (current && current !== rootModule) {
            depth++;
            current = current.parentElement?.closest('.constructor-tree-node') || rootModule;
          }
          return depth;
        }
        
        // Создание нового узла дерева
        function createConstructorTreeNode(type, parentNode) {
          const nodeId = 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          const depth = getNodeDepth(parentNode) + 1;
          
          // Определяем имя по умолчанию
          const defaultName = type === 'detail' ? 'Новая деталь' : 'Новая секция';
          
          // Создаем DOM элемент узла
          const nodeElement = document.createElement('div');
          nodeElement.className = 'constructor-tree-node';
          nodeElement.setAttribute('data-node-type', type);
          nodeElement.setAttribute('data-node-id', nodeId);
          nodeElement.setAttribute('data-node-name', defaultName);
          nodeElement.style.marginLeft = (depth * 12) + 'px'; // Уменьшено с 20px до 12px, чтобы три точки не скрывались за правой панелью
          nodeElement.style.padding = '0';
          nodeElement.style.borderBottom = '1px solid #f0f0f0';
          nodeElement.style.cursor = 'pointer';
          nodeElement.style.display = 'block'; // Блочный элемент для вертикального расположения дочерних узлов
          // Уменьшаем ширину вложенных элементов (оставляем 95% ширины)
          if (depth > 0) {
            nodeElement.style.width = '95%';
            nodeElement.style.maxWidth = '95%';
          } else {
            nodeElement.style.width = '100%';
          }
          nodeElement.style.boxSizing = 'border-box';
          
          // Инициализируем данные узла
          nodeElement.nodeData = {
            type: type,
            id: nodeId,
            name: defaultName,
            active: true,
            hide_when_filled: false
          };
          
          // Создаем структуру узла
          // ВАЖНО: Заголовок узла должен быть отдельным div с flex (горизонтальное расположение элементов внутри)
          let html = '';
          
          // Заголовок узла (горизонтальный flex контейнер)
          html += `<div class="tree-node-header" style="display:flex; align-items:center; gap:6px; width:100%;">
            `;
          
          // Стрелка раскрытия (только для секций)
          if (type === 'section') {
            html += `<div class="tree-node-toggle" style="width:16px; height:16px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#666; flex-shrink:0;">
              <span style="font-size:10px;">▶</span>
            </div>`;
          } else {
            html += '<div style="width:16px; flex-shrink:0;"></div>';
          }
          
          // Иконка типа элемента
          const icon = type === 'detail' ? '▢' : '▦';
          html += `<span style="font-size:12px; color:#666; flex-shrink:0;">${icon}</span>`;
          
          // Название элемента
          html += `<div class="tree-node-name" style="flex:1; font-size:13px; color:#333; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            ${defaultName}
          </div>`;
          
          // Иконка глаза (видимость)
          html += `<div class="tree-node-eye" style="width:16px; height:16px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#666; flex-shrink:0;">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
              <path fill-rule="evenodd" d="M1.38 8.43a1 1 0 0 1 0-.86C2.19 4.84 4.45 3 8 3s5.81 1.84 6.62 4.57a1 1 0 0 1 0 .86C13.81 11.16 11.55 13 8 13s-5.81-1.84-6.62-4.57zM8 2C3.58 2 0 4.36 0 7.5S3.58 13 8 13s8-2.36 8-5.5S12.42 2 8 2z"/>
            </svg>
          </div>`;
          
          // Три точки с меню (как в референсе - всегда видимы)
          html += `<div class="tree-node-menu" style="position:relative; flex-shrink:0; min-width:24px; width:24px; height:24px; z-index:10;">
            <div class="tree-node-menu-trigger" style="width:24px; height:24px; min-width:24px; display:flex !important; align-items:center; justify-content:center; cursor:pointer; color:#666; flex-shrink:0; gap:3px; flex-direction:column; padding:4px; border-radius:3px; transition:background-color 0.2s; opacity:1 !important; visibility:visible !important;">
              <div style="width:4px; height:4px; background:#000 !important; border-radius:50%; display:block !important; opacity:1 !important; visibility:visible !important;"></div>
              <div style="width:4px; height:4px; background:#000 !important; border-radius:50%; display:block !important; opacity:1 !important; visibility:visible !important;"></div>
              <div style="width:4px; height:4px; background:#000 !important; border-radius:50%; display:block !important; opacity:1 !important; visibility:visible !important;"></div>
            </div>
            <div class="tree-node-menu-dropdown constructor-tree-item-menu" style="display:none; position:absolute; top:100%; right:0; margin-top:4px; background:#fff; border:1px solid #e5e7eb; border-radius:4px; box-shadow:0 2px 8px rgba(0,0,0,0.15); min-width:160px; padding:4px 0; z-index:1000;">
              <div style="padding:4px 12px; font-size:13px; color:#333; cursor:pointer; white-space:nowrap; display:flex; align-items:center; gap:6px;" data-action="add">
                <span style="font-size:14px;">+</span>
                <span>Добавить</span>
              </div>
              <div style="padding:4px 12px; font-size:13px; color:#333; cursor:pointer; white-space:nowrap;" data-action="paste">Вставить</div>
              <div style="padding:4px 12px; border-top:1px solid #e5e7eb; margin-top:4px; padding-top:8px; font-size:13px; color:#dc3545; cursor:pointer; white-space:nowrap;" data-action="delete">Удалить</div>
            </div>
          </div>`;
          
          html += `</div>`; // Закрываем заголовок
          
          nodeElement.innerHTML = html;
          
          // Контейнер для дочерних элементов (только для секций)
          if (type === 'section') {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'tree-node-children';
            childrenContainer.style.display = 'none';
            childrenContainer.style.width = '100%';
            childrenContainer.style.boxSizing = 'border-box';
            nodeElement.appendChild(childrenContainer);
          }
          
          // Добавляем padding к заголовку узла
          const header = nodeElement.querySelector('.tree-node-header');
          if (header) {
            header.style.padding = '6px 10px';
          }
          
          // Референс: логируем перед привязкой обработчиков
          // Привязываем обработчики к новому узлу
          if (typeof attachTreeNodeHandlers === 'function') {
            attachTreeNodeHandlers(nodeElement);
          } else {
            console.error('[CLD][create] ❌ attachTreeNodeHandlers не определена!');
          }
          
          return nodeElement;
        }
        
        // Добавление узла дерева к родителю
        function addTreeNodeToParent(nodeElement, parentNode) {
          let childrenContainer;
          
          // Логируем установку детали в секцию
          const nodeType = nodeElement.getAttribute('data-node-type');
          const detailType = nodeElement.getAttribute('data-detail-type');
          const parentType = parentNode?.getAttribute('data-node-type') || (parentNode === rootModule ? 'root' : '?');
          const parentName = parentNode === rootModule ? 'root' : (parentNode?.nodeData?.name || parentNode?.querySelector('.tree-node-name')?.textContent || '?');
          
          if (nodeType === 'detail' && detailType) {
          }
          
          if (parentNode === rootModule) {
            // Добавляем в корневой модуль
            childrenContainer = document.getElementById('constructor-root-module-children');
          } else if (parentNode.getAttribute('data-node-type') === 'section') {
            // Добавляем к секции
            childrenContainer = parentNode.querySelector('.tree-node-children');
          } else {
            // Нельзя добавлять к детали
            alert('Нельзя добавлять дочерние элементы к детали');
            return;
          }
          
          if (!childrenContainer) {
            // Создаем контейнер, если его нет
            childrenContainer = document.createElement('div');
            childrenContainer.className = 'tree-node-children';
