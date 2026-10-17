# MONEA — Especificaciones del Frontend (React Native + Expo)

> **Fuentes de la verdad:**
> - **Endpoints, reglas y modelos:** `MONEA_API_DOCS.md` (backend).
> - **Diseño, layout, colores y textos:** `monea-prototipo-v2.html`. La app debe quedar **idéntica** al prototipo, salvo los ajustes listados en la sección 6.
>
> Cada feature se desarrolla en **su propia rama**, sale de `develop` y se integra con PR. Las features se implementan en el orden de la sección 3.

---

## 0. Resumen

| Aspecto | Decisión |
|---|---|
| Framework | React Native con **Expo** (SDK actual), TypeScript |
| Entorno de desarrollo | **Expo Go** para UI y lógica. Push (FCM) requiere **development build** (ver 1.9) |
| Gestor de paquetes | **pnpm** |
| Estilos | **NativeWind v4** (Tailwind para RN) + tokens de color en CSS variables |
| Navegación | **expo-router** (basada en archivos) |
| Estado servidor | **TanStack Query** |
| Estado local | **Zustand** (tema, sesión de UI) |
| Formularios | **react-hook-form** + **zod** |
| Plataforma objetivo | **Android** (el backend solo acepta `DevicePlatform = ANDROID`) |

---

## 1. Convenciones generales

### 1.1 Stack y versiones
- Instalar paquetes de Expo siempre con `pnpm exec expo install <paquete>` (elige la versión compatible con el SDK).
- Paquetes de terceros con `pnpm add <paquete>`.
- Node LTS. Commit del archivo `pnpm-lock.yaml`.
- TypeScript en modo `strict`. Sin `any` salvo en límites de librerías (justificar con comentario).

### 1.2 Estructura de carpetas
```
monea/
├── app/                      # expo-router (rutas = pantallas)
│   ├── _layout.tsx           # providers globales, tema, fuentes
│   ├── (auth)/               # login, register, lock, splash
│   ├── (tabs)/               # tab bar glass: index, movements, manage, more
│   ├── accounts/             # account/[id], account/new, account/[id]/edit
│   ├── cards/                # card/[id], card/new, card/[id]/edit
│   ├── movements/            # movement/[id], expense/new, income/new, deferred/[id], ...
│   ├── recurring/            # list, [id], define-amount
│   ├── obligations/          # [tab], [type]/[id], [type]/new
│   ├── shopping/             # [tab], [id], new
│   ├── reminders.tsx
│   ├── profile.tsx
│   ├── settings.tsx
│   ├── change-password.tsx
│   └── dev.tsx               # solo __DEV__
├── src/
│   ├── api/                  # cliente HTTP, endpoints tipados, tipos
│   ├── auth/                 # tokens, refresh, sesión
│   ├── components/ui/        # sistema de diseño (feature F01)
│   ├── components/domain/    # piezas de negocio (CreditCardVisual, ItemCard…)
│   ├── features/<dominio>/   # hooks de query/mutation y utilidades por dominio
│   ├── lib/                  # format (dinero, fechas), validation, notifications
│   ├── theme/                # tokens (colores, tipografía, radios, sombras)
│   └── stores/               # zustand
├── global.css
├── tailwind.config.js
├── metro.config.js
├── babel.config.js
└── app.config.ts
```

### 1.3 Tokens de diseño

