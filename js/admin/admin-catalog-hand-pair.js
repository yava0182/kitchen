/**
 * Связь левая ↔ правая карточка фасада (pairedHandCatalogItemIds).
 * Для catalog_28 и других каталогов с фасадными шаблонами.
 */
(function () {
  'use strict';

  function parseItemData(raw) {
    if (!raw) return {};
    if (typeof raw === 'object') return raw;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return {};
    }
  }

  function parsePairedHandIds(d) {
    const data = parseItemData(d);
    const raw = data.pairedHandCatalogItemIds;
    if (!raw || typeof raw !== 'object') return { left: 0, right: 0 };
    return {
      left: Number(raw.left) || 0,
      right: Number(raw.right) || 0,
    };
  }

  function readPairedFromApiData(apiData) {
    const d = parseItemData(apiData);
    const pair = parsePairedHandIds(d);
    if (!pair.left && !pair.right) return null;
    return {
      pairedHandCatalogItemIds: pair,
      leftId: pair.left,
      rightId: pair.right,
    };
  }

  function mergePairedHandIntoDataPayload(dataPayload, leftId, rightId) {
    if (!dataPayload || typeof dataPayload !== 'object') return;
    const l = Number(leftId) || 0;
    const r = Number(rightId) || 0;
    if (l <= 0 && r <= 0) {
      delete dataPayload.pairedHandCatalogItemIds;
      return;
    }
    dataPayload.pairedHandCatalogItemIds = { left: l, right: r };
  }

  async function syncReverseHandPairs(catalogType, itemId, pair, itemName) {
    const ct = String(catalogType || '').trim();
    const selfId = Number(itemId) || 0;
    if (!ct || selfId <= 0) return;
    const updates = [];
    if (pair.left > 0 && pair.left !== selfId) {
      updates.push({ id: pair.left, back: { left: pair.left, right: selfId } });
    }
    if (pair.right > 0 && pair.right !== selfId) {
      updates.push({ id: pair.right, back: { left: selfId, right: pair.right } });
    }
    for (const u of updates) {
      try {
        const resp = await fetch(
          `/api/catalog/item/${encodeURIComponent(ct)}/${encodeURIComponent(String(u.id))}?t=${Date.now()}`,
          { cache: 'no-cache' }
        );
        if (!resp.ok) continue;
        const raw = await resp.json();
        const data = parseItemData(raw?.data ?? raw);
        mergePairedHandIntoDataPayload(data, u.back.left, u.back.right);
        await fetch(`/api/catalog/item/${encodeURIComponent(ct)}/${encodeURIComponent(String(u.id))}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: JSON.stringify(data) }),
        });
      } catch (e) {
        console.warn('[hand-pair] syncReverse', u.id, e);
      }
    }
  }

  function getVueHandPairOptions() {
    return {
      computed: {
        handPairSummary() {
          const p = this.item?.pairedHandCatalogItemIds || {};
          const l = Number(p.left) || 0;
          const r = Number(p.right) || 0;
          if (!l && !r) return 'не задано';
          const parts = [];
          if (l) parts.push(`лев. #${l}`);
          if (r) parts.push(`прав. #${r}`);
          return parts.join(' · ');
        },
      },
      methods: {
        applyHandPairFromLoadedData(meta) {
          if (!meta) return;
          this.item.pairedHandCatalogItemIds = {
            left: Number(meta.leftId) || 0,
            right: Number(meta.rightId) || 0,
          };
        },
        openHandPairPicker() {
          if (typeof window.__cldCatalogHandPair?.openPicker === 'function') {
            window.__cldCatalogHandPair.openPicker({
              catalogType: this.catalogType || this.item?.catalog_type,
              itemId: Number(this.item?.id) || 0,
              itemName: this.item?.name || '',
              current: this.item?.pairedHandCatalogItemIds || { left: 0, right: 0 },
              onPick: (pair) => {
                this.item.pairedHandCatalogItemIds = {
                  left: Number(pair.left) || 0,
                  right: Number(pair.right) || 0,
                };
              },
            });
          }
        },
      },
    };
  }

  window.__cldCatalogHandPair = {
    parsePairedHandIds,
    readPairedFromApiData,
    mergePairedHandIntoDataPayload,
    syncReverseHandPairs,
    getVueHandPairOptions,
    openPicker(ctx) {
      const hand = String(
        window.prompt(
          `Связь левая/правая (id через запятую: левый,правый)\nТекущая карточка: #${ctx.itemId} ${ctx.itemName || ''}`,
          `${ctx.current?.left || ctx.itemId || ''},${ctx.current?.right || ''}`
        ) || ''
      ).trim();
      if (!hand) return;
      const [a, b] = hand.split(/[,;\s]+/).map((x) => Number(x.trim()) || 0);
      if (typeof ctx.onPick === 'function') {
        ctx.onPick({ left: a, right: b });
      }
    },
  };
})();
