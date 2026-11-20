# CLODIS — аудит верхних кухонных модулей (НШ1 / НШ2 / ВМУ)

**Дата:** 2026-10-30  
**Режим:** только исследование. JS/HTML/CSS, каталог, проекты, нижние модули, столешки, схемы крепежа/петель — **не изменялись**.  
**Связанные отчёты:** `CLODIS-KITCHEN-CURRENT-STATE-AUDIT.md`, `CLODIS-KITCHEN-DEPTH-OFFSETS-VERIFICATION.md`.

### Статусы

| Метка | Значение |
|-------|----------|
| **код** | подтверждено чтением исходников |
| **сцена** | не прогонялось на живом НШ в этой сессии |
| **отсутствует** | механизм в коде не найден |
| **разрыв** | в ядре есть путь A, в UI/другом слое — путь B |

---

## 1. Типы и имена в коде

| UI / смысл | `placementKind` / profile id | `productKind` | Каталог (типично) | `zoneSlotRole` | `cohabitGroup` | baseKind (Room2) |
|------------|------------------------------|---------------|-------------------|----------------|----------------|------------------|
| Навесной 1-й ярус (НШ1) | `kitchen_wall_mid` | `kitchen_wall_mid` | `catalog_50` (и др.) | `mid` | `kitchen_column` | `wall_hung_low` |
| Навесной 2-й ярус / антресоль (НШ2) | `kitchen_wall_top` | `kitchen_wall_top` | `catalog_51` | `top` | `kitchen_column` | `wall_hung_high`* |
| Угловой навесной (ВМУ) | `kitchen_wall_corner` | (угол) | `catalog_54` | `mid` | `kitchen_column` | `wall_hung_low` |
| Legacy шкафной навес | `wall_hung` / `wall_hung_low` / `wall_hung_high` | — | шкаф | — | — | сами себе |

\*В `placement-kind-profiles.js` ~591: `kitchen_wall_top` → `baseKind: 'wall_hung_high'`, но вертикальная посадка НШ2 **не** от потолка: `isWallHungHighPlacementKind` **исключает** `kitchen_wall_top` (`vertical-layout.js` ~126–129) — низ от ритма (`floorClearance`).

Распознавание папки: `furniture-manager.js` ~3931–3933 — `catalog_51` → top, `catalog_50` → mid.

Детекторы: `isKitchenWallMidGroup` / `isKitchenWallTopGroup` / `isKitchenWallCornerGroup` — `kitchen-base-engine.js` ~427–479; UI `__isKitchenWallHungFurniture` — `scene-icons.js` ~232–243.

Петли: `hinges.productKind: 'kitchen_wall'` в пресетах mid/top/corner (`placement-kind-profiles.js` ~298, 326, 355).

---

## 2. Геометрия верхних шкафов

### 2.1 Ширина / высота / глубина (**код**)

| Ось | Источник | Перестроение |
|-----|----------|--------------|
| **W** | ширина ячейки пояса MID/TOP (`kitchenBandGrids`) или BASE-колонны; place → `rebuildForCellWidthMm` / fit | parametric `rebuildFurnitureGroupForSectionResize` |
| **H** | ритм: mid → `bandHighMm`; top → `bandTopMm` (часто high/2 «в потолок»); UI `customHeightMm` при `showHeight` | `applyModuleCustomHeightCm` → rebuild + `snapFurnitureGroupPlacementY` |
| **D** | mid: project/section wall ~350 (200…450); top: **shallow / deep / custom** | place: `applyKitchenWallTopDepthForGroup`; API `rebuildWallTopForCellDepthMm` |

Формулы place: `resolveKitchenWallMidPlaceSizing` / `resolveKitchenWallTopPlaceSizing` — `kitchen-manufacturing-profile.js` ~1116–1238.

### 2.2 Положение относительно стены (**код**)

- Depth-stack для wall-hung: **`rearOverhangMm = 0`**, **`frontSetbackToCarcassMm = 0`** (`kitchen-depth-stack.js` ~127–177, ветка `isKitchenWallHungDepthGroup`).
- `enforceKitchenDepthStackOnModule`: ветка flush/tall — **зад корпуса = плоскость секции (стена)** (~366–381).
- При смене глубины с `anchor: 'back'` (shallow/deep): **зад неподвижен у стены**, перед едет в комнату (`rebuildWallTopForCellDepthMm` комментарий ~1781–1782; resolve ~1758–1777).
- При `anchor: 'front'` (custom / userLocked): **перед фиксируется**, зад едет (~1807–1879).

### 2.3 Фасад относительно корпуса

