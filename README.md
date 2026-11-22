# Gestor de pedidos de material

Aplicación de cliente hecha con HTML, CSS y JavaScript. Permite buscar productos,
preparar un carrito, confirmar pedidos y consultar un historial temporal. Los datos
se guardan únicamente en memoria y desaparecen al recargar la página.

## Ejecutar la aplicación

Los módulos ES de JavaScript no deben abrirse con `file://`. Hay que servir la
carpeta mediante HTTP para que el navegador permita cargar los módulos con sus
cabeceras correctas.

Desde la raíz del proyecto:

```bash
python -m http.server 8000
```

Después se abre <http://localhost:8000>. También se puede usar la extensión Live
Server de VS Code o cualquier servidor equivalente.

## Estructura

```text
gestor-pedidos/
├── index.html
├── css/
│   └── estilos.css
├── js/
│   ├── app.js
│   ├── calculos.js
│   ├── datos.js
│   ├── productos.js
│   └── vista.js
└── README.md
```

- `index.html`: estructura de catálogo, carrito, formulario e historial.
- `css/estilos.css`: estilos responsivos, estados de error y layout.
- `js/productos.js`: clase `Producto` y sus métodos `hayDisponibilidad` y
  `descontarStock`.
- `js/datos.js`: catálogo creado con instancias de `Producto` y arrays
  `carrito` y `pedidos`.
- `js/calculos.js`: cálculos económicos y `validarDatosPedido`. Son funciones
  puras que no leen ni modifican el DOM.
- `js/vista.js`: creación y actualización segura del DOM con `createElement`,
  `textContent` y `replaceChildren`.
- `js/app.js`: eventos, filtros, carrito, validación completa, confirmación y
  exportación.

## Funcionalidades principales

### Modelo y catálogo

El catálogo se carga con ocho instancias de `Producto` de cuatro categorías. El
identificador no depende de la posición: se busca siempre con `find`. Hay un
producto agotado para probar ese estado.

La búsqueda no distingue mayúsculas y el filtro de categoría se combina con el
texto. Las tarjetas se crean en `crearTarjetaProducto` sin usar `innerHTML` con
datos dinámicos, por lo que el contenido se trata como texto y no como código.

### Carrito

`anadirAlCarrito` comprueba que la cantidad sea entera, positiva y no supere el
stock. Si el producto ya tiene una línea, suma la cantidad. Añadir al carrito no
descuenta existencias.

Los botones de retirada se controlan con un único evento `click` en
`lineas-carrito`. Se usa `event.target.closest(...)` para localizar el botón
dinámico y `splice` para eliminar la línea.

### Cálculos

- `calcularSubtotal(carrito, catalogo)`: suma precio por cantidad.
- `calcularDescuento(subtotal, porcentaje = 10)`: devuelve un 10 % cuando el
  subtotal es igual o superior a 100 €.
- `calcularTotal(subtotal, descuento)`: resta el descuento sin redondear.

Los números se mantienen como números hasta `formatearMoneda`, que muestra dos
decimales. `toFixed` no se utiliza para seguir calculando, porque convierte los
datos en cadenas.

### Formulario

El formulario usa `novalidate` para coordinar HTML5 y JavaScript desde el evento
`submit`. Se accede a los controles con `form.elements`, se recogen los datos con
`FormData` y se aplican `validity`, `setCustomValidity`, `checkValidity` y
`reportValidity`.

Los campos postales solo están habilitados para envío. La expresión regular del
código postal admite cinco cifras con provincia entre 01 y 52:

```js
/^(?:(?:0[1-9]|[1-4][0-9]|5[0-2])[0-9]{3})$/;
```

La validación JavaScript se vuelve a realizar completa al enviar. El contador de
observaciones se actualiza durante la edición.

### Confirmación e historial

Antes de modificar datos se valida todo el carrito y el formulario. Si es correcto:

1. se preparan copias con nombre, precio y subtotal de cada línea;
2. se descuenta el stock;
3. se añade el pedido al historial;
4. se vacía el carrito;
5. se repintan catálogo, carrito e historial.

Al guardar precios y nombres como valores, los pedidos antiguos no cambian si el
catálogo cambia más adelante. El historial puede filtrarse por modalidad y su
resumen suma solo los pedidos filtrados. «Exportar historial» muestra un JSON con
`JSON.stringify(pedidos, null, 2)`.

## Casos de prueba obligatorios

Todas estas pruebas parten de una recarga de la página, salvo que se indique
expresamente continuar con el caso anterior.

