import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react'
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useUserStore from '../store/useUserStore';

type User = {
  username: string;
  email: string;
  phone_number?: string;
};



export default function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const alias = useUserStore(s => s.alias)
  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);

      // const res = await fetch(API_URL, {
      //   // If you use JWT:
      //   // headers: { Authorization: `Bearer ${token}` },
      // });
      const res: User = {username: alias, email: 'abc', phone_number: '123'};

      // if (!res.ok) {
      //   throw new Error(`HTTP ${res.status}`);
      // }

      // const json = (await res.json()) as User;
      //setUser(json);
      setUser(res);
    } catch (err: any) {
      console.log('fetchUser error:', err);
      setError(err.message ?? 'Failed to load user info');
    } finally {
      setLoading(false);
    }
  };

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

      <TouchableOpacity style={styles.card} activeOpacity={0.8}>
          <FontAwesome name="history"
          size={48}
          color="black"
          style={{ marginLeft: 20, marginRight: 12 }} />
          <View style={styles.cardContent}>
            <Text style={styles.userName}>Lịch sử hoạt động</Text>
            <Text style={styles.userInfo}>Xem lại các hoạt động gần đây</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => router.push('/auth/login')}>
          <Ionicons name="exit-outline"
          size={48}
          color="red"
          style={{ marginLeft: 20, marginRight: 12 }} />
          <View style={styles.cardContent}>
            <Text style={[styles.userName, {color: 'red'}]}>Log out</Text>
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