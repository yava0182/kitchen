# CLODIS — диагностика сохранения высот НШ1 / НШ2

**Дата:** 2026-10-30  
**Режим:** только аудит (код не менялся)  
**Симптом:** после смены высоты комнаты Vertical Rhythm визуально верно перестраивает НШ1/НШ2; после autosave → F5 → Continue высоты неверны.  
**Вне scope:** формулы Rhythm, Gola, depth engines, ClodisBuilder, Brain, WallRun, CFRN, free height UI.

---

## 1. Цикл по коду (кратко)

```
updateRoomDimensions / recreateRoomWithShape
  → state.room.height = newH
  → applyKitchenCeilingTiersToScene()          // sync
  → __cldMarkRoomDraftDirty('room_dimensions') // ПОСЛЕ tiers
  → debounce 1.5s → collectIkeaRoomFixture → clodis_room_draft_v2

F5 → Continue → loadRoomDraft → restoreIkeaRoomFixture
  → hydrateKitchenProject
  → applyRoomSizeFromFixture (room H)          // tiers тут почти пустая сцена
  → clearFurniture → restore sections → restoreOneFurniture×N
  → (НЕТ applyKitchenCeilingTiersToScene)
```

**Вывод по порядку dirty:** rebuild НШ1/НШ2 **завершается до** mark dirty. Отдельного «сохранения во время промежуточного rebuild» по этому пути нет.

Файлы: `js/room/room-manager.js` (~529–537), `js/kitchen/kitchen-base-engine.js` (`applyKitchenCeilingTiersToScene`), `js/furniture/ikea-room-fixture.js` (collect / restore).

---

## 2. Что делает ceiling tiers на сцене (состояние A)

Для `kitchen_wall_mid` / `kitchen_wall_top` (`applyKitchenCeilingTiersToScene`):

| Поле | Пишется? |
|------|----------|
| `customHeightMm` | да (= carcass H из sizing) |
| `__kitchenCarcassHeightMm` | да |
| `customFloorClearanceMm` | да |
| `__initialSectionSizeMm` | да, через `rebuildFurnitureGroupForSectionResize` (`y = H`) |
| `clodisVariables` | да (write в rebuild) |
| `__kitchenBandHighMm` / `__kitchenBandTopMm` | **нет** (в отличие от place → `stampKitchenUserData`) |
| `clodisRoots` на group | **не перезаписываются** после rebuild (writeUserDataClodisRoots в success-path resize **нет**) |

Геометрия на сцене = результат rebuild с `sectionSize.y = H`. Это согласуется с «перестройка при смене высоты комнаты уже работает».

---

## 3. Что попадает в draft (состояние B)

`collectIkeaRoomFixture` для мебели:

| Поле | Collect |
|------|---------|
| `room.height` | да |
| `customHeightMm` | да |
| `initialSectionSizeMm` | да (`__initialSectionSizeMm`) |
| `clodisRoots` / `clodisVariables` / `clodisData` | да |
| `kitchenCarcassDepthMm` | да |
| `__kitchenCarcassHeightMm` | **нет** |
| `__kitchenBandHighMm` / `__kitchenBandTopMm` | **нет** |
| `customFloorClearanceMm` | **нет** |

Dirty `room_dimensions` есть (Stage5). Сериализация высот корпуса НШ опирается на **`customHeightMm` + `initialSectionSizeMm.y`**, не на полный набор rhythm-stamps.

---

## 4. Что делает restore (состояние C)

`restoreOneFurniture`:

1. `FurnitureCtor(roots, { sectionSize: initialSectionSizeMm, variables })` — **геометрия из sectionSize + roots**, не из `customHeightMm`.
2. **После** билда: `ud.customHeightMm = item.customHeightMm`.
3. **Нет** `snapFurnitureGroupPlacementY`.
4. **Нет** восстановления `__kitchenCarcassHeightMm` / band stamps / `customFloorClearanceMm`.

`restoreIkeaRoomFixture` порядок:

1. Hydrate `kitchenProject`
2. `applyRoomSizeFromFixture` → при смене H зовёт `updateRoomDimensions` → ceiling tiers на **ещё не восстановленной** (после F5 — пустой) сцене, затем `clearRoomFurnitureAndSections`
3. Секции → мебель
4. **Повторного `applyKitchenCeilingTiersToScene()` нет**

Рабочий канон после смены высоты комнаты в сессии: *roomH → ceiling tiers*.  
После Continue канон **не повторяется** для уже поставленных НШ: ожидается, что один только snapshot furniture уже достаточен.

---

## 5. Где расхождение A → B vs B → C

### По коду наиболее вероятная поломка: **B → C**

| Проверка | Вердикт |
|----------|---------|
| Rebuild до dirty | Да — tiers sync, dirty сразу после |
| Collect видит новые `customHeightMm` / `initialSectionSizeMm.y` | Должен, если tiers `updated` и autosave после паузы |
| Restore строит mesh из `customHeightMm` | **Нет** — только stamp после билда |
| Restore повторяет ceiling tiers | **Нет** |
| Stamps H/band/clearance в draft | **Неполные** |

Итог: даже при корректном B визуальный/ритмический результат A получается только после tiers. C собирает модули «как place из snapshot» без финального tiers-pass → риск рассинхрона H/Y относительно актуального `room.height` (особенно если roots/author size и `sectionSize` расходятся, а `customHeightMm` уже не влияет на mesh).

