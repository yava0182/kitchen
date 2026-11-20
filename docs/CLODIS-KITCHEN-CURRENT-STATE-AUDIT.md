# CLODIS — текущее состояние кухонного конструктора (аудит)

**Дата:** 2026-10-30  
**Режим:** только чтение кода. Исполняемый код, UI и данные каталога/проектов не изменялись.  
**Статусы утверждений:**  
- **код** — подтверждено чтением исходников;  
- **тест** — есть явная проверка/freeze в репозитории (указано где);  
- **предположительно** — логика в коде есть, end-to-end сценарий в этой сессии не прогонялся;  
- **отсутствует** — по поиску в коде механизма нет.

---

## А. Карточка «Настройка модуля» (шаг 4)

### Точка входа (код)

| Что | Где |
|-----|-----|
| Клик по карандашу зоны | `js/ui/scene-icons.js` → `window.handleSectionZoneEditClick` (~3563+) |
| Тексты/лимиты шага 4 | `room_steps_config.steps[stepId===4]` (`zoneEditTitle`, `zoneEditDepthMinCm`, …) |
| Профиль полей | `js/placement-kind-profiles.js` → `editPopup` + Room2 `#room2-placement-kinds` |
| HTML модалки | `#step4-help-modal-overlay` / `.cld-module-edit` в том же обработчике (~4507–4847) |
| Пустая зона / MID·TOP сетка | заголовок «Настройка зоны» (~4085–4090) |

### Условная видимость

Поля зависят от: есть ли мебель в зоне; `placementKind` / профиль; НМ / пенал / угол; `doorKind === 'single'`; активный пояс `kitchenBandGrids` (base/mid/top).

---

### А.1 Перечень параметров UI

#### 1) Глубина столешницы

| Поле | Значение |
|------|----------|
| UI | «Глубина столешницы» (`#step4-kitchen-worktop-depth-input`) |
| Когда видно | НМ / НМУ (`__isKitchenBaseFurniture`), зона с мебелью |
| Ед. | см |
| Default (UI) | текущая `__kitchenWorktopDepthMm` или ~60 |
| Min / Max | `worktopMinCm`…`worktopMaxCm` из `getWorktopDepthDefaults()` / fallback 20…80 |
| Объект | **ряд / стена** (все НМ под столешкой) |
| Хранение | project / `ud.__kitchenWorktopDepthMm` + manufacturing profile |
| При изменении | `applyKitchenWorktopDepthCm` → `__clodisApplyKitchenWorktopDepthOnWall` / `applyWorktopDepthOnWall` |
| Геометрия | столешка ряда + пересчёт допустимой глубины корпусов; затем depth-stack |
| Save/load | через `kitchenProject` / stamps модуля (**код**, ikea fixture + manufacturing) |
| Админка | профиль производства / Room2 ритм косвенно; не отдельное поле в editPopup |

#### 2) Глубина НМ (корпус)

| Поле | Значение |
|------|----------|
| UI | «Глубина НМ» (`#step4-module-depth-input`) |
| Когда | НМ / НМУ |
| Ед. | см |
| Default | `ud.__kitchenCarcassDepthMm` / customDepth / ~55 |
| Min / Max | `getBaseCarcassDepthBoundsMm(Dwt)` → max = Dwt − 40 − 10; min ≈ 150 мм (15 см) |
| Объект | **этот модуль** |
| Хранение | `ud.__kitchenCarcassDepthMm`, `customDepthMm` |
| При изменении | `applyModuleDepthCm` → `rebuildForCellDepthMm` (`kitchen-base-engine.js`) |
| Геометрия | parametric Z корпуса (не scale); якорь переда = столешка − 40 |
| Save/load | `kitchenCarcassDepthMm` / `customDepthMm` в ikea-room-fixture (**код**) |
| Админка | лимиты depthMin/Max в placementKind; формула в `kitchen-manufacturing-profile.js` |

