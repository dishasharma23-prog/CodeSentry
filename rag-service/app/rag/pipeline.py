import logging
import re
import time
from typing import List
from app.models.chunk import RAGResponse, SourceCitation, RetrievalResult
from app.retrieval.hybrid_retriever import HybridRetriever
from app.reranking.reranker import CrossEncoderReranker
from app.config.settings import get_settings
from app.rag.prompts import RAG_SYSTEM_PROMPT, RAG_QUERY_TEMPLATE
from app.observability import span, record_documents

logger = logging.getLogger(__name__)

class RAGPipeline:
    def __init__(self):
        self.hybrid_retriever = HybridRetriever()
        self.reranker = CrossEncoderReranker()
        self.settings = get_settings()
        
    def _call_llm(self, system_prompt: str, user_prompt: str) -> str:
        if self.settings.LLM_PROVIDER == 'gemini':
            # google-genai is Google's current SDK (google-generativeai is deprecated)
            # and is the one Future AGI's traceAI instrumentor hooks into.
            from google import genai
            from google.genai import types
            client = genai.Client(api_key=self.settings.LLM_API_KEY)
            response = client.models.generate_content(
                model=self.settings.LLM_MODEL,
                contents=user_prompt,
                config=types.GenerateContentConfig(system_instruction=system_prompt),
            )
            return response.text or ""
        elif self.settings.LLM_PROVIDER == 'openai':
            from openai import OpenAI
            client = OpenAI(api_key=self.settings.LLM_API_KEY)
            response = client.chat.completions.create(
                model=self.settings.LLM_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            )
            return response.choices[0].message.content
        return "Unsupported LLM provider"

    def _parse_citations(self, answer: str, chunks: List[RetrievalResult], repository_id: str) -> List[SourceCitation]:
        citations = []
        cited_files = set()
        
        matches = re.finditer(r'\[SOURCE:\s*(.*?)\s*\|\s*(.*?)\s*\|\s*lines\s*(\d+)-(\d+)\]', answer)
        for match in matches:
            file_path, func_name, start, end = match.groups()
            for res in chunks:
                if res.chunk.file_path == file_path and res.chunk.repository_id == repository_id:
                    citations.append(SourceCitation(
                        file_path=res.chunk.file_path,
                        symbol_name=res.chunk.symbol_name,
                        symbol_type=res.chunk.symbol_type,
                        start_line=res.chunk.start_line,
                        end_line=res.chunk.end_line,
                        source_code=res.chunk.source_code,
                        relevance_score=res.score
                    ))
                    cited_files.add(res.chunk.file_path)
                    break
                    
        for res in chunks:
            if res.chunk.file_path not in cited_files and res.chunk.repository_id == repository_id:
                citations.append(SourceCitation(
                    file_path=res.chunk.file_path,
                    symbol_name=res.chunk.symbol_name,
                    symbol_type=res.chunk.symbol_type,
                    start_line=res.chunk.start_line,
                    end_line=res.chunk.end_line,
                    source_code=res.chunk.source_code,
                    relevance_score=res.score
                ))
                cited_files.add(res.chunk.file_path)
                
        return citations

    def query(self, question: str, repository_id: str) -> RAGResponse:
        # Each stage is a span when Future AGI tracing is on (see app/observability.py),
        # so per-stage timings live in the trace; debug logs keep them visible locally.
        with span("rag_query", "chain", input_value=question) as root:
            if root:
                root.set_attribute("codesentry.repository_id", repository_id)

            start = time.time()
            with span("hybrid_retrieval", "retriever", input_value=question) as s:
                candidates = self.hybrid_retriever.search(question, repository_id, self.settings.TOP_K_RETRIEVAL)
                # Record now: the reranker overwrites these results' scores in place.
                record_documents(s, candidates)
            logger.debug("Hybrid retrieval time: %.3fs", time.time() - start)

            start = time.time()
            with span("cross_encoder_rerank", "reranker", input_value=question) as s:
                reranked = self.reranker.rerank(question, candidates, self.settings.TOP_K_RERANK)
                if s:
                    s.set_attribute("reranker.model_name", self.settings.RERANKER_MODEL)
                    s.set_attribute("reranker.top_k", self.settings.TOP_K_RERANK)
                record_documents(s, reranked, prefix="reranker.output_documents")
            logger.debug("Rerank time: %.3fs", time.time() - start)

            # DEFENSIVE VALIDATION
            valid_reranked = []
            for r in reranked:
                if r.chunk.repository_id == repository_id:
                    valid_reranked.append(r)
                else:
                    logger.warning(f"CRITICAL CONTAMINATION: Chunk from repo {r.chunk.repository_id} found in query for {repository_id}. Discarding.")
            reranked = valid_reranked

            context_parts = []
            for r in reranked:
                context_parts.append(
                    f"--- File: {r.chunk.file_path} | {r.chunk.symbol_type}: {r.chunk.symbol_name} | Lines {r.chunk.start_line}-{r.chunk.end_line} ---\n{r.chunk.source_code}"
                )
            context_str = "\n\n".join(context_parts)

            user_prompt = RAG_QUERY_TEMPLATE.format(query=question, context=context_str)

            start = time.time()
            answer = self._call_llm(RAG_SYSTEM_PROMPT, user_prompt)
            logger.debug("LLM time: %.3fs", time.time() - start)

            sources = self._parse_citations(answer, reranked, repository_id)

            if root:
                root.set_attribute("output.value", answer)
                root.set_attribute("codesentry.citation_count", len(sources))

            return RAGResponse(
                answer=answer,
                sources=sources,
                query=question
            )
