// lib/api.ts

import { ENV_CONFIG } from '@/lib/env-config';
import { API_KEY } from '@/lib/config';

export type ApiOk<T = any> = {
  success?: boolean;
  data: T;
  message?: string;
  pagination?: {
    current_page?: number;
    per_page?: number;
    total_pages?: number;
    total?: number;
  };
};

// ===== TIPOS COMUNS =====
export type Endereco = {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
};

// ===== PACIENTES =====
export type Paciente = {
  id: string;
  full_name: string;
  social_name?: string | null;
  cpf?: string;
  rg?: string | null;
  sex?: string | null;
  birth_date?: string | null;
  phone_mobile?: string;
  email?: string;
  cep?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  notes?: string | null;
};

export type PacienteInput = {
  full_name: string;
  social_name?: string | null;
  cpf: string;
  rg?: string | null;
  sex?: string | null;
  birth_date?: string | null;
  phone_mobile?: string | null;
  email?: string | null;
  cep?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  notes?: string | null;
};


// ===== MÉDICOS =====
export type FormacaoAcademica = {
  instituicao: string;
  curso: string;
  ano_conclusao: string;
};

export type DadosBancarios = {
  banco: string;
  agencia: string;
  conta: string;
  tipo_conta: string;
};

// ===== MÉDICOS =====
export type Medico = {
  id: string;
  full_name: string;  // Altere 'nome' para 'full_name'
  nome_social?: string | null;
  cpf?: string;
  rg?: string | null;
  sexo?: string | null;
  data_nascimento?: string | null;
  telefone?: string;
  celular?: string;
  contato_emergencia?: string;
  email?: string;
  crm?: string;
  estado_crm?: string;
  rqe?: string;
  formacao_academica?: FormacaoAcademica[];
  curriculo_url?: string | null;
  especialidade?: string;
  observacoes?: string | null;
  foto_url?: string | null;
  tipo_vinculo?: string;
  dados_bancarios?: DadosBancarios;
  agenda_horario?: string;
  valor_consulta?: number | string;
  active?: boolean;
  cep?: string;
  city?: string;
  complement?: string;
  neighborhood?: string;
  number?: string;
  phone2?: string;
  state?: string;
  street?: string;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  user_id?: string;
};


// ===== MÉDICOS =====
// ...existing code...
export type MedicoInput = {
  user_id?: string | null;
  crm: string;
  crm_uf: string;
  specialty: string;
  full_name: string;
  cpf: string;
  email: string;
  phone_mobile: string;
  phone2?: string | null;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  birth_date: string | null;
  rg?: string | null;
  active?: boolean;
  created_by?: string | null;
  updated_by?: string | null;
};



// ===== CONFIG =====
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "https://yuanqfswhberkoevtmfr.supabase.co";
const REST = `${API_BASE}/rest/v1`;

// Token salvo no browser (aceita auth_token ou token)
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("auth_token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("auth_token") ||
    sessionStorage.getItem("token")
  );
}

// Cabeçalhos base
function baseHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    apikey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1YW5xZnN3aGJlcmtvZXZ0bWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NTQzNjksImV4cCI6MjA3MDUzMDM2OX0.g8Fm4XAvtX46zifBZnYVH4tVuQkqUH6Ia9CXQj4DztQ",
    Accept: "application/json",
  };
  const jwt = getAuthToken();
  if (jwt) h.Authorization = `Bearer ${jwt}`;
  return h;
}

// Para POST/PATCH/DELETE e para GET com count
function withPrefer(h: Record<string, string>, prefer: string) {
  return { ...h, Prefer: prefer };
}

