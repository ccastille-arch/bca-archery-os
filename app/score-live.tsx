import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { getLiveRounds, saveLiveRound } from '../lib/storage';
import AnimatedEntry from '../components/AnimatedEntry';
import type { LiveRound } from '../lib/types';
import { ASA_SCORE_VALUES, IBO_SCORE_VALUES } from '../lib/types';

export default function ScoreLiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [round, setRound] = useState<LiveRound | null>(null);
  const [currentTargetIdx, setCurrentTargetIdx] = useState(0);
  const [activeShooterIdx, setActiveShooterIdx] = useState(0);

  useEffect(() => {
    if (id) loadRound();
  }, [id]);

  const loadRound = async () => {
    const rounds = await getLiveRounds();
    const r = rounds.find((r) => r.id === id);
    if (r) setRound(r);
  };

  const getTargetNumbers = (r: LiveRound): number[] => {
    const nums = [];
    for (let i = 0; i < r.totalTargets; i++) {
      nums.push(((r.startingTarget - 1 + i) % r.totalTargets) + 1);
    }
    return nums;
  };

  // Shooter rotation: on each target the order shifts by 1
  // Target 0: [A, B, C] — A shoots first
  // Target 1: [B, C, A] — B shoots first
  // Target 2: [C, A, B] — C shoots first
  const getShooterOrder = (r: LiveRound, targetIdx: number): typeof r.shooters => {
    if (r.shooters.length <= 1) return r.shooters;
    const shift = targetIdx % r.shooters.length;
    return [...r.shooters.slice(shift), ...r.shooters.slice(0, shift)];
  };

  if (!round) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: colors.textSecondary }}>Loading...</Text>
    </View>
  );

  const scoreValues = round.format === 'ibo' ? IBO_SCORE_VALUES : ASA_SCORE_VALUES;
  const targetNumbers = getTargetNumbers(round);
  const currentTargetNum = targetNumbers[currentTargetIdx];
  const currentTarget = round.targets.find((t) => t.targetNum === currentTargetNum);

  // Get rotated shooter order for this target
  const shooterOrder = getShooterOrder(round, currentTargetIdx);
  const currentShooter = shooterOrder[activeShooterIdx];
  const currentShooterScore = currentTarget?.scores[currentShooter?.id] ?? undefined;

  // Calculate totals
  const getShooterTotal = (shooterId: string): number => {
    return round.targets.reduce((sum, t) => sum + (t.scores[shooterId] || 0), 0);
  };

  const getShooterPlusMinus = (shooterId: string): string => {
    const scored = round.targets.filter((t) => t.scores[shooterId] !== undefined);
    if (scored.length === 0) return '+0';
    const total = scored.reduce((sum, t) => sum + (t.scores[shooterId] || 0), 0);
    const diff = total - (scored.length * 10);
    return diff >= 0 ? `+${diff}` : `${diff}`;
  };

  // Find next unscored shooter on this target (for auto-highlight, NOT auto-advance target)
  const findNextUnscoredShooter = (): number => {
    for (let i = 0; i < shooterOrder.length; i++) {
      const s = currentTarget?.scores[shooterOrder[i].id];
      if (s === undefined) return i;
    }
    return 0; // all scored, stay on first
  };

  const handleScore = async (value: number) => {
    if (!currentShooter) return;
    const updatedRound = { ...round };
    let target = updatedRound.targets.find((t) => t.targetNum === currentTargetNum);
    if (!target) {
      target = { targetNum: currentTargetNum, scores: {} };
      updatedRound.targets.push(target);
    }
    target.scores[currentShooter.id] = value;

    setRound(updatedRound);
    await saveLiveRound(updatedRound);

    // Auto-highlight next UNSCORED shooter on THIS target only (never auto-advance target)
    const nextUnscored = findNextUnscoredOnUpdated(updatedRound, currentTargetNum, shooterOrder);
    if (nextUnscored >= 0) {
      setActiveShooterIdx(nextUnscored);
    }
    // If all scored on this target, stay put — user manually navigates to next target
  };

  const findNextUnscoredOnUpdated = (r: LiveRound, targetNum: number, order: typeof round.shooters): number => {
    const target = r.targets.find((t) => t.targetNum === targetNum);
    for (let i = 0; i < order.length; i++) {
      if (target?.scores[order[i].id] === undefined) return i;
    }
    return -1; // all scored
  };

  const handleClearScore = async () => {
    if (!currentShooter || !currentTarget) return;
    const updatedRound = { ...round };
    const target = updatedRound.targets.find((t) => t.targetNum === currentTargetNum);
    if (target) {
      delete target.scores[currentShooter.id];
      setRound(updatedRound);
      await saveLiveRound(updatedRound);
    }
  };

  // Navigate targets freely
  const goToTarget = (idx: number) => {
    setCurrentTargetIdx(idx);
    // Reset active shooter to first unscored on the new target
    const newTargetNum = targetNumbers[idx];
    const newOrder = getShooterOrder(round, idx);
    const target = round.targets.find((t) => t.targetNum === newTargetNum);
    let firstUnscored = 0;
    if (target) {
      for (let i = 0; i < newOrder.length; i++) {
        if (target.scores[newOrder[i].id] === undefined) { firstUnscored = i; break; }
      }
    }
    setActiveShooterIdx(firstUnscored);
  };

  const handleFinish = async () => {
    Alert.alert('Finish Round', 'Are you sure you want to end this round?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Finish', onPress: async () => {
        const updated = { ...round, completed: true };
        await saveLiveRound(updated);
        router.replace('/rounds');
      }},
    ]);
  };

  // Check if all shooters scored on current target
  const allScoredOnTarget = shooterOrder.every((s) => currentTarget?.scores[s.id] !== undefined);
  const targetsFullyScored = targetNumbers.filter((tNum) => {
    const t = round.targets.find((t) => t.targetNum === tNum);
    return t && round.shooters.every((s) => t.scores[s.id] !== undefined);
  }).length;
  const progressPct = (targetsFullyScored / round.totalTargets) * 100;

  return (
    <>
      <Stack.Screen options={{
        title: round.name || 'LIVE SCORING',
        headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text,
        headerRight: () => (
          <TouchableOpacity onPress={handleFinish}>
            <Text style={{ color: colors.danger, fontWeight: '700', fontSize: fontSize.sm }}>Finish</Text>
          </TouchableOpacity>
        ),
      }} />
      <View style={styles.container}>
        {/* Progress */}
        <View style={styles.progressWrap}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]}>
              <LinearGradient colors={[...gradients.primaryToSecondary] as [string, string]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
            </View>
          </View>
          <Text style={styles.progressText}>{targetsFullyScored}/{round.totalTargets} targets complete</Text>
        </View>

        {/* Target navigation — always free to go back/forward */}
        <View style={styles.targetNav}>
          <TouchableOpacity style={styles.navBtn}
            onPress={() => { if (currentTargetIdx > 0) goToTarget(currentTargetIdx - 1); }}>
            <Ionicons name="chevron-back" size={28} color={currentTargetIdx > 0 ? colors.primary : colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.targetCenter}>
            <Text style={styles.targetLabel}>Target: {currentTargetNum}</Text>
            {allScoredOnTarget && (
              <View style={styles.completeBadge}>
                <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                <Text style={styles.completeText}>All scored</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.navBtn}
            onPress={() => { if (currentTargetIdx < targetNumbers.length - 1) goToTarget(currentTargetIdx + 1); }}>
            <Ionicons name="chevron-forward" size={28} color={currentTargetIdx < targetNumbers.length - 1 ? colors.primary : colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Shooting order indicator */}
        <View style={styles.orderBar}>
          <Ionicons name="swap-horizontal" size={14} color={colors.warning} />
          <Text style={styles.orderText}>
            Shooting order: <Text style={{ color: colors.primary }}>{shooterOrder[0]?.name}</Text> shoots first
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scoringArea}>
          {/* Shooters in rotated order */}
          {shooterOrder.map((shooter, idx) => {
            const score = currentTarget?.scores[shooter.id];
            const total = getShooterTotal(shooter.id);
            const pm = getShooterPlusMinus(shooter.id);
            const isActive = idx === activeShooterIdx;

            return (
              <TouchableOpacity key={shooter.id}
                style={[styles.shooterRow, isActive && styles.shooterRowActive]}
                onPress={() => setActiveShooterIdx(idx)}>
                <View style={styles.orderNum}>
                  <Text style={styles.orderNumText}>{idx + 1}</Text>
                </View>
                <View style={styles.shooterInfo}>
                  <Text style={[styles.shooterName, isActive && { color: colors.primary }]}>{shooter.name}</Text>
                  {shooter.bowClass ? <Text style={styles.shooterClass}>{shooter.bowClass}</Text> : null}
                </View>
                <View style={styles.shooterStats}>
                  <Text style={styles.shooterTotal}>{total}</Text>
                  <Text style={[styles.shooterPM, {
                    color: pm.startsWith('+') && pm !== '+0' ? colors.primary : pm.startsWith('-') ? colors.danger : colors.textSecondary,
                  }]}>/ {pm}</Text>
                </View>
                {score !== undefined ? (
                  <View style={[styles.scoredBadge, {
                    backgroundColor: score >= 12 ? '#FFD700' : score >= 10 ? colors.primary + '30' : score >= 8 ? colors.secondary + '30' : colors.surface,
                  }]}>
                    <Text style={[styles.scoredText, {
                      color: score >= 12 ? '#000' : score >= 10 ? colors.primary : score >= 8 ? colors.secondary : colors.textSecondary,
                    }]}>{score}</Text>
                  </View>
                ) : (
                  <View style={styles.unscoredBadge}>
                    <Text style={styles.unscoredText}>—</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Score buttons */}
          <View style={styles.scoringHeader}>
            <Text style={styles.scoringLabel}>
              Scoring: <Text style={{ color: colors.primary, fontWeight: '800' }}>{currentShooter?.name || '—'}</Text>
            </Text>
            {currentShooterScore !== undefined && (
              <TouchableOpacity style={styles.clearBtn} onPress={handleClearScore}>
                <Ionicons name="close-circle" size={16} color={colors.danger} />
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.scoreButtons}>
            {scoreValues.map((value) => {
              const isSelected = currentShooterScore === value;
              const btnColor = value >= 14 ? '#00FF88' : value >= 12 ? '#FF4444' : value >= 10 ? '#FFD700' : value >= 8 ? '#222' : value >= 5 ? '#FFF' : '#888';
              const textColor = value >= 14 ? '#000' : value >= 12 ? '#FFF' : value >= 10 ? '#000' : value >= 8 ? '#FFF' : value >= 5 ? '#000' : '#FFF';

              return (
                <TouchableOpacity key={value} style={[styles.scoreBtn, { backgroundColor: btnColor }, isSelected && styles.scoreBtnSelected]}
                  onPress={() => handleScore(value)} activeOpacity={0.7}>
                  <Text style={[styles.scoreBtnText, { color: textColor }]}>{value}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Next target button (only shows when all scored) */}
          {allScoredOnTarget && currentTargetIdx < targetNumbers.length - 1 && (
            <TouchableOpacity style={styles.nextTargetBtn} onPress={() => goToTarget(currentTargetIdx + 1)}>
              <LinearGradient colors={[...gradients.primaryToSecondary] as [string, string]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.nextTargetBtnInner}>
                <Text style={styles.nextTargetText}>NEXT TARGET</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.background} />
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Scorecard summary */}
          <Text style={styles.cardTitle}>SCORECARD</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View>
              <View style={styles.cardRow}>
                <Text style={[styles.cardCell, styles.cardNameCell, { fontWeight: '800', color: colors.textSecondary }]}>Name</Text>
                {targetNumbers.map((tNum, idx) => (
                  <TouchableOpacity key={tNum} onPress={() => goToTarget(idx)}>
                    <Text style={[styles.cardCell, styles.cardScoreCell, {
                      fontWeight: '800', color: tNum === currentTargetNum ? colors.primary : colors.textSecondary,
                      textDecorationLine: tNum === currentTargetNum ? 'underline' : 'none',
                    }]}>{tNum}</Text>
                  </TouchableOpacity>
                ))}
                <Text style={[styles.cardCell, styles.cardTotalCell, { fontWeight: '800', color: colors.primary }]}>TOT</Text>
              </View>
              {round.shooters.map((shooter) => (
                <View key={shooter.id} style={styles.cardRow}>
                  <Text style={[styles.cardCell, styles.cardNameCell]} numberOfLines={1}>{shooter.name}</Text>
                  {targetNumbers.map((tNum, idx) => {
                    const target = round.targets.find((t) => t.targetNum === tNum);
                    const s = target?.scores[shooter.id];
                    return (
                      <TouchableOpacity key={tNum} onPress={() => goToTarget(idx)}>
                        <Text style={[styles.cardCell, styles.cardScoreCell, {
                          color: s !== undefined ? (s >= 12 ? '#FFD700' : s >= 10 ? colors.primary : s >= 8 ? colors.secondary : colors.textSecondary) : colors.textMuted,
                        }]}>{s !== undefined ? s : '·'}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  <Text style={[styles.cardCell, styles.cardTotalCell, { color: colors.primary }]}>{getShooterTotal(shooter.id)}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  progressWrap: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  progressBar: { height: 4, backgroundColor: colors.surface, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2, overflow: 'hidden' },
  progressText: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
  targetNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  navBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  targetCenter: { alignItems: 'center' },
  targetLabel: { fontSize: fontSize.xxl, fontWeight: '900', color: colors.text },
  completeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  completeText: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600' },
  orderBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.warning + '10', borderBottomWidth: 1, borderBottomColor: colors.border },
  orderText: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '600' },
  scoringArea: { padding: spacing.md, paddingBottom: spacing.xxl * 2 },
  shooterRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.xs, borderWidth: 2, borderColor: 'transparent' },
  shooterRowActive: { borderColor: colors.primary, backgroundColor: colors.primary + '08' },
  orderNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  orderNumText: { fontSize: fontSize.xs, fontWeight: '800', color: colors.textSecondary },
  shooterInfo: { flex: 1 },
  shooterName: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  shooterClass: { fontSize: fontSize.xs, color: colors.textSecondary },
  shooterStats: { flexDirection: 'row', alignItems: 'baseline', marginRight: spacing.md },
  shooterTotal: { fontSize: fontSize.xl, fontWeight: '900', color: colors.text },
  shooterPM: { fontSize: fontSize.sm, fontWeight: '700', marginLeft: 2 },
  scoredBadge: { width: 48, height: 48, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  scoredText: { fontSize: fontSize.xl, fontWeight: '900' },
  unscoredBadge: { width: 48, height: 48, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceLight },
  unscoredText: { fontSize: fontSize.xl, color: colors.textMuted },
  scoringHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.sm },
  scoringLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: colors.danger + '15' },
  clearText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.danger },
  scoreButtons: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  scoreBtn: { width: 52, height: 52, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  scoreBtnSelected: { borderWidth: 3, borderColor: colors.primary, transform: [{ scale: 1.05 }] },
  scoreBtnText: { fontSize: fontSize.xl, fontWeight: '900' },
  nextTargetBtn: { marginTop: spacing.md, borderRadius: borderRadius.md, overflow: 'hidden' },
  nextTargetBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  nextTargetText: { fontSize: fontSize.sm, fontWeight: '800', color: colors.background, letterSpacing: 1 },
  cardTitle: { fontSize: fontSize.xs, fontWeight: '800', color: colors.textSecondary, letterSpacing: 2, marginTop: spacing.xl, marginBottom: spacing.sm },
  cardRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  cardCell: { paddingVertical: spacing.xs, paddingHorizontal: 2, fontSize: fontSize.xs, color: colors.text, textAlign: 'center' },
  cardNameCell: { width: 70, textAlign: 'left', fontWeight: '600' },
  cardScoreCell: { width: 28, fontWeight: '600' },
  cardTotalCell: { width: 40, fontWeight: '900' },
});
