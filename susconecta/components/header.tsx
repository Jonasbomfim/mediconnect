"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-foreground">
              <span className="text-primary">MEDI</span>Connect
            </span>
          </Link>

          {}
          <nav className="hidden md:flex items-center gap-10">
            <Link
              href="/"
              className={`text-foreground hover:text-primary transition-colors border-b-2 border-b-[transparent] ${
                pathname === "/" ? "border-b-blue-500" : ""
              }`}
            >
              Início
            </Link>
            <Link
              href="/sobre"
              className={`text-foreground hover:text-primary transition-colors border-b-2 border-b-[transparent] ${
                pathname === "/sobre" ? "border-b-blue-500" : ""
              }`}
            >
              Sobre
            </Link>
          </nav>

          {}
          <div className="hidden md:flex items-center space-x-3">
            <ThemeToggle />
            <Button
              variant="outline"
              className="text-primary border-primary bg-transparent shadow-sm shadow-blue-500/10 border border-blue-200 hover:bg-blue-50 dark:shadow-none dark:border-primary dark:hover:bg-primary dark:hover:text-primary-foreground"
              asChild
            >
              <Link href="/login-paciente">Sou Paciente</Link>
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-blue-500/10 border border-blue-200 dark:shadow-none dark:border-transparent">
              <Link href="/login">Sou Profissional de Saúde</Link>
            </Button>
            <Link href="/login-admin">
             <Button
                variant="outline"
                className="text-primary border-primary bg-transparent shadow-sm shadow-blue-500/10 border border-blue-200 hover:bg-blue-50 dark:shadow-none dark:border-primary dark:hover:bg-primary dark:hover:text-primary-foreground cursor-pointer"
              >
                Sou Administrador de uma Clínica
              </Button>
            </Link>
          </div>

          {}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
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
                <ThemeToggle />
                <Button
                  variant="outline"
                  className="text-primary border-primary bg-transparent shadow-sm shadow-blue-500/10 border border-blue-200 hover:bg-blue-50 dark:shadow-none dark:border-primary dark:hover:bg-primary dark:hover:text-primary-foreground"
                  asChild
                >
                  <Link href="/login-paciente">Sou Paciente</Link>
                </Button>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full shadow-sm shadow-blue-500/10 border border-blue-200 dark:shadow-none dark:border-transparent">
                  <Link href="/login">Sou Profissional de Saúde</Link>
                </Button>
                <Link href="/login-admin">
                  <Button
                    variant="outline"
                    className="text-primary border-primary bg-transparent w-full shadow-sm shadow-blue-500/10 border border-blue-200 hover:bg-blue-50 dark:shadow-none dark:border-primary dark:hover:bg-primary dark:hover:text-primary-foreground cursor-pointer"
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
  );
}
