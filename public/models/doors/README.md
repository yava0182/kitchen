# Двери (GLB)

Пул **собственных** моделей дверей КЛОДИС для комнаты.

## В каталоге

| Файл | Карточка | Размер ≈ |
|------|----------|----------|
| `clodis_door_fluted.glb` | Дверь фрезерованная | 95×207×7 см, ~248 КБ |

Материалы в GLB: `CLODIS_Door`, `CLODIS_Frame`, `CLODIS_Groove`, `CLODIS_Black` (solid, без чужих карт).

## Лицензия

Только свои ассеты КЛОДИС. Маркетплейс (Zeel и т.п.) — не в публичный конструктор без письменного OK.

## Конвертация

```powershell
cd D:\Configurator-Clodis-ThreeJS-24\Configurator-Clodis-ThreeJS-7
.\tools\opening-to-glb.ps1 "C:\Users\Admin\Downloads\СВОЯ-дверь.rar" -Type door -Name my-door -NoSplit
```
