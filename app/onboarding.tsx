import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { setOnboardingComplete } from '../lib/settings';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_PAGES = 3;

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentPage(page);
  };

  const handleGetStarted = async () => {
    await setOnboardingComplete();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* ==================== SCREEN 1: WELCOME ==================== */}
        <View style={styles.page}>
          <View style={styles.pageContent}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoMain}>BCA</Text>
              <Text style={styles.logoSub}>ARCHERY OS</Text>
            </View>

            <Text style={styles.tagline}>
              The Operating System for Competitive Archers
            </Text>

            <LinearGradient
              colors={gradients.primaryToSecondary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.badge}
            >
              <Text style={styles.badgeText}>BOW CONTROL ANALYTICS</Text>
            </LinearGradient>
          </View>
        </View>

        {/* ==================== SCREEN 2: FEATURES ==================== */}
        <View style={styles.page}>
          <View style={styles.pageContent}>
            <Text style={styles.featuresTitle}>What You Can Do</Text>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureEmoji}>🎯</Text>
                <View style={styles.featureText}>
                  <Text style={styles.featureHeading}>Track Every Arrow</Text>
                  <Text style={styles.featureDesc}>
                    Log shots, scores, and conditions
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.featureEmoji}>🏆</Text>
                <View style={styles.featureText}>
                  <Text style={styles.featureHeading}>Live Round Scoring</Text>
                  <Text style={styles.featureDesc}>
                    ASA/IBO scoring with your group
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.featureEmoji}>🔧</Text>
                <View style={styles.featureText}>
                  <Text style={styles.featureHeading}>Manage Your Gear</Text>
                  <Text style={styles.featureDesc}>
                    Bows, arrows, stabilizers, tuning
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.featureEmoji}>📊</Text>
                <View style={styles.featureText}>
                  <Text style={styles.featureHeading}>Analyze Performance</Text>
                  <Text style={styles.featureDesc}>
                    Group analysis, ballistics, trends
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ==================== SCREEN 3: GET STARTED ==================== */}
        <View style={styles.page}>
          <View style={styles.pageContent}>
            <Ionicons
              name="checkmark-circle"
              size={80}
              color={colors.primary}
              style={{ marginBottom: spacing.lg }}
            />

            <Text style={styles.readyTitle}>You're all set!</Text>
            <Text style={styles.readyDesc}>
              Start logging your first shots and see what BCA Archery OS can do.
            </Text>

            <TouchableOpacity
              onPress={handleGetStarted}
              activeOpacity={0.8}
              style={{ width: '100%', marginTop: spacing.xl }}
            >
              <LinearGradient
                colors={gradients.primaryToSecondary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.getStartedButton}
              >
                <Text style={styles.getStartedText}>GET STARTED</Text>
                <Ionicons
                  name="arrow-forward"
                  size={22}
                  color={colors.background}
                  style={{ marginLeft: spacing.sm }}
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ==================== PAGE INDICATORS ==================== */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              currentPage === i ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    width: '100%',
  },

  // Screen 1: Welcome
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoMain: {
    fontSize: 72,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 6,
  },
  logoSub: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 4,
    marginTop: spacing.xs,
  },
  tagline: {
    fontSize: fontSize.lg,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  badge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    color: colors.background,
    letterSpacing: 1.5,
  },

  // Screen 2: Features
  featuresTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  featureList: {
    width: '100%',
    gap: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureEmoji: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureHeading: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },

  // Screen 3: Get Started
  readyTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  readyDesc: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
  },
  getStartedText: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.background,
    letterSpacing: 1.5,
  },

  // Dots
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  dotInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.textMuted,
  },
});
