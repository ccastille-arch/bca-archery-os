import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, isSupabaseConfigured, PLATFORM_FEE_PERCENT } from '../lib/supabase';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import GradientCard from '../components/GradientCard';
import AnimatedEntry from '../components/AnimatedEntry';
import type { Expert, Booking } from '../lib/types';
import { EXPERT_SPECIALTIES } from '../lib/types';
import { useFocusEffect } from 'expo-router';
import { useScreenTracking } from '../lib/useAnalytics';

const AVAILABILITY_OPTIONS = ['available', 'busy', 'offline'] as const;

const AVAILABILITY_COLORS: Record<string, string> = {
  available: '#00FF88',
  busy: '#FFB800',
  offline: '#555555',
};

const AVAILABILITY_LABELS: Record<string, string> = {
  available: 'Available',
  busy: 'Busy',
  offline: 'Offline',
};

const SPECIALTY_COLORS: string[] = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1',
  '#DDA0DD', '#F7DC6F', '#82E0AA', '#85C1E9', '#F0B27A',
];

export default function ExpertDashboardScreen() {
  useScreenTracking('expert-dashboard');
  const router = useRouter();
  const [expert, setExpert] = useState<Expert | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Setup form state
  const [formName, setFormName] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formCredentials, setFormCredentials] = useState('');
  const [formSpecialties, setFormSpecialties] = useState<string[]>([]);
  const [formLiveRate, setFormLiveRate] = useState('');
  const [formMessageRate, setFormMessageRate] = useState('');

  // Edit mode state
  const [editingRates, setEditingRates] = useState(false);
  const [editLiveRate, setEditLiveRate] = useState('');
  const [editMessageRate, setEditMessageRate] = useState('');

  // Reply state
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  useFocusEffect(
    useCallback(() => {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }
      loadDashboard();
    }, [])
  );

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: expertData, error: expertError } = await supabase
        .from('experts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (expertError && expertError.code !== 'PGRST116') throw expertError;

      if (expertData) {
        setExpert(expertData);
        setEditLiveRate(String(expertData.live_rate));
        setEditMessageRate(String(expertData.message_rate));

        // Load incoming bookings
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select('*, profiles(*)')
          .eq('expert_id', expertData.id)
          .order('created_at', { ascending: false });

        if (bookingError) throw bookingError;
        setBookings(bookingData || []);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!formName.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }
    if (formSpecialties.length === 0) {
      Alert.alert('Required', 'Please select at least one specialty');
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('experts').insert({
        user_id: user.id,
        name: formName.trim(),
        bio: formBio.trim(),
        credentials: formCredentials.trim(),
        specialties: formSpecialties,
        live_rate: parseFloat(formLiveRate) || 0,
        message_rate: parseFloat(formMessageRate) || 0,
        availability_status: 'offline',
      });

      if (error) throw error;
      await loadDashboard();
    } catch (err) {
      console.error('Error creating profile:', err);
      Alert.alert('Error', 'Failed to create expert profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvailabilityChange = async (status: string) => {
    if (!expert) return;
    try {
      const { error } = await supabase
        .from('experts')
        .update({ availability_status: status })
        .eq('id', expert.id);

      if (error) throw error;
      setExpert({ ...expert, availability_status: status as Expert['availability_status'] });
    } catch (err) {
      console.error('Error updating availability:', err);
    }
  };

  const handleSaveRates = async () => {
    if (!expert) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from('experts')
        .update({
          live_rate: parseFloat(editLiveRate) || 0,
          message_rate: parseFloat(editMessageRate) || 0,
        })
        .eq('id', expert.id);

      if (error) throw error;
      setExpert({
        ...expert,
        live_rate: parseFloat(editLiveRate) || 0,
        message_rate: parseFloat(editMessageRate) || 0,
      });
      setEditingRates(false);
    } catch (err) {
      console.error('Error updating rates:', err);
      Alert.alert('Error', 'Failed to update rates');
    } finally {
      setSaving(false);
    }
  };

  const handleBookingAction = async (bookingId: string, action: 'accepted' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: action })
        .eq('id', bookingId);

      if (error) throw error;
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: action } : b))
      );
    } catch (err) {
      console.error('Error updating booking:', err);
    }
  };

  const handleSendReply = async (bookingId: string) => {
    const reply = replyTexts[bookingId]?.trim();
    if (!reply) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ expert_reply: reply, status: 'completed' })
        .eq('id', bookingId);

      if (error) throw error;
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, expert_reply: reply, status: 'completed' } : b))
      );
      setReplyTexts((prev) => ({ ...prev, [bookingId]: '' }));
    } catch (err) {
      console.error('Error sending reply:', err);
    }
  };

  const toggleSpecialty = (spec: string) => {
    setFormSpecialties((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  if (!isSupabaseConfigured()) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Expert Dashboard', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
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
        <Stack.Screen options={{ title: 'Expert Dashboard', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  // ==================== SETUP FORM ====================
  if (!expert) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Set Up Expert Profile', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <AnimatedEntry>
            <LinearGradient
              colors={[colors.primary + '15', colors.primary + '05'] as [string, string]}
              style={styles.setupBanner}
            >
              <Ionicons name="school" size={32} color={colors.primary} />
              <Text style={styles.setupTitle}>Set Up Your Expert Profile</Text>
              <Text style={styles.setupSubtitle}>Share your archery expertise and earn money coaching others</Text>
            </LinearGradient>
          </AnimatedEntry>

          <AnimatedEntry delay={80}>
            <Text style={styles.inputLabel}>Name *</Text>
            <TextInput
              style={styles.textInput}
              value={formName}
              onChangeText={setFormName}
              placeholder="Your coaching name"
              placeholderTextColor={colors.textMuted}
            />
          </AnimatedEntry>

          <AnimatedEntry delay={120}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formBio}
              onChangeText={setFormBio}
              placeholder="Tell students about your experience..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
            />
          </AnimatedEntry>

          <AnimatedEntry delay={160}>
            <Text style={styles.inputLabel}>Credentials</Text>
            <TextInput
              style={styles.textInput}
              value={formCredentials}
              onChangeText={setFormCredentials}
              placeholder="Certifications, achievements, experience..."
              placeholderTextColor={colors.textMuted}
            />
          </AnimatedEntry>

          <AnimatedEntry delay={200}>
            <Text style={styles.inputLabel}>Specialties *</Text>
            <View style={styles.chipRow}>
              {EXPERT_SPECIALTIES.map((spec, i) => {
                const isSelected = formSpecialties.includes(spec);
                const tagColor = SPECIALTY_COLORS[i % SPECIALTY_COLORS.length];
                return (
                  <TouchableOpacity
                    key={spec}
                    style={[
                      styles.chip,
                      isSelected && { backgroundColor: tagColor + '25', borderColor: tagColor },
                    ]}
                    onPress={() => toggleSpecialty(spec)}
                  >
                    <Text style={[styles.chipText, isSelected && { color: tagColor }]}>{spec}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </AnimatedEntry>

          <AnimatedEntry delay={240}>
            <Text style={styles.inputLabel}>Live Session Rate</Text>
            <View style={styles.rateInputRow}>
              <Text style={styles.ratePrefix}>$</Text>
              <TextInput
                style={styles.rateInput}
                value={formLiveRate}
                onChangeText={setFormLiveRate}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
              <Text style={styles.rateSuffix}>/30 min</Text>
            </View>
          </AnimatedEntry>

          <AnimatedEntry delay={280}>
            <Text style={styles.inputLabel}>Message Rate</Text>
            <View style={styles.rateInputRow}>
              <Text style={styles.ratePrefix}>$</Text>
              <TextInput
                style={styles.rateInput}
                value={formMessageRate}
                onChangeText={setFormMessageRate}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
              <Text style={styles.rateSuffix}>/question</Text>
            </View>
          </AnimatedEntry>

          <AnimatedEntry delay={320}>
            <TouchableOpacity activeOpacity={0.8} onPress={handleCreateProfile} disabled={saving}>
              <LinearGradient
                colors={[...gradients.primaryToSecondary] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButton}
              >
                {saving ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={styles.saveButtonText}>Create Expert Profile</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </AnimatedEntry>
        </ScrollView>
      </View>
    );
  }

  // ==================== DASHBOARD ====================
  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const completedBookings = bookings.filter((b) => b.status === 'completed');
  const estimatedEarnings = completedBookings.reduce((sum, b) => sum + Number(b.expert_payout || 0), 0);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Expert Dashboard', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Availability Toggle */}
        <AnimatedEntry>
          <GradientCard>
            <Text style={styles.cardTitle}>Your Availability</Text>
            <View style={styles.availabilityRow}>
              {AVAILABILITY_OPTIONS.map((option) => {
                const isActive = expert.availability_status === option;
                const dotColor = AVAILABILITY_COLORS[option];
                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.availabilityChip,
                      isActive && { backgroundColor: dotColor + '20', borderColor: dotColor },
                    ]}
                    onPress={() => handleAvailabilityChange(option)}
                  >
                    <View style={[styles.availDot, { backgroundColor: dotColor }]} />
                    <Text style={[styles.availChipText, isActive && { color: dotColor }]}>
                      {AVAILABILITY_LABELS[option]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GradientCard>
        </AnimatedEntry>

        {/* Stats */}
        <AnimatedEntry delay={80}>
          <GradientCard accentColors={[...gradients.primaryToSecondary]}>
            <Text style={styles.cardTitle}>Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{expert.total_sessions}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{expert.total_messages}</Text>
                <Text style={styles.statLabel}>Messages</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#FFB800' }]}>{Number(expert.rating).toFixed(1)}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>${estimatedEarnings.toFixed(0)}</Text>
                <Text style={styles.statLabel}>Earnings</Text>
              </View>
            </View>
          </GradientCard>
        </AnimatedEntry>

        {/* Pricing */}
        <AnimatedEntry delay={160}>
          <GradientCard>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>Pricing</Text>
              {!editingRates ? (
                <TouchableOpacity onPress={() => setEditingRates(true)}>
                  <Ionicons name="pencil" size={18} color={colors.primary} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handleSaveRates} disabled={saving}>
                  <Text style={styles.saveLink}>{saving ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              )}
            </View>
            {editingRates ? (
              <View>
                <Text style={styles.rateLabel}>Live Session Rate</Text>
                <View style={styles.rateInputRow}>
                  <Text style={styles.ratePrefix}>$</Text>
                  <TextInput
                    style={styles.rateInput}
                    value={editLiveRate}
                    onChangeText={setEditLiveRate}
                    keyboardType="numeric"
                  />
                  <Text style={styles.rateSuffix}>/30 min</Text>
                </View>
                <Text style={[styles.rateLabel, { marginTop: spacing.sm }]}>Message Rate</Text>
                <View style={styles.rateInputRow}>
                  <Text style={styles.ratePrefix}>$</Text>
                  <TextInput
                    style={styles.rateInput}
                    value={editMessageRate}
                    onChangeText={setEditMessageRate}
                    keyboardType="numeric"
                  />
                  <Text style={styles.rateSuffix}>/question</Text>
                </View>
              </View>
            ) : (
              <View style={styles.priceDisplay}>
                <View style={[styles.priceBadge, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="videocam" size={14} color={colors.primary} />
                  <Text style={[styles.priceText, { color: colors.primary }]}>Live: ${Number(expert.live_rate).toFixed(0)}/30min</Text>
                </View>
                <View style={[styles.priceBadge, { backgroundColor: colors.secondary + '15' }]}>
                  <Ionicons name="chatbubble" size={14} color={colors.secondary} />
                  <Text style={[styles.priceText, { color: colors.secondary }]}>Message: ${Number(expert.message_rate).toFixed(0)}</Text>
                </View>
              </View>
            )}
          </GradientCard>
        </AnimatedEntry>

        {/* Incoming Requests */}
        <AnimatedEntry delay={240}>
          <Text style={styles.sectionTitle}>
            Incoming Requests {pendingBookings.length > 0 && `(${pendingBookings.length})`}
          </Text>
        </AnimatedEntry>

        {pendingBookings.length === 0 ? (
          <AnimatedEntry delay={280}>
            <View style={styles.emptyRequests}>
              <Ionicons name="inbox-outline" size={36} color={colors.textMuted} />
              <Text style={styles.emptyRequestsText}>No pending requests</Text>
            </View>
          </AnimatedEntry>
        ) : (
          pendingBookings.map((booking, i) => (
            <AnimatedEntry key={booking.id} delay={280 + i * 60}>
              <GradientCard
                accentColors={booking.service_type === 'live' ? ['#00FF88', '#00C9FF'] : ['#00A3FF', '#7B68EE']}
              >
                <View style={styles.bookingHeader}>
                  <Ionicons
                    name={booking.service_type === 'live' ? 'videocam' : 'chatbubble'}
                    size={20}
                    color={booking.service_type === 'live' ? colors.primary : colors.secondary}
                  />
                  <Text style={styles.bookingType}>
                    {booking.service_type === 'live' ? 'Live Session' : 'Message'} Request
                  </Text>
                  <Text style={styles.bookingAmount}>${Number(booking.expert_payout).toFixed(2)}</Text>
                </View>

                <Text style={styles.bookingFrom}>
                  From: {booking.profiles?.display_name || booking.profiles?.username || 'Unknown User'}
                </Text>

                {booking.message ? (
                  <View style={styles.messageBox}>
                    <Text style={styles.messageText}>{booking.message}</Text>
                  </View>
                ) : null}

                {booking.scheduled_at && (
                  <Text style={styles.scheduledText}>
                    Scheduled: {new Date(booking.scheduled_at).toLocaleString()}
                  </Text>
                )}

                {booking.service_type === 'message' && (
                  <View style={styles.replySection}>
                    <TextInput
                      style={[styles.textInput, styles.replyInput]}
                      value={replyTexts[booking.id] || ''}
                      onChangeText={(text) => setReplyTexts((prev) => ({ ...prev, [booking.id]: text }))}
                      placeholder="Type your reply..."
                      placeholderTextColor={colors.textMuted}
                      multiline
                    />
                  </View>
                )}

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.declineButton]}
                    onPress={() => handleBookingAction(booking.id, 'cancelled')}
                  >
                    <Text style={styles.declineText}>Decline</Text>
                  </TouchableOpacity>

                  {booking.service_type === 'message' && replyTexts[booking.id]?.trim() ? (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.acceptButton]}
                      onPress={() => handleSendReply(booking.id)}
                    >
                      <LinearGradient
                        colors={[...gradients.primaryToSecondary] as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.actionGradient}
                      >
                        <Text style={styles.acceptText}>Send Reply</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.acceptButton]}
                      onPress={() => handleBookingAction(booking.id, 'accepted')}
                    >
                      <LinearGradient
                        colors={[...gradients.primaryToSecondary] as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.actionGradient}
                      >
                        <Text style={styles.acceptText}>Accept</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              </GradientCard>
            </AnimatedEntry>
          ))
        )}

        {/* Edit Profile Button */}
        <AnimatedEntry delay={360}>
          <TouchableOpacity style={styles.editProfileButton} activeOpacity={0.7}>
            <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </AnimatedEntry>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md, paddingBottom: 100 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  placeholderGradient: { alignItems: 'center', padding: spacing.xxl, borderRadius: borderRadius.lg, width: '100%' },
  placeholderText: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: '600', marginTop: spacing.md, textAlign: 'center' },

  // Setup form
  setupBanner: {
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  setupTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  setupSubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
  inputLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600', marginBottom: spacing.xs, marginTop: spacing.md },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  rateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  ratePrefix: { fontSize: fontSize.lg, color: colors.primary, fontWeight: '700' },
  rateInput: {
    flex: 1,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  rateSuffix: { fontSize: fontSize.sm, color: colors.textSecondary },
  rateLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600', marginBottom: spacing.xs },
  saveButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveButtonText: { fontSize: fontSize.md, fontWeight: '700', color: colors.background },

  // Dashboard
  cardTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  saveLink: { fontSize: fontSize.sm, fontWeight: '700', color: colors.primary },
  availabilityRow: { flexDirection: 'row', gap: spacing.sm },
  availabilityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  availDot: { width: 10, height: 10, borderRadius: 5 },
  availChipText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statBox: {
    flex: 1,
    minWidth: '40%',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
  },
  statNumber: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  priceDisplay: { flexDirection: 'row', gap: spacing.sm },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  priceText: { fontSize: fontSize.md, fontWeight: '700' },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
  emptyRequests: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  emptyRequestsText: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },

  // Booking cards
  bookingHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  bookingType: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, flex: 1 },
  bookingAmount: { fontSize: fontSize.md, fontWeight: '800', color: colors.primary },
  bookingFrom: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  messageBox: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  messageText: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
  scheduledText: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: spacing.sm },
  replySection: { marginBottom: spacing.sm },
  replyInput: { minHeight: 60, textAlignVertical: 'top' },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  actionButton: { flex: 1, borderRadius: borderRadius.md, overflow: 'hidden' },
  declineButton: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.danger + '40',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
  },
  acceptButton: {},
  actionGradient: {
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  declineText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.danger },
  acceptText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.background },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editProfileText: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: '600' },
});
