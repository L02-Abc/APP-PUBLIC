import React, { useState, useEffect } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserStore = {
  id: number,
  alias: string;
  followedThreadIds: number[];              // 🔹 chỉ lưu danh sách thread_id
  setAlias: (alias: string) => void;
  setID: (id: number) => void;
  initFollowedThread: ( threadIds: number[]) => void;
  isThreadFollowed: (threadId: number) => boolean;
  toggleThreadFollow: (threadId: number) => void;
  clearUser: () => void;
};

const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      id: 0,
      alias: '',
      followedThreadIds: [],
      
      setID: (id) => set({id}),

      setAlias: (alias) => set({ alias }),

      initFollowedThread: (threadIds) => {
        set({ followedThreadIds: threadIds }); 
      },

      isThreadFollowed: (threadId) => {
        return get().followedThreadIds.includes(threadId);
      },

      toggleThreadFollow: (threadId) => {
        const { followedThreadIds } = get();
        if (followedThreadIds.includes(threadId)) { //Da follow
          set({
            followedThreadIds: followedThreadIds.filter(id => id !== threadId),
          });
        } else {
          set({
            followedThreadIds: [...followedThreadIds, threadId],
          });
        }
      },

      clearUser: () => set({ alias: '', followedThreadIds: [] }),
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useUserStore;