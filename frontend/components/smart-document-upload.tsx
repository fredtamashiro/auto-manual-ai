"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Info,
  Loader2,
  UploadCloud,
} from "lucide-react";

import {
  getProcessingJob,
  getThemes,
  ProcessingJob,
  startSmartIngest,
  Theme,
} from "@/services/api";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";

type SmartDocumentUploadProps = {
  onCompleted?: () => void;
};

export function SmartDocumentUpload({ onCompleted }: SmartDocumentUploadProps) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState("generic_pdf");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [job, setJob] = useState<ProcessingJob | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  useEffect(() => {
    async function loadThemes() {
      try {
        const result = await getThemes();

        setThemes(result.themes);

        const defaultTheme =
          result.themes.find((theme) => theme.theme_id === "generic_pdf") ??
          result.themes[0];

        if (defaultTheme) {
          setSelectedThemeId(defaultTheme.theme_id);
        }
      } catch {
        setErrorMessage("Não foi possível carregar os temas.");
      }
    }

    loadThemes();
  }, []);

  useEffect(() => {
    if (!job) {
      return;
    }

    if (job.status === "completed" || job.status === "failed") {
      return;
    }

    const intervalId = window.setInterval(async () => {
      try {
        const updatedJob = await getProcessingJob(job.job_id);

        setJob(updatedJob);

        if (updatedJob.status === "completed") {
          onCompleted?.();
        }
      } catch {
        setErrorMessage("Não foi possível atualizar o status do processamento.");
      }
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [job, onCompleted]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setErrorMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setErrorMessage("Selecione um arquivo PDF.");
      return;
    }

    try {
      setIsStarting(true);
      setErrorMessage("");
      setShowTechnicalDetails(false);

      const result = await startSmartIngest({
        file: selectedFile,
        themeId: selectedThemeId,
        chunkSize: 1000,
        chunkOverlap: 200,
        batchSize: 10,
      });

      setJob(result.job);
      setSelectedFile(null);
    } catch {
      setErrorMessage("Não foi possível iniciar o processamento inteligente.");
    } finally {
      setIsStarting(false);
    }
  }

  const isProcessing =
    job?.status === "pending" || job?.status === "processing";
  const processedChunks = job?.partial_result?.processed_chunks;
  const totalChunks = job?.partial_result?.total_chunks;
  const hasChunkProgress =
    processedChunks !== undefined &&
    processedChunks !== null &&
    totalChunks !== undefined &&
    totalChunks !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importar documento</CardTitle>
        <CardDescription>
          Envie um PDF e escolha um tema para o processamento inteligente.
        </CardDescription>
      </CardHeader>

      <CardContent>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Tema do documento
          </label>

          <Select
            value={selectedThemeId}
            onChange={(event) => setSelectedThemeId(event.target.value)}
          >
            {themes.map((theme) => (
              <option key={theme.theme_id} value={theme.theme_id}>
                {theme.name}
              </option>
            ))}
          </Select>

          {themes.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              {
                themes.find((theme) => theme.theme_id === selectedThemeId)
                  ?.description
              }
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Arquivo PDF
          </label>

          <Input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={isStarting || isProcessing}
            className="cursor-pointer"
          />

          {selectedFile && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <FileText className="h-3.5 w-3.5" />
              Arquivo selecionado: {selectedFile.name}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isStarting || isProcessing}
        >
          {isStarting || isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="h-4 w-4" />
          )}
          {isStarting || isProcessing ? "Processando..." : "Iniciar Smart Ingest"}
        </Button>
      </form>

      {errorMessage && (
        <Alert className="mt-3 border-red-900/60 bg-red-950/30 text-red-300">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {errorMessage}
          </span>
        </Alert>
      )}

      {job && (
        <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950 p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Status do processamento
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-200">
                <Info className="h-4 w-4 text-blue-400" />
                {job.current_step}
              </p>
            </div>

            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
              {job.status}
            </span>
          </div>

          <Progress className="mt-4" value={job.progress} />

          <p className="mt-2 text-xs text-slate-500">
            Progresso: {job.progress}% concluído
          </p>

          {hasChunkProgress && (
              <p className="mt-1 text-xs text-slate-500">
                Chunks processados: {String(processedChunks)} de{" "}
                {String(totalChunks)}
              </p>
          )}

          {job.partial_result && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() =>
                  setShowTechnicalDetails(
                    (currentShowTechnicalDetails) =>
                      !currentShowTechnicalDetails,
                  )
                }
                className="text-xs font-medium text-blue-400 hover:text-blue-300"
              >
                {showTechnicalDetails
                  ? "Ocultar detalhes técnicos"
                  : "Ver detalhes técnicos"}
              </button>

              {showTechnicalDetails && (
                <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-400">
                  {JSON.stringify(job.partial_result, null, 2)}
                </pre>
              )}
            </div>
          )}

          {job.status === "completed" && job.result?.document && (
            <div className="mt-3 rounded-lg border border-emerald-900/60 bg-emerald-950/30 p-3">
              <p className="flex items-center gap-2 text-sm text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                Documento processado com sucesso.
              </p>
              <p className="mt-1 text-xs text-emerald-400">
                {job.result.document.original_filename}
              </p>
            </div>
          )}

          {job.status === "failed" && (
            <div className="mt-3 rounded-lg border border-red-900/60 bg-red-950/30 p-3">
              <p className="text-sm text-red-300">O processamento falhou.</p>
              {job.error && (
                <p className="mt-1 text-xs text-red-400">{job.error}</p>
              )}
            </div>
          )}
        </div>
      )}
      </CardContent>
    </Card>
  );
}
