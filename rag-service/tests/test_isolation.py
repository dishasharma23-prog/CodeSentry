import pytest
from app.models.chunk import CodeChunk
from app.retrieval.dense_retriever import DenseRetriever
from app.retrieval.bm25_retriever import BM25Retriever
from app.embeddings.embedder import CodeEmbedder
from app.config.settings import get_settings

def test_repository_isolation():
    settings = get_settings()
    
    dense = DenseRetriever()
    bm25 = BM25Retriever()
    embedder = CodeEmbedder()
    
    # Create chunks for Repo A
    chunk_a = CodeChunk(
        chunk_id="A_1",
        repository_id="repo_A",
        file_path="secret.py",
        language="python",
        symbol_name="module",
        symbol_type="module",
        start_line=1,
        end_line=2,
        source_code="def get_secret():\n    return 'AAA_UNIQUE_SECRET'"
    )
    
    # Create chunks for Repo B
    chunk_b = CodeChunk(
        chunk_id="B_1",
        repository_id="repo_B",
        file_path="secret.py",
        language="python",
        symbol_name="module",
        symbol_type="module",
        start_line=1,
        end_line=2,
        source_code="def get_secret():\n    return 'BBB_UNIQUE_SECRET'"
    )
    
    # Index Repo A
    emb_a = embedder.embed_chunks([chunk_a])
    dense.index([chunk_a], emb_a, "repo_A")
    bm25.index([chunk_a], "repo_A")
    
    # Index Repo B
    emb_b = embedder.embed_chunks([chunk_b])
    dense.index([chunk_b], emb_b, "repo_B")
    bm25.index([chunk_b], "repo_B")
    
    # Query Repo A for 'SECRET'
    query_text = "What is the secret?"
    query_emb = embedder.embed_query(query_text)
    
    dense_res_a = dense.search(query_emb, "repo_A", 10)
    bm25_res_a = bm25.search(query_text, "repo_A", 10)
    
    # Verify no BBB in Repo A
    for r in dense_res_a:
        assert r.chunk.repository_id == "repo_A", f"Dense contamination: got {r.chunk.repository_id}"
        assert 'AAA' in r.chunk.source_code
        
    for r in bm25_res_a:
        assert r.chunk.repository_id == "repo_A", f"BM25 contamination: got {r.chunk.repository_id}"
        assert 'AAA' in r.chunk.source_code
        
    # Query Repo B
    dense_res_b = dense.search(query_emb, "repo_B", 10)
    bm25_res_b = bm25.search(query_text, "repo_B", 10)
    
    for r in dense_res_b:
        assert r.chunk.repository_id == "repo_B", f"Dense contamination: got {r.chunk.repository_id}"
        assert 'BBB' in r.chunk.source_code
        
    for r in bm25_res_b:
        assert r.chunk.repository_id == "repo_B", f"BM25 contamination: got {r.chunk.repository_id}"
        assert 'BBB' in r.chunk.source_code
        
    print("Isolation test passed!")

if __name__ == "__main__":
    test_repository_isolation()
