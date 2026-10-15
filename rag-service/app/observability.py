"""Optional Future AGI tracing for the RAG service.

Tracing turns on only when FI_API_KEY and FI_SECRET_KEY are configured. Without
them every helper here is a no-op, so the service behaves exactly as before.

What gets traced when enabled:
- every Gemini / OpenAI call (automatic, via traceAI instrumentors)
- one "rag_query" span per question, with child spans for hybrid retrieval
  and cross-encoder reranking, including the chunks each stage returned
"""
import json
import logging
import os
from contextlib import contextmanager
from typing import Iterator, List, Optional

from app.config.settings import get_settings
from app.models.chunk import RetrievalResult

logger = logging.getLogger(__name__)

_tracer = None
_initialised = False


def setup_tracing():
    """Register the Future AGI tracer once. Returns the tracer, or None if disabled."""
    global _tracer, _initialised
    if _initialised:
        return _tracer
    _initialised = True

    settings = get_settings()
    if not (settings.FI_API_KEY and settings.FI_SECRET_KEY):
        logger.info("Future AGI tracing disabled (FI_API_KEY / FI_SECRET_KEY not set)")
        return None

    # fi_instrumentation reads its credentials from the process environment,
    # while our settings may have come from a .env file. Bridge the two.
    os.environ.setdefault("FI_API_KEY", settings.FI_API_KEY)
    os.environ.setdefault("FI_SECRET_KEY", settings.FI_SECRET_KEY)

    try:
        from fi_instrumentation import FITracer, register
        from fi_instrumentation.fi_types import ProjectType
        from traceai_google_genai import GoogleGenAIInstrumentor
        from traceai_openai import OpenAIInstrumentor

        provider = register(
            project_name=settings.FI_PROJECT_NAME,
            project_type=ProjectType.OBSERVE,
            verbose=False,
        )
        GoogleGenAIInstrumentor().instrument(tracer_provider=provider)
        OpenAIInstrumentor().instrument(tracer_provider=provider)
        _tracer = FITracer(provider.get_tracer(__name__))
        logger.info("Future AGI tracing enabled for project '%s'", settings.FI_PROJECT_NAME)
    except Exception:  # tracing must never take the service down
        logger.exception("Could not enable Future AGI tracing; continuing without it")
        _tracer = None
    return _tracer


@contextmanager
def span(name: str, kind: str, input_value: Optional[str] = None) -> Iterator[Optional[object]]:
    """Open a span of the given Future AGI kind ("chain", "retriever", "reranker", ...).

    Yields the span, or None when tracing is off, so callers can do:
        with span("x", "chain") as s:
            if s: s.set_attribute(...)
    """
    tracer = setup_tracing()
    if tracer is None:
        yield None
        return
    with tracer.start_as_current_span(name, fi_span_kind=kind) as s:
        if input_value is not None:
            s.set_attribute("input.value", input_value)
        yield s


def record_documents(s, results: List[RetrievalResult], prefix: str = "retrieval.documents") -> None:
    """Attach retrieved chunks to a span using Future AGI's document attribute names."""
    if s is None:
        return
    for i, r in enumerate(results):
        c = r.chunk
        base = f"{prefix}.{i}.document"
        s.set_attribute(f"{base}.id", c.chunk_id)
        s.set_attribute(f"{base}.score", float(r.score))
        s.set_attribute(f"{base}.content", c.source_code)
        s.set_attribute(
            f"{base}.metadata",
            json.dumps({
                "file_path": c.file_path,
                "symbol": f"{c.symbol_type}:{c.symbol_name}",
                "lines": f"{c.start_line}-{c.end_line}",
                "retrieval_method": r.retrieval_method,
            }),
        )
