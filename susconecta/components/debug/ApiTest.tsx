"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buscarPacientePorId, buscarPacientes, listarPacientes } from "@/lib/api";

export const ApiTest = () => {
  const [testId, setTestId] = useState("7ddbd1e2-1aee-4f7a-94f9-ee4c735ca276");
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const testarConexao = async () => {
    setCarregando(true);
    setErro(null);
    setResultado(null);

    try {
      console.log("Testando conexão com a API...");
      
      // Primeiro teste básico
      const pacientes = await listarPacientes({ limit: 5 });
      console.log("Pacientes encontrados:", pacientes);
      
      // Teste direto da API para ver estrutura
      const REST = "https://yuanqfswhberkoevtmfr.supabase.co/rest/v1";
      const headers: Record<string, string> = {
        apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1YW5xZnN3aGJlcmtvZXZ0bWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NTQzNjksImV4cCI6MjA3MDUzMDM2OX0.g8Fm4XAvtX46zifBZnYVH4tVuQkqUH6Ia9CXQj4DztQ",
        Accept: "application/json",
      };
      
      // Token do localStorage se disponível
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      console.log("Headers sendo usados:", headers);
      
      const directRes = await fetch(`${REST}/patients?limit=3&select=id,full_name,cpf,email`, {
        method: "GET",
        headers
      });
      
      console.log("Status da resposta direta:", directRes.status);
      
      if (directRes.ok) {
        const directData = await directRes.json();
        console.log("Dados diretos da API:", directData);
        
        setResultado({ 
          tipo: "Conexão + Estrutura", 
          data: {
            pacientes: pacientes,
            estruturaDireta: directData,
            statusCode: directRes.status,
            headers: Object.fromEntries(directRes.headers.entries())
          }
        });
      } else {
        const errorText = await directRes.text();
        console.error("Erro na resposta direta:", errorText);
        setErro(`Erro ${directRes.status}: ${errorText}`);
      }
      
    } catch (error: any) {
      console.error("Erro na conexão:", error);
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  };

  const testarBuscaPorId = async () => {
    if (!testId.trim()) {
      setErro("Digite um ID para buscar");
      return;
    }

    setCarregando(true);
    setErro(null);
    setResultado(null);

    try {
      console.log("Buscando paciente por ID:", testId);
      const paciente = await buscarPacientePorId(testId);
      setResultado({ tipo: "Busca por ID", data: paciente });
    } catch (error: any) {
      console.error("Erro na busca por ID:", error);
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  };

  const testarBuscaGeral = async () => {
    if (!testId.trim()) {
      setErro("Digite um termo para buscar");
      return;
    }

    setCarregando(true);
    setErro(null);
    setResultado(null);

    try {
      console.log("Buscando pacientes:", testId);
      const pacientes = await buscarPacientes(testId);
      setResultado({ tipo: "Busca geral", data: pacientes });
    } catch (error: any) {
      console.error("Erro na busca geral:", error);
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  };





  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Teste da API - Pacientes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Digite ID, CPF ou nome para buscar..."
            value={testId}
            onChange={(e) => setTestId(e.target.value)}
            className="flex-1"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={testarConexao}
            disabled={carregando}
            variant="outline"
          >
            {carregando ? "Testando..." : "Testar Conexão"}
          </Button>
          
          <Button 
            onClick={testarBuscaPorId}
            disabled={carregando || !testId.trim()}
          >
            {carregando ? "Buscando..." : "Buscar por ID"}
          </Button>
          
          <Button 
            onClick={testarBuscaGeral}
            disabled={carregando || !testId.trim()}
            variant="secondary"
          >
            {carregando ? "Buscando..." : "Busca Geral"}
          </Button>


        </div>

        {erro && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 font-medium">Erro:</p>
            <p className="text-red-600 text-sm">{erro}</p>
          </div>
        )}

        {resultado && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700 font-medium">Resultado ({resultado.tipo}):</p>
            <pre className="text-sm text-green-600 mt-2 overflow-auto">
              {JSON.stringify(resultado.data, null, 2)}
            </pre>
          </div>
        )}

        <div className="text-xs text-gray-500 mt-4">
          <p>• <strong>Testar Conexão:</strong> Lista os primeiros 5 pacientes e verifica a estrutura da API</p>
          <p>• <strong>Buscar por ID:</strong> Busca um paciente específico por ID, CPF ou nome</p>
          <p>• <strong>Busca Geral:</strong> Busca avançada em múltiplos campos</p>
          <p className="mt-2 font-medium">Abra o console do navegador (F12) para ver logs detalhados da investigação.</p>
        </div>
      </CardContent>
    </Card>
  );
};