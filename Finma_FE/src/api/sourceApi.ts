import { request } from './httpClient';
import {
  type MoneySourceActionResponse,
  type MoneySourceDashboard,
  type MoneySourceItem,
  type MoneySourceTransactionsResponse,
  type SourceTransactionItem,
  type UpsertMoneySourcePayload,
  type UpsertMoneySourceResponse,
} from '../types/source';

const SOURCE_API_USE_MOCK = true;

const SOURCE_ENDPOINTS = {
  dashboard: '/money-sources/dashboard',
  create: '/money-sources',
  update: (id: string) => `/money-sources/${id}`,
  remove: (id: string) => `/money-sources/${id}`,
  transactions: (id: string) => `/money-sources/${id}/transactions`,
};

let mockSources: MoneySourceItem[] = [
  { id: 'acc-1', name: 'Tiền mặt', subtitle: 'Tiền mặt', balance: 5000000, type: 'cash' },
  { id: 'acc-2', name: 'Ngân hàng', subtitle: 'Ngân hàng', balance: 45000000, type: 'bank' },
  { id: 'acc-3', name: 'Thẻ tín dụng', subtitle: 'Thẻ tín dụng', balance: 15000000, type: 'card' },
];

let mockTransactions: SourceTransactionItem[] = [
  {
    id: 'src-txn-1',
    sourceId: 'acc-1',
    monthLabel: 'April',
    title: 'Ăn Tối',
    timeLabel: '18:27 - April 30',
    note: 'Bữa tối',
    amount: -26000,
    kind: 'expense',
    iconKey: 'food',
  },
  {
    id: 'src-txn-2',
    sourceId: 'acc-1',
    monthLabel: 'April',
    title: 'Mì Cay',
    timeLabel: '15:00 - April 24',
    note: 'Ăn trưa',
    amount: -18350,
    kind: 'expense',
    iconKey: 'food',
  },
  {
    id: 'src-txn-3',
    sourceId: 'acc-1',
    monthLabel: 'April',
    title: 'Bữa Trưa',
    timeLabel: '12:30 - April 15',
    note: 'Cơm văn phòng',
    amount: -15400,
    kind: 'expense',
    iconKey: 'food',
  },
  {
    id: 'src-txn-4',
    sourceId: 'acc-1',
    monthLabel: 'April',
    title: 'Ăn Sáng',
    timeLabel: '09:30 - April 08',
    note: 'Bánh mì + cafe',
    amount: -12130,
    kind: 'expense',
    iconKey: 'food',
  },
  {
    id: 'src-txn-5',
    sourceId: 'acc-1',
    monthLabel: 'March',
    title: 'Ăn Tối',
    timeLabel: '20:50 - March 31',
    note: 'Lẩu',
    amount: -27200,
    kind: 'expense',
    iconKey: 'food',
  },
  {
    id: 'src-txn-6',
    sourceId: 'acc-2',
    monthLabel: 'April',
    title: 'Lương',
    timeLabel: '08:30 - April 01',
    note: 'Lương tháng',
    amount: 12000000,
    kind: 'income',
    iconKey: 'salary',
  },
  {
    id: 'src-txn-7',
    sourceId: 'acc-3',
    monthLabel: 'April',
    title: 'Mua Sắm',
    timeLabel: '19:00 - April 12',
    note: 'Đồ gia dụng',
    amount: -550000,
    kind: 'expense',
    iconKey: 'other',
  },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const buildDashboard = (): MoneySourceDashboard => {
  const totalBalance = mockSources.reduce((sum, item) => sum + item.balance, 0);

  return {
    summary: {
      totalBalance,
      totalAccounts: mockSources.length,
      unreadNotifications: 1,
    },
    items: mockSources,
  };
};

const buildSourceTransactions = (sourceId: string): MoneySourceTransactionsResponse => {
  const source = mockSources.find((item) => item.id === sourceId);
  if (!source) {
    throw new Error('Money source not found');
  }

  const items = mockTransactions.filter((item) => item.sourceId === sourceId);
  const totalExpense = items
    .filter((item) => item.kind === 'expense')
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const totalIncome = items
    .filter((item) => item.kind === 'income')
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);

  return {
    source,
    overview: {
      balance: source.balance,
      totalExpense,
      totalIncome,
      unreadNotifications: 1,
    },
    items,
  };
};

export const sourceApi = {
  getDashboard: async (token?: string) => {
    if (SOURCE_API_USE_MOCK) {
      await sleep(180);
      return buildDashboard();
    }

    return request<MoneySourceDashboard>(SOURCE_ENDPOINTS.dashboard, { token });
  },

  createSource: async (payload: UpsertMoneySourcePayload, token?: string) => {
    if (SOURCE_API_USE_MOCK) {
      await sleep(140);
      const sourceId = `acc-${Date.now()}`;
      mockSources = [{ id: sourceId, ...payload }, ...mockSources];

      return {
        success: true,
        sourceId,
      } satisfies UpsertMoneySourceResponse;
    }

    return request<UpsertMoneySourceResponse>(SOURCE_ENDPOINTS.create, {
      method: 'POST',
      body: payload,
      token,
    });
  },

  updateSource: async (sourceId: string, payload: UpsertMoneySourcePayload, token?: string) => {
    if (SOURCE_API_USE_MOCK) {
      await sleep(120);
      mockSources = mockSources.map((item) => {
        if (item.id !== sourceId) {
          return item;
        }

        return { ...item, ...payload };
      });

      return {
        success: true,
        sourceId,
      } satisfies UpsertMoneySourceResponse;
    }

    return request<UpsertMoneySourceResponse>(SOURCE_ENDPOINTS.update(sourceId), {
      method: 'PUT',
      body: payload,
      token,
    });
  },

  deleteSource: async (sourceId: string, token?: string) => {
    if (SOURCE_API_USE_MOCK) {
      await sleep(120);
      mockSources = mockSources.filter((item) => item.id !== sourceId);
      mockTransactions = mockTransactions.filter((item) => item.sourceId !== sourceId);
      return { success: true } satisfies MoneySourceActionResponse;
    }

    return request<MoneySourceActionResponse>(SOURCE_ENDPOINTS.remove(sourceId), {
      method: 'DELETE',
      token,
    });
  },

  getSourceTransactions: async (sourceId: string, token?: string) => {
    if (SOURCE_API_USE_MOCK) {
      await sleep(180);
      return buildSourceTransactions(sourceId);
    }

    return request<MoneySourceTransactionsResponse>(SOURCE_ENDPOINTS.transactions(sourceId), { token });
  },
};
