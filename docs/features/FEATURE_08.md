### F08 — Movimientos e ingresos/egresos

**Objetivo:** ver todos los movimientos combinados, filtrarlos, consultar el detalle y registrar ingresos y egresos instantáneos.

**Rama:** `feature/08-movements` · **Depende de:** F06

**Pantalla Movimientos** (`(tabs)/movements`)
- `LargeHeader` "Movimientos" con acción derecha: icono-botón `search` 36 circular (abre búsqueda por nombre; filtra en cliente).
- **Chips** de filtro: "Todos", "Ingresos", "Egresos", "Diferidos", "Recurrentes".
- **Banner** (solo si hay egresos con `amountPending`, y el filtro no es "Ingresos"): fondo `accent-soft`, icono `repeat` en tile, título "{n} egreso necesita monto", subtítulo "{nombre} · {fecha}", chevron → `recurring/define-amount` (F10).
- Lista agrupada por fecha: SectionHeader con "Hoy", "Ayer" o `d MMM`; Group de filas.
- Fila de movimiento: icono tile (`cart` para egresos instantáneos, `down` para ingresos, `card` para diferidos, `repeat` para recurrentes, `card` para pagos de tarjeta), título `name`, subtítulo "{cuenta} · {origen}" (origen: Manual, Recurrente, Cobro, Tarjeta, Préstamo, Deuda, Lista), valor: `+$monto` en `positive` si es ingreso, `−$monto` en `text` si es egreso, `Tag acc` "Definir monto" si está pendiente.
- Botón ghost "Ver egresos recurrentes" al final → `recurring` (F10).

**Mapeo de filtros a la API**
| Chip | Consulta |
|---|---|
| Todos | `GET /incomes` + `GET /expenses` (paginados, combinados por `date` DESC) |
| Ingresos | solo `GET /incomes` |
| Egresos | `GET /expenses?paymentMethod=CORRIENTE` |
| Diferidos | `GET /expenses?paymentMethod=DIFERIDO` |
| Recurrentes | `GET /expenses` filtrando en cliente `sourceType = RECURRING` |

> **Limitación de la API:** no existe filtro por `sourceType` en `/expenses`. El filtro "Recurrentes" se hace en cliente sobre las páginas cargadas. Sugerencia para backend: agregar `sourceType` como query opcional.

**Detalle de movimiento** (`movements/[id]`)
- `TopBar` "Detalle" con atrás. "Editar" a la derecha solo si es editable (ver reglas). Sin botón si no.
- Bloque centrado: icono tile 56 (radio 18), nombre 17/600, monto 34/700 (`pos` si ingreso), fecha y hora (`d MMM · HH:mm`).
- Note si es automático: "Generado automáticamente desde **{origen}**. El monto se gestiona desde su módulo de origen." (margen inferior 14).
- Group: "Cuenta", "Forma de pago", "Origen", "Fecha".
- Botón danger "Eliminar movimiento" dentro de un Group (margen superior 18) — **solo si la API lo permite**.

**Reglas de edición y borrado (API)**
- **Ingreso `MANUAL`:** editable (todos los campos), eliminable.
- **Ingreso automático** (`COLLECTION_INSTALLMENT`, `LOAN_INSTALLMENT`): solo `name` y `description` editables. No eliminable (400).
- **Egreso `CORRIENTE` manual:** editable; eliminable.
- **Egreso automático:** `RECURRING` editable/eliminable según la API; `CARD_PAYMENT`, `LOAN_CREATION`, `DEBT_PAYMENT`, `SHOPPING_LIST` no eliminables. Mostrar el error de la API si falla.
- **Egreso `DIFERIDO`:** ver F09.

**Formulario de ingreso** (`movements/income/new`)
- `TopBar` "Nuevo ingreso" con atrás y "Guardar" (tbtn).
- `AmountInput` (monto > 0).
- Group: "Nombre" (máx. 80, placeholder "Ej. Almuerzo" → para ingresos "Ej. Sueldo"), "Cuenta destino" (select), "Fecha" (date picker, por defecto hoy).
- SectionHeader "Descripción opcional": Group con textarea.
- Botón primario "Guardar" → `POST /incomes`.

**Formulario de egreso** (`movements/expense/new`)
- `TopBar` "Nuevo egreso" con atrás.
- **Segmentado** "Instantáneo" | "Diferido" | "Recurrente" (margen superior 8). Cambiar el segmento cambia el formulario en la misma pantalla.
- `AmountInput`.
- Group: "Nombre", "Cuenta" (select), "Forma de pago" (fijo "Corriente (contado)" en Instantáneo), "Fecha".
- Instantáneo: `POST /expenses` con `paymentMethod: CORRIENTE` (no enviar `creditCardId`, `installments` ni `graceMonths`).
- Diferido: ver F09. Recurrente: ver F10.

**Reglas**
- `amount`: ingresos `> 0`; egresos `≥ 0` (la API lo permite en 0 para variables; el formulario manual exige > 0).
- Fecha por defecto = ahora (UTC en el envío).
- Al crear, invalidar `incomes`, `expenses`, `accounts`, `home`.

**Endpoints**
| Método | Ruta | Uso |
|---|---|---|
| GET | `/incomes?page&limit&accountId&from&to` | listado paginado |
| GET | `/incomes/:id` | detalle |
| POST | `/incomes` | body `{ accountId, name, amount, description?, date? }` |
| PATCH | `/incomes/:id` | `name`, `description` (y demás si es manual) |
| DELETE | `/incomes/:id` | solo manuales |
| GET | `/expenses?page&limit&paymentMethod&amountPending&from&to&accountId` | listado paginado |
| GET | `/expenses/:id` | detalle (incluye `installmentPlan` si es diferido) |
| POST | `/expenses` | body `{ accountId, name, amount, description?, date?, paymentMethod? }` |
| PATCH | `/expenses/:id` | edición (ver reglas) |
| DELETE | `/expenses/:id` | eliminar |

**Commits**
```
feat(movements): lista combinada de ingresos y egresos agrupada por fecha
feat(movements): filtros por tipo y banner de montos pendientes
feat(movements): detalle de movimiento con reglas de edicion automatica
feat(movements): formulario de ingreso con cuenta destino
feat(movements): formulario de egreso instantaneo con selector de tipo
```

**Criterios de aceptación**
- [ ] La lista combina ingresos y egresos ordenados por fecha descendente.
- [ ] Un ingreso generado por cobro no muestra "Editar" de monto ni "Eliminar".
- [ ] Un egreso instantáneo descuenta del saldo de su cuenta.
- [ ] El paginado carga más al llegar al final sin duplicar filas.

---
