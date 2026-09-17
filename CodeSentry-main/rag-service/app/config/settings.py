from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    LLM_PROVIDER: str = 'gemini'
    LLM_API_KEY: str = ''
    LLM_MODEL: str = 'gemini-2.0-flash'
    CHROMA_PERSIST_DIR: str = '/data/chroma'
    BM25_PERSIST_DIR: str = '/data/bm25'
    REPO_STORAGE_PATH: str = '/data/repos'
    EMBEDDING_MODEL: str = 'all-MiniLM-L6-v2'
    RERANKER_MODEL: str = 'cross-encoder/ms-marco-MiniLM-L-6-v2'
    TOP_K_RETRIEVAL: int = 20
    TOP_K_RERANK: int = 5
    RRF_K: int = 60

    class Config:
        env_file = ".env"
        extra = "ignore"

@lru_cache()
def get_settings():
    return Settings()
