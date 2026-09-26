// Cabinet modal module - handles cabinet/furniture catalog modal UI
// Main module for cabinet modal operations

/**
 * Initialize cabinet modal event handlers
 * Currently this module is responsible only for toggling
 * between main menu view and cabinets view via "back-to-menu" button.
 * Wizard navigation (steps 1–4) is handled in ui/room-steps.js.
 */
export function initCabinetModal() {
  const backToMenu = document.getElementById('back-to-menu');
  const mainMenuView = document.getElementById('main-menu-view');
  const cabinetsView = document.getElementById('cabinets-view');

  // Switch back to main menu
  if (backToMenu) {
    backToMenu.addEventListener('click', () => {
      if (cabinetsView) cabinetsView.classList.remove('active');
      if (mainMenuView) mainMenuView.classList.add('active');
    });
  }

  console.log('✅ Cabinet modal initialized');
}
