import { request } from './httpClient';
import { categoryApi } from './categoryApi';
import {
  type CalendarCategoryResponse,
  type CalendarQuery,
  type CalendarTransactionsResponse,
} from '../types/calendar';

const CALENDAR_API_USE_MOCK = false;

const CALENDAR_ENDPOINTS = {
  transactions: '/report/calendar/transactions',
  categories: '/report/calendar/categories',
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type BackendCalendarTransactionItem = {
  id: number;
  title: string;
  timeLabel: string;
  subLabel: string;
  amount: number;
  kind: 'income' | 'expense' | 'INCOME' | 'EXPENSE';
  categoryId?: number | string | null;
  categoryName?: string | null;
  category?: string | null;
  iconKey?: string | null;
};

type BackendCalendarTransactionsResponse = {
  unreadNotifications: number;
  items: BackendCalendarTransactionItem[];
};

const MONTH_EN_TO_VI: Record<string, string> = {
  january: 'Tháng 1',
  february: 'Tháng 2',
  march: 'Tháng 3',
  april: 'Tháng 4',
  may: 'Tháng 5',
  june: 'Tháng 6',
  july: 'Tháng 7',
  august: 'Tháng 8',
  september: 'Tháng 9',
  october: 'Tháng 10',
  november: 'Tháng 11',
  december: 'Tháng 12',
};

const localizeDateLabel = (value?: string | null) => {
  const raw = (value ?? '').trim();
  if (!raw) {
    return '';
  }
  return raw.replace(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/gi, (matched) => {
    const mapped = MONTH_EN_TO_VI[matched.toLowerCase()];
    return mapped ?? matched;
  });
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

const mockTransactions: CalendarTransactionsResponse = {
  unreadNotifications: 1,
  items: [
    {
      id: 'txn-cal-1',
      title: 'Thực phẩm',
      timeLabel: '17:00 - Tháng 4 24',
      subLabel: 'Đồ hộp',
      amount: -100000,
      kind: 'expense',
    },
    {
      id: 'txn-cal-2',
      title: 'Khác',
      timeLabel: '17:00 - Tháng 4 24',
      subLabel: 'Payments',
      amount: 120000,
      kind: 'income',
    },
  ],
};

const mockCategories: CalendarCategoryResponse = {
  unreadNotifications: 1,
  slices: [
    { id: 'food', label: 'Thực phẩm', percent: 10, color: '#2563EB' },
    { id: 'other', label: 'Khác', percent: 79, color: '#1D9BF0' },
    { id: 'saving', label: 'Tiết kiệm', percent: 11, color: '#60A5FA' },
  ],
};

export const calendarApi = {
  getTransactions: async (query: CalendarQuery, token?: string) => {
    if (CALENDAR_API_USE_MOCK) {
      await sleep(180);
      return {
        ...mockTransactions,
        items: mockTransactions.items.map((item) => ({
          ...item,
          iconKey: item.kind === 'income' ? 'attach_money' : 'shopping',
        })),
      };
    }

    const dayQuery = query.day ? `&day=${query.day}` : '';

    const [response, categoryIconLookups] = await Promise.all([
      request<BackendCalendarTransactionsResponse>(
        `${CALENDAR_ENDPOINTS.transactions}?month=${query.month}&year=${query.year}${dayQuery}`,
        { token },
      ),
      buildCategoryIconLookups(token),
    ]);

    return {
      unreadNotifications: response.unreadNotifications ?? 0,
      items: (response.items ?? []).map((item) => {
        const kind = item.kind === 'INCOME' ? 'income' : item.kind === 'EXPENSE' ? 'expense' : item.kind;
        const categoryId = item.categoryId != null ? String(item.categoryId) : undefined;
        const labelCandidate = item.categoryName ?? item.category ?? item.subLabel ?? item.title ?? '';
        const normalizedLabel = normalizeCategoryLabel(labelCandidate);
        return {
          id: String(item.id),
          title: item.title,
          timeLabel: localizeDateLabel(item.timeLabel),
          subLabel: item.subLabel,
          amount: Number(item.amount) || 0,
          kind,
          iconKey:
            (categoryId ? categoryIconLookups.byId[categoryId] : undefined) ??
            categoryIconLookups.byName[normalizedLabel] ??
            item.iconKey ??
            (kind === 'income' ? 'attach_money' : 'shopping'),
        };
      }),
    } satisfies CalendarTransactionsResponse;
  },

  getCategories: async (query: CalendarQuery, token?: string) => {
    if (CALENDAR_API_USE_MOCK) {
      await sleep(180);
      return mockCategories;
    }

    const dayQuery = query.day ? `&day=${query.day}` : '';

    return request<CalendarCategoryResponse>(
      `${CALENDAR_ENDPOINTS.categories}?month=${query.month}&year=${query.year}${dayQuery}`,
      { token },
    );
  },
};