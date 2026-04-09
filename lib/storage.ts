import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ShotEnd, SightProfile, Session, BowConfig, ArrowConfig, StabilizerTest, TuneLog, Tournament, LocalForumPost, LocalForumReply, PracticeLog, Expense, LiveRound, FeedbackItem, SwapListing, ExpertApplication, AppUser, Invite } from './types';

// Per-user keys (namespaced by user ID)
const USER_KEYS = {
  SHOTS: 'shots',
  SIGHTS: 'sights',
  SESSIONS: 'sessions',
  BOWS: 'bows',
  ARROWS: 'arrows',
  STAB_TESTS: 'stab_tests',
  TUNE_LOGS: 'tune_logs',
  TOURNAMENTS: 'tournaments',
  LIVE_ROUNDS: 'live_rounds',
  PRACTICES: 'practices',
  EXPENSES: 'expenses',
  USER_PROFILE: 'user_profile',
};

// Global keys (shared across all users)
const GLOBAL_KEYS = {
  FEEDBACK: '@bca_feedback',
  SWAP_SHOP: '@bca_swap_shop',
  EXPERT_APPS: '@bca_expert_apps',
  AUTH_USERS: '@bca_auth_users',
  AUTH_SESSION: '@bca_auth_session',
  INVITES: '@bca_invites',
  FORUM_POSTS: '@bca_forum_posts',
  FORUM_REPLIES: '@bca_forum_replies',
};

// Get current user ID for namespacing
async function getUserId(): Promise<string> {
  const raw = await AsyncStorage.getItem(GLOBAL_GLOBAL_KEYS.AUTH_SESSION);
  if (raw) {
    const user = JSON.parse(raw);
    return user.id || 'default';
  }
  return 'default';
}

// Build a per-user storage key
async function userKey(base: string): Promise<string> {
  const uid = await getUserId();
  return `@bca_${uid}_${base}`;
}

// Generic helpers
async function getAll<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

async function saveAll<T>(key: string, items: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

// Per-user generic helpers
async function getUserAll<T>(base: string): Promise<T[]> {
  const key = await userKey(base);
  return getAll<T>(key);
}

async function saveUserAll<T>(base: string, items: T[]): Promise<void> {
  const key = await userKey(base);
  await saveAll(key, items);
}

async function saveUserOne<T extends { id: string }>(base: string, item: T, getter: () => Promise<T[]>): Promise<void> {
  const items = await getter();
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    items[idx] = item;
  } else {
    items.unshift(item);
  }
  await saveUserAll(base, items);
}

async function deleteUserOne<T extends { id: string }>(base: string, id: string, getter: () => Promise<T[]>): Promise<void> {
  const items = await getter();
  await saveUserAll(base, items.filter((i) => i.id !== id));
}

// Global-only save/delete helpers (for shared data like auth, feedback, etc.)
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

// ===== PER-USER DATA (each user has their own) =====

// Shot Ends
export const getShots = (): Promise<ShotEnd[]> => getUserAll<ShotEnd>(USER_KEYS.SHOTS);
export const saveShot = (shot: ShotEnd) => saveUserOne(USER_KEYS.SHOTS, shot, getShots);
export const deleteShot = (id: string) => deleteUserOne<ShotEnd>(USER_KEYS.SHOTS, id, getShots);

// Sight Profiles
export const getSightProfiles = (): Promise<SightProfile[]> => getUserAll<SightProfile>(USER_KEYS.SIGHTS);
export const saveSightProfile = (p: SightProfile) => saveUserOne(USER_KEYS.SIGHTS, p, getSightProfiles);
export const deleteSightProfile = (id: string) => deleteUserOne<SightProfile>(USER_KEYS.SIGHTS, id, getSightProfiles);

// Sessions
export const getSessions = (): Promise<Session[]> => getUserAll<Session>(USER_KEYS.SESSIONS);
export const saveSession = (s: Session) => saveUserOne(USER_KEYS.SESSIONS, s, getSessions);
export const deleteSession = (id: string) => deleteUserOne<Session>(USER_KEYS.SESSIONS, id, getSessions);

// Bow Configs
export const getBowConfigs = (): Promise<BowConfig[]> => getUserAll<BowConfig>(USER_KEYS.BOWS);
export const saveBowConfig = (b: BowConfig) => saveUserOne(USER_KEYS.BOWS, b, getBowConfigs);
export const deleteBowConfig = (id: string) => deleteUserOne<BowConfig>(USER_KEYS.BOWS, id, getBowConfigs);

// Arrow Configs
export const getArrowConfigs = (): Promise<ArrowConfig[]> => getUserAll<ArrowConfig>(USER_KEYS.ARROWS);
export const saveArrowConfig = (a: ArrowConfig) => saveUserOne(USER_KEYS.ARROWS, a, getArrowConfigs);
export const deleteArrowConfig = (id: string) => deleteUserOne<ArrowConfig>(USER_KEYS.ARROWS, id, getArrowConfigs);

