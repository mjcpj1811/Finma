import { request } from './httpClient';
import {
  type DebtActionResponse,
  type DebtsDashboard,
  type DebtItem,
  type DebtTransactionActionResponse,
  type DebtTransactionItem,
  type DebtTransactionsResponse,
  type UpsertDebtPayload,
  type UpsertDebtTransactionPayload,
} from '../types/debt';

const DEBT_API_USE_MOCK = true;

const DEBT_ENDPOINTS = {
  dashboard: '/debts/dashboard',
  create: '/debts',
  update: (id: string) => `/debts/${id}`,
  remove: (id: string) => `/debts/${id}`,
  transactions: (id: string) => `/debts/${id}/transactions`,
  updateTransaction: (debtId: string, transactionId: string) => `/debts/${debtId}/transactions/${transactionId}`,
  removeTransaction: (debtId: string, transactionId: string) => `/debts/${debtId}/transactions/${transactionId}`,
};

let mockDebts: DebtItem[] = [
  {
    id: 'debt-1',
    name: 'Nguyễn Văn A',
    direction: 'lend',
    principalAmount: 950000,
    remainingAmount: 650000,
    iconKey: 'payments',
  },
  {
    id: 'debt-2',
    name: 'Nguyễn Văn B',
    direction: 'borrow',
    principalAmount: 550000,
    remainingAmount: 550000,
    iconKey: 'account-balance-wallet',
  },
  {
    id: 'debt-3',
    name: 'Nguyễn Văn C',
    direction: 'lend',
    principalAmount: 780000,
    remainingAmount: 250000,
    iconKey: 'groups',
  },
];

