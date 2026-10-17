# Monea API — Documento de Referencia (fuente de la verdad para el frontend)

Esta es la documentación oficial de la API de **Monea** (finanzas personales). Está pensada
como **fuente de la verdad para implementar las pantallas del frontend**: describe cada
endpoint, para qué sirve, qué datos necesita, qué devuelve y si requiere autenticación.

Backend: NestJS 12 + TypeORM + PostgreSQL (ESM). Swagger interactivo disponible en
`GET /api/docs` cuando el servidor está corriendo.

---

## 1. Convenciones generales

### 1.1 URL base y versionado
- Prefijo global: **`/api/v1`**.
- Excepción: **`GET /health`** NO lleva prefijo (queda en la raíz).
- Ejemplo: `https://<host>/api/v1/accounts`.
- Documentación Swagger: `/api/docs`.

### 1.2 Formato de respuesta (envelope)
TODAS las respuestas (éxito y error) usan este sobre, aplicado por un interceptor y un
filtro globales.

Éxito (HTTP 2xx):
```json
{
  "success": true,
  "statusCode": 200,
  "data": { },
  "message": "Operación exitosa",
  "errors": null
}
```

Error (HTTP 4xx/5xx):
```json
{
  "success": false,
  "statusCode": 400,
  "data": null,
  "message": "Error de validación",
  "errors": ["El nombre es obligatorio", "..."]
}
```

> **Importante para el frontend:** el contenido útil casi siempre está en `data`.
> `message` es un texto legible en español para mostrar al usuario, `errors` es un arreglo
> de strings (vacío/null en éxito).

### 1.3 Autenticación
- La autenticación es **global**: todos los endpoints requieren un token JWT **excepto**
  los marcados como públicos.
- Rutas **públicas** (sin token):
  - `GET /health`
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/refresh`
- Todas las demás requieren cabecera:
  ```
  Authorization: Bearer <accessToken>
  ```
- El `userId` **nunca** se envía en el body; el backend lo toma del JWT.
  Un recurso que no pertenece al usuario responde **404** (nunca 403).

### 1.4 Validación
- `whitelist: true` + `forbidNonWhitelisted: true`: enviar campos **no declarados** en el
  body/query produce **400**. El frontend debe enviar solo los campos documentados.
- `transform: true`: los valores se convierten a los tipos esperados (números, booleanos).
- IDs de ruta se validan como **UUID v4**; un formato inválido produce 400.

### 1.5 Rate limiting
- Rutas públicas: límite **strict** (por defecto 10 req/min por IP).
- Rutas autenticadas: límite **relaxed** (por defecto 100 req/min por usuario).
- Al exceder: **429**. Se puede desactivar con `RATE_LIMIT_ENABLED=false`.

### 1.6 Borrado lógico
- Nada se elimina físicamente. Los `DELETE` marcan `isDeleted = true` y `deletedAt`.
- Los listados solo devuelven registros activos.

### 1.7 Tipos y formatos
- **Dinero:** número con máximo 2 decimales. Ej: `250000.5`.
- **Fechas:** ISO 8601 en UTC (`timestamptz`). Ej: `2026-10-15T12:00:00.000Z`.
- **Fechas de calendario** (recurrencias, días de corte): `YYYY-MM-DD`.
- **Periodos** (tarjetas): `YYYY-MM`.
- **Zona horaria:** nombre IANA (ej. `America/Bogota`), validado contra `Intl`.

### 1.8 Enumeraciones (valores exactos)
| Enum | Valores |
|------|---------|
| `IncomeSourceType` | `MANUAL`, `COLLECTION_INSTALLMENT`, `LOAN_INSTALLMENT` |
| `ExpensePaymentMethod` | `CORRIENTE`, `DIFERIDO` |
| `ExpenseSourceType` | `MANUAL`, `RECURRING`, `CARD_PAYMENT`, `LOAN_CREATION`, `DEBT_PAYMENT`, `SHOPPING_LIST` |
| `CollectionStatus` / `LoanStatus` / `DebtStatus` | `PENDING`, `PARTIAL`, `PAID` |
| `ShoppingListStatus` | `OPEN`, `CLOSED` |
| `RecurrenceFrequency` | `WEEKLY`, `MONTHLY`, `YEARLY` |
| `ReminderOffset` | `SAME_DAY`, `ONE_DAY_BEFORE` |
| `ReminderType` | `CREDIT_CARD_PAYMENT`, `RECURRING_EXPENSE`, `COLLECTION`, `LOAN`, `DEBT` |
| `ReminderStatus` | `PENDING`, `SENT`, `FAILED`, `CANCELLED` |
| `DevicePlatform` | `ANDROID` |

### 1.9 Campos comunes de entidades
Casi todas las entidades heredan de `BaseEntity`:
```
id: string (UUID)
createdAt: string (ISO)
updatedAt: string (ISO)
isDeleted: boolean
deletedAt: string | null
```

---

## 2. Auth — `/auth`

### 2.1 `POST /auth/register` — Registrar usuario
- **Auth:** No (público).
- **Para qué sirve:** crear cuenta y autenticar en un solo paso.
- **Body:**
  | Campo | Tipo | Obligatorio | Reglas |
  |-------|------|-------------|--------|
  | `email` | string | Sí | email válido; se normaliza a minúsculas |
  | `password` | string | Sí | mín. 8, con mayúscula, minúscula y número |
  | `name` | string | Sí | mín. 2 caracteres |
  | `timezone` | string | No | zona IANA (default `America/Bogota`) |

- **Respuesta 201:** `data` = `AuthTokens`:
  ```json
  {
    "accessToken": "eyJ...",
    "refreshToken": "hex-64-bytes",
    "expiresIn": 900,
    "tokenType": "Bearer",
    "user": { "id": "uuid", "email": "a@b.com", "name": "Juan", "timezone": "America/Bogota" }
  }
  ```
- **Errores:** `400` datos inválidos / zona horaria inválida; `409` correo ya registrado.

### 2.2 `POST /auth/login` — Iniciar sesión
- **Auth:** No (público).
- **Body:** `{ "email": string, "password": string }`.
- **Respuesta 200:** `data` = `AuthTokens` (igual que en register).
- **Errores:**
  - `401` credenciales inválidas.
  - `423` cuenta bloqueada temporalmente (el body de error incluye `retryAfterMinutes`).
  - `429` IP bloqueada por demasiados intentos (incluye `retryAfterMinutes`).

### 2.3 `POST /auth/refresh` — Renovar tokens
- **Auth:** No (público).
- **Body:** `{ "refreshToken": string }`.
- **Respuesta 200:** `data` = `AuthTokens` (nuevo par; rota el refresh token).
- **Errores:** `401` token inválido, expirado o revocado (reutilización detectada ⇒ se
  invalidan todas las sesiones del usuario).

### 2.4 `POST /auth/logout` — Cerrar sesión actual
- **Auth:** Sí (Bearer).
- **Body:** `{ "refreshToken": string }` (opcional).
- **Respuesta 200:** `data: null`, mensaje "Sesión cerrada correctamente".

### 2.5 `POST /auth/logout-all` — Cerrar todas las sesiones
- **Auth:** Sí (Bearer).
- **Body:** ninguno.
- **Respuesta 200:** `data: null`, mensaje "Todas las sesiones activas han sido cerradas".

---

## 3. Users — `/users`

> Todas requieren autenticación. El usuario se obtiene del token.

### 3.1 `GET /users/me` — Perfil del usuario
- **Auth:** Sí.
- **Respuesta 200:** `data` = usuario (sin `passwordHash`):
  ```json
  {
    "id": "uuid",
    "email": "a@b.com",
    "name": "Juan",
    "timezone": "America/Bogota",
    "failedLoginAttempts": 0,
    "lockedUntil": null,
    "lastLoginAt": "2026-10-15T12:00:00.000Z",
    "isDeleted": false,
    "deletedAt": null,
    "createdAt": "2026-10-01T10:00:00.000Z",
    "updatedAt": "2026-10-15T12:00:00.000Z"
  }
  ```

### 3.2 `PATCH /users/me` — Actualizar perfil
- **Auth:** Sí.
- **Body:** `{ "name"?: string (mín. 2), "timezone"?: string (IANA) }`.
- **Respuesta 200:** `data` = usuario actualizado.
- **Errores:** `400` zona horaria inválida.

### 3.3 `PATCH /users/me/password` — Cambiar contraseña
- **Auth:** Sí.
- **Body:**
  | Campo | Tipo | Reglas |
  |-------|------|--------|
  | `currentPassword` | string | no vacío |
  | `newPassword` | string | mín. 8, mayúscula + minúscula + número |

- **Respuesta 200:** `data: null`. **Efecto:** cierra TODAS las sesiones (re-login).
- **Errores:** `401` contraseña actual incorrecta.

---

## 4. Accounts — `/accounts` (cuentas bancarias)

> Todas requieren autenticación. `currentBalance` se calcula como
> `saldoInicial + Σ ingresos − Σ egresos con paymentMethod = CORRIENTE` (los egresos
> diferidos se descuentan al pagar la tarjeta).

### 4.1 `POST /accounts` — Crear cuenta
- **Auth:** Sí.
- **Body:**
  | Campo | Tipo | Obligatorio | Reglas |
  |-------|------|-------------|--------|
  | `name` | string | Sí | máx. 60, alias de la cuenta |
  | `financialInstitution` | string | Sí | máx. 80 |
  | `color` | string | Sí | hex `#RRGGBB` |
  | `initialBalance` | number | Sí | máx. 2 decimales |
  | `description` | string | No | máx. 255 |

