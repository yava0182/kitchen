# Мёртвые копии админ-бандла (не в runtime)

Эти файлы **не подключены** в `admin-new.html`. Не править их вместо боевого кода.

Боевой путь:
- `js/admin/admin-new-bundle.js` — UI/каталог
- `js/admin/admin-preview-bridge.js` — mount + one-way iframe bridge

Не использовать в runtime:
- `admin-new-bundle-r4.js`
- `admin-new-main.js`
- `admin-new-part1.js` / `part2.js` / `part3.js`
- `public/js/admin/admin-new-*.js` (мёртвые копии; `sync-public-admin` не нужен)

Превью iframe монтируется **только** из `initConstructorTab` → `ensureClodisPreviewMounted` (вкладка «Конструктор»), не с «Основные».
