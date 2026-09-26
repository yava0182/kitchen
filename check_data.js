const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/bootstrap/get_all_data_for_catalog_item.json', 'utf8'));

console.log('\n📊 Доступные данные в референсе:\n');
Object.keys(data).forEach(key => { 
  const val = data[key]; 
  if (Array.isArray(val)) { 
    console.log(`  ✓ ${key}: массив [${val.length} элементов]`); 
  } else if (val && typeof val === 'object' && val.items) { 
    console.log(`  ✓ ${key}: объект с items [${val.items.length} элементов], categories [${val.categories?.length || 0}]`); 
  } else if (val && typeof val === 'object') { 
    console.log(`  ✓ ${key}: объект с ${Object.keys(val).length} ключами`); 
  } else { 
    console.log(`  - ${key}: ${typeof val}`); 
  } 
});

console.log('\n📋 Всего ключей:', Object.keys(data).length);
