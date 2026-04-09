import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { getPracticeLogs, getBowConfigs, getArrowConfigs } from '../lib/storage';
import GradientCard from '../components/GradientCard';
import AnimatedEntry from '../components/AnimatedEntry';
import { useScreenTracking } from '../lib/useAnalytics';
import type { PracticeLog, BowConfig, ArrowConfig } from '../lib/types';

export default function PracticesScreen() {
  useScreenTracking('practices');
  const router = useRouter();
  const [practices, setPractices] = useState<PracticeLog[]>([]);
  const [bows, setBows] = useState<BowConfig[]>([]);
  const [arrows, setArrows] = useState<ArrowConfig[]>([]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getPracticeLogs(), getBowConfigs(), getArrowConfigs()]).then(([p, b, a]) => {
        setPractices(p);
        setBows(b);
        setArrows(a);
      });
    }, [])
  );

  const getBowName = (id?: string) => bows.find((b) => b.id === id)?.name;
  const getArrowName = (id?: string) => arrows.find((a) => a.id === id)?.name;

  const totalPractices = practices.length;
  const totalHours = practices.reduce((sum, p) => sum + p.duration, 0) / 60;
  const totalArrows = practices.reduce((sum, p) => sum + p.totalArrows, 0);

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={12}
          color={i <= rating ? colors.warning : colors.textMuted}
        />
      );
    }
    return stars;
  };

  const renderPractice = ({ item, index }: { item: PracticeLog; index: number }) => {
    const bowName = getBowName(item.bowConfigId);
    const arrowName = getArrowName(item.arrowConfigId);
    const date = new Date(item.date);

    return (
      <AnimatedEntry delay={index * 40}>
        <GradientCard
          onPress={() => router.push({ pathname: '/practice-detail', params: { id: item.id } })}
          accentColors={[...gradients.cardAccent]}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.date}>
              {date.toLocaleDateString()}
            </Text>
            <View style={styles.headerRight}>
              <Text style={styles.duration}>{item.duration}m</Text>
            </View>
          </View>

          <View style={styles.ratingRow}>
            <View style={styles.stars}>{renderStars(item.rating)}</View>
            {item.totalArrows > 0 && (
              <Text style={styles.arrowCount}>
                <Ionicons name="arrow-up" size={11} color={colors.primary} /> {item.totalArrows} arrows
              </Text>
            )}
          </View>

          {(bowName || arrowName) && (
            <View style={styles.gearTags}>
              {bowName && (
                <View style={styles.gearTag}>
                  <Ionicons name="fitness" size={10} color={colors.primary} />
                  <Text style={styles.gearTagText}>{bowName}</Text>
                </View>
              )}
              {arrowName && (
                <View style={[styles.gearTag, { backgroundColor: colors.secondary + '15' }]}>
                  <Ionicons name="arrow-forward" size={10} color={colors.secondary} />
                  <Text style={[styles.gearTagText, { color: colors.secondary }]}>{arrowName}</Text>
                </View>
              )}
            </View>
          )}

          {item.drills.length > 0 && (
            <View style={styles.drillTags}>
              {item.drills.map((drill) => (
                <View key={drill} style={styles.drillTag}>
                  <Text style={styles.drillTagText}>{drill}</Text>
                </View>
              ))}
            </View>
          )}

          {item.goals ? (
            <Text style={styles.goal} numberOfLines={1}>
              <Ionicons name="flag" size={12} color={colors.secondary} /> {item.goals}
            </Text>
          ) : null}
        </GradientCard>
      </AnimatedEntry>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={practices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderPractice}
        ListHeaderComponent={
          practices.length > 0 ? (
            <AnimatedEntry>
              <View style={styles.summaryRow}>
                <View style={styles.summaryBox}>
                  <LinearGradient
                    colors={[...gradients.primaryFade] as [string, string]}
                    style={styles.summaryGradient}
                  >
                    <Text style={[styles.summaryValue, { color: colors.primary }]}>{totalPractices}</Text>
                    <Text style={styles.summaryLabel}>Practices</Text>
                  </LinearGradient>
                </View>
                <View style={styles.summaryBox}>
                  <LinearGradient
                    colors={[...gradients.secondaryFade] as [string, string]}
                    style={styles.summaryGradient}
                  >
                    <Text style={[styles.summaryValue, { color: colors.secondary }]}>{totalHours.toFixed(1)}</Text>
                    <Text style={styles.summaryLabel}>Hours</Text>
                  </LinearGradient>
                </View>
                <View style={styles.summaryBox}>
                  <LinearGradient
                    colors={[...gradients.primaryFade] as [string, string]}
                    style={styles.summaryGradient}
                  >
                    <Text style={[styles.summaryValue, { color: colors.primary }]}>{totalArrows}</Text>
                    <Text style={styles.summaryLabel}>Arrows</Text>
                  </LinearGradient>
                </View>
              </View>
            </AnimatedEntry>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <LinearGradient
              colors={[colors.surface, colors.background] as [string, string]}
              style={styles.emptyGradient}
            >
              <Ionicons name="disc-outline" size={56} color={colors.textMuted} />
              <Text style={styles.emptyText}>No practice logs yet</Text>
              <Text style={styles.emptySubtext}>Tap + to log your first practice</Text>
            </LinearGradient>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/practice-detail')} activeOpacity={0.8}>
        <LinearGradient
          colors={[...gradients.primaryToSecondary] as [string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color={colors.background} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, paddingBottom: 100 },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  summaryBox: { flex: 1, borderRadius: borderRadius.md, overflow: 'hidden' },
  summaryGradient: { padding: spacing.md, alignItems: 'center', borderRadius: borderRadius.md },
  summaryValue: { fontSize: fontSize.xl, fontWeight: '800' },
  summaryLabel: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', marginTop: spacing.xs },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  date: { fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
  duration: { fontSize: fontSize.lg, fontWeight: '800', color: colors.secondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xs },
  stars: { flexDirection: 'row', gap: 2 },
  arrowCount: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  gearTags: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs },
  gearTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary + '15', borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  gearTagText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.primary },
  drillTags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.xs },
  drillTag: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  drillTagText: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '600' },
  goal: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  empty: { borderRadius: borderRadius.lg, overflow: 'hidden', marginTop: spacing.xxl },
  emptyGradient: { alignItems: 'center', paddingVertical: spacing.xxl, borderRadius: borderRadius.lg },
  emptyText: { fontSize: fontSize.lg, color: colors.textSecondary, fontWeight: '600', marginTop: spacing.md },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28,
    overflow: 'hidden', elevation: 8, shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  fabGradient: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
});
