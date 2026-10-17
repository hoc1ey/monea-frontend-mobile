### F15 — Gestión, Más, perfil y ajustes

**Objetivo:** pantalla Gestión como hub de cobros, préstamos, deudas y listas; Más con Cuentas, Tarjetas y ajustes; perfil y ajustes de cuenta.

**Rama:** `feature/15-management-profile-settings` · **Depende de:** F11, F12, F13, F14

**Pantalla Gestión** (`(tabs)/manage`)
- `LargeHeader` "Gestión" con subtítulo "Lo que te deben, lo que debes y tus compras".
- `HeroSm`: etiqueta "Por cobrar", cifra = suma de `pendingAmount` de cobros; pie "Por pagar" = suma de `pendingAmount` de préstamos + deudas (en `hero-row`).
- SectionHeader "Cobros y préstamos" y Group:
  - "Cobros" (icono `down`, subtítulo "{n} activos · por cobrar {monto}") → `obligations/cobros`.
  - "Préstamos" (icono `bank`, subtítulo "{n} activos · por pagar {monto}") → `obligations/prestamos`.
  - "Deudas" (icono `up`, subtítulo "{n} activas · pendiente {monto}") → `obligations/deudas`.
- SectionHeader "Compras" y Group:
  - "Listas de compras" (icono `cart`, subtítulo "{abiertas} abiertas · {cerradas} cerradas") → `shopping/open`.

**Pantalla Más** (`(tabs)/more`)
- `LargeHeader` "Más" con subtítulo "Cuentas y ajustes".
- SectionHeader "Finanzas" y Group:
  - "Cuentas" (icono `wallet`, subtítulo "{n} cuentas · {saldo total}") → `accounts`.
  - "Tarjetas" (icono `card`, subtítulo "{n} tarjetas · deuda {monto}") → `accounts?tab=cards`.
- SectionHeader "Cuenta" y Group:
  - "Recordatorios" (icono `bell`, subtítulo "{n} hoy o próximos") → `reminders`.
  - "Perfil" (icono `user`, subtítulo "{nombre} · {zona horaria}") → `profile`.
  - "Ajustes" (icono `gear`, subtítulo "Apariencia, seguridad, dispositivos") → `settings`.

**Pantalla Perfil** (`profile`)
- `TopBar` "Perfil" con atrás.
- Bloque centrado: `Avatar` 96 con la inicial del nombre; nombre 22/700; correo 15 `muted`.
- Group: "Nombre", "Correo" (solo lectura), "Zona horaria" (select IANA), "Moneda" (solo lectura, "USD").
- Botón ghost "Editar perfil" → guarda `PATCH /users/me` con `{ name?, timezone? }`. Toast "Perfil guardado".
- Datos desde `GET /users/me`.

**Pantalla Ajustes** (`settings`)
- `TopBar` "Ajustes" con atrás.
- SectionHeader "Apariencia": Group con un **segmentado** "Sistema" | "Claro" | "Oscuro" (sin margen externo, padding 12 14). Cambia el tema en vivo y lo persiste.
- SectionHeader "Seguridad" y Group:
  - "Cambiar contraseña" (icono `key`) → `change-password`.
  - "Cerrar sesión" (icono `logout`) → `POST /auth/logout` con el refresh token; limpiar y ir a Login.
  - "Cerrar todas las sesiones" (icono `device`) → confirmación → `POST /auth/logout-all` → Login.
- SectionHeader "Notificaciones" y Group:
  - "Notificaciones push" (icono `bell`) con `Switch` que refleja el permiso del sistema. Si está denegado, al tocar abre `Linking.openSettings()`.
  - "Dispositivos" (icono `device`, valor "1 activo") — lee el estado de F04.
- SectionHeader "Desarrollo" y Group (**solo `__DEV__`**): "Vista previa de todas las pantallas" (icono `grid`) → `dev`.
- Pie `hint`: "MONEA · v0.x.x" con la versión de `app.config.ts`.

**Pantalla Cambiar contraseña** (`change-password`)
- `TopBar` con atrás y "Guardar" (tbtn).
- `LargeHeader` "Contraseña" con subtítulo "Al cambiarla se cerrarán tus sesiones activas."
- Group: "Actual", "Nueva" (8+, mayúscula, minúscula, número), "Confirmar" (igual a nueva).
- Botón primario "Actualizar contraseña" → `PATCH /users/me/password` `{ currentPassword, newPassword }`.
  - 200 → **el backend cierra todas las sesiones**: limpiar tokens, toast "Contraseña actualizada. Vuelve a iniciar sesión.", ir a Login.
  - 401 → "La contraseña actual no es correcta".

**Endpoints**
| Método | Ruta | Uso |
|---|---|---|
| GET | `/users/me` | perfil |
| PATCH | `/users/me` | `{ name?, timezone? }` |
| PATCH | `/users/me/password` | `{ currentPassword, newPassword }` |
| POST | `/auth/logout` | `{ refreshToken }` |
| POST | `/auth/logout-all` | — |
| GET | `/accounts`, `/credit-cards`, `/collections`, `/loans`, `/debts`, `/shopping-lists` | contadores y totales de Gestión y Más |

**Commits**
```
feat(manage): hub de gestion con totales de cobros y pagos
feat(more): menu de finanzas, cuenta y ajustes
feat(profile): perfil con edicion de nombre y zona horaria
feat(settings): tema sistema, claro y oscuro persistente
feat(settings): cambio de contrasena y cierre de sesiones
feat(settings): estado de notificaciones y acceso a ajustes del sistema
```

**Criterios de aceptación**
- [ ] Cambiar el tema en Ajustes actualiza todas las pantallas sin reiniciar.
- [ ] Cambiar la contraseña cierra la sesión y pide volver a entrar.
- [ ] Los totales de Gestión coinciden con la suma de las listas.
- [ ] La vista previa no aparece en builds de producción.

---
