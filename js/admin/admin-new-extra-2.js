    // Функция для обновления названия модуля в конструкторе (как в референсе)
    function updateModuleNameInConstructor() {
      const nameInput = document.getElementById('catalog-item-edit-name');
      const rootModuleText = document.getElementById('constructor-root-module-name');
      
      if (!nameInput || !rootModuleText) return;
      
      const moduleName = nameInput.value.trim();
      if (moduleName) {
        rootModuleText.textContent = moduleName;
      } else {
        rootModuleText.textContent = '(модуль без названия)';
      }
      
      // Обновляем название в 3D-сцене (корневая секция), если доступна функция
      if (window.updateRootSectionName) {
        window.updateRootSectionName(moduleName || 'Корпус');
      }
    }
    
    // Инициализация привязки с учётом того, что форма каталога открывается по hash и рендерится динамически
    (function initCatalogItemNameBinding() {
      function tryAttachNameBinding() {
        const nameInput = document.getElementById('catalog-item-edit-name');
        const rootModuleText = document.getElementById('constructor-root-module-name');
        if (!nameInput || !rootModuleText) return;
        
        // Чтобы не дублировать обработчики
        if (nameInput.__cldNameBindingAttached) return;
        nameInput.__cldNameBindingAttached = true;

        nameInput.addEventListener('input', updateModuleNameInConstructor);
        // Инициализация текущим значением
        updateModuleNameInConstructor();
      }

      // При первом DOMContentLoaded
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
          tryAttachNameBinding();
        });
      } else {
        tryAttachNameBinding();
      }

      // При смене hash (открытие/переключение формы редактирования)
      window.addEventListener('hashchange', function () {
        setTimeout(tryAttachNameBinding, 100);
      });

      // На случай динамического монтирования блока через Vue/JS
      const observer = new MutationObserver(function () {
        tryAttachNameBinding();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    })();

    // Примечание: синхронизация размеров (width/height/depth) с конструктором
    // уже реализована через механизм __ppPostModuleToIframe (см. строки ~19599-19617)
    
    // ===== ОБРАТНАЯ СИНХРОНИЗАЦИЯ: из панели свойств конструктора в поля "Основные" =====
    // Когда меняется имя/размеры корневой секции в конструкторе > обновляем поля "Основные"
    (function initConstructorToMainTabSync() {
      // Флаг, чтобы избежать бесконечных циклов синхронизации
      let isSyncingFromConstructor = false;
      
      // Обратная синхронизация имени: конструктор > "Основные"
      // ВАЖНО: В рефе панель свойств для корневой секции не показывается, поэтому обратная синхронизация не нужна
      // Оставляем функцию на случай, если в будущем понадобится, но она не будет вызываться для корневой секции
      function syncNameFromConstructorToMain() {
        if (isSyncingFromConstructor) return;
        
        const constructorNameInput = document.getElementById('catalog-constructor-property-name');
        const mainNameInput = document.getElementById('catalog-item-edit-name');
        const rootModule = document.getElementById('constructor-root-module');
        
        // Референс: панель свойств для корневой секции скрыта, поэтому обратная синхронизация не нужна
        // Проверяем, что выбрана НЕ корневая секция
        if (!constructorNameInput || !mainNameInput || !rootModule) return;
        
        // Проверяем, что текущий выбранный узел - это НЕ корневая секция
        const selectedNode = document.querySelector('.constructor-tree-item-selected');
        if (!selectedNode || selectedNode.closest('#constructor-root-module') === rootModule) return;
        
        const constructorName = constructorNameInput.value.trim();
        const mainName = mainNameInput.value.trim();
        
        // Обновляем только если значения отличаются (чтобы не создавать цикл)
        if (constructorName !== mainName) {
          isSyncingFromConstructor = true;
          mainNameInput.value = constructorName;
          // Триггерим событие input, чтобы Vue обновил модель (если используется)
          const inputEvent = new Event('input', { bubbles: true });
          mainNameInput.dispatchEvent(inputEvent);
          isSyncingFromConstructor = false;
        }
      }
      
      // Обратная синхронизация размеров: конструктор > "Основные"
      // ВАЖНО: В рефе панель свойств для корневой секции не показывается, поэтому обратная синхронизация не нужна
      // Оставляем функцию на случай, если в будущем понадобится, но она не будет вызываться для корневой секции
      function syncSizeFromConstructorToMain() {
        if (isSyncingFromConstructor) return;
        
        const sizeXInput = document.getElementById('catalog-constructor-property-size-x');
        const sizeYInput = document.getElementById('catalog-constructor-property-size-y');
        const sizeZInput = document.getElementById('catalog-constructor-property-size-z');
        const mainWidthInput = document.getElementById('catalog-item-edit-width');
        const mainHeightInput = document.getElementById('catalog-item-edit-height');
        const mainDepthInput = document.getElementById('catalog-item-edit-depth');
        const rootModule = document.getElementById('constructor-root-module');
        
        if (!sizeXInput || !sizeYInput || !sizeZInput || 
            !mainWidthInput || !mainHeightInput || !mainDepthInput || !rootModule) return;
        
        // Референс: панель свойств для корневой секции скрыта, поэтому обратная синхронизация не нужна
        // Проверяем, что выбрана НЕ корневая секция
        const selectedNode = document.querySelector('.constructor-tree-item-selected');
        if (!selectedNode || selectedNode.closest('#constructor-root-module') === rootModule) return;
        
        // Проверяем, что это секция (не деталь)
        const sizeSection = document.getElementById('catalog-constructor-size-section');
        if (!sizeSection || sizeSection.style.display === 'none') return;
        
        const width = parseFloat(sizeXInput.value);
        const height = parseFloat(sizeYInput.value);
        const depth = parseFloat(sizeZInput.value);
        
        // Проверяем валидность значений
        if (isNaN(width) || isNaN(height) || isNaN(depth) || 
            width < 0 || height < 0 || depth < 0) return;
        
        // Конвертируем из мм в мм (если нужно) - размеры в конструкторе уже в мм
        const mainWidth = parseFloat(mainWidthInput.value) || 0;
        const mainHeight = parseFloat(mainHeightInput.value) || 0;
        const mainDepth = parseFloat(mainDepthInput.value) || 0;
        
        // Обновляем только если значения отличаются
        if (Math.abs(width - mainWidth) > 0.1 || 
            Math.abs(height - mainHeight) > 0.1 || 
            Math.abs(depth - mainDepth) > 0.1) {
          isSyncingFromConstructor = true;
          mainWidthInput.value = Math.round(width);
          mainHeightInput.value = Math.round(height);
          mainDepthInput.value = Math.round(depth);
          
          // Триггерим события для обновления Vue и других обработчиков
          ['input', 'change'].forEach(eventType => {
            mainWidthInput.dispatchEvent(new Event(eventType, { bubbles: true }));
            mainHeightInput.dispatchEvent(new Event(eventType, { bubbles: true }));
            mainDepthInput.dispatchEvent(new Event(eventType, { bubbles: true }));
          });
          
          isSyncingFromConstructor = false;
        }
      }
      
      // Функция для привязки обработчиков к панели свойств конструктора
      function attachConstructorToMainSync() {
        const propertiesPanel = document.getElementById('constructor-properties-panel');
        if (!propertiesPanel) return;
        
        // Обработчик для имени (при изменении или потере фокуса)
        const nameInput = document.getElementById('catalog-constructor-property-name');
        if (nameInput && !nameInput.__cldReverseSyncAttached) {
          nameInput.__cldReverseSyncAttached = true;
          nameInput.addEventListener('blur', syncNameFromConstructorToMain);
          nameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
              syncNameFromConstructorToMain();
            }
          });
        }
        
        // Обработчики для размеров (при изменении или потере фокуса)
        const sizeXInput = document.getElementById('catalog-constructor-property-size-x');
        const sizeYInput = document.getElementById('catalog-constructor-property-size-y');
        const sizeZInput = document.getElementById('catalog-constructor-property-size-z');
        
        [sizeXInput, sizeYInput, sizeZInput].forEach(input => {
          if (input && !input.__cldReverseSyncAttached) {
            input.__cldReverseSyncAttached = true;
            input.addEventListener('blur', syncSizeFromConstructorToMain);
            input.addEventListener('keypress', function(e) {
              if (e.key === 'Enter') {
                syncSizeFromConstructorToMain();
              }
            });
          }
        });
      }
      
      // Инициализация при загрузке и при изменении hash
      function initSync() {
        setTimeout(attachConstructorToMainSync, 200);
      }
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSync);
      } else {
        initSync();
      }
      
      window.addEventListener('hashchange', initSync);
      
      // Также привязываемся при выборе узла в конструкторе (через MutationObserver)
      const observer = new MutationObserver(function() {
        attachConstructorToMainSync();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    })();
