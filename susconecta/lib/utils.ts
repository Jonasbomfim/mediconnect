import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function validarCPFLocal(cpf: string): boolean {
  if (!cpf) return false;
  cpf = cpf.replace(/[^\d]+/g, "");
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0, resto = 0;
  for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11; if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11; if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;

  return true;
}

// ===== FORMATAÇÃO DE CEP =====
export function formatCEP(cep: string): string {
  if (!cep) return "";
  const cleaned = cep.replace(/\D/g, "");
  if (cleaned.length !== 8) return cleaned;
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
}

export function validarCEP(cep: string): boolean {
  if (!cep) return false;
  const cleaned = cep.replace(/\D/g, "");
  return cleaned.length === 8 && /^\d{8}$/.test(cleaned);
}

// ===== FORMATAÇÃO DE TELEFONE =====
export function formatTelefone(telefone: string): string {
  if (!telefone) return "";
  const cleaned = telefone.replace(/\D/g, "");
  
  // Formatar em (00) 9XXXX-XXXX ou (00) XXXX-XXXX
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  
  return cleaned;
}

// ===== BUSCA DE CEP =====
export async function buscarCEP(cep: string): Promise<{
  street: string;
  neighborhood: string;
  city: string;
  state: string;
} | null> {
  try {
    if (!validarCEP(cep)) {
      throw new Error("CEP inválido");
    }

    const cleaned = cep.replace(/\D/g, "");
    const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
    
    if (!response.ok) {
      throw new Error("Erro ao buscar CEP");
    }

    const data = await response.json();

    if (data.erro) {
      throw new Error("CEP não encontrado");
    }

    return {
      street: data.logradouro || "",
      neighborhood: data.bairro || "",
      city: data.localidade || "",
      state: data.uf || "",
    };
  } catch (err) {
    console.error("[buscarCEP] Erro:", err);
    return null;
  }
}
