
"use client";

import { useState, useEffect, useRef } from "react";
import { buscarPacientePorId } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Search, ChevronDown } from "lucide-react";

interface FormData {
  patientName?: string;
  cpf?: string;
  rg?: string;
  birthDate?: string;
  phoneCode?: string;
  phoneNumber?: string;
  email?: string;
  convenio?: string;
  matricula?: string;
  validade?: string;
  documentos?: string;
  professionalName?: string;
  unit?: string;
  appointmentDate?: string;
  startTime?: string;
  endTime?: string;
  requestingProfessional?: string;
  appointmentType?: string;
  notes?: string;
  // API-editable appointment fields
  status?: string;
  duration_minutes?: number;
  chief_complaint?: string;
  patient_notes?: string;
  insurance_provider?: string;
  checked_in_at?: string; // ISO datetime
  completed_at?: string; // ISO datetime
  cancelled_at?: string; // ISO datetime
  cancellation_reason?: string;
}

interface CalendarRegistrationFormProperties {
  formData: FormData;
  onFormChange: (data: FormData) => void;
}

const formatValidityDate = (value: string) => {
  const cleaned = value.replaceAll(/\D/g, "");
  if (cleaned.length > 4) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
  }
  if (cleaned.length > 2) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
  }
  return cleaned;
};

