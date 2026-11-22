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

const controles = {
  nombre: elementos.formulario.elements.namedItem("nombre"),
  email: elementos.formulario.elements.namedItem("email"),
  modalidad: elementos.formulario.elements.namedItem("modalidad"),
  direccion: elementos.formulario.elements.namedItem("direccion"),
  codigoPostal: elementos.formulario.elements.namedItem("codigoPostal"),
  observaciones: elementos.formulario.elements.namedItem("observaciones"),
  aceptacion: elementos.formulario.elements.namedItem("aceptacion")
};

const mensajesError = {
  nombre: document.querySelector("#nombre-error"),
  email: document.querySelector("#email-error"),
  modalidad: document.querySelector("#modalidad-error"),
  direccion: document.querySelector("#direccion-error"),
  codigoPostal: document.querySelector("#codigo-postal-error"),
  observaciones: document.querySelector("#observaciones-error"),
  aceptacion: document.querySelector("#aceptacion-error")
};

function obtenerCategorias() {
  return [...new Set(catalogo.map((producto) => producto.categoria))].sort();
}

function prepararFiltroCategorias() {
  obtenerCategorias().forEach((categoria) => {
    const opcion = document.createElement("option");
    opcion.value = categoria;
    opcion.textContent = categoria.charAt(0).toUpperCase() + categoria.slice(1);
    elementos.filtroCategoria.append(opcion);
  });
}

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

function actualizarCarrito() {
  pintarCarrito(elementos.carrito, carrito, catalogo, obtenerImportesCarrito());
  elementos.confirmarPedido.disabled = carrito.length === 0;
}

function mostrarErrorGeneral(texto) {
  elementos.errorPedido.textContent = texto;
  elementos.errorPedido.hidden = false;
  elementos.mensajePedido.hidden = true;
}

function limpiarAvisosGenerales() {
  elementos.errorPedido.hidden = true;
  elementos.errorPedido.textContent = "";
  elementos.mensajePedido.hidden = true;
  elementos.mensajePedido.textContent = "";
}

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

function anadirAlCarrito(event) {
  event.preventDefault();
  const formulario = event.target.closest(".form-anadir");
  const boton = event.target.closest('[data-action="anadir"]');

  if (!formulario || !boton) {
    return;
  }

  limpiarAvisosGenerales();
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
  campoCantidad.value = "1";
  campoCantidad.setCustomValidity("");
}

function retirarDelCarrito(event) {
  const boton = event.target.closest('[data-action="retirar"]');
  if (!boton || !elementos.carrito.lineas.contains(boton)) {
    return;
  }

  const productoId = Number(boton.dataset.productoId);
  const indice = carrito.findIndex((linea) => linea.productoId === productoId);
  if (indice !== -1) {
    carrito.splice(indice, 1);
    actualizarCarrito();
  }
}

function limpiarErroresFormulario() {
  Object.entries(mensajesError).forEach(([nombre, mensaje]) => {
    mensaje.textContent = "";
    const control = controles[nombre];
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

function validarControlDuranteEdicion(control) {
  const nombre = control.name;
  if (!(nombre in mensajesError) || nombre === "modalidad") {
    return;
  }

  control.setCustomValidity("");
  control.removeAttribute("aria-invalid");
  mensajesError[nombre].textContent = "";

  if (control.validity.valueMissing) {
    return;
  }

  const datos = obtenerDatosFormulario();
  const errores = validarDatosPedido(datos);
  if (errores[nombre]) {
    establecerErrorControl(nombre, errores[nombre]);
  }
}

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

function comprobarStockCarrito() {
  // Se comprueba todo el carrito antes de tocar el stock o crear el pedido.
  return carrito.every((linea) => {
    const producto = catalogo.find((item) => item.id === linea.productoId);
    return producto !== undefined && producto.hayDisponibilidad(linea.cantidad);
  });
}

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
    cliente: { ...datos },
    modalidad: datos.modalidad,
    lineas,
    subtotal: importes.subtotal,
    descuento: importes.descuento,
    total: importes.total
  };
}

function confirmarPedido(event) {
  event.preventDefault();
  limpiarAvisosGenerales();
  limpiarErroresFormulario();

  if (carrito.length === 0) {
    mostrarErrorGeneral("El carrito está vacío. Añade al menos un producto antes de confirmar.");
    return;
  }

  const datos = obtenerDatosFormulario();
  const errores = validarDatosPedido(datos);

  Object.entries(errores).forEach(([nombre, mensaje]) => {
    establecerErrorControl(nombre, mensaje);
  });

  if (Object.keys(errores).length > 0) {
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
  const pedido = crearPedido(datos, importes);

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

function actualizarHistorial() {
  const filtro = elementos.filtroHistorial.value;
  const filtrados = pedidos.filter(
    (pedido) => filtro === "todas" || pedido.modalidad === filtro
  );
  pintarHistorial(elementos.historial, filtrados);
}

function exportarHistorial() {
  if (pedidos.length === 0) {
    elementos.json.value = "[]";
  } else {
    elementos.json.value = JSON.stringify(pedidos, null, 2);
  }

  elementos.contenedorExportacion.hidden = false;
  elementos.json.focus();
}

async function copiarHistorial() {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(elementos.json.value);
    elementos.copiarJson.textContent = "Copiado";
    window.setTimeout(() => {
      elementos.copiarJson.textContent = "Copiar JSON";
    }, 1500);
    return;
  }

  elementos.json.select();
  document.execCommand("copy");
}

elementos.busqueda.addEventListener("input", actualizarCatalogo);
elementos.filtroCategoria.addEventListener("change", actualizarCatalogo);
elementos.catalogo.addEventListener("submit", anadirAlCarrito);
elementos.carrito.lineas.addEventListener("click", retirarDelCarrito);
elementos.formulario.addEventListener("submit", confirmarPedido);
elementos.formulario.addEventListener("input", (event) => {
  const control = event.target;
  if (control === controles.observaciones) {
    elementos.contadorObservaciones.textContent = `${control.value.length} / 200`;
  }
  validarControlDuranteEdicion(control);
});
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

prepararFiltroCategorias();
actualizarModalidad();
actualizarCatalogo();
actualizarCarrito();
actualizarHistorial();

window.gestorPedidos = {
  calcularSubtotal: () => calcularSubtotal(carrito, catalogo),
  calcularDescuento,
  catalogo
};
