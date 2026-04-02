import { request } from './httpClient';

export type LoginPayload = {
  usernameOrEmail: string;
  password: string;
};

export type RegisterPayload = {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  password: string;
  confirmPassword: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type VerifyResetCodePayload = {
  email: string;
  code: string;
};

export type ResetPasswordPayload = {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
};

export type AuthResponse = {
  message: string;
  accessToken?: string;
  refreshToken?: string;
};

const AUTH_ENDPOINTS = {
  login: '/auth/login',
  register: '/auth/register',
  forgotPassword: '/auth/forgot-password',
  verifyResetCode: '/auth/verify-reset-code',
  resetPassword: '/auth/reset-password',
};

export const authApi = {
  login: (payload: LoginPayload) =>
    request<AuthResponse>(AUTH_ENDPOINTS.login, {
      method: 'POST',
      body: payload as unknown as Record<string, unknown>,
    }),

  register: (payload: RegisterPayload) =>
    request<AuthResponse>(AUTH_ENDPOINTS.register, {
      method: 'POST',
      body: payload as unknown as Record<string, unknown>,
    }),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    request<AuthResponse>(AUTH_ENDPOINTS.forgotPassword, {
      method: 'POST',
      body: payload as unknown as Record<string, unknown>,
    }),

  verifyResetCode: (payload: VerifyResetCodePayload) =>
    request<AuthResponse>(AUTH_ENDPOINTS.verifyResetCode, {
      method: 'POST',
      body: payload as unknown as Record<string, unknown>,
    }),

  resetPassword: (payload: ResetPasswordPayload) =>
    request<AuthResponse>(AUTH_ENDPOINTS.resetPassword, {
      method: 'POST',
      body: payload as unknown as Record<string, unknown>,
    }),
};
