### F05 — Inicio (dashboard)

**Objetivo:** resumen del día con saldo total, deudas de tarjetas, por cobrar, pendientes y cuotas de la semana.

**Rama:** `feature/05-home-dashboard` · **Depende de:** F04 (y de las features de datos F06–F13 para sus secciones)

**Pantalla** (`(tabs)/index`)
1. **LargeHeader:** kicker `Viernes, 16 de octubre` (fecha actual, formato `EEEE, d 'de' MMMM`, capitalizada), título `Hola, {primer nombre}`, acción derecha: icono-botón `bell` 36 circular `fill` → Recordatorios.
2. **Hero** (sin margen superior adicional):
   - Etiqueta "Saldo total".
   - Cifra: suma de `currentBalance` de todas las cuentas (`formatMoney`).
   - Fila: "Deuda de tarjetas (periodo)" → suma de `currentDebt` de cada tarjeta.
   - Fila: "Por cobrar" → suma de `pendingAmount` de cobros.
3. **SectionHeader "Requiere atención"**
   - Group con filas:
     - Si hay tarjeta con pago en ≤ 3 días: icono `bell`, título "Pago {tarjeta} en {n} días", subtítulo "Recordatorio · {fecha y hora}" → detalle de la tarjeta.
     - Si hay egresos con `amountPending = true`: icono `repeat`, título "{nombre} · define el monto", subtítulo "Egreso de cantidad variable" → `recurring/define-amount`.
   - Si no hay nada: no mostrar la sección.
4. **SectionHeader "Cuentas"** con enlace derecho "Ver todas" (14, `accent-ink`) → `accounts`.
   - Scroll horizontal de `MiniAccountCard` (ancho 200, gap 12, margen horizontal -16 con padding 16 para que el scroll llegue al borde).
   - Al tocar: `accounts/[id]`.
5. **SectionHeader "Tarjetas"**
   - Group con una fila por tarjeta: icono tile de color de la tarjeta (fondo `color` al 20 %, icono `card` en `color`), título nombre, subtítulo "Pago el {día} de cada mes", valor = deuda del periodo.
6. **SectionHeader "Esta semana"**
   - Group con cuotas cuyo `dueDate` cae en los próximos 7 días (de cobros, préstamos y deudas, con `isPaid = false`):
     - Cobro: icono `down`, título "{persona} · cuota {n} de {total}", subtítulo "Cobro · vence {fecha}", valor `+$monto` en `positive`.
     - Deuda: icono `up`, valor `−$monto` en `negative`.
     - Préstamo: icono `bank`, valor `−$monto` en `negative`.
   - Filas navegables a su detalle.

**Estados:** skeleton con la forma del hero y 3 filas; sin datos → hero con `$0.00` y `EmptyState` "Empieza registrando una cuenta" con botón a `accounts/new`.

**Endpoints usados**
| Método | Ruta | Campos usados |
|---|---|---|
| GET | `/users/me` | `name`, `timezone` |
| GET | `/accounts` | `id`, `name`, `financialInstitution`, `color`, `currentBalance` |
| GET | `/credit-cards` | `id`, `name`, `color`, `issuer`, `cutoffDay`, `paymentDay` |
| GET | `/credit-cards/:id/debt` | `currentDebt`, `upcoming` |
| GET | `/credit-cards/:id/report?period=YYYY-MM` | periodo actual: `total`, `paid`, `cutoffDate`, `paymentDate` |
| GET | `/collections`, `/loans`, `/debts` | `installments` con `dueDate`, `isPaid`; `pendingAmount` |
| GET | `/expenses?amountPending=true` | pendientes de monto |
| GET | `/notifications/reminders` | recordatorios próximos |

> **Costo:** la pantalla hace varias consultas en paralelo con `useQueries`. Usar `staleTime` de 60 s.

**Commits**
```
feat(home): hero con saldo total, deuda de tarjetas y por cobrar
feat(home): seccion requiere atencion con pagos cercanos y montos pendientes
feat(home): carrusel de cuentas y lista de tarjetas
feat(home): cuotas de la semana desde cobros, prestamos y deudas
```

**Criterios de aceptación**
- [ ] El saldo total coincide con la suma de `currentBalance`.
- [ ] La sección "Esta semana" solo muestra cuotas no pagadas con vencimiento en 7 días.
- [ ] Tocar cada tarjeta, cuenta o cuota abre su detalle.
- [ ] Layout idéntico al prototipo en claro y oscuro.

---