#### 3) Глубина пенала

| Поле | Значение |
|------|----------|
| UI | «Глубина пенала» |
| Когда | `kitchen_tall` |
| Default | ~56 см; зад к стене (rear=0) |
| Min / Max | обычно 40…70 см из профиля |
| При изменении | `rebuildTallForCellDepthMm` / `rebuildForCellDepthMm` |
| Объект | модуль пенала |

#### 4) Глубина модуля (прочие / шкаф)

| Поле | Значение |
|------|----------|
| UI | «Глубина модуля» |
| Когда | мебель есть, не НМ и не tall |
| Пути | `standalone_floor` → `__clodisApplyModuleCustomDepthCm`; иначе **uniform scale** по оси глубины с якорем переда (~4272–4314) |
| Важно | для кухни НМ/пенал — parametric; для нишевого шкафа — scale (**код**) |

#### 5) Высота модуля

| Поле | Значение |
|------|----------|
| UI | «Высота модуля» |
| Когда | `editPopup.showHeight` / `behavior.fixedHeight` (НМ, wall_hung_*, pedestal…) |
| Ед. | см |
| Min / Max | профиль (НМ: 82…92 см в пресете) + step4 config |
| При изменении | `__clodisApplyModuleCustomHeightCm` |
| Объект | модуль; опционально sync по ряду (`syncHeightInSection`) |
| Хранение | `customHeightMm` |
| Пенал | `showHeight: false` — высоты из секции/ритма |

#### 6) Отступ от пола

| Поле | Значение |
|------|----------|
| UI | «Отступ от пола» |
| Когда | `wall_hung_low` **и не** кухонный навес (`!__isKitchenWallHungFurniture`) |
| Ед. | см; default ~30; 0…80 |
| Хранение | `customFloorClearanceMm` / секция `wallHungFloorClearanceMm` |
| Примечание | для кухонных НШ **поле скрыто** — ритм кухни (**код** ~3678–3680) |

#### 7) Отступ от стены (НМУ)

| Поле | Значение |
|------|----------|
| UI | «Отступ от стены» (`#step4-module-side-wall-clearance-input`) |
| Когда | НМУ / `kitchenCorner` / `showSideWallClearance` |
| Ед. | **мм**; default **10**; 0…200 |
| Объект | угловой модуль: щель до боковой стены → `corner_return` / clear |
| Хранение runtime | `ud.__kitchenSideWallClearanceMm` + vars `corner_return_*` |
| При изменении | путь НМУ rebuild / clear (scene-icons apply + `kitchen-base-engine` `_cornerReturnDFromClearMm`) |
| Save | **в ikea-room-fixture serialize поля `__kitchenSideWallClearanceMm` нет**; сохраняются `clodisVariables` (в т.ч. return). **Риск потери clear stamp** при reload, если не восстановить из vars — **код**, e2e не прогонялся |
| Админка | канон НМУ в правилах; не editPopup checkbox отдельно (флаг `showSideWallClearance` в пресете corner) |

#### 8) Ширина модуля / зоны

| Поле | Значение |
|------|----------|
| UI | «Ширина модуля» или «Ширина зоны» + «Сбросить» |
| Ед. | см |
| Min / Max | из `section_division` step4: single_min…double_max (типично 30…120 см) |
| Объект | **ячейка** (кухня BASE: `customZoneWidthsMm` + sync модуля) или только корпус |
| При изменении | `__clodisSetZoneCustomWidthMm` или `__clodisApplyModuleCustomWidthCm` |
| MID/TOP | только `kitchenBandGrids[band].customZoneWidthsMm`, без place верхних |
| Сброс | удаление custom width → равномерное деление |
| Save | `division.customZoneWidthsMm`, `kitchenBandGrids` (**код** fixture) |

#### 9) Открывание двери

