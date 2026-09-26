/**
 * admin-edges-categories.js — Категории кромок (дерево)
 * Extracted from admin-new.html for better Cursor performance
 */
(function() {
  'use strict';

  window.EDGES_CATEGORIES_TYPE = window.EDGES_CATEGORIES_TYPE || 'butts_keys';
  window.edgesCategoriesData = window.edgesCategoriesData || [];

  function buildCategoryTree(items, parentId) {
    const parent = parentId === null || parentId === '' || parentId === 0 ? null : Number(parentId);
    return (items || []).filter(c => (c.parent || null) === parent);
  }

  function renderEdgesCategoriesTree() {
    const treeEl = document.getElementById('edges-categories-tree');
    if (!treeEl) return;
    const edgesCategoriesData = window.edgesCategoriesData || [];
    treeEl.innerHTML = '';
    const root = buildCategoryTree(edgesCategoriesData, null);
    if (root.length === 0) {
      treeEl.innerHTML = '<div style="padding:20px; color:#999;">Нет категорий. Нажмите «Добавить».</div>';
      return;
    }
    function renderLevel(items, parentId, level) {
      const children = buildCategoryTree(edgesCategoriesData, parentId);
      children.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'pp-tree-item edges-cat-item';
        div.style.paddingLeft = (level * 20 + 10) + 'px';
        div.setAttribute('data-id', cat.id);
        const subChildren = buildCategoryTree(edgesCategoriesData, cat.id);
        const expandIcon = subChildren.length ? '<span class="pp-tree-expand" style="margin-right:8px; cursor:pointer; user-select:none;">▼</span>' : '<span style="margin-right:20px; display:inline-block; width:12px;"></span>';
        div.innerHTML = expandIcon + '<span class="pp-tree-label">' + (cat.name || 'Без названия') + '</span>';
        treeEl.appendChild(div);
        renderLevel(edgesCategoriesData, cat.id, level + 1);
      });
    }
    renderLevel(edgesCategoriesData, null, 0);
  }

  async function loadEdgesCategories() {
    const treeEl = document.getElementById('edges-categories-tree');
    if (!treeEl) return;
    treeEl.innerHTML = '<div style="padding:20px; color:#999;">Загрузка...</div>';
    try {
      const hash = window.location.hash || '';
      const params = new URLSearchParams(hash.split('?')[1] || '');
      const overrideType = params.get('type');
      if (overrideType) {
        window.EDGES_CATEGORIES_TYPE = overrideType;
      }

      const res = await fetch(`/api/catalog/categories_get/${encodeURIComponent(window.EDGES_CATEGORIES_TYPE)}`);
      const data = await res.json();
      window.edgesCategoriesData = Array.isArray(data) ? data : [];
      renderEdgesCategoriesTree();
    } catch (e) {
      console.error('❌ Ошибка загрузки категорий кромок:', e);
      treeEl.innerHTML = '<div style="padding:20px; color:#c00;">Ошибка загрузки</div>';
    }
  }

  window.loadEdgesCategories = loadEdgesCategories;
  window.renderEdgesCategoriesTree = renderEdgesCategoriesTree;

})();
