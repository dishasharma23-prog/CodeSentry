from fastapi import APIRouter, HTTPException, Depends
from app.api.schemas import (
    IndexRequest, IndexResponse, QueryRequest, QueryResponse, 
    SecurityAnalysisRequest, SecurityAnalysisResponse, HealthResponse
)
from app.ingestion.ingestor import CodeIngestor
from app.embeddings.embedder import CodeEmbedder
from app.retrieval.dense_retriever import DenseRetriever
from app.retrieval.bm25_retriever import BM25Retriever
from app.rag.pipeline import RAGPipeline
from app.security.analyzer import SecurityAnalyzer

router = APIRouter()

def get_ingestor(): return CodeIngestor()
def get_embedder(): return CodeEmbedder()
def get_dense_retriever(): return DenseRetriever()
def get_bm25_retriever(): return BM25Retriever()
def get_rag_pipeline(): return RAGPipeline()
def get_security_analyzer(): return SecurityAnalyzer()

@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="ok",
        version="1.0.0",
        models_loaded={"sentence-transformers": True, "cross-encoder": True}
    )

@router.post("/index", response_model=IndexResponse)
async def index_repository(
    req: IndexRequest,
    ingestor: CodeIngestor = Depends(get_ingestor),
    embedder: CodeEmbedder = Depends(get_embedder),
    dense: DenseRetriever = Depends(get_dense_retriever),
    bm25: BM25Retriever = Depends(get_bm25_retriever)
):
    try:
        chunks, stats = ingestor.ingest(req.repo_path, req.repository_id)
        if not chunks:
            return IndexResponse(
                status="warning", total_files=stats["total_files"], total_chunks=0,
                languages=stats["languages"], message="No processable code found"
            )
            
        embeddings = embedder.embed_chunks(chunks)
        dense.index(chunks, embeddings, req.repository_id)
        bm25.index(chunks, req.repository_id)
        
        return IndexResponse(
            status="success",
            total_files=stats["parsed_files"],
            total_chunks=stats["total_chunks"],
            languages=stats["languages"],
            message="Indexing complete"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query", response_model=QueryResponse)
async def query_repository(
    req: QueryRequest,
    rag: RAGPipeline = Depends(get_rag_pipeline)
):
    try:
        resp = rag.query(req.query, req.repository_id)
        return QueryResponse(
            answer=resp.answer,
            sources=resp.sources,
            query=resp.query,
            retrieval_scores=resp.retrieval_scores
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/security-analysis", response_model=SecurityAnalysisResponse)
async def analyze_security(
    req: SecurityAnalysisRequest,
    analyzer: SecurityAnalyzer = Depends(get_security_analyzer)
):
    try:
        findings = analyzer.analyze(req.repository_id)
        summary = {"critical": 0, "high": 0, "medium": 0, "low": 0, "informational": 0}
        for f in findings:
            if f.severity in summary:
                summary[f.severity] += 1
                
        return SecurityAnalysisResponse(
            findings=findings,
            repository_id=req.repository_id,
            total_findings=len(findings),
            summary=summary
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
