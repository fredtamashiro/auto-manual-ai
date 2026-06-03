import { DocumentsPanel } from "@/components/documents-panel";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Documentos IA</h1>
          <p className="mt-2 text-slate-400">
            Assistente inteligente para consulta de documentos em PDF.
          </p>
        </header>
        <DocumentsPanel />
      </div>
    </main>
  );
}
