(function () {
  // --- Estado de la Aplicación ---
  let productos = [];
  let carrito = [];

  // --- Selectores del DOM ---
  const productosContainer = document.getElementById("productos-container");
  const carritoItemsContainer = document.getElementById("carrito-items");
  const totalCompraSpan = document.getElementById("total-compra");
  const btnPagar = document.getElementById("btn-pagar");

  // --- Funciones ---

  /**
   * Renderiza los productos en el contenedor de productos.
   */
  function renderizarProductos() {
    productosContainer.innerHTML = ""; // Limpiar para re-renderizar
    productos.forEach((producto) => {
      const productoDiv = document.createElement("div");
      productoDiv.classList.add("producto");

      if (producto.stock === 0) {
        productoDiv.classList.add("sin-stock");
      }

      const botonAgregar =
        producto.stock > 0
          ? `<button class="btn-agregar" data-id="${producto.id}">Agregar</button>`
          : `<button class="btn-agregar" disabled>Sin stock</button>`;

      productoDiv.innerHTML = `
      <div class="producto-info">
        <span>${producto.nombre} (Stock: ${producto.stock})</span>
        <span>- $${producto.precio.toFixed(2)}</span>
      </div>
      ${botonAgregar}
    `;

      productosContainer.appendChild(productoDiv);
    });
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
      guardarProductosEnStorage();
      renderizarProductos(); // Re-renderizar productos para actualizar stock y botón
      renderizarCarrito();
      guardarCarritoEnStorage();
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
        li.textContent = `${item.cantidad} x ${
          item.producto.nombre
        } - Subtotal: $${subtotal.toFixed(2)}`;
        carritoItemsContainer.appendChild(li);
        totalCompra += subtotal;
      });
    }

    totalCompraSpan.textContent = totalCompra.toFixed(2);
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
        { id: 1, nombre: "Laptop Gamer Asus ROG", precio: 1500, stock: 5 },
        { id: 2, nombre: "Mouse Óptico Logitech G502", precio: 25, stock: 20 },
        {
          id: 3,
          nombre: "Teclado Mecánico Corsair K95",
          precio: 120,
          stock: 10,
        },
        { id: 4, nombre: 'Monitor 27" Dell', precio: 350, stock: 8 },
        {
          id: 5,
          nombre: "Placa de Video TUF Gaming 3090",
          precio: 1300,
          stock: 3,
        },
        {
          id: 6,
          nombre: "Auriculares Corsair Void Elite",
          precio: 300,
          stock: 12,
        },
        {
          id: 7,
          nombre: "Mouse Gamer Corsair Harpoon",
          precio: 300,
          stock: 15,
        },
        { id: 8, nombre: "Disco Sólido SSD 1TB Lexar", precio: 200, stock: 18 },
        { id: 9, nombre: "Memoria RAM 16GB DDR5", precio: 80, stock: 25 },
        {
          id: 10,
          nombre: "Fuente de Poder ROG Strix 1000W",
          precio: 100,
          stock: 7,
        },
        { id: 11, nombre: "Gabinete NZXT H510", precio: 90, stock: 9 },
      ];
      guardarProductosEnStorage();
    }
  }
  /**
   * Finaliza la compra, muestra un resumen y reinicia el estado.
   */
  function finalizarCompra() {
    if (carrito.length === 0) {
      alert(
        "No has agregado ningún producto al carrito. ¡Agrega algo primero!"
      );
      return;
    }

    alert(
      `¡Gracias por tu compra! Total a pagar: $${totalCompraSpan.textContent}`
    );

    // Reiniciar el estado
    carrito = [];
    guardarCarritoEnStorage(); // Guardar el carrito vacío en storage
    renderizarCarrito();
  }

  // --- Inicialización y Event Listeners ---
  inicializarProductos();
  cargarCarritoDeStorage();
  renderizarProductos();
  renderizarCarrito();

  productosContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-agregar")) {
      const productoId = parseInt(e.target.getAttribute("data-id"));
      agregarAlCarrito(productoId);
    }
  });

  btnPagar.addEventListener("click", finalizarCompra);
})();
