import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, '..', 'db.json');

console.log('🔧 Полная проверка и исправление db.json...');

let content = fs.readFileSync(DB_FILE, 'utf8');

// Удаляем ,"count":60} в конце
content = content.replace(/,"count":\d+\}$/, '}');

// Проверяем, что catalog_items начинается правильно
if (!content.includes('"catalog_items": [')) {
  console.error('❌ Не найдено поле "catalog_items"');
  process.exit(1);
}

// Пытаемся распарсить JSON
try {
  const db = JSON.parse(content);
  console.log(`✅ JSON валиден!`);
  console.log(`   - catalog_items: ${db.catalog_items?.length || 0} элементов`);
  console.log(`   - categories: ${db.categories?.length || 0}`);
  
  if (db.catalog_items && db.catalog_items.length > 0) {
    console.log(`\n📋 Первые 3 элемента:`);
    db.catalog_items.slice(0, 3).forEach((item, i) => {
      console.log(`   ${i + 1}. ID: ${item.id}, Название: ${item.name || 'нет'}, Тип: ${item.type || 'нет'}`);
    });
  }
} catch (e) {
  console.error('❌ Ошибка парсинга JSON:', e.message);
  console.error(`   Позиция ошибки: ${e.message.match(/position (\d+)/)?.[1] || 'неизвестно'}`);
  
  // Пытаемся найти проблемное место
  const pos = parseInt(e.message.match(/position (\d+)/)?.[1] || '0');
  if (pos > 0) {
    const start = Math.max(0, pos - 50);
    const end = Math.min(content.length, pos + 50);
    console.error(`\n   Контекст вокруг ошибки:`);
    console.error(`   ${content.substring(start, end)}`);
  }
  
  process.exit(1);
}

