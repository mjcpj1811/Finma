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
  verifyResetCode: '/auth/verify-reset-code',//chưa test
  login: '/auth/login',                      // Trỏ đến AuthenticationController
  register: '/users',                        // Trỏ đến UserController (@PostMapping)
  forgotPassword: '/users/forgot-password',  // Trỏ đến UserController
  resetPassword: '/users/reset-password',    // Trỏ đến UserController
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
      timeoutMs: 60000,
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

  resetPasswordByToken: (payload: { token: string; newPassword: string }) =>
    request<AuthResponse>(AUTH_ENDPOINTS.resetPassword, {
      method: 'POST',
      omitAuth: true,
      body: payload as unknown as Record<string, unknown>,
    }),

  // ===== [MOBILE OAUTH] Gửi access token từ Google/Facebook lên BE để verify và nhận JWT =====
  // Flow: expo-auth-session lấy token từ provider → gọi API này → BE verify → trả JWT
  mobileOAuthLogin: async (provider: string, accessToken: string, idToken?: string) => {
    const response = await request<ApiResponse<BackendAuthenticationResult>>(
      '/auth/oauth2/mobile-login',
      {
        method: 'POST',
        omitAuth: true,
        body: { provider, accessToken, idToken },
      }
    );
    return {
      message: 'Đăng nhập thành công',
      accessToken: response.result?.token,
    } satisfies AuthResponse;
  },
};
