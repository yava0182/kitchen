# Секция — единый контракт (прямая и у окна)

Одна логика на все секции. **Окно — это не второй движок**, а другие параметры той же секции:
три пролёта вместо одного, высота подоконника и запрет высокого модуля в среднем пролёте.

Дата: 2026-09-18. Cache bust текущий: смотреть `IKEA`/`index.html` bust (`20260918-straight-s9` на момент фиксации рамки).

## 0. Как читать и что где уже описано

| Нужно | Файл |
|---|---|
| Номера деталей обклада (№1…№15), правила прямой секции | `docs/SECTION_TRIM_BEHAVIOR_SPEC.md` |
| **Прямая: рамка скрыта / доборы по модулям (§4.0)** | `SECTION_TRIM_BEHAVIOR_SPEC.md` §4.0 + `.cursor/rules/straight-section-trim-by-occupancy.mdc` |
| Фазы перевода окна на модель (1–6) и их статус | `docs/WINDOW-ROW-ARCHITECTURE-PLAN.md` |
| **Контракт: входы → модель → план → геометрия, и чем окно отличается** | этот файл |

Этот файл не дублирует правила деталей. Он отвечает на вопрос «как куда что ставится и как меняется»
в терминах, одинаковых для прямой секции и для секции у окна.

## 1. Словарь (одно имя = одна вещь)

| Термин | Значение |
|---|---|
| **Секция** (`sectionData`) | прямоугольник у стены: позиция, размер, отступы, обклад |
| **Пролёт / ячейка** (`cell`) | часть секции по оси стены. Прямая секция = **1** пролёт. У окна = **3**: `tall-left`, `under-window`, `tall-right` |
| **Зона** (`zone`) | место под один модуль внутри пролёта (ширина зоны = ширина модуля) |
| **U** | ось вдоль стены: `x` для стен `back`/`front`, `z` для `left`/`right` |
| **V** | вертикаль (высота) |
| **Занятость** (`occ`, `furnitureUSpan`) | фактический U-диапазон мебели в пролёте. **Не** ширина пролёта |
| **Порог** (`sillMm`) | высота подоконника, мм. У окна задаёт высоту низких модулей |
| **Стык** (`junction`) | граница двух соседних пролётов/модулей: накладка `heightMismatch` и/или `cap` |

## 2. Входы (source of truth)

| Что | Где лежит | Кто правит |
|---|---|---|
| Геометрия и наполнение модуля | каталог (`catalog_*.json`) | админка |
| Шаги комнаты, обклад по сторонам | `room_steps_config` (сервер) | админка |
| Привязка секции к ряду у окна | `sectionData.userData.windowAlongWall*` | рантайм при создании секции |
| Порог | `windowAlongWallSillMm` → fallback из окна | админка / окно |
| Высота модуля | `group.userData.customHeightMm` | пользователь (шаг «высота») |
| Категория модуля | `group.userData.catalogType` | каталог |

Правило проекта: всё, что пользователь должен менять — **в админке**, не в константах кода
(см. `admin-configurable-settings.mdc`).

## 3. Модель ряда (derived, один обход сцены)

Файл: `js/sections/window-row-model.js`.

```
buildWindowRowState(wallName) → RowState {
  rowId, wallName, sillMm,
  cells: [ { role, uSpan:{min,max}, fullHeightMm, zones:[...], occ:{min,max}|null } ],
  heights: { rowStandaloneMm, byCatalogType:{...} },
  junctions: [ { leftRole, rightRole, u, needsOverlay, needsCap } ],
  flags: { hasWardrobe, allLow, empty }
}
```

Инварианты:

1. Модель строится **за один обход сцены** на посадку/изменение, не N раз.
2. Модель — только чтение сцены. Ничего не создаёт и не удаляет.
3. `occ` считается по bbox мебели, а не по границам пролёта — из этого следует «пустой пролёт = пустой».
4. Прямая секция — это тот же `RowState` с **одним** пролётом (целевое состояние, см. §8).

Отладка: `__cldWindowRowAudit()` → `{ cells, junctions, plan, planKinds, buildMs, under15ms }`.