// Parse genérico
async function parse<T>(res: Response): Promise<T> {
  let json: any = null;
  try {
    json = await res.json();
  } catch (err) {
    console.error("Erro ao parsear a resposta:", err);
  }

  if (!res.ok) {
    console.error("[API ERROR]", res.url, res.status, json);
    const code = (json && (json.error?.code || json.code)) ?? res.status;
    const msg = (json && (json.error?.message || json.message)) ?? res.statusText;
    
    // Mensagens amigáveis para erros comuns
    let friendlyMessage = `${code}: ${msg}`;
    
    // Erro de CPF duplicado
    if (code === '23505' && msg.includes('patients_cpf_key')) {
      friendlyMessage = 'Já existe um paciente cadastrado com este CPF. Por favor, verifique se o paciente já está registrado no sistema ou use um CPF diferente.';
    }
    // Erro de email duplicado (paciente)
    else if (code === '23505' && msg.includes('patients_email_key')) {
      friendlyMessage = 'Já existe um paciente cadastrado com este email. Por favor, use um email diferente.';
    }
    // Erro de CRM duplicado (médico)
    else if (code === '23505' && msg.includes('doctors_crm')) {
      friendlyMessage = 'Já existe um médico cadastrado com este CRM. Por favor, verifique se o médico já está registrado no sistema.';
    }
    // Erro de email duplicado (médico)
    else if (code === '23505' && msg.includes('doctors_email_key')) {
      friendlyMessage = 'Já existe um médico cadastrado com este email. Por favor, use um email diferente.';
    }
    // Outros erros de constraint unique
    else if (code === '23505') {
      friendlyMessage = 'Registro duplicado: já existe um cadastro com essas informações no sistema.';
    }
    
    throw new Error(friendlyMessage);
  }

  return (json?.data ?? json) as T;
}


// Helper de paginação (Range/Range-Unit)
function rangeHeaders(page?: number, limit?: number): Record<string, string> {
  if (!page || !limit) return {};
  const start = (page - 1) * limit;
  const end = start + limit - 1;
  return { Range: `${start}-${end}`, "Range-Unit": "items" };
}

// ===== PACIENTES (CRUD) =====
export async function listarPacientes(params?: {
  page?: number;
  limit?: number;
  q?: string;
}): Promise<Paciente[]> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);

  const url = `${REST}/patients${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...baseHeaders(),
      ...rangeHeaders(params?.page, params?.limit),
    },
  });
  return await parse<Paciente[]>(res);
}


// Nova função para busca avançada de pacientes
export async function buscarPacientes(termo: string): Promise<Paciente[]> {
  if (!termo || termo.trim().length < 2) {
    return [];
  }
  
  const searchTerm = termo.toLowerCase().trim();
  const digitsOnly = searchTerm.replace(/\D/g, '');
  
  // Monta queries para buscar em múltiplos campos
  const queries = [];
  
  // Busca por ID se parece com UUID
  if (searchTerm.includes('-') && searchTerm.length > 10) {
    queries.push(`id=eq.${searchTerm}`);
  }
  
  // Busca por CPF (com e sem formatação)
  if (digitsOnly.length >= 11) {
    queries.push(`cpf=eq.${digitsOnly}`);
  } else if (digitsOnly.length >= 3) {
    queries.push(`cpf=ilike.*${digitsOnly}*`);
  }
  
  // Busca por nome (usando ilike para busca case-insensitive)
  if (searchTerm.length >= 2) {
    queries.push(`full_name=ilike.*${searchTerm}*`);
    queries.push(`social_name=ilike.*${searchTerm}*`);
  }
  
  // Busca por email se contém @
  if (searchTerm.includes('@')) {
    queries.push(`email=ilike.*${searchTerm}*`);
  }
  
  const results: Paciente[] = [];
  const seenIds = new Set<string>();
  
  // Executa as buscas e combina resultados únicos
  for (const query of queries) {
    try {
      const url = `${REST}/patients?${query}&limit=10`;
      const res = await fetch(url, { method: "GET", headers: baseHeaders() });
      const arr = await parse<Paciente[]>(res);
      
      if (arr?.length > 0) {
        for (const paciente of arr) {
          if (!seenIds.has(paciente.id)) {
            seenIds.add(paciente.id);
            results.push(paciente);
          }
        }
      }
    } catch (error) {
      console.warn(`Erro na busca com query: ${query}`, error);
    }
  }
  
  return results.slice(0, 20); // Limita a 20 resultados
}

export async function buscarPacientePorId(id: string | number): Promise<Paciente> {
  // Se for string e não for só número, coloca aspas duplas (para UUID/texto)
  let idParam: string | number = id;
  if (typeof id === 'string' && isNaN(Number(id))) {
    idParam = `\"${id}\"`;
  }
  const url = `${REST}/patients?id=eq.${idParam}`;
  const res = await fetch(url, { method: "GET", headers: baseHeaders() });
  const arr = await parse<Paciente[]>(res);
  if (!arr?.length) throw new Error("404: Paciente não encontrado");
  return arr[0];
}

