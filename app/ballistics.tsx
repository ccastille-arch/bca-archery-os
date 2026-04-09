import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import AnimatedEntry from '../components/AnimatedEntry';
import { calculateBallistics, type BallisticsResult } from '../lib/ballistics';
import { useScreenTracking } from '../lib/useAnalytics';

export default function BallisticsScreen() {
  useScreenTracking('ballistics');
  const [speed, setSpeed] = useState('280');
  const [weight, setWeight] = useState('400');
  const [foc, setFoc] = useState('11');
  const [result, setResult] = useState<BallisticsResult | null>(null);

  const handleCalculate = () => {
    const s = parseFloat(speed);
    const w = parseFloat(weight);
    const f = parseFloat(foc);
    if (isNaN(s) || isNaN(w) || isNaN(f)) return;
    setResult(calculateBallistics({ arrowSpeedFps: s, totalWeightGrains: w, focPercent: f }));
  };

  return (
    <>
      <Stack.Screen options={{
        title: 'BALLISTICS', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text,
      }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Hero */}
        <AnimatedEntry>
          <LinearGradient colors={['#0A0A0A', '#1A0F00', '#0A0A0A'] as [string, string, string]} style={styles.hero}>
            <Ionicons name="rocket" size={40} color="#FF8C00" />
            <Text style={styles.heroTitle}>ARROW BALLISTICS</Text>
            <Text style={styles.heroSub}>Trajectory, energy, momentum & drift</Text>
          </LinearGradient>
        </AnimatedEntry>

        {/* Inputs */}
        <AnimatedEntry delay={60}>
          <Text style={styles.label}>ARROW SPEED (FPS)</Text>
          <TextInput style={styles.input} value={speed} onChangeText={setSpeed}
            placeholder="e.g., 280" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
        </AnimatedEntry>

        <AnimatedEntry delay={100}>
          <Text style={styles.label}>TOTAL ARROW WEIGHT (GRAINS)</Text>
          <TextInput style={styles.input} value={weight} onChangeText={setWeight}
            placeholder="e.g., 400" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
        </AnimatedEntry>

        <AnimatedEntry delay={140}>
          <Text style={styles.label}>FRONT OF CENTER (%)</Text>
          <TextInput style={styles.input} value={foc} onChangeText={setFoc}
            placeholder="e.g., 11" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
        </AnimatedEntry>

        <AnimatedEntry delay={180}>
          <TouchableOpacity style={styles.calcBtn} onPress={handleCalculate}>
            <LinearGradient colors={['#FF8C00', '#FFB800'] as [string, string]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.calcBtnInner}>
              <Ionicons name="calculator" size={20} color={colors.background} />
              <Text style={styles.calcBtnText}>CALCULATE</Text>
            </LinearGradient>
          </TouchableOpacity>
        </AnimatedEntry>

        {result && (
          <>
            {/* Launch Stats */}
            <AnimatedEntry delay={220}>
              <Text style={styles.sectionTitle}>LAUNCH DATA</Text>
              <View style={styles.launchGrid}>
                <View style={styles.launchBox}>
                  <Text style={[styles.launchValue, { color: '#FF8C00' }]}>{result.launchKE}</Text>
                  <Text style={styles.launchLabel}>KE (ft-lbs)</Text>
                </View>
                <View style={styles.launchBox}>
                  <Text style={[styles.launchValue, { color: colors.primary }]}>{result.launchMomentum}</Text>
                  <Text style={styles.launchLabel}>MOMENTUM</Text>
                </View>
                <View style={styles.launchBox}>
                  <Text style={[styles.launchValue, { color: colors.secondary }]}>{result.input.arrowSpeedFps}</Text>
                  <Text style={styles.launchLabel}>FPS</Text>
                </View>
              </View>
            </AnimatedEntry>

            {/* Effective Ranges */}
            <AnimatedEntry delay={260}>
              <Text style={styles.sectionTitle}>MAX EFFECTIVE RANGE</Text>
              <View style={styles.rangeGrid}>
                <View style={[styles.rangeBox, { borderColor: result.maxEffectiveElk > 0 ? colors.primary : colors.danger }]}>
                  <Ionicons name="paw" size={20} color={result.maxEffectiveElk > 0 ? colors.primary : colors.danger} />
                  <Text style={styles.rangeName}>Elk</Text>
                  <Text style={[styles.rangeValue, { color: result.maxEffectiveElk > 0 ? colors.primary : colors.danger }]}>
                    {result.maxEffectiveElk > 0 ? `${result.maxEffectiveElk} yds` : 'N/A'}
                  </Text>
                  <Text style={styles.rangeReq}>({result.elkMinKE} ft-lbs min)</Text>
                </View>
                <View style={[styles.rangeBox, { borderColor: result.maxEffectiveDeer > 0 ? colors.primary : colors.danger }]}>
                  <Ionicons name="leaf" size={20} color={result.maxEffectiveDeer > 0 ? colors.primary : colors.danger} />
                  <Text style={styles.rangeName}>Deer</Text>
                  <Text style={[styles.rangeValue, { color: result.maxEffectiveDeer > 0 ? colors.primary : colors.danger }]}>
                    {result.maxEffectiveDeer > 0 ? `${result.maxEffectiveDeer} yds` : 'N/A'}
                  </Text>
                  <Text style={styles.rangeReq}>({result.deerMinKE} ft-lbs min)</Text>
                </View>
                <View style={[styles.rangeBox, { borderColor: result.maxEffectiveTurkey > 0 ? colors.primary : colors.danger }]}>
                  <Ionicons name="egg" size={20} color={result.maxEffectiveTurkey > 0 ? colors.primary : colors.danger} />
                  <Text style={styles.rangeName}>Turkey</Text>
                  <Text style={[styles.rangeValue, { color: result.maxEffectiveTurkey > 0 ? colors.primary : colors.danger }]}>
                    {result.maxEffectiveTurkey > 0 ? `${result.maxEffectiveTurkey} yds` : 'N/A'}
                  </Text>
                  <Text style={styles.rangeReq}>({result.turkeyMinKE} ft-lbs min)</Text>
                </View>
              </View>
            </AnimatedEntry>

            {/* Trajectory Table */}
            <AnimatedEntry delay={300}>
              <Text style={styles.sectionTitle}>TRAJECTORY TABLE</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, { flex: 0.8 }]}>YDS</Text>
                  <Text style={styles.th}>DROP</Text>
                  <Text style={styles.th}>VEL</Text>
                  <Text style={styles.th}>KE</Text>
                  <Text style={styles.th}>WIND</Text>
                  <Text style={[styles.th, { flex: 0.8 }]}>TIME</Text>
                </View>
                {result.table.map((row, i) => (
                  <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                    <Text style={[styles.td, { flex: 0.8, color: colors.primary }]}>{row.distance}</Text>
                    <Text style={styles.td}>{row.dropInches.toFixed(1)}"</Text>
                    <Text style={styles.td}>{row.velocityFps}</Text>
                    <Text style={[styles.td, {
                      color: row.kineticEnergy >= 65 ? colors.primary : row.kineticEnergy >= 40 ? colors.warning : colors.danger,
                    }]}>{row.kineticEnergy}</Text>
                    <Text style={styles.td}>{row.windDriftInches}"</Text>
                    <Text style={[styles.td, { flex: 0.8 }]}>{row.flightTimeMs}ms</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.tableNote}>Wind drift calculated for 10 mph crosswind</Text>
            </AnimatedEntry>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl * 2 },
  hero: { alignItems: 'center', paddingVertical: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  heroTitle: { fontSize: fontSize.xl, fontWeight: '900', color: '#FF8C00', letterSpacing: 4, marginTop: spacing.sm },
  heroSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  label: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary, letterSpacing: 2, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, color: colors.text, fontSize: fontSize.lg, fontWeight: '700', borderWidth: 1, borderColor: colors.border, textAlign: 'center' },
  calcBtn: { marginTop: spacing.lg, borderRadius: borderRadius.md, overflow: 'hidden' },
  calcBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md },
  calcBtnText: { fontSize: fontSize.md, fontWeight: '800', color: colors.background, letterSpacing: 2 },
  sectionTitle: { fontSize: fontSize.xs, fontWeight: '800', color: '#FF8C00', letterSpacing: 3, marginTop: spacing.xl, marginBottom: spacing.sm },
  launchGrid: { flexDirection: 'row', gap: spacing.sm },
  launchBox: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center' },
  launchValue: { fontSize: fontSize.xl, fontWeight: '900' },
  launchLabel: { fontSize: 9, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1, marginTop: 2 },
  rangeGrid: { flexDirection: 'row', gap: spacing.sm },
  rangeBox: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.sm, alignItems: 'center', borderWidth: 1 },
  rangeName: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, marginTop: 4 },
  rangeValue: { fontSize: fontSize.md, fontWeight: '900', marginTop: 2 },
  rangeReq: { fontSize: 9, color: colors.textMuted, marginTop: 2 },
  table: { backgroundColor: colors.surface, borderRadius: borderRadius.md, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: colors.surfaceLight, padding: spacing.sm },
  th: { flex: 1, fontSize: 9, fontWeight: '800', color: colors.textSecondary, letterSpacing: 1, textAlign: 'center' },
  tableRow: { flexDirection: 'row', padding: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  tableRowAlt: { backgroundColor: colors.surfaceLight + '50' },
  td: { flex: 1, fontSize: fontSize.sm, color: colors.text, fontWeight: '600', textAlign: 'center' },
  tableNote: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
});
