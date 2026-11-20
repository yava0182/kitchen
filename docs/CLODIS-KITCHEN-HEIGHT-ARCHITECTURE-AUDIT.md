# CLODIS — аудит логики высоты кухонных модулей

**Дата:** 2026-10-30  
**Режим:** только исследование. Код не изменялся.  
**Источники:** `kitchen-manufacturing-profile.js`, `kitchen-base-engine.js`, `furniture-manager.js`, `scene-icons.js`, `room-manager.js`, `ikea-room-fixture.js`, контракты `KITCHEN-RULES.md` / `KITCHEN-DOMAIN.md` / `CLODIS-KITCHEN-WALL-MODULES-AUDIT.md`.

---

## 1. Высота комнаты

| Вопрос | Ответ (**код**) |
|--------|-----------------|
| Где задаётся | Дефолт `ROOM_HEIGHT = 2500` мм (`state.js`). UI: `#room-height-input` (см) → `updateRoomDimensions` / `recreateRoomWithShape` → `new Room(..., height)`. |
| Влияние на кухню | Manufacturing читает `state.room.height` через `getRoomHeightMm`. При `kitchenToCeiling` выбирается пара НШ1/НШ2 из {960,920,860} + half, чтобы `plinth+low+mid+H1+H2 ≤ roomH`. |
| Что считается автоматически | `bandHighMm` / `bandTopMm` (если режим «в потолок»); `slackToCeilingMm`; при нехватке места — legacy 720/360. Ceiling filler — отдельная сущность, не подрезка корпуса. |
| При смене высоты комнаты | Пересборка комнаты + `applyKitchenCeilingTiersToScene()` (пересчитать ярусы/посадку под новый roomH). Корпуса НМ (`bandLow`) и mid **не** меняются от roomH; меняется выбор high/top и Y колонки через датамы. |

Управляющий параметр комнаты: **`room.height`**.  
Производные для кухни: выбор wall tiers, slack, вызов ceiling tiers на сцене.

---

## 2. Таблица высот по типам модулей

**Тип модуля → Источник высоты → Кто управляет → Ограничения → Rebuild → Save/Restore**

| Тип | Источник H корпуса | Кто управляет | Ограничения | Rebuild / Y | Save/Restore (Stage2–3) |
|-----|-------------------|---------------|-------------|-------------|-------------------------|
| **НМ** (`kitchen_base` / gola) | `carcassHeightMm` профиля: **720** / Gola **780** | Проект / тип размещения (Упр. комнатой 2), не карандаш «Высота» | Фикс. высота корпуса; опоры отдельно | Place/rebuild sizing → stamp; Y = пол + snap цоколя | `clodis*` + stamps; `customHeightMm` обычно = H корпуса; **UI высоты кухни нет** |
| **НШ1** (`kitchen_wall_mid`) | `bandHighMm` (в потолок: 860/920/960, иначе legacy 720) | Ритм + roomH (pick) | Низ = plinth+low+mid; не UI clearance | Rebuild W/D; Y всегда `resolveKitchenWallMidPlaceSizing.floorClearanceMm` | Collect: stamps/`customHeightMm`/clodis; restore: rebuild из roots + snap Y от датамов |
| **НШ2** (`kitchen_wall_top`) | `bandTopMm` (часто H1/2) | Ритм + roomH | Низ = plinth+low+mid+high; **не** сажать от потолка как wardrobe `wall_hung_high` | Аналогично mid; Y от `resolveKitchenWallTopPlaceSizing` | То же |
| **Пенал** (`kitchen_tall`) | `bandLow+bandMid+bandHigh` (= tallCarcass) | Датамы кухни | Не высота ниши до потолка; цоколь отдельно | Place sizing; горизонты на стыках датамов | clodis + sizing stamps |
| **НМУ** (угл. низ) | Как НМ по H корпуса | Ритм колонки / joint host | Угол — Joint/seat; H не свободный UI | Corner + base rebuild | Stage2: lShape/joints **metadata**; H как у НМ в clodis |
| **ВМУ** (угл. верх) | Как НШ по ярусу | Ритм mid/top | Не scale-geometry в persistence | Upper corner cell | Restore угла неполный без seat (**вне высоты**) |

**Цоколь / опоры:** `plinthHeightMm` ∈ {100,120,150} на проект. Меняет **Y всей колонки**, не H корпусов (контракт `KITCHEN-RULES` §4).

---

## 3. Вертикальная архитектура (ритм)

### Управляющие параметры

| Параметр | Роль | Типичный дефолт |
|----------|------|-----------------|
| `plinthHeightMm` | опоры / `h_bottom` | 100 / 120 / 150 |
| `bandLowMm` | корпус НМ | 720 (gola 780) |
| `bandMidMm` | верх НМ → низ НШ1 (столешка **внутри**) | **600** (locked в профиле) |
| `bandHighMm` | корпус НШ1 | pick 860/920/960 или 720 |
| `bandTopMm` | корпус НШ2 | H1/2 или 360 |
| `worktopThicknessMm` | внутри mid | 38 |
| `room.height` | лимит pick «в потолок» | 2500 |

### Вычисляемые

