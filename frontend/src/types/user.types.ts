/**
 * user.types.ts
 * TypeScript interfaces for User and Role API data.
 */

export interface Role {
  _id: string;
  nom: string;
  description?: string;
  permissions: string[];
}

export interface User {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  role: Role | string;
  departement?: string;
  isActive: boolean;
  dernier_login?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  permissions?: string[];
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterResponse {
  message: string;
  user: User;
}
