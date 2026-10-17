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

## 2. Dependencias

### 2.1 Creación del proyecto
```bash
pnpm create expo-app@latest monea --template blank-typescript
cd monea
```

### 2.2 Base (F00)
```bash
# Núcleo Expo y navegación
pnpm exec expo install expo-router expo-linking expo-constants expo-status-bar \
  react-native-safe-area-context react-native-screens react-native-gesture-handler \
  react-native-reanimated react-native-svg expo-linear-gradient expo-blur

# Estilos
pnpm add nativewind@^4 tailwindcss@^3.4.17
pnpm add -D prettier-plugin-tailwindcss

# Datos y red
pnpm add @tanstack/react-query axios zod zustand @react-native-async-storage/async-storage

# Utilidades
pnpm add date-fns date-fns-tz

# Dev
pnpm add -D typescript @types/react eslint-config-expo prettier
```

### 2.3 Por feature
| Feature | Paquetes |
|---|---|
| F01 Sistema de diseño | `lucide-react-native`, `@gorhom/bottom-sheet` |
| F02 Navegación | `@gorhom/bottom-sheet` (ya en F01) |
| F03 Autenticación | `expo-secure-store`, `react-hook-form`, `@hookform/resolvers` |
| F04 Notificaciones | `expo-notifications`, `expo-device`, `expo-dev-client` |
| F06 Cuentas | — |
| F07 Tarjetas | — |
| F08 Movimientos | `@react-native-community/datetimepicker` |
| F09 Diferidos | — |
| F10 Recurrentes | — |
| F11–F13 Obligaciones | — |
| F14 Listas | — |
| F15 Gestión / ajustes | — |
| F16 Calidad | `jest-expo jest @testing-library/react-native`, `husky @commitlint/cli @commitlint/config-conventional` |

```bash
# F01
pnpm exec expo install react-native-svg
pnpm add lucide-react-native @gorhom/bottom-sheet@^5

# F03
pnpm exec expo install expo-secure-store
pnpm add react-hook-form @hookform/resolvers

# F04
pnpm exec expo install expo-notifications expo-device expo-dev-client

# F08
pnpm exec expo install @react-native-community/datetimepicker

# F16
pnpm add -D jest-expo jest @testing-library/react-native husky @commitlint/cli @commitlint/config-conventional
pnpm exec husky init
```

### 2.4 Configuración de NativeWind (F00)
- `babel.config.js`: preset `babel-preset-expo` con `jsxImportSource: 'nativewind'`, plugin `react-native-reanimated/plugin` **al final**.
- `metro.config.js`: envolver con `withNativeWind(config, { input: './global.css' })`.
- `tailwind.config.js`: `content` incluye `./app/**/*.{ts,tsx}` y `./src/**/*.{ts,tsx}`; `darkMode: 'class'`; colores `cerise` y tokens semánticos apuntando a CSS variables.
- `global.css`: define `:root` (claro) y `.dark` (oscuro) con los valores de la tabla 1.3.
- `nativewind-env.d.ts` en la raíz.

---

## 3. Mapa de features y dependencias

| # | Feature | Rama | Depende de |
|---|---|---|---|
| F00 | Base del proyecto | `feature/00-project-setup` | — |
| F01 | Sistema de diseño | `feature/01-design-system` | F00 |
| F02 | Navegación y shell | `feature/02-navigation-shell` | F01 |
| F03 | Autenticación | `feature/03-auth` | F02 |
| F04 | Notificaciones y permisos | `feature/04-notifications` | F03 |
| F05 | Inicio | `feature/05-home-dashboard` | F04 (y datos de F06–F13 para sus secciones) |
| F06 | Cuentas bancarias | `feature/06-accounts` | F02 |
| F07 | Tarjetas de crédito | `feature/07-credit-cards` | F06 |
| F08 | Movimientos e ingresos/egresos | `feature/08-movements` | F06 |
| F09 | Egresos diferidos | `feature/09-deferred-expenses` | F07, F08 |
| F10 | Egresos recurrentes | `feature/10-recurring-expenses` | F08 |
| F11 | Cobros (y componentes compartidos de obligaciones) | `feature/11-collections` | F06, F08 |
| F12 | Préstamos | `feature/12-loans` | F11 |
| F13 | Deudas | `feature/13-debts` | F11 |
| F14 | Listas de compras | `feature/14-shopping-lists` | F06, F08 |
| F15 | Gestión, Más, perfil y ajustes | `feature/15-management-profile-settings` | F11–F14 |
| F16 | Calidad, errores y release | `feature/16-hardening-release` | todas |

---

## 4. Manejo de ramas y commits

### 4.1 Ramas permanentes
| Rama | Propósito | Protección |
|---|---|---|
| `main` | código en producción (builds publicados) | PR obligatorio, sin commits directos |
| `develop` | integración de features | PR obligatorio, CI en verde |

### 4.2 Ramas de trabajo
- **Features:** `feature/NN-nombre` (NN = número de feature, de dos dígitos). Salen de `develop` y regresan a `develop` vía PR con **squash merge**.
- **Correcciones:** `fix/NN-descripcion` para bugs detectados en una feature ya integrada.
- **Publicación:** `release/vX.Y.Z` desde `develop`; al cerrar, merge a `main` y a `develop`, y tag `vX.Y.Z`.
- **Hotfix:** `hotfix/descripcion` desde `main`; merge a `main` y `develop`.

Flujo de una feature:
```bash
git checkout develop && git pull
git checkout -b feature/06-accounts
# ... commits ...
git push -u origin feature/06-accounts
# PR -> develop (squash merge) -> borrar rama
```

### 4.3 Convención de commits (Conventional Commits)
Formato: `tipo(ámbito): descripción en imperativo, minúsculas, sin punto`.

| Tipo | Uso |
|---|---|
| `feat` | nueva funcionalidad visible |
| `fix` | corrección |
| `style` | solo estilos/tokens sin cambio de lógica |
| `refactor` | reorganización sin cambio de comportamiento |
| `chore` | configuración, dependencias, tooling |
| `test` | pruebas |
| `docs` | documentación |

Ámbitos sugeridos: `config`, `ui`, `nav`, `auth`, `push`, `home`, `accounts`, `cards`, `movements`, `deferred`, `recurring`, `collections`, `loans`, `debts`, `shopping`, `manage`, `settings`, `api`.

Reglas:
- Un commit = un paso lógico que compila y funciona.
- Commits de las features en el orden de la sección 5.
- `commitlint` + `husky` (F16) validan el formato en el hook `commit-msg`.
- Nunca commitear `.env`, `google-services.json` (ver F04) ni claves.

---

## 5. Features

> Convención de cada feature: **Objetivo → Rama → Depende de → Pantallas (diseño) → Endpoints → Reglas → Estados → Dependencias → Commits → Criterios de aceptación.**
> Los textos entre comillas son **literales** del prototipo.

---

### F00 — Base del proyecto

**Objetivo:** dejar el proyecto ejecutable en Expo Go con NativeWind, configuración validada, cliente HTTP y proveedores globales.

**Rama:** `feature/00-project-setup` · **Depende de:** —

**Pasos**
1. Crear el proyecto (sección 2.1) y configurar pnpm como gestor.
2. Configurar NativeWind (sección 2.4). Verificar que `className="bg-bg text-text"` aplica color en Expo Go.
3. `app.config.ts`: `name: "MONEA"`, `slug: "monea"`, `scheme: "monea"`, `android.package: "com.tuempresa.monea"`, `userInterfaceStyle: "automatic"`, `orientation: "portrait"`, `android.adaptiveIcon` con el logo (cuadrado con gradiente cerise-500→cerise-900 y la letra M blanca).
4. `src/config/env.ts`: validación con zod (sección 1.10). Si falla, renderizar `ConfigError` en lugar de la app.
5. `src/api/client.ts`: instancia de axios con `baseURL = env.API_URL`, `timeout 15000`, interceptor de respuesta que normaliza el envelope (`success`, `statusCode`, `data`, `message`, `errors`) en un tipo `ApiError { status, message, errors }`.
6. `src/lib/format.ts`: `formatMoney`, `formatDate`, `formatPeriod` (sección 1.6). Pruebas unitarias básicas.
7. `app/_layout.tsx`: `QueryClientProvider`, `SafeAreaProvider`, `GestureHandlerRootView`, `BottomSheetModalProvider`, `StatusBar` automática, carga de `global.css`.
8. Pantalla placeholder en `app/index.tsx` con el texto "MONEA" centrado en `bg`.

