/**
 * Экспорт каталога из localStorage
 * Выполните: exportCatalogFromLocalStorage()
 */

function exportCatalogFromLocalStorage() {
  console.log('🔍 Поиск каталога в localStorage...\n');
  
  // Находим все ключи, связанные с каталогом
  const catalogKeys = Object.keys(localStorage).filter(k => 
    k.toLowerCase().includes('catalog') || 
    k.toLowerCase().includes('module') ||
    k.toLowerCase().includes('pp_admin')
  );
  
  console.log(`✅ Найдено ${catalogKeys.length} ключей в localStorage:`);
  catalogKeys.forEach(key => {
    console.log(`   - ${key}`);
  });
  
  console.log('\n📦 Проверяю содержимое ключей...\n');
  
  const allCatalogData = [];
  
  for (const key of catalogKeys) {
    try {
      const value = localStorage.getItem(key);
      console.log(`\n🔍 Ключ: ${key}`);
      console.log(`   Длина: ${value ? value.length : 0} символов`);
      
      if (!value) {
        console.log('   ⚠️ Пустое значение');
        continue;
      }
      
      // Пытаемся распарсить как JSON
      try {
        const parsed = JSON.parse(value);
        console.log('   ✅ Это JSON!');
        console.log('   Тип:', Array.isArray(parsed) ? 'массив' : typeof parsed);
        console.log('   Ключи:', typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).slice(0, 10) : 'N/A');
        
        // Если это массив или объект с данными каталога
        if (Array.isArray(parsed)) {
          console.log(`   📊 Элементов в массиве: ${parsed.length}`);
          if (parsed.length > 0 && parsed[0].id) {
            console.log('   🎉 ВОЗМОЖНО ЭТО КАТАЛОГ!');
            allCatalogData.push(...parsed);
          }
        } else if (parsed.items && Array.isArray(parsed.items)) {
          console.log(`   📊 Элементов в items: ${parsed.items.length}`);
          console.log('   🎉 ВОЗМОЖНО ЭТО КАТАЛОГ!');
          allCatalogData.push(...parsed.items);
        } else if (parsed.data && Array.isArray(parsed.data)) {
          console.log(`   📊 Элементов в data: ${parsed.data.length}`);
          console.log('   🎉 ВОЗМОЖНО ЭТО КАТАЛОГ!');
          allCatalogData.push(...parsed.data);
        }
        
        // Сохраняем для дальнейшего анализа
        window[`_localStorage_${key}`] = parsed;
        
      } catch (e) {
        console.log('   ⚠️ Не JSON, возможно строка или другой формат');
        console.log('   Первые 200 символов:', value.substring(0, 200));
      }
      
    } catch (error) {
      console.error(`   ❌ Ошибка при чтении ${key}:`, error);
    }
  }
  
  if (allCatalogData.length > 0) {
    console.log(`\n✅ Найдено ${allCatalogData.length} элементов каталога!`);
    console.log('📋 Формирую данные для экспорта...\n');
    
    // Преобразуем в нужный формат
    const catalogItems = allCatalogData.map((item, index) => {
      // Извлекаем clodisJSON
      let clodisJSON = null;
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
    
    console.log(`✅ Подготовлено ${catalogItems.length} элементов для экспорта`);
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
    
    // Сохраняем в глобальную переменную
    window._exportedCatalog = catalogItems;
    
    return catalogItems;
  } else {
    console.log('\n❌ Не удалось автоматически найти данные каталога');
    console.log('💡 Но данные есть в localStorage!');
    console.log('📋 Попробуйте вручную:');
    console.log('   1. Выполните: showLocalStorageCatalog()');
    console.log('   2. Или проверьте каждый ключ вручную');
    return null;
  }
}

/**
 * Показать содержимое всех ключей каталога
 */
function showLocalStorageCatalog() {
  const catalogKeys = Object.keys(localStorage).filter(k => 
    k.toLowerCase().includes('catalog') || 
    k.toLowerCase().includes('module') ||
    k.toLowerCase().includes('pp_admin')
  );
  
  console.log('📦 Все ключи каталога в localStorage:\n');
  
  catalogKeys.forEach(key => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Ключ: ${key}`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          const parsed = JSON.parse(value);
          console.log('JSON:', parsed);
        } catch(e) {
          console.log('Текст (первые 500 символов):', value.substring(0, 500));
        }
      }
    } catch(e) {
      console.error('Ошибка:', e);
    }
  });
}

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  ЭКСПОРТ КАТАЛОГА ИЗ LOCALSTORAGE                           ║
╚══════════════════════════════════════════════════════════════╝

✅ НАЙДЕНЫ КЛЮЧИ В LOCALSTORAGE!

📋 ДОСТУПНЫЕ КОМАНДЫ:

1. exportCatalogFromLocalStorage()
   → Автоматически экспортирует каталог из localStorage
   → Скопирует JSON в буфер обмена

2. showLocalStorageCatalog()
   → Покажет содержимое всех ключей каталога
   → Полезно для ручного анализа

🚀 НАЧНИТЕ С: exportCatalogFromLocalStorage()
`);

