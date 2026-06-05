import logging
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.api.admin_auth import require_admin_user
from app.services.document_registry_service import (
    delete_registered_document,
    find_registered_document_by_id,
    list_registered_documents,
)
from app.services.document_service import save_uploaded_file
from app.services.processing_job_service import create_processing_job
from app.services.queue_service import enqueue_smart_ingest_job
from app.services.theme_service import find_theme_by_id

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)


def remove_file_if_exists(file_path: str | None) -> bool:
    if not file_path:
        return False

    path = Path(file_path)

    if not path.exists():
        return False

    if not path.is_file():
        return False

    path.unlink()

    return True


@router.get("")
def list_documents():
    documents = list_registered_documents()

    return {
        "total": len(documents),
        "documents": documents,
    }


@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    _admin_user: dict = Depends(require_admin_user),
):
    try:
        document = find_registered_document_by_id(document_id)

        if document is None:
            raise ValueError("Documento não encontrado.")

        removed_document = delete_registered_document(document_id)

        deleted_files = []

        for field in ["file_path", "chunks_file", "enriched_chunks_file"]:
            file_path = removed_document.get(field)

            if remove_file_if_exists(file_path):
                deleted_files.append(
                    {
                        "field": field,
                        "path": file_path,
                    }
                )

        return {
            "message": "Documento apagado com sucesso.",
            "document_id": document_id,
            "deleted_files": deleted_files,
            "removed_document": removed_document,
        }

    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except Exception as error:
        logger.exception("Erro inesperado ao apagar documento")
        raise HTTPException(
            status_code=500,
            detail=f"Erro inesperado ao apagar documento: {error}",
        )


@router.post("/smart-ingest/start")
def start_smart_ingest(
    file: UploadFile = File(...),
    theme_id: str = Form("generic_pdf"),
    chunk_size: int = Form(1000),
    chunk_overlap: int = Form(200),
    batch_size: int = Form(10),
    _admin_user: dict = Depends(require_admin_user),
):
    try:
        theme = find_theme_by_id(theme_id)

        if theme is None:
            raise ValueError("Tema informado não encontrado.")

        saved_file = save_uploaded_file(file)

        job = create_processing_job(
            job_type="smart_ingest",
            payload={
                "original_filename": saved_file["original_filename"],
                "stored_filename": saved_file["stored_filename"],
                "file_path": saved_file["path"],
                "theme_id": theme["theme_id"],
                "theme_name": theme["name"],
                "chunk_size": chunk_size,
                "chunk_overlap": chunk_overlap,
                "batch_size": batch_size,
            },
        )

        queue_job = enqueue_smart_ingest_job(
            job_id=job["job_id"],
            saved_file=saved_file,
            theme_id=theme_id,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            batch_size=batch_size,
        )

        return {
            "message": "Processamento inteligente iniciado.",
            "job": job,
            "queue_job_id": queue_job.id,
        }

    except ValueError as error:
        logger.warning("Falha de validação ao iniciar smart ingest: %s", error)
        raise HTTPException(status_code=400, detail=str(error))
    except Exception as error:
        logger.exception("Erro inesperado ao iniciar smart ingest")
        raise HTTPException(
            status_code=500,
            detail=f"Erro inesperado ao iniciar smart ingest: {error}",
        )
