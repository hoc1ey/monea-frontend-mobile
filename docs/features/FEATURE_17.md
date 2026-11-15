# API — Transferencias (Contrato para el Frontend)

> Documento de contrato del módulo **F14 — Transferencias** (`src/transfers/`).
> Destinado a un agente de IA que implemente el frontend: describe cada endpoint,
> qué recibe, qué devuelve, sus errores y sus efectos secundarios.

---

## 1. Generalidades

| Aspecto | Valor |
|---|---|
| Base path | `/transfers` |
| Autenticación | **Obligatoria** en todos los endpoints: header `Authorization: Bearer <JWT>` |
| `userId` | **Nunca** se envía en el body ni query; el backend lo extrae del JWT. |
| Contenido | `application/json` (salvo query params en `GET /transfers`) |

### 1.1 Envoltura de respuesta (global)

Toda respuesta (éxito o error) usa el mismo sobre, generado por el interceptor/filtro global:

**Éxito** (`success: true`):

```json
{
  "success": true,
  "statusCode": 201,
  "data": { ... },
  "message": "Transferencia registrada correctamente",
  "errors": null
}
```

**Error** (`success: false`):

```json
{
  "success": false,
  "statusCode": 400,
  "data": null,
  "message": "La cuenta origen y la cuenta destino deben ser distintas",
  "errors": ["La cuenta origen y la cuenta destino deben ser distintas"]
}
```

Reglas para el frontend:
- Leer `success` primero. Si es `false`, mostrar `message` (resumen) y usar `errors` (array de strings) para detalle por campo cuando sea validación.
- En errores de validación, `message` suele ser `"Bad Request"`, `"Error de validación"` o similar y `errors` trae **un mensaje por cada campo inválido**.
- El frontend no debe asumir el texto de `message` para lógica; usar `statusCode`.

### 1.2 Modelo `Transfer`

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "userId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "sourceAccountId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "destinationAccountId": "d4e5f6a7-b8c9-0123-defa-234567890123",
  "amount": 500,
  "description": "Pago del alquiler",
  "date": "2026-11-13T12:00:00.000Z",
  "expenseId": "e5f6a7b8-c9d0-1234-efab-345678901234",
  "incomeId": "f6a7b8c9-d0e1-2345-fabc-456789012345",
  "isDeleted": false,
  "deletedAt": null,
  "createdAt": "2026-11-13T12:00:01.000Z",
  "updatedAt": "2026-11-13T12:00:01.000Z"
}
```

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID | Identificador de la transferencia |
| `userId` | UUID | Dueño (siempre el del JWT) |
| `sourceAccountId` | UUID | Cuenta **origen** (de donde sale el dinero) |
| `destinationAccountId` | UUID | Cuenta **destino** (a donde entra el dinero) |
| `amount` | number | Siempre positivo, hasta 2 decimales |
| `description` | string \| null | Motivo opcional (máx. 255) |
| `date` | ISO8601 (UTC, `timestamptz`) | Fecha de la transferencia |
| `expenseId` | UUID \| null | ID del **egreso** generado en la cuenta origen |
| `incomeId` | UUID \| null | ID del **ingreso** generado en la cuenta destino |
| `isDeleted` / `deletedAt` | boolean / fecha \| null | Borrado lógico; el frontend no las necesita salvo para depuración |
| `createdAt` / `updatedAt` | ISO8601 | Auditoría |

---

## 2. Endpoints

### 2.1 `POST /transfers` — Crear transferencia

Mueve dinero entre **dos cuentas propias distintas**. En una transacción:
1. Crea la `Transfer`.
2. Genera un **egreso** (`CORRIENTE`, `sourceType = TRANSFER`) en la cuenta origen con nombre `Transferencia a {nombre_cuenta_destino}`.
3. Genera un **ingreso** (`sourceType = TRANSFER`) en la cuenta destino con nombre `Transferencia desde {nombre_cuenta_origen}`.

**Request body** (todos los campos en JSON):

| Campo | Requerido | Tipo | Validación |
|---|---|---|---|
| `sourceAccountId` | Sí | UUID v4 | Debe ser una cuenta propia existente |
| `destinationAccountId` | Sí | UUID v4 | Debe ser una cuenta propia existente y **≠** `sourceAccountId` |
| `amount` | Sí | number | `> 0`, máximo 2 decimales |
| `description` | No | string | Máx. 255 caracteres (se recorta con `trim`) |
| `date` | No | string ISO8601 | Por defecto: fecha/hora actual |

Ejemplo:

```json
{
  "sourceAccountId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "destinationAccountId": "d4e5f6a7-b8c9-0123-defa-234567890123",
  "amount": 500,
  "description": "Pago del alquiler",
  "date": "2026-11-13T12:00:00.000Z"
}
```

**Response `201`** — `data` es la `Transfer` creada (ver 1.2):

```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "userId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "sourceAccountId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "destinationAccountId": "d4e5f6a7-b8c9-0123-defa-234567890123",
    "amount": 500,
    "description": "Pago del alquiler",
    "date": "2026-11-13T12:00:00.000Z",
    "expenseId": "e5f6a7b8-c9d0-1234-efab-345678901234",
    "incomeId": "f6a7b8c9-d0e1-2345-fabc-456789012345",
    "isDeleted": false,
    "deletedAt": null,
    "createdAt": "2026-11-13T12:00:01.000Z",
    "updatedAt": "2026-11-13T12:00:01.000Z"
  },
  "message": "Transferencia registrada correctamente",
  "errors": null
}
```

**Errores:**

| HTTP | Cuándo | Ejemplo de `errors` |
|---|---|---|
| 400 | Cuentas iguales | `["La cuenta origen y la cuenta destino deben ser distintas"]` |
| 400 | Validación de campos (UUID, monto ≤ 0, > 2 decimales, descripción > 255, fecha no ISO8601) | Un mensaje por campo |
| 401 | JWT ausente/inválido | `["No autorizado"]` (mensaje del guard) |
| 404 | Cuenta origen o destino no existe **o no es del usuario** | `["Cuenta no encontrada"]` |

> Nota: si la cuenta existe pero pertenece a otro usuario, la API responde **404** (nunca 403).

---

### 2.2 `GET /transfers` — Listar (paginado + filtros)

**Query params** (todos opcionales):

| Param | Tipo | Efecto |
|---|---|---|
| `page` | int ≥ 1 | Página (default `1`) |
| `limit` | int 1–100 | Por página (default `10`) |
| `accountId` | UUID v4 | Devuelve transferencias donde la cuenta sea **origen O destino** |
| `from` | ISO8601 | `date >= from` (inclusivo) |
| `to` | ISO8601 | `date <= to` (inclusivo) |

Ejemplo: `GET /transfers?accountId=c3d4e5f6...&from=2026-11-01T00:00:00.000Z&to=2026-11-30T23:59:59.999Z&page=1&limit=10`

Orden fijo: `date DESC`, luego `createdAt DESC`.

**Response `200`** — `data` es un objeto paginado:

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "items": [ /* Transfer[] — mismo shape que 1.2 */ ],
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  },
  "message": "Transferencias obtenidas correctamente",
  "errors": null
}
```

