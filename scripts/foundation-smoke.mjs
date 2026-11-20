#!/usr/bin/env node
/**
 * Статическая проверка фундамента (без поднятия сервера).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverPath = path.join(root, 'server.js');
const vitePath = path.join(root, 'vite.config.ts');
const archPath = path.join(root, 'docs', 'ARCHITECTURE.md');
const modesPath = path.join(root, '.cursor', 'rules', 'task-modes.mdc');

const fails = [];
function ok(msg) {
  console.log('PASS', msg);
}
function bad(msg) {
  console.error('FAIL', msg);
  fails.push(msg);
}

const server = fs.readFileSync(serverPath, 'utf8');
const vite = fs.readFileSync(vitePath, 'utf8');
const arch = fs.existsSync(archPath) ? fs.readFileSync(archPath, 'utf8') : '';

const savePosts = [...server.matchAll(/app\.post\(\s*['"`]\/catalog\/items_save/g)];
if (savePosts.length === 1) ok('один POST /catalog/items_save');
else bad(`ожидали 1 POST /catalog/items_save, найдено ${savePosts.length}`);

if (/app\.post\(\s*['"`]\/api\/modules\/save/.test(server) && /function saveModuleJsonFile/.test(server)) {
  ok('modules save вынесен в /api/modules/save');
} else {
  bad('нет saveModuleJsonFile /api/modules/save');
}

if (/const HOST = process\.env\.HOST \|\| '127\.0\.0\.1'/.test(server) && /app\.listen\(PORT, HOST/.test(server)) {
  ok('server bind HOST default 127.0.0.1');
} else {
  bad('server не слушает HOST=127.0.0.1 по умолчанию');
}

if (/host:\s*'127\.0\.0\.1'/.test(vite)) ok('vite host 127.0.0.1');
else bad('vite.config.ts host не 127.0.0.1');

if (
  /catalog-items-from-api/.test(vite) &&
  /\/catalog_items/.test(vite) &&
  /127\.0\.0\.1:8101/.test(vite)
) {
  ok('Vite: /catalog_items → API 8101');
} else {
  bad('нет Vite proxy/plugin catalog_items → 8101');
}

if (
  /ai_pilot\.env/i.test(server) &&
  /\/db\.json/.test(server) &&
  /alwaysBlockedExact/.test(server) &&
  /\/server\.js/.test(server) &&
  /\/room_steps_config\.json/.test(server) &&
  /CORS_ORIGINS/.test(server) &&
  /'\/projects\/'/.test(server) &&
  /'\/modules\/'/.test(server) &&
  /'\/ai-pilot\/'/.test(server)
) {
  ok('static deny + CORS + projects/modules/ai-pilot');
} else {
  bad('нет deny конфигов/CORS/projects/modules');
}

if (
  /function atomicWriteJsonFile/.test(server) &&
  /atomicWriteJsonFile\(DB_FILE/.test(server) &&
  /atomicWriteJsonFile\(file, payload\)/.test(server)
) {
  ok('atomicWriteJsonFile для db + catalog_items');
} else {
  bad('нет atomicWriteJsonFile на db/catalog_items');
}

// saveCatalogItems больше не дублирует в public/
{
  const m = server.match(/function saveCatalogItems\([\s\S]*?\nfunction /);
  const body = m ? m[0] : '';
  if (
    body &&
    /atomicWriteJsonFile\(file, payload\)/.test(body) &&
    !/pubDir|pubFile|public.*catalog_items/.test(body)
  ) {
    ok('saveCatalogItems только канон (без public mirror)');
  } else {
    bad('saveCatalogItems всё ещё пишет public mirror или сломан');
  }
}

const aiPilotRoutesCheck = path.join(root, 'ai-pilot', 'register-routes.js');
if (fs.existsSync(aiPilotRoutesCheck)) {
  const ap2 = fs.readFileSync(aiPilotRoutesCheck, 'utf8');
  if (/atomicWriteJsonLocal/.test(ap2) && /atomicWriteJsonLocal\(CONFIG_FILE/.test(ap2)) {
    ok('AI Pilot config atomic write');
  } else {
    bad('нет atomic write для AI Pilot config');
  }
}

if (
  /atomicWriteJsonFile\(ROOM_STEPS_CONFIG_FILE/.test(server) &&
  /atomicWriteJsonFile\(CONSTRUCTOR_UI_SETTINGS_FILE/.test(server) &&
  /atomicWriteJsonFile\(ROOM_FURNITURE_BY_ROOM_FILE/.test(server) &&
  /atomicWriteJsonFile\(CATALOGS_KEYS_FILE/.test(server)
) {
  ok('atomicWrite для room_steps / UI / catalogs_keys');
} else {
  bad('нет atomicWrite на room_steps/UI/keys');
}

if (
  /function apiError\(/.test(server) &&
  /apiError\(res, 500, 'Database read error'\)/.test(server) &&
  /apiError\(res, 500, 'Database write error'\)/.test(server)
) {
  ok('apiError на catalog save/delete');
} else {
  bad('нет apiError на ошибках catalog save');
}

if (
  /UPLOAD_MAX_FILE_BYTES/.test(server) &&
  /multer\.memoryStorage\(\)/.test(server) &&
  /UPLOAD_BLOCKED_EXT/.test(server) &&
  /uploadExtAllowed/.test(server)
) {
  ok('upload limits + allowlist');
} else {
  bad('нет лимитов/allowlist на multer upload');
}

if (/path\.relative\(baseDir, full\)/.test(server) && /relToBase\.startsWith\('\.\.'\)/.test(server)) {
  ok('safeFilesPath path jail');
} else {
  bad('safeFilesPath без path jail через relative');
}

if (fs.existsSync(archPath)) ok('docs/ARCHITECTURE.md есть');
else bad('нет docs/ARCHITECTURE.md');

if (/Каталог → комната|catalog_items\/\{type\}/.test(arch)) {
  ok('ARCHITECTURE: схема каталог → комната');
} else {
  bad('в ARCHITECTURE нет схемы каталог → комната');
}

if (fs.existsSync(modesPath)) ok('task-modes.mdc есть');
else bad('нет .cursor/rules/task-modes.mdc');

const aiPilotRoutes = path.join(root, 'ai-pilot', 'register-routes.js');
if (fs.existsSync(aiPilotRoutes)) {
  const ap = fs.readFileSync(aiPilotRoutes, 'utf8');
  if (/AI_PILOT_BASEURL_ALLOW/.test(ap) && /sanitizeAiPilotBaseUrl/.test(ap)) {
    ok('AI Pilot baseUrl allowlist (anti-SSRF)');
  } else {
    bad('нет allowlist baseUrl в ai-pilot');
  }
} else {
  bad('нет ai-pilot/register-routes.js');
}

const pubServer = path.join(root, 'public', 'server.js');
if (fs.existsSync(pubServer) && /DEAD MIRROR/.test(fs.readFileSync(pubServer, 'utf8').slice(0, 800))) {
  ok('public/server.js помечен DEAD MIRROR');
} else if (!fs.existsSync(pubServer)) {
  ok('public/server.js отсутствует (ок)');
} else {
  bad('public/server.js без маркера DEAD MIRROR');
}

const serverDb = path.join(root, 'server-db.js');
if (fs.existsSync(serverDb) && /OBSOLETE/.test(fs.readFileSync(serverDb, 'utf8').slice(0, 400))) {
  ok('server-db.js помечен OBSOLETE');
} else if (!fs.existsSync(serverDb)) {
  ok('server-db.js отсутствует (ок)');
} else {
  bad('server-db.js без маркера OBSOLETE');
}

const srcRule = path.join(root, '.cursor', 'rules', 'foundation-sources.mdc');
if (fs.existsSync(srcRule)) ok('foundation-sources.mdc есть');
else bad('нет foundation-sources.mdc');

if (
  /hasOwnProperty\.call\(body, 'move_children_to'\)/.test(server) &&
  /status\(409\).*has_children|has_children[\s\S]{0,80}status\(409\)/.test(server.replace(/\n/g, ' '))
) {
  ok('category_delete has_children → 409');
} else if (/status\(409\)/.test(server) && /has_children/.test(server) && /move_children_to/.test(server)) {
  ok('category_delete has_children → 409');
} else {
  bad('category_delete has_children не на 409 / баг move_children_to');
}

const staleReadme = path.join(root, 'public', 'catalog_items', 'README-STALE.txt');
if (fs.existsSync(staleReadme)) ok('public/catalog_items помечен STALE');
else bad('нет README-STALE в public/catalog_items');

if (/отладочные дампы/.test(server) && /-dump\\.json/.test(server)) {
  ok('static deny для tmp/dump json');
} else {
  bad('нет deny для tmp/dump json в static');
}

if (
  /X-Content-Type-Options['",\s]+nosniff/.test(server) &&
  /X-Frame-Options['",\s]+SAMEORIGIN/.test(server) &&
  /Referrer-Policy['",\s]+strict-origin-when-cross-origin/.test(server)
) {
  ok('security headers nosniff / SAMEORIGIN / Referrer-Policy');
} else {
  bad('нет базовых security headers в server.js');
}

if (/Фундамент локально — ЗАКРЫТ/.test(arch)) {
  ok('ARCHITECTURE: фундамент локально ЗАКРЫТ');
} else {
  bad('в ARCHITECTURE нет «Фундамент локально — ЗАКРЫТ»');
}

if (/app\.disable\(\s*['"]x-powered-by['"]\s*\)/.test(server)) {
  ok('x-powered-by disabled');
} else {
  bad('нет app.disable(x-powered-by)');
}

if (
  /TRACE/.test(server) &&
  /TRACK/.test(server) &&
  /status\(405\)/.test(server)
) {
  ok('TRACE/TRACK → 405');
} else {
  bad('нет отказа TRACE/TRACK');
}

if (/\.bak\$\/i\.test\(p\)/.test(server) && /catalog_items\\\/_backups/.test(server)) {
  ok('static deny .bak + catalog_items/_backups');
} else {
  bad('нет deny .bak/_backups в static');
}

if (/atomicWriteJsonFile\(backupPath/.test(server)) {
  ok('items_clear backup atomic');
} else {
  bad('items_clear backup не atomic');
}

const liveScript = path.join(root, 'scripts', 'foundation-live.mjs');
if (fs.existsSync(liveScript)) ok('foundation-live.mjs есть');
else bad('нет scripts/foundation-live.mjs');

if (fails.length) {
  console.error(`\nfoundation-smoke: ${fails.length} fail(s)`);
  process.exit(1);
}
console.log('\nfoundation-smoke: OK');
