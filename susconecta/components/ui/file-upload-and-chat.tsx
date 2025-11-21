"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Paperclip, Send, Moon, Sun, X, FileText, ImageIcon, Video, Music, Archive, MessageCircle, Bot, User, Info, Lock, Mic } from 'lucide-react';

const API_ENDPOINT = "https://n8n.jonasbomfim.store/webhook-test/zoe2";
const FALLBACK_RESPONSE = "Tive um problema para responder agora. Tente novamente em alguns instantes.";

const FileUploadChat = ({ onOpenVoice }: { onOpenVoice?: () => void }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content:
        'Compartilhe uma dúvida, exame ou orientação que deseja revisar. A Zoe registra o pedido e te retorna com um resumo organizado para a equipe de saúde.',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputValue]);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return <ImageIcon className="w-4 h-4" aria-hidden="true" />;
    if (['mp4', 'avi', 'mkv', 'mov', 'webm'].includes(ext || '')) return <Video className="w-4 h-4" aria-hidden="true" />;
    if (['mp3', 'wav', 'flac', 'ogg', 'aac'].includes(ext || '')) return <Music className="w-4 h-4" aria-hidden="true" />;
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) return <Archive className="w-4 h-4" aria-hidden="true" />;
    return <FileText className="w-4 h-4" aria-hidden="true" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Add system message about file upload
    const fileNames = newFiles.map(f => f.name).join(', ');
    const systemMessage = {
      id: Date.now(),
      type: 'system',
      content: `📎 Added ${newFiles.length} file(s): ${fileNames}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = (fileId: number) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const generateAIResponse = useCallback(async (userMessage: string, files: any[]) => {
    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const rawPayload = await response.text();
      let replyText = "";

      if (rawPayload.trim().length > 0) {
        try {
          const parsed = JSON.parse(rawPayload) as { reply?: unknown };
          replyText = typeof parsed.reply === "string" ? parsed.reply.trim() : "";
        } catch (parseError) {
          console.error("[FileUploadChat] Invalid JSON response", parseError, rawPayload);
        }
      }

      return replyText || FALLBACK_RESPONSE;
    } catch (error) {
      console.error("[FileUploadChat] Failed to get API response", error);
      return FALLBACK_RESPONSE;
    }
  }, []);

  const sendMessage = useCallback(async () => {
    if (inputValue.trim() || uploadedFiles.length > 0) {
      const newMessage = {
        id: Date.now(),
        type: 'user',
        content: inputValue.trim(),
        files: [...uploadedFiles],
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
      
      const messageContent = inputValue.trim();
      const attachedFiles = [...uploadedFiles];
      
      setInputValue('');
      setUploadedFiles([]);
      setIsTyping(true);
      
      // Get AI response from API
      const aiResponseContent = await generateAIResponse(messageContent, attachedFiles);
      
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponseContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }
  }, [inputValue, uploadedFiles, generateAIResponse]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const themeClasses = {
    background: isDarkMode ? 'bg-gray-900' : 'bg-gray-50',
    cardBg: isDarkMode ? 'bg-gray-800' : 'bg-white',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    textSecondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    border: isDarkMode ? 'border-gray-700' : 'border-gray-200',
    inputBg: isDarkMode ? 'bg-gray-700' : 'bg-gray-100',
    uploadArea: isDragOver 
      ? (isDarkMode ? 'bg-blue-900/50 border-blue-500' : 'bg-blue-50 border-blue-400')
      : (isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'),
    userMessage: isDarkMode ? 'bg-blue-600' : 'bg-blue-500',
    aiMessage: isDarkMode ? 'bg-gray-700' : 'bg-gray-200',
    systemMessage: isDarkMode ? 'bg-yellow-900/30 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className={`w-full min-h-screen transition-colors duration-300 ${themeClasses.background}`}>
      <div className="max-w-6xl mx-auto p-3 sm:p-6">
        {/* Main Card - Zoe Assistant Section */}
        <div className={`rounded-2xl sm:rounded-3xl shadow-xl border bg-linear-to-br ${isDarkMode ? 'from-primary/15 via-gray-800 to-gray-900' : 'from-blue-50 via-white to-indigo-50'} p-4 sm:p-8 ${isDarkMode ? 'border-gray-700' : 'border-blue-200'} mb-4 sm:mb-6 backdrop-blur-sm`}>
          <div className="flex flex-col gap-4 sm:gap-8">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl sm:rounded-3xl bg-linear-to-br from-primary via-indigo-500 to-sky-500 text-sm sm:text-base font-semibold text-white shadow-lg">
                  Zoe
                </span>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] sm:tracking-[0.24em] text-primary/80">
                    Assistente Clínica Zoe
                  </p>
                  <h1 className="text-lg sm:text-3xl font-semibold tracking-tight text-foreground">
                    <span className="bg-linear-to-r from-sky-400 via-primary to-indigo-500 bg-clip-text text-transparent">
                      Olá, eu sou Zoe.
                    </span>
                    <span className="text-foreground"> Como posso ajudar?</span>
                  </h1>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
                <button
                  type="button"
                  className={`rounded-full border-primary/40 px-2 sm:px-4 py-1 sm:py-2 text-xs font-semibold uppercase tracking-[0.12em] sm:tracking-[0.18em] text-primary shadow-sm transition hover:bg-primary/10 border whitespace-nowrap`}
                >
                  Novo atendimento
                </button>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all duration-200 hover:scale-105 hover:shadow-lg ${themeClasses.border} ${themeClasses.inputBg} ${themeClasses.text}`}
                >
                  <Moon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            {/* Description */}
            <p className={`max-w-3xl text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-muted-foreground' : 'text-gray-700'}`}>
              Organizamos exames, orientações e tarefas assistenciais em um painel único para acelerar decisões clínicas. Utilize a Zoe para revisar resultados, registrar percepções e alinhar próximos passos com a equipe de saúde.
            </p>

            {/* Security Info */}
            <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 sm:px-4 py-1 sm:py-2 text-xs text-primary shadow-sm">
              <Lock className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
              <span className="text-xs sm:text-sm">Suas informações permanecem criptografadas e seguras com a equipe Zoe.</span>
            </div>

            {/* Info Section */}
            <div className={`rounded-2xl sm:rounded-3xl border bg-linear-to-br ${isDarkMode ? 'border-primary/25 from-primary/10 via-background/50 to-background text-muted-foreground' : 'border-blue-200 from-blue-50 via-white to-indigo-50 text-gray-700'} p-4 sm:p-6 text-xs sm:text-sm leading-relaxed`}>
              <div className={`mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3 ${isDarkMode ? 'text-primary' : 'text-blue-600'}`}>
                <Info className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="text-sm sm:text-base font-semibold">Informativo importante</span>
              </div>
              <p className={`mb-3 sm:mb-4 text-xs sm:text-sm ${isDarkMode ? 'text-muted-foreground' : 'text-gray-700'}`}>
                A Zoe acompanha toda a jornada clínica, consolida exames e registra orientações para que você tenha clareza em cada etapa do cuidado. As respostas são informativas e complementam a avaliação de um profissional de saúde qualificado.
              </p>
              <p className={`font-medium text-xs sm:text-sm ${isDarkMode ? 'text-foreground' : 'text-gray-900'}`}>
                Em situações de urgência, entre em contato com a equipe médica presencial ou acione os serviços de emergência da sua região.
              </p>
            </div>

            {/* Files Ready to Send */}
            {uploadedFiles.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h4 className={`text-xs sm:text-sm font-medium ${themeClasses.text}`}>
                    Files ready to send ({uploadedFiles.length})
                  </h4>
                  <button
                    onClick={() => setUploadedFiles([])}
                    className={`text-xs px-2 sm:px-3 py-1 rounded-full ${themeClasses.textSecondary} hover:text-red-500 transition-colors`}
                  >
                    Clear all
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {uploadedFiles.map(file => (
                    <div key={file.id} className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border ${themeClasses.border} ${themeClasses.inputBg}`}>
                      {getFileIcon(file.name)}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs sm:text-sm font-medium truncate ${themeClasses.text}`}>{file.name}</p>
                        <p className={`text-xs ${themeClasses.textSecondary}`}>{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className={`p-1 rounded-full hover:bg-red-500/20 ${themeClasses.textSecondary} hover:text-red-500 transition-colors`}
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`rounded-2xl shadow-xl border ${themeClasses.cardBg} ${themeClasses.border}`}>
          {/* Chat Header */}
          <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b ${themeClasses.border}`}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className={`font-semibold text-sm sm:text-base ${themeClasses.text}`}>Chat with AI Assistant</h3>
              <span className={`text-xs sm:text-sm ${themeClasses.textSecondary}`}>Online</span>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="h-64 sm:h-96 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
            {messages.map((message: any) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : message.type === 'system' ? 'justify-center' : 'justify-start'}`}>
                {message.type !== 'system' && message.type === 'ai' && (
                  <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary via-indigo-500 to-sky-500 text-xs font-semibold text-white shadow-lg mr-2 sm:mr-3">
                    Z
                  </span>
                )}
                
                <div className={`max-w-xs sm:max-w-sm lg:max-w-md ${
                  message.type === 'user' ? `${themeClasses.userMessage} text-white ml-3` :
                  message.type === 'ai' ? `${themeClasses.aiMessage} ${themeClasses.text}` :
                  `${themeClasses.systemMessage} text-xs`
                } px-4 py-3 rounded-2xl ${message.type === 'user' ? 'rounded-br-md' : message.type === 'ai' ? 'rounded-bl-md' : 'rounded-lg'}`}>
                  {message.content && <p className="wrap-break-word text-xs sm:text-sm">{message.content}</p>}
                  {message.files && message.files.length > 0 && (
                    <div className="mt-1 sm:mt-2 space-y-1">
                      {message.files.map((file: any) => (
                        <div key={file.id} className="flex items-center gap-1 sm:gap-2 text-xs opacity-90 bg-black/10 rounded px-2 py-1">
                          {getFileIcon(file.name)}
                          <span className="truncate text-xs">{file.name}</span>
                          <span className="text-xs">({formatFileSize(file.size)})</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs opacity-70 mt-1 sm:mt-2">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {message.type === 'user' && (
                  <div className={`w-8 h-8 rounded-full ml-3 flex items-center justify-center ${themeClasses.userMessage}`}>
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary via-indigo-500 to-sky-500 text-xs font-semibold text-white shadow-lg mr-2 sm:mr-3">
                  Z
                </span>
                <div className={`px-4 py-3 rounded-2xl rounded-bl-md ${themeClasses.aiMessage}`}>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className={`border-t p-3 sm:p-4 ${themeClasses.border}`}>
            <div className="flex gap-2 sm:gap-3 items-end">
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all duration-200 hover:scale-105 hover:shadow-lg ${themeClasses.border} ${themeClasses.inputBg} ${themeClasses.text}`}
                title="Attach files"
              >
                <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                  handleFileSelect(event.target.files);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              />
              
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Pergunte qualquer coisa para a Zoe"
                  rows={1}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 max-h-32 text-sm ${themeClasses.inputBg} ${themeClasses.border} ${themeClasses.text} placeholder-gray-400`}
                  style={{ minHeight: '40px' }}
                />
                
                {/* Character count */}
                {inputValue.length > 0 && (
                  <div className={`absolute bottom-1 right-2 text-xs ${themeClasses.textSecondary}`}>
                    {inputValue.length}
                  </div>
                )}
              </div>
              
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() && uploadedFiles.length === 0}
                className="p-2 sm:p-3 bg-linear-to-r from-blue-500 to-purple-600 text-white rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:hover:scale-100 shadow-lg"
                title="Send message"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={() => onOpenVoice?.()}
                className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all duration-200 hover:scale-105 hover:shadow-lg ${themeClasses.border} ${themeClasses.inputBg} ${themeClasses.text}`}
                title="Voice capture"
              >
                <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            
            {/* Quick Actions */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadChat;
