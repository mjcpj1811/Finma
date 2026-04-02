import { request } from './httpClient';
import { mockUser } from '../utils/mockUser';
import { type HomeDashboard, type HomeOverview, type PeriodFilter, type TransactionItem, type WeeklySnapshot } from '../types/home';

const HOME_API_USE_MOCK = true;

const HOME_ENDPOINTS = {
  overview: '/home/overview',
  weeklySnapshot: '/home/weekly-snapshot',
  transactions: '/home/transactions',
  dashboard: '/home/dashboard',
};

const mockOverview: HomeOverview = {
  totalBalance: 7783000,
  totalExpense: 1187400,
  budgetUsedPercent: 30,
  budgetLimit: 20000000,
};

const mockWeeklySnapshot: WeeklySnapshot = {
  savingGoalLabel: 'Muc Tieu Tiet Kiem',
  lastWeekIncome: 4000000,
  lastWeekFoodExpense: 100000,
};

const mockTransactions: TransactionItem[] = [
  {
    id: 'txn-1',
    title: 'Luong',
    timeLabel: '18:27 - April 30',
    categoryLabel: '',
    amount: 4000000,
    kind: 'income',
    iconKey: 'salary',
  },
  {
    id: 'txn-2',
    title: 'Thuc Pham',
    timeLabel: '17:00 - April 24',
    categoryLabel: 'Pantry',
    amount: 100000,
    kind: 'expense',
    iconKey: 'food',
  },
  {
    id: 'txn-3',
    title: 'Tien Thue',
    timeLabel: '8:30 - April 15',
    categoryLabel: 'Tien thue',
    amount: 674400,
    kind: 'expense',
    iconKey: 'rent',
  },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockDashboard = async (): Promise<HomeDashboard> => {
  await sleep(250);

  return {
    user: mockUser,
    overview: mockOverview,
    weeklySnapshot: mockWeeklySnapshot,
    transactions: mockTransactions,
  };
};

export const homeApi = {
  getOverview: async (token?: string) => {
    if (HOME_API_USE_MOCK) {
      const data = await mockDashboard();
      return data.overview;
    }

    return request<HomeOverview>(HOME_ENDPOINTS.overview, { token });
  },

  getWeeklySnapshot: async (token?: string) => {
    if (HOME_API_USE_MOCK) {
      const data = await mockDashboard();
      return data.weeklySnapshot;
    }

    return request<WeeklySnapshot>(HOME_ENDPOINTS.weeklySnapshot, { token });
  },

  getTransactions: async (period: PeriodFilter, token?: string) => {
    if (HOME_API_USE_MOCK) {
      const data = await mockDashboard();
      if (period === 'day') {
        return data.transactions.slice(0, 2);
      }
      if (period === 'week') {
        return data.transactions;
      }
      return data.transactions;
    }

    return request<TransactionItem[]>(`${HOME_ENDPOINTS.transactions}?period=${period}`, { token });
  },

  getDashboard: async (period: PeriodFilter = 'month', token?: string) => {
    if (HOME_API_USE_MOCK) {
      const data = await mockDashboard();
      const transactions = await homeApi.getTransactions(period, token);
      return { ...data, transactions };
    }

    return request<HomeDashboard>(`${HOME_ENDPOINTS.dashboard}?period=${period}`, { token });
  },
};
