"use client"

import React, { useState } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { Upload, Download } from 'lucide-react'
import { uploadFotoPaciente } from '@/lib/api'

interface UploadAvatarProps {
  userId: string
  currentAvatarUrl?: string
  onAvatarChange?: (newUrl: string) => void
  userName?: string
  className?: string
}

export function UploadAvatar({ userId, currentAvatarUrl, onAvatarChange, userName }: UploadAvatarProps) {
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      setError('')

      console.debug('[UploadAvatar] Iniciando upload:', { 
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        userId
      })

      const result = await uploadFotoPaciente(userId, file)
      
      if (result.foto_url) {
        console.debug('[UploadAvatar] Upload concluído:', result)
        onAvatarChange?.(result.foto_url)
      }
    } catch (err) {
      console.error('[UploadAvatar] Erro no upload:', err)
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload do avatar')
    } finally {
      setIsUploading(false)
      // Limpa o input para permitir selecionar o mesmo arquivo novamente
      event.target.value = ''
    }
  }

  const handleDownload = async () => {
    if (!currentAvatarUrl) return

    try {
      const response = await fetch(currentAvatarUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `avatar-${userId}.${blob.type.split('/')[1] || 'jpg'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError('Erro ao baixar o avatar')
    }
  }

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'U'

  return (
    <div className="w-full flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
      <div className="flex-shrink-0">
        <Avatar className="h-20 w-20 sm:h-20 sm:w-20">
          <AvatarImage src={currentAvatarUrl} alt={userName || 'Avatar'} />
          <AvatarFallback className="text-lg">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1 w-full min-w-0">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('avatar-upload')?.click()}
              disabled={isUploading}
              className="transition duration-200 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-xs sm:text-sm"
            >
              <Upload className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">{isUploading ? 'Enviando...' : 'Upload'}</span>
            </Button>

            {currentAvatarUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="transition duration-200 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-xs sm:text-sm"
              >
                <Download className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Download</span>
              </Button>
            )}
          </div>

          <Input
            id="avatar-upload"
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUpload}
            disabled={isUploading}
          />

          <p className="text-xs text-muted-foreground leading-snug">
            Formatos: JPG, PNG, WebP (máx. 2MB)
          </p>
          
          {error && (
            <p className="text-xs text-destructive">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}