"use client";

import { FormEvent, useState } from "react";

import { askQuestion, ChatResponse } from "@/services/api";

type DocumentChatProps = {
  documentId: string;
};

type ChatMessage = ChatResponse & {
  id: string;
};

export function DocumentChat({ documentId }: DocumentChatProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setErrorMessage("Digite uma pergunta.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      const result = await askQuestion({
        documentId,
        question: trimmedQuestion,
        k: 4,
      });

      setMessages((currentMessages) => [
        {
          ...result,
          id: crypto.randomUUID(),
        },
        ...currentMessages,
      ]);

      setQuestion("");
    } catch {
      setErrorMessage("Não foi possível obter uma resposta.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900 p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ex: Como ligo a luz do veículo?"
          className="min-h-11 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-500"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Perguntando..." : "Perguntar"}
        </button>
      </form>

      {errorMessage && (
        <p className="mt-3 text-sm text-red-400">{errorMessage}</p>
      )}

      {messages.length > 0 && (
        <div className="mt-5 space-y-5">
          {messages.map((message) => (
            <div key={message.id} className="space-y-3">
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Pergunta
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  {message.question}
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Resposta
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-200">
                  {message.answer}
                </p>
              </div>

              {message.sources.length > 0 && (
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Fontes
                  </p>

                  <div className="mt-3 space-y-3">
                    {message.sources.map((source, index) => (
                      <div
                        key={`${source.page}-${source.chunk_index}-${index}`}
                        className="rounded-lg border border-slate-800 p-3"
                      >
                        <div className="mb-2 flex flex-wrap gap-3 text-xs text-slate-500">
                          <span>Página: {source.page}</span>
                          <span>Chunk: {source.chunk_index}</span>
                          <span>Score: {source.score.toFixed(4)}</span>
                        </div>

                        {source.matched_query && (
                          <p className="mb-2 text-xs text-blue-300">
                            Query usada: {source.matched_query}
                          </p>
                        )}

                        <p className="text-xs leading-5 text-slate-400">
                          {source.preview}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
