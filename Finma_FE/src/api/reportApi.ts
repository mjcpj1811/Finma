import { request } from './httpClient';
import { type ReportDashboard, type ReportFilter } from '../types/report';

const REPORT_API_USE_MOCK = true;

const REPORT_ENDPOINTS = {
  dashboard: '/report/dashboard',
};

const mockDashboard: ReportDashboard = {
  overview: {
    totalBalance: 7783000,
    totalExpense: 1187400,
    budgetUsedPercent: 30,
    budgetLimit: 20000000,
  },
  goalSummaryText: '30% Mục tiêu, 0 Mục tiêu sắp đến hạn',
  incomeTotal: 4100000,
  expenseTotal: 1187400,
  unreadNotifications: 1,
  chart: [
    { id: 'mon', label: 'Mon', income: 7000, expense: 2800 },
    { id: 'tue', label: 'Tue', income: 2100, expense: 4200 },
    { id: 'wed', label: 'Wed', income: 6800, expense: 2600 },
    { id: 'thu', label: 'Thu', income: 3000, expense: 4500 },
    { id: 'fri', label: 'Fri', income: 9000, expense: 8200 },
    { id: 'sat', label: 'Sat', income: 1900, expense: 500 },
    { id: 'sun', label: 'Sun', income: 2900, expense: 6200 },
  ],
  targets: [
    { id: 'target-1', title: 'Du lịch', progressPercent: 30 },
    { id: 'target-2', title: 'Xe máy', progressPercent: 50 },
  ],
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const reportApi = {
  getDashboard: async (period: ReportFilter = 'day', token?: string) => {
    if (REPORT_API_USE_MOCK) {
      await sleep(250);
      return mockDashboard;
    }

    return request<ReportDashboard>(`${REPORT_ENDPOINTS.dashboard}?period=${period}`, { token });
  },
};