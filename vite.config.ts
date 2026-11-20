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
    // Канон каталога: catalog_items/ на диске через API :8101.
    // Без этого Vite отдаёт public/catalog_items (зеркало) раньше proxy — комната видит устаревшее.
    {
      name: 'catalog-items-from-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const raw = req.url || '';
          if (!raw.startsWith('/catalog_items')) return next();
          try {
            const upstream = await fetch(`http://127.0.0.1:8101${raw}`);
            const buf = Buffer.from(await upstream.arrayBuffer());
            res.statusCode = upstream.status;
            res.setHeader(
              'Content-Type',
              upstream.headers.get('content-type') || 'application/json; charset=utf-8'
            );
            res.setHeader('Cache-Control', 'no-store');
            res.end(buf);
          } catch (e) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(
              JSON.stringify({
                error: 'catalog_items_proxy_failed',
                message: e?.message || String(e),
              })
            );
          }
        });
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
      },
    },
  },
  server: {
    port: 8100,
    host: '127.0.0.1',
    open: false,
    strictPort: true,
    cors: true,
    headers: {
      'Cache-Control': 'no-store',
    },
    watch: {
      ignored: [
        '**/docs/ikea-kitchen-slope-dump/**',
        '**/docs/**/*.js',
        '**/node_modules/**',
        '**/.rollback/**',
        '**/_rollback/**',
      ],
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8101',
        changeOrigin: true,
      },
      '/catalog': {
        target: 'http://127.0.0.1:8101',
        changeOrigin: true,
      },
      // Дубль на случай путей без middleware; чтение комнаты закрывает plugin выше.
      '/catalog_items': {
        target: 'http://127.0.0.1:8101',
        changeOrigin: true,
      },
    },
  },
  // Запрет discovery/prebundle (Vite 5.1+): иначе 2× THREE → серый IKEA_PORT.
  optimizeDeps: {
    noDiscovery: true,
    include: [],
  },
  resolve: {
    dedupe: ['three'],
    alias: {
      '@': resolve(__dirname, 'src'),
      '@js': resolve(__dirname, 'js'),
    },
  },
});
