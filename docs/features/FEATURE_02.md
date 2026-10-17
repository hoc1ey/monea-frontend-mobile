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