## 4. Посадка модели (place) — порядок шагов

Один и тот же конвейер для любой секции. Замер: `[PLACE-TIME]` в консоли, объект `window.__cldLastPlaceTime`.

| № | Шаг | Что решается | Где |
|---|---|---|---|
| 1 | Ghost / выбор места | пролёт и зона под курсором | `furniture-ghost.js`, `section-span-chooser.js` |
| 2 | **Высота** | `customHeightMm` → высота ряда по `catalogType` → `sillMm` → профиль размещения | `resolveWindowRowPlaceHeightMm` |
| 3 | Геометрия модуля | ширина зоны × высота из п.2 → `ClodisBuilder` | `rebuildFurnitureGroupForSectionResize` |
| 4 | Layout пролёта | пересчёт зон и позиций модулей в секции | `computeSectionLayout` / `updateFurnitureInSection` |
| 5 | **План обклада** | `computeTrimPlan(RowState)` → список желаемых деталей | `window-row-model.js` |
| 6 | Применение плана | reconcile: создать/обновить/удалить | `window-row-trim-apply.js` → `reconcileCellByPlan` |
| 7 | Стыки | накладки и cap **только** из `junctions` плана | `section-transition-manager.js` |
| 8 | UI | правая панель, иконки сцены | после кадра, не в критическом пути |

Что при этом меняется у соседей:

- **высота** синхронизируется по категории внутри группы `windowAlongWall` (комод рядом с комодом);
- **обклад** пересчитывается только у затронутых пролётов;
- **стыки** пересобираются на границах, где изменился `needsOverlay` / `needsCap`.

## 5. Обклад = план, а не императивные ensure/remove

Виды деталей плана (`kind`): `plinth`, `topPlank`, `sidePlank`, `sideOverlay`, `heightMismatch`, `cap`.

Правила, общие для любой секции:

1. **Пустой пролёт — пустой.** Нет мебели → нет цоколя, планки, вертикали.
2. Горизонтали (`plinth`, `topPlank`) по **занятости** (`furnitureUSpan`), не по ширине пролёта.
3. Вертикали (`sidePlank`, `sideOverlay`) по **краю занятого**, а не по краю пролёта.
4. Высота вертикали: полная у высокого модуля, до `sill` у низкого.
5. Применение — **reconcile** (сравнить желаемое с существующим), поэтому повторный вызов не плодит дубли.

## 6. Чем отличается секция у окна (полный список)

| Аспект | Обычная прямая | У окна |
|---|---|---|
| Пролётов | 1 | 3: `tall-left`, `under-window`, `tall-right` |
| Допустимая высота | полная высота секции | `tall-*`: полная; `under-window`: до `sillMm` |
| Высота по умолчанию при посадке | из профиля / каталога | **`sillMm`** (под подоконник), остальные тянутся |
| Верх низкого модуля | как у секции | топ на уровне `sillMm`, тянется до накладок высоких соседей |
| Вертикаль у низкого | по правилам §6.1 спеки | **без** высокой боковой планки |
| Стык пролётов | по разнице высот модулей | `tall` ↔ `under` = `heightMismatch` **всегда** (разница ≥ порога) |
| Цоколь | по занятости | то же, отдельно в каждом пролёте |
| Синхрон высоты | внутри секции | внутри **группы** `windowAlongWall` (все 3 пролёта) |

Больше отличий быть не должно. Любое новое «только для окна» условие в коде — повод сначала проверить,
не следует ли оно из таблицы выше.

## 7. Скорость посадки (замер 2026-09-18)

Модули строятся процедурно (`ClodisBuilder`), а не грузятся как GLB. «Долго» = синхронная работа на главном потоке.

`window.__cldLastPlaceTime`, посадка одного модуля:

| Фаза | Без окна, мс | У окна, мс | Разница |
|---|---|---|---|
| `before_Furniture` | 13 | 10 | — |
| `after_Furniture` (построение модуля) | 40 | 29 | — |
| `after_studio_bind` | 16 | 21 | — |
| `after_doors` + `after_floor_y` | 1 | 2 | — |
| **`after_transitions`** | 59 | **194** | **+135** |
| **`after_fit`** | 5 | **55** | **+50** |
| **total** | **141** | **318** | **+177** |

