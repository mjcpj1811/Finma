export type ProfileMenuKey = 'edit' | 'settings' | 'help' | 'logout';

export type ProfileMenuItem = {
  key: ProfileMenuKey;
  label: string;
};

export type ProfileData = {
  id: string;
  fullName: string;
  avatarUrl: string;
  username: string;
  phone: string;
  email: string;
  notificationsEnabled: boolean;
  darkModeEnabled: boolean;
  unreadNotifications: number;
  menuItems: ProfileMenuItem[];
};

export type UpdateProfilePayload = {
  fullName: string;
  username: string;
  phone: string;
  email: string;
  notificationsEnabled: boolean;
  darkModeEnabled: boolean;
};

export type UpdateProfileResponse = {
  success: boolean;
};
