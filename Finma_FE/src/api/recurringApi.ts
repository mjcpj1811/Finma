import { request } from './httpClient';
import {
  type RecurringActionResponse,
  type RecurringDashboard,
  type RecurringRuleDetail,
  type RecurringRuleItem,
  type RecurringStatus,
  type UpsertRecurringRulePayload,
} from '../types/recurring';

const RECURRING_ENDPOINTS = {
  stats: '/recurring-transactions/stats',
  list: '/recurring-transactions',
  detail: (id: string) => `/recurring-transactions/${id}`,
  create: '/recurring-transactions',
  update: (id: string) => `/recurring-transactions/${id}`,
  toggle: (id: string) => `/recurring-transactions/${id}/toggle`,
  remove: (id: string) => `/recurring-transactions/${id}`,
};

type ApiResponse<T> = {
  code: number;
  message?: string;
  result: T;
};

type BackendFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
type BackendStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

type BackendStats = {
  totalActive: number;
  totalMonthlyExpense: number;
};

type BackendSummary = {
  id: number;
  title: string;
  amount: number;
  frequencyLabel?: string | null;
  executionLabel?: string | null;
  categoryIcon?: string | null;
  categoryColor?: string | null;
  isActive: boolean;
  status: BackendStatus;
};

type BackendDetail = {
  id: number;
  title: string;
  amount: number;
  frequency: BackendFrequency;
  frequencyLabel?: string | null;
  startDate: string;
  executionLabel?: string | null;
  dayOfMonth?: number | null;
  dayOfWeek?: number | null;
  reminderDaysBefore?: number | null;
  note?: string | null;
  isActive: boolean;
  status: BackendStatus;
  accountId?: number | null;
  categoryId?: number | null;
};

type BackendUpsertRequest = {
  frequency: BackendFrequency;
  startDate: string;
  title: string;
  amount: number;
  note?: string;
  accountId?: number;
  categoryId?: number;
  dayOfMonth?: number;
  dayOfWeek?: number;
  reminderDaysBefore?: number;
  status?: BackendStatus;
};

const toFrontendCycle = (frequency: BackendFrequency) => {
  switch (frequency) {
    case 'DAILY':
      return 'daily' as const;
    case 'WEEKLY':
      return 'weekly' as const;
    case 'YEARLY':
      return 'yearly' as const;
    case 'MONTHLY':
    default:
      return 'monthly' as const;
  }
};

const inferCycleFromLabel = (label?: string | null) => {
  const normalized = (label ?? '').toLowerCase();
  if (normalized.includes('ngay') || normalized.includes('ngày')) {
    return 'daily' as const;
  }
  if (normalized.includes('tuan') || normalized.includes('tuần')) {
    return 'weekly' as const;
  }
  if (normalized.includes('nam') || normalized.includes('năm')) {
    return 'yearly' as const;
  }
  return 'monthly' as const;
};

const toBackendFrequency = (cycle: UpsertRecurringRulePayload['cycle']): BackendFrequency => {
  switch (cycle) {
    case 'daily':
      return 'DAILY';
    case 'weekly':
      return 'WEEKLY';
    case 'yearly':
      return 'YEARLY';
    case 'monthly':
    default:
      return 'MONTHLY';
  }
};

const toBackendStatus = (status?: RecurringStatus): BackendStatus | undefined => {
  if (!status) {
    return undefined;
  }

  return status;
};

const toDateOnly = (value?: string) => {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
};

