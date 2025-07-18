// Variables para colecciones
const db = firebase.firestore();

let canchas = [];
let usuarios = [];
let reservas = [];

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await cargarCanchas();
    await cargarUsuarios();
    await cargarReservas();
  } catch (error) {
    console.error(error);
    alert('Error cargando datos');
  }
});

async function cargarCanchas() {
  const snapshot = await db.collection('canchas').orderBy('nombre').get();
  canchas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function cargarUsuarios() {
  const snapshot = await db.collection('users').get();
  usuarios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function cargarReservas() {
  const filtroFecha = document.getElementById('filtro-fecha')?.value;
  let query = db.collection('reservas').orderBy('creadoEn', 'desc');

  if (filtroFecha) {
    query = query.where('fecha', '==', filtroFecha);
  }

  const snapshot = await query.get();
  reservas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  renderTablaReservas();
}

function renderTablaReservas() {
  const tablaBody = document.querySelector('#tabla-reservas tbody');
  tablaBody.innerHTML = '';

  if (reservas.length === 0) {
    tablaBody.innerHTML = '<tr><td colspan="8">No hay reservas.</td></tr>';
    return;
  }

  reservas.forEach(reserva => {
    const usuario = usuarios.find(u => u.id === reserva.usuarioId);
    const cancha = canchas.find(c => c.id === reserva.canchaId);

    // Formatear fecha y hora en un solo string
    const fechaHoraStr = `${reserva.fecha} ${reserva.hora}`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${usuario ? usuario.nombre : 'Desconocido'}</td>
      <td>${cancha ? cancha.nombre : 'Desconocida'}</td>
      <td>${fechaHoraStr}</td>
      <td>-</td>
      <td>-</td>
      <td class="${claseEstado(reserva.estado)}">${capitalizeFirstLetter(reserva.estado)}</td>
      <td>
        ${reserva.comprobanteBase64 ? `<button class="btn-ver-captura" aria-label="Ver comprobante de pago"><i class="bi bi-image"></i></button>` : 'No enviado'}
      </td>
      <td>
        ${reserva.estado === 'pendiente' ? `
          <button class="btn-confirmar">Confirmar</button>
          <button class="btn-rechazar">Rechazar</button>
        ` : ''}
        <button class="btn-eliminar"><i class="bi bi-trash-fill"></i></button>
      </td>
    `;

    // Eventos para botones
    if (reserva.estado === 'pendiente') {
      tr.querySelector('.btn-confirmar').addEventListener('click', () => cambiarEstadoReserva(reserva.id, 'confirmado'));
      tr.querySelector('.btn-rechazar').addEventListener('click', () => cambiarEstadoReserva(reserva.id, 'rechazado'));
    }
    tr.querySelector('.btn-eliminar').addEventListener('click', () => eliminarReserva(reserva.id));
    
    const btnVerCaptura = tr.querySelector('.btn-ver-captura');
    if (btnVerCaptura) {
      btnVerCaptura.addEventListener('click', () => mostrarCaptura(reserva.comprobanteBase64));
    }

    tablaBody.appendChild(tr);
  });
}

function cambiarEstadoReserva(id, nuevoEstado) {
  if (!confirm(`¿Confirmar cambio de estado a "${capitalizeFirstLetter(nuevoEstado)}"?`)) return;

  db.collection('reservas').doc(id).update({ estado: nuevoEstado })
    .then(() => {
      alert('Estado actualizado correctamente');
      cargarReservas();
    })
    .catch(err => {
      console.error(err);
      alert('Error actualizando estado');
    });
}

function eliminarReserva(id) {
  if (!confirm('¿Eliminar esta reserva? Esta acción no se puede revertir.')) return;

  db.collection('reservas').doc(id).delete()
    .then(() => {
      alert('Reserva eliminada');
      cargarReservas();
    })
    .catch(err => {
      console.error(err);
      alert('Error eliminando reserva');
    });
}

function mostrarCaptura(base64) {
  if (!base64) return;
  const modal = document.getElementById('modal-captura');
  const img = document.getElementById('img-captura');
  img.src = base64;
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
}

function cerrarModal() {
  const modal = document.getElementById('modal-captura');
  const img = document.getElementById('img-captura');
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  img.src = '';
}

document.getElementById('cerrar-modal').addEventListener('click', cerrarModal);
document.getElementById('modal-captura').addEventListener('click', e => {
  if (e.target.id === 'modal-captura') cerrarModal();
});

function claseEstado(estado) {
  switch (estado.toLowerCase()) {
    case 'pendiente': return 'pendiente';
    case 'confirmado': return 'reservada';
    case 'rechazado': return 'rechazada';
    default: return '';
  }
}

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