**Colores (semánticos).** Se definen como CSS variables en `global.css` y se exponen en `tailwind.config.js`. Nunca usar hex directamente en componentes.

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `bg` | `#F2F2F7` | `#000000` | fondo de pantalla |
| `surface` | `#FFFFFF` | `#1C1C1E` | tarjetas, grupos, sheets |
| `surface-2` | `#F7F7FA` | `#2C2C2E` | opciones de sheet, chips de fondo |
| `text` | `#1C1C1E` | `#FFFFFF` | texto principal |
| `muted` | `#8E8E93` | `#98989F` | secundario, placeholders |
| `separator` | `rgba(60,60,67,0.14)` | `rgba(84,84,88,0.65)` | separadores 0.5 px |
| `accent` | `#EF13A1` (cerise-600) | `#FF64D4` (cerise-400) | botones, FAB, indicadores |
| `accent-ink` | `#E0068C` (cerise-700) | `#FF9FE6` (cerise-300) | texto/iconos de acento |
| `accent-soft` | `#FEF1FB` (cerise-50) | `rgba(255,100,212,0.14)` | fondos suaves de acento |
| `on-accent` | `#FFFFFF` | `#1A0012` | texto sobre acento |
| `positive` | `#248A3D` | `#30D158` | ingresos, estados OK |
| `negative` | `#D70015` | `#FF453A` | egresos, errores, eliminar |
| `fill` | `rgba(120,120,128,0.12)` | `rgba(120,120,128,0.30)` | fondos de controles |
| `glass` | `rgba(255,255,255,0.58)` | `rgba(44,44,48,0.58)` | barras y tab bar |
| `glass-line` | `rgba(255,255,255,0.75)` | `rgba(255,255,255,0.12)` | borde de la tab bar |
| `hero-a` | `#FE36C1` (cerise-500) | `#E0068C` (cerise-700) | inicio del gradiente hero |
| `hero-b` | `#AC086B` (cerise-800) | `#580034` (cerise-950) | fin del gradiente hero |
| `scrim` | `rgba(20,0,12,0.32)` | `rgba(0,0,0,0.55)` | fondo de sheets |

**Paleta cerise** (tal cual el archivo del cliente): `50 #fef1fb · 100 #fee5f8 · 200 #ffcaf3 · 300 #ff9fe6 · 400 #ff64d4 · 500 #fe36c1 · 600 #ef13a1 · 700 #e0068c · 800 #ac086b · 900 #8f0c5b · 950 #580034`.

**Colores de cuentas y tarjetas.** El backend guarda un `color` por cuenta y tarjeta. Para el gradiente de la tarjeta visual: `c1 = color`, `c2 = color` mezclado al 35 % con `#580034` (cerise-950).

**Tema.** Tres opciones: Sistema, Claro, Oscuro (sección Ajustes, F15). Se aplica con `colorScheme.set()` de NativeWind. Persistir en AsyncStorage. Por defecto: Sistema.

**Tipografía** (fuente del sistema: Roboto en Android):

| Estilo | Tamaño / interlineado | Peso | Espaciado | Uso |
|---|---|---|---|---|
| Large title | 34 / 41 | 700 | -0.5 | encabezados de pestañas |
| Title (barra) | 17 / 22 | 600 | 0 | título centrado de la barra |
| Body | 16 / 22 | 400 / 500 | 0 | filas, campos |
| Subhead | 15 / 20 | 400 | 0 | subtítulos |
| Footnote | 13 / 18 | 400 | 0 | subtítulos de fila |
| Caption | 12 / 16 | 600 | 0 | tags, etiquetas de tarjeta |
| Section header | 13 / 18 | 400 | 0.4, MAYÚSCULAS | encabezados de sección (muted) |
| Amount grande | 34 / 40 | 700 | -0.6 | detalle |
| Hero | 38 / 44 | 700 | -0.8 | saldo total |
| Hero sm | 30 / 36 | 700 | -0.6 | saldo en tarjetas hero pequeñas |
| Tabular | — | — | — | **todas las cifras** con `fontVariant: ['tabular-nums']` |

**Espaciado.** Escala de 4 dp. Margen horizontal de página **16**. Separación entre secciones: encabezado con `margin-top 24` y `margin-bottom 8`. Separación entre grupos: 14. Tarjetas consecutivas: 12.

**Radios.**
| Elemento | Radio |
|---|---|
| Grupo / tarjeta | 20 |
| Hero | 24 |
| Hero sm / mini tarjeta de cuenta | 22 / 20 |
| Tarjeta de crédito visual | 22 |
| Tarjetita de ítem de lista | 16 |
| Botón | 16 |
| Campo de texto / select | 14 |
| Icono (tile) | 10 |
| Barra glass y tab bar | 26 (barra), 28 (sheet superior) |
| Chips, tags, switch | 999 |
| FAB | 18 |
| Segmented | 10 (interno 8) |

