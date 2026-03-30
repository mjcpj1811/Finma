import { Platform } from 'react-native';

/**
 * Base URL includes context path /finma
 * Android emulator: 10.0.2.2 maps to host localhost
 * Physical device: set EXPO_PUBLIC_API_BASE=http://YOUR_LAN_IP:8080/finma
 */
export function getApiBase(): string {
  const env = process.env.EXPO_PUBLIC_API_BASE;
  if (env && env.length > 0) return env.replace(/\/$/, '');
  if (Platform.OS === 'android') return 'http://10.0.2.2:8080/finma';
  return 'http://localhost:8080/finma';
}
