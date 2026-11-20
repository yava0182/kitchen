# CLODIS — SIDE PANELS S1. Аудит архитектуры боковин

Режим: READ-ONLY. Код не менялся. Дата аудита: 2026-10-31.

Целевой сценарий (будущий эксперимент): прямой пенал, корпус D=460, `rearOffsetMm`=100, перед 560; левая боковина → до стены; правая обычная. Два режима: накладка и удлинённая штатная боковина.

---

## 1. Карта файлов и функций

### 1.1. Геометрия боковин (ClodisBuilder)

| Файл | Роль |
|------|------|
| `js/ClodisBuilder.js` → `buildWall` | Создание всех `type:wall` / plinth / countertop |
| `js/ClodisBuilder.js` → `getMaterialThickness` | Толщина панели из `spec.material.group` (не из `size.x`) |
| `js/ClodisBuilder.js` → `evaluateSize` / `evaluatePosition` / `evaluatePivot` | Параметрика size/pos/pivot |
| `js/ClodisBuilder.js` → `_isPhantomJointFittingWallItem` | Фантомные «Крепёж: …» не строят геометрию |
| `js/clodis/clodis-build-contract.js` → `prepareKitchenModuleForBuild` | Единый вход admin ≡ room |
| `js/clodis/clodis-prepare-for-build.js` | Нормализация дерева/vars перед билдом |

**Где появляются левая/правая боковины пенала**

- Карточка пенала: `catalog_items/catalog_48.json` — дерево с nested `module` «Корпус пенала» (`spec.element_type: catalog_47`, `layout_role: corpus`).
- Реальные бока: `catalog_items/catalog_47.json` («Корпус пенала»):
  - `wall` «Бок левый» — `spec.side: left`, `detailTypeId: vertical_left`, `orientation: v`, `direction: z`
  - `wall` «Бок правый» — `spec.side: right`, `detailTypeId: vertical_right`, …
- На верхнем уровне catalog_48 стен боковин нет — только nested modules (корпус / цоколь / …).

**Геометрия (подтверждено кодом)**

- Вертикальный бок: `BoxGeometry(thickness, size.y, size.z)` — глубина панели = вычисленный `size.z`, толщина = материал группы (обычно 16).
- В карточке оба бока: `size.z = "s:z"` (глубина корпуса секции).
- Дно / полки / крыша: `size.z = "s:z"`, ширина `s:x-32` (две толщины по 16).
- Задник: отдельный `wall`, pivot у задней грани.
- `scale` в JSON есть (`1,1,1`), но для смены глубины не используется и **не должен** использоваться (требование S1).

**Материал / кромки**

- Материал: `spec.material.group` / `key` (у боков пенала — `g0` / `material_2`).
- Кромки: у боков catalog_47 `edges: {}` (пусто на карточке).
- Кромки в админке правятся в секции материала детали (`catalog-constructor-material-section`), не отдельной моделью «боковина кухни».

**Связь с полками / дном / крышей / задником**

- Ширина горизонталей завязана на `s:x-32` и `pos.x=16` — симметрия двух боков по толщине.
- Глубина горизонталей = `s:z` секции корпуса — **не** независима от бока.
- Крепёж бок↔горизонталь: `jointSchemes` на боковине + дочерние `furniture` конфирматы (см. §3).

**Можно ли изменить глубину одной боковины без смены D корпуса?**

- На уровне `buildWall`: **да** — `evaluateSize` берёт `item.size` конкретной детали; левый бок теоретически может иметь `size.z = "s:z + 100"`, правый — `"s:z"`.
- На уровне текущей карточки catalog_47: **нет готового режима** — оба `s:z`.
- Горизонтали/задник останутся на `s:z` корпуса → удлинённый бок будет торчать за зад (к стене) или вперёд; это ожидаемо для «до стены», но **шов крепежа и seamLen нужно пересчитывать** (см. риски).

**Стабильные идентификаторы**

- В дереве: строковые `id` вида `node_1791616172158_4wkk8eft7` (стабильны в карточке).
- Runtime: `wallGroup` / `*_core` mesh, `userData.detailTypeId`, `detailName`, `spec.side`.
- Поиск боковин в комнате: эвристики по имени/detailTypeId (`_find…Sidewall` в ClodisBuilder для петель) — **нет** единого API «module.sidePanels.left».
- Nested live-catalog: корпус подтягивается из catalog_47; instance-override на бок должен жить либо в дереве после hydrate, либо в отдельном overlay поверх joint/size (как уже делается для jointSchemes в furniture-clodis).

### 1.2. «Декоративные» панели (уже в системе) — не путать с боковой накладкой модуля

