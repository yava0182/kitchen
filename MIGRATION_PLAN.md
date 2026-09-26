# План миграции: один движок (Clodis) и замена Clodis → Clodis

Референсный движок только для чтения; в конце проекта папку рефа удалить. К рефу ничего не привязываем.

---

## Текущее состояние движков (актуально)

**Какой движок сейчас работает в админке:** один — **Clodis** (clean-room).

| Что | Роль | Используется в админке? |
|-----|------|--------------------------|
| **constructor-clodis.html** + **src/constructor-clodis.js** | 3D-превью в iframe (секции, детали, фасады, модули) | ✅ **Да** — при открытии вкладки «Конструктор» поднимается iframe с этим движком. |
| Дерево в админке (слева) | DOM + `admin-constructor.js` (`loadConstructorTreeFromJSON`, `getConstructorTreeJSON`, `__ppBuildClodisTemplateTreeFromDom`) | ✅ **Да** — одно дерево, один источник данных (`rootModule.nodeData.clodisJSON` + DOM). |
| Сохранение | Vue `saveItem` → `getConstructorTreeJSON()` → `constructor_structure` в API | ✅ **Да** — данные берутся из того же дерева/движка. |

**Не используются в основном сценарии (редактирование элемента каталога):**

| Что | Зачем |
|-----|--------|
| **constructor-clodis.html** + **src/constructor.ts** | Отдельная страница (можно открыть напрямую); в админке iframe не подключает её. |
| **constructor.html** | Закомментирован в `vite.config.ts`, не собирается. |
| **constructor-clodis-preview.html** | Упоминается только в комментариях; нигде не подключается. |
| **constructor_code_reference/** | Только чтение: стили, `get_settings_ajax.json`, опционально `common_functions.js`. Не движок. |
| **planplace_refs/** | Статика: Vue, jQuery, Three.js, CSS. Не движок. |

**Итог:** в сценарии «открыл элемент каталога → Конструктор → дерево + 3D» работает **один движок** — Clodis (constructor-clodis.html + constructor-clodis.js). Переносить с «других движков» в этом потоке больше не нужно; остальное — отдельные страницы или референс.

---

## Этап 1. Новый движок (TS) — единственный источник дерева и данных

- **1.1** При загрузке элемента каталога (`loadCatalogItemData`) не вызывать `loadConstructorTreeFromJSON(constructor_structure)` — убрать дублирование дерева от старого JS.
- **1.2** При загрузке сохранять в `rootModule.nodeData` и в item: `clodisJSON` (если есть с API) и `constructor_structure` (для обратной совместимости).
- **1.3** В `__ppSyncPreviewToIframe`: брать дерево из `rootModule.nodeData.clodisJSON` или `rootModule.nodeData.constructor_structure`; если только `constructor_structure` — отправлять в iframe, TS конвертирует и отрисует дерево через `renderConstructorTreeFromClodisJSON`.
- **1.4** В iframe при получении `cld:setTemplateTree` с объектом (legacy `constructor_structure`) — конвертировать в clodisJSON и строить 3D + дерево.

---

## Этап 2. Сохранение только из нового движка

- **2.1** При сохранении элемента каталога брать `clodisJSON` из TS (iframe): по postMessage запрашивать у iframe экспорт `exportClodisJSONFromScene` или использовать уже сохранённый в `currentEditingCatalogElement.clodisJSON` после синхронизации.
- **2.2** В `dataToSave` передавать `clodisJSON` (и при необходимости для совместимости оставить запись в `constructor_structure` из того же JSON, либо убрать со временем).
- **2.3** Шаблоны, вкладка JSON, переменные — привязать к одному источнику правды (clodisJSON / TS).

---

## Этап 3. Замена Clodis → Clodis в коде

- **3.1** Во всём проекте (кроме папок `planplace_refs`, `constructor_code_reference`) заменить пользовательские строки и комментарии: «Clodis» → «Clodis» или «референс» где это название продукта/интерфейса. ✅ Выполнено в admin-new.html и src/constructor.ts (комментарии и подписи).
- **3.2** Имена переменных/ключей API (например `clodisJSON`) оставлены для совместимости формата данных; при желании можно переименовать в `clodisJSON`/`moduleJSON` отдельным проходом.
- **3.3** Файлы/страницы с именем Clodis в названии (например `admin-clodis-preview-mount.js`) при необходимости переименовать в Clodis и обновить ссылки.

---

## Этап 4. (В конце проекта) Удаление рефа

- Перенести вендоры и JSON-данные из `planplace_refs` в проект (см. предыдущий разговор).
- Удалить папки `planplace_refs` и `constructor_code_reference`.

---

## Порядок выполнения

1. Этап 1 — выполнить первым (дерево и данные только от TS).
2. Этап 2 — следом (сохранение из TS).
3. Этап 3 — замена названий Clodis → Clodis.
4. Этап 4 — в конце проекта.
