    // Локальная реализация "Копировать" (вместо clipboard.js)
    // Работает с любыми элементами, где есть data-clipboard-target="#id"
    function __cldCopyText(text) {
      const s = String(text ?? '');
      if (!s) return false;
      // Modern API
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(s).then(() => {
          if (typeof toastr !== 'undefined') toastr.success('Скопировано');
        }).catch(() => {});
        return true;
      }
      // Fallback
      try {
        const ta = document.createElement('textarea');
        ta.value = s;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.top = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (ok && typeof toastr !== 'undefined') toastr.success('Скопировано');
        return ok;
      } catch {
        return false;
      }
    }

    // Инициализация глобального объекта glob (после загрузки DOM)
    document.addEventListener('DOMContentLoaded', function() {
      // Поддержка кнопок "Копировать" без clipboard.js
      document.addEventListener('click', function(ev) {
        const el = ev.target && ev.target.closest ? ev.target.closest('[data-clipboard-target]') : null;
        if (!el) return;
        const sel = el.getAttribute('data-clipboard-target');
        if (!sel) return;
        const target = document.querySelector(sel);
        if (!target) return;
        const value =
          (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) ? target.value :
          (target.textContent || '');
        __cldCopyText(value);
      });

      // Создаем glob после загрузки всех скрытых полей
      if (typeof get_base_data === 'function') {
        window.glob = get_base_data();
        // Отправляем событие Glob_ready для account_settings.js
        const event = new Event('Glob_ready');
        document.dispatchEvent(event);
      } else {
        console.error('❌ get_base_data не найдена! Убедитесь, что common_functions.js загружен.');
      }
    });
    
    // Состояние пагинации для типов элементов
    const catalogTypesPagination = {
      currentPage: 1,
      perPage: 20,
      allData: []
    };
    
    // Загрузка типов элементов для таблицы "Типы элементов" (по референсу catalogs_keys-REFERENCE.html)
    async function loadCatalogTypes() {
      try {
        const tbody = document.getElementById('catalog-types-table-body');
        if (!tbody) return;
        
        // Показываем загрузку
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">Загрузка...</td></tr>';
        
        // Загружаем данные с API (по референсу: /catalog/items_get/catalogs_keys)
        const response = await fetch('/api/catalog/items_get/catalogs_keys');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const allData = await response.json();
        // Сохраняем все данные для пагинации
        catalogTypesPagination.allData = allData || [];
        
        // Применяем пагинацию
        renderCatalogTypesTable();
        
      } catch (error) {
        console.error('❌ Ошибка загрузки типов элементов с сервера, используем дефолтный список как в референсе:', error);
        
        // Fallback: жестко заданный список типов (Кухни, Двери и т.п.), 1‑в‑1 с серверным defaultData в server.js
        const fallbackTypes = [
          { id: 1, name: 'Кухни' },
          { id: 2, name: 'Двери кухонных модулей' },
          { id: 4, name: 'Полки' },
          { id: 5, name: 'Полкодержатели' },
          { id: 6, name: 'Петли накладные' },
          { id: 7, name: 'Опоры' },
          { id: 8, name: 'Двери для шкафов' },
          { id: 9, name: 'Шкафы' },
          { id: 10, name: 'Ящики для шкафов' },
          { id: 11, name: 'Полки и перегородки для шкафов' },
          { id: 12, name: 'Двери для углового модуля' },
          { id: 13, name: 'Петли угловые' },
          { id: 16, name: 'ШАБЛОНЫ КОРПУСОВ' },
          { id: 17, name: 'ШАБЛОНЫ КОРПУСОВ GOLA' },
          { id: 18, name: 'Сушки' },
          { id: 19, name: 'Профиль Gola' },
          { id: 20, name: 'Духовые шкафы' },
          { id: 21, name: 'Встроенные микроволновки' },
          { id: 22, name: 'Бутылочницы' },
          { id: 24, name: 'Ящики' }
        ];
        
        catalogTypesPagination.allData = fallbackTypes;
        renderCatalogTypesTable();
      }
    }
    
    // ============================================
    // Функции для работы с группами (modules_groups)
    // ============================================
    
    // Состояние пагинации для групп
    const catalogGroupsPagination = {
      currentPage: 1,
      perPage: 20,
      allData: []
    };
    
    // Загрузка групп для таблицы "Группы"
    async function loadCatalogGroups() {
      try {
        const tbody = document.getElementById('catalog-groups-table-body');
        if (!tbody) return;
        
        // Показываем загрузку
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">Загрузка...</td></tr>';
        
        // Загружаем данные с API (добавляем timestamp для предотвращения кеширования)
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/catalog/items_get/modules_groups?t=${timestamp}`, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const responseData = await response.json();
        console.log('📊 Тип данных:', Array.isArray(responseData) ? 'массив' : typeof responseData);
        console.log('📊 Количество элементов:', Array.isArray(responseData) ? responseData.length : 'не массив');
        
        // Проверяем формат ответа - может быть массив или объект с данными
        let allData = [];
        if (Array.isArray(responseData)) {
          allData = responseData;
        } else if (responseData && Array.isArray(responseData.data)) {
          allData = responseData.data;
        } else if (responseData && responseData.items && Array.isArray(responseData.items)) {
          allData = responseData.items;
        } else {
          console.warn('⚠️ Неожиданный формат данных от API:', responseData);
          allData = [];
        }
        
        // Сохраняем все данные для пагинации
        catalogGroupsPagination.allData = allData;
        
        // Применяем пагинацию
        renderCatalogGroupsTable();
        
      } catch (error) {
        console.error('❌ Ошибка загрузки групп с сервера:', error);
        const tbody = document.getElementById('catalog-groups-table-body');
        if (tbody) {
          tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#999;">Ошибка загрузки данных</td></tr>';
        }
        renderCatalogGroupsPagination(0);
      }
    }
    
    // Рендеринг таблицы групп с учетом пагинации
    function renderCatalogGroupsTable() {
      const tbody = document.getElementById('catalog-groups-table-body');
      if (!tbody) return;
      
      const { currentPage, perPage } = catalogGroupsPagination;
      let allData = catalogGroupsPagination.allData;
      
      // Убеждаемся, что allData - массив
      if (!Array.isArray(allData)) {
        console.error('❌ allData не является массивом:', allData);
        allData = [];
        catalogGroupsPagination.allData = [];
      }
        
        // Очищаем таблицу
        tbody.innerHTML = '';
        
      // Если данных нет
      if (!allData || allData.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#999;">Нет данных</td></tr>';
        renderCatalogGroupsPagination(0);
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
        checkbox.className = 'catalog-group-checkbox';
          checkboxCell.appendChild(checkbox);
          
        // ID
          const idCell = document.createElement('td');
          idCell.style.width = '50px';
        idCell.style.verticalAlign = 'middle';
          idCell.textContent = item.id || '-';
          
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
        editLink.href = `#catalog-group-edit?id=${item.id}`;
          editLink.onclick = (e) => {
            e.preventDefault();
          openCatalogGroupEdit(item.id);
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
      // Рендерим пагинацию
      renderCatalogGroupsPagination(allData.length);
    }
    
    // Рендеринг пагинации для групп
    function renderCatalogGroupsPagination(totalItems) {
      const pagination = document.getElementById('catalog-groups-pagination');
      if (!pagination) return;
      
      const { currentPage, perPage } = catalogGroupsPagination;
      const totalPages = Math.ceil(totalItems / perPage);
      
      let html = '';
      if (totalPages > 1) {
        html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
          <a class="page-link" href="#" data-page="1" title="Первая страница">&lt;&lt;</a>
        </li>`;
        html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
          <a class="page-link" href="#" data-page="${currentPage - 1}" title="Предыдущая страница">&lt;</a>
        </li>`;
        
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
        
        html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
          <a class="page-link" href="#" data-page="${currentPage + 1}" title="Следующая страница">&gt;</a>
        </li>`;
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
            catalogGroupsPagination.currentPage = page;
            renderCatalogGroupsTable();
          }
        });
      });
    }
    
    // ============================================
    // Функции для работы с материалами (materials_keys)
    // ============================================
    
    // Состояние пагинации для материалов
    const materialsKeysPagination = {
      currentPage: 1,
      perPage: 20,
      allData: []
    };

    // ============================================
    // Список элементов материала (materials-items)
    // ============================================
    const materialsItemsState = {
      type: '',
      name: '',
      currentPage: 1,
      perPage: 20,
      allData: [],
      filtered: []
    };

    const materialsCategoriesCache = {};
    const facadeDecorCategoriesCache = {
      list: null,
    };
    const facadePricesCategoriesCache = {
      list: null,
    };

    function buildMaterialCategoryFullName(cat, all) {
      const byId = {};
      all.forEach(c => { byId[String(c.id)] = c; });
      const chain = [];
      let cur = cat;
      while (cur) {
        if (cur.name) chain.unshift(cur.name);
        const parentId = cur.parent == null ? null : String(cur.parent);
        if (!parentId || !byId[parentId]) break;
        cur = byId[parentId];
      }
      return chain.join(' / ');
    }

    async function loadMaterialsCategoriesForCurrentType() {
      const typeKey = materialsItemsState.type || readMaterialsItemsParamsFromHash().type || '';
      if (!typeKey) return [];
      if (Array.isArray(materialsCategoriesCache[typeKey])) return materialsCategoriesCache[typeKey];
      try {
        const resp = await fetch(`/api/catalog/categories_get/${encodeURIComponent(typeKey)}?t=${Date.now()}`, { cache: 'no-cache' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        const data = await resp.json();
        const arr = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
        materialsCategoriesCache[typeKey] = arr;
        return arr;
      } catch (e) {
        console.warn('⚠️ Не удалось загрузить категории материалов для типа', typeKey, e);
        materialsCategoriesCache[typeKey] = [];
        return [];
      }
    }

    // Категории декоров для фасадов: берём из LDSP (material_2), как в рефе
    async function loadFacadeDecorCategories() {
      if (Array.isArray(facadeDecorCategoriesCache.list)) {
        return facadeDecorCategoriesCache.list;
      }
      try {
        const resp = await fetch('/api/catalog/categories_get/material_2?t=' + Date.now(), { cache: 'no-cache' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = await resp.json();
        const arr = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
        facadeDecorCategoriesCache.list = arr;
        return arr;
      } catch (e) {
        console.warn('⚠️ Не удалось загрузить категории LDSP для декоров фасадов:', e);
        facadeDecorCategoriesCache.list = [];
        return [];
      }
    }

    function readMaterialsItemsParamsFromHash() {
      const hash = window.location.hash || '';
      const params = new URLSearchParams(hash.split('?')[1] || '');
      const type = params.get('type') || '';
      // имя можем брать из меню, но на старте берём из params если передадим позже; пока оставляем пустым
      return { type };
    }

    function getMaterialNameFromMenu(typeKey) {
      if (!typeKey) return '';
      const a = document.querySelector(`a[data-page="materials-items"][data-catalog-type="${CSS.escape(typeKey)}"]`);
      return a ? (a.getAttribute('data-catalog-name') || a.getAttribute('data-material-name') || '') : '';
    }

    function normalizeItemsResponse(data) {
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.items)) return data.items;
      if (data && Array.isArray(data.data)) return data.data;
      return [];
    }

    function getMatItemArticle(item) {
      return (item?.article ?? item?.code ?? item?.vendor_code ?? '').toString();
    }

    function getMatItemCategory(item) {
      // поддерживаем строку или массив категорий
      const c = item?.category;
      if (Array.isArray(c)) return (c[0] ?? '').toString();
      return (c ?? item?.category_name ?? '').toString();
    }

    function applyMaterialsItemsFilters() {
      const q = (document.getElementById('materials-items-search-input')?.value || '').toString().trim().toLowerCase();
      const cat = (document.getElementById('materials-items-category-filter')?.value || '').toString();
      const all = Array.isArray(materialsItemsState.allData) ? materialsItemsState.allData : [];

      let out = all;
      if (q) {
        out = out.filter((it) => {
          const name = (it?.name || '').toString().toLowerCase();
          const art = getMatItemArticle(it).toLowerCase();
          const id = String(it?.id ?? '');
          return name.includes(q) || art.includes(q) || id.includes(q);
        });
      }
      if (cat) {
        out = out.filter((it) => getMatItemCategory(it) === cat);
      }

      materialsItemsState.filtered = out;
      // фикс: не даём "перескакивать" страницам — если текущая страница больше макс, сдвигаем
      const totalPages = Math.max(1, Math.ceil(out.length / (materialsItemsState.perPage || 20)));
      if (materialsItemsState.currentPage > totalPages) materialsItemsState.currentPage = totalPages;
      if (materialsItemsState.currentPage < 1) materialsItemsState.currentPage = 1;
    }

    async function renderMaterialsItemsCategories() {
      const sel = document.getElementById('materials-items-category-filter');
      const editSel = document.getElementById('material-item-category');
      if (!sel) return;
      const cats = await loadMaterialsCategoriesForCurrentType();
      const withNames = Array.isArray(cats)
        ? cats.map(c => {
            const full = buildMaterialCategoryFullName(c, cats) || (c.name || '');
            return { id: c.id, fullName: full };
          }).filter(c => c.fullName)
        : [];
      withNames.sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru'));

      const cur = sel.value || '';
      sel.innerHTML = `<option value="">Нет</option>` + withNames.map((c) => {
        const esc = c.fullName.replace(/"/g, '&quot;');
        return `<option value="${esc}">${esc}</option>`;
      }).join('');
      if (cur) sel.value = cur;

      if (editSel) {
        const curEdit = editSel.value || '';
        editSel.innerHTML = `<option value="">Нет</option>` + withNames.map((c) => {
          const esc = c.fullName.replace(/"/g, '&quot;');
          return `<option value="${esc}">${esc}</option>`;
        }).join('');
        if (curEdit) editSel.value = curEdit;
      }
    }

    function renderMaterialsItemsTable() {
      const tbody = document.getElementById('materials-items-table-body');
      if (!tbody) return;

      applyMaterialsItemsFilters();
      const data = materialsItemsState.filtered;

      tbody.innerHTML = '';
      if (!materialsItemsState.type) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:20px; color:#999;">Выберите тип материала из меню</td></tr>';
        renderMaterialsItemsPagination(0);
        return;
      }
      if (!data.length) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:20px; color:#999;">Нет данных</td></tr>';
        renderMaterialsItemsPagination(0);
        return;
      }

      const startIndex = (materialsItemsState.currentPage - 1) * materialsItemsState.perPage;
      const endIndex = startIndex + materialsItemsState.perPage;
      const pageData = data.slice(startIndex, endIndex);

      for (const item of pageData) {
        const tr = document.createElement('tr');

        const tdChk = document.createElement('td');
        tdChk.style.width = '10px';
        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.className = 'materials-item-checkbox';
        chk.value = item?.id ?? '';
        tdChk.appendChild(chk);

        const tdId = document.createElement('td');
        tdId.style.width = '60px';
        tdId.textContent = String(item?.id ?? '-');

        const tdIcon = document.createElement('td');
        tdIcon.style.width = '90px';
        const iconUrl = (item?.icon || item?.image || '').toString();
        if (iconUrl) {
          const img = document.createElement('img');
          img.src = iconUrl;
          img.alt = '';
          img.style.width = '70px';
          img.style.height = '70px';
          img.style.objectFit = 'cover';
          img.style.borderRadius = '6px';
          img.style.border = '1px solid #e5e7eb';
          tdIcon.appendChild(img);
        } else {
          tdIcon.innerHTML = '<div style="width:70px; height:70px; border:1px solid #e5e7eb; border-radius:6px; background:#f8fafc;"></div>';
        }

        const tdName = document.createElement('td');
        tdName.textContent = item?.name || '';

        const tdArt = document.createElement('td');
        tdArt.style.width = '140px';
        tdArt.innerHTML = `<span style="color:#334155;">${getMatItemArticle(item) || ''}</span>`;

        const tdCat = document.createElement('td');
        tdCat.textContent = getMatItemCategory(item) || '';

        const tdOrder = document.createElement('td');
        tdOrder.style.width = '90px';
        tdOrder.textContent = String(item?.order ?? item?.sort ?? '');

        const tdVis = document.createElement('td');
        tdVis.style.width = '110px';
        const active = (item?.active ?? 1) === 1 || item?.active === true || item?.active === '1';
        tdVis.innerHTML = active
          ? '<button type="button" class="btn btn-xs btn-outline btn-success" title="Видим"><i class="fa fa-eye"></i></button>'
          : '<button type="button" class="btn btn-xs btn-outline btn-default" title="Скрыт"><i class="fa fa-eye-slash"></i></button>';

        const tdAct = document.createElement('td');
        tdAct.style.width = '160px';
        const actWrap = document.createElement('div');
        actWrap.style.display = 'flex';
        actWrap.style.gap = '8px';
        actWrap.style.justifyContent = 'center';

        const mkBtn = (className, title, iconClass, action) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = className;
          b.title = title;
          b.setAttribute('data-mi-action', action);
          b.setAttribute('data-mi-id', String(item?.id || ''));
          b.setAttribute('data-mi-name', String(item?.name || ''));
          const ic = document.createElement('i');
          ic.className = iconClass;
          b.appendChild(ic);
          return b;
        };

        actWrap.appendChild(mkBtn('btn btn-xs btn-outline btn-primary', 'Редактировать', 'fa fa-pencil', 'edit'));
        actWrap.appendChild(mkBtn('btn btn-xs btn-outline btn-info', 'Копировать', 'fa fa-copy', 'copy'));
        actWrap.appendChild(mkBtn('btn btn-xs btn-outline btn-danger', 'Удалить', 'fa fa-trash', 'delete'));

        tdAct.appendChild(actWrap);

        tr.appendChild(tdChk);
        tr.appendChild(tdId);
        tr.appendChild(tdIcon);
        tr.appendChild(tdName);
        tr.appendChild(tdArt);
        tr.appendChild(tdCat);
        tr.appendChild(tdOrder);
        tr.appendChild(tdVis);
        tr.appendChild(tdAct);
        tbody.appendChild(tr);
      }

      renderMaterialsItemsPagination(data.length);
    }

    function renderMaterialsItemsPagination(totalItems) {
      const top = document.getElementById('materials-items-pagination-top');
      const bottom = document.getElementById('materials-items-pagination-bottom');
      const fromEl = document.getElementById('materials-items-from');
      const toEl = document.getElementById('materials-items-to');
      const totalEl = document.getElementById('materials-items-total');
      if (!top || !bottom) return;

      const perPage = materialsItemsState.perPage || 20;
      const currentPage = materialsItemsState.currentPage || 1;
      const totalPages = Math.max(1, Math.ceil((totalItems || 0) / perPage));

      const start = totalItems ? ((currentPage - 1) * perPage + 1) : 0;
      const end = totalItems ? Math.min(currentPage * perPage, totalItems) : 0;
      if (fromEl) fromEl.textContent = String(start);
      if (toEl) toEl.textContent = String(end);
      if (totalEl) totalEl.textContent = String(totalItems || 0);

      const renderTo = (host) => {
        let html = '';
        const add = (label, page, disabled = false, active = false) => {
          html += `<li class="page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}">
            <a class="page-link" href="#" data-page="${page}">${label}</a>
          </li>`;
        };
        add('&lt;&lt;', 1, currentPage === 1);
        add('&lt;', Math.max(1, currentPage - 1), currentPage === 1);

        const windowSize = 9;
        let startPage = Math.max(1, currentPage - Math.floor(windowSize / 2));
        let endPage = Math.min(totalPages, startPage + windowSize - 1);
        startPage = Math.max(1, endPage - windowSize + 1);

        for (let p = startPage; p <= endPage; p++) add(String(p), p, false, p === currentPage);

        add('&gt;', Math.min(totalPages, currentPage + 1), currentPage === totalPages);
        add('&gt;&gt;', totalPages, currentPage === totalPages);

        host.innerHTML = html;
        host.querySelectorAll('a.page-link').forEach((a) => {
          a.addEventListener('click', (e) => {
            e.preventDefault();
            const p = parseInt(a.getAttribute('data-page') || '0', 10);
            if (!p) return;
            if (p === materialsItemsState.currentPage) return;
            materialsItemsState.currentPage = p;
            renderMaterialsItemsTable();
          });
        });
      };

      renderTo(top);
      renderTo(bottom);
    }

    async function loadMaterialsItems(typeKey, name) {
      try {
        const tbody = document.getElementById('materials-items-table-body');
        if (!tbody) return;

        materialsItemsState.type = typeKey || '';
        materialsItemsState.name = name || getMaterialNameFromMenu(typeKey) || typeKey || 'Материалы';

        const title = document.getElementById('materials-items-title');
        const subtitle = document.getElementById('materials-items-subtitle');
        if (title) title.textContent = `Список ${materialsItemsState.name}`;
        if (subtitle) subtitle.textContent = materialsItemsState.name;

        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:20px;">Загрузка...</td></tr>';

        const resp = await fetch(`/api/catalog/items_get/${encodeURIComponent(typeKey)}?t=${Date.now()}`, { cache: 'no-cache' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        const data = await resp.json();
        const items = normalizeItemsResponse(data);

        materialsItemsState.allData = items;
        materialsItemsState.currentPage = 1;

        renderMaterialsItemsCategories();
        renderMaterialsItemsTable();
      } catch (e) {
        console.error('❌ Ошибка загрузки элементов материала:', e);
        const tbody = document.getElementById('materials-items-table-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:20px; color:#999;">Ошибка загрузки данных</td></tr>';
        renderMaterialsItemsPagination(0);
      }
    }

    function loadMaterialsItemsFromHash() {
      const { type } = readMaterialsItemsParamsFromHash();
      if (!type) return;
      const name = getMaterialNameFromMenu(type) || '';
      loadMaterialsItems(type, name);
    }

    function openMaterialItemEdit(itemId) {
      const type = materialsItemsState.type || readMaterialsItemsParamsFromHash().type || '';
      if (!type) return;
      const hash = `#material-item-edit?type=${encodeURIComponent(type)}&id=${encodeURIComponent(String(itemId || 0))}`;
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      }

      // Локальная навигация (как в роутере выше) — сразу показать страницу и загрузить форму
      const pages = document.querySelectorAll('.admin-page');
      pages.forEach(p => p.classList.remove('active'));
      const page = document.getElementById('material-item-edit');
      if (page) {
        page.classList.add('active');
        loadMaterialItemEdit(type, itemId || 0);
      }
    }

    async function loadMaterialItemEdit(typeKey, itemId) {
      try {
        const id = Number(itemId) || 0;
        const controller = typeKey || '';
        if (!controller) return;

        // Поддержка возврата на нестандартные списки (например, Каталог 3D моделей)
        const hashParams = new URLSearchParams((window.location.hash || '').split('?')[1] || '');
        const backPage = (hashParams.get('back') || '').toString().trim(); // например: models3d-materials
        const backName = (hashParams.get('backName') || '').toString().trim(); // человекочитаемое название
        const successUrlInput = document.getElementById('material_item_form_success_url');
        if (successUrlInput) {
          successUrlInput.value = backPage ? `#${backPage}` : (successUrlInput.value || '#materials-items');
        }

        const submitUrlInput = document.getElementById('material_item_form_submit_url');
        const controllerInput = document.getElementById('material_item_controller_name');
        const idInput = document.getElementById('material_item_id');
        const title = document.getElementById('material-item-edit-title');
        const typeNameInput = document.getElementById('material_item_type_name');

        if (controllerInput) controllerInput.value = controller;
        if (idInput) idInput.value = String(id);
        if (typeNameInput) typeNameInput.value = backName || getMaterialNameFromMenu(controller) || controller;

        if (title) title.textContent = id ? 'Редактировать материал' : 'Добавить материал';

        // Пытаемся сначала найти элемент в уже загруженном списке (то, что видно в таблице)
        let item = null;
        if (id !== 0 && materialsItemsState.type === controller && Array.isArray(materialsItemsState.allData)) {
          item = materialsItemsState.allData.find(it => Number(it?.id) === id) || null;
        }

        // Если не нашли локально (например, редактирование после прямого перехода) — запрашиваем с сервера
        if (!item && id !== 0) {
          const resp = await fetch(`/api/catalog/item/${encodeURIComponent(controller)}/${encodeURIComponent(String(id))}?t=${Date.now()}`, { cache: 'no-cache' });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
          item = await resp.json();
        }

        // Для добавления нового элемента — пустой шаблон
        if (!item) {
          item = {
            id: 0,
            name: '',
            article: '',
            category: '',
            order: 10000,
            active: 1,
            icon: '',
            description: ''
          };
        }

        document.getElementById('material-item-name').value = item?.name || '';
        document.getElementById('material-item-article').value = getMatItemArticle(item) || '';
        document.getElementById('material-item-category').value = getMatItemCategory(item) || '';
        document.getElementById('material-item-order').value = String(item?.order ?? 10000);
        document.getElementById('material-item-active').checked = (item?.active ?? 1) == 1 || item?.active === true;
        document.getElementById('material-item-icon').value = (item?.icon || '').toString();
        document.getElementById('material-item-description').value = (item?.description || '').toString();

        // Параметры отображения
        const displayModeEl = document.getElementById('material-display-mode');
        if (displayModeEl) {
          displayModeEl.value = item?.displayMode || 'custom';
        }
        const color = (item?.color || '#ffffff').toString();
        const colorInput = document.getElementById('material-color');
        const colorHexInput = document.getElementById('material-color-hex');
        if (colorInput) colorInput.value = color;
        if (colorHexInput) colorHexInput.value = color;
        const roughnessInput = document.getElementById('material-roughness');
        if (roughnessInput) roughnessInput.value = String(item?.roughness ?? 0.8);
        const metalnessInput = document.getElementById('material-metalness');
        if (metalnessInput) metalnessInput.value = String(item?.metalness ?? 0);
        const transparentInput = document.getElementById('material-transparent');
        const transparencyBlock = document.getElementById('material-transparency-block');
        const opacityInput = document.getElementById('material-opacity');
        const isTransparent = !!(item?.transparent);
        if (transparentInput) transparentInput.checked = isTransparent;
        if (transparencyBlock) transparencyBlock.style.display = isTransparent ? 'flex' : 'none';
        if (opacityInput) opacityInput.value = String(item?.opacity ?? 1);

        // Основная текстура
        const textureUrl = (item?.texture || '').toString();
        const texturePreview = document.getElementById('material-texture-preview');
        const textureUrlInput = document.getElementById('material-texture-url');
        const textureFileInput = document.getElementById('material-texture-file');
        if (textureUrlInput) textureUrlInput.value = textureUrl;
        if (texturePreview) {
          if (textureUrl) {
            texturePreview.innerHTML = `<img src="${textureUrl}" style="width:100%; height:100%; object-fit:cover;"><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="material-texture-upload-icon"></i>`;
          } else {
            texturePreview.innerHTML = '<span style="color:#ccc; font-size:12px;">нет</span><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="material-texture-upload-icon"></i>';
          }
          // Переподключаем обработчик клика на иконку после обновления HTML
          setTimeout(() => {
            const icon = document.getElementById('material-texture-upload-icon');
            if (icon && textureFileInput) {
              icon.addEventListener('click', (e) => {
                e.preventDefault();
                textureFileInput.click();
              });
            }
          }, 50);
        }
        const texW = document.getElementById('material-texture-width');
        const texH = document.getElementById('material-texture-height');
        if (texW) texW.value = String(item?.textureWidth ?? 1000);
        if (texH) texH.value = String(item?.textureHeight ?? 1000);
        const stretchW = document.getElementById('material-stretch-width');
        const stretchH = document.getElementById('material-stretch-height');
        if (stretchW) stretchW.checked = !!item?.stretchWidth;
        if (stretchH) stretchH.checked = !!item?.stretchHeight;

        // Карта нормалей
        const normalMapUrl = (item?.normalMap || '').toString();
        const normalMapPreview = document.getElementById('material-normal-map-preview');
        const normalMapUrlInput = document.getElementById('material-normal-map-url');
        const normalMapFileInput = document.getElementById('material-normal-map-file');
        if (normalMapUrlInput) normalMapUrlInput.value = normalMapUrl;
        if (normalMapPreview) {
          if (normalMapUrl) {
            normalMapPreview.innerHTML = `<img src="${normalMapUrl}" style="width:100%; height:100%; object-fit:cover;"><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="material-normal-map-upload-icon"></i>`;
          } else {
            normalMapPreview.innerHTML = '<span style="color:#ccc; font-size:12px;">256x256</span><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="material-normal-map-upload-icon"></i>';
          }
          // Переподключаем обработчик клика на иконку после обновления HTML
          setTimeout(() => {
            const icon = document.getElementById('material-normal-map-upload-icon');
            if (icon && normalMapFileInput) {
              icon.addEventListener('click', (e) => {
                e.preventDefault();
                normalMapFileInput.click();
              });
            }
          }, 50);
        }

        // Карта шероховатости
        const roughnessMapUrl = (item?.roughnessMap || '').toString();
        const roughnessMapPreview = document.getElementById('material-roughness-map-preview');
        const roughnessMapUrlInput = document.getElementById('material-roughness-map-url');
        const roughnessMapFileInput = document.getElementById('material-roughness-map-file');
        if (roughnessMapUrlInput) roughnessMapUrlInput.value = roughnessMapUrl;
        if (roughnessMapPreview) {
          if (roughnessMapUrl) {
            roughnessMapPreview.innerHTML = `<img src="${roughnessMapUrl}" style="width:100%; height:100%; object-fit:cover;"><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="material-roughness-map-upload-icon"></i>`;
          } else {
            roughnessMapPreview.innerHTML = '<span style="color:#ccc; font-size:12px;">256x256</span><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="material-roughness-map-upload-icon"></i>';
          }
          // Переподключаем обработчик клика на иконку после обновления HTML
          setTimeout(() => {
            const icon = document.getElementById('material-roughness-map-upload-icon');
            if (icon && roughnessMapFileInput) {
              icon.addEventListener('click', (e) => {
                e.preventDefault();
                roughnessMapFileInput.click();
              });
            }
          }, 50);
        }

        // Реальная ширина/высота текстуры
        const realTexW = document.getElementById('material-real-texture-width');
        const realTexH = document.getElementById('material-real-texture-height');
        if (realTexW) realTexW.value = String(item?.realTextureWidth ?? item?.normal_map_width ?? 256);
        if (realTexH) realTexH.value = String(item?.realTextureHeight ?? item?.normal_map_height ?? 256);

        // Односторонний материал
        const oneSidedInput = document.getElementById('material-one-sided');
        if (oneSidedInput) oneSidedInput.checked = !!(item?.oneSided || item?.one_side);

        // Размер превью
        const previewW = document.getElementById('material-preview-width');
        const previewH = document.getElementById('material-preview-height');
        if (previewW) previewW.value = String(item?.previewWidth ?? 450);
        if (previewH) previewH.value = String(item?.previewHeight ?? 720);

        // Параметры (толщина / группа)
        const thicknessInput = document.getElementById('material-thickness');
        if (thicknessInput) thicknessInput.value = String(item?.thickness ?? 16);
        const groupInput = document.getElementById('material-group');
        if (groupInput) groupInput.value = (item?.group || '');

        // Обновляем превью иконки
        const iconUrl = (item?.icon || '').toString().trim();
        const prev = document.getElementById('material-item-icon-preview');
        const prevWrapper = document.getElementById('material-item-icon-preview-wrapper');
        const placeholder = document.getElementById('material-item-icon-placeholder');
        if (iconUrl && prev && prevWrapper && placeholder) {
          prev.src = iconUrl;
          prevWrapper.style.display = 'block';
          placeholder.style.display = 'none';
        } else if (prev && prevWrapper && placeholder) {
          prev.src = '';
          prevWrapper.style.display = 'none';
          placeholder.style.display = 'flex';
        }

        if (submitUrlInput) {
          submitUrlInput.value = id ? `/api/catalog/item_edit/${controller}/${id}` : `/api/catalog/item_add/${controller}/`;
        }

        const cancel = document.getElementById('cancel-material-item-btn');
        if (cancel) {
          const backUrl = (successUrlInput?.value || '').toString().trim() || '#materials-items';
          if (backUrl.startsWith('#materials-items')) {
            cancel.setAttribute('href', `#materials-items?type=${encodeURIComponent(controller)}`);
          } else {
            cancel.setAttribute('href', backUrl);
          }
        }
      } catch (e) {
        console.error('❌ Ошибка загрузки формы элемента материала:', e);
        alert('Ошибка загрузки элемента. Проверь сервер.');
      }
    }

    async function saveMaterialItem(exitAfter) {
      try {
        const controller = document.getElementById('material_item_controller_name')?.value || '';
        const id = Number(document.getElementById('material_item_id')?.value || '0') || 0;
        if (!controller) return;

        const successUrl = (document.getElementById('material_item_form_success_url')?.value || '#materials-items').toString().trim() || '#materials-items';

        // Читаем значения вкладок
        const displayMode = document.getElementById('material-display-mode')?.value || 'custom';
        const color = (document.getElementById('material-color-hex')?.value || '#ffffff').toString().trim() || '#ffffff';
        const roughness = Number(document.getElementById('material-roughness')?.value || '0.8') || 0.8;
        const metalness = Number(document.getElementById('material-metalness')?.value || '0') || 0;
        const transparent = !!document.getElementById('material-transparent')?.checked;
        const opacity = Number(document.getElementById('material-opacity')?.value || '1') || 1;
        const texture = (document.getElementById('material-texture-url')?.value || '').toString().trim();
        const textureWidth = Number(document.getElementById('material-texture-width')?.value || '1000') || 1000;
        const textureHeight = Number(document.getElementById('material-texture-height')?.value || '1000') || 1000;
        const stretchWidth = !!document.getElementById('material-stretch-width')?.checked;
        const stretchHeight = !!document.getElementById('material-stretch-height')?.checked;
        
        // Новые поля по референсу
        const normalMap = (document.getElementById('material-normal-map-url')?.value || '').toString().trim();
        const roughnessMap = (document.getElementById('material-roughness-map-url')?.value || '').toString().trim();
        const realTextureWidth = Number(document.getElementById('material-real-texture-width')?.value || '256') || 256;
        const realTextureHeight = Number(document.getElementById('material-real-texture-height')?.value || '256') || 256;
        const oneSided = !!document.getElementById('material-one-sided')?.checked;
        const previewWidth = Number(document.getElementById('material-preview-width')?.value || '450') || 450;
        const previewHeight = Number(document.getElementById('material-preview-height')?.value || '720') || 720;
        
        const thickness = Number(document.getElementById('material-thickness')?.value || '16') || 16;
        const group = (document.getElementById('material-group')?.value || '').toString();
        const description = (document.getElementById('material-item-description')?.value || '').toString().trim();

        const payload = {
          id,
          name: (document.getElementById('material-item-name')?.value || '').toString().trim(),
          article: (document.getElementById('material-item-article')?.value || '').toString().trim(),
          category: (document.getElementById('material-item-category')?.value || '').toString().trim(),
          order: Number(document.getElementById('material-item-order')?.value || '10000') || 10000,
          active: document.getElementById('material-item-active')?.checked ? 1 : 0,
          icon: (document.getElementById('material-item-icon')?.value || '').toString().trim(),
          description,
          displayMode,
          color,
          roughness,
          metalness,
          transparent,
          opacity,
          texture,
          textureWidth,
          textureHeight,
          stretchWidth,
          stretchHeight,
          normalMap,
          roughnessMap,
          realTextureWidth,
          realTextureHeight,
          normal_map_width: realTextureWidth,
          normal_map_height: realTextureHeight,
          oneSided,
          one_side: oneSided,
          previewWidth,
          previewHeight,
          thickness,
          group,
        };

        if (!payload.name) {
          alert('Введите название');
          return;
        }

        const url = id ? `/api/catalog/item_edit/${encodeURIComponent(controller)}/${id}` : `/api/catalog/item_add/${encodeURIComponent(controller)}/`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        const res = await resp.json();

        if (window.toastr) window.toastr.success('Сохранено');

        if (exitAfter) {
          // Возврат на список: по умолчанию materials-items, но поддерживаем и другие страницы
          const targetHash = successUrl.startsWith('#materials-items')
            ? `#materials-items?type=${encodeURIComponent(controller)}`
            : successUrl;
          if (window.location.hash !== targetHash) window.location.hash = targetHash;

          const pages = document.querySelectorAll('.admin-page');
          pages.forEach(p => p.classList.remove('active'));
          const basePageId = (targetHash || '').split('?')[0].replace('#', '');
          const listPage = document.getElementById(basePageId);
          if (listPage) listPage.classList.add('active');

          if (basePageId === 'materials-items') {
            materialsItemsState.type = controller;
            loadMaterialsItems(controller, getMaterialNameFromMenu(controller));
          } else if (basePageId === 'models3d-materials' && typeof window.loadModels3dMaterials === 'function') {
            window.loadModels3dMaterials();
          }
        } else {
          const newId = Number(res?.item?.id ?? res?.id ?? payload.id ?? 0) || 0;
          window.location.hash = `#material-item-edit?type=${encodeURIComponent(controller)}&id=${encodeURIComponent(String(newId))}`;
        }
      } catch (e) {
        console.error('❌ Ошибка сохранения элемента материала:', e);
        alert('������ ����������. ������� ������.');
      }
    }

    window.loadMaterialsItemsFromHash = loadMaterialsItemsFromHash;
    window.openMaterialItemEdit = openMaterialItemEdit;
    window.saveMaterialItem = saveMaterialItem;

    window.copyMaterialItem = async function (itemId) {
      try {
        const controller = materialsItemsState.type || readMaterialsItemsParamsFromHash().type || '';
        if (!controller) return;
        const resp = await fetch(`/api/catalog/item/${encodeURIComponent(controller)}/${encodeURIComponent(String(itemId))}?t=${Date.now()}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const item = await resp.json();
        const copy = { ...item, id: 0, name: `${item?.name || 'Материал'} (копия)` };
        const addResp = await fetch(`/api/catalog/item_add/${encodeURIComponent(controller)}/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(copy) });
        if (!addResp.ok) throw new Error(`HTTP ${addResp.status}`);
        if (window.toastr) window.toastr.success('Скопировано');
        await loadMaterialsItems(controller, getMaterialNameFromMenu(controller));
      } catch (e) {
        console.error('❌ Ошибка копирования:', e);
        alert('Ошибка копирования');
      }
    };

    // ================================
    // Форма фасада (facade-item-edit)
    // ================================

    const facadeEditState = {
      dataObj: null,
      currentTypeKey: null,
      extraMaterialsCurrentKey: null,
      materialsGroups: null
    };
    window.__facadeEditState = facadeEditState;

    function getFacadeDataObject() {
      if (!facadeEditState.dataObj || typeof facadeEditState.dataObj !== 'object') {
        facadeEditState.dataObj = {
          materials: [],
          additional_materials: {},
          prices: {},
          prices_edge: {},
          types: {},
          types_radius: {},
          types_double: {},
          types_triple: {},
          double_offset: 0,
          triple_decor_model: { model: '', model_file: '', current_model: '', height: 0, thickness: 0, offset: 0 },
          rec_cornice: '0',
          additions: [],
          decor_prices: [],
          size_prices: [],
        };
      }
      if (!facadeEditState.dataObj.types || typeof facadeEditState.dataObj.types !== 'object') {
        facadeEditState.dataObj.types = {};
      }
      if (!Array.isArray(facadeEditState.dataObj.additions)) {
        facadeEditState.dataObj.additions = [];
      }
      if (!Array.isArray(facadeEditState.dataObj.decor_prices)) {
        facadeEditState.dataObj.decor_prices = [];
      }
      if (!Array.isArray(facadeEditState.dataObj.size_prices)) {
        facadeEditState.dataObj.size_prices = [];
      }
      return facadeEditState.dataObj;
    }

    function renderFacadeModelsList() {
      const dataObj = getFacadeDataObject();
      const listEl = document.getElementById('facade-models-list');
      const emptyEl = document.getElementById('facade-model-empty');
      const formEl = document.getElementById('facade-model-form');
      if (!listEl || !emptyEl) return;

      const typeKeys = Object.keys(dataObj.types || {}).sort((a, b) => Number(a) - Number(b));
      listEl.innerHTML = '';
      if (!typeKeys.length) {
        emptyEl.style.display = 'block';
        if (formEl) formEl.style.display = 'none';
        facadeEditState.currentTypeKey = null;
        return;
      }

      emptyEl.style.display = 'none';

      typeKeys.forEach((key) => {
        const type = dataObj.types[key] || {};
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-default btn-block text-left' + (facadeEditState.currentTypeKey === key ? ' active' : '');
        btn.style.marginBottom = '6px';
        btn.textContent = (type.name || `Без названия (${key})`).toString();
        btn.dataset.typeKey = key;
        btn.addEventListener('click', () => {
          facadeEditState.currentTypeKey = key;
          renderFacadeModelsList();
          fillFacadeModelForm();
        });
        listEl.appendChild(btn);
      });

      if (!facadeEditState.currentTypeKey) {
        facadeEditState.currentTypeKey = typeKeys[0];
      }
      fillFacadeModelForm();
    }

    function fillFacadeModelForm() {
      const dataObj = getFacadeDataObject();
      const key = facadeEditState.currentTypeKey;
      const formEl = document.getElementById('facade-model-form');
      const emptyEl = document.getElementById('facade-model-empty');
      if (!formEl || !emptyEl) return;
      const type = key != null ? (dataObj.types[key] || {}) : null;
      if (!type) {
        formEl.style.display = 'none';
        emptyEl.style.display = 'block';
        return;
      }

      emptyEl.style.display = 'none';
      formEl.style.display = 'block';

      const nameInput = document.getElementById('facade-model-name');
      const weightInput = document.getElementById('facade-model-weight');
      const thicknessInput = document.getElementById('facade-model-thickness');
      const radiusCheckbox = document.getElementById('facade-model-radius');
      const sideCheckbox = document.getElementById('facade-model-side');
      const compatSelect = document.getElementById('facade-model-compatibility');

      if (nameInput) nameInput.value = type.name || '';
      if (weightInput) weightInput.value = type.weight != null ? String(type.weight) : '';
      if (thicknessInput) thicknessInput.value = type.thickness != null ? String(type.thickness) : '';
      if (radiusCheckbox) radiusCheckbox.checked = (type.radius ?? 0) == 1;
      if (sideCheckbox) sideCheckbox.checked = (type.side ?? 0) == 1;

      if (compatSelect) {
        compatSelect.value = (type.compatibility || '').toString();
      }

      // Иконка модели
      (function initModelIconPreview() {
        const placeholder = document.getElementById('facade-model-icon-placeholder');
        const wrapper = document.getElementById('facade-model-icon-preview-wrapper');
        const img = document.getElementById('facade-model-icon-preview');
        const hidden = document.getElementById('facade-model-icon');
        const path = (type.icon || '').toString();
        if (hidden) hidden.value = path;
        if (!placeholder || !wrapper || !img) return;
        if (path) {
          img.src = path;
          wrapper.style.display = 'block';
          placeholder.style.display = 'none';
        } else {
          wrapper.style.display = 'none';
          placeholder.style.display = 'flex';
        }
      })();

      // Карта нормали
      (function initModelNormalPreview() {
        const placeholder = document.getElementById('facade-model-normal-placeholder');
        const wrapper = document.getElementById('facade-model-normal-preview-wrapper');
        const img = document.getElementById('facade-model-normal-preview');
        const hidden = document.getElementById('facade-model-normal');
        const path = (type.normal_map || '').toString();
        if (hidden) hidden.value = path;
        if (!placeholder || !wrapper || !img) return;
        if (path) {
          img.src = path;
          wrapper.style.display = 'block';
          placeholder.style.display = 'none';
        } else {
          wrapper.style.display = 'none';
          placeholder.style.display = 'flex';
        }
      })();

      renderFacadeModelSizesList();
    }

    function updateFacadeModelFromForm() {
      const dataObj = getFacadeDataObject();
      const key = facadeEditState.currentTypeKey;
      if (key == null) return;
      if (!dataObj.types[key]) dataObj.types[key] = {};
      const type = dataObj.types[key];

      const nameInput = document.getElementById('facade-model-name');
      const weightInput = document.getElementById('facade-model-weight');
      const thicknessInput = document.getElementById('facade-model-thickness');
      const radiusCheckbox = document.getElementById('facade-model-radius');
      const sideCheckbox = document.getElementById('facade-model-side');
      const compatSelect = document.getElementById('facade-model-compatibility');

      if (nameInput) type.name = nameInput.value.trim();
      if (weightInput) {
        const w = parseFloat(weightInput.value.replace(',', '.'));
        if (!Number.isNaN(w)) type.weight = w;
      }
      if (thicknessInput) {
        const t = parseFloat(thicknessInput.value.replace(',', '.'));
        if (!Number.isNaN(t)) type.thickness = t;
      }
      if (radiusCheckbox) type.radius = radiusCheckbox.checked ? 1 : 0;
      if (sideCheckbox) type.side = sideCheckbox.checked ? 1 : 0;
      if (compatSelect) type.compatibility = compatSelect.value || '';
      const iconHidden = document.getElementById('facade-model-icon');
      if (iconHidden) type.icon = iconHidden.value || '';
      const normalHidden = document.getElementById('facade-model-normal');
      if (normalHidden) type.normal_map = normalHidden.value || '';
    }

    function getCurrentFacadeTypeSizes() {
      const dataObj = getFacadeDataObject();
      const key = facadeEditState.currentTypeKey;
      if (key == null) return [];
      if (!dataObj.types[key]) dataObj.types[key] = {};
      if (!Array.isArray(dataObj.types[key].items)) dataObj.types[key].items = [];
      return dataObj.types[key].items;
    }

    function renderFacadeModelSizesList() {
      const host = document.getElementById('facade-model-sizes-list');
      if (!host) return;
      const sizes = getCurrentFacadeTypeSizes();
      if (!sizes.length) {
        host.innerHTML = '<div style="padding:6px; color:#6b7280; font-size:12px;">Размерный ряд пока не задан. Нажмите «Добавить», чтобы создать первую запись.</div>';
        return;
      }
      const rowsHtml = sizes.map((row, idx) => {
        const esc = v => (v == null ? '' : String(v)).replace(/"/g, '&quot;');
        return `
          <div class="panel panel-default" data-size-index="${idx}" style="margin-bottom:8px;">
            <div class="panel-body" style="padding:10px 12px;">
              <div class="row" style="margin-bottom:8px;">
                <div class="col-sm-9">
                  <label style="font-size:12px; color:#6b7280;">3D модель</label>
                  <input type="text" class="form-control facade-size-model" value="${esc(row.model || '')}" placeholder="/models/facades/...">
                </div>
                <div class="col-sm-3">
                  <label style="font-size:12px; color:transparent;">Выберите файл</label>
                  <button type="button" class="btn btn-default btn-block facade-size-model-pick">Выберите файл</button>
                  <input type="file" class="facade-size-model-file" accept=".fbx,.glb,.gltf,.obj,.stl" style="display:none;">
                </div>
              </div>
              <div class="row" style="margin-bottom:6px;">
                <div class="col-sm-3">
                  <label style="font-size:12px; color:#6b7280;">Ширина от (мм.)</label>
                  <input type="number" class="form-control facade-size-min-width" value="${esc(row.min_width || 0)}">
                </div>
                <div class="col-sm-3">
                  <label style="font-size:12px; color:#6b7280;">Ширина до (мм.)</label>
                  <input type="number" class="form-control facade-size-max-width" value="${esc(row.max_width || 0)}">
                </div>
                <div class="col-sm-3">
                  <label style="font-size:12px; color:#6b7280;">Высота от (мм.)</label>
                  <input type="number" class="form-control facade-size-min-height" value="${esc(row.min_height || 0)}">
                </div>
                <div class="col-sm-3">
                  <label style="font-size:12px; color:#6b7280;">Высота до (мм.)</label>
                  <input type="number" class="form-control facade-size-max-height" value="${esc(row.max_height || 0)}">
                </div>
              </div>
              <div class="row" style="margin-top:4px; align-items:center;">
                <div class="col-sm-4">
                  <div style="font-size:11px; color:#6b7280;">
                    Данная модель будет применяться при размерах фасада от 0x0 мм.
                  </div>
                </div>
                <div class="col-sm-3">
                  <label style="font-size:12px; color:#6b7280;">Группа</label>
                  <select class="form-control facade-size-group">
                    <option value="all"${row.group === 'all' || !row.group ? ' selected' : ''}>Все</option>
                    <option value="top"${row.group === 'top' ? ' selected' : ''}>Верх</option>
                    <option value="bottom"${row.group === 'bottom' ? ' selected' : ''}>Низ</option>
                    <option value="left"${row.group === 'left' ? ' selected' : ''}>Левое</option>
                    <option value="right"${row.group === 'right' ? ' selected' : ''}>Правое</option>
                  </select>
                </div>
                <div class="col-sm-3">
                  <label style="font-size:12px; color:#6b7280;">Открывание</label>
                  <select class="form-control facade-size-opening">
                    <option value=""${!row.opening ? ' selected' : ''}>Все</option>
                    <option value="left"${row.opening === 'left' ? ' selected' : ''}>Левое</option>
                    <option value="right"${row.opening === 'right' ? ' selected' : ''}>Правое</option>
                    <option value="up"${row.opening === 'up' ? ' selected' : ''}>Вверх</option>
                    <option value="down"${row.opening === 'down' ? ' selected' : ''}>Вниз</option>
                  </select>
                </div>
                <div class="col-sm-2" style="text-align:right; margin-top:18px;">
                  <button type="button" class="btn btn-danger btn-outline facade-size-delete" title="Удалить"><i class="fa fa-trash"></i></button>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
      host.innerHTML = rowsHtml;

      const sizesArr = getCurrentFacadeTypeSizes();
      host.querySelectorAll('.panel[data-size-index]').forEach(panelEl => {
        const idx = parseInt(panelEl.getAttribute('data-size-index') || '0', 10) || 0;
        const rec = sizesArr[idx] || (sizesArr[idx] = {});
        const bindNum = (selector, prop) => {
          const input = panelEl.querySelector(selector);
          if (!input) return;
          input.addEventListener('change', () => {
            const v = parseFloat((input.value || '0').replace(',', '.'));
            rec[prop] = Number.isNaN(v) ? 0 : v;
          });
        };
        const bindStr = (selector, prop) => {
          const input = panelEl.querySelector(selector);
          if (!input) return;
          input.addEventListener('change', () => {
            rec[prop] = (input.value || '').toString();
          });
        };
        bindStr('.facade-size-model', 'model');
        bindNum('.facade-size-min-width', 'min_width');
        bindNum('.facade-size-max-width', 'max_width');
        bindNum('.facade-size-min-height', 'min_height');
        bindNum('.facade-size-max-height', 'max_height');
        bindStr('.facade-size-group', 'group');
        bindStr('.facade-size-opening', 'opening');

        const delBtn = panelEl.querySelector('.facade-size-delete');
        if (delBtn) {
          delBtn.addEventListener('click', () => {
            const arr = getCurrentFacadeTypeSizes();
            if (idx >= 0 && idx < arr.length) {
              arr.splice(idx, 1);
              renderFacadeModelSizesList();
            }
          });
        }

        // Обработчики выбора файла 3D-модели
        const pickBtn = panelEl.querySelector('.facade-size-model-pick');
        const fileInput = panelEl.querySelector('.facade-size-model-file');
        const modelInput = panelEl.querySelector('.facade-size-model');

        if (pickBtn && fileInput && modelInput) {
          pickBtn.addEventListener('click', (e) => {
            e.preventDefault();
            fileInput.click();
          });

          fileInput.addEventListener('change', async () => {
            try {
              if (!fileInput.files || !fileInput.files.length) return;
              const file = fileInput.files[0];
              const fd = new FormData();
              fd.append('file', file);

              const resp = await fetch('/api/upload/facade_model', {
                method: 'POST',
                body: fd
              });
              if (!resp.ok) {
                throw new Error('HTTP ' + resp.status);
              }
              const data = await resp.json();
              if (!data || !data.url) {
                throw new Error('Нет url в ответе');
              }

              const url = data.url;
              modelInput.value = url;
              rec.model = url;
              if (window.toastr) {
                window.toastr.success('3D модель загружена');
              }
            } catch (err) {
              console.error('❌ Ошибка загрузки 3D модели фасада:', err);
              alert('Ошибка загрузки 3D модели');
            } finally {
              if (fileInput) fileInput.value = '';
            }
          });
        }
      });
    }

    function addFacadeModelSize() {
      const sizes = getCurrentFacadeTypeSizes();
      sizes.push({
        model: '',
        min_width: 0,
        max_width: 0,
        min_height: 0,
        max_height: 0,
        group: 'all',
        opening: ''
      });
      renderFacadeModelSizesList();
    }

    function getFacadeAdditionsArray() {
      const dataObj = getFacadeDataObject();
      if (!Array.isArray(dataObj.additions)) dataObj.additions = [];
      return dataObj.additions;
    }

    async function loadMaterialsGroupsForFacade() {
      // Для выпадающих списков декоров фасадов используем дерево категорий LDSP (material_2),
      // чтобы в мультиселекте были «Clodis → фасады однотонные / фасады древесные» и т.п., как в рефе.
      if (Array.isArray(facadeEditState.materialsGroups) && facadeEditState.materialsGroups.length) {
        return facadeEditState.materialsGroups;
      }
      try {
        const cats = await loadFacadeDecorCategories();
        const withNames = cats.map(c => {
          const id = (c.id ?? c.value ?? '').toString();
          const fullName = buildMaterialCategoryFullName(c, cats) || (c.name ?? id).toString();
          return {
            ...c,
            id,
            key: id,
            name: fullName,
          };
        });
        facadeEditState.materialsGroups = withNames;
        return withNames;
      } catch (e) {
        console.warn('⚠️ Не удалось загрузить категории LDSP для фасадных декоров:', e);
        facadeEditState.materialsGroups = [];
        return [];
      }
    }

    async function loadFacadePricesCategories() {
      if (Array.isArray(facadePricesCategoriesCache.list)) {
        return facadePricesCategoriesCache.list;
      }
      try {
        const resp = await fetch('/api/catalog/categories_get/material_2?t=' + Date.now(), { cache: 'no-cache' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = await resp.json();
        const arr = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
        facadePricesCategoriesCache.list = arr;
        return arr;
      } catch (e) {
        console.warn('⚠️ Не удалось загрузить категории LDSP для цен фасадов:', e);
        facadePricesCategoriesCache.list = [];
        return [];
      }
    }

    function buildCategoryTreeHtml(categories, selectedIds) {
      const byId = {};
      categories.forEach(c => { byId[String(c.id)] = c; });

      const children = {};
      categories.forEach(c => {
        const pid = c.parent == null ? 0 : Number(c.parent) || 0;
        if (!children[pid]) children[pid] = [];
        children[pid].push(c);
      });

      const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

      function renderNode(c, level) {
        const id = String(c.id);
        const name = esc(c.name || id);
        const checked = selectedIds.has(id) ? ' checked' : '';
        const pad = 10 + level * 16;
        let html = `
          <div style="padding-left:${pad}px; margin:2px 0;">
            <label style="font-weight:normal; font-size:13px;">
              <input type="checkbox" class="facade-materials-modal-cat" value="${id}"${checked}>
              ${name}
            </label>
          </div>
        `;
        const kids = children[c.id] || [];
        kids.forEach(ch => { html += renderNode(ch, level + 1); });
        return html;
      }

      const roots = (children[0] || []).concat(children[null] || []);
      let out = '';
      roots.forEach(r => { out += renderNode(r, 0); });
      return out || '<div style="color:#6b7280; font-size:13px;">Категории не найдены.</div>';
    }

    async function openFacadeMaterialsSelector() {
      const selectorBlock = document.getElementById('facade-prices-materials-selector');
      const treeBlock = document.getElementById('facade-prices-materials-tree');
      if (!selectorBlock || !treeBlock) return;
      
      treeBlock.innerHTML = 'Загрузка категорий...';
      selectorBlock.style.display = 'block';

      const cats = await loadFacadePricesCategories();
      const dataObj = getFacadeDataObject();
      const selected = new Set(
        Array.isArray(dataObj.materials) ? dataObj.materials.map(x => String(x)) : []
      );

      treeBlock.innerHTML = buildCategoryTreeHtml(cats, selected);
    }

    async function applyFacadeMaterialsFromSelector() {
      const selectorBlock = document.getElementById('facade-prices-materials-selector');
      if (!selectorBlock) return;
      const checkboxes = selectorBlock.querySelectorAll('.facade-materials-modal-cat');
      const selectedIds = [];
      checkboxes.forEach(cb => {
        if (cb.checked) selectedIds.push(cb.value);
      });

      const dataObj = getFacadeDataObject();
      dataObj.materials = selectedIds.slice();

      const typeKeys = Object.keys(dataObj.types || {});
      if (!dataObj.prices || typeof dataObj.prices !== 'object') dataObj.prices = {};
      typeKeys.forEach(tKey => {
        if (!dataObj.prices[tKey] || typeof dataObj.prices[tKey] !== 'object') {
          dataObj.prices[tKey] = {};
        }
        selectedIds.forEach(catId => {
          const row = dataObj.prices[tKey][catId];
          if (!row || typeof row !== 'object') {
            dataObj.prices[tKey][catId] = { price: 0, parent: 0 };
          }
        });
      });

      await renderMainDecors();
      await renderFacadePricesMaterialsTable();
      selectorBlock.style.display = 'none';
    }

    async function renderMainDecors() {
      const select = document.getElementById('facade-main-materials-select');
      if (!select) return;
      const dataObj = getFacadeDataObject();
      const groups = await loadMaterialsGroupsForFacade();

      const options = groups.map(g => {
        const val = (g.key ?? g.id ?? '').toString();
        const name = (g.name ?? val).toString();
        const escVal = val.replace(/"/g, '&quot;');
        const escName = name.replace(/</g, '&lt;');
        return `<option value="${escVal}">${escName}</option>`;
      });
      select.innerHTML = options.join('');

      const selectedIds = Array.isArray(dataObj.materials) ? dataObj.materials.map(x => x.toString()) : [];
      Array.from(select.options).forEach(opt => {
        opt.selected = selectedIds.includes(opt.value);
      });
      updateMainDecorsDisplayFromSelect();
    }

    function updateMainDecorsFromUI() {
      const select = document.getElementById('facade-main-materials-select');
      if (!select) return;
      const dataObj = getFacadeDataObject();
      const selected = Array.from(select.options)
        .filter(o => o.selected)
        .map(o => o.value.toString());
      dataObj.materials = selected;
    }

    function updateMainDecorsDisplayFromSelect() {
      const select = document.getElementById('facade-main-materials-select');
      const input = document.getElementById('facade-main-materials-input');
      if (!select || !input) return;
      const labels = Array.from(select.options)
        .filter(o => o.selected)
        .map(o => (o.textContent || '').trim())
        .filter(Boolean);
      if (!labels.length) {
        input.value = '';
        input.placeholder = 'Выберите категории';
      } else {
        input.value = labels.join(', ');
      }
    }

    function ensureAdditionalMaterialsObject() {
      const dataObj = getFacadeDataObject();
      if (!dataObj.additional_materials || typeof dataObj.additional_materials !== 'object') {
        dataObj.additional_materials = {};
      }
      return dataObj.additional_materials;
    }

    async function renderExtraMaterialsList() {
      const listEl = document.getElementById('facade-extra-materials-list');
      const emptyEl = document.getElementById('facade-extra-materials-empty');
      const formEl = document.getElementById('facade-extra-materials-form');
      if (!listEl || !emptyEl || !formEl) return;

      const additional = ensureAdditionalMaterialsObject();
      const keys = Object.keys(additional);

      listEl.innerHTML = '';
      if (!keys.length) {
        emptyEl.style.display = 'block';
        formEl.style.display = 'none';
        facadeEditState.extraMaterialsCurrentKey = null;
        return;
      }

      emptyEl.style.display = 'none';

      keys.forEach(key => {
        const item = additional[key] || {};
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-default btn-block text-left' + (facadeEditState.extraMaterialsCurrentKey === key ? ' active' : '');
        btn.style.marginBottom = '6px';
        btn.textContent = (item.name || key || 'Без названия').toString();
        btn.dataset.extraKey = key;
        btn.addEventListener('click', () => {
          facadeEditState.extraMaterialsCurrentKey = key;
          renderExtraMaterials();
        });
        listEl.appendChild(btn);
      });

      if (!facadeEditState.extraMaterialsCurrentKey) {
        facadeEditState.extraMaterialsCurrentKey = keys[0];
      }
    }

    async function fillExtraMaterialForm() {
      const formEl = document.getElementById('facade-extra-materials-form');
      const emptyEl = document.getElementById('facade-extra-materials-empty');
      if (!formEl || !emptyEl) return;
      const additional = ensureAdditionalMaterialsObject();
      const key = facadeEditState.extraMaterialsCurrentKey;
      if (!key || !Object.prototype.hasOwnProperty.call(additional, key)) {
        formEl.style.display = 'none';
        emptyEl.style.display = 'block';
        return;
      }

      const item = additional[key] || {};
      formEl.style.display = 'block';
      emptyEl.style.display = 'none';

      const nameInput = document.getElementById('facade-extra-material-name');
      const keyInput = document.getElementById('facade-extra-material-key');
      const canSelectInput = document.getElementById('facade-extra-material-can-select');
      const catsSelect = document.getElementById('facade-extra-material-categories');
      const defInput = document.getElementById('facade-extra-material-default');

      if (nameInput) nameInput.value = item.name || '';
      if (keyInput) keyInput.value = item.key || key;
      if (canSelectInput) canSelectInput.checked = !!item.can_select;
      if (defInput) defInput.value = item.default || '';

      if (catsSelect) {
        const groups = Array.isArray(facadeEditState.materialsGroups) ? facadeEditState.materialsGroups : [];
        const cats = Array.isArray(item.categories) ? item.categories.map(x => x.toString()) : [];
        const options = groups.map(g => {
          const val = (g.key ?? g.id ?? '').toString();
          const name = (g.name ?? val).toString();
          const escVal = val.replace(/"/g, '&quot;');
          const escName = name.replace(/</g, '&lt;');
          const selected = cats.includes(val) ? ' selected' : '';
          return `<option value="${escVal}"${selected}>${escName}</option>`;
        });
        catsSelect.innerHTML = options.join('');
        updateExtraMaterialCategoriesDisplayFromSelect();
      }
    }

    async function renderExtraMaterials() {
      await loadMaterialsGroupsForFacade();
      await renderExtraMaterialsList();
      await fillExtraMaterialForm();
    }

    function updateCurrentExtraMaterialFromForm() {
      const additional = ensureAdditionalMaterialsObject();
      const key = facadeEditState.extraMaterialsCurrentKey;
      if (!key || !Object.prototype.hasOwnProperty.call(additional, key)) return;
      const item = additional[key] || {};

      const nameInput = document.getElementById('facade-extra-material-name');
      const keyInput = document.getElementById('facade-extra-material-key');
      const canSelectInput = document.getElementById('facade-extra-material-can-select');
      const catsSelect = document.getElementById('facade-extra-material-categories');
      const defInput = document.getElementById('facade-extra-material-default');

      if (nameInput) item.name = nameInput.value.trim();
      if (keyInput) item.key = keyInput.value.trim() || key;
      if (canSelectInput) item.can_select = canSelectInput.checked ? 1 : 0;
      if (defInput) item.default = defInput.value.trim();
      if (catsSelect) {
        const cats = Array.from(catsSelect.options)
          .filter(o => o.selected)
          .map(o => o.value.toString());
        item.categories = cats;
      }

      additional[key] = item;
    }

    function updateExtraMaterialCategoriesDisplayFromSelect() {
      const catsSelect = document.getElementById('facade-extra-material-categories');
      const catsInput = document.getElementById('facade-extra-material-categories-input');
      if (!catsSelect || !catsInput) return;
      const labels = Array.from(catsSelect.options)
        .filter(o => o.selected)
        .map(o => (o.textContent || '').trim())
        .filter(Boolean);
      if (!labels.length) {
        catsInput.value = '';
        catsInput.placeholder = 'Выберите категории';
      } else {
        catsInput.value = labels.join(', ');
      }
    }

    function addExtraMaterial() {
      const additional = ensureAdditionalMaterialsObject();
      let idx = 0;
      while (Object.prototype.hasOwnProperty.call(additional, 'extra_' + idx)) idx += 1;
      const newKey = 'extra_' + idx;
      additional[newKey] = {
        name: '',
        key: newKey,
        can_select: 1,
        categories: [],
        default: ''
      };
      facadeEditState.extraMaterialsCurrentKey = newKey;
      renderExtraMaterials();
    }

    async function ensureFacadePricesInitializedForCurrentFacade() {
      const dataObj = getFacadeDataObject();
      if (!dataObj || typeof dataObj !== 'object') return;

      const types = dataObj.types || {};
      const hasTypes = Object.keys(types || {}).length > 0;
      const hasPrices = dataObj.prices && Object.keys(dataObj.prices || {}).length > 0;
      if (!hasTypes || hasPrices) {
        // Нет типов фасадов или цены уже инициализированы — ничего не делаем.
        return;
      }

      // Берём все категории LDSP/ПВХ, чтобы сразу получить
      // "список цен" как в рефе (строки = категории материалов).
      const categories = await loadFacadePricesCategories();
      const materialIds = Array.from(new Set(
        (categories || [])
          .map(c => String(c.id || ''))
          .filter(Boolean)
      ));

      if (!materialIds.length) return;

      // Сохраняем выбранные категории в dataObj.materials,
      // чтобы "Основные декоры" и цены опирались на один и тот же набор.
      dataObj.materials = materialIds.slice();

      if (!dataObj.prices || typeof dataObj.prices !== 'object') dataObj.prices = {};
      const typeKeys = Object.keys(types || {});
      typeKeys.forEach((tKey) => {
        if (!dataObj.prices[tKey] || typeof dataObj.prices[tKey] !== 'object') {
          dataObj.prices[tKey] = {};
        }
        materialIds.forEach((catId) => {
          if (!dataObj.prices[tKey][catId] || typeof dataObj.prices[tKey][catId] !== 'object') {
            dataObj.prices[tKey][catId] = { price: 0, parent: 0 };
          }
        });
      });
    }

    async function renderFacadePricesMaterialsTable() {
      const host = document.getElementById('facade-prices-materials-table-wrapper');
      if (!host) return;

      // Гарантируем, что для фасадов с уже заданными моделями,
      // но без цен, матрица цен инициализирована (как в рефе).
      await ensureFacadePricesInitializedForCurrentFacade();

      const dataObj = getFacadeDataObject();
      const prices = dataObj && typeof dataObj === 'object' ? (dataObj.prices || {}) : {};
      const types = dataObj && typeof dataObj === 'object' ? (dataObj.types || {}) : {};

      // Ключи типов фасада: берём из types, а если там пусто — из существующих цен
      const typeKeysSet = new Set();
      Object.keys(types || {}).forEach((k) => typeKeysSet.add(String(k)));
      Object.keys(prices || {}).forEach((k) => typeKeysSet.add(String(k)));
      const typeKeys = Array.from(typeKeysSet).sort((a, b) => Number(a) - Number(b));

      // Список категорий материалов для цен:
      // - все категории, выбранные в "Основных декорах" (dataObj.materials),
      // - плюс все ID, встречающиеся в prices[*].
      const matIdSet = new Set();
      if (Array.isArray(dataObj.materials)) {
        dataObj.materials.forEach((id) => matIdSet.add(String(id)));
      }
      Object.keys(prices || {}).forEach((tKey) => {
        const grp = prices[tKey] || {};
        Object.keys(grp || {}).forEach((matId) => matIdSet.add(String(matId)));
      });
      const matIds = Array.from(matIdSet);

      // Если нет категорий материалов - показываем пусто (как в рефе)
      if (!matIds.length) {
        host.innerHTML = '';
        return;
      }

      // Если есть материалы, но нет типов - показываем подсказку
      if (!typeKeys.length) {
        host.innerHTML = '<p style="color:#6b7280; font-size:13px; margin-top:10px;">Сначала добавьте типы фасадов во вкладке "Модели"</p>';
        return;
      }

      // Загружаем категории LDSP для получения названий
      const categories = await loadFacadePricesCategories();
      const catById = {};
      categories.forEach((c) => {
        const id = String(c.id || '');
        if (id) catById[id] = c;
      });

      const getCatName = (id) => {
        const c = catById[id];
        if (!c) return id;
        return buildMaterialCategoryFullName(c, categories) || (c.name || id).toString();
      };

      const getTypeName = (key) => {
        const t = types[key];
        return (t && t.name) ? t.name.toString() : key.toString();
      };

      let html = '<div class="table-responsive"><table class="table table-bordered table-sm" style="margin-bottom:8px;"><thead><tr>';
      html += '<th>Категория материала</th>';
      typeKeys.forEach((tKey) => {
        html += `<th>${getTypeName(tKey).replace(/</g, '&lt;')}</th>`;
      });
      html += '</tr></thead><tbody>';

      matIds.forEach((matId) => {
        const escId = String(matId).replace(/"/g, '&quot;');
        html += `<tr><td>${getCatName(escId).replace(/</g, '&lt;')}</td>`;
        typeKeys.forEach((tKey) => {
          const grp = prices[tKey] || {};
          const row = grp[matId];
          let price = '';
          if (row && typeof row === 'object') {
            price = row.price != null ? String(row.price) : '';
          } else if (typeof row === 'number') {
            price = String(row);
          }
          const escType = String(tKey).replace(/"/g, '&quot;');
          const escPrice = (price || '0').replace(/"/g, '&quot;');
          html += `<td>
            <input type="number"
                   class="form-control form-control-sm facade-price-input"
                   data-facade-price-type="${escType}"
                   data-facade-price-mat="${escId}"
                   step="1"
                   value="${escPrice}">
          </td>`;
        });
        html += '</tr>';
      });

      html += '</tbody></table></div>';
      host.innerHTML = html;

      // Привязка изменений к dataObj.prices (typeKey → matId → {price,parent})
      host.querySelectorAll('.facade-price-input').forEach((input) => {
        input.addEventListener('change', () => {
          const typeKey = input.getAttribute('data-facade-price-type') || '';
          const matId = input.getAttribute('data-facade-price-mat') || '';
          if (!typeKey || !matId) return;
          const v = parseFloat((input.value || '0').replace(',', '.'));
          const num = Number.isNaN(v) ? 0 : v;

          const obj = getFacadeDataObject();
          if (!obj.prices || typeof obj.prices !== 'object') obj.prices = {};
          if (!obj.prices[typeKey] || typeof obj.prices[typeKey] !== 'object') obj.prices[typeKey] = {};
          const row = obj.prices[typeKey][matId] && typeof obj.prices[typeKey][matId] === 'object'
            ? obj.prices[typeKey][matId]
            : { parent: 0 };
          row.price = num;
          obj.prices[typeKey][matId] = row;
        });
      });
    }

    function renderFacadePricesEdgesTable() {
      const host = document.getElementById('facade-prices-edges-table-wrapper');
      if (!host) return;
      const dataObj = getFacadeDataObject();
      const prices = dataObj && typeof dataObj === 'object' ? (dataObj.prices_edge || {}) : {};
      const typeKeys = Object.keys(prices || {});

      if (!typeKeys.length) {
        // Как в рефе: для нового фасада вкладка "Кромка" показывает только заголовок и пустую полоску
        host.innerHTML = '';
        return;
      }

      let html = '';
      typeKeys.forEach((typeKey) => {
        const group = prices[typeKey] || {};
        const matIds = Object.keys(group || {});
        if (!matIds.length) return;
        html += `<h5 style="margin-top:10px; font-size:14px; font-weight:600;">Тип фасада ${String(typeKey)}</h5>`;
        html += '<div class="table-responsive"><table class="table table-bordered table-sm" style="margin-bottom:8px;"><thead><tr><th style="width:90px;">ID материала</th><th>Цена, м.п.</th></tr></thead><tbody>';
        matIds.forEach((matId) => {
          const row = group[matId];
          let price = '';
          if (row && typeof row === 'object') {
            price = row.price != null ? String(row.price) : '';
          } else if (typeof row === 'number') {
            price = String(row);
          }
          const escId = String(matId).replace(/"/g, '&quot;');
          const escType = String(typeKey).replace(/"/g, '&quot;');
          const escPrice = (price || '0').replace(/"/g, '&quot;');
          html += `<tr>
            <td>${escId}</td>
            <td>
              <input type="number"
                     class="form-control form-control-sm facade-edge-price-input"
                     data-facade-edge-type="${escType}"
                     data-facade-edge-id="${escId}"
                     step="1"
                     value="${escPrice}">
            </td>
          </tr>`;
        });
        html += '</tbody></table></div>';
      });

      host.innerHTML = html || '<div style="padding:8px; color:#6b7280;">Нет данных о ценах кромки для этого фасада.</div>';

      // Привязка изменений к dataObj.prices_edge
      host.querySelectorAll('.facade-edge-price-input').forEach((input) => {
        input.addEventListener('change', () => {
          const typeKey = input.getAttribute('data-facade-edge-type') || '';
          const edgeId = input.getAttribute('data-facade-edge-id') || '';
          if (!typeKey || !edgeId) return;
          const v = parseFloat((input.value || '0').replace(',', '.'));
          const num = Number.isNaN(v) ? 0 : v;

          const obj = getFacadeDataObject();
          if (!obj.prices_edge || typeof obj.prices_edge !== 'object') obj.prices_edge = {};
          if (!obj.prices_edge[typeKey] || typeof obj.prices_edge[typeKey] !== 'object') obj.prices_edge[typeKey] = {};
          const row = obj.prices_edge[typeKey][edgeId] && typeof obj.prices_edge[typeKey][edgeId] === 'object'
            ? obj.prices_edge[typeKey][edgeId]
            : { parent: 0 };
          row.price = num;
          obj.prices_edge[typeKey][edgeId] = row;
        });
      });
    }

    function renderFacadePricesDecorsTable() {
      const host = document.getElementById('facade-prices-decors-table-wrapper');
      if (!host) return;

      const dataObj = getFacadeDataObject();
      const types = dataObj && typeof dataObj === 'object' ? (dataObj.types || {}) : {};
      const rows = Array.isArray(dataObj.decor_prices) ? dataObj.decor_prices : [];

      const typeKeys = Object.keys(types || {});
      if (!typeKeys.length) {
        host.innerHTML = '<p style="color:#6b7280; font-size:13px; margin-top:10px;">Сначала добавьте типы фасадов во вкладке "Модели".</p>';
        return;
      }

      if (!rows.length) {
        host.innerHTML = '<p style="color:#6b7280; font-size:13px; margin-top:10px;">Индивидуальные декоры ещё не добавлены. Нажмите "Добавить декор", чтобы создать первую строку.</p>';
        return;
      }

      const getTypeName = (key) => {
        const t = types[key];
        return (t && t.name) ? t.name.toString() : key.toString();
      };

      let html = '<div class="table-responsive"><table class="table table-bordered table-sm" style="margin-bottom:8px;"><thead><tr>';
      html += '<th style="width:140px;">Артикул</th>';
      html += '<th>Название</th>';
      typeKeys.forEach((tKey) => {
        html += `<th style="width:100px;">${getTypeName(tKey).replace(/</g, '&lt;')}</th>`;
      });
      html += '<th style="width:70px;"></th>';
      html += '</tr></thead><tbody>';

      rows.forEach((row, idx) => {
        const article = (row && row.article ? String(row.article) : '').replace(/"/g, '&quot;');
        const name = (row && row.name ? String(row.name) : '').replace(/"/g, '&quot;');
        html += `<tr data-row-index="${idx}">`;
        html += `<td><input type="text" class="form-control form-control-sm facade-decor-article-input" data-row-index="${idx}" value="${article}"></td>`;
        html += `<td><input type="text" class="form-control form-control-sm facade-decor-name-input" data-row-index="${idx}" value="${name}"></td>`;
        typeKeys.forEach((tKey) => {
          const pricesMap = (row && row.prices && typeof row.prices === 'object') ? row.prices : {};
          const raw = pricesMap[tKey];
          const val = raw != null ? String(raw) : '';
          const escType = String(tKey).replace(/"/g, '&quot;');
          const escVal = (val || '0').replace(/"/g, '&quot;');
          html += `<td><input type="number" class="form-control form-control-sm facade-decor-price-input" data-row-index="${idx}" data-type-key="${escType}" step="1" value="${escVal}"></td>`;
        });
        html += `<td style="text-align:center;"><button type="button" class="btn btn-xs btn-danger facade-decor-delete-btn" data-row-index="${idx}">×</button></td>`;
        html += '</tr>';
      });

      html += '</tbody></table></div>';
      host.innerHTML = html;

      host.querySelectorAll('.facade-decor-article-input').forEach((input) => {
        input.addEventListener('input', () => {
          const idx = parseInt(input.getAttribute('data-row-index') || '-1', 10);
          const obj = getFacadeDataObject();
          if (!Array.isArray(obj.decor_prices) || idx < 0 || idx >= obj.decor_prices.length) return;
          const row = obj.decor_prices[idx] || (obj.decor_prices[idx] = { article: '', name: '', prices: {} });
          row.article = input.value.trim();
        });
      });

      host.querySelectorAll('.facade-decor-name-input').forEach((input) => {
        input.addEventListener('input', () => {
          const idx = parseInt(input.getAttribute('data-row-index') || '-1', 10);
          const obj = getFacadeDataObject();
          if (!Array.isArray(obj.decor_prices) || idx < 0 || idx >= obj.decor_prices.length) return;
          const row = obj.decor_prices[idx] || (obj.decor_prices[idx] = { article: '', name: '', prices: {} });
          row.name = input.value.trim();
        });
      });

      host.querySelectorAll('.facade-decor-price-input').forEach((input) => {
        input.addEventListener('change', () => {
          const idx = parseInt(input.getAttribute('data-row-index') || '-1', 10);
          const typeKey = input.getAttribute('data-type-key') || '';
          if (!typeKey) return;
          const v = parseFloat((input.value || '0').replace(',', '.'));
          const num = Number.isNaN(v) ? 0 : v;
          const obj = getFacadeDataObject();
          if (!Array.isArray(obj.decor_prices) || idx < 0 || idx >= obj.decor_prices.length) return;
          const row = obj.decor_prices[idx] || (obj.decor_prices[idx] = { article: '', name: '', prices: {} });
          if (!row.prices || typeof row.prices !== 'object') row.prices = {};
          row.prices[typeKey] = num;
        });
      });

      host.querySelectorAll('.facade-decor-delete-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-row-index') || '-1', 10);
          const obj = getFacadeDataObject();
          if (!Array.isArray(obj.decor_prices) || idx < 0 || idx >= obj.decor_prices.length) return;
          obj.decor_prices.splice(idx, 1);
          renderFacadePricesDecorsTable();
        });
      });
    }

    function renderFacadePricesSizesTable() {
      const host = document.getElementById('facade-prices-sizes-table-wrapper');
      if (!host) return;

      const dataObj = getFacadeDataObject();
      const types = dataObj && typeof dataObj === 'object' ? (dataObj.types || {}) : {};
      const rows = Array.isArray(dataObj.size_prices) ? dataObj.size_prices : [];

      const typeKeys = Object.keys(types || {});
      if (!typeKeys.length) {
        host.innerHTML = '<p style="color:#6b7280; font-size:13px; margin-top:10px;">Сначала добавьте типы фасадов во вкладке "Модели".</p>';
        return;
      }

      if (!rows.length) {
        host.innerHTML = '<p style="color:#6b7280; font-size:13px; margin-top:10px;">Правила для точных размеров ещё не добавлены. Нажмите "Добавить правило", чтобы создать первое.</p>';
        return;
      }

      const getTypeName = (key) => {
        const t = types[key];
        return (t && t.name) ? t.name.toString() : key.toString();
      };

      let html = '<div class="table-responsive"><table class="table table-bordered table-sm" style="margin-bottom:8px;"><thead><tr>';
      html += '<th style="width:130px;">Тип фасада</th>';
      html += '<th style="width:80px;">Ширина от</th>';
      html += '<th style="width:80px;">до</th>';
      html += '<th style="width:80px;">Высота от</th>';
      html += '<th style="width:80px;">до</th>';
      html += '<th style="width:90px;">Цена, м²</th>';
      html += '<th style="width:70px;"></th>';
      html += '</tr></thead><tbody>';

      const esc = (v) => (v || '').toString().replace(/"/g, '&quot;');

      rows.forEach((row, idx) => {
        const typeKey = (row && row.type != null ? String(row.type) : typeKeys[0]).replace(/"/g, '&quot;');
        const wMin = row && row.w_min != null ? String(row.w_min) : '';
        const wMax = row && row.w_max != null ? String(row.w_max) : '';
        const hMin = row && row.h_min != null ? String(row.h_min) : '';
        const hMax = row && row.h_max != null ? String(row.h_max) : '';
        const price = row && row.price != null ? String(row.price) : '';

        html += `<tr data-row-index="${idx}">`;
        html += '<td><select class="form-control form-control-sm facade-sizeprice-type-select" data-row-index="' + idx + '">';
        typeKeys.forEach((k) => {
          const selected = (k === typeKey) ? ' selected' : '';
          html += `<option value="${String(k).replace(/"/g, '&quot;')}"${selected}>${getTypeName(k).replace(/</g, '&lt;')}</option>`;
        });
        html += '</select></td>';

        html += `<td><input type="number" class="form-control form-control-sm facade-sizeprice-input" data-row-index="${idx}" data-field="w_min" step="1" value="${esc(wMin)}"></td>`;
        html += `<td><input type="number" class="form-control form-control-sm facade-sizeprice-input" data-row-index="${idx}" data-field="w_max" step="1" value="${esc(wMax)}"></td>`;
        html += `<td><input type="number" class="form-control form-control-sm facade-sizeprice-input" data-row-index="${idx}" data-field="h_min" step="1" value="${esc(hMin)}"></td>`;
        html += `<td><input type="number" class="form-control form-control-sm facade-sizeprice-input" data-row-index="${idx}" data-field="h_max" step="1" value="${esc(hMax)}"></td>`;
        html += `<td><input type="number" class="form-control form-control-sm facade-sizeprice-input" data-row-index="${idx}" data-field="price" step="1" value="${esc(price)}"></td>`;
        html += `<td style="text-align:center;"><button type="button" class="btn btn-xs btn-danger facade-sizeprice-delete-btn" data-row-index="${idx}">×</button></td>`;
        html += '</tr>';
      });

      html += '</tbody></table></div>';
      host.innerHTML = html;

      host.querySelectorAll('.facade-sizeprice-type-select').forEach((sel) => {
        sel.addEventListener('change', () => {
          const idx = parseInt(sel.getAttribute('data-row-index') || '-1', 10);
          const obj = getFacadeDataObject();
          if (!Array.isArray(obj.size_prices) || idx < 0 || idx >= obj.size_prices.length) return;
          const row = obj.size_prices[idx] || (obj.size_prices[idx] = {});
          row.type = sel.value;
        });
      });

      host.querySelectorAll('.facade-sizeprice-input').forEach((input) => {
        input.addEventListener('change', () => {
          const idx = parseInt(input.getAttribute('data-row-index') || '-1', 10);
          const field = input.getAttribute('data-field') || '';
          if (!field) return;
          const v = parseFloat((input.value || '0').replace(',', '.'));
          const num = Number.isNaN(v) ? 0 : v;
          const obj = getFacadeDataObject();
          if (!Array.isArray(obj.size_prices) || idx < 0 || idx >= obj.size_prices.length) return;
          const row = obj.size_prices[idx] || (obj.size_prices[idx] = {});
          row[field] = num;
        });
      });

      host.querySelectorAll('.facade-sizeprice-delete-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-row-index') || '-1', 10);
          const obj = getFacadeDataObject();
          if (!Array.isArray(obj.size_prices) || idx < 0 || idx >= obj.size_prices.length) return;
          obj.size_prices.splice(idx, 1);
          renderFacadePricesSizesTable();
        });
      });
    }

    function renderFacadeAccessoriesTable() {
      const tbody = document.getElementById('facade-accessories-table-body');
      if (!tbody) return;
      const additions = getFacadeAdditionsArray();

      if (!additions.length) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:10px; color:#6b7280;">Комплектующие ещё не добавлены.</td></tr>';
        return;
      }

      const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      tbody.innerHTML = additions.map((item, idx) => {
        const id = esc(item.id ?? item.accessory_id ?? '');
        const qty = esc(item.qty ?? item.count ?? 1);
        const note = esc(item.note ?? '');
        return `
          <tr data-addition-index="${idx}">
            <td>${id || '-'}</td>
            <td>${note || ''}</td>
            <td style="width:120px;">
              <input type="number" class="form-control input-sm facade-accessory-qty" value="${qty || '1'}" min="0" step="1">
            </td>
            <td style="text-align:center;">
              <button type="button" class="btn btn-xs btn-outline btn-danger facade-accessory-delete"><i class="fa fa-trash"></i></button>
            </td>
          </tr>
        `;
      }).join('');

      tbody.querySelectorAll('.facade-accessory-qty').forEach((input) => {
        input.addEventListener('change', () => {
          const tr = input.closest('tr');
          const idx = tr ? parseInt(tr.getAttribute('data-addition-index') || '0', 10) : -1;
          const additionsArr = getFacadeAdditionsArray();
          if (idx >= 0 && idx < additionsArr.length) {
            const v = parseFloat(input.value.replace(',', '.'));
            additionsArr[idx].qty = Number.isNaN(v) ? 0 : v;
          }
        });
      });

      tbody.querySelectorAll('.facade-accessory-delete').forEach((btn) => {
        btn.addEventListener('click', () => {
          const tr = btn.closest('tr');
          const idx = tr ? parseInt(tr.getAttribute('data-addition-index') || '0', 10) : -1;
          const additionsArr = getFacadeAdditionsArray();
          if (idx >= 0 && idx < additionsArr.length) {
            additionsArr.splice(idx, 1);
            renderFacadeAccessoriesTable();
          }
        });
      });
    }

    function deleteExtraMaterial(key) {
      const additional = ensureAdditionalMaterialsObject();
      if (!Object.prototype.hasOwnProperty.call(additional, key)) return;
      delete additional[key];
      if (facadeEditState.extraMaterialsCurrentKey === key) {
        facadeEditState.extraMaterialsCurrentKey = null;
      }
      renderExtraMaterials();
    }

    async function loadFacadeCategoriesForEdit() {
      try {
        // ���� ��������� �� API ������� (�� ������ FULL_REFERENCE_DATA.facades),
        // ����� ��������� ��������� � ����������.
        const resp = await fetch('/api/facades?t=' + Date.now(), { cache: 'no-cache' });
        if (!resp.ok) return;
        const data = await resp.json();
        const cats = Array.isArray(data?.categories) ? data.categories : (Array.isArray(data) ? data : []);
        const select = document.getElementById('facade-item-category');
        if (!select) return;
        const options = Array.isArray(cats)
          ? cats.map(c => {
              const id = (c?.id ?? c?.value ?? '').toString();
              const name = (c?.name ?? c?.label ?? id).toString();
              return `<option value="${id.replace(/"/g, '&quot;')}">${name.replace(/</g, '&lt;')}</option>`;
            })
          : [];
        select.innerHTML = '<option value="">(не выбрано)</option>' + options.join('');
      } catch (e) {
        console.warn('⚠️ Не удалось загрузить категории фасадов для формы:', e);
      }
    }

    async function loadCorniceForEdit() {
      try {
        const resp = await fetch('/common_assets/data/cornice.json?t=' + Date.now(), { cache: 'no-cache' });
        if (!resp.ok) return;
        const data = await resp.json();
        const select = document.getElementById('facade-item-rec-cornice');
        if (!select) return;
        const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
        const options = items.map(it => {
          const id = (it?.id ?? '').toString();
          const name = (it?.name ?? ('ID ' + id)).toString();
          return `<option value="${id.replace(/"/g, '&quot;')}">${name.replace(/</g, '&lt;')}</option>`;
        });
        select.innerHTML = '<option value="0">(не выбрано)</option>' + options.join('');
      } catch (e) {
        console.warn('⚠️ Не удалось загрузить cornice.json для формы фасада:', e);
      }
    }

    window.loadFacadeItemEdit = async function loadFacadeItemEdit(itemId) {
      try {
        const id = Number(itemId) || 0;
        const idInput = document.getElementById('facade_item_id');
        const title = document.getElementById('facade-item-edit-title');
        const successUrlInput = document.getElementById('facade_item_form_success_url');
        if (idInput) idInput.value = String(id);
        if (successUrlInput && !successUrlInput.value) successUrlInput.value = '#facades-items';

        await Promise.all([
          loadFacadeCategoriesForEdit(),
          loadCorniceForEdit(),
        ]);

        let item = null;
        if (id !== 0 && Array.isArray(window.facadesState?.allData)) {
          item = window.facadesState.allData.find(it => Number(it?.id) === id) || null;
        }
        if (!item && id !== 0) {
          const resp = await fetch(`/api/catalog/item/facades/${encodeURIComponent(String(id))}?t=${Date.now()}`, { cache: 'no-cache' });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          item = await resp.json();
        }
        if (!item) {
          item = {
            id: 0,
            name: '',
            article: '',
            code: '',
            category: '',
            order: 100000,
            active: 1,
            thickness: 16,
            side_thickness: 16,
            handle: 0,
            handle_offset: 30,
            icon: '',
            // Базовый шаблон data, максимально приближенный к структуре референса
            data: {
              materials: [],
              additional_materials: {},
              prices: {},
              prices_edge: {},
              types: {},
              types_radius: {},
              types_double: {},
              types_triple: {},
              double_offset: 0,
              triple_decor_model: { model: '', model_file: '', current_model: '', height: 0, thickness: 0, offset: 0 },
              rec_cornice: '0',
            },
          };
        }

        if (title) {
          title.textContent = id ? 'Редактировать фрезеровку' : 'Добавить фрезеровку';
        }

        const nameInput = document.getElementById('facade-item-name');
        const articleInput = document.getElementById('facade-item-article');
        const orderInput = document.getElementById('facade-item-order');
        const catSelect = document.getElementById('facade-item-category');
        const thickInput = document.getElementById('facade-item-thickness');
        const sideThickInput = document.getElementById('facade-item-side-thickness');
        const handleCheckbox = document.getElementById('facade-item-handle-enabled');
        const handleOffsetInput = document.getElementById('facade-item-handle-offset');
        const activeCheckbox = document.getElementById('facade-item-active');
        const iconHidden = document.getElementById('facade-item-icon');
        const dataJson = document.getElementById('facade-item-data-json');
        const pricesJson = document.getElementById('facade-item-prices-json');
        const notesInput = document.getElementById('facade-item-notes');
        const decorsList = document.getElementById('facade-item-decors-list');

        if (nameInput) nameInput.value = item.name || '';
        if (articleInput) articleInput.value = item.article || item.code || '';
        if (orderInput) orderInput.value = item.order != null ? String(item.order) : '100000';
        if (catSelect) catSelect.value = (Array.isArray(item.category) ? item.category[0] : item.category || '').toString();
        if (thickInput) thickInput.value = item.thickness != null ? String(item.thickness) : '16';
        if (sideThickInput) sideThickInput.value = item.side_thickness != null ? String(item.side_thickness) : '';
        if (handleCheckbox) handleCheckbox.checked = (item.handle ?? 0) == 1;
        if (handleOffsetInput) handleOffsetInput.value = item.handle_offset != null ? String(item.handle_offset) : '30';
        if (activeCheckbox) activeCheckbox.checked = (item.active ?? 1) == 1;
        if (iconHidden) iconHidden.value = item.icon || '';

        // Инициализация превью иконки
        (function initIconPreview() {
          const accUrl = (window.glob?.acc_url || '/').replace(/\/$/, '');
          const placeholder = document.getElementById('facade-item-icon-placeholder');
          const previewWrapper = document.getElementById('facade-item-icon-preview-wrapper');
          const previewImg = document.getElementById('facade-item-icon-preview');
          const iconPath = (item.icon || '').toString();
          if (previewWrapper && previewImg && placeholder) {
            if (iconPath) {
              const url = accUrl + (iconPath.startsWith('/') ? '' : '/') + iconPath;
              previewImg.src = url;
              previewWrapper.style.display = 'block';
              placeholder.style.display = 'none';
            } else {
              previewWrapper.style.display = 'none';
              placeholder.style.display = 'flex';
            }
          }
        })();

        // Разбираем поле data один раз и используем для разных вкладок
        let dataObj = null;
        try {
          dataObj = item.data && typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
        } catch (_) {
          dataObj = null;
        }

        // Сохраняем объект data в состояние формы фасада, чтобы редактировать модели через UI
        if (!dataObj || typeof dataObj !== 'object') {
          dataObj = {
            materials: [],
            additional_materials: {},
            prices: {},
            prices_edge: {},
            types: {},
            types_radius: {},
            types_double: {},
            types_triple: {},
            double_offset: 0,
            triple_decor_model: { model: '', model_file: '', current_model: '', height: 0, thickness: 0, offset: 0 },
            rec_cornice: '0',
            additions: [],
          };
        }

        facadeEditState.dataObj = dataObj;
        facadeEditState.currentTypeKey = null;
        renderFacadeModelsList();

        // Если у фасада уже есть модели, но ещё нет цен,
        // инициализируем матрицу цен по всем доступным категориям материалов,
        // чтобы сразу получить "список цен" как в рефе.
        await ensureFacadePricesInitializedForCurrentFacade();

        const recCorniceSelect = document.getElementById('facade-item-rec-cornice');
        if (recCorniceSelect) {
          const recVal = (dataObj.rec_cornice ?? '0').toString();
          recCorniceSelect.value = recVal;
        }

        await renderMainDecors();
        await renderExtraMaterials();

        if (dataJson) {
          if (dataObj) dataJson.value = JSON.stringify(dataObj, null, 2);
          else if (typeof item.data === 'string') dataJson.value = item.data;
          else dataJson.value = '';
        }

        if (pricesJson) {
          const prices = dataObj && typeof dataObj === 'object' ? (dataObj.prices ?? null) : null;
          pricesJson.value = prices ? JSON.stringify(prices, null, 2) : '';
        }

        if (decorsList) {
          // Устаревший блок просмотра декоров оставлен как контейнер, но заполнение
          // теперь происходит через отдельный UI на вкладке "Доступные декоры".
          decorsList.innerHTML = '';
        }

        await renderFacadePricesMaterialsTable();
        renderFacadePricesEdgesTable();
        renderFacadePricesDecorsTable();
        renderFacadePricesSizesTable();
        renderFacadeAccessoriesTable();

        if (notesInput) {
          notesInput.value = (item.notes || item.comment || '');
        }
      } catch (e) {
        console.error('❌ Ошибка загрузки фасада для редактирования:', e);
        alert('Ошибка загрузки фасада: ' + e.message);
      }
    };

    async function saveFacadeItem(options) {
      const exitAfter = options?.exitAfter === true;
      try {
        const id = Number(document.getElementById('facade_item_id')?.value || '0') || 0;
        const name = document.getElementById('facade-item-name')?.value.trim() || '';
        if (!name) {
          alert('Введите название фrezеровки');
          return;
        }

        const article = document.getElementById('facade-item-article')?.value.trim() || '';
        const order = Number(document.getElementById('facade-item-order')?.value || '100000') || 100000;
        const category = document.getElementById('facade-item-category')?.value || '';
        const thickness = Number(document.getElementById('facade-item-thickness')?.value || '16') || 16;
        const sideThickness = Number(document.getElementById('facade-item-side-thickness')?.value || '0') || 0;
        const handle = document.getElementById('facade-item-handle-enabled')?.checked ? 1 : 0;
        const handleOffset = Number(document.getElementById('facade-item-handle-offset')?.value || '30') || 30;
        const active = document.getElementById('facade-item-active')?.checked ? 1 : 0;
        const icon = document.getElementById('facade-item-icon')?.value || '';
        const dataJson = document.getElementById('facade-item-data-json')?.value || '';
        const pricesJson = document.getElementById('facade-item-prices-json')?.value || '';
        const notes = document.getElementById('facade-item-notes')?.value || '';

        let dataObj = null;
        const modelsAdvanced = document.getElementById('facade-item-models-advanced');
        const pricesAdvanced = document.getElementById('facade-item-prices-advanced');
        const modelsAdvancedVisible = modelsAdvanced && modelsAdvanced.style.display !== 'none';
        const pricesAdvancedVisible = pricesAdvanced && pricesAdvanced.style.display !== 'none';

        if (modelsAdvancedVisible && dataJson.trim()) {
          // При активном расширенном режиме моделей доверяем JSON полностью
          try {
            dataObj = JSON.parse(dataJson);
          } catch (e) {
            alert('Ошибка в JSON-конфигурации фасада: ' + e.message);
            return;
          }
        } else if (window.__facadeEditState && window.__facadeEditState.dataObj) {
          // Основной режим: берём объект из состояния и обновляем текущую модель из формы
          dataObj = getFacadeDataObject();
          updateFacadeModelFromForm();
          updateMainDecorsFromUI();
          updateCurrentExtraMaterialFromForm();
        } else if (dataJson.trim()) {
          // Фолбэк: если состояние не инициализировано, но JSON есть
          try {
            dataObj = JSON.parse(dataJson);
          } catch (e) {
            alert('Ошибка в JSON-конфигурации фасада: ' + e.message);
            return;
          }
        } else {
          dataObj = getFacadeDataObject();
        }

        if (pricesAdvancedVisible && pricesJson.trim()) {
          try {
            const pricesObj = JSON.parse(pricesJson);
            if (dataObj && typeof dataObj === 'object') {
              dataObj.prices = pricesObj;
            }
          } catch (e) {
            alert('Ошибка в JSON с ценами: ' + e.message);
            return;
          }
        }

        const recCorniceSelect = document.getElementById('facade-item-rec-cornice');
        if (recCorniceSelect && dataObj && typeof dataObj === 'object') {
          dataObj.rec_cornice = (recCorniceSelect.value || '0').toString();
        }

        const payload = {
          id,
          name,
          article,
          code: article,
          category,
          order,
          active,
          thickness,
          side_thickness: sideThickness,
          handle,
          handle_offset: handleOffset,
          icon,
          notes,
          data: dataObj,
        };

        const url =
          id === 0
            ? '/api/catalog/item_add/facades/'
            : `/api/catalog/item_edit/facades/${encodeURIComponent(String(id))}`;

        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const res = await resp.json().catch(() => ({}));

        if (window.toastr) window.toastr.success('Фрезеровка успешно сохранена');
        const successUrl =
          document.getElementById('facade_item_form_success_url')?.value || '#facades-items';

        let newId = id;
        if (!id) {
          newId = Number(res?.item?.id ?? res?.id ?? 0) || 0;
        }

        if (exitAfter || !newId) {
          const targetHash = successUrl || '#facades-items';
          if (window.location.hash !== targetHash) window.location.hash = targetHash;
          document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
          const listPageId = (targetHash || '').split('?')[0].replace('#', '');
          const listPage = document.getElementById(listPageId);
          if (listPage) listPage.classList.add('active');
          if (listPageId === 'facades-items' && typeof window.loadFacades === 'function') {
            window.loadFacades();
          }
        } else {
          window.location.hash = `#facade-item-edit?id=${encodeURIComponent(String(newId))}`;
          if (typeof window.loadFacadeItemEdit === 'function') {
            window.loadFacadeItemEdit(newId);
          }
        }
      } catch (e) {
        console.error('❌ Ошибка сохранения фасада:', e);
        alert('Ошибка сохранения фасада: ' + e.message);
      }
    }

    // Инициализация кнопок формы фасада
    (function initFacadeItemEditControls() {
      const saveBtn = document.getElementById('save-facade-item-btn');
      const saveExitBtn = document.getElementById('save-and-exit-facade-item-btn');
      const cancelBtn = document.getElementById('cancel-facade-item-btn');
      if (saveBtn) saveBtn.addEventListener('click', () => saveFacadeItem({ exitAfter: false }));
      if (saveExitBtn) saveExitBtn.addEventListener('click', () => saveFacadeItem({ exitAfter: true }));
      if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const targetHash = '#facades-items';
          if (window.location.hash !== targetHash) window.location.hash = targetHash;
          document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
          const listPage = document.getElementById('facades-items');
          if (listPage) listPage.classList.add('active');
        });
      }

      // Кнопки на вкладках фасада (приближение к поведению референса)
      const modelsAddBtn = document.getElementById('facade-models-add-btn');
      if (modelsAddBtn) {
        modelsAddBtn.addEventListener('click', () => {
          const dataObj = getFacadeDataObject();
          // Находим свободный числовой ключ типа
          const existingKeys = Object.keys(dataObj.types || {}).map(k => parseInt(k, 10)).filter(n => !Number.isNaN(n));
          const nextKey = existingKeys.length ? Math.max(...existingKeys) + 1 : 0;
          dataObj.types[String(nextKey)] = {
            name: '',
            weight: 0,
            thickness: '',
            radius: 0,
            side: 0,
            compatibility: '',
            icon: '',
            icon_file: '',
            items: [],
          };
          facadeEditState.currentTypeKey = String(nextKey);
          renderFacadeModelsList();
        });
      }

      // Удаление текущей модели
      const deleteModelBtn = document.getElementById('facade-model-delete-btn');
      if (deleteModelBtn) {
        deleteModelBtn.addEventListener('click', () => {
          const dataObj = getFacadeDataObject();
          const key = facadeEditState.currentTypeKey;
          if (key == null) return;
          if (!dataObj.types) return;
          delete dataObj.types[key];
          facadeEditState.currentTypeKey = null;
          renderFacadeModelsList();
        });
      }

      // Размерный ряд: добавление новой записи
      const sizesAddBtn = document.getElementById('facade-model-sizes-add-btn');
      if (sizesAddBtn) {
        sizesAddBtn.addEventListener('click', (e) => {
          e.preventDefault();
          addFacadeModelSize();
        });
      }

      // Простые обработчики для выбора файлов иконки/карты нормали (пока без загрузки на сервер)
      const iconPlaceholder = document.getElementById('facade-model-icon-placeholder');
      const iconPreviewWrapper = document.getElementById('facade-model-icon-preview-wrapper');
      const iconPreview = document.getElementById('facade-model-icon-preview');
      const iconFileInput = document.getElementById('facade-model-icon-file');
      const iconHidden = document.getElementById('facade-model-icon');
      const openIconPicker = () => {
        if (iconFileInput) iconFileInput.click();
      };
      if (iconPlaceholder) iconPlaceholder.addEventListener('click', openIconPicker);
      if (iconPreviewWrapper) iconPreviewWrapper.addEventListener('click', openIconPicker);
      if (iconFileInput) {
        iconFileInput.addEventListener('change', () => {
          const file = iconFileInput.files && iconFileInput.files[0];
          if (!file) return;
          const url = URL.createObjectURL(file);
          if (iconPreview && iconPreviewWrapper && iconPlaceholder) {
            iconPreview.src = url;
            iconPreviewWrapper.style.display = 'block';
            iconPlaceholder.style.display = 'none';
          }
          if (iconHidden) iconHidden.value = file.name;
        });
      }

      const normalPlaceholder = document.getElementById('facade-model-normal-placeholder');
      const normalPreviewWrapper = document.getElementById('facade-model-normal-preview-wrapper');
      const normalPreview = document.getElementById('facade-model-normal-preview');
      const normalFileInput = document.getElementById('facade-model-normal-file');
      const normalHidden = document.getElementById('facade-model-normal');
      const openNormalPicker = () => {
        if (normalFileInput) normalFileInput.click();
      };
      if (normalPlaceholder) normalPlaceholder.addEventListener('click', openNormalPicker);
      if (normalPreviewWrapper) normalPreviewWrapper.addEventListener('click', openNormalPicker);
      if (normalFileInput) {
        normalFileInput.addEventListener('change', () => {
          const file = normalFileInput.files && normalFileInput.files[0];
          if (!file) return;
          const url = URL.createObjectURL(file);
          if (normalPreview && normalPreviewWrapper && normalPlaceholder) {
            normalPreview.src = url;
            normalPreviewWrapper.style.display = 'block';
            normalPlaceholder.style.display = 'none';
          }
          if (normalHidden) normalHidden.value = file.name;
        });
      }

      // Основные декоры: обновление dataObj.materials при изменении мультиселекта
      const mainDecorsSelect = document.getElementById('facade-main-materials-select');
      const mainDecorsInput = document.getElementById('facade-main-materials-input');
      if (mainDecorsSelect) {
        mainDecorsSelect.addEventListener('change', () => {
          updateMainDecorsFromUI();
          updateMainDecorsDisplayFromSelect();
        });
      }
      if (mainDecorsInput && mainDecorsSelect) {
        mainDecorsInput.addEventListener('click', () => {
          const isHidden = !mainDecorsSelect.style.display || mainDecorsSelect.style.display === 'none';
          mainDecorsSelect.style.display = isHidden ? 'block' : 'none';
        });
      }

      // Дополнительные материалы: кнопки и биндинги формы
      const extraAddBtn = document.getElementById('facade-extra-materials-add-btn');
      if (extraAddBtn) {
        extraAddBtn.addEventListener('click', () => {
          addExtraMaterial();
        });
      }
      const extraDeleteBtn = document.getElementById('facade-extra-material-delete-btn');
      if (extraDeleteBtn) {
        extraDeleteBtn.addEventListener('click', () => {
          const key = facadeEditState.extraMaterialsCurrentKey;
          if (!key) return;
          deleteExtraMaterial(key);
        });
      }

      const extraNameInput = document.getElementById('facade-extra-material-name');
      const extraKeyInput = document.getElementById('facade-extra-material-key');
      const extraCanSelectInput = document.getElementById('facade-extra-material-can-select');
      const extraCatsSelect = document.getElementById('facade-extra-material-categories');
      const extraCatsInput = document.getElementById('facade-extra-material-categories-input');
      const extraDefaultInput = document.getElementById('facade-extra-material-default');
      const bindExtraChange = (el, evt) => {
        if (!el) return;
        el.addEventListener(evt, () => {
          updateCurrentExtraMaterialFromForm();
        });
      };
      bindExtraChange(extraNameInput, 'input');
      bindExtraChange(extraKeyInput, 'input');
      bindExtraChange(extraCanSelectInput, 'change');
      bindExtraChange(extraCatsSelect, 'change');
      bindExtraChange(extraDefaultInput, 'input');

      if (extraCatsInput && extraCatsSelect) {
        extraCatsInput.addEventListener('click', () => {
          const isHidden = !extraCatsSelect.style.display || extraCatsSelect.style.display === 'none';
          extraCatsSelect.style.display = isHidden ? 'block' : 'none';
        });
      }

      const pricesMaterialsAddBtn = document.getElementById('facade-prices-materials-add-btn');
      const pricesEdgesAddBtn = document.getElementById('facade-prices-edges-add-btn');
      const pricesDecorsAddBtn = document.getElementById('facade-prices-decors-add-btn');
      const pricesSizesAddBtn = document.getElementById('facade-prices-sizes-add-btn');
      const pricesAdvanced = document.getElementById('facade-item-prices-advanced');
      const showPricesAdvanced = () => {
        if (pricesAdvanced) pricesAdvanced.style.display = 'block';
      };
      if (pricesMaterialsAddBtn) {
        pricesMaterialsAddBtn.addEventListener('click', (e) => {
          e.preventDefault();
          openFacadeMaterialsSelector();
        });
      }
      const pricesMaterialsCancelBtn = document.getElementById('facade-prices-materials-cancel-btn');
      if (pricesMaterialsCancelBtn) {
        pricesMaterialsCancelBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const selectorBlock = document.getElementById('facade-prices-materials-selector');
          if (selectorBlock) selectorBlock.style.display = 'none';
        });
      }
      const pricesMaterialsApplyBtn = document.getElementById('facade-prices-materials-apply-btn');
      if (pricesMaterialsApplyBtn) {
        pricesMaterialsApplyBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          await applyFacadeMaterialsFromSelector();
        });
      }
      if (pricesEdgesAddBtn) pricesEdgesAddBtn.addEventListener('click', showPricesAdvanced);
      if (pricesDecorsAddBtn) {
        pricesDecorsAddBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const obj = getFacadeDataObject();
          if (!Array.isArray(obj.decor_prices)) obj.decor_prices = [];
          obj.decor_prices.push({ article: '', name: '', prices: {} });
          renderFacadePricesDecorsTable();
        });
      }
      if (pricesSizesAddBtn) {
        pricesSizesAddBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const obj = getFacadeDataObject();
          if (!Array.isArray(obj.size_prices)) obj.size_prices = [];
          obj.size_prices.push({ type: '0', w_min: 0, w_max: 0, h_min: 0, h_max: 0, price: 0 });
          renderFacadePricesSizesTable();
        });
      }

      const accessoriesAddBtn = document.getElementById('facade-accessories-add-btn');
      if (accessoriesAddBtn) {
        accessoriesAddBtn.addEventListener('click', () => {
          try {
            const idRaw = window.prompt('ID комплектующего (как в библиотеке аксессуаров):', '');
            if (!idRaw) return;
            const qtyRaw = window.prompt('Количество:', '1');
            if (qtyRaw === null) return;
            const qtyVal = parseFloat((qtyRaw || '1').replace(',', '.'));
            const qty = Number.isNaN(qtyVal) ? 1 : qtyVal;
            const additions = getFacadeAdditionsArray();
            additions.push({ id: idRaw.toString().trim(), qty });
            renderFacadeAccessoriesTable();
          } catch (e) {
            console.error('❌ Ошибка при добавлении комплектующего:', e);
            alert('Не удалось добавить комплектующее');
          }
        });
      }

      // Переключение ГЛАВНЫХ вкладок внутри facade-item-edit
      // (Основные параметры / Модели / Доступные декоры / Цены / Комплектующие).
      // Внутренние табы (например, во вкладке "Цены") переключаем отдельно, чтобы
      // не трогать роутер и не менять location.hash.
      const mainTabLinks = document.querySelectorAll('#facade-item-main-tabs .nav-link');
      const mainTabPanes = document.querySelectorAll('#facade-item-main-tabs-content > .tab-pane');
      if (mainTabLinks.length && mainTabPanes.length) {
        mainTabPanes.forEach((pane) => {
          if (pane.classList.contains('active')) pane.style.display = 'block';
          else pane.style.display = 'none';
        });
        mainTabLinks.forEach((link) => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = (link.getAttribute('href') || '').replace('#', '');

            mainTabLinks.forEach((l) => {
              l.classList.remove('active');
              const li = l.closest('.nav-item');
              if (li) li.classList.remove('active');
            });

            const li = link.closest('.nav-item');
            if (li) li.classList.add('active');
            link.classList.add('active');

            mainTabPanes.forEach((pane) => {
              pane.style.display = (pane.id === targetId) ? 'block' : 'none';
            });
          });
        });
      }

      // Переключение ВНУТРЕННИХ вкладок во вкладке "Цены" (Материалы фасадов / Кромка / ...),
      // без изменения hash, чтобы не ломать роутер (иначе при #facade-prices-tab-edges
      // страница полностью скрывается).
      const pricesTabLinks = document.querySelectorAll('#facade-item-tab-prices .nav-tabs .nav-link');
      const pricesTabPanes = document.querySelectorAll('#facade-item-tab-prices .tab-content > .tab-pane');
      if (pricesTabLinks.length && pricesTabPanes.length) {
        pricesTabPanes.forEach((pane) => {
          if (pane.classList.contains('active')) pane.style.display = 'block';
          else pane.style.display = 'none';
        });
        pricesTabLinks.forEach((link) => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = (link.getAttribute('href') || '').replace('#', '');

            pricesTabLinks.forEach((l) => {
              l.classList.remove('active');
              const li = l.closest('.nav-item');
              if (li) li.classList.remove('active');
            });

            const li = link.closest('.nav-item');
            if (li) li.classList.add('active');
            link.classList.add('active');

            pricesTabPanes.forEach((pane) => {
              pane.style.display = (pane.id === targetId) ? 'block' : 'none';
            });
          });
        });
      }
    })();

    window.deleteMaterialItem = async function (itemId, itemName) {
      try {
        const controller = materialsItemsState.type || readMaterialsItemsParamsFromHash().type || '';
        if (!controller) return;

        const doDel = async () => {
          const resp = await fetch(`/api/catalog/item_delete/${encodeURIComponent(controller)}/${encodeURIComponent(String(itemId))}`, { method: 'DELETE' });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          if (window.toastr) window.toastr.success('Удалено');
          await loadMaterialsItems(controller, getMaterialNameFromMenu(controller));
        };

        if (window.Swal) {
          const r = await window.Swal.fire({
            title: 'Удалить?',
            text: itemName ? `Материал: ${itemName}` : 'Подтвердите удаление',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Удалить',
            cancelButtonText: 'Отмена'
          });
          if (r.isConfirmed) await doDel();
        } else {
          if (confirm(itemName ? `Удалить "${itemName}"?` : 'Удалить?')) await doDel();
        }
      } catch (e) {
        console.error('❌ Ошибка удаления:', e);
        alert('Ошибка удаления');
      }
    };
    
    // Загрузка материалов для таблицы "Список материалов"
    async function loadMaterialsKeys() {
      try {
        const tbody = document.getElementById('materials-keys-table-body');
        if (!tbody) return;
        
        // Показываем загрузку
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Загрузка...</td></tr>';
        
        // Загружаем данные с API
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/catalog/items_get/materials_keys?t=${timestamp}`, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const responseData = await response.json();
        // Обрабатываем разные форматы ответа
        let allData = [];
        if (Array.isArray(responseData)) {
          // Если ответ - массив, используем его напрямую
          allData = responseData;
        } else if (responseData && Array.isArray(responseData.items)) {
          // Если ответ - объект с полем items (как в некоторых API)
          allData = responseData.items;
        } else if (responseData && responseData.data && Array.isArray(responseData.data)) {
          // Если ответ - объект с полем data
          allData = responseData.data;
        } else {
          console.warn('⚠️ Неожиданный формат данных от API:', responseData);
          allData = [];
        }
        
        console.log('📊 Обработанные данные материалов, количество:', allData.length);
        
        // Сохраняем все данные для пагинации
        materialsKeysPagination.allData = allData;
        materialsKeysPagination.currentPage = 1;

        // Обновляем подменю "Плитные материалы" (как в рефе)
        updateMaterialsSubmenu(allData);
        
        // Применяем пагинацию
        renderMaterialsKeysTable();
        
      } catch (error) {
        console.error('❌ Ошибка загрузки материалов с сервера:', error);
        const tbody = document.getElementById('materials-keys-table-body');
        if (tbody) {
          tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#999;">Ошибка загрузки данных</td></tr>';
        }
        renderMaterialsKeysPagination(0);
      }
    }
    
    // Рендеринг таблицы материалов с учетом пагинации
    function renderMaterialsKeysTable() {
      const tbody = document.getElementById('materials-keys-table-body');
      if (!tbody) return;
      
      const { currentPage, perPage, allData } = materialsKeysPagination;
      
      // Очищаем таблицу
      tbody.innerHTML = '';
      
      // Проверяем, что allData - массив
      if (!Array.isArray(allData)) {
        console.error('❌ allData не является массивом:', allData);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#ef4444;">Ошибка: данные не являются массивом</td></tr>';
        renderMaterialsKeysPagination(0);
        return;
      }
      
      // Если данных нет
      if (allData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#999;">Нет данных</td></tr>';
        renderMaterialsKeysPagination(0);
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
        checkbox.className = 'material-key-checkbox';
        checkboxCell.appendChild(checkbox);
        
        // ID
        const idCell = document.createElement('td');
        idCell.style.width = '50px';
        idCell.style.verticalAlign = 'middle';
        idCell.textContent = item.id || '-';
        
        // Ключ
        const keyCell = document.createElement('td');
        keyCell.style.width = '80px';
        keyCell.style.verticalAlign = 'middle';
        keyCell.textContent = item.key || '-';
        
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
        
        // Редактировать (синяя кнопка с карандашом)
        const editLink = document.createElement('a');
        editLink.href = `#material-key-edit?id=${item.id}`;
        editLink.onclick = (e) => {
          e.preventDefault();
          openMaterialKeyEdit(item.id);
        };
        const editIcon = document.createElement('i');
        editIcon.className = 'fa fa-edit btn btn-outline btn-success';
        editIcon.title = 'Редактировать';
        editLink.appendChild(editIcon);
        
        // Копировать (светло-синяя кнопка с иконкой цепочки, как в референсе)
        const copyLink = document.createElement('a');
        copyLink.href = '#';
        copyLink.onclick = (e) => {
          e.preventDefault();
          if (typeof window.copyMaterialKey === 'function') {
            window.copyMaterialKey(item.id);
          } else {
            console.error('❌ Функция copyMaterialKey не найдена');
            alert('Ошибка: функция копирования не найдена. Перезагрузите страницу.');
          }
        };
        const copyIcon = document.createElement('i');
        copyIcon.className = 'fa fa-link btn btn-outline btn-primary';
        copyIcon.style.marginLeft = '5px';
        copyIcon.title = 'Копировать';
        copyLink.appendChild(copyIcon);
        
        // Удалить (красная кнопка с корзиной)
        const deleteIcon = document.createElement('i');
        deleteIcon.className = 'fa fa-trash btn btn-outline btn-danger';
        deleteIcon.style.cursor = 'pointer';
        deleteIcon.style.marginLeft = '5px';
        deleteIcon.title = 'Удалить';
        deleteIcon.onclick = () => {
          if (typeof window.deleteMaterialKey === 'function') {
            window.deleteMaterialKey(item.id, item.name);
          } else {
            console.error('❌ Функция deleteMaterialKey не найдена');
            alert('Ошибка: функция удаления не найдена. Перезагрузите страницу.');
          }
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
      
      // Рендерим пагинацию (сверху и снизу)
      renderMaterialsKeysPagination(allData.length);
      
      // Обновляем информацию о пагинации
      const from = allData.length > 0 ? startIndex + 1 : 0;
      const to = Math.min(endIndex, allData.length);
      const fromEl = document.getElementById('materials-keys-items-from');
      const toEl = document.getElementById('materials-keys-items-to');
      const totalEl = document.getElementById('materials-keys-items-total');
      if (fromEl) fromEl.textContent = from;
      if (toEl) toEl.textContent = to;
      if (totalEl) totalEl.textContent = allData.length;
    }
    
    // Рендеринг пагинации для материалов (сверху и снизу, как в референсе)
    function renderMaterialsKeysPagination(totalItems) {
      const paginationTop = document.getElementById('materials-keys-pagination-top');
      const paginationBottom = document.getElementById('materials-keys-pagination-bottom');
      
      const { currentPage, perPage } = materialsKeysPagination;
      const totalPages = Math.ceil(totalItems / perPage);
      
      // Рендерим пагинацию для обоих мест (сверху и снизу)
      [paginationTop, paginationBottom].forEach(pagination => {
        if (!pagination) return;
        
        let html = '';
        if (totalPages > 0) {
          // Кнопка "Первая страница" (<<)
          html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="1" title="Первая страница">&lt;&lt;</a>
          </li>`;
          
          // Кнопка "Предыдущая страница" (<)
          html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}" title="Предыдущая страница">&lt;</a>
          </li>`;
          
          // Номера страниц (показываем текущую и соседние)
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
          
          // Кнопка "Следующая страница" (>)
          html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}" title="Следующая страница">&gt;</a>
          </li>`;
          
          // Кнопка "Последняя страница" (>>)
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
              materialsKeysPagination.currentPage = page;
              renderMaterialsKeysTable();
            }
          });
        });
      });
    }
    
    // Открытие страницы редактирования материала
    function openMaterialKeyEdit(itemId) {
      const editPage = document.getElementById('material-key-edit');
      if (editPage) {
        // Скрываем все страницы
        document.querySelectorAll('.admin-page').forEach(page => {
          page.classList.remove('active');
        });
        
        editPage.classList.add('active');
        
        // Обновляем URL
        window.history.pushState({ page: 'material-key-edit' }, '', `#material-key-edit?id=${itemId}`);
        
        // Загружаем данные
        loadMaterialKeyEdit(itemId);
      }
    }
    
    // Загрузка данных для редактирования материала
    async function loadMaterialKeyEdit(itemId) {
      try {
        const itemIdInput = document.getElementById('material-key-item-id');
        const nameInput = document.getElementById('material-key-name');
        const edgesSetInput = document.getElementById('material-key-edges-set');
        const edgeInMenuInput = document.getElementById('material-key-edge-in-menu');
        const titleElement = document.getElementById('material-key-edit-title');
        const submitUrlInput = document.getElementById('material_key_form_submit_url');
        
        if (!itemIdInput || !nameInput || !titleElement || !submitUrlInput) {
          console.error('❌ Элементы формы не найдены');
          return;
        }
        
        // Загружаем наборы кромок для dropdown
        if (edgesSetInput) {
          try {
            const edgesRes = await fetch('/api/catalog/items_get/edges_keys');
            const edgesData = edgesRes.ok ? await edgesRes.json() : [];
            const edgesList = Array.isArray(edgesData) ? edgesData : [];
            edgesSetInput.innerHTML = '';
            edgesList.forEach(e => {
              const opt = document.createElement('option');
              opt.value = (e.key || e.name || '').toString();
              opt.textContent = e.name || e.key || opt.value;
              edgesSetInput.appendChild(opt);
            });
            if (edgesList.length === 0) {
              const def = document.createElement('option');
              def.value = 'butts';
              def.textContent = 'Набор по умолчанию';
              edgesSetInput.appendChild(def);
            }
          } catch (e) {
            console.warn('⚠️ Не удалось загрузить наборы кромок:', e);
            if (edgesSetInput.options.length === 0) {
              const def = document.createElement('option');
              def.value = 'butts';
              def.textContent = 'Набор по умолчанию';
              edgesSetInput.appendChild(def);
            }
          }
        }
        
        if (itemId === 0) {
          // Новый материал
          itemIdInput.value = '0';
          nameInput.value = '';
          if (edgesSetInput) edgesSetInput.value = edgesSetInput.options[0]?.value || 'butts';
          if (edgeInMenuInput) edgeInMenuInput.checked = false;
          titleElement.textContent = 'Добавить Материал';
          submitUrlInput.value = '/api/catalog/item_add/materials_keys/';
        } else {
          // Редактирование существующего
          const response = await fetch(`/api/catalog/item/materials_keys/${itemId}`);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const result = await response.json();
          itemIdInput.value = result.id;
          nameInput.value = result.name || '';
          if (edgesSetInput) edgesSetInput.value = (result.edges_set || result.edgesSet || 'butts').toString();
          if (edgeInMenuInput) edgeInMenuInput.checked = (result.edge_in_menu ?? result.edgeInMenu ?? 0) == 1;
          titleElement.textContent = `Редактировать Материал #${result.id}`;
          submitUrlInput.value = `/api/catalog/item_edit/materials_keys/${result.id}`;
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки материала для редактирования:', error);
        alert('Ошибка загрузки данных: ' + error.message);
      }
    }
    
    // Сохранение материала
    async function saveMaterialKey() {
      try {
        const itemId = parseInt(document.getElementById('material-key-item-id').value) || 0;
        const name = document.getElementById('material-key-name').value.trim();
        const edgesSet = (document.getElementById('material-key-edges-set')?.value || 'butts').toString();
        const edgeInMenu = document.getElementById('material-key-edge-in-menu')?.checked ? 1 : 0;
        
        if (!name) {
          alert('Пожалуйста, введите название материала');
          return;
        }
        
        const data = {
          name: name,
          edges_set: edgesSet,
          edge_in_menu: edgeInMenu
        };
        
        const url = itemId === 0 
          ? '/api/catalog/item_add/materials_keys/'
          : `/api/catalog/item_edit/materials_keys/${itemId}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        if (typeof toastr !== 'undefined') {
          toastr.success('Материал успешно сохранен');
        } else {
          alert('Материал успешно сохранен');
        }
        
        // Перезагружаем данные сразу
        await loadMaterialsKeys();
        
        // Переходим на страницу списка (если мы не на ней)
        if (window.location.hash !== '#materials-keys') {
          window.location.hash = '#materials-keys';
        }
        
      } catch (error) {
        console.error('❌ Ошибка сохранения материала:', error);
        if (typeof toastr !== 'undefined') {
          toastr.error('Ошибка сохранения: ' + error.message);
        } else {
          alert('Ошибка сохранения: ' + error.message);
        }
      }
    }
    
    // Копирование материала (как в референсе)
    window.copyMaterialKey = async function copyMaterialKey(itemId) {
      try {
        // Загружаем материал для копирования
        const response = await fetch(`/api/catalog/item/materials_keys/${itemId}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const originalItem = await response.json();
        // Создаем копию с новым названием
        const copyData = {
          name: `${originalItem.name} (копия)`,
          order: (originalItem.order || 0) + 1,
          active: originalItem.active || 1
        };
        
        // Сохраняем копию
        const saveResponse = await fetch('/api/catalog/item_add/materials_keys/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(copyData)
        });
        
        if (!saveResponse.ok) {
          throw new Error(`HTTP ${saveResponse.status}: ${saveResponse.statusText}`);
        }
        
        const result = await saveResponse.json();
        if (typeof toastr !== 'undefined') {
          toastr.success('Материал успешно скопирован');
        } else {
          alert('Материал успешно скопирован');
        }
        
        // Перезагружаем список
        await loadMaterialsKeys();
        
      } catch (error) {
        console.error('❌ Ошибка копирования материала:', error);
        if (typeof toastr !== 'undefined') {
          toastr.error(`Ошибка копирования: ${error.message}`);
        } else {
          alert(`Ошибка копирования: ${error.message}`);
        }
      }
    };
    
    // Удаление материала
    window.deleteMaterialKey = function(itemId, itemName) {
      if (typeof Swal === 'undefined') {
        if (confirm(`Удалить материал "${itemName}"?`)) {
          performDeleteMaterialKey(itemId);
        }
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
      }).then((result) => {
        if (result.isConfirmed) {
          performDeleteMaterialKey(itemId);
        }
      });
    };
    
    async function performDeleteMaterialKey(itemId) {
      try {
        const response = await fetch(`/api/catalog/item_delete/materials_keys/${itemId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        if (typeof toastr !== 'undefined') {
          toastr.success('Материал успешно удален');
        } else {
          alert('Материал успешно удален');
        }
        
        // Обновляем список
        setTimeout(() => {
          loadMaterialsKeys();
        }, 300);
        
      } catch (error) {
        console.error('❌ Ошибка удаления материала:', error);
        if (typeof toastr !== 'undefined') {
          toastr.error(`Ошибка удаления: ${error.message}`);
        } else {
          alert(`Ошибка удаления: ${error.message}`);
        }
      }
    }
    
    // Экспортируем функции в window для глобального доступа
    window.loadMaterialsKeys = loadMaterialsKeys;
    window.openMaterialKeyEdit = openMaterialKeyEdit;
    window.saveMaterialKey = saveMaterialKey;
    
    // ============================================
    // Функции для работы с наборами кромок (edges_keys)
    // ============================================
    
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
            <i class="fa fa-trash btn btn-outline btn-danger" style="margin-left:5px; cursor:pointer;" title="Элемент" onclick="deleteEdgeKey(${item.id}, ${JSON.stringify(item.name || '')})"></i>
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

    // Категории (дерево) — общий компонент для разных типов (по умолчанию: кромки butts_keys)
    let EDGES_CATEGORIES_TYPE = 'butts_keys';
    let edgesCategoriesData = [];

    async function loadEdgesCategories() {
      const treeEl = document.getElementById('edges-categories-tree');
      if (!treeEl) return;
      treeEl.innerHTML = '<div style="padding:20px; color:#999;">Загрузка...</div>';
      try {
        // Если в hash передан параметр type (например, cabinet_model), используем его как тип категорий.
        const hash = window.location.hash || '';
        const params = new URLSearchParams(hash.split('?')[1] || '');
        const overrideType = params.get('type');
        if (overrideType) {
          EDGES_CATEGORIES_TYPE = overrideType;
        }

        const res = await fetch(`/api/catalog/categories_get/${encodeURIComponent(EDGES_CATEGORIES_TYPE)}`);
        const data = await res.json();
        edgesCategoriesData = Array.isArray(data) ? data : [];
        renderEdgesCategoriesTree();
      } catch (e) {
        console.error('❌ Ошибка загрузки категорий кромок:', e);
        treeEl.innerHTML = '<div style="padding:20px; color:#c00;">Ошибка загрузки</div>';
      }
    }

    function buildCategoryTree(items, parentId) {
      const parent = parentId === null || parentId === '' || parentId === 0 ? null : Number(parentId);
      return (items || []).filter(c => (c.parent || c.parent_id || null) === parent);
    }

    let edgesCategoriesExpanded = { '': true };

    function renderEdgesCategoriesTree() {
      const treeEl = document.getElementById('edges-categories-tree');
      if (!treeEl) return;
      treeEl.innerHTML = '';
      const root = buildCategoryTree(edgesCategoriesData, null);
      if (root.length === 0) {
        treeEl.innerHTML = '<div style="padding:20px; color:#999;">Нет категорий. Нажмите «Добавить».</div>';
        return;
      }
      function renderLevel(parentId, level) {
        const children = buildCategoryTree(edgesCategoriesData, parentId);
        const key = parentId === null || parentId === '' || parentId === 0 ? '' : String(parentId);
        const isExpanded = !!edgesCategoriesExpanded[key];
        children.forEach(cat => {
          const subChildren = buildCategoryTree(edgesCategoriesData, cat.id);
          const hasChildren = subChildren.length > 0;
          const catKey = String(cat.id);
          const expanded = !!edgesCategoriesExpanded[catKey];
          const expandChar = !hasChildren ? '&#8203;' : (expanded ? '&#9660;' : '&#9654;');
          const active = (cat.active === undefined || cat.active === 1);
          const nameEsc = (cat.name || 'Без названия').replace(/</g, '&lt;').replace(/"/g, '&quot;');
          const div = document.createElement('div');
          div.className = 'pp-tree-item edges-cat-item';
          div.style.paddingLeft = (level * 20 + 10) + 'px';
          div.setAttribute('data-id', catKey);
          div.innerHTML =
            '<span class="pp-tree-expand" data-cat-expand="' + catKey + '" title="' + (hasChildren ? (expanded ? 'Свернуть' : 'Развернуть') : '') + '">' + expandChar + '</span>' +
            '<span class="pp-tree-label">' + nameEsc + ' <span style="color:#9ca3af; font-size:12px;">(ID:' + cat.id + ')</span></span>' +
            '<span class="edges-cat-actions">' +
            '<a href="#" data-cat-action="add" data-cat-id="' + catKey + '" title="Добавить подкатегорию"><i class="fa fa-plus" style="font-size:12px;"></i></a>' +
            '<a href="#" data-cat-action="edit" data-cat-id="' + catKey + '" title="Редактировать"><i class="fa fa-pencil" style="font-size:12px;"></i></a>' +
            '<a href="#" data-cat-action="visibility" data-cat-id="' + catKey + '" title="' + (active ? 'Скрыть' : 'Показать') + '" class="' + (active ? '' : 'inactive') + '"><i class="fa fa-eye' + (active ? '' : '-slash') + '" style="font-size:12px;"></i></a>' +
            '<a href="#" data-cat-action="delete" data-cat-id="' + catKey + '" title="Удалить"><i class="fa fa-trash" style="font-size:12px;"></i></a>' +
            '</span>';
          treeEl.appendChild(div);
          if (hasChildren && expanded) renderLevel(cat.id, level + 1);
        });
      }
      renderLevel(null, 0);
    }

    window.loadEdgesCategories = loadEdgesCategories;
    window.loadEdgesKeys = loadEdgesKeys;
    window.openEdgeKeyEdit = openEdgeKeyEdit;

    // ============================================
    // Список кромок в наборе (edges-items) — по референсу butt_butts
    // ============================================
    const edgesItemsState = { type: '', name: '', allData: [], filtered: [], currentPage: 1, perPage: 20 };

    function readEdgesItemsParamsFromHash() {
      const hash = (window.location.hash || '').split('?')[1] || '';
      const p = new URLSearchParams(hash);
      return { type: p.get('type') || '', name: p.get('name') || '' };
    }

    function getEdgesNameFromMenu(typeKey) {
      const link = document.querySelector(`a[data-edges-type="${CSS.escape(typeKey || '')}"]`);
      return link ? (link.getAttribute('data-edges-name') || link.textContent || typeKey || '').trim() : (typeKey || '');
    }

    function normalizeEdgesItemsResponse(data) {
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.items)) return data.items;
      return [];
    }

    function getEdgeItemCategory(item) {
      const c = item?.category;
      if (Array.isArray(c)) return (c[0] ?? '').toString();
      return (c ?? '').toString();
    }

    function applyEdgesItemsFilters() {
      const q = (document.getElementById('edges-items-search-input')?.value || '').toString().trim().toLowerCase();
      const cat = (document.getElementById('edges-items-category-filter')?.value || '').toString();
      const all = Array.isArray(edgesItemsState.allData) ? edgesItemsState.allData : [];
      let out = all;
      if (q) {
        out = out.filter((it) => {
          const name = (it?.name || '').toString().toLowerCase();
          const art = (it?.article || '').toString().toLowerCase();
          const id = String(it?.id ?? '');
          return name.includes(q) || art.includes(q) || id.includes(q);
        });
      }
      if (cat) out = out.filter((it) => getEdgeItemCategory(it) === cat);
      edgesItemsState.filtered = out;
      const totalPages = Math.max(1, Math.ceil(out.length / (edgesItemsState.perPage || 20)));
      if (edgesItemsState.currentPage > totalPages) edgesItemsState.currentPage = totalPages;
      if (edgesItemsState.currentPage < 1) edgesItemsState.currentPage = 1;
    }

    function renderEdgesItemsCategories() {
      const sel = document.getElementById('edges-items-category-filter');
      const editSel = document.getElementById('edge-item-category');
      const all = Array.isArray(edgesItemsState.allData) ? edgesItemsState.allData : [];
      const cats = [...new Set(all.map(it => getEdgeItemCategory(it).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));
      const opts = '<option value="">Нет</option>' + cats.map(c => `<option value="${(c || '').replace(/"/g, '&quot;')}">${c || ''}</option>`).join('');
      if (sel) sel.innerHTML = opts;
      const catsFromApi = edgesCategoriesData || [];
      if (editSel) {
        editSel.innerHTML = '<option value="">Нет</option>' + (catsFromApi.length ? catsFromApi.map(c => `<option value="${(c.name || '').replace(/"/g, '&quot;')}">${c.name || ''}</option>`).join('') : cats.map(c => `<option value="${(c || '').replace(/"/g, '&quot;')}">${c || ''}</option>`).join(''));
      }
    }

    function renderEdgesItemsTable() {
      const tbody = document.getElementById('edges-items-table-body');
      if (!tbody) return;
      applyEdgesItemsFilters();
      const data = edgesItemsState.filtered;
      tbody.innerHTML = '';
      if (!edgesItemsState.type) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:20px; color:#999;">Выберите набор кромок в меню слева</td></tr>';
        renderEdgesItemsPagination(0);
        return;
      }
      if (!data.length) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:20px; color:#999;">Нет данных</td></tr>';
        renderEdgesItemsPagination(0);
        return;
      }
      const perPage = edgesItemsState.perPage || 20;
      const start = (edgesItemsState.currentPage - 1) * perPage;
      const pageData = data.slice(start, start + perPage);
      const accUrl = (window.glob?.acc_url || '/').replace(/\/$/, '');
      for (const item of pageData) {
        const tr = document.createElement('tr');
        const iconUrl = (item?.icon || '').toString();
        const colorVal = (item?.color || '').toString().trim();
        let iconHtml = '';
        if (iconUrl) {
          iconHtml = `<img src="${accUrl}${iconUrl.startsWith('/') ? '' : '/'}${iconUrl}" style="width:120px;height:70px;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb;" onerror="this.style.display='none'">`;
        } else if (colorVal && /^#([0-9A-Fa-f]{6})$/.test(colorVal)) {
          iconHtml = `<div style="width:120px;height:70px;background-color:${colorVal};border-radius:6px;border:1px solid #e5e7eb;"></div>`;
        } else {
          iconHtml = '<div style="width:70px;height:70px;border:1px solid #e5e7eb;border-radius:6px;background:#f8fafc;"></div>';
        }
        const active = (item?.active ?? 1) == 1 || item?.active === true;
        const visHtml = active
          ? '<button type="button" class="btn btn-xs btn-outline btn-success" title="Видим"><i class="fa fa-eye"></i></button>'
          : '<button type="button" class="btn btn-xs btn-outline btn-default" title="Скрыт"><i class="fa fa-eye-slash"></i></button>';
        tr.innerHTML = `
          <td><input type="checkbox" class="edges-item-checkbox" value="${item?.id ?? ''}"></td>
          <td>${item?.id ?? '-'}</td>
          <td>${iconHtml}</td>
          <td>${(item?.name || '-').replace(/</g, '&lt;')}</td>
          <td>${(item?.article || '-').replace(/</g, '&lt;')}</td>
          <td>${(getEdgeItemCategory(item) || '-').replace(/</g, '&lt;')}</td>
          <td>${String(item?.order ?? item?.sort ?? '-')}</td>
          <td>${visHtml}</td>
          <td class="col-actions" style="width:194px; white-space:nowrap;">
            <div style="display:flex; gap:8px; justify-content:center;">
              <button type="button" class="btn btn-xs btn-outline btn-primary" title="Редактировать" data-edge-action="edit" data-edge-id="${item?.id ?? 0}" data-edge-name="${(item?.name || '').replace(/"/g, '&quot;')}"><i class="fa fa-pencil"></i></button>
              <button type="button" class="btn btn-xs btn-outline btn-info" title="Копировать" data-edge-action="copy" data-edge-id="${item?.id ?? 0}" data-edge-name="${(item?.name || '').replace(/"/g, '&quot;')}"><i class="fa fa-copy"></i></button>
              <button type="button" class="btn btn-xs btn-outline btn-danger" title="Удалить" data-edge-action="delete" data-edge-id="${item?.id ?? 0}" data-edge-name="${(item?.name || '').replace(/"/g, '&quot;')}"><i class="fa fa-trash"></i></button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      }
      renderEdgesItemsPagination(data.length);
    }

    function renderEdgesItemsPagination(totalItems) {
      const top = document.getElementById('edges-items-pagination-top');
      const bottom = document.getElementById('edges-items-pagination-bottom');
      const fromEl = document.getElementById('edges-items-from');
      const toEl = document.getElementById('edges-items-to');
      const totalEl = document.getElementById('edges-items-total');
      if (!top || !bottom) return;
      const perPage = edgesItemsState.perPage || 20;
      const currentPage = edgesItemsState.currentPage || 1;
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
          a.addEventListener('click', e => { e.preventDefault(); const p = parseInt(a.getAttribute('data-page') || '0'); if (p >= 1 && p <= totalPages) { edgesItemsState.currentPage = p; renderEdgesItemsTable(); } });
        });
      };
      mkPag(top);
      mkPag(bottom);
    }

    async function loadEdgesItems(typeKey, name) {
      const tbody = document.getElementById('edges-items-table-body');
      if (!tbody) return;
      edgesItemsState.type = typeKey || '';
      edgesItemsState.name = name || getEdgesNameFromMenu(typeKey) || typeKey || 'Кромки';
      const title = document.getElementById('edges-items-title');
      const subtitle = document.getElementById('edges-items-subtitle');
      if (title) title.textContent = edgesItemsState.name;
      if (subtitle) subtitle.textContent = edgesItemsState.name;
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:20px;">Загрузка...</td></tr>';
      if (!typeKey) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:20px; color:#999;">Выберите набор кромок в меню слева</td></tr>';
        return;
      }
      try {
        const resp = await fetch(`/api/catalog/items_get/${encodeURIComponent(typeKey)}?t=${Date.now()}`, { cache: 'no-cache' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const items = normalizeEdgesItemsResponse(data);
        edgesItemsState.allData = items;
        edgesItemsState.currentPage = 1;
        renderEdgesItemsCategories();
        renderEdgesItemsTable();
      } catch (e) {
        console.error('❌ Ошибка загрузки кромок:', e);
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:20px; color:#c00;">Ошибка загрузки</td></tr>';
        renderEdgesItemsPagination(0);
      }
    }

    function loadEdgesItemsFromHash() {
      const { type, name } = readEdgesItemsParamsFromHash();
      if (!type) return;
      loadEdgesItems(type, name || getEdgesNameFromMenu(type));
    }

    window.loadEdgesItemsFromHash = loadEdgesItemsFromHash;

    window.deleteEdgeItem = function(itemId, itemName) {
      if (!confirm(`Удалить кромку "${itemName}"?`)) return;
      const type = edgesItemsState.type || readEdgesItemsParamsFromHash().type;
      if (!type) return;
      fetch(`/api/catalog/item_delete/${encodeURIComponent(type)}/${itemId}`, { method: 'DELETE' })
        .then(res => res.ok ? res.json() : Promise.reject(new Error(res.statusText)))
        .then(() => { if (typeof toastr !== 'undefined') toastr.success('Удалено'); loadEdgesItems(type, edgesItemsState.name); })
        .catch(e => { console.error('❌ Ошибка удаления:', e); alert('Ошибка: ' + e.message); });
    };

    window.copyEdgeItem = async function(itemId) {
      try {
        const type = edgesItemsState.type || readEdgesItemsParamsFromHash().type;
        if (!type) return;
        const resp = await fetch(`/api/catalog/item/${encodeURIComponent(type)}/${itemId}?t=${Date.now()}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const item = await resp.json();
        const copy = { ...item, id: 0, name: `${item?.name || 'Кромка'} (копия)` };
        const addResp = await fetch(`/api/catalog/item_add/${encodeURIComponent(type)}/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(copy) });
        if (!addResp.ok) throw new Error(`HTTP ${addResp.status}`);
        if (typeof toastr !== 'undefined') toastr.success('Скопировано');
        loadEdgesItems(type, edgesItemsState.name || getEdgesNameFromMenu(type));
      } catch (e) {
        console.error('❌ Ошибка копирования:', e);
        alert('Ошибка копирования');
      }
    };

    // ============================================
    // Модалка "Импорт из декоров" для кромок (butt_butts)
    // ============================================
    const edgesDecorsState = { all: [], filtered: [], currentPage: 1, perPage: 20, catalogType: 'butt_butts' };

    // Кэш наборов кромок (edges_keys) для выпадающих списков "Тип" в панели детали
    let __cldEdgesKeysCache = null;

    async function __cldEnsureEdgesKeysLoaded() {
      if (Array.isArray(__cldEdgesKeysCache)) return __cldEdgesKeysCache;
      try {
        const resp = await fetch('/api/catalog/items_get/edges_keys?t=' + Date.now(), { cache: 'no-cache' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = await resp.json();
        __cldEdgesKeysCache = Array.isArray(data) ? data : [];
      } catch (e) {
        console.error('[CLD][edges] Не удалось загрузить edges_keys для панели конструктора:', e);
        __cldEdgesKeysCache = [];
      }
      return __cldEdgesKeysCache;
    }

    async function __cldPopulateConstructorEdgeTypeSelects() {
      const list = await __cldEnsureEdgesKeysLoaded();
      if (!Array.isArray(list) || !list.length) return;
      const active = list.filter(it => it.active === undefined || it.active === 1);
      for (let edgeNum = 1; edgeNum <= 4; edgeNum++) {
        const sel = document.getElementById(`catalog-constructor-property-edge-${edgeNum}-type`);
        if (!sel) continue;
        const currentVal = sel.value || 'butts';
        sel.innerHTML = '';
        active.forEach(item => {
          const key = (item.key || item.name || '').toString() || (item.id === 1 ? 'butts' : '');
          const opt = document.createElement('option');
          opt.value = key || '';
          opt.textContent = item.name || key || ('Набор #' + item.id);
          sel.appendChild(opt);
        });
        // Пытаемся сохранить выбранное значение
        if (currentVal) sel.value = currentVal;
      }
    }

    function getEdgeDecorCategory(item) {
      const c = item?.category;
      if (Array.isArray(c)) return (c[0] ?? '').toString();
      return (c ?? '').toString();
    }

    function applyEdgesDecorsFilters() {
      const q = (document.getElementById('edges-decors-search-input')?.value || '').toString().trim().toLowerCase();
      const cat = (document.getElementById('edges-decors-category-filter')?.value || '').toString();
      const all = Array.isArray(edgesDecorsState.all) ? edgesDecorsState.all : [];
      let out = all;
      if (q) {
        out = out.filter((it) => {
          const name = (it?.name || '').toString().toLowerCase();
          const art = (it?.article || '').toString().toLowerCase();
          const id = String(it?.id ?? '');
          return name.includes(q) || art.includes(q) || id.includes(q);
        });
      }
      if (cat) out = out.filter((it) => getEdgeDecorCategory(it) === cat);
      edgesDecorsState.filtered = out;
      const totalPages = Math.max(1, Math.ceil(out.length / (edgesDecorsState.perPage || 20)));
      if (edgesDecorsState.currentPage > totalPages) edgesDecorsState.currentPage = totalPages;
      if (edgesDecorsState.currentPage < 1) edgesDecorsState.currentPage = 1;
    }

    function renderEdgesDecorsPagination(totalItems) {
      const top = document.getElementById('edges-decors-pagination-top');
      const bottom = document.getElementById('edges-decors-pagination-bottom');
      const fromEl = document.getElementById('edges-decors-from');
      const toEl = document.getElementById('edges-decors-to');
      const totalEl = document.getElementById('edges-decors-total');
      if (!top || !bottom) return;
      const perPage = edgesDecorsState.perPage || 20;
      const currentPage = edgesDecorsState.currentPage || 1;
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
          a.addEventListener('click', e => {
            e.preventDefault();
            const p = parseInt(a.getAttribute('data-page') || '0', 10);
            if (p >= 1 && p <= totalPages) {
              edgesDecorsState.currentPage = p;
              renderEdgesDecorsTable();
            }
          });
        });
      };
      mkPag(top);
      mkPag(bottom);
    }

    function renderEdgesDecorsCategories() {
      const sel = document.getElementById('edges-decors-category-filter');
      if (!sel) return;
      const all = Array.isArray(edgesDecorsState.all) ? edgesDecorsState.all : [];
      const cats = [...new Set(all.map(it => (getEdgeDecorCategory(it) || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));
      const opts = '<option value=\"\">Все</option>' + cats.map(c => `<option value=\"${(c || '').replace(/\"/g, '&quot;')}\">${c || ''}</option>`).join('');
      sel.innerHTML = opts;
    }

    function renderEdgesDecorsTable() {
      const tbody = document.getElementById('edges-decors-table-body');
      if (!tbody) return;
      applyEdgesDecorsFilters();
      const data = edgesDecorsState.filtered || [];
      tbody.innerHTML = '';
      if (!data.length) {
        tbody.innerHTML = '<tr><td colspan=\"6\" style=\"text-align:center; padding:20px; color:#999;\">Нет данных</td></tr>';
        renderEdgesDecorsPagination(0);
        return;
      }
      const perPage = edgesDecorsState.perPage || 20;
      const start = (edgesDecorsState.currentPage - 1) * perPage;
      const pageData = data.slice(start, start + perPage);
      const accUrl = (window.glob?.acc_url || '/').replace(/\/$/, '');
      for (const item of pageData) {
        const tr = document.createElement('tr');
        const iconUrl = (item?.icon || '').toString();
        const colorVal = (item?.color || '').toString().trim();
        let iconHtml = '';
        if (iconUrl) {
          iconHtml = `<img src=\"${accUrl}${iconUrl.startsWith('/') ? '' : '/'}${iconUrl}\" style=\"width:120px;height:70px;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb;\" onerror=\"this.style.display='none'\">`;
        } else if (colorVal && /^#([0-9A-Fa-f]{6})$/.test(colorVal)) {
          iconHtml = `<div style=\"width:120px;height:70px;background-color:${colorVal};border-radius:6px;border:1px solid #e5e7eb;\"></div>`;
        } else {
          iconHtml = '<div style=\"width:70px;height:70px;border:1px solid #e5e7eb;border-radius:6px;background:#f8fafc;\"></div>';
        }
        const nameSafe = (item?.name || '-').toString().replace(/</g, '&lt;');
        const artSafe = (item?.article || '-').toString().replace(/</g, '&lt;');
        const catSafe = (getEdgeDecorCategory(item) || '-').toString().replace(/</g, '&lt;');
        const id = item?.id ?? '';
        tr.innerHTML = `
          <td style=\"vertical-align:middle;\">${id}</td>
          <td style=\"vertical-align:middle;\">${iconHtml}</td>
          <td style=\"vertical-align:middle;\">${nameSafe}</td>
          <td style=\"vertical-align:middle;\">${artSafe}</td>
          <td style=\"vertical-align:middle;\">${catSafe}</td>
          <td style=\"vertical-align:middle; text-align:center;\">
            <button type=\"button\" class=\"btn btn-sm btn-primary\" onclick=\"if(window.handleEdgesDecorSelect) window.handleEdgesDecorSelect(${id});\">�������</button>
          </td>
        `;
        tbody.appendChild(tr);
      }
      renderEdgesDecorsPagination(data.length);
    }

    async function loadEdgesDecors() {
      const tbody = document.getElementById('edges-decors-table-body');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Загрузка...</td></tr>';
      }
      try {
        const ct = edgesDecorsState.catalogType || 'butt_butts';
        const resp = await fetch('/api/catalog/items_get/' + encodeURIComponent(ct) + '?t=' + Date.now(), { cache: 'no-cache' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = await resp.json();
        const items = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
        edgesDecorsState.all = items;
        edgesDecorsState.currentPage = 1;
        renderEdgesDecorsCategories();
        const perSel = document.getElementById('edges-decors-per-page');
        if (perSel) {
          const v = parseInt(perSel.value || '20', 10);
          edgesDecorsState.perPage = v || 20;
        } else {
          edgesDecorsState.perPage = 20;
        }
        renderEdgesDecorsTable();
      } catch (e) {
        console.error('❌ Ошибка загрузки декоров кромки (butt_butts):', e);
        if (tbody) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#c00;">Ошибка загрузки</td></tr>';
        }
        renderEdgesDecorsPagination(0);
      }
    }

    window.__cldEdgesDecorContext = window.__cldEdgesDecorContext || {};

    window.openEdgesDecorsSelectModal = async function() {
      const modal = document.getElementById('edges-decors-select-modal');
      if (!modal) {
        console.error('[CLD][edges-decors] Модальное окно edges-decors-select-modal не найдено');
        return;
      }
      // Определяем, для какого набора кромок будет импорт
      let type = edgesItemsState.type;
      let name = edgesItemsState.name;
      if (!type) {
        const params = readEdgesItemsParamsFromHash();
        type = params.type || '';
        name = params.name || '';
      }
      if (!type) {
        alert('Сначала выберите набор кромок в меню слева.');
        return;
      }
      window.__cldEdgesImportTarget = { type, name };
      edgesDecorsState.catalogType = 'butt_butts';
      window.__cldEdgesDecorContext = { mode: 'admin', type, name, catalogType: edgesDecorsState.catalogType };
      // Сбрасываем фильтры
      const searchInput = document.getElementById('edges-decors-search-input');
      const catSel = document.getElementById('edges-decors-category-filter');
      const perSel = document.getElementById('edges-decors-per-page');
      if (searchInput) searchInput.value = '';
      if (catSel) catSel.value = '';
      if (perSel) {
        const v = parseInt(perSel.value || '20', 10);
        edgesDecorsState.perPage = v || 20;
      } else {
        edgesDecorsState.perPage = 20;
      }
      modal.style.display = 'flex';
      if (!Array.isArray(edgesDecorsState.all) || !edgesDecorsState.all.length) {
        await loadEdgesDecors();
      } else {
        renderEdgesDecorsCategories();
        renderEdgesDecorsTable();
      }
    };

    window.closeEdgesDecorsSelectModal = function() {
      const modal = document.getElementById('edges-decors-select-modal');
      if (modal) modal.style.display = 'none';
    };

    window.openEdgeDecorSelectForDetail = async function(edgeNumber) {
      const node = window.__cldCurrentSelectedNode;
      if (!node) {
        alert('Сначала выберите деталь');
        return;
      }
      const modal = document.getElementById('edges-decors-select-modal');
      if (!modal) {
        console.error('[CLD][edges-decors] Модальное окно edges-decors-select-modal не найдено (detail)');
        return;
      }
      // Определяем набор кромок по выпадающему списку "Тип" для этой стороны
      const edgeTypeSelect = document.getElementById(`catalog-constructor-property-edge-${edgeNumber}-type`);
      const edgeTypeVal = (edgeTypeSelect?.value || 'butts').toString();
      // Маппинг ключа набора к каталогу кромок, по умолчанию butt_butts
      const catalogType = (function mapEdgeSetToCatalog(t) {
        if (!t) return 'butt_butts';
        if (t === 'butts' || t === 'butt_butts') return 'butt_butts';
        // Для остальных пока тоже используем butt_butts, позже можно развести по разным каталогам
        return 'butt_butts';
      })(edgeTypeVal);
      edgesDecorsState.catalogType = catalogType;

      window.__cldEdgesDecorContext = {
        mode: 'detail',
        edgeNumber,
        nodeId: node.getAttribute('data-node-id') || null,
        catalogType
      };
      const searchInput = document.getElementById('edges-decors-search-input');
      const catSel = document.getElementById('edges-decors-category-filter');
      const perSel = document.getElementById('edges-decors-per-page');
      if (searchInput) searchInput.value = '';
      if (catSel) catSel.value = '';
      if (perSel) {
        const v = parseInt(perSel.value || '20', 10);
        edgesDecorsState.perPage = v || 20;
      } else {
        edgesDecorsState.perPage = 20;
      }
      modal.style.display = 'flex';
      if (!Array.isArray(edgesDecorsState.all) || !edgesDecorsState.all.length) {
        await loadEdgesDecors();
      } else {
        renderEdgesDecorsCategories();
        renderEdgesDecorsTable();
      }
    };

    window.handleEdgesDecorSelect = function(decorId) {
      const ctx = window.__cldEdgesDecorContext || {};
      if (ctx.mode === 'detail') {
        if (typeof window.selectEdgeDecorForDetail === 'function') {
          window.selectEdgeDecorForDetail(decorId, ctx.edgeNumber);
        }
      } else {
        if (typeof window.importEdgeFromDecor === 'function') {
          window.importEdgeFromDecor(decorId);
        }
      }
    };

    window.importEdgeFromDecor = async function(decorId) {
      try {
        const target = window.__cldEdgesImportTarget || {};
        let type = target.type || edgesItemsState.type;
        let name = target.name || edgesItemsState.name;
        if (!type) {
          const params = readEdgesItemsParamsFromHash();
          type = params.type || '';
          name = params.name || '';
        }
        if (!type) {
          alert('Не определён набор кромок для импорта.');
          return;
        }
        const catalogType = edgesDecorsState.catalogType || 'butt_butts';
        const resp = await fetch(`/api/catalog/item/${encodeURIComponent(catalogType)}/${encodeURIComponent(decorId)}?t=${Date.now()}`, { cache: 'no-cache' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const decor = await resp.json();
        const payload = {
          name: (decor?.name || '').toString().trim(),
          article: (decor?.article || '').toString().trim(),
          thickness: (decor?.thickness || '').toString().trim(),
          width: (decor?.width || '').toString().trim(),
          color: (decor?.color || '').toString().trim(),
          category: (getEdgeDecorCategory(decor) || '').toString().trim(),
          order: decor?.order !== undefined ? decor.order : 10000,
          active: decor?.active !== undefined ? decor.active : 1,
          icon: (decor?.icon || '').toString().trim(),
          description: (decor?.description || '').toString().trim(),
          displayMode: 'texture',
          roughness: 1,
          metalness: 0,
          transparent: 0,
          opacity: 1,
          texture: (decor?.icon || '').toString().trim(),
          normalMap: '',
          roughnessMap: '',
          stretchWidth: true,
          stretchHeight: true,
          realTextureWidth: 256,
          realTextureHeight: 256,
          normal_map_width: 256,
          normal_map_height: 256,
          oneSided: false,
          one_side: false,
          previewWidth: 450,
          previewHeight: 720
        };
        if (!payload.name) {
          alert('У выбранного декора не заполнено название.');
          return;
        }
        const addResp = await fetch(`/api/catalog/item_add/${encodeURIComponent(type)}/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const addData = await addResp.json().catch(() => ({}));
        if (!addResp.ok || (addData && addData.result && addData.result !== 'success' && !addData.item)) {
          throw new Error(addData.error || addData.message || ('HTTP ' + addResp.status));
        }
        if (typeof toastr !== 'undefined') toastr.success('Кромка импортирована из декоров');
        window.closeEdgesDecorsSelectModal();
        // Перезагружаем список кромок для текущего набора
        loadEdgesItems(type, name || getEdgesNameFromMenu(type));
      } catch (e) {
        console.error('❌ Ошибка импорта кромки из декоров:', e);
        alert('Ошибка импорта: ' + e.message);
      }
    };

    window.selectEdgeDecorForDetail = async function(decorId, edgeNumber) {
      try {
        const edgeNum = Number(edgeNumber) || Number((window.__cldEdgesDecorContext || {}).edgeNumber) || 1;
        const node = window.__cldCurrentSelectedNode;
        if (!node) {
          alert('Сначала выберите деталь');
          return;
        }
        const catalogType = (window.__cldEdgesDecorContext && window.__cldEdgesDecorContext.catalogType) || edgesDecorsState.catalogType || 'butt_butts';
        const resp = await fetch(`/api/catalog/item/${encodeURIComponent(catalogType)}/${encodeURIComponent(decorId)}?t=${Date.now()}`, { cache: 'no-cache' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const decor = await resp.json();
        const id = decor?.id ?? decorId;
        const name = (decor?.name || '').toString().trim();
        const decorColor = (decor?.color || '').toString().trim();
        const decorIcon = (decor?.icon || '').toString().trim();

        if (!node.nodeData) node.nodeData = {};
        if (!node.nodeData.edges) node.nodeData.edges = {};
        if (!node.nodeData.edges[edgeNum]) node.nodeData.edges[edgeNum] = {};

        const edgeData = node.nodeData.edges[edgeNum];
        edgeData.enabled = true; // при выборе декора считаем сторону включённой
        edgeData.decor_id = id;
        edgeData.decor_name = name;
        edgeData.edge_id = id;
        edgeData.edge_name = name;
        edgeData.color = decorColor;
        edgeData.icon = decorIcon;
        // ������� ������ �� ��������� ��� � ���� � ���� �� ������.
        if (typeof decor.thickness !== 'undefined') {
          edgeData.thickness = String(decor.thickness);
        }
        const idInput = document.getElementById(`catalog-constructor-property-edge-${edgeNum}-decor-id`);
        const nameInput = document.getElementById(`catalog-constructor-property-edge-${edgeNum}-decor-name`);
        const thicknessInput = document.getElementById(`catalog-constructor-property-edge-${edgeNum}-thickness`);
        if (idInput) idInput.value = id != null ? String(id) : '';
        if (nameInput) nameInput.value = name;
        if (thicknessInput && typeof decor.thickness !== 'undefined') {
          thicknessInput.value = String(decor.thickness);
        }

        const edgeSelectedId = document.getElementById(`catalog-constructor-property-edge-${edgeNum}-selected-id`);
        const edgeSelectedName = document.getElementById(`catalog-constructor-property-edge-${edgeNum}-selected-name`);
        const edgeLink = document.getElementById(`catalog-constructor-property-edge-${edgeNum}-link`);
        const edgeRemove = document.getElementById(`catalog-constructor-property-edge-${edgeNum}-remove`);

        if (edgeSelectedId) {
          edgeSelectedId.textContent = (id != null ? String(id) : '') + (id ? ':' : '');
          edgeSelectedId.style.display = id ? 'inline' : 'none';
        }
        if (edgeSelectedName) {
          edgeSelectedName.textContent = name || '';
          edgeSelectedName.style.display = name ? 'inline' : 'none';
        }
        if (edgeLink) {
          edgeLink.style.display = name ? 'inline-block' : 'none';
          edgeLink.href = `#edge-item-edit?type=butt_butts&id=${encodeURIComponent(id)}&name=${encodeURIComponent('Кромки')}`;
        }
        if (edgeRemove) {
          edgeRemove.style.display = id ? 'inline-block' : 'none';
        }

        const edgeCheckbox = document.getElementById(`catalog-constructor-property-edge-${edgeNum}`);
        const edgeDetailsDiv = document.getElementById(`catalog-constructor-property-edge-${edgeNum}-details`);
        if (edgeCheckbox) edgeCheckbox.checked = true;
        if (edgeDetailsDiv) edgeDetailsDiv.style.display = 'block';

        if (typeof saveDetailNodeData === 'function') {
          saveDetailNodeData(currentSelectedNode);
        }
        if (typeof window.__ppPostModuleToIframe === 'function') {
          window.__ppPostModuleToIframe();
        }
        window.closeEdgesDecorsSelectModal();
      } catch (e) {
        console.error('❌ Ошибка выбора кромки для детали:', e);
        alert('Ошибка выбора кромки: ' + e.message);
      }
    };

    function openEdgeItemEdit(itemId) {
      const params = readEdgesItemsParamsFromHash();
      const type = edgesItemsState.type || params.type;
      const name = edgesItemsState.name || params.name || getEdgesNameFromMenu(type);
      if (!type) return;
      edgesItemsState.type = type;
      edgesItemsState.name = name;
      const hash = `#edge-item-edit?type=${encodeURIComponent(type)}&id=${itemId || 0}&name=${encodeURIComponent(name || '')}`;
      if (window.location.hash !== hash) window.location.hash = hash;
      document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
      const page = document.getElementById('edge-item-edit');
      if (page) { page.classList.add('active'); loadEdgeItemEdit(type, itemId || 0); }
    }

    async function loadEdgeItemEdit(typeKey, itemId) {
      try {
        const id = Number(itemId) || 0;
        if (!typeKey) return;
        document.getElementById('edge_item_controller_name').value = typeKey;
        document.getElementById('edge_item_id').value = String(id);
        const title = document.getElementById('edge-item-edit-title');
        const typeName = document.getElementById('edge_item_type_name');
        const name = edgesItemsState.name || getEdgesNameFromMenu(typeKey) || typeKey;
        if (typeName) typeName.value = name;
        if (title) title.innerHTML = id ? `Редактировать кромку <span>${name}</span>` : `Добавить кромку <span>${name}</span>`;
        if (!edgesCategoriesData || edgesCategoriesData.length === 0) {
          try {
            const r = await fetch(`/api/catalog/categories_get/${EDGES_CATEGORIES_TYPE}`);
            const d = await r.json();
            edgesCategoriesData = Array.isArray(d) ? d : [];
          } catch (_) {}
        }
        let item = null;
        if (id && Array.isArray(edgesItemsState.allData)) item = edgesItemsState.allData.find(it => Number(it?.id) === id) || null;
        if (!item && id) {
          const resp = await fetch(`/api/catalog/item/${encodeURIComponent(typeKey)}/${id}?t=${Date.now()}`, { cache: 'no-cache' });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          item = await resp.json();
        }
        if (!item) item = { id: 0, name: '', article: '', thickness: '', width: '', color: '', category: '', order: 10000, active: 1, icon: '', description: '', displayMode: 'custom', roughness: 0.8, metalness: 0, transparent: false, opacity: 1, texture: '', normalMap: '', roughnessMap: '', stretchWidth: false, stretchHeight: false, realTextureWidth: 256, realTextureHeight: 256, oneSided: false, previewWidth: 450, previewHeight: 720 };
        document.getElementById('edge-item-name').value = item?.name || '';
        document.getElementById('edge-item-article').value = item?.article || '';
        document.getElementById('edge-item-thickness').value = (item?.thickness ?? '').toString();
        document.getElementById('edge-item-width').value = (item?.width ?? '').toString();
        const colorVal = (item?.color ?? '#ffffff').toString().trim() || '#ffffff';
        document.getElementById('edge-item-color').value = colorVal;
        const colorPicker = document.getElementById('edge-item-color-picker');
        if (colorPicker) {
          const hex = /^#([0-9A-Fa-f]{6})$/.exec(colorVal);
          colorPicker.value = hex ? colorVal : '#ffffff';
        }
        const descEl = document.getElementById('edge-item-description');
        if (descEl) descEl.value = (item?.description ?? '').toString();
        document.getElementById('edge-item-order').value = String(item?.order ?? 10000);
        document.getElementById('edge-item-active').checked = (item?.active ?? 1) == 1 || item?.active === true;
        
        // Параметры отображения
        const displayModeEl = document.getElementById('edge-display-mode');
        if (displayModeEl) displayModeEl.value = (item?.displayMode || 'custom').toString();
        const roughnessEl = document.getElementById('edge-roughness');
        if (roughnessEl) roughnessEl.value = String(item?.roughness ?? 0.8);
        const metalnessEl = document.getElementById('edge-metalness');
        if (metalnessEl) metalnessEl.value = String(item?.metalness ?? 0);
        const transparentEl = document.getElementById('edge-transparent');
        const transparencyBlock = document.getElementById('edge-transparency-block');
        if (transparentEl) {
          transparentEl.checked = !!(item?.transparent || item?.transparency);
          if (transparencyBlock) transparencyBlock.style.display = transparentEl.checked ? 'flex' : 'none';
        }
        const opacityEl = document.getElementById('edge-opacity');
        if (opacityEl) opacityEl.value = String(item?.opacity ?? 1);
        
        // Текстуры
        const textureUrl = (item?.texture || '').toString();
        const texturePreview = document.getElementById('edge-texture-preview');
        const textureUrlInput = document.getElementById('edge-texture-url');
        if (textureUrlInput) textureUrlInput.value = textureUrl;
        if (texturePreview) {
          if (textureUrl) {
            texturePreview.innerHTML = `<img src="${textureUrl}" style="width:100%; height:100%; object-fit:cover;"><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="edge-texture-upload-icon"></i>`;
          } else {
            texturePreview.innerHTML = '<span style="color:#ccc; font-size:12px;">нет</span><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="edge-texture-upload-icon"></i>';
          }
          setTimeout(() => {
            const icon = document.getElementById('edge-texture-upload-icon');
            if (icon && document.getElementById('edge-texture-file')) {
              icon.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('edge-texture-file').click(); });
            }
          }, 50);
        }
        
        const normalMapUrl = (item?.normalMap || '').toString();
        const normalMapPreview = document.getElementById('edge-normal-map-preview');
        const normalMapUrlInput = document.getElementById('edge-normal-map-url');
        if (normalMapUrlInput) normalMapUrlInput.value = normalMapUrl;
        if (normalMapPreview) {
          if (normalMapUrl) {
            normalMapPreview.innerHTML = `<img src="${normalMapUrl}" style="width:100%; height:100%; object-fit:cover;"><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="edge-normal-map-upload-icon"></i>`;
          } else {
            normalMapPreview.innerHTML = '<span style="color:#ccc; font-size:12px;">256x256</span><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="edge-normal-map-upload-icon"></i>';
          }
          setTimeout(() => {
            const icon = document.getElementById('edge-normal-map-upload-icon');
            if (icon && document.getElementById('edge-normal-map-file')) {
              icon.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('edge-normal-map-file').click(); });
            }
          }, 50);
        }
        
        const roughnessMapUrl = (item?.roughnessMap || '').toString();
        const roughnessMapPreview = document.getElementById('edge-roughness-map-preview');
        const roughnessMapUrlInput = document.getElementById('edge-roughness-map-url');
        if (roughnessMapUrlInput) roughnessMapUrlInput.value = roughnessMapUrl;
        if (roughnessMapPreview) {
          if (roughnessMapUrl) {
            roughnessMapPreview.innerHTML = `<img src="${roughnessMapUrl}" style="width:100%; height:100%; object-fit:cover;"><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="edge-roughness-map-upload-icon"></i>`;
          } else {
            roughnessMapPreview.innerHTML = '<span style="color:#ccc; font-size:12px;">256x256</span><i class="fa fa-folder-open" style="position:absolute; top:4px; right:4px; color:#1c84c6; cursor:pointer; font-size:16px;" id="edge-roughness-map-upload-icon"></i>';
          }
          setTimeout(() => {
            const icon = document.getElementById('edge-roughness-map-upload-icon');
            if (icon && document.getElementById('edge-roughness-map-file')) {
              icon.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('edge-roughness-map-file').click(); });
            }
          }, 50);
        }
        
        const stretchW = document.getElementById('edge-stretch-width');
        const stretchH = document.getElementById('edge-stretch-height');
        if (stretchW) stretchW.checked = !!(item?.stretchWidth || item?.stretch_width);
        if (stretchH) stretchH.checked = !!(item?.stretchHeight || item?.stretch_height);
        
        const realTexW = document.getElementById('edge-real-texture-width');
        const realTexH = document.getElementById('edge-real-texture-height');
        if (realTexW) realTexW.value = String(item?.realTextureWidth ?? item?.normal_map_width ?? 256);
        if (realTexH) realTexH.value = String(item?.realTextureHeight ?? item?.normal_map_height ?? 256);
        
        const oneSidedInput = document.getElementById('edge-one-sided');
        if (oneSidedInput) oneSidedInput.checked = !!(item?.oneSided || item?.one_side);
        
        const previewW = document.getElementById('edge-preview-width');
        const previewH = document.getElementById('edge-preview-height');
        if (previewW) previewW.value = String(item?.previewWidth ?? 450);
        if (previewH) previewH.value = String(item?.previewHeight ?? 720);
        const catVal = getEdgeItemCategory(item) || (Array.isArray(item?.category) ? (item.category[0] || '') : (item?.category || ''));
        const catSel = document.getElementById('edge-item-category');
        if (catSel) {
          catSel.innerHTML = '<option value="">Нет</option>' + (edgesCategoriesData || []).map(c => `<option value="${(c.name || '').replace(/"/g, '&quot;')}">${c.name || ''}</option>`).join('');
          catSel.value = catVal;
          if (catVal && !catSel.querySelector(`option[value="${(catVal || '').replace(/"/g, '&quot;')}"]`)) {
            const o = document.createElement('option');
            o.value = catVal;
            o.textContent = catVal;
            catSel.appendChild(o);
            catSel.value = catVal;
          }
        }
        const iconUrl = (item?.icon || '').toString();
        document.getElementById('edge-item-icon').value = iconUrl;
        const prevWrap = document.getElementById('edge-item-icon-preview-wrapper');
        const prevImg = document.getElementById('edge-item-icon-preview');
        const placeholder = document.getElementById('edge-item-icon-placeholder');
        if (prevWrap && prevImg && placeholder) {
          if (iconUrl) { prevWrap.style.display = 'block'; placeholder.style.display = 'none'; prevImg.src = (iconUrl.startsWith('/') ? (window.glob?.acc_url || '/') : '') + iconUrl; }
          else { prevWrap.style.display = 'none'; placeholder.style.display = 'flex'; }
        }
      } catch (e) {
        console.error('❌ Ошибка загрузки кромки:', e);
        alert('Ошибка загрузки: ' + e.message);
      }
    }

    async function saveEdgeItem(exitAfter) {
      const typeKey = document.getElementById('edge_item_controller_name')?.value || '';
      const id = parseInt(document.getElementById('edge_item_id')?.value || '0', 10);
      if (!typeKey) { alert('Тип не указан'); return; }
      
      // Читаем значения вкладок
      const displayMode = document.getElementById('edge-display-mode')?.value || 'custom';
      const color = (document.getElementById('edge-item-color')?.value || '#ffffff').toString().trim() || '#ffffff';
      const roughness = Number(document.getElementById('edge-roughness')?.value || '0.8') || 0.8;
      const metalness = Number(document.getElementById('edge-metalness')?.value || '0') || 0;
      const transparent = !!document.getElementById('edge-transparent')?.checked;
      const opacity = Number(document.getElementById('edge-opacity')?.value || '1') || 1;
      const texture = (document.getElementById('edge-texture-url')?.value || '').toString().trim();
      const normalMap = (document.getElementById('edge-normal-map-url')?.value || '').toString().trim();
      const roughnessMap = (document.getElementById('edge-roughness-map-url')?.value || '').toString().trim();
      const stretchWidth = !!document.getElementById('edge-stretch-width')?.checked;
      const stretchHeight = !!document.getElementById('edge-stretch-height')?.checked;
      const realTextureWidth = Number(document.getElementById('edge-real-texture-width')?.value || '256') || 256;
      const realTextureHeight = Number(document.getElementById('edge-real-texture-height')?.value || '256') || 256;
      const oneSided = !!document.getElementById('edge-one-sided')?.checked;
      const previewWidth = Number(document.getElementById('edge-preview-width')?.value || '450') || 450;
      const previewHeight = Number(document.getElementById('edge-preview-height')?.value || '720') || 720;
      
      const payload = {
        name: (document.getElementById('edge-item-name')?.value || '').trim(),
        article: (document.getElementById('edge-item-article')?.value || '').trim(),
        thickness: (document.getElementById('edge-item-thickness')?.value || '').trim(),
        width: (document.getElementById('edge-item-width')?.value || '').trim(),
        color,
        category: (document.getElementById('edge-item-category')?.value || '').trim(),
        order: parseInt(document.getElementById('edge-item-order')?.value || '10000', 10),
        active: document.getElementById('edge-item-active')?.checked ? 1 : 0,
        icon: (document.getElementById('edge-item-icon')?.value || '').trim(),
        description: (document.getElementById('edge-item-description')?.value || '').trim(),
        displayMode,
        roughness,
        metalness,
        transparent,
        opacity,
        texture,
        normalMap,
        roughnessMap,
        stretchWidth,
        stretchHeight,
        realTextureWidth,
        realTextureHeight,
        normal_map_width: realTextureWidth,
        normal_map_height: realTextureHeight,
        oneSided,
        one_side: oneSided,
        previewWidth,
        previewHeight
      };
      if (!payload.name) { alert('Введите название'); return; }
      const url = id ? `/api/catalog/item_edit/${encodeURIComponent(typeKey)}/${id}` : `/api/catalog/item_add/${encodeURIComponent(typeKey)}/`;
      const method = id ? 'POST' : 'POST';
      try {
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.message || res.statusText);
        if (data.result === 'success' || data.item) {
          if (typeof toastr !== 'undefined') toastr.success('Сохранено');
          if (exitAfter) {
            window.location.hash = `#edges-items?type=${encodeURIComponent(typeKey)}&name=${encodeURIComponent(edgesItemsState.name || '')}`;
            document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
            const page = document.getElementById('edges-items');
            if (page) page.classList.add('active');
            loadEdgesItems(typeKey, edgesItemsState.name);
          } else {
            loadEdgeItemEdit(typeKey, data.item?.id ?? id);
          }
        } else throw new Error(JSON.stringify(data));
      } catch (e) {
        console.error('❌ Ошибка сохранения кромки:', e);
        alert('Ошибка сохранения: ' + e.message);
      }
    }

    window.openEdgeItemEdit = openEdgeItemEdit;

    // ============================================
    // Каталог 3D моделей: Список 3D Моделей (cabinet_model)
    // Примечание: код вынесен в admin-models3d-list.js
    // ============================================
    
    // ============================================
    // Функции для работы с глобальными переменными
    // ============================================
    
    let globalVarsData = null;
    let globalVarsDebounceTimer = null;
    const GLOBAL_VARS_DEBOUNCE_DELAY = 500;
    
    // Загрузка глобальных переменных
    async function loadGlobalVars() {
      try {
        const contentDiv = document.getElementById('global-vars-content');
        const groupSelect = document.getElementById('global-vars-group-select');
        
        if (!contentDiv || !groupSelect) return;
        
        // Показываем загрузку
        contentDiv.innerHTML = '<div style="text-align: center; padding: 40px;"><p>Загрузка переменных...</p></div>';
        groupSelect.innerHTML = '<option value="">Загрузка...</option>';
        
        // Загружаем данные с API
        const timestamp = new Date().getTime();
        const apiUrl = `/api/catalog/global_vars?t=${timestamp}`;
        const response = await fetch(apiUrl, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Ошибка HTTP:', response.status, errorText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}. Ответ: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('📦 Полученные данные (сырые):', data);
        console.log('📊 Структура данных:', {
          hasValue: !!data.value,
          valueIsArray: Array.isArray(data.value),
          valueLength: Array.isArray(data.value) ? data.value.length : 'не массив',
          valueType: typeof data.value,
          fullData: data
        });
        
        // Проверяем, что данные корректны
        if (!data || !data.value) {
          console.error('❌ Некорректные данные от сервера:', data);
          const contentDiv = document.getElementById('global-vars-content');
          if (contentDiv) {
            contentDiv.innerHTML = '<div style="text-align: center; padding: 40px; color: #d9534f;"><p>Ошибка: некорректные данные от сервера</p></div>';
          }
          return;
        }
        
        globalVarsData = data;
        
        // Заполняем селект групп
        if (data.value && Array.isArray(data.value)) {
          groupSelect.innerHTML = '';
          let defaultIndex = -1;
          
          data.value.forEach((group, index) => {
            // Показываем все группы, не только активные (для отладки)
            // В референсе могут быть неактивные группы, но мы их все равно показываем
            const isActive = group.active === 1 || group.active === true;
            console.log(`📋 Группа ${index}:`, {
              name: group.name,
              key: group.key,
              active: group.active,
              default: group.default,
              varsCount: group.vars ? group.vars.length : 0
            });
            
            if (isActive) {
              const option = document.createElement('option');
              option.value = index;
              option.textContent = group.name || `Группа ${index + 1}`;
              if (group.default) {
                option.selected = true;
                defaultIndex = index;
              }
              groupSelect.appendChild(option);
            }
          });
          // Если нет выбранной группы, выбираем первую активную
          if (groupSelect.value === '' && data.value.length > 0) {
            const firstActiveIndex = data.value.findIndex(g => g.active);
            if (firstActiveIndex >= 0) {
              groupSelect.value = firstActiveIndex;
              defaultIndex = firstActiveIndex;
            }
          }
          
          // Если нет активных групп, но есть группы вообще - показываем первую
          if (groupSelect.options.length === 0 && data.value.length > 0) {
            console.warn('⚠️ Нет активных групп, но есть группы. Показываем первую группу.');
            const option = document.createElement('option');
            option.value = 0;
            option.textContent = data.value[0].name || 'Группа 1';
            option.selected = true;
            groupSelect.appendChild(option);
            defaultIndex = 0;
          }
          
          // Загружаем переменные выбранной группы
          const selectedIndex = parseInt(groupSelect.value);
          if (isNaN(selectedIndex) && defaultIndex >= 0) {
            groupSelect.value = defaultIndex;
            renderGlobalVars(defaultIndex);
          } else if (!isNaN(selectedIndex)) {
            renderGlobalVars(selectedIndex);
          } else {
            console.warn('⚠️ Не удалось определить группу для отображения');
            contentDiv.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;"><p>Нет доступных групп переменных</p></div>';
          }
        } else {
          contentDiv.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;"><p>Нет данных</p></div>';
          console.warn('⚠️ Нет данных в data.value:', data);
          console.warn('⚠️ Тип data.value:', typeof data.value, 'Является массивом:', Array.isArray(data.value));
        }
        
        // Обработчик изменения группы
        groupSelect.addEventListener('change', function() {
          const selectedIndex = parseInt(this.value) || 0;
          renderGlobalVars(selectedIndex);
        });
        
      } catch (error) {
        console.error('❌ Ошибка загрузки глобальных переменных:', error);
        console.error('❌ Stack trace:', error.stack);
        const contentDiv = document.getElementById('global-vars-content');
        const groupSelect = document.getElementById('global-vars-group-select');
        
        if (contentDiv) {
          contentDiv.innerHTML = `<div style="text-align: center; padding: 40px; color: #d9534f;">
            <p><strong>Ошибка загрузки данных</strong></p>
            <p style="font-size: 12px; color: #999;">${error.message}</p>
            <button type="button" class="btn btn-primary btn-sm mt-3" onclick="loadGlobalVars()">Повторить загрузку</button>
          </div>`;
        }
        
        if (groupSelect) {
          groupSelect.innerHTML = '<option value="">Ошибка загрузки</option>';
        }
        
        // Сбрасываем данные
        globalVarsData = null;
      }
    }
    
    // Рендеринг переменных выбранной группы (по референсу - блоки с полями параметров)
    function renderGlobalVars(groupIndex) {
      const contentDiv = document.getElementById('global-vars-content');
      if (!contentDiv || !globalVarsData || !globalVarsData.value) return;
      
      const groups = globalVarsData.value;
      if (!Array.isArray(groups) || !groups[groupIndex]) {
        contentDiv.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;"><p>Группа не найдена</p></div>';
        return;
      }
      
      const group = groups[groupIndex];
      const vars = group.vars || [];
      
      // Показываем все переменные (не только editable), т.к. в референсе они все видны
      // Сортируем по order
      const sortedVars = [...vars].sort((a, b) => {
        const aOrder = parseInt(a.order) || 0;
        const bOrder = parseInt(b.order) || 0;
        return aOrder - bOrder;
      });
      
      // Рендерим HTML - блоки как в референсе
      let html = '';
      
      sortedVars.forEach((v, index) => {
        const varId = `global-var-${index}`;
        html += `<div class="global-var-block" data-var-index="${index}" data-var-key="${v.key || ''}" style="display: flex; margin-bottom: 20px; padding: 15px; border: 1px solid #e7eaec; border-radius: 4px; background: #fff;">`;
        
        // Левая часть - большое поле для названия/ключа (по референсу - одно большое поле)
        html += `<div style="flex: 1; margin-right: 20px;">`;
        html += `<input type="text" class="form-control global-var-name" 
          data-var-index="${index}"
          placeholder="Название переменной"
          value="${v.name || ''}" 
          style="width: 100%; margin-bottom: 5px; font-size: 14px;">`;
        html += `<input type="text" class="form-control global-var-key" 
          data-var-index="${index}"
          placeholder="Ключ (key)"
          value="${v.key || ''}" 
          style="width: 100%; font-family: monospace; font-size: 12px; color: #666;">`;
        html += `</div>`;
        
        // Правая часть - параметры
        html += `<div style="flex: 1; display: flex; flex-direction: column; gap: 10px;">`;
        
        // Выводить в меню (toggle)
        html += `<div class="form-group" style="margin-bottom: 10px;">`;
        html += `<label style="display: flex; align-items: center; gap: 10px;">`;
        html += `<span style="min-width: 120px;">Выводить в меню:</span>`;
        html += `<label class="switch" style="margin: 0;">`;
        html += `<input type="checkbox" class="global-var-show-menu" 
          data-var-index="${index}"
          ${v.show_in_menu == 1 || v.show_in_menu === true ? 'checked' : ''}>`;
        html += `<span class="slider round"></span>`;
        html += `</label>`;
        html += `</label>`;
        html += `</div>`;
        
        // Тип (dropdown)
        html += `<div class="form-group" style="margin-bottom: 10px;">`;
        html += `<label style="display: flex; align-items: center; gap: 10px;">`;
        html += `<span style="min-width: 120px;">Тип:</span>`;
        html += `<select class="form-control global-var-type" 
          data-var-index="${index}"
          style="flex: 1;">`;
        html += `<option value="number" ${v.type === 'number' ? 'selected' : ''}>Число</option>`;
        html += `<option value="boolean" ${v.type === 'boolean' ? 'selected' : ''}>Логическое</option>`;
        html += `<option value="select" ${v.type === 'select' ? 'selected' : ''}>Выбор</option>`;
        html += `<option value="text" ${v.type === 'text' || !v.type ? 'selected' : ''}>Текст</option>`;
        html += `</select>`;
        html += `</label>`;
        html += `</div>`;
        
        // Порядок
        html += `<div class="form-group" style="margin-bottom: 10px;">`;
        html += `<label style="display: flex; align-items: center; gap: 10px;">`;
        html += `<span style="min-width: 120px;">Порядок:</span>`;
        html += `<input type="number" class="form-control global-var-order" 
          data-var-index="${index}"
          value="${v.order || 0}" 
          style="flex: 1;">`;
        html += `</label>`;
        html += `</div>`;
        
        // Группа
        html += `<div class="form-group" style="margin-bottom: 10px;">`;
        html += `<label style="display: flex; align-items: center; gap: 10px;">`;
        html += `<span style="min-width: 120px;">Группа:</span>`;
        html += `<input type="text" class="form-control global-var-group" 
          data-var-index="${index}"
          value="${v.group || ''}" 
          style="flex: 1;">`;
        html += `</label>`;
        html += `</div>`;
        
        // Мин, Макс, Шаг (в одну строку)
        html += `<div class="form-group" style="margin-bottom: 10px; display: flex; gap: 10px;">`;
        html += `<div style="flex: 1;">`;
        html += `<label>Мин.</label>`;
        html += `<input type="number" class="form-control global-var-min" 
          data-var-index="${index}"
          value="${v.params?.min || ''}" 
          placeholder="1">`;
        html += `</div>`;
        html += `<div style="flex: 1;">`;
        html += `<label>Макс.</label>`;
        html += `<input type="number" class="form-control global-var-max" 
          data-var-index="${index}"
          value="${v.params?.max || ''}" 
          placeholder="">`;
        html += `</div>`;
        html += `<div style="flex: 1;">`;
        html += `<label>Шаг</label>`;
        html += `<input type="number" class="form-control global-var-step" 
          data-var-index="${index}"
          value="${v.params?.step || ''}" 
          placeholder="1">`;
        html += `</div>`;
        html += `</div>`;
        
        // Значение
        html += `<div class="form-group" style="margin-bottom: 10px;">`;
        html += `<label style="display: flex; align-items: center; gap: 10px;">`;
        html += `<span style="min-width: 120px;">Значение:</span>`;
        
        // Рендерим поле ввода в зависимости от типа
        if (v.type === 'number') {
          const min = v.params?.min !== undefined ? `min="${v.params.min}"` : '';
          const max = v.params?.max !== undefined && v.params.max !== '' ? `max="${v.params.max}"` : '';
          const step = v.params?.step !== undefined ? `step="${v.params.step}"` : 'step="1"';
          html += `<input type="number" class="form-control global-var-value" 
            data-var-index="${index}"
            value="${v.value || ''}" 
            ${min} ${max} ${step}
            style="flex: 1;">`;
        } else if (v.type === 'boolean') {
          html += `<label class="switch" style="margin: 0;">`;
          html += `<input type="checkbox" class="global-var-value" 
            data-var-index="${index}"
            ${v.value == 1 || v.value === true || v.value === '1' ? 'checked' : ''}>`;
          html += `<span class="slider round"></span>`;
          html += `</label>`;
        } else if (v.type === 'select' && v.params?.options) {
          html += `<select class="form-control global-var-value" 
            data-var-index="${index}"
            style="flex: 1;">`;
          v.params.options.forEach(opt => {
            html += `<option value="${opt.value}" ${v.value == opt.value ? 'selected' : ''}>${opt.name}</option>`;
          });
          html += `</select>`;
        } else {
          html += `<input type="text" class="form-control global-var-value" 
            data-var-index="${index}"
            value="${v.value || ''}" 
            style="flex: 1;">`;
        }
        
        html += `</label>`;
        html += `</div>`;
        
        html += `</div>`;
        
        // Кнопки действий справа
        html += `<div style="display: flex; flex-direction: column; gap: 10px; margin-left: 20px;">`;
        html += `<button type="button" class="btn btn-sm btn-info global-var-copy-btn" 
          data-var-index="${index}"
          title="Копировать">
          <i class="fa fa-copy"></i>
        </button>`;
        html += `<button type="button" class="btn btn-sm btn-danger global-var-delete-btn" 
          data-var-index="${index}"
          title="Удалить">
          <i class="fa fa-trash"></i>
        </button>`;
        html += `</div>`;
        
        html += `</div>`;
      });
      
      if (html === '') {
        html = '<div style="text-align: center; padding: 40px; color: #999;"><p>Нет переменных</p></div>';
      }
      
      contentDiv.innerHTML = html;
      
      // Привязываем обработчики изменений
      attachGlobalVarHandlers();
    }
    
    // Привязка обработчиков для переменных
    function attachGlobalVarHandlers() {
      const contentDiv = document.getElementById('global-vars-content');
      if (!contentDiv) return;
      
      // Обработчики для всех полей
      contentDiv.querySelectorAll('.global-var-name, .global-var-key, .global-var-order, .global-var-group, .global-var-min, .global-var-max, .global-var-step, .global-var-value').forEach(input => {
        input.addEventListener('input', function() {
          updateGlobalVarFromInput(this);
        });
        input.addEventListener('change', function() {
          updateGlobalVarFromInput(this);
        });
      });
      
      // Обработчики для чекбоксов и селектов
      contentDiv.querySelectorAll('.global-var-show-menu, .global-var-type').forEach(input => {
        input.addEventListener('change', function() {
          updateGlobalVarFromInput(this);
        });
      });
      
      // Обработчики кнопок
      contentDiv.querySelectorAll('.global-var-copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const index = parseInt(this.getAttribute('data-var-index'));
          copyGlobalVar(index);
        });
      });
      
      contentDiv.querySelectorAll('.global-var-delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const index = parseInt(this.getAttribute('data-var-index'));
          deleteGlobalVar(index);
        });
      });
    }
    
    // Обновление переменной из поля ввода
    function updateGlobalVarFromInput(input) {
      const index = parseInt(input.getAttribute('data-var-index'));
      if (isNaN(index)) return;
      
      const groupSelect = document.getElementById('global-vars-group-select');
      if (!groupSelect || !globalVarsData || !globalVarsData.value) return;
      
      const groupIndex = parseInt(groupSelect.value) || 0;
      const group = globalVarsData.value[groupIndex];
      if (!group || !group.vars || !group.vars[index]) return;
      
      const varItem = group.vars[index];
      const className = input.className;
      
      if (className.includes('global-var-name')) {
        varItem.name = input.value;
      } else if (className.includes('global-var-key')) {
        varItem.key = input.value;
      } else if (className.includes('global-var-order')) {
        varItem.order = parseInt(input.value) || 0;
      } else if (className.includes('global-var-group')) {
        varItem.group = input.value;
      } else if (className.includes('global-var-min')) {
        if (!varItem.params) varItem.params = {};
        varItem.params.min = input.value ? parseFloat(input.value) : undefined;
      } else if (className.includes('global-var-max')) {
        if (!varItem.params) varItem.params = {};
        varItem.params.max = input.value ? parseFloat(input.value) : undefined;
      } else if (className.includes('global-var-step')) {
        if (!varItem.params) varItem.params = {};
        varItem.params.step = input.value ? parseFloat(input.value) : undefined;
      } else if (className.includes('global-var-value')) {
        if (input.type === 'checkbox') {
          varItem.value = input.checked ? 1 : 0;
        } else {
          varItem.value = input.value;
        }
      } else if (className.includes('global-var-show-menu')) {
        varItem.show_in_menu = input.checked ? 1 : 0;
      } else if (className.includes('global-var-type')) {
        varItem.type = input.value;
        // При смене типа нужно перерисовать блок
        renderGlobalVars(groupIndex);
        return;
      }
      
      // Debounce для сохранения
      clearTimeout(globalVarsDebounceTimer);
      globalVarsDebounceTimer = setTimeout(() => {
        // Не сохраняем автоматически, только при нажатии кнопки "Сохранить"
      }, GLOBAL_VARS_DEBOUNCE_DELAY);
    }
    
    // Копирование переменной
    function copyGlobalVar(index) {
      const groupSelect = document.getElementById('global-vars-group-select');
      if (!groupSelect || !globalVarsData || !globalVarsData.value) return;
      
      const groupIndex = parseInt(groupSelect.value) || 0;
      const group = globalVarsData.value[groupIndex];
      if (!group || !group.vars || !group.vars[index]) return;
      
      const originalVar = group.vars[index];
      const newVar = JSON.parse(JSON.stringify(originalVar));
      newVar.key = newVar.key + '_copy';
      newVar.name = (newVar.name || '') + ' (копия)';
      
      group.vars.push(newVar);
      renderGlobalVars(groupIndex);
    }
    
    // Удаление переменной
    function deleteGlobalVar(index) {
      if (typeof Swal === 'undefined') {
        if (confirm('Удалить эту переменную?')) {
          performDeleteGlobalVar(index);
        }
        return;
      }
      
      Swal.fire({
        title: 'Удалить переменную?',
        text: 'Это действие нельзя отменить',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Да, удалить',
        cancelButtonText: 'Отмена'
      }).then((result) => {
        if (result.isConfirmed) {
          performDeleteGlobalVar(index);
        }
      });
    }
    
    function performDeleteGlobalVar(index) {
      const groupSelect = document.getElementById('global-vars-group-select');
      if (!groupSelect || !globalVarsData || !globalVarsData.value) return;
      
      const groupIndex = parseInt(groupSelect.value) || 0;
      const group = globalVarsData.value[groupIndex];
      if (!group || !group.vars || !group.vars[index]) return;
      
      group.vars.splice(index, 1);
      renderGlobalVars(groupIndex);
    }
    
    // Добавление новой переменной
    function addGlobalVar() {
      // Проверяем, что данные загружены
      if (!globalVarsData || !globalVarsData.value || !Array.isArray(globalVarsData.value)) {
        console.error('❌ Данные глобальных переменных не загружены');
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            icon: 'error',
            title: 'Ошибка',
            text: 'Данные не загружены. Дождитесь загрузки переменных.'
          });
        } else {
          alert('Данные не загружены. Дождитесь загрузки переменных.');
        }
        return;
      }
      
      // Проверяем наличие селекта групп
      const groupSelect = document.getElementById('global-vars-group-select');
      if (!groupSelect) {
        console.error('❌ Элемент global-vars-group-select не найден');
        return;
      }
      
      const groupIndex = parseInt(groupSelect.value);
      if (isNaN(groupIndex) || groupIndex < 0) {
        console.error('❌ Неверный индекс группы:', groupSelect.value);
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            icon: 'warning',
            title: 'Выберите группу',
            text: 'Пожалуйста, выберите группу переменных перед добавлением новой переменной.'
          });
        } else {
          alert('Пожалуйста, выберите группу переменных.');
        }
        return;
      }
      
      const group = globalVarsData.value[groupIndex];
      if (!group) {
        console.error('❌ Группа не найдена по индексу:', groupIndex);
        return;
      }
      
      if (!group.vars) {
        group.vars = [];
      }
      
      const newVar = {
        name: '',
        key: '',
        type: 'number',
        value: '',
        editable: 1,
        order: group.vars.length,
        group: '',
        params: {
          min: 1,
          max: '',
          step: 1
        },
        show_in_menu: 0
      };
      
      group.vars.push(newVar);
      renderGlobalVars(groupIndex);
    }
    
    window.addGlobalVar = addGlobalVar;
    
    // Обработка изменения переменной
    function handleGlobalVarChange(input) {
      const key = input.getAttribute('data-key');
      const type = input.getAttribute('data-type');
      let value;
      
      if (type === 'boolean') {
        value = input.checked ? 1 : 0;
      } else if (type === 'number') {
        value = parseFloat(input.value) || 0;
        // Валидация min/max
        const min = parseFloat(input.getAttribute('min'));
        const max = parseFloat(input.getAttribute('max'));
        if (!isNaN(min) && value < min) {
          value = min;
          input.value = min;
        }
        if (!isNaN(max) && max !== '' && value > max) {
          value = max;
          input.value = max;
        }
      } else {
        value = input.value;
      }
      
      // Обновляем значение в данных
      if (globalVarsData && globalVarsData.value) {
        const groupIndex = parseInt(document.getElementById('global-vars-group-select').value) || 0;
        const group = globalVarsData.value[groupIndex];
        if (group && group.vars) {
          const varItem = group.vars.find(v => v.key === key);
          if (varItem) {
            varItem.value = value;
          }
        }
      }
      
      // Не сохраняем автоматически, только при нажатии кнопки "Сохранить"
    }
    
    // Сохранение глобальных переменных
    async function saveGlobalVars() {
      if (!globalVarsData) return;
      
      try {
        const response = await fetch('/api/catalog/global_vars/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(globalVarsData)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        // Показываем уведомление об успешном сохранении
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            icon: 'success',
            title: 'Сохранено',
            text: 'Глобальные переменные успешно сохранены',
            timer: 2000,
            showConfirmButton: false
          });
        }
        
      } catch (error) {
        console.error('❌ Ошибка сохранения глобальных переменных:', error);
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            icon: 'error',
            title: 'Ошибка',
            text: 'Не удалось сохранить глобальные переменные'
          });
        }
      }
    }
    
    // Экспортируем функции в window для глобального доступа
    window.loadGlobalVars = loadGlobalVars;
    window.saveGlobalVars = saveGlobalVars;
    
    // ========== Управление комнатой (room-settings) ==========
    const ROOM_SETTINGS_KEY = 'room_settings';
    async function loadRoomSettings() {
      const container = document.getElementById('room-settings-catalog-list');
      if (!container) return;
      // Сразу загружаем шаги комнаты и сводку сохранённых пунктов (не ждём каталог)
      if (typeof window.loadRoomStepsUI === 'function') window.loadRoomStepsUI();
      container.innerHTML = '<div class="text-muted p-3">Загрузка типов каталога...</div>';
      let settings = {};
      try {
        const raw = localStorage.getItem(ROOM_SETTINGS_KEY);
        if (raw) settings = JSON.parse(raw);
      } catch (e) {}
      const visibleTypes = settings.visibleCatalogTypes || [];
      const categoryFilter = settings.categoryFilter || {};
      try {
        const res = await fetch('/api/catalog/items_get/catalogs_keys');
        const typesData = await res.json();
        const types = Array.isArray(typesData) ? typesData : (typesData.items || []);
        if (!types.length) {
          container.innerHTML = '<div class="text-muted p-3">Нет типов каталога. Добавьте типы в разделе «Каталог элементов → Типы элементов».</div>';
          return;
        }
        let html = '';
        for (const t of types) {
          const typeKey = (t.key || t.id || t.name || '').toString().trim() || ('catalog_' + (t.id || ''));
          const typeName = (t.name || typeKey).replace(/</g, '&lt;');
          const checked = visibleTypes.indexOf(typeKey) !== -1;
          const catFilter = categoryFilter[typeKey] || [];
          html += '<div class="border rounded p-3 mb-3" style="background:#fafafa;">';
          html += '<label class="d-flex align-items-center mb-2"><input type="checkbox" class="room-type-check mr-2" data-type="' + typeKey.replace(/"/g, '&quot;') + '" ' + (checked ? 'checked' : '') + '> <strong>' + typeName + '</strong></label>';
          html += '<div class="room-categories-wrap ml-4" data-type="' + typeKey.replace(/"/g, '&quot;') + '" style="' + (checked ? '' : 'display:none;') + '">';
          html += '<small class="text-muted d-block mb-2">Категории (если не отмечено ни одной — в комнате показываются все):</small>';
          html += '<div class="room-categories-list" data-type="' + typeKey.replace(/"/g, '&quot;') + '">Загрузка...</div>';
          html += '</div></div>';
        }
        container.innerHTML = html;
        container.querySelectorAll('.room-type-check').forEach(cb => {
          cb.addEventListener('change', function() {
            const wrap = container.querySelector('.room-categories-wrap[data-type="' + CSS.escape(this.getAttribute('data-type')) + '"]');
            if (wrap) wrap.style.display = this.checked ? '' : 'none';
          });
        });
        for (const t of types) {
          const typeKey = (t.key || t.id || t.name || '').toString().trim() || ('catalog_' + (t.id || ''));
          const listEl = container.querySelector('.room-categories-list[data-type="' + CSS.escape(typeKey) + '"]');
          if (!listEl) continue;
          try {
            const catRes = await fetch('/api/catalog/categories_get/' + encodeURIComponent(typeKey));
            const cats = await catRes.json();
            const arr = Array.isArray(cats) ? cats : [];
            const selectedIds = (categoryFilter[typeKey] || []).map(String);
            if (!arr.length) {
              listEl.innerHTML = '<span class="text-muted">Нет категорий</span>';
              continue;
            }
            const path = function(id, map) {
              const c = map[id];
              if (!c) return [];
              const p = c.parent !== undefined && c.parent !== null ? c.parent : c.parent_id;
              if (!p || !map[p]) return [c.name || ''];
              return path(p, map).concat([c.name || '']);
            };
            const map = {};
            arr.forEach(c => { map[c.id] = { id: c.id, name: c.name, parent: c.parent !== undefined && c.parent !== null ? c.parent : c.parent_id }; });
            let opts = '';
            arr.forEach(c => {
              const label = path(c.id, map).join(' / ') || (c.name || '');
              const sel = selectedIds.indexOf(String(c.id)) !== -1;
              opts += '<label class="d-block mb-1"><input type="checkbox" class="room-cat-check mr-2" data-type="' + typeKey.replace(/"/g, '&quot;') + '" data-id="' + c.id + '"' + (sel ? ' checked' : '') + '> ' + (label || '').replace(/</g, '&lt;') + '</label>';
            });
            listEl.innerHTML = opts;
          } catch (err) {
            listEl.innerHTML = '<span class="text-danger">Ошибка загрузки</span>';
          }
        }
      } catch (err) {
        console.error('loadRoomSettings:', err);
        container.innerHTML = '<div class="text-danger p-3">Ошибка загрузки. Проверьте консоль.</div>';
      }
    }
    function saveRoomSettings() {
      const container = document.getElementById('room-settings-catalog-list');
      if (!container) return;
      const visibleTypes = [];
      container.querySelectorAll('.room-type-check:checked').forEach(cb => visibleTypes.push(cb.getAttribute('data-type')));
      const categoryFilter = {};
      container.querySelectorAll('.room-categories-list[data-type]').forEach(listEl => {
        const typeKey = listEl.getAttribute('data-type');
        const ids = [];
        listEl.querySelectorAll('.room-cat-check:checked').forEach(ch => ids.push(parseInt(ch.getAttribute('data-id'), 10)));
        if (ids.length) categoryFilter[typeKey] = ids;
      });
      const settings = { visibleCatalogTypes: visibleTypes, categoryFilter: categoryFilter };
      try {
        localStorage.setItem(ROOM_SETTINGS_KEY, JSON.stringify(settings));
        if (typeof toastr !== 'undefined') toastr.success('Настройки комнаты сохранены');
        else alert('Настройки комнаты сохранены');
      } catch (e) {
        if (typeof toastr !== 'undefined') toastr.error('Ошибка сохранения');
        else alert('Ошибка сохранения');
      }
    }
    window.loadRoomSettings = loadRoomSettings;
    window.saveRoomSettings = saveRoomSettings;
    
    // ---------- Шаги комнаты: выпадающий список шагов, для каждого — иконки и названия ----------
    const ROOM_STEPS_CONFIG_KEY = 'room_steps_config';
    const DEFAULT_STEP1_ITEMS = [
      { id: '1', name: 'Гостиная', icon: 'fa-couch', key: 'living-room', categoryId: null, order: 0 },
      { id: '2', name: 'Спальня', icon: 'fa-bed', key: 'bedroom', categoryId: null, order: 1 },
      { id: '3', name: 'Детская', icon: 'fa-child', key: 'nursery', categoryId: null, order: 2 },
      { id: '4', name: 'Прихожая', icon: 'fa-door-open', key: 'hallway', categoryId: null, order: 3 },
      { id: '5', name: 'Постирочная', icon: 'fa-tshirt', key: 'laundry', categoryId: null, order: 4 },
      { id: '6', name: 'Балкон', icon: 'fa-home', key: 'balcony', categoryId: null, order: 5 }
    ];
    const DEFAULT_STEP_TITLES = { 1: 'Тип комнаты', 2: 'Конфигурация мебели' };
    function getRoomStepsConfig() {
      try {
        const raw = localStorage.getItem(ROOM_STEPS_CONFIG_KEY);
        if (raw) {
          const c = JSON.parse(raw);
          if (c && c.steps && c.steps.length) return c;
        }
      } catch (e) {}
      return {
        steps: [
          { stepId: 1, title: 'Тип комнаты', items: DEFAULT_STEP1_ITEMS.map((it, i) => ({ ...it, order: i })), columnsPerRow: 2 },
          { stepId: 2, title: 'Конфигурация мебели', items: [], columnsPerRow: 2 }
        ]
      };
    }
    function ensureStepsInConfig(config) {
      [1, 2].forEach(function(stepId) {
        var existing = config.steps.find(function(s) { return s.stepId === stepId; });
        if (!existing) {
          config.steps.push({ stepId: stepId, title: DEFAULT_STEP_TITLES[stepId] || 'Шаг ' + stepId, items: [], columnsPerRow: 2 });
        } else if (stepId === 2) {
          var t = (existing.title || '').trim();
          if (!t || t === 'Тип комнаты' || t === 'ТИП КОМНАТЫ') {
            existing.title = DEFAULT_STEP_TITLES[2];
          }
        }
      });
      return config;
    }
    function saveRoomStepsConfig(config) {
      try {
        localStorage.setItem(ROOM_STEPS_CONFIG_KEY, JSON.stringify(config));
        return true;
      } catch (e) { return false; }
    }
    function getCurrentStepId() {
      var el = document.getElementById('room-step-current-id');
      return el ? parseInt(el.value, 10) || 1 : 1;
    }
    function setCurrentStepId(stepId) {
      var el = document.getElementById('room-step-current-id');
      if (el) el.value = String(stepId);
    }
    function refreshRoomStepTabs(config) {
      var ul = document.getElementById('room-step-tabs');
      if (!ul || !config || !config.steps) return;
      var currentId = getCurrentStepId();
      ul.innerHTML = config.steps.sort(function(a, b) { return a.stepId - b.stepId; }).map(function(s) {
        var title = (s.title || 'Шаг ' + s.stepId).replace(/</g, '&lt;');
        var active = s.stepId === currentId ? ' active' : '';
        return '<li class="nav-item"><a class="nav-link room-step-tab' + active + '" href="#" data-step-id="' + s.stepId + '" role="tab">Шаг ' + s.stepId + ': ' + title + '</a></li>';
      }).join('');
    }
    function renderRoomStepsSummary() {
      var el = document.getElementById('room-steps-summary-text');
      if (!el) return;
      try {
        var config = getRoomStepsConfig();
        if (!config || !config.steps || config.steps.length === 0) {
          el.textContent = 'Нет сохранённых шагов. Добавьте пункты и нажмите «Сохранить шаги комнаты».';
          return;
        }
        var parts = [];
        config.steps.sort(function(a, b) { return a.stepId - b.stepId; }).forEach(function(s) {
          var items = Array.isArray(s.items) ? s.items : [];
          var names = items.sort(function(a, b) { return (a.order || 0) - (b.order || 0); }).map(function(it) { return it.name || '—'; });
          var title = (s.title || 'Шаг ' + s.stepId);
          if (names.length === 0) {
            parts.push('Шаг ' + s.stepId + ' (' + title + '): 0 шт.');
          } else {
            parts.push('Шаг ' + s.stepId + ' (' + title + '): ' + names.join(', ') + ' — ' + names.length + ' шт.');
          }
        });
        el.textContent = parts.join('  |  ');
      } catch (e) {
        el.textContent = 'Ошибка загрузки списка. Добавьте пункты ниже и нажмите «Сохранить шаги комнаты».';
      }
    }
    function buildStepItemHtml(it, idx) {
      var iconVal = (it.icon || '').trim();
      var isImg = /^https?:\/\//i.test(iconVal) || iconVal.startsWith('/');
      var preview = isImg
        ? '<img src="' + iconVal.replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:contain;border-radius:6px;" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline-block\';"><i class="fa fa-image" style="display:none;font-size:24px;color:#999;"></i>'
        : '<i class="fa ' + (iconVal || 'fa-circle').replace(/"/g, '') + '" style="font-size:28px;color:#333;"></i>';
      return '<div class="room-step-item border-bottom pb-2 mb-2" data-id="' + (it.id || idx).toString().replace(/"/g, '&quot;') + '">' +
        '<div class="d-flex align-items-center flex-wrap gap-2">' +
        '<div class="room-step-preview" style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;background:#fff;border:1px solid #ddd;border-radius:8px;flex-shrink:0;">' + preview + '</div>' +
        '<input type="text" class="form-control form-control-sm room-step-name" placeholder="Название" value="' + (it.name || '').replace(/"/g, '&quot;').replace(/</g, '&lt;') + '" style="width:130px;">' +
        '<input type="text" class="form-control form-control-sm room-step-icon" placeholder="fa-couch или URL" value="' + (iconVal || '').replace(/"/g, '&quot;').replace(/</g, '&lt;') + '" style="width:180px;">' +
        '<button type="button" class="btn btn-sm btn-outline-secondary room-step-upload-btn" title="Загрузить картинку"><i class="fa fa-upload"></i> Загрузить</button>' +
        '<input type="text" class="form-control form-control-sm room-step-key" placeholder="Ключ" value="' + (it.key || '').replace(/"/g, '&quot;').replace(/</g, '&lt;') + '" style="width:100px;">' +
        '<select class="form-control form-control-sm room-step-category" style="width:130px;"><option value="">— Категория —</option></select>' +
        '<input type="number" class="form-control form-control-sm room-step-order" placeholder="0" value="' + (it.order ?? idx) + '" style="width:50px;">' +
        '<button type="button" class="btn btn-sm btn-outline-danger room-step-del" title="Удалить"><i class="fa fa-trash"></i></button>' +
        '</div></div>';
    }
    function updateRoomStepItemsCount() {
      var container = document.getElementById('room-step-items');
      var countEl = document.getElementById('room-step-items-count');
      if (countEl && container) countEl.textContent = container.querySelectorAll('.room-step-item').length;
    }
    function bindStepItemEvents(container) {
      if (!container) return;
      container.querySelectorAll('.room-step-del').forEach(function(btn) {
        btn.addEventListener('click', function() {
          this.closest('.room-step-item')?.remove();
          updateRoomStepItemsCount();
        });
      });
      container.querySelectorAll('.room-step-icon').forEach(function(input) {
        input.addEventListener('input', function() {
          var itemEl = this.closest('.room-step-item');
          var prev = itemEl?.querySelector('.room-step-preview');
          if (!prev) return;
          var v = this.value.trim();
          var isImg = /^https?:\/\//i.test(v) || v.startsWith('/');
          if (isImg) prev.innerHTML = '<img src="' + v.replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:contain;border-radius:6px;" onerror="this.style.display=\'none\';"><i class="fa fa-image" style="font-size:24px;color:#999;"></i>';
          else prev.innerHTML = '<i class="fa ' + (v || 'fa-circle') + '" style="font-size:28px;color:#333;"></i>';
        });
      });
      container.querySelectorAll('.room-step-upload-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var row = this.closest('.room-step-item');
          var iconInput = row ? row.querySelector('.room-step-icon') : null;
          if (!iconInput) return;
          window._roomStepUploadTarget = iconInput;
          var upl = document.getElementById('room-step-icon-upload-input');
          if (upl) upl.click();
        });
      });
    }
    async function loadCategoriesIntoStepItems(container, items) {
      if (!container || !items || items.length === 0) return;
      try {
        var res = await fetch('/api/catalog/categories_get/catalog_26');
        var cats = await res.json();
        var arr = Array.isArray(cats) ? cats : [];
        var sorted = items.slice().sort(function(a, b) { return (a.order || 0) - (b.order || 0); });
        container.querySelectorAll('.room-step-item').forEach(function(row, idx) {
          var sel = row.querySelector('.room-step-category');
          var it = sorted[idx];
          if (!sel) return;
          sel.innerHTML = '<option value="">— Категория —</option>' + arr.map(function(c) { return '<option value="' + c.id + '">' + (c.name || '').replace(/</g, '&lt;') + '</option>'; }).join('');
          if (it && it.categoryId) sel.value = it.categoryId;
        });
      } catch (e) {}
    }
    function saveCurrentStepToConfig(stepIdToSave) {
      var config = getRoomStepsConfig();
      var stepId = (stepIdToSave !== undefined && stepIdToSave !== null) ? stepIdToSave : getCurrentStepId();
      var step = config.steps.find(function(s) { return s.stepId === stepId; });
      if (!step) return config;
      var titleEl = document.getElementById('room-step-title-input');
      var colsEl = document.getElementById('room-step-columns');
      var container = document.getElementById('room-step-items');
      step.title = (titleEl && titleEl.value) ? titleEl.value.trim() : (step.title || 'Шаг ' + stepId);
      step.columnsPerRow = (colsEl && colsEl.value) ? (parseInt(colsEl.value, 10) === 1 ? 1 : 2) : 2;
      step.items = [];
      if (container) {
        container.querySelectorAll('.room-step-item').forEach(function(row, idx) {
          var name = (row.querySelector('.room-step-name') && row.querySelector('.room-step-name').value || '').trim();
          var icon = (row.querySelector('.room-step-icon') && row.querySelector('.room-step-icon').value || '').trim();
          var key = (row.querySelector('.room-step-key') && row.querySelector('.room-step-key').value || '').trim();
          var cat = row.querySelector('.room-step-category') ? row.querySelector('.room-step-category').value : '';
          var order = parseInt((row.querySelector('.room-step-order') && row.querySelector('.room-step-order').value) || '0', 10);
          step.items.push({ id: row.getAttribute('data-id') || 'i' + idx, name: name || 'Пункт ' + (idx + 1), icon: icon || 'fa-circle', key: key || 'item-' + idx, categoryId: cat ? parseInt(cat, 10) : null, order: order });
        });
      }
      return config;
    }
    async function renderStepPanel(stepId) {
      var config = getRoomStepsConfig();
      config = ensureStepsInConfig(config);
      var step = config.steps.find(function(s) { return s.stepId === stepId; }) || config.steps[0];
      var titleEl = document.getElementById('room-step-title-input');
      var colsEl = document.getElementById('room-step-columns');
      var container = document.getElementById('room-step-items');
      if (!container) return;
      if (titleEl) titleEl.value = step.title || ('Шаг ' + stepId);
      if (colsEl) colsEl.value = String(step.columnsPerRow === 1 ? 1 : 2);
      var items = Array.isArray(step.items) ? step.items : [];
      container.innerHTML = items.length === 0
        ? '<div class="text-muted p-2">Нет иконок. Нажмите «Добавить иконку».</div>'
        : items.sort(function(a, b) { return (a.order || 0) - (b.order || 0); }).map(function(it, idx) { return buildStepItemHtml(it, idx); }).join('');
      bindStepItemEvents(container);
      var countEl = document.getElementById('room-step-items-count');
      if (countEl) countEl.textContent = items.length;
      if (items.length > 0) await loadCategoriesIntoStepItems(container, items);
      setCurrentStepId(stepId);
      document.querySelectorAll('.room-step-tab').forEach(function(a) {
        a.classList.remove('active');
        if (parseInt(a.getAttribute('data-step-id'), 10) === stepId) a.classList.add('active');
      });
    }
    function onRoomStepTabClick(e) {
      e.preventDefault();
      var tab = e.target.closest('.room-step-tab');
      if (!tab) return;
      var newStepId = parseInt(tab.getAttribute('data-step-id'), 10) || 1;
      var previousStepId = getCurrentStepId();
      if (newStepId === previousStepId) return;
      var config = saveCurrentStepToConfig(previousStepId);
      saveRoomStepsConfig(config);
      setCurrentStepId(newStepId);
      document.querySelectorAll('.room-step-tab').forEach(function(a) {
        a.classList.remove('active');
        if (parseInt(a.getAttribute('data-step-id'), 10) === newStepId) a.classList.add('active');
      });
      renderStepPanel(newStepId).then(function() { renderRoomStepsSummary(); });
      renderRoomStepsSummary();
    }
    async function loadRoomStepsUI() {
      var config = getRoomStepsConfig();
      config = ensureStepsInConfig(config);
      saveRoomStepsConfig(config);
      setCurrentStepId(1);
      refreshRoomStepTabs(config);
      var tabsWrap = document.getElementById('room-step-tabs');
      if (tabsWrap) {
        tabsWrap.addEventListener('click', function(e) {
          if (e.target.closest('.room-step-tab')) onRoomStepTabClick(e);
        });
      }
      await renderStepPanel(1);
      renderRoomStepsSummary();
    }
    (function() {
      const uploadInput = document.getElementById('room-step-icon-upload-input');
      if (uploadInput) {
        uploadInput.addEventListener('change', function() {
          const target = window._roomStepUploadTarget;
          window._roomStepUploadTarget = null;
          const file = this.files && this.files[0];
          if (!file || !target) { this.value = ''; return; }
          const fd = new FormData();
          fd.append('file', file);
          var inputEl = this;
          fetch('/api/upload/room_icon', { method: 'POST', body: fd })
            .then(function(r) { return r.json(); })
            .then(function(data) {
              inputEl.value = '';
              if (data.files && data.files[0] && data.files[0].url) {
                target.value = data.files[0].url;
                target.dispatchEvent(new Event('input', { bubbles: true }));
                if (typeof toastr !== 'undefined') toastr.success('Картинка загружена');
              } else if (typeof toastr !== 'undefined') toastr.error(data.error || 'Ошибка загрузки');
            })
            .catch(function(err) {
              inputEl.value = '';
              if (typeof toastr !== 'undefined') toastr.error('Ошибка загрузки');
            });
        });
      }
    })();
    function saveRoomSteps() {
      var config = saveCurrentStepToConfig();
      if (saveRoomStepsConfig(config)) {
        if (typeof toastr !== 'undefined') toastr.success('Шаги комнаты сохранены');
        else alert('Шаги комнаты сохранены');
        refreshRoomStepTabs(config);
        renderRoomStepsSummary();
      } else {
        if (typeof toastr !== 'undefined') toastr.error('Ошибка сохранения');
        else alert('Ошибка сохранения');
      }
    }
    window.getRoomStepsConfig = getRoomStepsConfig;
    window.loadRoomStepsUI = loadRoomStepsUI;
    window.saveRoomSteps = saveRoomSteps;
    
    // Рендеринг таблицы с учетом пагинации
    function renderCatalogTypesTable() {
        const tbody = document.getElementById('catalog-types-table-body');
      if (!tbody) return;
      
      const { currentPage, perPage, allData } = catalogTypesPagination;
      
      // ������� �������
          tbody.innerHTML = '';
      
      // ���� ������ ��� (������ ������)
      if (!allData || (Array.isArray(allData) && allData.length === 0)) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#999;">Нет данных</td></tr>';
        renderCatalogTypesPagination(0);
        return;
      }
      
      // Вычисляем индексы для текущей страницы
      const startIndex = (currentPage - 1) * perPage;
      const endIndex = startIndex + perPage;
      const pageData = allData.slice(startIndex, endIndex);
      
      // �������� ������ ������� �������� (�� ���������: �������, ID, ��������, ��������)
      pageData.forEach(item => {
            const row = document.createElement('tr');
            
          // ������� (�� ���������: <td style="width: 10px;"><input type="checkbox" value="1"></td>)
            const checkboxCell = document.createElement('td');
            checkboxCell.style.width = '10px';
          checkboxCell.style.verticalAlign = 'middle';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = item.id;
          checkbox.className = 'catalog-type-checkbox';
            checkboxCell.appendChild(checkbox);
            
          // ID (�� ���������: <td style="width: 50px;">1</td>)
            const idCell = document.createElement('td');
            idCell.style.width = '50px';
          idCell.style.verticalAlign = 'middle';
          idCell.textContent = item.id || '-';
            
          // �������� (�� ���������: ������ <td>�����</td> - ��� catalogs_keys ������ ��������)
            const nameCell = document.createElement('td');
          nameCell.style.verticalAlign = 'middle';
          // ��� catalogs_keys �������� ������� �� item.name (�� �� params)
          nameCell.textContent = item.name || '-';
            
          // �������� (�� ���������: ������������� � �������)
            const actionsCell = document.createElement('td');
          actionsCell.className = 'col-actions';
            actionsCell.style.width = '150px';
          actionsCell.style.verticalAlign = 'middle';
          actionsCell.style.textAlign = 'center';
            
          // ������������� (�� ���������: <a href="/catalog/item/catalogs_keys/1">)
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
            
          // ������� (�� ���������: <i class="fa fa-trash btn btn-outline btn-danger"></i> � show_swal)
            const deleteIcon = document.createElement('i');
            deleteIcon.className = 'fa fa-trash btn btn-outline btn-danger';
            deleteIcon.style.cursor = 'pointer';
          deleteIcon.style.marginLeft = '6px';
            deleteIcon.title = 'Удалить';
            deleteIcon.onclick = () => {
            if (typeof window.deleteCatalogType === 'function') {
              window.deleteCatalogType(item.id, item.name);
            } else {
              console.error('❌ ������� deleteCatalogType �� �������');
              alert('Ошибка: функция удаления не найдена. Перезагрузите страницу.');
              }
            };
            
            actionsCell.appendChild(editLink);
            actionsCell.appendChild(deleteIcon);
            
          // ��������� ������ � ������ (�� ���������: �������, ID, ��������, ��������)
            row.appendChild(checkboxCell);
            row.appendChild(idCell);
            row.appendChild(nameCell);
            row.appendChild(actionsCell);
            
          // ��������� ������ � �������
            tbody.appendChild(row);
          });
        // ��������� ������� "������� ���������" � ������ (�� ���������) - ���������� ��� ������
        updateCatalogSubmenu(allData);
        
        // �������� ���������
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
      
      // ������� ������ ������������ ���� (��������� "Типы элементов" � "Элемент")
      const existingDynamicItems = submenu.querySelectorAll('li[data-catalog-type]');
      existingDynamicItems.forEach(item => item.remove());
      
      if (!catalogTypes || !Array.isArray(catalogTypes) || catalogTypes.length === 0) {
        return;
      }
      
      // Маппинг названий компонентов на их структуру (по референсу)
      catalogTypes.forEach(type => {
        // ���������� key �� name (��������, "Фасад" -> "catalog_module")
        // � ��������� ������������ key �� ������, �� � ��� ��� ���, ������� ����������
        const key = type.key || `catalog_${type.id}`;
        const name = type.name || '';
        
        // ������� ������� ���� (�� ���������: <li style="position: relative">)
        const li = document.createElement('li');
        li.setAttribute('data-catalog-type', type.id);
        li.style.position = 'relative';
        
        // ������� ������ (�� ���������: /catalog/items/catalog_module)
        const link = document.createElement('a');
        link.href = `#catalog-items?type=${key}`;
        link.textContent = name;
        link.setAttribute('data-page', 'catalog-items');
        link.setAttribute('data-catalog-type', key);
        link.setAttribute('data-catalog-name', name);
        li.appendChild(link);
        
        // ������� ������ "���������" (�� ���������: cat_button)
        const catButton = document.createElement('div');
        catButton.className = 'cat_button';
        catButton.title = `Категории ${name}`;
        const catButtonLink = document.createElement('a');
        // ���������� ������������� �������� ������ ��������� (edges-categories),
        // ������� ���� ��� ��������. ��� �� �� ������, ��� � � ������ "���������"
        // � ����� ������ ���������.
        catButtonLink.href = `#edges-categories?type=${key}`;
        catButtonLink.innerHTML = '<i class="fa fa-folder-open-o"></i>';
        catButton.appendChild(catButtonLink);
        li.appendChild(catButton);
        
        // ��������� � �������
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

          // ����� � ������ �����
          if (pageId === 'handles-list') {
            if (typeof window.loadHandlesList === 'function') {
              window.loadHandlesList();
            }
          }

          // ����� � �������������� �����
          if (pageId === 'handles-item-edit') {
            const hash = window.location.hash;
            const urlParams = new URLSearchParams(hash.split('?')[1] || '');
            const itemId = parseInt(urlParams.get('id') || '0', 10);
            if (typeof window.loadHandlesItemEdit === 'function') {
              window.loadHandlesItemEdit(itemId);
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
          // Обработчики команд меню (привязываем один раз)
          const innerDiv = materialPreview.querySelector('div');
          if (innerDiv) {
            innerDiv.style.backgroundImage = '';
            innerDiv.innerHTML = '3D-������ ��������� (� ����������)';
          }
          return;
        }

        iconInput.value = url;
        iconPreview.src = url;
        iconPreviewWrapper.style.display = 'block';
        iconPlaceholder.style.display = 'none';

        // ���������� ������ � ������ ������ (� ����� �������������� ������, ��� � ����)
        const innerDiv = materialPreview.querySelector('div');
        if (innerDiv) {
          innerDiv.style.backgroundImage = `url('${url}')`;
          innerDiv.style.backgroundSize = 'cover';
          innerDiv.style.backgroundPosition = 'center';
          innerDiv.innerHTML = ''; // ������� �����, ���������� ������ �����������
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
              // �������������� ������������� ��������
              loadCatalogItemData(itemId, catalogType);
            } else {
              // Создание нового элемента
              // ������� ������ (�� ��������� � ������ ��������)
              window.catalogItemVueApp.item = {
                name: '',
                category: [],
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
                depth: 200,
                placementKind: 'floor_in_niche',
              };
              // Для фасадов не запускаем конструктор и не сбрасываем JSON,
              // оставляем только форму заполнения (как в референсе "Добавить фрезеровку").
              if (catalogType !== 'facades') {
                window.__CLD_IS_NEW_MODULE = true;
                // �������������� ����� ����������� ����� ������ __cldInitConstructorTab
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
            if (typeof window.__cldSyncCatalogPlacementKindOptions === 'function') {
              window.__cldSyncCatalogPlacementKindOptions(window.catalogItemVueApp);
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
              category: [],
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
              depth: 200,
              placementKind: 'floor_in_niche',
            },
            categories: [], // Данные для Vue Treeselect
            categoriesReady: false,
            categorySelectOptions: [], // Плоский список для select «Категория» с путём (как в референсе: Родитель / Дочерняя)
            placementKindOptions: [],
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
              const normId = (raw) => {
                if (raw == null || raw === '') return null;
                const n = Number(raw);
                return Number.isFinite(n) ? n : raw;
              };
              // Создаем карту категорий по ID
              const categoryMap = {};
              const rootCategories = [];
              
              categories.forEach(cat => {
                const id = normId(cat.id != null ? cat.id : cat.category_id);
                if (id == null) return;
                const category = {
                  id: id,
                  label: cat.name || cat.label || cat.title || 'Без названия',
                  children: []
                };
                categoryMap[id] = category;
              });
              
              // Строим дерево: поддерживаем и parent, и parent_id (референс — parent)
              categories.forEach(cat => {
                const cid = normId(cat.id != null ? cat.id : cat.category_id);
                if (cid == null) return;
                const category = categoryMap[cid];
                const parentRaw = cat.parent !== undefined && cat.parent !== null ? cat.parent : cat.parent_id;
                const parentId = normId(parentRaw);
                if (parentId != null && categoryMap[parentId]) {
                  categoryMap[parentId].children.push(category);
                } else {
                  rootCategories.push(category);
                }
              });
              
              return rootCategories;
            },
            /** ����� ������: �������� id ��������� � ������ treeselect � ������� ������� ���. */
            onCatalogCategoryInput: function(val) {
              let src = val;
              if (src == null) src = [];
              if (!Array.isArray(src)) src = [src];
              const next = [];
              for (let i = 0; i < src.length; i++) {
                const x = src[i];
                if (x === '' || x == null) continue;
                if (typeof x === 'number' && Number.isFinite(x)) {
                  next.push(x);
                } else if (typeof x === 'string' && String(x).trim() !== '') {
                  const n = Number(String(x).trim());
                  next.push(Number.isFinite(n) ? n : x);
                } else if (typeof x === 'object' && x != null && x.id != null) {
                  const idn = Number(x.id);
                  next.push(Number.isFinite(idn) ? idn : x.id);
                }
              }
              this.$set(this.item, 'category', next);
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
                
                const constructorTree =
                  typeof window.getConstructorTreeJSON === 'function'
                    ? window.getConstructorTreeJSON()
                    : null;
                if (
                  constructorTree &&
                  this.item.name &&
                  typeof window.syncCatalogDisplayNameIntoConstructorTree === 'function'
                ) {
                  window.syncCatalogDisplayNameIntoConstructorTree(
                    constructorTree,
                    this.item.name
                  );
                }
                const itemIdForSave = document.getElementById('item_id').value;
                const isExistingItem = itemIdForSave && itemIdForSave !== '0';
                const controllerNameForSave =
                  document.getElementById('controller_name')?.value || '';
                if (isExistingItem) {
                  if (!constructorTree || typeof constructorTree !== 'object') {
                    constructorTree = {
                      template: { structure: [] },
                      children: [],
                      spec: { template: { tree: [] } },
                    };
                  }
                  const ts = Array.isArray(constructorTree.template?.structure)
                    ? constructorTree.template.structure
                    : [];
                  const tr = Array.isArray(constructorTree.spec?.template?.tree)
                    ? constructorTree.spec.template.tree
                    : [];
                  const ch = Array.isArray(constructorTree.children)
                    ? constructorTree.children
                    : [];
                  if (ts.length === 0 && tr.length === 0 && ch.length === 0) {
                    let fallback = null;
                    try {
                      const rootModule = document.getElementById('constructor-root-module');
                      const nd = rootModule && rootModule.nodeData;
                      if (nd && Array.isArray(nd.clodisJSON) && nd.clodisJSON.length > 0) {
                        fallback = nd.clodisJSON;
                      }
                      const cached = window.__cldLastLoadedCatalogConstructor;
                      if (
                        !fallback &&
                        cached &&
                        String(cached.id) === String(itemIdForSave) &&
                        Array.isArray(cached.clodisJSON) &&
                        cached.clodisJSON.length > 0
                      ) {
                        fallback = cached.clodisJSON;
                      }
                    } catch (_) {}
                    if (Array.isArray(fallback) && fallback.length > 0) {
                      const cloned = JSON.parse(JSON.stringify(fallback));
                      constructorTree.children = cloned;
                      constructorTree.template = constructorTree.template || {};
                      constructorTree.template.structure = JSON.parse(JSON.stringify(cloned));
                      constructorTree.spec = constructorTree.spec || {};
                      constructorTree.spec.template = constructorTree.spec.template || {};
                      constructorTree.spec.template.tree = JSON.parse(JSON.stringify(cloned));
                    } else {
                      alert(
                        'Сохранение отменено: конструктор ещё не загружен (пустое JSON). Откройте вкладку «Конструктор» и дождитесь дерева, затем снова «Сохранить».'
                      );
                      return;
                    }
                  }
                }
                const clodisJSON =
                  constructorTree &&
                  constructorTree.template &&
                  Array.isArray(constructorTree.template.structure)
                    ? constructorTree.template.structure
                    : constructorTree &&
                        constructorTree.spec &&
                        constructorTree.spec.template &&
                        Array.isArray(constructorTree.spec.template.tree)
                      ? constructorTree.spec.template.tree
                      : [];
                const clodisVariables =
                  constructorTree &&
                  constructorTree.variables &&
                  constructorTree.variables.main &&
                  typeof constructorTree.variables.main === 'object'
                    ? { ...constructorTree.variables.main }
                    : {};

                // ������������ ��������� ������ � ��������� (��� �������� ��������/�����):
                // - animator.id = "hinge_animator"
                // - furniture ������ animator -> spec.id = "3" (� ������)
                // - furniture � �������� ������ -> spec.id = "1" (� �������)
                const normalizeHingeTemplateToRef = (nodes) => {
                  const list = Array.isArray(nodes) ? nodes : [];
                  const stack = [...list];
                  while (stack.length) {
                    const n = stack.pop();
                    if (!n || typeof n !== 'object') continue;
                    if (Array.isArray(n.children)) stack.push(...n.children);
                    if (String(n.type || '') !== 'animator') continue;
                    if (String(n?.spec?.fn || '') !== 'rotate') continue;

                    const animChildren = Array.isArray(n.children) ? n.children : [];
                    const hasModel = animChildren.some((ch) => String(ch?.type || '') === 'model');
                    const hasFurniture = animChildren.some((ch) => String(ch?.type || '') === 'furniture');
                    if (!hasModel || !hasFurniture) continue;

                    n.id = 'hinge_animator';

                    // �������� �������� (������ animator)
                    for (const ch of animChildren) {
                      if (!ch || typeof ch !== 'object') continue;
                      if (String(ch.type || '') !== 'furniture') continue;
                      ch.spec = (ch.spec && typeof ch.spec === 'object') ? ch.spec : {};
                      ch.spec.id = '3';
                    }

                    // ��������� �������� (� �������� section ���� �� ��������)
                    const parentChildren = Array.isArray(n.__parentChildrenRef) ? n.__parentChildrenRef : [];
                    for (const sib of parentChildren) {
                      if (!sib || sib === n || typeof sib !== 'object') continue;
                      if (String(sib.type || '') !== 'section') continue;
                      const sibChildren = Array.isArray(sib.children) ? sib.children : [];
                      const hasModelInSib = sibChildren.some((ch) => String(ch?.type || '') === 'model');
                      if (!hasModelInSib) continue;
                      for (const ch of sibChildren) {
                        if (!ch || typeof ch !== 'object') continue;
                        if (String(ch.type || '') !== 'furniture') continue;
                        ch.spec = (ch.spec && typeof ch.spec === 'object') ? ch.spec : {};
                        ch.spec.id = '1';
                      }
                    }
                  }
                };
                // ����������� ������������ ������ ������ �� ����� ������������ (�� ��������� ��).
                const attachParentRefs = (nodes) => {
                  const walk = (arr) => {
                    if (!Array.isArray(arr)) return;
                    for (const n of arr) {
                      if (!n || typeof n !== 'object') continue;
                      n.__parentChildrenRef = arr;
                      walk(n.children);
                    }
                  };
                  walk(nodes);
                };
                const detachParentRefs = (nodes) => {
                  const walk = (arr) => {
                    if (!Array.isArray(arr)) return;
                    for (const n of arr) {
                      if (!n || typeof n !== 'object') continue;
                      try { delete n.__parentChildrenRef; } catch (_) {}
                      walk(n.children);
                    }
                  };
                  walk(nodes);
                };
                attachParentRefs(clodisJSON);
                normalizeHingeTemplateToRef(clodisJSON);
                detachParentRefs(clodisJSON);

                const toNum = (v) => {
                  const n = typeof v === 'number' ? v : parseFloat(v);
                  return Number.isFinite(n) ? n : NaN;
                };
                const roleOf = (node) =>
                  String(node?.layout_role ?? node?.sectionLayoutRole ?? '').trim();
                const hasRole = (nodes, roleKey) => {
                  const stack = Array.isArray(nodes) ? [...nodes] : [];
                  while (stack.length) {
                    const n = stack.pop();
                    if (!n || typeof n !== 'object') continue;
                    if (roleOf(n) === roleKey) return true;
                    if (Array.isArray(n.children)) stack.push(...n.children);
                  }
                  return false;
                };
                const findPlinthHeight = (nodes) => {
                  const stack = Array.isArray(nodes) ? [...nodes] : [];
                  while (stack.length) {
                    const n = stack.pop();
                    if (!n || typeof n !== 'object') continue;
                    if (roleOf(n) === 'plinth') {
                      const y = n?.size?.y;
                      const ny = toNum(y);
                      if (Number.isFinite(ny) && ny > 0) return ny;
                    }
                    if (Array.isArray(n.children)) stack.push(...n.children);
                  }
                  return NaN;
                };

                if (!Number.isFinite(toNum(clodisVariables.h_bottom))) {
                  const inferredPlinth = findPlinthHeight(clodisJSON);
                  if (Number.isFinite(inferredPlinth) && inferredPlinth > 0) {
                    clodisVariables.h_bottom = inferredPlinth;
                  }
                }

                let placementKind = String(this.item.placementKind || '').trim();
                const h = toNum(this.item.height);

                if (hasRole(clodisJSON, 'corpus_antresol')) {
                  clodisVariables.corpus_antresol_mm = 1950;
                }

                if (!placementKind || placementKind === 'floor_in_niche') {
                  const hasCabinetRoot = hasRole(clodisJSON, 'cabinet_root');
                  const hasPlinth = hasRole(clodisJSON, 'plinth');
                  const hasCorpus =
                    hasRole(clodisJSON, 'corpus') || hasRole(clodisJSON, 'corpus_antresol');
                  const hasTop = hasRole(clodisJSON, 'top');
                  if (
                    hasCabinetRoot &&
                    hasPlinth &&
                    hasCorpus &&
                    !hasTop &&
                    Number.isFinite(h) &&
                    h > 0 &&
                    h <= 1200
                  ) {
                    placementKind = 'standalone_floor';
                  } else {
                    placementKind = 'floor_in_niche';
                  }
                }

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
                  depth: this.item.depth,
                  placementKind: placementKind,
                  clodisVariables: clodisVariables,
                };
                
                // Собираем структуру конструктора в JSON
                if (constructorTree) {
                  dataToSave.constructor_structure = constructorTree;
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
                try {
                  const rawNew =
                    result &&
                    result.item &&
                    (result.item.id != null && result.item.id !== ''
                      ? result.item.id
                      : result.item.item_id);
                  const newId =
                    rawNew != null && rawNew !== ''
                      ? rawNew
                      : result && (result.id || result.item_id);
                  const newId2 =
                    newId != null && newId !== ''
                      ? newId
                      : result &&
                        result.data &&
                        (result.data.id != null ? result.data.id : result.data.item_id);
                  const finalId = newId2 != null && newId2 !== '' ? newId2 : null;
                  const itemIdInput = document.getElementById('item_id');
                  if (finalId != null && itemIdInput) {
                    itemIdInput.value = String(finalId);
                    const catalogType =
                      this.item.catalog_type ||
                      (document.getElementById('controller_name')?.value || '');
                    const hash = `#catalog-item-edit?type=${encodeURIComponent(catalogType)}&id=${encodeURIComponent(String(finalId))}`;
                    window.history.replaceState(
                      { page: 'catalog-item-edit', type: catalogType, id: finalId },
                      '',
                      hash
                    );
                  }
                } catch (_) {}
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
            if (typeof window.__cldSyncCatalogPlacementKindOptions === 'function') {
              window.__cldSyncCatalogPlacementKindOptions(this);
            }
            
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
                  ? { ...tree.variables.main }
                  : {};
                const toNum = (v) => {
                  const n = typeof v === 'number' ? v : parseFloat(v);
                  return Number.isFinite(n) ? n : NaN;
                };
                const roleOf = (node) => String(node?.layout_role ?? node?.sectionLayoutRole ?? '').trim();
                const hasRole = (nodes, roleKey) => {
                  const stack = Array.isArray(nodes) ? [...nodes] : [];
                  while (stack.length) {
                    const n = stack.pop();
                    if (!n || typeof n !== 'object') continue;
                    if (roleOf(n) === roleKey) return true;
                    if (Array.isArray(n.children)) stack.push(...n.children);
                  }
                  return false;
                };
                const findPlinthHeight = (nodes) => {
                  const stack = Array.isArray(nodes) ? [...nodes] : [];
                  while (stack.length) {
                    const n = stack.pop();
                    if (!n || typeof n !== 'object') continue;
                    if (roleOf(n) === 'plinth') {
                      const y = n?.size?.y;
                      const ny = toNum(y);
                      if (Number.isFinite(ny) && ny > 0) return ny;
                    }
                    if (Array.isArray(n.children)) stack.push(...n.children);
                  }
                  return NaN;
                };
                if (!Number.isFinite(toNum(clodisVariables.h_bottom))) {
                  const inferredPlinth = findPlinthHeight(clodisJSON);
                  if (Number.isFinite(inferredPlinth) && inferredPlinth > 0) {
                    clodisVariables.h_bottom = inferredPlinth;
                  }
                }
                let placementKind = String(item.placementKind || '').trim();
                const h = toNum(item.height);
                if (hasRole(clodisJSON, 'corpus_antresol')) {
                  clodisVariables.corpus_antresol_mm = 1950;
                }
                if (!placementKind || placementKind === 'floor_in_niche') {
                  const hasCabinetRoot = hasRole(clodisJSON, 'cabinet_root');
                  const hasPlinth = hasRole(clodisJSON, 'plinth');
                  const hasCorpus =
                    hasRole(clodisJSON, 'corpus') || hasRole(clodisJSON, 'corpus_antresol');
                  const hasTop = hasRole(clodisJSON, 'top');
                  if (hasCabinetRoot && hasPlinth && hasCorpus && !hasTop && Number.isFinite(h) && h > 0 && h <= 1200) {
                    placementKind = 'standalone_floor';
                  } else {
                    placementKind = 'floor_in_niche';
                  }
                }
                const payload = {
                  id: (document.getElementById('item_id') && document.getElementById('item_id').value) || '',
                  name: item.name || '',
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
                  depth: item.depth,
                  placementKind: placementKind,
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
          root.nodeData = root.nodeData || { name: '(элемент без названия)' };
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
            if (!lib)
              return {
                vars: { _wt: defaultWt },
                materials: {
                  g0: {
                    thickness: defaultWt,
                    material: { key: 'material_2', id: 0, variant_id: 0 },
                    material_icon: st?.groupOverrides?.g0?.material_icon || '',
                  },
                },
              };
            for (const g of (lib.groups || [])) {
              const key = g?.key;
              if (!key) continue;
              const ov = st.groupOverrides?.[key] || {};
              const thickness = Number(ov.thickness ?? g.thickness ?? (key === 'g0' ? defaultWt : 16));
              out[key] = {
                thickness,
                material: { key: _norm(ov.material_key || g.material) || _def(), id: ov.material_id || 0, variant_id: 0 },
                material_icon: ov.material_icon || '',
              };
            }
            if (!out.g0)
              out.g0 = { thickness: defaultWt, material: { key: _def(), id: 0, variant_id: 0 }, material_icon: st?.groupOverrides?.g0?.material_icon || '' };
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
          if (!root.nodeData) root.nodeData = { name: '(элемент без названия)' };
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
          'module': 'Элемент',
          'wall': 'Элемент'
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
          nodeElement.style.marginLeft = (depth * 12) + 'px'; // ��������� � 20px �� 12px, ����� ��� ����� �� ���������� �� ������ �������
          nodeElement.style.padding = '0';
          nodeElement.style.borderBottom = '1px solid #f0f0f0';
          nodeElement.style.cursor = 'pointer';
          nodeElement.style.display = 'block'; // Блочный элемент для вертикального расположения дочерних узлов
          // ��������� ������ ��������� ��������� (��������� 95% ������)
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
          
          // ��� ����� � ���� (��� � ��������� - ������ ������)
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
              <div style="padding:4px 12px; font-size:13px; color:#333; cursor:pointer; white-space:nowrap;" data-action="copy">Копировать</div>
              <div style="padding:4px 12px; font-size:13px; color:#333; cursor:pointer; white-space:nowrap;" data-action="paste">Вставить</div>
              <div style="padding:4px 12px; border-top:1px solid #e5e7eb; margin-top:4px; padding-top:8px; font-size:13px; color:#dc3545; cursor:pointer; white-space:nowrap;" data-action="delete">Удалить</div>
            </div>
          </div>`;
          
          html += `</div>`; // Закрываем заголовок
          
          nodeElement.innerHTML = html;
          
          // по умолчанию выбран корень (как в референсе)
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
            // ������ ��������� � ������
            alert('Конструктор ещё не готов к вставке');
            return;
          }
          
          if (!childrenContainer) {
            // Создаем контейнер, если его нет
            childrenContainer = document.createElement('div');
            childrenContainer.className = 'tree-node-children';
            childrenContainer.style.display = 'block';
            parentNode.appendChild(childrenContainer);
          }
          
          childrenContainer.appendChild(nodeElement);
          
          // Синхронизируем пути узлов (совпадение с 3D-движком по индексам)
          syncTreePaths();
          
          // Если родитель - секция, раскрываем её
          if (parentNode !== rootModule && parentNode.getAttribute('data-node-type') === 'section') {
            const toggle = parentNode.querySelector('.tree-node-toggle');
            if (toggle) {
              toggle.querySelector('span').textContent = '▼';
              childrenContainer.style.display = 'block';
            }
          }
        }
        
        // ������������� ����� ����� � �������� 3D-������ (0, 0,0, 0,0,0 � �.�.)
        function syncTreePaths() {
          const container = document.getElementById('constructor-root-module-children');
          if (!container) return;
          const walk = (parentContainer, basePath) => {
            const nodes = Array.from(parentContainer.children).filter((ch) => ch.classList?.contains('constructor-tree-node'));
            nodes.forEach((node, idx) => {
              const p = basePath ? `${basePath},${idx}` : `0,${idx}`;
              node.dataset.cldPath = p;
              const childContainer = node.querySelector(':scope > .tree-node-children');
              if (childContainer) walk(childContainer, p);
            });
          };
          walk(container, '0');
        }
        
        // Выбор узла дерева
        function getNodePath(nodeElement) {
          if (!nodeElement || nodeElement === rootModule) return '0';
          const dsPath = nodeElement.dataset?.cldPath;
          if (dsPath) return dsPath;
          
          const parentNode = nodeElement.parentElement?.closest('.constructor-tree-node') || rootModule;
          const childrenContainer = parentNode === rootModule
            ? document.getElementById('constructor-root-module-children')
            : parentNode.querySelector('.tree-node-children');
          if (!childrenContainer) return null;
          const siblings = Array.from(childrenContainer.children).filter(ch => ch.classList?.contains('constructor-tree-node'));
          const idx = siblings.indexOf(nodeElement);
          if (idx < 0) return null;
          const parentPath = parentNode === rootModule ? '0' : getNodePath(parentNode);
          return parentPath ? `${parentPath},${idx}` : null;
        }
        
        // Функция управления видимостью объектов в 3D при выборе элементов в дереве
        function update3DVisibility(nodeElement) {
          if (!__ppPreviewIframe || !__ppPreviewIframe.contentWindow) return;
          
          // Если выбран корневой модуль - отправляем сообщение с nodeId: null
          if (!nodeElement || nodeElement === rootModule) {
            __ppPreviewIframe.contentWindow.postMessage({ 
              type: 'cld:selectNode',
              nodeId: null,
              path: '0'
            }, '*');
            return;
          }
          
          // Получаем путь узла для поиска в 3D
          const path = getNodePath(nodeElement);
          const nodeType = nodeElement.getAttribute('data-node-type');
          
          if (path) {
            __ppPreviewIframe.contentWindow.postMessage({ 
              type: 'cld:selectNodeByPath',
              path: path,
              nodeType: nodeType
            }, '*');
          } else {
            console.warn('[CLD][admin] update3DVisibility: path not found for node');
          }
        }
        
        function selectTreeNode(nodeElement) {
          // Сохраняем панель в предыдущий узел (роль подсекции / размеры), иначе при смене выделения
          // значения остаются только в DOM формы и не попадают в nodeData → в JSON нет layout_role.
          try {
            if (typeof currentSelectedNode !== 'undefined' && currentSelectedNode && currentSelectedNode !== nodeElement) {
              if (typeof saveConstructorNodeData === 'function') saveConstructorNodeData(currentSelectedNode);
            }
          } catch (_) {}

          // Убираем выделение с других элементов
          document.querySelectorAll('.constructor-tree-item-selected').forEach(el => {
            el.style.backgroundColor = '';
            el.classList.remove('constructor-tree-item-selected');
          });
          
          // Выделяем выбранный элемент
          // Для корневого модуля используем заголовок по id
          let header;
          if (nodeElement === rootModule) {
            header = document.getElementById('constructor-root-module-header');
          } else {
            // Для обычных узлов - заголовок по классу
            header = nodeElement.querySelector('.tree-node-header');
          }
          
          if (header) {
            header.style.backgroundColor = '#e8f4fd';
            header.classList.add('constructor-tree-item-selected');
          }
          
          currentSelectedNode = nodeElement;
          // Дублируем в глобальные ссылки, чтобы обработчики вне initConstructorTab не падали
          window.__cldCurrentSelectedNode = currentSelectedNode;
          window.currentSelectedNode = currentSelectedNode;
          
          // Обновляем панель свойств
          updateConstructorPropertiesPanel(nodeElement);
          
          // Управляем 3D-сценой: скрыть все wireframe, показать только у выбранного узла, позиционировать axes_helper
          update3DVisibility(nodeElement);
        }
        
        // Привязка обработчиков к узлу дерева
        function attachTreeNodeHandlers(nodeElement) {
          // При загрузке/пересборке дерева обработчики могут навешиваться повторно.
          // Чтобы клики не ломали selection/panel — ставим флаг на узле.
          if (!nodeElement || nodeElement.dataset?.cldHandlersAttached === '1') return;
          if (nodeElement.dataset) nodeElement.dataset.cldHandlersAttached = '1';
          // Находим заголовок узла (по классу tree-node-header)
          const header = nodeElement.querySelector('.tree-node-header');
          if (!header) {
            console.warn('[CLD][handlers] ⚠️ Не найден заголовок узла дерева', {
              node_element: nodeElement,
              innerHTML: nodeElement.innerHTML.substring(0, 200),
            });
            return;
          }
          
          
          // Клик по заголовку - выбор элемента
          header.addEventListener('click', function(e) {
            if (e.target.closest('.tree-node-menu-trigger') || e.target.closest('.tree-node-menu-dropdown') || e.target.closest('.tree-node-toggle')) {
              return;
            }
            
            selectTreeNode(nodeElement);
          });
          
          // Раскрытие/сворачивание (только для секций)
          const toggle = nodeElement.querySelector('.tree-node-toggle');
          if (toggle) {
            const childrenContainer = nodeElement.querySelector('.tree-node-children');
            let isExpanded = false;
            
            toggle.addEventListener('click', function(e) {
              e.stopPropagation();
              isExpanded = !isExpanded;
              
              if (childrenContainer) {
                childrenContainer.style.display = isExpanded ? 'block' : 'none';
                toggle.querySelector('span').textContent = isExpanded ? '▼' : '▶';
              }
            });
          }
          
          // Контекстное меню (используем тот же подход, что и для корневого модуля)
          const menuTrigger = nodeElement.querySelector('.tree-node-menu-trigger');
          const menuDropdown = nodeElement.querySelector('.tree-node-menu-dropdown');
          if (menuTrigger && menuDropdown) {
            let isMenuOpen = false;
            
            // Функция для закрытия меню
            function closeNodeMenu() {
              if (isMenuOpen) {
                menuDropdown.style.display = 'none';
                isMenuOpen = false;
              }
            }
            
            // Открытие/закрытие меню - используем mousedown для открытия
            menuTrigger.addEventListener('mousedown', function(e) {
              e.stopPropagation();
              e.preventDefault();
              
              // Закрываем все другие открытые меню
              document.querySelectorAll('.constructor-tree-item-menu').forEach(menu => {
                if (menu !== menuDropdown) {
                  menu.style.display = 'none';
                }
              });
              
              if (isMenuOpen) {
                closeNodeMenu();
              } else {
                menuDropdown.style.display = 'block';
                menuDropdown.style.zIndex = '10000';
                menuDropdown.style.position = 'absolute';
                isMenuOpen = true;
              }
            });
            
            // Закрытие меню при клике вне его
            document.addEventListener('click', function(e) {
              if (!menuTrigger.contains(e.target) && !menuDropdown.contains(e.target)) {
                if (isMenuOpen) {
                  closeNodeMenu();
                }
              }
            });
            
            // Обработчики команд меню
            menuDropdown.addEventListener('click', function(e) {
              const action = e.target.closest('[data-action]')?.getAttribute('data-action');
              if (!action) return;
              
              e.stopPropagation();
              closeNodeMenu();
              
              switch(action) {
                case 'add':
                  // Референс: логируем когда и где открывается модалка
                  // Открываем модальное окно для добавления элемента
                  openAddElementModal(nodeElement);
                  break;
                case 'copy':
                  (async () => {
                    try {
                      const COPY_KEY = 'cld_constructor_tree_copy_buffer_v1';
                      const rootJson = (typeof getConstructorTreeJSON === 'function') ? getConstructorTreeJSON() : null;
                      const st = rootJson?.template?.structure;
                      if (!Array.isArray(st) || st.length === 0) {
                        alert('Нечего копировать');
                        return;
                      }

                      const cldPath = nodeElement?.dataset?.cldPath;
                      if (!cldPath) {
                        alert('Не найден путь узла для копирования');
                        return;
                      }

                      const parts = String(cldPath)
                        .split(',')
                        .map((s) => Number(s))
                        .filter((n) => Number.isFinite(n));

                      // ���� ���������� � "0" (������ ������), ������ ���� ������� � children
                      const indices = parts.slice(1);
                      let cur = st;
                      for (const idx of indices) {
                        if (Array.isArray(cur)) cur = cur[idx];
                        else cur = cur?.children?.[idx];
                      }

                      if (!cur || typeof cur !== 'object') {
                        alert('Не смог извлечь данные узла для копирования');
                        return;
                      }

                      const payloadArr = [JSON.parse(JSON.stringify(cur))];
                      const jsonText = JSON.stringify(payloadArr);

                      try { localStorage.setItem(COPY_KEY, jsonText); } catch {}
                      window.__cld_constructor_tree_copy_buffer_v1 = jsonText;

                      // ������� ��� �� �������� � clipboard, ���� ��������
                      try {
                        if (navigator?.clipboard?.writeText) {
                          navigator.clipboard.writeText(jsonText).catch(() => {});
                        }
                      } catch {}

                      if (typeof toastr !== 'undefined' && toastr?.success) toastr.success('Скопировано');
                    } catch (e) {
                      console.error('[CLD][copy] error', e);
                      alert('Ошибка копирования: ' + (e?.message || e));
                    }
                  })();
                  break;
                case 'paste':
                  (async () => {
                    try {
                      const COPY_KEY = 'cld_constructor_tree_copy_buffer_v1';
                      let text = null;
                      try {
                        if (navigator?.clipboard?.readText) text = await navigator.clipboard.readText();
                      } catch {}
                      if (!text || !String(text).trim()) {
                        try { text = localStorage.getItem(COPY_KEY); } catch {}
                      }
                      if (!text || !String(text).trim()) {
                        alert('Буфер пуст (сначала сделайте "Копировать")');
                        return;
                      }

                      let parsed;
                      try { parsed = JSON.parse(text); } catch {
                        alert('В буфере нет JSON');
                        return;
                      }

                      let items = null;
                      if (Array.isArray(parsed)) items = parsed;
                      else if (parsed && typeof parsed === 'object') {
                        items = parsed?.template?.structure
                          || parsed?.template?.tree
                          || parsed?.spec?.template?.tree
                          || (parsed?.type === 'module' && Array.isArray(parsed?.children) ? parsed.children : null);
                        if (!items && parsed?.type && ['section','fill_section','wall','facade','module'].includes(parsed.type)) items = [parsed];
                      }

                      if (!Array.isArray(items) || items.length === 0) {
                        alert('Не смог извлечь элементы для вставки из буфера');
                        return;
                      }

                      const parentType = nodeElement?.getAttribute?.('data-node-type');
                      if (parentType !== 'section') {
                        alert('Вставка доступна только внутрь секции');
                        return;
                      }

                      const getPos = (it) => it?.pos || it?.position || { x: '0', y: '0', z: '0' };
                      const getPivot = (it) => it?.pivot || it?.anchor || { x: -1, y: -1, z: -1 };
                      const getRot = (it) => it?.rot || it?.rotation || { x: '0', y: '0', z: '0' };
                      const getSize = (it) => it?.size || { x: '', y: '', z: '' };
                      const toObjXYZ = (o, d) => ({
                        x: (o && o.x !== undefined) ? o.x : d.x,
                        y: (o && o.y !== undefined) ? o.y : d.y,
                        z: (o && o.z !== undefined) ? o.z : d.z,
                      });

                      const applySection = (uiNode, it) => {
                        uiNode.nodeData.name = it?.name || uiNode.nodeData.name || 'Секция';
                        uiNode.setAttribute('data-node-name', uiNode.nodeData.name);
                        const nameEl = uiNode.querySelector('.tree-node-name');
                        if (nameEl) nameEl.textContent = uiNode.nodeData.name;
                        uiNode.nodeData.active = it?.active !== undefined ? !!it.active : true;
                        uiNode.nodeData.hide_when_filled = it?.hide_when_filled || false;
                        uiNode.nodeData.size = toObjXYZ(getSize(it), { x: '', y: '', z: '' });
                        uiNode.nodeData.position = toObjXYZ(getPos(it), { x: '0', y: '0', z: '0' });
                        uiNode.nodeData.anchor = toObjXYZ(getPivot(it), { x: -1, y: -1, z: -1 });
                        uiNode.nodeData.rotation = toObjXYZ(getRot(it), { x: '0', y: '0', z: '0' });
                      };

                      const applyDetail = (uiNode, it) => {
                        const type = it?.type;
                        const originalType = it?.originalType || (type === 'facade' ? 'facade' : (type === 'module' ? 'module' : 'detail'));
                        uiNode.nodeData.originalType = originalType;
                        uiNode.setAttribute('data-original-type', originalType);
                        uiNode.nodeData.name = it?.name || uiNode.nodeData.name || 'Деталь';
                        uiNode.setAttribute('data-node-name', uiNode.nodeData.name);
                        const nameEl = uiNode.querySelector('.tree-node-name');
                        if (nameEl) nameEl.textContent = uiNode.nodeData.name;
                        uiNode.nodeData.active = it?.active !== undefined ? !!it.active : true;
                        uiNode.nodeData.hide_when_filled = it?.hide_when_filled || false;
                        uiNode.nodeData.size = toObjXYZ(getSize(it), { x: '', y: '', z: '' });
                        uiNode.nodeData.position = toObjXYZ(getPos(it), { x: '0', y: '0', z: '0' });
                        uiNode.nodeData.anchor = toObjXYZ(getPivot(it), { x: -1, y: -1, z: -1 });
                        uiNode.nodeData.rotation = toObjXYZ(getRot(it), { x: '0', y: '0', z: '0' });
                        uiNode.nodeData.spec = it?.spec || uiNode.nodeData.spec || {};
                        if (originalType === 'facade') {
                          uiNode.nodeData.detailType = uiNode.nodeData.spec?.detailTypeId || uiNode.nodeData.detailType || '';
                          if (it?.c_rot) uiNode.nodeData.c_rot = it.c_rot;
                          uiNode.nodeData.modelId = it?.spec?.id ? String(it.spec.id) : (it?.modelId || '');
                          uiNode.nodeData.modelKey = it?.spec?.key ? String(it.spec.key) : (it?.modelKey || '');
                        } else if (originalType === 'module') {
                          uiNode.nodeData.modelId = it?.spec?.id ? String(it.spec.id) : (it?.modelId || '');
                          uiNode.nodeData.modelKey = it?.spec?.key ? String(it.spec.key) : (it?.modelKey || '');
                          if (it?.c_rot) uiNode.nodeData.c_rot = it.c_rot;
                        } else {
                          uiNode.nodeData.detailType = uiNode.nodeData.spec?.detailTypeId || uiNode.nodeData.detailType || '';
                          uiNode.setAttribute('data-detail-type', uiNode.nodeData.detailType);
                          uiNode.nodeData.orientation = uiNode.nodeData.spec?.orientation || uiNode.nodeData.orientation || 'h';
                          uiNode.nodeData.fill_key = uiNode.nodeData.spec?.side || uiNode.nodeData.spec?.key || uiNode.nodeData.fill_key || '';
                        }
                        if (it?.c_rot && !uiNode.nodeData.c_rot) uiNode.nodeData.c_rot = it.c_rot;
                        if (it?.events && typeof it.events === 'object') uiNode.nodeData.events = it.events;
                      };

                      const createFromItem = (it, parentUi) => {
                        if (!it || typeof it !== 'object') return null;
                        const t = it.type === 'fill_section' ? 'section' : it.type;
                        if (t === 'section') {
                          const uiNode = createConstructorTreeNode('section', parentUi);
                          applySection(uiNode, it);
                          addTreeNodeToParent(uiNode, parentUi);
                          if (Array.isArray(it.children)) it.children.forEach((ch) => createFromItem(ch, uiNode));
                          return uiNode;
                        }
                        const uiNode = createConstructorTreeNode('detail', parentUi);
                        applyDetail(uiNode, it);
                        addTreeNodeToParent(uiNode, parentUi);
                        return uiNode;
                      };

                      let firstNew = null;
                      items.forEach((it) => {
                        const created = createFromItem(it, nodeElement);
                        if (!firstNew && created) firstNew = created;
                      });

                      syncTreePaths();
                      if (firstNew) {
                        currentSelectedNode = firstNew;
                        window.__cldCurrentSelectedNode = firstNew;
                        window.currentSelectedNode = firstNew;
                        selectTreeNode(firstNew);
                        updateConstructorPropertiesPanel(firstNew);
                      }
                      if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
                    } catch (e) {
                      console.error('[CLD][paste] error', e);
                      alert('Ошибка вставки: ' + (e?.message || e));
                    }
                  })();
                  break;
                case 'delete':
                  if (confirm(`������� "${nodeElement.nodeData?.name || '�������'}"?`)) {
                    nodeElement.remove();
                    syncTreePaths();
                    currentSelectedNode = null;
                    window.__cldCurrentSelectedNode = null;
                    window.currentSelectedNode = null;
                    updateConstructorPropertiesPanel(null);
                    update3DVisibility(null);
                    if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
                  }
                  break;
              }
            });
          }
          
          // Иконка глаза (видимость)
          const eyeIcon = nodeElement.querySelector('.tree-node-eye');
          if (eyeIcon) {
            eyeIcon.addEventListener('click', function(e) {
              e.stopPropagation();
              // TODO: Переключение видимости
            });
          }
        }
        
        // ============================================
        // Основная инициализация
        // ============================================
        
        // Референс: проверяем наличие модалки при загрузке
        const modalCheck = document.getElementById('constructor-add-element-modal');
        if (!modalCheck) console.warn('[CLD][init] Модалка добавления не найдена');
        
        // Референс: привязываем обработчики к уже существующим узлам при загрузке
        const existingNodes = document.querySelectorAll('.constructor-tree-node');
        existingNodes.forEach((node) => attachTreeNodeHandlers(node));
        
        // Раскрытие/сворачивание корневого модуля
        const rootToggle = document.getElementById('constructor-root-module-toggle');
        const rootChildren = document.getElementById('constructor-root-module-children');
        
        if (rootToggle && rootChildren) {
          rootToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            isRootExpanded = !isRootExpanded;
            
            if (isRootExpanded) {
              rootChildren.style.display = 'block';
              rootToggle.querySelector('span').textContent = '▼';
            } else {
              rootChildren.style.display = 'none';
              rootToggle.querySelector('span').textContent = '▶';
            }
          });
        }
        
        // Референс: при клике на корневую секцию панель свойств должна быть скрыта (пустая)
        const rootModuleHeader = document.getElementById('constructor-root-module-header');
        if (rootModuleHeader) {
          rootModuleHeader.addEventListener('click', function(e) {
            // Не обрабатываем клики на toggle, меню и иконку глаза
            if (e.target.closest('#constructor-root-module-toggle') || 
                e.target.closest('#module-menu-trigger') || 
                e.target.closest('#module-menu') ||
                e.target.closest('svg')) {
              return;
            }
            
            // Выбираем корневую секцию (панель свойств будет скрыта)
            selectTreeNode(rootModule);
          });
        }
        
        // Контекстное меню (три точки) для корневого модуля - ПЕРВЫМ, чтобы не блокировалось другими обработчиками
        const menuTrigger = document.getElementById('module-menu-trigger');
        const moduleMenu = document.getElementById('module-menu');
        
        if (menuTrigger && moduleMenu) {
          
          let isMenuOpen = false;
          
          // Функция для закрытия меню
          function closeMenu() {
            if (isMenuOpen) {
              moduleMenu.style.display = 'none';
              isMenuOpen = false;
            }
          }
          
          // Открытие/закрытие меню - используем mousedown для открытия
          menuTrigger.addEventListener('mousedown', function(e) {
            e.stopPropagation();
            e.preventDefault();
            // Закрываем все другие открытые меню
            document.querySelectorAll('.constructor-tree-item-menu').forEach(menu => {
              if (menu !== moduleMenu) {
                menu.style.display = 'none';
              }
            });
            
            if (isMenuOpen) {
              // Меню открыто - закрываем его
              closeMenu();
            } else {
              // Меню закрыто - открываем его
              moduleMenu.style.display = 'block';
              moduleMenu.style.zIndex = '10000';
              moduleMenu.style.position = 'absolute';
              isMenuOpen = true;
            }
          });
          
          // Закрытие меню при клике вне его - используем click с задержкой
          document.addEventListener('click', function(e) {
            // Не закрываем, если клик был на триггере или меню
            if (menuTrigger.contains(e.target) || moduleMenu.contains(e.target)) {
              return;
            }
            
            // Закрываем меню, если оно открыто
            if (isMenuOpen) {
              closeMenu();
            }
          });
          
          // Заполняем меню базовыми командами (если еще не заполнено) - как в референсе
          if (!moduleMenu.hasAttribute('data-initialized')) {
            moduleMenu.innerHTML = `
              <div style="padding:4px 12px; font-size:13px; color:#333; cursor:pointer; white-space:nowrap; display:flex; align-items:center; gap:6px;" data-action="add">
                <span style="font-size:14px;">+</span>
                <span>Добавить</span>
              </div>
              <div style="padding:4px 12px; font-size:13px; color:#333; cursor:pointer; white-space:nowrap;" data-action="copy">Копировать</div>
              <div style="padding:4px 12px; font-size:13px; color:#333; cursor:pointer; white-space:nowrap;" data-action="paste">Вставить</div>
              <div style="padding:4px 12px; border-top:1px solid #e5e7eb; margin-top:4px; padding-top:8px; font-size:13px; color:#dc3545; cursor:pointer; white-space:nowrap;" data-action="delete">Удалить</div>
            `;
            moduleMenu.setAttribute('data-initialized', 'true');
          }
          
          // Обработчики команд меню (привязываем один раз)
          if (!moduleMenu.hasAttribute('data-handlers-attached')) {
            moduleMenu.addEventListener('click', function(e) {
              const action = e.target.closest('[data-action]')?.getAttribute('data-action');
              if (!action) return;
              
              e.stopPropagation();
              closeMenu();
              
              switch(action) {
                case 'add':
                  // Открываем модальное окно для добавления элемента
                  openAddElementModal(rootModule);
                  break;
                case 'copy':
                  (async () => {
                    try {
                      const COPY_KEY = 'cld_constructor_tree_copy_buffer_v1';
                      const rootJson = (typeof getConstructorTreeJSON === 'function') ? getConstructorTreeJSON() : null;
                      const st = rootJson?.template?.structure;
                      if (!Array.isArray(st) || st.length === 0) {
                        alert('Нечего копировать');
                        return;
                      }

                      const payloadArr = JSON.parse(JSON.stringify(st)); // �������� ���� ������ �������� ������
                      const jsonText = JSON.stringify(payloadArr);

                      try { localStorage.setItem(COPY_KEY, jsonText); } catch {}
                      window.__cld_constructor_tree_copy_buffer_v1 = jsonText;

                      try {
                        if (navigator?.clipboard?.writeText) navigator.clipboard.writeText(jsonText).catch(() => {});
                      } catch {}

                      if (typeof toastr !== 'undefined' && toastr?.success) toastr.success('Скопировано');
                    } catch (e) {
                      console.error('[CLD][copy] error', e);
                      alert('Ошибка копирования: ' + (e?.message || e));
                    }
                  })();
                  break;
                case 'paste':
                  (async () => {
                    try {
                      const COPY_KEY = 'cld_constructor_tree_copy_buffer_v1';
                      let text = null;
                      try {
                        if (navigator?.clipboard?.readText) text = await navigator.clipboard.readText();
                      } catch {}
                      if (!text || !String(text).trim()) {
                        try { text = localStorage.getItem(COPY_KEY); } catch {}
                      }
                      if (!text || !String(text).trim()) {
                        alert('Буфер пуст (сначала сделайте "Копировать")');
                        return;
                      }
                      let parsed;
                      try { parsed = JSON.parse(text); } catch {
                        alert('В буфере нет JSON');
                        return;
                      }
                      let items = null;
                      if (Array.isArray(parsed)) items = parsed;
                      else if (parsed && typeof parsed === 'object') {
                        items = parsed?.template?.structure
                          || parsed?.template?.tree
                          || parsed?.spec?.template?.tree
                          || (parsed?.type === 'module' && Array.isArray(parsed?.children) ? parsed.children : null);
                        if (!items && parsed?.type && ['section','fill_section','wall','facade','module'].includes(parsed.type)) items = [parsed];
                      }
                      if (!Array.isArray(items) || items.length === 0) {
                        alert('Не смог извлечь элементы для вставки из буфера');
                        return;
                      }

                      const parentUi = rootModule;
                      const getPos = (it) => it?.pos || it?.position || { x: '0', y: '0', z: '0' };
                      const getPivot = (it) => it?.pivot || it?.anchor || { x: -1, y: -1, z: -1 };
                      const getRot = (it) => it?.rot || it?.rotation || { x: '0', y: '0', z: '0' };
                      const getSize = (it) => it?.size || { x: '', y: '', z: '' };
                      const toObjXYZ = (o, d) => ({
                        x: (o && o.x !== undefined) ? o.x : d.x,
                        y: (o && o.y !== undefined) ? o.y : d.y,
                        z: (o && o.z !== undefined) ? o.z : d.z,
                      });

                      const applySection = (uiNode, it) => {
                        uiNode.nodeData.name = it?.name || uiNode.nodeData.name || 'Секция';
                        uiNode.setAttribute('data-node-name', uiNode.nodeData.name);
                        const nameEl = uiNode.querySelector('.tree-node-name');
                        if (nameEl) nameEl.textContent = uiNode.nodeData.name;
                        uiNode.nodeData.active = it?.active !== undefined ? !!it.active : true;
                        uiNode.nodeData.hide_when_filled = it?.hide_when_filled || false;
                        uiNode.nodeData.size = toObjXYZ(getSize(it), { x: '', y: '', z: '' });
                        uiNode.nodeData.position = toObjXYZ(getPos(it), { x: '0', y: '0', z: '0' });
                        uiNode.nodeData.anchor = toObjXYZ(getPivot(it), { x: -1, y: -1, z: -1 });
                        uiNode.nodeData.rotation = toObjXYZ(getRot(it), { x: '0', y: '0', z: '0' });
                      };

                      const applyDetail = (uiNode, it) => {
                        const type = it?.type;
                        const originalType = it?.originalType || (type === 'facade' ? 'facade' : (type === 'module' ? 'module' : 'detail'));
                        uiNode.nodeData.originalType = originalType;
                        uiNode.setAttribute('data-original-type', originalType);
                        uiNode.nodeData.name = it?.name || uiNode.nodeData.name || 'Деталь';
                        uiNode.setAttribute('data-node-name', uiNode.nodeData.name);
                        const nameEl = uiNode.querySelector('.tree-node-name');
                        if (nameEl) nameEl.textContent = uiNode.nodeData.name;
                        uiNode.nodeData.active = it?.active !== undefined ? !!it.active : true;
                        uiNode.nodeData.hide_when_filled = it?.hide_when_filled || false;
                        uiNode.nodeData.size = toObjXYZ(getSize(it), { x: '', y: '', z: '' });
                        uiNode.nodeData.position = toObjXYZ(getPos(it), { x: '0', y: '0', z: '0' });
                        uiNode.nodeData.anchor = toObjXYZ(getPivot(it), { x: -1, y: -1, z: -1 });
                        uiNode.nodeData.rotation = toObjXYZ(getRot(it), { x: '0', y: '0', z: '0' });
                        uiNode.nodeData.spec = it?.spec || uiNode.nodeData.spec || {};
                        if (originalType === 'facade') {
                          uiNode.nodeData.detailType = uiNode.nodeData.spec?.detailTypeId || uiNode.nodeData.detailType || '';
                          if (it?.c_rot) uiNode.nodeData.c_rot = it.c_rot;
                          uiNode.nodeData.modelId = it?.spec?.id ? String(it.spec.id) : (it?.modelId || '');
                          uiNode.nodeData.modelKey = it?.spec?.key ? String(it.spec.key) : (it?.modelKey || '');
                        } else if (originalType === 'module') {
                          uiNode.nodeData.modelId = it?.spec?.id ? String(it.spec.id) : (it?.modelId || '');
                          uiNode.nodeData.modelKey = it?.spec?.key ? String(it.spec.key) : (it?.modelKey || '');
                          if (it?.c_rot) uiNode.nodeData.c_rot = it.c_rot;
                        } else {
                          uiNode.nodeData.detailType = uiNode.nodeData.spec?.detailTypeId || uiNode.nodeData.detailType || '';
                          uiNode.setAttribute('data-detail-type', uiNode.nodeData.detailType);
                          uiNode.nodeData.orientation = uiNode.nodeData.spec?.orientation || uiNode.nodeData.orientation || 'h';
                          uiNode.nodeData.fill_key = uiNode.nodeData.spec?.side || uiNode.nodeData.spec?.key || uiNode.nodeData.fill_key || '';
                        }
                        if (it?.c_rot && !uiNode.nodeData.c_rot) uiNode.nodeData.c_rot = it.c_rot;
                        if (it?.events && typeof it.events === 'object') uiNode.nodeData.events = it.events;
                      };

                      const createFromItem = (it, parentUiNode) => {
                        if (!it || typeof it !== 'object') return null;
                        const t = it.type === 'fill_section' ? 'section' : it.type;
                        if (t === 'section') {
                          const uiNode = createConstructorTreeNode('section', parentUiNode);
                          applySection(uiNode, it);
                          addTreeNodeToParent(uiNode, parentUiNode);
                          if (Array.isArray(it.children)) it.children.forEach((ch) => createFromItem(ch, uiNode));
                          return uiNode;
                        }
                        const uiNode = createConstructorTreeNode('detail', parentUiNode);
                        applyDetail(uiNode, it);
                        addTreeNodeToParent(uiNode, parentUiNode);
                        return uiNode;
                      };

                      let firstNew = null;
                      items.forEach((it) => {
                        const created = createFromItem(it, parentUi);
                        if (!firstNew && created) firstNew = created;
                      });

                      syncTreePaths();
                      if (firstNew) {
                        currentSelectedNode = firstNew;
                        window.__cldCurrentSelectedNode = firstNew;
                        window.currentSelectedNode = firstNew;
                        selectTreeNode(firstNew);
                        updateConstructorPropertiesPanel(firstNew);
                      }
                      if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
                    } catch (e) {
                      console.error('[CLD][paste] error', e);
                      alert('Ошибка вставки: ' + (e?.message || e));
                    }
                  })();
                  break;
                case 'delete':
                  if (currentSelectedNode === rootModule) {
                    if (confirm('������� �������� ������? ��� �������� ������ ��������.')) {
                      // ������� �������� ��������
                      const childrenContainer = document.getElementById('constructor-root-module-children');
                      if (childrenContainer) {
                        childrenContainer.innerHTML = '';
                      }
                      currentSelectedNode = null;
                      window.__cldCurrentSelectedNode = null;
                      window.currentSelectedNode = null;
                      updateConstructorPropertiesPanel(null);
                      if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
                    }
                  }
                  break;
              }
            });
            moduleMenu.setAttribute('data-handlers-attached', 'true');
          }
        }
        
        // Иконка глаза (видимость) - базовая заглушка
        const eyeIcon = rootModule?.querySelector('svg');
        if (eyeIcon && eyeIcon.parentElement) {
          eyeIcon.parentElement.addEventListener('click', function(e) {
            e.stopPropagation();
            // TODO: Переключение видимости
          });
        }
        
        // Обновление панели свойств при выборе элемента
        function updateConstructorPropertiesPanel(node) {
          const panel = document.getElementById('constructor-properties-panel');
          const placeholder = document.getElementById('constructor-properties-placeholder');
          
          // Референс: при выборе корневой секции панель свойств скрыта (пустая)
          const isEmpty = !node || node === rootModule;
          if (isEmpty) {
            try {
              const selEl = document.querySelector('.constructor-tree-item-selected');
              console.log('[CLD][panel-empty][main]', {
                incomingNodeIsNull: !node,
                incomingIsRoot: node === rootModule,
                selectedNodeId: selEl?.getAttribute?.('data-node-id') || '',
                currentSelectedNodeId: window.currentSelectedNode?.getAttribute?.('data-node-id') || '',
              });
            } catch (_) {}
          }
          
          if (panel) {
            // Показываем/скрываем панель свойств и placeholder
            if (isEmpty) {
              // Корневая секция выбрана - скрываем все поля свойств, показываем только placeholder
              const allPropertyFields = panel.querySelectorAll('[id^="catalog-constructor-property-"]');
              allPropertyFields.forEach(field => {
                const fieldContainer = field.closest('div[style*="margin-bottom"]');
                if (fieldContainer) fieldContainer.style.display = 'none';
              });
              
              // Скрываем секции (детали, материалы и т.д.)
              const detailSection = document.getElementById('catalog-constructor-detail-specific');
              const materialSection = document.getElementById('catalog-constructor-material-section');
              const sizeSection = document.getElementById('catalog-constructor-size-section');
              if (detailSection) detailSection.style.display = 'none';
              if (materialSection) materialSection.style.display = 'none';
              if (sizeSection) sizeSection.style.display = 'none';
              
              // Скрываем заголовок "Свойства"
              const propertiesTitle = panel.querySelector('div[style*="font-size:13px; font-weight:600"]');
              if (propertiesTitle) propertiesTitle.style.display = 'none';
              
              // Показываем placeholder
              if (placeholder) placeholder.style.display = 'block';
              
              return;
            } else {
              // Дочерний элемент выбран - показываем все поля свойств
              const allPropertyFields = panel.querySelectorAll('[id^="catalog-constructor-property-"]');
              allPropertyFields.forEach(field => {
                const fieldContainer = field.closest('div[style*="margin-bottom"]');
                if (fieldContainer) fieldContainer.style.display = '';
              });
              
              // Показываем заголовок "Свойства"
              const propertiesTitle = panel.querySelector('div[style*="font-size:13px; font-weight:600"]');
              if (propertiesTitle) propertiesTitle.style.display = 'block';
              
              // Скрываем placeholder
              if (placeholder) placeholder.style.display = 'none';
            }
          } else {
            if (isEmpty) return;
          }
          
          const typeInput = document.getElementById('catalog-constructor-property-type');
          const nameInput = document.getElementById('catalog-constructor-property-name');
          const idInput = document.getElementById('catalog-constructor-property-id');
          const hideWhenFilled = document.getElementById('catalog-constructor-property-hide-when-filled');
          const active = document.getElementById('catalog-constructor-property-active');
          const article = document.getElementById('catalog-constructor-property-article');
          
          // Получаем данные элемента (пока из data-атрибутов, потом из JSON структуры)
          const nodeType = node.getAttribute('data-node-type') || 'section';
          const nodeName = node.getAttribute('data-node-name') || (node === rootModule ? '(элемент без названия)' : '');
          const nodeId = node.getAttribute('data-node-id') || '';
          const nodeData = node.nodeData || {}; // nodeData будет хранить полные данные элемента
          
          // Референс: item_types_names — тип в поле "Тип" как value (key), отображается name.
          // По умолчанию: section/detail. Но для фасадов в Clodis логический тип — "facade",
          // даже если в дереве это detail.
          let originalType = nodeData.originalType || (nodeType === 'detail' ? 'detail' : 'section');
          
          // Если у узла есть привязка к фасаду (modelId или spec.id)
          // ИЛИ его имя содержит слово "Фасад" (как в референсных модулях),
          // считаем его фасадом в UI, даже если originalType остался "detail".
          if (nodeType === 'detail') {
            const nameStr = String(nodeData.name || nodeName || '');
            if (nodeData.modelId || nodeData.spec?.id || nameStr.indexOf('Фасад') !== -1) {
              originalType = 'facade';
              nodeData.originalType = 'facade';
            }
          }
          
          // Заполняем базовые поля
          // В поле "Тип" показываем кириллическое название (Модель, Фасад, Деталь и т.д.)
          if (typeInput) {
            const displayType = TYPE_NAMES[originalType] || TYPE_NAMES[nodeType === 'detail' ? 'detail' : 'section'] || originalType;
            typeInput.value = displayType;
          }
          if (nameInput) nameInput.value = nodeData.name || nodeName;
          if (idInput) idInput.value = nodeData.id || nodeId;
          if (hideWhenFilled !== null) hideWhenFilled.checked = nodeData.hide_when_filled || false;
          if (active !== null) active.checked = nodeData.active !== false; // по умолчанию true
          if (article) article.value = nodeData.article || '';
          
          // Определяем тип элемента и показываем/скрываем секции
          if (nodeType === 'detail') {
            showDetailSections();
            fillDetailProperties(nodeData);
          } else {
            // ��� section ������ �� ������: ���������� size/position/anchor/rotation ��� � ����.
            showSectionSections();
            fillSectionProperties(nodeData);
          }
        }
        
        // Заполнение полей для деталей
        function fillDetailProperties(nodeData) {
          // Ориентация и Форма
          const orientation = document.getElementById('catalog-constructor-property-orientation');
          const shape = document.getElementById('catalog-constructor-property-shape');
          // ⭐ ИСПРАВЛЕНИЕ: Приоритет spec.orientation > orientation > detailOrientation > 'h'
          // Референс: orientation хранится в spec.orientation
          let orientationValue = nodeData.spec?.orientation || nodeData.orientation;
          if (!orientationValue && nodeData.detailOrientation) {
            // Маппинг из 'vertical'/'horizontal' в 'v'/'h'
            orientationValue = nodeData.detailOrientation === 'vertical' ? 'v' :
                             nodeData.detailOrientation === 'horizontal' ? 'h' :
                             nodeData.detailOrientation === 'frontal' ? 'f' :
                             nodeData.detailOrientation;
          }
          if (orientation) orientation.value = orientationValue || 'h';
          if (shape) shape.value = nodeData.shape || 'normal';

          const facadeOffsetSection = document.getElementById('catalog-constructor-facade-offset-section');
          const offX = document.getElementById('catalog-constructor-property-door-offset-x');
          const offY = document.getElementById('catalog-constructor-property-door-offset-y');
          const offZ = document.getElementById('catalog-constructor-property-door-offset-z');
          const isFacadeNode =
            String(nodeData.originalType || '').toLowerCase() === 'facade' ||
            !!nodeData.modelId ||
            !!nodeData.spec?.id ||
            String(nodeData.name || '').indexOf('Фасад') !== -1;
          if (facadeOffsetSection) facadeOffsetSection.style.display = isFacadeNode ? 'block' : 'none';
          const dOff = nodeData.spec?.door_offset && typeof nodeData.spec.door_offset === 'object'
            ? nodeData.spec.door_offset
            : {};
          if (offX) offX.value = String(Number(dOff.x) || 0);
          if (offY) offY.value = String(Number(dOff.y) || 0);
          if (offZ) offZ.value = String(Number(dOff.z) || 0);
          
          // Материал
          const materialGroup = document.getElementById('catalog-constructor-property-material-group');
          const materialKey = document.getElementById('catalog-constructor-property-material-key');
          const materialThickness = document.getElementById('catalog-constructor-property-material-thickness');
          // Референс: material_group берется из nodeData или дефолт 'g0'
          // В рефе фасады используют facades_group на уровне шкафа, а не material_group в узле
          if (materialGroup) materialGroup.value = nodeData.material_group || 'g0';
          if (materialKey) materialKey.value = __cldNormalizeMaterialKey(nodeData.material_key) || 'material_2';
          if (materialThickness) {
            const gk = materialGroup?.value || nodeData.material_group || 'g0';
            const lib = window.__cldMaterialsLib;
            const groupDef = Array.isArray(lib?.groups) ? lib.groups.find((g) => g && g.key === gk) : null;
            const ov = window.__cldMaterialsState?.groupOverrides?.[gk] || {};
            const v = Number(ov.thickness ?? groupDef?.thickness ?? 16);
            materialThickness.value = Number.isFinite(v) ? String(v) : '';
          }
          
          // Обновляем отображение выбранного материала
          if (typeof updateMaterialDisplay === 'function') {
            updateMaterialDisplay();
          }
          
          // Чекбоксы
          const rotate = document.getElementById('catalog-constructor-property-rotate');
          const fixed = document.getElementById('catalog-constructor-property-fixed');
          if (rotate !== null) rotate.checked = nodeData.rotate || false;
          if (fixed !== null) fixed.checked = nodeData.fixed || false;
          
          // Кромки
          const edgeNumbering = document.getElementById('catalog-constructor-property-edge-numbering');
          if (edgeNumbering !== null) {
            edgeNumbering.checked = nodeData.edge_numbering !== false;
            // Референс: при загрузке свойств обновляем видимость списка кромок
            const edgesListContainer = document.getElementById('catalog-constructor-edges-list-container');
            if (edgesListContainer) {
              edgesListContainer.style.display = edgeNumbering.checked ? 'block' : 'none';
            }
          }
          
          for (let i = 1; i <= 4; i++) {
            const edgeCheckbox = document.getElementById(`catalog-constructor-property-edge-${i}`);
            const edgeDetailsDiv = document.getElementById(`catalog-constructor-property-edge-${i}-details`);
            const edgeThickness = document.getElementById(`catalog-constructor-property-edge-${i}-thickness`);
            const edgeType = document.getElementById(`catalog-constructor-property-edge-${i}-type`);
            
            const edgeData = nodeData.edges && nodeData.edges[i] ? nodeData.edges[i] : {};
            if (edgeCheckbox !== null) edgeCheckbox.checked = edgeData.enabled || false;
            if (edgeThickness) edgeThickness.value = edgeData.thickness || '0.2';
            
            // Референс: кромка 1 всегда показывает детали, остальные - только если включены
            if (edgeDetailsDiv) {
              edgeDetailsDiv.style.display = edgeCheckbox && edgeCheckbox.checked ? 'block' : 'none';
            }
            
            if (edgeType) {
              // Референс: обновляем dropdown с выбранным типом кромки
              const edgeTypeValue = edgeData.type || 'butts';
              edgeType.value = edgeTypeValue;
              
              // Если тип не найден в dropdown, добавляем его
              let optionExists = false;
              for (let j = 0; j < edgeType.options.length; j++) {
                if (edgeType.options[j].value === edgeTypeValue) {
                  optionExists = true;
                  break;
                }
              }
              
              if (!optionExists && edgeData.type_name) {
                const newOption = document.createElement('option');
                newOption.value = edgeTypeValue;
                newOption.textContent = edgeData.type_name || edgeTypeValue;
                edgeType.appendChild(newOption);
                edgeType.value = edgeTypeValue;
              }
            }

            // Восстанавливаем выбранный декор кромки (как в рефе: "3: Кромка ...")
            const edgeSelectedId = document.getElementById(`catalog-constructor-property-edge-${i}-selected-id`);
            const edgeSelectedName = document.getElementById(`catalog-constructor-property-edge-${i}-selected-name`);
            const edgeLink = document.getElementById(`catalog-constructor-property-edge-${i}-link`);
            const edgeRemove = document.getElementById(`catalog-constructor-property-edge-${i}-remove`);
            const decorIdInput = document.getElementById(`catalog-constructor-property-edge-${i}-decor-id`);
            const decorNameInput = document.getElementById(`catalog-constructor-property-edge-${i}-decor-name`);
            const decorId = edgeData.decor_id || edgeData.edge_id || '';
            const decorName = edgeData.decor_name || edgeData.edge_name || '';
            if (decorIdInput) decorIdInput.value = decorId ? String(decorId) : '';
            if (decorNameInput) decorNameInput.value = decorName || '';
            if (edgeSelectedId) {
              edgeSelectedId.textContent = decorId ? String(decorId) + ':' : '';
              edgeSelectedId.style.display = decorId ? 'inline' : 'none';
            }
            if (edgeSelectedName) {
              edgeSelectedName.textContent = decorName || '';
              edgeSelectedName.style.display = decorName ? 'inline' : 'none';
            }
            if (edgeLink) {
              if (decorId) {
                edgeLink.style.display = 'inline-block';
                edgeLink.href = `#edge-item-edit?type=butt_butts&id=${encodeURIComponent(decorId)}&name=${encodeURIComponent('Кромки')}`;
              } else {
                edgeLink.style.display = 'none';
              }
            }
            if (edgeRemove) {
              edgeRemove.style.display = decorId ? 'inline-block' : 'none';
            }
          }
          
          // Размеры
          const sizeX = document.getElementById('catalog-constructor-property-size-x');
          const sizeY = document.getElementById('catalog-constructor-property-size-y');
          const sizeZ = document.getElementById('catalog-constructor-property-size-z');
          
          // Для деталей: если поля пустые, подставляем дефолты из getDetailDefaults
          // ВАЖНО: тип детали может храниться как в nodeData, так и в data-detail-type на DOM-узле.
          const detailTypeId =
            nodeData.detailType ||
            nodeData.detailTypeId ||
            nodeData.spec?.detailTypeId ||
            currentSelectedNode?.getAttribute('data-detail-type') ||
            '';
          let defaultSize = {}, defaultPos = {}, defaultPivot = null;
          if (detailTypeId) {
            const dflt = cldGetDetailDefaults(detailTypeId);
            if (dflt) {
              defaultSize = dflt.size || {};
              defaultPos = dflt.pos || {};
              defaultPivot = dflt.pivot || null;
            }
          }
          
          if (sizeX) sizeX.value = nodeData.size?.x || defaultSize.x || '';
          if (sizeY) sizeY.value = nodeData.size?.y || defaultSize.y || '';
          if (sizeZ) sizeZ.value = nodeData.size?.z || defaultSize.z || '';

          // Миграция старых горизонталей: раньше делали отступы по X на толщину материала.
          // Теперь (как в референсе) горизонтали идут по всей ширине секции.
          if (detailTypeId && (detailTypeId === 'horizontal_bottom' || detailTypeId === 'horizontal_middle' || detailTypeId === 'horizontal_top')) {
            const oldSizeX = String(nodeData.size?.x ?? '').trim();
            const oldPosX = String(nodeData.position?.x ?? '').trim();
            const looksLikeOldInset =
              oldSizeX === '@section.width - $wall.thickness * 2' &&
              oldPosX === '$wall.thickness' &&
              !nodeData.anchor_user_set;
            if (looksLikeOldInset && currentSelectedNode && currentSelectedNode.nodeData) {
              currentSelectedNode.nodeData.size = currentSelectedNode.nodeData.size || {};
              currentSelectedNode.nodeData.position = currentSelectedNode.nodeData.position || {};
              currentSelectedNode.nodeData.size.x = '@section.width';
              currentSelectedNode.nodeData.position.x = 0;
              // pivot.x остаётся -1 (как и было), просто фиксируем если вдруг поплыло
              currentSelectedNode.nodeData.anchor = currentSelectedNode.nodeData.anchor || { x: -1, y: -1, z: -1 };
              if (currentSelectedNode.nodeData.anchor.x === undefined) currentSelectedNode.nodeData.anchor.x = -1;

              // обновим UI поля сразу
              if (sizeX) sizeX.value = '@section.width';
              const posX = document.getElementById('catalog-constructor-property-pos-x');
              if (posX) posX.value = 0;

              // и применим в превью
              saveConstructorNodeData(currentSelectedNode);
              if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
            }
          }
          
          // Позиционирование
          const posX = document.getElementById('catalog-constructor-property-pos-x');
          const posY = document.getElementById('catalog-constructor-property-pos-y');
          const posZ = document.getElementById('catalog-constructor-property-pos-z');
          if (posX) posX.value = nodeData.position?.x !== undefined ? nodeData.position.x : (defaultPos.x !== undefined ? defaultPos.x : '0');
          if (posY) posY.value = nodeData.position?.y !== undefined ? nodeData.position.y : (defaultPos.y !== undefined ? defaultPos.y : '0');
          if (posZ) posZ.value = nodeData.position?.z !== undefined ? nodeData.position.z : (defaultPos.z !== undefined ? defaultPos.z : '0');
          
          // Точка отсчета
          // ВАЖНО: используем ?? вместо ||, чтобы значение 0 (центр) не затиралось дефолтом.
          // Если anchor отсутствует — берём дефолт из getDetailDefaults(detailTypeId).pivot (как в референсе).
          const isZeroAnchor =
            nodeData.anchor &&
            Number(nodeData.anchor.x) === 0 &&
            Number(nodeData.anchor.y) === 0 &&
            Number(nodeData.anchor.z) === 0;
          const shouldUseDefaultPivot = !nodeData.anchor || (!nodeData.anchor_user_set && isZeroAnchor);
          const effPivot = shouldUseDefaultPivot && defaultPivot ? defaultPivot : nodeData.anchor;
          updateAnchorButtons('x', effPivot?.x ?? defaultPivot?.x ?? 0);
          updateAnchorButtons('y', effPivot?.y ?? defaultPivot?.y ?? 0);
          updateAnchorButtons('z', effPivot?.z ?? defaultPivot?.z ?? 0);
          
          // Поворот
          const rotX = document.getElementById('catalog-constructor-property-rot-x');
          const rotY = document.getElementById('catalog-constructor-property-rot-y');
          const rotZ = document.getElementById('catalog-constructor-property-rot-z');
          if (rotX) rotX.value = nodeData.rotation?.x || '0';
          if (rotY) rotY.value = nodeData.rotation?.y || '0';
          if (rotZ) rotZ.value = nodeData.rotation?.z || '0';
          
          // Условие, Комментарии, События
          const comments = document.getElementById('catalog-constructor-property-comments');
          if (comments) comments.value = nodeData.comments || '';
          
          const eventBeforeParams = document.getElementById('catalog-constructor-property-event-before-params');
          const eventBeforeBuild = document.getElementById('catalog-constructor-property-event-before-build');
          const eventAfterBuild = document.getElementById('catalog-constructor-property-event-after-build');
          const eventDragEnd = document.getElementById('catalog-constructor-property-event-drag-end');
          if (eventBeforeParams) eventBeforeParams.value = nodeData.events?.on_before_params || '';
          if (eventBeforeBuild) eventBeforeBuild.value = nodeData.events?.on_before_build || '';
          if (eventAfterBuild) eventAfterBuild.value = nodeData.events?.on_after_build || '';
          if (eventDragEnd) eventDragEnd.value = nodeData.events?.on_drag_end || '';
          
          // Ключ для наполнения
          const fillKey = document.getElementById('catalog-constructor-property-fill-key');
          if (fillKey) fillKey.value = nodeData.fill_key || '';
          
          // Общие чекбоксы
          const considerSize = document.getElementById('catalog-constructor-property-consider-size');
          const considerCuts = document.getElementById('catalog-constructor-property-consider-cuts');
          const considerIntersections = document.getElementById('catalog-constructor-property-consider-intersections');
          const showNested = document.getElementById('catalog-constructor-property-show-nested');
          if (considerSize !== null) considerSize.checked = nodeData.consider_size || false;
          if (considerCuts !== null) considerCuts.checked = nodeData.consider_cuts || false;
          if (considerIntersections !== null) considerIntersections.checked = nodeData.consider_intersections || false;
          if (showNested !== null) showNested.checked = nodeData.show_nested || false;
          
          // Обновляем список комплектующих
          if (typeof updateAccessoriesList === 'function') {
            updateAccessoriesList();
          }
          
          // Обновляем отображение материала
          if (typeof updateMaterialDisplay === 'function') {
            updateMaterialDisplay();
          }
        }
        
        // Обновление кнопок точки отсчета (anchor)
        function updateAnchorButtons(axis, value) {
          const target = Number(value);
          const valueNum = Number.isFinite(target) ? target : 0;
          const buttons = document.querySelectorAll(`.anchor-btn[data-axis="${axis}"]`);
          buttons.forEach(btn => {
            const btnValue = parseInt(btn.getAttribute('data-value'));
            if (btnValue === valueNum) {
              btn.style.background = '#C5FF5D';
              btn.style.color = '#333';
              btn.style.border = 'none';
              btn.setAttribute('data-active', 'true');
            } else {
              btn.style.background = '#f5f5f5';
              btn.style.color = '#333';
              btn.style.border = '1px solid #d0d7e2';
              btn.removeAttribute('data-active');
            }
          });
        }
        
        // Скрытие секций для деталей
        function hideDetailSections() {
          const detailSpecific = document.getElementById('catalog-constructor-detail-specific');
          const materialSection = document.getElementById('catalog-constructor-material-section');
          const detailCheckboxes = document.getElementById('catalog-constructor-detail-checkboxes');
          const edgesSection = document.getElementById('catalog-constructor-edges-section');
          const sizeSection = document.getElementById('catalog-constructor-size-section');
          const positionSection = document.getElementById('catalog-constructor-position-section');
          const advancedSection = document.getElementById('catalog-constructor-advanced-section');
          
          [detailSpecific, materialSection, detailCheckboxes, edgesSection, sizeSection, positionSection, advancedSection].forEach(section => {
            if (section) section.style.display = 'none';
          });
        }
        
        // Показ секций для деталей (будет вызываться при выборе детали)
        function showDetailSections() {
          const detailSpecific = document.getElementById('catalog-constructor-detail-specific');
          const materialSection = document.getElementById('catalog-constructor-material-section');
          const detailCheckboxes = document.getElementById('catalog-constructor-detail-checkboxes');
          const edgesSection = document.getElementById('catalog-constructor-edges-section');
          const sizeSection = document.getElementById('catalog-constructor-size-section');
          const positionSection = document.getElementById('catalog-constructor-position-section');
          const advancedSection = document.getElementById('catalog-constructor-advanced-section');
          
          [detailSpecific, materialSection, detailCheckboxes, edgesSection, sizeSection, positionSection, advancedSection].forEach(section => {
            if (section) section.style.display = 'block';
          });
          if (typeof window.__cldEnsureFormulaButtons === 'function') window.__cldEnsureFormulaButtons();
        }

        // Показ секций для section: без материалов/кромок, но с размером/позицией/точкой отсчета/поворотом.
        function showSectionSections() {
          const detailSpecific = document.getElementById('catalog-constructor-detail-specific');
          const materialSection = document.getElementById('catalog-constructor-material-section');
          const detailCheckboxes = document.getElementById('catalog-constructor-detail-checkboxes');
          const edgesSection = document.getElementById('catalog-constructor-edges-section');
          const sizeSection = document.getElementById('catalog-constructor-size-section');
          const positionSection = document.getElementById('catalog-constructor-position-section');
          const advancedSection = document.getElementById('catalog-constructor-advanced-section');

          [detailSpecific, materialSection, detailCheckboxes, edgesSection].forEach(section => {
            if (section) section.style.display = 'none';
          });
          [sizeSection, positionSection, advancedSection].forEach(section => {
            if (section) section.style.display = 'block';
          });
          if (typeof window.__cldEnsureFormulaButtons === 'function') window.__cldEnsureFormulaButtons();
        }
        
        // Сохранение изменений в выбранный элемент
        function saveConstructorNodeData(node) {
          if (!node) return;
          
          const typeInput = document.getElementById('catalog-constructor-property-type');
          const nameInput = document.getElementById('catalog-constructor-property-name');
          const idInput = document.getElementById('catalog-constructor-property-id');
          
          if (!node.nodeData) {
            node.nodeData = {};
          }
          
          // Сохраняем базовые поля: в поле "Тип" отображается кириллица, при сохранении — ключ (model, facade и т.д.)
          const typeKey = TYPE_NAMES_REVERSE[typeInput?.value] || typeInput?.value || node.nodeData.originalType || 'section';
          node.nodeData.type = typeKey;
          node.nodeData.originalType = typeKey;
          node.nodeData.name = nameInput?.value || '';
          node.nodeData.id = idInput?.value || '';
          node.nodeData.hide_when_filled = document.getElementById('catalog-constructor-property-hide-when-filled')?.checked || false;
          node.nodeData.active = document.getElementById('catalog-constructor-property-active')?.checked !== false;
          node.nodeData.article = document.getElementById('catalog-constructor-property-article')?.value || '';
          
          // Если это деталь - сохраняем все поля детали
          // Как в updateConstructorPropertiesPanel: без data-node-type контейнер считаем секцией;
          // иначе роль подсекции в UI меняется, а saveSectionNodeData не вызывается.
          let nodeType = node.getAttribute('data-node-type');
          if (!nodeType) {
            const ot = String(node.nodeData?.originalType || node.nodeData?.type || '').toLowerCase();
            nodeType =
              ot === 'detail' || ot === 'facade' || ot === 'module' || ot === 'model' || ot === 'furniture'
                ? 'detail'
                : 'section';
          }
          if (nodeType === 'detail') {
            saveDetailNodeData(currentSelectedNode);
          } else if (nodeType === 'section') {
            saveSectionNodeData(currentSelectedNode);
          }

          // ��. admin-new-bundle.js: ��� ����� getConstructorTreeJSON ��� ���������� clodisJSON � ������.
          try {
            const rmEl = document.getElementById('constructor-root-module');
            const chEl = document.getElementById('constructor-root-module-children');
            if (rmEl && chEl && typeof window.__ppBuildClodisTemplateTreeFromDom === 'function') {
              rmEl.nodeData = rmEl.nodeData || {};
              rmEl.nodeData.clodisJSON = window.__ppBuildClodisTemplateTreeFromDom(chEl);
            }
          } catch (_) {}
          
          // ��������� ���������� ����������� � ������ (��������, ��������)
          if (node === rootModule) {
            const rootName = document.getElementById('constructor-root-module-name');
            if (rootName) {
              rootName.textContent = node.nodeData.name || '(элемент без названия)';
            }
          } else {
            // TODO: ���������� �������� ��� �������� ���������
          }
        }
        
        // Сохранение данных детали
        function saveDetailNodeData(node) {
          if (!node.nodeData) return;
          
          const orientation = document.getElementById('catalog-constructor-property-orientation');
          const shape = document.getElementById('catalog-constructor-property-shape');
          // ⭐ ИСПРАВЛЕНИЕ: Сохраняем orientation в spec.orientation (как в референсе)
          const orientationValue = orientation?.value || 'h';
          node.nodeData.orientation = orientationValue;
          // Референс: orientation хранится в spec.orientation
          if (!node.nodeData.spec) node.nodeData.spec = {};
          node.nodeData.spec.orientation = orientationValue;
          node.nodeData.shape = shape?.value || 'normal';

          const offX = Number(document.getElementById('catalog-constructor-property-door-offset-x')?.value);
          const offY = Number(document.getElementById('catalog-constructor-property-door-offset-y')?.value);
          const offZ = Number(document.getElementById('catalog-constructor-property-door-offset-z')?.value);
          node.nodeData.spec.door_offset = {
            x: Number.isFinite(offX) ? offX : 0,
            y: Number.isFinite(offY) ? offY : 0,
            z: Number.isFinite(offZ) ? offZ : 0
          };
          
          // Материал
          // Референс: material_group берется из UI или дефолт 'g0'
          // В рефе фасады используют facades_group на уровне шкафа, а не material_group в узле
          node.nodeData.material_group = document.getElementById('catalog-constructor-property-material-group')?.value || 'g0';
          node.nodeData.material_key = document.getElementById('catalog-constructor-property-material-key')?.value || (window.__cldMaterialsLib?.keys?.[0]?.key) || 'material_2';
          // material_id и material_name сохраняются при выборе материала через selectMaterialForNode
          
          // Чекбоксы
          node.nodeData.rotate = document.getElementById('catalog-constructor-property-rotate')?.checked || false;
          node.nodeData.fixed = document.getElementById('catalog-constructor-property-fixed')?.checked || false;
          
          // Кромки
          node.nodeData.edge_numbering = document.getElementById('catalog-constructor-property-edge-numbering')?.checked !== false;
          const prevEdges = node.nodeData.edges && typeof node.nodeData.edges === 'object' ? node.nodeData.edges : {};
          node.nodeData.edges = {};
          for (let i = 1; i <= 4; i++) {
            const edgeCheckbox = document.getElementById(`catalog-constructor-property-edge-${i}`);
            const edgeThickness = document.getElementById(`catalog-constructor-property-edge-${i}-thickness`);
            const edgeType = document.getElementById(`catalog-constructor-property-edge-${i}-type`);
            const decorIdInput = document.getElementById(`catalog-constructor-property-edge-${i}-decor-id`);
            const decorNameInput = document.getElementById(`catalog-constructor-property-edge-${i}-decor-name`);
            const prev = prevEdges[i] || {};
            const decorIdVal = decorIdInput?.value || '';
            const decorNameVal = decorNameInput?.value || '';
            const thicknessVal = edgeThickness?.value || '';
            node.nodeData.edges[i] = {
              enabled: edgeCheckbox?.checked || false,
              // �������: ���� ������������ ������ �� ��� � ��������� ���������� (���� ����� �� ������),
              // � 0.2 ���������� ������ ��� ������� fallback.
              thickness: thicknessVal || prev.thickness || '0.2',
              type: edgeType?.value || (prev.type || 'butts'),
              type_name: prev.type_name || '',
              decor_id: decorIdVal ? decorIdVal : (prev.decor_id || prev.edge_id || ''),
              decor_name: decorNameVal || prev.decor_name || prev.edge_name || '',
              edge_id: decorIdVal ? decorIdVal : (prev.edge_id || ''),
              edge_name: decorNameVal || prev.edge_name || '',
              color: prev.color || '',
              icon: prev.icon || ''
            };
          }
          
          // Размеры
          node.nodeData.size = {
            x: document.getElementById('catalog-constructor-property-size-x')?.value || '',
            y: document.getElementById('catalog-constructor-property-size-y')?.value || '',
            z: document.getElementById('catalog-constructor-property-size-z')?.value || ''
          };
          
          // Позиционирование
          node.nodeData.position = {
            x: document.getElementById('catalog-constructor-property-pos-x')?.value || '0',
            y: document.getElementById('catalog-constructor-property-pos-y')?.value || '0',
            z: document.getElementById('catalog-constructor-property-pos-z')?.value || '0'
          };
          
          // Точка отсчета (anchor) - получаем из активной кнопки
          node.nodeData.anchor = {
            x: parseInt(document.querySelector('.anchor-btn[data-axis="x"][data-active="true"]')?.getAttribute('data-value') || '0'),
            y: parseInt(document.querySelector('.anchor-btn[data-axis="y"][data-active="true"]')?.getAttribute('data-value') || '0'),
            z: parseInt(document.querySelector('.anchor-btn[data-axis="z"][data-active="true"]')?.getAttribute('data-value') || '0')
          };
          
          // Поворот
          node.nodeData.rotation = {
            x: document.getElementById('catalog-constructor-property-rot-x')?.value || '0',
            y: document.getElementById('catalog-constructor-property-rot-y')?.value || '0',
            z: document.getElementById('catalog-constructor-property-rot-z')?.value || '0'
          };
          
          // Комментарии
          node.nodeData.comments = document.getElementById('catalog-constructor-property-comments')?.value || '';
          
          // События
          node.nodeData.events = {
            on_before_params: document.getElementById('catalog-constructor-property-event-before-params')?.value || '',
            on_before_build: document.getElementById('catalog-constructor-property-event-before-build')?.value || '',
            on_after_build: document.getElementById('catalog-constructor-property-event-after-build')?.value || '',
            on_drag_end: document.getElementById('catalog-constructor-property-event-drag-end')?.value || ''
          };
          
          // Ключ для наполнения
          node.nodeData.fill_key = document.getElementById('catalog-constructor-property-fill-key')?.value || '';
          
          // Общие чекбоксы
          node.nodeData.consider_size = document.getElementById('catalog-constructor-property-consider-size')?.checked || false;
          node.nodeData.consider_cuts = document.getElementById('catalog-constructor-property-consider-cuts')?.checked || false;
          node.nodeData.consider_intersections = document.getElementById('catalog-constructor-property-consider-intersections')?.checked || false;
          node.nodeData.show_nested = document.getElementById('catalog-constructor-property-show-nested')?.checked || false;
        }

        // Сохранение данных section (размер/позиция/anchor/поворот) — как у деталей, но без material/edges.
        function saveSectionNodeData(node) {
          if (!node?.nodeData) return;

          node.nodeData.size = {
            x: document.getElementById('catalog-constructor-property-size-x')?.value || '',
            y: document.getElementById('catalog-constructor-property-size-y')?.value || '',
            z: document.getElementById('catalog-constructor-property-size-z')?.value || '',
          };

          node.nodeData.position = {
            x: document.getElementById('catalog-constructor-property-pos-x')?.value || '0',
            y: document.getElementById('catalog-constructor-property-pos-y')?.value || '0',
            z: document.getElementById('catalog-constructor-property-pos-z')?.value || '0',
          };

          node.nodeData.anchor = {
            x: parseInt(document.querySelector('.anchor-btn[data-axis="x"][data-active="true"]')?.getAttribute('data-value') || '-1'),
            y: parseInt(document.querySelector('.anchor-btn[data-axis="y"][data-active="true"]')?.getAttribute('data-value') || '-1'),
            z: parseInt(document.querySelector('.anchor-btn[data-axis="z"][data-active="true"]')?.getAttribute('data-value') || '-1'),
          };

          node.nodeData.rotation = {
            x: document.getElementById('catalog-constructor-property-rot-x')?.value || '0',
            y: document.getElementById('catalog-constructor-property-rot-y')?.value || '0',
            z: document.getElementById('catalog-constructor-property-rot-z')?.value || '0',
          };

          const roleSel = document.getElementById('catalog-constructor-property-section-layout-role');
          const rawRole = roleSel?.value ?? '';
          node.nodeData.sectionLayoutRole =
            typeof window.__cldNormalizeSectionLayoutRole === 'function'
              ? window.__cldNormalizeSectionLayoutRole(rawRole)
              : String(rawRole || '').trim();

          node.nodeData.comments = document.getElementById('catalog-constructor-property-comments')?.value || '';
          node.nodeData.events = {
            on_before_params: document.getElementById('catalog-constructor-property-event-before-params')?.value || '',
            on_before_build: document.getElementById('catalog-constructor-property-event-before-build')?.value || '',
            on_after_build: document.getElementById('catalog-constructor-property-event-after-build')?.value || '',
            on_drag_end: document.getElementById('catalog-constructor-property-event-drag-end')?.value || '',
          };
        }

        // Заполнение полей для section (size/pos/anchor/rotation)
        function fillSectionProperties(nodeData) {
          const size = nodeData?.size || {};
          const pos = nodeData?.position || {};
          const anchor = nodeData?.anchor || { x: -1, y: -1, z: -1 };
          const rot = nodeData?.rotation || { x: '0', y: '0', z: '0' };

          const setVal = (id, v, fb = '') => {
            const el = document.getElementById(id);
            if (el) el.value = (v !== undefined && v !== null) ? String(v) : fb;
          };

          setVal('catalog-constructor-property-size-x', size.x, '');
          setVal('catalog-constructor-property-size-y', size.y, '');
          setVal('catalog-constructor-property-size-z', size.z, '');
          setVal('catalog-constructor-property-pos-x', pos.x, '0');
          setVal('catalog-constructor-property-pos-y', pos.y, '0');
          setVal('catalog-constructor-property-pos-z', pos.z, '0');
          setVal('catalog-constructor-property-rot-x', rot.x, '0');
          setVal('catalog-constructor-property-rot-y', rot.y, '0');
          setVal('catalog-constructor-property-rot-z', rot.z, '0');

          const roleSel = document.getElementById('catalog-constructor-property-section-layout-role');
          if (roleSel) {
            const raw = nodeData?.sectionLayoutRole ?? nodeData?.layout_role ?? '';
            const normalized =
              typeof window.__cldNormalizeSectionLayoutRole === 'function'
                ? window.__cldNormalizeSectionLayoutRole(raw)
                : String(raw || '').trim();
            roleSel.value = normalized || '';
          }

          updateAnchorButtons('x', Number(anchor.x ?? -1));
          updateAnchorButtons('y', Number(anchor.y ?? -1));
          updateAnchorButtons('z', Number(anchor.z ?? -1));
        }
        
        // Валидация полей
        function validateConstructorFields() {
          const nameInput = document.getElementById('catalog-constructor-property-name');
          const typeInput = document.getElementById('catalog-constructor-property-type');
          
          // Проверяем обязательные поля (если нужно)
          if (nameInput && nameInput.value.trim() === '') {
            nameInput.style.borderColor = '#dc3545';
            return false;
          } else if (nameInput) {
            nameInput.style.borderColor = '#d0d7e2';
          }
          
          // Валидация числовых полей (размеры, позиции, повороты)
          const numericFields = [
            'catalog-constructor-property-size-x',
            'catalog-constructor-property-size-y',
            'catalog-constructor-property-size-z',
            'catalog-constructor-property-pos-x',
            'catalog-constructor-property-pos-y',
            'catalog-constructor-property-pos-z',
            'catalog-constructor-property-rot-x',
            'catalog-constructor-property-rot-y',
            'catalog-constructor-property-rot-z'
          ];
          
          let isValid = true;
          numericFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && field.value.trim() !== '') {
              const value = parseFloat(field.value);
              if (isNaN(value)) {
                field.style.borderColor = '#dc3545';
                isValid = false;
              } else {
                field.style.borderColor = '#d0d7e2';
              }
            }
          });
          
          return isValid;
        }
        
        // Инициализация обработчиков для всех полей панели свойств
        function initConstructorPropertiesHandlers() {
          // Обработчики изменения полей - автоматическое сохранение
          const propertiesPanel = document.getElementById('constructor-properties-panel');
          if (!propertiesPanel) return;
          
          // ����������� ��� ���� input � select � ������ �������
          propertiesPanel.addEventListener('input', function(e) {
            if (currentSelectedNode) {
              // ��������� ������ ��� ��������� �����
              saveConstructorNodeData(currentSelectedNode);
            }
          });
          
          propertiesPanel.addEventListener('change', function(e) {
            if (currentSelectedNode) {
              saveConstructorNodeData(currentSelectedNode);
              // ��� � ����: ����� ��������� (� �.�. ����������) ������ ����� ��������� ������
              try { if (typeof update3DVisibility === 'function') update3DVisibility(currentSelectedNode); } catch {}
              try { if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe(); } catch {}
            }
          });
          
          // Обработчики для кнопок точки отсчета (anchor)
          const anchorButtons = document.querySelectorAll('.anchor-btn');
          anchorButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
              e.preventDefault();
              const axis = this.getAttribute('data-axis');
              const value = parseInt(this.getAttribute('data-value'));
              
              updateAnchorButtons(axis, value);
              
              if (currentSelectedNode) {
                // фиксируем, что пользователь явно менял anchor
                if (!currentSelectedNode.nodeData) currentSelectedNode.nodeData = {};
                currentSelectedNode.nodeData.anchor_user_set = true;

                // Поведение как в референсе: переключение "точки отсчёта" по ключевой оси
                // приводит к "снэпу" позиции детали (лево/центр/право для вертикальных, низ/центр/верх для горизонтальных).
                const nodeType = currentSelectedNode.getAttribute('data-node-type');
                const detailTypeId = currentSelectedNode.getAttribute('data-detail-type') || currentSelectedNode.nodeData.detailType || '';
                if (nodeType === 'detail' && detailTypeId) {
                  // Снэп "как в референсе": меняем тип и только связанную ось,
                  // не уничтожая остальные настройки пользователя.
                  const applyAxisSnap = (typeId, axisKey /* 'x'|'y'|'z' */) => {
                    const d = cldGetDetailDefaults(typeId);
                    if (!d) return;

                    currentSelectedNode.nodeData.detailType = typeId;
                    currentSelectedNode.setAttribute('data-detail-type', typeId);

                    // Держим orientation в nodeData и nodeData.spec синхронно
                    if (!currentSelectedNode.nodeData.spec) currentSelectedNode.nodeData.spec = {};
                    if (d.spec?.orientation) {
                      currentSelectedNode.nodeData.orientation = d.spec.orientation;
                      currentSelectedNode.nodeData.spec.orientation = d.spec.orientation;
                    }
                    if (d.spec?.direction) currentSelectedNode.nodeData.spec.direction = d.spec.direction;

                    // Позиция: правим только одну ось, остальные оставляем как есть
                    currentSelectedNode.nodeData.position = currentSelectedNode.nodeData.position || {};
                    if (d.pos && Object.prototype.hasOwnProperty.call(d.pos, axisKey)) {
                      currentSelectedNode.nodeData.position[axisKey] = d.pos[axisKey];
                    }

                    // Anchor: правим только одну ось, остальные берём из текущего anchor или из дефолта пресета
                    const curA = currentSelectedNode.nodeData.anchor || {};
                    const baseA = d.pivot || { x: -1, y: -1, z: -1 };
                    currentSelectedNode.nodeData.anchor = {
                      x: axisKey === 'x' ? baseA.x : (curA.x ?? baseA.x),
                      y: axisKey === 'y' ? baseA.y : (curA.y ?? baseA.y),
                      z: axisKey === 'z' ? baseA.z : (curA.z ?? baseA.z),
                    };
                  };

                  // Вертикальные: X => left/middle/right
                  if (axis === 'x' && (detailTypeId === 'vertical_left' || detailTypeId === 'vertical_middle' || detailTypeId === 'vertical_right')) {
                    const nextType = value === -1 ? 'vertical_left' : (value === 0 ? 'vertical_middle' : 'vertical_right');
                    currentSelectedNode.nodeData.detailPosition = value === -1 ? 'vertical-left' : (value === 0 ? 'vertical-middle' : 'vertical-right');
                    applyAxisSnap(nextType, 'x');
                    // Принудительно задаём pivot.x по выбранной кнопке (а не по старому anchor)
                    currentSelectedNode.nodeData.anchor = {
                      ...(currentSelectedNode.nodeData.anchor || {}),
                      x: value,
                    };
                  }

                  // Горизонтальные: Y => bottom/middle/top
                  if (axis === 'y' && (detailTypeId === 'horizontal_bottom' || detailTypeId === 'horizontal_middle' || detailTypeId === 'horizontal_top')) {
                    const nextType = value === -1 ? 'horizontal_bottom' : (value === 0 ? 'horizontal_middle' : 'horizontal_top');
                    currentSelectedNode.nodeData.detailPosition = value === -1 ? 'horizontal-bottom' : (value === 0 ? 'horizontal-middle' : 'horizontal-top');
                    applyAxisSnap(nextType, 'y');
                    currentSelectedNode.nodeData.anchor = {
                      ...(currentSelectedNode.nodeData.anchor || {}),
                      y: value,
                    };
                  }

                  // Фронт/Зад: Z => back/middle/front
                  if (axis === 'z' && (detailTypeId === 'back_front' || detailTypeId === 'front_middle' || detailTypeId === 'front_front')) {
                    const nextType = value === -1 ? 'back_front' : (value === 0 ? 'front_middle' : 'front_front');
                    currentSelectedNode.nodeData.detailPosition = value === -1 ? 'back' : (value === 0 ? 'front-middle' : 'front-front');
                    applyAxisSnap(nextType, 'z');
                    // Для накладной front_front pivot.z должен идти из пресета (z=-1),
                    // поэтому не перетираем anchor.z вручную значением кнопки.
                  }
                }

                saveConstructorNodeData(currentSelectedNode);
                // Обновим видимые поля (позиция/точка отсчёта), чтобы не оставались старые значения
                if (typeof fillDetailProperties === 'function' && currentSelectedNode.nodeData) {
                  fillDetailProperties(currentSelectedNode.nodeData);
                }
                if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
              }
            });
          });
          
          // Обработчик кнопки "Ок" для Позиция по Y - автоподстановка размера для вертикальных деталей
          const posYOkBtn = document.getElementById('catalog-constructor-property-pos-y-ok');
          const posYInput = document.getElementById('catalog-constructor-property-pos-y');
          const sizeYInput = document.getElementById('catalog-constructor-property-size-y');
          
          if (posYOkBtn && posYInput && sizeYInput) {
            const handlePosYUpdate = () => {
              if (!currentSelectedNode) return;

              // IMPORTANT: auto-update size.y from pos.y applies to vertical *detail* nodes only.
              // For section containers it breaks user-entered values (������/������).
              const nodeType = currentSelectedNode.getAttribute('data-node-type');
              if (nodeType === 'section') return;
              
              const detailTypeId = currentSelectedNode.getAttribute('data-detail-type');
              const isVertical = detailTypeId && (detailTypeId === 'vertical_left' || detailTypeId === 'vertical_right' || detailTypeId === 'vertical_middle');
              
              if (isVertical) {
                const posYValue = posYInput.value.trim();
                if (posYValue && posYValue !== '0') {
                  // Автоматически обновляем размер Y: @section.height - {posY}
                  const newSizeY = `@section.height - ${posYValue}`;
                  sizeYInput.value = newSizeY;
                  
                  // Сохраняем изменения
                  if (currentSelectedNode.nodeData) {
                    currentSelectedNode.nodeData.size = currentSelectedNode.nodeData.size || {};
                    currentSelectedNode.nodeData.size.y = newSizeY;
                  }
                } else {
                  // Если posY = 0, возвращаем размер к дефолту
                  sizeYInput.value = '@section.height';
                  if (currentSelectedNode.nodeData) {
                    currentSelectedNode.nodeData.size = currentSelectedNode.nodeData.size || {};
                    currentSelectedNode.nodeData.size.y = '@section.height';
                  }
                }
                
                saveConstructorNodeData(currentSelectedNode);
                if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
              }
            };
            
            posYOkBtn.addEventListener('click', handlePosYUpdate);
            // Также срабатывает при потере фокуса (как в Clodis)
            posYInput.addEventListener('blur', handlePosYUpdate);
          }
          
          // Обработчики для кнопок "Ок" у pos-x и pos-z
          const posXOkBtn = document.getElementById('catalog-constructor-property-pos-x-ok');
          const posZOkBtn = document.getElementById('catalog-constructor-property-pos-z-ok');
          
          if (posXOkBtn) {
            posXOkBtn.addEventListener('click', function() {
              if (currentSelectedNode) {
                saveConstructorNodeData(currentSelectedNode);
                if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
              }
            });
          }
          
          if (posZOkBtn) {
            posZOkBtn.addEventListener('click', function() {
              if (currentSelectedNode) {
                saveConstructorNodeData(currentSelectedNode);
                if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
              }
            });
          }

          // Обработчики для кнопок "Ок" у size-x, size-y, size-z (как в референсе)
          const sizeXOkBtn = document.getElementById('catalog-constructor-property-size-x-ok');
          const sizeYOkBtn = document.getElementById('catalog-constructor-property-size-y-ok');
          const sizeZOkBtn = document.getElementById('catalog-constructor-property-size-z-ok');

          // ВАЖНО: sizeYInput уже объявлен выше (для автоподстановки от posY).
          // Чтобы не ломать скрипт, здесь используем другие имена.
          const sizeXField = document.getElementById('catalog-constructor-property-size-x');
          const sizeYField = document.getElementById('catalog-constructor-property-size-y');
          const sizeZField = document.getElementById('catalog-constructor-property-size-z');

          const applySizeUpdate = () => {
            if (currentSelectedNode) {
              saveConstructorNodeData(currentSelectedNode);
              if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
            }
          };

          if (sizeXOkBtn) sizeXOkBtn.addEventListener('click', applySizeUpdate);
          if (sizeYOkBtn) sizeYOkBtn.addEventListener('click', applySizeUpdate);
          if (sizeZOkBtn) sizeZOkBtn.addEventListener('click', applySizeUpdate);

          // Также применяем на blur (в референсе удобно подтверждать формулы)
          if (sizeXField) sizeXField.addEventListener('blur', applySizeUpdate);
          if (sizeYField) sizeYField.addEventListener('blur', applySizeUpdate);
          if (sizeZField) sizeZField.addEventListener('blur', applySizeUpdate);
          
          // Обработчики для кнопок "Ок" у rot-x, rot-y, rot-z
          const rotXOkBtn = document.getElementById('catalog-constructor-property-rot-x-ok');
          const rotYOkBtn = document.getElementById('catalog-constructor-property-rot-y-ok');
          const rotZOkBtn = document.getElementById('catalog-constructor-property-rot-z-ok');
          
          if (rotXOkBtn) {
            rotXOkBtn.addEventListener('click', function() {
              if (currentSelectedNode) {
                saveConstructorNodeData(currentSelectedNode);
                if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
              }
            });
          }
          
          if (rotYOkBtn) {
            rotYOkBtn.addEventListener('click', function() {
              if (currentSelectedNode) {
                saveConstructorNodeData(currentSelectedNode);
                if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
              }
            });
          }
          
          if (rotZOkBtn) {
            rotZOkBtn.addEventListener('click', function() {
              if (currentSelectedNode) {
                saveConstructorNodeData(currentSelectedNode);
                if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
              }
            });
          }
          
          // Функция для создания выпадающего списка переменных
          function showVariableDropdown(button, fieldId) {
            // Закрываем предыдущие выпадающие списки
            const existingDropdown = document.querySelector('.variable-dropdown');
            if (existingDropdown) {
              existingDropdown.remove();
            }
            
            const field = document.getElementById(fieldId);
            if (!field) return;

            // Вставка токена в поле (поведение как в референсе: кнопки + / -)
            function applyToken(token, op /* '+' | '-' */) {
              const cur = String(field.value || '').trim();
              const tok = String(token || '').trim();
              if (!tok) return;

              let next;
              if (!cur) {
                next = tok;
              } else if (op === '-') {
                next = `${cur} - ${tok}`;
              } else {
                next = `${cur} + ${tok}`;
              }

              field.value = next;
              field.dispatchEvent(new Event('input', { bubbles: true }));
              if (currentSelectedNode) saveConstructorNodeData(currentSelectedNode);
              if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
            }

            // Данные для меню (группы как в референсе)
            const groups = [
              {
                title: 'Размеры',
                items: [
                  { token: '@section.width', label: 'Ширина секции (@section.width)' },
                  { token: '@section.height', label: 'Высота секции (@section.height)' },
                  { token: '@section.depth', label: 'Глубина секции (@section.depth)' },
                ],
              },
              {
                title: 'Переменные',
                items: [
                  { token: '$wall.thickness', label: 'Толщина детали ($wall.thickness)' },
                ],
              },
              {
                title: 'Материалы',
                items: [
                  { token: '#material.group0.thickness', label: 'Толщина материала группы 0 (#material.group0.thickness)' },
                ],
              },
            ];

            // Создаём выпадающий список
            const dropdown = document.createElement('div');
            dropdown.className = 'variable-dropdown';
            dropdown.style.cssText = 'position:absolute; background:white; border:1px solid #d0d7e2; border-radius:6px; box-shadow:0 6px 18px rgba(0,0,0,0.12); z-index:10000; max-height:240px; overflow-y:auto; min-width:320px;';

            groups.forEach((group, gi) => {
              const header = document.createElement('div');
              header.textContent = group.title;
              header.style.cssText = 'padding:10px 12px; font-size:12px; font-weight:700; color:#333; background:#fafafa; border-bottom:1px solid #f0f0f0;';
              dropdown.appendChild(header);

              group.items.forEach((it, ii) => {
                const row = document.createElement('div');
                row.style.cssText = 'display:flex; align-items:center; gap:8px; padding:8px 12px; border-bottom:1px solid #f0f0f0;';

                const link = document.createElement('div');
                link.textContent = it.label;
                link.style.cssText = 'flex:1; font-size:12px; color:#0b5ed7; cursor:pointer; user-select:none;';
                link.onmouseover = () => (link.style.textDecoration = 'underline');
                link.onmouseout = () => (link.style.textDecoration = 'none');
                link.onclick = () => {
                  applyToken(it.token, '+');
                  dropdown.remove();
                };

                const btnPlus = document.createElement('button');
                btnPlus.type = 'button';
                btnPlus.textContent = '+';
                btnPlus.style.cssText = 'width:28px; height:28px; border:1px solid #d0d7e2; border-radius:4px; background:#fff; cursor:pointer; font-weight:700; line-height:1;';
                btnPlus.onclick = (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  applyToken(it.token, '+');
                  dropdown.remove();
                };

                const btnMinus = document.createElement('button');
                btnMinus.type = 'button';
                btnMinus.textContent = '−';
                btnMinus.style.cssText = 'width:28px; height:28px; border:1px solid #d0d7e2; border-radius:4px; background:#fff; cursor:pointer; font-weight:700; line-height:1;';
                btnMinus.onclick = (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  applyToken(it.token, '-');
                  dropdown.remove();
                };

                row.appendChild(link);
                row.appendChild(btnPlus);
                row.appendChild(btnMinus);
                dropdown.appendChild(row);
              });

              // разделитель между группами (чуть плотнее)
              if (gi < groups.length - 1) {
                const spacer = document.createElement('div');
                spacer.style.cssText = 'height:6px; background:#fff;';
                dropdown.appendChild(spacer);
              }
            });
            
            // Позиционируем выпадающий список
            const buttonRect = button.getBoundingClientRect();
            dropdown.style.top = (buttonRect.bottom + 2) + 'px';
            dropdown.style.left = buttonRect.left + 'px';
            
            document.body.appendChild(dropdown);
            
            // Закрываем при клике вне списка
            const closeHandler = (e) => {
              if (!dropdown.contains(e.target) && e.target !== button) {
                dropdown.remove();
                document.removeEventListener('click', closeHandler);
              }
            };
            setTimeout(() => document.addEventListener('click', closeHandler), 0);
          }
          
          // Обработчики для кнопок "+{a}" (добавить переменную)
          document.querySelectorAll('.variable-btn-add').forEach(btn => {
            btn.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              const fieldId = this.getAttribute('data-field-id');
              if (fieldId) {
                showVariableDropdown(this, fieldId);
              }
            });
          });
          
          // Обработчики для кнопок "{aa}" (переключение режима отображения)
          document.querySelectorAll('.variable-btn-mode').forEach(btn => {
            btn.addEventListener('click', function(e) {
              e.preventDefault();
              const fieldId = this.getAttribute('data-field-id');
              const field = document.getElementById(fieldId);
              if (!field) return;
              
              // Переключаем между "pretty" (с {}) и "real" (реальные выражения)
              const currentValue = field.value;
              // Пока упрощённая версия - просто показываем/скрываем фигурные скобки
              // В Clodis это более сложная логика
              this.textContent = this.textContent === '{aa}' ? 'a:a' : '{aa}';
            });
          });
          
          // Обработчики для кнопок "× 2" и "÷ 2"
          document.querySelectorAll('.math-btn-multiply').forEach(btn => {
            btn.addEventListener('click', function(e) {
              e.preventDefault();
              const fieldId = this.getAttribute('data-field-id');
              const field = document.getElementById(fieldId);
              if (!field) return;
              
              const currentValue = field.value.trim();
              if (currentValue) {
                field.value = `(${currentValue}) * 2`;
                field.dispatchEvent(new Event('input', { bubbles: true }));
                if (currentSelectedNode) {
                  saveConstructorNodeData(currentSelectedNode);
                }
              }
            });
          });
          
          document.querySelectorAll('.math-btn-divide').forEach(btn => {
            btn.addEventListener('click', function(e) {
              e.preventDefault();
              const fieldId = this.getAttribute('data-field-id');
              const field = document.getElementById(fieldId);
              if (!field) return;
              
              const currentValue = field.value.trim();
              if (currentValue) {
                field.value = `(${currentValue}) / 2`;
                field.dispatchEvent(new Event('input', { bubbles: true }));
                if (currentSelectedNode) {
                  saveConstructorNodeData(currentSelectedNode);
                }
              }
            });
          });
        }

        function initSectionLayoutRoleSelectOptions() {
          const sel = document.getElementById('catalog-constructor-property-section-layout-role');
          if (!sel || sel.getAttribute('data-cld-roles-initialized') === '1') return;
          const roles = Array.isArray(window.__CLD_SECTION_LAYOUT_ROLES)
            ? window.__CLD_SECTION_LAYOUT_ROLES
            : [{ key: '', label: '(не задано)' }];
          sel.innerHTML = '';
          roles.forEach((r) => {
            const opt = document.createElement('option');
            opt.value = r.key || '';
            opt.textContent = r.label || r.key || '(?)';
            sel.appendChild(opt);
          });
          sel.setAttribute('data-cld-roles-initialized', '1');
        }
        initSectionLayoutRoleSelectOptions();

        // ���������� ��������� ��������� �� ������ ����� ���������� h_bottom/h_top.
        // ����: ������������ �������� � ��������� ������ layout_role, � UI ��� �����������
        // � size_y/pos_y ��������������� �������. ��������� � ���������� � ����� 10.1.153.
        function __roleFormulaByKey(roleKey) {
          const role = String(roleKey || '').trim().toLowerCase();
          if (role === 'plinth') return 'v:h_bottom';
          if (role === 'corpus' || role === 'facades')
            return 's:y - v:h_bottom - v:h_top - v:tech_zone_mm';
          if (role === 'corpus_antresol') return '1950';
          if (role === 'top')
            return 's:y - v:h_bottom - v:corpus_antresol_mm - v:tech_zone_mm (pos: v:h_bottom + v:corpus_antresol_mm)';
          return '';
        }

        function initSectionRoleYPresetUi() {
          const roleSel = document.getElementById('catalog-constructor-property-section-layout-role');
          const yInput = document.getElementById('catalog-constructor-property-size-y');
          const posYInput = document.getElementById('catalog-constructor-property-pos-y');
          const applyBtn = document.getElementById('catalog-constructor-apply-y-by-role');
          const addLegsBtn = document.getElementById('catalog-constructor-add-legs-50mm');
          const hint = document.getElementById('catalog-constructor-role-y-hint');
          const yTooltip = document.getElementById('catalog-constructor-size-y-tooltip');
          if (!roleSel || !yInput || !applyBtn) return;

          const ensureRootLayoutVariables = () => {
            try {
              const rootEl = document.getElementById('constructor-root-module');
              if (!rootEl) return;
              rootEl.nodeData = rootEl.nodeData || {};
              rootEl.nodeData.variables = rootEl.nodeData.variables || {};
              rootEl.nodeData.variables.main = rootEl.nodeData.variables.main || {};
              if (rootEl.nodeData.variables.main.h_bottom == null) rootEl.nodeData.variables.main.h_bottom = 100;
              if (rootEl.nodeData.variables.main.h_top == null) rootEl.nodeData.variables.main.h_top = 0;
              if (rootEl.nodeData.variables.main.tech_zone_mm == null)
                rootEl.nodeData.variables.main.tech_zone_mm = 0;
              if (rootEl.nodeData.variables.main.corpus_antresol_mm == null)
                rootEl.nodeData.variables.main.corpus_antresol_mm = 1950;
            } catch (_) {}
          };

          /** ������ ����� ����� �� � ���� Y (��� ���������) � ��� �������� � v:h_* ����� ������������ �������. */
          const parseStandalonePositiveMm = (s) => {
            const t = String(s ?? '')
              .trim()
              .replace(/\s+/g, '')
              .replace(',', '.');
            if (!t || !/^\d+(?:\.\d+)?$/.test(t)) return NaN;
            const n = parseFloat(t);
            return Number.isFinite(n) && n > 0 ? n : NaN;
          };

          /** ����� ������� Y �� v:h_top / v:h_bottom �������� ������� ������ � variables.main � ����� ������ ��� 0. */
          const seedRoleLayoutVarsFromNumericSizeY = (role) => {
            try {
              const numY = parseStandalonePositiveMm(yInput?.value);
              if (!Number.isFinite(numY)) return;
              const rootEl = document.getElementById('constructor-root-module');
              if (!rootEl) return;
              rootEl.nodeData = rootEl.nodeData || {};
              rootEl.nodeData.variables = rootEl.nodeData.variables || {};
              rootEl.nodeData.variables.main = rootEl.nodeData.variables.main || {};
              const main = rootEl.nodeData.variables.main;
              if (role === 'top') main.h_top = numY;
              else if (role === 'plinth') main.h_bottom = numY;
            } catch (_) {}
          };

          const applyRolePreset = () => {
            const role = String(roleSel.value || '').trim().toLowerCase();
            if (!role) return;
            seedRoleLayoutVarsFromNumericSizeY(role);
            ensureRootLayoutVariables();
            if (role === 'plinth') {
              yInput.value = 'v:h_bottom';
              if (posYInput) posYInput.value = '0';
            } else if (role === 'corpus' || role === 'facades') {
              yInput.value = 's:y - v:h_bottom - v:h_top - v:tech_zone_mm';
              if (posYInput) posYInput.value = 'v:h_bottom';
            } else if (role === 'corpus_antresol') {
              yInput.value = '1950';
              if (posYInput) posYInput.value = 'v:h_bottom';
            } else if (role === 'top') {
              yInput.value = 's:y - v:h_bottom - v:corpus_antresol_mm - v:tech_zone_mm';
              if (posYInput) posYInput.value = 'v:h_bottom + v:corpus_antresol_mm';
            } else {
              return;
            }
            yInput.dispatchEvent(new Event('input', { bubbles: true }));
            if (posYInput) posYInput.dispatchEvent(new Event('input', { bubbles: true }));
            if (currentSelectedNode && typeof saveConstructorNodeData === 'function') {
              saveConstructorNodeData(currentSelectedNode);
            }
            if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
          };

          const syncHint = () => {
            const formula = __roleFormulaByKey(roleSel.value);
            if (!hint) return;
            if (formula) {
              const role = String(roleSel.value || '').trim().toLowerCase();
              hint.textContent = `�� ������ ����������� Y �� ���� �����������: ${formula}`;
            } else {
              hint.textContent = 'Для этой роли автоподстановка не задана.';
            }
          };

          if (!applyBtn.dataset.bound) {
            applyBtn.dataset.bound = '1';
            applyBtn.addEventListener('click', () => {
              const formula = __roleFormulaByKey(roleSel.value);
              if (!formula) {
                if (window.toastr && typeof window.toastr.warning === 'function') {
                  window.toastr.warning('Для выбранной роли нет готовой формулы Y.');
                }
                return;
              }
              applyRolePreset();
            });
          }

          if (!roleSel.dataset.roleHintBound) {
            roleSel.dataset.roleHintBound = '1';
            roleSel.addEventListener('change', () => {
              syncHint();
              // �� ����������� ������� �������������: v:h_top ��� h_top=0 ���������� ������ ��������.
              // ������������ �� ���� ����������� � ������� (layoutZones); ����� ��������� ������� ������� �� ����� ����������� Y �� ����.
              try {
                const n =
                  (typeof currentSelectedNode !== 'undefined' && currentSelectedNode) ||
                  window.__cldCurrentSelectedNode ||
                  window.currentSelectedNode;
                if (!n || n === document.getElementById('constructor-root-module')) return;
                if (n.getAttribute('data-node-type') !== 'section') return;
                const cc = n.querySelector(':scope > .tree-node-children');
                const sp = n.querySelector('.tree-node-toggle span');
                if (cc) cc.style.display = 'block';
                if (sp) sp.textContent = '▼';
              } catch (_) {}
            });
          }

          if (yTooltip && !yInput.dataset.tooltipBound) {
            yInput.dataset.tooltipBound = '1';
            const showTip = () => { yTooltip.style.display = 'block'; };
            const hideTip = () => { yTooltip.style.display = 'none'; };
            yInput.addEventListener('focus', showTip);
            yInput.addEventListener('click', showTip);
            yInput.addEventListener('blur', hideTip);
          }

          // ����-���������� 4 ���� � ������ (������ role=plinth). ���������� �� 10.1.153.
          if (addLegsBtn && !addLegsBtn.dataset.bound) {
            addLegsBtn.dataset.bound = '1';
            addLegsBtn.addEventListener('click', () => {
              try {
                if (!currentSelectedNode) {
                  alert('Сначала выбери секцию в дереве.');
                  return;
                }
                const nodeType = currentSelectedNode.getAttribute('data-node-type') || currentSelectedNode?.nodeData?.type;
                if (nodeType !== 'section') {
                  alert('Опоры можно добавить только в секцию (рекомендуется в роль plinth).');
                  return;
                }
                const roleRaw =
                  roleSel?.value ??
                  currentSelectedNode?.nodeData?.sectionLayoutRole ??
                  currentSelectedNode?.nodeData?.layout_role ??
                  '';
                const role = String(roleRaw || '').trim().toLowerCase();
                if (role && role !== 'plinth') {
                  const ok = confirm('Выбрана секция не с ролью plinth. Всё равно добавить опоры?');
                  if (!ok) return;
                }

                const LEG_SIZE_MM = 40;
                const INSET_MM = 50;
                const formulas = [
                  { name: 'Опора ПЛ', x: `${INSET_MM}`, z: `${INSET_MM}` },
                  { name: 'Опора ПП', x: `s:x - ${INSET_MM + LEG_SIZE_MM}`, z: `${INSET_MM}` },
                  { name: 'Опора ЗЛ', x: `${INSET_MM}`, z: `s:z - ${INSET_MM + LEG_SIZE_MM}` },
                  { name: 'Опора ЗП', x: `s:x - ${INSET_MM + LEG_SIZE_MM}`, z: `s:z - ${INSET_MM + LEG_SIZE_MM}` },
                ];

                let lastNode = null;
                formulas.forEach((p, idx) => {
                  const n = createConstructorTreeNode('detail', currentSelectedNode);
                  n.nodeData = n.nodeData || {};
                  n.nodeData.name = p.name;
                  n.nodeData.originalType = 'wall';
                  n.nodeData.type = 'detail';
                  n.nodeData.size = { x: String(LEG_SIZE_MM), y: 'v:h_bottom', z: String(LEG_SIZE_MM) };
                  n.nodeData.position = { x: p.x, y: '0', z: p.z };
                  n.nodeData.anchor = { x: -1, y: -1, z: -1 };
                  n.nodeData.rotation = { x: '0', y: '0', z: '0' };
                  n.nodeData.material_group = 'g0';
                  n.nodeData.material_key = 'material_2';
                  n.nodeData.spec = { ...(n.nodeData.spec || {}), orientation: 'v', direction: 'z' };
                  n.setAttribute('data-node-name', p.name);
                  const titleEl = n.querySelector('.tree-node-name');
                  if (titleEl) titleEl.textContent = p.name;
                  n.nodeData.cldSupportLeg = true;
                  n.nodeData.cldSupportLegIndex = idx + 1;
                  addTreeNodeToParent(n, currentSelectedNode);
                  lastNode = n;
                });

                if (lastNode && typeof selectTreeNode === 'function') selectTreeNode(lastNode);
                if (typeof saveConstructorNodeData === 'function' && currentSelectedNode) {
                  saveConstructorNodeData(currentSelectedNode);
                }
                if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
                if (window.toastr && typeof window.toastr.success === 'function') {
                  window.toastr.success('Добавлены 4 опоры: 50 мм от углов.');
                }
              } catch (e) {
                console.error('[admin] add support legs failed:', e);
                alert('Не удалось добавить опоры: ' + (e?.message || e));
              }
            });
          }
          syncHint();
        }
        initSectionRoleYPresetUi();

        // Инициализация обработчиков
        initConstructorPropertiesHandlers();
        
        // Обработчик кнопки "Добавить" в панели свойств
        const addButton = document.getElementById('catalog-constructor-property-add');
        if (addButton) {
          addButton.addEventListener('click', function() {
            if (!currentSelectedNode) {
              alert('Сначала выберите элемент, к которому нужно добавить дочерний элемент');
              return;
            }
            
            // Определяем тип добавляемого элемента по типу выбранного
            const selectedType = currentSelectedNode.getAttribute('data-node-type') || 'section';
            
            // Создаем новый элемент (по умолчанию - секция)
            const newElementType = 'section'; // Можно будет изменить через модальное окно
            const newElement = createConstructorTreeNode(newElementType, currentSelectedNode);
            
            // Добавляем в дерево
            addTreeNodeToParent(newElement, currentSelectedNode);
            
            // Выбираем новый элемент
            selectTreeNode(newElement);
            if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
          });
        }
        
        // Обработчик кнопки "Добавить" для комплектующих
        const addComponentButton = document.getElementById('catalog-constructor-property-add-component');
        if (addComponentButton) {
          addComponentButton.addEventListener('click', function() {
            if (!currentSelectedNode) {
              alert('Сначала выберите элемент');
              return;
            }
            openAccessoriesModal();
          });
        }
        
        // Обработчик ссылки "Выбрать" для материала (референс: #catalog_modal_materials)
        const materialSelectLink = document.getElementById('catalog-constructor-property-material-select');
        if (materialSelectLink) {
          materialSelectLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (!currentSelectedNode) {
              alert('Сначала выберите элемент');
              return;
            }
            if (typeof window.openMaterialSelectModal === 'function') {
              window.openMaterialSelectModal();
            } else {
              console.error('[CLD][material] ❌ window.openMaterialSelectModal не определена!');
            }
          });
        } else {
          console.warn('[CLD][material] ⚠️ Ссылка catalog-constructor-property-material-select не найдена в DOM');
        }
        
        // Функция открытия модального окна выбора материала (глобальная для доступа из onclick)
        window.openMaterialSelectModal = function() {
          const modal = document.getElementById('material-select-modal');
          if (!modal) {
            console.error('[CLD][material] Модальное окно не найдено');
            return;
          }
          modal.style.display = 'flex';
          loadMaterialsList();
        };
        
        // Функция закрытия модального окна выбора материала (глобальная для доступа из onclick)
        window.closeMaterialSelectModal = function() {
          const modal = document.getElementById('material-select-modal');
          if (modal) {
            modal.style.display = 'none';
          }
        };
        
        // ===== Материалы (clean-room) =====
        // Данные берём из public/data/*.json (без API и без кода референса).
        window.__cldMaterialsLib = window.__cldMaterialsLib || null;
        window.__cldMaterialsState = window.__cldMaterialsState || { groupOverrides: {} };
        window.__cldMaterialsLoading = window.__cldMaterialsLoading || null;

        async function __cldFetchJson(url) {
          const r = await fetch(url, { cache: 'no-store' });
          if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
          return await r.json();
        }
        // Обратная совместимость: ldsp/hdf → material_2/material_3
        function __cldNormalizeMaterialKey(key) {
          const legacy = { ldsp: 'material_2', hdf: 'material_3' };
          return (key && legacy[key]) ? legacy[key] : key;
        }

        async function __cldEnsureMaterialsLoaded() {
          if (window.__cldMaterialsLib) return window.__cldMaterialsLib;
          if (window.__cldMaterialsLoading) return window.__cldMaterialsLoading;

          window.__cldMaterialsLoading = (async () => {
            const [groups, apiKeysRaw] = await Promise.all([
              __cldFetchJson('/data/materials_groups.json'),
              fetch('/api/catalog/items_get/materials_keys', { cache: 'no-store' }).then(r => r.ok ? r.json() : []),
            ]);
            const apiKeys = Array.isArray(apiKeysRaw) ? apiKeysRaw : (apiKeysRaw?.items || []);

            // Строим keys и itemsByKey из API (как в "Список ЛДСП" — material_2, material_3)
            const keys = [];
            const itemsByKey = {};
            for (const m of apiKeys) {
              const id = m?.id;
              const name = (m?.name || '').toString().trim();
              if (!id) continue;
              const typeKey = `material_${id}`;
              keys.push({ key: typeKey, name: name || typeKey });
              try {
                const resp = await fetch(`/api/catalog/items_get/${typeKey}`, { cache: 'no-store' });
                const data = resp.ok ? await resp.json() : [];
                itemsByKey[typeKey] = Array.isArray(data) ? data : (data?.items || []);
              } catch (e) {
                if (window.__CLD_DEBUG) console.warn('[CLD][material] no items for', typeKey, e?.message || e);
                itemsByKey[typeKey] = [];
              }
            }

            window.__cldMaterialsLib = { groups: groups || [], keys, itemsByKey };
            return window.__cldMaterialsLib;
          })();

          try {
            return await window.__cldMaterialsLoading;
          } finally {
            window.__cldMaterialsLoading = null;
          }
        }
        // Экспортируем для синхронизации превью
        window.__cldEnsureMaterialsLoaded = __cldEnsureMaterialsLoaded;

        function __cldBuildMaterialsPayload() {
          const lib = window.__cldMaterialsLib;
          const out = {};

          // Даже если lib ещё не загружена — отправляем хотя бы g0 из поля "Толщина группы"
          const thickIn = document.getElementById('catalog-constructor-property-material-thickness');
          const groupSel = document.getElementById('catalog-constructor-property-material-group');
          const fallbackWt = Number(thickIn?.value);
          const defaultWt = Number.isFinite(fallbackWt) ? fallbackWt : 16;
          const uiGroupKey = groupSel?.value || 'g0';

          const defaultMatKey = (lib?.keys?.[0]?.key) || 'material_2';
          if (!lib) {
            out.g0 = {
              thickness: defaultWt,
              material: { key: defaultMatKey, id: 0, variant_id: 0 },
              material_icon: window.__cldMaterialsState?.groupOverrides?.g0?.material_icon || '',
            };
            return { vars: { _wt: defaultWt }, materials: out };
          }

          for (const g of lib.groups || []) {
            const key = g.key;
            if (!key) continue;
            const ov = window.__cldMaterialsState?.groupOverrides?.[key] || {};
            const materialKey = __cldNormalizeMaterialKey(ov.material_key || g.material) || defaultMatKey;
            const materialId = ov.material_id || 0;
            // UI-значение (поле "Толщина группы") должно иметь приоритет для выбранной группы,
            // даже если текущий узел не выбран (иначе override может не записаться).
            const uiThickness = (key === uiGroupKey && Number.isFinite(fallbackWt)) ? fallbackWt : undefined;
            const thickness = Number(uiThickness ?? ov.thickness ?? g.thickness ?? (key === 'g0' ? defaultWt : 16));
            const materialIcon = ov.material_icon || '';
            out[key] = {
              thickness,
              material: { key: materialKey, id: materialId, variant_id: 0 },
              material_icon: materialIcon,
            };
          }

          // Гарантируем, что g0 существует даже если lib.groups пустой/непрогрузился
          if (!out.g0) {
            const ov0 = window.__cldMaterialsState?.groupOverrides?.g0 || {};
            out.g0 = {
              thickness: Number((uiGroupKey === 'g0' && Number.isFinite(fallbackWt)) ? fallbackWt : (ov0.thickness ?? defaultWt)),
              material: { key: __cldNormalizeMaterialKey(ov0.material_key) || defaultMatKey, id: ov0.material_id || 0, variant_id: 0 },
              material_icon: ov0.material_icon || '',
            };
          }

          const g0t = out.g0?.thickness ?? defaultWt;
          return { vars: { _wt: Number(g0t) || defaultWt }, materials: out };
        }

        // Экспортируем для __ppSyncPreviewToIframe (глобальная синхронизация)
        window.__cldBuildMaterialsPayload = __cldBuildMaterialsPayload;
        // Утилита для отладки (в консоли): __CLDDBG_MATERIALS()
        window.__CLDDBG_MATERIALS = function () {
          try {
            const lib = window.__cldMaterialsLib;
            const st = window.__cldMaterialsState;
            const payload = window.__cldBuildMaterialsPayload ? window.__cldBuildMaterialsPayload() : null;
            console.log('[CLD][materials][dbg]', {
              hasLib: !!lib,
              groups: lib?.groups,
              keys: lib?.keys,
              overrides: st?.groupOverrides,
              payload,
            });
          } catch (e) {
            console.warn('[CLD][materials][dbg] failed', e);
          }
        };

        async function __cldPopulateMaterialSelects() {
          const lib = await __cldEnsureMaterialsLoaded();
          const groupSel = document.getElementById('catalog-constructor-property-material-group');
          const keySel = document.getElementById('catalog-constructor-property-material-key');
          const thickIn = document.getElementById('catalog-constructor-property-material-thickness');

          if (groupSel) {
            groupSel.innerHTML = '';
            for (const g of lib.groups || []) {
              const opt = document.createElement('option');
              opt.value = g.key;
              opt.textContent = `${g.name || g.key} (${g.key})`;
              groupSel.appendChild(opt);
            }
            if (!groupSel.value) groupSel.value = 'g0';
          }

          if (keySel) {
            keySel.innerHTML = '';
            for (const k of lib.keys || []) {
              const opt = document.createElement('option');
              opt.value = k.key;
              opt.textContent = `${k.name || k.key} (${k.key})`;
              keySel.appendChild(opt);
            }
            if (!keySel.value) keySel.value = (lib.keys?.[0]?.key) || 'material_2';
          }

          // Толщина группы: показываем дефолт группы или override
          if (thickIn && groupSel) {
            const gk = groupSel.value || 'g0';
            const groupDef = (lib.groups || []).find((g) => g && g.key === gk);
            const ov = window.__cldMaterialsState?.groupOverrides?.[gk] || {};
            const v = Number(ov.thickness ?? groupDef?.thickness ?? 16);
            thickIn.value = Number.isFinite(v) ? String(v) : '';
          }
        }

        // Функция загрузки списка материалов (для модалки выбора)
        async function loadMaterialsList() {
          const tbody = document.getElementById('material-select-modal-tbody');
          if (!tbody) return;
          tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">Загрузка...</td></tr>';

          const lib = await __cldEnsureMaterialsLoaded();
          // Контекст модалки: позволяет выбирать материалы из вкладки "Материалы" без привязки к полям конструктора
          const ctx = window.__CLD_MATERIAL_MODAL_CONTEXT || null;
          const materialKey =
            (ctx && ctx.materialKey) ||
            document.getElementById('catalog-constructor-property-material-key')?.value ||
            (lib.keys?.[0]?.key) || 'material_2';
          const items = Array.isArray(lib.itemsByKey?.[materialKey]) ? lib.itemsByKey[materialKey] : [];

          const activeItems = items.filter((x) => x && x.active !== false);
          activeItems.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

          tbody.innerHTML = '';
          if (!activeItems.length) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">Материалы не найдены</td></tr>';
            return;
          }

          activeItems.forEach((mat) => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td style="padding:8px; border:1px solid #ddd; width:70px;">${mat.id ?? ''}</td>
              <td style="padding:8px; border:1px solid #ddd;">${mat.name || ''}</td>
              <td style="padding:8px; border:1px solid #ddd; text-align:center; width:140px;">
                <a href="#" data-mat-id="${mat.id}" style="color:#007bff; text-decoration:none;">Выбрать</a>
              </td>
            `;
            row.querySelector('a')?.addEventListener('click', (e) => {
              e.preventDefault();
              window.selectMaterialForNode(mat.id, mat.name || '');
            });
            tbody.appendChild(row);
          });
        }
        
        // Функция выбора материала для узла (референс: show_swal_catalog)
        window.selectMaterialForNode = function(materialId, materialName) {
          if (!currentSelectedNode) {
            alert('Сначала выберите элемент');
            return;
          }
          // Референс: сохраняем material_id и material_name в nodeData
          if (!currentSelectedNode.nodeData) {
            currentSelectedNode.nodeData = {};
          }
          currentSelectedNode.nodeData.material_id = materialId;
          currentSelectedNode.nodeData.material_name = materialName;

          // ��������� override �� ������ (������� � ��������� ��������)
          const groupKey = document.getElementById('catalog-constructor-property-material-group')?.value || 'g0';
          const lib = window.__cldMaterialsLib;
          const materialKey = document.getElementById('catalog-constructor-property-material-key')?.value || (lib?.keys?.[0]?.key) || 'material_2';
          currentSelectedNode.nodeData.material_group = groupKey;
          currentSelectedNode.nodeData.material_key = materialKey;
          const item = Array.isArray(lib?.itemsByKey?.[materialKey])
            ? lib.itemsByKey[materialKey].find((x) => String(x.id) === String(materialId))
            : null;
          // Сохраняем иконку (используем как texture url в превью/iframe)
          // �����: �������� ���� � ������ ������� �� item.texture (icon � ����� ������/�����).
          currentSelectedNode.nodeData.material_icon = (item?.texture || item?.texture_url || item?.image || item?.icon) || currentSelectedNode.nodeData.material_icon || '';
          const materialIcon = currentSelectedNode.nodeData.material_icon || '';
          const thickness = Number(item?.thickness);
          window.__cldMaterialsState.groupOverrides[groupKey] = {
            material_key: materialKey,
            material_id: materialId,
            material_icon: materialIcon,
            thickness: Number.isFinite(thickness) ? thickness : undefined,
          };

          // Загружаем типы элементов при открытии страницы "Типы элементов"
          const thickIn = document.getElementById('catalog-constructor-property-material-thickness');
          if (thickIn && Number.isFinite(thickness)) thickIn.value = String(thickness);

          if (window.__CLD_DEBUG) {
          }
          
          // Обновляем отображение выбранного материала
          updateMaterialDisplay();
          
          // Сохраняем данные узла
        if (typeof saveDetailNodeData === 'function') {
          saveDetailNodeData(currentSelectedNode);
        }
          
          // Обновляем 3D превью
          if (typeof window.__ppPostModuleToIframe === 'function') {
            window.__ppPostModuleToIframe();
          }
          
          // Закрываем модальное окно
          if (typeof window.closeMaterialSelectModal === 'function') {
            window.closeMaterialSelectModal();
          }
        };
        
        // Функция обновления отображения выбранного материала
        function updateMaterialDisplay() {
          const displayElement = document.getElementById('catalog-constructor-property-material-display');
          if (!displayElement || !currentSelectedNode) return;
          
          const materialId = currentSelectedNode.nodeData?.material_id;
          let materialName = currentSelectedNode.nodeData?.material_name;
          if (!materialName && materialId) {
            const lib = window.__cldMaterialsLib;
            const mk = currentSelectedNode.nodeData?.material_key || document.getElementById('catalog-constructor-property-material-key')?.value || 'material_2';
            const item = Array.isArray(lib?.itemsByKey?.[mk]) ? lib.itemsByKey[mk].find((x) => String(x?.id) === String(materialId)) : null;
            if (item?.name) {
              materialName = item.name;
              currentSelectedNode.nodeData.material_name = materialName;
            }
          }
          
          if (materialId && materialName) {
            displayElement.textContent = `${materialId} ${materialName}`;
            displayElement.style.color = '#333';
          } else {
            displayElement.textContent = 'Не выбран';
            displayElement.style.color = '#666';
          }
        }

        // Инициализация материалов: заполняем селекты и сразу синхронизируем превью по толщине g0
        __cldPopulateMaterialSelects().then(() => {
          const groupSel = document.getElementById('catalog-constructor-property-material-group');
          const keySel = document.getElementById('catalog-constructor-property-material-key');
          const thickIn = document.getElementById('catalog-constructor-property-material-thickness');
          const onMaterialUiChange = () => {
            // Толщина группы: пишем override ВСЕГДА (иначе при невыбранном узле превью не обновится)
            const gk = groupSel?.value || 'g0';
            const n = Number(thickIn?.value);
            window.__cldMaterialsState.groupOverrides[gk] = {
              ...(window.__cldMaterialsState.groupOverrides[gk] || {}),
              thickness: Number.isFinite(n) ? n : undefined,
              // выбранный ключ материала тоже фиксируем в override, чтобы payload был стабильным
              ...(keySel?.value ? { material_key: keySel.value } : {}),
            };

              if (window.__CLD_DEBUG) {
              }

            // Если выбран узел — сохраняем material_group/material_key в nodeData
            if (currentSelectedNode && currentSelectedNode.nodeData) {
              currentSelectedNode.nodeData.material_group = gk;
              currentSelectedNode.nodeData.material_key = keySel?.value || (window.__cldMaterialsLib?.keys?.[0]?.key) || 'material_2';
              saveConstructorNodeData(currentSelectedNode);
              updateMaterialDisplay();
            }

            if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
          };
          groupSel && groupSel.addEventListener('change', onMaterialUiChange);
          keySel && keySel.addEventListener('change', onMaterialUiChange);
          thickIn && thickIn.addEventListener('input', onMaterialUiChange);
            thickIn && thickIn.addEventListener('change', onMaterialUiChange);
            thickIn && thickIn.addEventListener('blur', onMaterialUiChange);
          if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
        }).catch((e) => console.warn('[CLD][material] failed to init materials', e));
        
        // Обработчики кнопок "Выбрать" для кромок 1-4 (референс: show_edges_modal / выбор кромки, как в рефе)
        for (let edgeNum = 1; edgeNum <= 4; edgeNum++) {
          const edgeSelectBtn = document.getElementById(`catalog-constructor-property-edge-${edgeNum}-select`);
          if (edgeSelectBtn) {
            edgeSelectBtn.addEventListener('click', function(e) {
              e.preventDefault();
              if (!currentSelectedNode) {
                alert('Сначала выберите элемент');
                return;
              }
              if (typeof window.openEdgeDecorSelectForDetail === 'function') {
                window.openEdgeDecorSelectForDetail(edgeNum);
              }
            });
          }
        }
        
        // Функция открытия модального окна выбора типа кромки (глобальная для доступа из onclick)
        window.openEdgeTypeSelectModal = function(edgeNumber) {
          const modal = document.getElementById('edge-type-select-modal');
          if (!modal) {
            console.error('[CLD][edge] ❌ Модальное окно edge-type-select-modal не найдено в DOM');
            return;
          }
          // Сохраняем номер кромки в data-атрибуте модального окна
          modal.setAttribute('data-edge-number', edgeNumber);
          modal.style.display = 'flex';
          loadEdgeTypesList();
        };
        
        // Функция закрытия модального окна выбора типа кромки (глобальная для доступа из onclick)
        window.closeEdgeTypeSelectModal = function() {
          const modal = document.getElementById('edge-type-select-modal');
          if (modal) {
            modal.style.display = 'none';
            modal.removeAttribute('data-edge-number');
          }
        };
        
        // Функция загрузки списка типов кромок (референс: catalog_items для кромок)
        function loadEdgeTypesList() {
          const tbody = document.getElementById('edge-type-select-modal-tbody');
          if (!tbody) {
            console.error('[CLD][edge] tbody не найден');
            return;
          }
          
          // Очищаем таблицу
          tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:20px;">Загрузка...</td></tr>';
          
          // Референс: загружаем список типов кромок из API
          // TODO: заменить на реальный API endpoint
          // Пока используем мок-данные для тестирования
          setTimeout(() => {
            const mockEdgeTypes = [
              { id: 'butts', name: 'Набор по умолчанию', active: 1 },
              { id: 'butts_l1', name: 'Кромка левая 1', active: 1 },
              { id: 'butts_l2', name: 'Кромка левая 2', active: 1 },
              { id: 'butts_w1', name: 'Кромка широкая 1', active: 1 },
              { id: 'butts_w2', name: 'Кромка широкая 2', active: 1 },
              { id: 'butts_facade', name: 'Кромка фасадная', active: 1 }
            ];
            
            tbody.innerHTML = '';
            const activeTypes = mockEdgeTypes.filter(t => t.active == 1);
            if (activeTypes.length > 0) {
              activeTypes.forEach(edgeType => {
                const row = document.createElement('tr');
                row.style.cursor = 'pointer';
                row.onmouseover = function() { this.style.background = '#f5f5f5'; };
                row.onmouseout = function() { this.style.background = ''; };
                
                row.innerHTML = `
                  <td style="padding:8px; border:1px solid #ddd;">${edgeType.name || edgeType.id}</td>
                  <td style="padding:8px; border:1px solid #ddd; text-align:center; width:110px;">
                    <a href="#" onclick="selectEdgeTypeForNode('${edgeType.id}', '${(edgeType.name || edgeType.id).replace(/'/g, "\\'")}'); return false;" style="color:#007bff; text-decoration:none;">Добавить</a>
                  </td>
                `;
                tbody.appendChild(row);
              });
            } else {
              tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:20px;">Типы кромок не найдены</td></tr>';
            }
          }, 300);
        }
        
        // Функция выбора типа кромки для узла (референс: show_swal_catalog для кромок)
        window.selectEdgeTypeForNode = function(edgeTypeId, edgeTypeName) {
          if (!currentSelectedNode) {
            alert('Сначала выберите элемент');
            return;
          }
          
          const modal = document.getElementById('edge-type-select-modal');
          const edgeNumber = modal ? modal.getAttribute('data-edge-number') : null;
          
          if (!edgeNumber) {
            console.error('[CLD][edge] Номер кромки не найден');
            return;
          }
          // Референс: сохраняем edge_type в nodeData.edges[edgeNumber]
          if (!currentSelectedNode.nodeData) {
            currentSelectedNode.nodeData = {};
          }
          if (!currentSelectedNode.nodeData.edges) {
            currentSelectedNode.nodeData.edges = {};
          }
          if (!currentSelectedNode.nodeData.edges[edgeNumber]) {
            currentSelectedNode.nodeData.edges[edgeNumber] = {};
          }
          
          currentSelectedNode.nodeData.edges[edgeNumber].type = edgeTypeId;
          currentSelectedNode.nodeData.edges[edgeNumber].type_name = edgeTypeName;
          
          // Обновляем dropdown "Тип" для выбранной кромки
          const edgeTypeSelect = document.getElementById(`catalog-constructor-property-edge-${edgeNumber}-type`);
          if (edgeTypeSelect) {
            // Проверяем, есть ли уже такой option
            let optionExists = false;
            for (let i = 0; i < edgeTypeSelect.options.length; i++) {
              if (edgeTypeSelect.options[i].value === edgeTypeId) {
                optionExists = true;
                break;
              }
            }
            
            if (!optionExists) {
              // Добавляем новый option
              const newOption = document.createElement('option');
              newOption.value = edgeTypeId;
              newOption.textContent = edgeTypeName || edgeTypeId;
              edgeTypeSelect.appendChild(newOption);
            }
            
            // Устанавливаем выбранное значение
            edgeTypeSelect.value = edgeTypeId;
          }
          
          // Сохраняем данные узла
          if (typeof saveDetailNodeData === 'function') {
            saveDetailNodeData(currentSelectedNode);
          }
          
          // Обновляем 3D превью
          if (typeof window.__ppPostModuleToIframe === 'function') {
            window.__ppPostModuleToIframe();
          }
          
          // Закрываем модальное окно
          if (typeof window.closeEdgeTypeSelectModal === 'function') {
            window.closeEdgeTypeSelectModal();
          }
        };
        
        // Обработчики кнопок "Выбрать" для кромок 1-4 (дублирующий блок — также перенаправляем на выбор декора кромки)
        for (let edgeNum = 1; edgeNum <= 4; edgeNum++) {
          const edgeSelectBtn = document.getElementById(`catalog-constructor-property-edge-${edgeNum}-select`);
          if (edgeSelectBtn) {
            edgeSelectBtn.addEventListener('click', function(e) {
              e.preventDefault();
              if (!currentSelectedNode) {
                alert('Сначала выберите элемент');
                return;
              }
              if (typeof window.openEdgeDecorSelectForDetail === 'function') {
                window.openEdgeDecorSelectForDetail(edgeNum);
              }
            });
          }
        }
        
        // Функция открытия модального окна выбора типа кромки (глобальная для доступа из onclick)
        window.openEdgeTypeSelectModal = function(edgeNumber) {
          const modal = document.getElementById('edge-type-select-modal');
          if (!modal) {
            console.error('[CLD][edge] ❌ Модальное окно edge-type-select-modal не найдено в DOM');
            return;
          }
          // Сохраняем номер кромки в data-атрибуте модального окна
          modal.setAttribute('data-edge-number', edgeNumber);
          modal.style.display = 'flex';
          loadEdgeTypesList();
        };
        
        // Функция закрытия модального окна выбора типа кромки (глобальная для доступа из onclick)
        window.closeEdgeTypeSelectModal = function() {
          const modal = document.getElementById('edge-type-select-modal');
          if (modal) {
            modal.style.display = 'none';
            modal.removeAttribute('data-edge-number');
          }
        };
        
        // Функция загрузки списка типов кромок (референс: catalog_items для кромок)
        function loadEdgeTypesList() {
          const tbody = document.getElementById('edge-type-select-modal-tbody');
          if (!tbody) {
            console.error('[CLD][edge] tbody не найден');
            return;
          }
          
          // Очищаем таблицу
          tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:20px;">Загрузка...</td></tr>';
          
          // Референс: загружаем список типов кромок из API
          // TODO: заменить на реальный API endpoint
          // Пока используем мок-данные для тестирования
          setTimeout(() => {
            const mockEdgeTypes = [
              { id: 'butts', name: 'Набор по умолчанию', active: 1 },
              { id: 'butts_l1', name: 'Кромка левая 1', active: 1 },
              { id: 'butts_l2', name: 'Кромка левая 2', active: 1 },
              { id: 'butts_w1', name: 'Кромка широкая 1', active: 1 },
              { id: 'butts_w2', name: 'Кромка широкая 2', active: 1 },
              { id: 'butts_facade', name: 'Кромка фасадная', active: 1 }
            ];
            
            tbody.innerHTML = '';
            const activeTypes = mockEdgeTypes.filter(t => t.active == 1);
            if (activeTypes.length > 0) {
              activeTypes.forEach(edgeType => {
                const row = document.createElement('tr');
                row.style.cursor = 'pointer';
                row.onmouseover = function() { this.style.background = '#f5f5f5'; };
                row.onmouseout = function() { this.style.background = ''; };
                
                row.innerHTML = `
                  <td style="padding:8px; border:1px solid #ddd;">${edgeType.name || edgeType.id}</td>
                  <td style="padding:8px; border:1px solid #ddd; text-align:center; width:110px;">
                    <a href="#" onclick="selectEdgeTypeForNode('${edgeType.id}', '${(edgeType.name || edgeType.id).replace(/'/g, "\\'")}'); return false;" style="color:#007bff; text-decoration:none;">Добавить</a>
                  </td>
                `;
                tbody.appendChild(row);
              });
            } else {
              tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:20px;">Типы кромок не найдены</td></tr>';
            }
          }, 300);
        }
        
        // Функция выбора типа кромки для узла (референс: show_swal_catalog для кромок)
        window.selectEdgeTypeForNode = function(edgeTypeId, edgeTypeName) {
          if (!currentSelectedNode) {
            alert('Сначала выберите элемент');
            return;
          }
          
          const modal = document.getElementById('edge-type-select-modal');
          const edgeNumber = modal ? modal.getAttribute('data-edge-number') : null;
          
          if (!edgeNumber) {
            console.error('[CLD][edge] Номер кромки не найден');
            return;
          }
          // Референс: сохраняем edge_type в nodeData.edges[edgeNumber]
          if (!currentSelectedNode.nodeData) {
            currentSelectedNode.nodeData = {};
          }
          if (!currentSelectedNode.nodeData.edges) {
            currentSelectedNode.nodeData.edges = {};
          }
          if (!currentSelectedNode.nodeData.edges[edgeNumber]) {
            currentSelectedNode.nodeData.edges[edgeNumber] = {};
          }
          
          currentSelectedNode.nodeData.edges[edgeNumber].type = edgeTypeId;
          currentSelectedNode.nodeData.edges[edgeNumber].type_name = edgeTypeName;
          
          // Обновляем dropdown "Тип" для выбранной кромки
          const edgeTypeSelect = document.getElementById(`catalog-constructor-property-edge-${edgeNumber}-type`);
          if (edgeTypeSelect) {
            // Проверяем, есть ли уже такой option
            let optionExists = false;
            for (let i = 0; i < edgeTypeSelect.options.length; i++) {
              if (edgeTypeSelect.options[i].value === edgeTypeId) {
                optionExists = true;
                break;
              }
            }
            
            if (!optionExists) {
              // Добавляем новый option
              const newOption = document.createElement('option');
              newOption.value = edgeTypeId;
              newOption.textContent = edgeTypeName || edgeTypeId;
              edgeTypeSelect.appendChild(newOption);
            }
            
            // Устанавливаем выбранное значение
            edgeTypeSelect.value = edgeTypeId;
          }
          
          // Референс: обновляем отображение выбранной кромки (как в Clodis)
          const edgeSelectedId = document.getElementById(`catalog-constructor-property-edge-${edgeNumber}-selected-id`);
          const edgeSelectedName = document.getElementById(`catalog-constructor-property-edge-${edgeNumber}-selected-name`);
          const edgeLink = document.getElementById(`catalog-constructor-property-edge-${edgeNumber}-link`);
          const edgeRemove = document.getElementById(`catalog-constructor-property-edge-${edgeNumber}-remove`);
          
          if (edgeSelectedId) {
            edgeSelectedId.textContent = edgeTypeId + ':';
            edgeSelectedId.style.display = 'inline';
          }
          if (edgeSelectedName) {
            edgeSelectedName.textContent = edgeTypeName || edgeTypeId;
            edgeSelectedName.style.display = 'inline';
          }
          if (edgeLink) {
            edgeLink.style.display = 'inline-block';
            // TODO: установить правильный href для ссылки на кромку
          }
          if (edgeRemove) {
            edgeRemove.style.display = 'inline-block';
          }
          
          // Сохраняем данные узла
          if (typeof saveDetailNodeData === 'function') {
            saveDetailNodeData(currentSelectedNode);
          }
          
          // Обновляем 3D превью
          if (typeof window.__ppPostModuleToIframe === 'function') {
            window.__ppPostModuleToIframe();
          }
          
          // Закрываем модальное окно
          if (typeof window.closeEdgeTypeSelectModal === 'function') {
            window.closeEdgeTypeSelectModal();
          }
        };
        
        // Референс: обработчик события для чекбокса "Нумерация сторон кромкования"
        // Используем делегирование событий для динамически создаваемых элементов
        const propertiesPanel = document.getElementById('constructor-properties-panel') || document.body;
        propertiesPanel.addEventListener('change', function(e) {
          const target = e.target;
          
          // Обработка чекбокса "Нумерация сторон кромкования"
          if (target && target.id === 'catalog-constructor-property-edge-numbering') {
            const isChecked = target.checked;
            // Референс: при снятии галочки сворачиваем список кромок
            const edgesListContainer = document.getElementById('catalog-constructor-edges-list-container');
            if (edgesListContainer) {
              edgesListContainer.style.display = isChecked ? 'block' : 'none';
            }
            
            // Сохраняем данные узла
            if (currentSelectedNode && typeof saveDetailNodeData === 'function') {
              saveDetailNodeData(currentSelectedNode);
            }
            
            // Обновляем 3D превью
            if (typeof window.__ppPostModuleToIframe === 'function') {
              window.__ppPostModuleToIframe();
            }
          }
          
          // Референс: обработка чекбоксов кромок 1-4 (показывать/скрывать детали)
          if (target && target.id && target.id.startsWith('catalog-constructor-property-edge-') && 
              target.id.match(/^catalog-constructor-property-edge-[1-4]$/)) {
            const edgeNum = target.id.replace('catalog-constructor-property-edge-', '');
            const isChecked = target.checked;
            const detailsDiv = document.getElementById(`catalog-constructor-property-edge-${edgeNum}-details`);
            
            // Референс: кромка 1 всегда показывает детали, остальные - только если включены
            if (detailsDiv) detailsDiv.style.display = isChecked ? 'block' : 'none';
            
            // Сохраняем данные узла
            if (currentSelectedNode && typeof saveDetailNodeData === 'function') {
              saveDetailNodeData(currentSelectedNode);
            }
            
            // Обновляем 3D превью
            if (typeof window.__ppPostModuleToIframe === 'function') {
              window.__ppPostModuleToIframe();
            }
          }
        });
        
        // Функция открытия модального окна комплектующих
        function openAccessoriesModal() {
          const modal = document.getElementById('accessories-modal');
          if (!modal) {
            console.error('[CLD][accessories] Модальное окно не найдено');
            return;
          }
          // target = выбранный узел конструктора
          window.__CLD_ACCESSORIES_TARGET = { kind: 'node' };
          modal.style.display = 'flex';
          loadAccessoriesList();
        }

        // Открыть модалку комплектующих для шаблона (вкладка "Шаблоны")
        window.openAccessoriesModalForTemplate = function(templateId) {
          const modal = document.getElementById('accessories-modal');
          if (!modal) return;
          window.__CLD_ACCESSORIES_TARGET = { kind: 'template', templateId: String(templateId || '') };
          modal.style.display = 'flex';
          loadAccessoriesList();
        };
        
        // Функция закрытия модального окна комплектующих (глобальная для доступа из onclick)
        window.closeAccessoriesModal = function() {
          const modal = document.getElementById('accessories-modal');
          if (modal) {
            modal.style.display = 'none';
          }
        };
        
        // Функция загрузки списка комплектующих
        function loadAccessoriesList() {
          const tbody = document.getElementById('cld-accessories-tbody');
          if (!tbody) return;
          const q = document.getElementById('cld-accessories-search');
          
          // Очищаем таблицу
          tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Загрузка...</td></tr>';

          const escapeAttr = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
          const norm = (s) => String(s || '').toLowerCase();
          const renderRows = (items) => {
            const qq = norm(q?.value || '');
            const filtered = (items || []).filter((acc) => {
              if (!qq) return true;
              return norm(acc.id).includes(qq) || norm(acc.name).includes(qq) || norm(acc.sku || acc.article || '').includes(qq) || norm(acc.category || '').includes(qq);
            });
            tbody.innerHTML = '';
            if (!filtered.length) {
              tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Комплектующие не найдены</td></tr>';
              return;
            }
            filtered.slice(0, 500).forEach((acc) => {
              const row = document.createElement('tr');
              const id = String(acc.id || '');
              const name = String(acc.name || '');
              const sku = String(acc.sku || acc.article || '');
              const category = String(acc.category || acc.type || '');
              row.innerHTML = `
                <td style="padding:8px; border:1px solid #ddd;">${escapeAttr(id)}</td>
                <td style="padding:8px; border:1px solid #ddd;">${escapeAttr(name)}</td>
                <td style="padding:8px; border:1px solid #ddd;">${escapeAttr(sku)}</td>
                <td style="padding:8px; border:1px solid #ddd;">${escapeAttr(category)}</td>
                <td style="padding:8px; border:1px solid #ddd;">
                  <button class="btn btn-sm btn-primary"
                          onclick="addAccessoryToNode('${escapeAttr(id)}','${escapeAttr(name)}','${escapeAttr(sku)}','${escapeAttr(category)}')"
                          style="padding:4px 12px; font-size:12px;">
                    Добавить
                  </button>
                </td>
              `;
              tbody.appendChild(row);
            });
          };

          const setCatalog = (items) => {
            window.__CLD_ACCESSORIES_CATALOG = Array.isArray(items) ? items : [];
            if (q && !q.__cldBound) {
              q.addEventListener('input', () => renderRows(window.__CLD_ACCESSORIES_CATALOG));
              q.__cldBound = true;
            }
            renderRows(window.__CLD_ACCESSORIES_CATALOG);
          };

          // 1) Загружаем из библиотеки комплектующих (вкладка "Комплектующие")
          const lib = window.__cldAccessoriesLib;
          if (lib && lib.items && typeof lib.items === 'object') {
            const flatItems = [];
            Object.entries(lib.items).forEach(([typeKey, typeItems]) => {
              if (Array.isArray(typeItems)) {
                typeItems.forEach(item => {
                  if (item && item.id) {
                    flatItems.push({
                      id: String(item.id),
                      name: String(item.name || ''),
                      sku: String(item.sku || item.code || ''),
                      article: String(item.sku || item.code || ''),
                      category: String(typeKey || item.category || ''),
                    });
                  }
                });
              }
            });
            if (flatItems.length) {
              setCatalog(flatItems);
              return;
            }
          }

          // 2) если уже загружали — переиспользуем
          if (Array.isArray(window.__CLD_ACCESSORIES_CATALOG) && window.__CLD_ACCESSORIES_CATALOG.length) {
            setCatalog(window.__CLD_ACCESSORIES_CATALOG);
            return;
          }

          // 2) пытаемся загрузить из локального json референса (без сети)
          fetch('/data/bootstrap/get_settings_ajax.json')
            .then(r => r.json())
            .then((data) => {
              // best-effort extraction: ищем узел с items (map или array)
              const out = [];
              const seen = new Set();
              const walk = (v, depth = 0) => {
                if (!v || depth > 6) return;
                if (Array.isArray(v)) {
                  v.forEach(x => walk(x, depth + 1));
                  return;
                }
                if (typeof v !== 'object') return;
                // candidates: { items: {id: {name, code/sku}} } или { accessories: {items:...} }
                if (v.items && (typeof v.items === 'object')) {
                  const vals = Array.isArray(v.items) ? v.items : Object.values(v.items);
                  for (const it of vals) {
                    if (!it || typeof it !== 'object') continue;
                    const id = it.id ?? it.ID ?? it.item_id ?? it.code ?? it.sku;
                    const name = it.name ?? it.Name ?? it.title;
                    const article = it.SKU ?? it.sku ?? it.code ?? it.article ?? it.vendor_code ?? '';
                    const category = it.category_name ?? it.category ?? it.group ?? '';
                    if (id == null || !name) continue;
                    const key = String(id);
                    if (seen.has(key)) continue;
                    seen.add(key);
                    out.push({ id: key, name: String(name), article: String(article || ''), category: String(category || '') });
                  }
                }
                for (const k of Object.keys(v)) walk(v[k], depth + 1);
              };
              walk(data, 0);

              if (out.length) setCatalog(out);
              else {
                // fallback mock
                setCatalog([
                  { id: '1', name: 'Ручка мебельная', article: 'HANDLE-001', category: 'Фурнитура' },
                  { id: '2', name: 'Петля накладная', article: 'HINGE-001', category: 'Фурнитура' },
                  { id: '3', name: 'Направляющая для ящика', article: 'SLIDE-001', category: 'Фурнитура' },
                  { id: '4', name: 'Подпятник', article: 'FOOT-001', category: 'Фурнитура' },
                  { id: '5', name: 'Полкодержатель', article: 'SHELF-001', category: 'Фурнитура' },
                ]);
              }
            })
            .catch(() => {
              setCatalog([
                { id: '1', name: 'Ручка мебельная', article: 'HANDLE-001', category: 'Фурнитура' },
                { id: '2', name: 'Петля накладная', article: 'HINGE-001', category: 'Фурнитура' },
                { id: '3', name: 'Направляющая для ящика', article: 'SLIDE-001', category: 'Фурнитура' },
                { id: '4', name: 'Подпятник', article: 'FOOT-001', category: 'Фурнитура' },
                { id: '5', name: 'Полкодержатель', article: 'SHELF-001', category: 'Фурнитура' },
              ]);
            });
          
          // Реальная загрузка из API (раскомментировать когда будет готов endpoint):
          /*
          fetch('/api/accessories/list')
            .then(response => response.json())
            .then(data => {
              tbody.innerHTML = '';
              if (data && data.length > 0) {
                data.forEach(acc => {
                  const row = document.createElement('tr');
                  row.innerHTML = `
                    <td>${acc.id || ''}</td>
                    <td>${acc.name || ''}</td>
                    <td>${acc.article || ''}</td>
                    <td>${acc.category || ''}</td>
                    <td>
                      <button class="btn btn-sm btn-primary" onclick="addAccessoryToNode(${acc.id}, '${acc.name || ''}')">
                        Добавить
                      </button>
                    </td>
                  `;
                  tbody.appendChild(row);
                });
              } else {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Комплектующие не найдены</td></tr>';
              }
            })
            .catch(error => {
              console.error('[CLD][accessories] Ошибка загрузки списка:', error);
              tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#d00;">Ошибка загрузки списка комплектующих</td></tr>';
            });
          */
        }
        
        // Функция добавления комплектующего к узлу
        window.addAccessoryToNode = function(accessoryId, accessoryName, accessoryArticle, accessoryCategory) {
          const target = window.__CLD_ACCESSORIES_TARGET || { kind: 'node' };

          // === target: template (вкладка "Шаблоны") ===
          if (target.kind === 'template') {
            const root = document.getElementById('constructor-root-module');
            const tid = String(target.templateId || '');
            if (!root || !root.nodeData || !Array.isArray(root.nodeData.templates) || !tid) return;
            const tpl = root.nodeData.templates.find(t => String(t.id) === tid);
            if (!tpl) return;
            tpl.accessories = Array.isArray(tpl.accessories) ? tpl.accessories : [];

            const id = String(accessoryId || '');
            const name = String(accessoryName || '');
            const sku = String(accessoryArticle || '');
            const category = String(accessoryCategory || '');
            if (!id || !name) return;

            const idx = tpl.accessories.findIndex(a => a && String(a.id) === id);
            if (idx >= 0) {
              tpl.accessories[idx].count = Number(tpl.accessories[idx].count || 1) + 1;
            } else {
              tpl.accessories.push({ id, name, sku, category, count: 1, c: 1 });
            }

            try { window.__CLD_TEMPLATES_RENDER && window.__CLD_TEMPLATES_RENDER(); } catch {}
            closeAccessoriesModal();
            return;
          }

          // === target: node (конструктор) ===
          if (!currentSelectedNode) {
            alert('Сначала выберите элемент');
            return;
          }
          if (!currentSelectedNode.nodeData.accessories) currentSelectedNode.nodeData.accessories = [];
          const id = String(accessoryId || '');
          let existingIndex = -1;
          for (let i = 0; i < currentSelectedNode.nodeData.accessories.length; i++) {
            if (String(currentSelectedNode.nodeData.accessories[i].id) === id) { existingIndex = i; break; }
          }

          if (existingIndex >= 0) {
            currentSelectedNode.nodeData.accessories[existingIndex].count = (currentSelectedNode.nodeData.accessories[existingIndex].count || 1) + 1;
          } else {
            currentSelectedNode.nodeData.accessories.push({
              id,
              name: String(accessoryName || ''),
              sku: String(accessoryArticle || ''),
              category: String(accessoryCategory || ''),
              count: 1,
              c: 1
            });
          }

          updateAccessoriesList();
          if (typeof saveDetailNodeData === 'function') saveDetailNodeData(currentSelectedNode);
          if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
          closeAccessoriesModal();
        };
        
        // Функция обновления списка комплектующих в панели свойств
        function updateAccessoriesList() {
          const listContainer = document.getElementById('catalog-constructor-property-accessories-list');
          if (!listContainer || !currentSelectedNode) return;
          
          const accessories = currentSelectedNode.nodeData.accessories || [];
          
          if (accessories.length === 0) {
            listContainer.innerHTML = '<div style="font-size:12px; color:#999; padding:8px 0;">Нет добавленных комплектующих</div>';
            return;
          }
          
          const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
          
          let html = '<div style="font-size:12px;">';
          accessories.forEach((acc, index) => {
            const count = Number(acc.count || 1);
            html += `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #f0f0f0;">
                <div style="flex:1; min-width:0;">
                  <div style="font-weight:500; margin-bottom:4px;">${esc(acc.name || 'Комплектующее #' + acc.id)}</div>
                  ${acc.sku ? `<div style="font-size:11px; color:#666;">Артикул: ${esc(acc.sku)}</div>` : ''}
                </div>
                <div style="display:flex; align-items:center; gap:8px; margin-left:12px;">
                  <label style="font-size:11px; color:#666; white-space:nowrap;">Кол-во:</label>
                  <input
                    type="number"
                    min="1"
                    class="form-control form-control-sm cld-acc-count"
                    data-acc-index="${index}"
                    value="${count}"
                    style="width:60px; padding:4px 6px; font-size:12px; text-align:center;"
                  />
                  <button 
                    class="btn btn-sm btn-outline-danger cld-acc-remove"
                    data-acc-index="${index}"
                    style="padding:2px 8px; font-size:11px; white-space:nowrap;"
                    title="Удалить"
                  >
                    ×
                  </button>
                </div>
              </div>
            `;
          });
          html += '</div>';
          listContainer.innerHTML = html;

          // Обработчики изменения количества
          listContainer.querySelectorAll('.cld-acc-count').forEach(input => {
            input.addEventListener('change', (e) => {
              const idx = Number(e.target?.getAttribute('data-acc-index'));
              if (!Number.isFinite(idx) || !accessories[idx]) return;
              const newCount = Math.max(1, Number(e.target.value) || 1);
              accessories[idx].count = newCount;
              if (typeof saveDetailNodeData === 'function') saveDetailNodeData(currentSelectedNode);
              if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
            });
          });

          // Обработчики удаления
          listContainer.querySelectorAll('.cld-acc-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
              const idx = Number(e.target?.getAttribute('data-acc-index'));
              if (!Number.isFinite(idx)) return;
              window.removeAccessoryFromNode(idx);
            });
          });
        }
        
        // Функция удаления комплектующего
        window.removeAccessoryFromNode = function(index) {
          if (!currentSelectedNode || !currentSelectedNode.nodeData.accessories) return;
          
          currentSelectedNode.nodeData.accessories.splice(index, 1);
          
          // Обновляем отображение
          updateAccessoriesList();
          
          // Сохраняем данные узла
          if (typeof saveDetailNodeData === 'function') {
            saveDetailNodeData(currentSelectedNode);
          }
          
          // Обновляем 3D превью
          if (typeof window.__ppPostModuleToIframe === 'function') {
            window.__ppPostModuleToIframe();
          }
        };
        
        // Функция для открытия модального окна добавления элемента
        function openAddElementModal(parentNode) {
          // Референс: логируем открытие модалки
          // Референс: проверяем существование модалки в DOM
          const modal = document.getElementById('constructor-add-element-modal');
          const typeSelect = document.getElementById('constructor-add-modal-type');
          const nameInput = document.getElementById('constructor-add-modal-name');
          if (!modal || !typeSelect || !nameInput) {
            console.error('[CLD][modal] ❌ Элементы модального окна не найдены', {
              modal: !!modal,
              typeSelect: !!typeSelect,
              nameInput: !!nameInput,
              document_ready: document.readyState,
            });
            return;
          }

          // ������ ������ ����� (��� � admin-constructor.js); � HTML ������ section/detail � �������������
          const typeNames = {
            section: 'Секция',
            fillable_section: 'Наполняемая секция',
            detail: 'Деталь',
            element: 'Элемент',
            model: 'Модель',
            facade: 'Фасад',
            countertop: 'Столешница',
            plinth: 'Цоколь',
            fitting: 'Присадка',
            cutout: 'Вырез',
            animator: 'Аниматор',
            size: 'Размер',
            mouse_target: 'Цель для мыши',
            information: 'Информация',
            attachment_point: 'Точка прилипания',
            module: 'Элемент',
            wall: 'Стенка',
          };
          const ADD_MODAL_TYPE_ORDER = [
            'section',
            'fillable_section',
            'detail',
            'wall',
            'plinth',
            'countertop',
            'facade',
            'fitting',
            'cutout',
            'module',
            'model',
            'element',
            'animator',
            'size',
            'mouse_target',
            'information',
            'attachment_point',
          ];
          typeSelect.innerHTML = '';
          ADD_MODAL_TYPE_ORDER.forEach((k) => {
            if (!typeNames[k]) return;
            const opt = document.createElement('option');
            opt.value = k;
            opt.textContent = typeNames[k];
            typeSelect.appendChild(opt);
          });
          try { window.__CLD_CATALOGS_DATA = {}; } catch (_) {}

          const MUST_PICK_DETAIL_LAYOUT = new Set([
            'detail',
            'plinth',
            'wall',
            'countertop',
            'cutout',
            'module',
            'size',
            'mouse_target',
            'information',
            'attachment_point',
          ]);
          
          // Контейнер для сетки деталей
          const detailGridContainer = document.getElementById('constructor-add-modal-detail-grid-container');
          const detailGrid = document.getElementById('constructor-add-modal-detail-grid');
          let selectedDetailType = null;

          // Блок выбора фасада
          const facadeContainer = document.getElementById('constructor-add-modal-facade-container');
          const facadeSelectedSpan = document.getElementById('constructor-add-modal-facade-selected');
          const facadeDoubleCheck = document.getElementById('constructor-add-modal-facade-double');
          let selectedFacadeId = null;
          let selectedFacadeName = '';
          let selectedFacadeItem = null;

          function setSelectedFacade(id, name, item) {
            selectedFacadeId = (id != null && id !== '') ? String(id) : null;
            selectedFacadeName = name || '';
            selectedFacadeItem = item && typeof item === 'object' ? item : null;
            if (facadeSelectedSpan) {
              facadeSelectedSpan.textContent = selectedFacadeId
                ? (selectedFacadeId + ': ' + selectedFacadeName)
                : '';
            }
          }

          // ========== 3D модели (cabinet_model — тот же каталог, что «Список 3D моделей») ==========
          const CLD_MODELS3D_CATALOG_KEY = 'cabinet_model';
          const models3dContainer = document.getElementById('constructor-add-modal-models3d-container');
          const models3dListEl = document.getElementById('constructor-add-modal-models3d-list');
          const models3dSearchInput = document.getElementById('constructor-add-modal-models3d-search');
          const models3dSearchBtn = document.getElementById('constructor-add-modal-models3d-search-btn');
          const models3dSelectedSpan = document.getElementById('constructor-add-modal-models3d-selected');
          let selectedModels3dId = null;
          let selectedModels3dName = '';
          let _models3dItemsCache = null;

          function setSelectedModels3d(id, name) {
            selectedModels3dId = id != null && id !== '' ? String(id) : null;
            selectedModels3dName = name || '';
            if (models3dSelectedSpan) {
              models3dSelectedSpan.textContent = selectedModels3dId
                ? (selectedModels3dName + '  (ID ' + selectedModels3dId + ')')
                : '';
            }
          }

          function normalizeModels3dApiItems(data) {
            let raw = Array.isArray(data) ? data : data && data.items != null ? data.items : [];
            if (!Array.isArray(raw)) raw = Object.values(raw || {});
            return (raw || [])
              .filter(Boolean)
              .map((it) => {
                const d = it.data || {};
                const p = it.params || d.params || d || {};
                return {
                  id: String(it.id ?? it.ID ?? ''),
                  name: String(it.name || d.name || p.name || 'Модель'),
                  code: String(it.code || d.code || p.code || it.article || d.article || ''),
                };
              })
              .filter((it) => it.id);
          }

          async function loadModels3dCatalogItems() {
            if (_models3dItemsCache && _models3dItemsCache.length) return _models3dItemsCache;
            try {
              const res = await fetch(
                '/api/catalog/items_get/' + encodeURIComponent(CLD_MODELS3D_CATALOG_KEY) + '?t=' + Date.now(),
                { cache: 'no-cache' }
              );
              if (!res.ok) throw new Error('HTTP ' + res.status);
              const data = await res.json();
              _models3dItemsCache = normalizeModels3dApiItems(data);
            } catch (e) {
              console.warn('[CLD][modal][models3d] load error', e);
              _models3dItemsCache = [];
            }
            return _models3dItemsCache;
          }

          function renderModels3dPickerList(filterText) {
            if (!models3dListEl) return;
            const fl = (filterText || '').toLowerCase().trim();
            const items = _models3dItemsCache || [];
            models3dListEl.innerHTML = '';
            if (!items.length) {
              models3dListEl.innerHTML =
                '<div style="padding:14px;color:#999;font-size:13px;">Нет 3D моделей. Добавьте их в «Каталог 3D моделей → Список».</div>';
              return;
            }
            const filtered = fl
              ? items.filter(
                  (it) =>
                    (it.name || '').toLowerCase().includes(fl) ||
                    (it.code || '').toLowerCase().includes(fl) ||
                    String(it.id).includes(fl)
                )
              : items;
            if (!filtered.length) {
              models3dListEl.innerHTML =
                '<div style="padding:14px;color:#999;font-size:13px;">Ничего не найдено</div>';
              return;
            }
            filtered.forEach((it) => {
              const row = document.createElement('div');
              const sel = selectedModels3dId === it.id;
              row.style.cssText =
                'display:flex;align-items:center;gap:8px;padding:6px 10px;border-bottom:1px solid #f0f0f0;font-size:13px;' +
                (sel ? 'background:#d4edda;' : '');
              const nm = document.createElement('span');
              nm.style.cssText = 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#333;';
              nm.textContent = it.name || '(без имени)';
              const cd = document.createElement('span');
              cd.style.cssText = 'flex:0 0 90px;font-size:11px;color:#999;text-align:right;';
              cd.textContent = it.code || '';
              const btn = document.createElement('button');
              btn.type = 'button';
              btn.style.cssText =
                'padding:2px 10px;font-size:11px;background:' +
                (sel ? '#28a745' : '#007bff') +
                ';color:#fff;border:none;border-radius:3px;cursor:pointer;flex-shrink:0;';
              btn.textContent = sel ? '\u2713' : 'Выбрать';
              btn.onclick = (e) => {
                e.stopPropagation();
                setSelectedModels3d(it.id, it.name);
                if (nameInput) {
                  const cur = nameInput.value.trim();
                  if (!cur || cur === typeNames[typeSelect.value] || cur === 'Модель') {
                    nameInput.value = it.name || 'Модель';
                  }
                }
                renderModels3dPickerList(models3dSearchInput ? models3dSearchInput.value : '');
              };
              row.appendChild(nm);
              row.appendChild(cd);
              row.appendChild(btn);
              models3dListEl.appendChild(row);
            });
          }

          async function initModels3dPicker() {
            setSelectedModels3d(null, '');
            if (models3dSearchInput) models3dSearchInput.value = '';
            _models3dItemsCache = null;
            if (models3dListEl) {
              models3dListEl.innerHTML =
                '<div style="padding:12px;color:#999;font-size:13px;">Загрузка списка 3D моделей...</div>';
            }
            await loadModels3dCatalogItems();
            renderModels3dPickerList('');
          }

          if (models3dSearchBtn) {
            models3dSearchBtn.onclick = () =>
              renderModels3dPickerList(models3dSearchInput ? models3dSearchInput.value : '');
          }
          if (models3dSearchInput) {
            models3dSearchInput.onkeydown = (e) => {
              if (e.key === 'Enter') renderModels3dPickerList(models3dSearchInput.value);
            };
          }

          // ========== Каталог элементов (дерево-аккордеон: папки → элементы) ==========
          const catalogContainer = document.getElementById('constructor-add-modal-catalog-container');
          const catalogTreeEl = document.getElementById('constructor-add-modal-catalog-tree');
          const catalogSearchInput = document.getElementById('constructor-add-modal-catalog-search');
          const catalogSearchBtn = document.getElementById('constructor-add-modal-catalog-search-btn');
          const catalogSelectedSpan = document.getElementById('constructor-add-modal-catalog-selected');
          const catalogParentSizeCheck = document.getElementById('constructor-add-modal-catalog-parent-size');
          if (catalogSearchInput) catalogSearchInput.value = '';
          let selectedCatalogItemId = null;
          let selectedCatalogItemName = '';
          let selectedCatalogType = '';
          const _expandedFolders = new Set();
          const _folderItemsCache = {};

          function setSelectedCatalogItem(id, name, catType) {
            selectedCatalogItemId = (id != null && id !== '') ? String(id) : null;
            selectedCatalogItemName = name || '';
            if (selectedCatalogItemId == null) {
              selectedCatalogType = '';
            } else if (catType !== undefined) {
              selectedCatalogType = catType || '';
            }
            if (catalogSelectedSpan) {
              catalogSelectedSpan.textContent = selectedCatalogItemId
                ? (selectedCatalogItemName + '  (ID ' + selectedCatalogItemId + ')')
                : '';
            }
          }

          async function loadCatalogKeys() {
            if (Array.isArray(window.__CLD_CATALOGS_KEYS) && window.__CLD_CATALOGS_KEYS.length) {
              return window.__CLD_CATALOGS_KEYS;
            }
            window.__CLD_CATALOGS_KEYS = [];
            try {
              const res = await fetch('/api/catalog/items_get/catalogs_keys?t=' + Date.now(), { cache: 'no-cache' });
              if (res.ok) {
                const data = await res.json();
                const arr = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
                window.__CLD_CATALOGS_KEYS = arr.map(k => ({
                  key: String(k.key || ''),
                  name: String(k.name || k.key || ''),
                })).filter(k => k.key);
              }
            } catch (e) {
              console.warn('[CLD][catalog] loadCatalogKeys error', e);
            }
            return window.__CLD_CATALOGS_KEYS;
          }

          async function loadItemsForType(catKey) {
            if (_folderItemsCache[catKey]) return _folderItemsCache[catKey];
            window.__CLD_CATALOGS_DATA = window.__CLD_CATALOGS_DATA || {};
            const cached = window.__CLD_CATALOGS_DATA[catKey];
            if (cached && cached.items && Object.keys(cached.items).length) {
              _folderItemsCache[catKey] = Object.values(cached.items);
              return _folderItemsCache[catKey];
            }
            try {
              const res = await fetch('/api/catalog/items_get/' + encodeURIComponent(catKey) + '?t=' + Date.now(), { cache: 'no-cache' });
              if (res.ok) {
                const apiData = await res.json();
                const items = Array.isArray(apiData?.items) ? apiData.items : (Array.isArray(apiData) ? apiData : []);
                const mapped = items.filter(Boolean).map(it => {
                  const d = it.data || {};
                  return {
                    id: String(it.id ?? ''),
                    name: it.name || d.name || it.params?.name || ('Элемент ' + it.id),
                    code: it.code || d.code || '',
                    icon: d.icon || '',
                    element_type: catKey,
                    params: it.params || d.params || d,
                  };
                }).filter(it => it.id);
                const map = {};
                mapped.forEach(it => { map[it.id] = it; });
                window.__CLD_CATALOGS_DATA[catKey] = { items: map };
                _folderItemsCache[catKey] = mapped;
                return mapped;
              }
            } catch (e) {
              console.warn('[CLD][catalog] loadItemsForType ' + catKey + ' error', e);
            }
            return [];
          }

          function buildItemRow(it, catKey) {
            const row = document.createElement('div');
            const isSelected = selectedCatalogItemId === String(it.id) && selectedCatalogType === catKey;
            row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:5px 10px 5px 32px;cursor:pointer;border-bottom:1px solid #f5f5f5;transition:background 0.12s;font-size:13px;'
              + (isSelected ? 'background:#d4edda;' : '');
            row.onmouseenter = () => { if (!isSelected) row.style.background = '#f0f4f8'; };
            row.onmouseleave = () => { if (!isSelected) row.style.background = ''; };

            const ico = document.createElement('span');
            ico.textContent = '\u2022';
            ico.style.cssText = 'flex:0 0 12px;font-size:14px;color:#999;';
            const nm = document.createElement('span');
            nm.style.cssText = 'flex:1;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
            nm.textContent = it.name || '(без имени)';
            const code = document.createElement('span');
            code.style.cssText = 'flex:0 0 70px;font-size:11px;color:#999;text-align:right;';
            code.textContent = it.code || '';
            const btn = document.createElement('button');
            btn.style.cssText = 'padding:2px 10px;font-size:11px;background:#007bff;color:#fff;border:none;border-radius:3px;flex-shrink:0;cursor:pointer;';
            btn.textContent = isSelected ? '\u2713' : 'Выбрать';
            if (isSelected) btn.style.background = '#28a745';

            btn.onclick = (e) => {
              e.stopPropagation();
              setSelectedCatalogItem(it.id, it.name, catKey);
              if (nameInput) {
                const cur = nameInput.value.trim();
                if (!cur || cur === typeNames[typeSelect.value] || cur === typeNames['module']) {
                  nameInput.value = it.name || 'Элемент';
                }
              }
              renderCatalogTree(catalogSearchInput ? catalogSearchInput.value : '');
            };
            row.onclick = btn.onclick;

            row.appendChild(ico);
            row.appendChild(nm);
            row.appendChild(code);
            row.appendChild(btn);
            return row;
          }

          function buildFolderNode(folder, filterText) {
            const key = folder.key;
            const isOpen = _expandedFolders.has(key);
            const wrapper = document.createElement('div');

            const header = document.createElement('div');
            header.style.cssText = 'display:flex;align-items:center;gap:6px;padding:8px 10px;cursor:pointer;background:#f8f9fa;border-bottom:1px solid #e5e7eb;user-select:none;transition:background 0.12s;';
            header.onmouseenter = () => { header.style.background = '#eef1f5'; };
            header.onmouseleave = () => { header.style.background = '#f8f9fa'; };

            const arrow = document.createElement('span');
            arrow.textContent = isOpen ? '\u25BE' : '\u25B8';
            arrow.style.cssText = 'flex:0 0 14px;font-size:14px;color:#666;transition:transform 0.15s;';
            const label = document.createElement('span');
            label.style.cssText = 'flex:1;font-size:13px;font-weight:600;color:#333;';
            label.textContent = folder.name;
            const badge = document.createElement('span');
            badge.style.cssText = 'font-size:11px;color:#999;margin-left:4px;';

            header.appendChild(arrow);
            header.appendChild(label);
            header.appendChild(badge);

            const body = document.createElement('div');
            body.style.display = isOpen ? 'block' : 'none';

            header.onclick = async () => {
              if (_expandedFolders.has(key)) {
                _expandedFolders.delete(key);
                arrow.textContent = '\u25B8';
                body.style.display = 'none';
                return;
              }
              _expandedFolders.add(key);
              arrow.textContent = '\u25BE';
              body.style.display = 'block';
              body.innerHTML = '<div style="padding:8px 12px 8px 32px;color:#999;font-size:12px;">Загрузка...</div>';
              const items = await loadItemsForType(key);
              body.innerHTML = '';
              const fl = (filterText || '').toLowerCase().trim();
              const filtered = fl
                ? items.filter(it => (it.name || '').toLowerCase().includes(fl) || (it.code || '').toLowerCase().includes(fl))
                : items;
              badge.textContent = '(' + items.length + ')';
              if (filtered.length === 0) {
                body.innerHTML = '<div style="padding:8px 12px 8px 32px;color:#bbb;font-size:12px;">' + (items.length ? 'Ничего не найдено' : 'Нет элементов') + '</div>';
                return;
              }
              filtered.forEach(it => body.appendChild(buildItemRow(it, key)));
            };

            if (isOpen) {
              const items = _folderItemsCache[key] || [];
              const fl = (filterText || '').toLowerCase().trim();
              const filtered = fl
                ? items.filter(it => (it.name || '').toLowerCase().includes(fl) || (it.code || '').toLowerCase().includes(fl))
                : items;
              badge.textContent = items.length ? '(' + items.length + ')' : '';
              if (filtered.length === 0) {
                body.innerHTML = '<div style="padding:8px 12px 8px 32px;color:#bbb;font-size:12px;">' + (items.length ? 'Ничего не найдено' : 'Нет элементов') + '</div>';
              } else {
                filtered.forEach(it => body.appendChild(buildItemRow(it, key)));
              }
            }

            wrapper.appendChild(header);
            wrapper.appendChild(body);
            return wrapper;
          }

          async function renderCatalogTree(filterText) {
            if (!catalogTreeEl) return;
            catalogTreeEl.innerHTML = '<div style="padding:12px;color:#999;font-size:13px;">Загрузка типов...</div>';
            const keys = await loadCatalogKeys();
            catalogTreeEl.innerHTML = '';
            if (!keys.length) {
              catalogTreeEl.innerHTML = '<div style="padding:14px;color:#999;font-size:13px;">Нет типов элементов. Создайте их в разделе «Каталог элементов \u2192 Типы элементов».</div>';
              return;
            }

            const fl = (filterText || '').toLowerCase().trim();

            if (fl) {
              let anyFound = false;
              for (let i = 0; i < keys.length; i++) {
                const folder = keys[i];
                const items = await loadItemsForType(folder.key);
                const matched = items.filter(it =>
                  (it.name || '').toLowerCase().includes(fl) || (it.code || '').toLowerCase().includes(fl)
                );
                if (!matched.length) continue;
                anyFound = true;
                _expandedFolders.add(folder.key);
                catalogTreeEl.appendChild(buildFolderNode(folder, fl));
              }
              if (!anyFound) {
                catalogTreeEl.innerHTML = '<div style="padding:14px;color:#999;font-size:13px;">Ничего не найдено</div>';
              }
            } else {
              keys.forEach(folder => {
                catalogTreeEl.appendChild(buildFolderNode(folder, ''));
              });
            }
          }

          async function initCatalogTree() {
            _expandedFolders.clear();
            setSelectedCatalogItem(null, '');
            if (catalogSearchInput) catalogSearchInput.value = '';
            await renderCatalogTree('');
          }

          if (catalogSearchBtn) {
            catalogSearchBtn.onclick = () => renderCatalogTree(catalogSearchInput ? catalogSearchInput.value : '');
          }
          if (catalogSearchInput) {
            catalogSearchInput.onkeydown = (e) => { if (e.key === 'Enter') renderCatalogTree(catalogSearchInput.value); };
          }
          // ========== /Каталог ==========
          
          // Функция для отрисовки превью детали на canvas
          function drawDetailPreview(canvas, detailType) {
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            const size = canvas.width;
            const padding = 10;
            const boxSize = size - padding * 2;
            
            // Очистка
            ctx.fillStyle = '#f9f9f9';
            ctx.fillRect(0, 0, size, size);
            
            // Рисуем рамку куба (wireframe) - светло-серая
            ctx.strokeStyle = '#d0d0d0';
            ctx.lineWidth = 1.5;
            
            // Передняя грань (видимая)
            ctx.beginPath();
            ctx.moveTo(padding, padding);
            ctx.lineTo(padding + boxSize, padding);
            ctx.lineTo(padding + boxSize, padding + boxSize);
            ctx.lineTo(padding, padding + boxSize);
            ctx.closePath();
            ctx.stroke();
            
            // Задняя грань (смещена для перспективы)
            const offset = boxSize * 0.25;
            ctx.beginPath();
            ctx.moveTo(padding + offset, padding + offset);
            ctx.lineTo(padding + boxSize + offset, padding + offset);
            ctx.lineTo(padding + boxSize + offset, padding + boxSize + offset);
            ctx.lineTo(padding + offset, padding + boxSize + offset);
            ctx.closePath();
            ctx.stroke();
            
            // Соединяющие линии (ребра куба)
            ctx.beginPath();
            ctx.moveTo(padding, padding);
            ctx.lineTo(padding + offset, padding + offset);
            ctx.moveTo(padding + boxSize, padding);
            ctx.lineTo(padding + boxSize + offset, padding + offset);
            ctx.moveTo(padding + boxSize, padding + boxSize);
            ctx.lineTo(padding + boxSize + offset, padding + boxSize + offset);
            ctx.moveTo(padding, padding + boxSize);
            ctx.lineTo(padding + offset, padding + boxSize + offset);
            ctx.stroke();
            
            // Рисуем деталь (золотистая плоскость)
            ctx.fillStyle = '#d4af37';
            ctx.strokeStyle = '#b8941f';
            ctx.lineWidth = 1;
            
            let detailX = padding;
            let detailY = padding;
            let detailWidth = boxSize;
            let detailHeight = boxSize;
            
            // Позиционирование и размеры детали в зависимости от типа
            const position = detailType.position;
            if (position === 'back-front' || position === 'vertical-left') {
              detailX = padding;
              detailY = padding;
              detailWidth = boxSize * 0.15;
              detailHeight = boxSize;
            } else if (position === 'vertical-right') {
              detailX = padding + boxSize - boxSize * 0.15;
              detailY = padding;
              detailWidth = boxSize * 0.15;
              detailHeight = boxSize;
            } else if (position === 'horizontal-top') {
              detailX = padding;
              detailY = padding;
              detailWidth = boxSize;
              detailHeight = boxSize * 0.15;
            } else if (position === 'horizontal-bottom') {
              detailX = padding;
              detailY = padding + boxSize - boxSize * 0.15;
              detailWidth = boxSize;
              detailHeight = boxSize * 0.15;
            } else if (position === 'vertical-middle') {
              detailX = padding + (boxSize - boxSize * 0.15) / 2;
              detailY = padding;
              detailWidth = boxSize * 0.15;
              detailHeight = boxSize;
            } else if (position === 'horizontal-middle') {
              detailX = padding;
              detailY = padding + (boxSize - boxSize * 0.15) / 2;
              detailWidth = boxSize;
              detailHeight = boxSize * 0.15;
            } else if (position === 'front-middle') {
              detailX = padding + boxSize - boxSize * 0.15;
              detailY = padding + (boxSize - boxSize * 0.3) / 2;
              detailWidth = boxSize * 0.15;
              detailHeight = boxSize * 0.3;
            } else if (position === 'front-front') {
              detailX = padding + boxSize - boxSize * 0.15;
              detailY = padding;
              detailWidth = boxSize * 0.15;
              detailHeight = boxSize;
            }
            
            // Рисуем деталь
            ctx.fillRect(detailX, detailY, detailWidth, detailHeight);
            ctx.strokeRect(detailX, detailY, detailWidth, detailHeight);
          }
          
          // Типы деталей (как в constructor.ts)
          const detailTypes = [
            // NOTE: orientation здесь — для UI, в export мы нормализуем в {'v','h','f'}
            { id: 'back_front', name: 'Задняя фронтальная', orientation: 'front', position: 'back-front' },
            { id: 'vertical_left', name: 'Вертикальная левая', orientation: 'vertical', position: 'vertical-left' },
            { id: 'vertical_right', name: 'Вертикальная правая', orientation: 'vertical', position: 'vertical-right' },
            { id: 'vertical_middle', name: 'Вертикальная средняя', orientation: 'vertical', position: 'vertical-middle' },
            { id: 'horizontal_top', name: 'Горизонтальная верхняя', orientation: 'horizontal', position: 'horizontal-top' },
            { id: 'horizontal_bottom', name: 'Горизонтальная нижняя', orientation: 'horizontal', position: 'horizontal-bottom' },
            { id: 'horizontal_middle', name: 'Горизонтальная средняя', orientation: 'horizontal', position: 'horizontal-middle' },
            { id: 'front_middle', name: 'Фронтальная средняя', orientation: 'front', position: 'front-middle' },
            { id: 'front_front', name: 'Фронтальная передняя', orientation: 'front', position: 'front-front' }
          ];
          
          // Функция для создания элемента превью детали
          function createDetailPreviewItem(detailType) {
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.flexDirection = 'column';
            item.style.alignItems = 'center';
            item.style.gap = '6px';
            item.style.cursor = 'pointer';
            
            const preview = document.createElement('div');
            preview.className = 'detail-type-preview-item';
            preview.dataset.detailType = detailType.id;
            preview.style.width = '100px';
            preview.style.height = '100px';
            preview.style.border = '2px solid #e0e0e0';
            preview.style.borderRadius = '6px';
            preview.style.padding = '4px';
            preview.style.background = '#fff';
            preview.style.transition = 'all 0.2s';
            preview.title = detailType.name;
            
            preview.onmouseenter = function() {
              this.style.borderColor = '#C5FF5D';
              this.style.transform = 'scale(1.05)';
            };
            preview.onmouseleave = function() {
              if (!this.classList.contains('selected')) {
                this.style.borderColor = '#e0e0e0';
                this.style.transform = 'scale(1)';
              }
            };
            
            // Создаем canvas для превью
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            drawDetailPreview(canvas, detailType);
            preview.appendChild(canvas);
            
            preview.onclick = function() {
              // Снимаем выделение с других
              document.querySelectorAll('.detail-type-preview-item').forEach(p => {
                p.classList.remove('selected');
                p.style.borderColor = '#e0e0e0';
                p.style.background = '#fff';
              });
              // Выделяем текущий
              this.classList.add('selected');
              this.style.borderColor = '#C5FF5D';
              this.style.background = '#f0f9ff';
              selectedDetailType = detailType.id;
            };
            
            const label = document.createElement('div');
            label.textContent = detailType.name;
            label.style.fontSize = '11px';
            label.style.color = '#666';
            label.style.textAlign = 'center';
            label.style.maxWidth = '110px';
            label.style.overflow = 'hidden';
            label.style.textOverflow = 'ellipsis';
            label.style.whiteSpace = 'nowrap';
            
            item.appendChild(preview);
            item.appendChild(label);
            
            return item;
          }
          
          // Функция для обновления сетки деталей
          const fittingContainer = document.getElementById('constructor-add-modal-fitting-container');
          const fittingListEl = document.getElementById('constructor-add-modal-fitting-list');
          const fittingSelectedSpan = document.getElementById('constructor-add-modal-fitting-selected');
          let selectedFittingId = null;
          let selectedFittingName = '';

          function setSelectedFitting(id, name) {
            selectedFittingId = id != null && id !== '' ? String(id) : null;
            selectedFittingName = name || '';
            if (fittingSelectedSpan) {
              fittingSelectedSpan.textContent = selectedFittingId
                ? (selectedFittingName + '  (ID ' + selectedFittingId + ')')
                : '';
            }
          }

          function initFittingPicker() {
            if (!fittingListEl) return;
            fittingListEl.innerHTML = '';
            setSelectedFitting(null, '');
            const drills = typeof readDrills === 'function' ? readDrills() : [];
            if (!drills.length) {
              fittingListEl.innerHTML = '<div style="padding:12px;color:#999;font-size:13px;">Шаблонов присадки пока нет. Создайте в разделе «Шаблоны присадки».</div>';
              return;
            }
            drills.forEach(function(tpl) {
              const row = document.createElement('div');
              row.style.cssText = 'padding:8px 12px;cursor:pointer;border-bottom:1px solid #f0f0f0;font-size:13px;display:flex;align-items:center;gap:8px;';
              row.onmouseover = function() { row.style.background = '#f7f7f7'; };
              row.onmouseout = function() { if (selectedFittingId !== String(tpl.id)) row.style.background = ''; };
              const idBadge = document.createElement('span');
              idBadge.textContent = '#' + tpl.id;
              idBadge.style.cssText = 'display:inline-block;min-width:32px;padding:2px 6px;border-radius:3px;background:#e5e7eb;font-size:11px;color:#555;text-align:center;';
              const nameSpan = document.createElement('span');
              nameSpan.textContent = String(tpl.name || 'Шаблон ' + tpl.id);
              nameSpan.style.flex = '1';
              const holesSpan = document.createElement('span');
              holesSpan.style.cssText = 'font-size:11px;color:#888;';
              const holeCount = Array.isArray(tpl.holes) ? tpl.holes.length : 0;
              holesSpan.textContent = holeCount + ' отв.';
              row.appendChild(idBadge);
              row.appendChild(nameSpan);
              row.appendChild(holesSpan);
              row.onclick = function() {
                fittingListEl.querySelectorAll('div[data-fitting-row]').forEach(function(r) {
                  r.style.background = '';
                  r.style.fontWeight = '';
                });
                row.style.background = '#e8f5e9';
                row.style.fontWeight = '600';
                setSelectedFitting(tpl.id, tpl.name || 'Шаблон ' + tpl.id);
              };
              row.setAttribute('data-fitting-row', '1');
              fittingListEl.appendChild(row);
            });
          }

          function updateDetailGrid() {
            if (!detailGrid) return;
            
            detailGrid.innerHTML = '';

            const isFacade = typeSelect.value === 'facade';
            const isModule = typeSelect.value === 'module';
            const isElementLink = typeSelect.value === 'element';
            const isModel = typeSelect.value === 'model';
            const isFitting = typeSelect.value === 'fitting';
            const showDetailGrid =
              !isModule && !isElementLink && !isModel && !isFitting && (isFacade || MUST_PICK_DETAIL_LAYOUT.has(typeSelect.value));

            // показать/скрыть блок "Фасад"
            if (facadeContainer) {
              facadeContainer.style.display = isFacade ? 'block' : 'none';
              if (!isFacade) {
                setSelectedFacade(null, '');
                if (facadeDoubleCheck) facadeDoubleCheck.checked = false;
              }
            }

            // показать/скрыть блок каталога модулей
            if (catalogContainer) {
              catalogContainer.style.display = (isModule || isElementLink) ? 'block' : 'none';
              if (isModule || isElementLink) {
                initCatalogTree();
              } else {
                setSelectedCatalogItem(null, '');
              }
            }

            if (models3dContainer) {
              models3dContainer.style.display = isModel ? 'block' : 'none';
              if (isModel) {
                initModels3dPicker();
              } else {
                setSelectedModels3d(null, '');
                _models3dItemsCache = null;
              }
            }

            if (fittingContainer) {
              fittingContainer.style.display = isFitting ? 'block' : 'none';
              if (isFitting) {
                initFittingPicker();
              } else {
                setSelectedFitting(null, '');
              }
            }
            
            if (showDetailGrid) {
              if (detailGridContainer) {
                detailGridContainer.style.display = 'block';
              }
              detailTypes.forEach(detailType => {
                detailGrid.appendChild(createDetailPreviewItem(detailType));
              });
              selectedDetailType = null;
            } else {
              if (detailGridContainer) {
                detailGridContainer.style.display = 'none';
              }
              selectedDetailType = null;
            }
          }
          

          
          // Вешаем обработчик на ссылку "Выбрать" для фасада
          (function() {
            const facadeSelectLink = document.getElementById('constructor-add-modal-facade-select-link');
            if (facadeSelectLink && !facadeSelectLink.__cldHandlerAttached) {
              facadeSelectLink.__cldHandlerAttached = true;
              facadeSelectLink.addEventListener('click', function(e) {
                e.preventDefault();
                if (typeof window.openFacadePickerModal === 'function') {
                  window.openFacadePickerModal(function(id, name, item) {
                    setSelectedFacade(id, name, item);
                  });
                } else {
                  alert('Модалка выбора фасада пока недоступна (openFacadePickerModal не найдена)');
                }
              });
            }
          })();

          // Обновляем название при изменении типа
          typeSelect.onchange = function() {
            nameInput.value = typeNames[typeSelect.value] || 'Новый элемент';
            updateDetailGrid();
          };
          
          // Устанавливаем начальное значение
          nameInput.value = typeNames[typeSelect.value] || 'Новый элемент';
          
          // Инициализируем сетку деталей
          updateDetailGrid();
          
          
          // ВАЖНО: Если модалка находится внутри скрытого контейнера, перемещаем её в body
          // Проверяем не только display, но и computed style родителя
          let needsMove = false;
          if (modal.parentElement) {
            const parentComputed = window.getComputedStyle(modal.parentElement);
            const parentDisplay = modal.parentElement.style.display || parentComputed.display;
            const parentVisibility = modal.parentElement.style.visibility || parentComputed.visibility;
            
            if (parentDisplay === 'none' || parentVisibility === 'hidden' || modal.offsetParent === null) {
              needsMove = true;
            }
          }
          
          if (needsMove) {
            document.body.appendChild(modal);
          }
          
          // Показываем модальное окно
          modal.style.display = 'flex';
          
          // Принудительно устанавливаем z-index для гарантии видимости
          if (!modal.style.zIndex || modal.style.zIndex === '') {
            modal.style.zIndex = '10001';
          }
          
          // Обработчики закрытия модального окна
          const closeBtn = document.getElementById('constructor-add-modal-close');
          const cancelBtn = document.getElementById('constructor-add-modal-cancel');
          const addBtn = document.getElementById('constructor-add-modal-add');
          
          function closeModal() {
            if (modal) {
            modal.style.display = 'none';
            // Сбрасываем выбор детали и фасада
            selectedDetailType = null;
            setSelectedFacade(null, '');
            setSelectedCatalogItem(null, '', '');
            setSelectedModels3d(null, '');
            setSelectedFitting(null, '');
            _models3dItemsCache = null;
              if (detailGrid) {
                document.querySelectorAll('.detail-type-preview-item.selected').forEach(item => {
                  item.classList.remove('selected');
                  item.style.borderColor = '#e0e0e0';
                  item.style.background = '#fff';
                });
              }
            }
          }
          
          // Удаляем старые обработчики и добавляем новые
          if (closeBtn) closeBtn.onclick = closeModal;
          if (cancelBtn) cancelBtn.onclick = closeModal;
          
          // Обработчик добавления элемента
          if (addBtn) {
          addBtn.onclick = async function() {
              try {
            const selectedType = typeSelect.value;
            const elementName = nameInput.value.trim() || (typeNames[selectedType] || 'Новый элемент');
            
            // Для модулей требуется выбрать элемент из каталога
            if ((selectedType === 'module' || selectedType === 'element') && !selectedCatalogItemId) {
              alert('Пожалуйста, выберите элемент из каталога');
              return;
            }
            if (selectedType === 'model' && !selectedModels3dId) {
              alert('Пожалуйста, выберите 3D модель из списка');
              return;
            }
            if (selectedType === 'fitting' && !selectedFittingId) {
              alert('Пожалуйста, выберите шаблон присадки из списка');
              return;
            }
            if (selectedType !== 'module' && MUST_PICK_DETAIL_LAYOUT.has(selectedType) && !selectedDetailType) {
              alert('Пожалуйста, выберите тип детали из сетки ниже');
              return;
            }
            
            // Маппинг типов из модального окна в типы узлов дерева
            const typeMapping = {
              'section': 'section',
              'fillable_section': 'section',
              'detail': 'detail',
              // Референсный "Элемент" (link) — каталожный шаблон, а не detail-layout.
              // Создаем временный module-узел; ниже ветка selectedType==='element'
              // заменяет его на развёрнутое дерево элемента.
              'element': 'module',
              'model': 'detail',
              'facade': 'detail',
              'countertop': 'detail',
              'plinth': 'detail',
              'fitting': 'detail',
              'cutout': 'detail',
              'animator': 'detail',
              'size': 'detail',
              'mouse_target': 'detail',
              'information': 'detail',
              'attachment_point': 'detail',
              'module': 'module',
              'wall': 'detail',
            };
            
            const nodeType = typeMapping[selectedType] || 'section';
            
            // ⭐ ЛОГИ ПО ДЕТАЛЯМ: Детальная информация о создании детали
            if (selectedType === 'detail' && selectedDetailType) {
              const detailTypeInfo = detailTypes.find(dt => dt.id === selectedDetailType);
              const parentType = parentNode?.nodeData?.type || parentNode?.getAttribute('data-node-type') || '?';
              const parentName = parentNode?.nodeData?.name || parentNode?.querySelector('.tree-node-name')?.textContent || '?';
            }
            
            // Создаем новый узел
            const newNode = createConstructorTreeNode(nodeType, parentNode);
            let pendingSecondFacadeNode = null;
                if (!newNode) {
                  console.error('[CLD][modal] ❌ Не удалось создать узел');
                  alert('Ошибка: не удалось создать элемент');
                  return;
                }
                
            newNode.nodeData.name = elementName;
            newNode.setAttribute('data-node-name', elementName);
            const mappedOriginalType = selectedType === 'fitting' ? 'furniture' : selectedType;
            newNode.nodeData.originalType = mappedOriginalType;
            if (mappedOriginalType === 'model' || mappedOriginalType === 'module' || mappedOriginalType === 'element' || mappedOriginalType === 'furniture' || mappedOriginalType === 'facade' || mappedOriginalType === 'animator') {
              newNode.setAttribute('data-original-type', mappedOriginalType);
            }

            if (selectedType === 'fitting') {
              newNode.nodeData.spec = newNode.nodeData.spec || {};
              newNode.nodeData.spec.group = 'furniture';
              if (selectedFittingId) {
                newNode.nodeData.spec.id = String(selectedFittingId);
                newNode.nodeData.modelId = String(selectedFittingId);
              }
              newNode.nodeData.size = newNode.nodeData.size || { x: 's:x', y: 's:y', z: 's:z' };
              newNode.nodeData.position = newNode.nodeData.position || { x: 0, y: 0, z: 0 };
              newNode.nodeData.anchor = newNode.nodeData.anchor || { x: -1, y: -1, z: -1 };
              newNode.nodeData.rotation = newNode.nodeData.rotation || { x: 0, y: 0, z: 0 };
              // �� ������ ���������� pos/rot ��� ��������: ���������� ������ ����� �������� ������������.
            }

            if (selectedType === 'animator') {
              newNode.nodeData.spec = {
                is_open: 0,
                props: { deg: 0 },
                source: { id: '' },
                fn: 'slide',
                group: '',
              };
              newNode.nodeData.size = newNode.nodeData.size || { x: 's:x', y: 's:y', z: 's:z' };
              newNode.nodeData.position = newNode.nodeData.position || { x: 0, y: 0, z: 0 };
              newNode.nodeData.anchor = newNode.nodeData.anchor || { x: -1, y: -1, z: -1 };
              newNode.nodeData.rotation = newNode.nodeData.rotation || { x: 0, y: 0, z: 0 };
              newNode.nodeData.c_rot = newNode.nodeData.c_rot || { x: 0, y: 0, z: 0 };
            }

            if (selectedType === 'model') {
              newNode.nodeData.modelId = String(selectedModels3dId);
              newNode.nodeData.modelKey = String(selectedModels3dName || elementName);
              newNode.nodeData.position = newNode.nodeData.position || { x: 0, y: 0, z: 0 };
              newNode.nodeData.anchor = newNode.nodeData.anchor || { x: -1, y: -1, z: -1 };
              // Реф. part14 add_child: все новые узлы получают s:x/y/z, не 100³
              newNode.nodeData.size = newNode.nodeData.size || { x: 's:x', y: 's:y', z: 's:z' };
              newNode.nodeData.rotation = newNode.nodeData.rotation || { x: 0, y: 0, z: 0 };
              newNode.nodeData.c_rot = newNode.nodeData.c_rot || { x: 0, y: 0, z: 0 };
            }

            // Если создаём фасад — накладной: внутренняя грань в плоскости передней грани секции (см. ClodisBuilder.buildFacade + applyTransform)
            if (selectedType === 'facade') {
              // НЕ ставим layout_role='facades' на родительскую секцию автоматически:
              // если это корневая секция шкафа, layout_role='facades' заставит
              // движок комнаты (layoutZones) ресайзить её как корпус, сломав позицию фасада.
              // Глубина корпуса (facadeThicknessOffset) работает через сканирование children.
              // Если нужна отдельная фасадная зона — пользователь создаёт секцию с layout_role вручную.

              const applyFacadePreset = (node, side) => {
                if (!node || !node.nodeData) return;
                if (!node.nodeData.material_group) node.nodeData.material_group = 'g2';
              if (selectedFacadeId != null) {
                  node.nodeData.modelId = String(selectedFacadeId);
                  if (selectedFacadeName) node.nodeData.modelKey = selectedFacadeName;
                }
                if (!node.nodeData.spec) node.nodeData.spec = {};
                if (selectedFacadeId != null) node.nodeData.spec.id = String(selectedFacadeId);
                node.nodeData.spec.element_type = 'facades';
                node.nodeData.spec.live_catalog = true;
                node.nodeData.spec.orientation = 'f';
                node.nodeData.spec.direction = node.nodeData.spec.direction || '-z';
                if (node.nodeData.spec.thickness_mm == null) node.nodeData.spec.thickness_mm = 16;

                // �����: ��������� ��������� �� ������ (������� facades) � spec,
                // ����� 3D ��� ��������� ����� ��� �������������� ��������.
                try {
                  const h = selectedFacadeItem?.handle;
                  const ho = selectedFacadeItem?.handle_offset ?? selectedFacadeItem?.handleOffset;
                  if (h != null) node.nodeData.spec.handle = Number(h) ? 1 : 0;
                  if (ho != null && String(ho).trim() !== '') node.nodeData.spec.handle_offset = Number(ho) || 0;
                } catch (_) {}

                // Fallback-заготовка: ставим size/position/anchor ТОЛЬКО если у узла
                // ещё нет своих (каталожный шаблон имеет приоритет).
                const hasOwnSize = node.nodeData.size && (node.nodeData.size.x || node.nodeData.size.y);
                const hasOwnPos = node.nodeData.position && (node.nodeData.position.x || node.nodeData.position.y || node.nodeData.position.z);
                if (!hasOwnSize) {
                  // Без искусственного зазора по X: иначе фасад визуально "уплывает" от секции.
                  node.nodeData.size = { x: 's:x', y: 's:y - 1.5', z: 16 };
                }
                if (!hasOwnPos) {
                  node.nodeData.position = { x: 0, y: 0, z: '@section.depth' };
                }
                if (!node.nodeData.anchor) {
                  node.nodeData.anchor = { x: -1, y: -1, z: -1 };
                }
                if (!node.nodeData.c_rot) {
                  node.nodeData.c_rot = { x: 0, y: 0, z: 0 };
                }

                // Двухдверный пресет: делим фасад на две створки.
                // Двухдверный пресет перезаписывает size/pos — тут осознанно.
                if (side === 'left') {
                  node.nodeData.name = 'Фасад левый';
                  node.setAttribute('data-node-name', 'Фасад левый');
                  if (!hasOwnSize) node.nodeData.size = { x: 's:x / 2', y: 's:y - 1.5', z: 16 };
                  if (!hasOwnPos) node.nodeData.position = { x: 0, y: 0, z: '@section.depth' };
                  node.nodeData.anchor = { x: -1, y: -1, z: -1 };
                  node.nodeData.c_rot = { x: 0, y: 'v:door_open_left', z: 0 };
                  node.nodeData.spec.opening = 'left';
                } else if (side === 'right') {
                  node.nodeData.name = 'Фасад правый';
                  node.setAttribute('data-node-name', 'Фасад правый');
                  if (!hasOwnSize) node.nodeData.size = { x: 's:x / 2', y: 's:y - 1.5', z: 16 };
                  if (!hasOwnPos) node.nodeData.position = { x: 's:x', y: 0, z: '@section.depth' };
                  node.nodeData.anchor = { x: 1, y: -1, z: -1 };
                  node.nodeData.c_rot = { x: 0, y: '-v:door_open_right', z: 0 };
                  node.nodeData.spec.opening = 'right';
                }

                // Автодобавление петель отключено: пользователь управляет петлями через "Элемент".
              };

              const isDoubleFacade = !!(facadeDoubleCheck && facadeDoubleCheck.checked);
              if (isDoubleFacade) {
                applyFacadePreset(newNode, 'left');
                const rightDoorNode = createConstructorTreeNode('detail', parentNode);
                if (rightDoorNode) {
                  rightDoorNode.nodeData.originalType = 'facade';
                  rightDoorNode.setAttribute('data-original-type', 'facade');
                  applyFacadePreset(rightDoorNode, 'right');
                  pendingSecondFacadeNode = rightDoorNode;
                }
                // Переменные для анимации створок (градусы открытия), если ещё не заданы.
                try {
                  const rootEl = document.getElementById('constructor-root-module');
                  rootEl.nodeData = rootEl.nodeData || {};
                  rootEl.nodeData.variables = rootEl.nodeData.variables || {};
                  rootEl.nodeData.variables.main = rootEl.nodeData.variables.main || {};
                  if (rootEl.nodeData.variables.main.door_open_left == null) rootEl.nodeData.variables.main.door_open_left = 0;
                  if (rootEl.nodeData.variables.main.door_open_right == null) rootEl.nodeData.variables.main.door_open_right = 0;
                } catch (_) {}
              } else {
                applyFacadePreset(newNode, 'single');
              }
            }

            // Если создаём модуль из каталога — разворачиваем template_tree в полноценное дерево
            // (секции + детали + фасады), а не создаём placeholder-обёртку type:'module'.
            // Это соответствует подходу Clodis: каталожный модуль — это шаблон,
            // при добавлении он превращается в обычное дерево секций.
            if (selectedType === 'module') {
              if (!selectedCatalogItemId) {
                alert('Пожалуйста, выберите элемент из каталога');
                return;
              }
              if (!selectedCatalogType) {
                alert('Пожалуйста, выберите тип элемента (каталог)');
                return;
              }

              const selectedCatalog = window.__CLD_CATALOGS_DATA?.[selectedCatalogType];
              let selectedCatalogItem = selectedCatalog?.items?.[String(selectedCatalogItemId)];
              // Вставка должна брать актуальные данные элемента (не из устаревшего кэша).
              try {
                const freshRes = await fetch(
                  '/api/catalog/item/' + encodeURIComponent(String(selectedCatalogType || '')) + '/' + encodeURIComponent(String(selectedCatalogItemId || '')) + '?t=' + Date.now(),
                  { cache: 'no-cache' }
                );
                if (freshRes.ok) {
                  const fresh = await freshRes.json();
                  if (fresh && typeof fresh === 'object') {
                    let parsedData = null;
                    try {
                      if (typeof fresh.data === 'string') parsedData = JSON.parse(fresh.data);
                      else if (fresh.data && typeof fresh.data === 'object') parsedData = fresh.data;
                    } catch (_) {}
                    const normalizedParams = {
                      ...(parsedData?.params && typeof parsedData.params === 'object' ? parsedData.params : {}),
                      ...(fresh.params && typeof fresh.params === 'object' ? fresh.params : {}),
                    };
                    const resolvedCs =
                      parsedData?.constructor_structure
                      || parsedData?.params?.constructor_structure
                      || fresh?.data?.constructor_structure
                      || fresh?.params?.constructor_structure
                      || fresh?.constructor_structure
                      || selectedCatalogItem?.params?.constructor_structure
                      || null;
                    if (!normalizedParams.constructor_structure && parsedData?.constructor_structure) {
                      normalizedParams.constructor_structure = parsedData.constructor_structure;
                    }
                    if (!normalizedParams.constructor_structure && resolvedCs) {
                      normalizedParams.constructor_structure = resolvedCs;
                    }
                    if (!normalizedParams.template && parsedData?.template) {
                      normalizedParams.template = parsedData.template;
                    }
                    if (!normalizedParams.template && parsedData?.params?.template) {
                      normalizedParams.template = parsedData.params.template;
                    }
                    if (!normalizedParams.templates && parsedData?.templates) {
                      normalizedParams.templates = parsedData.templates;
                    }
                    if (!normalizedParams.templates && parsedData?.params?.templates) {
                      normalizedParams.templates = parsedData.params.templates;
                    }
                    if (!normalizedParams.children && Array.isArray(parsedData?.children)) {
                      normalizedParams.children = parsedData.children;
                    }
                    if (!normalizedParams.children && Array.isArray(parsedData?.params?.children)) {
                      normalizedParams.children = parsedData.params.children;
                    }
                    selectedCatalogItem = {
                      id: String(fresh.id ?? selectedCatalogItemId),
                      name: fresh.name || parsedData?.name || selectedCatalogItem?.name || '',
                      data: parsedData || fresh.data || null,
                      params: normalizedParams,
                      template: fresh.template || parsedData?.template || null,
                    };
                    // Обновляем runtime-кэш, чтобы link-expansion тоже видел свежую запись.
                    try {
                      window.__CLD_CATALOGS_DATA = window.__CLD_CATALOGS_DATA || {};
                      window.__CLD_CATALOGS_DATA[selectedCatalogType] = window.__CLD_CATALOGS_DATA[selectedCatalogType] || { items: {} };
                      window.__CLD_CATALOGS_DATA[selectedCatalogType].items[String(selectedCatalogItemId)] = selectedCatalogItem;
                    } catch (_) {}
                  }
                }
              } catch (_) {}
              const rawCS = selectedCatalogItem?.params?.constructor_structure;
              let selectedTemplateTree = null;
              // Источник правды для сохранённого элемента — constructor_structure.
              // Иначе можно случайно взять старый data/template и вернуть дефолты.
              if (rawCS) {
                if (Array.isArray(rawCS)) {
                  selectedTemplateTree = rawCS;
                } else if (rawCS.children && Array.isArray(rawCS.children)) {
                  selectedTemplateTree = rawCS.children;
                }
              }
              if (!selectedTemplateTree) {
                selectedTemplateTree =
                  selectedCatalogItem?.params?.templates?.[0]?.template?.tree
                  || selectedCatalogItem?.params?.spec?.template?.tree
                  || selectedCatalogItem?.params?.template?.tree
                  || selectedCatalogItem?.params?.template?.structure
                  || selectedCatalogItem?.template?.tree
                  || null;
              }

              if (Array.isArray(selectedTemplateTree) && selectedTemplateTree.length > 0 && selectedCatalogType !== 'facades') {
                // Удаляем пустой newNode (module) — вместо него загрузим полное дерево
                if (newNode.parentElement) newNode.remove();
                // API может возвращать дублирующиеся плоские узлы рядом с секциями.
                // Убираем дубли: если рядом с section есть flat wall/facade с тем же id —
                // оставляем только иерархическую копию внутри section.
                const dedup = (nodes) => {
                  if (!Array.isArray(nodes)) return nodes;
                  const idsInSections = new Set();
                  const collect = (arr) => {
                    if (!Array.isArray(arr)) return;
                    arr.forEach(n => { if (n && n.id) idsInSections.add(n.id); collect(n.children); });
                  };
                  nodes.filter(n => (n.type === 'section' || n.type === 'fill_section') && Array.isArray(n.children))
                    .forEach(s => collect(s.children));
                  const out = nodes.filter(n => {
                    if (!n) return false;
                    if ((n.type === 'section' || n.type === 'fill_section')) return true;
                    return !n.id || !idsInSections.has(n.id);
                  });
                  out.forEach(n => { if (Array.isArray(n.children)) n.children = dedup(n.children); });
                  return out;
                };
                const treeData = dedup(JSON.parse(JSON.stringify(selectedTemplateTree)));
                if (typeof loadConstructorTreeFromJSON === 'function') {
                  const appendTarget =
                    parentNode && parentNode.nodeType === 1
                      ? parentNode
                      : document.getElementById('constructor-root-module');
                  loadConstructorTreeFromJSON(treeData, { appendUnder: appendTarget });
                }
                closeModal();
                setTimeout(() => {
                  try {
                    if (typeof window.__ppPostModuleToIframe === 'function') {
                      window.__ppPostModuleToIframe();
                    }
                    // Авто-обновление JSON-вкладки при добавлении модуля
                    const jsonTa = document.getElementById('catalog-item-json-textarea');
                    const jsonBtn = document.getElementById('catalog-item-json-refresh');
                    if (jsonTa && jsonBtn) jsonBtn.click();
                  } catch (_) {}
                }, 100);
                return; // выходим — дальнейшая логика для обычных узлов не нужна
              } else {
                // Нет template_tree ИЛИ это "facades" (хотим live-обновления из каталога) —
                // сохраняем как module-placeholder с ссылкой на каталог (+ snapshot template_tree для превью).
              if (!newNode.nodeData.spec) newNode.nodeData.spec = {};
                newNode.nodeData.spec.element_type = selectedCatalogType;
                newNode.nodeData.spec.id = String(selectedCatalogItemId);
                newNode.nodeData.spec.live_catalog = (selectedCatalogType === 'facades');
                if (Array.isArray(selectedTemplateTree) && selectedTemplateTree.length > 0) {
                  newNode.nodeData.spec.template_tree = JSON.parse(JSON.stringify(selectedTemplateTree));
                }
                newNode.nodeData.modelId = String(selectedCatalogItemId);
                newNode.nodeData.modelKey = selectedCatalogItemName || '';
                newNode.nodeData.size = newNode.nodeData.size || { x: '@section.width', y: '@section.height', z: '@section.depth' };
              }
            }

            // Референсный путь "Элемент" (link): выбираем каталожный item и разворачиваем его
            // tree под текущего родителя. Без выбора detail-type.
            if (selectedType === 'element') {
              if (!selectedCatalogItemId) {
                alert('Пожалуйста, выберите элемент из каталога');
                return;
              }
              if (!selectedCatalogType) {
                alert('Пожалуйста, выберите тип элемента (каталог)');
                return;
              }

              const selectedCatalog = window.__CLD_CATALOGS_DATA?.[selectedCatalogType];
              let selectedCatalogItem = selectedCatalog?.items?.[String(selectedCatalogItemId)];
              // Для вставки "элемента" (петли и т.п.) всегда берём свежую карточку из API.
              try {
                const freshRes = await fetch(
                  '/api/catalog/item/' + encodeURIComponent(String(selectedCatalogType || '')) + '/' + encodeURIComponent(String(selectedCatalogItemId || '')) + '?t=' + Date.now(),
                  { cache: 'no-cache' }
                );
                if (freshRes.ok) {
                  const fresh = await freshRes.json();
                  if (fresh && typeof fresh === 'object') {
                    let parsedData = null;
                    try {
                      if (typeof fresh.data === 'string') parsedData = JSON.parse(fresh.data);
                      else if (fresh.data && typeof fresh.data === 'object') parsedData = fresh.data;
                    } catch (_) {}
                    const normalizedParams = {
                      ...(parsedData?.params && typeof parsedData.params === 'object' ? parsedData.params : {}),
                      ...(fresh.params && typeof fresh.params === 'object' ? fresh.params : {}),
                    };
                    const resolvedCs =
                      parsedData?.constructor_structure
                      || parsedData?.params?.constructor_structure
                      || fresh?.data?.constructor_structure
                      || fresh?.params?.constructor_structure
                      || fresh?.constructor_structure
                      || selectedCatalogItem?.params?.constructor_structure
                      || null;
                    if (!normalizedParams.constructor_structure && parsedData?.constructor_structure) {
                      normalizedParams.constructor_structure = parsedData.constructor_structure;
                    }
                    if (!normalizedParams.constructor_structure && resolvedCs) {
                      normalizedParams.constructor_structure = resolvedCs;
                    }
                    if (!normalizedParams.template && parsedData?.template) {
                      normalizedParams.template = parsedData.template;
                    }
                    if (!normalizedParams.template && parsedData?.params?.template) {
                      normalizedParams.template = parsedData.params.template;
                    }
                    if (!normalizedParams.templates && parsedData?.templates) {
                      normalizedParams.templates = parsedData.templates;
                    }
                    if (!normalizedParams.templates && parsedData?.params?.templates) {
                      normalizedParams.templates = parsedData.params.templates;
                    }
                    if (!normalizedParams.children && Array.isArray(parsedData?.children)) {
                      normalizedParams.children = parsedData.children;
                    }
                    if (!normalizedParams.children && Array.isArray(parsedData?.params?.children)) {
                      normalizedParams.children = parsedData.params.children;
                    }
                    selectedCatalogItem = {
                      id: String(fresh.id ?? selectedCatalogItemId),
                      name: fresh.name || parsedData?.name || selectedCatalogItem?.name || '',
                      data: parsedData || fresh.data || null,
                      params: normalizedParams,
                      template: fresh.template || parsedData?.template || null,
                    };
                    try {
                      window.__CLD_CATALOGS_DATA = window.__CLD_CATALOGS_DATA || {};
                      window.__CLD_CATALOGS_DATA[selectedCatalogType] = window.__CLD_CATALOGS_DATA[selectedCatalogType] || { items: {} };
                      window.__CLD_CATALOGS_DATA[selectedCatalogType].items[String(selectedCatalogItemId)] = selectedCatalogItem;
                    } catch (_) {}
                  }
                }
              } catch (_) {}
              const rawCS = selectedCatalogItem?.params?.constructor_structure;
              const selectedItemName =
                String(
                  selectedCatalogItem?.name
                  || selectedCatalogItem?.data?.name
                  || selectedCatalogItemName
                  || elementName
                  || ''
                );
              const isHingeLikeElement =
                /(?:^|[_\s-])(hinge|hinges|petli|petlya|petl|putli)(?:$|[_\s-])/i.test(String(selectedCatalogType || ''))
                || /����/i.test(selectedItemName);
              if (isHingeLikeElement) {
                console.info('[CLD][hinge][admin][add-element]', {
                  selectedCatalogType: String(selectedCatalogType || ''),
                  selectedCatalogItemId: String(selectedCatalogItemId || ''),
                  selectedItemName,
                  parentNodeType: parentNode?.getAttribute?.('data-node-type') || '',
                  parentNodeName: parentNode?.nodeData?.name || parentNode?.getAttribute?.('data-node-name') || '',
                });
              }

              const resolveDirectParentTreeNode = (nodeEl) => (
                nodeEl?.parentElement?.closest?.('.constructor-tree-node') || null
              );
              const resolveNearestSectionNode = (startNode) => {
                let cur = startNode;
                while (cur) {
                  if (cur?.getAttribute?.('data-node-type') === 'section') return cur;
                  cur = resolveDirectParentTreeNode(cur);
                }
                return null;
              };
              const ensureHingeSectionTarget = (baseParent) => {
                if (!baseParent || baseParent.nodeType !== 1) return baseParent;
                if (!isHingeLikeElement) return baseParent;

                const nearestSection = resolveNearestSectionNode(baseParent);
                if (!nearestSection) return baseParent;

                const childrenContainer = nearestSection.querySelector(':scope > .tree-node-children');
                const directChildren = childrenContainer
                  ? Array.from(childrenContainer.children).filter((ch) => ch.classList?.contains('constructor-tree-node'))
                  : [];
                const existingHingeSection = directChildren.find((ch) => {
                  if (ch.getAttribute('data-node-type') !== 'section') return false;
                  const nm = String(ch.nodeData?.name || ch.getAttribute('data-node-name') || '');
                  const role = String(ch.nodeData?.sectionLayoutRole || ch.nodeData?.layout_role || '');
                  return /петл/i.test(nm) || /hinge/i.test(role) || /петл/i.test(role);
                });
                if (existingHingeSection) return existingHingeSection;

                const created = createConstructorTreeNode('section', nearestSection);
                if (!created) return nearestSection;
                created.nodeData = created.nodeData || {};
                created.nodeData.name = 'Секция под петли';
                created.nodeData.sectionLayoutRole = 'hinges';
                created.nodeData.size = created.nodeData.size || { x: 's:x', y: 's:y', z: 's:z' };
                created.nodeData.position = created.nodeData.position || { x: 0, y: 0, z: 0 };
                created.setAttribute('data-node-name', 'Секция под петли');
                addTreeNodeToParent(created, nearestSection);
                return created;
              };

              let selectedTemplateTree = null;
              // Для "Элемент" тоже сначала constructor_structure (актуальный сохранённый шаблон).
              if (rawCS) {
                if (Array.isArray(rawCS)) {
                  selectedTemplateTree = rawCS;
                } else if (rawCS.children && Array.isArray(rawCS.children)) {
                  selectedTemplateTree = rawCS.children;
                }
              }
              if (!selectedTemplateTree) {
                selectedTemplateTree =
                  selectedCatalogItem?.data?.children
                  || selectedCatalogItem?.params?.children
                  || selectedCatalogItem?.params?.templates?.[0]?.template?.tree
                  || selectedCatalogItem?.params?.spec?.template?.tree
                  || selectedCatalogItem?.params?.template?.tree
                  || selectedCatalogItem?.params?.template?.structure
                  || selectedCatalogItem?.template?.tree
                  || null;
              }

              if (Array.isArray(selectedTemplateTree) && selectedTemplateTree.length > 0) {
                // Референсный link-путь: "Петля 1..N" может приходить как type:'link' + spec.id.
                // Разворачиваем link в children целевого каталожного элемента, иначе в превью остаются пустые секции.
                const getTreeFromCatalogItem = (it) => {
                  const raw = it?.params?.constructor_structure;
                  let tr = null;
                  if (raw) {
                    if (Array.isArray(raw)) tr = raw;
                    else if (Array.isArray(raw.children)) {
                      tr = raw.children;
                    }
                  }
                  if (!tr) {
                    tr =
                      it?.data?.children
                      || it?.data?.params?.children
                      || it?.data?.params?.templates?.[0]?.template?.tree
                      || it?.data?.params?.spec?.template?.tree
                      || it?.data?.params?.template?.tree
                      || it?.data?.params?.template?.structure
                      || it?.params?.children
                      || it?.params?.templates?.[0]?.template?.tree
                      || it?.params?.spec?.template?.tree
                      || it?.params?.template?.tree
                      || it?.params?.template?.structure
                      || it?.template?.tree
                      || null;
                  }
                  return Array.isArray(tr) ? tr : null;
                };
              const clearHingeNodes = (target) => {
                if (!target || target.nodeType !== 1) return;
                const chWrap = target.querySelector(':scope > .tree-node-children');
                const direct = chWrap
                  ? Array.from(chWrap.children).filter((el) => el.classList?.contains('constructor-tree-node'))
                  : [];
                direct.forEach((el) => {
                  const nm = String(el.nodeData?.name || el.getAttribute('data-node-name') || '');
                  const role = String(el.nodeData?.sectionLayoutRole || el.nodeData?.layout_role || '');
                  if (/петл/i.test(nm) || /hinge/i.test(role) || /петл/i.test(role)) {
                    try { el.remove(); } catch (_) {}
                  }
                });
              };

                const findCatalogItemById = (id) => {
                  const map = window.__CLD_CATALOGS_DATA || {};
                  const sid = String(id || '');
                  if (!sid) return null;
                  for (const key of Object.keys(map)) {
                    const item = map[key]?.items?.[sid];
                    if (item) return item;
                  }
                  return null;
                };

                const expandLinkNodes = (nodes, depth = 0) => {
                  if (!Array.isArray(nodes) || depth > 12) return Array.isArray(nodes) ? nodes : [];
                  const out = [];
                  nodes.forEach((node) => {
                    if (!node || typeof node !== 'object') return;
                    const t = String(node.type || '').toLowerCase();
                    if (t === 'link') {
                      const linkId = node?.spec?.id ?? node?.id ?? '';
                      const linkedItem = findCatalogItemById(linkId);
                      const linkTree = getTreeFromCatalogItem(linkedItem);
                      if (Array.isArray(linkTree) && linkTree.length > 0) {
                        const expanded = expandLinkNodes(JSON.parse(JSON.stringify(linkTree)), depth + 1);
                        expanded.forEach((n) => out.push(n));
                      }
                      return;
                    }
                    const clone = JSON.parse(JSON.stringify(node));
                    if (Array.isArray(clone.children)) {
                      clone.children = expandLinkNodes(clone.children, depth + 1);
                    }
                    out.push(clone);
                  });
                  return out;
                };

                if (newNode.parentElement) newNode.remove();
                const dedup = (nodes) => {
                  if (!Array.isArray(nodes)) return nodes;
                  const idsInSections = new Set();
                  const collect = (arr) => {
                    if (!Array.isArray(arr)) return;
                    arr.forEach((n) => {
                      if (n && n.id) idsInSections.add(n.id);
                      collect(n.children);
                    });
                  };
                  nodes
                    .filter((n) => (n?.type === 'section' || n?.type === 'fill_section') && Array.isArray(n.children))
                    .forEach((s) => collect(s.children));
                  const out = nodes.filter((n) => {
                    if (!n) return false;
                    if (n.type === 'section' || n.type === 'fill_section') return true;
                    return !n.id || !idsInSections.has(n.id);
                  });
                  out.forEach((n) => {
                    if (Array.isArray(n.children)) n.children = dedup(n.children);
                  });
                  return out;
                };

                const treeData = dedup(expandLinkNodes(JSON.parse(JSON.stringify(selectedTemplateTree))));
                if (typeof loadConstructorTreeFromJSON === 'function') {
                  const rawAppendTarget =
                    parentNode && parentNode.nodeType === 1
                      ? parentNode
                      : document.getElementById('constructor-root-module');
                  const appendTarget = ensureHingeSectionTarget(rawAppendTarget);
                  if (isHingeLikeElement) {
                    clearHingeNodes(appendTarget);
                  }
                  if (isHingeLikeElement) {
                    const root0 = Array.isArray(treeData) && treeData.length ? treeData[0] : null;
                    console.info('[CLD][hinge][admin][append]', {
                      appendTargetType: appendTarget?.getAttribute?.('data-node-type') || 'root',
                      appendTargetName: appendTarget?.nodeData?.name || appendTarget?.getAttribute?.('data-node-name') || 'root',
                      treeRootType: root0?.type || '',
                      treeRootName: root0?.name || '',
                      treeRootPos: root0?.pos || null,
                      treeRootSize: root0?.size || null,
                    });
                  }
                  loadConstructorTreeFromJSON(treeData, { appendUnder: appendTarget });
                }
                closeModal();
                setTimeout(() => {
                  try {
                    if (typeof window.__ppPostModuleToIframe === 'function') {
                      window.__ppPostModuleToIframe();
                    }
                    const jsonTa = document.getElementById('catalog-item-json-textarea');
                    const jsonBtn = document.getElementById('catalog-item-json-refresh');
                    if (jsonTa && jsonBtn) jsonBtn.click();
                  } catch (_) {}
                }, 100);
                return;
              }

              // Fallback: ���� � �������� ��� constructor tree � ��������� ������ �� ������� ��� ������.
              if (!newNode.nodeData.spec) newNode.nodeData.spec = {};
              newNode.nodeData.spec.element_type = selectedCatalogType;
              newNode.nodeData.spec.id = String(selectedCatalogItemId);
              newNode.nodeData.modelId = String(selectedCatalogItemId);
              newNode.nodeData.modelKey = selectedCatalogItemName || elementName || 'Элемент';
              newNode.nodeData.originalType = 'module';
              newNode.setAttribute('data-original-type', 'module');
              newNode.nodeData.size = newNode.nodeData.size || { x: '@section.width', y: '@section.height', z: '@section.depth' };
            }
            
            // Если выбран тип детали, сохраняем его (только для detail-узлов)
            if (selectedType !== 'module' && selectedDetailType) {
              newNode.nodeData.detailType = selectedDetailType;
              newNode.setAttribute('data-detail-type', selectedDetailType);
              
              const detailTypeInfo = detailTypes.find(dt => dt.id === selectedDetailType);
              if (detailTypeInfo) {
                newNode.nodeData.detailTypeName = detailTypeInfo.name;
                newNode.nodeData.detailOrientation = detailTypeInfo.orientation;
                newNode.nodeData.detailPosition = detailTypeInfo.position;
                    
                    // ⭐ ИСПРАВЛЕНИЕ: Устанавливаем orientation и spec из getDetailDefaults
                    {
                      const defaults = cldGetDetailDefaults(selectedDetailType);
                      if (defaults) {
                        // Референс: orientation хранится в spec.orientation
                        if (defaults.spec?.orientation) {
                          newNode.nodeData.orientation = defaults.spec.orientation; // 'v', 'h', 'f'
                          if (!newNode.nodeData.spec) newNode.nodeData.spec = {};
                          newNode.nodeData.spec.orientation = defaults.spec.orientation;
                        }
                        // Устанавливаем размеры и позицию из defaults
                        if (defaults.size) newNode.nodeData.size = defaults.size;
                        if (defaults.pos) newNode.nodeData.position = defaults.pos;
                        if (defaults.pivot) newNode.nodeData.anchor = defaults.pivot;
                      }
                    }
              }
            }
            
            // Обновляем название в дереве
            const nameElement = newNode.querySelector('.tree-node-name');
            if (nameElement) {
              nameElement.textContent = elementName;
            }
            
            // ��������� � ������
            addTreeNodeToParent(newNode, parentNode);
            if (pendingSecondFacadeNode) {
              addTreeNodeToParent(pendingSecondFacadeNode, parentNode);
            }
            
            if (selectedType === 'detail' && selectedDetailType) {
            }
            
            // Выбираем новый элемент
            selectTreeNode(newNode);
            
                // Закрываем модальное окно ПЕРЕД обновлением 3D
            closeModal();
            
            if (selectedType === 'detail' && selectedDetailType) {
            }
            
                // Обновляем 3D превью сразу после добавления без перезагрузки UI-дерева.
                // ВАЖНО: loadConstructorTreeFromJSON здесь использовать нельзя — он может
                // переинтерпретировать originalType и превратить module в facade/detail.
                setTimeout(() => {
                  try {
                    try {
                      if (typeof saveConstructorNodeData === 'function' && newNode) saveConstructorNodeData(newNode);
                    } catch (_) {}
            if (typeof window.__ppPostModuleToIframe === 'function') {
              window.__ppPostModuleToIframe();
                  } else {
                    console.warn('[CLD][detail] ⚠️ __ppPostModuleToIframe не определена');
                    }
                  } catch (e) {
                    console.warn('[CLD][detail] ⚠️ Ошибка live-sync после добавления:', e);
                  }
                }, 100);
                
              } catch (error) {
                console.error('[CLD][modal] ❌ Ошибка при добавлении элемента:', error);
                alert('Ошибка при добавлении элемента: ' + error.message);
                // Все равно закрываем модалку при ошибке
                closeModal();
              }
            };
          }
          
          // Закрытие при клике вне модального окна
          modal.onclick = function(e) {
            if (e.target === modal) {
              closeModal();
            }
          };
        }
        // Функция для сбора всей структуры дерева в JSON формат
        function getConstructorTreeJSON() {
          const rootModule = document.getElementById('constructor-root-module');
          if (!rootModule) {
            console.warn('⚠️ Корневой модуль не найден');
            return null;
          }

          try {
            const sn =
              (typeof currentSelectedNode !== 'undefined' && currentSelectedNode) ||
              window.__cldCurrentSelectedNode ||
              window.currentSelectedNode;
            if (sn && typeof saveConstructorNodeData === 'function') saveConstructorNodeData(sn);
          } catch (_) {}
          
          // Функция для рекурсивного обхода узлов дерева
          function collectNodeData(nodeElement) {
            if (!nodeElement || !nodeElement.nodeData) {
              return null;
            }
            
            const nodeData = nodeElement.nodeData;
            let nodeType = nodeElement.getAttribute('data-node-type');
            if (!nodeType) {
              const ot = String(nodeData.originalType || nodeData.type || '').toLowerCase();
              nodeType =
                ot === 'detail' || ot === 'facade' || ot === 'module' || ot === 'model' || ot === 'furniture'
                  ? 'detail'
                  : 'section';
            }
            const nodeId = nodeElement.getAttribute('data-node-id');
            
            // Базовые данные узла
            const result = {
              type: nodeType || 'section',
              id: nodeId || '',
              name: nodeData.name || '',
              originalType: nodeData.originalType || nodeType,
              hide_when_filled: nodeData.hide_when_filled || false,
              active: nodeData.active !== undefined ? nodeData.active : true,
              article: nodeData.article || '',
              children: [],
              // Комплектующие (для всех типов узлов)
              accessories: Array.isArray(nodeData.accessories) ? nodeData.accessories.map(acc => ({
                id: String(acc.id || ''),
                name: String(acc.name || ''),
                sku: String(acc.sku || acc.article || ''),
                category: String(acc.category || ''),
                count: Number(acc.count || 1),
                c: Number(acc.c || 1)
              })) : []
            };

            // Для секции (type: 'section') важно сохранять размеры/позицию/поворот в export,
            // ����� ��� round-trip (reload UI ����� ��������� ������) �������� ����� �������.
            if (nodeType === 'section') {
              result.size = nodeData.size || { x: '', y: '', z: '' };
              result.pos = nodeData.position || { x: '0', y: '0', z: '0' };
              result.pivot = nodeData.anchor || { x: -1, y: -1, z: -1 };
              result.rot = nodeData.rotation || { x: '0', y: '0', z: '0' };
              const lrRaw = nodeData.sectionLayoutRole ?? nodeData.layout_role;
              const lr =
                typeof window.__cldNormalizeSectionLayoutRole === 'function'
                  ? window.__cldNormalizeSectionLayoutRole(lrRaw)
                  : String(lrRaw || '').trim();
              if (lr) result.layout_role = lr;
            }
            
            // Если это деталь, добавляем специфичные поля
            if (nodeType === 'detail') {
              // Комплектующие (model/furniture): экспортируем в формате референса
              const originalType = nodeData.originalType || '';
              if (originalType === 'model' || originalType === 'furniture') {
                result.type = originalType; // сохраняем исходный тип
                result.spec = {
                  id: String(nodeData.modelId || ''),
                  key: String(nodeData.modelKey || ''),
                  ...(originalType === 'model' ? { model_mats: nodeData.modelMats || {} } : {})
                };
                result.pos = nodeData.position || { x: 0, y: 0, z: 0 };
                result.pivot = nodeData.anchor || { x: -1, y: -1, z: -1 };
                result.rot = nodeData.rotation || { x: 0, y: 0, z: 0 };
                result.c_rot = nodeData.c_rot || { x: 0, y: 0, z: 0 };
                result.size = nodeData.size || { x: '', y: '', z: '' };
                result.events = nodeData.events || {
                  on_before_params: '',
                  on_before_build: '',
                  on_after_build: '',
                  on_drag_end: ''
                };
                result.visible = nodeData.visible !== undefined ? (nodeData.visible ? 1 : 0) : 1;
                result.active = nodeData.active !== undefined ? (nodeData.active ? 1 : 0) : 1;
                if (Array.isArray(nodeData.current)) result.current = nodeData.current;
                return result; // возвращаем сразу, не добавляем поля для обычных деталей
              }
              
              // ⭐ ФАСАДЫ: facade в Clodis — это фасады (двери, цоколь, топ и т.п.)
              if (originalType === 'facade') {
                result.type = 'facade'; // сохраняем исходный тип
                // Фасады имеют spec.id (ID фасада из библиотеки) и spec.element_type
                result.spec = nodeData.spec || {};
                if (nodeData.modelId) {
                  result.spec.id = String(nodeData.modelId);
                }
                if (nodeData.modelKey) {
                  result.spec.key = String(nodeData.modelKey);
                }
                // Референс: фасад по умолчанию на задней грани (pos.z = 0); на переднюю — pos.z = @section.depth
                result.pos = nodeData.position && (nodeData.position.z !== undefined && nodeData.position.z !== '') ? nodeData.position : { x: 0, y: 0, z: 0 };
                result.pivot = nodeData.anchor && (nodeData.anchor.z !== undefined) ? nodeData.anchor : { x: -1, y: -1, z: 1 };
                result.rot = nodeData.rotation || { x: 0, y: 0, z: 0 };
                result.c_rot = nodeData.c_rot || { x: 0, y: 0, z: 0 };
                // Референс: размер = ширина и высота секции, толщина 16мм
                result.size = nodeData.size && (nodeData.size.x || nodeData.size.y) ? nodeData.size : { x: '@section.width', y: '@section.height', z: 16 };
                result.events = nodeData.events || {
                  on_before_params: '',
                  on_before_build: '',
                  on_after_build: '',
                  on_drag_end: ''
                };
                result.visible = nodeData.visible !== undefined ? (nodeData.visible ? 1 : 0) : 1;
                result.active = nodeData.active !== undefined ? (nodeData.active ? 1 : 0) : 1;
                if (Array.isArray(nodeData.accessories)) result.accessories = nodeData.accessories;
                return result; // возвращаем сразу, не добавляем поля для обычных деталей
              }
              
              // ⭐ МОДУЛИ: module в Clodis — это готовые элементы (двери, опоры и т.п.)
              if (originalType === 'module') {
                result.type = 'module'; // сохраняем исходный тип
                // Модули имеют spec.id (ID модуля из библиотеки) и spec.element_type
                result.spec = nodeData.spec || {};
                if (nodeData.modelId) {
                  result.spec.id = String(nodeData.modelId);
                }
                if (nodeData.modelKey) {
                  result.spec.key = String(nodeData.modelKey);
                }
                result.pos = nodeData.position || { x: 0, y: 0, z: 0 };
                result.pivot = nodeData.anchor || { x: -1, y: -1, z: -1 };
                result.rot = nodeData.rotation || { x: 0, y: 0, z: 0 };
                result.c_rot = nodeData.c_rot || { x: 0, y: 0, z: 0 };
                result.size = nodeData.size || { x: '', y: '', z: '' };
                result.events = nodeData.events || {
                  on_before_params: '',
                  on_before_build: '',
                  on_after_build: '',
                  on_drag_end: ''
                };
                result.visible = nodeData.visible !== undefined ? (nodeData.visible ? 1 : 0) : 1;
                result.active = nodeData.active !== undefined ? (nodeData.active ? 1 : 0) : 1;
                if (Array.isArray(nodeData.accessories)) result.accessories = nodeData.accessories;
                return result; // возвращаем сразу, не добавляем поля для обычных деталей
              }
              
              // ⭐ ФАСАДЫ: facade в Clodis — это фасады (двери, цоколь, топ и т.п.)
              if (originalType === 'facade') {
                result.type = 'facade'; // сохраняем исходный тип
                // ������ ����� spec.id (ID ������ �� ����������) � spec.element_type
                result.spec = nodeData.spec || {};
                if (nodeData.modelId) {
                  result.spec.id = String(nodeData.modelId);
                }
                if (nodeData.modelKey) {
                  result.spec.key = String(nodeData.modelKey);
                }
                // Референс: фасад по умолчанию на задней грани (pos.z = 0); на переднюю — pos.z = @section.depth
                result.pos = nodeData.position && (nodeData.position.z !== undefined && nodeData.position.z !== '') ? nodeData.position : { x: 0, y: 0, z: 0 };
                result.pivot = nodeData.anchor && (nodeData.anchor.z !== undefined) ? nodeData.anchor : { x: -1, y: -1, z: 1 };
                result.rot = nodeData.rotation || { x: 0, y: 0, z: 0 };
                result.c_rot = nodeData.c_rot || { x: 0, y: 0, z: 0 };
                // Референс: размер = ширина и высота секции, толщина 16мм
                result.size = nodeData.size && (nodeData.size.x || nodeData.size.y) ? nodeData.size : { x: '@section.width', y: '@section.height', z: 16 };
                result.events = nodeData.events || {
                  on_before_params: '',
                  on_before_build: '',
                  on_after_build: '',
                  on_drag_end: ''
                };
                result.visible = nodeData.visible !== undefined ? (nodeData.visible ? 1 : 0) : 1;
                result.active = nodeData.active !== undefined ? (nodeData.active ? 1 : 0) : 1;
                if (Array.isArray(nodeData.accessories)) result.accessories = nodeData.accessories;
                return result; // возвращаем сразу, не добавляем поля для обычных деталей
              }
              
              // ⭐ МОДУЛИ: module в Clodis — это готовые элементы (двери, опоры и т.п.)
              if (originalType === 'module') {
                result.type = 'module'; // сохраняем исходный тип
                // ������ ����� spec.id (ID ������ �� ����������) � spec.element_type
                result.spec = nodeData.spec || {};
                if (nodeData.modelId) {
                  result.spec.id = String(nodeData.modelId);
                }
                if (nodeData.modelKey) {
                  result.spec.key = String(nodeData.modelKey);
                }
                result.pos = nodeData.position || { x: 0, y: 0, z: 0 };
                result.pivot = nodeData.anchor || { x: -1, y: -1, z: -1 };
                result.rot = nodeData.rotation || { x: 0, y: 0, z: 0 };
                result.c_rot = nodeData.c_rot || { x: 0, y: 0, z: 0 };
                result.size = nodeData.size || { x: '', y: '', z: '' };
                result.events = nodeData.events || {
                  on_before_params: '',
                  on_before_build: '',
                  on_after_build: '',
                  on_drag_end: ''
                };
                result.visible = nodeData.visible !== undefined ? (nodeData.visible ? 1 : 0) : 1;
                result.active = nodeData.active !== undefined ? (nodeData.active ? 1 : 0) : 1;
                if (Array.isArray(nodeData.accessories)) result.accessories = nodeData.accessories;
                return result; // возвращаем сразу, не добавляем поля для обычных деталей
              }
              
              // Обычная деталь (wall).
              // ВАЖНО: для корректного round‑trip с рефом НЕ искажаем spec/size/pos/pivot:
              // всё, что пришло из JSON (templateItemToNodeData), сохраняем обратно как есть.
              const detailTypeId = nodeData.detailType || nodeData.detailTypeId;
              let defaultPivot = null;
              if (detailTypeId) {
                const dflt = cldGetDetailDefaults(detailTypeId);
                defaultPivot = dflt?.pivot || null;
              }

              // Основные поля детали
              result.type = 'wall';
              result.size = nodeData.size || { x: '', y: '', z: '' };
              result.position = nodeData.position || { x: '0', y: '0', z: '0' };
              // Если anchor не задан — используем дефолтный pivot по типу детали (как в референсе)
              result.anchor = nodeData.anchor ?? defaultPivot ?? { x: 0, y: 0, z: 0 };
              result.rotation = nodeData.rotation || { x: '0', y: '0', z: '0' };
              result.comments = nodeData.comments || '';
              result.events = nodeData.events || {
                on_before_params: '',
                on_before_build: '',
                on_after_build: '',
                on_drag_end: ''
              };
              result.fill_key = nodeData.fill_key || '';
              result.consider_size = nodeData.consider_size || false;
              result.consider_cuts = nodeData.consider_cuts || false;
              result.consider_intersections = nodeData.consider_intersections || false;

              // Спецификация детали (ориентация, материал, кромки и т.п.) храним внутри spec,
              // чтобы структура совпадала с референсным JSON.
              // Если nodeData.spec уже есть (загружен из JSON) — просто возвращаем его.
              // Плоские поля orientation/material/edges оставляем только как дубли (для UI),
              // но не генерируем из них новый spec.
              if (nodeData.spec && typeof nodeData.spec === 'object') {
                result.spec = nodeData.spec;
              }
            }
            
            // �������� �������� ��������
            const childrenContainer = nodeElement.querySelector('.tree-node-children');
            if (childrenContainer) {
              const childNodes = childrenContainer.querySelectorAll('.constructor-tree-node');
              childNodes.forEach(childNode => {
                const childData = collectNodeData(childNode);
                if (childData) {
                  result.children.push(childData);
                }
              });
            }
            
            return result;
          }
          
          // Собираем данные корневого модуля
          const rootData = {
            type: 'module',
            name: (() => {
              const el = document.getElementById('constructor-root-module-name');
              if (el?.textContent && String(el.textContent).trim()) return String(el.textContent).trim();
              const inp = document.getElementById('catalog-item-edit-name');
              if (inp?.value && String(inp.value).trim()) return String(inp.value).trim();
              return '(элемент без названия)';
            })(),
            children: [],
            // Переменные модуля (вкладка "Переменные")
            variables: (() => {
              const nd = rootModule.nodeData || {};
              // гарантируем, что main пересобран из enabled vars
              if (nd.variables && typeof nd.variables === 'object') {
                if (Array.isArray(nd.variables.groups)) {
                  const prevMain =
                    nd.variables.main && typeof nd.variables.main === 'object'
                      ? { ...nd.variables.main }
                      : {};
                  const flat = {};
                  for (const g of (nd.variables.groups || [])) {
                    if (!g || g.enabled === false) continue;
                    for (const v of (g.vars || [])) {
                      if (!v || v.enabled === false) continue;
                      const key = String(v.key || '').trim();
                      if (!key || key === '_wt') continue;
                      const n = Number(v.value);
                      if (!Number.isFinite(n)) continue;
                      flat[key] = n;
                    }
                  }
                  // groups ����������� main; ������� ����� main (�� �� UI �����) �� ������
                  nd.variables.main = { ...prevMain, ...flat };
                }
              }
              const main = (nd.variables && typeof nd.variables === 'object' && nd.variables.main && typeof nd.variables.main === 'object')
                ? nd.variables.main
                : {};
              // сохраняем как plain object key->number
              const out = {};
              for (const [k, v] of Object.entries(main || {})) {
                const key = String(k || '').trim();
                const n = Number(v);
                if (!key || !Number.isFinite(n)) continue;
                out[key] = n;
              }
              // также сохраняем groups для UI
              const groups = Array.isArray(nd.variables?.groups) ? nd.variables.groups : [];
              return { main: out, groups };
            })(),
            // Новый формат дерева для 3D (clean-room): template.structure
            // Не мешает legacy, потому что дети (UI) по-прежнему сохраняются в children.
            template: { structure: [] }
          };

          // Шаблоны (clean-room): несколько сохранённых вариантов структуры
          try {
            const nd = rootModule.nodeData || {};
            const templates = Array.isArray(nd.templates) ? nd.templates : [];
            if (templates.length) {
              rootData.templates = templates.map((t) => ({
                id: t.id,
                name: t.name,
                article: t.article,
                min: t.min,
                max: t.max,
                accessories: t.accessories,
                constructor_structure: t.constructor_structure,
              }));
              rootData.selectedTemplateId = nd.selectedTemplateId || templates?.[0]?.id || null;
            }
          } catch {}

          // Материалы: overrides групп (толщина/материал) — сохраняем вместе с элементом
          try {
            const nd = rootModule.nodeData || {};
            const ov = nd.materials_overrides || (window.__cldMaterialsState?.groupOverrides || null);
            if (ov && typeof ov === 'object') {
              rootData.materials_overrides = JSON.parse(JSON.stringify(ov));
            }
          } catch {}
          // Материалы: список групп материалов модуля (как в референсе "Группы материалов")
          try {
            const nd = rootModule.nodeData || {};
            if (Array.isArray(nd.material_groups)) {
              rootData.material_groups = JSON.parse(JSON.stringify(nd.material_groups));
            }
          } catch {}
          
          // Собираем дочерние элементы корневого модуля
          const childrenContainer = document.getElementById('constructor-root-module-children');
          if (childrenContainer) {
            const childNodes = childrenContainer.querySelectorAll('.constructor-tree-node');
            childNodes.forEach(childNode => {
              const childData = collectNodeData(childNode);
              if (childData) {
                rootData.children.push(childData);
              }
            });

            // Вкладка JSON и сохранение ожидают template.structure (массив section/wall для 3D).
            // Без этого после добавления детали/фасада JSON остаётся [].
            rootModule.nodeData = rootModule.nodeData || {};
            const nd = rootModule.nodeData;
            const clodisJSON = Array.isArray(nd.clodisJSON) ? nd.clodisJSON : null;

            if (typeof __ppBuildClodisTemplateTreeFromDom === 'function') {
              const domStructure = __ppBuildClodisTemplateTreeFromDom(childrenContainer);
              if (Array.isArray(domStructure) && domStructure.length > 0) {
                rootData.template.structure = domStructure;
                rootData.spec = rootData.spec || {};
                rootData.spec.template = rootData.spec.template || {};
                rootData.spec.template.tree = rootData.template.structure;
                nd.clodisJSON = domStructure;
                if (rootData.template.structure.length > 0) {
                  console.log('[Конструктор] getConstructorTreeJSON: template.structure из DOM, узлов:', rootData.template.structure.length);
                }
              } else if (Array.isArray(clodisJSON) && clodisJSON.length > 0) {
                rootData.template.structure = JSON.parse(JSON.stringify(clodisJSON));
                rootData.spec = rootData.spec || {};
                rootData.spec.template = rootData.spec.template || {};
                rootData.spec.template.tree = rootData.template.structure;
              }
            } else if (Array.isArray(clodisJSON) && clodisJSON.length > 0) {
              rootData.template.structure = JSON.parse(JSON.stringify(clodisJSON));
              rootData.spec = rootData.spec || {};
              rootData.spec.template = rootData.spec.template || {};
              rootData.spec.template.tree = rootData.template.structure;
            }
          }

          try {
            const w = Number(document.getElementById('catalog-item-edit-width')?.value) || 0;
            const h = Number(document.getElementById('catalog-item-edit-height')?.value) || 0;
            const d = Number(document.getElementById('catalog-item-edit-depth')?.value) || 0;
            const st = Array.isArray(rootData.template.structure) ? rootData.template.structure : null;
            const rootSection =
              st?.find((n) => n && typeof n === 'object' && (n.type === 'section' || n.type === 'fill_section')) ||
              (st && st.length > 0 ? st[0] : null);
            if (rootSection && typeof rootSection === 'object' && w > 0 && h > 0 && d > 0) {
              rootSection.__cldAuthorSizeMm = { x: w, y: h, z: d };
            }
          } catch (_) {}
          
          // Если есть live-preview iframe — пересобираем его из актуального template.structure.
          try {
            if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
          } catch (_) {}

          return rootData;
        }
        
        // Функция для восстановления дерева из JSON
        function loadConstructorTreeFromJSON(jsonData, opts) {
          const appendUnder =
            opts && typeof opts === 'object' && opts.appendUnder && opts.appendUnder.nodeType === 1
              ? opts.appendUnder
              : null;
          const prevSelectedId = currentSelectedNode?.getAttribute?.('data-node-id')
            || currentSelectedNode?.nodeData?.id
            || '';
          const prevSelectedPath = (() => {
            try {
              if (typeof getNodePath === 'function') return getNodePath(currentSelectedNode);
              const ds = currentSelectedNode?.dataset?.cldPath;
              return ds || '';
            } catch {
              return '';
            }
          })();

          if (!jsonData) {
            console.warn('Тип с таким ключом уже существует');
            return;
          }

          // Совместимость с форматом референса: если пришёл массив [section, ...] — оборачиваем в объект
          if (Array.isArray(jsonData)) {
            jsonData = { template: { structure: jsonData } };
          }

          // Совместимость: если legacy children отсутствуют, но есть template.structure — восстанавливаем UI дерево из него.
          // Референс часто отдаёт одну секцию { type: "section", children: [ wall, facade, ... ] } — не теряем обёртку.
          const hasLegacyChildren = Array.isArray(jsonData.children);
          let hasNewStructure = Array.isArray(jsonData.template?.structure);

          // FIX: некоторые старые сохранения содержат в template.structure массив вида
          // [ section{children:[...]}, wall, wall, facade, ... ].
          // При таком JSON при загрузке детали дублируются в дереве.
          // Если первый элемент — секция с children, а дальше идут плоские детали,
          // считаем, что "истинное" дерево — только эта секция.
          if (!hasLegacyChildren && hasNewStructure) {
            const arr = jsonData.template.structure;
            const tailHasSections = Array.isArray(arr) && arr.slice(1).some((n) => {
              const t = String(n?.type || '').toLowerCase();
              return t === 'section' || t === 'fill_section';
            });
            if (
              Array.isArray(arr) &&
              arr.length > 1 &&
              arr[0]?.type === 'section' &&
              Array.isArray(arr[0].children) &&
              arr[0].children.length > 0 &&
              !tailHasSections
            ) {
              jsonData.template.structure = [arr[0]];
            }
            hasNewStructure = Array.isArray(jsonData.template?.structure);
          }

          const isBareSection = !hasNewStructure && jsonData.type === 'section' && hasLegacyChildren
            && !jsonData.template && !jsonData.variables;
          // template.structure � ����������� (��� ��� ������� ����������� ������), ����� legacy children.
          const sourceChildren = isBareSection
            ? [ jsonData ]
            : (hasNewStructure
              ? jsonData.template.structure
              : (hasLegacyChildren ? jsonData.children : null));

          if (!sourceChildren || sourceChildren.length === 0) {
            console.warn('⚠️ Нет данных для загрузки дерева (нет ни children, ни template.structure)');
            return;
          }
          
          // ������ ������������ � ������ ��� appendUnder (������� ������ �� ������ ������� ������ � ��. ������).
          if (!appendUnder) {
          const childrenContainer = document.getElementById('constructor-root-module-children');
          if (childrenContainer) {
            childrenContainer.innerHTML = '';
            }
          }
          
          // Конвертация элемента template.structure в UI-узел (для режима без legacy children)
          function templateItemToNodeData(item) {
            if (!item || typeof item !== 'object') return null;
            const t = String(item.type || '').toLowerCase();
            const name = item.name || (t === 'wall' ? 'Элемент' : t === 'facade' ? 'Фасад' : t === 'module' ? 'Элемент' : t === 'model' ? 'Элемент' : t === 'furniture' ? '���������' : 'Элемент');
            
            // Модуль из референса (двери, полки, ТОП, накладки): в рефе в дереве отображаются жирным, у нас — как деталь с originalType 'module'
            if (t === 'module') {
              // Сохраняем размеры как есть из JSON (могут быть выражения, числа или undefined)
              const size = item.size ? {
                x: item.size.x !== undefined && item.size.x !== null ? item.size.x : '',
                y: item.size.y !== undefined && item.size.y !== null ? item.size.y : '',
                z: item.size.z !== undefined && item.size.z !== null ? item.size.z : ''
              } : { x: '', y: '', z: '' };
              
              // Сохраняем позицию как есть из JSON (могут быть выражения, числа или 0)
              const position = item.pos ? {
                x: item.pos.x !== undefined && item.pos.x !== null ? item.pos.x : 0,
                y: item.pos.y !== undefined && item.pos.y !== null ? item.pos.y : 0,
                z: item.pos.z !== undefined && item.pos.z !== null ? item.pos.z : 0
              } : { x: 0, y: 0, z: 0 };
              
              const moduleNodeData = {
                type: 'detail',
                name,
                originalType: 'module',
                size,
                position,
                anchor: item.pivot || { x: -1, y: -1, z: -1 },
                rotation: item.rot || { x: '0', y: '0', z: '0' },
                c_rot: item.c_rot || { x: '0', y: '0', z: '0' },
                // События
                events: item.events || {
                  on_before_params: '',
                  on_before_build: '',
                  on_after_build: '',
                  on_drag_end: ''
                },
                // Комплектующие
                accessories: Array.isArray(item.accessories) ? item.accessories : [],
                // Прочие поля из референса
                spec: item.spec || {},
                visible: item.visible !== undefined ? !!item.visible : true,
                active: item.active !== undefined ? !!item.active : true,
                modelId: item.spec?.id ? String(item.spec.id) : '',
                modelKey: item.spec?.key || '',
              };
              
              console.log('[CLD][JSON→UI] Модуль загружен из JSON:', name, {
                originalType: 'module',
                // ⭐ ВАЖНО: показываем что именно пришло из JSON референса
                json_size: item.size,
                json_pos: item.pos,
                json_pivot: item.pivot,
                json_spec: item.spec,
                // Что мы сохранили
                saved_size: size,
                saved_position: position,
                saved_anchor: moduleNodeData.anchor
              });
              
              return moduleNodeData;
            }
            
            // Фасад из референса: сохраняем pos/spec/pivot как есть, чтобы в превью не съезжали
            if (t === 'facade') {
              return {
                type: 'detail',
                name,
                originalType: 'facade',
                size: item.size || { x: '', y: '', z: '' },
                position: item.pos || { x: 0, y: 0, z: 0 },
                anchor: item.pivot || { x: -1, y: -1, z: -1 },
                rotation: item.rot || { x: '0', y: '0', z: '0' },
                c_rot: item.c_rot || { x: '0', y: '0', z: '0' },
                spec: item.spec || {},
                visible: item.visible !== undefined ? !!item.visible : true,
                active: item.active !== undefined ? !!item.active : true,
                modelId: item.spec?.id ? String(item.spec.id) : '',
              };
            }
            
            // Комплектующие: model и furniture — это 3D модели из библиотеки (загружаются по spec.id)
            if (t === 'model' || t === 'furniture') {
              return {
                type: 'detail', // в UI они отображаются как детали
                name,
                originalType: t, // сохраняем исходный тип для экспорта
                // spec.id — это ID модели в библиотеке (нужно загрузить из библиотеки моделей)
                modelId: item.spec?.id || item.spec?.key || '',
                modelKey: item.spec?.key || '',
                modelMats: item.spec?.model_mats || {},
                // позиция и ротация комплектующего
                size: item.size || { x: '', y: '', z: '' },
                position: item.pos || { x: '0', y: '0', z: '0' },
                anchor: item.pivot || { x: -1, y: -1, z: -1 },
                rotation: item.rot || { x: '0', y: '0', z: '0' },
                c_rot: item.c_rot || { x: '0', y: '0', z: '0' },
                // события
                events: item.events || {
                  on_before_params: '',
                  on_before_build: '',
                  on_after_build: '',
                  on_drag_end: ''
                },
                // прочие поля из референса (сохраняем для совместимости)
                spec: item.spec || {},
                visible: item.visible !== undefined ? !!item.visible : true,
                active: item.active !== undefined ? !!item.active : true,
                current: Array.isArray(item.current) ? item.current : [],
              };
            }
            
            if (t === 'wall') {
              // Материал из spec.material (формат референса)
              const specMat = item.spec?.material || {};
              const material_id = specMat.id ? String(specMat.id) : (item.material_id || '');
              const material_key = specMat.key || item.material_key || '';
              const material_group = specMat.group || item.material_group || '';
              
              return {
                type: 'detail',
                name,
                // стараемся восстановить ключевые поля для UI
                detailType: item.spec?.detailTypeId || '',
                orientation: item.spec?.orientation || 'h',
                fill_key: item.spec?.side || item.spec?.key || '',
                // сохраняем исходные движковые поля, чтобы не потерять данные при последующем сохранении
                size: item.size || { x: '', y: '', z: '' },
                position: item.pos || { x: '0', y: '0', z: '0' },
                anchor: item.pivot || { x: -1, y: -1, z: -1 },
                rotation: item.rot || { x: '0', y: '0', z: '0' },
                edges: item.edges || {},
                // материал (из spec.material или прямые поля)
                material_id,
                material_key,
                material_group,
                material: specMat || item.material || {},
                // события
                events: item.events || {
                  on_before_params: '',
                  on_before_build: '',
                  on_after_build: '',
                  on_drag_end: ''
                },
                // комплектующие
                accessories: Array.isArray(item.accessories) ? item.accessories : [],
                // прочие поля из референса (сохраняем для совместимости)
                spec: item.spec || {},
                visible: item.visible !== undefined ? !!item.visible : true,
                active: item.active !== undefined ? !!item.active : true,
              };
            }
            // section/module/������ �������� ��� ������ � UI
            return {
              type: 'section',
              name,
              active: item.active !== undefined ? !!item.active : true,
              visible: item.visible !== undefined ? !!item.visible : true,
              // ВАЖНО: section в Clodis — это контейнер, ему нужны size/pos/pivot/rot,
              // иначе после reload значения "прыгают" и поля в свойствах пустые.
              size: item.size || { x: '', y: '', z: '' },
              position: item.pos || item.position || { x: '0', y: '0', z: '0' },
              anchor: item.pivot || item.anchor || { x: -1, y: -1, z: -1 },
              rotation: item.rot || item.rotation || { x: '0', y: '0', z: '0' },
              sectionLayoutRole:
                typeof window.__cldNormalizeSectionLayoutRole === 'function'
                  ? window.__cldNormalizeSectionLayoutRole(item.layout_role ?? item.sectionLayoutRole)
                  : String(item.layout_role ?? item.sectionLayoutRole ?? '').trim(),
              children: Array.isArray(item.children) ? item.children.map(templateItemToNodeData).filter(Boolean) : [],
            };
          }

          // Функция для рекурсивного создания узлов
          function createNodeFromData(nodeData, parentNode) {
            if (!nodeData) return null;
            
            // ���������� ��� ����
            const nodeType = nodeData.type === 'detail' ? 'detail' : 'section';
            
            // Создаем узел
            const newNode = createConstructorTreeNode(nodeType, parentNode);
            
            // Устанавливаем данные
            if (nodeData.id) {
              newNode.setAttribute('data-node-id', nodeData.id);
            }
            if (nodeData.name) {
              newNode.setAttribute('data-node-name', nodeData.name);
              newNode.nodeData.name = nodeData.name;
              
              // Обновляем название в дереве
              const nameElement = newNode.querySelector('.tree-node-name');
              if (nameElement) {
                nameElement.textContent = nodeData.name;
              }
            }
            
            // Заполняем базовые свойства
            newNode.nodeData.hide_when_filled = nodeData.hide_when_filled || false;
            newNode.nodeData.active = nodeData.active !== undefined ? nodeData.active : true;
            newNode.nodeData.article = nodeData.article || '';
            newNode.nodeData.originalType = nodeData.originalType || nodeData.type;
            if (nodeData.originalType) {
              newNode.setAttribute('data-original-type', nodeData.originalType);
              // �������� ��������� originalType ��� �������
              if (nodeData.originalType === 'module') {
                console.log('[CLD][UI] ���� ������ � originalType=module:', nodeData.name, {
                  nodeType,
                  originalType: newNode.nodeData.originalType,
                  hasAttribute: newNode.hasAttribute('data-original-type'),
                  attributeValue: newNode.getAttribute('data-original-type')
                });
              }
            }
            // Комплектующие (для всех типов узлов)
            if (Array.isArray(nodeData.accessories)) {
              newNode.nodeData.accessories = nodeData.accessories.map(acc => ({
                id: String(acc.id || ''),
                name: String(acc.name || ''),
                sku: String(acc.sku || acc.article || ''),
                category: String(acc.category || ''),
                count: Number(acc.count || 1),
                c: Number(acc.c || 1)
              }));
            } else {
              newNode.nodeData.accessories = [];
            }
            
            // Если это деталь, заполняем специфичные поля
            if (nodeType === 'detail' && nodeData) {
              newNode.nodeData.orientation = nodeData.orientation || 'h';
              newNode.nodeData.shape = nodeData.shape || 'normal';
              newNode.nodeData.material = nodeData.material || {};
              newNode.nodeData.rotate = nodeData.rotate || false;
              newNode.nodeData.fixed = nodeData.fixed || false;
              // Копируем edges по значению, иначе несколько деталей делят один объект
              newNode.nodeData.edges = JSON.parse(JSON.stringify(nodeData.edges || {}));
              // Сохраняем размеры как есть из JSON (могут быть выражения, числа или undefined)
              newNode.nodeData.size = nodeData.size ? {
                x: nodeData.size.x !== undefined ? nodeData.size.x : '',
                y: nodeData.size.y !== undefined ? nodeData.size.y : '',
                z: nodeData.size.z !== undefined ? nodeData.size.z : ''
              } : { x: '', y: '', z: '' };
              newNode.nodeData.position = nodeData.position || { x: '0', y: '0', z: '0' };
              newNode.nodeData.anchor = nodeData.anchor || { x: 0, y: 0, z: 0 };
              newNode.nodeData.rotation = nodeData.rotation || { x: '0', y: '0', z: '0' };
              if (nodeData.c_rot && typeof nodeData.c_rot === 'object') {
                newNode.nodeData.c_rot = {
                  x: nodeData.c_rot.x || '0',
                  y: nodeData.c_rot.y || '0',
                  z: nodeData.c_rot.z || '0',
                };
              }
              newNode.nodeData.comments = nodeData.comments || '';
              // События: если пришли из референса, используем их, иначе дефолт
              if (nodeData.events && typeof nodeData.events === 'object') {
                newNode.nodeData.events = {
                  on_before_params: nodeData.events.on_before_params || '',
                  on_before_build: nodeData.events.on_before_build || '',
                  on_after_build: nodeData.events.on_after_build || '',
                  on_drag_end: nodeData.events.on_drag_end || ''
                };
              } else {
                newNode.nodeData.events = {
                  on_before_params: '',
                  on_before_build: '',
                  on_after_build: '',
                  on_drag_end: ''
                };
              }
              newNode.nodeData.fill_key = nodeData.fill_key || '';
              newNode.nodeData.consider_size = nodeData.consider_size || false;
              newNode.nodeData.consider_cuts = nodeData.consider_cuts || false;
              newNode.nodeData.consider_intersections = nodeData.consider_intersections || false;

              // Доп. поля совместимости (если пришли из template.structure или референса)
              if (nodeData.detailType) newNode.nodeData.detailType = nodeData.detailType;
              // Комплектующие уже загружены выше для всех типов узлов
              if (nodeData.material_id) newNode.nodeData.material_id = nodeData.material_id;
              if (nodeData.material_key) newNode.nodeData.material_key = nodeData.material_key;
              if (nodeData.material_group) newNode.nodeData.material_group = nodeData.material_group;
              if (nodeData.material && typeof nodeData.material === 'object') newNode.nodeData.material = nodeData.material;
              if (nodeData.spec && typeof nodeData.spec === 'object') newNode.nodeData.spec = nodeData.spec;
              if (nodeData.visible !== undefined) newNode.nodeData.visible = !!nodeData.visible;
              // Комплектующие (model/furniture/module): сохраняем originalType и связанные поля
              if (nodeData.originalType === 'model' || nodeData.originalType === 'furniture' || nodeData.originalType === 'module') {
                newNode.nodeData.originalType = nodeData.originalType;
                newNode.setAttribute('data-original-type', nodeData.originalType); // Устанавливаем атрибут для CSS (жирный текст для модулей)
                if (nodeData.modelId) newNode.nodeData.modelId = String(nodeData.modelId);
                if (nodeData.modelKey) newNode.nodeData.modelKey = String(nodeData.modelKey);
                if (nodeData.modelMats && typeof nodeData.modelMats === 'object') newNode.nodeData.modelMats = nodeData.modelMats;
                if (Array.isArray(nodeData.current)) newNode.nodeData.current = nodeData.current;
                // Для модулей сохраняем c_rot (дополнительный поворот)
                if (nodeData.originalType === 'module' && nodeData.c_rot && typeof nodeData.c_rot === 'object') {
                  newNode.nodeData.c_rot = {
                    x: nodeData.c_rot.x || '0',
                    y: nodeData.c_rot.y || '0',
                    z: nodeData.c_rot.z || '0'
                  };
                } else if (nodeData.c_rot && typeof nodeData.c_rot === 'object') {
                  newNode.nodeData.c_rot = nodeData.c_rot;
                }
              }
            }

            // ��������� ������������ section ���� (size/pos/anchor/rotation),
            // чтобы properties panel не показывал пустые значения при пересборке из JSON.
            if (nodeType === 'section' && nodeData) {
              newNode.nodeData.size = nodeData.size ? {
                x: nodeData.size.x !== undefined ? nodeData.size.x : '',
                y: nodeData.size.y !== undefined ? nodeData.size.y : '',
                z: nodeData.size.z !== undefined ? nodeData.size.z : '',
              } : { x: '', y: '', z: '' };

              newNode.nodeData.position = nodeData.position || nodeData.pos || { x: '0', y: '0', z: '0' };

              // UI ���������� anchor (pivot) ��� ����� �������.
              newNode.nodeData.anchor = nodeData.anchor || nodeData.pivot || { x: -1, y: -1, z: -1 };

              newNode.nodeData.rotation = nodeData.rotation || nodeData.rot || { x: '0', y: '0', z: '0' };
              const lr0 = nodeData.sectionLayoutRole ?? nodeData.layout_role;
              newNode.nodeData.sectionLayoutRole =
                typeof window.__cldNormalizeSectionLayoutRole === 'function'
                  ? window.__cldNormalizeSectionLayoutRole(lr0)
                  : String(lr0 || '').trim();
            }
            
            // Добавляем узел в дерево
            addTreeNodeToParent(newNode, parentNode);
        // ��������� ������ � iframe ��� ������ ����������
        if (typeof window.__ppPostModuleToIframe === 'function') {
          window.__ppPostModuleToIframe();
        }
            
            // Рекурсивно создаем дочерние элементы
            if (nodeData.children && Array.isArray(nodeData.children)) {
              nodeData.children.forEach(childData => {
                createNodeFromData(childData, newNode);
              });
            }
            
            return newNode;
          }
          
          // Создаем узлы из данных
          const rootModule = document.getElementById('constructor-root-module');
          // ��������������� �������� �������� ������ � ������ ��� ������ ��������, �� ��� ������������ ���������.
          if (!appendUnder && rootModule) {
            rootModule.nodeData = rootModule.nodeData || {};
            {
              const nameEl = document.getElementById('constructor-root-module-name');
              const catalogNameInput = document.getElementById('catalog-item-edit-name');
              const fromJson = jsonData.name != null && String(jsonData.name).trim();
              const fromCatalog =
                catalogNameInput && String(catalogNameInput.value || '').trim();
              let fromFirstSection = '';
              if (Array.isArray(sourceChildren) && sourceChildren.length > 0) {
                const n0 = sourceChildren[0]?.name;
                if (n0 != null && String(n0).trim()) fromFirstSection = String(n0).trim();
              }
              const rootLabel = fromJson || fromCatalog || fromFirstSection;
              if (rootLabel) {
                rootModule.nodeData.name = rootLabel;
                if (nameEl) nameEl.textContent = rootLabel;
              }
            }
            if (jsonData.variables && typeof jsonData.variables === 'object') {
              const main = (jsonData.variables.main && typeof jsonData.variables.main === 'object') ? jsonData.variables.main : {};
              const groups = Array.isArray(jsonData.variables.groups) ? jsonData.variables.groups : null;
              if (groups) {
                rootModule.nodeData.variables = { groups: groups.map((g) => ({
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
                })) };
              } else {
                rootModule.nodeData.variables = { main: { ...(main || {}) } };
              }
            } else if (rootModule.nodeData.variables == null) {
              rootModule.nodeData.variables = { groups: [] };
            }

            // Шаблоны: восстановление списка, если пришёл из JSON
            if (Array.isArray(jsonData.templates)) {
              rootModule.nodeData.templates = jsonData.templates.map((t) => ({
                id: t.id || ('tpl_' + Math.random().toString(36).slice(2)),
                name: t.name || '',
                article: t.article || '',
                min: (t.min && typeof t.min === 'object') ? t.min : { w: 0, h: 0, d: 0 },
                max: (t.max && typeof t.max === 'object') ? t.max : { w: 0, h: 0, d: 0 },
                accessories: Array.isArray(t.accessories) ? t.accessories : [],
                constructor_structure: t.constructor_structure || {},
              }));
              rootModule.nodeData.selectedTemplateId = jsonData.selectedTemplateId || rootModule.nodeData.templates?.[0]?.id || null;
            }

            // Материалы: восстановление overrides
            if (jsonData.materials_overrides && typeof jsonData.materials_overrides === 'object') {
              rootModule.nodeData.materials_overrides = jsonData.materials_overrides;
              try {
                window.__cldMaterialsState = window.__cldMaterialsState || { groupOverrides: {} };
                window.__cldMaterialsState.groupOverrides = { ...(jsonData.materials_overrides || {}) };
              } catch {}
            }

            if (Array.isArray(jsonData.material_groups)) {
              rootModule.nodeData.material_groups = jsonData.material_groups;
            }
          }
          // Всегда конвертируем через templateItemToNodeData: и legacy (children), и template.structure.
          // Иначе type: "facade" из референса не превращается в detail+originalType facade и фасады «съезжают».
          const childrenForLoad = sourceChildren.map(templateItemToNodeData).filter(Boolean);
          
          // Логируем загруженные модули для отладки
          const loadedModules = childrenForLoad.filter(c => c.originalType === 'module');
          if (loadedModules.length > 0) {
            console.log('[CLD][JSON→UI] Загружено модулей из JSON:', loadedModules.length, loadedModules.map(m => ({
              name: m.name,
              originalType: m.originalType,
              size: m.size,
              position: m.position,
              anchor: m.anchor
            })));
          }

          const parentForNodes = appendUnder || rootModule;
          if (!parentForNodes) {
            console.warn('⚠️ Нет родителя для вставки дерева (root / appendUnder)');
            return;
          }
          childrenForLoad.forEach((childData) => {
            createNodeFromData(childData, parentForNodes);
          });
          
          if (typeof syncTreePaths === 'function') syncTreePaths();
          
          // ����� ���������� ������ �� JSON ������ ����������� �� �������� ����������.
          // ��������������� ����� �� ���� ����� ������ (guard-���� ������ attachTreeNodeHandlers).
          try {
            const nodes = document.querySelectorAll('.constructor-tree-node');
            nodes.forEach((n) => {
              if (typeof attachTreeNodeHandlers === 'function' && n && n.dataset?.cldHandlersAttached !== '1') {
                attachTreeNodeHandlers(n);
              }
            });
          } catch (_) {}
          
          // ��������� ������ ����� �������� ����� ������ (������, ������ ������ ���������)
          if (typeof window.__ppPostModuleToIframe === 'function') {
            window.__ppPostModuleToIframe();
          }

          // UX fix: ����������� ��������� (path/id), ����� ������ ������� �� "��������"
          if (prevSelectedId || prevSelectedPath) {
            setTimeout(() => {
              try {
                if (prevSelectedPath) {
                  const nodes = document.querySelectorAll('.constructor-tree-node');
                  const restoredByCldPath = Array.from(nodes).find((n) => String(n.dataset?.cldPath || '') === String(prevSelectedPath));
                  if (restoredByCldPath) {
                    if (typeof selectTreeNode === 'function') selectTreeNode(restoredByCldPath);
                    else if (typeof updateConstructorPropertiesPanel === 'function') updateConstructorPropertiesPanel(restoredByCldPath);
                    return;
                  }
                }

                if (prevSelectedId) {
                  const nodes = document.querySelectorAll('.constructor-tree-node');
                  const restoredById = Array.from(nodes).find((n) => String(n.getAttribute('data-node-id')) === String(prevSelectedId));
                  if (restoredById) {
                    if (typeof selectTreeNode === 'function') selectTreeNode(restoredById);
                    else if (typeof updateConstructorPropertiesPanel === 'function') updateConstructorPropertiesPanel(restoredById);
                  }
                }
              } catch (e) {
                // ignore
              }
            }, 0);
          }
        }
        
        // Экспортируем функции для использования в других местах
        window.getConstructorTreeJSON = getConstructorTreeJSON;
        window.loadConstructorTreeFromJSON = loadConstructorTreeFromJSON;

        // 3D превью через iframe (ensureClodisPreviewMounted) по умолчанию отключено,
        // чтобы не тянуть тяжёлый движок и не плодить лишние сетевые запросы.
        // При необходимости превью можно включить из консоли:
        //   window.ensureClodisPreviewMounted && window.ensureClodisPreviewMounted();
        //   window.__ppPostModuleToIframe && window.__ppPostModuleToIframe();

        // Дебаунс синхронизации по изменению размеров (как в референсе — с задержкой)
        const wIn = document.getElementById('catalog-item-edit-width');
        const hIn = document.getElementById('catalog-item-edit-height');
        const dIn = document.getElementById('catalog-item-edit-depth');
        const key = '__cld_size_sync_attached';
        if (wIn && !wIn[key]) {
          let t = null;
          const schedule = () => {
            if (t) clearTimeout(t);
            t = setTimeout(() => {
              // как в референсе: применяем ограничения (min/max) до синхронизации
              try { window.__cldClampMainSizeInputs && window.__cldClampMainSizeInputs(); } catch {}
              if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
            }, 250);
          };
          wIn.addEventListener('input', schedule);
          hIn && hIn.addEventListener('input', schedule);
          dIn && dIn.addEventListener('input', schedule);
          wIn[key] = true;
        }

        // Референс: при загрузке панель свойств скрыта (показывается только placeholder)
        if (typeof updateConstructorPropertiesPanel === 'function') {
          updateConstructorPropertiesPanel(rootModule);
        }

        // ��������� iframe-������ �� ��������� � ���������
        if (typeof window.ensureClodisPreviewMounted === 'function') {
          window.ensureClodisPreviewMounted();
        }
      }

      // Глобальный хелпер, который использует НОВЫЙ initConstructorTab вместо старого.
      // Используется из разных мест (загрузка элемента, сброс JSON и т.п.),
      // чтобы гарантированно инициализировать конструктор один раз.
      window.__cldInitConstructorTab = function __cldInitConstructorTab() {
        try {
          if (!window.__CLD_CONSTRUCTOR_INITIALIZED && typeof initConstructorTab === 'function') {
            initConstructorTab();
          }
        } catch (e) {
          console.error('[CLD] __cldInitConstructorTab error', e);
          window.__CLD_CONSTRUCTOR_INITIALIZED = false;
        }
      };

      // ===== Clodis (референс) 3D engine: безопасное превью через iframe (constructor-clodis.html) =====
      function buildClodisTemplateTreeFromDom(rootContainer) {
        // Для iframe-превью используем только числа: любые выражения/строки заменяем на fallback,
        // чтобы движок референса не падал на парсинге атрибутов (например, w1h1a1).
        const toNumSafe = (v, fallback) => {
          const n = Number(v);
          return Number.isFinite(n) ? n : fallback;
        };

        function nodeToParams(nodeEl, parentNode = null) {
          const nodeType = nodeEl.getAttribute('data-node-type') || 'section';
          const nodeId = nodeEl.getAttribute('data-node-id') || '';
          const nd = nodeEl.nodeData || {};

          const isSection = nodeType === 'section';
          // В референсе корневая/контейнерная секция — fill_section, деталь — wall
          const ppType = isSection ? 'fill_section' : 'wall';

          const size = nd.size || {};
          const pos = nd.position || {};
          const rot = nd.rotation || {};
          const hasAnchor = !!nd.anchor;
          const isZeroAnchor =
            hasAnchor &&
            Number(nd.anchor?.x) === 0 &&
            Number(nd.anchor?.y) === 0 &&
            Number(nd.anchor?.z) === 0;
          const useAnchor = hasAnchor && (nd.anchor_user_set || !isZeroAnchor);
          let pivot = useAnchor ? nd.anchor : { x: -1, y: -1, z: -1 };
          
          // Для деталей: если нет явной позиции, используем выражения из detailType
          let detailPos = pos;
          if (!isSection && (nd.detailType || nodeEl.getAttribute('data-detail-type'))) {
            const detailTypeId = nd.detailType || nodeEl.getAttribute('data-detail-type');
            
            // ⭐ ВАЖНО: Устанавливаем правильный pivot на основе detailTypeId (как в __ppBuildClodisTemplateTreeFromDom)
            // Но: если пользователь уже задал anchor — не перетираем его.
            // Если anchor отсутствует ИЛИ это старый "нулевой" anchor без пользовательского изменения —
            // применяем дефолт pivot по типу детали.
            if (detailTypeId && (!useAnchor)) {
              if (detailTypeId === 'vertical_left') {
                pivot = { x: -1, y: -1, z: -1 }; // Нижний левый дальний угол детали (референс: default pivot)
              } else if (detailTypeId === 'vertical_right') {
                pivot = { x: 1, y: -1, z: -1 };
              } else if (detailTypeId === 'vertical_middle') {
                pivot = { x: 0, y: -1, z: -1 };
              } else if (detailTypeId === 'horizontal_top') {
                pivot = { x: -1, y: 1, z: -1 };
              } else if (detailTypeId === 'horizontal_bottom') {
                pivot = { x: -1, y: -1, z: -1 };
              } else if (detailTypeId === 'horizontal_middle') {
                pivot = { x: -1, y: 0, z: -1 };
              } else if (detailTypeId === 'front_front') {
                pivot = { x: -1, y: -1, z: 1 };
              } else if (detailTypeId === 'front_middle') {
                pivot = { x: -1, y: -1, z: 0 };
              }
            }
            
            // Если позиция не задана явно, вычисляем из выражений detailType
            if (!pos.x && !pos.y && !pos.z) {
              // Референс (legacy): для vertical_left pos.z = s:z. В clean-room используем @section.depth.
              // Но здесь мы работаем с числовыми значениями, поэтому нужно получить размеры секции
              const parentSize = parentNode?.nodeData?.size || { x: 300, y: 400, z: 200 };
              const materialThickness = 16; // g:g0.thickness (обычно 16мм)
              
              if (detailTypeId === 'vertical_left') {
                // ⭐ ИСПРАВЛЕНИЕ: Если pivot детали в нижней левой дальней точке (x=-1, y=-1, z=-1),
                // то pos.x = 0 и pos.z = 0 (деталь прижата к левому и заднему краю секции)
                detailPos = {
                  x: 0, // ⭐ ИСПРАВЛЕНО: было materialThickness, теперь 0
                  y: 0, // для вертикальных всегда 0
                  z: 0  // ⭐ ИСПРАВЛЕНО: было parentSize.z, теперь 0
                };
              } else if (detailTypeId === 'vertical_right') {
                detailPos = {
                  x: parentSize.x - materialThickness, // (@section.width) - thickness
                  y: 0,
                  z: parentSize.z // @section.depth
                };
              } else if (detailTypeId === 'horizontal_top') {
                detailPos = {
                  x: materialThickness, // g:g0.thickness
                  y: parentSize.y - materialThickness, // (@section.height) - thickness
                  z: parentSize.z // @section.depth
                };
              } else if (detailTypeId === 'horizontal_bottom') {
                detailPos = {
                  x: materialThickness, // g:g0.thickness
                  y: 0,
                  z: parentSize.z // @section.depth
                };
              } else {
                // Для других типов используем значения по умолчанию
                detailPos = { x: 0, y: 0, z: 0 };
              }
            }
          }

          const item = {
            type: ppType,
            name: nd.name || (isSection ? 'Секция' : 'Деталь'),
            id: nodeId || nd.id || '',
            active: nd.active === false ? 0 : 1,
            // ВАЖНО: size/pos могут быть выражениями (@section.width и т.п.) — не превращаем в числа,
            // иначе ориентация будет меняться, а габариты останутся "фолбэками" 300/400/200.
            size: {
              x: toNumOrExpr(size.x, 300),
              y: toNumOrExpr(size.y, 400),
              z: toNumOrExpr(size.z, 200)
            },
            pos: {
              x: toNumOrExpr(detailPos.x, 0),
              y: toNumOrExpr(detailPos.y, 0),
              z: toNumOrExpr(detailPos.z, 0)
            },
            pivot: {
              x: Number.isFinite(Number(pivot.x)) ? Number(pivot.x) : -1,
              y: Number.isFinite(Number(pivot.y)) ? Number(pivot.y) : -1,
              z: Number.isFinite(Number(pivot.z)) ? Number(pivot.z) : -1
            },
            rot: {
              x: toNumOrExpr(rot.x, 0),
              y: toNumOrExpr(rot.y, 0),
              z: toNumOrExpr(rot.z, 0)
            },
            children: []
          };

          // ⭐ ВАЖНО: Если это деталь и есть выбранный тип детали, добавляем spec с detailTypeId
          if (!isSection && (nd.detailType || nodeEl.getAttribute('data-detail-type'))) {
            const detailTypeId = nd.detailType || nodeEl.getAttribute('data-detail-type');
            const detailTypeName = nd.detailTypeName || 'Деталь';
            // В iframe-движке референса orientation ∈ {'v','h','f'}.
            // ⭐ ИСПРАВЛЕНИЕ: Приоритет spec.orientation > orientation > detailOrientation
            // Референс: orientation хранится в spec.orientation
            let detailOrientationRaw = nd.spec?.orientation || nd.orientation || nd.detailOrientation || 'vertical';
            // Нормализуем: 'vertical'/'horizontal'/'frontal' → 'v'/'h'/'f'
            const detailOrientation =
              detailOrientationRaw === 'vertical' ? 'v' :
              detailOrientationRaw === 'horizontal' ? 'h' :
              detailOrientationRaw === 'frontal' ? 'f' :
              detailOrientationRaw; // Если уже 'v', 'h', 'f' - оставляем как есть
            const detailPosition = nd.detailPosition || 'vertical-left';
            
            // В Clodis детали имеют spec.detailTypeId для определения типа детали
            item.spec = {
              detailTypeId: detailTypeId,
              orientation: detailOrientation,
              position: detailPosition,
              ...(nd.materialId ? { material: { key: nd.materialId } } : {})
            };
            
            // ⭐ ВАЖНО: Логируем позицию детали относительно секции
            const parentSectionSize = parentNode?.nodeData?.size || { x: 300, y: 400, z: 200 };
            const detailPosX_mm = item.pos.x;
            const detailPosY_mm = item.pos.y;
            const detailPosZ_mm = item.pos.z;
            
            // Вычисляем где деталь должна быть в секции (по формуле референса)
            const sectionCenterX = -parentSectionSize.x / 2;
            const sectionCenterY = -parentSectionSize.y / 2;
            const sectionCenterZ = -parentSectionSize.z / 2;
            
            const detailPositionX = (sectionCenterX + detailPosX_mm) / 1000;
            const detailPositionY = (sectionCenterY + detailPosY_mm) / 1000;
            const detailPositionZ = (sectionCenterZ + detailPosZ_mm) / 1000;
            // Проверка правильности позиции для vertical_left
            if (detailTypeId === 'vertical_left') {
              // ⭐ ИСПРАВЛЕНО: Если pivot детали в нижней левой дальней точке (x=-1, y=-1, z=-1),
              // то деталь должна быть прижата к левому и заднему краю секции
              const expectedPosX = 0; // ⭐ ИСПРАВЛЕНО: было 16 (толщина материала), теперь 0
              const expectedPosY = 0; // для вертикальных всегда 0
              const expectedPosZ = 0; // ⭐ ИСПРАВЛЕНО: было parentSectionSize.z (передний край), теперь 0 (задний край)
              
              // Визуальное описание позиции
              const sectionWidth = parentSectionSize.x;
              const sectionHeight = parentSectionSize.y;
              const sectionDepth = parentSectionSize.z;
              
              const leftEdge = sectionCenterX / 1000;
              const rightEdge = (sectionCenterX + sectionWidth) / 1000;
              const bottomEdge = sectionCenterY / 1000;
              const topEdge = (sectionCenterY + sectionHeight) / 1000;
              const backEdge = sectionCenterZ / 1000;
              const frontEdge = (sectionCenterZ + sectionDepth) / 1000;
              // Проверка: если деталь не на левом краю, это ошибка
              if (detailPosX_mm !== expectedPosX) {
                console.error('[CLD][detail] ❌ ОШИБКА: Деталь НЕ на левом краю!', {
                  expected: `${expectedPosX}mm от левого края (прижата к левому краю)`,
                  actual: `${detailPosX_mm}mm от левого края`,
                  difference: `${Math.abs(detailPosX_mm - expectedPosX)}mm`
                });
              }
              
              // Проверка: если деталь не на заднем краю, это ошибка
              if (detailPosZ_mm !== expectedPosZ) {
                console.error('[CLD][detail] ❌ ОШИБКА: Деталь НЕ на заднем краю!', {
                  expected: `${expectedPosZ}mm от заднего края (прижата к заднему краю)`,
                  actual: `${detailPosZ_mm}mm от заднего края`,
                  difference: `${Math.abs(detailPosZ_mm - expectedPosZ)}mm`
                });
              }
            }
          }

          if (isSection) {
            const childrenContainer = nodeEl.querySelector(':scope > .tree-node-children');
            if (childrenContainer) {
              const directChildren = Array.from(childrenContainer.children).filter(ch => ch.classList?.contains('constructor-tree-node'));
              directChildren.forEach(childEl => item.children.push(nodeToParams(childEl, nodeEl)));
            }
          }

          return item;
        }

        const nodes = Array.from(rootContainer.children).filter(ch => ch.classList?.contains('constructor-tree-node'));
        return nodes.map(nodeEl => nodeToParams(nodeEl, null));
      }

      function buildClodisModuleParamsFromUI() {
        const widthInput = document.getElementById('catalog-item-edit-width');
        const heightInput = document.getElementById('catalog-item-edit-height');
        const depthInput = document.getElementById('catalog-item-edit-depth');

        const w = widthInput ? Number(widthInput.value) || 300 : 300;
        const h = heightInput ? Number(heightInput.value) || 400 : 400;
        const d = depthInput ? Number(depthInput.value) || 200 : 200;

        const childrenRoot = document.getElementById('constructor-root-module-children');
        let tree = childrenRoot ? buildClodisTemplateTreeFromDom(childrenRoot) : [];
        
        // Логируем все детали в дереве для проверки позиционирования
        function logDetailsInTree(items, depth = 0, parentSectionSize = { x: w, y: h, z: d }) {
          items.forEach(item => {
            if (item.type === 'wall' && item.spec?.detailTypeId) {
              // Вычисляем где деталь находится в секции
              const sectionCenterX = -parentSectionSize.x / 2;
              const sectionCenterY = -parentSectionSize.y / 2;
              const sectionCenterZ = -parentSectionSize.z / 2;
              
              const detailPosX_m = (sectionCenterX + item.pos.x) / 1000;
              const detailPosY_m = (sectionCenterY + item.pos.y) / 1000;
              const detailPosZ_m = (sectionCenterZ + item.pos.z) / 1000;
              // Специальная проверка для vertical_left
              if (item.spec.detailTypeId === 'vertical_left') {
                // ⭐ ИСПРАВЛЕНО: Если pivot детали в нижней левой дальней точке (x=-1, y=-1, z=-1),
                // то деталь должна быть прижата к левому и заднему краю секции
                const expectedX = 0; // ⭐ ИСПРАВЛЕНО: было 16 (толщина материала), теперь 0
                const expectedY = 0;
                const expectedZ = 0; // ⭐ ИСПРАВЛЕНО: было parentSectionSize.z (передний край), теперь 0 (задний край)
                
                if (item.pos.x !== expectedX || item.pos.y !== expectedY || item.pos.z !== expectedZ) {
                  console.error('[CLD][detail] ❌ ОШИБКА: vertical_left в неправильной позиции!', {
                    expected: { x: expectedX, y: expectedY, z: expectedZ },
                    actual: item.pos,
                    problem: item.pos.x !== expectedX ? `НЕ на левом краю (должно быть ${expectedX}мм, т.е. прижата к левому краю)!` : 
                             item.pos.z !== expectedZ ? `НЕ на заднем краю (должно быть ${expectedZ}мм, т.е. прижата к заднему краю)!` : 
                             `Позиция Y неправильная (должно быть ${expectedY}мм от низа)!`
                  });
                } else {
                }
              }
            }
            
            // Обновляем размер секции для дочерних элементов
            const currentSectionSize = item.type === 'fill_section' ? item.size : parentSectionSize;
            
            if (item.children && item.children.length > 0) {
              logDetailsInTree(item.children, depth + 1, currentSectionSize);
            }
          });
        }
        
        if (tree && tree.length > 0) {
          logDetailsInTree(tree);
        }

        // Если дерево пустое, используем дефолтный шаблон из референса (db.json / templates[0].template.tree)
        if (!tree || tree.length === 0) {
          tree = [
            {
              "type": "fill_section",
              "name": "Наполняемая секция",
              "id": "",
              "lib": "",
              "tags": "",
              "interactive": 0,
              "spec": [],
              "custom": [],
              "children": [
                {
                  "type": "wall",
                  "name": "Деталь",
                  "id": "",
                  "lib": "",
                  "tags": "",
                  "interactive": 0,
                  "spec": {
                    "name": "",
                    "code": "",
                    "orientation": "v",
                    "group": "wall",
                    "type": "common",
                    "type_params": [],
                    "points": [],
                    "butts": [],
                    "key": "left",
                    "shape": null,
                    "material": {
                      "group": "g0",
                      "key": "material_2",
                      "id": 0,
                      "variant_id": 0,
                      "rotated": 0
                    }
                  },
                  "custom": [],
                  "children": [],
                  "condition": null,
                  "visible": 0,
                  "helpers_visible": 0,
                  "active": 1,
                  "variables": {
                    "visible": 1,
                    "main": []
                  },
                  "interaction": {
                    "auto_rotation": 1,
                    "check_intersection": 0,
                    "raycast": 1
                  },
                  "resizable": {
                    "enabled": 0,
                    "locks": [],
                    "minmax": {
                      "min": { "x": 0, "y": 0, "z": 0 },
                      "max": { "x": 0, "y": 0, "z": 0 }
                    }
                  },
                  "size": { "x": "@section.width", "y": "@section.height", "z": "$wall.thickness" },
                  "pos": { "x": 0, "y": 0, "z": 0 },
                  "pivot": { "x": -1, "y": -1, "z": -1 },
                  "rot": { "x": 0, "y": 0, "z": 0 },
                  "c_rot": { "x": 0, "y": 0, "z": 0 },
                  "events": {
                    "on_before_params": "",
                    "on_before_build": "",
                    "on_after_build": "",
                    "on_drag_end": ""
                  }
                }
              ],
              "condition": null,
              "visible": 0,
              "helpers_visible": 0,
              "active": 1,
              "variables": {
                "visible": 1,
                "main": []
              },
              "interaction": {
                "auto_rotation": 1,
                "check_intersection": 0,
                "raycast": 1
              },
              "resizable": {
                "enabled": 0,
                "locks": [],
                "minmax": {
                  "min": { "x": 0, "y": 0, "z": 0 },
                  "max": { "x": 0, "y": 0, "z": 0 }
                }
              },
              "size": { "x": "@section.width", "y": "@section.height", "z": "@section.depth" },
              "pos": { "x": 0, "y": 0, "z": 0 },
              "pivot": { "x": -1, "y": -1, "z": -1 },
              "rot": { "x": 0, "y": 0, "z": 0 },
              "c_rot": { "x": 0, "y": 0, "z": 0 },
              "events": {
                "on_before_params": "",
                "on_before_build": "",
                "on_after_build": "",
                "on_drag_end": ""
              }
            }
          ];
        }

        // Минимально необходимая структура параметров для Module (extends CabinetSection)
        return {
          type: 'module',
          name: '(элемент без названия)',
          id: 'module_root',
          size: { x: w, y: h, z: d },
          pos: { x: 0, y: 0, z: 0 },
          pivot: { x: -1, y: -1, z: -1 },
          rot: { x: 0, y: 0, z: 0 },
          active: 1,
          interactive: 1,
          variables: { main: {} },
          // Новый формат дерева
          template: { structure: tree },
          spec: {
            template: { tree }
          }
        };
      }

      let __ppPreviewIframe = null;
      let __ppPreviewIframeReady = false;

      // ===== Clean-room preview sync (constructor-clodis.html) =====
      // Для нашего превью используем типы: section/wall (минимально), без комнаты.
      function __ppBuildClodisTemplateTreeFromDom(rootContainer) {
        const toNumOrExpr = (v, fallbackExpr) => {
          if (v === undefined || v === null) return fallbackExpr;
          const s = String(v).trim();
          if (s === '') return fallbackExpr;
          const n = Number(s);
          return Number.isFinite(n) ? n : s; // allow expressions like "@section.width"
        };

        // � iframe ��������� ���� "@section.width/height/depth" �� �����������,
            // loadConstructorTreeFromJSON: сначала даём переменным из модуля s:x/s:y/s:z и размерам
        const normalizeSectionRefSyntaxForPreview = (tree) => {
          if (!Array.isArray(tree) || tree.length === 0) return tree;

          const replace = (str) => {
            if (typeof str !== 'string') return str;
            return str
              .replace(/@section\.width\b/g, 's:x')
              .replace(/@section\.height\b/g, 's:y')
              .replace(/@section\.depth\b/g, 's:z');
          };

          const visited = new Set();
          const walk = (obj) => {
            if (!obj || typeof obj !== 'object') return;
            if (visited.has(obj)) return;
            visited.add(obj);

            if (Array.isArray(obj)) {
              obj.forEach(walk);
              return;
            }

            for (const [k, v] of Object.entries(obj)) {
              if (typeof v === 'string') obj[k] = replace(v);
              else if (v && typeof v === 'object') walk(v);
            }
          };

          walk(tree);
          return tree;
        };

        // ������������ �������� ����� ��� ������: ����� iframe ��������� �� ��,
        // ��� ������� � JSON-�������� (s:y-32 / s:y-16 � �.�.).
        // ����� ������ ���������� �� DOM-�������� � ������� "Элемент".
        const normalizeSimpleWardrobeRefSyntax = (tree) => {
          if (!Array.isArray(tree) || tree.length === 0) return tree;

          const targets = new Set([
            'horizontal_bottom',
            'horizontal_top',
            'horizontal_middle',
            'vertical_left',
            'vertical_right',
            'back_front',
          ]);

          const thickness = 16;
          const bottomMinus = 2 * thickness; // 32

          const toNum = (v) => {
            if (typeof v === 'number') return v;
            if (typeof v === 'string') {
              const n = Number(v);
              return Number.isFinite(n) ? n : NaN;
            }
            return NaN;
          };

          const inferDetailTypeId = (it) => {
            const typ = String(it?.type || '').toLowerCase();
            if (typ === 'section' || typ === 'fill_section') return null;
            const ori = it?.spec?.orientation;
            const px = toNum(it?.pivot?.x);
            const py = toNum(it?.pivot?.y);
            if (ori === 'h') {
              if (py === -1) return 'horizontal_bottom';
              if (py === 0) return 'horizontal_middle';
              if (py === 1) return 'horizontal_top';
            }
            if (ori === 'v') {
              if (px === -1) return 'vertical_left';
              if (px === 1) return 'vertical_right';
            }
            if (ori === 'f') return 'back_front';
            return null;
          };

          const getDetailTypeIdForNode = (it) => {
            const dt0 = it?.spec?.detailTypeId;
            if (typeof dt0 === 'string' && targets.has(dt0)) return dt0;
            return inferDetailTypeId(it);
          };

          const found = new Set();
          const walk = (node) => {
            if (!node || typeof node !== 'object') return;
            const dt = getDetailTypeIdForNode(node);
            if (typeof dt === 'string' && targets.has(dt)) found.add(dt);
            if (Array.isArray(node.children)) node.children.forEach(walk);
          };
          tree.forEach(walk);

          const basicTargets = ['horizontal_top', 'vertical_left', 'vertical_right'];
          const basicCount = basicTargets.reduce(
            (acc, t) => acc + (found.has(t) ? 1 : 0),
            0,
          );

          // ������ ��� "�������� �����": ����� �� ������ ������������� �������.
          if (basicCount < 2) return tree;

          const applyToNode = (it) => {
            if (!it || typeof it !== 'object') return;
            const typ = String(it.type || '').toLowerCase();
            if (typ === 'section' || typ === 'fill_section') return;
            const dt = getDetailTypeIdForNode(it);
            if (typeof dt !== 'string') return;
            if (!targets.has(dt)) return;

            it.size = it.size || {};
            it.pos = it.pos || {};
            it.pivot = it.pivot || {};

            if (dt === 'vertical_left' || dt === 'vertical_right') {
              it.size.x = 's:x';
              it.size.y = `s:y-${bottomMinus}`;
              it.size.z = 's:z';

              it.pos.x = dt === 'vertical_left' ? 0 : 's:x';
              it.pos.y = '16';
              it.pos.z = 0;

              it.pivot.x = dt === 'vertical_left' ? -1 : 1;
              it.pivot.y = -1;
              it.pivot.z = -1;
              return;
            }

            if (dt === 'horizontal_top') {
              const nm = String(it.name || '');
              const isTop1Name = /Топ\s*1/i.test(nm) || /\btop\s*1\b/i.test(nm);
              const isTop2Name = /Топ\s*2/i.test(nm) || /\btop\s*2\b/i.test(nm);

              it.size.x = 's:x';
              it.size.y = 's:y';
              it.size.z = 's:z';

              it.pos.x = 0;
              it.pos.z = 0;
              it.pos.y = isTop1Name ? `s:y-${thickness}` : (isTop2Name ? 's:y' : 's:y');

              it.pivot.x = -1;
              it.pivot.y = 1;
              it.pivot.z = -1;
              return;
            }

            if (dt === 'horizontal_bottom') {
              it.size.x = 's:x';
              it.size.y = 's:y';
              it.size.z = 's:z';

              it.pos.x = 0;
              it.pos.y = 0;
              it.pos.z = 0;

              it.pivot.x = -1;
              it.pivot.y = -1;
              it.pivot.z = -1;
              return;
            }

            if (dt === 'horizontal_middle') {
              it.size.x = 's:x-32';
              it.size.y = 's:y';
              it.size.z = 's:z-5';
              it.pos.x = 16;
              it.pos.y = 's:y / 2';
              it.pos.z = 5;
              it.pivot.x = -1;
              it.pivot.y = 0;
              it.pivot.z = -1;
              return;
            }

            if (dt === 'back_front') {
              it.size.x = 's:x';
              it.size.y = 's:y';
              it.size.z = 's:z';
              it.pos.x = 0;
              it.pos.y = 0;
              it.pos.z = -3;
              it.pivot.x = -1;
              it.pivot.y = -1;
              it.pivot.z = -1;
              return;
            }
          };

          const walkApply = (node) => {
            if (!node || typeof node !== 'object') return;
            applyToNode(node);
            if (Array.isArray(node.children)) node.children.forEach(walkApply);
          };

          tree.forEach(walkApply);
          return tree;
        };

        // Дефолты берём из общего clean-room helper (UI и превью должны совпадать 1:1).
        function getDetailDefaults(detailTypeId) {
          if (typeof window.__cldGetDetailDefaults === 'function') {
            return window.__cldGetDetailDefaults(detailTypeId);
          }
          return null;
        }

        function nodeToParams(nodeEl, path) {
          const nodeType = nodeEl.getAttribute('data-node-type') || 'section';
          const nd = nodeEl.nodeData || {};
          const name = nd.name || nodeEl.getAttribute('data-node-name') || (nodeType === 'detail' ? 'Деталь' : 'Секция');
          const active = nd.active === false ? 0 : 1;
          if (path) nodeEl.dataset.cldPath = path;

          if (nodeType === 'section') {
            const size = nd.size || {};
            const pos = nd.position || {};
            const pathStr = path != null ? String(path) : '';
            const isSubSection = pathStr.indexOf(',') !== -1;
            if (isSubSection) {
              ['x', 'y', 'z'].forEach((axis) => {
                const v = size[axis];
                if (v === undefined || v === null || String(v).trim() === '') {
                  console.warn(
                    '[CLD][export] Подсекция "' +
                      (name || '') +
                      '" (path ' +
                      pathStr +
                      '): пустой size.' +
                      axis +
                      ' — в JSON уйдёт как у корня (s:' +
                      axis +
                      '). Сначала удалите их или переместите.'
                  );
                }
              });
            }

            // loadConstructorTreeFromJSON: сначала даём переменным из модуля s:x/s:y/s:z и размерам
            const lrRaw = nd.sectionLayoutRole ?? nd.layout_role;
            const layout_role =
              typeof window.__cldNormalizeSectionLayoutRole === 'function'
                ? window.__cldNormalizeSectionLayoutRole(lrRaw)
                : String(lrRaw || '').trim();

            const item = {
              type: 'section', // fill_section ������
              name,
              active,
              size: {
                // В превью (iframe) используем s:x/s:y/s:z, т.к. @section.* там не вычисляется.
                x: toNumOrExpr(size.x, 's:x'), // по умолчанию размер корневой
                y: toNumOrExpr(size.y, 's:y'), // по умолчанию размер корневой
                z: toNumOrExpr(size.z, 's:z')  // по умолчанию размер корневой
              },
              pos: {
                x: toNumOrExpr(pos.x, 0),
                y: toNumOrExpr(pos.y, 0),
                z: toNumOrExpr(pos.z, 0)
              },
              pivot: { x: -1, y: -1, z: -1 },
              rot: { x: 0, y: 0, z: 0 },
              spec: { orientation: 'f' }, // ��������: �� ��������� 'f' (front) ��� ������
              ...(layout_role ? { layout_role } : {}),
              children: []
            };

            const childrenContainer = nodeEl.querySelector(':scope > .tree-node-children');
            if (childrenContainer) {
              const directChildren = Array.from(childrenContainer.children).filter(ch => ch.classList?.contains('constructor-tree-node'));
              directChildren.forEach((childEl, childIdx) => {
                const childParams = nodeToParams(childEl, `${path},${childIdx}`);
                if (childParams) {
                  item.children.push(childParams);
                  if (childParams.type === 'wall' && childParams.spec?.detailTypeId) {
                  }
                }
              });
            }
            return item;
          }

          // detail → wall, facade или module (для превью: type: 'facade' даёт CabinetFacadeNode, type: 'module' → fill_module)
          // Референс: модули с element_type: "dveri_shkaf" (двери) остаются как type: 'module' с spec.direction
          const isDoorModule = nd.originalType === 'module' && nd.spec?.element_type === 'dveri_shkaf';
          const isFacade = nd.originalType === 'facade' || (nd.originalType !== 'module' && (nd.modelId || nd.spec?.id || (String(nd.name || name || '').indexOf('Фасад') !== -1)));
          const isModule = nd.originalType === 'module'; // ��� ������ (������� �����) ���������� ��� type: 'module'
          
          // Модуль из референса (двери, полки, ТОП): отправляем как type: 'module' в превью (fill_module)
          if (isModule) {
            // Референс: для модулей из JSON, если size.z не задан, используем конкретное значение (16мм)
            // ������ ��������� '@section.depth', �.�. ������ ������ ����� ������������� �������
            const sizeZ = nd.size?.z;
            const sizeZValue = (sizeZ === undefined || sizeZ === null || String(sizeZ).trim() === '') 
              ? 16  // ��������� ������� ������ (��� � ������)
              : toNumOrExpr(sizeZ, 16);
            
            // Референс: для модулей дверей (isDoorModule) добавляем spec.direction если его нет
            // В JSON у модулей дверей может не быть spec.direction, но для правильного позиционирования нужен '-z'
            const moduleSpec = { ...(nd.spec || {}) };
            if (isDoorModule && !moduleSpec.direction) {
              moduleSpec.direction = '-z'; // Передняя грань (фасад)
            }

            const modulePayload = {
              type: 'module',
              name,
              active,
              size: {
                // toNumOrExpr ������������ undefined/null/������ ������ � ���������� fallback
                x: toNumOrExpr(nd.size?.x, 's:x'),
                y: toNumOrExpr(nd.size?.y, 's:y'),
                z: sizeZValue
              },
              pos: {
                x: toNumOrExpr(nd.position?.x, 0),
                y: toNumOrExpr(nd.position?.y, 0),
                z: toNumOrExpr(nd.position?.z, isDoorModule ? 's:z-16' : 0)
              },
              pivot: nd.anchor || { x: -1, y: -1, z: -1 },
              rot: {
                x: toNumOrExpr(nd.rotation?.x, 0),
                y: toNumOrExpr(nd.rotation?.y, 0),
                z: toNumOrExpr(nd.rotation?.z, 0)
              },
              c_rot: nd.c_rot ? {
                x: toNumOrExpr(nd.c_rot.x, 0),
                y: toNumOrExpr(nd.c_rot.y, 0),
                z: toNumOrExpr(nd.c_rot.z, 0)
              } : undefined,
              spec: moduleSpec,
              children: []
            };

            return modulePayload;
          }
          
          // ⭐ ВАЖНО: Используем detailTypeId для правильного позиционирования
          const detailTypeId = nd.detailType || nodeEl.getAttribute('data-detail-type');
          const size = nd.size || {};
          const pos = nd.position || {};
          
          const fillKey = (nd.fill_key || '').toString().toLowerCase();
          
          // Референс: определяем side из fill_key (поддержка всех сторон)
          let side = 'back'; // по умолчанию
          if (fillKey === 'left' || fillKey === 'right' || fillKey === 'front' || fillKey === 'back' || 
              fillKey === 'top' || fillKey === 'bottom' || fillKey === 'center') {
            side = fillKey;
          } else if (detailTypeId === 'vertical_left') {
            side = 'left';
          } else if (detailTypeId === 'vertical_right') {
            side = 'right';
          } else if (detailTypeId === 'horizontal_top') {
            side = 'top';
          } else if (detailTypeId === 'horizontal_bottom') {
            side = 'bottom';
          }
          
          // Референс: определяем orientation и direction из spec или по умолчанию
          const detailOrientationRaw = nd.detailOrientation || (detailTypeId?.includes('horizontal') ? 'h' : 'v');
          const detailOrientation =
            detailOrientationRaw === 'vertical' ? 'v' :
            detailOrientationRaw === 'horizontal' ? 'h' :
            detailOrientationRaw === 'front' ? 'f' :
            detailOrientationRaw;
          const orientation = nd.spec?.orientation || detailOrientation || (fillKey === 'top' || fillKey === 'bottom' || fillKey === 'center' ? 'h' : 'v');
          // Для фасада на передней грани: direction '-z' (в превью pivot = задняя левая нижняя)
          const direction = nd.spec?.direction || (isFacade ? '-z' : 'z');

          // Если это один из 9 типов — подставляем дефолты как в документации.
          const dflt = detailTypeId ? getDetailDefaults(detailTypeId) : null;
          
          const resultPos = {
            x: toNumOrExpr(pos.x, dflt?.pos?.x ?? 0),
            y: toNumOrExpr(pos.y, dflt?.pos?.y ?? 0),
            z: toNumOrExpr(pos.z, dflt?.pos?.z ?? 0)
          };
          
          const result = {
            type: isFacade ? 'facade' : 'wall',
            name,
            active,
            size: {
              x: toNumOrExpr(size.x, dflt?.size?.x ?? 's:x'),
              y: toNumOrExpr(size.y, dflt?.size?.y ?? 's:y'),
              z: toNumOrExpr(size.z, dflt?.size?.z ?? '$wall.thickness')
            },
            pos: resultPos,
            pivot: (() => {
              // Используем пользовательский anchor, если он задан (и это не старый "нулевой" дефолт без клика).
              const hasAnchor = !!nd.anchor;
              const isZeroAnchor =
                hasAnchor &&
                Number(nd.anchor?.x) === 0 &&
                Number(nd.anchor?.y) === 0 &&
                Number(nd.anchor?.z) === 0;
              const useAnchor = hasAnchor && (nd.anchor_user_set || !isZeroAnchor);
              return useAnchor ? nd.anchor : (dflt?.pivot ?? { x: -1, y: -1, z: -1 });
            })(),
            rot: {
              x: toNumOrExpr(nd.rotation?.x ?? 0, 0),
              y: toNumOrExpr(nd.rotation?.y ?? 0, 0),
              z: toNumOrExpr(nd.rotation?.z ?? 0, 0)
            },
            spec: { 
              orientation, 
              direction, 
              side: dflt?.spec?.side ?? side,
              ...(detailTypeId ? { detailTypeId } : {}),
              ...(isFacade && (nd.modelId || nd.spec?.id) ? { id: String(nd.modelId || nd.spec?.id || '') } : {}),
              // ВАЖНО: не перетирать ориентацию, выбранную в свойствах.
              // Дефолт из пресета применяем только если у детали нет своей orientation.
              ...((nd?.spec?.orientation || nd?.orientation) ? {} : (dflt?.spec?.orientation ? { orientation: dflt.spec.orientation } : {})),
              // Референс: передаем edge_numbering как spec.show_index (в референсе это spec.show_index)
              ...(nd.edge_numbering !== undefined ? { show_index: nd.edge_numbering !== false } : {}),
              // Референс: для модулей-дверей передаем element_type и другие поля из spec
              ...(isDoorModule && nd.spec ? { element_type: nd.spec.element_type, ...nd.spec } : {})
            },
            // Референс: добавляем accessories (как в REFERENCE_ACCESSORIES_CODE.js)
            ...(nd.accessories && nd.accessories.length > 0 ? { accessories: nd.accessories } : {}),
            // Материалы: как в референсе, у детали всегда есть группа (по умолчанию g0),
            // иначе в превью будет использоваться только vars._wt и не будет реакции на g:g0.thickness.
            ...(nd.material_id ? { material_id: nd.material_id } : {}),
            material_key: (typeof window.__cldNormalizeMaterialKey === 'function' ? window.__cldNormalizeMaterialKey(nd.material_key || nd.materialKey) : (nd.material_key || nd.materialKey)) || 'material_2',
            material_group: (nd.material_group || nd.materialGroup || 'g0'),
            ...(() => {
              let icon = nd.material_icon || nd.materialIcon;
              if (!icon && nd.material_id && (nd.material_key || nd.materialKey)) {
                const lib = window.__cldMaterialsLib;
                const mk = nd.material_key || nd.materialKey || 'material_2';
                const item = Array.isArray(lib?.itemsByKey?.[mk]) ? lib.itemsByKey[mk].find(x => String(x.id) === String(nd.material_id)) : null;
                icon = (item?.texture || item?.texture_url || item?.image || item?.icon) || '';
              }
              return icon ? { material_icon: icon } : {};
            })(),
            // Референс: передаем edges в конструктор (используется в CabinetWallNode._build_edges)
            ...(nd.edges && Object.keys(nd.edges).length > 0 ? { edges: (() => {
              const out = {};
              for (let i = 1; i <= 4; i++) {
                if (nd.edges[i] && nd.edges[i].enabled) {
                  out[i] = {
                    enabled: true,
                    thickness: parseFloat(nd.edges[i].thickness) || 0.2,
                    type: nd.edges[i].type || 'butts',
                    ...(nd.edges[i].type_name ? { type_name: nd.edges[i].type_name } : {}),
                    ...(nd.edges[i].color ? { color: nd.edges[i].color } : {}),
                    ...(nd.edges[i].icon ? { icon: nd.edges[i].icon } : {}),
                    ...(nd.edges[i].decor_id ? { decor_id: nd.edges[i].decor_id } : {}),
                    ...(nd.edges[i].decor_name ? { decor_name: nd.edges[i].decor_name } : {}),
                    ...(nd.edges[i].edge_id ? { edge_id: nd.edges[i].edge_id } : {}),
                    ...(nd.edges[i].edge_name ? { edge_name: nd.edges[i].edge_name } : {})
                  };
                }
              }
              try {
                const logNodeId = nodeEl?.getAttribute && nodeEl.getAttribute('data-node-id');
              } catch (e) {
                console.warn('[CLD][edge][nodeToParams] log failed', e);
              }
              return out;
            })() } : {}),
            // Референс: передаем edge_numbering для отображения номеров кромок
            ...(nd.edge_numbering !== undefined ? { edge_numbering: nd.edge_numbering !== false } : {})
          };
          
 
          return result;
        }

        const nodes = Array.from(rootContainer.children).filter(ch => ch.classList?.contains('constructor-tree-node'));
        const tree = nodes.map((nodeEl, idx) => nodeToParams(nodeEl, `0,${idx}`));
        try {
          if (window.__CLD_REF_SIMPLE_WARDROBE_NORMALIZE === true) {
            normalizeSimpleWardrobeRefSyntax(tree);
          }
          normalizeSectionRefSyntaxForPreview(tree);
        } catch (_) {}
        return tree;
      }

      // ��������: debounce ��� ������������� ����� �� ����������� ���������
      let __ppSyncTimeout = null;
      function __ppSyncPreviewToIframe() {
        if (!__ppPreviewIframe || !__ppPreviewIframe.contentWindow) return;
        // �� ����� � iframe ����� ����� ����, ��� ������ ������ ��� ������ �� iframe (������� ��������)
        if (window.__ppSuppressSyncUntil && Date.now() < window.__ppSuppressSyncUntil) return;

        // ��������� ��������� DOM-������ � ����� �� clodisJSONReady, ����� �� ������������ ���������.
        window.__ppTreeReloadSuppressedUntil = Date.now() + 1400;
        
        // Референс: привязываем обработчики к уже существующим узлам при загрузке
        if (__ppSyncTimeout) {
          clearTimeout(__ppSyncTimeout);
        }
        
        // Референс: привязываем обработчики к уже существующим узлам при загрузке
        __ppSyncTimeout = setTimeout(() => {
          __ppSyncTimeout = null;

          try {
            const sn =
              (typeof currentSelectedNode !== 'undefined' && currentSelectedNode) ||
              window.__cldCurrentSelectedNode ||
              window.currentSelectedNode;
            if (sn && typeof saveConstructorNodeData === 'function') saveConstructorNodeData(sn);
          } catch (_) {}
          
          const widthInput = document.getElementById('catalog-item-edit-width');
          const heightInput = document.getElementById('catalog-item-edit-height');
          const depthInput = document.getElementById('catalog-item-edit-depth');

          const w = widthInput ? Number(widthInput.value) || 300 : 300;
          const h = heightInput ? Number(heightInput.value) || 400 : 400;
          const d = depthInput ? Number(depthInput.value) || 200 : 200;

          const rootModule = document.getElementById('constructor-root-module');
          const childrenRoot = document.getElementById('constructor-root-module-children');
          const treeFromDom = childrenRoot ? __ppBuildClodisTemplateTreeFromDom(childrenRoot) : [];
          const hasDomTree = Array.isArray(treeFromDom) && treeFromDom.length > 0;
          let tree = hasDomTree
            ? treeFromDom
            : ((rootModule?.nodeData?.clodisJSON) ?? (rootModule?.nodeData?.constructor_structure) ?? []);
          if (tree == null) tree = [];
          if (hasDomTree && rootModule) {
            rootModule.nodeData = rootModule.nodeData || {};
            rootModule.nodeData.clodisJSON = treeFromDom;
          }
          // Извлекаем массив из legacy constructor_structure (template.structure / spec.template.tree), если пришёл объект
          if (tree && typeof tree === 'object' && !Array.isArray(tree)) {
            const arr = tree.template?.structure ?? tree.spec?.template?.tree;
            if (Array.isArray(arr) && arr.length) tree = arr;
          }
          const hasTree = (Array.isArray(tree) && tree.length > 0) || (tree && typeof tree === 'object' && !Array.isArray(tree));
          // Логи только при отладке (window.__CLD_DEBUG = true)
          if (window.__CLD_DEBUG && hasTree && Array.isArray(tree)) {
            const modulesInTree = [];
            const walkTree = (items, path = '') => {
              items.forEach((item, idx) => {
                const currentPath = path ? `${path}[${idx}]` : `[${idx}]`;
                if (item.type === 'module') {
                  modulesInTree.push({ path: currentPath, name: item.name, size: item.size, pos: item.pos, pivot: item.pivot });
                }
                if (item.children && item.children.length > 0) {
                  walkTree(item.children, `${currentPath}.children`);
                }
              });
            };
            walkTree(tree);
            console.log('[CLD][Preview] Дерево для превью:', {
              totalItems: tree.length,
              modulesFound: modulesInTree.length,
              modules: modulesInTree,
              fullTree: tree
            });
          }
          
          // Логи координат деталей только при __CLD_DEBUG
          if (window.__CLD_DEBUG && hasTree && Array.isArray(tree)) {
            function logDetailCoordinatesInTree(items, sectionSize, depth = 0) {
              items.forEach(item => {
                if (item.type === 'wall' && item.spec?.detailTypeId) {
                  const detailX_mm = typeof item.pos?.x === 'number' ? item.pos.x : 0;
                  const detailY_mm = typeof item.pos?.y === 'number' ? item.pos.y : 0;
                  const detailZ_mm = typeof item.pos?.z === 'number' ? item.pos.z : 0;
                  
                  // Вычисляем координаты детали относительно секции (в метрах для Three.js)
                  const sectionLeft_m = -sectionSize.x / 2000; // -w/2 в метрах
                  const sectionRight_m = sectionSize.x / 2000; // w/2 в метрах
                  const sectionBottom_m = -sectionSize.y / 2000; // -h/2 в метрах
                  const sectionTop_m = sectionSize.y / 2000; // h/2 в метрах
                  const sectionBack_m = -sectionSize.z / 2000; // -d/2 в метрах
                  const sectionFront_m = sectionSize.z / 2000; // d/2 в метрах
                  
                  const detailX_m = (sectionLeft_m * 1000 + detailX_mm) / 1000;
                  const detailY_m = (sectionBottom_m * 1000 + detailY_mm) / 1000;
                  const detailZ_m = (sectionBack_m * 1000 + detailZ_mm) / 1000;
                  // Специальная проверка для vertical_left
                  if (item.spec.detailTypeId === 'vertical_left') {
                    // ⭐ ИСПРАВЛЕНО: Если pivot детали в нижней левой дальней точке (x=-1, y=-1, z=-1),
                    // то деталь должна быть прижата к левому и заднему краю секции
                    const expectedX = 0; // ⭐ ИСПРАВЛЕНО: было 16 (толщина материала), теперь 0
                    const expectedY = 0;
                    const expectedZ = 0; // ⭐ ИСПРАВЛЕНО: было sectionSize.z (передний край), теперь 0 (задний край)
                    if (detailX_mm !== expectedX || detailY_mm !== expectedY || detailZ_mm !== expectedZ) {
                      console.error('[CLD][detail] ❌ ОШИБКА: vertical_left в НЕПРАВИЛЬНОЙ позиции!', {
                        should_be: `${expectedX}мм от левого края (прижата к левому краю), ${expectedY}мм от низа, ${expectedZ}мм от заднего (прижата к заднему краю)`,
                        actually_is: `${detailX_mm}мм от левого, ${detailY_mm}мм от низа, ${detailZ_mm}мм от заднего`,
                        problem: detailX_mm !== expectedX ? `НЕ на левом краю (должно быть ${expectedX}мм от левого края, т.е. прижата к левому краю)!` : 
                                 detailZ_mm !== expectedZ ? `НЕ на заднем краю (должно быть ${expectedZ}мм от заднего, т.е. прижата к заднему краю)!` : 
                                 `Позиция Y неправильная (должно быть ${expectedY}мм от низа)!`
                      });
                    } else {
                    }
                  }
                }
                
                // Рекурсивно проверяем дочерние элементы
                if (item.children && item.children.length > 0) {
                  const childSectionSize = item.type === 'section' ? {
                    x: typeof item.size?.x === 'number' ? item.size.x : sectionSize.x,
                    y: typeof item.size?.y === 'number' ? item.size.y : sectionSize.y,
                    z: typeof item.size?.z === 'number' ? item.size.z : sectionSize.z
                  } : sectionSize;
                  logDetailCoordinatesInTree(item.children, childSectionSize, depth + 1);
                }
              });
            }
            
            const sectionSize = { x: w, y: h, z: d };
            logDetailCoordinatesInTree(tree, sectionSize);
          }

          // 1) ������ ������
          __ppPreviewIframe.contentWindow.postMessage({ type: 'cld:setSize', sizeMm: { w, h, d } }, '*');
          // 1.1) vars/materials (толщины/материалы групп)
          try {
            // Включаем отладку материалов в iframe, если включен общий debug в админке
            if (window.__CLD_DEBUG || window.__CLD_DEBUG_MATERIALS) {
              __ppPreviewIframe.contentWindow.postMessage({ type: 'cld:setDebug', flags: { materials: true } }, '*');
            }
            const payload = (typeof window.__cldBuildMaterialsPayload === 'function')
              ? window.__cldBuildMaterialsPayload()
              : (window.__cldMaterialsLib ? (function(){
                  // fallback — повторяем логику локально
                  const lib = window.__cldMaterialsLib;
                  const st = window.__cldMaterialsState || { groupOverrides: {} };
                  const out = {};
                  for (const g of lib.groups || []) {
                    const key = g.key;
                    if (!key) continue;
                    const ov = st.groupOverrides?.[key] || {};
                    const materialKey = (typeof window.__cldNormalizeMaterialKey === 'function' ? window.__cldNormalizeMaterialKey(ov.material_key || g.material) : (ov.material_key || g.material)) || (lib?.keys?.[0]?.key) || 'material_2';
                    const materialId = ov.material_id || 0;
                    const thickness = Number(ov.thickness ?? g.thickness ?? 16);
                    out[key] = { thickness, material: { key: materialKey, id: materialId, variant_id: 0 } };
                  }
                  const g0t = out.g0?.thickness ?? 16;
                  return { vars: { _wt: Number(g0t) || 16 }, materials: out };
                })() : { vars: { _wt: 16 }, materials: {} });

            // Переменные модуля (из вкладки "Переменные") добавляем в ctx.vars,
            // но НЕ перетираем системный _wt (он идёт из материалов g0 и управляет толщиной).
            // �����: ����� �������� legacy main{} � groups[].vars[] �������� variables.main
            // ��������� (��. getRootNodeData). ������� ������ ���������� ����� �� ���� ����:
            // 1) legacy variables.main (���� ����);
            // 2) variables.groups[].vars[] � ������� ������, ����� h_bottom/h_top ��������
            //    � ������ � ������ ������� �������� (����� ������� v:h_bottom ������ 0
            //    � ������ ���������� � ���� �� ������� �����).
            const moduleVars = (() => {
              const root = document.getElementById('constructor-root-module');
              const out = {};
              const main = root?.nodeData?.variables?.main;
              if (main && typeof main === 'object') {
                for (const [k, v] of Object.entries(main)) {
                  const key = String(k || '').trim();
                  if (!key || key === '_wt') continue;
                  const n = Number(v);
                  if (!Number.isFinite(n)) continue;
                  out[key] = n;
                }
              }
              const groups = root?.nodeData?.variables?.groups;
              if (Array.isArray(groups)) {
                for (const g of groups) {
                  if (!g || g.enabled === false) continue;
                  for (const v of (g.vars || [])) {
                    if (!v || v.enabled === false) continue;
                    const key = String(v.key || '').trim();
                    if (!key || key === '_wt') continue;
                    if (Object.prototype.hasOwnProperty.call(out, key)) continue;
                    const cur = Number(v.value);
                    const def = Number(v.default);
                    const n = Number.isFinite(cur) ? cur : (Number.isFinite(def) ? def : NaN);
                    if (!Number.isFinite(n)) continue;
                    out[key] = n;
                  }
                }
              }
              return out;
            })();
            const mergedVars = { ...(moduleVars || {}), ...(payload.vars || {}) };

            __ppPreviewIframe.contentWindow.postMessage({ type: 'cld:setVars', vars: mergedVars }, '*');
            __ppPreviewIframe.contentWindow.postMessage({ type: 'cld:setMaterials', materials: payload.materials || {} }, '*');

            if (window.__CLD_DEBUG) {
              const thickIn = document.getElementById('catalog-constructor-property-material-thickness');
            }
          } catch {}

          // Если библиотека материалов ещё не загрузилась — догружаем и пересинхронизируем (один раз).
          if (!window.__cldMaterialsLib && !window.__cldMaterialsLoading && typeof window.__cldEnsureMaterialsLoaded !== 'function') {
            // no-op
          }
          if (!window.__cldMaterialsLib && !window.__cldMaterialsLoading && typeof window.__cldEnsureMaterialsLoaded === 'function') {
            window.__cldEnsureMaterialsLoaded()
              .then(() => {
                if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
              })
              .catch(() => {});
          }
          // 2) ��������/��������� ������ �� ������� ������
          __ppPreviewIframe.contentWindow.postMessage({ type: 'cld:toggleModule', on: !!hasTree }, '*');
          // 3) ������: ������ (clodisJSON) ��� ������ (constructor_structure � iframe �������������)
          __ppPreviewIframe.contentWindow.postMessage({
            type: 'cld:setTemplateTree',
            tree: tree,
            structure: tree,
            sizeMm: { w, h, d }
          }, '*');
        }, 50); // Референс: небольшая задержка для батчинга изменений
      }

      // ��� �������� �������������: ��� ������ ������ ����� ���������������� ������ ���������
      window.__ppPostModuleToIframe = __ppSyncPreviewToIframe;
      window.__ppSyncPreviewToIframe = __ppSyncPreviewToIframe;
      // Утилита для управления iframe-превью из консоли/других хендлеров
      window.__ppToggleModuleToIframe = function(on) {
        if (!__ppPreviewIframe || !__ppPreviewIframe.contentWindow) return;
        __ppPreviewIframe.contentWindow.postMessage({ type: 'cld:toggleModule', on: !!on }, '*');
      };

      function ensureClodisPreviewMounted() {
        const viewport = document.getElementById('viewport');
        const previewBlock = document.getElementById('preview_block');
        if (!viewport) {
          console.error('[PREVIEW] viewport НЕ НАЙДЕН!');
          return;
        }

        viewport.setAttribute('data-preview', 'true');

        // если уже создано — просто обновляем параметры
        if (__ppPreviewIframe) {
          __ppPostModuleToIframe();
          return;
        }

        // создаём iframe внутри #viewport
        viewport.innerHTML = '';

        const iframe = document.createElement('iframe');
        iframe.setAttribute('title', 'Clodis Preview');
        iframe.setAttribute('loading', 'lazy');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = '0';
        iframe.style.display = 'block';

        // Clean-room 3D preview (наш движок), запускается из Vite.
        // Важно: может быть другой порт (5173). Общение идёт через postMessage.
        // Всё на одном порту (:8000) — превью открываем same-origin
        iframe.src = '/constructor-clodis.html?embedded=1&v=20260503-door-offset-prop';

        __ppPreviewIframe = iframe;
        viewport.appendChild(iframe);

        window.addEventListener('message', function onReady(ev) {
          if (ev?.data?.type !== 'cld:iframeReady') return;
          __ppPreviewIframeReady = true;
          window.removeEventListener('message', onReady);
          __ppPostModuleToIframe();
        });

        // ���� 1: iframe ������� clodisJSON � ������ ������ � ������� � ��������� � nodeData
        window.addEventListener('message', function onClodisJSONReady(ev) {
          if (ev?.data?.type !== 'cld:clodisJSONReady' || !Array.isArray(ev?.data?.clodisJSON)) return;
          const clodisJSON = ev.data.clodisJSON;
          const rootModule = document.getElementById('constructor-root-module');
          if (rootModule) {
            rootModule.nodeData = rootModule.nodeData || {};
            // Не восстанавливаем nodeData в DOM раньше времени, пока в DOM ещё идёт кадр (пользователь крутит дерево)
            const childrenRoot = document.getElementById('constructor-root-module-children');
            const treeFromDom = childrenRoot && typeof window.__ppBuildClodisTemplateTreeFromDom === 'function'
              ? window.__ppBuildClodisTemplateTreeFromDom(childrenRoot) : [];
            const skipTreeReload = window.__ppTreeReloadSuppressedUntil && Date.now() < window.__ppTreeReloadSuppressedUntil;
            try {
              const now = Date.now();
              const last = window.__cldDbgLastClodisJsonReadyTs || 0;
              const shouldLog = !last || (now - last) > 300;
              window.__cldDbgLastClodisJsonReadyTs = now;
              if (shouldLog) {
                const selEl = document.querySelector('.constructor-tree-item-selected');
                console.log('[CLD][clodisJSONReady][main]', {
                  skipTreeReload,
                  clodisJsonLen: Array.isArray(clodisJSON) ? clodisJSON.length : null,
                  treeFromDomLen: Array.isArray(treeFromDom) ? treeFromDom.length : null,
                  domNodes: document.querySelectorAll('.constructor-tree-node').length,
                  selectedNodeId: selEl?.getAttribute?.('data-node-id') || window.currentSelectedNode?.getAttribute?.('data-node-id') || '',
                  ppTreeReloadSuppressedUntil: window.__ppTreeReloadSuppressedUntil,
                });
              }
            } catch (_) {}
            // ���� ������ ��� � DOM � �� ������������ �� iframe (��� ��������� ����� ��� s:y).
            if (treeFromDom.length > 0) {
              rootModule.nodeData.clodisJSON = treeFromDom;
              return;
            }
            rootModule.nodeData.clodisJSON = clodisJSON;
          }
          // Не гоняй sync↔iframe 1.5 сек в одном кадре: iframe→дерево→sync→iframe→мерцание
          window.__ppSuppressSyncUntil = Date.now() + 1500;
          if (typeof window.__cldInitConstructorTab === 'function') window.__cldInitConstructorTab();
          if (typeof window.loadConstructorTreeFromJSON === 'function') {
            try {
              const selEl = document.querySelector('.constructor-tree-item-selected');
              console.log('[CLD][clodisJSONReady][main] calling loadConstructorTreeFromJSON', {
                selectedNodeId: selEl?.getAttribute?.('data-node-id') || window.currentSelectedNode?.getAttribute?.('data-node-id') || '',
              });
            } catch (_) {}
            const csVars = rootModule?.nodeData?.constructor_structure?.variables;
            const liveVars = rootModule?.nodeData?.variables;
            window.loadConstructorTreeFromJSON({
              template: { structure: clodisJSON },
              variables: csVars || liveVars || undefined,
              name:
                (document.getElementById('catalog-item-edit-name')?.value || '').trim() ||
                undefined,
            });
          }
        });

        iframe.addEventListener('load', function() {
          // fallback — если ready не прилетел, всё равно попробуем отправить params
          if (!__ppPreviewIframeReady) __ppPostModuleToIframe();
        });
      }
      window.ensureClodisPreviewMounted = ensureClodisPreviewMounted;

      // ⚠️ НЕ автозапускаем на window load: heavy engine может подвесить страницу на "Основные".
      // Стартуем только при открытии вкладки "Конструктор" (initConstructorTab() выше вызывает ensureClodisPreviewMounted()).
      
      // Загрузка данных элемента каталога для редактирования
      async function loadCatalogItemData(itemId, catalogType) {
        try {
          if (Number(itemId) > 0) window.__CLD_IS_NEW_MODULE = false;
          // Используем правильный endpoint с catalogType
          const response = await fetch(`/api/catalog/item/${catalogType}/${itemId}`);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const data = await response.json();
          
          if (window.catalogItemVueApp && data) {
            const _d = data.data && typeof data.data === "object" ? data.data : data;
            // Заполняем данные во Vue приложение
            window.catalogItemVueApp.item = {
              name: (_d.name ?? data.name) || '',
              category: (function () {
                const c = _d.category ?? data.category;
                const toNumId = (x) => {
                  if (x == null || x === '') return null;
                  if (typeof x === 'number' && Number.isFinite(x)) return x;
                  if (typeof x === 'string' && String(x).trim() !== '') {
                    const n = Number(String(x).trim());
                    return Number.isFinite(n) ? n : null;
                  }
                  if (typeof x === 'object' && x.id != null) {
                    const n = Number(x.id);
                    return Number.isFinite(n) ? n : null;
                  }
                  return null;
                };
                if (Array.isArray(c)) {
                  return c.map(toNumId).filter((id) => id != null);
                }
                const one = toNumId(c);
                return one != null ? [one] : [];
              })(),
              show_in_spec: (_d.show_in_spec ?? data.show_in_spec) !== undefined ? String(_d.show_in_spec ?? data.show_in_spec) : '1',
              include_nested: (_d.include_nested ?? data.include_nested) !== undefined ? String(_d.include_nested ?? data.include_nested) : '1',
              show_in_constructor: (_d.show_in_constructor ?? data.show_in_constructor) !== undefined ? String(_d.show_in_constructor ?? data.show_in_constructor) : '1',
              order: _d.order ?? data.order ?? 0,
              icon: (_d.icon ?? data.icon) || '',
              module_group: (_d.module_group ?? data.module_group) || 'bottom',
              drag_type: (_d.drag_type ?? data.drag_type) || 'top',
              stick_type: (_d.stick_type ?? data.stick_type) || 'common',
              is_fill: (_d.is_fill ?? data.is_fill) !== undefined ? String(_d.is_fill ?? data.is_fill) : '0',
              no_intersections: (_d.no_intersections ?? data.no_intersections) !== undefined ? String(_d.no_intersections ?? data.no_intersections) : '0',
              catalog_type: (_d.catalog_type ?? data.catalog_type) || '',
              width: _d.width ?? data.width ?? 300,
              height: _d.height ?? data.height ?? 400,
              depth: _d.depth ?? data.depth ?? 200,
              placementKind: (_d.placementKind ?? data.placementKind) || 'floor_in_niche'
            };
            console.log('[Шкаф] loadCatalogItemData:', itemId, catalogType);
            console.log('[Шкаф] API ответ data:', data);
            if (_d) console.log('[Шкаф] _d (источник):', { name: _d.name, width: _d.width, height: _d.height, depth: _d.depth, hasConstructor: !!(_d.constructor_structure ?? data.constructor_structure) });
            console.log('[Шкаф] Применено в форму item:', window.catalogItemVueApp?.item);
            // Один конструктор: 3D — iframe constructor-clodis.html; дерево и данные — rootModule.nodeData.clodisJSON (источник при сохранении — getConstructorTreeJSON).
            const rootModule = document.getElementById('constructor-root-module');
            if (rootModule) {
              const clodisJSON = _d.clodisJSON ?? (Array.isArray(_d.params) ? _d.params : null);
              let constructorStructure = _d.constructor_structure ?? data.constructor_structure ?? null;
              if (typeof constructorStructure === 'string') {
                try { constructorStructure = JSON.parse(constructorStructure); } catch (e) { constructorStructure = null; }
              }
              // ������ ������: �� clodisJSON ��� �� constructor_structure (����������� ������ � template.structure)
              let treeArray = Array.isArray(clodisJSON) && clodisJSON.length > 0 ? clodisJSON : null;
              if (!treeArray && constructorStructure && typeof constructorStructure === 'object') {
                treeArray = constructorStructure.template?.structure ?? constructorStructure.spec?.template?.tree ?? (Array.isArray(constructorStructure) ? constructorStructure : null);
              }
              if (!Array.isArray(treeArray)) treeArray = [];
              rootModule.nodeData = {
                clodisJSON: treeArray,
                constructor_structure: constructorStructure || null
              };
              if (treeArray.length > 0) {
                console.log('[Шкаф] Дерево загружено из API, узлов верхнего уровня:', treeArray.length);
                if (typeof window.loadConstructorTreeFromJSON === 'function') {
                  setTimeout(() => {
                    if (typeof window.__cldInitConstructorTab === 'function') window.__cldInitConstructorTab();
                    // Переменные живут в constructor_structure.variables — без них вкладка «Переменные» пустая.
                    const loadPayload = {
                      template: { structure: treeArray },
                    };
                    if (constructorStructure && typeof constructorStructure === 'object') {
                      if (constructorStructure.name) loadPayload.name = constructorStructure.name;
                      if (constructorStructure.variables) loadPayload.variables = constructorStructure.variables;
                      if (constructorStructure.material_groups) {
                        loadPayload.material_groups = constructorStructure.material_groups;
                      }
                      if (constructorStructure.materials_overrides) {
                        loadPayload.materials_overrides = constructorStructure.materials_overrides;
                      }
                      if (Array.isArray(constructorStructure.templates)) {
                        loadPayload.templates = constructorStructure.templates;
                      }
                      if (constructorStructure.selectedTemplateId != null) {
                        loadPayload.selectedTemplateId = constructorStructure.selectedTemplateId;
                      }
                    }
                    window.loadConstructorTreeFromJSON(loadPayload);
                  }, 150);
                }
              } else {
                console.log('[Шкаф] В ответе API нет дерева конструктора (constructor_structure/clodisJSON пусты или отсутствуют)');
              }
            }
          }
        } catch (error) {
          console.error('❌ Ошибка загрузки данных элемента каталога:', error);
        }
      }
      
      // Открытие страницы редактирования типа элемента (глобальная функция)
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
      }
      
      // �������� ������ ��� �������������� ���� ��������
      async function loadCatalogTypeEdit(itemId) {
        try {
          const itemIdInput = document.getElementById('catalog-type-item-id');
          const nameInput = document.getElementById('catalog-type-name');
          const orderInput = document.getElementById('catalog-type-order');
          const activeInput = document.getElementById('catalog-type-active');
          const titleElement = document.getElementById('catalog-type-edit-title');
          const submitUrlInput = document.getElementById('catalog-type-form_submit_url');
          
          if (!itemIdInput || !nameInput || !orderInput || !activeInput || !titleElement || !submitUrlInput) {
            console.error('❌ Элементы формы не найдены');
            return;
          }
          
          itemIdInput.value = itemId;
          
          if (itemId === '0' || itemId === 0) {
            // Режим добавления
            titleElement.textContent = 'Добавить Тип элемента';
            nameInput.value = '';
            orderInput.value = '0';
            activeInput.checked = true;
            submitUrlInput.value = '/api/catalog/item_add/catalogs_keys/';
          } else {
            // ����� ��������������
            titleElement.textContent = `Редактировать Тип элемента #${itemId}`;
            submitUrlInput.value = `/api/catalog/item_edit/catalogs_keys/${itemId}`;
            
            // ��������� ������ ��������
            const response = await fetch(`/api/catalog/item/catalogs_keys/${itemId}`);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const item = await response.json();
            nameInput.value = item.name || '';
            orderInput.value = item.order || '0';
            activeInput.checked = item.active !== undefined ? item.active == 1 : true;
          }
        } catch (error) {
          console.error('❌ Ошибка загрузки типа элемента:', error);
          alert(`Ошибка загрузки: ${error.message}`);
        }
      }
      
      // ���������� ���� �������� (JSON: Express �� ������ multipart ��� ����� ��������)
      async function saveCatalogType(exitAfterSave = false) {
        try {
          const itemId = document.getElementById('catalog-type-item-id').value;
          const name = document.getElementById('catalog-type-name').value;
          const order = document.getElementById('catalog-type-order').value;
          const active = document.getElementById('catalog-type-active').checked ? '1' : '0';
          const submitUrlInput = document.getElementById('catalog-type-form_submit_url');
          const submitUrl = submitUrlInput ? submitUrlInput.value : '/api/catalog/item_add/catalogs_keys/';
          
          if (!name || name.trim() === '') {
            alert('Введите название типа элемента');
            return;
          }
          
          const data = { name: name.trim(), order: parseInt(order) || 0, active: active };
          
          const response = await fetch(submitUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: data })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const result = await response.json();
          if (typeof toastr !== 'undefined') {
            toastr.success('Тип элемента успешно сохранен');
          } else {
            alert('Тип элемента успешно сохранен');
          }
          
          if (exitAfterSave) {
            // ������������ � ������ � ��������� ���
            window.location.hash = '#catalog-types';
            // ��������� ������ ��� ������������ ��������
            setTimeout(() => {
              loadCatalogTypes();
            }, 100);
          } else {
            // ��������� ID �������� ����� �������� (���� ��� ��� ����� �������)
            if (result.item && result.item.id) {
              document.getElementById('catalog-type-item-id').value = result.item.id;
              // ��������� ���������
              const titleElement = document.getElementById('catalog-type-edit-title');
              if (titleElement) {
                titleElement.textContent = `Редактировать Тип элемента #${result.item.id}`;
              }
              const submitUrlInputEl = document.getElementById('catalog-type-form_submit_url');
              if (submitUrlInputEl) submitUrlInputEl.value = `/api/catalog/item_edit/catalogs_keys/${result.item.id}`;
            }
          }
        } catch (error) {
          console.error('❌ Ошибка сохранения типа элемента:', error);
          alert('Ошибка сохранения: ' + error.message);
        }
      }
      
      const saveCatalogTypeBtn = document.getElementById('save-catalog-type-btn');
      if (saveCatalogTypeBtn) {
        saveCatalogTypeBtn.addEventListener('click', () => saveCatalogType(false));
      }
      const saveAndExitCatalogTypeBtn = document.getElementById('save-and-exit-catalog-type-btn');
      if (saveAndExitCatalogTypeBtn) {
        saveAndExitCatalogTypeBtn.addEventListener('click', () => saveCatalogType(true));
      }
      
      // Обработчик кнопки "Отмена"
      const cancelCatalogTypeBtn = document.getElementById('cancel-catalog-type-btn');
      if (cancelCatalogTypeBtn) {
        cancelCatalogTypeBtn.addEventListener('click', function(e) {
          e.preventDefault();
          window.location.hash = '#catalog-types';
        });
      }
      
      // Удаление типа элемента (по референсу: show_swal с sweetalert) - ГЛОБАЛЬНАЯ функция
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
          // Fallback на обычный confirm если sweetalert не загружен
          if (confirm(`Вы уверены, что хотите удалить тип элемента "${itemName}"?`)) {
            await performDeleteCatalogType(itemId);
          }
        }
      };
      
      // Открытие страницы редактирования группы (глобальная функция)
      window.openCatalogGroupEdit = function openCatalogGroupEdit(itemId = 0) {
        // Скрываем все страницы
        document.querySelectorAll('.admin-page').forEach(page => {
          page.classList.remove('active');
        });
        
        // Показываем страницу редактирования
        const editPage = document.getElementById('catalog-group-edit');
        if (editPage) {
          editPage.classList.add('active');
          
          // Обновляем URL
          window.history.pushState({ page: 'catalog-group-edit' }, '', `#catalog-group-edit?id=${itemId}`);
          
          // Загружаем данные
          loadCatalogGroupEdit(itemId);
        }
      };
      
      // Загрузка данных группы для редактирования
      async function loadCatalogGroupEdit(itemId) {
        try {
          const itemIdInput = document.getElementById('catalog-group-item-id');
          const nameInput = document.getElementById('catalog-group-name');
          const orderInput = document.getElementById('catalog-group-order');
          const activeInput = document.getElementById('catalog-group-active');
          const titleElement = document.getElementById('catalog-group-edit-title');
          const submitUrlInput = document.getElementById('group_form_submit_url');
          
          if (!itemIdInput || !nameInput || !orderInput || !activeInput || !titleElement || !submitUrlInput) {
            console.error('❌ Элементы формы не найдены');
            return;
          }
          
          itemIdInput.value = itemId;
          
          if (itemId === '0' || itemId === 0) {
            // Режим добавления
            titleElement.textContent = 'Добавить Группу';
            nameInput.value = '';
            orderInput.value = '0';
            activeInput.checked = true;
            submitUrlInput.value = '/api/catalog/item_add/modules_groups/';
          } else {
            // ����� ��������������
            titleElement.textContent = `Редактировать Группу #${itemId}`;
            submitUrlInput.value = `/api/catalog/item_edit/modules_groups/${itemId}`;
            
            // ��������� ������ ��������
            const response = await fetch(`/api/catalog/item/modules_groups/${itemId}`);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
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
      
      // Сохранение группы
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
          
          const data = { name: name.trim(), order: parseInt(order) || 0, active: active };
          
          const response = await fetch(submitUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: data })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const result = await response.json();
          if (typeof toastr !== 'undefined') {
            toastr.success('Группа успешно удалена');
          } else {
            alert('Группа успешно удалена');
          }
          
          if (exitAfterSave) {
            // ��������� ������ ����� ����������
            window.location.hash = '#catalog-groups';
            // ��������� �������� ��� ������������ ��������
            setTimeout(() => {
              // Вычисляем где деталь находится в секции
              catalogGroupsPagination.currentPage = 1;
              loadCatalogGroups();
            }, 200);
          } else {
            if (result.item && result.item.id) {
              document.getElementById('catalog-group-item-id').value = result.item.id;
              const titleElement = document.getElementById('catalog-group-edit-title');
              if (titleElement) {
                titleElement.textContent = `Редактировать Группу #${result.item.id}`;
              }
              const submitUrlInput = document.getElementById('group_form_submit_url');
              if (submitUrlInput) {
                submitUrlInput.value = `/api/catalog/item_edit/modules_groups/${result.item.id}`;
              }
            }
          }
        } catch (error) {
          console.error('❌ Ошибка сохранения группы:', error);
          alert(`Ошибка сохранения: ${error.message}`);
        }
      }
      
      // Обработчики кнопок сохранения для групп
      const saveCatalogGroupBtn = document.getElementById('save-catalog-group-btn');
      if (saveCatalogGroupBtn) {
        saveCatalogGroupBtn.addEventListener('click', () => saveCatalogGroup(false));
      }
      
      const saveAndExitCatalogGroupBtn = document.getElementById('save-and-exit-catalog-group-btn');
      if (saveAndExitCatalogGroupBtn) {
        saveAndExitCatalogGroupBtn.addEventListener('click', () => saveCatalogGroup(true));
      }
      
      // Обработчик кнопки "Отмена" для групп
      const cancelCatalogGroupBtn = document.getElementById('cancel-catalog-group-btn');
      if (cancelCatalogGroupBtn) {
        cancelCatalogGroupBtn.addEventListener('click', function(e) {
          e.preventDefault();
          window.location.hash = '#catalog-groups';
        });
      }
      
      // Удаление группы (глобальная функция)
      window.deleteCatalogGroup = async function deleteCatalogGroup(itemId, itemName) {
        if (typeof swal !== 'undefined') {
          swal({
            title: "Вы уверены?",
            text: `Вы действительно хотите удалить группу "${itemName}"?`,
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            cancelButtonText: "Нет",
            confirmButtonText: "Да",
            closeOnConfirm: true
          }, async function(isConfirm) {
            if (isConfirm) {
              await performDeleteCatalogGroup(itemId);
            }
          });
        } else {
          if (confirm(`Вы уверены, что хотите удалить группу "${itemName}"?`)) {
            await performDeleteCatalogGroup(itemId);
          }
        }
      };
      
      // Выполнение удаления группы
      async function performDeleteCatalogGroup(itemId) {
        try {
          const response = await fetch(`/api/catalog/item_delete/modules_groups/${itemId}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const result = await response.json();
          if (typeof toastr !== 'undefined') {
            toastr.success('Группа успешно удалена');
          } else {
            alert('Группа успешно удалена');
          }
          
          // Сбрасываем на первую страницу и перезагружаем
          catalogGroupsPagination.currentPage = 1;
          // ��������� ��������, ����� ������ ����� ��������� ���������
          setTimeout(() => {
            loadCatalogGroups();
          }, 300);
        } catch (error) {
          console.error('❌ Ошибка удаления группы:', error);
          if (typeof toastr !== 'undefined') {
            toastr.error(`Ошибка удаления: ${error.message}`);
          } else {
            alert(`Ошибка удаления: ${error.message}`);
          }
        }
      }
      
      // Выполнение удаления типа элемента
      async function performDeleteCatalogType(itemId) {
        try {
          const response = await fetch(`/api/catalog/item_delete/catalogs_keys/${itemId}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const result = await response.json();
          if (typeof toastr !== 'undefined') {
            toastr.success('Тип элемента успешно удален');
          } else {
            alert('Тип элемента успешно удален');
          }
          
          // Обновляем список (это перезагрузит данные и пересчитает пагинацию)
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
      
      // Обработка кнопок "Назад/Вперед" в браузере (по референсу: URL меняется)
      window.addEventListener('popstate', function(event) {
        const hash = window.location.hash.substring(1); // Убираем #
        if (hash) {
          // Скрываем все страницы
          pages.forEach(page => {
            page.classList.remove('active');
          });
          
          // Показываем нужную страницу (для hash с ? берём только id страницы)
          const pageId = hash.split('?')[0] || hash;
          const targetPage = document.getElementById(pageId) || document.getElementById(hash);
          if (targetPage) {
            targetPage.classList.add('active');
            
            // Загружаем данные для этой страницы
            if (hash === 'clients-orders') {
              loadClientsOrders();
            } else if (hash === 'menu-settings') {
              loadMenuSettings();
            } else if (hash === 'catalog-types') {
              loadCatalogTypes();
            } else if (hash === 'catalog-groups') {
              loadCatalogGroups();
            } else if (hash === 'materials-groups') {
              if (typeof loadMaterialsGroups === 'function') loadMaterialsGroups();
            } else if (hash.startsWith('material-group-edit')) {
              const urlParams = new URLSearchParams(hash.split('?')[1] || '');
              const itemId = parseInt(urlParams.get('id') || '0', 10);
              if (typeof window.openMaterialGroupEdit === 'function') window.openMaterialGroupEdit(itemId);
            } else if (hash.startsWith('catalog-items')) {
              // Обрабатываем страницу списка элементов каталога
              const urlParams = new URLSearchParams(hash.split('?')[1] || '');
              const catalogType = urlParams.get('type');
              if (catalogType) {
                // Находим название типа из меню
                const menuLink = document.querySelector(`a[data-catalog-type="${catalogType}"]`);
                const catalogName = menuLink ? (menuLink.getAttribute('data-catalog-name') || catalogType) : catalogType;
                loadCatalogItems(catalogType, catalogName);
              }
            } else if (hash.startsWith('catalog-item-edit')) {
              // Обрабатываем страницу редактирования элемента каталога
              const urlParams = new URLSearchParams(hash.split('?')[1] || '');
              const catalogType = urlParams.get('type') || '';
              const itemId = parseInt(urlParams.get('id') || '0');
              const catalogName = urlParams.get('name') || 'Элемент';
              if (catalogType) {
                openCatalogItemEdit(itemId, catalogType, catalogName);
              }
            } else if (hash === 'materials-keys') {
              if (typeof window.loadMaterialsKeys === 'function') {
                window.loadMaterialsKeys();
              } else {
                console.error('❌ Функция loadMaterialsKeys не найдена');
              }
            } else if (hash.startsWith('material-key-edit')) {
              const urlParams = new URLSearchParams(hash.split('?')[1] || '');
              const itemId = parseInt(urlParams.get('id') || '0');
              if (typeof window.loadMaterialKeyEdit === 'function') {
                window.loadMaterialKeyEdit(itemId);
              } else {
                console.error('❌ Функция loadMaterialKeyEdit не найдена');
              }
            } else if (hash.startsWith('edges-items')) {
              if (typeof window.loadEdgesItemsFromHash === 'function') window.loadEdgesItemsFromHash();
            } else if (hash.startsWith('edge-item-edit')) {
              const urlParams = new URLSearchParams(hash.split('?')[1] || '');
              const typeKey = urlParams.get('type') || '';
              const itemId = parseInt(urlParams.get('id') || '0', 10);
              if (typeKey && typeof loadEdgeItemEdit === 'function') loadEdgeItemEdit(typeKey, itemId);
            } else if (hash === 'global-vars') {
              if (typeof window.loadGlobalVars === 'function') {
                window.loadGlobalVars();
              } else {
                console.error('❌ Функция loadGlobalVars не найдена');
              }
            }
          }
          
          // Обновляем активное состояние меню (для hash с ? используем pageId)
          const menuHash = hash.split('?')[0] || hash;
          document.querySelectorAll('#side-menu > li').forEach(li => {
            li.classList.remove('active');
            const link = li.querySelector('a[data-page="' + menuHash + '"]') || li.querySelector('a[data-page="' + hash + '"]');
            if (link) {
              li.classList.add('active');
            }
          });
        }
      });
      
      // Загружаем страницу из URL при первой загрузке (по референсу: если есть hash в URL)
      const initialHash = window.location.hash.substring(1);
      if (initialHash) {
        const basePageId = initialHash.split('?')[0] || initialHash;
        const targetPage = document.getElementById(basePageId) || document.getElementById(initialHash);
        if (targetPage) {
          // Скрываем все страницы
          pages.forEach(page => {
            page.classList.remove('active');
          });
          // Показываем нужную страницу
          targetPage.classList.add('active');
          
          // Обновляем активное состояние меню
          document.querySelectorAll('#side-menu > li').forEach(li => {
            li.classList.remove('active');
            const link = li.querySelector('a[data-page="' + basePageId + '"]') || li.querySelector('a[data-page="' + initialHash + '"]');
            if (link) {
              li.classList.add('active');
            }
          });
          
          // Загружаем данные
          if (initialHash === 'clients-orders') {
            loadClientsOrders();
          } else if (initialHash === 'menu-settings') {
            loadMenuSettings();
          } else if (initialHash === 'catalog-types') {
            loadCatalogTypes();
          } else if (initialHash === 'catalog-groups') {
            loadCatalogGroups();
          } else if (initialHash === 'materials-groups') {
            if (typeof loadMaterialsGroups === 'function') loadMaterialsGroups();
          } else if (initialHash.startsWith('material-group-edit')) {
            const urlParams = new URLSearchParams(initialHash.split('?')[1] || '');
            const itemId = parseInt(urlParams.get('id') || '0', 10);
            if (typeof window.openMaterialGroupEdit === 'function') window.openMaterialGroupEdit(itemId);
          } else if (initialHash === 'materials-keys') {
            if (typeof window.loadMaterialsKeys === 'function') {
              window.loadMaterialsKeys();
            } else {
              console.error('❌ Функция loadMaterialsKeys не найдена при начальной загрузке');
            }
          } else if (initialHash.startsWith('materials-items')) {
            loadMaterialsItemsFromHash();
          } else if (initialHash.startsWith('material-item-edit')) {
            const urlParams = new URLSearchParams(initialHash.split('?')[1] || '');
            const typeKey = urlParams.get('type') || '';
            const itemId = parseInt(urlParams.get('id') || '0', 10);
            loadMaterialItemEdit(typeKey, itemId);
          } else if (initialHash === 'edges-keys') {
            if (typeof window.loadEdgesKeys === 'function') window.loadEdgesKeys();
          } else if (initialHash === 'edges-categories' || initialHash.startsWith('edges-categories')) {
            if (typeof window.loadEdgesCategories === 'function') window.loadEdgesCategories();
          } else if (initialHash === 'edges-items' || initialHash.startsWith('edges-items')) {
            if (typeof window.loadEdgesItemsFromHash === 'function') window.loadEdgesItemsFromHash();
          } else if (initialHash === 'facades-items' || initialHash.startsWith('facades-items')) {
            if (typeof window.loadFacades === 'function') window.loadFacades();
          } else if (initialHash === 'models3d-materials') {
            if (typeof window.loadModels3dMaterials === 'function') window.loadModels3dMaterials();
          } else if (initialHash === 'models3d-list') {
            if (typeof window.loadModels3dList === 'function') window.loadModels3dList();
          } else if (initialHash === 'handles-list' || initialHash.startsWith('handles-list')) {
            if (typeof window.loadHandlesList === 'function') window.loadHandlesList();
          } else if (initialHash.startsWith('handles-item-edit')) {
            const urlParams = new URLSearchParams(initialHash.split('?')[1] || '');
            const itemId = parseInt(urlParams.get('id') || '0', 10);
            if (typeof window.loadHandlesItemEdit === 'function') window.loadHandlesItemEdit(itemId);
          } else if (initialHash.startsWith('edge-key-edit')) {
            const urlParams = new URLSearchParams(initialHash.split('?')[1] || '');
            const itemId = parseInt(urlParams.get('id') || '0', 10);
            if (typeof window.openEdgeKeyEdit === 'function') window.openEdgeKeyEdit(itemId);
          } else if (initialHash.startsWith('edge-item-edit')) {
            const urlParams = new URLSearchParams(initialHash.split('?')[1] || '');
            const typeKey = urlParams.get('type') || '';
            const itemId = parseInt(urlParams.get('id') || '0', 10);
            if (typeKey && typeof loadEdgeItemEdit === 'function') {
              document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
              const page = document.getElementById('edge-item-edit');
              if (page) { page.classList.add('active'); loadEdgeItemEdit(typeKey, itemId); }
            }
          } else if (initialHash === 'material-key-edit') {
            const urlParams = new URLSearchParams(initialHash.split('?')[1] || '');
            const itemId = parseInt(urlParams.get('id') || '0');
            if (typeof window.loadMaterialKeyEdit === 'function') {
              window.loadMaterialKeyEdit(itemId);
            } else {
              console.error('❌ Функция loadMaterialKeyEdit не найдена при начальной загрузке');
            }
          } else if (initialHash === 'global-vars') {
            if (typeof window.loadGlobalVars === 'function') {
              window.loadGlobalVars();
            } else {
              console.error('❌ Функция loadGlobalVars не найдена при начальной загрузке');
            }
          } else if (initialHash === 'accessories-library') {
            loadAccessoriesLibrary();
          } else if (initialHash.startsWith('catalog-items')) {
            // Обрабатываем страницу списка элементов каталога при первой загрузке
            const urlParams = new URLSearchParams(initialHash.split('?')[1] || '');
            const catalogType = urlParams.get('type');
            if (catalogType) {
              const menuLink = document.querySelector(`a[data-catalog-type="${catalogType}"]`);
              const catalogName = menuLink ? (menuLink.getAttribute('data-catalog-name') || catalogType) : catalogType;
              loadCatalogItems(catalogType, catalogName);
            }
          }
        }
      }
      
      // Загружаем заявки при первой загрузке страницы, если она активна
      const activePage = document.querySelector('.admin-page.active');
      if (activePage && activePage.id === 'clients-orders') {
        loadClientsOrders();
      }
      
      // Загружаем наборы кромок для меню при инициализации страницы
      if (typeof window.loadEdgesKeys === 'function') {
        window.loadEdgesKeys().catch(e => console.error('❌ Ошибка загрузки меню кромок:', e));
      }
      
      // Загружаем меню при первой загрузке страницы, если она активна
      if (activePage && activePage.id === 'menu-settings') {
        loadMenuSettings();
      }
      
      // Загружаем типы элементов при первой загрузке страницы, если она активна
      if (activePage && activePage.id === 'catalog-types') {
        loadCatalogTypes();
      }
      
      // Обновляем подменю "Каталог элементов" при первой загрузке страницы
      fetch('/api/catalog/items_get/catalogs_keys')
        .then(response => response.json())
        .then(data => {
          updateCatalogSubmenu(data);
        })
        .catch(error => {
          console.warn('⚠️ Не удалось загрузить типы элементов для меню:', error);
        });

      // Обновляем подменю "Плитные материалы" при первой загрузке страницы
      fetch('/api/catalog/items_get/materials_keys')
        .then(response => response.json())
        .then(data => {
          // поддерживаем разные форматы ответа (массив / {items:[]})
          const items = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
          updateMaterialsSubmenu(items);
        })
        .catch(error => {
          console.warn('⚠️ Не удалось загрузить материалы для меню:', error);
        });
      
      // Переключение видимости поля пароля PDF
      const pdfPasswordCheckbox = document.getElementById('pdf_password_protection');
      const pdfPasswordRow = document.getElementById('pdf_password_row');
      if (pdfPasswordCheckbox && pdfPasswordRow) {
        pdfPasswordCheckbox.addEventListener('change', function() {
          pdfPasswordRow.style.display = this.checked ? 'flex' : 'none';
        });
      }
      
      // Переключение видимости поля файла отражения
      const reflectionCheckbox = document.getElementById('use_custom_reflection');
      const reflectionFileRow = document.getElementById('reflection_file_row');
      if (reflectionCheckbox && reflectionFileRow) {
        reflectionCheckbox.addEventListener('change', function() {
          reflectionFileRow.style.display = this.checked ? 'flex' : 'none';
        });
      }
      
      // Модальные окна для "Настройка меню"
      const modalTriggers = document.querySelectorAll('[data-toggle="modal"]');
      const modals = document.querySelectorAll('.modal');
      const modalCloses = document.querySelectorAll('[data-dismiss="modal"]');
      
      // Открытие модальных окон
      modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function(e) {
          e.preventDefault();
          const targetId = this.getAttribute('data-target');
          const modal = document.querySelector(targetId);
          if (modal) {
            modal.style.display = 'flex';
          }
        });
      });
      
      // Закрытие модальных окон
      modalCloses.forEach(close => {
        close.addEventListener('click', function() {
          const modal = this.closest('.modal');
          if (modal) {
            modal.style.display = 'none';
          }
        });
      });
      
      // Закрытие по клику вне модального окна
      modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
          if (e.target === this) {
            this.style.display = 'none';
          }
        });
      });
      
      // Обработчики для кнопок "Добавить" в модалке "Добавить компонент"
      const componentButtons = document.querySelectorAll('#base_menu_modal .btn-primary.btn-outline');
      
      // Маппинг названий компонентов на их структуру (по референсу)
      const componentMap = {
        'Размеры': {
          menu_id: 'room_params',
          label: 'Размеры',
          component: { id: 'room_params', props: {} },
          icon: 'icon_sizes'
        },
        'Конструкции': {
          menu_id: 'constructions',
          label: 'Конструкции',
          component: { id: 'constr_picker', props: { catalog: 'constructions', categories: null } },
          icon: 'icon_construction'
        },
        'Коммуникации': {
          menu_id: 'communications',
          label: 'Коммуникации',
          component: { id: 'model_picker', props: { catalog: 'comms', categories: null } },
          icon: 'icon_comms'
        },
        'Стены': {
          menu_id: 'walls_material',
          label: 'Стены',
          component: { id: 'walls_material_picker', props: { categories: 'materials.walls', selected: 'selected_materials.walls', fn: 'set_walls_material' } },
          icon: 'icon_walls'
        },
        'Пол': {
          menu_id: 'floor_material',
          label: 'Пол',
          component: { id: 'floor_material_picker', props: { categories: 'materials.floor', selected: 'selected_materials.floor', fn: 'set_floor_material' } },
          icon: 'icon_floor'
        },
        'Переменные': {
          menu_id: 'global_vars',
          label: 'Глобальные параметры',
          component: { id: 'global_vars', props: {} },
          icon: 'icon_parameters'
        },
        'Фасады': {
          menu_id: 'facades_picker',
          label: 'Фасады',
          component: { id: 'facades_picker', props: { facades: 'defaults.facades', materials: 'selected_materials.facades', lib: 'facades' } },
          icon: 'icon_facades'
        },
        'Наполнение витрин': {
          menu_id: 'showcase_filling',
          label: 'Наполнение витрин',
          component: { id: 'model_picker', props: { catalog: 'showcase', categories: null } },
          icon: 'icon_showcase'
        },
        'Группа материалов': {
          menu_id: 'corpus_material_picker',
          label: 'Группа материалов',
          component: { id: 'corpus_material_picker', props: { mode: 'p', categories: 'materials.top.corpus', selected: 'selected_materials.top.corpus', lib: 'materials', fn: 'set_corpus_material' } },
          icon: 'icon_materials'
        },
        'Материалы моделей': {
          menu_id: 'materials_models',
          label: 'Материалы моделей',
          component: { id: 'materials_picker', props: {} },
          icon: 'icon_materials'
        },
        'Цоколь': {
          menu_id: 'cokol_material_picker',
          label: 'Цоколь',
          component: { id: 'cokol_material_picker', props: { categories: 'materials.cokol', selected: 'selected_materials.cokol', fn: 'set_cokol_material' } },
          icon: 'icon_cokol'
        },
        'Столешница': {
          menu_id: 'tabletop_picker',
          label: 'Столешница',
          component: { id: 'tabletop_picker', props: { categories: '', selected: 'defaults.tabletop', fn: 'set_tabletop' } },
          icon: 'icon_tabletop'
        },
        'Каталог модулей': {
          menu_id: 'module_picker',
          label: 'Каталог модулей',
          component: { id: 'module_picker_v2', props: { catalog: 'catalog', categories: ['module'], hide_variants: false } },
          icon: 'icon_catalog'
        },
        'Ручки': {
          menu_id: 'handles_picker',
          label: 'Ручки',
          component: { id: 'handles_picker', props: {} },
          icon: 'icon_furniture_handle'
        },
        'Мойки': {
          menu_id: 'washes_picker',
          label: 'Мойки',
          component: { id: 'washes_picker', props: {} },
          icon: 'icon_sink'
        },
        'Техника': {
          menu_id: 'tech_picker',
          label: 'Техника',
          component: { id: 'model_picker', props: { catalog: 'tech', categories: null } },
          icon: 'icon_technic'
        },
        'Интерьер': {
          menu_id: 'interior_picker',
          label: 'Интерьер',
          component: { id: 'model_picker', props: { catalog: 'interior', categories: null } },
          icon: 'icon_interior'
        },
        'Проекты': {
          menu_id: 'project_picker',
          label: 'Проекты',
          component: { id: 'project_picker', props: {} },
          icon: 'icon_your_project'
        },
        'Комплектующие': {
          menu_id: 'accessories_component',
          label: 'Комплектующие',
          component: { id: 'accessories_component', props: {} },
          icon: 'icon_basket'
        },
        'Фурнитура': {
          menu_id: 'module_type_picker',
          label: 'Фурнитура',
          component: { id: 'module_type_picker', props: { types: null } },
          icon: 'icon_furnitura'
        }
      };
      
      componentButtons.forEach(button => {
        button.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          // Получаем название компонента из текста в строке таблицы
          const row = this.closest('tr');
          const componentName = row.querySelector('span').textContent.trim();
          // Получаем структуру компонента
          const componentData = componentMap[componentName];
          
          if (!componentData) {
            alert(`Компонент "${componentName}" не найден в маппинге.`);
            console.error('❌ Компонент не найден:', componentName);
            return;
          }
          
          // Убеждаемся, что currentMenuData инициализирован
          if (!currentMenuData) {
            currentMenuData = {
              main_menu: [],
              top_menu_left: [],
              top_menu_right: []
            };
          }
          
          if (!currentMenuData.main_menu) {
            currentMenuData.main_menu = [];
          }
          
          // Генерируем уникальный menu_id если нужно
          let menuId = componentData.menu_id;
          if (currentMenuData.main_menu.some(item => (item.menu_id || item.id) === menuId)) {
            menuId = componentData.menu_id + '_' + Date.now();
          }
          
          // Создаем новый элемент меню
          const newMenuItem = {
            menu_id: menuId,
            label: componentData.label,
            component: componentData.component,
            children: [],
            list_view: false
          };
          
          if (componentData.icon) {
            newMenuItem.icon = componentData.icon;
          }
          
          // Добавляем в main_menu
          currentMenuData.main_menu.push(newMenuItem);
          
          // Добавляем в дерево меню визуально
          const container = document.querySelector('#menu-settings .pp-tree-slicklist');
          if (container) {
            renderMenuItem(container, newMenuItem, 0);
          }
          
          // Закрываем модалку
          const modal = document.getElementById('base_menu_modal');
          if (modal) {
            modal.style.display = 'none';
          }
        });
      });
    });
