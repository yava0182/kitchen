/**
 * Диагностический скрипт для проверки доступа к каталогу Clodis
 * Вставьте этот скрипт в консоль и выполните checkClodisAccess()
 */

function checkClodisAccess() {
  console.log('🔍 Проверка доступа к Clodis каталогу...\n');
  
  // Проверка 1: Объект pp
  console.log('1️⃣ Проверка объекта pp:');
  if (typeof pp === 'undefined') {
    console.error('❌ Объект pp не найден!');
    console.log('💡 Попробуйте перейти на главную страницу каталога или страницу конструктора');
    return false;
  }
  console.log('✅ Объект pp найден');
  console.log('   Тип:', typeof pp);
  console.log('   Ключи pp:', Object.keys(pp));
  
  // Проверка 2: pp.libs
  console.log('\n2️⃣ Проверка pp.libs:');
  if (!pp.libs) {
    console.error('❌ pp.libs не найден!');
    console.log('💡 Попробуйте перейти на страницу конструктора или главную страницу каталога');
    return false;
  }
  console.log('✅ pp.libs найден');
  console.log('   Ключи pp.libs:', Object.keys(pp.libs));
  
  // Проверка 3: pp.libs.catalogs
  console.log('\n3️⃣ Проверка pp.libs.catalogs:');
  if (!pp.libs.catalogs) {
    console.error('❌ pp.libs.catalogs не найден!');
    console.log('💡 Попробуйте:');
    console.log('   - Перейти на страницу конструктора');
    console.log('   - Или на главную страницу каталога (не страницу конкретного элемента)');
    console.log('   - Или подождать несколько секунд, пока каталог загрузится');
    return false;
  }
  console.log('✅ pp.libs.catalogs найден');
  
  // Проверка 4: Структура catalogs
  console.log('\n4️⃣ Структура pp.libs.catalogs:');
  try {
    const catalogKeys = Object.keys(pp.libs.catalogs);
    console.log('✅ Ключи каталога получены:', catalogKeys.length, 'категорий');
    console.log('   Категории:', catalogKeys);
    
    // Проверка нескольких категорий
    console.log('\n5️⃣ Проверка содержимого категорий:');
    let totalItems = 0;
    for (const key of catalogKeys.slice(0, 5)) { // Проверяем первые 5
      const catalog = pp.libs.catalogs[key];
      const items = catalog?.items || catalog?.data || catalog?.modules || [];
      const count = Array.isArray(items) ? items.length : 0;
      totalItems += count;
      console.log(`   ${key}: ${count} элементов`);
    }
    console.log(`\n📊 Всего элементов в первых 5 категориях: ${totalItems}`);
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка при доступе к каталогу:', error);
    console.log('💡 Попробуйте перейти на другую страницу');
    return false;
  }
}

/**
 * Альтернативный способ доступа к каталогу
 */
function findCatalogAlternative() {
  console.log('🔍 Поиск альтернативных способов доступа к каталогу...\n');
  
  // Вариант 1: window.pp
  if (window.pp) {
    console.log('✅ Найден window.pp');
  }
  
  // Вариант 2: глобальные переменные
  const possibleNames = ['pp', 'Clodis', 'clodis', 'catalogs', 'libs'];
  for (const name of possibleNames) {
    if (window[name]) {
      console.log(`✅ Найден window.${name}:`, typeof window[name]);
    }
  }
  
  // Вариант 3: через localStorage/sessionStorage
  console.log('\n🔍 Проверка localStorage/sessionStorage:');
  try {
    const storageKeys = Object.keys(localStorage);
    const catalogKeys = storageKeys.filter(k => k.toLowerCase().includes('catalog') || k.toLowerCase().includes('module'));
    if (catalogKeys.length > 0) {
      console.log('✅ Найдены ключи, связанные с каталогом:', catalogKeys);
    }
  } catch (e) {
    console.log('⚠️ Не удалось проверить localStorage');
  }
}

/**
 * Получить URL для правильной страницы
 */
function getCorrectPageUrl() {
  const currentUrl = window.location.href;
  console.log('📍 Текущий URL:', currentUrl);
  
  // Если мы на странице конкретного элемента каталога
  if (currentUrl.includes('/catalog/item/')) {
    console.log('\n⚠️ Вы находитесь на странице КОНКРЕТНОГО элемента каталога');
    console.log('💡 Для доступа к pp.libs.catalogs нужно перейти на:');
    console.log('   1. Страницу конструктора');
    console.log('   2. Или главную страницу каталога (список всех элементов)');
    console.log('   3. Или страницу настроек/конфигурации');
    
    // Пытаемся определить базовый URL
    const baseUrl = currentUrl.split('/catalog/item/')[0];
    console.log('\n🔗 Возможные ссылки:');
    console.log('   Конструктор:', baseUrl + '/constructor');
    console.log('   Каталог:', baseUrl + '/catalog');
    console.log('   Настройки:', baseUrl + '/config');
  }
}

// Автоматический запуск проверки
console.log(`
╔══════════════════════════════════════════════════════════════╗
║  ДИАГНОСТИКА ДОСТУПА К КАТАЛОГУ Clodis                  ║
╚══════════════════════════════════════════════════════════════╝

📋 ДОСТУПНЫЕ КОМАНДЫ:

1. checkClodisAccess()
   → Проверяет доступ к pp.libs.catalogs
   → Показывает структуру каталога

2. findCatalogAlternative()
   → Ищет альтернативные способы доступа

3. getCorrectPageUrl()
   → Показывает, на какой странице вы находитесь
   → Предлагает правильные ссылки

🚀 НАЧНИТЕ С: checkClodisAccess()
`);

// Автоматически проверяем URL
getCorrectPageUrl();

