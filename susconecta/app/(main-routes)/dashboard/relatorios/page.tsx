"use client";

import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import jsPDF from "jspdf";

export default function RelatoriosPage() {
  // ============================
  // PASSO 3 - Funções de exportar
  // ============================
  const exportConsultasPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Consultas", 10, 10);
    doc.text("Resumo das consultas realizadas.", 10, 20);
    doc.save("relatorio-consultas.pdf");
  };

  const exportPacientesPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Pacientes", 10, 10);
    doc.text("Informações gerais dos pacientes cadastrados.", 10, 20);
    doc.save("relatorio-pacientes.pdf");
  };

  const exportFinanceiroPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório Financeiro", 10, 10);
    doc.text("Receitas e despesas da clínica.", 10, 20);
    doc.save("relatorio-financeiro.pdf");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Relatórios</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* Card Consultas */}
        <div className="p-4 border rounded-lg shadow">
          <h2 className="font-semibold text-lg">Relatório de Consultas</h2>
          <p className="text-sm text-gray-500">Resumo das consultas realizadas.</p>
          {/* PASSO 4 - Botão chama a função */}
          <Button onClick={exportConsultasPDF} className="mt-4">
            <FileDown className="mr-2 h-4 w-4" /> Exportar PDF
          </Button>
        </div>

        {/* Card Pacientes */}
        <div className="p-4 border rounded-lg shadow">
          <h2 className="font-semibold text-lg">Relatório de Pacientes</h2>
          <p className="text-sm text-gray-500">Informações gerais dos pacientes cadastrados.</p>
          <Button onClick={exportPacientesPDF} className="mt-4">
            <FileDown className="mr-2 h-4 w-4" /> Exportar PDF
          </Button>
        </div>

        {/* Card Financeiro */}
        <div className="p-4 border rounded-lg shadow">
          <h2 className="font-semibold text-lg">Relatório Financeiro</h2>
          <p className="text-sm text-gray-500">Receitas e despesas da clínica.</p>
          <Button onClick={exportFinanceiroPDF} className="mt-4">
            <FileDown className="mr-2 h-4 w-4" /> Exportar PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
