"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

// Importações dinâmicas para evitar erros de SSR
const SignatureCanvas = dynamic(() => import("react-signature-canvas"), {
  ssr: false,
});



// Função para converter marcações em HTML
const formatTextToHtml = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
    .replace(/\n/g, '<br>');
};

// Editor simples para laudos
const QuillEditor = ({ value, onChange }: { value: string; onChange: (content: string) => void }) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 p-2 border-b justify-between">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const textarea = document.querySelector('textarea[data-quill-temp]') as HTMLTextAreaElement;
              if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const selectedText = textarea.value.substring(start, end);
                
                if (selectedText) {
                  const newText = textarea.value.substring(0, start) + `**${selectedText}**` + textarea.value.substring(end);
                  onChange(newText);
                  setTimeout(() => {
                    textarea.setSelectionRange(start + 2, end + 2);
                    textarea.focus();
                  }, 0);
                } else {
                  const newText = textarea.value.substring(0, start) + `**texto em negrito**` + textarea.value.substring(end);
                  onChange(newText);
                  setTimeout(() => {
                    textarea.setSelectionRange(start + 2, start + 18);
                    textarea.focus();
                  }, 0);
                }
              }
            }}
            title="Negrito"
          >
            <strong>B</strong>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const textarea = document.querySelector('textarea[data-quill-temp]') as HTMLTextAreaElement;
              if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const selectedText = textarea.value.substring(start, end);
                
                if (selectedText) {
                  const newText = textarea.value.substring(0, start) + `*${selectedText}*` + textarea.value.substring(end);
                  onChange(newText);
                  setTimeout(() => {
                    textarea.setSelectionRange(start + 1, end + 1);
                    textarea.focus();
                  }, 0);
                } else {
                  const newText = textarea.value.substring(0, start) + `*texto em itálico*` + textarea.value.substring(end);
                  onChange(newText);
                  setTimeout(() => {
                    textarea.setSelectionRange(start + 1, start + 17);
                    textarea.focus();
                  }, 0);
                }
              }
            }}
            title="Itálico"
          >
            <em>I</em>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const textarea = document.querySelector('textarea[data-quill-temp]') as HTMLTextAreaElement;
              if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const selectedText = textarea.value.substring(start, end);
                
                if (selectedText) {
                  const newText = textarea.value.substring(0, start) + `<u>${selectedText}</u>` + textarea.value.substring(end);
                  onChange(newText);
                  setTimeout(() => {
                    textarea.setSelectionRange(start + 3, end + 3);
                    textarea.focus();
                  }, 0);
                } else {
                  const newText = textarea.value.substring(0, start) + `<u>texto sublinhado</u>` + textarea.value.substring(end);
                  onChange(newText);
                  setTimeout(() => {
                    textarea.setSelectionRange(start + 3, start + 19);
                    textarea.focus();
                  }, 0);
                }
              }
            }}
            title="Sublinhado"
          >
            <u>U</u>
          </Button>
        </div>
        
        <Button
          type="button"
          variant={showPreview ? "default" : "outline"}
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? "Editar" : "Prévia"}
        </Button>
      </div>

      {showPreview ? (
        <div className="min-h-64 p-3 border rounded-md bg-white text-sm">
          {value ? (
            <div dangerouslySetInnerHTML={{ __html: formatTextToHtml(value) }} />
          ) : (
            <p className="text-gray-400">Nenhum conteúdo para prévia</p>
          )}
        </div>
      ) : (
        <Textarea
          data-quill-temp="true"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Digite o conteúdo do laudo aqui..."
          className="min-h-64 text-sm"
          rows={12}
        />
      )}
      
      <div className="text-xs text-gray-500">
        <strong>Dica:</strong> Selecione um texto e clique nos botões B, I, U para formatar. Use o botão "Prévia" para ver como ficará formatado.
        <br />
        <strong>Formatação:</strong> **negrito**, *itálico*, &lt;u&gt;sublinhado&lt;/u&gt;
      </div>
    </div>
  );
};

// Wrapper para o SignatureCanvas para evitar erros
const SignaturePad = ({ canvasRef, onEnd }: { canvasRef: any; onEnd: () => void }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-32 border rounded bg-gray-50 flex items-center justify-center">Carregando área de assinatura...</div>;
  }

  return (
    <SignatureCanvas
      ref={canvasRef}
      penColor="#000"
      backgroundColor="#fff"
      canvasProps={{ 
        width: 400, 
        height: 120, 
        className: "border rounded bg-white w-full" 
      }}
      onEnd={onEnd}
    />
  );
};
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { buscarPacientes } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { User, FolderOpen, X, Users, MessageSquare, ClipboardList, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Clock, FileCheck, Upload, Download, Eye, History, Stethoscope, Pill, Activity } from "lucide-react"
import { Calendar as CalendarIcon, FileText, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
});

const pacientes = [
  { nome: "Ana Souza", cpf: "123.456.789-00", idade: 42, statusLaudo: "Finalizado" },
  { nome: "Bruno Lima", cpf: "987.654.321-00", idade: 33, statusLaudo: "Pendente" },
  { nome: "Carla Menezes", cpf: "111.222.333-44", idade: 67, statusLaudo: "Rascunho" },
];

const medico = {
  nome: "Dr. Carlos Andrade",
  identificacao: "CRM 000000 • Cardiologia e Dermatologia",
  fotoUrl: "",
}


const colorsByType = {
  Rotina: "#4dabf7",
  Cardiologia: "#f76c6c",
  Otorrino: "#f7b84d",
  Pediatria: "#6cf78b",
  Dermatologia: "#9b59b6",
  Oftalmologia: "#2ecc71"
};

