const formatoMoneda = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2
});

export function formatearMoneda(importe) {
  const importeSeguro = Number.isFinite(importe) ? importe : 0;
  return formatoMoneda.format(importeSeguro);
}

function crearElemento(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta);

  if (clase) {
    elemento.className = clase;
  }

  if (texto !== undefined) {
    elemento.textContent = texto;
  }

  return elemento;
}

export function crearTarjetaProducto(producto) {
  const tarjeta = crearElemento("article", "tarjeta-producto");
  const stock = crearElemento(
    "span",
    producto.stock > 0 ? "stock" : "stock agotado",
    producto.stock > 0 ? `${producto.stock} en stock` : "Agotado"
  );
  const titulo = crearElemento("h3", "", producto.nombre);
  const categoria = crearElemento("p", "categoria-producto", producto.categoria);
  const precio = crearElemento("p", "precio-producto", formatearMoneda(producto.precio));
  const formulario = crearElemento("form", "form-anadir");
  const campoCantidad = crearElemento("div", "campo");
  const etiqueta = crearElemento("label", "", "Cantidad");
  const cantidadId = `cantidad-${producto.id}`;
  const cantidad = document.createElement("input");
  const boton = crearElemento(
    "button",
    "boton boton-principal",
    producto.stock > 0 ? "Añadir" : "Sin stock"
  );

  etiqueta.htmlFor = cantidadId;
  cantidad.id = cantidadId;
  cantidad.name = "cantidad";
  cantidad.type = "number";
  cantidad.min = "1";
  cantidad.max = String(producto.stock);
  cantidad.step = "1";
  cantidad.value = "1";
  cantidad.required = true;
  cantidad.disabled = producto.stock === 0;
  cantidad.setAttribute("aria-label", `Cantidad de ${producto.nombre}`);
  boton.type = "submit";
  boton.dataset.action = "anadir";
  boton.dataset.productoId = String(producto.id);
  boton.disabled = producto.stock === 0;

  formulario.dataset.productoId = String(producto.id);
  campoCantidad.append(etiqueta, cantidad);
  formulario.append(campoCantidad, boton);
  tarjeta.append(stock, titulo, categoria, precio, formulario);

  return tarjeta;
}

export function pintarCatalogo(contenedor, estado, productos) {
  const fragmento = document.createDocumentFragment();

  productos.forEach((producto) => fragmento.append(crearTarjetaProducto(producto)));
  contenedor.replaceChildren(fragmento);

  estado.hidden = productos.length > 0;
  estado.textContent =
    productos.length === 0
      ? "No hay productos que coincidan con la búsqueda y la categoría."
      : "";
}

export function pintarCarrito(elementos, lineas, catalogo, importes) {
  const fragmento = document.createDocumentFragment();

  lineas.forEach((linea) => {
    const producto = catalogo.find((item) => item.id === linea.productoId);
    if (!producto) {
      return;
    }

    const articulo = crearElemento("article", "linea-carrito");
    const cabecera = crearElemento("div", "cabecera-linea");
    const titulo = crearElemento("h3", "", producto.nombre);
    const retirar = crearElemento("button", "boton boton-peligro", "Retirar");
    const datos = crearElemento(
      "p",
      "datos-linea",
      `${linea.cantidad} × ${formatearMoneda(producto.precio)} = ${formatearMoneda(
        producto.precio * linea.cantidad
      )}`
    );

    retirar.type = "button";
    retirar.dataset.action = "retirar";
    retirar.dataset.productoId = String(producto.id);
    retirar.setAttribute("aria-label", `Retirar ${producto.nombre} del carrito`);
    cabecera.append(titulo, retirar);
    articulo.append(cabecera, datos);
    fragmento.append(articulo);
  });

  elementos.lineas.replaceChildren(fragmento);
  elementos.estado.hidden = lineas.length > 0;
  elementos.estado.textContent =
    lineas.length === 0 ? "El carrito está vacío. Añade productos desde el catálogo." : "";
  elementos.unidades.textContent = `${importes.unidades} ${
    importes.unidades === 1 ? "ud." : "uds."
  }`;
  elementos.subtotal.textContent = formatearMoneda(importes.subtotal);
  elementos.descuento.textContent = `−${formatearMoneda(importes.descuento)}`;
  elementos.total.textContent = formatearMoneda(importes.total);
}

export function pintarHistorial(elementos, pedidosFiltrados) {
  // Un filtro puede dejar cero resultados; se calcula la suma sobre la copia filtrada.
  const fragmento = document.createDocumentFragment();
  const suma = pedidosFiltrados.reduce((acumulado, pedido) => acumulado + pedido.total, 0);

  pedidosFiltrados.forEach((pedido) => {
    const articulo = crearElemento("article", "pedido");
    const titulo = crearElemento("h3", "", `Pedido #${pedido.numero}`);
    const metadatos = crearElemento(
      "p",
      "datos-linea",
      `${pedido.fechaFormateada} · ${pedido.cliente.nombre} · ${
        pedido.modalidad === "envio" ? "Envío" : "Recogida"
      } · ${formatearMoneda(pedido.total)}`
    );
    const detalle = document.createElement("details");
    const resumen = crearElemento("summary", "", "Ver detalle");
    const lista = document.createElement("ul");

    pedido.lineas.forEach((linea) => {
      lista.append(
        crearElemento(
          "li",
          "",
          `${linea.nombre}: ${linea.cantidad} × ${formatearMoneda(
            linea.precioUnitario
          )} = ${formatearMoneda(linea.subtotal)}`
        )
      );
    });
    detalle.append(resumen, lista);
    articulo.append(titulo, metadatos, detalle);
    fragmento.append(articulo);
  });

  elementos.lista.replaceChildren(fragmento);
  elementos.estado.hidden = pedidosFiltrados.length > 0;
  elementos.estado.textContent =
    pedidosFiltrados.length === 0
      ? "No hay pedidos para el filtro seleccionado."
      : "";
  elementos.resumen.textContent = `${pedidosFiltrados.length} ${
    pedidosFiltrados.length === 1 ? "pedido" : "pedidos"
  } · ${formatearMoneda(suma)}`;
}
