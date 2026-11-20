#!/usr/bin/env node
/**
 * Живая проверка фундамента при поднятом API :8101 (и желательно Vite :8100).
 * Не меняет файлы. Падает, если периметр снова открыт.
 */
const API = process.env.FOUNDATION_API || 'http://127.0.0.1:8101';
const VITE = process.env.FOUNDATION_VITE || 'http://127.0.0.1:8100';

const fails = [];
function ok(msg) {
  console.log('PASS', msg);
}
function bad(msg) {
  console.error('FAIL', msg);
  fails.push(msg);
}

async function status(url) {
  try {
    const r = await fetch(url, { redirect: 'manual' });
    return r.status;
  } catch (e) {
    return { error: e?.message || String(e) };
  }
}

async function main() {
  const health = await status(`${API}/api/health`);
  if (health === 200) ok(`API health ${API}`);
  else {
    bad(`API недоступен (${API}/api/health => ${JSON.stringify(health)}). Подними npm run dev:server`);
    console.error(`\nfoundation-live: ${fails.length} fail(s)`);
    process.exit(1);
  }

  const must404 = [
    '/server.js',
    '/package.json',
    '/db.json',
    '/AI_PILOT.env',
    '/room_steps_config.json',
    '/ai-pilot/ai_pilot_config.json',
    '/ai-pilot/register-routes.js',
    '/projects/__foundation_probe__.json',
    '/modules/__foundation_probe__.json',
    '/tmp-upper-g-card-dump.json',
    '/_tmp_c44.json',
    '/server.js.bak',
    '/catalog_items/_backups/__probe__.json',
  ];
  for (const path of must404) {
    const s = await status(`${API}${path}`);
    if (s === 404) ok(`404 ${path}`);
    else bad(`ожидали 404 ${path}, получили ${s}`);
  }

  const must200 = ['/api/health', '/catalog_items/catalog_33.json'];
  for (const path of must200) {
    const s = await status(`${API}${path}`);
    if (s === 200) ok(`200 ${path}`);
    else bad(`ожидали 200 ${path}, получили ${s}`);
  }

  try {
    const hr = await fetch(`${API}/api/health`, { redirect: 'manual' });
    const nosniff = hr.headers.get('x-content-type-options');
    const frame = hr.headers.get('x-frame-options');
    const ref = hr.headers.get('referrer-policy');
    const powered = hr.headers.get('x-powered-by');
    if (String(nosniff || '').toLowerCase() === 'nosniff') ok('header nosniff');
    else bad(`X-Content-Type-Options=${nosniff}`);
    if (String(frame || '').toUpperCase() === 'SAMEORIGIN') ok('header SAMEORIGIN');
    else bad(`X-Frame-Options=${frame}`);
    if (String(ref || '') === 'strict-origin-when-cross-origin') ok('header Referrer-Policy');
    else bad(`Referrer-Policy=${ref}`);
    if (!powered) ok('no X-Powered-By');
    else bad(`X-Powered-By still set: ${powered}`);
  } catch (e) {
    bad(`headers check: ${e?.message || e}`);
  }

  const viteCat = await status(`${VITE}/catalog_items/catalog_33.json?t=1`);
  if (viteCat === 200) ok(`Vite catalog proxy ${VITE}`);
  else if (viteCat?.error) {
    console.warn('SKIP Vite (не запущен):', viteCat.error);
  } else {
    bad(`Vite /catalog_items => ${viteCat} (нужен npm run dev на 8100)`);
  }

  if (fails.length) {
    console.error(`\nfoundation-live: ${fails.length} fail(s)`);
    process.exit(1);
  }
  console.log('\nfoundation-live: OK');
}

main();
