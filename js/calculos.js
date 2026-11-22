// Estas funciones solo reciben datos y devuelven números u objetos. No conocen el DOM.
export function calcularSubtotal(lineas, catalogo) {
  return lineas.reduce((acumulado, linea) => {
    const producto = catalogo.find((item) => item.id === linea.productoId);

    if (!producto || !Number.isFinite(linea.cantidad) || linea.cantidad <= 0) {
      throw new TypeError("El carrito contiene una línea no válida.");
    }

    return acumulado + producto.precio * linea.cantidad;
  }, 0);
}

export function calcularDescuento(subtotal, porcentaje = 10) {
  if (!Number.isFinite(subtotal) || subtotal < 0 || !Number.isFinite(porcentaje)) {
    throw new TypeError("Los valores para calcular el descuento no son válidos.");
  }

  return subtotal >= 100 ? subtotal * (porcentaje / 100) : 0;
}

export function calcularTotal(subtotal, descuento) {
  if (
    !Number.isFinite(subtotal) ||
    !Number.isFinite(descuento) ||
    subtotal < 0 ||
    descuento < 0 ||
    descuento > subtotal
  ) {
    throw new TypeError("Los importes del pedido no son válidos.");
  }

  return subtotal - descuento;
}

export function validarDatosPedido(datos) {
  const errores = {};
  const nombre = typeof datos.nombre === "string" ? datos.nombre.trim() : "";
  const email = typeof datos.email === "string" ? datos.email.trim() : "";
  const modalidad = datos.modalidad ?? "";
  const direccion = typeof datos.direccion === "string" ? datos.direccion.trim() : "";
  const codigoPostal =
    typeof datos.codigoPostal === "string" ? datos.codigoPostal.trim() : "";
  const observaciones =
    typeof datos.observaciones === "string" ? datos.observaciones : "";
  const codigoPostalEspanol = /^(?:(?:0[1-9]|[1-4][0-9]|5[0-2])[0-9]{3})$/;
  const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (nombre.length < 2 || nombre.length > 60) {
    errores.nombre = "Escribe un nombre de entre 2 y 60 caracteres.";
  }

  if (!formatoEmail.test(email)) {
    errores.email = "Introduce un correo con un formato válido, por ejemplo nombre@dominio.es.";
  }

  if (modalidad !== "recogida" && modalidad !== "envio") {
    errores.modalidad = "Selecciona recogida o envío.";
  }

  if (modalidad === "envio") {
    if (direccion.length < 5 || direccion.length > 100) {
      errores.direccion = "La dirección debe tener entre 5 y 100 caracteres.";
    }

    if (!codigoPostalEspanol.test(codigoPostal)) {
      errores.codigoPostal = "Usa cinco cifras y una provincia entre 01 y 52.";
    }
  }

  if (observaciones.length > 200) {
    errores.observaciones = "Las observaciones no pueden superar 200 caracteres.";
  }

  // El checkbox solo es válido si viene expresamente marcado.
  if (datos.aceptacion !== true) {
    errores.aceptacion = "Debes confirmar que los datos son correctos.";
  }

  return errores;
}
