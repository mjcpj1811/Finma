export type NotificationSection = 'today' | 'yesterday' | 'weekend';

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  detail?: string;
  timeLabel: string;
  section: NotificationSection;
  isRead: boolean;
};

export type NotificationGroup = {
  section: NotificationSection;
  title: string;
  items: NotificationItem[];
};
