import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Text as SvgText, Rect, Ellipse, G } from 'react-native-svg';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import AnimatedEntry from '../components/AnimatedEntry';
import { DELTA_MCKENZIE_TARGETS, TARGET_CATEGORIES, BODY_SHAPES, type Target3D } from '../lib/targets3d';
import { useScreenTracking } from '../lib/useAnalytics';

function Target3DView({ target, size = 240 }: { target: Target3D; size?: number }) {
  const shape = BODY_SHAPES[target.category] || BODY_SHAPES['other'];
  const vc = target.vitalCenter;
  const vw = target.vitalWidth;
  const vh = target.vitalHeight;

  // Convert normalized coords to SVG coords (100x100 viewBox)
  const cx = vc.x * 100;
  const cy = vc.y * 100;
  const rw8 = (vw * 100) / 2;    // 8-ring half-width
  const rh8 = (vh * 100) / 2;    // 8-ring half-height
  const rw10 = rw8 * 0.65;        // 10-ring is ~65% of 8
  const rh10 = rh8 * 0.65;
  const innerR = rh10 * 0.32;     // inner circle radius (12, 10, 12)

  // 14 ring position
  let r14x = cx + rw8 + 4;
  let r14y = cy;
  if (target.ring14Side === 'left') { r14x = cx - rw8 - 4; }
  if (target.ring14Side === 'below') { r14x = cx; r14y = cy + rh8 + 4; }

  return (
    <View style={[styles.targetView, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* Body silhouette */}
        <Path d={shape.points} fill="#6B4226" stroke="#5C3317" strokeWidth="0.8" />

        {/* 5 zone label */}
        <SvgText x="12" y="92" fontSize="5" fill="#FFF" fontWeight="bold">5</SvgText>

        {/* 8 ring - vital area */}
        <Ellipse cx={cx} cy={cy} rx={rw8} ry={rh8} fill="#444" stroke="#666" strokeWidth="0.8" />
        <SvgText x={cx - rw8 + 2} y={cy - rh8 + 5} fontSize="4" fill="#CCC" fontWeight="bold">8</SvgText>

        {/* 10 ring */}
        <Ellipse cx={cx} cy={cy} rx={rw10} ry={rh10} fill="#222" stroke="#00A3FF" strokeWidth="0.8" />
        <SvgText x={cx + rw10 - 5} y={cy - rh10 + 5} fontSize="3.5" fill="#00A3FF" fontWeight="bold">10</SvgText>

        {/* Upper 12 */}
        <Circle cx={cx} cy={cy - rh10 * 0.45} r={innerR} fill="#FF4444" stroke="#FF6666" strokeWidth="0.5" />
        <SvgText x={cx - 3} y={cy - rh10 * 0.45 + 1.5} fontSize="3" fill="#FFF" fontWeight="bold" textAnchor="middle">12</SvgText>

        {/* Center 10 */}
        <Circle cx={cx} cy={cy} r={innerR} fill="#FFD700" stroke="#FFAA00" strokeWidth="0.5" />
        <SvgText x={cx - 3} y={cy + 1.5} fontSize="3" fill="#000" fontWeight="bold" textAnchor="middle">10</SvgText>

        {/* Lower 12 */}
        <Circle cx={cx} cy={cy + rh10 * 0.45} r={innerR} fill="#FF4444" stroke="#FF6666" strokeWidth="0.5" />
        <SvgText x={cx - 3} y={cy + rh10 * 0.45 + 1.5} fontSize="3" fill="#FFF" fontWeight="bold" textAnchor="middle">12</SvgText>

        {/* 14 ring */}
        <Circle cx={r14x} cy={r14y} r={innerR * 0.7} fill="#00FF88" stroke="#00CC66" strokeWidth="0.5" />
        <SvgText x={r14x - 2.5} y={r14y + 1.5} fontSize="3" fill="#000" fontWeight="bold" textAnchor="middle">14</SvgText>
      </Svg>
    </View>
  );
}

export default function Targets3DScreen() {
  useScreenTracking('targets-3d');
  const [category, setCategory] = useState('all');
  const [selectedTarget, setSelectedTarget] = useState<Target3D | null>(null);

  const filtered = category === 'all'
    ? DELTA_MCKENZIE_TARGETS
    : DELTA_MCKENZIE_TARGETS.filter((t) => t.category === category);

  if (selectedTarget) {
    return (
      <>
        <Stack.Screen options={{
          title: selectedTarget.name.toUpperCase(),
          headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text,
        }} />
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <AnimatedEntry>
            <View style={styles.detailCard}>
              <Target3DView target={selectedTarget} size={320} />
              <Text style={styles.detailName}>{selectedTarget.name}</Text>
              <View style={styles.detailTags}>
                <View style={[styles.catBadge, { backgroundColor: getCatColor(selectedTarget.category) + '20' }]}>
                  <Text style={[styles.catBadgeText, { color: getCatColor(selectedTarget.category) }]}>{selectedTarget.category}</Text>
                </View>
                {selectedTarget.asaYear && (
                  <View style={[styles.catBadge, { backgroundColor: '#00AA0020' }]}>
                    <Text style={[styles.catBadgeText, { color: '#00AA00' }]}>ASA {selectedTarget.asaYear.join(', ')}</Text>
                  </View>
                )}
              </View>
            </View>
          </AnimatedEntry>

          {/* Scoring legend */}
          <AnimatedEntry delay={60}>
            <Text style={styles.legendTitle}>SCORING ZONES</Text>
            <View style={styles.legend}>
              {[
                { color: '#6B4226', label: '5 — Body', desc: 'Any hit on the foam body' },
                { color: '#444', label: '8 — Vital Area', desc: 'Heart/lung/liver zone' },
                { color: '#222', label: '10 — Inner Vital', desc: 'Centered in the 8 ring', border: '#00A3FF' },
                { color: '#FF4444', label: '12 — Upper & Lower', desc: 'Top and bottom circles inside 10' },
                { color: '#FFD700', label: '10 — Center', desc: 'Dead center of the 10 ring' },
                { color: '#00FF88', label: '14 — Bonus', desc: 'Small ring off to the side (pro only)' },
              ].map((item, i) => (
                <View key={i} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: item.color, borderColor: item.border || item.color }]} />
                  <View>
                    <Text style={styles.legendLabel}>{item.label}</Text>
                    <Text style={styles.legendDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </AnimatedEntry>

          <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedTarget(null)}>
            <Ionicons name="arrow-back" size={18} color={colors.secondary} />
            <Text style={styles.backBtnText}>Back to all targets</Text>
          </TouchableOpacity>
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{
        title: '3D TARGETS', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text,
      }} />
      <View style={styles.container}>
        {/* Category filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterRow}>
            {TARGET_CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat.key} style={[styles.filterChip, category === cat.key && styles.filterChipActive]}
                onPress={() => setCategory(cat.key)}>
                <Text style={[styles.filterText, category === cat.key && styles.filterTextActive]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.countLabel}>{filtered.length} Delta McKenzie targets</Text>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.gridItem} onPress={() => setSelectedTarget(item)} activeOpacity={0.7}>
              <Target3DView target={item} size={150} />
              <Text style={styles.gridName} numberOfLines={2}>{item.name}</Text>
              <View style={[styles.miniCatBadge, { backgroundColor: getCatColor(item.category) + '20' }]}>
                <Text style={[styles.miniCatText, { color: getCatColor(item.category) }]}>{item.category}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </>
  );
}

function getCatColor(cat: string): string {
  const map: Record<string, string> = {
    deer: '#FFB800', bear: '#8B4513', predator: '#FF4444',
    hog: '#FF8C00', turkey: '#27AE60', exotic: '#9B59B6', other: '#00A3FF',
  };
  return map[cat] || colors.textSecondary;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl * 2 },
  filterScroll: { borderBottomWidth: 1, borderBottomColor: colors.border },
  filterRow: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  filterText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary },
  filterTextActive: { color: colors.primary },
  countLabel: { fontSize: fontSize.xs, color: colors.textMuted, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  grid: { padding: spacing.sm },
  gridRow: { justifyContent: 'space-between' },
  gridItem: { width: '48%', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.sm, marginBottom: spacing.sm, alignItems: 'center' },
  gridName: { fontSize: fontSize.xs, fontWeight: '700', color: colors.text, textAlign: 'center', marginTop: spacing.xs },
  miniCatBadge: { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 1, marginTop: spacing.xs },
  miniCatText: { fontSize: 9, fontWeight: '700' },
  targetView: { alignItems: 'center', justifyContent: 'center' },
  detailCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center' },
  detailName: { fontSize: fontSize.xl, fontWeight: '900', color: colors.text, marginTop: spacing.md },
  detailTags: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  catBadge: { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  catBadgeText: { fontSize: fontSize.xs, fontWeight: '700' },
  legendTitle: { fontSize: fontSize.xs, fontWeight: '800', color: colors.textSecondary, letterSpacing: 2, marginTop: spacing.xl, marginBottom: spacing.sm },
  legend: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  legendDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2 },
  legendLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  legendDesc: { fontSize: fontSize.xs, color: colors.textSecondary },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.lg },
  backBtnText: { fontSize: fontSize.md, color: colors.secondary, fontWeight: '600' },
});