export function CalendarRegistrationForm({ formData, onFormChange }: CalendarRegistrationFormProperties) {
  const [isAdditionalInfoOpen, setIsAdditionalInfoOpen] = useState(false);
  const [patientDetails, setPatientDetails] = useState<any | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(false);

  // Helpers to convert between ISO (server) and input[type=datetime-local] value
  const isoToDatetimeLocal = (iso?: string | null) => {
    if (!iso) return "";
    try {
  let s = String(iso).trim();
      // normalize common variants: space between date/time -> T
      s = s.replace(" ", "T");
      // If no timezone info (no Z or +/-), try treating as UTC by appending Z
      if (!/[zZ]$/.test(s) && !/[+-]\d{2}:?\d{2}$/.test(s)) {
        // try parse first; if invalid, append Z
        const tryParse = Date.parse(s);
        if (isNaN(tryParse)) {
          s = s + "Z";
        }
      }
      const d = new Date(s);
      if (isNaN(d.getTime())) return "";
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    } catch (e) {
      return "";
    }
  };

  const datetimeLocalToIso = (value: string) => {
    if (!value) return null;
    // value expected: YYYY-MM-DDTHH:MM or with seconds
    try {
      // If the browser gives a value without seconds, Date constructor will treat as local when we split
      const [datePart, timePart] = value.split("T");
      if (!datePart || !timePart) return null;
      const [y, m, d] = datePart.split("-").map((s) => parseInt(s, 10));
      const timeParts = timePart.split(":");
      const hh = parseInt(timeParts[0], 10);
      const min = parseInt(timeParts[1] || "0", 10);
      const sec = parseInt(timeParts[2] || "0", 10);
      if ([y, m, d, hh, min, sec].some((n) => Number.isNaN(n))) return null;
      const dt = new Date(y, m - 1, d, hh, min, sec, 0);
      return dt.toISOString();
    } catch (e) {
      return null;
    }
  };

  // Automatically fetch patient details when the form receives a patientId
  useEffect(() => {
    const maybeId = (formData as any).patientId || (formData as any).patient_id || null;
    if (!maybeId) {
      setPatientDetails(null);
      return;
    }
    let mounted = true;
    setLoadingPatient(true);
    buscarPacientePorId(maybeId)
      .then((p) => {
        if (!mounted) return;
        setPatientDetails(p);
      })
      .catch((e) => {
        if (!mounted) return;
        setPatientDetails({ error: String(e) });
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingPatient(false);
      });
    return () => {
      mounted = false;
    };
  }, [(formData as any).patientId, (formData as any).patient_id]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;

    // map datetime-local fields to ISO before sending up
    if (name === 'checked_in_at' || name === 'completed_at' || name === 'cancelled_at') {
      const iso = datetimeLocalToIso(value as string);
      onFormChange({ ...formData, [name]: iso });
      return;
    }

    if (name === 'validade') {
      const formattedValue = formatValidityDate(value);
      onFormChange({ ...formData, [name]: formattedValue });
      return;
    }

    // ensure duration is stored as a number
    if (name === 'duration_minutes') {
      const n = Number(value);
      onFormChange({ ...formData, duration_minutes: Number.isNaN(n) ? undefined : n });
      return;
    }

    // If user edits endTime manually, accept the value and clear lastAutoEndRef so auto-calc won't overwrite
    if (name === 'endTime') {
      // store as-is (HH:MM)
      try {
        // clear auto flag so user edits persist
        (lastAutoEndRef as any).current = null;
      } catch (e) {}
      onFormChange({ ...formData, endTime: value });
      return;
    }

    onFormChange({ ...formData, [name]: value });
  };

  // Auto-calculate endTime from startTime + duration_minutes
  const lastAutoEndRef = useRef<string | null>(null);

  useEffect(() => {
    const start = (formData as any).startTime;
    const dur = (formData as any).duration_minutes;
    const date = (formData as any).appointmentDate; // YYYY-MM-DD
    if (!start) return;
    // if duration is not a finite number, don't compute
    const minutes = typeof dur === 'number' && Number.isFinite(dur) ? dur : 0;
    // build a Date from appointmentDate + startTime; fall back to today if appointmentDate missing
    const datePart = date || new Date().toISOString().slice(0, 10);
    const [y, m, d] = String(datePart).split('-').map((s) => parseInt(s, 10));
    const [hh, mm] = String(start).split(':').map((s) => parseInt(s, 10));
    if ([y, m, d, hh, mm].some((n) => Number.isNaN(n))) return;
    const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
    const dt2 = new Date(dt.getTime() + minutes * 60000);
    const newEnd = `${String(dt2.getHours()).padStart(2, '0')}:${String(dt2.getMinutes()).padStart(2, '0')}`;
    const currentEnd = (formData as any).endTime;
    // Only overwrite if endTime is empty or it was the previously auto-calculated value
    if (!currentEnd || currentEnd === lastAutoEndRef.current) {
      lastAutoEndRef.current = newEnd;
      onFormChange({ ...formData, endTime: newEnd });
    }
  }, [(formData as any).startTime, (formData as any).duration_minutes, (formData as any).appointmentDate]);


  return (
    <form className="space-y-8">
      <div className="border border-border rounded-md p-6 space-y-4 bg-card">
        <h2 className="font-medium text-foreground">Informações do paciente</h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 space-y-2">
            <Label className="text-[13px]">Nome</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="patientName"
                placeholder="Nome do paciente"
                className="h-11 pl-8 rounded-md transition-colors bg-muted/10"
                value={formData.patientName || ''}
                disabled
              />
            </div>
          </div>
          <div className="md:col-span-6 flex items-start justify-end">
            <div className="text-right text-sm">
              {loadingPatient ? (
                <div>Carregando dados do paciente...</div>
              ) : patientDetails ? (
                patientDetails.error ? (
                  <div className="text-red-500">Erro ao carregar paciente: {String(patientDetails.error)}</div>
                ) : (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div><strong>CPF:</strong> {patientDetails.cpf || '-'}</div>
                    <div><strong>Telefone:</strong> {patientDetails.phone_mobile || patientDetails.telefone || '-'}</div>
                    <div><strong>E-mail:</strong> {patientDetails.email || '-'}</div>
                    <div><strong>Data de nascimento:</strong> {patientDetails.birth_date || '-'}</div>
                  </div>
                )
              ) : (
                <div className="text-xs text-muted-foreground">Paciente não vinculado</div>
              )}
              <div className="mt-1 text-xs text-muted-foreground">Para editar os dados do paciente, acesse a ficha do paciente.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-border rounded-md p-6 space-y-4 bg-card">
        <h2 className="font-medium text-foreground">Informações do atendimento</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-[13px]">Nome do profissional *</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input name="professionalName" className="h-11 w-full rounded-md pl-8 pr-12 text-[13px] transition-colors hover:bg-muted/30" value={formData.professionalName || ''} onChange={handleChange} disabled />
          </div>
                </div>
        <div className="space-y-2">
          <Label className="text-[13px]">Data *</Label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input name="appointmentDate" type="date" className="h-11 w-full rounded-md pl-8 pr-3 text-[13px] transition-colors hover:bg-muted/30" value={formData.appointmentDate || ''} onChange={handleChange} />
          </div>
        </div>
                <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                        <Label className="text-[13px]">Início *</Label>
                        <Input name="startTime" type="time" className="h-11 w-full rounded-md px-3 text-[13px] transition-colors hover:bg-muted/30" value={formData.startTime || ''} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[13px]">Término *</Label>
                        <Input name="endTime" type="time" className="h-11 w-full rounded-md px-3 text-[13px] transition-colors hover:bg-muted/30" value={formData.endTime || ''} onChange={handleChange} />
                    </div>
          {/* Profissional solicitante removed per user request */}
                </div>
            </div>
            <div className="space-y-4">
                <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[13px]">Tipo de atendimento *</Label>
                </div>
                <div className="relative mt-1">
                  <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input name="appointmentType" placeholder="Pesquisar" className="h-11 w-full rounded-md pl-8 pr-8 text-[13px] transition-colors hover:bg-muted/30" value={formData.appointmentType || ''} onChange={handleChange} disabled />
                </div>
                                <div className="grid grid-cols-3 gap-3 mt-3">
                                  <div>
                                    <Label className="text-[13px]">Status</Label>
                                    <select name="status" className="h-11 w-full rounded-md border border-gray-300 dark:border-input bg-background text-foreground pr-3 text-[13px]" value={formData.status || ''} onChange={handleChange}>
                                      <option value="">Selecione</option>
                                      <option value="requested">Solicitado</option>
                                      <option value="confirmed">Confirmado</option>
                                      <option value="checked_in">Check-in</option>
                                      <option value="in_progress">Em andamento</option>
                                      <option value="completed">Concluído</option>
                                      <option value="cancelled">Cancelado</option>
                                      <option value="no_show">Não compareceu</option>
                                    </select>
                                  </div>
                                  <div>
                                    <Label className="text-[13px]">Duração (min)</Label>
                                    <Input name="duration_minutes" type="number" min={1} className="h-11 w-full rounded-md" value={formData.duration_minutes ?? ''} onChange={handleChange} />
                                  </div>
                                  <div>
                                    <Label className="text-[13px]">Convênio</Label>
                                    <Input name="insurance_provider" placeholder="Operadora" className="h-11 w-full rounded-md" value={formData.insurance_provider || ''} onChange={handleChange} />
                                  </div>
                                </div>
                </div>
                  <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[13px]">Observações</Label>
                  
                                </div>
                                <Textarea name="notes" rows={4} className="text-[13px] min-h-[80px] resize-none rounded-md transition-colors hover:bg-muted/30" value={formData.notes || ''} onChange={handleChange} />

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                <div>
                                  <Label className="text-[13px]">Queixa principal</Label>
                                  <Textarea name="chief_complaint" rows={3} className="text-[13px] rounded-md" value={formData.chief_complaint || ''} onChange={handleChange} />
                                </div>
                                <div>
                                  <Label className="text-[13px]">Notas do paciente</Label>
                                  <Textarea name="patient_notes" rows={3} className="text-[13px] rounded-md" value={formData.patient_notes || ''} onChange={handleChange} />
                                </div>
                              </div>

                                <div className="grid grid-cols-3 gap-3 mt-3">
                                  <div>
                                    <Label className="text-[13px]">Horário de check-in</Label>
                                    <Input name="checked_in_at" type="datetime-local" className="h-11 w-full rounded-md" value={isoToDatetimeLocal(formData.checked_in_at as any)} onChange={handleChange} />
                                  </div>
                                  <div>
                                    <Label className="text-[13px]">Concluído em</Label>
                                    <Input name="completed_at" type="datetime-local" className="h-11 w-full rounded-md" value={isoToDatetimeLocal(formData.completed_at as any)} onChange={handleChange} />
                                  </div>
                                  <div>
                                    <Label className="text-[13px]">Cancelado em</Label>
                                    <Input name="cancelled_at" type="datetime-local" className="h-11 w-full rounded-md" value={isoToDatetimeLocal(formData.cancelled_at as any)} onChange={handleChange} />
                                  </div>
                                </div>

                              <div className="mt-3">
                                <Label className="text-[13px]">Motivo do cancelamento</Label>
                                <Input name="cancellation_reason" className="h-11 w-full rounded-md" value={formData.cancellation_reason || ''} onChange={handleChange} />
                              </div>
                            </div>
            </div>
        </div>
        </div>

      </form>
    );
  }