Вывод: сам модуль строится одинаково быстро. Вся стоимость окна — в стыках и подгонке.

Причина (не догадка, по коду): полный проход стены `syncWindowRowTrimForWall`
(модель `skipCache` → план → reconcile 3 ячеек → layout/fit ячеек со шкафом → стыки) вызывается из **трёх**
точек, две из которых работают **по секции**, а не по стене:

- `syncWindowAlongEmptyFrameVisibility(section)` — `section-manager.js:1892`
- `ensureWindowAlongFrameMeshes(section)` — `section-manager.js:1975`
- `syncWindowAlongEmptyFramesOnWall(wall)` — `section-manager.js:1933`

Защита есть только от рекурсии (`isWindowRowTrimApplying`), а не от повторов. Три секции ряда → до трёх
полных проходов стены за один жест. Это та же болезнь «7 независимых обходов сцены», из-за которой
затевался план фаз, просто в новом виде.

### 7a — сделано (2026-09-18, `?v=20260918-winrow-p7g`)

1. `rebuildTrimAndTransitionsAfterFurnitureGeometry` (`section-manager.js`) и путь удаления мебели
   (`furniture-manager.js`) больше не вызывают проход по секции и по каждой секции группы —
   один вызов `syncWindowAlongEmptyFramesOnWall(wall)` на стену. Было до 1+N проходов на жест.
2. Счётчик проходов: `__cldWindowRowTrimPassCount()`, сброс `__cldResetWindowRowTrimPassCount()`.
3. Разбивка **внутри** прохода: `[WINROW-PASS]` в консоли и `window.__cldLastWindowRowPass`
   → `{ pass, totalMs, reconcileMs, fitMs, fitCells, junctionsMs, cells }`.

Замер `[WINROW-PASS]` (2026-09-18): **15 проходов** на жест, каждый **0–1 мс**, `fitCells: 0`.
Гипотеза про дорогой `fitMs` не подтвердилась: проход обклада ряда дешёвый, и 194 мс лежат
**не в нём**, а в самом `rebuildWallTransitions`. Проходов много, но они не стоят ничего,
поэтому сокращение их числа — гигиена, а не выигрыш времени.

### 7b — что мерим дальше

В `rebuildWallTransitions` пять взаимоисключающих ветвей, и у окна против пустой стены может
выполняться **разная**:

| Ветвь | Когда | Что делает |
|---|---|---|
| `niche-fitOnly` | place шкафа в нишу, нет стыка шкаф↔тумба | почти ничего (дешёвая) |
| `standalone-lite` | place тумбы/комода | clear + планки + топы + caps по всей стене |
| `full-empty` | на стене нет мебели | планки + топы |
| `full-single` | одна единица мебели | + `updateFurnitureInSection` |
| `full` | две и более | пары стыков + `updateFurnitureInSection` по секциям |

Важно: замер «141 мс без окна» мог попасть в `niche-fitOnly` (шкаф), а «318 мс у окна» —
в `standalone-lite` (комод). Тогда разница объясняется **типом мебели**, а не окном.
Поэтому сравнивать надо один и тот же тип модуля.

Замер `[TX-TIME]` (2026-09-18) — виновник найден, это **один шаг**, `sideTrim`
(`reconcileSectionSideTrimForWall`):

| Случай | branch | totalMs | sideTrim |
|---|---|---|---|
| пустая стена | `full-empty` | 9 | 1 |
| комод в пролёт у окна | `full-empty` | 23 | 14 |
| + комод во второй пролёт | `standalone-lite` | 52 | 25 |
| то же, следующий вызов | `standalone-lite` | 92 | **62** |

Растёт с количеством мебели, а не секций.

Первая правка (обход `sec.group.children` вместо `traverse` — боковины всегда прямые дети группы,
`addSidePlanksIfNeeded` → `sectionGroup.add`) времени **не дала**: 30 и 63 мс остались.
Обход был не узким местом, но правку оставили — она корректна и дешевле.

