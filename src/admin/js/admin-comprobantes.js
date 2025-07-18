// admin-comprobantes.js

// Asume que firebase y firebaseConfig ya están cargados en el HTML (firebase compat)

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

const tbody = document.getElementById('comprobantes-body');

function cargarComprobantes() {
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Cargando comprobantes...</td></tr>';

  db.collection("reservas").onSnapshot(snapshot => {
    tbody.innerHTML = '';

    if (snapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay comprobantes disponibles.</td></tr>';
      return;
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      const id = doc.id;

      const estado = data.estado || 'pendiente';
      const estadoCapital = estado.charAt(0).toUpperCase() + estado.slice(1);

      const fila = document.createElement('tr');

      fila.innerHTML = `
        <td data-label="Usuario">${data.usuarioId || 'Desconocido'}</td>
        <td data-label="Cancha">${data.canchaId || 'Sin cancha'}</td>
        <td data-label="Fecha de Reserva">${data.fecha || '---'}</td>
        <td data-label="Estado">${estadoCapital}</td>
        <td data-label="Comprobante">
          ${data.comprobanteBase64 ? `<img src="${data.comprobanteBase64}" alt="Comprobante" style="max-width:100px; max-height:100px;" />` : 'No disponible'}
        </td>
        <td data-label="Acciones" class="acciones">
          <button class="btn aprobar" data-id="${id}" ${estado === 'confirmada' ? 'disabled' : ''}>Aprobar</button>
          <button class="btn rechazar" data-id="${id}" ${estado === 'rechazada' ? 'disabled' : ''}>Rechazar</button>
        </td>
      `;

      tbody.appendChild(fila);
    });

    asignarEventosBotones();
  }, error => {
    console.error('Error obteniendo comprobantes:', error);
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: red;">Error al cargar comprobantes.</td></tr>';
  });
}

function asignarEventosBotones() {
  const btnsAprobar = document.querySelectorAll('.btn.aprobar');
  const btnsRechazar = document.querySelectorAll('.btn.rechazar');

  btnsAprobar.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (confirm('¿Confirmar aprobación del comprobante?')) {
        actualizarEstado(id, 'confirmada');
      }
    });
  });

  btnsRechazar.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (confirm('¿Confirmar rechazo del comprobante?')) {
        actualizarEstado(id, 'rechazada');
      }
    });
  });
}

function actualizarEstado(docId, nuevoEstado) {
  db.collection("reservas").doc(docId).update({ estado: nuevoEstado })
    .then(() => alert(`Comprobante ${nuevoEstado}`))
    .catch(error => {
      console.error('Error actualizando estado:', error);
      alert('Error al actualizar estado, intenta de nuevo.');
    });
}

document.addEventListener('DOMContentLoaded', () => {
  cargarComprobantes();
});
