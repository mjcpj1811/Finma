import { request } from './httpClient';
import {
  type CategoryActionResponse,
  type CategoryDashboard,
  type CategoryGroup,
  type CategoryItem,
  type CreateCategoryPayload,
} from '../types/category';

const CATEGORY_API_USE_MOCK = true;

const CATEGORY_ENDPOINTS = {
  dashboard: '/categories/dashboard',
  create: '/categories',
  remove: (id: string) => `/categories/${id}`,
};

let mockCategories: CategoryItem[] = [
  { id: 'cat-1', name: 'Tiết Kiệm', group: 'financial', iconKey: 'savings', isDefault: true },
  { id: 'cat-2', name: 'Định Kỳ', group: 'financial', iconKey: 'schedule', isDefault: true },
  { id: 'cat-3', name: 'Vay Nợ', group: 'financial', iconKey: 'payments', isDefault: true },
  { id: 'cat-4', name: 'Thực Phẩm', group: 'expense', iconKey: 'shopping', isDefault: true },
  { id: 'cat-5', name: 'Ăn Uống', group: 'expense', iconKey: 'restaurant', isDefault: true },
  { id: 'cat-6', name: 'Quà Tặng', group: 'expense', iconKey: 'card_giftcard', isDefault: true },
  { id: 'cat-7', name: 'Y Tế', group: 'expense', iconKey: 'healing', isDefault: true },
  { id: 'cat-8', name: 'Giải Trí', group: 'expense', iconKey: 'movie', isDefault: true },
  { id: 'cat-9', name: 'Di Chuyển', group: 'expense', iconKey: 'directions_bus', isDefault: true },
  { id: 'cat-10', name: 'Lương', group: 'income', iconKey: 'attach_money', isDefault: true },
  { id: 'cat-11', name: 'Trợ Cấp', group: 'income', iconKey: 'account_balance_wallet', isDefault: true },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const byGroup = (group: CategoryGroup) => mockCategories.filter((item) => item.group === group);

const buildDashboard = (): CategoryDashboard => ({
  overview: {
    totalBalance: 10000000,
    totalExpense: 3000000,
    budgetUsedPercent: 30,
    budgetLimit: 10000000,
    unreadNotifications: 1,
  },
  groups: {
    financial: byGroup('financial'),
    expense: byGroup('expense'),
    income: byGroup('income'),
  },
});

export const categoryApi = {
  getDashboard: async (token?: string) => {
    if (CATEGORY_API_USE_MOCK) {
      await sleep(180);
      return buildDashboard();
    }

    return request<CategoryDashboard>(CATEGORY_ENDPOINTS.dashboard, { token });
  },

  createCategory: async (payload: CreateCategoryPayload, token?: string) => {
    if (CATEGORY_API_USE_MOCK) {
      await sleep(120);
      const categoryId = `cat-${Date.now()}`;
      mockCategories = [
        ...mockCategories,
        {
          id: categoryId,
          name: payload.name.trim(),
          group: payload.group,
          iconKey: payload.iconKey,
          isDefault: false,
        },
      ];

      return { success: true, categoryId } satisfies CategoryActionResponse;
    }

    return request<CategoryActionResponse>(CATEGORY_ENDPOINTS.create, {
      method: 'POST',
      body: payload,
      token,
    });
  },

  deleteCategory: async (categoryId: string, token?: string) => {
    if (CATEGORY_API_USE_MOCK) {
      await sleep(120);
      const found = mockCategories.find((item) => item.id === categoryId);
      if (!found) {
        return { success: false, message: 'Không tìm thấy danh mục.' } satisfies CategoryActionResponse;
      }

      if (found.isDefault) {
        return {
          success: false,
          message: 'Danh mục mặc định không thể xóa.',
        } satisfies CategoryActionResponse;
      }

      mockCategories = mockCategories.filter((item) => item.id !== categoryId);
      return { success: true, categoryId } satisfies CategoryActionResponse;
    }

    return request<CategoryActionResponse>(CATEGORY_ENDPOINTS.remove(categoryId), {
      method: 'DELETE',
      token,
    });
  },
};
