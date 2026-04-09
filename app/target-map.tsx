import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import TargetFace, { type TargetType } from '../components/TargetFace';
import AnimatedEntry from '../components/AnimatedEntry';
import { analyzeGroup, type ArrowImpact, type GroupAnalysis } from '../lib/ballistics';
import { useScreenTracking } from '../lib/useAnalytics';

const TARGET_TYPES: { key: TargetType; label: string; radius: number }[] = [
  { key: 'vegas-3spot', label: 'Vegas 3-Spot', radius: 6 },
  { key: '5-spot', label: 'NFAA 5-Spot', radius: 3 },
  { key: 'asa-3d', label: 'ASA 3D', radius: 12 },
  { key: 'fita', label: 'FITA / WA', radius: 24 },
  { key: 'standard', label: 'Single Spot', radius: 12 },
];

const ARROWS_PER_END = [1, 3, 5, 6];
const ROUND_ENDS = [1, 5, 6, 10, 12, 20, 30];

interface EndData {
  endNum: number;
  impacts: ArrowImpact[];
  analysis: GroupAnalysis | null;
}

export default function TargetMapScreen() {
  useScreenTracking('target-map');
  const router = useRouter();
  const [targetType, setTargetType] = useState<TargetType>('vegas-3spot');
  const [arrowsPerEnd, setArrowsPerEnd] = useState(3);
  const [totalEnds, setTotalEnds] = useState(10);
  const [currentEnd, setCurrentEnd] = useState(1);
  const [impacts, setImpacts] = useState<ArrowImpact[]>([]);
  const [completedEnds, setCompletedEnds] = useState<EndData[]>([]);
  const [analysis, setAnalysis] = useState<GroupAnalysis | null>(null);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [roundStarted, setRoundStarted] = useState(false);

  const targetRadius = TARGET_TYPES.find((t) => t.key === targetType)?.radius || 12;
  const allImpacts = [...completedEnds.flatMap((e) => e.impacts), ...impacts];
  const totalArrowsShot = allImpacts.length;
  const roundComplete = completedEnds.length >= totalEnds;

  const handleTap = (x: number, y: number) => {
    if (impacts.length >= arrowsPerEnd) return;
    const newImpact: ArrowImpact = { x, y, arrowNum: totalArrowsShot + 1 };
    const newImpacts = [...impacts, newImpact];
    setImpacts(newImpacts);
    if (newImpacts.length >= 2) {
      setAnalysis(analyzeGroup(newImpacts, targetRadius));
    }
  };

  const handleScoreEnd = () => {
    if (impacts.length === 0) return;
    const endData: EndData = {
      endNum: currentEnd,
      impacts: [...impacts],
      analysis: impacts.length >= 2 ? analyzeGroup(impacts, targetRadius) : null,
    };
    setCompletedEnds([...completedEnds, endData]);
    setCurrentEnd(currentEnd + 1);
    setImpacts([]);
    setAnalysis(null);

    if (completedEnds.length + 1 >= totalEnds) {
      Alert.alert('Round Complete!', `You finished ${totalEnds} ends. Review your round summary below.`);
    }
  };

  const handleUndo = () => {
    if (impacts.length === 0) return;
    const newImpacts = impacts.slice(0, -1);
    setImpacts(newImpacts);
    setAnalysis(newImpacts.length >= 2 ? analyzeGroup(newImpacts, targetRadius) : null);
  };

  const handleReset = () => {
    Alert.alert('Reset Round', 'This will clear all data. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => {
        setImpacts([]); setCompletedEnds([]); setAnalysis(null);
        setCurrentEnd(1); setRoundStarted(false);
      }},
    ]);
  };

  // Round summary stats
  const roundAnalysis = completedEnds.length >= 2
    ? analyzeGroup(completedEnds.flatMap((e) => e.impacts), targetRadius)
    : null;

  if (!roundStarted) {
    return (
      <>
        <Stack.Screen options={{ title: 'TARGET MAP', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <AnimatedEntry>
            <LinearGradient colors={['#0A0A0A', '#0A1A0F', '#0A0A0A'] as [string, string, string]} style={styles.hero}>
              <Ionicons name="aperture" size={48} color={colors.primary} />
              <Text style={styles.heroTitle}>TARGET MAP</Text>
              <Text style={styles.heroSub}>Tap arrows on target, get AI group analysis</Text>
            </LinearGradient>
          </AnimatedEntry>

          <AnimatedEntry delay={60}>
            <Text style={styles.label}>TARGET TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {TARGET_TYPES.map((t) => (
                  <TouchableOpacity key={t.key} style={[styles.chip, targetType === t.key && styles.chipActive]}
                    onPress={() => setTargetType(t.key)}>
                    <Text style={[styles.chipText, targetType === t.key && styles.chipTextActive]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </AnimatedEntry>

          <AnimatedEntry delay={100}>
            <Text style={styles.label}>ARROWS PER END</Text>
            <View style={styles.chipRow}>
              {ARROWS_PER_END.map((n) => (
                <TouchableOpacity key={n} style={[styles.chip, arrowsPerEnd === n && styles.chipActiveBlue]}
                  onPress={() => setArrowsPerEnd(n)}>
                  <Text style={[styles.chipText, arrowsPerEnd === n && styles.chipTextBlue]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </AnimatedEntry>

          <AnimatedEntry delay={140}>
            <Text style={styles.label}>TOTAL ENDS IN ROUND</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {ROUND_ENDS.map((n) => (
                  <TouchableOpacity key={n} style={[styles.chip, totalEnds === n && styles.chipActiveBlue]}
                    onPress={() => setTotalEnds(n)}>
                    <Text style={[styles.chipText, totalEnds === n && styles.chipTextBlue]}>{n} ends</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </AnimatedEntry>

          <AnimatedEntry delay={180}>
            <Text style={styles.roundSummary}>
              {totalEnds} ends x {arrowsPerEnd} arrows = {totalEnds * arrowsPerEnd} total arrows
            </Text>
            <TouchableOpacity style={styles.startBtn} onPress={() => setRoundStarted(true)}>
              <LinearGradient colors={[...gradients.primaryToSecondary] as [string, string]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.startBtnInner}>
                <Ionicons name="play" size={22} color={colors.background} />
                <Text style={styles.startBtnText}>START ROUND</Text>
              </LinearGradient>
            </TouchableOpacity>
          </AnimatedEntry>

          {/* Ballistics link */}
          <AnimatedEntry delay={220}>
            <TouchableOpacity style={styles.ballisticsBtn} onPress={() => router.push('/ballistics')}>
              <LinearGradient colors={['#FF8C0020', '#FF8C0005'] as [string, string]} style={styles.ballisticsBtnInner}>
                <Ionicons name="rocket" size={24} color="#FF8C00" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.ballisticsTitle}>Arrow Ballistics Calculator</Text>
                  <Text style={styles.ballisticsSub}>Trajectory, KE, momentum, wind drift</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </LinearGradient>
            </TouchableOpacity>
          </AnimatedEntry>
        </ScrollView>
      </>
    );
  }

  // ===== ACTIVE ROUND =====
  return (
    <>
      <Stack.Screen options={{ title: `END ${currentEnd} of ${totalEnds}`, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Progress bar */}
        <View style={styles.progressWrap}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(completedEnds.length / totalEnds) * 100}%` }]}>
              <LinearGradient colors={[...gradients.primaryToSecondary] as [string, string]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
            </View>
          </View>
          <Text style={styles.progressText}>
            End {Math.min(currentEnd, totalEnds)}/{totalEnds} — {totalArrowsShot} arrows shot
          </Text>
        </View>

        {/* Target */}
        {!roundComplete && (
          <TargetFace
            impacts={impacts}
            onTap={handleTap}
            size={320}
            targetType={targetType}
            showHeatMap={showHeatMap}
            currentArrow={impacts.length}
          />
        )}

        {/* Controls */}
        {!roundComplete && (
          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlBtn} onPress={handleUndo}>
              <Ionicons name="arrow-undo" size={16} color={colors.warning} />
              <Text style={[styles.controlBtnText, { color: colors.warning }]}>Undo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scoreEndBtn, impacts.length === 0 && { opacity: 0.4 }]}
              onPress={handleScoreEnd}
              disabled={impacts.length === 0}
            >
              <LinearGradient colors={[...gradients.primaryToSecondary] as [string, string]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.scoreEndBtnInner}>
                <Text style={styles.scoreEndText}>SCORE END</Text>
                <Ionicons name="checkmark" size={18} color={colors.background} />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlBtn} onPress={() => setShowHeatMap(!showHeatMap)}>
              <Ionicons name={showHeatMap ? 'flame' : 'flame-outline'} size={16} color={colors.primary} />
              <Text style={[styles.controlBtnText, { color: colors.primary }]}>Heat</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Current end analysis */}
        {analysis && !roundComplete && (
          <AnimatedEntry>
            <View style={styles.miniAnalysis}>
              <View style={styles.miniStat}><Text style={styles.miniValue}>{analysis.groupSizeInches}"</Text><Text style={styles.miniLabel}>GROUP</Text></View>
              <View style={styles.miniStat}><Text style={[styles.miniValue, { color: colors.secondary }]}>{analysis.centerDirection.toUpperCase()}</Text><Text style={styles.miniLabel}>CENTER</Text></View>
              <View style={styles.miniStat}><Text style={[styles.miniValue, { color: analysis.consistency > 70 ? colors.primary : colors.warning }]}>{analysis.consistency}</Text><Text style={styles.miniLabel}>SCORE</Text></View>
            </View>
          </AnimatedEntry>
        )}

        {/* Completed ends list */}
        {completedEnds.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{roundComplete ? 'ROUND COMPLETE' : 'COMPLETED ENDS'}</Text>
            {completedEnds.map((end, i) => (
              <View key={i} style={styles.endRow}>
                <Text style={styles.endNum}>End {end.endNum}</Text>
                <Text style={styles.endArrows}>{end.impacts.length} arr</Text>
                {end.analysis && (
                  <>
                    <Text style={styles.endGroup}>{end.analysis.groupSizeInches}"</Text>
                    <Text style={[styles.endConsistency, {
                      color: end.analysis.consistency > 70 ? colors.primary : end.analysis.consistency > 40 ? colors.warning : colors.danger,
                    }]}>{end.analysis.consistency}</Text>
                    <Text style={styles.endDir}>{end.analysis.centerDirection}</Text>
                  </>
                )}
              </View>
            ))}
          </>
        )}

        {/* Full round analysis */}
        {roundAnalysis && roundComplete && (
          <AnimatedEntry>
            <LinearGradient colors={[...gradients.heroBg] as [string, string, ...string[]]} style={styles.roundCard}>
              <Text style={styles.roundTitle}>ROUND ANALYSIS</Text>
              <View style={styles.roundGrid}>
                <View style={styles.roundStat}><Text style={styles.roundValue}>{totalArrowsShot}</Text><Text style={styles.roundLabel}>ARROWS</Text></View>
                <View style={styles.roundStat}><Text style={styles.roundValue}>{roundAnalysis.groupSizeInches}"</Text><Text style={styles.roundLabel}>AVG GROUP</Text></View>
                <View style={styles.roundStat}><Text style={[styles.roundValue, { color: colors.secondary }]}>{roundAnalysis.consistency}</Text><Text style={styles.roundLabel}>CONSISTENCY</Text></View>
              </View>
              <View style={styles.roundDetail}>
                <Text style={styles.roundDetailText}>Center of group: <Text style={{ color: colors.primary, fontWeight: '800' }}>{roundAnalysis.centerDirection.toUpperCase()}</Text></Text>
                <Text style={styles.roundDetailText}>Offset: {roundAnalysis.centerOffsetInches}" from center</Text>
                <Text style={styles.roundDetailText}>
                  Fatigue: {roundAnalysis.fatigueScore > 5 ? 'Groups tightened (warmed up)' : roundAnalysis.fatigueScore < -5 ? 'Groups opened (fatigue detected)' : 'Consistent throughout'}
                </Text>
              </View>

              {/* All impacts on one target */}
              <Text style={[styles.sectionTitle, { color: colors.primary, marginTop: spacing.md }]}>ALL SHOTS OVERLAY</Text>
              <TargetFace
                impacts={allImpacts}
                onTap={() => {}}
                size={280}
                targetType={targetType}
                showHeatMap={true}
                currentArrow={0}
              />
            </LinearGradient>
          </AnimatedEntry>
        )}

        {/* New round button */}
        {roundComplete && (
          <TouchableOpacity style={styles.newRoundBtn} onPress={handleReset}>
            <LinearGradient colors={[...gradients.primaryToSecondary] as [string, string]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.newRoundBtnInner}>
              <Ionicons name="refresh" size={20} color={colors.background} />
              <Text style={styles.newRoundBtnText}>NEW ROUND</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {!roundComplete && (
          <TouchableOpacity style={styles.resetLink} onPress={handleReset}>
            <Text style={styles.resetLinkText}>Reset Round</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl * 2 },
  hero: { alignItems: 'center', paddingVertical: spacing.xl, borderRadius: borderRadius.lg, marginBottom: spacing.lg },
  heroTitle: { fontSize: fontSize.xxl, fontWeight: '900', color: colors.primary, letterSpacing: 4, marginTop: spacing.sm },
  heroSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  label: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary, letterSpacing: 2, marginBottom: spacing.sm, marginTop: spacing.lg },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  chipActiveBlue: { backgroundColor: colors.secondary + '20', borderColor: colors.secondary },
  chipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.primary },
  chipTextBlue: { color: colors.secondary },
  roundSummary: { fontSize: fontSize.md, color: colors.text, fontWeight: '600', textAlign: 'center', marginTop: spacing.lg },
  startBtn: { marginTop: spacing.md, borderRadius: borderRadius.md, overflow: 'hidden' },
  startBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md },
  startBtnText: { fontSize: fontSize.md, fontWeight: '800', color: colors.background, letterSpacing: 2 },
  progressWrap: { marginBottom: spacing.sm },
  progressBar: { height: 6, backgroundColor: colors.surface, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, overflow: 'hidden' },
  progressText: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
  controls: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  controlBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  controlBtnText: { fontSize: fontSize.xs, fontWeight: '700' },
  scoreEndBtn: { borderRadius: borderRadius.md, overflow: 'hidden', flex: 1 },
  scoreEndBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  scoreEndText: { fontSize: fontSize.sm, fontWeight: '800', color: colors.background, letterSpacing: 1 },
  miniAnalysis: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  miniStat: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.sm, padding: spacing.sm, alignItems: 'center' },
  miniValue: { fontSize: fontSize.md, fontWeight: '900', color: colors.primary },
  miniLabel: { fontSize: 8, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, marginTop: 2 },
  sectionTitle: { fontSize: fontSize.xs, fontWeight: '800', color: colors.textSecondary, letterSpacing: 2, marginTop: spacing.lg, marginBottom: spacing.sm },
  endRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.sm, padding: spacing.sm, marginBottom: spacing.xs },
  endNum: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, width: 55 },
  endArrows: { fontSize: fontSize.xs, color: colors.textSecondary, width: 35 },
  endGroup: { fontSize: fontSize.sm, fontWeight: '700', color: colors.primary, width: 40 },
  endConsistency: { fontSize: fontSize.sm, fontWeight: '800', width: 30, textAlign: 'center' },
  endDir: { fontSize: fontSize.xs, color: colors.textMuted, flex: 1, textAlign: 'right' },
  roundCard: { borderRadius: borderRadius.lg, padding: spacing.md },
  roundTitle: { fontSize: fontSize.sm, fontWeight: '900', color: colors.primary, letterSpacing: 3, textAlign: 'center', marginBottom: spacing.md },
  roundGrid: { flexDirection: 'row', gap: spacing.sm },
  roundStat: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center' },
  roundValue: { fontSize: fontSize.xl, fontWeight: '900', color: colors.primary },
  roundLabel: { fontSize: 9, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1, marginTop: 2 },
  roundDetail: { marginTop: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md },
  roundDetailText: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 22 },
  newRoundBtn: { marginTop: spacing.lg, borderRadius: borderRadius.md, overflow: 'hidden' },
  newRoundBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md },
  newRoundBtnText: { fontSize: fontSize.md, fontWeight: '800', color: colors.background, letterSpacing: 2 },
  resetLink: { alignItems: 'center', marginTop: spacing.lg },
  resetLinkText: { fontSize: fontSize.sm, color: colors.danger, fontWeight: '600' },
  ballisticsBtn: { borderRadius: borderRadius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginTop: spacing.xl },
  ballisticsBtnInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  ballisticsTitle: { fontSize: fontSize.md, fontWeight: '700', color: '#FF8C00' },
  ballisticsSub: { fontSize: fontSize.xs, color: colors.textMuted },
});
