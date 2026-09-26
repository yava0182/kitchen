/**
 * Конфигурация API
 * Определяет базовый URL для API запросов
 */

// Определяем базовый URL API
// В разработке через Vite (порт 5173): используем относительный путь (Vite проксирует к Express на порту 8000)
// В продакшене: относительный путь (тот же домен)
export const API_BASE_URL = (() => {
  // Если есть переменная окружения VITE_API_URL, используем её
  if ((import.meta as any).env?.VITE_API_URL) {
    return (import.meta as any).env.VITE_API_URL;
  }

  // ⭐ ИСПРАВЛЕНО: В режиме разработки используем относительный путь
  // Vite dev server (порт 5173) проксирует запросы к Express server (порт 8000)
  // через настройку proxy в vite.config.ts
  // Это работает как в dev (через Vite), так и в production (относительный путь)
  return '';
})();

console.log('🔧 API Base URL:', API_BASE_URL || '(относительный путь)', {
  isDev: (import.meta as any).env?.DEV,
  isViteDev: window.location.port === '5173',
  currentPort: window.location.port,
  viteApiUrl: (import.meta as any).env?.VITE_API_URL,
});
