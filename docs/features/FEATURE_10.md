### F10 — Egresos recurrentes

**Objetivo:** configurar egresos automáticos (semanal, mensual, anual), activarlos o desactivarlos y definir el monto de los variables.

**Rama:** `feature/10-recurring-expenses` · **Depende de:** F08

**Pantalla Recurrentes** (`recurring`)
- `TopBar` "Recurrentes" con atrás.
- `LargeHeader` "Recurrentes" con subtítulo "Configuraciones programadas".
- Group con una fila por configuración: icono `repeat`, título `name`, subtítulo "{frecuencia} · próximo {nextRunAt en d MMM}", valor: `money(amount)` o `Tag acc` "Variable", y un `Switch` activo/inactivo a la derecha (llama a `PATCH .../active`).
- Tocar la fila → `recurring/[id]`.
- Botón ghost "Nuevo recurrente" → `movements/expense/new` en segmento Recurrente.

**Detalle de recurrente** (`recurring/[id]`)
- `TopBar` con nombre, atrás y "Editar".
- Bloque centrado: frecuencia (14 `muted`), monto 34/700 o "Variable", "Próximo: {fecha}".
- SectionHeader "Configuración": Group con "Cuenta", "Recordatorio" (ej. "Domingo 08:00 (día antes)"), "Estado" (`Tag ok` Activo / `Tag` Inactivo), "Activo" (switch).
- SectionHeader "Egresos generados": Group con egresos `RECURRING` de esta configuración (`GET /expenses?...` filtrado por `recurringConfigId` en cliente). Fila: icono `cart`, título "Egreso generado", subtítulo fecha de `occurrenceDate`, valor monto. Vacío → "Aún no se han generado egresos".
- Botón danger "Eliminar configuración" dentro de Group (margen superior 18).
- Pie de página (`hint`): "Eliminar la configuración no borra los egresos ya generados."

**Formulario de recurrente** (segmento "Recurrente" de `movements/expense/new`)
- `AmountInput` (oculto si "Monto variable" está activo).
- Group:
  - "Nombre" (máx. 80).
  - "Cuenta" (select).
  - "Frecuencia" (segmentado **Semanal** | **Mensual** | **Anual**).
  - "Día": según frecuencia:
    - Semanal → select `Lunes … Domingo` (1–7).
    - Mensual → select `1 … 31`.
    - Anual → select de mes (`Enero … Diciembre`) y, opcional, "Día del mes" (1–31). Si no se elige día, la API usa el día 1.
  - "Monto variable" (switch, default off).
  - "Fecha de inicio" (date picker, por defecto hoy).
  - "Fecha de fin" (date picker, opcional, con botón "Quitar").
- SectionHeader "Recordatorio": Group con "Avisar" (switch, default on), "Momento" (select `Mismo día` | `1 día antes`), "Hora" (select 00:00–23:00).
- Botón primario "Guardar recurrencia" → `POST /recurring-expenses`.

**Pantalla Definir monto** (`recurring/define-amount`)
- `TopBar` "Definir monto" con atrás.
- `LargeHeader` "Montos pendientes" con subtítulo "Fija el monto solo de estas ocurrencias. La configuración no cambia."
- Group con una fila por egreso pendiente (`GET /expenses?amountPending=true`): icono `repeat`, título `name`, subtítulo "{cuenta} · {fecha}", y a la derecha un campo numérico de 100 de ancho con fondo `fill`, radio 10, texto 15 alineado a la derecha, placeholder "$0.00".
- Botón primario "Guardar montos": envía `PATCH /expenses/:id/amount` por cada campo lleno (en paralelo). Éxito → toast "Monto guardado", invalidar listas. Errores por fila se muestran junto al campo.
- Vacío: `EmptyState` "No tienes montos pendientes".

**Reglas**
- `amount` es obligatorio si no es variable; **no enviarlo** si es variable.
- Validación: `dayOfWeek` 1–7, `dayOfMonth` 1–31, `monthOfYear` 1–12.
- `endDate ≥ startDate`.
- `reminderHour` obligatorio si el recordatorio está activo.
- Reactivar una configuración no genera egresos atrasados (lo maneja la API).

**Endpoints**
| Método | Ruta | Uso |
|---|---|---|
| POST | `/recurring-expenses` | crear |
| GET | `/recurring-expenses` | listado |
| GET | `/recurring-expenses/:id` | detalle |
| PATCH | `/recurring-expenses/:id` | editar |
| PATCH | `/recurring-expenses/:id/active` | body `{ isActive }` |
| DELETE | `/recurring-expenses/:id` | eliminar configuración |
| GET | `/expenses?amountPending=true` | pendientes de monto |
| PATCH | `/expenses/:id/amount` | body `{ amount }` |

**Commits**
```
feat(recurring): listado de recurrentes con interruptor de activo
feat(recurring): formulario con frecuencia, dia y recordatorio
feat(recurring): detalle con configuracion y egresos generados
feat(recurring): pantalla de definir monto para egresos variables
```

**Criterios de aceptación**
- [ ] Un recurrente variable no envía `amount` en el POST.
- [ ] Desactivar un recurrente cambia su estado sin borrar egresos.
- [ ] Definir el monto de un egreso variable lo quita de la lista de pendientes y del banner.

---
