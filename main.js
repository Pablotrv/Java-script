// --- Estado de la Aplicación ---
let productos = [];
let carrito = [];
let historialCompras = [];
let usuarioLogueado = null;
let cotizacionDolar = null; // Para almacenar la cotización
let monedaActual = "ARS"; // Moneda por defecto: 'ARS' o 'USD'

// --- Selectores del DOM ---
const productosContainer = document.getElementById("productos-container");
const carritoItemsContainer = document.getElementById("carrito-items");
const totalCompraSpan = document.getElementById("total-compra");
const btnVaciarCarrito = document.getElementById("btn-vaciar-carrito");
const filtroBusquedaInput = document.getElementById("filtro-busqueda");
const userSection = document.getElementById("user-section");
const btnPagar = document.getElementById("btn-pagar");
const historialSection = document.getElementById("historial-compras");
const historialContainer = document.getElementById("historial-container");
const dolarInfoContainer = document.getElementById("dolar-info");
const monedaSwitch = document.getElementById("moneda-switch");
const themeSwitch = document.getElementById("theme-switch");

// --- Funciones ---

/**
 * Maneja los errores de forma centralizada.
 * Muestra un mensaje amigable al usuario y registra el error técnico en la consola.
 * @param {Error} error - El objeto de error capturado.
 * @param {string} mensajeUsuario - El mensaje a mostrar al usuario.
 */
function manejarError(error, mensajeUsuario) {
  console.error("Ocurrió un error:", error); // Para depuración
  mostrarNotificacion(
    mensajeUsuario ||
      "Ha ocurrido un error inesperado. Por favor, intenta de nuevo.",
    "error"
  );
}

/**
 * Formatea un precio a la moneda actual.
 * @param {number} precio - El precio en USD (base).
 * @returns {string} - El precio formateado con el símbolo de la moneda.
 */
function formatearPrecio(precio) {
  if (monedaActual === "ARS") {
    if (cotizacionDolar) {
      const precioEnPesos = precio * cotizacionDolar;
      return `$${precioEnPesos.toFixed(2)}`;
    } else {
      // Si aún no se cargó la cotización
      return "Calculando...";
    }
  } else {
    // Moneda es USD
    return `U$S ${precio.toFixed(2)}`;
  }
}

/**
 * Renderiza los productos en el contenedor de productos.
 * @param {Array} [productosAMostrar=productos] - La lista de productos a renderizar.
 */
function renderizarProductos(productosAMostrar = productos) {
  productosContainer.innerHTML = ""; // Limpiar para re-renderizar
  productosAMostrar.forEach((producto) => {
    const productoDiv = document.createElement("div");
    productoDiv.classList.add("producto");
    productoDiv.dataset.id = producto.id; // Identificador para la animación

    if (producto.stock === 0) {
      productoDiv.classList.add("sin-stock");
    }

    const botonAgregar =
      producto.stock > 0
        ? `<button class="btn-agregar" data-id="${producto.id}">Agregar</button>`
        : `<button class="btn-agregar" disabled>Sin stock</button>`;

    productoDiv.innerHTML = `
      <img src="${producto.imagen}" alt="${
      producto.nombre
    }" class="producto-imagen">
      <div class="producto-contenido">
        <div class="producto-info">
          <span>${producto.nombre} (Stock: ${producto.stock})</span>
          <span>- ${formatearPrecio(producto.precio)}</span>
        </div>
        ${botonAgregar}
      </div>
    `;

    productosContainer.appendChild(productoDiv);
  });
}

/**
 * Actualiza la vista de un único producto en el DOM sin recargar toda la lista.
 * @param {number} productoId - El ID del producto a actualizar.
 */
function actualizarVistaProducto(productoId) {
  const producto = productos.find((p) => p.id === productoId);
  if (!producto) return;

  const productoDiv = productosContainer.querySelector(
    `.producto[data-id="${productoId}"]`
  );
  if (!productoDiv) return;

  // Actualizar el texto del stock
  const infoSpan = productoDiv.querySelector(".producto-info span:first-child");
  if (infoSpan) {
    infoSpan.textContent = `${producto.nombre} (Stock: ${producto.stock})`;
  }

  // Actualizar el botón
  const boton = productoDiv.querySelector(".btn-agregar");
  if (boton) {
    if (producto.stock > 0) {
      boton.disabled = false;
      boton.textContent = "Agregar";
    } else {
      boton.disabled = true;
      boton.textContent = "Sin stock";
      productoDiv.classList.add("sin-stock");
    }
  }
}

