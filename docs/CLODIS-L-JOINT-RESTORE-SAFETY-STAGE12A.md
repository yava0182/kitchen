# CLODIS — этап 12A. Безопасная реанимация L-Joint после Continue

**Дата:** 2026-10-30  
**Режим:** только исследование (код не менялся)  
**База:** Stage11 `CLODIS-L-KITCHEN-PERSISTENCE-AUDIT-STAGE11.md` + `kitchen-joint.js` / `ikea-room-fixture.js`

---

## 0. Вердикт

| Вопрос | Ответ по коду |
|--------|----------------|
| Можно ли вызвать `ensureJointsForLPair` после Continue? | **Нет (опасно):** создаст **второй** Joint с новым `jointId` из новых section id, старый remapped Joint останется в map. |
| Можно ли вызвать `seatKitchenJointCorner` на уже remapped Joint? | **Да** — `ensureKitchenJoint` **не** требуется. Seat пишет reserves + projection + flags. |
| Нужен ли атомарный remap `jointId`? | **Для минимального патча — нет.** Оставить старый `jointId` как ключ map + stamp на мебели (текущий restore). Remap id — отдельный опциональный hardening. |
| Сдвигает ли seat мебель сам? | **Нет** прямого move/rebuild групп. Меняет division / reserves / `cornerCell`. Ширина спец-зоны может перезаписаться → визуальный рассинхрон модуля до следующего rebuild. |
| Идемпотентность seat? | **Почти**, если передать opts из snapshot `cornerCell`. Вызов `seat(j, {})` форсирует `clearMm: 10` и atStart из wall-rules после reserves. |

---

## 1. Идентичность Joint после restore

### 1.1 Текущий restore (`restoreLShapeAndJoints`)

| Поле | После Continue |
|------|----------------|
| Ключ `state.kitchenJoints` | **старый** `jointId` (`kj\|L\|pair\|oldA\|oldB`) |
| `joint.jointId` | **старый** (не переписывается) |
| `sectionAId` / `sectionBId` / `hostSectionId` | **новые** (remap) |
| `moduleUuid` / `upperModuleUuid` | **новые** uuid групп (если были в `uuidMap`) |
| `furniture.__kitchenJointId` | **старый** jointId из fixture (совпадает с ключом map) |

Согласованность stamp ↔ map при текущем restore: **да**.  
Согласованность с формулой `ensureKitchenJoint` (id из **текущих** section id): **нет** — новый ensure ≠ старый ключ.

### 1.2 Поведение API после секций с новыми ID

| Вызов | Эффект |
|-------|--------|
| `ensureKitchenJoint({ sectionA, sectionB, … })` | Считает `jointId` из **новых** id → `map[newId]` пуст → **создаёт новый** Joint (`moduleUuid: null`, `cornerCell: null`). Старый remapped Joint **не удаляется**. |
| `ensureJointsForLPair(primary, attached)` | = ensure + `seatKitchenJointCorner` + `seatKitchenJointUpperCorner` + sync meshes → **второй** Joint + seat на нём. Нарушение инварианта «1 Joint на L-пару». |
| `seatKitchenJointCorner(joint)` | Работает с переданным объектом; `_secById(hostSectionId)` — нужен **уже remapped** host. Ensure не нужен. |
| `seatKitchenJointUpperCorner(joint)` | То же; **не** пишет `customZoneWidthsMm` низа. |
| `bindModuleToJoint(group, joint)` | Пишет `__kitchenJointId = joint.jointId`, для не-ВМУ ставит `joint.moduleUuid = group.uuid`. |

### 1.3 Схема: сохранить ID vs атомарный remap

```
                    ┌─────────────────────────────────────┐
  ТЕКУЩИЙ RESTORE   │ map[oldJointId] = joint             │
                    │ joint.section* = newIds             │
                    │ furniture.__kitchenJointId = oldId  │
                    └─────────────────────────────────────┘
                                      │
          ┌───────────────────────────┴───────────────────────────┐
          ▼                                                       ▼
  A) СОХРАНИТЬ old jointId                               B) АТОМАРНЫЙ REMAP
  + seat*(existing joint)                                newId = kj|L|pair|newA|newB
  + НЕ вызывать ensureJointsForLPair                     delete map[old]; map[new]=joint
  Минимальный патч Stage12B                              joint.jointId = newId
  Риск: любой later ensure → дубль                       stamp мебели → newId
                                                         Сложнее, чище для future ensure
```

**Рекомендация 12A→12B:** путь **A** (сохранить ID + seat only). Remap B — только если позже нельзя избежать ensure.

---

