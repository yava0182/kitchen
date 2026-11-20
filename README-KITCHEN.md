# Kitchen playground (эксперимент)

Корень на диске: **`D:\Clodis-Kitchen`**.

Шкафы: **`D:\Clodis-Wardrobes`** — сюда **не импортировать**.

npm package: `clodis-kitchen-playground`

Эталон кухни: `docs/kitchen_configurator_research_cursor.md`  
Что уже в коде: `docs/KITCHEN-DOMAIN.md`

## Порты (не пересекаются)

| | Шкафы | Кухня |
|--|-------|-------|
| Vite | 8000 | **8100** |
| API | 8001 | **8101** |

Запуск **только из этой папки**: `LAUNCH_SERVER.bat` или `npm run dev:all`.

- Комната: http://localhost:8100/
- Админка: http://localhost:8100/admin-new.html
- API: http://localhost:8101/

**Не** открывать шкафный URL `:8000` для кухни.  
**Не** рассчитывать, что `npm start` займёт 8000 — без `PORT` API кухни слушает **8101**.

Bat **не убивает** node шкафов — только порты 8100/8101.

## Cursor

Отдельное окно Cursor с корнем **`D:\Clodis-Kitchen`** (не общий workspace со шкафами).

## Git

Свой репозиторий, ветка `kitchen-playground`. Шкафы / `main` не трогается.

## Правила

1. Не копировать правки кухни обратно в шкафы «заодно».
2. Общий код — осознанный cherry-pick, не symlink из шкафов.
3. Для кухни — отдельный чат / корень Cursor на эту папку.
4. Размеры производства — только через `KitchenManufacturingProfile`, не «европейский стандарт» в хардкоде.
