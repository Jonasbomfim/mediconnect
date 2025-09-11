/* src/lib/api.ts */

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

// -----------------------------------------------------------------------------
// Config & helpers
// -----------------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://mock.apidog.com/m1/1053378-0-default";

const PATHS = {
  pacientes: "/pacientes",
  pacienteId: (id: string | number) => `/pacientes/${id}`,
  foto: (id: string | number) => `/pacientes/${id}/foto`,
  anexos: (id: string | number) => `/pacientes/${id}/anexos`,
  anexoId: (id: string | number, anexoId: string | number) => `/pacientes/${id}/anexos/${anexoId}`,
  validarCPF: "/pacientes/validar-cpf",
  cep: (cep: string) => `/utils/cep/${cep}`,
} as const;

function headers(kind: "json" | "form" = "json"): Record<string, string> {
  const h: Record<string, string> = {};
  const token = process.env.NEXT_PUBLIC_API_TOKEN?.trim();
  if (token) h.Authorization = `Bearer ${token}`;
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
    // ignore
  }
  if (!res.ok) {
    const code = json?.apidogError?.code ?? res.status;
    const msg = json?.apidogError?.message ?? res.statusText;
    throw new Error(`${code}: ${msg}`);
  }
  // muitos endpoints do mock respondem { success, data }
  return (json?.data ?? json) as T;
}

// -----------------------------------------------------------------------------
// Pacientes (CRUD)
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Foto
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Anexos
// -----------------------------------------------------------------------------

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
  // alguns mocks usam "arquivo" e outros "file"; tentamos ambos
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

// -----------------------------------------------------------------------------
// Validações
// -----------------------------------------------------------------------------

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
