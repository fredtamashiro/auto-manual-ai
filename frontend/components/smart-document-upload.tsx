"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Info,
  Loader2,
  UploadCloud,
  X,
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
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCompleted?: () => void;
};

function getStatusLabel(status: ProcessingJob["status"]): string {
  switch (status) {
    case "pending":
      return "Na fila";
    case "processing":
      return "Processando";
    case "completed":
      return "Concluído";
    case "failed":
      return "Falhou";
    default:
      return status;
  }
}

function StatusIcon({ status }: { status: ProcessingJob["status"] }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-[#2F6F6D]" />;
    case "failed":
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    case "processing":
      return <Loader2 className="h-4 w-4 animate-spin text-[#2F6F6D]" />;
    default:
      return <Info className="h-4 w-4 text-[#2F6F6D]" />;
  }
}

export function SmartDocumentUpload({
  isOpen,
  onOpenChange,
  onCompleted,
}: SmartDocumentUploadProps) {
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

    void loadThemes();
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

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/45 px-4 py-8 backdrop-blur-sm">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-auto p-0">
        <CardHeader className="mb-0 border-b border-[#d9dde3] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Importar documento</CardTitle>
              <CardDescription>
                Envie um PDF e escolha um tema para o processamento inteligente.
              </CardDescription>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label="Fechar modal de importação"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1A1A1A]">
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
                <p className="mt-2 text-xs text-[#666666]">
                  {
                    themes.find((theme) => theme.theme_id === selectedThemeId)
                      ?.description
                  }
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1A1A1A]">
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
                <p className="mt-2 flex items-center gap-1.5 text-xs text-[#666666]">
                  <FileText className="h-3.5 w-3.5" />
                  Arquivo selecionado: {selectedFile.name}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isStarting || isProcessing}>
              {isStarting || isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="h-4 w-4" />
              )}
              {isStarting || isProcessing
                ? "Processando..."
                : "Iniciar Smart Ingest"}
            </Button>
          </form>

          {errorMessage && (
            <Alert className="mt-4 border-red-200 bg-red-50 text-red-700">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {errorMessage}
              </span>
            </Alert>
          )}

          {job && (
            <div className="mt-5 rounded-lg border border-[#d9dde3] bg-[#F7F8FA] p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h5 className="heading-5 text-[#666666]">
                    Status do processamento
                  </h5>
                  <p className="mt-1 flex items-center gap-2 text-sm text-[#1A1A1A]">
                    <StatusIcon status={job.status} />
                    {job.current_step}
                  </p>
                </div>

                <span className="rounded-full border border-[#d9dde3] bg-white px-3 py-1 text-xs text-[#666666]">
                  {getStatusLabel(job.status)}
                </span>
              </div>

              <Progress className="mt-4" value={job.progress} />

              <p className="mt-2 text-xs text-[#666666]">
                Progresso: {job.progress}% concluído
              </p>

              {hasChunkProgress && (
                <p className="mt-1 text-xs text-[#666666]">
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
                    className="text-xs font-medium text-[#2F6F6D] transition hover:text-[#1A1A1A]"
                  >
                    {showTechnicalDetails
                      ? "Ocultar detalhes técnicos"
                      : "Ver detalhes técnicos"}
                  </button>

                  {showTechnicalDetails && (
                    <pre className="mt-3 max-h-40 overflow-auto rounded-lg border border-[#d9dde3] bg-white p-3 text-xs text-[#666666]">
                      {JSON.stringify(job.partial_result, null, 2)}
                    </pre>
                  )}
                </div>
              )}

              {job.status === "completed" && job.result?.document && (
                <div className="mt-3 rounded-lg border border-[#cfeea6] bg-[#efffdd] p-3">
                  <p className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                    <CheckCircle2 className="h-4 w-4 text-[#2F6F6D]" />
                    Documento processado com sucesso.
                  </p>
                  <p className="mt-1 text-xs text-[#666666]">
                    {job.result.document.original_filename}
                  </p>
                </div>
              )}

              {job.status === "failed" && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-700">O processamento falhou.</p>
                  {job.error && (
                    <p className="mt-1 text-xs text-red-700">{job.error}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
