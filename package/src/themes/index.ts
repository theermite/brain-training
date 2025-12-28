/**
 * Theme system for Brain Training exercises
 * Provides predefined themes: default, ermite, shinkofa, esport
 * @author Jay "The Ermite" Goncalves
 * @copyright Jay The Ermite
 */

import { Theme, ThemeVariant } from '../types'

// ============================================================================
// DEFAULT THEME
// ============================================================================

export const defaultTheme: Theme = {
  variant: 'default',
  colors: {
    primary: 'bg-blue-500',
    primaryHover: 'hover:bg-blue-600',
    accent: 'bg-cyan-500',
    accentHover: 'hover:bg-cyan-600',
    background: 'bg-slate-900',
    backgroundSecondary: 'bg-slate-800',
    card: 'bg-slate-700',
    cardHover: 'hover:bg-slate-600',
    text: 'text-white',
    textSecondary: 'text-gray-300',
    border: 'border-slate-600',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  },
  borderRadius: 'lg',
  shadows: 'md',
}

// ============================================================================
// THE ERMITE THEME - Dark, mysterious, amber accents
// ============================================================================

export const ermiteTheme: Theme = {
  variant: 'ermite',
  colors: {
    primary: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-700',
    accent: 'bg-amber-500',
    accentHover: 'hover:bg-amber-600',
    background: 'bg-slate-950',
    backgroundSecondary: 'bg-slate-900',
    card: 'bg-slate-800',
    cardHover: 'hover:bg-slate-700',
    text: 'text-gray-100',
    textSecondary: 'text-gray-400',
    border: 'border-slate-700',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
  },
  borderRadius: 'xl',
  fontFamily: 'font-mono',
  shadows: 'lg',
}

// ============================================================================
// SHINKOFA THEME - Natural, zen, earth tones
// ============================================================================

export const shinkofaTheme: Theme = {
  variant: 'shinkofa',
  colors: {
    primary: 'bg-teal-600',
    primaryHover: 'hover:bg-teal-700',
    accent: 'bg-orange-500',
    accentHover: 'hover:bg-orange-600',
    background: 'bg-stone-900',
    backgroundSecondary: 'bg-stone-800',
    card: 'bg-stone-700',
    cardHover: 'hover:bg-stone-600',
    text: 'text-stone-50',
    textSecondary: 'text-stone-300',
    border: 'border-stone-600',
    success: 'bg-teal-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
  },
  borderRadius: '2xl',
  shadows: 'md',
}

// ============================================================================
// ESPORT THEME - Gaming, vibrant, high contrast
// ============================================================================

export const esportTheme: Theme = {
  variant: 'esport',
  colors: {
    primary: 'bg-purple-600',
    primaryHover: 'hover:bg-purple-700',
    accent: 'bg-pink-500',
    accentHover: 'hover:bg-pink-600',
    background: 'bg-gray-900',
    backgroundSecondary: 'bg-gray-800',
    card: 'bg-gray-700',
    cardHover: 'hover:bg-gray-600',
    text: 'text-white',
    textSecondary: 'text-gray-300',
    border: 'border-gray-600',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  },
  borderRadius: 'lg',
  shadows: 'xl',
}

// ============================================================================
// THEME REGISTRY
// ============================================================================

export const themes: Record<ThemeVariant, Theme> = {
  default: defaultTheme,
  ermite: ermiteTheme,
  shinkofa: shinkofaTheme,
  esport: esportTheme,
}

/**
 * Get theme by variant name
 */
export function getTheme(variant: ThemeVariant): Theme {
  return themes[variant] || defaultTheme
}

/**
 * Resolve theme from variant name or custom theme object
 */
export function resolveTheme(theme?: ThemeVariant | Theme): Theme {
  if (!theme) return defaultTheme
  if (typeof theme === 'string') return getTheme(theme)
  return theme
}

// ============================================================================
// TAILWIND CLASS UTILITIES
// ============================================================================

/**
 * Get Tailwind classes for a theme
 */
export function getThemeClasses(theme: Theme) {
  return {
    // Backgrounds
    bgPrimary: theme.colors.primary,
    bgPrimaryHover: theme.colors.primaryHover,
    bgAccent: theme.colors.accent,
    bgAccentHover: theme.colors.accentHover,
    bgMain: theme.colors.background,
    bgSecondary: theme.colors.backgroundSecondary,
    bgCard: theme.colors.card,
    bgCardHover: theme.colors.cardHover,

    // Text
    textMain: theme.colors.text,
    textSecondary: theme.colors.textSecondary,

    // Border
    border: theme.colors.border,
    borderRadius: `rounded-${theme.borderRadius}`,

    // States
    bgSuccess: theme.colors.success,
    bgWarning: theme.colors.warning,
    bgError: theme.colors.error,

    // Shadows
    shadow: `shadow-${theme.shadows}`,

    // Font
    font: theme.fontFamily || '',
  }
}

/**
 * Combine theme classes with custom className
 */
export function mergeThemeClasses(themeClasses: string, customClasses?: string): string {
  if (!customClasses) return themeClasses
  return `${themeClasses} ${customClasses}`
}
