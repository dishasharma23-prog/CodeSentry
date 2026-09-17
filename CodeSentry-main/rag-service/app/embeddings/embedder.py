from typing import List
from app.models.chunk import CodeChunk
from app.config.settings import get_settings

class CodeEmbedder:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(CodeEmbedder, cls).__new__(cls)
        return cls._instance

    def get_model(self):
        if self._model is None:
            from sentence_transformers import SentenceTransformer
            settings = get_settings()
            self._model = SentenceTransformer(settings.EMBEDDING_MODEL)
        return self._model

    def embed_chunks(self, chunks: List[CodeChunk]) -> List[List[float]]:
        texts = [
            f"{c.symbol_type} {c.symbol_name} in {c.file_path}\n{c.source_code}"
            for c in chunks
        ]
        model = self.get_model()
        embeddings = model.encode(texts, batch_size=32, show_progress_bar=False)
        return embeddings.tolist()

    def embed_query(self, query: str) -> List[float]:
        model = self.get_model()
        return model.encode([query])[0].tolist()
