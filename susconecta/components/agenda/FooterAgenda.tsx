"use client";

import { Save } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { useState } from "react";
import Link from "next/link";

export default function FooterAgenda() {
  const [bloqueio, setBloqueio] = useState(false);
  
  return (
    <div className="sticky bottom-0 left-0 right-0 border-t border-border bg-background">
      <div className="mx-auto w-full max-w-7xl px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch checked={bloqueio} onCheckedChange={setBloqueio} />
          <Label className="text-sm text-foreground">Bloqueio de Agenda</Label>
        </div>
        <div className="flex gap-2">
        </div>
      </div>
    </div>
  );
}
