import { request } from './httpClient';
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

const PROFILE_API_USE_MOCK = true;

const PROFILE_ENDPOINTS = {
  profile: '/profile',
  updateProfile: '/profile',
  settingsMenu: '/settings/menu',
  notificationSettings: '/settings/notifications',
  changePassword: '/settings/password',
  deleteAccount: '/settings/delete-account',
  logout: '/auth/logout',
};

let mockProfile: ProfileData = {
  id: '36636336',
  fullName: 'Bánh Khúc',
  avatarUrl: 'https://i.pravatar.cc/240?img=11',
  username: 'Bánh Khúc',
  phone: '+44 555 5555 55',
  email: 'example@example.com',
  notificationsEnabled: true,
  darkModeEnabled: false,
  unreadNotifications: 1,
  menuItems: [
    { key: 'edit', label: 'Chỉnh Sửa Thông Tin' },
    { key: 'settings', label: 'Cài Đặt' },
    { key: 'help', label: 'Trợ Lý AI' },
    { key: 'logout', label: 'Đăng Xuất' },
  ],
};

const mockSettingsMenu: SettingsMenuData = {
  unreadNotifications: 1,
  items: [
    { key: 'notifications', label: 'Thông Báo' },
    { key: 'password', label: 'Mật Khẩu' },
    { key: 'deleteAccount', label: 'Xóa Tài Khoản' },
  ],
};

let mockNotificationSettings: NotificationSettingItem[] = [
  { key: 'general', label: 'Thông Báo Chung', enabled: true },
  { key: 'sound', label: 'Âm Thanh', enabled: true },
  { key: 'soundType', label: 'Cuộc Gọi Âm Thanh', enabled: true },
  { key: 'vibrate', label: 'Rung', enabled: true },
  { key: 'transactionUpdate', label: 'Cập Nhật Giao Dịch', enabled: false },
  { key: 'expenseReminder', label: 'Nhắc Nhở Chi Tiêu', enabled: false },
  { key: 'budgetNotice', label: 'Thông Báo Ngân Sách', enabled: false },
  { key: 'lowBalance', label: 'Cảnh Báo Số Dư Thấp', enabled: false },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const profileApi = {
  getProfile: async (token?: string) => {
    if (PROFILE_API_USE_MOCK) {
      await sleep(180);
      return mockProfile;
    }

    return request<ProfileData>(PROFILE_ENDPOINTS.profile, { token });
  },

  logout: async (token?: string) => {
    if (PROFILE_API_USE_MOCK) {
      await sleep(120);
      return { success: true };
    }

    return request<{ success: boolean }>(PROFILE_ENDPOINTS.logout, {
      method: 'POST',
      token,
    });
  },

  updateProfile: async (payload: UpdateProfilePayload, token?: string) => {
    if (PROFILE_API_USE_MOCK) {
      await sleep(180);
      mockProfile = {
        ...mockProfile,
        fullName: payload.fullName,
        username: payload.username,
        phone: payload.phone,
        email: payload.email,
        notificationsEnabled: payload.notificationsEnabled,
        darkModeEnabled: payload.darkModeEnabled,
      };
      return { success: true } satisfies UpdateProfileResponse;
    }

    return request<UpdateProfileResponse>(PROFILE_ENDPOINTS.updateProfile, {
      method: 'PUT',
      body: payload,
      token,
    });
  },

  getSettingsMenu: async (token?: string) => {
    if (PROFILE_API_USE_MOCK) {
      await sleep(120);
      return mockSettingsMenu;
    }

    return request<SettingsMenuData>(PROFILE_ENDPOINTS.settingsMenu, { token });
  },

  getNotificationSettings: async (token?: string) => {
    if (PROFILE_API_USE_MOCK) {
      await sleep(120);
      return {
        unreadNotifications: mockProfile.unreadNotifications,
        items: mockNotificationSettings,
      } satisfies NotificationSettingsData;
    }

    return request<NotificationSettingsData>(PROFILE_ENDPOINTS.notificationSettings, { token });
  },

  updateNotificationSettings: async (payload: UpdateNotificationSettingsPayload, token?: string) => {
    if (PROFILE_API_USE_MOCK) {
      await sleep(120);
      mockNotificationSettings = payload.items;
      return { success: true } satisfies ActionResponse;
    }

    return request<ActionResponse>(PROFILE_ENDPOINTS.notificationSettings, {
      method: 'PUT',
      body: payload,
      token,
    });
  },

  changePassword: async (payload: PasswordChangePayload, token?: string) => {
    if (PROFILE_API_USE_MOCK) {
      await sleep(140);
      if (payload.newPassword !== payload.confirmPassword) {
        return { success: false, message: 'Mật khẩu xác nhận không khớp.' } satisfies ActionResponse;
      }
      return { success: true } satisfies ActionResponse;
    }

    return request<ActionResponse>(PROFILE_ENDPOINTS.changePassword, {
      method: 'POST',
      body: payload,
      token,
    });
  },

  deleteAccount: async (payload: DeleteAccountPayload, token?: string) => {
    if (PROFILE_API_USE_MOCK) {
      await sleep(140);
      if (!payload.password.trim()) {
        return { success: false, message: 'Vui lòng nhập mật khẩu.' } satisfies ActionResponse;
      }
      return { success: true } satisfies ActionResponse;
    }

    return request<ActionResponse>(PROFILE_ENDPOINTS.deleteAccount, {
      method: 'POST',
      body: payload,
      token,
    });
  },
};
