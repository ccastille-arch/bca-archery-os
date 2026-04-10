import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../lib/theme';
import { trackAppOpen } from '../lib/analytics';
import { seedAdminAccount } from '../lib/storage';

export default function RootLayout() {
  useEffect(() => {
    seedAdminAccount();
    trackAppOpen();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700', letterSpacing: 2 },
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 85,
            paddingBottom: 20,
            paddingTop: 8,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarLabelStyle: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
        }}
      >
        <Tabs.Screen name="index" options={{
          title: 'Home', headerTitle: 'BCA ARCHERY OS',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} />,
        }} />
        <Tabs.Screen name="shots" options={{
          title: 'Shots', headerTitle: 'SHOT LOG',
          tabBarIcon: ({ color, size }) => <Ionicons name="locate" size={size} color={color} />,
        }} />
        <Tabs.Screen name="gear" options={{
          title: 'Gear', headerTitle: 'GEAR',
          tabBarIcon: ({ color, size }) => <Ionicons name="fitness" size={size} color={color} />,
        }} />
        <Tabs.Screen name="practices" options={{
          title: 'Practice', headerTitle: 'PRACTICE LOG',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }} />
        <Tabs.Screen name="expenses" options={{
          title: 'Expenses', headerTitle: 'EXPENSE TRACKER',
          tabBarIcon: ({ color, size }) => <Ionicons name="cash" size={size} color={color} />,
        }} />
        {/* Hidden screens */}
        <Tabs.Screen name="login" options={{ href: null }} />
        <Tabs.Screen name="sights" options={{ href: null }} />
        <Tabs.Screen name="sessions" options={{ href: null }} />
        <Tabs.Screen name="shot-detail" options={{ href: null }} />
        <Tabs.Screen name="analytics" options={{ href: null }} />
        <Tabs.Screen name="session-detail" options={{ href: null }} />
        <Tabs.Screen name="sight-detail" options={{ href: null }} />
        <Tabs.Screen name="bow-detail" options={{ href: null }} />
        <Tabs.Screen name="arrow-detail" options={{ href: null }} />
        <Tabs.Screen name="stabilizer-test" options={{ href: null }} />
        <Tabs.Screen name="tune-detail" options={{ href: null }} />
        <Tabs.Screen name="tournaments" options={{ href: null }} />
        <Tabs.Screen name="tournament-detail" options={{ href: null }} />
        <Tabs.Screen name="auth" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="forum" options={{ href: null }} />
        <Tabs.Screen name="forum-post" options={{ href: null }} />
        <Tabs.Screen name="forum-new" options={{ href: null }} />
        <Tabs.Screen name="experts" options={{ href: null }} />
        <Tabs.Screen name="expert-profile" options={{ href: null }} />
        <Tabs.Screen name="expert-dashboard" options={{ href: null }} />
        <Tabs.Screen name="booking" options={{ href: null }} />
        <Tabs.Screen name="target-map" options={{ href: null }} />
        <Tabs.Screen name="ballistics" options={{ href: null }} />
        <Tabs.Screen name="practice-detail" options={{ href: null }} />
        <Tabs.Screen name="expense-detail" options={{ href: null }} />
        <Tabs.Screen name="rounds" options={{ href: null }} />
        <Tabs.Screen name="score-round" options={{ href: null }} />
        <Tabs.Screen name="score-live" options={{ href: null }} />
        <Tabs.Screen name="targets-3d" options={{ href: null }} />
        <Tabs.Screen name="admin" options={{ href: null }} />
        <Tabs.Screen name="feedback" options={{ href: null }} />
        <Tabs.Screen name="swap-shop" options={{ href: null }} />
        <Tabs.Screen name="swap-listing" options={{ href: null }} />
        <Tabs.Screen name="customize" options={{ href: null }} />
        <Tabs.Screen name="expert-apply" options={{ href: null }} />
        <Tabs.Screen name="user-management" options={{ href: null }} />
        <Tabs.Screen name="change-password" options={{ href: null }} />
        <Tabs.Screen name="changelog" options={{ href: null }} />
      </Tabs>
    </>
  );
}
