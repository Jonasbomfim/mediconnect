"use client"

import React, { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null
      if (stored === "dark") return true
      if (stored === "light") return false
      // fallback to system preference
      if (typeof window !== "undefined" && window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
      }
    } catch {
      /* ignore */
    }
    return false
  })

  // aplica a classe 'dark' no root e persiste a escolha
  useEffect(() => {
    if (typeof document === "undefined") return
    if (isDark) {
      document.documentElement.classList.add("dark")
      try { localStorage.setItem("theme", "dark") } catch {}
    } else {
      document.documentElement.classList.remove("dark")
      try { localStorage.setItem("theme", "light") } catch {}
    }
  }, [isDark])

  // mantém sincronização caso o usuário altere preferência do sistema (opcional)
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = (e: MediaQueryListEvent) => {
      // somente altera automático se o usuário não tiver explicitamente salvo tema
      try {
        const stored = localStorage.getItem("theme")
        if (!stored) setIsDark(e.matches)
      } catch {
        /* ignore */
      }
    }
    if (mq.addEventListener) mq.addEventListener("change", handler)
    else mq.addListener(handler)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler)
      else mq.removeListener(handler)
    }
  }, [])

  const toggle = () => setIsDark((v) => !v)

  return (
    <div
      className={cn(
        "flex w-16 h-8 p-1 rounded-full cursor-pointer transition-all duration-300 select-none",
        isDark ? "bg-zinc-950 border border-zinc-800" : "bg-white border border-zinc-200",
        className
      )}
      onClick={toggle}
      role="button"
      tabIndex={0}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
    >
      <div className="flex justify-between items-center w-full">
        <div
          className={cn(
            "flex justify-center items-center w-6 h-6 rounded-full transition-transform duration-300",
            isDark ? "transform translate-x-0 bg-zinc-800" : "transform translate-x-8 bg-gray-200"
          )}
        >
          {isDark ? (
            <Moon className="w-4 h-4 text-white" strokeWidth={1.5} />
          ) : (
            <Sun className="w-4 h-4 text-gray-700" strokeWidth={1.5} />
          )}
        </div>
        <div
          className={cn(
            "flex justify-center items-center w-6 h-6 rounded-full transition-transform duration-300",
            isDark ? "bg-transparent" : "transform -translate-x-8"
          )}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
          ) : (
            <Moon className="w-4 h-4 text-black" strokeWidth={1.5} />
          )}
        </div>
      </div>
    </div>
  )
}
