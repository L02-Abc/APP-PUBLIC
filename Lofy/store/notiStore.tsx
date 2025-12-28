import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../app/services/api';
import { NotificationListSchema, Notification } from '../schema/notification';



interface NotificationState {
    ListNotifications: Notification[];
    unreadCount: number;
    setNotifications: (items: Notification[]) => void;
    markAsRead: (id: number) => void;
    markAllAsRead: () => void;
    fetchNotifications: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set, get) => ({
            ListNotifications: [],
            unreadCount: 0,

            setNotifications: (items) =>
                set({
                    ListNotifications: items,
                    unreadCount: items.filter((n) => !n.is_read).length,
                }),

            fetchNotifications: async () => {
                try {
                    // 1. Fetch data from the API
                    const res = await api.get('/others/notifications/list-notifications');
                    console.log(res)
                    // 2. Validate and parse the response data using Zod
                    // Use .parse() if res.data is the JSON object, or .parseAsync() if res is a Promise
                    const validatedData = NotificationListSchema.parse(res);
                    // 3. Update the store state using the validated data
                    get().setNotifications(validatedData);

                } catch (error) {
                    console.error("Failed to fetch and validate notifications:", error);
                    // Handle error state if necessary
                }
            },

            markAsRead: (id) => set((state) => {
                const updatedList = state.ListNotifications.map((n) =>
                    n.id === id ? { ...n, is_read: true } : n
                );
                return {
                    notifications: updatedList,
                    unreadCount: updatedList.filter(n => !n.is_read).length
                };
            }),

            markAllAsRead: () => set((state) => {
                const updatedList = state.ListNotifications.map((n) => ({ ...n, is_read: true }));
                return {
                    notifications: updatedList,
                    unreadCount: 0
                };
            }),
        }),
        {
            name: 'notification-storage', // Tên key trong AsyncStorage
            storage: createJSONStorage(() => AsyncStorage), // Cấu hình dùng AsyncStorage
        }
    )
);