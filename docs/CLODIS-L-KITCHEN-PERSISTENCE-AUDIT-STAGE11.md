# CLODIS — этап 11. Аудит сохранения угловых кухонь и L-соединений

**Дата:** 2026-10-30  
**Режим:** READ-ONLY (код не менялся)  
**Ключ draft:** `clodis_room_draft_v2` (`ikea-room-fixture`)  
**База кода:** `js/furniture/ikea-room-fixture.js`, `js/kitchen/kitchen-joint.js`, `js/sections/corner-joint.js`

---

## 0. Вердикт

| Утверждение | Статус по коду |
|-------------|----------------|
| Две стороны L + `lShape` пишутся в draft | **Да** |
| `state.kitchenJoints` (вкл. snapshot `cornerCell`) пишется | **Да** |
| После Continue Joint/seat — полноценная живая конструкция | **Нет** |
| Restore вызывает `seatKitchenJointCorner` / `ensureJointsForLPair` | **Нет** (явно отключено) |
| Визуальная поза углового шкафа | **Да** (world pos/rot + clodis) |
| Редактирование угла после Continue функционально целостно | **Не подтверждено** — высокий риск (metadata without seat) |

Итог: **сериализация угла есть; реанимация seat/проекции на host — нет.** Две секции с `lShape` ≠ автоматически восстановленный Joint+seat. Это уже отмечалось в Stage4 coverage; Stage11 фиксирует детали и план без правок ядра.

---

## 1. Фактическая архитектура L-кухни

Три слоя (не путать):

### 1.1 Пара секций на смежных стенах (обклад)

| | |
|--|--|
| Создание | `createLinkedSectionFromJoint` (`js/sections/corner-joint.js`) при place секции без `skipAttached` |
| Связь | `section.lShape`: `type`, `role` (primary/attached), `pairId`, `hand`, `cornerAtStart` |
| Геометрия стен | offsets/size двух `customSections` до угла комнаты |
| WallRun (в терминах проекта) | не отдельный класс; ячейки = `division` + `kitchenBandGrids` BASE/MID/TOP (`kitchen-section-layout.js`) |

Две обычные секции без `lShape` / без Joint **не** эквивалентны L-стыку.

### 1.2 Kitchen Joint + CornerCell (канон угла)

Файл: `js/kitchen/kitchen-joint.js`.

| Понятие | Смысл |
|---------|--------|
| `KitchenJoint` | Связь двух section id + hostSide + moduleUuid / upper* |
| `cornerCell` | Seat низа: `atStart`, `widthMm`, `depthMm`, `clearMm`, `returnMm`, host/other wall |
| `seatKitchenJointCorner` | `applyJointReserves` → `recomputeJointCornerCell` → `syncJointDerivedSectionFlags` → `projectCornerCellOntoHostSection` |
| `ensureJointsForLPair` | `ensureKitchenJoint` + seat низ + seat верх + sync meshes |
| `bindModuleToJoint` | `ud.__kitchenJointId` / cornerCellId; `joint.moduleUuid` |

Канон в шапке файла: **Joint / CornerCell — правда угла; секция — стена + ячейки + резерв.**

`jointId` = стабильная строка `kj|L|pair|{sectionAId}|{sectionBId}` (зависит от id секций на момент создания).

### 1.3 Модули у угла

| Модуль | Данные |
|--------|--------|
| НМУ / base corner | группа + `sectionId`/`zoneIndex` + часто `__kitchenJointId`; seat через Joint |
| НШ1/НШ2 в спец-ячейке | cohabit `kitchen_column`, тот же `zoneIndex`; upper через `upperCornerCell` / `seatKitchenJointUpperCorner` |
| Пеналы у угла | обычная ячейка / tall cohabit; не заменяют Joint |
| Параметры ориентации | `hostSide`, `cornerCell.atStart`, `lShape.hand` / `cornerAtStart`, zoneHand модуля |

Принадлежность:

| Слой | Кому принадлежит |
|------|------------------|
| Стена, size, offsets, division parts/widths, band grids | **секция** |
| `lShape.pairId` / role / type | **секция** (связь пары) |
| Joint, cornerCell, reserves, hostSide | **соединение** (`state.kitchenJoints`) |
| Clodis roots/vars, placementKind, pos, jointId stamp | **модуль** |

