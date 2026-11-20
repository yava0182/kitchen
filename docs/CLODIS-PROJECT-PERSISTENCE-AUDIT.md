# CLODIS — фундамент сохранения проектов (этап 1, аудит)

**Дата:** 2026-10-30  
**Режим:** только исследование. Рабочий код не изменялся.  
**Цель UX:** при открытии конструктора — «Продолжить / Начать заново», если есть черновик; иначе сразу новый проект (как IKEA Kitchen Planner).

---

## 1. Что уже существует

### 1.1 Dev-fixture комнаты (главный задел сериализации кухни)

**Файл:** `js/furniture/ikea-room-fixture.js`  
**Назначение (комментарий файла):** *Dev fixture* — снимок для сверки света IKEA, **не** пользовательский autosave.

| API | Назначение |
|-----|------------|
| `collectIkeaRoomFixture()` | Собрать JSON сцены |
| `exportIkeaRoomFixture()` | Collect → `POST /api/projects/save` |
| `loadIkeaRoomFixtureFromServer()` | `GET /api/projects/load/ikea_light_fixture_ikea_v0_cab.json` |
| `restoreIkeaRoomFixture(fixture)` | Очистить секции/мебель → создать секции → собрать модули → step/camera |
| `maybeAutoRestoreIkeaRoomFixture()` | Restore **только** если URL `?ikeaFixture=1` |
| Console | `__cldExportIkeaRoomFixture`, `__cldCollectIkeaRoomFixture`, `__cldRestoreIkeaRoomFixture` |

**Подключение:** `js/main-refactored.js` ~148–150 — install console + `maybeAutoRestoreIkeaRoomFixture()` после `init()`.

**Сервер:** `server.js` / `public/server.js` — `POST /api/projects/save`, `GET /api/projects/load/:fileName`, `GET /api/projects/list` → файлы в каталоге `projects/`.

### 1.2 Что fixture уже умеет сериализовать (**код** `collectIkeaRoomFixture`)

| Данные | В collect? | В restore? |
|--------|------------|------------|
| Размеры комнаты `state.room` W/D/H | да | **нет** явного apply размеров комнаты (только camera) |
| Секции: id, size, position, wallName, offsets, filler, planks, division (+ customZoneWidthsMm, parts, modules, variant) | да | да (createSection + variant + widths) |
| `kitchenBandGrids` (MID/TOP) | **нет** в collect sections | restore умеет `applyKitchenBandZoneGrids`, если поле есть |
| `lShape` / Joint угол | **нет** | **нет** |
| Мебель: clodisRoots/Data/Variables, position, rotation, scale | да | да (Furniture ctor) |
| placementKind, productKind, doorLayout/hand/kind | да | частично (profileId collect есть, **restore не пишет** `__placementKindProfileId`) |
| customDepth/Height/Width | да | да |
| `rearOffsetMm` / `frontOffsetMm` | да | да |
| TOP: `kitchenTopDepthMode` / Custom / Locked, `kitchenCarcassDepthMm` | да | да |
| `kitchenProject` (manufacturing / ритм) | да via `getKitchenProjectForSave` | `hydrateKitchenProjectFromSave` |
| Step UI | да | `goToRoomStepByNumber` |
| Camera | да | да |
| Материалы / декоры step5 | **нет** в fixture | отдельно LS |
| Окна / двери / трубы / розетки (`roomEditObjects`, water outlet) | **нет** | **нет** |
| `__kitchenSideWallClearanceMm` | **нет** (есть vars return) | через vars **частично** |

### 1.3 Другие хранилища (не «проект кухни»)

| Источник | Что хранит | Проект комнаты? |
|----------|------------|-----------------|
| `localStorage` `catalog_*` | каталог модулей | нет |
| `localStorage` `room_steps_config` | админ-конфиг шагов | нет |
| `localStorage` drill schemes/templates, hinge role defaults | фурнитура-библиотека | нет (глобально браузер) |
| `localStorage` step5 decors / params | декор модуля | фрагмент UI |
| IndexedDB | **не найден** как store проекта комнаты | — |
| Память `state.*` | живая сцена | теряется при reload |

### 1.4 Старт страницы (**код**)

