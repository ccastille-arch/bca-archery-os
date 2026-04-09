import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import uuid from 'react-native-uuid';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { getExpertApps, saveExpertApp, getUserProfile } from '../lib/storage';
import AnimatedEntry from '../components/AnimatedEntry';
import { useScreenTracking } from '../lib/useAnalytics';
import { trackEvent } from '../lib/analytics';
import type { ExpertApplication, ExpertTier } from '../lib/types';
import { EXPERT_TIER_INFO, EXPERT_SPECIALTIES } from '../lib/types';

export default function ExpertApplyScreen() {
  useScreenTracking('expert-apply');
  const router = useRouter();
  const [existingApp, setExistingApp] = useState<ExpertApplication | null>(null);
  const [name, setName] = useState('');
  const [tier, setTier] = useState<ExpertTier | null>(null);
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [tournaments, setTournaments] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [contactInfo, setContactInfo] = useState('');
  const [replyText, setReplyText] = useState('');

  useFocusEffect(useCallback(() => {
    getUserProfile().then((p) => { if (p) setName(p.displayName || p.username); });
    getExpertApps().then((apps) => {
      if (apps.length > 0) setExistingApp(apps[0]);
    });
  }, []));

  const toggleSpecialty = (s: string) => {
    setSpecialties(specialties.includes(s) ? specialties.filter((x) => x !== s) : [...specialties, s]);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { Alert.alert('Name required'); return; }
    if (!tier) { Alert.alert('Select a tier', 'Choose your expert level.'); return; }
    if (!bio.trim()) { Alert.alert('Bio required', 'Tell us why you want to help others.'); return; }

    const app: ExpertApplication = {
      id: uuid.v4() as string,
      applicantName: name.trim(), tier, bio: bio.trim(),
      experience: experience.trim(), tournaments: tournaments.trim(),
      specialties, contactInfo: contactInfo.trim(),
      status: 'pending', adminMessages: [],
      createdAt: new Date().toISOString(),
    };
    await saveExpertApp(app);
    trackEvent('expert_application_submitted', { tier });
    setExistingApp(app);
  };

  const handleSendMessage = async () => {
    if (!existingApp || !replyText.trim()) return;
    const updated = { ...existingApp,
      adminMessages: [...existingApp.adminMessages, {
        from: 'applicant' as const, message: replyText.trim(), timestamp: new Date().toISOString(),
      }],
    };
    await saveExpertApp(updated);
    setExistingApp(updated);
    setReplyText('');
  };

  // If already applied, show status view
  if (existingApp) {
    const tierInfo = EXPERT_TIER_INFO[existingApp.tier];
    return (
      <>
        <Stack.Screen options={{ title: 'EXPERT APPLICATION', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <AnimatedEntry>
            <View style={[styles.statusCard, {
              borderColor: existingApp.status === 'approved' ? colors.primary : existingApp.status === 'denied' ? colors.danger : colors.warning,
            }]}>
              <Ionicons name={existingApp.status === 'approved' ? 'checkmark-circle' : existingApp.status === 'denied' ? 'close-circle' : 'hourglass'} size={48}
                color={existingApp.status === 'approved' ? colors.primary : existingApp.status === 'denied' ? colors.danger : colors.warning} />
              <Text style={styles.statusTitle}>
                {existingApp.status === 'approved' ? 'APPLICATION APPROVED!' : existingApp.status === 'denied' ? 'APPLICATION DENIED' : 'APPLICATION PENDING'}
              </Text>
              <Text style={styles.statusSub}>
                {existingApp.status === 'pending' ? 'Your application is being reviewed by the admin team. You will be notified when a decision is made.' :
                 existingApp.status === 'approved' ? 'Congratulations! You have been approved as an expert. Details on next steps coming soon.' :
                 'Unfortunately your application was not approved at this time. See admin messages below for details.'}
              </Text>
            </View>
          </AnimatedEntry>

          <AnimatedEntry delay={60}>
            <View style={styles.appSummary}>
              <Text style={styles.summaryLabel}>APPLIED AS</Text>
              <View style={[styles.tierBadge, { backgroundColor: tierInfo.color + '20', borderColor: tierInfo.color }]}>
                <Ionicons name={tierInfo.icon as any} size={16} color={tierInfo.color} />
                <Text style={[styles.tierBadgeText, { color: tierInfo.color }]}>{tierInfo.label}</Text>
              </View>
              <Text style={styles.summaryLabel}>YOUR BIO</Text>
              <Text style={styles.summaryText}>{existingApp.bio}</Text>
              <Text style={styles.summaryLabel}>SUBMITTED</Text>
              <Text style={styles.summaryText}>{new Date(existingApp.createdAt).toLocaleDateString()}</Text>
            </View>
          </AnimatedEntry>

          {/* Messages */}
          <AnimatedEntry delay={120}>
            <Text style={styles.sectionTitle}>MESSAGES</Text>
            {existingApp.adminMessages.length === 0 ? (
              <Text style={styles.noMessages}>No messages yet. The admin will reach out if they have questions.</Text>
            ) : (
              existingApp.adminMessages.map((msg, i) => (
                <View key={i} style={[styles.messageCard, msg.from === 'admin' ? styles.adminMsg : styles.applicantMsg]}>
                  <Text style={styles.msgFrom}>{msg.from === 'admin' ? 'Admin' : 'You'}</Text>
                  <Text style={styles.msgBody}>{msg.message}</Text>
                  <Text style={styles.msgTime}>{new Date(msg.timestamp).toLocaleString()}</Text>
                </View>
              ))
            )}
            <View style={styles.replyBar}>
              <TextInput style={styles.replyInput} value={replyText} onChangeText={setReplyText}
                placeholder="Send a message to admin..." placeholderTextColor={colors.textMuted} multiline />
              <TouchableOpacity style={[styles.sendBtn, !replyText.trim() && { opacity: 0.4 }]}
                onPress={handleSendMessage} disabled={!replyText.trim()}>
                <Ionicons name="send" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          </AnimatedEntry>

          {/* How it works */}
          <AnimatedEntry delay={180}>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={24} color={colors.secondary} />
              <Text style={styles.infoTitle}>HOW THE EXPERT PROGRAM WORKS</Text>
              <Text style={styles.infoText}>
                As an approved expert on BCA Archery OS, you'll be able to offer archery coaching and advice to other users through the app. You can set your own rates for live sessions and message-based support.
              </Text>
              <Text style={styles.infoText}>
                BCA Archery OS takes a small percentage (20%) of each transaction to maintain the platform. You keep 80% of everything you earn.
              </Text>
              <View style={styles.infoNote}>
                <Ionicons name="construct" size={14} color={colors.warning} />
                <Text style={styles.infoNoteText}>
                  NOTE: The payment system is currently in development. During this dev period, no payments will be processed. Once the payment system is live, approved experts will be able to receive payments directly. We'll notify you when it's ready.
                </Text>
              </View>
            </View>
          </AnimatedEntry>
        </ScrollView>
      </>
    );
  }

  // Application form
  return (
    <>
      <Stack.Screen options={{ title: 'BECOME AN EXPERT', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Hero */}
        <AnimatedEntry>
          <LinearGradient colors={['#0A0A0A', '#1A0A0F', '#0A0A0A'] as [string, string, string]} style={styles.hero}>
            <Ionicons name="school" size={40} color="#FFB800" />
            <Text style={styles.heroTitle}>BECOME AN EXPERT</Text>
            <Text style={styles.heroSub}>Help fellow archers and earn money doing it</Text>
          </LinearGradient>
        </AnimatedEntry>

        {/* How it works explanation */}
        <AnimatedEntry delay={40}>
          <View style={styles.explainerCard}>
            <Text style={styles.explainerTitle}>Here's how it works:</Text>
            <View style={styles.explainerRow}><Text style={styles.explainerNum}>1</Text><Text style={styles.explainerText}>Choose your expert tier below based on your experience level</Text></View>
            <View style={styles.explainerRow}><Text style={styles.explainerNum}>2</Text><Text style={styles.explainerText}>Fill out your application with your background and specialties</Text></View>
            <View style={styles.explainerRow}><Text style={styles.explainerNum}>3</Text><Text style={styles.explainerText}>Admin reviews your application and approves or requests more info</Text></View>
            <View style={styles.explainerRow}><Text style={styles.explainerNum}>4</Text><Text style={styles.explainerText}>Once approved, you set your own rates for live sessions and message support</Text></View>
            <View style={styles.explainerRow}><Text style={styles.explainerNum}>5</Text><Text style={styles.explainerText}>Users book you, you get paid — BCA takes a small 20% platform fee</Text></View>
            <View style={styles.devNote}>
              <Ionicons name="construct" size={14} color={colors.warning} />
              <Text style={styles.devNoteText}>Payment system is currently in development. During this period, expert features will be available but payment processing will not be active. You will be notified when payments go live.</Text>
            </View>
          </View>
        </AnimatedEntry>

        {/* Name */}
        <AnimatedEntry delay={80}>
          <Text style={styles.label}>YOUR NAME</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName}
            placeholder="Full name" placeholderTextColor={colors.textMuted} />
        </AnimatedEntry>

        {/* Tier Selection */}
        <AnimatedEntry delay={120}>
          <Text style={styles.label}>SELECT YOUR EXPERT TIER</Text>
          {(Object.entries(EXPERT_TIER_INFO) as [ExpertTier, typeof EXPERT_TIER_INFO[ExpertTier]][]).map(([key, info]) => (
            <TouchableOpacity key={key} style={[styles.tierCard, tier === key && { borderColor: info.color, backgroundColor: info.color + '08' }]}
              onPress={() => setTier(key)}>
              <View style={styles.tierHeader}>
                <Ionicons name={info.icon as any} size={24} color={tier === key ? info.color : colors.textSecondary} />
                <Text style={[styles.tierLabel, tier === key && { color: info.color }]}>{info.label}</Text>
                {tier === key && <Ionicons name="checkmark-circle" size={20} color={info.color} />}
              </View>
              <Text style={styles.tierDesc}>{info.description}</Text>
              <Text style={styles.tierReqs}>{info.requirements}</Text>
            </TouchableOpacity>
          ))}
        </AnimatedEntry>

        {/* Bio */}
        <AnimatedEntry delay={160}>
          <Text style={styles.label}>WHY DO YOU WANT TO HELP OTHERS?</Text>
          <TextInput style={[styles.input, { minHeight: 120, textAlignVertical: 'top' }]}
            value={bio} onChangeText={setBio} multiline numberOfLines={6}
            placeholder="Tell us about your passion for archery and why you want to coach/help others. What makes you qualified? What do you enjoy teaching?" placeholderTextColor={colors.textMuted} />
        </AnimatedEntry>

        {/* Experience */}
        <AnimatedEntry delay={200}>
          <Text style={styles.label}>ARCHERY EXPERIENCE</Text>
          <TextInput style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            value={experience} onChangeText={setExperience} multiline
            placeholder="How long have you been shooting? What disciplines? (ASA, IBO, NFAA, hunting, etc.)" placeholderTextColor={colors.textMuted} />
        </AnimatedEntry>

        {/* Tournaments */}
        <AnimatedEntry delay={240}>
          <Text style={styles.label}>NOTABLE TOURNAMENTS / ACHIEVEMENTS</Text>
          <TextInput style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            value={tournaments} onChangeText={setTournaments} multiline
            placeholder="List any notable finishes, championships, records, or achievements" placeholderTextColor={colors.textMuted} />
        </AnimatedEntry>

        {/* Specialties */}
        <AnimatedEntry delay={280}>
          <Text style={styles.label}>SPECIALTIES (select all that apply)</Text>
          <View style={styles.chipRow}>
            {EXPERT_SPECIALTIES.map((s) => (
              <TouchableOpacity key={s} style={[styles.chip, specialties.includes(s) && styles.chipActive]}
                onPress={() => toggleSpecialty(s)}>
                <Text style={[styles.chipText, specialties.includes(s) && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </AnimatedEntry>

        {/* Contact */}
        <AnimatedEntry delay={320}>
          <Text style={styles.label}>CONTACT INFO (optional)</Text>
          <TextInput style={styles.input} value={contactInfo} onChangeText={setContactInfo}
            placeholder="Email, phone, or social media handle" placeholderTextColor={colors.textMuted} />
        </AnimatedEntry>

        {/* Submit */}
        <AnimatedEntry delay={360}>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <LinearGradient colors={['#FFB800', '#FF8C00'] as [string, string]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtnInner}>
              <Ionicons name="paper-plane" size={20} color={colors.background} />
              <Text style={styles.submitBtnText}>SUBMIT APPLICATION</Text>
            </LinearGradient>
          </TouchableOpacity>
        </AnimatedEntry>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl * 2 },
  hero: { alignItems: 'center', paddingVertical: spacing.xl, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  heroTitle: { fontSize: fontSize.xl, fontWeight: '900', color: '#FFB800', letterSpacing: 3, marginTop: spacing.sm },
  heroSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  explainerCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md },
  explainerTitle: { fontSize: fontSize.md, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  explainerRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm, alignItems: 'flex-start' },
  explainerNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary + '20', color: colors.primary, fontWeight: '900', fontSize: fontSize.sm, textAlign: 'center', lineHeight: 22 },
  explainerText: { flex: 1, fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
  devNote: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, backgroundColor: colors.warning + '10', borderRadius: borderRadius.sm, padding: spacing.sm, borderWidth: 1, borderColor: colors.warning + '30' },
  devNoteText: { flex: 1, fontSize: fontSize.xs, color: colors.warning, lineHeight: 18 },
  label: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary, letterSpacing: 2, marginBottom: spacing.sm, marginTop: spacing.lg },
  input: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, color: colors.text, fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border },
  tierCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 2, borderColor: colors.border },
  tierHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  tierLabel: { flex: 1, fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  tierDesc: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.sm },
  tierReqs: { fontSize: fontSize.xs, color: colors.textMuted, fontStyle: 'italic', lineHeight: 18 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: '#FFB80020', borderColor: '#FFB800' },
  chipText: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#FFB800' },
  submitBtn: { marginTop: spacing.xl, borderRadius: borderRadius.md, overflow: 'hidden' },
  submitBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md },
  submitBtnText: { fontSize: fontSize.md, fontWeight: '800', color: colors.background, letterSpacing: 2 },
  // Status view
  statusCard: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.xl, borderWidth: 2 },
  statusTitle: { fontSize: fontSize.xl, fontWeight: '900', color: colors.text, marginTop: spacing.md, letterSpacing: 2 },
  statusSub: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 22 },
  appSummary: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginTop: spacing.md },
  summaryLabel: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1, marginTop: spacing.md, marginBottom: spacing.xs },
  summaryText: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
  tierBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1 },
  tierBadgeText: { fontSize: fontSize.sm, fontWeight: '700' },
  sectionTitle: { fontSize: fontSize.xs, fontWeight: '800', color: colors.textSecondary, letterSpacing: 2, marginTop: spacing.xl, marginBottom: spacing.sm },
  noMessages: { fontSize: fontSize.sm, color: colors.textMuted, fontStyle: 'italic', marginBottom: spacing.md },
  messageCard: { borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  adminMsg: { backgroundColor: colors.secondary + '15', borderLeftWidth: 3, borderLeftColor: colors.secondary },
  applicantMsg: { backgroundColor: colors.surface, borderLeftWidth: 3, borderLeftColor: colors.primary },
  msgFrom: { fontSize: fontSize.xs, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  msgBody: { fontSize: fontSize.md, color: colors.text, marginTop: spacing.xs, lineHeight: 22 },
  msgTime: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
  replyBar: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  replyInput: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.sm, paddingHorizontal: spacing.md, color: colors.text, fontSize: fontSize.md, maxHeight: 100, borderWidth: 1, borderColor: colors.border },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFB800', alignItems: 'center', justifyContent: 'center' },
  infoCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginTop: spacing.lg },
  infoTitle: { fontSize: fontSize.sm, fontWeight: '800', color: colors.secondary, letterSpacing: 1, marginTop: spacing.sm, marginBottom: spacing.sm },
  infoText: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.sm },
  infoNote: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.warning + '10', borderRadius: borderRadius.sm, padding: spacing.sm, borderWidth: 1, borderColor: colors.warning + '30' },
  infoNoteText: { flex: 1, fontSize: fontSize.xs, color: colors.warning, lineHeight: 18 },
});
