import { request } from './httpClient';
import {
  type CategoryActionResponse,
  type CategoryDashboard,
  type CategoryItem,
  type CreateCategoryPayload,
} from '../types/category';

const CATEGORY_ENDPOINTS = {
  list: '/categories',
  create: '/categories',
  remove: (id: string) => `/categories/${id}`,
};

type ApiResponse<T> = {
  code: number;
  message?: string;
  result: T;
};

type BackendCategoryType = 'FINANCE' | 'EXPENSE' | 'INCOME';

type BackendCategory = {
  id: number;
  name: string;
  type: BackendCategoryType;
  icon?: string | null;
  isDefault?: boolean | null;
  children?: BackendCategory[] | null;
};

const groupToType = {
  financial: 'FINANCE',
  expense: 'EXPENSE',
  income: 'INCOME',
} as const;

const typeToGroup = {
  FINANCE: 'financial',
  EXPENSE: 'expense',
  INCOME: 'income',
} as const;

const iconAliases: Record<string, CategoryItem['iconKey']> = {
  savings: 'savings',
  schedule: 'schedule',
  payments: 'payments',
  shopping: 'shopping',
  shopping_bag: 'shopping',
  restaurant: 'restaurant',
  card_giftcard: 'card_giftcard',
  healing: 'healing',
  movie: 'movie',
  directions_bus: 'directions_bus',
  attach_money: 'attach_money',
  account_balance_wallet: 'account_balance_wallet',
};

const fallbackIconByType: Record<BackendCategoryType, CategoryItem['iconKey']> = {
  FINANCE: 'savings',
  EXPENSE: 'shopping',
  INCOME: 'attach_money',
};

const normalizeIconKey = (
  icon: string | null | undefined,
  type: BackendCategoryType,
): CategoryItem['iconKey'] => {
  if (!icon) {
    return fallbackIconByType[type];
  }

  const normalized = icon.trim().toLowerCase().replace(/-/g, '_');
  return iconAliases[normalized] ?? fallbackIconByType[type];
};

const flattenCategories = (nodes: BackendCategory[]): BackendCategory[] => {
  return nodes.flatMap((node) => [
    node,
    ...(Array.isArray(node.children) ? flattenCategories(node.children) : []),
  ]);
};

const mapCategory = (item: BackendCategory): CategoryItem => ({
  id: String(item.id),
  name: item.name,
  group: typeToGroup[item.type],
  iconKey: normalizeIconKey(item.icon, item.type),
  isDefault: Boolean(item.isDefault),
});

const fetchByType = async (type: BackendCategoryType, token?: string): Promise<CategoryItem[]> => {
  const response = await request<ApiResponse<BackendCategory[]>>(`${CATEGORY_ENDPOINTS.list}?type=${type}`, { token });
  return flattenCategories(response.result ?? []).map(mapCategory);
};

export const categoryApi = {
  getDashboard: async (token?: string) => {
    const [financial, expense, income] = await Promise.all([
      fetchByType('FINANCE', token),
      fetchByType('EXPENSE', token),
      fetchByType('INCOME', token),
    ]);

    return {
      overview: {
        totalBalance: 0,
        totalExpense: 0,
        budgetUsedPercent: 0,
        budgetLimit: 0,
        unreadNotifications: 0,
      },
      groups: {
        financial,
        expense,
        income,
      },
    } satisfies CategoryDashboard;
  },

  createCategory: async (payload: CreateCategoryPayload, token?: string) => {
    const response = await request<ApiResponse<BackendCategory>>(CATEGORY_ENDPOINTS.create, {
      method: 'POST',
      body: {
        name: payload.name.trim(),
        type: groupToType[payload.group],
        icon: payload.iconKey,
      },
      token,
    });

    return {
      success: true,
      categoryId: String(response.result.id),
    } as CategoryActionResponse;
  },

  deleteCategory: async (categoryId: string, token?: string) => {
    await request<ApiResponse<null>>(CATEGORY_ENDPOINTS.remove(categoryId), {
      method: 'DELETE',
      token,
    });

    return { success: true, categoryId } as CategoryActionResponse;
  },
};
