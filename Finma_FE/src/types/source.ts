export type MoneySourceType = 'cash' | 'bank' | 'card';

export type MoneySourceItem = {
  id: string;
  name: string;
  subtitle: string;
  balance: number;
  type: MoneySourceType;
};

export type MoneySourceSummary = {
  totalBalance: number;
  totalAccounts: number;
  unreadNotifications: number;
};

export type MoneySourceDashboard = {
  summary: MoneySourceSummary;
  items: MoneySourceItem[];
};

export type UpsertMoneySourcePayload = {
  name: string;
  subtitle: string;
  balance: number;
  type: MoneySourceType;
};

export type UpsertMoneySourceResponse = {
  success: boolean;
  sourceId: string;
};

export type MoneySourceActionResponse = {
  success: boolean;
};

export type SourceTransactionItem = {
  id: string;
  sourceId: string;
  monthLabel: string;
  title: string;
  timeLabel: string;
  note: string;
  amount: number;
  kind: 'income' | 'expense';
  iconKey: 'salary' | 'food' | 'rent' | 'transport' | 'other';
};

export type MoneySourceTransactionsResponse = {
  source: MoneySourceItem;
  overview: {
    balance: number;
    totalExpense: number;
    totalIncome: number;
    unreadNotifications: number;
  };
  items: SourceTransactionItem[];
};