| #   | Caso                                | Pasos y datos                                                                                                          | Resultado esperado                                                                                                 |
| --- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1   | Carrito vacío                       | Abrir la página sin añadir productos.                                                                                  | Se muestra «El carrito está vacío», los importes son 0,00 € y confirmar está deshabilitado.                        |
| 2   | Producto agotado                    | Buscar `Teclado inalámbrico`.                                                                                          | Se muestra como agotado; cantidad y botón no se pueden usar.                                                       |
| 3   | Cantidad inválida                   | En Ratón USB escribir `0`, `1.5` o dejar vacío y pulsar Añadir.                                                        | Se rechaza la entrada; no aparece una línea nueva.                                                                 |
| 4   | Stock insuficiente                  | En Ratón USB, con 8 unidades disponibles, intentar añadir 9; después añadir 5 y volver a añadir 5.                     | Ambos intentos que superan 8 se rechazan. La primera suma válida conserva una sola línea.                          |
| 5   | Suma de cantidades                  | Añadir 2 Ratones USB y después añadir otros 3 del mismo producto.                                                      | Hay una sola línea del ratón con cantidad 5 y subtotal 62,50 €.                                                    |
| 6   | Retirada de líneas                  | Con al menos una línea en el carrito, pulsar Retirar.                                                                  | Desaparece la línea; si era la última, vuelve el estado vacío.                                                     |
| 7   | Umbral de 100 €                     | Añadir 1 Monitor de 149,99 €.                                                                                          | Subtotal 149,99 €, descuento 15,00 € aproximadamente y total 134,99 €. El descuento se redondea solo al mostrarlo. |
| 8   | Correo inválido                     | Añadir un producto, rellenar nombre `Ana López`, seleccionar recogida, marcar aceptación y escribir `ana@`. Confirmar. | Se señala el correo y no se vacía el carrito ni se modifica el stock.                                              |
| 9   | Código postal inválido              | Seleccionar envío y probar `00999`, `53001`, `2800` y `28001x`.                                                        | Los cuatro formatos se rechazan; `28001` se acepta.                                                                |
| 10  | Cambio de modalidad                 | Elegir envío, dejar dirección/CP con error y cambiar a recogida.                                                       | Los campos postales desaparecen, dejan de ser obligatorios y sus errores personalizados se borran.                 |
| 11  | Pedido y copia de precios           | Confirmar 1 Monitor con datos válidos. Buscar de nuevo el producto.                                                    | Se descuenta una existencia, el carrito se vacía y el historial muestra el precio de ese momento.                  |
| 12  | Historial y filtro sin resultados   | Tras crear un pedido de recogida, elegir `Envío` en el filtro del historial.                                           | El estado vacío aparece y el resumen muestra 0 pedidos · 0,00 €, sin `NaN` ni `Infinity`.                          |
| 13  | Filtros del catálogo sin resultados | Categoría `oficina` y búsqueda `monitor`.                                                                              | Aparece el mensaje de que no hay coincidencias.                                                                    |
| 14  | Exportación                         | Crear un pedido y pulsar Exportar historial.                                                                           | Aparece un textarea con JSON válido y copiable que contiene los datos y líneas del pedido.                         |

### Pruebas rápidas de funciones puras

Desde la consola se puede comprobar el descuento sin tocar la interfaz:

```js
const descuentoBajo = window.gestorPedidos.calcularDescuento(99.99);
const descuentoAlto = window.gestorPedidos.calcularDescuento(100);
console.log(descuentoBajo, descuentoAlto); // 0 10
```

La clase se puede inspeccionar con el catálogo expuesto para la práctica:

```js
const raton = window.gestorPedidos.catalogo.find((p) => p.id === 101);
console.log(raton.hayDisponibilidad(8)); // true
console.log(raton.hayDisponibilidad(9)); // false
```

## Depuración con DevTools

### Punto de interrupción

1. Servir el proyecto mediante HTTP y abrir DevTools.
2. En **Sources**, abrir `js/app.js`.
3. Colocar un punto de interrupción en `if (!comprobarStockCarrito())` dentro de
   `confirmarPedido`.
4. Añadir un producto, completar datos válidos y confirmar.
5. Al pausar, inspeccionar `carrito`, `datos` e `importes`. `carrito` todavía
   contiene la compra y el stock aún no se ha modificado.
6. Continuar y observar que se descuenta stock solo después de superar todas las
   comprobaciones.

Esta pausa evidencia la regla «comprobar todo antes de modificar nada».

### Pestaña Network

1. Abrir la pestaña **Network** antes de recargar.
2. Mantener activada la opción de desactivar caché y recargar con `Ctrl+F5`.
3. Seleccionar `app.js`. Deben verse la URL `http://localhost:8000/js/app.js`,
   método `GET` y estado `200`.
4. Repetir con `estilos.css` y confirmar que la página no se carga mediante
   `file://`.

Esta comprobación evidencia que los módulos y el CSS se cargan desde el servidor
HTTP local y permite detectar errores 404 o JavaScript rotos.

Enlace de la conversación de trabajo:
`agent-host-session://ahp-session/1ea1d71e-895d-4513-95e5-66f14e6204bf`

## Preguntas útiles para la defensa

- ¿Por qué `file://` no permite organizar cómodamente módulos y debe usarse HTTP?
- ¿Por qué un pedido copia nombre y precio en lugar de guardar la referencia al
  producto?
- ¿Qué método de `Producto` comprueba el stock y cuál lo modifica?
- ¿Qué diferencia hay entre `calcularTotal` y `actualizarCarrito`?
- ¿Por qué se comprueba el carrito otra vez al confirmar?
- ¿Qué ventaja tiene delegar la retirada de líneas?
- ¿Dónde se usa `FormData` y por qué no basta la validación HTML5?
