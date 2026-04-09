import { useRef } from 'react';
import { Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { colors, fontSize } from '../lib/theme';

interface Props {
  value: number;
  selected: boolean;
  onPress: () => void;
}

const ringColors: Record<number, { bg: string; text: string }> = {
  10: { bg: '#FFD700', text: '#000' },
  9: { bg: '#FFD700', text: '#000' },
  8: { bg: '#FF4444', text: '#FFF' },
  7: { bg: '#FF4444', text: '#FFF' },
  6: { bg: '#00A3FF', text: '#FFF' },
  5: { bg: '#00A3FF', text: '#FFF' },
  4: { bg: '#222', text: '#FFF' },
  3: { bg: '#222', text: '#FFF' },
  2: { bg: '#FFF', text: '#000' },
  1: { bg: '#FFF', text: '#000' },
  0: { bg: '#888', text: '#FFF' },
};

export default function ScoreRing({ value, selected, onPress }: Props) {
  const ring = ringColors[value] || ringColors[0];
  const scaleAnim = useRef(new Animated.Value(1)).current;

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
          { backgroundColor: ring.bg, transform: [{ scale: scaleAnim }] },
          selected && styles.selected,
        ]}
      >
        <Text style={[styles.text, { color: ring.text }]}>
          {value === 10 ? 'X' : value}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3,
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
  text: {
    fontSize: fontSize.md,
    fontWeight: '800',
  },
});