const toOptionalNumber = (value?: string) => {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const mapSummary = (item: BackendSummary): RecurringRuleItem => ({
  id: String(item.id),
  title: item.title,
  amount: Number(item.amount ?? 0),
  cycle: inferCycleFromLabel(item.frequencyLabel),
  frequencyLabel: item.frequencyLabel?.trim() || 'Hàng tháng',
  executionLabel: item.executionLabel?.trim() || 'Chưa có lịch thực hiện',
  isActive: Boolean(item.isActive),
  status: item.status,
  categoryIcon: item.categoryIcon ?? undefined,
  categoryColor: item.categoryColor ?? undefined,
});

const mapDetail = (item: BackendDetail): RecurringRuleDetail => ({
  id: String(item.id),
  title: item.title,
  amount: Number(item.amount ?? 0),
  cycle: toFrontendCycle(item.frequency),
  frequencyLabel: item.frequencyLabel?.trim() || 'Hàng tháng',
  executionLabel: item.executionLabel?.trim() || 'Chưa có lịch thực hiện',
  startDate: item.startDate,
  dayOfMonth: item.dayOfMonth ?? undefined,
  dayOfWeek: item.dayOfWeek ?? undefined,
  reminderDaysBefore: item.reminderDaysBefore ?? undefined,
  categoryId: item.categoryId != null ? String(item.categoryId) : undefined,
  sourceId: item.accountId != null ? String(item.accountId) : undefined,
  note: item.note ?? undefined,
  isActive: Boolean(item.isActive),
  status: item.status,
});

const buildUpsertBody = (payload: UpsertRecurringRulePayload): BackendUpsertRequest => {
  const frequency = toBackendFrequency(payload.cycle);
  const body: BackendUpsertRequest = {
    frequency,
    startDate: toDateOnly(payload.startDate),
    title: payload.title.trim(),
    amount: Math.abs(payload.amount),
    note: payload.note?.trim() || undefined,
    accountId: toOptionalNumber(payload.sourceId),
    categoryId: toOptionalNumber(payload.categoryId),
    reminderDaysBefore: payload.reminderDaysBefore,
    status: toBackendStatus(payload.status),
  };

  if (frequency === 'WEEKLY') {
    body.dayOfWeek = payload.dayOfWeek;
  } else if (frequency === 'MONTHLY' || frequency === 'YEARLY') {
    body.dayOfMonth = payload.dayOfMonth;
  }

  return body;
};

export const recurringApi = {
  getDashboard: async (token?: string) => {
    const [statsResponse, listResponse] = await Promise.all([
      request<ApiResponse<BackendStats>>(RECURRING_ENDPOINTS.stats, { token }),
      request<ApiResponse<BackendSummary[]>>(RECURRING_ENDPOINTS.list, { token }),
    ]);

    return {
      overview: {
        activeCount: Number(statsResponse.result?.totalActive ?? 0),
        monthlyExpense: Number(statsResponse.result?.totalMonthlyExpense ?? 0),
        unreadNotifications: 0,
      },
      items: (listResponse.result ?? []).map(mapSummary),
    } satisfies RecurringDashboard;
  },

  getRecurringRuleById: async (recurringId: string, token?: string) => {
    const response = await request<ApiResponse<BackendDetail>>(RECURRING_ENDPOINTS.detail(recurringId), {
      token,
    });

    return mapDetail(response.result);
  },

  syncDueTransactions: async () => {
    // Due transaction processing is handled by backend business logic/schedulers.
    return;
  },

  createRecurringRule: async (payload: UpsertRecurringRulePayload, token?: string) => {
    const response = await request<ApiResponse<BackendDetail>>(RECURRING_ENDPOINTS.create, {
      method: 'POST',
      token,
      body: buildUpsertBody(payload) as unknown as Record<string, unknown>,
    });

    return {
      success: true,
      recurringId: String(response.result.id),
    } satisfies RecurringActionResponse;
  },

  updateRecurringRule: async (recurringId: string, payload: UpsertRecurringRulePayload, token?: string) => {
    await request<ApiResponse<BackendDetail>>(RECURRING_ENDPOINTS.update(recurringId), {
      method: 'PUT',
      token,
      body: buildUpsertBody(payload) as unknown as Record<string, unknown>,
    });

    return {
      success: true,
      recurringId,
    } satisfies RecurringActionResponse;
  },

  deleteRecurringRule: async (recurringId: string, token?: string) => {
    await request<ApiResponse<void>>(RECURRING_ENDPOINTS.remove(recurringId), {
      method: 'DELETE',
      token,
    });

    return {
      success: true,
      recurringId,
    } satisfies RecurringActionResponse;
  },

  toggleRecurringRule: async (recurringId: string, isActive: boolean, token?: string) => {
    await request<ApiResponse<BackendDetail>>(RECURRING_ENDPOINTS.toggle(recurringId), {
      method: 'PATCH',
      token,
      body: { isActive },
    });

    return {
      success: true,
      recurringId,
    } satisfies RecurringActionResponse;
  },
};
