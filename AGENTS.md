# MONEA — Mobile app (Expo + React Native)

Expo/React Native app for MONEA (personal finance). **Android only** (the backend only accepts `DevicePlatform = ANDROID`). The UI must match the approved prototype.

## Sources of truth (read before coding)

- `docs/general/CONVENCIONES.md` — code/naming conventions, design tokens, API-consumption rules.
- `docs/general/DEPENDENCIAS.md` — approved dependencies per feature.
- `docs/general/CONTROL_VERSIONES.md` — branch model and commit conventions.
- `docs/general/CRITERIOS_ACEPTACIÓN.md` — release checklist (note the accent in the filename).
- `docs/general/DIFERENCIAS_PROTOTIPO.md` — intentional deviations from the prototype; where the API differs from the prototype, the API wins.
- `docs/features/FEATURE_XX.md` — spec of the feature you are implementing: exact UI, routes, endpoints and commit messages.
- `docs/prototipo-aprobado/monea-prototipo-v2.html` — visual reference; match it.

One feature per branch/PR, following its acceptance criteria and the exact commit messages.

`CONVENCIONES.md`'s folder diagram shows routes under a root `app/`; in this repo routes actually live in `src/app/` and the NativeWind entry is `src/global.css`. Trust the code. `src/components/domain/` and `src/features/` are planned but do not exist yet.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json` (currently **SDK 57**).
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v57.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Tooling

This project uses **pnpm** (see `pnpm-lock.yaml`, and `.npmrc` with `node-linker=hoisted`). Do not use npm/yarn/bun for installs.

```bash
pnpm exec expo install <package>  # ALWAYS use instead of pnpm add — resolves SDK-compatible versions
pnpm start                        # start the dev server (also regenerates .expo/types)
pnpm lint                         # expo lint (flat config in eslint.config.js)
pnpm exec tsc --noEmit            # typecheck
pnpm exec expo-doctor             # diagnose dependency and config issues
pnpm exec expo install --fix      # fix incompatible package versions
```

Run `pnpm lint` and `pnpm exec tsc --noEmit` before declaring any task done. There is no test runner configured yet (F16 adds jest); the `pnpm test` in CRITERIOS does not exist yet.

## Tech stack

- Expo SDK 57, React Native 0.86, React 19, TypeScript (strict), React Compiler enabled (`experiments.reactCompiler` in `app.config.ts`).
- Expo Router (file-based routing) with `src/app` as the routes root.
- NativeWind v4 (Tailwind) + a theme-token layer.
- Zustand for UI/session state, TanStack Query for server state, axios API client.
- `@gorhom/bottom-sheet` for sheets, `react-native-reanimated` for animation, `lucide-react-native` for icons.
- Path aliases: `@/*` → `src/*`, `@/assets/*` → `assets/*` (see `tsconfig.json`).

## Structure

- `src/app/` — Expo Router routes only: screen files plus `_layout.tsx` navigators. Groups `(auth)` (splash, login, register, lock) and `(tabs)` (index, movements, manage, more); detail stubs in `accounts/`, `cards/`, `movements/`, `obligations/[type]/`, `shopping/`. Keep non-route code out of here.
- `src/components/ui/` — design-system components. Read the barrel `src/components/ui/index.ts` before building new UI and reuse what exists (`Button`, `Row`, `Group`, `Sheet`, `Segmented`, `Chips`, `Field`, `Select`, `Switch`, `Stepper`, `Hero`, `CreditCardVisual`, `MiniAccountCard`, `Banner`, `Note`, `Tag`, `ProgressBar`, `EmptyState`, `Skeleton`, `TopBar`, `LargeHeader`, `SectionHeader`, `IconTile`, `ScreenContainer`, `ToastProvider`/`useToast`, ...).
- `src/components/navigation/` — `TabBar`, `Fab`, `QuickActionsSheet`.
- `src/theme/` — `tokens.ts` (`lightTheme`/`darkTheme` NativeWind `vars`, `appColors`, `palette`, `typography`, `radii`, `spacing`, `elevation`, `ICON_STROKE`) and hooks `useThemeColors()` / `useIsDark()`; import via `@/theme`.
- `src/stores/` — Zustand stores (`auth.ts`, `ui.ts`).
- `src/lib/` — pure helpers: `format.ts` (`formatMoney`, `formatDate`, `formatPeriod`), `color.ts` (`mixHexColor`, used for card gradients), `timezone.ts` (`detectTimezone`).
- `src/api/` — `client.ts` (axios + interceptors), `queryClient.ts`, `auth.ts`; `src/auth/` — `tokens.ts`, `session.ts`; `src/config/` — `env.ts`.

## Styling rules

- Never hardcode colors: read them from `useThemeColors()` (light/dark aware) and derive the rest from `src/theme/tokens.ts`. The root layout applies `vars(lightTheme | darkTheme)` so `--color-*` CSS variables resolve.
- Reuse design-system components before writing new UI, and follow the existing component style (typed props, `StyleSheet.create`, thin JSDoc on exported components).
- Format money and dates with `src/lib/format.ts`. Do not use `Intl` (Hermes) directly.
- Icons: `lucide-react-native`, stroke `ICON_STROKE` (1.8), sizes 18 (tile) / 20 (bar) / 22 (tab) / 26 (FAB).

