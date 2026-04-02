import { request } from './httpClient';
import {
  type TransactionActionResponse,
  type CreateTransactionPayload,
  type CreateTransactionResponse,
  type TransactionDetail,
  type TransactionDashboard,
  type TransactionFilter,
  type TransactionFormOptions,
  type TransactionItem,
  type UpdateTransactionPayload,
} from '../types/transaction';

const TRANSACTION_API_USE_MOCK = true;

const TRANSACTION_ENDPOINTS = {
  dashboard: '/transactions/dashboard',
  formOptions: '/transactions/form-options',
  create: '/transactions',
  detail: (id: string) => `/transactions/${id}`,
  update: (id: string) => `/transactions/${id}`,
  remove: (id: string) => `/transactions/${id}`,
};

let mockItems: TransactionItem[] = [
  {
    id: 'txn-1',
    monthLabel: 'April',
    title: 'Lương',
    timeLabel: '18:27 - April 30',
    note: 'Lương T3',
    amount: 4000000,
    kind: 'income',
    iconKey: 'salary',
  },
  {
    id: 'txn-2',
    monthLabel: 'April',
    title: 'Thực Phẩm',
    timeLabel: '17:00 - April 24',
    note: 'Đồ hộp',
    amount: -100000,
    kind: 'expense',
    iconKey: 'food',
  },
  {
    id: 'txn-3',
    monthLabel: 'April',
    title: 'Tiền Nhà',
    timeLabel: '8:30 - April 15',
    note: 'Trọ T3',
    amount: -674400,
    kind: 'expense',
    iconKey: 'rent',
  },
  {
    id: 'txn-4',
    monthLabel: 'April',
    title: 'Đi Chuyển',
    timeLabel: '7:30 - April 08',
    note: 'Xăng',
    amount: -54130,
    kind: 'expense',
    iconKey: 'transport',
  },
  {
    id: 'txn-5',
    monthLabel: 'March',
    title: 'Ăn Uống',
    timeLabel: '19:30 - March 31',
    note: 'Bữa tối',
    amount: -70400,
    kind: 'expense',
    iconKey: 'other',
  },
];