let mockDebtTransactions: DebtTransactionItem[] = [
  {
    id: 'debt-txn-1',
    debtId: 'debt-1',
    dateIso: '2026-04-30T16:56:00.000Z',
    monthLabel: 'April',
    title: 'Nguyễn Văn A',
    timeLabel: '16:56 - April 30',
    counterparty: 'Cho vay',
    amount: 950000,
    kind: 'borrow',
  },
  {
    id: 'debt-txn-2',
    debtId: 'debt-1',
    dateIso: '2026-04-14T17:42:00.000Z',
    monthLabel: 'April',
    title: 'Nguyễn Văn A',
    timeLabel: '17:42 - April 14',
    counterparty: 'Vay',
    amount: 650000,
    kind: 'repay',
  },
  {
    id: 'debt-txn-3',
    debtId: 'debt-1',
    dateIso: '2026-04-02T13:30:00.000Z',
    monthLabel: 'April',
    title: 'Nguyễn Văn A',
    timeLabel: '13:30 - April 02',
    counterparty: 'Cho vay',
    amount: 300000,
    kind: 'borrow',
  },
  {
    id: 'debt-txn-4',
    debtId: 'debt-2',
    dateIso: '2026-04-18T10:20:00.000Z',
    monthLabel: 'April',
    title: 'Nguyễn Văn B',
    timeLabel: '10:20 - April 18',
    counterparty: 'Đi vay',
    amount: 550000,
    kind: 'borrow',
  },
  {
    id: 'debt-txn-5',
    debtId: 'debt-3',
    dateIso: '2026-04-11T11:11:00.000Z',
    monthLabel: 'April',
    title: 'Nguyễn Văn C',
    timeLabel: '11:11 - April 11',
    counterparty: 'Trả nợ',
    amount: 530000,
    kind: 'repay',
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

const applyTransactionDelta = (debt: DebtItem, kind: DebtTransactionItem['kind'], amount: number, reverse = false): DebtItem => {
  const signed = reverse ? -amount : amount;

  if (kind === 'borrow') {
    return {
      ...debt,
      principalAmount: Math.max(debt.principalAmount + signed, 0),
      remainingAmount: Math.max(debt.remainingAmount + signed, 0),
    };
  }

  return {
    ...debt,
    remainingAmount: Math.max(debt.remainingAmount - signed, 0),
  };
};

const buildDashboard = (): DebtsDashboard => ({
  overview: {
    totalPrincipal: mockDebts.reduce((sum, item) => sum + item.principalAmount, 0),
    totalRemaining: mockDebts.reduce((sum, item) => sum + item.remainingAmount, 0),
    unreadNotifications: 1,
  },
  items: mockDebts,
});

const buildDebtTransactions = (debtId: string): DebtTransactionsResponse => {
  const debt = mockDebts.find((item) => item.id === debtId);
  if (!debt) {
    throw new Error('Debt item not found');
  }

  const items = mockDebtTransactions.filter((item) => item.debtId === debtId);

  return {
    debt,
    overview: {
      totalBorrowed: items.filter((item) => item.kind === 'borrow').reduce((sum, item) => sum + Math.abs(item.amount), 0),
      totalRepaid: items.filter((item) => item.kind === 'repay').reduce((sum, item) => sum + Math.abs(item.amount), 0),
      remainingAmount: debt.remainingAmount,
      unreadNotifications: 1,
    },
    items,
  };
};

export const debtApi = {
  getDashboard: async (token?: string) => {
    if (DEBT_API_USE_MOCK) {
      await sleep(130);
      return buildDashboard();
    }

    return request<DebtsDashboard>(DEBT_ENDPOINTS.dashboard, { token });
  },

  getDebtTransactions: async (debtId: string, token?: string) => {
    if (DEBT_API_USE_MOCK) {
      await sleep(150);
      return buildDebtTransactions(debtId);
    }

    return request<DebtTransactionsResponse>(DEBT_ENDPOINTS.transactions(debtId), { token });
  },

  createDebt: async (payload: UpsertDebtPayload, token?: string) => {
    if (DEBT_API_USE_MOCK) {
      await sleep(120);
      const debtId = `debt-${Date.now()}`;
      mockDebts = [
        ...mockDebts,
        {
          id: debtId,
          name: payload.name.trim(),
          direction: payload.direction,
          principalAmount: payload.principalAmount,
          remainingAmount: payload.remainingAmount,
          iconKey: payload.iconKey,
        },
      ];

      return { success: true, debtId } satisfies DebtActionResponse;
    }

    return request<DebtActionResponse>(DEBT_ENDPOINTS.create, {
      method: 'POST',
      body: payload,
      token,
    });
  },

  updateDebt: async (debtId: string, payload: UpsertDebtPayload, token?: string) => {
    if (DEBT_API_USE_MOCK) {
      await sleep(120);
      mockDebts = mockDebts.map((item) => {
        if (item.id !== debtId) {
          return item;
        }

        return {
          ...item,
          name: payload.name.trim(),
          direction: payload.direction,
          principalAmount: payload.principalAmount,
          remainingAmount: payload.remainingAmount,
          iconKey: payload.iconKey,
        };
      });

      return { success: true, debtId } satisfies DebtActionResponse;
    }

    return request<DebtActionResponse>(DEBT_ENDPOINTS.update(debtId), {
      method: 'PUT',
      body: payload,
      token,
    });
  },

  deleteDebt: async (debtId: string, token?: string) => {
    if (DEBT_API_USE_MOCK) {
      await sleep(120);
      mockDebts = mockDebts.filter((item) => item.id !== debtId);
      mockDebtTransactions = mockDebtTransactions.filter((item) => item.debtId !== debtId);
      return { success: true, debtId } satisfies DebtActionResponse;
    }

    return request<DebtActionResponse>(DEBT_ENDPOINTS.remove(debtId), {
      method: 'DELETE',
      token,
    });
  },

  createDebtTransaction: async (debtId: string, payload: UpsertDebtTransactionPayload, token?: string) => {
    if (DEBT_API_USE_MOCK) {
      await sleep(120);
      const debt = mockDebts.find((item) => item.id === debtId);
      if (!debt) {
        return { success: false, message: 'Không tìm thấy khoản nợ/vay.' } satisfies DebtTransactionActionResponse;
      }

      const transactionId = `debt-txn-${Date.now()}`;

      mockDebtTransactions = [
        {
          id: transactionId,
          debtId,
          dateIso: payload.dateIso,
          monthLabel: toMonthLabel(payload.dateIso),
          title: payload.title.trim(),
          timeLabel: toTimeLabel(payload.dateIso),
          counterparty: payload.counterparty.trim(),
          amount: Math.abs(payload.amount),
          kind: payload.kind,
        },
        ...mockDebtTransactions,
      ];

      mockDebts = mockDebts.map((item) => (item.id === debtId ? applyTransactionDelta(item, payload.kind, Math.abs(payload.amount)) : item));

      return { success: true, transactionId } satisfies DebtTransactionActionResponse;
    }

    return request<DebtTransactionActionResponse>(DEBT_ENDPOINTS.transactions(debtId), {
      method: 'POST',
      body: payload,
      token,
    });
  },

  updateDebtTransaction: async (
    debtId: string,
    transactionId: string,
    payload: UpsertDebtTransactionPayload,
    token?: string,
  ) => {
    if (DEBT_API_USE_MOCK) {
      await sleep(120);
      const previous = mockDebtTransactions.find((item) => item.id === transactionId && item.debtId === debtId);
      if (!previous) {
        return { success: false, message: 'Không tìm thấy giao dịch.' } satisfies DebtTransactionActionResponse;
      }

      mockDebts = mockDebts.map((item) => {
        if (item.id !== debtId) {
          return item;
        }

        const reverted = applyTransactionDelta(item, previous.kind, Math.abs(previous.amount), true);
        return applyTransactionDelta(reverted, payload.kind, Math.abs(payload.amount));
      });

      mockDebtTransactions = mockDebtTransactions.map((item) => {
        if (item.id !== transactionId || item.debtId !== debtId) {
          return item;
        }

        return {
          ...item,
          dateIso: payload.dateIso,
          monthLabel: toMonthLabel(payload.dateIso),
          title: payload.title.trim(),
          timeLabel: toTimeLabel(payload.dateIso),
          counterparty: payload.counterparty.trim(),
          amount: Math.abs(payload.amount),
          kind: payload.kind,
        };
      });

      return { success: true, transactionId } satisfies DebtTransactionActionResponse;
    }

    return request<DebtTransactionActionResponse>(DEBT_ENDPOINTS.updateTransaction(debtId, transactionId), {
      method: 'PUT',
      body: payload,
      token,
    });
  },

  deleteDebtTransaction: async (debtId: string, transactionId: string, token?: string) => {
    if (DEBT_API_USE_MOCK) {
      await sleep(120);
      const previous = mockDebtTransactions.find((item) => item.id === transactionId && item.debtId === debtId);
      if (!previous) {
        return { success: false, message: 'Không tìm thấy giao dịch.' } satisfies DebtTransactionActionResponse;
      }

      mockDebts = mockDebts.map((item) => {
        if (item.id !== debtId) {
          return item;
        }
        return applyTransactionDelta(item, previous.kind, Math.abs(previous.amount), true);
      });

      mockDebtTransactions = mockDebtTransactions.filter((item) => !(item.id === transactionId && item.debtId === debtId));
      return { success: true, transactionId } satisfies DebtTransactionActionResponse;
    }

    return request<DebtTransactionActionResponse>(DEBT_ENDPOINTS.removeTransaction(debtId, transactionId), {
      method: 'DELETE',
      token,
    });
  },
};
