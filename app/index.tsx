import { Redirect, router } from 'expo-router';
import { View, ActivityIndicator, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications';
import { jwtDecode } from "jwt-decode";
import useUserStore from '../store/useUserStore';
import api from './services/api';
import Constants from 'expo-constants';
import * as Sentry from "@sentry/react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function StartPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Helper: Get Token safely
  const getTokenSecureStorage = async (key: any) => {
    try {
      let result = await SecureStore.getItemAsync(key);
      if (result) {
        try {
          const decoded: any = jwtDecode(result);
          const exp = decoded.exp * 1000;
          if (Date.now() >= exp) {
            await SecureStore.deleteItemAsync(key);
            return null;
          }
          return result;
        } catch (e) {
          console.log("Token corrupted, deleting...");
          await SecureStore.deleteItemAsync(key);
          return null;
        }
      }
      return null;
    } catch (e) {
      console.log("Secure store error", e);
      return null;
    }
  }

  // Helper: Get Push Token
  const registerPushToken = async () => {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Permission not granted for push notifications');
        return;
      }
      const projectId =
        Constants.easConfig?.projectId ??
        Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.error("❌ Project ID missing. Check app.json or eas.json");
        return;
      }

      //Get the Token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      console.log("✅ Push Token:", tokenData.data);

      await api.post('/user/device-token', {
        device_push_token: tokenData.data,
      }, {});

    } catch (err) {
      console.error("❌ Push token error:", err);
    }
  };


  const fetchUserData = async () => {
    try {
      const { initFollowedThread, clearUser, setAlias, setID, setRole } = useUserStore.getState();

      const res = await api.get('/user/me');
      const userData = res.data ? res.data : res;

      clearUser();

      if (userData.followed_threads) {
        const threadIds = userData.followed_threads.map((item: any) => item.thread_id);
        initFollowedThread(threadIds);
      }
      setAlias(userData['alias']);
      setID(userData['id']);
      setRole(userData['role']);
      console.log("User loaded:", userData['id']);
      Sentry.setUser({
        id: userData['id'].toString(),
        username: userData['alias'].toString(),
        segment: userData['role'].toString() // 'admin' or 'student' - useful for filtering!
      });
      return true;
    } catch (err) {
      console.error("Error fetching user details:", err);
      return false;
    }
  }

  useEffect(() => {
    const bootstrapAsync = async () => {
      const hasSeenWelcome = await AsyncStorage.getItem('hasSeenWelcome');
      const token = await getTokenSecureStorage('auth_token');

      if (!hasSeenWelcome || hasSeenWelcome == 'false') {
        router.replace('/auth/welcome');
        return;
      }

      if (token) {
        console.log("Token valid, fetching user data...");
        const userLoaded = await fetchUserData();

        if (userLoaded) {
          await registerPushToken();
          setIsLoggedIn(true);
        } else {
          // Token was valid but API failed? Maybe token expired on server.
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }

      // 4. Finally stop loading
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  // --- RENDERING ---

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isLoggedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/auth/login" />;
}