import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  EVENTS: '@bca_analytics_events',
  SESSIONS: '@bca_analytics_sessions',
  CURRENT_SESSION: '@bca_analytics_current_session',
};

export interface AnalyticsEvent {
  id: string;
  type: 'screen_view' | 'screen_exit' | 'action' | 'app_open' | 'app_close';
  name: string;
  metadata?: Record<string, string | number | boolean>;
  timestamp: string;
  sessionId?: string;
}

export interface AppSession {
  id: string;
  startTime: string;
  endTime?: string;
  durationMs?: number;
  screenViews: number;
  actions: number;
}

let currentSessionId: string | null = null;
let eventBuffer: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Flush buffer to storage (batched writes for performance)
async function flushEvents() {
  if (eventBuffer.length === 0) return;
  const toFlush = [...eventBuffer];
  eventBuffer = [];
  try {
    const raw = await AsyncStorage.getItem(KEYS.EVENTS);
    const existing: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];
    // Keep last 5000 events max to prevent storage bloat
    const combined = [...toFlush, ...existing].slice(0, 5000);
    await AsyncStorage.setItem(KEYS.EVENTS, JSON.stringify(combined));
  } catch (e) {
    // Silently fail — analytics should never break the app
  }
}

function scheduleFlush() {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushEvents, 2000);
}

// ===== PUBLIC API =====

export function trackEvent(name: string, metadata?: Record<string, string | number | boolean>) {
  eventBuffer.push({
    id: generateId(),
    type: 'action',
    name,
    metadata,
    timestamp: new Date().toISOString(),
    sessionId: currentSessionId || undefined,
  });
  scheduleFlush();
}

export function trackScreenView(screenName: string) {
  eventBuffer.push({
    id: generateId(),
    type: 'screen_view',
    name: screenName,
    timestamp: new Date().toISOString(),
    sessionId: currentSessionId || undefined,
  });
  scheduleFlush();
}

export function trackScreenExit(screenName: string, durationMs: number) {
  eventBuffer.push({
    id: generateId(),
    type: 'screen_exit',
    name: screenName,
    metadata: { durationMs },
    timestamp: new Date().toISOString(),
    sessionId: currentSessionId || undefined,
  });
  scheduleFlush();
}

export async function trackAppOpen() {
  currentSessionId = generateId();
  const session: AppSession = {
    id: currentSessionId,
    startTime: new Date().toISOString(),
    screenViews: 0,
    actions: 0,
  };

  eventBuffer.push({
    id: generateId(),
    type: 'app_open',
    name: 'app_open',
    timestamp: new Date().toISOString(),
    sessionId: currentSessionId,
  });

  try {
    await AsyncStorage.setItem(KEYS.CURRENT_SESSION, JSON.stringify(session));
    const raw = await AsyncStorage.getItem(KEYS.SESSIONS);
    const sessions: AppSession[] = raw ? JSON.parse(raw) : [];
    sessions.unshift(session);
    await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions.slice(0, 500)));
  } catch (e) {}

  scheduleFlush();
}

export async function trackAppClose() {
  if (!currentSessionId) return;

  eventBuffer.push({
    id: generateId(),
    type: 'app_close',
    name: 'app_close',
    timestamp: new Date().toISOString(),
    sessionId: currentSessionId,
  });

  try {
    const raw = await AsyncStorage.getItem(KEYS.SESSIONS);
    const sessions: AppSession[] = raw ? JSON.parse(raw) : [];
    const idx = sessions.findIndex((s) => s.id === currentSessionId);
    if (idx >= 0) {
      sessions[idx].endTime = new Date().toISOString();
      sessions[idx].durationMs = new Date().getTime() - new Date(sessions[idx].startTime).getTime();
      await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
    }
  } catch (e) {}

  await flushEvents();
  currentSessionId = null;
}

// ===== ANALYTICS QUERIES (for admin dashboard) =====

