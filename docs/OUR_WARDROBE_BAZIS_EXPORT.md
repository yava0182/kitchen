# Наш шкаф (catalog_26) → экспорт в Bazis

Ваш JSON (корень `layout_role: cabinet_root` + модули catalog_32/27/30/28) **достаточен** для экспорта 1:1 с Clodis **если** 3D в комнате совпадает с превью в админке. Bazis не читает JSON — только ZIP **CFRN**, собранный из **уже построенной сцены**.

## Цепочка (как у рефа)

```
clodisJSON (шкаф в комнате)
  → ClodisBuilder.buildFromJSON + гидратация catalog_27/28/30/32
  → THREE.Scene (меши + userData.__cldCfrnSizeMm, layoutRole)
  → bazis-cfrn-export.buildCFRNZip()
  → file.json + models/*.stl
  → API Bazis → model.b3d
```

Референс: `constructor_code_reference/main_core_v2_part12_deobfuscated.js` → `exportToCFRN`.

## Ваш JSON → что должно оказаться в CFRN

| Узел JSON | `layout_role` | В сцене | `objType` |
|-----------|---------------|---------|-----------|
| Секция (корень) | `cabinet_root` | Группа шкафа | **7** |
| Модуль catalog_32 | `plinth` | Module_Цоколь + стенки шаблона | **7** + панели **2** |
| Модуль catalog_27 | `corpus_antresol` | Module_Корпус + ЛДСП | **7** + **2** |
| Модуль catalog_30 | `top` | Module_Антресоль | **7** + **2** |
| Модуль catalog_28 (id 8) | `facades_main` | Module_Фасад + ядро фасада | **7** + **2** |
| Модуль catalog_28 (id 7) | `facades_top` | Module_Фасад антресоль | **7** + **2** |
| Петли / model / присадка внутри шаблонов | — | GLB или holes | **5** |

Переменные комнаты (`v:h_bottom`, `v:corpus_antresol_mm`, `v:facade_thickness_mm`) должны быть заданы при сборке так же, как в админке (400×2700×600 на скрине).

## Что было не так у нас (и исправлено)

| Проблема | Симптом в Bazis | Исправление |
|----------|-----------------|-------------|
| `getFurnitureSectionChain` смотрел только `isSection` | Плоский шкаф без Цоколь/Корпус/Фасад | Учитываем `layoutRole` на `Module_*` |
| Модули без `isSection` | То же | `buildModule` помечает оболочку модуля |
| Стенки `isDetail` не всегда в экспорте | Не хватает панелей | `isExportableMesh` + `shouldTreatAsPanel` по `__cldCfrnSizeMm` |
| Фасад `*_core` | Нет фасада в CFRN | `isFacade` + `_core` → objType **2** |
| Саморезы/модели | Смещение в Bazis | `matrixWorld16` на `isCabinetModel` |

## Что ещё может мешать 1:1 (не JSON)

1. **Сборка комнаты ≠ админка** — другие `layoutZones`, старый кэш: удалить шкаф, Ctrl+F5, поставить снова.
2. **Каталог не выгружен** — модули с `live_catalog` и пустыми `children` без `template_tree` в `localStorage` / `__CLD_CATALOGS_DATA` не развернутся.
3. **Петли** — по умолчанию мелкие STL-плейсхолдеры не пишутся; присадка — `holes` в objType **5**; полные GLB: `window.__CLD_CFRN_EXPORT_HINGE_MESH = true`.
4. **Эталон model.b3d** — от другого шкафа Clodis (400×2600×400, модули 88/89/16/18). Сверять с **вашим** экспортом после фиксов, не с чужим b3d.

## Проверка в комнате

1. Поставить шкаф, убедиться что 3D как на скрине админки.
2. Экспорт в Bazis (кнопка в UI).
3. В консоли смотреть `[CFRN] panel "..."` и `[CFRN] model "..."` — должны быть цоколь, корпус, фасады, петли.
4. Опционально: `window.__CLD_DUMP_CFRN_PANELS = true` перед экспортом — позиции панелей.
5. `node tools/inspect-b3d.mjs path/to/export.b3d`

## Ответ на «хватит ли JSON»

**Да** — для вашего шкафа JSON описывает правильную пирамиду модулей. 1:1 с Clodis = **та же геометрия в сцене** + **тот же алгоритм CFRN** (objType 2/5/7, матрицы, контуры). Эталон добора (id 90) — отдельный кейс для сверки фурнитуры; ваш шкаф собирается из catalog_26 и экспортируется тем же `bazis-cfrn-export.js`.
