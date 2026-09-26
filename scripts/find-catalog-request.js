/**
 * Поиск запроса каталога в Network
 * Выполните: findCatalogRequest()
 */

function findCatalogRequest() {
  console.log('🔍 Поиск запроса каталога в Network...\n');
  console.log('📋 ИНСТРУКЦИЯ:\n');
  console.log('1. Во вкладке Network (Сеть) нажмите на фильтр "Fetch/XHR"');
  console.log('   → Это покажет только AJAX запросы');
  console.log('   → Запросы каталога обычно идут через XHR/Fetch\n');
  
  console.log('2. В поле "Фильтр" (Filter) введите:');
  console.log('   → catalog');
  console.log('   → или module');
  console.log('   → или items\n');
  
  console.log('3. Если запросов нет, попробуйте:');
  console.log('   → Обновить страницу (F5)');
  console.log('   → Или кликнуть на какой-то элемент в интерфейсе\n');
  
  console.log('4. Когда найдёте запрос с данными каталога:');
  console.log('   → Кликните на него');
  console.log('   → Откройте вкладку "Response" (Ответ)');
  console.log('   → Или вкладку "Preview" (Превью)');
  console.log('   → Скопируйте JSON\n');
  
  console.log('5. Вставьте скопированный JSON в db.json\n');
}

/**
 * Попытка найти данные каталога в уже загруженных запросах
 */
function checkNetworkForCatalog() {
  console.log('🔍 Проверка Network запросов...\n');
  
  // К сожалению, из консоли нельзя напрямую получить список запросов Network
  // Но можем дать инструкции
  
  console.log('💡 ВАЖНО:');
  console.log('   Network запросы можно просмотреть только через UI DevTools');
  console.log('   Но мы можем попробовать найти данные другим способом\n');
  
  console.log('📋 АЛЬТЕРНАТИВНЫЙ СПОСОБ:');
  console.log('   1. Во вкладке Network найдите запрос с URL содержащим:');
  console.log('      - /catalog/');
  console.log('      - /module/');
  console.log('      - /items/');
  console.log('   2. Кликните на запрос');
  console.log('   3. В правой панели откройте "Response"');
  console.log('   4. Скопируйте весь JSON');
  console.log('   5. Вставьте в db.json в поле "catalog_items"\n');
  
  // Попытка найти данные в window
  console.log('🔍 Проверка window на наличие данных...');
  const windowKeys = Object.keys(window).filter(k => 
    k.toLowerCase().includes('catalog') || 
    k.toLowerCase().includes('module') ||
    k.toLowerCase().includes('item')
  );
  
  if (windowKeys.length > 0) {
    console.log('   Найдены ключи:', windowKeys);
    windowKeys.forEach(key => {
      try {
        const obj = window[key];
        console.log(`   ${key}:`, typeof obj);
        if (obj && (Array.isArray(obj) || (typeof obj === 'object' && obj.items))) {
          console.log(`   🎉 ВОЗМОЖНО ЭТО КАТАЛОГ: ${key}`);
        }
      } catch(e) {}
    });
  } else {
    console.log('   ❌ Не найдено переменных с каталогом в window');
  }
}

// Инструкции
console.log(`
╔══════════════════════════════════════════════════════════════╗
║  ПОИСК ЗАПРОСА КАТАЛОГА В NETWORK                           ║
╚══════════════════════════════════════════════════════════════╝

📋 ДОСТУПНЫЕ КОМАНДЫ:

1. findCatalogRequest()
   → Показывает инструкцию по поиску запроса

2. checkNetworkForCatalog()
   → Проверяет альтернативные способы

🚀 НАЧНИТЕ С: findCatalogRequest()
`);

