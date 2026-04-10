import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { getShots } from '../lib/storage';
import StatCard from '../components/StatCard';
import AnimatedEntry from '../components/AnimatedEntry';
import { useScreenTracking } from '../lib/useAnalytics';
import type { ShotEnd } from '../lib/types';

function SimpleBar({ label, value, maxValue, color }: { label: string; value: number; maxValue: number; color: string }) {
  const pct = maxValue > 0 ? Math.max(2, (value / maxValue) * 100) : 2;
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label}>{label}</Text>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[barStyles.value, { color }]}>{value}</Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  label: { width: 45, fontSize: fontSize.xs, color: colors.text, fontWeight: '600', textAlign: 'right', marginRight: spacing.sm },
  track: { flex: 1, height: 18, backgroundColor: colors.surface, borderRadius: 9, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 9, minWidth: 4 },
  value: { width: 35, fontSize: fontSize.xs, fontWeight: '800', textAlign: 'right', marginLeft: spacing.sm },
});

export default function AnalyticsScreen() {
  useScreenTracking('analytics');
  const [shots, setShots] = useState<ShotEnd[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getShots().then((s) => { setShots(s); setLoading(false); });
    }, [])
  );

  const allScores = shots.flatMap((s) => s.scores);
  const avgScore = allScores.length > 0
    ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1)
    : '—';
  const bestEnd = shots.length > 0
    ? Math.max(...shots.map((s) => s.scores.reduce((a, b) => a + b, 0)))
    : '—';
  const totalEnds = shots.length;
  const totalArrows = shots.reduce((sum, s) => sum + s.arrowCount, 0);

  // Score trend (last 10 ends)
  const recentEnds = shots.slice(0, 10).reverse();
  const recentAvgs = recentEnds.map((s) =>
    s.scores.length > 0 ? Math.round((s.scores.reduce((a, b) => a + b, 0) / s.scores.length) * 10) / 10 : 0
  );
  const maxRecentAvg = Math.max(...recentAvgs, 1);

  // Average by distance
  const distanceMap = new Map<number, number[]>();
  shots.forEach((s) => {
    if (s.scores.length === 0) return;
    const avg = s.scores.reduce((a, b) => a + b, 0) / s.scores.length;
    const existing = distanceMap.get(s.distance) || [];
    existing.push(avg);
    distanceMap.set(s.distance, existing);
  });
  const distanceSorted = [...distanceMap.entries()].sort((a, b) => a[0] - b[0]);
  const maxDistAvg = Math.max(...distanceSorted.map(([, avgs]) => avgs.reduce((a, b) => a + b, 0) / avgs.length), 1);

  // Score distribution
  const distribution = new Array(11).fill(0);
  allScores.forEach((s) => { if (s >= 0 && s <= 10) distribution[s]++; });
  const maxDist = Math.max(...distribution, 1);
  const distLabels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'X'];

  return (
    <>
      <Stack.Screen options={{ title: 'ANALYTICS', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Summary Stats */}
        <AnimatedEntry>
          <View style={styles.statsRow}>
            <StatCard label="Avg Score" value={avgScore} accent={colors.secondary} />
            <StatCard label="Best End" value={bestEnd} accent={colors.primary} />
            <StatCard label="Total Ends" value={totalEnds} accent={colors.secondary} />
          </View>
          <View style={styles.statsRow}>
            <StatCard label="Total Arrows" value={totalArrows} accent={colors.primary} />
          </View>
        </AnimatedEntry>

        {shots.length === 0 ? (
          <AnimatedEntry delay={60}>
            <View style={styles.empty}>
              <LinearGradient colors={[colors.surface, colors.background] as [string, string]} style={styles.emptyGradient}>
                <Ionicons name="bar-chart-outline" size={56} color={colors.textMuted} />
                <Text style={styles.emptyText}>No data yet</Text>
                <Text style={styles.emptySubtext}>Log some shots to see analytics</Text>
              </LinearGradient>
            </View>
          </AnimatedEntry>
        ) : (
          <>
            {/* Score Trend */}
            {recentAvgs.length > 1 && (
              <AnimatedEntry delay={60}>
                <Text style={styles.sectionTitle}>SCORE TREND (Last {recentEnds.length} Ends)</Text>
                <View style={styles.chartCard}>
                  {recentEnds.map((end, i) => (
                    <SimpleBar key={i} label={`End ${i + 1}`} value={recentAvgs[i]}
                      maxValue={maxRecentAvg} color={colors.primary} />
                  ))}
                </View>
              </AnimatedEntry>
            )}

            {/* Average by Distance */}
            {distanceSorted.length > 0 && (
              <AnimatedEntry delay={120}>
                <Text style={styles.sectionTitle}>AVERAGE BY DISTANCE</Text>
                <View style={styles.chartCard}>
                  {distanceSorted.map(([dist, avgs]) => {
                    const avg = Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 10) / 10;
                    return (
                      <SimpleBar key={dist} label={`${dist}m`} value={avg}
                        maxValue={maxDistAvg} color={colors.secondary} />
                    );
                  })}
                </View>
              </AnimatedEntry>
            )}

            {/* Score Distribution */}
            <AnimatedEntry delay={180}>
              <Text style={styles.sectionTitle}>SCORE DISTRIBUTION</Text>
              <View style={styles.chartCard}>
                {distLabels.map((label, i) => (
                  <SimpleBar key={label} label={label} value={distribution[i]}
                    maxValue={maxDist}
                    color={i >= 9 ? '#FFD700' : i >= 7 ? colors.primary : i >= 5 ? colors.secondary : colors.textSecondary} />
                ))}
              </View>
            </AnimatedEntry>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  sectionTitle: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary, letterSpacing: 2, marginBottom: spacing.sm, marginTop: spacing.md },
  chartCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md },
  empty: { borderRadius: borderRadius.lg, overflow: 'hidden', marginTop: spacing.xl },
  emptyGradient: { alignItems: 'center', paddingVertical: spacing.xxl, borderRadius: borderRadius.lg },
  emptyText: { fontSize: fontSize.lg, color: colors.textSecondary, fontWeight: '600', marginTop: spacing.md },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
});
