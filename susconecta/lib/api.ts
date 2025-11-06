// lib/api.ts

import { ENV_CONFIG } from '@/lib/env-config';
import { AUTH_STORAGE_KEYS } from '@/types/auth'
// Use ENV_CONFIG for SUPABASE URL and anon key in frontend

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
export type Endereco = {
  cep?: string;
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
  sexo?: string | null;
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

// ===== DISPONIBILIDADE (Doctor Availability) =====
export type DoctorAvailabilityCreate = {
  doctor_id: string;
  weekday: 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo';
  start_time: string; // 'HH:MM:SS'
  end_time: string; // 'HH:MM:SS'
  slot_minutes?: number;
  appointment_type?: 'presencial' | 'telemedicina';
  active?: boolean;
};

export type DoctorAvailability = DoctorAvailabilityCreate & {
  id: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string | null;
};

export type DoctorAvailabilityUpdate = Partial<{
  weekday: 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo' | string;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  appointment_type: 'presencial' | 'telemedicina' | string;
  active: boolean;
}>;

/**
 * Cria uma disponibilidade de médico (POST /rest/v1/doctor_availability)
 */
export async function criarDisponibilidade(input: DoctorAvailabilityCreate): Promise<DoctorAvailability> {
  // Apply sensible defaults
  // Map weekday to the server-expected enum value if necessary. Some deployments use
  // English weekday names (monday..sunday) as the enum values; the UI uses
  // Portuguese values (segunda..domingo). Normalize and convert here so POST
  // doesn't fail with Postgres `invalid input value for enum weekday`.
  const mapWeekdayForServer = (w?: string) => {
    if (!w) return w;
    const key = w.toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]/g, '');
    const map: Record<string, string> = {
      'segunda': 'monday',
      'terca': 'tuesday',
      'quarta': 'wednesday',
      'quinta': 'thursday',
      'sexta': 'friday',
      'sabado': 'saturday',
      'domingo': 'sunday',
      // allow common english names through
      'monday': 'monday',
      'tuesday': 'tuesday',
      'wednesday': 'wednesday',
      'thursday': 'thursday',
      'friday': 'friday',
      'saturday': 'saturday',
      'sunday': 'sunday',
    };
    return map[key] ?? w;
  };

  // Determine created_by: try localStorage first, then fall back to calling user-info
  let createdBy: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
      if (raw) {
        const parsed = JSON.parse(raw);
        createdBy = parsed?.id ?? parsed?.user?.id ?? null;
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  if (!createdBy) {
    try {
      const info = await getUserInfo();
      createdBy = info?.user?.id ?? null;
    } catch (e) {
      // ignore
    }
  }

  if (!createdBy) {
    throw new Error('Não foi possível determinar o usuário atual (created_by). Faça login novamente antes de criar uma disponibilidade.');
  }


  // Normalize weekday to integer expected by the OpenAPI (0=Sunday .. 6=Saturday)
  const mapWeekdayToInt = (w?: string | number): number | null => {
    if (w === null || w === undefined) return null;
    if (typeof w === 'number') return Number(w);
    const s = String(w).toLowerCase().trim();
    const map: Record<string, number> = {
      'domingo': 0, 'domingo.': 0, 'sunday': 0,
      'segunda': 1, 'segunda-feira': 1, 'monday': 1,
      'terca': 2, 'terça': 2, 'terca-feira': 2, 'tuesday': 2,
      'quarta': 3, 'quarta-feira': 3, 'wednesday': 3,
      'quinta': 4, 'quinta-feira': 4, 'thursday': 4,
      'sexta': 5, 'sexta-feira': 5, 'friday': 5,
      'sabado': 6, 'sábado': 6, 'saturday': 6,
    } as any;
    // numeric strings
    if (/^\d+$/.test(s)) return Number(s);
    return map[s] ?? null;
  };

  const weekdayInt = mapWeekdayToInt(input.weekday as any);
  if (weekdayInt === null || weekdayInt < 0 || weekdayInt > 6) {
    throw new Error('weekday inválido. Use 0=Domingo .. 6=Sábado ou o nome do dia.');
  }

  // First, attempt server-side Edge Function to perform the insert with service privileges.
  // This avoids RLS blocking client inserts. The function will also validate doctor existence.
  const fnUrl = `${API_BASE}/functions/v1/create-availability`;
  const fnPayload: any = {
    doctor_id: input.doctor_id,
    weekday: weekdayInt,
    start_time: input.start_time,
    end_time: input.end_time,
    slot_minutes: input.slot_minutes ?? 30,
    appointment_type: input.appointment_type ?? 'presencial',
    active: input.active === undefined ? true : input.active,
    created_by: createdBy,
  };

  try {
    const fnRes = await fetch(fnUrl, {
      method: 'POST',
      headers: { ...baseHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(fnPayload),
    });
    if (fnRes.ok) {
      const created = await parse<DoctorAvailability | DoctorAvailability[]>(fnRes as Response);
      return Array.isArray(created) ? created[0] : (created as DoctorAvailability);
    }
    // If function exists but returned 4xx/5xx, let parse() surface friendly error
    if (fnRes.status >= 400 && fnRes.status < 600) {
      return await parse<DoctorAvailability>(fnRes);
    }
  } catch (e) {
    console.warn('[criarDisponibilidade] create-availability function unavailable or errored, falling back to REST:', e);
  }

  // Fallback: try direct REST insert using integer weekday (OpenAPI expects integer).
  const restUrl = `${REST}/doctor_availability`;
  // Try with/without seconds for times to tolerate different server formats.
  const attempts = [true, false];
  let lastRes: Response | null = null;
  for (const withSeconds of attempts) {
    const start = withSeconds ? input.start_time : String(input.start_time).replace(/:00$/,'');
    const end = withSeconds ? input.end_time : String(input.end_time).replace(/:00$/,'');
    const tryPayload: any = {
      doctor_id: input.doctor_id,
      weekday: weekdayInt,
      start_time: start,
      end_time: end,
      slot_minutes: input.slot_minutes ?? 30,
      appointment_type: input.appointment_type ?? 'presencial',
      active: input.active === undefined ? true : input.active,
      created_by: createdBy,
    };

    try {
      const res = await fetch(restUrl, {
        method: 'POST',
        headers: withPrefer({ ...baseHeaders(), 'Content-Type': 'application/json' }, 'return=representation'),
        body: JSON.stringify(tryPayload),
      });
      lastRes = res;
      if (res.ok) {
        const arr = await parse<DoctorAvailability[] | DoctorAvailability>(res);
        return Array.isArray(arr) ? arr[0] : (arr as DoctorAvailability);
      }
      if (res.status >= 500) return await parse<DoctorAvailability>(res);

      const raw = await res.clone().text().catch(() => '');
      console.warn('[criarDisponibilidade] REST attempt failed', { status: res.status, withSeconds, raw });
      // If 22P02 (invalid enum) occurs, we will try a name-based fallback below
      if (res.status === 422 || (raw && raw.toString().includes('invalid input value for enum'))) {
        // fall through to name-based fallback
        break;
      }
    } catch (e) {
      console.warn('[criarDisponibilidade] REST fetch erro', e);
    }
  }

  // As a last resort: try sending weekday as English name (e.g. 'monday') for older schemas
  const engMap = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const mappedName = engMap[weekdayInt];
  for (const withSeconds of attempts) {
    const start = withSeconds ? input.start_time : String(input.start_time).replace(/:00$/,'');
    const end = withSeconds ? input.end_time : String(input.end_time).replace(/:00$/,'');
    const tryPayload: any = {
      doctor_id: input.doctor_id,
      weekday: mappedName,
      start_time: start,
      end_time: end,
      slot_minutes: input.slot_minutes ?? 30,
      appointment_type: input.appointment_type ?? 'presencial',
      active: input.active === undefined ? true : input.active,
      created_by: createdBy,
    };
    try {
      const res = await fetch(restUrl, {
        method: 'POST',
        headers: withPrefer({ ...baseHeaders(), 'Content-Type': 'application/json' }, 'return=representation'),
        body: JSON.stringify(tryPayload),
      });
      lastRes = res;
      if (res.ok) {
        const arr = await parse<DoctorAvailability[] | DoctorAvailability>(res);
        return Array.isArray(arr) ? arr[0] : (arr as DoctorAvailability);
      }
      if (res.status >= 500) return await parse<DoctorAvailability>(res);
      const raw = await res.clone().text().catch(() => '');
      console.warn('[criarDisponibilidade] REST name-based attempt failed', { status: res.status, withSeconds, raw });
    } catch (e) {
      console.warn('[criarDisponibilidade] REST name-based fetch erro', e);
    }
  }

  if (lastRes) return await parse<DoctorAvailability>(lastRes);
  throw new Error('Falha ao criar disponibilidade: nenhuma resposta do servidor.');
}

/**
 * Lista disponibilidades. Se doctorId for passado, filtra por médico.
 */
export async function listarDisponibilidades(params?: { doctorId?: string; active?: boolean }): Promise<DoctorAvailability[]> {
  const qs = new URLSearchParams();
  if (params?.doctorId) qs.set('doctor_id', `eq.${encodeURIComponent(String(params.doctorId))}`);
  if (params?.active !== undefined) qs.set('active', `eq.${params.active ? 'true' : 'false'}`);

  const url = `${REST}/doctor_availability${qs.toString() ? `?${qs.toString()}` : ''}`;
  const res = await fetch(url, { method: 'GET', headers: baseHeaders() });
  return await parse<DoctorAvailability[]>(res);
}


/**
 * Atualiza uma disponibilidade existente (PATCH /rest/v1/doctor_availability?id=eq.<id>)
 */
export async function atualizarDisponibilidade(id: string, input: DoctorAvailabilityUpdate): Promise<DoctorAvailability> {
  if (!id) throw new Error('ID da disponibilidade é obrigatório');

  const mapWeekdayForServer = (w?: string) => {
    if (!w) return w;
    const key = w.toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]/g, '');
    const map: Record<string, string> = {
      'segunda': 'monday',
      'terca': 'tuesday',
      'quarta': 'wednesday',
      'quinta': 'thursday',
      'sexta': 'friday',
      'sabado': 'saturday',
      'domingo': 'sunday',
      'monday': 'monday',
      'tuesday': 'tuesday',
      'wednesday': 'wednesday',
      'thursday': 'thursday',
      'friday': 'friday',
      'saturday': 'saturday',
      'sunday': 'sunday',
    };
    return map[key] ?? w;
  };

  // determine updated_by
  let updatedBy: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
      if (raw) {
        const parsed = JSON.parse(raw);
        updatedBy = parsed?.id ?? parsed?.user?.id ?? null;
      }
    } catch (e) {}
  }
  if (!updatedBy) {
    try {
      const info = await getUserInfo();
      updatedBy = info?.user?.id ?? null;
    } catch (e) {}
  }

  const restUrl = `${REST}/doctor_availability?id=eq.${encodeURIComponent(String(id))}`;

  // Build candidate payloads (weekday mapped/original, with/without seconds)
  const candidates: Array<DoctorAvailabilityUpdate> = [];
  const wk = input.weekday ? mapWeekdayForServer(String(input.weekday)) : undefined;
  // preferred candidate
  candidates.push({ ...input, weekday: wk });
  // original weekday if different
  if (input.weekday && String(input.weekday) !== wk) candidates.push({ ...input, weekday: input.weekday });
  // times without seconds
  const stripSeconds = (t?: string) => t ? String(t).replace(/:00$/,'') : t;
  candidates.push({ ...input, start_time: stripSeconds(input.start_time), end_time: stripSeconds(input.end_time), weekday: wk });

  let lastRes: Response | null = null;
  for (const cand of candidates) {
    const payload: any = { ...cand };
    if (updatedBy) payload.updated_by = updatedBy;

    try {
      const res = await fetch(restUrl, {
        method: 'PATCH',
        headers: withPrefer({ ...baseHeaders(), 'Content-Type': 'application/json' }, 'return=representation'),
        body: JSON.stringify(payload),
      });
      lastRes = res;
      if (res.ok) {
        const arr = await parse<DoctorAvailability[] | DoctorAvailability>(res);
        return Array.isArray(arr) ? arr[0] : (arr as DoctorAvailability);
      }
      if (res.status >= 500) return await parse<DoctorAvailability>(res);
      const raw = await res.clone().text().catch(() => '');
      console.warn('[atualizarDisponibilidade] tentativa falhou', { status: res.status, payload, raw });
    } catch (e) {
      console.warn('[atualizarDisponibilidade] erro fetch', e);
    }
  }

  if (lastRes) return await parse<DoctorAvailability>(lastRes);
  throw new Error('Falha ao atualizar disponibilidade: sem resposta do servidor');
}

/**
 * Deleta uma disponibilidade por ID (DELETE /rest/v1/doctor_availability?id=eq.<id>)
 */
