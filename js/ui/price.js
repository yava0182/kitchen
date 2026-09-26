// Price UI helpers (refactored version)

function formatRub(amount) {
  const n = Number(amount) || 0;
  const intPart = String(Math.trunc(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return intPart + ' ₽';
}

export function setRoomTotalPriceRub(amount) {
  const formatted = formatRub(amount);
  const el = document.getElementById('room-total-price');
  if (el) {
    el.textContent = formatted;
    return;
  }
  // Fallback: legacy markup without explicit span id
  const host = document.querySelector('.price-display');
  if (host) {
    // Keep icon, replace text content after it
    const icon = host.querySelector('i');
    host.textContent = '';
    if (icon) host.appendChild(icon);
    host.appendChild(document.createTextNode(' ' + formatted));
  }
}

if (typeof window !== 'undefined') {
  window.setRoomTotalPriceRub = setRoomTotalPriceRub;
}

