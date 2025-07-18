// admin-exportar.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { firebaseConfig } from "../../common/js/firebase-config.js";

import * as XLSX from "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/xlsx.mjs";
import jsPDF from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.es.min.js";
import "https://cdn.jsdelivr.net/npm/jspdf-autotable@3.5.28/dist/jspdf.plugin.autotable.min.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referencias a botones
const btnReservasExcel = document.getElementById("export-reservas-excel");
const btnReservasPdf = document.getElementById("export-reservas-pdf");

const btnUsuariosExcel = document.getElementById("export-usuarios-excel");
const btnUsuariosPdf = document.getElementById("export-usuarios-pdf");

const btnCanchasExcel = document.getElementById("export-canchas-excel");
const btnCanchasPdf = document.getElementById("export-canchas-pdf");

// Funciones para obtener datos
async function obtenerReservas() {
  const snapshot = await getDocs(collection(db, "reservas"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function obtenerUsuarios() {
  const snapshot = await getDocs(collection(db, "usuarios"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function obtenerCanchas() {
  const snapshot = await getDocs(collection(db, "canchas"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Función para exportar a Excel
function exportarExcel(data, nombreArchivo, sheetName) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${nombreArchivo}.xlsx`);
}

// Función para exportar a PDF con jsPDF y autotable
function exportarPDF(data, columnas, titulo, nombreArchivo) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(titulo, 14, 22);

  doc.autoTable({
    startY: 30,
    head: [columnas],
    body: data.map(item => columnas.map(col => item[col] ?? '')),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [245, 183, 30] },
    alternateRowStyles: { fillColor: [255, 243, 204] },
    margin: { top: 30 }
  });

  doc.save(`${nombreArchivo}.pdf`);
}

// Listeners botones

btnReservasExcel.addEventListener("click", async () => {
  const reservas = await obtenerReservas();
  if (!reservas.length) return alert("No hay reservas para exportar.");

  // Filtrar campos a exportar
  const datos = reservas.map(r => ({
    ID: r.id,
    Usuario: r.nombreUsuario || '',
    Cancha: r.nombreCancha || '',
    Fecha: r.fecha || '',
    Hora: r.horaInicio || '',
    Estado: r.estado || ''
  }));

  exportarExcel(datos, "Reservas", "Reservas");
});

btnReservasPdf.addEventListener("click", async () => {
  const reservas = await obtenerReservas();
  if (!reservas.length) return alert("No hay reservas para exportar.");

  const columnas = ["ID", "Usuario", "Cancha", "Fecha", "Hora", "Estado"];
  const datos = reservas.map(r => ({
    ID: r.id,
    Usuario: r.nombreUsuario || '',
    Cancha: r.nombreCancha || '',
    Fecha: r.fecha || '',
    Hora: r.horaInicio || '',
    Estado: r.estado || ''
  }));

  exportarPDF(datos, columnas, "Listado de Reservas", "Reservas");
});

btnUsuariosExcel.addEventListener("click", async () => {
  const usuarios = await obtenerUsuarios();
  if (!usuarios.length) return alert("No hay usuarios para exportar.");

  const datos = usuarios.map(u => ({
    ID: u.id,
    Nombre: u.nombre || '',
    Email: u.email || '',
    Rol: u.rol || ''
  }));

  exportarExcel(datos, "Usuarios", "Usuarios");
});

btnUsuariosPdf.addEventListener("click", async () => {
  const usuarios = await obtenerUsuarios();
  if (!usuarios.length) return alert("No hay usuarios para exportar.");

  const columnas = ["ID", "Nombre", "Email", "Rol"];
  const datos = usuarios.map(u => ({
    ID: u.id,
    Nombre: u.nombre || '',
    Email: u.email || '',
    Rol: u.rol || ''
  }));

  exportarPDF(datos, columnas, "Listado de Usuarios", "Usuarios");
});

btnCanchasExcel.addEventListener("click", async () => {
  const canchas = await obtenerCanchas();
  if (!canchas.length) return alert("No hay canchas para exportar.");

  const datos = canchas.map(c => ({
    ID: c.id,
    Nombre: c.nombre || '',
    Ubicación: c.ubicacion || '',
    Capacidad: c.capacidad || '',
    Estado: c.estado || ''
  }));

  exportarExcel(datos, "Canchas", "Canchas");
});

btnCanchasPdf.addEventListener("click", async () => {
  const canchas = await obtenerCanchas();
  if (!canchas.length) return alert("No hay canchas para exportar.");

  const columnas = ["ID", "Nombre", "Ubicación", "Capacidad", "Estado"];
  const datos = canchas.map(c => ({
    ID: c.id,
    Nombre: c.nombre || '',
    Ubicación: c.ubicacion || '',
    Capacidad: c.capacidad || '',
    Estado: c.estado || ''
  }));

  exportarPDF(datos, columnas, "Listado de Canchas", "Canchas");
});