export async function deletarDisponibilidade(id: string): Promise<void> {
  if (!id) throw new Error('ID da disponibilidade é obrigatório');
  const url = `${REST}/doctor_availability?id=eq.${encodeURIComponent(String(id))}`;
  // Request minimal return to get a 204 No Content when the delete succeeds.
  const res = await fetch(url, {
    method: 'DELETE',
    headers: withPrefer({ ...baseHeaders() }, 'return=minimal'),
  });

  if (res.status === 204) return;
  // Some deployments may return 200 with a representation — accept that too
  if (res.status === 200) return;
  // Otherwise surface a friendly error using parse()
  await parse(res as Response);
}

// ===== EXCEÇÕES (Doctor Exceptions) =====
export type DoctorExceptionCreate = {
  doctor_id: string;
  date: string; // YYYY-MM-DD
  start_time?: string | null; // HH:MM:SS (optional)
  end_time?: string | null; // HH:MM:SS (optional)
  kind: 'bloqueio' | 'liberacao';
  reason?: string | null;
};

export type DoctorException = DoctorExceptionCreate & {
  id: string;
  created_at?: string;
  created_by?: string | null;
};

/**
 * Cria uma exceção para um médico (POST /rest/v1/doctor_exceptions)
 */
export async function criarExcecao(input: DoctorExceptionCreate): Promise<DoctorException> {
  // populate created_by as other functions do
  let createdBy: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
      if (raw) {
        const parsed = JSON.parse(raw);
        createdBy = parsed?.id ?? parsed?.user?.id ?? null;
      }
    } catch (e) {
      // ignore
    }
  }
  if (!createdBy) {
    try {
      const info = await getUserInfo();
      createdBy = info?.user?.id ?? null;
    } catch (e) {
      // ignore
    }
  }

  if (!createdBy) {
    throw new Error('Não foi possível determinar o usuário atual (created_by). Faça login novamente antes de criar uma exceção.');
  }

  const payload: any = {
    doctor_id: input.doctor_id,
    date: input.date,
    start_time: input.start_time ?? null,
    end_time: input.end_time ?? null,
    kind: input.kind,
    reason: input.reason ?? null,
    created_by: createdBy,
  };

  const url = `${REST}/doctor_exceptions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: withPrefer({ ...baseHeaders(), 'Content-Type': 'application/json' }, 'return=representation'),
    body: JSON.stringify(payload),
  });

  const arr = await parse<DoctorException[] | DoctorException>(res);
  return Array.isArray(arr) ? arr[0] : (arr as DoctorException);
}

/**
 * Lista exceções. Se doctorId for passado, filtra por médico; se date for passado, filtra por data.
 */
export async function listarExcecoes(params?: { doctorId?: string; date?: string }): Promise<DoctorException[]> {
  const qs = new URLSearchParams();
  if (params?.doctorId) qs.set('doctor_id', `eq.${encodeURIComponent(String(params.doctorId))}`);
  if (params?.date) qs.set('date', `eq.${encodeURIComponent(String(params.date))}`);
  const url = `${REST}/doctor_exceptions${qs.toString() ? `?${qs.toString()}` : ''}`;
  const res = await fetch(url, { method: 'GET', headers: baseHeaders() });
  return await parse<DoctorException[]>(res);
}

/**
 * Deleta uma exceção por ID (DELETE /rest/v1/doctor_exceptions?id=eq.<id>)
 */
export async function deletarExcecao(id: string): Promise<void> {
  if (!id) throw new Error('ID da exceção é obrigatório');
  const url = `${REST}/doctor_exceptions?id=eq.${encodeURIComponent(String(id))}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: withPrefer({ ...baseHeaders() }, 'return=minimal'),
  });

  if (res.status === 204) return;
  if (res.status === 200) return;
  await parse(res as Response);
}





const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? ENV_CONFIG.SUPABASE_URL;
const REST = `${API_BASE}/rest/v1`;


const DEFAULT_AUTH_CALLBACK = 'https://mediconecta-app-liart.vercel.app/auth/callback';

const DEFAULT_LANDING = 'https://mediconecta-app-liart.vercel.app';

// Helper to build/normalize redirect URLs
function buildRedirectUrl(target?: 'paciente' | 'medico' | 'admin' | 'default', explicit?: string, redirectBase?: string) {
  const DEFAULT_REDIRECT_BASE = redirectBase ?? DEFAULT_LANDING;
  if (explicit) {
    
    try {
      const u = new URL(explicit);
      return u.toString().replace(/\/$/, '');
    } catch (e) {
    }
  }

  const base = DEFAULT_REDIRECT_BASE.replace(/\/$/, '');
  let path = '/';
  switch (target) {
    case 'paciente':
      path = '/paciente';
      break;
    case 'medico':
      path = '/profissional';
      break;
    case 'admin':
      path = '/dashboard';
      break;
    default:
      path = '/';
  }
  return `${base}${path}`;
}

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
    apikey: ENV_CONFIG.SUPABASE_ANON_KEY,
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

// Helper: fetch seguro que tenta urls alternativas caso a requisição primária falhe
async function fetchWithFallback<T = any>(url: string, headers: Record<string, string>, altUrls?: string[]): Promise<T | null> {
  try {
    // Log removido por segurança
    const res = await fetch(url, { method: 'GET', headers });
    if (res.ok) {
      return await parse<T>(res);
    }
    // Log removido por segurança
    if (!altUrls || !altUrls.length) return null;
    for (const alt of altUrls) {
      try {
        // Log removido por segurança
        const r2 = await fetch(alt, { method: 'GET', headers });
        if (r2.ok) return await parse<T>(r2);
        // Log removido por segurança
      } catch (e) {
        // Log removido por segurança
      }
    }
    return null;
  } catch (e) {
    // Log removido por segurança
    if (!altUrls || !altUrls.length) return null;
    for (const alt of altUrls) {
      try {
        const r2 = await fetch(alt, { method: 'GET', headers });
        if (r2.ok) return await parse<T>(r2);
      } catch (_) {
        // ignore
      }
    }
    return null;
  }
}

// Parse genérico
async function parse<T>(res: Response): Promise<T> {
  let json: any = null;
  let rawText = '';
  try {
    // Attempt to parse JSON; many endpoints may return empty bodies (204/204) or plain text
    // so guard against unexpected EOF during json parsing
    json = await res.json();
  } catch (err) {
    // Try to capture raw text for better diagnostics
    try {
      rawText = await res.clone().text();
    } catch (tErr) {
      rawText = '';
    }
    if (rawText) {
      console.warn('Resposta não-JSON recebida do servidor. raw text:', rawText);
    } else {
      console.warn('Resposta vazia ou inválida recebida do servidor; não foi possível parsear JSON:', err);
    }
  }

  if (!res.ok) {
    // If we didn't already collect rawText above, try to get it now for error messaging
    if (!rawText) {
      try {
        rawText = await res.clone().text();
      } catch (tErr) {
        rawText = '';
      }
    }

    const code = (json && (json.error?.code || json.code)) ?? res.status;
    const msg = (json && (json.error?.message || json.message || json.error)) ?? res.statusText;

    // Special-case authentication/authorization errors to reduce noisy logs
    if (res.status === 401) {
      // Log removido por segurança - não expor URL da Supabase
      throw new Error('Você não está autenticado. Faça login novamente.');
    }

    if (res.status === 403) {
      // Log removido por segurança - não expor URL da Supabase
      throw new Error('Você não tem permissão para executar esta ação.');
    }

    // For other errors, log a concise error and try to produce a friendly message
    const endpoint = res.url ? new URL(res.url).pathname : 'unknown';
    console.error('[API ERROR] Status:', res.status, 'Endpoint:', endpoint, json ? 'JSON response' : 'no-json', rawText ? 'raw body present' : 'no raw body', 'Message:', msg || 'N/A');

    // Mensagens amigáveis para erros comuns
    let friendlyMessage = msg;

    // Erros de criação de usuário
    if (res.url?.includes('create-user')) {
      if (msg?.includes('Failed to assign user role')) {
        friendlyMessage = 'O usuário foi criado mas houve falha ao atribuir permissões. Entre em contato com o administrador do sistema para verificar as configurações da Edge Function.';
      } else if (msg?.includes('already registered')) {
        friendlyMessage = 'Este email já está cadastrado no sistema.';
      } else if (msg?.includes('Invalid role')) {
        friendlyMessage = 'Tipo de acesso inválido.';
      } else if (msg?.includes('Missing required fields')) {
        friendlyMessage = 'Campos obrigatórios não preenchidos.';
      } else if (res.status === 500) {
        friendlyMessage = 'Erro no servidor ao criar usuário. Entre em contato com o suporte.';
      }
    }
    // Erro de CPF duplicado
    else if (code === '23505' && msg && msg.includes('patients_cpf_key')) {
      friendlyMessage = 'Já existe um paciente cadastrado com este CPF. Por favor, verifique se o paciente já está registrado no sistema ou use um CPF diferente.';
    }
    // Erro de email duplicado (paciente)
    else if (code === '23505' && msg && msg.includes('patients_email_key')) {
      friendlyMessage = 'Já existe um paciente cadastrado com este email. Por favor, use um email diferente.';
    }
    // Erro de CRM duplicado (médico)
    else if (code === '23505' && msg && msg.includes('doctors_crm')) {
      friendlyMessage = 'Já existe um médico cadastrado com este CRM. Por favor, verifique se o médico já está registrado no sistema.';
    }
    // Erro de email duplicado (médico)
    else if (code === '23505' && msg && msg.includes('doctors_email_key')) {
      friendlyMessage = 'Já existe um médico cadastrado com este email. Por favor, use um email diferente.';
    }
    // Outros erros de constraint unique
    else if (code === '23505') {
      friendlyMessage = 'Registro duplicado: já existe um cadastro com essas informações no sistema.';
    }
    // Erro de foreign key (registro referenciado em outra tabela)
    else if (code === '23503') {
      // Mensagem específica para pacientes com relatórios vinculados
      if (msg && msg.toString().toLowerCase().includes('reports')) {
        friendlyMessage = 'Não é possível excluir este paciente porque existem relatórios vinculados a ele. Exclua ou desvincule os relatórios antes de remover o paciente.';
      } else {
        friendlyMessage = 'Registro referenciado em outra tabela. Remova referências dependentes antes de tentar novamente.';
      }
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
  let url = `${ENV_CONFIG.SUPABASE_URL}/rest/v1/patients`;
  const qsString = qs.toString();
  if (qsString) url += `?${qsString}`;

  // Use baseHeaders() so the current user token (from local/session storage) and apikey are sent
  const headers: HeadersInit = {
    ...baseHeaders(),
    ...rangeHeaders(params?.page, params?.limit),
  };

  const res = await fetch(url, {
    method: "GET",
    headers,
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
  const q = encodeURIComponent(searchTerm);
  
  // Monta queries para buscar em múltiplos campos
  const queries = [];
  
  // Busca por ID se parece com UUID
  if (searchTerm.includes('-') && searchTerm.length > 10) {
    queries.push(`id=eq.${encodeURIComponent(searchTerm)}`);
  }
  
  // Busca por CPF (com e sem formatação)
  if (digitsOnly.length >= 11) {
    queries.push(`cpf=eq.${digitsOnly}`);
  } else if (digitsOnly.length >= 3) {
    queries.push(`cpf=ilike.*${digitsOnly}*`);
  }
  
  // Busca por nome (usando ilike para busca case-insensitive)
  // NOTA: apenas full_name existe, social_name foi removido
  if (searchTerm.length >= 2) {
    queries.push(`full_name=ilike.*${q}*`);
  }
  
  // Busca por email se contém @
  if (searchTerm.includes('@')) {
    queries.push(`email=ilike.*${q}*`);
  }
  
  const results: Paciente[] = [];
  const seenIds = new Set<string>();
  
  // Executa as buscas e combina resultados únicos
  for (const query of queries) {
    try {
      const url = `${REST}/patients?${query}&limit=10`;
      const headers = baseHeaders();
      const res = await fetch(url, { method: "GET", headers });
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
      console.warn(`[API] Erro na busca de pacientes com query: ${query}`, error);
    }
  }
  
  return results.slice(0, 20); // Limita a 20 resultados
}

/**
 * Busca um paciente pelo user_id associado (campo user_id na tabela patients).
 * Retorna o primeiro registro encontrado ou null quando não achar.
 */
export async function buscarPacientePorUserId(userId?: string | null): Promise<Paciente | null> {
  if (!userId) return null;
  try {
    const url = `${REST}/patients?user_id=eq.${encodeURIComponent(String(userId))}&limit=1`;
    const headers = baseHeaders();
    // Log removido por segurança
    const arr = await fetchWithFallback<Paciente[]>(url, headers).catch(() => []);
    if (arr && arr.length) return arr[0];
    return null;
  } catch (err) {
    console.warn('[buscarPacientePorUserId] erro ao buscar por user_id', err);
    return null;
  }
}

export async function buscarPacientePorId(id: string | number): Promise<Paciente> {
  const idParam = String(id);
  const headers = baseHeaders();

  // Tenta buscar por id (UUID ou string) primeiro
  try {
    const url = `${ENV_CONFIG.SUPABASE_URL}/rest/v1/patients?id=eq.${encodeURIComponent(idParam)}`;
    // Log removido por segurança
    const arr = await fetchWithFallback<Paciente[]>(url, headers);
    if (arr && arr.length) return arr[0];
  } catch (e) {
    // continue to next strategies
  }

  // Se for string e não numérico, talvez foi passado um nome — tentar por full_name / social_name
  if (typeof id === 'string' && isNaN(Number(id))) {
    const q = encodeURIComponent(String(id));
          const params = new URLSearchParams();
          params.set('full_name', `ilike.*${String(id)}*`);
          params.set('limit', '5');
          const url = `${REST}/patients?${params.toString()}`;
          const altParams = new URLSearchParams();
          altParams.set('social_name', `ilike.*${String(id)}*`);
          altParams.set('limit', '5');
          const alt = `${REST}/patients?${altParams.toString()}`;
    // Log removido por segurança
    const arr2 = await fetchWithFallback<Paciente[]>(url, headers, [alt]);
    if (arr2 && arr2.length) return arr2[0];
  }

  throw new Error('404: Paciente não encontrado');
}

// ===== MENSAGENS =====
export type Mensagem = {
  id: string;
  patient_id?: string;
  doctor_id?: string | null;
  from?: string | null;
  to?: string | null;
  sender_name?: string | null;
  subject?: string | null;
  body?: string | null;
  content?: string | null;
  read?: boolean | null;
  created_at?: string | null;
};

/**
 * Lista mensagens (inbox) de um paciente específico.
 * Retorna array vazio se não houver mensagens.
 */
export async function listarMensagensPorPaciente(patientId: string): Promise<Mensagem[]> {
  if (!patientId) return [];
  try {
    const qs = new URLSearchParams();
    qs.set('patient_id', `eq.${encodeURIComponent(String(patientId))}`);
    // Order by created_at descending if available
    qs.set('order', 'created_at.desc');
    const url = `${REST}/messages?${qs.toString()}`;
    const headers = baseHeaders();
    const res = await fetch(url, { method: 'GET', headers });
    return await parse<Mensagem[]>(res);
  } catch (err) {
    console.warn('[listarMensagensPorPaciente] erro ao buscar mensagens', err);
    return [];
  }
}

// ===== RELATÓRIOS =====
export type Report = {
  id: string;
  patient_id?: string;
  order_number?: string;
  exam?: string;
  diagnosis?: string;
  conclusion?: string;
  cid_code?: string;
  content_html?: string;
  content_json?: any;
  status?: string;
  requested_by?: string;
  due_at?: string;
  hide_date?: boolean;
  hide_signature?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
};

// ===== AGENDAMENTOS =====
export type Appointment = {
  id: string;
  order_number?: string | null;
  patient_id?: string | null;
  doctor_id?: string | null;
  scheduled_at?: string | null;
  duration_minutes?: number | null;
  appointment_type?: string | null;
  status?: string | null;
  chief_complaint?: string | null;
  patient_notes?: string | null;
  notes?: string | null;
  insurance_provider?: string | null;
  checked_in_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
};

// Payload to create an appointment
export type AppointmentCreate = {
  patient_id: string;
  doctor_id: string;
  scheduled_at: string; // ISO date-time
  duration_minutes?: number;
  appointment_type?: 'presencial' | 'telemedicina' | string;
  chief_complaint?: string | null;
  patient_notes?: string | null;
  insurance_provider?: string | null;
};

/**
 * Chama a Function `/functions/v1/get-available-slots` para obter os slots disponíveis de um médico
 */
export async function getAvailableSlots(input: { doctor_id: string; start_date: string; end_date: string; appointment_type?: string }): Promise<{ slots: Array<{ datetime: string; available: boolean }> }> {
  if (!input || !input.doctor_id || !input.start_date || !input.end_date) {
    throw new Error('Parâmetros inválidos. É necessário doctor_id, start_date e end_date.');
  }

  const url = `${API_BASE}/functions/v1/get-available-slots`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...baseHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctor_id: input.doctor_id, start_date: input.start_date, end_date: input.end_date, appointment_type: input.appointment_type ?? 'presencial' }),
    });

    // Do not short-circuit; let parse() produce friendly errors
    const parsed = await parse<{ slots: Array<{ datetime: string; available: boolean }> }>(res);
    // Ensure consistent return shape
    if (!parsed || !Array.isArray((parsed as any).slots)) return { slots: [] };
    return parsed as { slots: Array<{ datetime: string; available: boolean }> };
  } catch (err) {
    console.error('[getAvailableSlots] erro ao buscar horários disponíveis', err);
    throw err;
  }
}

