import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { getShots, getSessions, getBowConfigs, getArrowConfigs, getTournaments } from '../lib/storage';
import AnimatedEntry from '../components/AnimatedEntry';
import GradientCard from '../components/GradientCard';
import type { ShotEnd, Session, Tournament } from '../lib/types';

export default function Dashboard() {
  const router = useRouter();
  const [shots, setShots] = useState<ShotEnd[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [gearCount, setGearCount] = useState(0);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [s, sess, bows, arrows, tourn] = await Promise.all([
      getShots(), getSessions(), getBowConfigs(), getArrowConfigs(), getTournaments(),
    ]);
    setShots(s);
    setSessions(sess);
    setGearCount(bows.length + arrows.length);
    setTournaments(tourn);
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

      {/* Quick Actions */}
      <AnimatedEntry delay={200}>
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/shot-detail')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.primary + '20', colors.primary + '05'] as [string, string]}
              style={styles.actionGradient}
            >
              <Ionicons name="add-circle" size={32} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>Log Shots</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/session-detail')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.secondary + '20', colors.secondary + '05'] as [string, string]}
              style={styles.actionGradient}
            >
              <Ionicons name="play-circle" size={32} color={colors.secondary} />
              <Text style={[styles.actionText, { color: colors.secondary }]}>New Session</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/gear' as any)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.primary + '15', colors.secondary + '05'] as [string, string]}
              style={styles.actionGradient}
            >
              <Ionicons name="fitness" size={32} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>
                Gear {gearCount > 0 ? `(${gearCount})` : ''}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/analytics')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.secondary + '15', colors.primary + '05'] as [string, string]}
              style={styles.actionGradient}
            >
              <Ionicons name="bar-chart" size={32} color={colors.secondary} />
              <Text style={[styles.actionText, { color: colors.secondary }]}>Analytics</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/tournaments')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#FFB80020', '#FFB80005'] as [string, string]}
              style={styles.actionGradient}
            >
              <Ionicons name="trophy" size={32} color="#FFB800" />
              <Text style={[styles.actionText, { color: '#FFB800' }]}>
                Tournaments {tournaments.length > 0 ? `(${tournaments.length})` : ''}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/stabilizer-test')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#FF8C0020', '#FF8C0005'] as [string, string]}
              style={styles.actionGradient}
            >
              <Ionicons name="flask" size={32} color="#FF8C00" />
              <Text style={[styles.actionText, { color: '#FF8C00' }]}>Stab Lab</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/forum')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#9B59B620', '#9B59B605'] as [string, string]}
              style={styles.actionGradient}
            >
              <Ionicons name="chatbubbles" size={32} color="#9B59B6" />
              <Text style={[styles.actionText, { color: '#9B59B6' }]}>Forum</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/experts')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#E74C3C20', '#E74C3C05'] as [string, string]}
              style={styles.actionGradient}
            >
              <Ionicons name="people" size={32} color="#E74C3C" />
              <Text style={[styles.actionText, { color: '#E74C3C' }]}>Ask Experts</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/profile')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.text + '10', colors.text + '02'] as [string, string]}
              style={styles.actionGradient}
            >
              <Ionicons name="person-circle" size={32} color={colors.text} />
              <Text style={[styles.actionText, { color: colors.text }]}>My Profile</Text>
            </LinearGradient>
          </TouchableOpacity>
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
