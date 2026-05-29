import json
from datetime import datetime, timezone
from json import JSONDecodeError
from pathlib import Path
from threading import Lock
from typing import Any
from uuid import uuid4

REGISTRY_FILE = Path("app/storage/documents_registry.json")
_REGISTRY_LOCK = Lock()


def load_documents_registry() -> list[dict[str, Any]]:
    if not REGISTRY_FILE.exists():
        return []

    try:
        with REGISTRY_FILE.open("r", encoding="utf-8") as file:
            data = json.load(file)
    except JSONDecodeError as error:
        raise ValueError("Registry de documentos esta corrompido.") from error

    if not isinstance(data, list):
        raise ValueError("Registry de documentos deve conter uma lista.")

    return data


def _write_documents_registry(documents: list[dict[str, Any]]) -> None:
    REGISTRY_FILE.parent.mkdir(parents=True, exist_ok=True)

    temp_file = REGISTRY_FILE.with_name(f"{REGISTRY_FILE.name}.{uuid4()}.tmp")

    with temp_file.open("w", encoding="utf-8") as file:
        json.dump(documents, file, ensure_ascii=False, indent=2)

    temp_file.replace(REGISTRY_FILE)


def save_documents_registry(documents: list[dict[str, Any]]) -> None:
    with _REGISTRY_LOCK:
        _write_documents_registry(documents)


def register_document(document_data: dict[str, Any]) -> dict[str, Any]:
    registered_document = {
        "document_id": document_data["document_id"],
        "collection_name": document_data["collection_name"],
        "original_filename": document_data["original_filename"],
        "stored_filename": document_data["stored_filename"],
        "file_path": document_data["file_path"],
        "chunks_file": document_data["chunks_file"],
        "total_pages": document_data["total_pages"],
        "total_chars": document_data["total_chars"],
        "total_chunks": document_data["total_chunks"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    if "theme_id" in document_data:
        registered_document["theme_id"] = document_data["theme_id"]

    if "theme_name" in document_data:
        registered_document["theme_name"] = document_data["theme_name"]

    with _REGISTRY_LOCK:
        documents = load_documents_registry()
        documents.append(registered_document)

        _write_documents_registry(documents)

    return registered_document


def list_registered_documents() -> list[dict[str, Any]]:
    return load_documents_registry()


def find_registered_document_by_id(document_id: str) -> dict[str, Any] | None:
    documents = load_documents_registry()

    for document in documents:
        if document["document_id"] == document_id:
            return document

    return None

def update_registered_document(
    document_id: str,
    updates: dict[str, Any],
) -> dict[str, Any]:
    documents = load_documents_registry()

    for index, document in enumerate(documents):
        if document["document_id"] == document_id:
            updated_document = {
                **document,
                **updates,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }

            documents[index] = updated_document
            save_documents_registry(documents)

            return updated_document

    raise ValueError("Documento não encontrado.")
