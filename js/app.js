// app.js conecta los datos y las funciones puras con los eventos del navegador.
import { catalogo, carrito, pedidos } from "./datos.js";
import {
  calcularDescuento,
  calcularSubtotal,
  calcularTotal,
  validarDatosPedido
} from "./calculos.js";
import {
  formatearMoneda,
  pintarCarrito,
  pintarCatalogo,
  pintarHistorial
} from "./vista.js";

// Guardar las referencias una sola vez evita repetir selectores en cada evento.
const elementos = {
  busqueda: document.querySelector("#busqueda"),
  filtroCategoria: document.querySelector("#filtro-categoria"),
  contadorCatalogo: document.querySelector("#contador-catalogo"),
  catalogo: document.querySelector("#catalogo"),
  estadoCatalogo: document.querySelector("#estado-catalogo"),
  carrito: {
    lineas: document.querySelector("#lineas-carrito"),
    estado: document.querySelector("#estado-carrito"),
    unidades: document.querySelector("#total-unidades"),
    subtotal: document.querySelector("#subtotal-carrito"),
    descuento: document.querySelector("#descuento-carrito"),
    total: document.querySelector("#total-carrito")
  },
  formulario: document.querySelector("#formulario-pedido"),
  camposEnvio: document.querySelector("#campos-envio"),
  contadorObservaciones: document.querySelector("#contador-observaciones"),
  errorPedido: document.querySelector("#error-pedido"),
  mensajePedido: document.querySelector("#mensaje-pedido"),
  confirmarPedido: document.querySelector("#confirmar-pedido"),
  filtroHistorial: document.querySelector("#filtro-historial"),
  historial: {
    lista: document.querySelector("#lista-pedidos"),
    estado: document.querySelector("#estado-historial"),
    resumen: document.querySelector("#resumen-historial")
  },
  exportar: document.querySelector("#exportar-historial"),
  contenedorExportacion: document.querySelector("#contenedor-exportacion"),
  json: document.querySelector("#json-historial"),
  copiarJson: document.querySelector("#copiar-json")
};

// form.elements permite acceder a los controles por su atributo name.
// modalidad devuelve un RadioNodeList porque comparte name con dos radios.
const controles = {
  nombre: elementos.formulario.elements.namedItem("nombre"),
  email: elementos.formulario.elements.namedItem("email"),
  modalidad: elementos.formulario.elements.namedItem("modalidad"),
  direccion: elementos.formulario.elements.namedItem("direccion"),
  codigoPostal: elementos.formulario.elements.namedItem("codigoPostal"),
  observaciones: elementos.formulario.elements.namedItem("observaciones"),
  aceptacion: elementos.formulario.elements.namedItem("aceptacion")
};

// Cada mensaje está asociado en HTML al control mediante aria-describedby.
const mensajesError = {
  nombre: document.querySelector("#nombre-error"),
  email: document.querySelector("#email-error"),
  modalidad: document.querySelector("#modalidad-error"),
  direccion: document.querySelector("#direccion-error"),
  codigoPostal: document.querySelector("#codigo-postal-error"),
  observaciones: document.querySelector("#observaciones-error"),
  aceptacion: document.querySelector("#aceptacion-error")
};

// map obtiene categorías y Set elimina las repetidas antes de ordenar el filtro.
function obtenerCategorias() {
  return [...new Set(catalogo.map((producto) => producto.categoria))].sort();
}

// Las opciones de categoría se crean al arrancar a partir del propio catálogo.
function prepararFiltroCategorias() {
  obtenerCategorias().forEach((categoria) => {
    const opcion = document.createElement("option");
    opcion.value = categoria;
    opcion.textContent = categoria.charAt(0).toUpperCase() + categoria.slice(1);
    elementos.filtroCategoria.append(opcion);
  });
}

// Búsqueda y categoría se aplican a la vez sobre el mismo array filtrado.
function actualizarCatalogo() {
  const termino = elementos.busqueda.value.trim().toLocaleLowerCase("es");
  const categoria = elementos.filtroCategoria.value;
  const productosFiltrados = catalogo.filter((producto) => {
    const coincideNombre = producto.nombre.toLocaleLowerCase("es").includes(termino);
    const coincideCategoria = categoria === "todas" || producto.categoria === categoria;
    return coincideNombre && coincideCategoria;
  });

  pintarCatalogo(elementos.catalogo, elementos.estadoCatalogo, productosFiltrados);
  elementos.contadorCatalogo.textContent = `${productosFiltrados.length} ${
    productosFiltrados.length === 1 ? "producto" : "productos"
  }`;
}

