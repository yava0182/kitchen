/**
 * Преобразование данных каталога в формат db.json
 * 
 * ИНСТРУКЦИЯ:
 * 1. Скопируйте JSON из Network Response (весь объект с "items" и "count")
 * 2. Вставьте его в переменную ниже
 * 3. Выполните: convertCatalogToDBFormat()
 */

// ВСТАВЬТЕ СЮДА JSON ИЗ NETWORK RESPONSE
const catalogData = {
  "items": [],
  "count": 0
};

function convertCatalogToDBFormat(inputData) {
  console.log('🔄 Преобразование данных каталога в формат db.json...\n');
  
  // Используем переданные данные или глобальную переменную
  const data = inputData || catalogData;
  
  if (!data.items || !Array.isArray(data.items)) {
    console.error('❌ Неверный формат данных! Ожидается объект с полем "items" (массив)');
    console.log('💡 Убедитесь, что вы скопировали весь JSON из Network Response');
    return null;
  }
  
  console.log(`📦 Найдено ${data.items.length} модулей в каталоге`);
  
  const catalogItems = [];
  
  for (const item of data.items) {
    try {
      // Парсим поле data (оно в виде строки JSON)
      let clodisJSON = null;
      if (item.data) {
        try {
          const parsedData = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
          
          // Извлекаем Clodis JSON структуру
          if (parsedData.params && parsedData.params.spec) {
            // Это полная структура модуля
            clodisJSON = [parsedData.params];
          } else if (parsedData.params) {
            clodisJSON = [parsedData.params];
          } else if (parsedData.spec) {
            clodisJSON = [parsedData];
          } else {
            // Используем весь объект
            clodisJSON = [parsedData];
          }
        } catch (e) {
          console.warn(`⚠️ Ошибка парсинга data для модуля ${item.id}:`, e.message);
          // Если не удалось распарсить, используем как есть
          clodisJSON = item.data;
        }
      }
      
      // Формируем объект для db.json
      const catalogItem = {
        id: String(item.id),
        name: item.name || `Модуль ${item.id}`,
        type: item.element_type || 'module',
        elementType: item.element_type || 'module',
        catalogCategory: 'module',
        metadata: {
          name: item.name || `Модуль ${item.id}`,
          type: item.element_type || 'module',
          code: item.code || null,
          category: item.category || null,
          cabinet_tag: item.cabinet_tag || null,
          catalog_type: item.catalog_type || null,
          size: {
            width: 600,
            height: 720,
            depth: 300
          },
          createdAt: new Date().toISOString(),
          element_type: item.element_type || null
        },
        clodisJSON: clodisJSON
      };
      
      catalogItems.push(catalogItem);
      
    } catch (error) {
      console.error(`❌ Ошибка обработки модуля ${item.id}:`, error);
    }
  }
  
  console.log(`\n✅ Преобразовано ${catalogItems.length} модулей`);
  console.log('\n📋 JSON для вставки в db.json:');
  const jsonOutput = JSON.stringify(catalogItems, null, 2);
  console.log(jsonOutput);
  
  // Копируем в буфер обмена
  if (navigator.clipboard) {
    navigator.clipboard.writeText(jsonOutput).then(() => {
      console.log('\n✅ ✅ ✅ JSON скопирован в буфер обмена!');
      console.log('📝 Теперь вставьте его в файл db.json в поле "catalog_items"');
    }).catch(err => {
      console.log('⚠️ Не удалось скопировать автоматически');
      console.log('📋 Скопируйте JSON вручную из консоли выше');
    });
  } else {
    console.log('\n📋 Скопируйте JSON вручную из консоли выше');
  }
  
  // Сохраняем в глобальную переменную
  window._convertedCatalog = catalogItems;
  
  return catalogItems;
}

/**
 * Быстрое преобразование - вставьте JSON прямо в функцию
 */
function quickConvert(jsonString) {
  try {
    const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    return convertCatalogToDBFormat(data);
  } catch (e) {
    console.error('❌ Ошибка парсинга JSON:', e);
    console.log('💡 Убедитесь, что JSON валидный');
    return null;
  }
}

/**
 * ПРОСТОЙ СПОСОБ - вставьте JSON как объект
 * 
 * ИНСТРУКЦИЯ:
 * 1. Скопируйте JSON из Network Response (весь объект)
 * 2. В консоли выполните:
 *    const myData = ВСТАВЬТЕ_JSON_СЮДА
 *    convertCatalogToDBFormat(myData)
 * 
 * ИЛИ еще проще:
 * 1. Скопируйте JSON
 * 2. В консоли выполните:
 *    convertCatalogToDBFormat(ВСТАВЬТЕ_JSON_СЮДА)
 */

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  ПРЕОБРАЗОВАНИЕ КАТАЛОГА В ФОРМАТ DB.JSON                   ║
╚══════════════════════════════════════════════════════════════╝

📋 ПРОСТАЯ ИНСТРУКЦИЯ:

ШАГ 1: Скопируйте JSON из Network Response
   → Перейдите на вкладку "Сеть" (Network)
   → Найдите запрос с данными каталога
   → Откройте вкладку "Response"
   → Скопируйте ВЕСЬ JSON (Ctrl+A, Ctrl+C)

ШАГ 2: Вставьте JSON в консоль
   → Вернитесь на вкладку "Консоль"
   → В консоли введите:
   
   const myData = 
   
   → Затем вставьте скопированный JSON (Ctrl+V)
   → Нажмите Enter

ШАГ 3: Преобразуйте данные
   → В консоли выполните:
   
   convertCatalogToDBFormat(myData)
   
   → Нажмите Enter

ШАГ 4: Скопируйте результат
   → JSON будет выведен в консоль
   → Скопируйте его (или он уже в буфере обмена)
   → Вставьте в db.json в поле "catalog_items"

💡 ПРИМЕР:
   const myData = {"items":[...], "count":88}
   convertCatalogToDBFormat(myData)
`);

