from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openai_api_key: str

    openai_chat_model: str = "gpt-4o-mini"
    openai_embedding_model: str = "text-embedding-3-small"
    max_relevance_score: float = 1.2

    class Config:
        env_file = Path(__file__).resolve().parents[1] / ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
