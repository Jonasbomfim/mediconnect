'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { buscarRelatorioPorId, buscarPacientePorId } from '@/lib/api';
import { useReports } from '@/hooks/useReports';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileText, Settings, Eye, ArrowLeft, BookOpen } from 'lucide-react';

export default function EditarLaudoPage() {
  const router = useRouter();
  const params = useParams();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const { updateExistingReport } = useReports();
  const laudoId = params.id as string;

  // Estados principais
  const [reportData, setReportData] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [content, setContent] = useState('');
  const [activeTab, setActiveTab] = useState('editor');
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);

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

  // Editor ref
  const editorRef = useRef<HTMLDivElement>(null);

  // Frases prontas
  const frasesProntas = [
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
  ];

  // Estado para rastrear formatações ativas
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
  });

  // Estado para rastrear alinhamento ativo
  const [activeAlignment, setActiveAlignment] = useState('left');

  // Salvar conteúdo no localStorage sempre que muda (com debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (laudoId) {
        // Capturar conteúdo atual do editor antes de salvar
        const currentContent = editorRef.current?.innerHTML || content;
        
        const draft = {
          content: currentContent,
          campos,
          lastSaved: new Date().toISOString(),
        };
        
        localStorage.setItem(`laudo-draft-${laudoId}`, JSON.stringify(draft));
      }
    }, 1000); // Aguarda 1 segundo após última mudança

    return () => clearTimeout(timeoutId);
  }, [content, campos, laudoId]);

  // Sincronizar conteúdo com o editor
  useEffect(() => {
    if (editorRef.current && content) {
      editorRef.current.innerHTML = content;
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

  // Restaurar conteúdo quando volta para a aba editor
  useEffect(() => {
    if (activeTab === 'editor' && editorRef.current && content) {
      editorRef.current.innerHTML = content;
    }
  }, [activeTab]);

  // Atualizar formatações ativas ao mudar seleção
  useEffect(() => {
    const updateFormats = () => {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikethrough: document.queryCommandState('strikeThrough'),
      });

      // Detectar alinhamento ativo
      if (document.queryCommandState('justifyCenter')) {
        setActiveAlignment('center');
      } else if (document.queryCommandState('justifyRight')) {
        setActiveAlignment('right');
      } else if (document.queryCommandState('justifyFull')) {
        setActiveAlignment('justify');
      } else {
        setActiveAlignment('left');
      }
    };

    editorRef.current?.addEventListener('mouseup', updateFormats);
    editorRef.current?.addEventListener('keyup', updateFormats);

    return () => {
      editorRef.current?.removeEventListener('mouseup', updateFormats);
      editorRef.current?.removeEventListener('keyup', updateFormats);
    };
  }, []);

  // Carregar laudo ao montar
  useEffect(() => {
    async function fetchLaudo() {
      try {
        if (!laudoId || !token) {
          setLoading(false);
          return;
        }
        const report = await buscarRelatorioPorId(laudoId);
        setReportData(report);

        // Carregar paciente se existir patient_id
        const r = report as any;
        if (r.patient_id) {
          try {
            const patientData = await buscarPacientePorId(r.patient_id);
            setPatient(patientData);
          } catch (err) {
            console.warn('Erro ao carregar paciente:', err);
          }
        }

        // Preencher campos
        setCampos({
          cid: r.cid_code || r.cid || '',
          diagnostico: r.diagnosis || r.diagnostico || '',
          conclusao: r.conclusion || r.conclusao || '',
          exame: r.exam || r.exame || '',
          especialidade: r.especialidade || '',
          mostrarData: !r.hide_date,
          mostrarAssinatura: !r.hide_signature,
        });

        // Preencher conteúdo
        const contentHtml = r.content_html || r.conteudo_html || '';
        
        // Verificar se existe rascunho salvo no localStorage
        let finalContent = contentHtml;
        let finalCampos = {
          cid: r.cid_code || r.cid || '',
          diagnostico: r.diagnosis || r.diagnostico || '',
          conclusao: r.conclusion || r.conclusao || '',
          exame: r.exam || r.exame || '',
          especialidade: r.especialidade || '',
          mostrarData: !r.hide_date,
          mostrarAssinatura: !r.hide_signature,
        };
        
        if (typeof window !== 'undefined') {
          const draftData = localStorage.getItem(`laudo-draft-${laudoId}`);
          if (draftData) {
            try {
              const draft = JSON.parse(draftData);
              if (draft.content) finalContent = draft.content;
              if (draft.campos) finalCampos = { ...finalCampos, ...draft.campos };
            } catch (err) {
              // Se falhar parse, tentar como string simples (formato antigo)
              finalContent = draftData;
            }
          }
        }
        
        setCampos(finalCampos);
        setContent(finalContent);
        
        if (editorRef.current) {
          editorRef.current.innerHTML = finalContent;
        }
      } catch (err) {
        console.warn('Erro ao carregar laudo:', err);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar o laudo.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchLaudo();
  }, [laudoId, token, toast]);

  // Formatação com contenteditable
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
  
  const alignText = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    editorRef.current?.focus();
    
    const alignCommands: { [key: string]: string } = {
      left: 'justifyLeft',
      center: 'justifyCenter',
      right: 'justifyRight',
      justify: 'justifyFull',
    };

    document.execCommand(alignCommands[alignment], false, undefined);
    
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const alignLeft = () => alignText('left');
  const alignCenter = () => alignText('center');
  const alignRight = () => alignText('right');
  const alignJustify = () => alignText('justify');

  const insertFraseProta = (frase: string) => {
    editorRef.current?.focus();
    document.execCommand('insertText', false, frase + ' ');
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
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
      if (!reportData?.id) {
        toast({
          title: 'Erro',
          description: 'ID do laudo não encontrado.',
          variant: 'destructive',
        });
        return;
      }

      // Pegar conteúdo diretamente do DOM para garantir que está atualizado
      const currentContent = editorRef.current?.innerHTML || content;

      const payload = {
        exam: campos.exame || '',
        diagnosis: campos.diagnostico || '',
        conclusion: campos.conclusao || '',
        cid_code: campos.cid || '',
        content_html: currentContent,
        content_json: {},
        hide_date: !campos.mostrarData,
        hide_signature: !campos.mostrarAssinatura,
      };

      if (updateExistingReport) {
        await updateExistingReport(reportData.id, payload as any);
        
        // Limpar rascunho do localStorage após salvar
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`laudo-draft-${reportData.id}`);
        }
        
        toast({
          title: 'Laudo atualizado com sucesso!',
          description: 'As alterações foram salvas.',
          variant: 'default',
        });
        router.push(`/laudos/${reportData.id}`);
      }
    } catch (err) {
      toast({
        title: 'Erro ao atualizar laudo',
        description: (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err) || 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-lg text-muted-foreground">Carregando laudo...</div>
        </div>
      </ProtectedRoute>
    );
  }

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
                onClick={() => router.back()}
                className="p-0 h-auto flex-shrink-0"
              >
                <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold truncate">Editar Laudo Médico</h1>
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Atualize as informações do laudo</p>
                  {patient && (
                    <p className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 truncate">
                      Paciente: {patient.full_name || patient.name || 'N/A'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
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
                      <Button 
                        variant={activeAlignment === 'left' ? "default" : "outline"} 
                        size="sm" 
                        onMouseDown={(e) => { e.preventDefault(); alignLeft(); }} 
                        title="Alinhar à esquerda" 
                        className="text-xs h-8 px-2 hover:bg-blue-50 dark:hover:bg-blue-950"
                      >
                        ◄
                      </Button>
                      <Button 
                        variant={activeAlignment === 'center' ? "default" : "outline"} 
                        size="sm" 
                        onMouseDown={(e) => { e.preventDefault(); alignCenter(); }} 
                        title="Centralizar" 
                        className="text-xs h-8 px-2 hover:bg-blue-50 dark:hover:bg-blue-950"
                      >
                        ·
                      </Button>
                      <Button 
                        variant={activeAlignment === 'right' ? "default" : "outline"} 
                        size="sm" 
                        onMouseDown={(e) => { e.preventDefault(); alignRight(); }} 
                        title="Alinhar à direita" 
                        className="text-xs h-8 px-2 hover:bg-blue-50 dark:hover:bg-blue-950"
                      >
                        ►
                      </Button>
                      <Button 
                        variant={activeAlignment === 'justify' ? "default" : "outline"} 
                        size="sm" 
                        onMouseDown={(e) => { e.preventDefault(); alignJustify(); }} 
                        title="Justificar" 
                        className="text-xs h-8 px-2 hover:bg-blue-50 dark:hover:bg-blue-950"
                      >
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

                    {/* Informações Clínicas */}
                    <div className="mb-1.5 pb-1.5 border-b border-border/40 space-y-0.5">
                      {campos.cid && (
                        <div className="text-xs whitespace-normal break-words">
                          <div className="font-semibold">CID:</div>
                          <div className="mt-0.5 text-blue-600 dark:text-blue-400 font-semibold">{campos.cid}</div>
                        </div>
                      )}
                    </div>

                    {/* Diagnóstico */}
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

                    {/* Conclusão */}
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
              Edite as informações do laudo e salve as alterações.
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => router.back()} className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-10 hover:bg-blue-50 dark:hover:bg-blue-950">
                Cancelar
              </Button>
              <Button onClick={handleSave} className="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-10">
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
