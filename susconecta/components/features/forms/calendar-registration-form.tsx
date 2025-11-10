
"use client";

import { useState, useEffect, useRef } from "react";
import { buscarPacientePorId, listarMedicos, buscarPacientesPorMedico, getAvailableSlots, buscarPacientes, listarPacientes, listarDisponibilidades, listarExcecoes, listarAgendamentos } from "@/lib/api";
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { listAssignmentsForPatient } from "@/lib/assignment";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Calendar, Search, ChevronDown, X } from "lucide-react";

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
  patientId?: string | null;
  doctorId?: string | null;
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
  createMode?: boolean; // when true, enable fields needed to create a new appointment
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

export function CalendarRegistrationForm({ formData, onFormChange, createMode = false }: CalendarRegistrationFormProperties) {
  const [isAdditionalInfoOpen, setIsAdditionalInfoOpen] = useState(false);
  const [patientDetails, setPatientDetails] = useState<any | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [doctorOptions, setDoctorOptions] = useState<any[]>([]);
  const [filteredDoctorOptions, setFilteredDoctorOptions] = useState<any[] | null>(null);
  const [patientOptions, setPatientOptions] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const searchTimerRef = useRef<any>(null);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingAssignedDoctors, setLoadingAssignedDoctors] = useState(false);
  const [loadingPatientsForDoctor, setLoadingPatientsForDoctor] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<Array<{ datetime: string; available: boolean; slot_minutes?: number }>>([]);
  const [availabilityWindows, setAvailabilityWindows] = useState<Array<{ winStart: Date; winEnd: Date; slotMinutes?: number }>>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [lockedDurationFromSlot, setLockedDurationFromSlot] = useState(false);
  const [exceptionDialogOpen, setExceptionDialogOpen] = useState(false);
  const [exceptionDialogMessage, setExceptionDialogMessage] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set()); // ISO datetimes of already booked appointments

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

  // Load doctor suggestions (simple listing) when the component mounts
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingDoctors(true);
      try {
  // listarMedicos returns a paginated list of doctors; request a reasonable limit
  const docs = await listarMedicos({ limit: 200 });
        if (!mounted) return;
        setDoctorOptions(docs || []);
      } catch (e) {
        console.warn('[CalendarRegistrationForm] falha ao carregar médicos', e);
      } finally {
        if (!mounted) return;
        setLoadingDoctors(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Preload patients so the patient <select> always has options on open
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingPatients(true);
      try {
        // request a reasonable number of patients for the select; adjust limit if needed
        const pats = await listarPacientes({ limit: 200 });
        if (!mounted) return;
        setPatientOptions(pats || []);
      } catch (err) {
        console.warn('[CalendarRegistrationForm] falha ao carregar pacientes', err);
        if (!mounted) return;
        setPatientOptions([]);
      } finally {
        if (!mounted) return;
        setLoadingPatients(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // When a patient is selected, filter doctorOptions to only doctors assigned to that patient
  useEffect(() => {
    const patientId = (formData as any).patientId || (formData as any).patient_id || null;
    if (!patientId) {
      // clear filter when no patient selected
      setFilteredDoctorOptions(null);
      setLoadingAssignedDoctors(false);
      return;
    }

    let mounted = true;
    setLoadingAssignedDoctors(true);
    (async () => {
      try {
        // listAssignmentsForPatient returns rows with user_id (the auth user assigned)
        const assignments = await listAssignmentsForPatient(String(patientId));
        if (!mounted) return;
        const userIds = Array.from(new Set((assignments || []).map((a: any) => a.user_id).filter(Boolean)));

        if (!userIds.length) {
          // no assignments -> fallback to full list but keep a non-null marker
          setFilteredDoctorOptions([]);
          return;
        }

        // Filter already-loaded doctorOptions by matching user_id
        // If doctorOptions isn't loaded yet, we'll wait for it (doctorOptions effect will run first on mount)
        const matched = (doctorOptions || []).filter((d) => userIds.includes(String(d.user_id)));
        if (mounted) setFilteredDoctorOptions(matched);
      } catch (err) {
        console.warn('[CalendarRegistrationForm] falha ao carregar médicos atribuídos ao paciente', err);
        if (mounted) setFilteredDoctorOptions([]);
      } finally {
        if (mounted) setLoadingAssignedDoctors(false);
      }
    })();

    return () => { mounted = false; };
  }, [(formData as any).patientId, (formData as any).patient_id, doctorOptions]);

  // When doctorId changes, load patients assigned to that doctor
  useEffect(() => {
    const docId = (formData as any).doctorId || (formData as any).doctor_id || null;
    if (!docId) {
      setPatientOptions([]);
      return;
    }
    let mounted = true;
    setLoadingPatientsForDoctor(true);
    (async () => {
      try {
        const pats = await buscarPacientesPorMedico(String(docId));
        if (!mounted) return;
        setPatientOptions(pats || []);
      } catch (e) {
        console.warn('[CalendarRegistrationForm] falha ao carregar pacientes por médico', e);
        if (!mounted) return;
        setPatientOptions([]);
      } finally {
        if (!mounted) return;
        setLoadingPatientsForDoctor(false);
      }
    })();
    return () => { mounted = false; };
  }, [(formData as any).doctorId, (formData as any).doctor_id]);

  // When doctor or date changes, fetch available slots
  // Keep a mounted ref to avoid setting state after unmount when reused
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Extract the availability + exceptions logic into a reusable function so we
  // can call it both when dependencies change and once at mount-time when the
  // form already contains doctor/date (covering the edit flow).
  const fetchExceptionsAndSlots = async (docIdArg?: string | null, dateArg?: string | null) => {
    const docId = docIdArg ?? ((formData as any).doctorId || (formData as any).doctor_id || null);
    const date = dateArg ?? ((formData as any).appointmentDate || null);
    if (!docId || !date) {
      if (mountedRef.current) setAvailableSlots([]);
      return;
    }
    if (mountedRef.current) setLoadingSlots(true);

    try {
      // Skip exception checking - all dates are available for admin now
      // NOTE: Exception checking disabled per user request
      
      console.debug('[CalendarRegistrationForm] getAvailableSlots - params', { docId, date, appointmentType: formData.appointmentType });

      // Build local start/end for the day
      let start: Date;
      let end: Date;
      try {
        const parts = String(date).split('-').map((p) => Number(p));
        if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
          const [y, m, d] = parts;
          start = new Date(y, m - 1, d, 0, 0, 0, 0);
          end = new Date(y, m - 1, d, 23, 59, 59, 999);
        } else {
          start = new Date(date);
          start.setHours(0,0,0,0);
          end = new Date(date);
          end.setHours(23,59,59,999);
        }
      } catch (err) {
        start = new Date(date);
        start.setHours(0,0,0,0);
        end = new Date(date);
        end.setHours(23,59,59,999);
      }

      const av = await getAvailableSlots({ doctor_id: String(docId), start_date: start.toISOString(), end_date: end.toISOString(), appointment_type: formData.appointmentType || 'presencial' });
      if (!mountedRef.current) return;
      console.debug('[CalendarRegistrationForm] getAvailableSlots - response slots count', (av && av.slots && av.slots.length) || 0, av);

      // Try to restrict the returned slots to the doctor's public availability windows
      try {
        const disponibilidades = await listarDisponibilidades({ doctorId: String(docId) }).catch(() => []);
        const weekdayNumber = start.getDay();
        const weekdayNames: Record<number, string[]> = {
          0: ['0', 'sun', 'sunday', 'domingo'],
          1: ['1', 'mon', 'monday', 'segunda', 'segunda-feira'],
          2: ['2', 'tue', 'tuesday', 'terca', 'terça', 'terça-feira'],
          3: ['3', 'wed', 'wednesday', 'quarta', 'quarta-feira'],
          4: ['4', 'thu', 'thursday', 'quinta', 'quinta-feira'],
          5: ['5', 'fri', 'friday', 'sexta', 'sexta-feira'],
          6: ['6', 'sat', 'saturday', 'sabado', 'sábado']
        };
        const allowed = (weekdayNames[weekdayNumber] || []).map((s) => String(s).toLowerCase());

        const matched = (disponibilidades || []).filter((d: any) => {
          try {
            const raw = String(d.weekday ?? d.weekday_name ?? d.day ?? d.day_of_week ?? '').toLowerCase();
            if (!raw) return false;
            if (allowed.includes(raw)) return true;
            if (typeof d.weekday === 'number' && d.weekday === weekdayNumber) return true;
            if (typeof d.day_of_week === 'number' && d.day_of_week === weekdayNumber) return true;
            return false;
          } catch (e) { return false; }
        });

        if (matched && matched.length) {
          const windows = matched.map((d: any) => {
            const parseTime = (t?: string) => {
              if (!t) return { hh: 0, mm: 0, ss: 0 };
              const parts = String(t).split(':').map((p) => Number(p));
              return { hh: parts[0] || 0, mm: parts[1] || 0, ss: parts[2] || 0 };
            };
            const s = parseTime(d.start_time);
            const e2 = parseTime(d.end_time);
            const winStart = new Date(start.getFullYear(), start.getMonth(), start.getDate(), s.hh, s.mm, s.ss || 0, 0);
            const winEnd = new Date(start.getFullYear(), start.getMonth(), start.getDate(), e2.hh, e2.mm, e2.ss || 0, 999);
            const slotMinutes = (() => { const n = Number(d.slot_minutes ?? d.slot_minutes_minutes ?? NaN); return Number.isFinite(n) ? n : undefined; })();
            return { winStart, winEnd, slotMinutes };
          });

          try {
            // persist windows so UI can apply duration-fit filtering
            if (mountedRef.current) setAvailabilityWindows(windows);
            const candidate = windows.find((w: any) => w.slotMinutes && Number.isFinite(Number(w.slotMinutes)));
            if (candidate) {
              const durationVal = Number(candidate.slotMinutes);
              if ((formData as any).duration_minutes !== durationVal) {
                onFormChange({ ...formData, duration_minutes: durationVal });
              }
              try { setLockedDurationFromSlot(true); } catch (e) {}
            } else {
              try { setLockedDurationFromSlot(false); } catch (e) {}
            }
          } catch (e) {
            console.debug('[CalendarRegistrationForm] erro ao definir duração automática', e);
          }

          const existingInWindow = (av.slots || []).filter((s: any) => {
            try {
              const sd = new Date(s.datetime);
              const slotMinutes = sd.getHours() * 60 + sd.getMinutes();
              return windows.some((w: any) => {
                const ws = w.winStart;
                const we = w.winEnd;
                const winStartMinutes = ws.getHours() * 60 + ws.getMinutes();
                const winEndMinutes = we.getHours() * 60 + we.getMinutes();
                return slotMinutes >= winStartMinutes && slotMinutes <= winEndMinutes;
              });
            } catch (e) { return false; }
          });

          let stepMinutes = 30;
          try {
            const times = (av.slots || []).map((s: any) => new Date(s.datetime).getTime()).sort((a: number, b: number) => a - b);
            const diffs: number[] = [];
            for (let i = 1; i < times.length; i++) {
              const d = Math.round((times[i] - times[i - 1]) / 60000);
              if (d > 0) diffs.push(d);
            }
            if (diffs.length) stepMinutes = Math.min(...diffs);
          } catch (e) {}

          const generatedSet = new Set<string>();
          windows.forEach((w: any) => {
            try {
              const perWindowStep = Number(w.slotMinutes) || stepMinutes;
              const startMs = w.winStart.getTime();
              const endMs = w.winEnd.getTime();
              const lastStartMs = endMs - perWindowStep * 60000;
              const backendSlotsInWindow = (av.slots || []).filter((s: any) => {
                try {
                  const sd = new Date(s.datetime);
                  const sm = sd.getHours() * 60 + sd.getMinutes();
                  const wmStart = w.winStart.getHours() * 60 + w.winStart.getMinutes();
                  const wmEnd = w.winEnd.getHours() * 60 + w.winEnd.getMinutes();
                  return sm >= wmStart && sm <= wmEnd;
                } catch (e) { return false; }
              }).map((s: any) => new Date(s.datetime).getTime()).sort((a: number, b: number) => a - b);

              if (!backendSlotsInWindow.length) {
                let cursorMs = startMs;
                while (cursorMs <= lastStartMs) {
                  generatedSet.add(new Date(cursorMs).toISOString());
                  cursorMs += perWindowStep * 60000;
                }
              } else {
                const lastBackendMs = backendSlotsInWindow[backendSlotsInWindow.length - 1];
                let cursorMs = lastBackendMs + perWindowStep * 60000;
                while (cursorMs <= lastStartMs) {
                  generatedSet.add(new Date(cursorMs).toISOString());
                  cursorMs += perWindowStep * 60000;
                }
              }
            } catch (e) {}
          });

          const mergedMap = new Map<string, { datetime: string; available: boolean; slot_minutes?: number }>();
          const findWindowSlotMinutes = (isoDt: string) => {
            try {
              const sd = new Date(isoDt);
              const sm = sd.getHours() * 60 + sd.getMinutes();
              const w = windows.find((win: any) => {
                const ws = win.winStart;
                const we = win.winEnd;
                const winStartMinutes = ws.getHours() * 60 + ws.getMinutes();
                const winEndMinutes = we.getHours() * 60 + we.getMinutes();
                return sm >= winStartMinutes && sm <= winEndMinutes;
              });
              return w && w.slotMinutes ? Number(w.slotMinutes) : null;
            } catch (e) { return null; }
          };

          (existingInWindow || []).forEach((s: any) => {
            const sm = findWindowSlotMinutes(s.datetime);
            mergedMap.set(s.datetime, sm ? { ...s, slot_minutes: sm } : { ...s });
          });
          Array.from(generatedSet).forEach((dt) => {
            if (!mergedMap.has(dt)) {
              const sm = findWindowSlotMinutes(dt) || stepMinutes;
              mergedMap.set(dt, { datetime: dt, available: true, slot_minutes: sm });
            }
          });

          const merged = Array.from(mergedMap.values()).sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
          if (mountedRef.current) setAvailableSlots(merged || []);
        } else {
          if (mountedRef.current) {
            setAvailabilityWindows([]);
            setAvailableSlots(av.slots || []);
          }
        }
      } catch (e) {
        console.warn('[CalendarRegistrationForm] erro ao filtrar por disponibilidades públicas', e);
        if (mountedRef.current) setAvailableSlots(av.slots || []);
      }
    } catch (e) {
      console.warn('[CalendarRegistrationForm] falha ao carregar horários disponíveis', e);
      if (mountedRef.current) setAvailableSlots([]);
    } finally {
      if (mountedRef.current) setLoadingSlots(false);
    }
  };

  // Call when doctor/date/appointmentType change
  useEffect(() => {
    fetchExceptionsAndSlots();
    // note: we intentionally keep the same dependency list to preserve existing behaviour
  }, [(formData as any).doctorId, (formData as any).doctor_id, (formData as any).appointmentDate, (formData as any).appointmentType]);

  // Also attempt a mount-time call to cover the case where the form is mounted
  // with doctor/date already present (edit flow). This ensures parity with
  // the create flow which triggers the requests during user interaction.
  useEffect(() => {
    const docId = (formData as any).doctorId || (formData as any).doctor_id || null;
    const date = (formData as any).appointmentDate || null;
    console.debug('[CalendarRegistrationForm] mount-time check formData doctor/date', { doctorId: docId, doctor_id: (formData as any).doctor_id, appointmentDate: date, sampleFormData: formData });
    const profName = (formData as any).professionalName || (formData as any).professional || '';
    // If we don't have an id but have a professional name, try to find the id from loaded options
    if (!docId && profName && doctorOptions && doctorOptions.length) {
      const found = doctorOptions.find((d: any) => {
        const name = (d.full_name || d.name || '').toLowerCase();
        return name && profName.toLowerCase() && (name === profName.toLowerCase() || name.includes(profName.toLowerCase()));
      });
      if (found) {
        // set doctorId on form so the normal effect will run
        try { onFormChange({ ...formData, doctorId: String(found.id) }); } catch (e) {}
        // Also proactively fetch availability using the discovered id
        if (date) {
          Promise.resolve().then(() => { if (mountedRef.current) fetchExceptionsAndSlots(String(found.id), date); });
        } else {
          Promise.resolve().then(() => { if (mountedRef.current) fetchExceptionsAndSlots(String(found.id)); });
        }
      }
    }

    if ((docId || ((doctorOptions || []).find((d: any) => (d.full_name || d.name || '').toLowerCase().includes(((formData as any).professionalName || '').toLowerCase())))) && date) {
      // schedule microtask so mount effects ordering won't conflict with parent
      Promise.resolve().then(() => {
        if (mountedRef.current) fetchExceptionsAndSlots();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load already booked appointments for the selected doctor and date to prevent double-booking
  useEffect(() => {
    const docId = (formData as any).doctorId || (formData as any).doctor_id || null;
    const date = (formData as any).appointmentDate || null;
    
    if (!docId || !date) {
      setBookedSlots(new Set());
      return;
    }

    let mounted = true;
    (async () => {
      try {
        // Query appointments for this doctor on the selected date
        // Format: YYYY-MM-DD
        const [y, m, d] = String(date).split('-').map(n => Number(n));
        const dateStart = new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
        const dateEnd = new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
        
        const query = `doctor_id=eq.${docId}&scheduled_at=gte.${dateStart}&scheduled_at=lte.${dateEnd}&select=scheduled_at`;
        const appointments = await listarAgendamentos(query).catch(() => []);
        
        if (!mounted) return;
        
        // Extract booked datetime slots - store as HH:MM format for easier comparison
        const booked = new Set<string>();
        (appointments || []).forEach((appt: any) => {
          if (appt && appt.scheduled_at) {
            try {
              const dt = new Date(appt.scheduled_at);
              const hh = String(dt.getHours()).padStart(2, '0');
              const mm = String(dt.getMinutes()).padStart(2, '0');
              const timeKey = `${hh}:${mm}`;
              booked.add(timeKey);
              console.debug('[CalendarRegistrationForm] booked time:', timeKey, 'from', appt.scheduled_at);
            } catch (e) {
              console.warn('[CalendarRegistrationForm] erro parsing scheduled_at', appt.scheduled_at, e);
            }
          }
        });
        
        if (mounted) {
          setBookedSlots(booked);
          console.debug('[CalendarRegistrationForm] total booked slots:', booked.size, 'slots:', Array.from(booked));
        }
      } catch (e) {
        console.warn('[CalendarRegistrationForm] erro ao carregar agendamentos existentes', e);
        if (mounted) setBookedSlots(new Set());
      }
    })();
    
    return () => { mounted = false; };
  }, [(formData as any).doctorId, (formData as any).doctor_id, (formData as any).appointmentDate]);

  // Filter available slots: if date is today, only show future times, AND remove already booked slots
  const filteredAvailableSlots = (() => {
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const selectedDateStr = (formData as any).appointmentDate || null;
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeInMinutes = currentHours * 60 + currentMinutes;

      let filtered = availableSlots || [];

      if (selectedDateStr === todayStr) {
        // Today: filter out past times (add 30-minute buffer for admin to schedule)
        filtered = (availableSlots || []).filter((s) => {
          try {
            const slotDate = new Date(s.datetime);
            const slotHours = slotDate.getHours();
            const slotMinutes = slotDate.getMinutes();
            const slotTimeInMinutes = slotHours * 60 + slotMinutes;
            // Keep slots that are at least 30 minutes in the future
            return slotTimeInMinutes >= currentTimeInMinutes + 30;
          } catch (e) {
            return true;
          }
        });
      } else if (selectedDateStr && selectedDateStr > todayStr) {
        // Future date: show all slots
        filtered = availableSlots || [];
      } else {
        // Past date: no slots
        return [];
      }
      
      // Remove already booked slots - compare by HH:MM format
      return filtered.filter((s) => {
        try {
          const dt = new Date(s.datetime);
          const hh = String(dt.getHours()).padStart(2, '0');
          const mm = String(dt.getMinutes()).padStart(2, '0');
          const timeKey = `${hh}:${mm}`;
          const isBooked = bookedSlots.has(timeKey);
          if (isBooked) {
            console.debug('[CalendarRegistrationForm] filtering out booked slot:', timeKey);
          }
          return !isBooked;
        } catch (e) {
          console.warn('[CalendarRegistrationForm] erro filtering booked slot', e);
          return true;
        }
      });
    } catch (e) {
      return availableSlots || [];
    }
  })();

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

    // if selecting a patientId from the select, also populate patientName
    if (name === 'patientId') {
      // event.target is a select; get the selected option text
      const sel = event.target as HTMLSelectElement;
      const selectedText = sel.options[sel.selectedIndex]?.text ?? '';
      onFormChange({ ...formData, patientId: value || null, patientName: selectedText });
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

  // derive the doctor options to show based on selected patient (inverse lookup)
  const patientSelected = (formData as any).patientId || (formData as any).patient_id;
  let effectiveDoctorOptions = doctorOptions || [];
  if (patientSelected) {
    if (filteredDoctorOptions && filteredDoctorOptions.length) effectiveDoctorOptions = filteredDoctorOptions;
    else effectiveDoctorOptions = doctorOptions || [];
  }

  // derive displayed slots by filtering availableSlots to those that can fit the
  // desired duration within any availability window. If no windows are present,
  // fall back to availableSlots as-is.
  const displayedSlots = (() => {
    try {
      const duration = Number((formData as any).duration_minutes) || 0;
      if (!availabilityWindows || !availabilityWindows.length) return availableSlots || [];
      // For each slot, check whether slot start + duration <= window.winEnd
      return (availableSlots || []).filter((s) => {
        try {
          const sd = new Date(s.datetime);
          const slotStartMs = sd.getTime();
          const slotEndMs = slotStartMs + (duration || (s.slot_minutes || 0)) * 60000;
          // find a window that contains the entire appointment (start..end)
          return availabilityWindows.some((w) => {
            return slotStartMs >= w.winStart.getTime() && slotEndMs <= w.winEnd.getTime();
          });
        } catch (e) { return false; }
      });
    } catch (e) {
      return availableSlots || [];
    }
  })();

  // Ensure the currently-selected startTime (from formData) is present in the list
  // so that editing an existing appointment can keep its original time even if
  // the server availability doesn't return it (historic booking).
  try {
    const date = (formData as any).appointmentDate;
    const start = (formData as any).startTime;
    if (date && start) {
      const [y, m, d] = String(date).split('-').map((n) => Number(n));
      const [hh, mm] = String(start).split(':').map((n) => Number(n));
      if (![y, m, d, hh, mm].some((n) => Number.isNaN(n))) {
        const iso = new Date(y, m - 1, d, hh, mm, 0, 0).toISOString();
        const present = (displayedSlots || []).some((s) => s.datetime === iso);
        if (!present) {
          // find in availableSlots if exists to copy slot_minutes, else synthesize
          const found = (availableSlots || []).find((s) => {
            try { return new Date(s.datetime).toISOString() === iso; } catch (e) { return false; }
          });
          const toAdd = found ? { ...found } : { datetime: iso, available: false, slot_minutes: (formData as any).duration_minutes || undefined };
          // prepend so current appointment time appears first
          displayedSlots.unshift(toAdd as any);
        }
      }
    }
  } catch (e) {}


  // ref to the appointment date input
  const appointmentDateRef = useRef<HTMLInputElement | null>(null);

  return (
    <form className="space-y-8">
      {/* Exception dialog shown when a blocking exception exists for selected date */}
      <AlertDialog open={exceptionDialogOpen} onOpenChange={(open) => { if (!open) { setExceptionDialogOpen(false); setExceptionDialogMessage(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Data indisponível</AlertDialogTitle>
            <AlertDialogDescription>
              {exceptionDialogMessage ?? 'Não será possível agendar uma consulta nesta data/horário.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setExceptionDialogOpen(false); setExceptionDialogMessage(null); }}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="border border-border rounded-md p-6 space-y-4 bg-card">
        <h2 className="font-medium text-foreground">Informações do paciente</h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6 space-y-2">
            <Label className="text-[13px]">Nome</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              {createMode ? (
                <div className="flex items-center gap-2">
                <Select
                  value={(formData as any).patientId || (formData as any).patient_id || ''}
                  onValueChange={(value) => {
                    const val = value || null;
                    const selected = (patientOptions || []).find((p) => p.id === val) || null;
                    onFormChange({ ...formData, patientId: val, patientName: selected ? (selected.full_name || selected.id) : '' });
                  }}
                >
                  <SelectTrigger className="h-11 w-full rounded-md pl-8 text-[13px]">
                    <SelectValue placeholder="Selecione um paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingPatients || loadingPatientsForDoctor ? (
                      <SelectItem value="__loading_patients__" disabled>Carregando pacientes...</SelectItem>
                    ) : (
                      (patientOptions || []).map((p) => (
                        <SelectItem key={p.id} value={p.id}>{(p.full_name || p.nome || p.id) + (p.cpf ? ` - CPF: ${p.cpf}` : '')}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {((formData as any).patientId || (formData as any).patient_id) && (
                  <button
                    type="button"
                    title="Limpar seleção"
                    className="h-10 w-10 flex items-center justify-center rounded-md bg-muted/10 text-foreground/90"
                    onClick={async () => {
                      try {
                        // clear patient selection and also clear doctor/date/time and slots
                        setFilteredDoctorOptions(null);
                        setAvailableSlots([]);
                        const newData: any = { ...formData };
                        newData.patientId = null;
                        newData.patientName = '';
                        newData.doctorId = null;
                        newData.professionalName = '';
                        newData.appointmentDate = null;
                        newData.startTime = '';
                        newData.endTime = '';
                        // update form first so dependent effects (doctor->patients) run
                        onFormChange(newData);
                        // then repopulate the patientOptions (fetch may be async)
                        const pats = await listarPacientes({ limit: 200 }).catch(() => []);
                        setPatientOptions(pats || []);
                      } catch (e) {}
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
                </div>
              ) : (
                <Input
                  name="patientName"
                  placeholder="Nome do paciente"
                  className="h-11 pl-8 rounded-md transition-colors bg-muted/10"
                  value={formData.patientName || ''}
                  disabled
                />
              )}
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
              {createMode ? (
                <div className="flex items-center gap-2">
                <Select
                  value={(formData as any).doctorId || (formData as any).doctor_id || ''}
                  onValueChange={(value) => {
                    // synthesize a change event compatible with existing handler
                    const fake = { target: { name: 'doctorId', value } } as unknown as React.ChangeEvent<HTMLSelectElement>;
                    handleChange(fake);
                  }}
                >
                  <SelectTrigger className="h-11 w-full rounded-md pl-8 text-[13px]">
                    <SelectValue placeholder="Selecione um médico" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingAssignedDoctors ? (
                      <SelectItem value="__loading_doctors__" disabled>Carregando médicos atribuídos...</SelectItem>
                    ) : (
                      (effectiveDoctorOptions || []).map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.full_name || d.name || d.id}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {((formData as any).doctorId || (formData as any).doctor_id) && (
                  <button
                    type="button"
                    title="Limpar seleção"
                    className="h-10 w-10 flex items-center justify-center rounded-md bg-muted/10 text-foreground/90"
                    onClick={async () => {
                      try {
                        // clear doctor selection and also clear patient/date/time and slots
                        setAvailableSlots([]);
                        setFilteredDoctorOptions(null);
                        const newData2: any = { ...formData };
                        newData2.doctorId = null;
                        newData2.professionalName = '';
                        newData2.patientId = null;
                        newData2.patientName = '';
                        newData2.appointmentDate = null;
                        newData2.startTime = '';
                        newData2.endTime = '';
                        // update form first so effects that clear options don't erase our repopulation
                        onFormChange(newData2);
                        // then repopulate patients list
                        const pats = await listarPacientes({ limit: 200 }).catch(() => []);
                        setPatientOptions(pats || []);
                      } catch (e) {}
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
                </div>
              ) : (
                <Input name="professionalName" className="h-11 w-full rounded-md pl-8 pr-12 text-[13px] transition-colors hover:bg-muted/30" value={formData.professionalName || ''} disabled />
              )}
            </div>
                  </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-[13px]">Data *</Label>
            <button
              type="button"
              aria-label="Abrir seletor de data"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <Calendar className="h-4 w-4" />
            </button>
          </div>
          <div className="relative">
            <Input 
              ref={appointmentDateRef as any} 
              name="appointmentDate" 
              type="text"
              placeholder="DD/MM/AAAA"
              className="h-11 w-full rounded-md pl-3 pr-3 text-[13px] transition-colors hover:bg-muted/30" 
              value={formData.appointmentDate ? (() => {
                try {
                  const [y, m, d] = String(formData.appointmentDate).split('-');
                  return `${d}/${m}/${y}`;
                } catch (e) {
                  return '';
                }
              })() : ''} 
              readOnly
            />
            {showDatePicker && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-md shadow-lg p-3">
                <CalendarComponent
                  mode="single"
                  selected={formData.appointmentDate ? (() => {
                    try {
                      const [y, m, d] = String(formData.appointmentDate).split('-').map(Number);
                      return new Date(y, m - 1, d);
                    } catch (e) {
                      return undefined;
                    }
                  })() : undefined}
                  onSelect={(date) => {
                    if (date) {
                      const y = date.getFullYear();
                      const m = String(date.getMonth() + 1).padStart(2, '0');
                      const d = String(date.getDate()).padStart(2, '0');
                      const dateStr = `${y}-${m}-${d}`;
                      onFormChange({ ...formData, appointmentDate: dateStr });
                      setShowDatePicker(false);
                    }
                  }}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                />
              </div>
            )}
          </div>
        </div>
                <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                        <Label className="text-[13px]">Início *</Label>
                        {createMode ? (
                          <Select
                            value={((): string => {
                              // try to find a matching slot ISO for the current formData appointmentDate + startTime
                              try {
                                const date = (formData as any).appointmentDate || '';
                                const time = (formData as any).startTime || '';
                                if (!date || !time) return '';
                                const match = (availableSlots || []).find((s) => {
                                  try {
                                    const d = new Date(s.datetime);
                                    const hh = String(d.getHours()).padStart(2, '0');
                                    const mm = String(d.getMinutes()).padStart(2, '0');
                                    const dateOnly = d.toISOString().split('T')[0];
                                    return dateOnly === date && `${hh}:${mm}` === time;
                                  } catch (e) {
                                    return false;
                                  }
                                });
                                return match ? match.datetime : '';
                              } catch (e) { return ''; }
                            })()
                            }
                            onValueChange={(value) => {
                              // value is the slot ISO datetime
                              try {
                                const dt = new Date(value);
                                if (isNaN(dt.getTime())) {
                                  // clear
                                  onFormChange({ ...formData, appointmentDate: (formData as any).appointmentDate || null, startTime: '' });
                                  return;
                                }
                                const hh = String(dt.getHours()).padStart(2, '0');
                                const mm = String(dt.getMinutes()).padStart(2, '0');
                                const dateOnly = dt.toISOString().split('T')[0];
                                // set duration from slot if available
                                const sel = (availableSlots || []).find((s) => s.datetime === value) as any;
                                const slotMinutes = sel && sel.slot_minutes ? Number(sel.slot_minutes) : null;
                                // compute endTime from duration (slotMinutes or existing duration)
                                const durationForCalc = slotMinutes || (formData as any).duration_minutes || 0;
                                const endDt = new Date(dt.getTime() + Number(durationForCalc) * 60000);
                                const endH = String(endDt.getHours()).padStart(2, '0');
                                const endM = String(endDt.getMinutes()).padStart(2, '0');
                                const endStr = `${endH}:${endM}`;
                                if (slotMinutes) {
                                  onFormChange({ ...formData, appointmentDate: dateOnly, startTime: `${hh}:${mm}`, duration_minutes: slotMinutes, endTime: endStr });
                                  try { setLockedDurationFromSlot(true); } catch (e) {}
                                  try { (lastAutoEndRef as any).current = endStr; } catch (e) {}
                                } else {
                                  onFormChange({ ...formData, appointmentDate: dateOnly, startTime: `${hh}:${mm}`, endTime: endStr });
                                  try { (lastAutoEndRef as any).current = endStr; } catch (e) {}
                                }
                              } catch (e) {
                                // noop
                              }
                            }}
                          >
                            <SelectTrigger className="h-11 w-full rounded-md pl-3 text-[13px]">
                              <SelectValue placeholder="--:--" />
                            </SelectTrigger>
                            <SelectContent>
                              {loadingSlots ? (
                                <SelectItem value="__loading_slots__" disabled>Carregando horários...</SelectItem>
                              ) : (availableSlots && availableSlots.length ? (
                                (availableSlots || []).map((s) => {
                                  const d = new Date(s.datetime);
                                  const hh = String(d.getHours()).padStart(2, '0');
                                  const mm = String(d.getMinutes()).padStart(2, '0');
                                  const label = `${hh}:${mm}`;
                                  return <SelectItem key={s.datetime} value={s.datetime}>{label}</SelectItem>;
                                })
                              ) : (
                                <SelectItem value="__no_slots__" disabled>Nenhum horário disponível</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input name="startTime" type="time" className="h-11 w-full rounded-md px-3 text-[13px] transition-colors hover:bg-muted/30" value={formData.startTime || ''} onChange={handleChange} />
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[13px]">Término *</Label>
                        {/*
                          When creating a new appointment from a predefined slot, the end time
                          is derived from the slot's start + duration and therefore cannot be
                          edited. We disable/readOnly the input in create mode when either a
                          slot is selected (startTime corresponds to an availableSlots entry)
                          or the duration was locked from a slot (lockedDurationFromSlot).
                        */}
                        <Input
                          name="endTime"
                          type="time"
                          className="h-11 w-full rounded-md px-3 text-[13px] transition-colors hover:bg-muted/30"
                          value={formData.endTime || ''}
                          onChange={handleChange}
                          readOnly={createMode && (lockedDurationFromSlot || Boolean(((): boolean => {
                            try {
                              const date = (formData as any).appointmentDate || '';
                              const time = (formData as any).startTime || '';
                              if (!date || !time) return false;
                              // Check if startTime matches one of the availableSlots (meaning slot-driven)
                              return (availableSlots || []).some((s) => {
                                try {
                                  const d = new Date(s.datetime);
                                  const hh = String(d.getHours()).padStart(2, '0');
                                  const mm = String(d.getMinutes()).padStart(2, '0');
                                  const dateOnly = d.toISOString().split('T')[0];
                                  return dateOnly === date && `${hh}:${mm}` === time;
                                } catch (e) { return false; }
                              });
                            } catch (e) { return false; }
                          })()))}
                          disabled={createMode && (lockedDurationFromSlot || Boolean(((): boolean => {
                            try {
                              const date = (formData as any).appointmentDate || '';
                              const time = (formData as any).startTime || '';
                              if (!date || !time) return false;
                              return (availableSlots || []).some((s) => {
                                try {
                                  const d = new Date(s.datetime);
                                  const hh = String(d.getHours()).padStart(2, '0');
                                  const mm = String(d.getMinutes()).padStart(2, '0');
                                  const dateOnly = d.toISOString().split('T')[0];
                                  return dateOnly === date && `${hh}:${mm}` === time;
                                } catch (e) { return false; }
                              });
                            } catch (e) { return false; }
                          })()))}
                        />
                    </div>
          {/* Profissional solicitante removed per user request */}
                </div>
                {/* Available slots area (createMode only) */}
                {createMode && (
                  <div className="mt-3">
                    <Label className="text-[13px]">Horários disponíveis</Label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {loadingSlots ? (
                        <div className="col-span-3">Carregando horários...</div>
                      ) : filteredAvailableSlots && filteredAvailableSlots.length ? (
                        filteredAvailableSlots.map((s) => {
                          const dt = new Date(s.datetime);
                          const hh = String(dt.getHours()).padStart(2, '0');
                          const mm = String(dt.getMinutes()).padStart(2, '0');
                          const label = `${hh}:${mm}`;
                          return (
                            <button
                              key={s.datetime}
                              type="button"
                              className={`h-10 rounded-md border ${formData.startTime === `${hh}:${mm}` ? 'bg-blue-600 text-white' : 'bg-background'}`}
                              onClick={() => {
                                // when selecting a slot, set appointmentDate (if missing) and startTime and duration
                                const isoDate = dt.toISOString();
                                const dateOnly = isoDate.split('T')[0];
                                const slotMinutes = s.slot_minutes || null;
                                  // compute endTime based on duration
                                  const durationForCalc = slotMinutes || (formData as any).duration_minutes || 0;
                                  const endDt = new Date(dt.getTime() + Number(durationForCalc) * 60000);
                                  const endH = String(endDt.getHours()).padStart(2, '0');
                                  const endM = String(endDt.getMinutes()).padStart(2, '0');
                                  const endStr = `${endH}:${endM}`;
                                  if (slotMinutes) {
                                    onFormChange({ ...formData, appointmentDate: dateOnly, startTime: `${hh}:${mm}`, duration_minutes: Number(slotMinutes), endTime: endStr });
                                    try { setLockedDurationFromSlot(true); } catch (e) {}
                                    try { (lastAutoEndRef as any).current = endStr; } catch (e) {}
                                  } else {
                                    onFormChange({ ...formData, appointmentDate: dateOnly, startTime: `${hh}:${mm}`, endTime: endStr });
                                    try { (lastAutoEndRef as any).current = endStr; } catch (e) {}
                                  }
                              }}
                            >
                              {label}
                            </button>
                          );
                        })
                      ) : (
                        <div className="col-span-3 text-sm text-muted-foreground">Nenhum horário disponível para o médico nesta data.</div>
                      )}
                    </div>
                  </div>
                )}
            </div>
            <div className="space-y-4">
                <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[13px]">Tipo de atendimento *</Label>
                </div>
                <div className="relative mt-1">
                  {/* Non-searchable select with allowed values only */}
                  <Select
                    value={(formData as any).appointmentType || (formData as any).appointment_type || ''}
                    onValueChange={(value) => {
                      try {
                        const newData: any = { ...formData, appointmentType: value };
                        newData.appointment_type = value;
                        onFormChange(newData);
                      } catch (e) {}
                    }}
                  >
                    <SelectTrigger className="h-11 w-full rounded-md pl-3 text-[13px]">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="telemedicina">Telemedicina</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                                <div className="grid grid-cols-3 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-[13px]">Status</Label>
                                    <select name="status" className="h-11 w-full rounded-md border border-gray-300 dark:border-input bg-background text-foreground pr-3 text-[13px]" value="confirmed" onChange={handleChange} disabled>
                                      <option value="confirmed">Confirmado</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[13px]">Duração (min)</Label>
                                      <Input name="duration_minutes" type="number" min={1} className="h-11 w-full rounded-md" value={formData.duration_minutes ?? ''} onChange={handleChange} readOnly={lockedDurationFromSlot} disabled={lockedDurationFromSlot} />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[13px]">Convênio</Label>
                                    <Input name="insurance_provider" placeholder="Operadora" className="h-11 w-full rounded-md" value={formData.insurance_provider || ''} onChange={handleChange} />
                                  </div>
                                </div>
                </div>
                  <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[13px]">Observações</Label>
                  
                                </div>
                                <Textarea name="notes" rows={4} className="text-[13px] min-h-[80px] resize-none rounded-md transition-colors hover:bg-muted/30" value={formData.notes || ''} onChange={handleChange} />

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="space-y-1">
                                  <Label className="text-[13px]">Queixa principal</Label>
                                  <Textarea name="chief_complaint" rows={3} className="text-[13px] rounded-md" value={formData.chief_complaint || ''} onChange={handleChange} />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[13px]">Notas do paciente</Label>
                                  <Textarea name="patient_notes" rows={3} className="text-[13px] rounded-md" value={formData.patient_notes || ''} onChange={handleChange} />
                                </div>
                              </div>

                                <div className="grid grid-cols-3 gap-3 mt-4">
                                  <div className="space-y-1">
                                    <Label className="text-[13px]">Horário de check-in</Label>
                                    <Input name="checked_in_at" type="datetime-local" className="h-11 w-full rounded-md" value={isoToDatetimeLocal(formData.checked_in_at as any)} onChange={handleChange} />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[13px]">Concluído em</Label>
                                    <Input name="completed_at" type="datetime-local" className="h-11 w-full rounded-md" value={isoToDatetimeLocal(formData.completed_at as any)} onChange={handleChange} />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[13px]">Cancelado em</Label>
                                    <Input name="cancelled_at" type="datetime-local" className="h-11 w-full rounded-md" value={isoToDatetimeLocal(formData.cancelled_at as any)} onChange={handleChange} />
                                  </div>
                                </div>

                              <div className="mt-4 space-y-1">
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
