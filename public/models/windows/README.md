# Окна (GLB)

Пул моделей окон. Стопки — в `shelf-props/`.

## Конвертация (сразу разбивка + текстуры)

```powershell
cd D:\Configurator-Clodis-ThreeJS-24\Configurator-Clodis-ThreeJS-7
.\tools\opening-to-glb.ps1 "C:\Users\Admin\Downloads\ВСТАВЬ.rar" -Type window
```

Выход: `public/models/windows/<имя>-01-….glb`, `…-02-….glb`, …  
Сферы-хелперы удаляются, `maps/` подтягивается сам.
