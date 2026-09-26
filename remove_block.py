# -*- coding: utf-8 -*-
path = 'Configurator-Clodis-ThreeJS-7/admin-new.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

marker_start = '      async function loadAccessoriesLibrary() {'
marker_end = '      // initEventsTab, initParamsTab - admin-catalog-item-tabs-events-params.js'

count = 0
while True:
    idx_start = content.find(marker_start)
    idx_end = content.find(marker_end)
    if idx_start == -1 or idx_end == -1 or idx_end <= idx_start:
        break
    content = content[:idx_start] + content[idx_end:]
    count += 1

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print(f'Removed {count} block(s)')
