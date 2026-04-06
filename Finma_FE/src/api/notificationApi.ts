import { request } from './httpClient';
import { type NotificationGroup, type NotificationItem } from '../types/notification';

const NOTIFICATION_API_USE_MOCK = true;

const NOTIFICATION_ENDPOINTS = {
  list: '/notifications',
  markAllRead: '/notifications/read-all',
};

const mockNotifications: NotificationItem[] = [
  {
    id: 'noti-1',
    title: 'Nhắc nhở',
    message: 'Hãy thiết lập tiết kiệm tự động để đạt mục tiêu tiết kiệm của bạn...',
    timeLabel: '17:00 - 24 Tháng 4',
    section: 'today',
    isRead: false,
  },
  {
    id: 'noti-2',
    title: 'Cập nhật mới',
    message: 'Hãy thiết lập tiết kiệm tự động để đạt mục tiêu tiết kiệm của bạn...',
    timeLabel: '17:00 - 24 Tháng 4',
    section: 'today',
    isRead: false,
  },
  {
    id: 'noti-3',
    title: 'Giao dịch',
    message: 'Một giao dịch mới đã được ghi nhận',
    detail: 'Tạp hóa | Pantry | -100,000',
    timeLabel: '17:00 - 24 Tháng 4',
    section: 'yesterday',
    isRead: true,
  },
  {
    id: 'noti-4',
    title: 'Nhắc nhở',
    message: 'Hãy thiết lập tiết kiệm tự động để đạt mục tiêu tiết kiệm của bạn...',
    timeLabel: '17:00 - 24 Tháng 4',
    section: 'yesterday',
    isRead: true,
  },
  {
    id: 'noti-5',
    title: 'Báo cáo chi tiêu',
    message: 'Chúng tôi khuyên bạn nên chú ý hơn đến tình hình tài chính của mình.',
    timeLabel: '17:00 - 24 Tháng 4',
    section: 'weekend',
    isRead: true,
  },
  {
    id: 'noti-6',
    title: 'Giao dịch',
    message: 'Một giao dịch mới đã được ghi nhận',
    detail: 'Ăn uống | Bữa tối | -$70.40',
    timeLabel: '17:00 - 24 Tháng 4',
    section: 'weekend',
    isRead: true,
  },
];

const sectionTitleMap: Record<'today' | 'yesterday' | 'weekend', string> = {
  today: 'Hôm nay',
  yesterday: 'Hôm qua',
  weekend: 'Cuối tuần này',
};

const groupNotifications = (items: NotificationItem[]): NotificationGroup[] => {
  const orderedSections: Array<'today' | 'yesterday' | 'weekend'> = ['today', 'yesterday', 'weekend'];

  return orderedSections
    .map((section) => ({
      section,
      title: sectionTitleMap[section],
      items: items.filter((item) => item.section === section),
    }))
    .filter((group) => group.items.length > 0);
};

export const notificationApi = {
  getNotifications: async (token?: string) => {
    if (NOTIFICATION_API_USE_MOCK) {
      return groupNotifications(mockNotifications);
    }

    const items = await request<NotificationItem[]>(NOTIFICATION_ENDPOINTS.list, { token });
    return groupNotifications(items);
  },

  markAllRead: async (token?: string) => {
    if (NOTIFICATION_API_USE_MOCK) {
      return { success: true };
    }

    return request<{ success: boolean }>(NOTIFICATION_ENDPOINTS.markAllRead, {
      method: 'POST',
      token,
    });
  },
};