/**
 * Cria um agendamento (POST /rest/v1/appointments) verificando disponibilidade previamente
 */
export async function criarAgendamento(input: AppointmentCreate): Promise<Appointment> {
  if (!input || !input.patient_id || !input.doctor_id || !input.scheduled_at) {
    throw new Error('Parâmetros inválidos para criar agendamento. patient_id, doctor_id e scheduled_at são obrigatórios.');
  }

  // Normalize scheduled_at to ISO
  const scheduledDate = new Date(input.scheduled_at);
  if (isNaN(scheduledDate.getTime())) throw new Error('scheduled_at inválido');

  // Build day range for availability check (start of day to end of day of scheduled date)
  const startDay = new Date(scheduledDate);
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(scheduledDate);
  endDay.setHours(23, 59, 59, 999);

  // Query availability
  const av = await getAvailableSlots({ doctor_id: input.doctor_id, start_date: startDay.toISOString(), end_date: endDay.toISOString(), appointment_type: input.appointment_type });
  const scheduledMs = scheduledDate.getTime();

  const matching = (av.slots || []).find((s) => {
    try {
      const dt = new Date(s.datetime).getTime();
      // allow small tolerance (<= 60s) to account for formatting/timezone differences
      return s.available && Math.abs(dt - scheduledMs) <= 60_000;
    } catch (e) {
      return false;
    }
  });

  if (!matching) {
    throw new Error('Horário não disponível para o médico no horário solicitado. Verifique a disponibilidade antes de agendar.');
  }

  // --- Prevent creating an appointment on a date with a blocking exception ---
  try {
    // listarExcecoes can filter by date
    const dateOnly = startDay.toISOString().split('T')[0];
    const exceptions = await listarExcecoes({ doctorId: input.doctor_id, date: dateOnly }).catch(() => []);
    if (exceptions && exceptions.length) {
      for (const ex of exceptions) {
        try {
          if (!ex || !ex.kind) continue;
          if (ex.kind !== 'bloqueio') continue;
          // If no start_time/end_time -> blocks whole day
          if (!ex.start_time && !ex.end_time) {
            const reason = ex.reason ? ` Motivo: ${ex.reason}` : '';
            throw new Error(`Não é possível agendar para esta data. Existe uma exceção que bloqueia o dia.${reason}`);
          }
          // Otherwise check overlap with scheduled time
          // Parse exception times and scheduled time to minutes
                  const parseToMinutes = (t?: string | null) => {
                    if (!t) return null;
                    const parts = String(t).split(':').map(Number);
                    if (parts.length >= 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) return parts[0] * 60 + parts[1];
                    return null;
                  };
                  const exStart = parseToMinutes(ex.start_time ?? undefined);
                  const exEnd = parseToMinutes(ex.end_time ?? undefined);
          const sched = new Date(input.scheduled_at);
          const schedMinutes = sched.getHours() * 60 + sched.getMinutes();
          const schedDuration = input.duration_minutes ?? 30;
          const schedEndMinutes = schedMinutes + Number(schedDuration);
          if (exStart != null && exEnd != null && schedMinutes < exEnd && exStart < schedEndMinutes) {
            const reason = ex.reason ? ` Motivo: ${ex.reason}` : '';
            throw new Error(`Não é possível agendar neste horário por uma exceção que bloqueia parte do dia.${reason}`);
          }
        } catch (inner) {
          // Propagate the exception as user-facing error
          throw inner;
        }
      }
    }
  } catch (e) {
    if (e instanceof Error) throw e;
  }

  // Determine created_by similar to other creators (prefer localStorage then user-info)
  let createdBy: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
      if (raw) {
        const parsed = JSON.parse(raw);
        createdBy = parsed?.id ?? parsed?.user?.id ?? null;
      }
    } catch (e) {
      // ignore
    }
  }
  if (!createdBy) {
    try {
      const info = await getUserInfo();
      createdBy = info?.user?.id ?? null;
    } catch (e) {
      // ignore
    }
  }

  const payload: any = {
    patient_id: input.patient_id,
    doctor_id: input.doctor_id,
    scheduled_at: new Date(scheduledDate).toISOString(),
    duration_minutes: input.duration_minutes ?? 30,
    appointment_type: input.appointment_type ?? 'presencial',
    chief_complaint: input.chief_complaint ?? null,
    patient_notes: input.patient_notes ?? null,
    insurance_provider: input.insurance_provider ?? null,
  };
  if (createdBy) payload.created_by = createdBy;

  const url = `${REST}/appointments`;
  const res = await fetch(url, {
    method: 'POST',
    headers: withPrefer({ ...baseHeaders(), 'Content-Type': 'application/json' }, 'return=representation'),
    body: JSON.stringify(payload),
  });

  const created = await parse<Appointment>(res);
  return created;
}

/**
 * Cria um agendamento direto no endpoint REST sem realizar validações locais
 * como checagem de disponibilidade ou exceções. Use com cautela.
 */
export async function criarAgendamentoDireto(input: AppointmentCreate & { created_by?: string | null }): Promise<Appointment> {
  if (!input || !input.patient_id || !input.doctor_id || !input.scheduled_at) {
    throw new Error('Parâmetros inválidos para criar agendamento. patient_id, doctor_id e scheduled_at são obrigatórios.');
  }

  // Determine created_by: prefer explicit, then localStorage, then user-info
  let createdBy: string | null = input.created_by ?? null;
  if (!createdBy && typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
      if (raw) {
        const parsed = JSON.parse(raw);
        createdBy = parsed?.id ?? parsed?.user?.id ?? null;
      }
    } catch (e) {
      // ignore
    }
  }
  if (!createdBy) {
    try {
      const info = await getUserInfo().catch(() => null);
      createdBy = info?.user?.id ?? null;
    } catch (e) {
      // ignore
    }
  }

  const payload: any = {
    patient_id: input.patient_id,
    doctor_id: input.doctor_id,
    scheduled_at: new Date(input.scheduled_at).toISOString(),
    duration_minutes: input.duration_minutes ?? 30,
    appointment_type: input.appointment_type ?? 'presencial',
    chief_complaint: input.chief_complaint ?? null,
    patient_notes: input.patient_notes ?? null,
    insurance_provider: input.insurance_provider ?? null,
  };
  if (createdBy) payload.created_by = createdBy;

  const url = `${REST}/appointments`;
  const res = await fetch(url, {
    method: 'POST',
    headers: withPrefer({ ...baseHeaders(), 'Content-Type': 'application/json' }, 'return=representation'),
    body: JSON.stringify(payload),
  });

  const created = await parse<Appointment>(res);
  return created;
}

// Payload for updating an appointment (PATCH /rest/v1/appointments/{id})
export type AppointmentUpdate = Partial<{
  scheduled_at: string;
  duration_minutes: number;
  status: 'requested' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | string;
  chief_complaint: string | null;
  notes: string | null;
  patient_notes: string | null;
  insurance_provider: string | null;
  checked_in_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
}>;

/**
 * Atualiza um agendamento existente (PATCH /rest/v1/appointments?id=eq.<id>)
 */
