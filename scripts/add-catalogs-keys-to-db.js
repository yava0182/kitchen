import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, '..', 'db.json');
const ITEMS_FILE = path.join(__dirname, '..', 'clodis-items.json');

console.log('Добавление catalogs_keys в db.json...\n');

try {
  // Читаем db.json
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  
  // Читаем clodis-items.json
  const itemsData = JSON.parse(fs.readFileSync(ITEMS_FILE, 'utf8'));
  
  // Добавляем catalogs_keys
  db.catalogs_keys = itemsData.items || [];
  
  // Сохраняем обратно
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  
  console.log(`✅ Добавлено ${db.catalogs_keys.length} типов элементов в db.json`);
  console.log(`📋 Теперь в db.json есть catalogs_keys`);
  
  // Проверяем, что все правильно
  const dbCheck = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  console.log(`\n✅ Проверка: catalogs_keys в db.json: ${dbCheck.catalogs_keys?.length || 0} элементов`);
  
} catch (error) {
  console.error('❌ Ошибка:', error.message);
  process.exit(1);
}

