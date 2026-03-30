export interface ApiResponse<T> {
  code: number;
  message?: string;
  result: T;
}

export type TransactionType = 'INCOME' | 'EXPENSE' | 'SAVING';

export interface TransactionListItem {
  id: number;
  type: TransactionType;
  amount: number | string;
  categoryId?: number;
  category?: string;
  accountId?: number;
  account?: string;
  note?: string;
  date?: string;
  transactionDateTime?: string;
}

export interface ReportSummary {
  totalIncome: number | string;
  totalExpense: number | string;
  balance: number | string;
}

export interface ReportChart {
  view: string;
  labels: string[];
  income: (number | string)[];
  expense: (number | string)[];
  summary: ReportSummary;
}

export interface PieItem {
  category: string;
  amount: number | string;
}

export interface CategoryOption {
  id: number;
  name: string;
  type: string;
}

export interface AccountOption {
  id: number;
  name: string;
  type: string;
  balance: number | string;
}
