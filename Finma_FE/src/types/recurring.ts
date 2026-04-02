export type RecurringCycle = 'monthly';

export type RecurringRuleItem = {
  id: string;
  title: string;
  amount: number;
  cycle: RecurringCycle;
  dayOfMonth: number;
  nextRunDateIso: string;
  categoryId: string;
  sourceId: string;
  note: string;
  isActive: boolean;
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
  dayOfMonth: number;
  categoryId: string;
  sourceId: string;
  note: string;
  isActive?: boolean;
};

export type RecurringActionResponse = {
  success: boolean;
  recurringId?: string;
  message?: string;
};
