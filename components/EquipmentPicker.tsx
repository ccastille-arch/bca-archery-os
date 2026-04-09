import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { getBowConfigs, getArrowConfigs } from '../lib/storage';
import type { BowConfig, ArrowConfig } from '../lib/types';

interface Props {
  selectedBowId?: string;
  selectedArrowId?: string;
  onBowSelect: (id: string | undefined) => void;
  onArrowSelect: (id: string | undefined) => void;
}

export default function EquipmentPicker({ selectedBowId, selectedArrowId, onBowSelect, onArrowSelect }: Props) {
  const [bows, setBows] = useState<BowConfig[]>([]);
  const [arrows, setArrows] = useState<ArrowConfig[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    Promise.all([getBowConfigs(), getArrowConfigs()]).then(([b, a]) => {
      setBows(b);
      setArrows(a);
    });
  }, []);

  const selectedBow = bows.find((b) => b.id === selectedBowId);
  const selectedArrow = arrows.find((a) => a.id === selectedArrowId);

  if (bows.length === 0 && arrows.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="construct-outline" size={16} color={colors.textMuted} />
        <Text style={styles.emptyText}>Add equipment in the Gear tab first</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => setExpanded(!expanded)}>
        <View style={styles.headerLeft}>
          <Ionicons name="fitness" size={18} color={colors.primary} />
          <Text style={styles.headerTitle}>EQUIPMENT</Text>
        </View>
        <View style={styles.headerRight}>
          {selectedBow && (
            <View style={styles.selectedTag}>
              <Text style={styles.selectedTagText}>{selectedBow.name}</Text>
            </View>
          )}
          {selectedArrow && (
            <View style={[styles.selectedTag, { backgroundColor: colors.secondary + '20' }]}>
              <Text style={[styles.selectedTagText, { color: colors.secondary }]}>{selectedArrow.name}</Text>
            </View>
          )}
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.pickerBody}>
          {/* Bow Selection */}
          {bows.length > 0 && (
            <>
              <Text style={styles.sublabel}>
                <Ionicons name="bow" size={12} color={colors.primary} /> BOW
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={[styles.optionCard, !selectedBowId && styles.optionCardSelected]}
                    onPress={() => onBowSelect(undefined)}
                  >
                    <Text style={[styles.optionName, !selectedBowId && { color: colors.primary }]}>None</Text>
                  </TouchableOpacity>
                  {bows.map((bow) => (
                    <TouchableOpacity
                      key={bow.id}
                      style={[styles.optionCard, selectedBowId === bow.id && styles.optionCardSelected]}
                      onPress={() => onBowSelect(bow.id)}
                    >
                      {selectedBowId === bow.id && (
                        <LinearGradient
                          colors={[...gradients.primaryToSecondary] as [string, string]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.optionAccent}
                        />
                      )}
                      <Text style={[styles.optionName, selectedBowId === bow.id && { color: colors.primary }]}>
                        {bow.name}
                      </Text>
                      <Text style={styles.optionSub}>{bow.bowModel}</Text>
                      {bow.drawWeight ? <Text style={styles.optionDetail}>{bow.drawWeight}</Text> : null}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          {/* Arrow Selection */}
          {arrows.length > 0 && (
            <>
              <Text style={[styles.sublabel, { marginTop: spacing.sm }]}>
                <Ionicons name="arrow-forward" size={12} color={colors.secondary} /> ARROWS
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={[styles.optionCard, !selectedArrowId && styles.optionCardSelectedBlue]}
                    onPress={() => onArrowSelect(undefined)}
                  >
                    <Text style={[styles.optionName, !selectedArrowId && { color: colors.secondary }]}>None</Text>
                  </TouchableOpacity>
                  {arrows.map((arrow) => (
                    <TouchableOpacity
                      key={arrow.id}
                      style={[styles.optionCard, selectedArrowId === arrow.id && styles.optionCardSelectedBlue]}
                      onPress={() => onArrowSelect(arrow.id)}
                    >
                      {selectedArrowId === arrow.id && (
                        <LinearGradient
                          colors={['#00A3FF', '#00FF88'] as [string, string]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.optionAccent}
                        />
                      )}
                      <Text style={[styles.optionName, selectedArrowId === arrow.id && { color: colors.secondary }]}>
                        {arrow.name}
                      </Text>
                      <Text style={styles.optionSub}>{arrow.shaftModel}</Text>
                      {arrow.spine ? <Text style={styles.optionDetail}>{arrow.spine} spine</Text> : null}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  selectedTag: {
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  selectedTagText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.primary,
  },
  pickerBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  sublabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 100,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  optionCardSelectedBlue: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondary + '10',
  },
  optionAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  optionName: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
  },
  optionSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  optionDetail: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  emptyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
