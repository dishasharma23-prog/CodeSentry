import os
import sys
from dotenv import load_dotenv

sys.path.append(os.getcwd())
load_dotenv('../.env')

from app.ingestion.ingestor import CodeIngestor
from app.embeddings.embedder import CodeEmbedder
from app.retrieval.dense_retriever import DenseRetriever
from app.retrieval.bm25_retriever import BM25Retriever
from app.rag.pipeline import RAGPipeline
from app.rag.prompts import RAG_SYSTEM_PROMPT, RAG_QUERY_TEMPLATE

def debug():
    # 1. Ingest Hello-World to ensure it's in the DB
    repo_path = "../backend/data/repos/14b9820e-f7a7-43bc-84df-083c4ff72ce3"
    repo_id = "hello_world_debug"
    
    print("--- 1. INGESTION ---")
    ingestor = CodeIngestor()
    chunks, stats = ingestor.ingest(repo_path, repo_id)
    print(f"Ingestion stats: {stats}")
    print(f"Chunks generated: {len(chunks)}")
    for c in chunks:
        print(f" - Chunk file: {c.file_path}, type: {c.symbol_type}, name: {c.symbol_name}")
        
    print("\n--- 2. INDEXING ---")
    if chunks:
        embedder = CodeEmbedder()
        embeddings = embedder.embed_chunks(chunks)
        dense = DenseRetriever()
        dense.index(chunks, embeddings, repo_id)
        
        bm25 = BM25Retriever()
        bm25.index(chunks, repo_id)
        print("Indexing completed.")
    else:
        print("No chunks to index.")
        
    print("\n--- 3. RETRIEVAL (BEFORE RERANKING) ---")
    pipeline = RAGPipeline()
    question = "What files are present in this repository and what does each file contain?"
    candidates = pipeline.hybrid_retriever.search(question, repo_id, pipeline.settings.TOP_K_RETRIEVAL)
    print(f"Retrieved candidates count: {len(candidates)}")
    for i, c in enumerate(candidates):
        print(f"Candidate {i+1}:")
        print(f"  file_path: {c.chunk.file_path}")
        print(f"  repository_id: {c.chunk.repository_id}")
        print(f"  symbol: {c.chunk.symbol_name}")
        print(f"  score: {c.score}")
        print(f"  preview: {repr(c.chunk.source_code[:100])}...")
        
    print("\n--- 4. RERANKING ---")
    reranked = pipeline.reranker.rerank(question, candidates, pipeline.settings.TOP_K_RERANK)
    print(f"Reranked count: {len(reranked)}")
    
    # Simulate pipeline isolation filter
    valid_reranked = []
    for r in reranked:
        if r.chunk.repository_id == repo_id:
            valid_reranked.append(r)
    
    print(f"Valid reranked count (after isolation filter): {len(valid_reranked)}")
    
    print("\n--- 5. FINAL GEMINI CONTEXT ---")
    context_parts = []
    for r in valid_reranked:
        context_parts.append(
            f"--- File: {r.chunk.file_path} | {r.chunk.symbol_type}: {r.chunk.symbol_name} | Lines {r.chunk.start_line}-{r.chunk.end_line} ---\n{r.chunk.source_code}"
        )
    context_str = "\n\n".join(context_parts)
    print("================== CONTEXT STRING ==================")
    print(context_str if context_str else "<EMPTY CONTEXT>")
    print("====================================================")
    
    print("\n--- 6. SYSTEM PROMPT ---")
    print(RAG_SYSTEM_PROMPT[:500] + "... (truncated)")
    
    user_prompt = RAG_QUERY_TEMPLATE.format(query=question, context=context_str)
    print("\n--- 7. USER PROMPT ---")
    print(user_prompt)

if __name__ == '__main__':
    debug()
