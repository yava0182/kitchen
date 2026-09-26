/**
 * admin-orders.js — Заявки на расчёт (clients_orders)
 * Extracted from admin-new.html for better Cursor performance
 */
(function() {
  'use strict';

  async function loadClientsOrders() {
    try {
      const tbody = document.getElementById('clients-orders-table-body');
      if (!tbody) return;

      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px;">Загрузка...</td></tr>';

      const response = await fetch('/api/clients_orders/list');
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      const result = await response.json();

      if (result.result === 'success' && result.data && result.data.length > 0) {
        tbody.innerHTML = '';

        result.data.forEach(order => {
          const row = document.createElement('tr');
          const orderId = order.id ?? order.order_id ?? 0;
          row.innerHTML = `
            <td>${order.order_number || order.id || '-'}</td>
            <td>${(order.client_name || '-').replace(/</g, '&lt;')}</td>
            <td>${(order.email || '-').replace(/</g, '&lt;')}</td>
            <td>${(order.phone || '-').replace(/</g, '&lt;')}</td>
            <td>${(order.comment || '-').replace(/</g, '&lt;')}</td>
            <td>${(order.date || '-').replace(/</g, '&lt;')}</td>
            <td>${order.price ? order.price.toLocaleString('ru-RU') + ' ₽' : '-'}</td>
            <td>
              <button class="btn btn-sm btn-primary" onclick="viewOrder(${orderId})" style="padding:4px 8px; margin-right:4px;">Просмотр</button>
              <button class="btn btn-sm btn-danger" onclick="deleteOrder(${orderId})" style="padding:4px 8px;">Удалить</button>
            </td>
          `;
          tbody.appendChild(row);
        });
      } else {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#999;">Заявок пока нет</td></tr>';
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки заявок:', error);
      const tbody = document.getElementById('clients-orders-table-body');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#ef4444;">Ошибка загрузки данных</td></tr>';
      }
    }
  }

  window.loadClientsOrders = loadClientsOrders;
})();
