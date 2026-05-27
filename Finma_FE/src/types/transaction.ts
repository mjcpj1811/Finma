export type TransactionFilter = 'all' | 'income' | 'expense' | 'saving';
export type TransactionType = 'income' | 'expense' | 'saving' | 'finance';
export type TransactionKind = Extract<TransactionType, 'income' | 'expense' | 'saving'>;

export type TransactionOverview = {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  totalSaving: number;
  unreadNotifications: number;
};

export type TransactionItem = {
  id: string;
  categoryId: string;
  monthLabel: string;
  title: string;
  timeLabel: string;
  note: string;
  amount: number;
  /**
   * Hướng hiển thị trên UI được suy ra từ TransactionType của backend. Saving
   * vẫn được giữ vì lớp mapper API đã xử lý bản ghi SAVING, dù màn hình chính
   * của phần Minh tập trung vào thu nhập và chi tiêu.
   */
  kind: TransactionKind;
  iconKey: string;
};

export type TransactionDashboard = {
  overview: TransactionOverview;
  items: TransactionItem[];
};

export type TransactionCategoryOption = {
  id: string;
  label: string;
  type: TransactionType;
};

export type TransactionSourceOption = {
  id: string;
  label: string;
};

export type TransactionFormOptions = {
  categories: TransactionCategoryOption[];
  sources: TransactionSourceOption[];
};

export type CreateTransactionPayload = {
  /** Ngày ISO từ bộ chọn ngày mobile; mapper API chuyển sang định dạng backend. */
  date: string;
  type: TransactionType;
  categoryId: string;
  amount: number;
  title: string;
  sourceId: string;
  detail?: string;
};

export type CreateTransactionResponse = {
  success: boolean;
  transactionId: string;
};

export type TransactionDetail = {
  id: string;
  /** Chuỗi ngày ISO dùng để nạp dữ liệu cho form chỉnh sửa. */
  date: string;
  type: TransactionType;
  categoryId: string;
  categoryLabel: string;
  amount: number;
  title: string;
  sourceId: string;
  sourceLabel: string;
  goalId?: string;
  goalName?: string;
  detail?: string;
  note: string;
  timeLabel: string;
  iconKey: string;
};

export type UpdateTransactionPayload = CreateTransactionPayload;

export type TransactionActionResponse = {
  success: boolean;
};