Как у остальных Clodis-модулей: дерево + hinge layout; отдельного «−40 от столешки» у НШ **нет** (нет worktop stack). Протрузия фасада — из карточки/аниматора; **на сцене не измерялось**.

### 2.4 Соседи / ярусы / сетки

- Одна колонна: `cohabitGroup: 'kitchen_column'` — base (НМ) + mid + top в одной зоне (`placement-kind-profiles.js` ~281–312).
- Независимые ширины поясов: `kitchenBandGrids.mid` / `.top` (`section-manager`, `kitchen-band-grids-view`).
- TOP над пеналом: по умолчанию `deep` (D≈ пенал); иначе `shallow` ≈ D НШ1 (`resolveKitchenWallTopDepthMm` ~1754–1756).
- Place секции после fit снова `enforce` + для TOP `applyKitchenWallTopDepthForGroup` (`kitchen-section-engine.js` ~451–475).

### 2.5 Offsets

| Механизм | НШ |
|----------|-----|
| `__kitchenRearOverhangMm` / front setback стека | всегда 0 у wall-hung (**код**) |
| `rearOffsetMm` / `frontOffsetMm` | stamps общие; enforce применяет rigid shift и к flush-ветке (**код** depth-stack ~403–406). **UI нет**. Для НШ **не профилировалось** на сцене |
| НМУ `__kitchenSideWallClearanceMm` | только угол низ; ВМУ — свой corner path, не тот же clear UI |

---

## 3. Карточка «Настройка модуля» для верхних

Точка входа: `handleSectionZoneEditClick` — `js/ui/scene-icons.js` ~3563+.  
Профиль: `editPopup` mid/top/corner — `placement-kind-profiles.js` ~286–355.  
Админка лимитов: Room2 `#room2-placement-kinds`.

### Поля (условно)

| Поле UI | Когда видно | Диапазон (пресет) | Источник | Handler | Геометрия | Save |
|---------|-------------|-------------------|----------|---------|-----------|------|
| Глубина модуля | мебель есть, не НМ/не tall → общая ветка «Глубина модуля» | mid/top: 25…45 см | `customDepthMm` / stamp | `applyModuleDepthCm` | **разрыв:** для НШ **нет** вызова `rebuildWallTop*` — падает в **uniform scale** (~4272+) | customDepthMm да; качество геометрии под вопросом |
| Высота модуля | `showHeight: true` (mid/top/corner) | mid 40…100; top 30…80 см | `customHeightMm` / band | `applyModuleHeightCm` → `__clodisApplyModuleCustomHeightCm` | rebuild + snap Y от ритма | customHeightMm |
| Ширина модуля | `showWidth` | section_division / overall | зона / customWidth | `__clodisSetZoneCustomWidthMm` (MID/TOP grid) или custom width | сетка пояса / корпус | band grids / customWidth |
| Отступ от пола | **скрыт** для kitchen_wall_* | — | — | — | Y от `resolveKitchenWall*PlaceSizing.floorClearanceMm` | clearance stamp перезаписывается при snap |
| Отступ от стены (НМУ) | не для обычного НШ | — | — | — | — | — |
| Открывание | single door | L/R | `zoneHand` | apply hand | петли | zoneHand |
| Сброс ширины / удалить / reorient верх. угла | угол / пустая зона | — | — | corner APIs | угол | — |

Важно (**код** ~3678–3680): `showFloorClearanceField` только для шкафного `wall_hung_low` **без** `__isKitchenWallHungFurniture` — кухонный НШ **не** показывает «Отступ от пола»; высота установки из **ритма**.

Режимы TOP shallow/deep/custom: **в карточке step4 не найдены** как отдельные переключатели; есть stamps + API `applyKitchenWallTopDepthForGroup` / `rebuildWallTopForCellDepthMm`.

---

## 4. Первый и второй ярус (ритм)

### Высота установки (**код**)

| Ярус | Низ корпуса (от пола) | Высота корпуса H |
|------|----------------------|------------------|
| НШ1 mid | `plinth + bandLow + bandMid` | `bandHigh` (или подбор «в потолок» 860/920/960) |
| НШ2 top | `plinth + bandLow + bandMid + bandHigh` | `bandTop` (часто high/2 при потолке) |

После resize Y: `snapFurnitureGroupPlacementY` всегда пересчитывает clearance из manufacturing, не залипший customFloorClearance (`furniture-manager.js` ~3418–3434). Fallback clr: mid **1420**, top **2140** мм.

### Глубина ярусов

