# CLODIS — этап 5. Исправление пропущенных автосохранений

**Дата:** 2026-10-30  
**Bust:** `20261030-autosave2`  
**Контрольная копия Stage3:** `_checkpoint_autosave_stage3/`  
(до правок: `room-draft-autosave.js`, `ikea-room-fixture.js`, `main-refactored.js`, `CLODIS-PROJECT-AUTOSAVE-STAGE3.md`)

Сериализация не менялась. Только dirty-хуки в точках **завершения** операции.

---

## 1. Изменённые файлы

| Файл | Хуки |
|------|------|
| `js/furniture/furniture-manager.js` | `furniture_drag` |
| `js/ui/scene-icons.js` | `module_height`, `worktop_depth`, `module_door_hand` |
| `js/room/room-manager.js` | `room_shape` |
| `js/room/room-edit-openings.js` | `opening_move`, `opening_dim`, `opening_door_edit`, `opening_window_edit`, `opening_window_finish` |
| `js/room/room-edit-objects.js` | `room_object_move`, `room_object_resize`, `room_object_dim` |
| `index.html` / importers bust | `20261030-autosave2` |
| `_checkpoint_autosave_stage3/` | резерв Stage3 |
| `docs/CLODIS-PROJECT-AUTOSAVE-STAGE5.md` | этот отчёт |

---

## 2. Добавленные dirty-хуки и точки вызова

### P0

| Reason | Точка завершения | Не на |
|--------|------------------|-------|
| `furniture_drag` | конец `finishFurnitureDragFromCanvas` (после layout/transitions) | mousemove / live ghost |
| `module_height` | `applyModuleHeightCm` при `ok`; `finishHeightApply` в `tryApplyHeightVal` (UI-путь) | каждый keypress без apply |

### P1

| Reason | Точка завершения |
|--------|------------------|
| `room_shape` | `recreateRoomWithShape` return true, **только если `!quiet`** |
| `opening_move` | `onCanvasMouseUp` openings, если `dragMoved` (после `flushDragAlong`) |
| `opening_dim` | успешный `applyDimSegmentEdit` |
| `opening_door_edit` / `opening_window_edit` | после apply в editor input |
| `opening_window_finish` | смена finish окна |
| `room_object_move` / `room_object_resize` | objects `onCanvasMouseUp` если moved/wasResize |
| `room_object_dim` | успешный `applyDimEdit` |
| `module_door_hand` | `tryApplyZoneHand` при `ok` |
| `worktop_depth` | успешный `applyKitchenWorktopDepthCm` |

Autosave по-прежнему debounce **1.5 s** + phase `editing`.

---

## 3. Сериализация / restore (проверка collect)

| Параметр | В `collectIkeaRoomFixture` | Restore | Замечание |
|----------|----------------------------|---------|-----------|
| Позиция модуля / zoneIndex | `position`, `zoneIndex`, `sectionId` | world pos + remap | drag → collect ок |
| `customHeightMm` | да | ud set | **нет** отдельного height-rebuild API в restore — геометрия из clodisRoots/vars; **ручной** |
| `kitchenRoomShapeKey` + footprint | да | apply room | quiet restore не dirty |
| openings along/W/H/sill/finish | `openings[]` | `reapplyRoomEditOpenings` | ок |
| roomEditObjects x/z/W/D | `roomEditObjects[]` | reapply objects | ок |
| `zoneHand` / `doorLayout` | да | Furniture params | **`zoneHandManual` не в collect** — риск для manual hand |
| `kitchenProject.worktopDepthMm` | да (`getKitchenProjectForSave`) | hydrate | worktop apply пишет project state (**код** `applyWorktopDepthOnWall`) |

Ядро / L-seat / wall_corner scale — **не трогались** (как в задании).

---

## 4. Тесты

| Проверка | Результат |
|----------|-----------|
| `node --check` на изменённых JS | PASS |
| Наличие новых reason-строк в коде | PASS (rg) |
| Live e2e drag/height/openings → F5 → Continue | **ручной** |

### Ручной чеклист

1. Drag шкафа вдоль стены → пауза 2 с → статус сохранён → F5 → Continue → позиция/ячейка.  
2. Высота (standalone / поле высоты) → F5.  
3. Смена формы комнаты → F5.  
4. Сдвиг окна / правка W·H → F5.  
5. Сдвиг/resize трубы → F5.  
6. zoneHand left/right → F5.  
7. Глубина столешки → F5 → worktop + корпуса.  
8. Во время drag консоль не должна сыпать save на каждом кадре (только после mouseup + debounce).

---

## 5. Оставшиеся риски

- Высота: dirty есть; restore не вызывает отдельный height-rebuild — зависит от clodis snapshot.  
- `zoneHandManual` не сериализуется.  
- Editor `input` на дверях/окнах ставит dirty на каждое изменение поля (сглаживается debounce 1.5 s).  
- L/НМУ seat, wall_corner geometry, крепёж вне roots — вне Stage5 (нужно согласование ядра).  
- Quota localStorage — без IndexedDB.

---

*Конец отчёта этапа 5.*