export async function criarPaciente(input: PacienteInput): Promise<Paciente> {
  const url = `${REST}/patients`;
  const res = await fetch(url, {
    method: "POST",
    headers: withPrefer({ ...baseHeaders(), "Content-Type": "application/json" }, "return=representation"),
    body: JSON.stringify(input),
  });
  const arr = await parse<Paciente[] | Paciente>(res);
  return Array.isArray(arr) ? arr[0] : (arr as Paciente);
}

export async function atualizarPaciente(id: string | number, input: PacienteInput): Promise<Paciente> {
  const url = `${REST}/patients?id=eq.${id}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: withPrefer({ ...baseHeaders(), "Content-Type": "application/json" }, "return=representation"),
    body: JSON.stringify(input),
  });
  const arr = await parse<Paciente[] | Paciente>(res);
  return Array.isArray(arr) ? arr[0] : (arr as Paciente);
}

export async function excluirPaciente(id: string | number): Promise<void> {
  const url = `${REST}/patients?id=eq.${id}`;
  const res = await fetch(url, { method: "DELETE", headers: baseHeaders() });
  await parse<any>(res);
}
// ===== PACIENTES (Extra: verificação de CPF duplicado) =====
export async function verificarCpfDuplicado(cpf: string): Promise<boolean> {
  const clean = (cpf || "").replace(/\D/g, "");
  const url = `${API_BASE}/rest/v1/patients?cpf=eq.${clean}&select=id`;

  const res = await fetch(url, {
    method: "GET",
    headers: baseHeaders(),
  });

  const data = await res.json().catch(() => []);
  return Array.isArray(data) && data.length > 0;
}


// ===== MÉDICOS (CRUD) =====
export async function listarMedicos(params?: {
  page?: number;
  limit?: number;
  q?: string;
}): Promise<Medico[]> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);

  const url = `${REST}/doctors${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...baseHeaders(),
      ...rangeHeaders(params?.page, params?.limit),
    },
  });
  return await parse<Medico[]>(res);
}

// Nova função para busca avançada de médicos
export async function buscarMedicos(termo: string): Promise<Medico[]> {
  if (!termo || termo.trim().length < 2) {
    return [];
  }
  
  const searchTerm = termo.toLowerCase().trim();
  const digitsOnly = searchTerm.replace(/\D/g, '');
  
  // Monta queries para buscar em múltiplos campos
  const queries = [];
  
  // Busca por ID se parece com UUID
  if (searchTerm.includes('-') && searchTerm.length > 10) {
    queries.push(`id=eq.${searchTerm}`);
  }
  
  // Busca por CRM (com e sem formatação)
  if (digitsOnly.length >= 3) {
    queries.push(`crm=ilike.*${digitsOnly}*`);
  }
  
  // Busca por nome (usando ilike para busca case-insensitive)
  if (searchTerm.length >= 2) {
    queries.push(`full_name=ilike.*${searchTerm}*`);
    queries.push(`nome_social=ilike.*${searchTerm}*`);
  }
  
  // Busca por email se contém @
  if (searchTerm.includes('@')) {
    queries.push(`email=ilike.*${searchTerm}*`);
  }
  
  // Busca por especialidade
  if (searchTerm.length >= 2) {
    queries.push(`specialty=ilike.*${searchTerm}*`);
  }
  
  const results: Medico[] = [];
  const seenIds = new Set<string>();
  
  // Executa as buscas e combina resultados únicos
  for (const query of queries) {
    try {
      const url = `${REST}/doctors?${query}&limit=10`;
      const res = await fetch(url, { method: "GET", headers: baseHeaders() });
      const arr = await parse<Medico[]>(res);
      
      if (arr?.length > 0) {
        for (const medico of arr) {
          if (!seenIds.has(medico.id)) {
            seenIds.add(medico.id);
            results.push(medico);
          }
        }
      }
    } catch (error) {
      console.warn(`Erro na busca com query: ${query}`, error);
    }
  }
  
  return results.slice(0, 20); // Limita a 20 resultados
}