- **Respuesta 201:** `data` = cuenta (campos de entidad + `currentBalance`).

### 4.2 `GET /accounts` — Listar cuentas
- **Auth:** Sí.
- **Respuesta 200:** `data` = arreglo de cuentas con `currentBalance`, ordenadas por
  `createdAt` DESC.

### 4.3 `GET /accounts/:id` — Detalle de cuenta
- **Auth:** Sí. **Parámetro:** `id` (UUID v4).
- **Respuesta 200:** `data` = cuenta con `currentBalance`. `404` si no existe o no es del usuario.

### 4.4 `PATCH /accounts/:id` — Actualizar cuenta
- **Auth:** Sí.
- **Body:** cualquier subconjunto de los campos de creación.
- **Respuesta 200:** `data` = cuenta con `currentBalance`. Si se modificó `initialBalance`,
  el `message` lo advierte.

### 4.5 `DELETE /accounts/:id` — Eliminar cuenta
- **Auth:** Sí.
- **Respuesta 200:** `data: null`.

**Modelo `Account` devuelto:**
`id, userId, name, financialInstitution, color, initialBalance, currentBalance, description,
isDeleted, deletedAt, createdAt, updatedAt`.

---

## 5. Incomes — `/incomes` (ingresos)

> Todas requieren autenticación.

### 5.1 `POST /incomes` — Registrar ingreso
- **Auth:** Sí.
- **Body:**
  | Campo | Tipo | Obligatorio | Reglas |
  |-------|------|-------------|--------|
  | `accountId` | string | Sí | UUID v4, cuenta del usuario |
  | `name` | string | Sí | máx. 80 |
  | `amount` | number | Sí | **> 0**, máx. 2 decimales |
  | `description` | string | No | máx. 255 |
  | `date` | string | No | ISO 8601 (default ahora) |

- **Respuesta 201:** `data` = ingreso. `404` si la cuenta no existe/no es del usuario.

### 5.2 `GET /incomes` — Listar ingresos (paginado)
- **Auth:** Sí.
- **Query:**
  | Campo | Tipo | Default | Descripción |
  |-------|------|---------|-------------|
  | `page` | int | 1 | página (≥1) |
  | `limit` | int | 10 | por página (1–100) |
  | `accountId` | UUID | — | filtrar por cuenta |
  | `from` | ISO8601 | — | fecha desde |
  | `to` | ISO8601 | — | fecha hasta |

- **Respuesta 200:** `data` = `{ items: Income[], total, page, limit, totalPages }`
  (ordenado por `date` DESC, `createdAt` DESC).

