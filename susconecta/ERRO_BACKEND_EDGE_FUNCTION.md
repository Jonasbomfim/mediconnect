# 🚨 ERRO CRÍTICO NA EDGE FUNCTION - BACKEND

## Resumo do Problema

A Edge Function `/functions/v1/create-user` está retornando **erro 500** com mensagem:
```json
{ "error": "Failed to assign user role" }
```

## Evidências

### Console do Frontend
```
XHRPOST https://yuanqfswhberkoevtmfr.supabase.co/functions/v1/create-user
[HTTP/3 500  1065ms]

[API ERROR] https://yuanqfswhberkoevtmfr.supabase.co/functions/v1/create-user 500 
Object { error: "Failed to assign user role" }
```

### Request Enviado (CORRETO)
```json
{
  "email": "dipar64745@fanlvr.com",
  "password": "senha789!",
  "full_name": "Jonas Francisco Nascimento Bonfim",
  "phone": "(79) 99649-8907",
  "role": "medico"
}
```

### Response Recebido (ERRO)
```json
{
  "error": "Failed to assign user role"
}
```

## Fluxo Atual (Correto segundo documentação)

1. ✅ Frontend cria perfil na tabela `doctors`
2. ✅ Frontend gera senha aleatória
3. ✅ Frontend chama `/functions/v1/create-user` com dados corretos
4. ❌ **Edge Function falha ao atribuir role na tabela `user_roles`**

## O Que a Edge Function DEVE Fazer

Segundo a documentação da API (`Documentação API.md`), a Edge Function `/functions/v1/create-user` deve:

1. ✅ Criar usuário no Supabase Auth (isso está funcionando)
2. ❌ **Inserir registro na tabela `user_roles`** (isso está falhando)
3. ✅ Retornar `{ success: true, user: {...} }`

## Possíveis Causas do Erro

### 1. SUPABASE_SERVICE_ROLE_KEY não configurada
A Edge Function precisa da `SUPABASE_SERVICE_ROLE_KEY` para ter permissão de:
- Inserir na tabela `user_roles`
- Fazer operações administrativas

**Como verificar:**
1. Acesse o Supabase Dashboard
2. Vá em **Edge Functions** > `create-user`
3. Verifique se a variável de ambiente `SUPABASE_SERVICE_ROLE_KEY` está configurada
4. Copie a chave de: **Settings** > **API** > **service_role key (secret)**

### 2. Tabela `user_roles` sem permissões corretas
A tabela pode estar bloqueando inserções da Edge Function.

**Como verificar:**
1. Acesse o Supabase Dashboard
2. Vá em **Database** > **user_roles**
3. Clique em **RLS Policies**
4. Verifique se existe uma policy permitindo:
   - Service role pode inserir
   - OU Edge Function pode inserir usando service key

**Policy esperada:**
```sql
-- Permitir que service role insira roles
CREATE POLICY "service_role_insert_user_roles"
ON user_roles FOR INSERT
TO service_role
WITH CHECK (true);
```

### 3. Código da Edge Function com bug
O código da Edge Function pode ter erro de lógica ao tentar inserir na tabela.

**Onde encontrar:**
- Supabase Dashboard > **Edge Functions** > `create-user` > **Editor**

**O que verificar:**
```typescript
// A Edge Function deve ter algo assim:
const { data, error } = await supabaseAdmin
  .from('user_roles')
  .insert({
    user_id: newUser.id,
    role: role
  });

if (error) {
  console.error('Erro ao inserir role:', error);
  return new Response(
    JSON.stringify({ error: 'Failed to assign user role' }),
    { status: 500 }
  );
}
```

## Como Testar Cada Possibilidade

### Teste 1: Verificar se service key está funcionando
Execute no SQL Editor do Supabase:
```sql
-- Teste de inserção manual
INSERT INTO user_roles (user_id, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'medico');

-- Se der erro, mostrará a mensagem de permissão
```

### Teste 2: Verificar logs da Edge Function
1. Acesse **Edge Functions** > `create-user`
2. Clique em **Logs**
3. Procure por erros detalhados quando o frontend faz a chamada

### Teste 3: Verificar estrutura da tabela
```sql
-- Verificar estrutura da tabela user_roles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_roles';
```

Campos esperados:
- `id` (uuid, primary key)
- `user_id` (uuid, not null, foreign key para auth.users)
- `role` (text ou enum, not null)
- `created_at` (timestamp, default now())

## Solução Esperada do Backend

A equipe de backend precisa:

1. **URGENTE**: Configurar `SUPABASE_SERVICE_ROLE_KEY` na Edge Function
2. **URGENTE**: Adicionar RLS policy para permitir inserções via service role
3. **Recomendado**: Adicionar logs detalhados na Edge Function para debug
4. **Recomendado**: Retornar erro mais específico (ex: "Permission denied to insert into user_roles")

## Status do Frontend

✅ **O código do frontend está 100% correto e seguindo a documentação!**

Não há nada a fazer no frontend. O erro está exclusivamente no backend.

## Workaround Temporário (NÃO RECOMENDADO)

Se o backend não puder resolver urgentemente, podemos:
1. Criar usuários sem role (ou role padrão)
2. Administrador atribui roles manualmente depois

Mas isso **NÃO É RECOMENDADO** porque:
- Usuários não terão permissões corretas
- Aumenta trabalho manual
- Pode gerar problemas de segurança

## Contato

Frontend: ✅ Implementação completa e correta
Backend: ❌ Precisa corrigir Edge Function `create-user`

**Prioridade:** 🔴 CRÍTICA - Sistema não consegue criar novos usuários

---

**Data do erro:** 10/10/2025  
**Ambiente:** https://yuanqfswhberkoevtmfr.supabase.co  
**Edge Function:** `/functions/v1/create-user`  
**Status Code:** 500  
**Mensagem:** "Failed to assign user role"