**Dependencias:** las de la sección 2.2.

**Commits**
```
chore(config): crear proyecto expo con pnpm y expo-router
chore(config): configurar nativewind v4 con tokens cerise y modo oscuro
feat(config): validar variables de entorno con zod y bloquear arranque si faltan
feat(api): cliente http con normalizacion del envelope de respuesta
feat(config): agregar formateadores de dinero y fechas
```

**Criterios de aceptación**
- [ ] Expo Go abre la app sin errores de consola.
- [ ] Cambiar el sistema a oscuro cambia el fondo a `#000000`.
- [ ] Sin `EXPO_PUBLIC_API_URL` la app muestra `ConfigError`.
- [ ] `formatMoney(1847)` devuelve `$1,847.00`.

---

### F01 — Sistema de diseño

**Objetivo:** construir el catálogo de componentes de la sección 1.4 con las medidas exactas del prototipo, para que todas las features los reutilicen.

**Rama:** `feature/01-design-system` · **Depende de:** F00

**Especificación de componentes** (valores en dp; equivalencias del CSS del prototipo)

**TopBar** (`src/components/ui/TopBar.tsx`)
- Contenedor: altura **52** + `insets.top`; fondo `glass` con `BlurView` (tint del sistema; en Android `experimentalBlurMethod="dimezisBlurView"`, intensidad 60); borde inferior 0.5 `separator`; **sticky** (en la parte superior de la pantalla).
- Izquierda: botón atrás 36 × 36, círculo `fill`, icono chevron izquierdo 20 en `accent-ink`. Se muestra solo si hay historial de navegación.
- Centro: título 17/600, máximo 55 % del ancho, truncado con `…`, centrado absoluto.
- Derecha: acciones de texto `tbtn` (17/600, `accent-ink`, padding 6) o icono-botón 36 circular `fill`.

**LargeHeader**
- Si hay botón atrás: fila de 44 dp con el botón atrás. Si no: espacio de 12 dp.
- Bloque: `kicker` (14, `muted`) opcional, título 34/41 700 letter-spacing -0.5, subtítulo 15 `muted` con margen superior 4.
- Padding: `6` arriba y `14` abajo. Acción a la derecha, alineada abajo.

**Group y Row**
- `Group`: fondo `surface`, radio 20, `overflow: hidden`, margen inferior 4.
- `Row`: altura mínima **56**, padding `12` vertical y `14` horizontal, gap **12**. Contenido: icono tile opcional (34 × 34, radio 10, fondo `accent-soft`, icono `accent-ink` 18), bloque de texto (título 16/500 una línea, subtítulo 13 `muted`), valor a la derecha (16, tabular), chevron 14 `muted` si la fila es navegable.
- Separador: línea de 0.5 `separator` entre filas, desde x = 14 (o x = 60 si hay icono). No hay separador antes de la primera fila ni después de la última.
- Estado presionado: fondo `fill` durante el toque.

**Segmented**
- Contenedor: fondo `fill`, radio 10, padding 2, margen `6 0 16`.
- Segmento: flex 1, padding `8 6`, radio 8, texto 14/600 `text`.
- Activo: fondo `surface`, sombra `elevation 1`.

**Chips**
- Scroll horizontal sin barra visible, `gap 8`, `paddingBottom 14`.
- Chip: padding `8 14`, radio 999, fondo `surface`, texto 14/500.
- Activo: fondo `accent`, texto `on-accent`.

**Button**
- `primary`: altura 52, radio 16, fondo `accent`, texto 17/600 `on-accent`, centrado, ancho 100 %.
- `ghost`: fondo `fill`, texto `accent-ink`.
- `danger`: fondo transparente, texto `negative`.
- `small`: auto ancho, padding `9 14`, radio 12, texto 14.
- Presionado: escala 0.98 y opacidad 0.9.

**Field / TextField**
- Fila: altura mínima 52, padding `12 14`, gap 12, separador superior igual que Row.
- Etiqueta: 16, `text`, ancho automático.
- Entrada: ocupa el resto, texto 16 alineado a la derecha, placeholder `muted`. En pantallas de autenticación (`auth-group`), texto alineado a la izquierda.
- Select: texto del valor en `accent-ink` peso 500, sin icono de flecha (igual al prototipo).

**Select** (bottom sheet)
- Al tocar el campo se abre un `Sheet` con título, lista de opciones (Rows) y la opción activa marcada con `check` 18 en `accent-ink`.

**Switch** (personalizado, 51 × 31)
- Pista: radio 31, color `fill` (off) o `positive` (on). Transición 200 ms.
- Perilla: 27 × 27 blanca, sombra (`elevation 2`), margen 2, desplazamiento 20 dp.

**Checkbox** (círculo)
- 24 dp, radio 12, borde 2 `muted`. Marcado: fondo `accent`, borde `accent`, icono check 14 blanco.

**Stepper**
- Botones 30 × 30 círculo `fill`, texto 18. Valor 600, `minWidth 18`, centrado, tabular.

**Hero**
- Padding 20, radio 24, gradiente lineal 135° de `hero-a` a `hero-b`, texto `#FFFFFF`.
- Etiqueta 14 con opacidad 0.85. Cifra 38/700 letter-spacing -0.8. Filas de pie: 14 con margen superior 12.
- Círculo decorativo: 200 dp, `rgba(255,255,255,0.12)`, posición `right -70, top -80`, recortado.
- `HeroSm`: padding 16, radio 22, cifra 30/700.

**CreditCardVisual**
- Padding 18, radio 22, altura mínima 172, gradiente de `c1` a `c2` (135°).
- Círculo grande decorativo: 230 dp, `rgba(255,255,255,0.14)`, `right -90, top -100`. Círculo pequeño: 150 dp, `rgba(255,255,255,0.08)`, `left -60, bottom -90`.
- Línea 1: nombre 15/600. Línea 2: número `•••• •••• •••• ####` 19 letter-spacing 2.
- Pie: izquierda "Deuda del periodo" (12, opacidad 0.85) y monto 20/700; derecha emisor (12, opacidad 0.85).
- Variante `sm`: padding `14 16`, altura automática, monto 16/700.

**MiniAccountCard**
- Ancho 200, padding 14, radio 20, fondo `surface`, elevation 4.
- Barra superior: altura 6, radio 3, margen inferior 12, color = color de la cuenta.
- Nombre 15/600 (una línea), institución 12 `muted`, saldo 20/700 con margen superior 8.

**Tag**
- Padding `3 9`, radio 999, texto 12/600.
- `default`: fondo `fill`. `ok`: fondo `positive` al 16 %, texto `positive`. `acc`: fondo `accent-soft`, texto `accent-ink`. `neg`: fondo `negative` al 14 %, texto `negative`.

**ProgressBar**: altura 6, radio 3, pista `fill`, relleno `accent`.

**Banner**: fondo `accent-soft`, radio 18, padding 14, margen inferior 12. Icono tile, título 15/600 `text`, subtítulo 13 `muted`, chevron a la derecha.

**Note**: fondo `fill`, radio 14, padding `12 14`, margen superior 12, texto 13 `muted`, interlineado 18.

**Avatar/Initials**: círculo de 38 (listas) con fondo `accent-soft` y texto `accent-ink` 14/600. Versión de detalle: 64 con texto 22. Avatar de perfil: 96 con gradiente `accent` a `accent-ink`, texto blanco 36/700.

**AmountInput**: fila centrada, prefijo "$" 44/700, input 44/700 con ancho 70 %, texto centrado, letter-spacing -1, placeholder `muted`.

**Sheet** (`@gorhom/bottom-sheet`)
- Fondo `surface`, radio superior 28, `handleIndicatorStyle` 38 × 5 radio 3 color `fill`, padding horizontal 16, padding inferior `insets.bottom + 22`.
- Backdrop: `scrim`. Cerrar al tocar el backdrop.
- Altura: automática hasta 88 % de la pantalla.
- Título 20/700 centrado (`sh-t`), subtítulo 15 `muted` centrado con margen inferior 14.

