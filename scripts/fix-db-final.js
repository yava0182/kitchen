import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, '..', 'db.json');

console.log('🔧 Финальное исправление db.json...');

let content = fs.readFileSync(DB_FILE, 'utf8');

// Удаляем ,"count":60} в конце
content = content.replace(/,"count":\d+\}$/, '}');

// Находим начало массива catalog_items
const catalogItemsStart = content.indexOf('"catalog_items": [');
if (catalogItemsStart === -1) {
  console.error('❌ Не найдено поле "catalog_items"');
  process.exit(1);
}

// Находим начало массива после [
const arrayStart = catalogItemsStart + '"catalog_items": ['.length;
const afterBracket = content.substring(arrayStart).trim();

// Проверяем, начинается ли массив с {"items":[
if (afterBracket.startsWith('{"items":[')) {
  console.log('⚠️ Обнаружен вложенный объект {"items":[...]}, извлекаю массив...');
  
  // Находим начало массива items
  const itemsArrayStart = afterBracket.indexOf('[') + 1;
  // Находим конец массива items (перед ],"count":)
  let itemsArrayEnd = afterBracket.lastIndexOf('],"count":');
  if (itemsArrayEnd === -1) {
    itemsArrayEnd = afterBracket.lastIndexOf(']');
  }
  
  // Извлекаем массив items
  const itemsArray = afterBracket.substring(itemsArrayStart, itemsArrayEnd);
  
  // Находим где заканчивается catalog_items (после ])
  const catalogItemsEnd = content.indexOf(']', arrayStart + itemsArrayEnd);
  
  // Собираем новый контент
  const beforeCatalog = content.substring(0, arrayStart);
  const afterCatalog = content.substring(catalogItemsEnd + 1);
  
  content = beforeCatalog + itemsArray + ']' + afterCatalog;
  
  // Удаляем ,"count":60} если осталось
  content = content.replace(/,"count":\d+\}$/, '}');
  
  fs.writeFileSync(DB_FILE, content, 'utf8');
  console.log('✅ Структура исправлена!');
} else {
  console.log('✅ Структура выглядит правильно');
}

// Проверяем результат
try {
  const db = JSON.parse(content);
  console.log(`✅ JSON валиден!`);
  console.log(`   - catalog_items: ${db.catalog_items?.length || 0} элементов`);
  
  if (db.catalog_items && db.catalog_items.length > 0) {
    console.log(`\n📋 Первые 3 элемента:`);
    db.catalog_items.slice(0, 3).forEach((item, i) => {
      console.log(`   ${i + 1}. ID: ${item.id}, Название: ${item.name || 'нет'}, Тип: ${item.type || item.element_type || 'нет'}`);
    });
  }
} catch (e) {
  console.error('❌ Ошибка парсинга JSON:', e.message);
  const pos = parseInt(e.message.match(/position (\d+)/)?.[1] || '0');
  if (pos > 0) {
    const start = Math.max(0, pos - 100);
    const end = Math.min(content.length, pos + 100);
    console.error(`\n   Контекст вокруг ошибки (позиция ${pos}):`);
    console.error(`   ${content.substring(start, end)}`);
  }
  process.exit(1);
}

