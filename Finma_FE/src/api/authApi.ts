import { request } from './httpClient';

export type LoginPayload = {
  usernameOrEmail: string;
  password: string;
};

type ApiResponse<T> = {
  code: number;
  message?: string;
  result?: T;
};

type BackendAuthenticationResult = {
  token: string;
  authenticated: boolean;
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
  login: async (payload: LoginPayload) => {
    const response = await request<ApiResponse<BackendAuthenticationResult>>(AUTH_ENDPOINTS.login, {
      method: 'POST',
      omitAuth: true,
      body: {
        username: payload.usernameOrEmail.trim(),
        password: payload.password,
      },
    });

    return {
      message: response.message ?? 'Đăng nhập thành công',
      accessToken: response.result?.token,
    } satisfies AuthResponse;
  },

  register: (payload: RegisterPayload) =>
    request<AuthResponse>(AUTH_ENDPOINTS.register, {
      method: 'POST',
      omitAuth: true,
      body: payload as unknown as Record<string, unknown>,
    }),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    request<AuthResponse>(AUTH_ENDPOINTS.forgotPassword, {
      method: 'POST',
      omitAuth: true,
      body: payload as unknown as Record<string, unknown>,
    }),

  verifyResetCode: (payload: VerifyResetCodePayload) =>
    request<AuthResponse>(AUTH_ENDPOINTS.verifyResetCode, {
      method: 'POST',
      omitAuth: true,
      body: payload as unknown as Record<string, unknown>,
    }),

  resetPassword: (payload: ResetPasswordPayload) =>
    request<AuthResponse>(AUTH_ENDPOINTS.resetPassword, {
      method: 'POST',
      omitAuth: true,
      body: payload as unknown as Record<string, unknown>,
    }),
};
