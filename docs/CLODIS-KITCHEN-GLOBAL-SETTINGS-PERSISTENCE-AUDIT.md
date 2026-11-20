# CLODIS — этап 6. Аудит глобальных настроек кухни и полноты сохранения

**Дата:** 2026-10-30  
**Режим:** только аудит (код не менялся)  
**UI:** «Управление кухней» → вкладка «Система»  
**Файлы UI:** `js/ui/kitchen-manage-panel.js`, `js/ui/kitchen-step3-setup.js`  
**Состояние:** `window.__cldKitchenManufacturing` → LS `cld_kitchen_project_state` + `state.kitchenProject`  
**Draft:** `kitchenProject` в `collectIkeaRoomFixture` / `hydrateKitchenProjectFromSave`

---

## 1. Перечень настроек «Управление кухней»

Единственная готовая вкладка — **«Система»** (`TABS`: только `system` ready). Контент монтирует `mountKitchenProjectControls`.

| Настройка | UI | Источник состояния | Apply | Dirty | Collect | Restore | UI после restore | Риск |
|-----------|-----|-------------------|-------|-------|---------|---------|------------------|------|
| Система фасада: Обычная / Gola | `[data-kitchen-system=non_gola\|gola]` карточки | `getKitchenProjectState().frontMode` (LS + mirror) | `applyFrontMode` → `setKitchenProjectState({frontMode})` + `__clodisApplyProjectFrontModeToKitchenBases` + reload catalog | **нет** | `kitchenProject.frontMode` / `kitchenSystem` | `hydrateKitchenProjectFromSave` | `syncKitchenProjectControlsUi` только при открытии панели / mount | Stale draft; модули на сцене от apply, draft может отстать |
| Высота опор 100/120/150 | `[data-kitchen-plinth]` | `plinthHeightMm` (default **100** `DEFAULT_SUPPORT_MM`) | `applyPlinth` → `setProjectPlinthHeightMm` + `__clodisApplyProjectPlinthToKitchenBases` | **нет** | `kitchenProject.plinthHeightMm` | hydrate → LS + state | sync при open; **не** вызывается автоматически после Continue | **Высокий** — пример 120 мм |
| Глубина низов 460/510/550 | `[data-kitchen-base-depth]` | `baseCarcassDepthMm` | `applyBaseCarcassDepth` → `setProjectBaseCarcassDepthMm` + `__clodisApplyProjectDepthToKitchenBases` + enforce depth | **нет** (кроме косвенно если depth enforce не dirty) | `kitchenProject.baseCarcassDepthMm` | hydrate | sync при open | Высокий без dirty |
| Зазор НМ→НШ1 (`bandMid`) | `[data-kitchen-band-mid]` number | `bandMidMm` (null = default из rhythm, UI показывает default) | `applyBandMid` → `setKitchenProjectState({bandMidMm})` + `__clodisApplyKitchenBandLowRhythmToModules` | **нет** | `bandMidMm` только если ≠ null | hydrate | sync при open | Высокий |
| Инфо-стек (read-only) | `[data-kitchen-stack-info]` | `getStep3KitchenStackInfo()` | нет | — | нет | — | refreshInfo в sync | — |

**Нет в этой панели (важно):** глубина столешки `worktopDepthMm` — меняется карандашом модуля / `applyWorktopDepthOnWall` (есть dirty Stage5 `worktop_depth`), но **не** контрол «Управления кухней».

**Defaults при пустом LS:** plinth 100, frontMode `non_gola`, worktop/carcass из `normalizeProjectDepthFields({})`, bandMid `null`.

---

## 2. Причина потери настроек (по коду)

Проверены гипотезы:

| # | Гипотеза | Вердикт |
|---|----------|---------|
| 1 | Нет dirty-хука | **Да — подтверждено.** В `kitchen-step3-setup.js` ни один `apply*` не вызывает `__cldMarkRoomDraftDirty`. |
| 2 | Не сериализуется | **Нет.** `getKitchenProjectForSave()` включает frontMode, plinthHeightMm, worktopDepthMm, baseCarcassDepthMm, bandMidMm (если задан), kitchenSystem. |
| 3 | Не восстанавливается | **Частично.** `restoreIkeaRoomFixture` первым делом зовёт `hydrateKitchenProjectFromSave(fixture.kitchenProject, true)` — пишет LS. Если в **draft** лежит старый plinth 100, restore **намеренно** ставит 100. |
| 4 | Перезапись дефолтом после restore | **Слабо.** `mountKitchenProjectControls` ставит 100 только если `!(plinth > 0)`. Не сбрасывает 120→100. Но **Continue со старым draft** = перезапись LS значением из draft. |
| 5 | UI не синхронизируется | **Да, вторично.** После Continue нет обязательного `syncKitchenProjectControlsUi` / reopen panel. Состояние в LS может быть верным, а кнопки «selected» — нет, пока не откроют панель (`setOpen` → sync). |
| 6 | Неверный порядок restore | **Hydrate до секций/мебели — правильный порядок.** Риск не в порядке, а в **устаревшем** `fixture.kitchenProject` из-за отсутствия autosave после apply. |