### 5.3 `GET /incomes/:id` — Detalle
- **Auth:** Sí. **Respuesta 200:** `data` = ingreso. `404` si no existe/no es del usuario.

### 5.4 `PATCH /incomes/:id` — Actualizar
- **Auth:** Sí. **Body:** subconjunto de campos de creación.
- **Regla:** si `sourceType !== MANUAL`, solo se permiten `name` y `description`.
- **Errores:** `400` si intenta cambiar monto/cuenta de un ingreso automático.

### 5.5 `DELETE /incomes/:id` — Eliminar
- **Auth:** Sí.
- **Regla:** solo ingresos `MANUAL`. `400` en ingresos automáticos (deben revertirse en su
  módulo de origen: cobro/préstamo).

**Modelo `Income`:** `id, userId, accountId, name, amount, description, date, sourceType,
sourceId, isDeleted, deletedAt, createdAt, updatedAt`.

---

## 6. Expenses — `/expenses` (egresos)

> Todas requieren autenticación. Soporta egresos **CORRIENTE** (descuentan de la cuenta)
> y **DIFERIDO** (se cargan a una tarjeta de crédito en cuotas).

### 6.1 `POST /expenses` — Registrar egreso
- **Auth:** Sí.
- **Body:**
  | Campo | Tipo | Obligatorio | Reglas |
  |-------|------|-------------|--------|
  | `accountId` | string | Sí | UUID v4 |
  | `name` | string | Sí | máx. 80 |
  | `amount` | number | Sí | **≥ 0**, máx. 2 decimales |
  | `description` | string | No | máx. 255 |
  | `date` | string | No | ISO 8601 |
  | `paymentMethod` | enum | No | `CORRIENTE` (default) o `DIFERIDO` |
  | `creditCardId` | string | Sí si DIFERIDO | UUID v4 |
  | `installments` | int | Sí si DIFERIDO | ≥ 1 |
  | `graceMonths` | int | No | ≥ 0, default 0 (solo DIFERIDO) |

- **Regla:** en `CORRIENTE` no se permite enviar `creditCardId`, `installments` ni `graceMonths`.
- **Respuesta 201:** `data` = egreso (incluye `installmentPlan` si es diferido).
- **Errores:** `400` validación; `404` cuenta/tarjeta no encontrada.

### 6.2 `GET /expenses` — Listar egresos (paginado)
- **Auth:** Sí.
- **Query:** `page`, `limit` (igual que ingresos) + opcionales:
  `accountId`, `creditCardId`, `paymentMethod` (`CORRIENTE|DIFERIDO`),
  `amountPending` (`true|false`), `from`, `to` (ISO8601).
- **Respuesta 200:** `data` = `{ items, total, page, limit, totalPages }`.

### 6.3 `GET /expenses/:id` — Detalle
- **Auth:** Sí. **Respuesta 200:** `data` = egreso. Si es DIFERIDO incluye
  `installmentPlan` (arreglo de cuotas).

### 6.4 `PATCH /expenses/:id/amount` — Fijar monto de egreso variable
- **Auth:** Sí.
- **Para qué sirve:** definir el monto de un egreso recurrente variable (`amountPending = true`).
- **Body:** `{ "amount": number (≥0, 2 decimales) }`.
- **Respuesta 200:** `data` = egreso actualizado (`amountPending` pasa a `false`).
- **Errores:** `400` si el egreso no tenía monto pendiente.

### 6.5 `PATCH /expenses/:id` — Actualizar egreso
- **Auth:** Sí. **Body:** subconjunto de campos (incluye `creditCardId`, `installments`,
  `graceMonths` solo para diferidos).
- **Reglas:**
  - No se puede cambiar `paymentMethod`.
  - Con cuotas ya pagadas no se puede tocar monto/tarjeta/cuotas/gracia.
  - Si cambia monto/cuotas/gracia y ninguna cuota está pagada, se regenera el plan.
- **Errores:** `400` egreso inmutable.

### 6.6 `DELETE /expenses/:id` — Eliminar egreso
- **Auth:** Sí.
- **Reglas:** no se permite borrar egresos de origen automático (excepto `RECURRING`) ni con
  cuotas pagadas. `400` en caso contrario.

**Modelo `Expense`:** `id, userId, accountId, name, amount, description, date, paymentMethod,
creditCardId, installments, graceMonths, amountPending, recurringConfigId, occurrenceDate,
sourceType, sourceId, installmentPlan?, isDeleted, deletedAt, createdAt, updatedAt`.

**`ExpenseInstallment` (cuota):** `id, expenseId, creditCardId, number, amount, period
(YYYY-MM), isPaid, cardPaymentId`.

---

## 7. Credit Cards — `/credit-cards`

> Todas requieren autenticación.

### 7.1 `POST /credit-cards` — Crear tarjeta
- **Auth:** Sí.
- **Body:**
  | Campo | Tipo | Obligatorio | Reglas |
  |-------|------|-------------|--------|
  | `name` | string | Sí | máx. 60 |
  | `color` | string | Sí | hex `#RRGGBB` |
  | `issuer` | string | Sí | máx. 80 (entidad emisora) |
  | `lastFourDigits` | string | Sí | exactamente 4 dígitos |
  | `creditLimit` | number | No | > 0, 2 decimales |
  | `cutoffDay` | int | No | 1–31 (día de corte) |
  | `paymentDay` | int | No | 1–31 (día límite de pago) |
  | `reminderEnabled` | boolean | No | default `false` |
  | `reminderDaysBefore` | int | No | 0–30, default 1 |
  | `reminderHour` | int | No | 0–23, default 9 |

- **Regla:** si `reminderEnabled = true` es obligatorio `paymentDay`.
- **Respuesta 201:** `data` = tarjeta.

### 7.2 `GET /credit-cards` — Listar tarjetas
- **Auth:** Sí. **Respuesta 200:** `data` = arreglo de tarjetas (createdAt DESC).

### 7.3 `GET /credit-cards/:id` — Detalle
- **Auth:** Sí. **Respuesta 200:** `data` = tarjeta. `404` si no es del usuario.

