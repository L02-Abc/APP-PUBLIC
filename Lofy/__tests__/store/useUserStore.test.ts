import useUserStore, { type UserStore } from '../../store/useUserStore';

function getStore(): UserStore {
  // Zustand testing pattern: directly access the store's getState
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (useUserStore as any).getState();
}

describe('useUserStore', () => {
  beforeEach(() => {
    const store = getStore();
    store.clearUser();
    store.setID(0);
  });
  it('sets id and alias', () => {
    const store = getStore();
    store.setID(1);
    store.setAlias('thinh');
    expect(getStore().id).toBe(1);
    expect(getStore().alias).toBe('thinh');
  });

  it('initializes and toggles thread follows', () => {
    const store = getStore();
    store.initFollowedThread(['t1']);
    expect(store.isThreadFollowed('t1')).toBe(true);
    expect(store.isThreadFollowed('t2')).toBe(false);
    store.toggleThreadFollow('t2');
    expect(store.isThreadFollowed('t2')).toBe(true);
    store.toggleThreadFollow('t2');
    expect(store.isThreadFollowed('t2')).toBe(false);
  });

  it('clears user state', () => {
    const store = getStore();
    store.setID(1);
    store.setAlias('alias');
    store.initFollowedThread(['a']);
    store.clearUser();
    const final = getStore();
    // Store resets alias to empty string and keeps id unchanged
    expect(final.id).toBe(1);
    expect(final.alias).toBe('');
    expect(final.followedThreadIds).toEqual([]);
  });
});
