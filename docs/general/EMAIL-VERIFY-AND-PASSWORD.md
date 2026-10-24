# Verificación de correo y cambio obligatorio de contraseña

Este documento describe el flujo vigente que debe implementar el frontend para:

- Registro de usuarios con verificación por correo.
- Verificación del correo con emisión de tokens.
- Login bloqueado cuando el correo no está verificado.
- Login con tokens y cambio obligatorio cuando el usuario debe actualizar su
  contraseña.
- Recuperación de contraseña con contraseña temporal.

Todos los endpoints usan el prefijo `api/v1` y el contrato estándar:

```json
{
  "success": true,
  "statusCode": 200,
  "data": {},
  "message": "Mensaje",
  "errors": null
}
```

> Importante: `success: true` significa que la petición se procesó correctamente,
> **no necesariamente que el usuario quedó autenticado**. El frontend debe revisar
> `data` para saber si recibió tokens, si debe verificar el correo o si debe
> cambiar la contraseña.

---

## 1. Resumen de cambios

| Situación | Comportamiento actual |
|---|---|
| Registro | Crea el usuario, envía código de 6 dígitos y **no devuelve tokens** |
| Verificación del correo | Valida el código y **devuelve los tokens de sesión** |
| Login con correo sin verificar | Responde `200` con `success: true` y `data: { email, emailVerified: false }`, sin tokens |
| Login con contraseña temporal | Responde `200` con tokens y `data.user.mustChangePassword: true` |
| Cambio de contraseña forzado | `PATCH /users/me/password` con Bearer y `deleteAllSessions: true` |
| Sesiones al cambiar contraseña | Con `deleteAllSessions: true` se invalidan todas las sesiones y se eliminan todos los tokens |
| Olvido de contraseña | Envía contraseña temporal, activa `mustChangePassword` e invalida sesiones anteriores |

---

## 2. Endpoints involucrados

| Método | Ruta | Auth | Uso |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | No | Registrar usuario y enviar código |
| `POST` | `/api/v1/auth/verify` | No | Verificar código y obtener tokens |
| `POST` | `/api/v1/auth/resend-verification` | No | Reenviar código |
| `POST` | `/api/v1/auth/login` | No | Iniciar sesión o recibir una acción requerida |
| `POST` | `/api/v1/auth/forgot-password` | No | Solicitar contraseña temporal |
| `PATCH` | `/api/v1/users/me/password` | Bearer | Cambiar contraseña; acepta `deleteAllSessions` |

---

## 3. Flujo de registro y verificación

### 3.1 Registro

**Endpoint:** `POST /api/v1/auth/register`

```json
{
  "email": "juan.perez@example.com",
  "password": "ClaveSegura123",
  "name": "Juan Pérez",
  "timezone": "America/Bogota"
}
```

**Respuesta `201`:**

```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "email": "juan.perez@example.com",
    "registered": true
  },
  "message": "Usuario registrado correctamente. Revisa tu correo para verificar la cuenta",
  "errors": null
}
```

No hay `accessToken` ni `refreshToken`. El frontend debe guardar el email y
redirigir a la pantalla de ingreso del código.

### 3.2 Verificación del correo

**Endpoint:** `POST /api/v1/auth/verify`

```json
{
  "email": "juan.perez@example.com",
  "code": "123456"
}
```

El código:

- Tiene exactamente 6 dígitos.
- Se guarda en Redis con la clave `auth:email-verification:<email>`.
- Vence en 15 minutos por defecto (`EMAIL_VERIFICATION_CODE_TTL_MINUTES`).
- Se elimina de Redis después de una verificación exitosa.

