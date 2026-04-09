import { request } from './httpClient';
import { type NotificationGroup, type NotificationItem } from '../types/notification';

const NOTIFICATION_API_USE_MOCK = false;

const NOTIFICATION_ENDPOINTS = {
  list: '/notifications',
  markAllRead: '/notifications/read-all',
  markAsRead: (id: string) => `/notifications/${id}/read`,
  delete: (id: string) => `/notifications/${id}`,
};

const mockNotifications: NotificationItem[] = [
  {
    id: 'noti-1',
    title: 'Nhắc nhở',
    message: 'Hãy thiết lập tiết kiệm tự động để đạt mục tiêu tiết kiệm của bạn...',
    timeLabel: '17:00 - 24 Tháng 4',
    section: 'today',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'noti-2',
    title: 'Cập nhật mới',
    message: 'Hãy thiết lập tiết kiệm tự động để đạt mục tiêu tiết kiệm của bạn...',
    timeLabel: '17:00 - 24 Tháng 4',
    section: 'today',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'noti-3',
    title: 'Giao dịch',
    message: 'Một giao dịch mới đã được ghi nhận',
    detail: 'Tạp hóa | Pantry | -100,000',
    timeLabel: '17:00 - 24 Tháng 4',
    section: 'yesterday',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'noti-4',
    title: 'Nhắc nhở',
    message: 'Hãy thiết lập tiết kiệm tự động để đạt mục tiêu tiết kiệm của bạn...',
    timeLabel: '17:00 - 24 Tháng 4',
    section: 'yesterday',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'noti-5',
    title: 'Báo cáo chi tiêu',
    message: 'Chúng tôi khuyên bạn nên chú ý hơn đến tình hình tài chính của mình.',
    timeLabel: '17:00 - 24 Tháng 4',
    section: 'older',
    isRead: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'noti-6',
    title: 'Giao dịch',
    message: 'Một giao dịch mới đã được ghi nhận',
    detail: 'Ăn uống | Bữa tối | -$70.40',
    timeLabel: '17:00 - 24 Tháng 4',
    section: 'older',
    isRead: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

const groupNotifications = (items: NotificationItem[]): NotificationGroup[] => {
  const groups: Record<string, NotificationItem[]> = {
    today: [],
    yesterday: [],
    older: [],
  };

  const formatDateLocal = (date: Date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const now = new Date();
  const todayStr = formatDateLocal(now);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = formatDateLocal(yesterday);

  items.forEach((item) => {
    const createdAtStr = item.createdAt || new Date().toISOString();
    const itemDateObj = new Date(createdAtStr);
    const itemDate = formatDateLocal(itemDateObj);
    
    if (itemDate === todayStr) {
      groups.today.push({ ...item, createdAt: createdAtStr, section: 'today' });
    } else if (itemDate === yesterdayStr) {
      groups.yesterday.push({ ...item, createdAt: createdAtStr, section: 'yesterday' });
    } else {
      groups.older.push({ ...item, createdAt: createdAtStr, section: 'older' });
    }
  });

  const sectionTitles: Record<string, string> = {
    today: 'Hôm nay',
    yesterday: 'Hôm qua',
    older: 'Cũ hơn',
  };

  return (['today', 'yesterday', 'older'] as const)
    .filter((section) => groups[section].length > 0)
    .map((section) => ({
      section: section as any,
      title: sectionTitles[section],
      items: groups[section],
    }));
};

export const notificationApi = {
  getNotifications: async (token?: string) => {
    if (NOTIFICATION_API_USE_MOCK) {
      return groupNotifications(mockNotifications);
    }

    const response = await request<any>(NOTIFICATION_ENDPOINTS.list, { token });
    // Backend returns ApiResponse<List<NotificationResponse>>, result is the list
    const rawItems = response.result || [];
    
    const items: NotificationItem[] = rawItems.map((apiItem: any) => {
      // Safety check for date
      const createdAtStr = apiItem.createdAt || new Date().toISOString();
      const date = new Date(createdAtStr);
      
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      
      const timeLabel = `${hours}:${minutes} - ${day} Tháng ${month}`;
      
      return {
        id: apiItem.id.toString(),
        title: apiItem.title || 'Thông báo',
        message: apiItem.content || '',
        isRead: apiItem.isRead || false,
        createdAt: createdAtStr,
        timeLabel,
        section: 'older', // Will be overridden in groupNotifications
      };
    });

    return groupNotifications(items);
  },

  getUnreadCount: async (token?: string) => {
    const groups = await notificationApi.getNotifications(token);
    return groups.reduce(
      (total, group) => total + group.items.filter((item) => !item.isRead).length,
      0,
    );
  },

  markAsRead: async (id: string, token?: string) => {
    return request<any>(NOTIFICATION_ENDPOINTS.markAsRead(id), {
      method: 'PATCH',
      token,
    });
  },

  markAllRead: async (token?: string) => {
    if (NOTIFICATION_API_USE_MOCK) {
      return { success: true };
    }

    return request<{ success: boolean }>(NOTIFICATION_ENDPOINTS.markAllRead, {
      method: 'PATCH',
      token,
    });
  },

  deleteNotification: async (id: string, token?: string) => {
    return request<any>(NOTIFICATION_ENDPOINTS.delete(id), {
      method: 'DELETE',
      token,
    });
  },
};