**Toast**
- Posición: centrado horizontal, `top = insets.top + 14`.
- Fondo: `text` invertido (en claro: `#1C1C1E`; en oscuro: `#FFFFFF`), texto color `bg`, 14/600, padding `11 18`, radio 14, `nowrap`.
- Animación: entra con opacidad 0→1 y desplazamiento -10→0 en 250 ms; sale tras 1900 ms.
- Una sola notificación visible a la vez (la nueva reemplaza a la anterior).

**EmptyState**: columna centrada, icono 48 `muted`, título 17/600, texto 14 `muted` centrado (máx. 280 de ancho), botón `ghost` opcional con margen superior 16.

**Skeleton**: bloques de `fill` con radio que imitan la forma de la fila o tarjeta; pulso de opacidad 0.5↔1, 1200 ms.

**Dependencias:** `lucide-react-native`, `react-native-svg`, `@gorhom/bottom-sheet@^5`, `expo-blur`, `expo-linear-gradient`.

**Commits**
```
feat(ui): agregar tokens semanticos de color, tipografia y radios
feat(ui): componentes de layout topbar, large header, group y row
feat(ui): componentes de formulario field, select, switch, checkbox y stepper
feat(ui): componentes hero, tarjeta de credito y tag con medidas del prototipo
feat(ui): sheet, toast, empty state y skeleton
```

**Criterios de aceptación**
- [ ] Cada componente se ve igual al prototipo en claro y oscuro (comparación lado a lado con captura).
- [ ] Ningún componente usa hex directo; todos usan tokens.
- [ ] El switch y el checkbox responden al toque en 44 × 44 mínimo.

---

### F02 — Navegación y shell

**Objetivo:** definir la estructura de pestañas, la barra flotante glass, el botón + y la hoja de acciones rápidas.

**Rama:** `feature/02-navigation-shell` · **Depende de:** F01

**Pestañas (orden fijo):** `Inicio` (icono `home`), `Movimientos` (icono `arrows`), `Gestión` (icono `grid`), `Más` (icono `more`).

**TabBar (glass flotante)**
- Posición absoluta: `bottom = insets.bottom + 12`, `left = right = 16`; ancho `min(398, pantalla − 32)`, centrado.
- Altura **66**, radio **26**, borde 1 `glass-line`, fondo `glass` con `BlurView`, `elevation 8`.
- 4 pestañas con `flex 1`, centradas. Cada pestaña: columna con icono dentro de una **píldora 58 × 30 (radio 15)** y etiqueta debajo (11/600).
- Pestaña activa: píldora fondo `accent-soft`, icono y etiqueta en `accent-ink`. Inactiva: `muted`.
- Transición de la píldora: 200 ms.
- **Visibilidad:** solo en las pestañas raíz. Oculta en cualquier pantalla apilada (detalles, formularios).

**Fab**
- 56 × 56, radio 18, fondo `accent`, icono `plus` 26 en `on-accent`.
- Posición: `bottom = insets.bottom + 88`, `right = max(20, (pantalla − 430)/2 + 16)` (con pantalla de 430 se queda en 16).
- Sombra del acento. Solo visible en **Inicio** y **Movimientos** (igual que el prototipo).
- Al tocar: abre la hoja "Nuevo".

**Hoja "Nuevo"** (sheet)
- Título `Nuevo` (20/700 centrado), subtítulo "¿Qué quieres registrar?" (15 `muted`).
- Cuadrícula de 2 columnas, `gap 10`. Cada opción: botón `surface-2`, radio 18, padding 14, icono tile 36 + etiqueta 15/500.
- Opciones **en este orden**: `Ingreso` → `movements/income/new` · `Egreso` → `movements/expense/new` (pantalla con selector Instantáneo / Diferido / Recurrente) · `Cuenta` → `accounts/new` · `Tarjeta` → `cards/new` · `Cobro` → `obligations/cobros/new` · `Préstamo` → `obligations/prestamos/new` · `Deuda` → `obligations/deudas/new` · `Lista` → `shopping/new`.
- **No se muestran** `Diferido` ni `Recurrente` en esta hoja (se eligen dentro de Egreso).
- Al elegir una opción: cerrar la hoja y navegar.

**Navegación apilada**
- Las pantallas de detalle usan `Stack` con animación nativa de Android (`slide_from_right`).
- La barra superior muestra atrás a la izquierda; el gesto de atrás de Android funciona en todas.
- Pantallas de autenticación en un grupo `(auth)` sin tab bar y sin cabecera.

**Estructura de rutas**
| Ruta | Tab bar | FAB | Cabecera |
|---|---|---|---|
| `(auth)/*` | no | no | no |
| `(tabs)/index` Inicio | sí | sí | large header |
| `(tabs)/movements` | sí | sí | large header |
| `(tabs)/manage` Gestión | sí | no | large header |
| `(tabs)/more` Más | sí | no | large header |
| Cualquier detalle/formulario | no | no | TopBar con atrás |

**Dependencias:** `expo-router` (F00), `@gorhom/bottom-sheet` (F01).

**Commits**
```
feat(nav): tabs inferiores inicio, movimientos, gestion y mas
feat(nav): tab bar flotante glass con pildora activa
feat(nav): boton + flotante visible solo en inicio y movimientos
feat(nav): hoja de acciones rapidas con opciones de registro
feat(nav): stack con cabecera y atras nativo
```

**Criterios de aceptación**
- [ ] La tab bar mide 66 dp de alto, está separada 12 dp del borde inferior y tiene radio 26.
- [ ] En Gestión y Más no aparece el botón +.
- [ ] En un detalle la tab bar desaparece y aparece la barra con atrás.
- [ ] La hoja "Nuevo" tiene exactamente 8 opciones en el orden indicado.

---

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

### F05 — Inicio (dashboard)

**Objetivo:** resumen del día con saldo total, deudas de tarjetas, por cobrar, pendientes y cuotas de la semana.

**Rama:** `feature/05-home-dashboard` · **Depende de:** F04 (y de las features de datos F06–F13 para sus secciones)

**Pantalla** (`(tabs)/index`)
1. **LargeHeader:** kicker `Viernes, 16 de octubre` (fecha actual, formato `EEEE, d 'de' MMMM`, capitalizada), título `Hola, {primer nombre}`, acción derecha: icono-botón `bell` 36 circular `fill` → Recordatorios.
2. **Hero** (sin margen superior adicional):
   - Etiqueta "Saldo total".
   - Cifra: suma de `currentBalance` de todas las cuentas (`formatMoney`).
   - Fila: "Deuda de tarjetas (periodo)" → suma de `currentDebt` de cada tarjeta.
   - Fila: "Por cobrar" → suma de `pendingAmount` de cobros.
3. **SectionHeader "Requiere atención"**
   - Group con filas:
     - Si hay tarjeta con pago en ≤ 3 días: icono `bell`, título "Pago {tarjeta} en {n} días", subtítulo "Recordatorio · {fecha y hora}" → detalle de la tarjeta.
     - Si hay egresos con `amountPending = true`: icono `repeat`, título "{nombre} · define el monto", subtítulo "Egreso de cantidad variable" → `recurring/define-amount`.
   - Si no hay nada: no mostrar la sección.
4. **SectionHeader "Cuentas"** con enlace derecho "Ver todas" (14, `accent-ink`) → `accounts`.
   - Scroll horizontal de `MiniAccountCard` (ancho 200, gap 12, margen horizontal -16 con padding 16 para que el scroll llegue al borde).
   - Al tocar: `accounts/[id]`.
5. **SectionHeader "Tarjetas"**
   - Group con una fila por tarjeta: icono tile de color de la tarjeta (fondo `color` al 20 %, icono `card` en `color`), título nombre, subtítulo "Pago el {día} de cada mes", valor = deuda del periodo.
6. **SectionHeader "Esta semana"**
   - Group con cuotas cuyo `dueDate` cae en los próximos 7 días (de cobros, préstamos y deudas, con `isPaid = false`):
     - Cobro: icono `down`, título "{persona} · cuota {n} de {total}", subtítulo "Cobro · vence {fecha}", valor `+$monto` en `positive`.
     - Deuda: icono `up`, valor `−$monto` en `negative`.
     - Préstamo: icono `bank`, valor `−$monto` en `negative`.
   - Filas navegables a su detalle.

**Estados:** skeleton con la forma del hero y 3 filas; sin datos → hero con `$0.00` y `EmptyState` "Empieza registrando una cuenta" con botón a `accounts/new`.

