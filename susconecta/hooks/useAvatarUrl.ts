import { useState, useEffect } from 'react'
import { getAvatarPublicUrl } from '@/lib/api'

/**
 * Hook que gerencia a URL do avatar de um usuário
 * Recupera automaticamente a URL baseada no userId
 * Tenta múltiplas extensões (jpg, png, webp) até encontrar o arquivo
 * @param userId - ID do usuário (string ou number)
 * @returns { avatarUrl: string | null, isLoading: boolean }
 */
export function useAvatarUrl(userId: string | number | null | undefined) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!userId) {
      console.debug('[useAvatarUrl] userId é vazio, limpando avatar')
      setAvatarUrl(null)
      return
    }

    setIsLoading(true)

    const extensions = ['jpg', 'png', 'webp']
    let foundUrl: string | null = null
    let testedExtensions = 0

    const tryNextExtension = () => {
      const ext = extensions[testedExtensions]
      if (!ext) {
        // Nenhuma extensão funcionou
        console.warn('[useAvatarUrl] Nenhuma extensão de avatar encontrada para userId:', userId)
        setAvatarUrl(null)
        setIsLoading(false)
        return
      }

      try {
        const url = getAvatarPublicUrl(userId, ext)
        console.debug('[useAvatarUrl] Testando extensão:', { userId, ext, url })

        // Valida se a imagem existe fazendo um HEAD request
        fetch(url, { method: 'HEAD', mode: 'cors' })
          .then((response) => {
            console.debug('[useAvatarUrl] HEAD response:', {
              userId,
              ext,
              status: response.status,
              statusText: response.statusText,
              contentType: response.headers.get('content-type'),
              contentLength: response.headers.get('content-length'),
              ok: response.ok,
            })

            if (response.ok) {
              console.log('[useAvatarUrl] Avatar encontrado:', url)
              foundUrl = url
              setAvatarUrl(url)
              setIsLoading(false)
            } else {
              // Tenta próxima extensão
              testedExtensions++
              tryNextExtension()
            }
          })
          .catch((error) => {
            console.debug('[useAvatarUrl] Erro no HEAD request para ext', ext, ':', error.message)

            // Tenta GET como fallback se HEAD falhar (pode ser CORS issue)
            fetch(url)
              .then((response) => {
                console.debug('[useAvatarUrl] GET fallback response para', ext, ':', {
                  status: response.status,
                  statusText: response.statusText,
                  contentType: response.headers.get('content-type'),
                })
                if (response.ok) {
                  console.log('[useAvatarUrl] Avatar encontrado via GET fallback:', ext)
                  foundUrl = url
                  setAvatarUrl(url)
                  setIsLoading(false)
                } else {
                  // Tenta próxima extensão
                  testedExtensions++
                  tryNextExtension()
                }
              })
              .catch((err) => {
                console.debug('[useAvatarUrl] Erro no GET fallback para ext', ext, ':', err.message)
                // Tenta próxima extensão
                testedExtensions++
                tryNextExtension()
              })
          })
      } catch (error) {
        console.error('[useAvatarUrl] Erro ao construir URL para ext', ext, ':', error)
        testedExtensions++
        tryNextExtension()
      }
    }

    tryNextExtension()
  }, [userId])

  return { avatarUrl, isLoading }
}