| Механизм | Файл | Что это |
|----------|------|---------|
| Section SideTrim (обклад ряда) | `js/sections/section-manager.js` → `reconcileSectionSideTrimForWall` | Планки обклада секции у стены/проёма |
| Insets обклада | `js/sections/section-edge-trim-insets.js` | Зазоры под trim / EndCabinet |
| EndCabinet | `js/sections/section-end-cabinet.js` | Торцевой модуль / накладка **ряда** при зазоре до стены |
| EndCabinet facade overlay | `room_steps_config.json` (`end_cabinet_facade_overlay_*`) | Накладка на фасадную плоскость торцевого шкафа |
| Facade `type:facade` | ClodisBuilder `buildFacade` | Фасад модуля (не бок корпуса) |
| Админ: торцевой зазор | `admin-new.html` → `#room2-end-cabinet-ibox` | Правило зазора → EndCabinet вместо «боковой накладки» ряда |

**Вывод:** готовой **модульной боковой накладки** (деталь поверх `vertical_left` / `vertical_right`) нет. SideTrim / EndCabinet — секционный слой; переиспользовать как «боковину пенала» нельзя без смешения понятий.

Производственная деталь накладки возможна тем же путём, что обычный `wall`/`detail` в дереве: size/pos/pivot + материал + (опционально) кромки; **без** корпусных `jointSchemes`.

### 1.3. Крепёж и присадка

| Файл | Роль |
|------|------|
| `item.jointSchemes[]` на детали | Источник схем стыка (persist в карточке) |
| Админ: `catalog-constructor-joint-section` | UI «Крепёж стыков» на выбранной детали |
| `js/admin/admin-new-bundle.js` | Назначение scheme → contactId / neighbor / setupType |
| `public/data/clodis_drilling_registry.json` | templates + schemes |
| `js/joint-fitting-resolve.js` | Станции, шаблоны отверстий |
| `js/joint-engine-v2.js` | Контакты торец/пласть |
| `js/joint-hole-meshes.js` | 3D отверстия в комнате |
| `js/constructor/constructor-clodis.js` → `_renderJointMarkers` | Превью присадки в админке |
| ClodisBuilder | Копирует `jointSchemes` в `userData`; пропускает фантомный крепёж-детей при наличии схем |

**Схемы в registry (факт, не выдумка)**

- Schemes: id 1 «Конфирмат 50 мм», 2 «Эксцентр», 3 «Полкодержатель Tri A», 4/5 конфирмат/эксцентр ящики — все `schemeType: symmetric`.
- Templates: 1 T-стык бок+полка (setup 3), 2 эксцентр, 3 TriA, 7 петля накладная, 8/9 направляющие.

**На боках catalog_47 (факт)**

- У каждого бока 4× `jointSchemes` → Дно, 2 горизонтали, Крыша; `schemeId: 1`, `setupType: 3`, `hostFaceType: plast`, `seamLen: 550` (запечено под глубину карточки).
- Дети: пары `furniture` «Конфирмат 7х50 …» (визуал/экспорт); при живых jointSchemes фантомы могут пропускаться.

**Альтернативная схема на одной боковине**

- В админке уже можно назначить другой `schemeId` на конкретный joint entry детали (Л/П независимо, т.к. схемы на разных узлах).
- **Не подтверждено** наличие готовой схемы «удлинённый бок до стены» или «накладка без корпуса» — нельзя изобретать присадку в S2.

**Исключить крепёж у декоративной накладки**

- Не вешать `jointSchemes` на узел накладки.
- Не добавлять children `furniture` конфирматов корпуса.
- Не копировать jointSchemes с штатного бока на overlay.

### 1.4. Админка — куда логично «Боковины» (поля не добавлять)

Панель конструктора: `#constructor-properties-panel` в `admin-new.html` (~11317).

Уже есть сворачиваемые/условные блоки:

- `#catalog-constructor-material-section`
- `#catalog-constructor-size-section`
- `#catalog-constructor-joint-section`
- `#catalog-constructor-hinge-scheme-section`
- plinth / model / accessories / «Основные параметры»

**Рекомендация размещения (только план):**

1. **Предпочтительно:** новый блок `#catalog-constructor-side-panels-section` в `#constructor-properties-panel`, **после «Основные параметры» / размера, до «Крепёж стыков»**, показывать при выборе:
   - корневого кухонного модуля / секции с `layout_role: corpus`, **или**
   - узла «Бок левый» / «Бок правый» (тогда — только выбранная сторона).
2. **Не** класть в `#room2-end-cabinet-ibox` — это правило торцевого шкафа ряда, другой слой.
3. **Не** смешивать с UI SideTrim / обклада комнаты.
4. Компактный collapse по образцу существующих `border-top` секций панели свойств (без нового дизайн-кита).

Поля в S1 не добавляются.

### 1.5. Комната и конфигуратор

