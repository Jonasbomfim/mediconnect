'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginProfissionalRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecionando para a página de login...</p>
    </div>
  )
}
