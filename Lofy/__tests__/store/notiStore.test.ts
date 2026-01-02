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

  it('fetchNotifications handles network errors without changing state', async () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:8000';
    jest.spyOn(SecureStore, 'getItemAsync').mockResolvedValue(null);
    const store = getStore();
    // seed initial state
    store.setNotifications([
      { id: 1, title: 'A', noti_message: 'm', time_created: new Date().toISOString(), is_read: false, link_to_newpost: null, user: { alias: 'x' } },
      { id: 2, title: 'B', noti_message: 'm', time_created: new Date().toISOString(), is_read: true, link_to_newpost: null, user: { alias: 'y' } },
    ]);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network oops'));

    await store.fetchNotifications();

    const s = getStore();
    expect(s.ListNotifications.length).toBe(2);
    expect(s.unreadCount).toBe(1);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('fetchNotifications logs and keeps state on invalid schema', async () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:8000';
    jest.spyOn(SecureStore, 'getItemAsync').mockResolvedValue(null);
    const store = getStore();
    // seed initial state
    store.setNotifications([
      { id: 3, title: 'C', noti_message: 'm', time_created: new Date().toISOString(), is_read: false, link_to_newpost: null, user: { alias: 'z' } },
    ]);

    const invalid = [
      // invalid: id as string, missing user
      { id: 'bad', title: 'X', noti_message: 'm', time_created: new Date().toISOString(), is_read: false, link_to_newpost: null },
    ];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(invalid),
    });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await store.fetchNotifications();

    const s = getStore();
    expect(s.ListNotifications.length).toBe(1);
    expect(s.unreadCount).toBe(1);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('fetchNotifications handles non-ok response gracefully', async () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:8000';
    jest.spyOn(SecureStore, 'getItemAsync').mockResolvedValue(null);
    const store = getStore();
    store.setNotifications([
      { id: 1, title: 'A', noti_message: 'm', time_created: new Date().toISOString(), is_read: false, link_to_newpost: null, user: { alias: 'x' } },
    ]);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ detail: 'oops' }),
    });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await store.fetchNotifications();
    const s = getStore();
    expect(s.ListNotifications.length).toBe(1);
    expect(s.unreadCount).toBe(1);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('markAsRead with non-existent id leaves state unchanged', () => {
    const store = getStore();
    store.setNotifications([
      { id: 1, title: 'A', noti_message: 'm', time_created: new Date().toISOString(), is_read: false, link_to_newpost: null, user: { alias: 'x' } },
    ]);
    store.markAsRead(999);
    const s = getStore();
    expect(s.unreadCount).toBe(1);
    expect(s.ListNotifications[0].is_read).toBe(false);
  });

  it('setNotifications with empty list sets unreadCount to 0', () => {
    const store = getStore();
    store.setNotifications([]);
    const s = getStore();
    expect(s.unreadCount).toBe(0);
    expect(s.ListNotifications.length).toBe(0);
  });

  it('markAllAsRead when already all read stays at 0', () => {
    const store = getStore();
    store.setNotifications([
      { id: 1, title: 'A', noti_message: 'm', time_created: new Date().toISOString(), is_read: true, link_to_newpost: null, user: { alias: 'x' } },
    ]);
    store.markAllAsRead();
    const s = getStore();
    expect(s.unreadCount).toBe(0);
    expect(s.ListNotifications.every(n => n.is_read)).toBe(true);
  });

  it('fetchNotifications handles empty array from server', async () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:8000';
    jest.spyOn(SecureStore, 'getItemAsync').mockResolvedValue(null);
    const store = getStore();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify([]),
    });
    await store.fetchNotifications();
    const s = getStore();
    expect(s.ListNotifications.length).toBe(0);
    expect(s.unreadCount).toBe(0);
  });
});
