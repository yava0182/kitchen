# Кухонный домен CLODIS (kitchen-playground)

**Архитектура слоёв (A/B/C/D):** [`ARCHITECTURE.md`](./ARCHITECTURE.md) · smoke комнаты: [`SMOKE-ROOM-CHECK.md`](./SMOKE-ROOM-CHECK.md).

**Живой контракт правил посадки/глубины:** [`KITCHEN-RULES.md`](./KITCHEN-RULES.md) — дополняем по решениям, код следует документу.

Эталон сетки: [`kitchen_configurator_research_cursor.md`](./kitchen_configurator_research_cursor.md).

Шкафы (`Configurator-Clodis-ThreeJS-7`) не трогаем.

## Что сделано (фаза 1 — низ)

### 1. Эталон
Файл исследования европейских сеток лежит в `docs/`.

### 2. `KitchenManufacturingProfile`
| Файл | Назначение |
|------|------------|
| `js/kitchen/kitchen-manufacturing-profile.js` | Профиль, формулы, сериализация, аудит |
| `public/data/kitchen_manufacturing_profile.json` | Черновик `clodis_draft` v2 |

Формула низа:  
`worktopTopY = finishedFloorY + plinthHeight + baseCarcassHeight + worktopThickness`

В консоли комнаты/админки: `__cldKitchenProfileAudit()`

### 3. Роли размещения (кухонный конструктор)
| id | Подпись | Как садится | Ряд в колонне |
|----|---------|-------------|--------------|
| `kitchen_base` | Стол рабочий | фикс. высота | `base` + `kitchen_column` |
| `kitchen_base_gola` | Стол (Gola) | фикс. высота | `base` + `kitchen_column` |
| `kitchen_tall` | Пенал | по высоте секции | `full` (один) |
| `kitchen_wall_mid` | НШ1 (1-й ярус) | plinth+low+mid от пола | `base` + `kitchen_column`; D≈350 flush |
| `kitchen_wall_top` | Антресоль | к потолку | `upper` + `kitchen_column` |

В админке подписи только кухонные (без «тумба / шкаф»). Технический `baseKind` остаётся внутри движка.

#### Низ (стол)
| id | Режим фронта |
|----|--------------|
| `kitchen_base` | non_gola (ручки) |
| `kitchen_base_gola` | gola |

Поведение посадки = напольный фикс. высоты. Задаётся в карточке каталога → **Тип размещения** = «Стол рабочий напольный».

`kitchen_base_gola` не второй корпус: Gola — режим фасада позже. Первый стол собираем на `kitchen_base`.

### Стол рабочий — опоры (CAD-слои)

**Не путать каталоги:**

| Каталог | Роль |
|---------|------|
| **Модели 3D** (`cabinet_model`) | SKU ножки: GLB + цена + артикул (100 / 120 / 150 — три карточки) |
| **Цоколь** (`catalog_32`) | **Одна** зона `layout_role:plinth` (высота `h_bottom` / реф `__cokol_height`): внутри 4×`model`/`leg` + доска `plinth`/`cokol`. Не два соседних plinth-слота в пирамиде стола |
| Карточка стола (`kitchen_base`) | `data.kitchenSupports.modelsByHeightMm` — какие SKU допустимы; корпус один |

**Ближе к рефу (part5–7 legacy / part18–21 core_v2), без полного порта:** в столе один модуль `catalog_32`; `plinth`≈`cokol`, `leg`≈`model`; два `layout_role:plinth` подряд запрещены (выталкивают опоры по Y).

| Уровень | Что |
|---------|-----|
| Каталог корпуса | **1 артикул** (напр. 600×**720**×560), placement `kitchen_base` |
| Производство | `plinth.supportModelsByHeightMm` в manufacturing profile → `{100→2, 120→79, 150→80}` |
| Карточка модуля | `kitchenSupports` — override/допуск SKU по высоте |
| Проект кухни | `plinthHeightMm` ∈ {100,120,150} — один на весь нижний ряд |
| Комната | высота = корпус + опора; `h_bottom` = опора; `spec.id` опор = SKU из карты; цена = LDSP + Σ cabinet_model |

