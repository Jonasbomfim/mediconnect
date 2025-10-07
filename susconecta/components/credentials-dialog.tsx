"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Copy, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface CredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  password: string;
  userName: string;
  userType: "médico" | "paciente";
}

export function CredentialsDialog({
  open,
  onOpenChange,
  email,
  password,
  userName,
  userType,
}: CredentialsDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  function handleCopyEmail() {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  }

  function handleCopyPassword() {
    navigator.clipboard.writeText(password);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  }

  function handleCopyBoth() {
    const text = `Email: ${email}\nSenha: ${password}`;
    navigator.clipboard.writeText(text);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            {userType === "médico" ? "Médico" : "Paciente"} Cadastrado com Sucesso!
          </DialogTitle>
          <DialogDescription>
            O {userType} <strong>{userName}</strong> foi cadastrado e pode fazer login com as credenciais abaixo.
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-amber-50 border-amber-200">
          <AlertDescription className="text-amber-900">
            <strong>Importante:</strong> Anote ou copie estas credenciais agora. Por segurança, essa senha não será exibida novamente.
          </AlertDescription>
        </Alert>

        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-blue-900">
            <strong>📧 Confirme o email:</strong> Um email de confirmação foi enviado para <strong>{email}</strong>. 
            O {userType} deve clicar no link de confirmação antes de fazer o primeiro login.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email de Acesso</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                value={email}
                readOnly
                className="bg-muted"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyEmail}
                title="Copiar email"
              >
                {copiedEmail ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha Temporária</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  readOnly
                  className="bg-muted pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyPassword}
                title="Copiar senha"
              >
                {copiedPassword ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-900">
          <strong>Próximos passos:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Compartilhe estas credenciais com o {userType}</li>
            <li>
              <strong className="text-blue-700">O {userType} deve confirmar o email</strong> clicando no link enviado para{" "}
              <strong>{email}</strong> (verifique também a pasta de spam)
            </li>
            <li>
              Após confirmar o email, o {userType} deve acessar:{" "}
              <code className="bg-blue-100 px-1 py-0.5 rounded text-xs font-mono">
                {userType === "médico" ? "/login" : "/login-paciente"}
              </code>
            </li>
            <li>
              Após o login, terá acesso à área:{" "}
              <code className="bg-blue-100 px-1 py-0.5 rounded text-xs font-mono">
                {userType === "médico" ? "/profissional" : "/paciente"}
              </code>
            </li>
            <li>Recomende trocar a senha no primeiro acesso</li>
          </ol>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCopyBoth}
            className="w-full sm:w-auto"
          >
            <Copy className="mr-2 h-4 w-4" />
            Copiar Tudo
          </Button>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
