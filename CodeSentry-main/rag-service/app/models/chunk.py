from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class CodeChunk(BaseModel):
    chunk_id: str
    repository_id: str
    file_path: str
    language: str
    symbol_name: str
    symbol_type: str
    class_name: Optional[str] = None
    function_name: Optional[str] = None
    start_line: int
    end_line: int
    source_code: str
    docstring: Optional[str] = None

class RetrievalResult(BaseModel):
    chunk: CodeChunk
    score: float
    retrieval_method: str

class SourceCitation(BaseModel):
    file_path: str
    symbol_name: str
    symbol_type: str
    start_line: int
    end_line: int
    source_code: str
    relevance_score: float

class RAGResponse(BaseModel):
    answer: str
    sources: List[SourceCitation]
    query: str
    retrieval_scores: Optional[Dict[str, float]] = None

class SecurityFinding(BaseModel):
    id: str
    severity: str
    title: str
    description: str
    category: str
    file_path: str
    function_name: Optional[str] = None
    class_name: Optional[str] = None
    start_line: int
    end_line: int
    evidence: str
    source_code: str
    confidence: str
    recommendation: str