| Поле | Значение |
|------|----------|
| UI | Левая / Правая |
| Когда | мебель + `doorKind === 'single'` |
| Хранение | `ud.zoneHand` |
| Save | `zoneHand` в fixture (**код**) |
| Связь | петли / animator direction |

#### 10) Кнопки

| Кнопка | Назначение |
|--------|------------|
| Сохранить | закрытие / фиксация введённых значений (handlers на input+save) |
| Закрыть (×) | `closeModal`, сброс fog |
| Удалить модуль | удаление мебели из зоны |
| Развернуть нижнюю ячейку | `reorientKitchenCornerCell` / связанный API |
| Развернуть верхнюю ячейку (600) | верх пирога W=600 |
| Сбросить (ширина) | авто-равные ячейки |

#### 11) Чего **нет** в карточке (важно)

| Параметр | В ядре | В UI карточки |
|----------|--------|----------------|
| `rearOffsetMm` | да | **нет** |
| `frontOffsetMm` | да | **нет** |
| Произвольный сдвиг вдоль стены (left/right mm) | drag мебели | не в карточке |
| Вертикальный lift модуля вне «высоты» | частично (wall hung clearance) | кухня НШ — через ритм |
| Выбор схемы крепежа/петель | отдельно | не в этой карточке |

---

## Б. Карта зависимостей

```
[Карандаш зоны / step4]
  → handleSectionZoneEditClick (scene-icons.js)
  → placementKindProfiles.editPopup + room_steps_config step4
  → apply*Cm / reorient / setZoneWidth
       ├─ kitchen-base-engine: rebuildForCellWidthMm / DepthMm / Tall*
       ├─ kitchen-depth-stack: enforceKitchenDepthStackOnModule
       │     (+ rearOffsetMm − frontOffsetMm rigid shift)
       ├─ section-manager: customZoneWidthsMm, kitchenBandGrids, layout
       └─ furniture-manager: rebuildFurnitureGroupForSectionResize
              → ClodisBuilder build (sectionSize + vars)
                    ├─ панели / фасады / цоколь / столешка (дерево админки)
                    ├─ applyHingeLayoutInTree (петли по ролям)
                    └─ __cldApplyJointFittingHoles (схемы крепежа)
  → ikea-room-fixture save/load
  → bazis-cfrn-export (детали + Furniture_Присадка + joint leaves)
```

---

## В. Таблица механизмов

| Механизм | Ядро | UI | Работает* | Save | БАЗИС | Файлы |
|---|---|---|---|---|---|---|
| Ширина ячейки BASE | да | да (карточка) | предположительно | да | через rebuild деталей | scene-icons, section-manager, kitchen-base-engine |
| Ширина MID/TOP grid | да | да (Настройка зоны) | предположительно | да (band grids) | если модуль пересобран | kitchen-band-grids-view, section-manager |
| Глубина столешки ряда | да | да (НМ) | предположительно | kitchenProject | геометрия столешки | kitchen-base-engine, manufacturing-profile |
| Глубина корпуса НМ | да | да | предположительно | kitchenCarcassDepthMm | детали Z | rebuildForCellDepthMm |
| Глубина пенала | да | да | предположительно | customDepth / carcass | да при rebuild | kitchen-base-engine |
| Высота НМ | да | да | предположительно | customHeightMm | да | furniture-manager apply height |
| Отступ НМУ от боковой стены | да | да (мм) | предположительно | **частично** (vars; stamp clear не в fixture) | геометрия return | kitchen-base-engine, scene-icons |
| `rearOffsetMm` / `frontOffsetMm` | да | **нет** | API `__cldSetKitchenModuleOffsetsMm` | да (fixture) | позиция модуля → мир отверстий | kitchen-depth-stack, ikea-room-fixture |
| Depth-stack якорь переда −40 | да | косвенно | код | stamps overhang | позиция | kitchen-depth-stack.js |
| Scale глубины (шкаф ниша) | да | да (не-кухня) | код | customDepthMm | **риск** если только scale | scene-icons ~4272 |
| Drag вдоль стены | да | сцена | предположительно | position | да | furniture-manager |
| Петли по ролям | да | админка + hand | предположительно | LS defaults + дерево | drill tid | hinge-layout-generator, ClodisBuilder |
| Схемы крепежа joint | да | админка конструктор | предположительно | jointSchemes + LS | buildJointFittingLeaves | joint-fitting-resolve, ClodisBuilder |
| Gola выемки боковин | да | через Gola pk | предположительно | grooves / дерево | CFRN grooves | kitchen-gola-groove.js |
| Объекты комнаты (трубы, розетки) | да | Room edit | размещение да | roomEditObjects | **не** как вырезы мебели | room-edit-objects.js |
| Вырез панели под препятствие | — | — | **отсутствует** как panel CSG | — | — | — |
| Коллизия мебель↔труба | zone cohabit | — | только «два full в ячейке» | — | — | section-manager collision zones |

