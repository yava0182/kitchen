# CLODIS — этап 12B. Восстановление L-Joint после F5

**Дата:** 2026-10-30  
**Bust:** `20261030-ljoint12b`  
**Основа:** `docs/CLODIS-L-JOINT-RESTORE-SAFETY-STAGE12A.md`  
**Режим:** минимальный патч только orchestration restore

---

## 1. Что сделано

В `js/furniture/ikea-room-fixture.js`:

- Helper **`reviveKitchenJointsAfterRestore()`**
  - sanitize мёртвых `moduleUuid` / `upperModuleUuid`;
  - для каждого Joint в `state.kitchenJoints`: `seatKitchenJointCorner` + `seatKitchenJointUpperCorner` с opts из snapshot `cornerCell` / `upperCornerCell`;
  - **не** вызывает `ensureJointsForLPair` / `ensureKitchenJoint` / `createLinkedSectionFromJoint`;
  - snapshot/compare инвариантов (секции, мебель pose, joint id set, ordinary zone widths);
  - `__cldSyncCornerCellMeshes` + rebuild карандашей затронутых секций.
- Вызов: после `restoreLShapeAndJoints`, **до** Stage8 ceiling tiers.
- При успехе снимается limitation `pending revive…`; при провале — limitation `joint revive failed: …`, `restore.jointRevive` в результате.

`jointId` **сохранён** (старый ключ) — без атомарного remap.

---

## 2. Изменённые файлы

| Файл | Изменение |
|------|-----------|
| `js/furniture/ikea-room-fixture.js` | revive + invariants + wire |
| `js/main-refactored.js` | import bust |
| `js/room/room-draft-autosave.js` | import bust |
| `index.html` / `public/index.html` | `20261030-ljoint12b` |

**Не трогали:** Brain, WallRun, ClodisBuilder, rhythm, depth, CFRN, joint algorithms, draft schema.

---

## 3. Результаты проверок

### Подтверждено кодом

| Проверка | Статус |
|----------|--------|
| Revive после remap секций/UUID и `restoreLShapeAndJoints` | да |
| До ceiling tiers | да |
| Нет `ensureJointsForLPair` / `createLinkedSectionFromJoint` в revive | да |
| Seat с opts из `cornerCell` | да |
| Stale uuid → null | да |
| Инварианты: joint count/ids, furniture count/pose, ordinary widths | да |
| Провал invariants → `ok: false` + limitation, не «тихий успех» | да |
| `node --check` fixture | OK |

### Подтверждено автоматическими тестами

Нет отдельного e2e/jest на L-Continue в репо для этого патча.  
**Автотестов нет** — только syntax-check.

### Требует ручной проверки в браузере

Открыть: `http://localhost:8100/?v=20261030-ljoint12b` (Ctrl+F5).

| # | Сценарий | Ожидание | Статус |
|---|----------|----------|--------|
| A | L + НМУ + шкафы → save → F5 → Continue | геометрия; `jointRevive.ok`; 1 Joint на пару; карандаши | **ручная** |
| B | После Continue — ширина ячейки у угла | **нет второго Joint**; стык жив | **ручная (блокирующая)** |
| C | Delete углового модуля | нет живой ссылки uuid в Joint | **ручная** |
| D | Save → F5 → Continue ×2 | число Joint не растёт | **ручная** |
| E | Прямая кухня, НШ tiers, indiv delete, autosave | регрессии Stage8–10 | **ручная** |

В консоли после Continue смотреть:

- `[IKEA fixture] joint revive ok` / `joint revive failed`
- `Object.keys(state.kitchenJoints)` — без второго `kj|L|pair|<newA>|<newB>` после edit (сценарий B)

---

## 4. Расхождения / риски

1. **Сценарий B — блокирующий для «L полностью восстановлена».** Если edit угла зовёт `ensureKitchenJoint` и плодит второй Joint — **не маскировать**; зафиксировать и остановить расширение патча (по ТЗ). Remap jointId не делаем без согласования.
2. Seat на non-host может снести custom width края (`_clearJointCornerProjectionOnSection`) — в invariants это **разрешено**; визуал/сетка — ручная приёмка.
3. При провале invariants seat уже мог частично измениться state — rollback нет (минимальный патч); limitation + `jointRevive.ok === false`.
4. Пока A+B не зелёные вручную — **не объявлять L-кухню полностью восстановленной**.

---

## 5. Cache bust

`20261030-ljoint12b`
