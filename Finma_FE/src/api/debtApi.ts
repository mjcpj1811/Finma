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

const DEBT_ENDPOINTS = {
  stats: '/debts/stats',
  list: '/debts',
  detail: (id: string) => `/debts/${id}`,
  payments: (id: string) => `/debts/${id}/payments`,
  paymentDetail: (debtId: string, paymentId: string) => `/debts/${debtId}/payments/${paymentId}`,
};

type ApiResponse<T> = {
  code: number;
  message?: string;
  result: T;
};

type BackendDebtType = 'LOAN' | 'LEND';

type BackendDebtSummary = {
  id: number;
  type: BackendDebtType;
  personName: string;
  totalAmount: number;
  paidAmount?: number | null;
  remainingAmount?: number | null;
  dueDate?: string | null;
  status?: string;
  startDate?: string | null;
};

type BackendDebtPayment = {
  id: number;
  amount: number;
  paymentDate: string;
  title?: string | null;
  counterparty?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type BackendDebtDetail = BackendDebtSummary & {
  interestRate?: number | null;
  note?: string | null;
  payments?: BackendDebtPayment[];
};

type BackendDebtStats = {
  totalLend: number;
  totalLoan: number;
  lendCount: number;
  loanCount: number;
};

const toMonthLabel = (dateIso: string) => {
  const date = new Date(dateIso);
  return date.toLocaleString('vi-VN', { month: 'long' });
};

const toTimeLabel = (dateIso: string) => {
  const date = new Date(dateIso);
  const month = date.toLocaleString('vi-VN', { month: 'long' });
  const day = String(date.getDate()).padStart(2, '0');
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} - ${month} ${day}`;
};

const toNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const toOptionalNumber = (value: unknown): number | null => {
  if (value == null) {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const deriveDebtPaidAmount = (item: Pick<BackendDebtSummary, 'totalAmount' | 'paidAmount' | 'remainingAmount'>): number => {
  const totalAmount = Math.max(0, toNumber(item.totalAmount));
  const paidAmount = toOptionalNumber(item.paidAmount);
  const remainingAmount = toOptionalNumber(item.remainingAmount);

  if (paidAmount != null) {
    return Math.max(0, paidAmount);
  }

  if (remainingAmount != null) {
    return Math.max(0, totalAmount - remainingAmount);
  }

  return 0;
};

const deriveDebtRemainingAmount = (item: Pick<BackendDebtSummary, 'totalAmount' | 'paidAmount' | 'remainingAmount'>): number => {
  const totalAmount = Math.max(0, toNumber(item.totalAmount));
  const paidAmount = toOptionalNumber(item.paidAmount);
  const remainingAmount = toOptionalNumber(item.remainingAmount);

  if (paidAmount != null) {
    return Math.max(0, totalAmount - paidAmount);
  }

  if (remainingAmount != null) {
    return Math.max(0, remainingAmount);
  }

  return totalAmount;
};

const toDirection = (type: BackendDebtType): DebtItem['direction'] => (type === 'LEND' ? 'lend' : 'borrow');

const toBackendDebtType = (direction: DebtItem['direction']): BackendDebtType =>
  direction === 'lend' ? 'LEND' : 'LOAN';

const normalizeDateIso = (value: string | undefined): string => {
  if (!value) {
    return new Date().toISOString();
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    // Keep date-only values in local time to avoid fixed UTC offset displays on mobile.
    return `${value}T00:00:00`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }

  return parsed.toISOString();
};

const toDateOnly = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
};

const toDebtIcon = (direction: DebtItem['direction']): DebtItem['iconKey'] =>
  direction === 'lend' ? 'payments' : 'account-balance-wallet';

const mapDebtItem = (item: BackendDebtSummary): DebtItem => {
  const direction = toDirection(item.type);

  return {
    id: String(item.id),
    name: item.personName,
    direction,
    principalAmount: toNumber(item.totalAmount),
    remainingAmount: deriveDebtRemainingAmount(item),
    iconKey: toDebtIcon(direction),
  };
};

const mapDebtPaymentToTransaction = (
  debtId: string,
  debtType: BackendDebtType,
  personName: string,
  payment: BackendDebtPayment,
): DebtTransactionItem => {
  // Prefer createdAt to display the actual creation time in UI (same behavior users expect from transaction screen).
  const dateIso = normalizeDateIso(payment.createdAt ?? payment.updatedAt ?? payment.paymentDate);
  const fallbackCounterparty = debtType === 'LEND' ? 'Thu nợ' : 'Trả nợ';

  return {
    id: String(payment.id),
    debtId,
    dateIso,
    monthLabel: toMonthLabel(dateIso),
    title: payment.title?.trim() || personName,
    timeLabel: toTimeLabel(dateIso),
    counterparty: payment.counterparty?.trim() || fallbackCounterparty,
    amount: Math.abs(toNumber(payment.amount)),
    kind: debtType === 'LEND' ? 'borrow' : 'repay',
  };
};

const toDebtId = (debtId: string): number => {
  const parsed = Number.parseInt(debtId, 10);
  if (Number.isNaN(parsed)) {
    throw new Error('Debt ID không hợp lệ.');
  }

  return parsed;
};

export const debtApi = {
  getDashboard: async (token?: string) => {
    const [statsResponse, debtsResponse] = await Promise.all([
      request<ApiResponse<BackendDebtStats>>(DEBT_ENDPOINTS.stats, { token }),
      request<ApiResponse<BackendDebtSummary[]>>(DEBT_ENDPOINTS.list, { token }),
    ]);

    const debtSummaries = debtsResponse.result ?? [];

    const items = await Promise.all(
      debtSummaries.map(async (debt) => {
        const mapped = mapDebtItem(debt);

        try {
          const paymentsResponse = await request<ApiResponse<BackendDebtPayment[]>>(
            DEBT_ENDPOINTS.payments(String(debt.id)),
            { token },
          );

          const payments = paymentsResponse.result ?? [];
          const paidFromPayments = payments.reduce((sum, payment) => sum + Math.abs(toNumber(payment.amount)), 0);
          const paidFromSummary = deriveDebtPaidAmount(debt);
          const paidAmount = payments.length > 0 ? paidFromPayments : paidFromSummary;

          return {
            ...mapped,
            remainingAmount: Math.max(0, mapped.principalAmount - paidAmount),
          };
        } catch {
          const paidFromSummary = deriveDebtPaidAmount(debt);
          return {
            ...mapped,
            remainingAmount: Math.max(0, mapped.principalAmount - paidFromSummary),
          };
        }
      }),
    );

    const stats = statsResponse.result;

    const totalLendFromItems = items
      .filter((item) => item.direction === 'lend')
      .reduce((sum, item) => sum + item.principalAmount, 0);

    const totalBorrowFromItems = items
      .filter((item) => item.direction === 'borrow')
      .reduce((sum, item) => sum + item.principalAmount, 0);

    const totalLendRemainingFromItems = items
      .filter((item) => item.direction === 'lend')
      .reduce((sum, item) => sum + item.remainingAmount, 0);

    const totalBorrowRemainingFromItems = items
      .filter((item) => item.direction === 'borrow')
      .reduce((sum, item) => sum + item.remainingAmount, 0);

    const totalRemainingFromItems = items.reduce((sum, item) => sum + item.remainingAmount, 0);

    const totalLend = items.length > 0 ? totalLendFromItems : toNumber(stats?.totalLend);
    const totalBorrow = items.length > 0 ? totalBorrowFromItems : toNumber(stats?.totalLoan);

    return {
      overview: {
        totalLend,
        totalBorrow,
        totalLendRemaining: totalLendRemainingFromItems,
        totalBorrowRemaining: totalBorrowRemainingFromItems,
        totalPrincipal: totalLend + totalBorrow,
        totalRemaining: totalRemainingFromItems,
        unreadNotifications: 0,
      },
      items,
    } satisfies DebtsDashboard;
  },

  getDebtTransactions: async (debtId: string, token?: string) => {
    const normalizedDebtId = String(toDebtId(debtId));
    const [detailResponse, paymentsResponse] = await Promise.all([
      request<ApiResponse<BackendDebtDetail>>(DEBT_ENDPOINTS.detail(normalizedDebtId), { token }),
      request<ApiResponse<BackendDebtPayment[]>>(DEBT_ENDPOINTS.payments(normalizedDebtId), { token }),
    ]);

    const debt = detailResponse.result;
    const debtItem = mapDebtItem(debt);
    const sortedPayments = [...(paymentsResponse.result ?? debt.payments ?? [])].sort((left, right) => {
      return normalizeDateIso(right.createdAt ?? right.paymentDate).localeCompare(
        normalizeDateIso(left.createdAt ?? left.paymentDate),
      );
    });

    const repaidFromPayments = sortedPayments.reduce((sum, item) => sum + Math.abs(toNumber(item.amount)), 0);
    const totalBorrowed = Math.max(0, toNumber(debt.totalAmount));
    const totalRepaid = sortedPayments.length > 0
      ? repaidFromPayments
      : (toOptionalNumber(debt.paidAmount) ?? repaidFromPayments);
    const remainingFromSummary = toOptionalNumber(debt.remainingAmount);
    const remainingAmount = sortedPayments.length > 0
      ? Math.max(0, totalBorrowed - totalRepaid)
      : (remainingFromSummary != null
        ? Math.max(0, remainingFromSummary)
        : Math.max(0, totalBorrowed - totalRepaid));

    return {
      debt: debtItem,
      overview: {
        totalBorrowed,
        totalRepaid,
        remainingAmount,
        unreadNotifications: 0,
      },
      items: sortedPayments.map((item) => mapDebtPaymentToTransaction(debtItem.id, debt.type, debt.personName, item)),
    } satisfies DebtTransactionsResponse;
  },

  createDebt: async (payload: UpsertDebtPayload, token?: string) => {
    const response = await request<ApiResponse<BackendDebtDetail>>(DEBT_ENDPOINTS.list, {
      method: 'POST',
      body: {
        personName: payload.name.trim(),
        type: toBackendDebtType(payload.direction),
        totalAmount: payload.principalAmount,
        interestRate: payload.interestRate ?? null,
        startDate: payload.startDate ? toDateOnly(payload.startDate) : null,
        dueDate: payload.dueDate ? toDateOnly(payload.dueDate) : null,
        note: payload.note ?? null,
      } as unknown as Record<string, unknown>,
      token,
    });

    return {
      success: true,
      debtId: response.result?.id ? String(response.result.id) : undefined,
    } satisfies DebtActionResponse;
  },

  updateDebt: async (debtId: string, payload: UpsertDebtPayload, token?: string) => {
    await request<ApiResponse<BackendDebtDetail>>(DEBT_ENDPOINTS.detail(debtId), {
      method: 'PUT',
      body: {
        personName: payload.name.trim(),
        type: toBackendDebtType(payload.direction),
        totalAmount: payload.principalAmount,
        interestRate: payload.interestRate ?? null,
        startDate: payload.startDate ? toDateOnly(payload.startDate) : null,
        dueDate: payload.dueDate ? toDateOnly(payload.dueDate) : null,
        note: payload.note ?? null,
      } as unknown as Record<string, unknown>,
      token,
    });

    return { success: true, debtId } satisfies DebtActionResponse;
  },

  deleteDebt: async (debtId: string, token?: string) => {
    await request<ApiResponse<null>>(DEBT_ENDPOINTS.detail(debtId), {
      method: 'DELETE',
      token,
    });

    return { success: true, debtId } satisfies DebtActionResponse;
  },

  createDebtTransaction: async (debtId: string, payload: UpsertDebtTransactionPayload, token?: string) => {
    const response = await request<ApiResponse<BackendDebtPayment>>(DEBT_ENDPOINTS.payments(String(toDebtId(debtId))), {
      method: 'POST',
      body: {
        amount: Math.abs(payload.amount),
        paymentDate: toDateOnly(payload.dateIso),
        title: payload.title.trim() || null,
        counterparty: payload.counterparty.trim() || null,
      } as unknown as Record<string, unknown>,
      token,
    });

    return {
      success: true,
      transactionId: response.result?.id ? String(response.result.id) : undefined,
    } satisfies DebtTransactionActionResponse;
  },

  updateDebtTransaction: async (
    debtId: string,
    transactionId: string,
    payload: UpsertDebtTransactionPayload,
    token?: string,
  ) => {
    const normalizedDebtId = String(toDebtId(debtId));
    await request<ApiResponse<BackendDebtPayment>>(DEBT_ENDPOINTS.paymentDetail(normalizedDebtId, transactionId), {
      method: 'PUT',
      body: {
        amount: Math.abs(payload.amount),
        paymentDate: toDateOnly(payload.dateIso),
        title: payload.title.trim() || null,
        counterparty: payload.counterparty.trim() || null,
      } as unknown as Record<string, unknown>,
      token,
    });

    return { success: true, transactionId } satisfies DebtTransactionActionResponse;
  },

  deleteDebtTransaction: async (debtId: string, transactionId: string, token?: string) => {
    const normalizedDebtId = String(toDebtId(debtId));
    await request<ApiResponse<null>>(DEBT_ENDPOINTS.paymentDetail(normalizedDebtId, transactionId), {
      method: 'DELETE',
      token,
    });

    return { success: true, transactionId } satisfies DebtTransactionActionResponse;
  },
};
