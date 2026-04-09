import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { getShots, getSessions, getBowConfigs, getArrowConfigs, getTournaments, getDashboardPrefs } from '../lib/storage';
import AnimatedEntry from '../components/AnimatedEntry';
import GradientCard from '../components/GradientCard';
import { useScreenTracking } from '../lib/useAnalytics';
import { ALL_DASHBOARD_CARDS, DEFAULT_ORDER } from './customize';
import type { ShotEnd, Session, Tournament } from '../lib/types';

export default function Dashboard() {
  useScreenTracking('dashboard');
  const router = useRouter();
  const [shots, setShots] = useState<ShotEnd[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [gearCount, setGearCount] = useState(0);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [cardOrder, setCardOrder] = useState<string[]>(DEFAULT_ORDER);
  const [hiddenCards, setHiddenCards] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    const [s, sess, bows, arrows, tourn] = await Promise.all([
      getShots(), getSessions(), getBowConfigs(), getArrowConfigs(), getTournaments(),
    ]);
    setShots(s);
    setSessions(sess);
    setGearCount(bows.length + arrows.length);
    setTournaments(tourn);
    const prefs = await getDashboardPrefs();
    if (prefs) {
      setCardOrder(prefs.order.length > 0 ? prefs.order : DEFAULT_ORDER);
      setHiddenCards(prefs.hidden);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const totalArrows = shots.reduce((sum, s) => sum + s.arrowCount, 0);
  const allScores = shots.flatMap((s) => s.scores);
  const avgScore = allScores.length > 0
    ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1)
    : '—';
  const totalSessions = sessions.length;

  // Streak calc
  const shotDates = [...new Set(shots.map((s) => new Date(s.date).toDateString()))];
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (shotDates.includes(d.toDateString())) {
      streak++;
    } else if (i > 0) break;
  }

  const recentShots = shots.slice(0, 5);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Hero */}
      <AnimatedEntry>
        <LinearGradient
          colors={[...gradients.heroBg] as [string, string, ...string[]]}
          style={styles.hero}
        >
          <Text style={styles.brand}>BCA</Text>
          <Text style={styles.subtitle}>ARCHERY OS</Text>
          <LinearGradient
            colors={[...gradients.primaryToSecondary] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.taglineBadge}
          >
            <Text style={styles.tagline}>BOW CONTROL ANALYTICS</Text>
          </LinearGradient>
        </LinearGradient>
      </AnimatedEntry>

      {/* Stats */}
      <AnimatedEntry delay={100}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={[...gradients.primaryFade] as [string, string]}
              style={styles.statGradient}
            >
              <Ionicons name="arrow-up" size={20} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.primary }]}>{totalArrows}</Text>
              <Text style={styles.statLabel}>ARROWS</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient
              colors={[...gradients.secondaryFade] as [string, string]}
              style={styles.statGradient}
            >
              <Ionicons name="analytics" size={20} color={colors.secondary} />
              <Text style={[styles.statValue, { color: colors.secondary }]}>{avgScore}</Text>
              <Text style={styles.statLabel}>AVG SCORE</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient
              colors={[...gradients.primaryFade] as [string, string]}
              style={styles.statGradient}
            >
              <Ionicons name="timer" size={20} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.primary }]}>{totalSessions}</Text>
              <Text style={styles.statLabel}>SESSIONS</Text>
            </LinearGradient>
          </View>
        </View>
      </AnimatedEntry>

      {/* Streak */}
      {streak > 0 && (
        <AnimatedEntry delay={150}>
          <LinearGradient
            colors={[...gradients.primaryToSecondary] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.streakBadge}
          >
            <Ionicons name="flame" size={18} color={colors.background} />
            <Text style={styles.streakText}>{streak} DAY STREAK</Text>
          </LinearGradient>
        </AnimatedEntry>
      )}

      {/* Customizable Quick Actions */}
      <AnimatedEntry delay={170}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <TouchableOpacity onPress={() => router.push('/customize')} style={styles.customizeBtn}>
            <Ionicons name="options" size={14} color={colors.secondary} />
            <Text style={styles.customizeBtnText}>Customize</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionsGrid}>
          {cardOrder
            .filter((id) => !hiddenCards.includes(id))
            .map((id) => {
              const card = ALL_DASHBOARD_CARDS.find((c) => c.id === id);
              if (!card) return null;
              return (
                <TouchableOpacity key={card.id} style={styles.actionCard}
                  onPress={() => router.push(card.route as any)} activeOpacity={0.7}>
                  <LinearGradient
                    colors={[card.color + '20', card.color + '05'] as [string, string]}
                    style={styles.actionGradient}>
                    <Ionicons name={card.icon as any} size={32} color={card.color} />
                    <Text style={[styles.actionText, { color: card.color }]}>{card.label}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
        </View>
      </AnimatedEntry>

      {/* Recent Shots */}
      {recentShots.length > 0 ? (
        <AnimatedEntry delay={300}>
          <Text style={styles.sectionTitle}>RECENT SHOTS</Text>
          {recentShots.map((shot, i) => {
            const total = shot.scores.reduce((a, b) => a + b, 0);
            const avg = (total / shot.scores.length).toFixed(1);
            return (
              <GradientCard key={shot.id} onPress={() => router.push({ pathname: '/shot-detail', params: { id: shot.id } })}>
                <View style={styles.recentRow}>
                  <View>
                    <Text style={styles.recentDistance}>{shot.distance}m</Text>
                    <Text style={styles.recentDate}>{new Date(shot.date).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.recentScores}>
                    {shot.scores.slice(0, 6).map((s, j) => (
                      <View
                        key={j}
                        style={[
                          styles.miniScore,
                          { backgroundColor: s >= 9 ? colors.primary + '30' : s >= 7 ? colors.secondary + '30' : colors.surfaceLight },
                        ]}
                      >
                        <Text style={[styles.miniScoreText, { color: s >= 9 ? colors.primary : s >= 7 ? colors.secondary : colors.textSecondary }]}>
                          {s === 10 ? 'X' : s}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.recentRight}>
                    <Text style={styles.recentTotal}>{total}</Text>
                    <Text style={styles.recentAvg}>avg {avg}</Text>
                  </View>
                </View>
              </GradientCard>
            );
          })}
        </AnimatedEntry>
      ) : (
        <AnimatedEntry delay={300}>
          <View style={styles.empty}>
            <LinearGradient
              colors={[colors.surface, colors.background] as [string, string]}
              style={styles.emptyGradient}
            >
              <Ionicons name="locate-outline" size={56} color={colors.textMuted} />
              <Text style={styles.emptyText}>No shots logged yet</Text>
              <Text style={styles.emptySubtext}>Tap "Log Shots" to get started</Text>
            </LinearGradient>
          </View>
        </AnimatedEntry>
      )}

      {/* Admin link (subtle) */}
      <TouchableOpacity style={styles.adminLink} onPress={() => router.push('/admin')}>
        <Ionicons name="pulse" size={12} color={colors.textMuted} />
        <Text style={styles.adminLinkText}>Admin Analytics</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  brand: {
    fontSize: fontSize.hero,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 8,
  },
  subtitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 6,
    marginTop: -4,
  },
  taglineBadge: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  tagline: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    color: colors.background,
    letterSpacing: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  statGradient: {
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  streakText: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.background,
    letterSpacing: 2,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 2,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.sm },
  customizeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.secondary },
  adminLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.lg, marginTop: spacing.md },
  adminLinkText: { fontSize: fontSize.xs, color: colors.textMuted },
  customizeBtnText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.secondary },
  targetMapBtn: { borderRadius: borderRadius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.primary + '40', marginBottom: spacing.md },
  targetMapGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  targetMapLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  targetMapIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  targetMapTitle: { fontSize: fontSize.md, fontWeight: '900', color: colors.primary, letterSpacing: 2 },
  targetMapSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  actionText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentDistance: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.primary,
  },
  recentDate: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  recentScores: {
    flexDirection: 'row',
    gap: 3,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: spacing.sm,
  },
  miniScore: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniScoreText: {
    fontSize: 11,
    fontWeight: '700',
  },
  recentRight: {
    alignItems: 'flex-end',
  },
  recentTotal: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.secondary,
  },
  recentAvg: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  empty: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  emptyGradient: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    borderRadius: borderRadius.lg,
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
