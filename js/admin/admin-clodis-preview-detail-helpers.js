/**
 * admin-clodis-preview-detail-helpers.js — helpers for detail pivot/position
 * Extracted from admin-new.html for better Cursor performance
 */
(function() {
  'use strict';

  function getDefaultPivotForDetailType(detailTypeId) {
    switch (detailTypeId) {
      case 'vertical_left': return { x: -1, y: -1, z: -1 };
      case 'vertical_right': return { x: 1, y: -1, z: -1 };
      case 'vertical_middle': return { x: 0, y: -1, z: -1 };
      case 'horizontal_top': return { x: -1, y: 1, z: -1 };
      case 'horizontal_bottom': return { x: -1, y: -1, z: -1 };
      case 'horizontal_middle': return { x: -1, y: 0, z: -1 };
      case 'front_front': return { x: -1, y: -1, z: 1 };
      case 'front_middle': return { x: -1, y: -1, z: 0 };
      default: return null;
    }
  }

  window.__cldGetDefaultPivotForDetailType = getDefaultPivotForDetailType;
})();