## 2. Seat без создания Joint

### 2.1 Нужен ли `ensureKitchenJoint`?

**Нет.** `seatKitchenJointCorner` / `seatKitchenJointUpperCorner` принимают готовый `joint`.

### 2.2 Что делает `seatKitchenJointCorner` (побочные эффекты)

Порядок внутри:

1. `applyJointReserves` → пишет `_kitchenJointReserves[joint.jointId]` на обеих секциях (**восстанавливает reserves**, которых нет в fixture).
2. `recomputeJointCornerCell` → пересобирает `joint.cornerCell` (W из opts → customZoneWidthsMm host → старый cell → 1050).
3. `syncJointDerivedSectionFlags` → host/away, `kitchenCornerSeatAway`, `kitchenCornerHostAtStart`.
4. `_clearJointCornerProjectionOnSection(other)` → на **не-host** может **удалить** `customZoneWidthsMm[zi]` у края к углу.
5. `projectCornerCellOntoHostSection` → host `customZoneWidthsMm[zi] = cornerCell.widthMm` + host flags; null’ит L-segments.

**Не делает:** `scene` move мебели, `rebuildForCellWidthMm`, place/delete модулей, создание Joint.

### 2.3 Ширины ячеек

| Зона | Эффект seat низа |
|------|------------------|
| Спец на host | Перезапись W = `cornerCell.widthMm` (после recompute). Если уже совпадало с restore `customZoneWidthsMm` — **идемпотентно**. |
| Край other (attached) | `_clearJointCornerProjectionOnSection` может **снести** custom width на zi угла. |
| Прочие ячейки | Не трогает напрямую. |
| Upper seat | **Не** пишет `customZoneWidthsMm` низа; только `_kitchenJointUpperReserves` + `upperCornerCell`. |

### 2.4 Сдвиг шкафов

Seat **сам** группы не двигает. Риск: изменение W спец-ячейки / flags → рассинхрон bbox модуля vs ячейка до карандаша/rebuild. Reorient-пути в `kitchen-corner-reorient.js` после seat зовут `rebuildForCellWidthMm` — **restore seat не должен** молча звать rebuild всех углов без политики (нарушит инвариант «положения шкафов»).

### 2.5 Повторный вызов

| Вызов | Риск накопления |
|-------|-----------------|
| `seat(j, { widthMm, atStart, clearMm, returnMm, depthMm })` из snapshot cell | Низкий — целевой идемпотентный режим для restore |
| `seat(j, {})` | `clearMm` в seat **всегда** уходит как `10` в opts → затирает иной clear из snapshot; atStart берётся из reserves (wall rules), не из `cornerCell.atStart` до reserves |
| Двойной seat подряд с полными opts | Ожидаемо стабильно |
| `ensureJointsForLPair` повторно | Дубль Joint + seat на новом id |

### 2.6 Upper (НШ1/НШ2 у угла)

`seatKitchenJointUpperCorner`: безопаснее для ширин низа. Нужен после remap `upperHostSectionId` (seat сам синхронизирует upperHostSectionId от upperHostSide + section ids). Не создаёт мебель.

---

## 3. Привязка модулей

| Ситуация | Поведение |
|----------|-----------|
| Модуль был, uuid remapped, `__kitchenJointId` = oldId | `getKitchenJoint(oldId)` / `findKitchenJointByModule` — **OK** без re-bind |
| `joint.moduleUuid` remapped, группа на сцене | Связь достаточна; `bindModuleToJoint` опционален (идемпотентен, если тот же jointId) |
| До F5 удалили угловой модуль, Joint всё ещё с `moduleUuid` | Remap: uuid нет в `uuidMap` → в Joint остаётся **мёртвый** uuid. Группы с таким uuid нет. **Не создавать** модуль. Перед/после seat: если `moduleUuid` и нет группы → `moduleUuid = null` (и upper аналогично) |
| Stage10 delete без очистки Joint | Тот же stale uuid — та же чистка |

`bindModuleToJoint` на отсутствующей группе не вызывать. Не звать bind «на всякий» для всех мебелей зоны — ВМУ (`kitchen_wall_corner`) **не** должен затирать `moduleUuid` низа (логика уже в bind).

---

## 4. Безопасный порядок восстановления

### 4.1 Уже есть в `restoreIkeaRoomFixture`

1. Комната / kitchenProject  
2. Clear scene (+ пустой `kitchenJoints`)  
3. Openings  
4. Секции (`skipAttached: true`) + division widths + **band grids**  
5. Мебель + `uuidMap`  
6. `restoreLShapeAndJoints` (metadata only)  
7. Stage8 ceiling tiers  
8. Step / camera  

