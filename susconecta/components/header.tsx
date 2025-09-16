"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-foreground">
              <span className="text-primary">SUS</span>Conecta
            </span>
          </Link>

          {}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-foreground hover:text-primary transition-colors border-b-2 border-primary pb-1"
            >
              Início
            </Link>
            <Link href="/sobre" className="text-muted-foreground hover:text-primary transition-colors">
              Sobre
            </Link>
          </nav>

          {}
          <div className="hidden md:flex items-center space-x-3">
            <Button
              variant="outline"
              className="text-primary border-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
            >
              Sou Paciente
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/profissional">Sou Profissional de Saúde</Link>
            </Button>
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="text-slate-700 border-slate-600 hover:bg-slate-700 hover:text-white bg-transparent"
              >
                Sou Administrador de uma Clínica
              </Button>
            </Link>
          </div>

          {}
          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/"
                className="text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Início
              </Link>
              <Link
                href="/sobre"
                className="text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Sobre
              </Link>
              <div className="flex flex-col space-y-2 pt-4">
                <Button
                  variant="outline"
                  className="text-primary border-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
                >
                  Sou Paciente
                </Button>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full">
                  Sou Profissional de Saúde
                </Button>
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    className="text-slate-700 border-slate-600 hover:bg-slate-700 hover:text-white bg-transparent w-full"
                  >
                    Sou Administrador de uma Clínica
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
