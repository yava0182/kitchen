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
        alert('Ошибка сохранения. Проверь сервер.');
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
        // Берём категории из API фасадов (по данным FULL_REFERENCE_DATA.facades),
        // чтобы структура совпадала с референсом.
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
            <button type=\"button\" class=\"btn btn-sm btn-primary\" onclick=\"if(window.handleEdgesDecorSelect) window.handleEdgesDecorSelect(${id});\">Выбрать</button>
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
        // Толщина кромки по умолчанию как в рефе — берём из декора.
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
      
      // Очищаем таблицу
          tbody.innerHTML = '';
      
      // Если данных нет (пустой массив)
      if (!allData || (Array.isArray(allData) && allData.length === 0)) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#999;">Нет данных</td></tr>';
        renderCatalogTypesPagination(0);
        return;
      }
      
      // Вычисляем индексы для текущей страницы
      const startIndex = (currentPage - 1) * perPage;
      const endIndex = startIndex + perPage;
      const pageData = allData.slice(startIndex, endIndex);
      
      // Рендерим данные текущей страницы (по референсу: Чекбокс, ID, Название, Действия)
      pageData.forEach(item => {
            const row = document.createElement('tr');
            
          // Чекбокс (по референсу: <td style="width: 10px;"><input type="checkbox" value="1"></td>)
            const checkboxCell = document.createElement('td');
            checkboxCell.style.width = '10px';
          checkboxCell.style.verticalAlign = 'middle';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = item.id;
          checkbox.className = 'catalog-type-checkbox';
            checkboxCell.appendChild(checkbox);
            
          // ID (по референсу: <td style="width: 50px;">1</td>)
            const idCell = document.createElement('td');
            idCell.style.width = '50px';
          idCell.style.verticalAlign = 'middle';
          idCell.textContent = item.id || '-';
            
          // Название (по референсу: просто <td>Кухни</td> - для catalogs_keys только название)
            const nameCell = document.createElement('td');
          nameCell.style.verticalAlign = 'middle';
          // Для catalogs_keys название берется из item.name (не из params)
          nameCell.textContent = item.name || '-';
            
          // Действия (по референсу: Редактировать и Удалить)
            const actionsCell = document.createElement('td');
          actionsCell.className = 'col-actions';
            actionsCell.style.width = '150px';
          actionsCell.style.verticalAlign = 'middle';
          actionsCell.style.textAlign = 'center';
            
          // Редактировать (по референсу: <a href="/catalog/item/catalogs_keys/1">)
            const editLink = document.createElement('a');
            editLink.href = `#catalog-type-edit?id=${item.id}`;
            editLink.onclick = (e) => {
              e.preventDefault();
              openCatalogTypeEdit(item.id);
            };
            const editIcon = document.createElement('i');
            editIcon.className = 'fa fa-edit btn btn-outline btn-success';
