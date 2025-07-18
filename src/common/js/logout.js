// src/common/js/logout.js

document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await auth.signOut();
        window.location.href = '../../../index.html';
      } catch (error) {
        alert('Error al cerrar sesión: ' + error.message);
      }
    });
  }
});
