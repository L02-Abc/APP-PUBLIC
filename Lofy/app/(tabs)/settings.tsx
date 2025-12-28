import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native'

import React from 'react'
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import useUserStore from '../../store/useUserStore';
import * as SecureStore from 'expo-secure-store';
//import * as Sentry from '@sentry/react-native';
import api from '../services/api'
type User = {
  username: string;
  email: string;
  phone_number?: string;
};



export default function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const id = useUserStore(s => s.id)
  const { clearUser } = useUserStore.getState();
  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/user/infoById', { id: id }, {});
      const data: User = {
        username: res.alias,   // or res.username depending on your API
        email: res.email,
      };

      setUser(data);
    } catch (err: any) {
      console.log('fetchUser error:', err);
      setError(err.message ?? 'Failed to load user info');
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    await SecureStore.deleteItemAsync('auth_token');
    router.replace('/auth/login');
  }

  const handleLogOut = () => {

    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc là muốn đăng xuất không?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: () => {
            // perform logout logic here

            clearUser();
            logOut();
          }
        }
      ]

    )
  }

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <View style={styles.settingContainer}>

      <TouchableOpacity style={styles.cardUser}>
        <Ionicons name="person-circle-outline"
          size={60}
          color="black"
          style={{ marginLeft: 20, marginRight: 12 }} />
        <View style={styles.cardContent}>
          {loading && <ActivityIndicator size="small" />}
          {!loading && error && (
            <Text style={{ color: 'red', fontSize: 12 }}>
              {error}
            </Text>
          )}
          {!loading && !error && user && (
            <>
              <Text style={styles.userName}>{user.username}</Text>
              <Text style={styles.userInfo}>{user.email}</Text>
              {user.phone_number && (
                <Text style={styles.userInfo}>{user.phone_number}</Text>
              )}
            </>
          )}
          {!loading && !error && !user && (
            <Text style={styles.userInfo}>No user info</Text>
          )}

        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => router.push('/post/mypost')}>
        <FontAwesome name="history"
          size={48}
          color="black"
          style={{ marginLeft: 20, marginRight: 12 }} />
        <View style={styles.cardContent}>
          <Text style={styles.userName}>Lịch sử</Text>
          <Text style={styles.userInfo}>Xem lại các bài đăng của bạn gần đây</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={handleLogOut}>
        <Ionicons name="exit-outline"
          size={48}
          color="red"
          style={{ marginLeft: 20, marginRight: 12 }} />
        <View style={styles.cardContent}>
          <Text style={[styles.userName, { color: 'red' }]}>Log out</Text>
        </View>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  settingContainer: {
    flex: 1,
    //justifyContent: 'center',
    alignItems: 'center',
    //flexDirection: 'column',
  },
  cardUser: {

    width: '90%',
    height: 130,
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    justifyContent: 'center',
    flexDirection: 'row',      // 👈 icon + text row
    alignItems: 'center',
  },
  card: {
    width: '90%',
    height: 80,
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    justifyContent: 'center',
    flexDirection: 'row',      // 👈 icon + text row
    alignItems: 'center',
  },

  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  userInfo: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
})