// Agrupa todos los importes en un objeto antes de repintar el carrito.
function obtenerImportesCarrito() {
  const subtotal = calcularSubtotal(carrito, catalogo);
  const descuento = calcularDescuento(subtotal);

  return {
    subtotal,
    descuento,
    total: calcularTotal(subtotal, descuento),
    unidades: carrito.reduce((acumulado, linea) => acumulado + linea.cantidad, 0)
  };
}

// Esta función sí toca el DOM; por eso los cálculos se mantienen separados arriba.
function actualizarCarrito() {
  pintarCarrito(elementos.carrito, carrito, catalogo, obtenerImportesCarrito());
  elementos.confirmarPedido.disabled = carrito.length === 0;
}

// Los errores generales informan de un problema que no pertenece a un único campo.
function mostrarErrorGeneral(texto) {
  elementos.errorPedido.textContent = texto;
  elementos.errorPedido.hidden = false;
  elementos.mensajePedido.hidden = true;
}

// Se limpian avisos viejos antes de iniciar una nueva acción del usuario.
function limpiarAvisosGenerales() {
  elementos.errorPedido.hidden = true;
  elementos.errorPedido.textContent = "";
  elementos.mensajePedido.hidden = true;
  elementos.mensajePedido.textContent = "";
}

// value.trim() detecta el valor vacío antes de valueAsNumber, que sí puede devolver NaN.
function validarCantidad(cantidadEntrada, producto) {
  if (cantidadEntrada.value.trim() === "") {
    return "Indica una cantidad.";
  }

  const cantidad = cantidadEntrada.valueAsNumber;
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    return "La cantidad debe ser un número entero positivo.";
  }

  if (!producto.hayDisponibilidad(cantidad)) {
    return `Solo quedan ${producto.stock} unidades de ${producto.nombre}.`;
  }

  return "";
}

// El submit burbujea desde cada tarjeta hasta el contenedor común del catálogo.
function anadirAlCarrito(event) {
  // preventDefault evita que el formulario dinámico recargue la página.
  event.preventDefault();
  const formulario = event.target.closest(".form-anadir");
  // En submit, target es el formulario y submitter es el botón que lo disparó.
  const boton = event.submitter;

  if (!formulario || !boton || boton.dataset.action !== "anadir") {
    return;
  }

  limpiarAvisosGenerales();
  // dataset contiene siempre texto, así que Number realiza la conversión explícita.
  const productoId = Number(formulario.dataset.productoId);
  const producto = catalogo.find((item) => item.id === productoId);
  const campoCantidad = formulario.elements.namedItem("cantidad");

  if (!producto) {
    mostrarErrorGeneral("El producto seleccionado ya no está disponible.");
    return;
  }

  const errorCantidad = validarCantidad(campoCantidad, producto);
  campoCantidad.setCustomValidity(errorCantidad);
  if (!campoCantidad.checkValidity()) {
    campoCantidad.reportValidity();
    return;
  }

  const cantidad = campoCantidad.valueAsNumber;
  const linea = carrito.find((item) => item.productoId === productoId);
  const cantidadActual = linea ? linea.cantidad : 0;

  // El límite se comprueba sumando lo que ya hay, no sustituyendo la línea anterior.
  if (cantidadActual + cantidad > producto.stock) {
    campoCantidad.setCustomValidity(
      `No puedes añadir más de ${producto.stock} unidades en total. Ya tienes ${cantidadActual} en el carrito.`
    );
    campoCantidad.reportValidity();
    return;
  }

  if (linea) {
    linea.cantidad += cantidad;
  } else {
    carrito.push({ productoId, cantidad });
  }

  actualizarCarrito();
  // Tras añadir se restaura el valor inicial para repetir la operación cómodamente.
  campoCantidad.value = "1";
  campoCantidad.setCustomValidity("");
}

// Delegación: existe un único listener para botones que se crean o sustituyen al repintar.
function retirarDelCarrito(event) {
  // event.target puede ser el texto visual o el botón; closest localiza el control.
  const boton = event.target.closest('[data-action="retirar"]');
  if (!boton || !elementos.carrito.lineas.contains(boton)) {
    return;
  }

  const productoId = Number(boton.dataset.productoId);
  // findIndex devuelve la posición porque splice necesita precisamente un índice.
  const indice = carrito.findIndex((linea) => linea.productoId === productoId);
  if (indice !== -1) {
    carrito.splice(indice, 1);
    actualizarCarrito();
  }
}

// Borra tanto el texto mostrado como el error interno de Constraint Validation.
function limpiarErroresFormulario() {
  Object.entries(mensajesError).forEach(([nombre, mensaje]) => {
    mensaje.textContent = "";
    const control = controles[nombre];
    // Un RadioNodeList debe tratarse como conjunto de radios, no como un único input.
    if (control instanceof RadioNodeList) {
      Array.from(control).forEach((radio) => {
        radio.removeAttribute("aria-invalid");
        radio.setCustomValidity("");
      });
    } else {
      control.removeAttribute("aria-invalid");
      control.setCustomValidity("");
    }
  });
}

