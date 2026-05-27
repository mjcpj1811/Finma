import { request } from './httpClient';
import { categoryApi } from './categoryApi';
import {
  type SearchFilters,
  type SearchOptionsResponse,
  type SearchResultItem,
  type SearchResultResponse,
} from '../types/search';

const SEARCH_API_USE_MOCK = false;

const SEARCH_ENDPOINTS = {
  options: '/report/search/options',
  search: '/report/search',
};

type ApiResponse<T> = {
  code: number;
  message?: string;
  result: T;
};

type BackendSearchItem = {
  id: number;
  title: string;
  timeLabel: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  categoryId?: number | null;
};

type BackendSearchResultResponse = {
  items: BackendSearchItem[];
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

/**
 * Nhãn tìm kiếm từ backend có thể chứa tên tháng tiếng Anh; UI báo cáo mobile
 * nội địa hóa nhãn mà không đổi contract response của API.
 */
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

/**
 * Tạo bảng tra icon theo id để kết quả tìm kiếm dùng cùng icon với danh sách
 * giao dịch.
 */
const buildCategoryIconMap = async (token?: string) => {
  const dashboard = await categoryApi.getDashboard(token);
  const allCategories = [
    ...dashboard.groups.financial,
    ...dashboard.groups.expense,
    ...dashboard.groups.income,
  ];

  return allCategories.reduce<Record<string, string>>((acc, category) => {
    acc[category.id] = category.iconKey;
    return acc;
  }, {});
};

export const searchApi = {
  /**
   * Tải danh sách danh mục cho bộ lọc tìm kiếm báo cáo.
   */
  getOptions: async (token?: string) => {
    if (SEARCH_API_USE_MOCK) {
      await sleep(120);
      return mockOptions;
    }

    const response = await request<ApiResponse<SearchOptionsResponse>>(SEARCH_ENDPOINTS.options, { token });
    return response.result ?? mockOptions;
  },

  /**
   * Tìm kiếm giao dịch thu nhập hoặc chi tiêu theo từ khóa, danh mục và ngày.
   */
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

      return {
        items: filtered.map((item) => ({
          ...item,
          iconKey: item.type === 'income' ? 'attach_money' : 'shopping',
        })),
      } satisfies SearchResultResponse;
    }

    const [response, categoryIconMapById] = await Promise.all([
      request<ApiResponse<BackendSearchResultResponse>>(SEARCH_ENDPOINTS.search, {
        method: 'POST',
        body: {
          keyword: filters.keyword,
          categoryId: filters.categoryId,
          date: filters.date,
          reportType: filters.reportType,
        },
        token,
      }),
      buildCategoryIconMap(token),
    ]);

    const items = (response.result?.items ?? []).map((item) => {
      const type = item.type === 'INCOME' ? 'income' : 'expense';
      const categoryId = item.categoryId != null ? String(item.categoryId) : undefined;
      return {
        id: String(item.id),
        title: item.title,
        timeLabel: localizeDateLabel(item.timeLabel),
        amount: Number(item.amount) || 0,
        type,
        categoryId,
        iconKey: (categoryId ? categoryIconMapById[categoryId] : undefined) ?? (type === 'income' ? 'attach_money' : 'shopping'),
      } satisfies SearchResultItem;
    });

    return { items };
  },
};
