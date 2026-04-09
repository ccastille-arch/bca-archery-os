import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, Linking, Switch,
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import uuid from 'react-native-uuid';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { getAllUsers, createUser, deleteUser, getInvites, saveInvite, updateUserPermissions } from '../lib/storage';
import AnimatedEntry from '../components/AnimatedEntry';
import GradientCard from '../components/GradientCard';
import { useScreenTracking } from '../lib/useAnalytics';
import { trackEvent } from '../lib/analytics';
import type { AppUser, Invite } from '../lib/types';

const APP_URL = 'https://bca-archery-os.vercel.app';

function gen4Digit(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default function UserManagementScreen() {
  useScreenTracking('user-management');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [tab, setTab] = useState<'users' | 'create' | 'invite'>('users');

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState(gen4Digit());
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newCanInvite, setNewCanInvite] = useState(false);

  const [inviteName, setInviteName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteCanInvite, setInviteCanInvite] = useState(false);

  useFocusEffect(useCallback(() => {
    getAllUsers().then(setUsers);
    getInvites().then(setInvites);
  }, []));

  const handleCreateUser = async () => {
    if (!newUsername.trim()) { Alert.alert('Required', 'Username is required.'); return; }
    const existing = users.find((u) => u.username.toLowerCase() === newUsername.trim().toLowerCase());
    if (existing) { Alert.alert('Username taken'); return; }
    const password = newPassword.trim() || gen4Digit();
    const user: AppUser = {
      id: uuid.v4() as string,
      username: newUsername.trim().toLowerCase(),
      password,
      displayName: newDisplayName.trim() || newUsername.trim(),
      role: 'user',
      canInvite: newCanInvite,
      createdAt: new Date().toISOString(),
    };
    await createUser(user);
    trackEvent('user_created');
    setUsers([...users, user]);
    Alert.alert('User Created!', `Username: ${user.username}\nPassword: ${password}`);
    setNewUsername(''); setNewPassword(gen4Digit()); setNewDisplayName(''); setNewCanInvite(false);
  };

  const handleDeleteUser = (user: AppUser) => {
    if (user.role === 'admin') return;
    Alert.alert('Delete User', `Delete ${user.displayName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteUser(user.id);
        setUsers(users.filter((u) => u.id !== user.id));
      }},
    ]);
  };

  const handleToggleInvitePermission = async (user: AppUser) => {
    const newVal = !user.canInvite;
    await updateUserPermissions(user.id, newVal);
    setUsers(users.map((u) => u.id === user.id ? { ...u, canInvite: newVal } : u));
  };

  const handleSendInvite = async () => {
    if (!inviteName.trim()) { Alert.alert('Name required'); return; }
    if (!invitePhone.trim()) { Alert.alert('Phone required'); return; }

    const username = inviteUsername.trim().toLowerCase() || inviteName.trim().toLowerCase().replace(/\s+/g, '');
    const password = gen4Digit();

    const existing = users.find((u) => u.username.toLowerCase() === username);
    if (existing) { Alert.alert('Username taken', `"${username}" already exists.`); return; }

    const user: AppUser = {
      id: uuid.v4() as string,
      username, password,
      displayName: inviteName.trim(),
      role: 'user',
      phone: invitePhone.trim(),
      canInvite: inviteCanInvite,
      createdAt: new Date().toISOString(),
    };
    await createUser(user);
    setUsers([...users, user]);

    const invite: Invite = {
      id: uuid.v4() as string,
      recipientName: inviteName.trim(),
      phone: invitePhone.trim(),
      username, password,
      sent: true,
      createdAt: new Date().toISOString(),
    };
    await saveInvite(invite);
    setInvites([...invites, invite]);
    trackEvent('invite_sent');

    // Send via SMS directly using sms: URL scheme
    const cleanPhone = invitePhone.trim().replace(/[^0-9+]/g, '');
    const message = `Hey ${inviteName.trim()}! You've been invited to BCA Archery OS. Open: ${APP_URL} | Username: ${username} | Password: ${password}`;
    const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;

    try {
      const supported = await Linking.canOpenURL(smsUrl);
      if (supported) {
        await Linking.openURL(smsUrl);
      } else {
        Alert.alert('SMS Not Available', `Account created!\n\nUsername: ${username}\nPassword: ${password}\n\nManually text this to ${inviteName.trim()} at ${invitePhone.trim()}.`);
      }
    } catch (e) {
      Alert.alert('Invite Created', `Username: ${username}\nPassword: ${password}\n\nText this to ${inviteName.trim()}.`);
    }

    setInviteName(''); setInvitePhone(''); setInviteUsername(''); setInviteCanInvite(false);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'USER MANAGEMENT', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
      <View style={styles.container}>
        <View style={styles.tabRow}>
          {([['users', 'Users', 'people'], ['create', 'Create', 'person-add'], ['invite', 'Invite', 'paper-plane']] as const).map(([key, label, icon]) => (
            <TouchableOpacity key={key} style={[styles.tab, tab === key && styles.tabActive]} onPress={() => setTab(key)}>
              <Ionicons name={icon as any} size={16} color={tab === key ? colors.primary : colors.textSecondary} />
              <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {tab === 'users' && (
            <>
              <Text style={styles.countText}>{users.length} users</Text>
              {users.map((user, i) => (
                <AnimatedEntry key={user.id} delay={i * 40}>
                  <GradientCard accentColors={user.role === 'admin' ? ['#FFB800', '#FF8C00', '#FF4444'] : undefined}>
                    <View style={styles.userRow}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.userNameRow}>
                          <Text style={styles.userName}>{user.displayName}</Text>
                          {user.role === 'admin' && <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>ADMIN</Text></View>}
                        </View>
                        <Text style={styles.userUsername}>@{user.username}</Text>
                        {user.phone && <Text style={styles.userMeta}>{user.phone}</Text>}
                        {user.lastLogin && <Text style={styles.userMeta}>Last login: {new Date(user.lastLogin).toLocaleDateString()}</Text>}
                      </View>
                      {user.role !== 'admin' && (
                        <View style={styles.userActions}>
                          <View style={styles.permRow}>
                            <Text style={styles.permLabel}>Can Invite</Text>
                            <Switch value={user.canInvite ?? false} onValueChange={() => handleToggleInvitePermission(user)}
                              trackColor={{ false: colors.surfaceLight, true: colors.primary + '50' }}
                              thumbColor={user.canInvite ? colors.primary : colors.textMuted} />
                          </View>
                          <TouchableOpacity onPress={() => handleDeleteUser(user)}>
                            <Ionicons name="trash" size={18} color={colors.danger} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </GradientCard>
                </AnimatedEntry>
              ))}
            </>
          )}

          {tab === 'create' && (
            <AnimatedEntry>
              <Text style={styles.formTitle}>CREATE NEW USER</Text>
              <Text style={styles.label}>DISPLAY NAME</Text>
              <TextInput style={styles.input} value={newDisplayName} onChangeText={setNewDisplayName}
                placeholder="e.g., John Smith" placeholderTextColor={colors.textMuted} />
              <Text style={styles.label}>USERNAME</Text>
              <TextInput style={styles.input} value={newUsername} onChangeText={setNewUsername}
                placeholder="e.g., johnsmith" placeholderTextColor={colors.textMuted} autoCapitalize="none" />
              <Text style={styles.label}>PASSWORD (4-digit)</Text>
              <View style={styles.passRow}>
                <TextInput style={[styles.input, { flex: 1, fontSize: fontSize.xl, textAlign: 'center', letterSpacing: 8 }]}
                  value={newPassword} onChangeText={setNewPassword} keyboardType="numeric" maxLength={4} />
                <TouchableOpacity style={styles.genBtn} onPress={() => setNewPassword(gen4Digit())}>
                  <Ionicons name="dice" size={18} color={colors.secondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.permToggle}>
                <Text style={styles.permToggleLabel}>Allow this user to invite others</Text>
                <Switch value={newCanInvite} onValueChange={setNewCanInvite}
                  trackColor={{ false: colors.surfaceLight, true: colors.primary + '50' }}
                  thumbColor={newCanInvite ? colors.primary : colors.textMuted} />
              </View>
              <TouchableOpacity style={styles.createBtn} onPress={handleCreateUser}>
                <LinearGradient colors={[...gradients.primaryToSecondary] as [string, string]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createBtnInner}>
                  <Ionicons name="person-add" size={18} color={colors.background} />
                  <Text style={styles.createBtnText}>CREATE USER</Text>
                </LinearGradient>
              </TouchableOpacity>
            </AnimatedEntry>
          )}

          {tab === 'invite' && (
            <>
              <AnimatedEntry>
                <Text style={styles.formTitle}>SEND INVITE VIA TEXT</Text>
                <Text style={styles.formSub}>Creates an account and opens a text message with their credentials. They click the link, log in, and they're in.</Text>

                <Text style={styles.label}>THEIR NAME</Text>
                <TextInput style={styles.input} value={inviteName} onChangeText={setInviteName}
                  placeholder="e.g., Mike Johnson" placeholderTextColor={colors.textMuted} />
                <Text style={styles.label}>PHONE NUMBER</Text>
                <TextInput style={styles.input} value={invitePhone} onChangeText={setInvitePhone}
                  placeholder="e.g., 225-555-1234" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />
                <Text style={styles.label}>USERNAME (optional)</Text>
                <TextInput style={styles.input} value={inviteUsername} onChangeText={setInviteUsername}
                  placeholder="Auto-generated from name" placeholderTextColor={colors.textMuted} autoCapitalize="none" />
                <Text style={styles.hint}>Password: auto-generated 4-digit PIN</Text>

                <View style={styles.permToggle}>
                  <Text style={styles.permToggleLabel}>Allow them to invite others</Text>
                  <Switch value={inviteCanInvite} onValueChange={setInviteCanInvite}
                    trackColor={{ false: colors.surfaceLight, true: colors.primary + '50' }}
                    thumbColor={inviteCanInvite ? colors.primary : colors.textMuted} />
                </View>

                <TouchableOpacity style={styles.createBtn} onPress={handleSendInvite}>
                  <LinearGradient colors={['#FFB800', '#FF8C00'] as [string, string]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createBtnInner}>
                    <Ionicons name="chatbubble" size={18} color={colors.background} />
                    <Text style={styles.createBtnText}>TEXT INVITE</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </AnimatedEntry>

              {invites.length > 0 && (
                <AnimatedEntry delay={60}>
                  <Text style={styles.sectionTitle}>SENT INVITES</Text>
                  {invites.map((inv) => (
                    <View key={inv.id} style={styles.inviteCard}>
                      <Text style={styles.inviteName}>{inv.recipientName}</Text>
                      <Text style={styles.inviteDetail}>@{inv.username} / {inv.phone} / PIN: {inv.password}</Text>
                      <Text style={styles.inviteDetail}>{new Date(inv.createdAt).toLocaleDateString()}</Text>
                    </View>
                  ))}
                </AnimatedEntry>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.md },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
  content: { padding: spacing.md, paddingBottom: spacing.xxl * 2 },
  countText: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.md },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  userName: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  userUsername: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600' },
  userMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  adminBadge: { backgroundColor: '#FFB80020', borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 1 },
  adminBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFB800', letterSpacing: 1 },
  userActions: { alignItems: 'flex-end', gap: spacing.sm },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  permLabel: { fontSize: fontSize.xs, color: colors.textSecondary },
  formTitle: { fontSize: fontSize.xl, fontWeight: '900', color: colors.text, marginBottom: spacing.xs },
  formSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 20 },
  label: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1, marginBottom: spacing.xs, marginTop: spacing.md },
  hint: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
  input: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, color: colors.text, fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border },
  passRow: { flexDirection: 'row', gap: spacing.sm },
  genBtn: { width: 48, height: 48, borderRadius: borderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  permToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginTop: spacing.md, borderWidth: 1, borderColor: colors.border },
  permToggleLabel: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },
  createBtn: { marginTop: spacing.lg, borderRadius: borderRadius.md, overflow: 'hidden' },
  createBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md },
  createBtnText: { fontSize: fontSize.sm, fontWeight: '800', color: colors.background, letterSpacing: 1 },
  sectionTitle: { fontSize: fontSize.xs, fontWeight: '800', color: colors.textSecondary, letterSpacing: 2, marginTop: spacing.xl, marginBottom: spacing.sm },
  inviteCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.xs },
  inviteName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  inviteDetail: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
});
