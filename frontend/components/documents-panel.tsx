"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import { DocumentChat } from "@/components/document-chat";
import { SmartDocumentUpload } from "@/components/smart-document-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DocumentItem, deleteDocument, fetchDocuments } from "@/services/api";

type SelectedQuestion = {
  question: string;
  requestId: number;
};

export function DocumentsPanel() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedQuestionsByDocument, setSelectedQuestionsByDocument] =
    useState<Record<string, SelectedQuestion>>({});

  async function loadDocuments() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const data = await fetchDocuments();
      setDocuments(data.documents);
    } catch {
      setErrorMessage("Não foi possível carregar os documentos.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchDocuments()
      .then((data) => {
        setDocuments(data.documents);
      })
      .catch(() => {
        setErrorMessage("Não foi possível carregar os documentos.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  async function handleDeleteDocument(documentId: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja apagar este documento?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteDocument(documentId);
      await loadDocuments();
    } catch {
      setErrorMessage("Não foi possível apagar o documento.");
    }
  }

  function handleSuggestedQuestionClick(
    documentId: string,
    suggestedQuestion: string,
  ) {
    setSelectedQuestionsByDocument((currentQuestions) => ({
      ...currentQuestions,
      [documentId]: {
        question: suggestedQuestion,
        requestId: (currentQuestions[documentId]?.requestId ?? 0) + 1,
      },
    }));
  }

  return (
    <>
      <SmartDocumentUpload onCompleted={loadDocuments} />

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Manuais cadastrados</h2>
          <p className="text-sm text-slate-400">
            Total de documentos: {documents.length}
          </p>
        </div>

        {isLoading && (
          <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
            Carregando documentos...
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-red-900 bg-red-950/40 p-8 text-center text-red-300">
            {errorMessage}
          </div>
        )}

        {!isLoading && !errorMessage && documents.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
            Nenhum manual cadastrado ainda.
          </div>
        )}

        {!isLoading && !errorMessage && documents.length > 0 && (
          <div className="grid gap-4">
            {documents.map((document) => (
              <article
                key={document.document_id}
                className="rounded-xl border border-slate-800 bg-slate-950 p-5"
              >
                <h3 className="font-medium text-slate-100">
                  {document.original_filename}
                </h3>

                <div className="mt-3 grid gap-2 text-sm text-slate-400 md:grid-cols-3">
                  <p>
                    <span className="text-slate-500">Páginas:</span>{" "}
                    {document.total_pages}
                  </p>
                  <p>
                    <span className="text-slate-500">Chunks:</span>{" "}
                    {document.total_chunks}
                  </p>
                  <p>
                    <span className="text-slate-500">Criado em:</span>{" "}
                    {document.created_at
                      ? new Date(document.created_at).toLocaleString("pt-BR")
                      : "-"}
                  </p>
                </div>

                {document.document_type && (
                  <p className="mt-2 text-xs text-blue-300">
                    Tipo: {document.document_type}
                  </p>
                )}

                {document.theme_name && (
                  <p className="mt-1 text-xs text-slate-500">
                    Tema: {document.theme_name}
                  </p>
                )}

                {document.document_summary && (
                  <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Resumo automático
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {document.document_summary}
                    </p>
                  </div>
                )}

                {document.main_topics && document.main_topics.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Tópicos principais
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {document.main_topics.map((topic) => (
                        <Badge
                          key={topic}
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {document.suggested_questions &&
                  document.suggested_questions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Perguntas sugeridas
                      </p>

                      <div className="mt-2 space-y-2">
                        {document.suggested_questions.map((suggestedQuestion) => (
                          <button
                            key={suggestedQuestion}
                            type="button"
                            onClick={() =>
                              handleSuggestedQuestionClick(
                                document.document_id,
                                suggestedQuestion,
                              )
                            }
                            className="block w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-left text-sm text-slate-300 transition hover:border-blue-900/70 hover:bg-blue-950/20 hover:text-blue-200"
                          >
                            {suggestedQuestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                {document.summary_limitations &&
                  document.summary_limitations.length > 0 && (
                    <div className="mt-3 rounded-lg border border-yellow-900/50 bg-yellow-950/20 p-3">
                      <p className="text-xs uppercase tracking-wide text-yellow-500">
                        Limitações identificadas
                      </p>

                      <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-5 text-yellow-200/80">
                        {document.summary_limitations.map((limitation) => (
                          <li key={limitation}>{limitation}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                <p className="mt-3 break-all text-xs text-slate-600">
                  ID: {document.document_id}
                </p>

                <div className="mt-4 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => handleDeleteDocument(document.document_id)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Apagar
                  </Button>
                </div>

                <DocumentChat
                  documentId={document.document_id}
                  initialQuestion={
                    selectedQuestionsByDocument[document.document_id]?.question
                  }
                  initialQuestionRequestId={
                    selectedQuestionsByDocument[document.document_id]?.requestId
                  }
                />
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
