# Correos y verificación de cuenta

Este documento describe los endpoints, respuestas y el flujo que debe seguir el
frontend para el registro con verificación por correo, el reenvío de códigos y
la recuperación de contraseña.

Todos los endpoints usan el prefijo global `api/v1` y el contrato estándar de
respuestas:

```json
{
  "success": true,
  "statusCode": 200,
  "data": {},
  "message": "Mensaje",
  "errors": null
}
```

Los errores conservan el mismo contrato con `success: false`, `data: null` y
`errors` como arreglo de mensajes.

---

## 1. Resumen de cambios importantes

- `POST /auth/register` **ya no devuelve JWT**. Solo devuelve el correo
  registrado y el resultado del registro.
- Después del registro se envía un correo con un código numérico de **6
  dígitos**.
- El código se guarda en Redis con una vigencia de **15 minutos** por defecto
  (`EMAIL_VERIFICATION_CODE_TTL_MINUTES`). Al verificarlo correctamente se
  elimina de Redis.
- El login ahora incluye dos campos nuevos dentro de `user`:
  - `emailVerified`: indica si el correo fue verificado.
  - `mustChangePassword`: si es `true`, el frontend debe redirigir al usuario a
    la pantalla de cambio de contraseña.
- La recuperación de contraseña envía una **contraseña temporal de 8
  caracteres** (mayúscula, minúscula y número) y activa
  `mustChangePassword = true` para el siguiente login.
- El login **no bloquea** cuentas con `emailVerified: false`. Si el producto
  quiere exigir la verificación, el frontend puede usar ese campo para mostrar
  un aviso o restringir acciones, pero el backend actualmente permite iniciar
  sesión.
- Si el envío del correo falla durante el registro, el usuario igualmente queda
  creado y la respuesta sigue siendo `registered: true`. En ese caso el
  frontend debe ofrecer el reenvío del código.

---

## 2. Configuración necesaria

### Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `MAIL_HOST` | Sí | Host SMTP (ej. `smtp.gmail.com`) |
| `MAIL_PORT` | Sí | Puerto SMTP (ej. `587` o `465`) |
| `MAIL_SECURE` | Sí | `true` para TLS directo (puerto 465), `false` para STARTTLS (587) |
| `MAIL_USER` | Sí | Usuario SMTP |
| `MAIL_PASSWORD` | Sí | Contraseña o app password SMTP |
| `MAIL_FROM` | Sí | Correo remitente |
| `MAIL_FROM_NAME` | No | Nombre visible del remitente (default `Monea`) |
| `EMAIL_VERIFICATION_CODE_TTL_MINUTES` | No | Vigencia del código en minutos (default `15`) |

La aplicación valida el entorno con Zod al arrancar: si falta una variable
obligatoria, **no inicia**.

### Logo de los correos

Coloca el logo en `src/mail/assets/` con uno de estos nombres:

- `logo.png` (recomendado)
- `logo.jpg`
- `logo.jpeg`
- `logo.webp`
- `logo.gif`

El correo lo adjunta como imagen embebida. Si no existe ningún logo, la
plantilla muestra el nombre "Monea" como respaldo.

### Plantillas

- `src/mail/templates/verification-code.hbs`
- `src/mail/templates/temporary-password.hbs`

Ambas usan la paleta cerise y se copian a `dist/mail/templates/` durante el
build.

---

## 3. Flujo de registro y verificación

### 3.1 Registro

**Endpoint:** `POST /api/v1/auth/register` (`público`)

```json
{
  "email": "juan.perez@example.com",
  "password": "ClaveSegura123",
  "name": "Juan Pérez",
  "timezone": "America/Bogota"
}
```

`timezone` es opcional. La contraseña debe tener mínimo 8 caracteres, una
mayúscula, una minúscula y un número.

**Respuesta exitosa `201`:**

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

En este punto:

- El usuario ya existe en la base de datos.
- Se envió (o se intentó enviar) el correo con el código de 6 dígitos.
- **No hay `accessToken` ni `refreshToken`**. El frontend **no debe** intentar
  autenticarse todavía con esta respuesta.

**Errores esperados:**

| Caso | Status | Mensaje |
|---|---|---|
| Correo ya registrado | `409` | `El correo ya está registrado` |
| Datos inválidos | `400` | Mensajes por campo en `errors` |
| Demasiadas solicitudes | `429` | Bloqueo temporal por rate limit |

