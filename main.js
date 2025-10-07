(function () {
  // --- Estado de la Aplicación ---
  let productos = [];
  let carrito = [];
  let usuarioLogueado = null;

  // --- Selectores del DOM ---
  const productosContainer = document.getElementById("productos-container");
  const carritoItemsContainer = document.getElementById("carrito-items");
  const totalCompraSpan = document.getElementById("total-compra");
  const filtroBusquedaInput = document.getElementById("filtro-busqueda");
  const userSection = document.getElementById("user-section");
  const btnLogin = document.getElementById("btn-login");
  const btnPagar = document.getElementById("btn-pagar");

  // --- Funciones ---

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
          <span>- $${producto.precio.toFixed(2)}</span>
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
    const productoEnStock = productos.find((p) => p.id === productoId);

    if (productoEnStock && productoEnStock.stock > 0) {
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

      // Notificar si el producto se agota
      if (productoEnStock.stock === 0) {
        mostrarNotificacion(
          `¡El producto "${productoEnStock.nombre}" se ha agotado!`,
          "warning"
        );
      }

      guardarProductosEnStorage();
      actualizarVistaProducto(productoId); // <-- OPTIMIZACIÓN: Solo actualizamos el producto afectado
      renderizarCarrito();
      guardarCarritoEnStorage();

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
    }
  }

  /**
   * Renderiza los items del carrito y actualiza el total.
   */
  function renderizarCarrito() {
    carritoItemsContainer.innerHTML = ""; // Limpiar el carrito antes de renderizar
    let totalCompra = 0;

    if (carrito.length === 0) {
      carritoItemsContainer.innerHTML = "<li>El carrito está vacío.</li>";
    } else {
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
      actualizarVistaProducto(productoId); // <-- OPTIMIZACIÓN
      renderizarCarrito();
    }
  }

  /**
   * Guarda el estado actual del carrito en localStorage.
   */
  function guardarCarritoEnStorage() {
    localStorage.setItem("carrito", JSON.stringify(carrito));
  }

  /**
   * Carga el carrito desde localStorage al iniciar la página.
   */
  function cargarCarritoDeStorage() {
    const carritoGuardado = localStorage.getItem("carrito");
    if (carritoGuardado) {
      carrito = JSON.parse(carritoGuardado);
    }
  }

  /**
   * Guarda el estado de los productos (con su stock) en localStorage.
   */
  function guardarProductosEnStorage() {
    localStorage.setItem("productos", JSON.stringify(productos));
  }

  /**
   * Carga los productos desde localStorage o los inicializa si no existen.
   */
  function inicializarProductos() {
    const productosGuardados = localStorage.getItem("productos");
    if (productosGuardados) {
      productos = JSON.parse(productosGuardados);
    } else {
      // Si no hay nada en storage, usamos la lista inicial y la guardamos.
      productos = [
        {
          id: 1,
          nombre: "Laptop Gamer Asus ROG",
          precio: 1500,
          stock: 5,
          imagen: "images/laptop.jpg",
        },
        {
          id: 2,
          nombre: "Mouse Óptico Logitech G502",
          precio: 25,
          stock: 20,
          imagen: "images/mouse.jpg",
        },
        {
          id: 3,
          nombre: "Teclado Mecánico Corsair K95",
          precio: 120,
          stock: 10,
          imagen: "images/teclado.jpg",
        },
        {
          id: 4,
          nombre: 'Monitor 27" Dell',
          precio: 350,
          stock: 8,
          imagen: "images/monitor.jpg",
        },
        {
          id: 5,
          nombre: "Placa de Video TUF Gaming 3090",
          precio: 1300,
          stock: 3,
          imagen: "images/gpu.jpg",
        },
        {
          id: 6,
          nombre: "Auriculares Corsair Void Elite",
          precio: 300,
          stock: 12,
          imagen: "images/auriculares.jpg",
        },
        {
          id: 7,
          nombre: "Mouse Gamer Corsair Harpoon",
          precio: 300,
          stock: 15,
          imagen: "images/mouse.jpg", // Reutilizamos imagen
        },
        {
          id: 8,
          nombre: "Disco Sólido SSD 1TB Lexar",
          precio: 200,
          stock: 18,
          imagen: "images/ssd.jpg",
        },
        {
          id: 9,
          nombre: "Memoria RAM 16GB DDR5",
          precio: 80,
          stock: 25,
          imagen: "images/ram.jpg",
        },
        {
          id: 10,
          nombre: "Fuente de Poder ROG Strix 1000W",
          precio: 100,
          stock: 7,
          imagen: "images/psu.jpg",
        },
        {
          id: 11,
          nombre: "Gabinete NZXT H510",
          precio: 90,
          stock: 9,
          imagen: "images/gabinete.jpg",
        },
      ];
      guardarProductosEnStorage();
    }
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

        // Reiniciar el estado
        carrito = [];
        guardarProductosEnStorage(); // Guardamos el nuevo stock de productos
        guardarCarritoEnStorage(); // Guardar el carrito vacío en storage
        renderizarCarrito();

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
    }
  }

  /**
   * Simula el cierre de sesión.
   */
  function cerrarSesion() {
    mostrarNotificacion(`¡Hasta luego, ${usuarioLogueado}!`, "info");
    usuarioLogueado = null;
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
  inicializarProductos();
  cargarCarritoDeStorage();
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

  // Listener inicial para el botón de login/logout
  userSection.addEventListener("click", (e) => {
    if (e.target.id === "btn-login") iniciarSesion();
    if (e.target.id === "btn-logout") cerrarSesion();
  });

  btnPagar.addEventListener("click", finalizarCompra);
})();
