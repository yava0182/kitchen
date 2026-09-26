/**
 * Конкретные проверки переменных Clodis
 * 
 * Выполните эти команды ПО ОДНОЙ в консоли Clodis
 */

console.log('🔍 Проверка конкретных переменных Clodis\n');

// ============================================
// 1. ПРОВЕРКА pp.libs
// ============================================
console.log('1️⃣ Проверяю pp.libs:');
if (window.pp && window.pp.libs) {
  console.log('✅ pp.libs существует');
  console.log('   Ключи:', Object.keys(window.pp.libs));
  
  // modules_groups
  if (window.pp.libs.modules_groups) {
    console.log('   ✅ pp.libs.modules_groups найден!');
    console.log(JSON.stringify(window.pp.libs.modules_groups, null, 2));
  } else {
    console.log('   ❌ pp.libs.modules_groups НЕ найден');
  }
  
  // catalogs
  if (window.pp.libs.catalogs) {
    console.log('   ✅ pp.libs.catalogs найден!');
    console.log('   Ключи каталогов:', Object.keys(window.pp.libs.catalogs));
  } else {
    console.log('   ❌ pp.libs.catalogs НЕ найден');
  }
  
  // materials
  if (window.pp.libs.materials) {
    console.log('   ✅ pp.libs.materials найден!');
    console.log('   Ключи материалов:', Object.keys(window.pp.libs.materials));
  }
} else {
  console.log('❌ pp.libs НЕ существует');
  console.log('   Проверьте: window.pp =', window.pp);
}

console.log('\n');

// ============================================
// 2. ПРОВЕРКА ГЛОБАЛЬНЫХ ПЕРЕМЕННЫХ
// ============================================
console.log('2️⃣ Проверяю глобальные переменные:');

// modules_groups
if (typeof modules_groups !== 'undefined') {
  console.log('✅ modules_groups найден!');
  console.log(JSON.stringify(modules_groups, null, 2));
} else {
  console.log('❌ modules_groups НЕ найден');
  console.log('   Попробуйте: window.modules_groups =', window.modules_groups);
}

// defaults_data
if (typeof defaults_data !== 'undefined') {
  console.log('✅ defaults_data найден!');
  console.log(JSON.stringify(defaults_data, null, 2));
} else {
  console.log('❌ defaults_data НЕ найден');
  console.log('   Попробуйте: window.defaults_data =', window.defaults_data);
}

// material_types
if (typeof material_types !== 'undefined') {
  console.log('✅ material_types найден!');
  console.log('   Тип:', typeof material_types);
  console.log('   Длина:', Array.isArray(material_types) ? material_types.length : 'не массив');
  if (Array.isArray(material_types) && material_types.length > 0) {
    console.log('   Первый элемент:', JSON.stringify(material_types[0], null, 2));
  }
} else {
  console.log('❌ material_types НЕ найден');
  console.log('   Попробуйте: window.material_types =', window.material_types);
}

// catalogs_by_key
if (typeof catalogs_by_key !== 'undefined') {
  console.log('✅ catalogs_by_key найден!');
  console.log('   Ключи:', Object.keys(catalogs_by_key));
  console.log('   shablony_korpusov:', catalogs_by_key.shablony_korpusov ? 'есть' : 'нет');
  console.log('   dveri_shkaf:', catalogs_by_key.dveri_shkaf ? 'есть' : 'нет');
} else {
  console.log('❌ catalogs_by_key НЕ найден');
  console.log('   Попробуйте: window.catalogs_by_key =', window.catalogs_by_key);
}

console.log('\n');

// ============================================
// 3. ПРОВЕРКА pp.variables
// ============================================
console.log('3️⃣ Проверяю pp.variables:');
if (window.pp && window.pp.variables) {
  console.log('✅ pp.variables существует');
  console.log('   Ключи:', Object.keys(window.pp.variables));
  
  if (window.pp.variables.global_vars) {
    console.log('   ✅ pp.variables.global_vars найден!');
    console.log('   Длина:', window.pp.variables.global_vars.length);
  }
} else {
  console.log('❌ pp.variables НЕ существует');
}

console.log('\n');

// ============================================
// 4. ПОИСК ВО ВСЕХ ОБЪЕКТАХ window
// ============================================
console.log('4️⃣ Ищу во всех объектах window:');

const searchKeys = [
  'modules_groups', 'defaults_data', 'material_types',
  'catalogs_by_key', 'catalogs_keys', 'materials_groups',
  'global_vars', 'materials', 'catalogs'
];

searchKeys.forEach(key => {
  if (window[key]) {
    console.log(`✅ window.${key} найден!`);
    if (Array.isArray(window[key])) {
      console.log(`   Тип: массив, длина: ${window[key].length}`);
    } else if (typeof window[key] === 'object') {
      console.log(`   Тип: объект, ключи: ${Object.keys(window[key]).slice(0, 5).join(', ')}...`);
    }
  }
});

console.log('\n');

// ============================================
// 5. ПРОВЕРКА ЧЕРЕЗ get_all_data_for_catalog_item
// ============================================
console.log('5️⃣ Проверяю данные через API (если доступно):');
console.log('   Попробуйте выполнить вручную:');
console.log('   fetch("/catalog/get_all_data_for_catalog_item/1")');
console.log('     .then(r => r.json())');
console.log('     .then(data => console.log("API данные:", data))');

console.log('\n');

// ============================================
// 6. ПОИСК В localStorage
// ============================================
console.log('6️⃣ Проверяю localStorage:');
const localStorageKeys = Object.keys(localStorage);
const relevantKeys = localStorageKeys.filter(key => 
  key.includes('module') || 
  key.includes('catalog') || 
  key.includes('material') ||
  key.includes('default') ||
  key.includes('group')
);

if (relevantKeys.length > 0) {
  console.log('✅ Найдены релевантные ключи:');
  relevantKeys.forEach(key => {
    console.log(`   - ${key}`);
    try {
      const value = localStorage.getItem(key);
      const parsed = JSON.parse(value);
      console.log(`     Тип: ${Array.isArray(parsed) ? 'массив' : typeof parsed}`);
      if (Array.isArray(parsed)) {
        console.log(`     Длина: ${parsed.length}`);
      }
    } catch (e) {
      console.log(`     (не JSON)`);
    }
  });
} else {
  console.log('❌ Релевантные ключи не найдены');
}

console.log('\n✅ Проверка завершена!');
console.log('\n📝 ИНСТРУКЦИЯ:');
console.log('Если данные не найдены, попробуйте:');
console.log('1. Перезагрузить страницу и подождать полной загрузки');
console.log('2. Открыть каталог элементов в интерфейсе Clodis');
console.log('3. Выполнить команды из раздела 5 (API запрос)');
console.log('4. Проверить вкладку Network - найти запросы к /catalog/');

