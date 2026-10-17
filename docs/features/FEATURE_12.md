### F12 — Préstamos

**Objetivo:** registrar dinero que prestas (genera un egreso al crear) y cobrar sus cuotas (cada una genera un ingreso).

**Rama:** `feature/12-loans` · **Depende de:** F11

**Reutiliza:** `ObligationScreen`, `ObligationRow`, `InstallmentRow`, `PayInstallmentSheet`, `reminderRules`.

**Diferencias respecto a cobros**
- **Formulario:** incluye "Cuenta" obligatoria (de donde sale el dinero). Al guardar se crea un egreso `LOAN_CREATION` en esa cuenta.
- **Detalle:** muestra "Cuenta de salida: {nombre}" en un `hint` debajo de las cuotas.
- **Pago de cuota:** el ingreso se registra en la cuenta **destino** elegida en la hoja (puede ser distinta).
- **Edición:** `accountId` y `totalAmount` son **inmutables**. Mostrar esos campos como solo lectura con `muted`. Con cuotas pagadas: solo `personName`, `description` y recordatorio.
- **Eliminar:** conserva el egreso de creación y los ingresos.

**Textos específicos**
- Confirmación al crear: toast "Préstamo registrado · egreso creado".
- Hoja de pago: título "Marcar cuota como pagada", cuenta destino "Cuenta destino".

**Endpoints**
| Método | Ruta | Uso |
|---|---|---|
| POST | `/loans` | body `{ accountId, personName, totalAmount, installmentsCount, description?, reminder* }` |
| GET | `/loans?status=` | listado |
| GET | `/loans/:id` | detalle con `installments` y `expenseId` |
| PATCH | `/loans/:id` | editar (campos permitidos según cuotas pagadas) |
| DELETE | `/loans/:id` | eliminar |
| POST | `/loans/:id/installments/:installmentId/pay` | body `{ accountId, name?, description? }` |

**Commits**
```
feat(loans): formulario de prestamo con cuenta de salida
feat(loans): detalle con cuenta de salida y campos inmutables
feat(loans): cobro de cuotas con ingreso en cuenta destino
```

**Criterios de aceptación**
- [ ] Crear un préstamo de $200 resta $200 de la cuenta elegida.
- [ ] Cobrar una cuota suma a la cuenta destino elegida, no necesariamente a la de salida.
- [ ] No se puede cambiar la cuenta ni el monto de un préstamo existente.

---