---

## 2. Сохранение: `collectIkeaRoomFixture` → draft

Источник: `ikea-room-fixture.js` → `collectIkeaRoomFixture`.

| Элемент | В fixture? | Как |
|---------|------------|-----|
| Две стороны / стены | **Да** | `sections[]`: wallName, size, position, offsets |
| `lShape` пары | **Да** | `serializeLShape` = deepClone всего объекта |
| Ширины ячеек | **Частично** | `serializeDivision`: parts, customZoneWidthsMm, variantIndex — **без** `segmentsLShape*`, **без** `kitchenCornerHostAtStart` / seatAway |
| BASE/MID/TOP | **Да** | `kitchenBandGrids` → `serializeKitchenBandZoneGrids` |
| `kitchenJoints` + `cornerCell` snapshot | **Да** | `serializeKitchenJoints` = deepClone `state.kitchenJoints` |
| `_kitchenJointReserves` на секции | **Нет** | не в collect |
| Seat как live-проекция на division | **Косвенно** | только если ширина спец-зоны уже в `customZoneWidthsMm` |
| Привязка модуля к ячейке | **Да** | `sectionId`, `zoneIndex` |
| Ориентация / поза шкафа | **Да** | position, rotationY, scale + clodis* |
| `kitchenJointId` на модуле | **Да** | `ud.__kitchenJointId` |
| Связь секций | **Да** | `lShape.pairId` (+ remap при restore) |

**Риск «только визуал»:** поза модуля и snapshot Joint пишутся; **не** пишутся reserves и L-сегменты division. Без повторного `seat*` после load проекция host/away может не совпасть с runtime-каноном.

---

## 3. Восстановление: Continue → `restoreIkeaRoomFixture`

Порядок (код):

1. hydrate `kitchenProject`
2. room size/shape
3. `clearRoomFurnitureAndSections` (в т.ч. `kitchenJoints = {}`)
4. openings/objects
5. для каждой секции: `createSectionAtPosition(..., { skipAttached: true })` — **без** `createLinkedSectionFromJoint`
6. offsets/filler/division variant/custom widths/band grids
7. мебель: `restoreOneFurniture` (remap sectionId, world pose, stamps, `__kitchenJointId` как в snapshot)
8. **`restoreLShapeAndJoints`** — см. ниже
9. Stage8 ceiling tiers (если есть мебель)
10. step + camera

### 3.1 `restoreLShapeAndJoints` — ключевой фрагмент

```663:698:js/furniture/ikea-room-fixture.js
/**
 * lShape / kitchenJoints: метаданные + remap id.
 * Не вызываем seatKitchenJointCorner / ensureJointsForLPair (пересчёт геометрии угла).
 */
...
  limitations.push(
    'lShape/kitchenJoints restored as metadata only (no seatKitchenJointCorner / corner-joint recreate)'
  );
```

Делает:

- remap `lShape.pairId*` → новые section id;
- remap `kitchenJoints` section*/host* id + `moduleUuid` / `upperModuleUuid`;
- ключ map и `joint.jointId` **остаются старыми** (комментарий: стабильность ключа);
- **не** вызывает `ensureJointsForLPair` / `seatKitchenJointCorner` / `projectCornerCellOntoHostSection` / `applyJointReserves`.

### 3.2 Ответы на контрольные вопросы restore

| # | Вопрос | По коду |
|---|--------|---------|
| 1 | Обе стороны кухни? | **Да** — две секции + remapped `lShape` |
| 2 | Независимые BASE/MID/TOP? | **Да** — `applyKitchenBandZoneGrids` |
| 3 | Joint как полноценный live-объект с seat? | **Частично** — объект в `state.kitchenJoints` + snapshot cell; **без** seat/reserves/projection |
| 4 | Seat углового модуля? | **Не реанимирован** API seat; ширина спец-зоны может прийти из `customZoneWidthsMm` |
| 5 | Ориентация углового шкафа? | **Визуально** pos/rot; логический host/atStart — из snapshot Joint, без sync флагов секции |
| 6 | Редактирование угла после Continue? | **Риск** — flip/width/reorient ждут live seat/reserves |
| 7 | Дубли секций/углов? | `skipAttached` снижает дубль attached; Joint map один; дублей createLinked нет |
| 8 | Смена ширины ячейки у угла? | Зависит от `findKitchenJointForSectionZone` + seat path; без `_kitchenJointReserves` / host flags — **хрупко** |

