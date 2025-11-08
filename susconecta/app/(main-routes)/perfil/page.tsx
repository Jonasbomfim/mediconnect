"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UploadAvatar } from "@/components/ui/upload-avatar";
import { AlertCircle, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { getUserInfoById } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatTelefone, formatCEP, validarCEP, buscarCEP } from "@/lib/utils";

interface UserProfile {
  user: {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at: string | null;
    email_confirmed_at: string | null;
  };
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    cep?: string | null;
    street?: string | null;
    number?: string | null;
    complement?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
    disabled: boolean;
    created_at: string;
    updated_at: string;
  } | null;
  roles: string[];
  permissions: {
    isAdmin: boolean;
    isManager: boolean;
    isDoctor: boolean;
    isSecretary: boolean;
    isAdminOrManager: boolean;
  };
}

export default function PerfilPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [userInfo, setUserInfo] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState<{
    phone?: string;
    full_name?: string;
    avatar_url?: string;
    cep?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  }>({});
  const [cepLoading, setCepLoading] = useState(false);
  const [cepValid, setCepValid] = useState<boolean | null>(null);

  useEffect(() => {
    async function loadUserInfo() {
      try {
        setLoading(true);
        
        if (!authUser?.id) {
          throw new Error("ID do usuário não encontrado");
        }

        console.log('[PERFIL] Chamando getUserInfoById com ID:', authUser.id);
        
        // Para admin/gestor, usar getUserInfoById com o ID do usuário logado
        const info = await getUserInfoById(authUser.id);
        console.log('[PERFIL] Sucesso ao carregar info:', info);
        setUserInfo(info as UserProfile);
        setError(null);
      } catch (err: any) {
        console.error('[PERFIL] Erro ao carregar:', err);
        setError(err?.message || "Erro ao carregar informações do perfil");
        setUserInfo(null);
      } finally {
        setLoading(false);
      }
    }

    if (authUser) {
      console.log('[PERFIL] useEffect acionado, authUser:', authUser);
      loadUserInfo();
    }
  }, [authUser]);

  if (authUser?.userType !== 'administrador') {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex-1 p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Você não tem permissão para acessar esta página.
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mt-4 hover:bg-primary/10 hover:text-primary dark:hover:bg-accent dark:hover:text-accent-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex-1 p-6">
          <div className="space-y-4">
            <div className="h-20 bg-muted rounded-lg animate-pulse" />
            <div className="h-64 bg-muted rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex-1 p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex-1 p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhuma informação de perfil disponível.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "AD";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEditClick = () => {
    if (!isEditing && userInfo) {
      setEditingData({
        full_name: userInfo.profile?.full_name || "",
        phone: userInfo.profile?.phone || "",
        avatar_url: userInfo.profile?.avatar_url || "",
        cep: userInfo.profile?.cep || "",
        street: userInfo.profile?.street || "",
        number: userInfo.profile?.number || "",
        complement: userInfo.profile?.complement || "",
        neighborhood: userInfo.profile?.neighborhood || "",
        city: userInfo.profile?.city || "",
        state: userInfo.profile?.state || "",
      });
      // Se já existe CEP, marcar como válido
      if (userInfo.profile?.cep) {
        setCepValid(true);
      }
    }
    setIsEditing(!isEditing);
  };

  const handleSaveEdit = async () => {
    try {
      // Aqui você implementaria a chamada para atualizar o perfil
      console.log('[PERFIL] Salvando alterações:', editingData);
      // await atualizarPerfil(userInfo?.user.id, editingData);
      setIsEditing(false);
      setUserInfo((prev) => 
        prev ? {
          ...prev,
          profile: prev.profile ? {
            ...prev.profile,
            full_name: editingData.full_name || prev.profile.full_name,
            phone: editingData.phone || prev.profile.phone,
            avatar_url: editingData.avatar_url || prev.profile.avatar_url,
            cep: editingData.cep || prev.profile.cep,
            street: editingData.street || prev.profile.street,
            number: editingData.number || prev.profile.number,
            complement: editingData.complement || prev.profile.complement,
            neighborhood: editingData.neighborhood || prev.profile.neighborhood,
            city: editingData.city || prev.profile.city,
            state: editingData.state || prev.profile.state,
          } : null,
        } : null
      );
    } catch (err: any) {
      console.error('[PERFIL] Erro ao salvar:', err);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingData({});
    setCepValid(null);
  };

  const handleCepChange = async (cepValue: string) => {
    // Formatar CEP
    const formatted = formatCEP(cepValue);
    setEditingData({...editingData, cep: formatted});

    // Validar CEP
    const isValid = validarCEP(cepValue);
    setCepValid(isValid ? null : false); // null = não validado ainda, false = inválido

    if (isValid) {
      setCepLoading(true);
      try {
        const resultado = await buscarCEP(cepValue);
        if (resultado) {
          setCepValid(true);
          // Preencher campos automaticamente
          setEditingData(prev => ({
            ...prev,
            street: resultado.street,
            neighborhood: resultado.neighborhood,
            city: resultado.city,
            state: resultado.state,
          }));
          console.log('[PERFIL] CEP preenchido com sucesso:', resultado);
        } else {
          setCepValid(false);
        }
      } catch (err) {
        console.error('[PERFIL] Erro ao buscar CEP:', err);
        setCepValid(false);
      } finally {
        setCepLoading(false);
      }
    }
  };

  const handlePhoneChange = (phoneValue: string) => {
    const formatted = formatTelefone(phoneValue);
    setEditingData({...editingData, phone: formatted});
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header com Título e Botão */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Meu Perfil</h2>
              <p className="text-muted-foreground mt-1">Bem-vindo à sua área exclusiva.</p>
            </div>
            {!isEditing ? (
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleEditClick}
              >
                 Editar Perfil
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleSaveEdit}
                >
                  ✓ Salvar
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  ✕ Cancelar
                </Button>
              </div>
            )}
          </div>

          {/* Grid de 2 colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Esquerda - Informações Pessoais */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informações Pessoais */}
              <div className="border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Informações Pessoais</h3>

                <div className="space-y-4">
                  {/* Nome Completo */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Nome Completo
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editingData.full_name || ""}
                        onChange={(e) => setEditingData({...editingData, full_name: e.target.value})}
                        className="mt-2"
                      />
                    ) : (
                      <>
                        <div className="mt-2 p-3 bg-muted rounded text-foreground font-medium">
                          {userInfo.profile?.full_name || "Não preenchido"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Este campo não pode ser alterado
                        </p>
                      </>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Email
                    </Label>
                    <div className="mt-2 p-3 bg-muted rounded text-foreground">
                      {userInfo.user.email}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Este campo não pode ser alterado
                    </p>
                  </div>

                  {/* UUID */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      UUID
                    </Label>
                    <div className="mt-2 p-3 bg-muted rounded text-foreground font-mono text-xs break-all">
                      {userInfo.user.id}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Este campo não pode ser alterado
                    </p>
                  </div>

                  {/* Permissões */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Permissões
                    </Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {userInfo.roles && userInfo.roles.length > 0 ? (
                        userInfo.roles.map((role) => (
                          <Badge key={role} variant="outline">
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Nenhuma permissão atribuída
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Endereço e Contato */}
              <div className="border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Endereço e Contato</h3>

                <div className="space-y-4">
                  {/* Telefone */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Telefone
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editingData.phone || ""}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="mt-2"
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                      />
                    ) : (
                      <div className="mt-2 p-3 bg-muted rounded text-foreground">
                        {userInfo.profile?.phone || "Não preenchido"}
                      </div>
                    )}
                  </div>

                  {/* Endereço */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Logradouro
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editingData.street || ""}
                        onChange={(e) => setEditingData({...editingData, street: e.target.value})}
                        className="mt-2"
                        placeholder="Rua, avenida, etc."
                      />
                    ) : (
                      <div className="mt-2 p-3 bg-muted rounded text-foreground">
                        {userInfo.profile?.street || "Não preenchido"}
                      </div>
                    )}
                  </div>

                  {/* Número */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Número
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editingData.number || ""}
                        onChange={(e) => setEditingData({...editingData, number: e.target.value})}
                        className="mt-2"
                        placeholder="123"
                      />
                    ) : (
                      <div className="mt-2 p-3 bg-muted rounded text-foreground">
                        {userInfo.profile?.number || "Não preenchido"}
                      </div>
                    )}
                  </div>

                  {/* Complemento */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Complemento
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editingData.complement || ""}
                        onChange={(e) => setEditingData({...editingData, complement: e.target.value})}
                        className="mt-2"
                        placeholder="Apto 42, Bloco B, etc."
                      />
                    ) : (
                      <div className="mt-2 p-3 bg-muted rounded text-foreground">
                        {userInfo.profile?.complement || "Não preenchido"}
                      </div>
                    )}
                  </div>

                  {/* Bairro */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Bairro
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editingData.neighborhood || ""}
                        onChange={(e) => setEditingData({...editingData, neighborhood: e.target.value})}
                        className="mt-2"
                        placeholder="Vila, bairro, etc."
                      />
                    ) : (
                      <div className="mt-2 p-3 bg-muted rounded text-foreground">
                        {userInfo.profile?.neighborhood || "Não preenchido"}
                      </div>
                    )}
                  </div>

                  {/* Cidade */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Cidade
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editingData.city || ""}
                        onChange={(e) => setEditingData({...editingData, city: e.target.value})}
                        className="mt-2"
                        placeholder="São Paulo"
                      />
                    ) : (
                      <div className="mt-2 p-3 bg-muted rounded text-foreground">
                        {userInfo.profile?.city || "Não preenchido"}
                      </div>
                    )}
                  </div>

                  {/* Estado */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Estado
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editingData.state || ""}
                        onChange={(e) => setEditingData({...editingData, state: e.target.value})}
                        className="mt-2"
                        placeholder="SP"
                        maxLength={2}
                      />
                    ) : (
                      <div className="mt-2 p-3 bg-muted rounded text-foreground">
                        {userInfo.profile?.state || "Não preenchido"}
                      </div>
                    )}
                  </div>

                  {/* CEP */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      CEP
                    </Label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <Input
                              value={editingData.cep || ""}
                              onChange={(e) => handleCepChange(e.target.value)}
                              className="mt-2"
                              placeholder="00000-000"
                              maxLength={9}
                              disabled={cepLoading}
                            />
                          </div>
                          {cepValid === true && (
                            <CheckCircle className="h-5 w-5 text-green-500 mb-2" />
                          )}
                          {cepValid === false && (
                            <XCircle className="h-5 w-5 text-red-500 mb-2" />
                          )}
                        </div>
                        {cepLoading && (
                          <p className="text-xs text-muted-foreground">Buscando CEP...</p>
                        )}
                        {cepValid === false && (
                          <p className="text-xs text-red-500">CEP inválido ou não encontrado</p>
                        )}
                        {cepValid === true && (
                          <p className="text-xs text-green-500">✓ CEP preenchido com sucesso</p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 p-3 bg-muted rounded text-foreground">
                        {userInfo.profile?.cep || "Não preenchido"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Direita - Foto do Perfil */}
            <div>
              <div className="border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Foto do Perfil</h3>

                {isEditing ? (
                  <div className="space-y-4">
                    <UploadAvatar
                      userId={userInfo.user.id}
                      currentAvatarUrl={editingData.avatar_url || userInfo.profile?.avatar_url || "/avatars/01.png"}
                      onAvatarChange={(newUrl) => setEditingData({...editingData, avatar_url: newUrl})}
                      userName={editingData.full_name || userInfo.profile?.full_name || "Usuário"}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage
                        src={userInfo.profile?.avatar_url || "/avatars/01.png"}
                        alt={userInfo.profile?.full_name || "Usuário"}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                        {getInitials(userInfo.profile?.full_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {getInitials(userInfo.profile?.full_name)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Informações de Status */}
                <div className="mt-6 pt-6 border-t border-border space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Status
                    </Label>
                    <div className="mt-2">
                      <Badge
                        variant={
                          userInfo.profile?.disabled ? "destructive" : "default"
                        }
                      >
                        {userInfo.profile?.disabled ? "Desabilitado" : "Ativo"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botão Voltar */}
          <div className="flex gap-3 pb-6">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="hover:bg-primary/10 hover:text-primary dark:hover:bg-accent dark:hover:text-accent-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