### 7.4 `PATCH /credit-cards/:id` — Actualizar tarjeta
- **Auth:** Sí. **Body:** subconjunto de campos de creación. Reprograma/cancela el
  recordatorio según los cambios.
- **Respuesta 200:** `data` = tarjeta.

### 7.5 `DELETE /credit-cards/:id` — Eliminar tarjeta
- **Auth:** Sí. **Respuesta 200:** `data: null`.

### 7.6 `GET /credit-cards/:id/report` — Reporte mensual
- **Auth:** Sí.
- **Query:** `period` (obligatorio, `YYYY-MM`).
- **Respuesta 200:** `data` =
  ```json
  {
    "period": "2026-10",
    "total": 300,
    "paid": false,
    "paidAt": null,
    "cutoffDate": "2026-10-20",
    "paymentDate": "2026-11-05",
    "items": [
      { "name": "Laptop", "installmentNumber": 1, "installmentsTotal": 3, "amount": 300 }
    ]
  }
  ```
- **Errores:** `400` periodo con formato inválido.

### 7.7 `GET /credit-cards/:id/report/range` — Reporte en rango
- **Auth:** Sí.
- **Query:** `from` y `to` (`YYYY-MM`), obligatorios. Máximo 24 meses.
- **Respuesta 200:** `data` =
  ```json
  { "months": [ { "period": "2026-10", "total": 300, "paid": false } ], "grandTotal": 1060 }
  ```
- **Errores:** `400` rango inválido o excede 24 meses.

### 7.8 `GET /credit-cards/:id/debt` — Deuda actual y cupo
- **Auth:** Sí.
- **Respuesta 200:** `data` =
  ```json
  {
    "currentDebt": 300,
    "upcoming": 760,
    "totalPending": 1060,
    "creditLimit": 2000,
    "availableCredit": 940
  }
  ```
  (`currentDebt` = cuotas impagas con periodo ≤ actual; `upcoming` = futuras).

### 7.9 `POST /credit-cards/:id/pay` — Pagar un periodo
- **Auth:** Sí.
- **Para qué sirve:** marca un periodo como pagado y genera un **egreso CORRIENTE**
  (origen `CARD_PAYMENT`) desde la cuenta indicada.
- **Body:**
  | Campo | Tipo | Obligatorio | Reglas |
  |-------|------|-------------|--------|
  | `accountId` | string | Sí | UUID v4, cuenta de origen |
  | `period` | string | No | `YYYY-MM` (default: mes actual) |

- **Respuesta 201:** `data` = `CreditCardPayment`:
  `{ id, userId, creditCardId, accountId, expenseId, period, amount, paidAt, createdAt, updatedAt }`.
- **Errores:** `400` periodo futuro o sin deuda; `409` periodo ya pagado; `404` tarjeta/cuenta.

**Modelo `CreditCard`:** `id, userId, name, color, issuer, lastFourDigits, creditLimit,
cutoffDay, paymentDay, reminderEnabled, reminderDaysBefore, reminderHour, isDeleted,
deletedAt, createdAt, updatedAt`.

---

## 8. Recurring Expenses — `/recurring-expenses`

> Egresos que se generan automáticamente (semanal/mensual/anual). Todas requieren autenticación.

### 8.1 `POST /recurring-expenses` — Crear configuración
- **Auth:** Sí.
- **Body:**
  | Campo | Tipo | Obligatorio | Reglas |
  |-------|------|-------------|--------|
  | `accountId` | string | Sí | UUID v4 |
  | `name` | string | Sí | máx. 80 |
  | `amount` | number | Sí si no variable | ≥ 0, 2 decimales |
  | `isVariableAmount` | boolean | No | default `false`; si `true`, NO enviar `amount` |
  | `description` | string | No | máx. 255 |
  | `frequency` | enum | Sí | `WEEKLY` \| `MONTHLY` \| `YEARLY` |
  | `dayOfWeek` | int | Sí si WEEKLY | 1 (lunes) – 7 (domingo) |
  | `dayOfMonth` | int | Sí si MONTHLY | 1–31 |
  | `monthOfYear` | int | Sí si YEARLY | 1–12 |
  | `startDate` | string | Sí | `YYYY-MM-DD` |
  | `endDate` | string | No | `YYYY-MM-DD` |
  | `reminderEnabled` | boolean | No | default `false` |
  | `reminderOffset` | enum | Sí si reminder | `SAME_DAY` \| `ONE_DAY_BEFORE` |
  | `reminderHour` | int | Sí si reminder | 0–23 |

- **Respuesta 201:** `data` = configuración (incluye `nextRunAt`, `lastGeneratedAt`).
- **Errores:** `400` combinaciones inválidas (frecuencia/campos, monto, recordatorio, rango de fechas).

### 8.2 `GET /recurring-expenses` — Listar
- **Auth:** Sí. **Respuesta 200:** `data` = arreglo de configuraciones (createdAt DESC).

### 8.3 `GET /recurring-expenses/:id` — Detalle
- **Auth:** Sí. **Respuesta 200:** `data` = configuración.

### 8.4 `PATCH /recurring-expenses/:id/active` — Activar/desactivar
- **Auth:** Sí.
- **Body:** `{ "isActive": boolean }`.
- **Efecto:** al reactivar recalcula `nextRunAt` desde hoy (sin generar atrasados); al
  desactivar cancela recordatorios.
- **Respuesta 200:** `data` = configuración.

### 8.5 `PATCH /recurring-expenses/:id` — Actualizar
- **Auth:** Sí. **Body:** subconjunto de campos de creación. No afecta egresos ya generados.
- **Respuesta 200:** `data` = configuración.

### 8.6 `DELETE /recurring-expenses/:id` — Eliminar
- **Auth:** Sí. **Respuesta 200:** `data: null`. Conserva los egresos ya generados.

**Modelo `RecurringExpenseConfig`:** `id, userId, accountId, name, amount, isVariableAmount,
description, frequency, dayOfWeek, dayOfMonth, monthOfYear, startDate, endDate, isActive,
nextRunAt, lastGeneratedAt, reminderEnabled, reminderOffset, reminderHour, isDeleted,
deletedAt, createdAt, updatedAt`.

