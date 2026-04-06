import { request } from './httpClient';
import {
  type SearchFilters,
  type SearchOptionsResponse,
  type SearchResultItem,
  type SearchResultResponse,
} from '../types/search';

const SEARCH_API_USE_MOCK = true;

const SEARCH_ENDPOINTS = {
  options: '/report/search/options',
  search: '/report/search',
};

const mockOptions: SearchOptionsResponse = {
  categories: [
    { id: 'all', label: 'Chọn danh mục' },
    { id: 'food', label: 'Ăn uống' },
    { id: 'salary', label: 'Lương' },
    { id: 'travel', label: 'Du lịch' },
  ],
};

const mockItems: SearchResultItem[] = [
  {
    id: 'item-1',
    title: 'Bữa tối',
    timeLabel: '18:27 - April 30',
    amount: 36000,
    type: 'expense',
    categoryId: 'food',
  },
  {
    id: 'item-2',
    title: 'Lương tháng',
    timeLabel: '08:00 - April 30',
    amount: 4100000,
    type: 'income',
    categoryId: 'salary',
  },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const searchApi = {
  getOptions: async (token?: string) => {
    if (SEARCH_API_USE_MOCK) {
      await sleep(120);
      return mockOptions;
    }

    return request<SearchOptionsResponse>(SEARCH_ENDPOINTS.options, { token });
  },

  searchReport: async (filters: SearchFilters, token?: string) => {
    if (SEARCH_API_USE_MOCK) {
      await sleep(160);
      const keyword = filters.keyword.trim().toLowerCase();
      const filtered = mockItems.filter((item) => {
        const byType = item.type === filters.reportType;
        const byCategory = !filters.categoryId || filters.categoryId === 'all' || item.categoryId === filters.categoryId;
        const byKeyword = !keyword || item.title.toLowerCase().includes(keyword);
        return byType && byCategory && byKeyword;
      });

      return { items: filtered } satisfies SearchResultResponse;
    }

    return request<SearchResultResponse>(SEARCH_ENDPOINTS.search, {
      method: 'POST',
      body: {
        keyword: filters.keyword,
        categoryId: filters.categoryId,
        date: filters.date,
        reportType: filters.reportType,
      },
      token,
    });
  },
};