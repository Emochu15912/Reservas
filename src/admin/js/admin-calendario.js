async function cargarReservas() {
  try {
    const snapshot = await window.db.collection("reservas").get();
    const eventos = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const fecha = data.fecha;
      const hora = data.horaInicio || '00:00';
      const estado = (data.estado || 'pendiente').toLowerCase();

      eventos.push({
        title: `Reserva - ${data.nombreCancha}`,
        start: `${fecha}T${hora}`,
        backgroundColor: {
          pendiente: '#fbc02d',
          confirmada: '#388e3c',
          rechazada: '#d32f2f'
        }[estado] || '#9e9e9e',
        borderColor: {
          pendiente: '#fbc02d',
          confirmada: '#388e3c',
          rechazada: '#d32f2f'
        }[estado] || '#9e9e9e',
        extendedProps: {
          estado,
          usuario: data.nombreUsuario || 'Desconocido',
          cancha: data.nombreCancha
        }
      });
    });

    return eventos;
  } catch (error) {
    console.error('Error cargando reservas:', error);
    return [];
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const calendarEl = document.getElementById('calendar');
  const eventos = await cargarReservas();

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'es',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek'
    },
    events: eventos,
    eventClick: info => {
      const ev = info.event.extendedProps;
      alert(`📅 Detalles de la Reserva:\n\nCancha: ${ev.cancha}\nUsuario: ${ev.usuario}\nEstado: ${ev.estado}`);
    }
  });

  calendar.render();
});