\*«Работает» в смысле наличия рабочего пути вызовов в коде; интерактивный прогон сценариев в этой сессии не выполнялся.

---

## 2–3. Размеры, положение, глубина

### Формулы стека НМ (код)

Источник: `kitchen-manufacturing-profile.js`, `kitchen-depth-stack.js`.

- `FRONT_SETBACK_TO_CARCASS_MM = 40`
- `REAR_OVERHANG_MIN_MM = 10`
- `DEFAULT_WORKTOP_DEPTH_MM = 600`
- `maxCarcass = Dwt − 40 − 10` (при 600 → **550**)
- `rearOverhang = Dwt − 40 − carcass` (≥ 10)
- Якорь: **перед корпуса** на `wall + Dwt − 40` (не зад)
- Пенал: зад = плоскость секции (`rear=0`), перед ≈ wall + D_tall

### `rearOffsetMm` / `frontOffsetMm` (код)

- Не путать с `__kitchenRearOverhangMm` / `__kitchenFrontSetbackMm` (стек столешки).
- `delta = rearOffset − frontOffset` → один rigid shift группы после канонического стека.
- D корпуса **не** меняют.
- UI карточки **не** выставляет; API: `__cldSetKitchenModuleOffsetsMm` / `__cldReadKitchenModuleOffsetsMm`.
- Save/load: **да** в ikea-room-fixture.

### Сценарий пользователя (анализ по коду, не тест)

1. «Корпус 600, отступ от стены 0» — для НМ при Dwt=600 канонический max корпуса **550** (rear≥10). Корпус 600 при Dwt=600 противоречит `getBaseCarcassDepthBoundsMm`, если нет другого Dwt. **предположительно** UI не даст 600 при столешке 600.
2. Сдвиг +50 от стены без смены D → в ядре: `rearOffsetMm=50` (или drag). В UI карточки нет `rearOffsetMm`; «Отступ от стены» у НМУ — **боковой clear**, не задний.
3. Уменьшение D до 550 при сохранении rearOffset 50 → стек снова ставит перед на `Dwt−40`, затем +50. Перед остаётся на той же абсолютной линии, что после шага 2. **Поддерживается ядром** (якорь переда + offsets).
4. «Передняя линия фасада в исходное» — если «исходное» = до шага 2 (без offset), нужно обнулить offsets; если = после шага 2 — шаг 3 сохраняет её. **код** согласуется со вторым толкованием.

---

## 4. Параметрика и перестроение

| Элемент | Как меняется |
|---------|----------------|
| Бока / дно / крышка / зад / полки | Clodis выражения `s:`/`v:` + `rebuildFurnitureGroupForSectionResize` → Furniture/ClodisBuilder (**parametric**, не mesh-scale) для кухни |
| Фасады | дерево + hinge layout + door hand |
| Ящики / наполнение | слоты/стеки в дереве при rebuild |
| Опоры / цоколь | vars `h_bottom` / plinth project; доски из админки |
| Столешка | ряд + manufacturing depth |
| НМ глубина | `rebuildForCellDepthMm` → sectionSize.z / carcass Z |
| НМ ширина | `rebuildForCellWidthMm` (+ НМУ clear/return) |
| Шкаф ниша глубина из карточки | возможен **scale** группы |