export async function atualizarAgendamento(id: string | number, input: AppointmentUpdate): Promise<Appointment> {
  if (!id) throw new Error('ID do agendamento é obrigatório');
  const url = `${REST}/appointments?id=eq.${encodeURIComponent(String(id))}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: withPrefer({ ...baseHeaders(), 'Content-Type': 'application/json' }, 'return=representation'),
    body: JSON.stringify(input),
  });
  const arr = await parse<Appointment[] | Appointment>(res);
  return Array.isArray(arr) ? arr[0] : (arr as Appointment);
}

/**
 * Lista agendamentos via REST (GET /rest/v1/appointments)
 * Aceita query string completa (ex: `?select=*&limit=100&order=scheduled_at.desc`)
 */
export async function listarAgendamentos(query?: string): Promise<Appointment[]> {
  const qs = query && String(query).trim() ? (String(query).startsWith('?') ? query : `?${query}`) : '';
  const url = `${REST}/appointments${qs}`;
  const headers = baseHeaders();
  // If there is no auth token, avoid calling the endpoint which requires auth and return friendly error
  const jwt = getAuthToken();
  if (!jwt) {
    throw new Error('Não autenticado. Faça login para listar agendamentos.');
  }
  const res = await fetch(url, { method: 'GET', headers });
  if (!res.ok && res.status === 401) {
    throw new Error('Não autenticado. Token ausente ou expirado. Faça login novamente.');
  }
  return await parse<Appointment[]>(res);
}

/**
 * Buscar agendamento por ID (GET /rest/v1/appointments?id=eq.<id>)
 * Retorna o primeiro agendamento encontrado ou lança erro 404.
 */
export async function buscarAgendamentoPorId(id: string | number, select: string = '*'): Promise<Appointment> {
  const sId = String(id || '').trim();
  if (!sId) throw new Error('ID é obrigatório para buscar agendamento');
  const params = new URLSearchParams();
  if (select) params.set('select', select);
  params.set('limit', '1');
  const url = `${REST}/appointments?id=eq.${encodeURIComponent(sId)}&${params.toString()}`;
  const headers = baseHeaders();
  const arr = await fetchWithFallback<Appointment[]>(url, headers);
  if (arr && arr.length) return arr[0];
  throw new Error('404: Agendamento não encontrado');
}

/**
 * Deleta um agendamento por ID (DELETE /rest/v1/appointments?id=eq.<id>)
 */
export async function deletarAgendamento(id: string | number): Promise<void> {
  if (!id) throw new Error('ID do agendamento é obrigatório');
  const url = `${REST}/appointments?id=eq.${encodeURIComponent(String(id))}`;
  // Request minimal return to get a 204 No Content when the delete succeeds.
  const res = await fetch(url, {
    method: 'DELETE',
    headers: withPrefer({ ...baseHeaders() }, 'return=minimal'),
  });

  if (res.status === 204) return;
  // Some deployments may return 200 with a representation — accept that too
  if (res.status === 200) return;
  // Otherwise surface a friendly error using parse()
  await parse(res as Response);
}

/**
 * Buscar relatório por ID (tenta múltiplas estratégias: id, order_number, patient_id)
 * Retorna o primeiro relatório encontrado ou lança erro 404 quando não achar.
 */
export async function buscarRelatorioPorId(id: string | number): Promise<Report> {
  const sId = String(id);
  const headers = baseHeaders();

  // 1) tenta por id (UUID ou campo id)
  try {
    const urlById = `${REST}/reports?id=eq.${encodeURIComponent(sId)}`;
    // Log removido por segurança
    const arr = await fetchWithFallback<Report[]>(urlById, headers);
    if (arr && arr.length) return arr[0];
  } catch (e) {
    // Falha silenciosa - tenta próxima estratégia
  }

  // 2) tenta por order_number (caso o usuário cole um código legível)
  try {
    const urlByOrder = `${REST}/reports?order_number=eq.${encodeURIComponent(sId)}`;
    // Log removido por segurança
    const arr2 = await fetchWithFallback<Report[]>(urlByOrder, headers);
    if (arr2 && arr2.length) return arr2[0];
  } catch (e) {
    // Falha silenciosa - tenta próxima estratégia
  }

  // 3) tenta por patient_id (caso o usuário passe um patient_id em vez do report id)
  try {
    const urlByPatient = `${REST}/reports?patient_id=eq.${encodeURIComponent(sId)}`;
    // Log removido por segurança
    const arr3 = await fetchWithFallback<Report[]>(urlByPatient, headers);
    if (arr3 && arr3.length) return arr3[0];
  } catch (e) {
    // Falha silenciosa - não encontrado
  }

  // Não encontrado
  throw new Error('404: Relatório não encontrado');
}


// Buscar vários pacientes por uma lista de IDs (usa query in.(...))
export async function buscarPacientesPorIds(ids: Array<string | number>): Promise<Paciente[]> {
  if (!ids || !ids.length) return [];
  // Separe valores que parecem UUIDs daqueles que são nomes/texto
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  const uuids: string[] = [];
  const names: string[] = [];
  for (const id of ids) {
    const s = String(id).trim();
    if (!s) continue;
    if (uuidRegex.test(s)) uuids.push(s);
    else names.push(s);
  }

  const results: Paciente[] = [];

  // Buscar por UUIDs (coluna id)
  if (uuids.length) {
    const uuidsParam = uuids.join(',');
    const url = `${ENV_CONFIG.SUPABASE_URL}/rest/v1/patients?id=in.(${uuidsParam})&limit=100`;
    try {
      const res = await fetch(url, { method: 'GET', headers: baseHeaders() });
      const arr = await parse<Paciente[]>(res);
      if (arr && arr.length) results.push(...arr);
    } catch (e) {
      // ignore
    }
  }

  // Buscar por nomes (coluna full_name)
  if (names.length) {
    // Em vez de usar in.(...) (que exige aspas e quebra com encoding),
    // fazemos uma requisição por nome usando ilike para cada nome.
    for (const name of names) {
      try {
        const params = new URLSearchParams();
        params.set('full_name', `ilike.*${name}*`);
        params.set('limit', '100');
        const url = `${REST}/patients?${params.toString()}`;
        const altParams = new URLSearchParams();
        altParams.set('social_name', `ilike.*${name}*`);
        altParams.set('limit', '100');
        const alt = `${REST}/patients?${altParams.toString()}`;
        const headers = baseHeaders();
        // Log removido por segurança
        const arr = await fetchWithFallback<Paciente[]>(url, headers, [alt]);
        if (arr && arr.length) results.push(...arr);
      } catch (e) {
        // ignore individual name failures
      }
    }
  }

  // Remover duplicados pelo id
  const seen = new Set<string>();
  const unique: Paciente[] = [];
  for (const p of results) {
    if (!p || !p.id) continue;
    if (!seen.has(p.id)) {
      seen.add(p.id);
      unique.push(p);
    }
  }
  return unique;
}

/**
 * Busca pacientes atribuídos a um médico (usando o user_id do médico para consultar patient_assignments)
 * - Primeiro busca o médico para obter o campo user_id
 * - Consulta a tabela patient_assignments para obter patient_id vinculados ao user_id
 * - Retorna os pacientes via buscarPacientesPorIds
 */
export async function buscarPacientesPorMedico(doctorId: string): Promise<Paciente[]> {
  if (!doctorId) return [];
  try {
    // buscar médico para obter user_id
    const medico = await buscarMedicoPorId(doctorId).catch(() => null);
    const userId = medico?.user_id ?? medico?.created_by ?? null;
    if (!userId) {
      // se não houver user_id, não há uma forma confiável de mapear atribuições
      return [];
    }

    // buscar atribuições para esse user_id
    const url = `${REST}/patient_assignments?user_id=eq.${encodeURIComponent(String(userId))}&select=patient_id`;
    const res = await fetch(url, { method: 'GET', headers: baseHeaders() });
    const rows = await parse<Array<{ patient_id?: string }>>(res).catch(() => []);
    const ids = (rows || []).map((r) => r.patient_id).filter(Boolean) as string[];
    if (!ids.length) return [];
    return await buscarPacientesPorIds(ids);
  } catch (err) {
    console.warn('[buscarPacientesPorMedico] falha ao obter pacientes do médico', doctorId, err);
    return [];
  }
}

export async function criarPaciente(input: PacienteInput): Promise<Paciente> {
  // Client-side helper: delegate full responsibility to the server-side
  // endpoint `/create-user-with-password` which can optionally create the
  // patients record when `create_patient_record = true`.
  if (!input) throw new Error('Dados do paciente não informados');

  // Validar campos obrigatórios conforme OpenAPI do create-user-with-password
  const required = ['full_name', 'email', 'cpf', 'phone_mobile'];
  for (const r of required) {
    const val = (input as any)[r];
    if (!val || (typeof val === 'string' && String(val).trim() === '')) {
      throw new Error(`Campo obrigatório ausente: ${r}`);
    }
  }

  // Normalizar e validar CPF (11 dígitos)
  const cleanCpf = String(input.cpf || '').replace(/\D/g, '');
  if (!/^\d{11}$/.test(cleanCpf)) {
    throw new Error('CPF inválido. Deve conter 11 dígitos numéricos.');
  }

  // Generate a password client-side so the UI can display it to the user.
  const password = gerarSenhaAleatoria();

  // Build payload for the create-user-with-password endpoint. The backend
  // will create the Auth user and also create the patient record when
  // `create_patient_record` is true.
  const payload: any = {
    email: input.email,
    password,
    full_name: input.full_name,
    phone: input.phone_mobile || null,
    role: 'paciente' as any,
    create_patient_record: true,
    cpf: cleanCpf,
    phone_mobile: input.phone_mobile,
  };

  // Copy other optional fields that the server might accept for patient creation
  if (input.cep) payload.cep = input.cep;
  if (input.street) payload.street = input.street;
  if (input.number) payload.number = input.number;
  if (input.complement) payload.complement = input.complement;
  if (input.neighborhood) payload.neighborhood = input.neighborhood;
  if (input.city) payload.city = input.city;
  if (input.state) payload.state = input.state;
  if (input.birth_date) payload.birth_date = input.birth_date;
  if (input.rg) payload.rg = input.rg;
  if (input.social_name) payload.social_name = input.social_name;
  if (input.notes) payload.notes = input.notes;

  // Add compatibility aliases so different backend schemas accept these fields
  try {
    if (input.cep) {
      const cleanedCep = String(input.cep).replace(/\D/g, '');
      if (cleanedCep) {
        payload.postal_code = cleanedCep;
        payload.zip = cleanedCep;
      }
    }
  } catch (e) { /* ignore */ }

  if (input.birth_date) {
    payload.date_of_birth = input.birth_date;
    payload.dob = input.birth_date;
    payload.birthdate = input.birth_date;
  }

  if (input.sex) {
    payload.sex = input.sex;
    payload.sexo = input.sex;
    payload.gender = input.sex;
  }

  // Call the create-user-with-password endpoint (try functions path then root)
  const fnUrls = [
    `${API_BASE}/functions/v1/create-user-with-password`,
    `${API_BASE}/create-user-with-password`,
    'https://yuanqfswhberkoevtmfr.supabase.co/functions/v1/create-user-with-password',
    'https://yuanqfswhberkoevtmfr.supabase.co/create-user-with-password',
  ];

  let lastErr: any = null;
  
  // Debug: verificar token antes de tentar
  const debugToken = getAuthToken();
  if (!debugToken) {
    console.warn('[criarPaciente] ⚠️ AVISO: Nenhum token de autenticação encontrado no localStorage/sessionStorage! Tentando mesmo assim, mas possível causa do erro.');
  } else {
    console.debug('[criarPaciente] ✓ Token encontrado, comprimento:', debugToken.length);
  }
  
  for (const u of fnUrls) {
    try {
      const headers = { ...baseHeaders(), 'Content-Type': 'application/json' } as Record<string,string>;
      const maskedHeaders = { ...headers } as Record<string,string>;
      if (maskedHeaders.Authorization) {
        const a = maskedHeaders.Authorization as string;
        maskedHeaders.Authorization = `${a.slice(0,6)}...${a.slice(-6)}`;
      }
      console.debug('[criarPaciente] Tentando criar paciente em:', u.replace(/^https:\/\/[^\/]+/, 'https://[...host...]'));
      const res = await fetch(u, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      // Let parse() handle validation/400-like responses and throw friendly errors
      const parsed = await parse<any>(res as Response);

      // If server returned patient_id, fetch the patient to return a Paciente object
      if (parsed && parsed.patient_id) {
        const paciente = await buscarPacientePorId(String(parsed.patient_id)).catch(() => null);
        // Attach the generated password so callers (UI) can display it if necessary
        if (paciente) return Object.assign(paciente, { password });
        // If patient not found but response includes patient-like object, return it
        if (parsed.patient) return Object.assign(parsed.patient, { password });
        // Otherwise, return a minimal Paciente-like object based on input
  return Object.assign({ id: parsed.patient_id, full_name: input.full_name, cpf: cleanCpf, email: input.email ?? undefined, phone_mobile: input.phone_mobile ?? undefined } as Paciente, { password });
      }

      // If server returned patient object directly
      if (parsed && parsed.id && (parsed.full_name || parsed.cpf)) {
        return Object.assign(parsed, { password });
      }

      // If server returned an envelope with user and message but no patient, try to
      // surface a helpful object. Use parse result as best-effort payload.
      if (parsed && parsed.user && parsed.user.id) {
        // try to find patient by email as fallback
        const maybe = await fetch(`${REST}/patients?email=eq.${encodeURIComponent(String(input.email))}&select=*`, { method: 'GET', headers: baseHeaders() }).then((r) => r.ok ? r.json().catch(() => []) : []);
  if (Array.isArray(maybe) && maybe.length) return Object.assign(maybe[0] as Paciente, { password });
  return Object.assign({ id: parsed.user.id, full_name: input.full_name, email: input.email ?? undefined } as Paciente, { password });
      }

      // otherwise, let parse() have returned something meaningful; return as Paciente
      return Object.assign(parsed || {}, { password });
    } catch (err: any) {
      lastErr = err;
      const emsg = err && typeof err === 'object' && 'message' in err ? (err as any).message : String(err);
      console.warn('[criarPaciente] ❌ Tentativa em', u, 'falhou:', emsg);
      
      // Se o erro é uma falha de fetch (network/CORS)
      if (emsg && (emsg.toLowerCase().includes('failed to fetch') || emsg.toLowerCase().includes('networkerror'))) {
        console.error('[criarPaciente] ⚠️ FALHA DE REDE/CORS detectada. Possíveis causas:\n' +
          '1. Função Supabase /create-user-with-password não existe ou está desativada\n' +
          '2. CORS configurado incorretamente no Supabase\n' +
          '3. Endpoint indisponível ou a rede está offline\n' +
          '4. Token expirado ou inválido\n' +
          'URL que falhou:', u);
      }
      // try next
    }
  }

  const emsg = lastErr && typeof lastErr === 'object' && 'message' in lastErr ? (lastErr as any).message : String(lastErr ?? 'sem detalhes');
  
  // Mensagem de erro mais detalhada e útil
  let friendlyMsg = `Falha ao criar paciente.`;
  if (emsg.toLowerCase().includes('networkerror') || emsg.toLowerCase().includes('failed to fetch')) {
    friendlyMsg += ` Erro de rede/CORS detectado. `;
    friendlyMsg += `Verifique se:\n`;
    friendlyMsg += `• A função /create-user-with-password existe no Supabase\n`;
    friendlyMsg += `• Você está autenticado (token no localStorage)\n`;
    friendlyMsg += `• CORS está configurado corretamente\n`;
    friendlyMsg += `• A rede está disponível`;
  } else {
    friendlyMsg += ` ${emsg}`;
  }
  
  throw new Error(friendlyMsg);
}

export async function atualizarPaciente(id: string | number, input: PacienteInput): Promise<Paciente> {
  const url = `${ENV_CONFIG.SUPABASE_URL}/rest/v1/patients?id=eq.${id}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: withPrefer({ ...baseHeaders(), "Content-Type": "application/json" }, "return=representation"),
    body: JSON.stringify(input),
  });
  const arr = await parse<Paciente[] | Paciente>(res);
  return Array.isArray(arr) ? arr[0] : (arr as Paciente);
}

