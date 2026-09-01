import re
from typing import List
from app.models.chunk import RAGResponse, SourceCitation, RetrievalResult
from app.retrieval.hybrid_retriever import HybridRetriever
from app.reranking.reranker import CrossEncoderReranker
from app.config.settings import get_settings
from app.rag.prompts import RAG_SYSTEM_PROMPT, RAG_QUERY_TEMPLATE

class RAGPipeline:
    def __init__(self):
        self.hybrid_retriever = HybridRetriever()
        self.reranker = CrossEncoderReranker()
        self.settings = get_settings()
        
    def _call_llm(self, system_prompt: str, user_prompt: str) -> str:
        if self.settings.LLM_PROVIDER == 'gemini':
            import google.generativeai as genai
            genai.configure(api_key=self.settings.LLM_API_KEY)
            model = genai.GenerativeModel(
                model_name=self.settings.LLM_MODEL,
                system_instruction=system_prompt
            )
            response = model.generate_content(user_prompt)
            return response.text
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

    def _parse_citations(self, answer: str, chunks: List[RetrievalResult]) -> List[SourceCitation]:
        citations = []
        cited_files = set()
        
        matches = re.finditer(r'\[SOURCE:\s*(.*?)\s*\|\s*(.*?)\s*\|\s*lines\s*(\d+)-(\d+)\]', answer)
        for match in matches:
            file_path, func_name, start, end = match.groups()
            for res in chunks:
                if res.chunk.file_path == file_path:
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
            if res.chunk.file_path not in cited_files:
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
        import time
        start_ret = time.time()
        candidates = self.hybrid_retriever.search(question, repository_id, self.settings.TOP_K_RETRIEVAL)
        print(f"Hybrid Retriever time: {time.time() - start_ret:.3f}s")
        
        start_rerank = time.time()
        reranked = self.reranker.rerank(question, candidates, self.settings.TOP_K_RERANK)
        print(f"Reranker time: {time.time() - start_rerank:.3f}s")
        
        context_parts = []
        for r in reranked:
            context_parts.append(
                f"--- File: {r.chunk.file_path} | {r.chunk.symbol_type}: {r.chunk.symbol_name} | Lines {r.chunk.start_line}-{r.chunk.end_line} ---\n{r.chunk.source_code}"
            )
        context_str = "\n\n".join(context_parts)
        
        user_prompt = RAG_QUERY_TEMPLATE.format(query=question, context=context_str)
        
        start_llm = time.time()
        answer = self._call_llm(RAG_SYSTEM_PROMPT, user_prompt)
        print(f"Gemini time: {time.time() - start_llm:.3f}s")
        
        start_parse = time.time()
        sources = self._parse_citations(answer, reranked)
        print(f"Parsing time: {time.time() - start_parse:.3f}s")
        
        return RAGResponse(
            answer=answer,
            sources=sources,
            query=question
        )
