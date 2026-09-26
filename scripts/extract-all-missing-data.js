/**
 * Комплексный скрипт для извлечения всех недостающих данных из Clodis
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * 1. Откройте консоль браузера на сайте Clodis (/constructor/ или /catalog/)
 * 2. Скопируйте и вставьте этот скрипт
 * 3. Выполните extractAllMissingData()
 * 4. После завершения выполните saveAllMissingData() для сохранения в файл
 */

console.log('🚀 Загружаю скрипт для извлечения всех недостающих данных...\n');

// Сохраняем оригинальный fetch для перехвата
const originalFetch = window.fetch;
let interceptedData = {};

// Перехватываем fetch запросы
window.fetch = function(...args) {
  const url = args[0];
  
  if (typeof url === 'string' && url.includes('/catalog/')) {
    return originalFetch.apply(this, args)
      .then(response => {
        const clonedResponse = response.clone();
        
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          clonedResponse.json()
            .then(data => {
              // Сохраняем данные по типу запроса
              if (url.includes('items_get/default_settings')) {
                interceptedData.default_settings = data;
                console.log('✅ Перехвачено: default_settings');
              } else if (url.includes('items_get/modules_groups')) {
                interceptedData.modules_groups = data;
                console.log('✅ Перехвачено: modules_groups');
              } else if (url.includes('items_get/material_types')) {
                interceptedData.material_types = data;
                console.log('✅ Перехвачено: material_types');
              } else if (url.includes('items_list/')) {
                const elementType = url.split('/').pop();
                if (!interceptedData.catalogs_by_type) {
                  interceptedData.catalogs_by_type = {};
                }
                interceptedData.catalogs_by_type[elementType] = data;
                console.log(`✅ Перехвачено: каталог ${elementType} (${data.items?.length || 0} элементов)`);
              }
            })
            .catch(() => {});
        }
        
        return response;
      });
  }
  
  return originalFetch.apply(this, args);
};

/**
 * Извлечь все недостающие данные
 */
