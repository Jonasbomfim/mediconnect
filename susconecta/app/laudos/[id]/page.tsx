'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer, Download, MoreVertical } from 'lucide-react'
import { buscarRelatorioPorId, getDoctorById, buscarMedicosPorIds, buscarPacientePorId } from '@/lib/api'
import { ENV_CONFIG } from '@/lib/env-config'
import ProtectedRoute from '@/components/shared/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'

export default function LaudoPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { theme } = useTheme()
  const reportId = params.id as string
  const isDark = theme === 'dark'

  const [report, setReport] = useState<any | null>(null)
  const [doctor, setDoctor] = useState<any | null>(null)
  const [patient, setPatient] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!reportId) return

    let mounted = true

    async function loadReport() {
      try {
        setLoading(true)
        const reportData = await buscarRelatorioPorId(reportId)
        
        if (!mounted) return
        setReport(reportData)

        // Load patient info if patient_id exists
        const rd = reportData as any
        const patientId = rd?.patient_id
        if (patientId) {
          try {
            const patientData = await buscarPacientePorId(patientId).catch(() => null)
            if (mounted && patientData) {
              setPatient(patientData)
            }
          } catch (e) {
            console.warn('Erro ao carregar dados do paciente:', e)
          }
        }

        // Load doctor info using the same strategy as paciente/page.tsx
        const maybeId = rd?.doctor_id ?? rd?.created_by ?? rd?.doctor ?? null
        
        if (maybeId) {
          try {
            // First try: buscarMedicosPorIds
            let doctors = await buscarMedicosPorIds([maybeId]).catch(() => [])
            
            if (!doctors || doctors.length === 0) {
              // Second try: getDoctorById
              const doc = await getDoctorById(String(maybeId)).catch(() => null)
              if (doc) doctors = [doc]
            }
            
            if (!doctors || doctors.length === 0) {
              // Third try: direct REST with user_id filter
              const token = (typeof window !== 'undefined') 
                ? (localStorage.getItem('auth_token') || localStorage.getItem('token') || 
                   sessionStorage.getItem('auth_token') || sessionStorage.getItem('token')) 
                : null
              const headers: Record<string,string> = { 
                apikey: (ENV_CONFIG as any).SUPABASE_ANON_KEY, 
                Accept: 'application/json' 
              }
              if (token) headers.Authorization = `Bearer ${token}`
              const url = `${(ENV_CONFIG as any).SUPABASE_URL}/rest/v1/doctors?user_id=eq.${encodeURIComponent(String(maybeId))}&limit=1`
              const res = await fetch(url, { method: 'GET', headers })
              if (res && res.status < 400) {
                const rows = await res.json().catch(() => [])
                if (rows && Array.isArray(rows) && rows.length) {
                  doctors = rows
                }
              }
            }
            
            if (mounted && doctors && doctors.length > 0) {
              setDoctor(doctors[0])
            }
          } catch (e) {
            console.warn('Erro ao carregar dados do profissional:', e)
          }
        }
      } catch (err) {
        if (mounted) setError('Erro ao carregar o laudo.')
        console.error(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadReport()
    return () => { mounted = false }
  }, [reportId])

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!report) return
    
    try {
      // Para simplificar, vamos usar jsPDF com html2canvas para capturar o conteúdo
      const { jsPDF } = await import('jspdf')
      const html2canvas = await import('html2canvas').then((m) => m.default)
      
      // Criar um elemento temporário com o conteúdo
      const element = document.createElement('div')
      element.style.position = 'absolute'
      element.style.left = '-9999px'
      element.style.width = '210mm' // A4 width
      element.style.padding = '20mm'
      element.style.backgroundColor = 'white'
      element.style.fontFamily = 'Arial, sans-serif'
      
      // Extrair informações
      const reportDate = new Date(report.report_date || report.created_at || Date.now()).toLocaleDateString('pt-BR')
      const cid = report.cid ?? report.cid_code ?? report.cidCode ?? report.cie ?? ''
      const exam = report.exam ?? report.exame ?? report.especialidade ?? report.report_type ?? ''
      const diagnosis = report.diagnosis ?? report.diagnostico ?? report.diagnosis_text ?? report.diagnostico_text ?? ''
      const conclusion = report.conclusion ?? report.conclusao ?? report.conclusion_text ?? report.conclusao_text ?? ''
      const notesText = report.content ?? report.body ?? report.conteudo ?? report.notes ?? report.observacoes ?? ''
      
      // Extrair nome do médico
      let doctorName = ''
      if (doctor) {
        doctorName = doctor.full_name || doctor.name || doctor.fullName || doctor.doctor_name || ''
      }
      if (!doctorName) {
        const rd = report as any
        const tryKeys = [
          'doctor_name', 'doctor_full_name', 'doctorFullName', 'doctorName',
          'requested_by_name', 'requested_by', 'requester_name', 'requester',
          'created_by_name', 'created_by', 'executante', 'executante_name',
        ]
        for (const k of tryKeys) {
          const v = rd[k]
          if (v !== undefined && v !== null && String(v).trim() !== '') {
            doctorName = String(v)
            break
          }
        }
      }

      // Extrair nome do paciente
      let patientName = ''
      if (patient) {
        patientName = patient.full_name || patient.name || ''
      }

      // Montar HTML do documento
      element.innerHTML = `
        <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px;">
          <h1 style="text-align: center; font-size: 24px; font-weight: bold; color: #1f2937; margin: 0;">RELATÓRIO MÉDICO</h1>
          <p style="text-align: center; font-size: 10px; color: #6b7280; margin: 5px 0;">Data: ${reportDate}</p>
          ${patientName ? `<p style="text-align: center; font-size: 10px; color: #6b7280; margin: 5px 0;">Paciente: ${patientName}</p>` : ''}
          ${doctorName ? `<p style="text-align: center; font-size: 10px; color: #6b7280; margin: 5px 0;">Profissional: ${doctorName}</p>` : ''}
        </div>

        <div style="background-color: #f0f9ff; border: 1px solid #bfdbfe; padding: 10px; margin-bottom: 15px;">
          <div style="display: flex; gap: 20px;">
            ${cid ? `<div><p style="font-size: 9px; font-weight: bold; color: #475569; margin: 0 0 5px 0;">CID</p><p style="font-size: 11px; font-weight: bold; color: #1f2937; margin: 0;">${cid}</p></div>` : ''}
            ${exam ? `<div><p style="font-size: 9px; font-weight: bold; color: #475569; margin: 0 0 5px 0;">EXAME / TIPO</p><p style="font-size: 11px; font-weight: bold; color: #1f2937; margin: 0;">${exam}</p></div>` : ''}
          </div>
        </div>

        ${diagnosis ? `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 14px; font-weight: bold; color: #1e40af; margin: 0 0 10px 0;">DIAGNÓSTICO</h2>
            <p style="margin-left: 10px; padding-left: 10px; border-left: 2px solid #3b82f6; background-color: #f3f4f6; font-size: 10px; line-height: 1.5; margin: 0;">${diagnosis}</p>
          </div>
        ` : ''}

        ${conclusion ? `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 14px; font-weight: bold; color: #1e40af; margin: 0 0 10px 0;">CONCLUSÃO</h2>
            <p style="margin-left: 10px; padding-left: 10px; border-left: 2px solid #3b82f6; background-color: #f3f4f6; font-size: 10px; line-height: 1.5; margin: 0;">${conclusion}</p>
          </div>
        ` : ''}

        ${notesText ? `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 14px; font-weight: bold; color: #1e40af; margin: 0 0 10px 0;">NOTAS DO PROFISSIONAL</h2>
            <p style="margin-left: 10px; padding-left: 10px; border-left: 2px solid #3b82f6; background-color: #f3f4f6; font-size: 10px; line-height: 1.5; margin: 0;">${notesText}</p>
          </div>
        ` : ''}

        <div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 8px; text-align: center; color: #9ca3af;">
          Documento gerado em ${new Date().toLocaleString('pt-BR')}
        </div>
      `

      document.body.appendChild(element)

      // Capturar como canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })

      document.body.removeChild(element)

      // Converter para PDF
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      while (heightLeft >= 0) {
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
        position -= pageHeight
        if (heightLeft > 0) {
          pdf.addPage()
        }
      }

      // Download
      pdf.save(`laudo-${reportDate}-${doctorName || 'profissional'}.pdf`)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar PDF. Tente novamente.')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-lg text-muted-foreground">Carregando laudo...</div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !report) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
          <div className="text-lg text-red-500 mb-4">{error || 'Laudo não encontrado.'}</div>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </ProtectedRoute>
    )
  }

  // Extract fields with fallbacks
  const reportDate = new Date(report.report_date || report.created_at || Date.now()).toLocaleDateString('pt-BR')
  const cid = report.cid ?? report.cid_code ?? report.cidCode ?? report.cie ?? ''
  const exam = report.exam ?? report.exame ?? report.especialidade ?? report.report_type ?? ''
  const diagnosis = report.diagnosis ?? report.diagnostico ?? report.diagnosis_text ?? report.diagnostico_text ?? ''
  const conclusion = report.conclusion ?? report.conclusao ?? report.conclusion_text ?? report.conclusao_text ?? ''
  const notesHtml = report.content_html ?? report.conteudo_html ?? report.contentHtml ?? null
  const notesText = report.content ?? report.body ?? report.conteudo ?? report.notes ?? report.observacoes ?? ''
  
  // Extract doctor name with multiple fallbacks
  let doctorName = ''
  if (doctor) {
    doctorName = doctor.full_name || doctor.name || doctor.fullName || doctor.doctor_name || ''
  }
  if (!doctorName) {
    const rd = report as any
    const tryKeys = [
      'doctor_name', 'doctor_full_name', 'doctorFullName', 'doctorName',
      'requested_by_name', 'requested_by', 'requester_name', 'requester',
      'created_by_name', 'created_by', 'executante', 'executante_name',
    ]
    for (const k of tryKeys) {
      const v = rd[k]
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        doctorName = String(v)
        break
      }
    }
  }

  return (
    <ProtectedRoute>
      <div className={`min-h-screen transition-colors duration-300 ${
        isDark 
          ? 'bg-gradient-to-br from-slate-950 to-slate-900' 
          : 'bg-gradient-to-br from-slate-50 to-slate-100'
      }`}>
        {/* Header Toolbar */}
        <div className={`sticky top-0 z-40 transition-colors duration-300 print:hidden ${
          isDark 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-slate-200'
        } border-b shadow-md`}>
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className={`${
                  isDark 
                    ? 'text-slate-300 hover:bg-slate-700 hover:text-white' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className={`h-8 w-px ${isDark ? 'bg-slate-600' : 'bg-slate-300'}`} />
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wide ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>Laudo Médico</p>
                <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {doctorName || 'Profissional'}
                </p>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrint}
                title="Imprimir"
                className={`${
                  isDark 
                    ? 'text-slate-300 hover:bg-slate-700 hover:text-white' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Printer className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Mais opções"
                className={`${
                  isDark 
                    ? 'text-slate-300 hover:bg-slate-700 hover:text-white' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex justify-center py-6 sm:py-8 md:py-12 px-2 sm:px-4 print:py-0 print:px-0 min-h-[calc(100vh-80px)] print:min-h-screen">
          {/* Document Container */}
          <div className={`w-full max-w-2xl sm:max-w-3xl md:max-w-4xl transition-colors duration-300 shadow-lg sm:shadow-xl rounded-lg sm:rounded-xl overflow-hidden print:shadow-none print:rounded-none print:max-w-full ${
            isDark ? 'bg-slate-800' : 'bg-white'
          }`}>
            {/* Document Content */}
            <div className="p-4 sm:p-8 md:p-12 lg:p-16 space-y-4 sm:space-y-6 md:space-y-8 print:p-12 print:space-y-6">
              
              {/* Title */}
              <div className={`text-center mb-6 sm:mb-8 md:mb-12 pb-4 sm:pb-6 md:pb-8 border-b-2 ${
                isDark ? 'border-blue-900' : 'border-blue-200'
              }`}>
                <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  RELATÓRIO MÉDICO
                </h1>
                <div className={`text-xs sm:text-sm space-y-0.5 sm:space-y-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <p className="font-medium">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Data:</span> {reportDate}
                  </p>
                  {doctorName && (
                    <p className="font-medium">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Profissional:</span>{' '}
                      <strong className={isDark ? 'text-blue-400' : 'text-blue-700'}>{doctorName}</strong>
                    </p>
                  )}
                </div>
              </div>

              {/* Patient/Header Info */}
              <div className={`rounded-lg p-3 sm:p-4 md:p-6 border transition-colors duration-300 ${
                isDark 
                  ? 'bg-slate-900 border-slate-700' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm">
                  {patient && (
                    <div>
                      <label className={`text-xs uppercase font-semibold tracking-wide block mb-1.5 sm:mb-2 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>Paciente</label>
                      <p className={`text-base sm:text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {patient.full_name || patient.name || 'N/A'}
                      </p>
                    </div>
                  )}
                  {cid && (
                    <div>
                      <label className={`text-xs uppercase font-semibold tracking-wide block mb-1.5 sm:mb-2 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>CID</label>
                      <p className={`text-base sm:text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {cid}
                      </p>
                    </div>
                  )}
                  {exam && (
                    <div>
                      <label className={`text-xs uppercase font-semibold tracking-wide block mb-1.5 sm:mb-2 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>Exame / Tipo</label>
                      <p className={`text-base sm:text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {exam}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Diagnosis Section */}
              {diagnosis && (
                <div className="space-y-2 sm:space-y-3">
                  <h2 className={`text-lg sm:text-xl font-bold uppercase tracking-wide ${
                    isDark ? 'text-blue-400' : 'text-blue-700'
                  }`}>Diagnóstico</h2>
                  <div className={`whitespace-pre-wrap text-sm sm:text-base leading-relaxed rounded-lg p-3 sm:p-4 border-l-4 border-blue-500 transition-colors duration-300 ${
                    isDark 
                      ? 'bg-slate-900 text-slate-200' 
                      : 'bg-blue-50 text-slate-800'
                  }`}>
                    {diagnosis}
                  </div>
                </div>
              )}

              {/* Conclusion Section */}
              {conclusion && (
                <div className="space-y-2 sm:space-y-3">
                  <h2 className={`text-lg sm:text-xl font-bold uppercase tracking-wide ${
                    isDark ? 'text-blue-400' : 'text-blue-700'
                  }`}>Conclusão</h2>
                  <div className={`whitespace-pre-wrap text-sm sm:text-base leading-relaxed rounded-lg p-3 sm:p-4 border-l-4 border-blue-500 transition-colors duration-300 ${
                    isDark 
                      ? 'bg-slate-900 text-slate-200' 
                      : 'bg-blue-50 text-slate-800'
                  }`}>
                    {conclusion}
                  </div>
                </div>
              )}

              {/* Notes/Content Section */}
              {(notesHtml || notesText) && (
                <div className="space-y-2 sm:space-y-3">
                  <h2 className={`text-lg sm:text-xl font-bold uppercase tracking-wide ${
                    isDark ? 'text-blue-400' : 'text-blue-700'
                  }`}>Notas do Profissional</h2>
                  {notesHtml ? (
                    <div 
                      className={`prose prose-sm max-w-none rounded-lg p-3 sm:p-4 border-l-4 border-blue-500 transition-colors duration-300 text-xs sm:text-sm ${
                        isDark 
                          ? 'prose-invert bg-slate-900 text-slate-200' 
                          : 'bg-blue-50 text-slate-800'
                      }`}
                      dangerouslySetInnerHTML={{ __html: String(notesHtml) }}
                    />
                  ) : (
                    <div className={`whitespace-pre-wrap text-sm sm:text-base leading-relaxed rounded-lg p-3 sm:p-4 border-l-4 border-blue-500 transition-colors duration-300 ${
                      isDark 
                        ? 'bg-slate-900 text-slate-200' 
                        : 'bg-blue-50 text-slate-800'
                    }`}>
                      {notesText}
                    </div>
                  )}
                </div>
              )}

              {/* Signature Section */}
              {report.doctor_signature && (
                <div className={`pt-6 sm:pt-8 border-t-2 ${isDark ? 'border-slate-600' : 'border-slate-300'}`}>
                  <div className="flex flex-col items-center gap-3 sm:gap-4">
                    <div className={`rounded-lg p-2 sm:p-4 border transition-colors duration-300 ${
                      isDark 
                        ? 'bg-slate-900 border-slate-600' 
                        : 'bg-slate-100 border-slate-300'
                    }`}>
                      <Image
                        src={report.doctor_signature}
                        alt="Assinatura do profissional"
                        width={150}
                        height={100}
                        className="h-16 sm:h-20 w-auto"
                      />
                    </div>
                    {doctorName && (
                      <div className="text-center">
                        <p className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {doctorName}
                        </p>
                        {doctor?.crm && (
                          <p className={`text-xs mt-0.5 sm:mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            CRM: {doctor.crm}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className={`pt-8 border-t-2 text-center space-y-2 ${isDark ? 'border-slate-600' : 'border-slate-300'}`}>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Documento gerado em {new Date().toLocaleString('pt-BR')}
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
