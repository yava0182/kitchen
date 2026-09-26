/**
 * Запуск API-сервера на порту 8001 для работы с Vite (dev:all).
 * Vite на 8000 проксирует /api на localhost:8001.
 */
process.env.PORT = '8101';
import('./server.js');
