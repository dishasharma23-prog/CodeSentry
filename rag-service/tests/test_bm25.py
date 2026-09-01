import pytest
from app.retrieval.bm25_retriever import BM25Retriever
from app.models.chunk import CodeChunk
import os
import shutil

@pytest.fixture
def bm25_retriever():
    from app.config.settings import get_settings
    settings = get_settings()
    os.makedirs(settings.BM25_PERSIST_DIR, exist_ok=True)
    yield BM25Retriever()

def test_bm25_retrieval(bm25_retriever):
    chunks = [
        CodeChunk(
            chunk_id="1", repository_id="repo1", file_path="auth.py", language="python",
            symbol_name="login", symbol_type="function", start_line=1, end_line=5,
            source_code="def login(username, password):\n  return verify(username, password)"
        ),
        CodeChunk(
            chunk_id="2", repository_id="repo1", file_path="perm.py", language="python",
            symbol_name="check_perm", symbol_type="function", start_line=1, end_line=5,
            source_code="def check_perm(user, action):\n  return user.role == 'admin'"
        )
    ]
    
    bm25_retriever.index(chunks, "repo1")
    
    res1 = bm25_retriever.search("authentication login", "repo1", 5)
    assert res1[0].chunk.chunk_id == "1"
    
    res2 = bm25_retriever.search("permission admin", "repo1", 5)
    assert res2[0].chunk.chunk_id == "2"
