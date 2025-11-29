/**
 * EXEMPLO DE USO: Automação n8n para Notificação de Laudos
 * 
 * Este arquivo demonstra como usar a função criarLaudo com integração n8n
 * para criar um laudo e notificar automaticamente o paciente.
 */

import { criarLaudo, CriarLaudoData } from '@/lib/reports';

/**
 * Exemplo 1: Uso básico - criar um laudo simples
 */
export async function exemploBasico() {
  try {
    const laudoData: CriarLaudoData = {
      pacienteId: 'patient-uuid-123', // ID do paciente (obrigatório)
      textoLaudo: 'Paciente apresenta boa saúde geral. Sem achados relevantes.',
    };

    const novoLaudo = await criarLaudo(laudoData);
    
    console.log('✓ Laudo criado com sucesso!');
    console.log('ID do laudo:', novoLaudo.id);
    console.log('Mensagem:', novoLaudo.mensagem);
    
    return novoLaudo;
  } catch (erro) {
    console.error('✗ Erro ao criar laudo:', erro);
    throw erro;
  }
}

/**
 * Exemplo 2: Criar laudo com dados médicos completos
 */
export async function exemploCompleto() {
  try {
    const laudoData: CriarLaudoData = {
      pacienteId: 'patient-uuid-789',
      medicoId: 'doctor-uuid-456',  // Opcional
      textoLaudo: `
        AVALIAÇÃO CLÍNICA COMPLETA
        
        Queixa Principal: Dor de cabeça persistente
        
        História Presente:
        Paciente relata dor de cabeça tipo tensional há 2 semanas,
        intensidade 5/10, sem irradiação.
        
        Exame Físico:
        - PA: 120/80 mmHg
        - FC: 72 bpm
        - Sem alterações neurológicas
        
        Impressão Diagnóstica:
        Cefaleia tensional
        
        Conduta:
        - Repouso adequado
        - Analgésicos conforme necessidade
        - Retorno em 2 semanas se persistir
      `,
      exame: 'Consulta Neurologia',
      diagnostico: 'Cefaleia tensional',
      conclusao: 'Prescrição: Dipirona 500mg 6/6h conforme necessidade',
      cidCode: 'G44.2', // CID da cefaleia tensional
      status: 'concluido',
    };

    const novoLaudo = await criarLaudo(laudoData);
    
    console.log('✓ Laudo completo criado com sucesso!');
    console.log('ID:', novoLaudo.id);
    console.log('Status:', novoLaudo.status);
    console.log('CID:', novoLaudo.cid_code);
    
    return novoLaudo;
  } catch (erro) {
    console.error('✗ Erro:', erro);
    throw erro;
  }
}

/**
 * Exemplo 3: Integração em um componente React
 * Este exemplo mostra como usar a função em um formulário
 * 
 * NOTA: Este código deve ser usado em um arquivo .tsx (não .ts)
 * e com o import de React importado corretamente
 */
export async function exemploComponenteReact() {
  // Este é apenas um exemplo de estrutura para o componente
  // Copie o código abaixo para um arquivo .tsx:
  /*
  'use client';
  
  import React from 'react';
  import { criarLaudo, CriarLaudoData } from '@/lib/reports';

  export function ComponenteLaudoExemplo() {
    const [carregando, setCarregando] = React.useState(false);
    const [mensagem, setMensagem] = React.useState('');

    const handleCriarLaudo = async (formData: any) => {
      setCarregando(true);
      setMensagem('');

      try {
        const laudoData: CriarLaudoData = {
          pacienteId: formData.pacienteId,
          medicoId: formData.medicoId,
          textoLaudo: formData.texto,
          exame: formData.exame,
          diagnostico: formData.diagnostico,
          conclusao: formData.conclusao,
          cidCode: formData.cid,
          status: 'concluido',
        };

        const resultado = await criarLaudo(laudoData);

        setMensagem(`✓ ${resultado.mensagem}`);
        console.log('Laudo criado:', resultado.id);
        
        // Você pode fazer mais algo aqui, como:
        // - Redirecionar para página do laudo
        // - Atualizar lista de laudos
        // - Limpar formulário
        
      } catch (erro) {
        setMensagem(`✗ Erro: ${erro instanceof Error ? erro.message : String(erro)}`);
      } finally {
        setCarregando(false);
      }
    };

    return (
      <div>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleCriarLaudo(Object.fromEntries(formData));
        }}>
          <textarea
            name="texto"
            placeholder="Texto do laudo"
            required
          />
          <input
            type="text"
            name="pacienteId"
            placeholder="ID do Paciente"
            required
          />
          <input
            type="text"
            name="medicoId"
            placeholder="ID do Médico"
            required
          />
          <button type="submit" disabled={carregando}>
            {carregando ? 'Criando...' : 'Criar Laudo'}
          </button>
        </form>
        
        {mensagem && <p>{mensagem}</p>}
      </div>
    );
  }
  */
}

