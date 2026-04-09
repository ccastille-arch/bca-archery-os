import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, isSupabaseConfigured, PLATFORM_FEE_PERCENT } from '../lib/supabase';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import GradientCard from '../components/GradientCard';
import AnimatedEntry from '../components/AnimatedEntry';
import type { Expert } from '../lib/types';
import { useFocusEffect } from 'expo-router';
import { useScreenTracking } from '../lib/useAnalytics';

const DURATION_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '60 min', value: 60 },
];

export default function BookingScreen() {
  useScreenTracking('booking');
  const router = useRouter();
  const { expertId, type } = useLocalSearchParams<{ expertId: string; type: 'live' | 'message' }>();
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form state
  const [scheduledAt, setScheduledAt] = useState('');
  const [message, setMessage] = useState('');
  const [duration, setDuration] = useState(30);

  useFocusEffect(
    useCallback(() => {
      if (!isSupabaseConfigured() || !expertId) {
        setLoading(false);
        return;
      }
      loadExpert();
    }, [expertId])
  );

  const loadExpert = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('experts')
        .select('*')
        .eq('id', expertId)
        .single();

      if (error) throw error;
      setExpert(data);
    } catch (err) {
      console.error('Error loading expert:', err);
    } finally {
      setLoading(false);
    }
  };

  const isLive = type === 'live';
  const baseRate = expert ? (isLive ? Number(expert.live_rate) : Number(expert.message_rate)) : 0;
  const multiplier = isLive ? duration / 30 : 1;
  const serviceFee = baseRate * multiplier;
  const platformFee = serviceFee * (PLATFORM_FEE_PERCENT / 100);
  const total = serviceFee + platformFee;
  const expertPayout = serviceFee;

  const handleSubmit = async () => {
    if (isLive && !scheduledAt.trim()) {
      Alert.alert('Required', 'Please enter a date and time for your session');
      return;
    }
    if (!isLive && !message.trim()) {
      Alert.alert('Required', 'Please describe your question');
      return;
    }

    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Sign In Required', 'Please sign in to book an expert');
        return;
      }

      const bookingData: any = {
        expert_id: expertId,
        user_id: user.id,
        service_type: type,
        status: 'pending',
        amount: total,
        platform_fee: platformFee,
        expert_payout: expertPayout,
        duration_min: isLive ? duration : 0,
      };

      if (isLive && scheduledAt.trim()) {
        bookingData.scheduled_at = new Date(scheduledAt.trim()).toISOString();
      }

      if (message.trim()) {
        bookingData.message = message.trim();
      }

      const { error } = await supabase.from('bookings').insert(bookingData);
      if (error) throw error;

      setSuccess(true);
    } catch (err) {
      console.error('Error creating booking:', err);
      Alert.alert('Error', 'Failed to submit booking request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Book Expert', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
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
        <Stack.Screen options={{ title: 'Book Expert', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (success) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Booking Sent', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
        <View style={styles.centered}>
          <AnimatedEntry>
            <View style={styles.successContainer}>
              <LinearGradient
                colors={[colors.primary + '20', colors.primary + '05'] as [string, string]}
                style={styles.successGradient}
              >
                <Ionicons name="checkmark-circle" size={72} color={colors.primary} />
                <Text style={styles.successTitle}>Request Sent!</Text>
                <Text style={styles.successSubtitle}>The expert will respond soon.</Text>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.back()}
                >
                  <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </AnimatedEntry>
        </View>
      </View>
    );
  }

  if (!expert) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Book Expert', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
        <View style={styles.centered}><Text style={styles.loadingText}>Expert not found</Text></View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: isLive ? 'Book Live Session' : 'Send Question',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Expert Info */}
        <AnimatedEntry>
          <GradientCard accentColors={isLive ? ['#00FF88', '#00C9FF'] : ['#00A3FF', '#7B68EE']}>
            <View style={styles.expertRow}>
              <Ionicons name="person-circle" size={44} color={colors.textSecondary} />
              <View style={styles.expertInfo}>
                <Text style={styles.expertName}>{expert.name}</Text>
                <Text style={styles.serviceType}>
                  {isLive ? 'Live Video Session' : 'Message Support'}
                </Text>
              </View>
              <View style={styles.rateBadge}>
                <Text style={styles.rateText}>
                  ${baseRate.toFixed(0)}{isLive ? '/30min' : ''}
                </Text>
              </View>
            </View>
          </GradientCard>
        </AnimatedEntry>

        {/* Duration Selector (Live only) */}
        {isLive && (
          <AnimatedEntry delay={80}>
            <Text style={styles.inputLabel}>Session Duration</Text>
            <View style={styles.durationRow}>
              {DURATION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.durationChip,
                    duration === opt.value && styles.durationChipActive,
                  ]}
                  onPress={() => setDuration(opt.value)}
                >
                  <Text
                    style={[
                      styles.durationChipText,
                      duration === opt.value && styles.durationChipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </AnimatedEntry>
        )}

        {/* Date/Time (Live only) */}
        {isLive && (
          <AnimatedEntry delay={160}>
            <Text style={styles.inputLabel}>Date & Time</Text>
            <TextInput
              style={styles.textInput}
              value={scheduledAt}
              onChangeText={setScheduledAt}
              placeholder="YYYY-MM-DD HH:MM"
              placeholderTextColor={colors.textMuted}
            />
          </AnimatedEntry>
        )}

        {/* Message (Message type) */}
        {!isLive && (
          <AnimatedEntry delay={80}>
            <Text style={styles.inputLabel}>Your Question</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder="Describe your question or what you need help with"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={6}
            />
          </AnimatedEntry>
        )}

        {/* Pricing Breakdown */}
        <AnimatedEntry delay={isLive ? 240 : 160}>
          <View style={styles.pricingCard}>
            <Text style={styles.pricingTitle}>Pricing Breakdown</Text>

            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>
                Service fee {isLive && duration === 60 ? '(60 min)' : isLive ? '(30 min)' : ''}
              </Text>
              <Text style={styles.pricingValue}>${serviceFee.toFixed(2)}</Text>
            </View>

            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Platform fee ({PLATFORM_FEE_PERCENT}%)</Text>
              <Text style={styles.pricingValue}>${platformFee.toFixed(2)}</Text>
            </View>

            <View style={styles.pricingDivider} />

            <View style={styles.pricingRow}>
              <Text style={styles.pricingTotal}>Total</Text>
              <Text style={styles.pricingTotalValue}>${total.toFixed(2)}</Text>
            </View>

            <View style={[styles.pricingRow, { marginTop: spacing.sm }]}>
              <Text style={styles.payoutLabel}>Expert receives</Text>
              <Text style={styles.payoutValue}>${expertPayout.toFixed(2)}</Text>
            </View>
          </View>
        </AnimatedEntry>

        {/* Submit */}
        <AnimatedEntry delay={isLive ? 320 : 240}>
          <TouchableOpacity activeOpacity={0.8} onPress={handleSubmit} disabled={submitting}>
            <LinearGradient
              colors={isLive
                ? [...gradients.primaryToSecondary] as [string, string]
                : ['#00A3FF', '#7B68EE'] as [string, string]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButton}
            >
              {submitting ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <>
                  <Ionicons
                    name={isLive ? 'videocam' : 'send'}
                    size={20}
                    color={colors.background}
                  />
                  <Text style={styles.submitButtonText}>Submit Request</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </AnimatedEntry>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md, paddingBottom: 100 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  loadingText: { fontSize: fontSize.md, color: colors.textSecondary },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  placeholderGradient: { alignItems: 'center', padding: spacing.xxl, borderRadius: borderRadius.lg, width: '100%' },
  placeholderText: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: '600', marginTop: spacing.md, textAlign: 'center' },

  // Expert info
  expertRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  expertInfo: { flex: 1 },
  expertName: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  serviceType: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  rateBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  rateText: { fontSize: fontSize.md, fontWeight: '800', color: colors.primary },

  // Form
  inputLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600', marginBottom: spacing.xs, marginTop: spacing.lg },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  durationRow: { flexDirection: 'row', gap: spacing.sm },
  durationChip: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  durationChipActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  durationChipText: { fontSize: fontSize.md, fontWeight: '600', color: colors.textSecondary },
  durationChipTextActive: { color: colors.primary },

  // Pricing
  pricingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pricingTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  pricingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  pricingLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  pricingValue: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },
  pricingDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  pricingTotal: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  pricingTotalValue: { fontSize: fontSize.lg, fontWeight: '800', color: colors.primary },
  payoutLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  payoutValue: { fontSize: fontSize.sm, fontWeight: '700', color: colors.primary },

  // Submit
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 2,
    marginTop: spacing.lg,
  },
  submitButtonText: { fontSize: fontSize.md, fontWeight: '700', color: colors.background },

  // Success
  successContainer: { width: '100%' },
  successGradient: {
    alignItems: 'center',
    padding: spacing.xxl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  successTitle: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  successSubtitle: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.xs },
  backButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: { fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
});
