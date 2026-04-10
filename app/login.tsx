import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { login, seedAdminAccount, getCurrentUser } from '../lib/storage';
import AnimatedEntry from '../components/AnimatedEntry';
import { trackEvent } from '../lib/analytics';
import { hapticSuccess, hapticError } from '../lib/haptics';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // If already logged in, go to dashboard
  useFocusEffect(useCallback(() => {
    getCurrentUser().then((u) => {
      if (u) router.push('/');
    });
  }, []));

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Enter your username and password.');
      return;
    }
    setLoading(true);
    await seedAdminAccount();
    const user = await login(username.trim(), password.trim());
    setLoading(false);

    if (user) {
      hapticSuccess();
      trackEvent('user_login', { role: user.role, username: user.username });
      router.push('/');
    } else {
      hapticError();
      Alert.alert('Login Failed', 'Invalid username or password. Check your credentials and try again.');
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false, tabBarStyle: { display: 'none' } } as any} />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inner}>
          <AnimatedEntry>
            <LinearGradient colors={[...gradients.heroBg] as [string, string, ...string[]]} style={styles.hero}>
              <Text style={styles.brand}>BCA</Text>
              <Text style={styles.subtitle}>ARCHERY OS</Text>
              <LinearGradient colors={[...gradients.primaryToSecondary] as [string, string]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.taglineBadge}>
                <Text style={styles.tagline}>BOW CONTROL ANALYTICS</Text>
              </LinearGradient>
            </LinearGradient>
          </AnimatedEntry>

          <AnimatedEntry delay={100}>
            <Text style={styles.welcomeText}>Welcome back</Text>

            <View style={styles.inputWrap}>
              <Ionicons name="person" size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.input} value={username} onChangeText={setUsername}
                placeholder="Username" placeholderTextColor={colors.textMuted}
                autoCapitalize="none" autoCorrect={false}
                returnKeyType="next" />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed" size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput style={[styles.input, { flex: 1 }]} value={password} onChangeText={setPassword}
                placeholder="Password" placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword} autoCapitalize="none"
                returnKeyType="go" onSubmitEditing={handleLogin} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </AnimatedEntry>

          <AnimatedEntry delay={200}>
            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
              <LinearGradient colors={[...gradients.primaryToSecondary] as [string, string]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.loginBtnGradient}>
                {loading ? (
                  <><ActivityIndicator size="small" color={colors.background} /><Text style={styles.loginBtnText}>LOGGING IN...</Text></>
                ) : (
                  <>
                    <Ionicons name="log-in" size={20} color={colors.background} />
                    <Text style={styles.loginBtnText}>LOG IN</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </AnimatedEntry>

          <AnimatedEntry delay={300}>
            <Text style={styles.footerText}>
              Don't have an account? Contact the admin for an invite.
            </Text>
          </AnimatedEntry>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  hero: { alignItems: 'center', paddingVertical: spacing.xl, borderRadius: borderRadius.lg, marginBottom: spacing.xl },
  brand: { fontSize: fontSize.hero, fontWeight: '900', color: colors.primary, letterSpacing: 8 },
  subtitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, letterSpacing: 6, marginTop: -4 },
  taglineBadge: { marginTop: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  tagline: { fontSize: fontSize.xs, fontWeight: '800', color: colors.background, letterSpacing: 2 },
  welcomeText: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: spacing.lg },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, padding: spacing.md, color: colors.text, fontSize: fontSize.md },
  eyeBtn: { padding: spacing.sm },
  loginBtn: { borderRadius: borderRadius.md, overflow: 'hidden', marginTop: spacing.md },
  loginBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md },
  loginBtnText: { fontSize: fontSize.md, fontWeight: '800', color: colors.background, letterSpacing: 2 },
  footerText: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl, lineHeight: 20 },
});
