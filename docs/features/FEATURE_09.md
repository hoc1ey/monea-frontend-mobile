### F09 — Egresos diferidos

**Objetivo:** registrar compras a cuotas cargadas a una tarjeta, consultar el plan de cuotas y su estado.

**Rama:** `feature/09-deferred-expenses` · **Depende de:** F07, F08

**Formulario diferido** (segmento "Diferido" dentro de `movements/expense/new`)
- Mismo `AmountInput` y "Nombre" que el egreso instantáneo.
- Group:
  - "Cuenta" (select) — **requerida por la API**: es la cuenta de la que se descontará al pagar el periodo de la tarjeta. Nota de ayuda debajo: "El saldo cambia cuando pagues el periodo de la tarjeta."
  - "Tarjeta" (select con `{nombre} ·{últimos 4}`).
  - "Cuotas" (stepper, mínimo 1, valor inicial 3).
  - "Meses de gracia" (stepper, mínimo 0, valor inicial 0).
  - "Fecha de compra" (date picker, por defecto hoy).
- `POST /expenses` con `{ accountId, name, amount, paymentMethod: "DIFERIDO", creditCardId, installments, graceMonths, date }`.

**Detalle de compra diferida** (`movements/deferred/[id]`)
- `TopBar` "Compra diferida" con atrás.
- Bloque centrado: nombre 16 `muted`, monto 34/700 (`text`), pie "{tarjeta} · {n} cuotas" (14 `muted`).
- `Card` con fila "Cuotas pagadas" a la izquierda y "{pagadas} de {total}" en negrita a la derecha; `ProgressBar` debajo con el porcentaje de cuotas pagadas.
- SectionHeader "Plan de cuotas" y Group. Cada fila:
  - Icono tile neutro con el número de cuota (14/700).
  - Título: monto de la cuota (16/500). Subtítulo: periodo en formato "Oct 2026".
  - Valor: `Tag ok` "Pagada" o `Tag` "Pendiente".
- Nota 13 `muted` al final: "Las cuotas no descuentan del saldo de la cuenta hasta pagar el periodo de la tarjeta."
- Sin botón editar (las reglas de edición se gestionan desde la API; fuera de alcance de la primera versión).

**Reglas**
- `installments ≥ 1`, `graceMonths ≥ 0`, `creditCardId` obligatorio.
- Un egreso diferido no afecta `currentBalance` de la cuenta; el saldo cambia con `POST /credit-cards/:id/pay`.
- Pagar un periodo con cuotas de este egreso marca esas cuotas como pagadas: refrescar el detalle al volver.
- No permitir eliminar un diferido con cuotas pagadas (la API responde 400; mostrar el mensaje).

**Endpoints**
| Método | Ruta | Uso |
|---|---|---|
| POST | `/expenses` | crear diferido |
| GET | `/expenses/:id` | plan (`installmentPlan`: `number`, `amount`, `period`, `isPaid`) |
| GET | `/expenses?paymentMethod=DIFERIDO` | listado (en F08) |

**Commits**
```
feat(deferred): formulario de egreso diferido con cuotas y meses de gracia
feat(deferred): detalle con progreso y plan de cuotas por periodo
```

**Criterios de aceptación**
- [ ] Crear un diferido de $900 en 3 cuotas muestra el plan con $300 por periodo.
- [ ] El saldo de la cuenta no cambia tras crear el diferido.
- [ ] El progreso refleja las cuotas pagadas por el pago de tarjeta.

---