// Stabilizer Tests
export const getStabilizerTests = (): Promise<StabilizerTest[]> => getUserAll<StabilizerTest>(USER_KEYS.STAB_TESTS);
export const saveStabilizerTest = (t: StabilizerTest) => saveUserOne(USER_KEYS.STAB_TESTS, t, getStabilizerTests);
export const deleteStabilizerTest = (id: string) => deleteUserOne<StabilizerTest>(USER_KEYS.STAB_TESTS, id, getStabilizerTests);

// Tune Logs
export const getTuneLogs = (): Promise<TuneLog[]> => getUserAll<TuneLog>(USER_KEYS.TUNE_LOGS);
export const saveTuneLog = (t: TuneLog) => saveUserOne(USER_KEYS.TUNE_LOGS, t, getTuneLogs);
export const deleteTuneLog = (id: string) => deleteUserOne<TuneLog>(USER_KEYS.TUNE_LOGS, id, getTuneLogs);

// Tournaments
export const getTournaments = (): Promise<Tournament[]> => getUserAll<Tournament>(USER_KEYS.TOURNAMENTS);
export const saveTournament = (t: Tournament) => saveUserOne(USER_KEYS.TOURNAMENTS, t, getTournaments);
export const deleteTournament = (id: string) => deleteUserOne<Tournament>(USER_KEYS.TOURNAMENTS, id, getTournaments);

// ===== SHARED DATA (global, all users see the same) =====

// Expert Applications
export const getExpertApps = (): Promise<ExpertApplication[]> => getAll<ExpertApplication>(GLOBAL_KEYS.EXPERT_APPS);
export const saveExpertApp = (a: ExpertApplication) => saveOne(GLOBAL_KEYS.EXPERT_APPS, a, getExpertApps);
export const deleteExpertApp = (id: string) => deleteOne<ExpertApplication>(GLOBAL_KEYS.EXPERT_APPS, id, getExpertApps);

// Swap Shop (shared — everyone sees all listings)
export const getSwapListings = (): Promise<SwapListing[]> => getAll<SwapListing>(GLOBAL_KEYS.SWAP_SHOP);
export const saveSwapListing = (l: SwapListing) => saveOne(GLOBAL_KEYS.SWAP_SHOP, l, getSwapListings);
export const deleteSwapListing = (id: string) => deleteOne<SwapListing>(GLOBAL_KEYS.SWAP_SHOP, id, getSwapListings);

// Feedback (shared — goes to admin)
export const getFeedback = (): Promise<FeedbackItem[]> => getAll<FeedbackItem>(GLOBAL_KEYS.FEEDBACK);
export const saveFeedback = (f: FeedbackItem) => saveOne(GLOBAL_KEYS.FEEDBACK, f, getFeedback);
export const deleteFeedback = (id: string) => deleteOne<FeedbackItem>(GLOBAL_KEYS.FEEDBACK, id, getFeedback);

// Live Rounds (per-user)
export const getLiveRounds = (): Promise<LiveRound[]> => getUserAll<LiveRound>(USER_KEYS.LIVE_ROUNDS);
export const saveLiveRound = (r: LiveRound) => saveUserOne(USER_KEYS.LIVE_ROUNDS, r, getLiveRounds);
export const deleteLiveRound = (id: string) => deleteUserOne<LiveRound>(USER_KEYS.LIVE_ROUNDS, id, getLiveRounds);

// Practice Logs (per-user)
export const getPracticeLogs = (): Promise<PracticeLog[]> => getUserAll<PracticeLog>(USER_KEYS.PRACTICES);
export const savePracticeLog = (p: PracticeLog) => saveUserOne(USER_KEYS.PRACTICES, p, getPracticeLogs);
export const deletePracticeLog = (id: string) => deleteUserOne<PracticeLog>(USER_KEYS.PRACTICES, id, getPracticeLogs);

// Expenses (per-user)
export const getExpenses = (): Promise<Expense[]> => getUserAll<Expense>(USER_KEYS.EXPENSES);
export const saveExpense = (e: Expense) => saveUserOne(USER_KEYS.EXPENSES, e, getExpenses);
export const deleteExpense = (id: string) => deleteUserOne<Expense>(USER_KEYS.EXPENSES, id, getExpenses);

// Equipment shot count calculator
export async function getEquipmentShotCounts(): Promise<{ bows: Record<string, number>; arrows: Record<string, number> }> {
  const shots = await getShots();
  const bows: Record<string, number> = {};
  const arrows: Record<string, number> = {};
  for (const shot of shots) {
    if (shot.bowConfigId) {
      bows[shot.bowConfigId] = (bows[shot.bowConfigId] || 0) + shot.arrowCount;
    }
    if (shot.arrowConfigId) {
      arrows[shot.arrowConfigId] = (arrows[shot.arrowConfigId] || 0) + shot.arrowCount;
    }
  }
  return { bows, arrows };
}

