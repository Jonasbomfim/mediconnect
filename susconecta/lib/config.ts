import { ENV_CONFIG } from './env-config';

export const API_CONFIG = {
  BASE_URL: ENV_CONFIG.SUPABASE_URL + "/rest/v1",
  TIMEOUT: 30000,
  VERSION: "v1",
} as const;

export const AUTH_ENDPOINTS = ENV_CONFIG.AUTH_ENDPOINTS;

export const API_KEY = ENV_CONFIG.SUPABASE_ANON_KEY;

export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "Accept": "application/json",
} as const;

export function buildApiUrl(endpoint: string): string {
  const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}