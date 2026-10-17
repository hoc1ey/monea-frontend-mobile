import type { ComponentType } from 'react';

/**
 * Shape shared by the `lucide-react-native` icons used across the design system.
 */
export type IconComponent = ComponentType<{
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  absoluteStrokeWidth?: boolean;
}>;

export type TagVariant = 'default' | 'ok' | 'acc' | 'neg';