Зависимость: `sectionSize` + `clodisVariables` + stamps `ud.__kitchen*`.

---

## 5. Секции, ячейки, WallRun

| Тема | Факт (код) |
|------|------------|
| Создание ячеек | `division.parts` + layout cache; L/П special zones |
| Ширина | equal или `customZoneWidthsMm`; BASE sync с `kitchenBandGrids.base` |
| Модуль ← ячейка | place/rebuild с `sectionSize.x` = ширина зоны (кухня) |
| Соседи при смене W | перераспределение custom widths / layout |
| Замена модуля | place в зону; cohabit `kitchen_column` (base+mid+top) |
| Глубина одного НМ | только этот модуль (`followCorner: false` в UI apply) |
| Ширина одного | ячейка + модуль |
| Доборы / void | сегменты layout; empty zone width UI |
| UI vs API | карандаш/карточка; offsets/API console; band view |

Файлы: `section-manager.js`, `kitchen-section-layout.js`, `kitchen-section-engine.js`, `kitchen-band-grids-view.js`, `kitchen-joint.js`, `kitchen-corner-*`.

---

## 6. Админка (кухня)

| Область | Где |
|---------|-----|
| Типы размещения + editPopup | `#room2-placement-kinds`, `placement-kind-profiles.js` |
| Вертикальный ритм | `#room2-kitchen-rhythm` |
| Карточка модуля каталога | дерево конструктора, vars, size/pos |
| Вкладка «Параметры» (шаг 5 комнаты) | блок в admin-new ~5653 — пункты для пользователя, **не** полный реестр геометрии модуля |
| placementKind на карточке | catalog item / Room2 |
| Петли по ролям | `#hinge-role-defaults` |
| Схемы крепежа | `#drilling-schemes` / `#drilling-scheme-edit` |

Индивидуально на модуль в комнате: размеры/clear через карточку; профиль — на тип размещения. Общего «вкл/выкл каждого поля геометрии per catalog item» как единого registry **нет** (поля карточки = merge пресет + Room2 overrides + step4).

---

## 7. Крепёж и петли — точки подключения к кухне

| Событие | Крепёж | Петли |
|---------|--------|-------|
| Rebuild модуля | ClodisBuilder end → `__cldApplyJointFittingHoles` | `applyHingeLayoutInTree` при build фасада |
| Смена W/H/D | новый bbox/contact → `resolveJointSchemeStationsMm` | новый `doorH` → `calcHingeRoleLayoutPositions` |
| Смена hand | — | zoneHand / opens |
| Источник длины | `seamOverlapMm` контакта | высота/ширина полотна фасада |
| Другая фурнитура | шаблоны BM-типов в админке; ручки/опоры отдельно | — |

Отдельный полный аудит схем уже сделан ранее; здесь только связка с kitchen rebuild.

---

## 8. Препятствия и коммуникации

| Объект | Создание / хранение | Размеры | Учёт при place мебели | Вырез в детали |
|--------|---------------------|---------|----------------------|----------------|
| Вода (outlet) | `kitchen-water-outlet.js`, `state.roomEditWaterOutlet` | точка на стене | **нет** cutout корпуса | нет |
| Электрика / розетки | `room-edit-objects.js` category electric | да (W/H/D, elev) | визуал/план; не rebuild панелей | нет |
| Вентиляция / трубы | category ventilation / pipes | да | то же | нет |
| Отопление / structural | obstacles в kitchen-brain adapter | да | экспорт в brain; не CSG кухни | нет |
| Окна / двери | openings в roomAdapter | да | геометрия комнаты | не панели модуля |
| Gola выемки | `kitchen-gola-groove.js` | да | производственные grooves | **да** (выемка торца боковины), не «труба» |
| Shape cutouts комнаты | roomAdapter comment «Shape cutouts / steps» | если params | brain obstacles | не детали CLODIS-панели |

