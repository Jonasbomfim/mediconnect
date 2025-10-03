"use client";


import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import jsPDF from "jspdf";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function RelatoriosPage() {
  // Dados fictícios para o gráfico financeiro
  const financeiro = [
    { mes: "Jan", faturamento: 35000, despesas: 12000 },
    { mes: "Fev", faturamento: 29000, despesas: 15000 },
    { mes: "Mar", faturamento: 42000, despesas: 18000 },
    { mes: "Abr", faturamento: 38000, despesas: 14000 },
    { mes: "Mai", faturamento: 45000, despesas: 20000 },
    { mes: "Jun", faturamento: 41000, despesas: 17000 },
  ];
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
    <div className="p-6 bg-background min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Relatórios</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* Card Consultas */}
        <div className="p-4 border border-border rounded-lg shadow bg-card">
          <h2 className="font-semibold text-lg text-foreground">Relatório de Consultas</h2>
          <p className="text-sm text-muted-foreground">Resumo das consultas realizadas.</p>
          {/* PASSO 4 - Botão chama a função */}
          <Button onClick={exportConsultasPDF} className="mt-4">
            <FileDown className="mr-2 h-4 w-4" /> Exportar PDF
          </Button>
        </div>

        {/* Card Pacientes */}
        <div className="p-4 border border-border rounded-lg shadow bg-card">
          <h2 className="font-semibold text-lg text-foreground">Relatório de Pacientes</h2>
          <p className="text-sm text-muted-foreground">Informações gerais dos pacientes cadastrados.</p>
          <Button onClick={exportPacientesPDF} className="mt-4">
            <FileDown className="mr-2 h-4 w-4" /> Exportar PDF
          </Button>
        </div>

        {/* Card Financeiro com gráfico */}
        <div className="p-4 border border-border rounded-lg shadow col-span-3 md:col-span-3 bg-card">
          <h2 className="font-semibold text-lg mb-2 text-foreground">Relatório Financeiro</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={financeiro} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="faturamento" fill="#10b981" name="Faturamento" />
              <Bar dataKey="despesas" fill="#ef4444" name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
          <Button onClick={exportFinanceiroPDF} className="mt-4">
            <FileDown className="mr-2 h-4 w-4" /> Exportar PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