| | Типично | Перед |
|--|---------|--------|
| MID | ~350 | flush стена (зад=0) |
| TOP shallow | = D mid | flush стена |
| TOP deep | ≈ D пенала / Dwt−40 | flush стена, перед ≈ пенал |
| TOP custom | 200…700 | якорь **перед** |

Взаимное выравнивание передних плоскостей mid↔top при shallow — оба rear=0 и близкий D; deep TOP выступает дальше mid (**код** resolve).

### Независимое vs авто

| Параметр | Независимо | Авто |
|----------|------------|------|
| bandMid (зазор НМ→НШ1) | Room2 rhythm + project | default/вилка |
| bandHigh / bandTop | rhythm / потолок | подбор tiers |
| Ширины MID vs BASE | да (отдельные grids) | пенал может подтянуть MID своей колонны |
| D TOP mode | stamp/API | default deep над tall else shallow |
| Y установки | нет в UI кухни | всегда от bands |

---

## 5. Крепёж, петли, присадка

| Событие | Крепёж | Петли |
|---------|--------|-------|
| Rebuild W/H/D (parametric) | ClodisBuilder → `__cldApplyJointFittingHoles`; place также `__cldRepositionJointSchemeFurniture` (`kitchen-section-engine.js` ~454–457) | `applyHingeLayoutInTree` / role layout; productKind `kitchen_wall` |
| Scale-only depth из карточки | **дыры могут не совпасть** с Clodis JSON | то же |
| Save схем | jointSchemes в дереве; hinge defaults в LS | без изменений в этом этапе |
| CFRN | drill leaves + joint leaves со сцены | **экспорт не прогонялся** |

Существующие схемы **не менялись** (ограничение задания).

---

## 6. Путь данных

```
Карточка step4 / place
  → stamps (customHeight/Depth, kitchenTopDepth*, floorClearance)
  → rebuildFurnitureGroupForSectionResize  ИЛИ  (разрыв) scale по D
  → enforceKitchenDepthStack (зад к стене)
  → snap Y от rhythm
  → hinges + joint holes
  → ikea-room-fixture (custom*, kitchenTopDepthMode/Custom/Locked, kitchenCarcassDepthMm)
  → CFRN matrixWorld + tid
```

**Подтверждено только кодом (не на живом НШ):** формулы bands, flush rear=0, TOP shallow/deep/custom API, скрытие floor clearance UI, save TOP depth stamps, cohabit mid/top, snap Y.

**Не проверено на модуле:** фактические мм bbox, CFRN dump, scale vs parametric после карандаша глубины НШ, round-trip save/load НШ2 deep.

---

## 7. Карта зависимостей и безопасность

```
                    ┌─ kitchen-manufacturing-profile (bands, wall place sizing)
kitchen_wall_* ─────┼─ kitchen-depth-stack (flush wall branch + optional offsets)
                    ├─ kitchen-base-engine (TOP depth resolve/rebuild, detectors)
                    ├─ kitchen-section-engine (place fit + TOP depth apply)
                    ├─ kitchen-band-grids / section-manager (MID/TOP widths)
                    ├─ furniture-manager (rebuild, snap Y, place size)
                    ├─ scene-icons (карточка — общий handler с НМ/шкафом)
                    └─ ClodisBuilder + joint/hinge (общие)
```

### Общее с другими слоями — **осторожно менять**

| Общее | С кем | Риск |
|-------|-------|------|
| `rebuildFurnitureGroupForSectionResize` | НМ, пенал, шкаф | ломает всё |
| `enforceKitchenDepthStackOnModule` | НМ + пенал + НШ | ветка flush рядом с НМ |
| `handleSectionZoneEditClick` / `applyModuleDepthCm` | все типы карточки | правка scale-ветки затронет шкаф |
| `snapFurnitureGroupPlacementY` | wall_hung шкаф + кухня | |
| hinge/joint engines | все | |
| `kitchenBandGrids` ensure | низ/верх сетки | |

### Относительно безопасные точки **только для верха** (**код**, без реализации)

1. `resolveKitchenWallTopDepthMm` / `rebuildWallTopForCellDepthMm` / `applyKitchenWallTopDepthForGroup` — уже изолированы top.  
2. `resolveKitchenWallMidPlaceSizing` / `resolveKitchenWallTopPlaceSizing` — только wall productKind.  
3. Пресеты `kitchen_wall_*` в `placement-kind-profiles.js` (editPopup лимиты).  
4. UI-ветка: явный вызов wall rebuild **вместо** scale — точечно в `applyModuleDepthCm` при `__isKitchenWallHungFurniture` (сейчас **разрыв**).  
5. Не трогать: `rebuildForCellDepthMm` НМ, worktop apply, НМУ clear, шкафные wall_hung clearance UI.

