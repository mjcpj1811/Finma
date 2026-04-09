export type NotificationSection = 'today' | 'yesterday' | 'older';

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  detail?: string;
  timeLabel: string;
  section: NotificationSection;
  isRead: boolean;
  createdAt: string;
};

export type NotificationGroup = {
  section: NotificationSection;
  title: string;
  items: NotificationItem[];
};
