## 7. Criterios de aceptación globales (checklist de release)

- [ ] Todas las pantallas del prototipo existen y coinciden visualmente en claro y oscuro.
- [ ] Todas las rutas de la API usadas en la sección 5 están cubiertas.
- [ ] Ningún campo se envía fuera del DTO documentado (`forbidNonWhitelisted`).
- [ ] Ningún `userId` se envía en el body.
- [ ] Tokens solo en `expo-secure-store`.
- [ ] Notificaciones push funcionan en el build de desarrollo (F04).
- [ ] Ramas y commits siguen la sección 4 en todas las features.
- [ ] `pnpm test` y `pnpm lint` pasan en `develop`.
