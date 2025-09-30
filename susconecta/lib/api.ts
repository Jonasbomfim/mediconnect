// lib/api.ts

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
  endereco?: Endereco;
  observacoes?: string | null;
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
  } catch {}
  if (!res.ok) {
    console.error("[API ERROR]", res.url, res.status, json);
    const code = (json && (json.error?.code || json.code)) ?? res.status;
    const msg = (json && (json.error?.message || json.message)) ?? res.statusText;
    throw new Error(`${code}: ${msg}`);
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

export async function buscarPacientePorId(id: string | number): Promise<Paciente> {
  const url = `${REST}/patients?id=eq.${id}`;
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

export async function buscarMedicoPorId(id: string | number): Promise<Medico> {
  const url = `${REST}/doctors?id=eq.${id}`;
  const res = await fetch(url, { method: "GET", headers: baseHeaders() });
  const arr = await parse<Medico[]>(res);
  if (!arr?.length) throw new Error("404: Médico não encontrado");
  return arr[0];
}

export async function criarMedico(input: MedicoInput): Promise<Medico> {
  const url = `${REST}/doctors`;
  const res = await fetch(url, {
    method: "POST",
    headers: withPrefer({ ...baseHeaders(), "Content-Type": "application/json" }, "return=representation"),
    body: JSON.stringify(input),
  });
  const arr = await parse<Medico[] | Medico>(res);
  return Array.isArray(arr) ? arr[0] : (arr as Medico);
}

export async function atualizarMedico(id: string | number, input: MedicoInput): Promise<Medico> {
  const url = `${REST}/doctors?id=eq.${id}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: withPrefer({ ...baseHeaders(), "Content-Type": "application/json" }, "return=representation"),
    body: JSON.stringify(input),
  });
  const arr = await parse<Medico[] | Medico>(res);
  return Array.isArray(arr) ? arr[0] : (arr as Medico);
}

export async function excluirMedico(id: string | number): Promise<void> {
  const url = `${REST}/doctors?id=eq.${id}`;
  const res = await fetch(url, { method: "DELETE", headers: baseHeaders() });
  await parse<any>(res);
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