/**
 * Agrega un producto al carrito o incrementa su cantidad si ya existe.
 * @param {number} productoId - El ID del producto a agregar.
 */
function agregarAlCarrito(productoId) {
  try {
    const productoEnStock = productos.find((p) => p.id === productoId);

    if (!productoEnStock || productoEnStock.stock <= 0) {
      return; // No hacer nada si no hay producto o stock
    }

    const itemEnCarrito = carrito.find(
      (item) => item.producto.id === productoId
    );

    if (itemEnCarrito) {
      itemEnCarrito.cantidad++;
    } else {
      // Clonamos el producto para no modificar el original en el carrito
      const productoParaCarrito = { ...productoEnStock };
      delete productoParaCarrito.stock; // No es necesario en el carrito
      carrito.push({ producto: productoParaCarrito, cantidad: 1 });
    }

    // Reducir stock y guardar
    productoEnStock.stock--;

    guardarProductosEnStorage();
    actualizarVistaProducto(productoId);
    renderizarCarrito();
    guardarCarritoEnStorage();

    // Notificar si el producto se agota
    if (productoEnStock.stock === 0) {
      mostrarNotificacion(
        `¡El producto "${productoEnStock.nombre}" se ha agotado!`,
        "warning"
      );
    }

    // Aplicar animación de "flash" al producto agregado
    const productoDiv = productosContainer.querySelector(
      `.producto[data-id="${productoId}"]`
    );
    if (productoDiv) {
      productoDiv.classList.add("producto-agregado-animacion");
      // Quitar la clase después de que la animación termine para poder reutilizarla
      setTimeout(() => {
        productoDiv.classList.remove("producto-agregado-animacion");
      }, 700); // 700ms, igual que la duración de la animación
    }
  } catch (error) {
    manejarError(error, "No se pudo agregar el producto al carrito.");
  }
}

/**
 * Renderiza los items del carrito y actualiza el total.
 */
function renderizarCarrito() {
  carritoItemsContainer.innerHTML = ""; // Limpiar el carrito antes de renderizar
  let totalCompra = 0;

  if (carrito.length === 0 || !cotizacionDolar) {
    btnVaciarCarrito.style.display = "none";
    carritoItemsContainer.innerHTML = "<li>El carrito está vacío.</li>";
  } else {
    btnVaciarCarrito.style.display = "block";
    carrito.forEach((item) => {
      const li = document.createElement("li");
      const subtotal = item.producto.precio * item.cantidad;
      // Agregamos la imagen del producto al elemento de la lista
      li.innerHTML = `
          <img src="${item.producto.imagen}" alt="${
        item.producto.nombre
      }" class="carrito-item-imagen">
          <div class="carrito-item-info">
            ${item.cantidad} x ${item.producto.nombre}
            <span class="carrito-item-subtotal">Subtotal: ${formatearPrecio(
              subtotal
            )}</span>
          </div>
          <button class="btn-eliminar" data-id="${
            item.producto.id
          }">Eliminar</button>
        `;
      carritoItemsContainer.appendChild(li);
      totalCompra += subtotal;
    });
  }

  totalCompraSpan.textContent = formatearPrecio(totalCompra);
}

/**
 * Elimina un producto completamente del carrito y devuelve su stock.
 * @param {number} productoId - El ID del producto a eliminar.
 */
function eliminarDelCarrito(productoId) {
  try {
    const itemIndex = carrito.findIndex(
      (item) => item.producto.id === productoId
    );

    if (itemIndex > -1) {
      const itemEliminado = carrito[itemIndex];
      const productoEnStock = productos.find((p) => p.id === productoId);

      // Devolver el stock al producto original
      if (productoEnStock) {
        productoEnStock.stock += itemEliminado.cantidad;
      }

      // Eliminar el item del carrito
      carrito.splice(itemIndex, 1);

      mostrarNotificacion(
        `"${itemEliminado.producto.nombre}" eliminado del carrito.`,
        "error"
      );

      // Actualizar todo
      guardarProductosEnStorage();
      guardarCarritoEnStorage();
      actualizarVistaProducto(productoId);
      renderizarCarrito();
    }
  } catch (error) {
    manejarError(error, "No se pudo eliminar el producto del carrito.");
  }
}

