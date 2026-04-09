import { requestApi } from './httpClient';
import { categoryApi } from './categoryApi';
import {
  type MoneySourceActionResponse,
  type MoneySourceDashboard,
  type MoneySourceItem,
  type MoneySourceTransactionsResponse,
  type SourceTransactionItem,
  type UpsertMoneySourcePayload,
  type UpsertMoneySourceResponse,
} from '../types/source';

const SOURCE_ENDPOINTS = {
  dashboard: '/accounts/summary',
  create: '/accounts',
  update: (id: string) => `/accounts/${id}`,
  remove: (id: string) => `/accounts/${id}`,
  transactions: (id: string) => `/accounts/${id}/transactions`,
  getAccounts: '/accounts',
};

const pad2 = (value: number) => String(value).padStart(2, '0');

const parseDateOrNow = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const formatMonthLabelVi = (date: Date) => `Tháng ${date.getMonth() + 1}`;

const formatTimeLabelVi = (date: Date) =>
  `${pad2(date.getHours())}:${pad2(date.getMinutes())} - ${formatMonthLabelVi(date)} ${pad2(date.getDate())}`;

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

const normalizeCategoryLabel = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const buildCategoryIconLookups = async (token?: string) => {
  const dashboard = await categoryApi.getDashboard(token);
  const allCategories = [
    ...dashboard.groups.financial,
    ...dashboard.groups.expense,
    ...dashboard.groups.income,
  ];

  return allCategories.reduce<{
    byId: Record<string, string>;
    byName: Record<string, string>;
  }>((acc, category) => {
    acc.byId[category.id] = category.iconKey;
    acc.byName[normalizeCategoryLabel(category.name)] = category.iconKey;
    return acc;
  }, { byId: {}, byName: {} });
};

// ====================
// 🔥 Helper mapping
// ====================

const getIconByType = (type: string) => {
  switch (type) {
    case 'CASH':
      return 'account-balance-wallet';
    case 'BANK':
      return 'account-balance';
    case 'E_WALLET':
      return 'phone-iphone';
    case 'CREDIT':
      return 'credit-card';
    case 'SAVING':
      return 'savings';
    default:
      return 'account-balance';
  }
};

const getColorByType = (type: string) => {
  switch (type) {
    case 'CASH':
      return '#00D09E';
    case 'BANK':
      return '#6366F1';
    case 'E_WALLET':
      return '#F59E0B';
    case 'CREDIT':
      return '#EF4444';
    case 'SAVING':
      return '#10B981';
    default:
      return '#6366F1';
  }
};

// ====================
// 🚀 API
// ====================

export const sourceApi = {
  // ===== Dashboard =====
  getDashboard: async (token?: string): Promise<MoneySourceDashboard> => {
    const res: any = await requestApi(SOURCE_ENDPOINTS.dashboard, { token });

    // BE: { code, result }
    const accounts = Array.isArray(res)
      ? res
      : res?.result || [];

    const items: MoneySourceItem[] = accounts.map((acc: any) => ({
      id: String(acc.accountId),
      name: acc.name,
      icon: getIconByType(acc.type),
      color: getColorByType(acc.type),
      balance: Number(acc.balance) || 0,
      type: acc.type,
    }));

    const totalBalance = items.reduce((sum, item) => sum + item.balance, 0);

    return {
      summary: {
        totalBalance,
        totalAccounts: items.length,
        unreadNotifications: 0,
      },
      items,
    };
  },

  // ===== Create =====
  createSource: async (
    payload: UpsertMoneySourcePayload,
    token?: string
  ): Promise<UpsertMoneySourceResponse> => {
    const res: any = await requestApi(SOURCE_ENDPOINTS.create, {
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
      sourceId: String(res?.result?.accountId || ''),
    };
  },

  // ===== Update =====
  updateSource: async (
    sourceId: string,
    payload: UpsertMoneySourcePayload,
    token?: string
  ): Promise<UpsertMoneySourceResponse> => {
    await requestApi(SOURCE_ENDPOINTS.update(sourceId), {
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
      sourceId,
    };
  },

  // ===== Delete =====
  deleteSource: async (
    sourceId: string,
    token?: string
  ): Promise<MoneySourceActionResponse> => {
    await requestApi(SOURCE_ENDPOINTS.remove(sourceId), {
      method: 'DELETE',
      token,
    });

    return { success: true };
  },

  // ===== Transactions =====
  getSourceTransactions: async (
    sourceId: string,
    token?: string
  ): Promise<MoneySourceTransactionsResponse> => {
    const [transactionsRaw, accountRaw, categoryIconLookups] = await Promise.all([
      requestApi<any>(SOURCE_ENDPOINTS.transactions(sourceId), { token }),
      requestApi<any>(SOURCE_ENDPOINTS.update(sourceId), { token }).catch(() => null),
      buildCategoryIconLookups(token).catch(() => ({ byId: {}, byName: {} })),
    ]);

    const sourceRaw = accountRaw || {};
    const transactionList = Array.isArray(transactionsRaw)
      ? transactionsRaw
      : Array.isArray(transactionsRaw?.transactions)
        ? transactionsRaw.transactions
        : Array.isArray(transactionsRaw?.items)
          ? transactionsRaw.items
          : [];

    const items: SourceTransactionItem[] = transactionList.map((tx: any) => {
      const parsedDate = parseDateOrNow(tx.transactionDate ?? tx.transactionDateTime ?? tx.date);
      const txType = String(tx.type ?? '').toUpperCase();
      const amount = Number(tx.amount) || 0;
      const kind: SourceTransactionItem['kind'] = txType === 'INCOME' ? 'income' : 'expense';
      const parsedNote = splitNote(tx.note);
      const categoryLabel = String(tx.categoryName ?? tx.category ?? '').trim();
      const categoryId = tx.categoryId ?? tx.category_id ?? tx.categoryID;
      const normalizedCategoryLabel = normalizeCategoryLabel(categoryLabel);

      return {
        id: String(tx.id),
        sourceId: String(sourceId),
        monthLabel: formatMonthLabelVi(parsedDate),
        title: parsedNote.title || categoryLabel || 'Giao dịch',
        timeLabel: formatTimeLabelVi(parsedDate),
        note: parsedNote.detail || categoryLabel || '',
        amount: amount,
        kind,
        iconKey:
          categoryIconLookups.byId[String(categoryId ?? '')] ||
          categoryIconLookups.byName[normalizedCategoryLabel] ||
          tx.categoryIcon ||
          tx.imageUrl ||
          (kind === 'income' ? 'attach_money' : 'shopping'),
      };
    });

    const totalExpense = items
      .filter((i) => i.kind === 'expense')
      .reduce((s, i) => s + Math.abs(i.amount), 0);

    const totalIncome = items
      .filter((i) => i.kind === 'income')
      .reduce((s, i) => s + i.amount, 0);

    return {
      source: {
        id: String(sourceRaw.accountId || sourceId),
        name: sourceRaw.name || '',
        icon: getIconByType(sourceRaw.type),
        color: getColorByType(sourceRaw.type),
        balance: Number(sourceRaw.balance) || 0,
        type: sourceRaw.type,
      },
      overview: {
        balance: Number(sourceRaw.balance) || 0,
        totalExpense,
        totalIncome,
        unreadNotifications: 0,
      },
      items,
    };
  },
};