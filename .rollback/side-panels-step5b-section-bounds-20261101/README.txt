Rollback STEP 5B (section bounds / worktop overflow).
Bust: ?v=20261101-side5b3

Причина бага: при overlay НМ корпус = s:x = ширина ячейки, extendWorktop делал столешку s:x+16/32 → габарит ячейка+pad за границу WallRun.

Исправление: НМ/НШ within-cell — корпус = ячейка−pad, столешка s:x+pad = ячейка; секцию не удлиняем. Пенал 5A без изменений (ячейка растёт через balancer).

Откат 5Б → состояние после 5А:
  copy from .rollback\side-panels-step5a-tall-overlay-footprint-20261101\
Снимок после 5Б (текущие файлы этого шага): js__* и index.html в этой папке.