**Qué debe hacer el frontend:**

1. Guardar el email localmente (o en el estado del formulario).
2. Redirigir a la pantalla de ingreso del código de verificación.
3. Mostrar un mensaje del tipo: "Te enviamos un código de 6 dígitos a
   `juan.perez@example.com`".
4. Ofrecer el botón "Reenviar código" usando el endpoint de reenvío.

### 3.2 Verificación del correo

**Endpoint:** `POST /api/v1/auth/verify` (`público`)

```json
{
  "email": "juan.perez@example.com",
  "code": "123456"
}
```

- `code` debe tener exactamente 6 dígitos.
- Si el código es correcto, el usuario queda con `emailVerified: true` y el
  código se elimina de Redis.

**Respuesta exitosa `200`:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "verified": true
  },
  "message": "Correo verificado correctamente",
  "errors": null
}
```

**Errores esperados:**

| Caso | Status | Mensaje |
|---|---|---|
| Código incorrecto, expirado o correo inexistente | `400` | `Código inválido o expirado` |
| Código con formato inválido | `400` | `El código debe tener exactamente 6 dígitos` |
| Demasiadas solicitudes | `429` | Bloqueo temporal por rate limit |

**Qué debe hacer el frontend:**

1. Enviar email y código.
2. Si responde `200`, mostrar éxito y redirigir al login.
3. Si responde `400`, permitir corregir el código y ofrecer reenvío.
4. Si responde `429`, mostrar el tiempo de espera indicado por el backend.

### 3.3 Reenvío del código

**Endpoint:** `POST /api/v1/auth/resend-verification` (`público`)

```json
{
  "email": "juan.perez@example.com"
}
```

**Respuesta `200`** (siempre es genérica para no revelar si el correo existe):

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

Comportamiento interno:

- Si el usuario existe y no está verificado, se genera un código nuevo y se
  envía por correo. El código anterior queda reemplazado.
- Si el usuario no existe o ya está verificado, no se envía correo, pero la
  respuesta es la misma.

**Qué debe hacer el frontend:**

- Mostrar el mensaje genérico de la respuesta.
- Permitir reintentar el reenvío, preferiblemente con un cooldown local (por
  ejemplo, 60 segundos), ya que el endpoint también está sujeto al rate limit
  público (`429`).

### 3.4 Login después de verificar

Una vez verificado el correo, el frontend debe iniciar sesión normalmente:

**Endpoint:** `POST /api/v1/auth/login` (`público`)

```json
{
  "email": "juan.perez@example.com",
  "password": "ClaveSegura123"
}
```

**Respuesta `200`:**

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

El frontend debe guardar los tokens y revisar `user.mustChangePassword` antes de
continuar al home.

---

## 4. Flujo de recuperación de contraseña

### 4.1 Solicitud de recuperación

**Endpoint:** `POST /api/v1/auth/forgot-password` (`público`)

```json
{
  "email": "juan.perez@example.com"
}
```

**Respuesta `200` cuando el correo existe:**

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

**Respuesta `200` cuando el correo NO existe:** es idéntica a la anterior. El
backend no revela si el correo está registrado.

**Respuesta `200` si algo falla al generar o enviar el correo:**

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

En este último caso, si el correo existía, la contraseña anterior se restaura
para no dejar la cuenta con una contraseña que el usuario nunca recibió.

**Qué debe hacer el frontend:**

1. Mostrar siempre el mensaje genérico de la respuesta cuando `sent: true`.
2. Si `sent: false`, mostrar el mensaje de error y permitir reintentar.
3. No mostrar mensajes del tipo "correo no encontrado"; eso rompe la protección
   contra enumeración de usuarios.

### 4.2 Correo con contraseña temporal

El correo contiene una contraseña temporal de **8 caracteres** con al menos una
mayúscula, una minúscula y un número.

Cuando el usuario inicie sesión con esa contraseña temporal:

**Respuesta de login relevante:**

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

**Qué debe hacer el frontend:**

1. Guardar los tokens (el usuario ya está autenticado).
2. Si `user.mustChangePassword === true`, redirigir inmediatamente a la pantalla
   de cambio de contraseña.
3. No permitir navegar al home hasta que el usuario cambie la contraseña.

### 4.3 Cambio de contraseña obligatorio

**Endpoint:** `PATCH /api/v1/users/me/password` (`requiere Bearer token`)

```json
{
  "currentPassword": "A1b2C3d4",
  "newPassword": "NuevaClaveSegura456"
}
```

- `currentPassword` debe ser la contraseña temporal recibida por correo.
- `newPassword` debe cumplir la misma política: mínimo 8 caracteres, una
  mayúscula, una minúscula y un número.

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

Al cambiar la contraseña:

- Se limpia `mustChangePassword` (`false`).
- Se revocan todas las sesiones activas (access y refresh tokens).

**Qué debe hacer el frontend:**

1. Enviar el cambio con el access token actual.
2. Si responde `200`, limpiar los tokens almacenados.
3. Redirigir al login para que el usuario entre con su nueva contraseña.
4. Si responde `401` con `Contraseña actual incorrecta`, mostrar el error y
   permitir reintentar.

---

## 5. Diagrama de flujos

### Registro

```text
[Front] POST /auth/register
           |
           v
