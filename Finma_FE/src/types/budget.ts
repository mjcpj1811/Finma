export type PeriodType = 'MONTHLY' | 'YEARLY';

export type BudgetRequest = {
  categoryId: string;
  amountLimit: number;
  periodType: PeriodType;
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string; // ISO date string (YYYY-MM-DD)
  isRecurring: boolean;
};

export type BudgetResponse = {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amountLimit: number;
  periodType: PeriodType;
  startDate: string;
  endDate: string;
  isRecurring: boolean;
  parentBudgetId?: string | null;
  spentAmount: number;
  remainingAmount: number;
  usedPercentage: number;
  status: 'SAFE' | 'WARNING' | 'EXCEEDED';
  createdAt: string;
  updatedAt: string;
};

export type BudgetItem = {
  id: string;
  title: string;
  remaining: number;
  budget: number;
  spent: number;
  icon: string;
  color: string;
};
