import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { getSightProfiles } from '../lib/storage';
import GradientCard from '../components/GradientCard';
import type { SightProfile } from '../lib/types';

export default function SightsScreen() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<SightProfile[]>([]);

  useFocusEffect(
    useCallback(() => {
      getSightProfiles().then(setProfiles);
    }, [])
  );

  const renderProfile = ({ item }: { item: SightProfile }) => (
    <GradientCard
      onPress={() => router.push({ pathname: '/sight-detail', params: { id: item.id } })}
      accentColors={['#00A3FF', '#00C9FF', '#00FF88']}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.profileName}>{item.name}</Text>
          <Text style={styles.bowName}>{item.bowName}</Text>
        </View>
        <View style={styles.markCount}>
          <Text style={styles.markCountNum}>{item.marks.length}</Text>
          <Text style={styles.markCountLabel}>marks</Text>
        </View>
      </View>
      {item.arrowSetup ? (
        <Text style={styles.arrowSetup}>
          <Ionicons name="arrow-forward" size={12} color={colors.textMuted} /> {item.arrowSetup}
        </Text>
      ) : null}
      {item.marks.length > 0 && (
        <View style={styles.marksPreview}>
          {item.marks.slice(0, 5).map((m, i) => (
            <View key={i} style={styles.markChip}>
              <Text style={styles.markDistance}>{m.distance}m</Text>
              <Text style={styles.markValue}>{m.mark.toFixed(1)}</Text>
            </View>
          ))}
          {item.marks.length > 5 && (
            <Text style={styles.moreMarks}>+{item.marks.length - 5}</Text>
          )}
        </View>
      )}
    </GradientCard>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderProfile}
        ListEmptyComponent={
          <View style={styles.empty}>
            <LinearGradient
              colors={[colors.surface, colors.background] as [string, string]}
              style={styles.emptyGradient}
            >
              <Ionicons name="build-outline" size={56} color={colors.textMuted} />
              <Text style={styles.emptyText}>No sight profiles yet</Text>
              <Text style={styles.emptySubtext}>Tap + to create your first setup</Text>
            </LinearGradient>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/sight-detail')} activeOpacity={0.8}>
        <LinearGradient
          colors={['#00A3FF', '#00FF88'] as [string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  profileName: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  bowName: { fontSize: fontSize.sm, color: colors.secondary, fontWeight: '600', marginTop: 2 },
  markCount: {
    alignItems: 'center', backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
  },
  markCountNum: { fontSize: fontSize.lg, fontWeight: '800', color: colors.primary },
  markCountLabel: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600' },
  arrowSetup: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.sm },
  marksPreview: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  markChip: {
    backgroundColor: colors.surfaceLight, borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, alignItems: 'center',
  },
  markDistance: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '600' },
  markValue: { fontSize: fontSize.sm, color: colors.secondary, fontWeight: '700' },
  moreMarks: { fontSize: fontSize.sm, color: colors.textMuted, alignSelf: 'center', marginLeft: spacing.xs },
  empty: { borderRadius: borderRadius.lg, overflow: 'hidden', marginTop: spacing.xxl },
  emptyGradient: { alignItems: 'center', paddingVertical: spacing.xxl, borderRadius: borderRadius.lg },
  emptyText: { fontSize: fontSize.lg, color: colors.textSecondary, fontWeight: '600', marginTop: spacing.md },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28,
    overflow: 'hidden', elevation: 8, shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  fabGradient: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
});
