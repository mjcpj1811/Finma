import { request } from './httpClient';
import { categoryApi } from './categoryApi';
import { type HomeDashboard, type HomeOverview, type HomeHeaderSummary, type PeriodFilter, type TransactionItem } from '../types/home';
import { type ReportDashboard } from '../types/report';

const HOME_ENDPOINTS = {
  userInfo: '/users/my-info',
  summary: '/reports/summary',
  dashboard: '/report/dashboard',
  transactions: '/transactions',
};

type ApiResponse<T> = {
  code: number;
  message?: string;
  result: T;
};

type BackendUser = {
  id: number;
  username: string;
  fullName?: string | null;
};

type BackendTransactionItem = {
  id: number;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  categoryId?: number | null;
  category_id?: number | null;
  categoryID?: number | null;
  category?: string | { id?: number | null; name?: string | null; icon?: string | null; iconKey?: string | null } | null;
  categoryIcon?: string | null;
  icon?: string | null;
  note?: string | null;
  date?: string | null;
  transactionDateTime?: string | null;
};

type BackendSummary = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
};

type BackendReportDashboard = ReportDashboard;

const pad2 = (value: number) => String(value).padStart(2, '0');
const toViMonthLabel = (date: Date) => `Tháng ${date.getMonth() + 1}`;

