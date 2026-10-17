# MONEA — Mobile app (Expo + React Native)

Expo/React Native application for MONEA (personal finance). Prioritize mobile-first patterns, performance, and cross-platform compatibility. The product currently targets **Android only**.

## Sources of truth (read before coding)

- `docs/general/CONVENCIONES.md` — code, naming, git and commit conventions.
- `docs/general/DEPENDENCIAS.md` — approved dependencies and versions.
- `docs/general/CONTROL_VERSIONES.md` — branch model and feature/commit workflow.
- `docs/general/CRITERIOS_ACEPTACION.md` — definition of done.
- `docs/general/DIFERENCIAS_PROTOTIPO.md` — intentional deviations from the prototype.
- `docs/features/FEATURE_XX.md` — spec of the feature you are implementing (exact UI, routes, commit messages).
- `docs/prototipo-aprobado/monea-prototipo-v2.html` — visual reference of the approved prototype.

Features are implemented one branch/PR at a time. Before starting one, read its `FEATURE_XX.md` and follow its acceptance criteria and commit list.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json` (currently **SDK 57**).
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v57.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Tooling

This project uses **pnpm** (see `pnpm-lock.yaml`, and `.npmrc` with `node-linker=hoisted`). Do not use npm/yarn/bun for installs.

```bash
pnpm exec expo install <package>  # ALWAYS use instead of pnpm add — resolves SDK-compatible versions
pnpm start                        # start the dev server
pnpm lint                         # expo lint
pnpm exec tsc --noEmit            # typecheck
pnpm exec expo-doctor             # diagnose dependency and config issues
pnpm exec expo install --fix      # fix incompatible package versions
```

Run `pnpm lint` and `pnpm exec tsc --noEmit` before declaring any task done. There is no test runner configured yet.

## Tech stack

- Expo SDK 57, React Native 0.86, React 19, TypeScript (strict, `noUncheckedIndexedAccess` off by default here).
- Expo Router (file-based routing) with `src/app` as the routes root.
- NativeWind v4 (Tailwind) plus a theme-token layer.
- Zustand for UI state, TanStack Query for server state, axios API client.
- `@gorhom/bottom-sheet` for sheets, `react-native-reanimated` for animation, `lucide-react-native` for icons.
- Path alias `@/*` → `src/*`.

## Structure

- `src/app/` — Expo Router routes only: screen files plus `_layout.tsx` navigators. Route groups include `(tabs)` (tab shell) and `(auth)` (login). Keep non-route code out of here.
- `src/components/ui/` — design-system components. Read the barrel `src/components/ui/index.ts` before building new UI and reuse what exists (`Button`, `Row`, `Group`, `Sheet`, `Segmented`, `EmptyState`, `Note`, `TopBar`, `LargeHeader`, `IconTile`, `ScreenContainer`, ...).
- `src/components/navigation/` — custom tab bar, FAB and global quick-actions sheet.
- `src/theme/` — `tokens.ts` (colors, radii, spacing, typography, elevation) and hooks `useThemeColors()` / `useIsDark()`; import via `@/theme`.
- `src/stores/` — Zustand stores.
- `src/lib/` — pure helpers (e.g. `format.ts` money/date formatting).
- `src/api/` — axios client; `src/config/` — validated env.

## Styling rules

- Never hardcode colors: read them from `useThemeColors()` (light/dark aware) and derive the rest from `src/theme/tokens.ts`.
- Reuse design-system components before writing new UI, and follow the existing component style (typed props, `StyleSheet.create`, thin JSDoc on exported components).
- Format money and dates with `src/lib/format.ts` (`formatMoney`, `formatDate`, `formatPeriod`). Do not use `Intl` directly.

## Navigation & routing

- Use **Expo Router** for all navigation. Import `Link`, `router` and `useLocalSearchParams` from `expo-router`.
- The legacy `Tabs` export from `expo-router` is deprecated in SDK 57. Import the JS tabs navigator from `expo-router/js-tabs` (and its `BottomTabBarProps` type) when customizing the tab bar.
- `typedRoutes` is enabled in `app.config.ts`. New routes are only typed after `.expo/types/router.d.ts` is regenerated — run `pnpm start` once after adding route files, then typecheck.
- Docs: https://docs.expo.dev/router/introduction.md

## Git workflow

- Work on a `feature/NN-slug` branch, based on `main` (see `CONTROL_VERSIONES.md`).
- Commits use Conventional Commits in **Spanish**, imperative, lowercase, no trailing period (e.g. `feat(nav): tabs inferiores inicio, movimientos, gestion y mas`). Use the exact messages listed in each `FEATURE_XX.md`.
- Only commit or push when explicitly asked.

## Building with EAS

Use EAS to build, sign and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run the CLI as `pnpm exec eas <command>` or `pnpm dlx eas-cli <command>`. Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.config.ts` / `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `pnpm exec expo run:android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
