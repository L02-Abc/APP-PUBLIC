import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';

import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications'
import { jwtDecode } from "jwt-decode";
import useUserStore from './store/useUserStore';
import api from './services/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    // --- ADD THESE TWO PROPERTIES ---
    shouldShowBanner: true, // Typically set to true if you want the standard notification banner
    shouldShowList: true,   // Typically set to true if you want it to appear in the notification center/list
  }),
});

async function getExpoPushToken() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log("Expo Push Token:", token);
  return token;
}


export default function StartPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const storeTokenSecureStorage = async (key: any, value: any) => {
    await SecureStore.setItemAsync(key, value);
  }

  const getTokenSecureStorage = async (key: any) => {
    let result = await SecureStore.getItemAsync(key);
    if (result) {
      const decoded: any = jwtDecode(result)
      const exp = decoded.exp * 1000; //giay
      if (Date.now() >= exp) {
        await SecureStore.deleteItemAsync(key);
        return null;
      }

      return result;
    }

    return null;
  }

  useEffect(() => {
    const checkToken = async () => {
      const token = await getTokenSecureStorage('auth_token'); // chờ kết quả
      try {
        if (token) {
          console.log("Token valid:", token)
          setIsLoggedIn(true);
        }
      } catch {
        setIsLoading(false);
      }
      setIsLoading(false);
    };

    checkToken();
  }, []);

  // 1. Đang check thẻ -> Hiện loading
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 2. Có thẻ -> Mời vào khu nội bộ (Tabs)
  if (isLoggedIn) {
    const { initFollowedThread, clearUser, setAlias, setID } = useUserStore.getState();

    const fetchUser = async () => {
      try {
        const res = await api.get('/user/me');
        const userData = res.data ? res.data : res;
        clearUser();
        const threadIds = userData.followed_threads.map((item: any) => item.thread_id);
        initFollowedThread(threadIds);
        setAlias(res['alias']);
        setID(res['id']);
        console.log(res['id']);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    const registerTokenWithBackend = async () => {
      try {
        const token = await getExpoPushToken();
        //const email = await getTokenSecureStorage('user_email'); //Cos the sua lai api khong can email
        const res = await api.post('/user/device-token', { device_push_token: token }, {})
        if (res.ok) {
          console.log("Push device token success")
        }
        else {
          console.log(res);
        }
      } catch (err) {
        console.log("Error!", err)
      }
    }

    fetchUser();
    registerTokenWithBackend();
    return <Redirect href="/(tabs)" />;
  }

  // 3. Không có thẻ -> Mời ra khu đăng ký (Auth)
  return <Redirect href="/auth/login" />;
}