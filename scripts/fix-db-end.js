import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, '..', 'db.json');

console.log('🔧 Исправление конца db.json...');

let content = fs.readFileSync(DB_FILE, 'utf8');

// Удаляем ,"count":60} в конце
content = content.replace(/,"count":\d+\}$/, '}');

fs.writeFileSync(DB_FILE, content, 'utf8');

console.log('✅ Файл исправлен!');

// Проверяем, что теперь JSON валидный
try {
  const db = JSON.parse(content);
  console.log(`✅ JSON валиден!`);
  console.log(`   - catalog_items: ${db.catalog_items?.length || 0} элементов`);
} catch (e) {
  console.error('❌ Ошибка парсинга:', e.message);
}