**Respuesta exitosa `200`:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "a1b2...",
    "expiresIn": 900,
    "tokenType": "Bearer",
    "user": {
      "id": "uuid",
      "email": "juan.perez@example.com",
      "name": "Juan Pérez",
      "timezone": "America/Bogota",
      "emailVerified": true,
      "mustChangePassword": false
    }
  },
  "message": "Correo verificado correctamente",
  "errors": null
}
```

**Qué debe hacer el frontend:**

1. Guardar `accessToken` y `refreshToken`.
2. Revisar `data.user.mustChangePassword`.
3. Si es `false`, entrar al home.
4. Si es `true`, redirigir al cambio de contraseña (ver sección 5).
5. Si el código es inválido o expiró (`400`), permitir corregirlo o reenviarlo.

**Errores:**

| Caso | Status | Mensaje |
|---|---|---|
| Código incorrecto, expirado o correo inexistente | `400` | `Código inválido o expirado` |
| Código con formato inválido | `400` | `El código debe tener exactamente 6 dígitos` |
| Demasiadas solicitudes | `429` | Rate limit |

### 3.3 Reenvío del código

**Endpoint:** `POST /api/v1/auth/resend-verification`

```json
{
  "email": "juan.perez@example.com"
}
```

**Respuesta `200`:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "sent": true
  },
  "message": "Si el correo está registrado y aún no ha sido verificado, recibirás un nuevo código de verificación",
  "errors": null
}
```

La respuesta es genérica para no revelar si el correo existe. El frontend debe
mostrar ese mensaje y ofrecer reintento con un cooldown local.

---

## 4. Login y bloqueos por estado de la cuenta

**Endpoint:** `POST /api/v1/auth/login`

```json
{
  "email": "juan.perez@example.com",
  "password": "ClaveSegura123"
}
```

El backend valida primero las credenciales. Si son correctas, puede devolver
tres respuestas diferentes con `200` y `success: true`.

### 4.1 Login exitoso

Cuando el correo está verificado y no hay cambio de contraseña pendiente:

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "a1b2...",
    "expiresIn": 900,
    "tokenType": "Bearer",
    "user": {
      "id": "uuid",
      "email": "juan.perez@example.com",
      "name": "Juan Pérez",
      "timezone": "America/Bogota",
      "emailVerified": true,
      "mustChangePassword": false
    }
  },
  "message": "Sesión iniciada correctamente",
  "errors": null
}
```

### 4.2 Correo sin verificar

Si las credenciales son correctas pero `emailVerified` es `false`:

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "email": "juan.perez@example.com",
    "emailVerified": false
  },
  "message": "Debes verificar tu correo electrónico para iniciar sesión",
  "errors": null
}
```

**No hay tokens.** El frontend debe:

1. Detectar `data.emailVerified === false`.
2. Mostrar u redirigir a la pantalla de verificación usando `data.email`.
3. Ofrecer `POST /auth/resend-verification`.
4. Al verificar correctamente, el endpoint `POST /auth/verify` ya devuelve los
   tokens y se puede entrar al home.

### 4.3 Contraseña temporal pendiente de cambio

Si las credenciales son correctas, el correo está verificado y
`mustChangePassword` es `true`, el backend **sí emite tokens**:

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "a1b2...",
    "expiresIn": 900,
    "tokenType": "Bearer",
    "user": {
      "id": "uuid",
      "email": "juan.perez@example.com",
      "name": "Juan Pérez",
      "timezone": "America/Bogota",
      "emailVerified": true,
      "mustChangePassword": true
    }
  },
  "message": "Sesión iniciada correctamente",
  "errors": null
}
```

**Sí hay tokens.** El frontend debe:

1. Guardar `accessToken` y `refreshToken`.
2. Detectar `data.user.mustChangePassword === true`.
3. Guardar el email y la contraseña temporal que el usuario acaba de escribir
   (solo en memoria, no en almacenamiento persistente).
4. Redirigir a la pantalla de cambio de contraseña.
5. Usar `PATCH /users/me/password` con el Bearer token y
   `deleteAllSessions: true` (sección 5).
6. Después del cambio exitoso, limpiar todos los tokens y volver al login para
   autenticarse con la nueva contraseña.

### 4.4 Errores de login

| Caso | Status | Respuesta |
|---|---|---|
| Credenciales inválidas | `401` | `errors: ["Credenciales inválidas"]` |
| Cuenta bloqueada | `423` | Mensaje con minutos restantes |
| IP bloqueada | `429` | Mensaje con minutos restantes |
| Datos inválidos | `400` | Errores por campo |

---

## 5. Cambio de contraseña

**Endpoint:** `PATCH /api/v1/users/me/password` (`requiere Bearer token`)

Se usa tanto para el cambio obligatorio después del login con contraseña
temporal como para un cambio voluntario desde el perfil.

```json
{
  "currentPassword": "A1b2C3d4",
  "newPassword": "NuevaClaveSegura456",
  "deleteAllSessions": true
}
```

- `currentPassword`: contraseña actual o temporal recibida por correo.
- `newPassword`: mínimo 8 caracteres, una mayúscula, una minúscula y un número.
- `deleteAllSessions`: si es `true`, cierra todas las sesiones e invalida todos
  los access y refresh tokens del usuario.

> **Regla obligatoria para el frontend:** en el cambio de contraseña
> **SIEMPRE se debe enviar `deleteAllSessions: true`**. Si se omite, el backend
> también lo interpreta como `true`, pero el contrato exige enviarlo
> explícitamente.

**Respuesta `200`:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": null,
  "message": "Contraseña actualizada correctamente",
  "errors": null
}
```

