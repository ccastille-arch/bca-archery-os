import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { getDashboardPrefs, saveDashboardPrefs } from '../lib/storage';
import AnimatedEntry from '../components/AnimatedEntry';
import { useScreenTracking } from '../lib/useAnalytics';

export interface DashCard {
  id: string;
  label: string;
  icon: string;
  color: string;
  route: string;
}

export const ALL_DASHBOARD_CARDS: DashCard[] = [
  { id: 'live-scorer', label: 'Live Scorer', icon: 'trophy', color: '#00AA00', route: '/rounds' },
  { id: 'target-map', label: 'Target Map', icon: 'aperture', color: '#00FF88', route: '/target-map' },
  { id: 'log-shots', label: 'Log Shots', icon: 'add-circle', color: '#00FF88', route: '/shot-detail' },
  { id: 'new-session', label: 'New Session', icon: 'play-circle', color: '#00A3FF', route: '/session-detail' },
  { id: 'gear', label: 'Gear', icon: 'fitness', color: '#00FF88', route: '/gear' },
  { id: 'analytics', label: 'Analytics', icon: 'bar-chart', color: '#00A3FF', route: '/analytics' },
  { id: 'tournaments', label: 'Tournaments', icon: 'trophy', color: '#FFB800', route: '/tournaments' },
  { id: 'stab-lab', label: 'Stab Lab', icon: 'flask', color: '#FF8C00', route: '/stabilizer-test' },
  { id: '3d-targets', label: '3D Targets', icon: 'paw', color: '#8B4526', route: '/targets-3d' },
  { id: 'forum', label: 'Forum', icon: 'chatbubbles', color: '#9B59B6', route: '/forum' },
  { id: 'experts', label: 'Ask Experts', icon: 'people', color: '#E74C3C', route: '/experts' },
  { id: 'profile', label: 'My Profile', icon: 'person-circle', color: '#FFFFFF', route: '/profile' },
  { id: 'sights', label: 'Sights', icon: 'build', color: '#00A3FF', route: '/sights' },
  { id: 'sessions', label: 'Sessions', icon: 'timer', color: '#00FF88', route: '/sessions' },
  { id: 'ballistics', label: 'Ballistics', icon: 'rocket', color: '#FF8C00', route: '/ballistics' },
  { id: 'swap-shop', label: 'Swap Shop', icon: 'cart', color: '#27AE60', route: '/swap-shop' },
  { id: 'feedback', label: 'Feedback', icon: 'chatbox-ellipses', color: '#00A3FF', route: '/feedback' },
];

export const DEFAULT_ORDER = ALL_DASHBOARD_CARDS.map((c) => c.id);

export default function CustomizeScreen() {
  useScreenTracking('customize');
  const router = useRouter();
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER);
  const [hidden, setHidden] = useState<string[]>([]);

  useEffect(() => {
    getDashboardPrefs().then((prefs) => {
      if (prefs) {
        setOrder(prefs.order.length > 0 ? prefs.order : DEFAULT_ORDER);
        setHidden(prefs.hidden);
      }
    });
  }, []);

  const toggleCard = (id: string) => {
    setHidden(hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id]);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const newOrder = [...order];
    [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
    setOrder(newOrder);
  };

  const moveDown = (idx: number) => {
    if (idx >= order.length - 1) return;
    const newOrder = [...order];
    [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    setOrder(newOrder);
  };

  const handleSave = async () => {
    await saveDashboardPrefs({ order, hidden });
    Alert.alert('Saved!', 'Your dashboard has been customized.');
    router.back();
  };

  const handleReset = async () => {
    setOrder(DEFAULT_ORDER);
    setHidden([]);
    await saveDashboardPrefs({ order: DEFAULT_ORDER, hidden: [] });
    Alert.alert('Reset', 'Dashboard restored to defaults.');
  };

  const cardMap = new Map(ALL_DASHBOARD_CARDS.map((c) => [c.id, c]));

  return (
    <>
      <Stack.Screen options={{ title: 'CUSTOMIZE DASHBOARD', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <AnimatedEntry>
          <LinearGradient colors={['#0A0A0A', '#0A0A1A', '#0A0A0A'] as [string, string, string]} style={styles.hero}>
            <Ionicons name="options" size={36} color={colors.secondary} />
            <Text style={styles.heroTitle}>CUSTOMIZE</Text>
            <Text style={styles.heroSub}>Show, hide, and reorder your dashboard cards</Text>
          </LinearGradient>
        </AnimatedEntry>

        <Text style={styles.hint}>Toggle cards on/off. Use arrows to reorder.</Text>

        {order.map((id, idx) => {
          const card = cardMap.get(id);
          if (!card) return null;
          const isHidden = hidden.includes(id);
          return (
            <AnimatedEntry key={id} delay={idx * 30}>
              <View style={[styles.cardRow, isHidden && styles.cardRowHidden]}>
                <View style={styles.cardLeft}>
                  <Ionicons name={card.icon as any} size={20} color={isHidden ? colors.textMuted : card.color} />
                  <Text style={[styles.cardLabel, isHidden && { color: colors.textMuted }]}>{card.label}</Text>
                </View>
                <View style={styles.cardRight}>
                  <TouchableOpacity onPress={() => moveUp(idx)} style={styles.arrowBtn}>
                    <Ionicons name="chevron-up" size={18} color={idx === 0 ? colors.border : colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => moveDown(idx)} style={styles.arrowBtn}>
                    <Ionicons name="chevron-down" size={18} color={idx >= order.length - 1 ? colors.border : colors.textSecondary} />
                  </TouchableOpacity>
                  <Switch
                    value={!isHidden}
                    onValueChange={() => toggleCard(id)}
                    trackColor={{ false: colors.surfaceLight, true: colors.primary + '50' }}
                    thumbColor={isHidden ? colors.textMuted : colors.primary}
                  />
                </View>
              </View>
            </AnimatedEntry>
          );
        })}

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetBtnText}>Reset to Default</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <LinearGradient colors={[...gradients.primaryToSecondary] as [string, string]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtnInner}>
              <Text style={styles.saveBtnText}>SAVE</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl * 2 },
  hero: { alignItems: 'center', paddingVertical: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  heroTitle: { fontSize: fontSize.xl, fontWeight: '900', color: colors.secondary, letterSpacing: 4, marginTop: spacing.sm },
  heroSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  hint: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.md },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.xs },
  cardRowHidden: { opacity: 0.5 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  cardLabel: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  arrowBtn: { padding: spacing.xs },
  btnRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  resetBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border },
  resetBtnText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1, borderRadius: borderRadius.md, overflow: 'hidden' },
  saveBtnInner: { padding: spacing.md, alignItems: 'center' },
  saveBtnText: { fontSize: fontSize.md, fontWeight: '800', color: colors.background, letterSpacing: 2 },
});