// Forum Posts (shared — everyone sees all posts)
export const getForumPosts = (): Promise<LocalForumPost[]> => getAll<LocalForumPost>(GLOBAL_KEYS.FORUM_POSTS);
export const saveForumPost = (p: LocalForumPost) => saveOne(GLOBAL_KEYS.FORUM_POSTS, p, getForumPosts);
export const deleteForumPost = (id: string) => deleteOne<LocalForumPost>(GLOBAL_KEYS.FORUM_POSTS, id, getForumPosts);

// Forum Replies (shared)
export const getForumReplies = (): Promise<LocalForumReply[]> => getAll<LocalForumReply>(GLOBAL_KEYS.FORUM_REPLIES);
export const saveForumReply = (r: LocalForumReply) => saveOne(GLOBAL_KEYS.FORUM_REPLIES, r, getForumReplies);
export const deleteForumReply = (id: string) => deleteOne<LocalForumReply>(GLOBAL_KEYS.FORUM_REPLIES, id, getForumReplies);

// ===== AUTH SYSTEM =====

// Seed admin account on first load
export async function seedAdminAccount(): Promise<void> {
  const users = await getAll<AppUser>(GLOBAL_KEYS.AUTH_USERS);
  const adminExists = users.some((u) => u.role === 'admin');
  if (!adminExists) {
    const admin: AppUser = {
      id: 'admin-001',
      username: 'cody',
      password: 'Brayden25!',
      displayName: 'Cody (Admin)',
      role: 'admin',
      canInvite: true,
      createdAt: new Date().toISOString(),
    };
    await saveAll(GLOBAL_KEYS.AUTH_USERS, [admin, ...users]);
  }
}

export async function login(username: string, password: string): Promise<AppUser | null> {
  const users = await getAll<AppUser>(GLOBAL_KEYS.AUTH_USERS);
  const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
  if (user) {
    const updated = { ...user, lastLogin: new Date().toISOString() };
    await saveOne(GLOBAL_KEYS.AUTH_USERS, updated, () => getAll<AppUser>(GLOBAL_KEYS.AUTH_USERS));
    await AsyncStorage.setItem(GLOBAL_KEYS.AUTH_SESSION, JSON.stringify(updated));
    return updated;
  }
  return null;
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(GLOBAL_KEYS.AUTH_SESSION);
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const raw = await AsyncStorage.getItem(GLOBAL_KEYS.AUTH_SESSION);
  return raw ? JSON.parse(raw) : null;
}

export async function getAllUsers(): Promise<AppUser[]> {
  return getAll<AppUser>(GLOBAL_KEYS.AUTH_USERS);
}

export async function createUser(user: AppUser): Promise<void> {
  await saveOne(GLOBAL_KEYS.AUTH_USERS, user, () => getAll<AppUser>(GLOBAL_KEYS.AUTH_USERS));
}

export async function changePassword(userId: string, newPassword: string): Promise<boolean> {
  const users = await getAll<AppUser>(GLOBAL_KEYS.AUTH_USERS);
  const idx = users.findIndex((u) => u.id === userId);
  if (idx < 0) return false;
  users[idx].password = newPassword;
  await saveAll(GLOBAL_KEYS.AUTH_USERS, users);
  // Update session too
  const session = await getCurrentUser();
  if (session && session.id === userId) {
    session.password = newPassword;
    await AsyncStorage.setItem(GLOBAL_KEYS.AUTH_SESSION, JSON.stringify(session));
  }
  return true;
}

export async function updateUserPermissions(userId: string, canInvite: boolean): Promise<void> {
  const users = await getAll<AppUser>(GLOBAL_KEYS.AUTH_USERS);
  const idx = users.findIndex((u) => u.id === userId);
  if (idx >= 0) {
    users[idx].canInvite = canInvite;
    await saveAll(GLOBAL_KEYS.AUTH_USERS, users);
  }
}

export async function deleteUser(id: string): Promise<void> {
  await deleteOne<AppUser>(GLOBAL_KEYS.AUTH_USERS, id, () => getAll<AppUser>(GLOBAL_KEYS.AUTH_USERS));
}

// Invites
export async function getInvites(): Promise<Invite[]> {
  return getAll<Invite>(GLOBAL_KEYS.INVITES);
}

export async function saveInvite(invite: Invite): Promise<void> {
  await saveOne(GLOBAL_KEYS.INVITES, invite, getInvites);
}

// Dashboard preferences (per-user)
export async function getDashboardPrefs(): Promise<{ order: string[]; hidden: string[] } | null> {
  const key = await userKey('dashboard_prefs');
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}
export async function saveDashboardPrefs(prefs: { order: string[]; hidden: string[] }): Promise<void> {
  const key = await userKey('dashboard_prefs');
  await AsyncStorage.setItem(key, JSON.stringify(prefs));
}

// User profile (per-user, separate from auth)
export async function getUserProfile(): Promise<{ displayName: string; username: string } | null> {
  // Pull from current session
  const session = await getCurrentUser();
  if (session) return { displayName: session.displayName, username: session.username };
  return null;
}
export async function saveUserProfile(profile: { displayName: string; username: string }): Promise<void> {
  const key = await userKey(USER_KEYS.USER_PROFILE);
  await AsyncStorage.setItem(key, JSON.stringify(profile));
}