Смена опор поднимает ряд; корпус 720 не меняется. В дереве опоры = `type:model` + `v:h_bottom`.
**1:1 с админкой:** pos/size/pivot опор только из JSON конструктора (как PlanPlace `ModelCN2` + формулы).

```js
__cldKitchenManufacturing.setProjectPlinthHeightMm(120)
__cldKitchenManufacturing.resolveSupportCabinetModelBinding(120, module.kitchenSupports)
```

Сборка дерева: **один** `plinth` (опоры + доска внутри) → `corpus` → фасады. В админ-превью корень временно 720+опора; в карточке высота = корпус 720.

Список также в `room_steps_config.json` → `placementKindProfiles`.

### 4. Вертикальный срез низа (данные)
`__cldKitchenManufacturing.buildStraightBaseRunState({ frontMode, plinthHeight, baseCarcassHeight, worktopThickness, modules })`  
→ JSON с слоями цоколь/корпус/столешница + warnings (Gola без SKU и т.п.).

## Что сделано (фаза 2 — доборы §3.1)

### Типы
- `makeCeilingFiller` / `makeWallFiller` — отдельные сущности, не подрезка корпуса
- `computeTallStackWithCeilingFillerMm` — цепочка колонны к потолку
- `buildStraightTallRunWithFillers` — прямой ряд пеналов + L/R/Top доборы

Формула колонны:  
`plinth + tallCarcass + optionalTopUnit + installationClearance + ceilingFiller = measuredCeilingAtPosition`

Правило: корпуса на одном уровне; разный потолок на концах → клиновидный `CeilingFiller`.

Консоль:
```js
__cldKitchenManufacturing.buildStraightTallRunWithFillers({
  plinthHeight: 100,
  tallCarcassHeight: 2160,
  installationClearance: 20,
  ceilingHeightStartMm: 2500,
  ceilingHeightEndMm: 2530,
  leftWallFillerWidthMm: 100,
  rightWallFillerWidthMm: 100,
  modules: [{ id: 't1', widthMm: 600 }, { id: 't2', widthMm: 600 }],
})
```

Контрольный пример в audit: filler 220 мм слева / 250 мм справа по высоте при потолке 2500→2530.

### Параметры, пока требующие замера / утверждения производства
| Параметр | Статус |
|----------|--------|
| Сетка высот пеналов CLODIS | `manufacturer_required` (ориентир 2160 = `project_default`) |
| `installationClearance` | `manufacturer_required` |
| Высота/ширина заготовки добора | `manufacturer_required` (nobilia 100/200/230 — только `source_example`) |
| Материал добора carcass vs front | выбор проекта, технология — утверждение |
| Уплотнение у стены | не копировать U-профиль nobilia в BOM |
| Подрезка верхней панели / крепление | Schüller-ориентир плоскости; технология CLODIS |
| Ограничитель подъёмного фасада у потолка | [S17], после 3D-траекторий |
| `wallDeviationMm`, точный клиновидный контур | после замера на объекте |

`productionSpecAllowed: false` — концепт и ориентировочная цена, не карты раскроя.

## Шаг 1 (форма кухни)

Кухня — единственная комната. Шаг 1 = формы пространства как у IKEA (не тип комнаты).

## Шаг 1 — форма кухни (IKEA)

Комната одна: кухня. Шаг 1 = карточки форм (`enclosed_*` / `open_*`), не типы комнат.
`selectedRoomType.key` всегда `kitchen`.
Форма → footprint полигон (`room-footprint.js`) → `Room` пересобирается сегментами стен.
Открытые формы: сегмент `open:true` (стены нет), не fake-opening.
Вырез/срез угла — реальный контур пола и стены.

Файлы: `js/room/kitchen-room-shapes.js`, `js/room/room-footprint.js`, `Room.js` (`buildPolygonRoom`), `buildKitchenRoomShapeStep` / `recreateRoomWithShape` в `room-manager.js`.

