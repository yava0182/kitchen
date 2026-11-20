# CLODIS — этап 7. Автосохранение глобальных настроек кухни

**Дата:** 2026-10-30  
**Bust:** `?v=20261030-kitchen-gs7` (`index.html` → `window.__CLD_BUILD`)  
**Предшественник:** `docs/CLODIS-KITCHEN-GLOBAL-SETTINGS-PERSISTENCE-AUDIT.md` (этап 6)

---

## 1. Что сделано

### Dirty-хуки (после успешного apply)

Файл: `js/ui/kitchen-step3-setup.js` → `markKitchenManageDraftDirty(reason)` → `__cldMarkRoomDraftDirty`.

| Контрол | Reason | Когда |
|---------|--------|--------|
| Система фасадов | `kitchen_front` | после `setKitchenProjectState` + scene apply |
| Высота опор | `kitchen_plinth` | после verified set (+ apply модулей, если есть) |
| Глубина низов | `kitchen_base_depth` | после `setProjectBaseCarcassDepthMm` (+ apply) |
| Зазор НМ→НШ1 | `kitchen_band_mid` | после set + rhythm |

Не вызывается: при no-op (тот же frontMode), при провале валидации bandMid/depth, если plinth не записался в project state.  
Apply к модулям **не менялся** — только уведомление autosave **после** завершения apply.

### Empty overwrite guard (не ослаблен для мебели)

`isEmptyFixture` / `isEmptyRoomFixture` по-прежнему = **нет секций и нет мебели**.  
Правило `saveRoomDraft`: пустой collect **не** затирает draft с мебелью (`empty_overwrite_blocked`) — **без изменений**.

### Continue для «пустой» кухни с настройками

Новые хелперы в `js/furniture/ikea-room-fixture.js`:

- `kitchenProjectHasUserOverrides(kp)` — plinth≠100 / gola / worktop≠600 / carcass≠550 / bandMid задан  
- `isContinuableRoomDraft(fixture)` — есть мебель/секции **или** openings/objects **или** overrides kitchenProject  

Используется в:

- `bootRoomDraftAutosave` — показать модалку Continue  
- `loadRoomDraft` — разрешить restore без мебели  
- `onNewProject` / `restoreRoomDraftPrev` — backup/prev для kitchen-only draft  

### UI после Continue

`syncKitchenManagePanelFromProject()` в `kitchen-manage-panel.js` → вызывается из `onContinueProject` после успешного `loadRoomDraft`.  
Индикатор «Проект сохранён» — прежний: только при `result.ok` от `saveRoomDraft` (при `empty_overwrite_blocked` toast успеха нет).

---

## 2. Затронутые файлы

| Файл | Изменение |
|------|-----------|
| `js/ui/kitchen-step3-setup.js` | dirty после apply* |
| `js/furniture/ikea-room-fixture.js` | continuable helpers; loadRoomDraft |
| `js/room/room-draft-autosave.js` | boot/Continue/New; sync UI; meta модалки |
| `js/ui/kitchen-manage-panel.js` | `syncKitchenManagePanelFromProject` |
| `js/main-refactored.js`, `js/ui/room-steps.js` | bust импортов |
| `index.html` | bust `20261030-kitchen-gs7` |

**Не трогали:** Kitchen Brain, ClodisBuilder, WallRun, ритм/Gola/depth engines, CFRN, крепёж, освещение, free height.

---

## 3. Проверки

### Автоматические (Node, логика guard/continuable)

Скрипт-эквивалент хелперов (без Three.js):

| Кейс | Ожидание | Результат |
|------|----------|-----------|
| empty + plinth 120 → continuable | true | PASS |
| empty + plinth 120 → structurally empty | true | PASS |
| defaults-only → не continuable | true | PASS |
| gola / depth 460 / bandMid → continuable | true | PASS |
| empty incoming поверх draft с мебелью → block | true | PASS |
| empty поверх empty / null → allow write | true | PASS |
| draft с мебелью → continuable | true | PASS |

Код dirty-хуков и вызовов Continuable — сверка grep по репозиторию (хуки на месте).

### Ручные (обязательно)

**A. Пустая кухня (только «Управление кухней»)**

1. Новый конструктор, без мебели.  
2. Опоры **120** (или Gola / глубина 460 / bandMid).  
3. Дождаться «Проект сохранён» (~1.5 с).  
4. F5 → модалка Continue (секций 0, модулей 0, в тексте опоры).  
5. Продолжить → панель «Управление кухней» показывает **120** / выбранные.  
6. `localStorage clodis_room_draft_v2` → `kitchenProject.plinthHeightMm === 120`.

**B. Построенная кухня**

1. Есть НМ.  
2. Сменить только опоры 100→120 (без других действий).  
3. Дождаться «Проект сохранён».  
4. F5 → Continue → опоры 120 на модулях и в панели.  
5. Collect/`__cldInspectRoomDraft` содержит актуальный `kitchenProject`.

**C. Guard не сломан**

1. Кухня с модулями в draft.  
2. Искусственно не провоцировать пустой overwrite (не чистить сцену скриптом).  
3. Убедиться: смена настроек **с** мебелью сохраняется (не `empty_overwrite_blocked`).

**D. False success**

При блокировке overwrite индикатор «Проект сохранён» не появляется (как Stage3).

---

## 4. Риски / ограничения

| Риск | Комментарий |
|------|-------------|
| Defaults-only empty draft | Не показывает Continue (намеренно: collect всегда пишет kitchenProject). |
| Удалили всю мебель, потом сменили опоры | Guard может блокировать запись поверх старого draft с мебелью — настройки в draft не обновятся, пока сцена снова непустая или draft очищен через «Новый». Отдельный слой, не Stage7. |
| Дефолты 100/550/600 захардкожены в `kitchenProjectHasUserOverrides` | Согласованы с manufacturing defaults; смена дефолтов профиля → обновить хелпер. |

---

## 5. Чеклист приёмки

- [ ] Bust `20261030-kitchen-gs7` на бейдже  
- [ ] Пустая кухня: 120 → save toast → F5 → Continue → 120 в UI  
- [ ] С кухней: смена одной настройки → save → F5 → Continue → конструкция и UI  
- [ ] Apply к модулям без регрессии (как до Stage7)  
