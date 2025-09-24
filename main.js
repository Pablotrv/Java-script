(function () {
  // --- Estado de la Aplicación ---
  const productos = [
    { id: 1, nombre: "Laptop Gamer Asus ROG", precio: 1500 },
    { id: 2, nombre: "Mouse Óptico Logitech G502", precio: 25 },
    { id: 3, nombre: "Teclado Mecánico Corsair K95", precio: 120 },
    { id: 4, nombre: 'Monitor 27" Dell', precio: 350 },
    { id: 5, nombre: "Placa de Video TUF Gaming 3090", precio: 1300 },
    { id: 6, nombre: "Auriculares Corsair Void Elite", precio: 300 },
    { id: 7, nombre: "Mouse Gamer Corsair Harpoon", precio: 300 },
    { id: 8, nombre: "Disco Sólido SSD 1TB Lexar", precio: 200 },
    { id: 9, nombre: "Memoria RAM 16GB DDR5", precio: 80 },
    { id: 10, nombre: "Fuente de Poder ROG Strix 1000W", precio: 100 },
    { id: 11, nombre: "Gabinete NZXT H510", precio: 90 },
  ];

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
    productos.forEach((producto) => {
      const productoDiv = document.createElement("div");
      productoDiv.classList.add("producto");

      productoDiv.innerHTML = `
      <div class="producto-info">
        <span>${producto.nombre}</span>
        <span>- $${producto.precio.toFixed(2)}</span>
      </div>
      <button class="btn-agregar" data-id="${producto.id}">Agregar</button>
    `;

      productosContainer.appendChild(productoDiv);
    });
  }

  /**
   * Agrega un producto al carrito o incrementa su cantidad si ya existe.
   * @param {number} productoId - El ID del producto a agregar.
   */
  function agregarAlCarrito(productoId) {
    const productoElegido = productos.find((p) => p.id === productoId);
    const itemEnCarrito = carrito.find(
      (item) => item.producto.id === productoId
    );

    if (itemEnCarrito) {
      itemEnCarrito.cantidad++;
    } else {
      carrito.push({ producto: productoElegido, cantidad: 1 });
    }

    renderizarCarrito();
    guardarCarritoEnStorage();
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
    localStorage.removeItem("carrito"); // Limpiar el storage
    renderizarCarrito();
  }

  // --- Inicialización y Event Listeners ---
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
