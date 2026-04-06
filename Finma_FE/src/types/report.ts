import { type HomeOverview } from './home';

export type ReportFilter = 'day' | 'week' | 'month' | 'year';

export type ReportChartPoint = {
  id: string;
  label: string;
  income: number;
  expense: number;
};

export type ReportTarget = {
  id: string;
  title: string;
  progressPercent: number;
};

export type ReportDashboard = {
  overview: HomeOverview;
  goalSummaryText: string;
  incomeTotal: number;
  expenseTotal: number;
  chart: ReportChartPoint[];
  targets: ReportTarget[];
  unreadNotifications: number;
};