**Endpoints usados**
| Método | Ruta | Campos usados |
|---|---|---|
| GET | `/users/me` | `name`, `timezone` |
| GET | `/accounts` | `id`, `name`, `financialInstitution`, `color`, `currentBalance` |
| GET | `/credit-cards` | `id`, `name`, `color`, `issuer`, `cutoffDay`, `paymentDay` |
| GET | `/credit-cards/:id/debt` | `currentDebt`, `upcoming` |
| GET | `/credit-cards/:id/report?period=YYYY-MM` | periodo actual: `total`, `paid`, `cutoffDate`, `paymentDate` |
| GET | `/collections`, `/loans`, `/debts` | `installments` con `dueDate`, `isPaid`; `pendingAmount` |
| GET | `/expenses?amountPending=true` | pendientes de monto |
| GET | `/notifications/reminders` | recordatorios próximos |

> **Costo:** la pantalla hace varias consultas en paralelo con `useQueries`. Usar `staleTime` de 60 s.

**Commits**
```
feat(home): hero con saldo total, deuda de tarjetas y por cobrar
feat(home): seccion requiere atencion con pagos cercanos y montos pendientes
feat(home): carrusel de cuentas y lista de tarjetas
feat(home): cuotas de la semana desde cobros, prestamos y deudas
```

**Criterios de aceptación**
- [ ] El saldo total coincide con la suma de `currentBalance`.
- [ ] La sección "Esta semana" solo muestra cuotas no pagadas con vencimiento en 7 días.
- [ ] Tocar cada tarjeta, cuenta o cuota abre su detalle.
- [ ] Layout idéntico al prototipo en claro y oscuro.

---

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

### F07 — Tarjetas de crédito

**Objetivo:** registrar tarjetas, consultar el reporte por periodo y pagar un periodo (genera un egreso).

**Rama:** `feature/07-credit-cards` · **Depende de:** F06

**Pantallas**

**Tarjetas** (segmentado dentro de `accounts`, pestaña "Tarjetas")
- Por cada tarjeta, `CreditCardVisual` (margen inferior 14, tocable) → `cards/[id]`.
- Group con dos filas de resumen: "Deuda total de tarjetas" (suma de `currentDebt`) y "Cupo disponible total" (suma de `creditLimit − currentDebt − upcoming`).
- Botón ghost "Nueva tarjeta" → `cards/new`.

**Detalle de tarjeta** (`cards/[id]`)
- `TopBar` con nombre, atrás y "Editar" → `cards/[id]/edit`.
- `CreditCardVisual` (margen superior 12).
- Group de datos: "Cupo disponible" (`creditLimit − currentDebt − upcoming`), "Cupo total", "Fecha de corte" (`día {cutoffDay}`), "Fecha de pago" (`día {paymentDay}`).
- SectionHeader "Periodo" + **Chips** horizontales con los periodos de los últimos 3 meses y los 2 siguientes (etiquetas "Oct", "Nov", "Dic", "Ene"). Chip activo = periodo seleccionado (por defecto el mes actual).
- Card de periodo (surface, radio 20, padding 16):
  - Fila: izquierda "Total del periodo" (13 `muted`) y cifra 30/700; derecha `Tag`: "Pagado" (`ok`), "Pendiente" (`acc`) o "Sin cargos" (`default`).
  - Pie: "Corte {cutoffDate} · Pago {paymentDate}" (13 `muted`).
  - Botón small "Pagar periodo" (ancho 100 %, margen superior 14) — visible solo si hay total > 0 y no está pagado.
- SectionHeader "Compras del periodo" y Group con los `items` del reporte: icono `cart`, título `name`, subtítulo "Cuota {installmentNumber} de {installmentsTotal}", valor `amount`. Vacío → fila "Sin cargos en este periodo".

**Hoja "Pagar tarjeta"** (sheet)
- Título "Pagar {tarjeta}" (sh-t), subtítulo "Periodo {mes} · se generará un egreso corriente".
- `AmountInput` no editable mostrando el total del periodo.
- Group: "Cuenta origen" (select con las cuentas, muestra saldo).
- Botón primario "Confirmar pago".
- Acción: `POST /credit-cards/:id/pay` con `{ accountId, period }`.
  - 201 → cerrar hoja, toast "Pago registrado · egreso creado", invalidar tarjeta, cuentas, movimientos.
  - 409 → toast "Este periodo ya fue pagado".
  - 400 → mensaje de la API (periodo futuro o sin deuda).

**Formulario de tarjeta** (`cards/new`, `cards/[id]/edit`)
- `TopBar` con "Guardar" a la derecha. `LargeHeader` "Nueva tarjeta" / "Editar tarjeta".
- Group: "Alias" (máx. 60), "Entidad emisora" (máx. 80), "Últimos 4 dígitos" (teclado numérico, exactamente 4), "Cupo" (decimal, > 0, opcional).
- SectionHeader "Fechas": Group con "Día de corte" y "Día de pago" (selects 1–31, opcionales).
- SectionHeader "Recordatorio": Group con "Avisar antes del pago" (switch, default en `true` al crear) y "Antelación" (select 0–30 días; por defecto `1 día`) y "Hora del aviso" (select 00:00–23:00; por defecto `09:00`).
  - Regla: si el switch está activo, **`paymentDay` es obligatorio** (validación con mensaje "Indica el día de pago para activar el recordatorio").
- SectionHeader "Color": swatches de la misma paleta de cuentas (sección F06).
- Botón primario "Guardar tarjeta".

**Reglas**
- `lastFourDigits`: exactamente 4 dígitos numéricos.
- Cambiar `paymentDay` o el recordatorio reprograma el aviso en el backend (sin acción extra en UI).
- Eliminar tarjeta: `DELETE /credit-cards/:id` con confirmación. Los egresos diferidos existentes se conservan.

**Endpoints**
| Método | Ruta | Uso |
|---|---|---|
| POST | `/credit-cards` | body `{ name, color, issuer, lastFourDigits, creditLimit?, cutoffDay?, paymentDay?, reminderEnabled?, reminderDaysBefore?, reminderHour? }` |
| GET | `/credit-cards` | listado |
| GET | `/credit-cards/:id` | detalle |
| PATCH | `/credit-cards/:id` | edición |
| DELETE | `/credit-cards/:id` | eliminar |
| GET | `/credit-cards/:id/report?period=YYYY-MM` | periodo seleccionado |
| GET | `/credit-cards/:id/debt` | deuda y cupo |
| POST | `/credit-cards/:id/pay` | body `{ accountId, period? }` |

**Commits**
```
feat(cards): listado de tarjetas con tarjeta visual y resumen
feat(cards): detalle con chips de periodo y reporte mensual
feat(cards): formulario de tarjeta con fechas y recordatorio
feat(cards): pagar periodo con hoja de cuenta origen
```

**Criterios de aceptación**
- [ ] El cupo disponible coincide con `creditLimit − currentDebt − upcoming`.
- [ ] Pagar un periodo crea un egreso en la cuenta elegida y el periodo queda "Pagado".
- [ ] Pagar dos veces el mismo periodo muestra el mensaje de 409.
- [ ] Activar el recordatorio sin día de pago muestra error de validación.

---

### F08 — Movimientos e ingresos/egresos

**Objetivo:** ver todos los movimientos combinados, filtrarlos, consultar el detalle y registrar ingresos y egresos instantáneos.

**Rama:** `feature/08-movements` · **Depende de:** F06

**Pantalla Movimientos** (`(tabs)/movements`)
- `LargeHeader` "Movimientos" con acción derecha: icono-botón `search` 36 circular (abre búsqueda por nombre; filtra en cliente).
- **Chips** de filtro: "Todos", "Ingresos", "Egresos", "Diferidos", "Recurrentes".
- **Banner** (solo si hay egresos con `amountPending`, y el filtro no es "Ingresos"): fondo `accent-soft`, icono `repeat` en tile, título "{n} egreso necesita monto", subtítulo "{nombre} · {fecha}", chevron → `recurring/define-amount` (F10).
- Lista agrupada por fecha: SectionHeader con "Hoy", "Ayer" o `d MMM`; Group de filas.
- Fila de movimiento: icono tile (`cart` para egresos instantáneos, `down` para ingresos, `card` para diferidos, `repeat` para recurrentes, `card` para pagos de tarjeta), título `name`, subtítulo "{cuenta} · {origen}" (origen: Manual, Recurrente, Cobro, Tarjeta, Préstamo, Deuda, Lista), valor: `+$monto` en `positive` si es ingreso, `−$monto` en `text` si es egreso, `Tag acc` "Definir monto" si está pendiente.
- Botón ghost "Ver egresos recurrentes" al final → `recurring` (F10).

