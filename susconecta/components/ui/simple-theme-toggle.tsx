"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function SimpleThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={toggleTheme}
      className="hover:bg-primary! hover:text-white! hover:border-primary! cursor-pointer shadow-sm! shadow-black/10! border-2! border-black! dark:shadow-none! dark:border-border! transition-colors"
    >
      <Moon className="h-[1.2rem] w-[1.2rem]" />
      <span className="sr-only">Alternar tema</span>
    </Button>
  )
}