export async function buscarMedicoPorId(id: string | number): Promise<Medico> {
  // Primeiro tenta buscar no Supabase (dados reais)
  try {
    const url = `${REST}/doctors?id=eq.${id}`;
    const res = await fetch(url, { method: "GET", headers: baseHeaders() });
    const arr = await parse<Medico[]>(res);
    if (arr && arr.length > 0) {
      console.log('✅ Médico encontrado no Supabase:', arr[0]);
      console.log('🔍 Campo especialidade no médico:', {
        especialidade: arr[0].especialidade,
        specialty: (arr[0] as any).specialty,
        hasEspecialidade: !!arr[0].especialidade,
        hasSpecialty: !!((arr[0] as any).specialty)
      });
      return arr[0];
    }
  } catch (error) {
    console.warn('⚠️ Erro ao buscar no Supabase, tentando mock API:', error);
  }
  
  // Se não encontrar no Supabase, tenta o mock API
  try {
    const url = `https://mock.apidog.com/m1/1053378-0-default/rest/v1/doctors/${id}`;
    const res = await fetch(url, { 
      method: "GET", 
      headers: {
        "Accept": "application/json"
      }
    });
    
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error("404: Médico não encontrado");
      }
      throw new Error(`Erro ao buscar médico: ${res.status} ${res.statusText}`);
    }
    
    const medico = await res.json();
    console.log('✅ Médico encontrado no Mock API:', medico);
    return medico as Medico;
  } catch (error) {
    console.error('❌ Erro ao buscar médico em ambas as APIs:', error);
    throw new Error("404: Médico não encontrado");
  }
}

// Dentro de lib/api.ts
export async function criarMedico(input: MedicoInput): Promise<Medico> {
  console.log("Enviando os dados para a API:", input);  // Log para depuração
  
  const url = `${REST}/doctors`;  // Endpoint de médicos
  const res = await fetch(url, {
    method: "POST",
    headers: withPrefer({ ...baseHeaders(), "Content-Type": "application/json" }, "return=representation"),
    body: JSON.stringify(input), // Enviando os dados padronizados
  });

  const arr = await parse<Medico[] | Medico>(res); // Resposta da API
  return Array.isArray(arr) ? arr[0] : (arr as Medico);  // Retorno do médico
}




