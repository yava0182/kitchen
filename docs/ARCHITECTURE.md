# Архитектура Clodis Kitchen (рабочий каркас)

**Зачем:** чтобы при росте файлов/канонов/задач не закапываться и чтобы агент не ломал комнату «заодно».  
**Не цель:** копировать PlanPlace. Логика кухни — **наша** (`KITCHEN-RULES`, каноны).  
**Шкафы** (Wardrobes / другой репозиторий) — **вне** этой архитектуры.

Связанное: [`KITCHEN-DOMAIN.md`](./KITCHEN-DOMAIN.md) · [`KITCHEN-RULES.md`](./KITCHEN-RULES.md) · [`SMOKE-ROOM-CHECK.md`](./SMOKE-ROOM-CHECK.md)

---

## 1. Четыре слоя (смотреть сюда всегда)

```
┌─────────────────────────────────────────┐
│  A. КАНОН     правда продукта (мм, роли) │  docs/*CANON*, KITCHEN-RULES, profile
├─────────────────────────────────────────┤
│  B. МОЗГ      расчёт без «рисунка»       │  js/kitchen/*, js/kitchen-brain/*
├─────────────────────────────────────────┤
│  C. КАРТИНКА  Three / размеры / UI       │  scene, dims, steps, ikea-port…
├─────────────────────────────────────────┤
│  D. ПАМЯТЬ    save/load / draft          │  room-draft, projects, autosave
└─────────────────────────────────────────┘
```

| Слой | Что это простыми словами | Где лежит | Менять когда |
|------|---------------------------|-----------|--------------|
| **A Канон** | «Так должно быть всегда» | `docs/KITCHEN-RULES.md`, `*-CANON.md`, `data/kitchen_manufacturing_profile.json` | Только фраза «сменить канон …» |
| **B Мозг** | Считает мм/посадку/стык | `js/kitchen/*`, `js/kitchen-brain/*` | Режим `geometry` / `canon` |
| **C Картинка** | Рисует и кликается | сцена, размеры, UI, рендер | UI / `perf` (без смены мм) |
| **D Память** | Запомнить/открыть проект | draft, projects, autosave | Отдельная задача «сейв» |

**Железное правило:**  
`perf` → только C (иногда D: кэш), **не** A и не формулы B.  
`canon` → A, потом B под A.  
`geometry` → B (+ тонкая C, если надо показать).  
Слои не смешивать в одном диффе без явной просьбы.

---

## 2. Карта «куда смотреть» (не весь репозиторий)

### A — Канон (источник правды)
| Документ | О чём |
|----------|--------|
| `docs/KITCHEN-RULES.md` | Живой контракт: запреты, глубина ряда, НМ / пенал / НШ |
| `docs/KITCHEN-DOMAIN.md` | Роли модулей, обзор домена |
| `docs/NMU-CANON.md` | Угловой низ |
| `docs/MID-UPPER-CORNER-CANON.md` | Верхний угол |
| `data/kitchen_manufacturing_profile.json` (+ `js/kitchen/kitchen-manufacturing-profile.js`) | Числа производства |

`docs/CLODIS-*-STAGE*.md` / audit — **история**, не канон. Новые stage не плодить без нужды; канон обновлять в таблице выше.

### B — Мозг (расчёт)
| Зона | Файлы (ориентир) |
|------|------------------|
| Глубина / ряд | `kitchen-depth-stack.js` |
| Секция / расклад | `kitchen-section-*.js`, `kitchen-base-engine.js` |
| Угол / Joint | `kitchen-joint.js`, `kitchen-corner-*.js`, `kitchen-upper-*.js` |
| Боковины | `kitchen-side-panels*.js` (уже режется на contract/rules/adapter) |
| Снимок комнаты без Three | `js/kitchen-brain/roomAdapter.js` |

Цель роста мозга: **новые правила → маленький файл в `js/kitchen/` или `kitchen-brain/`**, а не ещё +500 строк в `furniture-manager` / `section-manager`.

### C — Картинка
Сцена, камера, размеры, ячейки/контуры в UI, шаги комнаты, ikea-port рендер.  
Может тормозить / кэшироваться — **не** имеет права менять канон мм.

### D — Память
Autosave / draft / projects. Отдельный режим задач; не чинить «заодно» с перфом геометрии.

### Не слой продукта (не раздувать)
| Что | Зачем |
|-----|--------|
| `_checkpoint_*`, `.bak`, `.rollback` | Страховка / мусор — не рабочий код |
| `public/js/*` зеркала | Не второй источник правды |
| `public/server.js` | **DEAD MIRROR** — канон `server.js` |
| `server-db.js` | **OBSOLETE** — не `dev:server` |
| `?v=bust` в ESM import | Временный костыль кэша; не плодить разные bust на один модуль |
| PlanPlace dump / `vendor/pp-*` | Референс чужого продукта, не наша логика |

Правило агента: `.cursor/rules/foundation-sources.mdc`.

---

## 3. Как идут задачи (чтобы не закопаться)