Настоящая причина — **холостая пересборка на каждом вызове**:

1. `needRebuild` истинно, когда накладка нужна (`needOL`), но её нет. У окна без мебели
   `addSidePlanksIfNeeded` ничего не рисует (правило «пустая ячейка — пустая»), значит `hasOL`
   никогда не станет истиной → условие выполняется **всегда**.
2. В этой ветке вызывался `applyStep5DecorToFurnitureGroupImmediate(sec.group)`. Группа секции
   не помечена `isFurniture`, поэтому внутри `refreshFurnitureDecorsImmediate` срабатывают ветки
   «нет корня-мебели» → `state.scene.traverse` по **всей сцене** (дважды: `__ensureIkeaV0BeforeStep5Decor`
   и `refreshCabinetStudioAfterDecor`) плюс `syncAllSectionTrimStudio(state.scene)`.

Итог: каждый холостой проход обходил всю сцену 2–3 раза. Исправление: декор и relayout —
только когда геометрия реально изменилась (`createdCount > 0 || toRemove.length > 0`),
иначе `continue`. Логика выбора «планка или накладка» не тронута.

### ОТКАЧЕНО (2026-09-18, `?v=20260918-winrow-p7g`)

Правки скорости **откачены целиком** по требованию пользователя: планки и накладки стали
не того цвета (белые вместо декора фасада). Причина регрессии — именно эти правки.

Важный вывод на будущее, чтобы не повторять: раньше обклад докрашивался **побочным эффектом**.
`applyStep5DecorToFurnitureGroupImmediate(sec.group)` вызывался на каждом холостом проходе, а внутри
`refreshFurnitureDecorsImmediate` корень-секция не распознаётся (нет `isFurniture`) → срабатывают
ветки «нет корня» → `state.scene.traverse` по всей сцене + `syncAllSectionTrimStudio(state.scene)`.
Этот обход и перекрашивал весь обклад, включая меши, созданные другими путями
(`_applyWindowRowPlinthsFromPlan`, `TopPlanks`, `Sides`, стыки), которые **сами декор не применяют**.

Значит перед любой оптимизацией этого места сначала нужно, чтобы **каждый создатель обклада
применял декор к своим мешам**. Пока этого нет, убирать общий проход нельзя — обклад белеет.

Откачено: обход `children` вместо `traverse`, пропуск холостой пересборки, scoped-ветки декора
для корня-секции, один проход на стену в `rebuildTrimAndTransitionsAfterFurnitureGeometry`
и в пути удаления. Оставлена только диагностика под флагом `window.__CLD_DEBUG_PERF`.

### S1 — откат scoped decor (`?v=20260918-straight-s3`)

Ветка `isCustomSection` в `__ensureIkeaV0…` убрана: снова как в **1.66** —
корень-секция → `syncAllSectionTrimStudio(scene)`, иначе планки/накладки белеют.
Скорость отложена, пока обклад не красится сам при создании.

### S1 archive — прямая секция, scoped decor (сломало цвет)

Не убираем вызов декора. Чиним корень: если `limitRoot.userData.isCustomSection`,
`__ensureIkeaV0BeforeStep5Decor` и post-refresh красят **только эту секцию**
(обклад по `sectionId` + мебель внутри группы), а не `syncAllSectionTrimStudio(scene)`.
Вызов `applyStep5DecorToFurnitureGroupImmediate(sec.group)` остаётся — цвет сохраняется,
полный обход всех шкафов сцены уходит.

**Результат замеров до откату (для истории):**

| Ветвь | было | стало |
|---|---|---|
| `standalone-lite`, `sideTrim` | 30 · 63 мс | **0 · 1 мс** |
| `standalone-lite`, `totalMs` | 52 · 94 мс | **24 · 33 мс** |

Оставшиеся шаги тяжёлой ветки: `sectionsLayout` ~6, `splitPlanks` ~8 — пока не трогаем.

Логи `[TX-TIME]` и `[WINROW-PASS]` теперь под флагом `window.__CLD_DEBUG_PERF = true`;
объекты `window.__cldLastTransitionsTime` и `window.__cldLastWindowRowPass` пишутся всегда.