export async function excluirPaciente(id: string | number): Promise<void> {
  // Antes de excluir, verificar se existem relatórios ou atribuições vinculadas a este paciente
  let reportsCount = 0;
  let assignmentsCount = 0;

  try {
    // Import dinâmico para evitar ciclos durante bundling
    const reportsMod = await import('./reports');
    if (reportsMod && typeof reportsMod.listarRelatoriosPorPaciente === 'function') {
      const rels = await reportsMod.listarRelatoriosPorPaciente(String(id)).catch(() => []);
      if (Array.isArray(rels)) reportsCount = rels.length;
    }
  } catch (err) {
    console.warn('[API] Falha ao checar relatórios vinculados antes da exclusão:', err);
  }

  try {
    const assignMod = await import('./assignment');
    if (assignMod && typeof assignMod.listAssignmentsForPatient === 'function') {
      const assigns = await assignMod.listAssignmentsForPatient(String(id)).catch(() => []);
      if (Array.isArray(assigns)) assignmentsCount = assigns.length;
    }
  } catch (err) {
    console.warn('[API] Falha ao checar atribuições de paciente antes da exclusão:', err);
  }

  const totalDeps = (reportsCount || 0) + (assignmentsCount || 0);
  if (totalDeps > 0) {
    const parts: string[] = [];
    if (reportsCount > 0) parts.push(`${reportsCount} relatório${reportsCount !== 1 ? 's' : ''}`);
    if (assignmentsCount > 0) parts.push(`${assignmentsCount} atribuição${assignmentsCount !== 1 ? 'ões' : ''}`);
    const depsText = parts.join(' e ');
    throw new Error(`Não é possível excluir este paciente: existem ${depsText} vinculad${totalDeps !== 1 ? 'os' : 'o'}. Remova ou reatribua essas dependências antes de excluir o paciente.`);
  }

  const url = `${REST}/patients?id=eq.${id}`;
  const res = await fetch(url, { method: "DELETE", headers: baseHeaders() });
  await parse<any>(res);
}

/**
 * Chama o endpoint server-side seguro para atribuir roles.
 * Este endpoint usa a service role key e valida se o requisitante é administrador.
 */
export async function assignRoleServerSide(userId: string, role: string): Promise<any> {
  // Atribuição de roles é uma operação privilegiada que requer a
  // service_role key do Supabase (ou equivalente) e validação de permissões
  // server-side. Não execute isso do cliente.
  //
  // Antes este helper chamava `/api/assign-role` (um proxy server-side).
  // Agora que o projeto deve usar apenas o endpoint público seguro de
  // criação de usuários (OpenAPI `/create-user`), a atribuição deve ocorrer
  // dentro desse endpoint no backend. Portanto este helper foi descontinuado
  // no cliente para evitar qualquer tentativa de realizar operação
  // privilegiada no navegador.
  throw new Error('assignRoleServerSide is not available in the client. Use the backend /create-user endpoint which performs role assignment server-side.');
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
  const q = encodeURIComponent(searchTerm);
  
  // Monta queries para buscar em múltiplos campos
  const queries = [];
  
  // Busca por ID se parece com UUID
  if (searchTerm.includes('-') && searchTerm.length > 10) {
    queries.push(`id=eq.${encodeURIComponent(searchTerm)}`);
  }
  
  // Busca por CRM (com e sem formatação)
  if (digitsOnly.length >= 3) {
    queries.push(`crm=ilike.*${encodeURIComponent(digitsOnly)}*`);
  }
  
  // Busca por nome (usando ilike para busca case-insensitive)
  // NOTA: apenas full_name existe na tabela, nome_social foi removido
  if (searchTerm.length >= 2) {
    queries.push(`full_name=ilike.*${q}*`);
  }
  
  // Busca por email se contém @
  if (searchTerm.includes('@')) {
    // Quando o usuário pesquisa por email (contendo '@'), limitar as queries apenas ao campo email.
    queries.length = 0;
    queries.push(`email=ilike.*${q}*`);
  }
  
  // Busca por especialidade
  if (searchTerm.length >= 2) {
    queries.push(`specialty=ilike.*${q}*`);
  }
  
  const results: Medico[] = [];
  const seenIds = new Set<string>();
  
  // Executa as buscas e combina resultados únicos
  for (const query of queries) {
    try {
      const url = `${REST}/doctors?${query}&limit=10`;
      const headers = baseHeaders();
      const res = await fetch(url, { method: 'GET', headers });
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
      console.warn(`[API] Erro na busca de médicos com query: ${query}`, error);
    }
  }
  
  return results.slice(0, 20); // Limita a 20 resultados
}

export async function buscarMedicoPorId(id: string | number): Promise<Medico | null> {
  // Primeiro tenta buscar no Supabase (dados reais)
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  const isString = typeof id === 'string';
  const sId = String(id);

  // Helper para escape de aspas
  const escapeQuotes = (v: string) => JSON.stringify(v).slice(1, -1);

  try {
    // 1) Se parece UUID, busca por id direto
    if (isString && uuidRegex.test(sId)) {
      const url = `${REST}/doctors?id=eq.${encodeURIComponent(sId)}`;
      // Log removido por segurança
      const arr = await fetchWithFallback<Medico[]>(url, baseHeaders());
      if (arr && arr.length > 0) return arr[0];
    }

    // 2) Se for string não numérica (um nome), tente buscar por full_name e nome_social
    if (isString && isNaN(Number(sId))) {
      const quoted = `"${escapeQuotes(sId)}"`;
      // tentar por full_name usando ilike para evitar 400 com espaços/caracteres
      try {
        const q = encodeURIComponent(sId);
              const params = new URLSearchParams();
              params.set('full_name', `ilike.*${q}*`);
              params.set('limit', '5');
              const url = `${REST}/doctors?${params.toString()}`;
              const altParams = new URLSearchParams();
              altParams.set('nome_social', `ilike.*${q}*`);
              altParams.set('limit', '5');
              const alt = `${REST}/doctors?${altParams.toString()}`;
  const socialAltParams = new URLSearchParams();
  socialAltParams.set('social_name', `ilike.*${sId}*`);
  socialAltParams.set('limit', '5');
  const socialAlt = `${REST}/doctors?${socialAltParams.toString()}`;
  const arr = await fetchWithFallback<Medico[]>(url, baseHeaders(), [alt, socialAlt]);
        if (arr && arr.length > 0) return arr[0];
      } catch (e) {
        // ignore and try next
      }

      // tentar nome_social também com ilike
      // (já tratado acima via fetchWithFallback)
    }

    // 3) Por fim, tentar buscar por id (como último recurso)
    try {
      const idParam = encodeURIComponent(sId);
      const url3 = `${REST}/doctors?id=eq.${idParam}`;
      const arr3 = await fetchWithFallback<Medico[]>(url3, baseHeaders());
      if (arr3 && arr3.length > 0) return arr3[0];
    } catch (e) {
      // continue to mock fallback
    }
  } catch (error) {
    console.warn('Erro ao buscar no Supabase, tentando mock API:', error);
  }

  // Se não encontrar no Supabase, tenta o mock API
  try {
    const mockUrl = `https://yuanqog.com/m1/1053378-0-default/rest/v1/doctors/${encodeURIComponent(String(id))}`;
    // Log removido por segurança
    try {
      const medico = await fetchWithFallback<any>(mockUrl, { Accept: 'application/json' });
      if (medico) {
        return medico as Medico;
      }
      // fetchWithFallback returned null -> not found
      return null;
    } catch (fetchErr) {
      // Falha silenciosa
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao buscar médico em ambas as APIs:', error);
    return null;
  }
}

// Buscar vários médicos por IDs
export async function buscarMedicosPorIds(ids: Array<string | number>): Promise<Medico[]> {
  if (!ids || !ids.length) return [];
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  const uuids: string[] = [];
  const names: string[] = [];
  for (const id of ids) {
    const s = String(id).trim();
    if (!s) continue;
    if (uuidRegex.test(s)) uuids.push(s);
    else names.push(s);
  }

  const results: Medico[] = [];

  if (uuids.length) {
    const uuidsParam = uuids.join(',');
    const url = `${REST}/doctors?id=in.(${uuidsParam})&limit=200`;
    try {
      const res = await fetch(url, { method: 'GET', headers: baseHeaders() });
      const arr = await parse<Medico[]>(res);
      if (arr && arr.length) results.push(...arr);
    } catch (e) {
      // ignore
    }
  }

  if (names.length) {
    // Evitar in.(...) com aspas — fazer uma requisição por nome usando ilike
    for (const name of names) {
      try {
        const params = new URLSearchParams();
        params.set('full_name', `ilike.*${name}*`);
        params.set('limit', '200');
        const url = `${REST}/doctors?${params.toString()}`;
        const altParams = new URLSearchParams();
        altParams.set('nome_social', `ilike.*${name}*`);
        altParams.set('limit', '200');
        const alt = `${REST}/doctors?${altParams.toString()}`;
        const headers = baseHeaders();
        // Log removido por segurança
  const socialAltParams = new URLSearchParams();
  socialAltParams.set('social_name', `ilike.*${name}*`);
  socialAltParams.set('limit', '200');
  const socialAlt = `${REST}/doctors?${socialAltParams.toString()}`;
  const arr = await fetchWithFallback<Medico[]>(url, headers, [alt, socialAlt]);
        if (arr && arr.length) results.push(...arr);
      } catch (e) {
        // ignore
      }
    }
  }

  const seen = new Set<string>();
  const unique: Medico[] = [];
  for (const d of results) {
    if (!d || !d.id) continue;
    if (!seen.has(d.id)) {
      seen.add(d.id);
      unique.push(d);
    }
  }
  return unique;
}

// Alias/backwards-compat: listarProfissionais usado por components
export async function listarProfissionais(params?: { page?: number; limit?: number; q?: string; }): Promise<Medico[]> {
  // Reuse listarMedicos implementation to avoid duplication
  return await listarMedicos(params);
}

// Dentro de lib/api.ts
export async function criarMedico(input: MedicoInput): Promise<Medico> {
  // Make criarMedico behave like criarPaciente: prefer the create-user-with-password
  // endpoint so that an Auth user is created and the UI can display a generated
  // password. If that endpoint is not available, fall back to the existing
  // create-doctor Edge Function behavior.
  if (!input) throw new Error('Dados do médico não informados');
  const required = ['email', 'full_name', 'cpf', 'crm', 'crm_uf'];
  for (const r of required) {
    const val = (input as any)[r];
    if (!val || (typeof val === 'string' && String(val).trim() === '')) {
      throw new Error(`Campo obrigatório ausente: ${r}`);
    }
  }

  // Normalize and validate CPF
  const cleanCpf = String(input.cpf || '').replace(/\D/g, '');
  if (!/^\d{11}$/.test(cleanCpf)) {
    throw new Error('CPF inválido. Deve conter 11 dígitos numéricos.');
  }

  // Normalize CRM UF
  const crmUf = String(input.crm_uf || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(crmUf)) {
    throw new Error('CRM UF inválido. Deve conter 2 letras maiúsculas (ex: SP, RJ).');
  }

  // First try the create-user-with-password flow (mirrors criarPaciente)
  const password = gerarSenhaAleatoria();
  const payload: any = {
    email: input.email,
    password,
    full_name: input.full_name,
    phone: input.phone_mobile || null,
    role: 'medico' as any,
    create_doctor_record: true,
    cpf: cleanCpf,
    phone_mobile: input.phone_mobile,
    crm: input.crm,
    crm_uf: crmUf,
  };

  // Attach other optional fields that backend may accept
  if (input.specialty) payload.specialty = input.specialty;
  if (input.cep) payload.cep = input.cep;
  if (input.street) payload.street = input.street;
  if (input.number) payload.number = input.number;
  if (input.complement) payload.complement = input.complement;
  if (input.neighborhood) payload.neighborhood = input.neighborhood;
  if (input.city) payload.city = input.city;
  if (input.state) payload.state = input.state;
  if (input.birth_date) payload.birth_date = input.birth_date;
  if ((input as any).sexo) payload.sexo = (input as any).sexo;
  if ((input as any).sexo) payload.gender = (input as any).sexo;
  if (input.rg) payload.rg = input.rg;
  // compatibility aliases
  try {
    if ((input as any).cep) {
      const cleaned = String((input as any).cep).replace(/\D/g, '');
      if (cleaned) { payload.postal_code = cleaned; payload.zip = cleaned; }
    }
  } catch (e) {}
  if ((input as any).birth_date) {
    payload.date_of_birth = (input as any).birth_date;
    payload.dob = (input as any).birth_date;
    payload.birthdate = (input as any).birth_date;
  }
  if ((input as any).sexo) {
    payload.sexo = (input as any).sexo;
    payload.gender = (input as any).sexo;
  }

  const fnUrls = [
    `${API_BASE}/functions/v1/create-user-with-password`,
    `${API_BASE}/create-user-with-password`,
    'https://yuanqfswhberkoevtmfr.supabase.co/functions/v1/create-user-with-password',
    'https://yuanqfswhberkoevtmfr.supabase.co/create-user-with-password',
  ];

  let lastErr: any = null;
  for (const u of fnUrls) {
    try {
      const headers = { ...baseHeaders(), 'Content-Type': 'application/json' } as Record<string,string>;
      const maskedHeaders = { ...headers } as Record<string,string>;
      if (maskedHeaders.Authorization) {
        const a = maskedHeaders.Authorization as string;
        maskedHeaders.Authorization = `${a.slice(0,6)}...${a.slice(-6)}`;
      }
      // Log removido por segurança

      const res = await fetch(u, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const parsed = await parse<any>(res as Response);

      // If server returned doctor_id, fetch the doctor
      if (parsed && parsed.doctor_id) {
        const doc = await buscarMedicoPorId(String(parsed.doctor_id)).catch(() => null);
        if (doc) return Object.assign(doc, { password });
        if (parsed.doctor) return Object.assign(parsed.doctor, { password });
        return Object.assign({ id: parsed.doctor_id, full_name: input.full_name, cpf: cleanCpf, email: input.email } as Medico, { password });
      }

      // If server returned doctor object directly
      if (parsed && (parsed.id || parsed.full_name || parsed.cpf)) {
        return Object.assign(parsed, { password }) as Medico;
      }

      // If server returned an envelope with user, try to locate doctor by email
      if (parsed && parsed.user && parsed.user.id) {
        const maybe = await fetch(`${REST}/doctors?email=eq.${encodeURIComponent(String(input.email))}&select=*`, { method: 'GET', headers: baseHeaders() }).then((r) => r.ok ? r.json().catch(() => []) : []);
        if (Array.isArray(maybe) && maybe.length) return Object.assign(maybe[0] as Medico, { password });
        return Object.assign({ id: parsed.user.id, full_name: input.full_name, email: input.email } as Medico, { password });
      }

      // otherwise return parsed with password as best-effort
      return Object.assign(parsed || {}, { password });
    } catch (err: any) {
      lastErr = err;
      const emsg = err && typeof err === 'object' && 'message' in err ? (err as any).message : String(err);
      console.warn('[criarMedico] tentativa em', u, 'falhou:', emsg);
      if (emsg && emsg.toLowerCase().includes('failed to fetch')) {
        console.error('[criarMedico] Falha de fetch (network/CORS). Verifique autenticação (token no localStorage/sessionStorage) e se o endpoint permite requisições CORS do seu domínio. Também confirme que a função /create-user-with-password existe e está acessível.');
      }
      // try next
    }
  }

  // If create-user-with-password attempts failed, fall back to existing create-doctor function
  try {
    const fallbackPayload: any = {
      email: input.email,
      full_name: input.full_name,
      cpf: cleanCpf,
      crm: input.crm,
      crm_uf: crmUf,
      create_user: false,
    };
  if (input.specialty) fallbackPayload.specialty = input.specialty;
  if (input.phone_mobile) fallbackPayload.phone_mobile = input.phone_mobile;
  if (input.phone2 !== undefined) fallbackPayload.phone2 = input.phone2;

    const url = `${API_BASE}/functions/v1/create-doctor`;
    const headers = { ...baseHeaders(), 'Content-Type': 'application/json' } as Record<string, string>;
    // Logs removidos por segurança

    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(fallbackPayload) });
    const parsed = await parse<any>(res as Response);

    if (parsed && parsed.doctor && typeof parsed.doctor === 'object') return parsed.doctor as Medico;
    if (parsed && parsed.doctor_id) {
      const d = await buscarMedicoPorId(String(parsed.doctor_id));
      if (d) return d;
      throw new Error('Médico criado mas não foi possível recuperar os dados do perfil.');
    }
    if (parsed && (parsed.id || parsed.full_name || parsed.cpf)) return parsed as Medico;

    // As a last fallback, if the fallback didn't return a doctor, but we created an auth user earlier
    const emsg = lastErr && typeof lastErr === 'object' && 'message' in lastErr ? (lastErr as any).message : String(lastErr ?? 'sem detalhes');
    throw new Error(`Falha ao criar médico: ${emsg}`);
  } catch (err) {
    // If the fallback errored with email already registered, try to return existing doctor by email
    const msg = String((err as any)?.message || '').toLowerCase();
    if (msg.includes('already been registered') || msg.includes('já está cadastrado') || msg.includes('already registered')) {
      try {
        const checkUrl = `${REST}/doctors?email=eq.${encodeURIComponent(String(input.email || ''))}&select=*`;
        const checkRes = await fetch(checkUrl, { method: 'GET', headers: baseHeaders() });
        if (checkRes.ok) {
          const arr = await parse<Medico[]>(checkRes);
          if (Array.isArray(arr) && arr.length > 0) return arr[0];
        }
      } catch (inner) {
        // ignore
      }
    }
    throw err;
  }
}

