// --- Función Principal para Iniciar la Compra ---
function iniciarCompra() {
  // --- Declaración de Constantes y Variables ---
  const productos = [
    { id: 1, nombre: "Laptop Gamer", precio: 1500 },
    { id: 2, nombre: "Mouse Óptico", precio: 25 },
    { id: 3, nombre: "Teclado Mecánico", precio: 120 },
    { id: 4, nombre: 'Monitor 27"', precio: 350 },
  ];

  let carrito = [];
  let totalCompra = 0;
  let seguirComprando = true;

  // --- Ciclo Principal de Compra ---
  while (seguirComprando) {
    let mensaje = "¿Qué producto deseas agregar al carrito?\n";
    productos.forEach((producto) => {
      mensaje += `${producto.id}. ${producto.nombre} - $${producto.precio}\n`;
    });
    mensaje += 'Escribe "pagar" para finalizar tu compra.';

    const seleccion = prompt(mensaje);

    switch (seleccion) {
      case "1":
      case "2":
      case "3":
      case "4":
        const productoElegido = productos.find(
          (p) => p.id === parseInt(seleccion)
        );
        const cantidad = parseInt(
          prompt(
            `Has elegido: ${productoElegido.nombre}.\n¿Cuántas unidades quieres?`
          )
        );

        if (cantidad > 0) {
          carrito.push({ producto: productoElegido, cantidad: cantidad });
          totalCompra += productoElegido.precio * cantidad;
          alert(
            `${cantidad} unidad(es) de ${productoElegido.nombre} se ha(n) agregado al carrito.`
          );
        } else {
          alert("La cantidad debe ser un número mayor a cero.");
        }
        break;

      case "pagar":
        seguirComprando = false;
        break;

      default:
        alert(
          'Opción no válida. Por favor, elige un número de la lista o escribe "pagar".'
        );
        break;
    }
  }

  // --- Resumen de la Compra ---
  if (carrito.length > 0) {
    let resumen = "Resumen de tu compra:\n\n";
    carrito.forEach((item) => {
      const subtotal = item.producto.precio * item.cantidad;
      resumen += `${item.cantidad} x ${item.producto.nombre} - Subtotal: $${subtotal}\n`;
    });
    resumen += `\nTotal a pagar: $${totalCompra}`;
    alert(resumen);
  } else {
    alert("No has agregado ningún producto al carrito. ¡Vuelve pronto!");
  }

  alert("¡Gracias por tu compra!");
}
iniciarCompra();
