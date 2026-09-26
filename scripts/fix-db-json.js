import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, '..', 'db.json');

console.log('Исправление db.json...\n');

try {
  // Читаем файл как текст
  let content = fs.readFileSync(DB_FILE, 'utf8');
  
  // Удаляем лишнее поле "count" в конце
  // Ищем паттерн: ],\n  "count": число\n}
  content = content.replace(/,\s*"count":\s*\d+\s*\}$/, '\n}');
  
  // Сохраняем
  fs.writeFileSync(DB_FILE, content, 'utf8');
  
  // Проверяем валидность
  const db = JSON.parse(content);
  
  console.log('✅ db.json исправлен!');
  console.log(`📦 catalog_items: ${db.catalog_items?.length || 0} элементов`);
  
  // Теперь добавляем catalogs_keys
  const ITEMS_FILE = path.join(__dirname, '..', 'clodis-items.json');
  const itemsData = JSON.parse(fs.readFileSync(ITEMS_FILE, 'utf8'));
  
  db.catalogs_keys = itemsData.items || [];
  
  // Сохраняем
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  
  console.log(`✅ Добавлено ${db.catalogs_keys.length} типов элементов (catalogs_keys)`);
  console.log('\n✅ Готово!');
  
} catch (error) {
  console.error('❌ Ошибка:', error.message);
  process.exit(1);
}

