/**
 * Утилита для загрузки модулей из Clodis через API
 * 
 * Использование:
 * 1. Откройте консоль браузера на странице админки (например, localhost:8000/admin-new.html)
 * 2. Выполните команду для загрузки модулей:
 *    - loadModulesFromClodisAPI('http://your-server', [89, 88, 9])
 *    - или loadModulesFromLocalStorage() для загрузки из localStorage
 * 3. Скопируйте вывод JSON и сохраните в файл или вставьте в db.json
 */

/**
 * Загружает модули из Clodis API
 * @param {string} baseUrl - Базовый URL Clodis (например, 'http://localhost:3001')
 * @param {number[]} moduleIds - Массив ID модулей для загрузки
 */
async function loadModulesFromClodisAPI(baseUrl, moduleIds) {
  console.log('🔄 Загрузка модулей из Clodis API:', { baseUrl, moduleIds });
  
  const modules = [];
  
  for (const id of moduleIds) {
    try {
      const response = await fetch(`${baseUrl}/catalog/items_get/${id}`);
      if (!response.ok) {
        console.warn(`⚠️ Модуль ${id} не найден:`, response.statusText);
        continue;
      }
      
      const data = await response.json();
      console.log(`✅ Модуль ${id} загружен:`, data);
      
      // Парсим JSON из поля data
      let clodisJSON = null;
      if (data.data) {
        try {
          const parsed = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
          clodisJSON = parsed.params ? [parsed.params] : (Array.isArray(parsed) ? parsed : [parsed]);
        } catch (e) {
          console.warn(`⚠️ Ошибка парсинга JSON модуля ${id}:`, e);
        }
      }
      
      modules.push({
        id: String(id),
        name: data.name || `Модуль ${id}`,
        type: data.type || 'section',
        elementType: 'section',
        metadata: {
          name: data.name || `Модуль ${id}`,
          type: data.type || 'section',
          size: {
            width: 600,
            height: 720,
            depth: 300
          },
          createdAt: new Date().toISOString(),
          element_type: data.element_type || null
        },
        clodisJSON: clodisJSON
      });
    } catch (error) {
      console.error(`❌ Ошибка загрузки модуля ${id}:`, error);
    }
  }
  
  console.log('📦 Загружено модулей:', modules.length);
  console.log('📋 JSON для сохранения:', JSON.stringify(modules, null, 2));
  
  return modules;
}

/**
 * Загружает модули из localStorage браузера (если они там есть)
 */
function loadModulesFromLocalStorage() {
  console.log('🔄 Загрузка модулей из localStorage...');
  
  const key = 'elementCatalog';
  const json = localStorage.getItem(key);
  
  if (!json) {
    console.warn('⚠️ В localStorage нет данных каталога');
    return [];
  }
  
  try {
    const elements = JSON.parse(json);
    console.log('✅ Загружено элементов из localStorage:', elements.length);
    console.log('📋 Элементы:', elements);
    
    // Фильтруем модули с нужными ID
    const moduleIds = ['89', '88', '9'];
    const modules = elements.filter(el => moduleIds.includes(String(el.id)));
    
    console.log('📦 Найдено модулей:', modules.length);
    console.log('📋 Модули:', JSON.stringify(modules, null, 2));
    
    return modules;
  } catch (error) {
    console.error('❌ Ошибка парсинга localStorage:', error);
    return [];
  }
}

/**
 * Экспортирует модули в формат для db.json
 */
function exportModulesToDBFormat(modules) {
  const dbFormat = {
    catalog_items: modules.map(module => ({
      id: module.id,
      name: module.name,
      type: module.type,
      element_type: module.metadata?.element_type || null,
      data: JSON.stringify({
        params: module.clodisJSON?.[0] || {}
      }),
      category: JSON.stringify([]),
      active: 1,
      order: 10000
    }))
  };
  
  console.log('📋 Формат для db.json:', JSON.stringify(dbFormat, null, 2));
  return dbFormat;
}

// Экспортируем функции для использования в консоли браузера
if (typeof window !== 'undefined') {
  window.loadModulesFromClodisAPI = loadModulesFromClodisAPI;
  window.loadModulesFromLocalStorage = loadModulesFromLocalStorage;
  window.exportModulesToDBFormat = exportModulesToDBFormat;
  
  console.log('✅ Утилиты загружены! Используйте:');
  console.log('  - loadModulesFromClodisAPI("http://your-server", [89, 88, 9])');
  console.log('  - loadModulesFromLocalStorage()');
  console.log('  - exportModulesToDBFormat(modules)');
}


