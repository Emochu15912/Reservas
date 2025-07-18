// home-usuario.js

const usuarioSpan = document.getElementById('nombreUsuario');
const contenedor = document.getElementById('contenedorCanchas');
const searchInput = document.getElementById('searchInput');
const btnMisReservas = document.getElementById('btnMisReservas');
const btnPerfil = document.getElementById('btnPerfil');
const btnLogout = document.getElementById('btnLogout');

const db = window.db;
const auth = window.auth;

let usuarioActual = null;

// Mantener documento usuario sincronizado con auth
auth.onAuthStateChanged(async (user) => {
  if (user) {
    usuarioActual = user;

    // Sincronizar datos básicos usuario en Firestore
    try {
      const userRef = db.collection('usuarios').doc(user.uid);  // <-- CORREGIDO: 'usuarios'
      const doc = await userRef.get();

      const userData = {
        email: user.email || '',
        nombre: user.displayName || 'Usuario',
        rol: 'usuario' // fijo para usuarios normales
      };

      if (!doc.exists) {
        await userRef.set(userData);
      } else {
        await userRef.update(userData);
      }
    } catch (error) {
      console.error("Error sincronizando usuario:", error);
    }

    // Mostrar nombre en el header
    try {
      const userDoc = await db.collection("usuarios").doc(user.uid).get();  // <-- CORREGIDO: 'usuarios'
      usuarioSpan.textContent = userDoc.exists && userDoc.data().nombre ? userDoc.data().nombre : "Usuario";
    } catch (error) {
      usuarioSpan.textContent = "Usuario";
      console.error("Error cargando nombre usuario:", error);
    }

    await cargarCanchas();

  } else {
    window.location.href = "../../index.html";
  }
});

async function cargarCanchas() {
  try {
    const snapshot = await db.collection("canchas").get();
    contenedor.innerHTML = "";

    snapshot.forEach(doc => {
      const cancha = doc.data();
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>${cancha.nombre}</h3>
        <p>${cancha.descripcion}</p>
        <p class="status ${!cancha.disponibilidad ? 'ocupada' : ''}">
          ${cancha.disponibilidad ? "Disponible" : "Ocupada"}
        </p>
        <p><strong>Precio Día:</strong> S/ ${cancha.precioDia.toFixed(2)}</p>
        <p><strong>Precio Noche:</strong> S/ ${cancha.precioNoche.toFixed(2)}</p>
        <button ${cancha.disponibilidad ? '' : 'disabled'} onclick="reservar('${doc.id}')">
          ${cancha.disponibilidad ? "Reservar ahora" : "No disponible"}
        </button>
      `;
      contenedor.appendChild(card);
    });
  } catch (error) {
    console.error("Error cargando canchas:", error);
    contenedor.innerHTML = '<p>Error al cargar canchas. Intenta recargar la página.</p>';
  }
}

searchInput.addEventListener('input', () => {
  const filtro = searchInput.value.trim().toLowerCase();
  const cards = contenedor.querySelectorAll('.card');
  cards.forEach(card => {
    const nombre = card.querySelector('h3').textContent.toLowerCase();
    card.style.display = nombre.includes(filtro) ? 'flex' : 'none';
  });
});

function reservar(id) {
  if (!id) return alert("ID de cancha inválido.");
  window.location.href = `reservar.html?id=${id}`;
}

btnMisReservas.addEventListener('click', () => {
  if (!usuarioActual) {
    alert("Debes iniciar sesión para ver tus reservas.");
    window.location.href = "../../index.html";
    return;
  }
  // No hacemos chequeo extra aquí para evitar errores
  window.location.href = "mis-reservas.html";
});

btnPerfil.addEventListener('click', () => {
  window.location.href = "perfil-usuario.html";
});

btnLogout.addEventListener('click', () => {
  auth.signOut()
    .then(() => window.location.href = "../../index.html")
    .catch(() => alert("Error cerrando sesión. Inténtalo nuevamente."));
});
