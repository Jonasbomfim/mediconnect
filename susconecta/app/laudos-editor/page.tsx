'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { listarPacientes, buscarMedicos, getUserInfo } from '@/lib/api';
import { useReports } from '@/hooks/useReports';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileText, Upload, Settings, Eye, ArrowLeft, BookOpen } from 'lucide-react';

// Helpers para normalizar dados
const getPatientName = (p: any) => p?.full_name ?? p?.nome ?? '';
const getPatientCpf = (p: any) => p?.cpf ?? '';
const getPatientSex = (p: any) => p?.sex ?? p?.sexo ?? '';
const getPatientAge = (p: any) => {
  if (!p) return '';
  const bd = p?.birth_date ?? p?.data_nascimento ?? p?.birthDate;
  if (bd) {
    const d = new Date(bd);
    if (!isNaN(d.getTime())) {
      const age = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
      return `${age}`;
    }
  }
  return p?.idade ?? p?.age ?? '';
};

export default function LaudosEditorPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const { createNewReport } = useReports();

  // Estados principais
  const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(null);
  const [listaPacientes, setListaPacientes] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState('editor');
  const [showPreview, setShowPreview] = useState(false);

  // Estados para solicitante e prazo
  const [solicitanteId, setSolicitanteId] = useState<string>(user?.id || '');
  // Nome exibido do solicitante (preferir nome do médico vindo da API)
  const [solicitanteNome, setSolicitanteNome] = useState<string>(user?.name || '');
  const [prazoDate, setPrazoDate] = useState<string>('');
  const [prazoTime, setPrazoTime] = useState<string>('');

  // Campos do laudo
  const [campos, setCampos] = useState({
    cid: '',
    diagnostico: '',
    conclusao: '',
    exame: '',
    especialidade: '',
    mostrarData: true,
    mostrarAssinatura: true,
  });

  // Imagens
  const [imagens, setImagens] = useState<any[]>([]);
  const [templates] = useState([
    'Exame normal, sem alterações significativas',
    'Paciente em acompanhamento ambulatorial',
    'Recomenda-se retorno em 30 dias',
    'Alterações compatíveis com processo inflamatório',
    'Resultado dentro dos parâmetros de normalidade',
    'Recomendo seguimento com especialista',
  ]);

  // Frases prontas
  const [frasesProntas] = useState([
    'Paciente apresenta bom estado geral.',
    'Recomenda-se seguimento clínico periódico.',
    'Encaminhar para especialista.',
    'Realizar novos exames em 30 dias.',
    'Retorno em 15 dias para reavaliação.',
    'Suspender medicamento em caso de efeitos colaterais.',
    'Manter repouso relativo por 7 dias.',
    'Seguir orientações prescritas rigorosamente.',
    'Compatível com os achados clínicos.',
    'Sem alterações significativas detectadas.',
  ]);

  // Histórico
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Editor ref
  const editorRef = useRef<HTMLDivElement>(null);

  // Estado para rastrear formatações ativas
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
  });

  // Estado para controlar modal de confirmação de rascunho
  const [showDraftConfirm, setShowDraftConfirm] = useState(false);

  // Atualizar formatações ativas ao mudar seleção
  useEffect(() => {
    const updateFormats = () => {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikethrough: document.queryCommandState('strikeThrough'),
      });
    };

    editorRef.current?.addEventListener('mouseup', updateFormats);
    editorRef.current?.addEventListener('keyup', updateFormats);

    return () => {
      editorRef.current?.removeEventListener('mouseup', updateFormats);
      editorRef.current?.removeEventListener('keyup', updateFormats);
    };
  }, []);

  // Carregar pacientes ao montar
  useEffect(() => {
    async function fetchPacientes() {
      try {
        if (!token) {
          setListaPacientes([]);
          return;
        }
        const pacientes = await listarPacientes();
        setListaPacientes(pacientes || []);
      } catch (err) {
        console.warn('Erro ao carregar pacientes:', err);
        setListaPacientes([]);
      }
    }
    fetchPacientes();

    // Carregar rascunho salvo ao montar
    const savedDraft = localStorage.getItem('laudoDraft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setPacienteSelecionado(draft.pacienteSelecionado);
        setContent(draft.content);
        setCampos(draft.campos);
        setSolicitanteId(draft.solicitanteId);
        setPrazoDate(draft.prazoDate);
        setPrazoTime(draft.prazoTime);
        setImagens(draft.imagens || []);
        
        // Sincronizar editor com conteúdo carregado
        if (editorRef.current) {
          editorRef.current.innerHTML = draft.content;
        }
      } catch (err) {
        console.warn('Erro ao carregar rascunho:', err);
      }
    }
  }, [token]);

  // Import Quill CSS on client side only
  useEffect(() => {
    // No CSS needed for native contenteditable
  }, []);

  // Sincronizar conteúdo inicial com editor ao montar
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content;
    }
  }, []);

  // Auto-salvar no localStorage sempre que houver mudanças (com debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Capturar conteúdo atual do editor antes de salvar
      const currentContent = editorRef.current?.innerHTML || content;
      
      const draft = {
        pacienteSelecionado,
        content: currentContent,
        campos,
        solicitanteId,
        solicitanteNome,
        prazoDate,
        prazoTime,
        imagens,
        lastSaved: new Date().toISOString(),
      };
      
      // Só salvar se houver conteúdo ou dados preenchidos
      if (currentContent || pacienteSelecionado || campos.exame || campos.diagnostico || imagens.length > 0) {
        localStorage.setItem('laudoDraft', JSON.stringify(draft));
      }
    }, 1000); // Aguarda 1 segundo após última mudança

    return () => clearTimeout(timeoutId);
  }, [pacienteSelecionado, content, campos, solicitanteId, solicitanteNome, prazoDate, prazoTime, imagens]);

  // Tentar obter o registro de médico correspondente ao usuário autenticado
  useEffect(() => {
    let mounted = true;
    async function fetchDoctorName() {
      try {
        // Se já temos um nome razoável, não sobrescrever
        if (solicitanteNome && solicitanteNome.trim().length > 1) return;
        if (!user) return;

        // First try: query doctors index with any available identifier (email, id or username)
        try {
          const term = (user.email && user.email.trim()) || user.name || user.id || '';
          if (term && term.length > 1) {
            const docs = await buscarMedicos(term).catch(() => []);
            if (!mounted) return;
            if (Array.isArray(docs) && docs.length > 0) {
              const d = docs[0];
              if (d && (d.full_name || (d as any).nome)) {
                setSolicitanteNome((d.full_name as string) || ((d as any).nome as string) || user.name || user.email || '');
                setSolicitanteId(user.id || solicitanteId);
                return;
              }
            }
          }
        } catch (err) {
          // non-fatal, continue to next fallback
        }

        // Second try: fetch consolidated user-info (may contain profile.full_name)
        try {
          const info = await getUserInfo().catch(() => null);
          if (!mounted) return;
          if (info && (info.profile as any)?.full_name) {
            const full = (info.profile as any).full_name as string;
            if (full && full.trim().length > 1) {
              setSolicitanteNome(full);
              setSolicitanteId(user.id || solicitanteId);
              return;
            }
          }
        } catch (err) {
          // ignore and fallback
        }

        // Final fallback: use name from auth user or email/username
        setSolicitanteNome(user.name || user.email || '');
        setSolicitanteId(user.id || solicitanteId);
      } catch (err) {
        // em caso de erro, manter o fallback
        setSolicitanteNome(user?.name || user?.email || '');
        setSolicitanteId(user?.id || solicitanteId);
      }
    }

    fetchDoctorName();
    return () => {
      mounted = false;
    };
  }, [user]);

  // Atualizar histórico
  useEffect(() => {
    if (history[historyIndex] !== content) {
      const newHistory = history.slice(0, historyIndex + 1);
      setHistory([...newHistory, content]);
      setHistoryIndex(newHistory.length);
    }
  }, [content]);

  // Função para trocar de aba salvando conteúdo antes
  const handleTabChange = (newTab: string) => {
    // Salvar conteúdo do editor antes de trocar
    if (editorRef.current) {
      const editorContent = editorRef.current.innerHTML;
      setContent(editorContent);
    }
    setActiveTab(newTab);
  };

  // Restaurar conteúdo do editor quando voltar para a aba editor
  useEffect(() => {
    if (activeTab === 'editor' && editorRef.current && content) {
      editorRef.current.innerHTML = content;
    }
  }, [activeTab]);

  // Desfazer
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setContent(history[newIndex]);
      setHistoryIndex(newIndex);
      
      // Atualizar editor com conteúdo anterior
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = history[newIndex];
          editorRef.current.focus();
        }
      }, 0);
    }
  };

  // Formatação com contenteditable (document.execCommand)
  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value || undefined);
    editorRef.current?.focus();
  };

  const makeBold = () => applyFormat('bold');
  const makeItalic = () => applyFormat('italic');
  const makeUnderline = () => applyFormat('underline');
  const makeStrikethrough = () => applyFormat('strikeThrough');
  
  const insertUnorderedList = () => {
    document.execCommand('insertUnorderedList', false);
    editorRef.current?.focus();
  };
  
  const insertOrderedList = () => {
    document.execCommand('insertOrderedList', false);
    editorRef.current?.focus();
  };
  
  const alignLeft = () => applyFormat('justifyLeft');
  const alignCenter = () => applyFormat('justifyCenter');
  const alignRight = () => applyFormat('justifyRight');
  const alignJustify = () => applyFormat('justifyFull');

  const insertTemplate = (template: string) => {
    setContent((prev: string) => (prev ? `${prev}\n\n${template}` : template));
  };

  const insertFraseProta = (frase: string) => {
    editorRef.current?.focus();
    document.execCommand('insertText', false, frase + ' ');
    setContent(editorRef.current?.innerHTML || '');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagens((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            name: file.name,
            url: e.target?.result,
            type: file.type,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Salvar rascunho no localStorage
  const saveDraft = () => {
    // Capturar conteúdo atual do editor antes de salvar
    const currentContent = editorRef.current?.innerHTML || content;
    
    const draft = {
      pacienteSelecionado,
      content: currentContent,
      campos,
      solicitanteId,
      solicitanteNome,
      prazoDate,
      prazoTime,
      imagens,
    };
    localStorage.setItem('laudoDraft', JSON.stringify(draft));
    toast({
      title: 'Rascunho salvo!',
      description: 'As informações do laudo foram salvas. Você pode continuar depois.',
      variant: 'default',
    });
    
    // Redirecionar para profissional após 1 segundo
    setTimeout(() => {
      router.push('/profissional');
    }, 1000);
  };

  // Descartar rascunho
  const discardDraft = () => {
    localStorage.removeItem('laudoDraft');
    router.push('/profissional');
  };

  // Processar cancelamento com confirmação
  const handleCancel = () => {
    // Verificar se há dados para salvar
    const hasData = content || campos.cid || campos.diagnostico || campos.conclusao || campos.exame || imagens.length > 0;
    
    if (hasData) {
      setShowDraftConfirm(true);
    } else {
      router.push('/profissional');
    }
  };

  const processContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/\[left\]([\s\S]*?)\[\/left\]/g, '<div style="text-align:left">$1</div>')
      .replace(/\[center\]([\s\S]*?)\[\/center\]/g, '<div style="text-align:center">$1</div>')
      .replace(/\[right\]([\s\S]*?)\[\/right\]/g, '<div style="text-align:right">$1</div>')
      .replace(/\[justify\]([\s\S]*?)\[\/justify\]/g, '<div style="text-align:justify">$1</div>')
      .replace(/\[size=(\d+)\]([\s\S]*?)\[\/size\]/g, '<span style="font-size:$1px">$2</span>')
      .replace(/\[font=([^\]]+)\]([\s\S]*?)\[\/font\]/g, '<span style="font-family:$1">$2</span>')
      .replace(/\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/g, '<span style="color:$1">$2</span>')
      .replace(/{{diagnostico}}/g, campos.diagnostico || '[DIAGNÓSTICO]')
      .replace(/{{conclusao}}/g, campos.conclusao || '[CONCLUSÃO]')
      .replace(/\n/g, '<br>');
  };

  const handleSave = async () => {
    try {
      if (!pacienteSelecionado?.id) {
        toast({
          title: 'Erro',
          description: 'Selecione um paciente para continuar.',
          variant: 'destructive',
        });
        return;
      }

      // Capturar conteúdo atual do editor antes de salvar
      const currentContent = editorRef.current?.innerHTML || content;

      const userId = user?.id || '00000000-0000-0000-0000-000000000001';

      let composedDueAt = undefined;
      if (prazoDate) {
        const t = prazoTime || '23:59';
        composedDueAt = new Date(`${prazoDate}T${t}:00`).toISOString();
      }

      const payload = {
        patient_id: pacienteSelecionado?.id,
        order_number: '',
        exam: campos.exame || '',
        diagnosis: campos.diagnostico || '',
        conclusion: campos.conclusao || '',
        cid_code: campos.cid || '',
        content_html: currentContent,
        content_json: {},
        requested_by: solicitanteId || userId,
        due_at: composedDueAt ?? new Date().toISOString(),
        hide_date: !campos.mostrarData,
        hide_signature: !campos.mostrarAssinatura,
      };

      if (createNewReport) {
        await createNewReport(payload as any);
        
        // Limpar rascunho salvo após sucesso
        localStorage.removeItem('laudoDraft');
        
        toast({
          title: 'Laudo criado com sucesso!',
          description: 'O laudo foi liberado e salvo.',
          variant: 'default',
        });
        // Redirecionar para profissional
        router.push('/profissional');
      }
    } catch (err) {
      toast({
        title: 'Erro ao criar laudo',
        description: (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err) || 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-card shadow-sm sticky top-0 z-10">
          <div className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/profissional')}
                className="p-0 h-auto flex-shrink-0"
              >
                <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold truncate">Novo Laudo Médico</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Crie um novo laudo selecionando um paciente</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Seleção de Paciente */}
          <div className="border-b border-border bg-card px-2 sm:px-4 md:px-6 py-3 sm:py-4 flex-shrink-0 overflow-y-auto md:max-h-56">
            {!pacienteSelecionado ? (
              <div className="bg-muted border border-border rounded-lg p-2 sm:p-4">
                <Label htmlFor="select-paciente" className="text-xs sm:text-sm font-medium mb-2 block">
                  Selecionar Paciente *
                </Label>
                <Select
                  onValueChange={(value) => {
                    const paciente = listaPacientes.find((p) => p.id === value);
                    if (paciente) setPacienteSelecionado(paciente);
                  }}
                >
                  <SelectTrigger className="w-full text-xs sm:text-sm">
                    <SelectValue placeholder="Escolha um paciente para criar o laudo" />
                  </SelectTrigger>
                  <SelectContent>
                    {listaPacientes.map((paciente) => (
                      <SelectItem key={paciente.id} value={paciente.id}>
                        <span className="text-xs sm:text-sm">
                          {paciente.full_name} {paciente.cpf ? `- CPF: ${paciente.cpf}` : ''}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-primary text-sm sm:text-lg truncate">{getPatientName(pacienteSelecionado)}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    {getPatientCpf(pacienteSelecionado) ? `CPF: ${getPatientCpf(pacienteSelecionado)} | ` : ''}
                    {pacienteSelecionado?.birth_date ? `Nascimento: ${pacienteSelecionado.birth_date}` : getPatientAge(pacienteSelecionado) ? `Idade: ${getPatientAge(pacienteSelecionado)} anos` : ''}
                    {getPatientSex(pacienteSelecionado) ? ` | Sexo: ${getPatientSex(pacienteSelecionado)}` : ''}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPacienteSelecionado(null)}
                  className="text-xs sm:text-sm flex-shrink-0"
                >
                  Trocar
                </Button>
              </div>
            )}

            {/* Prazo */}
            {pacienteSelecionado && (
              <div className="mt-3 sm:mt-4">
                <div>
                  <Label htmlFor="prazoDate" className="text-xs sm:text-sm">
                    Prazo do Laudo
                  </Label>
                  <div className="flex gap-1 sm:gap-2 mt-1">
                    <Input
                      id="prazoDate"
                      type="date"
                      value={prazoDate}
                      onChange={(e) => setPrazoDate(e.target.value)}
                      className="text-xs sm:text-sm h-8 sm:h-10 flex-1"
                    />
                    <Input
                      id="prazoTime"
                      type="time"
                      value={prazoTime}
                      onChange={(e) => setPrazoTime(e.target.value)}
                      className="text-xs sm:text-sm h-8 sm:h-10 flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Defina a data e hora (opcional).</p>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border bg-card overflow-x-auto flex-shrink-0">
            <button
              onClick={() => handleTabChange('editor')}
              className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'editor'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-muted-foreground'
              }`}
            >
              <FileText className="w-3 sm:w-4 h-3 sm:h-4 inline mr-1" />
              Editor
            </button>
            <button
              onClick={() => handleTabChange('imagens')}
              className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'imagens'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-muted-foreground'
              }`}
            >
              <Upload className="w-3 sm:w-4 h-3 sm:h-4 inline mr-1" />
              Imagens ({imagens.length})
            </button>
            <button
              onClick={() => handleTabChange('campos')}
              className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'campos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-muted-foreground'
              }`}
            >
              <Settings className="w-3 sm:w-4 h-3 sm:h-4 inline mr-1" />
              Campos
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                showPreview ? 'border-green-500 text-green-600' : 'border-transparent text-gray-600 dark:text-muted-foreground'
              }`}
            >
              <Eye className="w-3 sm:w-4 h-3 sm:h-4 inline mr-1" />
              <span>{showPreview ? 'Ocultar' : 'Pré-visualização'}</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-background">
            {/* Left Panel */}
              <div className={`flex flex-col overflow-hidden transition-all ${showPreview ? 'w-full md:w-3/5 h-auto md:h-full' : 'w-full'}`}>
              {/* Editor Tab */}
              {activeTab === 'editor' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Toolbar */}
                  <div className="p-2 border-b border-border bg-card flex-shrink-0 overflow-x-auto">
                    <div className="flex flex-wrap gap-2 items-center">
                      {/* Font Family */}
                      <label className="text-xs font-medium text-foreground whitespace-nowrap">Fonte:</label>
                      <select
                        defaultValue="Arial"
                        onChange={(e) => applyFormat('fontName', e.target.value)}
                        className="border border-border rounded px-2 py-1 text-xs bg-background text-foreground"
                      >
                        <option value="Arial">Arial</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Georgia">Georgia</option>
                      </select>

                      {/* Font Size */}
                      <label className="text-xs font-medium text-foreground whitespace-nowrap">Tamanho:</label>
                      <select
                        defaultValue="3"
                        onChange={(e) => applyFormat('fontSize', e.target.value)}
                        className="border border-border rounded px-2 py-1 text-xs bg-background text-foreground"
                      >
                        <option value="1">8px</option>
                        <option value="2">10px</option>
                        <option value="3">12px</option>
                        <option value="4">14px</option>
                        <option value="5">18px</option>
                        <option value="6">24px</option>
                        <option value="7">32px</option>
                      </select>

                      <div className="w-px h-6 bg-border mx-1" />

                      <Button 
                        variant={activeFormats.bold ? "default" : "outline"} 
                        size="sm" 
                        onMouseDown={(e) => { e.preventDefault(); makeBold(); }} 
                        title="Negrito (Ctrl+B)" 
                        className="text-xs h-8 px-2 hover:bg-blue-50 dark:hover:bg-blue-950"
                      >
                        <strong>B</strong>
                      </Button>
                      <Button 
                        variant={activeFormats.italic ? "default" : "outline"} 
                        size="sm" 
                        onMouseDown={(e) => { e.preventDefault(); makeItalic(); }} 
                        title="Itálico (Ctrl+I)" 
                        className="text-xs h-8 px-2 hover:bg-blue-50 dark:hover:bg-blue-950"
                      >
                        <em>I</em>
                      </Button>
                      <Button 
                        variant={activeFormats.underline ? "default" : "outline"} 
                        size="sm" 
                        onMouseDown={(e) => { e.preventDefault(); makeUnderline(); }} 
                        title="Sublinhado (Ctrl+U)" 
                        className="text-xs h-8 px-2 hover:bg-blue-50 dark:hover:bg-blue-950"
                      >
                        <u>U</u>
                      </Button>
                      <Button 
                        variant={activeFormats.strikethrough ? "default" : "outline"} 
                        size="sm" 
                        onMouseDown={(e) => { e.preventDefault(); makeStrikethrough(); }} 
                        title="Tachado" 
                        className="text-xs h-8 px-2 hover:bg-blue-50 dark:hover:bg-blue-950"
                      >
                        <del>S</del>
                      </Button>
                      <div className="w-px h-6 bg-border mx-1" />
                      <Button variant="outline" size="sm" onMouseDown={(e) => { e.preventDefault(); insertUnorderedList(); }} title="Lista com marcadores" className="text-xs h-8 px-2 hover:bg-blue-50 dark:hover:bg-blue-950">
                        •
                      </Button>
                      <Button variant="outline" size="sm" onMouseDown={(e) => { e.preventDefault(); insertOrderedList(); }} title="Lista numerada" className="text-xs h-8 px-2 hover:bg-blue-50 dark:hover:bg-blue-950">
                        1.
                      </Button>
                      <div className="w-px h-6 bg-border mx-1" />
                      <Button variant="outline" size="sm" onMouseDown={(e) => { e.preventDefault(); alignLeft(); }} title="Alinhar à esquerda" className="text-xs h-8 px-2 hover:bg-blue-50 dark:hover:bg-blue-950">
                        ◄
                      </Button>
                      <Button variant="outline" size="sm" onMouseDown={(e) => { e.preventDefault(); alignCenter(); }} title="Centralizar" className="text-xs h-8 px-2 hover:bg-blue-50 dark:hover:bg-blue-950">
                        ·
                      </Button>
                      <Button variant="outline" size="sm" onMouseDown={(e) => { e.preventDefault(); alignRight(); }} title="Alinhar à direita" className="text-xs h-8 px-2 hover:bg-blue-50 dark:hover:bg-blue-950">
                        ►
                      </Button>
                      <Button variant="outline" size="sm" onMouseDown={(e) => { e.preventDefault(); alignJustify(); }} title="Justificar" className="text-xs h-8 px-2 hover:bg-blue-50 dark:hover:bg-blue-950">
                        ≡
                      </Button>
                      <div className="w-px h-6 bg-border mx-1" />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" title="Frases prontas" className="text-xs h-8 px-2 hover:bg-blue-50 dark:hover:bg-blue-950">
                            <BookOpen className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64">
                          {frasesProntas.map((frase, index) => (
                            <DropdownMenuItem
                              key={index}
                              onSelect={() => insertFraseProta(frase)}
                              className="text-xs cursor-pointer"
                            >
                              {frase}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Editor contenteditable */}
                  <div className="flex-1 overflow-hidden p-2 sm:p-3 md:p-4">
                    <div
                      ref={editorRef}
                      contentEditable
                      onInput={(e) => setContent(e.currentTarget.innerHTML)}
                      onPaste={(e) => {
                        e.preventDefault();
                        const text = e.clipboardData.getData('text/plain');
                        document.execCommand('insertText', false, text);
                      }}
                      className="w-full h-full overflow-auto p-3 text-sm border border-border rounded bg-background text-foreground outline-none empty:before:content-['Digite_aqui...'] empty:before:text-muted-foreground"
                      style={{ caretColor: 'currentColor' }}
                      suppressContentEditableWarning
                    />
                  </div>
                </div>
              )}

              {/* Imagens Tab */}
              {activeTab === 'imagens' && (
                <div className="flex-1 p-2 sm:p-3 md:p-4 overflow-y-auto">
                  <div className="mb-3 sm:mb-4">
                    <Label htmlFor="upload-images" className="text-xs sm:text-sm">
                      Upload de Imagens
                    </Label>
                    <Input
                      id="upload-images"
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleImageUpload}
                      className="mt-1 sm:mt-2 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                    {imagens.map((img) => (
                      <div key={img.id} className="border border-border rounded-lg p-1.5 sm:p-2">
                        {img.type.startsWith('image/') ? (
                          <img src={img.url} alt={img.name} className="w-full h-20 sm:h-24 md:h-28 object-cover rounded" />
                        ) : (
                          <div className="w-full h-20 sm:h-24 md:h-28 bg-muted rounded flex items-center justify-center">
                            <FileText className="w-6 sm:w-8 h-6 sm:h-8 text-muted-foreground" />
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 truncate">{img.name}</p>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full mt-1 text-xs h-8"
                          onClick={() => setImagens((prev) => prev.filter((i) => i.id !== img.id))}
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Campos Tab */}
              {activeTab === 'campos' && (
                <div className="flex-1 p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 md:space-y-4 overflow-y-auto">
                  <div>
                    <Label htmlFor="cid" className="text-xs sm:text-sm">
                      CID
                    </Label>
                    <Input
                      id="cid"
                      value={campos.cid}
                      onChange={(e) => setCampos((prev) => ({ ...prev, cid: e.target.value }))}
                      placeholder="Ex: M25.5, I10, etc."
                      className="text-xs sm:text-sm mt-1 h-8 sm:h-10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="exame" className="text-xs sm:text-sm">
                      Exame
                    </Label>
                    <Input
                      id="exame"
                      value={campos.exame}
                      onChange={(e) => setCampos((prev) => ({ ...prev, exame: e.target.value }))}
                      placeholder="Exame realizado"
                      className="text-xs sm:text-sm mt-1 h-8 sm:h-10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="diagnostico" className="text-xs sm:text-sm">
                      Diagnóstico
                    </Label>
                    <Textarea
                      id="diagnostico"
                      value={campos.diagnostico}
                      onChange={(e) => setCampos((prev) => ({ ...prev, diagnostico: e.target.value }))}
                      placeholder="Diagnóstico principal"
                      rows={2}
                      className="text-xs sm:text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="conclusao" className="text-xs sm:text-sm">
                      Conclusão
                    </Label>
                    <Textarea
                      id="conclusao"
                      value={campos.conclusao}
                      onChange={(e) => setCampos((prev) => ({ ...prev, conclusao: e.target.value }))}
                      placeholder="Conclusão do laudo"
                      rows={2}
                      className="text-xs sm:text-sm mt-1"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="mostrar-data"
                        checked={campos.mostrarData}
                        onChange={(e) => setCampos((prev) => ({ ...prev, mostrarData: e.target.checked }))}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="mostrar-data" className="text-xs sm:text-sm">
                        Mostrar data no laudo
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="mostrar-assinatura"
                        checked={campos.mostrarAssinatura}
                        onChange={(e) => setCampos((prev) => ({ ...prev, mostrarAssinatura: e.target.checked }))}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="mostrar-assinatura" className="text-xs sm:text-sm">
                        Mostrar assinatura no laudo
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Preview Panel */}
            {showPreview && (
              <div className="w-full md:w-2/5 h-auto md:h-full border-t md:border-l md:border-t-0 border-border bg-muted/20 flex flex-col overflow-hidden">
                <div className="p-2 sm:p-2.5 md:p-3 border-b border-border flex-shrink-0 bg-card">
                  <h3 className="font-semibold text-xs sm:text-sm text-foreground truncate">Pré-visualização</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 sm:p-2.5 md:p-3">
                  <div className="bg-background border border-border rounded p-2 sm:p-2.5 md:p-3 text-xs space-y-1.5 sm:space-y-2 max-w-full">
                    {/* Header */}
                    <div className="text-center mb-2 pb-2 border-b border-border/40">
                      <h2 className="text-xs sm:text-sm font-bold leading-tight whitespace-normal">
                        LAUDO {campos.especialidade ? `- ${campos.especialidade.toUpperCase().substring(0, 12)}` : ''}
                      </h2>
                      {campos.exame && <p className="text-xs font-semibold mt-1 whitespace-pre-wrap break-words">{campos.exame}</p>}
                      {campos.mostrarData && (
                        <p className="text-xs text-muted-foreground mt-1">{new Date().toLocaleDateString('pt-BR')}</p>
                      )}
                    </div>

                    {/* Paciente */}
                    {pacienteSelecionado && (
                      <div className="mb-1.5 pb-1.5 border-b border-border/40 space-y-0.5">
                        <div className="text-xs whitespace-normal break-words">
                          <span className="font-semibold">Paciente:</span>
                          <div className="mt-0.5">{getPatientName(pacienteSelecionado)}</div>
                        </div>
                        <div className="text-xs whitespace-normal break-words">
                          <span className="font-semibold">CPF:</span>
                          <div className="mt-0.5">{getPatientCpf(pacienteSelecionado)}</div>
                        </div>
                      </div>
                    )}

                    {/* Informações Clínicas */}
                    <div className="mb-1.5 pb-1.5 border-b border-border/40 space-y-0.5">
                      {campos.cid && (
                        <div className="text-xs whitespace-normal break-words">
                          <div className="font-semibold">CID:</div>
                          <div className="mt-0.5 text-blue-600 dark:text-blue-400 font-semibold">{campos.cid}</div>
                        </div>
                      )}
                    </div>

                    {/* Diagnóstico - Completo */}
                    {campos.diagnostico && (
                      <div className="mb-1.5 pb-1.5 border-b border-border/40">
                        <div className="text-xs font-semibold mb-0.5">Diagnóstico:</div>
                        <div className="text-xs leading-tight whitespace-pre-wrap text-muted-foreground break-words">
                          {campos.diagnostico}
                        </div>
                      </div>
                    )}

                    {/* Conteúdo */}
                    {content && (
                      <div className="mb-1.5 pb-1.5 border-b border-border/40">
                        <div className="text-xs font-semibold mb-0.5">Conteúdo:</div>
                        <div
                          className="text-xs leading-tight whitespace-pre-wrap text-muted-foreground break-words overflow-hidden"
                          dangerouslySetInnerHTML={{
                            __html: processContent(content),
                          }}
                        />
                      </div>
                    )}

                    {/* Conclusão - Completa */}
                    {campos.conclusao && (
                      <div className="mb-1.5 pb-1.5 border-b border-border/40">
                        <div className="text-xs font-semibold mb-0.5">Conclusão:</div>
                        <div className="text-xs leading-tight whitespace-pre-wrap text-muted-foreground break-words">
                          {campos.conclusao}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-2 sm:p-3 md:p-4 border-t border-border bg-card flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4">
            <div className="text-xs text-muted-foreground hidden md:block">
              Editor de relatórios com formatação de texto rica.
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={handleCancel} className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-10 hover:bg-blue-50 dark:hover:bg-blue-950">
                Cancelar
              </Button>
              <Button onClick={handleSave} className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-10">
                Liberar Laudo
              </Button>
            </div>
          </div>
        </div>

        {/* Modal de Confirmação de Rascunho */}
        {showDraftConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg shadow-lg p-4 sm:p-6 max-w-sm w-full">
              <h2 className="text-lg sm:text-xl font-bold mb-2 text-foreground">Salvar Rascunho?</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Você tem informações não salvas. Deseja salvar como rascunho para continuar depois?
              </p>
              <div className="flex gap-2 sm:gap-3 flex-col sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDraftConfirm(false);
                    discardDraft();
                  }}
                  className="text-xs sm:text-sm h-9 sm:h-10 hover:bg-blue-50 dark:hover:bg-blue-950"
                >
                  Descartar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDraftConfirm(false)}
                  className="text-xs sm:text-sm h-9 sm:h-10 hover:bg-blue-50 dark:hover:bg-blue-950"
                >
                  Voltar
                </Button>
                <Button
                  onClick={() => {
                    setShowDraftConfirm(false);
                    saveDraft();
                  }}
                  className="text-xs sm:text-sm h-9 sm:h-10"
                >
                  Salvar Rascunho
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
