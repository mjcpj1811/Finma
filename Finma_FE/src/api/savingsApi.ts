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

const SAVINGS_API_USE_MOCK = true;

const SAVINGS_ENDPOINTS = {
  dashboard: '/savings/dashboard',
  create: '/savings',
  update: (id: string) => `/savings/${id}`,
  remove: (id: string) => `/savings/${id}`,
  transactions: (id: string) => `/savings/${id}/transactions`,
};

let mockSavings: SavingItem[] = [
  {
    id: 'sav-1',
    name: 'Tiết Kiệm Du Lịch',
    targetAmount: 1962930,
    currentAmount: 655310,
    iconKey: 'flight',
  },
  {
    id: 'sav-2',
    name: 'Mua Nhà',
    targetAmount: 2500000,
    currentAmount: 200000,
    iconKey: 'home-work',
  },
  {
    id: 'sav-3',
    name: 'Mua Xe',
    targetAmount: 2000000,
    currentAmount: 180000,
    iconKey: 'directions-car',
  },
  {
    id: 'sav-4',
    name: 'Đám Cưới',
    targetAmount: 1320070,
    currentAmount: 152090,
    iconKey: 'savings',
  },
];

let mockSavingTransactions: SavingTransactionItem[] = [
  {
    id: 'sav-txn-1',
    savingId: 'sav-1',
    monthLabel: 'April',
    title: 'Tiết Kiệm Du Lịch',
    timeLabel: '16:56 - April 30',
    note: 'Nạp quỹ',
    amount: 201770,
    kind: 'deposit',
  },
  {
    id: 'sav-txn-2',
    savingId: 'sav-1',
    monthLabel: 'April',
    title: 'Tiết Kiệm Du Lịch',
    timeLabel: '17:42 - April 14',
    note: 'Nạp quỹ',
    amount: 201770,
    kind: 'deposit',
  },
  {
    id: 'sav-txn-3',
    savingId: 'sav-1',
    monthLabel: 'April',
    title: 'Tiết Kiệm Du Lịch',
    timeLabel: '13:29 - April 02',
    note: 'Nạp quỹ',
    amount: 201770,
    kind: 'deposit',
  },
  {
    id: 'sav-txn-4',
    savingId: 'sav-2',
    monthLabel: 'April',
    title: 'Tiết Kiệm Mua Nhà',
    timeLabel: '09:10 - April 21',
    note: 'Nạp quỹ',
    amount: 1000000,
    kind: 'deposit',
  },
  {
    id: 'sav-txn-5',
    savingId: 'sav-3',
    monthLabel: 'April',
    title: 'Tiết Kiệm Mua Xe',
    timeLabel: '11:05 - April 10',
    note: 'Rút quỹ',
    amount: -200000,
    kind: 'withdraw',
  },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toMonthLabel = (dateIso: string) => {
  const date = new Date(dateIso);
  return date.toLocaleString('en-US', { month: 'long' });
};

const toTimeLabel = (dateIso: string) => {
  const date = new Date(dateIso);
  const month = date.toLocaleString('en-US', { month: 'long' });
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')} - ${month} ${day}`;
};

const formatProgress = (current: number, target: number) => {
  if (!target || target <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
};

const buildDashboard = (): SavingsDashboard => {
  const totalSaved = mockSavings.reduce((sum, item) => sum + item.currentAmount, 0);
  const totalTarget = mockSavings.reduce((sum, item) => sum + item.targetAmount, 0);

  return {
    overview: {
      totalSaved,
      totalTarget,
      unreadNotifications: 1,
    },
    items: mockSavings,
  };
};

const buildSavingTransactions = (savingId: string): SavingTransactionsResponse => {
  const saving = mockSavings.find((item) => item.id === savingId);
  if (!saving) {
    throw new Error('Saving item not found');
  }

  const items = mockSavingTransactions.filter((item) => item.savingId === savingId);
  const totalInflow = items
    .filter((item) => item.kind === 'deposit')
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const totalOutflow = items
    .filter((item) => item.kind === 'withdraw')
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);

  return {
    saving,
    overview: {
      saved: saving.currentAmount,
      target: saving.targetAmount,
      remaining: Math.max(saving.targetAmount - saving.currentAmount, 0),
      progressPercent: formatProgress(saving.currentAmount, saving.targetAmount),
      totalInflow,
      totalOutflow,
      unreadNotifications: 1,
    },
    items,
  };
};

export const savingsApi = {
  getDashboard: async (token?: string) => {
    if (SAVINGS_API_USE_MOCK) {
      await sleep(150);
      return buildDashboard();
    }

    return request<SavingsDashboard>(SAVINGS_ENDPOINTS.dashboard, { token });
  },

  getSavingTransactions: async (savingId: string, token?: string) => {
    if (SAVINGS_API_USE_MOCK) {
      await sleep(150);
      return buildSavingTransactions(savingId);
    }

    return request<SavingTransactionsResponse>(SAVINGS_ENDPOINTS.transactions(savingId), { token });
  },

  createSaving: async (payload: UpsertSavingPayload, token?: string) => {
    if (SAVINGS_API_USE_MOCK) {
      await sleep(120);
      const savingId = `sav-${Date.now()}`;
      mockSavings = [
        ...mockSavings,
        {
          id: savingId,
          name: payload.name.trim(),
          targetAmount: payload.targetAmount,
          currentAmount: payload.currentAmount,
          iconKey: payload.iconKey,
        },
      ];

      return { success: true, savingId } satisfies SavingActionResponse;
    }

    return request<SavingActionResponse>(SAVINGS_ENDPOINTS.create, {
      method: 'POST',
      body: payload,
      token,
    });
  },

  updateSaving: async (savingId: string, payload: UpsertSavingPayload, token?: string) => {
    if (SAVINGS_API_USE_MOCK) {
      await sleep(120);
      mockSavings = mockSavings.map((item) => {
        if (item.id !== savingId) {
          return item;
        }

        return {
          ...item,
          name: payload.name.trim(),
          targetAmount: payload.targetAmount,
          currentAmount: payload.currentAmount,
          iconKey: payload.iconKey,
        };
      });

      return { success: true, savingId } satisfies SavingActionResponse;
    }

    return request<SavingActionResponse>(SAVINGS_ENDPOINTS.update(savingId), {
      method: 'PUT',
      body: payload,
      token,
    });
  },

  deleteSaving: async (savingId: string, token?: string) => {
    if (SAVINGS_API_USE_MOCK) {
      await sleep(120);
      mockSavings = mockSavings.filter((item) => item.id !== savingId);
      mockSavingTransactions = mockSavingTransactions.filter((item) => item.savingId !== savingId);
      return { success: true, savingId } satisfies SavingActionResponse;
    }

    return request<SavingActionResponse>(SAVINGS_ENDPOINTS.remove(savingId), {
      method: 'DELETE',
      token,
    });
  },

  createSavingTransaction: async (savingId: string, payload: CreateSavingTransactionPayload, token?: string) => {
    if (SAVINGS_API_USE_MOCK) {
      await sleep(120);
      const saving = mockSavings.find((item) => item.id === savingId);
      if (!saving) {
        return { success: false, message: 'Không tìm thấy khoản tiết kiệm.' } satisfies SavingActionResponse;
      }

      const transactionId = `sav-txn-${Date.now()}`;
      const signedAmount = payload.kind === 'deposit' ? Math.abs(payload.amount) : -Math.abs(payload.amount);

      mockSavingTransactions = [
        {
          id: transactionId,
          savingId,
          monthLabel: toMonthLabel(payload.dateIso),
          title: payload.title.trim(),
          timeLabel: toTimeLabel(payload.dateIso),
          note: payload.note.trim() || (payload.kind === 'deposit' ? 'Nạp quỹ' : 'Rút quỹ'),
          amount: signedAmount,
          kind: payload.kind,
        },
        ...mockSavingTransactions,
      ];

      mockSavings = mockSavings.map((item) => {
        if (item.id !== savingId) {
          return item;
        }

        const nextAmount = payload.kind === 'deposit'
          ? item.currentAmount + Math.abs(payload.amount)
          : Math.max(item.currentAmount - Math.abs(payload.amount), 0);

        return {
          ...item,
          currentAmount: nextAmount,
        };
      });

      return { success: true, transactionId } satisfies SavingActionResponse;
    }

    return request<SavingActionResponse>(`${SAVINGS_ENDPOINTS.transactions(savingId)}`, {
      method: 'POST',
      body: payload,
      token,
    });
  },
};