export async function atualizarMedico(id: string | number, input: MedicoInput): Promise<Medico> {
  console.log(`🔄 Tentando atualizar médico ID: ${id}`);
  console.log(`📤 Payload original:`, input);
  
  // Criar um payload limpo apenas com campos básicos que sabemos que existem
  const cleanPayload = {
    full_name: input.full_name,
    crm: input.crm,
    specialty: input.specialty,
    email: input.email,
    phone_mobile: input.phone_mobile,
    cpf: input.cpf,
    cep: input.cep,
    street: input.street,
    number: input.number,
    city: input.city,
    state: input.state,
    active: input.active ?? true
  };
  
  console.log(`📤 Payload limpo:`, cleanPayload);
  
  // Atualizar apenas no Supabase (dados reais)
  try {
    const url = `${REST}/doctors?id=eq.${id}`;
    console.log(`🌐 URL de atualização: ${url}`);
    
    const res = await fetch(url, {
      method: "PATCH",
      headers: withPrefer({ ...baseHeaders(), "Content-Type": "application/json" }, "return=representation"),
      body: JSON.stringify(cleanPayload),
    });
    
    console.log(`📡 Resposta do servidor: ${res.status} ${res.statusText}`);
    
    if (res.ok) {
      const arr = await parse<Medico[] | Medico>(res);
      const result = Array.isArray(arr) ? arr[0] : (arr as Medico);
      console.log('✅ Médico atualizado no Supabase:', result);
      return result;
    } else {
      // Vamos tentar ver o erro detalhado
      const errorText = await res.text();
      console.error(`❌ Erro detalhado do Supabase:`, {
        status: res.status,
        statusText: res.statusText,
        response: errorText,
        headers: Object.fromEntries(res.headers.entries())
      });
      throw new Error(`Supabase error: ${res.status} ${res.statusText} - ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar médico:', error);
    throw error;
  }
}

export async function excluirMedico(id: string | number): Promise<void> {
  const url = `${REST}/doctors?id=eq.${id}`;
  const res = await fetch(url, { method: "DELETE", headers: baseHeaders() });
  await parse<any>(res);
}

// ===== USUÁRIOS =====
export type UserRole = {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
};

export async function listarUserRoles(): Promise<UserRole[]> {
  const url = `https://mock.apidog.com/m1/1053378-0-default/rest/v1/user_roles`;
  const res = await fetch(url, {
    method: "GET",
    headers: baseHeaders(),
  });
  return await parse<UserRole[]>(res);
}

export type User = {
  id: string;
  email: string;
  email_confirmed_at: string;
  created_at: string;
  last_sign_in_at: string;
};

export type CurrentUser = {
  id: string;
  email: string;
  email_confirmed_at: string;
  created_at: string;
  last_sign_in_at: string;
};

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string;
  disabled: boolean;
  created_at: string;
  updated_at: string;
};

export type ProfileInput = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;

export type Permissions = {
  isAdmin: boolean;
  isManager: boolean;
  isDoctor: boolean;
  isSecretary: boolean;
  isAdminOrManager: boolean;
};

export type UserInfo = {
  user: User;
  profile: Profile;
  roles: string[];
  permissions: Permissions;
};

export async function getCurrentUser(): Promise<CurrentUser> {
  const url = `https://mock.apidog.com/m1/1053378-0-default/auth/v1/user`;
  const res = await fetch(url, {
    method: "GET",
    headers: baseHeaders(),
  });
  return await parse<CurrentUser>(res);
}

export async function getUserInfo(): Promise<UserInfo> {
  const url = `https://mock.apidog.com/m1/1053378-0-default/functions/v1/user-info`;
  const res = await fetch(url, {
    method: "GET",
    headers: baseHeaders(),
  });
  return await parse<UserInfo>(res);
}

export type CreateUserInput = {
  email: string;
  full_name: string;
  phone: string;
  role: string;
  password?: string;
};

export type CreatedUser = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
};

export type CreateUserResponse = {
  success: boolean;
  user: CreatedUser;
  password?: string;
};

export type CreateUserWithPasswordResponse = {
  success: boolean;
  user: CreatedUser;
  email: string;
  password: string;
};

// Função para gerar senha aleatória (formato: senhaXXX!)
export function gerarSenhaAleatoria(): string {
  const num1 = Math.floor(Math.random() * 10);
  const num2 = Math.floor(Math.random() * 10);
  const num3 = Math.floor(Math.random() * 10);
  return `senha${num1}${num2}${num3}!`;
}

export async function criarUsuario(input: CreateUserInput): Promise<CreateUserResponse> {
  const url = `https://mock.apidog.com/m1/1053378-0-default/functions/v1/create-user`;
  const res = await fetch(url, {
    method: "POST",
    headers: { ...baseHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return await parse<CreateUserResponse>(res);
}

// ============================================
// CRIAÇÃO DE USUÁRIOS NO SUPABASE AUTH
// Vínculo com pacientes/médicos por EMAIL
// ============================================

// Criar usuário para MÉDICO no Supabase Auth (sistema de autenticação)
export async function criarUsuarioMedico(medico: {
  email: string;
  full_name: string;
  phone_mobile: string;
}): Promise<CreateUserWithPasswordResponse> {
  
  const senha = gerarSenhaAleatoria();
  
  console.log('🏥 [CRIAR MÉDICO] Iniciando criação no Supabase Auth...');
  console.log('📧 Email:', medico.email);
  console.log('👤 Nome:', medico.full_name);
  console.log('📱 Telefone:', medico.phone_mobile);
  console.log('🔑 Senha gerada:', senha);
  
  // Endpoint do Supabase Auth (mesmo que auth.ts usa)
  const signupUrl = `${ENV_CONFIG.SUPABASE_URL}/auth/v1/signup`;
  
  const payload = {
    email: medico.email,
    password: senha,
    data: {
      userType: 'profissional', // Para login em /login -> /profissional
      full_name: medico.full_name,
      phone: medico.phone_mobile,
    }
  };
  
  console.log('📤 [CRIAR MÉDICO] Enviando para:', signupUrl);
  
  try {
    const response = await fetch(signupUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "apikey": API_KEY,
      },
      body: JSON.stringify(payload),
    });
    
    console.log('📋 [CRIAR MÉDICO] Status da resposta:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [CRIAR MÉDICO] Erro na resposta:', errorText);
      
      // Tenta parsear o erro para pegar mensagem específica
      let errorMsg = `Erro ao criar usuário (${response.status})`;
      try {
        const errorData = JSON.parse(errorText);
        errorMsg = errorData.msg || errorData.message || errorData.error_description || errorMsg;
        
        // Mensagens amigáveis para erros comuns
        if (errorMsg.includes('already registered') || errorMsg.includes('already exists')) {
          errorMsg = 'Este email já está cadastrado no sistema';
        } else if (errorMsg.includes('invalid email')) {
          errorMsg = 'Formato de email inválido';
        } else if (errorMsg.includes('weak password')) {
          errorMsg = 'Senha muito fraca';
        }
      } catch (e) {
        // Se não conseguir parsear, usa mensagem genérica
      }
      
      throw new Error(errorMsg);
    }
    
    const responseData = await response.json();
    console.log('✅ [CRIAR MÉDICO] Usuário criado com sucesso no Supabase Auth!');
    console.log('🆔 User ID:', responseData.user?.id || responseData.id);
    
    // 🔧 AUTO-CONFIRMAR EMAIL: Fazer login automático logo após criar usuário
    // Isso força o Supabase a confirmar o email automaticamente
    if (responseData.user?.email_confirmed_at === null || !responseData.user?.email_confirmed_at) {
      console.warn('⚠️ [CRIAR MÉDICO] Email NÃO confirmado - tentando auto-confirmar via login...');
      
      try {
        const loginUrl = `${ENV_CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=password`;
        console.log('🔧 [AUTO-CONFIRMAR] Fazendo login automático para confirmar email...');
        
        const loginResponse = await fetch(loginUrl, {
          method: 'POST',
          headers: {
            'apikey': ENV_CONFIG.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: medico.email,
            password: senha,
          }),
        });
        
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          console.log('✅ [AUTO-CONFIRMAR] Login automático realizado com sucesso!');
          console.log('📦 [AUTO-CONFIRMAR] Email confirmado:', loginData.user?.email_confirmed_at ? 'SIM ✅' : 'NÃO ❌');
          
          // Atualizar responseData com dados do login (que tem email confirmado)
          if (loginData.user) {
            responseData.user = loginData.user;
          }
        } else {
          const errorText = await loginResponse.text();
          console.error('❌ [AUTO-CONFIRMAR] Falha no login automático:', loginResponse.status, errorText);
          console.warn('⚠️ [AUTO-CONFIRMAR] Usuário pode não conseguir fazer login imediatamente!');
        }
      } catch (confirmError) {
        console.error('❌ [AUTO-CONFIRMAR] Erro ao tentar fazer login automático:', confirmError);
        console.warn('⚠️ [AUTO-CONFIRMAR] Continuando sem confirmação automática...');
      }
    } else {
      console.log('✅ [CRIAR MÉDICO] Email confirmado automaticamente!');
    }
    
    // Log bem visível com as credenciais para teste
    console.log('🔐🔐🔐 ========================================');
    console.log('🔐 CREDENCIAIS DO MÉDICO CRIADO:');
    console.log('🔐 Email:', medico.email);
    console.log('🔐 Senha:', senha);
    console.log('🔐 Pode fazer login?', responseData.user?.email_confirmed_at ? 'SIM ✅' : 'NÃO ❌ (precisa confirmar email)');
    console.log('🔐 ========================================');
    
    return {
      success: true,
      user: responseData.user || responseData,
      email: medico.email,
      password: senha,
    };
    
  } catch (error: any) {
    console.error('❌ [CRIAR MÉDICO] Erro ao criar usuário:', error);
    throw error;
  }
}