Al finalizar:

- Se actualiza el hash argon2id.
- `mustChangePassword` queda en `false`.
- Con `deleteAllSessions: true`, se invalidan todas las sesiones activas del
  usuario.
- Se eliminan todos los access tokens y refresh tokens activos.

**Errores:**

| Caso | Status | Mensaje |
|---|---|---|
| Contraseña actual o temporal incorrecta | `401` | `Contraseña actual incorrecta` |
| Sin Bearer token o token inválido | `401` | No autorizado |
| Nueva contraseña inválida | `400` | Errores por campo |
| `deleteAllSessions` no booleano | `400` | `deleteAllSessions debe ser un valor booleano` |
| Rate limit | `429` | Rate limit |

**Qué debe hacer el frontend:**

1. Enviar el cambio con el Bearer token y `deleteAllSessions: true`.
2. Si responde `200`, limpiar todos los tokens guardados.
3. Redirigir al login para entrar con la nueva contraseña.

---

## 6. Flujo de olvido de contraseña

### 6.1 Solicitud

**Endpoint:** `POST /api/v1/auth/forgot-password`

```json
{
  "email": "juan.perez@example.com"
}
```

**Respuesta `200` si el correo existe:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "sent": true
  },
  "message": "Si el correo juan.perez@example.com existe, recibirás un correo con tu nueva contraseña temporal",
  "errors": null
}
```

**Respuesta `200` si el correo NO existe:** idéntica a la anterior. No se revela
la existencia de la cuenta.

**Respuesta `200` si falla el envío:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "sent": false
  },
  "message": "No se pudo procesar la solicitud. Intenta de nuevo más tarde",
  "errors": null
}
```

En este caso el backend restaura la contraseña anterior y no invalida las
sesiones.

Cuando el correo se envía correctamente:

- Se genera una contraseña temporal de 8 caracteres.
- Se guarda únicamente su hash argon2id.
- Se activa `mustChangePassword = true`.
- Se invalidan todas las sesiones anteriores del usuario.

### 6.2 Login con la contraseña temporal

El usuario inicia sesión con la contraseña temporal recibida. Como
`mustChangePassword` está activo, el login responde con tokens y el flag en
`user`:

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "a1b2...",
    "expiresIn": 900,
    "tokenType": "Bearer",
    "user": {
      "id": "uuid",
      "email": "juan.perez@example.com",
      "name": "Juan Pérez",
      "timezone": "America/Bogota",
      "emailVerified": true,
      "mustChangePassword": true
    }
  },
  "message": "Sesión iniciada correctamente",
  "errors": null
}
```

Luego el frontend usa `PATCH /users/me/password` con `deleteAllSessions: true`
(sección 5), limpia los tokens y redirige al login con la nueva contraseña.

---

## 7. Caso especial: correo sin verificar y contraseña temporal pendiente

Si un usuario no verificado solicita recuperación de contraseña, al hacer login
el backend prioriza la verificación del correo y responde:

```json
{
  "success": true,
  "data": {
    "email": "juan.perez@example.com",
    "emailVerified": false
  },
  "message": "Debes verificar tu correo electrónico para iniciar sesión"
}
```

Después de verificar:

- `POST /auth/verify` devuelve los tokens.
- `data.user.mustChangePassword` puede venir en `true`.
- Con esos tokens, el frontend debe usar `PATCH /users/me/password` con
  `deleteAllSessions: true`. Al terminar se invalidan todas las sesiones.

Orden recomendado:

1. Verificar el correo.
2. Si `user.mustChangePassword === true`, cambiar la contraseña con
   `deleteAllSessions: true`.
3. Limpiar tokens y volver al login.

---

## 8. Diagramas de flujo

### Registro y verificación

```text
[Front] POST /auth/register
           |
           v
