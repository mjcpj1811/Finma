export type DebtDirection = 'borrow' | 'lend';

export type DebtItem = {
  id: string;
  name: string;
  direction: DebtDirection;
  principalAmount: number;
  remainingAmount: number;
  iconKey: 'payments' | 'account-balance-wallet' | 'groups';
};

export type DebtTransactionKind = 'borrow' | 'repay';

export type DebtTransactionItem = {
  id: string;
  debtId: string;
  dateIso: string;
  monthLabel: string;
  title: string;
  timeLabel: string;
  counterparty: string;
  amount: number;
  kind: DebtTransactionKind;
};

export type DebtsDashboard = {
  overview: {
    totalPrincipal: number;
    totalRemaining: number;
    unreadNotifications: number;
  };
  items: DebtItem[];
};

export type DebtTransactionsResponse = {
  debt: DebtItem;
  overview: {
    totalBorrowed: number;
    totalRepaid: number;
    remainingAmount: number;
    unreadNotifications: number;
  };
  items: DebtTransactionItem[];
};

export type UpsertDebtPayload = {
  name: string;
  direction: DebtDirection;
  principalAmount: number;
  remainingAmount: number;
  iconKey: DebtItem['iconKey'];
};

export type UpsertDebtTransactionPayload = {
  dateIso: string;
  title: string;
  counterparty: string;
  amount: number;
  kind: DebtTransactionKind;
};

export type DebtActionResponse = {
  success: boolean;
  debtId?: string;
  message?: string;
};

export type DebtTransactionActionResponse = {
  success: boolean;
  transactionId?: string;
  message?: string;
};