const ProfissionalPage = () => {
  const { logout, user } = useAuth();
  const [activeSection, setActiveSection] = useState('calendario');
  const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(null);
  
  // Estados para o perfil do médico
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    nome: "Dr. Carlos Andrade",
    email: user?.email || "carlos.andrade@hospital.com",
    telefone: "(11) 99999-9999",
    endereco: "Rua das Flores, 123 - Centro",
    cidade: "São Paulo",
    cep: "01234-567",
    crm: "CRM 000000",
    especialidade: "Cardiologia e Dermatologia",
    biografia: "Médico especialista em cardiologia e dermatologia com mais de 15 anos de experiência em tratamentos clínicos e cirúrgicos."
  });

  // Estados para relatórios médicos
  const [relatorioMedico, setRelatorioMedico] = useState({
    pacienteNome: "",
    pacienteCpf: "",
    pacienteIdade: "",
    profissionalNome: medico.nome,
    profissionalCrm: medico.identificacao,
    motivoRelatorio: "",
    historicoClinico: "",
    sinaisSintomas: "",
    examesRealizados: "",
    resultadosExames: "",
    diagnosticos: "",
    prognostico: "",
    tratamentosRealizados: "",
    recomendacoes: "",
    dataRelatorio: new Date().toISOString().split('T')[0]
  });
  const [relatoriosMedicos, setRelatoriosMedicos] = useState<any[]>([]);
  const [editandoRelatorio, setEditandoRelatorio] = useState<any>(null);

  // Estados para funcionalidades do prontuário
  const [consultasRegistradas, setConsultasRegistradas] = useState<any[]>([]);
  const [historicoMedico, setHistoricoMedico] = useState<any[]>([]);
  const [prescricoesMedicas, setPrescricoesMedicas] = useState<any[]>([]);
  const [examesSolicitados, setExamesSolicitados] = useState<any[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<any[]>([]);
  const [evolucaoQuadro, setEvolucaoQuadro] = useState<any[]>([]);
  const [anexos, setAnexos] = useState<any[]>([]);
  const [abaProntuarioAtiva, setAbaProntuarioAtiva] = useState('nova-consulta');

  // Estados para campos principais da consulta
  const [consultaAtual, setConsultaAtual] = useState({
    dataConsulta: new Date().toISOString().split('T')[0],
    anamnese: "",
    exameFisico: "",
    hipotesesDiagnosticas: "",
    condutaMedica: "",
    prescricoes: "",
    retornoAgendado: "",
    cid10: ""
  });
  
  const [events, setEvents] = useState<any[]>([
    
    {
      id: 1,
      title: "Ana Souza",
      type: "Cardiologia",
      time: "09:00",
      date: new Date().toISOString().split('T')[0], 
      pacienteId: "123.456.789-00",
      color: colorsByType.Cardiologia
    },
    {
      id: 2,
      title: "Bruno Lima",
      type: "Cardiologia",
      time: "10:30",
      date: new Date().toISOString().split('T')[0], 
      pacienteId: "987.654.321-00",
      color: colorsByType.Cardiologia
    },
    {
      id: 3,
      title: "Carla Menezes",
      type: "Dermatologia",
      time: "14:00",
      date: new Date().toISOString().split('T')[0], 
      pacienteId: "111.222.333-44",
      color: colorsByType.Dermatologia
    }
  ]);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [step, setStep] = useState(1);
  const [newEvent, setNewEvent] = useState({ 
    title: "", 
    type: "", 
    time: "",
    pacienteId: "" 
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  // Estados para o gerenciamento de laudos
  const [laudosData, setLaudosData] = useState<any[]>([
    {
      id: "30648642",
      data: "23/07/2025",
      preco: "25/07/2025",
      recipient: "Ana Souza",
      execSolicitante: "Dr. Carlos Andrade",
      exameTipo: "Avaliação Cardiológica Completa",
      status: "Entregue",
      cid: "I25.1",
      diagnostico: "Doença aterosclerótica do coração com angina de peito",
      conclusao: "Paciente apresenta quadro de doença arterial coronariana estável. Recomendado tratamento medicamentoso e acompanhamento regular.",
      conteudo: `**HISTÓRIA CLÍNICA:**
Paciente do sexo feminino, 42 anos, procurou atendimento devido a episódios de dor torácica aos esforços, com duração de aproximadamente 5 minutos, que melhora com repouso. Relata também dispneia aos médios esforços e palpitações ocasionais.

**ANTECEDENTES:**
- Hipertensão arterial sistêmica há 8 anos
- Dislipidemia
- Histórico familiar de doença arterial coronariana (pai)
- Sedentarismo

**EXAME FÍSICO:**
- PA: 145/90 mmHg
- FC: 76 bpm
- Peso: 68 kg, Altura: 1,62 m, IMC: 25,9 kg/m²
- Ausculta cardíaca: bulhas normofonéticas, sem sopros
- Ausculta pulmonar: murmúrio vesicular presente bilateralmente

**EXAMES COMPLEMENTARES:**
- ECG: ritmo sinusal, sem alterações isquêmicas
- Ecocardiograma: função sistólica preservada (FEVE: 65%), sem alterações segmentares
- Teste ergométrico: positivo para isquemia miocárdica

**CONDUTA:**
- Otimização do tratamento anti-hipertensivo
- Estatina para controle da dislipidemia  
- Antiagregante plaquetário
- Orientações sobre estilo de vida
- Retorno em 30 dias`
    },
    {
      id: "30645947",
      data: "24/07/2025", 
      preco: "25/07/2025",
      recipient: "Bruno Lima",
      execSolicitante: "Dr. Carlos Andrade",
      exameTipo: "Avaliação Dermatológica - Lesões Pigmentadas",
      status: "Entregue",
      cid: "D22.9",
      diagnostico: "Nevo melanocítico benigno",
      conclusao: "Lesões pigmentadas benignas. Recomendado acompanhamento dermatológico anual e uso de protetor solar.",
      conteudo: `**HISTÓRIA CLÍNICA:**
Paciente masculino, 33 anos, comparece para avaliação de múltiplas lesões pigmentadas pelo corpo, algumas com crescimento recente. Nega sintomas como prurido, sangramento ou mudanças de coloração. Histórico de exposição solar intensa durante a infância e adolescência.

**ANTECEDENTES:**
- Fototipo II (pele clara, queima facilmente)
- Múltiplas queimaduras solares na infância
- Histórico familiar negativo para melanoma
- Uso irregular de protetor solar

**EXAME FÍSICO:**
**Dermatoscopia realizada em 12 lesões:**

*Lesão dorso (2cm superior ao ombro direito):*
- Mácula acastanhada, 4mm, bordas regulares
- Padrão dermatoscópico: rede pigmentar homogênea
- Score ABCD: 2,5 (baixo risco)

*Lesão região escapular esquerda:*
- Pápula pigmentada, 3mm, simétrica
- Padrão globular homogêneo
- Sem sinais de malignidade

*Demais lesões:*
- Características benignas similares
- Ausência de critérios de malignidade
- Padrões dermatoscópicos típicos de nevos

**CONDUTA:**
- Mapeamento corporal documentado
- Fotoproteção rigorosa (FPS 60+)
- Autoexame mensal orientado
- Reavaliação dermatoscópica em 12 meses
- Biópsia desnecessária no momento atual`
    },
    {
      id: "30649123",
      data: "25/07/2025",
      preco: "26/07/2025", 
      recipient: "Carla Menezes",
      execSolicitante: "Dr. Carlos Andrade",
      exameTipo: "Avaliação Cardiológica - Insuficiência Cardíaca",
      status: "Rascunho",
      cid: "I50.9",
      diagnostico: "Insuficiência cardíaca não especificada",
      conclusao: "Insuficiência cardíaca classe funcional II. Necessário ajuste da medicação e monitorização rigorosa.",
      conteudo: `**HISTÓRIA CLÍNICA:**
Paciente feminina, 67 anos, com queixa de dispneia progressiva aos esforços há 6 meses, associada a edema de membros inferiores e fadiga. Nega dor torácica, palpitações ou síncope.

**ANTECEDENTES:**
- Hipertensão arterial há 15 anos
- Diabetes mellitus tipo 2 há 10 anos
- Infarto agudo do miocárdio há 3 anos
- Tabagismo pregresso (parou há 5 anos)

**EXAME FÍSICO:**
- PA: 130/80 mmHg
- FC: 88 bpm (irregular)
- Edema ++/4+ em MMII
- Estase jugular a 45°
- Ausculta cardíaca: B3 audível, sopro sistólico 2+/6+
- Crepitações bibasais

**EXAMES:**
- BNP: 850 pg/ml (elevado)
- Ecocardiograma: FEVE 35%, dilatação de VE
- RX tórax: cardiomegalia, congestão pulmonar

**MEDICAÇÕES EM USO:**
- Enalapril 10mg 2x/dia
- Carvedilol 6,25mg 2x/dia  
- Furosemida 40mg/dia
- Metformina 850mg 2x/dia

**CONDUTA PROPOSTA:**
- Ajuste das medicações para IC
- Restrição de sódio (<2g/dia)
- Controle rigoroso de peso diário
- Retorno em 15 dias`
    }
  ]);
  
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [buscarTexto, setBuscarTexto] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [laudoAtivo, setLaudoAtivo] = useState<any>(null);
  const [modoEdicao, setModoEdicao] = useState<'novo' | 'editar' | null>(null);

  // Estados para o editor de laudo
  const [editorLaudo, setEditorLaudo] = useState({
    pacienteId: "",
    pacienteNome: "",
    pacienteCpf: "",
    pacienteIdade: "",
    cid: "",
    diagnostico: "",
    conclusao: "",
    conteudo: "",
    imagens: [] as string[],
    pdfAnexos: [] as string[],
    incluirData: true,
    incluirAssinatura: true,
    status: "Rascunho"
  });
  const [assinaturaLaudo, setAssinaturaLaudo] = useState<string | null>(null);
  const [previewLaudo, setPreviewLaudo] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'editor' | 'imagens' | 'anexos' | 'preview'>('editor');
  const [laudoVisualizacao, setLaudoVisualizacao] = useState<any>(null);
  const sigCanvasLaudoRef = useRef<any>(null);

  // Modelos e frases prontas
  const modelosTexto = {
    "Exame Normal": "O exame realizado apresentou parâmetros dentro da normalidade, sem alterações significativas detectadas.",
    "Acompanhamento": "Recomenda-se acompanhamento médico regular para monitoramento da evolução do quadro clínico.",
    "Alterações Leves": "Foram observadas alterações leves que requerem acompanhamento, sem indicação de intervenção imediata.",
    "Urgente": "Os achados indicam necessidade de avaliação médica urgente e início de tratamento adequado."
  };

  const camposDinamicos = [
    { label: "Nome do Paciente", value: "{NOME_PACIENTE}" },
    { label: "Idade", value: "{IDADE}" },
    { label: "CPF", value: "{CPF}" },
    { label: "Data Atual", value: "{DATA_ATUAL}" },
    { label: "CID", value: "{CID}" },
    { label: "Médico", value: "{MEDICO}" }
  ];

  const handleSave = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    console.log("Laudo salvo!");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAbrirProntuario = (paciente: any) => {
    setPacienteSelecionado(paciente);
    
    const pacienteLaudo = document.getElementById('pacienteLaudo') as HTMLInputElement;
    if (pacienteLaudo) pacienteLaudo.value = paciente.nome;
    
    const destinatario = document.getElementById('destinatario') as HTMLInputElement;
    if (destinatario) destinatario.value = `${paciente.nome} - ${paciente.cpf}`;
    
    const prontuarioSection = document.getElementById('prontuario-paciente');
    if (prontuarioSection) {
      prontuarioSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFecharProntuario = () => {
    setPacienteSelecionado(null);
  };

  
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentCalendarDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentCalendarDate(newDate);
  };

  const goToToday = () => {
    setCurrentCalendarDate(new Date());
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Filtrar eventos do dia atual
  const getTodayEvents = () => {
    const today = currentCalendarDate.toISOString().split('T')[0];
    return events
      .filter(event => event.date === today)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const getStatusColor = (type: string) => {
    return colorsByType[type as keyof typeof colorsByType] || "#4dabf7";
  };

  // Funções para o perfil
  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = () => {
    setIsEditingProfile(false);
    alert('Perfil atualizado com sucesso!');
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
  };

  // Funções para relatórios médicos
  const handleRelatorioChange = (field: string, value: string) => {
    setRelatorioMedico(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSalvarRelatorio = () => {
    if (!relatorioMedico.pacienteNome || !relatorioMedico.motivoRelatorio) {
      alert('Por favor, preencha pelo menos o nome do paciente e o motivo do relatório.');
      return;
    }

    const novoRelatorio = {
      ...relatorioMedico,
      id: Date.now(),
      dataGeracao: new Date().toLocaleString()
    };

    if (editandoRelatorio) {
      setRelatoriosMedicos(prev => 
        prev.map(rel => rel.id === editandoRelatorio.id ? novoRelatorio : rel)
      );
      setEditandoRelatorio(null);
      alert('Relatório médico atualizado com sucesso!');
    } else {
      setRelatoriosMedicos(prev => [novoRelatorio, ...prev]);
      alert('Relatório médico salvo com sucesso!');
    }

    // Limpar formulário
    setRelatorioMedico({
      pacienteNome: "",
      pacienteCpf: "",
      pacienteIdade: "",
      profissionalNome: medico.nome,
      profissionalCrm: medico.identificacao,
      motivoRelatorio: "",
      historicoClinico: "",
      sinaisSintomas: "",
      examesRealizados: "",
      resultadosExames: "",
      diagnosticos: "",
      prognostico: "",
      tratamentosRealizados: "",
      recomendacoes: "",
      dataRelatorio: new Date().toISOString().split('T')[0]
    });
  };

  const handleEditarRelatorio = (relatorio: any) => {
    setRelatorioMedico(relatorio);
    setEditandoRelatorio(relatorio);
  };

  const handleExcluirRelatorio = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este relatório médico?')) {
      setRelatoriosMedicos(prev => prev.filter(rel => rel.id !== id));
      alert('Relatório médico excluído com sucesso!');
    }
  };

  const handleCancelarEdicaoRelatorio = () => {
    setEditandoRelatorio(null);
    setRelatorioMedico({
      pacienteNome: "",
      pacienteCpf: "",
      pacienteIdade: "",
      profissionalNome: medico.nome,
      profissionalCrm: medico.identificacao,
      motivoRelatorio: "",
      historicoClinico: "",
      sinaisSintomas: "",
      examesRealizados: "",
      resultadosExames: "",
      diagnosticos: "",
      prognostico: "",
      tratamentosRealizados: "",
      recomendacoes: "",
      dataRelatorio: new Date().toISOString().split('T')[0]
    });
  };

  
  const handleDateClick = (arg: any) => {
    setSelectedDate(arg.dateStr);
    setNewEvent({ title: "", type: "", time: "", pacienteId: "" });
    setStep(1);
    setEditingEvent(null);
    setShowPopup(true);
  };

 
  const handleAddEvent = () => {
    const paciente = pacientes.find(p => p.nome === newEvent.title);
    const eventToAdd = {
      id: Date.now(),
      title: newEvent.title,
      type: newEvent.type,
      time: newEvent.time,
      date: selectedDate || currentCalendarDate.toISOString().split('T')[0],
      pacienteId: paciente ? paciente.cpf : "",
      color: colorsByType[newEvent.type as keyof typeof colorsByType] || "#4dabf7"
    };
    setEvents((prev) => [...prev, eventToAdd]);
    setShowPopup(false);
  };


  const handleEditEvent = () => {
    setEvents((prevEvents) =>
      prevEvents.map((ev) =>
        ev.id.toString() === editingEvent.id.toString()
          ? {
              ...ev,
              title: newEvent.title,
              type: newEvent.type,
              time: newEvent.time,
              color: colorsByType[newEvent.type as keyof typeof colorsByType] || "#4dabf7"
            }
          : ev
      )
    );
    setEditingEvent(null);
    setShowPopup(false);
    setShowActionModal(false);
  };

  
  const handleNextStep = () => {
    if (step < 3) setStep(step + 1);
    else editingEvent ? handleEditEvent() : handleAddEvent();
  };

  
  const handleEventClick = (clickInfo: any) => {
    setSelectedEvent(clickInfo.event);
    setShowActionModal(true);
  };


  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    setEvents((prevEvents) =>
      prevEvents.filter((ev: any) => ev.id.toString() !== selectedEvent.id.toString())
    );
    setShowActionModal(false);
  };

 
  const handleStartEdit = () => {
    if (!selectedEvent) return;
    setEditingEvent(selectedEvent);
    setNewEvent({
      title: selectedEvent.title,
      type: selectedEvent.extendedProps.type,
      time: selectedEvent.extendedProps.time,
      pacienteId: selectedEvent.extendedProps.pacienteId || ""
    });
    setStep(1);
    setShowActionModal(false);
    setShowPopup(true);
  };

 
  const renderEventContent = (eventInfo: any) => {
    const bg = eventInfo.event.backgroundColor || eventInfo.event.extendedProps?.color || "#4dabf7";

    return (
      <div
        className="flex items-center gap-1 text-xs p-1 rounded cursor-pointer"
        style={{
          backgroundColor: bg,
          color: "#fff",
          maxWidth: "100%",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}
        title={`${eventInfo.event.title} • ${eventInfo.event.extendedProps.type} • ${eventInfo.event.extendedProps.time}`}
      >
        <span className="truncate">{eventInfo.event.title}</span>
        <span>•</span>
        <span className="truncate">{eventInfo.event.extendedProps.type}</span>
        <span>•</span>
        <span>{eventInfo.event.extendedProps.time}</span>
      </div>
    );
  };

  
  const renderCalendarioSection = () => {
    const todayEvents = getTodayEvents();
    
    return (
      <section className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Agenda do Dia</h2>
        </div>
        
        {/* Navegação de Data */}
        <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-primary hover:text-primary-foreground cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-medium text-gray-900">
              {formatDate(currentCalendarDate)}
            </h3>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-primary hover:text-primary-foreground cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="ml-4 px-3 py-1 text-sm hover:bg-primary hover:text-primary-foreground cursor-pointer"
            >
              Hoje
            </Button>
          </div>
          <div className="text-sm text-gray-500">
            {todayEvents.length} consulta{todayEvents.length !== 1 ? 's' : ''} agendada{todayEvents.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Lista de Pacientes do Dia */}
        <div className="space-y-4">
          {todayEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg mb-2">Nenhuma consulta agendada para este dia</p>
              <p className="text-sm">Agenda livre para este dia</p>
            </div>
          ) : (
            todayEvents.map((appointment) => {
              const paciente = pacientes.find(p => p.nome === appointment.title);
              return (
                <div
                  key={appointment.id}
                  className="border-l-4 p-4 rounded-lg shadow-sm bg-white border-gray-200"
                  style={{ borderLeftColor: getStatusColor(appointment.type) }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: getStatusColor(appointment.type) }}
                      ></div>
                      <div>
                        <div className="font-medium flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-500" />
                          {appointment.title}
                        </div>
                        {paciente && (
                          <div className="text-sm text-gray-500">
                            CPF: {paciente.cpf} • {paciente.idade} anos
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="font-medium">{appointment.time}</span>
                    </div>
                    <div className="flex items-center">
                      <div 
                        className="px-3 py-1 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: getStatusColor(appointment.type) }}
                      >
                        {appointment.type}
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-2">
                      <div className="relative group">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-primary text-primary hover:bg-primary hover:text-white cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (paciente) {
                              handleAbrirProntuario(paciente);
                              setActiveSection('prontuario');
                            }
                          }}
                        >
                          <FolderOpen className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                          Ver informações do paciente
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    );
  };

  
  function PacientesSection({ handleAbrirProntuario, setActiveSection }) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Gerenciamento de Pacientes</h2>
        
        {/* Tabela de pacientes */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Lista de Pacientes</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead>Status do laudo</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pacientes.map((paciente) => (
                <TableRow key={paciente.cpf}>
                  <TableCell className="font-medium">{paciente.nome}</TableCell>
                  <TableCell>{paciente.cpf}</TableCell>
                  <TableCell>{paciente.idade}</TableCell>
                  <TableCell>{paciente.statusLaudo}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="relative group">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-primary text-primary hover:bg-primary hover:text-white cursor-pointer"
                          onClick={() => {
                            handleAbrirProntuario(paciente);
                            setActiveSection('prontuario');
                          }}
                        >
                          <FolderOpen className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                          Ver informações do paciente
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  
  const renderProntuarioSection = () => (
    <div className="space-y-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Prontuário do Paciente</h2>
        
        {/* Informações do Paciente Selecionado */}
        {pacienteSelecionado && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-primary">Dados do Paciente</h3>
              <div className="flex items-center gap-2">
                <Select
                  value={pacienteSelecionado.nome}
                  onValueChange={(value) => {
                    const paciente = pacientes.find(p => p.nome === value);
                    if (paciente) {
                      setPacienteSelecionado(paciente);
                    }
                  }}
                >
                  <SelectTrigger className="w-48 h-8 text-xs bg-white border-primary/30 cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((paciente) => (
                      <SelectItem key={paciente.cpf} value={paciente.nome} className="hover:bg-primary hover:text-primary-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{paciente.nome}</span>
                          <span className="text-xs opacity-70">({paciente.idade} anos)</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFecharProntuario}
                  className="text-primary hover:text-primary hover:bg-primary/10 h-6 w-6 p-0 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-primary">Nome:</span>
                <p className="text-primary/80">{pacienteSelecionado.nome}</p>
              </div>
              <div>
                <span className="font-medium text-primary">CPF:</span>
                <p className="text-primary/80">{pacienteSelecionado.cpf}</p>
              </div>
              <div>
                <span className="font-medium text-primary">Idade:</span>
                <p className="text-primary/80">{pacienteSelecionado.idade} anos</p>
              </div>
            </div>
          </div>
        )}

        {/* Seletor de Paciente */}
        {!pacienteSelecionado && (
          <div className="space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="text-center mb-6">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Selecionar Paciente</h3>
                <p className="text-sm text-gray-600">Escolha um paciente para visualizar o prontuário completo</p>
              </div>
              
              <div className="max-w-md mx-auto">
                <Label htmlFor="seletorPaciente" className="block text-sm font-medium text-gray-700 mb-2">
                  Escolha o paciente:
                </Label>
                <Select
                  onValueChange={(value) => {
                    const paciente = pacientes.find(p => p.nome === value);
                    if (paciente) {
                      setPacienteSelecionado(paciente);
                    }
                  }}
                >
                  <SelectTrigger id="seletorPaciente" className="w-full cursor-pointer">
                    <SelectValue placeholder="Selecione um paciente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((paciente) => (
                      <SelectItem key={paciente.cpf} value={paciente.nome} className="hover:bg-primary hover:text-primary-foreground cursor-pointer">
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex-1">
                            <p className="font-medium">{paciente.nome}</p>
                            <p className="text-xs opacity-70">CPF: {paciente.cpf} • {paciente.idade} anos</p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Cards de pacientes para seleção rápida */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ou selecione rapidamente:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pacientes.map((paciente) => (
                  <div
                    key={paciente.cpf}
                    onClick={() => setPacienteSelecionado(paciente)}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-primary transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{paciente.nome}</p>
                        <p className="text-sm text-gray-500">CPF: {paciente.cpf}</p>
                        <p className="text-sm text-gray-500">{paciente.idade} anos</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        paciente.statusLaudo === 'Finalizado' 
                          ? 'bg-green-100 text-green-800' 
                          : paciente.statusLaudo === 'Pendente'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {paciente.statusLaudo}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
                      >
                        <FolderOpen className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tabs de Navegação do Prontuário */}
        {pacienteSelecionado && (
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              {[
                { id: 'nova-consulta',nome: 'Nova Consulta', icone: Plus },
                { id: 'consultas', nome: 'Consultas', icone: Stethoscope },
                { id: 'historico', nome: 'Histórico Médico', icone: History },
                { id: 'prescricoes', nome: 'Prescrições', icone: Pill },
                { id: 'exames', nome: 'Exames', icone: FileText },
                { id: 'diagnosticos', nome: 'Diagnósticos', icone: ClipboardList },
                { id: 'evolucao', nome: 'Evolução', icone: Activity },
                { id: 'anexos', nome: 'Anexos', icone: Upload }
              ].map((aba) => {
                const Icone = aba.icone;
                return (
                  <button
                    key={aba.id}
                    onClick={() => setAbaProntuarioAtiva(aba.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer ${
                      abaProntuarioAtiva === aba.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icone className="h-4 w-4" />
                    {aba.nome}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Conteúdo das Abas */}
        {pacienteSelecionado && (
          <div className="min-h-[400px]">
            {abaProntuarioAtiva === 'nova-consulta' && renderNovaConsultaTab()}
            {abaProntuarioAtiva === 'consultas' && renderConsultasTab()}
            {abaProntuarioAtiva === 'historico' && renderHistoricoTab()}
            {abaProntuarioAtiva === 'prescricoes' && renderPrescricoesTab()}
            {abaProntuarioAtiva === 'exames' && renderExamesTab()}
            {abaProntuarioAtiva === 'diagnosticos' && renderDiagnosticosTab()}
            {abaProntuarioAtiva === 'evolucao' && renderEvolucaoTab()}
            {abaProntuarioAtiva === 'anexos' && renderAnexosTab()}
          </div>
        )}
      </div>
    </div>
  );

  // Função para alterar campos da consulta atual
  const handleConsultaChange = (field: string, value: string) => {
    setConsultaAtual(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Função para salvar a consulta
  const handleSalvarConsulta = () => {
    if (!consultaAtual.anamnese || !consultaAtual.exameFisico) {
      alert('Por favor, preencha os campos que são obrigatórios.');
      return;
    }

    const novaConsulta = {
      ...consultaAtual,
      id: Date.now(),
      paciente: pacienteSelecionado?.nome,
      dataCriacao: new Date().toLocaleString(),
      profissional: medico.nome
    };

    setConsultasRegistradas(prev => [novaConsulta, ...prev]);
    
    setConsultaAtual({
      dataConsulta: new Date().toISOString().split('T')[0],
      anamnese: "",
      exameFisico: "",
      hipotesesDiagnosticas: "",
      condutaMedica: "",
      prescricoes: "",
      retornoAgendado: "",
      cid10: ""
    });

    alert('Consulta registrada com sucesso!');
  };

  // Funções para renderizar cada aba do prontuário
  const renderNovaConsultaTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Registrar Nova Consulta</h3>
        <div className="flex gap-2">
          <Button className="cursor-pointer" variant="outline" onClick={() => {
            setConsultaAtual({
              dataConsulta: new Date().toISOString().split('T')[0],
              anamnese: "",
              exameFisico: "",
              hipotesesDiagnosticas: "",
              condutaMedica: "",
              prescricoes: "",
              retornoAgendado: "",
              cid10: ""
            });
          }}>
            Limpar Formulário
          </Button>
          <Button onClick={handleSalvarConsulta} className="flex items-center gap-2 cursor-pointer">
            <Plus className="h-4 w-4" />
            Salvar Consulta
          </Button>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6 space-y-6">
        {/* Data da Consulta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="dataConsulta" className="text-sm font-medium text-gray-700">
              Data da Consulta *
            </Label>
            <Input
              id="dataConsulta"
              type="date"
              value={consultaAtual.dataConsulta}
              onChange={(e) => handleConsultaChange('dataConsulta', e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cid10" className="text-sm font-medium text-gray-700">
              CID-10
            </Label>
            <Input
              id="cid10"
              value={consultaAtual.cid10}
              onChange={(e) => handleConsultaChange('cid10', e.target.value)}
              placeholder="Ex: I10, E11, etc."
              className="w-full"
            />
          </div>
        </div>

        {/* Anamnese */}
        <div className="space-y-2">
          <Label htmlFor="anamnese" className="text-sm font-medium text-gray-700">
            Anamnese *
          </Label>
          <Textarea
            id="anamnese"
            value={consultaAtual.anamnese}
            onChange={(e) => handleConsultaChange('anamnese', e.target.value)}
            placeholder="Descreva a história clínica do paciente, queixas principais, histórico da doença atual..."
            rows={4}
            className="w-full"
          />
        </div>

        {/* Exame Físico */}
        <div className="space-y-2">
          <Label htmlFor="exameFisico" className="text-sm font-medium text-gray-700">
            Exame Físico *
          </Label>
          <Textarea
            id="exameFisico"
            value={consultaAtual.exameFisico}
            onChange={(e) => handleConsultaChange('exameFisico', e.target.value)}
            placeholder="Descreva os achados do exame físico: sinais vitais, inspeção, palpação, ausculta, percussão..."
            rows={4}
            className="w-full"
          />
        </div>

        {/* Hipóteses Diagnósticas */}
        <div className="space-y-2">
          <Label htmlFor="hipotesesDiagnosticas" className="text-sm font-medium text-gray-700">
            Hipóteses Diagnósticas
          </Label>
          <Textarea
            id="hipotesesDiagnosticas"
            value={consultaAtual.hipotesesDiagnosticas}
            onChange={(e) => handleConsultaChange('hipotesesDiagnosticas', e.target.value)}
            placeholder="Liste as principais hipóteses diagnósticas em ordem de probabilidade..."
            rows={3}
            className="w-full"
          />
        </div>

        {/* Conduta Médica */}
        <div className="space-y-2">
          <Label htmlFor="condutaMedica" className="text-sm font-medium text-gray-700">
            Conduta Médica
          </Label>
          <Textarea
            id="condutaMedica"
            value={consultaAtual.condutaMedica}
            onChange={(e) => handleConsultaChange('condutaMedica', e.target.value)}
            placeholder="Descreva a conduta médica adotada, orientações gerais, solicitação de exames complementares..."
            rows={3}
            className="w-full"
          />
        </div>

        {/* Prescrições */}
        <div className="space-y-2">
          <Label htmlFor="prescricoes" className="text-sm font-medium text-gray-700">
            Prescrições
          </Label>
          <Textarea
            id="prescricoes"
            value={consultaAtual.prescricoes}
            onChange={(e) => handleConsultaChange('prescricoes', e.target.value)}
            placeholder="Liste as prescrições: medicamentos, dosagens, frequência, duração do tratamento..."
            rows={4}
            className="w-full"
          />
        </div>

        {/* Retorno Agendado */}
        <div className="space-y-2">
          <Label htmlFor="retornoAgendado" className="text-sm font-medium text-gray-700">
            Retorno Agendado
          </Label>
          <Input
            id="retornoAgendado"
            type="date"
            value={consultaAtual.retornoAgendado}
            onChange={(e) => handleConsultaChange('retornoAgendado', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Informações do Registro */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Paciente:</span>
              <p>{pacienteSelecionado?.nome}</p>
            </div>
            <div>
              <span className="font-medium">Profissional:</span>
              <p>{medico.nome}</p>
            </div>
            <div>
              <span className="font-medium">Data do Registro:</span>
              <p>{new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Consultas Anteriores do Paciente */}
      {consultasRegistradas.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-lg font-medium mb-4">Consultas Anteriores</h4>
          <div className="space-y-3">
            {consultasRegistradas
              .filter(consulta => consulta.paciente === pacienteSelecionado?.nome)
              .slice(0, 3)
              .map((consulta) => (
                <div key={consulta.id} className="border rounded-lg p-3 hover:shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-sm">
                        Consulta de {new Date(consulta.dataConsulta).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-xs text-gray-500">
                        Registrada em: {consulta.dataCriacao}
                      </p>
                    </div>
                    {consulta.cid10 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {consulta.cid10}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-700">
                    <p><strong>Anamnese:</strong> {consulta.anamnese.substring(0, 100)}...</p>
                    {consulta.hipotesesDiagnosticas && (
                      <p><strong>Diagnóstico:</strong> {consulta.hipotesesDiagnosticas.substring(0, 80)}...</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderConsultasTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Registro de Consultas</h3>
      </div>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-medium">Consulta Cardiológica</h4>
              <p className="text-sm text-gray-600">27/09/2025 - 09:00</p>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Finalizada</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Motivo:</span>
              <p>Dor no peito e falta de ar</p>
            </div>
            <div>
              <span className="font-medium">Duração:</span>
              <p>45 minutos</p>
            </div>
          </div>
          <div className="mt-3">
            <span className="font-medium">Observações:</span>
            <p className="text-sm mt-1">Paciente relatou melhora dos sintomas após início do tratamento. Pressão arterial controlada.</p>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-medium">Consulta Dermatológica</h4>
              <p className="text-sm text-gray-600">15/09/2025 - 14:30</p>
            </div>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Retorno Agendado</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Motivo:</span>
              <p>Avaliação de lesão cutânea</p>
            </div>
            <div>
              <span className="font-medium">Duração:</span>
              <p>30 minutos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistoricoTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Histórico Médico Completo</h3>
        <Button className="flex items-center gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          Adicionar Registro
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Condições Pré-existentes</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>Hipertensão arterial (diagnosticada em 2020)</li>
            <li>Diabetes tipo 2 (diagnosticada em 2018)</li>
            <li>Histórico familiar de doenças cardiovasculares</li>
          </ul>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Cirurgias Anteriores</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Apendicectomia</span>
              <span className="text-gray-600">15/03/2010</span>
            </div>
            <div className="flex justify-between">
              <span>Colecistectomia laparoscópica</span>
              <span className="text-gray-600">22/08/2019</span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Alergias e Reações Adversas</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Alergia</span>
              <span>Penicilina - reação cutânea</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Intolerância</span>
              <span>Lactose - sintomas gastrintestinais</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrescricoesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Prescrições Médicas</h3>
        <Button className="flex items-center gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          Nova Prescrição
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-medium">Prescrição Atual</h4>
              <p className="text-sm text-gray-600">Prescrita em 27/09/2025</p>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Ativa</span>
          </div>
          <div className="space-y-3">
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Losartana 50mg</p>
                  <p className="text-sm text-gray-600">1 comprimido pela manhã</p>
                  <p className="text-sm text-gray-500">Duração: 30 dias</p>
                </div>
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Metformina 850mg</p>
                  <p className="text-sm text-gray-600">1 comprimido após café e jantar</p>
                  <p className="text-sm text-gray-500">Duração: 60 dias</p>
                </div>
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-medium">Prescrições Anteriores</h4>
              <p className="text-sm text-gray-600">Histórico de medicamentos</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-2 border-b">
              <div>
                <p className="font-medium">Sinvastatina 20mg</p>
                <p className="text-gray-600">Prescrita em 15/08/2025 - Finalizada</p>
              </div>
              <Button variant="ghost" size="sm" className="cursor-pointer">
                <History className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderExamesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Exames Solicitados</h3>
        <Button className="flex items-center gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          Solicitar Exame
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-medium">Exames Pendentes</h4>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-yellow-50 border border-yellow-200 rounded">
              <div>
                <p className="font-medium">Ecocardiograma</p>
                <p className="text-sm text-gray-600">Solicitado em 25/09/2025</p>
                <p className="text-sm text-gray-500">Urgência: Normal</p>
              </div>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pendente</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded">
              <div>
                <p className="font-medium">Hemograma Completo</p>
                <p className="text-sm text-gray-600">Solicitado em 27/09/2025</p>
                <p className="text-sm text-gray-500">Urgência: Normal</p>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Agendado</span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-medium">Resultados Disponíveis</h4>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded">
              <div>
                <p className="font-medium">Glicemia de Jejum</p>
                <p className="text-sm text-gray-600">Realizado em 20/09/2025</p>
                <p className="text-sm font-medium text-green-700">Resultado: 95 mg/dL (Normal)</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDiagnosticosTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Diagnósticos</h3>
        <Button className="flex items-center gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          Novo Diagnóstico
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Diagnósticos Ativos</h4>
          <div className="space-y-3">
            <div className="border-l-4 border-red-500 pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Hipertensão Arterial Sistêmica</p>
                  <p className="text-sm text-gray-600">CID-10: I10</p>
                  <p className="text-sm text-gray-500">Diagnosticado em: 15/03/2020</p>
                  <p className="text-sm mt-1">Status: Controlada com medicação</p>
                </div>
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Ativo</span>
              </div>
            </div>
            
            <div className="border-l-4 border-orange-500 pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Diabetes Mellitus Tipo 2</p>
                  <p className="text-sm text-gray-600">CID-10: E11</p>
                  <p className="text-sm text-gray-500">Diagnosticado em: 10/08/2018</p>
                  <p className="text-sm mt-1">Status: Controlada com dieta e medicação</p>
                </div>
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Ativo</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Histórico de Diagnósticos</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-2 border-b">
              <div>
                <p className="font-medium">Gastrite Aguda</p>
                <p className="text-gray-600">CID-10: K29.0 - Resolvido em 2023</p>
              </div>
              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Resolvido</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEvolucaoTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Evolução do Quadro</h3>
        <Button className="flex items-center gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          Nova Evolução
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-medium">Evolução Recente</h4>
              <p className="text-sm text-gray-600">27/09/2025 - 09:15</p>
            </div>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Melhora</span>
          </div>
          <div className="space-y-2">
            <p className="text-sm"><strong>Subjetivo:</strong> Paciente relatou diminuição significativa da dor no peito e melhora da capacidade respiratória.</p>
            <p className="text-sm"><strong>Objetivo:</strong> PA: 130/80 mmHg, FC: 72 bpm, ausculta cardíaca sem alterações.</p>
            <p className="text-sm"><strong>Avaliação:</strong> Resposta positiva ao tratamento iniciado, pressão arterial em níveis aceitáveis.</p>
            <p className="text-sm"><strong>Plano:</strong> Manter medicação atual, retorno em 30 dias.</p>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-medium">Evolução Anterior</h4>
              <p className="text-sm text-gray-600">15/09/2025 - 14:45</p>
            </div>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Estável</span>
          </div>
          <div className="space-y-2">
            <p className="text-sm"><strong>Subjetivo:</strong> Paciente apresentou episódios esporádicos de dor torácica leve.</p>
            <p className="text-sm"><strong>Objetivo:</strong> Exame físico sem alterações significativas.</p>
            <p className="text-sm"><strong>Plano:</strong> Ajuste da medicação e solicitação de exames complementares.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnexosTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Anexos (Exames, Imagens)</h3>
        <Button className="flex items-center gap-2 cursor-pointer">
          <Upload className="h-4 w-4" />
          Adicionar Anexo
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Exames de Imagem</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-3 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Radiografia de Tórax</p>
                  <p className="text-xs text-gray-600">20/09/2025</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 cursor-pointer">
                  <Eye className="h-3 w-3 mr-1" />
                  Visualizar
                </Button>
                <Button variant="outline" size="sm" className="flex-1 cursor-pointer">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>

            <div className="border rounded-lg p-3 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">ECG</p>
                  <p className="text-xs text-gray-600">15/09/2025</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 cursor-pointer">
                  <Eye className="h-3 w-3 mr-1" />
                  Visualizar
                </Button>
                <Button variant="outline" size="sm" className="flex-1 cursor-pointer">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Laudos e Documentos</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Laudo de Ecocardiograma</p>
                  <p className="text-xs text-gray-600">10/08/2025 - Dr. Carlos Andrade</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <Eye className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <FileText className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Relatório de Consulta Especializada</p>
                  <p className="text-xs text-gray-600">05/09/2025 - Cardiologia</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <Eye className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLaudosSection = () => {
    if (modoEdicao) {
      return renderEditorLaudo();
    }
    
    return (
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Laudos</h2>
            <p className="text-gray-600 text-sm mt-1">
              Nesta seção você pode gerenciar todos os laudos gerados através da integração.
            </p>
          </div>
          <Button 
            onClick={() => {
              // Limpar dados ao criar novo laudo
              setEditorLaudo({
                pacienteId: "",
                pacienteNome: "",
                pacienteCpf: "",
                pacienteIdade: "",
                cid: "",
                diagnostico: "",
                conclusao: "",
                conteudo: "",
                imagens: [] as string[],
                pdfAnexos: [] as string[],
                incluirData: true,
                incluirAssinatura: true,
                status: "Rascunho"
              });
              setLaudoAtivo(null);
              setModoEdicao('novo');
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buscar">Buscar paciente/código</Label>
              <Input
                id="buscar"
                placeholder="Digite para buscar..."
                value={buscarTexto}
                onChange={(e) => setBuscarTexto(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Rascunho">Rascunho</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Entregue">Entregue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="cursor-pointer">
              Hoje
            </Button>
            <Button variant="outline" size="sm" className="cursor-pointer">
              Semana
            </Button>
            <Button variant="outline" size="sm" className="cursor-pointer">
              Mês
            </Button>
            <Button variant="outline" size="sm" className="cursor-pointer">
              <Download className="h-4 w-4 mr-1" />
              Filtrar
            </Button>
          </div>
        </div>

        {/* Tabela de Laudos */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Pedido</TableHead>
                <TableHead className="font-semibold">Data</TableHead>
                <TableHead className="font-semibold">Preço</TableHead>
                <TableHead className="font-semibold">Paciente</TableHead>
                <TableHead className="font-semibold">Executante/Solicitante</TableHead>
                <TableHead className="font-semibold">Exame/Classificação</TableHead>
                <TableHead className="font-semibold">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {laudosData.map((laudo) => (
                <TableRow key={laudo.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{laudo.id}</TableCell>
                  <TableCell>{laudo.data}</TableCell>
                  <TableCell>{laudo.preco}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          laudo.status === 'Pendente' ? 'bg-red-500' : 
                          laudo.status === 'Rascunho' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                      />
                      <span className="truncate max-w-[200px]">{laudo.recipient}</span>
                    </div>
                  </TableCell>
                  <TableCell className="truncate max-w-[200px]">{laudo.execSolicitante}</TableCell>
                  <TableCell className="truncate max-w-[200px]">{laudo.exameTipo}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setLaudoAtivo(laudo);
                                // Buscar dados do paciente pelo nome no laudo
                                const pacienteEncontrado = pacientes.find(p => p.nome === laudo.recipient);
                                if (pacienteEncontrado) {
                                  // Carregar TODOS os dados do laudo para edição
                                  setEditorLaudo({
                                    pacienteId: pacienteEncontrado.cpf,
                                    pacienteNome: pacienteEncontrado.nome,
                                    pacienteCpf: pacienteEncontrado.cpf,
                                    pacienteIdade: pacienteEncontrado.idade.toString(),
                                    cid: laudo.cid || "",
                                    diagnostico: laudo.diagnostico || "",
                                    conclusao: laudo.conclusao || "",
                                    conteudo: laudo.conteudo || "",
                                    imagens: [],
                                    pdfAnexos: [],
                                    incluirData: true,
                                    incluirAssinatura: true,
                                    status: laudo.status || "Rascunho"
                                  });
                                }
                                setModoEdicao('editar');
                              }}
                              className="cursor-pointer"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Editar laudo</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="cursor-pointer"
                              onClick={() => setLaudoVisualizacao(laudo)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Visualizar laudo</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="cursor-pointer">
                              <Download className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Download PDF</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const renderEditorLaudo = () => {
    return (
      <div className="space-y-6">
        {/* Cabeçalho do Editor */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => setModoEdicao(null)}
              className="cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            <div>
              <h2 className="text-2xl font-bold">
                {modoEdicao === 'novo' ? 'Novo Laudo' : 'Editar Laudo'}
              </h2>
              <p className="text-gray-600 text-sm">
                Este editor permite escrever relatórios de forma livre, com formatação de texto rica.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setModoEdicao(null)}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setEditorLaudo(prev => ({ ...prev, status: "Rascunho" }));
                alert("Laudo salvo como rascunho!");
              }}
              className="cursor-pointer"
            >
              Salvar Rascunho
            </Button>
            <Button 
              onClick={() => {
                setEditorLaudo(prev => ({ ...prev, status: "Entregue" }));
                alert("Laudo liberado com sucesso!");
                setModoEdicao(null);
              }}
              className="cursor-pointer"
            >
              Liberar Laudo
            </Button>
          </div>
        </div>

        {/* Tabs do Editor */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'editor', nome: 'Editor', icone: FileText },
                { id: 'imagens', nome: 'Imagens', icone: Upload },
                { id: 'anexos', nome: 'Anexos PDF', icone: FileText },
                { id: 'preview', nome: 'Pré-visualização', icone: Eye }
              ].map((aba) => {
                const Icone = aba.icone;
                return (
                  <button
                    key={aba.id}
                    onClick={() => setAbaAtiva(aba.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer ${
                      abaAtiva === aba.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icone className="h-4 w-4" />
                    {aba.nome}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {abaAtiva === 'editor' && renderAbaEditor()}
            {abaAtiva === 'imagens' && renderAbaImagens()}
            {abaAtiva === 'anexos' && renderAbaAnexos()}
            {abaAtiva === 'preview' && renderAbaPreview()}
          </div>
        </div>
      </div>
    );
  };

  const renderAbaEditor = () => (
    <div className="space-y-6">
      {/* Seleção de Paciente */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="paciente">Paciente *</Label>
          {modoEdicao === 'editar' ? (
            // Modo edição: mostrar dados fixos do paciente
            <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-50">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <div className="font-medium">{editorLaudo.pacienteNome || laudoAtivo?.recipient}</div>
                <div className="text-sm text-gray-500">{editorLaudo.pacienteCpf}</div>
              </div>
            </div>
          ) : (
            // Modo novo: mostrar select de pacientes
            <Select 
              value={editorLaudo.pacienteId}
              onValueChange={(value) => {
                const pacienteSelecionado = pacientes.find(p => p.cpf === value);
                if (pacienteSelecionado) {
                  setEditorLaudo(prev => ({
                    ...prev,
                    pacienteId: value,
                    pacienteNome: pacienteSelecionado.nome,
                    pacienteCpf: pacienteSelecionado.cpf,
                    pacienteIdade: pacienteSelecionado.idade.toString()
                  }));
                }
              }}
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder="Selecione o paciente" />
              </SelectTrigger>
              <SelectContent>
                {pacientes.map((paciente) => (
                  <SelectItem key={paciente.cpf} value={paciente.cpf}>
                    {paciente.nome} - {paciente.cpf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="cid">CID *</Label>
          <Input
            id="cid"
            placeholder="Ex: I10, E11, etc."
            value={editorLaudo.cid}
            onChange={(e) => setEditorLaudo(prev => ({ ...prev, cid: e.target.value }))}
          />
        </div>
      </div>

      {/* Campos Principais do Laudo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="diagnostico">Diagnóstico *</Label>
          <Textarea
            id="diagnostico"
            placeholder="Insira o diagnóstico..."
            value={editorLaudo.diagnostico}
            onChange={(e) => setEditorLaudo(prev => ({ ...prev, diagnostico: e.target.value }))}
            rows={4}
            className="resize-none"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="conclusao">Conclusão *</Label>
          <Textarea
            id="conclusao"
            placeholder="Insira a conclusão..."
            value={editorLaudo.conclusao}
            onChange={(e) => setEditorLaudo(prev => ({ ...prev, conclusao: e.target.value }))}
            rows={4}
            className="resize-none"
          />
        </div>
      </div>

      {/* Modelos e Frases */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm">Modelos e Frases</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(modelosTexto).map(([nome, texto]) => (
            <Button
              key={nome}
              variant="outline"
              size="sm"
              onClick={() => {
                setEditorLaudo(prev => ({
                  ...prev,
                  conteudo: prev.conteudo + (prev.conteudo ? '\n\n' : '') + texto
                }));
              }}
              className="text-left justify-start cursor-pointer"
            >
              {nome}
            </Button>
          ))}
        </div>
      </div>

      {/* Editor de Texto Rico */}
      <div className="space-y-2">
        <Label>Conteúdo do Laudo *</Label>
        <QuillEditor
          value={editorLaudo.conteudo}
          onChange={(content: string) => setEditorLaudo(prev => ({ ...prev, conteudo: content }))}
        />
      </div>



      {/* Assinatura Digital */}
      <div className="space-y-4">
        <h4 className="font-semibold">Assinatura Digital</h4>
        <div className="border rounded-lg p-4 bg-gray-50">
          <SignaturePad
            canvasRef={sigCanvasLaudoRef}
            onEnd={() => {
              if (!sigCanvasLaudoRef.current?.isEmpty()) {
                setAssinaturaLaudo(sigCanvasLaudoRef.current?.toDataURL());
              }
            }}
          />
          <div className="flex gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                sigCanvasLaudoRef.current?.clear();
                setAssinaturaLaudo(null);
              }}
              className="cursor-pointer"
            >
              Limpar
            </Button>
          </div>
        </div>
      </div>

      {/* Opções Finais */}
      <div className="space-y-4">
        <h4 className="font-semibold">Opções do Laudo</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="incluirData"
              checked={editorLaudo.incluirData}
              onChange={(e) => setEditorLaudo(prev => ({ ...prev, incluirData: e.target.checked }))}
            />
            <Label htmlFor="incluirData">Incluir data no laudo</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="incluirAssinatura"
              checked={editorLaudo.incluirAssinatura}
              onChange={(e) => setEditorLaudo(prev => ({ ...prev, incluirAssinatura: e.target.checked }))}
            />
            <Label htmlFor="incluirAssinatura">Incluir assinatura no laudo</Label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAbaImagens = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Imagens do Laudo</h3>
        <Button className="cursor-pointer">
          <Upload className="h-4 w-4 mr-2" />
          Upload Imagem
        </Button>
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 mb-2">Arraste imagens aqui ou clique para selecionar</p>
        <p className="text-sm text-gray-500">Formatos aceitos: JPG, PNG, DICOM (máx. 10MB por arquivo)</p>
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            // Lógica para upload de imagens
            console.log("Imagens selecionadas:", e.target.files);
          }}
        />
      </div>
      
      {editorLaudo.imagens.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {editorLaudo.imagens.map((img, index) => (
            <div key={index} className="relative border rounded-lg p-2">
              <img src={img} alt={`Imagem ${index + 1}`} className="w-full h-24 object-cover rounded" />
              <Button
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-8 w-8 cursor-pointer"
                onClick={() => {
                  setEditorLaudo(prev => ({
                    ...prev,
                    imagens: prev.imagens.filter((_, i) => i !== index)
                  }));
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAbaAnexos = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Anexos PDF</h3>
        <Button className="cursor-pointer">
          <Upload className="h-4 w-4 mr-2" />
          Importar PDF
        </Button>
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 mb-2">Arraste PDFs aqui ou clique para selecionar</p>
        <p className="text-sm text-gray-500">Anexar resultados de exames externos (máx. 25MB por arquivo)</p>
      </div>
      
      {editorLaudo.pdfAnexos.length > 0 && (
        <div className="space-y-3">
          {editorLaudo.pdfAnexos.map((pdf, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-red-500" />
                <div>
                  <p className="font-medium">Documento_{index + 1}.pdf</p>
                  <p className="text-sm text-gray-500">2.4 MB</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    setEditorLaudo(prev => ({
                      ...prev,
                      pdfAnexos: prev.pdfAnexos.filter((_, i) => i !== index)
                    }));
                  }}
                  className="cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAbaPreview = () => {
    const pacienteSelecionado = pacientes.find(p => p.cpf === editorLaudo.pacienteId);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Pré-visualização do Laudo</h3>
          <Button className="cursor-pointer">
            <Download className="h-4 w-4 mr-2" />
            Gerar PDF
          </Button>
        </div>
        
        <div className="border rounded-lg p-8 bg-white shadow-sm max-w-4xl mx-auto">
          {/* Cabeçalho do Laudo */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">LAUDO MÉDICO</h1>
            {editorLaudo.incluirData && (
              <p className="text-gray-600">Data: {new Date().toLocaleDateString('pt-BR')}</p>
            )}
          </div>
          
          {/* Dados do Paciente */}
          {pacienteSelecionado && (
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded">
              <div>
                <strong>Paciente:</strong> {pacienteSelecionado.nome}
              </div>
              <div>
                <strong>CPF:</strong> {pacienteSelecionado.cpf}
              </div>
              <div>
                <strong>Idade:</strong> {pacienteSelecionado.idade} anos
              </div>
              {editorLaudo.cid && (
                <div>
                  <strong>CID:</strong> {editorLaudo.cid}
                </div>
              )}
            </div>
          )}
          
          {/* Conteúdo */}
          <div className="mb-6">
            {editorLaudo.conteudo ? (
              <div 
                className="prose max-w-none leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: formatTextToHtml(
                    editorLaudo.conteudo
                      .replace(/{NOME_PACIENTE}/g, pacienteSelecionado?.nome || '')
                      .replace(/{IDADE}/g, pacienteSelecionado?.idade?.toString() || '')
                      .replace(/{CPF}/g, pacienteSelecionado?.cpf || '')
                      .replace(/{DATA_ATUAL}/g, new Date().toLocaleDateString('pt-BR'))
                      .replace(/{CID}/g, editorLaudo.cid)
                      .replace(/{MEDICO}/g, medico.nome)
                  )
                }} 
              />
            ) : (
              <div className="text-gray-400 italic text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum conteúdo adicionado ainda.</p>
                <p className="text-sm">Vá para a aba "Editor" para escrever o laudo.</p>
              </div>
            )}
          </div>
          
          {/* Diagnóstico */}
          {editorLaudo.diagnostico && (
            <div className="mb-6">
              <h4 className="font-bold mb-2">DIAGNÓSTICO:</h4>
              <p>{editorLaudo.diagnostico}</p>
            </div>
          )}
          
          {/* Conclusão */}
          {editorLaudo.conclusao && (
            <div className="mb-6">
              <h4 className="font-bold mb-2">CONCLUSÃO:</h4>
              <p>{editorLaudo.conclusao}</p>
            </div>
          )}
          
          {/* Imagens */}
          {editorLaudo.imagens.length > 0 && (
            <div className="mb-6">
              <h4 className="font-bold mb-4">IMAGENS:</h4>
              <div className="grid grid-cols-2 gap-4">
                {editorLaudo.imagens.map((img, index) => (
                  <img key={index} src={img} alt={`Imagem ${index + 1}`} className="w-full border rounded" />
                ))}
              </div>
            </div>
          )}
          
          {/* Assinatura */}
          {editorLaudo.incluirAssinatura && assinaturaLaudo && (
            <div className="mt-8 text-center">
              <div className="border-t pt-4">
                <img src={assinaturaLaudo} alt="Assinatura" className="mx-auto mb-2" style={{ maxHeight: '80px' }} />
                <p className="font-semibold">{medico.nome}</p>
                <p className="text-sm text-gray-600">{medico.identificacao}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  
  const renderComunicacaoSection = () => (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Comunicação com o Paciente</h2>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="destinatario">Destinatário</Label>
            <Input 
              id="destinatario" 
              placeholder="Nome do Paciente ou CPF" 
              disabled 
              className="bg-muted cursor-not-allowed text-gray-700 disabled:text-gray-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipoMensagem">Tipo de mensagem</Label>
            <Select>
              <SelectTrigger id="tipoMensagem" className="hover:border-primary focus:border-primary cursor-pointer">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200">
                <SelectItem value="lembrete" className="hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground cursor-pointer">Lembrete de Consulta</SelectItem>
                <SelectItem value="resultado" className="hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground cursor-pointer">Resultado de Exame</SelectItem>
                <SelectItem value="instrucao" className="hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground cursor-pointer">Instruções Pós-Consulta</SelectItem>
                <SelectItem value="outro" className="hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground cursor-pointer">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="dataEnvio">Data de envio</Label>
            <p id="dataEnvio" className="text-sm text-muted-foreground">03/09/2025</p>
          </div>
          <div>
            <Label htmlFor="statusEntrega">Status da entrega</Label>
            <p id="statusEntrega" className="text-sm text-muted-foreground">Pendente</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Resposta do paciente</Label>
          <div className="border rounded-md p-3 bg-muted/40 space-y-2">
            <p className="text-sm">"Ok, obrigado pelo lembrete!"</p>
            <p className="text-xs text-muted-foreground">03/09/2025 14:30</p>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={handleSave}>Registrar Comunicação</Button>
        </div>
      </div>
    </div>
  );

  // Função para renderizar a seção de relatórios médicos
  const renderRelatoriosMedicosSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Relatórios Médicos</h2>
        {editandoRelatorio && (
          <Button variant="outline" onClick={handleCancelarEdicaoRelatorio}>
            Cancelar Edição
          </Button>
        )}
      </div>

      {/* Formulário de Relatório Médico */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">
          {editandoRelatorio ? 'Editar Relatório Médico' : 'Novo Relatório Médico'}
        </h3>
        
        <div className="grid gap-6">
          {/* Identificação do Profissional */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-primary border-b pb-2">Identificação do Profissional</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profissionalNome">Nome do Profissional</Label>
                <Input
                  id="profissionalNome"
                  value={relatorioMedico.profissionalNome}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profissionalCrm">CRM e Especialidade</Label>
                <Input
                  id="profissionalCrm"
                  value={relatorioMedico.profissionalCrm}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Identificação do Paciente */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-primary border-b pb-2">Identificação do Paciente</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pacienteNome">Nome do Paciente *</Label>
                <Select
                  value={relatorioMedico.pacienteNome}
                  onValueChange={(value) => {
                    const pacienteSelecionado = pacientes.find(p => p.nome === value);
                    handleRelatorioChange('pacienteNome', value);
                    if (pacienteSelecionado) {
                      handleRelatorioChange('pacienteCpf', pacienteSelecionado.cpf);
                      handleRelatorioChange('pacienteIdade', pacienteSelecionado.idade.toString());
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((paciente) => (
                      <SelectItem key={paciente.cpf} value={paciente.nome}>
                        {paciente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pacienteCpf">CPF do Paciente</Label>
                <Input
                  id="pacienteCpf"
                  value={relatorioMedico.pacienteCpf}
                  onChange={(e) => handleRelatorioChange('pacienteCpf', e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pacienteIdade">Idade</Label>
                <Input
                  id="pacienteIdade"
                  type="number"
                  value={relatorioMedico.pacienteIdade}
                  onChange={(e) => handleRelatorioChange('pacienteIdade', e.target.value)}
                  placeholder="Idade do paciente"
                />
              </div>
            </div>
          </div>

          {/* Informações do Relatório */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-primary border-b pb-2">Informações do Relatório</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="motivoRelatorio">Motivo do Relatório *</Label>
                <Textarea
                  id="motivoRelatorio"
                  value={relatorioMedico.motivoRelatorio}
                  onChange={(e) => handleRelatorioChange('motivoRelatorio', e.target.value)}
                  placeholder="Descreva o motivo para a elaboração deste relatório médico..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataRelatorio">Data do Relatório</Label>
                <Input
                  id="dataRelatorio"
                  type="date"
                  value={relatorioMedico.dataRelatorio}
                  onChange={(e) => handleRelatorioChange('dataRelatorio', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="historicoClinico">Histórico Clínico Conciso</Label>
              <Textarea
                id="historicoClinico"
                value={relatorioMedico.historicoClinico}
                onChange={(e) => handleRelatorioChange('historicoClinico', e.target.value)}
                placeholder="Resumo do histórico clínico relevante do paciente..."
                rows={4}
              />
            </div>
          </div>

          {/* Sinais, Sintomas e Exames */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-primary border-b pb-2">Sinais, Sintomas e Exames</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sinaisSintomas">Sinais e Sintomas</Label>
                <Textarea
                  id="sinaisSintomas"
                  value={relatorioMedico.sinaisSintomas}
                  onChange={(e) => handleRelatorioChange('sinaisSintomas', e.target.value)}
                  placeholder="Descreva os sinais e sintomas observados..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="examesRealizados">Exames Realizados</Label>
                <Textarea
                  id="examesRealizados"
                  value={relatorioMedico.examesRealizados}
                  onChange={(e) => handleRelatorioChange('examesRealizados', e.target.value)}
                  placeholder="Liste os exames realizados..."
                  rows={4}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="resultadosExames">Resultados Relevantes dos Exames</Label>
              <Textarea
                id="resultadosExames"
                value={relatorioMedico.resultadosExames}
                onChange={(e) => handleRelatorioChange('resultadosExames', e.target.value)}
                placeholder="Descreva os resultados mais relevantes dos exames..."
                rows={3}
              />
            </div>
          </div>

          {/* Diagnósticos e Prognóstico */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-primary border-b pb-2">Diagnósticos e Prognóstico</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="diagnosticos">Diagnóstico(s)</Label>
                <Textarea
                  id="diagnosticos"
                  value={relatorioMedico.diagnosticos}
                  onChange={(e) => handleRelatorioChange('diagnosticos', e.target.value)}
                  placeholder="Informe o(s) diagnóstico(s) estabelecido(s)..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prognostico">Prognóstico (quando cabível)</Label>
                <Textarea
                  id="prognostico"
                  value={relatorioMedico.prognostico}
                  onChange={(e) => handleRelatorioChange('prognostico', e.target.value)}
                  placeholder="Descreva o prognóstico, se aplicável..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Tratamentos e Recomendações */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-primary border-b pb-2">Tratamentos e Recomendações</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tratamentosRealizados">Tratamentos já Realizados</Label>
                <Textarea
                  id="tratamentosRealizados"
                  value={relatorioMedico.tratamentosRealizados}
                  onChange={(e) => handleRelatorioChange('tratamentosRealizados', e.target.value)}
                  placeholder="Descreva os tratamentos já realizados..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recomendacoes">Recomendações Objetivas</Label>
                <Textarea
                  id="recomendacoes"
                  value={relatorioMedico.recomendacoes}
                  onChange={(e) => handleRelatorioChange('recomendacoes', e.target.value)}
                  placeholder="Informe as recomendações objetivas..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={handleCancelarEdicaoRelatorio}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarRelatorio} className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              {editandoRelatorio ? 'Atualizar Relatório' : 'Salvar Relatório'}
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de Relatórios Existentes */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Relatórios Médicos Salvos</h3>
        
        {relatoriosMedicos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg mb-2">Nenhum relatório médico encontrado</p>
            <p className="text-sm">Os relatórios salvos aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-4">
            {relatoriosMedicos.map((relatorio) => (
              <div key={relatorio.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{relatorio.pacienteNome}</h4>
                    <p className="text-sm text-gray-600">CPF: {relatorio.pacienteCpf} • Idade: {relatorio.pacienteIdade} anos</p>
                    <p className="text-sm text-gray-500">Data do relatório: {new Date(relatorio.dataRelatorio).toLocaleDateString('pt-BR')}</p>
                    <p className="text-xs text-gray-400">Gerado em: {relatorio.dataGeracao}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditarRelatorio(relatorio)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleExcluirRelatorio(relatorio.id)}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Excluir
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-primary">Motivo:</span>
                    <p className="text-gray-700 mt-1">{relatorio.motivoRelatorio}</p>
                  </div>
                  
                  {relatorio.diagnosticos && (
                    <div>
                      <span className="font-medium text-primary">Diagnóstico(s):</span>
                      <p className="text-gray-700 mt-1">{relatorio.diagnosticos}</p>
                    </div>
                  )}
                  
                  {relatorio.recomendacoes && (
                    <div className="md:col-span-2">
                      <span className="font-medium text-primary">Recomendações:</span>
                      <p className="text-gray-700 mt-1">{relatorio.recomendacoes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
  
  const renderPerfilSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Meu Perfil</h2>
        {!isEditingProfile ? (
          <Button onClick={() => setIsEditingProfile(true)} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Editar Perfil
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSaveProfile} className="flex items-center gap-2">
              Salvar
            </Button>
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancelar
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Pessoais */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Informações Pessoais</h3>
          
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <p className="p-2 bg-gray-100 rounded text-gray-600">{profileData.nome}</p>
            <span className="text-xs text-gray-500">Este campo não pode ser alterado</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            {isEditingProfile ? (
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => handleProfileChange('email', e.target.value)}
              />
            ) : (
              <p className="p-2 bg-gray-50 rounded">{profileData.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            {isEditingProfile ? (
              <Input
                id="telefone"
                value={profileData.telefone}
                onChange={(e) => handleProfileChange('telefone', e.target.value)}
              />
            ) : (
              <p className="p-2 bg-gray-50 rounded">{profileData.telefone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="crm">CRM</Label>
            <p className="p-2 bg-gray-100 rounded text-gray-600">{profileData.crm}</p>
            <span className="text-xs text-gray-500">Este campo não pode ser alterado</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="especialidade">Especialidade</Label>
            {isEditingProfile ? (
              <Input
                id="especialidade"
                value={profileData.especialidade}
                onChange={(e) => handleProfileChange('especialidade', e.target.value)}
              />
            ) : (
              <p className="p-2 bg-gray-50 rounded">{profileData.especialidade}</p>
            )}
          </div>
        </div>

        {/* Endereço e Contato */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Endereço e Contato</h3>
          
          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            {isEditingProfile ? (
              <Input
                id="endereco"
                value={profileData.endereco}
                onChange={(e) => handleProfileChange('endereco', e.target.value)}
              />
            ) : (
              <p className="p-2 bg-gray-50 rounded">{profileData.endereco}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade</Label>
            {isEditingProfile ? (
              <Input
                id="cidade"
                value={profileData.cidade}
                onChange={(e) => handleProfileChange('cidade', e.target.value)}
              />
            ) : (
              <p className="p-2 bg-gray-50 rounded">{profileData.cidade}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            {isEditingProfile ? (
              <Input
                id="cep"
                value={profileData.cep}
                onChange={(e) => handleProfileChange('cep', e.target.value)}
              />
            ) : (
              <p className="p-2 bg-gray-50 rounded">{profileData.cep}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="biografia">Biografia</Label>
            {isEditingProfile ? (
              <Textarea
                id="biografia"
                value={profileData.biografia}
                onChange={(e) => handleProfileChange('biografia', e.target.value)}
                rows={4}
                placeholder="Descreva sua experiência profissional..."
              />
            ) : (
              <p className="p-2 bg-gray-50 rounded min-h-[100px]">{profileData.biografia}</p>
            )}
          </div>
        </div>
      </div>

      {/* Foto do Perfil */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Foto do Perfil</h3>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-lg">
              {profileData.nome.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isEditingProfile && (
            <div className="space-y-2">
              <Button variant="outline" size="sm">
                Alterar Foto
              </Button>
              <p className="text-xs text-gray-500">
                Formatos aceitos: JPG, PNG (máx. 2MB)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'calendario':
        return renderCalendarioSection();
      case 'pacientes':
  return <PacientesSection handleAbrirProntuario={handleAbrirProntuario} setActiveSection={setActiveSection} />;
      case 'prontuario':
        return renderProntuarioSection();
      case 'laudos':
        return renderLaudosSection();
      case 'comunicacao':
        return renderComunicacaoSection();
      case 'relatorios-medicos':
        return renderRelatoriosMedicosSection();
      case 'perfil':
        return renderPerfilSection();
      default:
        return renderCalendarioSection();
    }
  };

  return (
    <ProtectedRoute requiredUserType={["profissional"]}>
      <div className="container mx-auto px-4 py-8">
        <header className="bg-white shadow-md rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={medico.fotoUrl} alt={medico.nome} />
              <AvatarFallback className="bg-muted">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground truncate">Conta do profissional</p>
              <h2 className="text-lg font-semibold leading-none truncate">{medico.nome}</h2>
              <p className="text-sm text-muted-foreground truncate">{medico.identificacao}</p>
              {user?.email && (
                <p className="text-xs text-muted-foreground truncate">Logado como: {user.email}</p>
              )}
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={logout}
            className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white cursor-pointer"
          >
            Sair
          </Button>
        </header>
      
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        {}
        <aside className="md:sticky md:top-8 h-fit">
          <nav className="bg-white shadow-md rounded-lg p-3 space-y-1">
            <Button 
              variant={activeSection === 'calendario' ? 'default' : 'ghost'} 
              className="w-full justify-start hover:bg-primary hover:text-primary-foreground cursor-pointer"
              onClick={() => setActiveSection('calendario')}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              Calendário
            </Button>
            <Button 
              variant={activeSection === 'pacientes' ? 'default' : 'ghost'} 
              className="w-full justify-start hover:bg-primary hover:text-primary-foreground cursor-pointer"
              onClick={() => setActiveSection('pacientes')}
            >
              <Users className="mr-2 h-4 w-4" />
              Pacientes
            </Button>
            <Button 
              variant={activeSection === 'prontuario' ? 'default' : 'ghost'} 
              className="w-full justify-start hover:bg-primary hover:text-primary-foreground cursor-pointer"
              onClick={() => setActiveSection('prontuario')}
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              Prontuário
            </Button>
            <Button 
              variant={activeSection === 'laudos' ? 'default' : 'ghost'} 
              className="w-full justify-start hover:bg-primary hover:text-primary-foreground cursor-pointer"
              onClick={() => setActiveSection('laudos')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Laudos
            </Button>
            <Button 
              variant={activeSection === 'comunicacao' ? 'default' : 'ghost'} 
              className="w-full justify-start hover:bg-primary hover:text-primary-foreground cursor-pointer"
              onClick={() => setActiveSection('comunicacao')}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Comunicação
            </Button>
            <Button 
              variant={activeSection === 'relatorios-medicos' ? 'default' : 'ghost'} 
              className="w-full justify-start hover:bg-primary hover:text-primary-foreground cursor-pointer"
              onClick={() => setActiveSection('relatorios-medicos')}
            >
              <FileCheck className="mr-2 h-4 w-4" />
              Relatórios Médicos
            </Button>
            <Button 
              variant={activeSection === 'perfil' ? 'default' : 'ghost'} 
              className="w-full justify-start cursor-pointer hover:bg-primary hover:text-primary-foreground cursor-pointer"
              onClick={() => setActiveSection('perfil')}
            >
              <Settings className="mr-2 h-4 w-4" />
              Meu Perfil
            </Button>
          </nav>
        </aside>

        <main>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Área do Profissional de Saúde</h1>
            <Button asChild>
              <Link href="/">Início</Link>
            </Button>
            
          </div>
          <p className="mb-8">Bem-vindo à sua área exclusiva.</p>

          {renderActiveSection()}
        </main>
      </div>

      {}
      {showPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">

          <div className="bg-white p-6 rounded-lg w-96 border border-black">

            {step === 1 && (
              <>
                <h3 className="text-lg font-semibold mb-2">Selecionar Paciente</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Data: {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não selecionada'}
                </p>
                <Select
                  value={newEvent.title}
                  onValueChange={(value) => setNewEvent({ ...newEvent, title: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((paciente) => (
                      <SelectItem key={paciente.cpf} value={paciente.nome}>
                        {paciente.nome} - {paciente.cpf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => setShowPopup(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    disabled={!newEvent.title}
                    className="flex-1"
                  >
                    Próximo
                  </Button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h3 className="text-lg font-semibold mb-4">Tipo da Consulta</h3>
                <Select
                  value={newEvent.type}
                  onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(colorsByType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    disabled={!newEvent.type}
                    className="flex-1"
                  >
                    Próximo
                  </Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h3 className="text-lg font-semibold mb-4">Horário da Consulta</h3>
                <Input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  className="mb-4"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => setStep(2)}
                    variant="outline"
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    disabled={!newEvent.time}
                    className="flex-1"
                  >
                    {editingEvent ? "Salvar" : "Agendar"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {}
      {showActionModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-2">
              Consulta de {selectedEvent.title}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {selectedEvent.extendedProps.type} às {selectedEvent.extendedProps.time}
            </p>

            <div className="flex gap-2">
              <Button
                onClick={handleStartEdit}
                className="flex-1 flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
              <Button
                onClick={handleDeleteEvent}
                variant="destructive"
                className="flex-1 flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            </div>

            <Button
              onClick={() => setShowActionModal(false)}
              variant="outline"
              className="w-full mt-2"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Visualização do Laudo */}
      <Dialog open={!!laudoVisualizacao} onOpenChange={() => setLaudoVisualizacao(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {laudoVisualizacao?.exameTipo || "Laudo Médico"}
            </DialogTitle>
          </DialogHeader>
          
          {laudoVisualizacao && (
            <div className="space-y-6">
              {/* Cabeçalho do Laudo */}
              <div className="text-center border-b pb-4">
                <h1 className="text-2xl font-bold mb-2">LAUDO MÉDICO</h1>
                <p className="text-gray-600">Data: {laudoVisualizacao.data}</p>
              </div>
              
              {/* Dados do Paciente */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
                <div><strong>Paciente:</strong> {laudoVisualizacao.recipient}</div>
                <div><strong>Executante:</strong> {laudoVisualizacao.execSolicitante}</div>
                <div><strong>Exame:</strong> {laudoVisualizacao.exameTipo}</div>
                {laudoVisualizacao.cid && (
                  <div><strong>CID:</strong> {laudoVisualizacao.cid}</div>
                )}
              </div>

              {/* Diagnóstico */}
              {laudoVisualizacao.diagnostico && (
                <div className="space-y-2">
                  <h3 className="font-bold text-lg">DIAGNÓSTICO:</h3>
                  <p className="text-gray-800">{laudoVisualizacao.diagnostico}</p>
                </div>
              )}

              {/* Conteúdo do Laudo */}
              {laudoVisualizacao.conteudo && (
                <div className="space-y-2">
                  <h3 className="font-bold text-lg">RELATÓRIO:</h3>
                  <div 
                    className="prose max-w-none leading-relaxed text-gray-800"
                    dangerouslySetInnerHTML={{ 
                      __html: formatTextToHtml(laudoVisualizacao.conteudo)
                    }} 
                  />
                </div>
              )}

              {/* Conclusão */}
              {laudoVisualizacao.conclusao && (
                <div className="space-y-2">
                  <h3 className="font-bold text-lg">CONCLUSÃO:</h3>
                  <p className="text-gray-800">{laudoVisualizacao.conclusao}</p>
                </div>
              )}

              {/* Rodapé */}
              <div className="border-t pt-4 text-center text-sm text-gray-600">
                <p><strong>Status:</strong> {laudoVisualizacao.status}</p>
                <p className="mt-2">
                  <strong>{medico.nome}</strong><br/>
                  {medico.identificacao}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      </div>
    </ProtectedRoute>
  );
};

export default ProfissionalPage;