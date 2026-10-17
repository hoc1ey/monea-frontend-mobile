### F04 — Notificaciones y permisos (Firebase)

**Objetivo:** pedir permiso de notificaciones en el momento adecuado, registrar el token FCM en el backend, recibir recordatorios y abrir la pantalla correcta al tocarlos.

**Rama:** `feature/04-notifications` · **Depende de:** F03

**Requisito previo — development build**
1. Crear proyecto en Firebase, registrar la app Android con el mismo `package` de `app.config.ts`.
2. Descargar `google-services.json` y agregarlo a la raíz del proyecto. **No commitear el archivo**: agregarlo a `.gitignore`; el equipo lo recibe por canal privado o EAS secret.
3. En `app.config.ts`: `android.googleServicesFile: "./google-services.json"` y el plugin `expo-notifications` con `icon` y `color` (`#EF13A1`).
4. Build de desarrollo: `pnpm exec eas build --profile development --platform android` e instalar el APK en el celular. A partir de aquí se usa la app de desarrollo, no Expo Go, para probar push.

**Canal de Android**
- Crear al iniciar: id `recordatorios`, nombre "Recordatorios", importancia **alta**, color `#EF13A1`, sonido por defecto.

**Flujo de permiso (contextual)**
1. **Cuándo se pide:** justo después de registrarse o iniciar sesión por primera vez en el dispositivo, mostrando primero una pantalla de contexto (no el diálogo del sistema).
2. **Pantalla de contexto** (`(auth)/notifications-onboarding`):
   - Icono `bell` 84 × 84 en círculo `accent-soft`.
   - Título "Activa tus recordatorios" 30/700. Texto 15 `muted`: "Te avisamos antes de pagos de tarjeta, cuotas y egresos recurrentes."
   - Botón primario "Activar notificaciones" → diálogo del sistema.
   - Botón ghost "Ahora no" → guardar bandera `notifPromptDismissed` y entrar a Inicio.
3. **Diálogo del sistema:** `expo-notifications` `requestPermissionsAsync()`. En Android 13+ es el permiso `POST_NOTIFICATIONS`; en versiones anteriores se concede por defecto.
4. **Si el usuario deniega:** no volver a pedir de inmediato. Mostrar el aviso en Ajustes (F15) y, al crear la primera tarjeta con recordatorio, un `Banner` "Activa las notificaciones para recibir avisos de pago" → botón que llama a `Linking.openSettings()`.
5. **Si `canAskAgain = false`:** solo `Linking.openSettings()`.

**Registro del dispositivo**
- Tras conceder permiso: `Notifications.getDevicePushTokenAsync()` → en Android devuelve el token FCM.
- `POST /notifications/devices` con `{ token, platform: "ANDROID" }`.
- Escuchar `addPushTokenListener` para re-registrar si FCM rota el token.
- Al cerrar sesión: `DELETE /notifications/devices/:token` (mejor esfuerzo; si falla, continuar el cierre de sesión).

**Recepción y navegación**
- `setNotificationHandler`: mostrar banner y reproducir sonido en primer plano.
- Al tocar la notificación: leer `data.type` y `data.sourceId` y navegar:

| `type` | Destino |
|---|---|
| `CREDIT_CARD_PAYMENT` | `cards/[id]` (con `period` actual) |
| `RECURRING_EXPENSE` | `recurring/[id]` |
| `COLLECTION` | `obligations/cobros/[id]` |
| `LOAN` | `obligations/prestamos/[id]` |
| `DEBT` | `obligations/deudas/[id]` |

> **Nota para backend:** para `COLLECTION`, `LOAN` y `DEBT`, `sourceId` es el id de la **cuota**. Para abrir el detalle del cobro hace falta el id del padre. Sugerencia: incluir `parentId` en el `data` del push.

**Pantalla Recordatorios** (`reminders`)
- `TopBar` "Recordatorios" con atrás.
- `LargeHeader` "Próximos" con subtítulo "Notificaciones programadas".
- Secciones (SectionHeader): **Hoy**, **Esta semana**, **Más adelante**, agrupando `GET /notifications/reminders` por `scheduledAt` en la zona del usuario.
- Cada fila (Row con icono): icono según `type` (`card` para tarjeta, `repeat` para recurrente, `down` para cobro, `bank` para préstamo, `up` para deuda). Título: el `title` del recordatorio. Subtítulo: `"<tipo> · <hora>"`. Valor derecho: monto si aplica.
- Si `scheduledAt` es hoy y el tipo es tarjeta: `Tag acc` "3 días" (días restantes).
- Vacío: `EmptyState` icono `bell`, "Sin recordatorios", "Aquí verás tus próximos avisos."

**Endpoints**
| Método | Ruta | Uso |
|---|---|---|
| POST | `/notifications/devices` | registrar token (body `{ token, platform? }`) |
| DELETE | `/notifications/devices/:token` | desactivar al cerrar sesión |
| GET | `/notifications/reminders` | pantalla Recordatorios y sección de Inicio |

**Dependencias:** `expo-notifications`, `expo-device`, `expo-dev-client` (sección 2.3).

**Commits**
```
chore(push): configurar google-services y plugin de expo-notifications
feat(push): canal de recordatorios y manejador de notificaciones en primer plano
feat(push): pantalla de contexto y solicitud de permiso de notificaciones
feat(push): registro de token fcm y desactivacion al cerrar sesion
feat(push): navegacion desde notificacion segun el tipo de recordatorio
feat(reminders): pantalla de recordatorios agrupada por fecha
```

**Criterios de aceptación**
- [ ] En Android 13+ aparece el diálogo del sistema solo después de la pantalla de contexto.
- [ ] Denegar el permiso no bloquea la app y muestra el aviso en Ajustes.
- [ ] El token aparece en `device_tokens` del backend tras conceder el permiso.
- [ ] Un recordatorio vencido llega como notificación y al tocarla abre la pantalla correcta.
- [ ] Al cerrar sesión, el dispositivo queda inactivo en el backend.
- [ ] `google-services.json` no está en el repositorio.

---
