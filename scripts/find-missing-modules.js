import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, '..', 'db.json');

const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

console.log('🔍 Поиск упоминаний модулей 89, 88, 9 в Clodis JSON:\n');

const missingIds = ['89', '88', '9'];
const foundReferences = [];

// Ищем упоминания этих ID в clodisJSON всех элементов
db.catalog_items.forEach(item => {
  if (item.clodisJSON && Array.isArray(item.clodisJSON)) {
    const searchInJSON = (obj, path = '') => {
      if (typeof obj !== 'object' || obj === null) return;
      
      if (obj.spec && obj.spec.id) {
        const id = String(obj.spec.id);
        if (missingIds.includes(id)) {
          foundReferences.push({
            moduleId: item.id,
            moduleName: item.name,
            referencedId: id,
            elementType: obj.spec.element_type,
            path: path
          });
        }
      }
      
      if (Array.isArray(obj)) {
        obj.forEach((child, idx) => searchInJSON(child, `${path}[${idx}]`));
      } else {
        Object.keys(obj).forEach(key => {
          searchInJSON(obj[key], path ? `${path}.${key}` : key);
        });
      }
    };
    
    item.clodisJSON.forEach((jsonItem, idx) => {
      searchInJSON(jsonItem, `clodisJSON[${idx}]`);
    });
  }
});

console.log(`📋 Найдено упоминаний: ${foundReferences.length}\n`);

if (foundReferences.length > 0) {
  console.log('🔗 Где используются отсутствующие модули:\n');
  foundReferences.forEach(ref => {
    console.log(`   Модуль "${ref.moduleName}" (ID: ${ref.moduleId})`);
    console.log(`   → ссылается на ID: ${ref.referencedId}`);
    console.log(`   → тип: ${ref.elementType}`);
    console.log(`   → путь: ${ref.path}`);
    console.log('');
  });
  
  // Группируем по ID
  const byId = {};
  foundReferences.forEach(ref => {
    if (!byId[ref.referencedId]) {
      byId[ref.referencedId] = [];
    }
    byId[ref.referencedId].push(ref);
  });
  
  console.log('📊 Сводка:\n');
  Object.keys(byId).forEach(id => {
    console.log(`   ID ${id} (${byId[id][0].elementType}):`);
    console.log(`      Используется в ${byId[id].length} месте(ах):`);
    byId[id].forEach(ref => {
      console.log(`      - "${ref.moduleName}" (ID: ${ref.moduleId})`);
    });
    console.log('');
  });
} else {
  console.log('❌ Упоминания не найдены');
}

