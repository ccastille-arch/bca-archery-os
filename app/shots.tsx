import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { getShots, getBowConfigs, getArrowConfigs } from '../lib/storage';
import GradientCard from '../components/GradientCard';
import { useScreenTracking } from '../lib/useAnalytics';
import type { ShotEnd, BowConfig, ArrowConfig } from '../lib/types';

export default function ShotsScreen() {
  useScreenTracking('shots');
  const router = useRouter();
  const [shots, setShots] = useState<ShotEnd[]>([]);
  const [bows, setBows] = useState<BowConfig[]>([]);
  const [arrows, setArrows] = useState<ArrowConfig[]>([]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getShots(), getBowConfigs(), getArrowConfigs()]).then(([s, b, a]) => {
        setShots(s);
        setBows(b);
        setArrows(a);
      });
    }, [])
  );

  const getBowName = (id?: string) => bows.find((b) => b.id === id)?.name;
  const getArrowName = (id?: string) => arrows.find((a) => a.id === id)?.name;

  const renderShot = ({ item, index }: { item: ShotEnd; index: number }) => {
    const avg = item.scores.length > 0
      ? (item.scores.reduce((a, b) => a + b, 0) / item.scores.length).toFixed(1)
      : '—';
    const total = item.scores.reduce((a, b) => a + b, 0);
    const bowName = getBowName(item.bowConfigId);
    const arrowName = getArrowName(item.arrowConfigId);

    return (
      <GradientCard onPress={() => router.push({ pathname: '/shot-detail', params: { id: item.id } })}>
        <View style={styles.header}>
          <Text style={styles.distance}>{item.distance}m</Text>
          <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
        {(bowName || arrowName) && (
          <View style={styles.gearTags}>
            {bowName && (
              <View style={styles.gearTag}>
                <Ionicons name="fitness" size={10} color={colors.primary} />
                <Text style={styles.gearTagText}>{bowName}</Text>
              </View>
            )}
            {arrowName && (
              <View style={[styles.gearTag, { backgroundColor: colors.secondary + '15' }]}>
                <Ionicons name="arrow-forward" size={10} color={colors.secondary} />
                <Text style={[styles.gearTagText, { color: colors.secondary }]}>{arrowName}</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.scores}>
          {item.scores.map((s, i) => (
            <View
              key={i}
              style={[
                styles.scoreBadge,
                { backgroundColor: s >= 9 ? colors.primary + '30' : s >= 7 ? colors.secondary + '30' : colors.surfaceLight },
              ]}
            >
              <Text style={[styles.scoreText, { color: s >= 9 ? colors.primary : s >= 7 ? colors.secondary : colors.textSecondary }]}>
                {s === 10 ? 'X' : s}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.footer}>
          <Text style={styles.stat}>Total: <Text style={{ color: colors.primary }}>{total}</Text></Text>
          <Text style={styles.stat}>Avg: <Text style={{ color: colors.secondary }}>{avg}</Text></Text>
          <Text style={styles.stat}>{item.arrowCount} arrows</Text>
        </View>
      </GradientCard>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={shots}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderShot}
        ListEmptyComponent={
          <View style={styles.empty}>
            <LinearGradient
              colors={[colors.surface, colors.background] as [string, string]}
              style={styles.emptyGradient}
            >
              <Ionicons name="locate-outline" size={56} color={colors.textMuted} />
              <Text style={styles.emptyText}>No shots logged yet</Text>
              <Text style={styles.emptySubtext}>Tap + to log your first end</Text>
            </LinearGradient>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/shot-detail')} activeOpacity={0.8}>
        <LinearGradient
          colors={[...gradients.primaryToSecondary] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color={colors.background} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, paddingBottom: 100 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs,
  },
  distance: { fontSize: fontSize.lg, fontWeight: '800', color: colors.primary },
  date: { fontSize: fontSize.sm, color: colors.textSecondary },
  gearTags: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm },
  gearTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary + '15', borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  gearTagText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.primary },
  scores: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  scoreBadge: { width: 32, height: 32, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  scoreText: { fontSize: fontSize.md, fontWeight: '700' },
  footer: { flexDirection: 'row', gap: spacing.md },
  stat: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  empty: { borderRadius: borderRadius.lg, overflow: 'hidden', marginTop: spacing.xxl },
  emptyGradient: { alignItems: 'center', paddingVertical: spacing.xxl, borderRadius: borderRadius.lg },
  emptyText: { fontSize: fontSize.lg, color: colors.textSecondary, fontWeight: '600', marginTop: spacing.md },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28,
    overflow: 'hidden', elevation: 8, shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  fabGradient: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
});
