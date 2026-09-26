/**
 * Простой поиск каталога - выполните все команды по очереди
 * Скопируйте этот файл в консоль и выполните команды
 */

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  ПОИСК КАТАЛОГА - ВЫПОЛНИТЕ КОМАНДЫ ПО ОЧЕРЕДИ           ║
╚══════════════════════════════════════════════════════════════╝

📋 ВЫПОЛНИТЕ ЭТИ КОМАНДЫ В КОНСОЛИ ПО ОЧЕРЕДИ:

1. Object.keys(window).filter(k => k.toLowerCase().includes('catalog') || k.toLowerCase().includes('module'))

2. Object.keys(window).filter(k => k.toLowerCase().includes('pp') || k.toLowerCase().includes('plan'))

3. Object.keys(localStorage).filter(k => k.toLowerCase().includes('catalog') || k.toLowerCase().includes('module'))

4. document.querySelectorAll('script[type="application/json"]')

5. JSON.parse(localStorage.getItem('catalog')) // если есть ключ catalog

💡 После каждой команды смотрите результат и покажите скриншот!
`);

