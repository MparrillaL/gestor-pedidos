import { Producto } from "./productos.js";

// Los datos sin procesar sirven únicamente de entrada para construir el catálogo.
// Los identificadores no son consecutivos: así se demuestra que no son posiciones.
const datosProductos = [
  { id: 101, nombre: "Ratón USB", categoria: "perifericos", precio: 12.5, stock: 8 },
  { id: 315, nombre: "Teclado inalámbrico", categoria: "perifericos", precio: 24.9, stock: 0 },
  { id: 208, nombre: "Monitor 24 pulgadas", categoria: "pantallas", precio: 149.99, stock: 4 },
  { id: 456, nombre: "Soporte para portátil", categoria: "accesorios", precio: 39.95, stock: 7 },
  { id: 120, nombre: "Auriculares con micrófono", categoria: "perifericos", precio: 45.0, stock: 5 },
  { id: 602, nombre: "Paquete de papel A4", categoria: "oficina", precio: 5.75, stock: 30 },
  { id: 744, nombre: "Archivador de palanca", categoria: "oficina", precio: 8.6, stock: 12 },
  { id: 891, nombre: "Regleta USB-C", categoria: "accesorios", precio: 58.0, stock: 6 }
];

// map recorre los datos y devuelve una instancia de Producto por cada objeto.
export const catalogo = datosProductos.map(
  ({ id, nombre, categoria, precio, stock }) =>
    new Producto(id, nombre, categoria, precio, stock)
);

// Estas colecciones viven solo en memoria. Al recargar se crea una sesión nueva.
// Se exportan como constantes porque siempre cambia su contenido, no su referencia.
export const carrito = [];
export const pedidos = [];
