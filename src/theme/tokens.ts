import type { TextStyle } from 'react-native';

export const lightTheme = {
  '--color-bg': '#F2F2F7',
  '--color-surface': '#FFFFFF',
  '--color-surface-2': '#F7F7FA',
  '--color-text': '#1C1C1E',
  '--color-muted': '#8E8E93',
  '--color-separator': 'rgba(60, 60, 67, 0.14)',
  '--color-accent': '#EF13A1',
  '--color-accent-ink': '#E0068C',
  '--color-accent-soft': '#FEF1FB',
  '--color-on-accent': '#FFFFFF',
  '--color-positive': '#248A3D',
  '--color-negative': '#D70015',
  '--color-fill': 'rgba(120, 120, 128, 0.12)',
  '--color-glass': 'rgba(255, 255, 255, 0.58)',
  '--color-glass-line': 'rgba(255, 255, 255, 0.75)',
  '--color-hero-a': '#FE36C1',
  '--color-hero-b': '#AC086B',
  '--color-scrim': 'rgba(20, 0, 12, 0.32)',
} as const;

export const darkTheme = {
  '--color-bg': '#000000',
  '--color-surface': '#1C1C1E',
  '--color-surface-2': '#2C2C2E',
  '--color-text': '#FFFFFF',
  '--color-muted': '#98989F',
  '--color-separator': 'rgba(84, 84, 88, 0.65)',
  '--color-accent': '#FF64D4',
  '--color-accent-ink': '#FF9FE6',
  '--color-accent-soft': 'rgba(255, 100, 212, 0.14)',
  '--color-on-accent': '#1A0012',
  '--color-positive': '#30D158',
  '--color-negative': '#FF453A',
  '--color-fill': 'rgba(120, 120, 128, 0.3)',
  '--color-glass': 'rgba(44, 44, 48, 0.58)',
  '--color-glass-line': 'rgba(255, 255, 255, 0.12)',
  '--color-hero-a': '#E0068C',
  '--color-hero-b': '#580034',
  '--color-scrim': 'rgba(0, 0, 0, 0.55)',
} as const;

export const palette = {
  cerise: {
    50: '#fef1fb',
    100: '#fee5f8',
    200: '#ffcaf3',
    300: '#ff9fe6',
    400: '#ff64d4',
    500: '#fe36c1',
    600: '#ef13a1',
    700: '#e0068c',
    800: '#ac086b',
    900: '#8f0c5b',
    950: '#580034',
  },
} as const;

/**
 * Typography scale from the approved prototype (section 1.3 of CONVENCIONES).
 * Values are React Native `TextStyle` fragments so they can be spread directly.
 */
export const typography = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700', letterSpacing: -0.5 },
  barTitle: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: 0 },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400', letterSpacing: 0 },
  bodyMedium: { fontSize: 16, lineHeight: 22, fontWeight: '500', letterSpacing: 0 },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400', letterSpacing: 0 },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400', letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0 },
  sectionHeader: { fontSize: 13, lineHeight: 18, fontWeight: '400', letterSpacing: 0.4 },
  kicker: { fontSize: 14, lineHeight: 18, fontWeight: '400', letterSpacing: 0 },
  amountLarge: { fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -0.6 },
  hero: { fontSize: 38, lineHeight: 44, fontWeight: '700', letterSpacing: -0.8 },
  heroSm: { fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.6 },
  amountInput: { fontSize: 44, lineHeight: 48, fontWeight: '700', letterSpacing: -1 },
} satisfies Record<string, TextStyle>;

/** Corner radii (dp) from the approved prototype. */
export const radii = {
  card: 20,
  hero: 24,
  heroSm: 22,
  creditCard: 22,
  button: 16,
  field: 14,
  icon: 10,
  tabBar: 26,
  sheet: 28,
  miniCard: 20,
  banner: 18,
  note: 14,
  segmented: 10,
  segmentedInner: 8,
  checkbox: 12,
  pill: 999,
  fab: 18,
  listItem: 16,
  switchTrack: 31,
} as const;

