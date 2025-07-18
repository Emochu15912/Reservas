// src/common/js/auth.js

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();

      try {
        const cred = await auth.signInWithEmailAndPassword(email, password);
        const uid = cred.user.uid;

        const doc = await db.collection('usuarios').doc(uid).get();
        if (doc.exists) {
          const data = doc.data();
          if (data.rol === 'admin') {
            window.location.href = 'src/admin/admin.html';
          } else {
            window.location.href = 'src/usuario/home-usuario.html';
          }
        } else {
          alert('Usuario no encontrado en la colección.');
          auth.signOut();
        }
      } catch (error) {
        console.error('Error al iniciar sesión:', error);
        alert('Error al iniciar sesión: ' + error.message);
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nombre = document.getElementById('nombre').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();

      if (password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
      }

      try {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        const uid = cred.user.uid;

        await db.collection('usuarios').doc(uid).set({
          nombre,
          email,
          rol: 'usuario'
        });

        alert('Registro exitoso');
        window.location.href = 'src/usuario/home-usuario.html';
      } catch (error) {
        alert('Error al registrar: ' + error.message);
      }
    });
  }
});
