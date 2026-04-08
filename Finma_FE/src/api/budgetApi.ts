import { request } from './httpClient';
import type { BudgetRequest, BudgetResponse } from '../types/budget';
import type { CategoryItem } from '../types/category';

const BUDGET_ENDPOINTS = {
  categories: '/budgets/categories',
  list: '/budgets',
  active: '/budgets/active',
  create: '/budgets',
  detail: (id: string) => `/budgets/${id}`,
  update: (id: string) => `/budgets/${id}`,
  delete: (id: string) => `/budgets/${id}`,
};

type ApiResponse<T> = {
  code: number;
  message?: string;
  result: T;
};

/**
 * Get list of expense categories available for budget creation
 */
export const getCategories = async (): Promise<CategoryItem[]> => {
  const response = await request<ApiResponse<CategoryItem[]>>(BUDGET_ENDPOINTS.categories);
  return response.result ?? [];
};

/**
 * Create a new budget
 */
export const createBudget = async (payload: BudgetRequest): Promise<BudgetResponse> => {
  const response = await request<ApiResponse<BudgetResponse>>(BUDGET_ENDPOINTS.create, {
    method: 'POST',
    body: payload,
  });
  return response.result;
};

/**
 * Get all budgets for the current user
 */
export const getBudgets = async (): Promise<BudgetResponse[]> => {
  const response = await request<ApiResponse<BudgetResponse[]>>(BUDGET_ENDPOINTS.list);
  return response.result ?? [];
};

/**
 * Get active budgets (current period)
 */
export const getActiveBudgets = async (): Promise<BudgetResponse[]> => {
  const response = await request<ApiResponse<BudgetResponse[]>>(BUDGET_ENDPOINTS.active);
  return response.result ?? [];
};

/**
 * Get a specific budget by ID
 */
export const getBudget = async (id: string): Promise<BudgetResponse> => {
  const response = await request<ApiResponse<BudgetResponse>>(BUDGET_ENDPOINTS.detail(id));
  return response.result;
};

/**
 * Update an existing budget
 */
export const updateBudget = async (id: string, payload: BudgetRequest): Promise<BudgetResponse> => {
  const response = await request<ApiResponse<BudgetResponse>>(BUDGET_ENDPOINTS.update(id), {
    method: 'PUT',
    body: payload,
  });
  return response.result;
};

/**
 * Delete a budget
 */
export const deleteBudget = async (id: string): Promise<void> => {
  await request<ApiResponse<void>>(BUDGET_ENDPOINTS.delete(id), {
    method: 'DELETE',
  });
};
