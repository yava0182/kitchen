# Анализ вставки моделей шкафов в секции по всем стенам

## Требования
1. **Пивоты** (двух- и однодверные зоны) — у стены (на плоскости фасада секции)
2. **Глубина модуля** — ограничена глубиной секции

---

## Сводка по секциям

| Стена | Пивот секции | section.size | Ось зон | Пивот зоны у стены? | zoneSize (глубина) |
|-------|--------------|--------------|---------|---------------------|--------------------|
| **back** | left-back | x=ширина, z=глубина | X | ✓ pos.z = стена | ✓ z=size.z |
| **front** | right-back | x=ширина, z=глубина | X | ✓ pos.z = стена | ✓ z=size.z |
| **left** | back-left | x=глубина, z=длина | Z | ✓ pos.x = стена | ❌ z=size.z (должно z=size.x) |
| **right** | front-right | x=глубина, z=длина | Z | ✓ pos.x = стена | ❌ z=size.z (должно z=size.x) |

---

## Детали по каждой стене

### BACK (задняя) — работает
- **section.size**: x=ширина по X, y=высота, z=глубина в комнату (+Z)
- **sectionStart** (cabinet-markers): sectionPos.x + innerLeftOffset ✓
- **getZonePivotWorldPosition**: (snap.pivotCoord, pos.y, pos.z) — pos.z = задняя грань секции (у стены) ✓
- **zoneSize**: { x: partSize, y: sy, z: section.size.z } — z = глубина ✓
- **createSectionZones**: baseLocalZ=0 — зона у задней грани ✓

### FRONT (передняя) — проверить
- **section.size**: x=ширина, z=глубина в комнату (-Z)
- **sectionStart**: sectionPos.x - width + innerLeftOffset (пивот справа) ✓
- **getZonePivotWorldPosition**: (snap.pivotCoord, pos.y, pos.z) — pos.z = задняя грань секции (у стены) ✓
- **zoneSize**: { x: partSize, y: sy, z: section.size.z } — z = глубина ✓
- **createSectionZones**: baseLocalZ=-size.z — зона у задней грани ✓

### LEFT (левая) — ошибка zoneSize
- **section.size**: x=**глубина в комнату** (+X), z=**длина вдоль стены** (Z)
- **sectionStart**: sectionPos.z - depth + innerFrontOffset ✓
- **getZonePivotWorldPosition**: (pos.x, pos.y, snap.pivotCoord) — pos.x = стена ✓
- **zoneSize**: { x: partSize, y: sy, z: **section.size.z** } ❌  
  - Сейчас z=size.z = длина вдоль стены  
  - Нужно z=**size.x** = глубина в комнату
- **createSectionZones**: baseWidth=size.x, baseDepth=partSize — геометрия зоны верная ✓

### RIGHT (правая) — ошибка zoneSize
- **section.size**: x=**глубина в комнату** (-X), z=**длина вдоль стены** (Z)
- **sectionStart**: sectionPos.z + innerFrontOffset ✓
- **getZonePivotWorldPosition**: (pos.x, pos.y, snap.pivotCoord) — pos.x = стена ✓
- **zoneSize**: { x: partSize, y: sy, z: **section.size.z** } ❌  
  - Сейчас z=size.z = длина вдоль стены  
  - Нужно z=**size.x** = глубина в комнату
- **createSectionZones**: baseWidth=size.x, baseDepth=partSize ✓

---

## Исправления

### 1. zoneSize для left/right (furniture-ghost.js, furniture-manager.js)

**Проблема**: Для боковых стен zoneSize.z = section.size.z (длина вдоль стены), а должна использоваться глубина секции = section.size.x.

**Исправление**: Для left/right задавать zoneSize.z = section.size.x.

Места правки:
- `furniture-ghost.js`: строка ~255, ~487, ~594 — zoneSize при section.division
- `furniture-manager.js`: строка ~368–370 — sectionSize при zone

### 2. cabinet-markers: originPos для left/right

Для left: originPos = (backX, sectionPos.y, sectionStart). backX = sectionPos.x — это стена. sectionStart — вдоль Z. Маркеры должны выходить от стены — для left innerX = wallX + markerExtension. Проверить, что линия идёт от стены внутрь комнаты.

### 3. findSectionAtPosition

Для front: xMin = sectionPos.x - size.x, xMax = sectionPos.x ✓  
Для left: zMin = sectionPos.z - size.z, zMax = sectionPos.z ✓  
Для right: xMin = sectionPos.x - size.x, xMax = sectionPos.x ✓  
Логика границ в целом верная.

---

## Конвенция sectionSize/zoneSize для Furniture/Clodis

- **x** = ширина вдоль стены (вдоль оси разметки)
- **y** = высота
- **z** = глубина в комнату

Для back/front: ось разметки X → x=partSize, z=section depth ✓  
Для left/right: ось разметки Z → x=partSize, z=section depth = **section.size.x** (не size.z)
