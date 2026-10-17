
### F14 — Listas de compras

**Objetivo:** crear listas con productos en tarjetas, marcarlos como comprados, calcular el total por precio individual o por total manual, y cerrar la lista generando un egreso.

**Rama:** `feature/14-shopping-lists` · **Depende de:** F06, F08

**Pantalla Listas** (`shopping/[tab]`)
- `LargeHeader` "Compras" con subtítulo "Listas y cierres" (cuando el tab es Abiertas) o el título "Listas cerradas" en el `TopBar`.
- Segmentado "Abiertas" | "Cerradas" (margen `6 0 16`).
- **Abiertas:** una `Card` (fondo `surface`, radio 20, padding 16, margen inferior 12) por lista:
  - Fila: nombre 17/600 a la izquierda; chevron `muted` a la derecha.
  - Texto 13 `muted`: "{comprados} de {total} comprados".
  - `ProgressBar` (margen superior 12).
  - Tocar → `shopping/[id]`.
  - Botón ghost "Nueva lista" → `shopping/new`.
- **Cerradas:** Group con filas: icono `cart`, nombre, subtítulo "{fecha} · {n} ítems · {cuenta}", valor = `total`. Tocar → detalle (solo lectura).

**Pantalla Nueva lista** (`shopping/new`)
- `TopBar` "Nueva lista" con atrás y "Crear" (tbtn).
- `LargeHeader` "Nueva lista".
- Group: "Nombre" (máx. 80) — placeholder "Ej. Compras de la semana".
- SectionHeader "Productos iniciales": Group con `textarea` (placeholder "Un producto por línea"). Cada línea se envía como un ítem `{ name }` (máx. 120).
- Botón primario "Crear lista" → `POST /shopping-lists` con `{ name, items }`.

**Detalle de lista abierta** (`shopping/[id]`)
- `TopBar` con nombre, atrás y "Editar" a la derecha → **renombrar** (hoja con un campo "Nombre" y botón "Guardar" → `PATCH /shopping-lists/:id`).
- `LargeHeader`: título = nombre, subtítulo `id="cnt"` = "{comprados} de {total} comprados" (se actualiza en vivo).
- **Group "Precios individuales":** fila con título "Precios individuales", subtítulo 13 `muted` "Suma cada precio y calcula el total", y `Switch` a la derecha. **Default: desactivado.**
- SectionHeader "Productos".
- **Entrada de producto (arriba de la lista de tarjetas):**
  - Fila con `TextField` "Agregar producto" (máx. 120) y botón `small` "Agregar" a la derecha. Enter también agrega.
  - Al agregar: `POST /shopping-lists/:id/items` con `{ name }`. Mientras responde, mostrar la tarjeta en estado "pendiente" (opacidad 0.6). Si falla, quitarla y mostrar toast con el error.
  - Vacío: el campo se limpia y el foco vuelve a él.

**Tarjetita de ítem** (componente `ItemCard`)
- Contenedor: fondo `surface`, radio **16**, padding `12 14`, margen inferior 8, `elevation 0`.
- Fila interna (alineación centro, gap 12):
  1. `Checkbox` 24 (toca → `PATCH .../check` con `isPurchased`; optimista).
  2. Bloque de texto: nombre 16/500 (si está comprado: tachado y color `muted`). Si el switch de precios está activo y el ítem tiene precio: subtítulo 13 `muted` con el precio formateado.
  3. Si el switch de precios está activo: **campo de precio** a la derecha (ancho 96, fondo `fill`, radio 10, padding `7 8`, texto 15 alineado a la derecha, placeholder "$0.00", teclado decimal). Se guarda al perder el foco con `PATCH .../items/:itemId` con `{ price }` (debounce 600 ms). Precio debe ser `> 0`; vacío no envía nada.
  4. Icono **editar** (`edit` 18, `accent-ink`, botón 30 × 30) → modo edición en la tarjeta.
  5. Icono **eliminar** (`trash` 18, `negative`, botón 30 × 30) → `DELETE .../items/:itemId` con confirmación `Alert`: "Se quitará «{nombre}» de la lista."
- **Modo edición:** la tarjeta muestra un `TextField` con el nombre y dos botones `small`: "Cancelar" (ghost) y "Guardar" (primario). Guardar → `PATCH .../items/:itemId` con `{ name }`.
- Ítems y precios no se pueden editar cuando la lista está cerrada.
- Lista vacía: `EmptyState` "Aún no hay productos" con texto "Agrega el primero arriba."

