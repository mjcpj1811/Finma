export type SavingItem = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  iconKey: string; // BE trả icon name, chấp nhận bất kỳ string
  description?: string;
  color?: string;
  status?: string;
  progressPercentage?: number;
  remainingAmount?: number;
  startDate?: string;
  endDate?: string;
  daysRemaining?: number;
  dailySavingNeeded?: number;
  monthlySavingNeeded?: number;
};

export type SavingTransactionItem = {
  id: string;
  savingId: string;
  dateIso: string;
  monthLabel: string;
  title: string;
  timeLabel: string;
  note: string;
  amount: number;
  kind: 'deposit' | 'withdraw';
  goalName?: string;
  depositDate?: string;
  goalCurrentAmount?: number;
  goalTargetAmount?: number;
  progressPercentage?: number;
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
  currentAmount?: number; // Not in GoalRequest, but FE uses it
  iconKey?: SavingItem['iconKey'];
  description?: string;
  startDate: string; // Required in GoalRequest
  endDate: string; // Required in GoalRequest
  color?: string;
};

export type CreateSavingTransactionPayload = {
  goalId?: number; // Long in BE
  amount: number;
  accountId?: number;
  depositDate?: string;
  note?: string;
  dateIso: string;
  title: string;
  kind: 'deposit' | 'withdraw';
};

export type UpdateSavingTransactionPayload = CreateSavingTransactionPayload;

export type SavingActionResponse = {
  success: boolean;
  savingId?: string;
  transactionId?: string;
  message?: string;
};
