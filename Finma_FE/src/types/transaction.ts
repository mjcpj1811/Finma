export type TransactionFilter = 'all' | 'income' | 'expense';
export type TransactionType = 'income' | 'expense';

export type TransactionOverview = {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  unreadNotifications: number;
};

export type TransactionItem = {
  id: string;
  monthLabel: string;
  title: string;
  timeLabel: string;
  note: string;
  amount: number;
  kind: 'income' | 'expense';
  iconKey: 'salary' | 'food' | 'rent' | 'transport' | 'other';
};

export type TransactionDashboard = {
  overview: TransactionOverview;
  items: TransactionItem[];
};

export type TransactionCategoryOption = {
  id: string;
  label: string;
  type: TransactionType;
};

export type TransactionSourceOption = {
  id: string;
  label: string;
};

export type TransactionFormOptions = {
  categories: TransactionCategoryOption[];
  sources: TransactionSourceOption[];
};

export type CreateTransactionPayload = {
  date: string;
  type: TransactionType;
  categoryId: string;
  amount: number;
  title: string;
  sourceId: string;
  detail?: string;
};

export type CreateTransactionResponse = {
  success: boolean;
  transactionId: string;
};

export type TransactionDetail = {
  id: string;
  date: string;
  type: TransactionType;
  categoryId: string;
  categoryLabel: string;
  amount: number;
  title: string;
  sourceId: string;
  sourceLabel: string;
  detail?: string;
  note: string;
  timeLabel: string;
  iconKey: TransactionItem['iconKey'];
};

export type UpdateTransactionPayload = CreateTransactionPayload;

export type TransactionActionResponse = {
  success: boolean;
};