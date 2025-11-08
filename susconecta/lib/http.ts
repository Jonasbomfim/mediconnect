/**
 * Cliente HTTP com refresh automático de token e fila de requisições
 * Implementa lock para evitar múltiplas chamadas de refresh simultaneamente
 */

import { AUTH_STORAGE_KEYS } from '@/types/auth'
import { isExpired } from '@/lib/jwt'
import { ENV_CONFIG } from '@/lib/env-config'

interface QueuedRequest {
  resolve: (value: any) => void
  reject: (error: any) => void
  config: RequestInit & { url: string }
}

class HttpClient {
  private isRefreshing = false
  private requestQueue: QueuedRequest[] = []
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  /**
   * Processa fila de requisições após refresh bem-sucedido
   */
  private processQueue(error: Error | null, token: string | null = null) {
    console.log(`[HTTP] Processando fila de ${this.requestQueue.length} requisições`)
    
    this.requestQueue.forEach(({ resolve, reject, config }) => {
      if (error) {
        reject(error)
      } else {
        // Reexecutar requisição com novo token
        const headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`
        }
        resolve(this.executeRequest({ ...config, headers }))
      }
    })
    
    this.requestQueue = []
    console.log('[HTTP] Fila de requisições processada')
  }

  /**
   * Executa refresh de token uma única vez usando lock
   */
  private async refreshToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN)
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    console.log('[HTTP] Iniciando refresh de token...', {
      timestamp: new Date().toLocaleTimeString()
    })
    
    const response = await fetch(ENV_CONFIG.AUTH_ENDPOINTS.REFRESH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ENV_CONFIG.SUPABASE_ANON_KEY // API Key sempre necessária
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    })

    if (!response.ok) {
      console.log('[HTTP] Refresh falhou:', response.status)
      throw new Error(`Refresh failed: ${response.status}`)
    }

    const data = await response.json()

    // Data pode ser um LoginResponse completo ou apenas { access_token }
    const newAccessToken = data.access_token || data.token || null
    const newRefreshToken = data.refresh_token || null

    if (!newAccessToken) {
      console.error('[HTTP] Refresh não retornou access_token', data)
      throw new Error('Refresh did not return access_token')
    }

    // Atualizar tokens de forma atômica
    localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, newAccessToken)
    if (newRefreshToken) {
      localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken)
    }

    console.log('[HTTP] Token renovado com sucesso!', {
      timestamp: new Date().toLocaleTimeString()
    })
    return newAccessToken
  }

  /**
   * Executa requisição HTTP com tratamento de erros
   */
  private async executeRequest(config: RequestInit & { url: string }): Promise<Response> {
    try {
      console.log(`[HTTP] Fazendo requisição: ${config.method || 'GET'} ${config.url}`)
      
      // Delay para visualizar na aba Network
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const response = await fetch(config.url, config)
      
      console.log(`[HTTP] Resposta recebida: ${response.status} ${response.statusText}`, {
        url: config.url,
        status: response.status,
        timestamp: new Date().toLocaleTimeString()
      })
      
      // Se for 401 e não for uma tentativa de refresh, tentar renovar token
      if (response.status === 401 && !config.url.includes('/refresh')) {
        console.log('[HTTP] Status 401 - Verificando possibilidade de refresh token...')
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const token = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN)
        if (token && !isExpired(token)) {
          // Token ainda é válido, erro pode ser temporário
          console.log('[HTTP] Token ainda válido - erro pode ser temporário')
          await new Promise(resolve => setTimeout(resolve, 600))
          return response
        }
        
        // Token expirado, tentar refresh
        if (this.isRefreshing) {
          // Adicionar à fila se já está fazendo refresh
          return new Promise((resolve, reject) => {
            this.requestQueue.push({
              resolve,
              reject,
              config
            })
          })
        }
        
        this.isRefreshing = true
        
        try {
          const newToken = await this.refreshToken()
          this.isRefreshing = false
          
          // Processar fila com sucesso
          this.processQueue(null, newToken)
          
          // Reexecutar requisição original
          const newHeaders = {
            ...config.headers,
            'apikey': ENV_CONFIG.SUPABASE_ANON_KEY, // Garantir API Key
            Authorization: `Bearer ${newToken}`
          }
          
          console.log('[HTTP] Reexecutando requisição com novo token...')
          await new Promise(resolve => setTimeout(resolve, 800))
          
          return await fetch(config.url, { ...config, headers: newHeaders })
        } catch (refreshError) {
          this.isRefreshing = false
          this.processQueue(refreshError as Error)
          
          // Logout único em caso de falha no refresh
          console.error('[HTTP] Refresh FALHOU - fazendo logout automático:', refreshError)
          await new Promise(resolve => setTimeout(resolve, 1000))
          this.performLogout()
          
          throw refreshError
        }
      }
      
      return response
    } catch (error) {
      console.error('[HTTP] Erro na requisição:', error)
      throw error
    }
  }

  /**
   * Logout único com limpeza de estado
   */
  private performLogout() {
    // Limpar dados de autenticação
    localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN)
    localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(AUTH_STORAGE_KEYS.USER)
    
    // Redirecionar para login
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  /**
   * Método público para fazer requisições autenticadas
   */
  async request(url: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN)
    
    console.log(`[HTTP] Preparando requisição: ${options.method || 'GET'} ${url}`, {
      hasToken: !!token,
      timestamp: new Date().toLocaleTimeString()
    })
    
      const config: RequestInit & { url: string } = {
      url: url.startsWith('http') ? url : `${this.baseURL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        'apikey': ENV_CONFIG.SUPABASE_ANON_KEY, // API Key da Supabase sempre presente
        ...(token && { Authorization: `Bearer ${token}` }), // Bearer Token quando usuário logado
        ...options.headers
      },
      ...options
    }

    const response = await this.executeRequest(config)
    
    console.log(`[HTTP] Requisição finalizada: ${response.status}`, {
      url: config.url,
      status: response.status,
      statusText: response.statusText
    })
    
    return response
  }

  /**
   * Métodos de conveniência
   */
  async get(url: string, options?: RequestInit): Promise<Response> {
    return this.request(url, { ...options, method: 'GET' })
  }

  async post(url: string, data?: any, options?: RequestInit): Promise<Response> {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async put(url: string, data?: any, options?: RequestInit): Promise<Response> {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async delete(url: string, options?: RequestInit): Promise<Response> {
    return this.request(url, { ...options, method: 'DELETE' })
  }
}

// Instância única do cliente HTTP
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://yuanqog.com/m1/1053378-0-default'
export const httpClient = new HttpClient(API_BASE_URL)

export default httpClient