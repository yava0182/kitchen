/**
 * Экспорт каталога со страницы /catalog/items/
 * Этот скрипт работает на странице списка модулей
 */

/**
 * Найти данные каталога на текущей странице
 */
function findCatalogOnPage() {
  console.log('🔍 Поиск данных каталога на странице...\n');
  
  // 1. Проверяем глобальные переменные
  console.log('1️⃣ Проверка глобальных переменных:');
  const possibleVars = ['catalog', 'modules', 'items', 'data', 'catalogData', 'moduleList'];
  for (const varName of possibleVars) {
    if (window[varName]) {
      console.log(`   ✅ Найден window.${varName}:`, typeof window[varName]);
      if (Array.isArray(window[varName]) || (typeof window[varName] === 'object' && window[varName].items)) {
        console.log(`   🎉 ВОЗМОЖНО ЭТО КАТАЛОГ!`);
        return window[varName];
      }
    }
  }
  
  // 2. Проверяем данные в DOM (data-атрибуты, JSON в скриптах)
  console.log('\n2️⃣ Поиск данных в DOM:');
  const jsonScripts = document.querySelectorAll('script[type="application/json"], script:not([src])');
  for (const script of jsonScripts) {
    try {
      const text = script.textContent.trim();
      if (text && (text.startsWith('{') || text.startsWith('['))) {
        const data = JSON.parse(text);
        if (data && (Array.isArray(data) || data.items || data.modules)) {
          console.log('   ✅ Найден JSON в скрипте:', Object.keys(data));
          return data;
        }
      }
    } catch(e) {}
  }
  
  // 3. Проверяем переменные в замыканиях (через eval в безопасном контексте)
  console.log('\n3️⃣ Попытка найти данные через анализ страницы:');
  
  // 4. Проверяем Network запросы (если есть доступ к Performance API)
  console.log('\n4️⃣ Проверка Network запросов:');
  console.log('   💡 Откройте вкладку Network (Сеть)');
  console.log('   💡 Найдите запросы, содержащие "catalog" или "module"');
  console.log('   💡 Кликните на запрос и посмотрите Response (Ответ)');
  
  return null;
}

/**
 * Экспорт всех модулей со страницы каталога
 * Работает, если на странице есть список модулей
 */
function exportAllFromCatalogPage() {
  console.log('🚀 Экспорт модулей со страницы каталога...\n');
  
  const allItems = [];
  
  // Метод 1: Поиск в таблице/списке модулей
  console.log('1️⃣ Поиск модулей в DOM:');
  const rows = document.querySelectorAll('tr[data-id], tr[data-module-id], [data-item-id]');
  if (rows.length > 0) {
    console.log(`   Найдено ${rows.length} строк с данными`);
    rows.forEach((row, i) => {
      try {
        const id = row.getAttribute('data-id') || row.getAttribute('data-module-id') || row.getAttribute('data-item-id');
        const name = row.textContent.trim().substring(0, 50);
        if (id) {
          allItems.push({ id, name, source: 'DOM' });
        }
      } catch(e) {}
    });
  }
  
  // Метод 2: Поиск в JavaScript переменных страницы
  console.log('\n2️⃣ Поиск в переменных страницы:');
  try {
    // Пытаемся найти данные через анализ кода страницы
    const scripts = Array.from(document.querySelectorAll('script:not([src])'));
    for (const script of scripts) {
      const code = script.textContent;
      // Ищем паттерны типа var catalog = [...] или const items = [...]
      const matches = code.match(/(?:var|let|const)\s+(?:catalog|items|modules|data)\s*=\s*(\[[\s\S]*?\]|\{[\s\S]*?\})/);
      if (matches) {
        try {
          const data = eval('(' + matches[1] + ')');
          if (Array.isArray(data) && data.length > 0) {
            console.log(`   ✅ Найдены данные в скрипте: ${data.length} элементов`);
            data.forEach(item => {
              if (item && (item.id || item._id)) {
                allItems.push({
                  id: String(item.id || item._id),
                  name: item.name || item.title || 'Без названия',
                  data: item
                });
              }
            });
          }
        } catch(e) {
          console.log('   ⚠️ Не удалось распарсить данные');
        }
      }
    }
  } catch(e) {
    console.log('   ⚠️ Ошибка при поиске:', e.message);
  }
  
  // Метод 3: Через API запросы (если есть)
  console.log('\n3️⃣ Инструкции для ручного экспорта:');
  console.log('   📋 Если на странице есть список модулей:');
  console.log('      1. Откройте вкладку Network (Сеть)');
  console.log('      2. Обновите страницу (F5)');
  console.log('      3. Найдите запрос, который загружает список модулей');
  console.log('      4. Кликните на запрос → вкладка Response');
  console.log('      5. Скопируйте JSON ответ');
  console.log('      6. Вставьте в db.json');
  
  if (allItems.length > 0) {
    console.log(`\n✅ Найдено ${allItems.length} элементов`);
    console.log('📋 Данные:', allItems);
    return allItems;
  } else {
    console.log('\n❌ Не удалось автоматически найти модули');
    console.log('💡 Используйте ручной метод через Network');
    return null;
  }
}

/**
 * Простой способ: экспорт через копирование данных из Network
 */
function showNetworkExportInstructions() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  РУЧНОЙ ЭКСПОРТ ЧЕРЕЗ NETWORK                               ║
╚══════════════════════════════════════════════════════════════╝

📋 ПОШАГОВАЯ ИНСТРУКЦИЯ:

1. Откройте вкладку "Сеть" (Network) в DevTools
   → Рядом с вкладкой "Консоль"

2. Очистите список запросов
   → Кликните на иконку 🚫 (Clear) или нажмите Ctrl+L

3. Обновите страницу
   → Нажмите F5 или кликните на кнопку обновления

4. Найдите запрос, который загружает список модулей
   → Ищите запросы с именами типа:
      * catalog
      * module
      * items
      * list
   → Обычно это GET запрос (зелёный)

5. Кликните на найденный запрос

6. Откройте вкладку "Response" (Ответ) или "Preview" (Превью)
   → Там должен быть JSON с данными модулей

7. Скопируйте весь JSON
   → Правый клик → "Copy" или выделите и Ctrl+C

8. Вставьте в db.json в поле "catalog_items"
   → Если это массив - вставьте как есть
   → Если это объект с полем items - используйте items

💡 СОВЕТ: Если не видите нужный запрос, попробуйте:
   - Ввести "catalog" или "module" в фильтр Network
   - Кликнуть на кнопку "Загрузить ещё" или "Показать все" на странице
`);
}

// Инструкции
console.log(`
╔══════════════════════════════════════════════════════════════╗
║  ЭКСПОРТ КАТАЛОГА СО СТРАНИЦЫ СПИСКА МОДУЛЕЙ               ║
╚══════════════════════════════════════════════════════════════╝

📋 ДОСТУПНЫЕ КОМАНДЫ:

1. findCatalogOnPage()
   → Ищет данные каталога на текущей странице

2. exportAllFromCatalogPage()
   → Пытается автоматически экспортировать модули

3. showNetworkExportInstructions()
   → Показывает инструкцию для ручного экспорта через Network

🚀 РЕКОМЕНДУЕТСЯ: showNetworkExportInstructions()
   → Это самый надёжный способ экспорта!
`);

