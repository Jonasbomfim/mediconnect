

"use client"

import { ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {}
          <div className="text-muted-foreground text-sm">© 2025 MEDI Connect</div>

          {}
          <nav className="flex items-center space-x-8">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              Termos
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              Privacidade (LGPD)
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              Ajuda
            </a>
          </nav>

          {}
          <Button
            variant="outline"
            size="sm"
            onClick={scrollToTop}
            className="rounded-full w-10 h-10 p-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
            aria-label="Voltar ao topo"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </footer>
  )
}
