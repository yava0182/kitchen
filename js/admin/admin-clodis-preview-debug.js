/**
 * admin-clodis-preview-debug.js — отладочные утилиты для Clodis iframe preview
 * Extracted from admin-new.html for better Cursor performance
 */
(function() {
  'use strict';

  /**
   * ЛОГИ: показывает координаты деталей относительно секции.
   * @param {Array} tree - массив узлов шаблона
   * @param {{x:number,y:number,z:number}} sectionSize - размеры секции в мм
   */
  function logDetailCoordinatesInTree(tree, sectionSize) {
    const walk = (items, curSectionSize, depth = 0) => {
      (items || []).forEach((item) => {
        if (item?.type === 'wall' && item?.spec?.detailTypeId) {
          const detailX_mm = typeof item.pos?.x === 'number' ? item.pos.x : 0;
          const detailY_mm = typeof item.pos?.y === 'number' ? item.pos.y : 0;
          const detailZ_mm = typeof item.pos?.z === 'number' ? item.pos.z : 0;

          // Вычисляем координаты детали относительно секции (в метрах для Three.js)
          const sectionLeft_m = -curSectionSize.x / 2000; // -w/2 в метрах
          const sectionRight_m = curSectionSize.x / 2000; // w/2 в метрах
          const sectionBottom_m = -curSectionSize.y / 2000; // -h/2 в метрах
          const sectionTop_m = curSectionSize.y / 2000; // h/2 в метрах
          const sectionBack_m = -curSectionSize.z / 2000; // -d/2 в метрах
          const sectionFront_m = curSectionSize.z / 2000; // d/2 в метрах

          const detailX_m = (sectionLeft_m * 1000 + detailX_mm) / 1000;
          const detailY_m = (sectionBottom_m * 1000 + detailY_mm) / 1000;
          const detailZ_m = (sectionBack_m * 1000 + detailZ_mm) / 1000;

          console.log('[CLD][detail] 📍 КООРДИНАТЫ ДЕТАЛИ ОТНОСИТЕЛЬНО СЕКЦИИ:', {
            detail_name: item.name || 'Деталь',
            detail_type: item.spec.detailTypeId,
            section_size: `${curSectionSize.x}×${curSectionSize.y}×${curSectionSize.z}мм`,
            pivot: item.pivot,
            pivot_x: item.pivot?.x,
            pivot_y: item.pivot?.y,
            pivot_z: item.pivot?.z,
            pivot_описание: item.spec.detailTypeId === 'vertical_left'
              ? `PIVOT: Нижний левый дальний угол детали (x=${item.pivot?.x}, y=${item.pivot?.y}, z=${item.pivot?.z})`
              : `PIVOT: x=${item.pivot?.x}, y=${item.pivot?.y}, z=${item.pivot?.z}`,
            detail_position_mm: {
              x: `${detailX_mm}мм от левого края секции`,
              y: `${detailY_mm}мм от нижнего края секции`,
              z: `${detailZ_mm}мм от заднего края секции`
            },
            detail_coordinates_meters: {
              x: `${detailX_m.toFixed(3)}м`,
              y: `${detailY_m.toFixed(3)}м`,
              z: `${detailZ_m.toFixed(3)}м`
            },
            section_bounds_meters: {
              left: `${sectionLeft_m.toFixed(3)}м`,
              right: `${sectionRight_m.toFixed(3)}м`,
              bottom: `${sectionBottom_m.toFixed(3)}м`,
              top: `${sectionTop_m.toFixed(3)}м`,
              back: `${sectionBack_m.toFixed(3)}м`,
              front: `${sectionFront_m.toFixed(3)}м`
            },
            where_is_detail: `X: ${detailX_mm}мм от левого (${detailX_m.toFixed(3)}м), Y: ${detailY_mm}мм от низа (${detailY_m.toFixed(3)}м), Z: ${detailZ_mm}мм от заднего (${detailZ_m.toFixed(3)}м)`
          });

          // Специальная проверка для vertical_left
          if (item.spec.detailTypeId === 'vertical_left') {
            const expectedX = 0;
            const expectedY = 0;
            const expectedZ = 0;

            console.log('[CLD][detail] 🔍 ПРОВЕРКА vertical_left:', {
              expected: `X=${expectedX}мм от левого, Y=${expectedY}мм от низа, Z=${expectedZ}мм от заднего (задний край)`,
              actual: `X=${detailX_mm}мм от левого, Y=${detailY_mm}мм от низа, Z=${detailZ_mm}мм от заднего`,
              pivot: item.pivot,
              pivot_x: item.pivot?.x,
              pivot_y: item.pivot?.y,
              pivot_z: item.pivot?.z,
              pivot_ожидается: 'x=-1, y=-1, z=-1 (нижний левый дальний угол детали)',
              pivot_фактически: `x=${item.pivot?.x}, y=${item.pivot?.y}, z=${item.pivot?.z}`,
              pivot_правильно: item.pivot?.x === -1 && item.pivot?.y === -1 && item.pivot?.z === -1,
              correct: detailX_mm === expectedX && detailY_mm === expectedY && detailZ_mm === expectedZ,
              errors: {
                x: detailX_mm !== expectedX ? `❌ X неправильно! Ожидалось ${expectedX}мм, получено ${detailX_mm}мм` : '✅ X правильно',
                y: detailY_mm !== expectedY ? `❌ Y неправильно! Ожидалось ${expectedY}мм, получено ${detailY_mm}мм` : '✅ Y правильно',
                z: detailZ_mm !== expectedZ ? `❌ Z неправильно! Ожидалось ${expectedZ}мм (задний край), получено ${detailZ_mm}мм` : '✅ Z правильно',
                pivot: (item.pivot?.x !== -1 || item.pivot?.y !== -1 || item.pivot?.z !== -1)
                  ? `❌ PIVOT неправильно! Ожидалось x=-1, y=-1, z=-1, получено x=${item.pivot?.x}, y=${item.pivot?.y}, z=${item.pivot?.z}`
                  : '✅ PIVOT правильно (нижний левый дальний угол)'
              }
            });

            if (detailX_mm !== expectedX || detailY_mm !== expectedY || detailZ_mm !== expectedZ) {
              console.error('[CLD][detail] ❌ ОШИБКА: vertical_left в НЕПРАВИЛЬНОЙ позиции!', {
                should_be: `${expectedX}мм от левого края (прижата к левому краю), ${expectedY}мм от низа, ${expectedZ}мм от заднего (прижата к заднему краю)`,
                actually_is: `${detailX_mm}мм от левого, ${detailY_mm}мм от низа, ${detailZ_mm}мм от заднего`,
                problem: detailX_mm !== expectedX
                  ? `НЕ на левом краю (должно быть ${expectedX}мм от левого края, т.е. прижата к левому краю)!`
                  : detailZ_mm !== expectedZ
                    ? `НЕ на заднем краю (должно быть ${expectedZ}мм от заднего, т.е. прижата к заднему краю)!`
                    : `Позиция Y неправильная (должно быть ${expectedY}мм от низа)!`
              });
            } else {
              console.log('[CLD][detail] ✅ vertical_left в ПРАВИЛЬНОЙ позиции!');
            }
          }
        }

        // Рекурсивно проверяем дочерние элементы
        if (item?.children && item.children.length > 0) {
          const childSectionSize = item.type === 'section'
            ? {
                x: typeof item.size?.x === 'number' ? item.size.x : curSectionSize.x,
                y: typeof item.size?.y === 'number' ? item.size.y : curSectionSize.y,
                z: typeof item.size?.z === 'number' ? item.size.z : curSectionSize.z
              }
            : curSectionSize;
          walk(item.children, childSectionSize, depth + 1);
        }
      });
    };

    walk(tree, sectionSize, 0);
  }

  window.__cldLogDetailCoordinatesInTree = logDetailCoordinatesInTree;
})();

