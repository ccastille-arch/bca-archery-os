import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import GradientCard from '../components/GradientCard';
import AnimatedEntry from '../components/AnimatedEntry';
import type { Expert } from '../lib/types';
import { EXPERT_SPECIALTIES } from '../lib/types';
import { useFocusEffect } from 'expo-router';
import { useScreenTracking } from '../lib/useAnalytics';

const AVAILABILITY_COLORS: Record<string, string> = {
  available: '#00FF88',
  busy: '#FFB800',
  offline: '#555555',
};

const AVAILABILITY_LABELS: Record<string, string> = {
  available: 'Available Now',
  busy: 'Busy',
  offline: 'Offline',
};

const SPECIALTY_COLORS: string[] = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1',
  '#DDA0DD', '#F7DC6F', '#82E0AA', '#85C1E9', '#F0B27A',
];

export default function ExpertProfileScreen() {
  useScreenTracking('expert-profile');
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!isSupabaseConfigured() || !id) {
        setLoading(false);
        return;
      }
      loadExpert();
    }, [id])
  );

  const loadExpert = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('experts')
        .select('*, profiles(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setExpert(data);
    } catch (err) {
      console.error('Error loading expert:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? 'star' : 'star-outline'}
          size={18}
          color={i <= Math.round(rating) ? '#FFB800' : colors.textMuted}
        />
      );
    }
    return stars;
  };

  if (!isSupabaseConfigured()) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Expert Profile', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
        <View style={styles.placeholder}>
          <LinearGradient colors={[colors.surface, colors.background] as [string, string]} style={styles.placeholderGradient}>
            <Ionicons name="lock-closed" size={56} color={colors.textMuted} />
            <Text style={styles.placeholderText}>Connect to Supabase to unlock expert features</Text>
          </LinearGradient>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Expert Profile', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
        <View style={styles.centered}><Text style={styles.loadingText}>Loading...</Text></View>
      </View>
    );
  }

  if (!expert) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Expert Profile', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
        <View style={styles.centered}><Text style={styles.loadingText}>Expert not found</Text></View>
      </View>
    );
  }

  const statusColor = AVAILABILITY_COLORS[expert.availability_status] || colors.textMuted;
  const statusLabel = AVAILABILITY_LABELS[expert.availability_status] || 'Unknown';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: expert.name, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Availability Banner */}
        <AnimatedEntry>
          <LinearGradient
            colors={[statusColor + '20', statusColor + '05'] as [string, string]}
            style={styles.availabilityBanner}
          >
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.availabilityText, { color: statusColor }]}>{statusLabel}</Text>
          </LinearGradient>
        </AnimatedEntry>

        {/* Profile Header */}
        <AnimatedEntry delay={80}>
          <View style={styles.profileHeader}>
            <Ionicons name="person-circle" size={80} color={colors.textSecondary} />
            <Text style={styles.expertName}>{expert.name}</Text>

            <View style={styles.ratingRow}>
              {renderStars(expert.rating)}
              <Text style={styles.ratingValue}>{Number(expert.rating).toFixed(1)}</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{expert.total_sessions}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{expert.total_messages}</Text>
                <Text style={styles.statLabel}>Messages</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{Number(expert.rating).toFixed(1)}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>
          </View>
        </AnimatedEntry>

        {/* Bio */}
        {expert.bio ? (
          <AnimatedEntry delay={160}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bioText}>{expert.bio}</Text>
            </View>
          </AnimatedEntry>
        ) : null}

        {/* Specialties */}
        {expert.specialties && expert.specialties.length > 0 && (
          <AnimatedEntry delay={240}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Specialties</Text>
              <View style={styles.specialtiesRow}>
                {expert.specialties.map((spec, i) => {
                  const colorIdx = EXPERT_SPECIALTIES.indexOf(spec as any);
                  const tagColor = SPECIALTY_COLORS[colorIdx >= 0 ? colorIdx : i % SPECIALTY_COLORS.length];
                  return (
                    <View key={spec} style={[styles.specialtyTag, { backgroundColor: tagColor + '20' }]}>
                      <Text style={[styles.specialtyTagText, { color: tagColor }]}>{spec}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </AnimatedEntry>
        )}

        {/* Credentials */}
        {expert.credentials ? (
          <AnimatedEntry delay={320}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Credentials</Text>
              <Text style={styles.credentialsText}>{expert.credentials}</Text>
            </View>
          </AnimatedEntry>
        ) : null}

        {/* Booking Cards */}
        <AnimatedEntry delay={400}>
          <GradientCard accentColors={['#00FF88', '#00C9FF']}>
            <View style={styles.bookingCardHeader}>
              <Ionicons name="videocam" size={28} color={colors.primary} />
              <View style={styles.bookingCardInfo}>
                <Text style={styles.bookingCardTitle}>Live Session</Text>
                <Text style={styles.bookingCardRate}>${Number(expert.live_rate).toFixed(0)} / 30 min</Text>
              </View>
            </View>
            <Text style={styles.bookingCardDesc}>Real-time video call with expert</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: '/booking', params: { expertId: expert.id, type: 'live' } })}
            >
              <LinearGradient
                colors={[...gradients.primaryToSecondary] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bookButton}
              >
                <Text style={styles.bookButtonText}>Book Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </GradientCard>
        </AnimatedEntry>

        <AnimatedEntry delay={480}>
          <GradientCard accentColors={['#00A3FF', '#7B68EE']}>
            <View style={styles.bookingCardHeader}>
              <Ionicons name="chatbubble-ellipses" size={28} color={colors.secondary} />
              <View style={styles.bookingCardInfo}>
                <Text style={styles.bookingCardTitle}>Message Support</Text>
                <Text style={[styles.bookingCardRate, { color: colors.secondary }]}>${Number(expert.message_rate).toFixed(0)} / question</Text>
              </View>
            </View>
            <Text style={styles.bookingCardDesc}>Send your question, get expert advice at their convenience</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: '/booking', params: { expertId: expert.id, type: 'message' } })}
            >
              <LinearGradient
                colors={['#00A3FF', '#7B68EE'] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bookButton}
              >
                <Text style={styles.bookButtonText}>Send Question</Text>
              </LinearGradient>
            </TouchableOpacity>
          </GradientCard>
        </AnimatedEntry>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md, paddingBottom: 100 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: fontSize.md, color: colors.textSecondary },
  availabilityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  availabilityText: { fontSize: fontSize.md, fontWeight: '700' },
  profileHeader: { alignItems: 'center', marginBottom: spacing.lg },
  expertName: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  ratingValue: { fontSize: fontSize.md, color: '#FFB800', fontWeight: '700', marginLeft: spacing.xs },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.border },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  bioText: { fontSize: fontSize.md, color: colors.textSecondary, lineHeight: 22 },
  specialtiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  specialtyTag: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
  },
  specialtyTagText: { fontSize: fontSize.sm, fontWeight: '600' },
  credentialsText: { fontSize: fontSize.md, color: colors.textSecondary, lineHeight: 22 },
  bookingCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  bookingCardInfo: { flex: 1 },
  bookingCardTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  bookingCardRate: { fontSize: fontSize.md, fontWeight: '800', color: colors.primary, marginTop: 2 },
  bookingCardDesc: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 20 },
  bookButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  bookButtonText: { fontSize: fontSize.md, fontWeight: '700', color: colors.background },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  placeholderGradient: { alignItems: 'center', padding: spacing.xxl, borderRadius: borderRadius.lg, width: '100%' },
  placeholderText: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: '600', marginTop: spacing.md, textAlign: 'center' },
});
