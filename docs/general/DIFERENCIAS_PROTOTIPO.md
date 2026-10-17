## 6. Diferencias entre el prototipo y la API (ajustes aplicados)

Estas decisiones adaptan el prototipo a lo que realmente soporta el backend. La apariencia visual no cambia.

| # | Prototipo | Especificación | Motivo |
|---|---|---|---|
| 1 | Total de la lista = suma de **todos** los precios | Total = suma de precios de los ítems **comprados** | `purchasedItems` es el único conjunto que se cobra; un precio en un no comprado inflaría el total |
| 2 | Lista de compras: entrada de producto al final | Entrada **arriba** de las tarjetas de ítems | Así lo pediste: campo + botón, y las tarjetas aparecen debajo |
| 3 | Ítems como filas simples | Ítems como **tarjetitas** con editar y eliminar | Así lo pediste |
| 4 | Formulario de deuda con descripción | **Sin** descripción en deudas | `POST /debts` no acepta `description` |
| 5 | Diferido sin cuenta | Diferido **con** cuenta obligatoria | `accountId` es requerido en todos los egresos |
| 6 | Pantalla de "Cuentas" en la barra | "Cuentas" y "Tarjetas" en **Más**; "Gestión" en la barra | Ajuste solicitado en la revisión anterior |
| 7 | Recordatorio de tarjeta: solo antelación | Antelación (0–30) **y** hora (0–23) | `reminderHour` existe en la API |
| 8 | Filtro "Recurrentes" en la lista | Filtrado en cliente | La API no filtra por `sourceType` en egresos |
| 9 | Hora fija de recordatorios | Hora seleccionable | Los recordatorios tienen hora configurable |
| 10 | Contador de bloqueo fijo | Contador con `retryAfterMinutes` real | Lo devuelve la API en 423 y 429 |
| 11 | Botón "Eliminar movimiento" siempre visible | Visible solo si la API lo permite | Reglas de borrado por `sourceType` |
| 12 | Cuotas con botón sin estado de carga | Botón con estado de carga y bloqueo doble | Evita doble pago de la misma cuota |

---

