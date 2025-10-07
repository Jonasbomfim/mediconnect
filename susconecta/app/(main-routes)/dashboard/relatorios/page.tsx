
"use client";

import { Button } from "@/components/ui/button";
import { FileDown, BarChart2, Users, DollarSign, TrendingUp, UserCheck, CalendarCheck, ThumbsUp, User, Briefcase } from "lucide-react";
import jsPDF from "jspdf";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

// Dados fictícios para demonstração
const metricas = [
  { label: "Atendimentos", value: 1240, icon: <CalendarCheck className="w-6 h-6 text-blue-500" /> },
  { label: "Absenteísmo", value: "7,2%", icon: <UserCheck className="w-6 h-6 text-red-500" /> },
  { label: "Satisfação", value: "92%", icon: <ThumbsUp className="w-6 h-6 text-green-500" /> },
  { label: "Faturamento (Mês)", value: "R$ 45.000", icon: <DollarSign className="w-6 h-6 text-emerald-500" /> },
  { label: "No-show", value: "5,1%", icon: <User className="w-6 h-6 text-yellow-500" /> },
];

const consultasPorPeriodo = [
  { periodo: "Jan", consultas: 210 },
  { periodo: "Fev", consultas: 180 },
  { periodo: "Mar", consultas: 250 },
  { periodo: "Abr", consultas: 230 },
  { periodo: "Mai", consultas: 270 },
  { periodo: "Jun", consultas: 220 },
];

const faturamentoMensal = [
  { mes: "Jan", valor: 35000 },
  { mes: "Fev", valor: 29000 },
  { mes: "Mar", valor: 42000 },
  { mes: "Abr", valor: 38000 },
  { mes: "Mai", valor: 45000 },
  { mes: "Jun", valor: 41000 },
];

const taxaNoShow = [
  { mes: "Jan", noShow: 6.2 },
  { mes: "Fev", noShow: 5.8 },
  { mes: "Mar", noShow: 4.9 },
  { mes: "Abr", noShow: 5.5 },
  { mes: "Mai", noShow: 5.1 },
  { mes: "Jun", noShow: 4.7 },
];

const pacientesMaisAtendidos = [
  { nome: "Ana Souza", consultas: 18 },
  { nome: "Bruno Lima", consultas: 15 },
  { nome: "Carla Menezes", consultas: 13 },
  { nome: "Diego Alves", consultas: 12 },
  { nome: "Fernanda Dias", consultas: 11 },
];

const medicosMaisProdutivos = [
  { nome: "Dr. Carlos Andrade", consultas: 62 },
  { nome: "Dra. Paula Silva", consultas: 58 },
  { nome: "Dr. João Pedro", consultas: 54 },
  { nome: "Dra. Marina Costa", consultas: 51 },
];

const convenios = [
  { nome: "Unimed", valor: 18000 },
  { nome: "Bradesco", valor: 12000 },
  { nome: "SulAmérica", valor: 9000 },
  { nome: "Particular", valor: 15000 },
];

const performancePorMedico = [
  { nome: "Dr. Carlos Andrade", consultas: 62, absenteismo: 4.8 },
  { nome: "Dra. Paula Silva", consultas: 58, absenteismo: 6.1 },
  { nome: "Dr. João Pedro", consultas: 54, absenteismo: 7.5 },
  { nome: "Dra. Marina Costa", consultas: 51, absenteismo: 5.2 },
];

const COLORS = ["#10b981", "#6366f1", "#f59e42", "#ef4444"];

function exportPDF(title: string, content: string) {
  const doc = new jsPDF();
  doc.text(title, 10, 10);
  doc.text(content, 10, 20);
  doc.save(`${title.toLowerCase().replace(/ /g, '-')}.pdf`);
}

