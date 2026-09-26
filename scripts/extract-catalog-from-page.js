/**
 * Извлечение данных каталога со страницы
 * Выполните: extractCatalogFromPage()
 */

function extractCatalogFromPage() {
  console.log('🔍 Извлечение данных каталога со страницы...\n');
  
  const foundData = [];
  
  // 1. Ищем данные в Vue (если используется)
  console.log('1️⃣ Поиск данных в Vue компонентах:');
  try {
    // Проверяем Vue инстансы
    const vueInstances = [];
    
    // Ищем через document
    const vueElements = document.querySelectorAll('[data-v-], [class*="vue"]');
    console.log(`   Найдено ${vueElements.length} элементов с Vue атрибутами`);
    
    // Проверяем window на наличие Vue
    if (window.Vue) {
      console.log('   ✅ Найден window.Vue');
    }
    if (window.app) {
      console.log('   ✅ Найден window.app');
      try {
        if (window.app.$data) {
          console.log('      Данные:', Object.keys(window.app.$data));
        }
      } catch(e) {}
    }
    
  } catch(e) {
    console.log('   ⚠️ Ошибка при поиске Vue:', e.message);
  }
  
  // 2. Ищем данные в таблице/списке на странице
  console.log('\n2️⃣ Поиск данных в DOM:');
  const tableRows = document.querySelectorAll('tr[data-id], tr[data-item-id], [data-module-id]');
  if (tableRows.length > 0) {
    console.log(`   Найдено ${tableRows.length} строк в таблице`);
    tableRows.forEach((row, i) => {
      try {
        const id = row.getAttribute('data-id') || row.getAttribute('data-item-id') || row.getAttribute('data-module-id');
        const name = row.textContent.trim().substring(0, 100);
        if (id) {
          foundData.push({ id, name, source: 'DOM table' });
        }
      } catch(e) {}
    });
  }
  
  // 3. Ищем через Network - последние запросы
  console.log('\n3️⃣ Инструкции для Network:');
  console.log('   📋 Переключитесь на вкладку "Сеть" (Network)');
  console.log('   📋 Нажмите на фильтр "Fetch/XHR"');
  console.log('   📋 В поле "Фильтр" введите: catalog или items');
  console.log('   📋 Найдите запрос, который загружает список модулей');
  console.log('   📋 Кликните на него → вкладка "Response"');
  console.log('   📋 Скопируйте JSON');
  
  // 4. Попытка найти данные через анализ страницы
  console.log('\n4️⃣ Попытка извлечь данные из JavaScript переменных:');
  
  // Ищем все скрипты на странице
  const scripts = Array.from(document.querySelectorAll('script:not([src])'));
  for (const script of scripts) {
    const code = script.textContent;
    // Ищем паттерны с данными каталога
    if (code.includes('catalog') || code.includes('module') || code.includes('items')) {
      // Пытаемся найти переменные с данными
      const varMatches = code.match(/(?:var|let|const|this\.)\s*(\w+)\s*=\s*(\[[\s\S]{100,}?\])/g);
      if (varMatches) {
        console.log('   ✅ Найдены переменные с массивами в скрипте');
        varMatches.forEach(match => {
          console.log('      ', match.substring(0, 100) + '...');
        });
      }
    }
  }
  
  // 5. Попытка получить данные через API напрямую
  console.log('\n5️⃣ Попытка получить данные через API:');
  const baseUrl = window.location.origin + window.location.pathname.split('/').slice(0, -2).join('/');
  console.log('   Базовый URL:', baseUrl);
  console.log('   💡 Попробуйте выполнить в консоли:');
  console.log(`      fetch('${baseUrl}/catalog/items/catalog_module').then(r => r.json()).then(d => console.log('Данные:', d))`);
  
  if (foundData.length > 0) {
    console.log(`\n✅ Найдено ${foundData.length} элементов в DOM`);
    return foundData;
  }
  
  return null;
}

/**
 * Получить данные каталога через API
 */
async function fetchCatalogFromAPI() {
  console.log('🌐 Получение данных каталога через API...\n');
  
  try {
    // Пытаемся определить правильный URL
    const currentPath = window.location.pathname;
    const basePath = currentPath.split('/catalog/')[0];
    const apiUrl = `${window.location.origin}${basePath}/catalog/items/catalog_module`;
    
    console.log('📡 Запрос к:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('❌ Ошибка запроса:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    console.log('✅ Данные получены:', data);
    
    if (data && (Array.isArray(data) || data.items || data.data)) {
      console.log('🎉 НАЙДЕН КАТАЛОГ!');
      
      let items = Array.isArray(data) ? data : (data.items || data.data || []);
      
      // Преобразуем в нужный формат
      const catalogItems = items.map((item, index) => {
        let clodisJSON = null;
        
        if (item.data) {
          try {
            const parsed = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
            clodisJSON = parsed.params ? (Array.isArray(parsed.params) ? parsed.params : [parsed.params]) : (Array.isArray(parsed) ? parsed : [parsed]);
          } catch(e) {
            clodisJSON = item.data;
          }
        } else if (item.params) {
          clodisJSON = Array.isArray(item.params) ? item.params : [item.params];
        } else if (item) {
          clodisJSON = [item];
        }
        
        return {
          id: String(item.id || item._id || `item_${index}`),
          name: item.name || item.title || `Элемент ${index}`,
          type: item.type || 'module',
          elementType: item.element_type || item.elementType || 'section',
          metadata: {
            name: item.name || item.title || `Элемент ${index}`,
            type: item.type || 'module',
            createdAt: new Date().toISOString(),
            element_type: item.element_type || item.elementType || null
          },
          clodisJSON: clodisJSON
        };
      });
      
      console.log(`\n✅ Подготовлено ${catalogItems.length} элементов для экспорта`);
      console.log('\n📋 JSON для вставки в db.json:');
      const jsonOutput = JSON.stringify(catalogItems, null, 2);
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
      
      return catalogItems;
    } else {
      console.log('⚠️ Неожиданный формат данных:', data);
      return data;
    }
    
  } catch (error) {
    console.error('❌ Ошибка при получении данных:', error);
    console.log('\n💡 Попробуйте:');
    console.log('   1. Переключиться на вкладку "Сеть" (Network)');
    console.log('   2. Найти запрос, который загружает список модулей');
    console.log('   3. Скопировать JSON из Response вручную');
    return null;
  }
}

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  ИЗВЛЕЧЕНИЕ ДАННЫХ КАТАЛОГА СО СТРАНИЦЫ                     ║
╚══════════════════════════════════════════════════════════════╝

📋 ДОСТУПНЫЕ КОМАНДЫ:

1. extractCatalogFromPage()
   → Ищет данные каталога на текущей странице

2. fetchCatalogFromAPI()
   → Пытается получить данные через API запрос
   → РЕКОМЕНДУЕТСЯ!

🚀 НАЧНИТЕ С: fetchCatalogFromAPI()
`);

