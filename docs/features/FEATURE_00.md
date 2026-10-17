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