export default function RelatoriosPage() {
  return (
    <div className="p-6 bg-background min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Dashboard Executivo de Relatórios</h1>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        {metricas.map((m) => (
          <div key={m.label} className="p-4 bg-card border border-border rounded-lg shadow flex flex-col items-center justify-center">
            {m.icon}
            <span className="text-2xl font-bold mt-2 text-foreground">{m.value}</span>
            <span className="text-sm text-muted-foreground mt-1 text-center">{m.label}</span>
          </div>
        ))}
      </div>

      {/* Gráficos e Relatórios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Consultas realizadas por período */}
        <div className="bg-card border border-border rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-lg text-foreground flex items-center gap-2"><BarChart2 className="w-5 h-5" /> Consultas por Período</h2>
            <Button size="sm" variant="outline" onClick={() => exportPDF("Consultas por Período", "Resumo das consultas realizadas por período.")}> <FileDown className="w-4 h-4 mr-1" /> Exportar PDF</Button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={consultasPorPeriodo}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="consultas" fill="#6366f1" name="Consultas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Faturamento mensal/anual */}
        <div className="bg-card border border-border rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-lg text-foreground flex items-center gap-2"><DollarSign className="w-5 h-5" /> Faturamento Mensal</h2>
            <Button size="sm" variant="outline" onClick={() => exportPDF("Faturamento Mensal", "Resumo do faturamento mensal.")}> <FileDown className="w-4 h-4 mr-1" /> Exportar PDF</Button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={faturamentoMensal}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="valor" stroke="#10b981" name="Faturamento" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Taxa de no-show */}
        <div className="bg-card border border-border rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-lg text-foreground flex items-center gap-2"><UserCheck className="w-5 h-5" /> Taxa de No-show</h2>
            <Button size="sm" variant="outline" onClick={() => exportPDF("Taxa de No-show", "Resumo da taxa de no-show.")}> <FileDown className="w-4 h-4 mr-1" /> Exportar PDF</Button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={taxaNoShow}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis unit="%" />
              <Tooltip />
              <Line type="monotone" dataKey="noShow" stroke="#ef4444" name="No-show (%)" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Indicadores de satisfação */}
        <div className="bg-card border border-border rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-lg text-foreground flex items-center gap-2"><ThumbsUp className="w-5 h-5" /> Satisfação dos Pacientes</h2>
            <Button size="sm" variant="outline" onClick={() => exportPDF("Satisfação dos Pacientes", "Resumo dos indicadores de satisfação.")}> <FileDown className="w-4 h-4 mr-1" /> Exportar PDF</Button>
          </div>
          <div className="flex flex-col items-center justify-center h-[220px]">
            <span className="text-5xl font-bold text-green-500">92%</span>
            <span className="text-muted-foreground mt-2">Índice de satisfação geral</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Pacientes mais atendidos */}
        <div className="bg-card border border-border rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-lg text-foreground flex items-center gap-2"><Users className="w-5 h-5" /> Pacientes Mais Atendidos</h2>
            <Button size="sm" variant="outline" onClick={() => exportPDF("Pacientes Mais Atendidos", "Lista dos pacientes mais atendidos.")}> <FileDown className="w-4 h-4 mr-1" /> Exportar PDF</Button>
          </div>
          <table className="w-full text-sm mt-4">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left font-medium">Paciente</th>
                <th className="text-left font-medium">Consultas</th>
              </tr>
            </thead>
            <tbody>
              {pacientesMaisAtendidos.map((p) => (
                <tr key={p.nome}>
                  <td className="py-1">{p.nome}</td>
                  <td className="py-1">{p.consultas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Médicos mais produtivos */}
        <div className="bg-card border border-border rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-lg text-foreground flex items-center gap-2"><Briefcase className="w-5 h-5" /> Médicos Mais Produtivos</h2>
            <Button size="sm" variant="outline" onClick={() => exportPDF("Médicos Mais Produtivos", "Lista dos médicos mais produtivos.")}> <FileDown className="w-4 h-4 mr-1" /> Exportar PDF</Button>
          </div>
          <table className="w-full text-sm mt-4">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left font-medium">Médico</th>
                <th className="text-left font-medium">Consultas</th>
              </tr>
            </thead>
            <tbody>
              {medicosMaisProdutivos.map((m) => (
                <tr key={m.nome}>
                  <td className="py-1">{m.nome}</td>
                  <td className="py-1">{m.consultas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Análise de convênios */}
        <div className="bg-card border border-border rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-lg text-foreground flex items-center gap-2"><DollarSign className="w-5 h-5" /> Análise de Convênios</h2>
            <Button size="sm" variant="outline" onClick={() => exportPDF("Análise de Convênios", "Resumo da análise de convênios.")}> <FileDown className="w-4 h-4 mr-1" /> Exportar PDF</Button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={convenios} dataKey="valor" nameKey="nome" cx="50%" cy="50%" outerRadius={80} label>
                {convenios.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Performance por médico */}
        <div className="bg-card border border-border rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-lg text-foreground flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Performance por Médico</h2>
            <Button size="sm" variant="outline" onClick={() => exportPDF("Performance por Médico", "Resumo da performance por médico.")}> <FileDown className="w-4 h-4 mr-1" /> Exportar PDF</Button>
          </div>
          <table className="w-full text-sm mt-4">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left font-medium">Médico</th>
                <th className="text-left font-medium">Consultas</th>
                <th className="text-left font-medium">Absenteísmo (%)</th>
              </tr>
            </thead>
            <tbody>
              {performancePorMedico.map((m) => (
                <tr key={m.nome}>
                  <td className="py-1">{m.nome}</td>
                  <td className="py-1">{m.consultas}</td>
                  <td className="py-1">{m.absenteismo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
