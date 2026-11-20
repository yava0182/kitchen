# IKEA — трассировка «Выбрать готовый вариант» (AutoDesign)

Цель: понять **логику сборки вариантов 1…N**, а не гадать по скринам.

## Что уже известно из локалей / бандлов

- Шаг UI: `best_solutions` / «Choose the best solution».
- Нет решений → подсказка **удалить вывод воды** (`no_solution_1.message_delete_water_supply`)  
  ⇒ вода — жёсткий вход генератора.
- Нет места на стене → `no_solution_2`.
- В коде: `AutoDesignSolutionInfo`, `_linearManager`, экран `solution-loading`  
  (fridge → oven → sink → cabinet) — раскладка рядами («linears»).

Вывод: варианты **собираются**, а не лежат готовыми тысячами.

## Как отследить скриптом (в браузере)

1. Открой planner → комната + двери/окна + **вывод воды**.
2. F12 → Console → контекст frame **`Kitchen` / by.me** (не верхний iframe).
3. Вставь содержимое `scripts/ikea-console-autodesign-trace.js`.
4. Перейди на «Выбрать готовый вариант», кликай 1…8.
5. Выполни `window.__CLD_AD.dump()` и пришли JSON.

Скрипт пишет:

- сетевые `fetch`/`XHR` с solution/water/layout в URL или теле;
- клики по кнопкам вариантов;
- снимок `linearManager` / solutions / число мебели.

## Grep по уже скачанным JS

```bash
node scripts/ikea-grep-autodesign-js.mjs
```

Результат: `docs/ikea-kitchen-autodesign-dump/grep-hits.json`.

## Дальше (если нужно глубже)

- Playwright-дамп сети на шаге solutions (как `ikea-dump-kitchen-slope.mjs`).
- Breakpoint на методах `linearManager` после `dump()` (имена методов попадут в JSON).