// Asocia el mismo error al elemento visual y al mensaje nativo del navegador.
function establecerErrorControl(nombre, mensaje) {
  const control = controles[nombre];
  mensajesError[nombre].textContent = mensaje;

  if (control instanceof RadioNodeList) {
    Array.from(control).forEach((radio) => {
      radio.setAttribute("aria-invalid", "true");
      radio.setCustomValidity(mensaje);
    });
    return;
  }

  control.setAttribute("aria-invalid", "true");
  control.setCustomValidity(mensaje);
}

// Durante la edición se borra el error anterior para que pueda corregirse de verdad.
function validarControlDuranteEdicion(control) {
  const nombre = control.name;
  if (!(nombre in mensajesError) || nombre === "modalidad") {
    return;
  }

  control.setCustomValidity("");
  control.removeAttribute("aria-invalid");
  mensajesError[nombre].textContent = "";

  if (control.validity.valueMissing) {
    // El campo vacío se exige, pero se avisa al usuario con el submit completo.
    return;
  }

  const datos = obtenerDatosFormulario();
  const errores = validarDatosPedido(datos);
  if (errores[nombre]) {
    establecerErrorControl(nombre, errores[nombre]);
  }
}

// Cambiar a recogida desactiva los campos postales y elimina sus posibles errores.
function actualizarModalidad() {
  const esEnvio = controles.modalidad.value === "envio";

  elementos.camposEnvio.hidden = !esEnvio;
  controles.direccion.disabled = !esEnvio;
  controles.codigoPostal.disabled = !esEnvio;
  controles.direccion.required = esEnvio;
  controles.codigoPostal.required = esEnvio;
  controles.direccion.setCustomValidity("");
  controles.codigoPostal.setCustomValidity("");
  controles.direccion.removeAttribute("aria-invalid");
  controles.codigoPostal.removeAttribute("aria-invalid");
  mensajesError.direccion.textContent = "";
  mensajesError.codigoPostal.textContent = "";
}

// FormData refleja names del formulario, y checked conserva correctamente un booleano.
function obtenerDatosFormulario() {
  const datos = new FormData(elementos.formulario);
  const modalidad = datos.get("modalidad") ?? "";

  return {
    nombre: String(datos.get("nombre") ?? "").trim(),
    email: String(datos.get("email") ?? "").trim(),
    modalidad: String(modalidad),
    direccion:
      modalidad === "envio" ? String(datos.get("direccion") ?? "").trim() : "",
    codigoPostal:
      modalidad === "envio" ? String(datos.get("codigoPostal") ?? "").trim() : "",
    observaciones: String(datos.get("observaciones") ?? ""),
    aceptacion: controles.aceptacion.checked
  };
}

// every termina en false en cuanto encuentra una línea con producto o stock incorrectos.
function comprobarStockCarrito() {
  // Se comprueba todo el carrito antes de tocar el stock o crear el pedido.
  return carrito.every((linea) => {
    const producto = catalogo.find((item) => item.id === linea.productoId);
    return producto !== undefined && producto.hayDisponibilidad(linea.cantidad);
  });
}

