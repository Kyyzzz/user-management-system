import api from './api';
import type { LoginCredentials, LoginResponse, CreateUserDto, User } from '../types/index.ts';
import { tokenStorage } from '../utils/tokenStorage';

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    const { access_token, refresh_token, user } = response.data;
    
    tokenStorage.setToken(access_token);
    tokenStorage.setRefreshToken(refresh_token);
    tokenStorage.setUser(user);
    
    return response.data;
  },

  async register(userData: CreateUserDto): Promise<User> {
    const response = await api.post<User>('/auth/register', userData);
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      tokenStorage.clear();
    }
  },

  isAuthenticated(): boolean {
    return !!tokenStorage.getToken();
  },

  getCurrentUser() {
    return tokenStorage.getUser();
  },
};