/** Android `elevation` values from the approved prototype (iOS uses shadow). */
export const elevation = {
  flat: 0,
  segmented: 1,
  switch: 2,
  miniCard: 4,
  hero: 6,
  tabBar: 8,
  fab: 8,
} as const;

/** Page spacing scale (4 dp). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export interface ThemeColors {
  bg: string;
  surface: string;
  surface2: string;
  text: string;
  muted: string;
  separator: string;
  accent: string;
  accentInk: string;
  accentSoft: string;
  onAccent: string;
  positive: string;
  positiveSoft: string;
  negative: string;
  negativeSoft: string;
  fill: string;
  glass: string;
  glassLine: string;
  heroA: string;
  heroB: string;
  scrim: string;
  /** Text color used on top of hero / credit card gradients. */
  heroText: string;
  /** Decorative white overlays used by hero and credit card visuals. */
  overlayHero: string;
  overlayCardStrong: string;
  overlayCardSoft: string;
  /** Absolute white used by checkbox/switch controls. */
  white: string;
  /** Neutral shadow color for iOS elevation fallbacks. */
  shadow: string;
}

export const appColors: Record<'light' | 'dark', ThemeColors> = {
  light: {
    bg: lightTheme['--color-bg'],
    surface: lightTheme['--color-surface'],
    surface2: lightTheme['--color-surface-2'],
    text: lightTheme['--color-text'],
    muted: lightTheme['--color-muted'],
    separator: lightTheme['--color-separator'],
    accent: lightTheme['--color-accent'],
    accentInk: lightTheme['--color-accent-ink'],
    accentSoft: lightTheme['--color-accent-soft'],
    onAccent: lightTheme['--color-on-accent'],
    positive: lightTheme['--color-positive'],
    positiveSoft: 'rgba(36, 138, 61, 0.16)',
    negative: lightTheme['--color-negative'],
    negativeSoft: 'rgba(215, 0, 21, 0.14)',
    fill: lightTheme['--color-fill'],
    glass: lightTheme['--color-glass'],
    glassLine: lightTheme['--color-glass-line'],
    heroA: lightTheme['--color-hero-a'],
    heroB: lightTheme['--color-hero-b'],
    scrim: lightTheme['--color-scrim'],
    heroText: '#FFFFFF',
    overlayHero: 'rgba(255, 255, 255, 0.12)',
    overlayCardStrong: 'rgba(255, 255, 255, 0.14)',
    overlayCardSoft: 'rgba(255, 255, 255, 0.08)',
    white: '#FFFFFF',
    shadow: 'rgba(0, 0, 0, 0.25)',
  },
  dark: {
    bg: darkTheme['--color-bg'],
    surface: darkTheme['--color-surface'],
    surface2: darkTheme['--color-surface-2'],
    text: darkTheme['--color-text'],
    muted: darkTheme['--color-muted'],
    separator: darkTheme['--color-separator'],
    accent: darkTheme['--color-accent'],
    accentInk: darkTheme['--color-accent-ink'],
    accentSoft: darkTheme['--color-accent-soft'],
    onAccent: darkTheme['--color-on-accent'],
    positive: darkTheme['--color-positive'],
    positiveSoft: 'rgba(48, 209, 88, 0.16)',
    negative: darkTheme['--color-negative'],
    negativeSoft: 'rgba(255, 69, 58, 0.14)',
    fill: darkTheme['--color-fill'],
    glass: darkTheme['--color-glass'],
    glassLine: darkTheme['--color-glass-line'],
    heroA: darkTheme['--color-hero-a'],
    heroB: darkTheme['--color-hero-b'],
    scrim: darkTheme['--color-scrim'],
    heroText: '#FFFFFF',
    overlayHero: 'rgba(255, 255, 255, 0.12)',
    overlayCardStrong: 'rgba(255, 255, 255, 0.14)',
    overlayCardSoft: 'rgba(255, 255, 255, 0.08)',
    white: '#FFFFFF',
    shadow: 'rgba(0, 0, 0, 0.25)',
  },
};

/** Icon stroke width used across the app (prototype uses 1.8). */
export const ICON_STROKE = 1.8;
