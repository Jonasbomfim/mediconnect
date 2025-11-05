import { Button } from "@/components/ui/button"
import { Shield, Clock, Users } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="py-8 lg:py-12 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="inline-block px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium">
                APROXIMANDO MÉDICOS E PACIENTES
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight text-balance">
                Segurança, <span className="text-primary">Confiabilidade</span> e{" "}
                <span className="text-primary">Rapidez</span>
              </h1>
              <div className="space-y-1 text-base text-muted-foreground">
                <p>Experimente o futuro dos agendamentos.</p>
                <p>Encontre profissionais capacitados e marque já sua consulta.</p>
              </div>
            </div>

            {}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-sm shadow-blue-500/10 border border-blue-200 dark:shadow-none dark:border-transparent"
                asChild
              >
                <Link href="/login-paciente">Portal do Paciente</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-primary border-primary bg-transparent cursor-pointer shadow-sm shadow-blue-500/10 border border-blue-200 hover:bg-blue-50 dark:shadow-none dark:border-primary dark:hover:bg-primary dark:hover:text-primary-foreground"
                asChild
              >
                <Link href="/login">Sou Profissional de Saúde</Link>
              </Button>
            </div>
          </div>

          {}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-accent/20 to-primary/20 p-6">
              <img
                src="/medico-sorridente-de-tiro-medio-vestindo-casaco.jpg"
                alt="Médico profissional sorrindo"
                className="w-full h-auto rounded-lg min-h-80 max-h-[500px] object-cover object-center"
              />
            </div>
          </div>
        </div>

        {}
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Laudos digitais e padronizados</h3>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Notificações automáticas ao paciente</h3>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">LGPD: controle de acesso e consentimento</h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