## Пеналы — датамы + фасады (утверждено)

**Датамы кухни ≠ фасады.** Три слоя:

1. **Датамы** (ритм ряда): `low` = НМ, `mid` = столешка+зазор, `high` = НШ1  
   `tallCarcass = low + mid + high`. Антресоль отдельно. Столешки над пеналом нет (`hasWorktop: false`).
2. **Горизонты** — ровно 2 панели в корпусе (`Горизонтальная панель 1/2 ярус` в catalog_47) на стыках датамов; Y = `bandLow` и `bandLow+bandMid`. Wardrobe `shelfStack` для пенала **не** применяется.
3. **Фасады** с `spanDatums` — дверь может закрывать 1 или 2 датама (холодильник: mid+high одной дверью).

**Столешка у колонны:** overlay кладёт столешку/цоколь только на НМ (`kitchen_base` / gola / corner); пенал — барьер по U, прогон рвётся у бока колонны (`kitchen-run-overlays.js`). Рабочие столы (стек 10+корпус+40) не меняются.

**Посадка (одна плоскость = пивот секции, не bbox меша комнаты):**
- НМ: зад = секция+10, перед = секция+560, столешка от секции до +600 (+40 за корпусом);
- пенал: зад = секция+0, глубина 560, перед = перед НМ; в толщу стены не заезжать;
- столешка якорится только от пивота секции (не от bbox модулей);
- UI: пенал ≠ НМ (`isKitchenTallGroup`); без `resolveBaseCarcassDepthMm` для пенала.

**Высоты горизонтов** (от низа корпуса, без опор; дефолт профиля):

| Горизонт | Стык | Y мм | Смысл |
|----------|------|------|--------|
| `horizon_low_mid` | low/mid | **720** (`bandLow`; Gola **780**) | верх корпуса НМ |
| `horizon_mid_high` | mid/high | **1320** (720+**600**) / Gola **1380** | низ НШ1; mid **600 locked** |

Корпус пенала = low+mid+high = **720+600+720 = 2040** (Gola: **780+600+720 = 2100**). Столешка (12/38) внутри mid; clearance = 600−thickness. От пола: + цоколь (100/120/150).

См. [`KITCHEN-RULES.md`](./KITCHEN-RULES.md) §4.

### Роли

| Уровень | Поле / роль | Значение |
|---------|-------------|----------|
| Посадка | `placementKind` | `kitchen_tall` |
| Вид | `data.kitchenTall.facadeType` | `doors_3` \| `oven_mw` \| `fridge` |
| Полосы в дереве | `layout_role` | `tall_band_low` / `tall_band_mid` / `tall_band_high` (+ `plinth`) |

`layoutZones` из `resolveTallLayoutZonesMm` задаёт высоты полос. UI карточки: [`admin-catalog-kitchen-tall.js`](../js/admin/admin-catalog-kitchen-tall.js).

| Тип | span фасадов |
|-----|----------------|
| `doors_3` | low / mid / high |
| `fridge` | low ; mid+high одной дверью |
| `oven_mw` | ниши по высотам (черновик SKU) |

```js
__cldKitchenManufacturing.resolveTallKitchenDatumsMm({})
__cldKitchenManufacturing.resolveTallFacadeLayoutMm({ facadeType: 'fridge' })
__cldKitchenManufacturing.resolveTallLayoutZonesMm({ facadeType: 'doors_3', plinthHeightMm: 100 })
```


## Не сделано (следующие фазы)
- 3D-меши столешницы/цоколя/доборов по формуле (overlay-прогоны НМ уже есть; полный manufacturing mesh — позже)
- Навесы / техника / полный каталог пеналов
- Техзазоры между фасадами пенала
- Реальный PDF Gola-артикула
- Утверждение сетки производства CLODIS (`manufacturer_required`)
- Полный перевод дерева пенала на `tall_band_*` roles
