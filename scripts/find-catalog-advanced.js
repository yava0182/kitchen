/**
 * Расширенный поиск каталога Clodis
 * Выполните: findCatalogAdvanced()
 */

function findCatalogAdvanced() {
  console.log('🔍 Расширенный поиск каталога Clodis...\n');
  
  // 1. Проверка всех глобальных переменных
  console.log('1️⃣ Поиск глобальных переменных:');
  const globalVars = [];
  for (let key in window) {
    try {
      if (key.toLowerCase().includes('plan') || 
          key.toLowerCase().includes('catalog') || 
          key.toLowerCase().includes('pp') ||
          key.toLowerCase().includes('lib')) {
        globalVars.push(key);
      }
    } catch(e) {}
  }
  console.log('   Найдены подозрительные переменные:', globalVars);
  
  // 2. Проверка конкретных вариантов
  console.log('\n2️⃣ Проверка конкретных вариантов:');
  const checks = [
    { name: 'pp', obj: typeof pp !== 'undefined' ? pp : null },
    { name: 'window.pp', obj: window.pp },
    { name: 'Clodis', obj: window.Clodis },
    { name: 'clodis', obj: window.clodis },
    { name: 'pp_libs', obj: window.pp_libs },
    { name: 'ppLibs', obj: window.ppLibs },
  ];
  
  for (const check of checks) {
    if (check.obj) {
      console.log(`   ✅ ${check.name} найден!`);
      console.log('      Тип:', typeof check.obj);
      console.log('      Ключи:', Object.keys(check.obj).slice(0, 10));
      
      // Проверяем наличие catalogs
      if (check.obj.libs && check.obj.libs.catalogs) {
        console.log('      🎉 НАЙДЕН КАТАЛОГ через ' + check.name + '!');
        return check.obj;
      }
      if (check.obj.catalogs) {
        console.log('      🎉 НАЙДЕН КАТАЛОГ через ' + check.name + '!');
        return check.obj;
      }
    } else {
      console.log(`   ❌ ${check.name} не найден`);
    }
  }
  
  // 3. Поиск через DOM
  console.log('\n3️⃣ Поиск через DOM и скрипты:');
  const scripts = document.querySelectorAll('script');
  let foundInScripts = false;
  for (const script of scripts) {
    if (script.textContent && (
      script.textContent.includes('pp.libs.catalogs') ||
      script.textContent.includes('catalogs') ||
      script.textContent.includes('Clodis')
    )) {
      console.log('   ✅ Найден скрипт с упоминанием каталога');
      foundInScripts = true;
      break;
    }
  }
  if (!foundInScripts) {
    console.log('   ⚠️ Не найдено упоминаний в скриптах');
  }
  
  // 4. Проверка через события загрузки
  console.log('\n4️⃣ Попытка найти через ожидание загрузки:');
  console.log('   💡 Попробуйте подождать несколько секунд и выполнить:');
  console.log('      waitForCatalog()');
  
  return null;
}

/**
 * Ожидание загрузки каталога
 */
function waitForCatalog(maxWait = 10000) {
  console.log(`⏳ Ожидание загрузки каталога (макс. ${maxWait/1000} сек)...`);
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      // Проверяем разные варианты
      if (typeof pp !== 'undefined' && pp.libs && pp.libs.catalogs) {
        clearInterval(interval);
        console.log('✅ Каталог найден через pp!');
        resolve(pp);
        return;
      }
      
      if (window.pp && window.pp.libs && window.pp.libs.catalogs) {
        clearInterval(interval);
        console.log('✅ Каталог найден через window.pp!');
        resolve(window.pp);
        return;
      }
      
      // Проверяем время ожидания
      if (Date.now() - startTime > maxWait) {
        clearInterval(interval);
        console.log('❌ Каталог не загрузился за отведённое время');
        console.log('💡 Попробуйте:');
        console.log('   1. Обновить страницу (F5)');
        console.log('   2. Кликнуть на какую-то кнопку в интерфейсе (может запустить загрузку)');
        console.log('   3. Перейти в раздел каталога через меню');
        resolve(null);
        return;
      }
      
      // Показываем прогресс каждые 2 секунды
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      if (elapsed % 2 === 0 && elapsed > 0) {
        console.log(`   ⏳ Прошло ${elapsed} сек...`);
      }
    }, 500);
  });
}

/**
 * Попытка найти каталог через взаимодействие с интерфейсом
 */
function tryTriggerCatalogLoad() {
  console.log('🖱️ Попытка запустить загрузку каталога через взаимодействие...');
  
  // Ищем кнопки/ссылки, связанные с каталогом
  const catalogLinks = Array.from(document.querySelectorAll('a, button')).filter(el => {
    const text = el.textContent.toLowerCase();
    return text.includes('каталог') || text.includes('catalog') || text.includes('модул');
  });
  
  if (catalogLinks.length > 0) {
    console.log(`   Найдено ${catalogLinks.length} элементов, связанных с каталогом`);
    console.log('   💡 Попробуйте кликнуть на один из них вручную');
  } else {
    console.log('   ⚠️ Не найдено элементов интерфейса для каталога');
  }
  
  // Проверяем наличие iframe
  const iframes = document.querySelectorAll('iframe');
  if (iframes.length > 0) {
    console.log(`   Найдено ${iframes.length} iframe`);
    console.log('   💡 Каталог может быть в iframe, попробуйте:');
    console.log('      checkIframeCatalogs()');
  }
}

/**
 * Проверка каталога в iframe
 */
function checkIframeCatalogs() {
  const iframes = document.querySelectorAll('iframe');
  console.log(`🔍 Проверка ${iframes.length} iframe...`);
  
  for (let i = 0; i < iframes.length; i++) {
    try {
      const iframe = iframes[i];
      const iframeWindow = iframe.contentWindow;
      if (iframeWindow && iframeWindow.pp && iframeWindow.pp.libs && iframeWindow.pp.libs.catalogs) {
        console.log(`✅ Каталог найден в iframe #${i}!`);
        return iframeWindow.pp;
      }
    } catch (e) {
      console.log(`   ⚠️ Не удалось проверить iframe #${i} (CORS или другая причина)`);
    }
  }
  
  console.log('❌ Каталог не найден в iframe');
  return null;
}

// Инструкции
console.log(`
╔══════════════════════════════════════════════════════════════╗
║  РАСШИРЕННЫЙ ПОИСК КАТАЛОГА Clodis                       ║
╚══════════════════════════════════════════════════════════════╝

📋 ДОСТУПНЫЕ КОМАНДЫ:

1. findCatalogAdvanced()
   → Расширенный поиск каталога во всех возможных местах

2. waitForCatalog()
   → Ожидает загрузки каталога (до 10 секунд)
   → Используйте, если каталог загружается асинхронно

3. tryTriggerCatalogLoad()
   → Пытается найти элементы интерфейса для запуска загрузки

4. checkIframeCatalogs()
   → Проверяет каталог в iframe (если есть)

🚀 НАЧНИТЕ С: findCatalogAdvanced()
`);

