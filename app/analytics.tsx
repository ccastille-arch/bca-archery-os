import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useFocusEffect, Stack } from 'expo-router';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../lib/theme';
import { getShots } from '../lib/storage';
import StatCard from '../components/StatCard';
import type { ShotEnd } from '../lib/types';

const screenWidth = Dimensions.get('window').width - spacing.md * 2;

const chartConfig = {
  backgroundColor: colors.surface,
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  decimalCount: 1,
  color: (opacity = 1) => `rgba(0, 255, 136, ${opacity})`,
  labelColor: () => colors.textSecondary,
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: colors.primary,
  },
  propsForBackgroundLines: {
    stroke: colors.border,
  },
};

export default function AnalyticsScreen() {
  const [shots, setShots] = useState<ShotEnd[]>([]);

  useFocusEffect(
    useCallback(() => {
      getShots().then(setShots);
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

  // Score trend (last 15 ends)
  const recentEnds = shots.slice(0, 15).reverse();
  const trendData = recentEnds.length > 1
    ? {
        labels: recentEnds.map((_, i) => (i % 3 === 0 ? `${i + 1}` : '')),
        datasets: [
          {
            data: recentEnds.map(
              (s) => s.scores.reduce((a, b) => a + b, 0) / s.scores.length
            ),
          },
        ],
      }
    : null;

  // Average by distance
  const distanceMap = new Map<number, number[]>();
  shots.forEach((s) => {
    const avg = s.scores.reduce((a, b) => a + b, 0) / s.scores.length;
    const existing = distanceMap.get(s.distance) || [];
    existing.push(avg);
    distanceMap.set(s.distance, existing);
  });
  const distanceSorted = [...distanceMap.entries()].sort((a, b) => a[0] - b[0]);
  const distanceData = distanceSorted.length > 0
    ? {
        labels: distanceSorted.map(([d]) => `${d}m`),
        datasets: [
          {
            data: distanceSorted.map(
              ([, avgs]) => avgs.reduce((a, b) => a + b, 0) / avgs.length
            ),
          },
        ],
      }
    : null;

  // Score distribution
  const distribution = new Array(11).fill(0);
  allScores.forEach((s) => {
    if (s >= 0 && s <= 10) distribution[s]++;
  });
  const distData = {
    labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'X'],
    datasets: [{ data: distribution }],
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'ANALYTICS',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Summary Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Avg Score" value={avgScore} accent={colors.secondary} />
          <StatCard label="Best End" value={bestEnd} accent={colors.primary} />
          <StatCard label="Total Ends" value={totalEnds} accent={colors.secondary} />
        </View>

        {shots.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="bar-chart-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No data yet</Text>
            <Text style={styles.emptySubtext}>Log some shots to see analytics</Text>
          </View>
        ) : (
          <>
            {/* Score Trend */}
            {trendData && (
              <>
                <Text style={styles.sectionTitle}>SCORE TREND (Recent Ends)</Text>
                <View style={styles.chartWrap}>
                  <LineChart
                    data={trendData}
                    width={screenWidth}
                    height={200}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                  />
                </View>
              </>
            )}

            {/* Average by Distance */}
            {distanceData && (
              <>
                <Text style={styles.sectionTitle}>AVERAGE BY DISTANCE</Text>
                <View style={styles.chartWrap}>
                  <BarChart
                    data={distanceData}
                    width={screenWidth}
                    height={200}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(0, 163, 255, ${opacity})`,
                    }}
                    style={styles.chart}
                  />
                </View>
              </>
            )}

            {/* Score Distribution */}
            {allScores.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>SCORE DISTRIBUTION</Text>
                <View style={styles.chartWrap}>
                  <BarChart
                    data={distData}
                    width={screenWidth}
                    height={200}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={chartConfig}
                    style={styles.chart}
                  />
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 2,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  chartWrap: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    overflow: 'hidden',
  },
  chart: {
    borderRadius: borderRadius.md,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
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
