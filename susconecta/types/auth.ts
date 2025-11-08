/**
 * Tipos estritos para autenticação sem any
 */

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export type UserType = 'profissional' | 'paciente' | 'administrador'

export interface UserData {
  id: string
  email: string
  name: string
  userType: UserType
  profile?: {
    cpf?: string
    crm?: string // Para profissionais
    telefone?: string
    foto_url?: string
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
  user: UserData
}

export interface RefreshTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface AuthError {
  message: string
  code: string
  details?: unknown
}

export interface AuthContextType {
  authStatus: AuthStatus
  user: UserData | null
  token: string | null
  login: (email: string, password: string, userType: UserType) => Promise<boolean>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
}

export interface AuthStorageKeys {
  readonly TOKEN: string
  readonly REFRESH_TOKEN: string
  readonly USER: string
  readonly USER_TYPE: string
}

export type UserTypeRoutes = {
  readonly [K in UserType]: string
}

export type LoginRoutes = {
  readonly [K in UserType]: string
}

// Constantes para localStorage
export const AUTH_STORAGE_KEYS: AuthStorageKeys = {
  TOKEN: 'auth_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER: 'auth_user',
  USER_TYPE: 'auth_user_type',
} as const

// Rotas baseadas no tipo de usuário
export const USER_TYPE_ROUTES: UserTypeRoutes = {
  profissional: '/profissional',
  paciente: '/paciente',
  administrador: '/dashboard',
} as const

export const LOGIN_ROUTES: LoginRoutes = {
  profissional: '/login',
  paciente: '/login',
  administrador: '/login',
} as const