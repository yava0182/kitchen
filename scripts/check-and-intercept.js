/**
 * Проверка и перехват - выполните ПЕРЕД перезагрузкой страницы
 */

// Проверяем, загружен ли скрипт перехвата
if (typeof exportInterceptedCatalog === 'undefined') {
  console.log('⚠️ Скрипт перехвата не загружен!');
  console.log('📋 Загрузите intercept-catalog-requests.js ПЕРЕД перезагрузкой страницы');
} else {
  console.log('✅ Скрипт перехвата загружен');
}

// Загружаем перехватчик заново
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
║  ПЕРЕХВАТ АКТИВИРОВАН                                       ║
╚══════════════════════════════════════════════════════════════╝

✅ Перехват запросов включён!

📋 ЧТО ДЕЛАТЬ:

ВАРИАНТ 1: Перезагрузите страницу
   → Нажмите F5
   → Смотрите консоль на предмет перехваченных запросов

ВАРИАНТ 2: Перейдите на страницу каталога
   → Найдите в меню Clodis раздел "Каталог" или "Модули"
   → Перейдите туда
   → Смотрите консоль

ВАРИАНТ 3: Взаимодействуйте с интерфейсом
   → Кликните на кнопку "Каталог" в интерфейсе
   → Или откройте список модулей
   → Смотрите консоль

💡 Когда увидите "🎉 НАЙДЕН КАТАЛОГ" - выполните:
   exportInterceptedCatalog()
`);

// Функция экспорта
function exportInterceptedCatalog() {
  if (!window._catalogData && interceptedCatalogData.length === 0) {
    console.log('❌ Данные каталога не найдены');
    console.log('💡 Попробуйте:');
    console.log('   1. Перезагрузить страницу (F5)');
    console.log('   2. Перейти на страницу каталога');
    console.log('   3. Кликнуть на элементы каталога в интерфейсе');
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
    catalogItems = dataToExport.map((item, index) => ({
      id: String(item.id || item._id || `item_${index}`),
      name: item.name || item.title || `Элемент ${index}`,
      type: item.type || 'module',
      elementType: item.element_type || item.elementType || 'section',
      metadata: {
        name: item.name || item.title || `Элемент ${index}`,
        type: item.type || 'module',
        createdAt: new Date().toISOString()
      },
      clodisJSON: item.data || item.params || item
    }));
  } else if (dataToExport.items && Array.isArray(dataToExport.items)) {
    catalogItems = dataToExport.items.map((item, index) => ({
      id: String(item.id || item._id || `item_${index}`),
      name: item.name || item.title || `Элемент ${index}`,
      type: item.type || 'module',
      elementType: item.element_type || item.elementType || 'section',
      metadata: {
        name: item.name || item.title || `Элемент ${index}`,
        type: item.type || 'module',
        createdAt: new Date().toISOString()
      },
      clodisJSON: item.data || item.params || item
    }));
  } else {
    console.log('⚠️ Неизвестный формат данных');
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

