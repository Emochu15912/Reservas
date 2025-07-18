// usuarios.js

const userTableBody = document.getElementById("userTableBody");

async function cargarUsuarios() {
  try {
    const snapshot = await db.collection("usuarios").get();
    userTableBody.innerHTML = "";

    snapshot.forEach((userDoc) => {
      const user = userDoc.data();
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${user.nombre || "Sin nombre"}</td>
        <td>${user.email || "Sin correo"}</td>
        <td>
          <select class="role-select" onchange="cambiarRol('${userDoc.id}', this.value)">
            <option value="usuario" ${user.rol === "usuario" ? "selected" : ""}>Usuario</option>
            <option value="admin" ${user.rol === "admin" ? "selected" : ""}>Admin</option>
          </select>
        </td>
        <td class="acciones">
          <button onclick="eliminarUsuario('${userDoc.id}')" title="Eliminar usuario">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      `;

      userTableBody.appendChild(tr);
    });
  } catch (error) {
    console.error("Error cargando usuarios:", error);
  }
}

window.cargarUsuarios = cargarUsuarios;

window.cambiarRol = async (userId, nuevoRol) => {
  try {
    await db.collection("usuarios").doc(userId).update({ rol: nuevoRol });
    alert("Rol actualizado correctamente");
  } catch (error) {
    console.error("Error actualizando rol:", error);
    alert("Error al actualizar rol, intenta de nuevo.");
  }
};

window.eliminarUsuario = async (userId) => {
  if (confirm("¿Estás seguro de eliminar este usuario?")) {
    try {
      await db.collection("usuarios").doc(userId).delete();
      alert("Usuario eliminado correctamente");
      cargarUsuarios();
    } catch (error) {
      console.error("Error eliminando usuario:", error);
      alert("Error al eliminar usuario, intenta de nuevo.");
    }
  }
};

window.filterUsers = () => {
  const input = document.getElementById("searchInput").value.toLowerCase();
  const rows = userTableBody.getElementsByTagName("tr");

  for (let row of rows) {
    const name = row.cells[0].textContent.toLowerCase();
    const email = row.cells[1].textContent.toLowerCase();
    row.style.display = (name.includes(input) || email.includes(input)) ? "" : "none";
  }
};

window.addEventListener("DOMContentLoaded", () => {
  cargarUsuarios();
});
