import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import TargetFace from '../components/TargetFace';
import AnimatedEntry from '../components/AnimatedEntry';
import { analyzeGroup, type ArrowImpact, type GroupAnalysis } from '../lib/ballistics';

const TARGET_TYPES = [
  { key: 'standard' as const, label: 'Standard', radius: 24 },
  { key: '5-spot' as const, label: '5-Spot', radius: 3 },
  { key: '3d-vitals' as const, label: '3D Vitals', radius: 12 },
];

const ARROW_COUNTS = [3, 5, 6, 12];

export default function TargetMapScreen() {
  const router = useRouter();
  const [targetType, setTargetType] = useState<'standard' | '5-spot' | '3d-vitals'>('standard');
  const [maxArrows, setMaxArrows] = useState(6);
  const [impacts, setImpacts] = useState<ArrowImpact[]>([]);
  const [analysis, setAnalysis] = useState<GroupAnalysis | null>(null);
  const [showHeatMap, setShowHeatMap] = useState(false);

  const targetRadius = TARGET_TYPES.find((t) => t.key === targetType)?.radius || 24;

  const handleTap = (x: number, y: number) => {
    if (impacts.length >= maxArrows) {
      Alert.alert('End complete', 'All arrows placed. Review analysis or reset.');
      return;
    }
    const newImpact: ArrowImpact = { x, y, arrowNum: impacts.length + 1 };
    const newImpacts = [...impacts, newImpact];
    setImpacts(newImpacts);

    // Auto-analyze after 2+ arrows
    if (newImpacts.length >= 2) {
      setAnalysis(analyzeGroup(newImpacts, targetRadius));
    }
  };

  const handleReset = () => {
    setImpacts([]);
    setAnalysis(null);
  };

  const handleUndo = () => {
    if (impacts.length === 0) return;
    const newImpacts = impacts.slice(0, -1);
    setImpacts(newImpacts);
    setAnalysis(newImpacts.length >= 2 ? analyzeGroup(newImpacts, targetRadius) : null);
  };

  return (
    <>
      <Stack.Screen options={{
        title: 'TARGET MAP', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text,
      }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Target Type */}
        <AnimatedEntry>
          <View style={styles.chipRow}>
            {TARGET_TYPES.map((t) => (
              <TouchableOpacity key={t.key} style={[styles.chip, targetType === t.key && styles.chipActive]}
                onPress={() => { setTargetType(t.key); handleReset(); }}>
                <Text style={[styles.chipText, targetType === t.key && styles.chipTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
            <View style={{ flex: 1 }} />
            {ARROW_COUNTS.map((n) => (
              <TouchableOpacity key={n} style={[styles.chipSmall, maxArrows === n && styles.chipActiveBlue]}
                onPress={() => { setMaxArrows(n); handleReset(); }}>
                <Text style={[styles.chipTextSm, maxArrows === n && styles.chipTextBlue]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </AnimatedEntry>

        {/* Target */}
        <AnimatedEntry delay={80}>
          <TargetFace
            impacts={impacts}
            onTap={handleTap}
            size={320}
            targetType={targetType}
            showHeatMap={showHeatMap}
            currentArrow={impacts.length}
          />
        </AnimatedEntry>

        {/* Controls */}
        <AnimatedEntry delay={120}>
          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlBtn} onPress={handleUndo}>
              <Ionicons name="arrow-undo" size={18} color={colors.warning} />
              <Text style={[styles.controlText, { color: colors.warning }]}>Undo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlBtn} onPress={() => setShowHeatMap(!showHeatMap)}>
              <Ionicons name={showHeatMap ? 'flame' : 'flame-outline'} size={18} color={colors.primary} />
              <Text style={[styles.controlText, { color: colors.primary }]}>Heat Map</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.controlBtn, { borderColor: colors.danger }]} onPress={handleReset}>
              <Ionicons name="refresh" size={18} color={colors.danger} />
              <Text style={[styles.controlText, { color: colors.danger }]}>Reset</Text>
            </TouchableOpacity>
          </View>
        </AnimatedEntry>

        {/* Analysis */}
        {analysis && (
          <AnimatedEntry delay={160}>
            <LinearGradient colors={[...gradients.heroBg] as [string, string, ...string[]]} style={styles.analysisCard}>
              <Text style={styles.analysisTitle}>GROUP ANALYSIS</Text>

              <View style={styles.statGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{analysis.groupSizeInches}"</Text>
                  <Text style={styles.statLabel}>GROUP SIZE</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.secondary }]}>{analysis.centerOffsetInches}"</Text>
                  <Text style={styles.statLabel}>CENTER OFFSET</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: analysis.consistency > 70 ? colors.primary : analysis.consistency > 40 ? colors.warning : colors.danger }]}>
                    {analysis.consistency}
                  </Text>
                  <Text style={styles.statLabel}>CONSISTENCY</Text>
                </View>
              </View>

              {/* Direction */}
              <View style={styles.directionRow}>
                <Ionicons name="navigate" size={18} color={colors.secondary} />
                <Text style={styles.directionText}>
                  Group center: <Text style={{ color: colors.primary, fontWeight: '800' }}>{analysis.centerDirection.toUpperCase()}</Text>
                </Text>
              </View>

              {/* Details */}
              <View style={styles.detailRow}>
                <View style={styles.detail}>
                  <Text style={styles.detailLabel}>Tightest pair</Text>
                  <Text style={styles.detailValue}>{analysis.tightestPair}"</Text>
                </View>
                <View style={styles.detail}>
                  <Text style={styles.detailLabel}>Widest shot</Text>
                  <Text style={styles.detailValue}>{analysis.widestShot}"</Text>
                </View>
              </View>

              {/* Fatigue */}
              {impacts.length >= 4 && (
                <View style={styles.fatigueRow}>
                  <Ionicons
                    name={analysis.fatigueScore > 5 ? 'trending-up' : analysis.fatigueScore < -5 ? 'trending-down' : 'remove'}
                    size={18}
                    color={analysis.fatigueScore > 5 ? colors.primary : analysis.fatigueScore < -5 ? colors.danger : colors.textSecondary}
                  />
                  <Text style={styles.fatigueText}>
                    {analysis.fatigueScore > 5
                      ? 'Groups tightening — you\'re warming up!'
                      : analysis.fatigueScore < -5
                      ? 'Groups opening — possible fatigue'
                      : 'Consistent throughout the end'}
                  </Text>
                </View>
              )}

              {/* Coaching tip */}
              <View style={styles.tipBox}>
                <Ionicons name="bulb" size={16} color={colors.warning} />
                <Text style={styles.tipText}>
                  {analysis.centerDirection === 'center'
                    ? 'Great centering! Focus on tightening your group size.'
                    : analysis.centerDirection.includes('left')
                    ? 'Group is left of center. Check your anchor point or move rest right.'
                    : analysis.centerDirection.includes('right')
                    ? 'Group is right of center. Check your anchor point or move rest left.'
                    : analysis.centerDirection.includes('high')
                    ? 'Group is high. Lower your sight pin or check your anchor.'
                    : analysis.centerDirection.includes('low')
                    ? 'Group is low. Raise your sight pin or check your form.'
                    : 'Keep shooting and building your data!'}
                </Text>
              </View>
            </LinearGradient>
          </AnimatedEntry>
        )}

        {/* Ballistics link */}
        <AnimatedEntry delay={200}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl * 2 },
  chipRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap', marginBottom: spacing.md },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipSmall: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  chipActiveBlue: { backgroundColor: colors.secondary + '20', borderColor: colors.secondary },
  chipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  chipTextSm: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '700' },
  chipTextActive: { color: colors.primary },
  chipTextBlue: { color: colors.secondary },
  controls: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginBottom: spacing.md },
  controlBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  controlText: { fontSize: fontSize.xs, fontWeight: '700' },
  analysisCard: { borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md },
  analysisTitle: { fontSize: fontSize.xs, fontWeight: '800', color: colors.primary, letterSpacing: 3, marginBottom: spacing.md, textAlign: 'center' },
  statGrid: { flexDirection: 'row', gap: spacing.sm },
  statBox: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center' },
  statValue: { fontSize: fontSize.xl, fontWeight: '900', color: colors.primary },
  statLabel: { fontSize: 9, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1, marginTop: 2 },
  directionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.sm },
  directionText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  detailRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  detail: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.sm, padding: spacing.sm },
  detailLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  detailValue: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  fatigueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.sm },
  fatigueText: { fontSize: fontSize.sm, color: colors.textSecondary, flex: 1 },
  tipBox: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: spacing.sm, backgroundColor: colors.warning + '10', borderRadius: borderRadius.md, padding: spacing.sm, borderWidth: 1, borderColor: colors.warning + '30' },
  tipText: { fontSize: fontSize.sm, color: colors.text, flex: 1, lineHeight: 20 },
  ballisticsBtn: { borderRadius: borderRadius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  ballisticsBtnInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  ballisticsTitle: { fontSize: fontSize.md, fontWeight: '700', color: '#FF8C00' },
  ballisticsSub: { fontSize: fontSize.xs, color: colors.textMuted },
});
