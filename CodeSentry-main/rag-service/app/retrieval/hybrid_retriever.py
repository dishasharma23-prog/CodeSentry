from typing import List, Dict
from app.models.chunk import RetrievalResult
from app.retrieval.bm25_retriever import BM25Retriever
from app.retrieval.dense_retriever import DenseRetriever
from app.embeddings.embedder import CodeEmbedder
from app.config.settings import get_settings

class HybridRetriever:
    def __init__(self):
        self.bm25_retriever = BM25Retriever()
        self.dense_retriever = DenseRetriever()
        self.embedder = CodeEmbedder()
        self.settings = get_settings()

    def search(self, query: str, repository_id: str, top_k: int) -> List[RetrievalResult]:
        import time
        start = time.time()
        bm25_results = self.bm25_retriever.search(query, repository_id, top_k * 2)
        print(f"BM25 time: {time.time() - start:.3f}s")
        
        start_embed = time.time()
        query_embedding = self.embedder.embed_query(query)
        print(f"Embed time: {time.time() - start_embed:.3f}s")
        
        start_dense = time.time()
        dense_results = self.dense_retriever.search(query_embedding, repository_id, top_k * 2)
        print(f"Dense time: {time.time() - start_dense:.3f}s")
        
        start_fusion = time.time()
        rrf_scores: Dict[str, float] = {}
        chunk_map = {}
        
        k = self.settings.RRF_K
        
        for rank, res in enumerate(bm25_results):
            chunk_id = res.chunk.chunk_id
            chunk_map[chunk_id] = res.chunk
            rrf_scores[chunk_id] = rrf_scores.get(chunk_id, 0.0) + 1.0 / (k + rank + 1)
            
        for rank, res in enumerate(dense_results):
            chunk_id = res.chunk.chunk_id
            chunk_map[chunk_id] = res.chunk
            rrf_scores[chunk_id] = rrf_scores.get(chunk_id, 0.0) + 1.0 / (k + rank + 1)
            
        sorted_chunks = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)
        
        final_results = []
        for chunk_id, score in sorted_chunks[:top_k]:
            final_results.append(RetrievalResult(
                chunk=chunk_map[chunk_id],
                score=score,
                retrieval_method="hybrid"
            ))
        print(f"Fusion time: {time.time() - start_fusion:.3f}s")
        return final_results
