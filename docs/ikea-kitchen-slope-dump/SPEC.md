# IKEA Kitchen — скошенный потолок (из дампа JS/locale, не на глаз)

Источник: Playwright-дамп `scripts/ikea-dump-kitchen-slope.mjs` +
`scripts/ikea-extract-slope-model.mjs` + `scripts/ikea-find-slope-html.mjs`  
Артефакты: `docs/ikea-kitchen-slope-dump/`

## Запуск

```bash
node scripts/ikea-dump-kitchen-slope.mjs
node scripts/ikea-extract-slope-model.mjs
node scripts/ikea-extract-slope-overlay.mjs
node scripts/ikea-find-slope-html.mjs
```

## UI (из React JSX + ru-LV)

| Ключ | RU | EN |
|------|----|----|
| `sloped_ceiling.title` | Добавить скошенный потолок | Add sloped ceiling |
| `sloped_ceiling.subtitle` | Нажмите на стену… и введите необходимые размеры | Choose a wall… |
| `draw_plan_panel.add_sloped_walls` | Добавить скошенный потолок | Manage sloped ceilings |
| `common.create` / `common.cancel` | Создать / Отмена | Create / Cancel |
| overlay после создания | Изменить / Удалить | Change / Delete |

Панель (`mod-overlay-container-sloped-ceiling`):

- **A** — всегда отдельное поле (`#sloped-ceiling-a`)
- **B** + **C** — в блоке `.linked` с цепочкой; radio `sloped-ceiling-radio-b` **defaultChecked**, radio C
- Выбор radio включает своё поле, второе readonly (см. `ui.sloped-ceiling-overlay` в `app.js`)
- Схема: `figure.illustration` + hide/show schema
- Create: Cancel + Create; Edit: Remove

## Смысл A / B / C (translation-master)

> Measure **A**: height of the remaining wall after the ceiling slope  
> Measure **B**: floor area under the sloped ceiling  
> Measure **C**: angle of the ceiling slope

## Дефолты (из `SlopedCeilingEditor` vendor)

```
height (A) = 1300 mm   // imperial branch: 1270
depth  (B) = 1400 mm   // imperial: 1397
angle  (C) = 131 °
range: minB≈10, maxB=10000, minC=90, maxC=180
```

(фрагмент: `depth:n?1397:1400,height:n?1270:1300,angle:131`)

## Геометрия (из JSX)

```
C = URV.DepthToAngleForSlopedWall(wallHeight, B, A)
B = D77.AnglesToDepthForSlopedWall(wall, [[C, A]])
```

Связь B↔C: при правке A или B пересчитывается C; при правке C (radio C) пересчитывается B.

Проверка при H=2500, A=1300, B=1400:

`90 + atan((2500-1300)/1400)·180/π ≈ 130.6° ≈ 131°` → C = угол от вертикали стены к скосу.

Меш (остаток стены A у стены, глубина B в комнату до полной высоты H):

- у стены: y = A  
- на глубине B внутрь: y = H  
- клин объёма «среза» = то, что синим в 3D у IKEA

## Состояние / API в бандле

- `SlopedCeilingState` / `SlopedCeilingEditor`
- `_updateSlopedWall` / `_updateTopFaceSimulation` (3D preview)
- `getSlopeSingleFace2DA`, `getBaseHeightOneSlope`, `_getDirectionOfSlope`
- 2D: иконка на стене; клик → overlay Change/Delete или edit panel

## Поток UX (из кода, не скрина)

1. Режим draw plan → tool sloped ceiling (можно стартовать в 2D).
2. Клик по стене → overlay A/B/C + live preview (`_updateSlopedWall` / top face sim в 3D).
3. **Создать** → commit; дальше на стене overlay Изменить/Удалить.
4. Верхний OK/validate — сохранение плана (отдельная кнопка шага), не дубль Create.
