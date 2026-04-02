import { transactionApi } from './transactionApi';
import {
  type RecurringActionResponse,
  type RecurringDashboard,
  type RecurringRuleItem,
  type UpsertRecurringRulePayload,
} from '../types/recurring';

const RECURRING_API_USE_MOCK = true;

let mockRecurringRules: RecurringRuleItem[] = [
  {
    id: 'rec-1',
    title: 'Gia Hạn Spotify',
    amount: 150000,
    cycle: 'monthly',
    dayOfMonth: 15,
    nextRunDateIso: '2026-04-15T08:00:00.000Z',
    categoryId: 'food',
    sourceId: 'cash',
    note: 'Hàng tháng',
    isActive: true,
  },
  {
    id: 'rec-2',
    title: 'Gia Hạn Youtube',
    amount: 150000,
    cycle: 'monthly',
    dayOfMonth: 5,
    nextRunDateIso: '2026-04-05T08:00:00.000Z',
    categoryId: 'other',
    sourceId: 'cash',
    note: 'Hàng tháng',
    isActive: false,
  },
  {
    id: 'rec-3',
    title: 'Vé Tàu Siêu Việt',
    amount: 150000,
    cycle: 'monthly',
    dayOfMonth: 10,
    nextRunDateIso: '2026-04-10T08:00:00.000Z',
    categoryId: 'transport',
    sourceId: 'cash',
    note: 'Hàng tháng',
    isActive: true,
  },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeDateOnly = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate());

const shiftNextMonth = (dateIso: string, dayOfMonth: number) => {
  const current = new Date(dateIso);
  const next = new Date(current.getFullYear(), current.getMonth() + 1, 1, 8, 0, 0, 0);
  const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(dayOfMonth, maxDay));
  return next.toISOString();
};

const buildDashboard = (): RecurringDashboard => {
  const activeItems = mockRecurringRules.filter((item) => item.isActive);
  const monthlyExpense = activeItems.reduce((sum, item) => sum + Math.abs(item.amount), 0);

  return {
    overview: {
      activeCount: activeItems.length,
      monthlyExpense,
      unreadNotifications: 1,
    },
    items: mockRecurringRules,
  };
};

const syncDueTransactions = async () => {
  const today = normalizeDateOnly(new Date());

  for (let ruleIndex = 0; ruleIndex < mockRecurringRules.length; ruleIndex += 1) {
    const rule = mockRecurringRules[ruleIndex];
    if (!rule.isActive) {
      continue;
    }

    let nextDate = normalizeDateOnly(new Date(rule.nextRunDateIso));

    while (nextDate.getTime() <= today.getTime()) {
      await transactionApi.createTransaction({
        date: new Date(nextDate).toISOString(),
        type: 'expense',
        categoryId: rule.categoryId,
        amount: Math.abs(rule.amount),
        title: rule.title,
        sourceId: rule.sourceId,
        detail: `Định kỳ tự động - ${rule.note || 'Hàng tháng'}`,
      });

      const movedIso = shiftNextMonth(new Date(nextDate).toISOString(), rule.dayOfMonth);
      mockRecurringRules[ruleIndex] = {
        ...mockRecurringRules[ruleIndex],
        nextRunDateIso: movedIso,
      };

      nextDate = normalizeDateOnly(new Date(movedIso));
    }
  }
};

export const recurringApi = {
  getDashboard: async () => {
    if (RECURRING_API_USE_MOCK) {
      await sleep(120);
      await syncDueTransactions();
      return buildDashboard();
    }

    throw new Error('Recurring API is only mocked in this environment');
  },

  syncDueTransactions: async () => {
    if (RECURRING_API_USE_MOCK) {
      await syncDueTransactions();
      return;
    }
  },

  createRecurringRule: async (payload: UpsertRecurringRulePayload) => {
    if (RECURRING_API_USE_MOCK) {
      await sleep(100);
      const recurringId = `rec-${Date.now()}`;
      const now = new Date();
      const base = new Date(now.getFullYear(), now.getMonth(), 1, 8, 0, 0, 0);
      const maxDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
      base.setDate(Math.min(payload.dayOfMonth, maxDay));

      mockRecurringRules = [
        {
          id: recurringId,
          title: payload.title.trim(),
          amount: Math.abs(payload.amount),
          cycle: payload.cycle,
          dayOfMonth: payload.dayOfMonth,
          nextRunDateIso: base.toISOString(),
          categoryId: payload.categoryId,
          sourceId: payload.sourceId,
          note: payload.note,
          isActive: payload.isActive ?? true,
        },
        ...mockRecurringRules,
      ];

      await syncDueTransactions();
      return { success: true, recurringId } satisfies RecurringActionResponse;
    }

    throw new Error('Recurring API is only mocked in this environment');
  },

  updateRecurringRule: async (recurringId: string, payload: UpsertRecurringRulePayload) => {
    if (RECURRING_API_USE_MOCK) {
      await sleep(100);
      mockRecurringRules = mockRecurringRules.map((item) => {
        if (item.id !== recurringId) {
          return item;
        }

        return {
          ...item,
          title: payload.title.trim(),
          amount: Math.abs(payload.amount),
          cycle: payload.cycle,
          dayOfMonth: payload.dayOfMonth,
          categoryId: payload.categoryId,
          sourceId: payload.sourceId,
          note: payload.note,
          isActive: payload.isActive ?? item.isActive,
          nextRunDateIso: shiftNextMonth(item.nextRunDateIso, payload.dayOfMonth),
        };
      });

      await syncDueTransactions();
      return { success: true, recurringId } satisfies RecurringActionResponse;
    }

    throw new Error('Recurring API is only mocked in this environment');
  },

  deleteRecurringRule: async (recurringId: string) => {
    if (RECURRING_API_USE_MOCK) {
      await sleep(100);
      mockRecurringRules = mockRecurringRules.filter((item) => item.id !== recurringId);
      return { success: true, recurringId } satisfies RecurringActionResponse;
    }

    throw new Error('Recurring API is only mocked in this environment');
  },

  toggleRecurringRule: async (recurringId: string, isActive: boolean) => {
    if (RECURRING_API_USE_MOCK) {
      await sleep(80);
      mockRecurringRules = mockRecurringRules.map((item) =>
        item.id === recurringId ? { ...item, isActive } : item,
      );
      await syncDueTransactions();
      return { success: true, recurringId } satisfies RecurringActionResponse;
    }

    throw new Error('Recurring API is only mocked in this environment');
  },
};
