export type PeriodFilter = 'day' | 'week' | 'month';

export type HomeUser = {
  id: string;
  name: string;
  greetingText: string;
  unreadNotifications: number;
};

export type HomeOverview = {
  totalBalance: number;
  totalExpense: number;
  budgetUsedPercent: number;
  budgetLimit: number;
};

export type HomeHeaderSummary = {
  totalIncome: number;
  totalExpense: number;
};

export type TransactionKind = 'income' | 'expense';

export type TransactionItem = {
  id: string;
  title: string;
  timeLabel: string;
  categoryLabel: string;
  amount: number;
  kind: TransactionKind;
  iconKey: 'salary' | 'food' | 'rent' | 'transport' | 'other';
};

export type HomeDashboard = {
  user: HomeUser;
  overview: HomeOverview;
  goalSummaryText: string;
  headerSummary: HomeHeaderSummary;
  transactions: TransactionItem[];
  unreadNotifications: number;
};
