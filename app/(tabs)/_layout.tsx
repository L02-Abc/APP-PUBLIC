import { Tabs } from 'expo-router';
import { TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { headerTheme } from '../../styles/theme';

export default function TabLayout() {
  return (

    <Tabs
      screenOptions={{
        // --- CẤU HÌNH HEADER (Thanh tiêu đề phía trên) ---
        headerStyle: {
          backgroundColor: headerTheme.colors.primary, // Màu nền header
          shadowColor: 'transparent', // Tắt bóng đổ (tùy chọn)
          elevation: 0, // Tắt bóng đổ trên Android

        },

        // Icon thông báo bên phải Header
        headerRight: () => (


          <TouchableOpacity
            className="mr-5"
            onPress={() => router.push('/notification')} // Điều hướng khi bấm
          >
            <Ionicons name="notifications-outline" margin-right={15} size={24} color="#333" />
            {/* Chấm đỏ thông báo (giả lập) */}
            <View className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
          </TouchableOpacity>

        ),

        // --- CẤU HÌNH TAB BAR (Thanh menu phía dưới) ---
        tabBarActiveTintColor: '#2563EB', // Màu khi đang chọn (Blue-600)
        tabBarInactiveTintColor: '#94A3B8', // Màu khi không chọn (Slate-400)
        tabBarStyle: {
          height: 70,
          paddingBottom: 0,
          paddingTop: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500'
        }
      }}
    >
      {/* TAB 1: Trang chủ */}
      <Tabs.Screen
        name="index"

        options={{
          title: 'Trang chủ',
          headerTitle: 'Lofy',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* TAB 2: Đã lưu (Archived) - Dựa theo file của bạn */}
      <Tabs.Screen
        name="archived"
        options={{
          title: 'Đã lưu',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "bookmark" : "bookmark-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* TAB 3: Cài đặt (Settings) - Dựa theo file của bạn */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Cài đặt',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "settings" : "settings-outline"} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen name="create" options={{ href: null }} />
      <Tabs.Screen name="login" options={{ href: null }} />
      <Tabs.Screen name="claims" options={{ href: null }} />
      <Tabs.Screen name="_layout" options={{ href: null }} />
    </Tabs >

  );
}