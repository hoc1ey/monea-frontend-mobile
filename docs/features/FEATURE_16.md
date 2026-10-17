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