// Criar usuário para PACIENTE no Supabase Auth (sistema de autenticação)
export async function criarUsuarioPaciente(paciente: {
  email: string;
  full_name: string;
  phone_mobile: string;
}): Promise<CreateUserWithPasswordResponse> {
  
  const senha = gerarSenhaAleatoria();
  
  console.log('🏥 [CRIAR PACIENTE] Iniciando criação no Supabase Auth...');
  console.log('📧 Email:', paciente.email);
  console.log('👤 Nome:', paciente.full_name);
  console.log('📱 Telefone:', paciente.phone_mobile);
  console.log('🔑 Senha gerada:', senha);
  
  // Endpoint do Supabase Auth (mesmo que auth.ts usa)
  const signupUrl = `${ENV_CONFIG.SUPABASE_URL}/auth/v1/signup`;
  
  const payload = {
    email: paciente.email,
    password: senha,
    data: {
      userType: 'paciente', // Para login em /login-paciente -> /paciente
      full_name: paciente.full_name,
      phone: paciente.phone_mobile,
    }
  };
  
  console.log('📤 [CRIAR PACIENTE] Enviando para:', signupUrl);
  
  try {
    const response = await fetch(signupUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "apikey": API_KEY,
      },
      body: JSON.stringify(payload),
    });
    
    console.log('📋 [CRIAR PACIENTE] Status da resposta:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [CRIAR PACIENTE] Erro na resposta:', errorText);
      
      // Tenta parsear o erro para pegar mensagem específica
      let errorMsg = `Erro ao criar usuário (${response.status})`;
      try {
        const errorData = JSON.parse(errorText);
        errorMsg = errorData.msg || errorData.message || errorData.error_description || errorMsg;
        
        // Mensagens amigáveis para erros comuns
        if (errorMsg.includes('already registered') || errorMsg.includes('already exists')) {
          errorMsg = 'Este email já está cadastrado no sistema';
        } else if (errorMsg.includes('invalid email')) {
          errorMsg = 'Formato de email inválido';
        } else if (errorMsg.includes('weak password')) {
          errorMsg = 'Senha muito fraca';
        }
      } catch (e) {
        // Se não conseguir parsear, usa mensagem genérica
      }
      
      throw new Error(errorMsg);
    }
    
    const responseData = await response.json();
    console.log('✅ [CRIAR PACIENTE] Usuário criado com sucesso no Supabase Auth!');
    console.log('🆔 User ID:', responseData.user?.id || responseData.id);
    console.log('📦 [CRIAR PACIENTE] Resposta completa do Supabase:', JSON.stringify(responseData, null, 2));
    
    // VERIFICAÇÃO CRÍTICA: O usuário foi realmente criado?
    if (!responseData.user && !responseData.id) {
      console.error('⚠️⚠️⚠️ AVISO: Supabase retornou sucesso mas SEM user ID!');
      console.error('Isso pode significar que o usuário NÃO foi criado de verdade!');
    }
    
    const userId = responseData.user?.id || responseData.id;
    
    // 🔧 AUTO-CONFIRMAR EMAIL: Fazer login automático logo após criar usuário
    // Isso força o Supabase a confirmar o email automaticamente
    if (responseData.user?.email_confirmed_at === null || !responseData.user?.email_confirmed_at) {
      console.warn('⚠️ [CRIAR PACIENTE] Email NÃO confirmado - tentando auto-confirmar via login...');
      
      try {
        const loginUrl = `${ENV_CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=password`;
        console.log('🔧 [AUTO-CONFIRMAR] Fazendo login automático para confirmar email...');
        
        const loginResponse = await fetch(loginUrl, {
          method: 'POST',
          headers: {
            'apikey': ENV_CONFIG.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: paciente.email,
            password: senha,
          }),
        });
        
        console.log('🔍 [AUTO-CONFIRMAR] Status do login automático:', loginResponse.status);
        
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          console.log('✅ [AUTO-CONFIRMAR] Login automático realizado com sucesso!');
          console.log('📦 [AUTO-CONFIRMAR] Dados completos do login:', JSON.stringify(loginData, undefined, 2));
          console.log('📧 [AUTO-CONFIRMAR] Email confirmado:', loginData.user?.email_confirmed_at ? 'SIM ✅' : 'NÃO ❌');
          console.log('👤 [AUTO-CONFIRMAR] UserType no metadata:', loginData.user?.user_metadata?.userType);
          console.log('🎯 [AUTO-CONFIRMAR] Email verified:', loginData.user?.user_metadata?.email_verified);
          
          // Atualizar responseData com dados do login (que tem email confirmado)
          if (loginData.user) {
            responseData.user = loginData.user;
          }
        } else {
          const errorText = await loginResponse.text();
          console.error('❌ [AUTO-CONFIRMAR] Falha no login automático:', loginResponse.status, errorText);
          console.warn('⚠️ [AUTO-CONFIRMAR] Usuário pode não conseguir fazer login imediatamente!');
          
          // Tentar parsear o erro para entender melhor
          try {
            const errorData = JSON.parse(errorText);
            console.error('📋 [AUTO-CONFIRMAR] Detalhes do erro:', errorData);
          } catch (e) {
            console.error('📋 [AUTO-CONFIRMAR] Erro não é JSON:', errorText);
          }
        }
      } catch (confirmError) {
        console.error('❌ [AUTO-CONFIRMAR] Erro ao tentar fazer login automático:', confirmError);
        console.warn('⚠️ [AUTO-CONFIRMAR] Continuando sem confirmação automática...');
      }
    } else {
      console.log('✅ [CRIAR PACIENTE] Email confirmado automaticamente!');
    }
    
    // Log bem visível com as credenciais para teste
    console.log('🔐🔐🔐 ========================================');
    console.log('🔐 CREDENCIAIS DO PACIENTE CRIADO:');
    console.log('🔐 Email:', paciente.email);
    console.log('🔐 Senha:', senha);
    console.log('🔐 UserType:', 'paciente');
    console.log('🔐 Pode fazer login?', responseData.user?.email_confirmed_at ? 'SIM ✅' : 'NÃO ❌ (precisa confirmar email)');
    console.log('🔐 ========================================');
    
    return {
      success: true,
      user: responseData.user || responseData,
      email: paciente.email,
      password: senha,
    };
    
  } catch (error: any) {
    console.error('❌ [CRIAR PACIENTE] Erro ao criar usuário:', error);
    throw error;
  }
}

