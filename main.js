(function () {
  // --- Estado de la Aplicación ---
  let productos = [];
  let carrito = [];
  let historialCompras = [];
  let usuarioLogueado = null;
  let currentPage = 1;
  const itemsPerPage = 5; // Productos a mostrar por página

  // --- Selectores del DOM (se inicializarán en inicializarApp) ---
  let productosContainer,
    carritoItemsContainer,
    totalCompraSpan,
    btnVaciarCarrito,
    filtroBusquedaInput,
    userSection,
    btnPagar,
    historialSection,
    historialContainer,
    paginacionContainer;

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
   * Renderiza los productos en el contenedor de productos.
   * @param {Array} [productosAMostrar=productos] - La lista de productos a renderizar.
   */
  function renderizarProductos(productosAMostrar = productos) {
    productosContainer.innerHTML = "";

    // Calcular los productos para la página actual
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const productosEnPagina = productosAMostrar.slice(startIndex, endIndex);

    if (productosEnPagina.length === 0 && currentPage > 1) {
      // Si estamos en una página vacía (p.ej. después de un filtro), volvemos a la primera
      currentPage = 1;
      renderizarProductos(productosAMostrar);
      return;
    }
    productosEnPagina.forEach((producto) => {
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
          <span>- $${producto.precio.toFixed(2)}</span>
        </div>
        ${botonAgregar}
      </div>
    `;

      productosContainer.appendChild(productoDiv);
    });

    renderizarPaginacion(productosAMostrar);
  }

  /**
   * Renderiza los controles de paginación.
   * @param {Array} productosAMostrar - La lista completa de productos para calcular las páginas.
   */
  function renderizarPaginacion(productosAMostrar) {
    paginacionContainer.innerHTML = "";
    const totalPages = Math.ceil(productosAMostrar.length / itemsPerPage);

    if (totalPages <= 1) return; // No mostrar paginación si solo hay una página

    // Botón "Anterior"
    const btnPrev = document.createElement("button");
    btnPrev.textContent = "Anterior";
    btnPrev.className = "btn-pagina";
    btnPrev.disabled = currentPage === 1;
    btnPrev.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderizarProductos(productosAMostrar);
      }
    });
    paginacionContainer.appendChild(btnPrev);

    // Botones de número de página (se puede simplificar si hay muchas páginas)
    for (let i = 1; i <= totalPages; i++) {
      const btnPage = document.createElement("button");
      btnPage.textContent = i;
      btnPage.className = "btn-pagina";
      if (i === currentPage) {
        btnPage.classList.add("active");
      }
      btnPage.addEventListener("click", () => {
        currentPage = i;
        renderizarProductos(productosAMostrar);
      });
      paginacionContainer.appendChild(btnPage);
    }
    // Aquí se podría añadir un botón "Siguiente" de forma similar
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
    const infoSpan = productoDiv.querySelector(
      ".producto-info span:first-child"
    );
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

    if (carrito.length === 0) {
      btnVaciarCarrito.style.display = "none";
      carritoItemsContainer.innerHTML = "<li>El carrito está vacío.</li>";
    } else {
      btnVaciarCarrito.style.display = "block";
      carrito.forEach((item) => {
        const li = document.createElement("li");
        const subtotal = item.producto.precio * item.cantidad;
        li.innerHTML = `
          <span>
            ${item.cantidad} x ${
          item.producto.nombre
        } - Subtotal: $${subtotal.toFixed(2)}
          </span>
          <button class="btn-eliminar" data-id="${
            item.producto.id
          }">Eliminar</button>
        `;
        carritoItemsContainer.appendChild(li);
        totalCompra += subtotal;
      });
    }

    totalCompraSpan.textContent = totalCompra.toFixed(2);
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
      localStorage.setItem(
        "historialCompras",
        JSON.stringify(historialCompras)
      );
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
      text: `El total es de $${totalCompraSpan.textContent}. ¿Deseas continuar?`,
      icon: "question",
      html: `
        <p>El total es de <b>$${totalCompraSpan.textContent}</b>.</p>
        <select id="metodo-pago" class="swal2-select">
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
        return document.getElementById("metodo-pago").value;
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const metodoPago = result.value;

        // Crear registro para el historial
        const nuevaCompra = {
          fecha: new Date().toISOString(),
          items: [...carrito], // Copia del carrito
          total: parseFloat(totalCompraSpan.textContent),
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

  // --- Inicialización y Event Listeners ---
  async function inicializarApp() {
    // Inicializar selectores del DOM aquí para asegurar que el DOM esté cargado
    productosContainer = document.getElementById("productos-container");
    carritoItemsContainer = document.getElementById("carrito-items");
    totalCompraSpan = document.getElementById("total-compra");
    btnVaciarCarrito = document.getElementById("btn-vaciar-carrito");
    filtroBusquedaInput = document.getElementById("filtro-busqueda");
    userSection = document.getElementById("user-section");
    btnPagar = document.getElementById("btn-pagar");
    historialSection = document.getElementById("historial-compras");
    historialContainer = document.getElementById("historial-container");
    paginacionContainer = document.getElementById("paginacion-container");

    await inicializarProductos();
    cargarCarritoDeStorage();
    cargarHistorialDeStorage();
    renderizarProductos();
    renderizarCarrito();
    actualizarUIUsuario(); // Estado inicial de UI de usuario

    // Adjuntar event listeners después de inicializar los elementos
    productosContainer.addEventListener("click", handleProductClick);
    filtroBusquedaInput.addEventListener("input", handleSearch);
    carritoItemsContainer.addEventListener("click", handleCartClick);
    btnVaciarCarrito.addEventListener("click", vaciarCarrito);
    btnPagar.addEventListener("click", finalizarCompra);
  }

  productosContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-agregar")) {
      const productoId = parseInt(e.target.getAttribute("data-id"));
      agregarAlCarrito(productoId);
    }
  });

  filtroBusquedaInput.addEventListener("input", (e) => {
    currentPage = 1; // Resetear a la primera página al buscar
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

  // Iniciar la aplicación
  inicializarApp().catch((error) => {
    manejarError(error, "Ocurrió un error crítico al iniciar la aplicación.");
  });
})();
