// Una clase agrupa los datos de cada producto con el comportamiento que le corresponde.
export class Producto {
  // El constructor convierte cada objeto del catálogo en una instancia real de Producto.
  constructor(id, nombre, categoria, precio, stock) {
    // Estos controles evitan que entren precios, stocks o identificadores imposibles.
    if (
      !Number.isInteger(id) ||
      typeof nombre !== "string" ||
      nombre.trim() === "" ||
      typeof categoria !== "string" ||
      categoria.trim() === "" ||
      !Number.isFinite(precio) ||
      precio <= 0 ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      throw new TypeError("Los datos del producto no son válidos.");
    }

    this.id = id;
    this.nombre = nombre.trim();
    this.categoria = categoria.trim();
    this.precio = precio;
    this.stock = stock;
  }

  // Usa this porque consulta el stock del objeto concreto sobre el que se llama al método.
  hayDisponibilidad(cantidad) {
    // Evitamos que una entrada numérica vacía o decimal se acepte como stock válido.
    return Number.isInteger(cantidad) && cantidad > 0 && cantidad <= this.stock;
  }

  // Modificar el stock solo está permitido después de confirmar que la cantidad es válida.
  descontarStock(cantidad) {
    if (!this.hayDisponibilidad(cantidad)) {
      throw new RangeError(`No hay existencias suficientes de ${this.nombre}.`);
    }

    // Solo se llega aquí tras la validación completa del pedido.
    this.stock -= cantidad;
  }
}
