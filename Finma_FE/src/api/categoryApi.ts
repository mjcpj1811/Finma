import { request } from './httpClient';
import {
  type CategoryDetail,
  type CategoryActionResponse,
  type CategoryDashboard,
  type CategoryItem,
  type CreateCategoryPayload,
  type UpdateCategoryPayload,
} from '../types/category';

const CATEGORY_ENDPOINTS = {
  list: '/categories',
  create: '/categories',
  detail: (id: string) => `/categories/${id}`,
  update: (id: string) => `/categories/${id}`,
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
  color?: string | null;
  isDefault?: boolean | null;
  parent?: {
    id: number;
  } | null;
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
  piggy_bank: 'savings',
  schedule: 'schedule',
  calendar_sync: 'schedule',
  payments: 'payments',
  debt: 'payments',
  shopping: 'shopping',
  shopping_bag: 'shopping',
  grocery: 'shopping',
  restaurant: 'restaurant',
  card_giftcard: 'card_giftcard',
  gift: 'card_giftcard',
  healing: 'healing',
  medical: 'healing',
  movie: 'movie',
  entertainment: 'movie',
  directions_bus: 'directions_bus',
  transport: 'directions_bus',
  attach_money: 'attach_money',
  salary: 'attach_money',
  account_balance_wallet: 'account_balance_wallet',
  subsidy: 'account_balance_wallet',
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

const mapCategoryDetail = (item: BackendCategory): CategoryDetail => ({
  ...mapCategory(item),
  color: item.color ?? null,
  parentId: item.parent?.id != null ? String(item.parent.id) : null,
});

const toCategoryRequestBody = (
  payload: CreateCategoryPayload | UpdateCategoryPayload,
): Record<string, unknown> => {
  const parentId = payload.parentId != null && payload.parentId !== ''
    ? Number.parseInt(payload.parentId, 10)
    : null;

  return {
    name: payload.name.trim(),
    type: groupToType[payload.group],
    icon: payload.iconKey,
    color: payload.color ?? null,
    parentId: Number.isFinite(parentId as number) ? parentId : null,
  };
};

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
      body: toCategoryRequestBody(payload),
      token,
    });

    return {
      success: true,
      categoryId: String(response.result.id),
    } as CategoryActionResponse;
  },

  updateCategory: async (categoryId: string, payload: UpdateCategoryPayload, token?: string) => {
    const response = await request<ApiResponse<BackendCategory>>(CATEGORY_ENDPOINTS.update(categoryId), {
      method: 'PUT',
      body: toCategoryRequestBody(payload),
      token,
    });

    return {
      success: true,
      categoryId: String(response.result.id),
    } as CategoryActionResponse;
  },

  getCategoryById: async (categoryId: string, token?: string) => {
    const response = await request<ApiResponse<BackendCategory>>(CATEGORY_ENDPOINTS.detail(categoryId), { token });
    return mapCategoryDetail(response.result);
  },

  deleteCategory: async (categoryId: string, token?: string) => {
    await request<ApiResponse<null>>(CATEGORY_ENDPOINTS.remove(categoryId), {
      method: 'DELETE',
      token,
    });

    return { success: true, categoryId } as CategoryActionResponse;
  },
};
