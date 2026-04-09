import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import uuid from 'react-native-uuid';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { getExpenses, saveExpense, deleteExpense } from '../lib/storage';
import EquipmentPicker from '../components/EquipmentPicker';
import AnimatedEntry from '../components/AnimatedEntry';
import { useScreenTracking } from '../lib/useAnalytics';
import { trackEvent } from '../lib/analytics';
import type { Expense } from '../lib/types';
import { EXPENSE_CATEGORIES } from '../lib/types';

export default function ExpenseDetailScreen() {
  useScreenTracking('expense-detail');
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [vendor, setVendor] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [bowConfigId, setBowConfigId] = useState<string | undefined>();
  const [arrowConfigId, setArrowConfigId] = useState<string | undefined>();
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (id) loadExpense();
  }, [id]);

  const loadExpense = async () => {
    const all = await getExpenses();
    const expense = all.find((e) => e.id === id);
    if (expense) {
      setAmount(String(expense.amount));
      setDate(expense.date.split('T')[0]);
      setCategory(expense.category);
      setDescription(expense.description);
      setVendor(expense.vendor);
      setReceiptUrl(expense.receiptUrl || '');
      setBowConfigId(expense.bowConfigId);
      setArrowConfigId(expense.arrowConfigId);
      setNotes(expense.notes);
    }
  };

  const handleSave = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Required', 'Please enter a valid amount.');
      return;
    }
    if (!category) {
      Alert.alert('Required', 'Please select a category.');
      return;
    }

    const expense: Expense = {
      id: id || (uuid.v4() as string),
      date: date || new Date().toISOString().split('T')[0],
      amount: amountNum,
      category,
      description: description.trim(),
      vendor: vendor.trim(),
      receiptUrl: receiptUrl.trim() || undefined,
      bowConfigId,
      arrowConfigId,
      notes: notes.trim(),
    };

    await saveExpense(expense);
    trackEvent('expense_logged');
    router.back();
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteExpense(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditing ? 'EDIT EXPENSE' : 'LOG EXPENSE',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerRight: isEditing
            ? () => (
                <TouchableOpacity onPress={handleDelete}>
                  <Ionicons name="trash" size={22} color={colors.danger} />
                </TouchableOpacity>
              )
            : undefined,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Amount */}
        <AnimatedEntry>
          <View style={styles.amountSection}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
          </View>
        </AnimatedEntry>

        {/* Date */}
        <AnimatedEntry delay={40}>
          <Text style={styles.label}>DATE</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
          />
        </AnimatedEntry>

        {/* Category */}
        <AnimatedEntry delay={80}>
          <Text style={styles.label}>CATEGORY</Text>
          <View style={styles.categoryGrid}>
            {EXPENSE_CATEGORIES.map((cat) => {
              const selected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.7}
                >
                  {selected && (
                    <Ionicons name="checkmark-circle" size={14} color={colors.secondary} style={{ marginRight: 4 }} />
                  )}
                  <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </AnimatedEntry>

        {/* Description */}
        <AnimatedEntry delay={120}>
          <Text style={styles.label}>DESCRIPTION</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="What did you buy?"
            placeholderTextColor={colors.textMuted}
          />
        </AnimatedEntry>

        {/* Vendor */}
        <AnimatedEntry delay={160}>
          <Text style={styles.label}>VENDOR</Text>
          <TextInput
            style={styles.input}
            value={vendor}
            onChangeText={setVendor}
            placeholder="e.g., Lancaster Archery, Bass Pro"
            placeholderTextColor={colors.textMuted}
          />
        </AnimatedEntry>

        {/* Receipt */}
        <AnimatedEntry delay={200}>
          <Text style={styles.label}>RECEIPT URL / PHOTO</Text>
          <TextInput
            style={styles.input}
            value={receiptUrl}
            onChangeText={setReceiptUrl}
            placeholder="Paste image URL or photo path"
            placeholderTextColor={colors.textMuted}
          />
        </AnimatedEntry>

        {/* Equipment */}
        <AnimatedEntry delay={240}>
          <Text style={styles.label}>LINKED EQUIPMENT (OPTIONAL)</Text>
          <EquipmentPicker
            selectedBowId={bowConfigId}
            selectedArrowId={arrowConfigId}
            onBowSelect={setBowConfigId}
            onArrowSelect={setArrowConfigId}
          />
        </AnimatedEntry>

        {/* Notes */}
        <AnimatedEntry delay={280}>
          <Text style={styles.label}>NOTES</Text>
          <TextInput
            style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
        </AnimatedEntry>

        {/* Save */}
        <AnimatedEntry delay={320}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
            <LinearGradient
              colors={[colors.primary, colors.secondary] as [string, string]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.saveBtnGradient}
            >
              <Ionicons name="checkmark-circle" size={22} color={colors.background} />
              <Text style={styles.saveBtnText}>{isEditing ? 'UPDATE EXPENSE' : 'SAVE EXPENSE'}</Text>
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
  amountSection: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  dollarSign: {
    fontSize: fontSize.hero, fontWeight: '900', color: colors.primary, marginRight: spacing.xs,
  },
  amountInput: {
    fontSize: fontSize.hero, fontWeight: '900', color: colors.primary,
    minWidth: 120, textAlign: 'center',
  },
  label: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 2, marginBottom: spacing.sm, marginTop: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md,
    color: colors.text, fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border,
  },
  categoryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipSelected: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondary + '15',
  },
  categoryChipText: {
    fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600',
  },
  categoryChipTextSelected: {
    color: colors.secondary,
  },
  saveBtn: { marginTop: spacing.xl, borderRadius: borderRadius.md, overflow: 'hidden' },
  saveBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, padding: spacing.md,
  },
  saveBtnText: { fontSize: fontSize.md, fontWeight: '800', color: colors.background, letterSpacing: 2 },
});