## Navigation & routing

- Use **Expo Router** for all navigation. Import `Link`, `router` and `useLocalSearchParams` from `expo-router`.
- The legacy `Tabs` export from `expo-router` is deprecated in SDK 57. Import the JS tabs navigator from `expo-router/js-tabs` (and its `BottomTabBarProps` type) when customizing the tab bar — see `src/app/(tabs)/_layout.tsx`.
- `typedRoutes` is enabled in `app.config.ts`. New routes are only typed after `.expo/types/router.d.ts` is regenerated — run `pnpm start` once after adding route files, then typecheck.
- `expo-env.d.ts`, `.expo/` and generated `ios/`/`android/` are gitignored. Docs: https://docs.expo.dev/router/introduction.md

## API conventions

- Read `data` from the response envelope; `message` is user-facing and `errors` maps to field validation.
- Single client in `src/api/client.ts` with base URL `EXPO_PUBLIC_API_URL`; `/health` has no `/api/v1` prefix.
- `Bearer` goes on every request except `/auth/{login,register,refresh}` and `/health`.
- **Never send `userId` or undocumented fields** — `forbidNonWhitelisted` rejects the request with 400. Request types come from the documented DTOs.
- 401 → single-flight `POST /auth/refresh`, retried once; on failure tokens are cleared, the query cache purged and the router sent to `/login`.
- 404 means "does not exist" (never render "no permission").
- Money: API returns max 2 decimals; round after each sum in the UI, never accumulate floats.
- Dates: `scheduledAt`/`dueDate`/`date`/`paidAt` are ISO UTC → render in the user timezone (`profile.timezone`) with `date-fns-tz`; calendar dates (`cutoffDate`, `startDate`, `endDate`) are `YYYY-MM-DD` and shown as-is; periods `YYYY-MM` via `formatPeriod`.
- Idempotency: paying an already-paid installment → 400; an already-paid card period → 409. Disable the button while the mutation is in flight.

## Auth & session (F03)

- Tokens live only in `expo-secure-store` via `src/auth/tokens.ts` (keys `monea.access`, `monea.refresh`) with an in-memory cache the HTTP layer reads synchronously (`loadTokens()` must run at bootstrap before requests). Never put tokens in AsyncStorage or Zustand.
- `src/api/client.ts` runs the single-flight refresh described above using a bare `refreshClient` so a failing refresh cannot loop.
- The shared TanStack `QueryClient` is `src/api/queryClient.ts`; import it instead of creating new clients so logout can purge the cache.
- Route gating is in the root `src/app/_layout.tsx` with `Stack.Protected` driven by `useAuthStore().status` (`loading | authenticated | unauthenticated`). `(auth)` is the unauthenticated stack with `splash` as its `initialRouteName` (`unstable_settings` in `(auth)/_layout.tsx`); session bootstrap lives in `(auth)/splash.tsx`.
- Auth forms use `react-hook-form` + `zodResolver` from `@hookform/resolvers/zod`; `Field` takes an `error` prop that renders 13/`negative` text under the field.
- `src/config/env.ts` exports nullable `env` and `envError`; the root layout renders `ConfigError` when `EXPO_PUBLIC_API_URL` is missing/invalid. Requires a valid `EXPO_PUBLIC_API_URL` in `.env` (template: `.env.example`).

## Push notifications (F04)

- Remote push uses FCM and **does not work in Expo Go** (since SDK 53). F04 requires a development build (`expo-dev-client`) and a real `google-services.json`; without them only local notifications work.
- `google-services.json` is already in `.gitignore` — never commit it. Branch: `feature/04-notifications`. See `docs/features/FEATURE_04.md` for the full flow and exact commit messages.

## Git workflow

- Branch naming: `feature/NN-slug` (2-digit NN), `fix/NN-slug`, `release/vX.Y.Z`, `hotfix/...` (see `CONTROL_VERSIONES.md`).
- **Base-branch reality check:** `CONTROL_VERSIONES.md` says features branch from and merge to `develop`, but in the current history feature PRs (#1–#4) landed directly on `main`, and `develop` lags behind. Confirm the intended base with the user before branching.
- Commits use Conventional Commits in **Spanish**, imperative, lowercase, no trailing period (e.g. `feat(nav): tabs inferiores inicio, movimientos, gestion y mas`). Use the exact messages listed in each `FEATURE_XX.md`.
- `commitlint` + `husky` are planned in F16 and are not installed yet.
- Only commit or push when explicitly asked.

## Building with EAS

Use EAS to build, sign and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run the CLI as `pnpm exec eas <command>` or `pnpm dlx eas-cli <command>`. Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.config.ts` / `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `pnpm exec expo run:android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