| Производное | Формула / смысл |
|-------------|-----------------|
| `clearanceAboveWorktopMm` | `bandMid − worktopThickness` |
| Низ НШ1 | `plinth + bandLow + bandMid` |
| Низ НШ2 | `plinth + low + mid + high` |
| H пенала | `low + mid + high` |
| `slackToCeilingMm` | `roomH − (ниже + high + top)` |
| Сетки BASE/MID/TOP | **ширины** ячеек по поясам, не независимые «высоты шкафа» |

### Привязки

- **Пол:** НМ / пенал — snap к полу + plinth.  
- **Потолок:** не режет корпус; filler отдельно; НШ2 не якорится к потолку wardrobe-логикой.  
- **Ячейки:** задают **ширину** зоны; высота корпуса — из датамов/артикула, не из «высоты ячейки» как свободного UI.

Схема (контракт):

```
пол
 └── plinth
      └──[bandLow НМ]──┬──[bandMid]──┬──[bandHigh НШ1]──┬──[bandTop НШ2]
                       │ столешка     │
                       └──────────────┘
```

---

## 4. Почему пользователь не меняет высоту отдельных кухонных шкафов свободно

1. **Карточка step4** показывает поле «Высота модуля» только если `isStandaloneFloorModule` / `behavior.fixedHeight` (**код** `scene-icons.js`: высота в разметке под `isStandaloneFloorModule`).  
2. Для кухни `tryApplyHeightVal` сразу `return true`, если **не** standalone — apply высоты не вызывается.  
3. `applyModuleCustomHeightCm` разрешён для `standalone_floor` и wardrobe `wall_hung_*`, но **не** как основной путь НМ/НШ/пенал (кухня идёт через manufacturing sizing).  
4. НШ не показывают «Отступ от пола» — Y из ритма; залипший clearance перезаписывается при snap (**код** `snapFurnitureGroupPlacementY`).

Это **намеренная архитектура** колонки (см. `KITCHEN-RULES.md` §4, `KITCHEN-DOMAIN.md`): согласованность НМ ↔ пенал ↔ НШ1 ↔ НШ2 и «в потолок» от roomH.

### Механизмы согласованности

- Один `kitchenProject` (plinth, mid, frontMode, worktopDepth).  
- `resolveTallKitchenDatumsMm` / `resolveKitchenWallTiersToCeilingMm`.  
- Place/rebuild пишут stamps `__kitchenBand*Mm`, carcass H.  
- `snapFurnitureGroupPlacementY` для mid/top всегда от manufacturing.  
- Смена опор двигает колонку целиком без смены H корпусов.

---

## 5. Сохранение и dirty `module_height` (Stage5)

| Вопрос | Вывод |
|--------|--------|
| Сохраняется ли H кухни | Да косвенно: `clodisRoots/Data/Variables`, stamps sizing, `kitchenProject` (plinth, bandMid…). `customHeightMm` в collect есть. |
| Restore | Furniture из roots; hydrate project; snap Y от датамов. Отдельного «height rebuild API» для кухни не требуется, если дерево/vars согласованы. |
| Нужен ли dirty `module_height` для **кухни** | **Практически нет** для НМ/НШ/пенал: UI высоты для них не активен. Хук срабатывает на **standalone / шкафной** высоте (`finishHeightApply` / `applyModuleHeightCm`). |
| Удалять хук? | **Не удалять** в рамках этого аудита: он полезен для не-кухонных модулей и безвреден (кухня его почти не вызывает). Менять autosave из‑за «общей логики комнаты» **не обязательно**. |
| Dirty от room height / plinth | Сейчас: `room_dimensions` / `room_shape` (Stage5). Смена **только** plinth в manufacturing UI — проверить отдельный dirty (**вне** таблицы Stage5 P0/P1); если нет — риск до другого dirty. |

Ошибок «кухня должна давать свободную высоту каждому шкафу» в коде **не видно** — это продукт-канон, не баг autosave.

Реальные зоны внимания (не правки сейчас):

1. Restore L/НМУ без seat — не про H.  
2. После смены roomH — нужен успешный `applyKitchenCeilingTiersToScene` (уже вызывается из room-manager).  
3. `customHeightMm` на НШ после restore vs пересчёт H из нового roomH: если юзер сменил roomH **после** save, re-place/tiers обновляют; чистый restore без смены room — stamps из файла.

---

## 6. Ответы на итоговые вопросы

1. **Почему нельзя свободно менять высоту шкафов?** Потому что кухонная колонка — общий ритм датамов; UI высоты включён для standalone (и родственных fixedHeight), не для kitchen_base/wall/tall.  
2. **Намеренно?** Да — зафиксировано в `KITCHEN-RULES` / manufacturing bandModel.  
3. **Согласованность:** plinth + bands + ceiling pick + snap Y + project state.  
4. **Ошибки, требующие фикса высоты?** По коду — нет обязательного бага «высота сломана»; ограничения — by design. Отдельно: неполнота restore угла (не высота).  
5. **Менять автосохранение?** Не обязательно ради кухни. `module_height` оставить для standalone; для кухни критичны dirty на room size/shape, place/rebuild, plinth/project (если UI меняет без существующих хуков — точечно добавить позже).

**Новые возможности свободного редактирования высоты кухонных модулей этим аудитом не предлагаются.**

---

*Конец аудита высоты.*
