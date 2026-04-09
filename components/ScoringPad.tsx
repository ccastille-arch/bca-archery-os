import { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { colors, fontSize, borderRadius, spacing } from '../lib/theme';
import type { ScoringMode } from '../lib/types';
import { SCORING_VALUES } from '../lib/types';

interface Props {
  scoringMode: ScoringMode;
  selectedValue: number;
  onSelect: (value: number) => void;
}

// Color schemes per scoring mode
const modeColors: Record<ScoringMode, (value: number, index: number) => { bg: string; text: string }> = {
  'standard': (v) => {
    if (v >= 10) return { bg: '#FFD700', text: '#000' };
    if (v >= 9) return { bg: '#FFD700', text: '#000' };
    if (v >= 7) return { bg: '#FF4444', text: '#FFF' };
    if (v >= 5) return { bg: '#00A3FF', text: '#FFF' };
    if (v >= 3) return { bg: '#222', text: '#FFF' };
    if (v >= 1) return { bg: '#FFF', text: '#000' };
    return { bg: '#888', text: '#FFF' };
  },
  'asa-3d': (v) => {
    if (v === 14) return { bg: '#FFD700', text: '#000' };
    if (v === 12) return { bg: '#FF4444', text: '#FFF' };
    if (v === 10) return { bg: '#00A3FF', text: '#FFF' };
    if (v === 8) return { bg: '#00FF88', text: '#000' };
    if (v === 5) return { bg: '#FFF', text: '#000' };
    return { bg: '#888', text: '#FFF' };
  },
  'ibo-3d': (v) => {
    if (v === 11) return { bg: '#FFD700', text: '#000' };
    if (v === 10) return { bg: '#FF4444', text: '#FFF' };
    if (v === 8) return { bg: '#00A3FF', text: '#FFF' };
    if (v === 5) return { bg: '#FFF', text: '#000' };
    return { bg: '#888', text: '#FFF' };
  },
  'nfaa-indoor': (v, i) => {
    if (i === 0) return { bg: '#FFD700', text: '#000' }; // X
    if (v === 5) return { bg: '#00A3FF', text: '#FFF' };
    if (v >= 3) return { bg: '#FF4444', text: '#FFF' };
    if (v >= 1) return { bg: '#FFF', text: '#000' };
    return { bg: '#888', text: '#FFF' };
  },
  'nfaa-field': (v) => {
    if (v === 5) return { bg: '#FFD700', text: '#000' };
    if (v === 4) return { bg: '#FF4444', text: '#FFF' };
    if (v === 3) return { bg: '#00A3FF', text: '#FFF' };
    if (v >= 1) return { bg: '#FFF', text: '#000' };
    return { bg: '#888', text: '#FFF' };
  },
  'vegas': (v, i) => {
    if (i === 0) return { bg: '#FFD700', text: '#000' }; // X
    if (v >= 9) return { bg: '#FFD700', text: '#000' };
    if (v >= 7) return { bg: '#FF4444', text: '#FFF' };
    if (v >= 5) return { bg: '#00A3FF', text: '#FFF' };
    if (v >= 3) return { bg: '#222', text: '#FFF' };
    if (v >= 1) return { bg: '#FFF', text: '#000' };
    return { bg: '#888', text: '#FFF' };
  },
  'wa-outdoor': (v, i) => {
    if (i === 0) return { bg: '#FFD700', text: '#000' };
    if (v >= 9) return { bg: '#FFD700', text: '#000' };
    if (v >= 7) return { bg: '#FF4444', text: '#FFF' };
    if (v >= 5) return { bg: '#00A3FF', text: '#FFF' };
    if (v >= 3) return { bg: '#222', text: '#FFF' };
    if (v >= 1) return { bg: '#FFF', text: '#000' };
    return { bg: '#888', text: '#FFF' };
  },
  'lancaster': (v, i) => {
    if (i === 0) return { bg: '#FFD700', text: '#000' };
    if (v >= 9) return { bg: '#FFD700', text: '#000' };
    if (v >= 7) return { bg: '#FF4444', text: '#FFF' };
    if (v >= 5) return { bg: '#00A3FF', text: '#FFF' };
    if (v >= 3) return { bg: '#222', text: '#FFF' };
    if (v >= 1) return { bg: '#FFF', text: '#000' };
    return { bg: '#888', text: '#FFF' };
  },
  'hunting': (v) => {
    if (v >= 10) return { bg: '#FFD700', text: '#000' };
    if (v >= 9) return { bg: '#FFD700', text: '#000' };
    if (v >= 7) return { bg: '#FF4444', text: '#FFF' };
    if (v >= 5) return { bg: '#00A3FF', text: '#FFF' };
    if (v >= 3) return { bg: '#222', text: '#FFF' };
    if (v >= 1) return { bg: '#FFF', text: '#000' };
    return { bg: '#888', text: '#FFF' };
  },
};

function ScoreButton({ value, label, selected, colorFn, index, onPress }: {
  value: number; label: string; selected: boolean;
  colorFn: (v: number, i: number) => { bg: string; text: string };
  index: number; onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const ringColor = colorFn(value, index);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: selected ? 1.1 : 1, useNativeDriver: true, speed: 50, bounciness: 12 }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Animated.View
        style={[
          styles.ring,
          { backgroundColor: ringColor.bg, transform: [{ scale: scaleAnim }] },
          selected && styles.selected,
        ]}
      >
        <Text style={[styles.ringText, { color: ringColor.text }]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function ScoringPad({ scoringMode, selectedValue, onSelect }: Props) {
  const scoring = SCORING_VALUES[scoringMode];
  const colorFn = modeColors[scoringMode] || modeColors['standard'];

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {scoring.values.map((value, i) => (
          <ScoreButton
            key={`${scoringMode}-${i}`}
            value={value}
            label={scoring.labels[i]}
            selected={selectedValue === value && scoring.labels[i] === scoring.labels[scoring.values.indexOf(selectedValue)]}
            colorFn={colorFn}
            index={i}
            onPress={() => onSelect(value)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  ring: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  selected: {
    borderWidth: 3,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  ringText: {
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
});
