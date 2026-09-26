# Ряд у окна: архитектура (план работ)

> **Назначение:** привести «секцию под окном» к одной модели вместо 8 флагов и 7 независимых обходов сцены.
> Документ — **контракт для реализации по фазам**. Каждая фаза: что делаем → чего не трогаем → как проверяем.
> **Создан:** 2026-09-18 · **Статус:** фаза 4 в коде (`?v=20260918-winrow-p4`)
> **Связанные:** `docs/SECTION-UNIFIED-CONTRACT.md` (единый контракт секции: входы → модель → план → геометрия, чем отличается окно, бюджет скорости), `docs/SECTION_TRIM_BEHAVIOR_SPEC.md` (поведение обклада — эталон), `.cursor/rules/logic-changes-by-approval.mdc`, `.cursor/rules/no-workarounds.mdc`

---

## 1. Задача продукта (не менять по ходу)

Стена с окном = **три независимо редактируемых пролёта**: высокий слева | низкий под окном | высокий справа.

| Требование | Смысл |
|---|---|
| Три секции | Каждая со своим делением на ячейки и своими отступами |
| Средняя тянется к боковым | Топ и цоколь доходят до накладок высоких |
| Высота комодов = подоконник | Первый комод задаёт `sillMm`, остальные подтягиваются; выше подоконника нельзя |
| Пустая ячейка — пустая | Без цоколя/планок/накладок, только разметка ячеек |
| Слева = справа | Никакой асимметрии при одинаковых данных |
| Скорость как на прямой | Посадка комода не пересобирает соседей |

---

## 2. Почему сейчас ломается (замер 2026-09-18)

**Флаги ряда живут в данных секции в 2,5 поколениях одновременно:**

| Флаг | Поколение |
|---|---|
| `windowAlongWallGroupId`, `windowAlongWallRole` | актуальное (три секции) |
| `windowBridgeGroupId`, `windowBridgeRole` | legacy «мост» |
| `windowLowSlot`, `underWindowBay`, `fixedHeightMm`, `sillMm` | вариант «одна секция через окно» |

Упоминания флагов: `section-manager.js` — 97, `section-transition-manager.js` — 40, `furniture-manager.js` — 24, плюс 10 файлов по мелочи.

**Каждый потребитель заново выводит смысл ряда своим `scene.traverse`:**

| Функция | Файл |
|---|---|
| `sectionHasPlacedFurniture` | `js/sections/section-manager.js` |
| `sectionHasNicheWardrobe` | `js/sections/section-manager.js` |
| `sectionHasFurnitureNearLocalSide` | `js/sections/section-manager.js` |
| `_collectFurnitureForVerticalTrim` | `js/sections/section-transition-manager.js` |
| `_windowLowSlotOccupancy` | `js/sections/section-transition-manager.js` |
| `_getFurnitureOnWallSorted` | `js/sections/section-transition-manager.js` |
| `_furnitureBelongsToUnderWindowBay` | `js/sections/section-transition-manager.js` |

Фильтры у них расходятся (ghost, `isEndCabinetSlot`, `__placementKind`, полоса у торца) → **один и тот же вопрос даёт разные ответы**. Отсюда весь наш список симптомов:

| Симптом | Настоящая причина |
|---|---|
| Слева планка есть, справа нет | Два разных предиката «есть мебель у края» |
| Высокая планка в пустой ячейке | Высота вертикали по `fullH`, когда мебели в секции нет |
| Белый обклад после посадки | Проход «внешний вид» не покрывал transition-детали |
| Разная высота комодов | Высота бралась из 3 источников (`customHeightMm`, `sillMm`, `fixedHeightMm`) |
| Долгая посадка у окна | 7 обходов сцены + ошибочный уход в полную пересборку модулей |

**Вывод:** точечные фиксы исчерпаны. Нужен один источник истины на ряд.

---

## 3. Целевая архитектура

### 3.1 Нормализатор ссылки на ряд

```js
// js/sections/window-row-model.js (новый файл)
getWindowRowRef(section) // → { rowId, role, sillMm } | null
```

