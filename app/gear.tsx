import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { getBowConfigs, getArrowConfigs, getStabilizerTests, getTuneLogs } from '../lib/storage';
import GradientCard from '../components/GradientCard';
import AnimatedEntry from '../components/AnimatedEntry';
import { useScreenTracking } from '../lib/useAnalytics';
import type { BowConfig, ArrowConfig, StabilizerTest, TuneLog } from '../lib/types';

export default function GearScreen() {
  useScreenTracking('gear');
  const router = useRouter();
  const [bows, setBows] = useState<BowConfig[]>([]);
  const [arrows, setArrows] = useState<ArrowConfig[]>([]);
  const [stabTests, setStabTests] = useState<StabilizerTest[]>([]);
  const [tuneLogs, setTuneLogs] = useState<TuneLog[]>([]);

  useFocusEffect(useCallback(() => {
    Promise.all([getBowConfigs(), getArrowConfigs(), getStabilizerTests(), getTuneLogs()])
      .then(([b, a, st, tl]) => { setBows(b); setArrows(a); setStabTests(st); setTuneLogs(tl); });
  }, []));

  const SectionHeader = ({ title, count, color, onAdd, addLabel }: {
    title: string; count: number; color: string; onAdd: () => void; addLabel: string;
  }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLeft}>
        <View style={[styles.sectionDot, { backgroundColor: color }]} />
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={[styles.countBadge, { backgroundColor: color + '20' }]}>
          <Text style={[styles.countText, { color }]}>{count}</Text>
        </View>
      </View>
      <TouchableOpacity style={[styles.addBtn, { borderColor: color }]} onPress={onAdd}>
        <Ionicons name="add" size={14} color={color} />
        <Text style={[styles.addBtnText, { color }]}>{addLabel}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <AnimatedEntry>
        <LinearGradient colors={[...gradients.heroBg] as [string, string, ...string[]]} style={styles.hero}>
          <Ionicons name="fitness" size={36} color={colors.primary} />
          <Text style={styles.heroTitle}>YOUR GEAR</Text>
          <Text style={styles.heroSub}>
            {bows.length} bows / {arrows.length} arrow setups / {stabTests.length} stab tests / {tuneLogs.length} tune logs
          </Text>
        </LinearGradient>
      </AnimatedEntry>

      {/* ====== BOWS ====== */}
      <SectionHeader title="BOWS" count={bows.length} color={colors.primary}
        onAdd={() => router.push('/bow-detail')} addLabel="Add Bow" />
      {bows.length === 0 ? (
        <TouchableOpacity style={styles.emptyCard} onPress={() => router.push('/bow-detail')}>
          <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.primary }]}>Add Your First Bow</Text>
        </TouchableOpacity>
      ) : bows.map((bow, i) => (
        <AnimatedEntry key={bow.id} delay={i * 60}>
          <GradientCard onPress={() => router.push({ pathname: '/bow-detail', params: { id: bow.id } })}>
            <View style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{bow.name}</Text>
                <Text style={styles.cardSub}>{bow.bowModel} {bow.bowType ? `(${bow.bowType})` : ''}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
            <View style={styles.specRow}>
              {bow.drawWeight ? <View style={styles.spec}><Text style={styles.specLabel}>Draw</Text><Text style={styles.specVal}>{bow.drawWeight}</Text></View> : null}
              {bow.drawLength ? <View style={styles.spec}><Text style={styles.specLabel}>Length</Text><Text style={styles.specVal}>{bow.drawLength}</Text></View> : null}
              {bow.frontStabilizer?.brand ? <View style={styles.spec}><Text style={styles.specLabel}>Front</Text><Text style={styles.specVal}>{bow.frontStabilizer.brand}</Text></View> : null}
              {(bow.backBars?.length || 0) > 0 && bow.backBars[0]?.brand ? <View style={styles.spec}><Text style={styles.specLabel}>Back</Text><Text style={styles.specVal}>{bow.backBars.length} bar{bow.backBars.length > 1 ? 's' : ''}</Text></View> : null}
            </View>
          </GradientCard>
        </AnimatedEntry>
      ))}

      {/* ====== ARROWS ====== */}
      <SectionHeader title="ARROWS" count={arrows.length} color={colors.secondary}
        onAdd={() => router.push('/arrow-detail')} addLabel="Add Arrows" />
      {arrows.length === 0 ? (
        <TouchableOpacity style={[styles.emptyCard, { borderColor: colors.secondary + '40' }]} onPress={() => router.push('/arrow-detail')}>
          <Ionicons name="add-circle-outline" size={28} color={colors.secondary} />
          <Text style={[styles.emptyTitle, { color: colors.secondary }]}>Add Your First Arrow Setup</Text>
        </TouchableOpacity>
      ) : arrows.map((arrow, i) => (
        <AnimatedEntry key={arrow.id} delay={i * 60}>
          <GradientCard onPress={() => router.push({ pathname: '/arrow-detail', params: { id: arrow.id } })}
            accentColors={['#00A3FF', '#00C9FF', '#00FF88']}>
            <View style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{arrow.name}</Text>
                <Text style={[styles.cardSub, { color: colors.secondary }]}>{arrow.shaftModel} {arrow.spine ? `/ ${arrow.spine} spine` : ''}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
            <View style={styles.specRow}>
              {arrow.totalArrowWeight ? <View style={styles.spec}><Text style={styles.specLabel}>Weight</Text><Text style={[styles.specVal, { color: colors.secondary }]}>{arrow.totalArrowWeight}</Text></View> : null}
              {arrow.foc ? <View style={styles.spec}><Text style={styles.specLabel}>FOC</Text><Text style={[styles.specVal, { color: colors.secondary }]}>{arrow.foc}</Text></View> : null}
              {arrow.arrowCount ? <View style={styles.spec}><Text style={styles.specLabel}>Count</Text><Text style={[styles.specVal, { color: colors.secondary }]}>{arrow.arrowCount}</Text></View> : null}
            </View>
          </GradientCard>
        </AnimatedEntry>
      ))}

      {/* ====== STABILIZER LAB ====== */}
      <SectionHeader title="STABILIZER LAB" count={stabTests.length} color="#FF8C00"
        onAdd={() => router.push('/stabilizer-test')} addLabel="New Test" />
      {stabTests.length === 0 ? (
        <TouchableOpacity style={[styles.emptyCard, { borderColor: '#FF8C0040' }]} onPress={() => router.push('/stabilizer-test')}>
          <Ionicons name="flask-outline" size={28} color="#FF8C00" />
          <Text style={[styles.emptyTitle, { color: '#FF8C00' }]}>Test Your First Stabilizer Setup</Text>
          <Text style={styles.emptySub}>Compare weights, angles, and feel</Text>
        </TouchableOpacity>
      ) : stabTests.slice(0, 3).map((test, i) => (
        <AnimatedEntry key={test.id} delay={i * 60}>
          <GradientCard onPress={() => router.push({ pathname: '/stabilizer-test', params: { id: test.id } })}
            accentColors={['#FF8C00', '#FFB800', '#00FF88']}>
            <View style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{test.distance}m — {test.groupSize || 'No group noted'}</Text>
                <Text style={styles.cardSub}>{new Date(test.date).toLocaleDateString()}</Text>
              </View>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons key={s} name={s <= test.shotFeel ? 'star' : 'star-outline'} size={12} color="#FFB800" />
                ))}
              </View>
            </View>
            <View style={styles.tagRow}>
              <View style={[styles.tag, { backgroundColor: '#FF8C0020' }]}><Text style={[styles.tagText, { color: '#FF8C00' }]}>{test.holdFeeling}</Text></View>
              <View style={[styles.tag, { backgroundColor: '#FF8C0020' }]}><Text style={[styles.tagText, { color: '#FF8C00' }]}>{test.balancePoint}</Text></View>
              {test.isFavorite && <Ionicons name="heart" size={14} color={colors.danger} />}
            </View>
          </GradientCard>
        </AnimatedEntry>
      ))}

      {/* ====== TUNING LOG ====== */}
      <SectionHeader title="TUNING LOG" count={tuneLogs.length} color="#9B59B6"
        onAdd={() => router.push('/tune-detail')} addLabel="New Tune" />
      {tuneLogs.length === 0 ? (
        <TouchableOpacity style={[styles.emptyCard, { borderColor: '#9B59B640' }]} onPress={() => router.push('/tune-detail')}>
          <Ionicons name="construct-outline" size={28} color="#9B59B6" />
          <Text style={[styles.emptyTitle, { color: '#9B59B6' }]}>Log Your First Tuning Session</Text>
          <Text style={styles.emptySub}>Paper tune, walk-back, bare shaft & more</Text>
        </TouchableOpacity>
      ) : tuneLogs.slice(0, 3).map((log, i) => (
        <AnimatedEntry key={log.id} delay={i * 60}>
          <GradientCard onPress={() => router.push({ pathname: '/tune-detail', params: { id: log.id } })}
            accentColors={['#9B59B6', '#8E44AD', '#00A3FF']}>
            <View style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{log.tuneType.replace('-', ' ').toUpperCase()}</Text>
                <Text style={styles.cardSub}>{new Date(log.date).toLocaleDateString()}</Text>
              </View>
              <View style={[styles.resultBadge, {
                backgroundColor: log.result === 'bullet-hole' ? colors.primary + '20' :
                  log.result === 'improving' ? colors.secondary + '20' :
                  log.result === 'worse' ? colors.danger + '20' : colors.surface,
              }]}>
                <Text style={[styles.resultText, {
                  color: log.result === 'bullet-hole' ? colors.primary :
                    log.result === 'improving' ? colors.secondary :
                    log.result === 'worse' ? colors.danger : colors.textSecondary,
                }]}>{log.result}</Text>
              </View>
            </View>
          </GradientCard>
        </AnimatedEntry>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  hero: { alignItems: 'center', paddingVertical: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.lg },
  heroTitle: { fontSize: fontSize.xl, fontWeight: '900', color: colors.text, letterSpacing: 4, marginTop: spacing.sm },
  heroSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm, marginTop: spacing.lg },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionDot: { width: 10, height: 10, borderRadius: 5 },
  sectionTitle: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary, letterSpacing: 2 },
  countBadge: { borderRadius: borderRadius.full, paddingHorizontal: 6, paddingVertical: 1 },
  countText: { fontSize: fontSize.xs, fontWeight: '800' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  addBtnText: { fontSize: fontSize.xs, fontWeight: '700' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  cardSub: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600', marginTop: 2 },
  specRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  spec: { backgroundColor: colors.surfaceLight, borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  specLabel: { fontSize: 9, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  specVal: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '700' },
  tagRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm, alignItems: 'center' },
  tag: { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  tagText: { fontSize: fontSize.xs, fontWeight: '600', textTransform: 'capitalize' },
  ratingRow: { flexDirection: 'row', gap: 1 },
  resultBadge: { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  resultText: { fontSize: fontSize.xs, fontWeight: '700', textTransform: 'capitalize' },
  emptyCard: { alignItems: 'center', padding: spacing.lg, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.primary + '40', borderStyle: 'dashed', backgroundColor: colors.surface, marginBottom: spacing.sm },
  emptyTitle: { fontSize: fontSize.sm, fontWeight: '700', marginTop: spacing.sm },
  emptySub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
});
