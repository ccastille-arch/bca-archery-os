import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import uuid from 'react-native-uuid';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { saveFeedback, getUserProfile } from '../lib/storage';
import AnimatedEntry from '../components/AnimatedEntry';
import { useScreenTracking } from '../lib/useAnalytics';
import { trackEvent } from '../lib/analytics';
import type { FeedbackType, FeedbackItem } from '../lib/types';
import { FEEDBACK_TYPE_LABELS } from '../lib/types';

export default function FeedbackScreen() {
  useScreenTracking('feedback');
  const router = useRouter();
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    getUserProfile().then((p) => { if (p) setAuthor(p.displayName || p.username); });
  }, []);

  const handleSubmit = async () => {
    if (!feedbackType) { Alert.alert('Select type', 'Choose bug report, recommendation, or feature request.'); return; }
    if (!subject.trim()) { Alert.alert('Subject required', 'Give your feedback a subject.'); return; }
    if (!body.trim()) { Alert.alert('Details required', 'Describe your feedback.'); return; }

    const item: FeedbackItem = {
      id: uuid.v4() as string,
      type: feedbackType,
      subject: subject.trim(),
      body: body.trim(),
      author: author.trim() || 'Anonymous',
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    await saveFeedback(item);
    trackEvent('feedback_submitted', { type: feedbackType });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <>
        <Stack.Screen options={{ title: 'FEEDBACK', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: spacing.xl }]}>
          <AnimatedEntry>
            <View style={styles.successCard}>
              <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
              <Text style={styles.successTitle}>Thank you!</Text>
              <Text style={styles.successSub}>Your feedback has been submitted and sent to the admin inbox.</Text>
              <TouchableOpacity style={styles.successBtn} onPress={() => router.back()}>
                <Text style={styles.successBtnText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </AnimatedEntry>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'FEEDBACK', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Hero */}
        <AnimatedEntry>
          <LinearGradient colors={['#0A0A0A', '#0A0F1A', '#0A0A0A'] as [string, string, string]} style={styles.hero}>
            <Ionicons name="chatbox-ellipses" size={36} color={colors.secondary} />
            <Text style={styles.heroTitle}>SEND FEEDBACK</Text>
            <Text style={styles.heroSub}>Help us improve BCA Archery OS</Text>
          </LinearGradient>
        </AnimatedEntry>

        {/* Feedback Type */}
        <AnimatedEntry delay={60}>
          <Text style={styles.label}>WHAT TYPE OF FEEDBACK?</Text>
          <View style={styles.typeGrid}>
            {(Object.entries(FEEDBACK_TYPE_LABELS) as [FeedbackType, typeof FEEDBACK_TYPE_LABELS[FeedbackType]][]).map(([key, info]) => (
              <TouchableOpacity
                key={key}
                style={[styles.typeCard, feedbackType === key && { borderColor: info.color, backgroundColor: info.color + '10' }]}
                onPress={() => setFeedbackType(key)}
              >
                <Ionicons name={info.icon as any} size={28} color={feedbackType === key ? info.color : colors.textSecondary} />
                <Text style={[styles.typeLabel, feedbackType === key && { color: info.color }]}>{info.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </AnimatedEntry>

        {/* Name */}
        <AnimatedEntry delay={100}>
          <Text style={styles.label}>YOUR NAME</Text>
          <TextInput style={styles.input} value={author} onChangeText={setAuthor}
            placeholder="Display name" placeholderTextColor={colors.textMuted} />
        </AnimatedEntry>

        {/* Subject */}
        <AnimatedEntry delay={140}>
          <Text style={styles.label}>SUBJECT</Text>
          <TextInput style={styles.input} value={subject} onChangeText={setSubject}
            placeholder={feedbackType === 'bug' ? 'What went wrong?' : feedbackType === 'feature-request' ? 'What feature do you want?' : 'What\'s your recommendation?'}
            placeholderTextColor={colors.textMuted} />
        </AnimatedEntry>

        {/* Body */}
        <AnimatedEntry delay={180}>
          <Text style={styles.label}>DETAILS</Text>
          <TextInput style={[styles.input, { minHeight: 150, textAlignVertical: 'top' }]}
            value={body} onChangeText={setBody} multiline numberOfLines={8}
            placeholder={feedbackType === 'bug' ? 'Describe the bug: what happened, what you expected, steps to reproduce...' : feedbackType === 'feature-request' ? 'Describe the feature in detail: what it should do, why it would be useful...' : 'Share your recommendation or suggestion...'}
            placeholderTextColor={colors.textMuted} />
        </AnimatedEntry>

        {/* Submit */}
        <AnimatedEntry delay={220}>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <LinearGradient
              colors={feedbackType ? [FEEDBACK_TYPE_LABELS[feedbackType].color, colors.secondary] as [string, string] : [...gradients.primaryToSecondary] as [string, string]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtnInner}>
              <Ionicons name="send" size={18} color={colors.text} />
              <Text style={styles.submitBtnText}>SUBMIT FEEDBACK</Text>
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
  hero: { alignItems: 'center', paddingVertical: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  heroTitle: { fontSize: fontSize.xl, fontWeight: '900', color: colors.secondary, letterSpacing: 4, marginTop: spacing.sm },
  heroSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  label: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary, letterSpacing: 2, marginBottom: spacing.sm, marginTop: spacing.lg },
  typeGrid: { flexDirection: 'row', gap: spacing.sm },
  typeCard: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md,
    backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 2, borderColor: colors.border, gap: spacing.sm,
  },
  typeLabel: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary, textAlign: 'center' },
  input: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, color: colors.text, fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border },
  submitBtn: { marginTop: spacing.xl, borderRadius: borderRadius.md, overflow: 'hidden' },
  submitBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md },
  submitBtnText: { fontSize: fontSize.md, fontWeight: '800', color: colors.text, letterSpacing: 2 },
  successCard: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.xl },
  successTitle: { fontSize: fontSize.xxl, fontWeight: '900', color: colors.primary, marginTop: spacing.md },
  successSub: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 22 },
  successBtn: { marginTop: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.primary },
  successBtnText: { fontSize: fontSize.md, color: colors.primary, fontWeight: '700' },
});
