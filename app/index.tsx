import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { jwtDecode } from "jwt-decode";
import useUserStore from '../store/useUserStore';
import api from './services/api';
import Constants from 'expo-constants'; // Useful for simulator checks

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
        // Safety wrap for jwtDecode
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
      // Optional: Skip if on iOS Simulator
      const isDevice = Constants.isDevice; // requires expo-constants
      // or simple try-catch

      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      // Ensure project ID is handled if using EAS, otherwise standard call
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;

      console.log("Expo Push Token:", token);

      await api.post('/user/device-token', { device_push_token: token }, {});
      console.log("Push device token registered");
    } catch (err) {
      // Don't block login if notifications fail
      console.log("Error registering push token (likely simulator or permission):", err);
    }
  }

  // Helper: Fetch User Data
  const fetchUserData = async () => {
    try {
      const { initFollowedThread, clearUser, setAlias, setID } = useUserStore.getState();

      const res = await api.get('/user/me');
      const userData = res.data ? res.data : res;

      clearUser();

      // Safety check if followed_threads exists
      if (userData.followed_threads) {
        const threadIds = userData.followed_threads.map((item: any) => item.thread_id);
        initFollowedThread(threadIds);
      }

      // FIX: Use userData, not res
      setAlias(userData['alias']);
      setID(userData['id']);
      console.log("User loaded:", userData['id']);
      return true;
    } catch (err) {
      console.error("Error fetching user details:", err);
      return false;
    }
  }

  useEffect(() => {
    const bootstrapAsync = async () => {
      // 1. Check Token
      const token = await getTokenSecureStorage('auth_token');

      if (token) {
        console.log("Token valid, fetching user data...");
        // 2. Token exists? Fetch user data *BEFORE* redirecting
        const userLoaded = await fetchUserData();

        if (userLoaded) {
          // 3. Register token in background (don't await this if you want speed, or await if strict)
          registerPushToken();
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