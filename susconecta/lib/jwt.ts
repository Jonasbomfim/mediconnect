/**
 * Utilitários JWT com verificação de expiração padronizada
 * Clock skew tolerance de 60 segundos para compensar diferenças de tempo
 */

interface JWTPayload {
  exp?: number
  iat?: number
  [key: string]: any
}

const CLOCK_SKEW_SECONDS = 60

/**
 * Parse JWT token payload sem validação de assinatura
 * @param token JWT token
 * @returns Payload decodificado ou null se inválido
 */
export function parseJwt(token: string): JWTPayload | null {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.warn('[JWT] Erro ao fazer parse do token:', error)
    return null
  }
}

/**
 * Verifica se token está expirado com tolerância de clock skew
 * @param token JWT token ou timestamp de expiração em segundos
 * @returns true se expirado
 */
export function isExpired(token: string | number): boolean {
  try {
    let expTimestamp: number
    
    if (typeof token === 'string') {
      const payload = parseJwt(token)
      if (!payload?.exp) {
        console.warn('[JWT] Token sem claim exp, considerando válido')
        return false
      }
      expTimestamp = payload.exp
    } else {
      expTimestamp = token
    }
    
    const nowSeconds = Math.floor(Date.now() / 1000)
    const isExpiredValue = nowSeconds >= (expTimestamp + CLOCK_SKEW_SECONDS)
    
    console.log('[JWT] Verificação de expiração:', {
      nowSeconds,
      expTimestamp,
      clockSkew: CLOCK_SKEW_SECONDS,
      isExpired: isExpiredValue,
      timeUntilExpiry: expTimestamp - nowSeconds
    })
    
    return isExpiredValue
  } catch (error) {
    console.warn('[JWT] Erro na verificação de expiração:', error)
    return true // Assumir expirado em caso de erro
  }
}

/**
 * Verifica se token deve ser renovado (expira em menos de 5 minutos)
 * @param token JWT token ou timestamp de expiração em segundos
 * @returns true se deve renovar
 */
export function shouldRefresh(token: string | number): boolean {
  try {
    let expTimestamp: number
    
    if (typeof token === 'string') {
      const payload = parseJwt(token)
      if (!payload?.exp) return false
      expTimestamp = payload.exp
    } else {
      expTimestamp = token
    }
    
    const nowSeconds = Math.floor(Date.now() / 1000)
    const refreshThreshold = 5 * 60 // 5 minutos
    const shouldRefreshValue = nowSeconds >= (expTimestamp - refreshThreshold)
    
    console.log('[JWT] Verificação de renovação:', {
      nowSeconds,
      expTimestamp,
      refreshThreshold,
      shouldRefresh: shouldRefreshValue,
      timeUntilRefresh: expTimestamp - refreshThreshold - nowSeconds
    })
    
    return shouldRefreshValue
  } catch (error) {
    console.warn('[JWT] Erro na verificação de renovação:', error)
    return false
  }
}

/**
 * Extrai informações úteis do token
 * @param token JWT token
 * @returns Informações do token ou null
 */
export function getTokenInfo(token: string): {
  payload: JWTPayload
  isExpired: boolean
  shouldRefresh: boolean
  expiresAt: Date | null
} | null {
  const payload = parseJwt(token)
  if (!payload) return null
  
  return {
    payload,
    isExpired: isExpired(token),
    shouldRefresh: shouldRefresh(token),
    expiresAt: payload.exp ? new Date(payload.exp * 1000) : null
  }
}