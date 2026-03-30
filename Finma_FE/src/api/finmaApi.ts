import { apiFetch } from './client';
import type {
  AccountOption,
  CategoryOption,
  PieItem,
  ReportChart,
  ReportSummary,
  TransactionListItem,
} from './types';

export async function login(username: string, password: string): Promise<string> {
  const r = await apiFetch<{ token: string; authenticated: boolean }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  const token = r.result?.token;
  if (!token) throw new Error('No token in response');
  return token;
}

export async function fetchMyInfo(token: string) {
  return apiFetch<{ username?: string; fullName?: string }>('/users/my-info', {
    method: 'GET',
    token,
  });
}

export async function fetchTransactions(
  token: string,
  params: {
    type?: string;
    categoryId?: number;
    accountId?: number;
    q?: string;
    from?: string;
    to?: string;
  }
) {
  const q = new URLSearchParams();
  if (params.type) q.set('type', params.type);
  if (params.categoryId != null) q.set('categoryId', String(params.categoryId));
  if (params.accountId != null) q.set('accountId', String(params.accountId));
  if (params.q) q.set('q', params.q);
  if (params.from) q.set('from', params.from);
  if (params.to) q.set('to', params.to);
  const qs = q.toString();
  return apiFetch<TransactionListItem[]>(`/transactions${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    token,
  });
}

export async function fetchReportSummary(token: string, from?: string, to?: string) {
  const q = new URLSearchParams();
  if (from) q.set('from', from);
  if (to) q.set('to', to);
  const qs = q.toString();
  return apiFetch<ReportSummary>(`/reports/summary${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    token,
  });
}

export async function fetchReportChart(
  token: string,
  view: 'day' | 'week' | 'month' | 'year',
  from?: string,
  to?: string
) {
  const q = new URLSearchParams();
  q.set('view', view);
  if (from) q.set('from', from);
  if (to) q.set('to', to);
  return apiFetch<ReportChart>(`/reports/chart?${q.toString()}`, {
    method: 'GET',
    token,
  });
}

export async function fetchReportPie(token: string, from?: string, to?: string) {
  const q = new URLSearchParams();
  if (from) q.set('from', from);
  if (to) q.set('to', to);
  const qs = q.toString();
  return apiFetch<PieItem[]>(`/reports/pie${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    token,
  });
}

export async function fetchCategories(token: string, type: 'EXPENSE' | 'INCOME') {
  return apiFetch<CategoryOption[]>(`/lookup/categories?type=${type}`, {
    method: 'GET',
    token,
  });
}

export async function fetchAccounts(token: string) {
  return apiFetch<AccountOption[]>(`/lookup/accounts`, {
    method: 'GET',
    token,
  });
}

export async function createTransaction(
  token: string,
  body: {
    type: string;
    amount: number;
    categoryId: number;
    accountId: number;
    note?: string;
    imageUrl?: string;
    location?: string;
    transactionDate: string;
  }
) {
  return apiFetch<TransactionListItem>('/transactions', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}

export async function getTransactionDetail(token: string, id: number) {
  return apiFetch<{
    id: number;
    type: string;
    amount: string;
    categoryId?: number;
    categoryName?: string;
    accountId?: number;
    accountName?: string;
    note?: string;
    imageUrl?: string;
    location?: string;
    transactionDate: string;
  }>(`/transactions/${id}`, { method: 'GET', token });
}

export async function deleteTransaction(token: string, id: number) {
  return apiFetch<null>(`/transactions/${id}`, { method: 'DELETE', token });
}
