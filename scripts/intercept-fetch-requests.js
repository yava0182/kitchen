/**
 * Скрипт для перехвата fetch запросов в Clodis
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * 1. Откройте консоль на странице Clodis
 * 2. Вставьте этот скрипт
 * 3. Перезагрузите страницу
 * 4. Откройте каталог элементов в интерфейсе
 * 5. Смотрите данные в консоли
 */

console.log('🔍 Включаю перехват fetch запросов...\n');

// Сохраняем оригинальный fetch
const originalFetch = window.fetch;

// Перехватываем все fetch запросы
window.fetch = function(...args) {
  const url = args[0];
  const options = args[1] || {};
  
  // Проверяем, это запрос к каталогу?
  if (typeof url === 'string' && url.includes('/catalog/')) {
    console.log('📡 Запрос к каталогу:', url);
    
    // Выполняем оригинальный запрос
    return originalFetch.apply(this, args)
      .then(response => {
        // Клонируем response для чтения
        const clonedResponse = response.clone();
        
        // Пытаемся прочитать JSON
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          clonedResponse.json()
            .then(data => {
              console.log(`✅ Ответ от ${url}:`);
              
              // Если это get_all_data_for_catalog_item - это ВСЕ данные!
              if (url.includes('get_all_data_for_catalog_item')) {
                console.log('🎯 НАЙДЕНЫ ВСЕ ДАННЫЕ!');
                console.log('\n📦 Структура данных:');
                console.log('  - modules_groups:', data.modules_groups ? '✅ есть' : '❌ нет');
                console.log('  - default_settings:', data.default_settings ? '✅ есть' : '❌ нет');
                console.log('  - material_types:', data.material_types ? '✅ есть' : '❌ нет');
                console.log('  - catalogs_keys:', data.catalogs_keys ? '✅ есть' : '❌ нет');
                console.log('  - global_vars:', data.global_vars ? '✅ есть' : '❌ нет');
                console.log('  - catalogs_by_key:', data.catalogs_by_key ? '✅ есть' : '❌ нет');
                
                // Извлекаем нужные данные
                const extracted = {
                  modules_groups: data.modules_groups || null,
                  default_settings: data.default_settings?.[0]?.data 
                    ? JSON.parse(data.default_settings[0].data) 
                    : null,
                  material_types: data.material_types || null,
                  catalogs_keys: data.catalogs_keys || null,
                  global_vars: data.global_vars?.value 
                    ? JSON.parse(data.global_vars.value) 
                    : null,
                  catalogs_by_key: data.catalogs_by_key || null
                };
                
                console.log('\n📋 ИЗВЛЕЧЕННЫЕ ДАННЫЕ:');
                console.log(JSON.stringify(extracted, null, 2));
                
                // Сохраняем в глобальную переменную для доступа
                window.__extractedClodisData = extracted;
                console.log('\n✅ Данные сохранены в window.__extractedClodisData');
                console.log('   Используйте: JSON.stringify(window.__extractedClodisData, null, 2)');
              }
              
              // Если это items_list - список элементов
              if (url.includes('items_list')) {
                const elementType = url.split('/').pop();
                console.log(`📋 Список элементов типа "${elementType}":`, data.items?.length || 0, 'элементов');
                if (data.items && data.items.length > 0) {
                  console.log('   Первый элемент:', data.items[0]);
                }
              }
              
              // Если это items_get - детали элемента
              if (url.includes('items_get') && !url.includes('items_list')) {
                const elementId = url.split('/').pop();
                console.log(`📦 Детали элемента ID "${elementId}":`, data.item?.name || 'нет названия');
              }
            })
            .catch(err => {
              console.warn('⚠️ Не удалось прочитать JSON:', err);
            });
        } else if (!response.ok) {
          console.warn(`❌ Ошибка ${response.status} для ${url}`);
        }
        
        return response;
      })
      .catch(error => {
        console.error(`❌ Ошибка запроса к ${url}:`, error);
        throw error;
      });
  }
  
  // Для всех остальных запросов - выполняем как обычно
  return originalFetch.apply(this, args);
};

console.log('✅ Перехват включен!');
console.log('\n📝 ИНСТРУКЦИЯ:');
console.log('1. Перезагрузите страницу (F5)');
console.log('2. Откройте каталог элементов в интерфейсе Clodis');
console.log('3. Смотрите данные в консоли');
console.log('4. После получения данных используйте:');
console.log('   JSON.stringify(window.__extractedClodisData, null, 2)');

// Также перехватываем XMLHttpRequest (на случай, если используется)
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method, url, ...args) {
  this._url = url;
  return originalXHROpen.apply(this, [method, url, ...args]);
};

XMLHttpRequest.prototype.send = function(...args) {
  if (this._url && this._url.includes('/catalog/')) {
    console.log('📡 XMLHttpRequest к каталогу:', this._url);
    
    this.addEventListener('load', function() {
      if (this.status === 200 && this.responseText) {
        try {
          const data = JSON.parse(this.responseText);
          console.log(`✅ XMLHttpRequest ответ от ${this._url}:`, data);
          
          if (this._url.includes('get_all_data_for_catalog_item')) {
            console.log('🎯 НАЙДЕНЫ ВСЕ ДАННЫЕ через XMLHttpRequest!');
            const extracted = {
              modules_groups: data.modules_groups || null,
              default_settings: data.default_settings?.[0]?.data 
                ? JSON.parse(data.default_settings[0].data) 
                : null,
              material_types: data.material_types || null,
              catalogs_keys: data.catalogs_keys || null,
              global_vars: data.global_vars?.value 
                ? JSON.parse(data.global_vars.value) 
                : null,
              catalogs_by_key: data.catalogs_by_key || null
            };
            window.__extractedClodisData = extracted;
            console.log('✅ Данные сохранены в window.__extractedClodisData');
          }
        } catch (e) {
          console.warn('⚠️ Не удалось распарсить ответ:', e);
        }
      }
    });
  }
  
  return originalXHRSend.apply(this, args);
};

console.log('✅ Перехват XMLHttpRequest также включен');