1. Пользователь: коротко **режим** + суть (`perf` / `canon` / `geometry`) — см. `.cursor/rules/task-modes.mdc`.
2. Агент: трогает **один слой** (таблица §1), минимум файлов.
3. Приёмка: [`SMOKE-ROOM-CHECK.md`](./SMOKE-ROOM-CHECK.md) — комната целая?
4. Нет → **откат** правки, не «ещё патч сверху».
5. Да → можно следующую узкую задачу.

Один чат = один режим. Новый слой темы → лучше новый чат.

---

## 4. Что считаем «архитектура доделана» (этот каркас)

- [x] Слои A/B/C/D названы и разведены
- [x] Канон отделён от stage-истории
- [x] Режимы задачи в rules (`task-modes.mdc`)
- [x] Smoke «комната целая» записан
- [x] Правило агента: не смешивать слои (`architecture-layers.mdc`)
- [ ] Позже (не сейчас): авто-smoke в скрипте; пилить god-файлы по швам B

«Доделана» здесь = **можно опираться и идти делать фичи**, не = «весь код уже идеальный».

---

## 5. Каталог → комната (одна правда данных)

```
Админка «Сохранить»
  → POST /catalog/items_save
  → db.json (индекс)
  → catalog_items/{type}.json     ← единственный КАНОН на диске
  → (опционально) localStorage + cld_catalog_rev
Комната :8100
  → GET /catalog_items/* → Vite plugin → API :8101 → КАНОН
  → API /api/catalog/items_get/* → тот же КАНОН
```

`public/catalog_items/` — устаревшие копии (`README-STALE.txt`), **не писать** при save (можно удалить папку отдельной задачей).

### Фундамент сделано (локально, без канонов мм)

- [x] Bind `127.0.0.1`, секреты/исходники/JSON-конфиги/`projects`/`modules`/`ai-pilot/*` не через static; CORS только localhost  



- [x] Один `items_save` + modules на свой URL  
- [x] Atomic JSON + HTTP ошибки save  
- [x] Upload limits / allowlist / path jail  
- [x] AI Pilot baseUrl allowlist + atomic config  
- [x] DEAD MIRROR / OBSOLETE маркеры + `foundation-sources.mdc`  
- [x] Vite `/catalog_items` → API канон  
- [x] `npm test` = foundation-smoke; `npm run test:live` = живой периметр при поднятом :8101  
- [x] Security headers: `nosniff` / `SAMEORIGIN` / `Referrer-Policy`  
- [x] `npm run test:foundation` = smoke + live  
- [x] `x-powered-by` off; TRACE/TRACK → 405  
- [x] static deny `.bak`/`.rollback`/`.orig`/`~` + `catalog_items/_backups`  
- [x] бэкап `items_clear` через `atomicWriteJsonFile`  

### Фундамент локально — ЗАКРЫТ (2026-11-16)

Можно опираться и идти в фичи / `canon` / `geometry` / `perf` по режимам.  
Каноны мм и доменные тесты (§6) — **не** фундамент.  
Опционально позже (не блокер): allowlist static вместо `express.static(__dirname)` — отдельная задача, выше риск для комнаты.

| Сущность | Писать | Не писать «как канон» |
|----------|--------|------------------------|
| Карточка каталога | `catalog_items/*.json` | `public/catalog_items/` |
| Индекс админки | `db.json` через `writeDB` | править db руками без sync |
| JSON-модуль файл | `POST /api/modules/save` → `modules/` | путать с `/catalog/items_save` |
| Секреты | `AI_PILOT.env` вне static | ZIP / корень web |

Запись JSON на сервере: `atomicWriteJsonFile` (tmp → replace) для `db.json`, `catalog_items`, `modules`, `room_steps_config`, `constructor_ui_settings`, keys/groups/projects и др. конфигов.

Ошибки save/delete каталога: HTTP 4xx/5xx + тело `{ result: 'error', error }` (`apiError`) — не маскировать под 200.

Загрузки (multer): max **50 MB** / **20** файлов; allowlist image/model/misc; **без** `.svg`/`.js`/`.html`/`.exe`. Path jail: `safeFilesPath` / `resolveFilesManagerTarget`.

Сервер локально: `HOST=127.0.0.1`, порты Vite `8100` / API `8101`. В сеть — позже.

---

## 6. Отложено до согласования канона (не зеленеть вслепую)

| Скрипт | Симптом | Нужно решить |
|--------|---------|--------------|
| `test-5050-shelves-drawers.mjs` | ждёт 3 полки / gap 3 мм; код даёт 4 полки | канон 50/50 + min gap ящиков (3 vs 4) |
| `test-kitchen-side-panels-rules.mjs` | 13 FAIL: replacement/filler → unknown | устарел тест vs новая логика panels? |

Пока: `productionSpecAllowed: false` — не производство.  
`npm test` = только foundation-smoke (периметр/данные), не доменные мм.

AI Pilot: `baseUrl` только allowlist https-хостов (анти-SSRF).

---

## 7. Следующий шаг после этого документа

Фундамент локально закрыт (§5). Дальше — фичи / канон / геометрия / перф по режимам.  
Спокойным днём (не блокер): убрать дубли/checkpoint из ежедневного пути; опционально static-allowlist.  
Домен полок/ящиков — **отдельная задача** после твоей фразы «канон gap = N мм».
