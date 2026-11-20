/**
 * admin-constructor.js - Constructor tab (initConstructorTab, loadConstructorTreeFromJSON, getConstructorTreeJSON)
 * Extracted from admin-new.html for better Cursor performance
 */
(function() {
  'use strict';
  // Расширенный лог только при отладке. В консоли: window.__CLD_DEBUG = true;
  if (typeof window.__CLD_DEBUG === 'undefined') window.__CLD_DEBUG = false;

  // Референс: pp.engine.item_types + item_types_names — типы как в Clodis
  const TYPE_NAMES = {
    'section': 'Секция',
    'fillable_section': 'Наполняемая секция',
    'fill_section': 'Наполняемая секция',
    'fake_section': 'Фиктивная секция',
    'detail': 'Деталь',
    'element': 'Элемент',
    'model': 'Модель',
    'facade': 'Фасад',
    'countertop': 'Столешница',
    'tabletop': 'Столешница',
    'plinth': 'Цоколь',
    'cokol': 'Цоколь',
    'fitting': 'Присадка',
    'furniture': 'Присадка',
    'fill_module': 'Элемент наполнения',
    'cutout': 'Вырез',
    'cut': 'Вырез',
    'hole': 'Отверстие',
    'animator': 'Аниматор',
    'size': 'Размер',
    'mouse_target': 'Цель для мыши',
    'information': 'Информация',
    'attachment_point': 'Точка прилипания',
    'module': 'Модуль',
    'wall': 'Стенка',
    'path': 'Паз',
    'groove': 'Паз',
    'notch': 'Выемка'
  };
  const TYPE_TO_NODE = {
    'section': 'section', 'fillable_section': 'section',
    'detail': 'detail', 'element': 'detail', 'model': 'detail', 'facade': 'detail',
    'countertop': 'detail', 'plinth': 'detail', 'fitting': 'detail', 'cutout': 'detail',
    'animator': 'detail', 'size': 'detail', 'mouse_target': 'detail', 'information': 'detail',
    'attachment_point': 'detail', 'module': 'detail', 'wall': 'detail'
  };

  // Какой type уходит в JSON для каждого логического типа (originalType).
  // Здесь мы стремимся к совместимости с Clodis, но не копируем его код дословно.
  const EXPORT_TYPE_MAP = {
    // Секции и их варианты
    section: 'section',
    fillable_section: 'fill_section', // в JSON референса используется ключ fill_section
    fake_section: 'fake_section',

    // Базовые детали и элементы
    detail: 'detail',
    element: 'element',
    wall: 'wall',
    path: 'path',
    cut: 'cut',

    // Модели/модули/фасады
    model: 'model',
    furniture: 'furniture',
    module: 'module',
    facade: 'facade',

    // Плиты / столешницы / цоколь
    countertop: 'countertop',
    tabletop: 'countertop',
    plinth: 'plinth',

    // Технологические типы
    fitting: 'fitting',
    cutout: 'cutout',
    animator: 'animator',
    size: 'size',
    mouse_target: 'mouse_target',
    information: 'information',
    attachment_point: 'attachment_point'
  };

  function initConstructorTabImpl() {
    // Бандл (admin-new-bundle) владеет UI дерева при __CLD_DISABLE_LEGACY_PANEL_UI.
    if (window.__CLD_DISABLE_LEGACY_PANEL_UI) {
      if (typeof window.__cldInitConstructorTab === 'function') {
        try { window.__cldInitConstructorTab(); } catch (e) {
          console.error('[CLD] legacy→bundle init failed', e);
        }
      }
      return;
    }

    const rootModule = document.getElementById('constructor-root-module');
    if (!rootModule) {
      console.error('[CLD][init] ❌ Корневой модуль не найден!');
      // не фиксируем флаг, чтобы повторный вызов мог отработать позже
      window.__CLD_CONSTRUCTOR_INITIALIZED = false;
      return;
    }
    
    if (window.__CLD_CONSTRUCTOR_INITIALIZED) return;
    window.__CLD_CONSTRUCTOR_INITIALIZED = true;

    // После базовой инициализации пытаемся сразу подтянуть имя из вкладки "Основные"
    try {
      const mainNameInput = document.getElementById('catalog-item-edit-name');
      const rootModuleText = document.getElementById('constructor-root-module-name');
      const constructorNameInput = document.getElementById('catalog-constructor-property-name');
      const mainName = (mainNameInput && mainNameInput.value || '').trim();
      if (mainName) {
        if (rootModuleText) rootModuleText.textContent = mainName;
        // Не трогаем панель свойств и не шлём synthetic input: слушатель на панели
        // вызовет saveConstructorNodeData(текущий_выбранный_узел) и затрёт имя ящика/секции
        // названием шкафа из «Основные».
        if (constructorNameInput) {
          const sel = window.currentSelectedNode || window.__cldCurrentSelectedNode || null;
          if (!sel || sel === rootModule) {
            constructorNameInput.value = mainName;
            const evt = new Event('input', { bubbles: true });
            constructorNameInput.dispatchEvent(evt);
          }
        }
        if (window.updateRootSectionName) {
          window.updateRootSectionName(mainName);
        }
      }
    } catch (e) {
      console.warn('[CLD][init] Ошибка синхронизации имени модуля:', e);
    }
    
    // Текущий выбранный элемент дерева
    let currentSelectedNode = null;
    
    // Состояние раскрытия корневого модуля
    let isRootExpanded = true;
    
    // ============================================
    // Вспомогательные функции (определяем заранее)
    // ============================================

    // Дефолты для 9 типов деталей (clean-room).
    // Нужны и для UI (панель свойств), и для установки значений при создании детали.
    function cldGetDetailDefaults(detailTypeId) {
      const id = String(detailTypeId || '');
      const t = '$wall.thickness';
      const z0 = 0;
      const zDepth = '@section.depth';
      // Референс: группа материала по типу детали (g0=корпус, g1=задняя стенка, g2=фасады)
      const corpusGroup = 'g0';
      const backWallGroup = 'g1';
      const facadeGroup = 'g2';
      switch (id) {
        case 'back_front':
          return {
            size: { x: '@section.width', y: '@section.height', z: t },
            pos: { x: 0, y: 0, z: 0 },
            pivot: { x: -1, y: -1, z: -1 },
            spec: { orientation: 'f', direction: 'z', side: 'back' },
            material_group: backWallGroup,
          };
        case 'vertical_left':
          return {
            size: { x: '@section.depth', y: '@section.height', z: '@section.depth' },
            pos: { x: 0, y: 0, z: z0 },
            pivot: { x: -1, y: -1, z: -1 },
            spec: { orientation: 'v', direction: 'z', side: 'left' },
            material_group: corpusGroup,
          };
        case 'vertical_right':
          return {
            // ориентация 'v': thickness берётся из vars (y/z важнее), поэтому даём полный рост/глубину
            size: { x: zDepth, y: '@section.height', z: zDepth },
            pos: { x: '@section.width', y: 0, z: z0 },
            pivot: { x: 1, y: -1, z: -1 },
            spec: { orientation: 'v', direction: 'z', side: 'right' },
            material_group: corpusGroup,
          };
        case 'vertical_middle':
          return {
            size: { x: zDepth, y: '@section.height', z: zDepth },
            pos: { x: '@section.width / 2', y: 0, z: z0 },
            pivot: { x: 0, y: -1, z: -1 },
            spec: { orientation: 'v', direction: 'z', side: 'center' },
            material_group: corpusGroup,
          };
        case 'horizontal_bottom':
          return {
            // В референсе горизонтали идут по всей ширине секции (без отступов по X).
            size: { x: '@section.width', y: t, z: zDepth },
            pos: { x: 0, y: 0, z: z0 },
            pivot: { x: -1, y: -1, z: -1 },
            spec: { orientation: 'h', direction: 'z', side: 'bottom' },
            material_group: corpusGroup,
          };
        case 'horizontal_top':
          return {
            size: { x: '@section.width', y: t, z: zDepth },
            pos: { x: 0, y: '@section.height', z: z0 },
            pivot: { x: -1, y: 1, z: -1 },
            spec: { orientation: 'h', direction: 'z', side: 'top' },
            material_group: corpusGroup,
          };
        case 'horizontal_middle':
          return {
            size: { x: '@section.width', y: t, z: zDepth },
            pos: { x: 0, y: '@section.height / 2', z: z0 },
            pivot: { x: -1, y: 0, z: -1 },
            spec: { orientation: 'h', direction: 'z', side: 'center' },
            material_group: corpusGroup,
          };
        case 'front_front':
          return {
            size: { x: '@section.width', y: '@section.height', z: t },
            pos: { x: 0, y: 0, z: '@section.depth' },
            // Накладная фронтальная: ставим "спиной" к секции на плоскость z=@section.depth.
            // Точка привязки — задний левый дальний угол (back-left-bottom): z=-1 (задняя плоскость детали).
            pivot: { x: -1, y: -1, z: -1 },
            spec: { orientation: 'f', direction: 'z', side: 'front' },
            material_group: facadeGroup,
          };
        case 'front_middle':
          return {
            size: { x: '@section.width', y: '@section.height', z: t },
            pos: { x: 0, y: 0, z: '@section.depth / 2' },
            pivot: { x: -1, y: -1, z: 0 },
            spec: { orientation: 'f', direction: 'z', side: 'center' },
            material_group: facadeGroup,
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
      if (window.__CLD_DEBUG) console.log('[CLD][create] Создан узел', {
        node_type: type,
        node_id: nodeId,
        node_name: defaultName,
        attachTreeNodeHandlers_exists: typeof attachTreeNodeHandlers === 'function',
      });
      
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
        if (window.__CLD_DEBUG) console.log('[CLD][detail] Устанавливаем деталь:', {
          detail_name: nodeElement.nodeData?.name || nodeElement.querySelector('.tree-node-name')?.textContent || '?',
          detail_type: detailType,
          parent_section_type: parentType,
          parent_section_name: parentName,
          parent_section_id: parentNode?.getAttribute('data-node-id') || '?'
        });
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
        childrenContainer.style.display = 'block';
        parentNode.appendChild(childrenContainer);
      }
      
      childrenContainer.appendChild(nodeElement);
      
      // Если родитель - секция, раскрываем её
      if (parentNode !== rootModule && parentNode.getAttribute('data-node-type') === 'section') {
        const toggle = parentNode.querySelector('.tree-node-toggle');
        if (toggle) {
          toggle.querySelector('span').textContent = '▼';
          childrenContainer.style.display = 'block';
        }
      }
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
    
    function sendHelpersToIframe(nodeElement) {
      const __ppPreviewIframe = window.__ppPreviewIframe || null;
      if (!__ppPreviewIframe || !__ppPreviewIframe.contentWindow) return;
      if (!nodeElement || nodeElement === rootModule) {
        __ppPreviewIframe.contentWindow.postMessage({ type: 'cld:selectNode', path: '0', nodeId: null }, '*');
        return;
      }
      const path = getNodePath(nodeElement);
      if (!path) {
        __ppPreviewIframe.contentWindow.postMessage({ type: 'cld:selectNode', path: '0', nodeId: null }, '*');
        return;
      }
      const nodeType = nodeElement.getAttribute('data-node-type') || 'section';
      const edgesMode = nodeType === 'detail';
      __ppPreviewIframe.contentWindow.postMessage({ type: 'cld:selectNodeByPath', path, nodeType, edgesMode }, '*');
    }
    
    function selectTreeNode(nodeElement) {
      // Убираем выделение с других элементов
      document.querySelectorAll('.constructor-tree-item-selected').forEach(el => {
        el.style.backgroundColor = '';
        el.classList.remove('constructor-tree-item-selected');
      });
      
      // Выделяем выбранный элемент
      // Для корневого модуля используем специальный селектор
      let header;
      if (nodeElement === rootModule) {
        header = nodeElement.querySelector('div[style*="display:flex; align-items:center"]');
      } else {
        // Для обычных узлов - заголовок по классу
        header = nodeElement.querySelector('.tree-node-header');
      }
      
      if (header) {
        header.style.backgroundColor = '#e8f4fd';
        header.classList.add('constructor-tree-item-selected');
      }
      
      currentSelectedNode = nodeElement;
      
      // Обновляем панель свойств
      updateConstructorPropertiesPanel(nodeElement);
      
      // Сообщаем превью о выбранном узле (оранжевый шар с осями как в референсе)
      sendHelpersToIframe(nodeElement);
    }
    
    // Привязка обработчиков к узлу дерева
    function attachTreeNodeHandlers(nodeElement) {
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
      
      if (window.__CLD_DEBUG) console.log('[CLD][handlers] Поиск элементов меню', {
        menuTrigger: !!menuTrigger,
        menuDropdown: !!menuDropdown,
        node_element: nodeElement,
      });
      
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
            case 'paste':
              // TODO: Реализовать вставку
              alert('Функционал "Вставить" будет реализован позже');
              break;
            case 'delete':
              if (confirm(`Удалить "${nodeElement.nodeData?.name || 'элемент'}"?`)) {
                nodeElement.remove();
                currentSelectedNode = null;
                updateConstructorPropertiesPanel(null);
                sendHelpersToIframe(null);
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
    
    const modalCheck = document.getElementById('constructor-add-element-modal');
    // Заполняем select типов (inline openAddElementModal в admin-new.html его не трогает)
    const modalTypeSelect = document.getElementById('constructor-add-modal-type');
    if (modalTypeSelect) {
      modalTypeSelect.innerHTML = '';
      Object.keys(TYPE_NAMES).forEach(function(k) {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = TYPE_NAMES[k];
        modalTypeSelect.appendChild(opt);
      });
    }
    // Референс: поле "Тип" в панели свойств — select как item_types_names
    let typeSelect = null;
    const typeInput = document.getElementById('catalog-constructor-property-type');
    if (typeInput && typeInput.tagName === 'INPUT') {
      const sel = document.createElement('select');
      sel.id = 'catalog-constructor-property-type';
      sel.className = typeInput.className || 'form-control';
      sel.style.cssText = typeInput.style ? typeInput.style.cssText || '' : 'width:100%; padding:8px 10px; border-radius:4px; border:1px solid #d0d7e2; font-size:13px; box-sizing:border-box;';
      Object.keys(TYPE_NAMES).forEach(function(k) {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = TYPE_NAMES[k];
        sel.appendChild(opt);
      });
      typeInput.parentNode.replaceChild(sel, typeInput);
      typeSelect = sel;
    } else if (typeInput && typeInput.tagName === 'SELECT') {
      typeSelect = typeInput;
    }

    // При изменении типа в панели свойств сразу сохраняем его в nodeData,
    // как в референсе: originalType = выбранный ключ типа, type = section/detail.
    if (typeSelect) {
      typeSelect.addEventListener('change', function() {
        if (!currentSelectedNode) return;
        const savedOriginalType = typeSelect.value || 'section';
        const savedNodeType = TYPE_TO_NODE[savedOriginalType] || 'section';

        currentSelectedNode.nodeData = currentSelectedNode.nodeData || {};
        currentSelectedNode.nodeData.originalType = savedOriginalType;
        currentSelectedNode.nodeData.type = savedNodeType;
        currentSelectedNode.setAttribute('data-node-type', savedNodeType);

        // Пересохраняем остальные поля и обновляем UI, чтобы всё было консистентно
        saveConstructorNodeData(currentSelectedNode);
        updateConstructorPropertiesPanel(currentSelectedNode);
      });
    }
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
            case 'paste':
              // TODO: Реализовать вставку
              alert('Функционал "Вставить" будет реализован позже');
              break;
            case 'delete':
              if (currentSelectedNode === rootModule) {
                if (confirm('Удалить корневой модуль? Это действие нельзя отменить.')) {
                  // Очищаем дочерние элементы
                  const childrenContainer = document.getElementById('constructor-root-module-children');
                  if (childrenContainer) {
                    childrenContainer.innerHTML = '';
                  }
                  currentSelectedNode = null;
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
    
    // Обновление панели свойств при выборе элемента (как в рефе)
    function updateConstructorPropertiesPanel(node) {
      // Legacy panel disabled: не трогаем DOM панели свойств вообще.
      if (window.__CLD_DISABLE_LEGACY_PANEL_UI) return;
      try {
        const selEl = document.querySelector('.constructor-tree-item-selected');
        const selId = selEl?.getAttribute?.('data-node-id') || window.currentSelectedNode?.getAttribute?.('data-node-id') || '';
        const incomingIsNull = !node || node === rootModule;
        // Логи всегда только для сценария, когда панель "вылетает" (node = null/rootModule)
        if (incomingIsNull || window.__CLD_DEBUG) {
          console.log('[CLD][panel] updateConstructorPropertiesPanel', {
            tag: 'start',
            incomingIsNull,
            incomingNodeId: node?.getAttribute?.('data-node-id') || '',
            selectedNodeId: selId,
            currentSelectedNodeId: window.currentSelectedNode?.getAttribute?.('data-node-id') || '',
          });
        }
      } catch (_) {}
      const panel = document.getElementById('constructor-properties-panel');
      if (panel) {
        const isEmpty = !node || node === rootModule;
        panel.classList.toggle('cld-empty', isEmpty);
        if (isEmpty) return;
      } else {
        if (!node || node === rootModule) return;
      }
      
      const typeInput = document.getElementById('catalog-constructor-property-type');
      const nameInput = document.getElementById('catalog-constructor-property-name');
      const idInput = document.getElementById('catalog-constructor-property-id');
      const hideWhenFilled = document.getElementById('catalog-constructor-property-hide-when-filled');
      const active = document.getElementById('catalog-constructor-property-active');
      const article = document.getElementById('catalog-constructor-property-article');
      
      // Получаем данные элемента (пока из data-атрибутов, потом из JSON структуры)
      const nodeType = node.getAttribute('data-node-type') || 'section';
      const nodeName = node.getAttribute('data-node-name') || (node === rootModule ? '(модуль без названия)' : '');
      const nodeId = node.getAttribute('data-node-id') || '';
      const nodeData = node.nodeData || {}; // nodeData будет хранить полные данные элемента
      
      // Заполняем базовые поля
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
      if (typeInput) {
        typeInput.value = TYPE_NAMES[originalType] ? originalType : (nodeType === 'detail' ? 'detail' : 'section');
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
        hideDetailSections();
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
      
      // Материал (референс: группа + ключ, фильтрация по allowed_keys)
      const materialGroup = document.getElementById('catalog-constructor-property-material-group');
      const materialKey = document.getElementById('catalog-constructor-property-material-key');
      const materialThickness = document.getElementById('catalog-constructor-property-material-thickness');

      // Для фасадов по умолчанию — g2 («Фасады 18»). Уголок 16 мм — вручную g3 («Фасады 16»).
      let gk = nodeData.material_group;
      if (!gk) {
        if (nodeData.originalType === 'facade') {
          gk = 'g2';
        } else {
          gk = 'g0';
        }
      }

      if (materialGroup) materialGroup.value = gk;
      if (typeof __cldPopulateKeySelectForGroup === 'function') {
        __cldPopulateKeySelectForGroup(gk, nodeData.material_key);
      }
      if (window.__CLD_DEBUG) {
        if (window.__CLD_DEBUG) console.log('[CLD][material][fillProps]', {
          nodeId: (currentSelectedNode && currentSelectedNode.getAttribute) ? currentSelectedNode.getAttribute('data-node-id') : (nodeData.id || ''),
          material_group: gk,
          material_key: nodeData.material_key,
          material_id: nodeData.material_id,
        });
      }
      if (materialThickness) {
        const gk2 = materialGroup?.value || gk || nodeData.material_group || 'g0';
        const lib = window.__cldMaterialsLib;
        const groupDef = Array.isArray(lib?.groups) ? lib.groups.find((g) => g && g.key === gk2) : null;
        const ov = window.__cldMaterialsState?.groupOverrides?.[gk2] || {};
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
        const edgesListContainer = document.getElementById('catalog-constructor-edges-list-container');
        if (edgesListContainer) {
          edgesListContainer.style.display = edgeNumbering.checked ? 'block' : 'none';
        }
      }
      if (typeof window.ensureEdgesCompactRow === 'function') window.ensureEdgesCompactRow();
      for (let i = 1; i <= 4; i++) {
        const edgeCheckbox = document.getElementById(`catalog-constructor-property-edge-${i}`);
        const edgeDetailsDiv = document.getElementById(`catalog-constructor-property-edge-${i}-details`);
        const edgeThickness = document.getElementById(`catalog-constructor-property-edge-${i}-thickness`);
        const edgeType = document.getElementById(`catalog-constructor-property-edge-${i}-type`);
        
        const edgeData = nodeData.edges && nodeData.edges[i] ? nodeData.edges[i] : {};
        if (edgeCheckbox !== null) edgeCheckbox.checked = edgeData.enabled || false;
        if (edgeThickness) edgeThickness.value = edgeData.thickness || '0.2';
        
        // Референс: галочка = разворот. Нажата — разворачивается, отжата — сворачивается
        if (edgeDetailsDiv) {
          edgeDetailsDiv.style.display = edgeCheckbox?.checked ? 'block' : 'none';
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
        // Заполняем decor-id и decor-name — иначе при сохранении (напр. при переключении на другую сторону) они читаются пустыми
        const decorIdInput = document.getElementById(`catalog-constructor-property-edge-${i}-decor-id`);
        const decorNameInput = document.getElementById(`catalog-constructor-property-edge-${i}-decor-name`);
        const edgeSelectedId = document.getElementById(`catalog-constructor-property-edge-${i}-selected-id`);
        const edgeSelectedName = document.getElementById(`catalog-constructor-property-edge-${i}-selected-name`);
        const decorId = edgeData.decor_id || edgeData.edge_id || '';
        const decorName = edgeData.decor_name || edgeData.edge_name || '';
        if (decorIdInput) decorIdInput.value = decorId;
        if (decorNameInput) decorNameInput.value = decorName;
        if (edgeSelectedId) {
          edgeSelectedId.textContent = decorId ? String(decorId) + ':' : '';
          edgeSelectedId.style.display = decorId ? 'inline' : 'none';
        }
        if (edgeSelectedName) {
          edgeSelectedName.textContent = decorName || '';
          edgeSelectedName.style.display = decorName ? 'inline' : 'none';
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
      // Референс: кнопки «+{a}» для вставки формул (@section.width, @section.height и т.д.)
      ensureFormulaButtons();
    }
    
    // Референс: добавляет кнопки «+{a}» (добавить переменную) к полям размеров и позиции.
    // Позволяет вставлять формулы: @section.width, @section.height, @section.depth, $wall.thickness и т.д.
    function ensureFormulaButtons() {
      const ids = [
        'catalog-constructor-property-size-x', 'catalog-constructor-property-size-y', 'catalog-constructor-property-size-z',
        'catalog-constructor-property-pos-x', 'catalog-constructor-property-pos-y', 'catalog-constructor-property-pos-z',
      ];
      ids.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field || field.dataset.cldFormulaBtn) return;
        const row = field.closest('div[style*="margin-bottom"]');
        if (!row) return;
        const formulaRow = document.createElement('div');
        formulaRow.style.cssText = 'margin-top:4px; font-size:11px; color:#666;';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'variable-btn-add';
        btn.setAttribute('data-field-id', fieldId);
        btn.textContent = '+{a} Добавить переменную';
        btn.title = 'Вставить формулу: @section.width, @section.height, @section.depth, $wall.thickness...';
        btn.style.cssText = 'padding:4px 10px; font-size:11px; border:1px solid #d0d7e2; border-radius:4px; background:#f8f9fa; cursor:pointer; color:#555;';
        formulaRow.appendChild(btn);
        row.appendChild(formulaRow);
        field.dataset.cldFormulaBtn = '1';
      });
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
      
      // Сохраняем базовые поля (референс: originalType = ключ типа, type = section/detail для дерева)
      const savedOriginalType = typeInput?.value || 'section';
      const savedNodeType = TYPE_TO_NODE[savedOriginalType] || 'section';
      node.nodeData.originalType = savedOriginalType;
      node.nodeData.type = savedNodeType;
      node.setAttribute('data-node-type', savedNodeType);
      if (node === rootModule) {
        const catalogLabel =
          typeof window.__cldGetCatalogModuleDisplayName === 'function'
            ? window.__cldGetCatalogModuleDisplayName()
            : String(document.getElementById('catalog-item-edit-name')?.value || '').trim();
        node.nodeData.name = catalogLabel || node.nodeData.name || '';
      } else {
        node.nodeData.name = nameInput?.value || '';
      }
      node.nodeData.id = idInput?.value || '';
      node.nodeData.hide_when_filled = document.getElementById('catalog-constructor-property-hide-when-filled')?.checked || false;
      node.nodeData.active = document.getElementById('catalog-constructor-property-active')?.checked !== false;
      node.nodeData.article = document.getElementById('catalog-constructor-property-article')?.value || '';
      
      // Если это деталь - сохраняем все поля детали
      const nodeType = node.getAttribute('data-node-type');
      if (nodeType === 'detail') {
        saveDetailNodeData(node);
      }
      
      // Обновляем визуальное отображение в дереве (например, название)
      if (node === rootModule) {
        const rootName = document.getElementById('constructor-root-module-name');
        const catalogLabel =
          typeof window.__cldGetCatalogModuleDisplayName === 'function'
            ? window.__cldGetCatalogModuleDisplayName()
            : String(document.getElementById('catalog-item-edit-name')?.value || '').trim();
        if (catalogLabel) node.nodeData.name = catalogLabel;
        if (rootName) {
          rootName.textContent =
            catalogLabel || node.nodeData.name || '(модуль без названия)';
        }
      } else {
        // TODO: Обновление названия для дочерних элементов
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
      
      // Материал
      node.nodeData.material_group = document.getElementById('catalog-constructor-property-material-group')?.value || 'g0';
      node.nodeData.material_key = document.getElementById('catalog-constructor-property-material-key')?.value || (window.__cldMaterialsLib?.keys?.[0]?.key) || 'material_2';
      // material_id и material_name сохраняются при выборе материала через selectMaterialForNode
      
      // Чекбоксы
      node.nodeData.rotate = document.getElementById('catalog-constructor-property-rotate')?.checked || false;
      node.nodeData.fixed = document.getElementById('catalog-constructor-property-fixed')?.checked || false;
      
      // Кромки
      node.nodeData.edge_numbering = document.getElementById('catalog-constructor-property-edge-numbering')?.checked !== false;
      // EDGES_SAFETY: мержим с prev, чтобы не терять color, icon и любые будущие поля
      const prevEdges = node.nodeData.edges && typeof node.nodeData.edges === 'object' ? node.nodeData.edges : {};
      node.nodeData.edges = {};
      for (let i = 1; i <= 4; i++) {
        const edgeCheckbox = document.getElementById(`catalog-constructor-property-edge-${i}`);
        const edgeThickness = document.getElementById(`catalog-constructor-property-edge-${i}-thickness`);
        const edgeType = document.getElementById(`catalog-constructor-property-edge-${i}-type`);
        const edgeDecorId = document.getElementById(`catalog-constructor-property-edge-${i}-decor-id`);
        const edgeDecorName = document.getElementById(`catalog-constructor-property-edge-${i}-decor-name`);
        const typeName = edgeType?.options[edgeType?.selectedIndex]?.textContent || '';
        const prev = prevEdges[i] || {};
        const decorIdVal = String(edgeDecorId?.value ?? '').trim();
        const decorNameVal = String(edgeDecorName?.value ?? '').trim();
        node.nodeData.edges[i] = {
          ...prev,
          enabled: !!edgeCheckbox?.checked,
          thickness: edgeThickness?.value ?? prev.thickness ?? '0.2',
          type: edgeType?.value ?? prev.type ?? 'butts',
          type_name: typeName || prev.type_name,
          decor_id: decorIdVal,
          decor_name: decorNameVal,
          edge_id: decorIdVal,
          edge_name: decorNameVal,
        };
        if (!decorIdVal && !decorNameVal) {
          node.nodeData.edges[i].color = '';
          node.nodeData.edges[i].icon = '';
        }
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

    // Связка: поле "Название" на вкладке "Основные" ↔ имя корневого модуля конструктора и его свойства
    (function initModuleNameBinding() {
      const mainNameInput = document.getElementById('catalog-item-edit-name');
      const rootModuleText = document.getElementById('constructor-root-module-name');
      const constructorNameInput = document.getElementById('catalog-constructor-property-name');
      
      if (!mainNameInput || !rootModuleText) return;
      
      function syncNameToConstructor() {
        const moduleName = mainNameInput.value.trim();
        rootModuleText.textContent = moduleName || '(модуль без названия)';
        
        // Поле «Название» в панели свойств относится к *выбранному* узлу дерева.
        // Подставляем туда название из «Основные» только если выбран корень или никого —
        // иначе synthetic input перезапишет имя дочернего узла (ящика и т.д.).
        if (constructorNameInput) {
          const sel = window.currentSelectedNode || window.__cldCurrentSelectedNode || null;
          if (!sel || sel === rootModule) {
            constructorNameInput.value = moduleName || 'Секция';
            const evt = new Event('input', { bubbles: true });
            constructorNameInput.dispatchEvent(evt);
          }
        }
        
        // Если корневой узел уже существует в JSON‑структуре конструктора,
        // обновим и его имя через глобальную функцию (по референсу)
        if (window.updateRootSectionName) {
          window.updateRootSectionName(moduleName || 'Корпус');
        }
      }
      
      // Обновляем при вводе в "Основные"
      mainNameInput.addEventListener('input', syncNameToConstructor);
      
      // Инициализируем при первом открытии, если значение уже есть
      syncNameToConstructor();
    })();
    
    // Инициализация обработчиков для всех полей панели свойств
    function initConstructorPropertiesHandlers() {
      // Обработчики изменения полей - автоматическое сохранение
      const propertiesPanel = document.getElementById('constructor-properties-panel');
      if (!propertiesPanel) return;
      
      // Обработчики для всех input и select в панели свойств
      propertiesPanel.addEventListener('input', function(e) {
        if (currentSelectedNode) {
          // Сохраняем данные при изменении полей
          saveConstructorNodeData(currentSelectedNode);
        }
      });
      
      propertiesPanel.addEventListener('change', function(e) {
        if (currentSelectedNode) {
          saveConstructorNodeData(currentSelectedNode);
          // Как в рефе: любые изменения (в т.ч. ориентация) должны сразу обновлять превью
          try {
            if (typeof update3DVisibility === 'function') update3DVisibility(currentSelectedNode);
          } catch {}
          try {
            if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
          } catch {}
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
              
              if (window.__CLD_DEBUG) console.log('[CLD][detail] Автоподстановка размера Y:', {
                detailTypeId,
                posY: posYValue,
                sizeY: newSizeY
              });
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

        // Данные для меню (группы как в референсе Clodis)
        const groups = [
          {
            title: 'Размеры родителя (родит. элемент)',
            items: [
              { token: '@section.width', label: 'Ширина (родит. элемент) — @section.width' },
              { token: '@section.height', label: 'Высота (родит. элемент) — @section.height' },
              { token: '@section.depth', label: 'Глубина (родит. элемент) — @section.depth' },
              { token: '@section.width / 2', label: 'Половина ширины — @section.width / 2' },
              { token: '@section.height / 2', label: 'Половина высоты — @section.height / 2' },
              { token: '@section.depth / 2', label: 'Половина глубины — @section.depth / 2' },
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
      
      // Обработчики для кнопок "+{a}" (добавить переменную) — делегирование, т.к. кнопки создаются динамически
      propertiesPanel.addEventListener('click', function(e) {
        const btn = e.target.closest('.variable-btn-add');
        if (btn) {
          e.preventDefault();
          e.stopPropagation();
          const fieldId = btn.getAttribute('data-field-id');
          if (fieldId) {
            showVariableDropdown(btn, fieldId);
          }
        }
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
    // Данные берём из API (как в "Список ЛДСП"): materials_keys + material_{id}.
    window.__cldMaterialsLib = window.__cldMaterialsLib || null;
    window.__cldMaterialsState = window.__cldMaterialsState || { groupOverrides: {} };
    window.__cldMaterialsLoading = window.__cldMaterialsLoading || null;

    async function __cldFetchJson(url) {
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
      return await r.json();
    }

    async function __cldEnsureMaterialsLoaded() {
      // ВАЖНО: страница админки живёт долго, а материалы могут обновляться.
      // Если lib уже загружена, но в группах нет ожидаемых полей (allowed_keys),
      // перезагружаем только groups, чтобы "Ключ материала" корректно фильтровался по группе.
      if (window.__cldMaterialsLib) {
        try {
          const g1 = Array.isArray(window.__cldMaterialsLib.groups)
            ? window.__cldMaterialsLib.groups.find((g) => g && String(g.key) === 'g1')
            : null;
          const needsGroupsReload = !g1 || !Array.isArray(g1.allowed_keys) || !g1.allowed_keys.length;
          if (needsGroupsReload) {
            const freshGroups = await __cldFetchJson('/data/materials_groups.json');
            window.__cldMaterialsLib.groups = Array.isArray(freshGroups) ? freshGroups : (window.__cldMaterialsLib.groups || []);
          }
        } catch (_) {}
        return window.__cldMaterialsLib;
      }
      if (window.__cldMaterialsLoading) return window.__cldMaterialsLoading;

      window.__cldMaterialsLoading = (async () => {
        const [groups, apiKeysRaw] = await Promise.all([
          __cldFetchJson('/data/materials_groups.json'),
          fetch('/api/catalog/items_get/materials_keys', { cache: 'no-store' }).then(r => r.ok ? r.json() : []),
        ]);
        const apiKeys = Array.isArray(apiKeysRaw) ? apiKeysRaw : (apiKeysRaw?.items || []);

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
      // Базовый дефолт: 16мм (корпус). Для фасадов/прочих групп толщина может переопределяться.
      const CORPUS_THICKNESS = 16;
      const defaultWt = Number.isFinite(fallbackWt) ? fallbackWt : CORPUS_THICKNESS;
      const uiGroupKey = groupSel?.value || 'g0';

      if (window.__CLD_DEBUG) console.log('[CLD][thickness] __cldBuildMaterialsPayload', {
        thickInValue: thickIn?.value,
        uiGroupKey,
        fallbackWt,
        hasLib: !!lib,
        libGroupsCount: lib?.groups?.length,
        groupOverrides: JSON.stringify(window.__cldMaterialsState?.groupOverrides || {}),
      });

      const defaultMatKey = (lib?.keys?.[0]?.key) || 'material_2';
      if (!lib) {
        // Без библиотеки гарантируем, что g0 (корпус) всегда 16мм.
        out.g0 = {
          thickness: CORPUS_THICKNESS,
          material: { key: defaultMatKey, id: 0, variant_id: 0 },
        };
        return { vars: { _wt: CORPUS_THICKNESS }, materials: out };
      }

      for (const g of lib.groups || []) {
        const key = g.key;
        if (!key) continue;
        const ov = window.__cldMaterialsState?.groupOverrides?.[key] || {};
        const materialKey = (typeof window.__cldNormalizeMaterialKey === 'function'
          ? window.__cldNormalizeMaterialKey(ov.material_key || g.material)
          : (ov.material_key || g.material)) || defaultMatKey;
        const materialId = ov.material_id || 0;
        // UI-значение (поле "Толщина группы") имеет приоритет для выбранной группы,
        // КРОМЕ g0: корпус всегда фиксированно 16мм.
        const uiThickness = (key === uiGroupKey && Number.isFinite(fallbackWt)) ? fallbackWt : undefined;
        let thickness;
        if (key === 'g0') {
          thickness = CORPUS_THICKNESS;
        } else {
          thickness = Number(uiThickness ?? ov.thickness ?? g.thickness ?? 16);
        }
        out[key] = {
          thickness,
          material: { key: materialKey, id: materialId, variant_id: 0 },
        };
      }

      // Гарантируем, что g0 существует даже если lib.groups пустой/непрогрузился
      if (!out.g0) {
        const ov0 = window.__cldMaterialsState?.groupOverrides?.g0 || {};
        out.g0 = {
          // Даже если в override/инпуте другое значение — корпус фиксированно 16мм.
          thickness: CORPUS_THICKNESS,
          material: { key: (typeof window.__cldNormalizeMaterialKey === 'function' ? window.__cldNormalizeMaterialKey(ov0.material_key) : ov0.material_key) || defaultMatKey, id: ov0.material_id || 0, variant_id: 0 },
        };
      }

      const g0t = out.g0?.thickness ?? CORPUS_THICKNESS;
      const result = { vars: { _wt: Number(g0t) || CORPUS_THICKNESS }, materials: out };
      if (window.__CLD_DEBUG) console.log('[CLD][thickness] result', {
        g0: result.materials?.g0?.thickness,
        g1: result.materials?.g1?.thickness,
        g2: result.materials?.g2?.thickness,
        g3: result.materials?.g3?.thickness,
        vars_wt: result.vars?._wt,
      });
      return result;
    }

    // Экспортируем для __ppSyncPreviewToIframe (глобальная синхронизация)
    window.__cldBuildMaterialsPayload = __cldBuildMaterialsPayload;
    // Утилита для отладки (в консоли): __CLDDBG_MATERIALS()
    window.__CLDDBG_MATERIALS = function () {
      try {
        const lib = window.__cldMaterialsLib;
        const st = window.__cldMaterialsState;
        const payload = window.__cldBuildMaterialsPayload ? window.__cldBuildMaterialsPayload() : null;
        if (window.__CLD_DEBUG) console.log('[CLD][materials]', {
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

    /** Референс: заполняет селект "Ключ материала" с учётом allowed_keys группы.
     * @param {string} groupKey - ключ группы (g0, g1, ...)
     * @param {string} [preferredKey] - предпочитаемый ключ (из nodeData.material_key) */
    function __cldPopulateKeySelectForGroup(groupKey, preferredKey) {
      const lib = window.__cldMaterialsLib;
      const keySel = document.getElementById('catalog-constructor-property-material-key');
      if (!keySel || !lib) {
        if (window.__CLD_DEBUG) console.log('[CLD][material][keySelect] skip', { hasKeySel: !!keySel, hasLib: !!lib });
        return;
      }
      const g = (lib.groups || []).find((x) => x && String(x.key) === String(groupKey));
      const allKeys = lib.keys || [];
      let keysToShow = allKeys;
      if (g) {
        if (Array.isArray(g.allowed_keys) && g.allowed_keys.length) {
          const norm = (k) => (typeof window.__cldNormalizeMaterialKey === 'function' ? window.__cldNormalizeMaterialKey(k) : k) || k;
          const allowedSet = new Set(g.allowed_keys.map((ak) => norm(ak)));
          keysToShow = allKeys.filter((k) => allowedSet.has(norm(k.key)));
        } else if (g.material) {
          // fallback: g.material может быть legacy ('ldsp','hdf') — нормализуем в material_2/material_3
          const norm = (k) => (typeof window.__cldNormalizeMaterialKey === 'function' ? window.__cldNormalizeMaterialKey(k) : k) || k;
          const matKey = norm(g.material);
          const match = allKeys.find((k) => norm(k.key) === matKey);
          if (match) keysToShow = [match];
        }
      }
      if (!keysToShow.length) keysToShow = allKeys;
      const norm = (k) => (typeof window.__cldNormalizeMaterialKey === 'function' ? window.__cldNormalizeMaterialKey(k) : k) || k;
      const prevVal = preferredKey != null ? norm(preferredKey) : keySel.value;
      keySel.innerHTML = '';
      for (const k of keysToShow) {
        const opt = document.createElement('option');
        opt.value = k.key;
        opt.textContent = `${k.name || k.key} (${k.key})`;
        keySel.appendChild(opt);
      }
      const defKey = (lib?.keys?.[0]?.key) || 'material_2';
      const match = keysToShow.find((k) => norm(k.key) === prevVal || k.key === prevVal);
      keySel.value = match ? match.key : (keysToShow[0]?.key || defKey);
      if (window.__CLD_DEBUG) {
        if (window.__CLD_DEBUG) console.log('[CLD][material][keySelect] populated', {
          groupKey,
          preferredKey,
          keysCount: keysToShow.length,
          keys: keysToShow.map((k) => k.key),
          selected: keySel.value,
          fromPreferred: !!match,
        });
      }
    }

    async function __cldPopulateMaterialSelects() {
      const lib = await __cldEnsureMaterialsLoaded();
      const groupSel = document.getElementById('catalog-constructor-property-material-group');
      const keySel = document.getElementById('catalog-constructor-property-material-key');
      const thickIn = document.getElementById('catalog-constructor-property-material-thickness');

      if (groupSel) {
        groupSel.innerHTML = '';
        const groups = lib.groups || [];
        const fallbackGroups = [
          { key: 'g0', name: 'Корпус' },
          { key: 'g1', name: 'Задняя стенка' },
          { key: 'g2', name: 'Фасады 18' },
          { key: 'g3', name: 'Фасады 16' },
        ];
        const toUse = groups.length ? groups : fallbackGroups;
        for (const g of toUse) {
          const opt = document.createElement('option');
          opt.value = g.key;
          opt.textContent = `${g.name || g.key} (${g.key})`;
          groupSel.appendChild(opt);
        }
        if (!groupSel.value) groupSel.value = 'g0';
        if (window.__CLD_DEBUG) console.log('[CLD][material][init] groups', { fromLib: groups.length, used: toUse.length, options: Array.from(groupSel.options).map((o) => o.value) });
      }

      __cldPopulateKeySelectForGroup(groupSel?.value || 'g0');

      if (window.__CLD_DEBUG) {
        if (window.__CLD_DEBUG) console.log('[CLD][material][init] selects populated', {
          groupsCount: lib.groups?.length,
          keysCount: lib.keys?.length,
          defaultGroup: groupSel?.value,
          defaultKey: keySel?.value,
        });
      }

      // Толщина группы:
      // - для g0 (корпус) всегда фиксированно 16мм, без возможности изменить;
      // - для остальных групп берём override/толщину группы/16 по умолчанию.
      if (thickIn && groupSel) {
        const gk = groupSel.value || 'g0';
        if (gk === 'g0') {
          thickIn.value = '16';
          thickIn.readOnly = true;
        } else {
          const groupDef = (lib.groups || []).find((g) => g && g.key === gk);
          const ov = window.__cldMaterialsState?.groupOverrides?.[gk] || {};
          const v = Number(ov.thickness ?? groupDef?.thickness ?? 16);
          thickIn.value = Number.isFinite(v) ? String(v) : '';
          thickIn.readOnly = false;
        }
      }

      // При смене группы материалов руками – автоматически обновляем
      // список допустимых ключей и толщину по группе.
      if (groupSel && !groupSel.__cldBoundChange) {
        groupSel.addEventListener('change', () => {
          const gk = groupSel.value || 'g0';
          try {
            __cldPopulateKeySelectForGroup(gk);
          } catch (_) {}
          if (thickIn) {
            if (gk === 'g0') {
              thickIn.value = '16';
              thickIn.readOnly = true;
            } else {
              const groupDef = (lib.groups || []).find((g) => g && g.key === gk);
              const ov = window.__cldMaterialsState?.groupOverrides?.[gk] || {};
              const v = Number(ov.thickness ?? groupDef?.thickness ?? 16);
              thickIn.value = Number.isFinite(v) ? String(v) : '';
              thickIn.readOnly = false;
            }
          }
        });
        groupSel.__cldBoundChange = true;
      }
    }
    window.__cldPopulateMaterialSelects = __cldPopulateMaterialSelects;
    window.__cldPopulateKeySelectForGroup = __cldPopulateKeySelectForGroup;

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
        (lib?.keys?.[0]?.key) || 'material_2';
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
      const groupKey = document.getElementById('catalog-constructor-property-material-group')?.value || 'g0';
      const materialKey = document.getElementById('catalog-constructor-property-material-key')?.value || (window.__cldMaterialsLib?.keys?.[0]?.key) || 'material_2';
      const lib = window.__cldMaterialsLib;
      const item = Array.isArray(lib?.itemsByKey?.[materialKey])
        ? lib.itemsByKey[materialKey].find((x) => String(x.id) === String(materialId))
        : null;

      currentSelectedNode.nodeData.material_id = materialId;
      currentSelectedNode.nodeData.material_name = materialName;
      currentSelectedNode.nodeData.material_icon = item?.icon || item?.image || item?.texture || currentSelectedNode.nodeData.material_icon || '';

      // ВАЖНО: выбор материала для конкретной детали НЕ должен менять толщину/материал группы,
      // иначе это "протечёт" на все детали, использующие эту группу.
      // Толщину материала сохраняем только как метаданные детали (для будущих пер-детальных расчётов/рендера),
      // но глобальные overrides (groupOverrides) и поле "Толщина группы" не трогаем.
      const thickness = Number(item?.thickness ?? item?.height ?? item?.size?.z ?? item?.size_z ?? '');
      currentSelectedNode.nodeData.material_thickness = Number.isFinite(thickness) ? thickness : undefined;

      if (window.__CLD_DEBUG) {
        if (window.__CLD_DEBUG) console.log('[CLD][material][selectForNode]', {
          nodeId: currentSelectedNode?.getAttribute?.('data-node-id'),
          groupKey,
          materialKey,
          materialId,
          materialName,
          thicknessFromItem: thickness,
          overrides: window.__cldMaterialsState?.groupOverrides,
        });
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
      
      if (window.__CLD_DEBUG) console.log('[CLD][material] Материал выбран:', {
        material_id: currentSelectedNode.nodeData.material_id,
        material_name: currentSelectedNode.nodeData.material_name
      });
    };
    
    // Функция обновления отображения выбранного материала
    function updateMaterialDisplay() {
      const displayElement = document.getElementById('catalog-constructor-property-material-display');
      if (!displayElement || !currentSelectedNode) return;
      
      const materialId = currentSelectedNode.nodeData?.material_id;
      const materialName = currentSelectedNode.nodeData?.material_name;
      
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
      // При смене группы или ключа материала — подставляем толщину группы/материала в поле
      function syncThicknessFromGroupOrMaterial(sourceElement) {
        if (window.__CLD_DEBUG) console.log('[CLD][thickness] syncThickness', { source: sourceElement?.id || sourceElement?.tagName });
        if (!thickIn) return;
        const gk = groupSel?.value || 'g0';
        const lib = window.__cldMaterialsLib;
        const ov = window.__cldMaterialsState?.groupOverrides?.[gk] || {};
        const groupDef = Array.isArray(lib?.groups) ? lib.groups.find((g) => g && g.key === gk) : null;
        let val = ov.thickness ?? groupDef?.thickness;
        if (sourceElement === keySel && keySel?.value) {
          const item = (lib?.itemsByKey || {})[keySel.value];
          if (item && Number.isFinite(item.thickness ?? item.height ?? item.size?.z ?? item.size_z)) {
            val = item.thickness ?? item.height ?? item.size?.z ?? item.size_z;
          }
        }
        if (val === undefined) val = 16;
        if (Number.isFinite(val)) {
          thickIn.value = String(val);
          if (window.__CLD_DEBUG) console.log('[CLD][thickness] установила thickness=', val, 'для группы', gk);
          thickIn.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          if (window.__CLD_DEBUG) console.log('[CLD][thickness] val не finite', { val, gk });
        }
      }
      const onMaterialUiChange = (ev) => {
        if (window.__CLD_DEBUG) console.log('[CLD][thickness] onMaterialUiChange', {
          evTarget: ev?.target?.id || ev?.target?.tagName,
          groupSel: groupSel?.value,
          thickInValue: thickIn?.value,
          isGroupOrKey: ev && (ev.target === groupSel || ev.target === keySel),
        });
        const gk = groupSel?.value || 'g0';
        // Жёстко фиксируем ключ материала по группе:
        // g1 (задняя стенка) -> material_3 (HDF),
        // g0/g2 и прочие -> material_2 (LDSP), если ключ ещё не выбран руками.
        if (keySel && gk === 'g1' && keySel.value !== 'material_3') {
          keySel.value = 'material_3';
        } else if (keySel && gk !== 'g1' && !keySel.value) {
          keySel.value = 'material_2';
        }
        // При смене группы или ключа — сначала обновляем поле толщины под новую группу/материал
        if (ev && (ev.target === groupSel || ev.target === keySel)) {
          syncThicknessFromGroupOrMaterial(ev.target);
        }
        const n = Number(thickIn?.value);
        const hasNodeSelected = !!(currentSelectedNode && currentSelectedNode.nodeData);
        // Референс: при смене группы — обновляем список ключей (allowed_keys)
        if (typeof __cldPopulateKeySelectForGroup === 'function') __cldPopulateKeySelectForGroup(gk);
        if (window.__CLD_DEBUG) {
          if (window.__CLD_DEBUG) console.log('[CLD][material][uiChange]', {
            group: gk,
            thickness: n,
            key: keySel?.value,
            hasNodeSelected,
            nodeId: currentSelectedNode?.getAttribute?.('data-node-id'),
          });
        }
        // Толщина группы: пишем override всегда.
        // material_key/material_id: только если НЕ выбрана деталь — иначе материал применится ко всей группе.
        window.__cldMaterialsState.groupOverrides[gk] = {
          ...(window.__cldMaterialsState.groupOverrides[gk] || {}),
          thickness: Number.isFinite(n) ? n : undefined,
          ...(keySel?.value && !hasNodeSelected ? { material_key: keySel.value } : {}),
        };

          if (window.__CLD_DEBUG) {
            if (window.__CLD_DEBUG) console.log('[CLD][material][ui-change]', {
              gk,
              input: thickIn?.value,
              parsed: n,
              override: window.__cldMaterialsState.groupOverrides[gk],
            });
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
    
    // Обработчики кнопок "Выбрать" для кромок 1-4 (референс: show_edges_modal)
    for (let edgeNum = 1; edgeNum <= 4; edgeNum++) {
      const edgeSelectBtn = document.getElementById(`catalog-constructor-property-edge-${edgeNum}-select`);
      if (edgeSelectBtn) {
        edgeSelectBtn.addEventListener('click', function(e) {
          e.preventDefault();
          if (!currentSelectedNode) {
            alert('Сначала выберите элемент');
            return;
          }
          window.openEdgeTypeSelectModal(edgeNum);
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
    
    // Загрузка списка кромок: только назначенные выбранному материалу (edge_ids), иначе весь набор
    function loadEdgeTypesList() {
      const tbody = document.getElementById('edge-type-select-modal-tbody');
      if (!tbody) {
        console.error('[CLD][edge] tbody не найден');
        return;
      }
      tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:20px;">Загрузка...</td></tr>';

      const materialKey = currentSelectedNode && currentSelectedNode.nodeData && (currentSelectedNode.nodeData.material_key || currentSelectedNode.nodeData.materialKey);
      const materialId = currentSelectedNode && currentSelectedNode.nodeData && (currentSelectedNode.nodeData.material_id != null ? currentSelectedNode.nodeData.material_id : currentSelectedNode.nodeData.materialId);
      const catalogType = (typeof materialKey === 'string' && materialKey) ? materialKey : 'material';

      function loadAndShow(edgeSetKey, edgeIds) {
        const type = 'butt_' + (edgeSetKey || 'butts');
        fetch('/api/catalog/items_get/' + encodeURIComponent(type))
          .then(r => r.ok ? r.json() : [])
          .then(items => {
            let list = Array.isArray(items) ? items : [];
            if (Array.isArray(edgeIds) && edgeIds.length > 0) {
              const idSet = new Set(edgeIds.map(id => Number(id)));
              list = list.filter(it => idSet.has(Number(it.id)));
            }
            tbody.innerHTML = '';
            if (list.length === 0) {
              tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:20px;">' + (edgeIds && edgeIds.length ? 'Для этого материала кромки не назначены. Назначьте их во вкладке Параметры материала.' : 'Кромок не найдено') + '</td></tr>';
              return;
            }
            list.forEach(edge => {
              const row = document.createElement('tr');
              row.style.cursor = 'pointer';
              row.onmouseover = function() { this.style.background = '#f5f5f5'; };
              row.onmouseout = function() { this.style.background = ''; };
              const id = edge.id;
              const name = (edge.name || edge.article || 'ID ' + id).toString().replace(/'/g, "\\'");
              row.innerHTML = `
                <td style="padding:8px; border:1px solid #ddd;">${(edge.name || edge.article || 'ID ' + id)}</td>
                <td style="padding:8px; border:1px solid #ddd; text-align:center; width:110px;">
                  <a href="#" onclick="selectEdgeTypeForNode('${id}', '${name}'); return false;" style="color:#007bff; text-decoration:none;">Добавить</a>
                </td>
              `;
              tbody.appendChild(row);
            });
          })
          .catch(() => {
            tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:20px;">Ошибка загрузки кромок</td></tr>';
          });
      }

      if (materialId != null && materialId !== '' && materialId !== 0) {
        fetch('/api/catalog/item/' + encodeURIComponent(catalogType) + '/' + encodeURIComponent(materialId))
          .then(r => r.ok ? r.json() : null)
          .then(item => {
            const edgeSet = (item && (item.edge_set || item.edgeSet)) ? (item.edge_set || item.edgeSet).toString() : 'butts';
            const edgeIds = item && (item.edge_ids || item.edgeIds);
            loadAndShow(edgeSet, Array.isArray(edgeIds) ? edgeIds : null);
          })
          .catch(() => loadAndShow('butts', null));
      } else {
        loadAndShow('butts', null);
      }
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
      
      if (window.__CLD_DEBUG) console.log(`[CLD][edge] Тип кромки выбран:`, {
        edge_type: currentSelectedNode.nodeData.edges[edgeNumber].type,
        edge_type_name: currentSelectedNode.nodeData.edges[edgeNumber].type_name
      });
    };
    
    // Обработчики кнопок "Выбрать" для кромок 1-4
    for (let edgeNum = 1; edgeNum <= 4; edgeNum++) {
      const edgeSelectBtn = document.getElementById(`catalog-constructor-property-edge-${edgeNum}-select`);
      if (edgeSelectBtn) {
        edgeSelectBtn.addEventListener('click', function(e) {
          e.preventDefault();
          if (!currentSelectedNode) {
            alert('Сначала выберите элемент');
            return;
          }
          window.openEdgeTypeSelectModal(edgeNum);
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
    
    // Загрузка списка кромок: только назначенные выбранному материалу (edge_ids), иначе весь набор
    function loadEdgeTypesList() {
      const tbody = document.getElementById('edge-type-select-modal-tbody');
      if (!tbody) {
        console.error('[CLD][edge] tbody не найден');
        return;
      }
      tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:20px;">Загрузка...</td></tr>';

      const materialKey = currentSelectedNode && currentSelectedNode.nodeData && (currentSelectedNode.nodeData.material_key || currentSelectedNode.nodeData.materialKey);
      const materialId = currentSelectedNode && currentSelectedNode.nodeData && (currentSelectedNode.nodeData.material_id != null ? currentSelectedNode.nodeData.material_id : currentSelectedNode.nodeData.materialId);
      const catalogType = (typeof materialKey === 'string' && materialKey) ? materialKey : 'material';

      function loadAndShow(edgeSetKey, edgeIds) {
        const type = 'butt_' + (edgeSetKey || 'butts');
        fetch('/api/catalog/items_get/' + encodeURIComponent(type))
          .then(r => r.ok ? r.json() : [])
          .then(items => {
            let list = Array.isArray(items) ? items : [];
            if (Array.isArray(edgeIds) && edgeIds.length > 0) {
              const idSet = new Set(edgeIds.map(id => Number(id)));
              list = list.filter(it => idSet.has(Number(it.id)));
            }
            tbody.innerHTML = '';
            if (list.length === 0) {
              tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:20px;">' + (edgeIds && edgeIds.length ? 'Для этого материала кромки не назначены. Назначьте их во вкладке Параметры материала.' : 'Кромок не найдено') + '</td></tr>';
              return;
            }
            list.forEach(edge => {
              const row = document.createElement('tr');
              row.style.cursor = 'pointer';
              row.onmouseover = function() { this.style.background = '#f5f5f5'; };
              row.onmouseout = function() { this.style.background = ''; };
              const id = edge.id;
              const name = (edge.name || edge.article || 'ID ' + id).toString().replace(/'/g, "\\'");
              row.innerHTML = `
                <td style="padding:8px; border:1px solid #ddd;">${(edge.name || edge.article || 'ID ' + id)}</td>
                <td style="padding:8px; border:1px solid #ddd; text-align:center; width:110px;">
                  <a href="#" onclick="selectEdgeTypeForNode('${id}', '${name}'); return false;" style="color:#007bff; text-decoration:none;">Добавить</a>
                </td>
              `;
              tbody.appendChild(row);
            });
          })
          .catch(() => {
            tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:20px;">Ошибка загрузки кромок</td></tr>';
          });
      }

      if (materialId != null && materialId !== '' && materialId !== 0) {
        fetch('/api/catalog/item/' + encodeURIComponent(catalogType) + '/' + encodeURIComponent(materialId))
          .then(r => r.ok ? r.json() : null)
          .then(item => {
            const edgeSet = (item && (item.edge_set || item.edgeSet)) ? (item.edge_set || item.edgeSet).toString() : 'butts';
            const edgeIds = item && (item.edge_ids || item.edgeIds);
            loadAndShow(edgeSet, Array.isArray(edgeIds) ? edgeIds : null);
          })
          .catch(() => loadAndShow('butts', null));
      } else {
        loadAndShow('butts', null);
      }
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
      
      if (window.__CLD_DEBUG) console.log(`[CLD][edge] Тип кромки выбран:`, {
        edge_type: currentSelectedNode.nodeData.edges[edgeNumber].type,
        edge_type_name: currentSelectedNode.nodeData.edges[edgeNumber].type_name
      });
    };
    
    // Референс: компактно — цифры 1–4 в одну строку
    window.ensureEdgesCompactRow = function ensureEdgesCompactRow() {
      const container = document.getElementById('catalog-constructor-edges-list-container');
      if (!container || container.dataset.cldEdgesCompact) return;
      const collected = [];
      for (let i = 1; i <= 4; i++) {
        const cb = document.getElementById(`catalog-constructor-property-edge-${i}`);
        if (!cb || !cb.parentElement?.querySelector('label')) return;
        collected.push({ cb, rowDiv: cb.parentElement });
      }
      const title = container.querySelector('div[style*="font-weight:600"]');
      const row = document.createElement('div');
      row.style.cssText = 'display:flex; align-items:center; flex-wrap:wrap; gap:8px 16px; margin-bottom:8px;';
      const titleSpan = document.createElement('span');
      titleSpan.style.cssText = 'font-size:13px; font-weight:600; color:#333;';
      titleSpan.textContent = (title && title.textContent) ? title.textContent.trim() : 'Кромки';
      row.appendChild(titleSpan);
      collected.forEach(({ cb, rowDiv }, idx) => {
        const lab = document.createElement('label');
        lab.style.cssText = 'display:flex; align-items:center; gap:4px; font-size:13px; color:#444; cursor:pointer; margin:0;';
        lab.htmlFor = cb.id;
        lab.appendChild(cb);
        lab.appendChild(document.createTextNode(String(idx + 1)));
        row.appendChild(lab);
        rowDiv.remove();
      });
      if (title) title.replaceWith(row);
      else container.insertBefore(row, container.firstChild);
      container.dataset.cldEdgesCompact = '1';
    };

    /** Снять декор кромки с детали (кнопка × в панели свойств). */
    window.removeEdgeDecorFromDetail = function removeEdgeDecorFromDetail(edgeNum) {
      const n = String(edgeNum);
      if (!/^[1-4]$/.test(n)) return;

      const decorIdInput = document.getElementById(`catalog-constructor-property-edge-${n}-decor-id`);
      const decorNameInput = document.getElementById(`catalog-constructor-property-edge-${n}-decor-name`);
      const edgeThickness = document.getElementById(`catalog-constructor-property-edge-${n}-thickness`);
      const edgeCheckbox = document.getElementById(`catalog-constructor-property-edge-${n}`);
      const edgeSelectedId = document.getElementById(`catalog-constructor-property-edge-${n}-selected-id`);
      const edgeSelectedName = document.getElementById(`catalog-constructor-property-edge-${n}-selected-name`);
      const edgeLink = document.getElementById(`catalog-constructor-property-edge-${n}-link`);
      const edgeRemove = document.getElementById(`catalog-constructor-property-edge-${n}-remove`);
      const detailsDiv = document.getElementById(`catalog-constructor-property-edge-${n}-details`);

      if (decorIdInput) decorIdInput.value = '';
      if (decorNameInput) decorNameInput.value = '';
      if (edgeCheckbox) edgeCheckbox.checked = false;
      if (detailsDiv) detailsDiv.style.display = 'none';
      if (edgeSelectedId) {
        edgeSelectedId.textContent = '';
        edgeSelectedId.style.display = 'none';
      }
      if (edgeSelectedName) {
        edgeSelectedName.textContent = '';
        edgeSelectedName.style.display = 'none';
      }
      if (edgeLink) edgeLink.style.display = 'none';
      if (edgeRemove) edgeRemove.style.display = 'none';

      if (currentSelectedNode?.nodeData) {
        if (!currentSelectedNode.nodeData.edges) currentSelectedNode.nodeData.edges = {};
        const prev = currentSelectedNode.nodeData.edges[n] || {};
        currentSelectedNode.nodeData.edges[n] = {
          ...prev,
          enabled: false,
          decor_id: '',
          decor_name: '',
          edge_id: '',
          edge_name: '',
          key: '',
          id: '',
          variant_id: '',
          thickness: edgeThickness?.value || prev.thickness || '0.4',
        };
      }

      if (currentSelectedNode) {
        if (typeof saveConstructorNodeData === 'function') {
          saveConstructorNodeData(currentSelectedNode);
        } else if (typeof saveDetailNodeData === 'function') {
          saveDetailNodeData(currentSelectedNode);
        }
      }
      if (typeof window.__ppPostModuleToIframe === 'function') {
        window.__ppPostModuleToIframe();
      }
    };

    // Референс: обработчик события для чекбокса "Нумерация сторон кромкования"
    // Используем делегирование событий для динамически создаваемых элементов
    const propertiesPanel = document.getElementById('constructor-properties-panel') || document.body;
    if (!propertiesPanel.dataset.cldEdgeRemoveBound) {
      propertiesPanel.dataset.cldEdgeRemoveBound = '1';
      propertiesPanel.addEventListener('click', function(e) {
        const removeBtn = e.target.closest('[id^="catalog-constructor-property-edge-"][id$="-remove"]');
        if (!removeBtn) return;
        e.preventDefault();
        e.stopPropagation();
        const m = removeBtn.id.match(/^catalog-constructor-property-edge-([1-4])-remove$/);
        if (!m) return;
        window.removeEdgeDecorFromDetail(m[1]);
      });
    }
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
        
        if (window.__CLD_DEBUG) console.log('[CLD][edge] Нумерация кромок:', {
          enabled: isChecked,
          node_id: currentSelectedNode?.getAttribute('data-node-id')
        });
      }
      
      // Референс: галочка напротив кромки — при нажатой разворачивается, при отжатой сворачивается
      if (target && target.id && target.id.startsWith('catalog-constructor-property-edge-') && 
          target.id.match(/^catalog-constructor-property-edge-[1-4]$/)) {
        const edgeNum = target.id.replace('catalog-constructor-property-edge-', '');
        const isChecked = target.checked;
        const detailsDiv = document.getElementById(`catalog-constructor-property-edge-${edgeNum}-details`);
        if (detailsDiv) detailsDiv.style.display = isChecked ? 'block' : 'none';
        
        // Сохраняем данные узла
        if (currentSelectedNode && typeof saveDetailNodeData === 'function') {
          saveDetailNodeData(currentSelectedNode);
        }
        
        // Обновляем 3D превью
        if (typeof window.__ppPostModuleToIframe === 'function') {
          window.__ppPostModuleToIframe();
        }
        
        if (window.__CLD_DEBUG) console.log(`[CLD][edge] Кромка ${edgeNum}:`, {
          enabled: isChecked,
          node_id: currentSelectedNode?.getAttribute('data-node-id')
        });
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
      if (window.__CLD_DEBUG) console.log('[CLD][modal] openAddElementModal', {
        parent_node: {
          type: parentNode?.nodeData?.type || '?',
          name: parentNode?.nodeData?.name || '?',
          id: parentNode?.getAttribute('data-node-id') || '?',
          path: getNodePath ? getNodePath(parentNode) : 'getNodePath не определена',
        },
        timestamp: new Date().toISOString(),
        stack: new Error().stack,
      });
      
      // Референс: проверяем существование модалки в DOM
      const modal = document.getElementById('constructor-add-element-modal');
      const typeSelect = document.getElementById('constructor-add-modal-type');
      const nameInput = document.getElementById('constructor-add-modal-name');
      
      if (window.__CLD_DEBUG) console.log('[CLD][modal] Поиск элементов', {
        modal_exists: !!modal,
        modal_in_dom: modal ? document.body.contains(modal) : false,
        typeSelect_exists: !!typeSelect,
        nameInput_exists: !!nameInput,
        all_modals: document.querySelectorAll('[id*="modal"]').length,
      });
      
      if (!modal || !typeSelect || !nameInput) {
        console.error('[CLD][modal] ❌ Элементы модального окна не найдены', {
          modal: !!modal,
          typeSelect: !!typeSelect,
          nameInput: !!nameInput,
          document_ready: document.readyState,
        });
        return;
      }
      
      
      // Заполняем select всеми типами (референс: item_types_names)
      typeSelect.innerHTML = '';
      Object.keys(TYPE_NAMES).forEach(function(k) {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = TYPE_NAMES[k];
        typeSelect.appendChild(opt);
      });
      
      // Контейнер для сетки деталей
      const detailGridContainer = document.getElementById('constructor-add-modal-detail-grid-container');
      const detailGrid = document.getElementById('constructor-add-modal-detail-grid');
      let selectedDetailType = null;

      // Блок выбора фасада (используется только когда выбран тип "Фасад")
      let facadeContainer = document.getElementById('constructor-add-modal-facade-container');
      if (!facadeContainer && nameInput && nameInput.parentElement) {
        facadeContainer = document.createElement('div');
        facadeContainer.id = 'constructor-add-modal-facade-container';
        facadeContainer.style.cssText = 'display:none; margin-top:12px; padding-top:12px; border-top:1px solid #e5e7eb;';
        const label = document.createElement('label');
        label.style.cssText = 'font-size:13px; margin-bottom:6px; display:block; font-weight:600; color:#333;';
        label.textContent = 'Фасад';
        const row = document.createElement('div');
        row.style.cssText = 'display:flex; align-items:center; gap:8px; flex-wrap:wrap;';
        const selectLink = document.createElement('a');
        selectLink.href = '#';
        selectLink.textContent = 'Выбрать';
        selectLink.style.cssText = 'color:#007bff; text-decoration:none; font-size:13px;';
        const selectedSpan = document.createElement('span');
        selectedSpan.id = 'constructor-add-modal-facade-selected';
        selectedSpan.style.cssText = 'font-size:13px; color:#333;';
        row.appendChild(selectLink);
        row.appendChild(selectedSpan);
        facadeContainer.appendChild(label);
        facadeContainer.appendChild(row);
        if (detailGridContainer && detailGridContainer.parentNode) {
          detailGridContainer.parentNode.insertBefore(facadeContainer, detailGridContainer);
        } else {
          nameInput.parentNode.appendChild(facadeContainer);
        }

        // Обработчик "Выбрать": открываем глобальную модалку выбора фасада
        selectLink.addEventListener('click', function(e) {
          e.preventDefault();
          if (typeof window.openFacadePickerModal === 'function') {
            window.openFacadePickerModal(function(id, name) {
              setSelectedFacade(id, name);
            });
          } else {
            alert('Выбор фасада пока недоступен (openFacadePickerModal не определена)');
          }
        });
      }
      let selectedFacadeId = null;
      let selectedFacadeName = null;

      function setSelectedFacade(id, name) {
        const span = document.getElementById('constructor-add-modal-facade-selected');
        if (id == null || id === '') {
          selectedFacadeId = null;
          selectedFacadeName = '';
          if (span) span.textContent = '';
          return;
        }
        selectedFacadeId = String(id);
        selectedFacadeName = name || '';
        if (span) {
          span.textContent = selectedFacadeId + ': ' + selectedFacadeName;
        }
      }

      // Простая модалка выбора фасада (по ID) на основе справочника facades из референса.
      // Используем существующий endpoint /common_assets/data/materials.json, чтобы не
      // завязываться на изменения API.
      if (typeof window.openFacadePickerModal !== 'function') {
        window.openFacadePickerModal = async function openFacadePickerModal(callback) {
          try {
            const resp = await fetch('/common_assets/data/materials.json?t=' + Date.now(), { cache: 'no-store' });
            if (!resp.ok) {
              alert('Не удалось загрузить фасады (HTTP ' + resp.status + ')');
              return;
            }
            const data = await resp.json();
            const items = Array.isArray(data?.items) ? data.items : [];
            if (!items.length) {
              alert('Справочник фасадов пуст');
              return;
            }
            const preview = items.slice(0, 10).map((it) => {
              const id = it?.id ?? '';
              const name = (it?.name || '').toString();
              const code = (it?.code || it?.article || '').toString();
              return String(id) + ': ' + name + (code ? ' [' + code + ']' : '');
            }).join('\\n');
            const defId = items[0]?.id != null ? String(items[0].id) : '';
            const input = window.prompt('Введите ID фасада:\\n' + preview, defId);
            if (!input) return;
            const trimmed = String(input).trim();
            const found = items.find((it) => String(it?.id) === trimmed);
            if (!found) {
              alert('Фасад с ID ' + trimmed + ' не найден');
              return;
            }
            const name = (found?.name || '').toString();
            if (typeof callback === 'function') {
              callback(found.id, name);
            }
          } catch (e) {
            console.error('❌ [facade-picker] Ошибка загрузки фасадов:', e);
            alert('Ошибка загрузки фасадов: ' + (e?.message || e));
          }
        };
      }
      
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
          if (window.__CLD_DEBUG) console.log('[CLD][detail] Выбрана деталь:', {
            name: detailType.name,
            id: detailType.id,
            orientation: detailType.orientation,
            position: detailType.position
          });
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
      function updateDetailGrid() {
        if (!detailGrid) return;
        
        detailGrid.innerHTML = '';

        const isDetail = typeSelect.value === 'detail';
        const isFacade = typeSelect.value === 'facade';

        // Показ/скрытие блока выбора фасада
        if (facadeContainer) {
          facadeContainer.style.display = isFacade ? 'block' : 'none';
          if (!isFacade) {
            setSelectedFacade(null, '');
          }
        }
        
        if (isDetail || isFacade) {
          // Показываем контейнер сетки
          if (detailGridContainer) {
            detailGridContainer.style.display = 'block';
          }
          
          // Добавляем все типы деталей в сетку
          detailTypes.forEach(detailType => {
            detailGrid.appendChild(createDetailPreviewItem(detailType));
          });
          
          // Сбрасываем выбор
          selectedDetailType = null;
        } else {
          // Скрываем контейнер
          if (detailGridContainer) {
            detailGridContainer.style.display = 'none';
          }
          selectedDetailType = null;
        }
      }
      
      // Обновляем название при изменении типа
      typeSelect.onchange = function() {
        nameInput.value = TYPE_NAMES[typeSelect.value] || 'Новый элемент';
        updateDetailGrid();
      };
      
      // Устанавливаем начальное значение
      nameInput.value = TYPE_NAMES[typeSelect.value] || 'Новый элемент';
      
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
          // Сбрасываем выбор детали
          selectedDetailType = null;
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
      addBtn.onclick = function() {
          try {
        const selectedType = typeSelect.value;
        const elementName = nameInput.value.trim() || (TYPE_NAMES[selectedType] || 'Новый элемент');
        
        // Проверка: если выбран тип "detail", но не выбрана конкретная деталь
        if (selectedType === 'detail' && !selectedDetailType) {
          alert('Пожалуйста, выберите тип детали из сетки ниже');
          return;
        }
        
        const nodeType = TYPE_TO_NODE[selectedType] || 'section';
        
        // ⭐ ЛОГИ ПО ДЕТАЛЯМ: Детальная информация о создании детали
        if (selectedType === 'detail' && selectedDetailType) {
          const detailTypeInfo = detailTypes.find(dt => dt.id === selectedDetailType);
          const parentType = parentNode?.nodeData?.type || parentNode?.getAttribute('data-node-type') || '?';
          const parentName = parentNode?.nodeData?.name || parentNode?.querySelector('.tree-node-name')?.textContent || '?';
          
          if (window.__CLD_DEBUG) console.log('[CLD][detail] Создаём деталь:', {
            detail_type_id: selectedDetailType,
            detail_name: detailTypeInfo?.name || '?',
            detail_orientation: detailTypeInfo?.orientation || '?',
            detail_position: detailTypeInfo?.position || '?',
            parent_section_type: parentType,
            parent_section_name: parentName,
            parent_section_id: parentNode?.getAttribute('data-node-id') || '?',
            element_name: elementName
          });
        }
        
        // Создаем новый узел
        const newNode = createConstructorTreeNode(nodeType, parentNode);
            if (!newNode) {
              console.error('[CLD][modal] ❌ Не удалось создать узел');
              alert('Ошибка: не удалось создать элемент');
              return;
            }
            
        newNode.nodeData.name = elementName;
        newNode.setAttribute('data-node-name', elementName);
        newNode.nodeData.originalType = selectedType;

        // Накладной фасад: внутренняя грань в плоскости передней грани секции (ClodisBuilder.buildFacade + applyTransform)
        if (selectedType === 'facade') {
          if (!newNode.nodeData.material_group) {
            newNode.nodeData.material_group = 'g2';
          }
          if (selectedFacadeId != null) {
            newNode.nodeData.modelId = String(selectedFacadeId);
            if (selectedFacadeName) {
              newNode.nodeData.modelKey = selectedFacadeName;
            }
          }
          newNode.nodeData.size = {
            x: '@section.width',
            y: '@section.height',
            z: 16
          };
          newNode.nodeData.position = { x: 0, y: 0, z: '@section.depth' };
          newNode.nodeData.anchor = { x: -1, y: -1, z: -1 };
          if (!newNode.nodeData.spec) newNode.nodeData.spec = {};
          newNode.nodeData.spec.orientation = 'f';
          newNode.nodeData.spec.direction = newNode.nodeData.spec.direction || '-z';
          if (newNode.nodeData.spec.thickness_mm == null) newNode.nodeData.spec.thickness_mm = 16;
        }
        
        // Если выбран тип детали, сохраняем его
        if (selectedDetailType) {
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
                    // Референс: группа и ключ материала по типу детали
                    if (defaults.material_group) newNode.nodeData.material_group = defaults.material_group;
                    const lib = window.__cldMaterialsLib;
                    const g = lib && (lib.groups || []).find((x) => x && String(x.key) === String(defaults.material_group));
                    if (g && (g.material || (g.allowed_keys && g.allowed_keys[0]))) {
                      const matKey = g.allowed_keys?.[0] || g.material;
                      const resolved = (lib.keys || []).find((k) =>
                        String(k.key || '').toLowerCase().includes(String(matKey || '').toLowerCase()) ||
                        String(k.name || '').toLowerCase().includes(String(matKey || '').toLowerCase())
                      );
                      if (resolved) newNode.nodeData.material_key = resolved.key;
                      if (window.__CLD_DEBUG) {
                        if (window.__CLD_DEBUG) console.log('[CLD][material][createDetail]', {
                          detailType: selectedDetailType,
                          material_group: defaults.material_group,
                          material_key: resolved?.key,
                          fromGroup: !!g,
                        });
                      }
                    }
                  }
                }
            
            if (window.__CLD_DEBUG) console.log('[CLD][detail] Тип детали сохранен:', {
              detail_type_id: selectedDetailType,
              detail_name: detailTypeInfo.name,
              orientation: detailTypeInfo.orientation,
                  spec_orientation: newNode.nodeData.spec?.orientation || newNode.nodeData.orientation,
              position: detailTypeInfo.position,
              node_id: newNode.getAttribute('data-node-id')
            });
          }
        }
        
        // Обновляем название в дереве
        const nameElement = newNode.querySelector('.tree-node-name');
        if (nameElement) {
          nameElement.textContent = elementName;
        }
        
        // Добавляем в дерево
        addTreeNodeToParent(newNode, parentNode);
        
        if (selectedType === 'detail' && selectedDetailType) {
          if (window.__CLD_DEBUG) console.log('[CLD][detail] Деталь добавлена:', {
            detail_name: elementName,
            detail_type: selectedDetailType,
            parent_section: parentNode?.nodeData?.name || parentNode?.querySelector('.tree-node-name')?.textContent || '?'
          });
        }
        
        // Выбираем новый элемент
        selectTreeNode(newNode);
        
            // Закрываем модальное окно ПЕРЕД обновлением 3D
        closeModal();
        
        if (selectedType === 'detail' && selectedDetailType) {
        }
        
            // Обновляем 3D превью после закрытия модалки
            setTimeout(() => {
        if (typeof window.__ppPostModuleToIframe === 'function') {
          window.__ppPostModuleToIframe();
              } else {
                console.warn('[CLD][detail] ⚠️ __ppPostModuleToIframe не определена');
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
    
    /** Добавляет material_icon/material_id/material_key/material_group из DOM в structure.
     * Обход совпадает с __ppBuildClodisTemplateTreeFromDom: только прямые дети на каждом уровне. */
    function enrichStructureWithMaterialsFromDom(structureItems, domContainer) {
      if (!structureItems || !domContainer) return;
      if (window.__CLD_DEBUG) {
        if (window.__CLD_DEBUG) console.log('[CLD][material][enrich] start', { structureItemsCount: structureItems?.length });
      }
      function directChildren(container) {
        if (!container) return [];
        return Array.from(container.children || []).filter((ch) => ch.classList?.contains?.('constructor-tree-node'));
      }
      const domChildren = directChildren(domContainer);
      function walk(structArr, domNodes) {
        if (!Array.isArray(structArr) || !domNodes) return;
        for (let i = 0; i < structArr.length && i < domNodes.length; i++) {
          const item = structArr[i];
          const el = domNodes[i];
          if (!item) continue;
          const t = String(item.type || '').toLowerCase();
          if (t === 'wall' || t === 'detail') {
            const nd = el && el.nodeData;
            if (nd) {
              if (nd.material_icon || nd.materialIcon) item.material_icon = nd.material_icon || nd.materialIcon;
              if (nd.material_id != null) item.material_id = nd.material_id;
              if (nd.material_key) item.material_key = nd.material_key;
              if (nd.material_group) item.material_group = nd.material_group;

              // Также синхронизируем spec.material, чтобы при следующей загрузке конвертер брал актуальный материал
              try {
                if (nd.material_key || nd.material_group || nd.material_id != null || nd.material) {
                  item.spec = item.spec && typeof item.spec === 'object' ? item.spec : {};
                  item.spec.material = item.spec.material && typeof item.spec.material === 'object'
                    ? item.spec.material
                    : {};
                  const sm = item.spec.material;
                  if (nd.material_group) sm.group = nd.material_group;
                  if (nd.material_key) sm.key = nd.material_key;
                  if (nd.material_id != null) sm.id = nd.material_id;
                  if (nd.material && typeof nd.material === 'object') {
                    // Копируем дополнительные поля материала (толщина, цвет и т.п.)
                    Object.assign(sm, nd.material);
                  }
                }
              } catch (e) {
                console.warn('[CLD][material][enrich] Не удалось синхронизировать spec.material:', e?.message || e);
              }
              if (window.__CLD_DEBUG && (nd.material_icon || nd.material_key)) {
                if (window.__CLD_DEBUG) console.log('[CLD][material][enrich] wall', { name: item.name, material_group: nd.material_group });
              }
            }
          } else if ((t === 'section' || t === 'module') && Array.isArray(item.children) && item.children.length) {
            const chCont = el?.querySelector?.('.tree-node-children');
            const subDom = chCont ? directChildren(chCont) : [];
            walk(item.children, subDom);
          }
        }
      }
      walk(structureItems, domChildren);
    }

    // Функция для сбора всей структуры дерева в JSON формат
    function getConstructorTreeJSON() {
      const rootModule = document.getElementById('constructor-root-module');
      if (!rootModule) {
        console.warn('⚠️ Корневой модуль не найден');
        return null;
      }
      
      // Функция для рекурсивного обхода узлов дерева
      function collectNodeData(nodeElement) {
        if (!nodeElement || !nodeElement.nodeData) {
          return null;
        }
        
        const nodeData = nodeElement.nodeData || {};
        const nodeType = nodeElement.getAttribute('data-node-type') || 'section';
        const nodeId = nodeElement.getAttribute('data-node-id') || '';

        // Логический тип (как его выбрал пользователь) и тип, который реально уходит в JSON.
        const logicalType = nodeData.originalType || nodeType;
        const exportType = EXPORT_TYPE_MAP[logicalType] || logicalType || nodeType || 'section';
        
        // Базовые данные узла
        const result = {
          type: exportType,
          id: nodeId,
          name: nodeData.name || '',
          originalType: logicalType,
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
        
        // Если это деталь, добавляем специфичные поля
        if (nodeType === 'detail') {
          // Комплектующие (model/furniture): экспортируем в формате референса
          const originalType = logicalType || '';
          if (originalType === 'model' || originalType === 'furniture') {
            // model / furniture: отдельный формат с ссылкой на библиотеку моделей
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
            // Фасады имеют spec.id (ID фасада из библиотеки) и spec.element_type
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
          
          // ⭐ МОДУЛИ: module в Clodis — это готовые элементы (двери, опоры и т.п.)
          if (originalType === 'module') {
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
          
          // Все остальные типы (включая wall, countertop, plinth, fitting, cutout и пр.)
          // экспортируем как "деталь-плиту" с геометрией и материалами.
          const detailTypeId = nodeData.detailType || nodeData.detailTypeId;
          let defaultPivot = null;
          if (detailTypeId) {
            const dflt = cldGetDetailDefaults(detailTypeId);
            defaultPivot = dflt?.pivot || null;
          }
          result.orientation = nodeData.orientation || 'h';
          result.shape = nodeData.shape || 'normal';
          result.material = nodeData.material || {};
          result.rotate = nodeData.rotate || false;
          result.fixed = nodeData.fixed || false;
          result.edges = nodeData.edges || {};
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
        }
        
        // material_icon, material_group и т.д. — для wall/section (чтобы 3D превью применяло материалы)
        if (nodeData.material_icon) result.material_icon = nodeData.material_icon;
        if (nodeData.materialIcon) result.materialIcon = nodeData.materialIcon;
        if (nodeData.material_group) result.material_group = nodeData.material_group;
        if (nodeData.materialGroup) result.materialGroup = nodeData.materialGroup;
        if (nodeData.material_key) result.material_key = nodeData.material_key;
        if (nodeData.materialKey) result.materialKey = nodeData.materialKey;
        if (nodeData.material_id != null) result.material_id = nodeData.material_id;
        if (nodeData.material_name != null) result.material_name = nodeData.material_name;
        
        // Собираем дочерние элементы
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
          const fromMain =
            typeof window.__cldGetCatalogModuleDisplayName === 'function'
              ? window.__cldGetCatalogModuleDisplayName()
              : String(document.getElementById('catalog-item-edit-name')?.value || '').trim();
          if (fromMain) return fromMain;
          const el = document.getElementById('constructor-root-module-name');
          if (el?.textContent && String(el.textContent).trim()) return String(el.textContent).trim();
          return '(модуль без названия)';
        })(),
        children: [],
        // Переменные модуля (вкладка "Переменные")
        variables: (() => {
          const nd = rootModule.nodeData || {};
          // гарантируем, что main пересобран из enabled vars
          if (nd.variables && typeof nd.variables === 'object') {
            if (Array.isArray(nd.variables.groups)) {
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
              nd.variables.main = flat;
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
          const cloned = JSON.parse(JSON.stringify(ov));
          // Корпус (g0) всегда 16мм: фиксируем в overrides, чтобы при экспорте JSON это не "уплыло".
          if (!cloned.g0) cloned.g0 = {};
          cloned.g0.thickness = 16;
          rootData.materials_overrides = cloned;
        }
      } catch {}
      // Материалы: список групп материалов модуля (как в референсе "Группы материалов")
      try {
        const nd = rootModule.nodeData || {};
        if (Array.isArray(nd.material_groups)) {
          const groups = JSON.parse(JSON.stringify(nd.material_groups));
          groups.forEach((g) => {
            if (g && String(g.key) === 'g0') {
              g.thickness = 16;
            }
          });
          rootData.material_groups = groups;
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

        // Параллельно сохраняем "движковое" дерево (section/wall) в template.structure.
        // Если есть сохранённый Clodis JSON (clean-room/reference) — используем его как базу,
        // а из DOM только подмешиваем материалы и прочие правки UI.
        rootData.template = rootData.template || {};
        let structure = null;
        try {
          const nd = rootModule.nodeData || {};
          const legacyTree =
            typeof globalThis !== 'undefined' && typeof globalThis.__cldReadClodisJSON === 'function'
              ? globalThis.__cldReadClodisJSON(nd)
              : (Array.isArray(nd.clodisJSON) ? nd.clodisJSON : null);
          if (Array.isArray(legacyTree) && legacyTree.length) {
            structure = JSON.parse(JSON.stringify(legacyTree));
            console.log('[CLD][getConstructorTreeJSON] ✅ Используем clodisJSON из rootModule.nodeData:', { 
              count: structure.length,
              firstItem: structure[0] ? { type: structure[0].type, name: structure[0].name } : null,
            });
          } else {
            console.log('[CLD][getConstructorTreeJSON] ⚠️ clodisJSON не найден в rootModule.nodeData:', {
              hasNodeData: !!nd,
              hasClodisJSON: !!(nd.clodisJSON),
              clodisJSONType: typeof nd.clodisJSON,
              clodisJSONIsArray: Array.isArray(nd.clodisJSON),
              clodisJSONLength: Array.isArray(nd.clodisJSON) ? nd.clodisJSON.length : 0,
              nodeDataKeys: Object.keys(nd).slice(0, 10),
            });
            
            if (typeof __ppBuildClodisTemplateTreeFromDom === 'function') {
              // Fallback: собираем структуру из DOM (как раньше)
              structure = __ppBuildClodisTemplateTreeFromDom(childrenContainer);
              console.log('[CLD][getConstructorTreeJSON] Используем DOM fallback:', { count: Array.isArray(structure) ? structure.length : 0 });
            }
          }
        } catch (e) {
          console.error('[CLD][getConstructorTreeJSON] ❌ ОШИБКА при получении template.structure:', e?.message || e, e?.stack);
        }

        structure = Array.isArray(structure) ? structure : [];
        
        // ⭐ КРИТИЧНО: Проверяем, что DOM-узлы созданы перед обогащением материалами
        // Если DOM-узлов нет, но structure есть (из clodisJSON), это нормально при первой загрузке
        const domNodes = childrenContainer ? childrenContainer.querySelectorAll('.constructor-tree-node') : [];
        const hasDomNodes = domNodes.length > 0;
        
        if (window.__CLD_DEBUG) {
          console.log('[CLD][getConstructorTreeJSON] template.structure перед enrich:', {
            structureLength: structure.length,
            domNodesCount: domNodes.length,
            hasClodisJSON: Array.isArray(rootModule.nodeData?.clodisJSON) && rootModule.nodeData.clodisJSON.length > 0,
            willEnrich: hasDomNodes && structure.length > 0,
          });
        }
        
        try {
          // Подмешиваем материалы из DOM-узлов (то, что вы выбрали в конструкторе)
          // ТОЛЬКО если DOM-узлы уже созданы, иначе обогащение не имеет смысла
          if (hasDomNodes && structure.length > 0) {
            enrichStructureWithMaterialsFromDom(structure, childrenContainer);
          } else if (structure.length > 0 && !hasDomNodes) {
            if (window.__CLD_DEBUG) {
              console.warn('[CLD][getConstructorTreeJSON] ⚠️ Пропущено обогащение: DOM-узлы ещё не созданы (structure.length=' + structure.length + ', domNodes.length=0)');
            }
          }
        } catch (e) {
          console.warn('⚠️ Не удалось обогатить template.structure материалами из DOM:', e?.message || e);
        }

        rootData.template.structure = structure;
        rootData.spec = rootData.spec || {};
        rootData.spec.template = rootData.spec.template || {};
        rootData.spec.template.tree = rootData.template.structure;
      }
      
      return rootData;
    }
    
    // Функция для восстановления дерева из JSON
    function loadConstructorTreeFromJSON(jsonData) {
      // UX fix: при синхронизации из iframe DOM дерево пересоздаётся и текущий selected-node пропадает.
      // Сохраняем предыдущий selection (по id) и восстанавливаем после загрузки дерева.
      const prevSelectedId = currentSelectedNode?.getAttribute?.('data-node-id')
        || currentSelectedNode?.nodeData?.id
        || '';
      // ⭐ КРИТИЧНО: Всегда логируем входные данные для диагностики
      console.log('[CLD][tree-load] 🔍 loadConstructorTreeFromJSON ВХОДНЫЕ ДАННЫЕ:', {
        isArray: Array.isArray(jsonData),
        isNull: jsonData === null,
        isUndefined: jsonData === undefined,
        type: typeof jsonData,
        hasChildren: !!(jsonData && Array.isArray(jsonData.children)),
        childrenLength: jsonData && Array.isArray(jsonData.children) ? jsonData.children.length : 0,
        hasTemplateStructure: !!(jsonData && jsonData.template && Array.isArray(jsonData.template.structure)),
        templateStructureLength: jsonData && jsonData.template && Array.isArray(jsonData.template.structure) ? jsonData.template.structure.length : 0,
        hasSpecTemplateTree: !!(jsonData && jsonData.spec && jsonData.spec.template && Array.isArray(jsonData.spec.template.tree)),
        specTemplateTreeLength: jsonData && jsonData.spec && jsonData.spec.template && Array.isArray(jsonData.spec.template.tree) ? jsonData.spec.template.tree.length : 0,
        jsonDataKeys: jsonData && typeof jsonData === 'object' && !Array.isArray(jsonData) ? Object.keys(jsonData).slice(0, 15) : [],
        firstLevelSample: jsonData && typeof jsonData === 'object' && !Array.isArray(jsonData) ? JSON.stringify(jsonData).substring(0, 500) : String(jsonData).substring(0, 200),
      });
      
      // ⭐ ДОПОЛНИТЕЛЬНАЯ ДИАГНОСТИКА: проверяем структуру данных более детально
      if (jsonData && typeof jsonData === 'object' && !Array.isArray(jsonData)) {
        console.log('[CLD][tree-load] 🔍 ДЕТАЛЬНАЯ СТРУКТУРА jsonData:', {
          type: jsonData.type,
          name: jsonData.name,
          hasChildren: !!jsonData.children,
          childrenIsArray: Array.isArray(jsonData.children),
          childrenLength: Array.isArray(jsonData.children) ? jsonData.children.length : 0,
          firstChild: Array.isArray(jsonData.children) && jsonData.children.length > 0 ? {
            type: jsonData.children[0].type,
            name: jsonData.children[0].name,
          } : null,
          hasTemplate: !!jsonData.template,
          templateKeys: jsonData.template ? Object.keys(jsonData.template).slice(0, 10) : [],
          hasSpec: !!jsonData.spec,
          specKeys: jsonData.spec ? Object.keys(jsonData.spec).slice(0, 10) : [],
        });
      }
      if (!jsonData) {
        // Очищаем дерево при новом модуле (id=0) — иначе показывается предыдущий модуль
        const childrenContainer = document.getElementById('constructor-root-module-children');
        if (childrenContainer) {
          childrenContainer.innerHTML = '';
          if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
        }
        // Очищаем шаблоны в root — иначе вкладка "Шаблоны" подставляет старый constructor_structure
        const root = document.getElementById('constructor-root-module');
        if (root && root.nodeData) {
          root.nodeData.templates = [];
          root.nodeData.selectedTemplateId = null;
        }
        window.__CLD_TEMPLATES_TAB_INITIALIZED = false;
        return;
      }

      // Совместимость с форматом референса: если пришёл массив [section, ...] — оборачиваем в объект
      if (Array.isArray(jsonData)) {
        if (window.__CLD_DEBUG) {
          console.log('[CLD][tree-load] jsonData - массив, оборачиваем в объект:', { length: jsonData.length });
        }
        jsonData = { template: { structure: jsonData } };
      }

      // Совместимость: если legacy children отсутствуют, но есть template.structure — восстанавливаем UI дерево из него.
      // Это best-effort конвертер (section/wall -> section/detail).
      const hasLegacyChildren = Array.isArray(jsonData.children);
      const hasNewStructure = Array.isArray(jsonData.template?.structure);
      const hasSpecTemplateTree = Array.isArray(jsonData.spec?.template?.tree);
      
      // ⭐ ВАЖНО: при наличии template.structure (Clodis / clean-room формат) всегда используем его
      // как источник правды, а children — только как fallback для старых модулей.
      // Также проверяем spec.template.tree (альтернативный формат)
      let sourceChildren = null;
      if (hasNewStructure) {
        sourceChildren = jsonData.template.structure;
        if (window.__CLD_DEBUG) {
          console.log('[CLD][tree-load] Используем template.structure:', { count: sourceChildren.length });
        }
      } else if (hasSpecTemplateTree) {
        sourceChildren = jsonData.spec.template.tree;
        if (window.__CLD_DEBUG) {
          console.log('[CLD][tree-load] Используем spec.template.tree:', { count: sourceChildren.length });
        }
      } else if (hasLegacyChildren) {
        sourceChildren = jsonData.children;
        if (window.__CLD_DEBUG) {
          console.log('[CLD][tree-load] Используем legacy children:', { count: sourceChildren.length });
        }
      }

      if (!sourceChildren) {
        console.error('❌ [CLD][tree-load] НЕТ ДАННЫХ ДЛЯ ЗАГРУЗКИ ДЕРЕВА!', {
          hasChildren: hasLegacyChildren,
          hasTemplateStructure: hasNewStructure,
          hasSpecTemplateTree: hasSpecTemplateTree,
          jsonDataKeys: Object.keys(jsonData || {}),
          jsonDataType: typeof jsonData,
          jsonDataIsArray: Array.isArray(jsonData),
          jsonDataString: JSON.stringify(jsonData).substring(0, 1000),
        });
        return;
      }
      
      console.log('[CLD][tree-load] ✅ Найдены данные для загрузки:', {
        source: hasNewStructure ? 'template.structure' : (hasSpecTemplateTree ? 'spec.template.tree' : (hasLegacyChildren ? 'children' : 'unknown')),
        count: Array.isArray(sourceChildren) ? sourceChildren.length : 0,
      });
      if (window.__CLD_DEBUG) {
        try {
          console.log('[CLD][tree-load] источник детей:', {
            from: hasNewStructure ? 'template.structure' : (hasLegacyChildren ? 'children' : 'none'),
            count: Array.isArray(sourceChildren) ? sourceChildren.length : 0,
            firstItemSample: Array.isArray(sourceChildren) && sourceChildren.length > 0
              ? {
                  type: sourceChildren[0].type,
                  name: sourceChildren[0].name,
                  detailTypeId: sourceChildren[0]?.spec?.detailTypeId,
                  pos: sourceChildren[0].pos,
                  size: sourceChildren[0].size,
                }
              : null,
          });
        } catch {}
      }
      
      // Очищаем существующее дерево (кроме корневого модуля)
      const childrenContainer = document.getElementById('constructor-root-module-children');
      if (childrenContainer) {
        childrenContainer.innerHTML = '';
      }
      
      // Конвертация элемента template.structure в UI-узел (для режима без legacy children)
      function templateItemToNodeData(item) {
        if (!item || typeof item !== 'object') return null;
        const t = String(item.type || '').toLowerCase();
        const name = item.name || (t === 'wall' ? 'Деталь' : t === 'model' ? 'Модель' : t === 'furniture' ? 'Фурнитура' : 'Секция');
        
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
          const detailTypeId = item.spec?.detailTypeId || '';

          if (window.__CLD_DEBUG) {
            try {
              console.log('[CLD][tree-import] wall → detail', {
                name,
                detailTypeId,
                orientation: item.spec?.orientation,
                size: item.size,
                pos: item.pos,
                pivot: item.pivot,
                material: {
                  id: material_id,
                  key: material_key,
                  group: material_group,
                },
              });
            } catch {}
          }
          
          return {
            type: 'detail',
            name,
            originalType: 'wall', // сохраняем для экспорта
            // стараемся восстановить ключевые поля для UI
            detailType: detailTypeId,
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
        
        // ⭐ ФАСАДЫ: facade в Clodis — это фасады (двери, цоколь, топ и т.п.)
        if (t === 'facade') {
          if (window.__CLD_DEBUG) {
            console.log('[CLD][tree-import] facade → detail', {
              name,
              specId: item.spec?.id,
              specElementType: item.spec?.element_type,
              size: item.size,
              pos: item.pos,
            });
          }
          
          return {
            type: 'detail', // в UI фасады отображаются как детали
            name,
            originalType: 'facade', // сохраняем для экспорта
            // Фасады имеют spec.id (ID фасада из библиотеки) и spec.element_type
            modelId: item.spec?.id ? String(item.spec.id) : '',
            modelKey: item.spec?.key || '',
            // размеры и позиция фасада
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
            accessories: Array.isArray(item.accessories) ? item.accessories : [],
          };
        }
        
        // ⭐ МОДУЛИ: module в Clodis — это готовые элементы (двери, опоры и т.п.)
        if (t === 'module') {
          if (window.__CLD_DEBUG) {
            console.log('[CLD][tree-import] module → detail', {
              name,
              specId: item.spec?.id,
              specElementType: item.spec?.element_type,
              size: item.size,
              pos: item.pos,
            });
          }
          
          return {
            type: 'detail', // в UI модули отображаются как детали
            name,
            originalType: 'module', // сохраняем для экспорта
            // Модули имеют spec.id (ID модуля из библиотеки) и spec.element_type
            modelId: item.spec?.id ? String(item.spec.id) : '',
            modelKey: item.spec?.key || '',
            // размеры и позиция модуля
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
            accessories: Array.isArray(item.accessories) ? item.accessories : [],
          };
        }
        
        // section/прочее трактуем как секцию в UI
        return {
          type: 'section',
          name,
          active: item.active !== undefined ? !!item.active : true,
          visible: item.visible !== undefined ? !!item.visible : true,
          children: Array.isArray(item.children) ? item.children.map(templateItemToNodeData).filter(Boolean) : [],
        };
      }

      // Функция для рекурсивного создания узлов
      function createNodeFromData(nodeData, parentNode) {
        if (!nodeData) return null;
        
        // Референс: определяем тип узла по originalType (section/detail)
        const originalType = nodeData.originalType || nodeData.type;
        const nodeType = TYPE_TO_NODE[originalType] || (nodeData.type === 'detail' ? 'detail' : 'section');
        
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
          newNode.nodeData.size = nodeData.size || { x: '', y: '', z: '' };
          newNode.nodeData.position = nodeData.position || { x: '0', y: '0', z: '0' };
          newNode.nodeData.anchor = nodeData.anchor || { x: 0, y: 0, z: 0 };
          newNode.nodeData.rotation = nodeData.rotation || { x: '0', y: '0', z: '0' };
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
          // Комплектующие (model/furniture): сохраняем ID модели для загрузки из библиотеки
          if (nodeData.originalType === 'model' || nodeData.originalType === 'furniture') {
            newNode.nodeData.originalType = nodeData.originalType;
            if (nodeData.modelId) newNode.nodeData.modelId = String(nodeData.modelId);
            if (nodeData.modelKey) newNode.nodeData.modelKey = String(nodeData.modelKey);
            if (nodeData.modelMats && typeof nodeData.modelMats === 'object') newNode.nodeData.modelMats = nodeData.modelMats;
            if (Array.isArray(nodeData.current)) newNode.nodeData.current = nodeData.current;
            if (nodeData.c_rot && typeof nodeData.c_rot === 'object') newNode.nodeData.c_rot = nodeData.c_rot;
          }
        }
        
        // Добавляем узел в дерево
        addTreeNodeToParent(newNode, parentNode);
    // Обновляем превью в iframe при каждом добавлении
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
      // Восстанавливаем корневые свойства модуля (имя + переменные)
      if (rootModule) {
        rootModule.nodeData = rootModule.nodeData || {};
        {
          const nameEl = document.getElementById('constructor-root-module-name');
          const fromCatalog =
            typeof window.__cldGetCatalogModuleDisplayName === 'function'
              ? window.__cldGetCatalogModuleDisplayName()
              : String(document.getElementById('catalog-item-edit-name')?.value || '').trim();
          const fromJson = jsonData.name != null && String(jsonData.name).trim();
          // Имя модуля — только «Основные» / module.name, никогда имя детали (полка, бок…).
          const rootLabel = fromCatalog || fromJson || '';
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

        // Clodis JSON: сохраняем "сырое" reference-дерево, если оно приехало в JSON.
        try {
          let ppTree = null;
          if (jsonData.spec && jsonData.spec.template && Array.isArray(jsonData.spec.template.tree)) {
            ppTree = jsonData.spec.template.tree;
            console.log('[CLD][tree-load] 📦 Найден spec.template.tree:', { length: ppTree.length });
          } else if (jsonData.template && Array.isArray(jsonData.template.structure)) {
            ppTree = jsonData.template.structure;
            console.log('[CLD][tree-load] 📦 Найден template.structure:', { length: ppTree.length });
          } else {
            // ⭐ ВАЖНО: Если данных нет в стандартных местах, проверяем legacy формат
            // Это может быть случай, когда данные пришли в формате legacy children (constructor_structure с children)
            console.log('[CLD][tree-load] 🔍 Проверка legacy формата для clodisJSON:', {
              hasJsonDataChildren: !!(jsonData.children && Array.isArray(jsonData.children)),
              jsonDataChildrenLength: jsonData.children && Array.isArray(jsonData.children) ? jsonData.children.length : 0,
              hasSourceChildren: !!(sourceChildren && Array.isArray(sourceChildren)),
              sourceChildrenLength: sourceChildren && Array.isArray(sourceChildren) ? sourceChildren.length : 0,
              hasLegacyChildren,
            });
            
            if (jsonData.children && Array.isArray(jsonData.children) && jsonData.children.length > 0) {
              // Если есть children напрямую в jsonData (legacy формат constructor_structure)
              console.log('[CLD][tree-load] 📦 Используем jsonData.children как clodisJSON (legacy constructor_structure):', { length: jsonData.children.length });
              ppTree = jsonData.children;
            } else if (sourceChildren && Array.isArray(sourceChildren) && sourceChildren.length > 0) {
              // Fallback: используем sourceChildren (уже обработанные данные)
              console.log('[CLD][tree-load] 📦 Используем sourceChildren как clodisJSON (fallback):', { length: sourceChildren.length });
              ppTree = sourceChildren;
            }
          }
          
          if (Array.isArray(ppTree) && ppTree.length > 0) {
            const saved = JSON.parse(JSON.stringify(ppTree));
            rootModule.nodeData.clodisJSON = saved;
            
            // ⭐ КРИТИЧНО: Проверяем сразу после сохранения
            const verifySaved = rootModule.nodeData.clodisJSON;
            const isSaved = Array.isArray(verifySaved) && verifySaved.length > 0;
            
            console.log('[CLD][tree-load] ✅ clodisJSON сохранён в rootModule.nodeData:', {
              count: ppTree.length,
              firstItem: ppTree[0] ? { type: ppTree[0].type, name: ppTree[0].name } : null,
              rootModuleId: rootModule.id,
              hasNodeData: !!rootModule.nodeData,
              savedCount: Array.isArray(verifySaved) ? verifySaved.length : 0,
              isSaved,
            });
            
            // Убеждаемся, что данные действительно сохранены
            if (!isSaved) {
              console.error('[CLD][tree-load] ❌❌❌ КРИТИЧЕСКАЯ ОШИБКА: clodisJSON НЕ СОХРАНИЛСЯ!', {
                savedType: typeof verifySaved,
                savedLength: Array.isArray(verifySaved) ? verifySaved.length : 'not array',
                ppTreeLength: ppTree.length,
                savedLength: saved.length,
                rootModuleNodeDataKeys: rootModule.nodeData ? Object.keys(rootModule.nodeData).slice(0, 10) : [],
              });
            } else {
              // Проверяем, что данные доступны для JSON вкладки
              console.log('[CLD][tree-load] ✅✅✅ clodisJSON УСПЕШНО СОХРАНЁН! Доступен для JSON вкладки:', {
                count: verifySaved.length,
                canAccess: !!verifySaved,
                firstItem: verifySaved[0] ? { type: verifySaved[0].type, name: verifySaved[0].name } : null,
              });
              
              // ⭐ КРИТИЧНО: Уведомляем JSON вкладку о том, что данные готовы
              // Это решает проблему тайминга, когда JSON вкладка открывается до завершения загрузки
              try {
                const event = new CustomEvent('cld:clodisJSONReady', { 
                  detail: { count: verifySaved.length } 
                });
                window.dispatchEvent(event);
                console.log('[CLD][tree-load] 📢 Событие cld:clodisJSONReady отправлено для JSON вкладки');
              } catch (e) {
                console.warn('[CLD][tree-load] Не удалось отправить событие:', e);
              }
            }
          } else {
            console.warn('[CLD][tree-load] ⚠️ clodisJSON НЕ НАЙДЕН в jsonData:', {
              hasSpecTemplateTree: !!(jsonData.spec?.template?.tree),
              hasTemplateStructure: !!(jsonData.template?.structure),
              specTemplateTreeIsArray: Array.isArray(jsonData.spec?.template?.tree),
              templateStructureIsArray: Array.isArray(jsonData.template?.structure),
              hasSourceChildren: !!(sourceChildren && Array.isArray(sourceChildren)),
              sourceChildrenLength: sourceChildren && Array.isArray(sourceChildren) ? sourceChildren.length : 0,
              jsonDataKeys: Object.keys(jsonData || {}).slice(0, 15),
            });
          }
        } catch (e) {
          console.error('[CLD][tree-load] ❌ ОШИБКА при сохранении clodisJSON:', e?.message || e, e?.stack);
        }
      }
      // ⭐ КРИТИЧНО: Всегда конвертируем через templateItemToNodeData, если данные из template.structure
      // (формат Clodis: wall/section), чтобы они стали UI-узлами (detail/section).
      // Если hasLegacyChildren=true, это старые данные в формате UI, но они могут быть неполными.
      // Поэтому всегда конвертируем через templateItemToNodeData для единообразия.
      const childrenForLoad = hasNewStructure
        ? sourceChildren.map(templateItemToNodeData).filter(Boolean)
        : (hasLegacyChildren
          ? sourceChildren
          : []);

      childrenForLoad.forEach(childData => {
        const newNode = createNodeFromData(childData, rootModule);
        // Обновляем панель свойств для каждого узла после создания
        if (newNode && typeof updateConstructorPropertiesPanel === 'function') {
          // Сохраняем данные узла перед обновлением панели
          if (newNode.nodeData) {
            // Заполняем панель свойств данными узла
            updateConstructorPropertiesPanel(newNode);
          }
        }
      });

      // ⭐ ВАЖНО: После загрузки всех узлов из сохраненного модуля синхронизируем превью,
      // чтобы детали появились в 3D-сцене. Без этого превью остаётся пустым.
      // Используем requestAnimationFrame + setTimeout для гарантии, что DOM полностью обновлён.
      requestAnimationFrame(() => {
        setTimeout(() => {
          const childrenContainer = document.getElementById('constructor-root-module-children');
          const domNodes = childrenContainer ? childrenContainer.querySelectorAll('.constructor-tree-node') : [];
          
          if (window.__CLD_DEBUG) {
            console.log('[CLD][tree-load] Загружено узлов:', {
              childrenForLoadCount: childrenForLoad.length,
              domNodesCount: domNodes.length,
              hasPostModule: typeof window.__ppPostModuleToIframe === 'function',
              hasBuildTree: typeof window.__ppBuildClodisTemplateTreeFromDom === 'function',
              hasBuildPreviewTree: typeof window.__cldBuildPreviewTree === 'function',
            });
          }

          // Проверяем, что DOM-узлы действительно созданы перед синхронизацией
          if (domNodes.length === 0 && childrenForLoad.length > 0) {
            console.warn('[CLD][tree-load] ⚠️ DOM-узлы не созданы, но данные есть. Повторная попытка через 300мс...');
            setTimeout(() => {
              if (typeof window.__ppPostModuleToIframe === 'function') {
                try {
                  window.__ppPostModuleToIframe();
                  if (window.__CLD_DEBUG) {
                    console.log('[CLD][tree-load] Превью синхронизировано (повторная попытка)');
                  }
                } catch (e) {
                  console.error('[CLD][tree-load] Ошибка синхронизации превью (повторная попытка):', e);
                }
              }
            }, 300);
            return;
          }
          
          // Синхронизируем превью после загрузки всех узлов
          if (typeof window.__ppPostModuleToIframe === 'function') {
            try {
              window.__ppPostModuleToIframe();
              if (window.__CLD_DEBUG) {
                console.log('[CLD][tree-load] Превью синхронизировано после загрузки дерева', {
                  domNodesCount: domNodes.length,
                });
              }
            } catch (e) {
              console.error('[CLD][tree-load] Ошибка синхронизации превью:', e);
            }
          } else {
            console.warn('[CLD][tree-load] ⚠️ __ppPostModuleToIframe не найдена');
          }

          // Восстанавливаем выделение панели свойств
          if (prevSelectedId) {
            const nodes = document.querySelectorAll('.constructor-tree-node');
            const restored = Array.from(nodes).find((n) => String(n.getAttribute('data-node-id')) === String(prevSelectedId));
            if (restored) {
              currentSelectedNode = restored;
              console.log('[CLD][tree-load] ✅ restored selected node', {
                prevSelectedId,
                restoredSelectedId: restored.getAttribute('data-node-id') || restored.nodeData?.id || ''
              });
              if (typeof selectTreeNode === 'function') selectTreeNode(restored);
              else if (typeof updateConstructorPropertiesPanel === 'function') updateConstructorPropertiesPanel(restored);
            } else {
              console.log('[CLD][tree-load] ⚠️ could not restore selected node', { prevSelectedId });
            }
          }
        }, 100);
      });
      
    }
    
    // Экспортируем функции для использования в других местах
    window.getConstructorTreeJSON = getConstructorTreeJSON;
    window.loadConstructorTreeFromJSON = loadConstructorTreeFromJSON;

    // 3D превью: референсный движок монтируем безопасно (через iframe), чтобы не вешать всю страницу
    if (typeof window.ensureClodisPreviewMounted === 'function') window.ensureClodisPreviewMounted();
    // Синхронизируем превью после инициализации (размеры + дерево)
    if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();

    // Дебаунс синхронизации по изменению размеров (как в референсе — с задержкой)
    const wIn = document.getElementById('catalog-item-width');
    const hIn = document.getElementById('catalog-item-height');
    const dIn = document.getElementById('catalog-item-depth');
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

      }

  window.initConstructorTab = function initConstructorTab() {
    // В admin-new.html бандл владеет деревом/меню (Копировать/Вставить).
    // Legacy init вешал stub «Вставить будет позже» и мог перехватить флаг раньше бандла.
    if (window.__CLD_DISABLE_LEGACY_PANEL_UI) {
      if (typeof window.__cldInitConstructorTab === 'function') {
        return window.__cldInitConstructorTab();
      }
      console.warn('[CLD] Bundle constructor not ready; skip legacy tree init');
      return;
    }
    return (async function () {
      try {
        if (window.ClodisDrillRegistry && typeof window.ClodisDrillRegistry.ensureLoaded === 'function') {
          await window.ClodisDrillRegistry.ensureLoaded();
        }
      } catch (e) {
        console.warn('[CLD][drill-registry] ensureLoaded:', e);
      }
      initConstructorTabImpl();
    })();
  };

  // Заполняем select типов при загрузке (референс: item_types_names)
  function populateAddModalTypeSelect() {
    const typeSelect = document.getElementById('constructor-add-modal-type');
    if (!typeSelect) return false;
    typeSelect.innerHTML = '';
    Object.keys(TYPE_NAMES).forEach(function(k) {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = TYPE_NAMES[k];
      typeSelect.appendChild(opt);
    });
    return true;
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(populateAddModalTypeSelect, 100);
    });
  } else {
    setTimeout(populateAddModalTypeSelect, 100);
  }

  // Патч: если селект групп пуст — заполняем; также синхронизируем толщину при выборе материала
  // Фолбэки групп материалов на случай, если /data/materials_groups.json не подгрузился.
  // Здесь сразу задаём и material, и allowed_keys, чтобы по группе выбирался правильный тип.
  const FALLBACK_GROUPS = [
    { key: 'g0', name: 'Корпус', material: 'ldsp', thickness: 16, allowed_keys: ['material_2'] },
    { key: 'g1', name: 'Задняя стенка', material: 'hdf', thickness: 3, allowed_keys: ['material_3'] },
    { key: 'g2', name: 'Фасады 18', material: 'ldsp', thickness: 18, allowed_keys: ['material_2'] },
    { key: 'g3', name: 'Фасады 16', material: 'ldsp', thickness: 16, allowed_keys: ['material_2'] },
  ];
  function syncThicknessFromSelectedMaterial() {
    const sel = document.querySelector('.constructor-tree-item-selected')?.closest('.constructor-tree-node');
    const nd = sel?.nodeData;
    if (!nd?.material_id || !nd?.material_key) return;
    const lib = window.__cldMaterialsLib;
    const items = lib?.itemsByKey?.[nd.material_key];
    const item = Array.isArray(items) ? items.find((x) => String(x.id) === String(nd.material_id)) : null;
    const thickness = Number(item?.thickness ?? item?.height ?? item?.size?.z ?? item?.size_z ?? '');
    if (!Number.isFinite(thickness)) return;
    const gk = document.getElementById('catalog-constructor-property-material-group')?.value || nd.material_group || 'g0';
    const thickIn = document.getElementById('catalog-constructor-property-material-thickness');
    if (thickIn && Number(thickIn.value) !== thickness) {
      thickIn.value = String(thickness);
      const ov = window.__cldMaterialsState?.groupOverrides || {};
      if (!ov[gk] || ov[gk].thickness !== thickness) {
        window.__cldMaterialsState = window.__cldMaterialsState || { groupOverrides: {} };
        window.__cldMaterialsState.groupOverrides[gk] = { ...(window.__cldMaterialsState.groupOverrides[gk] || {}), thickness };
      }
    }
  }
  function patchEmptyGroupSelect() {
    const sel = document.getElementById('catalog-constructor-property-material-group');
    if (!sel || sel.options.length >= 3) return;
    if (window.__CLD_DEBUG) console.log('[CLD][material][patch] заполняем', { options: sel.options.length });
    const prev = sel.value;
    sel.innerHTML = '';
    for (const g of FALLBACK_GROUPS) {
      const opt = document.createElement('option');
      opt.value = g.key;
      opt.textContent = g.name + ' (' + g.key + ')';
      sel.appendChild(opt);
    }
    if (FALLBACK_GROUPS.some((x) => x.key === prev)) sel.value = prev;
    else sel.value = 'g0';
    syncThicknessFromSelectedMaterial();
  }
  function schedulePatch() {
    [500, 1500, 3500, 6000].forEach((ms) => setTimeout(patchEmptyGroupSelect, ms));
  }
  if (document.readyState === 'complete') schedulePatch();
  else window.addEventListener('load', schedulePatch);
  // Наблюдатель: вкладка "Конструктор" может подгружаться при клике
  let patchDebounce = 0;
  const ob = new MutationObserver(() => {
    if (Date.now() - patchDebounce < 800) return;
    patchDebounce = Date.now();
    setTimeout(patchEmptyGroupSelect, 100);
  });
  if (document.body) ob.observe(document.body, { childList: true, subtree: true });
  // Периодически восстанавливаем селект — admin-new очищает его после нашего патча
  setInterval(patchEmptyGroupSelect, 4000);

  // Оборачиваем __cldBuildMaterialsPayload: логирование + гарантия g1/g2/g3 в payload
  // (admin-new может использовать lib.groups с 1 элементом — тогда g1/g2/g3 не попадают)
  const MATERIAL_FALLBACK = {
    g1: { thickness: 3, material: 'hdf' },
    g2: { thickness: 18, material: 'ldsp' },
    g3: { thickness: 16, material: 'ldsp' },
  };
  function wrapBuildMaterialsPayloadWithLog() {
    const fn = window.__cldBuildMaterialsPayload;
    if (typeof fn === 'function' && !fn.__cldLogWrapped) {
      const orig = fn;
      window.__cldBuildMaterialsPayload = function __cldBuildMaterialsPayloadWrapped() {
        const r = orig.apply(this, arguments);
        if (r && r.materials) {
          const lib = window.__cldMaterialsLib;
          const ov = window.__cldMaterialsState?.groupOverrides || {};
          const g0Thickness = r.materials?.g0?.thickness ?? 16;
          for (const [gk, def] of Object.entries(MATERIAL_FALLBACK)) {
            const exists = r.materials[gk] && r.materials[gk].thickness != null;
            const wrongDefault = r.materials[gk]?.thickness === 16;
            if (!exists || (gk === 'g1' && wrongDefault)) {
              const groupDef = (lib?.groups || []).find((g) => g && g.key === gk);
              const ovk = ov[gk] || {};
              let thickness;
              if (gk === 'g1') {
                thickness = (ovk.thickness ?? groupDef?.thickness ?? def.thickness);
                if (thickness === 16) thickness = 3;
              } else {
                thickness = ovk.thickness ?? groupDef?.thickness ?? def.thickness ?? g0Thickness ?? 16;
              }
              thickness = Number(thickness);
              r.materials[gk] = r.materials[gk] || {};
              r.materials[gk].thickness = Number.isFinite(thickness)
                ? thickness
                : (gk === 'g1' ? 3 : (def.thickness ?? g0Thickness));
              const matKey = ovk.material_key || groupDef?.material || def.material;
              r.materials[gk].material = r.materials[gk].material && r.materials[gk].material.key
                ? r.materials[gk].material
                : { key: matKey, id: ovk.material_id || 0, variant_id: 0 };
              if (window.__CLD_DEBUG) console.log('[CLD][thickness-dbg] добавлен fallback', gk, 'thickness=', r.materials[gk].thickness);
            }
          }
        }
        r.vars = r.vars || {};
        r.vars._wt = Number(r.materials?.g0?.thickness ?? r.vars?._wt ?? 16) || 16;
        if (window.__CLD_DEBUG) console.log('[CLD][thickness-dbg] __cldBuildMaterialsPayload result', {
          g0: r?.materials?.g0?.thickness,
          g1: r?.materials?.g1?.thickness,
          g2: r?.materials?.g2?.thickness,
          g3: r?.materials?.g3?.thickness,
          vars_wt: r.vars?._wt,
        });
        return r;
      };
      window.__cldBuildMaterialsPayload.__cldLogWrapped = true;
    }
  }
  [100, 800, 2500].forEach((ms) => setTimeout(wrapBuildMaterialsPayloadWithLog, ms));
  setInterval(wrapBuildMaterialsPayloadWithLog, 3000);
})();
