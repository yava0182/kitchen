# URL выгрузки из PlanPlace (до 15.12.2026)

База: `https://planplace.ru/clients/170399254/config/index.php`

## Критично для кухни

- `/catalog/items/catalog_shablony_korpusov` — шаблоны корпусов (JSON каждой карточки)
- `/catalog/items/tabletop` — модели столешницы
- `/catalog/items/tabletop_plinth` — плинтус столешницы
- `/catalog/items/cokol` — цоколь
- `/catalog/items/cokol_top` — световая рейка
- `/catalog/items/facades` — фасады
- `/catalog/items/handles` — ручки
- `/catalog/items/materials_keys` + material_* — плитка
- `/catalog/items/butts_keys` + butt_* — кромки
- `/catalog/item/default_settings/1` — настройки по умолчанию

## Остальное (если войдёт в продукт)

- materials (декоры), builtin, tech, interior, sinks
- `/constructor/`, `/constructor/prices/`, `/menu/`, `/users/`, API, js/css

Класть сырые JSON в `docs/pp-dump/` (`pp_<key>.json`).

Проверка наличия: `npm run dump:pp-checklist`.  
Инвентарь: `docs/PP-DUMP-INVENTORY.md`.  
Снято 2026-11-09: default_settings, tabletop, tabletop_plinth, cokol, cokol_top([]), handles, facades, materials_*, butts, catalog_shablony_korpusov (71), catalogs_keys.
