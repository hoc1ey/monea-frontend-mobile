
### F03 — Autenticación

**Objetivo:** registro, inicio de sesión, renovación de tokens, bloqueos y cierre de sesión, con almacenamiento seguro.

**Rama:** `feature/03-auth` · **Depende de:** F02

**Pantallas**

**Splash** (`(auth)/splash`)
- Fondo `bg`, centrado vertical. Logo 76 × 76 radio 24 con gradiente cerise-500→cerise-900 y la letra "M" blanca 36/800. Pulso de escala 1 ↔ 1.06 cada 1.6 s.
- Título "MONEA" 30/700 `text`, margen superior 18. Texto "Cargando tus finanzas…" 15 `muted`.
- Lógica: leer tokens de `expo-secure-store`. Si hay `refreshToken`, intentar refresh; si funciona → Inicio, si no → Login. Si no hay tokens → Login. Duración mínima 600 ms.

**Login** (`(auth)/login`)
- Bloque de marca: logo 76, título "MONEA" 30/700 (margen 18), subtítulo "Tus finanzas, en orden" 15 `muted` centrado, margen inferior 28.
- Grupo `auth-group` con 2 campos: "Correo" (teclado email, valor inicial `jose@test.com`) y "Contraseña" (seguro, valor inicial `Monea123*`).
- Botón primario "Iniciar sesión" con margen superior 16.
- Enlace "Crear cuenta" centrado (15/500, `accent-ink`) con margen superior 18.
- Texto de ayuda "Prototipo: el botón inicia sesión directamente." **Solo en desarrollo** (`__DEV__`). En producción se elimina.
- Validación con zod: correo válido, contraseña no vacía. Errores bajo el campo en 13 `negative`.
- Acción: `POST /auth/login`. Éxito → guardar tokens → Inicio (`replace`).

**Registro** (`(auth)/register`)
- `TopBar` "Crear cuenta" con atrás. Grupo `auth-group`: "Nombre" (mín. 2), "Correo", "Contraseña" (8+, mayúscula, minúscula, número), "Zona horaria" (select con las zonas `America/Guayaquil`, `America/Bogota`, `America/Mexico_City`, y la opción de detectar la del dispositivo).
- Nota 13 `muted`: "Mínimo 8 caracteres, con mayúscula, minúscula y número."
- Botón "Crear cuenta". Éxito → guardar tokens → **flujo de permisos de notificaciones (F04)** → Inicio.

**Bloqueo** (`(auth)/lock`)
- Icono de candado en círculo 84 × 84, fondo `accent-soft`, icono 38 `accent-ink`, margen inferior 18.
- Título 30/700. Texto 15 `muted` máx. 280 de ancho.
- Contador en 52/700 tabular, `accent-ink`, margen `14 0 4`. Se calcula con `retryAfterMinutes` de la respuesta.
- Texto de ayuda 13 `muted`. Botón "Entendido" (primario, ancho 100 %, margen superior 22) → Login.
- Dos variantes: **cuenta** (`423`: "Cuenta bloqueada" / "Demasiados intentos fallidos. Intenta de nuevo en" / "Tu cuenta se desbloquea automáticamente.") y **IP** (`429` en login: "Acceso bloqueado" / "Demasiados intentos desde tu conexión. Intenta de nuevo en" / "El bloqueo es por IP y no afecta a otras cuentas.").

**Endpoints**
| Método | Ruta | Body | Respuesta usada |
|---|---|---|---|
| POST | `/auth/register` | `{ email, password, name, timezone? }` | `data.accessToken`, `refreshToken`, `expiresIn`, `user` |
| POST | `/auth/login` | `{ email, password }` | igual; errores `401`, `423` (`retryAfterMinutes`), `429` (`retryAfterMinutes`) |
| POST | `/auth/refresh` | `{ refreshToken }` | nuevo par de tokens |
| POST | `/auth/logout` | `{ refreshToken }` (opcional) | `data: null` |
| POST | `/auth/logout-all` | — | `data: null` |

**Reglas**
- Tokens en `expo-secure-store` (claves `monea.access`, `monea.refresh`). Nunca en AsyncStorage.
- **Refresh con cola:** si varias peticiones reciben 401 a la vez, solo una ejecuta `/auth/refresh`; las demás esperan y reintentan con el nuevo token. Si el refresh falla → limpiar tokens, limpiar caché de React Query, ir a Login.
- Tras `PATCH /users/me/password` (F15) el backend cierra todas las sesiones: limpiar tokens e ir a Login.
- Errores de login: mensaje genérico "Credenciales inválidas" (no revelar si el correo existe).
- Renovar el access token antes de que expire (`expiresIn` − 60 s) de forma opcional con un timer.

**Dependencias:** `expo-secure-store`, `react-hook-form`, `@hookform/resolvers`, `zod` (F00).

**Commits**
```
feat(auth): almacenamiento seguro de tokens con expo-secure-store
feat(auth): pantalla de splash con restauracion de sesion
feat(auth): login con validacion y manejo de bloqueos 423 y 429
feat(auth): registro con zona horaria y validacion de contrasena
feat(auth): renovacion de tokens con cola de peticiones en vuelo
feat(auth): cierre de sesion y cierre de todas las sesiones
```

**Criterios de aceptación**
- [ ] Login con credenciales correctas entra a Inicio y guarda los tokens.
- [ ] Cerrar la app y reabrirla entra directo a Inicio.
- [ ] Un 401 renueva la sesión sin que el usuario lo note; si el refresh falla, va a Login.
- [ ] Con 5 intentos fallidos, la pantalla de bloqueo muestra el contador real.
- [ ] Ningún token aparece en logs ni en AsyncStorage.

---
