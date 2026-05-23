import json
from pathlib import Path
from typing import Any

from langchain_openai import ChatOpenAI

from app.config import get_settings
from app.services.vector_store_service import load_chunks_from_json

ENRICHED_CHUNKS_DIR = Path("app/storage/enriched_chunks")


def enrich_single_chunk(chunk: dict[str, Any]) -> dict[str, Any]:
    settings = get_settings()

    llm = ChatOpenAI(
        model=settings.openai_chat_model,
        temperature=0,
    )

    prompt = f"""
Você é um assistente especializado em análise de chunks para sistemas RAG com manuais automotivos.

Analise o chunk abaixo e retorne apenas um JSON válido, sem markdown e sem explicações.

O JSON deve ter exatamente esta estrutura:

{{
  "is_valid": true,
  "quality_score": 0.0,
  "title": "título curto do chunk",
  "summary": "resumo objetivo do conteúdo",
  "category": "categoria do conteúdo",
  "keywords": ["palavra-chave 1", "palavra-chave 2"],
  "possible_questions": ["pergunta provável 1", "pergunta provável 2"],
  "warnings": ["observação importante ou limitação"]
}}

Regras:
- is_valid deve ser false se o chunk for índice, rodapé, texto muito fragmentado ou sem contexto útil.
- quality_score deve variar de 0 a 1.
- title deve ser curto.
- summary deve explicar o conteúdo sem inventar informação.
- keywords devem incluir sinônimos úteis para busca.
- possible_questions devem representar formas naturais de um usuário perguntar sobre esse conteúdo.
- warnings deve indicar ambiguidades, limitações ou riscos de interpretação.
- Não invente recursos que não estejam no texto.
- Se o texto mencionar conectividade, diferencie conexão com celular, WLAN, dados móveis, internet, serviços conectados, chip, eSIM ou modem próprio quando possível.
- Quando o chunk mencionar serviços online, rede, WLAN, dados móveis, OTA, dispositivos móveis, central multimídia ou conexão, inclua keywords e possible_questions relacionadas a internet no veículo, internet embarcada, conectividade e serviços conectados.
- Só mencione chip, eSIM ou modem próprio como fato se isso estiver claramente presente no texto.
- Se o texto não confirmar chip/eSIM/modem próprio, coloque essa limitação em warnings.

Chunk:
Página: {chunk.get("page")}
Chunk index: {chunk.get("chunk_index")}
Conteúdo:
{chunk.get("content")}
"""

    response = llm.invoke(prompt)
    raw_content = response.content.strip()

    try:
        enrichment = json.loads(raw_content)
    except json.JSONDecodeError:
        enrichment = {
            "is_valid": False,
            "quality_score": 0.0,
            "title": "Erro ao enriquecer chunk",
            "summary": "",
            "category": "unknown",
            "keywords": [],
            "possible_questions": [],
            "warnings": [
                "A resposta do modelo não retornou um JSON válido."
            ],
        }

    enriched_chunk = {
        **chunk,
        "enrichment": enrichment,
    }

    enriched_chunk["embedding_content"] = build_embedding_content(enriched_chunk)

    return enriched_chunk


def enrich_chunks_file(
    chunks_file: str,
    limit: int = 10,
    offset: int = 0,
) -> dict[str, Any]:
    if offset < 0:
        raise ValueError("offset não pode ser negativo.")

    if limit <= 0:
        raise ValueError("limit deve ser maior que zero.")

    chunks_payload = load_chunks_from_json(chunks_file)

    chunks = chunks_payload.get("chunks", [])

    if not chunks:
        raise ValueError("Nenhum chunk encontrado para enriquecer.")

    selected_chunks = chunks[offset : offset + limit]

    enriched_chunks = []

    for chunk in selected_chunks:
        enriched_chunks.append(enrich_single_chunk(chunk))

    ENRICHED_CHUNKS_DIR.mkdir(parents=True, exist_ok=True)

    document_id = chunks_payload["document_id"]
    output_path = ENRICHED_CHUNKS_DIR / f"{document_id}_enriched_preview.json"

    payload = {
        "document_id": document_id,
        "source_file_path": chunks_payload.get("source_file_path"),
        "original_chunks_file": chunks_file,
        "total_original_chunks": len(chunks),
        "total_enriched_chunks": len(enriched_chunks),
        "enrichment_mode": "preview",
        "offset": offset,
        "limit": limit,
        "chunks": enriched_chunks,
    }

    with output_path.open("w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=2)

    return {
        "document_id": document_id,
        "enriched_chunks_file": str(output_path),
        "total_original_chunks": len(chunks),
        "total_enriched_chunks": len(enriched_chunks),
        "offset": offset,
        "limit": limit,
        "preview": enriched_chunks[:3],
    }

def build_embedding_content(enriched_chunk: dict[str, Any]) -> str:
    enrichment = enriched_chunk.get("enrichment", {})

    title = enrichment.get("title", "")
    summary = enrichment.get("summary", "")
    category = enrichment.get("category", "")
    keywords = enrichment.get("keywords", [])
    possible_questions = enrichment.get("possible_questions", [])
    warnings = enrichment.get("warnings", [])
    original_content = enriched_chunk.get("content", "")

    return "\n".join(
        [
            f"Título: {title}",
            f"Categoria: {category}",
            f"Resumo: {summary}",
            f"Palavras-chave: {', '.join(keywords)}",
            f"Perguntas possíveis: {' | '.join(possible_questions)}",
            f"Observações: {' | '.join(warnings)}",
            f"Conteúdo original: {original_content}",
        ]
    ).strip()
