export type MoneySourceType = 'CASH' | 'BANK' | 'E_WALLET' | 'CREDIT' | 'SAVING' | 'INVESTMENT';

export type MoneySourceItem = {
  id: string;
  name: string;
  icon: string;
  color: string;
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
  icon: string;
  color: string;
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
  iconKey: string;
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
