'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'

export function useForceDefaultTheme() {
  const { setTheme } = useTheme()

  useEffect(() => {
    // Força tema claro sempre que o componente montar
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
    setTheme('light')
  }, [setTheme])
}