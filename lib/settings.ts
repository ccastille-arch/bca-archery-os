import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserSettings {
  accentColor: string;
  fontSizeScale: 'small' | 'medium' | 'large';
  distanceUnit: 'yards' | 'meters';
  onboardingComplete: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  accentColor: '#00FF88',
  fontSizeScale: 'medium',
  distanceUnit: 'yards',
  onboardingComplete: false,
};

async function getUserId(): Promise<string> {
  const raw = await AsyncStorage.getItem('@bca_auth_session');
  if (raw) {
    const user = JSON.parse(raw);
    return user.id || 'default';
  }
  return 'default';
}

export async function getUserSettings(): Promise<UserSettings> {
  const uid = await getUserId();
  const raw = await AsyncStorage.getItem(`@bca_${uid}_settings`);
  if (raw) {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  }
  return DEFAULT_SETTINGS;
}

export async function saveUserSettings(settings: Partial<UserSettings>): Promise<void> {
  const uid = await getUserId();
  const current = await getUserSettings();
  const updated = { ...current, ...settings };
  await AsyncStorage.setItem(`@bca_${uid}_settings`, JSON.stringify(updated));
}

export async function getOnboardingComplete(): Promise<boolean> {
  const settings = await getUserSettings();
  return settings.onboardingComplete;
}

export async function setOnboardingComplete(): Promise<void> {
  await saveUserSettings({ onboardingComplete: true });
}
