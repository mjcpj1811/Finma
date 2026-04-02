export type SearchReportType = 'income' | 'expense';

export type SearchCategoryOption = {
  id: string;
  label: string;
};

export type SearchResultItem = {
  id: string;
  title: string;
  timeLabel: string;
  amount: number;
  type: SearchReportType;
  categoryId?: string;
};

export type SearchFilters = {
  keyword: string;
  categoryId?: string;
  date: string;
  reportType: SearchReportType;
};

export type SearchOptionsResponse = {
  categories: SearchCategoryOption[];
};

export type SearchResultResponse = {
  items: SearchResultItem[];
};