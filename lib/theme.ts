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

export const gradients = {
  primaryToSecondary: ['#00FF88', '#00A3FF'] as const,
  primaryFade: ['#00FF8830', '#00FF8800'] as const,
  secondaryFade: ['#00A3FF30', '#00A3FF00'] as const,
  cardAccent: ['#00FF88', '#00C9FF', '#00A3FF'] as const,
  darkFade: ['#1A1A1A', '#0A0A0A'] as const,
  heroBg: ['#0A0A0A', '#0F1A14', '#0A0A0A'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 24,
  xxl: 32,
  hero: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};
