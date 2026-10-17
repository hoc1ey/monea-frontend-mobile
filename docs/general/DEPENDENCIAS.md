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

