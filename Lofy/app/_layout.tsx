// app/_layout.tsx
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';


export default function RootLayout() {
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
            headerBackTitle: 'Quay lại',   // ← custom back button text
            //headerBackTitleVisible: true, // ← ensures the text shows (iOS only)

          }}
        />
        
        
        {/* Post, etc. if you want */}
        {/* <Stack.Screen name="post/index" options={{ title: 'Post' }} /> */}
        <Stack.Screen name="post/[postid]" options={{ title:  'Chi tiết bài viết',  headerBackTitle: 'Quay lại', }} 
         
        />
        <Stack.Screen name="create/create" options={{ title:  'Tạo bài đăng',  headerBackTitle: 'Quay lại', }} 
        />
      </Stack>
    </SafeAreaProvider>
  );
}
