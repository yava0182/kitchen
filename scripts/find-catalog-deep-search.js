/**
 * Глубокий поиск данных каталога
 * Выполните: deepSearchCatalog()
 */

function deepSearchCatalog() {
  console.log('🔍 Глубокий поиск данных каталога...\n');
  
  const foundData = [];
  
  // 1. Проверяем ВСЕ ключи localStorage (не только с "catalog")
  console.log('1️⃣ Проверка ВСЕХ ключей localStorage:');
  const allLocalStorageKeys = Object.keys(localStorage);
  console.log(`   Всего ключей: ${allLocalStorageKeys.length}`);
  
  for (const key of allLocalStorageKeys) {
    try {
      const value = localStorage.getItem(key);
      if (value && value.length > 100) { // Игнорируем короткие значения
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Проверяем, похоже ли на каталог
            const firstItem = parsed[0];
            if (firstItem && (firstItem.id || firstItem.name || firstItem.data || firstItem.params)) {
              console.log(`   ✅ Найден массив в ${key}: ${parsed.length} элементов`);
              foundData.push({ source: 'localStorage', key, data: parsed });
            }
          } else if (parsed && typeof parsed === 'object') {
            // Проверяем объекты с массивами
            if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
              console.log(`   ✅ Найден объект с items в ${key}: ${parsed.items.length} элементов`);
              foundData.push({ source: 'localStorage', key, data: parsed.items });
            } else if (parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
              console.log(`   ✅ Найден объект с data в ${key}: ${parsed.data.length} элементов`);
              foundData.push({ source: 'localStorage', key, data: parsed.data });
            }
          }
        } catch(e) {
          // Не JSON
        }
      }
    } catch(e) {}
  }
  
  // 2. Проверяем sessionStorage
  console.log('\n2️⃣ Проверка sessionStorage:');
  try {
    const sessionKeys = Object.keys(sessionStorage);
    console.log(`   Всего ключей: ${sessionKeys.length}`);
    for (const key of sessionKeys) {
      try {
        const value = sessionStorage.getItem(key);
        if (value && value.length > 100) {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const firstItem = parsed[0];
              if (firstItem && (firstItem.id || firstItem.name || firstItem.data)) {
                console.log(`   ✅ Найден массив в sessionStorage.${key}: ${parsed.length} элементов`);
                foundData.push({ source: 'sessionStorage', key, data: parsed });
              }
            }
          } catch(e) {}
        }
      } catch(e) {}
    }
  } catch(e) {
    console.log('   ⚠️ Не удалось проверить sessionStorage');
  }
  
  // 3. Проверяем глобальные переменные более тщательно
  console.log('\n3️⃣ Проверка глобальных переменных:');
  const suspiciousKeys = Object.keys(window).filter(k => {
    try {
      const obj = window[k];
      return obj && typeof obj === 'object' && !Array.isArray(obj) && Object.keys(obj).length > 0;
    } catch(e) {
      return false;
    }
  });
  
  console.log(`   Проверяю ${Math.min(suspiciousKeys.length, 50)} переменных...`);
  for (const key of suspiciousKeys.slice(0, 50)) {
    try {
      const obj = window[key];
      if (obj && typeof obj === 'object') {
        // Проверяем наличие catalogs или modules
        if (obj.catalogs || obj.modules || obj.items) {
          console.log(`   ✅ Подозрительная переменная: window.${key}`);
          if (obj.catalogs) {
            console.log(`      window.${key}.catalogs найден!`);
            foundData.push({ source: 'window', path: `${key}.catalogs`, data: obj.catalogs });
          }
          if (obj.modules) {
            console.log(`      window.${key}.modules найден!`);
            foundData.push({ source: 'window', path: `${key}.modules`, data: obj.modules });
          }
        }
      }
    } catch(e) {}
  }
  
  // 4. Проверяем данные в DOM (data-атрибуты, JSON в скриптах)
  console.log('\n4️⃣ Проверка данных в DOM:');
  const jsonScripts = document.querySelectorAll('script[type="application/json"], script:not([src])');
  console.log(`   Найдено ${jsonScripts.length} скриптов для проверки`);
  for (const script of jsonScripts) {
    try {
      const text = script.textContent.trim();
      if (text && (text.startsWith('{') || text.startsWith('[')) && text.length > 100) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const firstItem = parsed[0];
          if (firstItem && (firstItem.id || firstItem.name || firstItem.data)) {
            console.log('   ✅ Найден JSON в скрипте!');
            foundData.push({ source: 'DOM', data: parsed });
          }
        } else if (parsed && typeof parsed === 'object' && (parsed.items || parsed.data)) {
          console.log('   ✅ Найден JSON объект в скрипте!');
          foundData.push({ source: 'DOM', data: parsed.items || parsed.data });
        }
      }
    } catch(e) {}
  }
  
  // Результаты
  console.log('\n' + '='.repeat(60));
  console.log('📊 РЕЗУЛЬТАТЫ ПОИСКА:');
  console.log('='.repeat(60));
  
  if (foundData.length > 0) {
    console.log(`✅ Найдено ${foundData.length} источников данных!`);
    foundData.forEach((item, i) => {
      console.log(`\n${i + 1}. Источник: ${item.source}`);
      if (item.key) console.log(`   Ключ: ${item.key}`);
      if (item.path) console.log(`   Путь: ${item.path}`);
      if (Array.isArray(item.data)) {
        console.log(`   Элементов: ${item.data.length}`);
        if (item.data.length > 0) {
          console.log(`   Пример первого элемента:`, Object.keys(item.data[0]));
        }
      }
    });
    
    // Сохраняем для экспорта
    window._foundCatalogSources = foundData;
    console.log('\n💾 Данные сохранены в window._foundCatalogSources');
    console.log('📋 Выполните: exportFoundCatalogData() для экспорта');
    
    return foundData;
  } else {
    console.log('❌ Данные каталога не найдены в стандартных местах');
    console.log('\n💡 ВОЗМОЖНЫЕ РЕШЕНИЯ:');
    console.log('   1. Данные загружаются динамически через API');
    console.log('   2. Нужно перехватить запросы при загрузке страницы');
    console.log('   3. Или данные доступны только на другой странице');
    console.log('\n📋 Попробуйте:');
    console.log('   - Загрузить скрипт intercept-catalog-requests.js');
    console.log('   - Обновить страницу (F5)');
    console.log('   - Или перейти на страницу со списком модулей');
    
    return null;
  }
}

