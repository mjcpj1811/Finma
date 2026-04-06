export type CalendarQuery = {
  month: number;
  year: number;
  day?: number;
};

export type CalendarTransactionItem = {
  id: string;
  title: string;
  timeLabel: string;
  subLabel: string;
  amount: number;
  kind: 'income' | 'expense';
};

export type CalendarCategorySlice = {
  id: string;
  label: string;
  percent: number;
  color: string;
};

export type CalendarTransactionsResponse = {
  unreadNotifications: number;
  items: CalendarTransactionItem[];
};

export type CalendarCategoryResponse = {
  unreadNotifications: number;
  slices: CalendarCategorySlice[];
};