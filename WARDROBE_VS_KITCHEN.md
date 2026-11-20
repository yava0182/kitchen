# Шкафы vs кухни

| Продукт | Папка на диске | Порты | Git | npm name |
|---------|----------------|-------|-----|----------|
| Шкафы (основной) | **`D:\Clodis-Wardrobes`** | **8000** / **8001** | свой `.git`, ветка `main` | `configurator-clodis-threejs` |
| Кухни (эксперимент) | **`D:\Clodis-Kitchen`** (эта папка) | **8100** / **8101** | свой `.git`, ветка `kitchen-playground` | `clodis-kitchen-playground` |

Два независимых приложения: **отдельная папка, отдельный `node_modules`, отдельный сервер, порты не пересекаются.** Код между ними не импортировать.

## Запуск

| | Шкафы | Кухни |
|--|-------|-------|
| Запуск | `D:\Clodis-Wardrobes\LAUNCH_SERVER.bat` | `D:\Clodis-Kitchen\LAUNCH_SERVER.bat` |
| Комната | http://localhost:8000/ | http://localhost:8100/ |
| Админка | http://localhost:8000/admin-new.html | http://localhost:8100/admin-new.html |
| API | http://localhost:8001/ | http://localhost:8101/ |

Cursor: отдельное окно на **`D:\Clodis-Kitchen`**. Шкафы не открывать в том же workspace.
