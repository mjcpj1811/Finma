import { requestApi } from './httpClient';
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
      body: payload,
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
      body: payload,
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
    const res: any = await requestApi(
      SOURCE_ENDPOINTS.transactions(sourceId),
      { token }
    );

    const data = res?.result || {};

    const sourceRaw = data.account || {};

    const items: SourceTransactionItem[] = (data.transactions || []).map(
      (tx: any) => ({
        id: String(tx.id),
        sourceId: String(sourceId),
        monthLabel: new Date(tx.date).toLocaleString('en-US', {
          month: 'long',
        }),
        title: tx.title || tx.categoryName || 'Transaction',
        timeLabel: new Date(tx.date).toLocaleString(),
        note: tx.note || '',
        amount: Number(tx.amount) || 0,
        kind: tx.amount > 0 ? 'income' : 'expense',
        iconKey: tx.categoryIcon || 'other',
      })
    );

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