const poppins = {
  bold: 'BeVietnamPro_700Bold',
  semibold: 'BeVietnamPro_600SemiBold',
  medium: 'BeVietnamPro_500Medium',
  regular: 'BeVietnamPro_400Regular',
  light: 'BeVietnamPro_300Light',
  thin: 'BeVietnamPro_100Thin',
} as const;

export const typography = {
  poppins,
  // Backward compatibility for older code paths still using typography.font.
  font: poppins,
} as const;
