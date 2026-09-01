from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from app.models.chunk import SourceCitation, SecurityFinding

class IndexRequest(BaseModel):
    repository_id: str
    repo_path: str

class IndexResponse(BaseModel):
    status: str
    total_files: int
    total_chunks: int
    languages: Dict[str, int]
    message: str

class QueryRequest(BaseModel):
    repository_id: str
    query: str
    top_k: int = 5

class QueryResponse(BaseModel):
    answer: str
    sources: List[SourceCitation]
    query: str
    retrieval_scores: Optional[Dict[str, float]] = None

class SecurityAnalysisRequest(BaseModel):
    repository_id: str

class SecurityAnalysisResponse(BaseModel):
    findings: List[SecurityFinding]
    repository_id: str
    total_findings: int
    summary: Dict[str, int]

class HealthResponse(BaseModel):
    status: str
    version: str
    models_loaded: Dict[str, bool]