/**
 * Vacía completamente el carrito.
 */
function vaciarCarrito() {
  if (carrito.length === 0) return;

  Swal.fire({
    title: "¿Estás seguro?",
    text: "Esta acción eliminará todos los productos de tu carrito.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sí, vaciar carrito",
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      // Devolver el stock de todos los items del carrito
      carrito.forEach((item) => {
        const productoEnStock = productos.find(
          (p) => p.id === item.producto.id
        );
        if (productoEnStock) {
          productoEnStock.stock += item.cantidad;
          actualizarVistaProducto(productoEnStock.id);
        }
      });

      carrito = [];
      guardarCarritoEnStorage();
      guardarProductosEnStorage();
      renderizarCarrito();
      mostrarNotificacion("El carrito ha sido vaciado.", "info");
    }
  });
}
/**
 * Guarda el estado actual del carrito en localStorage.
 */
function guardarCarritoEnStorage() {
  try {
    localStorage.setItem("carrito", JSON.stringify(carrito));
  } catch (error) {
    manejarError(
      error,
      "No se pudo guardar el carrito. El almacenamiento podría estar lleno."
    );
  }
}

/**
 * Carga el carrito desde localStorage al iniciar la página.
 */
function cargarCarritoDeStorage() {
  try {
    const carritoGuardado = localStorage.getItem("carrito");
    if (carritoGuardado) {
      carrito = JSON.parse(carritoGuardado);
    }
  } catch (error) {
    carrito = []; // Reiniciar si hay un error
    manejarError(
      error,
      "No se pudo cargar el carrito guardado. Se ha iniciado un carrito nuevo."
    );
  }
}

/**
 * Guarda el estado de los productos (con su stock) en localStorage.
 */
function guardarProductosEnStorage() {
  try {
    localStorage.setItem("productos", JSON.stringify(productos));
  } catch (error) {
    manejarError(
      error,
      "No se pudo guardar el estado de los productos. El almacenamiento podría estar lleno."
    );
  }
}

/**
 * Carga los productos desde un JSON externo o desde localStorage si ya existen.
 */
