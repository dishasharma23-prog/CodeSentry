from fastapi import APIRouter, HTTPException, Depends
from app.api.schemas import (
    IndexRequest, IndexResponse, QueryRequest, QueryResponse, 
    SecurityAnalysisRequest, SecurityAnalysisResponse, HealthResponse,
    DeleteRequest, DeleteResponse
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

@router.api_route("/health", methods=["GET", "HEAD"], response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="ok",
        version="1.0.0",
        models_loaded={"sentence-transformers": True, "cross-encoder": True}
    )

import os
import io
import shutil
import logging
import subprocess
import urllib.request
import zipfile
from app.config.settings import get_settings

logger = logging.getLogger(__name__)

def ensure_repo_cloned(repository_id: str, repo_url: str) -> str:
    settings = get_settings()
    base_storage = settings.REPO_STORAGE_PATH
    try:
        os.makedirs(base_storage, exist_ok=True)
    except OSError:
        base_storage = os.path.join(os.getcwd(), "data", "repos")
        os.makedirs(base_storage, exist_ok=True)

    target_dir = os.path.abspath(os.path.join(base_storage, repository_id))
    if os.path.isdir(target_dir) and any(os.scandir(target_dir)):
        return target_dir

    os.makedirs(target_dir, exist_ok=True)

    # 1. Attempt git clone first
    try:
        logger.info("Attempting git clone for %s into %s", repo_url, target_dir)
        res = subprocess.run(["git", "clone", "--depth", "1", repo_url, target_dir], capture_output=True, text=True, timeout=120)
        if res.returncode == 0 and any(os.scandir(target_dir)):
            logger.info("Successfully cloned %s", repo_url)
            return target_dir
    except Exception as e:
        logger.warning("git clone failed: %s, falling back to archive download", e)

    # 2. Fallback: Download archive via urllib (works without git CLI)
    clean_url = repo_url.rstrip("/").removesuffix(".git")
    zip_url = f"{clean_url}/archive/HEAD.zip"
    logger.info("Downloading repository archive from %s", zip_url)
    req = urllib.request.Request(zip_url, headers={"User-Agent": "CodeSentry-Ingestor"})
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            with zipfile.ZipFile(io.BytesIO(resp.read())) as z:
                extract_tmp = os.path.join(base_storage, f"{repository_id}_tmp")
                os.makedirs(extract_tmp, exist_ok=True)
                z.extractall(extract_tmp)
                items = os.listdir(extract_tmp)
                if len(items) == 1 and os.path.isdir(os.path.join(extract_tmp, items[0])):
                    inner = os.path.join(extract_tmp, items[0])
                    for sub in os.listdir(inner):
                        shutil.move(os.path.join(inner, sub), os.path.join(target_dir, sub))
                else:
                    for sub in items:
                        shutil.move(os.path.join(extract_tmp, sub), os.path.join(target_dir, sub))
                shutil.rmtree(extract_tmp, ignore_errors=True)
        return target_dir
    except Exception as e:
        logger.error("Failed to download repository zip from %s: %s", zip_url, e)
        raise RuntimeError(f"Could not clone or download repository from {repo_url}: {e}")

@router.post("/index", response_model=IndexResponse)
async def index_repository(
    req: IndexRequest,
    ingestor: CodeIngestor = Depends(get_ingestor),
    embedder: CodeEmbedder = Depends(get_embedder),
    dense: DenseRetriever = Depends(get_dense_retriever),
    bm25: BM25Retriever = Depends(get_bm25_retriever)
):
    try:
        repo_path = req.repo_path
        # If repo_path is not present or empty on this machine, clone/download using repo_url
        if (not repo_path or not os.path.exists(repo_path)) and req.repo_url:
            repo_path = ensure_repo_cloned(req.repository_id, req.repo_url)

        if not repo_path or not os.path.exists(repo_path):
            raise HTTPException(status_code=400, detail="Repository path not found and no valid repo_url provided")

        chunks, stats = ingestor.ingest(repo_path, req.repository_id)
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
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
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

@router.post("/delete", response_model=DeleteResponse)
async def delete_repository(
    req: DeleteRequest,
    dense: DenseRetriever = Depends(get_dense_retriever),
    bm25: BM25Retriever = Depends(get_bm25_retriever)
):
    try:
        dense.delete_repository(req.repository_id)
        bm25.delete_repository(req.repository_id)
        
        return DeleteResponse(
            status="success",
            message=f"Deleted index data for repository {req.repository_id}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
