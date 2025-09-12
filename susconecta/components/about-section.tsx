import { Card } from "@/components/ui/card"
import { Lightbulb, CheckCircle } from "lucide-react"

export function AboutSection() {
  const values = ["Inovação", "Segurança", "Discrição", "Transparência", "Agilidade"]

  return (
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {}
          <div className="space-y-8">
            {}
            <div className="relative">
              <img
                src="/Screenshot 2025-09-11 121911.png"
                alt="Profissional trabalhando em laptop"
                className="w-full h-auto rounded-2xl"
              />
            </div>

            {}
            <Card className="bg-primary text-primary-foreground p-8 rounded-2xl">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90">NOSSO OBJETIVO</h3>
                  <p className="text-lg leading-relaxed">
                    Nosso compromisso é garantir qualidade, segurança e sigilo em cada atendimento, unindo tecnologia à
                    responsabilidade médica.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium uppercase tracking-wide">
                SOBRE NÓS
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight text-balance">
                Experimente o futuro do gerenciamento dos seus atendimentos médicos
              </h2>
            </div>

            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                Somos uma plataforma inovadora que conecta pacientes e médicos de forma prática, segura e humanizada.
                Nosso objetivo é simplificar o processo de emissão e acompanhamento de laudos médicos, oferecendo um
                ambiente online confiável e acessível.
              </p>
              <p>
                Aqui, os pacientes podem registrar suas informações de saúde e solicitar laudos de forma rápida,
                enquanto os médicos têm acesso a ferramentas que facilitam a análise, validação e emissão dos
                documentos.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Nossos valores</h3>
              <div className="grid grid-cols-2 gap-3">
                {values.map((value, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