Para paginar: avanzar `page` hasta `page === totalPages`; `total` = número total de transferencias que cumplen los filtros (sin paginar).

**Errores:** 400 (query inválida: UUID, fechas no ISO8601, `page`/`limit` fuera de rango), 401.

---

### 2.3 `GET /transfers/:id` — Detalle

`id` debe ser UUID v4 (si no, **400**).

**Response `200`** — `data` es la `Transfer` (shape 1.2).

**Errores:** 400 (id no es UUID v4), 401, 404 (`"Transferencia no encontrada"` — no existe, está borrada lógicamente o pertenece a otro usuario).

---

### 2.4 `DELETE /transfers/:id` — Eliminar (lógico)

Borrado lógico de la transferencia **y** de su egreso e ingreso asociados (misma transacción), de modo que ambas cuentas recuperan el saldo. No hay borrado físico.

**Response `200`** — `data` es `null`:

```json
{
  "success": true,
  "statusCode": 200,
  "data": null,
  "message": "Transferencia eliminada correctamente",
  "errors": null
}
```

**Errores:** 400 (id no UUID v4), 401, 404. Eliminar dos veces la misma transferencia devuelve **404** en la segunda (ya está `isDeleted`).

> No existe endpoint de creación duplicada ni de edición: una transferencia **no es editable** después de creada. Para "corregir" una transferencia el flujo es eliminarla y crearla de nuevo.

---

## 3. Comportamiento y efectos secundarios (importante para el frontend)

1. **Movimientos generados automáticamente:** al crear una transferencia aparecen un egreso en `GET /expenses` y un ingreso en `GET /incomes` de las cuentas involucradas, con `sourceType = "TRANSFER"` y `sourceId = transfer.id`. El frontend de gastos/ingresos **no debe permitir editar ni eliminar** estos movimientos (el backend lo rechaza: solo los `MANUAL` se pueden modificar). Deben mostrarse como de solo lectura, idealmente enlazando a la transferencia vía `sourceId`.
2. **Nombres de movimientos:** egreso → `Transferencia a {cuenta destino}`; ingreso → `Transferencia desde {cuenta origen}`. La `description` de la transferencia se replica en ambos.
3. **Saldo de cuentas:** no hay endpoint especial; el balance de cada cuenta refleja el egreso/ingreso automáticamente. Al eliminar la transferencia, ambos movimientos se borran lógicamente y los saldos vuelven.
4. **Fechas:** se almacenan en UTC (`timestamptz`). El frontend debe convertir `date`, `createdAt`, etc. a la zona horaria local del usuario para mostrar.
5. **Moneda:** `Account` no tiene divisa; no hay validación de moneda entre cuentas. Si el frontend muestra monedas, es responsabilidad suya (asume misma moneda).
6. **Idempotencia:** no hay clave de idempotencia; cada `POST` crea una nueva transferencia. Deshabilitar el botón de envío tras el primer click.

---

## 4. Resumen rápido

| Método | Path | Body/Query | Éxito | Errores |
|---|---|---|---|---|
| `POST` | `/transfers` | Body: `sourceAccountId`, `destinationAccountId`, `amount`, `description?`, `date?` | `201` → `Transfer` | 400, 401, 404 |
| `GET` | `/transfers` | Query: `page?`, `limit?`, `accountId?`, `from?`, `to?` | `200` → `{ items, total, page, limit, totalPages }` | 400, 401 |
| `GET` | `/transfers/:id` | — | `200` → `Transfer` | 400, 401, 404 |
| `DELETE` | `/transfers/:id` | — | `200` → `null` | 400, 401, 404 |

Referencias internas: `src/transfers/transfers.controller.ts`, `src/transfers/transfers.service.ts`, `src/transfers/entities/transfer.entity.ts`, especificación de la feature en `docs/features/FEATURE_14.md`.
