"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { listarPacientes, buscarPacientePorId } from "@/lib/api";

export const ApiTestSimple = () => {
  const [resultado, setResultado] = useState<string>("");
  const [carregando, setCarregando] = useState(false);

  const testarListarPacientes = async () => {
    setCarregando(true);
    try {
      const pacientes = await listarPacientes();
      setResultado(`✅ Sucesso! Encontrados ${pacientes.length} pacientes:\n${JSON.stringify(pacientes, null, 2)}`);
    } catch (error: any) {
      setResultado(`❌ Erro: ${error.message}`);
    } finally {
      setCarregando(false);
    }
  };

  const testarBuscarPorId = async () => {
    setCarregando(true);
    const id = "7ddbd1e2-1aee-4f7a-94f9-ee4c735ca276";
    try {
      const paciente = await buscarPacientePorId(id);
      setResultado(`✅ Paciente encontrado:\n${JSON.stringify(paciente, null, 2)}`);
    } catch (error: any) {
      setResultado(`❌ Erro ao buscar ID ${id}: ${error.message}`);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg max-w-4xl mx-auto">
      <h3 className="text-lg font-bold mb-4">Teste da API Mock</h3>
      
      <div className="flex gap-2 mb-4">
        <Button onClick={testarListarPacientes} disabled={carregando}>
          {carregando ? "Testando..." : "Listar Pacientes"}
        </Button>
        <Button onClick={testarBuscarPorId} disabled={carregando}>
          {carregando ? "Testando..." : "Buscar ID Específico"}
        </Button>
      </div>

      {resultado && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <pre className="text-sm overflow-auto">{resultado}</pre>
        </div>
      )}
    </div>
  );
};