const formatApiDate = (date: Date) => {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${year}-${month}-${day}`;
};

const formatApiDateTime = (date: Date) =>
  `${formatApiDate(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const startOfWeek = (date: Date) => {
  const current = new Date(date);
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  current.setDate(current.getDate() + diff);
  return startOfDay(current);
};

const endOfWeek = (date: Date) => {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return endOfDay(end);
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

const shiftDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const shiftMonths = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
};

const getCurrentRange = (period: PeriodFilter, reference = new Date()) => {
  switch (period) {
    case 'day':
      return { from: formatApiDate(startOfDay(reference)), to: formatApiDateTime(endOfDay(reference)) };
    case 'week':
      return { from: formatApiDate(startOfWeek(reference)), to: formatApiDateTime(endOfWeek(reference)) };
    case 'month':
    default:
      return { from: formatApiDate(startOfMonth(reference)), to: formatApiDateTime(endOfMonth(reference)) };
  }
};

const getPreviousRange = (period: PeriodFilter, reference = new Date()) => {
  switch (period) {
    case 'day': {
      const previous = shiftDays(reference, -1);
      return { from: formatApiDate(startOfDay(previous)), to: formatApiDateTime(endOfDay(previous)) };
    }
    case 'week': {
      const currentStart = startOfWeek(reference);
      const previousStart = shiftDays(currentStart, -7);
      const previousEnd = shiftDays(previousStart, 6);
      return { from: formatApiDate(previousStart), to: formatApiDateTime(endOfDay(previousEnd)) };
    }
    case 'month':
    default: {
      const previous = shiftMonths(reference, -1);
      return { from: formatApiDate(startOfMonth(previous)), to: formatApiDateTime(endOfMonth(previous)) };
    }
  }
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

const formatTimeLabel = (date: Date) => {
  const month = toViMonthLabel(date);
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())} - ${month} ${pad2(date.getDate())}`;
};

const toIconKey = (categoryLabel: string, type: 'income' | 'expense'): TransactionItem['iconKey'] => {
  if (type === 'income') {
    return 'attach_money';
  }

  const normalized = categoryLabel.toLowerCase();
  if (normalized.includes('ăn') || normalized.includes('food') || normalized.includes('thực')) {
    return 'restaurant';
  }
  if (normalized.includes('nhà') || normalized.includes('rent') || normalized.includes('thuê')) {
    return 'home';
  }
  if (normalized.includes('xe') || normalized.includes('bus') || normalized.includes('đi') || normalized.includes('transport') || normalized.includes('xăng')) {
    return 'directions_bus';
  }

  return 'shopping';
};

const normalizeCategoryLabel = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const resolveBackendCategoryId = (item: BackendTransactionItem): string => {
  const directId = item.categoryId ?? item.category_id ?? item.categoryID;
  if (directId != null && Number.isFinite(Number(directId))) {
    return String(directId);
  }

  if (item.category && typeof item.category === 'object') {
    const nestedId = item.category.id;
    if (nestedId != null && Number.isFinite(Number(nestedId))) {
      return String(nestedId);
    }
  }

  return '';
};

const resolveBackendCategoryLabel = (item: BackendTransactionItem): string => {
  if (typeof item.category === 'string') {
    return item.category;
  }

  if (item.category && typeof item.category === 'object') {
    return toOptionalString(item.category.name) ?? '';
  }

  return '';
};

const resolveBackendCategoryIcon = (item: BackendTransactionItem): string | undefined => {
  if (item.category && typeof item.category === 'object') {
    const nestedIcon = toOptionalString(item.category.iconKey) ?? toOptionalString(item.category.icon);
    if (nestedIcon) {
      return nestedIcon;
    }
  }

  return toOptionalString(item.categoryIcon) ?? toOptionalString(item.icon);
};

const buildCategoryIconLookups = async (token?: string) => {
  const dashboard = await categoryApi.getDashboard(token);
  const allCategories = [
    ...dashboard.groups.financial,
    ...dashboard.groups.expense,
    ...dashboard.groups.income,
  ];

  return allCategories.reduce<{
    byId: Record<string, TransactionItem['iconKey']>;
    byName: Record<string, TransactionItem['iconKey']>;
  }>((acc, category) => {
    acc.byId[category.id] = category.iconKey;
    acc.byName[normalizeCategoryLabel(category.name)] = category.iconKey;
    return acc;
  }, { byId: {}, byName: {} });
};

const buildGreetingText = () => {
  const hour = new Date().getHours();
  if (hour < 11) {
    return 'Chào buổi sáng';
  }
  if (hour < 17) {
    return 'Chào buổi trưa';
  }
  return 'Chào buổi tối';
};

const mapTransactionItem = (
  item: BackendTransactionItem,
  categoryIconLookups: {
    byId: Record<string, TransactionItem['iconKey']>;
    byName: Record<string, TransactionItem['iconKey']>;
  },
): TransactionItem => {
  const date = parseBackendDateTime(item.transactionDateTime ?? item.date);
  const parsed = splitNote(item.note);
  const type = item.type === 'INCOME' ? 'income' : 'expense';
  const categoryName = resolveBackendCategoryLabel(item);
  const categoryLabel = categoryName || parsed.detail || '-';
  const categoryId = resolveBackendCategoryId(item);
  const backendIcon = resolveBackendCategoryIcon(item);
  const normalizedCategoryLabel = normalizeCategoryLabel(categoryLabel);

  return {
    id: String(item.id),
    title: parsed.title || categoryName || 'Giao dịch',
    timeLabel: formatTimeLabel(date),
    categoryLabel,
    amount: type === 'expense' ? -Math.abs(Number(item.amount) || 0) : Math.abs(Number(item.amount) || 0),
    kind: type,
    iconKey:
      categoryIconLookups.byId[categoryId] ??
      categoryIconLookups.byName[normalizedCategoryLabel] ??
      backendIcon ??
      toIconKey(categoryLabel, type),
  };
};

export const homeApi = {
  getDashboard: async (period: PeriodFilter = 'month', token?: string) => {
    const currentRange = getCurrentRange(period);
    const previousRange = getPreviousRange(period);

    const [currentDashboardResponse, previousSummaryResponse, userResponse, transactionsResponse, categoryIconLookups] = await Promise.all([
      request<BackendReportDashboard>(`${HOME_ENDPOINTS.dashboard}?period=${period}`, { token }),
      request<ApiResponse<BackendSummary>>(
        `${HOME_ENDPOINTS.summary}?from=${encodeURIComponent(previousRange.from)}&to=${encodeURIComponent(previousRange.to)}`,
        { token },
      ),
      request<ApiResponse<BackendUser>>(HOME_ENDPOINTS.userInfo, { token }),
      request<ApiResponse<BackendTransactionItem[]>>(
        `${HOME_ENDPOINTS.transactions}?from=${encodeURIComponent(currentRange.from)}&to=${encodeURIComponent(currentRange.to)}`,
        { token },
      ),
      buildCategoryIconLookups(token),
    ]);

    const user = userResponse.result;
    const currentDashboard = currentDashboardResponse;
    const previousSummary = previousSummaryResponse.result;

    return {
      user: {
        id: String(user.id),
        name: user.fullName?.trim() || user.username,
        greetingText: buildGreetingText(),
        unreadNotifications: currentDashboard.unreadNotifications,
      },
      overview: currentDashboard.overview as HomeOverview,
      goalSummaryText: currentDashboard.goalSummaryText,
      headerSummary: {
        totalIncome: Number(previousSummary.totalIncome ?? 0),
        totalExpense: Number(previousSummary.totalExpense ?? 0),
      },
      transactions: (transactionsResponse.result ?? []).map((item) => mapTransactionItem(item, categoryIconLookups)),
      unreadNotifications: currentDashboard.unreadNotifications,
    } satisfies HomeDashboard;
  },
};