export async function getAnalyticsEvents(): Promise<AnalyticsEvent[]> {
  const raw = await AsyncStorage.getItem(KEYS.EVENTS);
  return raw ? JSON.parse(raw) : [];
}

export async function getAnalyticsSessions(): Promise<AppSession[]> {
  const raw = await AsyncStorage.getItem(KEYS.SESSIONS);
  return raw ? JSON.parse(raw) : [];
}

export interface AnalyticsSummary {
  totalAppOpens: number;
  totalSessions: number;
  avgSessionLengthMs: number;
  totalTimeSpentMs: number;
  daysActive: number;
  currentStreak: number;

  // Screen usage
  screenViews: Record<string, number>;
  screenTimeMs: Record<string, number>;
  topScreens: { name: string; views: number }[];
  bottomScreens: { name: string; views: number }[];

  // Action counts
  actionCounts: Record<string, number>;
  topActions: { name: string; count: number }[];

  // Time patterns
  hourlyDistribution: number[]; // 24 slots
  dailyDistribution: number[];  // 7 slots (Sun-Sat)

  // Recent events
  recentEvents: AnalyticsEvent[];
  totalEvents: number;
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const [events, sessions] = await Promise.all([getAnalyticsEvents(), getAnalyticsSessions()]);

  // App opens
  const totalAppOpens = events.filter((e) => e.type === 'app_open').length;

  // Sessions
  const completedSessions = sessions.filter((s) => s.durationMs);
  const totalTimeSpentMs = completedSessions.reduce((sum, s) => sum + (s.durationMs || 0), 0);
  const avgSessionLengthMs = completedSessions.length > 0
    ? totalTimeSpentMs / completedSessions.length : 0;

  // Days active
  const activeDays = new Set(events.map((e) => new Date(e.timestamp).toDateString()));
  const daysActive = activeDays.size;

  // Streak
  let currentStreak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (activeDays.has(d.toDateString())) {
      currentStreak++;
    } else if (i > 0) break;
  }

  // Screen views
  const screenViews: Record<string, number> = {};
  const screenTimeMs: Record<string, number> = {};
  for (const e of events) {
    if (e.type === 'screen_view') {
      screenViews[e.name] = (screenViews[e.name] || 0) + 1;
    }
    if (e.type === 'screen_exit' && e.metadata?.durationMs) {
      screenTimeMs[e.name] = (screenTimeMs[e.name] || 0) + (e.metadata.durationMs as number);
    }
  }

  const sortedScreens = Object.entries(screenViews).sort((a, b) => b[1] - a[1]);
  const topScreens = sortedScreens.slice(0, 10).map(([name, views]) => ({ name, views }));
  const bottomScreens = sortedScreens.slice(-5).reverse().map(([name, views]) => ({ name, views }));

  // Actions
  const actionCounts: Record<string, number> = {};
  for (const e of events) {
    if (e.type === 'action') {
      actionCounts[e.name] = (actionCounts[e.name] || 0) + 1;
    }
  }
  const topActions = Object.entries(actionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([name, count]) => ({ name, count }));

  // Hourly distribution
  const hourlyDistribution = new Array(24).fill(0);
  const dailyDistribution = new Array(7).fill(0);
  for (const e of events) {
    const d = new Date(e.timestamp);
    hourlyDistribution[d.getHours()]++;
    dailyDistribution[d.getDay()]++;
  }

  return {
    totalAppOpens,
    totalSessions: sessions.length,
    avgSessionLengthMs,
    totalTimeSpentMs,
    daysActive,
    currentStreak,
    screenViews,
    screenTimeMs,
    topScreens,
    bottomScreens,
    actionCounts,
    topActions,
    hourlyDistribution,
    dailyDistribution,
    recentEvents: events.slice(0, 50),
    totalEvents: events.length,
  };
}

export async function clearAnalytics() {
  await AsyncStorage.multiRemove([KEYS.EVENTS, KEYS.SESSIONS, KEYS.CURRENT_SESSION]);
}
