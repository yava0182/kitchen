# CLODIS — этап 12C. Проверка дублирования Joint после restore

**Дата:** 2026-10-30  
**Режим:** аудит + автоматическая проверка id-логики (**рабочий код приложения не менялся**)  
**Контекст:** Stage12B `20261030-ljoint12b` — пользователь подтвердил визуальный Continue L-кухни

---

## 0. Вердикт

| Утверждение | Статус |
|-------------|--------|
| После Continue в map лежит Joint со **старым** `jointId` и **новыми** `sectionAId`/`sectionBId` | да (12B) |
| `ensureKitchenJoint(primary, attached)` с актуальными id секций считает **другой** `jointId` | да |
| При таком ensure возникает **второй** Joint на ту же L-пару | **да — подтверждено автоматическим сценарием** |
| Смена ширины ячейки (`setZoneCustomWidthMm`) сама зовёт ensure | **нет** (по коду) |
| Дубль возможен на штатных путях, которые зовут `ensureJointsForLPair` / `ensureKitchenJoint` без поиска remapped Joint | **да** |

**L-кухня после F5 визуально ок ≠ иммунитет к дублю Joint при последующем edit.**

---

## 1. Формула id vs restore

```text
ensureKitchenJoint:
  jointId = "kj|L|pair|{sectionA.id}|{sectionB.id}"

restore (12B):
  map[oldJointId] = joint
  joint.jointId     = oldJointId          // kj|L|pair|oldA|oldB
  joint.sectionAId  = newA
  joint.sectionBId  = newB
  furniture.__kitchenJointId = oldJointId
```

После Continue:

| Lookup | Результат |
|--------|-----------|
| `getKitchenJoint(furniture.__kitchenJointId)` | находит **старый** Joint |
| `listKitchenJoints` filter по `sectionAId/BId` | находит **старый** Joint (ids remapped) |
| `ensureKitchenJoint({ sectionA: newA, sectionB: newB })` | ключ `kj\|L\|pair\|newA\|newB` пуст → **создаёт новый** |

---

## 2. Карта вызовов (рабочий код)

### 2.1 `ensureKitchenJoint` / `ensureJointsForLPair`

| Место | Когда | После restore |
|-------|--------|----------------|
| `kitchen-joint.js` `ensureJointsForLPair` | create L Joint + seat | **создаёт new id**, если нет ключа new |
| `section-manager.js` `reapplyKitchenLPairAllSingles` | place L-секции; `__cldForceKitchenLAllSingles` | **всегда** `__cldEnsureJointsForLPair` → риск дубля |
| `kitchen-corner-cell.js` `_jointFromSectionId` | нет Joint по section id → fallback ensure pair | если filter нашёл remapped — OK; если 0 — **дубль** |
| `kitchen-corner-reorient.js` `_reorientLPair` | нет Joint по module stamp → ensure | stamp oldId → обычно OK; без stamp → **дубль** |
| `kitchen-corner-reorient.js` U path | аналогично ensure U | риск для П |

### 2.2 `seatKitchenJointCorner` / Upper (без нового Joint)

| Место | Риск дубля id |
|-------|----------------|
| `reviveKitchenJointsAfterRestore` (12B) | нет (seat на existing) |
| `ensureCornerCellOnJoint` / `ensureAllCornerCells` | нет (итерация existing map) |
| reorient `_reorientViaJoint` после найденного joint | нет |

### 2.3 Ширина ячейки / модуль

| Действие | Ensure? |
|----------|---------|
| `setZoneCustomWidthMm` / `__clodisSetZoneCustomWidthMm` | **нет** |
| `applyModuleWidthCm` → setZone… | **нет** |
| `findKitchenJointForSectionZone` (FM corner hand) | только lookup |

**Вывод:** сценарий «только карандаш ширины» сам по себе дубль **не создаёт**. Дубль — на путях **ensure*** / force allSingles / reorient без stamp / `_jointFromSectionId` miss.

### 2.4 После появления дубля

`findBySection` даёт **2** Joint на одну пару → `_jointFromSectionId` для L берёт `matches[0]` (произвольный) → orphan + рассинхрон seat/мебели.

---

## 3. Точный сценарий возникновения дубля