### Типичный сценарий потери «цоколь 120»

1. Кухня autosave’ится с `kitchenProject.plinthHeightMm: 100`.  
2. Пользователь ставит **120** → `cld_kitchen_project_state` = 120, сцена обновляется apply.  
3. **Draft не обновляется** (нет dirty).  
4. F5 → модалка → **Продолжить** → hydrate из draft → **LS снова 100** → UI/проект выглядят как «настройка пропала».  

Параллельно: отдельный LS ключ *может* переживать reload **без** Continue (пустой старт / New), но пользовательский путь с кухней почти всегда идёт через draft Continue.

---

## 3. Архитектура: единое уведомление об изменении проекта

### Уже вызывают dirty (фрагмент)

place/delete/drag мебели, depth/height/hand/worktop (карандаш), zone width, room size/shape, openings/objects — см. Stage3–5.

### Не вызывают (глобальная кухня)

| Операция | Файл / функция |
|----------|----------------|
| `applyFrontMode` | `kitchen-step3-setup.js` |
| `applyPlinth` | там же |
| `applyBaseCarcassDepth` | там же |
| `applyBandMid` | там же |
| Любой другой прямой `setKitchenProjectState` / `setProject*` вне этих apply | manufacturing API |

### Единые точки применения

Да: все контролы панели сходятся в `setKitchenProjectState` / `setProjectPlinthHeightMm` / `setProjectBaseCarcassDepthMm` (**код** manufacturing), затем scene apply.

Рекомендуемый **узкий** хук: в конце успешных `apply*` панели + опционально один helper `notifyKitchenProjectChanged(reason)` → `__cldMarkRoomDraftDirty('kitchen_project_'+reason)` **после** apply на сцену (не во время промежуточного rebuild внутри applyFn).

Не сериализовать Three.js. Не proxy всех переменных. Источник правды для draft — уже `getKitchenProjectForSave()` в collect.

### Актуальность `kitchenProject` в draft

Гарантия: любой user-facing commit в LS project state → dirty → debounce save → collect читает **текущий** `getKitchenProjectForSave()`.

После restore: вызвать `syncKitchenProjectControlsUi` на открытой панели / после Continue.

### Проверка полноты без ядра

1. Менять каждую настройку → `__cldInspectRoomDraft().` / collect → поле `kitchenProject`.  
2. F5 → Continue → `getKitchenProjectState()` + UI selected.  
3. Сравнить stamp модулей (`__kitchenPlinthHeightMm`) с project.

---

## 4. План исправления

### Обязательно (минимальный патч)

| Шаг | Что | Где |
|-----|-----|-----|
| A | После успешного commit: `markRoomDraftDirty('kitchen_plinth'\|'kitchen_front'\|'kitchen_base_depth'\|'kitchen_band_mid')` | `applyPlinth`, `applyFrontMode`, `applyBaseCarcassDepth`, `applyBandMid` в `js/ui/kitchen-step3-setup.js` — **после** setState + scene apply (или сразу после setState, если apply только toast) |
| B | После `loadRoomDraft` / Continue: `syncKitchenProjectControlsUi(panel)` если панель смонтирована | `room-draft-autosave.js` `onContinueProject` и/или `kitchen-manage-panel` export sync |
| C | Bust панели + step3-setup + main import | `?v=` |
| D | Ручной тест: 120 → wait save → F5 → Continue → plinth 120 в UI и на НМ | |

**Не трогать:** ритм формул, depth engines, ClodisBuilder, Brain, WallRun, free height.

### Необязательно / позже

| Идея | Зачем |
|------|--------|
| `notifyKitchenProjectChanged` внутри `setKitchenProjectState` при `persist!==false` | Поймать все API-записи; осторожно: не dirty на quiet hydrate boot |
| Флаг `opts.fromHydrate` / `opts.silent` чтобы hydrate не ставил dirty | Избежать save во время restore |
| Чеклист «полнота kitchenProject» в `__cldInspectRoomDraft` | Показать plinth/front/depth/mid |
| Документ: LS `cld_kitchen_project_state` ≠ draft; Continue побеждает LS | UX ясность |

### Не делать без необходимости

- Переписывать autosave.  
- Сериализация всей сцены.  
- Слежение за произвольными globals.  
- Менять канон высоты шкафов.

---

## 5. Краткий вердикт

| Вопрос | Ответ |
|--------|--------|
| Почему теряется 120 мм? | Нет dirty → draft со старым `kitchenProject` → Continue перезаписывает LS. |
| Collect умеет plinth? | **Да.** |
| Restore умеет? | **Да**, если в fixture актуально. |
| Главный фикс | Dirty в apply* «Управления кухней» + sync UI после Continue. |

*Конец аудита этапа 6.*
