import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, Share,
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import uuid from 'react-native-uuid';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { getAllUsers, createUser, deleteUser, getInvites, saveInvite } from '../lib/storage';
import AnimatedEntry from '../components/AnimatedEntry';
import GradientCard from '../components/GradientCard';
import { useScreenTracking } from '../lib/useAnalytics';
import { trackEvent } from '../lib/analytics';
import type { AppUser, Invite } from '../lib/types';

const APP_URL = 'https://bca-archery-os.vercel.app';

export default function UserManagementScreen() {
  useScreenTracking('user-management');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [tab, setTab] = useState<'users' | 'create' | 'invite'>('users');

  // Create user form
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');

  // Invite form
  const [inviteName, setInviteName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [invitePassword, setInvitePassword] = useState('');

  useFocusEffect(useCallback(() => {
    getAllUsers().then(setUsers);
    getInvites().then(setInvites);
  }, []));

  const handleCreateUser = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      Alert.alert('Required', 'Username and password are required.'); return;
    }
    const existing = users.find((u) => u.username.toLowerCase() === newUsername.trim().toLowerCase());
    if (existing) { Alert.alert('Username taken', 'That username already exists.'); return; }

    const user: AppUser = {
      id: uuid.v4() as string,
      username: newUsername.trim().toLowerCase(),
      password: newPassword.trim(),
      displayName: newDisplayName.trim() || newUsername.trim(),
      role: 'user',
      createdAt: new Date().toISOString(),
    };
    await createUser(user);
    trackEvent('user_created', { username: user.username });
    setUsers([...users, user]);
    setNewUsername(''); setNewPassword(''); setNewDisplayName('');
    Alert.alert('User Created!', `Username: ${user.username}\nPassword: ${newPassword.trim()}\n\nShare these credentials with the user.`);
  };

  const handleDeleteUser = (user: AppUser) => {
    if (user.role === 'admin') { Alert.alert("Can't delete admin"); return; }
    Alert.alert('Delete User', `Delete ${user.displayName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteUser(user.id);
        setUsers(users.filter((u) => u.id !== user.id));
      }},
    ]);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let pass = '';
    for (let i = 0; i < 8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    return pass;
  };

  const handleSendInvite = async () => {
    if (!inviteName.trim()) { Alert.alert('Name required'); return; }
    if (!invitePhone.trim()) { Alert.alert('Phone required'); return; }

    const username = inviteUsername.trim().toLowerCase() || inviteName.trim().toLowerCase().replace(/\s+/g, '');
    const password = invitePassword.trim() || generatePassword();

    // Create the user account
    const existing = users.find((u) => u.username.toLowerCase() === username);
    if (existing) { Alert.alert('Username taken', `"${username}" already exists. Choose a different username.`); return; }

    const user: AppUser = {
      id: uuid.v4() as string,
      username,
      password,
      displayName: inviteName.trim(),
      role: 'user',
      phone: invitePhone.trim(),
      createdAt: new Date().toISOString(),
    };
    await createUser(user);
    setUsers([...users, user]);

    const invite: Invite = {
      id: uuid.v4() as string,
      recipientName: inviteName.trim(),
      phone: invitePhone.trim(),
      username,
      password,
      sent: false,
      createdAt: new Date().toISOString(),
    };
    await saveInvite(invite);
    setInvites([...invites, invite]);
    trackEvent('invite_created', { recipientName: invite.recipientName });

    // Generate share message
    const message = `Hey ${inviteName.trim()}! You've been invited to BCA Archery OS — the ultimate archery performance app.\n\nOpen the app: ${APP_URL}\n\nYour login:\nUsername: ${username}\nPassword: ${password}\n\nSee you on the range! 🎯`;

    try {
      await Share.share({ message, title: 'BCA Archery OS Invite' });
      const updated = { ...invite, sent: true };
      await saveInvite(updated);
      setInvites(invites.map((i) => i.id === invite.id ? updated : i));
    } catch (e) {
      // User cancelled share, still show the message
      Alert.alert('Invite Ready', `Account created!\n\nUsername: ${username}\nPassword: ${password}\n\nCopy and send to ${inviteName.trim()} manually.`);
    }

    setInviteName(''); setInvitePhone(''); setInviteUsername(''); setInvitePassword('');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'USER MANAGEMENT', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
      <View style={styles.container}>
        {/* Tabs */}
        <View style={styles.tabRow}>
          {([['users', 'Users', 'people'], ['create', 'Create', 'person-add'], ['invite', 'Invite', 'paper-plane']] as const).map(([key, label, icon]) => (
            <TouchableOpacity key={key} style={[styles.tab, tab === key && styles.tabActive]} onPress={() => setTab(key)}>
              <Ionicons name={icon as any} size={16} color={tab === key ? colors.primary : colors.textSecondary} />
              <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* USERS LIST */}
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
                          {user.role === 'admin' && (
                            <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>ADMIN</Text></View>
                          )}
                        </View>
                        <Text style={styles.userUsername}>@{user.username}</Text>
                        {user.lastLogin && <Text style={styles.userMeta}>Last login: {new Date(user.lastLogin).toLocaleDateString()}</Text>}
                        <Text style={styles.userMeta}>Created: {new Date(user.createdAt).toLocaleDateString()}</Text>
                      </View>
                      {user.role !== 'admin' && (
                        <TouchableOpacity onPress={() => handleDeleteUser(user)}>
                          <Ionicons name="trash" size={18} color={colors.danger} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </GradientCard>
                </AnimatedEntry>
              ))}
            </>
          )}

          {/* CREATE USER */}
          {tab === 'create' && (
            <AnimatedEntry>
              <Text style={styles.formTitle}>CREATE NEW USER</Text>
              <Text style={styles.label}>DISPLAY NAME</Text>
              <TextInput style={styles.input} value={newDisplayName} onChangeText={setNewDisplayName}
                placeholder="e.g., John Smith" placeholderTextColor={colors.textMuted} />
              <Text style={styles.label}>USERNAME</Text>
              <TextInput style={styles.input} value={newUsername} onChangeText={setNewUsername}
                placeholder="e.g., johnsmith" placeholderTextColor={colors.textMuted} autoCapitalize="none" />
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.passRow}>
                <TextInput style={[styles.input, { flex: 1 }]} value={newPassword} onChangeText={setNewPassword}
                  placeholder="Password" placeholderTextColor={colors.textMuted} />
                <TouchableOpacity style={styles.genBtn} onPress={() => setNewPassword(generatePassword())}>
                  <Ionicons name="dice" size={18} color={colors.secondary} />
                </TouchableOpacity>
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

          {/* INVITE */}
          {tab === 'invite' && (
            <>
              <AnimatedEntry>
                <Text style={styles.formTitle}>SEND INVITE</Text>
                <Text style={styles.formSub}>Enter their info, hit send — the app creates their account and opens your phone's share menu so you can text them the link + credentials.</Text>

                <Text style={styles.label}>THEIR NAME</Text>
                <TextInput style={styles.input} value={inviteName} onChangeText={setInviteName}
                  placeholder="e.g., Mike Johnson" placeholderTextColor={colors.textMuted} />

                <Text style={styles.label}>PHONE NUMBER</Text>
                <TextInput style={styles.input} value={invitePhone} onChangeText={setInvitePhone}
                  placeholder="e.g., 225-555-1234" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />

                <Text style={styles.label}>USERNAME (optional — auto-generated from name)</Text>
                <TextInput style={styles.input} value={inviteUsername} onChangeText={setInviteUsername}
                  placeholder="Leave blank for auto" placeholderTextColor={colors.textMuted} autoCapitalize="none" />

                <Text style={styles.label}>PASSWORD (optional — auto-generated)</Text>
                <View style={styles.passRow}>
                  <TextInput style={[styles.input, { flex: 1 }]} value={invitePassword} onChangeText={setInvitePassword}
                    placeholder="Leave blank for auto" placeholderTextColor={colors.textMuted} />
                  <TouchableOpacity style={styles.genBtn} onPress={() => setInvitePassword(generatePassword())}>
                    <Ionicons name="dice" size={18} color={colors.secondary} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.createBtn} onPress={handleSendInvite}>
                  <LinearGradient colors={['#FFB800', '#FF8C00'] as [string, string]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createBtnInner}>
                    <Ionicons name="paper-plane" size={18} color={colors.background} />
                    <Text style={styles.createBtnText}>CREATE ACCOUNT & SHARE INVITE</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </AnimatedEntry>

              {/* Invite history */}
              {invites.length > 0 && (
                <AnimatedEntry delay={60}>
                  <Text style={styles.sectionTitle}>INVITE HISTORY</Text>
                  {invites.map((inv) => (
                    <View key={inv.id} style={styles.inviteCard}>
                      <View style={styles.inviteRow}>
                        <Text style={styles.inviteName}>{inv.recipientName}</Text>
                        <View style={[styles.sentBadge, { backgroundColor: inv.sent ? colors.primary + '20' : colors.warning + '20' }]}>
                          <Text style={[styles.sentText, { color: inv.sent ? colors.primary : colors.warning }]}>
                            {inv.sent ? 'Sent' : 'Pending'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.inviteDetail}>@{inv.username} / {inv.phone}</Text>
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
  formTitle: { fontSize: fontSize.xl, fontWeight: '900', color: colors.text, marginBottom: spacing.xs },
  formSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 20 },
  label: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, color: colors.text, fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border },
  passRow: { flexDirection: 'row', gap: spacing.sm },
  genBtn: { width: 48, height: 48, borderRadius: borderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  createBtn: { marginTop: spacing.xl, borderRadius: borderRadius.md, overflow: 'hidden' },
  createBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md },
  createBtnText: { fontSize: fontSize.sm, fontWeight: '800', color: colors.background, letterSpacing: 1 },
  sectionTitle: { fontSize: fontSize.xs, fontWeight: '800', color: colors.textSecondary, letterSpacing: 2, marginTop: spacing.xl, marginBottom: spacing.sm },
  inviteCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.xs },
  inviteRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inviteName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  sentBadge: { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  sentText: { fontSize: fontSize.xs, fontWeight: '700' },
  inviteDetail: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
});
