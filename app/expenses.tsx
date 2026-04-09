import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { getExpenses, getBowConfigs, getArrowConfigs } from '../lib/storage';
import GradientCard from '../components/GradientCard';
import AnimatedEntry from '../components/AnimatedEntry';
import type { Expense, BowConfig, ArrowConfig } from '../lib/types';
import { EXPENSE_CATEGORIES } from '../lib/types';

export default function ExpensesScreen() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [bows, setBows] = useState<BowConfig[]>([]);
  const [arrows, setArrows] = useState<ArrowConfig[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getExpenses(), getBowConfigs(), getArrowConfigs()]).then(([e, b, a]) => {
        setExpenses(e);
        setBows(b);
        setArrows(a);
      });
    }, [])
  );

  const getBowName = (id?: string) => bows.find((b) => b.id === id)?.name;
  const getArrowName = (id?: string) => arrows.find((a) => a.id === id)?.name;

  const filteredExpenses = selectedCategory
    ? expenses.filter((e) => e.category === selectedCategory)
    : expenses;

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  // This month's total
  const now = new Date();
  const thisMonthTotal = expenses
    .filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + e.amount, 0);

  // Top 3 categories
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });
  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const renderExpense = ({ item, index }: { item: Expense; index: number }) => {
    const bowName = getBowName(item.bowConfigId);
    const arrowName = getArrowName(item.arrowConfigId);
    const date = new Date(item.date);

    return (
      <AnimatedEntry delay={index * 40}>
        <GradientCard
          onPress={() => router.push({ pathname: '/expense-detail', params: { id: item.id } })}
          accentColors={[...gradients.cardAccent]}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.date}>{date.toLocaleDateString()}</Text>
            <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
          </View>

          <View style={styles.cardMiddle}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{item.category}</Text>
            </View>
            {item.receiptUrl && (
              <Ionicons name="receipt-outline" size={14} color={colors.textSecondary} />
            )}
          </View>

          {item.description ? (
            <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
          ) : null}

          {item.vendor ? (
            <Text style={styles.vendor} numberOfLines={1}>
              <Ionicons name="storefront-outline" size={11} color={colors.textMuted} /> {item.vendor}
            </Text>
          ) : null}

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
        </GradientCard>
      </AnimatedEntry>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderExpense}
        ListHeaderComponent={
          <>
            {expenses.length > 0 && (
              <AnimatedEntry>
                {/* Summary header */}
                <View style={styles.summaryCard}>
                  <LinearGradient
                    colors={[colors.primary + '20', colors.primary + '05'] as [string, string]}
                    style={styles.summaryGradient}
                  >
                    <Text style={styles.summaryTitle}>TOTAL SPENT</Text>
                    <Text style={styles.totalAmount}>${totalSpent.toFixed(2)}</Text>
                    <View style={styles.summarySubRow}>
                      <Text style={styles.summarySubLabel}>This month:</Text>
                      <Text style={styles.summarySubValue}>${thisMonthTotal.toFixed(2)}</Text>
                    </View>
                    {topCategories.length > 0 && (
                      <View style={styles.topCategories}>
                        {topCategories.map(([cat, amt]) => (
                          <View key={cat} style={styles.topCatRow}>
                            <Text style={styles.topCatName}>{cat}</Text>
                            <Text style={styles.topCatAmount}>${amt.toFixed(2)}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </LinearGradient>
                </View>
              </AnimatedEntry>
            )}
            {/* Filter chips */}
            <AnimatedEntry delay={40}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
                contentContainerStyle={styles.filterContent}
              >
                <TouchableOpacity
                  style={[styles.filterChip, !selectedCategory && styles.filterChipActive]}
                  onPress={() => setSelectedCategory(null)}
                >
                  <Text style={[styles.filterChipText, !selectedCategory && styles.filterChipTextActive]}>
                    All
                  </Text>
                </TouchableOpacity>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
                    onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  >
                    <Text style={[styles.filterChipText, selectedCategory === cat && styles.filterChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </AnimatedEntry>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <LinearGradient
              colors={[colors.surface, colors.background] as [string, string]}
              style={styles.emptyGradient}
            >
              <Ionicons name="cash-outline" size={56} color={colors.textMuted} />
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubtext}>Tap + to log your first expense</Text>
            </LinearGradient>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/expense-detail')} activeOpacity={0.8}>
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
  summaryCard: { borderRadius: borderRadius.lg, overflow: 'hidden', marginBottom: spacing.md, borderWidth: 1, borderColor: colors.primary + '30' },
  summaryGradient: { padding: spacing.lg, borderRadius: borderRadius.lg },
  summaryTitle: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary, letterSpacing: 2 },
  totalAmount: { fontSize: fontSize.hero, fontWeight: '900', color: colors.primary, marginTop: spacing.xs },
  summarySubRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  summarySubLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  summarySubValue: { fontSize: fontSize.md, fontWeight: '700', color: colors.secondary },
  topCategories: { marginTop: spacing.md, gap: spacing.xs },
  topCatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topCatName: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  topCatAmount: { fontSize: fontSize.sm, color: colors.text, fontWeight: '700' },
  filterScroll: { marginBottom: spacing.md },
  filterContent: { gap: spacing.sm },
  filterChip: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  filterChipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  filterChipTextActive: { color: colors.primary },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  date: { fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
  amount: { fontSize: fontSize.lg, fontWeight: '800', color: colors.primary },
  cardMiddle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  categoryBadge: {
    backgroundColor: colors.secondary + '20',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  categoryBadgeText: { fontSize: fontSize.xs, color: colors.secondary, fontWeight: '700' },
  description: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs },
  vendor: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: spacing.xs },
  gearTags: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  gearTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary + '15', borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  gearTagText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.primary },
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
