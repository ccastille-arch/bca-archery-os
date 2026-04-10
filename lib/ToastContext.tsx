import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius, animation } from './theme';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

const typeConfig: Record<ToastType, { bg: string; icon: string; iconColor: string }> = {
  success: { bg: '#00FF8820', icon: 'checkmark-circle', iconColor: '#00FF88' },
  error: { bg: '#FF444420', icon: 'alert-circle', iconColor: '#FF4444' },
  info: { bg: '#00A3FF20', icon: 'information-circle', iconColor: '#00A3FF' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('success');
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, t: ToastType = 'success') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setMessage(msg);
    setType(t);
    setVisible(true);

    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: animation.duration.fast, useNativeDriver: true }),
    ]).start();

    timeoutRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -100, duration: animation.duration.normal, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: animation.duration.normal, useNativeDriver: true }),
      ]).start(() => setVisible(false));
    }, 2500);
  }, [translateY, opacity]);

  const config = typeConfig[type];

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <Animated.View style={[styles.toast, { backgroundColor: config.bg, transform: [{ translateY }], opacity }]}>
          <Ionicons name={config.icon as any} size={20} color={config.iconColor} />
          <Text style={styles.toastText}>{message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 9999,
  },
  toastText: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
