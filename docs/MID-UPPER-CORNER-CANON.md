# MID верхний угол — канон Г-ячейки

Статус: **ucorner26** — пустая цельная Г-ячейка MID; угол = стык граней стен Joint (world/scene). Без ВМУ/НШ1/ghost/place.

## Модель

Одна логическая угловая ячейка на `Joint`:

- `shape: 'G'`
- плечо A (host) вдоль стены: **600 мм**, глубина **350 мм**
- плечо B (other) вдоль соседней стены: **600 мм**, глубина **350 мм**
- область пересечения общая, не дублируется
- стабильный id: `joint.upperCornerCellId`
- зеркальные L: `atStart` + направления плеч

Код: `seatKitchenJointUpperCorner`, `js/kitchen/kitchen-upper-g-cell.js`.

## Сетка MID

На каждом плече Joint — `special` ширина 600 у угла. Соседние обычные ячейки начинаются после 600.

Отрисовка: одна Г (`syncUpperGCellMeshes`), не два прямоугольника и не inset/companion.

## Пока запрещено в этой сессии

ВМУ, НШ1, ghost/drop, приставной, Г-шкаф, BASE/TOP/прямая/админка.

## Checkpoint

`_checkpoint_ucorner24_before_gcell_mid/`
