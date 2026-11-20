# CLODIS — этап 12D. Атомарный remap Joint ID при восстановлении

**Дата:** 2026-10-30  
**Bust:** `20261030-ljoint12d`  
**Основа:** Stage12A–12C  
**Режим:** минимальный orchestration в `ikea-room-fixture.js` (ядро Joint/seat не менялось)

---

## 1. Предварительная проверка ссылок

| Ссылка | Обновляется в 12D? |
|--------|-------------------|
| `state.kitchenJoints` keys | да → canonical id |
| `joint.jointId` | да |
| `joint.cornerCellId` / `upperCornerCellId` | да (`cc\|…` / `ucc\|…`) |
| `cornerCell.cornerCellId` / `upperCornerCell.cornerCellId` | да |
| `furniture.__kitchenJointId` | да |
| `furniture.__kitchenCornerCellId` | да |
| `moduleUuid` / `upperModuleUuid` | уже remapped в 12B path; не трогаем uuid |
| `_kitchenJointReserves` / `_kitchenJointUpperReserves` keys | rekey если были |
| Corner meshes `userData.jointId` | пересоздаются `__cldSyncCornerCellMeshes` после revive |
| Формула L | `kj\|L\|pair\|{A}\|{B}` |
| Формула U | `kj\|U\|left\|{A}\|{B}` / `kj\|U\|right\|…` |

Дополнительных зависимостей, блокирующих полный проход, **не найдено**. Частичный remap не внедрялся: при conflict map **не** коммитится.

---

## 2. Что сделано

1. `computeCanonicalKitchenJointId` — зеркало формулы `ensureKitchenJoint`.  
2. `atomicRemapKitchenJointIdsAfterRestore()` — строит `newMap` + `old→new`, conflict → ошибка без assign; затем stamps мебели + reserve keys.  
3. Порядок restore: `restoreLShapeAndJoints` → **remap** → `reviveKitchenJointsAfterRestore` → ceiling tiers.  
4. При провале remap revive **не** вызывается.

---

## 3. Изменённые файлы

| Файл | Изменение |
|------|-----------|
| `js/furniture/ikea-room-fixture.js` | remap + wire |
| `js/main-refactored.js` | bust |
| `js/room/room-draft-autosave.js` | bust |
| `index.html` / `public/index.html` | `20261030-ljoint12d` |
| `scripts/check-l-joint-id-remap-stage12d.mjs` | автопроверка remap→ensure |

---

## 4. Проверки

### Код

- Remap до seat; нет `ensureJointsForLPair` в restore path.  
- Conflict → limitation, без commit new map.  
- `node --check` fixture — OK.

### Автоматические (формула id + ensure, без браузера)

```bash
node scripts/check-l-joint-id-remap-stage12d.mjs
# PASS: remap then ensure reuses same Joint (no duplicate)
```

`check-l-joint-id-dup-after-restore.mjs` (12C) по-прежнему демонстрирует баг **без** remap — исторический контроль.

Полноценный интеграционный тест с реальным `kitchen-joint.js` + THREE в Node **нет**.

### Ручная (обязательна для закрытия этапа)

Открыть: `http://localhost:8100/?v=20261030-ljoint12d` (Ctrl+F5).

| # | Сценарий | Ожидание | Статус |
|---|----------|----------|--------|
| A | Save → F5 → Continue | 1 Joint; id = `kj\|L\|pair\|{newA}\|{newB}` | **ручная** |
| B | После Continue `ensure` / force allSingles | **не** второй Joint | **ручная (блокер)** |
| C | Ширина ячейки у угла | без дубля / слома стыка | **ручная** |
| D | Delete + place углового | один Joint | **ручная** |
| E | Повторный F5 → Continue | count Joint стабилен | **ручная** |
| F | Прямая кухня, НШ heights, autosave | регресс Stage8–10 | **ручная** |

Консоль:

```js
Object.keys(state.kitchenJoints || {})
// и после __cldForceKitchenLAllSingles() — тот же набор
```

**Этап не считать закрытым без зелёного B.**

---

## 5. Риски

1. Порядок `sectionAId`/`sectionBId` в snapshot должен совпадать с тем, что передаёт `ensureJointsForLPair(primary, attached)`. Иначе canonical id ≠ ensure id (редкий legacy snapshot).  
2. Remap fail оставляет Joint под old id (как 12B) + limitation — визуал seat не revive.  
3. Meshes до sync могут кратко нести старый id — закрывается sync после revive.

---

## 6. Bust

`20261030-ljoint12d`