1. L-пара создана → Joint `kj|L|pair|101|202`.  
2. Save / F5 / Continue (12B) → map key и `joint.jointId` остаются `…101|202`, `section*` = `501`/`602`, мебель stamp = old id.  
3. Штатный вызов `ensureJointsForLPair(sec501, sec602)` (например `reapplyKitchenLPairAllSingles` / `__cldForceKitchenLAllSingles`, или reorient без успешного `findKitchenJointByModule`, или `_jointFromSectionId` при пустом filter).  
4. `ensureKitchenJoint` пишет `kj|L|pair|501|602` → **2 Joint**.

Автопроверка (зеркало формулы ensure, без браузера):

```bash
node scripts/check-l-joint-id-dup-after-restore.mjs
```

Результат прогона: **PASS: duplicate KitchenJoint mechanism confirmed**  
(`afterCount: 2`, `duplicate: true`, `sectionLookupAfter: 2`).

Полноценный e2e «клик ширины в браузере» в репо **нет** (нет jest/vitest на комнату). Инфраструктура не позволяет подменить реальный UI-path без браузера.

---

## 4. Инварианты (целевые)

| Инвариант | После 12B Continue | После ensure на new ids |
|-----------|--------------------|-------------------------|
| 1 логический Joint на L-пару | ок (1 entry) | **нарушен** (2 entries) |
| Корректные sectionId на Joint | ок (remapped) | оба имеют new ids |
| Связь с мебелью (`__kitchenJointId`) | указывает на old | stamp → old; new Joint `moduleUuid: null` |
| Нет orphan | ок | **old или new** orphan относительно UI lookup |
| CornerCell / seat | seat на old (12B) | seat на **new** в ensureJointsForLPair; old cell устаревает |

---

## 5. Минимальный способ предотвращения (без смены ядра геометрии)

**Не внедрять в 12C.** Кандидаты orchestration-only:

1. **Dedup-обёртка** перед `ensureKitchenJoint` / `ensureJointsForLPair`:  
   найти Joint где `{sectionAId,sectionBId}` = пара (порядок A/B), если есть — **вернуть его**, не создавать по новой формуле.  
2. Либо **атомарный remap** `jointId` при restore на `kj|L|pair|newA|newB` + обновить stamps мебели (согласовать отдельно; 12A/B отложили).  
3. В `reapplyKitchenLPairAllSingles`: не слепой ensure — сначала lookup по section ids.

Предпочтение для узкого фикса: **(1)** на уровне `ensureKitchenJoint` или window-обёртки — один раз закрывает все call sites.

**Не** трогать Brain / WallRun / Builder / rhythm / depth / CFRN / алгоритмы seat.

---

## 6. Ручные проверки в браузере (после будущего фикса / сейчас)

На `?v=20261030-ljoint12b` (или следующем bust):

| # | Действие | Смотреть |
|---|----------|----------|
| 1 | Continue L | `Object.keys(state.kitchenJoints).length` = числу углов |
| 2 | Только ширина соседней ячейки | число Joint **не** растёт (ожидаемо и сейчас) |
| 3 | `__cldForceKitchenLAllSingles()` или разворот угла | **сейчас ожидаем дубль** (2 ключа: old+new) |
| 4 | Re-place НМУ после delete | проверить count Joint |
| 5 | Повторный F5 | count не растёт от одного только restore |

Консоль-хелпер:

```js
Object.keys(state.kitchenJoints || {})
```

---

## 7. Разделение доказательств

| Уровень | Что |
|---------|-----|
| **Код** | формула id; call sites ensure; setZone без ensure; 12B keep old id |
| **Автотест** | `scripts/check-l-joint-id-dup-after-restore.mjs` — механизм дубля |
| **Браузер** | визуальный Continue (пользователь); edit/force allSingles — **ещё ручная** |

---

## 8. Итог

Дубль **реален** при любом post-restore `ensureKitchenJoint`/`ensureJointsForLPair` на новых section id, пока map хранит Joint под старым ключом.  
Смена ширины ячейки сама ensure **не** вызывает — но «штатное редактирование угла» (force grid / reorient / recreate joint path) — вызывает.

Рабочий код **не менялся**. Фикс — отдельное согласование (dedup ensure или remap id).