`jointId` со старыми section id: lookup по `state.kitchenJoints[oldId]` и `ud.__kitchenJointId` согласованы между собой; новый `ensureKitchenJoint` после edit создал бы **другой** id — риск orphan/двух Joint.

---

## 4. Таблица полей: сохраняется / восстанавливается / теряется

| Поле / сущность | Collect | Restore | Примечание |
|-----------------|---------|---------|------------|
| `sections[].wallName/size/pos` | да | createSectionAtPosition | новые id |
| `sections[].lShape` | да | remap на created | пара связана |
| `sections[].division.parts/customZoneWidthsMm` | да | setParts + setZone | без L-сегментов |
| `division.kitchenCornerHostAtStart` | **нет** | **нет** | выставляет seat |
| `division.segmentsLShape*` | **нет** | **нет** | null после seat |
| `kitchenBandGrids` | да | apply | |
| `kitchenJoints` map | да | remap ids/uuids | **без seat** |
| `joint.cornerCell` | да (если был) | в state | не пересчитан |
| `joint.moduleUuid` | да | remap uuid | |
| `_kitchenJointReserves` | **нет** | **нет** | только через `applyJointReserves` |
| furniture pos/rot/clodis | да | Furniture ctor | |
| `zoneIndex` / `sectionId` | да | remap section | |
| `__kitchenJointId` | да | как в snapshot (old jointId) | согласован с ключом map |
| ceiling tiers НШ (Stage8) | — | post-furniture | не Joint |
| `intentionallyEmpty` (Stage9) | да | continuable | угол не специален |

---

## 5. Файлы и функции Joint / seat

| Файл | Функции / роль |
|------|----------------|
| `js/kitchen/kitchen-joint.js` | `ensureKitchenJoint`, `recomputeJointCornerCell`, `projectCornerCellOntoHostSection`, `seatKitchenJointCorner`, `seatKitchenJointUpperCorner`, `ensureJointsForLPair`, `ensureJointsForUBundle`, `applyJointReserves`, `bindModuleToJoint`, `findKitchenJointForSectionZone`, window `__cldSeat*` / `__cldEnsureJoints*` |
| `js/sections/corner-joint.js` | `createLinkedSectionFromJoint`, `resolveCornerJoint`, trim plan — **геометрия пары секций** |
| `js/kitchen/kitchen-corner-cell.js` | meshes / вызов `ensureJointsForLPair` |
| `js/kitchen/kitchen-corner-reorient.js` | flip host / reorient |
| `js/furniture/ikea-room-fixture.js` | collect/restore, `restoreLShapeAndJoints`, **limitation metadata-only** |
| `js/sections/section-manager.js` | place секции → linked pair; позже `__cldEnsureJointsForLPair` в layout paths |
| `js/kitchen/kitchen-section-layout.js` | band grids serialize/apply («WallRun» ячеек) |

---

## 6. Проблемы (с подтверждением из кода)

### P1 — Seat не вызывается при restore (главная)

`restoreLShapeAndJoints` документирует и пушит limitation: нет `seatKitchenJointCorner` / `ensureJointsForLPair`.  
→ После Continue угол = JSON + визуал модулей, не полный parametric seat.

### P2 — Division L-флаги / reserves не в fixture

`serializeDivision` не пишет `kitchenCornerHostAtStart`, seatAway, segments, `_kitchenJointReserves`.  
→ Даже при наличии `cornerCell` в Joint host-проекция и резервы стен не восстанавливаются тем же путём, что live seat.

### P3 — `jointId` привязан к старым section id

`ensureKitchenJoint` строит id из sectionA/B id; restore **не** переписывает `jointId`, только поля section*.  
→ Стабильность stamp на модуле ок; повторный ensure после edit → новый id / рассинхрон.

