import { Tabs } from 'expo-router';
import { View, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react'
import * as SecureStore from 'expo-secure-store';
import { headerTheme } from '../../styles/theme';

export default function TabLayout() {
  useEffect(() => {
    SecureStore.getItemAsync('auth_token').then(token => {
      if (!token) {
        router.replace('/auth/login');
      }
    });
  }, []);


  return (

    <Tabs
      screenOptions={{
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 20,
          fontStyle: 'normal'
        },
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: headerTheme.colors.primary,
          shadowColor: 'transparent',
          elevation: 0,
        },

        // Icon thông báo bên phải Header
        headerRight: () => (
          <Pressable
            onPress={() => router.push('/notification')}
            // 1. Give the button a fixed size and roundness for the ripple to look good
            className="mr-4 w-10 h-10 items-center justify-center rounded-full"
            // 2. Native Android Ripple Effect (Key for "Professional" feel)
            android_ripple={{ color: 'rgba(0, 0, 0, 0.1)', borderless: true }}
            // 3. Increase touch area for easier tapping
            hitSlop={8}
          >
            <View className="relative">
              <Ionicons name="notifications-outline" size={26} color="#333" />


              <View
                className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
                style={{ transform: [{ translateX: 3 }, { translateY: -3 }] }}
              />
            </View>
          </Pressable>
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
          headerTitle: () => (
            <Image
              source={require('../../assets/headerStyle.png')} // ⚠️ Check your path
              style={{ width: 120, height: 40 }} // Adjust size to fit
              resizeMode="contain" // Keeps aspect ratio intact
            />
          ),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="archived"
        options={{
          title: 'Đã lưu',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "bookmark" : "bookmark-outline"} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Cài đặt',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "settings" : "settings-outline"} size={24} color={color} />
          ),
        }}
      />

    </Tabs >

  );
}