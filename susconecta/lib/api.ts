

export type ApiOk<T = any> = {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    current_page?: number;
    per_page?: number;
    total_pages?: number;
    total?: number;
  };
};

export type Endereco = {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
};

export type Paciente = {
  id: string;
  nome?: string;
  nome_social?: string | null;
  cpf?: string;
  rg?: string | null;
  sexo?: string | null;
  data_nascimento?: string | null;
  telefone?: string;
  email?: string;
  endereco?: Endereco;
  observacoes?: string | null;
  foto_url?: string | null;
};

export type PacienteInput = {
  nome: string;
  nome_social?: string | null;
  cpf: string;
  rg?: string | null;
  sexo?: string | null;
  data_nascimento?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: {
    cep?: string | null;
    logradouro?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    estado?: string | null;
  };
  observacoes?: string | null;
};



const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://mock.apidog.com/m1/1053378-0-default";
const MEDICOS_BASE = process.env.NEXT_PUBLIC_MEDICOS_BASE_PATH ?? "/medicos";

export const PATHS = {
  // Pacientes (já existia)
  pacientes: "/pacientes",
  pacienteId: (id: string | number) => `/pacientes/${id}`,
  foto: (id: string | number) => `/pacientes/${id}/foto`,
  anexos: (id: string | number) => `/pacientes/${id}/anexos`,
  anexoId: (id: string | number, anexoId: string | number) => `/pacientes/${id}/anexos/${anexoId}`,
  validarCPF: "/pacientes/validar-cpf",
  cep: (cep: string) => `/utils/cep/${cep}`,

  // Médicos (APONTANDO PARA PACIENTES por enquanto)
  medicos: MEDICOS_BASE,
  medicoId: (id: string | number) => `${MEDICOS_BASE}/${id}`,
  medicoFoto: (id: string | number) => `${MEDICOS_BASE}/${id}/foto`,
  medicoAnexos: (id: string | number) => `${MEDICOS_BASE}/${id}/anexos`,
  medicoAnexoId: (id: string | number, anexoId: string | number) => `${MEDICOS_BASE}/${id}/anexos/${anexoId}`,
} as const;


// Função para obter o token JWT do localStorage
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

function headers(kind: "json" | "form" = "json"): Record<string, string> {
  const h: Record<string, string> = {};
  
  // API Key da Supabase sempre necessária
  h.apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1YW5xZnN3aGJlcmtvZXZ0bWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NTQzNjksImV4cCI6MjA3MDUzMDM2OX0.g8Fm4XAvtX46zifBZnYVH4tVuQkqUH6Ia9CXQj4DztQ";
  
  // Bearer Token quando usuário está logado
  const jwtToken = getAuthToken();
  if (jwtToken) {
    h.Authorization = `Bearer ${jwtToken}`;
  }
  
  if (kind === "json") h["Content-Type"] = "application/json";
  return h;
}

function logAPI(title: string, info: { url?: string; payload?: any; result?: any } = {}) {
  try {
    console.group(`[API] ${title}`);
    if (info.url) console.log("url:", info.url);
    if (info.payload !== undefined) console.log("payload:", info.payload);
    if (info.result !== undefined) console.log("API result:", info.result);
    console.groupEnd();
  } catch {}
}

async function parse<T>(res: Response): Promise<T> {
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // ignora erro de parse vazio
  }

  if (!res.ok) {
    // 🔴 ADICIONE ESSA LINHA AQUI:
    console.error("[API ERROR]", res.url, res.status, json);

    const code = json?.apidogError?.code ?? res.status;
    const msg  = json?.apidogError?.message ?? res.statusText;
    throw new Error(`${code}: ${msg}`);
  }

  return (json?.data ?? json) as T;
}


//
// Pacientes (CRUD)
// 
export async function listarPacientes(params?: { page?: number; limit?: number; q?: string }): Promise<Paciente[]> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.q) query.set("q", params.q);
  const url = `${API_BASE}${PATHS.pacientes}${query.toString() ? `?${query.toString()}` : ""}`;

  const res = await fetch(url, { method: "GET", headers: headers("json") });
  const data = await parse<ApiOk<Paciente[]>>(res);
  logAPI("listarPacientes", { url, result: data });
  return data?.data ?? (data as any);
}

export async function buscarPacientePorId(id: string | number): Promise<Paciente> {
  const url = `${API_BASE}${PATHS.pacienteId(id)}`;
  const res = await fetch(url, { method: "GET", headers: headers("json") });
  const data = await parse<ApiOk<Paciente>>(res);
  logAPI("buscarPacientePorId", { url, result: data });
  return data?.data ?? (data as any);
}

export async function criarPaciente(input: PacienteInput): Promise<Paciente> {
  const url = `${API_BASE}${PATHS.pacientes}`;
  const res = await fetch(url, { method: "POST", headers: headers("json"), body: JSON.stringify(input) });
  const data = await parse<ApiOk<Paciente>>(res);
  logAPI("criarPaciente", { url, payload: input, result: data });
  return data?.data ?? (data as any);
}