### P4 — Пара секций без recreate linked joint geometry

Restore: `skipAttached: true`, затем только metadata `lShape`.  
→ Не проходит `createLinkedSectionFromJoint` (offsets стыка из corner-joint). Offsets из fixture могут компенсировать **если** были сохранены; логика стыка не переигрывается.

### P5 — Сценарий B (edit после Continue)

Ширина спец-зоны / reorient / flip опираются на Joint + reserves + `projectCornerCell*`. Без seat — поведение **не гарантировано** кодом restore (нужен ручной e2e).

---

## 7. Совместимость с этапами 8–10

| Этап | Влияние на L-persist |
|------|----------------------|
| **8** ceiling tiers | После мебели; не трогает Joint. НШ1/НШ2 высоты на углу получают тот же post-pass. Не закрывает P1. |
| **9** empty + `furniture_delete` | Clear обнуляет `kitchenJoints`. Пустой draft/Continue ок. Не ломает L-сериализацию при непустой кухне. |
| **10** indiv delete | Удаляет группу; dirty ok. **Не** чистит `joint.moduleUuid` / unbind (в FM grep bind/unbind на delete нет) → риск stale uuid в Joint до следующего seat/bind. Отдельно от P1. |

Этапы 8–10 **не заменяют** реанимацию seat и **не доказаны** как ломающие collect L; главный пробел — restore угла.

---

## 8. Риски для уже работающего

- Прямые (не L) кухни: путь restore секций/мебели/bands без Joint — без изменений в этом аудите.
- Вызов seat при restore **может** сдвинуть геометрию vs snapshot — поэтому Stage2 сознательно metadata-only; будущий фикс должен быть узким и с e2e.
- Не трогать параметрическое ядро Joint/ClodisBuilder при фиксе — только orchestration в fixture restore.

---

## 9. Минимальный план исправления (без смены ядра)

**Не делать сейчас.** Кандидат на Stage12 (после явного ОК):

1. После `restoreLShapeAndJoints` + мебели + uuid remap: для каждой L-пары (`getLShapePairForSection`) вызвать существующий `ensureJointsForLPair(primary, attached)` **или** для каждого remapped joint — `seatKitchenJointCorner(j)` + `seatKitchenJointUpperCorner(j)` (предпочтительно переиспользовать ensure*, не дублировать геометрию).
2. Перепривязать модули: по `__kitchenJointId` / зоне host → `bindModuleToJoint` с **актуальным** joint (если id пересобран — обновить stamp).
3. Опционально: после seat — один `rebuildSectionZoneEditIconsForSection` на обе стороны.
4. Не менять WallRun/Brain/Builder/rhythm/depth/CFRN; не новая архитектура Joint.
5. Если ensure* пересоздаёт jointId — единым проходом обновить map + stamps модулей.

Альтернатива ещё уже: только `seatKitchenJointCorner` на уже remapped joints **без** ensure (сохранить old jointId) + `applyJointReserves` косвенно через seat.

---

## 10. Браузерные тесты после будущего фикса

**Сценарий A — restore без правок**

1. L-кухня, модули на обеих стенах + угловой НМУ (+ НШ при наличии).  
2. Дождаться autosave / проверить `kitchenJoints` / `lShape` в `clodis_room_draft_v2`.  
3. F5 → Continue.  
4. Сверить: обе секции, pairId, спец-ширина, карандаши, отсутствие limitation «metadata only» (или limitation снята).  
5. Console: нет второго Joint с новым id без надобности.

**Сценарий B — edit после restore**

1. После Continue сменить ширину ячейки у угла / reorient.  
2. Seat и соседние модули ведут себя как до F5; нет «поехавшего» угла только визуально.

**Регрессии**

- Прямая стена (не L): Continue как Stage8–10.  
- Удаление последнего модуля (Stage9) на L затем empty Continue.  
- Indiv delete НМ в спец-ячейке (Stage10): Joint stamp / оставшиеся НШ.

---

## 11. Итог одной фразой

Draft **умеет запомнить** L-пару и Joint JSON; Continue **не делает** угол снова параметрическим seat-ом — это подтверждено явным комментарием и limitation в `restoreLShapeAndJoints`, а не догадкой.
