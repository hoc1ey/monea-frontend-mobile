### F07 — Tarjetas de crédito

**Objetivo:** registrar tarjetas, consultar el reporte por periodo y pagar un periodo (genera un egreso).

**Rama:** `feature/07-credit-cards` · **Depende de:** F06

**Pantallas**

**Tarjetas** (segmentado dentro de `accounts`, pestaña "Tarjetas")
- Por cada tarjeta, `CreditCardVisual` (margen inferior 14, tocable) → `cards/[id]`.
- Group con dos filas de resumen: "Deuda total de tarjetas" (suma de `currentDebt`) y "Cupo disponible total" (suma de `creditLimit − currentDebt − upcoming`).
- Botón ghost "Nueva tarjeta" → `cards/new`.

**Detalle de tarjeta** (`cards/[id]`)
- `TopBar` con nombre, atrás y "Editar" → `cards/[id]/edit`.
- `CreditCardVisual` (margen superior 12).
- Group de datos: "Cupo disponible" (`creditLimit − currentDebt − upcoming`), "Cupo total", "Fecha de corte" (`día {cutoffDay}`), "Fecha de pago" (`día {paymentDay}`).
- SectionHeader "Periodo" + **Chips** horizontales con los periodos de los últimos 3 meses y los 2 siguientes (etiquetas "Oct", "Nov", "Dic", "Ene"). Chip activo = periodo seleccionado (por defecto el mes actual).
- Card de periodo (surface, radio 20, padding 16):
  - Fila: izquierda "Total del periodo" (13 `muted`) y cifra 30/700; derecha `Tag`: "Pagado" (`ok`), "Pendiente" (`acc`) o "Sin cargos" (`default`).
  - Pie: "Corte {cutoffDate} · Pago {paymentDate}" (13 `muted`).
  - Botón small "Pagar periodo" (ancho 100 %, margen superior 14) — visible solo si hay total > 0 y no está pagado.
- SectionHeader "Compras del periodo" y Group con los `items` del reporte: icono `cart`, título `name`, subtítulo "Cuota {installmentNumber} de {installmentsTotal}", valor `amount`. Vacío → fila "Sin cargos en este periodo".

**Hoja "Pagar tarjeta"** (sheet)
- Título "Pagar {tarjeta}" (sh-t), subtítulo "Periodo {mes} · se generará un egreso corriente".
- `AmountInput` no editable mostrando el total del periodo.
- Group: "Cuenta origen" (select con las cuentas, muestra saldo).
- Botón primario "Confirmar pago".
- Acción: `POST /credit-cards/:id/pay` con `{ accountId, period }`.
  - 201 → cerrar hoja, toast "Pago registrado · egreso creado", invalidar tarjeta, cuentas, movimientos.
  - 409 → toast "Este periodo ya fue pagado".
  - 400 → mensaje de la API (periodo futuro o sin deuda).

**Formulario de tarjeta** (`cards/new`, `cards/[id]/edit`)
- `TopBar` con "Guardar" a la derecha. `LargeHeader` "Nueva tarjeta" / "Editar tarjeta".
- Group: "Alias" (máx. 60), "Entidad emisora" (máx. 80), "Últimos 4 dígitos" (teclado numérico, exactamente 4), "Cupo" (decimal, > 0, opcional).
- SectionHeader "Fechas": Group con "Día de corte" y "Día de pago" (selects 1–31, opcionales).
- SectionHeader "Recordatorio": Group con "Avisar antes del pago" (switch, default en `true` al crear) y "Antelación" (select 0–30 días; por defecto `1 día`) y "Hora del aviso" (select 00:00–23:00; por defecto `09:00`).
  - Regla: si el switch está activo, **`paymentDay` es obligatorio** (validación con mensaje "Indica el día de pago para activar el recordatorio").
- SectionHeader "Color": swatches de la misma paleta de cuentas (sección F06).
- Botón primario "Guardar tarjeta".

**Reglas**
- `lastFourDigits`: exactamente 4 dígitos numéricos.
- Cambiar `paymentDay` o el recordatorio reprograma el aviso en el backend (sin acción extra en UI).
- Eliminar tarjeta: `DELETE /credit-cards/:id` con confirmación. Los egresos diferidos existentes se conservan.

**Endpoints**
| Método | Ruta | Uso |
|---|---|---|
| POST | `/credit-cards` | body `{ name, color, issuer, lastFourDigits, creditLimit?, cutoffDay?, paymentDay?, reminderEnabled?, reminderDaysBefore?, reminderHour? }` |
| GET | `/credit-cards` | listado |
| GET | `/credit-cards/:id` | detalle |
| PATCH | `/credit-cards/:id` | edición |
| DELETE | `/credit-cards/:id` | eliminar |
| GET | `/credit-cards/:id/report?period=YYYY-MM` | periodo seleccionado |
| GET | `/credit-cards/:id/debt` | deuda y cupo |
| POST | `/credit-cards/:id/pay` | body `{ accountId, period? }` |

**Commits**
```
feat(cards): listado de tarjetas con tarjeta visual y resumen
feat(cards): detalle con chips de periodo y reporte mensual
feat(cards): formulario de tarjeta con fechas y recordatorio
feat(cards): pagar periodo con hoja de cuenta origen
```

**Criterios de aceptación**
- [ ] El cupo disponible coincide con `creditLimit − currentDebt − upcoming`.
- [ ] Pagar un periodo crea un egreso en la cuenta elegida y el periodo queda "Pagado".
- [ ] Pagar dos veces el mismo periodo muestra el mensaje de 409.
- [ ] Activar el recordatorio sin día de pago muestra error de validación.

---
