import { request } from './httpClient';
import { categoryApi } from './categoryApi';
import {
  type TransactionActionResponse,
  type CreateTransactionPayload,
  type CreateTransactionResponse,
  type TransactionDetail,
  type TransactionDashboard,
  type TransactionFilter,
  type TransactionFormOptions,
  type TransactionItem,
  type TransactionType,
  type UpdateTransactionPayload,
} from '../types/transaction';

const TRANSACTION_API_USE_MOCK = false;

const TRANSACTION_ENDPOINTS = {
  list: '/transactions',
  accounts: '/accounts',
  create: '/transactions',
  detail: (id: string) => `/transactions/${id}`,
  update: (id: string) => `/transactions/${id}`,
  remove: (id: string) => `/transactions/${id}`,
};

type ApiResponse<T> = {
  code: number;
  message?: string;
  result: T;
};

type BackendTransactionType = 'INCOME' | 'EXPENSE';

type BackendTransactionItem = {
  id: number;
  type: BackendTransactionType;
  amount: number;
  categoryId: number;
  category: string;
  accountId: number;
  account: string;
  note?: string | null;
  date?: string | null;
  transactionDateTime?: string | null;
};

type BackendTransactionDetail = {
  id: number;
  type: BackendTransactionType;
  amount: number;
  categoryId: number;
  categoryName: string;
  accountId: number;
  accountName: string;
  note?: string | null;
  transactionDate: string;
};

type BackendAccount = {
  id: number;
  name: string;
  balance?: number;
};

let mockItems: TransactionItem[] = [
  {
    id: 'txn-1',
    categoryId: 'salary',
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
    categoryId: 'food',
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
    categoryId: 'rent',
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
    categoryId: 'transport',
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
    categoryId: 'other',
    monthLabel: 'March',
    title: 'Ăn Uống',
    timeLabel: '19:30 - March 31',
    note: 'Bữa tối',
    amount: -70400,
    kind: 'expense',
    iconKey: 'other',
  },
];

let mockFormOptions: TransactionFormOptions = {
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
  return date.toLocaleString('vi-VN', { month: 'long' });
};

const timeLabelFromDate = (dateIso: string) => {
  const date = new Date(dateIso);
  const month = date.toLocaleString('vi-VN', { month: 'long' });
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
  const categoryLabel =
    mockFormOptions.categories.find((category) => category.id === item.categoryId)?.label ?? 'Khác';

  return {
    id: item.id,
    date: new Date().toISOString(),
    type: item.kind,
    categoryId: item.categoryId,
    categoryLabel,
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

const toBackendType = (type: TransactionType): BackendTransactionType => (type === 'income' ? 'INCOME' : 'EXPENSE');

const toFrontendType = (type: BackendTransactionType): TransactionType => (type === 'INCOME' ? 'income' : 'expense');

const pad2 = (value: number) => String(value).padStart(2, '0');

const toBackendDateTime = (dateIso: string) => {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Ngày giao dịch không hợp lệ');
  }

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
};

const parseBackendDateTime = (value?: string | null) => {
  if (!value) {
    return new Date();
  }

  const [datePart, timePart = '00:00:00'] = value.trim().split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second] = timePart.split(':').map(Number);

  if ([year, month, day, hour, minute, second].some((part) => Number.isNaN(part))) {
    return new Date();
  }

  return new Date(year, month - 1, day, hour, minute, second);
};

const splitNote = (rawNote?: string | null) => {
  const note = (rawNote ?? '').trim();
  if (!note) {
    return { title: 'Giao dịch', detail: '' };
  }

  const divider = ' | ';
  const dividerIndex = note.indexOf(divider);
  if (dividerIndex < 0) {
    return { title: note, detail: '' };
  }

  return {
    title: note.slice(0, dividerIndex).trim() || 'Giao dịch',
    detail: note.slice(dividerIndex + divider.length).trim(),
  };
};

const buildBackendNote = (payload: CreateTransactionPayload | UpdateTransactionPayload) => {
  const title = payload.title.trim();
  const detail = payload.detail?.trim() ?? '';
  return detail ? `${title} | ${detail}` : title;
};