Диагностика (`?v=20260918-winrow-p7g`): `[TX-TIME]` в консоли и `window.__cldLastTransitionsTime`
→ `{ wall, branch, totalMs, steps:{ sideTrim, overlaysSize, clearAll, sectionsLayout, splitPlanks,
adjustTop, mergedCaps, adjustSide, lowSlots, winFrames, capsLayout, buildPairs, updateFurniture,
updateFurnitureCount, winJunctionCollect } }`.

Отдельно: `syncStandaloneCategoryHeightInSection` → `rebuildStandaloneModulesInSection`
(`furniture-manager.js:1081`, `:1117`) пересобирает все модули категории в группе, но вызывается
только при подтягивании старых низких модулей (`furniture-manager.js:9244`), не на каждой посадке.
**Skip внутри `rebuildFurnitureGroupForSectionResize` добавлять нельзя** — уже пробовали и откатили,
меш оставался уже зоны → щель между шкафами (`furniture-manager.js:1414`).

Правила, которые делают посадку быстрой (к реализации, по согласованию):

| Правило | Как проверить |
|---|---|
| `rebuild` только если целевой размер/высота **реально** изменились (сравнение с уже построенным) | число вызовов `ClodisBuilder` за посадку = 1 при добавлении модуля |
| Один обход сцены за посадку, `RowState` кэшируется по `sceneRev` | `__cldWindowRowAudit().buildMs` и `under15ms: true` |
| Стыки и обклад — один раз в конце, по diff плана | `lastTrimDiff.created/updated/removed` не пустые только там, где менялось |
| UI после кадра | фаза UI не входит в `total` критического пути |

Бюджет приёмки: `[PLACE-TIME] total` ≤ **400 мс**, ни одна фаза > **150 мс**.

## 8. Миграция к «все секции одинаково»

Сделано (фазы 1–4 плана): у окна работают модель, высоты, план обклада, стыки из `junctions`.

Осталось:

- **Фаза 5** — внешний вид (декор/материалы) по diff плана.
- **Фаза 6** — заморозка старого `windowLowSlot` / `bridge` (нужно явное «да»).
- **Фаза 7 (новая, только по «да»)** — прямую секцию перевести на тот же `RowState` с одним пролётом,
  чтобы код ветвился только по числу пролётов и `sillMm`. Шаги: (7a) один проход стены на жест вместо
  вызова из трёх точек, (7b) `RowState` для стены без окна = по одному пролёту на секцию,
  (7c) старый путь `ensure`/`prune` остаётся только как fallback, если модель не построилась.

**Фаза 7b (2026-09-23):** `trim-junction-classify.js` + gap 16 мм по зонам в layout — **оставлено**.
`buildStraightWallRowState` / plan-apply SideCap на прямой — **отключено** (cohabit24–25 ломали стык;
вернуть только после сверки N2/N3). SideCap на прямой снова imperative (`hangward` / tall↔low).

**Угол L — путь A** (см. `SECTION_TRIM_BEHAVIOR_SPEC.md` **§6.8**): спец только в углу
(`section-end-cabinet` / спец-зона); **свободное плечо** = как прямая (§4–§6.7).  
**A1+A2 (`cohabit30`):** §6.7 на плече; стык плечо↔угловой шкаф = SideCap fullH (§6.8.4).  
Через `RowState` / plan-apply угол не гоняем. A3 — только по отдельному «да».

## 9. Приёмка и отладка

```js
__cldWindowRowAudit()      // модель + план + planKinds + buildMs
window.__cldLastPlaceTime  // { totalMs, phases:[{phase, atMs, dtMs}] }
```

Сценарии (после `Ctrl+F5`):

1. Пустой ряд у окна → ни одной детали обклада.
2. Комод в средний пролёт → высота = `sillMm`, цоколь и топ только под комодом.
3. Второй комод рядом → у первого высота не меняется, `ClodisBuilder` не пересобирает первый.
4. Шкаф в `tall-right` → `heightMismatch` на границе, шкаф не наезжает на накладку.
5. Изменить высоту комода → меняются все комоды группы, шкафы не трогаются.