### 4.2 Предлагаемая вставка (будущий 12B) — без правок сейчас

После шага 6 (lShape + remapped joints + мебель), **до** ceiling tiers:

6a. **Sanitize stale uuids** на Joint (нет Object3D → null).  
6b. Для каждого Joint в `state.kitchenJoints` с валидными `_secById(sectionA/B)`:  
    - `seatKitchenJointCorner(j, optsFrom(j.cornerCell))`  
    - `seatKitchenJointUpperCorner(j, optsFrom(j.upperCornerCell))`  
6c. Опционально: `bindModuleToJoint` только если `scene.getObjectByProperty('uuid', j.moduleUuid)` найден.  
6d. Один `__cldSyncCornerCellMeshes` (как в ensure pair), без ensure pair.  
7. Ceiling tiers (Stage8) — **после** seat, как сейчас после мебели (H НШ не от Joint).  
8. Карандаши: при необходимости `rebuildSectionZoneEditIconsForSection` на обе стороны пары (после seat/tiers).

### 4.3 Чего не делать в этой последовательности

| Шаг | Почему нельзя |
|-----|----------------|
| `ensureJointsForLPair` / `ensureKitchenJoint` | Второй Joint |
| `createLinkedSectionFromJoint` | Дубль/resize секций; offsets уже из fixture |
| `reapplyKitchenLPairAllSingles` | Тянет ensure joints + division variant 0 — ломает widths |
| Массовый `rebuildForCellWidthMm` без политики | Двигает/пересобирает шкафы |
| Seat **до** мебели+uuidMap | moduleUuid/bind бессмысленны; порядок OK и после мебели |
| Seat **до** remap section ids на Joint | `_secById` не найдёт host |

---

## 5. Инварианты (цель 12B)

| Инвариант | Как держать |
|-----------|-------------|
| Число секций / мебели | Не create/delete в seat path |
| Идентичность модулей (uuid после restore) | Не пересоздавать Furniture |
| Ширины обычных ячеек | Не звать allSingles / ensure pair; seat только спец zi host (+ риск clear on other) |
| Позы шкафов | Не rebuild; seat без move |
| Ровно 1 Joint на L-пару | Только seat на existing map entries; **запрет** ensure* |

Проверка после патча (ручной): `Object.keys(state.kitchenJoints).length` = числу углов до F5; нет второго ключа `kj|L|pair|newA|newB`.

---

## 6. Минимальный план реализации (не внедрять в 12A)

1. Хелпер в `ikea-room-fixture.js` (orchestration only): `reviveKitchenJointsAfterRestore()`.  
2. Sanitize stale `moduleUuid` / `upperModuleUuid`.  
3. Для каждого joint:  
   `seatKitchenJointCorner(j, { widthMm, atStart, clearMm, returnMm, depthMm }` из snapshot cell)`  
   + аналогично upper.  
4. Не вызывать `ensureJointsForLPair` / `ensureKitchenJoint`.  
5. Снять/смягчить limitation string, если revive ok.  
6. Bust + отчёт Stage12B + e2e A/B из Stage11.  
7. **Не** трогать Brain / WallRun / Builder / rhythm / depth / CFRN / joint algorithms.

Опционально позже: атомарный remap jointId + stamps (путь B), если всплывут дубли от других UI-путей ensure.

---

## 7. Риски, которые нельзя закрыть без браузерного теста

1. **`_clearJointCornerProjectionOnSection(other)`** — снос custom width на плече у угла; визуал/сетка after Continue.  
2. **Рассинхрон W модуля vs спец-ячейка** без rebuild — «дырка» или налезание до первого карандаша.  
3. **Flip host / нестандартный atStart** — seat с wall-derived reserves vs snapshot (снять opts.from cell).  
4. **П-кухня (2 Joint)** — host-map на spine; seat L-логики на каждом Joint; регресс U.  
5. **Пустой угол** (модуль удалён, Joint жив) — UI/meshes после sync.  
6. **Повторный Continue** / autosave сразу после revive — нет дублей Joint в следующем draft.  
7. **Stage10 delete** после revive — stale uuid + карандаши.  
8. **clearMm: 10** при ошибочном `seat(j,{})` без opts — изменение return/clear vs до F5.

---

## 8. Итог одной фразой

Безопасный путь: **не ensure pair**, а **seat(+upper) на уже remapped Joint со старым `jointId`**, с opts из snapshot `cornerCell`, sanitize мёртвых uuid, после мебели и до ceiling tiers — без второй системы Joint и без автосоздания модулей.
