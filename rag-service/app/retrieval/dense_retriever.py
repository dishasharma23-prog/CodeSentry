import chromadb
from chromadb.config import Settings
from typing import List
from app.models.chunk import CodeChunk, RetrievalResult
from app.config.settings import get_settings

class DenseRetriever:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DenseRetriever, cls).__new__(cls)
            cls._instance.client = None
        return cls._instance

    def __init__(self):
        if getattr(self, 'client', None) is None:
            settings = get_settings()
            import chromadb
            self.client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)

    def index(self, chunks: List[CodeChunk], embeddings: List[List[float]], repository_id: str):
        collection_name = f"repo_{repository_id}".replace("-", "_")
        
        try:
            collection = self.client.get_collection(name=collection_name)
            self.client.delete_collection(name=collection_name)
        except Exception:
            pass
            
        collection = self.client.create_collection(name=collection_name)
        
        ids = [c.chunk_id for c in chunks]
        documents = [c.source_code for c in chunks]
        metadatas = []
        for c in chunks:
            meta = {
                "repository_id": c.repository_id,
                "file_path": c.file_path,
                "language": c.language,
                "symbol_name": c.symbol_name,
                "symbol_type": c.symbol_type,
                "start_line": c.start_line,
                "end_line": c.end_line
            }
            if c.class_name: meta["class_name"] = c.class_name
            if c.function_name: meta["function_name"] = c.function_name
            if c.docstring: meta["docstring"] = c.docstring[:500] 
            metadatas.append(meta)

        batch_size = 5000
        for i in range(0, len(ids), batch_size):
            collection.add(
                ids=ids[i:i+batch_size],
                embeddings=embeddings[i:i+batch_size],
                metadatas=metadatas[i:i+batch_size],
                documents=documents[i:i+batch_size]
            )

    def search(self, query_embedding: List[float], repository_id: str, top_k: int) -> List[RetrievalResult]:
        collection_name = f"repo_{repository_id}".replace("-", "_")
        try:
            collection = self.client.get_collection(name=collection_name)
        except Exception:
            return []

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k
        )

        retrieval_results = []
        if results and results["ids"] and len(results["ids"]) > 0:
            for i in range(len(results["ids"][0])):
                chunk_id = results["ids"][0][i]
                meta = results["metadatas"][0][i]
                doc = results["documents"][0][i]
                dist = results["distances"][0][i] if "distances" in results and results["distances"] else 0.0
                
                chunk = CodeChunk(
                    chunk_id=chunk_id,
                    repository_id=meta["repository_id"],
                    file_path=meta["file_path"],
                    language=meta["language"],
                    symbol_name=meta["symbol_name"],
                    symbol_type=meta["symbol_type"],
                    class_name=meta.get("class_name"),
                    function_name=meta.get("function_name"),
                    start_line=meta["start_line"],
                    end_line=meta["end_line"],
                    source_code=doc,
                    docstring=meta.get("docstring")
                )
                
                score = 1.0 / (1.0 + dist)
                
                retrieval_results.append(RetrievalResult(
                    chunk=chunk,
                    score=score,
                    retrieval_method="dense"
                ))

        return retrieval_results

    def delete_repository(self, repository_id: str):
        collection_name = f"repo_{repository_id}".replace("-", "_")
        try:
            self.client.delete_collection(name=collection_name)
        except Exception:
            pass
