import logging
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from pypdf import PdfReader
from pypdf.errors import PdfReadError

from app.services.text_cleaning_service import clean_extracted_text

logger = logging.getLogger(__name__)

UPLOAD_DIR = Path("app/storage/uploads")


def save_uploaded_file(file: UploadFile) -> dict:
    if not file.filename:
        raise ValueError("Arquivo sem nome.")

    file_extension = Path(file.filename).suffix.lower()

    if file_extension != ".pdf":
        raise ValueError("Apenas arquivos PDF são permitidos.")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    generated_filename = f"{uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / generated_filename

    with file_path.open("wb") as buffer:
        buffer.write(file.file.read())

    return {
        "original_filename": file.filename,
        "stored_filename": generated_filename,
        "path": str(file_path),
    }


def extract_text_from_pdf(file_path: str) -> dict:
    path = Path(file_path)

    if not path.exists():
        raise ValueError("Arquivo não encontrado.")

    try:
        reader = PdfReader(str(path))
    except PdfReadError as error:
        logger.exception("Erro do pypdf ao abrir PDF: %s", path)
        raise ValueError(f"Nao foi possivel ler o PDF: {error}") from error
    except Exception as error:
        logger.exception("Erro inesperado ao abrir PDF: %s", path)
        raise ValueError(f"Falha ao abrir o PDF: {error}") from error

    pages = []

    try:
        pdf_pages = reader.pages
    except Exception as error:
        logger.exception("Erro ao ler paginas do PDF: %s", path)
        raise ValueError(f"Falha ao ler as paginas do PDF: {error}") from error

    for index, page in enumerate(pdf_pages, start=1):
        try:
            raw_text = page.extract_text() or ""
        except Exception as error:
            logger.exception("Erro ao extrair texto da pagina %s do PDF: %s", index, path)
            raise ValueError(
                f"Falha ao extrair texto da pagina {index}: {error}"
            ) from error

        text = clean_extracted_text(raw_text)

        pages.append(
            {
                "page": index,
                "text": text.strip(),
                "char_count": len(text),
            }
        )

    total_chars = sum(page["char_count"] for page in pages)

    return {
        "file_path": str(path),
        "total_pages": len(pages),
        "total_chars": total_chars,
        "pages": pages,
    }