**Sección Total de la compra**
- SectionHeader "Total de la compra" y Group con una fila: etiqueta "Total" (16) y campo de total a la derecha (18/600, alineado a la derecha).
- **Con precios individuales activos:** el campo es de solo lectura, texto `muted` (estado "bloqueado"). Su valor = suma de los precios de los ítems **marcados como comprados** (ver sección 6).
- **Con precios individuales desactivados:** el campo es editable (teclado decimal). Valor manual.
- Nota (`Note`) bajo el grupo, cambia según el estado:
  - Activo: "El total se calcula sumando los precios de cada producto."
  - Desactivado: "Escribe el total de la compra. Activa precios individuales para calcularlo."

**Botón "Cerrar lista"** (primario, margen superior 16) → hoja.

**Hoja "Cerrar lista"**
- Título "Cerrar lista" (sh-t), subtítulo "Se registrará un egreso por el total de la compra".
- `AmountInput` no editable con el total actual.
- Group: "Cuenta de pago" (select).
- `Note`: "Los productos no comprados pasan a una nueva lista abierta."
- Botón primario "Cerrar y registrar egreso" → `POST /shopping-lists/:id/close`.

**Reglas de cierre (cumplir la regla XOR de la API)**
- Debe haber **al menos un** ítem comprado. Si no: mensaje "Marca al menos un producto como comprado".
- **Modo precios individuales activo:**
  - Todos los comprados deben tener precio `> 0`. Si falta: "Falta el precio de «{nombre}»" y resaltar el campo.
  - Body: `purchasedItems: [{ id, price }]` (solo comprados) y **sin** `total`.
- **Modo precios individuales desactivado:**
  - `total` obligatorio y `> 0`. Si no: "Escribe el total de la compra".
  - Body: `purchasedItems: [{ id }]` (solo comprados) y `total`.
- `notPurchasedItems: [{ id }]` con todos los no comprados.
- La API exige que `purchasedItems` + `notPurchasedItems` cubran todos los ítems activos: enviar siempre el estado completo.
- Éxito (200) → cerrar hoja, toast "Lista cerrada · egreso creado". Si `newList` no es `null`, toast adicional: "Se creó una lista con {n} pendientes". Volver a Listas.

**Lista cerrada** (`shopping/[id]` con estado CLOSED)
- Bloque centrado: fecha de cierre (14 `muted`), total 34/700, "{n} ítems · {cuenta}".
- `Note`: "Lista cerrada e inmutable. Se registró un egreso por el total desde {cuenta}."
- Sin switch, sin entrada de productos, sin botón cerrar. Los ítems comprados se muestran como lista de solo lectura (opcional según respuesta de la API).

**Eliminar lista** (solo abierta): botón danger en Group al final: `DELETE /shopping-lists/:id`, confirmación.

**Endpoints**
| Método | Ruta | Uso |
|---|---|---|
| POST | `/shopping-lists` | body `{ name, items?: [{ name }] }` |
| GET | `/shopping-lists?status=OPEN\|CLOSED` | listado con `items` |
| GET | `/shopping-lists/:id` | detalle |
| PATCH | `/shopping-lists/:id` | renombrar `{ name }` (solo abierta) |
| DELETE | `/shopping-lists/:id` | eliminar |
| POST | `/shopping-lists/:id/items` | agregar `{ name }` |
| PATCH | `/shopping-lists/:id/items/:itemId` | `{ name? , price? }` (price > 0) |
| PATCH | `/shopping-lists/:id/items/:itemId/check` | `{ isPurchased }` |
| DELETE | `/shopping-lists/:id/items/:itemId` | eliminar ítem (solo abierta) |
| POST | `/shopping-lists/:id/close` | body `{ accountId, purchasedItems, notPurchasedItems?, total? }` |

**Commits**
```
feat(shopping): listas abiertas y cerradas con tarjetas de progreso
feat(shopping): crear lista con productos iniciales
feat(shopping): agregar productos con campo y boton y tarjetas de item
feat(shopping): editar y eliminar productos en tarjetas
feat(shopping): precios individuales con total calculado y total manual
feat(shopping): cerrar lista con regla de precio o total y nueva lista automatica
feat(shopping): renombrar y eliminar listas abiertas
```

**Criterios de aceptación**
- [ ] Agregar un producto con el botón lo muestra como tarjeta debajo del campo.
- [ ] Con precios individuales activos, el total se bloquea y suma solo los comprados.
- [ ] Con el switch desactivado, el total se escribe a mano y se envía como `total`.
- [ ] Cerrar con un comprado sin precio muestra el error y no llama a la API.
- [ ] Tras cerrar, los no comprados aparecen en una nueva lista abierta.
- [ ] Una lista cerrada no permite agregar, editar, eliminar ni cambiar precios.

---
