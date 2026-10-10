from app.rag.pipeline import RAGPipeline
import time

print("Initializing pipeline...")
pipeline = RAGPipeline()
repo_id = "fc36e15f-4078-412e-ad63-68a8cbb80cc8"
query = "Where is the Express application initialization implemented?"

print("Running search...")
t0 = time.time()
candidates = pipeline.hybrid_retriever.search(query, repo_id, 20)
print(f"Hybrid search took {time.time() - t0:.2f}s, found {len(candidates)} candidates")

print("Running reranking...")
t0 = time.time()
reranked = pipeline.reranker.rerank(query, candidates, 5)
print(f"Reranking took {time.time() - t0:.2f}s, returned {len(reranked)} chunks")

print("Building prompt and calling LLM...")
context_parts = []
for r in reranked:
    context_parts.append(
        f"--- File: {r.chunk.file_path} | {r.chunk.symbol_type}: {r.chunk.symbol_name} | Lines {r.chunk.start_line}-{r.chunk.end_line} ---\n{r.chunk.source_code}"
    )
context_str = "\n\n".join(context_parts)
from app.rag.prompts import RAG_QUERY_TEMPLATE, RAG_SYSTEM_PROMPT
user_prompt = RAG_QUERY_TEMPLATE.format(query=query, context=context_str)

print("Calling LLM...")
t0 = time.time()
answer = pipeline._call_llm(RAG_SYSTEM_PROMPT, user_prompt)
print(f"LLM call took {time.time() - t0:.2f}s")
print("Done!")