**Mapeo de filtros a la API**
| Chip | Consulta |
|---|---|
| Todos | `GET /incomes` + `GET /expenses` (paginados, combinados por `date` DESC) |
| Ingresos | solo `GET /incomes` |
| Egresos | `GET /expenses?paymentMethod=CORRIENTE` |
| Diferidos | `GET /expenses?paymentMethod=DIFERIDO` |
| Recurrentes | `GET /expenses` filtrando en cliente `sourceType = RECURRING` |

> **Limitación de la API:** no existe filtro por `sourceType` en `/expenses`. El filtro "Recurrentes" se hace en cliente sobre las páginas cargadas. Sugerencia para backend: agregar `sourceType` como query opcional.

**Detalle de movimiento** (`movements/[id]`)
- `TopBar` "Detalle" con atrás. "Editar" a la derecha solo si es editable (ver reglas). Sin botón si no.
- Bloque centrado: icono tile 56 (radio 18), nombre 17/600, monto 34/700 (`pos` si ingreso), fecha y hora (`d MMM · HH:mm`).
- Note si es automático: "Generado automáticamente desde **{origen}**. El monto se gestiona desde su módulo de origen." (margen inferior 14).
- Group: "Cuenta", "Forma de pago", "Origen", "Fecha".
- Botón danger "Eliminar movimiento" dentro de un Group (margen superior 18) — **solo si la API lo permite**.

**Reglas de edición y borrado (API)**
- **Ingreso `MANUAL`:** editable (todos los campos), eliminable.
- **Ingreso automático** (`COLLECTION_INSTALLMENT`, `LOAN_INSTALLMENT`): solo `name` y `description` editables. No eliminable (400).
- **Egreso `CORRIENTE` manual:** editable; eliminable.
- **Egreso automático:** `RECURRING` editable/eliminable según la API; `CARD_PAYMENT`, `LOAN_CREATION`, `DEBT_PAYMENT`, `SHOPPING_LIST` no eliminables. Mostrar el error de la API si falla.
- **Egreso `DIFERIDO`:** ver F09.

**Formulario de ingreso** (`movements/income/new`)
- `TopBar` "Nuevo ingreso" con atrás y "Guardar" (tbtn).
- `AmountInput` (monto > 0).
- Group: "Nombre" (máx. 80, placeholder "Ej. Almuerzo" → para ingresos "Ej. Sueldo"), "Cuenta destino" (select), "Fecha" (date picker, por defecto hoy).
- SectionHeader "Descripción opcional": Group con textarea.
- Botón primario "Guardar" → `POST /incomes`.

**Formulario de egreso** (`movements/expense/new`)
- `TopBar` "Nuevo egreso" con atrás.
- **Segmentado** "Instantáneo" | "Diferido" | "Recurrente" (margen superior 8). Cambiar el segmento cambia el formulario en la misma pantalla.
- `AmountInput`.
- Group: "Nombre", "Cuenta" (select), "Forma de pago" (fijo "Corriente (contado)" en Instantáneo), "Fecha".
- Instantáneo: `POST /expenses` con `paymentMethod: CORRIENTE` (no enviar `creditCardId`, `installments` ni `graceMonths`).
- Diferido: ver F09. Recurrente: ver F10.

**Reglas**
- `amount`: ingresos `> 0`; egresos `≥ 0` (la API lo permite en 0 para variables; el formulario manual exige > 0).
- Fecha por defecto = ahora (UTC en el envío).
- Al crear, invalidar `incomes`, `expenses`, `accounts`, `home`.

**Endpoints**
| Método | Ruta | Uso |
|---|---|---|
| GET | `/incomes?page&limit&accountId&from&to` | listado paginado |
| GET | `/incomes/:id` | detalle |
| POST | `/incomes` | body `{ accountId, name, amount, description?, date? }` |
| PATCH | `/incomes/:id` | `name`, `description` (y demás si es manual) |
| DELETE | `/incomes/:id` | solo manuales |
| GET | `/expenses?page&limit&paymentMethod&amountPending&from&to&accountId` | listado paginado |
| GET | `/expenses/:id` | detalle (incluye `installmentPlan` si es diferido) |
| POST | `/expenses` | body `{ accountId, name, amount, description?, date?, paymentMethod? }` |
| PATCH | `/expenses/:id` | edición (ver reglas) |
| DELETE | `/expenses/:id` | eliminar |

**Commits**
```
feat(movements): lista combinada de ingresos y egresos agrupada por fecha
feat(movements): filtros por tipo y banner de montos pendientes
feat(movements): detalle de movimiento con reglas de edicion automatica
feat(movements): formulario de ingreso con cuenta destino
feat(movements): formulario de egreso instantaneo con selector de tipo
```

**Criterios de aceptación**
- [ ] La lista combina ingresos y egresos ordenados por fecha descendente.
- [ ] Un ingreso generado por cobro no muestra "Editar" de monto ni "Eliminar".
- [ ] Un egreso instantáneo descuenta del saldo de su cuenta.
- [ ] El paginado carga más al llegar al final sin duplicar filas.

---

### F09 — Egresos diferidos

**Objetivo:** registrar compras a cuotas cargadas a una tarjeta, consultar el plan de cuotas y su estado.

**Rama:** `feature/09-deferred-expenses` · **Depende de:** F07, F08

**Formulario diferido** (segmento "Diferido" dentro de `movements/expense/new`)
- Mismo `AmountInput` y "Nombre" que el egreso instantáneo.
- Group:
  - "Cuenta" (select) — **requerida por la API**: es la cuenta de la que se descontará al pagar el periodo de la tarjeta. Nota de ayuda debajo: "El saldo cambia cuando pagues el periodo de la tarjeta."
  - "Tarjeta" (select con `{nombre} ·{últimos 4}`).
  - "Cuotas" (stepper, mínimo 1, valor inicial 3).
  - "Meses de gracia" (stepper, mínimo 0, valor inicial 0).
  - "Fecha de compra" (date picker, por defecto hoy).
- `POST /expenses` con `{ accountId, name, amount, paymentMethod: "DIFERIDO", creditCardId, installments, graceMonths, date }`.

**Detalle de compra diferida** (`movements/deferred/[id]`)
- `TopBar` "Compra diferida" con atrás.
- Bloque centrado: nombre 16 `muted`, monto 34/700 (`text`), pie "{tarjeta} · {n} cuotas" (14 `muted`).
- `Card` con fila "Cuotas pagadas" a la izquierda y "{pagadas} de {total}" en negrita a la derecha; `ProgressBar` debajo con el porcentaje de cuotas pagadas.
- SectionHeader "Plan de cuotas" y Group. Cada fila:
  - Icono tile neutro con el número de cuota (14/700).
  - Título: monto de la cuota (16/500). Subtítulo: periodo en formato "Oct 2026".
  - Valor: `Tag ok` "Pagada" o `Tag` "Pendiente".
- Nota 13 `muted` al final: "Las cuotas no descuentan del saldo de la cuenta hasta pagar el periodo de la tarjeta."
- Sin botón editar (las reglas de edición se gestionan desde la API; fuera de alcance de la primera versión).

**Reglas**
- `installments ≥ 1`, `graceMonths ≥ 0`, `creditCardId` obligatorio.
- Un egreso diferido no afecta `currentBalance` de la cuenta; el saldo cambia con `POST /credit-cards/:id/pay`.
- Pagar un periodo con cuotas de este egreso marca esas cuotas como pagadas: refrescar el detalle al volver.
- No permitir eliminar un diferido con cuotas pagadas (la API responde 400; mostrar el mensaje).

**Endpoints**
| Método | Ruta | Uso |
|---|---|---|
| POST | `/expenses` | crear diferido |
| GET | `/expenses/:id` | plan (`installmentPlan`: `number`, `amount`, `period`, `isPaid`) |
| GET | `/expenses?paymentMethod=DIFERIDO` | listado (en F08) |

**Commits**
```
feat(deferred): formulario de egreso diferido con cuotas y meses de gracia
feat(deferred): detalle con progreso y plan de cuotas por periodo
```

