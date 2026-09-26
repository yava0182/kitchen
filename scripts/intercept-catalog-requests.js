/**
 * Перехват запросов каталога в реальном времени
 * Вставьте этот скрипт и затем взаимодействуйте с интерфейсом
 */

let interceptedCatalogData = [];

// Перехватываем fetch
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  const promise = originalFetch.apply(this, args);
  
  if (typeof url === 'string' && (url.includes('catalog') || url.includes('module') || url.includes('item'))) {
    console.log('🔍 Обнаружен fetch запрос:', url);
    
    promise.then(response => {
      response.clone().json().then(data => {
        console.log('📦 Данные из fetch:', data);
        if (data && (Array.isArray(data) || data.items || data.data)) {
          console.log('🎉 НАЙДЕН КАТАЛОГ В FETCH!');
          interceptedCatalogData.push({ source: 'fetch', url, data });
          window._catalogData = data;
        }
      }).catch(() => {
        response.clone().text().then(text => {
          try {
            const data = JSON.parse(text);
            if (data && (Array.isArray(data) || data.items || data.data)) {
              console.log('🎉 НАЙДЕН КАТАЛОГ В FETCH (текст)!');
              interceptedCatalogData.push({ source: 'fetch', url, data });
              window._catalogData = data;
            }
          } catch(e) {}
        });
      });
    });
  }
  
  return promise;
};

// Перехватываем XMLHttpRequest
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method, url, ...rest) {
  this._method = method;
  this._url = url;
  return originalXHROpen.apply(this, [method, url, ...rest]);
};

XMLHttpRequest.prototype.send = function(...args) {
  if (this._url && (this._url.includes('catalog') || this._url.includes('module') || this._url.includes('item'))) {
    console.log('🔍 Обнаружен XHR запрос:', this._method, this._url);
    
    this.addEventListener('load', function() {
      try {
        const data = JSON.parse(this.responseText);
        console.log('📦 Данные из XHR:', data);
        if (data && (Array.isArray(data) || data.items || data.data)) {
          console.log('🎉 НАЙДЕН КАТАЛОГ В XHR!');
          interceptedCatalogData.push({ source: 'xhr', url: this._url, data });
          window._catalogData = data;
        }
      } catch(e) {
        console.log('⚠️ Ответ не JSON или ошибка парсинга');
      }
    });
  }
  
  return originalXHRSend.apply(this, args);
};

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  ПЕРЕХВАТ ЗАПРОСОВ КАТАЛОГА ВКЛЮЧЁН                        ║
╚══════════════════════════════════════════════════════════════╝

✅ Перехват активен!

📋 ЧТО ДЕЛАТЬ ДАЛЬШЕ:

1. Кликните на кнопку "Каталог" или "Модули" в интерфейсе Clodis
   → Или перейдите в раздел каталога через меню

2. Взаимодействуйте с интерфейсом каталога
   → Прокрутите список модулей
   → Откройте какой-то модуль
   → Любое действие, которое загружает данные

3. Смотрите в консоль - там будут появляться сообщения о найденных данных

4. Когда увидите "🎉 НАЙДЕН КАТАЛОГ" - данные будут в window._catalogData

5. Выполните: exportInterceptedCatalog()
   → Это скопирует данные в нужном формате

💡 Если ничего не появляется:
   → Попробуйте обновить страницу (F5)
   → Или перейти на другую страницу каталога
`);

/**
 * Экспорт перехваченных данных
 */
function exportInterceptedCatalog() {
  if (!window._catalogData && interceptedCatalogData.length === 0) {
    console.log('❌ Данные каталога не найдены');
    console.log('💡 Попробуйте:');
    console.log('   1. Кликнуть на элементы каталога в интерфейсе');
    console.log('   2. Или обновить страницу (F5)');
    return null;
  }
  
  let dataToExport = window._catalogData;
  
  if (!dataToExport && interceptedCatalogData.length > 0) {
    dataToExport = interceptedCatalogData[interceptedCatalogData.length - 1].data;
  }
  
  if (!dataToExport) {
    console.log('❌ Не удалось найти данные для экспорта');
    return null;
  }
  
  console.log('📦 Найденные данные:', dataToExport);
  
  // Преобразуем в нужный формат
  let catalogItems = [];
  
  if (Array.isArray(dataToExport)) {
    catalogItems = dataToExport.map(item => ({
      id: String(item.id || item._id || 'unknown'),
      name: item.name || item.title || 'Без названия',
      type: item.type || 'module',
      elementType: item.element_type || 'section',
      metadata: {
        name: item.name || item.title || 'Без названия',
        type: item.type || 'module',
        createdAt: new Date().toISOString()
      },
      clodisJSON: item.data || item.params || item
    }));
  } else if (dataToExport.items && Array.isArray(dataToExport.items)) {
    catalogItems = dataToExport.items.map(item => ({
      id: String(item.id || item._id || 'unknown'),
      name: item.name || item.title || 'Без названия',
      type: item.type || 'module',
      elementType: item.element_type || 'section',
      metadata: {
        name: item.name || item.title || 'Без названия',
        type: item.type || 'module',
        createdAt: new Date().toISOString()
      },
      clodisJSON: item.data || item.params || item
    }));
  } else {
    console.log('⚠️ Неизвестный формат данных');
    console.log('📋 Попробуйте скопировать данные вручную из window._catalogData');
    return dataToExport;
  }
  
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
}

/**
 * Показать все перехваченные данные
 */
function showInterceptedData() {
  console.log('📊 Перехвачено запросов:', interceptedCatalogData.length);
  interceptedCatalogData.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.source}: ${item.url}`);
    console.log('   Данные:', item.data);
  });
  
  if (window._catalogData) {
    console.log('\n🎯 Текущие данные каталога в window._catalogData:');
    console.log(window._catalogData);
  }
}

