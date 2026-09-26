import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [
    // admin-new-bundle.js — отдаём как есть, без разбора (парсер Vite падает на HTML в строках)
    {
      name: 'skip-admin-bundle-transform',
      enforce: 'pre',
      transform(code, id) {
        const normalized = id.replace(/\\/g, '/');
        if (normalized.includes('admin-new-bundle.js')) {
          return { code: code ?? '', map: null };
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'index-refactored': resolve(__dirname, 'index-refactored.html'),
        poc: resolve(__dirname, 'poc.html'),
        'constructor-clodis': resolve(__dirname, 'constructor-clodis.html'),
        'admin-new': resolve(__dirname, 'admin-new.html'),
        'admin-room-management': resolve(__dirname, 'admin-room-management.html'),
        'admin-room-management-2': resolve(__dirname, 'admin-room-management-2.html'),
        'assembly-player': resolve(__dirname, 'assembly-player.html'),
        // constructor: resolve(__dirname, 'constructor.html'), // Старый объединенный файл
      },
    },
  },
  server: {
    port: 8100, // Теперь Vite слушает на 8000
    host: '0.0.0.0', // Listen on all network interfaces (IPv4 and IPv6)
    open: false, // Не открывать автоматически
    strictPort: false,
    cors: true, // allow loading modules from other local ports (e.g. :8001 API)
    proxy: {
      // Проксируем API запросы к Express server (порт 8001)
      '/api': {
        target: 'http://localhost:8101',
        changeOrigin: true,
      },
      '/catalog': {
        target: 'http://localhost:8101',
        changeOrigin: true,
      },
      // ⚠️ ИСПРАВЛЕНО: Убрали прокси для /data - Vite сам отдает файлы из public/data/
      // Файлы из public/data/ доступны напрямую через /data/*.json
      // Если нужен Express для записи данных, можно вернуть прокси, но для чтения Vite достаточно
      // '/data': {
      //   target: 'http://localhost:8000',
      //   changeOrigin: true,
      // },
      // ⭐ УБРАНО: Прокси для /images - Vite сам отдает файлы из public/
      // Если нужен Express для картинок, можно вернуть, но сейчас используем Vite
      // '/images': {
      //   target: 'http://localhost:8000',
      //   changeOrigin: true,
      // },
    },
  },
  optimizeDeps: {
    include: ['three'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@js': resolve(__dirname, 'js'),
    },
  },
});



