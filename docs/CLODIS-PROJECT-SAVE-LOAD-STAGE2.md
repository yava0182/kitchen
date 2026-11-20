# CLODIS — сохранение проекта. Этап 2

**Дата:** 2026-10-30  
**Bust:** `20261030-draft1`  
**Цель:** надёжное **ручное** save/load тестового проекта на базе `ikea-room-fixture.js` (без модалки и без autosave).

---

## 1. Изменённые файлы

| Файл | Что сделано |
|------|-------------|
| `js/furniture/ikea-room-fixture.js` | Расширен collect/restore; draft API; empty-guard; version=2 |
| `js/main-refactored.js` | Импорт fixture `?v=20261030-draft1` |
| `index.html` | `__CLD_BUILD` → `20261030-draft1` |
| `docs/CLODIS-PROJECT-SAVE-LOAD-STAGE2.md` | Этот отчёт |

**Не трогались:** ClodisBuilder, Kitchen Brain, WallRun, крепёж/петли/CFRN, depth НМ, столешка, освещение.

---

## 2. Поддерживаемые параметры

### Collect → restore (рабочий путь)

| Параметр | Collect | Restore |
|----------|---------|---------|
| Комната W/D/H | да | да (`updateRoomDimensions` / skip если совпало) |
| `kitchenRoomShapeKey`, footprint, interior walls | да | да (перед resize) |
| Секции: id, size, pos, wall, offsets, filler, planks, division | да | да (create + variant + customZoneWidths) |
| `kitchenBandGrids` (BASE/MID/TOP) | да (`serializeKitchenBandZoneGrids`) | да (`applyKitchenBandZoneGrids`) |
| `__placementKindProfileId` | да | да |
| custom W/H/D, rear/front offsets | да | да |
| НШ TOP: mode / custom / userLocked / carcassDepth | да | да |
| `kitchenProject` manufacturing | да | hydrate |
| step5 outside/inside/endOverlay на модуле | да | userData + Furniture params + dynamic apply |
| Окна/двери (`roomEditOpenings`) | да | `state` + `reapplyRoomEditOpenings` |
| Коммуникации (`roomEditObjects`) | да | `state` + `__cldReapplyRoomEditObjects` |
| Camera / step | да | да |

### Ограничения (без нового ядра)

| Тема | Решение этапа 2 |
|------|-----------------|
| **lShape** | Collect + restore **метаданных** с remap `pairId*`. **Не** вызываются `seatKitchenJointCorner` / `ensureJointsForLPair` / corner-joint recreate (избегаем пересчёта геометрии). |
| **kitchenJoints** | Collect map + remap section/module uuid. Без seat/recompute. |
| **Offsets mesh** | Поля `offsets`/`filler` пишутся на sectionData; полный `updateSectionSize` не гоняется. |
| **Пустая сцена** | Save пустого **не** затирает non-empty draft (`empty_overwrite_blocked`), кроме `forceEmpty: true`. |

Если для L-угла потребуется полный corner-joint path — **нужно согласование** (это уже параметрическое ядро угла).

---

## 3. Диагностические API (консоль)

После загрузки `build 20261030-draft1`:

```js
__cldSaveRoomDraft()      // → localStorage clodis_room_draft_v2
__cldLoadRoomDraft()      // → restore после __CLD_REFACTORED_INIT__
__cldInspectRoomDraft()   // → сводка без restore
```

Формат: тот же `kind: 'ikea-room-fixture'`, `version: 2`.  
Ключ: `clodis_room_draft_v2` (`window.__cldRoomDraftKey`).

Прежние: `__cldCollectIkeaRoomFixture`, `__cldExportIkeaRoomFixture`, `__cldRestoreIkeaRoomFixture`, `?ikeaFixture=1`.

---

## 4. Последовательность restore (безопасность)

1. Проверка `kind`, `scene`, `__CLD_REFACTORED_INIT__`.  
2. Hydrate `kitchenProject`.  
3. Clear openings/objects → apply room size (если изменилось).  
4. Clear furniture/sections/`kitchenJoints`.  
5. Restore openings/objects через **существующие** reapply.  
6. Create sections (без attached auto) → division → band grids.  
7. Rebuild furniture из clodis snapshot **в сохранённых world pos** (без place/snap/enforce depth).  
8. lShape/joints metadata + uuid remap.  
9. Step + camera.

Дубли секций снимаются clear перед create. Автопересчёт глубины/привязки к стене **не** вызывается.

---

## 5. Ручной тест

1. Открыть `index.html` — бейдж **`build 20261030-draft1`**.  
2. Создать кухню (секция + НМ + НШ1/НШ2).  
3. Изменить глубину НШ1 и НШ2 (custom / lock).  
4. В консоли: `__cldSaveRoomDraft()` → `ok: true`, запомнить `furnitureDepth`.  
5. Перезагрузить страницу (F5).  
6. `__cldInspectRoomDraft()` — draft на месте.  
7. `__cldLoadRoomDraft()` → `ok: true`.  
8. Сравнить: число модулей, позиции, TOP mode/custom/locked, zone widths, декоры (если были).

Дополнительно: окна/трубы — save/load; пустая комната + Save → `empty_overwrite_blocked`.

---

## 6. Фактически проведённые тесты (агент)

| Проверка | Результат |
|----------|-----------|
| Синтаксис `node --check` ikea-room-fixture.js | PASS |
| Загрузка `?v=20261030-draft1`, `__CLD_REFACTORED_INIT__` | PASS |
| API `__cldSave/Load/InspectRoomDraft` на `window` | PASS |
| Empty overwrite guard (fake non-empty + save empty) | PASS → `empty_overwrite_blocked`, draft сохранён |
| Live e2e (кухня → save → reload → load + сравнение НШ) | **Ручной** — чеклист §5 |

---

## 7. Следующий этап (не здесь)

- Модалка «Продолжить / Начать заново»  
- Autosave + pagehide flush  
- Согласование полного restore L/П через Joint seat (если metadata недостаточно)

*Конец отчёта этапа 2.*