**Criterios de aceptación**
- [ ] Crear un diferido de $900 en 3 cuotas muestra el plan con $300 por periodo.
- [ ] El saldo de la cuenta no cambia tras crear el diferido.
- [ ] El progreso refleja las cuotas pagadas por el pago de tarjeta.

---

### F10 — Egresos recurrentes

**Objetivo:** configurar egresos automáticos (semanal, mensual, anual), activarlos o desactivarlos y definir el monto de los variables.

**Rama:** `feature/10-recurring-expenses` · **Depende de:** F08

**Pantalla Recurrentes** (`recurring`)
- `TopBar` "Recurrentes" con atrás.
- `LargeHeader` "Recurrentes" con subtítulo "Configuraciones programadas".
- Group con una fila por configuración: icono `repeat`, título `name`, subtítulo "{frecuencia} · próximo {nextRunAt en d MMM}", valor: `money(amount)` o `Tag acc` "Variable", y un `Switch` activo/inactivo a la derecha (llama a `PATCH .../active`).
- Tocar la fila → `recurring/[id]`.
- Botón ghost "Nuevo recurrente" → `movements/expense/new` en segmento Recurrente.

**Detalle de recurrente** (`recurring/[id]`)
- `TopBar` con nombre, atrás y "Editar".
- Bloque centrado: frecuencia (14 `muted`), monto 34/700 o "Variable", "Próximo: {fecha}".
- SectionHeader "Configuración": Group con "Cuenta", "Recordatorio" (ej. "Domingo 08:00 (día antes)"), "Estado" (`Tag ok` Activo / `Tag` Inactivo), "Activo" (switch).
- SectionHeader "Egresos generados": Group con egresos `RECURRING` de esta configuración (`GET /expenses?...` filtrado por `recurringConfigId` en cliente). Fila: icono `cart`, título "Egreso generado", subtítulo fecha de `occurrenceDate`, valor monto. Vacío → "Aún no se han generado egresos".
- Botón danger "Eliminar configuración" dentro de Group (margen superior 18).
- Pie de página (`hint`): "Eliminar la configuración no borra los egresos ya generados."

**Formulario de recurrente** (segmento "Recurrente" de `movements/expense/new`)
- `AmountInput` (oculto si "Monto variable" está activo).
- Group:
  - "Nombre" (máx. 80).
  - "Cuenta" (select).
  - "Frecuencia" (segmentado **Semanal** | **Mensual** | **Anual**).
  - "Día": según frecuencia:
    - Semanal → select `Lunes … Domingo` (1–7).
    - Mensual → select `1 … 31`.
    - Anual → select de mes (`Enero … Diciembre`) y, opcional, "Día del mes" (1–31). Si no se elige día, la API usa el día 1.
  - "Monto variable" (switch, default off).
  - "Fecha de inicio" (date picker, por defecto hoy).
  - "Fecha de fin" (date picker, opcional, con botón "Quitar").
- SectionHeader "Recordatorio": Group con "Avisar" (switch, default on), "Momento" (select `Mismo día` | `1 día antes`), "Hora" (select 00:00–23:00).
- Botón primario "Guardar recurrencia" → `POST /recurring-expenses`.

**Pantalla Definir monto** (`recurring/define-amount`)
- `TopBar` "Definir monto" con atrás.
- `LargeHeader` "Montos pendientes" con subtítulo "Fija el monto solo de estas ocurrencias. La configuración no cambia."
- Group con una fila por egreso pendiente (`GET /expenses?amountPending=true`): icono `repeat`, título `name`, subtítulo "{cuenta} · {fecha}", y a la derecha un campo numérico de 100 de ancho con fondo `fill`, radio 10, texto 15 alineado a la derecha, placeholder "$0.00".
- Botón primario "Guardar montos": envía `PATCH /expenses/:id/amount` por cada campo lleno (en paralelo). Éxito → toast "Monto guardado", invalidar listas. Errores por fila se muestran junto al campo.
- Vacío: `EmptyState` "No tienes montos pendientes".

**Reglas**
- `amount` es obligatorio si no es variable; **no enviarlo** si es variable.
- Validación: `dayOfWeek` 1–7, `dayOfMonth` 1–31, `monthOfYear` 1–12.
- `endDate ≥ startDate`.
- `reminderHour` obligatorio si el recordatorio está activo.
- Reactivar una configuración no genera egresos atrasados (lo maneja la API).

**Endpoints**
| Método | Ruta | Uso |
|---|---|---|
| POST | `/recurring-expenses` | crear |
| GET | `/recurring-expenses` | listado |
| GET | `/recurring-expenses/:id` | detalle |
| PATCH | `/recurring-expenses/:id` | editar |
| PATCH | `/recurring-expenses/:id/active` | body `{ isActive }` |
| DELETE | `/recurring-expenses/:id` | eliminar configuración |
| GET | `/expenses?amountPending=true` | pendientes de monto |
| PATCH | `/expenses/:id/amount` | body `{ amount }` |

**Commits**
```
feat(recurring): listado de recurrentes con interruptor de activo
feat(recurring): formulario con frecuencia, dia y recordatorio
feat(recurring): detalle con configuracion y egresos generados
feat(recurring): pantalla de definir monto para egresos variables
```

**Criterios de aceptación**
- [ ] Un recurrente variable no envía `amount` en el POST.
- [ ] Desactivar un recurrente cambia su estado sin borrar egresos.
- [ ] Definir el monto de un egreso variable lo quita de la lista de pendientes y del banner.

---

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
  - "Descripción" (máx. 255, opcional) — **solo en cobros y préstamos**.
  - Préstamos: "Cuenta" (select) — la cuenta de la que sale el dinero (F12).
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

### F12 — Préstamos

**Objetivo:** registrar dinero que prestas (genera un egreso al crear) y cobrar sus cuotas (cada una genera un ingreso).

**Rama:** `feature/12-loans` · **Depende de:** F11

**Reutiliza:** `ObligationScreen`, `ObligationRow`, `InstallmentRow`, `PayInstallmentSheet`, `reminderRules`.

**Diferencias respecto a cobros**
- **Formulario:** incluye "Cuenta" obligatoria (de donde sale el dinero). Al guardar se crea un egreso `LOAN_CREATION` en esa cuenta.
- **Detalle:** muestra "Cuenta de salida: {nombre}" en un `hint` debajo de las cuotas.
- **Pago de cuota:** el ingreso se registra en la cuenta **destino** elegida en la hoja (puede ser distinta).
- **Edición:** `accountId` y `totalAmount` son **inmutables**. Mostrar esos campos como solo lectura con `muted`. Con cuotas pagadas: solo `personName`, `description` y recordatorio.
- **Eliminar:** conserva el egreso de creación y los ingresos.

**Textos específicos**
- Confirmación al crear: toast "Préstamo registrado · egreso creado".
- Hoja de pago: título "Marcar cuota como pagada", cuenta destino "Cuenta destino".

**Endpoints**
| Método | Ruta | Uso |
|---|---|---|
| POST | `/loans` | body `{ accountId, personName, totalAmount, installmentsCount, description?, reminder* }` |
| GET | `/loans?status=` | listado |
| GET | `/loans/:id` | detalle con `installments` y `expenseId` |
| PATCH | `/loans/:id` | editar (campos permitidos según cuotas pagadas) |
| DELETE | `/loans/:id` | eliminar |
| POST | `/loans/:id/installments/:installmentId/pay` | body `{ accountId, name?, description? }` |

**Commits**
```
feat(loans): formulario de prestamo con cuenta de salida
feat(loans): detalle con cuenta de salida y campos inmutables
feat(loans): cobro de cuotas con ingreso en cuenta destino
```

**Criterios de aceptación**
- [ ] Crear un préstamo de $200 resta $200 de la cuenta elegida.
- [ ] Cobrar una cuota suma a la cuenta destino elegida, no necesariamente a la de salida.
- [ ] No se puede cambiar la cuenta ni el monto de un préstamo existente.

---

### F13 — Deudas

**Objetivo:** registrar lo que debes en cuotas y pagarlas (cada cuota genera un egreso).

**Rama:** `feature/13-debts` · **Depende de:** F11

**Reutiliza:** `ObligationScreen`, `ObligationRow`, `InstallmentRow`, `PayInstallmentSheet`, `reminderRules`.