**Вывод:** объекты коммуникаций **есть** как room-edit entities с координатами. **Автовырезов** кухонных панелей под них в коде сборки модуля **не найдено**. Gola grooves — отдельный реализованный вырез под профиль.

---

## 9. Save / load

| Параметр | Save (fixture) | Restore |
|----------|----------------|---------|
| customDepth/Height/Width | да | да |
| rear/frontOffsetMm | да | да + enforce stack |
| kitchenCarcassDepthMm / top depth stamps | да | да |
| zoneHand / doorKind | да | да |
| customZoneWidthsMm / kitchenBandGrids | секции | да |
| kitchenProject | да | manufacturing |
| clodisRoots / variables | да | rebuild |
| `__kitchenSideWallClearanceMm` | **не в списке serialize** | через vars **предположительно** |
| jointSchemes | в clodis дереве карточки | да при наличии LS схем |
| hinge role defaults | LS браузера | не в fixture проекта |

---

## 10. Производство (БАЗИС / CFRN)

| Изменение | В деталях | Присадка |
|-----------|----------|----------|
| W/H/D после parametric rebuild | да (размеры панелей) | joint + hinge tid пересчёт от геометрии сцены |
| Только group.scale (шкаф) | **осторожно**: может не совпасть с Clodis JSON | отверстия от текущих mesh |
| rear/frontOffset | сдвиг мира → матрицы | да, если экспорт со сцены после enforce |
| Gola grooves | да | отдельный канал grooves |
| Room pipes/outlets | как мебель кухни — **нет** | нет |

Визуальный сдвиг ≠ гарантия CFRN без прогона экспорта (**не прогонялся** в этой сессии).

---

## 11. Кухня vs шкаф

### Преимущественно кухня

`js/kitchen/*`, `js/room/kitchen-*`, `js/ui/kitchen-*`, `kitchen-brain/*`, placement kinds `kitchen_*`, catalog_4x/5x кухонные.

### Общие (менять с проверкой шкафа)

`furniture-manager.js` (rebuild/place), `ClodisBuilder.js`, `section-manager.js`, `scene-icons.js` (карточка общая), `placement-kind-profiles.js` (есть и wardrobe presets), `bazis-cfrn-export.js`, joint/hinge engines, constructor admin.

### Риск для шкафа

- Правки `rebuildFurnitureGroupForSectionResize` / door prepare.
- Scale-depth ветка в scene-icons.
- `cohabitGroup` / zoneSlotRole логика ниш.
- Room2 профили с baseKind шкафа.

---

## Г. Уже можно использовать без новой разработки

1. Параметрический rebuild НМ/НМУ/пенал по W и D.  
2. Столешка ряда + канон −40 / rear≥10.  
3. Независимые сетки BASE/MID/TOP.  
4. Карточка step4 с полями по placementKind.  
5. Depth-stack + API module offsets (без UI).  
6. НМУ clear / corner_return (канон 1.42 в engine).  
7. Петли по ролям + joint schemes + CFRN drill.  
8. Gola grooves на боковинах.  
9. Save основных stamps размеров/offsets в fixture.  
10. Room-edit коммуникации как объекты плана.

## Д. Частично реализовано

1. `rearOffsetMm`/`frontOffsetMm` — ядро+save, **без UI**.  
2. Side-wall clear — UI+runtime; serialize stamp неполный.  
3. Кухонный навес высота — ритм, не «отступ от пола» шкафа.  
4. Схемы крепежа ↔ вырезы панели — нет; ↔ смена габарита — да.  
5. Препятствия — в комнате есть; связи с геометрией деталей модуля — нет.  
6. editPopup width limits в пресете НМ vs section_division step4 — два источника лимитов.  
7. Legacy hinge_layout schemes LS без полноценной страницы в текущем admin.

