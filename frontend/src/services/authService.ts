import api from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  role: string;
  departmentId?: string;
  departmentName?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: UserDto;
  token?: string;
}

export const authService = {
  async entrar(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/api/autenticacao/entrar', credentials);
      
      if (response.data.success && response.data.token && response.data.user) {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao fazer login',
      };
    }
  },

  async registrar(data: {
    email: string;
    fullName: string;
    password: string;
    confirmPassword: string;
  }): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/api/autenticacao/registrar', data);
      if (response.data.success && response.data.token && response.data.user) {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao registrar',
      };
    }
  },

  sair(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  obterUsuarioArmazenado(): UserDto | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  obterToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  estaAutenticado(): boolean {
    return !!this.obterToken();
  },
};
