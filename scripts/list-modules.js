import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, '..', 'db.json');

const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

console.log('📦 Модули в базе данных:\n');
console.log(`Всего модулей: ${db.catalog_items?.length || 0}\n`);

if (db.catalog_items && db.catalog_items.length > 0) {
  db.catalog_items.forEach((item, i) => {
    console.log(`${i + 1}. ID: ${item.id}`);
    console.log(`   Название: ${item.name}`);
    console.log(`   Код: ${item.metadata?.code || 'нет'}`);
    console.log(`   Тип: ${item.type}`);
    console.log(`   Категория: ${item.catalogCategory || 'нет'}`);
    console.log(`   Clodis JSON: ${item.clodisJSON ? '✅ есть' : '❌ нет'}`);
    console.log('');
  });
} else {
  console.log('❌ Модули не найдены');
}