| Тема | Где | Поведение |
|------|-----|-----------|
| Place / rebuild | `furniture-manager.js` → `prepareKitchenModuleForBuild` | Тот же prepare, что админ-превью |
| Глубина пенала | `kitchen-base-engine.js` → `rebuildTallForCellDepthMm` | Меняет D корпуса (`customDepthMm` / `__kitchenCarcassDepthMm`), W/H сохраняет |
| Отступ от стены | `userData.rearOffsetMm` + `kitchen-depth-stack.js` → `applyKitchenModuleOffsetsAfterStack` | **Только rigid shift** группы; D не меняет |
| Стек глубины | `enforceKitchenDepthStackOnModule` | Абсолютная посадка ряда; затем один раз offsets |
| UI отступа/глубины | `js/ui/scene-icons.js` | Карандаши; пенал: D и rearOffset независимы (DEPTH-3) |

**Передача параметров admin → room**

- Каталог: дерево + vars карточки.
- Инстанс в комнате: `userData` (depth, rearOffsetMm, productKind, …) + rebuild через prepare.
- Отдельного поля «боковины L/R» в userData / карточке **нет**.

**Риск двойного смещения / неверной глубины панели**

- `rearOffsetMm` двигает **весь** модуль от стены. Корпус D=460 при offset=100 → перед 560.
- Если штатный бок удлинить на +100 «до стены» **и** сдвинуть группу ещё раз на rearOffset — зад уедет в стену / панель удвоит зазор.
- Правило: глубина «до стены» = `carcassD + rearOffsetMm` (в мм панели), якорь переда по-прежнему flush стека; **не** увеличивать D корпуса и **не** применять второй shift для панели.

**Ячейки / ширина секции**

- SideTrim / EndCabinet резервируют ширину вдоль стены (`getEndCabinetReserveMm` / insets).
- Накладка **снаружи** бока по X увеличит bbox модуля и может врезаться в соседнюю ячейку или съесть зазор.
- Безопасный старт S2: накладка/удлинение **только по Z** (к стене), толщина в плоскости фасада = штатная; не менять W ячейки и не трогать EndCabinet/SideTrim.

---

## 2. Что можно использовать повторно

1. **`buildWall` + выражения size/pos/pivot** — независимая глубина одной детали без `scale`.
2. **`spec.side` / `detailTypeId: vertical_left|vertical_right`** — различение Л/П.
3. **`jointSchemes` на детали** — уже Л/П раздельно; смена schemeId на записи стыка.
4. **`prepareKitchenModuleForBuild`** — единый контракт admin/room для будущих vars/мутаций дерева.
5. **Материал детали** (`spec.material`) — отдельный декор/ЛДСП на бок или накладку.
6. **Паттерн «деталь без jointSchemes»** — для overlay (как чистый wall без крепежа).
7. **Идентификаторы узлов `node_*`** — якоря для instance-override.
8. **`rearOffsetMm` как величина зазора до стены** — вход для `depthMode: to_wall` (не как второй сдвиг панели).

---

## 3. Чего нет (пробелы)

1. Модели данных `sidePanels.left|right` (mode / depth / material / jointPolicy).
2. Режима накладной боковой панели модуля как производственной детали в дереве.
3. Режима «удлинённая штатная боковина» в карточке / prepare (формулы, якорь к стене).
4. API поиска/override боковин инстанса в комнате (кроме эвристик петель).
5. Пересчёта `seamLen` / станций присадки при `size.z ≠` глубине шва горизонталей.
6. Совместимой **подтверждённой** схемы крепежа именно для удлинённого бока (не выдумывать).
7. UI «Боковины» в админке / карандашах комнаты.
8. Связки с BOM/CFRN «накладка ≠ корпусный бок» (флаг роли).
9. Явного запрета/политики: overlay не наследует jointSchemes родителя.

**Явно не подходит как база боковин модуля:** EndCabinet, Section SideTrim, facade overlay торцевого шкафа, `scale`.

---

## 4. Риски

### Геометрия

- Удлинение только бока при горизонталях на `s:z` → консоль бока за задником; задник/полки не закрывают зазор до стены (обычно ок для «до стены», но визуал/пыль нужно принять).
- Накладка снаружи по X → конфликт с соседом / ячейкой / открыванием двери.
- `l_shape` / `c_l_shape` в buildWall — другой кейс (контур стенки); не смешивать с sidePanels без отдельного решения.
- `scale` на узле — запрещённый путь удлинения.

### Ячейки / стек глубины

- Путать удлинение бока с увеличением `carcassDepthMm` → сломает flush перед / соседние модули.
- Двойной учёт `rearOffsetMm` (shift группы + «+offset» в size.z без модели).
- EndCabinet/SideTrim reserve — не трогать в S2.

### Крепёж / присадка

