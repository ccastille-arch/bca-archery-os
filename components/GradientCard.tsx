import { View, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef } from 'react';
import { Animated } from 'react-native';
import { colors, gradients, spacing, borderRadius } from '../lib/theme';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  accentColors?: readonly string[];
  style?: object;
}

export default function GradientCard({ children, onPress, accentColors, style }: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const content = (
    <Animated.View style={[styles.card, style, { transform: [{ scale: scaleAnim }] }]}>
      <LinearGradient
        colors={[...(accentColors || gradients.cardAccent)] as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentBar}
      />
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  accentBar: {
    height: 3,
    width: '100%',
  },
  content: {
    padding: spacing.md,
  },
});
