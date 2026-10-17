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
