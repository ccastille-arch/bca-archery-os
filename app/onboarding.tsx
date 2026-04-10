import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { setOnboardingComplete } from '../lib/settings';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedEntry from '../components/AnimatedEntry';

const PAGES = [
  {
    title: 'Welcome to BCA',
    subtitle: 'ARCHERY OS',
    description: 'The Operating System for Competitive Archers',
    features: null,
  },
  {
    title: 'Everything You Need',
    subtitle: null,
    description: null,
    features: [
      { icon: 'locate', label: 'Track Every Arrow', desc: 'Log shots, scores, and conditions' },
      { icon: 'trophy', label: 'Live Round Scoring', desc: 'ASA/IBO scoring with your group' },
      { icon: 'fitness', label: 'Manage Your Gear', desc: 'Bows, arrows, stabilizers, tuning' },
      { icon: 'analytics', label: 'Analyze Performance', desc: 'Group analysis, ballistics, trends' },
    ],
  },
  {
    title: "You're All Set!",
    subtitle: null,
    description: 'Start logging your first shots and see what BCA Archery OS can do.',
    features: null,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const current = PAGES[page];

  const handleNext = () => {
    if (page < PAGES.length - 1) {
      setPage(page + 1);
    }
  };

  const handleGetStarted = async () => {
    await setOnboardingComplete();
    router.replace('/');
  };

  const handleSkip = async () => {
    await setOnboardingComplete();
    router.replace('/');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Skip button */}
        {page < PAGES.length - 1 && (
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}

        {/* Page content */}
        <AnimatedEntry key={page}>
          {page === 0 && (
            <View style={styles.heroSection}>
              <Text style={styles.brand}>BCA</Text>
              <Text style={styles.subtitle}>ARCHERY OS</Text>
              <LinearGradient colors={[...gradients.primaryToSecondary] as [string, string]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.badge}>
                <Text style={styles.badgeText}>BOW CONTROL ANALYTICS</Text>
              </LinearGradient>
              <Text style={styles.description}>{current.description}</Text>
            </View>
          )}

          {page === 1 && (
            <View style={styles.featuresSection}>
              <Text style={styles.pageTitle}>{current.title}</Text>
              {current.features?.map((f, i) => (
                <AnimatedEntry key={i} delay={i * 80}>
                  <View style={styles.featureCard}>
                    <View style={styles.featureIcon}>
                      <Ionicons name={f.icon as any} size={28} color={colors.primary} />
                    </View>
                    <View style={styles.featureText}>
                      <Text style={styles.featureLabel}>{f.label}</Text>
                      <Text style={styles.featureDesc}>{f.desc}</Text>
                    </View>
                  </View>
                </AnimatedEntry>
              ))}
            </View>
          )}

          {page === 2 && (
            <View style={styles.heroSection}>
              <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
              <Text style={styles.pageTitle}>{current.title}</Text>
              <Text style={styles.description}>{current.description}</Text>
            </View>
          )}
        </AnimatedEntry>

        {/* Page dots */}
        <View style={styles.dots}>
          {PAGES.map((_, i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>

        {/* Action button */}
        {page < PAGES.length - 1 ? (
          <TouchableOpacity style={styles.actionBtn} onPress={handleNext}>
            <LinearGradient colors={[...gradients.primaryToSecondary] as [string, string]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionBtnInner}>
              <Text style={styles.actionBtnText}>NEXT</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.background} />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.actionBtn} onPress={handleGetStarted}>
            <LinearGradient colors={[...gradients.primaryToSecondary] as [string, string]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionBtnInner}>
              <Ionicons name="rocket" size={20} color={colors.background} />
              <Text style={styles.actionBtnText}>GET STARTED</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: 80, paddingBottom: spacing.xxl * 2, justifyContent: 'center', minHeight: '100%' },
  skipBtn: { position: 'absolute', top: 50, right: spacing.xl, zIndex: 10 },
  skipText: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: '600' },
  heroSection: { alignItems: 'center', paddingVertical: spacing.xxl },
  brand: { fontSize: fontSize.hero, fontWeight: '900', color: colors.primary, letterSpacing: 8 },
  subtitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, letterSpacing: 6, marginTop: -4 },
  badge: { marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  badgeText: { fontSize: fontSize.xs, fontWeight: '800', color: colors.background, letterSpacing: 2 },
  description: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg, lineHeight: 24 },
  featuresSection: { paddingVertical: spacing.lg },
  pageTitle: { fontSize: fontSize.xxl, fontWeight: '900', color: colors.text, textAlign: 'center', marginBottom: spacing.xl },
  featureCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  featureIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  featureText: { flex: 1 },
  featureLabel: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  featureDesc: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginVertical: spacing.xl },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.textMuted },
  dotActive: { backgroundColor: colors.primary, borderColor: colors.primary, width: 24 },
  actionBtn: { borderRadius: borderRadius.md, overflow: 'hidden' },
  actionBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md },
  actionBtnText: { fontSize: fontSize.md, fontWeight: '800', color: colors.background, letterSpacing: 2 },
});
