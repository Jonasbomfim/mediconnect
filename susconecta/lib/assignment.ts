// lib/assignment.ts

import { ENV_CONFIG } from '@/lib/env-config';

// ===== TIPOS =====

// Roles válidos para patient_assignments conforme documentação
export type PatientAssignmentRole = "medico" | "enfermeiro";

export interface PatientAssignment {
  id: string;
  patient_id: string;
  user_id: string;
  role: PatientAssignmentRole;
  created_at: string;
  created_by: string | null;
}

export interface CreateAssignmentInput {
  patient_id: string;
  user_id: string;
  role: PatientAssignmentRole;
  created_by?: string | null;
}

// ===== CONSTANTES =====

const ASSIGNMENTS_URL = `${ENV_CONFIG.SUPABASE_URL}/rest/v1/patient_assignments`;

// ===== FUNÇÕES DA API =====

/**
 * Obtém o token de autenticação do localStorage.
 */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || localStorage.getItem("auth_token");
}

/**
 * Cria os cabeçalhos padrão para as requisições.
 */
function getHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "apikey": ENV_CONFIG.SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Atribui uma função (role) a um usuário para um paciente específico.
 * @param input - Os dados para a nova atribuição.
 * @returns A atribuição criada.
 */
export async function assignRoleToUser(input: CreateAssignmentInput): Promise<PatientAssignment> {
  console.log("📝 [ASSIGNMENT] Atribuindo função:", input);

  try {
    const response = await fetch(ASSIGNMENTS_URL, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        'Prefer': 'return=representation', // Pede ao Supabase para retornar o objeto criado
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("❌ [ASSIGNMENT] Erro na resposta da API:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });
      // Include body (when available) to help debugging (e.g., constraint violations)
      const bodySnippet = errorBody ? ` - body: ${errorBody}` : '';
      throw new Error(`Erro ao atribuir função: ${response.statusText} (${response.status})${bodySnippet}`);
    }

    const createdAssignment = await response.json();
    
    // O Supabase retorna um array com o item criado
    if (Array.isArray(createdAssignment) && createdAssignment.length > 0) {
      console.log("✅ [ASSIGNMENT] Função atribuída com sucesso:", createdAssignment[0]);
      return createdAssignment[0];
    }

    throw new Error("A API não retornou a atribuição criada.");

  } catch (error) {
    console.error("❌ [ASSIGNMENT] Erro inesperado ao atribuir função:", error);
    throw error;
  }
}

/**
 * Lista todas as atribuições de um paciente.
 * @param patientId - O ID do paciente.
 * @returns Uma lista de atribuições.
 */
export async function listAssignmentsForPatient(patientId: string): Promise<PatientAssignment[]> {
  console.log(`🔍 [ASSIGNMENT] Listando atribuições para o paciente: ${patientId}`);
  
  const url = `${ASSIGNMENTS_URL}?patient_id=eq.${patientId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("❌ [ASSIGNMENT] Erro ao listar atribuições:", {
        status: response.status,
        body: errorBody,
      });
      throw new Error(`Erro ao listar atribuições: ${response.statusText}`);
    }

    const assignments = await response.json();
    console.log(`✅ [ASSIGNMENT] ${assignments.length} atribuições encontradas.`);
    return assignments;

  } catch (error) {
    console.error("❌ [ASSIGNMENT] Erro inesperado ao listar atribuições:", error);
    throw error;
  }
}

/**
 * Lista todas as atribuições para um dado usuário (médico/enfermeiro).
 * Útil para obter os patient_id dos pacientes atribuídos ao usuário.
 */
export async function listAssignmentsForUser(userId: string): Promise<PatientAssignment[]> {
  // Log removido por segurança
  const url = `${ASSIGNMENTS_URL}?user_id=eq.${encodeURIComponent(userId)}`;

  try {
    const headers = getHeaders();
    // Logs removidos por segurança
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    // dump raw text for debugging when content-type isn't JSON or when empty
    const contentType = response.headers.get('content-type') || '';
    const txt = await response.clone().text().catch(() => '');
    // Log removido por segurança

    if (!response.ok) {
      const errorBody = txt || '';
      console.error("❌ [ASSIGNMENT] Erro ao listar atribuições por usuário:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });
      throw new Error(`Erro ao listar atribuições por usuário: ${response.status} ${response.statusText} - body: ${errorBody}`);
    }

    let assignments: any = [];
    try {
      assignments = await response.json();
    } catch (e) {
      console.warn('[ASSIGNMENT] não foi possível parsear JSON, usando texto cru como fallback');
      assignments = txt ? JSON.parse(txt) : [];
    }
    console.log(`✅ [ASSIGNMENT] ${Array.isArray(assignments) ? assignments.length : 0} atribuições encontradas para o usuário.`);
    return Array.isArray(assignments) ? assignments : [];
  } catch (error) {
    console.error("❌ [ASSIGNMENT] Erro inesperado ao listar atribuições por usuário:", error);
    throw error;
  }
}
