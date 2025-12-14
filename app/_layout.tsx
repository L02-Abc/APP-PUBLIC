// app/_layout.tsx
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://a128db18d525782ca69e9028b63dcc83@o4510502731579392.ingest.de.sentry.io/4510502733217872',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});


export default Sentry.wrap(function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack>
        {/* Auth flow */}
        <Stack.Screen name="auth" options={{ headerShown: false }} />

        {/* Tabs (no header, you control header there) */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Notification: has its own header + BACK automatically */}
        <Stack.Screen
          name="notification/index"
          options={{
            title: 'Thông báo',
            headerShown: true,
            headerBackTitle: 'Quay lại',
          }}
        />

        <Stack.Screen name="post/[postid]" options={{ title: 'Chi tiết bài viết', headerBackTitle: 'Quay lại', }}

        />
        <Stack.Screen name="create/create" options={{ title: 'Tạo bài đăng', headerBackTitle: 'Quay lại', }}
        />
      </Stack>
    </SafeAreaProvider>
  );
});