> Los egresos generados por recurrencia aparecen en `/expenses` con `sourceType = RECURRING`
> y `amountPending = true` cuando el monto es variable.

---

## 9. Collections — `/collections` (dinero que te deben / cobros)

> Plan de cuotas de algo que **cobras**. Cada cuota pagada crea un **ingreso**.
> Todas requieren autenticación.

### 9.1 `POST /collections` — Registrar cobro
- **Auth:** Sí.
- **Body:**
  | Campo | Tipo | Obligatorio | Reglas |
  |-------|------|-------------|--------|
  | `personName` | string | Sí | máx. 80 |
  | `totalAmount` | number | Sí | > 0, 2 decimales |
  | `installmentsCount` | int | Sí | ≥ 1 |
  | `description` | string | No | máx. 255 |
  | `reminderEnabled` | boolean | No | default `false` |
  | `reminderFrequency` | enum | Sí si >1 cuota con recordatorio | `WEEKLY`/`MONTHLY`/`YEARLY` |
  | `reminderDayOfWeek` | int | Sí si WEEKLY | 1–7 |
  | `reminderDayOfMonth` | int | Sí si MONTHLY | 1–31 |
  | `reminderMonth` | int | Sí si YEARLY | 1–12 |
  | `reminderAt` | string | Sí si 1 cuota con recordatorio | ISO8601, hora exacta (min/seg = 0) |
  | `reminderHour` | int | Sí si >1 cuota con recordatorio | 0–23 |

- **Reglas de recordatorio:**
  - Cuota única ⇒ usar `reminderAt` (no los campos de recurrencia).
  - Varias cuotas ⇒ usar recurrencia (`reminderFrequency` + campos) + `reminderHour`.
- **Respuesta 201:** `data` = cobro + `installments: []`.

### 9.2 `GET /collections` — Listar
- **Auth:** Sí.
- **Query:** `status?` = `PENDING` | `PARTIAL` | `PAID`.
- **Respuesta 200:** `data` = arreglo de cobros, cada uno con `paidAmount` y `pendingAmount`.

### 9.3 `GET /collections/:id` — Detalle con cuotas
- **Auth:** Sí. **Respuesta 200:** `data` = cobro + `installments`.

### 9.4 `PATCH /collections/:id` — Actualizar
- **Auth:** Sí. **Body:** subconjunto de campos.
- **Reglas:** con cuotas pagadas solo `personName`, `description` y recordatorio; sin cuotas
  pagadas se puede cambiar monto/cuotas (regenera el plan).
- **Respuesta 200:** `data` = cobro + `installments`.

### 9.5 `DELETE /collections/:id` — Eliminar
- **Auth:** Sí. **Respuesta 200:** `data: null`. Conserva ingresos generados.

### 9.6 `POST /collections/:id/installments/:installmentId/pay` — Pagar cuota
- **Auth:** Sí.
- **Para qué sirve:** marca la cuota pagada y crea el **ingreso** (`COLLECTION_INSTALLMENT`)
  en la cuenta indicada.
- **Body:**
  | Campo | Tipo | Obligatorio | Reglas |
  |-------|------|-------------|--------|
  | `accountId` | string | Sí | UUID v4, cuenta destino |
  | `name` | string | No | máx. 80 (default generado) |
  | `description` | string | No | máx. 255 |

- **Respuesta 200:** `data` =
  ```json
  {
    "installment": { "number": 1, "amount": 33.33, "isPaid": true, "paidAt": "...", "incomeId": "uuid" },
    "collectionStatus": "PARTIAL"
  }
  ```
- **Errores:** `400` cuota ya pagada; `404` cobro/cuota/cuenta no encontrada.

**Modelo `Collection`:** `id, userId, personName, totalAmount, installmentsCount, description,
reminderEnabled, reminderFrequency, reminderDayOfWeek, reminderDayOfMonth, reminderMonth,
reminderAt, reminderHour, status, paidAmount?, pendingAmount?, installments?, isDeleted,
deletedAt, createdAt, updatedAt`.

**`CollectionInstallment`:** `id, number, amount, dueDate, isPaid, paidAt, incomeId`.

---

## 10. Loans — `/loans` (dinero que prestas)

> Igual que cobros, pero **al crear se genera un egreso CORRIENTE** por el monto total
> (`sourceType = LOAN_CREATION`). Cada cuota pagada crea un **ingreso**.
> Todas requieren autenticación.

### 10.1 `POST /loans` — Registrar préstamo
- **Auth:** Sí.
- **Body:**
  | Campo | Tipo | Obligatorio | Reglas |
  |-------|------|-------------|--------|
  | `accountId` | string | Sí | UUID v4 (sale el dinero) |
  | `personName` | string | Sí | máx. 80 |
  | `totalAmount` | number | Sí | > 0, 2 decimales |
  | `installmentsCount` | int | Sí | ≥ 1 |
  | `description` | string | No | máx. 255 |
  | `reminderEnabled` | boolean | No | default `false` |
  | `reminderFrequency` | enum | Sí si >1 cuota con recordatorio | |
  | `reminderDayOfWeek` | int | Sí si WEEKLY | 1–7 |
  | `reminderDayOfMonth` | int | Sí si MONTHLY | 1–31 |
  | `reminderMonth` | int | Sí si YEARLY | 1–12 |
  | `reminderAt` | string | Sí si 1 cuota con recordatorio | hora exacta |
  | `reminderHour` | int | Sí si >1 cuota con recordatorio | 0–23 |

- **Respuesta 201:** `data` = préstamo + `installments` (incluye `expenseId` del egreso creado).
- **Errores:** `404` cuenta no encontrada.

### 10.2 `GET /loans` — Listar
- **Auth:** Sí. **Query:** `status?`.
- **Respuesta 200:** `data` = arreglo con `paidAmount` y `pendingAmount`.

### 10.3 `GET /loans/:id` — Detalle con cuotas
- **Auth:** Sí. **Respuesta 200:** `data` = préstamo + `installments`.