---

## 8. Итоговые списки

### 8.1 Карта параметров (сводка)

См. §§1–4: profile id, bands, D modes, editPopup, stamps fixture.

### 8.2 Механика глубины / положения

- Зад к стене (rear=0); при shallow/deep зад **неподвижен**.  
- Custom TOP: перед неподвижен.  
- Нет стека столешки.  
- Offsets API общие, UI нет.

### 8.3 Различия mid vs top

| | MID | TOP |
|--|-----|-----|
| Низ | plinth+low+mid | +high |
| H | bandHigh | bandTop |
| D default | ~350 | shallow≈mid / deep≈tall |
| catalog | 50 | 51 |
| baseKind label | wall_hung_low | wall_hung_high (но snap не ceiling) |

### 8.4 UI

Глубина / высота / ширина / hand; **нет** floor clearance; **нет** UI shallow/deep; глубина через **scale** (**разрыв**).

### 8.5 Save / присадка

TOP mode stamps в fixture (**код**); joint/hinge на rebuild (**код**); e2e **сцена** нет.

### 8.6 Работающие механизмы (подтверждены кодом)

1. Place sizing mid/top от ритма.  
2. Flush depth-stack rear=0.  
3. TOP shallow/deep/custom API + place apply.  
4. Cohabit kitchen_column + band grids.  
5. Snap Y от bands после resize.  
6. Скрытие шкафного «отступа от пола» для kitchen_wall_*.  
7. Hinges productKind kitchen_wall.  
8. Serialize TOP depth stamps.

### 8.7 Недостающее / разрывы

1. Карандаш глубины НШ в карточке → **scale**, не `rebuildWallTop` / wall mid parametric.  
2. UI режимов shallow/deep/custom.  
3. Отдельный UX «глубина НШ» vs «глубина модуля» шкафа.  
4. Документированная политика `rearOffsetMm` для навесов.  
5. Живая верификация CFRN/bbox.

### 8.8 Риски общих функций

Любая правка `applyModuleDepthCm` scale-хвоста, `enforceKitchenDepthStack`, `rebuildFurnitureGroupForSectionResize` без гарда `isKitchenWall*` — риск для НМ/шкафа/пенала.

### 8.9 Минимальный набор тестов следующего этапа

1. Place НШ1: Y = plinth+low+mid; D≈350; зад flush со стеной (±1 мм).  
2. Place НШ2 над НШ1: Y = +high; shallow D≈ mid; перед mid≈top.  
3. Place НШ2 над пеналом: mode deep; D≈ пенал; зад у стены.  
4. Карандаш глубины НШ1/НШ2: **ожидание** parametric (сейчас проверить факт scale — регрессия).  
5. Карандаш высоты: H меняется, Y низа снова от rhythm.  
6. Ширина MID grid независима от BASE (кроме колонны с пеналом).  
7. Rebuild → joint holes / hinge count на фасаде.  
8. Save/load: `kitchenTopDepthMode`, custom D/H, позиция Y.  
9. CFRN: размеры панелей = D/H после rebuild (не только scale group).  
10. Не регрессия: НМ depth stack 40/10; НМУ clear.

---

## Ключевые файлы и функции

| Файл | Функции / зоны |
|------|----------------|
| `js/placement-kind-profiles.js` | пресеты `kitchen_wall_*` ~272–356, Room2 baseKind ~575–605 |
| `js/sections/vertical-layout.js` | `isKitchenWallMid/TopPlacementKind` ~90–129 |
| `js/kitchen/kitchen-manufacturing-profile.js` | `resolveKitchenWallMid/TopPlaceSizing` ~1116–1238 |
| `js/kitchen/kitchen-depth-stack.js` | wall-hung depth resolve ~127–177; flush enforce ~366+ |
| `js/kitchen/kitchen-base-engine.js` | detectors; `resolveKitchenWallTopDepthMm` ~1688; `rebuildWallTopForCellDepthMm` ~1784 |
| `js/kitchen/kitchen-section-engine.js` | place + TOP depth ~451–475 |
| `js/furniture/furniture-manager.js` | place size ~2204–2251; snap Y ~3383–3450; catalog map ~3931 |
| `js/ui/scene-icons.js` | карточка; `__isKitchenWallHungFurniture` ~232; `applyModuleDepthCm` ~4168+ |
| `js/furniture/ikea-room-fixture.js` | TOP stamps ~137–139, 343–347 |

---

*Конец отчёта. Цель этапа: минимальные точечные доработки верха без переписывания общего ядра; первый кандидат — устранение разрыва UI depth → parametric wall rebuild.*
