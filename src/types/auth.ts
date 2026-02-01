/**
 * Tipos para el sistema de autenticación de DRK Launcher
 */

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  skinUrl?: string; // URL de la skin personalizada
  capeUrl?: string; // URL de la capa personalizada
  tokenSesion?: string; // Token de sesión actual
  createdAt: Date;
  lastLogin?: Date;
}

export interface Session {
  accessToken: string;
  clientToken: string;
  userId: string;
  username: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface Profile {
  id: string;
  userId: string;
  name: string;
  skinUrl?: string;
  capeUrl?: string;
  createdAt: Date;
}

export interface Skin {
  id: string;
  userId: string;
  name: string;
  url: string;
  uploadedAt: Date;
}

export interface Cape {
  id: string;
  userId: string;
  name: string;
  url: string;
  uploadedAt: Date;
}

// Tipos para las rutas de autenticación Yggdrasil

export interface AuthenticateRequest {
  agent?: {
    name: string;
    version: number;
  };
  username: string;
  password: string;
  clientToken?: string;
  requestUser?: boolean;
}

export interface AuthenticateResponse {
  accessToken: string;
  clientToken: string;
  selectedProfile: {
    id: string;
    name: string;
  };
  availableProfiles: Array<{
    id: string;
    name: string;
  }>;
  user?: {
    id: string;
    username: string;
    properties: Array<any>;
  };
}

export interface RefreshRequest {
  accessToken: string;
  clientToken: string;
  selectedProfile?: {
    id: string;
    name: string;
  };
  requestUser?: boolean;
}

export interface RefreshResponse {
  accessToken: string;
  clientToken: string;
  selectedProfile: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    username: string;
    properties: Array<any>;
  };
}

export interface ValidateRequest {
  accessToken: string;
  clientToken?: string;
}

export interface ErrorResponse {
  error: string;
  errorMessage: string;
}