`role`: `'tall-left' | 'under-window' | 'tall-right'`.
Читает все поколения флагов (§2) и приводит к одному виду. **Никакой потребитель после фазы 2 не читает флаги напрямую.**

### 3.2 Модель ряда (производная, один обход сцены)

```js
buildWindowRowState(wallName) // → WindowRowState | null
```

```
WindowRowState {
  rowId, wallName, sillMm,
  cells: [{
    sectionId, role, uSpan: { min, max },
    zones: [{ index, uSpan, occupied, furnitureUuid, placementKind, topY }],
    hasWardrobe, hasStandalone, isEmpty
  }],
  heights: { rowStandaloneMm, byCatalogType: { [type]: mm } },
  junctions: [{ leftCellId, rightCellId, u, dY, needsOverlay, needsCap }],
  flags: { hasWardrobe, allLow, empty }
}
```

Правила: **один** `state.scene.traverse` на построение; фильтр мебели единый (не ghost, не `isEndCabinetSlot`); кэш на кадр по `wallName` + счётчик ревизии сцены, сброс при place/delete/resize.

### 3.3 Обклад как план (desired state), а не императивные ensure/remove

```js
computeTrimPlan(rowState)  // чистая функция, без THREE → [TrimPart]
applyTrimPlan(plan, wallName) // reconcile по key: создать / поправить / удалить → { created, updated, removed }
```

```
TrimPart { key, kind, cellId, uSpan, yFrom, yTo, thicknessMm }
kind: 'plinth' | 'topPlank' | 'sideOverlay' | 'sidePlank' | 'heightMismatch' | 'autoTop' | 'cap'
```

Что это лечит **по конструкции**, а не проверкой:

- пустая ячейка — деталей нет в плане, удалять «потом» не нужно;
- симметрия — план строится из `cells` / `junctions`, а не отдельными ветками «слева» и «справа»;
- белый обклад — проход внешнего вида идёт по `created + updated`, всегда.

### 3.4 Одна высотная область

`rowState.heights.rowStandaloneMm` — единственный источник. Читают: place, призрак, `resizeSectionForStandaloneHeight`, синхрон высоты категории.
Дефолт = `sillMm`. Clamp = `sillMm` (выше подоконника нельзя). **Запрещено:** `sill − цоколь`, `initialSectionSizeMm.y` как приоритет, отдельные высоты на секцию ряда.

### 3.5 Конвейер посадки (place)

```
place → buildWindowRowState (1 обход)
      → computeTrimPlan + applyTrimPlan
      → внешний вид (IKEA bind + декор шага 5) по diff
      → один Soft/IKEA sync в rAF
```

Clodis×N (пересборка модулей) — **только** на реальном изменении геометрии: высота, ширина зоны, ручки, деление. **Не** на посадке соседа.

### 3.6 Отладка данными

```js
__cldWindowRowAudit(wallName)   // rowState + plan + diff последнего apply
```

Вопрос «почему слева иначе» решается сравнением двух ячеек в выводе, а не чтением кода.

---

## 4. Фазы

### Фаза 1 — модель + аудит (поведение НЕ меняем) ← старт

**Делаем:** новый файл `js/sections/window-row-model.js` с `getWindowRowRef`, `buildWindowRowState`, `__cldWindowRowAudit`. Ни один существующий потребитель не переключается.

**Не трогаем:** вообще ничего в рендере — только добавляем модуль и глобальный аудит.

**Приёмка:**
1. `__cldWindowRowAudit('back')` на ряду из 8 комодов: `cells` = 3, роли верные, `occupied` совпадает с картинкой.
2. `heights.rowStandaloneMm` == фактическая высота комодов в мм.
3. `junctions` содержит стык tall↔под-окном с верным `dY`.
4. Пустая ячейка → `occupied: false`; пустая секция → `isEmpty: true`.
5. Время построения модели в аудите < 15 мс на ряд.

### Фаза 2 — высоты на модель