**Diferencias respecto a cobros**
- **Formulario:** **no** tiene "Descripción" ni "Cuenta" (la API no los acepta). Campos: "Persona" (a quién le debes), "Monto", "Cuotas", recordatorio.
- **Creación:** no genera ningún movimiento.
- **Pago de cuota:** hoja con "Cuenta origen" (select). Genera un **egreso** `DEBT_PAYMENT` en esa cuenta.
- **Detalle:** sin descripción; el encabezado muestra "Deuda con {persona}".
- Confirmación al pagar: toast "Cuota pagada · egreso creado".

**Endpoints**
| Método | Ruta | Uso |
|---|---|---|
| POST | `/debts` | body `{ personName, totalAmount, installmentsCount, reminder* }` |
| GET | `/debts?status=` | listado |
| GET | `/debts/:id` | detalle con `installments` y `expenseId` por cuota |
| PATCH | `/debts/:id` | editar (con cuotas pagadas solo `personName` y recordatorio) |
| DELETE | `/debts/:id` | eliminar |
| POST | `/debts/:id/installments/:installmentId/pay` | body `{ accountId, name?, description? }` |

**Commits**
```
feat(debts): formulario de deuda sin descripcion ni cuenta
feat(debts): pago de cuota con egreso desde cuenta origen
```

**Criterios de aceptación**
- [ ] Crear una deuda no cambia ningún saldo.
- [ ] Pagar una cuota crea un egreso visible en Movimientos con origen "Deuda".
- [ ] El formulario no muestra "Descripción" ni "Cuenta".

---

### F14 — Listas de compras

**Objetivo:** crear listas con productos en tarjetas, marcarlos como comprados, calcular el total por precio individual o por total manual, y cerrar la lista generando un egreso.

**Rama:** `feature/14-shopping-lists` · **Depende de:** F06, F08

**Pantalla Listas** (`shopping/[tab]`)
- `LargeHeader` "Compras" con subtítulo "Listas y cierres" (cuando el tab es Abiertas) o el título "Listas cerradas" en el `TopBar`.
- Segmentado "Abiertas" | "Cerradas" (margen `6 0 16`).
- **Abiertas:** una `Card` (fondo `surface`, radio 20, padding 16, margen inferior 12) por lista:
  - Fila: nombre 17/600 a la izquierda; chevron `muted` a la derecha.
  - Texto 13 `muted`: "{comprados} de {total} comprados".
  - `ProgressBar` (margen superior 12).
  - Tocar → `shopping/[id]`.
  - Botón ghost "Nueva lista" → `shopping/new`.
- **Cerradas:** Group con filas: icono `cart`, nombre, subtítulo "{fecha} · {n} ítems · {cuenta}", valor = `total`. Tocar → detalle (solo lectura).

**Pantalla Nueva lista** (`shopping/new`)
- `TopBar` "Nueva lista" con atrás y "Crear" (tbtn).
- `LargeHeader` "Nueva lista".
- Group: "Nombre" (máx. 80) — placeholder "Ej. Compras de la semana".
- SectionHeader "Productos iniciales": Group con `textarea` (placeholder "Un producto por línea"). Cada línea se envía como un ítem `{ name }` (máx. 120).
- Botón primario "Crear lista" → `POST /shopping-lists` con `{ name, items }`.

**Detalle de lista abierta** (`shopping/[id]`)
- `TopBar` con nombre, atrás y "Editar" a la derecha → **renombrar** (hoja con un campo "Nombre" y botón "Guardar" → `PATCH /shopping-lists/:id`).
- `LargeHeader`: título = nombre, subtítulo `id="cnt"` = "{comprados} de {total} comprados" (se actualiza en vivo).
- **Group "Precios individuales":** fila con título "Precios individuales", subtítulo 13 `muted` "Suma cada precio y calcula el total", y `Switch` a la derecha. **Default: desactivado.**
- SectionHeader "Productos".
- **Entrada de producto (arriba de la lista de tarjetas):**
  - Fila con `TextField` "Agregar producto" (máx. 120) y botón `small` "Agregar" a la derecha. Enter también agrega.
  - Al agregar: `POST /shopping-lists/:id/items` con `{ name }`. Mientras responde, mostrar la tarjeta en estado "pendiente" (opacidad 0.6). Si falla, quitarla y mostrar toast con el error.
  - Vacío: el campo se limpia y el foco vuelve a él.

**Tarjetita de ítem** (componente `ItemCard`)
- Contenedor: fondo `surface`, radio **16**, padding `12 14`, margen inferior 8, `elevation 0`.
- Fila interna (alineación centro, gap 12):
  1. `Checkbox` 24 (toca → `PATCH .../check` con `isPurchased`; optimista).
  2. Bloque de texto: nombre 16/500 (si está comprado: tachado y color `muted`). Si el switch de precios está activo y el ítem tiene precio: subtítulo 13 `muted` con el precio formateado.
  3. Si el switch de precios está activo: **campo de precio** a la derecha (ancho 96, fondo `fill`, radio 10, padding `7 8`, texto 15 alineado a la derecha, placeholder "$0.00", teclado decimal). Se guarda al perder el foco con `PATCH .../items/:itemId` con `{ price }` (debounce 600 ms). Precio debe ser `> 0`; vacío no envía nada.
  4. Icono **editar** (`edit` 18, `accent-ink`, botón 30 × 30) → modo edición en la tarjeta.
  5. Icono **eliminar** (`trash` 18, `negative`, botón 30 × 30) → `DELETE .../items/:itemId` con confirmación `Alert`: "Se quitará «{nombre}» de la lista."
- **Modo edición:** la tarjeta muestra un `TextField` con el nombre y dos botones `small`: "Cancelar" (ghost) y "Guardar" (primario). Guardar → `PATCH .../items/:itemId` con `{ name }`.
- Ítems y precios no se pueden editar cuando la lista está cerrada.
- Lista vacía: `EmptyState` "Aún no hay productos" con texto "Agrega el primero arriba."

**Sección Total de la compra**
- SectionHeader "Total de la compra" y Group con una fila: etiqueta "Total" (16) y campo de total a la derecha (18/600, alineado a la derecha).
- **Con precios individuales activos:** el campo es de solo lectura, texto `muted` (estado "bloqueado"). Su valor = suma de los precios de los ítems **marcados como comprados** (ver sección 6).
- **Con precios individuales desactivados:** el campo es editable (teclado decimal). Valor manual.
- Nota (`Note`) bajo el grupo, cambia según el estado:
  - Activo: "El total se calcula sumando los precios de cada producto."
  - Desactivado: "Escribe el total de la compra. Activa precios individuales para calcularlo."

**Botón "Cerrar lista"** (primario, margen superior 16) → hoja.

**Hoja "Cerrar lista"**
- Título "Cerrar lista" (sh-t), subtítulo "Se registrará un egreso por el total de la compra".
- `AmountInput` no editable con el total actual.
- Group: "Cuenta de pago" (select).
- `Note`: "Los productos no comprados pasan a una nueva lista abierta."
- Botón primario "Cerrar y registrar egreso" → `POST /shopping-lists/:id/close`.

**Reglas de cierre (cumplir la regla XOR de la API)**
- Debe haber **al menos un** ítem comprado. Si no: mensaje "Marca al menos un producto como comprado".
- **Modo precios individuales activo:**
  - Todos los comprados deben tener precio `> 0`. Si falta: "Falta el precio de «{nombre}»" y resaltar el campo.
  - Body: `purchasedItems: [{ id, price }]` (solo comprados) y **sin** `total`.
- **Modo precios individuales desactivado:**
  - `total` obligatorio y `> 0`. Si no: "Escribe el total de la compra".
  - Body: `purchasedItems: [{ id }]` (solo comprados) y `total`.
- `notPurchasedItems: [{ id }]` con todos los no comprados.
- La API exige que `purchasedItems` + `notPurchasedItems` cubran todos los ítems activos: enviar siempre el estado completo.
- Éxito (200) → cerrar hoja, toast "Lista cerrada · egreso creado". Si `newList` no es `null`, toast adicional: "Se creó una lista con {n} pendientes". Volver a Listas.

