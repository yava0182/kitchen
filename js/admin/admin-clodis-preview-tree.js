/**
 * admin-clodis-preview-tree.js — build tree for Clodis preview sync
 * Extracted from admin-new.html for better Cursor performance
 */
(function() {
  'use strict';

  function buildPreviewTree() {
    const childrenRoot = document.getElementById('constructor-root-module-children');
    if (!childrenRoot) {
      if (window.__CLD_DEBUG) {
        console.warn('[CLD][preview-tree] childrenRoot не найден');
      }
      return { tree: [], hasTree: false };
    }

    const domNodes = childrenRoot.querySelectorAll('.constructor-tree-node');
    
    // Проверяем доступность функции построения дерева
    const hasBuilder = typeof window.__ppBuildClodisTemplateTreeFromDom === 'function';
    if (!hasBuilder) {
      console.error('[CLD][preview-tree] ⚠️ __ppBuildClodisTemplateTreeFromDom не найдена! Проверьте, что она экспортирована глобально в admin-new.html');
      return { tree: [], hasTree: false };
    }

    if (window.__CLD_DEBUG) {
      console.log('[CLD][preview-tree] buildPreviewTree', {
        domNodesCount: domNodes.length,
        hasBuilder,
        childrenRootId: childrenRoot.id,
        childrenRootChildrenCount: childrenRoot.children.length,
      });
    }

    let tree = [];
    try {
      tree = window.__ppBuildClodisTemplateTreeFromDom(childrenRoot);
      if (!Array.isArray(tree)) {
        console.warn('[CLD][preview-tree] __ppBuildClodisTemplateTreeFromDom вернула не массив:', typeof tree);
        tree = [];
      }
    } catch (e) {
      console.error('[CLD][preview-tree] Ошибка при построении дерева из DOM:', e);
      tree = [];
    }
    
    // Фолбэк: если DOM-дерево урезано (часто roots:1 до клика), берём полное дерево из nodeData.
    const rootModule = document.getElementById('constructor-root-module');
    const fallbackTree =
      (Array.isArray(rootModule?.nodeData?.clodisJSON) && rootModule.nodeData.clodisJSON) ||
      (Array.isArray(rootModule?.nodeData?.constructor_structure) && rootModule.nodeData.constructor_structure) ||
      [];
    if (Array.isArray(fallbackTree) && fallbackTree.length > 0) {
      const domLikelyIncomplete = !Array.isArray(tree) || tree.length <= 1;
      if (domLikelyIncomplete && fallbackTree.length >= tree.length) {
        tree = fallbackTree;
      }
    }

    const hasTree = Array.isArray(tree) && tree.length > 0;
    
    if (window.__CLD_DEBUG || !hasTree) {
      console.log('[CLD][preview-tree] результат', {
        treeLength: Array.isArray(tree) ? tree.length : 0,
        hasTree,
        domNodesCount: domNodes.length,
        firstItem: Array.isArray(tree) && tree.length > 0 ? {
          type: tree[0].type,
          name: tree[0].name,
          hasSpec: !!tree[0].spec,
          detailTypeId: tree[0].spec?.detailTypeId,
          hasSize: !!tree[0].size,
          hasPos: !!tree[0].pos,
        } : null,
      });
    }

    // Если DOM-узлы есть, но дерево пустое - это проблема
    if (domNodes.length > 0 && !hasTree) {
      console.warn('[CLD][preview-tree] ⚠️ DOM-узлы есть (' + domNodes.length + '), но дерево пустое! Проверьте __ppBuildClodisTemplateTreeFromDom');
    }

    return { tree, hasTree };
  }

  window.__cldBuildPreviewTree = buildPreviewTree;
})();