export async function atualizarPaciente(id: string | number, input: PacienteInput): Promise<Paciente> {
  const url = `${API_BASE}${PATHS.pacienteId(id)}`;
  const res = await fetch(url, { method: "PUT", headers: headers("json"), body: JSON.stringify(input) });
  const data = await parse<ApiOk<Paciente>>(res);
  logAPI("atualizarPaciente", { url, payload: input, result: data });
  return data?.data ?? (data as any);
}

export async function excluirPaciente(id: string | number): Promise<void> {
  const url = `${API_BASE}${PATHS.pacienteId(id)}`;
  const res = await fetch(url, { method: "DELETE", headers: headers("json") });
  await parse<any>(res);
  logAPI("excluirPaciente", { url, result: { ok: true } });
}

// 
// Foto
// 

export async function uploadFotoPaciente(id: string | number, file: File): Promise<{ foto_url?: string; thumbnail_url?: string }> {
  const url = `${API_BASE}${PATHS.foto(id)}`;
  const fd = new FormData();
  // nome de campo mais comum no mock
  fd.append("foto", file);
  const res = await fetch(url, { method: "POST", headers: headers("form"), body: fd });
  const data = await parse<ApiOk<{ foto_url?: string; thumbnail_url?: string }>>(res);
  logAPI("uploadFotoPaciente", { url, payload: { file: file.name }, result: data });
  return data?.data ?? (data as any);
}

export async function removerFotoPaciente(id: string | number): Promise<void> {
  const url = `${API_BASE}${PATHS.foto(id)}`;
  const res = await fetch(url, { method: "DELETE", headers: headers("json") });
  await parse<any>(res);
  logAPI("removerFotoPaciente", { url, result: { ok: true } });
}

//
// Anexos
//

export async function listarAnexos(id: string | number): Promise<any[]> {
  const url = `${API_BASE}${PATHS.anexos(id)}`;
  const res = await fetch(url, { method: "GET", headers: headers("json") });
  const data = await parse<ApiOk<any[]>>(res);
  logAPI("listarAnexos", { url, result: data });
  return data?.data ?? (data as any);
}

export async function adicionarAnexo(id: string | number, file: File): Promise<any> {
  const url = `${API_BASE}${PATHS.anexos(id)}`;
  const fd = new FormData();
  
  fd.append("arquivo", file);
  const res = await fetch(url, { method: "POST", body: fd, headers: headers("form") });
  const data = await parse<ApiOk<any>>(res);
  logAPI("adicionarAnexo", { url, payload: { file: file.name }, result: data });
  return data?.data ?? (data as any);
}

export async function removerAnexo(id: string | number, anexoId: string | number): Promise<void> {
  const url = `${API_BASE}${PATHS.anexoId(id, anexoId)}`;
  const res = await fetch(url, { method: "DELETE", headers: headers("json") });
  await parse<any>(res);
  logAPI("removerAnexo", { url, result: { ok: true } });
}

// 
// Validações
// 

export async function validarCPF(cpf: string): Promise<{ valido: boolean; existe: boolean; paciente_id: string | null }> {
  const url = `${API_BASE}${PATHS.validarCPF}`;
  const payload = { cpf };
  const res = await fetch(url, { method: "POST", headers: headers("json"), body: JSON.stringify(payload) });
  const data = await parse<ApiOk<{ valido: boolean; existe: boolean; paciente_id: string | null }>>(res);
  logAPI("validarCPF", { url, payload, result: data });
  return data?.data ?? (data as any);
}

export async function buscarCepAPI(cep: string): Promise<{ logradouro?: string; bairro?: string; localidade?: string; uf?: string; erro?: boolean }> {
  const clean = (cep || "").replace(/\D/g, "");
  const urlMock = `${API_BASE}${PATHS.cep(clean)}`;

  try {
    const res = await fetch(urlMock, { method: "GET", headers: headers("json") });
    const data = await parse<any>(res); // pode vir direto ou dentro de {data}
    logAPI("buscarCEP (mock)", { url: urlMock, payload: { cep: clean }, result: data });
    const d = data?.data ?? data ?? {};
    return {
      logradouro: d.logradouro ?? d.street ?? "",
      bairro: d.bairro ?? d.neighborhood ?? "",
      localidade: d.localidade ?? d.city ?? "",
      uf: d.uf ?? d.state ?? "",
      erro: false,
    };
  } catch {
    // fallback ViaCEP
    const urlVia = `https://viacep.com.br/ws/${clean}/json/`;
    const resV = await fetch(urlVia);
    const jsonV = await resV.json().catch(() => ({}));
    logAPI("buscarCEP (ViaCEP/fallback)", { url: urlVia, payload: { cep: clean }, result: jsonV });
    if (jsonV?.erro) return { erro: true };
    return {
      logradouro: jsonV.logradouro ?? "",
      bairro: jsonV.bairro ?? "",
      localidade: jsonV.localidade ?? "",
      uf: jsonV.uf ?? "",
      erro: false,
    };
  }
}