/**
 * Client helper to call the create-user-with-password endpoint. This function
 * tries the functions path first and then falls back to root create-user-with-password.
 */
export async function criarUsuarioComSenha(input: { email: string; password: string; full_name: string; phone?: string | null; role: UserRoleEnum; create_patient_record?: boolean; cpf?: string; phone_mobile?: string; }): Promise<any> {
  const urls = [
    `${API_BASE}/functions/v1/create-user-with-password`,
    `${API_BASE}/create-user-with-password`,
    'https://yuanqfswhberkoevtmfr.supabase.co/functions/v1/create-user-with-password',
    'https://yuanqfswhberkoevtmfr.supabase.co/create-user-with-password',
  ];
  let lastErr: any = null;
  for (const u of urls) {
    try {
      const res = await fetch(u, { method: 'POST', headers: { ...baseHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      return await parse<any>(res as Response);
    } catch (err: any) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Falha ao chamar create-user-with-password');
}

/**
 * Vincula um user_id (auth user id) a um registro de médico existente.
 * Retorna o médico atualizado.
 */
export async function vincularUserIdMedico(medicoId: string | number, userId: string): Promise<Medico> {
  const url = `${REST}/doctors?id=eq.${encodeURIComponent(String(medicoId))}`;
  const payload = { user_id: String(userId) };
  const res = await fetch(url, {
    method: 'PATCH',
    headers: withPrefer({ ...baseHeaders(), 'Content-Type': 'application/json' }, 'return=representation'),
    body: JSON.stringify(payload),
  });
  const arr = await parse<Medico[] | Medico>(res);
  return Array.isArray(arr) ? arr[0] : (arr as Medico);
}


/**
 * Vincula um user_id (auth user id) a um registro de paciente existente.
 * Retorna o paciente atualizado.
 */
export async function vincularUserIdPaciente(pacienteId: string | number, userId: string): Promise<Paciente> {
  // Validate pacienteId looks like a UUID (basic check) or at least a non-empty string/number
  const idStr = String(pacienteId || '').trim();
  if (!idStr) throw new Error('ID do paciente inválido ao tentar vincular user_id.');

  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  const looksLikeUuid = uuidRegex.test(idStr);
  // Allow non-UUID ids (legacy) but log a debug warning when it's not UUID
  // Log removido por segurança

  const url = `${REST}/patients?id=eq.${encodeURIComponent(idStr)}`;
  const payload = { user_id: String(userId) };

  // Debug-friendly masked headers
  const headers = withPrefer({ ...baseHeaders(), 'Content-Type': 'application/json' }, 'return=representation');
  // Logs removidos por segurança

  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });

  // If parse throws, the existing parse() will log response details; ensure we also surface helpful context
  try {
    const arr = await parse<Paciente[] | Paciente>(res);
    return Array.isArray(arr) ? arr[0] : (arr as Paciente);
  } catch (err) {
    console.error('[vincularUserIdPaciente] erro ao vincular - falha na requisição');
    throw err;
  }
}




export async function atualizarMedico(id: string | number, input: MedicoInput): Promise<Medico> {
  // Logs removidos por segurança
  
  // Criar um payload limpo apenas com campos básicos que sabemos que existem
  const cleanPayload = {
    // Basic identification / contact
    full_name: input.full_name,
    nome_social: (input as any).nome_social || undefined,
    crm: input.crm,
    crm_uf: (input as any).crm_uf || (input as any).crmUf || undefined,
    rqe: (input as any).rqe || undefined,
    specialty: input.specialty,
    email: input.email,
    phone_mobile: input.phone_mobile,
    phone2: (input as any).phone2 ?? (input as any).telefone ?? undefined,
    cpf: input.cpf,
    rg: (input as any).rg ?? undefined,

    // Address
    cep: input.cep,
    street: input.street,
    number: input.number,
    complement: (input as any).complement ?? undefined,
    neighborhood: (input as any).neighborhood ?? (input as any).bairro ?? undefined,
    city: input.city,
    state: input.state,

    // Personal / professional
    birth_date: (input as any).birth_date ?? (input as any).data_nascimento ?? undefined,
    sexo: (input as any).sexo ?? undefined,
    formacao_academica: (input as any).formacao_academica ?? undefined,
    observacoes: (input as any).observacoes ?? undefined,

    // Administrative / financial
    tipo_vinculo: (input as any).tipo_vinculo ?? undefined,
    dados_bancarios: (input as any).dados_bancarios ?? undefined,
    valor_consulta: (input as any).valor_consulta ?? undefined,
    agenda_horario: (input as any).agenda_horario ?? undefined,

    // Flags
    active: input.active ?? true
  };
  
  console.log(`Payload limpo:`, cleanPayload);
  
  // Atualizar apenas no Supabase (dados reais)
  try {
    const url = `${REST}/doctors?id=eq.${id}`;
  // Log removido por segurança
    
    const res = await fetch(url, {
      method: "PATCH",
      headers: withPrefer({ ...baseHeaders(), "Content-Type": "application/json" }, "return=representation"),
      body: JSON.stringify(cleanPayload),
    });
    
  // Log removido por segurança
    
  if (res.ok) {
  const arr = await parse<Medico[] | Medico>(res);
  const result = Array.isArray(arr) ? arr[0] : (arr as Medico);
  // Log removido por segurança
      return result;
    } else {
      // Vamos tentar ver o erro detalhado
      const errorText = await res.text();
  console.error(`Erro detalhado do Supabase:`, {
        status: res.status,
        statusText: res.statusText,
        response: errorText,
        headers: Object.fromEntries(res.headers.entries())
      });
      throw new Error(`Supabase error: ${res.status} ${res.statusText} - ${errorText}`);
    }
  } catch (error) {
    console.error('Erro ao atualizar médico:', error);
    throw error;
  }
}

export async function excluirMedico(id: string | number): Promise<void> {
  const url = `${REST}/doctors?id=eq.${id}`;
  const res = await fetch(url, { method: "DELETE", headers: baseHeaders() });
  await parse<any>(res);
}

// ===== USUÁRIOS =====

// Roles válidos conforme documentação API
export type UserRoleEnum = "admin" | "gestor" | "medico" | "secretaria" | "user";

export type UserRole = {
  id: string;
  user_id: string;
  role: UserRoleEnum;
  created_at: string;
};

export async function listarUserRoles(): Promise<UserRole[]> {
  const url = `${API_BASE}/rest/v1/user_roles`;
  const res = await fetch(url, {
    method: "GET",
    headers: baseHeaders(),
  });
  return await parse<UserRole[]>(res);
}

export type PatientAssignment = {
  id: string;
  patient_id: string;
  user_id: string;
  role: 'medico' | 'enfermeiro';
  created_at?: string;
  created_by?: string | null;
};

// Listar atribuições de pacientes (GET /rest/v1/patient_assignments)
export async function listarPatientAssignments(params?: { page?: number; limit?: number; q?: string; }): Promise<PatientAssignment[]> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  const url = `${REST}/patient_assignments${qs.toString() ? `?${qs.toString()}` : ''}`;
  const res = await fetch(url, { method: 'GET', headers: { ...baseHeaders(), ...rangeHeaders(params?.page, params?.limit) } });
  return await parse<PatientAssignment[]>(res);
}


export type User = {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
  last_sign_in_at: string | null;
};

export type CurrentUser = {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
  last_sign_in_at: string | null;
};

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
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
  profile: Profile | null;
  roles: UserRoleEnum[];
  permissions: Permissions;
};

