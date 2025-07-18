import { db } from '../../common/js/firebase-config.js';

const params = new URLSearchParams(window.location.search);
const reservaId = params.get('id');

// Elementos del DOM
const voucherContainer = document.getElementById('voucherContainer');
const estadoBadge = document.getElementById('estadoBadge');
const volverBtn = document.getElementById('volverBtn');
const reenviarBtn = document.getElementById('reenviarBtn');
const descargarBtn = document.getElementById('descargarBtn');

// Cargar datos del comprobante
async function cargarVoucher() {
  try {
    const doc = await db.collection('reservas').doc(reservaId).get();
    if (!doc.exists) {
      voucherContainer.innerHTML = '<p>Reserva no encontrada.</p>';
      return;
    }

    const reserva = doc.data();

    // Mostrar información
    voucherContainer.innerHTML = `
      <h2>Comprobante de Reserva</h2>
      <p><strong>Cancha:</strong> ${reserva.nombreCancha}</p>
      <p><strong>Fecha:</strong> ${reserva.fecha}</p>
      <p><strong>Hora:</strong> ${reserva.hora}</p>
      <p><strong>Monto total:</strong> S/. ${reserva.precio}</p>
      <p><strong>Monto pagado:</strong> S/. ${parseFloat(reserva.precio) / 2}</p>
      <p><strong>Estado:</strong> <span id="estadoBadge">${reserva.estado}</span></p>
      <p><strong>Enviado el:</strong> ${reserva.fechaReserva}</p>
      <img src="${reserva.voucherImgUrl}" alt="Voucher" class="voucher-img" />
    `;

    // Estado visual
    actualizarBadgeEstado(reserva.estado);

    // Mostrar botón "Reenviar" solo si el estado es "pendiente"
    if (reserva.estado === 'pendiente') {
      reenviarBtn.style.display = 'inline-block';
    } else {
      reenviarBtn.style.display = 'none';
    }

  } catch (error) {
    console.error('Error al cargar el comprobante:', error);
    voucherContainer.innerHTML = '<p>Error al cargar los datos del voucher.</p>';
  }
}

function actualizarBadgeEstado(estado) {
  const badge = document.getElementById('estadoBadge');
  badge.classList.remove('badge-pendiente', 'badge-confirmado', 'badge-cancelado');
  if (estado === 'pendiente') badge.classList.add('badge-pendiente');
  if (estado === 'confirmado') badge.classList.add('badge-confirmado');
  if (estado === 'cancelado') badge.classList.add('badge-cancelado');
}

// Botón volver
volverBtn.addEventListener('click', () => {
  window.location.href = 'mis-reservas.html';
});

// Botón descargar
descargarBtn.addEventListener('click', () => {
  const voucherImg = document.querySelector('.voucher-img');
  if (voucherImg) {
    const link = document.createElement('a');
    link.href = voucherImg.src;
    link.download = 'comprobante_reserva.png';
    link.click();
  }
});

// Botón reenviar
reenviarBtn.addEventListener('click', async () => {
  try {
    const confirmacion = confirm('¿Deseas reenviar tu comprobante?');
    if (!confirmacion) return;

    await db.collection('reservas').doc(reservaId).update({
      reenviado: true,
      estado: 'pendiente',
      fechaReenvio: new Date().toISOString()
    });

    alert('¡Comprobante reenviado con éxito!');
    window.location.reload();
  } catch (error) {
    console.error('Error al reenviar el comprobante:', error);
    alert('Ocurrió un error al reenviar el comprobante.');
  }
});

// Inicializar
cargarVoucher();
