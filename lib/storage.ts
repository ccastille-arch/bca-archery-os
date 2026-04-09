import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ShotEnd, SightProfile, Session, BowConfig, ArrowConfig, StabilizerTest, TuneLog, Tournament } from './types';

const KEYS = {
  SHOTS: '@bca_shots',
  SIGHTS: '@bca_sights',
  SESSIONS: '@bca_sessions',
  BOWS: '@bca_bows',
  ARROWS: '@bca_arrows',
  STAB_TESTS: '@bca_stab_tests',
  TUNE_LOGS: '@bca_tune_logs',
  TOURNAMENTS: '@bca_tournaments',
};

// Generic helpers
async function getAll<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

async function saveAll<T>(key: string, items: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

async function saveOne<T extends { id: string }>(key: string, item: T, getter: () => Promise<T[]>): Promise<void> {
  const items = await getter();
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    items[idx] = item;
  } else {
    items.unshift(item);
  }
  await saveAll(key, items);
}

async function deleteOne<T extends { id: string }>(key: string, id: string, getter: () => Promise<T[]>): Promise<void> {
  const items = await getter();
  await saveAll(key, items.filter((i) => i.id !== id));
}

// Shot Ends
export const getShots = (): Promise<ShotEnd[]> => getAll<ShotEnd>(KEYS.SHOTS);
export const saveShot = (shot: ShotEnd) => saveOne(KEYS.SHOTS, shot, getShots);
export const deleteShot = (id: string) => deleteOne<ShotEnd>(KEYS.SHOTS, id, getShots);

// Sight Profiles
export const getSightProfiles = (): Promise<SightProfile[]> => getAll<SightProfile>(KEYS.SIGHTS);
export const saveSightProfile = (p: SightProfile) => saveOne(KEYS.SIGHTS, p, getSightProfiles);
export const deleteSightProfile = (id: string) => deleteOne<SightProfile>(KEYS.SIGHTS, id, getSightProfiles);

// Sessions
export const getSessions = (): Promise<Session[]> => getAll<Session>(KEYS.SESSIONS);
export const saveSession = (s: Session) => saveOne(KEYS.SESSIONS, s, getSessions);
export const deleteSession = (id: string) => deleteOne<Session>(KEYS.SESSIONS, id, getSessions);

// Bow Configs
export const getBowConfigs = (): Promise<BowConfig[]> => getAll<BowConfig>(KEYS.BOWS);
export const saveBowConfig = (b: BowConfig) => saveOne(KEYS.BOWS, b, getBowConfigs);
export const deleteBowConfig = (id: string) => deleteOne<BowConfig>(KEYS.BOWS, id, getBowConfigs);

// Arrow Configs
export const getArrowConfigs = (): Promise<ArrowConfig[]> => getAll<ArrowConfig>(KEYS.ARROWS);
export const saveArrowConfig = (a: ArrowConfig) => saveOne(KEYS.ARROWS, a, getArrowConfigs);
export const deleteArrowConfig = (id: string) => deleteOne<ArrowConfig>(KEYS.ARROWS, id, getArrowConfigs);

// Stabilizer Tests
export const getStabilizerTests = (): Promise<StabilizerTest[]> => getAll<StabilizerTest>(KEYS.STAB_TESTS);
export const saveStabilizerTest = (t: StabilizerTest) => saveOne(KEYS.STAB_TESTS, t, getStabilizerTests);
export const deleteStabilizerTest = (id: string) => deleteOne<StabilizerTest>(KEYS.STAB_TESTS, id, getStabilizerTests);

// Tune Logs
export const getTuneLogs = (): Promise<TuneLog[]> => getAll<TuneLog>(KEYS.TUNE_LOGS);
export const saveTuneLog = (t: TuneLog) => saveOne(KEYS.TUNE_LOGS, t, getTuneLogs);
export const deleteTuneLog = (id: string) => deleteOne<TuneLog>(KEYS.TUNE_LOGS, id, getTuneLogs);

// Tournaments
export const getTournaments = (): Promise<Tournament[]> => getAll<Tournament>(KEYS.TOURNAMENTS);
export const saveTournament = (t: Tournament) => saveOne(KEYS.TOURNAMENTS, t, getTournaments);
export const deleteTournament = (id: string) => deleteOne<Tournament>(KEYS.TOURNAMENTS, id, getTournaments);
