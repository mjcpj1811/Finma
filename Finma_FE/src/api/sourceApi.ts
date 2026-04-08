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

type ApiResponse<T> = {
  code: number;
  message?: string;
  result: T;
};

const SOURCE_ENDPOINTS = {
  list: '/accounts',
  summary: '/accounts/summary',
  create: '/accounts',
  detail: (id: string) => `/accounts/${id}`,
  update: (id: string) => `/accounts/${id}`,
  remove: (id: string) => `/accounts/${id}`,
  transactions: (id: string) => `/accounts/${id}/transactions`,
};

type BackendAccountType = 'CASH' | 'BANK' | 'E_WALLET' | 'CREDIT' | 'SAVING' | 'INVESTMENT';

type BackendAccount = {
  id: number;
  name: string;
  type: BackendAccountType;
  balance?: number | string | null;
  icon?: string | null;
  color?: string | null;
};

type BackendTransactionType = 'INCOME' | 'EXPENSE' | 'SAVING';

type BackendTransaction = {
  id: number;
  type: BackendTransactionType;
  amount: number | string;
  note?: string | null;
  imageUrl?: string | null;
  location?: string | null;
  transactionDate?: string | null;
  category?: string | null;
};

const accountTypeMap: Record<BackendAccountType, MoneySourceItem['type']> = {
  CASH: 'cash',
  BANK: 'bank',
  E_WALLET: 'card',
  CREDIT: 'card',
  SAVING: 'bank',
  INVESTMENT: 'bank',
};

const categoryIconMap = (name: string): SourceTransactionItem['iconKey'] => {
  const lower = name.toLowerCase();
  if (lower.includes('lương') || lower.includes('salary') || lower.includes('thưởng') || lower.includes('trợ cấp')) {
    return 'salary';
  }
  if (lower.includes('ăn') || lower.includes('food') || lower.includes('thực phẩm') || lower.includes('restaurant')) {
    return 'food';
  }
  if (lower.includes('phòng') || lower.includes('rent') || lower.includes('định kỳ') || lower.includes('hóa đơn')) {
    return 'rent';
  }
  if (lower.includes('di chuyển') || lower.includes('transport') || lower.includes('grab') || lower.includes('xăng')) {
    return 'transport';
  }
  return 'other';
};

const parseTransactionDate = (value?: string | null) => {
  if (!value) {
    return new Date();
  }

  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const toMoneySourceItem = (account: BackendAccount): MoneySourceItem => ({
  id: String(account.id),
  name: account.name,
  subtitle: account.name,
  balance: Number(account.balance ?? 0),
  type: accountTypeMap[account.type] ?? 'bank',
});

const toSourceTransactionItem = (accountId: string, transaction: BackendTransaction): SourceTransactionItem => {
  const date = parseTransactionDate(transaction.transactionDate);
  const monthLabel = date.toLocaleString('en-US', { month: 'long' });
  const day = String(date.getDate()).padStart(2, '0');
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const amount = Number(transaction.amount ?? 0);
  const isIncome = transaction.type === 'INCOME';
  const categoryName = transaction.category ?? transaction.note ?? 'Giao dịch';

  return {
    id: String(transaction.id),
    sourceId: accountId,
    monthLabel,
    title: transaction.note?.trim() || categoryName,
    timeLabel: `${time} - ${monthLabel} ${day}`,
    note: transaction.note ?? '',
    amount: isIncome ? Math.abs(amount) : -Math.abs(amount),
    kind: isIncome ? 'income' : 'expense',
    iconKey: categoryIconMap(categoryName),
  };
};

export const sourceApi = {
  getDashboard: async (token?: string) => {
    const response = await request<ApiResponse<BackendAccount[]>>(SOURCE_ENDPOINTS.list, { token });
    const items = (response.result ?? []).map(toMoneySourceItem);

    return {
      summary: {
        totalBalance: items.reduce((sum, item) => sum + Number(item.balance ?? 0), 0),
        totalAccounts: items.length,
        unreadNotifications: 0,
      },
      items,
    } satisfies MoneySourceDashboard;
  },

  createSource: async (payload: UpsertMoneySourcePayload, token?: string) => {
    const response = await request<ApiResponse<BackendAccount>>(SOURCE_ENDPOINTS.create, {
      method: 'POST',
      body: {
        name: payload.name,
        type: payload.type === 'cash' ? 'CASH' : payload.type === 'bank' ? 'BANK' : 'E_WALLET',
        balance: payload.balance,
        icon: null,
        color: null,
      },
      token,
    });

    return {
      success: true,
      sourceId: String(response.result.id),
    } satisfies UpsertMoneySourceResponse;
  },

  updateSource: async (sourceId: string, payload: UpsertMoneySourcePayload, token?: string) => {
    const response = await request<ApiResponse<BackendAccount>>(SOURCE_ENDPOINTS.update(sourceId), {
      method: 'PUT',
      body: {
        name: payload.name,
        type: payload.type === 'cash' ? 'CASH' : payload.type === 'bank' ? 'BANK' : 'E_WALLET',
        balance: payload.balance,
        icon: null,
        color: null,
      },
      token,
    });

    return {
      success: true,
      sourceId: String(response.result.id),
    } satisfies UpsertMoneySourceResponse;
  },

  deleteSource: async (sourceId: string, token?: string) => {
    await request<ApiResponse<null>>(SOURCE_ENDPOINTS.remove(sourceId), {
      method: 'DELETE',
      token,
    });

    return { success: true } satisfies MoneySourceActionResponse;
  },

  getSourceTransactions: async (sourceId: string, token?: string) => {
    const [accountResponse, transactionResponse] = await Promise.all([
      request<ApiResponse<BackendAccount>>(SOURCE_ENDPOINTS.detail(sourceId), { token }),
      request<ApiResponse<BackendTransaction[]>>(SOURCE_ENDPOINTS.transactions(sourceId), { token }),
    ]);

    const source = toMoneySourceItem(accountResponse.result);
    const items = (transactionResponse.result ?? []).map((item) => toSourceTransactionItem(sourceId, item));

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
        unreadNotifications: 0,
      },
      items,
    } satisfies MoneySourceTransactionsResponse;
  },
};
