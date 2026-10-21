### F11 — Cobros y componentes compartidos de obligaciones

**Objetivo:** registrar dinero que te deben en cuotas, cobrar cada cuota (genera un ingreso) y construir los componentes que reutilizan préstamos (F12) y deudas (F13).

**Rama:** `feature/11-collections` · **Depende de:** F06, F08

**Componentes compartidos** (`src/features/obligations/`)
- `ObligationScreen`: pantalla con segmentado "Cobros" | "Préstamos" | "Deudas" (ruta `obligations/[tab]`).
- `ObligationRow`: fila con `Avatar` (iniciales, 38), nombre, "{pagadas} de {total} cuotas pagadas", monto total a la derecha.
- `InstallmentRow`: fila de cuota (ver detalle).
- `ObligationForm`: formulario genérico parametrizado por tipo.
- `PayInstallmentSheet`: hoja para elegir cuenta y pagar una cuota.
- `reminderRules.ts`: lógica de campos de recordatorio (sección de reglas).

**Pantalla de obligaciones** (`obligations/[tab]`)
- `LargeHeader` con título del tab ("Cobros" / "Préstamos" / "Deudas"), subtítulo "Cuotas y recordatorios".
- Segmentado de 3 opciones (margen `6 0 16`).
- `HeroSm`: etiqueta "Pendiente total", cifra = suma de `totalAmount − paidAmount` del tab.
- SectionHeader "Activos" y Group con `ObligationRow` por registro → `obligations/[tab]/[id]`.
- Botón ghost "Nuevo registro" (margen superior 14) → `obligations/[tab]/new`.
- Vacío: `EmptyState` "No tienes registros en {tab}".

**Detalle de cobro** (`obligations/cobros/[id]`)
- `TopBar` "Cobro · {persona}" con atrás.
- Bloque centrado: `Avatar` 64 (iniciales, 22/600), nombre 18/600, descripción 15 `muted` ("Sin descripción" si no tiene).
- `Card`: filas "Total" (14), "Pagado" (14, cifra en `positive`), "Pendiente" (14), y `ProgressBar` con el % pagado.
- SectionHeader "Cuotas" y Group con `InstallmentRow` por cuota: icono tile neutro con número, título monto (16/500), subtítulo fecha de vencimiento (`dueDate`, `d MMM yyyy`), y a la derecha:
  - Pagada: `Tag ok` "Pagada".
  - Pendiente: botón `small` primario "Marcar pagada" → hoja.
- Botón danger "Eliminar registro" en Group (margen superior 18). `DELETE /collections/:id`, conserva ingresos.

**Hoja "Marcar cuota como pagada"**
- Título "Marcar cuota como pagada" (sh-t), subtítulo "{persona} · {monto}".
- Group: "Cuenta destino" (select).
- Botón primario "Confirmar" → `POST /collections/:id/installments/:installmentId/pay` con `{ accountId }`.
  - 200 → cerrar hoja, toast "Cuota marcada como pagada", reemplazar el botón por `Tag ok` "Pagada", invalidar cobros, cuentas, movimientos y home.
  - 400 → "Esta cuota ya está pagada".

**Formulario de registro** (`obligations/[tab]/new`) — genérico
- `TopBar` "Nuevo {tipo}" con atrás y "Guardar" (tbtn). `LargeHeader` "Nuevo {tipo}".
- Group:
  - "Persona" (máx. 80) — placeholder "Nombre".
  - "Monto" (decimal > 0).
  - "Cuotas" (stepper, mínimo 1, valor 1).
  - Préstamos: "Cuenta" (select) — la cuenta de la que sale el dinero (F12).
- SectionHeader "Descripción opcional": Group con `textarea` (máx. 255, placeholder "Notas") — **solo en cobros y préstamos**.
- SectionHeader "Recordatorio": Group con "Activar recordatorio" (switch, default on) y los campos según cuotas (regla abajo).
- Botón primario "Guardar".

**Reglas de recordatorio (`reminderRules.ts`)**
| Cuotas | Campos mostrados | Enviar |
|---|---|---|
| 1 | "Fecha y hora del aviso" (date picker + select de hora 00–23, minutos fijos en 00) | `reminderAt` (ISO UTC con esa hora) + `reminderEnabled` |
| > 1 | "Frecuencia" (Semanal / Mensual / Anual) + día según frecuencia (día de semana, día del mes, o mes + día) + "Hora" (select 00–23) | `reminderFrequency`, `reminderDayOfWeek` / `reminderDayOfMonth` / `reminderMonth`, `reminderHour` |
| Recordatorio desactivado | ninguno | `reminderEnabled: false` |

- Cambiar `Cuotas` de 1 a más (o viceversa) limpia los campos de recordatorio que ya no aplican.

**Reglas**
- Editar un cobro con cuotas pagadas: solo `personName`, `description` y recordatorio. Mostrar esos campos habilitados y el resto en `muted` con nota "Bloqueado porque ya hay cuotas pagadas".
- Editar sin cuotas pagadas: permite monto y cuotas (regenera el plan).

**Endpoints**
| Método | Ruta | Uso |
|---|---|---|
| POST | `/collections` | crear |
| GET | `/collections?status=` | listado con `paidAmount`, `pendingAmount` |
| GET | `/collections/:id` | detalle con `installments` |
| PATCH | `/collections/:id` | editar |
| DELETE | `/collections/:id` | eliminar |
| POST | `/collections/:id/installments/:installmentId/pay` | body `{ accountId, name?, description? }` |

**Commits**
```
feat(obligations): pantalla con segmentado cobros, prestamos y deudas
feat(obligations): formulario generico con reglas de recordatorio por cuotas
feat(collections): detalle de cobro con cuotas y progreso
feat(collections): marcar cuota pagada con hoja de cuenta destino
```

**Criterios de aceptación**
- [ ] Un cobro de 1 cuota muestra fecha y hora del aviso; uno de 3 cuotas muestra frecuencia.
- [ ] Marcar una cuota pagada crea un ingreso visible en Movimientos.
- [ ] Pagar la misma cuota dos veces muestra el mensaje de 400.

---
