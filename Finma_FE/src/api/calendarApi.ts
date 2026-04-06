import { request } from './httpClient';
import {
  type CalendarCategoryResponse,
  type CalendarQuery,
  type CalendarTransactionsResponse,
} from '../types/calendar';

const CALENDAR_API_USE_MOCK = true;

const CALENDAR_ENDPOINTS = {
  transactions: '/report/calendar/transactions',
  categories: '/report/calendar/categories',
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockTransactions: CalendarTransactionsResponse = {
  unreadNotifications: 1,
  items: [
    {
      id: 'txn-cal-1',
      title: 'Thực phẩm',
      timeLabel: '17:00 - April 24',
      subLabel: 'Đồ hộp',
      amount: -100000,
      kind: 'expense',
    },
    {
      id: 'txn-cal-2',
      title: 'Khác',
      timeLabel: '17:00 - April 24',
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
      return mockTransactions;
    }

    const dayQuery = query.day ? `&day=${query.day}` : '';

    return request<CalendarTransactionsResponse>(
      `${CALENDAR_ENDPOINTS.transactions}?month=${query.month}&year=${query.year}${dayQuery}`,
      { token },
    );
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