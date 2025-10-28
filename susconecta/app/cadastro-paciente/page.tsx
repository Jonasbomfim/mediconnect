'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { registerPatientPublic } from '@/lib/auth'

export default function CadastroPacientePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    email: '',
    full_name: '',
    phone_mobile: '',
    cpf: '',
    birth_date: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ message: string } | null>(null)

  const onChange = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const validate = () => {
    const emailOk = /^\S+@\S+\.\S+$/.test(form.email)
    if (!emailOk) return 'Email inválido.'
    if (!form.full_name || form.full_name.trim().length < 3) return 'Nome completo deve ter ao menos 3 caracteres.'
    const phone = (form.phone_mobile || '').replace(/\D/g, '')
    if (!(phone.length === 10 || phone.length === 11)) return 'Telefone celular deve ter 10 ou 11 dígitos.'
    const cpf = (form.cpf || '').replace(/\D/g, '')
    if (cpf.length !== 11) return 'CPF deve ter 11 dígitos.'
    if (form.birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(form.birth_date)) return 'Data de nascimento deve estar no formato YYYY-MM-DD.'
    return null
  }

  // Formatar CPF como 000.000.000-00 enquanto digita, limitando a 11 dígitos
  const formatCpf = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 11)
    const p1 = digits.slice(0, 3)
    const p2 = digits.slice(3, 6)
    const p3 = digits.slice(6, 9)
    const p4 = digits.slice(9, 11)
    let out = p1
    if (p2) out += (out ? '.' : '') + p2
    if (p3) out += '.' + p3
    if (p4) out += '-' + p4
    return out
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true)
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const redirect_url = origin ? `${origin}/paciente` : undefined

      await registerPatientPublic({
        email: form.email,
        full_name: form.full_name,
        phone_mobile: form.phone_mobile,
        // enviar apenas dígitos do CPF
        cpf: form.cpf.replace(/\D/g, ''),
        ...(form.birth_date ? { birth_date: form.birth_date } : {}),
        ...(redirect_url ? { redirect_url } : {}),
      })

      setSuccess({ message: 'Cadastro realizado! Verifique seu email para acessar a plataforma.' })
      setTimeout(() => router.push('/login-paciente'), 2500)
    } catch (e: any) {
      setError(e?.message || 'Falha ao criar cadastro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-foreground">Criar cadastro de Paciente</h2>
          <p className="mt-2 text-sm text-muted-foreground">Preencha seus dados para acessar o portal do paciente</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Dados do Paciente</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email (obrigatório) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground">Email</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={form.email}
                  onChange={(e) => onChange('email', e.target.value)}
                  required
                />
              </div>

              {/* Nome completo (obrigatório) */}
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-foreground">Nome completo</label>
                <Input
                  id="full_name"
                  placeholder="Seu nome completo"
                  value={form.full_name}
                  onChange={(e) => onChange('full_name', e.target.value)}
                  required
                />
              </div>

              {/* Telefone celular (obrigatório) */}
              <div>
                <label htmlFor="phone_mobile" className="block text-sm font-medium text-foreground">Telefone celular</label>
                <Input
                  id="phone_mobile"
                  inputMode="numeric"
                  placeholder="(11) 99999-9999"
                  value={form.phone_mobile}
                  onChange={(e) => onChange('phone_mobile', e.target.value)}
                  required
                />
              </div>

              {/* CPF (obrigatório) */}
        <div>
          <label htmlFor="cpf" className="block text-sm font-medium text-foreground">
            CPF
          </label>
          <Input
            id="cpf"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={form.cpf}
            maxLength={14}
            // Aceita CPF com ou sem pontuação
            pattern="^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$"
            title="Informe 11 dígitos (com ou sem formatação, ex: 00000000000 ou 000.000.000-00)"
            onChange={(e) => onChange('cpf', formatCpf(e.target.value))}
            required
          />
        </div>


              {/* Data de nascimento (opcional) */}
              <div>
                <label htmlFor="birth_date" className="block text-sm font-medium text-foreground">Data de nascimento (opcional)</label>
                <Input
                  id="birth_date"
                  type="date"
                  placeholder="YYYY-MM-DD"
                  value={form.birth_date}
                  onChange={(e) => onChange('birth_date', e.target.value)}
                />
              </div>

              {/* Mensagens */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert>
                  <AlertDescription>{success.message}</AlertDescription>
                </Alert>
              )}

              {/* Ações */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Criando cadastro...' : 'Criar cadastro'}
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login-paciente">Já tenho conta</Link>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