- `seamLen: 550` запечён при D карточки; при D=460 или удлинении бока станции/число отверстий могут разъехаться с контактом полки.
- Baked `furniture` конфирматы с абсолютными именами/позами vs живые jointSchemes — риск дублей или устаревших дырок.
- Назначение «другой схемы» на один бок без проверки контакта торец/пласть — дырки не туда.
- Накладка с скопированными jointSchemes → лишний корпусной крепёж в CFRN.

### Данные / hydrate

- catalog_48 → live catalog_47: override на инстансе может затираться при повторной подгрузке корпуса, если хранить только в template корпуса, а не в instance overlay / userData модуля.

---

## 5. Минимальная модель данных (предложение)

Одна структура для админки и комнаты (instance override поверх карточки; карточка остаётся default `normal`):

```ts
// userData.sidePanels  ИЛИ  module.custom.sidePanels  ИЛИ  vars-driven prepare
sidePanels: {
  left: SidePanelSide,
  right: SidePanelSide,
}

SidePanelSide = {
  mode: 'normal' | 'overlay' | 'structural',
  // geometry
  depthMode: 'carcass' | 'to_wall' | 'custom',
  depthMm?: number,          // только custom; мм панели по Z
  // material (опциональный override)
  material?: { group: string, key: string } | null,
  // hardware / drill — раздельно от геометрии
  jointPolicy: 'inherit' | 'none' | { schemeId: number },
  // production
  layout_role?: 'side_overlay' | 'side_wall',  // для BOM / поиска
  sourceNodeId?: string,     // id штатного бока в дереве
}
```

**Семантика**

| mode | Геометрия | Крепёж |
|------|-----------|--------|
| `normal` | штатный бок, `size.z` корпуса | `inherit` (карточка) |
| `overlay` | **отдельная** деталь снаружи/поверх бока; штатный бок остаётся | накладка: `none`; штатный: `inherit` |
| `structural` | тот же узел бока, другой `size.z` / материал | `inherit` или явный schemeId **только из registry**; без новых схем |

**depthMode**

- `carcass` → `size.z = s:z` (как сейчас).
- `to_wall` → `size.z = carcassD + rearOffsetMm` (мм), якорь: перед бока = перед корпуса; зад → стена. Корпус D и `rearOffsetMm` группы не менять ради панели.
- `custom` → `depthMm`.

**Инварианты**

- Нет `scale` для геометрии.
- Overlay всегда производственная деталь (`wall`/`detail`), не «пустой» декоративный Object3D.
- Материал / геометрия / jointPolicy независимы.
- Л и П полностью независимы.
- Ширина ячейки / EndCabinet / SideTrim / DEPTH-стек корпуса — вне этой модели.

---

## 6. План S2 — самый маленький безопасный эксперимент (один пенал)

**Цель:** один прямой пенал; левая сторона «до стены»; правая обычная; проверить и overlay, и structural **по очереди** (не оба сразу на одном инстансе в первом прогоне).

**Фиксированные условия**

- D корпуса = 460, `rearOffsetMm` = 100, перед ≈ 560 (стек + offset как сейчас).
- Не трогать: DEPTH-3/4 ядро, Kitchen Brain, WallRun, Joint engine API, Vertical Rhythm, автосохранение, свет, материалы комнаты, EndCabinet, SideTrim, ширину ячейки.

**Шаги**

1. **Только данные / prepare (без UI):** на инстансе пенала `sidePanels.left = { mode, depthMode:'to_wall', jointPolicy }`, `right = { mode:'normal' }`.
2. **Прогон A — overlay:** добавить в дерево (после hydrate корпуса) дочернюю/соседнюю деталь `layout_role: side_overlay`, `size.z = carcassD + rearOffset`, толщина из материала, **без** `jointSchemes` и без furniture-крепежа. Штатный левый бок без изменения.
3. **Прогон B — structural:** изменить только левый `wall` `size.z` формулой/мм `to_wall`; материал опционально; `jointSchemes` оставить `inherit` **без смены schemeId** (если присадка визуально поедет — зафиксировать как риск, не чинить новой схемой).
4. **Проверки приёмки (да/нет):**
   - Правый бок = D корпуса; левый визуально до стены.
   - `rearOffsetMm` и D корпуса в userData не «удвоены».
   - W ячейки / соседние модули без сдвига.
   - Overlay: в списке деталей есть панель; корпусного крепежа на ней нет.
   - Structural: одна деталь бока, не два меша на одну сторону.
5. **Стоп S2** после фиксации результата (PASS/FAIL + скрин). Дальше — только новое задание.

**Вне S2:** UI «Боковины», смена схем присадки, оба режима сразу, НМ/навесы, накладка по X наружу.

---

## 7. СТОП

Отчёт S1 завершён. Исправлений и UI нет. Следующий шаг — только по отдельному заданию S2.
