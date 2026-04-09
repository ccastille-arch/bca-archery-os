import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { getLiveRounds, saveLiveRound } from '../lib/storage';
import AnimatedEntry from '../components/AnimatedEntry';
import type { LiveRound, TargetScore } from '../lib/types';
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
    if (r) {
      setRound(r);
      // Find first unscored target
      const firstUnscored = getTargetNumbers(r).findIndex((tNum) => {
        const t = r.targets.find((t) => t.targetNum === tNum);
        return !t || Object.keys(t.scores).length < r.shooters.length;
      });
      if (firstUnscored >= 0) setCurrentTargetIdx(firstUnscored);
    }
  };

  const getTargetNumbers = (r: LiveRound): number[] => {
    const nums = [];
    for (let i = 0; i < r.totalTargets; i++) {
      nums.push(((r.startingTarget - 1 + i) % r.totalTargets) + 1);
    }
    return nums;
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
  const currentShooter = round.shooters[activeShooterIdx];

  const currentShooterScore = currentTarget?.scores[currentShooter?.id] ?? undefined;

  // Calculate totals
  const getShooterTotal = (shooterId: string): number => {
    return round.targets.reduce((sum, t) => sum + (t.scores[shooterId] || 0), 0);
  };

  const getShooterAvg = (shooterId: string): string => {
    const scored = round.targets.filter((t) => t.scores[shooterId] !== undefined);
    if (scored.length === 0) return '0';
    const total = scored.reduce((sum, t) => sum + (t.scores[shooterId] || 0), 0);
    return (total / scored.length).toFixed(1);
  };

  const getShooterPlusMinus = (shooterId: string): string => {
    const scored = round.targets.filter((t) => t.scores[shooterId] !== undefined);
    if (scored.length === 0) return '+0';
    const total = scored.reduce((sum, t) => sum + (t.scores[shooterId] || 0), 0);
    const base = round.format === 'asa' ? 10 : 10;
    const diff = total - (scored.length * base);
    return diff >= 0 ? `+${diff}` : `${diff}`;
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

    // Auto-advance to next shooter, or next target
    if (activeShooterIdx < round.shooters.length - 1) {
      setActiveShooterIdx(activeShooterIdx + 1);
    } else if (currentTargetIdx < targetNumbers.length - 1) {
      setCurrentTargetIdx(currentTargetIdx + 1);
      setActiveShooterIdx(0);
    }

    setRound(updatedRound);
    await saveLiveRound(updatedRound);
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

  const targetsScored = round.targets.length;
  const progressPct = (targetsScored / round.totalTargets) * 100;

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
        </View>

        {/* Target navigation */}
        <View style={styles.targetNav}>
          <TouchableOpacity style={styles.navBtn}
            onPress={() => { if (currentTargetIdx > 0) { setCurrentTargetIdx(currentTargetIdx - 1); setActiveShooterIdx(0); } }}>
            <Ionicons name="chevron-back" size={28} color={currentTargetIdx > 0 ? colors.primary : colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.targetCenter}>
            <Text style={styles.targetLabel}>Target: {currentTargetNum}</Text>
          </View>
          <TouchableOpacity style={styles.navBtn}
            onPress={() => { if (currentTargetIdx < targetNumbers.length - 1) { setCurrentTargetIdx(currentTargetIdx + 1); setActiveShooterIdx(0); } }}>
            <Ionicons name="chevron-forward" size={28} color={currentTargetIdx < targetNumbers.length - 1 ? colors.primary : colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Shooters + scores for this target */}
        <ScrollView contentContainerStyle={styles.scoringArea}>
          {round.shooters.map((shooter, idx) => {
            const score = currentTarget?.scores[shooter.id];
            const total = getShooterTotal(shooter.id);
            const pm = getShooterPlusMinus(shooter.id);
            const isActive = idx === activeShooterIdx;

            return (
              <TouchableOpacity key={shooter.id}
                style={[styles.shooterRow, isActive && styles.shooterRowActive]}
                onPress={() => setActiveShooterIdx(idx)}>
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
          <AnimatedEntry>
            <Text style={styles.scoringLabel}>
              Scoring: <Text style={{ color: colors.primary, fontWeight: '800' }}>{currentShooter?.name || '—'}</Text>
            </Text>
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
          </AnimatedEntry>

          {/* Scorecard summary */}
          <Text style={styles.cardTitle}>SCORECARD</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View>
              {/* Header row */}
              <View style={styles.cardRow}>
                <Text style={[styles.cardCell, styles.cardNameCell, { fontWeight: '800', color: colors.textSecondary }]}>Name</Text>
                {targetNumbers.map((tNum) => (
                  <Text key={tNum} style={[styles.cardCell, styles.cardScoreCell, {
                    fontWeight: '800', color: tNum === currentTargetNum ? colors.primary : colors.textSecondary,
                  }]}>{tNum}</Text>
                ))}
                <Text style={[styles.cardCell, styles.cardTotalCell, { fontWeight: '800', color: colors.primary }]}>TOT</Text>
              </View>
              {/* Shooter rows */}
              {round.shooters.map((shooter) => (
                <View key={shooter.id} style={styles.cardRow}>
                  <Text style={[styles.cardCell, styles.cardNameCell]} numberOfLines={1}>{shooter.name}</Text>
                  {targetNumbers.map((tNum) => {
                    const target = round.targets.find((t) => t.targetNum === tNum);
                    const s = target?.scores[shooter.id];
                    return (
                      <Text key={tNum} style={[styles.cardCell, styles.cardScoreCell, {
                        color: s !== undefined ? (s >= 12 ? '#FFD700' : s >= 10 ? colors.primary : s >= 8 ? colors.secondary : colors.textSecondary) : colors.textMuted,
                      }]}>{s !== undefined ? s : '·'}</Text>
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
  targetNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  navBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  targetCenter: { alignItems: 'center' },
  targetLabel: { fontSize: fontSize.xxl, fontWeight: '900', color: colors.text },
  scoringArea: { padding: spacing.md, paddingBottom: spacing.xxl * 2 },
  shooterRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.xs, borderWidth: 2, borderColor: 'transparent' },
  shooterRowActive: { borderColor: colors.primary, backgroundColor: colors.primary + '08' },
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
  scoringLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600', marginTop: spacing.lg, marginBottom: spacing.sm },
  scoreButtons: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  scoreBtn: { width: 52, height: 52, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  scoreBtnSelected: { borderWidth: 3, borderColor: colors.primary, transform: [{ scale: 1.05 }] },
  scoreBtnText: { fontSize: fontSize.xl, fontWeight: '900' },
  cardTitle: { fontSize: fontSize.xs, fontWeight: '800', color: colors.textSecondary, letterSpacing: 2, marginTop: spacing.xl, marginBottom: spacing.sm },
  cardRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  cardCell: { paddingVertical: spacing.xs, paddingHorizontal: 2, fontSize: fontSize.xs, color: colors.text, textAlign: 'center' },
  cardNameCell: { width: 70, textAlign: 'left', fontWeight: '600' },
  cardScoreCell: { width: 28, fontWeight: '600' },
  cardTotalCell: { width: 40, fontWeight: '900' },
});
