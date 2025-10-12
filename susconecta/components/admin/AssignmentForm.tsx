"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

import { assignRoleToUser, listAssignmentsForPatient, PatientAssignmentRole } from "@/lib/assignment";
import { useAuth } from '@/hooks/useAuth';
import { listarProfissionais } from "@/lib/api";

type Props = {
  patientId: string;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export default function AssignmentForm({ patientId, open, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  // default to Portuguese role values expected by the backend
  const [role, setRole] = useState<PatientAssignmentRole>("medico");
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const pros = await listarProfissionais();
        setProfessionals(pros || []);
      } catch (e) {
        console.warn('Erro ao carregar profissionais', e);
        setProfessionals([]);
      }

      try {
        const a = await listAssignmentsForPatient(patientId);
        setExisting(a || []);
      } catch (e) {
        setExisting([]);
      }
    }

    if (open) load();
  }, [open, patientId]);

  async function handleSave() {
  if (!selectedProfessional) return toast({ title: 'Selecione um profissional', variant: 'default' });
    setLoading(true);
    try {
      await assignRoleToUser({ patient_id: patientId, user_id: String(selectedProfessional), role, created_by: user?.id ?? null });
      toast({ title: 'Atribuição criada', variant: 'default' });
      onSaved && onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Erro ao criar atribuição', description: err?.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Atribuir profissional ao paciente</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div>
            <Label>Profissional</Label>
            <Select onValueChange={(v) => setSelectedProfessional(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um profissional" />
              </SelectTrigger>
              <SelectContent>
                {professionals.map((p) => (
                  // prefer the auth user id (p.user_id) when available; fallback to p.id
                  <SelectItem key={p.id} value={String(p.user_id ?? p.id)}>{p.full_name || p.name || p.email || p.user_id || p.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* role input removed - only professional select remains; role defaults to 'medico' on submit */}

          {existing && existing.length > 0 && (
            <div>
              <Label>Atribuições existentes</Label>
              <ul className="pl-4 list-disc text-sm text-muted-foreground">
                {existing.map((it) => (
                  <li key={it.id}>{it.user_id} — {it.role}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