// ===== CEP (usado nos formulários) =====
export async function buscarCepAPI(cep: string): Promise<{
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}> {
  const clean = (cep || "").replace(/\D/g, "");
  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    const json = await res.json();
    if (json?.erro) return { erro: true };
    return {
      logradouro: json.logradouro ?? "",
      bairro: json.bairro ?? "",
      localidade: json.localidade ?? "",
      uf: json.uf ?? "",
      erro: false,
    };
  } catch {
    return { erro: true };
  }
}

// ===== Stubs pra não quebrar imports dos forms (sem rotas de storage na doc) =====
export async function listarAnexos(_id: string | number): Promise<any[]> { return []; }
export async function adicionarAnexo(_id: string | number, _file: File): Promise<any> { return {}; }
export async function removerAnexo(_id: string | number, _anexoId: string | number): Promise<void> {}
export async function uploadFotoPaciente(_id: string | number, _file: File): Promise<{ foto_url?: string; thumbnail_url?: string }> { return {}; }
export async function removerFotoPaciente(_id: string | number): Promise<void> {}
export async function listarAnexosMedico(_id: string | number): Promise<any[]> { return []; }
export async function adicionarAnexoMedico(_id: string | number, _file: File): Promise<any> { return {}; }
export async function removerAnexoMedico(_id: string | number, _anexoId: string | number): Promise<void> {}
export async function uploadFotoMedico(_id: string | number, _file: File): Promise<{ foto_url?: string; thumbnail_url?: string }> { return {}; }
export async function removerFotoMedico(_id: string | number): Promise<void> {}

// ===== PERFIS DE USUÁRIOS =====
export async function listarPerfis(): Promise<Profile[]> {
  const url = `https://mock.apidog.com/m1/1053378-0-default/rest/v1/profiles`;
  const res = await fetch(url, {
    method: "GET",
    headers: baseHeaders(),
  });
  return await parse<Profile[]>(res);
}

