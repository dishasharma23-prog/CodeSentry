import importlib
import json
import os
import sys

from app.models.chunk import CodeChunk, RetrievalResult

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "evals"))


def _result(path="auth.py", score=0.5):
    chunk = CodeChunk(
        chunk_id=f"{path}:login", repository_id="r1", file_path=path, language="python",
        symbol_name="login", symbol_type="function", start_line=1, end_line=3,
        source_code="def login(user, pw):\n    ...",
    )
    return RetrievalResult(chunk=chunk, score=score, retrieval_method="hybrid")


def _fresh_observability(monkeypatch, **env):
    for k in ("FI_API_KEY", "FI_SECRET_KEY"):
        monkeypatch.delenv(k, raising=False)
    for k, v in env.items():
        monkeypatch.setenv(k, v)
    from app.config import settings
    settings.get_settings.cache_clear()
    import app.observability as obs
    return importlib.reload(obs)


def test_tracing_is_noop_without_keys(monkeypatch):
    obs = _fresh_observability(monkeypatch)
    assert obs.setup_tracing() is None
    with obs.span("rag_query", "chain", input_value="q") as s:
        assert s is None
    obs.record_documents(None, [_result()])  # must not raise


class _FakeSpan:
    def __init__(self):
        self.attrs = {}

    def set_attribute(self, k, v):
        self.attrs[k] = v


def test_record_documents_uses_future_agi_attribute_names():
    from app.observability import record_documents
    s = _FakeSpan()
    record_documents(s, [_result("a.py", 0.9), _result("b.py", 0.1)])
    assert s.attrs["retrieval.documents.0.document.id"] == "a.py:login"
    assert s.attrs["retrieval.documents.1.document.score"] == 0.1
    assert s.attrs["retrieval.documents.0.document.content"].startswith("def login")
    meta = json.loads(s.attrs["retrieval.documents.0.document.metadata"])
    assert meta["file_path"] == "a.py" and meta["lines"] == "1-3"


def test_citation_check():
    from run_rag_evals import check_citations
    sources = [{"file_path": "auth.py"}]
    ok = "Injectable [SOURCE: auth.py | login | lines 1-3]"
    assert check_citations(ok, sources)["score"] == 1.0
    assert check_citations("No citation here.", sources)["score"] == 0.0
    fake = "Pays the moon [SOURCE: billing.py | pay_moon | lines 1-2]"
    assert check_citations(fake, sources)["score"] == 0.0
