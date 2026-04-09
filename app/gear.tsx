import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { getBowConfigs, getArrowConfigs } from '../lib/storage';
import GradientCard from '../components/GradientCard';
import AnimatedEntry from '../components/AnimatedEntry';
import type { BowConfig, ArrowConfig } from '../lib/types';

export default function GearScreen() {
  const router = useRouter();
  const [bows, setBows] = useState<BowConfig[]>([]);
  const [arrows, setArrows] = useState<ArrowConfig[]>([]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getBowConfigs(), getArrowConfigs()]).then(([b, a]) => {
        setBows(b);
        setArrows(a);
      });
    }, [])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <AnimatedEntry>
        <LinearGradient
          colors={[...gradients.heroBg] as [string, string, ...string[]]}
          style={styles.hero}
        >
          <Ionicons name="fitness" size={40} color={colors.primary} />
          <Text style={styles.heroTitle}>YOUR GEAR</Text>
          <Text style={styles.heroSub}>
            {bows.length} bow{bows.length !== 1 ? 's' : ''} / {arrows.length} arrow setup{arrows.length !== 1 ? 's' : ''}
          </Text>
        </LinearGradient>
      </AnimatedEntry>

      {/* Bows Section */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionLeft}>
          <LinearGradient
            colors={[...gradients.primaryToSecondary] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sectionDot}
          />
          <Text style={styles.sectionTitle}>BOWS</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/bow-detail')}
        >
          <Ionicons name="add" size={18} color={colors.primary} />
          <Text style={styles.addBtnText}>Add Bow</Text>
        </TouchableOpacity>
      </View>

      {bows.length === 0 ? (
        <AnimatedEntry delay={100}>
          <TouchableOpacity
            style={styles.emptyCard}
            onPress={() => router.push('/bow-detail')}
          >
            <Ionicons name="add-circle-outline" size={32} color={colors.primary} />
            <Text style={styles.emptyTitle}>Add Your First Bow</Text>
            <Text style={styles.emptySub}>Save your bow setup for quick selection</Text>
          </TouchableOpacity>
        </AnimatedEntry>
      ) : (
        bows.map((bow, i) => (
          <AnimatedEntry key={bow.id} delay={i * 80}>
            <GradientCard onPress={() => router.push({ pathname: '/bow-detail', params: { id: bow.id } })}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardName}>{bow.name}</Text>
                  <Text style={styles.cardModel}>{bow.bowModel}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
              <View style={styles.specRow}>
                {bow.drawWeight ? (
                  <View style={styles.specChip}>
                    <Text style={styles.specLabel}>Draw</Text>
                    <Text style={styles.specValue}>{bow.drawWeight}</Text>
                  </View>
                ) : null}
                {bow.drawLength ? (
                  <View style={styles.specChip}>
                    <Text style={styles.specLabel}>Length</Text>
                    <Text style={styles.specValue}>{bow.drawLength}</Text>
                  </View>
                ) : null}
                {bow.restType ? (
                  <View style={styles.specChip}>
                    <Text style={styles.specLabel}>Rest</Text>
                    <Text style={styles.specValue}>{bow.restType}</Text>
                  </View>
                ) : null}
              </View>
            </GradientCard>
          </AnimatedEntry>
        ))
      )}

      {/* Arrows Section */}
      <View style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
        <View style={styles.sectionLeft}>
          <LinearGradient
            colors={['#00A3FF', '#00FF88'] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sectionDot}
          />
          <Text style={styles.sectionTitle}>ARROWS</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { borderColor: colors.secondary }]}
          onPress={() => router.push('/arrow-detail')}
        >
          <Ionicons name="add" size={18} color={colors.secondary} />
          <Text style={[styles.addBtnText, { color: colors.secondary }]}>Add Arrows</Text>
        </TouchableOpacity>
      </View>

      {arrows.length === 0 ? (
        <AnimatedEntry delay={100}>
          <TouchableOpacity
            style={[styles.emptyCard, { borderColor: colors.secondary + '40' }]}
            onPress={() => router.push('/arrow-detail')}
          >
            <Ionicons name="add-circle-outline" size={32} color={colors.secondary} />
            <Text style={[styles.emptyTitle, { color: colors.secondary }]}>Add Your First Arrow Setup</Text>
            <Text style={styles.emptySub}>Save your arrow specs for quick selection</Text>
          </TouchableOpacity>
        </AnimatedEntry>
      ) : (
        arrows.map((arrow, i) => (
          <AnimatedEntry key={arrow.id} delay={i * 80}>
            <GradientCard
              onPress={() => router.push({ pathname: '/arrow-detail', params: { id: arrow.id } })}
              accentColors={['#00A3FF', '#00C9FF', '#00FF88']}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardName}>{arrow.name}</Text>
                  <Text style={[styles.cardModel, { color: colors.secondary }]}>{arrow.shaftModel}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
              <View style={styles.specRow}>
                {arrow.spine ? (
                  <View style={styles.specChip}>
                    <Text style={styles.specLabel}>Spine</Text>
                    <Text style={[styles.specValue, { color: colors.secondary }]}>{arrow.spine}</Text>
                  </View>
                ) : null}
                {arrow.length ? (
                  <View style={styles.specChip}>
                    <Text style={styles.specLabel}>Length</Text>
                    <Text style={[styles.specValue, { color: colors.secondary }]}>{arrow.length}</Text>
                  </View>
                ) : null}
                {arrow.pointWeight ? (
                  <View style={styles.specChip}>
                    <Text style={styles.specLabel}>Point</Text>
                    <Text style={[styles.specValue, { color: colors.secondary }]}>{arrow.pointWeight}</Text>
                  </View>
                ) : null}
              </View>
            </GradientCard>
          </AnimatedEntry>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: fontSize.xl,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 4,
    marginTop: spacing.sm,
  },
  heroSub: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  addBtnText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.text,
  },
  cardModel: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  specRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  specChip: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  specLabel: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  specValue: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
  },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.sm,
  },
  emptySub: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
