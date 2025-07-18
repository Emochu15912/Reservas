import { db, storage, auth } from '../../common/js/firebase-config.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const reservaForm = document.getElementById('reservaForm');
const canchaSelect = document.getElementById('canchaSelect');
const fechaInput = document.getElementById('fecha');
const comprobanteInput = document.getElementById('comprobante');
const horasGrid = document.getElementById('horasGrid');
const precioInfo = document.getElementById('precioInfo');
const submitBtn = document.getElementById('submitBtn');

const horas = [
  '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00', '22:00', '23:00'
];

let horasSeleccionadas = [];

function actualizarPrecio() {
  if (!canchaSelect.value) {
    precioInfo.textContent = 'Selecciona una cancha primero.';
    return;
  }

  const precioDia = parseFloat(canchaSelect.selectedOptions[0].dataset.precioDia);
  const precioNoche = parseFloat(canchaSelect.selectedOptions[0].dataset.precioNoche);

  let total = 0;
  horasSeleccionadas.forEach(hora => {
    const horaInt = parseInt(hora.split(':')[0]);
    const esDia = horaInt >= 10 && horaInt < 18;
    total += esDia ? precioDia : precioNoche;
  });

  if (horasSeleccionadas.length === 0) {
    precioInfo.textContent = 'Selecciona una hora para ver el precio.';
  } else {
    const adelanto = (total / 2).toFixed(2);
    precioInfo.textContent = `Horas seleccionadas: ${horasSeleccionadas.join(', ')}\nPrecio total: S/${total.toFixed(2)} - Pagar ahora (50%): S/${adelanto}`;
  }
}

// Función para actualizar las horas disponibles y deshabilitar las ocupadas
async function actualizarHorasDisponibles() {
  horasSeleccionadas = [];
  precioInfo.textContent = 'Selecciona una hora para ver el precio.';
  submitBtn.disabled = true;
  horasGrid.innerHTML = '';

  if (!canchaSelect.value || !fechaInput.value) return;

  const canchaId = canchaSelect.value;
  const fecha = fechaInput.value;

  // Consultar reservas existentes para cancha y fecha
  const snapshot = await db.collection('reservas')
    .where('canchaId', '==', canchaId)
    .where('fecha', '==', fecha)
    .get();

  // Obtener todas las horas ocupadas (pueden ser arrays)
  const horasOcupadas = snapshot.docs.flatMap(doc => {
    const data = doc.data();
    if (Array.isArray(data.horas)) return data.horas;
    if (typeof data.hora === 'string') return [data.hora];
    return [];
  });

  horas.forEach(hora => {
    const div = document.createElement('div');
    div.className = 'hora-btn';
    div.textContent = hora;

    if (horasOcupadas.includes(hora)) {
      div.classList.add('ocupada');
    } else {
      div.addEventListener('click', () => {
        const index = horasSeleccionadas.indexOf(hora);
        if (index === -1) {
          horasSeleccionadas.push(hora);
          div.classList.add('selected');
        } else {
          horasSeleccionadas.splice(index, 1);
          div.classList.remove('selected');
        }
        horasSeleccionadas.sort((a, b) => parseInt(a.split(':')[0]) - parseInt(b.split(':')[0]));
        actualizarPrecio();
        validarFormulario();
      });
    }
    horasGrid.appendChild(div);
  });
}

function validarFormulario() {
  submitBtn.disabled = !(horasSeleccionadas.length > 0 && comprobanteInput.files.length > 0);
}

comprobanteInput.addEventListener('change', validarFormulario);
canchaSelect.addEventListener('change', actualizarHorasDisponibles);
fechaInput.addEventListener('change', actualizarHorasDisponibles);

reservaForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!auth.currentUser) {
    alert('Debes iniciar sesión para reservar.');
    return;
  }

  if (horasSeleccionadas.length === 0) {
    alert('Selecciona al menos una hora.');
    return;
  }

  if (comprobanteInput.files.length === 0) {
    alert('Debes subir un comprobante de pago.');
    return;
  }

  submitBtn.disabled = true;

  try {
    const archivo = comprobanteInput.files[0];
    if (archivo.size > 2 * 1024 * 1024) throw new Error('El comprobante debe pesar menos de 2MB.');

    // Subir comprobante a Firebase Storage
    const fileRef = ref(storage, `comprobantes/${Date.now()}-${archivo.name}`);
    await uploadBytes(fileRef, archivo);
    const comprobanteURL = await getDownloadURL(fileRef);

    // Calcular total y adelanto (ya calculado en UI, pero repetimos por seguridad)
    const precioDia = parseFloat(canchaSelect.selectedOptions[0].dataset.precioDia);
    const precioNoche = parseFloat(canchaSelect.selectedOptions[0].dataset.precioNoche);

    let total = 0;
    horasSeleccionadas.forEach(hora => {
      const horaInt = parseInt(hora.split(':')[0]);
      const esDia = horaInt >= 10 && horaInt < 18;
      total += esDia ? precioDia : precioNoche;
    });

    const adelanto = total / 2;

    // Guardar reserva en Firestore
    const reservaData = {
      usuarioId: auth.currentUser.uid,
      canchaId: canchaSelect.value,
      fecha: fechaInput.value,
      horas: horasSeleccionadas,
      precioTotal: total,
      adelanto,
      comprobanteURL,
      estado: 'pendiente',
      creadoEn: serverTimestamp()
    };

    await addDoc(collection(db, 'reservas'), reservaData);

    alert('Reserva enviada con éxito. Espera confirmación del administrador.');

    // Reset formulario
    canchaSelect.value = '';
    fechaInput.value = '';
    horasGrid.innerHTML = '';
    precioInfo.textContent = 'Selecciona una hora para ver el precio.';
    comprobanteInput.value = '';
    horasSeleccionadas = [];
    submitBtn.disabled = true;

  } catch (error) {
    console.error('Error al guardar la reserva', error);
    alert(error.message || 'Error al reservar');
    submitBtn.disabled = false;
  }
});
