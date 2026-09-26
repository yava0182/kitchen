// UI helpers module - various UI utility functions
// TODO: Extract from main.js

export function showDeleteButton() {
  const deleteBtn = document.getElementById('delete-button');
  if (deleteBtn) {
    deleteBtn.style.display = 'block';
  }
}

export function hideDeleteButton() {
  const deleteBtn = document.getElementById('delete-button');
  if (deleteBtn) {
    deleteBtn.style.display = 'none';
  }
}
