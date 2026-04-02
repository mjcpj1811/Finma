export type SavingItem = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  iconKey: 'savings' | 'flight' | 'directions-car' | 'home-work';
};

export type SavingTransactionItem = {
  id: string;
  savingId: string;
  monthLabel: string;
  title: string;
  timeLabel: string;
  note: string;
  amount: number;
  kind: 'deposit' | 'withdraw';
};

export type SavingsDashboard = {
  overview: {
    totalSaved: number;
    totalTarget: number;
    unreadNotifications: number;
  };
  items: SavingItem[];
};

export type SavingTransactionsResponse = {
  saving: SavingItem;
  overview: {
    saved: number;
    target: number;
    remaining: number;
    progressPercent: number;
    totalInflow: number;
    totalOutflow: number;
    unreadNotifications: number;
  };
  items: SavingTransactionItem[];
};

export type UpsertSavingPayload = {
  name: string;
  targetAmount: number;
  currentAmount: number;
  iconKey: SavingItem['iconKey'];
};

export type CreateSavingTransactionPayload = {
  dateIso: string;
  title: string;
  note: string;
  amount: number;
  kind: 'deposit' | 'withdraw';
};

export type SavingActionResponse = {
  success: boolean;
  savingId?: string;
  transactionId?: string;
  message?: string;
};
