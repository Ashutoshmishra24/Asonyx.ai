import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PlanProvider } from '../contexts/plan-context';
import { AuthProvider } from '../contexts/auth-context';

export default function RootLayout() {
  return (
    <AuthProvider>
      <PlanProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="builder" options={{ presentation: 'card' }} />
          <Stack.Screen name="checkout" options={{ presentation: 'card' }} />
        </Stack>
      </PlanProvider>
    </AuthProvider>
  );
}