export async function getCurrentUser(): Promise<CurrentUser> {
  const url = `${API_BASE}/auth/v1/user`;
  const res = await fetch(url, {
    method: "GET",
    headers: baseHeaders(),
  });
  return await parse<CurrentUser>(res);
}

export async function getUserInfo(): Promise<UserInfo> {
  const jwt = getAuthToken();
  if (!jwt) {
    // No token available — avoid calling the protected function and throw a friendly error
    throw new Error('Você não está autenticado. Faça login para acessar informações do usuário.');
  }

  const url = `${API_BASE}/functions/v1/user-info`;
  const res = await fetch(url, {
    method: "GET",
    headers: baseHeaders(),
  });

  // Avoid calling parse() for auth errors to prevent noisy console dumps
  if (!res.ok && res.status === 401) {
    throw new Error('Você não está autenticado. Faça login novamente.');
  }

  return await parse<UserInfo>(res);
}

/**
 * Retorna dados de usuário específico (apenas admin/gestor)
 * 
 * Endpoint: POST /functions/v1/user-info-by-id/{userId}
 * 
 * @param userId - UUID do usuário a ser consultado
 * @returns Informações do usuário (user, profile, roles)
 * @throws Erro se não autenticado (401) ou sem permissão (403)
 * 
 * Documentação: https://docs.mediconnect.com
 */
export async function getUserInfoById(userId: string): Promise<UserInfo> {
  const jwt = getAuthToken();
  if (!jwt) {
    // No token available — avoid calling the protected function and throw a friendly error
    throw new Error('Você não está autenticado. Faça login para acessar informações do usuário.');
  }

  if (!userId) {
    throw new Error('userId é obrigatório');
  }

  // ID na URL path, não no body
  const url = `${API_BASE}/functions/v1/user-info-by-id/${encodeURIComponent(userId)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: baseHeaders(),
  });

  // Avoid calling parse() for auth errors to prevent noisy console dumps
  if (!res.ok && res.status === 401) {
    throw new Error('Você não está autenticado. Faça login novamente.');
  }

  if (!res.ok && res.status === 403) {
    throw new Error('Você não tem permissão para acessar informações de outro usuário. Apenas admin/gestor podem.');
  }

  return await parse<UserInfo>(res);
}

export type CreateUserInput = {
  email: string;
  password: string;
  full_name: string;
  phone?: string | null;
  role: UserRoleEnum;
  // Optional: when provided, backend can use this to perform a redirect
  // to the given URL or interpret `target` to build a role-specific redirect.
  emailRedirectTo?: string;
  // Compatibility: some integrations expect `redirect_url` as the parameter name
  // for the post-auth redirect. Include it so backend/functions receive it.
  redirect_url?: string;
  target?: 'paciente' | 'medico' | 'admin' | 'default';
};

export type CreatedUser = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRoleEnum;
};

export type CreateUserResponse = {
  success: boolean;
  user: CreatedUser;
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
  // Prefer calling the Functions path at the explicit project URL provided
  // by the environment / team. Keep the API_BASE-root fallback for other deployments.
  const explicitFunctionsUrl = 'https://yuanqfswhberkoevtmfr.supabase.co/functions/v1/create-user';
  const functionsUrl = explicitFunctionsUrl;
  const url = `${API_BASE}/create-user`;

  let res: Response | null = null;
  try {
    res = await fetch(functionsUrl, {
      method: 'POST',
      headers: { ...baseHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch (err: any) {
    console.error('[criarUsuario] fetch error for', functionsUrl, err);
    // Attempt root /create-user fallback when functions path can't be reached
    try {
      console.warn('[criarUsuario] tentando fallback para', url);
      const res2 = await fetch(url, {
        method: 'POST',
        headers: { ...baseHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      return await parse<CreateUserResponse>(res2 as Response);
    } catch (err2: any) {
      console.error('[criarUsuario] fallback /create-user also failed', err2);
      throw new Error(
        'Falha ao contatar o endpoint /functions/v1/create-user e o fallback /create-user também falhou. Verifique disponibilidade e CORS. Detalhes: ' +
          (err?.message ?? String(err)) + ' | fallback: ' + (err2?.message ?? String(err2))
      );
    }
  }

  // If we got a response but it's 404 (route not found), try the root path too
  if (res && !res.ok && res.status === 404) {
    try {
      console.warn('[criarUsuario] /functions/v1/create-user returned 404; trying root path', url);
      const res2 = await fetch(url, {
        method: 'POST',
        headers: { ...baseHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      return await parse<CreateUserResponse>(res2 as Response);
    } catch (err2: any) {
      console.error('[criarUsuario] fallback /create-user failed after 404', err2);
      // Fall through to parse original response to provide friendly error
    }
  }

  return await parse<CreateUserResponse>(res as Response);
}

// ===== ALTERNATIVA: Criar usuário diretamente via Supabase Auth =====
// Esta função é um fallback caso a função server-side create-user falhe

export async function criarUsuarioDirectAuth(input: {
  email: string;
  password: string;
  full_name: string;
  phone?: string | null;
  role: UserRoleEnum;
  userType?: 'profissional' | 'paciente';
}): Promise<CreateUserWithPasswordResponse> {
  console.log('[DIRECT AUTH] Criando usuário diretamente via Supabase Auth...');
  
  const signupUrl = `${API_BASE}/auth/v1/signup`;
  
  const payload = {
    email: input.email,
    password: input.password,
    data: {
      userType: input.userType || (input.role === 'medico' ? 'profissional' : 'paciente'),
      full_name: input.full_name,
      phone: input.phone || '',
    }
  };
  
  try {
    const response = await fetch(signupUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "apikey": ENV_CONFIG.SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `Erro ao criar usuário (${response.status})`;
      try {
        const errorData = JSON.parse(errorText);
        errorMsg = errorData.msg || errorData.message || errorData.error_description || errorMsg;
      } catch (e) {
        // Ignora erro de parse
      }
      throw new Error(errorMsg);
    }
    
    const responseData = await response.json();
    // Try several common locations for the returned user id depending on Supabase configuration
    const userId = responseData?.user?.id || responseData?.id || responseData?.data?.user?.id || responseData?.data?.id;

  // If no user id was returned, treat this as a failure. Some Supabase setups (for example invite-only flows)
  // may not return the user id immediately. In that case we cannot safely link the profile to a user.
    if (!userId) {
      console.warn('[DIRECT AUTH] signup response did not include a user id; response:', responseData);
      throw new Error('Signup did not return a user id (provider may be configured for invite or pending-confirmation flows). Fallback cannot determine created user id.');
    }

    console.log('[DIRECT AUTH] Usuário criado:', userId);

    // NOTE: Role assignments MUST be done by the backend (Edge Function or server)
    // when creating the user. The frontend should NOT attempt to assign roles.
    // The backend should use the service role key to insert into user_roles table.

    return {
      success: true,
      user: {
        id: userId,
        email: input.email,
        full_name: input.full_name,
        phone: input.phone || null,
        role: input.role,
      },
      email: input.email,
      password: input.password,
    };
    
  } catch (error: any) {
    console.error('[DIRECT AUTH] Erro ao criar usuário:', error);
    throw error;
  }
}

// ============================================
// CRIAÇÃO DE USUÁRIOS NO SUPABASE AUTH
// Vínculo com pacientes/médicos por EMAIL
// ============================================

// Criar usuário para MÉDICO no Supabase Auth (sistema de autenticação)
export async function criarUsuarioMedico(medico: { email: string; full_name: string; phone_mobile: string; }): Promise<any> {
  const redirectBase = DEFAULT_LANDING;
  const emailRedirectTo = `${redirectBase.replace(/\/$/, '')}/profissional`;
  // Use the role-specific landing as the redirect_url so the server-side
  // flow redirects users directly to the app path (e.g. /profissional).
  const redirect_url = emailRedirectTo;
  // generate a secure-ish random password on the client so the caller can receive it
  const password = gerarSenhaAleatoria();
  const resp = await criarUsuario({ email: medico.email, password, full_name: medico.full_name, phone: medico.phone_mobile, role: 'medico' as any, emailRedirectTo, redirect_url, target: 'medico' });
  // Return backend response plus the generated password so the UI can show/save it
  return { ...(resp as any), password };
}

// Criar usuário para PACIENTE no Supabase Auth (sistema de autenticação)
export async function criarUsuarioPaciente(paciente: { email: string; full_name: string; phone_mobile: string; }): Promise<any> {
  // Este helper NÃO deve usar /create-user como fallback.
  // Em vez disso, encaminha para a Edge Function especializada /functions/v1/create-patient
  // e inclui uma senha gerada para que o backend possa, se suportado, definir credenciais.
  if (!paciente) throw new Error('Dados do paciente não informados');

  const required = ['email', 'full_name', 'phone_mobile'];
  for (const r of required) {
    const val = (paciente as any)[r];
    if (!val || (typeof val === 'string' && String(val).trim() === '')) {
      throw new Error(`Campo obrigatório ausente para criar usuário/paciente: ${r}`);
    }
  }

  // Generate a password so the UI can present it to the user if desired
  const password = gerarSenhaAleatoria();

  // Normalize CPF is intentionally not required here because this helper is used
  // when creating access; if CPF is needed it should be provided to the create-patient Function.
  const payload: any = {
    email: paciente.email,
    full_name: paciente.full_name,
    phone_mobile: paciente.phone_mobile,
    // provide a client-generated password (backend may accept or ignore)
    password,
    // indicate target so function can assign role and redirect
    target: 'paciente',
  };

  const url = `${API_BASE}/functions/v1/create-patient`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...baseHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const parsed = await parse<any>(res as Response);
  // Attach the generated password so callers (UI) can display it if necessary
  if (parsed && typeof parsed === 'object') return { ...(parsed as any), password };
  return { password };
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
/**
 * Envia uma foto de avatar do paciente ao Supabase Storage.
 * - Valida tipo (jpeg/png/webp) e tamanho (<= 2MB)
 * - Faz POST multipart/form-data para /storage/v1/object/avatars/{userId}/avatar
 * - Retorna o objeto { Key } quando upload for bem-sucedido
 */
export async function uploadFotoPaciente(_id: string | number, _file: File): Promise<{ foto_url?: string; thumbnail_url?: string; Key?: string }> {
  const userId = String(_id);
  if (!userId) throw new Error('ID do paciente é obrigatório para upload de foto');
  if (!_file) throw new Error('Arquivo ausente');

  // validações de formato e tamanho
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(_file.type)) {
    throw new Error('Formato inválido. Aceitamos JPG, PNG ou WebP.');
  }
  const maxBytes = 2 * 1024 * 1024; // 2MB
  if (_file.size > maxBytes) {
    throw new Error('Arquivo muito grande. Máx 2MB.');
  }

  const extMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const ext = extMap[_file.type] || 'jpg';

  // O bucket deve ser 'avatars' e o caminho do objeto será userId/avatar.ext
  const bucket = 'avatars';
  const objectPath = `${userId}/avatar.${ext}`;
  const uploadUrl = `${ENV_CONFIG.SUPABASE_URL}/storage/v1/object/${bucket}/${encodeURIComponent(objectPath)}`;

  // Build multipart form data
  const form = new FormData();
  form.append('file', _file, `avatar.${ext}`);

  const headers: Record<string, string> = {
    // Supabase requires the anon  key in 'apikey' header for client-side uploads
    apikey: ENV_CONFIG.SUPABASE_ANON_KEY,
    // Accept json
    Accept: 'application/json',
  };
  // if user is logged in, include Authorization header
  const jwt = getAuthToken();
  if (jwt) headers.Authorization = `Bearer ${jwt}`;

  console.debug('[uploadFotoPaciente] Iniciando upload:', { 
    url: uploadUrl,
    fileType: _file.type,
    fileSize: _file.size,
    hasAuth: !!jwt
  });

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers,
    body: form as any,
  });

  // Supabase storage returns 200/201 with object info or error
  if (!res.ok) {
    const raw = await res.text().catch(() => '');
    console.error('[uploadFotoPaciente] upload falhou', { 
      status: res.status, 
      raw,
      headers: Object.fromEntries(res.headers.entries()),
      url: uploadUrl,
      requestHeaders: headers,
      objectPath
    });
    
    if (res.status === 401) throw new Error('Não autenticado');
    if (res.status === 403) throw new Error('Sem permissão para fazer upload');
    if (res.status === 404) throw new Error('Bucket de avatars não encontrado. Verifique se o bucket "avatars" existe no Supabase');
    throw new Error(`Falha no upload da imagem (${res.status}): ${raw || 'Sem detalhes do erro'}`);
  }

  // Try to parse JSON response
  let json: any = null;
  try { json = await res.json(); } catch { json = null; }

  // The API may not return a structured body; return the Key we constructed
  const key = (json && (json.Key || json.key)) ?? objectPath;
  const publicUrl = `${ENV_CONFIG.SUPABASE_URL}/storage/v1/object/public/avatars/${encodeURIComponent(userId)}/avatar.${ext}`;
  return { foto_url: publicUrl, Key: key };
}

/**
 * Retorna a URL pública do avatar do usuário (acesso público)
 * Path conforme OpenAPI: /storage/v1/object/public/avatars/{userId}/avatar.{ext}
 * @param userId - ID do usuário (UUID)
 * @param ext - extensão do arquivo: 'jpg' | 'png' | 'webp' (default 'jpg')
 */
export function getAvatarPublicUrl(userId: string | number): string {
  // Build the public avatar URL without file extension.
  // Example: https://<project>.supabase.co/storage/v1/object/public/avatars/{userId}/avatar
  const id = String(userId || '').trim();
  if (!id) throw new Error('userId é obrigatório para obter URL pública do avatar');
  const base = String(ENV_CONFIG.SUPABASE_URL).replace(/\/$/, '');
  // Note: Supabase public object path does not require an extension in some setups
  return `${base}/storage/v1/object/public/${encodeURIComponent('avatars')}/${encodeURIComponent(id)}/avatar`;
}

export async function removerFotoPaciente(_id: string | number): Promise<void> {
  const userId = String(_id || '').trim();
  if (!userId) throw new Error('ID do paciente é obrigatório para remover foto');
  const deleteUrl = `${ENV_CONFIG.SUPABASE_URL}/storage/v1/object/avatars/${encodeURIComponent(userId)}/avatar`;
  const headers: Record<string,string> = {
    apikey: ENV_CONFIG.SUPABASE_ANON_KEY,
    Accept: 'application/json',
  };
  const jwt = getAuthToken();
  if (jwt) headers.Authorization = `Bearer ${jwt}`;

  try {
    console.debug('[removerFotoPaciente] Deleting avatar for user:', userId, 'url:', deleteUrl);
    const res = await fetch(deleteUrl, { method: 'DELETE', headers });
    if (!res.ok) {
      const raw = await res.text().catch(() => '');
      console.warn('[removerFotoPaciente] remoção falhou', { status: res.status, raw });
      // Treat 404 as success (object already absent)
      if (res.status === 404) return;
      // Include status and server body in the error message to aid debugging
      const bodySnippet = raw && raw.length > 0 ? raw : '<sem corpo na resposta>';
      if (res.status === 401) throw new Error(`Não autenticado (401). Resposta: ${bodySnippet}`);
      if (res.status === 403) throw new Error(`Sem permissão para remover a foto (403). Resposta: ${bodySnippet}`);
      throw new Error(`Falha ao remover a foto do storage (status ${res.status}). Resposta: ${bodySnippet}`);
    }
    // success
    return;
  } catch (err) {
    // bubble up for the caller to handle
    throw err;
  }
}
export async function listarAnexosMedico(_id: string | number): Promise<any[]> { return []; }
export async function adicionarAnexoMedico(_id: string | number, _file: File): Promise<any> { return {}; }
export async function removerAnexoMedico(_id: string | number, _anexoId: string | number): Promise<void> {}
export async function uploadFotoMedico(_id: string | number, _file: File): Promise<{ foto_url?: string; thumbnail_url?: string; Key?: string }> {
  // reuse same implementation as paciente but place under avatars/{userId}/avatar
  return await uploadFotoPaciente(_id, _file);
}
export async function removerFotoMedico(_id: string | number): Promise<void> {
  // reuse samme implementation
  return await removerFotoPaciente(_id);
}

// ===== PERFIS DE USUÁRIOS =====
export async function listarPerfis(params?: { page?: number; limit?: number; q?: string; }): Promise<Profile[]> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  const url = `${REST}/profiles${qs.toString() ? `?${qs.toString()}` : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { ...baseHeaders(), ...rangeHeaders(params?.page, params?.limit) },
  });
  return await parse<Profile[]>(res);
}

