export type RecurringCycle = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RecurringStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export type RecurringRuleItem = {
  id: string;
  title: string;
  amount: number;
  cycle: RecurringCycle;
  frequencyLabel: string;
  executionLabel: string;
  categoryId?: string;
  sourceId?: string;
  note?: string;
  isActive: boolean;
  status: RecurringStatus;
  categoryIcon?: string;
  categoryColor?: string;
};

export type RecurringRuleDetail = {
  id: string;
  title: string;
  amount: number;
  cycle: RecurringCycle;
  frequencyLabel: string;
  executionLabel: string;
  startDate: string;
  dayOfMonth?: number;
  dayOfWeek?: number;
  reminderDaysBefore?: number;
  categoryId?: string;
  sourceId?: string;
  note?: string;
  isActive: boolean;
  status: RecurringStatus;
};

export type RecurringDashboard = {
  overview: {
    activeCount: number;
    monthlyExpense: number;
    unreadNotifications: number;
  };
  items: RecurringRuleItem[];
};

export type UpsertRecurringRulePayload = {
  title: string;
  amount: number;
  cycle: RecurringCycle;
  dayOfMonth?: number;
  dayOfWeek?: number;
  startDate?: string;
  categoryId?: string;
  sourceId?: string;
  note?: string;
  reminderDaysBefore?: number;
  status?: RecurringStatus;
  isActive?: boolean;
};

export type RecurringActionResponse = {
  success: boolean;
  recurringId?: string;
  message?: string;
};
