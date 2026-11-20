/**
 * Запуск API-сервера кухни на порту 8101 для работы с Vite (dev:all).
 * Vite на 8100 проксирует /api на localhost:8101.
 * Шкафы (8000/8001) не трогаем.
 */
process.env.PORT = '8101';
import('./server.js');
