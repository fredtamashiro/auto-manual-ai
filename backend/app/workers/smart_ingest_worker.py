import logging
from pathlib import Path

from app.services.chunk_enrichment_service import enrich_all_chunks_file
from app.services.chunk_service import save_chunks_to_json, split_text_into_chunks
from app.services.document_registry_service import register_document
from app.services.document_service import extract_text_from_pdf
from app.services.document_summary_service import generate_document_summary
from app.services.pgvector_index_service import index_enriched_chunks_in_pgvector
from app.services.processing_job_service import (
    STATUS_COMPLETED,
    STATUS_FAILED,
    STATUS_PROCESSING,
    update_processing_job,
)
from app.services.theme_service import find_theme_by_id

logger = logging.getLogger(__name__)


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


def run_smart_ingest_job(
    job_id: str,
    saved_file: dict,
    theme_id: str,
    chunk_size: int,
    chunk_overlap: int,
    batch_size: int,
) -> None:
    try:
        update_processing_job(
            job_id,
            {
                "status": STATUS_PROCESSING,
                "progress": 5,
                "current_step": "Extraindo texto do PDF",
            },
        )

        extracted_text = extract_text_from_pdf(saved_file["path"])

        update_processing_job(
            job_id,
            {
                "progress": 15,
                "current_step": "Gerando chunks do documento",
            },
        )

        chunks = split_text_into_chunks(
            pages=extracted_text["pages"],
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )

        saved_chunks = save_chunks_to_json(
            chunks=chunks,
            source_file_path=extracted_text["file_path"],
        )

        update_processing_job(
            job_id,
            {
                "progress": 30,
                "current_step": "Enriquecendo chunks com IA",
                "partial_result": {
                    "chunks_file": saved_chunks["chunks_file"],
                    "total_chunks": saved_chunks["total_chunks"],
                },
            },
        )

        def update_enrichment_progress(
            processed_chunks: int,
            total_chunks: int,
        ) -> None:
            enrichment_progress = 30 + int((processed_chunks / total_chunks) * 50)

            update_processing_job(
                job_id,
                {
                    "progress": min(enrichment_progress, 80),
                    "current_step": (
                        f"Enriquecendo chunks com IA "
                        f"({processed_chunks}/{total_chunks})"
                    ),
                    "partial_result": {
                        "chunks_file": saved_chunks["chunks_file"],
                        "total_chunks": saved_chunks["total_chunks"],
                        "processed_chunks": processed_chunks,
                    },
                },
            )

        enriched_chunks = enrich_all_chunks_file(
            chunks_file=saved_chunks["chunks_file"],
            batch_size=batch_size,
            theme_id=theme_id,
            progress_callback=update_enrichment_progress,
        )

        update_processing_job(
            job_id,
            {
                "progress": 80,
                "current_step": "Indexando chunks enriquecidos no pgvector",
                "partial_result": {
                    "chunks_file": saved_chunks["chunks_file"],
                    "enriched_chunks_file": enriched_chunks["enriched_chunks_file"],
                    "total_chunks": saved_chunks["total_chunks"],
                    "total_enriched_chunks": enriched_chunks["total_enriched_chunks"],
                },
            },
        )

        indexed_document = index_enriched_chunks_in_pgvector(
            enriched_chunks_file=enriched_chunks["enriched_chunks_file"],
        )

        update_processing_job(
            job_id,
            {
                "progress": 90,
                "current_step": "Gerando resumo do documento",
            },
        )

        document_summary = generate_document_summary(
            enriched_chunks_file=enriched_chunks["enriched_chunks_file"],
            theme_id=theme_id,
        )

        theme = find_theme_by_id(theme_id)

        if theme is None:
            raise ValueError("Tema informado não encontrado.")

        document_payload = {
            "original_filename": saved_file["original_filename"],
            "stored_filename": saved_file["stored_filename"],
            "file_path": saved_file["path"],
            "document_id": indexed_document["document_id"],
            "collection_name": indexed_document["collection_name"],
            "enriched_collection_name": indexed_document["collection_name"],
            "retrieval_mode": "pgvector",
            "theme_id": theme["theme_id"],
            "theme_name": theme["name"],
            "total_pages": extracted_text["total_pages"],
            "total_chars": extracted_text["total_chars"],
            "total_chunks": saved_chunks["total_chunks"],
            "chunks_file": saved_chunks["chunks_file"],
            "enriched_chunks_file": enriched_chunks["enriched_chunks_file"],
            "document_summary": document_summary["summary"].get("document_summary"),
            "document_type": document_summary["summary"].get("document_type"),
            "main_topics": document_summary["summary"].get("main_topics", []),
            "suggested_questions": document_summary["summary"].get(
                "suggested_questions",
                [],
            ),
            "summary_limitations": document_summary["summary"].get("limitations", []),
        }

        registered_document = register_document(document_payload)
        uploaded_file_deleted = remove_file_if_exists(saved_file["path"])

        update_processing_job(
            job_id,
            {
                "status": STATUS_COMPLETED,
                "progress": 100,
                "current_step": "Processamento concluído",
                "result": {
                    "document": registered_document,
                    "retrieval_backend": "pgvector",
                    "total_enriched_chunks": indexed_document.get(
                        "total_enriched_chunks"
                    ),
                    "total_embeddings": indexed_document.get("total_embeddings"),
                    "total_indexed_documents": indexed_document.get(
                        "total_indexed_documents",
                        indexed_document.get("total_documents"),
                    ),
                    "total_skipped_chunks": indexed_document.get("total_skipped_chunks"),
                    "skipped_chunks": indexed_document.get("skipped_chunks", []),
                    "uploaded_file_deleted": uploaded_file_deleted,
                },
            },
        )

    except Exception as error:
        logger.exception("Erro ao executar smart ingest job %s", job_id)

        update_processing_job(
            job_id,
            {
                "status": STATUS_FAILED,
                "current_step": "Erro no processamento",
                "error": str(error),
            },
        )