### 10.4 `PATCH /loans/:id` — Actualizar
- **Auth:** Sí.
- **Reglas:** `accountId` y `totalAmount` **inmutables** (ya existe el egreso). Con cuotas
  pagadas solo `personName`, `description` y recordatorio. Sin cuotas pagadas se puede
  cambiar `installmentsCount` (regenera el plan).
- **Errores:** `400` al intentar cambiar cuenta/monto/cuotas fijas.
- **Respuesta 200:** `data` = préstamo + `installments`.

### 10.5 `DELETE /loans/:id` — Eliminar
- **Auth:** Sí. **Respuesta 200:** `data: null`. Conserva el egreso de creación y los ingresos.

### 10.6 `POST /loans/:id/installments/:installmentId/pay` — Pagar cuota
- **Auth:** Sí.
- **Para qué sirve:** marca la cuota pagada y crea el **ingreso** (`LOAN_INSTALLMENT`).
- **Body:** `{ accountId (UUID, obligatorio), name?, description? }`.
- **Respuesta 200:** `data` = `{ installment: { number, amount, isPaid, paidAt, incomeId }, loanStatus }`.

**Modelo `Loan`:** `id, userId, accountId, expenseId, personName, totalAmount,
installmentsCount, description, reminderEnabled, reminderFrequency, reminderDayOfWeek,
reminderDayOfMonth, reminderMonth, reminderAt, reminderHour, status, paidAmount?,
pendingAmount?, installments?, isDeleted, deletedAt, createdAt, updatedAt`.

**`LoanInstallment`:** `id, number, amount, dueDate, isPaid, paidAt, incomeId`.

---

## 11. Debts — `/debts` (dinero que debes)

> Similar a cobros, pero **al crear NO genera ningún movimiento**. Cada cuota pagada crea un
> **egreso CORRIENTE** (`sourceType = DEBT_PAYMENT`). No tiene `description` ni `accountId`.
> Todas requieren autenticación.

### 11.1 `POST /debts` — Registrar deuda
- **Auth:** Sí.
- **Body:**
  | Campo | Tipo | Obligatorio | Reglas |
  |-------|------|-------------|--------|
  | `personName` | string | Sí | máx. 80 (a quién le debes) |
  | `totalAmount` | number | Sí | > 0, 2 decimales |
  | `installmentsCount` | int | Sí | ≥ 1 |
  | `reminderEnabled` | boolean | No | default `false` |
  | `reminderFrequency` | enum | Sí si >1 cuota con recordatorio | |
  | `reminderDayOfWeek` | int | Sí si WEEKLY | 1–7 |
  | `reminderDayOfMonth` | int | Sí si MONTHLY | 1–31 |
  | `reminderMonth` | int | Sí si YEARLY | 1–12 |
  | `reminderAt` | string | Sí si 1 cuota con recordatorio | hora exacta |
  | `reminderHour` | int | Sí si >1 cuota con recordatorio | 0–23 |

- **Respuesta 201:** `data` = deuda + `installments`.

### 11.2 `GET /debts` — Listar
- **Auth:** Sí. **Query:** `status?`.
- **Respuesta 200:** `data` = arreglo con `paidAmount` y `pendingAmount`.

### 11.3 `GET /debts/:id` — Detalle con cuotas
- **Auth:** Sí. **Respuesta 200:** `data` = deuda + `installments`.

### 11.4 `PATCH /debts/:id` — Actualizar
- **Auth:** Sí.
- **Reglas:** con cuotas pagadas solo `personName` y recordatorio; sin cuotas pagadas se
  puede cambiar monto/cuotas (regenera el plan).
- **Respuesta 200:** `data` = deuda + `installments`.

### 11.5 `DELETE /debts/:id` — Eliminar
- **Auth:** Sí. **Respuesta 200:** `data: null`. Conserva egresos generados.

### 11.6 `POST /debts/:id/installments/:installmentId/pay` — Pagar cuota
- **Auth:** Sí.
- **Para qué sirve:** marca la cuota pagada y crea el **egreso** (`DEBT_PAYMENT`).
- **Body:** `{ accountId (UUID, obligatorio), name?, description? }`.
- **Respuesta 200:** `data` =
  ```json
  {
    "installment": { "number": 1, "amount": 30, "isPaid": true, "paidAt": "...", "expenseId": "uuid" },
    "debtStatus": "PARTIAL"
  }
  ```

**Modelo `Debt`:** `id, userId, personName, totalAmount, installmentsCount, reminderEnabled,
reminderFrequency, reminderDayOfWeek, reminderDayOfMonth, reminderMonth, reminderAt,
reminderHour, status, paidAmount?, pendingAmount?, installments?, isDeleted, deletedAt,
createdAt, updatedAt`.

**`DebtInstallment`:** `id, number, amount, dueDate, isPaid, paidAt, expenseId`.

---

## 12. Shopping Lists — `/shopping-lists`

> Listas de compras con ítems. **No tienen recordatorios.** Una lista `CLOSED` es inmutable.
> Al cerrar se genera un **egreso CORRIENTE** (`sourceType = SHOPPING_LIST`) y lo no comprado
> pasa a una nueva lista `OPEN`. Todas requieren autenticación.

### 12.1 `POST /shopping-lists` — Crear lista
- **Auth:** Sí.
- **Body:**
  | Campo | Tipo | Obligatorio | Reglas |
  |-------|------|-------------|--------|
  | `name` | string | Sí | máx. 80 |
  | `items` | array | No | de `{ name (máx. 120) }` |

- **Respuesta 201:** `data` = lista (`status = OPEN`) + `items`.

### 12.2 `GET /shopping-lists` — Listar
- **Auth:** Sí. **Query:** `status?` = `OPEN` | `CLOSED`.
- **Respuesta 200:** `data` = arreglo de listas, cada una con sus `items` activos.

### 12.3 `GET /shopping-lists/:id` — Detalle
- **Auth:** Sí. **Respuesta 200:** `data` = lista + `items`.

### 12.4 `PATCH /shopping-lists/:id` — Renombrar
- **Auth:** Sí. **Body:** `{ "name"?: string (máx. 80) }`.
- **Regla:** solo listas `OPEN` (`400` si está cerrada).
- **Respuesta 200:** `data` = lista + `items`.