/**
 * Exemplo 4: Tratamento de erros específicos
 */
export async function exemploTratamentoErros() {
  try {
    const laudoData: CriarLaudoData = {
      pacienteId: 'patient-id',
      medicoId: 'doctor-id',
      textoLaudo: 'Texto do laudo',
    };

    const resultado = await criarLaudo(laudoData);
    console.log('Sucesso:', resultado);

  } catch (erro) {
    if (erro instanceof Error) {
      // Trata diferentes tipos de erro
      if (erro.message.includes('Paciente ID') || erro.message.includes('Médico ID')) {
        console.error('Erro de validação: dados incompletos');
      } else if (erro.message.includes('Supabase')) {
        console.error('Erro de conexão com banco de dados');
      } else if (erro.message.includes('n8n')) {
        console.warn('Laudo criado, mas notificação falhou');
      } else {
        console.error('Erro desconhecido:', erro.message);
      }
    }
  }
}

/**
 * DOCUMENTAÇÃO DO FLUXO N8N
 * 
 * A função criarLaudo executa o seguinte fluxo:
 * 
 * 1. CRIAÇÃO NO SUPABASE
 *    - Salva o report na tabela 'reports' do Supabase
 *    - Status padrão: 'concluido'
 *    - Retorna o report criado com seu ID
 * 
 * 2. NOTIFICAÇÃO N8N
 *    - Se o report foi criado com sucesso, faz um POST para:
 *      URL: https://joaogustavo.me/webhook/notificar-laudo
 *    - Envia payload com:
 *      - pacienteId: ID do paciente (patient_id)
 *      - reportId: ID do report criado
 * 
 * 3. NO N8N
 *    O webhook deve estar configurado para:
 *    - Receber o payload JSON POST
 *    - Extrair pacienteId e reportId
 *    - Buscar informações do paciente
 *    - Enviar notificação (email, SMS, push, etc.)
 *    - Registrar log da notificação
 * 
 * 4. COMPORTAMENTO EM CASO DE FALHA
 *    - Se a criação do report falhar: exceção é lançada
 *    - Se o envio para n8n falhar: report é mantido, erro é logado
 *      (não bloqueia a operação de criação)
 * 
 * EXEMPLO DE USO:
 * 
 * const novoReport = await criarLaudo({
 *   pacienteId: "3854866a-5476-48be-8313-77029ccdb70f",
 *   textoLaudo: "Texto do laudo aqui..."
 * });
 * 
 * // Depois disto, automaticamente:
 * // 1. Report é salvo no Supabase
 * // 2. n8n recebe: { pacienteId: "...", reportId: "..." }
 * // 3. Paciente é notificado
 */

/**
 * EXEMPLO DE WEBHOOK N8N (Configuração)
 * 
 * No n8n, você deve:
 * 1. Criar um novo workflow
 * 2. Adicionar trigger: "Webhook"
 * 3. Configurar:
 *    - HTTP Method: POST
 *    - Path: /notificar-laudo
 *    - Authentication: None (ou Bearer token se desejar)
 * 4. Adicionar nós para:
 *    - Parse do payload JSON recebido
 *    - Query no banco de dados para buscar paciente
 *    - Enviar email/SMS/notificação push
 *    - Logging do resultado
 * 
 * Exemplo de nó JavaScript no n8n:
 * 
 * const { pacienteId, laudoId, pacienteName, pacienteEmail } = $input.first().json;
 * 
 * return {
 *   pacienteId,
 *   laudoId,
 *   pacienteName,
 *   pacienteEmail,
 *   notificationType: 'laudo_criado',
 *   timestamp: new Date().toISOString(),
 *   message: `Novo laudo ${laudoId} disponível para ${pacienteName}`
 * };
 */
