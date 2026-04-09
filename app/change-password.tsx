import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, borderRadius } from '../lib/theme';
import { getCurrentUser, changePassword } from '../lib/storage';
import AnimatedEntry from '../components/AnimatedEntry';
import { useScreenTracking } from '../lib/useAnalytics';
import { trackEvent } from '../lib/analytics';

export default function ChangePasswordScreen() {
  useScreenTracking('change-password');
  const router = useRouter();
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleChange = async () => {
    const user = await getCurrentUser();
    if (!user) { Alert.alert('Error', 'Not logged in.'); return; }
    if (!currentPass) { Alert.alert('Required', 'Enter your current password.'); return; }
    if (currentPass !== user.password) { Alert.alert('Wrong Password', 'Your current password is incorrect.'); return; }
    if (!newPass || newPass.length < 4) { Alert.alert('Too Short', 'New password must be at least 4 characters.'); return; }
    if (newPass !== confirmPass) { Alert.alert('Mismatch', 'New passwords do not match.'); return; }
    if (newPass === currentPass) { Alert.alert('Same Password', 'New password must be different from current.'); return; }

    const success = await changePassword(user.id, newPass);
    if (success) {
      trackEvent('password_changed');
      Alert.alert('Password Changed', 'Your password has been updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Error', 'Failed to change password.');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'CHANGE PASSWORD', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
      <View style={styles.container}>
        <View style={styles.inner}>
          <AnimatedEntry>
            <Ionicons name="lock-closed" size={48} color={colors.secondary} style={{ alignSelf: 'center', marginBottom: spacing.lg }} />
            <Text style={styles.title}>Change Your Password</Text>

            <Text style={styles.label}>CURRENT PASSWORD</Text>
            <View style={styles.inputWrap}>
              <TextInput style={styles.input} value={currentPass} onChangeText={setCurrentPass}
                secureTextEntry={!showCurrent} placeholder="Enter current password" placeholderTextColor={colors.textMuted} />
              <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeBtn}>
                <Ionicons name={showCurrent ? 'eye-off' : 'eye'} size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>NEW PASSWORD</Text>
            <View style={styles.inputWrap}>
              <TextInput style={styles.input} value={newPass} onChangeText={setNewPass}
                secureTextEntry={!showNew} placeholder="At least 4 characters" placeholderTextColor={colors.textMuted} />
              <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeBtn}>
                <Ionicons name={showNew ? 'eye-off' : 'eye'} size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>CONFIRM NEW PASSWORD</Text>
            <View style={styles.inputWrap}>
              <TextInput style={styles.input} value={confirmPass} onChangeText={setConfirmPass}
                secureTextEntry={!showNew} placeholder="Re-enter new password" placeholderTextColor={colors.textMuted} />
              {confirmPass.length > 0 && (
                <Ionicons name={confirmPass === newPass ? 'checkmark-circle' : 'close-circle'} size={18}
                  color={confirmPass === newPass ? colors.primary : colors.danger} style={{ marginRight: spacing.sm }} />
              )}
            </View>

            <TouchableOpacity style={styles.changeBtn} onPress={handleChange}>
              <LinearGradient colors={[...gradients.primaryToSecondary] as [string, string]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.changeBtnInner}>
                <Ionicons name="key" size={18} color={colors.background} />
                <Text style={styles.changeBtnText}>CHANGE PASSWORD</Text>
              </LinearGradient>
            </TouchableOpacity>
          </AnimatedEntry>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: spacing.xl },
  label: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1, marginBottom: spacing.xs, marginTop: spacing.md },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border },
  input: { flex: 1, padding: spacing.md, color: colors.text, fontSize: fontSize.md },
  eyeBtn: { padding: spacing.sm },
  changeBtn: { marginTop: spacing.xl, borderRadius: borderRadius.md, overflow: 'hidden' },
  changeBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md },
  changeBtnText: { fontSize: fontSize.md, fontWeight: '800', color: colors.background, letterSpacing: 2 },
});
