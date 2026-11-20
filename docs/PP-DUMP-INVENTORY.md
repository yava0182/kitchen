# PP dump inventory (W1)

**Снято:** 2026-11-09 из ЛК `https://planplace.ru/clients/170399254/config/` через `catalog/items_get/*` (сессия в Chrome).  
**Кладём сырьё в:** `docs/pp-dump/pp_*.json`  
**Рабочий каталог Clodis:** `catalog_items/` (не затирать слепым копированием без критерия).  
**Проверка:** `npm run dump:pp-checklist`

Источник URL: [scripts/pp-dump-urls.md](../scripts/pp-dump-urls.md).

## Kitchen-critical

| Цель | PP dump | Уже в catalog_items | Статус |
|------|---------|---------------------|--------|
| default_settings | `pp_default_settings.json` + `pp_default_settings_parsed.json` | — | **DUMPED** (раньше MISS) |
| tabletop | `pp_tabletop.json` (52) | `tabletop_items.json` | DUMPED + local |
| tabletop_plinth | `pp_tabletop_plinth.json` (1) | — | **DUMPED** (раньше MISS) |
| cokol | `pp_cokol.json` (5) | `cokol_items.json` | DUMPED + local |
| cokol_top | `pp_cokol_top.json` (`[]`) | — | DUMPED empty (в PP аккаунте пусто) |
| handles | `pp_handles.json` (64) | `handles.json` | DUMPED + local |
| facades | `pp_facades.json` (83) | `facades.json` | DUMPED + local |
| materials_keys | `pp_materials_keys.json` | `materials_keys.json` | DUMPED + local |
| butts / edges | `pp_butts_keys.json`, `pp_butt_butts.json` | `butt_butts.json`, `edges_keys.json` | DUMPED + local |
| шаблоны корпусов | `pp_catalog_shablony_korpusov.json` (71) | `reference_catalog_shablony_korpusov.json` | DUMPED + local ref |
| catalogs_keys | `pp_catalogs_keys.json` (33) | `docs/pp-dump/clodis-catalogs_keys.json` | DUMPED |

## Materials pass

| Ключ | Файл | Кол-во |
|------|------|--------|
| material_ldsp | `pp_material_ldsp.json` | 317 |
| material_hdf | `pp_material_hdf.json` | 320 |
| material_m4 | `pp_material_m4.json` | 52 |
| glass | `pp_glass.json` | 9 |
| butt_butts | `pp_butt_butts.json` | 323 |
| materials (master) | не файл (7003 / ~2.4MB) — брать по типам выше; endpoint `items_get/materials` | optional |

## Пусто в этом PP-аккаунте (items_get → `[]`)

`module`, `decors` (GOLA templates), `opory`, `door`, `profil_gola`, `drawer_templates`, `Sushki`, `butylochnitsy`, ключ `shablony_korpusov` (данные лежат под `catalog_shablony_korpusov` / файл `pp_catalog_shablony_korpusov.json`).

Не блокирует kitchen-critical dump: шаблоны корпусов уже сняты 71 шт.

## Как доснимать вручную (пока жив ЛК до 15.12.2026)

1. Открыть ЛК PP (залогинен).
2. В DevTools Console на origin `planplace.ru` / config:

```js
const base = 'https://planplace.ru/clients/170399254/config/index.php';
const key = 'NAME';
const j = await (await fetch(base + '/catalog/items_get/' + key, { credentials: 'include' })).json();
console.log(key, Array.isArray(j) ? j.length : j);
copy(JSON.stringify(j, null, 2));
```

3. Сохранить в `docs/pp-dump/pp_<key>.json`.
4. `npm run dump:pp-checklist`.

Скрин+JSON вкладок свойств (wall / tabletop / cokol / facade / module) — отдельный слой W1/W3 по необходимости; сырые списки критичны первее.
