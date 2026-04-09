import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import AnimatedEntry from '../components/AnimatedEntry';
import { getAnalyticsSummary, clearAnalytics, type AnalyticsSummary } from '../lib/analytics';
import { getShots, getLiveRounds, getBowConfigs, getArrowConfigs, getEquipmentShotCounts, getFeedback, saveFeedback } from '../lib/storage';
import type { FeedbackItem } from '../lib/types';
import { FEEDBACK_TYPE_LABELS } from '../lib/types';
import { useScreenTracking } from '../lib/useAnalytics';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function StatBox({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: string }) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon as any} size={18} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function BarRow({ label, value, maxValue, color }: { label: string; value: number; maxValue: number; color: string }) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel} numberOfLines={1}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.barValue, { color }]}>{value}</Text>
    </View>
  );
}

export default function AdminScreen() {
  useScreenTracking('admin');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [dataStats, setDataStats] = useState<{
    totalShots: number; totalRounds: number; asaRounds: number; iboRounds: number;
    bowCount: number; arrowCount: number; bowShotCounts: Record<string, number>;
    arrowShotCounts: Record<string, number>; bowNames: Record<string, string>;
    arrowNames: Record<string, string>;
  } | null>(null);

  const loadData = useCallback(async () => {
    const [s, shots, rounds, bows, arrows, equipCounts, fb] = await Promise.all([
      getAnalyticsSummary(), getShots(), getLiveRounds(),
      getBowConfigs(), getArrowConfigs(), getEquipmentShotCounts(), getFeedback(),
    ]);
    setSummary(s);
    setFeedback(fb);

    const bowNames: Record<string, string> = {};
    bows.forEach((b) => { bowNames[b.id] = b.name; });
    const arrowNames: Record<string, string> = {};
    arrows.forEach((a) => { arrowNames[a.id] = a.name; });

    setDataStats({
      totalShots: shots.length,
      totalRounds: rounds.length,
      asaRounds: rounds.filter((r) => r.format === 'asa').length,
      iboRounds: rounds.filter((r) => r.format === 'ibo').length,
      bowCount: bows.length,
      arrowCount: arrows.length,
      bowShotCounts: equipCounts.bows,
      arrowShotCounts: equipCounts.arrows,
      bowNames, arrowNames,
    });
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleClear = () => {
    Alert.alert('Clear Analytics', 'This will delete all analytics data. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => { await clearAnalytics(); loadData(); } },
    ]);
  };

  const formatMs = (ms: number): string => {
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  if (!summary) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: colors.textSecondary }}>Loading analytics...</Text>
    </View>
  );

  const maxScreenViews = Math.max(...summary.topScreens.map((s) => s.views), 1);
  const maxActionCount = Math.max(...summary.topActions.map((a) => a.count), 1);
  const maxHourly = Math.max(...summary.hourlyDistribution, 1);
  const maxDaily = Math.max(...summary.dailyDistribution, 1);

  return (
    <>
      <Stack.Screen options={{
        title: 'ADMIN ANALYTICS', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text,
      }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Hero */}
        <AnimatedEntry>
          <LinearGradient colors={['#0A0A0A', '#0F0A1A', '#0A0A0A'] as [string, string, string]} style={styles.hero}>
            <Ionicons name="pulse" size={36} color="#9B59B6" />
            <Text style={styles.heroTitle}>ADMIN ANALYTICS</Text>
            <Text style={styles.heroSub}>{summary.totalEvents} events tracked</Text>
          </LinearGradient>
        </AnimatedEntry>

        {/* Overview */}
        <AnimatedEntry delay={60}>
          <Text style={styles.sectionTitle}>OVERVIEW</Text>
          <View style={styles.statGrid}>
            <StatBox label="App Opens" value={summary.totalAppOpens} color={colors.primary} icon="enter" />
            <StatBox label="Sessions" value={summary.totalSessions} color={colors.secondary} icon="layers" />
            <StatBox label="Avg Session" value={formatMs(summary.avgSessionLengthMs)} color="#FFB800" icon="time" />
          </View>
          <View style={styles.statGrid}>
            <StatBox label="Total Time" value={formatMs(summary.totalTimeSpentMs)} color={colors.primary} icon="hourglass" />
            <StatBox label="Days Active" value={summary.daysActive} color={colors.secondary} icon="calendar" />
            <StatBox label="Streak" value={`${summary.currentStreak}d`} color="#FF8C00" icon="flame" />
          </View>
        </AnimatedEntry>

        {/* Data Stats */}
        {dataStats && (
          <AnimatedEntry delay={100}>
            <Text style={styles.sectionTitle}>DATA CREATED</Text>
            <View style={styles.statGrid}>
              <StatBox label="Shot Ends" value={dataStats.totalShots} color={colors.primary} icon="locate" />
              <StatBox label="Rounds" value={dataStats.totalRounds} color="#00AA00" icon="trophy" />
              <StatBox label="Bows" value={dataStats.bowCount} color={colors.secondary} icon="fitness" />
            </View>
            <View style={styles.statGrid}>
              <StatBox label="ASA Rounds" value={dataStats.asaRounds} color="#00AA00" icon="flag" />
              <StatBox label="IBO Rounds" value={dataStats.iboRounds} color="#0066CC" icon="flag" />
              <StatBox label="Arrow Setups" value={dataStats.arrowCount} color="#FF8C00" icon="arrow-forward" />
            </View>
          </AnimatedEntry>
        )}

        {/* Equipment Shot Counts */}
        {dataStats && Object.keys(dataStats.bowShotCounts).length > 0 && (
          <AnimatedEntry delay={120}>
            <Text style={styles.sectionTitle}>ARROWS SHOT PER BOW</Text>
            {Object.entries(dataStats.bowShotCounts).sort((a, b) => b[1] - a[1]).map(([id, count]) => (
              <BarRow key={id} label={dataStats.bowNames[id] || 'Unknown'} value={count}
                maxValue={Math.max(...Object.values(dataStats.bowShotCounts))} color={colors.primary} />
            ))}
          </AnimatedEntry>
        )}

        {dataStats && Object.keys(dataStats.arrowShotCounts).length > 0 && (
          <AnimatedEntry delay={140}>
            <Text style={styles.sectionTitle}>ARROWS SHOT PER ARROW SETUP</Text>
            {Object.entries(dataStats.arrowShotCounts).sort((a, b) => b[1] - a[1]).map(([id, count]) => (
              <BarRow key={id} label={dataStats.arrowNames[id] || 'Unknown'} value={count}
                maxValue={Math.max(...Object.values(dataStats.arrowShotCounts))} color={colors.secondary} />
            ))}
          </AnimatedEntry>
        )}

        {/* Top Screens */}
        <AnimatedEntry delay={160}>
          <Text style={styles.sectionTitle}>MOST USED FEATURES</Text>
          {summary.topScreens.map((s, i) => (
            <BarRow key={s.name} label={s.name} value={s.views} maxValue={maxScreenViews}
              color={i < 3 ? colors.primary : colors.secondary} />
          ))}
        </AnimatedEntry>

        {/* Least Used */}
        {summary.bottomScreens.length > 0 && (
          <AnimatedEntry delay={180}>
            <Text style={styles.sectionTitle}>LEAST USED FEATURES</Text>
            {summary.bottomScreens.map((s) => (
              <BarRow key={s.name} label={s.name} value={s.views} maxValue={maxScreenViews} color={colors.danger} />
            ))}
          </AnimatedEntry>
        )}

        {/* Screen Time */}
        {Object.keys(summary.screenTimeMs).length > 0 && (
          <AnimatedEntry delay={200}>
            <Text style={styles.sectionTitle}>TIME SPENT PER SCREEN</Text>
            {Object.entries(summary.screenTimeMs)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([name, ms]) => (
                <BarRow key={name} label={name} value={Math.round(ms / 1000)}
                  maxValue={Math.round(Math.max(...Object.values(summary.screenTimeMs)) / 1000)}
                  color="#9B59B6" />
              ))}
            <Text style={styles.note}>Values in seconds</Text>
          </AnimatedEntry>
        )}

        {/* Top Actions */}
        {summary.topActions.length > 0 && (
          <AnimatedEntry delay={220}>
            <Text style={styles.sectionTitle}>TOP ACTIONS</Text>
            {summary.topActions.map((a) => (
              <BarRow key={a.name} label={a.name} value={a.count} maxValue={maxActionCount} color="#FF8C00" />
            ))}
          </AnimatedEntry>
        )}

        {/* Peak Hours */}
        <AnimatedEntry delay={240}>
          <Text style={styles.sectionTitle}>PEAK USAGE HOURS</Text>
          <View style={styles.hourGrid}>
            {summary.hourlyDistribution.map((count, hour) => {
              const intensity = maxHourly > 0 ? count / maxHourly : 0;
              return (
                <View key={hour} style={styles.hourCell}>
                  <View style={[styles.hourBar, {
                    height: Math.max(2, intensity * 40),
                    backgroundColor: intensity > 0.7 ? colors.primary : intensity > 0.3 ? colors.secondary : colors.surfaceLight,
                  }]} />
                  <Text style={styles.hourLabel}>{hour}</Text>
                </View>
              );
            })}
          </View>
        </AnimatedEntry>

        {/* Day of Week */}
        <AnimatedEntry delay={260}>
          <Text style={styles.sectionTitle}>DAY OF WEEK</Text>
          <View style={styles.dayGrid}>
            {summary.dailyDistribution.map((count, day) => {
              const intensity = maxDaily > 0 ? count / maxDaily : 0;
              return (
                <View key={day} style={styles.dayCell}>
                  <View style={[styles.dayBar, {
                    height: Math.max(2, intensity * 50),
                    backgroundColor: intensity > 0.7 ? colors.primary : intensity > 0.3 ? colors.secondary : colors.surfaceLight,
                  }]} />
                  <Text style={styles.dayLabel}>{DAY_NAMES[day]}</Text>
                  <Text style={styles.dayCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        </AnimatedEntry>

        {/* Recent Events */}
        <AnimatedEntry delay={280}>
          <Text style={styles.sectionTitle}>RECENT EVENTS ({summary.recentEvents.length})</Text>
          <View style={styles.eventsWrap}>
            {summary.recentEvents.slice(0, 25).map((e) => (
              <View key={e.id} style={styles.eventRow}>
                <View style={[styles.eventDot, {
                  backgroundColor: e.type === 'screen_view' ? colors.secondary :
                    e.type === 'action' ? colors.primary :
                    e.type === 'app_open' ? '#00AA00' :
                    e.type === 'app_close' ? colors.danger : colors.textMuted,
                }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventName}>{e.name}</Text>
                  <Text style={styles.eventTime}>
                    {new Date(e.timestamp).toLocaleTimeString()} — {e.type}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </AnimatedEntry>

        {/* Feedback Inbox */}
        <AnimatedEntry delay={300}>
          <Text style={styles.sectionTitle}>
            FEEDBACK INBOX {feedback.filter((f) => f.status === 'new').length > 0 &&
              `(${feedback.filter((f) => f.status === 'new').length} new)`}
          </Text>
          {feedback.length === 0 ? (
            <View style={styles.emptyInbox}>
              <Ionicons name="mail-open-outline" size={32} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.sm }}>No feedback yet</Text>
            </View>
          ) : (
            feedback.map((item) => {
              const typeInfo = FEEDBACK_TYPE_LABELS[item.type];
              return (
                <View key={item.id} style={styles.feedbackCard}>
                  <View style={styles.feedbackHeader}>
                    <View style={[styles.feedbackTypeBadge, { backgroundColor: typeInfo.color + '20' }]}>
                      <Ionicons name={typeInfo.icon as any} size={12} color={typeInfo.color} />
                      <Text style={[styles.feedbackTypeText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
                    </View>
                    <View style={[styles.feedbackStatusBadge, {
                      backgroundColor: item.status === 'new' ? colors.primary + '20' : item.status === 'reviewed' ? colors.secondary + '20' : colors.textMuted + '20',
                    }]}>
                      <Text style={[styles.feedbackStatusText, {
                        color: item.status === 'new' ? colors.primary : item.status === 'reviewed' ? colors.secondary : colors.textMuted,
                      }]}>{item.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.feedbackSubject}>{item.subject}</Text>
                  <Text style={styles.feedbackBody} numberOfLines={3}>{item.body}</Text>
                  <View style={styles.feedbackMeta}>
                    <Text style={styles.feedbackAuthor}>{item.author}</Text>
                    <Text style={styles.feedbackDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                  </View>
                  {item.status === 'new' && (
                    <TouchableOpacity style={styles.markReviewedBtn} onPress={async () => {
                      const updated = { ...item, status: 'reviewed' as const };
                      await saveFeedback(updated);
                      setFeedback(feedback.map((f) => f.id === item.id ? updated : f));
                    }}>
                      <Ionicons name="checkmark" size={14} color={colors.secondary} />
                      <Text style={styles.markReviewedText}>Mark Reviewed</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </AnimatedEntry>

        {/* Clear */}
        <AnimatedEntry delay={340}>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Ionicons name="trash" size={16} color={colors.danger} />
            <Text style={styles.clearText}>Clear All Analytics Data</Text>
          </TouchableOpacity>
        </AnimatedEntry>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl * 2 },
  hero: { alignItems: 'center', paddingVertical: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  heroTitle: { fontSize: fontSize.xl, fontWeight: '900', color: '#9B59B6', letterSpacing: 4, marginTop: spacing.sm },
  heroSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  sectionTitle: { fontSize: fontSize.xs, fontWeight: '800', color: colors.textSecondary, letterSpacing: 2, marginTop: spacing.xl, marginBottom: spacing.sm },
  statGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  statBox: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.sm, alignItems: 'center' },
  statValue: { fontSize: fontSize.xl, fontWeight: '900', marginTop: 2 },
  statLabel: { fontSize: 8, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, marginTop: 2, textTransform: 'uppercase' },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  barLabel: { width: 90, fontSize: fontSize.xs, color: colors.text, fontWeight: '600' },
  barTrack: { flex: 1, height: 16, backgroundColor: colors.surface, borderRadius: 8, overflow: 'hidden', marginHorizontal: spacing.sm },
  barFill: { height: '100%', borderRadius: 8, minWidth: 2 },
  barValue: { width: 35, fontSize: fontSize.xs, fontWeight: '800', textAlign: 'right' },
  note: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
  hourGrid: { flexDirection: 'row', alignItems: 'flex-end', height: 60, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.sm, paddingBottom: spacing.lg },
  hourCell: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  hourBar: { width: 6, borderRadius: 3, minHeight: 2 },
  hourLabel: { fontSize: 6, color: colors.textMuted, marginTop: 2 },
  dayGrid: { flexDirection: 'row', alignItems: 'flex-end', height: 80, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, paddingBottom: spacing.lg, gap: spacing.sm },
  dayCell: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  dayBar: { width: '80%', borderRadius: 4, minHeight: 2 },
  dayLabel: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '700', marginTop: 4 },
  dayCount: { fontSize: 9, color: colors.textMuted },
  eventsWrap: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.sm, maxHeight: 400 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
  eventDot: { width: 8, height: 8, borderRadius: 4 },
  eventName: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },
  eventTime: { fontSize: fontSize.xs, color: colors.textMuted },
  emptyInbox: { alignItems: 'center', padding: spacing.lg, backgroundColor: colors.surface, borderRadius: borderRadius.md },
  feedbackCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  feedbackHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  feedbackTypeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  feedbackTypeText: { fontSize: fontSize.xs, fontWeight: '700' },
  feedbackStatusBadge: { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  feedbackStatusText: { fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase' },
  feedbackSubject: { fontSize: fontSize.md, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
  feedbackBody: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
  feedbackMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  feedbackAuthor: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600' },
  feedbackDate: { fontSize: fontSize.xs, color: colors.textMuted },
  markReviewedBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.secondary + '15', alignSelf: 'flex-start' },
  markReviewedText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.secondary },
  clearBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md, marginTop: spacing.xl, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.danger + '40' },
  clearText: { fontSize: fontSize.sm, color: colors.danger, fontWeight: '600' },
});
