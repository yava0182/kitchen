# PowerShell скрипт для проверки прогресса рефакторинга
# Использование: .\check-refactoring-progress.ps1

Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Проверка прогресса рефакторинга Configurator Clodis  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Проверка основного main.js
Write-Host "📊 Анализ исходного кода:" -ForegroundColor Yellow
Write-Host ""

$mainJsPath = "js\main.js"
if (Test-Path $mainJsPath) {
    $mainLines = (Get-Content $mainJsPath | Measure-Object -Line).Lines
    $mainSize = [math]::Round((Get-Item $mainJsPath).Length / 1KB, 2)
    Write-Host "  main.js: $mainLines строк ($mainSize KB)" -ForegroundColor White
} else {
    Write-Host "  ⚠️  main.js не найден" -ForegroundColor Red
}

Write-Host ""
Write-Host "📁 Созданные модули:" -ForegroundColor Yellow
Write-Host ""

# Проверка модулей
$modules = @{
    "utils\state.js" = "Глобальное состояние"
    "core\init.js" = "Инициализация"
    "core\renderer.js" = "Рендеринг"
    "core\camera.js" = "Управление камерой"
    "events\mouse-handler.js" = "Обработка событий мыши"
    "ui\scene-icons.js" = "Иконки на сцене"
    "ui\markers.js" = "Маркеры и индикаторы"
    "ui\ui-helpers.js" = "UI вспомогательные функции"
    "sections\section-manager.js" = "Управление секциями"
    "sections\section-ghost.js" = "Призрак секций"
    "furniture\furniture-manager.js" = "Управление мебелью"
    "furniture\furniture-ghost.js" = "Призрак мебели"
}

$totalModules = $modules.Count
$existingModules = 0
$totalLines = 0
$totalSize = 0

foreach ($module in $modules.GetEnumerator()) {
    $path = "js\$($module.Key)"
    if (Test-Path $path) {
        $lines = (Get-Content $path | Measure-Object -Line).Lines
        $size = [math]::Round((Get-Item $path).Length / 1KB, 2)
        $totalLines += $lines
        $totalSize += $size
        $existingModules++
        
        # Проверка на заглушки
        $content = Get-Content $path -Raw
        if ($content -match "TODO:|заглушка") {
            Write-Host "  🟡 $($module.Key) - $lines строк ($size KB) - ЗАГЛУШКА" -ForegroundColor Yellow
        } else {
            Write-Host "  ✅ $($module.Key) - $lines строк ($size KB) - ГОТОВО" -ForegroundColor Green
        }
    } else {
        Write-Host "  ⏳ $($module.Key) - НЕ СОЗДАН" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "📈 Статистика:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Создано модулей: $existingModules / $totalModules" -ForegroundColor White
Write-Host "  Всего строк в модулях: $totalLines" -ForegroundColor White
Write-Host "  Размер модулей: $([math]::Round($totalSize, 2)) KB" -ForegroundColor White

# Процент готовности
$progress = [math]::Round(($existingModules / $totalModules) * 100)
Write-Host ""
Write-Host "  Прогресс: $progress%" -ForegroundColor Cyan

# Визуальный прогресс-бар
$barLength = 40
$filledLength = [math]::Floor($barLength * $progress / 100)
$emptyLength = $barLength - $filledLength
$bar = "█" * $filledLength + "░" * $emptyLength
Write-Host "  [$bar] $progress%" -ForegroundColor Cyan

Write-Host ""
Write-Host "🎯 Следующие шаги:" -ForegroundColor Yellow
Write-Host ""

# Проверка TODO
Write-Host "  Поиск TODO в заглушках..." -ForegroundColor Gray
$todoCount = 0
Get-ChildItem -Path "js" -Filter *.js -Recurse | ForEach-Object {
    $todos = Select-String -Path $_.FullName -Pattern "TODO:" -AllMatches
    $todoCount += $todos.Count
}

if ($todoCount -gt 0) {
    Write-Host "  ⚠️  Найдено $todoCount TODO комментариев" -ForegroundColor Yellow
    Write-Host "  Используйте: Select-String -Path 'js\**\*.js' -Pattern 'TODO:' -Recurse" -ForegroundColor Gray
} else {
    Write-Host "  ✅ TODO комментарии не найдены!" -ForegroundColor Green
}

Write-Host ""
Write-Host "💡 Рекомендации:" -ForegroundColor Yellow
Write-Host ""

if ($progress -lt 50) {
    Write-Host "  1. Откройте README_РЕФАКТОРИНГ.md для быстрого старта" -ForegroundColor White
    Write-Host "  2. Начните с модуля ui/scene-icons.js (приоритет 1)" -ForegroundColor White
    Write-Host "  3. Следуйте плану из REFACTORING_PLAN.md" -ForegroundColor White
} elseif ($progress -lt 80) {
    Write-Host "  1. Продолжайте заполнять заглушки" -ForegroundColor White
    Write-Host "  2. Проверяйте работоспособность после каждого модуля" -ForegroundColor White
    Write-Host "  3. Создайте недостающие модули" -ForegroundColor White
} else {
    Write-Host "  1. Завершите оставшиеся модули" -ForegroundColor White
    Write-Host "  2. Создайте main-new.js" -ForegroundColor White
    Write-Host "  3. Обновите HTML файлы" -ForegroundColor White
    Write-Host "  4. Протестируйте приложение" -ForegroundColor White
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Для продолжения скажите AI: 'Продолжи рефакторинг'     ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
