/**
 * Поиск каталога через Network запросы и альтернативные методы
 * Выполните: findCatalogViaNetwork()
 */

// Сохраняем оригинальный fetch для перехвата
const originalFetch = window.fetch;
let interceptedRequests = [];

// Перехватываем fetch запросы
window.fetch = function(...args) {
  const url = args[0];
  if (typeof url === 'string' && (url.includes('catalog') || url.includes('module') || url.includes('item'))) {
    console.log('🔍 Обнаружен запрос к каталогу:', url);
    interceptedRequests.push({ url, args });
  }
  return originalFetch.apply(this, args);
};

// Перехватываем XMLHttpRequest
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method, url, ...rest) {
  this._url = url;
  if (typeof url === 'string' && (url.includes('catalog') || url.includes('module') || url.includes('item'))) {
    console.log('🔍 Обнаружен XHR запрос к каталогу:', method, url);
    interceptedRequests.push({ method, url, type: 'xhr' });
  }
  return originalXHROpen.apply(this, [method, url, ...rest]);
};

XMLHttpRequest.prototype.send = function(...args) {
  if (this._url) {
    this.addEventListener('load', function() {
      if (this._url.includes('catalog') || this._url.includes('module')) {
        try {
          const response = JSON.parse(this.responseText);
          console.log('📦 Ответ от каталога:', response);
          if (response && (response.items || response.data || Array.isArray(response))) {
            console.log('🎉 ВОЗМОЖНО НАЙДЕН КАТАЛОГ В ОТВЕТЕ!');
            window._foundCatalogData = response;
          }
        } catch(e) {
          // Не JSON или другая ошибка
        }
      }
    });
  }
  return originalXHRSend.apply(this, args);
};

function findCatalogViaNetwork() {
  console.log('🔍 Поиск каталога через Network запросы...\n');
  console.log('💡 Теперь перехватываю все запросы к каталогу');
  console.log('📋 Сделайте следующее:');
  console.log('   1. Откройте вкладку Network (Сеть) в DevTools');
  console.log('   2. Кликните на кнопку "Каталог" или "Модули" в интерфейсе Clodis');
  console.log('   3. Или обновите страницу (F5)');
  console.log('   4. Вернитесь в Console и проверьте перехваченные запросы');
  console.log('\n📊 Перехваченные запросы будут сохранены в interceptedRequests');
}

/**
 * Показать перехваченные запросы
 */
function showInterceptedRequests() {
  console.log('📊 Перехваченные запросы:', interceptedRequests.length);
  interceptedRequests.forEach((req, i) => {
    console.log(`${i + 1}. ${req.type || 'fetch'}:`, req.url);
  });
  
  if (window._foundCatalogData) {
    console.log('\n🎉 Найдены данные каталога в window._foundCatalogData');
    console.log('   Структура:', Object.keys(window._foundCatalogData));
  }
}

/**
 * Попытка найти каталог через анализ страницы
 */
