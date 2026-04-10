import { Platform } from 'react-native';

// ==================== COLORS ====================

export const colors = {
  background: '#0A0A0A',
  surface: '#1A1A1A',
  surfaceLight: '#252525',
  border: '#333333',
  primary: '#00FF88',       // Neon green — performance
  secondary: '#00A3FF',     // Electric blue — data
  text: '#FFFFFF',
  textSecondary: '#888888',
  textMuted: '#555555',
  danger: '#FF4444',
  warning: '#FFB800',
  success: '#00FF88',
};

export const accentColors = {
  green: '#00FF88',
  blue: '#00A3FF',
  purple: '#9B59B6',
  amber: '#FFB800',
  orange: '#FF8C00',
  red: '#E74C3C',
  teal: '#27AE60',
  brown: '#8B4526',
  darkGreen: '#00AA00',
  pink: '#FF6B9D',
  cyan: '#00D4FF',
  gold: '#FFD700',
};

// ==================== GRADIENTS ====================

export const gradients = {
  primaryToSecondary: ['#00FF88', '#00A3FF'] as const,
  primaryFade: ['#00FF8830', '#00FF8800'] as const,
  secondaryFade: ['#00A3FF30', '#00A3FF00'] as const,
  cardAccent: ['#00FF88', '#00C9FF', '#00A3FF'] as const,
  darkFade: ['#1A1A1A', '#0A0A0A'] as const,
  heroBg: ['#0A0A0A', '#0F1A14', '#0A0A0A'] as const,
};

// ==================== SPACING ====================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ==================== TYPOGRAPHY ====================

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 24,
  xxl: 32,
  hero: 48,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};

// Font size multipliers for user preference
export const fontSizeScale = {
  small: 0.85,
  medium: 1,
  large: 1.2,
};

// ==================== BORDER RADIUS ====================

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

// ==================== SHADOWS ====================

export const shadows = {
  sm: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
    android: { elevation: 2 },
    default: {},
  }),
  md: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
    android: { elevation: 6 },
    default: {},
  }),
  lg: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 },
    android: { elevation: 12 },
    default: {},
  }),
  glow: (color: string) => Platform.select({
    ios: { shadowColor: color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 },
    android: { elevation: 8 },
    default: {},
  }),
};

// ==================== ANIMATION ====================

export const animation = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  stagger: 60,
  spring: {
    speed: 50,
    bounciness: 4,
  },
  springBouncy: {
    speed: 50,
    bounciness: 12,
  },
};
