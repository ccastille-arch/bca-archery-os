import { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getShots, getSessions } from '../lib/storage';
import AnimatedEntry from '../components/AnimatedEntry';
import { useScreenTracking } from '../lib/useAnalytics';
import type { Profile } from '../lib/types';

export default function ProfileScreen() {
  useScreenTracking('profile');
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Local stats
  const [totalShots, setTotalShots] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadLocalStats();
      if (isSupabaseConfigured()) {
        loadProfile();
      } else {
        setLoading(false);
      }
    }, [])
  );

  const loadLocalStats = async () => {
    try {
      const shots = await getShots();
      const sessions = await getSessions();
      setTotalShots(shots.length);
      setTotalSessions(sessions.length);
    } catch {
      // Ignore storage errors
    }
  };

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || '');
        setUsername(data.username || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || '');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          username: username.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl.trim(),
        })
        .eq('id', profile.id);

      if (error) throw error;
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not sign out.');
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'PROFILE', headerShown: true }} />
        <View style={styles.notConfigured}>
          <LinearGradient
            colors={[colors.surface, colors.background] as [string, string]}
            style={styles.notConfiguredGradient}
          >
            <Ionicons name="person-circle-outline" size={64} color={colors.textMuted} />
            <Text style={styles.notConfiguredTitle}>Connect to Supabase</Text>
            <Text style={styles.notConfiguredText}>
              Connect to Supabase to unlock community features like profiles, forums, and expert coaching.
            </Text>
            <Text style={styles.notConfiguredHint}>
              Open lib/supabase.ts and replace the placeholder URL and anon key with your Supabase project credentials.
            </Text>
          </LinearGradient>

          {/* Still show local stats */}
          <AnimatedEntry delay={200}>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{totalShots}</Text>
                <Text style={styles.statLabel}>Shots Logged</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{totalSessions}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
            </View>
          </AnimatedEntry>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'PROFILE', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {loading ? (
          <View style={styles.loadingWrap}>
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : !profile ? (
          <AnimatedEntry>
            <View style={styles.noProfile}>
              <Ionicons name="person-circle-outline" size={64} color={colors.textMuted} />
              <Text style={styles.noProfileText}>Not signed in</Text>
              <TouchableOpacity onPress={() => router.push('/auth')} activeOpacity={0.8}>
                <LinearGradient
                  colors={[...gradients.primaryToSecondary] as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.authBtn}
                >
                  <Text style={styles.authBtnText}>Log In / Sign Up</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </AnimatedEntry>
        ) : (
          <>
            {/* Avatar area */}
            <AnimatedEntry>
              <View style={styles.avatarSection}>
                <View style={styles.avatarCircle}>
                  <Ionicons name="person" size={48} color={colors.textMuted} />
                </View>
                {profile.is_expert && (
                  <View style={styles.expertBadge}>
                    <Ionicons name="shield-checkmark" size={14} color={colors.background} />
                    <Text style={styles.expertBadgeText}>Expert</Text>
                  </View>
                )}
              </View>
            </AnimatedEntry>

            {/* Stats */}
            <AnimatedEntry delay={100}>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{totalShots}</Text>
                  <Text style={styles.statLabel}>Shots Logged</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{totalSessions}</Text>
                  <Text style={styles.statLabel}>Sessions</Text>
                </View>
              </View>
            </AnimatedEntry>

            {/* Edit form */}
            <AnimatedEntry delay={200}>
              <View style={styles.form}>
                <Text style={styles.label}>Display Name</Text>
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholderTextColor={colors.textMuted}
                  placeholder="Your display name"
                />

                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholderTextColor={colors.textMuted}
                  placeholder="Unique username"
                  autoCapitalize="none"
                />

                <Text style={styles.label}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  value={bio}
                  onChangeText={setBio}
                  placeholderTextColor={colors.textMuted}
                  placeholder="Tell the community about yourself..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <Text style={styles.label}>Avatar URL</Text>
                <TextInput
                  style={styles.input}
                  value={avatarUrl}
                  onChangeText={setAvatarUrl}
                  placeholderTextColor={colors.textMuted}
                  placeholder="https://..."
                  autoCapitalize="none"
                />

                {/* Expert link */}
                {profile.is_expert && (
                  <TouchableOpacity
                    style={styles.expertLink}
                    onPress={() => router.push('/expert-dashboard')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                    <Text style={styles.expertLinkText}>Manage Expert Profile</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}

                {/* Save */}
                <TouchableOpacity onPress={handleSave} activeOpacity={0.8} disabled={saving}>
                  <LinearGradient
                    colors={[...gradients.primaryToSecondary] as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                  >
                    <Text style={styles.saveBtnText}>
                      {saving ? 'Saving...' : 'Save Profile'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
                  <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                  <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
              </View>
            </AnimatedEntry>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md, paddingBottom: 60 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxl },
  loadingText: { fontSize: fontSize.md, color: colors.textSecondary },
  noProfile: { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.md },
  noProfileText: { fontSize: fontSize.lg, color: colors.textSecondary, fontWeight: '600' },
  authBtn: {
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  authBtnText: { fontSize: fontSize.md, fontWeight: '800', color: colors.background },
  avatarSection: { alignItems: 'center', marginBottom: spacing.lg },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginTop: spacing.sm,
  },
  expertBadgeText: { fontSize: fontSize.xs, fontWeight: '800', color: colors.background },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: fontSize.xl, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '600', marginTop: 2 },
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
  bioInput: { minHeight: 100 },
  expertLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    marginTop: spacing.sm,
  },
  expertLinkText: { flex: 1, fontSize: fontSize.md, fontWeight: '700', color: colors.primary },
  saveBtn: {
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveBtnText: { fontSize: fontSize.lg, fontWeight: '800', color: colors.background },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.danger + '15',
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger + '30',
  },
  logoutText: { fontSize: fontSize.md, fontWeight: '700', color: colors.danger },
  notConfigured: { flex: 1, justifyContent: 'center', padding: spacing.md },
  notConfiguredGradient: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
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