async function extractAllMissingData() {
  console.log('🔍 Начинаю извлечение всех недостающих данных...\n');
  
  const results = {
    modules_groups: null,
    default_settings: null,
    material_types: null,
    catalogs_by_type: {}
  };
  
  // 1. Ищем в глобальных переменных
  console.log('📦 Шаг 1: Поиск в глобальных переменных...');
  
  if (window.pp && window.pp.libs && window.pp.libs.modules_groups) {
    results.modules_groups = window.pp.libs.modules_groups;
    console.log('✅ modules_groups найден в pp.libs.modules_groups');
  } else if (typeof modules_groups !== 'undefined') {
    results.modules_groups = modules_groups;
    console.log('✅ modules_groups найден в глобальной переменной');
  }
  
  if (typeof defaults_data !== 'undefined') {
    results.default_settings = defaults_data;
    console.log('✅ default_settings найден в defaults_data');
  } else if (window.pp && window.pp.defaults_data) {
    results.default_settings = window.pp.defaults_data;
    console.log('✅ default_settings найден в pp.defaults_data');
  }
  
  if (typeof material_types !== 'undefined') {
    results.material_types = material_types;
    console.log('✅ material_types найден в глобальной переменной');
  }
  
  // 2. Пытаемся получить через API
  console.log('\n📡 Шаг 2: Запросы к API...');
  
  const apiEndpoints = [
    { key: 'modules_groups', url: '/catalog/items_get/modules_groups' },
    { key: 'default_settings', url: '/catalog/items_get/default_settings' },
    { key: 'material_types', url: '/catalog/items_get/material_types' }
  ];
  
  for (const endpoint of apiEndpoints) {
    if (!results[endpoint.key]) {
      try {
        const response = await fetch(endpoint.url);
        if (response.ok) {
          const data = await response.json();
          results[endpoint.key] = data;
          console.log(`✅ ${endpoint.key} получен через API`);
        } else {
          console.log(`⚠️ ${endpoint.key}: API вернул ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint.key}: Ошибка запроса - ${error.message}`);
      }
    }
  }
  
  // 3. Извлекаем каталоги по типам
  console.log('\n📋 Шаг 3: Извлечение каталогов по типам...');
  
  const catalogTypes = ['shablony_korpusov', 'dveri_shkaf', 'shelves', 'c32', 'c31', 'c39'];
  
  for (const type of catalogTypes) {
    // Проверяем в глобальных переменных
    if (typeof catalogs_by_key !== 'undefined' && catalogs_by_key[type]) {
      results.catalogs_by_type[type] = catalogs_by_key[type];
      console.log(`✅ ${type} найден в catalogs_by_key`);
    } else if (window.pp && window.pp.libs && window.pp.libs.catalogs && window.pp.libs.catalogs[type]) {
      results.catalogs_by_type[type] = window.pp.libs.catalogs[type];
      console.log(`✅ ${type} найден в pp.libs.catalogs`);
    } else {
      // Пытаемся получить через API
      try {
        const response = await fetch(`/catalog/items_list/${type}`);
        if (response.ok) {
          const data = await response.json();
          results.catalogs_by_type[type] = data;
          console.log(`✅ ${type} получен через API (${data.items?.length || 0} элементов)`);
        } else {
          console.log(`⚠️ ${type}: API вернул ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${type}: Ошибка запроса - ${error.message}`);
      }
    }
  }
  
  // 4. Объединяем с перехваченными данными
  console.log('\n🔄 Шаг 4: Объединение с перехваченными данными...');
  
  if (interceptedData.modules_groups && !results.modules_groups) {
    results.modules_groups = interceptedData.modules_groups;
    console.log('✅ modules_groups добавлен из перехваченных данных');
  }
  
  if (interceptedData.default_settings && !results.default_settings) {
    results.default_settings = interceptedData.default_settings;
    console.log('✅ default_settings добавлен из перехваченных данных');
  }
  
  if (interceptedData.material_types && !results.material_types) {
    results.material_types = interceptedData.material_types;
    console.log('✅ material_types добавлен из перехваченных данных');
  }
  
  if (interceptedData.catalogs_by_type) {
    Object.assign(results.catalogs_by_type, interceptedData.catalogs_by_type);
    console.log('✅ Каталоги добавлены из перехваченных данных');
  }
  
  // Сохраняем результаты в глобальную переменную
  window.__allMissingData = results;
  
  console.log('\n📊 ИТОГИ ИЗВЛЕЧЕНИЯ:');
  console.log(`  - modules_groups: ${results.modules_groups ? '✅' : '❌'}`);
  console.log(`  - default_settings: ${results.default_settings ? '✅' : '❌'}`);
  console.log(`  - material_types: ${results.material_types ? '✅' : '❌'}`);
  console.log(`  - Каталоги по типам: ${Object.keys(results.catalogs_by_type).length} типов`);
  Object.keys(results.catalogs_by_type).forEach(type => {
    const count = results.catalogs_by_type[type]?.items?.length || 0;
    console.log(`    - ${type}: ${count} элементов`);
  });
  
  console.log('\n✅ Извлечение завершено!');
  console.log('💡 Используйте saveAllMissingData() для сохранения в файл');
  
  return results;
}

/**
 * Сохранить все извлеченные данные в файл
 */
function saveAllMissingData() {
  if (!window.__allMissingData) {
    console.error('❌ window.__allMissingData не найден');
    console.log('💡 Сначала выполните extractAllMissingData()');
    return false;
  }
  
  // Используем функцию сохранения из save-json-to-file.js
  if (window.saveJSONToFile) {
    return window.saveJSONToFile(window.__allMissingData, 'clodis-missing-data.json');
  } else {
    // Если функция не загружена, создаем временную
    const jsonString = JSON.stringify(window.__allMissingData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'clodis-missing-data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('✅ Файл clodis-missing-data.json сохранен!');
    return true;
  }
}

// Экспортируем функции
window.extractAllMissingData = extractAllMissingData;
window.saveAllMissingData = saveAllMissingData;

console.log('✅ Скрипт загружен!');
console.log('\n📝 ИНСТРУКЦИЯ:');
console.log('1. Выполните: extractAllMissingData()');
console.log('2. Дождитесь завершения (может занять несколько секунд)');
console.log('3. Выполните: saveAllMissingData()');
console.log('4. Файл clodis-missing-data.json будет скачан');
console.log('\n💡 СОВЕТ: Если данные не найдены, перезагрузите страницу и попробуйте снова');
console.log('   или откройте каталог элементов в интерфейсе Clodis');

