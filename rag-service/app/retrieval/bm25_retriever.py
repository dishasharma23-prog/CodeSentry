import os
import pickle
import re
from typing import List
from rank_bm25 import BM25L
from app.models.chunk import CodeChunk, RetrievalResult
from app.config.settings import get_settings

class BM25Retriever:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(BM25Retriever, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if not getattr(self, '_initialized', False):
            settings = get_settings()
            self.persist_dir = settings.BM25_PERSIST_DIR
            import os
            os.makedirs(self.persist_dir, exist_ok=True)
            self.cache = {}
            self._initialized = True

    def _tokenize(self, text: str) -> List[str]:
        text = text.lower()
        tokens = re.split(r'[\s.,_(){}\[\]:;="\'<>\+\-\*/\\]+', text)
        return [t for t in tokens if len(t) > 1]

    def index(self, chunks: List[CodeChunk], repository_id: str):
        tokenized_corpus = [self._tokenize(c.source_code) for c in chunks]
        bm25 = BM25L(tokenized_corpus)
        
        index_data = {
            'bm25': bm25,
            'chunks': chunks
        }
        
        file_path = os.path.join(self.persist_dir, f"{repository_id}.pkl")
        with open(file_path, 'wb') as f:
            pickle.dump(index_data, f)
            
        self.cache[repository_id] = index_data

    def search(self, query: str, repository_id: str, top_k: int) -> List[RetrievalResult]:
        if repository_id not in self.cache:
            file_path = os.path.join(self.persist_dir, f"{repository_id}.pkl")
            if not os.path.exists(file_path):
                return []
            with open(file_path, 'rb') as f:
                self.cache[repository_id] = pickle.load(f)
                
        index_data = self.cache[repository_id]
        bm25 = index_data['bm25']
        chunks = index_data['chunks']
        
        tokenized_query = self._tokenize(query)
        scores = bm25.get_scores(tokenized_query)
        
        top_indices = scores.argsort()[-top_k:][::-1]
        
        results = []
        for idx in top_indices:
            if scores[idx] > 0:
                results.append(RetrievalResult(
                    chunk=chunks[idx],
                    score=float(scores[idx]),
                    retrieval_method="bm25"
                ))
                
        return results

    def delete_repository(self, repository_id: str):
        if repository_id in self.cache:
            del self.cache[repository_id]
        file_path = os.path.join(self.persist_dir, f"{repository_id}.pkl")
        if os.path.exists(file_path):
            os.remove(file_path)
