import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { getTournaments, getBowConfigs } from '../lib/storage';
import GradientCard from '../components/GradientCard';
import AnimatedEntry from '../components/AnimatedEntry';
import type { Tournament, BowConfig } from '../lib/types';
import { ROUND_FORMAT_LABELS, SCORING_MODE_LABELS } from '../lib/types';

const ORG_COLORS: Record<string, string> = {
  'asa': '#FF6B35',
  'ibo': '#4CAF50',
  'nfaa': '#2196F3',
  'usa-archery': '#E53935',
  'wa': '#9C27B0',
  'local': colors.textSecondary,
  'other': colors.textMuted,
};

export default function TournamentsScreen() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [bows, setBows] = useState<BowConfig[]>([]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getTournaments(), getBowConfigs()]).then(([t, b]) => {
        setTournaments(t);
        setBows(b);
      });
    }, [])
  );

  const getBowName = (id?: string) => bows.find((b) => b.id === id)?.name;

  const renderTournament = ({ item, index }: { item: Tournament; index: number }) => {
    const orgColor = ORG_COLORS[item.organization] || colors.textMuted;
    const bowName = getBowName(item.bowConfigId);
    const dateStr = item.date ? new Date(item.date).toLocaleDateString() : '';
    const scorePercent = item.maxPossible > 0
      ? Math.round((item.totalScore / item.maxPossible) * 100)
      : null;

    return (
      <AnimatedEntry delay={index * 60}>
        <GradientCard
          onPress={() => router.push({ pathname: '/tournament-detail', params: { id: item.id } })}
          accentColors={[...gradients.cardAccent]}
        >
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tournName} numberOfLines={1}>{item.name || 'Unnamed Tournament'}</Text>
              {dateStr ? <Text style={styles.tournDate}>{dateStr}</Text> : null}
            </View>
            <View style={[styles.orgBadge, { backgroundColor: orgColor + '20', borderColor: orgColor }]}>
              <Text style={[styles.orgBadgeText, { color: orgColor }]}>{item.organization.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.scoreRow}>
            <View style={styles.scoreBlock}>
              <Text style={styles.scoreValue}>{item.totalScore}</Text>
              <Text style={styles.scoreLabel}>
                / {item.maxPossible > 0 ? item.maxPossible : '---'}
              </Text>
              {scorePercent !== null && (
                <Text style={styles.scorePercent}> ({scorePercent}%)</Text>
              )}
            </View>
            {item.placement ? (
              <View style={styles.placementBadge}>
                <Ionicons name="trophy" size={12} color={colors.warning} />
                <Text style={styles.placementText}>{item.placement}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.tagRow}>
            {item.bowClass ? (
              <View style={styles.tag}>
                <Ionicons name="fitness" size={10} color={colors.primary} />
                <Text style={styles.tagText}>{item.bowClass}</Text>
              </View>
            ) : null}
            {bowName ? (
              <View style={[styles.tag, { backgroundColor: colors.secondary + '15' }]}>
                <Ionicons name="ellipse" size={8} color={colors.secondary} />
                <Text style={[styles.tagText, { color: colors.secondary }]}>{bowName}</Text>
              </View>
            ) : null}
          </View>
        </GradientCard>
      </AnimatedEntry>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={tournaments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderTournament}
        ListEmptyComponent={
          <View style={styles.empty}>
            <LinearGradient
              colors={[colors.surface, colors.background] as [string, string]}
              style={styles.emptyGradient}
            >
              <Ionicons name="trophy-outline" size={56} color={colors.textMuted} />
              <Text style={styles.emptyText}>No tournaments yet</Text>
              <Text style={styles.emptySubtext}>Tap + to log your first tournament result</Text>
            </LinearGradient>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/tournament-detail')} activeOpacity={0.8}>
        <LinearGradient
          colors={[...gradients.primaryToSecondary] as [string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={24} color={colors.background} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, paddingBottom: 100 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  tournName: { fontSize: fontSize.md, color: colors.text, fontWeight: '700' },
  tournDate: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  orgBadge: {
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: borderRadius.full, borderWidth: 1, marginLeft: spacing.sm,
  },
  orgBadgeText: { fontSize: fontSize.xs, fontWeight: '800', letterSpacing: 1 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  scoreBlock: { flexDirection: 'row', alignItems: 'baseline' },
  scoreValue: { fontSize: fontSize.xl, fontWeight: '800', color: colors.primary },
  scoreLabel: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: '600' },
  scorePercent: { fontSize: fontSize.sm, color: colors.textMuted },
  placementBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.warning + '20', borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  placementText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.warning },
  tagRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary + '15', borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  tagText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.primary },
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
