/**
 * Скрипт для сохранения большого JSON в файл
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * 1. В консоли Clodis выполните команды для получения данных
 * 2. Выполните saveJSONToFile(data, 'filename.json')
 */

/**
 * Сохранить JSON в файл
 * @param {any} data - Данные для сохранения
 * @param {string} filename - Имя файла
 */
function saveJSONToFile(data, filename = 'clodis-data.json') {
  try {
    // Преобразуем в JSON строку
    const jsonString = JSON.stringify(data, null, 2);
    
    // Создаем Blob
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Создаем URL
    const url = URL.createObjectURL(blob);
    
    // Создаем ссылку для скачивания
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Добавляем на страницу и кликаем
    document.body.appendChild(link);
    link.click();
    
    // Удаляем ссылку
    document.body.removeChild(link);
    
    // Освобождаем URL
    URL.revokeObjectURL(url);
    
    console.log(`✅ Файл ${filename} сохранен!`);
    return true;
  } catch (error) {
    console.error('❌ Ошибка сохранения файла:', error);
    return false;
  }
}

/**
 * Сохранить данные из window.__extractedClodisData
 */
function saveExtractedData() {
  if (window.__extractedClodisData) {
    return saveJSONToFile(window.__extractedClodisData, 'clodis-extracted-data.json');
  } else {
    console.error('❌ window.__extractedClodisData не найден');
    console.log('💡 Сначала выполните перехват данных через intercept-fetch-requests.js');
    return false;
  }
}

/**
 * Сохранить все данные из window.__allData
 */
function saveAllData() {
  if (window.__allData) {
    return saveJSONToFile(window.__allData, 'clodis-all-data.json');
  } else {
    console.error('❌ window.__allData не найден');
    return false;
  }
}

// Экспортируем функции
window.saveJSONToFile = saveJSONToFile;
window.saveExtractedData = saveExtractedData;
window.saveAllData = saveAllData;

console.log('✅ Скрипт загружен! Доступные функции:');
console.log('  - saveJSONToFile(data, "filename.json") - сохранить любой JSON');
console.log('  - saveExtractedData() - сохранить window.__extractedClodisData');
console.log('  - saveAllData() - сохранить window.__allData');

