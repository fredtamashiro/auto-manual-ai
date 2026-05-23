import json
from pathlib import Path
from typing import Any
from app.config import get_settings

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings


VECTORSTORE_DIR = Path("app/storage/vectorstore")
OPENAI_API_KEY_PLACEHOLDER = "sua_chave_aqui"


def load_chunks_from_json(chunks_file: str) -> dict[str, Any]:
    path = Path(chunks_file)

    if not path.exists():
        raise ValueError("Arquivo de chunks nao encontrado.")

    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def create_documents_from_chunks(chunks_payload: dict[str, Any]) -> list[Document]:
    documents = []

    document_id = chunks_payload["document_id"]
    source_file_path = chunks_payload["source_file_path"]

    for chunk in chunks_payload["chunks"]:
        documents.append(
            Document(
                page_content=chunk["content"],
                metadata={
                    "document_id": document_id,
                    "source_file_path": source_file_path,
                    "chunk_index": chunk["chunk_index"],
                    "page": chunk["page"],
                    "char_count": chunk["char_count"],
                    "chunk_strategy": chunk.get("chunk_strategy", "unknown"),
                },
            )
        )

    return documents


def validate_openai_api_key() -> str:
    try:
        settings = get_settings()
    except Exception as error:
        raise ValueError(
            "OPENAI_API_KEY nao configurada. Defina uma chave valida em backend/.env."
        ) from error

    api_key = settings.openai_api_key

    if not api_key or api_key == OPENAI_API_KEY_PLACEHOLDER:
        raise ValueError(
            "OPENAI_API_KEY nao configurada. Defina uma chave valida em backend/.env."
        )

    return api_key


def index_chunks_in_vectorstore(chunks_file: str) -> dict[str, Any]:
    chunks_payload = load_chunks_from_json(chunks_file)
    documents = create_documents_from_chunks(chunks_payload)

    if not documents:
        raise ValueError("Nenhum documento encontrado para indexacao.")

    api_key = validate_openai_api_key()

    VECTORSTORE_DIR.mkdir(parents=True, exist_ok=True)

    settings = get_settings()

    embeddings = OpenAIEmbeddings(
        model=settings.openai_embedding_model,
        openai_api_key=api_key,
    )

    collection_name = f"manual_{chunks_payload['document_id'].replace('-', '_')}"

    vectorstore = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=str(VECTORSTORE_DIR),
    )

    try:
        vectorstore.add_documents(documents)
    except Exception as error:
        raise ValueError(
            f"Falha ao indexar chunks no vector store: {error}"
        ) from error

    return {
        "document_id": chunks_payload["document_id"],
        "collection_name": collection_name,
        "total_documents": len(documents),
        "vectorstore_dir": str(VECTORSTORE_DIR),
    }

def search_similar_chunks(
    collection_name: str,
    query: str,
    k: int = 4,
) -> list[dict[str, Any]]:
    if not query.strip():
        raise ValueError("A pergunta não pode estar vazia.")

    if k <= 0:
        raise ValueError("O parâmetro k deve ser maior que zero.")

    api_key = validate_openai_api_key()
    settings = get_settings()

    embeddings = OpenAIEmbeddings(
        model=settings.openai_embedding_model,
        openai_api_key=api_key,
    )
    
    vectorstore = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=str(VECTORSTORE_DIR),
    )

    results = vectorstore.similarity_search_with_score(
        query=query,
        k=k,
    )

    similar_chunks = []

    for document, score in results:
        content = document.metadata.get("original_content") or document.page_content

        similar_chunks.append(
            {
                "content": content,
                "retrieval_content": document.page_content,
                "metadata": document.metadata,
                "score": score,
            }
        )

    return similar_chunks

def index_enriched_chunks_in_vectorstore(enriched_chunks_file: str) -> dict[str, Any]:
    path = Path(enriched_chunks_file)

    if not path.exists():
        raise ValueError("Arquivo de chunks enriquecidos não encontrado.")

    with path.open("r", encoding="utf-8") as file:
        enriched_payload = json.load(file)

    chunks = enriched_payload.get("chunks", [])

    if not chunks:
        raise ValueError("Nenhum chunk enriquecido encontrado para indexação.")

    VECTORSTORE_DIR.mkdir(parents=True, exist_ok=True)

    settings = get_settings()

    embeddings = OpenAIEmbeddings(
        model=settings.openai_embedding_model,
    )

    document_id = enriched_payload["document_id"]
    collection_name = f"manual_enriched_{document_id.replace('-', '_')}"

    documents = []

    for chunk in chunks:
        enrichment = chunk.get("enrichment", {})

        documents.append(
            Document(
                page_content=chunk.get("embedding_content") or chunk["content"],
                metadata={
                    "document_id": document_id,
                    "source_file_path": enriched_payload.get("source_file_path"),
                    "chunk_index": chunk["chunk_index"],
                    "page": chunk["page"],
                    "char_count": chunk["char_count"],
                    "chunk_strategy": chunk.get("chunk_strategy", "unknown"),
                    "retrieval_content_type": "enriched",
                    "original_content": chunk["content"],
                    "title": enrichment.get("title", ""),
                    "category": enrichment.get("category", ""),
                    "summary": enrichment.get("summary", ""),
                    "quality_score": enrichment.get("quality_score", 0),
                    "is_valid": enrichment.get("is_valid", True),
                },
            )
        )

    vectorstore = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=str(VECTORSTORE_DIR),
    )

    vectorstore.add_documents(documents)

    return {
        "document_id": document_id,
        "collection_name": collection_name,
        "total_documents": len(documents),
        "vectorstore_dir": str(VECTORSTORE_DIR),
    }
