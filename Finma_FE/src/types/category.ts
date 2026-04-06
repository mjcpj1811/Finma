export type CategoryGroup = 'financial' | 'expense' | 'income';

export type CategoryItem = {
  id: string;
  name: string;
  group: CategoryGroup;
  iconKey:
    | 'savings'
    | 'schedule'
    | 'payments'
    | 'shopping'
    | 'restaurant'
    | 'card_giftcard'
    | 'healing'
    | 'movie'
    | 'directions_bus'
    | 'attach_money'
    | 'account_balance_wallet';
  isDefault: boolean;
};

export type CategoryOverview = {
  totalBalance: number;
  totalExpense: number;
  budgetUsedPercent: number;
  budgetLimit: number;
  unreadNotifications: number;
};

export type CategoryDashboard = {
  overview: CategoryOverview;
  groups: {
    financial: CategoryItem[];
    expense: CategoryItem[];
    income: CategoryItem[];
  };
};

export type CreateCategoryPayload = {
  name: string;
  group: CategoryGroup;
  iconKey: CategoryItem['iconKey'];
  color?: string;
  parentId?: string | null;
};

export type UpdateCategoryPayload = CreateCategoryPayload;

export type CategoryDetail = CategoryItem & {
  color?: string | null;
  parentId?: string | null;
};

export type CategoryActionResponse = {
  success: boolean;
  categoryId?: string;
  message?: string;
};
