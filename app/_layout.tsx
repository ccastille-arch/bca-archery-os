import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../lib/theme';

export default function RootLayout() {
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
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerTitle: 'BCA ARCHERY OS',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="grid" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="shots"
          options={{
            title: 'Shots',
            headerTitle: 'SHOT LOG',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="locate" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="gear"
          options={{
            title: 'Gear',
            headerTitle: 'GEAR',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="fitness" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="sights"
          options={{
            title: 'Sights',
            headerTitle: 'SIGHT BUILDER',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="build" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="sessions"
          options={{
            title: 'Sessions',
            headerTitle: 'SESSIONS',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="timer" size={size} color={color} />
            ),
          }}
        />
        {/* Hidden detail screens */}
        <Tabs.Screen name="shot-detail" options={{ href: null }} />
        <Tabs.Screen name="analytics" options={{ href: null }} />
        <Tabs.Screen name="session-detail" options={{ href: null }} />
        <Tabs.Screen name="sight-detail" options={{ href: null }} />
        <Tabs.Screen name="bow-detail" options={{ href: null }} />
        <Tabs.Screen name="arrow-detail" options={{ href: null }} />
      </Tabs>
    </>
  );
}