**Lista cerrada** (`shopping/[id]` con estado CLOSED)
- Bloque centrado: fecha de cierre (14 `muted`), total 34/700, "{n} ítems · {cuenta}".
- `Note`: "Lista cerrada e inmutable. Se registró un egreso por el total desde {cuenta}."
- Sin switch, sin entrada de productos, sin botón cerrar. Los ítems comprados se muestran como lista de solo lectura (opcional según respuesta de la API).

**Eliminar lista** (solo abierta): botón danger en Group al final: `DELETE /shopping-lists/:id`, confirmación.

**Endpoints**
| Método | Ruta | Uso |
|---|---|---|
| POST | `/shopping-lists` | body `{ name, items?: [{ name }] }` |
| GET | `/shopping-lists?status=OPEN\|CLOSED` | listado con `items` |
| GET | `/shopping-lists/:id` | detalle |
| PATCH | `/shopping-lists/:id` | renombrar `{ name }` (solo abierta) |
| DELETE | `/shopping-lists/:id` | eliminar |
| POST | `/shopping-lists/:id/items` | agregar `{ name }` |
| PATCH | `/shopping-lists/:id/items/:itemId` | `{ name? , price? }` (price > 0) |
| PATCH | `/shopping-lists/:id/items/:itemId/check` | `{ isPurchased }` |
| DELETE | `/shopping-lists/:id/items/:itemId` | eliminar ítem (solo abierta) |
| POST | `/shopping-lists/:id/close` | body `{ accountId, purchasedItems, notPurchasedItems?, total? }` |

**Commits**
```
feat(shopping): listas abiertas y cerradas con tarjetas de progreso
feat(shopping): crear lista con productos iniciales
feat(shopping): agregar productos con campo y boton y tarjetas de item
feat(shopping): editar y eliminar productos en tarjetas
feat(shopping): precios individuales con total calculado y total manual
feat(shopping): cerrar lista con regla de precio o total y nueva lista automatica
feat(shopping): renombrar y eliminar listas abiertas
```

**Criterios de aceptación**
- [ ] Agregar un producto con el botón lo muestra como tarjeta debajo del campo.
- [ ] Con precios individuales activos, el total se bloquea y suma solo los comprados.
- [ ] Con el switch desactivado, el total se escribe a mano y se envía como `total`.
- [ ] Cerrar con un comprado sin precio muestra el error y no llama a la API.
- [ ] Tras cerrar, los no comprados aparecen en una nueva lista abierta.
- [ ] Una lista cerrada no permite agregar, editar, eliminar ni cambiar precios.

---

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

### F16 — Calidad, errores y release

**Objetivo:** estabilizar la app: manejo uniforme de errores, pruebas, accesibilidad y builds de distribución.

**Rama:** `feature/16-hardening-release` · **Depende de:** todas

**Manejo de errores**
| Código | Respuesta de la app |
|---|---|
| 400 | campos: marcar el campo con `errors`; general: `Toast` con `message` |
| 401 | refresh automático (F03); si falla → Login |
| 404 | `EmptyState` "No encontrado" con botón atrás |
| 409 | `Toast` con `message` de la API |
| 423 | pantalla de bloqueo de cuenta (F03) |
| 429 | `Toast` "Demasiadas solicitudes. Intenta en un momento." y, en login, pantalla de bloqueo IP |
| 5xx / red | `Banner` "Sin conexión" + botón "Reintentar" |

**Invalidación de caché (TanStack Query)**
| Mutación | Invalidar |
|---|---|
| Cuenta creada/editada/eliminada | `accounts`, `home`, `movements` |
| Ingreso/egreso | `incomes`, `expenses`, `accounts`, `home` |
| Pago de tarjeta | `cards`, `accounts`, `expenses`, `home` |
| Pago de cuota (cobro, préstamo, deuda) | `collections`/`loans`/`debts`, `accounts`, `incomes`, `expenses`, `home`, `manage` |
| Lista cerrada | `shopping`, `expenses`, `accounts`, `home` |
| Recurrente | `recurring`, `expenses`, `home` |

**Pruebas**
- Unitarias: `formatMoney`, `formatPeriod`, reglas de recordatorio, cálculo de totales de lista (precio y XOR), cálculo de cuotas pendientes (Jest + `jest-expo`).
- Componentes: `Switch`, `ItemCard` (modos normal y edición), `Segmented` (Testing Library).
- Flujo manual en checklist: cada pantalla comparada con el prototipo en claro y oscuro.

**Accesibilidad y rendimiento**
- `FlatList` con `keyExtractor` estable; `getItemLayout` en listas largas de movimientos.
- Imágenes no se usan; los iconos son SVG.
- Revisión con TalkBack: todos los botones con etiqueta.
- Medir tiempos de arranque en un Android de gama media.

**Build y release**
- `eas.json` con perfiles `development` (APK con dev client), `preview` (APK interno) y `production` (AAB para Play Store).
- Versionado: `version` en `app.config.ts` y `android.versionCode` autoincremental con EAS.
- Variables de entorno por perfil (`EXPO_PUBLIC_API_URL` de staging y producción).
- Publicar en Play Store (track interno primero).

**Dependencias:** `jest-expo`, `jest`, `@testing-library/react-native`, `husky`, `@commitlint/cli`, `@commitlint/config-conventional`.

**Commits**
```
test(ui): pruebas de formato, reglas de recordatorio y totales de lista
test(ui): pruebas de componentes switch, item card y segmented
fix(api): mensajes de error uniformes y reintento ante fallas de red
perf(lists): getItemLayout y keyExtractor en listas de movimientos
chore(release): perfiles de eas build y versionado automatico
chore(tooling): commitlint y husky para validar mensajes de commit
```

**Criterios de aceptación**
- [ ] `pnpm test` pasa sin errores.
- [ ] Ninguna pantalla muestra JSON crudo ni mensajes técnicos al usuario.
- [ ] El AAB de producción se genera y se instala en un Android físico.

---

## 6. Diferencias entre el prototipo y la API (ajustes aplicados)

Estas decisiones adaptan el prototipo a lo que realmente soporta el backend. La apariencia visual no cambia.

| # | Prototipo | Especificación | Motivo |
|---|---|---|---|
| 1 | Total de la lista = suma de **todos** los precios | Total = suma de precios de los ítems **comprados** | `purchasedItems` es el único conjunto que se cobra; un precio en un no comprado inflaría el total |
| 2 | Lista de compras: entrada de producto al final | Entrada **arriba** de las tarjetas de ítems | Así lo pediste: campo + botón, y las tarjetas aparecen debajo |
| 3 | Ítems como filas simples | Ítems como **tarjetitas** con editar y eliminar | Así lo pediste |
| 4 | Formulario de deuda con descripción | **Sin** descripción en deudas | `POST /debts` no acepta `description` |
| 5 | Diferido sin cuenta | Diferido **con** cuenta obligatoria | `accountId` es requerido en todos los egresos |
| 6 | Pantalla de "Cuentas" en la barra | "Cuentas" y "Tarjetas" en **Más**; "Gestión" en la barra | Ajuste solicitado en la revisión anterior |
| 7 | Recordatorio de tarjeta: solo antelación | Antelación (0–30) **y** hora (0–23) | `reminderHour` existe en la API |
| 8 | Filtro "Recurrentes" en la lista | Filtrado en cliente | La API no filtra por `sourceType` en egresos |
| 9 | Hora fija de recordatorios | Hora seleccionable | Los recordatorios tienen hora configurable |
| 10 | Contador de bloqueo fijo | Contador con `retryAfterMinutes` real | Lo devuelve la API en 423 y 429 |
| 11 | Botón "Eliminar movimiento" siempre visible | Visible solo si la API lo permite | Reglas de borrado por `sourceType` |
| 12 | Cuotas con botón sin estado de carga | Botón con estado de carga y bloqueo doble | Evita doble pago de la misma cuota |

---

## 7. Criterios de aceptación globales (checklist de release)

- [ ] Todas las pantallas del prototipo existen y coinciden visualmente en claro y oscuro.
- [ ] Todas las rutas de la API usadas en la sección 5 están cubiertas.
- [ ] Ningún campo se envía fuera del DTO documentado (`forbidNonWhitelisted`).
- [ ] Ningún `userId` se envía en el body.
- [ ] Tokens solo en `expo-secure-store`.
- [ ] Notificaciones push funcionan en el build de desarrollo (F04).
- [ ] Ramas y commits siguen la sección 4 en todas las features.
- [ ] `pnpm test` y `pnpm lint` pasan en `develop`.
