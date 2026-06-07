"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Database, ShieldCheck, Workflow } from "lucide-react";

import { AdminLogin } from "@/components/admin-login";
import { DocumentsPanel } from "@/components/documents-panel";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { AuthUser, getCurrentAdmin, logoutAdmin } from "@/services/api";

export default function Home() {
  const [adminUser, setAdminUser] = useState<AuthUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [authErrorMessage, setAuthErrorMessage] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    async function loadCurrentAdmin() {
      try {
        setIsCheckingSession(true);
        const user = await getCurrentAdmin();
        setAdminUser(user);
        setAuthErrorMessage("");
      } catch {
        setAdminUser(null);
      } finally {
        setIsCheckingSession(false);
      }
    }

    void loadCurrentAdmin();
  }, []);

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await logoutAdmin();
      setAdminUser(null);
      setAuthErrorMessage("");
    } catch (error) {
      setAuthErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel encerrar a sessao.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <>
      <SiteHeader
        adminUser={adminUser}
        isCheckingSession={isCheckingSession}
        isLoggingOut={isLoggingOut}
        onLoginClick={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      <AdminLogin
        isOpen={isLoginModalOpen}
        onOpenChange={setIsLoginModalOpen}
        onLoggedIn={(user) => {
          setAdminUser(user);
          setAuthErrorMessage("");
        }}
      />

      <main className="min-h-screen bg-[#fafafa] pt-28 text-[#1A1A1A]">
        <section id="home" className="scroll-mt-28 bg-[#fafafa] px-6 py-10">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <span className="inline-flex rounded-full border border-[#cfeea6] bg-[#efffdd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#1A1A1A]">
                IA aplicada a documentos
              </span>
              <h1 className="heading-1 mt-5 max-w-3xl text-[#1A1A1A]">
                Consulta inteligente de PDFs com ingestao assincrona, embeddings
                e respostas com fontes.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#666666]">
                O SmartDocs AI transforma documentos em uma base consultavel com
                enriquecimento semantico, busca vetorial, rate limit e trilha de
                auditoria pronta para evoluir para um produto real.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 text-sm">
                <a
                  href="#documentos"
                  className="inline-flex h-12 items-center gap-2 rounded-md bg-[#99FF33] px-5 py-2.5 font-medium text-[#1A1A1A]"
                >
                  Ver documentos
                  <ArrowUpRight className="h-4 w-4" />
                </a>
                <a
                  href="#deploy"
                  className="inline-flex h-12 items-center gap-2 rounded-md border border-[#d9dde3] bg-white px-5 py-2.5 font-medium text-[#1A1A1A]"
                >
                  Planejamento de deploy
                </a>
              </div>
            </div>

            <div className="grid gap-4">
              <Card className="rounded-[20px] border-[#d9dde3] bg-white p-6">
                <CardTitle className="flex items-center gap-2 text-[#1A1A1A]">
                  <ShieldCheck className="h-5 w-5 text-[#99FF33]" />
                  Operacao administrativa
                </CardTitle>
                <CardDescription className="text-[#666666]">
                  Login via cookie HttpOnly, upload restrito e logs operacionais
                  para acompanhar ingestao, falhas e exclusoes.
                </CardDescription>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="rounded-[20px] border-[#d9dde3] bg-[#F7F8FA] p-5">
                  <p className="text-sm font-medium text-[#666666]">Status admin</p>
                  <p className="mt-2 text-lg font-semibold text-[#1A1A1A]">
                    {isCheckingSession
                      ? "Verificando..."
                      : adminUser
                        ? "Autenticado"
                        : "Nao autenticado"}
                  </p>
                </Card>
                <Card className="rounded-[20px] border-[#d9dde3] bg-[#F7F8FA] p-5">
                  <p className="text-sm font-medium text-[#666666]">Stack</p>
                  <p className="mt-2 text-lg font-semibold text-[#1A1A1A]">
                    FastAPI, RQ, Redis e pgvector
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <div className="px-6 pb-16">
          <div className="mx-auto grid max-w-6xl gap-8">
            {authErrorMessage && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 text-sm text-red-700">
                  {authErrorMessage}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <section id="fluxo" className="scroll-mt-28 bg-white px-6 py-10">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="rounded-[20px] border-[#d9dde3] bg-[#F7F8FA] p-6">
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="h-5 w-5 text-[#99FF33]" />
                  Smart Ingest
                </CardTitle>
                <CardDescription>
                  Upload, fila Redis, worker separado, enriquecimento com IA e
                  atualizacao de status por job.
                </CardDescription>
              </Card>

              <Card className="rounded-[20px] border-[#d9dde3] bg-[#F7F8FA] p-6">
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-[#99FF33]" />
                  Base consultavel
                </CardTitle>
                <CardDescription>
                  Chunks, embeddings e documentos registrados em PostgreSQL com
                  busca vetorial via pgvector.
                </CardDescription>
              </Card>

              <Card className="rounded-[20px] border-[#d9dde3] bg-[#F7F8FA] p-6">
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#99FF33]" />
                  Controle operacional
                </CardTitle>
                <CardDescription>
                  Rate limit no chat publico, autenticacao admin e usage logs para
                  auditoria de eventos.
                </CardDescription>
              </Card>
            </div>
          </div>
        </section>

        <section className="bg-[#fafafa] px-6 py-10">
          <div className="mx-auto max-w-6xl">
            <DocumentsPanel adminUser={adminUser} />
          </div>
        </section>

        <section id="deploy" className="scroll-mt-28 bg-[#F0F2F5] px-6 py-10">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <h2 className="heading-2 text-[#1A1A1A]">
                Deploy e operacao
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#666666]">
                A arquitetura foi preparada para separar frontend, API e worker em
                servicos independentes, com bootstrap de banco, checklist de
                pre-deploy e guia de deploy para Railway.
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
