### F06 — Cuentas bancarias

**Objetivo:** registrar, consultar, editar y eliminar cuentas con su saldo calculado.

**Rama:** `feature/06-accounts` · **Depende de:** F02

**Pantallas**

**Cuentas** (`accounts`, apilada desde Más)
- `TopBar` "Cuentas" con atrás. Segmentado "Cuentas" | "Tarjetas" (el segundo lleva a `cards`, F07, con el mismo segmentado). Ver F07.
- Group con una fila por cuenta: icono tile con fondo `color` al 13 % (formato `#RRGGBB` + `22` en hex de 8 dígitos) e icono `wallet` del color de la cuenta; título nombre; subtítulo institución; valor = `currentBalance`; chevron.
- Botón ghost "Nueva cuenta" (margen superior 14) → `accounts/new`.
- Orden: `createdAt` DESC (como devuelve la API).
- Estados: vacío → `EmptyState` "Aún no tienes cuentas" + botón "Nueva cuenta".

**Detalle de cuenta** (`accounts/[id]`)
- `TopBar` con nombre de la cuenta, atrás y "Editar" a la derecha (tbtn) → `accounts/[id]/edit`.
- Margen superior 12 y `HeroSm` con gradiente de `color` a `hero-b`: etiqueta = institución, cifra = `currentBalance`.
- SectionHeader "Movimientos" y Group con los movimientos de esta cuenta (de `GET /incomes?accountId=` y `GET /expenses?accountId=`, combinados, ver F08). Vacío → fila "Sin movimientos" con subtítulo "Aún no hay registros en esta cuenta".
- Si tiene descripción: texto `hint` centrado debajo.
- **Eliminar cuenta:** botón `danger` al final: "Eliminar cuenta". Confirmación con `Alert` nativa: "Se eliminará la cuenta. Tus movimientos se conservan." → `DELETE /accounts/:id` → volver a la lista.

**Formulario de cuenta** (`accounts/new`, `accounts/[id]/edit`)
- `TopBar` "Nueva cuenta" / "Editar cuenta" con atrás y "Guardar" a la derecha (tbtn).
- `LargeHeader` "Nueva cuenta" / "Editar cuenta".
- Group de campos:
  - "Alias" (máx. 60) — placeholder "Ej. Ahorros".
  - "Entidad" (máx. 80) — placeholder "Ej. Banco".
  - "Balance inicial" (decimal, máx. 2 decimales) — placeholder "$0.00".
- SectionHeader "Color": Group con fila de 8 colores circulares de 30 dp, separación 12, padding 12 14. Paleta: `#fe36c1 · #ff9fe6 · #ac086b · #ef13a1 · #ff64d4 · #8f0c5b · #e0068c · #580034`. Seleccionado: anillo 2 `surface` + 4 `text`.
- SectionHeader "Descripción opcional": Group con `textarea` (min 90 de alto, padding 14, 16). Placeholder "Ej. Cuenta para gastos del mes".
- Botón primario "Guardar cuenta" (margen superior 16).

**Reglas**
- Validación: alias y entidad obligatorios; color obligatorio en formato hex; balance con máximo 2 decimales.
- Editar `initialBalance` cambia el saldo calculado. La API advierte en el `message` de respuesta: mostrar el mensaje en un toast.
- El botón eliminar no aparece si la cuenta tiene una tarjeta, recurrencia o préstamo activo: **no**, la API lo permite. Solo confirmar.

**Endpoints**
| Método | Ruta | Body (DTO) |
|---|---|---|
| POST | `/accounts` | `{ name, financialInstitution, color, initialBalance, description? }` |
| GET | `/accounts` | — |
| GET | `/accounts/:id` | — |
| PATCH | `/accounts/:id` | cualquier subconjunto de los campos de creación |
| DELETE | `/accounts/:id` | — |

**Dependencias:** ninguna nueva.

**Commits**
```
feat(accounts): listado de cuentas con saldo actual
feat(accounts): detalle de cuenta con hero y movimientos
feat(accounts): formulario de creacion y edicion con paleta de color
feat(accounts): eliminar cuenta con confirmacion
```

**Criterios de aceptación**
- [ ] Crear una cuenta con todos los campos la lista de inmediato.
- [ ] El saldo del detalle coincide con el de la lista.
- [ ] Un 404 al abrir una cuenta eliminada muestra "Cuenta no encontrada" y regresa.

---