### 12.5 `DELETE /shopping-lists/:id` — Eliminar
- **Auth:** Sí. **Respuesta 200:** `data: null` (borra lista y sus ítems lógicamente).

### 12.6 `POST /shopping-lists/:id/items` — Agregar ítem
- **Auth:** Sí. **Body:** `{ "name": string (máx. 120) }`. Solo lista `OPEN`.
- **Respuesta 201:** `data` = ítem.

### 12.7 `PATCH /shopping-lists/:id/items/:itemId` — Editar ítem
- **Auth:** Sí. **Body:** `{ "name"?: string, "price"?: number (> 0, 2 decimales) }`.
- **Respuesta 200:** `data` = ítem.

### 12.8 `PATCH /shopping-lists/:id/items/:itemId/check` — Marcar comprado
- **Auth:** Sí. **Body:** `{ "isPurchased": boolean }`.
- **Respuesta 200:** `data` = ítem.

### 12.9 `DELETE /shopping-lists/:id/items/:itemId` — Eliminar ítem
- **Auth:** Sí. Solo lista `OPEN`. **Respuesta 200:** `data: null`.

### 12.10 `POST /shopping-lists/:id/close` — Cerrar lista
- **Auth:** Sí.
- **Para qué sirve:** valida el cierre, crea el egreso y traslada lo no comprado.
- **Body:**
  | Campo | Tipo | Obligatorio | Reglas |
  |-------|------|-------------|--------|
  | `accountId` | string | Sí | UUID v4 (cuenta del egreso) |
  | `purchasedItems` | array | Sí | ≥ 1 de `{ id (UUID), price? (number > 0) }` |
  | `notPurchasedItems` | array | No | de `{ id (UUID) }` |
  | `total` | number | No | > 0, 2 decimales (alternativa a precios) |

- **Reglas (XOR precio/total):**
  - Cada ítem comprado lleva `price` **o** se envía un `total`, nunca ambos.
  - Si se envían precios, **todos** los comprados deben traer precio.
  - `purchasedItems` + `notPurchasedItems` deben cubrir **todos** los ítems activos, sin repetidos.
- **Respuesta 200:** `data` =
  ```json
  {
    "closedList": { "...": "lista CLOSED", "items": [ ] },
    "newList": { "...": "nueva lista OPEN con lo no comprado", "items": [ ] }
  }
  ```
  (`newList` es `null` si no había ítems no comprados).
- **Errores:** `400` validación del cierre; `404` lista/cuenta no encontrada.

**Modelo `ShoppingList`:** `id, userId, name, status, closedAt, total, accountId, expenseId,
items?, isDeleted, deletedAt, createdAt, updatedAt`.

**`ShoppingListItem`:** `id, userId, listId, name, isPurchased, price, isDeleted, deletedAt,
createdAt, updatedAt`.

---

## 13. Notifications — `/notifications`

> Todas requieren autenticación. La app recibe push (FCM) cuando un recordatorio vence.

### 13.1 `POST /notifications/devices` — Registrar dispositivo
- **Auth:** Sí.
- **Body:**
  | Campo | Tipo | Obligatorio | Reglas |
  |-------|------|-------------|--------|
  | `token` | string | Sí | token FCM |
  | `platform` | enum | No | `ANDROID` (default) |

- **Respuesta 201:** `data` = dispositivo registrado (`id, userId, token, platform, isActive,
  lastUsedAt, ...`). Si el token ya existía, se reasigna al usuario actual.

### 13.2 `DELETE /notifications/devices/:token` — Desactivar dispositivo
- **Auth:** Sí. **Parámetro:** `token` (string en la ruta).
- **Respuesta 200:** `data: null` (`isActive = false`). `404` si no pertenece al usuario.

### 13.3 `GET /notifications/reminders` — Próximos recordatorios
- **Auth:** Sí.
- **Para qué sirve:** listar recordatorios pendientes futuros del usuario (agenda).
- **Respuesta 200:** `data` = arreglo de `Reminder`:
  `id, userId, type, sourceId, title, body, scheduledAt, status, attempts, sentAt, lastError,
  isDeleted, createdAt, updatedAt`.

> Internamente los recordatorios se programan por: pago de tarjeta, egreso recurrente, y una
> fila por cuota en cobros/préstamos/deudas (`sourceId` = id de la cuota).

---

## 14. Health — `/health`

### 14.1 `GET /health` — Estado del servicio
- **Auth:** No (público).
- **Nota:** NO usa el prefijo `/api/v1` (queda en `/health`).
- **Respuesta 200:** `data` =
  ```json
  { "status": "ok", "uptime": 12345.67, "timestamp": "2026-10-15T12:00:00.000Z" }
  ```

---

