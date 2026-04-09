import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import GradientCard from '../components/GradientCard';
import AnimatedEntry from '../components/AnimatedEntry';
import type { Expert } from '../lib/types';
import { EXPERT_SPECIALTIES } from '../lib/types';
import { useFocusEffect } from 'expo-router';

const AVAILABILITY_FILTERS = ['All', 'Available Now', 'Busy'] as const;

const AVAILABILITY_COLORS: Record<string, string> = {
  available: '#00FF88',
  busy: '#FFB800',
  offline: '#555555',
};

const SPECIALTY_COLORS: string[] = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1',
  '#DDA0DD', '#F7DC6F', '#82E0AA', '#85C1E9', '#F0B27A',
];

export default function ExpertsScreen() {
  const router = useRouter();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }
      loadExperts();
    }, [])
  );

  const loadExperts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('experts')
        .select('*, profiles(*)')
        .order('rating', { ascending: false });

      if (error) throw error;
      setExperts(data || []);
    } catch (err) {
      console.error('Error loading experts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredExperts = experts.filter((expert) => {
    if (selectedSpecialty && !expert.specialties?.includes(selectedSpecialty)) {
      return false;
    }
    if (availabilityFilter === 'Available Now' && expert.availability_status !== 'available') {
      return false;
    }
    if (availabilityFilter === 'Busy' && expert.availability_status !== 'busy') {
      return false;
    }
    return true;
  });

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? 'star' : 'star-outline'}
          size={14}
          color={i <= Math.round(rating) ? '#FFB800' : colors.textMuted}
        />
      );
    }
    return stars;
  };

  if (!isSupabaseConfigured()) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Expert Coaches', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
        <View style={styles.placeholder}>
          <LinearGradient colors={[colors.surface, colors.background] as [string, string]} style={styles.placeholderGradient}>
            <Ionicons name="lock-closed" size={56} color={colors.textMuted} />
            <Text style={styles.placeholderText}>Connect to Supabase to unlock expert features</Text>
          </LinearGradient>
        </View>
      </View>
    );
  }

  const renderExpert = ({ item, index }: { item: Expert; index: number }) => (
    <AnimatedEntry delay={index * 80}>
      <GradientCard
        onPress={() => router.push({ pathname: '/expert-profile', params: { id: item.id } })}
        accentColors={item.availability_status === 'available' ? ['#00FF88', '#00C9FF'] : ['#555555', '#333333']}
      >
        <View style={styles.expertHeader}>
          <View style={styles.expertInfo}>
            <Ionicons name="person-circle" size={48} color={colors.textSecondary} />
            <View style={styles.expertNameBlock}>
              <View style={styles.nameRow}>
                <Text style={styles.expertName}>{item.name}</Text>
                <View style={[styles.statusDot, { backgroundColor: AVAILABILITY_COLORS[item.availability_status] || colors.textMuted }]} />
              </View>
              <View style={styles.ratingRow}>
                {renderStars(item.rating)}
                <Text style={styles.sessionsCount}>({item.total_sessions} sessions)</Text>
              </View>
            </View>
          </View>
        </View>

        {item.specialties && item.specialties.length > 0 && (
          <View style={styles.specialtiesRow}>
            {item.specialties.map((spec, i) => {
              const colorIdx = EXPERT_SPECIALTIES.indexOf(spec as any);
              const tagColor = SPECIALTY_COLORS[colorIdx >= 0 ? colorIdx : i % SPECIALTY_COLORS.length];
              return (
                <View key={spec} style={[styles.specialtyTag, { backgroundColor: tagColor + '20' }]}>
                  <Text style={[styles.specialtyTagText, { color: tagColor }]}>{spec}</Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.priceRow}>
          <View style={[styles.priceBadge, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="videocam" size={12} color={colors.primary} />
            <Text style={[styles.priceText, { color: colors.primary }]}>Live: ${Number(item.live_rate).toFixed(0)}/30min</Text>
          </View>
          <View style={[styles.priceBadge, { backgroundColor: colors.secondary + '15' }]}>
            <Ionicons name="chatbubble" size={12} color={colors.secondary} />
            <Text style={[styles.priceText, { color: colors.secondary }]}>Message: ${Number(item.message_rate).toFixed(0)}</Text>
          </View>
        </View>

        {item.credentials ? (
          <Text style={styles.credentials} numberOfLines={1}>{item.credentials}</Text>
        ) : null}
      </GradientCard>
    </AnimatedEntry>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Expert Coaches', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />

      <FlatList
        data={filteredExperts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderExpert}
        ListHeaderComponent={
          <View>
            <AnimatedEntry>
              <Text style={styles.sectionLabel}>Specialty</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipRow}>
                <TouchableOpacity
                  style={[styles.chip, !selectedSpecialty && styles.chipActive]}
                  onPress={() => setSelectedSpecialty(null)}
                >
                  <Text style={[styles.chipText, !selectedSpecialty && styles.chipTextActive]}>All</Text>
                </TouchableOpacity>
                {EXPERT_SPECIALTIES.map((spec) => (
                  <TouchableOpacity
                    key={spec}
                    style={[styles.chip, selectedSpecialty === spec && styles.chipActive]}
                    onPress={() => setSelectedSpecialty(selectedSpecialty === spec ? null : spec)}
                  >
                    <Text style={[styles.chipText, selectedSpecialty === spec && styles.chipTextActive]}>{spec}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </AnimatedEntry>

            <AnimatedEntry delay={100}>
              <Text style={styles.sectionLabel}>Availability</Text>
              <View style={styles.chipRow}>
                {AVAILABILITY_FILTERS.map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.chip, availabilityFilter === filter && styles.chipActive]}
                    onPress={() => setAvailabilityFilter(filter)}
                  >
                    <Text style={[styles.chipText, availabilityFilter === filter && styles.chipTextActive]}>{filter}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </AnimatedEntry>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <LinearGradient colors={[colors.surface, colors.background] as [string, string]} style={styles.emptyGradient}>
              <Ionicons name="people-outline" size={56} color={colors.textMuted} />
              <Text style={styles.emptyText}>No experts available yet</Text>
              <Text style={styles.emptySubtext}>Check back soon for expert archery coaches</Text>
            </LinearGradient>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, paddingBottom: 100 },
  sectionLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600', marginBottom: spacing.xs, marginTop: spacing.sm },
  chipScroll: { marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  chipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.primary },
  expertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  expertInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  expertNameBlock: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  expertName: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  sessionsCount: { fontSize: fontSize.xs, color: colors.textSecondary, marginLeft: spacing.xs },
  specialtiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  specialtyTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  specialtyTagText: { fontSize: fontSize.xs, fontWeight: '600' },
  priceRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  priceText: { fontSize: fontSize.sm, fontWeight: '700' },
  credentials: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
  empty: { borderRadius: borderRadius.lg, overflow: 'hidden', marginTop: spacing.xxl },
  emptyGradient: { alignItems: 'center', paddingVertical: spacing.xxl, borderRadius: borderRadius.lg },
  emptyText: { fontSize: fontSize.lg, color: colors.textSecondary, fontWeight: '600', marginTop: spacing.md },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  placeholderGradient: { alignItems: 'center', padding: spacing.xxl, borderRadius: borderRadius.lg, width: '100%' },
  placeholderText: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: '600', marginTop: spacing.md, textAlign: 'center' },
});
