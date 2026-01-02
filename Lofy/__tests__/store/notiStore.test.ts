import { useNotificationStore } from '../../store/notiStore';
import * as SecureStore from 'expo-secure-store';

// Helper to access Zustand store directly
function getStore() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (useNotificationStore as any).getState();
}

describe('useNotificationStore', () => {
  beforeEach(() => {
    // reset state
    const store = getStore();
    store.setNotifications([]);
  });

  it('sets notifications and calculates unreadCount', () => {
    const store = getStore();
    store.setNotifications([
      { id: 1, title: 'A', noti_message: 'm', time_created: new Date().toISOString(), is_read: false, link_to_newpost: null, user: { alias: 'x' } },
      { id: 2, title: 'B', noti_message: 'm', time_created: new Date().toISOString(), is_read: true, link_to_newpost: null, user: { alias: 'y' } },
    ]);
    const s = getStore();
    expect(s.unreadCount).toBe(1);
    expect(s.ListNotifications.length).toBe(2);
  });

  it('markAsRead updates list and unreadCount', () => {
    const store = getStore();
    store.setNotifications([
      { id: 1, title: 'A', noti_message: 'm', time_created: new Date().toISOString(), is_read: false, link_to_newpost: null, user: { alias: 'x' } },
      { id: 2, title: 'B', noti_message: 'm', time_created: new Date().toISOString(), is_read: false, link_to_newpost: null, user: { alias: 'y' } },
    ]);
    store.markAsRead(1);
    const s = getStore();
    expect(s.unreadCount).toBe(1);
    expect(s.ListNotifications.find(n => n.id === 1)?.is_read).toBe(true);
  });

  it('markAllAsRead sets unreadCount to 0', () => {
    const store = getStore();
    store.setNotifications([
      { id: 1, title: 'A', noti_message: 'm', time_created: new Date().toISOString(), is_read: false, link_to_newpost: null, user: { alias: 'x' } },
      { id: 2, title: 'B', noti_message: 'm', time_created: new Date().toISOString(), is_read: false, link_to_newpost: null, user: { alias: 'y' } },
    ]);
    store.markAllAsRead();
    const s = getStore();
    expect(s.unreadCount).toBe(0);
    expect(s.ListNotifications.every(n => n.is_read)).toBe(true);
  });

  it('fetchNotifications parses and sets store from API', async () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:8000';
    jest.spyOn(SecureStore, 'getItemAsync').mockResolvedValue(null);
    const store = getStore();

    // Mock global.fetch
    const data = [
      { id: 1, title: 'A', noti_message: 'm', time_created: new Date().toISOString(), is_read: false, link_to_newpost: null, user: { alias: 'x' } },
    ];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(data),
    });

    await store.fetchNotifications();
    const s = getStore();
    expect(s.ListNotifications.length).toBe(1);
    expect(s.unreadCount).toBe(1);
  });

  it('fetchNotifications ignores invalid schema data and leaves state unchanged', async () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:8000';
    jest.spyOn(SecureStore, 'getItemAsync').mockResolvedValue(null);
    const store = getStore();
    // Pre-populate with valid state
    store.setNotifications([
      { id: 10, title: 'Prev', noti_message: 'ok', time_created: new Date().toISOString(), is_read: false, link_to_newpost: null, user: { alias: 'z' } },
    ]);

    // Invalid payload: missing required 'is_read' and wrong type for 'user'
    const badData = [
      { id: 3, title: 'Bad', noti_message: 'x', time_created: new Date().toISOString(), link_to_newpost: null, user: 'alias-string' },
    ];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(badData),
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await store.fetchNotifications();
    const s = getStore();
    expect(s.ListNotifications.length).toBe(1);
    expect(s.ListNotifications[0].id).toBe(10);
    expect(s.unreadCount).toBe(1);
    consoleSpy.mockRestore();
  });

  it('fetchNotifications handles network errors gracefully and leaves state unchanged', async () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:8000';
    jest.spyOn(SecureStore, 'getItemAsync').mockResolvedValue(null);
    const store = getStore();
    store.setNotifications([
      { id: 20, title: 'Prev2', noti_message: 'ok', time_created: new Date().toISOString(), is_read: true, link_to_newpost: null, user: { alias: 'k' } },
    ]);

    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await store.fetchNotifications();
    const s = getStore();
    expect(s.ListNotifications.length).toBe(1);
    expect(s.ListNotifications[0].id).toBe(20);
    expect(s.unreadCount).toBe(0);
    consoleSpy.mockRestore();
  });
});
