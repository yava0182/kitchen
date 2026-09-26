# Стабильность Cursor — как избежать вылетов

## Причины вылетов в этом проекте

1. **admin-new.html — 22 000+ строк** — очень большой файл
2. **constructor.ts — 17 000+ строк** — очень большой файл
3. **Папка Cursor ~11 ГБ** — state.vscdb 5+ ГБ, кэш AI, логи
4. **Индексация** — Cursor индексирует весь проект для AI (даже без открытых вкладок)

## Что уже сделано

1. **`.cursorignore`** — исключает admin-new.html, constructor.ts, node_modules, planplace_refs и др.
2. **`.vscode/settings.json`** — cursor.indexing.exclude, editor.largeFileOptimizations

---

## Что сделать вручную (по порядку)

### Шаг 1: Открыть только папку проекта (меньше индексации)

Вместо `d:\Configurator-Clodis-ThreeJS-13` откройте:

```
d:\Configurator-Clodis-ThreeJS-13\Configurator-Clodis-ThreeJS-7
```

**File → Open Folder** (или Ctrl+K Ctrl+O) — выберите папку `Configurator-Clodis-ThreeJS-7`.

Меньше файлов = меньше индексации и меньше нагрузка.

---

### Шаг 2: Очистить кэш Cursor (освободит ~5+ ГБ)

**Закройте Cursor полностью**, затем выполните:

```powershell
cd "d:\Configurator-Clodis-ThreeJS-13\Configurator-Clodis-ThreeJS-7"
.\clean-cursor-cache.ps1
```

---

### Шаг 3: Обнулить чаты (ускоряет AI на 80–90%)

Удалите папку с историей чатов:

```
%APPDATA%\Cursor\User\workspaceStorage\*\chat-sessions
```

Или в Cursor: **File → Preferences → Cursor Settings** → **Chat** → **Clear chat history**.

---

### Шаг 4: Запуск без расширений (проверка)

Если Cursor всё ещё тормозит — проверьте, не виноваты ли расширения:

```powershell
cursor --disable-extensions
```

Откройте папку проекта. Если стало работать быстрее — отключайте расширения по одному в Cursor.

---

### Шаг 5: Отключить индексацию (в Cursor)

**File → Preferences → Settings** (Ctrl+,) → поиск:

- **Cursor:** Indexing — включить **Off** или **Minimal**
- **Cursor:** Indexing — **Update Interval** — поставить 3600 (раз в час)

---

### Шаг 6: Жёсткий сброс (если ничего не помогает)

**Закройте Cursor полностью.** Удалите:

```
%APPDATA%\Cursor\User\globalStorage\state.vscdb
%APPDATA%\Cursor\User\globalStorage\state.vscdb.backup
```

**Внимание:** потеряете историю открытых файлов, но не код и настройки.

После этого запустите Cursor. Индекс пересоздастся при первом запуске.

---

## Системные ресурсы

- Закройте лишние приложения (браузер, другие IDE)
- Желательно 8–16 ГБ RAM
- Перезапускайте Cursor раз в день при длительной работе