// Crea la instantánea económica que quedará guardada aunque cambie el catálogo después.
function crearPedido(datos, importes) {
  const fecha = new Date();
  // El pedido guarda valores, no referencias al catálogo, para conservar el precio.
  const lineas = carrito.map((linea) => {
    const producto = catalogo.find((item) => item.id === linea.productoId);
    return {
      productoId: producto.id,
      nombre: producto.nombre,
      precioUnitario: producto.precio,
      cantidad: linea.cantidad,
      subtotal: producto.precio * linea.cantidad
    };
  });

  return {
    numero: pedidos.length + 1,
    fecha: fecha.toISOString(),
    fechaFormateada: new Intl.DateTimeFormat("es-ES", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(fecha),
    // Se copia el objeto del cliente para no depender de los controles del formulario.
    cliente: { ...datos },
    modalidad: datos.modalidad,
    lineas,
    subtotal: importes.subtotal,
    descuento: importes.descuento,
    total: importes.total
  };
}

// Submit es el único punto que puede confirmar: siempre vuelve a validar todo.
function confirmarPedido(event) {
  event.preventDefault();
  limpiarAvisosGenerales();
  limpiarErroresFormulario();

  if (carrito.length === 0) {
    mostrarErrorGeneral("El carrito está vacío. Añade al menos un producto antes de confirmar.");
    return;
  }

  const datos = obtenerDatosFormulario();
  // La función pura decide los errores sin acceder todavía a ningún elemento del DOM.
  const errores = validarDatosPedido(datos);

  // entries permite relacionar cada nombre de error con su control correspondiente.
  Object.entries(errores).forEach(([nombre, mensaje]) => {
    establecerErrorControl(nombre, mensaje);
  });

  if (Object.keys(errores).length > 0) {
    // checkValidity comprueba restricciones HTML5; reportValidity muestra el primer error.
    if (!elementos.formulario.checkValidity()) {
      elementos.formulario.reportValidity();
    }
    mostrarErrorGeneral("Revisa los campos señalados antes de confirmar el pedido.");
    return;
  }

  if (!comprobarStockCarrito()) {
    mostrarErrorGeneral(
      "El stock de uno o más productos ya no es suficiente. Revisa el carrito; no se ha confirmado el pedido."
    );
    return;
  }

  const importes = obtenerImportesCarrito();
  // La instantánea se crea antes de descontar, con todos los precios actuales.
  const pedido = crearPedido(datos, importes);

  // Esta es la primera modificación del catálogo; hasta aquí solo se realizaron comprobaciones.
  carrito.forEach((linea) => {
    const producto = catalogo.find((item) => item.id === linea.productoId);
    producto.descontarStock(linea.cantidad);
  });
  pedidos.push(pedido);
  // Se vacía el array original para mantener una única colección de carrito.
  carrito.splice(0, carrito.length);

  elementos.formulario.reset();
  limpiarErroresFormulario();
  actualizarModalidad();
  elementos.contadorObservaciones.textContent = "0 / 200";
  actualizarCatalogo();
  actualizarCarrito();
  actualizarHistorial();

  elementos.mensajePedido.textContent = `Pedido #${pedido.numero} confirmado por ${formatearMoneda(
    pedido.total
  )}.`;
  elementos.mensajePedido.hidden = false;
}

// El resumen y la lista del historial se calculan con los pedidos ya filtrados.
function actualizarHistorial() {
  const filtro = elementos.filtroHistorial.value;
  const filtrados = pedidos.filter(
    (pedido) => filtro === "todas" || pedido.modalidad === filtro
  );
  pintarHistorial(elementos.historial, filtrados);
}

// JSON.stringify serializa datos JavaScript; el tercer parámetro aplica indentación legible.
function exportarHistorial() {
  if (pedidos.length === 0) {
    elementos.json.value = "[]";
  } else {
    elementos.json.value = JSON.stringify(pedidos, null, 2);
  }

  elementos.contenedorExportacion.hidden = false;
  elementos.json.focus();
}

// La API del portapapeles requiere HTTPS o localhost, condiciones propias del servidor local.
async function copiarHistorial() {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(elementos.json.value);
    elementos.copiarJson.textContent = "Copiado";
    window.setTimeout(() => {
      elementos.copiarJson.textContent = "Copiar JSON";
    }, 1500);
    return;
  }

  // La ruta alternativa mantiene la exportación utilizable en navegadores antiguos.
  elementos.json.select();
  document.execCommand("copy");
}

// Eventos del catálogo, carrito e historial.
elementos.busqueda.addEventListener("input", actualizarCatalogo);
elementos.filtroCategoria.addEventListener("change", actualizarCatalogo);
elementos.catalogo.addEventListener("submit", anadirAlCarrito);
elementos.carrito.lineas.addEventListener("click", retirarDelCarrito);
elementos.formulario.addEventListener("submit", confirmarPedido);
// input sirve para actualizar el contador y borrar errores mientras el usuario corrige.
elementos.formulario.addEventListener("input", (event) => {
  const control = event.target;
  if (control === controles.observaciones) {
    elementos.contadorObservaciones.textContent = `${control.value.length} / 200`;
  }
  validarControlDuranteEdicion(control);
});
// change es apropiado para radios y checkbox, que cambian por selección.
elementos.formulario.addEventListener("change", (event) => {
  if (event.target.name === "modalidad") {
    actualizarModalidad();
    Array.from(controles.modalidad).forEach((radio) => {
      radio.setCustomValidity("");
      radio.removeAttribute("aria-invalid");
    });
    mensajesError.modalidad.textContent = "";
  } else if (event.target === controles.aceptacion) {
    validarControlDuranteEdicion(controles.aceptacion);
  }
});
elementos.filtroHistorial.addEventListener("change", actualizarHistorial);
elementos.exportar.addEventListener("click", exportarHistorial);
elementos.copiarJson.addEventListener("click", copiarHistorial);

// Estado inicial: no se espera a una interacción para pintar catálogo, carrito e historial.
prepararFiltroCategorias();
actualizarModalidad();
actualizarCatalogo();
actualizarCarrito();
actualizarHistorial();

// Estas referencias facilitan las pruebas de cálculo solicitadas en la consola.
window.gestorPedidos = {
  calcularSubtotal: () => calcularSubtotal(carrito, catalogo),
  calcularDescuento,
  catalogo
};
