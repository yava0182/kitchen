import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE = path.join(__dirname, '..', 'clodis-items.json');

console.log('Проверка файла clodis-items.json...\n');

try {
  const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  
  console.log('✅ Файл валиден!');
  console.log(`📦 Всего элементов: ${data.count}`);
  console.log(`📋 Найдено items: ${data.items?.length || 0}\n`);
  
  if (data.items && data.items.length > 0) {
    console.log('📋 Типы элементов:');
    data.items.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.name} (key: ${item.key}, id: ${item.id})`);
    });
  }
  
  console.log('\n✅ Это catalogs_keys - список типов элементов каталога');
  console.log('💡 Эти данные нужно добавить в db.json как catalogs_keys');
  
} catch (error) {
  console.error('❌ Ошибка:', error.message);
  process.exit(1);
}

