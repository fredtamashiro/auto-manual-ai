"use client";

import { FormEvent, useEffect, useState } from "react";
import { LockKeyhole, LogIn, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AuthUser, loginAdmin } from "@/services/api";

type AdminLoginProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onLoggedIn: (user: AuthUser) => void;
};

export function AdminLogin({
  isOpen,
  onOpenChange,
  onLoggedIn,
}: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, isSubmitting, onOpenChange]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const result = await loginAdmin({
        email,
        password,
      });

      setPassword("");
      setErrorMessage("");
      onOpenChange(false);
      onLoggedIn(result.user);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Nao foi possivel fazer login.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/45 px-4 py-8 backdrop-blur-sm"
      onClick={() => {
        if (!isSubmitting) {
          onOpenChange(false);
        }
      }}
    >
      <Card
        className="w-full max-w-md rounded-[28px] border-[#d9dde3] bg-white p-0 shadow-2xl shadow-slate-300/40"
        onClick={(event) => event.stopPropagation()}
      >
        <CardHeader className="border-b border-[#eceff2] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LockKeyhole className="h-5 w-5 text-[#1A1A1A]" />
                Acesso administrativo
              </CardTitle>
              <CardDescription>
                Entre para importar, apagar documentos e acompanhar o processamento.
              </CardDescription>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              aria-label="Fechar modal de login"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@empresa.com"
                autoComplete="username"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Senha
              </label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Sua senha"
                autoComplete="current-password"
                disabled={isSubmitting}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#99FF33] text-[#1A1A1A] hover:brightness-95"
            >
              <LogIn className="h-4 w-4" />
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {errorMessage && (
            <p className="mt-3 text-sm text-red-700">{errorMessage}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
