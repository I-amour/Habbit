import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useHabitStore } from '../src/store/habitStore';
import { useCompletionStore } from '../src/store/completionStore';
import { useGamificationStore } from '../src/store/gamificationStore';
import { useSettingsStore } from '../src/store/settingsStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loadHabits = useHabitStore(s => s.loadHabits);
  const loadCompletions = useCompletionStore(s => s.loadTodayCompletions);
  const loadProfile = useGamificationStore(s => s.loadProfile);
  const loadBadges = useGamificationStore(s => s.loadBadges);
  const loadSettings = useSettingsStore(s => s.loadSettings);
  const hasCompletedOnboarding = useSettingsStore(s => s.hasCompletedOnboarding);
  const isSettingsLoading = useSettingsStore(s => s.isLoading);

  useEffect(() => {
    async function init() {
      await Promise.all([
        loadHabits(),
        loadCompletions(),
        loadProfile(),
        loadBadges(),
        loadSettings(),
      ]);
      await SplashScreen.hideAsync();
    }
    init();
  }, []);

  useEffect(() => {
    if (!isSettingsLoading && !hasCompletedOnboarding) {
      router.replace('/onboarding');
    }
  }, [isSettingsLoading, hasCompletedOnboarding]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="habit/create"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="habit/edit"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="habit/[id]"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
