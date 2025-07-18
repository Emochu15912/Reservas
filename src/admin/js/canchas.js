// canchas.js

if (!window.firebase) {
  alert('Firebase no está cargado correctamente.');
  throw new Error('Firebase no está definido');
}

if (!window.db) {
  window.db = firebase.firestore();
}

const db = window.db;

const listaCanchas = document.getElementById('lista-canchas');
const modalForm = document.getElementById('modal-form-cancha');
const loadingOverlay = document.getElementById('loading-overlay');

let formSubmitListener = null;
let btnCerrarListener = null;
let overlayClickListener = null;
let escKeyListener = null;

// Canchas fijas para Hepsú
const CANCHAS_PREDETERMINADAS = [
  { tipo: 'Fútbol', nombre: 'Cancha de Fútbol', descripcion: 'Cancha de fútbol estándar' },
  { tipo: 'Vóley', nombre: 'Cancha de Vóley', descripcion: 'Cancha de vóley techada' }
];

// Cargar canchas de Firestore
function cargarCanchas() {
  listaCanchas.innerHTML = '<p>Cargando canchas...</p>';

  db.collection('canchas')
    .where('lugar', '==', 'Hepsú')
    // .orderBy('nombre') // Comentado para evitar error de índice
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        listaCanchas.innerHTML = '<p>No hay canchas registradas para Hepsú.</p>';
        return;
      }

      listaCanchas.innerHTML = '';
      snapshot.forEach(doc => {
        const cancha = { id: doc.id, ...doc.data() };
        listaCanchas.appendChild(crearCardCancha(cancha));
      });
    })
    .catch(error => {
      console.error('Error cargando canchas:', error);
      listaCanchas.innerHTML = '<p>Error al cargar canchas. Intenta nuevamente.</p>';
    });
}


// Crear la tarjeta visual de una cancha con botón de editar
function crearCardCancha(cancha) {
  const card = document.createElement('div');
  card.className = 'cancha-card';

  card.innerHTML = `
    <div class="cancha-info">
      <h3>${escapeHtml(cancha.nombre)} (${escapeHtml(cancha.tipo)})</h3>
      <p><strong>Ubicación:</strong> ${escapeHtml(cancha.ubicacion)}</p>
      <p><strong>Precio Día (10am-5pm):</strong> S/ ${cancha.precioDia.toFixed(2)}</p>
      <p><strong>Precio Noche (6pm-11pm):</strong> S/ ${cancha.precioNoche.toFixed(2)}</p>
      <p><strong>Disponibilidad:</strong> ${cancha.disponibilidad ? 'Disponible' : 'No disponible'}</p>
    </div>
    <button class="btn-editar" aria-label="Editar ${escapeHtml(cancha.nombre)}" title="Editar ${escapeHtml(cancha.nombre)}" >
      <i class="bi bi-pencil-square"></i> Editar
    </button>
  `;

  const btnEditar = card.querySelector('.btn-editar');
  btnEditar.addEventListener('click', () => abrirFormularioCancha(cancha));

  return card;
}

// Escapar HTML para seguridad
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Abrir formulario modal para agregar o editar canchas
function abrirFormularioCancha(cancha) {
  document.body.style.overflow = 'hidden';

  // Si cancha es null => crear nuevo set, sino editar
  const isEdit = Boolean(cancha);

  // Solo dos canchas fijas, para edición precargamos datos, para creación vacíos
  modalForm.innerHTML = `
    <div class="modal-overlay" tabindex="-1"></div>
    <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="0">
      <h2 id="modal-title">${isEdit ? 'Editar Precios - ' + escapeHtml(cancha.nombre) : 'Agregar / Editar Precios para Canchas - Hepsú'}</h2>
      <form id="form-cancha" novalidate>
        <p>Configura los precios para cada cancha (día: 10am-5pm, noche: 6pm-11pm)</p>
        ${isEdit ? `
          <fieldset>
            <legend><strong>${escapeHtml(cancha.nombre)} (${escapeHtml(cancha.tipo)})</strong></legend>
            <label for="precio-dia">Precio Día (S/):</label>
            <input type="number" id="precio-dia" name="precioDia" min="0" step="0.1" placeholder="Ej. 50" required autocomplete="off" value="${cancha.precioDia || ''}" />
            <label for="precio-noche">Precio Noche (S/):</label>
            <input type="number" id="precio-noche" name="precioNoche" min="0" step="0.1" placeholder="Ej. 70" required autocomplete="off" value="${cancha.precioNoche || ''}" />
          </fieldset>
        ` : CANCHAS_PREDETERMINADAS.map((c, i) => `
          <fieldset>
            <legend><strong>${escapeHtml(c.nombre)} (${escapeHtml(c.tipo)})</strong></legend>
            <label for="precio-dia-${i}">Precio Día (S/):</label>
            <input type="number" id="precio-dia-${i}" name="precioDia-${i}" min="0" step="0.1" placeholder="Ej. 50" required autocomplete="off" />
            <label for="precio-noche-${i}">Precio Noche (S/):</label>
            <input type="number" id="precio-noche-${i}" name="precioNoche-${i}" min="0" step="0.1" placeholder="Ej. 70" required autocomplete="off" />
          </fieldset>
        `).join('')}
        <div class="modal-actions">
          <button type="submit" class="btn-guardar" aria-label="Guardar precios">
            <i class="bi bi-check2-circle"></i> Guardar
          </button>
          <button type="button" class="btn-cancelar" aria-label="Cancelar y cerrar formulario">Cancelar</button>
        </div>
      </form>
    </div>
  `;

  modalForm.classList.add('active');
  modalForm.setAttribute('aria-hidden', 'false');

  // Focus al primer input
  const primerInput = modalForm.querySelector('input');
  if (primerInput) primerInput.focus();

  // Listeners
  const form = modalForm.querySelector('#form-cancha');
  if (formSubmitListener) form.removeEventListener('submit', formSubmitListener);
  formSubmitListener = async (e) => {
    e.preventDefault();
    await guardarPrecios(cancha);
  };
  form.addEventListener('submit', formSubmitListener);

  const btnCancelar = modalForm.querySelector('.btn-cancelar');
  if (btnCerrarListener) btnCancelar.removeEventListener('click', btnCerrarListener);
  btnCerrarListener = () => cerrarFormularioCancha();
  btnCancelar.addEventListener('click', btnCerrarListener);

  const overlay = modalForm.querySelector('.modal-overlay');
  if (overlayClickListener) overlay.removeEventListener('click', overlayClickListener);
  overlayClickListener = () => cerrarFormularioCancha();
  overlay.addEventListener('click', overlayClickListener);

  if (escKeyListener) document.removeEventListener('keydown', escKeyListener);
  escKeyListener = (e) => {
    if (e.key === 'Escape') {
      cerrarFormularioCancha();
    }
  };
  document.addEventListener('keydown', escKeyListener);
}

