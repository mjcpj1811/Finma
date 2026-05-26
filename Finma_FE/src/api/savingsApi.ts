import { request } from './httpClient';
import {
  type CreateSavingTransactionPayload,
  type SavingActionResponse,
  type SavingItem,
  type SavingTransactionItem,
  type SavingTransactionsResponse,
  type SavingsDashboard,
  type UpsertSavingPayload,
} from '../types/savings';

const SAVINGS_ENDPOINTS = {
  dashboard: '/goals',
  create: '/goals',
  update: (id: string) => `/goals/${id}`,
  remove: (id: string) => `/goals/${id}`,
  transactions: (id: string) => `/goals/${id}/deposits`,
  deposits: '/goals/deposits',
  removeTransaction: (depositId: string) => `/goals/deposits/${depositId}`,
};

const toMonthLabel = (dateIso: string) => {
  const date = new Date(dateIso);
  return date.toLocaleString('vi-VN', { month: 'long' });
};

const toTimeLabel = (dateIso: string) => {
  const date = new Date(dateIso);
  const month = date.toLocaleString('vi-VN', { month: 'long' });
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')} - ${month} ${day}`;
};

const toLocalDateStart = (value?: string) => {
  const base = value ? new Date(value) : new Date();
  const date = Number.isNaN(base.getTime()) ? new Date() : base;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}T00:00:00`;
};

const normalizeDateIso = (value: string | undefined) => {
  if (!value) {
    return new Date().toISOString();
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    // Keep date-only values in local time to avoid fixed UTC offset displays on mobile.
    return `${value}T00:00:00`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }

  return parsed.toISOString();
};

export const savingsApi = {
  getDashboard: async (token?: string) => {
    const response = await request<{ result: any[] }>(SAVINGS_ENDPOINTS.dashboard, { token });
    const goals = Array.isArray(response.result)
      ? response.result
      : Array.isArray(response)
      ? response
      : [];

    const totalSaved = goals.reduce((sum: number, goal: any) => sum + parseFloat(goal.currentAmount || 0), 0);
    const totalTarget = goals.reduce((sum: number, goal: any) => sum + parseFloat(goal.targetAmount || 0), 0);

    const items: SavingItem[] = goals.map((goal: any) => ({
      id: goal.id.toString(),
      name: goal.name,
      targetAmount: parseFloat(goal.targetAmount || 0),
      currentAmount: parseFloat(goal.currentAmount || 0),
      iconKey: goal.icon || 'savings',
      description: goal.description,
      color: goal.color,
      status: goal.status,
      progressPercentage: goal.progressPercentage,
      remainingAmount: parseFloat(goal.remainingAmount || 0),
      startDate: goal.startDate,
      endDate: goal.endDate,
      daysRemaining: goal.daysRemaining,
      dailySavingNeeded: parseFloat(goal.dailySavingNeeded || 0),
      monthlySavingNeeded: parseFloat(goal.monthlySavingNeeded || 0),
    }));

    return {
      overview: {
        totalSaved,
        totalTarget,
        unreadNotifications: 1, // TODO: get from BE
      },
      items,
    };
  },

  getSavingTransactions: async (savingId: string, token?: string) => {
    // Get goal details
    const goalResponse = await request<{ result: any }>(SAVINGS_ENDPOINTS.update(savingId), { token });
    const goal = goalResponse.result ?? goalResponse;
    if (!goal) {
      throw new Error('Goal not found');
    }

    // Get deposits
    const depositsResponse = await request<{ result: any[] }>(SAVINGS_ENDPOINTS.transactions(savingId), { token });
    const deposits = Array.isArray(depositsResponse.result)
      ? depositsResponse.result
      : Array.isArray(depositsResponse)
      ? depositsResponse
      : [];

    const saving: SavingItem = {
      id: goal.id.toString(),
      name: goal.name,
      targetAmount: parseFloat(goal.targetAmount || 0),
      currentAmount: parseFloat(goal.currentAmount || 0),
      iconKey: goal.icon || 'savings',
      description: goal.description,
      color: goal.color,
      status: goal.status,
      progressPercentage: goal.progressPercentage,
      remainingAmount: parseFloat(goal.remainingAmount || 0),
      startDate: goal.startDate,
      endDate: goal.endDate,
      daysRemaining: goal.daysRemaining,
      dailySavingNeeded: parseFloat(goal.dailySavingNeeded || 0),
      monthlySavingNeeded: parseFloat(goal.monthlySavingNeeded || 0),
    };

    const items: SavingTransactionItem[] = deposits.map((deposit: any) => {
      // Prefer createdAt so both savings-related screens display creation time consistently.
      const dateIso = normalizeDateIso(deposit.createdAt || deposit.depositDate);

      return {
        id: deposit.id.toString(),
        savingId: deposit.goalId?.toString() ?? saving.id.toString(),
        dateIso,
        monthLabel: toMonthLabel(dateIso),
        title: deposit.goalName || saving.name,
        timeLabel: toTimeLabel(dateIso),
        note: deposit.note || '',
        amount: parseFloat(deposit.amount ?? '0'),
        kind: 'deposit',
        goalName: deposit.goalName,
        depositDate: deposit.depositDate,
        goalCurrentAmount: parseFloat(deposit.goalCurrentAmount || 0),
        goalTargetAmount: parseFloat(deposit.goalTargetAmount || 0),
        progressPercentage: deposit.progressPercentage,
      };
    });

    const totalInflow = items.reduce((sum, item) => sum + Math.abs(item.amount), 0);
    const totalOutflow = 0; // BE only has deposits

    const progressPercent = saving.targetAmount && saving.targetAmount > 0
      ? Math.max(0, Math.min(100, Math.round((saving.currentAmount / saving.targetAmount) * 100)))
      : 0;

    return {
      saving,
      overview: {
        saved: saving.currentAmount,
        target: saving.targetAmount,
        remaining: Math.max(saving.targetAmount - saving.currentAmount, 0),
        progressPercent,
        totalInflow,
        totalOutflow,
        unreadNotifications: 1,
      },
      items,
    };
  },

  createSaving: async (payload: UpsertSavingPayload, token?: string) => {
    const initialAmount = Number(payload.currentAmount ?? 0);
    const normalizedAccountId = payload.sourceId ? Number(payload.sourceId) : undefined;
    if (initialAmount > 0 && (normalizedAccountId == null || Number.isNaN(normalizedAccountId))) {
      throw new Error('Nguồn tiền không hợp lệ để ghi nhận số tiền tiết kiệm ban đầu.');
    }

    const body = {
      name: payload.name,
      targetAmount: payload.targetAmount,
      startDate: payload.startDate,
      endDate: payload.endDate,
      description: payload.description,
      icon: payload.iconKey,
      color: payload.color,
      currentAmount: initialAmount > 0 ? initialAmount : undefined,
      accountId: initialAmount > 0 ? normalizedAccountId : undefined,
    };

    const response = await request<{ result: any }>(SAVINGS_ENDPOINTS.create, {
      method: 'POST',
      body,
      token,
    });

    return { success: true, savingId: response.result.id.toString() } satisfies SavingActionResponse;
  },

  updateSaving: async (savingId: string, payload: UpsertSavingPayload, token?: string) => {
    const body = {
      name: payload.name,
      targetAmount: payload.targetAmount,
      startDate: payload.startDate,
      endDate: payload.endDate,
      description: payload.description,
      icon: payload.iconKey,
      color: payload.color,
    };

    await request(SAVINGS_ENDPOINTS.update(savingId), {
      method: 'PUT',
      body,
      token,
    });

    return { success: true, savingId } satisfies SavingActionResponse;
  },

  deleteSaving: async (savingId: string, token?: string) => {
    await request(SAVINGS_ENDPOINTS.remove(savingId), {
      method: 'DELETE',
      token,
    });

    return { success: true, savingId } satisfies SavingActionResponse;
  },

  createSavingTransaction: async (savingId: string, payload: CreateSavingTransactionPayload, token?: string) => {
    const rawDepositDate = payload.depositDate || payload.dateIso;
    const normalizedDepositDate = toLocalDateStart(rawDepositDate);

    const normalizedTitle = payload.title?.trim();
    const normalizedNote = payload.note?.trim();

    const body = {
      goalId: parseInt(savingId),
      amount: payload.amount,
      accountId: payload.accountId,
      depositDate: normalizedDepositDate,
      note:
        normalizedTitle && normalizedNote
          ? `${normalizedTitle} | ${normalizedNote}`
          : (normalizedTitle || normalizedNote || undefined),
    };

    const response = await request<{ result: any }>(SAVINGS_ENDPOINTS.deposits, {
      method: 'POST',
      body,
      token,
    });

    const deposit = response.result ?? response;
    return { success: true, transactionId: deposit.id.toString() } satisfies SavingActionResponse;
  },

  deleteSavingTransaction: async (savingId: string, transactionId: string, token?: string) => {
    await request(SAVINGS_ENDPOINTS.removeTransaction(transactionId), {
      method: 'DELETE',
      token,
    });

    return { success: true, transactionId } satisfies SavingActionResponse;
  },
};
