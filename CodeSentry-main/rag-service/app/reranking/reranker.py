from typing import List
from app.models.chunk import RetrievalResult
from app.config.settings import get_settings

class CrossEncoderReranker:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(CrossEncoderReranker, cls).__new__(cls)
        return cls._instance

    def get_model(self):
        if self._model is None:
            from sentence_transformers import CrossEncoder
            settings = get_settings()
            self._model = CrossEncoder(settings.RERANKER_MODEL)
        return self._model

    def rerank(self, query: str, candidates: List[RetrievalResult], top_k: int) -> List[RetrievalResult]:
        if not candidates:
            return []
            
        model = self.get_model()
        pairs = [[query, c.chunk.source_code] for c in candidates]
        scores = model.predict(pairs)
        
        for i, c in enumerate(candidates):
            c.score = float(scores[i])
            c.retrieval_method = "reranked"
            
        candidates.sort(key=lambda x: x.score, reverse=True)
        return candidates[:top_k]
