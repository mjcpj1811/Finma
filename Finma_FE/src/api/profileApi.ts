import { requestApi } from './httpClient';
import {
  type ProfileData,
  type UpdateProfilePayload,
  type UpdateProfileResponse,
} from '../types/profile';
import {
  type ActionResponse,
  type DeleteAccountPayload,
  type NotificationSettingItem,
  type NotificationSettingsData,
  type PasswordChangePayload,
  type SettingsMenuData,
  type UpdateNotificationSettingsPayload,
} from '../types/settings';

const PROFILE_ENDPOINTS = {
  profile: '/users/my-info',
  updateProfile: '/users/me',
  settingsMenu: '/settings/menu',
  notificationSettings: '/settings/notifications',
  changePassword: '/users/me/password',
  deleteAccount: (userId: number) => `/users/${userId}`,
  logout: '/auth/logout',
};

// ====================
// 🔥 Helper unwrap
// ====================
const unwrap = (res: any) => res?.result ?? res;

// ====================
// 🚀 API
// ====================

export const profileApi = {
  // ===== Get Profile =====
  getProfile: async (token?: string): Promise<ProfileData> => {
    const res: any = await requestApi(PROFILE_ENDPOINTS.profile, { token });

    const data = unwrap(res);

    return {
      id: String(data.id),
      fullName: data.fullName ?? '',
      username: data.username ?? '',
      phone: data.phone ?? '',
      email: data.email ?? '',
      avatarUrl: data.avatar || 'https://i.pravatar.cc/240', // tránh null crash
      notificationsEnabled: true,
      darkModeEnabled: false,
      unreadNotifications: 0,
      menuItems: [
        { key: 'edit', label: 'Chỉnh Sửa Thông Tin' },
        { key: 'settings', label: 'Cài Đặt' },
        { key: 'help', label: 'Trợ Lý AI' },
        { key: 'logout', label: 'Đăng Xuất' },
      ],
    };
  },

  // ===== Logout =====
  logout: async (token?: string): Promise<{ success: boolean }> => {
    const { getAccessToken } = require('../utils/authTokenStorage');
    const finalToken = token ?? await getAccessToken();

    await requestApi(PROFILE_ENDPOINTS.logout, {
      method: 'POST',
      token: finalToken,
      body: { token: finalToken }
    });

    return { success: true };
  },

  // ===== Update Profile =====
  updateProfile: async (
    payload: UpdateProfilePayload,
    token?: string
  ): Promise<UpdateProfileResponse> => {
    await requestApi(PROFILE_ENDPOINTS.updateProfile, {
      method: 'PUT',
      body: payload,
      token,
    });

    return { success: true };
  },

  // ===== Settings Menu =====
  getSettingsMenu: async (token?: string): Promise<SettingsMenuData> => {
    const res: any = await requestApi(PROFILE_ENDPOINTS.settingsMenu, { token });

    const data = unwrap(res);

    return {
      unreadNotifications: data.unreadNotifications ?? 0,
      items:
        data.items ?? [
          { key: 'notifications', label: 'Thông Báo' },
          { key: 'password', label: 'Mật Khẩu' },
          { key: 'deleteAccount', label: 'Xóa Tài Khoản' },
        ],
    };
  },

  // ===== Notification Settings =====
  getNotificationSettings: async (
    token?: string
  ): Promise<NotificationSettingsData> => {
    const res: any = await requestApi(PROFILE_ENDPOINTS.notificationSettings, {
      token,
    });

    const data = unwrap(res);

    return {
      unreadNotifications: data.unreadNotifications ?? 0,
      items: data.items ?? [],
    };
  },

  updateNotificationSettings: async (
    payload: UpdateNotificationSettingsPayload,
    token?: string
  ): Promise<ActionResponse> => {
    await requestApi(PROFILE_ENDPOINTS.notificationSettings, {
      method: 'PUT',
      body: payload,
      token,
    });

    return { success: true };
  },

  // ===== Change Password =====
  changePassword: async (
    payload: PasswordChangePayload,
    token?: string
  ): Promise<ActionResponse> => {
    const res: any = await requestApi(PROFILE_ENDPOINTS.changePassword, {
      method: 'PUT',
      body: payload,
      token,
    });

    const data = unwrap(res);

    return {
      success: data?.success ?? true,
      message: data?.message,
    };
  },

  // ===== Delete Account =====
  deleteAccount: async (
    payload: DeleteAccountPayload,
    token?: string
  ): Promise<ActionResponse> => {
    const res: any = await requestApi(
      PROFILE_ENDPOINTS.deleteAccount(payload.userId),
      {
        method: 'DELETE',
        body: payload,
        token,
      }
    );

    const data = unwrap(res);

    return {
      success: data?.success ?? true,
      message: data?.message,
    };
  },
};