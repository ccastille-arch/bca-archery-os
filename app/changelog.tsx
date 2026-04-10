import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import AnimatedEntry from '../components/AnimatedEntry';
import { useScreenTracking } from '../lib/useAnalytics';

interface ChangelogEntry {
  version: string;
  date: string;
  type: 'fix' | 'feature' | 'improvement';
  title: string;
  details: string[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.7.0',
    date: '2026-04-09',
    type: 'fix',
    title: 'Login & Session Fixes',
    details: [
      'Fixed login not working when typing credentials and hitting login',
      'Fixed stale session showing "logged in" on fresh visits',
      'Fixed per-user data isolation — each user now has completely separate data',
      'Fixed keyboard submit on password field (press Enter to login)',
      'Added changelog/latest fixes page',
    ],
  },
  {
    version: '1.6.0',
    date: '2026-04-09',
    type: 'feature',
    title: 'Auth System + User Management',
    details: [
      'Login system with admin and user roles',
      'Admin can create user accounts with 4-digit PINs',
      'SMS invite system — texts credentials directly to new users',
      'User permissions — admin controls who can invite others',
      'Change password screen for all users',
      'Per-user data isolation — each user sees only their own data',
    ],
  },
  {
    version: '1.5.0',
    date: '2026-04-09',
    type: 'feature',
    title: 'Admin Analytics + Feedback + Swap Shop',
    details: [
      'Admin analytics dashboard tracking all 35+ screens',
      'Feature usage ranking, peak hours, session data',
      'Feedback system (bug reports, recommendations, feature requests)',
      'Swap Shop for buying/selling archery equipment',
      'Customizable dashboard — show/hide and reorder cards',
      'Expert application system with 3 tiers',
    ],
  },
  {
    version: '1.4.0',
    date: '2026-04-09',
    type: 'feature',
    title: 'Live ASA/IBO Round Scorer',
    details: [
      'Foam Hunter-style live round scoring',
      'Multi-shooter group scoring with rotation',
      'ASA scoring (14/12/10/8/5/0) and IBO scoring (11/10/8/5/0)',
      'All ASA and IBO bow classes',
      'Fixed: scoring any shooter no longer auto-advances target',
      'Fixed: free navigation between all targets for review/editing',
      'Fixed: automatic shooter rotation (first on T1 = last on T2)',
      'Score clearing and re-entry support',
      'Full scrollable scorecard with tappable cells',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-04-09',
    type: 'feature',
    title: 'Target Map + Ballistics Calculator',
    details: [
      'Interactive target face — tap where arrows hit',
      'Vegas 3-Spot, NFAA 5-Spot, ASA 3D, FITA/WA, Single Spot targets',
      'AI group analysis: group size, center offset, consistency, fatigue detection',
      'Full round tracking with end-by-end scoring',
      'Arrow ballistics calculator: trajectory, KE, momentum, wind drift',
      'Max effective range for elk, deer, turkey',
      'ASA 3D target corrected: upper 12, center 10, lower 12, side 14',
      'Delta McKenzie 3D target gallery (36 targets)',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-04-09',
    type: 'feature',
    title: 'Practice Tracker + Expense Tracker + Measured Specs',
    details: [
      'Practice log with 15 drill types, goals, ratings',
      'Expense tracker with 16 categories and receipt support',
      'Bow config: 14 measured spec fields (actual ATA, brace height, tiller, etc.)',
      'Equipment shot count tracking across all logged shots',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-04-09',
    type: 'feature',
    title: 'Pro-Level Upgrade',
    details: [
      'Multi-stabilizer support (front, back bars, side rods with angles)',
      'Stabilizer Lab for testing and comparing setups',
      'Tuning Log (paper, walk-back, French, bare shaft, broadhead)',
      'Tournament Tracker (ASA, IBO, NFAA, WA, local events)',
      'Universal scoring: ASA 3D, IBO, NFAA Indoor/Field, Vegas, Lancaster, WA',
      'Expanded bow config: bow type, ATA, brace height, let-off, cam, peep, scope, d-loop',
      'Expanded arrow config: FOC, total weight, inserts, fletch offset',
      'Community forum with categories',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-04-09',
    type: 'feature',
    title: 'Initial Release',
    details: [
      'Dashboard with stats, streak counter, quick actions',
      'Shot logging with per-arrow scoring',
      'Equipment management (bows + arrows)',
      'Sight tape builder with interpolation',
      'Session tracker with timer',
      'Analytics with charts',
      'Dark theme with neon green + electric blue branding',
    ],
  },
];

const typeColors: Record<string, { bg: string; text: string; icon: string }> = {
  fix: { bg: '#FF444420', text: '#FF4444', icon: 'construct' },
  feature: { bg: '#00FF8820', text: '#00FF88', icon: 'rocket' },
  improvement: { bg: '#00A3FF20', text: '#00A3FF', icon: 'trending-up' },
};

export default function ChangelogScreen() {
  useScreenTracking('changelog');

  return (
    <>
      <Stack.Screen options={{ title: 'CHANGELOG', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <AnimatedEntry>
          <LinearGradient colors={['#0A0A0A', '#0A1A0A', '#0A0A0A'] as [string, string, string]} style={styles.hero}>
            <Ionicons name="newspaper" size={36} color={colors.primary} />
            <Text style={styles.heroTitle}>WHAT'S NEW</Text>
            <Text style={styles.heroSub}>Latest updates and bug fixes</Text>
          </LinearGradient>
        </AnimatedEntry>

        {CHANGELOG.map((entry, i) => {
          const tc = typeColors[entry.type];
          return (
            <AnimatedEntry key={entry.version} delay={i * 40}>
              <View style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryLeft}>
                    <View style={[styles.typeBadge, { backgroundColor: tc.bg }]}>
                      <Ionicons name={tc.icon as any} size={12} color={tc.text} />
                      <Text style={[styles.typeText, { color: tc.text }]}>{entry.type.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.entryVersion}>v{entry.version}</Text>
                  </View>
                  <Text style={styles.entryDate}>{entry.date}</Text>
                </View>
                <Text style={styles.entryTitle}>{entry.title}</Text>
                {entry.details.map((detail, j) => (
                  <View key={j} style={styles.detailRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.detailText}>{detail}</Text>
                  </View>
                ))}
              </View>
            </AnimatedEntry>
          );
        })}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl * 2 },
  hero: { alignItems: 'center', paddingVertical: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.lg },
  heroTitle: { fontSize: fontSize.xl, fontWeight: '900', color: colors.primary, letterSpacing: 4, marginTop: spacing.sm },
  heroSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  entryCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  entryLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  typeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  entryVersion: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '700' },
  entryDate: { fontSize: fontSize.xs, color: colors.textMuted },
  entryTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  detailRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  bullet: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '800', marginTop: 1 },
  detailText: { flex: 1, fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
});
