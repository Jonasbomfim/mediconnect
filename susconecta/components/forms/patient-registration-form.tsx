"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Upload,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  User,
  Phone,
  MapPin,
  FileImage,
  Save,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react"

interface PatientFormData {
  // Dados pessoais
  photo: File | null
  nome: string
  nomeSocial: string
  cpf: string
  rg: string
  outroDocumento: string
  numeroDocumento: string
  sexo: string
  dataNascimento: string
  etnia: string
  raca: string
  naturalidade: string
  nacionalidade: string
  profissao: string
  estadoCivil: string
  nomeMae: string
  profissaoMae: string
  nomePai: string
  profissaoPai: string
  nomeResponsavel: string
  cpfResponsavel: string
  nomeEsposo: string
  rnGuiaConvenio: boolean
  codigoLegado: string

  // Observações e anexos
  observacoes: string
  anexos: File[]

  // Contato
  email: string
  celular: string
  telefone1: string
  telefone2: string

  // Endereço
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  referencia: string
}

interface PatientRegistrationFormProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  patientData?: PatientFormData | null
  patientId?: number | null
  mode?: "create" | "edit"
  onClose?: () => void
  inline?: boolean
}

export function PatientRegistrationForm({
  open = true,
  onOpenChange,
  patientData = null,
  patientId = null,
  mode = "create",
  onClose,
  inline = false,
}: PatientRegistrationFormProps) {
  const initialFormData: PatientFormData = {
    photo: null,
    nome: "",
    nomeSocial: "",
    cpf: "",
    rg: "",
    outroDocumento: "",
    numeroDocumento: "",
    sexo: "",
    dataNascimento: "",
    etnia: "",
    raca: "",
    naturalidade: "",
    nacionalidade: "Brasileira",
    profissao: "",
    estadoCivil: "",
    nomeMae: "",
    profissaoMae: "",
    nomePai: "",
    profissaoPai: "",
    nomeResponsavel: "",
    cpfResponsavel: "",
    nomeEsposo: "",
    rnGuiaConvenio: false,
    codigoLegado: "",
    observacoes: "",
    anexos: [],
    email: "",
    celular: "",
    telefone1: "",
    telefone2: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    referencia: "",
  }

  const [formData, setFormData] = useState<PatientFormData>(patientData || initialFormData)
  const [expandedSections, setExpandedSections] = useState({
    dadosPessoais: true,
    observacoes: false,
    contato: false,
    endereco: false,
  })

  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (patientId && mode === "edit") {
      // TODO: Fetch patient data by ID
      console.log("[v0] Loading patient data for ID:", patientId)
      // For now, use mock data or existing patientData
      if (patientData) {
        setFormData(patientData)
        if (patientData.photo) {
          const reader = new FileReader()
          reader.onload = (e) => setPhotoPreview(e.target?.result as string)
          reader.readAsDataURL(patientData.photo)
        }
      }
    } else if (mode === "create") {
      setFormData(initialFormData)
      setPhotoPreview(null)
    }
  }, [patientId, patientData, mode])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleInputChange = (field: keyof PatientFormData, value: string | boolean | File | File[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value)
    handleInputChange("cpf", formatted)
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  }

  const formatCellPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "+55 ($1) $2-$3")
  }

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    return numbers.replace(/(\d{5})(\d{3})/, "$1-$2")
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setErrors((prev) => ({ ...prev, photo: "Arquivo muito grande. Máximo 5MB." }))
        return
      }

      handleInputChange("photo", file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAnexoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])

    const validFiles = files.filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit per file
        setErrors((prev) => ({ ...prev, anexos: `Arquivo ${file.name} muito grande. Máximo 10MB por arquivo.` }))
        return false
      }
      return true
    })

    handleInputChange("anexos", [...formData.anexos, ...validFiles])
  }

  const removeAnexo = (index: number) => {
    const newAnexos = formData.anexos.filter((_, i) => i !== index)
    handleInputChange("anexos", newAnexos)
  }

  const validateCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, "")
    if (cleanCPF.length !== 11) return false

    // Check for known invalid CPFs
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false

    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += Number.parseInt(cleanCPF.charAt(i)) * (10 - i)
    }
    let remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== Number.parseInt(cleanCPF.charAt(9))) return false

    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += Number.parseInt(cleanCPF.charAt(i)) * (11 - i)
    }
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    return remainder === Number.parseInt(cleanCPF.charAt(10))
  }

  const searchCEP = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, "")
    if (cleanCEP.length !== 8) return

    setIsLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`)
      const data = await response.json()

      if (data.erro) {
        setErrors((prev) => ({ ...prev, cep: "CEP não encontrado" }))
      } else {
        handleInputChange("logradouro", data.logradouro || "")
        handleInputChange("bairro", data.bairro || "")
        handleInputChange("cidade", data.localidade || "")
        handleInputChange("estado", data.uf || "")

        // Clear CEP error if successful
        if (errors.cep) {
          setErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors.cep
            return newErrors
          })
        }
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
      setErrors((prev) => ({ ...prev, cep: "Erro ao buscar CEP. Tente novamente." }))
    } finally {
      setIsLoadingCep(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório"
    }

    // CPF validation
    if (formData.cpf && !validateCPF(formData.cpf)) {
      newErrors.cpf = "CPF inválido"
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "E-mail inválido"
    }

    // Responsible CPF validation
    if (formData.cpfResponsavel && !validateCPF(formData.cpfResponsavel)) {
      newErrors.cpfResponsavel = "CPF do responsável inválido"
    }

    // Date validation
    if (formData.dataNascimento) {
      const birthDate = new Date(formData.dataNascimento)
      const today = new Date()
      if (birthDate > today) {
        newErrors.dataNascimento = "Data de nascimento não pode ser futura"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!validateForm()) {
      // Expand sections with errors
      const errorFields = Object.keys(errors)
      if (errorFields.some((field) => ["nome", "cpf", "rg", "sexo", "dataNascimento"].includes(field))) {
        setExpandedSections((prev) => ({ ...prev, dadosPessoais: true }))
      }
      if (errorFields.some((field) => ["email", "celular"].includes(field))) {
        setExpandedSections((prev) => ({ ...prev, contato: true }))
      }
      if (errorFields.some((field) => ["cep", "logradouro"].includes(field))) {
        setExpandedSections((prev) => ({ ...prev, endereco: true }))
      }
      return
    }

    setIsSubmitting(true)

    try {
      console.log("[v0] Saving patient data:", formData)
      console.log("[v0] Mode:", mode)
      console.log("[v0] Patient ID:", patientId)

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // TODO: Implement actual API call
      // const response = await fetch('/api/patients', {
      //   method: mode === 'create' ? 'POST' : 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // })

      // Reset form if creating new patient
      if (mode === "create") {
        setFormData(initialFormData)
        setPhotoPreview(null)
      }

      if (inline && onClose) {
        onClose()
      } else {
        onOpenChange?.(false)
      }

      // Show success message (you might want to use a toast notification)
      alert(mode === "create" ? "Paciente cadastrado com sucesso!" : "Paciente atualizado com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar paciente:", error)
      setErrors({ submit: "Erro ao salvar paciente. Tente novamente." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (inline && onClose) {
      onClose()
    } else {
      onOpenChange?.(false)
    }
  }

  if (inline) {
    return (
      <div className="space-y-6">
        {errors.submit && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.submit}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <Collapsible open={expandedSections.dadosPessoais} onOpenChange={() => toggleSection("dadosPessoais")}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Dados Pessoais
                    </span>
                    {expandedSections.dadosPessoais ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {/* Foto */}
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 border-2 border-dashed border-muted-foreground rounded-lg flex items-center justify-center overflow-hidden">
                      {photoPreview ? (
                        <img
                          src={photoPreview || "/placeholder.svg"}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileImage className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="photo" className="cursor-pointer">
                        <Button type="button" variant="outline" asChild>
                          <label htmlFor="photo" className="cursor-pointer">
                            <Upload className="mr-2 h-4 w-4" />
                            Carregar Foto
                          </label>
                        </Button>
                      </Label>
                      <Input id="photo" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                      {errors.photo && <p className="text-sm text-destructive">{errors.photo}</p>}
                      <p className="text-xs text-muted-foreground">Máximo 5MB</p>
                    </div>
                  </div>

                  {/* Nome e Nome Social */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => handleInputChange("nome", e.target.value)}
                        className={errors.nome ? "border-destructive" : ""}
                      />
                      {errors.nome && <p className="text-sm text-destructive">{errors.nome}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nomeSocial">Nome Social</Label>
                      <Input
                        id="nomeSocial"
                        value={formData.nomeSocial}
                        onChange={(e) => handleInputChange("nomeSocial", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* CPF e RG */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        value={formData.cpf}
                        onChange={(e) => handleCPFChange(e.target.value)}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        className={errors.cpf ? "border-destructive" : ""}
                      />
                      {errors.cpf && <p className="text-sm text-destructive">{errors.cpf}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rg">RG</Label>
                      <Input id="rg" value={formData.rg} onChange={(e) => handleInputChange("rg", e.target.value)} />
                    </div>
                  </div>

                  {/* Outros Documentos */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="outroDocumento">Outros Documentos</Label>
                      <Select
                        value={formData.outroDocumento}
                        onValueChange={(value) => handleInputChange("outroDocumento", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cnh">CNH</SelectItem>
                          <SelectItem value="passaporte">Passaporte</SelectItem>
                          <SelectItem value="certidao-nascimento">Certidão de Nascimento</SelectItem>
                          <SelectItem value="certidao-casamento">Certidão de Casamento</SelectItem>
                          <SelectItem value="titulo-eleitor">Título de Eleitor</SelectItem>
                          <SelectItem value="carteira-trabalho">Carteira de Trabalho</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numeroDocumento">Número do Documento</Label>
                      <Input
                        id="numeroDocumento"
                        value={formData.numeroDocumento}
                        onChange={(e) => handleInputChange("numeroDocumento", e.target.value)}
                        disabled={!formData.outroDocumento}
                      />
                    </div>
                  </div>

                  {/* Sexo e Data de Nascimento */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Sexo</Label>
                      <RadioGroup value={formData.sexo} onValueChange={(value) => handleInputChange("sexo", value)}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="masculino" id="masculino" />
                          <Label htmlFor="masculino">Masculino</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="feminino" id="feminino" />
                          <Label htmlFor="feminino">Feminino</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="outro" id="outro" />
                          <Label htmlFor="outro">Outro</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                      <Input
                        id="dataNascimento"
                        type="date"
                        value={formData.dataNascimento}
                        onChange={(e) => handleInputChange("dataNascimento", e.target.value)}
                        className={errors.dataNascimento ? "border-destructive" : ""}
                      />
                      {errors.dataNascimento && <p className="text-sm text-destructive">{errors.dataNascimento}</p>}
                    </div>
                  </div>

                  {/* Etnia e Raça */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="etnia">Etnia (IBGE)</Label>
                      <Select value={formData.etnia} onValueChange={(value) => handleInputChange("etnia", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a etnia" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="branca">Branca</SelectItem>
                          <SelectItem value="preta">Preta</SelectItem>
                          <SelectItem value="parda">Parda</SelectItem>
                          <SelectItem value="amarela">Amarela</SelectItem>
                          <SelectItem value="indigena">Indígena</SelectItem>
                          <SelectItem value="nao-declarado">Não Declarado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="raca">Raça</Label>
                      <Input
                        id="raca"
                        value={formData.raca}
                        onChange={(e) => handleInputChange("raca", e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>

                  {/* Naturalidade e Nacionalidade */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="naturalidade">Naturalidade</Label>
                      <Input
                        id="naturalidade"
                        value={formData.naturalidade}
                        onChange={(e) => handleInputChange("naturalidade", e.target.value)}
                        placeholder="Cidade de nascimento"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nacionalidade">Nacionalidade</Label>
                      <Input
                        id="nacionalidade"
                        value={formData.nacionalidade}
                        onChange={(e) => handleInputChange("nacionalidade", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Profissão e Estado Civil */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="profissao">Profissão</Label>
                      <Input
                        id="profissao"
                        value={formData.profissao}
                        onChange={(e) => handleInputChange("profissao", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estadoCivil">Estado Civil</Label>
                      <Select
                        value={formData.estadoCivil}
                        onValueChange={(value) => handleInputChange("estadoCivil", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o estado civil" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                          <SelectItem value="casado">Casado(a)</SelectItem>
                          <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                          <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                          <SelectItem value="uniao-estavel">União Estável</SelectItem>
                          <SelectItem value="separado">Separado(a)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Dados dos Pais */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nomeMae">Nome da Mãe</Label>
                      <Input
                        id="nomeMae"
                        value={formData.nomeMae}
                        onChange={(e) => handleInputChange("nomeMae", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profissaoMae">Profissão da Mãe</Label>
                      <Input
                        id="profissaoMae"
                        value={formData.profissaoMae}
                        onChange={(e) => handleInputChange("profissaoMae", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nomePai">Nome do Pai</Label>
                      <Input
                        id="nomePai"
                        value={formData.nomePai}
                        onChange={(e) => handleInputChange("nomePai", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profissaoPai">Profissão do Pai</Label>
                      <Input
                        id="profissaoPai"
                        value={formData.profissaoPai}
                        onChange={(e) => handleInputChange("profissaoPai", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Responsável */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nomeResponsavel">Nome do Responsável</Label>
                      <Input
                        id="nomeResponsavel"
                        value={formData.nomeResponsavel}
                        onChange={(e) => handleInputChange("nomeResponsavel", e.target.value)}
                        placeholder="Para menores ou dependentes"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpfResponsavel">CPF do Responsável</Label>
                      <Input
                        id="cpfResponsavel"
                        value={formData.cpfResponsavel}
                        onChange={(e) => handleCPFChange(e.target.value)}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        className={errors.cpfResponsavel ? "border-destructive" : ""}
                      />
                      {errors.cpfResponsavel && <p className="text-sm text-destructive">{errors.cpfResponsavel}</p>}
                    </div>
                  </div>

                  {/* Esposo e Configurações */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nomeEsposo">Nome do Esposo(a)</Label>
                      <Input
                        id="nomeEsposo"
                        value={formData.nomeEsposo}
                        onChange={(e) => handleInputChange("nomeEsposo", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="codigoLegado">Código Legado</Label>
                      <Input
                        id="codigoLegado"
                        value={formData.codigoLegado}
                        onChange={(e) => handleInputChange("codigoLegado", e.target.value)}
                        placeholder="ID de outro sistema"
                      />
                    </div>
                  </div>

                  {/* RN na Guia do Convênio */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rnGuiaConvenio"
                      checked={formData.rnGuiaConvenio}
                      onCheckedChange={(checked) => handleInputChange("rnGuiaConvenio", checked as boolean)}
                    />
                    <Label htmlFor="rnGuiaConvenio">RN na Guia do Convênio</Label>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Observações e Anexos */}
          <Collapsible open={expandedSections.observacoes} onOpenChange={() => toggleSection("observacoes")}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Observações e Anexos
                    </span>
                    {expandedSections.observacoes ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => handleInputChange("observacoes", e.target.value)}
                      placeholder="Alergias, restrições, notas relevantes..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Anexos do Paciente</Label>
                    <div className="border-2 border-dashed border-muted-foreground rounded-lg p-4">
                      <Label htmlFor="anexos" className="cursor-pointer">
                        <div className="text-center">
                          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Clique para adicionar documentos (cartão de convênio, exames, etc.)
                          </p>
                        </div>
                      </Label>
                      <Input id="anexos" type="file" multiple className="hidden" onChange={handleAnexoUpload} />
                    </div>

                    {formData.anexos.length > 0 && (
                      <div className="space-y-2">
                        <Label>Arquivos Anexados:</Label>
                        {formData.anexos.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">{file.name}</span>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeAnexo(index)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Contato */}
          <Collapsible open={expandedSections.contato} onOpenChange={() => toggleSection("contato")}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Contato
                    </span>
                    {expandedSections.contato ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="exemplo@email.com"
                        className={errors.email ? "border-destructive" : ""}
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="celular">Celular</Label>
                      <Input
                        id="celular"
                        value={formData.celular}
                        onChange={(e) => handleInputChange("celular", formatCellPhone(e.target.value))}
                        placeholder="+55 (XX) XXXXX-XXXX"
                        maxLength={20}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telefone1">Telefone 1</Label>
                      <Input
                        id="telefone1"
                        value={formData.telefone1}
                        onChange={(e) => handleInputChange("telefone1", formatPhone(e.target.value))}
                        placeholder="(XX) XXXX-XXXX"
                        maxLength={15}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone2">Telefone 2</Label>
                      <Input
                        id="telefone2"
                        value={formData.telefone2}
                        onChange={(e) => handleInputChange("telefone2", formatPhone(e.target.value))}
                        placeholder="(XX) XXXX-XXXX"
                        maxLength={15}
                      />
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Endereço */}
          <Collapsible open={expandedSections.endereco} onOpenChange={() => toggleSection("endereco")}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Endereço
                    </span>
                    {expandedSections.endereco ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP</Label>
                      <div className="relative">
                        <Input
                          id="cep"
                          value={formData.cep}
                          onChange={(e) => {
                            const formatted = formatCEP(e.target.value)
                            handleInputChange("cep", formatted)
                            if (formatted.replace(/\D/g, "").length === 8) {
                              searchCEP(formatted)
                            }
                          }}
                          placeholder="00000-000"
                          maxLength={9}
                          disabled={isLoadingCep}
                          className={errors.cep ? "border-destructive" : ""}
                        />
                        {isLoadingCep && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />}
                      </div>
                      {errors.cep && <p className="text-sm text-destructive">{errors.cep}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logradouro">Logradouro</Label>
                      <Input
                        id="logradouro"
                        value={formData.logradouro}
                        onChange={(e) => handleInputChange("logradouro", e.target.value)}
                        placeholder="Rua, Avenida..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numero">Número</Label>
                      <Input
                        id="numero"
                        value={formData.numero}
                        onChange={(e) => handleInputChange("numero", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="complemento">Complemento</Label>
                      <Input
                        id="complemento"
                        value={formData.complemento}
                        onChange={(e) => handleInputChange("complemento", e.target.value)}
                        placeholder="Apto, Bloco, Casa..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input
                        id="bairro"
                        value={formData.bairro}
                        onChange={(e) => handleInputChange("bairro", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        value={formData.cidade}
                        onChange={(e) => handleInputChange("cidade", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado</Label>
                      <Input
                        id="estado"
                        value={formData.estado}
                        onChange={(e) => handleInputChange("estado", e.target.value)}
                        placeholder="UF"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referencia">Referência</Label>
                    <Input
                      id="referencia"
                      value={formData.referencia}
                      onChange={(e) => handleInputChange("referencia", e.target.value)}
                      placeholder="Pontos de referência próximos"
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSubmitting ? "Salvando..." : mode === "create" ? "Salvar Paciente" : "Atualizar Paciente"}
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {mode === "create" ? "Cadastro de Paciente" : "Editar Paciente"}
          </DialogTitle>
        </DialogHeader>

        {errors.submit && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.submit}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <Collapsible open={expandedSections.dadosPessoais} onOpenChange={() => toggleSection("dadosPessoais")}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Dados Pessoais
                    </span>
                    {expandedSections.dadosPessoais ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {/* Foto */}
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 border-2 border-dashed border-muted-foreground rounded-lg flex items-center justify-center overflow-hidden">
                      {photoPreview ? (
                        <img
                          src={photoPreview || "/placeholder.svg"}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileImage className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="photo" className="cursor-pointer">
                        <Button type="button" variant="outline" asChild>
                          <span>
                            <Upload className="mr-2 h-4 w-4" />
                            Carregar Foto
                          </span>
                        </Button>
                      </Label>
                      <Input id="photo" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                      {errors.photo && <p className="text-sm text-destructive">{errors.photo}</p>}
                      <p className="text-xs text-muted-foreground">Máximo 5MB</p>
                    </div>
                  </div>

                  {/* Nome e Nome Social */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => handleInputChange("nome", e.target.value)}
                        className={errors.nome ? "border-destructive" : ""}
                      />
                      {errors.nome && <p className="text-sm text-destructive">{errors.nome}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nomeSocial">Nome Social</Label>
                      <Input
                        id="nomeSocial"
                        value={formData.nomeSocial}
                        onChange={(e) => handleInputChange("nomeSocial", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* CPF e RG */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        value={formData.cpf}
                        onChange={(e) => handleCPFChange(e.target.value)}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        className={errors.cpf ? "border-destructive" : ""}
                      />
                      {errors.cpf && <p className="text-sm text-destructive">{errors.cpf}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rg">RG</Label>
                      <Input id="rg" value={formData.rg} onChange={(e) => handleInputChange("rg", e.target.value)} />
                    </div>
                  </div>

                  {/* Outros Documentos */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="outroDocumento">Outros Documentos</Label>
                      <Select
                        value={formData.outroDocumento}
                        onValueChange={(value) => handleInputChange("outroDocumento", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cnh">CNH</SelectItem>
                          <SelectItem value="passaporte">Passaporte</SelectItem>
                          <SelectItem value="certidao-nascimento">Certidão de Nascimento</SelectItem>
                          <SelectItem value="certidao-casamento">Certidão de Casamento</SelectItem>
                          <SelectItem value="titulo-eleitor">Título de Eleitor</SelectItem>
                          <SelectItem value="carteira-trabalho">Carteira de Trabalho</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numeroDocumento">Número do Documento</Label>
                      <Input
                        id="numeroDocumento"
                        value={formData.numeroDocumento}
                        onChange={(e) => handleInputChange("numeroDocumento", e.target.value)}
                        disabled={!formData.outroDocumento}
                      />
                    </div>
                  </div>

                  {/* Sexo e Data de Nascimento */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Sexo</Label>
                      <RadioGroup value={formData.sexo} onValueChange={(value) => handleInputChange("sexo", value)}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="masculino" id="masculino" />
                          <Label htmlFor="masculino">Masculino</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="feminino" id="feminino" />
                          <Label htmlFor="feminino">Feminino</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="outro" id="outro" />
                          <Label htmlFor="outro">Outro</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                      <Input
                        id="dataNascimento"
                        type="date"
                        value={formData.dataNascimento}
                        onChange={(e) => handleInputChange("dataNascimento", e.target.value)}
                        className={errors.dataNascimento ? "border-destructive" : ""}
                      />
                      {errors.dataNascimento && <p className="text-sm text-destructive">{errors.dataNascimento}</p>}
                    </div>
                  </div>

                  {/* Etnia e Raça */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="etnia">Etnia (IBGE)</Label>
                      <Select value={formData.etnia} onValueChange={(value) => handleInputChange("etnia", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a etnia" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="branca">Branca</SelectItem>
                          <SelectItem value="preta">Preta</SelectItem>
                          <SelectItem value="parda">Parda</SelectItem>
                          <SelectItem value="amarela">Amarela</SelectItem>
                          <SelectItem value="indigena">Indígena</SelectItem>
                          <SelectItem value="nao-declarado">Não Declarado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="raca">Raça</Label>
                      <Input
                        id="raca"
                        value={formData.raca}
                        onChange={(e) => handleInputChange("raca", e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>

                  {/* Naturalidade e Nacionalidade */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="naturalidade">Naturalidade</Label>
                      <Input
                        id="naturalidade"
                        value={formData.naturalidade}
                        onChange={(e) => handleInputChange("naturalidade", e.target.value)}
                        placeholder="Cidade de nascimento"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nacionalidade">Nacionalidade</Label>
                      <Input
                        id="nacionalidade"
                        value={formData.nacionalidade}
                        onChange={(e) => handleInputChange("nacionalidade", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Profissão e Estado Civil */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="profissao">Profissão</Label>
                      <Input
                        id="profissao"
                        value={formData.profissao}
                        onChange={(e) => handleInputChange("profissao", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estadoCivil">Estado Civil</Label>
                      <Select
                        value={formData.estadoCivil}
                        onValueChange={(value) => handleInputChange("estadoCivil", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o estado civil" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                          <SelectItem value="casado">Casado(a)</SelectItem>
                          <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                          <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                          <SelectItem value="uniao-estavel">União Estável</SelectItem>
                          <SelectItem value="separado">Separado(a)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Dados dos Pais */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nomeMae">Nome da Mãe</Label>
                      <Input
                        id="nomeMae"
                        value={formData.nomeMae}
                        onChange={(e) => handleInputChange("nomeMae", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profissaoMae">Profissão da Mãe</Label>
                      <Input
                        id="profissaoMae"
                        value={formData.profissaoMae}
                        onChange={(e) => handleInputChange("profissaoMae", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nomePai">Nome do Pai</Label>
                      <Input
                        id="nomePai"
                        value={formData.nomePai}
                        onChange={(e) => handleInputChange("nomePai", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profissaoPai">Profissão do Pai</Label>
                      <Input
                        id="profissaoPai"
                        value={formData.profissaoPai}
                        onChange={(e) => handleInputChange("profissaoPai", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Responsável */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nomeResponsavel">Nome do Responsável</Label>
                      <Input
                        id="nomeResponsavel"
                        value={formData.nomeResponsavel}
                        onChange={(e) => handleInputChange("nomeResponsavel", e.target.value)}
                        placeholder="Para menores ou dependentes"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpfResponsavel">CPF do Responsável</Label>
                      <Input
                        id="cpfResponsavel"
                        value={formData.cpfResponsavel}
                        onChange={(e) => handleCPFChange(e.target.value)}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        className={errors.cpfResponsavel ? "border-destructive" : ""}
                      />
                      {errors.cpfResponsavel && <p className="text-sm text-destructive">{errors.cpfResponsavel}</p>}
                    </div>
                  </div>

                  {/* Esposo e Configurações */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nomeEsposo">Nome do Esposo(a)</Label>
                      <Input
                        id="nomeEsposo"
                        value={formData.nomeEsposo}
                        onChange={(e) => handleInputChange("nomeEsposo", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="codigoLegado">Código Legado</Label>
                      <Input
                        id="codigoLegado"
                        value={formData.codigoLegado}
                        onChange={(e) => handleInputChange("codigoLegado", e.target.value)}
                        placeholder="ID de outro sistema"
                      />
                    </div>
                  </div>

                  {/* RN na Guia do Convênio */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rnGuiaConvenio"
                      checked={formData.rnGuiaConvenio}
                      onCheckedChange={(checked) => handleInputChange("rnGuiaConvenio", checked as boolean)}
                    />
                    <Label htmlFor="rnGuiaConvenio">RN na Guia do Convênio</Label>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Observações e Anexos */}
          <Collapsible open={expandedSections.observacoes} onOpenChange={() => toggleSection("observacoes")}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Observações e Anexos
                    </span>
                    {expandedSections.observacoes ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => handleInputChange("observacoes", e.target.value)}
                      placeholder="Alergias, restrições, notas relevantes..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Anexos do Paciente</Label>
                    <div className="border-2 border-dashed border-muted-foreground rounded-lg p-4">
                      <Label htmlFor="anexos" className="cursor-pointer">
                        <div className="text-center">
                          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Clique para adicionar documentos (cartão de convênio, exames, etc.)
                          </p>
                        </div>
                      </Label>
                      <Input id="anexos" type="file" multiple className="hidden" onChange={handleAnexoUpload} />
                    </div>

                    {formData.anexos.length > 0 && (
                      <div className="space-y-2">
                        <Label>Arquivos Anexados:</Label>
                        {formData.anexos.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">{file.name}</span>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeAnexo(index)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Contato */}
          <Collapsible open={expandedSections.contato} onOpenChange={() => toggleSection("contato")}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Contato
                    </span>
                    {expandedSections.contato ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="exemplo@email.com"
                        className={errors.email ? "border-destructive" : ""}
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="celular">Celular</Label>
                      <Input
                        id="celular"
                        value={formData.celular}
                        onChange={(e) => handleInputChange("celular", formatCellPhone(e.target.value))}
                        placeholder="+55 (XX) XXXXX-XXXX"
                        maxLength={20}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telefone1">Telefone 1</Label>
                      <Input
                        id="telefone1"
                        value={formData.telefone1}
                        onChange={(e) => handleInputChange("telefone1", formatPhone(e.target.value))}
                        placeholder="(XX) XXXX-XXXX"
                        maxLength={15}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone2">Telefone 2</Label>
                      <Input
                        id="telefone2"
                        value={formData.telefone2}
                        onChange={(e) => handleInputChange("telefone2", formatPhone(e.target.value))}
                        placeholder="(XX) XXXX-XXXX"
                        maxLength={15}
                      />
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Endereço */}
          <Collapsible open={expandedSections.endereco} onOpenChange={() => toggleSection("endereco")}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Endereço
                    </span>
                    {expandedSections.endereco ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP</Label>
                      <div className="relative">
                        <Input
                          id="cep"
                          value={formData.cep}
                          onChange={(e) => {
                            const formatted = formatCEP(e.target.value)
                            handleInputChange("cep", formatted)
                            if (formatted.replace(/\D/g, "").length === 8) {
                              searchCEP(formatted)
                            }
                          }}
                          placeholder="00000-000"
                          maxLength={9}
                          disabled={isLoadingCep}
                          className={errors.cep ? "border-destructive" : ""}
                        />
                        {isLoadingCep && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />}
                      </div>
                      {errors.cep && <p className="text-sm text-destructive">{errors.cep}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logradouro">Logradouro</Label>
                      <Input
                        id="logradouro"
                        value={formData.logradouro}
                        onChange={(e) => handleInputChange("logradouro", e.target.value)}
                        placeholder="Rua, Avenida..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numero">Número</Label>
                      <Input
                        id="numero"
                        value={formData.numero}
                        onChange={(e) => handleInputChange("numero", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="complemento">Complemento</Label>
                      <Input
                        id="complemento"
                        value={formData.complemento}
                        onChange={(e) => handleInputChange("complemento", e.target.value)}
                        placeholder="Apto, Bloco, Casa..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input
                        id="bairro"
                        value={formData.bairro}
                        onChange={(e) => handleInputChange("bairro", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        value={formData.cidade}
                        onChange={(e) => handleInputChange("cidade", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado</Label>
                      <Input
                        id="estado"
                        value={formData.estado}
                        onChange={(e) => handleInputChange("estado", e.target.value)}
                        placeholder="UF"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referencia">Referência</Label>
                    <Input
                      id="referencia"
                      value={formData.referencia}
                      onChange={(e) => handleInputChange("referencia", e.target.value)}
                      placeholder="Pontos de referência próximos"
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSubmitting ? "Salvando..." : mode === "create" ? "Salvar Paciente" : "Atualizar Paciente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