1. `init()` → новая `Room(...)` пустая (`init.js` ~460–492).  
2. `clearAllCustomSections` при выключенных секциях.  
3. `initRoomSteps` → `currentRoomStep = 1` (типичный старт).  
4. Fixture restore — **только** `?ikeaFixture=1`.  
5. `pagehide`/`beforeunload` → **dispose WebGL**, не save (`init.js` ~166–177).

---

## 2. Почему кухня исчезает при перезагрузке

### Фактическая причина (**код**, подтверждено)

**Данные обычной сессии не записываются в persistent store при работе пользователя и не читаются при открытии страницы.**

Цепочка:

1. Кухня живёт только в `state` (секции, мебель, roomEdit*).  
2. Autosave / «сохранить черновик» на change/unload **отсутствует**.  
3. Единственный путь записи — **ручной** `__cldExportIkeaRoomFixture()` (dev).  
4. Единственный авто-restore — URL **`ikeaFixture=1`**, иначе `maybeAutoRestoreIkeaRoomFixture` сразу `return null` (~482–485).  
5. Reload → новый `init` → пустая комната → шаг 1.

Это **не** баг «восстановление раньше инициализации» как основная причина (restore даже не вызывается).  
Это **не** «сериализация сломана целиком» — collect/restore для fixture **существуют**, но **не подключены к UX**.

### Классификация гипотез

| Гипотеза | Статус |
|----------|--------|
| Данные не сериализуются | Частично: collect есть, но **неполный** и **не вызывается** автоматически |
| Сериализуются, но не пишутся | Для обычного UX — **да, не пишутся** |
| Пишутся, но не восстанавливаются | Только если кто-то вручную export; auto без query — **нет** |
| Restore раньше init | Не основной путь; при `ikeaFixture=1` restore **после** init (**код** main-refactored) |
| Стартовая сцена затирает restore | При отсутствии restore — просто empty start; при fixture — `clearRoomFurnitureAndSections` затем recreate |

### Дополнительные дыры даже у fixture (если включить как основу)

1. **`kitchenBandGrids` не попадают в collect** sections, хотя restore их ждёт.  
2. Коммуникации / openings не в fixture.  
3. `lShape` не в fixture.  
4. Размеры комнаты в collect есть, restore их не применяет к `state.room`.  
5. `__placementKindProfileId` collect ≠ restore.  
6. Фиксированное имя файла `ikea_light_fixture_ikea_v0_cab.json` — один слот, не «черновик пользователя».

---

## 3. Рекомендуемая архитектура (без реализации)

### Принципы

1. **Один** формат снимка — расширить существующий `kind: 'ikea-room-fixture'` (или `clodis-room-draft` v2, совместимый с collect), **не** вторая сериализация.  
2. Слой persistence **отдельно** от ClodisBuilder / WallRun / крепежа — только read state → JSON → write storage → restore через уже существующие create/Furniture/hydrate.  
3. Не трогать геометрию, Brain, освещение, depth engines — только вызовы collect/restore + UI выбора.

### Компоненты

| # | Компонент | Роль |
|---|-----------|------|
| A | **Draft store** | `localStorage` (или IndexedDB при >5MB) ключ `clodis_room_draft_v1` + опционально зеркало `POST /api/projects/save` как `draft_*` |
| B | **Autosave** | debounce 1–2 с после: place/rebuild/zone edit/step change/room edit; + `visibilitychange`/`pagehide` flush (без блокирующего sync XHR по возможности) |
| C | **Boot gate** | после `init`+scene ready: если draft существует и `nonEmpty` → модалка «Продолжить / Начать заново»; иначе шаг 1 |
| D | **Continue** | `restoreIkeaRoomFixture(draft)` (доработать gaps) → step из draft |
| E | **New project** | текущий draft → `clodis_room_draft_prev_v1` (1 уровень undo), затем clear scene + step 1; не писать пустой draft поверх без маркера |
| F | **Empty guard** | autosave **не** перезаписывает non-empty draft пустым снимком (`sections.length===0 && furniture.length===0`), кроме явного New |
| G | **Version** | `version: 2`, `schema`, `savedAt`; миграции при load |
| H | **Будущее multi-project** | list API уже есть; UI «мои проекты» позже; draft = last working copy |

### Защита от перезаписи пустым

```
if (incoming.isEmpty && existing.isNonEmpty && !forceNewProject) skipWrite;
```

### «Начать заново» → вернуть предыдущий

При New: `prev = draft; draft = null; store prev`.  
Опционально «Восстановить предыдущий» читает `prev` один раз.

