# MID верхний угол — канон (восстановить после wipe)

Статус: **rebuild ucorner21** — только seat A (приставной): 600×350 + post 40 на upper-host (предпочтительно left). Seat B ещё нет.

## Модель

Угловая ячейка MID 600×600 мм = два независимых посадочных места:

| Seat | Модуль | Стена |
|------|--------|--------|
| **A** | ВМУ (`kitchen_wall_corner`) | upper-host |
| **B** | НШ1 (обычный `kitchen_wall_mid`) | upper-other |

## Геометрия B

```
startB = actualCornerCabinetDepthMm + cornerStripWidthMm
```

Примеры: `350+40=390`, `300+40=340`.

Внутри 600 мм B занимает остаток; корпус НШ1 продолжается вдоль второй стены на ширину каталога.

## Правила

1. A и B могут быть заняты одновременно; занятость независима.
2. B — реальная цель размещения (ghost, canPlace, place, replace, delete, save), не «зелёная картинка».
3. Ghost и place — **один** resolver посадочного места.
4. Запрещено: redirect НШ1 с B в следующую обычную ячейку.
5. Не трогать BASE / TOP / прямую / конструкцию ВМУ / админку при порте заново.

## Checkpoint

`_checkpoint_ucorner19_before_upper_mid_delete/`