[Back] crea usuario -> guarda código en Redis -> envía correo
           |
           v
[Front] recibe { email, registered: true } (sin JWT)
           |
           v
[Front] muestra pantalla de código
           |
           v
[Front] POST /auth/verify { email, code }
           |
           +--> 200: correo verificado
           |       |
           |       v
           |   [Front] POST /auth/login -> guarda tokens -> home
           |
           +--> 400: código inválido/expirado
                   |
                   v
               [Front] permite corregir o POST /auth/resend-verification
```

### Recuperación de contraseña

```text
[Front] POST /auth/forgot-password { email }
           |
           v
[Back] si existe: genera contraseña temporal, la guarda hasheada,
       activa mustChangePassword y envía correo
           |
           v
[Front] muestra mensaje genérico
           |
           v
[Usuario] recibe correo con contraseña temporal
           |
           v
[Front] POST /auth/login con la contraseña temporal
           |
           v
[Back] devuelve tokens con user.mustChangePassword = true
           |
           v
[Front] redirige a cambiar contraseña
           |
           v
[Front] PATCH /users/me/password { currentPassword: temporal, newPassword }
           |
           v
[Back] actualiza hash, mustChangePassword = false y revoca sesiones
           |
           v
[Front] limpia tokens -> redirige al login con la nueva contraseña
```

---

## 6. Tabla resumen de endpoints

| Método | Ruta | Auth | Body | Respuesta principal |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | No | `email`, `password`, `name`, `timezone?` | `{ email, registered }` |
| `POST` | `/api/v1/auth/verify` | No | `email`, `code` | `{ verified: true }` |
| `POST` | `/api/v1/auth/resend-verification` | No | `email` | `{ sent: true }` |
| `POST` | `/api/v1/auth/forgot-password` | No | `email` | `{ sent: boolean }` |
| `POST` | `/api/v1/auth/login` | No | `email`, `password` | Tokens + `user.mustChangePassword` |
| `PATCH` | `/api/v1/users/me/password` | Bearer | `currentPassword`, `newPassword` | `data: null` |

---

## 7. Detalles internos útiles para soporte

### Redis

- Clave: `auth:email-verification:<email>`
- Valor: código de 6 dígitos.
- TTL: `EMAIL_VERIFICATION_CODE_TTL_MINUTES * 60` segundos (900 por defecto).
- Se elimina al verificar correctamente.

### Base de datos

La tabla `users` tiene dos columnas nuevas:

- `emailVerified` (`boolean`, default `false`).
- `mustChangePassword` (`boolean`, default `false`).

Con `DB_SYNCHRONIZE=true`, TypeORM crea estas columnas automáticamente.

### Correos

| Situación | Asunto | Plantilla |
|---|---|---|
| Registro / reenvío | `Verifica tu correo electrónico - Monea` | `verification-code.hbs` |
| Olvidé mi contraseña | `Tu contraseña temporal de Monea` | `temporary-password.hbs` |

### Seguridad

- Los endpoints públicos están sujetos al rate limit estricto (`429`).
- `forgot-password` y `resend-verification` responden de forma genérica para no
  revelar si un correo existe.
- El código de verificación expira y se elimina de Redis tras usarse.
- La contraseña temporal se almacena únicamente como hash argon2id.
- Al cambiar la contraseña se revocan todas las sesiones activas.
