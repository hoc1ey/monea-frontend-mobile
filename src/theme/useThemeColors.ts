import { useColorScheme } from 'nativewind';

import { appColors, type ThemeColors } from './tokens';

/**
 * Resolves the semantic color tokens for the current color scheme.
 * Components must never hardcode hex values; consume tokens through this hook.
 */
export function useThemeColors(): ThemeColors {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark' ? appColors.dark : appColors.light;
}

export function useIsDark(): boolean {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark';
}
