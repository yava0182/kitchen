# CLODIS — автосохранение проекта. Этап 3

**Дата:** 2026-10-30  
**Bust:** `20261030-autosave1`  
**База:** Stage2 `clodis_room_draft_v2` / `ikea-room-fixture` (без новой сериализации).

---

## 1. Изменённые файлы

| Файл | Роль |
|------|------|
| `js/room/room-draft-autosave.js` | **новый** — фазы, debounce, модалка, prev-слот, status toast |
| `js/furniture/ikea-room-fixture.js` | export `readRoomDraftRaw`, `isEmptyRoomFixture`, `clearRoomSceneForNewProject` |
| `js/main-refactored.js` | boot gate после fixture |
| `index.html` | bust `20261030-autosave1` |
| Хуки dirty (однострочники): `furniture-manager`, `section-manager`, `scene-icons`, `room-manager`, `room-edit-objects`, `room-edit-openings` | |
| Bust importers: `furniture-actions`, `room-steps`, `room-edit-toolbar`, … | чтобы подтянуть хуки |

**Не трогались:** ClodisBuilder, Kitchen Brain, WallRun, крепёж/петли/CFRN, depth engines, освещение.

---

## 2. Состояния

`booting` → (`awaiting_choice` \| `editing`) → `restoring` / `saving` / `error` → `editing`

Автосохранение **только** при `phase === 'editing'` и после выбора (или если черновика не было).

---

## 3. Автосохранение

- API: `markRoomDraftDirty(reason)` → debounce **1500 ms** → `saveRoomDraft()` (Stage2).
- Flush: `pagehide` + `visibilitychange` (hidden), silent.
- Empty guard Stage2 сохранён: пустая сцена не затирает non-empty draft.
- До выбора в модалке dirty **игнорируется**.

### Точки dirty

| Reason | Где |
|--------|-----|
| `furniture_place` / `furniture_delete` | furniture-manager |
| `step5_decor` | persistStep5ModuleDecorForGroup |
| `module_depth_*` | scene-icons applyModuleDepthCm (tall/base/mid/top) |
| `section_create` / `sections_clear` / `zone_width` | section-manager |
| `room_dimensions` | room-manager updateRoomDimensions |
| `room_object_*` / `opening_*` | room-edit-objects / openings |

---

## 4. Модалка при открытии

После `init` + optional `?ikeaFixture=1`:

- нет non-empty draft → сразу `editing`;
- есть draft → «Продолжить работу над проектом?»  
  - **Продолжить** → `loadRoomDraft()` один раз (`restoredThisSession`);  
  - **Начать новый** → draft → `clodis_room_draft_prev_v2` (verify read-back) → remove current key → `clearRoomSceneForNewProject` → step 1.

`?ikeaFixture=1` (успешный restore) → `skipChoice`, без модалки.

---

## 5. Защита данных

| Механизм | Поведение |
|----------|-----------|
| `empty_overwrite_blocked` | Stage2, пустой collect не трёт draft |
| `awaiting_choice` | autosave выкл. |
| Prev slot | `clodis_room_draft_prev_v2`; `__cldRestoreRoomDraftPrev()` |
| Status | «Сохранение…» / «Проект сохранён» / «Не удалось сохранить» — ok только при `ok: true` |

---

## 6. Совместимость Stage2 / fixture

Сохранены: `__cldSaveRoomDraft`, `__cldLoadRoomDraft`, `__cldInspectRoomDraft`, `?ikeaFixture=1`.

Добавлены: `__cldMarkRoomDraftDirty`, `__cldFlushRoomDraftAutosave`, `__cldRestoreRoomDraftPrev`, `__cldInspectRoomDraftPrev`, `__cldGetRoomDraftPhase`.

---

## 7. Тесты

| # | Сценарий | Результат агента |
|---|----------|------------------|
| 1 | Без draft → пустой старт без модалки | PASS (smoke, phase=`editing`, modal нет) |
| 2 | Кухня → autosave после debounce | **ручной** |
| 3 | Reload при non-empty draft → модалка | PASS (fake draft → `awaiting_choice`, overlay flex) |
| 4 | Продолжить → restore | **ручной** (нужна реальная кухня с clodisRoots) |
| 5–6 | Глубина НШ → autosave → reload | **ручной** |
| 7 | Начать новый → prev жив | PASS (`clodis_room_draft_prev_v2`, current cleared) |
| 8 | Ошибка записи ≠ «сохранён» | логика в коде: toast error only if `!ok` |
| 9 | Нет дублей секций/шкафов | restore = clear + create (Stage2) |
| 10 | Нет autosave до выбора | PASS (phase `awaiting_choice` до New) |
| — | Syntax check autosave/fixture | PASS |

---

## 8. Ограничения

- Нет «Мои проекты» / облака / именованных проектов.
- lShape/joints — как Stage2 (metadata).
- Не все UI-действия обязаны иметь dirty-хук; при пробеле: `__cldMarkRoomDraftDirty('manual')` или `__cldSaveRoomDraft()`.
- Повторный Continue в той же сессии не делает второй restore.

*Конец отчёта этапа 3.*
