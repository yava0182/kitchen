# CLODIS — этап 8. Восстановление высот НШ1/НШ2 после Continue

**Дата:** 2026-10-30  
**Bust:** `20261030-wall-h8`  
**База:** `docs/CLODIS-KITCHEN-WALL-HEIGHT-SAVE-RESTORE-AUDIT.md`  
**Scope:** только restore; формулы Vertical Rhythm не менялись.

---

## 1. Что сделано

В конце `restoreIkeaRoomFixture()` (`js/furniture/ikea-room-fixture.js`), **после**:

- hydrate `kitchenProject`
- apply высоты/размера комнаты
- секций
- всех furniture (+ decor)
- lShape/joints metadata
- sync trim studio

вызывается существующий:

- `window.__cldKitchenBaseEngine.applyKitchenCeilingTiersToScene()`, или
- fallback `window.__clodisApplyKitchenCeilingTiersToModules()`

Тот же путь, что после `updateRoomDimensions` / смены высоты комнаты. Отдельного расчёта H нет.

Результат пишется в `restore.ceilingTiers` (updated/failed/skipped/pick).

---

## 2. Проверка безопасности (до внедрения)

| Условие | Вердикт |
|---------|---------|
| Модули уже на сцене | Да — вызов только если `placed > 0`, после цикла restore |
| `kitchenProject` + room H актуальны | Да — hydrate и `applyRoomSizeFromFixture` раньше |
| Дублирование мебели | Нет — tiers делает in-place `rebuildFurnitureGroupForSectionResize` |
| Ширина / ячейка / стена | Ширина из `__initialSectionSizeMm.x`; sectionId/zoneIndex/wallName не трогает; Y — snap; back — `alignBackToWall` (как при resize комнаты) |
| Глубина | Как при смене roomH: sizing может выставить wall D из профиля (тот же apply) |
| Autosave в фазе `restoring` | Tiers **не** зовёт dirty. Continue держит `phase=restoring` до конца `loadRoomDraft`; `canAutosave()` false |

Риск «вслепую» не выявлен — патч внедрён.

---

## 3. Изменённые файлы

| Файл | Изменение |
|------|-----------|
| `js/furniture/ikea-room-fixture.js` | ceiling tiers после restore мебели |
| `js/room/room-draft-autosave.js` | bust импорта fixture |
| `js/main-refactored.js` | bust fixture + autosave |
| `index.html` | bust `20261030-wall-h8` |
| `docs/CLODIS-KITCHEN-WALL-HEIGHT-RESTORE-STAGE8.md` | этот отчёт |

**Не трогали:** manufacturing rhythm, ClodisBuilder, Brain, WallRun, depth engines, CFRN, материалы, свет, free height.

---

## 4. Тесты

| Проверка | Результат |
|----------|-----------|
| Точка вызова после furniture (чтение кода) | PASS |
| Tiers не создаёт групп / нет dirty в engine | PASS (код) |
| Live: 2500→2700 → save → F5 → Continue → H/Y НШ1/НШ2 | **ручной** |
| Continue без смены высоты комнаты (регрессия) | **ручной** |

### Ручной чеклист

1. Кухня с НШ1+НШ2, room **2500**.  
2. Высота комнаты → **2700**, дождаться перестройки и «Проект сохранён».  
3. Записать `customHeightMm` / визуальную H и низ шкафов.  
4. F5 → Продолжить → сравнить с п.3.  
5. Отдельный проект: без смены H → F5 → Continue → НШ без регрессии W/D/ячейка.

Если после Continue H верны, а в draft `customHeightMm`/`initialSectionSizeMm.y` всё ещё старые — зафиксировать отдельно как A→B (сериализация); Stage8 это не чинит и не расширяет.

---

## 5. Риски

| Риск | Комментарий |
|------|-------------|
| Tiers API отсутствует | limitation в restore; модули остаются как собрал FurnitureCtor |
| Кастомная глубина НШ | тот же apply, что при resize комнаты; не новый |
| Tall тоже пересчитывается | поведение engine как при roomH change — ожидаемо |

---

## 6. Чеклист приёмки

- [ ] Bust `20261030-wall-h8`  
- [ ] 2500→2700 → save → F5 → Continue: H и Y НШ1/НШ2 как до F5  
- [ ] Continue без смены H: без поломки W/D/позиции  
