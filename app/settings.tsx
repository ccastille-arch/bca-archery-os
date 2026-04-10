import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSettings } from '../lib/SettingsContext';
import {
  accentColors,
  colors,
  gradients,
  spacing,
  fontSize,
  borderRadius,
  fontSizeScale,
} from '../lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AnimatedEntry from '../components/AnimatedEntry';
import { useScreenTracking } from '../lib/useAnalytics';
import { useToast } from '../lib/ToastContext';
import { Stack, useRouter } from 'expo-router';

export default function SettingsScreen() {
  useScreenTracking('Settings');
  const { settings, updateSettings } = useSettings();
  const { showToast } = useToast();
  const router = useRouter();

  const handleAccentColor = async (color: string) => {
    await updateSettings({ accentColor: color });
    showToast('Settings saved!', 'success');
  };

  const handleFontSize = async (scale: 'small' | 'medium' | 'large') => {
    await updateSettings({ fontSizeScale: scale });
    showToast('Settings saved!', 'success');
  };

  const handleDistanceUnit = async (unit: 'yards' | 'meters') => {
    await updateSettings({ distanceUnit: unit });
    showToast('Settings saved!', 'success');
  };

  const currentScale = fontSizeScale[settings.fontSizeScale] ?? 1;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ==================== APPEARANCE ==================== */}
        <AnimatedEntry delay={0}>
          <Text style={styles.sectionTitle}>APPEARANCE</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Accent Color</Text>
            <View style={styles.colorRow}>
              {Object.entries(accentColors).map(([key, color]) => {
                const isSelected = settings.accentColor === color;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => handleAccentColor(color)}
                    style={[
                      styles.colorCircleOuter,
                      isSelected && { borderColor: '#FFFFFF', borderWidth: 2 },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.colorCircle,
                        { backgroundColor: color },
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text
              style={[styles.previewText, { color: settings.accentColor }]}
            >
              Your accent color
            </Text>
          </View>
        </AnimatedEntry>

        {/* ==================== TEXT SIZE ==================== */}
        <AnimatedEntry delay={100}>
          <Text style={styles.sectionTitle}>TEXT SIZE</Text>
          <View style={styles.card}>
            <View style={styles.pillRow}>
              {(['small', 'medium', 'large'] as const).map((size) => {
                const isSelected = settings.fontSizeScale === size;
                return (
                  <TouchableOpacity
                    key={size}
                    onPress={() => handleFontSize(size)}
                    style={[
                      styles.pill,
                      isSelected && {
                        backgroundColor: settings.accentColor,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        isSelected && { color: colors.background },
                      ]}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text
              style={[
                styles.previewText,
                {
                  fontSize: fontSize.md * currentScale,
                  color: colors.textSecondary,
                },
              ]}
            >
              This is how your text will look at{' '}
              {settings.fontSizeScale} size
            </Text>
          </View>
        </AnimatedEntry>

        {/* ==================== UNITS ==================== */}
        <AnimatedEntry delay={200}>
          <Text style={styles.sectionTitle}>UNITS</Text>
          <View style={styles.card}>
            <View style={styles.pillRow}>
              {(['yards', 'meters'] as const).map((unit) => {
                const isSelected = settings.distanceUnit === unit;
                return (
                  <TouchableOpacity
                    key={unit}
                    onPress={() => handleDistanceUnit(unit)}
                    style={[
                      styles.unitChip,
                      isSelected && {
                        backgroundColor: settings.accentColor,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={unit === 'yards' ? 'flag-outline' : 'globe-outline'}
                      size={18}
                      color={isSelected ? colors.background : colors.textSecondary}
                      style={{ marginRight: spacing.xs }}
                    />
                    <Text
                      style={[
                        styles.unitChipText,
                        isSelected && { color: colors.background },
                      ]}
                    >
                      {unit.charAt(0).toUpperCase() + unit.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </AnimatedEntry>

        {/* ==================== ABOUT ==================== */}
        <AnimatedEntry delay={300}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <View style={styles.card}>
            <Text style={styles.versionText}>BCA Archery OS v1.8.0</Text>

            <TouchableOpacity
              style={styles.aboutButton}
              onPress={() => router.push('/changelog')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="document-text-outline"
                size={20}
                color={settings.accentColor}
              />
              <Text
                style={[styles.aboutButtonText, { color: settings.accentColor }]}
              >
                View Changelog
              </Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textMuted}
                style={{ marginLeft: 'auto' }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.aboutButton}
              onPress={() => router.push('/feedback')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={20}
                color={settings.accentColor}
              />
              <Text
                style={[styles.aboutButtonText, { color: settings.accentColor }]}
              >
                Send Feedback
              </Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textMuted}
                style={{ marginLeft: 'auto' }}
              />
            </TouchableOpacity>
          </View>
        </AnimatedEntry>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorCircleOuter: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pill: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  unitChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.xl,
  },
  unitChipText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  versionText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  aboutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  aboutButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});
