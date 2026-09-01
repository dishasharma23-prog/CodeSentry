import uuid
import re
from typing import List
from app.models.chunk import SecurityFinding
from app.rag.pipeline import RAGPipeline
from app.rag.prompts import RAG_SYSTEM_PROMPT, SECURITY_ANALYSIS_PROMPT
from app.retrieval.hybrid_retriever import HybridRetriever
from app.reranking.reranker import CrossEncoderReranker
from app.config.settings import get_settings

class SecurityAnalyzer:
    def __init__(self):
        self.rag = RAGPipeline()
        self.hybrid = HybridRetriever()
        self.reranker = CrossEncoderReranker()
        self.settings = get_settings()
        
    def _parse_findings(self, llm_response: str, repository_id: str) -> List[SecurityFinding]:
        findings = []
        blocks = re.findall(r'\[FINDING\](.*?)\[/FINDING\]', llm_response, re.DOTALL)
        
        for block in blocks:
            try:
                data = {}
                for line in block.strip().split('\n'):
                    if ':' in line:
                        key, val = line.split(':', 1)
                        data[key.strip().lower()] = val.strip()
                        
                severity_map = {
                    'critical': 'critical', 'high': 'high', 'medium': 'medium', 
                    'low': 'low', 'informational': 'informational'
                }
                sev = data.get('severity', 'informational').lower()
                severity = severity_map.get(sev, 'informational')
                
                # Parse lines safely
                lines_str = data.get('lines', '1-1')
                try:
                    parts = lines_str.split('-')
                    start_line = int(parts[0]) if parts else 1
                    end_line = int(parts[1]) if len(parts) > 1 else start_line
                except ValueError:
                    start_line, end_line = 1, 1

                confidence_val = data.get('confidence', 'medium').lower()
                if confidence_val not in ['high', 'medium', 'low']:
                    confidence_val = 'medium'

                findings.append(SecurityFinding(
                    id=str(uuid.uuid4()),
                    severity=severity,
                    title=data.get('title', 'Unknown Issue') or 'Unknown Issue',
                    description=data.get('description', '') or 'No description',
                    category='general',  # simplified
                    file_path=data.get('file', '') or 'Unknown',
                    function_name=data.get('function', None),
                    class_name=None,
                    start_line=start_line,
                    end_line=end_line,
                    evidence=data.get('evidence', '') or 'Not provided',
                    source_code=data.get('source_code', '') or 'Not provided',
                    confidence=confidence_val,
                    recommendation=data.get('recommendation', '') or 'Not provided'
                ))
            except Exception as e:
                pass
                
        return findings

    def analyze(self, repository_id: str) -> List[SecurityFinding]:
        import time
        start_overall = time.time()
        # 1. Broad retrieval for security context
        security_queries = [
            'authentication authorization login credentials keys tokens',
            'input validation sanitization sql injection xss',
            'access control permissions roles admin',
            'file access path traversal io read write',
            'encryption hashing cryptography secure'
        ]
        
        all_candidates = []
        start_ret = time.time()
        for query in security_queries:
            # We use hybrid retrieval to get top relevant chunks for each category
            candidates = self.hybrid.search(query, repository_id, top_k=2) # reduced from 10 to 2
            all_candidates.extend(candidates)
        print(f'Retrieval time: {time.time() - start_ret:.3f}s')
            
        # Deduplicate candidates based on chunk_id
        unique_chunks = {c.chunk.chunk_id: c for c in all_candidates}.values()
        
        # Cross-encoder re-ranking for overall security relevance
        start_rerank = time.time()
        reranked = self.reranker.rerank('security vulnerabilities critical high medium low', list(unique_chunks), top_k=3) # reduced from 15 to 3
        print(f'Rerank time: {time.time() - start_rerank:.3f}s')
        
        context_parts = []
        for r in reranked:
            context_parts.append(
                f'--- File: {r.chunk.file_path} | {r.chunk.symbol_type}: {r.chunk.symbol_name} | Lines {r.chunk.start_line}-{r.chunk.end_line} ---\n{r.chunk.source_code}'
            )
        context_str = '\n\n'.join(context_parts)
        
        user_prompt = SECURITY_ANALYSIS_PROMPT.format(context=context_str)
        
        start_llm = time.time()
        response_text = self.rag._call_llm(RAG_SYSTEM_PROMPT, user_prompt)
        print(f'Gemini analysis time: {time.time() - start_llm:.3f}s')
        
        start_parse = time.time()
        findings = self._parse_findings(response_text, repository_id)
        print(f'Parsing time: {time.time() - start_parse:.3f}s')
        
        # Deduplicate findings
        seen = set()
        unique_findings = []
        for f in findings:
            key = f'{f.title}:{f.file_path}:{f.start_line}'
            if key not in seen:
                seen.add(key)
                unique_findings.append(f)
                
        print(f'Total analysis time: {time.time() - start_overall:.3f}s')
        return unique_findings