const mockFormOptions: TransactionFormOptions = {
  categories: [
    { id: 'food', label: 'Thực Phẩm', type: 'expense' },
    { id: 'rent', label: 'Tiền Nhà', type: 'expense' },
    { id: 'transport', label: 'Đi Chuyển', type: 'expense' },
    { id: 'salary', label: 'Lương', type: 'income' },
    { id: 'bonus', label: 'Thưởng', type: 'income' },
  ],
  sources: [
    { id: 'cash', label: 'Tiền mặt' },
    { id: 'bank', label: 'Tài khoản ngân hàng' },
    { id: 'ewallet', label: 'Ví điện tử' },
  ],
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const monthLabelFromDate = (dateIso: string) => {
  const date = new Date(dateIso);
  return date.toLocaleString('en-US', { month: 'long' });
};

const timeLabelFromDate = (dateIso: string) => {
  const date = new Date(dateIso);
  const month = date.toLocaleString('en-US', { month: 'long' });
  const day = String(date.getDate()).padStart(2, '0');
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} - ${month} ${day}`;
};

const iconByCategoryId = (categoryId: string, type: TransactionType): TransactionItem['iconKey'] => {
  const expenseMap: Record<string, TransactionItem['iconKey']> = {
    food: 'food',
    rent: 'rent',
    transport: 'transport',
    other: 'other',
  };

  if (type === 'income') {
    return 'salary';
  }

  return expenseMap[categoryId] ?? 'other';
};

const filterItems = (items: TransactionItem[], filter: TransactionFilter) => {
  if (filter === 'all') {
    return items;
  }

  return items.filter((item) => item.kind === filter);
};

const buildMockDetail = (item: TransactionItem): TransactionDetail => {
  const categoryMap: Record<TransactionItem['iconKey'], { id: string; label: string }> = {
    salary: { id: 'salary', label: 'Lương' },
    food: { id: 'food', label: 'Thực Phẩm' },
    rent: { id: 'rent', label: 'Tiền Nhà' },
    transport: { id: 'transport', label: 'Đi Chuyển' },
    other: { id: 'other', label: 'Khác' },
  };

  return {
    id: item.id,
    date: new Date().toISOString(),
    type: item.kind,
    categoryId: categoryMap[item.iconKey].id,
    categoryLabel: categoryMap[item.iconKey].label,
    amount: Math.abs(item.amount),
    title: item.title,
    sourceId: 'cash',
    sourceLabel: 'Tiền mặt',
    detail: item.note,
    note: item.note,
    timeLabel: item.timeLabel,
    iconKey: item.iconKey,
  };
};

export const transactionApi = {
  getDashboard: async (filter: TransactionFilter = 'all', token?: string) => {
    if (TRANSACTION_API_USE_MOCK) {
      await sleep(220);
      return {
        overview: {
          totalBalance: 5000000,
          totalIncome: 4120000,
          totalExpense: 1187400,
          unreadNotifications: 1,
        },
        items: filterItems(mockItems, filter),
      } satisfies TransactionDashboard;
    }

    return request<TransactionDashboard>(`${TRANSACTION_ENDPOINTS.dashboard}?filter=${filter}`, { token });
  },

  getFormOptions: async (token?: string) => {
    if (TRANSACTION_API_USE_MOCK) {
      await sleep(120);
      return mockFormOptions;
    }

    return request<TransactionFormOptions>(TRANSACTION_ENDPOINTS.formOptions, { token });
  },

  createTransaction: async (payload: CreateTransactionPayload, token?: string) => {
    if (TRANSACTION_API_USE_MOCK) {
      await sleep(180);
      const transactionId = `txn-${Date.now()}`;
      mockItems = [
        {
          id: transactionId,
          monthLabel: monthLabelFromDate(payload.date),
          title: payload.title,
          timeLabel: timeLabelFromDate(payload.date),
          note: payload.detail || 'Giao dịch mới',
          amount: payload.type === 'expense' ? -Math.abs(payload.amount) : Math.abs(payload.amount),
          kind: payload.type,
          iconKey: iconByCategoryId(payload.categoryId, payload.type),
        },
        ...mockItems,
      ];

      return {
        success: true,
        transactionId,
      } satisfies CreateTransactionResponse;
    }

    return request<CreateTransactionResponse>(TRANSACTION_ENDPOINTS.create, {
      method: 'POST',
      body: {
        date: payload.date,
        type: payload.type,
        categoryId: payload.categoryId,
        amount: payload.amount,
        title: payload.title,
        sourceId: payload.sourceId,
        detail: payload.detail,
      },
      token,
    });
  },

  getTransactionDetail: async (transactionId: string, token?: string) => {
    if (TRANSACTION_API_USE_MOCK) {
      await sleep(140);
      const found = mockItems.find((item) => item.id === transactionId);
      if (!found) {
        throw new Error('Transaction not found');
      }

      return buildMockDetail(found);
    }

    return request<TransactionDetail>(TRANSACTION_ENDPOINTS.detail(transactionId), { token });
  },

  updateTransaction: async (transactionId: string, payload: UpdateTransactionPayload, token?: string) => {
    if (TRANSACTION_API_USE_MOCK) {
      await sleep(180);
      mockItems = mockItems.map((item) => {
        if (item.id !== transactionId) {
          return item;
        }

        const nextAmount = payload.type === 'expense' ? -Math.abs(payload.amount) : Math.abs(payload.amount);
        return {
          ...item,
          monthLabel: monthLabelFromDate(payload.date),
          timeLabel: timeLabelFromDate(payload.date),
          title: payload.title,
          note: payload.detail || item.note,
          amount: nextAmount,
          kind: payload.type,
          iconKey: iconByCategoryId(payload.categoryId, payload.type),
        };
      });

      return { success: true } satisfies TransactionActionResponse;
    }

    return request<TransactionActionResponse>(TRANSACTION_ENDPOINTS.update(transactionId), {
      method: 'PUT',
      body: {
        date: payload.date,
        type: payload.type,
        categoryId: payload.categoryId,
        amount: payload.amount,
        title: payload.title,
        sourceId: payload.sourceId,
        detail: payload.detail,
      },
      token,
    });
  },

  deleteTransaction: async (transactionId: string, token?: string) => {
    if (TRANSACTION_API_USE_MOCK) {
      await sleep(150);
      mockItems = mockItems.filter((item) => item.id !== transactionId);
      return { success: true } satisfies TransactionActionResponse;
    }

    return request<TransactionActionResponse>(TRANSACTION_ENDPOINTS.remove(transactionId), {
      method: 'DELETE',
      token,
    });
  },
};