**Sombras y elevación.** En Android no existe `shadowX`; usar `elevation`:
| Elemento | Elevation |
|---|---|
| Grupos y tarjetas | 0 (sin sombra; diferenciación por color de fondo) |
| Hero | 6 |
| Mini tarjeta de cuenta | 4 |
| Tab bar | 8 |
| FAB | 8 (con `shadowColor` del acento en iOS) |
| Segmented activo | 1 |

**Iconos.** `lucide-react-native` con `react-native-svg`. Trazo **1.8**, esquinas redondeadas, tamaño **18** en tiles, **20** en barras, **22** en tab bar, **26** en FAB. Color: `text`, `accent-ink` o `muted` según contexto.

### 1.4 Catálogo de componentes base
Se construyen en F01 y se reutilizan en todas las features. Ninguna feature crea componentes visuales propios si ya existe uno equivalente.

| Componente | Descripción |
|---|---|
| `ScreenContainer` | fondo `bg`, padding horizontal 16, padding inferior 150 (espacio para tab bar) |
| `TopBar` | barra sticky glass de 52 dp (+ inset superior), título centrado 17/600, botón atrás a la izquierda, acción a la derecha |
| `LargeHeader` | título 34/41, kicker opcional (14, muted), subtítulo (15, muted), acción a la derecha |
| `SectionHeader` | encabezado de sección con enlace opcional a la derecha |
| `Group` / `Row` | contenedor redondeado `surface` y fila de 56 dp mínimo con icono opcional, título, subtítulo, valor, chevron |
| `Segmented` | control segmentado con fondo `fill` |
| `Chips` | fila horizontal de chips con scroll |
| `Button` | variantes `primary`, `ghost`, `danger`, `small` |
| `Field` / `TextField` | fila de formulario de 52 dp mínimo con etiqueta y entrada alineada a la derecha |
| `Select` | campo que abre un bottom sheet con opciones |
| `Switch` | 51 × 31 personalizado (ver F01) |
| `Checkbox` | círculo 24 dp con borde 2 |
| `Stepper` | botones circulares 30 dp con valor centrado |
| `Hero` / `HeroSm` | bloque de saldo con gradiente |
| `CreditCardVisual` | tarjeta de crédito con gradiente, número enmascarado y deuda |
| `MiniAccountCard` | tarjeta pequeña horizontal de cuenta |
| `Tag` | etiqueta de estado: `default`, `ok`, `acc`, `neg` |
| `ProgressBar` | barra de 6 dp |
| `Banner` | bloque de acento suave con icono, título y chevron |
| `Note` | bloque de texto informativo con fondo `fill` |
| `Avatar` / `Initials` | círculo de iniciales 38 dp (o 64/96 en detalle) |
| `Sheet` | bottom sheet con asa 38×5 y radio superior 28 |
| `Toast` | píldora superior con mensaje |
| `EmptyState` | icono 48 en `muted`, título 17/600, texto 14 `muted`, CTA opcional |
| `Skeleton` | bloques `fill` con pulso (carga inicial) |
| `TabBar` | barra glass flotante (F02) |
| `Fab` | botón + flotante (F02) |
| `AmountInput` | campo de monto centrado, prefijo `$`, 44/700 |

