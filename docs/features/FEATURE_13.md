### F13 — Deudas

**Objetivo:** registrar lo que debes en cuotas y pagarlas (cada cuota genera un egreso).

**Rama:** `feature/13-debts` · **Depende de:** F11

**Reutiliza:** `ObligationScreen`, `ObligationRow`, `InstallmentRow`, `PayInstallmentSheet`, `reminderRules`.

**Diferencias respecto a cobros**
- **Formulario:** **no** tiene "Descripción" ni "Cuenta" (la API no los acepta). Campos: "Persona" (a quién le debes), "Monto", "Cuotas", recordatorio.
- **Creación:** no genera ningún movimiento.
- **Pago de cuota:** hoja con "Cuenta origen" (select). Genera un **egreso** `DEBT_PAYMENT` en esa cuenta.
- **Detalle:** sin descripción; el encabezado muestra "Deuda con {persona}".
- Confirmación al pagar: toast "Cuota pagada · egreso creado".

**Endpoints**
| Método | Ruta | Uso |
|---|---|---|
| POST | `/debts` | body `{ personName, totalAmount, installmentsCount, reminder* }` |
| GET | `/debts?status=` | listado |
| GET | `/debts/:id` | detalle con `installments` y `expenseId` por cuota |
| PATCH | `/debts/:id` | editar (con cuotas pagadas solo `personName` y recordatorio) |
| DELETE | `/debts/:id` | eliminar |
| POST | `/debts/:id/installments/:installmentId/pay` | body `{ accountId, name?, description? }` |

**Commits**
```
feat(debts): formulario de deuda sin descripcion ni cuenta
feat(debts): pago de cuota con egreso desde cuenta origen
```

**Criterios de aceptación**
- [ ] Crear una deuda no cambia ningún saldo.
- [ ] Pagar una cuota crea un egreso visible en Movimientos con origen "Deuda".
- [ ] El formulario no muestra "Descripción" ni "Cuenta".

---
