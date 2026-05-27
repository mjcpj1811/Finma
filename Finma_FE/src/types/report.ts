import { type HomeOverview } from './home';

/** Kỳ báo cáo được chọn trên màn hình phân tích. */
export type ReportFilter = 'day' | 'week' | 'month' | 'year';

/** Một mốc dữ liệu biểu đồ; thu nhập và chi tiêu được vẽ thành cặp cột. */
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

/**
 * Payload dashboard trả về từ `/report/dashboard`.
 *
 * Các trường budget và goal là dữ liệu ngữ cảnh của dashboard; giá trị cốt lõi
 * của báo cáo cá nhân là `incomeTotal`, `expenseTotal` và `chart`.
 */
export type ReportDashboard = {
  overview: HomeOverview;
  goalSummaryText: string;
  incomeTotal: number;
  expenseTotal: number;
  chart: ReportChartPoint[];
  targets: ReportTarget[];
  unreadNotifications: number;
};