## Е. Отсутствует (по коду)

1. UI заднего/переднего offset модуля (не путать с НМУ clear).  
2. Автовырез корпуса/столешки под трубы/розетки/короба.  
3. Детект коллизий мебель↔коммуникации с правилами зазоров.  
4. Пересчёт joint-станций от «выреза на одной панели» (нет модели выреза).  
5. Единый param-registry «все поля карточки ↔ catalog item».  
6. Автоуменьшение числа петель при укорочении фасада (count фиксирован в роли).

## Ж. Противоречия / риски (только с доказательством)

1. **Имя «Отступ от стены» в UI НМУ ≠ `rearOffsetMm`.** UI пишет `__kitchenSideWallClearanceMm` (scene-icons ~4719–4738); offsets — kitchen-depth-stack. Путаница сценариев «от стены 50».  
2. **Корпус 600 при столешке 600** конфликтует с `max = Dwt−50` (manufacturing-profile ~505–520).  
3. **`__kitchenSideWallClearanceMm` не в ikea-room-fixture serialize** (~104–150), при этом runtime stamp активно используется.  
4. **Два пути глубины:** parametric кухня vs scale шкафа в одном `applyModuleDepthCm`.  
5. **`_buildHingesForFacade` early return** (ClodisBuilder ~14017) — старый BLB путь выключен; актуальный — catalog modules + role layout.  
6. Debug петель в `#drilling-scheme-edit` считает позиции через **`calcSchemePositions` крепежа**, не `calcHingeRoleLayoutPositions`.

## З. Карта файлов для дальнейшей разработки

| Слой | Файлы / функции |
|------|-----------------|
| UI карточки | `js/ui/scene-icons.js` (`handleSectionZoneEditClick`, `applyModule*`) |
| Профили | `js/placement-kind-profiles.js`; admin `#room2-placement-kinds` |
| Глубина | `kitchen-depth-stack.js`, `kitchen-manufacturing-profile.js`, `kitchen-base-engine.js` (`rebuildForCellDepthMm`, `applyWorktopDepthOnWall`) |
| Ширина/ячейки | `section-manager.js`, `kitchen-section-engine.js`, `kitchen-section-layout.js`, `kitchen-band-grids-view.js` |
| Угол | `kitchen-joint.js`, `kitchen-corner-cell.js`, `kitchen-corner-reorient.js` |
| Rebuild | `furniture-manager.js` `rebuildFurnitureGroupForSectionResize`; `ClodisBuilder.js` |
| Save | `ikea-room-fixture.js` |
| Крепёж | `joint-fitting-resolve.js`, `joint-hole-meshes.js`, `bazis-cfrn-export.js` |
| Петли | `hinge-layout-generator.js`, ClodisBuilder hinge layout |
| Коммуникации | `room-edit-objects.js`, `kitchen-water-outlet.js`, `kitchen-brain/roomAdapter.js` |
| Gola | `kitchen-gola-groove.js` |

---

## Краткие ответы на контрольные вопросы аудита

1. **Карточка** — полный перечень в §А; скрытые/условные поля учтены.  
2. **Все способы размеров** — §В + offsets API без UI.  
3. **Глубины** — формулы §2–3; сценарий front-preserve при смене D **поддержан ядром** при фиксированных offsets.  
4. **Rebuild** — parametric для кухни; scale — ветка шкафа.  
5. **Ячейки** — §5.  
6. **Админка** — §6.  
7. **Крепёж/петли** — §7.  
8. **Препятствия** — объекты есть; вырезов панелей под них нет; Gola — отдельный вырез.  
9. **Save** — §9; отмечен риск clear stamp.  
10. **БАЗИС** — §10.  
11. **Кухня/шкаф** — §11.

*Конец отчёта.*
