import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import React from 'react'
import { useState, useEffect, useCallback, } from 'react'
import { Stack, router } from 'expo-router'
import { useNotificationStore } from '../../store/notiStore'
//import api from '../services/api'
import { Notification } from '../../schema/notification'
import { headerTheme } from 'styles/theme'
import { useFocusEffect } from "@react-navigation/native";

function convertTime(timeString: string): string {
  const date = new Date(timeString);
  return date.toLocaleString("vi-VN", { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function Notifications() {
  const notifications = useNotificationStore(s => s.ListNotifications)
  const fetchNotifications = useNotificationStore(s => s.fetchNotifications);
  const markAsRead = useNotificationStore(s => s.markAsRead);
  const [page, setPage] = useState(1);
  const markAllAsRead = useNotificationStore(s => s.markAllAsRead);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    setPage(1);
    fetchNotifications();
    setTimeout(() => setIsRefreshing(false), 2000);
  }, []);

  const calculateLink = (item: Notification) => {
    if (item.post_id) {
      return `/post/${item.post_id}`;
    }
    return false;
  }

  const loadData = async () => {
    const Limit = 10;
    if (isLoading) return;
    setIsLoading(true);
    await fetchNotifications(page + 1, Limit);
    setIsLoading(false);
    setPage(prevPage => prevPage + 1);
  }

  useFocusEffect(
    useCallback(() => {
      fetchNotifications()
    }, [])
  )


  const itemInNoti = ({ item }: { item: Notification }) => (
    <TouchableOpacity style={[styles.item, item.is_read ? styles.read : styles.unread]}
      onPress={() => {
        markAsRead(item.id);
        const link = calculateLink(item);
        if (link) {
          router.push(link);
        }
      }}
    >
      <View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message} >{item.noti_message} </Text>
        <Text style={styles.time}>{convertTime(item.time_created)}</Text>
      </View>
    </TouchableOpacity>
  )


  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: 'Thông báo',
          headerBackVisible: true,
          headerBackTitle: 'Quay lại',
          headerTintColor: '#333',
          headerStyle: { backgroundColor: headerTheme.colors.primary },
          headerTitleStyle: {
            fontFamily: "Inter-Bold",
            fontSize: 20,
            fontWeight: "700",
            color: "#111827",
          },

        }}
      />
      <FlatList
        data={notifications}
        renderItem={itemInNoti}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={() => <Text style={styles.empty}>No notifications found.</Text>}
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        onEndReached={() => loadData()}
        onEndReachedThreshold={0.5}
      />

      {isLoading && (
        <ActivityIndicator size="large" color="#0000ff" style={{ margin: 10 }} />
      )}
    </View>

  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  item: {
    margin: 10,
    marginTop: 0,
    borderRadius: 8,
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#bbb8b8ff',
  },
  unread: {
    backgroundColor: '#e6f7ff', // Highlight unread notifications
  },
  read: {
    backgroundColor: '#ffffff',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#555',
  },
  time: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    textAlign: 'right',
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#777'
  }
})