## 15. Resumen de endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/health` | No | Estado del servicio |
| POST | `/api/v1/auth/register` | No | Registro + tokens |
| POST | `/api/v1/auth/login` | No | Login + tokens |
| POST | `/api/v1/auth/refresh` | No | Renovar tokens |
| POST | `/api/v1/auth/logout` | Sí | Cerrar sesión |
| POST | `/api/v1/auth/logout-all` | Sí | Cerrar todas las sesiones |
| GET | `/api/v1/users/me` | Sí | Perfil |
| PATCH | `/api/v1/users/me` | Sí | Actualizar perfil |
| PATCH | `/api/v1/users/me/password` | Sí | Cambiar contraseña |
| POST | `/api/v1/accounts` | Sí | Crear cuenta |
| GET | `/api/v1/accounts` | Sí | Listar cuentas |
| GET | `/api/v1/accounts/:id` | Sí | Detalle cuenta |
| PATCH | `/api/v1/accounts/:id` | Sí | Actualizar cuenta |
| DELETE | `/api/v1/accounts/:id` | Sí | Eliminar cuenta |
| POST | `/api/v1/incomes` | Sí | Crear ingreso |
| GET | `/api/v1/incomes` | Sí | Listar ingresos (paginado) |
| GET | `/api/v1/incomes/:id` | Sí | Detalle ingreso |
| PATCH | `/api/v1/incomes/:id` | Sí | Actualizar ingreso |
| DELETE | `/api/v1/incomes/:id` | Sí | Eliminar ingreso |
| POST | `/api/v1/expenses` | Sí | Crear egreso |
| GET | `/api/v1/expenses` | Sí | Listar egresos (paginado) |
| GET | `/api/v1/expenses/:id` | Sí | Detalle egreso |
| PATCH | `/api/v1/expenses/:id/amount` | Sí | Fijar monto variable |
| PATCH | `/api/v1/expenses/:id` | Sí | Actualizar egreso |
| DELETE | `/api/v1/expenses/:id` | Sí | Eliminar egreso |
| POST | `/api/v1/credit-cards` | Sí | Crear tarjeta |
| GET | `/api/v1/credit-cards` | Sí | Listar tarjetas |
| GET | `/api/v1/credit-cards/:id` | Sí | Detalle tarjeta |
| PATCH | `/api/v1/credit-cards/:id` | Sí | Actualizar tarjeta |
| DELETE | `/api/v1/credit-cards/:id` | Sí | Eliminar tarjeta |
| GET | `/api/v1/credit-cards/:id/report` | Sí | Reporte mensual |
| GET | `/api/v1/credit-cards/:id/report/range` | Sí | Reporte por rango |
| GET | `/api/v1/credit-cards/:id/debt` | Sí | Deuda y cupo |
| POST | `/api/v1/credit-cards/:id/pay` | Sí | Pagar periodo |
| POST | `/api/v1/recurring-expenses` | Sí | Crear recurrencia |
| GET | `/api/v1/recurring-expenses` | Sí | Listar recurrencias |
| GET | `/api/v1/recurring-expenses/:id` | Sí | Detalle recurrencia |
| PATCH | `/api/v1/recurring-expenses/:id/active` | Sí | Activar/desactivar |
| PATCH | `/api/v1/recurring-expenses/:id` | Sí | Actualizar recurrencia |
| DELETE | `/api/v1/recurring-expenses/:id` | Sí | Eliminar recurrencia |
| POST | `/api/v1/collections` | Sí | Crear cobro |
| GET | `/api/v1/collections` | Sí | Listar cobros |
| GET | `/api/v1/collections/:id` | Sí | Detalle cobro |
| PATCH | `/api/v1/collections/:id` | Sí | Actualizar cobro |
| DELETE | `/api/v1/collections/:id` | Sí | Eliminar cobro |
| POST | `/api/v1/collections/:id/installments/:installmentId/pay` | Sí | Pagar cuota de cobro |
| POST | `/api/v1/loans` | Sí | Crear préstamo |
| GET | `/api/v1/loans` | Sí | Listar préstamos |
| GET | `/api/v1/loans/:id` | Sí | Detalle préstamo |
| PATCH | `/api/v1/loans/:id` | Sí | Actualizar préstamo |
| DELETE | `/api/v1/loans/:id` | Sí | Eliminar préstamo |
| POST | `/api/v1/loans/:id/installments/:installmentId/pay` | Sí | Pagar cuota de préstamo |
| POST | `/api/v1/debts` | Sí | Crear deuda |
| GET | `/api/v1/debts` | Sí | Listar deudas |
| GET | `/api/v1/debts/:id` | Sí | Detalle deuda |
| PATCH | `/api/v1/debts/:id` | Sí | Actualizar deuda |
| DELETE | `/api/v1/debts/:id` | Sí | Eliminar deuda |
| POST | `/api/v1/debts/:id/installments/:installmentId/pay` | Sí | Pagar cuota de deuda |
| POST | `/api/v1/shopping-lists` | Sí | Crear lista |
| GET | `/api/v1/shopping-lists` | Sí | Listar listas |
| GET | `/api/v1/shopping-lists/:id` | Sí | Detalle lista |
| PATCH | `/api/v1/shopping-lists/:id` | Sí | Renombrar lista |
| DELETE | `/api/v1/shopping-lists/:id` | Sí | Eliminar lista |
| POST | `/api/v1/shopping-lists/:id/items` | Sí | Agregar ítem |
| PATCH | `/api/v1/shopping-lists/:id/items/:itemId` | Sí | Editar ítem |
| PATCH | `/api/v1/shopping-lists/:id/items/:itemId/check` | Sí | Marcar comprado |
| DELETE | `/api/v1/shopping-lists/:id/items/:itemId` | Sí | Eliminar ítem |
| POST | `/api/v1/shopping-lists/:id/close` | Sí | Cerrar lista |
| POST | `/api/v1/notifications/devices` | Sí | Registrar dispositivo |
| DELETE | `/api/v1/notifications/devices/:token` | Sí | Desactivar dispositivo |
| GET | `/api/v1/notifications/reminders` | Sí | Próximos recordatorios |

---

## 16. Notas para el frontend

1. **Siempre leer `data`.** El `message` es para mostrar al usuario; `errors` para depuración
   o mensajes de validación.
2. **No enviar campos extra** en body/query: `forbidNonWhitelisted` devuelve 400.
3. **Paginación:** usar los `items` de `data` y los metadatos `total/page/limit/totalPages`.
4. **Manejo de token:** guardar `accessToken` + `refreshToken`; al recibir 401, intentar
   `POST /auth/refresh` y reintentar; si falla, forzar re-login. `expiresIn` está en segundos.
5. **Idempotencia de pagos:** pagar una cuota ya pagada devuelve 400; pagar un periodo de
   tarjeta ya pagado devuelve 409.
6. **Impacto en saldos:** los egresos `DIFERIDO` NO afectan el saldo de la cuenta hasta que
   se paga el periodo de la tarjeta (`POST /credit-cards/:id/pay`).
7. **Fechas de corte/pago de tarjeta** vienen como `YYYY-MM-DD`; `scheduledAt`/`dueDate` como
   ISO UTC.
8. **Cierre de lista de compras:** el frontend debe enviar el estado de TODOS los ítems y
   respetar la regla XOR (`price` por ítem o `total`, nunca ambos).
9. **Recurrencias variables:** los egresos con `amountPending = true` requieren
   `PATCH /expenses/:id/amount` para fijar su monto.
10. **404 en lugar de 403:** si un recurso no pertenece al usuario, tratar como "no existe".
