

"use client";

import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, BarChart2, Users, CalendarCheck } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  countAppointmentsToday,
  getAppointmentsByDateRange,
  listarAgendamentos,
  buscarMedicosPorIds,
  buscarPacientesPorIds,
} from "@/lib/api";

// ============================================================================
// Constants
// ============================================================================

const FALLBACK_MEDICOS = [
  { nome: "Dr. Carlos Andrade", consultas: 62 },
  { nome: "Dra. Paula Silva", consultas: 58 },
  { nome: "Dr. João Pedro", consultas: 54 },
  { nome: "Dra. Marina Costa", consultas: 51 },
];

// ============================================================================
// Helper Functions
// ============================================================================

async function exportPDF(title: string, content: string, chartElementId?: string) {
  const doc = new jsPDF();
  let yPosition = 15;

  // Add title
  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.text(title, 15, yPosition);
  yPosition += 10;

  // Add description/content
  doc.setFontSize(11);
  doc.setFont(undefined, "normal");
  const contentLines = doc.splitTextToSize(content, 180);
  doc.text(contentLines, 15, yPosition);
  yPosition += contentLines.length * 5 + 15;

  // Capture chart if chartElementId is provided
  if (chartElementId) {
    try {
      const chartElement = document.getElementById(chartElementId);
      if (chartElement) {
        // Create a canvas from the chart element
        const canvas = await html2canvas(chartElement, {
          backgroundColor: "#ffffff",
          scale: 2,
          logging: false,
        });

        // Convert canvas to image
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = 180;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Add image to PDF
        doc.addImage(imgData, "PNG", 15, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 10;
      }
    } catch (error) {
      console.error("Error capturing chart:", error);
      doc.text("(Erro ao capturar gráfico)", 15, yPosition);
      yPosition += 10;
    }
  }

  doc.save(`${title.toLowerCase().replace(/ /g, "-")}.pdf`);
}

// ============================================================================
// Main Component
// ============================================================================

export default function RelatoriosPage() {
  // State
  const [metricsState, setMetricsState] = useState<Array<{ label: string; value: any; icon: any }>>([]);
  const [consultasData, setConsultasData] = useState<Array<{ periodo: string; consultas: number }>>([]);
  const [pacientesTop, setPacientesTop] = useState<Array<{ nome: string; consultas: number }>>([]);
  const [medicosTop, setMedicosTop] = useState(FALLBACK_MEDICOS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data Loading
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        // Fetch appointments
        let appointments: any[] = [];
        try {
          appointments = await listarAgendamentos(
            "select=patient_id,doctor_id,scheduled_at,status&order=scheduled_at.desc&limit=1000"
          );
        } catch (e) {
          console.warn("[relatorios] listarAgendamentos failed, using fallback", e);
          appointments = await getAppointmentsByDateRange(30).catch(() => []);
        }

        // Fetch today's appointments count
        let appointmentsToday = 0;
        try {
          appointmentsToday = await countAppointmentsToday().catch(() => 0);
        } catch (e) {
          appointmentsToday = 0;
        }

        if (!mounted) return;

        // ===== Build Consultas Chart (last 30 days) =====
        const daysCount = 30;
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startTs = start.getTime() - (daysCount - 1) * 86400000;
        const dayBuckets: Record<string, { periodo: string; consultas: number }> = {};

        for (let i = 0; i < daysCount; i++) {
          const d = new Date(startTs + i * 86400000);
          const iso = d.toISOString().split("T")[0];
          const periodo = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
          dayBuckets[iso] = { periodo, consultas: 0 };
        }

        const appts = Array.isArray(appointments) ? appointments : [];
        for (const a of appts) {
          try {
            const iso = (a.scheduled_at || "").toString().split("T")[0];
            if (iso && dayBuckets[iso]) dayBuckets[iso].consultas += 1;
          } catch (e) {
            // ignore malformed
          }
        }
        setConsultasData(Object.values(dayBuckets));

        // ===== Aggregate Counts =====
        const patientCounts: Record<string, number> = {};
        const doctorCounts: Record<string, number> = {};
        const doctorNoShowCounts: Record<string, number> = {};

        for (const a of appts) {
          if (a.patient_id) {
            patientCounts[String(a.patient_id)] = (patientCounts[String(a.patient_id)] || 0) + 1;
          }
          if (a.doctor_id) {
            const did = String(a.doctor_id);
            doctorCounts[did] = (doctorCounts[did] || 0) + 1;
            if (String(a.status || "").toLowerCase() === "no_show" || String(a.status || "").toLowerCase() === "no-show") {
              doctorNoShowCounts[did] = (doctorNoShowCounts[did] || 0) + 1;
            }
          }
        }

        // ===== Top 5 Patients & Doctors =====
        const topPatientIds = Object.entries(patientCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map((x) => x[0]);
        const topDoctorIds = Object.entries(doctorCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map((x) => x[0]);

        const [patientsFetched, doctorsFetched] = await Promise.all([
          topPatientIds.length ? buscarPacientesPorIds(topPatientIds) : Promise.resolve([]),
          topDoctorIds.length ? buscarMedicosPorIds(topDoctorIds) : Promise.resolve([]),
        ]);

        // ===== Build Patient List =====
        const pacientesList = topPatientIds.map((id) => {
          const p = (patientsFetched || []).find((x: any) => String(x.id) === String(id));
          return { nome: p ? p.full_name : id, consultas: patientCounts[id] || 0 };
        });

        // ===== Build Doctor List =====
        const medicosList = topDoctorIds.map((id) => {
          const m = (doctorsFetched || []).find((x: any) => String(x.id) === String(id));
          return { nome: m ? m.full_name : id, consultas: doctorCounts[id] || 0 };
        });

        // ===== Update State =====
        setPacientesTop(pacientesList);
        setMedicosTop(medicosList.length ? medicosList : FALLBACK_MEDICOS);
        setMetricsState([
          { label: "Atendimentos", value: appointmentsToday ?? 0, icon: <CalendarCheck className="w-6 h-6 text-blue-500" /> },
        ] as any);
      } catch (err: any) {
        console.error("[relatorios] error loading data:", err);
        if (mounted) setError(err?.message ?? String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);  return (
    <div className="p-6 bg-background min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Dashboard Executivo de Relatórios</h1>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-6 mb-8">
        {loading ? (
          // simple skeletons while loading to avoid showing fake data
          Array.from({ length: 1 }).map((_, i) => (
            <div key={i} className="p-4 bg-card border border-border rounded-lg shadow flex flex-col items-center justify-center">
              <div className="h-6 w-6 bg-muted rounded mb-2 animate-pulse" />
              <div className="h-6 w-20 bg-muted rounded mt-2 animate-pulse" />
              <div className="h-3 w-28 bg-muted rounded mt-3 animate-pulse" />
            </div>
          ))
        ) : (
          metricsState.map((m) => (
            <div key={m.label} className="p-4 bg-card border border-border rounded-lg shadow flex flex-col items-center justify-center">
              {m.icon}
              <span className="text-2xl font-bold mt-2 text-foreground">{m.value}</span>
              <span className="text-sm text-muted-foreground mt-1 text-center">{m.label}</span>
            </div>
          ))
        )}
      </div>

      {/* Consultas Chart */}
      <div className="grid grid-cols-1 gap-8 mb-8">
        <div className="bg-card border border-border rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 mb-4">
            <h2 className="font-semibold text-lg text-foreground flex items-center gap-2">
              <BarChart2 className="w-5 h-5" /> Consultas por Período
            </h2>
            <Button
              size="sm"
              variant="outline"
              className="hover:bg-primary! hover:text-white! transition-colors w-full md:w-auto"
              onClick={() => exportPDF("Consultas por Período", "Resumo das consultas realizadas por período.", "chart-consultas")}
            >
              <FileDown className="w-4 h-4 mr-1" /> Exportar PDF
            </Button>
          </div>
          {loading ? (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground">Carregando dados...</div>
          ) : (
            <div id="chart-consultas">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={consultasData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="consultas" fill="#6366f1" name="Consultas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Pacientes mais atendidos */}
        <div className="bg-card border border-border rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-lg text-foreground flex items-center gap-2"><Users className="w-5 h-5" /> Pacientes Mais Atendidos</h2>
            <Button size="sm" variant="outline" className="hover:bg-primary! hover:text-white! transition-colors" onClick={() => exportPDF("Pacientes Mais Atendidos", "Lista dos pacientes mais atendidos.", "table-pacientes")}> <FileDown className="w-4 h-4 mr-1" /> Exportar PDF</Button>
          </div>
          <div id="table-pacientes">
            <table className="w-full text-sm mt-4">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left font-medium">Paciente</th>
                <th className="text-left font-medium">Consultas</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="py-4 text-muted-foreground" colSpan={2}>Carregando pacientes...</td>
                </tr>
              ) : pacientesTop && pacientesTop.length ? (
                pacientesTop.map((p: { nome: string; consultas: number }) => (
                  <tr key={p.nome}>
                    <td className="py-1">{p.nome}</td>
                    <td className="py-1">{p.consultas}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-4 text-muted-foreground" colSpan={2}>Nenhum paciente encontrado</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Médicos mais produtivos */}
        <div className="bg-card border border-border rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-lg text-foreground flex items-center gap-2"><Users className="w-5 h-5" /> Médicos Mais Produtivos</h2>
            <Button size="sm" variant="outline" className="hover:bg-primary! hover:text-white! transition-colors" onClick={() => exportPDF("Médicos Mais Produtivos", "Lista dos médicos mais produtivos.", "table-medicos")}> <FileDown className="w-4 h-4 mr-1" /> Exportar PDF</Button>
          </div>
          <div id="table-medicos">
            <table className="w-full text-sm mt-4">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left font-medium">Médico</th>
                <th className="text-left font-medium">Consultas</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="py-4 text-muted-foreground" colSpan={2}>Carregando médicos...</td>
                </tr>
              ) : medicosTop && medicosTop.length ? (
                medicosTop.map((m) => (
                  <tr key={m.nome}>
                    <td className="py-1">{m.nome}</td>
                    <td className="py-1">{m.consultas}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-4 text-muted-foreground" colSpan={2}>Nenhum médico encontrado</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
}

