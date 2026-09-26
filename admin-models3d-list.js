// ============================================
// Модуль: Список 3D Моделей (cabinet_model)
// Вынесено из admin-new.html для уменьшения размера основного файла
// ============================================

(function() {
  'use strict';

  // Guard against missing globals in iframe context (constructor-clodis.html)
  window.Models3D = window.Models3D || {};
  window.CLD = window.CLD || window.clodis || {};
  console.log('[Models3D] admin-models3d-list.js loaded');

  const MODELS3D_LIST_TYPE = 'cabinet_model';
  const models3dListState = { allData: [], filtered: [], currentPage: 1, perPage: 20, total: 0 };

  // ============================================
  // Утилиты
  // ============================================
  
  // Извлечение артикула из кода модели
  function getArticleCode(item) {
    if (!item) return '';
    const code = item.code || item.article || '';
    if (typeof code === 'string') {
      // Извлекаем первую часть до пробела или дефиса
      const match = code.match(/^([A-Za-z0-9]+)/);
      return match ? match[1] : code.substring(0, 10);
    }
    return '';
  }

  function getModels3dCategory(item) {
    const c = item?.category;
    if (Array.isArray(c)) return (c[0] ?? '').toString();
    if (typeof c === 'string') {
      const trimmed = c.trim();
      if (!trimmed || trimmed === '[]') return '';
      if (trimmed[0] === '[') {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return (parsed[0] ?? '').toString();
        } catch (_) {}
      }
      return trimmed;
    }
    return (c ?? '').toString();
  }

  /** Сброс кэша cabinet_model для iframe-превью конструктора после изменений каталога */
  function notifyCabinetModelLibraryStale() {
    try {
      if (typeof window.__cldInvalidateCabinetModelLibraryCache === 'function') {
        window.__cldInvalidateCabinetModelLibraryCache();
      }
      if (typeof window.__ppSyncPreviewToIframe === 'function') {
        window.__ppSyncPreviewToIframe();
      }
    } catch (_) {}
  }

  /** После сохранения подменяем строку в кэше списка, иначе loadModels3dItemEdit снова подтянет старый item.data */
  function upsertModels3dListCacheEntry(serverItem) {
    if (!serverItem || !Number(serverItem.id)) return;
    const idNum = Number(serverItem.id);
    if (!Array.isArray(models3dListState.allData)) models3dListState.allData = [];
    const idx = models3dListState.allData.findIndex(it => Number(it?.id) === idNum);
    if (idx >= 0) {
      models3dListState.allData[idx] = { ...models3dListState.allData[idx], ...serverItem };
    } else {
      models3dListState.allData.push(serverItem);
    }
  }

  function renderModels3dCategorySelect(state, selectId, defaultLabel) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const cats = [...new Set((state.allData || []).map(it => getModels3dCategory(it).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));
    const opts = `<option value="">${defaultLabel}</option>` + cats.map(c => `<option value="${(c || '').replace(/"/g, '&quot;')}">${c}</option>`).join('');
    const cur = sel.value || '';
    sel.innerHTML = opts;
    if (cur) sel.value = cur;
  }

  function renderModels3dPagination(state, totalItems, topId, bottomId, fromId, toId, totalId, onPageChange) {
    const top = document.getElementById(topId);
    const bottom = document.getElementById(bottomId);
    const fromEl = document.getElementById(fromId);
    const toEl = document.getElementById(toId);
    const totalEl = document.getElementById(totalId);
    if (!top || !bottom) return;
    const perPage = state.perPage || 20;
    const currentPage = state.currentPage || 1;
    const totalPages = Math.max(1, Math.ceil((totalItems || 0) / perPage));
    const start = totalItems ? (currentPage - 1) * perPage + 1 : 0;
    const end = totalItems ? Math.min(currentPage * perPage, totalItems) : 0;
    if (fromEl) fromEl.textContent = String(start);
    if (toEl) toEl.textContent = String(end);
    if (totalEl) totalEl.textContent = String(totalItems || 0);
    const mk = (host) => {
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
        a.addEventListener('click', (e) => {
          e.preventDefault();
          const p = parseInt(a.getAttribute('data-page') || '0', 10);
          if (p >= 1 && p <= totalPages) {
            state.currentPage = p;
            onPageChange();
          }
        });
      });
    };
    mk(top);
    mk(bottom);
  }

  function mkIconCellHtml(item) {
    const iconUrl = (item?.icon || item?.image || '').toString();
    const colorVal = (item?.color || '').toString().trim();
    if (iconUrl) {
      return `<img src="${iconUrl}" alt="" style="width:70px;height:70px;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb;" onerror="this.style.display='none'">`;
    }
    if (colorVal && /^#([0-9A-Fa-f]{6})$/.test(colorVal)) {
      return `<div style="width:70px;height:70px;background:${colorVal};border-radius:6px;border:1px solid #e5e7eb;"></div>`;
    }
    return '<div style="width:70px;height:70px;border:1px solid #e5e7eb;border-radius:6px;background:#f8fafc;"></div>';
  }

  function applyModels3dFilters(state, searchInputId, categoryFilterId) {
    const searchInput = document.getElementById(searchInputId);
    const categoryFilter = document.getElementById(categoryFilterId);
    const searchQuery = (searchInput?.value || '').toString().trim().toLowerCase();
    const categoryValue = (categoryFilter?.value || '').toString().trim();
    
    let filtered = Array.isArray(state.allData) ? [...state.allData] : [];
    
    // Фильтр по поиску
    if (searchQuery) {
      filtered = filtered.filter(item => {
        const name = (item?.name || '').toString().toLowerCase();
        return name.includes(searchQuery);
      });
    }
    
    // Фильтр по категории
    if (categoryValue) {
      filtered = filtered.filter(item => {
        const cat = getModels3dCategory(item);
        return cat === categoryValue;
      });
    }
    
    state.filtered = filtered;
  }

  // ============================================
  // Загрузка списка 3D моделей
  // ============================================
  async function loadModels3dList() {
    const tbody = document.getElementById('models3d-list-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px;">Загрузка...</td></tr>';
    try {
      const resp = await fetch(`/api/catalog/items_get/${encodeURIComponent(MODELS3D_LIST_TYPE)}?t=${Date.now()}`, { cache: 'no-cache' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      models3dListState.allData = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
      models3dListState.currentPage = 1;
      renderModels3dCategorySelect(models3dListState, 'models3d-list-category-filter', 'Все');
      renderModels3dListTable();
    } catch (e) {
      console.error('❌ Ошибка загрузки 3D моделей:', e);
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#999;">Ошибка загрузки</td></tr>';
      renderModels3dPagination(models3dListState, 0, 'models3d-list-pagination-top', 'models3d-list-pagination-bottom', 'models3d-list-from', 'models3d-list-to', 'models3d-list-total', () => {});
    }
  }

  function renderModels3dListTable() {
    const tbody = document.getElementById('models3d-list-table-body');
    if (!tbody) return;
    applyModels3dFilters(models3dListState, 'models3d-list-search-input', 'models3d-list-category-filter');
    const data = models3dListState.filtered;
    tbody.innerHTML = '';
    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#999;">Нет данных</td></tr>';
      renderModels3dPagination(models3dListState, 0, 'models3d-list-pagination-top', 'models3d-list-pagination-bottom', 'models3d-list-from', 'models3d-list-to', 'models3d-list-total', renderModels3dListTable);
      return;
    }
    const perPage = models3dListState.perPage || 20;
    const start = (models3dListState.currentPage - 1) * perPage;
    const pageData = data.slice(start, start + perPage);
    for (const item of pageData) {
      const active = (item?.active ?? 1) == 1 || item?.active === true || item?.active === '1';
      const eyeClass = active ? 'fa-eye' : 'fa-eye-slash';
      const eyeTitle = active ? 'Видим' : 'Скрыт';
      const tr = document.createElement('tr');
      const articleCode = getArticleCode(item);
      const categoryText = getModels3dCategory(item) || 'Нет';
      const itemId = item?.id ?? 0;
      const itemName = (item?.name || '').replace(/"/g, '&quot;');
      tr.innerHTML = `
        <td style="width: 50px;">${item?.id ?? '-'}</td>
        <td style="width: 100px;">${mkIconCellHtml(item)}</td>
        <td>${(item?.name || '-').toString().replace(/</g, '&lt;')}</td>
        <td style="width: 100px;">${articleCode.replace(/</g, '&lt;')}</td>
        <td style="width: 250px;">${categoryText.replace(/</g, '&lt;')}</td>
        <td style="width: 100px;">${String(item?.order ?? item?.sort ?? 10000)}</td>
        <td style="width: 100px;">
          <i class="fa ${eyeClass} btn btn-outline" style="cursor: pointer;" data-m3-action="toggle-visibility" data-m3-id="${itemId}" data-m3-active="${active ? '1' : '0'}" title="${eyeTitle}"></i>
        </td>
        <td style="width: 150px;">
          <a href="#" data-m3-action="edit" data-m3-id="${itemId}" data-m3-name="${itemName}">
            <i title="Редактировать" class="fa fa-edit btn btn-outline btn-success"></i>
          </a>
          <i title="Копировать" class="fa fa-copy btn btn-outline btn-info" style="margin: 0 6px; cursor: pointer;" data-m3-action="copy" data-m3-id="${itemId}" data-m3-name="${itemName}"></i>
          <i title="Удалить" class="fa fa-trash btn btn-outline btn-danger" style="cursor: pointer;" data-m3-action="delete" data-m3-id="${itemId}" data-m3-name="${itemName}"></i>
        </td>
      `;
      tbody.appendChild(tr);
    }
    renderModels3dPagination(models3dListState, data.length, 'models3d-list-pagination-top', 'models3d-list-pagination-bottom', 'models3d-list-from', 'models3d-list-to', 'models3d-list-total', renderModels3dListTable);
  }

  function openModels3dItemEdit(itemId) {
    const hash = `#models3d-item-edit?id=${encodeURIComponent(String(itemId || 0))}`;
    if (window.location.hash !== hash) {
      window.location.hash = hash;
      // Страница активируется через роутер, который вызовет loadModels3dItemEdit
      return;
    }
    document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById('models3d-item-edit');
    if (page) { 
      page.classList.add('active'); 
      loadModels3dItemEdit(itemId || 0); 
    }
  }

  async function loadModels3dItemEdit(itemId, prefetchedItem) {
    const id = Number(itemId) || 0;
    // Активируем страницу
    document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById('models3d-item-edit');
    if (page) page.classList.add('active');
    
    document.getElementById('models3d_item_controller_name').value = MODELS3D_LIST_TYPE;
    document.getElementById('models3d_item_id').value = String(id);
    const title = document.getElementById('models3d-item-edit-title');
    if (title) title.textContent = id ? 'Редактировать 3D модель' : 'Добавить 3D модель';
    
    // Загрузка категорий
    try {
      const r = await fetch(`/api/catalog/categories_get/${encodeURIComponent(MODELS3D_LIST_TYPE)}?t=${Date.now()}`);
      const cats = await r.json();
      const sel = document.getElementById('models3d-item-category');
      if (sel) {
        const arr = Array.isArray(cats) ? cats : [];
        sel.innerHTML = '<option value="">Нет</option>' + arr
          .map(c => `<option value="${(c.name || '').replace(/"/g,'&quot;')}">${c.name || ''}</option>`)
          .join('');
        // В верстке select по умолчанию скрыт (style=\"display:none;\"). Показываем его, как только есть данные.
        sel.style.display = '';
      }
    } catch (e) {
      console.warn('[Models3D] Не удалось загрузить категории 3D моделей:', e);
    }
    
    // Загрузка данных элемента: prefetched (после save) → API → кэш списка
    let item = prefetchedItem && typeof prefetchedItem === 'object' ? prefetchedItem : null;
    if (id && !item) {
      try {
        const resp = await fetch(`/api/catalog/item/${encodeURIComponent(MODELS3D_LIST_TYPE)}/${encodeURIComponent(String(id))}?t=${Date.now()}`, { cache: 'no-cache' });
        if (resp.ok) item = await resp.json();
      } catch (e) {
        console.warn('[Models3D] Не удалось загрузить элемент с API, пробуем кэш списка:', e);
      }
    }
    if (!item && id && Array.isArray(models3dListState.allData)) {
      item = models3dListState.allData.find(it => Number(it?.id) === id) || null;
    }
    if (!item) {
      item = id
        ? { id, name: '', category: '', order: 10000, active: 1, icon: '' }
        : { id: 0, name: '', category: '', order: 10000, active: 1, icon: '' };
    }
    
    // Заполняем форму
    document.getElementById('models3d-item-name').value = item?.name || '';
    document.getElementById('models3d-item-order').value = String(item?.order ?? 10000);
    document.getElementById('models3d-item-active').checked = (item?.active ?? 1) == 1 || item?.active === true;
    
    const specEl = document.getElementById('models3d-item-spec');
    if (specEl) specEl.checked = (item?.spec ?? 1) == 1 || item?.spec === true;
    
    const catVal = getModels3dCategory(item) || '';
    const catSel = document.getElementById('models3d-item-category');
    if (catSel) catSel.value = catVal;
    
    const iconUrl = (item?.icon || '').toString().trim();
    const iconHidden = document.getElementById('models3d-item-icon');
    if (iconHidden) iconHidden.value = iconUrl;
    const prevWrap = document.getElementById('models3d-item-icon-preview-wrapper');
    const prevImg = document.getElementById('models3d-item-icon-preview');
    const placeholder = document.getElementById('models3d-item-icon-placeholder');
    if (prevWrap && prevImg && placeholder) {
      if (iconUrl) { 
        prevWrap.style.display = 'block'; 
        placeholder.style.display = 'none'; 
        prevImg.src = iconUrl; 
      } else { 
        prevWrap.style.display = 'none'; 
        placeholder.style.display = 'flex'; 
        prevImg.src = ''; 
      }
    }

    // Загружаем данные параметров из item.data
    let itemData = null;
    try {
      if (item?.data) {
        itemData = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
        console.log('[Models3D] item.data распарсен:', {
          hasItemData: !!itemData,
          hasParams: !!(itemData && itemData.params),
          itemDataKeys: itemData ? Object.keys(itemData) : [],
          itemData: itemData
        });
      } else {
        console.warn('[Models3D] item.data отсутствует или пуст');
      }
    } catch (e) {
      console.error('[Models3D] Ошибка парсинга item.data:', e, 'item.data:', item?.data);
    }

    // Референс: размеры (Ш/В/Г) — отдельные поля элемента; в data params их нет.
    // Оставляем fallback на старый preview_size для совместимости со старыми данными.
    const previewSize = {
      x: Number(item?.width ?? itemData?.preview_size?.x ?? 600),
      y: Number(item?.height ?? itemData?.preview_size?.y ?? 720),
      z: Number(item?.depth ?? itemData?.preview_size?.z ?? 600),
    };
    const widthInput = document.getElementById('models3d-item-preview-width');
    const heightInput = document.getElementById('models3d-item-preview-height');
    const depthInput = document.getElementById('models3d-item-preview-depth');
    if (widthInput) widthInput.value = previewSize.x || 600;
    if (heightInput) heightInput.value = previewSize.y || 720;
    if (depthInput) depthInput.value = previewSize.z || 600;

    // Загружаем данные первой (основной) 3D модели (референс: item.data.params.models)
    const paramsObj = (itemData && typeof itemData === 'object' && itemData.params && typeof itemData.params === 'object')
      ? itemData.params
      : itemData;
    const models = paramsObj?.models || [];
    const firstModel = models[0] || {};
    
    console.log('[Models3D] Загрузка данных модели:', {
      itemId: id,
      hasItemData: !!itemData,
      itemData: itemData,
      hasParams: !!paramsObj,
      paramsObj: paramsObj,
      modelsCount: models.length,
      models: models,
      firstModel: firstModel,
      modelPath: firstModel.model,
      firstModelKeys: Object.keys(firstModel)
    });
    
    // Заполняем вкладку "Модель"
    const modelName = document.getElementById('models3d-model-name');
    const modelCode = document.getElementById('models3d-model-code');
    const modelPriceType = document.getElementById('models3d-model-price-type');
    const modelPriceMode = document.getElementById('models3d-model-price-mode');
    const modelCount = document.getElementById('models3d-model-count');
    const modelMinX = document.getElementById('models3d-model-min-x');
    const modelMinY = document.getElementById('models3d-model-min-y');
    const modelMinZ = document.getElementById('models3d-model-min-z');
    const modelMaxX = document.getElementById('models3d-model-max-x');
    const modelMaxY = document.getElementById('models3d-model-max-y');
    const modelMaxZ = document.getElementById('models3d-model-max-z');

    if (modelName) modelName.value = firstModel.name || item?.name || '';
    if (modelCode) modelCode.value = firstModel.code || '';
    if (modelPriceType) modelPriceType.value = firstModel.price_type || 'p';
    if (modelPriceMode) modelPriceMode.value = firstModel.price_mode || 'c';
    if (modelCount) modelCount.value = firstModel.count || 1;
    if (modelMinX) modelMinX.value = firstModel.min_x || 0;
    if (modelMinY) modelMinY.value = firstModel.min_y || 0;
    if (modelMinZ) modelMinZ.value = firstModel.min_z || 0;
    if (modelMaxX) modelMaxX.value = firstModel.max_x || 0;
    if (modelMaxY) modelMaxY.value = firstModel.max_y || 0;
    if (modelMaxZ) modelMaxZ.value = firstModel.max_z || 0;

    // Обновляем bounding box
    updateBoundingBox(
      firstModel.min_x || 0, firstModel.min_y || 0, firstModel.min_z || 0,
      firstModel.max_x || 0, firstModel.max_y || 0, firstModel.max_z || 0
    );

    // Заполняем вкладку "Параметры"
    const modelPath = document.getElementById('models3d-model-path');
    const scaleX = document.getElementById('models3d-model-scale-x');
    const scaleY = document.getElementById('models3d-model-scale-y');
    const scaleZ = document.getElementById('models3d-model-scale-z');
    const posX = document.getElementById('models3d-model-pos-x');
    const posY = document.getElementById('models3d-model-pos-y');
    const posZ = document.getElementById('models3d-model-pos-z');
    const rotX = document.getElementById('models3d-model-rot-x');
    const rotY = document.getElementById('models3d-model-rot-y');
    const rotZ = document.getElementById('models3d-model-rot-z');

    if (modelPath) {
      const modelPathValue = firstModel.model || '';
      modelPath.value = modelPathValue;
      console.log('[Models3D] Путь к модели установлен в поле формы:', {
        path: modelPathValue,
        isEmpty: !modelPathValue,
        firstModel: firstModel
      });
      // Если путь пустой, но модель должна быть загружена, предупреждаем
      if (!modelPathValue && models.length > 0) {
        console.warn('[Models3D] ⚠️ В данных модели нет пути к файлу (model пустой)');
      }
    } else {
      console.warn('[Models3D] Поле models3d-model-path не найдено в DOM');
    }
    if (scaleX) scaleX.value = (firstModel.params?.scale?.x || 100) / 100;
    if (scaleY) scaleY.value = (firstModel.params?.scale?.y || 100) / 100;
    if (scaleZ) scaleZ.value = (firstModel.params?.scale?.z || 100) / 100;
    if (posX) posX.value = firstModel.params?.pos?.x || 0;
    if (posY) posY.value = firstModel.params?.pos?.y || 0;
    if (posZ) posZ.value = firstModel.params?.pos?.z || 0;
    if (rotX) rotX.value = Number(firstModel.params?.rot?.x ?? 0);
    if (rotY) rotY.value = Number(firstModel.params?.rot?.y ?? 0);
    if (rotZ) rotZ.value = Number(firstModel.params?.rot?.z ?? 0);

    // Заполняем вкладку "Материалы"
    const modelProcess = document.getElementById('models3d-model-process');
    const modelSetUv = document.getElementById('models3d-model-set-uv');
    if (modelProcess) modelProcess.checked = firstModel.params?.process ?? 1;
    if (modelSetUv) modelSetUv.checked = firstModel.params?.set_uv ?? 1;
    refreshModels3dSlotFitPanel(firstModel.params?.slot_fit || defaultSlotFitParams());
    refreshModels3dRodCompanionsPanel(readRodCompanionsFromParamsObj({ models: [firstModel] }));
    refreshModels3dRodCompanionsSectionVisibility(id, item?.name || '', paramsObj);

    // Загружаем данные в JSON редактор
    // Референс: вкладка JSON всегда показывает params.
    // Для нового элемента (id=0) itemData может быть пустым — тогда создаём дефолтный params из формы.
    loadJsonEditorData(itemData || { params: buildCabinetModelParamsFromForm() });

    // Подключаем нашу сцену из каталога элементов (стрелки, размеры, секция)
    setTimeout(() => {
      init3DPreview();
      // Размеры из формы уже подхватываются в init3DPreview и syncModels3dPreviewSize
      const w = document.getElementById('models3d-item-preview-width')?.value;
      const h = document.getElementById('models3d-item-preview-height')?.value;
      const d = document.getElementById('models3d-item-preview-depth')?.value;
      if (w || h || d) syncModels3dPreviewSize();
      
      // Загружаем модель в превью, если путь указан
      const modelPath = document.getElementById('models3d-model-path')?.value;
      console.log('[Models3D] Проверка загрузки модели в превью:', {
        modelPath: modelPath,
        hasIframe: !!__models3dPreviewIframe,
        iframeReady: __models3dPreviewReady
      });
      if (modelPath && modelPath.trim()) {
        // Дополнительная задержка, чтобы iframe успел инициализироваться
        setTimeout(() => {
          console.log('[Models3D] Запуск загрузки модели в превью:', modelPath);
          loadModelInPreview(modelPath);
        }, 800);
      } else {
        // Путь пустой — очищаем предыдущую модель при переключении между элементами
        console.warn('[Models3D] Путь к модели не указан, очищаем предыдущую модель');
        clearModelInPreview();
      }
    }, 500);
  }

  async function saveModels3dItem(exitAfter) {
    try {
      const id = Number(document.getElementById('models3d_item_id')?.value || '0') || 0;

      let paramsObj = null;
      try {
        paramsObj = buildParamsForModels3dSave();
      } catch (e) {
        if (window.toastr) window.toastr.error('Ошибка в JSON: ' + e.message);
        return;
      }

      const modelPathFromForm = document.getElementById('models3d-model-path')?.value?.trim() || '';
      if (modelPathFromForm && paramsObj?.models?.[0]) {
        paramsObj.models[0].model = modelPathFromForm;
      }

      console.log('[Models3D] Сохранение params (форма + JSON meshes):', {
        rot: paramsObj?.models?.[0]?.params?.rot,
        modelPath: paramsObj?.models?.[0]?.model,
      });

      const itemName = (document.getElementById('models3d-item-name')?.value || '').toString().trim();
      const payload = {
        name: itemName,
        category: (document.getElementById('models3d-item-category')?.value || '').toString().trim(),
        order: Number(document.getElementById('models3d-item-order')?.value || '10000') || 10000,
        active: document.getElementById('models3d-item-active')?.checked ? 1 : 0,
        spec: paramsObj?.show_in_spec || 0,
        icon: (document.getElementById('models3d-item-icon')?.value || '').toString().trim(),
        width: Number(document.getElementById('models3d-item-preview-width')?.value || 600),
        height: Number(document.getElementById('models3d-item-preview-height')?.value || 720),
        depth: Number(document.getElementById('models3d-item-preview-depth')?.value || 600),
        data: JSON.stringify({ params: paramsObj }),
      };
      if (!payload.name) { alert('Введите название на вкладке «Основные параметры»'); return; }

      const url = id
        ? `/api/catalog/item_update/${encodeURIComponent(MODELS3D_LIST_TYPE)}/${encodeURIComponent(String(id))}/`
        : `/api/catalog/item_add/${encodeURIComponent(MODELS3D_LIST_TYPE)}/`;
      const reqBody = id ? { ...payload, id } : { ...payload };
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || data?.message || resp.statusText);
      if (window.toastr) window.toastr.success('Сохранено');
      notifyCabinetModelLibraryStale();
      const savedItem = data?.item || null;
      if (savedItem) upsertModels3dListCacheEntry(savedItem);
      if (exitAfter) {
        window.location.hash = '#models3d-list';
        document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
        const page = document.getElementById('models3d-list');
        if (page) page.classList.add('active');
        await loadModels3dList();
      } else {
        const savedId = Number(savedItem?.id ?? data?.id ?? id ?? 0) || 0;
        if (savedId > 0) {
          document.getElementById('models3d_item_id').value = String(savedId);
          const nextHash = `#models3d-item-edit?id=${savedId}`;
          window.__cldModels3dSuppressHashLoad = Date.now();
          if (window.location.hash !== nextHash) {
            window.location.hash = nextHash;
          }
          await loadModels3dItemEdit(savedId, savedItem);
        } else {
          console.warn('[Models3D] Сохранено без id — оставляем данные формы как есть');
        }
      }
    } catch (e) {
      console.error('❌ Ошибка сохранения 3D модели:', e);
      alert('Ошибка сохранения: ' + (e.message || e));
    }
  }

  async function deleteModels3dItem(itemId, itemName) {
    if (!confirm(`Удалить 3D модель "${itemName}"?`)) return;
    try {
      const resp = await fetch(`/api/catalog/item_delete/${encodeURIComponent(MODELS3D_LIST_TYPE)}/${encodeURIComponent(String(itemId))}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      if (window.toastr) window.toastr.success('Удалено');
      notifyCabinetModelLibraryStale();
      await loadModels3dList();
    } catch (e) {
      console.error('❌ Ошибка удаления 3D модели:', e);
      alert('Ошибка удаления');
    }
  }

  async function copyModels3dItem(itemId) {
    try {
      const resp = await fetch(`/api/catalog/item/${encodeURIComponent(MODELS3D_LIST_TYPE)}/${encodeURIComponent(String(itemId))}?t=${Date.now()}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const item = await resp.json();
      const copy = { ...item, id: 0, name: `${item?.name || '3D модель'} (копия)` };
      const addResp = await fetch(`/api/catalog/item_add/${encodeURIComponent(MODELS3D_LIST_TYPE)}/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(copy) });
      if (!addResp.ok) throw new Error(`HTTP ${addResp.status}`);
      if (window.toastr) window.toastr.success('Скопировано');
      notifyCabinetModelLibraryStale();
      await loadModels3dList();
    } catch (e) {
      console.error('❌ Ошибка копирования 3D модели:', e);
      alert('Ошибка копирования');
    }
  }

  async function toggleModels3dItemVisibility(itemId, iconElement) {
    try {
      const currentActive = iconElement.getAttribute('data-m3-active') === '1';
      const newActive = !currentActive;
      const resp = await fetch(`/api/catalog/item/${encodeURIComponent(MODELS3D_LIST_TYPE)}/${encodeURIComponent(String(itemId))}?t=${Date.now()}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const item = await resp.json();
      const updated = { ...item, active: newActive ? 1 : 0 };
      const updateResp = await fetch(`/api/catalog/item_update/${encodeURIComponent(MODELS3D_LIST_TYPE)}/${encodeURIComponent(String(itemId))}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (!updateResp.ok) throw new Error(`HTTP ${updateResp.status}`);
      // Обновляем иконку без перезагрузки всей таблицы
      iconElement.className = `fa ${newActive ? 'fa-eye' : 'fa-eye-slash'} btn btn-outline`;
      iconElement.setAttribute('data-m3-active', newActive ? '1' : '0');
      iconElement.setAttribute('title', newActive ? 'Видим' : 'Скрыт');
      if (window.toastr) window.toastr.success(newActive ? 'Показано' : 'Скрыто');
    } catch (e) {
      console.error('❌ Ошибка изменения видимости 3D модели:', e);
      alert('Ошибка изменения видимости');
    }
  }

  // ============================================
  // Инициализация обработчиков событий
  // ============================================
  function initModels3dListHandlers() {
    if (window.__models3dListHandlersBound) return;
    window.__models3dListHandlersBound = true;

    // Кнопка "Добавить"
    const m3AddBtn = document.getElementById('models3d-list-add-btn');
    if (m3AddBtn) {
      m3AddBtn.addEventListener('click', () => {
        openModels3dItemEdit(0);
      });
    }

    // Кнопка "Категории"
    const m3CatBtn = document.getElementById('models3d-list-categories-btn');
    if (m3CatBtn) {
      m3CatBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Открываем общую страницу дерева категорий (edges-categories) но с type=cabinet_model,
        // как в референсе Clodis: catalog/categories/cabinet_model.
        const baseName = '3D модели';
        const hash = `#edges-categories?type=cabinet_model&name=${encodeURIComponent(baseName)}`;
        window.location.hash = hash;
      });
      // Не даём браузеру переходить по старому href
      m3CatBtn.removeAttribute('href');
    }

    // Количество на странице
    const m3PerPage = document.getElementById('models3d-list-per-page');
    if (m3PerPage) {
      m3PerPage.addEventListener('change', (e) => {
        models3dListState.perPage = parseInt(e.target.value || '20', 10) || 20;
        models3dListState.currentPage = 1;
        renderModels3dListTable();
      });
    }

    // Фильтр категорий
    const m3Cat = document.getElementById('models3d-list-category-filter');
    if (m3Cat) {
      m3Cat.addEventListener('change', () => {
        models3dListState.currentPage = 1;
        renderModels3dListTable();
      });
    }

    // Поиск (debounce)
    const m3SearchInput = document.getElementById('models3d-list-search-input');
    if (m3SearchInput) {
      let searchTimeout = null;
      m3SearchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          models3dListState.currentPage = 1;
          renderModels3dListTable();
        }, 300);
      });
    }

    // Обработчики действий в таблице (редактировать/копировать/удалить/переключить видимость)
    const m3TableBody = document.getElementById('models3d-list-table-body');
    if (m3TableBody) {
      m3TableBody.addEventListener('click', (e) => {
        // Обрабатываем клики на иконки внутри кнопок
        const icon = e.target.closest('i[data-m3-action]');
        const link = e.target.closest('a[data-m3-action]');
        const btn = icon || link;
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        const action = btn.getAttribute('data-m3-action');
        const id = Number(btn.getAttribute('data-m3-id') || '0') || 0;
        const name = btn.getAttribute('data-m3-name') || '';
        if (action === 'edit') {
          openModels3dItemEdit(id);
        } else if (action === 'copy') {
          copyModels3dItem(id);
        } else if (action === 'delete') {
          deleteModels3dItem(id, name);
        } else if (action === 'toggle-visibility') {
          toggleModels3dItemVisibility(id, btn);
        }
      });
    }

    // Кнопки сохранения формы редактирования
    const m3SaveBtn = document.getElementById('save-models3d-item-btn');
    const m3SaveExitBtn = document.getElementById('save-and-exit-models3d-item-btn');
    if (m3SaveBtn) m3SaveBtn.addEventListener('click', () => saveModels3dItem(false));
    if (m3SaveExitBtn) m3SaveExitBtn.addEventListener('click', () => saveModels3dItem(true));

    // Кнопка отмены
    const m3CancelBtn = document.getElementById('cancel-models3d-item-btn');
    if (m3CancelBtn) {
      m3CancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.hash = '#models3d-list';
      });
    }

    // Кнопка «Загрузить» 3D модель — только файловый менеджер (загрузка с диска — внутри FM).
    const modelBrowseBtn = document.getElementById('models3d-model-browse-btn');
    const modelPathInput = document.getElementById('models3d-model-path');
    if (modelBrowseBtn && modelPathInput) {
      modelBrowseBtn.addEventListener('click', () => {
        if (typeof window.openFileManager !== 'function') {
          if (window.toastr) window.toastr.warning('Файловый менеджер не загружен. Обновите страницу.');
          else alert('Файловый менеджер недоступен. Обновите страницу.');
          return;
        }
        window.openFileManager({
          allowedExt: ['.glb', '.gltf', '.obj', '.fbx', '.stl'],
          initialPath: 'files',
          onSelect: function(r) {
            if (!r || !r.url) return;
            modelPathInput.value = r.url;
            modelPathInput.dispatchEvent(new Event('change', { bubbles: true }));
            if (window.toastr) window.toastr.success('Выбрана модель: ' + r.url);
          },
        });
      });
    }

    // Обработчик выбора иконки через файловый менеджер
    const iconPlaceholder = document.getElementById('models3d-item-icon-placeholder');
    const iconFile = document.getElementById('models3d-item-icon-file');
    const iconPreview = document.getElementById('models3d-item-icon-preview');
    const iconPreviewWrapper = document.getElementById('models3d-item-icon-preview-wrapper');
    const iconHidden = document.getElementById('models3d-item-icon');

    const pickIcon = () => {
      if (typeof window.openFileManager === 'function') {
        window.openFileManager({
          allowedExt: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
          initialPath: 'common_assets/images',
          onSelect: function(r) {
            if (r && r.url && iconHidden) {
              iconHidden.value = r.url;
              if (iconPreview) iconPreview.src = r.url;
              if (iconPreviewWrapper) iconPreviewWrapper.style.display = 'block';
              if (iconPlaceholder) iconPlaceholder.style.display = 'none';
            }
          }
        });
      } else if (window.toastr) window.toastr.warning('Файловый менеджер не загружен.');
      else alert('Файловый менеджер недоступен.');
    };

    if (iconPlaceholder) {
      iconPlaceholder.addEventListener('click', pickIcon);
    }

    if (iconFile && iconHidden) {
      iconFile.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          const url = event.target?.result;
          if (url && iconHidden) {
            iconHidden.value = url;
            if (iconPreview) iconPreview.src = url;
            if (iconPreviewWrapper) iconPreviewWrapper.style.display = 'block';
            if (iconPlaceholder) iconPlaceholder.style.display = 'none';
          }
        };
        reader.readAsDataURL(file);
      });
    }

    if (iconPreviewWrapper) {
      const iconPreviewIcon = iconPreviewWrapper.querySelector('.open_file');
      if (iconPreviewIcon) {
        iconPreviewIcon.addEventListener('click', (e) => {
          e.stopPropagation();
          pickIcon();
        });
      }
    }

    // Обработчики вкладок формы редактирования
    const tabLinks = document.querySelectorAll('#models3d-item-edit [data-tab]');
    tabLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tabName = link.getAttribute('data-tab');
        // Убираем активный класс со всех вкладок
        document.querySelectorAll('#models3d-item-edit .tab_menu_h li').forEach(li => li.classList.remove('active'));
        // Скрываем все панели
        document.querySelectorAll('#models3d-item-edit .tab-content-pane').forEach(pane => pane.style.display = 'none');
        // Активируем выбранную вкладку
        link.closest('li').classList.add('active');
        const pane = document.getElementById(`models3d-item-tab-${tabName}`);
        if (pane) pane.style.display = 'block';

        // Инициализация JSON редактора при переходе на вкладку JSON
        if (tabName === 'json') {
          if (!jsonEditor) {
            initJsonEditor();
          }
          // Обновляем размер редактора после отображения
          setTimeout(() => {
            if (jsonEditor) jsonEditor.resize();
          }, 100);
        }
      });
    });

    // Обработчики подвкладок внутри вкладки "Параметры"
    const subtabLinks = document.querySelectorAll('#models3d-item-tab-params [data-subtab]');
    subtabLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const subtabName = link.getAttribute('data-subtab');
        // Убираем активный класс со всех подвкладок
        document.querySelectorAll('#models3d-item-tab-params .nav-link').forEach(l => l.classList.remove('active'));
        // Скрываем все подпанели
        document.querySelectorAll('#models3d-item-tab-params .params-subtab-pane').forEach(pane => pane.style.display = 'none');
        // Активируем выбранную подвкладку
        link.classList.add('active');
        const pane = document.getElementById(`models3d-params-subtab-${subtabName}`);
        if (pane) pane.style.display = 'block';
        // При переходе на подвкладку "Материалы" обновляем список мешей и материалов
        if (subtabName === 'materials') {
          refreshModels3dMaterialsTab();
        }
      });
    });

    // Кнопки "Сброс" и "Авто материалы" во вкладке "Материалы"
    const materialsResetBtn = document.getElementById('models3d-materials-reset-btn');
    if (materialsResetBtn) {
      materialsResetBtn.addEventListener('click', () => {
        if (!jsonEditor) return;
        try {
          const raw = (jsonEditor.getValue() || '').toString().trim();
          if (!raw) return;
          const parsed = JSON.parse(raw);
          if (parsed.models && parsed.models[0]) {
            if (!parsed.models[0].params) parsed.models[0].params = {};
            parsed.models[0].params.meshes = {};
            const formatted = JSON.stringify(parsed, null, 2);
            jsonEditor.setValue(formatted, -1);
            refreshModels3dMaterialsTab();
            if (window.toastr) window.toastr.info('Материалы и меши сброшены (meshes очищен)');
          }
        } catch (e) {
          console.warn('[Models3D] Сброс материалов не удался:', e);
        }
      });
    }

    const slotFitEnabledEl = document.getElementById('models3d-model-slot-fit-enabled');
    if (slotFitEnabledEl) {
      slotFitEnabledEl.addEventListener('change', () => {
        syncModels3dFormToJsonEditor({ silent: true });
        try {
          const parsed = readParamsObjFromJsonEditor();
          refreshModels3dSlotFitPanel(readSlotFitFromParamsObj(parsed));
        } catch (_) {
          refreshModels3dSlotFitPanel(defaultSlotFitParams());
        }
      });
    }
    refreshModels3dSlotFitPanel(defaultSlotFitParams());

    const rodCompanionsIds = [
      'models3d-rod-companions-enabled',
      'models3d-rod-companions-model-id',
      'models3d-rod-companions-step-mm',
      'models3d-rod-companions-margin-mm',
      'models3d-rod-companions-offset-y',
      'models3d-rod-companions-offset-z',
      'models3d-rod-companions-rot-y',
    ];
    rodCompanionsIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el || el.dataset.cldRodCompBound) return;
      el.dataset.cldRodCompBound = '1';
      const evt = id === 'models3d-rod-companions-model-id' ? 'input' : 'change';
      el.addEventListener(evt, () => {
        applyRodCompanionsToJsonEditor();
        syncModels3dFormToJsonEditor({ silent: true });
        syncModels3dRodCompanionsPreview();
      });
      if (evt === 'change' && id !== 'models3d-rod-companions-enabled') {
        el.addEventListener('input', () => {
          applyRodCompanionsToJsonEditor();
          syncModels3dRodCompanionsPreview();
        });
      }
    });
    refreshModels3dRodCompanionsPanel(defaultRodCompanionsParams());

    const materialsAutoBtn = document.getElementById('models3d-materials-auto-btn');
    if (materialsAutoBtn) {
      materialsAutoBtn.addEventListener('click', async () => {
        if (!jsonEditor) return;
        try {
          const raw = (jsonEditor.getValue() || '').toString().trim();
          if (!raw) return;
          const parsed = JSON.parse(raw);
          if (!parsed.models || !parsed.models[0]) return;
          if (!parsed.models[0].params) parsed.models[0].params = {};
          if (!parsed.models[0].params.meshes) parsed.models[0].params.meshes = {};

          const meshes = parsed.models[0].params.meshes;
          const meshNames = Object.keys(meshes);
          if (!meshNames.length) {
            if (window.toastr) window.toastr.info('Сначала загрузите модель, чтобы получить меши');
            return;
          }

          const materials = await loadModels3dMaterialsOptions();
          if (!materials.length) {
            if (window.toastr) window.toastr.info('Сначала создайте материалы 3D моделей');
            return;
          }
          let selectedMaterialKey = '';
          let selectedMaterialId = '';

          // 1) Приоритет: уже выбранный материал любого меша (обычно пользователь выбирает в первой строке).
          for (const mk of meshNames) {
            const cur = meshes[mk];
            const opt = resolveMaterialOptionByMeshCfg(cur, materials);
            if (opt) {
              selectedMaterialKey = String(opt.key || opt.name || '').trim();
              selectedMaterialId = String(opt.id ?? '').trim();
              break;
            }
          }

          // 2) Фолбэк: если есть "Chrom/Хром", берём его (частый кейс для петель).
          if (!selectedMaterialKey) {
            const chrom = materials.find((m) => {
              const k = String(m.key || '').toLowerCase();
              const n = String(m.name || '').toLowerCase();
              return /chrom|chrome|хром/.test(k) || /chrom|chrome|хром/.test(n);
            });
            if (chrom) {
              selectedMaterialKey = String(chrom.key || chrom.name || '').trim();
              selectedMaterialId = String(chrom.id ?? '').trim();
            }
          }

          // 3) Последний фолбэк: первый материал из списка.
          if (!selectedMaterialKey) {
            selectedMaterialKey = String(materials[0].key || materials[0].name || '').trim();
            selectedMaterialId = String(materials[0].id ?? '').trim();
          }

          if (!selectedMaterialKey) {
            if (window.toastr) window.toastr.warning('Материал не выбран');
            return;
          }

          meshNames.forEach((name) => {
            if (!meshes[name]) meshes[name] = defaultMeshParams();
            meshes[name].material_id = selectedMaterialId || '';
            meshes[name].m = selectedMaterialKey;
            meshes[name].material = selectedMaterialKey;
            meshes[name].material_key = selectedMaterialKey;
            meshes[name].selected = selectedMaterialId || selectedMaterialKey || '';
          });

          const formatted = JSON.stringify(parsed, null, 2);
          jsonEditor.setValue(formatted, -1);
          refreshModels3dMaterialsTab();
          syncModels3dPreviewMaterials();
          try {
            window.dispatchEvent(new CustomEvent('cld:models3d-materials-updated', {
              detail: { source: 'auto-materials', material: selectedMaterialKey }
            }));
          } catch (_) {}
          const modelPath = (document.getElementById('models3d-model-path')?.value || '').trim();
          if (modelPath) {
            setTimeout(() => {
              try {
                console.log('[CLD][models3d] auto-materials -> force reload preview', { material: selectedMaterialKey, modelPath });
                loadModelInPreview(modelPath);
              } catch (_) {}
            }, 180);
          }
          if (window.toastr) window.toastr.success(`Применён материал "${selectedMaterialKey}" ко всем мешам`);
          console.log('[Models3D] Авто материалы:', selectedMaterialKey);
        } catch (e) {
          console.warn('[Models3D] Авто материалы не удались:', e);
          if (window.toastr) window.toastr.error('Ошибка авто назначения материалов');
        }
      });
    }

    // Кнопка из admin-new-bundle: "Применить ко всем" (может обновлять JSON вне этого модуля).
    const applyAllBtn = document.getElementById('models3d-apply-to-all-meshes-btn');
    if (applyAllBtn && !applyAllBtn.dataset.cldSyncBound) {
      applyAllBtn.dataset.cldSyncBound = '1';
      applyAllBtn.addEventListener('click', () => {
        setTimeout(() => {
          syncModels3dPreviewMaterials();
        }, 120);
      });
    }
    if (!window.__cldModels3dMaterialsEvtBound) {
      window.__cldModels3dMaterialsEvtBound = true;
      window.addEventListener('cld:models3d-materials-updated', () => {
        console.log('[CLD][models3d] event cld:models3d-materials-updated -> sync preview');
        setTimeout(() => syncModels3dPreviewMaterials(), 80);
      });
    }

    // Клик: slot_fit (целиком) + строки мешей — вся вкладка «Материалы»
    const materialsPane = document.getElementById('models3d-params-subtab-materials');
    if (materialsPane) {
      materialsPane.addEventListener('click', (e) => {
        const btn = e.target.closest(
          '[data-m3m-material-action], [data-m3m-axis-group], [data-m3m-slot-fit-group]'
        );
        if (!btn) return;

        // slot_fit — модель целиком (кнопки выше списка мешей)
        if (btn.hasAttribute('data-m3m-slot-fit-group')) {
          const group = btn.getAttribute('data-m3m-slot-fit-group');
          const axis = btn.getAttribute('data-axis');
          if (group && axis) applySlotFitAxisToJsonEditor(group, axis);
          return;
        }

        // Иконки материалов — только внутри списка мешей
        const meshesList = document.getElementById('models3d-materials-meshes-list');
        if (btn.hasAttribute('data-m3m-material-action')) {
          if (!meshesList || !meshesList.contains(btn)) return;
          const action = btn.getAttribute('data-m3m-material-action');
          const meshName = btn.getAttribute('data-mesh-name');
          if (!meshName) return;
          if (action === 'pick') {
            openModels3dMaterialPicker(meshName);
            return;
          } else if (action === 'goto') {
            window.location.hash = '#models3d-materials';
            return;
          } else if (action === 'clear') {
            if (!jsonEditor) return;
            try {
              const raw = (jsonEditor.getValue() || '').toString().trim();
              const parsed = raw ? JSON.parse(raw) : null;
              if (!parsed || !parsed.models || !parsed.models[0]) return;
              if (!parsed.models[0].params) parsed.models[0].params = {};
              if (!parsed.models[0].params.meshes) parsed.models[0].params.meshes = {};
              if (!parsed.models[0].params.meshes[meshName]) {
                parsed.models[0].params.meshes[meshName] = defaultMeshParams();
              }
              parsed.models[0].params.meshes[meshName].m = '';
              parsed.models[0].params.meshes[meshName].material = '';
              parsed.models[0].params.meshes[meshName].material_key = '';
              parsed.models[0].params.meshes[meshName].material_id = '';
              parsed.models[0].params.meshes[meshName].selected = '';
              const formatted = JSON.stringify(parsed, null, 2);
              jsonEditor.setValue(formatted, -1);
              refreshModels3dMaterialsTab();
              syncModels3dPreviewMaterials();
            } catch (err) {
              console.warn('[Models3D] Не удалось сбросить материал меша:', err);
            }
            return;
          }
        }

        // Per-mesh X/Y/Z — только внутри списка мешей
        if (btn.hasAttribute('data-m3m-axis-group')) {
          if (!meshesList || !meshesList.contains(btn)) return;
          if (!jsonEditor) return;
          const meshName = btn.getAttribute('data-mesh-name');
          const axis = btn.getAttribute('data-axis');
          const group = btn.getAttribute('data-m3m-axis-group');
          if (!meshName || !axis || !group) return;
          try {
            const raw = (jsonEditor.getValue() || '').toString().trim();
            const parsed = raw ? JSON.parse(raw) : null;
            if (!parsed || !parsed.models || !parsed.models[0]) return;
            if (!parsed.models[0].params) parsed.models[0].params = {};
            if (!parsed.models[0].params.meshes) parsed.models[0].params.meshes = {};
            if (!parsed.models[0].params.meshes[meshName]) {
              parsed.models[0].params.meshes[meshName] = defaultMeshParams();
            }
            const cfg = parsed.models[0].params.meshes[meshName];
            if (!cfg.t) cfg.t = { x: 0, y: 1, z: 0 };
            if (!cfg.s) cfg.s = { x: 0, y: 0, z: 0 };
            if (!cfg.tax) cfg.tax = { x: 'x', y: 'y' };

            if (group === 'taxX') {
              cfg.tax.x = axis;
            } else if (group === 'taxY') {
              cfg.tax.y = axis;
            } else if (group === 'adapt') {
              cfg.t.x = axis === 'x' ? 1 : 0;
              cfg.t.y = axis === 'y' ? 1 : 0;
              cfg.t.z = axis === 'z' ? 1 : 0;
            } else if (group === 'stretch') {
              cfg.s.x = axis === 'x' ? 1 : 0;
              cfg.s.y = axis === 'y' ? 1 : 0;
              cfg.s.z = axis === 'z' ? 1 : 0;
            }

            const formatted = JSON.stringify(parsed, null, 2);
            jsonEditor.setValue(formatted, -1);
            refreshModels3dMaterialsTab();
          } catch (err) {
            console.warn('[Models3D] Не удалось обновить оси/адаптацию/растягивание:', err);
          }
        }
      });
    }

    // Обработчики модального окна выбора материала
    const pickerCloseBtn = document.getElementById('models3d-materials-picker-close');
    const pickerCloseFooterBtn = document.getElementById('models3d-materials-picker-close-footer');
    const pickerBackdrop = document.getElementById('models3d-materials-picker-modal');
    const pickerTableBody = document.getElementById('models3d-materials-picker-body');

    [pickerCloseBtn, pickerCloseFooterBtn].forEach((btn) => {
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          closeModels3dMaterialPicker();
        });
      }
    });
    if (pickerBackdrop) {
      pickerBackdrop.addEventListener('click', (e) => {
        if (e.target === pickerBackdrop) {
          closeModels3dMaterialPicker();
        }
      });
    }
    if (pickerTableBody) {
      pickerTableBody.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-m3m-picker-action="choose"]');
        if (!btn) return;
        const key = btn.getAttribute('data-key') || '';
        const materialId = btn.getAttribute('data-id') || '';
        const meshName = __models3dMaterialsPickerMeshName;
        if (!meshName || !key) {
          closeModels3dMaterialPicker();
          return;
        }
        if (!jsonEditor) return;
        try {
          const raw = (jsonEditor.getValue() || '').toString().trim();
          const parsed = raw ? JSON.parse(raw) : null;
          if (!parsed || !parsed.models || !parsed.models[0]) return;
          if (!parsed.models[0].params) parsed.models[0].params = {};
          if (!parsed.models[0].params.meshes) parsed.models[0].params.meshes = {};
          if (!parsed.models[0].params.meshes[meshName]) {
            parsed.models[0].params.meshes[meshName] = defaultMeshParams();
          }
          parsed.models[0].params.meshes[meshName].m = key;
          parsed.models[0].params.meshes[meshName].material = key;
          parsed.models[0].params.meshes[meshName].material_key = key;
          parsed.models[0].params.meshes[meshName].material_id = materialId;
          parsed.models[0].params.meshes[meshName].selected = materialId || key;
          const formatted = JSON.stringify(parsed, null, 2);
          jsonEditor.setValue(formatted, -1);
          refreshModels3dMaterialsTab();
          closeModels3dMaterialPicker();
          // Отправляем обновлённые материалы в iframe
          syncModels3dPreviewMaterials();
        } catch (err) {
          console.warn('[Models3D] Не удалось применить выбранный материал:', err);
        }
      });
    }

    // Обработчики изменения размеров для обновления bounding box
    const minMaxFields = ['models3d-model-min-x', 'models3d-model-min-y', 'models3d-model-min-z', 
                          'models3d-model-max-x', 'models3d-model-max-y', 'models3d-model-max-z'];
    minMaxFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.addEventListener('input', () => {
          const minX = Number(document.getElementById('models3d-model-min-x')?.value || 0);
          const minY = Number(document.getElementById('models3d-model-min-y')?.value || 0);
          const minZ = Number(document.getElementById('models3d-model-min-z')?.value || 0);
          const maxX = Number(document.getElementById('models3d-model-max-x')?.value || 0);
          const maxY = Number(document.getElementById('models3d-model-max-y')?.value || 0);
          const maxZ = Number(document.getElementById('models3d-model-max-z')?.value || 0);
          updateBoundingBox(minX, minY, minZ, maxX, maxY, maxZ);
        });
      }
    });

    // Обработчик изменения пути к модели для загрузки в превью и обновления JSON
    const modelPathEl = document.getElementById('models3d-model-path');
    if (modelPathEl) {
      modelPathEl.addEventListener('change', () => {
        const path = modelPathEl.value.trim();
        // Обновляем JSON редактор, чтобы путь сохранялся
        if (jsonEditor) {
          try {
            const raw = jsonEditor.getValue() || '{}';
            const parsed = JSON.parse(raw);
            if (parsed && parsed.models && parsed.models[0]) {
              parsed.models[0].model = path;
              jsonEditor.setValue(JSON.stringify(parsed, null, 2), -1);
              console.log('[Models3D] JSON редактор обновлён с путём к модели:', path);
            }
          } catch (e) {
            console.warn('[Models3D] Не удалось обновить JSON редактор:', e);
          }
        }
        // Загружаем модель в превью
        if (path) {
          loadModelInPreview(path);
        }
      });
    }

    // При изменении масштаба/позиции/поворота — обновляем превью в реальном времени
    ['models3d-model-scale-x', 'models3d-model-scale-y', 'models3d-model-scale-z',
     'models3d-model-pos-x', 'models3d-model-pos-y', 'models3d-model-pos-z',
     'models3d-model-rot-x', 'models3d-model-rot-y', 'models3d-model-rot-z'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => {
          syncModels3dFormToJsonEditor();
          applyModelTransformToPreview();
        });
        el.addEventListener('input', () => {
          syncModels3dFormToJsonEditor();
          applyModelTransformToPreview();
        });
      }
    });
  }

  // ============================================
  // Работа с параметрами модели (упрощенная структура)
  // ============================================
  
  function updateBoundingBox(minX, minY, minZ, maxX, maxY, maxZ) {
    const minEl = document.getElementById('models3d-bbox-min');
    const maxEl = document.getElementById('models3d-bbox-max');
    if (minEl) minEl.textContent = `${minX}x${minY}x${minZ}`;
    if (maxEl) maxEl.textContent = `${maxX}x${maxY}x${maxZ}`;
  }

  // ============================================
  // Работа с JSON редактором (вкладка "Код JSON")
  // ============================================
  let jsonEditor = null;
  let jsonEditorOriginalData = null;

  function initJsonEditor() {
    const container = document.getElementById('models3d-json-editor');
    if (!container || jsonEditor) return;

    try {
      // ACE может ещё не быть загружен (скрипт не успел подключиться) — в этом случае просто выходим.
      if (typeof window.ace === 'undefined') {
        console.warn('[Models3D][JSON] ACE editor not loaded yet, skip init.');
        return;
      }

      jsonEditor = ace.edit('models3d-json-editor');
      jsonEditor.setTheme('ace/theme/textmate');
      jsonEditor.session.setMode('ace/mode/json');
      jsonEditor.setOptions({
        fontSize: '14px',
        showPrintMargin: false,
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        tabSize: 2,
        useSoftTabs: true
      });
      
      // Обработчик кнопки "Применить"
      const applyBtn = document.getElementById('models3d-json-apply-btn');
      if (applyBtn) {
        applyBtn.addEventListener('click', () => {
          applyJsonEditorData();
        });
      }

      // Обработчик кнопки "Форматировать"
      const formatBtn = document.getElementById('models3d-json-format-btn');
      if (formatBtn) {
        formatBtn.addEventListener('click', () => {
          formatJsonEditor();
        });
      }

      // Обработчик кнопки "Сбросить"
      const resetBtn = document.getElementById('models3d-json-reset-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          resetJsonEditor();
        });
      }
    } catch (e) {
      console.error('Ошибка инициализации ACE Editor:', e);
    }
  }

  function loadJsonEditorData(itemData) {
    if (!jsonEditor) initJsonEditor();
    if (!jsonEditor) return;

    try {
      // Референс: во вкладке JSON показывается именно params (version/group/variants/models...), а не вся обёртка.
      const paramsObj = getParamsObjectFromCurrentItemData(itemData) || itemData;
      const jsonString = JSON.stringify(paramsObj, null, 2);
      jsonEditor.setValue(jsonString, -1);
      jsonEditorOriginalData = jsonString;
      // После загрузки JSON сразу обновляем вкладку "Материалы"
      refreshModels3dMaterialsTab();
    } catch (e) {
      console.error('Ошибка загрузки данных в JSON редактор:', e);
    }
  }

  function applyJsonEditorData() {
    if (!jsonEditor) return;

    try {
      const jsonString = jsonEditor.getValue();
      const parsedParams = JSON.parse(jsonString);
      
      // В JSON редактируем params напрямую (как в референсе)
      if (parsedParams?.models?.[0]) {
        const model = parsedParams.models[0];
        const modelNameInput = document.getElementById('models3d-model-name');
        const modelCodeInput = document.getElementById('models3d-model-code');
        const modelPathInput = document.getElementById('models3d-model-path');
        
        if (modelNameInput) modelNameInput.value = model.name || '';
        if (modelCodeInput) modelCodeInput.value = model.code || '';
        if (modelPathInput) modelPathInput.value = model.model || '';

        // Обновляем bounding box
        if (model.min_x !== undefined) {
          updateBoundingBox(
            model.min_x || 0, model.min_y || 0, model.min_z || 0,
            model.max_x || 0, model.max_y || 0, model.max_z || 0
          );
        }

        // Трансформы
        const scaleX = document.getElementById('models3d-model-scale-x');
        const scaleY = document.getElementById('models3d-model-scale-y');
        const scaleZ = document.getElementById('models3d-model-scale-z');
        const posX = document.getElementById('models3d-model-pos-x');
        const posY = document.getElementById('models3d-model-pos-y');
        const posZ = document.getElementById('models3d-model-pos-z');
        const rotX = document.getElementById('models3d-model-rot-x');
        const rotY = document.getElementById('models3d-model-rot-y');
        const rotZ = document.getElementById('models3d-model-rot-z');
        if (scaleX) scaleX.value = ((model.params?.scale?.x ?? 100) / 100);
        if (scaleY) scaleY.value = ((model.params?.scale?.y ?? 100) / 100);
        if (scaleZ) scaleZ.value = ((model.params?.scale?.z ?? 100) / 100);
        if (posX) posX.value = (model.params?.pos?.x ?? 0);
        if (posY) posY.value = (model.params?.pos?.y ?? 0);
        if (posZ) posZ.value = (model.params?.pos?.z ?? 0);
        if (rotX) rotX.value = (model.params?.rot?.x ?? 0);
        if (rotY) rotY.value = (model.params?.rot?.y ?? 0);
        if (rotZ) rotZ.value = (model.params?.rot?.z ?? 0);
      }

      refreshModels3dMaterialsTab();
      const appliedPath = (parsedParams?.models?.[0]?.model || '').trim();
      if (appliedPath) {
        loadModelInPreview(appliedPath);
      }

      if (window.toastr) window.toastr.success('JSON применен к форме');
      jsonEditorOriginalData = jsonString;
    } catch (e) {
      console.error('Ошибка применения JSON:', e);
      if (window.toastr) window.toastr.error('Ошибка в JSON: ' + e.message);
    }
  }

  function formatJsonEditor() {
    if (!jsonEditor) return;

    try {
      const jsonString = jsonEditor.getValue();
      const parsedData = JSON.parse(jsonString);
      const formattedString = JSON.stringify(parsedData, null, 2);
      jsonEditor.setValue(formattedString, -1);
      if (window.toastr) window.toastr.success('JSON отформатирован');
    } catch (e) {
      console.error('Ошибка форматирования JSON:', e);
      if (window.toastr) window.toastr.error('Ошибка в JSON: ' + e.message);
    }
  }

  function resetJsonEditor() {
    if (!jsonEditor || !jsonEditorOriginalData) return;

    if (confirm('Сбросить изменения в JSON?')) {
      jsonEditor.setValue(jsonEditorOriginalData, -1);
      if (window.toastr) window.toastr.info('JSON сброшен к исходному состоянию');
    }
  }

  // ============================================
  // 3D Превью: используем ВАШУ сцену из каталога элементов (constructor-clodis)
  // Та же сцена со стрелками, размерами и секцией — без движка Clodis
  // ============================================
  let __models3dPreviewIframe = null;
  let __models3dPreviewReady = false;

  // ===== Референс: автозаполнение params.meshes по реально загруженной модели =====
  function defaultSlotFitParams() {
    return {
      enabled: 0,
      s: { x: 0, y: 0, z: 0 },
      t: { x: 0, y: 0, z: 0 },
    };
  }

  /** Блок «авто-вешалки» и slot_fit по X — только у штанги, не у вешалки #23. */
  function isModels3dRodBarItem(itemId, itemName, paramsObj) {
    const numId = Number(itemId) || 0;
    if (numId === 22) return true;
    const n = String(itemName || '').toLowerCase();
    if (/штанг|shtang|rod|bar/i.test(n)) return true;
    const m0 = paramsObj?.models?.[0];
    const p = m0?.params;
    const sf = p?.slot_fit;
    if (sf && sf.enabled && Number(sf.s?.x)) return true;
    const comp = p?.companions;
    if (comp && (comp.enabled === 1 || comp.enabled === true)) return true;
    return false;
  }

  function refreshModels3dRodCompanionsSectionVisibility(itemId, itemName, paramsObj) {
    const show = isModels3dRodBarItem(itemId, itemName, paramsObj);
    const section = document.getElementById('models3d-rod-companions-section');
    const slotSection = document.getElementById('models3d-slot-fit-section');
    const hint = document.getElementById('models3d-rod-companions-hint');
    if (section) section.style.display = show ? '' : 'none';
    if (slotSection) slotSection.style.display = show ? '' : 'none';
    if (hint) hint.style.display = show ? 'none' : 'block';
    const hintLink = document.getElementById('models3d-rod-companions-hint-link');
    if (hintLink && !hintLink.dataset.cldBound) {
      hintLink.dataset.cldBound = '1';
      hintLink.addEventListener('click', (e) => {
        e.preventDefault();
        openModels3dItemEdit(22);
      });
    }
  }

  function readSlotFitFromParamsObj(paramsObj) {
    const sf = paramsObj?.models?.[0]?.params?.slot_fit;
    if (!sf || typeof sf !== 'object') return defaultSlotFitParams();
    return {
      enabled: sf.enabled ? 1 : 0,
      s: {
        x: Number(sf.s?.x) ? 1 : 0,
        y: Number(sf.s?.y) ? 1 : 0,
        z: Number(sf.s?.z) ? 1 : 0,
      },
      t: {
        x: Number(sf.t?.x) ? 1 : 0,
        y: Number(sf.t?.y) ? 1 : 0,
        z: Number(sf.t?.z) ? 1 : 0,
      },
    };
  }

  function refreshModels3dSlotFitPanel(slotFit) {
    const wrap = document.getElementById('models3d-slot-fit-axes-wrap');
    const enabledEl = document.getElementById('models3d-model-slot-fit-enabled');
    const sf = slotFit || defaultSlotFitParams();
    if (enabledEl) enabledEl.checked = !!sf.enabled;

    if (!wrap) return;

    const stretchAxis = sf.s?.x ? 'x' : sf.s?.y ? 'y' : sf.s?.z ? 'z' : '';
    const adaptAxis = sf.t?.x ? 'x' : sf.t?.y ? 'y' : sf.t?.z ? 'z' : '';

    const makeRow = (label, group, current) => {
      const axes = ['x', 'y', 'z'];
      const buttons = axes.map((ax) => {
        const active = current === ax;
        const cls = active ? 'btn btn-xs btn-primary' : 'btn btn-xs btn-default';
        return `<button type="button" class="${cls}" data-m3m-slot-fit-group="${group}" data-axis="${ax}">${ax.toUpperCase()}</button>`;
      }).join('');
      return `
        <div class="form-group row" style="margin-top:4px; margin-bottom:4px;">
          <label class="col-sm-6 col-form-label" style="padding-top:0; padding-bottom:0; font-size:12px;">${label}</label>
          <div class="col-sm-6">
            <div class="btn-group btn-group-xs d-inline-flex" role="group" style="gap:4px; white-space:nowrap;">
              ${buttons}
            </div>
          </div>
        </div>
      `;
    };

    wrap.innerHTML =
      makeRow('Растягивание (целиком)', 'stretch', stretchAxis || '_none_') +
      makeRow('Адаптация (целиком)', 'adapt', adaptAxis || '_none_');
    wrap.style.opacity = sf.enabled ? '1' : '0.45';
    wrap.style.pointerEvents = sf.enabled ? '' : 'none';
  }

  function applySlotFitAxisToJsonEditor(group, axis) {
    if (!jsonEditor) return;
    try {
      const raw = (jsonEditor.getValue() || '').toString().trim();
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed?.models?.[0]) return;
      if (!parsed.models[0].params) parsed.models[0].params = {};
      const sf = parsed.models[0].params.slot_fit || defaultSlotFitParams();
      if (!sf.s) sf.s = { x: 0, y: 0, z: 0 };
      if (!sf.t) sf.t = { x: 0, y: 0, z: 0 };
      if (group === 'stretch') {
        sf.s.x = axis === 'x' ? 1 : 0;
        sf.s.y = axis === 'y' ? 1 : 0;
        sf.s.z = axis === 'z' ? 1 : 0;
      } else if (group === 'adapt') {
        sf.t.x = axis === 'x' ? 1 : 0;
        sf.t.y = axis === 'y' ? 1 : 0;
        sf.t.z = axis === 'z' ? 1 : 0;
      }
      const enabledEl = document.getElementById('models3d-model-slot-fit-enabled');
      sf.enabled = enabledEl?.checked ? 1 : 0;
      parsed.models[0].params.slot_fit = sf;
      jsonEditor.setValue(JSON.stringify(parsed, null, 2), -1);
      refreshModels3dSlotFitPanel(readSlotFitFromParamsObj(parsed));
    } catch (err) {
      console.warn('[Models3D] slot_fit axis:', err);
    }
  }

  function defaultRodCompanionsParams() {
    return {
      enabled: 0,
      model_id: '23',
      step_mm: 400,
      margin_mm: 150,
      preview_only: 0,
      offset: { x: 0, y: 0, z: 0 },
      rot: { x: 0, y: 60, z: 0 },
      size: { x: 430, y: 200, z: 30 },
    };
  }

  function readRodCompanionsFromParamsObj(paramsObj) {
    const raw = paramsObj?.models?.[0]?.params?.companions;
    const d = defaultRodCompanionsParams();
    if (!raw || typeof raw !== 'object') return d;
    return {
      enabled: raw.enabled ? 1 : 0,
      model_id: String(raw.model_id != null ? raw.model_id : raw.modelId || d.model_id),
      step_mm: Number(raw.step_mm != null ? raw.step_mm : raw.step) || d.step_mm,
      margin_mm:
        Number(raw.margin_mm != null ? raw.margin_mm : raw.margin) >= 0
          ? Number(raw.margin_mm != null ? raw.margin_mm : raw.margin)
          : d.margin_mm,
      preview_only:
        raw.preview_only === false ||
        raw.previewOnly === false ||
        raw.preview_only === 0 ||
        raw.previewOnly === 0
          ? 0
          : 1,
      offset: {
        x: Number(raw.offset?.x) || 0,
        y: Number(raw.offset?.y ?? d.offset.y),
        z: Number(raw.offset?.z ?? d.offset.z),
      },
      rot: {
        x: Number(raw.rot?.x) || 0,
        y: Number(raw.rot?.y ?? d.rot.y),
        z: Number(raw.rot?.z) || 0,
      },
      size: {
        x: Number(raw.size?.x) || d.size.x,
        y: Number(raw.size?.y) || d.size.y,
        z: Number(raw.size?.z) || d.size.z,
      },
    };
  }

  function readSignedMmInput(elId, fallback) {
    const raw = String(document.getElementById(elId)?.value ?? '').trim();
    if (raw === '' || raw === '-' || raw === '+') return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  }

  function readRodCompanionsFromForm() {
    const d = defaultRodCompanionsParams();
    return {
      enabled: document.getElementById('models3d-rod-companions-enabled')?.checked ? 1 : 0,
      model_id:
        String(document.getElementById('models3d-rod-companions-model-id')?.value || d.model_id).trim() ||
        d.model_id,
      step_mm: Number(document.getElementById('models3d-rod-companions-step-mm')?.value) || d.step_mm,
      margin_mm: Number(document.getElementById('models3d-rod-companions-margin-mm')?.value) ?? d.margin_mm,
      preview_only: 0,
      offset: {
        x: 0,
        y: readSignedMmInput('models3d-rod-companions-offset-y', d.offset.y),
        z: readSignedMmInput('models3d-rod-companions-offset-z', d.offset.z),
      },
      rot: {
        x: 0,
        y: Number(document.getElementById('models3d-rod-companions-rot-y')?.value) ?? d.rot.y,
        z: 0,
      },
      size: { ...d.size },
    };
  }

  function buildRodCompanionsPreviewPayloadFromForm() {
    const editId = Number(document.getElementById('models3d_item_id')?.value) || 0;
    const editName = String(document.getElementById('models3d-item-name')?.value || '');
    let paramsObj = null;
    try {
      paramsObj = readParamsObjFromJsonEditor();
    } catch (_) {}
    if (!isModels3dRodBarItem(editId, editName, paramsObj)) return null;
    const c = readRodCompanionsFromForm();
    if (!c.enabled) return { enabled: 0 };
    return {
      enabled: 1,
      model_id: c.model_id,
      step_mm: c.step_mm,
      margin_mm: c.margin_mm,
      preview_only: 0,
      offset: c.offset,
      rot: c.rot,
      size: c.size,
    };
  }

  let __syncRodCompPreviewTimeout = null;
  function syncModels3dRodCompanionsPreview() {
    if (!__models3dPreviewIframe || !__models3dPreviewIframe.contentWindow) return;
    if (__syncRodCompPreviewTimeout) clearTimeout(__syncRodCompPreviewTimeout);
    __syncRodCompPreviewTimeout = setTimeout(() => {
      __syncRodCompPreviewTimeout = null;
      const payload = buildRodCompanionsPreviewPayloadFromForm();
      if (!payload) {
        __models3dPreviewIframe.contentWindow.postMessage(
          { type: 'cld:previewRodCompanions', rodCompanions: { enabled: 0 } },
          '*'
        );
        return;
      }
      __models3dPreviewIframe.contentWindow.postMessage(
        { type: 'cld:previewRodCompanions', rodCompanions: payload },
        '*'
      );
    }, 120);
  }

  function refreshModels3dRodCompanionsPanel(companions) {
    const c = companions || defaultRodCompanionsParams();
    const enabledEl = document.getElementById('models3d-rod-companions-enabled');
    const modelIdEl = document.getElementById('models3d-rod-companions-model-id');
    const stepEl = document.getElementById('models3d-rod-companions-step-mm');
    const marginEl = document.getElementById('models3d-rod-companions-margin-mm');
    const offYEl = document.getElementById('models3d-rod-companions-offset-y');
    const offZEl = document.getElementById('models3d-rod-companions-offset-z');
    const rotYEl = document.getElementById('models3d-rod-companions-rot-y');
    const panel = document.getElementById('models3d-rod-companions-panel');
    if (enabledEl) enabledEl.checked = !!c.enabled;
    if (modelIdEl) modelIdEl.value = c.model_id;
    if (stepEl) stepEl.value = c.step_mm;
    if (marginEl) marginEl.value = c.margin_mm;
    if (offYEl) offYEl.value = c.offset.y;
    if (offZEl) offZEl.value = c.offset.z;
    if (rotYEl) rotYEl.value = c.rot.y;
    if (panel) {
      panel.style.opacity = c.enabled ? '1' : '0.55';
      panel.style.pointerEvents = c.enabled ? '' : 'none';
    }
  }

  function applyRodCompanionsToJsonEditor() {
    if (!jsonEditor) return;
    try {
      const raw = (jsonEditor.getValue() || '').toString().trim();
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed?.models?.[0]) return;
      if (!parsed.models[0].params) parsed.models[0].params = {};
      const c = readRodCompanionsFromForm();
      if (c.enabled) {
        parsed.models[0].params.companions = {
          enabled: 1,
          model_id: c.model_id,
          step_mm: c.step_mm,
          margin_mm: c.margin_mm,
          preview_only: 0,
          offset: { x: c.offset.x, y: c.offset.y, z: c.offset.z },
          rot: { x: c.rot.x, y: c.rot.y, z: c.rot.z },
          size: { x: c.size.x, y: c.size.y, z: c.size.z },
        };
      } else {
        delete parsed.models[0].params.companions;
      }
      jsonEditor.setValue(JSON.stringify(parsed, null, 2), -1);
    } catch (err) {
      console.warn('[Models3D] companions:', err);
    }
  }

  function defaultMeshParams() {
    // Как в референсе: если материал не задан — не навязываем id=2 (Opora).
    // Модель должна использовать материал, запечённый в GLB.
    return {
      v: 1,
      material_id: '',
      m: '',
      material_key: '',
      material: '',
      t: { x: 0, y: 1, z: 0 },
      s: { x: 0, y: 0, z: 0 },
      tax: { x: 'x', y: 'y' },
      selected: ''
    };
  }

  // Кэш материалов 3D моделей (model_key_material) для выпадающего списка во вкладке "Материалы"
  let models3dMaterialsOptionsCache = null; // [{ key, name }, ...]

  async function loadModels3dMaterialsOptions() {
    if (models3dMaterialsOptionsCache) return models3dMaterialsOptionsCache;
    try {
      const materialCategoryById = {};
      try {
        const cResp = await fetch(`/api/catalog/categories_get/model_key_material?t=${Date.now()}`, { cache: 'no-cache' });
        if (cResp.ok) {
          const cData = await cResp.json();
          const cArr = Array.isArray(cData) ? cData : (Array.isArray(cData?.items) ? cData.items : []);
          cArr.forEach((c) => {
            const id = String(c?.id ?? '').trim();
            const name = String(c?.name ?? '').trim();
            if (id && name) materialCategoryById[id] = name;
          });
        }
      } catch (_) {}

      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('per_page', '1000');
      params.set('t', String(Date.now()));
      const resp = await fetch(`/api/catalog/items_get/model_key_material?${params.toString()}`, { cache: 'no-cache' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const items = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
      const opts = items.map((it) => {
        let key = '';
        try {
          if (it.data) {
            const d = typeof it.data === 'string' ? JSON.parse(it.data) : it.data;
            key = (d?.key || '').toString();
          }
        } catch (_) {
          key = '';
        }
        const rawCategory = String(getModels3dCategory(it) || '').trim();
        const categoryName = materialCategoryById[rawCategory] || rawCategory;
        return {
          id: it.id,
          key,
          name: (it.name || '').toString() || key || `Материал #${it.id}`,
          displayName: ((it.name || '').toString() || key || `Материал #${it.id}`),
          category: categoryName,
          categoryRaw: rawCategory,
        };
      }).filter(o => o.key || o.name);
      models3dMaterialsOptionsCache = opts;
      return opts;
    } catch (e) {
      console.warn('[Models3D] Не удалось загрузить материалы 3D моделей:', e);
      models3dMaterialsOptionsCache = [];
      return [];
    }
  }

  function resolveMaterialOptionByMeshCfg(cfg, materials) {
    const list = Array.isArray(materials) ? materials : [];
    const idToken = String(cfg?.material_id ?? cfg?.mat_id ?? '').trim();
    if (idToken) {
      const byId = list.find((m) => String(m?.id ?? '').trim() === idToken);
      if (byId) return byId;
    }
    const keyToken = String(cfg?.material_key ?? cfg?.m ?? cfg?.material ?? cfg?.selected ?? '').trim();
    if (!keyToken) return null;
    const keyLower = keyToken.toLowerCase();
    return list.find((m) => {
      const mk = String(m?.key || '').toLowerCase();
      const mn = String(m?.name || '').toLowerCase();
      const mid = String(m?.id ?? '').trim();
      return mk === keyLower || mn === keyLower || mid === keyToken;
    }) || null;
  }

  // Перерисовать вкладку "Материалы" на основе текущего JSON (params.meshes)
  async function refreshModels3dMaterialsTab() {
    const container = document.getElementById('models3d-materials-meshes-list');
    if (!container) return;

    // Гарантируем, что JSON-редактор инициализирован
    if (!jsonEditor) initJsonEditor();
    if (!jsonEditor) return;

    let paramsObj = null;
    try {
      const raw = (jsonEditor.getValue() || '').toString().trim();
      if (raw) {
        paramsObj = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[Models3D] Не удалось разобрать JSON для вкладки материалов:', e);
      return;
    }
    if (!paramsObj || !Array.isArray(paramsObj.models) || !paramsObj.models[0]) {
      container.innerHTML = '<p class="text-muted text-center" style="padding: 20px;">Нет данных по модели</p>';
      return;
    }
    const m0 = paramsObj.models[0];
    if (!m0.params || typeof m0.params !== 'object') {
      m0.params = {};
    }
    if (!m0.params.meshes || typeof m0.params.meshes !== 'object') {
      m0.params.meshes = {};
    }
    const meshes = m0.params.meshes;
    const meshNames = Object.keys(meshes);

    if (!meshNames.length) {
      container.innerHTML = '<p class="text-muted text-center" style="padding: 20px;">Здесь будут отображаться меши модели после загрузки 3D файла</p>';
      return;
    }

    const materials = await loadModels3dMaterialsOptions();

    const rows = document.createElement('div');
    rows.className = 'models3d-materials-meshes-table';

    meshNames.forEach((meshName) => {
      const cfg = meshes[meshName] || defaultMeshParams();
      meshes[meshName] = cfg;

      const row = document.createElement('div');
      row.className = 'form-group row align-items-center';

      const labelCol = document.createElement('div');
      labelCol.className = 'col-sm-4';
      labelCol.innerHTML = `<strong>${meshName}</strong>`;

      const controlsCol = document.createElement('div');
      controlsCol.className = 'col-sm-8';

      const wrap = document.createElement('div');
      wrap.className = 'd-flex align-items-center';
      wrap.style.gap = '8px';
      wrap.style.flexWrap = 'wrap';

      const matInfo = resolveMaterialOptionByMeshCfg(cfg, materials);
      const labelSpan = document.createElement('span');
      labelSpan.className = 'badge badge-light border';
      labelSpan.dataset.meshName = meshName;
      labelSpan.textContent = matInfo
        ? `${matInfo.displayName} (${matInfo.key || matInfo.displayName})`
        : '— без материала —';

      const pickBtn = document.createElement('button');
      pickBtn.type = 'button';
      pickBtn.className = 'btn btn-xs btn-outline-primary';
      pickBtn.title = 'Выбрать материал';
      pickBtn.setAttribute('data-m3m-material-action', 'pick');
      pickBtn.setAttribute('data-mesh-name', meshName);
      pickBtn.innerHTML = '<i class="fa fa-folder-open"></i>';

      const gotoBtn = document.createElement('button');
      gotoBtn.type = 'button';
      gotoBtn.className = 'btn btn-xs btn-outline-info';
      gotoBtn.title = 'Открыть список материалов';
      gotoBtn.setAttribute('data-m3m-material-action', 'goto');
      gotoBtn.setAttribute('data-mesh-name', meshName);
      gotoBtn.innerHTML = '<i class="fa fa-link"></i>';

      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'btn btn-xs btn-outline-danger';
      clearBtn.title = 'Сбросить материал';
      clearBtn.setAttribute('data-m3m-material-action', 'clear');
      clearBtn.setAttribute('data-mesh-name', meshName);
      clearBtn.innerHTML = '<i class="fa fa-trash"></i>';

      wrap.appendChild(labelSpan);
      wrap.appendChild(pickBtn);
      wrap.appendChild(gotoBtn);
      wrap.appendChild(clearBtn);

      controlsCol.appendChild(wrap);

      // ===== Блок осей / адаптации / растягивания как в рефе =====
      const tax = cfg.tax || { x: 'x', y: 'y' };
      const t = cfg.t || { x: 0, y: 1, z: 0 };
      const s = cfg.s || { x: 0, y: 0, z: 0 };

      const adaptAxis =
        t.x === 1 ? 'x' :
        t.z === 1 ? 'z' :
        'y';

      const stretchAxis =
        s.x ? 'x' :
        s.y ? 'y' :
        s.z ? 'z' :
        '';

      const makeAxisRowHtml = (label, group, current) => {
        const axes = ['x', 'y', 'z'];
        const buttons = axes.map(ax => {
          const active = current === ax;
          const cls = active ? 'btn btn-xs btn-primary' : 'btn btn-xs btn-default';
          return `<button type="button" class="${cls}" data-m3m-axis-group="${group}" data-mesh-name="${meshName}" data-axis="${ax}">${ax.toUpperCase()}</button>`;
        }).join('');
        return `
          <div class="form-group row" style="margin-top:4px; margin-bottom:4px;">
            <label class="col-sm-6 col-form-label" style="padding-top:0; padding-bottom:0; font-size:12px;">${label}</label>
            <div class="col-sm-6">
              <div class="btn-group btn-group-xs d-inline-flex" role="group" style="gap:4px; white-space:nowrap;">
                ${buttons}
              </div>
            </div>
          </div>
        `;
      };

      const axesHtml =
        makeAxisRowHtml('Текстурная ось X', 'taxX', (tax.x || 'x')) +
        makeAxisRowHtml('Текстурная ось Y', 'taxY', (tax.y || 'y')) +
        makeAxisRowHtml('Адаптация', 'adapt', adaptAxis) +
        makeAxisRowHtml('Растягивание', 'stretch', stretchAxis || '_none_');

      const axesWrapper = document.createElement('div');
      axesWrapper.innerHTML = axesHtml;
      controlsCol.appendChild(axesWrapper);

      row.appendChild(labelCol);
      row.appendChild(controlsCol);
      rows.appendChild(row);
    });

    container.innerHTML = '';
    container.appendChild(rows);
  }

  // Текущее имя меша, для которого открыт модальный выбор материала
  let __models3dMaterialsPickerMeshName = null;

  // Открыть модальное окно выбора материала 3D моделей
  async function openModels3dMaterialPicker(meshName) {
    __models3dMaterialsPickerMeshName = meshName;
    const modal = document.getElementById('models3d-materials-picker-modal');
    const tbody = document.getElementById('models3d-materials-picker-body');
    if (!modal || !tbody) return;

    modal.style.display = 'block';
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:12px;">Загрузка...</td></tr>';

    const materials = await loadModels3dMaterialsOptions();
    if (!materials.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:12px; color:#999;">Нет материалов 3D моделей</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    materials.forEach((m) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="width:60px;">${m.id ?? ''}</td>
        <td>${(m.displayName || '').replace(/</g, '&lt;')}</td>
        <td style="width:160px;">${(m.key || '').replace(/</g, '&lt;')}</td>
        <td style="width:120px; text-align:center;">
          <button type="button" class="btn btn-xs btn-primary" data-m3m-picker-action="choose" data-id="${String(m.id ?? '').replace(/"/g, '&quot;')}" data-key="${(m.key || m.displayName).replace(/"/g, '&quot;')}">
            Выбрать
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function closeModels3dMaterialPicker() {
    const modal = document.getElementById('models3d-materials-picker-modal');
    if (modal) modal.style.display = 'none';
    __models3dMaterialsPickerMeshName = null;
  }

  function mergeModels3dFormIntoParamsObj(paramsObj) {
    if (!paramsObj || typeof paramsObj !== 'object') return paramsObj;
    const fromForm = buildCabinetModelParamsFromForm();
    const dst = paramsObj.models && paramsObj.models[0] ? paramsObj.models[0] : null;
    const src = fromForm.models && fromForm.models[0] ? fromForm.models[0] : null;
    if (!dst || !src) return paramsObj;
    const itemName = (document.getElementById('models3d-item-name')?.value || '').toString().trim();
    dst.name = src.name || itemName;
    dst.code = src.code;
    dst.model = src.model;
    dst.price_type = src.price_type;
    dst.price_mode = src.price_mode;
    dst.count = src.count;
    dst.min_x = src.min_x;
    dst.min_y = src.min_y;
    dst.min_z = src.min_z;
    dst.max_x = src.max_x;
    dst.max_y = src.max_y;
    dst.max_z = src.max_z;
    dst.v = src.v;
    dst.hl_size = src.hl_size;
    dst.hl_axis = src.hl_axis;
    dst.params = dst.params || {};
    const keepMeshes = dst.params.meshes;
    dst.params = { ...src.params };
    if (keepMeshes && typeof keepMeshes === 'object' && Object.keys(keepMeshes).length) {
      dst.params.meshes = keepMeshes;
    }
    paramsObj.show_in_spec = fromForm.show_in_spec;
    return paramsObj;
  }

  function readParamsObjFromJsonEditor() {
    if (!jsonEditor) return null;
    try {
      const raw = (jsonEditor.getValue() || '').toString().trim();
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  /** Единый params для сохранения: форма (rot/scale/pos) + meshes из JSON. */
  function buildParamsForModels3dSave() {
    const fromJson = readParamsObjFromJsonEditor();
    const base = fromJson || buildCabinetModelParamsFromForm();
    return mergeModels3dFormIntoParamsObj(JSON.parse(JSON.stringify(base)));
  }

  function syncModels3dFormToJsonEditor(opts) {
    if (!jsonEditor) return;
    const silent = !!(opts && opts.silent);
    try {
      const paramsObj = buildParamsForModels3dSave();
      const formatted = JSON.stringify(paramsObj, null, 2);
      jsonEditor.setValue(formatted, -1);
      if (silent) {
        jsonEditorOriginalData = formatted;
      }
    } catch (e) {
      console.warn('[Models3D] syncModels3dFormToJsonEditor:', e);
    }
  }

  function buildCabinetModelParamsFromForm() {
    // Собираем params в точности как в референсе, используя текущие значения формы.
    const modelName = (document.getElementById('models3d-model-name')?.value || '').toString();
    const modelCode = (document.getElementById('models3d-model-code')?.value || '').toString();
    const modelPath = (document.getElementById('models3d-model-path')?.value || '').toString();
    const modelPriceType = (document.getElementById('models3d-model-price-type')?.value || 'p').toString();
    const modelPriceMode = (document.getElementById('models3d-model-price-mode')?.value || 'c').toString();
    const modelCount = Number(document.getElementById('models3d-model-count')?.value || 1) || 1;
    const modelMinX = Number(document.getElementById('models3d-model-min-x')?.value || 0) || 0;
    const modelMinY = Number(document.getElementById('models3d-model-min-y')?.value || 0) || 0;
    const modelMinZ = Number(document.getElementById('models3d-model-min-z')?.value || 0) || 0;
    const modelMaxX = Number(document.getElementById('models3d-model-max-x')?.value || 0) || 0;
    const modelMaxY = Number(document.getElementById('models3d-model-max-y')?.value || 0) || 0;
    const modelMaxZ = Number(document.getElementById('models3d-model-max-z')?.value || 0) || 0;

    const scaleX = Number(document.getElementById('models3d-model-scale-x')?.value || 1) * 100;
    const scaleY = Number(document.getElementById('models3d-model-scale-y')?.value || 1) * 100;
    const scaleZ = Number(document.getElementById('models3d-model-scale-z')?.value || 1) * 100;
    const posX = Number(document.getElementById('models3d-model-pos-x')?.value || 0) || 0;
    const posY = Number(document.getElementById('models3d-model-pos-y')?.value || 0) || 0;
    const posZ = Number(document.getElementById('models3d-model-pos-z')?.value || 0) || 0;
    const rotX = Number(document.getElementById('models3d-model-rot-x')?.value || 0) || 0;
    const rotY = Number(document.getElementById('models3d-model-rot-y')?.value || 0) || 0;
    const rotZ = Number(document.getElementById('models3d-model-rot-z')?.value || 0) || 0;

    const modelProcess = document.getElementById('models3d-model-process')?.checked ? 1 : 0;
    const modelSetUv = document.getElementById('models3d-model-set-uv')?.checked ? 1 : 0;
    const slotFitEnabled = document.getElementById('models3d-model-slot-fit-enabled')?.checked ? 1 : 0;
    let slotFit = defaultSlotFitParams();
    try {
      const fromJson = readParamsObjFromJsonEditor();
      slotFit = readSlotFitFromParamsObj(fromJson || null);
    } catch (_) {}
    slotFit.enabled = slotFitEnabled;

    const companions = readRodCompanionsFromForm();
    const editId = Number(document.getElementById('models3d_item_id')?.value) || 0;
    const editName = String(document.getElementById('models3d-item-name')?.value || '');
    let paramsForRodCheck = null;
    try {
      paramsForRodCheck = readParamsObjFromJsonEditor();
    } catch (_) {}
    const isRodBar = isModels3dRodBarItem(editId, editName, paramsForRodCheck);

    const showInSpec = document.getElementById('models3d-item-spec')?.checked ? 1 : 0;

    return {
      version: 2,
      group: '',
      variants: [],
      models: [{
        name: modelName,
        code: modelCode,
        model: modelPath,
        price_type: modelPriceType,
        price_mode: modelPriceMode,
        price: 0,
        min_x: modelMinX,
        min_y: modelMinY,
        min_z: modelMinZ,
        max_x: modelMaxX,
        max_y: modelMaxY,
        max_z: modelMaxZ,
        params: {
          rot: { x: rotX, y: rotY, z: rotZ, order: 'XYZ' },
          pos: { x: posX, y: posY, z: posZ },
          scale: { x: scaleX, y: scaleY, z: scaleZ },
          set_uv: modelSetUv,
          process: modelProcess,
          slot_fit: slotFit,
          ...(isRodBar && companions.enabled
            ? {
                companions: {
                  enabled: 1,
                  model_id: companions.model_id,
                  step_mm: companions.step_mm,
                  margin_mm: companions.margin_mm,
                  preview_only: 0,
                  offset: companions.offset,
                  rot: companions.rot,
                  size: companions.size,
                },
              }
            : {}),
          meshes: {}
        },
        v: 2,
        count: modelCount,
        hl_size: 0,
        hl_axis: 'x'
      }],
      price_type: 'p',
      show_in_spec: showInSpec
    };
  }

  /**
   * Эталон превью только из каталога (`params.preview_ref_mm`).
   *
   * ВАЖНО: раньше при отсутствии `preview_ref_mm` в каталоге фолбэк возвращал размеры зелёной
   * рамки Ш×В×Г (`models3d-item-preview-*`). Из-за этого iframe-превью в админке вызывал
   * `__gltfRootMultiplyUniformScaleToRefMm(content, {600, 720, 600})` и буквально РАСТЯГИВАЛ
   * любую модель до максимальной стороны рамки: петлю 62 мм — до 720 мм (×11.6), направляющую
   * 320 мм — до 600 мм (×1.875). Это противоречит поведению `CabinetModelNode._build_spec`
   * в конструкторе, где используется только `imp` + `params.scale`.
   *
   * Теперь, если в каталоге не задан `preview_ref_mm`, возвращаем `null` — модель показывается
   * в реальных миллиметрах (`imp` + `params.scale` × `100`), а зелёная рамка остаётся отдельным
   * масштабным ориентиром.
   */
  function computeModels3dPreviewRefMm(paramsObj, _modelPath) {
    void _modelPath;
    const m0 = paramsObj && paramsObj.models && paramsObj.models[0];
    const p = (m0 && m0.params) || {};
    if (p.preview_ref_mm && typeof p.preview_ref_mm === 'object') {
      const x = Number(p.preview_ref_mm.x);
      const y = Number(p.preview_ref_mm.y);
      const z = Number(p.preview_ref_mm.z);
      if (x > 0 && y > 0 && z > 0) return { x, y, z };
    }
    return null;
  }

  function getParamsObjectFromCurrentItemData(itemData) {
    // Мы хотим показывать/редактировать во вкладке JSON именно params (как в Clodis).
    if (!itemData) return null;
    if (itemData.params && typeof itemData.params === 'object') return itemData.params;
    // fallback (если в data лежит сразу params)
    if (itemData.version && itemData.models) return itemData;
    return null;
  }

  function mergeMeshesIntoParams(paramsObj, meshNames) {
    if (!paramsObj || !Array.isArray(paramsObj.models) || !paramsObj.models[0]) return false;
    const m0 = paramsObj.models[0];
    if (!m0.params || typeof m0.params !== 'object') m0.params = {};
    if (!m0.params.meshes || typeof m0.params.meshes !== 'object') m0.params.meshes = {};
    const meshes = m0.params.meshes;
    let changed = false;
    for (const name of (meshNames || [])) {
      const key = (name || '').toString();
      if (!key) continue;
      if (!meshes[key]) {
        meshes[key] = defaultMeshParams();
        changed = true;
      }
    }
    return changed;
  }

  /** Отправить размеры в iframe превью (наша сцена Clodis) */
  let __syncSizeTimeout = null;
  function syncModels3dPreviewSize() {
    if (!__models3dPreviewIframe || !__models3dPreviewIframe.contentWindow) return;
    if (__syncSizeTimeout) clearTimeout(__syncSizeTimeout);
    __syncSizeTimeout = setTimeout(() => {
      __syncSizeTimeout = null;
      const w = Number(document.getElementById('models3d-item-preview-width')?.value || 600);
      const h = Number(document.getElementById('models3d-item-preview-height')?.value || 720);
      const d = Number(document.getElementById('models3d-item-preview-depth')?.value || 600);
      __models3dPreviewIframe.contentWindow.postMessage({
        type: 'cld:setSize',
        sizeMm: { w, h, d }
      }, '*');
    }, 150);
  }

  /** Собрать трансформацию модели из полей формы (масштаб, позиция в мм, поворот в градусах) */
  function getModels3dTransformFromForm() {
    const scaleX = Number(document.getElementById('models3d-model-scale-x')?.value || 1);
    const scaleY = Number(document.getElementById('models3d-model-scale-y')?.value || 1);
    const scaleZ = Number(document.getElementById('models3d-model-scale-z')?.value || 1);
    const posX = Number(document.getElementById('models3d-model-pos-x')?.value || 0);
    const posY = Number(document.getElementById('models3d-model-pos-y')?.value || 0);
    const posZ = Number(document.getElementById('models3d-model-pos-z')?.value || 0);
    const rotX = Number(document.getElementById('models3d-model-rot-x')?.value || 0);
    const rotY = Number(document.getElementById('models3d-model-rot-y')?.value || 0);
    const rotZ = Number(document.getElementById('models3d-model-rot-z')?.value || 0);
    return {
      scale: { x: scaleX, y: scaleY, z: scaleZ },
      position: { x: posX, y: posY, z: posZ },
      rotation: { x: rotX, y: rotY, z: rotZ }
    };
  }

  /** Отправить трансформацию модели в превью (без перезагрузки модели) */
  function applyModelTransformToPreview() {
    if (!__models3dPreviewIframe || !__models3dPreviewIframe.contentWindow) return;

    const transform = getModels3dTransformFromForm();

    // Референс: set_size зависит от params.meshes + params.scale, поэтому отправляем modelParams в превью.
    let paramsObj = null;
    try {
      const raw = (jsonEditor?.getValue() || '').toString().trim();
      if (raw) paramsObj = JSON.parse(raw);
    } catch (_) {
      paramsObj = null;
    }
    if (!paramsObj) paramsObj = buildCabinetModelParamsFromForm();
    const modelParams = paramsObj?.models?.[0]?.params || {};
    const modelPath = (document.getElementById('models3d-model-path')?.value || '').trim();
    const previewRefMm = computeModels3dPreviewRefMm(paramsObj, modelPath);

    // Масштаб X/Y/Z из формы — множитель после подгонки под рамку (см. _applyM3PreviewUserTransform в iframe).
    __models3dPreviewIframe.contentWindow.postMessage({
      type: 'cld:setModelTransform',
      transform: { ...transform, modelParams },
      previewRefMm: previewRefMm || undefined,
      rodCompanions: buildRodCompanionsPreviewPayloadFromForm() || undefined,
    }, '*');
  }

  /** Очистить модель в превью при переключении между элементами */
  function clearModelInPreview() {
    if (!__models3dPreviewIframe || !__models3dPreviewIframe.contentWindow) return;
    __models3dPreviewIframe.contentWindow.postMessage({ type: 'cld:clearModel' }, '*');
    console.log('[Models3D] Отправлена команда cld:clearModel');
  }

  /** Отправить материалы в превью iframe */
  async function syncModels3dPreviewMaterials() {
    if (!__models3dPreviewIframe || !__models3dPreviewIframe.contentWindow) {
      console.warn('[Models3D] iframe не готов для отправки материалов');
      return;
    }
    if (!jsonEditor) {
      console.warn('[Models3D] JSON редактор не инициализирован');
      return;
    }
    console.log('[Models3D] syncModels3dPreviewMaterials:start');

    // Сбрасываем кэш материалов, чтобы получить актуальные данные
    models3dMaterialsOptionsCache = null;

    // Читаем params из JSON редактора
    let paramsObj = null;
    try {
      const raw = (jsonEditor.getValue() || '').toString().trim();
      if (raw) {
        paramsObj = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[Models3D] Не удалось разобрать JSON для отправки материалов:', e);
      return;
    }

    if (!paramsObj || !Array.isArray(paramsObj.models) || !paramsObj.models[0]) {
      console.log('[Models3D] Нет данных модели для отправки материалов');
      return;
    }

    const m0 = paramsObj.models[0];
    const meshes = m0.params?.meshes || {};
    const meshNames = Object.keys(meshes);

    if (!meshNames.length) {
      console.log('[Models3D] Нет мешей для отправки материалов');
      return;
    }

    // Собираем уникальные идентификаторы материалов (канон: material_id).
    const materialIds = new Set();
    meshNames.forEach(meshName => {
      const cfg = meshes[meshName];
      const matId = String(cfg?.material_id ?? cfg?.mat_id ?? '').trim();
      if (matId) {
        materialIds.add(matId);
      }
    });

    if (materialIds.size === 0) {
      console.log('[Models3D] Нет назначенных материалов для отправки (meshes без material_id/mat_id)');
      // Всё равно отправляем modelParams, чтобы iframe имел актуальную конфигурацию
      const modelParams = m0.params || {};
      __models3dPreviewIframe.contentWindow.postMessage({
        type: 'cld:setMaterials',
        materials: {},
        modelParams: modelParams
      }, '*');
      return;
    }

    const normalizeColor = (v) => {
      const s = String(v ?? '').trim();
      if (!s) return '#ffffff';
      if (/^#[0-9a-fA-F]{6}$/.test(s) || /^#[0-9a-fA-F]{3}$/.test(s)) return s;
      if (/^[0-9a-fA-F]{6}$/.test(s) || /^[0-9a-fA-F]{3}$/.test(s)) return `#${s}`;
      return s;
    };

    // Загружаем полные данные всех материалов 3D моделей
    const allMaterialsOptions = await loadModels3dMaterialsOptions();
    
    // Загружаем полные данные материалов из API (включая цвет, metalness, roughness)
    const materialsData = {};
    const loadQueue = [];
    materialIds.forEach((id) => loadQueue.push({ id, keyHint: null }));

    for (const item of loadQueue) {
      const keyHint = String(item?.keyHint || '').trim();
      const idHint = String(item?.id || '').trim();
      // Поиск по id (канон) или по ключу (legacy)
      const matOption = idHint
        ? allMaterialsOptions.find((m) => String(m?.id ?? '').trim() === idHint)
        : allMaterialsOptions.find((m) => (m.key || '').toLowerCase() === keyHint.toLowerCase());
      if (!matOption) {
        console.warn(`[Models3D] Материал не найден в списке`, { idHint, keyHint });
        continue;
      }

      try {
        // Загружаем полные данные материала по ID
        const resp = await fetch(`/api/catalog/item_get/model_key_material/${matOption.id}?t=${Date.now()}`, { cache: 'no-cache' });
        if (!resp.ok) {
          console.warn(`[Models3D] Не удалось загрузить материал ID=${matOption.id}`);
          continue;
        }
        const itemPayload = await resp.json();
        const itemData = itemPayload?.item || itemPayload?.data?.item || itemPayload || {};
        
        // Парсим data (может быть строкой или объектом)
        let d = {};
        try {
          if (itemData?.data) {
            d = typeof itemData.data === 'string' ? JSON.parse(itemData.data) : itemData.data;
            d = d || {};
          }
        } catch (e) {
          console.warn(`[Models3D] Не удалось распарсить data материала ID=${matOption.id}:`, e);
        }

        // Цвет и параметры могут быть в разных местах:
        // 1. data.params.params (формат model_key_material: color, roughness, metalness)
        // 2. data.color / data.params (плоский формат)
        const innerParams = d.params?.params || d.params || d;
        const color = normalizeColor(innerParams.color || d.color || innerParams.colorHex || d.colorHex || '#ffffff');
        const metalness = innerParams.metalness ?? d.metalness ?? 0.1;
        const roughness = innerParams.roughness ?? d.roughness ?? 0.8;
        const transparent = innerParams.transparent === true || innerParams.transparent === 1 || d.transparent === true || d.transparent === 1;
        const opacity = innerParams.opacity ?? d.opacity ?? 1;
        const map = innerParams.map || d.map || null;
        const normalMap = innerParams.normalMap || d.normalMap || null;
        const roughnessMap = innerParams.roughnessMap || d.roughnessMap || null;

        // Создаём объект материала для отправки в iframe
        const materialKey = String(matOption.key || keyHint || itemData?.name || '').trim();
        const payload = {
          id: matOption.id,
          key: materialKey,
          name: itemData?.name || matOption.name,
          color: color,
          metalness: metalness,
          roughness: roughness,
          transparent: transparent,
          opacity: opacity,
          map: map,
          normalMap: normalMap,
          roughnessMap: roughnessMap
        };
        if (materialKey) {
          materialsData[materialKey] = payload;
          materialsData[materialKey.toLowerCase()] = payload;
        }
        // Support meshes tokened by numeric material id (mat_id/material_id in params.meshes).
        const idToken = String(matOption.id || '').trim();
        if (idToken) {
          materialsData[idToken] = payload;
          materialsData[`material_${idToken}`] = payload;
        }
        // If key already has material_<n> format, duplicate plain numeric alias too.
        const keyMatch = String(materialKey || '').match(/^material_(\d+)$/i);
        if (keyMatch && keyMatch[1]) {
          materialsData[keyMatch[1]] = payload;
        }

        console.log(`[Models3D] Загружен материал "${materialKey || idToken}":`, payload);
        if (String(materialKey).toLowerCase().includes('chrom') || String(itemData?.name || '').toLowerCase().includes('хром')) {
          console.log('[Models3D][Chrom] payload to iframe:', {
            key: materialKey,
            color: payload.color,
            metalness: payload.metalness,
            roughness: payload.roughness,
            transparent: payload.transparent,
            opacity: payload.opacity,
          });
        }
      } catch (e) {
        console.warn(`[Models3D] Ошибка загрузки материала`, { idHint, keyHint, error: e });
      }
    }

    // Референс: отправляем modelParams вместе с материалами, чтобы iframe имел актуальную конфигурацию meshes
    const modelParams = m0.params || {};

    // Отправляем материалы в iframe (даже если часть не загрузилась — применяем то, что есть)
    __models3dPreviewIframe.contentWindow.postMessage({
      type: 'cld:setMaterials',
      materials: materialsData,
      modelParams: modelParams
    }, '*');

    console.log('[Models3D] Материалы отправлены в iframe:', {
      materials: materialsData,
      modelParamsKeys: Object.keys(modelParams),
      meshes: Object.keys(modelParams.meshes || {})
    });
    console.log('[Models3D] syncModels3dPreviewMaterials:done');
  }

  async function verifyModels3dGlbExists(url) {
    const path = String(url || '').trim();
    if (!path) return false;
    try {
      const resp = await fetch(path, { method: 'HEAD', cache: 'no-cache' });
      return resp.ok;
    } catch (e) {
      console.warn('[Models3D] HEAD check failed:', path, e);
      return false;
    }
  }

  /** Загрузить 3D модель в превью. Сначала синхронизируем размеры рамки, затем модель масштабируется под них */
  function loadModelInPreview(modelPath) {
    console.log('[Models3D] loadModelInPreview вызвана:', {
      modelPath: modelPath,
      hasIframe: !!__models3dPreviewIframe,
      hasContentWindow: !!(__models3dPreviewIframe && __models3dPreviewIframe.contentWindow)
    });
    if (!__models3dPreviewIframe || !__models3dPreviewIframe.contentWindow) {
      console.warn('[Models3D] iframe не готов, модель не загружена');
      return;
    }
    const trimmedPath = (modelPath || '').trim();
    if (!trimmedPath) {
      console.warn('[Models3D] Путь к модели пуст, модель не загружена');
      return;
    }

    verifyModels3dGlbExists(trimmedPath).then((ok) => {
      if (!ok) {
        const hint = trimmedPath.startsWith('/models/')
          ? ' Проверьте, что файл загружен в файловый менеджер (папка models или files/Krepeg).'
          : ' Выберите GLB через кнопку «Загрузить» (файловый менеджер).';
        const msg = `Файл не найден на сервере: ${trimmedPath}.${hint}`;
        console.error('[Models3D Preview]', msg);
        if (window.toastr) window.toastr.error('Превью: ' + msg);
        return;
      }
      postLoadModelInPreview(trimmedPath);
    });
  }

  function postLoadModelInPreview(modelPath) {
    // Размеры рамки нужны только сцене и размерным линиям. Геометрию модели
    // под них не масштабируем: native size + params.scale, как в рефе.
    syncModels3dPreviewSize();
    
    // Задержка, чтобы cld:setSize успел примениться в iframe (syncModels3dPreviewSize ставит таймер 150ms)
    setTimeout(() => {
      const transform = getModels3dTransformFromForm();

      // Референс: отправляем modelParams (meshes/scale/process/set_uv)
      let paramsObj = null;
      try {
        const raw = (jsonEditor?.getValue() || '').toString().trim();
        if (raw) paramsObj = JSON.parse(raw);
      } catch (_) {
        paramsObj = null;
      }
      if (!paramsObj) paramsObj = buildCabinetModelParamsFromForm();
      const modelParams = paramsObj?.models?.[0]?.params || {};
      const previewRefMm = computeModels3dPreviewRefMm(paramsObj, modelPath);
      const hlAxis = String(paramsObj?.models?.[0]?.hl_axis || '').trim().toLowerCase();
      const handleBarFit =
        !!hlAxis ||
        /ruchka_|volna/i.test(String(modelPath || ''));

      const message = {
        type: 'cld:loadModel',
        modelPath: modelPath,
        transform: { ...transform, modelParams },
        previewRefMm: previewRefMm || undefined,
        handleBarFit,
        rodCompanions: buildRodCompanionsPreviewPayloadFromForm() || undefined,
      };
      console.log('[Models3D Preview] Отправка команды cld:loadModel в превью:', message);
      __models3dPreviewIframe.contentWindow.postMessage(message, '*');
      console.log('[Models3D Preview] Команда отправлена, размеры рамки синхронизированы:', modelPath);
      
      // Отправляем материалы после загрузки модели (с задержкой, чтобы модель успела загрузиться)
      setTimeout(() => {
        syncModels3dPreviewMaterials();
      }, 500);
    }, 200);
  }

  /**
   * Инициализация превью: монтируем ту же сцену, что и в каталоге элементов
   * (constructor-clodis.html — наша сцена со стрелками и секцией)
   */
  function init3DPreview() {
    const container = document.getElementById('models3d-viewport');
    if (!container) {
      console.warn('[Models3D Preview] Контейнер models3d-viewport не найден');
      return;
    }

    // Уже создан iframe — только синхронизируем размеры
    if (__models3dPreviewIframe && container.contains(__models3dPreviewIframe)) {
      syncModels3dPreviewSize();
      return;
    }

    container.innerHTML = '';
    const placeholder = document.getElementById('models3d-preview-placeholder');
    if (placeholder) {
      placeholder.style.display = 'none';
    }

    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Clodis 3D — превью (стрелки и секция)');
    iframe.setAttribute('loading', 'lazy');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.minHeight = '538px';
    iframe.style.border = '0';
    iframe.style.display = 'block';
    iframe.style.borderRadius = '4px';
    // Та же страница, что и в каталоге элементов — наша сцена со стрелками и кубом
    // Контекст models3d: сцена подстраивается только для превью добавления/редактирования 3D модели (pivot и др.); каталог элементов в конструкторе — отдельно.
    iframe.src = '/constructor-clodis.html?embedded=1&context=models3d&v=20260907-map-no-tint';

    __models3dPreviewIframe = iframe;
    __models3dPreviewReady = false;
    container.appendChild(iframe);

    window.addEventListener('message', function onMessage(ev) {
      // Модель загружена в iframe — отправляем материалы (гарантированно после загрузки)
      if (ev?.data?.type === 'cld:modelLoaded') {
        syncModels3dPreviewMaterials();
        syncModels3dRodCompanionsPreview();
        return;
      }

      // Реальный bbox после подгонки в превью (мм) — обновляем подсказку Мин/Макс в форме
      if (ev?.data?.type === 'cld:modelBBoxMm') {
        const mn = ev.data.min;
        const mx = ev.data.max;
        if (Array.isArray(mn) && Array.isArray(mx) && mn.length >= 3 && mx.length >= 3) {
          updateBoundingBox(mn[0], mn[1], mn[2], mx[0], mx[1], mx[2]);
        }
        return;
      }

      if (ev?.data?.type === 'cld:modelLoadError') {
        const msg = ev.data.message || ev.data.url || 'ошибка загрузки';
        console.error('[Models3D Preview]', ev.data);
        if (window.toastr) window.toastr.error('Превью: не удалось загрузить файл. ' + msg);
        return;
      }

      // Готовность iframe
      if (ev?.data?.type === 'cld:iframeReady') {
        __models3dPreviewReady = true;
        syncModels3dPreviewSize();
        // Загружаем модель если путь указан
        const modelPath = document.getElementById('models3d-model-path')?.value;
        console.log('[Models3D Preview] iframe готов, проверка загрузки модели:', {
          modelPath: modelPath,
          willLoad: !!(modelPath && modelPath.trim())
        });
        if (modelPath && modelPath.trim()) {
          console.log('[Models3D Preview] Загрузка модели из обработчика iframeReady:', modelPath);
          loadModelInPreview(modelPath);
        }
        console.log('[Models3D Preview] ✅ Сцена каталога элементов подключена (стрелки, размеры, секция)');
        return;
      }

      // Список мешей от превью (constructor-clodis.js) — используем чтобы заполнить params.meshes как в референсе
      if (ev?.data?.type === 'cld:modelMeshes') {
        const meshes = Array.isArray(ev.data.meshes) ? ev.data.meshes : [];
        if (!meshes.length) return;
        try {
          // Гарантируем, что редактор инициализирован
          if (!jsonEditor) initJsonEditor();
          if (!jsonEditor) return;

          const raw = (jsonEditor.getValue() || '').toString().trim();
          let paramsObj = null;

          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (parsed && typeof parsed === 'object') paramsObj = parsed;
            } catch (_) {
              paramsObj = null;
            }
          }

          // Для нового элемента (id=0) JSON может быть пустой — создаём дефолтный params из формы.
          if (!paramsObj) {
            paramsObj = buildCabinetModelParamsFromForm();
          }

          const changed = mergeMeshesIntoParams(paramsObj, meshes);
          mergeModels3dFormIntoParamsObj(paramsObj);
          const formatted = JSON.stringify(paramsObj, null, 2);
          jsonEditor.setValue(formatted, -1);
          jsonEditorOriginalData = formatted;
          if (changed) {
            if (window.toastr) window.toastr.info('JSON обновлён: заполнены meshes (' + meshes.length + ')');
            refreshModels3dMaterialsTab();
          }
        } catch (e) {
          console.warn('Не удалось применить meshes в JSON:', e);
        }
      }
    });

    iframe.addEventListener('load', function() {
      if (!__models3dPreviewReady) syncModels3dPreviewSize();
    });

    // Синхронизация при изменении размеров (только change, чтобы не спамить при вводе)
    ['models3d-item-preview-width', 'models3d-item-preview-height', 'models3d-item-preview-depth'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', syncModels3dPreviewSize);
      if (el) el.addEventListener('blur', syncModels3dPreviewSize);
    });

    // Кнопки управления показываем (в сцене Clodis они могут работать через postMessage при необходимости)
    const buttonsContainer = document.getElementById('models3d-preview-buttons');
    if (buttonsContainer) buttonsContainer.style.display = 'block';

    console.log('[Models3D Preview] Подключена наша сцена из каталога элементов (constructor-clodis)');
  }

  // Старая реализация на Three.js оставлена как fallback (не вызывается по умолчанию)
  let preview3D = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    axesHelper: null,
    currentModel: null,
    animationId: null
  };

  function init3DPreviewLegacy() {
    const container = document.getElementById('models3d-viewport');
    if (!container || preview3D.scene) return;
    if (typeof THREE === 'undefined') return;
    // ... (логика с кубом/сеткой — не удаляем, может пригодиться)
  }

  function animate3DPreview() {
    preview3D.animationId = requestAnimationFrame(animate3DPreview);
    
    if (preview3D.controls) {
      preview3D.controls.update();
    }
    
    if (preview3D.renderer && preview3D.scene && preview3D.camera) {
      preview3D.renderer.render(preview3D.scene, preview3D.camera);
    }
  }

  function initPreviewButtons() {
    // Кнопка Wireframe
    const wireframeBtn = document.getElementById('models3d-btn-wireframe');
    if (wireframeBtn) {
      wireframeBtn.addEventListener('click', () => {
        if (preview3D.currentModel) {
          preview3D.currentModel.traverse((child) => {
            if (child.isMesh) {
              child.material.wireframe = !child.material.wireframe;
            }
          });
          wireframeBtn.classList.toggle('btn-primary');
        }
      });
    }

    // Кнопка сброса камеры
    const resetCameraBtn = document.getElementById('models3d-btn-reset-camera');
    if (resetCameraBtn) {
      resetCameraBtn.addEventListener('click', () => {
        if (preview3D.camera && preview3D.controls) {
          preview3D.camera.position.set(800, 600, 800);
          preview3D.controls.reset();
        }
      });
    }

    // Кнопка создания иконки
    const makeIconBtn = document.getElementById('models3d-btn-make-icon');
    if (makeIconBtn) {
      makeIconBtn.addEventListener('click', () => {
        makePreviewIcon();
      });
    }
  }

  function loadModelPreview(modelPath) {
    if (!preview3D.scene) {
      init3DPreview();
      setTimeout(() => loadModelPreview(modelPath), 100);
      return;
    }

    // Удаляем предыдущую модель
    if (preview3D.currentModel) {
      preview3D.scene.remove(preview3D.currentModel);
      preview3D.currentModel = null;
    }

    if (!modelPath || !modelPath.trim()) {
      console.log('Путь к модели не указан');
      return;
    }

    // Определяем тип файла и загрузчик
    const ext = modelPath.split('.').pop().toLowerCase();
    let loader = null;

    if (ext === 'obj' && typeof THREE.OBJLoader !== 'undefined') {
      loader = new THREE.OBJLoader();
    } else if ((ext === 'fbx' || ext === 'FBX') && typeof THREE.FBXLoader !== 'undefined') {
      loader = new THREE.FBXLoader();
    } else if ((ext === 'gltf' || ext === 'glb') && typeof THREE.GLTFLoader !== 'undefined') {
      loader = new THREE.GLTFLoader();
    } else {
      console.warn('Загрузчик для формата .' + ext + ' не найден');
      return;
    }

    // Загружаем модель
    loader.load(
      modelPath,
      (object) => {
        const model = ext === 'gltf' || ext === 'glb' ? object.scene : object;
        
        // Применяем трансформации из формы
        const scaleX = Number(document.getElementById('models3d-model-scale-x')?.value || 1);
        const scaleY = Number(document.getElementById('models3d-model-scale-y')?.value || 1);
        const scaleZ = Number(document.getElementById('models3d-model-scale-z')?.value || 1);
        model.scale.set(scaleX, scaleY, scaleZ);

        const posX = Number(document.getElementById('models3d-model-pos-x')?.value || 0);
        const posY = Number(document.getElementById('models3d-model-pos-y')?.value || 0);
        const posZ = Number(document.getElementById('models3d-model-pos-z')?.value || 0);
        model.position.set(posX, posY, posZ);

        const rotX = Number(document.getElementById('models3d-model-rot-x')?.value || 0) * Math.PI / 180;
        const rotY = Number(document.getElementById('models3d-model-rot-y')?.value || 0) * Math.PI / 180;
        const rotZ = Number(document.getElementById('models3d-model-rot-z')?.value || 0) * Math.PI / 180;
        model.rotation.set(rotX, rotY, rotZ);

        // Центрируем модель
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        // Настраиваем камеру
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = preview3D.camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 2; // Отступ
        preview3D.camera.position.set(cameraZ, cameraZ * 0.7, cameraZ);
        preview3D.camera.lookAt(0, 0, 0);

        if (preview3D.controls) {
          preview3D.controls.target.set(0, 0, 0);
          preview3D.controls.update();
        }

        preview3D.currentModel = model;
        preview3D.scene.add(model);
        
        console.log('✅ Модель загружена:', modelPath);
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% загружено');
      },
      (error) => {
        console.error('Ошибка загрузки модели:', error);
      }
    );
  }

  function makePreviewIcon() {
    if (!__models3dPreviewIframe?.contentWindow) {
      if (window.toastr) window.toastr.error('Превью не готово');
      return;
    }

    syncModels3dRodCompanionsPreview();

    const win = __models3dPreviewIframe.contentWindow;
    if (typeof win.makeScreenshot !== 'function') {
      if (window.toastr) window.toastr.error('Снимок превью недоступен (обновите страницу)');
      return;
    }

    let settled = false;
    const finish = (ok, msg) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('message', onShot);
      clearTimeout(timer);
      if (ok) {
        if (window.toastr) window.toastr.success(msg || 'Иконка создана');
      } else if (window.toastr) {
        window.toastr.error(msg || 'Ошибка создания иконки');
      }
    };

    const onShot = (ev) => {
      const data = ev?.data;
      if (!data || data.type !== 'cld:screenshotReady') return;
      const dataUrl = String(data.dataUrl || '').trim();
      if (!dataUrl || data.error) {
        finish(false, 'Ошибка создания иконки: ' + (data.error || 'пустой кадр'));
        return;
      }
      const iconInput = document.getElementById('models3d-item-icon');
      if (iconInput) iconInput.value = dataUrl;
      const iconPreview = document.getElementById('models3d-item-icon-preview');
      const iconPreviewWrapper = document.getElementById('models3d-item-icon-preview-wrapper');
      const iconPlaceholder = document.getElementById('models3d-item-icon-placeholder');
      if (iconPreview && iconPreviewWrapper && iconPlaceholder) {
        iconPreview.src = dataUrl;
        iconPreviewWrapper.style.display = 'block';
        iconPlaceholder.style.display = 'none';
      }
      finish(true);
    };

    window.addEventListener('message', onShot);
    const timer = setTimeout(() => finish(false, 'Таймаут снимка превью'), 15000);

    setTimeout(() => {
      try {
        const shot = win.makeScreenshot();
        if (shot && typeof shot.catch === 'function') {
          shot.catch((e) => finish(false, e?.message || String(e)));
        }
      } catch (e) {
        finish(false, e?.message || String(e));
      }
    }, 180);
  }

  function dispose3DPreview() {
    // Очистка iframe превью (наша сцена Clodis)
    if (__models3dPreviewIframe) {
      const container = document.getElementById('models3d-viewport');
      if (container && __models3dPreviewIframe.parentNode === container) {
        container.removeChild(__models3dPreviewIframe);
      }
      __models3dPreviewIframe = null;
      __models3dPreviewReady = false;
    }
    // Legacy Three.js (если когда-то вернём)
    if (preview3D.animationId) cancelAnimationFrame(preview3D.animationId);
    if (preview3D.renderer) {
      preview3D.renderer.dispose();
      const canvas = preview3D.renderer.domElement;
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
    preview3D = { scene: null, camera: null, renderer: null, controls: null, axesHelper: null, currentModel: null, animationId: null };
  }

  // ============================================
  // Экспорт функций в window для совместимости
  // ============================================
  window.loadModels3dList = loadModels3dList;
  window.loadModels3dListFromUI = function() {
    models3dListState.currentPage = 1;
    renderModels3dListTable();
  };
  window.openModels3dItemEdit = openModels3dItemEdit;
  window.loadModels3dItemEdit = loadModels3dItemEdit;
  window.saveModels3dItem = saveModels3dItem;
  window.deleteModels3dItem = deleteModels3dItem;
  window.copyModels3dItem = copyModels3dItem;
  window.toggleModels3dItemVisibility = toggleModels3dItemVisibility;
  
  // Экспорт функций 3D превью
  window.init3DPreview = init3DPreview;
  window.loadModelPreview = loadModelPreview;
  window.dispose3DPreview = dispose3DPreview;

  // ============================================
  // Роутер для активации страниц
  // ============================================
  function handleModels3dRouting() {
    const hash = window.location.hash || '';
    console.log('[Models3D Router] Hash changed:', hash);
    
    // Проверяем какая страница должна быть активна
    if (hash.startsWith('#models3d-list')) {
      console.log('[Models3D Router] Активация страницы models3d-list');
      // Скрываем все страницы
      document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
      // Показываем список
      const listPage = document.getElementById('models3d-list');
      if (listPage) {
        listPage.classList.add('active');
        loadModels3dList();
      }
    } else if (hash.startsWith('#models3d-item-edit')) {
      if (window.__cldModels3dSuppressHashLoad && Date.now() - window.__cldModels3dSuppressHashLoad < 800) {
        window.__cldModels3dSuppressHashLoad = 0;
        return;
      }
      console.log('[Models3D Router] Активация страницы models3d-item-edit');
      const params = new URLSearchParams(hash.split('?')[1] || '');
      const id = params.get('id') || '0';
      // Скрываем все страницы
      document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
      // Показываем форму редактирования
      const editPage = document.getElementById('models3d-item-edit');
      if (editPage) {
        editPage.classList.add('active');
        loadModels3dItemEdit(id);
      }
    }
  }

  // Инициализация при загрузке DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[Models3D Module] DOM загружен');
      initModels3dListHandlers();
      handleModels3dRouting();
    });
  } else {
    console.log('[Models3D Module] DOM уже загружен');
    initModels3dListHandlers();
    handleModels3dRouting();
  }

  // Подключаем роутер к hashchange
  window.addEventListener('hashchange', handleModels3dRouting);
  
  console.log('[Models3D Module] ✅ Модуль загружен, роутер активирован');

})();
