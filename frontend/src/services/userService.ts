import api from './api';
import type { User, CreateUserDto, UpdateUserDto } from '../types/index.ts';

export const userService = {
  async getAllUsers(): Promise<User[]> {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  async getUserById(id: number): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  async createUser(userData: CreateUserDto): Promise<User> {
    const response = await api.post<User>('/users', userData);
    return response.data;
  },

  async updateUser(id: number, userData: UpdateUserDto): Promise<User> {
    const response = await api.patch<User>(`/users/${id}`, userData);
    return response.data;
  },

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};
