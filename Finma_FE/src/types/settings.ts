export type SettingsMenuItem = {
  key: 'notifications' | 'password' | 'deleteAccount';
  label: string;
};

export type SettingsMenuData = {
  unreadNotifications: number;
  items: SettingsMenuItem[];
};

export type NotificationSettingItem = {
  key: string;
  label: string;
  enabled: boolean;
};

export type NotificationSettingsData = {
  unreadNotifications: number;
  items: NotificationSettingItem[];
};

export type UpdateNotificationSettingsPayload = {
  items: NotificationSettingItem[];
};

export type PasswordChangePayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ActionResponse = {
  success: boolean;
  message?: string;
};

export type DeleteAccountPayload = {
  password: string;
};