### Учёт будущего (не делать сейчас)

В schema зарезервировать поля: user parametric cabinets, movable shelves, L-corner cells, tall cohabit — расширять collect по мере готовности слоёв.

---

## 4. Безопасность границ

**Не менять в следующих этапах persistence (по заданию):**  
ClodisBuilder, мебельная геометрия, крепёж/петли, CFRN, Kitchen Brain, WallRun алгоритмы, освещение, depth engines.

**Можно трогать (узко):**  
`ikea-room-fixture.js` (расширение collect/restore), новый тонкий модуль `room-draft-persistence.js`, вызов из `main-refactored` / room-steps UI, ключи LS, опционально имя draft-файла на `/api/projects/*`.

---

## 5. Чего не хватает (чеклист)

| Возможность | Сейчас |
|-------------|--------|
| Autosave черновика | отсутствует |
| Restore без query | отсутствует |
| Модалка Continue / New | отсутствует |
| Empty-write guard | отсутствует |
| Prev-draft после New | отсутствует |
| Полный collect (bands, openings, lShape, room size apply, profileId) | неполный |
| Multi-project UI | только server list API |
| IndexedDB для больших снимков | нет |

---

## 6. Минимальный набор файлов следующего этапа

1. `js/furniture/ikea-room-fixture.js` — дополнить collect (band grids, room apply, profileId, опционально roomEdit snapshot).  
2. **Новый** `js/room/room-draft-persistence.js` (или рядом) — read/write LS, empty guard, prev, boot decision.  
3. `js/main-refactored.js` — после init вызвать boot gate (не ломая `ikeaFixture=1`).  
4. Тонкий UI модалки (HTML/CSS существующей панели шагов или минимальный overlay) — без переделки карточки модуля.  
5. Документ критериев теста (ниже).

Не трогать: kitchen-base-engine depth, joint/hinge, ClodisBuilder, section layout algorithms.

---

## 7. Риски

| Риск | Митигация |
|------|-----------|
| Перезаписать хороший draft пустой сценой на старте | empty guard + не autosave до первого non-empty / до Continue |
| Двойной restore (`ikeaFixture=1` + draft) | приоритет: query fixture > draft modal |
| Quota localStorage (большие clodisRoots) | compress / IndexedDB / server draft |
| Restore без enforce depth / snap Y | после restore вызвать существующие `enforceKitchenDepthStackOnAllModules` / snap (осторожно, не меняя алгоритмы) |
| Неполный collect → «битая» кухня | этап 2: закрыть band grids + room dims + profileId до UX |
| Конфликт с dispose WebGL на pagehide | flush draft **до** dispose |

---

## 8. Последовательность реализации (предложение)

1. **Audit gaps fix в collect/restore** (bands, room size, profileId) — всё ещё без UI.  
2. **Draft LS store + empty guard + manual `__cldSaveRoomDraft`**.  
3. **Boot modal Continue / New + prev**.  
4. **Autosave debounce + pagehide flush**.  
5. **Опционально server mirror draft_***.  
6. **Расширение: openings / lShape** отдельными подзадачами.  
7. Multi-project UI — позже.

---

## 9. Критерии тестирования (для этапа 2+)

1. Собрать кухню (секция + НМ + НШ) → reload без query → модалка → Continue → модули и step на месте.  
2. Continue: D НМ, TOP custom stamps, zone widths совпадают.  
3. New → пустая комната step 1; prev можно вернуть.  
4. Reload на пустой комнате **без** модалки.  
5. Autosave не затирает draft пустым init.  
6. `?ikeaFixture=1` по-прежнему поднимает server fixture.  
7. Регрессия: place/rebuild/depth/CFRN без изменения поведения (только save/load вокруг).  
8. Квота: проект с 5+ модулями сохраняется без QuotaExceeded (или fallback).

---

## 10. Краткий вердикт

| Вопрос | Ответ |
|--------|-------|
| Есть ли сериализация? | Да, **dev fixture** + server projects API |
| Есть ли пользовательский черновик? | **Нет** |
| Почему пропадает кухня? | **Нет записи и нет чтения при обычном reload**; сцена всегда стартует пустой |
| База для этапа 2? | Расширять `ikea-room-fixture` + тонкий draft layer; не плодить второй engine |

*Конец аудита.*
