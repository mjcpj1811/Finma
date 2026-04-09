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

const parseDateOrNow = (value?: unknown) => {
  if (value == null) {
    return new Date();
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? new Date() : value;
  }

  if (Array.isArray(value) && value.length >= 3) {
    const year = Number(value[0]);
    const month = Number(value[1]);
    const day = Number(value[2]);
    const hour = Number(value[3] ?? 0);
    const minute = Number(value[4] ?? 0);
    const second = Number(value[5] ?? 0);

    if (![year, month, day, hour, minute, second].some((part) => Number.isNaN(part))) {
      return new Date(year, month - 1, day, hour, minute, second);
    }
  }

  if (typeof value !== 'string') {
    return new Date();
  }

  const raw = value.trim();
  if (!raw) {
    return new Date();
  }

  // Handle backend format yyyy-MM-dd HH:mm:ss in a cross-platform safe way.
  const dateTimeMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
  if (dateTimeMatch) {
    const [, y, m, d, hh, mm, ss] = dateTimeMatch;
    return new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss));
  }

  const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, y, m, d] = dateOnlyMatch;
    return new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0);
  }

  const date = new Date(raw);
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
    case 'INVESTMENT':
      return 'trending-up';
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
    case 'INVESTMENT':
      return '#8B5CF6';
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
      icon: acc.icon || getIconByType(acc.type),
      color: acc.color || getColorByType(acc.type),
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
    const reqOptions: any = {
      method: 'POST',
      body: {
        name: payload.name,
        type: payload.type,
        balance: payload.balance,
        icon: payload.icon,
        color: payload.color,
      },
      token,
    };
    console.log('=== CREATE SOURCE (BE EXPECTED PAYLOAD) ===', reqOptions.body);

    const res: any = await requestApi(SOURCE_ENDPOINTS.create, reqOptions);

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
    const reqOptions: any = {
      method: 'PUT',
      body: {
        name: payload.name,
        type: payload.type,
        balance: payload.balance,
        icon: payload.icon,
        color: payload.color,
      },
      token,
    };
    console.log('=== UPDATE SOURCE (BE EXPECTED PAYLOAD) ===', reqOptions.body);

    await requestApi(SOURCE_ENDPOINTS.update(sourceId), reqOptions);

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
    const [allTransactionsRaw, accountTransactionsRaw, accountRaw, categoryIconLookups] = await Promise.all([
      requestApi<any>('/transactions', { token }).catch(() => null),
      requestApi<any>(SOURCE_ENDPOINTS.transactions(sourceId), { token }).catch(() => null),
      requestApi<any>(SOURCE_ENDPOINTS.update(sourceId), { token }).catch(() => null),
      buildCategoryIconLookups(token).catch(
        (): { byId: Record<string, string>; byName: Record<string, string> } => ({ byId: {}, byName: {} }),
      ),
    ]);

    const sourceRaw = accountRaw || {};
    const sourceNameNormalized = String(sourceRaw?.name ?? '').trim().toLowerCase();

    const extractTransactionList = (raw: any): any[] => {
      if (Array.isArray(raw)) {
        return raw;
      }

      if (Array.isArray(raw?.result)) {
        return raw.result;
      }

      if (Array.isArray(raw?.transactions)) {
        return raw.transactions;
      }

      if (Array.isArray(raw?.items)) {
        return raw.items;
      }

      return [];
    };

    const belongsToSource = (tx: any) => {
      const txAccountId = tx?.accountId ?? tx?.account_id ?? tx?.accountID;
      if (txAccountId != null && String(txAccountId) === String(sourceId)) {
        return true;
      }

      if (!sourceNameNormalized) {
        return false;
      }

      const txAccountName = String(tx?.accountName ?? tx?.account ?? '').trim().toLowerCase();
      return Boolean(txAccountName) && txAccountName === sourceNameNormalized;
    };

    const globallyMatched = extractTransactionList(allTransactionsRaw).filter((tx) => belongsToSource(tx));
    const accountScopedTransactions = extractTransactionList(accountTransactionsRaw);

    // Keep /transactions as the source of truth (same as Transaction screen), fallback to account endpoint only if needed.
    const mergedTransactions = globallyMatched.length > 0
      ? globallyMatched
      : accountScopedTransactions;

    const dedupedById = new Map<string, any>();
    mergedTransactions.forEach((tx) => {
      if (tx?.id == null) {
        return;
      }
      const key = String(tx.id);
      const existing = dedupedById.get(key);
      if (!existing) {
        dedupedById.set(key, tx);
        return;
      }

      const existingHasCreatedAt = Boolean(existing?.createdAt);
      const nextHasCreatedAt = Boolean(tx?.createdAt);
      if (!existingHasCreatedAt && nextHasCreatedAt) {
        dedupedById.set(key, tx);
      }
    });
    const transactionList = Array.from(dedupedById.values());
    const sortedTransactions = [...transactionList].sort((a, b) => {
      const dateA = parseDateOrNow(a?.transactionDateTime ?? a?.date ?? a?.createdAt ?? a?.transactionDate).getTime();
      const dateB = parseDateOrNow(b?.transactionDateTime ?? b?.date ?? b?.createdAt ?? b?.transactionDate).getTime();
      return dateB - dateA;
    });

    const visibleTransactions = sortedTransactions.filter(
      (tx) => String(tx?.type ?? '').toUpperCase() !== 'SAVING',
    );

    const items: SourceTransactionItem[] = visibleTransactions.map((tx: any) => {
      const parsedDate = parseDateOrNow(tx.transactionDateTime ?? tx.date ?? tx.createdAt ?? tx.transactionDate);
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
        icon: sourceRaw.icon || getIconByType(sourceRaw.type),
        color: sourceRaw.color || getColorByType(sourceRaw.type),
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