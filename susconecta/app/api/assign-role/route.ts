import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Endpoint server-side para atribuir roles aos usuários
 * Usa SUPABASE_SERVICE_ROLE_KEY para realizar operações administrativas
 * 
 * POST /api/assign-role
 * Body: { user_id: string, role: string }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticação do requisitante
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    // 2. Extrair dados do body
    const body = await request.json();
    const { user_id, role } = body;

    if (!user_id || !role) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'user_id e role são obrigatórios' },
        { status: 400 }
      );
    }

    // 3. Validar role
    const validRoles = ['admin', 'gestor', 'medico', 'secretaria', 'user'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Bad Request', message: `Role inválido. Valores aceitos: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // 4. Obter service role key do ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ [ASSIGN-ROLE] SUPABASE_SERVICE_ROLE_KEY não configurada');
      return NextResponse.json(
        { 
          error: 'Server Configuration Error', 
          message: 'Service role key não configurada no servidor. Entre em contato com o administrador do sistema.',
          hint: 'Configure SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente do servidor'
        },
        { status: 500 }
      );
    }

    // 5. Criar cliente Supabase com service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 6. Verificar se o usuário existe
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(user_id);
    
    if (userError || !userData) {
      console.error('❌ [ASSIGN-ROLE] Usuário não encontrado:', userError);
      return NextResponse.json(
        { error: 'Not Found', message: 'Usuário não encontrado no sistema de autenticação' },
        { status: 404 }
      );
    }

    console.log(`🔐 [ASSIGN-ROLE] Atribuindo role "${role}" ao usuário ${user_id}`);

    // 7. Inserir role na tabela user_roles
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: user_id,
        role: role,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (roleError) {
      // Verificar se é erro de duplicação (usuário já tem esse role)
      if (roleError.code === '23505') {
        console.log(`⚠️ [ASSIGN-ROLE] Usuário já possui o role "${role}"`);
        return NextResponse.json(
          { 
            success: true, 
            message: `Usuário já possui o role "${role}"`,
            user_id,
            role,
            already_exists: true
          },
          { status: 200 }
        );
      }

      console.error('❌ [ASSIGN-ROLE] Erro ao inserir role:', roleError);
      return NextResponse.json(
        { 
          error: 'Database Error', 
          message: `Erro ao atribuir role: ${roleError.message}`,
          code: roleError.code,
          details: roleError.details
        },
        { status: 500 }
      );
    }

    console.log(`✅ [ASSIGN-ROLE] Role "${role}" atribuído com sucesso ao usuário ${user_id}`);

    // 8. Retornar sucesso
    return NextResponse.json(
      {
        success: true,
        message: `Role "${role}" atribuído com sucesso`,
        data: roleData,
        user_id,
        role,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('❌ [ASSIGN-ROLE] Erro inesperado:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'Erro inesperado ao atribuir role',
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

// Método OPTIONS para CORS (se necessário)
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}
