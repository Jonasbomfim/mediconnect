import { Header } from "@/components/layout/header"
import { AboutSection } from "@/components/features/general/about-section"
import { Footer } from "@/components/layout/footer"

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <AboutSection />
      </main>
      <Footer />
    </div>
  )
}