### 1.5 Reglas de consumo de la API
1. **Siempre leer `data`.** `message` se muestra al usuario; `errors` se usa para validación de campos.
2. **Cliente HTTP único** (`src/api/client.ts`) con base URL `EXPO_PUBLIC_API_URL` (ej. `http://192.168.1.10:3000/api/v1`). El `/health` no lleva prefijo.
3. **Authorization** `Bearer <accessToken>` en todas las rutas excepto `register`, `login`, `refresh` y `health`.
4. **Nunca enviar `userId`** ni campos no documentados (`forbidNonWhitelisted` devuelve 400). Los tipos de request salen de los DTO documentados.
5. **401:** intentar `POST /auth/refresh` una sola vez (cola de peticiones en vuelo, ver F03). Si falla, limpiar sesión y mostrar login.
6. **404 = "no existe"** (nunca mostrar "sin permiso").
7. **Mutaciones:** invalidar las queries afectadas (ver tabla de invalidación en F16). Pagos de cuota y de tarjeta invalidan saldos, movimientos y deudas.
8. **Paginación** (`incomes`, `expenses`): `useInfiniteQuery` con `page`/`limit=20`, usar `totalPages` para detener.
9. **Dinero:** la API devuelve números con máximo 2 decimales. La UI formatea con `formatMoney()` (sección 1.6). Nunca operar dinero con `float` acumulado en UI: redondear a 2 decimales en cada suma.
10. **Fechas:** `scheduledAt`, `dueDate`, `date`, `paidAt` vienen en ISO UTC; mostrar en la zona del usuario (`profile.timezone`) con `date-fns-tz`. Fechas de calendario (`cutoffDate`, `startDate`, `endDate`) vienen como `YYYY-MM-DD` y se muestran tal cual. Periodos `YYYY-MM` se muestran como "Oct 2026".
11. **Idempotencia:** pagar una cuota ya pagada → 400 (mostrar "Esta cuota ya está pagada"). Pagar un periodo ya pagado → 409 (mostrar "Este periodo ya fue pagado").

### 1.6 Formato de dinero y fechas
- **`formatMoney(n)`**: `$` + separador de miles `,` + 2 decimales `.`. Ejemplo `1847 → $1,847.00`. Implementar con función propia (`toFixed(2)` + regex de miles). **No depender de `Intl`** en Hermes para esto.
- **Signo en movimientos:** ingresos `+$500.00` en `positive`; egresos `−$7.50` (signo menos tipográfico U+2212) en `text`. Montos pendientes: `—` en `muted`.
- **Fechas en listas:** grupos "Hoy", "Ayer", luego `d MMM` en español (`15 oct`).
- **Fechas en detalle:** `d 'de' MMMM yyyy` (`16 de octubre de 2026`).
- **Hora:** `HH:mm` de 24 h.

### 1.7 Estados obligatorios de cada pantalla
Toda pantalla con datos implementa estos cuatro estados:

| Estado | Comportamiento |
|---|---|
| **Carga inicial** | `Skeleton` con la misma forma del contenido (no spinner centrado) |
| **Vacío** | `EmptyState` con icono, mensaje y CTA a la acción de creación |
| **Error de red** | Banner "Sin conexión" en la parte superior + botón "Reintentar" en el contenido |
| **Refresco** | pull-to-refresh con `RefreshControl` del color `accent` |

### 1.8 Accesibilidad y textos
- Área táctil mínima **44 × 44** dp (las filas de 56 cumplen).
- Todos los iconos-botón tienen `accessibilityLabel` en español.
- Textos en español neutro, tratamiento de usuario de **tú**.
- Contraste mínimo AA: `text` sobre `surface` y `on-accent` sobre `accent` cumplen; no usar `muted` para información crítica.

### 1.9 Expo Go vs development build (importante)
- **Expo Go** sirve para desarrollar y probar **toda la UI, navegación, formularios y API**.
- **Expo Go no soporta notificaciones push remotas (FCM) en Android** desde el SDK 53. Tampoco incluye módulos nativos de Firebase.
- Para **F04 (notificaciones push)** se necesita un **development build** creado con EAS (`expo-dev-client`), que se instala en el celular y se usa en lugar de Expo Go. Las notificaciones **locales** sí funcionan en Expo Go.
- Por eso F04 incluye la configuración de `google-services.json` y el build de desarrollo.

### 1.10 Variables de entorno
Validadas con **zod** al arrancar (`src/config/env.ts`), igual que el backend:

| Variable | Ejemplo | Validación |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `http://192.168.1.10:3000/api/v1` | URL http/https |
| `EXPO_PUBLIC_APP_ENV` | `development` | `development \| staging \| production` |

Si falta una variable, la app muestra una pantalla de error de configuración (no se levanta).

---