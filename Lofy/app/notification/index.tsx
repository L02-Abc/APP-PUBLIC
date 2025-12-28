import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { Stack } from 'expo-router'
import { useNotificationStore } from '../../store/notiStore'
//import api from '../services/api'
import { Notification } from '../../schema/notification'
import { headerTheme } from 'styles/theme'


export default function Notifications() {
  const notifications = useNotificationStore(s => s.ListNotifications)
  const fetchNotifications = useNotificationStore(s => s.fetchNotifications);
  const markAsRead = useNotificationStore(s => s.markAsRead);
  const markAllAsRead = useNotificationStore(s => s.markAllAsRead);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Perform your data fetching or refresh logic here
    // For example, using a timeout to simulate an async operation:
    fetchNotifications();
    setTimeout(() => setIsRefreshing(false), 2000);
  }, []);

  useEffect(() => {
    fetchNotifications()
  }, [])

  const itemInNoti = ({ item }: { item: Notification }) => (
    <TouchableOpacity style={[styles.item, item.is_read ? styles.read : styles.unread]}
      onPress={() => markAsRead(item.id)}
    >
      <View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message} >{item.noti_message} </Text>
        <Text style={styles.time}>{item.time_created}</Text>
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
      />
    </View>

  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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