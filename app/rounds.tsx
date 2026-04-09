import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { getLiveRounds } from '../lib/storage';
import GradientCard from '../components/GradientCard';
import AnimatedEntry from '../components/AnimatedEntry';
import { useScreenTracking } from '../lib/useAnalytics';
import type { LiveRound } from '../lib/types';

export default function RoundsScreen() {
  useScreenTracking('rounds');
  const router = useRouter();
  const [rounds, setRounds] = useState<LiveRound[]>([]);
  const [filter, setFilter] = useState<'all' | 'competition' | 'practice' | 'fun'>('all');

  useFocusEffect(useCallback(() => {
    getLiveRounds().then(setRounds);
  }, []));

  const filtered = filter === 'all' ? rounds : rounds.filter((r) => r.mode === filter);

  const getShooterTotal = (round: LiveRound, shooterId: string): number => {
    return round.targets.reduce((sum, t) => sum + (t.scores[shooterId] || 0), 0);
  };

  const getRoundAvg = (round: LiveRound): string => {
    if (round.shooters.length === 0 || round.targets.length === 0) return '0';
    const firstShooter = round.shooters[0];
    const scored = round.targets.filter((t) => t.scores[firstShooter.id] !== undefined);
    if (scored.length === 0) return '0';
    const total = scored.reduce((sum, t) => sum + (t.scores[firstShooter.id] || 0), 0);
    return (total / scored.length).toFixed(1);
  };

  const modeColors: Record<string, string> = {
    competition: colors.danger,
    practice: colors.secondary,
    fun: colors.primary,
  };

  return (
    <>
      <View style={styles.container}>
        {/* Filters */}
        <View style={styles.filterWrap}>
          {(['all', 'competition', 'practice', 'fun'] as const).map((f) => (
            <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}>
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Showing filter label */}
        <Text style={styles.filterLabel}>
          Showing {filter === 'all' ? 'all' : `only ${filter}`} rounds
        </Text>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const firstShooter = item.shooters[0];
            const total = firstShooter ? getShooterTotal(item, firstShooter.id) : 0;
            const avg = getRoundAvg(item);
            const mc = modeColors[item.mode] || colors.textSecondary;

            return (
              <GradientCard onPress={() => router.push({ pathname: '/score-live', params: { id: item.id } })}>
                <View style={styles.roundHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roundName}>{item.name}</Text>
                    <Text style={styles.roundDate}>
                      {new Date(item.date).toLocaleDateString()}    Avg: {avg}
                    </Text>
                  </View>
                  <Text style={styles.roundTotal}>{total}</Text>
                </View>
                <View style={styles.roundTags}>
                  <View style={[styles.modeBadge, { backgroundColor: mc + '20' }]}>
                    <Text style={[styles.modeBadgeText, { color: mc }]}>{item.mode}</Text>
                  </View>
                  <View style={[styles.formatBadge, { backgroundColor: item.format === 'asa' ? '#00AA0020' : '#0066CC20' }]}>
                    <Text style={[styles.formatBadgeText, { color: item.format === 'asa' ? '#00AA00' : '#0066CC' }]}>{item.format.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.targetCount}>{item.totalTargets} targets</Text>
                  <Text style={styles.shooterCount}>{item.shooters.length} shooter{item.shooters.length !== 1 ? 's' : ''}</Text>
                  {item.completed && <Ionicons name="checkmark-circle" size={14} color={colors.primary} />}
                  {!item.completed && <Ionicons name="ellipsis-horizontal-circle" size={14} color={colors.warning} />}
                </View>
              </GradientCard>
            );
          }}
          ListEmptyComponent={
            <AnimatedEntry>
              <View style={styles.empty}>
                <LinearGradient colors={[colors.surface, colors.background] as [string, string]} style={styles.emptyGradient}>
                  <Ionicons name="trophy-outline" size={56} color={colors.textMuted} />
                  <Text style={styles.emptyText}>No rounds yet</Text>
                  <Text style={styles.emptySubtext}>Start a new round to begin scoring</Text>
                </LinearGradient>
              </View>
            </AnimatedEntry>
          }
        />

        {/* FAB */}
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/score-round')} activeOpacity={0.8}>
          <LinearGradient colors={[...gradients.primaryToSecondary] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fabGradient}>
            <Ionicons name="add" size={28} color={colors.background} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterWrap: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  filterText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary },
  filterTextActive: { color: colors.primary },
  filterLabel: { fontSize: fontSize.xs, color: colors.textMuted, paddingHorizontal: spacing.md, paddingTop: spacing.xs, paddingBottom: spacing.sm },
  list: { padding: spacing.md, paddingBottom: 100 },
  roundHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  roundName: { fontSize: fontSize.lg, fontWeight: '900', color: colors.text },
  roundDate: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  roundTotal: { fontSize: fontSize.xxl, fontWeight: '900', color: colors.primary },
  roundTags: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, alignItems: 'center', flexWrap: 'wrap' },
  modeBadge: { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  modeBadgeText: { fontSize: fontSize.xs, fontWeight: '700', textTransform: 'capitalize' },
  formatBadge: { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  formatBadgeText: { fontSize: fontSize.xs, fontWeight: '800' },
  targetCount: { fontSize: fontSize.xs, color: colors.textSecondary },
  shooterCount: { fontSize: fontSize.xs, color: colors.textSecondary },
  empty: { borderRadius: borderRadius.lg, overflow: 'hidden', marginTop: spacing.xl },
  emptyGradient: { alignItems: 'center', paddingVertical: spacing.xxl, borderRadius: borderRadius.lg },
  emptyText: { fontSize: fontSize.lg, color: colors.textSecondary, fontWeight: '600', marginTop: spacing.md },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, overflow: 'hidden', elevation: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  fabGradient: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
});