[Back] crea usuario -> guarda código en Redis -> envía correo
           |
           v
[Front] recibe { email, registered: true } (sin tokens)
           |
           v
[Front] muestra pantalla de código
           |
           v
[Front] POST /auth/verify { email, code }
           |
           +--> 200 con accessToken + refreshToken
           |       |
           |       v
           |   [Front] guarda tokens
           |       |
           |       +--> user.mustChangePassword=false -> home
           |       |
           |       +--> user.mustChangePassword=true  -> cambiar contraseña
           |
           +--> 400 -> corregir código o reenviar
```

### Login con correo sin verificar

```text
[Front] POST /auth/login
           |
           v
[Back] valida credenciales
           |
           v
[Back] emailVerified=false -> 200 success=true
           |
           v
[Front] recibe { email, emailVerified: false } (sin tokens)
           |
           v
[Front] pantalla de verificación -> POST /auth/verify
           |
           v
[Front] recibe tokens -> home (o cambio de contraseña)
```

### Login con contraseña temporal

```text
[Front] POST /auth/login con contraseña temporal
           |
           v
[Back] valida credenciales
           |
           v
[Back] mustChangePassword=true -> 200 success=true + tokens
           |
           v
[Front] recibe tokens + user.mustChangePassword=true
           |
           v
[Front] guarda tokens -> pantalla de cambio de contraseña
           |
           v
[Front] PATCH /users/me/password  (Bearer)
       { currentPassword: temporal, newPassword, deleteAllSessions: true }
           |
           v
[Back] actualiza hash -> mustChangePassword=false -> invalida todas las sesiones
           |
           v
[Front] limpia tokens -> login con la nueva contraseña
```

---

## 9. Pseudocódigo para el frontend

```ts
async function login(email: string, password: string) {
  const response = await api.post('/auth/login', { email, password });

  if (!response.data.success) {
    return { state: 'ERROR', errors: response.data.errors };
  }

  const data = response.data.data;

  if (data.accessToken) {
    saveTokens(data.accessToken, data.refreshToken);

    if (data.user.mustChangePassword) {
      return { state: 'MUST_CHANGE_PASSWORD', email };
    }

    return { state: 'AUTHENTICATED', user: data.user };
  }

  if (data.emailVerified === false) {
    return { state: 'EMAIL_VERIFICATION_REQUIRED', email: data.email };
  }

  return { state: 'UNKNOWN_RESPONSE' };
}
```

```ts
async function verifyEmail(email: string, code: string) {
  const response = await api.post('/auth/verify', { email, code });
  const data = response.data.data;

  saveTokens(data.accessToken, data.refreshToken);

  if (data.user.mustChangePassword) {
    return { state: 'MUST_CHANGE_PASSWORD', email };
  }

  return { state: 'AUTHENTICATED', user: data.user };
}
```

```ts
async function changePassword(
  currentPassword: string,
  newPassword: string,
) {
  await api.patch('/users/me/password', {
    currentPassword,
    newPassword,
    deleteAllSessions: true,
  });

  clearTokens();
  return { state: 'PASSWORD_UPDATED' };
}
```

---

## 10. Detalles internos

### Redis

- Clave: `auth:email-verification:<email>`
- Valor: código de 6 dígitos.
- TTL: `EMAIL_VERIFICATION_CODE_TTL_MINUTES * 60` segundos (900 por defecto).
- Se elimina al verificar correctamente.

### Base de datos

La tabla `users` tiene las columnas:

- `emailVerified` (`boolean`, default `false`).
- `mustChangePassword` (`boolean`, default `false`).

### Sesiones

Con `deleteAllSessions: true` (valor obligatorio en el flujo de cambio) se
ejecuta `logoutAll`:

- Revoca todos los refresh tokens del usuario.
- Elimina de Redis todos los access tokens de sus sesiones activas.
- Elimina el set `auth:user-sessions:<userId>`.

Por eso, después de cambiar la contraseña el frontend **debe limpiar sus tokens
guardados** y volver al login. Si `deleteAllSessions` fuera `false`, la sesión
actual se mantendría; ese caso no debe usarse en el cambio obligatorio.
