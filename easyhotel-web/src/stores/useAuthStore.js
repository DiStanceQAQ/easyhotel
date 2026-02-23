import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      merchantProfile: null,
      isAuthenticated: false,

      // 登录
      login: (token, user, merchantProfile = null) => {
        set({
          token,
          user,
          merchantProfile,
          isAuthenticated: true,
        });
      },

      // 登出
      logout: () => {
        set({
          token: null,
          user: null,
          merchantProfile: null,
          isAuthenticated: false,
        });
      },

      // 更新用户信息
      updateUser: (user) => {
        set({ user });
      },

      // 更新商户资料
      updateMerchantProfile: (profile) => {
        set({ merchantProfile: profile });
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        merchantProfile: state.merchantProfile,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
