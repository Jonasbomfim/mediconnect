
"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, BarChart2, Users, DollarSign, TrendingUp, UserCheck, CalendarCheck, ThumbsUp, User, Briefcase } from "lucide-react";
import jsPDF from "jspdf";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import {
  countTotalPatients,
  countTotalDoctors,
  countAppointmentsToday,
  getAppointmentsByDateRange,
  listarAgendamentos,
  getUpcomingAppointments,
  getNewUsersLastDays,
  getPendingReports,
  buscarMedicosPorIds,
  buscarPacientesPorIds,
} from "@/lib/api";

// Dados fictícios para demonstração
const metricas = [
  { label: "Atendimentos", value: 1240, icon: <CalendarCheck className="w-6 h-6 text-blue-500" /> },
  { label: "Absenteísmo", value: "7,2%", icon: <UserCheck className="w-6 h-6 text-red-500" /> },
  { label: "Satisfação", value: "Dados não foram disponibilizados", icon: <ThumbsUp className="w-6 h-6 text-green-500" /> },
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

// pacientesMaisAtendidos static list removed — data will be fetched from the API

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
  // Local state that will be replaced by API data when available
  // Start with empty data to avoid showing fictitious frontend data while loading
  const [metricsState, setMetricsState] = useState<Array<{ label: string; value: any; icon: any }>>([]);
  const [consultasData, setConsultasData] = useState<Array<{ periodo: string; consultas: number }>>([]);
  const [faturamentoData, setFaturamentoData] = useState<Array<{ mes: string; valor: number }>>([]);
  const [taxaNoShowState, setTaxaNoShowState] = useState<Array<{ mes: string; noShow: number }>>([]);
  const [pacientesTop, setPacientesTop] = useState<Array<{ nome: string; consultas: number }>>([]);
  const [medicosTop, setMedicosTop] = useState(medicosMaisProdutivos);
  const [medicosPerformance, setMedicosPerformance] = useState<Array<{ nome: string; consultas: number; absenteismo: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conveniosData, setConveniosData] = useState<Array<{ nome: string; valor: number }>>(convenios);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        // Fetch counts in parallel, then try to fetch a larger appointments list via listarAgendamentos.
        // If listarAgendamentos fails (for example: unauthenticated), fall back to getAppointmentsByDateRange(30).
        const [patientsCount, doctorsCount, appointmentsToday] = await Promise.all([
          countTotalPatients().catch(() => 0),
          countTotalDoctors().catch(() => 0),
          countAppointmentsToday().catch(() => 0),
        ]);

        let appointments: any[] = [];
        try {
          // Try to get a larger set of appointments (up to 1000) to compute top patients
          // select=patient_id,doctor_id,scheduled_at,status to reduce payload
          // include insurance_provider so we can aggregate convênios client-side
          appointments = await listarAgendamentos('select=patient_id,doctor_id,scheduled_at,status,insurance_provider&order=scheduled_at.desc&limit=1000');
        } catch (e) {
          // Fallback to the smaller helper if listarAgendamentos cannot be used (e.g., no auth token)
          console.warn('[relatorios] listarAgendamentos falhou, usando getAppointmentsByDateRange fallback', e);
          appointments = await getAppointmentsByDateRange(30).catch(() => []);
        }

        if (!mounted) return;

        // Update top metrics card
        setMetricsState([
          { label: "Atendimentos", value: appointmentsToday ?? 0, icon: <CalendarCheck className="w-6 h-6 text-blue-500" /> },
          { label: "Absenteísmo", value: "—", icon: <UserCheck className="w-6 h-6 text-red-500" /> },
          { label: "Satisfação", value: "Dados não foram disponibilizados", icon: <ThumbsUp className="w-6 h-6 text-green-500" /> },
          { label: "Faturamento (Mês)", value: "—", icon: <DollarSign className="w-6 h-6 text-emerald-500" /> },
          { label: "No-show", value: "—", icon: <User className="w-6 h-6 text-yellow-500" /> },
        ]);

        // Build last 30 days series for consultas
        const daysCount = 30;
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startTs = start.getTime() - (daysCount - 1) * 86400000; // include today
        const dayBuckets: Record<string, { periodo: string; consultas: number }> = {};
        for (let i = 0; i < daysCount; i++) {
          const d = new Date(startTs + i * 86400000);
          const iso = d.toISOString().split("T")[0];
          const periodo = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
          dayBuckets[iso] = { periodo, consultas: 0 };
        }

        // Count appointments per day
        const appts = Array.isArray(appointments) ? appointments : [];
        for (const a of appts) {
          try {
            const iso = (a.scheduled_at || '').toString().split('T')[0];
            if (iso && dayBuckets[iso]) dayBuckets[iso].consultas += 1;
          } catch (e) {
            // ignore malformed
          }
        }
        const consultasArr = Object.values(dayBuckets);
        setConsultasData(consultasArr);

        // Estimate monthly faturamento for last 6 months using doctor.valor_consulta when available
        const monthsBack = 6;
        const monthMap: Record<string, { mes: string; valor: number; totalAppointments: number; noShowCount: number }> = {};
        const nowMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthKeys: string[] = [];
        for (let i = monthsBack - 1; i >= 0; i--) {
          const m = new Date(nowMonth.getFullYear(), nowMonth.getMonth() - i, 1);
          const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
          monthKeys.push(key);
          monthMap[key] = { mes: m.toLocaleString('pt-BR', { month: 'short' }), valor: 0, totalAppointments: 0, noShowCount: 0 };
        }

        // Filter appointments within monthsBack and group
        const apptsForMonths = appts.filter((a) => {
          try {
            const d = new Date(a.scheduled_at);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            return key in monthMap;
          } catch (e) {
            return false;
          }
        });

        // Collect unique doctor ids to fetch valor_consulta in bulk
        const doctorIds = Array.from(new Set(apptsForMonths.map((a: any) => String(a.doctor_id).trim()).filter(Boolean)));
        const doctors = doctorIds.length ? await buscarMedicosPorIds(doctorIds) : [];
        const doctorMap = new Map<string, any>();
        for (const d of doctors) doctorMap.set(String(d.id), d);

        for (const a of apptsForMonths) {
          try {
            const d = new Date(a.scheduled_at);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const doc = doctorMap.get(String(a.doctor_id));
            const price = doc && doc.valor_consulta ? Number(doc.valor_consulta) : 0;
            monthMap[key].valor += price;
            monthMap[key].totalAppointments += 1;
            if (String(a.status || '').toLowerCase() === 'no_show' || String(a.status || '').toLowerCase() === 'no-show') {
              monthMap[key].noShowCount += 1;
            }
          } catch (e) {}
        }

        const faturamentoArr = monthKeys.map((k) => ({ mes: monthMap[k].mes, valor: Math.round(monthMap[k].valor) }));
        setFaturamentoData(faturamentoArr);

        // Taxa no-show per month
        const taxaArr = monthKeys.map((k) => {
          const total = monthMap[k].totalAppointments || 0;
          const noShow = monthMap[k].noShowCount || 0;
          const pct = total ? Number(((noShow / total) * 100).toFixed(1)) : 0;
          return { mes: monthMap[k].mes, noShow: pct };
        });
        setTaxaNoShowState(taxaArr);

        // Top patients and doctors (by number of appointments in the period)
        const patientCounts: Record<string, number> = {};
        const doctorCounts: Record<string, number> = {};
        const doctorNoShowCounts: Record<string, number> = {};
        for (const a of apptsForMonths) {
          if (a.patient_id) patientCounts[String(a.patient_id)] = (patientCounts[String(a.patient_id)] || 0) + 1;
          if (a.doctor_id) {
            const did = String(a.doctor_id);
            doctorCounts[did] = (doctorCounts[did] || 0) + 1;
            const status = String(a.status || '').toLowerCase();
            if (status === 'no_show' || status === 'no-show') doctorNoShowCounts[did] = (doctorNoShowCounts[did] || 0) + 1;
          }
        }

        const topPatientIds = Object.entries(patientCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map((x) => x[0]);
        const topDoctorIds = Object.entries(doctorCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map((x) => x[0]);

        const [patientsFetched, doctorsFetched] = await Promise.all([
          topPatientIds.length ? buscarPacientesPorIds(topPatientIds) : Promise.resolve([]),
          topDoctorIds.length ? buscarMedicosPorIds(topDoctorIds) : Promise.resolve([]),
        ]);

        const pacientesList = topPatientIds.map((id) => {
          const p = (patientsFetched || []).find((x: any) => String(x.id) === String(id));
          return { nome: p ? p.full_name : id, consultas: patientCounts[id] || 0 };
        });

        const medicosList = topDoctorIds.map((id) => {
          const m = (doctorsFetched || []).find((x: any) => String(x.id) === String(id));
          return { nome: m ? m.full_name : id, consultas: doctorCounts[id] || 0 };
        });

        // Build performance list (consultas + absenteísmo)
  const perfIds = Object.keys(doctorCounts).sort((a, b) => (doctorCounts[b] || 0) - (doctorCounts[a] || 0)).slice(0, 5);
        const perfDoctors = (doctorsFetched && doctorsFetched.length) ? doctorsFetched : doctors;
        const perfList = perfIds.map((id) => {
          const d = (perfDoctors || []).find((x: any) => String(x.id) === String(id));
          const consultas = doctorCounts[id] || 0;
          const noShow = doctorNoShowCounts[id] || 0;
          const absenteismo = consultas ? Number(((noShow / consultas) * 100).toFixed(1)) : 0;
          return { nome: d ? d.full_name : id, consultas, absenteismo };
        });

        // Use fetched list (may be empty) — do not fall back to static data for patients, but keep fallback for medicosTop
        setPacientesTop(pacientesList);
        setMedicosTop(medicosList.length ? medicosList : medicosMaisProdutivos);
  setMedicosPerformance(perfList.length ? perfList.slice(0,5) : performancePorMedico.map((p) => ({ nome: p.nome, consultas: p.consultas, absenteismo: p.absenteismo })).slice(0,5));

        // Aggregate convênios (insurance providers) from appointments in the period
        try {
          const providerCounts: Record<string, number> = {};
          for (const a of apptsForMonths) {
            let prov: any = a?.insurance_provider ?? a?.insuranceProvider ?? a?.insurance ?? '';
            // If provider is an object, try to extract a human-friendly name
            if (prov && typeof prov === 'object') prov = prov.name || prov.full_name || prov.title || '';
            prov = String(prov || '').trim();
            const key = prov || 'Não disponibilizado';
            providerCounts[key] = (providerCounts[key] || 0) + 1;
          }

          let conveniosArr = Object.entries(providerCounts).map(([nome, valor]) => ({ nome, valor }));
          if (!conveniosArr.length) {
            // No provider info at all — present a single bucket showing the total count as 'Não disponibilizado'
            conveniosArr = [{ nome: 'Não disponibilizado', valor: apptsForMonths.length }];
          } else {
            // Sort and keep top 5, group the rest into 'Outros'
            conveniosArr.sort((a, b) => b.valor - a.valor);
            if (conveniosArr.length > 5) {
              const top = conveniosArr.slice(0, 5);
              const others = conveniosArr.slice(5).reduce((s, c) => s + c.valor, 0);
              top.push({ nome: 'Outros', valor: others });
              conveniosArr = top;
            }
          }
          setConveniosData(conveniosArr);
        } catch (e) {
          // keep existing static conveniosData if something goes wrong
          console.warn('[relatorios] erro ao agregar convênios', e);
        }

        // Update metrics cards with numbers we fetched
        setMetricsState([
          { label: "Atendimentos", value: appointmentsToday ?? 0, icon: <CalendarCheck className="w-6 h-6 text-blue-500" /> },
          { label: "Absenteísmo", value: '—', icon: <UserCheck className="w-6 h-6 text-red-500" /> },
          { label: "Satisfação", value: 'Dados não foram disponibilizados', icon: <ThumbsUp className="w-6 h-6 text-green-500" /> },
          { label: "Faturamento (Mês)", value: `R$ ${faturamentoArr[faturamentoArr.length - 1]?.valor ?? 0}`, icon: <DollarSign className="w-6 h-6 text-emerald-500" /> },
          { label: "No-show", value: `${taxaArr[taxaArr.length - 1]?.noShow ?? 0}%`, icon: <User className="w-6 h-6 text-yellow-500" /> },
        ] as any);

      } catch (err: any) {
        console.error('[relatorios] erro ao carregar dados', err);
        if (mounted) setError(err?.message ?? String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="p-6 bg-background min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Dashboard Executivo de Relatórios</h1>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        {loading ? (
          // simple skeletons while loading to avoid showing fake data
          Array.from({ length: 5 }).map((_, i) => (
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

      {/* Gráficos e Relatórios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Consultas realizadas por período */}
        <div className="bg-card border border-border rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-lg text-foreground flex items-center gap-2"><BarChart2 className="w-5 h-5" /> Consultas por Período</h2>
            <Button size="sm" variant="outline" className="hover:bg-primary! hover:text-white! transition-colors" onClick={() => exportPDF("Consultas por Período", "Resumo das consultas realizadas por período.")}> <FileDown className="w-4 h-4 mr-1" /> Exportar PDF</Button>
          </div>
          {loading ? (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground">Carregando dados...</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={consultasData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodo" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="consultas" fill="#6366f1" name="Consultas" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Faturamento mensal/anual */}
        <div className="bg-card border border-border rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-lg text-foreground flex items-center gap-2"><DollarSign className="w-5 h-5" /> Faturamento Mensal</h2>
            <Button size="sm" variant="outline" className="hover:bg-primary! hover:text-white! transition-colors" onClick={() => exportPDF("Faturamento Mensal", "Resumo do faturamento mensal.")}> <FileDown className="w-4 h-4 mr-1" /> Exportar PDF</Button>
          </div>
          {loading ? (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground">Carregando dados...</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={faturamentoData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="valor" stroke="#10b981" name="Faturamento" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Taxa de no-show */}
        <div className="bg-card border border-border rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-lg text-foreground flex items-center gap-2"><UserCheck className="w-5 h-5" /> Taxa de No-show</h2>
            <Button size="sm" variant="outline" className="hover:bg-primary! hover:text-white! transition-colors" onClick={() => exportPDF("Taxa de No-show", "Resumo da taxa de no-show.")}> <FileDown className="w-4 h-4 mr-1" /> Exportar PDF</Button>
          </div>
          {loading ? (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground">Carregando dados...</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={taxaNoShowState}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis unit="%" />
                <Tooltip />
                <Line type="monotone" dataKey="noShow" stroke="#ef4444" name="No-show (%)" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Indicadores de satisfação */}
        <div className="bg-card border border-border rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-lg text-foreground flex items-center gap-2"><ThumbsUp className="w-5 h-5" /> Satisfação dos Pacientes</h2>
            <Button size="sm" variant="outline" className="hover:bg-primary! hover:text-white! transition-colors" onClick={() => exportPDF("Satisfação dos Pacientes", "Resumo dos indicadores de satisfação.")}> <FileDown className="w-4 h-4 mr-1" /> Exportar PDF</Button>
          </div>
          <div className="flex flex-col items-center justify-center h-[220px]">
            <span className="text-2xl font-bold text-foreground">Dados não foram disponibilizados</span>
            <span className="text-muted-foreground mt-2">Índice de satisfação geral</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Pacientes mais atendidos */}
        <div className="bg-card border border-border rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-lg text-foreground flex items-center gap-2"><Users className="w-5 h-5" /> Pacientes Mais Atendidos</h2>
            <Button size="sm" variant="outline" className="hover:bg-primary! hover:text-white! transition-colors" onClick={() => exportPDF("Pacientes Mais Atendidos", "Lista dos pacientes mais atendidos.")}> <FileDown className="w-4 h-4 mr-1" /> Exportar PDF</Button>
          </div>
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

        {/* Médicos mais produtivos */}
        <div className="bg-card border border-border rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-lg text-foreground flex items-center gap-2"><Briefcase className="w-5 h-5" /> Médicos Mais Produtivos</h2>
            <Button size="sm" variant="outline" className="hover:bg-primary! hover:text-white! transition-colors" onClick={() => exportPDF("Médicos Mais Produtivos", "Lista dos médicos mais produtivos.")}> <FileDown className="w-4 h-4 mr-1" /> Exportar PDF</Button>
          </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Análise de convênios */}
        <div className="bg-card border border-border rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-lg text-foreground flex items-center gap-2"><DollarSign className="w-5 h-5" /> Análise de Convênios</h2>
            <Button size="sm" variant="outline" className="hover:bg-primary! hover:text-white! transition-colors" onClick={() => exportPDF("Análise de Convênios", "Resumo da análise de convênios.")}> <FileDown className="w-4 h-4 mr-1" /> Exportar PDF</Button>
          </div>
          {loading ? (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground">Carregando dados...</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={conveniosData} dataKey="valor" nameKey="nome" cx="50%" cy="50%" outerRadius={80} label>
                  {conveniosData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Performance por médico */}
        <div className="bg-card border border-border rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-lg text-foreground flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Performance por Médico</h2>
            <Button size="sm" variant="outline" className="hover:bg-primary! hover:text-white! transition-colors" onClick={() => exportPDF("Performance por Médico", "Resumo da performance por médico.")}> <FileDown className="w-4 h-4 mr-1" /> Exportar PDF</Button>
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
              {(loading ? performancePorMedico : medicosPerformance).map((m) => (
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

