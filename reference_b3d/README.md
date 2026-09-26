# Эталонный экспорт Bazis (.b3d)

| Поле | Значение |
|------|----------|
| Файл | `model.b3d` |
| Путь | `D:\Configurator-Clodis-ThreeJS-20\Configurator-Clodis-ThreeJS-7\reference_b3d\model.b3d` |
| Шкаф | «Шкаф 1-ый с антресолью дверь в пол», **400×2600×400** |
| JSON (корень) | `planplace-cabinet-antresol-dver-v-pol.json` |
| Модули каталога | **89** корпус, **88** антресоль, **18** дверь АТ, **16** дверь основная, **90** добор |
| Манифест | `REFERENCE_MANIFEST.json` |
| Импорт JSON | `node tools/import-reference-planplace-json.mjs --id 88 --in file.json` |
| Реф-код экспорта | `constructor_code_reference/main_core_v2_part12_deobfuscated.js` → `exportToCFRN` |

## Добор (id 90)

Сохранить JSON из PlanPlace:

```bash
node tools/import-reference-planplace-json.mjs --id 90 --name shablony_korpusov --in path/to/dobor.json
```

Как PlanPlace отдаёт добор в Bazis: `docs/REFERENCE_DOBOR_BAZIS_EXPORT.md`.

## Сборка в комнате (эталонный каталог)

1. Запустите сервер, откройте комнату с параметром **`?refCatalog=1`** (или `localStorage.__CLD_REF_CATALOG = '1'` + Ctrl+F5).
2. В консоли:
   ```js
   await __cldLoadReferenceCatalog()
   await __cldPreviewReferenceCabinet()
   ```
   Появится шкаф **400×2600×400** в сцене; модули **88/89/16/18** подставятся из JSON при гидратации `ClodisBuilder`.

3. Постоянный импорт в `catalog_items/`:
   ```bash
   node tools/seed-reference-catalog.mjs
   ```
   Скрипт выведет строки для `localStorage` (`catalog_shablony_korpusov`, `catalog_dveri_shkaf`, `catalog_26`).

4. После правок каталога в админке — снова **удалить и поставить** шкаф в комнате (кэш сборки).

## Сверка

```bash
node tools/inspect-b3d.mjs reference_b3d/model.b3d
node tools/inspect-b3d.mjs path/to/our_export.b3d
```

Код рефа экспорта: `constructor_code_reference/main_core_v2_part12_deobfuscated.js` → `exportToCFRN`.