/**
 * Экспорт найденных данных
 */
function exportFoundCatalogData() {
  if (!window._foundCatalogSources || window._foundCatalogSources.length === 0) {
    console.log('❌ Нет найденных данных. Выполните сначала: deepSearchCatalog()');
    return null;
  }
  
  console.log('📦 Экспорт найденных данных...\n');
  
  const allItems = [];
  
  for (const source of window._foundCatalogSources) {
    if (Array.isArray(source.data)) {
      source.data.forEach(item => {
        if (item && (item.id || item._id || item.data)) {
          let clodisJSON = null;
          
          // Извлекаем clodisJSON
          if (item.data) {
            try {
              const data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
              clodisJSON = data.params ? (Array.isArray(data.params) ? data.params : [data.params]) : (Array.isArray(data) ? data : [data]);
            } catch(e) {
              clodisJSON = item.data;
            }
          } else if (item.params) {
            clodisJSON = Array.isArray(item.params) ? item.params : [item.params];
          } else if (item) {
            clodisJSON = [item];
          }
          
          allItems.push({
            id: String(item.id || item._id || `item_${allItems.length}`),
            name: item.name || item.title || `Элемент ${allItems.length}`,
            type: item.type || 'module',
            elementType: item.element_type || item.elementType || 'section',
            metadata: {
              name: item.name || item.title || `Элемент ${allItems.length}`,
              type: item.type || 'module',
              createdAt: new Date().toISOString(),
              element_type: item.element_type || item.elementType || null
            },
            clodisJSON: clodisJSON
          });
        }
      });
    }
  }
  
  if (allItems.length === 0) {
    console.log('❌ Не удалось извлечь элементы из найденных данных');
    console.log('📋 Показываю найденные данные для ручного анализа:');
    console.log(window._foundCatalogSources);
    return null;
  }
  
  console.log(`✅ Подготовлено ${allItems.length} элементов для экспорта`);
  console.log('\n📋 JSON для вставки в db.json:');
  const jsonOutput = JSON.stringify(allItems, null, 2);
  console.log(jsonOutput);
  
  // Копируем в буфер обмена
  if (navigator.clipboard) {
    navigator.clipboard.writeText(jsonOutput).then(() => {
      console.log('\n✅ ✅ ✅ JSON скопирован в буфер обмена!');
      console.log('📝 Вставьте его в db.json в поле "catalog_items"');
    }).catch(err => {
      console.log('⚠️ Не удалось скопировать автоматически');
      console.log('📋 Скопируйте JSON вручную из консоли');
    });
  }
  
  return allItems;
}

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  ГЛУБОКИЙ ПОИСК ДАННЫХ КАТАЛОГА                            ║
╚══════════════════════════════════════════════════════════════╝

📋 ДОСТУПНЫЕ КОМАНДЫ:

1. deepSearchCatalog()
   → Ищет данные каталога во всех возможных местах
   → Проверяет localStorage, sessionStorage, window, DOM

2. exportFoundCatalogData()
   → Экспортирует найденные данные
   → Выполните после deepSearchCatalog()

🚀 НАЧНИТЕ С: deepSearchCatalog()
`);