Перевести на `rowState.heights`: `resolveStandaloneHeightMm`, `clampStandaloneHeightToWindowSlot`, `getWindowAlongGroupSillStandaloneHeightMm`, `getWindowBridgeAlignedStandaloneHeightMm` (`js/furniture/furniture-manager.js`) и высоту призрака (`js/furniture/furniture-ghost.js`).

**Приёмка:** первый комод = подоконник; второй/третий подтягиваются; призрак = итоговой высоте; выше подоконника не встаёт.

### Фаза 3 — план обклада (цоколь, верхняя планка, боковины)

`computeTrimPlan` + `applyTrimPlan`; на стене с окном старый путь `addSidePlanksIfNeeded` / `ensureWindowAlongFrameMeshes` / `syncWindowAlongEmptyFrameVisibility` отключается.

**Приёмка:** пустая ячейка без деталей; слева = справа; цоколь только под занятым участком; ширины ячеек в мм не изменились.

### Фаза 4 — стыки из `junctions`

`heightMismatch` и `cap` строятся из модели, а не из парного перебора `sorted` в `rebuildWallTransitions`.

**Приёмка:** накладка на стыке tall↔комод одна и на месте; при равных высотах её нет.

### Фаза 5 — внешний вид по diff

IKEA bind + декор «Снаружи» применяется к `created + updated` из `applyTrimPlan`; убрать повторные проходы по всей сцене.

**Приёмка:** после посадки обклад сразу цвета «Снаружи», без белого кадра; Soft дёргается один раз.

### Фаза 6 — вычистка второго мира

Заморозить/удалить вариант «одна секция через окно» (`windowLowSlot`, `__CLD_WINDOW_PLACE_ONE_SLOT`) и мёртвые ветки `windowBridge*`. **Требует отдельного «да» пользователя** (смена логики).

---

## 5. Инварианты (проверять на каждой фазе)

1. `division` / `partSize` ряда не меняется ни одной фазой — **ширины ячеек фиксированы**.
2. Ни один потребитель не читает флаги окна напрямую (после фазы 2) — только через `getWindowRowRef`.
3. Высота ряда — одно число на ряд.
4. На стене без окна поведение и скорость не меняются.
5. Свет IKEA v0 не трогаем (`.cursor/rules/ikea-v0-only.mdc`).

## 6. Вне scope

Зоны и деление, каталог, петли, ящики, штанга, свет/Soft, обычные и угловые секции, торцевые шкафы.

## 7. Журнал

| Дата | Что |
|---|---|
| 2026-09-18 | План создан. До него: убран дубль ensure/sync при place, обклад по одной стене без Soft, lite-путь для комодов у окна (`?v=20260918-komod-h8`). Эксперимент «Clodis×N у окна» откатан: долгий призрак. |
| 2026-09-18 | **Фаза 1:** `js/sections/window-row-model.js` — `getWindowRowRef`, `buildWindowRowState`, `__cldWindowRowAudit`. Потребители не переключены. Bust `20260918-winrow-p1`. |
| 2026-09-18 | **Фаза 2:** высоты place/призрак/clamp/sill из модели ряда (`resolveWindowRowPlaceHeightMm`). Bust `20260918-winrow-p2`. |
| 2026-09-18 | **Фаза 3:** `computeTrimPlan` + `applyTrimPlan` (`window-row-trim-apply.js`); sync у окна через план; prune боковин/топа. Bust `20260918-winrow-p3`. |
| 2026-09-18 | **Фаза 4 (каркас, пауза):** стыки в плане/`junctions`; не дожимать, пока фаза 3 не принята. |
| 2026-09-18 | **Фаза 3 до конца:** reconcile без ensure — plinth/top/side строго из plan; stretch средней до накладок высоких; vertH шкаф=потолок / комод=sill. Bust `20260918-winrow-p3f`. |
| 2026-09-18 | **Фаза 3 fix:** цоколь/«у края» по `furnitureUSpan`, не по всей зоне. Bust `20260918-winrow-p3f2`. Приёмка фазы 3 — ок. |
| 2026-09-18 | **Фаза 4 до конца:** `heightMismatch`/`cap` из plan → `applyTrimPlan`; cross-cell sorted на окне запрещён. Bust `20260918-winrow-p4`. |
