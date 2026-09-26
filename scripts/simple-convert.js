/**
 * ПРОСТОЙ способ преобразования
 * 
 * ИНСТРУКЦИЯ:
 * 1. Скопируйте JSON из Network Response (весь объект с "items")
 * 2. В консоли вставьте: convert(ВСТАВЬТЕ_JSON_СЮДА)
 * 3. Готово!
 */

function convert(data) {
  // Если это строка, парсим
  if (typeof data === 'string') {
    data = JSON.parse(data);
  }
  
  const result = [];
  
  for (const item of data.items || []) {
    // Парсим data если это строка
    let clodisJSON = null;
    if (item.data) {
      try {
        const parsed = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
        clodisJSON = parsed.params ? [parsed.params] : [parsed];
      } catch(e) {
        clodisJSON = [item.data];
      }
    }
    
    result.push({
      id: String(item.id),
      name: item.name || `Модуль ${item.id}`,
      type: item.element_type || 'module',
      elementType: item.element_type || 'module',
      metadata: {
        name: item.name || `Модуль ${item.id}`,
        type: item.element_type || 'module',
        createdAt: new Date().toISOString()
      },
      clodisJSON: clodisJSON
    });
  }
  
  const json = JSON.stringify(result, null, 2);
  console.log(json);
  
  // Копируем
  if (navigator.clipboard) {
    navigator.clipboard.writeText(json).then(() => {
      console.log('\n✅ Скопировано! Вставьте в db.json');
    });
  }
  
  return result;
}

console.log('✅ Готово! Используйте: convert(ваш_json)');