// Cerrar modal y limpiar listeners
function cerrarFormularioCancha() {
  modalForm.classList.remove('active');
  modalForm.setAttribute('aria-hidden', 'true');
  modalForm.innerHTML = '';
  document.body.style.overflow = 'auto';

  if (formSubmitListener) formSubmitListener = null;
  if (btnCerrarListener) btnCerrarListener = null;
  if (overlayClickListener) overlayClickListener = null;
  if (escKeyListener) {
    document.removeEventListener('keydown', escKeyListener);
    escKeyListener = null;
  }
}

// Guardar precios a Firestore (crear o actualizar)
async function guardarPrecios(canchaEditar) {
  mostrarLoading(true, 'Guardando precios...');

  try {
    if (canchaEditar) {
      // Solo un cancha, actualizar esa
      const precioDia = parseFloat(document.getElementById('precio-dia').value);
      const precioNoche = parseFloat(document.getElementById('precio-noche').value);

      if (isNaN(precioDia) || precioDia < 0 || isNaN(precioNoche) || precioNoche < 0) {
        alert('Por favor ingresa precios válidos para día y noche.');
        mostrarLoading(false);
        return;
      }

      // Actualizar en Firestore
      await db.collection('canchas').doc(canchaEditar.id).update({
        precioDia,
        precioNoche,
        disponibilidad: true
      });

      alert(`Precios actualizados para ${canchaEditar.nombre}.`);
    } else {
      // Múltiples canchas (las dos fijas)
      const precios = [];

      for (let i = 0; i < CANCHAS_PREDETERMINADAS.length; i++) {
        const precioDiaInput = document.getElementById(`precio-dia-${i}`);
        const precioNocheInput = document.getElementById(`precio-noche-${i}`);

        const precioDia = parseFloat(precioDiaInput.value);
        const precioNoche = parseFloat(precioNocheInput.value);

        if (isNaN(precioDia) || precioDia < 0 || isNaN(precioNoche) || precioNoche < 0) {
          alert(`Por favor, ingresa precios válidos para la cancha: ${CANCHAS_PREDETERMINADAS[i].nombre}`);
          mostrarLoading(false);
          return;
        }

        precios.push({
          ...CANCHAS_PREDETERMINADAS[i],
          precioDia,
          precioNoche,
          disponibilidad: true,
          ubicacion: 'Av. Confraternidad 35, 03701',
          lugar: 'Hepsú'
        });
      }

      // Guardar o actualizar cada cancha
      for (const cancha of precios) {
        const query = await db.collection('canchas')
          .where('nombre', '==', cancha.nombre)
          .limit(1)
          .get();

        if (!query.empty) {
          await db.collection('canchas').doc(query.docs[0].id).update(cancha);
        } else {
          await db.collection('canchas').add(cancha);
        }
      }

      alert('¡Canchas guardadas correctamente!');
    }

    cerrarFormularioCancha();
    cargarCanchas();

  } catch (error) {
    console.error('Error al guardar cancha:', error);
    alert('Error al guardar las canchas. Inténtalo nuevamente.');
  } finally {
    mostrarLoading(false);
  }
}

// Mostrar u ocultar pantalla de carga
function mostrarLoading(mostrar, texto = '') {
  if (mostrar) {
    loadingOverlay.classList.add('active');
    loadingOverlay.setAttribute('aria-hidden', 'false');
    if (texto) loadingOverlay.querySelector('.loader').setAttribute('aria-label', texto);
  } else {
    loadingOverlay.classList.remove('active');
    loadingOverlay.setAttribute('aria-hidden', 'true');
  }
}

// Inicialización al cargar página
document.addEventListener('DOMContentLoaded', () => {
  cargarCanchas();
});