async function inicializarProductos() {
  try {
    const productosGuardados = localStorage.getItem("productos");
    if (productosGuardados) {
      productos = JSON.parse(productosGuardados);
      console.log("Productos cargados desde localStorage.");
    } else {
      // Si no hay en localStorage, los cargamos del JSON
      const response = await fetch("productos.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      productos = await response.json();
      guardarProductosEnStorage(); // Guardamos la lista inicial en storage
      console.log("Productos cargados desde productos.json.");
    }
  } catch (error) {
    productos = []; // Dejar la lista vacía si todo falla
    manejarError(error, "No se pudieron cargar los productos.");
  }
}

/**
 * Guarda el historial de compras en localStorage.
 */
function guardarHistorialEnStorage() {
  try {
    localStorage.setItem("historialCompras", JSON.stringify(historialCompras));
  } catch (error) {
    manejarError(error, "No se pudo guardar el historial de compras.");
  }
}

/**
 * Carga el historial de compras desde localStorage.
 */
function cargarHistorialDeStorage() {
  try {
    const historialGuardado = localStorage.getItem("historialCompras");
    if (historialGuardado) {
      historialCompras = JSON.parse(historialGuardado);
    }
  } catch (error) {
    historialCompras = [];
    manejarError(error, "No se pudo cargar el historial de compras.");
  }
}

/**
 * Renderiza el historial de compras en el DOM.
 */
function renderizarHistorial() {
  historialContainer.innerHTML = "";
  if (historialCompras.length === 0) {
    historialContainer.innerHTML =
      "<p>Aún no has realizado ninguna compra.</p>";
    return;
  }

  // Mostrar las compras más recientes primero
  [...historialCompras].reverse().forEach((compra) => {
    const compraDiv = document.createElement("div");
    compraDiv.className = "compra-historial";
    const itemsHtml = compra.items
      .map((item) => `<li>${item.cantidad} x ${item.producto.nombre}</li>`)
      .join("");

    compraDiv.innerHTML = `
        <p><b>Fecha:</b> ${new Date(compra.fecha).toLocaleString()}</p>
        <p><b>Total:</b> $${compra.total.toFixed(2)}</p>
        <p><b>Método de pago:</b> ${compra.metodoPago}</p>
        <p><b>Items:</b></p>
        <ul>${itemsHtml}</ul>
      `;
    historialContainer.appendChild(compraDiv);
  });
}

/**
 * Finaliza la compra, muestra un resumen y reinicia el estado.
 */
function finalizarCompra() {
  if (!usuarioLogueado) {
    mostrarNotificacion("Debes iniciar sesión para comprar", "warning");
    return;
  }

  if (carrito.length === 0) {
    Swal.fire({
      icon: "error",
      title: "Carrito vacío",
      text: "¡Necesitas agregar productos antes de poder pagar!",
      confirmButtonColor: "#007bff",
    });
    return;
  }

  Swal.fire({
    title: "Confirmar Compra",
    icon: "question",
    html: `
        <p>El total es de <b>${monedaActual === "ARS" ? "$" : "U$S "}${
      totalCompraSpan.textContent
    }</b>.</p>
        <select id="metodo-pago" class="swal2-select">
          <option value="" disabled selected>Selecciona un método de pago</option>
          <option value="tarjeta">Tarjeta de Crédito/Débito</option>
          <option value="efectivo">Efectivo</option>
          <option value="mercadopago">MercadoPago</option>
        </select>
      `,
    showCancelButton: true,
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#dc3545",
    confirmButtonText: "Sí, pagar",
    cancelButtonText: "Cancelar",
    preConfirm: () => {
      const metodo = document.getElementById("metodo-pago").value;
      if (!metodo) {
        Swal.showValidationMessage("Por favor, selecciona un método de pago");
        return false;
      }
      return metodo;
    },
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      const metodoPago = result.value;

      // Crear registro para el historial
      const nuevaCompra = {
        fecha: new Date().toISOString(),
        items: [...carrito], // Copia del carrito
        total:
          monedaActual === "USD"
            ? parseFloat(totalCompraSpan.textContent)
            : parseFloat(totalCompraSpan.textContent) / cotizacionDolar,
        metodoPago: metodoPago,
      };
      historialCompras.push(nuevaCompra);

      // Reiniciar el estado
      carrito = [];
      guardarProductosEnStorage(); // Guardamos el nuevo stock de productos
      guardarCarritoEnStorage(); // Guardar el carrito vacío en storage
      guardarHistorialEnStorage();
      renderizarCarrito();
      renderizarHistorial();

      Swal.fire({
        title: `¡Compra realizada con ${
          metodoPago.charAt(0).toUpperCase() + metodoPago.slice(1)
        }!`,
        text: `Gracias por tu compra, ${usuarioLogueado}. Te enviaremos los detalles al correo.`,
        icon: "success",
        confirmButtonColor: "#28a745",
      });
    }
  });
}

/**
 * Simula el inicio de sesión de un usuario.
 */
async function iniciarSesion() {
  try {
    const { value: formValues } = await Swal.fire({
      title: "Iniciar Sesión",
      html: `
          <input id="swal-input1" class="swal2-input" placeholder="Usuario">
          <input id="swal-input2" type="password" class="swal2-input" placeholder="Contraseña">
        `,
      focusConfirm: false,
      preConfirm: () => {
        return [
          document.getElementById("swal-input1").value,
          document.getElementById("swal-input2").value,
        ];
      },
    });

    if (formValues && formValues[0]) {
      usuarioLogueado = formValues[0]; // Guardamos el nombre de usuario
      mostrarNotificacion(`¡Bienvenido, ${usuarioLogueado}!`, "success");
      actualizarUIUsuario();
      renderizarHistorial(); // Mostrar historial al iniciar sesión
      historialSection.style.display = "block";
    }
  } catch (error) {
    manejarError(error, "No se pudo completar el inicio de sesión.");
  }
}

/**
 * Simula el cierre de sesión.
 */
function cerrarSesion() {
  mostrarNotificacion(`¡Hasta luego, ${usuarioLogueado}!`, "info");
  usuarioLogueado = null;
  historialSection.style.display = "none"; // Ocultar historial
  historialContainer.innerHTML = "";
  actualizarUIUsuario();
}

/**
 * Actualiza la interfaz de usuario según el estado de login.
 */
