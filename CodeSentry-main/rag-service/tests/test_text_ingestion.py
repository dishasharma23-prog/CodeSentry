import pytest
import os
import tempfile
from app.ingestion.ingestor import CodeIngestor
from app.models.chunk import CodeChunk
from app.retrieval.dense_retriever import DenseRetriever
from app.retrieval.bm25_retriever import BM25Retriever
from app.embeddings.embedder import CodeEmbedder
from app.rag.pipeline import RAGPipeline
from app.config.settings import get_settings

def test_document_only_repository():
    """
    TEST 1: A minimal repository containing only README should produce chunks and be retrievable.
    """
    settings = get_settings()
    repo_id = "doc_only_repo_123"
    
    with tempfile.TemporaryDirectory() as temp_dir:
        # Create a dummy README file without an extension
        readme_path = os.path.join(temp_dir, "README")
        readme_content = "# Hello World\n\nThis is a minimal repository.\nIt contains no source code, only documentation."
        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(readme_content)
            
        # Ingest
        ingestor = CodeIngestor()
        chunks, stats = ingestor.ingest(temp_dir, repo_id)
        
        # Verify ingestion
        assert stats['total_files'] == 1
        assert stats['parsed_files'] == 1
        assert len(chunks) == 1
        
        chunk = chunks[0]
        assert chunk.repository_id == repo_id
        assert chunk.file_path == "README"
        assert chunk.symbol_type == "document"
        assert chunk.source_code == readme_content
        
        # Index
        embedder = CodeEmbedder()
        embeddings = embedder.embed_chunks(chunks)
        dense = DenseRetriever()
        dense.index(chunks, embeddings, repo_id)
        bm25 = BM25Retriever()
        bm25.index(chunks, repo_id)
        
        # Retrieve via RAGPipeline
        pipeline = RAGPipeline()
        question = "What files are present in this repository and what does each file contain?"
        
        candidates = pipeline.hybrid_retriever.search(question, repo_id, top_k=5)
        assert len(candidates) > 0
        
        # Check Isolation Filter
        reranked = pipeline.reranker.rerank(question, candidates, top_k=5)
        valid_reranked = [r for r in reranked if r.chunk.repository_id == repo_id]
        
        assert len(valid_reranked) > 0
        assert valid_reranked[0].chunk.file_path == "README"
        assert "Hello World" in valid_reranked[0].chunk.source_code


def test_mixed_repository():
    """
    TEST 3: Mixed repository containing supported source code + README.
    """
    repo_id = "mixed_repo_123"
    
    with tempfile.TemporaryDirectory() as temp_dir:
        readme_path = os.path.join(temp_dir, "README.md")
        readme_content = "# Project\n\nDoc file."
        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(readme_content)
            
        src_path = os.path.join(temp_dir, "main.py")
        src_content = "def hello():\n    return 'world'\n"
        with open(src_path, "w", encoding="utf-8") as f:
            f.write(src_content)
            
        # Ingest
        ingestor = CodeIngestor()
        chunks, stats = ingestor.ingest(temp_dir, repo_id)
        
        assert stats['parsed_files'] == 2
        
        # Verify AST parsing for python
        py_chunks = [c for c in chunks if c.file_path == "main.py"]
        assert len(py_chunks) > 0
        assert py_chunks[0].symbol_type == "function"
        assert py_chunks[0].symbol_name == "hello"
        
        # Verify Generic parsing for text
        md_chunks = [c for c in chunks if c.file_path == "README.md"]
        assert len(md_chunks) > 0
        assert md_chunks[0].symbol_type == "document"
        assert md_chunks[0].symbol_name == "README.md"