### A → B — менее вероятен по порядку кода, но не опровергнут без дампа LS

Гипотезы A→B (если в draft старые H при новых на сцене):

- сохранение до паузы 1.5s после **последнего** изменения высоты;
- tiers `failed`/`skipped` для части групп при этом визуал «кажется» обновлённым (Y/slack) — смотреть лог `[KITCHEN-ENGINE] apply ceiling tiers`.

Без браузерного дампа **нельзя** утверждать A→B как основную причину; код сильнее указывает на пробел restore.

---

## 6. Нужен ли `applyKitchenCeilingTiersToScene()` после restore?

**Да — как безопасное выравнивание с уже существующим runtime-путём**, не как смена формул.

**Безопасная точка** (после того как есть room H + секции + все НШ/пеналы):

```
restoreIkeaRoomFixture:
  … restore furniture (+ decor) …
  → applyKitchenCeilingTiersToScene()   // тот же engine, что после resize
  → (опционально) goToRoomStepByNumber / camera
```

Условия:

- `fixture.room.height` уже применён (`applyRoomSizeFromFixture` раньше);
- `kitchenProject` уже hydrate;
- фазы autosave: вызывать в `restoring`, не ставить dirty от tiers во время restore (сейчас dirty из `updateRoomDimensions` при restore режется `canAutosave`).

Это **не** меняет Rhythm: только повторяет уже используемый apply после того, как модули снова на сцене.

---

## 7. Данные от пользователя (если нужен окончательный A/B/C)

В консоли **до F5** (после toast «Проект сохранён»):

```js
// A — сцена
(() => {
  const out = [];
  state.scene.traverse(o => {
    if (!o?.userData?.isFurniture) return;
    const ud = o.userData;
    const pk = ud.productKind || ud.__kitchenProfileId || '';
    if (!/wall_mid|wall_top/.test(String(pk))) return;
    out.push({
      name: ud.catalogName, pk,
      customHeightMm: ud.customHeightMm,
      carcass: ud.__kitchenCarcassHeightMm,
      initialY: ud.__initialSectionSizeMm?.y,
      clearance: ud.customFloorClearanceMm,
      bandHigh: ud.__kitchenBandHighMm, bandTop: ud.__kitchenBandTopMm,
    });
  });
  return { roomH: state.room?.height, modules: out };
})();

// B — draft
(() => {
  const d = JSON.parse(localStorage.getItem('clodis_room_draft_v2'));
  return {
    roomH: d?.room?.height,
    walls: (d?.furniture||[]).filter(f => /wall_mid|wall_top/.test(String(f.productKind||f.placementKindProfileId||'')))
      .map(f => ({
        name: f.catalogName, pk: f.productKind,
        customHeightMm: f.customHeightMm,
        initialY: f.initialSectionSizeMm?.y,
        hasRoots: !!f.clodisRoots,
      })),
  };
})();
```

**После F5 → Continue** — снова блок A (это C).

| Сравнение | Значение |
|-----------|----------|
| A.h ≠ B.initialY / B.customHeightMm | разрыв **A→B** |
| A.h = B, но C.h ≠ A | разрыв **B→C** (ожидаемый по аудиту) |
| roomH A = B = C, H шкафов только C «откатились» | подтверждает пробел restore / отсутствие tiers-pass |

---

## 8. Минимальный план исправления (только save/restore)

### Обязательно (узкий патч)

| # | Что | Где |
|---|-----|-----|
| 1 | После успешного размещения всей мебели в `restoreIkeaRoomFixture` вызвать существующий `applyKitchenCeilingTiersToScene()` (через `window.__cldKitchenBaseEngine` / `__clodisApplyKitchenCeilingTiersToModules`) | `js/furniture/ikea-room-fixture.js` |
| 2 | Не менять `resolveKitchenWall*`, datums, place sizing | — |
| 3 | Bust + ручной e2e: roomH change → toast → F5 → Continue → H НШ1/НШ2 = как до F5 | docs / bust |

### Желательно (укрепление сериализации, не ядро)

| # | Что |
|---|-----|
| 4 | Collect/restore: `__kitchenCarcassHeightMm`, `customFloorClearanceMm`, band stamps (high/top) |
| 5 | В ceiling tiers после успеха — `stampKitchenUserData` (или те же stamps), чтобы A и place-path совпадали |
| 6 | Опционально: после rebuild писать prepared roots в ud (осторожно, шире scope) |

### Не делать

- Менять формулы Vertical Rhythm / pick 860/920/960  
- Free-edit высоты шкафов  
- Вторая система хранения / сериализация Three.js  
- Переписывать autosave целиком  

---

## 9. Точная причина (формулировка)

**Подтверждено кодом:** после смены высоты комнаты истинные высоты НШ1/НШ2 на сцене задаёт `applyKitchenCeilingTiersToScene`; dirty и collect идут после этого и могут сохранить `customHeightMm` / `initialSectionSizeMm`. **При Continue restore не повторяет ceiling tiers после появления модулей**, не восстанавливает полный набор H-stamps и не использует `customHeightMm` как вход геометрии (только post-stamp). Расхождение пользовательского сценария с наибольшей вероятностью **B→C** (restore без финального tiers-pass). Опровержение/подтверждение A→B — только дампом `clodis_room_draft_v2` vs сцена до F5.

---

*Конец аудита. Код не изменялся.*