function analyzePageForCatalog() {
  console.log('🔍 Анализ страницы для поиска каталога...\n');
  
  // 1. Поиск в window
  console.log('1️⃣ Проверка window:');
  const windowKeys = Object.keys(window).filter(k => 
    k.toLowerCase().includes('catalog') || 
    k.toLowerCase().includes('module') ||
    k.toLowerCase().includes('plan')
  );
  if (windowKeys.length > 0) {
    console.log('   Найдены ключи:', windowKeys);
    windowKeys.forEach(key => {
      try {
        const obj = window[key];
        console.log(`   ${key}:`, typeof obj, obj ? Object.keys(obj).slice(0, 5) : 'null');
      } catch(e) {}
    });
  }
  
  // 2. Поиск в data-атрибутах
  console.log('\n2️⃣ Поиск в data-атрибутах:');
  const elementsWithData = document.querySelectorAll('[data-catalog], [data-module], [data-items]');
  if (elementsWithData.length > 0) {
    console.log(`   Найдено ${elementsWithData.length} элементов с data-атрибутами`);
  }
  
  // 3. Поиск в скриптах с типом application/json
  console.log('\n3️⃣ Поиск JSON данных в скриптах:');
  const jsonScripts = Array.from(document.querySelectorAll('script[type="application/json"]'));
  jsonScripts.forEach((script, i) => {
    try {
      const data = JSON.parse(script.textContent);
      if (data && (data.items || data.catalog || Array.isArray(data))) {
        console.log(`   ✅ Найден JSON в скрипте #${i}:`, Object.keys(data));
        window._foundCatalogData = data;
      }
    } catch(e) {}
  });
  
  // 4. Поиск в localStorage
  console.log('\n4️⃣ Поиск в localStorage:');
  try {
    const storageKeys = Object.keys(localStorage);
    const catalogKeys = storageKeys.filter(k => 
      k.toLowerCase().includes('catalog') || 
      k.toLowerCase().includes('module') ||
      k.toLowerCase().includes('item')
    );
    if (catalogKeys.length > 0) {
      console.log('   Найдены ключи:', catalogKeys);
      catalogKeys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data && (data.items || Array.isArray(data))) {
            console.log(`   ✅ Возможно каталог в ${key}:`, Object.keys(data));
            window._foundCatalogData = data;
          }
        } catch(e) {}
      });
    }
  } catch(e) {
    console.log('   ⚠️ Ошибка доступа к localStorage');
  }
  
  if (window._foundCatalogData) {
    console.log('\n🎉 Данные каталога найдены в window._foundCatalogData!');
    return window._foundCatalogData;
  }
  
  console.log('\n❌ Каталог не найден через анализ страницы');
  return null;
}

/**
 * Попытка загрузить каталог через клик на элементы интерфейса
 */
async function tryLoadCatalogByClick() {
  console.log('🖱️ Попытка загрузить каталог через взаимодействие...\n');
  
  // Ищем все элементы, связанные с каталогом
  const selectors = [
    'a[href*="catalog"]',
    'a[href*="module"]',
    'button:contains("Каталог")',
    'button:contains("Модули")',
    '[data-action*="catalog"]',
    '[onclick*="catalog"]'
  ];
  
  const foundElements = [];
  selectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => foundElements.push(el));
    } catch(e) {}
  });
  
  // Также ищем по тексту
  const allLinks = Array.from(document.querySelectorAll('a, button'));
  allLinks.forEach(el => {
    const text = el.textContent.toLowerCase();
    if (text.includes('каталог') || text.includes('catalog') || text.includes('модул')) {
      foundElements.push(el);
    }
  });
  
  if (foundElements.length > 0) {
    console.log(`✅ Найдено ${foundElements.length} элементов, связанных с каталогом:`);
    foundElements.slice(0, 5).forEach((el, i) => {
      console.log(`   ${i + 1}. ${el.tagName} - "${el.textContent.trim().substring(0, 50)}"`);
    });
    console.log('\n💡 ВАЖНО: Кликните на один из этих элементов вручную!');
    console.log('   После клика подождите 2-3 секунды и выполните:');
    console.log('   checkClodisAccess()');
  } else {
    console.log('❌ Не найдено элементов интерфейса для каталога');
  }
  
  return foundElements;
}

// Инструкции
console.log(`
╔══════════════════════════════════════════════════════════════╗
║  ПОИСК КАТАЛОГА ЧЕРЕЗ NETWORK И АНАЛИЗ СТРАНИЦЫ            ║
╚══════════════════════════════════════════════════════════════╝

📋 ДОСТУПНЫЕ КОМАНДЫ:

1. findCatalogViaNetwork()
   → Включает перехват Network запросов
   → После этого кликните на "Каталог" в интерфейсе

2. analyzePageForCatalog()
   → Анализирует страницу на наличие данных каталога
   → Проверяет localStorage, data-атрибуты, JSON скрипты

3. tryLoadCatalogByClick()
   → Находит элементы интерфейса для каталога
   → Показывает, на что нужно кликнуть

4. showInterceptedRequests()
   → Показывает перехваченные Network запросы

🚀 НАЧНИТЕ С: findCatalogViaNetwork() и analyzePageForCatalog()
`);