export async function buscarPerfilPorId(id: string | number): Promise<Profile> {
  const idParam = String(id);
  const headers = baseHeaders();

  // 1) tentar por id
  try {
    const url = `${REST}/profiles?id=eq.${encodeURIComponent(idParam)}`;
    const arr = await fetchWithFallback<Profile[]>(url, headers);
    if (arr && arr.length) return arr[0];
  } catch (e) {
    // continuar para próxima estratégia
  }

  // 2) tentar por full_name quando for string legível
  if (typeof id === 'string' && isNaN(Number(id))) {
    const params = new URLSearchParams();
    params.set('full_name', `ilike.*${String(id)}*`);
    params.set('limit', '5');
    const url = `${REST}/profiles?${params.toString()}`;
    const altParams = new URLSearchParams();
    altParams.set('email', `ilike.*${String(id)}*`);
    altParams.set('limit', '5');
    const alt = `${REST}/profiles?${altParams.toString()}`;
    const arr2 = await fetchWithFallback<Profile[]>(url, headers, [alt]);
    if (arr2 && arr2.length) return arr2[0];
  }

  throw new Error('404: Perfil não encontrado');
}

export async function criarPerfil(input: ProfileInput): Promise<Profile> {
  const url = `${REST}/profiles`;
  const res = await fetch(url, {
    method: 'POST',
    headers: withPrefer({ ...baseHeaders(), 'Content-Type': 'application/json' }, 'return=representation'),
    body: JSON.stringify(input),
  });
  const arr = await parse<Profile[] | Profile>(res);
  return Array.isArray(arr) ? arr[0] : (arr as Profile);
}

export async function atualizarPerfil(id: string | number, input: ProfileInput): Promise<Profile> {
  const url = `${REST}/profiles?id=eq.${id}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: withPrefer({ ...baseHeaders(), 'Content-Type': 'application/json' }, 'return=representation'),
    body: JSON.stringify(input),
  });
  const arr = await parse<Profile[] | Profile>(res);
  return Array.isArray(arr) ? arr[0] : (arr as Profile);
}

export async function excluirPerfil(id: string | number): Promise<void> {
  const url = `${REST}/profiles?id=eq.${id}`;
  const res = await fetch(url, { method: 'DELETE', headers: baseHeaders() });
  await parse<any>(res);
}

// ===== DASHBOARD WIDGETS =====

/**
 * Busca contagem total de pacientes
 */
export async function countTotalPatients(): Promise<number> {
  try {
    const url = `${REST}/patients?select=id&limit=1`;
    const res = await fetch(url, {
      headers: {
        ...baseHeaders(),
        'Prefer': 'count=exact'
      }
    });
    const countHeader = res.headers.get('content-range');
    if (countHeader) {
      const match = countHeader.match(/\/(\d+)$/);
      return match ? parseInt(match[1]) : 0;
    }
    return 0;
  } catch (err) {
    console.error('[countTotalPatients] Erro:', err);
    return 0;
  }
}

/**
 * Busca contagem total de médicos
 */
export async function countTotalDoctors(): Promise<number> {
  try {
    const url = `${REST}/doctors?select=id&limit=1`;
    const res = await fetch(url, {
      headers: {
        ...baseHeaders(),
        'Prefer': 'count=exact'
      }
    });
    const countHeader = res.headers.get('content-range');
    if (countHeader) {
      const match = countHeader.match(/\/(\d+)$/);
      return match ? parseInt(match[1]) : 0;
    }
    return 0;
  } catch (err) {
    console.error('[countTotalDoctors] Erro:', err);
    return 0;
  }
}

/**
 * Busca contagem de agendamentos para hoje
 */
export async function countAppointmentsToday(): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    const url = `${REST}/appointments?scheduled_at=gte.${today}T00:00:00&scheduled_at=lt.${tomorrow}T00:00:00&select=id&limit=1`;
    const res = await fetch(url, {
      headers: {
        ...baseHeaders(),
        'Prefer': 'count=exact'
      }
    });
    const countHeader = res.headers.get('content-range');
    if (countHeader) {
      const match = countHeader.match(/\/(\d+)$/);
      return match ? parseInt(match[1]) : 0;
    }
    return 0;
  } catch (err) {
    console.error('[countAppointmentsToday] Erro:', err);
    return 0;
  }
}

/**
 * Busca próximas consultas (próximos 7 dias)
 */
export async function getUpcomingAppointments(limit: number = 10): Promise<any[]> {
  try {
    const today = new Date().toISOString();
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString();
    
    const url = `${REST}/appointments?scheduled_at=gte.${today}&scheduled_at=lt.${nextWeek}&order=scheduled_at.asc&limit=${limit}&select=id,scheduled_at,status,doctor_id,patient_id`;
    const res = await fetch(url, { headers: baseHeaders() });
    return await parse<any[]>(res);
  } catch (err) {
    console.error('[getUpcomingAppointments] Erro:', err);
    return [];
  }
}

/**
 * Busca agendamentos por data (para gráfico)
 */
export async function getAppointmentsByDateRange(days: number = 14): Promise<any[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date().toISOString();
    
    const url = `${REST}/appointments?scheduled_at=gte.${startDate.toISOString()}&scheduled_at=lt.${endDate}&select=scheduled_at,status&order=scheduled_at.asc`;
    const res = await fetch(url, { headers: baseHeaders() });
    return await parse<any[]>(res);
  } catch (err) {
    console.error('[getAppointmentsByDateRange] Erro:', err);
    return [];
  }
}

/**
 * Busca novos usuários (últimos 7 dias)
 */
export async function getNewUsersLastDays(days: number = 7): Promise<any[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const url = `${REST}/profiles?created_at=gte.${startDate.toISOString()}&order=created_at.desc&limit=10&select=id,full_name,email`;
    const res = await fetch(url, { headers: baseHeaders() });
    return await parse<any[]>(res);
  } catch (err) {
    console.error('[getNewUsersLastDays] Erro:', err);
    return [];
  }
}

/**
 * Busca relatórios pendentes (draft)
 */
export async function getPendingReports(limit: number = 5): Promise<any[]> {
  try {
    const url = `${REST}/reports?status=eq.draft&order=created_at.desc&limit=${limit}&select=id,order_number,patient_id,exam,requested_by,created_at`;
    const res = await fetch(url, { headers: baseHeaders() });
    return await parse<any[]>(res);
  } catch (err) {
    console.error('[getPendingReports] Erro:', err);
    return [];
  }
}

/**
 * Busca usuários desabilitados (alertas)
 */
export async function getDisabledUsers(limit: number = 5): Promise<any[]> {
  try {
    const url = `${REST}/profiles?disabled=eq.true&order=updated_at.desc&limit=${limit}&select=id,full_name,email,disabled`;
    const res = await fetch(url, { headers: baseHeaders() });
    return await parse<any[]>(res);
  } catch (err) {
    console.error('[getDisabledUsers] Erro:', err);
    return [];
  }
}

/**
 * Busca disponibilidade de médicos (para hoje)
 */
export async function getDoctorsAvailabilityToday(): Promise<any[]> {
  try {
    const today = new Date();
    const weekday = today.getDay();
    
    const url = `${REST}/doctor_availability?weekday=eq.${weekday}&active=eq.true&select=id,doctor_id,start_time,end_time,slot_minutes,appointment_type`;
    const res = await fetch(url, { headers: baseHeaders() });
    return await parse<any[]>(res);
  } catch (err) {
    console.error('[getDoctorsAvailabilityToday] Erro:', err);
    return [];
  }
}

/**
 * Busca detalhes de paciente por ID
 */
export async function getPatientById(patientId: string): Promise<any> {
  try {
    const url = `${REST}/patients?id=eq.${patientId}&select=*&limit=1`;
    const res = await fetch(url, { headers: baseHeaders() });
    const arr = await parse<any[]>(res);
    return arr && arr.length > 0 ? arr[0] : null;
  } catch (err) {
    console.error('[getPatientById] Erro:', err);
    return null;
  }
}

/**
 * Busca detalhes de médico por ID
 */
export async function getDoctorById(doctorId: string): Promise<any> {
  try {
    const url = `${REST}/doctors?id=eq.${doctorId}&select=*&limit=1`;
    const res = await fetch(url, { headers: baseHeaders() });
    const arr = await parse<any[]>(res);
    return arr && arr.length > 0 ? arr[0] : null;
  } catch (err) {
    console.error('[getDoctorById] Erro:', err);
    return null;
  }
}