// >>> ADICIONE (ou mova) ESTES TIPOS <<<
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

export type Medico = {
  id: string;
  nome?: string;
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
};

export type MedicoInput = {
  nome: string;
  nome_social?: string | null;
  cpf?: string | null;
  rg?: string | null;
  sexo?: string | null;
  data_nascimento?: string | null;
  telefone?: string | null;
  celular?: string | null;
  contato_emergencia?: string | null;
  email?: string | null;
  crm: string;
  estado_crm?: string | null;
  rqe?: string | null;
  formacao_academica?: FormacaoAcademica[];
  curriculo_url?: string | null;
  especialidade: string;
  observacoes?: string | null;
  tipo_vinculo?: string | null;
  dados_bancarios?: DadosBancarios | null;
  agenda_horario?: string | null;
  valor_consulta?: number | string | null;
};

//
// MÉDICOS (CRUD)
//
// ======= MÉDICOS (forçando usar rotas de PACIENTES no mock) =======

export async function listarMedicos(params?: { page?: number; limit?: number; q?: string }): Promise<Medico[]> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.q) query.set("q", params.q);

  // FORÇA /pacientes
  const url = `${API_BASE}/pacientes${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetch(url, { method: "GET", headers: headers("json") });
  const data = await parse<ApiOk<Medico[]>>(res);
  return (data as any)?.data ?? (data as any);
}

export async function buscarMedicoPorId(id: string | number): Promise<Medico> {
  const url = `${API_BASE}/pacientes/${id}`; // FORÇA /pacientes
  const res = await fetch(url, { method: "GET", headers: headers("json") });
  const data = await parse<ApiOk<Medico>>(res);
  return (data as any)?.data ?? (data as any);
}

export async function criarMedico(input: MedicoInput): Promise<Medico> {
  const url = `${API_BASE}/pacientes`; // FORÇA /pacientes
  const res = await fetch(url, { method: "POST", headers: headers("json"), body: JSON.stringify(input) });
  const data = await parse<ApiOk<Medico>>(res);
  return (data as any)?.data ?? (data as any);
}

export async function atualizarMedico(id: string | number, input: MedicoInput): Promise<Medico> {
  const url = `${API_BASE}/pacientes/${id}`; // FORÇA /pacientes
  const res = await fetch(url, { method: "PUT", headers: headers("json"), body: JSON.stringify(input) });
  const data = await parse<ApiOk<Medico>>(res);
  return (data as any)?.data ?? (data as any);
}

export async function excluirMedico(id: string | number): Promise<void> {
  const url = `${API_BASE}/pacientes/${id}`; // FORÇA /pacientes
  const res = await fetch(url, { method: "DELETE", headers: headers("json") });
  await parse<any>(res);
}

export async function uploadFotoMedico(id: string | number, file: File): Promise<{ foto_url?: string; thumbnail_url?: string }> {
  const url = `${API_BASE}/pacientes/${id}/foto`; // FORÇA /pacientes
  const fd = new FormData();
  fd.append("foto", file);
  const res = await fetch(url, { method: "POST", headers: headers("form"), body: fd });
  const data = await parse<ApiOk<{ foto_url?: string; thumbnail_url?: string }>>(res);
  return (data as any)?.data ?? (data as any);
}

export async function removerFotoMedico(id: string | number): Promise<void> {
  const url = `${API_BASE}/pacientes/${id}/foto`; // FORÇA /pacientes
  const res = await fetch(url, { method: "DELETE", headers: headers("json") });
  await parse<any>(res);
}

export async function listarAnexosMedico(id: string | number): Promise<any[]> {
  const url = `${API_BASE}/pacientes/${id}/anexos`; // FORÇA /pacientes
  const res = await fetch(url, { method: "GET", headers: headers("json") });
  const data = await parse<ApiOk<any[]>>(res);
  return (data as any)?.data ?? (data as any);
}

export async function adicionarAnexoMedico(id: string | number, file: File): Promise<any> {
  const url = `${API_BASE}/pacientes/${id}/anexos`; // FORÇA /pacientes
  const fd = new FormData();
  fd.append("arquivo", file);
  const res = await fetch(url, { method: "POST", headers: headers("form"), body: fd });
  const data = await parse<ApiOk<any>>(res);
  return (data as any)?.data ?? (data as any);
}

export async function removerAnexoMedico(id: string | number, anexoId: string | number): Promise<void> {
  const url = `${API_BASE}/pacientes/${id}/anexos/${anexoId}`; // FORÇA /pacientes
  const res = await fetch(url, { method: "DELETE", headers: headers("json") });
  await parse<any>(res);
}
// ======= FIM: médicos usando rotas de pacientes =======