const mapCategoryIconToTransactionIcon = (iconKey?: string): TransactionItem['iconKey'] => {
  switch (iconKey) {
    case 'attach_money':
      return 'salary';
    case 'restaurant':
    case 'shopping':
      return 'food';
    case 'directions_bus':
      return 'transport';
    case 'account_balance_wallet':
    case 'movie':
    case 'healing':
    case 'card_giftcard':
      return 'other';
    default:
      return 'other';
  }
};

const buildCategoryIconMap = async (token?: string) => {
  const dashboard = await categoryApi.getDashboard(token);
  const allCategories = [
    ...dashboard.groups.financial,
    ...dashboard.groups.expense,
    ...dashboard.groups.income,
  ];

  return allCategories.reduce<Record<string, TransactionItem['iconKey']>>((acc, category) => {
    acc[category.id] = mapCategoryIconToTransactionIcon(category.iconKey);
    return acc;
  }, {});
};

const mapBackendTransactionItem = (
  item: BackendTransactionItem,
  categoryIconMapById: Record<string, TransactionItem['iconKey']>,
): TransactionItem => {
  const date = parseBackendDateTime(item.transactionDateTime ?? item.date);
  const parsed = splitNote(item.note);

  return {
    id: String(item.id),
    categoryId: String(item.categoryId),
    monthLabel: date.toLocaleString('vi-VN', { month: 'long' }),
    title: parsed.title || item.category || 'Giao dịch',
    timeLabel: `${pad2(date.getHours())}:${pad2(date.getMinutes())} - ${date.toLocaleString('vi-VN', { month: 'long' })} ${pad2(date.getDate())}`,
    note: parsed.detail,
    amount: toFrontendType(item.type) === 'expense' ? -Math.abs(Number(item.amount) || 0) : Math.abs(Number(item.amount) || 0),
    kind: toFrontendType(item.type),
    iconKey: categoryIconMapById[String(item.categoryId)] ?? mapCategoryIconToTransactionIcon(),
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

    const typeQuery = filter === 'all' ? '' : `?type=${toBackendType(filter)}`;
    const [transactionResponse, accountResponse, categoryIconMapById] = await Promise.all([
      request<ApiResponse<BackendTransactionItem[]>>(`${TRANSACTION_ENDPOINTS.list}${typeQuery}`, { token }),
      request<ApiResponse<BackendAccount[]>>(TRANSACTION_ENDPOINTS.accounts, { token }),
      buildCategoryIconMap(token),
    ]);

    const items = (transactionResponse.result ?? []).map((item) =>
      mapBackendTransactionItem(item, categoryIconMapById),
    );

    const totalIncome = items
      .filter((item) => item.kind === 'income')
      .reduce((sum, item) => sum + Math.abs(item.amount), 0);

    const totalExpense = items
      .filter((item) => item.kind === 'expense')
      .reduce((sum, item) => sum + Math.abs(item.amount), 0);

    const totalBalance = (accountResponse.result ?? []).reduce(
      (sum, account) => sum + Math.abs(Number(account.balance ?? 0)),
      0,
    );

    return {
      overview: {
        totalBalance,
        totalIncome,
        totalExpense,
        unreadNotifications: 0,
      },
      items,
    } satisfies TransactionDashboard;
  },

  getFormOptions: async (token?: string) => {
    if (TRANSACTION_API_USE_MOCK) {
      await sleep(120);

      try {
        const [categoryDashboard, accountResponse] = await Promise.all([
          categoryApi.getDashboard(token),
          request<ApiResponse<BackendAccount[]>>(TRANSACTION_ENDPOINTS.accounts, { token }),
        ]);

        const categories = [
          ...categoryDashboard.groups.expense.map((item) => ({
            id: item.id,
            label: item.name,
            type: 'expense' as const,
          })),
          ...categoryDashboard.groups.income.map((item) => ({
            id: item.id,
            label: item.name,
            type: 'income' as const,
          })),
        ];

        const sources = (accountResponse.result ?? []).map((item) => ({
          id: String(item.id),
          label: item.name,
        }));

        if (categories.length > 0) {
          mockFormOptions = {
            categories,
            sources: sources.length > 0 ? sources : mockFormOptions.sources,
          };
        }
      } catch {
        // Keep fallback mock options if live options cannot be loaded.
      }

      return mockFormOptions;
    }

    const [categoryDashboard, accountResponse] = await Promise.all([
      categoryApi.getDashboard(token),
      request<ApiResponse<BackendAccount[]>>(TRANSACTION_ENDPOINTS.accounts, { token }),
    ]);

    return {
      categories: [
        ...categoryDashboard.groups.expense.map((item) => ({
          id: item.id,
          label: item.name,
          type: 'expense' as const,
        })),
        ...categoryDashboard.groups.income.map((item) => ({
          id: item.id,
          label: item.name,
          type: 'income' as const,
        })),
      ],
      sources: (accountResponse.result ?? []).map((item) => ({
        id: String(item.id),
        label: item.name,
      })),
    } satisfies TransactionFormOptions;
  },

  createTransaction: async (payload: CreateTransactionPayload, token?: string) => {
    if (TRANSACTION_API_USE_MOCK) {
      await sleep(180);
      const transactionId = `txn-${Date.now()}`;
      mockItems = [
        {
          id: transactionId,
          categoryId: payload.categoryId,
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

    const categoryId = Number.parseInt(payload.categoryId, 10);
    const accountId = Number.parseInt(payload.sourceId, 10);

    if (!Number.isFinite(categoryId) || !Number.isFinite(accountId)) {
      throw new Error('Danh mục hoặc nguồn tiền không hợp lệ. Vui lòng chọn lại.');
    }

    const response = await request<ApiResponse<BackendTransactionItem>>(TRANSACTION_ENDPOINTS.create, {
      method: 'POST',
      body: {
        type: toBackendType(payload.type),
        amount: Math.abs(payload.amount),
        categoryId,
        accountId,
        note: buildBackendNote(payload),
        transactionDate: toBackendDateTime(payload.date),
      },
      token,
    });

    return {
      success: true,
      transactionId: String(response.result.id),
    } satisfies CreateTransactionResponse;
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

    const [response, categoryIconMapById] = await Promise.all([
      request<ApiResponse<BackendTransactionDetail>>(TRANSACTION_ENDPOINTS.detail(transactionId), { token }),
      buildCategoryIconMap(token),
    ]);

    const result = response.result;
    const date = parseBackendDateTime(result.transactionDate);
    const parsedNote = splitNote(result.note);

    return {
      id: String(result.id),
      date: date.toISOString(),
      type: toFrontendType(result.type),
      categoryId: String(result.categoryId),
      categoryLabel: result.categoryName,
      amount: Math.abs(Number(result.amount) || 0),
      title: parsedNote.title || result.categoryName || 'Giao dịch',
      sourceId: String(result.accountId),
      sourceLabel: result.accountName,
      detail: parsedNote.detail,
      note: result.note ?? '',
      timeLabel: `${pad2(date.getHours())}:${pad2(date.getMinutes())} - ${date.toLocaleString('vi-VN', { month: 'long' })} ${pad2(date.getDate())}`,
      iconKey: categoryIconMapById[String(result.categoryId)] ?? 'other',
    } satisfies TransactionDetail;
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
          categoryId: payload.categoryId,
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

    const categoryId = Number.parseInt(payload.categoryId, 10);
    const accountId = Number.parseInt(payload.sourceId, 10);

    if (!Number.isFinite(categoryId) || !Number.isFinite(accountId)) {
      throw new Error('Danh mục hoặc nguồn tiền không hợp lệ. Vui lòng chọn lại.');
    }

    await request<ApiResponse<BackendTransactionDetail>>(TRANSACTION_ENDPOINTS.update(transactionId), {
      method: 'PUT',
      body: {
        type: toBackendType(payload.type),
        amount: Math.abs(payload.amount),
        categoryId,
        accountId,
        note: buildBackendNote(payload),
        transactionDate: toBackendDateTime(payload.date),
      },
      token,
    });

    return { success: true } satisfies TransactionActionResponse;
  },

  deleteTransaction: async (transactionId: string, token?: string) => {
    if (TRANSACTION_API_USE_MOCK) {
      await sleep(150);
      mockItems = mockItems.filter((item) => item.id !== transactionId);
      return { success: true } satisfies TransactionActionResponse;
    }

    await request<ApiResponse<null>>(TRANSACTION_ENDPOINTS.remove(transactionId), {
      method: 'DELETE',
      token,
    });

    return { success: true } satisfies TransactionActionResponse;
  },
};