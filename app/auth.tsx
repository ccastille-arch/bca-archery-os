import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import AnimatedEntry from '../components/AnimatedEntry';

export default function AuthScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isExpert, setIsExpert] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter email and password.');
      return;
    }

    if (!isLogin && !username.trim()) {
      Alert.alert('Missing Fields', 'Please enter a username.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace('/');
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            username: username.trim(),
            display_name: displayName.trim() || username.trim(),
            is_expert: isExpert,
            bio: '',
            avatar_url: '',
          });
          if (profileError) throw profileError;
        }

        Alert.alert('Account Created', 'Check your email to confirm your account, then log in.');
        setIsLogin(true);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'LOGIN', headerShown: true }} />
        <View style={styles.notConfigured}>
          <LinearGradient
            colors={[colors.surface, colors.background] as [string, string]}
            style={styles.notConfiguredGradient}
          >
            <Ionicons name="cloud-offline-outline" size={64} color={colors.textMuted} />
            <Text style={styles.notConfiguredTitle}>Connect to Supabase</Text>
            <Text style={styles.notConfiguredText}>
              Connect to Supabase to unlock community features like forums, profiles, and expert coaching.
            </Text>
            <Text style={styles.notConfiguredHint}>
              Open lib/supabase.ts and replace the placeholder URL and anon key with your Supabase project credentials.
            </Text>
          </LinearGradient>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: isLogin ? 'LOGIN' : 'SIGN UP', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Hero */}
        <AnimatedEntry>
          <LinearGradient colors={[...gradients.heroBg] as [string, string, string]} style={styles.hero}>
            <Ionicons name="trophy" size={48} color={colors.primary} />
            <Text style={styles.heroTitle}>BCA ARCHERY OS</Text>
            <Text style={styles.heroSubtitle}>
              {isLogin ? 'Welcome back, archer' : 'Join the community'}
            </Text>
          </LinearGradient>
        </AnimatedEntry>

        {/* Form */}
        <AnimatedEntry delay={100}>
          <View style={styles.form}>
            {!isLogin && (
              <>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Pick a unique username"
                  placeholderTextColor={colors.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />

                <Text style={styles.label}>Display Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="How others see you"
                  placeholderTextColor={colors.textMuted}
                  value={displayName}
                  onChangeText={setDisplayName}
                />
              </>
            )}

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Min 6 characters"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {!isLogin && (
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setIsExpert(!isExpert)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isExpert ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={isExpert ? colors.primary : colors.textSecondary}
                />
                <View style={styles.checkboxTextWrap}>
                  <Text style={styles.checkboxLabel}>I'm a Pro Archer / Expert</Text>
                  <Text style={styles.checkboxHint}>
                    You can offer coaching sessions and answer community questions
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Submit */}
            <TouchableOpacity onPress={handleSubmit} activeOpacity={0.8} disabled={loading}>
              <LinearGradient
                colors={[...gradients.primaryToSecondary] as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.submitBtn, loading && { opacity: 0.6 }]}
              >
                <Text style={styles.submitText}>
                  {loading ? 'Please wait...' : isLogin ? 'Log In' : 'Create Account'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Toggle mode */}
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setIsLogin(!isLogin)}
              activeOpacity={0.7}
            >
              <Text style={styles.toggleText}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Text style={styles.toggleLink}>{isLogin ? 'Sign Up' : 'Log In'}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </AnimatedEntry>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md, paddingBottom: 60 },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 3,
    marginTop: spacing.md,
  },
  heroSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  form: { gap: spacing.sm },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: fontSize.md,
    padding: spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkboxTextWrap: { flex: 1 },
  checkboxLabel: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  checkboxHint: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  submitBtn: {
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  submitText: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.background,
  },
  toggleRow: { alignItems: 'center', marginTop: spacing.lg },
  toggleText: { fontSize: fontSize.md, color: colors.textSecondary },
  toggleLink: { color: colors.primary, fontWeight: '700' },
  notConfigured: { flex: 1, justifyContent: 'center', padding: spacing.md },
  notConfiguredGradient: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  notConfiguredTitle: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.md,
  },
  notConfiguredText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  notConfiguredHint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 20,
  },
});
