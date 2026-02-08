// `erasableSyntaxOnly` disallows enums because they emit runtime JS.
// Use a const object + derived union type instead (fully erasable).
export const UserRole = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string | null;
  address?: string | null;
  gender?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  phone?: string | null;
  address?: string | null;
  gender?: string | null;
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  phone?: string | null;
  address?: string | null;
  gender?: string | null;
}
