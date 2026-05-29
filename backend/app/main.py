from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.chat import router as chat_router
from app.api.routes.documents import router as documents_router
from app.api.routes.themes import router as themes_router

app = FastAPI(
    title="AutoManual AI",
    description="API para consulta inteligente de manuais automotivos usando IA.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:2000",
        "http://127.0.0.1:2000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "AutoManual AI API is running",
    }


app.include_router(chat_router)
app.include_router(documents_router)
app.include_router(themes_router)