function actualizarUIUsuario() {
  if (usuarioLogueado) {
    userSection.innerHTML = `<span>Hola, ${usuarioLogueado}</span> <button id="btn-logout">Cerrar Sesión</button>`;
    document
      .getElementById("btn-logout")
      .addEventListener("click", cerrarSesion);
    btnPagar.disabled = false;
  } else {
    userSection.innerHTML = `<button id="btn-login">Iniciar Sesión</button>`;
    document
      .getElementById("btn-login")
      .addEventListener("click", iniciarSesion);
    btnPagar.disabled = true;
  }
}

/**
 * Muestra una notificación tipo "toast" en la pantalla.
 * @param {string} mensaje - El mensaje a mostrar.
 * @param {string} [tipo='info'] - El tipo de notificación ('info', 'success', 'error', 'warning').
 */
function mostrarNotificacion(mensaje, tipo = "info") {
  Swal.fire({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    icon: tipo,
    title: mensaje,
  });
}

/**
 * Obtiene la cotización del dólar blue en tiempo real y la muestra en el DOM.
 */
async function obtenerCotizacionDolar() {
  try {
    const response = await fetch("https://dolarapi.com/v1/dolares/blue");
    if (!response.ok) {
      throw new Error("No se pudo obtener la cotización del dólar.");
    }
    const data = await response.json();

    const { venta, fechaActualizacion } = data;
    cotizacionDolar = venta; // Guardamos la cotización

    const fechaFormateada = new Date(fechaActualizacion).toLocaleString(
      "es-AR"
    );

    dolarInfoContainer.innerHTML = `
        <strong>Dólar Blue:</strong> $${venta} (Venta) <br>
        <small>Actualizado: ${fechaFormateada}</small>
      `;
    // Re-renderizar productos y carrito por si la moneda es ARS
    renderizarProductos();
    renderizarCarrito();
  } catch (error) {
    console.error("Error al obtener cotización:", error);
    dolarInfoContainer.textContent = "No se pudo cargar la cotización.";
  }
}

/**
 * Aplica el tema (claro/oscuro) y guarda la preferencia.
 * @param {boolean} isDarkMode - True si el modo oscuro debe estar activado.
 */
function aplicarTema(isDarkMode) {
  if (isDarkMode) {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
  try {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  } catch (error) {
    console.error("No se pudo guardar la preferencia de tema.", error);
  }
}

/**
 * Carga la preferencia de tema desde localStorage al iniciar.
 */
function cargarTema() {
  try {
    const temaGuardado = localStorage.getItem("theme");
    if (temaGuardado === "dark") {
      themeSwitch.checked = true;
      aplicarTema(true);
    } else {
      themeSwitch.checked = false;
      aplicarTema(false);
    }
  } catch (error) {
    console.error("No se pudo cargar la preferencia de tema.", error);
  }
}

// --- Inicialización y Event Listeners ---
async function inicializarApp() {
  try {
    cargarTema(); // Cargar el tema al inicio, antes que nada
    await obtenerCotizacionDolar(); // Obtener la cotización al iniciar
    await inicializarProductos();
    cargarCarritoDeStorage();
    cargarHistorialDeStorage();
    renderizarProductos();
    renderizarCarrito();
    actualizarUIUsuario(); // Estado inicial de UI de usuario

    productosContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-agregar")) {
        const productoId = parseInt(e.target.getAttribute("data-id"));
        agregarAlCarrito(productoId);
      }
    });

    filtroBusquedaInput.addEventListener("input", (e) => {
      const terminoBusqueda = e.target.value.toLowerCase();
      const productosFiltrados = productos.filter((producto) =>
        producto.nombre.toLowerCase().includes(terminoBusqueda)
      );
      renderizarProductos(productosFiltrados);
    });

    carritoItemsContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-eliminar")) {
        const productoId = parseInt(e.target.getAttribute("data-id"));
        eliminarDelCarrito(productoId);
      }
    });

    btnVaciarCarrito.addEventListener("click", vaciarCarrito);

    btnPagar.addEventListener("click", finalizarCompra);

    monedaSwitch.addEventListener("change", (e) => {
      monedaActual = e.target.checked ? "USD" : "ARS";
      // Re-renderizar todo para reflejar el cambio de moneda
      renderizarProductos();
      renderizarCarrito();
    });

    themeSwitch.addEventListener("change", (e) => {
      aplicarTema(e.target.checked);
    });
  } catch (error) {
    manejarError(error, "Ocurrió un error crítico al iniciar la aplicación.");
  }
}

// Iniciar la aplicación
inicializarApp();
