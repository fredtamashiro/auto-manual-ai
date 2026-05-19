import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

REGISTRY_FILE = Path("app/storage/documents_registry.json")


def load_documents_registry() -> list[dict[str, Any]]:
    if not REGISTRY_FILE.exists():
        return []

    with REGISTRY_FILE.open("r", encoding="utf-8") as file:
        return json.load(file)


def save_documents_registry(documents: list[dict[str, Any]]) -> None:
    REGISTRY_FILE.parent.mkdir(parents=True, exist_ok=True)

    with REGISTRY_FILE.open("w", encoding="utf-8") as file:
        json.dump(documents, file, ensure_ascii=False, indent=2)


def register_document(document_data: dict[str, Any]) -> dict[str, Any]:
    documents = load_documents_registry()

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

    documents.append(registered_document)

    save_documents_registry(documents)

    return registered_document


def list_registered_documents() -> list[dict[str, Any]]:
    return load_documents_registry()


def find_registered_document_by_id(document_id: str) -> dict[str, Any] | None:
    documents = load_documents_registry()

    for document in documents:
        if document["document_id"] == document_id:
            return document

    return None
